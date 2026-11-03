#!/usr/bin/env python3
"""Собирает HTML-блоки для Creatium: шапка, подвал, 7 страниц каталога.
Запуск: python3 build/make_blocks.py <версия-тег>  → папка out/<дата>/"""
import sys, os, json, html, datetime
VER = sys.argv[1] if len(sys.argv) > 1 else "main"
OUT = sys.argv[2] if len(sys.argv) > 2 else "out"
CDN = f"https://cdn.jsdelivr.net/gh/duuuper/displex-site-assets@{VER}"
os.makedirs(OUT, exist_ok=True)
E = html.escape

HEADER = f"""<!-- Displex · ШАПКА (блок «HTML код», первый на каждой странице) · {VER} -->
<script>try{{var t=localStorage.getItem('dx-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-dx-theme',t)}}catch(e){{}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="preconnect" href="https://displex.su" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Unbounded:wght@600;700&display=swap">
<link rel="stylesheet" href="{CDN}/css/dx-core.min.css">
<script src="{CDN}/js/dx-core.min.js" defer></script>
<div class="dx-root dx-bleed">
<header class="dx-header">
  <div class="dx-topbar"><div class="dx-container dx-topbar-in">
    <div class="dx-topbar-branches">
      <span class="dx-branch"><span class="dx-branch-name">Репина, 94</span><span class="dx-branch-hint">ТРЦ «Радуга Парк» · 10:00–22:00</span><a href="tel:+79220252121">+7 922 025-21-21</a></span>
      <span class="dx-branch"><span class="dx-branch-name">Красный пер., 12</span><span class="dx-branch-hint">м. Динамо · 10:00–21:00</span><a href="tel:+79809303620">+7 980 930-36-20</a></span>
    </div>
    <span class="dx-topbar-note">Диагностика 0 ₽ при любом исходе</span>
  </div></div>
  <div class="dx-navbar"><div class="dx-container dx-navbar-in">
    <a class="dx-logo" href="/" aria-label="Displex — на главную">DISPLEX</a>
    <nav class="dx-nav" aria-label="Основное меню">
      <a href="/calculator">Ремонт</a><a href="/catalog">Каталог</a><a href="/catalog/used">Б/у</a><a href="/#tradein">Trade-In</a><a href="/#branches">Контакты</a>
    </nav>
    <div class="dx-navbar-end">
      <div class="dx-theme" role="group" aria-label="Тема оформления">
        <button type="button" data-dx-theme-set="auto" aria-pressed="true" aria-label="Как на устройстве"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>
        <button type="button" data-dx-theme-set="light" aria-pressed="false" aria-label="Светлая тема"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></button>
        <button type="button" data-dx-theme-set="dark" aria-pressed="false" aria-label="Тёмная тема"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></button>
      </div>
      <a class="dx-btn dx-btn--primary dx-btn--sm" href="/calculator#booking">Записаться</a>
      <button class="dx-burger" type="button" data-dx-menu-toggle aria-controls="dx-menu" aria-expanded="false" aria-label="Меню"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div></div>
  <div class="dx-menu" id="dx-menu" data-open="false"><div class="dx-container dx-menu-in">
    <a href="/calculator">Ремонт</a><a href="/catalog">Каталог</a><a href="/catalog/used">Б/у</a><a href="/#tradein">Trade-In</a><a href="/#branches">Контакты</a>
    <a class="dx-btn dx-btn--primary dx-btn--block" href="/calculator#booking">Записаться</a>
  </div></div>
</header>
</div>
"""

FOOTER = f"""<!-- Displex · ПОДВАЛ (блок «HTML код», последний на каждой странице) · {VER} -->
<div class="dx-root dx-bleed">
<footer class="dx-footer" id="branches">
  <div class="dx-container dx-footer-grid">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="dx-logo">DISPLEX</span><p class="dx-small dx-text-muted">Ремонт и продажа техники Apple в Екатеринбурге. Независимый сервис, не связан с Apple Inc.</p></div>
    <div><h4>Репина, 94</h4><ul class="dx-small"><li>ТРЦ «Радуга Парк», 1 этаж</li><li>Ежедневно 10:00–22:00</li><li><a href="tel:+79220252121" class="dx-num">+7 (922) 025-21-21</a></li></ul></div>
    <div><h4>Красный пер., 12</h4><ul class="dx-small"><li>Центр, м. Динамо</li><li>Пн–Пт 10:00–21:00</li><li>Сб–Вс 11:00–20:00</li><li><a href="tel:+79809303620" class="dx-num">+7 (980) 930-36-20</a></li></ul></div>
    <div><h4>Связаться</h4><ul class="dx-small"><li><a href="https://t.me/displexpoint">Telegram</a></li><li><a href="https://wa.me/79220252121">WhatsApp</a></li><li><a href="https://yandex.ru/maps/org/displex/41724692284/">Яндекс Карты · 4.9</a></li></ul></div>
  </div>
  <div class="dx-container dx-footer-legal">
    <span>© 2026 Displex · ИП Гашков А. С.</span>
    <span><a class="dx-link" href="/privacy">Политика конфиденциальности</a> · <a class="dx-link" href="/offer">Оферта</a></span>
  </div>
</footer>
<div class="dx-cookie" hidden><div class="dx-cookie-box">
  <p>Сайт использует cookie и Яндекс Метрику, чтобы считать посещения. Продолжая, вы соглашаетесь с <a class="dx-link" href="/privacy">политикой конфиденциальности</a>.</p>
  <button class="dx-btn dx-btn--primary dx-btn--sm" type="button" data-dx-cookie-ok>Понятно</button>
</div></div>
</div>
"""

MODAL = """
<div class="dx-modal" id="dx-book" role="dialog" aria-modal="true" aria-labelledby="dx-book-h" aria-hidden="true" data-open="false">
  <div class="dx-modal-box">
    <button class="dx-modal-close" type="button" data-dx-close aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <h2 class="dx-h3" id="dx-book-h">Бронь на 24 часа</h2>
    <div class="dx-modal-item"><div><div class="dx-card-title" data-book-title></div><div class="dx-small dx-text-muted" data-book-meta></div></div></div>
    <form novalidate style="display:flex;flex-direction:column;gap:12px">
      <div class="dx-seg" role="radiogroup" aria-label="Филиал">
        <input type="radio" name="dx-book-branch" id="dx-book-b1" value="Репина, 94" checked><label for="dx-book-b1">Репина, 94</label>
        <input type="radio" name="dx-book-branch" id="dx-book-b2" value="Красный пер., 12"><label for="dx-book-b2">Красный пер., 12</label>
      </div>
      <div class="dx-field"><label class="dx-label" for="dx-book-name">Имя</label><input class="dx-input" id="dx-book-name" name="dx-book-name" type="text" autocomplete="given-name"></div>
      <div class="dx-field"><label class="dx-label" for="dx-book-phone">Телефон</label><input class="dx-input" id="dx-book-phone" name="dx-book-phone" type="tel" inputmode="tel" data-dx-phone placeholder="+7 (900) 000-00-00" autocomplete="tel" required></div>
      <label class="dx-check"><input type="checkbox" name="dx-book-ti" id="dx-book-ti"><span>Хочу сдать свой телефон в Trade-In</span></label>
      <div class="dx-tradein-fields" data-ti-fields hidden>
        <div class="dx-field" style="grid-column:1/-1"><label class="dx-label" for="dx-ti-model">Модель</label><input class="dx-input" id="dx-ti-model" name="dx-ti-model" type="text" placeholder="iPhone 13 Pro"></div>
        <div class="dx-field"><label class="dx-label" for="dx-ti-mem">Память</label><select class="dx-select" id="dx-ti-mem" name="dx-ti-mem"><option value="">—</option><option>64 ГБ</option><option>128 ГБ</option><option>256 ГБ</option><option>512 ГБ</option><option>1 ТБ</option></select></div>
        <div class="dx-field"><label class="dx-label" for="dx-ti-batt">АКБ, %</label><input class="dx-input" id="dx-ti-batt" name="dx-ti-batt" type="number" min="50" max="100" inputmode="numeric" placeholder="85"></div>
        <div class="dx-field" style="grid-column:1/-1"><label class="dx-label" for="dx-ti-cond">Состояние</label><select class="dx-select" id="dx-ti-cond" name="dx-ti-cond"><option value="">—</option><option>Идеальное</option><option>Отличное</option><option>Хорошее</option><option>Удовлетворительное</option><option>Разбит / не работает</option></select></div>
      </div>
      <label class="dx-check"><input type="checkbox" name="dx-book-agree" id="dx-book-agree" required><span>Согласен на обработку персональных данных по <a class="dx-link" href="/privacy">политике</a></span></label>
      <button class="dx-btn dx-btn--primary dx-btn--lg dx-btn--block" type="submit">Забронировать</button>
    </form>
    <p class="dx-form-status" data-book-status role="status" hidden></p>
  </div>
</div>"""

SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'

PAGES = {
 "all":    dict(slug="/catalog", crumb="Каталог", h1="Техника Apple в Екатеринбурге",
               lead="Новые iPhone, Mac, iPad, Apple Watch и AirPods в наличии и проверенные б/у устройства. Цены обновляются каждый день, бронь бесплатная на 24 часа.",
               title="Купить технику Apple в Екатеринбурге — iPhone, MacBook, iPad, Watch | Displex",
               desc="Новые и б/у iPhone, MacBook, iPad, Apple Watch и AirPods в Екатеринбурге. Цены обновляются ежедневно, бронь на 24 часа, Trade-In, рассрочка. Два магазина: Репина 94 и Красный пер. 12.",
               seo="Displex — магазин и сервисный центр техники Apple в Екатеринбурге. В каталоге новые устройства в наличии у партнёров-поставщиков и б/у техника, которую проверил наш мастер. Цены на сайте те же, что в наших Telegram-каналах, и обновляются автоматически."),
 "iphone": dict(slug="/catalog/iphone", crumb="iPhone", h1="Купить iPhone в Екатеринбурге",
               lead="Новые iPhone 15–18 в наличии: все цвета, объёмы памяти и варианты SIM. Цена фиксируется при брони на 24 часа.",
               title="Купить iPhone в Екатеринбурге — цены на новые iPhone 18, 17, 16 | Displex",
               desc="Новые iPhone 18 Pro, 17, Air, 16 и 15 в наличии в Екатеринбурге. Актуальные цены каждый день, бронь на 24 часа, Trade-In старого iPhone, рассрочка, гарантия.",
               seo="Подберите iPhone по цвету, памяти и типу SIM: SIM + eSIM, только eSIM или две SIM. Если нужной комбинации нет в списке, напишите нам — привезём под заказ."),
 "mac":    dict(slug="/catalog/mac", crumb="Mac", h1="Купить MacBook в Екатеринбурге",
               lead="MacBook Air, MacBook Pro и MacBook Neo на чипах Apple: выберите цвет, память и накопитель.",
               title="Купить MacBook в Екатеринбурге — MacBook Air и Pro M5, цены | Displex",
               desc="Новые MacBook Air 13 и 15, MacBook Pro 14 и MacBook Neo в Екатеринбурге. Актуальные цены, бронь на 24 часа, Trade-In и рассрочка.",
               seo="В карточке модели выберите конфигурацию: объём оперативной памяти и накопителя указаны как «16/512 ГБ». Подскажем, какая конфигурация подойдёт под ваши задачи."),
 "ipad":   dict(slug="/catalog/ipad", crumb="iPad", h1="Купить iPad в Екатеринбурге",
               lead="iPad, iPad Air, iPad mini и iPad Pro с Wi-Fi и сотовой связью.",
               title="Купить iPad в Екатеринбурге — iPad Air, Pro, mini, цены | Displex",
               desc="Новые iPad, iPad Air, iPad mini и iPad Pro в Екатеринбурге: Wi-Fi и Cellular. Актуальные цены, бронь на 24 часа, Trade-In и рассрочка.",
               seo="Версия Wi-Fi + Cellular работает с SIM-картой и не зависит от точки доступа. Если сомневаетесь, какой iPad выбрать, позвоните в любой из филиалов."),
 "watch":  dict(slug="/catalog/watch", crumb="Apple Watch", h1="Купить Apple Watch в Екатеринбурге",
               lead="Apple Watch Series, SE и Ultra: размер корпуса, цвет и размер ремешка.",
               title="Купить Apple Watch в Екатеринбурге — Series 12, Ultra 3, SE 3 | Displex",
               desc="Новые Apple Watch Series 12, Series 11, Ultra 3 и SE 3 в Екатеринбурге. Актуальные цены, бронь на 24 часа, Trade-In и рассрочка.",
               seo="Размер ремешка указан в карточке: S/M или M/L. Не уверены в размере — примерьте в магазине на Репина, 94 или Красном переулке, 12."),
 "airpods":dict(slug="/catalog/airpods", crumb="AirPods", h1="Купить AirPods в Екатеринбурге",
               lead="AirPods 4, AirPods Pro и AirPods Max в наличии.",
               title="Купить AirPods в Екатеринбурге — AirPods 4, Pro, Max, цены | Displex",
               desc="Новые AirPods 4, AirPods Pro и AirPods Max в Екатеринбурге. Актуальные цены, бронь на 24 часа, доставка по РФ.",
               seo="Наушники совместимы с iPhone, iPad и Mac. Подключим и проверим при покупке в магазине."),
 "used":   dict(slug="/catalog/used", crumb="Б/у техника", h1="Б/у iPhone и техника Apple",
               lead="Каждое устройство проверено мастером: указаны состояние, ёмкость аккумулятора и комплект. Гарантия Displex на каждое устройство.",
               title="Б/у iPhone в Екатеринбурге — проверенные, с гарантией | Displex",
               desc="Б/у iPhone, MacBook, iPad и Apple Watch в Екатеринбурге: проверены мастером, честный процент АКБ и состояние, гарантия Displex, Trade-In и рассрочка.",
               seo="Фото в карточках — реальные снимки этого устройства. Проданные позиции пропадают с сайта автоматически в течение нескольких минут."),
}
FAQ = [
 ("Как работает бронь?", "Нажмите «Забронировать» и оставьте телефон. Мы отложим устройство и зафиксируем цену на 24 часа, менеджер перезвонит для подтверждения."),
 ("Можно ли сдать старый телефон в зачёт?", "Да, по Trade-In. Отметьте это в форме брони, укажите модель, память и состояние — менеджер назовёт сумму, окончательно оценим при осмотре."),
 ("Есть рассрочка?", "Да, рассрочка и Яндекс Сплит. Условия уточнит менеджер."),
 ("Доставляете в другие города?", "Да, бесплатная доставка по России."),
]

def page(key, p):
    crumbs = '<a href="/">Главная</a><span aria-hidden="true">/</span>' + (
        f'<span>{E(p["crumb"])}</span>' if key == "all" else f'<a href="/catalog">Каталог</a><span aria-hidden="true">/</span><span>{E(p["crumb"])}</span>')
    tabs = "".join(
        f'<a class="dx-chip" href="{PAGES[k]["slug"]}"' + (' aria-current="page" aria-pressed="true"' if k == key else ' aria-pressed="false"') + f'>{E(n)}</a>'
        for k, n in [("all", "Все"), ("iphone", "iPhone"), ("mac", "Mac"), ("ipad", "iPad"), ("watch", "Watch"), ("airpods", "AirPods"), ("used", "Б/у")])
    faq = "".join(f"<details><summary>{E(qq)}</summary><p>{E(a)}</p></details>" for qq, a in FAQ)
    faq_ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": qq, "acceptedAnswer": {"@type": "Answer", "text": a}} for qq, a in FAQ]}, ensure_ascii=False)
    bc_ld = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://apple-displex.ru/"},
        {"@type": "ListItem", "position": 2, "name": "Каталог", "item": "https://apple-displex.ru/catalog"}] + ([] if key == "all" else [
        {"@type": "ListItem", "position": 3, "name": p["crumb"], "item": "https://apple-displex.ru" + p["slug"]}])}, ensure_ascii=False)
    skel = '<div class="dx-skel"></div>' * 6
    return f"""<!-- Displex · КАТАЛОГ «{p['crumb']}» · адрес {p['slug']} · {VER}
     Настройки страницы в Creatium:
       Title:       {p['title']}
       Description: {p['desc']}
-->
<div class="dx-root dx-bleed" data-dx-catalog="{key}">
<section class="dx-container dx-cat-hero">
  <nav class="dx-crumbs" aria-label="Хлебные крошки">{crumbs}</nav>
  <h1 class="dx-h1">{E(p['h1'])}</h1>
  <p class="dx-lead">{E(p['lead'])}</p>
  {'' if key == 'used' else '<nav class="dx-cat-tabs" aria-label="Разделы каталога">' + tabs + '</nav>'}
</section>
<div class="dx-container">
  <div class="dx-toolbar">
    <label class="dx-search"><span class="dx-sr">Поиск по каталогу</span>{SEARCH_SVG}<input class="dx-input" type="search" data-dx-search placeholder="Модель, цвет или память" autocomplete="off"></label>
    <label><span class="dx-sr">Сортировка</span><select class="dx-select" data-dx-sort><option value="new">Сначала новые модели</option><option value="cheap">Сначала дешевле</option><option value="dear">Сначала дороже</option></select></label>
    <div class="dx-chips" data-dx-families hidden style="flex-basis:100%"></div>
    <span class="dx-count" data-dx-count aria-live="polite"></span>
  </div>
  <div class="dx-used-promo" data-dx-used-promo hidden style="margin-bottom:16px"></div>
  <div class="dx-cat-grid" data-dx-grid>{skel}</div>
  <noscript><p class="dx-text-muted">Для просмотра каталога включите JavaScript или позвоните: +7 (922) 025-21-21.</p></noscript>
</div>
<section class="dx-section dx-section--tint" style="margin-top:40px">
  <div class="dx-container dx-seo">
    <h2 class="dx-h2">{E(p['crumb'] if key != 'all' else 'Каталог Displex')}: как купить</h2>
    <p>{E(p['seo'])}</p>
    <p>Забрать покупку можно в магазине на Репина, 94 (ТРЦ «Радуга Парк», ежедневно 10:00–22:00) или на Красном переулке, 12 (м. Динамо). Гарантия на новые устройства — 1 год.</p>
    <div class="dx-faq">{faq}</div>
  </div>
</section>
{MODAL}
</div>
<script type="application/ld+json">{faq_ld}</script>
<script type="application/ld+json">{bc_ld}</script>
<script src="{CDN}/js/dx-catalog.min.js" defer></script>
"""

open(f"{OUT}/00_header.html", "w").write(HEADER)
open(f"{OUT}/99_footer.html", "w").write(FOOTER)
rows = []
for k, p in PAGES.items():
    fn = f"catalog_{k}.html"
    open(f"{OUT}/{fn}", "w").write(page(k, p))
    rows.append((p["slug"], fn, p["title"], p["desc"], p["h1"]))
with open(f"{OUT}/README_страницы.md", "w") as f:
    f.write(f"# Каталог Displex — блоки для Creatium ({VER})\n\nНа каждой странице 3 блока «HTML код» по порядку: `00_header.html` → блок страницы → `99_footer.html`.\n\n")
    for slug, fn, t, d, h in rows:
        f.write(f"## {slug}\n- Блок: `{fn}`\n- Title: {t}\n- Description: {d}\n- H1: {h}\n\n")
print("\n".join(sorted(os.listdir(OUT))))
for fn in sorted(os.listdir(OUT)):
    print(fn, os.path.getsize(f"{OUT}/{fn}"))
