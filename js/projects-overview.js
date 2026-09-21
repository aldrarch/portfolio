/* Все проекты (projects.html): листы-миниатюры, фильтры, лайтбокс с увеличением
   и листанием альбома. Первые страницы PDF рендерятся через pdf.js по требованию. */

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
    const isCase = typeof CASES !== 'undefined' && CASES[p.id];
    const mediaInner = p.cover
      ? `<img src="${p.cover}" alt="${p.title}" loading="lazy">`
      : `<div class="sheet-ph"><span>Лист</span><strong>${p.title}</strong><em>${p.tag}</em></div>`;
    const fig = document.createElement('figure');
    fig.className = 'sheet reveal';
    fig.dataset.i = order[oi];
    fig.dataset.cat = (p.cat || []).join(' ');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', p.title);
    fig.innerHTML = `
      <div class="sheet-media">${mediaInner}</div>
      <figcaption>
        <span class="sheet-num">${pad(num)}</span>
        <span class="sheet-title">${p.title}${isCase ? ' <em class="case-mark">case study</em>' : ''}</span>
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

  /* ---------- Фильтры ---------- */
  const filterBtns = document.querySelectorAll('#filters .filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.sheets .sheet').forEach(sh => {
        const cats = (sh.dataset.cat || '').split(/\s+/);
        sh.classList.toggle('is-hidden', !(f === 'all' || cats.includes(f)));
      });
    });
  });

  /* ---------- Лайтбокс ---------- */
  const lb = document.getElementById('lightbox');
  const holder = document.getElementById('lbHolder');
  const elCounter = document.getElementById('lbCounter');
  const elTitle = document.getElementById('lbTitle');
  const elTag = document.getElementById('lbTag');
  const elAlbum = document.getElementById('lbAlbum');
  let current = 0;
  const pageCache = new Map(); // id -> dataURL первой страницы PDF

  function visibleIndices() {
    const idx = [];
    document.querySelectorAll('.sheets .sheet:not(.is-hidden)').forEach(sh => idx.push(+sh.dataset.i));
    return idx;
  }

  async function firstPageDataURL(project) {
    if (project.type !== 'pdf' || !window.pdfjsLib) return null;
    if (pageCache.has(project.id)) return pageCache.get(project.id);
    const doc = await pdfjsLib.getDocument(project.src).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1400 / base.width, 2);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const url = canvas.toDataURL('image/jpeg', 0.85);
    pageCache.set(project.id, url);
    return url;
  }

  async function show(project) {
    elTitle.textContent = project.title;
    elTag.textContent = project.tag;
    const isCase = typeof CASES !== 'undefined' && CASES[project.id];
    if (isCase) {
      elAlbum.href = `project.html?p=${project.id}`;
      elAlbum.textContent = 'Открыть case study →';
    } else if (project.type === 'pdf') {
      elAlbum.href = `album.html?p=${project.id}`;
      elAlbum.textContent = 'Открыть весь альбом →';
    } else {
      elAlbum.href = project.src;
      elAlbum.textContent = 'Открыть лист →';
    }
    holder.innerHTML = '<div class="lb-loading">Загрузка листа…</div>';
    try {
      const url = await firstPageDataURL(project);
      if (currentProject !== project) return; // пользователь уже перелистнул
      holder.innerHTML = url
        ? `<img src="${url}" alt="${project.title}">`
        : `<img src="${project.src}" alt="${project.title}">`;
    } catch (e) {
      if (currentProject !== project) return;
      holder.innerHTML = `<div class="lb-loading">Не удалось открыть PDF — <a href="${project.src}" target="_blank">скачать файл</a></div>`;
    }
  }

  let currentProject = null;

  function openAt(i) {
    current = i;
    currentProject = PROJECTS[i];
    const vis = visibleIndices();
    elCounter.textContent = `${pad(vis.indexOf(i) + 1)} / ${pad(vis.length)}`;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(currentProject);
  }

  function step(dir) {
    const vis = visibleIndices();
    if (!vis.length) return;
    let pos = vis.indexOf(current);
    pos = (pos + dir + vis.length) % vis.length;
    openAt(vis[pos]);
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
    currentProject = null;
  }

  wrap.addEventListener('click', e => {
    const sh = e.target.closest('.sheet');
    if (sh) openAt(+sh.dataset.i);
  });
  wrap.addEventListener('keydown', e => {
    const sh = e.target.closest('.sheet');
    if (sh && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openAt(+sh.dataset.i); }
  });

  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => step(-1));
  document.getElementById('lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* Свайп на мобильных */
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  }
});
