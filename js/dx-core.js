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
    if ((el = t.closest("[data-dx-open]"))) { e.preventDefault(); openModal(el.getAttribute("data-dx-open")); return; }
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

  /* ---------- Заявки → Apps Script (таблица «Заявки» + Telegram-группа) ---------- */
  var LEAD_URL = "https://script.google.com/macros/s/AKfycby4lhzUgEND7oM160rA49jHts7U9pVs9oHvudcJLNcjh9sHndatdxkKSifXriEBFRW3/exec";
  var SITE_KEY = "ff31fe3064da4188a7ba3e77eb193098";   // публичный ключ сайта, не секрет
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "yclid", "gclid"];
  (function rememberUtm() {                            // первая метка визита живёт до закрытия вкладки
    try {
      var q = new URLSearchParams(location.search), got = {};
      UTM.forEach(function (k) { if (q.get(k)) got[k] = q.get(k); });
      if (Object.keys(got).length && !sessionStorage.getItem("dx-utm")) sessionStorage.setItem("dx-utm", JSON.stringify(got));
    } catch (e) {}
  })();
  function phoneDigits(p) { return String(p || "").replace(/\D/g, ""); }
  function sendLead(data) {
    var body = { lead_id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                 page: location.pathname, channel: "site" };
    Object.keys(data || {}).forEach(function (k) { if (data[k] != null && data[k] !== "") body[k] = data[k]; });
    try { var u = JSON.parse(sessionStorage.getItem("dx-utm") || "{}"); Object.keys(u).forEach(function (k) { body[k] = u[k]; }); } catch (e) {}
    var url = LEAD_URL + "?key=" + encodeURIComponent(SITE_KEY);
    var opts = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) };
    return fetch(url, opts).then(function (r) { return r.json(); }).then(
      function (j) { return j && j.ok === false ? { ok: false, error: j.error || "rejected" } : { ok: true, id: body.lead_id }; },
      function () {                                     // ответ не прочитать (сеть/CORS) — отправляем вслепую, дубль отсечёт lead_id
        opts.mode = "no-cors";
        return fetch(url, opts).then(function () { return { ok: true, id: body.lead_id, blind: true }; },
                                     function () { return { ok: false, error: "network" }; });
      });
  }
  function validPhone(p) { var d = phoneDigits(p); return d.length === 11 && d[0] === "7"; }

  window.DX = { applyTheme: applyTheme, openModal: openModal, closeModal: closeModal, formatPhone: formatPhone,
                sendLead: sendLead, validPhone: validPhone, store: store };
})();
