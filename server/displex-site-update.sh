#!/bin/bash
# Displex: автообновление скрипта выгрузки сайта из GitHub (main → /opt/displex-site/export.py).
# Запускается таймером displex-site-update.timer каждые 10 минут.
# Новая версия ставится, только если: скачалась, компилируется и проходит проверочный прогон
# (DX_EXPORT_CHECK=1 — данные собираются, файлы не пишутся). Иначе остаётся текущая.
set -u
REPO_RAW="https://raw.githubusercontent.com/duuuper/displex-site-assets/main/server"
DIR=/opt/displex-site
PY=/opt/displex-usedbot/venv/bin/python
CUR="$DIR/export.py"
TMP="$DIR/.export.py.new"

curl -fsS --max-time 30 -H "Cache-Control: no-cache" "$REPO_RAW/export.py?t=$(date +%s)" -o "$TMP" || { echo "не удалось скачать export.py"; rm -f "$TMP"; exit 0; }
if [ -f "$CUR" ] && cmp -s "$TMP" "$CUR"; then rm -f "$TMP"; exit 0; fi   # без изменений — молча выходим

echo "найдена новая версия export.py ($(sha256sum "$TMP" | cut -c1-12)), проверяю"
if ! "$PY" -m py_compile "$TMP"; then echo "ОТКАЗ: синтаксическая ошибка, оставляю текущую"; rm -f "$TMP"; exit 1; fi
cd "$DIR"
OUT=$(DX_EXPORT_CHECK=1 timeout 120 "$PY" "$TMP" 2>&1); RC=$?
echo "$OUT"
if [ $RC -ne 0 ] || echo "$OUT" | grep -q "ОШИБКА"; then echo "ОТКАЗ: проверочный прогон не прошёл (код $RC), оставляю текущую"; rm -f "$TMP"; exit 1; fi

[ -f "$CUR" ] && cp -p "$CUR" "$DIR/export.py.prev"
chmod 644 "$TMP" && mv -f "$TMP" "$CUR"
echo "установлена новая версия export.py (предыдущая — export.py.prev), запускаю выгрузку"
systemctl start --no-block displex-site-export.service
