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

  /* ---------- Движение: появление блоков, шапка, тема, FAQ ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // «Новое значение всплывает»: DX.swap(el) — для цены в калькуляторе, таблиц и т. п.
  function swap(el, cls) { if (!el || reduce) return; cls = cls || "dx-swap"; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  var RV_SEL = [".dx-section .dx-h2", ".dx-head-split", ".dx-card", ".dx-offer", ".dx-stats > div", ".dx-table-wrap", ".dx-branch-card",
                ".dx-panel-dark", ".dx-faq", ".dx-seo > p", ".dx-reviews", ".dx-rating", ".dx-rl-grid > a", ".dx-footer-grid > div", ".dx-calc", ".dx-skel"].join(",");
  var rvIO = !reduce && "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); rvIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }) : null;
  function reveal(scope, initial) {
    if (!rvIO) return;
    var list = [];
    if (scope.matches && scope.matches(RV_SEL)) list.push(scope);
    if (scope.querySelectorAll) list = list.concat([].slice.call(scope.querySelectorAll(RV_SEL)));
    var vh = window.innerHeight || 800;
    list.forEach(function (el) {
      if (el.classList.contains("dx-rv") || !el.closest(".dx-root") || el.closest(".dx-modal, .dx-mp-pop, .dx-hero-top")) return;
      if (el.parentElement && el.parentElement.closest(".dx-rv")) return;              // родитель уже появляется — не дублируем
      if (initial && el.getBoundingClientRect().top < vh * 0.92) return;               // первый экран показываем сразу
      var sib = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--dx-i", Math.min(sib, 6));
      el.classList.add("dx-rv"); rvIO.observe(el);
    });
  }
  function initMotion() {
    reveal(document.body, true);
    if (rvIO && window.MutationObserver) {                                            // карточки каталога и витрины приходят позже
      var queue = [], busy = false;
      new MutationObserver(function (ms) {
        ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) queue.push(n); }); });
        if (!busy && queue.length) { busy = true; requestAnimationFrame(function () { var q = queue; queue = []; busy = false; q.forEach(function (n) { if (n.isConnected) reveal(n, false); }); }); }
      }).observe(document.body, { childList: true, subtree: true });
    }
    var hdr = document.querySelector(".dx-header");
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle("is-scrolled", (window.scrollY || window.pageYOffset) > 8); };
      window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMotion); else initMotion();

  // Плавная смена темы: на время переключения включаем переходы цветов
  document.addEventListener("click", function (e) {
    if (reduce || !e.target.closest || !e.target.closest("[data-dx-theme-set]")) return;
    root.classList.add("dx-theme-anim"); clearTimeout(root._dxT);
    root._dxT = setTimeout(function () { root.classList.remove("dx-theme-anim"); }, 420);
  }, true);

  // Частые вопросы (<details>): плавное раскрытие и закрытие
  document.addEventListener("click", function (e) {
    var s = e.target.closest && e.target.closest(".dx-faq summary");
    if (!s || reduce || !s.parentElement.animate) return;
    var d = s.parentElement; e.preventDefault();
    if (d._dxAnim) d._dxAnim.cancel();
    var from = d.offsetHeight;
    if (d.open) {
      var to = s.offsetHeight + parseFloat(getComputedStyle(d).paddingTop) + parseFloat(getComputedStyle(d).paddingBottom);
      d._dxAnim = d.animate({ height: [from + "px", to + "px"] }, { duration: 260, easing: "cubic-bezier(.4,0,.2,1)" });
      d._dxAnim.onfinish = function () { d.open = false; d._dxAnim = null; };
    } else {
      d.open = true; var end = d.offsetHeight;
      d._dxAnim = d.animate({ height: [from + "px", end + "px"] }, { duration: 300, easing: "cubic-bezier(.2,.7,.2,1)" });
      d._dxAnim.onfinish = function () { d._dxAnim = null; };
    }
  });

  /* Названия цветов для посетителя — по-русски, как на карточках-картинках. В данных и выборе остаются английские */
  var COLOR_RU = {
    "black": "Чёрный", "jet black": "Чёрный оникс", "space black": "Космический чёрный", "midnight": "Тёмная ночь", "space gray": "Серый космос",
    "white": "Белый", "cloud white": "Облачно-белый", "starlight": "Сияющая звезда", "silver": "Серебристый", "natural": "Натуральный",
    "blue": "Синий", "deep blue": "Глубокий синий", "mist blue": "Туманно-голубой", "sky blue": "Небесно-голубой", "glacier": "Ледниковый",
    "ultramarine": "Ультрамарин", "teal": "Бирюзовый", "green": "Зелёный", "sage": "Шалфейный", "pink": "Розовый",
    "rose gold": "Розовое золото", "lavender": "Лавандовый", "purple": "Фиолетовый", "yellow": "Жёлтый", "citrus": "Цитрусовый",
    "orange": "Оранжевый", "cosmic orange": "Космический оранжевый", "gold": "Золотой", "light gold": "Светло-золотой", "desert": "Пустынный",
    "bronze": "Бронзовый", "burgundy": "Бордовый", "red": "Красный", "graphite": "Графитовый", "slate": "Сланцевый", "indigo": "Индиго", "blush": "Румяный"
  };
  function colorRu(c) { return COLOR_RU[String(c || "").toLowerCase()] || c || ""; }

  /* ---------- Выбор модели: список с группами по сериям и поиском ----------
     Подключается сам к полям выбора модели. Родной <select> остаётся в разметке (скрыт): его заполняют
     и читают другие скрипты, а сюда мы только пишем value и шлём change. Для поля Trade-In (<input>)
     — подсказки по мере ввода, свободный текст тоже принимается. На телефоне список — шторка снизу. */
  var MP_SELECT = "select[data-calc-model], select[data-p-model], select[data-dx-model]";
  var MP_INPUT = 'input[name="dx-ti-model"], input[data-dx-model]';
  var TI_MODELS = ["iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone Air", "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17", "iPhone 17e",
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e", "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE (2022)", "iPhone SE (2020)", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X"];
  var mpUid = 0;
  function mpEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mpGroup(m) {
    var w = m.match(/Watch\s+(S\d+|SE|Ultra\s*\d*)/i); if (w) return "Apple Watch " + w[1];
    if (/iPhone\s+Air/i.test(m)) return "iPhone Air";
    if (/iPhone\s+SE/i.test(m)) return "iPhone SE";
    if (/iPhone\s+X/i.test(m)) return "iPhone X / XS / XR";
    var n = m.match(/iPhone\s+(\d+)/i); if (!n) return "";
    return n[1] === "7" || n[1] === "8" ? "iPhone 7 / 8" : "iPhone " + n[1];
  }
  var MP_RU = { "айфон": "iphone", "про": "pro", "макс": "max", "мини": "mini", "плюс": "plus", "эйр": "air", "эир": "air",
                "часы": "watch", "вотч": "watch", "ультра": "ultra", "се": "se", "икс": "x", "иксэс": "xs", "иксэр": "xr" };
  function mpNorm(s) {
    return String(s).toLowerCase().replace(/ё/g, "е").replace(/мм/g, "").replace(/[()]/g, " ")
      .replace(/(\d)([a-zа-я])/g, "$1 $2").replace(/\s+/g, " ").trim();
  }
  function mpWords(w) {                       // русское слово или его начало → варианты на латинице («п» → pro, «м» → max/mini)
    if (!/[а-я]/.test(w)) return [w];
    var out = []; Object.keys(MP_RU).forEach(function (k) { if (k.indexOf(w) === 0 && out.indexOf(MP_RU[k]) < 0) out.push(MP_RU[k]); });
    return out.length ? out : [w];
  }
  function mpMatch(text, q) {
    var t = " " + mpNorm(text);
    return mpNorm(q).split(" ").every(function (w) {
      return !w || mpWords(w).some(function (v) { return t.indexOf(" " + v) >= 0; });
    });
  }
  function mpMark(text, q) {
    var out = mpEsc(text);
    mpNorm(q).split(" ").filter(Boolean).forEach(function (w) {
      mpWords(w).some(function (v) {
        var re = new RegExp("(^|[\\s(])(" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "i");
        if (!re.test(out)) return false;
        out = out.replace(re, "$1<mark>$2</mark>"); return true;
      });
    });
    return out;
  }
  function mpIcon(m) {
    if (/Watch/i.test(m)) return '<svg class="dx-mp-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="14" rx="3.5"/><path d="M8.5 5l.8-3h5.4l.8 3M8.5 19l.8 3h5.4l.8-3"/></svg>';
    var h = /Max|Plus/i.test(m) ? 20 : /mini|SE/i.test(m) ? 15 : 18, y = (24 - h) / 2;
    return '<svg class="dx-mp-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="' + (12 - h / 4) + '" y="' + y + '" width="' + h / 2 + '" height="' + h + '" rx="2.6"/><path d="M10.6 ' + (y + 1.8) + 'h2.8"/></svg>';
  }
  var MP_CHEV = '<svg class="dx-mp-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5l5-5"/></svg>';
  var MP_TICK = '<svg class="dx-mp-tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  var MP_LOUPE = '<svg class="dx-mp-ico" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>';
  var mpSheet = window.matchMedia ? window.matchMedia("(max-width: 640px)") : { matches: false };
  var mpOpen = null;

  function ModelPicker(field) {
    var isSel = field.tagName === "SELECT", id = "dx-mp-" + (++mpUid), self = this;
    var wrap = document.createElement("div"); wrap.className = "dx-mp" + (isSel ? "" : " dx-mp--input");
    var host = isSel && field.closest("label");          // внутри <label> клик по списку снова «нажимал» бы кнопку — выносим рядом
    var hostText = host ? host.textContent.trim() : "";
    if (host) host.parentNode.insertBefore(wrap, host.nextSibling); else field.parentNode.insertBefore(wrap, field);
    var trig, search;
    if (isSel) {
      trig = document.createElement("button"); trig.type = "button"; trig.className = "dx-mp-trigger"; trig.id = id + "-t";
      trig.setAttribute("aria-haspopup", "listbox"); trig.setAttribute("aria-expanded", "false");
      wrap.appendChild(trig); wrap.appendChild(field);
      field.classList.add("dx-mp-native"); field.tabIndex = -1; field.setAttribute("aria-hidden", "true");
      var lab = field.id && document.querySelector('label[for="' + field.id + '"]');
      if (lab) lab.htmlFor = trig.id;
      var lt = lab ? lab.textContent.trim() : hostText;
      if (lt) trig.setAttribute("aria-label", lt);
      if (host) host.hidden = true;
    } else {
      wrap.appendChild(field); trig = field;
      field.setAttribute("autocomplete", "off"); field.setAttribute("role", "combobox");
      field.setAttribute("aria-autocomplete", "list"); field.setAttribute("aria-expanded", "false");
    }
    var scrim = document.createElement("div"); scrim.className = "dx-mp-scrim";
    var pop = document.createElement("div"); pop.className = "dx-mp-pop";
    pop.innerHTML = (isSel ? '<div class="dx-mp-handle"></div><div class="dx-mp-search">' + MP_LOUPE + '<input type="search" placeholder="Найти модель" aria-label="Найти модель" autocomplete="off" enterkeyhint="done"></div>' : "") +
      '<div class="dx-mp-list" role="listbox" id="' + id + '-l"></div>';
    wrap.appendChild(scrim); wrap.appendChild(pop);
    var list = pop.querySelector(".dx-mp-list"); search = pop.querySelector("input");
    trig.setAttribute("aria-controls", id + "-l");
    var act = -1;

    function items() {
      if (!isSel) return TI_MODELS.map(function (m) { return { v: m, t: m }; });
      return [].map.call(field.options, function (o) { return { v: o.value, t: o.textContent }; });
    }
    function value() { return isSel ? field.value : field.value.trim(); }
    function label() {
      if (!isSel) return;
      var o = field.options[field.selectedIndex], t = o ? o.textContent : "";
      trig.innerHTML = (t ? mpIcon(t) : "") + '<span class="dx-mp-val">' + mpEsc(t || "Выберите модель") + "</span>" + MP_CHEV;
      trig.disabled = field.disabled || !field.options.length;
    }
    function opts() { return list.querySelectorAll(".dx-mp-opt"); }
    function render() {
      var q = isSel ? search.value.trim() : field.value.trim(), cur = value(), all = items();
      if (isSel && search) pop.querySelector(".dx-mp-search").hidden = all.length < 9;
      var shown = all.filter(function (it) { return mpMatch(it.t, q); });
      if (!isSel && shown.length === 1 && mpNorm(shown[0].t) === mpNorm(q)) shown = [];   // уже введено точно
      var html = "", g = null, n = 0;
      shown.forEach(function (it) {
        var gg = mpGroup(it.t);
        if (gg && gg !== g) { html += '<div class="dx-mp-group" role="presentation">' + mpEsc(gg) + "</div>"; g = gg; }
        html += '<div class="dx-mp-opt" role="option" id="' + id + "-o" + (n++) + '" data-v="' + mpEsc(it.v) + '" aria-selected="' + (it.v === cur) + '">' +
          mpIcon(it.t) + "<span>" + mpMark(it.t, q) + "</span>" + MP_TICK + "</div>";
      });
      if (!shown.length) html = isSel ? '<div class="dx-mp-empty">Не нашли модель — позвоните, подскажем цену: <a href="tel:+79220252121">+7 922 025-21-21</a></div>' : "";
      list.innerHTML = html;
      if (!isSel) { var has = !!shown.length; wrap.classList.toggle("dx-mp--empty", !has); }
      var sel = list.querySelector('[aria-selected="true"]');
      setAct(q ? 0 : [].indexOf.call(opts(), sel), !q);
    }
    function setAct(i, center) {
      var o = opts(); if (act >= 0 && o[act]) o[act].classList.remove("is-act");
      act = i; trig.removeAttribute("aria-activedescendant");
      if (i < 0 || !o[i]) return;
      o[i].classList.add("is-act"); trig.setAttribute("aria-activedescendant", o[i].id);
      if (center) list.scrollTop = o[i].offsetTop - list.clientHeight / 2 + o[i].offsetHeight / 2;
      else if (o[i].scrollIntoView) o[i].scrollIntoView({ block: "nearest" });
    }
    function open() {
      if (mpOpen && mpOpen !== self) mpOpen.close();
      if (isSel && trig.disabled) return;
      if (search) search.value = "";
      render();
      if (!isSel && !opts().length) return;
      mpOpen = self; wrap.classList.add("is-open"); trig.setAttribute("aria-expanded", "true");
      if (mpSheet.matches && isSel) document.documentElement.classList.add("dx-mp-lock");
      if (isSel && search && !pop.querySelector(".dx-mp-search").hidden && !mpSheet.matches) setTimeout(function () { search.focus(); }, 30);
    }
    function close(refocus) {
      if (!wrap.classList.contains("is-open")) return;
      wrap.classList.remove("is-open"); trig.setAttribute("aria-expanded", "false"); trig.removeAttribute("aria-activedescendant");
      document.documentElement.classList.remove("dx-mp-lock");
      if (mpOpen === self) mpOpen = null;
      if (refocus && isSel) trig.focus();
    }
    function pick(v) {
      if (field.value !== v) {
        field.value = v;
        field.dispatchEvent(new Event(isSel ? "change" : "input", { bubbles: true }));
        if (!isSel) field.dispatchEvent(new Event("change", { bubbles: true }));
      }
      label(); close(true);
    }
    function key(e) {
      var o = opts(), isOpen = wrap.classList.contains("is-open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) { open(); return; }
        setAct(e.key === "ArrowDown" ? Math.min(o.length - 1, act + 1) : Math.max(0, act - 1));
      } else if (e.key === "Home" && isOpen && isSel) { e.preventDefault(); setAct(0); }
      else if (e.key === "End" && isOpen && isSel) { e.preventDefault(); setAct(o.length - 1); }
      else if (e.key === "Enter" && isOpen && o[act]) { e.preventDefault(); pick(o[act].getAttribute("data-v")); }
      else if (e.key === "Escape" && isOpen) { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === "Tab" && isOpen) close();
      else if (isSel && !isOpen && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {   // начали печатать на кнопке — открываем с поиском
        open(); if (search && !pop.querySelector(".dx-mp-search").hidden) { search.value = e.key; render(); search.focus(); e.preventDefault(); }
      }
    }
    if (isSel) {
      trig.addEventListener("click", function () { wrap.classList.contains("is-open") ? close(true) : open(); });
      trig.addEventListener("keydown", key);
      search.addEventListener("keydown", key);
      search.addEventListener("input", render);
    } else {
      field.addEventListener("focus", open);
      field.addEventListener("click", open);
      field.addEventListener("keydown", key);
      field.addEventListener("input", function () { if (wrap.classList.contains("is-open")) render(); else open(); });
    }
    list.addEventListener("mousedown", function (e) { if (!isSel) e.preventDefault(); });   // не терять фокус поля
    list.addEventListener("click", function (e) { var o = e.target.closest(".dx-mp-opt"); if (o) pick(o.getAttribute("data-v")); });
    list.addEventListener("mousemove", function (e) { var o = e.target.closest(".dx-mp-opt"); if (o && !o.classList.contains("is-act")) setAct([].indexOf.call(opts(), o)); });
    scrim.addEventListener("click", function () { close(); });
    if (isSel) {
      field.addEventListener("change", label);
      new MutationObserver(label).observe(field, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
      label();
    }
    this.close = close; this.wrap = wrap; this.sync = label;
    field._dxMp = this;
  }
  document.addEventListener("click", function (e) { if (mpOpen && !mpOpen.wrap.contains(e.target)) mpOpen.close(); });
  function initPickers(scope) {
    (scope || document).querySelectorAll(MP_SELECT + ", " + MP_INPUT).forEach(function (f) { if (!f._dxMp) new ModelPicker(f); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { initPickers(); });
  else initPickers();

  window.DX = { applyTheme: applyTheme, openModal: openModal, closeModal: closeModal, formatPhone: formatPhone,
                sendLead: sendLead, validPhone: validPhone, store: store, syncKind: syncKind, initPickers: initPickers, colorRu: colorRu, swap: swap };
})();
