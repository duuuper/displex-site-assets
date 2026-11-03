/* Displex · каталог · dx-catalog.js
   Один скрипт на 7 страниц. Корень: <div data-dx-catalog="all|iphone|mac|ipad|watch|airpods|used">.
   Данные: https://displex.su/site/new.json и used.json (только розница, без закупки и IMEI).
   Кэш в localStorage: показываем сразу, обновляем в фоне. */
(function () {
  "use strict";
  var root = document.querySelector("[data-dx-catalog]");
  if (!root) return;
  var PAGE = root.getAttribute("data-dx-catalog") || "all";
  var API = "https://displex.su/site/";
  var CACHE_KEY = "dx-cat-v1", CACHE_FRESH = 60 * 1000;

  var CATS = {
    iphone: { name: "iPhone", url: "/catalog/iphone" },
    mac: { name: "Mac", url: "/catalog/mac" },
    ipad: { name: "iPad", url: "/catalog/ipad" },
    watch: { name: "Apple Watch", url: "/catalog/watch" },
    airpods: { name: "AirPods", url: "/catalog/airpods" }
  };
  var USED_URL = "/catalog/used";
  var BRANCHES = ["Репина, 94", "Красный пер., 12"];

  /* Цвета Apple → HEX для кружков */
  var HEX = {
    "black": "#1d1d1f", "jet black": "#0b0b0c", "space black": "#2b2b2d", "midnight": "#232a35", "space gray": "#6e6e73",
    "white": "#f2f2f2", "cloud white": "#f4f4f2", "starlight": "#ece6dc", "silver": "#dcdddf", "natural": "#bdb7ab",
    "blue": "#9fb3cf", "deep blue": "#2b3b56", "mist blue": "#a9bccf", "sky blue": "#bcd2e6", "glacier": "#cfe0ea",
    "ultramarine": "#7884e0", "teal": "#86b7ae", "green": "#adc7ab", "sage": "#b5bfa5", "pink": "#efc9cf",
    "rose gold": "#e6c3b7", "lavender": "#c9bfe0", "purple": "#c5b3d9", "yellow": "#f2e08f", "citrus": "#e3e48a",
    "orange": "#f08a3c", "cosmic orange": "#ef7d32", "gold": "#e8d3ad", "light gold": "#efe2c6", "desert": "#cdb79e",
    "bronze": "#8d6e5a", "burgundy": "#6b2433", "red": "#c8102e", "graphite": "#55565a", "slate": "#5d6168", "indigo": "#4a5a8a", "blush": "#f1cfd0"
  };
  function hex(c) { return HEX[String(c || "").toLowerCase()] || "#c7c7cc"; }

  /* ---------- утилиты ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rub(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽"; }
  function gb(s) { var m = String(s || "").match(/(\d+)\s*(ТБ|TB)/i); if (m) return +m[1] * 1024; m = String(s || "").match(/(\d+)/); return m ? +m[1] : 0; }
  function memKey(s) { var p = String(s || "").split("/"); return p.length > 1 ? gb(p[0]) * 100000 + gb(p[1]) : gb(s); }
  function $(sel, el) { return (el || root).querySelector(sel); }

  /* Поколение модели — для сортировки «сначала новые» */
  function gen(model, cat) {
    var m = String(model);
    if (cat === "mac") { var c = m.match(/\bM(\d)/); return c ? +c[1] * 10 + (/Pro/.test(m) ? 2 : /Air/.test(m) ? 1 : 0) : 0; }
    if (cat === "watch") { var u = m.match(/Ultra (\d+)/); if (u) return 8 + +u[1] + 0.5; var s = m.match(/Series (\d+)/); if (s) return +s[1]; var se = m.match(/SE (\d+)/); return se ? 7 + +se[1] : 0; }
    if (cat === "ipad") { var chip = m.match(/\bM(\d)/); var tier = /Pro/.test(m) ? 3 : /Air/.test(m) ? 2 : /mini/.test(m) ? 1 : 0; return tier * 10 + (chip ? +chip[1] : 0); }
    if (cat === "iphone") {
      if (/Air/.test(m)) return 17.4;
      var n = m.match(/(\d+)/); var g = n ? +n[1] : 0;
      var tier = /Pro Max/.test(m) ? 0.3 : /Pro/.test(m) ? 0.2 : /Plus/.test(m) ? 0.1 : /\d+e\b/.test(m) ? -0.2 : 0;
      return g + tier;
    }
    var any = m.match(/(\d+)/); return (any ? +any[1] : 0) + (/Max/.test(m) ? 10 : /Pro/.test(m) ? 5 : 0);
  }
  /* Семейство — для фильтра внутри категории */
  function family(model, cat) {
    var m = String(model);
    if (cat === "iphone") { if (/Air/.test(m)) return "iPhone Air"; var n = m.match(/iPhone (\d+)/); return n ? "iPhone " + n[1] : m; }
    if (cat === "mac") return /Neo/.test(m) ? "MacBook Neo" : /Pro/.test(m) ? "MacBook Pro" : /Air/.test(m) ? "MacBook Air" : "Mac";
    if (cat === "watch") return /Ultra/.test(m) ? "Ultra" : /SE/.test(m) ? "SE" : "Series";
    if (cat === "ipad") return /Pro/.test(m) ? "iPad Pro" : /Air/.test(m) ? "iPad Air" : /mini/.test(m) ? "iPad mini" : "iPad";
    if (cat === "airpods") return /Max/.test(m) ? "AirPods Max" : /Pro/.test(m) ? "AirPods Pro" : "AirPods";
    return m;
  }

  /* Силуэт вместо фото */
  var SIL = {
    iphone: '<rect x="52" y="10" width="56" height="100" rx="10"/><path d="M72 18h16"/>',
    mac: '<rect x="34" y="24" width="92" height="60" rx="5"/><path d="M22 92h116l-6 8H28z"/>',
    ipad: '<rect x="38" y="14" width="84" height="92" rx="8"/>',
    watch: '<rect x="56" y="34" width="48" height="54" rx="12"/><path d="M64 34l4-18h24l4 18M64 88l4 18h24l4-18"/>',
    airpods: '<path d="M48 70V58a32 32 0 0 1 64 0v12"/><rect x="38" y="66" width="20" height="32" rx="8"/><rect x="102" y="66" width="20" height="32" rx="8"/>'
  };
  function silhouette(cat) {
    return '<svg viewBox="0 0 160 120" width="160" height="120" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" opacity=".3" aria-hidden="true">' + (SIL[cat] || SIL.iphone) + "</svg>";
  }

  /* ---------- состояние ---------- */
  var DATA = { fresh: [], used: [], newDay: "", updated: 0 };
  var groups = [];          // новые, сгруппированные по модели
  var usedList = [];        // б/у
  var sel = {};             // выбранный вариант по группе
  var gal = {};             // номер фото б/у
  var q = new URLSearchParams(location.search);
  var state = { f: q.get("f") || "", q: q.get("q") || "", sort: q.get("sort") || "new", cat: q.get("cat") || "" };

  var DIMS = { iphone: ["color", "memory", "sim"], ipad: ["color", "memory"], mac: ["color", "memory"],
               watch: ["size", "color", "strap"], airpods: ["color"] };
  var DIM_LABEL = { color: "Цвет", memory: "Память", sim: "SIM", size: "Корпус", strap: "Ремешок" };

  function buildGroups(items) {
    var map = {}, out = [];
    items.forEach(function (it) {
      var k = it.cat + "|" + it.model + (it.cat === "ipad" ? "|" + (it.net || "") : "");
      if (!map[k]) { map[k] = { key: k, cat: it.cat, model: it.model, net: it.net || "", items: [] }; out.push(map[k]); }
      map[k].items.push(it);
    });
    out.forEach(function (g) {
      g.min = Math.min.apply(null, g.items.map(function (i) { return i.price; }));
      g.max = Math.max.apply(null, g.items.map(function (i) { return i.price; }));
      g.gen = gen(g.model, g.cat);
      g.family = family(g.model, g.cat);
      g.title = g.model + (g.cat === "ipad" && g.net ? " · " + g.net : "");
      g.dims = (DIMS[g.cat] || ["color"]).map(function (d) {
        var vals = [];
        g.items.forEach(function (i) { if (i[d] && vals.indexOf(i[d]) < 0) vals.push(i[d]); });
        if (d === "memory" || d === "size") vals.sort(function (a, b) { return memKey(a) - memKey(b); });
        return { key: d, vals: vals };
      }).filter(function (d) { return d.vals.length > 0; });
      var cheapest = g.items.slice().sort(function (a, b) { return a.price - b.price; })[0];
      g.pick = cheapest;
    });
    return out;
  }

  function variantFor(g, choice) {         // choice: {dim: value}
    var exact = g.items.filter(function (i) { return Object.keys(choice).every(function (d) { return i[d] === choice[d]; }); });
    if (exact.length) return exact.sort(function (a, b) { return a.price - b.price; })[0];
    return null;
  }
  function pickDim(g, dim, val) {
    var cur = sel[g.key] || g.pick, choice = {};
    g.dims.forEach(function (d) { choice[d.key] = cur[d.key]; });
    choice[dim] = val;
    var v = variantFor(g, choice);
    if (!v) {                               // такой комбинации нет — берём самый дешёвый с выбранным значением
      v = g.items.filter(function (i) { return i[dim] === val; }).sort(function (a, b) { return a.price - b.price; })[0];
    }
    if (v) sel[g.key] = v;
  }

  /* ---------- фильтры ---------- */
  function visibleCat() { return PAGE === "all" || PAGE === "used" ? state.cat : PAGE; }
  function match(text) {
    if (!state.q) return true;
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    text = text.toLowerCase();
    return words.every(function (w) { return text.indexOf(w) >= 0; });
  }
  function sorter(a, b) {
    if (state.sort === "cheap") return a.min - b.min;
    if (state.sort === "dear") return b.min - a.min;
    return (b.gen - a.gen) || (a.min - b.min);
  }
  function filteredGroups() {
    var c = visibleCat();
    return groups.filter(function (g) {
      return (!c || g.cat === c) && (!state.f || g.family === state.f) &&
        match([g.model, g.net].concat(g.items.map(function (i) { return [i.color, i.memory, i.sim].join(" "); })).join(" "));
    }).sort(sorter);
  }
  function filteredUsed() {
    var c = visibleCat();
    return usedList.filter(function (u) {
      return (!c || u.cat === c) && (!state.f || u.family === state.f) && match([u.model, u.memory, u.color].join(" "));
    }).sort(sorter);
  }

  /* ---------- отрисовка карточек ---------- */
  function cardNew(g) {
    var v = sel[g.key] || g.pick;
    var media = v.photo
      ? '<img src="' + esc(v.photo) + '" alt="' + esc(g.title + ", " + v.color) + '" loading="lazy" decoding="async" width="400" height="300" data-dx-fallback="' + g.cat + '">'
      : silhouette(g.cat);
    var dims = g.dims.map(function (d) {
      if (d.vals.length < 2) return "";
      var html = d.vals.map(function (val) {
        var on = v[d.key] === val;
        var choice = {}; g.dims.forEach(function (x) { choice[x.key] = v[x.key]; }); choice[d.key] = val;
        var off = !variantFor(g, choice);
        if (d.key === "color") {
          return '<button class="dx-swatch" type="button" data-g="' + esc(g.key) + '" data-d="color" data-v="' + esc(val) + '" aria-pressed="' + on + '"' +
            (off ? ' data-off="true"' : "") + ' aria-label="' + esc(val) + '" title="' + esc(val) + '" style="background:' + hex(val) + '"></button>';
        }
        return '<button class="dx-opt" type="button" data-g="' + esc(g.key) + '" data-d="' + d.key + '" data-v="' + esc(val) + '" aria-pressed="' + on + '"' +
          (off ? ' data-off="true"' : "") + ">" + esc(val) + "</button>";
      }).join("");
      return '<div class="dx-dim"><span class="dx-dim-label">' + DIM_LABEL[d.key] + (d.key === "color" ? ": " + esc(v.color) : "") + '</span><div class="' +
        (d.key === "color" ? "dx-swatches" : "dx-opts") + '" role="group" aria-label="' + DIM_LABEL[d.key] + '">' + html + "</div></div>";
    }).join("");
    var single = g.dims.filter(function (d) { return d.vals.length === 1; }).map(function (d) { return d.vals[0]; }).join(" · ");
    return '<article class="dx-card dx-pcard" data-key="' + esc(g.key) + '">' +
      '<div class="dx-card-media">' + media + "</div>" +
      '<div class="dx-chips" style="gap:6px"><span class="dx-badge dx-badge--stock">В наличии</span><span class="dx-badge dx-badge--new">Новый</span></div>' +
      '<h3 class="dx-card-title">' + esc(g.title) + "</h3>" +
      (single ? '<p class="dx-card-meta">' + esc(single) + "</p>" : "") + dims +
      '<div class="dx-card-row"><span class="dx-price dx-price--lg">' + rub(v.price) + "</span>" +
      (v.price > g.min ? '<span class="dx-tiny dx-text-muted">от ' + rub(g.min) + "</span>" : "") + "</div>" +
      '<div class="dx-card-actions"><button class="dx-btn dx-btn--primary dx-btn--sm" type="button" data-book="new" data-g="' + esc(g.key) + '">Забронировать</button></div>' +
      "</article>";
  }

  function batt(b) {
    var n = parseInt(b, 10);
    if (!n) return esc(b || "—");
    return '<span class="dx-batt"><span class="dx-batt-bar"><i style="width:' + Math.max(8, Math.min(100, n)) + '%"></i></span>' + esc(b) + "</span>";
  }
  function cardUsed(u) {
    var i = gal[u.id] || 0, photos = u.photos || [];
    var media = photos.length
      ? '<img src="' + esc(photos[i]) + '" alt="' + esc(u.model + ", фото " + (i + 1)) + '" loading="lazy" decoding="async" width="400" height="300" data-dx-fallback="' + u.cat + '">' +
        (photos.length > 1 ? '<div class="dx-gal-nav"><button type="button" data-gal="' + u.id + '" data-step="-1" aria-label="Предыдущее фото">‹</button><button type="button" data-gal="' + u.id + '" data-step="1" aria-label="Следующее фото">›</button></div>' +
          '<div class="dx-gal-dots" aria-hidden="true">' + photos.map(function (_, k) { return '<i data-on="' + (k === i) + '"></i>'; }).join("") + "</div>" : "")
      : silhouette(u.cat);
    var br = u.branch == null ? "Оба филиала" : BRANCHES[u.branch] || "";
    var head = u.model + (u.memory ? " · " + u.memory : "");
    return '<article class="dx-card dx-pcard">' +
      '<div class="dx-card-media dx-card-media--photo">' + media + "</div>" +
      '<div class="dx-chips" style="gap:6px"><span class="dx-badge dx-badge--used">Б/у</span>' + (br ? '<span class="dx-badge">' + esc(br) + "</span>" : "") + "</div>" +
      '<h3 class="dx-card-title">' + esc(head) + "</h3>" +
      '<dl class="dx-specs">' +
      (u.color ? "<dt>Цвет</dt><dd>" + esc(u.color) + "</dd>" : "") +
      (u.sim ? "<dt>SIM</dt><dd>" + esc(u.sim) + "</dd>" : "") +
      (u.battery ? "<dt>Аккумулятор</dt><dd>" + batt(u.battery) + "</dd>" : "") +
      (u.condition ? '<dt>Состояние</dt><dd title="' + esc(u.condition_desc) + '">' + esc(u.condition) + "</dd>" : "") +
      "<dt>Комплект</dt><dd>" + esc((u.kit && u.kit.length ? u.kit.join(", ") : "только устройство")) + "</dd>" +
      (u.warranty ? "<dt>Гарантия</dt><dd>" + esc(u.warranty) + "</dd>" : "") +
      "</dl>" + (u.note ? '<p class="dx-small dx-text-muted">' + esc(u.note) + "</p>" : "") +
      '<div class="dx-card-row"><span class="dx-price dx-price--lg">' + rub(u.price) + "</span></div>" +
      '<div class="dx-card-actions"><button class="dx-btn dx-btn--primary dx-btn--sm" type="button" data-book="used" data-id="' + esc(u.id) + '">Забронировать</button></div>' +
      "</article>";
  }

  /* ---------- вывод страницы ---------- */
  var grid = $("[data-dx-grid]"), countEl = $("[data-dx-count]"), famEl = $("[data-dx-families]");
  function renderFamilies() {
    if (!famEl) return;
    var base = PAGE === "used" ? usedList : groups;
    var c = visibleCat();
    var chips = [];
    if (PAGE === "all") { famEl.hidden = true; return; }   // на общей странице категории — это табы-ссылки
    if (PAGE === "used") {                              // на б/у — фильтр по категориям
      var counts = {};
      base.forEach(function (x) { counts[x.cat] = (counts[x.cat] || 0) + 1; });
      chips.push('<button class="dx-chip" type="button" data-cat="" aria-pressed="' + (!state.cat) + '">Все <span class="dx-chip-count">' + base.length + "</span></button>");
      Object.keys(CATS).forEach(function (k) {
        if (counts[k]) chips.push('<button class="dx-chip" type="button" data-cat="' + k + '" aria-pressed="' + (state.cat === k) + '">' + CATS[k].name + ' <span class="dx-chip-count">' + counts[k] + "</span></button>");
      });
    } else {                                            // внутри категории — семейства
      var fam = [], fc = {};
      base.filter(function (x) { return x.cat === c; }).sort(function (a, b) { return b.gen - a.gen; }).forEach(function (x) {
        if (!fc[x.family]) { fc[x.family] = 0; fam.push(x.family); } fc[x.family]++;
      });
      if (fam.length > 1) {
        chips.push('<button class="dx-chip" type="button" data-fam="" aria-pressed="' + (!state.f) + '">Все</button>');
        fam.forEach(function (f) { chips.push('<button class="dx-chip" type="button" data-fam="' + esc(f) + '" aria-pressed="' + (state.f === f) + '">' + esc(f) + ' <span class="dx-chip-count">' + fc[f] + "</span></button>"); });
      }
    }
    famEl.innerHTML = chips.join("");
    famEl.hidden = !chips.length;
  }
  function word(n, a, b, c) { n = Math.abs(n) % 100; var n1 = n % 10; return n > 10 && n < 20 ? c : n1 > 1 && n1 < 5 ? b : n1 === 1 ? a : c; }
  function render() {
    renderFamilies();
    var html, n;
    if (PAGE === "used") { var list = filteredUsed(); n = list.length; html = list.map(cardUsed).join(""); }
    else { var gs = filteredGroups(); n = gs.length; html = gs.map(cardNew).join(""); }
    grid.innerHTML = n ? html :
      '<div class="dx-empty" style="grid-column:1/-1"><p class="dx-h3">Ничего не нашли</p><p class="dx-text-muted">Измените запрос или напишите нам: привезём нужную модель под заказ.</p>' +
      '<button class="dx-btn dx-btn--secondary dx-btn--sm" type="button" data-reset>Сбросить фильтры</button></div>';
    if (countEl) {
      var upd = DATA.updated ? new Date(DATA.updated * 1000) : null;
      countEl.textContent = n + " " + (PAGE === "used" ? word(n, "устройство", "устройства", "устройств") : word(n, "модель", "модели", "моделей")) +
        (upd ? " · обновлено " + upd.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) + " в " + upd.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "");
    }
    renderUsedPromo();
    renderLd();
  }
  function renderUsedPromo() {
    var el = $("[data-dx-used-promo]");
    if (!el) return;
    var c = visibleCat();
    var list = usedList.filter(function (u) { return !c || u.cat === c; });
    if (!list.length || PAGE === "used") { el.hidden = true; return; }
    var min = Math.min.apply(null, list.map(function (u) { return u.price; }));
    var name = c ? CATS[c].name : "техника Apple";
    el.innerHTML = '<div><div class="dx-offer-title">Б/у ' + esc(name) + ": " + list.length + " " + word(list.length, "устройство", "устройства", "устройств") + " от " + rub(min) + '</div><div class="dx-small dx-text-muted">Проверены мастером, гарантия Displex</div></div>' +
      '<a class="dx-btn dx-btn--secondary dx-btn--sm" href="' + USED_URL + (c ? "?cat=" + c : "") + '">Смотреть б/у</a>';
    el.hidden = false;
  }
  function renderLd() {                                  // микроразметка Product/Offer
    var items = PAGE === "used" ? filteredUsed().slice(0, 30).map(function (u) {
      return { "@type": "Product", name: u.model + (u.memory ? " " + u.memory : "") + (u.color ? " " + u.color : ""), brand: { "@type": "Brand", name: "Apple" },
        image: (u.photos || [])[0], offers: { "@type": "Offer", price: u.price, priceCurrency: "RUB", availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition", seller: { "@type": "Organization", name: "Displex" } } };
    }) : filteredGroups().slice(0, 40).map(function (g) {
      return { "@type": "Product", name: g.title, brand: { "@type": "Brand", name: "Apple" }, image: g.pick.photo || undefined,
        offers: { "@type": "AggregateOffer", lowPrice: g.min, highPrice: g.max, offerCount: g.items.length, priceCurrency: "RUB",
          availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" } };
    });
    var ld = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: items.map(function (it, k) { return { "@type": "ListItem", position: k + 1, item: it }; }) };
    var s = document.getElementById("dx-ld-catalog");
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = "dx-ld-catalog"; document.head.appendChild(s); }
    s.textContent = JSON.stringify(ld);
  }
  function syncUrl() {
    var p = new URLSearchParams();
    if (state.cat) p.set("cat", state.cat);
    if (state.f) p.set("f", state.f);
    if (state.q) p.set("q", state.q);
    if (state.sort !== "new") p.set("sort", state.sort);
    var s = p.toString();
    try { history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash); } catch (e) {}
  }

  /* ---------- данные ---------- */
  function ingest(fresh, used) {
    DATA.fresh = (fresh && fresh.items) || [];
    DATA.used = (used && used.items) || [];
    DATA.updated = Math.max((fresh && fresh.updated) || 0, (used && used.updated) || 0);
    groups = buildGroups(DATA.fresh);
    usedList = DATA.used.map(function (u) { u.gen = gen(u.model, u.cat); u.family = family(u.model, u.cat); u.min = u.price; return u; });
    render();
  }
  function load() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
    if (cached && cached.fresh) ingest(cached.fresh, cached.used);
    if (cached && Date.now() - cached.t < CACHE_FRESH) return;
    Promise.all([
      fetch(API + "new.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch(API + "used.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    ]).then(function (res) {
      ingest(res[0], res[1]);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), fresh: res[0], used: res[1] })); } catch (e) {}
    }).catch(function () {
      if (!cached) grid.innerHTML = '<div class="dx-empty" style="grid-column:1/-1"><p class="dx-h3">Каталог временно не загрузился</p>' +
        '<p class="dx-text-muted">Обновите страницу или позвоните: +7 (922) 025-21-21, +7 (980) 930-36-20.</p></div>';
    });
  }

  /* ---------- бронь ---------- */
  var modal = document.getElementById("dx-book");
  var booking = null;
  function openBooking(kind, ref) {
    if (!modal) return;
    var title, meta, price, cat;
    if (kind === "new") {
      var g = groups.filter(function (x) { return x.key === ref; })[0]; if (!g) return;
      var v = sel[g.key] || g.pick;
      title = g.title; cat = g.cat; price = v.price;
      meta = [v.color, v.memory, v.sim, v.strap ? "ремешок " + v.strap : ""].filter(Boolean).join(" · ");
    } else {
      var u = usedList.filter(function (x) { return x.id === ref; })[0]; if (!u) return;
      title = u.model + (u.memory ? " · " + u.memory : ""); cat = u.cat; price = u.price;
      meta = ["б/у", u.color, u.battery ? "АКБ " + u.battery : "", u.condition].filter(Boolean).join(" · ");
      var bi = u.branch; if (bi === 0 || bi === 1) { var r = modal.querySelector('input[name="dx-book-branch"][value="' + BRANCHES[bi] + '"]'); if (r) r.checked = true; }
    }
    booking = { title: title, meta: meta, price: price, kind: kind, cat: cat };
    modal.querySelector("[data-book-title]").textContent = title;
    modal.querySelector("[data-book-meta]").textContent = meta + " · " + rub(price);
    var st = modal.querySelector("[data-book-status]"); st.hidden = true;
    modal.querySelector("form").hidden = false;
    window.DX && window.DX.openModal("dx-book");
  }
  function submitBooking(form) {
    var st = modal.querySelector("[data-book-status]");
    var phone = form.elements["dx-book-phone"].value;
    if (!window.DX.validPhone(phone)) { form.elements["dx-book-phone"].setAttribute("aria-invalid", "true"); form.elements["dx-book-phone"].focus(); return; }
    form.elements["dx-book-phone"].removeAttribute("aria-invalid");
    if (!form.elements["dx-book-agree"].checked) { form.elements["dx-book-agree"].focus(); return; }
    var ti = form.elements["dx-book-ti"].checked;
    var comment = ti ? "Trade-In: " + [form.elements["dx-ti-model"].value, form.elements["dx-ti-mem"].value, form.elements["dx-ti-batt"].value && "АКБ " + form.elements["dx-ti-batt"].value + "%", form.elements["dx-ti-cond"].value].filter(Boolean).join(", ") : "";
    var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
    window.DX.sendLead({
      form: "Каталог: бронь" + (ti ? " + Trade-In" : ""), branch: (form.querySelector('input[name="dx-book-branch"]:checked') || {}).value,
      name: form.elements["dx-book-name"].value.trim(), phone: phone, device: booking.title,
      service: (booking.kind === "used" ? "Б/у: " : "Новый: ") + booking.title + " · " + booking.meta, amount: booking.price, comment: comment
    }).then(function (res) {
      btn.disabled = false;
      st.hidden = false;
      if (res.ok) {
        form.hidden = true; st.setAttribute("data-kind", "ok");
        st.textContent = "Готово. Отложим товар на 24 часа, менеджер перезвонит в течение 15 минут в рабочее время.";
        try { if (window.ym && window.DX_YM) window.ym(window.DX_YM, "reachGoal", "catalog_booking"); } catch (e) {}
      } else {
        st.setAttribute("data-kind", "err");
        st.textContent = "Не удалось отправить. Позвоните +7 (922) 025-21-21 или напишите в Telegram @displexpoint.";
      }
    });
  }

  /* ---------- события ---------- */
  root.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-d]")) && el.closest("[data-dx-grid]")) {
      var g = groups.filter(function (x) { return x.key === el.getAttribute("data-g"); })[0];
      if (g) { pickDim(g, el.getAttribute("data-d"), el.getAttribute("data-v")); var card = el.closest(".dx-pcard"); card.outerHTML = cardNew(g); }
      return;
    }
    if ((el = t.closest("[data-gal]"))) {
      var id = el.getAttribute("data-gal"), u = usedList.filter(function (x) { return x.id === id; })[0];
      if (u) { var n = (u.photos || []).length; gal[id] = ((gal[id] || 0) + +el.getAttribute("data-step") + n) % n; el.closest(".dx-pcard").outerHTML = cardUsed(u); }
      return;
    }
    if ((el = t.closest("[data-book]"))) { openBooking(el.getAttribute("data-book"), el.getAttribute("data-g") || el.getAttribute("data-id")); return; }
    if ((el = t.closest("[data-fam]"))) { state.f = el.getAttribute("data-fam"); syncUrl(); render(); return; }
    if ((el = t.closest("[data-cat]")) && el.tagName === "BUTTON") { state.cat = el.getAttribute("data-cat"); state.f = ""; syncUrl(); render(); return; }
    if (t.closest("[data-reset]")) { state.f = ""; state.q = ""; state.cat = ""; var si = $("[data-dx-search]"); if (si) si.value = ""; syncUrl(); render(); }
  });
  var searchEl = $("[data-dx-search]"), sortEl = $("[data-dx-sort]"), tId;
  if (searchEl) { searchEl.value = state.q; searchEl.addEventListener("input", function () { clearTimeout(tId); tId = setTimeout(function () { state.q = searchEl.value.trim(); syncUrl(); render(); }, 180); }); }
  if (sortEl) { sortEl.value = state.sort; sortEl.addEventListener("change", function () { state.sort = sortEl.value; syncUrl(); render(); }); }
  root.addEventListener("error", function (e) {                 // фото не загрузилось → силуэт
    var img = e.target; if (img.tagName === "IMG" && img.hasAttribute("data-dx-fallback")) img.outerHTML = silhouette(img.getAttribute("data-dx-fallback"));
  }, true);
  if (modal) {
    modal.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); submitBooking(e.target); });
    var tiBox = modal.querySelector('[name="dx-book-ti"]'), tiFields = modal.querySelector("[data-ti-fields]");
    if (tiBox && tiFields) tiBox.addEventListener("change", function () { tiFields.hidden = !tiBox.checked; });
  }

  load();
})();
