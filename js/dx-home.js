/* Displex · главная · dx-home.js
   Мини-калькулятор и цены «от» из repair.json, витрина «В наличии сегодня» (2 новых + 2 б/у), форма записи. */
(function () {
  "use strict";
  var root = document.querySelector("[data-dx-home]");
  if (!root) return;
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
    $("[data-calc-price]").textContent = priceText(r);
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
  }

  /* ---------- Витрина: 2 новых + 2 б/у ---------- */
  var SIL = '<svg viewBox="0 0 160 120" width="160" height="120" fill="none" stroke="currentColor" stroke-width="3" opacity=".3" aria-hidden="true"><rect x="52" y="10" width="56" height="100" rx="10"/></svg>';
  var CAT_URL = { iphone: "/catalog/iphone", mac: "/catalog/mac", ipad: "/catalog/ipad", watch: "/catalog/watch", airpods: "/catalog/airpods" };
  function gen(m) { var n = String(m).match(/(\d+)/); return (n ? +n[1] : 0) + (/Pro Max/.test(m) ? .3 : /Pro/.test(m) ? .2 : 0); }
  function card(it, used) {
    var img = used ? (it.photos || [])[0] : it.photo;
    var href = used ? "/catalog/used?cat=" + it.cat : (CAT_URL[it.cat] || "/catalog");
    var meta = used ? [it.color, it.battery ? "АКБ " + it.battery : "", it.condition].filter(Boolean).join(" · ") : [it.memory, it.color].filter(Boolean).join(" · ");
    return '<a class="dx-card dx-pcard" href="' + href + '">' +
      '<div class="dx-card-media' + (used ? " dx-card-media--photo" : "") + '">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(it.model) + '" loading="lazy" decoding="async" width="400" height="300">' : SIL) + "</div>" +
      '<div class="dx-chips" style="gap:6px">' + (used ? '<span class="dx-badge dx-badge--used">Б/у</span>' : '<span class="dx-badge dx-badge--stock">В наличии</span><span class="dx-badge dx-badge--new">Новый</span>') + "</div>" +
      '<h3 class="dx-card-title">' + esc(it.model) + (used && it.memory ? " · " + esc(it.memory) : "") + "</h3>" +
      '<p class="dx-card-meta">' + esc(meta) + "</p>" +
      '<div class="dx-card-foot"><div class="dx-card-row"><span class="dx-price dx-price--lg">' + (used ? "" : "от ") + rub(it.price) + "</span></div>" +
      '<span class="dx-btn dx-btn--secondary dx-btn--sm dx-btn--block">' + (used ? "Подробнее" : "Выбрать цвет и память") + "</span></div></a>";
  }
  function ingestShop(fresh, used) {
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

  /* ---------- Загрузка с кэшем ---------- */
  function get(name) { return fetch(API + name, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) {}
  if (cached) { ingestRepair(cached.repair); ingestShop(cached.fresh, cached.used); }
  if (!cached || Date.now() - cached.t > 60000) {
    Promise.all([get("repair.json").catch(function () { return null; }), get("new.json").catch(function () { return null; }), get("used.json").catch(function () { return null; })])
      .then(function (r) {
        if (r[0]) ingestRepair(r[0]);
        if (r[1] || r[2]) ingestShop(r[1], r[2]);
        try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), repair: r[0], fresh: r[1], used: r[2] })); } catch (e) {}
      });
  }

  /* ---------- События ---------- */
  mSel.addEventListener("change", function () { calc.model = mSel.value; calc.variant = ""; fillServices(); renderCalc(); });
  sSel.addEventListener("change", function () { calc.service = sSel.value; calc.variant = ""; renderCalc(); });
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

  /* Виджет отзывов Яндекса — загружаем, когда блок близко к экрану */
  var rv = $("[data-reviews]");
  if (rv) {
    var load = function () { if (rv.dataset.loaded) return; rv.dataset.loaded = "1"; rv.innerHTML = '<iframe src="https://yandex.ru/maps-reviews-widget/41724692284?comments" title="Отзывы о Displex на Яндекс Картах" loading="lazy" style="width:100%;height:100%;border:0;border-radius:inherit"></iframe>'; };
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: "400px" }); io.observe(rv); }
    else load();
  }
})();
