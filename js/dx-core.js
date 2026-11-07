/* Displex · общие скрипты сайта · dx-core.js
   Тема (авто/светлая/тёмная), мобильное меню, cookie-баннер, модальные окна, маска телефона.
   Подключается с defer. Ничего не делает, если нужных элементов на странице нет. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY_THEME = "dx-theme", KEY_COOKIE = "dx-cookie-ok";

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) { return null; }
  }

  /* ---------- Тема ---------- */
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function effective(mode) { return mode === "light" || mode === "dark" ? mode : (mq && mq.matches ? "dark" : "light"); }
  function applyTheme(mode) {
    mode = mode === "light" || mode === "dark" ? mode : "auto";
    if (mode === "auto") root.removeAttribute("data-dx-theme"); else root.setAttribute("data-dx-theme", mode);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", effective(mode) === "dark" ? "#0c0c0e" : "#ffffff");
    document.querySelectorAll("[data-dx-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-dx-theme-set") === mode));
    });
  }
  applyTheme(store(KEY_THEME));
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { applyTheme(store(KEY_THEME)); });

  /* ---------- Маска телефона +7 (XXX) XXX-XX-XX ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, "");
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d && d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    var out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return d.length ? out : "";
  }

  /* ---------- Модальные окна ---------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id); if (!m) return;
    lastFocus = document.activeElement;
    var lf = m.querySelector("form[data-dx-lead]"); if (lf && lf.hidden) { lf.hidden = false; var ls = m.querySelector("[data-dx-lead-status]"); if (ls) ls.hidden = true; }
    m.setAttribute("data-open", "true"); m.removeAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
    var f = m.querySelector("input, select, button:not(.dx-modal-close)"); if (f) f.focus();
  }
  function closeModal(m) {
    m.setAttribute("data-open", "false"); m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Делегирование событий ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var el;
    if ((el = t.closest("[data-dx-theme-set]"))) {
      var mode = el.getAttribute("data-dx-theme-set");
      store(KEY_THEME, mode === "auto" ? null : mode); applyTheme(mode); return;
    }
    if ((el = t.closest("[data-dx-menu-toggle]"))) {
      var menu = document.getElementById(el.getAttribute("aria-controls"));
      var open = el.getAttribute("aria-expanded") !== "true";
      el.setAttribute("aria-expanded", String(open));
      if (menu) menu.setAttribute("data-open", String(open));
      return;
    }
    if ((el = t.closest("[data-dx-open]")) && document.getElementById(el.getAttribute("data-dx-open"))) {   // нет окна на странице — работает обычная ссылка
      e.preventDefault(); var mn = document.getElementById("dx-menu"); if (mn) mn.setAttribute("data-open", "false");
      openModal(el.getAttribute("data-dx-open")); return;
    }
    if ((el = t.closest("[data-dx-close]"))) { closeModal(el.closest(".dx-modal")); return; }
    if (t.classList && t.classList.contains("dx-modal")) { closeModal(t); return; }
    if ((el = t.closest("[data-dx-cookie-ok]"))) {
      store(KEY_COOKIE, "1"); var c = el.closest(".dx-cookie"); if (c) c.hidden = true; return;
    }
    if ((el = t.closest("[data-dx-pick]"))) {        // выбор цвета / памяти внутри группы
      var g = el.closest("[data-dx-group]");
      if (g) g.querySelectorAll("[data-dx-pick]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
      el.dispatchEvent(new CustomEvent("dx:pick", { bubbles: true, detail: { value: el.getAttribute("data-dx-pick") } }));
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var m = document.querySelector('.dx-modal[data-open="true"]'); if (m) closeModal(m); }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches && t.matches('input[type="tel"][data-dx-phone]')) {
      var f = formatPhone(t.value); if (t.value !== f) t.value = f;
    }
  });
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (t.matches && t.matches('input[type="tel"][data-dx-phone]') && !t.value) t.value = "+7 (";
  });

  /* ---------- Cookie-баннер ---------- */
  function initCookie() {
    var c = document.querySelector(".dx-cookie");
    if (c && store(KEY_COOKIE) !== "1") c.hidden = false;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { initCookie(); applyTheme(store(KEY_THEME)); });
  else initCookie();

  /* ---------- Заявки → Displex CRM (карточка в чат сотрудников); CRM недоступна — запасной путь Apps Script ---------- */
  // Адрес и ключ CRM задаются в блоке шапки Creatium: <script>window.DX_CRM={url:"…",key:"…"}</script>.
  // Ключ с правом только «создание заявок»; без него — сразу запасной путь.
  var CRM = window.DX_CRM || {};
  var CRM_URL = CRM.url || "https://crm.apple-displex.ru/api/v1/leads";
  var LEAD_URL = "https://script.google.com/macros/s/AKfycby4lhzUgEND7oM160rA49jHts7U9pVs9oHvudcJLNcjh9sHndatdxkKSifXriEBFRW3/exec";
  var SITE_KEY = "ff31fe3064da4188a7ba3e77eb193098";   // запасной путь (таблица «Заявки»)
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "yclid", "gclid"];
  (function rememberUtm() {                            // первая метка визита живёт до закрытия вкладки
    try {
      var q = new URLSearchParams(location.search), got = {};
      UTM.forEach(function (k) { if (q.get(k)) got[k] = q.get(k); });
      if (Object.keys(got).length && !sessionStorage.getItem("dx-utm")) sessionStorage.setItem("dx-utm", JSON.stringify(got));
    } catch (e) {}
  })();
  function phoneDigits(p) { return String(p || "").replace(/\D/g, ""); }
  function utm() { try { return JSON.parse(sessionStorage.getItem("dx-utm") || "{}"); } catch (e) { return {}; } }

  /* Поля формы → заявка CRM: вид (ремонт / покупка / Trade-In), что чинить или что хочет купить, бюджет, метки */
  function toCrm(d, u) {
    var svc = String(d.service || ""), form = String(d.form || "");
    var kind = /trade-?in/i.test(svc + " " + form) ? "tradein"
             : (/^(Покупка|Новый:|Б\/у:)/.test(svc) || /бронь/i.test(form)) ? "sale" : "repair";
    var body = { name: d.name || "Клиент с сайта", phone: d.phone, kind: kind, branch: d.branch };
    if (kind === "repair") body.device = d.device;
    else if (/бронь/i.test(form)) body.want = svc || d.device;        // каталог: что бронирует
    else if (kind === "sale") body.want = d.device;
    else body.device = d.device;                                       // Trade-In: что сдаёт → на что меняет
    if (d.amount) body.budget = String(d.amount);
    var note = [d.comment, kind === "repair" && svc && svc !== "Ремонт" && svc !== d.device ? svc : "", form + " · " + location.pathname];
    body.comment = note.filter(Boolean).join("\n");
    if (u.utm_source) body.utm_source = u.utm_source;
    var camp = [u.utm_campaign, u.utm_content].filter(Boolean).join(" / ");
    if (camp) body.utm_campaign = camp;
    if (!u.utm_source && (u.yclid || u.gclid)) body.utm_source = u.yclid ? "yandex" : "google";
    return body;
  }
  function sendBackup(data, u) {
    var body = { lead_id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), page: location.pathname, channel: "site" };
    Object.keys(data || {}).forEach(function (k) { if (data[k] != null && data[k] !== "") body[k] = data[k]; });
    Object.keys(u).forEach(function (k) { body[k] = u[k]; });
    var url = LEAD_URL + "?key=" + encodeURIComponent(SITE_KEY);
    var opts = { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) };
    return fetch(url, opts).then(function () { return { ok: true, backup: true }; }, function () { return { ok: false, error: "network" }; });
  }
  function sendLead(data) {
    var u = utm();
    if (!CRM.key) return sendBackup(data, u);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 12000);
    return fetch(CRM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CRM.key },
      body: JSON.stringify(toCrm(data || {}, u)),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok && j.ok !== false) return { ok: true, id: j.id };
        if (r.status === 422) return { ok: false, error: j.error || "rejected" };   // ошибка в данных — повтор не поможет
        return sendBackup(data, u);                                               // ключ, сервер — запасной путь
      });
    }, function () { if (timer) clearTimeout(timer); return sendBackup(data, u); });  // сеть/CORS — запасной путь
  }
  function validPhone(p) { var d = phoneDigits(p); return d.length === 11 && d[0] === "7"; }

  /* Общее окно записи из шапки (в подвале на каждой странице) */
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.matches || !f.matches("form[data-dx-lead]")) return;
    e.preventDefault();
    var box = f.closest(".dx-modal-box") || f.parentNode, st = box.querySelector("[data-dx-lead-status]"), ph = f.elements["dx-g-phone"];
    if (!validPhone(ph.value)) { ph.setAttribute("aria-invalid", "true"); ph.focus(); return; }
    ph.removeAttribute("aria-invalid");
    if (!f.elements["dx-g-agree"].checked) { f.elements["dx-g-agree"].focus(); return; }
    var kind = (f.querySelector('input[name="dx-g-kind"]:checked') || {}).value || "Ремонт";
    var btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
    sendLead({ form: "Шапка: " + kind, branch: (f.querySelector('input[name="dx-g-branch"]:checked') || {}).value,
               name: f.elements["dx-g-name"].value.trim(), phone: ph.value, device: f.elements["dx-g-device"].value.trim(), service: kind })
      .then(function (res) {
        btn.disabled = false; st.hidden = false;
        if (res.ok) { f.hidden = true; st.setAttribute("data-kind", "ok"); st.textContent = "Заявка принята. Менеджер перезвонит в течение 15 минут в рабочее время."; f.reset(); }
        else { st.setAttribute("data-kind", "err"); st.textContent = "Не удалось отправить. Позвоните +7 (922) 025-21-21 или напишите в Telegram @displexpoint."; }
      });
  });

  /* Подсказка в поле «Устройство» зависит от типа заявки */
  var KIND_TEXT = {
    "Ремонт":   ["Устройство и что случилось", "Например, iPhone 13 — разбит дисплей"],
    "Покупка":  ["Что хотите купить", "Например, iPhone 17 Pro 256 ГБ, синий"],
    "Trade-In": ["Что сдаёте и на что меняете", "Например, iPhone 13 → хочу обменять на iPhone 15"]
  };
  function syncKind(form) {
    if (!form) return;
    var r = form.querySelector('input[type="radio"][name$="-kind"]:checked'); if (!r) return;
    var txt = KIND_TEXT[r.value]; if (!txt) return;
    var lab = form.querySelector("[data-kind-label]"), inp = form.querySelector("[data-kind-target]");
    if (lab) lab.textContent = txt[0];
    if (inp) inp.placeholder = txt[1];
  }
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches && t.matches('input[type="radio"][name$="-kind"]')) syncKind(t.form || t.closest("form"));
  });

  window.DX = { applyTheme: applyTheme, openModal: openModal, closeModal: closeModal, formatPhone: formatPhone,
                sendLead: sendLead, validPhone: validPhone, store: store, syncKind: syncKind };
})();
