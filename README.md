# Портфолио — Александра Ткачук

**Онлайн:** https://aldrarch.github.io/portfolio/

Статичный сайт-портфолио: архитектор + BIM/Revit. Без сборки — чистые HTML/CSS/JS.

**Структура:** главная страница (index.html), страница всех проектов-альбомом (projects.html),
страница опыта работы (experience.html) и изолированные тёмные страницы-альбомы
(album.html), которые показывают PDF-подачи лист за листом через pdf.js.

## Структура файлов

```
portfolio-site/
├─ index.html            ← главная: обо мне, проекты, навыки, семейства, контакты
├─ projects.html         ← ВСЕ проекты одним альбомом (лист + лайтбокс ← →)
├─ experience.html       ← опыт работы и образование (резюме)
├─ album.html            ← страница-альбом (открывается как album.html?p=<id проекта>)
├─ css/style.css         ← тема главной
├─ css/album.css         ← тема альбома (тёмная)
├─ js/projects-data.js   ← СПИСОК ВСЕХ ПРОЕКТОВ (названия, пути к PDF, описания)
├─ js/main.js            ← карточки, фильтры на главной
├─ js/projects-overview.js ← листы + лайтбокс на projects.html (pdf.js)
├─ js/album.js           ← загрузчик PDF-альбома (ленивый рендер листов)
├─ assets/
│  ├─ img/               ← обложки карточек (cover-*.jpg, до 1800px)
│  ├─ projects/          ← PDF: подачи и курсовые
│  └─ albums/            ← PDF: большие альбомы (диплом 67 л., апартаменты, АЗС…)
├─ assets-revit/         ← семейства Revit (.rfa) для скачивания
└─ tools/
   ├─ serve.py           ← локальный сервер без кэша
   └─ optimize-img.ps1   ← сжатие JPG до 1800px
```

## Как добавить / поправить проект

Всё в одном месте — **js/projects-data.js**. Скопируйте блок и поменяйте поля:

```js
{
  id: "my-project",                        // латиницей, уникальный
  title: "Название проекта",
  tag: "Год · Категория",                  // подпись над названием
  cat: ["architecture"],                   // фильтр: architecture/structures/graphics/research
  desc: "Описание в 1–2 строки.",
  tools: "Revit · Photoshop",
  type: "pdf",                             // или "image"
  src: "assets/projects/my-file.pdf",      // путь к PDF/картинке
  cover: "assets/img/my-cover.jpg"         // необязательно: без него будет заглушка
}
```

Карточка и страница-альбом создадутся автоматически.

## Локальный просмотр

Двойной клик по index.html тоже работает, но лучше сервер:

```
py tools/serve.py 8642
```

Сервер отдаёт файлы без кэша (`Cache-Control: no-store`) — правки видны сразу.

## Публикация

- **Netlify Drop**: перетащить папку на https://app.netlify.com/drop
- **GitHub Pages**: залить папку в репозиторий → Settings → Pages → main.
  Папка ~225 МБ из-за PDF; если репозиторий раздувается — подключите Git LFS
  для `assets/projects/*.pdf` и `assets/albums/*.pdf`. GitHub ограничивает файл
  100 МБ — сейчас все файлы меньше.
- Альбомы грузятся лениво: PDF качается только когда посетитель открыл проект.

## Заменить перед публикацией

1. Контакты в `index.html` (секция «Контакты»): e-mail, Telegram, телефон.
2. При желании — тексты «Обо мне».

## Известное

- В браузере без интернета альбом не откроется: pdf.js подгружается с CDN
  (cdnjs.cloudflare.com). Fallback — кнопка «Открыть PDF в новой вкладке».

---

## Интерактивная 3D-модель (APS Viewer)

Компонент «Интерактивная BIM-модель» встроен в страницу-альбом:
демо доступно по адресу `album.html?p=bim-demo`.

### Файлы компонента

| Файл | Назначение |
|---|---|
| `js/aps/aps-viewer.js` | ядро + минималистичный UI (Модель / Виды / Категории / Разрез / Fit / Сброс) |
| `js/aps/three-placeholder.js` | демо-движок (three.js) — павильон с выбором, категориями, разрезом и живыми параметрами |
| `js/aps/autodesk-engine.js` | адаптер Autodesk Viewer v7 для реальных моделей (URN → SVF2) |
| `js/aps/aps-models.json` | реестр моделей: добавляйте сюда новые записи |
| `css/aps-viewer.css` | стили (тёмная тема альбомов + `.aps-light` для светлых страниц) |
| `tools/aps/aps-server.py` | токен-сервер APS (`/api/aps/token`), секреты читает из `.env` |
| `tools/aps/aps-upload.py` | загрузка RVT: bucket → OSS → Model Derivative (SVF2) → URN |
| `projects/<имя>/` | папки под `model.rvt` каждого проекта |

### Как подключить реальную модель (RVT)

1. Создайте приложение на https://developer.autodesk.com (APS, key type: *Server-to-Server*).
2. Рядом с `portfolio-site` создайте файл `.env` (не коммитится):
   `APS_CLIENT_ID=...` и `APS_CLIENT_SECRET=...`
3. Положите модель в `projects/mars/model.rvt` и выполните:
   `py tools/aps/aps-upload.py projects/mars/model.rvt`
   Дождитесь `status: complete` — команда напечатает base64-URN.
4. Впишите URN в `js/aps/aps-models.json`:
   ```json
   { "id": "mars", "title": "...", "engine": "autodesk", "urn": "<base64-URN>" }
   ```
5. Для локального просмотра реальных моделей запустите токен-сервер:
   `py tools/aps/aps-server.py 8643` (фронт запросит `/api/aps/token`).

Секреты существуют только в `.env` и в токен-сервере на вашей машине —
во фронтенде их нет. Для GitHub Pages реальным моделям нужен любой
HTTPS-эндпоинт, отдающий `access_token` (Cloudflare Worker / Vercel
function — тот же код из `aps-server.py`).

### Как добавить viewer в другой проект

1. Добавьте запись в `js/aps/aps-models.json` (свой `id`).
2. В `album.html` секция `#aps-section` уже есть — она включается для
   любого проекта с `type: "aps"` в `projects-data.js`.
3. В `js/album.js` передайте нужный id: `ApsViewer.mount(host, { projectId: 'mars' })`.

### Будущее: параметрические семейства

API уже готово: клик по элементу показывает свойства и слайдеры параметров;
`viewer.setParameters(dbId, { Width, Height, Rotation, Spacing })` меняет
геометрию живьём (в демо-движке). Для реальных RVT адаптер APS добавит
запись параметров на сервер (Autodesk DA / собственный сервис) — контракт
`applyParams(dbId, params)` останется тем же.
