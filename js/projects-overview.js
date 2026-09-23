/* Все проекты (projects.html): листы-миниатюры, фильтры.
   Клик по любому проекту — прямой переход на страницу кейса.
   (PDF-лайтбокс удалён по замечанию — файлы проектов встроены в кейс-страницы.) */

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', () => {
  const sheetsWrap = document.getElementById('sheets');
  if (!sheetsWrap || typeof PROJECTS === 'undefined') return;

  const pad = n => String(n).padStart(2, '0');

  /* ---------- Сортировка по курсам (по убыванию) ---------- */
  const courseOf = p => {
    const m = (p.tag || '').match(/^(\d)\s*курс/);
    return m ? +m[1] : (p.cat || []).includes('diploma') ? 6 : 0;
  };
  const courseName = c => ({
    6: 'Диплом', 5: '5 курс', 4: '4 курс', 3: '3 курс',
    2: '2 курс', 0: 'Прочее'
  })[c] || 'Прочее';
  const order = [...PROJECTS.keys()].sort((a, b) =>
    courseOf(PROJECTS[b]) - courseOf(PROJECTS[a]) || a - b);
  const ordered = order.map(i => PROJECTS[i]);

  /* ---------- Сетка листов с разделителями курсов ---------- */
  const parent = sheetsWrap.parentElement;
  sheetsWrap.remove();
  const wrap = document.createElement('div');
  wrap.className = 'sheets';
  parent.appendChild(wrap);

  let lastCourse = null;
  let num = 0;
  ordered.forEach((p, oi) => {
    const co = courseOf(p);
    if (co !== lastCourse) {
      const div = document.createElement('div');
      div.className = 'course-divider';
      div.innerHTML = `<span>${courseName(co)}</span>`;
      wrap.appendChild(div);
      lastCourse = co;
    }
    num++;
    const isPortfolio = p.id === 'portfolio-2026';
    const mediaInner = p.cover
      ? `<img src="${p.cover}" alt="${p.title}" loading="lazy">`
      : `<div class="sheet-ph"><span>Лист</span><strong>${p.title}</strong><em>${p.tag}</em></div>`;
    const fig = document.createElement('figure');
    fig.className = 'sheet reveal';
    fig.dataset.i = order[oi];
    fig.dataset.cat = (p.cat || []).join(' ');
    fig.dataset.href = isPortfolio ? 'portfolio.html' : `project.html?p=${p.id}`;
    fig.tabIndex = 0;
    fig.setAttribute('role', 'link');
    fig.setAttribute('aria-label', p.title);
    fig.innerHTML = `
      <div class="sheet-media">${mediaInner}</div>
      <figcaption>
        <span class="sheet-num">${pad(num)}</span>
        <span class="sheet-title">${p.title}${isPortfolio ? ' <em class="case-mark">сетка листов</em>' : ''}</span>
        <span class="sheet-tag">${p.tag}</span>
      </figcaption>`;
    wrap.appendChild(fig);
  });

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) { el.classList.add('is-visible'); }
    else { io.observe(el); }
  });

  /* ---------- Фильтры («Портфолио» ведёт на уникальную страницу сетки) ---------- */
  const filterBtns = document.querySelectorAll('#filters .filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.filter === 'portfolio') { location.href = 'portfolio.html'; return; }
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.sheets .sheet').forEach(sh => {
        const cats = (sh.dataset.cat || '').split(/\s+/);
        sh.classList.toggle('is-hidden', !(f === 'all' || cats.includes(f)));
      });
    });
  });

  /* ---------- Переход на страницу кейса ---------- */
  wrap.addEventListener('click', e => {
    const sh = e.target.closest('.sheet');
    if (!sh) return;
    if (sh.dataset.href) location.href = sh.dataset.href;
  });
  wrap.addEventListener('keydown', e => {
    const sh = e.target.closest('.sheet');
    if (sh && (e.key === 'Enter' || e.key === ' ') && sh.dataset.href) {
      e.preventDefault();
      location.href = sh.dataset.href;
    }
  });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  }
});
