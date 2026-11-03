# displex-site-assets

Общие файлы сайта apple-displex.ru.

- `css/`, `js/` — общие стили и скрипты (подключаются через jsDelivr).
- `server/` — выгрузка JSON для сайта на сервере displex.su (`/opt/displex-site`), systemd-таймер раз в 2 минуты.
  Читает данные ботов только на чтение; в JSON попадают только публичные поля (без IMEI, ФИО, закупочных цен).
