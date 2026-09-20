/* Единый список проектов — используется главной страницей и альбомом.
   Чтобы добавить проект: скопируйте блок и поменяйте поля.
   cat: architecture / structures / graphics / research (фильтры на главной) */

const PROJECTS = [
  {
    id: "diplom",
    title: "Центр освоения Марса в наукограде Кольцово",
    tag: "Диплом · 2026",
    cat: ["architecture", "diploma"],
    desc: "Выпускной альбом: задание, градостроительный анализ, концепция, планы, фасады, разрезы, узлы и пояснительная записка — 67 листов.",
    tools: "Revit · Photoshop · подача",
    type: "pdf",
    src: "assets/albums/diplom-album.pdf",
    cover: "assets/img/cover-diplom.jpg"
  },
  {
    id: "river-terminal",
    title: "Реконструкция территории с речным вокзалом",
    tag: "5 курс · Экология",
    cat: ["architecture"],
    desc: "Комплексная градостроительная оценка и реконструкция фрагмента территории: ситуационная схема, анализ пользователей, концепция — 15 листов.",
    tools: "Граданализ · Revit · подача",
    type: "pdf",
    src: "assets/projects/river-terminal.pdf",
    cover: "assets/img/cover-visual.jpg"
  },
  {
    id: "apartments",
    title: "Апартаменты",
    tag: "4 курс · Жильё",
    cat: ["architecture"],
    desc: "Альбом курсового проекта жилого дома с апартаментами: планы этажей, фасады, разрезы, ведомость чертежей — 10 листов.",
    tools: "Revit · АР",
    type: "pdf",
    src: "assets/albums/apartments-album.pdf",
    cover: "assets/img/cover-fasady.jpg"
  },
  {
    id: "azs",
    title: "АЗС с навесом и кафе",
    tag: "2 курс · Подача",
    cat: ["architecture"],
    desc: "Подача проекта автозаправочной станции: общий вид, схема планировки, экспликация.",
    tools: "Подача · чертежи",
    type: "pdf",
    src: "assets/albums/azs.pdf"
  },
  {
    id: "library",
    title: "Интерьер читального зала библиотеки",
    tag: "3 курс · Интерьер",
    cat: ["architecture"],
    desc: "Интерьерное решение читального зала: планировка, материалы, свет, подача проекта.",
    tools: "Интерьер · подача",
    type: "pdf",
    src: "assets/projects/library.pdf",
    cover: "assets/img/cover-plans.jpg"
  },
  {
    id: "cafe-canopy",
    title: "Навес с кафе",
    tag: "2 курс · Малые формы",
    cat: ["architecture"],
    desc: "Лёгкая конструкция: навес и кафе, чертежи фасадов, узлы, пояснительная записка.",
    tools: "Чертежи · конструкции",
    type: "pdf",
    src: "assets/projects/cafe-canopy.pdf",
    cover: "assets/img/cover-fasady2.jpg"
  },
  {
    id: "mzhd",
    title: "Многоэтажное жилое здание (МЖД)",
    tag: "4 курс · Курсовой проект",
    cat: ["architecture", "structures"],
    desc: "Курсовой проект многоэтажного жилого дома: объёмно-планировочное решение и архитектурные чертежи.",
    tools: "АР · Revit",
    type: "pdf",
    src: "assets/projects/mzhd.pdf"
  },
  {
    id: "mmzhd",
    title: "Многоэтажное здание (ММЖД)",
    tag: "3 курс · Курсовой проект",
    cat: ["architecture", "structures"],
    desc: "Проект многоэтажного здания: конструктивная схема, планы, разрезы, узлы и пояснительная записка.",
    tools: "Чертежи · конструкции",
    type: "pdf",
    src: "assets/projects/mmzhd.pdf"
  },
  {
    id: "metall",
    title: "Металлические конструкции",
    tag: "3 курс · Курсовая",
    cat: ["structures"],
    desc: "Расчёт и конструирование балочной площадки: подбор сечений второстепенной и главной балок, узлы — 26 листов.",
    tools: "КМ · расчёт · чертежи",
    type: "pdf",
    src: "assets/projects/metall.pdf"
  },
  {
    id: "zhbk",
    title: "Железобетонные конструкции",
    tag: "4 курс · Курсовая",
    cat: ["structures"],
    desc: "Компоновка конструктивной схемы, расчёт и армирование железобетонных элементов — 19 листов.",
    tools: "ЖБК · расчёт · чертежи",
    type: "pdf",
    src: "assets/projects/zhbk.pdf"
  },
  {
    id: "zhbk-montazh",
    title: "Монтаж сборных железобетонных конструкций",
    tag: "Курсовая · Монтаж",
    cat: ["structures"],
    desc: "Определение объёмов монтажных работ, выбор приспособлений и монтажного оснащения — 30 листов.",
    tools: "ЖБК · монтажные работы",
    type: "pdf",
    src: "assets/albums/zhbk-montazh.pdf"
  },
  {
    id: "wood",
    title: "Деревянные конструкции",
    tag: "4 курс · Курсовая",
    cat: ["structures"],
    desc: "Курсовая по деревянным конструкциям: несущая схема, расчёт, узлы опирания, чертежи.",
    tools: "КД · чертежи",
    type: "pdf",
    src: "assets/projects/wood.pdf"
  },
  {
    id: "razdel2",
    title: "Раздел 2 — выпускной работы",
    tag: "4 курс · Раздел",
    cat: ["structures"],
    desc: "Раздел выпускной квалификационной работы: пояснительная часть и чертежи.",
    tools: "ПЗ · чертежи",
    type: "pdf",
    src: "assets/projects/razdel2.pdf"
  },
  {
    id: "razdel3",
    title: "Раздел 3 — выпускной работы",
    tag: "4 курс · Раздел",
    cat: ["structures"],
    desc: "Раздел выпускной квалификационной работы: пояснительная часть и чертежи.",
    tools: "ПЗ · чертежи",
    type: "pdf",
    src: "assets/projects/razdel3.pdf"
  },
  {
    id: "practice",
    title: "Отчёт по производственной практике",
    tag: "5 курс · Практика",
    cat: ["research", "architecture"],
    desc: "Производственная практика: задачи, инструмент, результаты, работа с генпланом и топоосновой — 95 листов.",
    tools: "Генплан · съёмка территории",
    type: "pdf",
    src: "assets/projects/practice.pdf",
    cover: "assets/img/cover-genplan.jpg"
  },
  {
    id: "practice2",
    title: "Отчёт по учебной практике",
    tag: "3 курс · Практика",
    cat: ["research"],
    desc: "Ознакомительная практика: подземные сооружения, экскурсия на производство Rehau, индивидуальное задание — 16 листов.",
    tools: "Отчёт · дневник",
    type: "pdf",
    src: "assets/albums/practice-report2.pdf"
  },
  {
    id: "kembridge",
    title: "Кембридж — Омск",
    tag: "Реферат · Исследование",
    cat: ["research"],
    desc: "Исследовательская презентация: сравнение двух университетских городов, градостроительные параллели — 69 листов.",
    tools: "Исследование · презентация",
    type: "pdf",
    src: "assets/projects/kembridge.pdf"
  },
  {
    id: "composition-3",
    title: "Объёмно-пространственная композиция",
    tag: "3 курс · ОПК",
    cat: ["graphics"],
    desc: "Композиционное упражнение: массивность, лёгкость, статика и динамика в объёме.",
    tools: "Макет · графика",
    type: "pdf",
    src: "assets/projects/composition-3.pdf",
    cover: "assets/img/cover-ogpk.jpg"
  },
  {
    id: "klauzura",
    title: "Клаузура",
    tag: "4 курс · Графика",
    cat: ["graphics"],
    desc: "Быстрая проектная подача за ограниченное время — архитектурная графика.",
    tools: "Ручная графика",
    type: "image",
    src: "assets/img/cover-klauzura1.jpg"
  },
  {
    id: "ofk",
    title: "Композиция · фронтальная графика",
    tag: "2 курс · ОПК",
    cat: ["graphics"],
    desc: "Учебная работа по фронтальной композиции.",
    tools: "Графика",
    type: "image",
    src: "assets/img/cover-ofk.jpg"
  }
];
