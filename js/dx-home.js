/* Displex · главная · dx-home.js
   Мини-калькулятор и цены «от» из repair.json, витрина «В наличии сегодня» (2 новых + 2 б/у), форма записи. */
(function () {
  "use strict";
  var root = document.querySelector("[data-dx-home]");
  if (!root || root.hasAttribute("data-dx-ready")) return;            // скрипт мог подключиться дважды (старый блок + ядро)
  root.setAttribute("data-dx-ready", "");
  var API = "https://displex.su/site/";
  var CACHE = "dx-home-v1";

  function $(s, el) { return (el || root).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rub(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽"; }
  function priceText(r) {
    if (r.price == null) return r.price_text || "после диагностики";
    return (/^от/i.test(r.price_text || "") ? "от " : "") + rub(r.price);
  }

  /* ---------- Ремонт ---------- */
  var REP = [], models = [];
  var calc = { model: "", service: "", variant: "" };
  var mSel = $("[data-calc-model]"), sSel = $("[data-calc-service]"), vBox = $("[data-calc-variants]"), out = $("[data-calc-result]");

  function rowsFor(model, service) { return REP.filter(function (r) { return r.model === model && (!service || r.service === service); }); }
  function fillServices() {
    var list = []; rowsFor(calc.model).forEach(function (r) { if (list.indexOf(r.service) < 0) list.push(r.service); });
    sSel.innerHTML = list.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("");
    if (list.indexOf(calc.service) < 0) calc.service = list.indexOf("Замена дисплея") >= 0 ? "Замена дисплея" : list[0] || "";
    sSel.value = calc.service;
  }
  function renderCalc() {
    var rows = rowsFor(calc.model, calc.service).filter(function (r) { return r.variant !== "Доплата за тачскрин"; });
    if (!rows.length) { out.hidden = true; vBox.innerHTML = ""; return; }
    if (!rows.some(function (r) { return r.variant === calc.variant; })) calc.variant = rows[0].variant;
    vBox.innerHTML = rows.length > 1 ? rows.map(function (r) {
      return '<button class="dx-opt" type="button" data-calc-v="' + esc(r.variant) + '" aria-pressed="' + (r.variant === calc.variant) + '">' + esc(r.variant || "Стандарт") + "</button>";
    }).join("") : "";
    vBox.hidden = rows.length < 2;
    var r = rows.filter(function (x) { return x.variant === calc.variant; })[0];
    $("[data-calc-name]").textContent = r.service + (r.variant ? " · " + r.variant : "");
    var pe = $("[data-calc-price]"), pt = priceText(r);
    if (pe.textContent !== pt) { pe.textContent = pt; if (window.DX && window.DX.swap) window.DX.swap(pe); }
    var cv = $("[data-calc-var]"); if (cv) cv.hidden = !(calc.service === "Замена дисплея" && rows.length > 1);
    $("[data-calc-meta]").innerHTML = [r.duration, r.warranty ? "гарантия " + r.warranty : ""].filter(Boolean).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    out.hidden = false;
  }
  function minPrice(test) {
    var p = REP.filter(function (r) { return r.price != null && !/^Доплата/.test(r.variant || "") && test(r); }).map(function (r) { return r.price; });
    return p.length ? Math.min.apply(null, p) : null;
  }
  function renderFrom() {                       // цены «от» в офферах и таблице
    root.querySelectorAll("[data-from]").forEach(function (el) {
      var key = el.getAttribute("data-from"), v = null;
      if (key === "glass") v = minPrice(function (r) { return r.service === "Замена дисплея" && /переклейка/i.test(r.variant); });
      else if (key === "watch") v = minPrice(function (r) { return /Watch/.test(r.model); });
      else v = minPrice(function (r) { return r.service === key && !/Watch/.test(r.model); });
      if (v != null) el.textContent = "от " + rub(v);
    });
  }
  function ingestRepair(data) {
    REP = (data && data.items) || [];
    if (!REP.length) return;
    models = [];
    REP.forEach(function (r) { if (models.indexOf(r.model) < 0) models.push(r.model); });
    var phones = models.filter(function (m) { return /iPhone/.test(m); }).reverse(), other = models.filter(function (m) { return !/iPhone/.test(m); });
    models = phones.concat(other);
    mSel.innerHTML = models.map(function (m) { return "<option>" + esc(m) + "</option>"; }).join("");
    if (models.indexOf(calc.model) < 0) calc.model = models.indexOf("iPhone 13") >= 0 ? "iPhone 13" : models[0];
    mSel.value = calc.model;
    fillServices(); renderCalc(); renderFrom();
    if (mw) { mwRepairModels(); mwServices(); }
  }

  /* ---------- Витрина: 2 новых + 2 б/у ---------- */
  var SIL = '<svg viewBox="0 0 160 120" width="160" height="120" fill="none" stroke="currentColor" stroke-width="3" opacity=".3" aria-hidden="true"><rect x="52" y="10" width="56" height="100" rx="10"/></svg>';
  var CAT_URL = { iphone: "/catalog/iphone", mac: "/catalog/mac", ipad: "/catalog/ipad", watch: "/catalog/watch", airpods: "/catalog/airpods" };
  function gen(m) { var n = String(m).match(/(\d+)/); return (n ? +n[1] : 0) + (/Pro Max/.test(m) ? .3 : /Pro/.test(m) ? .2 : 0); }
  function card(it, used) {
    var img = used ? (it.photos || [])[0] : it.photo;
    var href = used ? "/catalog/used?cat=" + it.cat : (CAT_URL[it.cat] || "/catalog");
    var meta = used ? [it.color, it.battery ? "АКБ " + it.battery : "", it.condition].filter(Boolean).join(" · ") : [it.memory, window.DX && window.DX.colorRu ? window.DX.colorRu(it.color) : it.color].filter(Boolean).join(" · ");
    return '<a class="dx-card dx-pcard" href="' + href + '">' +
      '<div class="dx-card-media' + (used ? " dx-card-media--photo" : "") + '">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(it.model) + '" loading="lazy" decoding="async" width="400" height="300">' : SIL) + "</div>" +
      '<div class="dx-chips" style="gap:6px">' + (used ? '<span class="dx-badge dx-badge--used">Б/у</span>' : '<span class="dx-badge dx-badge--stock">В наличии</span><span class="dx-badge dx-badge--new">Новый</span>') + "</div>" +
      '<h3 class="dx-card-title">' + esc(it.model) + (used && it.memory ? " · " + esc(it.memory) : "") + "</h3>" +
      '<p class="dx-card-meta">' + esc(meta) + "</p>" +
      '<div class="dx-card-foot"><div class="dx-card-row"><span class="dx-price dx-price--lg">' + (used ? "" : "от ") + rub(it.price) + "</span></div>" +
      '<span class="dx-btn dx-btn--secondary dx-btn--sm dx-btn--block">' + (used ? "Подробнее" : "Выбрать цвет и память") + "</span></div></a>";
  }
  function ingestShop(fresh, used) {
    if (fresh && fresh.items) NEW = fresh.items;
    if (used && used.items) USED = used.items;
    if (mw) { mwBuy(); renderTi(); }
    var grid = $("[data-home-shop]"); if (!grid) return;
    var items = (fresh && fresh.items) || [], picks = [];
    // новые: самый свежий iPhone (минимальная цена модели) + ещё одна категория
    var byModel = {};
    items.forEach(function (i) { var k = i.cat + "|" + i.model; if (!byModel[k] || i.price < byModel[k].price) byModel[k] = i; });
    var models = Object.keys(byModel).map(function (k) { return byModel[k]; });
    var ip = models.filter(function (m) { return m.cat === "iphone"; }).sort(function (a, b) { return gen(b.model) - gen(a.model); })[0];
    var other = models.filter(function (m) { return m.cat === "mac"; }).sort(function (a, b) { return gen(b.model) - gen(a.model) || a.price - b.price; })[0] ||
                models.filter(function (m) { return m.cat !== "iphone"; })[0];
    [ip, other].forEach(function (x) { if (x) picks.push(card(x, false)); });
    ((used && used.items) || []).slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 2).forEach(function (u) { picks.push(card(u, true)); });
    if (picks.length) grid.innerHTML = picks.join("");
  }


  /* ---------- Телефон: виджет «Ремонт · Купить · Trade-In» (виден ≤640px) ---------- */
  var mw = $("[data-mw]"), MW = { tab: "r", rm: "", rs: "", bm: "", bb: "new" }, NEW = [], USED = [];
  var SVC_ORDER = ["Замена дисплея", "Замена аккумулятора", "Замена заднего стекла", "Замена камеры", "Замена шлейфа зарядки", "Ремонт платы (пайка)"];
  var BUY_CATS = [["mac", "MacBook"], ["ipad", "iPad"], ["watch", "Watch"], ["airpods", "AirPods"]];
  function short(m) { return String(m).replace(/^iPhone\s+/, ""); }
  var SVC_SHORT = { "Замена дисплея": "Дисплей", "Замена аккумулятора": "Аккумулятор", "Замена заднего стекла": "Заднее стекло", "Замена камеры": "Камера",
                    "Замена шлейфа зарядки": "Разъём зарядки", "Ремонт платы (пайка)": "Ремонт платы", "Замена стекла камеры": "Стекло камеры" };
  function svcShort(s) { return SVC_SHORT[s] || s; }
  function chip(val, label, on) { return '<button class="dx-chip" type="button" data-v="' + esc(val) + '" aria-pressed="' + on + '">' + esc(label) + "</button>"; }
  function centerChip(row) {                     // выбранная модель видна в ленте, страницу не прокручиваем
    var b = row.querySelector('[aria-pressed="true"]'); if (!b) return;
    row.scrollLeft = Math.max(0, b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2);
  }
  function mwRepairModels() {
    var row = $("[data-mw-rm]"); if (!row) return;
    var list = models.filter(function (m) { return /^iPhone/.test(m); });
    if (!list.length) return;
    if (list.indexOf(MW.rm) < 0) MW.rm = list.indexOf("iPhone 13") >= 0 ? "iPhone 13" : list[0];
    row.innerHTML = list.map(function (m) { return chip(m, short(m), m === MW.rm); }).join("") +
      '<a class="dx-chip" href="/calculator">Watch и др.</a>';
    centerChip(row);
  }
  function mwServices() {
    var box = $("[data-mw-rs]"); if (!box || !MW.rm) return;
    var by = {};
    rowsFor(MW.rm).forEach(function (r) {
      if (r.price == null || /^Доплата/.test(r.variant || "")) return;
      if (!by[r.service] || r.price < by[r.service].price) by[r.service] = r;
    });
    var list = Object.keys(by).sort(function (a, b) {
      var ia = SVC_ORDER.indexOf(a), ib = SVC_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    }).slice(0, 6);
    if (list.indexOf(MW.rs) < 0) MW.rs = list[0] || "";
    box.innerHTML = list.map(function (sv) {
      var r = by[sv];
      return '<button class="dx-mw-tile" type="button" data-v="' + esc(sv) + '" aria-pressed="' + (sv === MW.rs) + '"><b>' + esc(svcShort(sv)) + "</b>" +
        (r.duration ? "<small>" + esc(r.duration) + "</small>" : "") + "<span>от " + rub(r.price) + "</span></button>";
    }).join("") || '<p class="dx-small dx-text-muted">Цену для этой модели назовём после бесплатной диагностики.</p>';
    var all = $("[data-mw-all]"); if (all) { all.textContent = "цены для " + MW.rm; all.href = "/calculator?model=" + encodeURIComponent(MW.rm); }
    var vl = $("[data-mw-var]"); if (vl) vl.hidden = !(MW.rs === "Замена дисплея" && rowsFor(MW.rm, MW.rs).filter(function (r) { return r.variant && !/^Доплата/.test(r.variant); }).length > 1);
    var go = $('[data-mw-go="r"]'); if (go) go.textContent = MW.rs ? "Записаться · " + svcShort(MW.rs) : "Записаться на ремонт";
  }
  function buyKeys() {                           // iPhone по моделям (новые сверху) + остальные категории целиком
    var ip = {};
    NEW.forEach(function (i) { if (i.cat === "iphone") ip[i.model] = 1; });
    var keys = Object.keys(ip).sort(function (a, b) { return gen(b) - gen(a) || a.localeCompare(b); }).map(function (m) { return [m, short(m)]; });
    BUY_CATS.forEach(function (c) { if (NEW.some(function (i) { return i.cat === c[0]; }) || USED.some(function (u) { return u.cat === c[0]; })) keys.push(["cat:" + c[0], c[1]]); });
    return keys;
  }
  function buyMatch(key, it) { return key.indexOf("cat:") === 0 ? it.cat === key.slice(4) : it.model === key; }
  function mwBuy() {
    var row = $("[data-mw-bm]"), box = $("[data-mw-bb]"); if (!row || !box) return;
    var keys = buyKeys(); if (!keys.length) return;
    if (!keys.some(function (k) { return k[0] === MW.bm; })) MW.bm = keys[0][0];
    row.innerHTML = keys.map(function (k) { return chip(k[0], k[1], k[0] === MW.bm); }).join("");
    centerChip(row);
    var n = NEW.filter(function (i) { return buyMatch(MW.bm, i); }), u = USED.filter(function (i) { return buyMatch(MW.bm, i); });
    var label = (keys.filter(function (k) { return k[0] === MW.bm; })[0] || [])[1];
    var title = MW.bm.indexOf("cat:") === 0 ? label : MW.bm;
    var nMin = n.length ? Math.min.apply(null, n.map(function (i) { return i.price; })) : null;
    var uMin = u.length ? Math.min.apply(null, u.map(function (i) { return i.price; })) : null;
    if (MW.bb === "used" && !u.length) MW.bb = "new";
    if (MW.bb === "new" && !n.length && u.length) MW.bb = "used";
    box.innerHTML =
      '<button class="dx-mw-tile" type="button" data-v="new" aria-pressed="' + (MW.bb === "new") + '"' + (n.length ? "" : " disabled") + "><small>Новый · в наличии</small><b>" + esc(title) + "</b>" +
        (nMin != null ? "<span>от " + rub(nMin) + "</span>" : '<span class="is-muted">привезём под заказ</span>') + "</button>" +
      '<button class="dx-mw-tile" type="button" data-v="used" aria-pressed="' + (MW.bb === "used") + '"' + (u.length ? "" : " disabled") + "><small>Б/у · с гарантией</small><b>" +
        (u.length ? u.length + " " + plural(u.length, ["устройство", "устройства", "устройств"]) : "Сейчас нет") + "</b>" + (uMin != null ? "<span>от " + rub(uMin) + "</span>" : '<span class="is-muted">появляются каждую неделю</span>') + "</button>";
    var cat = MW.bm.indexOf("cat:") === 0 ? MW.bm.slice(4) : "iphone";
    var link = $("[data-mw-cat]");
    if (link) {
      if (MW.bb === "used") { link.textContent = "все б/у"; link.href = "/catalog/used?cat=" + cat + (MW.bm.indexOf("cat:") ? "&q=" + encodeURIComponent(MW.bm) : ""); }
      else { link.textContent = "выбрать в каталоге"; link.href = (CAT_URL[cat] || "/catalog") + (MW.bm.indexOf("cat:") ? "?q=" + encodeURIComponent(MW.bm) : ""); }
    }
    MW.buy = { title: title, used: MW.bb === "used", price: MW.bb === "used" ? uMin : nMin };
    var nt = $("[data-mw-notify]");
    if (nt && window.DX && window.DX.notifyHtml) {
      if (u.length) { nt.innerHTML = ""; nt.removeAttribute("data-for"); }
      else if (nt.getAttribute("data-for") !== title) {
        var mems = []; n.forEach(function (i) { if (i.memory && mems.indexOf(i.memory) < 0) mems.push(i.memory); });
        var budgets = nMin ? [0.45, 0.6, 0.75].map(function (k) { return "до " + Math.round(nMin * k / 5000) * 5 + " тыс"; }) : [];
        nt.innerHTML = window.DX.notifyHtml(title, mems, budgets); nt.setAttribute("data-for", title);
      }
    }
  }
  function plural(n, f) { var a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; }

  /* Trade-In: оценка по листу «Сайт_TradeIn» + доплата за выбранную модель */
  var TI = [], TIS = { mem: "", cond: "Хорошее", want: "" };
  var CONDS = [["Идеальное", "Без царапин, аккумулятор 90% и выше"], ["Хорошее", "Мелкие следы использования, всё работает"],
               ["Заметный износ", "Царапины, потёртости, сколы корпуса; всё работает"], ["Дефекты", "Трещины, не работает Face ID, камера и т. п."]];
  function tiRows(m) { m = String(m || "").trim().toLowerCase(); return TI.filter(function (x) { return x.model.toLowerCase() === m; }); }
  function opt(v, on) { return '<button class="dx-opt" type="button" data-v="' + esc(v) + '" aria-pressed="' + on + '">' + esc(v) + "</button>"; }
  function renderTi() {
    var inp = $("#dx-mw-ti-model"); if (!inp) return;
    var model = inp.value.trim(), rows = tiRows(model);
    var mems = rows.length ? rows.map(function (r) { return r.memory; }) : ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"];
    if (mems.indexOf(TIS.mem) < 0) TIS.mem = rows.length ? mems[0] : "128 ГБ";
    $("[data-mw-mem]").innerHTML = mems.map(function (m) { return opt(m, m === TIS.mem); }).join("");
    $("[data-mw-cond]").innerHTML = CONDS.map(function (c) { return opt(c[0], c[0] === TIS.cond); }).join("");
    $("[data-mw-cond-note]").textContent = (CONDS.filter(function (c) { return c[0] === TIS.cond; })[0] || [])[1] || "";
    var wants = buyKeys().filter(function (k) { return k[0].indexOf("cat:") < 0; }).slice(0, 4);
    if (!wants.some(function (k) { return k[0] === TIS.want; }) && TIS.want !== "none") TIS.want = wants.length ? wants[0][0] : "none";
    var wr = $("[data-mw-want]");
    wr.innerHTML = wants.map(function (k) { return chip(k[0], k[1], k[0] === TIS.want); }).join("") + chip("none", "Только сдать", TIS.want === "none");
    var row = rows.filter(function (r) { return r.memory === TIS.mem; })[0];
    var price = row && row.prices ? row.prices[TIS.cond] : null;
    var newMin = null;
    if (TIS.want !== "none") { var ns = NEW.filter(function (i) { return i.model === TIS.want; }); if (ns.length) newMin = Math.min.apply(null, ns.map(function (i) { return i.price; })); }
    var res = $("[data-mw-ti-res]"), html = "";
    if (!model) html = '<span class="dx-small dx-text-muted">Выберите модель — покажем оценку' + (TIS.want !== "none" ? " и доплату" : "") + ".</span>";
    else if (price == null) html = '<span class="dx-small">Эту модель оценим за 10 минут при проверке в филиале.</span>' +
      (newMin != null ? '<div class="dx-row"><span>' + esc(TIS.want) + '</span><span>от ' + rub(newMin) + "</span></div>" : "");
    else if (newMin != null) html = '<div class="dx-row"><span>' + esc(TIS.want) + ", новый</span><span>от " + rub(newMin) + "</span></div>" +
      '<div class="dx-row"><span>Ваш ' + esc(model) + "</span><span>− до " + rub(price) + "</span></div>" +
      '<span class="dx-small dx-text-muted" style="margin-top:4px">Доплата</span><b>от ' + rub(Math.max(0, newMin - price)) + "</b>";
    else html = '<span class="dx-small dx-text-muted">Предварительная оценка</span><b>до ' + rub(price) + '</b><span class="dx-tiny dx-text-muted">Точная сумма — после проверки за 10 минут</span>';
    res.innerHTML = html;
    MW.ti = { model: model, mem: TIS.mem, cond: TIS.cond, price: price, want: TIS.want, newMin: newMin };
    var go = $('[data-mw-go="t"]'); if (go) go.textContent = price != null ? "Зафиксировать оценку" : "Оценить мой телефон";
  }
  function ingestTradeIn(d) { if (d && d.items) TI = d.items; renderTi(); }
  if (mw) {
    var tiInp = $("#dx-mw-ti-model");
    if (tiInp) { tiInp.addEventListener("input", renderTi); tiInp.addEventListener("change", renderTi); }
    renderTi();
    mw.addEventListener("click", function (e) {
      var t = e.target, el;
      if ((el = t.closest("[data-mw-tab]"))) {
        MW.tab = el.getAttribute("data-mw-tab");
        mw.querySelectorAll("[data-mw-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b === el)); });
        mw.querySelectorAll("[data-mw-pane]").forEach(function (p) {
          var on = p.getAttribute("data-mw-pane") === MW.tab; p.hidden = !on;
          if (on && window.DX && window.DX.swap) window.DX.swap(p, "dx-fade");
        });
        if (MW.tab === "b") mwBuy(); else if (MW.tab === "r") centerChip($("[data-mw-rm]")); else renderTi();
        if (window.DX && window.DX.goal) window.DX.goal("mw_tab_" + MW.tab);
        return;
      }
      if ((el = t.closest("[data-mw-rm] [data-v]"))) { MW.rm = el.getAttribute("data-v"); mwRepairModels(); mwServices(); return; }
      if ((el = t.closest("[data-mw-rs] [data-v]"))) { MW.rs = el.getAttribute("data-v"); mwServices(); return; }
      if ((el = t.closest("[data-mw-bm] [data-v]"))) { MW.bm = el.getAttribute("data-v"); mwBuy(); return; }
      if ((el = t.closest("[data-mw-bb] [data-v]"))) { MW.bb = el.getAttribute("data-v"); mwBuy(); return; }
      if ((el = t.closest("[data-mw-mem] .dx-opt"))) { TIS.mem = el.getAttribute("data-v"); renderTi(); return; }
      if ((el = t.closest("[data-mw-cond] .dx-opt"))) { TIS.cond = el.getAttribute("data-v"); renderTi(); return; }
      if ((el = t.closest("[data-mw-want] [data-v]"))) { TIS.want = el.getAttribute("data-v"); renderTi(); return; }
      if (t.closest("[data-mw-var]")) { window.DX && window.DX.variants && window.DX.variants(MW.rm, rowsFor(MW.rm, "Замена дисплея")); return; }
      if (!(el = t.closest("[data-mw-go]")) || !window.DX || !window.DX.lead) return;
      var k = el.getAttribute("data-mw-go");
      if (k === "r") {
        var r = $('[data-mw-rs] [aria-pressed="true"] span');
        window.DX.goal("mw_repair_lead");
        window.DX.lead("Ремонт", MW.rm + (MW.rs ? " — " + MW.rs + (r ? " · " + r.textContent : "") : ""));
      } else if (k === "b") {
        var b = MW.buy || {};
        window.DX.goal("mw_buy_lead");
        window.DX.lead("Покупка", (b.used ? "Б/у " : "Новый ") + (b.title || "") + (b.price != null ? " · от " + rub(b.price) : "") + " — бронь на 24 часа");
      } else {
        var ti = MW.ti || {};
        window.DX.goal("mw_tradein_lead");
        window.DX.lead("Trade-In", "Сдаю: " + (ti.model || "модель уточню") + ", " + ti.mem + ", " + ti.cond.toLowerCase() +
          (ti.price != null ? " (оценка до " + rub(ti.price) + ")" : "") +
          (ti.want && ti.want !== "none" ? " → хочу " + ti.want + (ti.price != null && ti.newMin != null ? " (доплата от " + rub(Math.max(0, ti.newMin - ti.price)) + ")" : "") : ""));
      }
    });
  }

  /* ---------- Загрузка с кэшем ---------- */
  function get(name) { return fetch(API + name, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) {}
  if (cached) { ingestRepair(cached.repair); ingestShop(cached.fresh, cached.used); ingestTradeIn(cached.tradein); }
  if (!cached || Date.now() - cached.t > 60000) {
    Promise.all([get("repair.json").catch(function () { return null; }), get("new.json").catch(function () { return null; }), get("used.json").catch(function () { return null; }), get("tradein.json").catch(function () { return null; })])
      .then(function (r) {
        if (r[0]) ingestRepair(r[0]);
        if (r[1] || r[2]) ingestShop(r[1], r[2]);
        ingestTradeIn(r[3]);
        try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), repair: r[0], fresh: r[1], used: r[2], tradein: r[3] })); } catch (e) {}
      });
  }

  /* ---------- События ---------- */
  mSel.addEventListener("change", function () { calc.model = mSel.value; calc.variant = ""; fillServices(); renderCalc(); });
  sSel.addEventListener("change", function () { calc.service = sSel.value; calc.variant = ""; renderCalc(); });
  var calcVar = $("[data-calc-var]");
  if (calcVar) calcVar.addEventListener("click", function () { window.DX && window.DX.variants && window.DX.variants(calc.model, rowsFor(calc.model, "Замена дисплея"), calc.variant); });
  vBox.addEventListener("click", function (e) { var b = e.target.closest("[data-calc-v]"); if (b) { calc.variant = b.getAttribute("data-calc-v"); renderCalc(); } });

  var form = $("[data-lead-form]");
  function toForm(kind, text) {
    var r = form.querySelector('input[name="dx-lead-kind"][value="' + kind + '"]'); if (r) r.checked = true;
    if (window.DX && window.DX.syncKind) window.DX.syncKind(form);
    if (text != null) form.elements["dx-lead-device"].value = text;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { form.elements["dx-lead-phone"].focus({ preventScroll: true }); }, 400);
  }
  root.addEventListener("click", function (e) {
    var el = e.target.closest("[data-to-form]");
    if (!el) return;
    e.preventDefault();
    var kind = el.getAttribute("data-to-form");
    if (kind === "calc") {
      var price = $("[data-calc-price]").textContent;
      toForm("Ремонт", calc.model + " — " + $("[data-calc-name]").textContent + " · " + price);
    } else toForm(kind, null);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $("[data-lead-status]"), ph = form.elements["dx-lead-phone"];
    if (!window.DX || !window.DX.validPhone(ph.value)) { ph.setAttribute("aria-invalid", "true"); ph.focus(); return; }
    ph.removeAttribute("aria-invalid");
    if (!form.elements["dx-lead-agree"].checked) { form.elements["dx-lead-agree"].focus(); return; }
    var kind = (form.querySelector('input[name="dx-lead-kind"]:checked') || {}).value || "Ремонт";
    var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
    window.DX.sendLead({
      form: "Главная: " + kind, branch: (form.querySelector('input[name="dx-lead-branch"]:checked') || {}).value,
      name: form.elements["dx-lead-name"].value.trim(), phone: ph.value,
      device: form.elements["dx-lead-device"].value.trim(), service: kind
    }).then(function (res) {
      btn.disabled = false; st.hidden = false;
      if (res.ok) { st.setAttribute("data-kind", "ok"); st.textContent = "Заявка принята. Менеджер перезвонит в течение 15 минут в рабочее время."; form.reset(); }
      else { st.setAttribute("data-kind", "err"); st.textContent = "Не удалось отправить. Позвоните +7 (922) 025-21-21 или напишите в Telegram @displexpoint."; }
    });
  });

  root.addEventListener("error", function (e) { var t = e.target; if (t.tagName === "IMG" && t.closest("[data-home-shop]")) t.outerHTML = SIL; }, true);

  /* Виджет отзывов Яндекса — вкладки по филиалам; грузим, когда блок близко к экрану */
  var rv = $("[data-reviews]"), tabs = $("[data-reviews-tabs]");
  if (rv) {
    var ORG_DEFAULT = "41724692284", seen = false;
    var show = function (org) {
      rv.innerHTML = '<iframe src="https://yandex.ru/maps-reviews-widget/' + org + '?comments" title="Отзывы о Displex на Яндекс Картах" loading="lazy" style="width:100%;height:100%;border:0;border-radius:inherit"></iframe>';
    };
    var current = function () { var b = tabs && tabs.querySelector('[aria-pressed="true"]'); return b ? b.getAttribute("data-org") : ORG_DEFAULT; };
    var load = function () { if (seen) return; seen = true; show(current()); };
    if (tabs) tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-org]"); if (!b || b.getAttribute("aria-pressed") === "true") return;
      tabs.querySelectorAll("[data-org]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      seen = true; show(b.getAttribute("data-org"));
    });
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: "400px" }); io.observe(rv); }
    else load();
  }
})();
