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
      <a class="dx-btn dx-btn--primary dx-btn--sm" href="/#booking" data-dx-open="dx-lead">Записаться</a>
      <button class="dx-burger" type="button" data-dx-menu-toggle aria-controls="dx-menu" aria-expanded="false" aria-label="Меню"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div></div>
  <div class="dx-menu" id="dx-menu" data-open="false"><div class="dx-container dx-menu-in">
    <a href="/calculator">Ремонт</a><a href="/catalog">Каталог</a><a href="/catalog/used">Б/у</a><a href="/#tradein">Trade-In</a><a href="/#branches">Контакты</a>
    <a class="dx-btn dx-btn--primary dx-btn--block" href="/#booking" data-dx-open="dx-lead">Записаться</a>
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
    <span>© 2026 Displex · ИП Гашков Александр Сергеевич · ИНН 665915129490 · ОГРНИП 322665800209156</span>
    <span><a class="dx-link" href="/privacy">Политика конфиденциальности</a> · <a class="dx-link" href="/privacy#consent">Согласие на обработку ПДн</a></span>
    <span style="flex-basis:100%">Информация на сайте носит справочный характер и не является публичной офертой (ст. 437 ГК РФ). Окончательная стоимость и сроки ремонта определяются после бесплатной диагностики.</span>
  </div>
</footer>
<div class="dx-modal" id="dx-lead" role="dialog" aria-modal="true" aria-labelledby="dx-lead-h" aria-hidden="true" data-open="false">
  <div class="dx-modal-box">
    <button class="dx-modal-close" type="button" data-dx-close aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <h2 class="dx-h3" id="dx-lead-h">Записаться или задать вопрос</h2>
    <form data-dx-lead novalidate style="display:flex;flex-direction:column;gap:12px">
      <div class="dx-seg" role="radiogroup" aria-label="Что нужно">
        <input type="radio" name="dx-g-kind" id="dx-g-k1" value="Ремонт" checked><label for="dx-g-k1">Ремонт</label>
        <input type="radio" name="dx-g-kind" id="dx-g-k2" value="Покупка"><label for="dx-g-k2">Покупка</label>
        <input type="radio" name="dx-g-kind" id="dx-g-k3" value="Trade-In"><label for="dx-g-k3">Trade-In</label>
      </div>
      <div class="dx-seg" role="radiogroup" aria-label="Филиал">
        <input type="radio" name="dx-g-branch" id="dx-g-b1" value="Репина, 94" checked><label for="dx-g-b1">Репина, 94</label>
        <input type="radio" name="dx-g-branch" id="dx-g-b2" value="Красный пер., 12"><label for="dx-g-b2">Красный пер., 12</label>
      </div>
      <div class="dx-field"><label class="dx-label" for="dx-g-device">Устройство и что случилось</label><input class="dx-input" id="dx-g-device" name="dx-g-device" type="text" placeholder="Например, iPhone 13 — разбит экран"></div>
      <div class="dx-field"><label class="dx-label" for="dx-g-name">Имя</label><input class="dx-input" id="dx-g-name" name="dx-g-name" type="text" autocomplete="given-name"></div>
      <div class="dx-field"><label class="dx-label" for="dx-g-phone">Телефон</label><input class="dx-input" id="dx-g-phone" name="dx-g-phone" type="tel" inputmode="tel" data-dx-phone placeholder="+7 (900) 000-00-00" autocomplete="tel" required></div>
      <label class="dx-check"><input type="checkbox" name="dx-g-agree" id="dx-g-agree" required><span>Даю <a class="dx-link" href="/privacy#consent">согласие на обработку персональных данных</a> и принимаю <a class="dx-link" href="/privacy">политику конфиденциальности</a></span></label>
      <button class="dx-btn dx-btn--primary dx-btn--lg dx-btn--block" type="submit">Отправить заявку</button>
    </form>
    <p class="dx-form-status" data-dx-lead-status role="status" hidden></p>
  </div>
</div>
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
      <label class="dx-check"><input type="checkbox" name="dx-book-agree" id="dx-book-agree" required><span>Даю <a class="dx-link" href="/privacy#consent">согласие на обработку персональных данных</a> и принимаю <a class="dx-link" href="/privacy">политику конфиденциальности</a></span></label>
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


HOME_FAQ = [
 ("Сколько стоит диагностика?", "Диагностика бесплатная при любом исходе: даже если вы решите не ремонтировать устройство."),
 ("Сколько времени занимает ремонт?", "Замена аккумулятора — 20–40 минут, замена дисплея — 40–60 минут, корпус и заднее стекло — 1–2 часа. Ремонт платы — от 1 дня. Точный срок мастер назовёт после диагностики."),
 ("Какая гарантия на ремонт?", "На оригинальные запчасти — 1 год, на копии — 6 месяцев. Гарантию выдаём письменно."),
 ("Чем оригинал отличается от копии?", "Оригинальный дисплей — родная матрица Apple: переклейка стекла, снятый оригинал или Service Pack. Копии OLED и TFT дешевле, но уступают по яркости, цветам и расходу батареи. Мастер покажет разницу вживую."),
 ("Можно ли сдать старый телефон в зачёт?", "Да, по Trade-In: оцениваем при осмотре, разницу доплачиваете за новый или б/у iPhone."),
]

def home_page():
    faq = "".join(f"<details><summary>{E(q)}</summary><p>{E(a)}</p></details>" for q, a in HOME_FAQ)
    ld = [{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in HOME_FAQ]}]
    for name, street, phone, hours in [
        ("Displex — Репина, 94", "ул. Репина, 94, ТРЦ «Радуга Парк», 1 этаж", "+7 922 025-21-21", ["Mo-Su 10:00-22:00"]),
        ("Displex — Красный переулок, 12", "Красный переулок, 12", "+7 980 930-36-20", ["Mo-Fr 10:00-21:00", "Sa-Su 11:00-20:00"])]:
        ld.append({"@context": "https://schema.org", "@type": "ElectronicsStore", "name": name, "url": "https://apple-displex.ru/",
                   "telephone": phone, "openingHours": hours, "priceRange": "₽₽",
                   "address": {"@type": "PostalAddress", "streetAddress": street, "addressLocality": "Екатеринбург", "addressCountry": "RU"}})
    ld_html = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    rows = [("Переклейка стекла iPhone", "glass", "от 3 000 ₽", "40–60 мин", "1 год"),
            ("Замена аккумулятора", "Замена аккумулятора", "от 1 800 ₽", "20–40 мин", "до 1 года"),
            ("Замена разъёма зарядки", "Замена шлейфа зарядки", "от 2 500 ₽", "40–60 мин", "—"),
            ("Замена заднего стекла", "Замена заднего стекла", "от 2 000 ₽", "1–2 ч", "1 год"),
            ("Замена камеры", "Замена камеры", "от 1 800 ₽", "40–60 мин", "—"),
            ("Ремонт платы (пайка)", "Ремонт платы (пайка)", "от 3 500 ₽", "от 1 дня", "—"),
            ("Переклейка стекла Apple Watch", "watch", "от 2 500 ₽", "4–5 ч", "—")]
    trs = "".join(f'<tr><td class="dx-svc">{E(n)}</td><td>{E(d)}</td><td>{E(w)}</td><td class="dx-r"><span class="dx-price dx-price--md" data-from="{E(k)}">{E(f)}</span></td></tr>' for n, k, f, d, w in rows)
    skel = '<div class="dx-skel"></div>' * 4
    return f"""<!-- Displex · ГЛАВНАЯ · адрес / · {VER}
     Настройки страницы в Creatium:
       Title:       Ремонт iPhone и техника Apple в Екатеринбурге — Displex
       Description: Ремонт iPhone, iPad, Mac и Apple Watch в Екатеринбурге: бесплатная диагностика, цена до начала работ, гарантия до 1 года. Новые и б/у iPhone, Trade-In. Репина 94 и Красный пер. 12.
-->
<div class="dx-root dx-bleed" data-dx-home>

<section class="dx-container dx-hero">
  <h1 class="dx-h1" style="max-width:980px">Ремонт и техника Apple. Цена — до начала работ.</h1>
  <p class="dx-lead">Два филиала в Екатеринбурге, бесплатная диагностика, письменная гарантия до 1 года.</p>
  <div class="dx-hero-grid">
    <form class="dx-calc" onsubmit="return false" aria-labelledby="dx-calc-h">
      <h2 class="dx-h3" id="dx-calc-h">Узнайте цену ремонта</h2>
      <div class="dx-field"><label class="dx-label" for="dx-calc-model">Модель</label><select class="dx-select" id="dx-calc-model" data-calc-model><option>iPhone 13</option></select></div>
      <div class="dx-field"><label class="dx-label" for="dx-calc-service">Что нужно сделать</label><select class="dx-select" id="dx-calc-service" data-calc-service><option>Замена дисплея</option></select></div>
      <div class="dx-opts" data-calc-variants role="group" aria-label="Вариант запчасти" hidden></div>
      <div class="dx-calc-result" data-calc-result hidden>
        <div><div class="dx-small dx-text-muted" data-calc-name></div><div class="dx-price dx-price--xl" data-calc-price></div></div>
        <div class="dx-calc-meta" data-calc-meta></div>
      </div>
      <button class="dx-btn dx-btn--primary dx-btn--lg dx-btn--block" type="button" data-to-form="calc">Записаться по этой цене</button>
      <p class="dx-tiny dx-text-muted">Точный срок и цена — после бесплатной диагностики. <a class="dx-link" href="/calculator">Все цены</a></p>
    </form>
    <div class="dx-offers">
      <a class="dx-offer" href="/calculator"><div><div class="dx-offer-title">Переклейка стекла</div><div class="dx-small dx-text-muted">Дешевле нового модуля, матрица остаётся родной</div></div><span class="dx-price dx-price--md" data-from="glass">от 3 000 ₽</span></a>
      <a class="dx-offer" href="/calculator"><div><div class="dx-offer-title">Замена аккумулятора</div><div class="dx-small dx-text-muted">20–40 минут, пока вы ждёте</div></div><span class="dx-price dx-price--md" data-from="Замена аккумулятора">от 1 800 ₽</span></a>
      <a class="dx-offer dx-offer--dark" href="#booking" id="tradein" data-to-form="Trade-In"><div><div class="dx-offer-title">Trade-In</div><div class="dx-small dx-text-muted">Сдайте старый смартфон и доплатите разницу за новый или б/у</div></div><span class="dx-price dx-price--lg" aria-hidden="true">→</span></a>
    </div>
  </div>
</section>

<section class="dx-section--tint"><div class="dx-container dx-stats" style="padding-block:32px">
  <div><div class="dx-stat-value">4.9 ★</div><div class="dx-stat-label">рейтинг на Яндекс Картах</div></div>
  <div><div class="dx-stat-value">0 ₽</div><div class="dx-stat-label">диагностика при любом исходе</div></div>
  <div><div class="dx-stat-value">до 1 года</div><div class="dx-stat-label">гарантия на оригинальные запчасти</div></div>
  <div><div class="dx-stat-value">2</div><div class="dx-stat-label">филиала в Екатеринбурге</div></div>
</div></section>

<section class="dx-section"><div class="dx-container">
  <div class="dx-head-split"><h2 class="dx-h2">В наличии сегодня</h2><a class="dx-link" href="/catalog">Весь каталог →</a></div>
  <div class="dx-cat-grid" data-home-shop>{skel}</div>
</div></section>

<section class="dx-section dx-section--tint" id="prices"><div class="dx-container">
  <div class="dx-head-split"><div class="dx-stack" style="gap:6px"><h2 class="dx-h2">Цены на ремонт</h2><p class="dx-text-muted">Окончательная стоимость — после бесплатной диагностики.</p></div><a class="dx-link" href="/calculator">Цена для вашей модели →</a></div>
  <div class="dx-table-wrap"><table class="dx-table">
    <thead><tr><th scope="col">Услуга</th><th scope="col">Срок</th><th scope="col">Гарантия</th><th scope="col" class="dx-r">Цена</th></tr></thead>
    <tbody>{trs}</tbody>
  </table></div>
</div></section>

<section class="dx-section"><div class="dx-container dx-two">
  <div class="dx-stack">
    <h2 class="dx-h2">Отзывы</h2>
    <div class="dx-rating"><span class="dx-rating-num">4.9</span><div><div class="dx-stars" aria-hidden="true">★★★★★</div><div class="dx-small dx-text-muted">рейтинг Displex на Яндекс Картах</div></div></div>
    <p class="dx-text-muted">Отзывы публикуются на Яндекс Картах. Мы их не редактируем и не удаляем.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a class="dx-btn dx-btn--secondary" href="https://yandex.ru/maps/org/displex/41724692284/reviews/" target="_blank" rel="noopener">Все отзывы</a>
      <a class="dx-btn dx-btn--ghost" href="https://yandex.ru/maps/org/displex/41724692284/reviews/?add-review=true" target="_blank" rel="noopener">Оставить отзыв</a>
    </div>
  </div>
  <div class="dx-reviews" data-reviews><p class="dx-text-muted" style="padding:20px">Загружаем отзывы с Яндекс Карт…</p></div>
</div></section>

<section class="dx-section dx-section--tint" id="booking"><div class="dx-container dx-two">
  <div class="dx-stack" style="gap:18px">
    <h2 class="dx-h2">Два филиала</h2>
    <div class="dx-branch-card"><div class="dx-h3">ул. Репина, 94 · ТРЦ «Радуга Парк»</div><div class="dx-text-muted">Каждый день 10:00–22:00</div><a class="dx-link dx-num" href="tel:+79220252121">+7 (922) 025-21-21</a><a class="dx-link dx-small" href="https://yandex.ru/maps/?text=Екатеринбург, Репина 94" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a></div>
    <div class="dx-branch-card"><div class="dx-h3">Красный пер., 12 · м. Динамо</div><div class="dx-text-muted">Пн–пт 10:00–21:00, сб–вс 11:00–20:00</div><a class="dx-link dx-num" href="tel:+79809303620">+7 (980) 930-36-20</a><a class="dx-link dx-small" href="https://yandex.ru/maps/?text=Екатеринбург, Красный переулок 12" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a></div>
  </div>
  <form class="dx-panel-dark dx-stack" data-lead-form novalidate>
    <h2 class="dx-h3">Записаться или забронировать</h2>
    <div class="dx-seg" role="radiogroup" aria-label="Что нужно">
      <input type="radio" name="dx-lead-kind" id="dx-lk1" value="Ремонт" checked><label for="dx-lk1">Ремонт</label>
      <input type="radio" name="dx-lead-kind" id="dx-lk2" value="Покупка"><label for="dx-lk2">Покупка</label>
      <input type="radio" name="dx-lead-kind" id="dx-lk3" value="Trade-In"><label for="dx-lk3">Trade-In</label>
    </div>
    <div class="dx-seg" role="radiogroup" aria-label="Филиал">
      <input type="radio" name="dx-lead-branch" id="dx-lb1" value="Репина, 94" checked><label for="dx-lb1">Репина, 94</label>
      <input type="radio" name="dx-lead-branch" id="dx-lb2" value="Красный пер., 12"><label for="dx-lb2">Красный пер., 12</label>
    </div>
    <div class="dx-field"><label class="dx-label" for="dx-lead-device">Устройство и что случилось</label><input class="dx-input" id="dx-lead-device" name="dx-lead-device" type="text" placeholder="Например, iPhone 13 — разбит экран"></div>
    <div class="dx-field"><label class="dx-label" for="dx-lead-name">Имя</label><input class="dx-input" id="dx-lead-name" name="dx-lead-name" type="text" autocomplete="given-name"></div>
    <div class="dx-field"><label class="dx-label" for="dx-lead-phone">Телефон</label><input class="dx-input" id="dx-lead-phone" name="dx-lead-phone" type="tel" inputmode="tel" data-dx-phone placeholder="+7 (900) 000-00-00" autocomplete="tel" required></div>
    <label class="dx-check"><input type="checkbox" name="dx-lead-agree" id="dx-lead-agree" required><span>Даю <a class="dx-link" href="/privacy#consent">согласие на обработку персональных данных</a> и принимаю <a class="dx-link" href="/privacy">политику конфиденциальности</a></span></label>
    <button class="dx-btn dx-btn--primary dx-btn--lg dx-btn--block" type="submit">Отправить заявку</button>
    <p class="dx-form-status" data-lead-status role="status" hidden></p>
  </form>
</div></section>

<!-- Блок «Статьи»: появится, когда будут статьи блога (шаблон подготовим отдельно) -->

<section class="dx-section"><div class="dx-container dx-seo">
  <h2 class="dx-h2">Ремонт iPhone в Екатеринбурге</h2>
  <p>Displex ремонтирует iPhone, iPad, MacBook и Apple Watch в двух филиалах: на Репина, 94 в ТРЦ «Радуга Парк» и на Красном переулке, 12 у метро Динамо. Диагностика бесплатная, цену называем до начала работ, и она не меняется без вашего согласия.</p>
  <p>Для замены дисплея предлагаем несколько вариантов: переклейку стекла с сохранением родной матрицы, снятый оригинал, Service Pack или копию OLED/TFT. Аккумуляторы — оригинал или копия с привязкой. На оригинальные запчасти даём гарантию 1 год, на копии — 6 месяцев.</p>
  <p>В магазине — новые iPhone, MacBook, iPad, Apple Watch и AirPods, а также проверенные б/у устройства с гарантией. Старый телефон можно сдать в Trade-In.</p>
  <div class="dx-faq">{faq}</div>
</div></section>

</div>
{ld_html}
<script src="{CDN}/js/dx-home.min.js" defer></script>
"""

def prices_page():
    faq = "".join(f"<details><summary>{E(q)}</summary><p>{E(a)}</p></details>" for q, a in HOME_FAQ[:4])
    ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in HOME_FAQ[:4]]}, ensure_ascii=False)
    bc = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://apple-displex.ru/"},
        {"@type": "ListItem", "position": 2, "name": "Цены на ремонт", "item": "https://apple-displex.ru/calculator"}]}, ensure_ascii=False)
    return f"""<!-- Displex · ЦЕНЫ НА РЕМОНТ · адрес /calculator · {VER}
     Настройки страницы в Creatium:
       Title:       Цены на ремонт iPhone и Apple Watch в Екатеринбурге — Displex
       Description: Прайс на ремонт iPhone 7–17 Pro Max и Apple Watch: замена дисплея, аккумулятора, заднего стекла, камеры, ремонт платы. Сроки и гарантия по каждой услуге. Бесплатная диагностика.
-->
<div class="dx-root dx-bleed" data-dx-prices>
<section class="dx-container dx-cat-hero">
  <nav class="dx-crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span aria-hidden="true">/</span><span>Цены на ремонт</span></nav>
  <h1 class="dx-h1">Цены на ремонт iPhone и Apple Watch</h1>
  <p class="dx-lead">Выберите модель — покажем все услуги со сроками и гарантией. Диагностика бесплатная, цену называем до начала работ.</p>
</section>
<div class="dx-container">
  <div class="dx-p-controls">
    <div class="dx-chips" role="group" aria-label="Устройство" data-p-family>
      <button class="dx-chip" type="button" data-fam="iphone" aria-pressed="true">iPhone</button>
      <button class="dx-chip" type="button" data-fam="watch" aria-pressed="false">Apple Watch</button>
    </div>
    <label><span class="dx-sr">Модель</span><select class="dx-select" data-p-model><option>iPhone 13</option></select></label>
  </div>
  <h2 class="dx-h3" data-p-title style="margin-bottom:12px">Цены на ремонт iPhone 13</h2>
  <div class="dx-table-wrap"><table class="dx-table dx-p-table">
    <thead><tr><th scope="col">Услуга</th><th scope="col">Срок</th><th scope="col">Гарантия</th><th scope="col" class="dx-r">Цена</th><th scope="col"><span class="dx-sr">Запись</span></th></tr></thead>
    <tbody data-p-body><tr><td colspan="5" class="dx-text-muted">Загружаем прайс…</td></tr></tbody>
  </table></div>
  <p class="dx-small dx-text-muted" style="margin-top:12px">Оригинальные запчасти — гарантия 1 год, копии — 6 месяцев. Точный срок и цена — после бесплатной диагностики.</p>
</div>
<section class="dx-section dx-section--tint" style="margin-top:48px"><div class="dx-container dx-seo">
  <h2 class="dx-h2">Как мы считаем цену</h2>
  <p>Цена в прайсе включает запчасть и работу мастера. Для дисплея есть несколько вариантов: переклейка стекла с сохранением родной матрицы, снятый оригинал, Service Pack или копия OLED/TFT. Для аккумулятора — оригинал, копия премиум или копия с привязкой, без уведомления о неоригинальной батарее.</p>
  <p>Ремонт делаем в двух филиалах: Репина, 94 (ТРЦ «Радуга Парк») и Красный переулок, 12 (м. Динамо).</p>
  <div class="dx-faq">{faq}</div>
</div></section>

<div class="dx-modal" id="dx-repair" role="dialog" aria-modal="true" aria-labelledby="dx-repair-h" aria-hidden="true" data-open="false">
  <div class="dx-modal-box">
    <button class="dx-modal-close" type="button" data-dx-close aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <h2 class="dx-h3" id="dx-repair-h">Запись на ремонт</h2>
    <div class="dx-modal-item"><div class="dx-small" data-r-what></div></div>
    <form novalidate style="display:flex;flex-direction:column;gap:12px">
      <div class="dx-seg" role="radiogroup" aria-label="Филиал">
        <input type="radio" name="dx-r-branch" id="dx-r-b1" value="Репина, 94" checked><label for="dx-r-b1">Репина, 94</label>
        <input type="radio" name="dx-r-branch" id="dx-r-b2" value="Красный пер., 12"><label for="dx-r-b2">Красный пер., 12</label>
      </div>
      <div class="dx-field"><label class="dx-label" for="dx-r-name">Имя</label><input class="dx-input" id="dx-r-name" name="dx-r-name" type="text" autocomplete="given-name"></div>
      <div class="dx-field"><label class="dx-label" for="dx-r-phone">Телефон</label><input class="dx-input" id="dx-r-phone" name="dx-r-phone" type="tel" inputmode="tel" data-dx-phone placeholder="+7 (900) 000-00-00" autocomplete="tel" required></div>
      <div class="dx-field"><label class="dx-label" for="dx-r-comment">Удобное время или комментарий</label><input class="dx-input" id="dx-r-comment" name="dx-r-comment" type="text" placeholder="Например, сегодня после 18:00"></div>
      <label class="dx-check"><input type="checkbox" name="dx-r-agree" id="dx-r-agree" required><span>Даю <a class="dx-link" href="/privacy#consent">согласие на обработку персональных данных</a> и принимаю <a class="dx-link" href="/privacy">политику конфиденциальности</a></span></label>
      <button class="dx-btn dx-btn--primary dx-btn--lg dx-btn--block" type="submit">Записаться</button>
    </form>
    <p class="dx-form-status" data-r-status role="status" hidden></p>
  </div>
</div>
</div>
<script type="application/ld+json">{ld}</script>
<script type="application/ld+json">{bc}</script>
<script src="{CDN}/js/dx-prices.min.js" defer></script>
"""

def privacy_page():
    pol = open(os.path.join(os.path.dirname(__file__), "legal/policy.html")).read()
    con = open(os.path.join(os.path.dirname(__file__), "legal/consent.html")).read()
    return f"""<!-- Displex · ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ · адрес /privacy · {VER}
     Настройки страницы в Creatium:
       Title:       Политика конфиденциальности и согласие на обработку персональных данных — Displex
       Description: Политика ИП Гашков А. С. (Displex) в отношении обработки персональных данных посетителей сайта apple-displex.ru и согласие на обработку персональных данных.
-->
<div class="dx-root dx-bleed">
<section class="dx-container dx-cat-hero">
  <nav class="dx-crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span aria-hidden="true">/</span><span>Политика конфиденциальности</span></nav>
  <h1 class="dx-h1">Политика конфиденциальности</h1>
  <nav class="dx-chips" aria-label="Документы"><a class="dx-chip" href="#policy">Политика обработки ПДн</a><a class="dx-chip" href="#consent">Согласие на обработку ПДн</a></nav>
</section>
<div class="dx-container dx-legal" style="padding-bottom:64px">
  <article id="policy">{pol}</article>
  <article style="margin-top:48px">{con}</article>
</div>
</div>
"""

def page404():
    return f"""<!-- Displex · 404 · {VER}
     Настройки страницы в Creatium: Title «Страница не найдена — Displex», запретить индексацию (noindex, follow).
-->
<div class="dx-root dx-bleed">
<section class="dx-container dx-section" style="display:flex;flex-direction:column;gap:20px;align-items:flex-start;min-height:50vh;justify-content:center">
  <span class="dx-eyebrow">Ошибка 404</span>
  <h1 class="dx-h1">Такой страницы нет</h1>
  <p class="dx-lead">Возможно, ссылка устарела или в адресе опечатка. Вот куда можно перейти:</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <a class="dx-btn dx-btn--primary" href="/">На главную</a>
    <a class="dx-btn dx-btn--secondary" href="/catalog">Каталог</a>
    <a class="dx-btn dx-btn--secondary" href="/calculator">Цены на ремонт</a>
    <a class="dx-btn dx-btn--ghost" href="/catalog/used">Б/у техника</a>
  </div>
  <p class="dx-text-muted">Или позвоните: <a class="dx-link dx-num" href="tel:+79220252121">+7 (922) 025-21-21</a> · <a class="dx-link dx-num" href="tel:+79809303620">+7 (980) 930-36-20</a></p>
</section>
</div>
"""

ROBOTS = """User-agent: *
Allow: /
Disallow: /admin
Disallow: /test*
Disallow: /404
Disallow: /*?*

User-agent: Yandex
Allow: /
Disallow: /admin
Disallow: /test*
Disallow: /404
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&srtk /
Clean-param: q&sort&f&cat&model /

Sitemap: https://apple-displex.ru/sitemap.xml
"""

def sitemap():
    today = datetime.date.today().isoformat()
    urls = [("/", "daily", "1.0"), ("/catalog", "daily", "0.9")] + \
           [(PAGES[k]["slug"], "daily", "0.8") for k in ["iphone", "mac", "ipad", "watch", "airpods", "used"]] + \
           [("/calculator", "weekly", "0.9"), ("/privacy", "yearly", "0.2")]
    body = "".join(f"  <url>\n    <loc>https://apple-displex.ru{u}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>{c}</changefreq>\n    <priority>{pr}</priority>\n  </url>\n" for u, c, pr in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n'

open(f"{OUT}/index_home.html", "w").write(home_page())
open(f"{OUT}/privacy.html", "w").write(privacy_page())
open(f"{OUT}/404.html", "w").write(page404())
open(f"{OUT}/robots.txt", "w").write(ROBOTS)
open(f"{OUT}/sitemap.xml", "w").write(sitemap())
open(f"{OUT}/calculator_prices.html", "w").write(prices_page())
open(f"{OUT}/00_header.html", "w").write(HEADER)
open(f"{OUT}/99_footer.html", "w").write(FOOTER)
rows = []
for k, p in PAGES.items():
    fn = f"catalog_{k}.html"
    open(f"{OUT}/{fn}", "w").write(page(k, p))
    rows.append((p["slug"], fn, p["title"], p["desc"], p["h1"]))
with open(f"{OUT}/README_страницы.md", "w") as f:
    f.write(f"# Displex — блоки для Creatium ({VER})\n\nНа каждой странице 3 блока «HTML код» по порядку: `00_header.html` → блок страницы → `99_footer.html`.\n\n## / (главная)\n- Блок: `index_home.html`\n- Title: Ремонт iPhone и техника Apple в Екатеринбурге — Displex\n- Description: Ремонт iPhone, iPad, Mac и Apple Watch в Екатеринбурге: бесплатная диагностика, цена до начала работ, гарантия до 1 года. Новые и б/у iPhone, Trade-In. Репина 94 и Красный пер. 12.\n- H1: Ремонт и техника Apple. Цена — до начала работ.\n\n## /calculator (цены на ремонт)\n- Блок: `calculator_prices.html`\n- Title: Цены на ремонт iPhone и Apple Watch в Екатеринбурге — Displex\n- Description: Прайс на ремонт iPhone 7–17 Pro Max и Apple Watch: замена дисплея, аккумулятора, заднего стекла, камеры, ремонт платы. Сроки и гарантия по каждой услуге. Бесплатная диагностика.\n- H1: Цены на ремонт iPhone и Apple Watch\n\n## /privacy\n- Блок: `privacy.html`\n- Title: Политика конфиденциальности и согласие на обработку персональных данных — Displex\n\n## 404\n- Блок: `404.html` (страница ошибки в настройках Creatium), noindex\n\n## robots.txt и sitemap.xml\n- Настройки сайта → Robots.txt и Sitemap.xml: вставить содержимое `robots.txt` и `sitemap.xml`\n\n")
    for slug, fn, t, d, h in rows:
        f.write(f"## {slug}\n- Блок: `{fn}`\n- Title: {t}\n- Description: {d}\n- H1: {h}\n\n")
print("\n".join(sorted(os.listdir(OUT))))
for fn in sorted(os.listdir(OUT)):
    print(fn, os.path.getsize(f"{OUT}/{fn}"))
