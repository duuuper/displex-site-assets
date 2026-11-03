/* Displex · цены на ремонт (/calculator) · dx-prices.js
   Полный прайс по выбранной модели из repair.json (лист «Сайт_Ремонт»), запись на услугу. */
(function () {
  "use strict";
  var root = document.querySelector("[data-dx-prices]");
  if (!root) return;
  var API = "https://displex.su/site/repair.json", CACHE = "dx-prices-v1";
  function $(s, el) { return (el || root).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rub(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽"; }
  function priceText(r) { if (r.price == null) return r.price_text || "после диагностики"; return (/^от/i.test(r.price_text || "") ? "от " : "") + rub(r.price); }

  var REP = [], models = [], current = new URLSearchParams(location.search).get("model") || "";
  var SERIES = (root.getAttribute("data-models") || "").split("|").filter(Boolean);   // страница серии /remont/...
  var chipsEl = $("[data-p-chips]");
  var FLAT = root.hasAttribute("data-flat");   // одна таблица на все модели серии (Apple Watch)
  var sel = $("[data-p-model]"), famEl = $("[data-p-family]"), body = $("[data-p-body]"), title = $("[data-p-title]");
  var family = /Watch/.test(current) ? "watch" : "iphone";

  function fam(m) { return /Watch/.test(m) ? "watch" : "iphone"; }
  function renderChips() {
    var avail = SERIES.filter(function (m) { return models.indexOf(m) >= 0; });
    if (SERIES.indexOf(current) < 0) current = avail.filter(function (m) { return /^iPhone \d+$/.test(m); })[0] || avail[0] || SERIES[0];
    if (FLAT) { chipsEl.hidden = true; return; }
    chipsEl.innerHTML = SERIES.filter(function (m) { return models.indexOf(m) >= 0; }).map(function (m) {
      return '<button class="dx-chip" type="button" data-p-m="' + esc(m) + '" aria-pressed="' + (m === current) + '">' + esc(m) + "</button>"; }).join("");
  }
  function renderFrom() {                       // «от» по услугам серии
    root.querySelectorAll("[data-from-svc]").forEach(function (el) {
      var svc = el.getAttribute("data-from-svc");
      var p = REP.filter(function (r) { return SERIES.indexOf(r.model) >= 0 && r.service === svc && r.price != null && !/^Доплата/.test(r.variant || ""); }).map(function (r) { return r.price; });
      if (p.length) el.textContent = "от " + rub(Math.min.apply(null, p));
    });
  }
  function renderSelect() {
    if (SERIES.length) { renderChips(); return; }
    var list = models.filter(function (m) { return fam(m) === family; });
    if (list.indexOf(current) < 0) current = family === "iphone" ? (list.indexOf("iPhone 13") >= 0 ? "iPhone 13" : list[0]) : list[0];
    if (!sel) return;
    sel.innerHTML = list.map(function (m) { return "<option>" + esc(m) + "</option>"; }).join("");
    sel.value = current;
    famEl.querySelectorAll("[data-fam]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-fam") === family)); });
  }
  function renderTable() {
    var rows = FLAT ? REP.filter(function (r) { return SERIES.indexOf(r.model) >= 0 && !/^Доплата/.test(r.variant || ""); })
                    : REP.filter(function (r) { return r.model === current; });
    if (!FLAT) title.textContent = "Цены на ремонт " + current;
    if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="dx-text-muted">Цены уточняйте по телефону.</td></tr>'; return; }
    var html = "", prev = "";
    rows.forEach(function (r, i) {
      var key = FLAT ? r.model : r.service;
      var first = key !== prev; prev = key;
      html += '<tr' + (first && i ? ' class="dx-p-group"' : "") + ">" +
        '<td><div class="dx-svc">' + (first ? esc(FLAT ? r.model : r.service) : "") + '</div><div class="dx-var">' + esc(FLAT ? r.service + (r.variant ? " · " + r.variant : "") : r.variant || "") + "</div></td>" +
        "<td>" + esc(r.duration || "—") + "</td><td>" + esc(r.warranty || "—") + "</td>" +
        '<td class="dx-r"><span class="dx-price dx-price--md">' + esc(priceText(r)) + "</span></td>" +
        '<td class="dx-r"><button class="dx-btn dx-btn--secondary dx-btn--sm" type="button" data-p-book="' + i + '">Записаться</button></td></tr>';
    });
    body.innerHTML = html;
    body._rows = rows;
    if (!SERIES.length) { try { history.replaceState(null, "", location.pathname + "?model=" + encodeURIComponent(current) + location.hash); } catch (e) {} }
  }
  function ingest(d) {
    REP = (d && d.items) || []; if (!REP.length) return;
    models = []; REP.forEach(function (r) { if (models.indexOf(r.model) < 0) models.push(r.model); });
    var phones = models.filter(function (m) { return fam(m) === "iphone"; }).reverse();
    models = phones.concat(models.filter(function (m) { return fam(m) === "watch"; }));
    renderSelect(); renderTable(); if (SERIES.length) renderFrom();
  }

  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) {}
  if (cached) ingest(cached.d);
  if (!cached || Date.now() - cached.t > 60000) {
    fetch(API, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      ingest(d); try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
    }).catch(function () { if (!cached) body.innerHTML = '<tr><td colspan="5" class="dx-text-muted">Прайс временно не загрузился. Позвоните: +7 (922) 025-21-21.</td></tr>'; });
  }

  if (sel) sel.addEventListener("change", function () { current = sel.value; renderTable(); });
  if (chipsEl) chipsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-p-m]"); if (!b) return; current = b.getAttribute("data-p-m"); renderChips(); renderTable(); });
  if (famEl) famEl.addEventListener("click", function (e) { var b = e.target.closest("[data-fam]"); if (!b) return; family = b.getAttribute("data-fam"); current = ""; renderSelect(); renderTable(); });

  /* Trade-In: самая новая базовая модель iPhone из каталога */
  var ti = $("[data-ti]");
  if (ti) fetch("https://displex.su/site/new.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var ip = (d.items || []).filter(function (i) { return i.cat === "iphone" && /^iPhone \d+$/.test(i.model); });
    if (!ip.length) return;
    var top = Math.max.apply(null, ip.map(function (i) { return +i.model.match(/\d+/)[0]; }));
    var min = Math.min.apply(null, ip.filter(function (i) { return i.model === "iPhone " + top; }).map(function (i) { return i.price; }));
    ti.querySelector("[data-ti-model]").textContent = "iPhone " + top;
    ti.querySelector("[data-ti-price]").textContent = "от " + rub(min);
    ti.hidden = false;
  }).catch(function () {});

  /* Запись */
  var modal = document.getElementById("dx-repair"), booking = "";
  body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-p-book]"); if (!b || !modal) return;
    var r = body._rows[+b.getAttribute("data-p-book")];
    booking = (FLAT ? r.model : current) + " — " + r.service + (r.variant ? " · " + r.variant : "") + " · " + priceText(r).replace(/ /g, " ");
    modal.querySelector("[data-r-what]").textContent = booking;
    modal.querySelector("form").hidden = false; modal.querySelector("[data-r-status]").hidden = true;
    window.DX && window.DX.openModal("dx-repair");
  });
  if (modal) modal.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, st = modal.querySelector("[data-r-status]"), ph = f.elements["dx-r-phone"];
    if (!window.DX.validPhone(ph.value)) { ph.setAttribute("aria-invalid", "true"); ph.focus(); return; }
    ph.removeAttribute("aria-invalid");
    if (!f.elements["dx-r-agree"].checked) { f.elements["dx-r-agree"].focus(); return; }
    var btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
    window.DX.sendLead({ form: "Цены на ремонт: запись", branch: (f.querySelector('input[name="dx-r-branch"]:checked') || {}).value,
      name: f.elements["dx-r-name"].value.trim(), phone: ph.value, device: booking.split(" — ")[0], service: booking, comment: f.elements["dx-r-comment"].value.trim() })
      .then(function (res) {
        btn.disabled = false; st.hidden = false;
        if (res.ok) { f.hidden = true; st.setAttribute("data-kind", "ok"); st.textContent = "Записали. Менеджер перезвонит в течение 15 минут в рабочее время и подтвердит время визита."; f.reset(); }
        else { st.setAttribute("data-kind", "err"); st.textContent = "Не удалось отправить. Позвоните +7 (922) 025-21-21 или напишите в Telegram @displexpoint."; }
      });
  });
})();
