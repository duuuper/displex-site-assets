#!/usr/bin/env python3
"""
Displex: выгрузка данных для сайта apple-displex.ru → https://displex.su/site/*.json

Только ЧТЕНИЕ данных ботов, ботов не трогает:
  used.json   ← /opt/displex-usedbot/data/state.json  (опубликованные б/у)
  new.json    ← /opt/displex-pricebot/data/pricebot.db через newtech.load_prices() (розница, наценка уже в цене)
  repair.json ← лист «Сайт_Ремонт» публичной таблицы (gviz CSV)

Белый список полей: в JSON НЕ попадают IMEI/SN, ФИО, номер заказа, заметки CRM, закупочные цены и строки источника.
Запуск: systemd-таймер раз в 2 минуты (venv usedbot).
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

USED_DIR = Path("/opt/displex-usedbot")
OUT = USED_DIR / "public" / "site"
STATE = USED_DIR / "data" / "state.json"
PUBLIC_URL = "https://displex.su"

REPAIR_SHEET_ID = "1KmS3Z3HDfsBMgsD8eL148tdp_gS2BE-d4OmBWZJdu00"
REPAIR_SHEET = "Сайт_Ремонт"

sys.path.insert(0, str(USED_DIR))
import config  # noqa: E402  (usedbot: BRANCHES, CONDITIONS)

BRANCHES = [{"id": i, "name": n, "hint": h, "phone": t} for i, (n, h, t) in enumerate(config.BRANCHES)]


def write_json(name: str, data: dict) -> None:
    """Атомарная запись: временный файл с точкой (Caddy его не отдаёт) → rename."""
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / f".{name}.tmp"
    tmp.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, OUT / name)


def pub_id(s: str) -> str:
    return hashlib.sha1(("dx:" + s).encode()).hexdigest()[:10]


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")


def category(model: str, kind: str) -> str:
    m = model.lower()
    if kind == "mac" or "macbook" in m or "imac" in m or "mac mini" in m:
        return "mac"
    if kind == "ipad" or "ipad" in m:
        return "ipad"
    if kind == "watch" or "watch" in m:
        return "watch"
    if "airpods" in m:
        return "airpods"
    return "iphone"


# ── Б/у ──────────────────────────────────────────────────────────────────────
def build_used() -> dict:
    st = json.loads(STATE.read_text(encoding="utf-8"))
    items = []
    for oid, rec in (st.get("ls") or {}).items():
        if rec.get("state") != "published":
            continue
        it = rec.get("item") or {}
        if not it.get("price") or not rec.get("media"):
            continue
        cond = it.get("condition")
        cond_label, cond_desc = config.CONDITIONS[cond] if isinstance(cond, int) and 0 <= cond < len(config.CONDITIONS) else ("", "")
        br = it.get("branch")
        cat = category(it.get("model", ""), it.get("kind", "phone"))
        kit = [str(k) for k in (it.get("kit") or [])]
        if cat != "iphone":   # в CRM у Mac/iPad/Watch пишут «Телефон» — на сайте это зарядка
            kit = ["Зарядное устройство" if k.strip().lower() == "телефон" else k for k in kit]
        items.append({
            "id": pub_id(oid),
            "cat": cat,
            "model": it.get("model", ""),
            "memory": it.get("memory", ""),
            "color": it.get("color", ""),
            "sim": it.get("sim", ""),
            "battery": it.get("battery", ""),
            "condition": cond_label,
            "condition_desc": cond_desc,
            "note": it.get("note", ""),            # публичное «Примечание для объявления» (как в посте)
            "kit": kit,
            "warranty": it.get("warranty", ""),
            "price": int(it["price"]),
            "branch": br if isinstance(br, int) else None,   # None = оба филиала
            "photos": [u for u in rec["media"] if isinstance(u, str) and u.startswith(PUBLIC_URL + "/media/")][:8],
            "ts": int(rec.get("ts") or 0),
        })
    items.sort(key=lambda x: -x["ts"])
    return {"updated": int(time.time()), "branches": BRANCHES, "items": items}


# ── Новая техника ────────────────────────────────────────────────────────────
def build_new() -> dict:
    import newtech  # парсер прайса usedbot (тот же, что для Авито)
    skus = newtech.load_prices(days=14)
    if not skus:
        return {"updated": int(time.time()), "day": "", "items": []}
    last_day = max(s["day"] for s in skus.values())
    names = newtech._photo_index()
    items = []
    for s in skus.values():
        if s["day"] != last_day:          # пропало из сегодняшнего прайса → на сайте не показываем
            continue
        photo = newtech.find_photo(s, names)
        row = {
            "id": pub_id(s["key"]),
            "cat": category(s["model"], s["kind"]),
            "model": s["model"],
            "memory": s.get("memory", ""),
            "color": s.get("color_en", ""),
            "price": int(s["price"]),
            "stock": "in_stock",
            "photo": f"{PUBLIC_URL}/media/new/{photo}.jpg" if photo else "",
        }
        for k in ("sim", "ram", "ssd", "size", "strap"):
            if s.get(k):
                row[k] = s[k]
        if s["kind"] == "ipad":
            row["net"] = "Wi-Fi + Cellular" if s.get("lte") else "Wi-Fi"
        items.append(row)
    items.sort(key=lambda x: (x["cat"], x["model"], x["price"]))
    return {"updated": int(time.time()), "day": last_day, "items": items}


# ── Ремонт ───────────────────────────────────────────────────────────────────
REPAIR_COLS = ["model", "service", "variant", "price", "duration", "warranty"]
REPAIR_HEAD = ["модель", "услуга", "вариант", "цена", "срок", "гарантия"]


def build_repair() -> dict | None:
    url = (f"https://docs.google.com/spreadsheets/d/{REPAIR_SHEET_ID}/gviz/tq?tqx=out:csv&sheet="
           + urllib.parse.quote(REPAIR_SHEET))
    with urllib.request.urlopen(url, timeout=20) as r:
        text = r.read().decode("utf-8")
    rows = list(csv.reader(io.StringIO(text)))
    if len(rows) < 2:
        return None
    # gviz при отсутствии листа молча отдаёт ПЕРВЫЙ лист таблицы — проверяем заголовки
    head = [c.strip().lower() for c in rows[0][:6]]
    if head != REPAIR_HEAD:
        raise ValueError(f"лист «{REPAIR_SHEET}» не найден или заголовки не совпадают: {rows[0][:6]}")
    items = []
    for r in rows[1:]:
        r = (r + [""] * 6)[:6]
        d = dict(zip(REPAIR_COLS, (c.strip() for c in r)))
        if not d["model"] or not d["service"]:
            continue
        p = re.sub(r"\D", "", d["price"])
        d["price"] = int(p) if p else None          # None = «после диагностики» / «под заказ»
        d["price_text"] = r[3].strip()
        items.append(d)
    return {"updated": int(time.time()), "items": items}


def main() -> int:
    errors = 0
    for name, fn in (("used.json", build_used), ("new.json", build_new), ("repair.json", build_repair)):
        try:
            data = fn()
            if data is None:
                print(f"{name}: пусто, файл не трогаю")
                continue
            write_json(name, data)
            print(f"{name}: {len(data['items'])} позиций")
        except Exception as e:  # один источник упал — остальные пишем, старый файл остаётся
            errors += 1
            print(f"{name}: ОШИБКА {type(e).__name__}: {e}", file=sys.stderr)
    return 1 if errors == 3 else 0


if __name__ == "__main__":
    sys.exit(main())
