/* Сетка листов портфолио на projects.html:
   открывается по плашке-фильтру «Портфолио» или клику по карточке портфолио.
   Модальная сетка всех листов portfolio-2026.pdf + увеличение и листание. */
(function () {
  'use strict';
  const P = (typeof PROJECTS !== 'undefined') && PROJECTS.find(x => x.id === 'portfolio-2026');
  if (!P || !window.pdfjsLib) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const overlay = document.getElementById('pf-overlay');
  const grid = document.getElementById('pf-grid');
  const counter = document.getElementById('pf-grid-counter');
  if (!overlay || !grid) return;
  let pdfDoc = null, pages = [];

  /* ---------- рендер одной страницы в канвас ---------- */
  async function renderPage(n, canvas, maxW) {
    const page = await pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min((maxW || 900) / base.width, 2);
    const vp = page.getViewport({ scale });
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    canvas.dataset.done = '1';
  }

  /* ---------- модальная сетка ---------- */
  async function openGrid() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!grid.children.length) {
      grid.innerHTML = '<p class="pf-loading">Загрузка альбома…</p>';
      pdfDoc = await pdfjsLib.getDocument(P.src).promise;
      const total = pdfDoc.numPages;
      grid.innerHTML = '';
      for (let n = 1; n <= total; n++) {
        const fig = document.createElement('figure');
        fig.className = 'pf-cell';
        fig.innerHTML = `<canvas></canvas><figcaption><span>${String(n).padStart(2, '0')}</span> / ${String(total).padStart(2, '0')}</figcaption>`;
        grid.appendChild(fig);
        pages.push(fig);
        renderPage(n, fig.querySelector('canvas'), 900).catch(() => fig.classList.add('is-broken'));
      }
      counter.textContent = `${total} листов`;
      grid.addEventListener('click', e => {
        const cell = e.target.closest('.pf-cell');
        if (cell) openViewer(pages.indexOf(cell));
      });
    }
  }

  function closeGrid() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- увеличение одного листа + листание ---------- */
  const vw = document.createElement('div');
  vw.className = 'pf-viewer';
  vw.hidden = true;
  vw.innerHTML = `
    <button class="pf-v-close" aria-label="Закрыть">×</button>
    <button class="pf-v-arrow pf-v-prev" aria-label="Предыдущий лист">‹</button>
    <figure class="pf-v-stage"><canvas></canvas></figure>
    <button class="pf-v-arrow pf-v-next" aria-label="Следующий лист">›</button>
    <p class="pf-v-counter"></p>`;
  document.body.appendChild(vw);
  const vCanvas = vw.querySelector('canvas');
  const vCounter = vw.querySelector('.pf-v-counter');
  let vIdx = 0;

  async function showViewerPage() {
    const fig = pages[vIdx];
    const src = fig.querySelector('canvas');
    vCounter.textContent = fig.querySelector('figcaption').textContent;
    if (src.dataset.done) {
      vCanvas.width = src.width; vCanvas.height = src.height;
      vCanvas.getContext('2d').drawImage(src, 0, 0);
    } else {
      vCanvas.width = 800; vCanvas.height = 1131;
      await renderPage(vIdx + 1, vCanvas, 1600);
    }
  }

  function openViewer(i) {
    vIdx = (i + pages.length) % pages.length;
    vw.hidden = false;
    showViewerPage();
  }
  function stepViewer(d) { openViewer(vIdx + d); }

  vw.querySelector('.pf-v-close').addEventListener('click', () => { vw.hidden = true; });
  vw.querySelector('.pf-v-prev').addEventListener('click', () => stepViewer(-1));
  vw.querySelector('.pf-v-next').addEventListener('click', () => stepViewer(1));
  document.addEventListener('keydown', e => {
    if (!vw.hidden) {
      if (e.key === 'Escape') vw.hidden = true;
      if (e.key === 'ArrowLeft') stepViewer(-1);
      if (e.key === 'ArrowRight') stepViewer(1);
    }
  });
  let tx = null;
  vw.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  vw.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) stepViewer(dx < 0 ? 1 : -1);
    tx = null;
  }, { passive: true });

  /* ---------- триггеры открытия сетки ---------- */
  const openBtn = document.getElementById('open-portfolio-grid');
  if (openBtn) openBtn.addEventListener('click', openGrid);

  /* фильтр «Портфолио» открывает сетку вместо фильтрации */
  const pfFilter = document.querySelector('#filters .filter[data-filter="portfolio"]');
  if (pfFilter) {
    pfFilter.addEventListener('click', e => {
      e.stopImmediatePropagation();
      /* снять активность с фильтров, вернуть «Все» */
      document.querySelectorAll('#filters .filter').forEach(b => b.classList.remove('is-active'));
      document.querySelector('#filters .filter[data-filter="all"]').classList.add('is-active');
      document.querySelectorAll('.sheets .sheet').forEach(sh => sh.classList.remove('is-hidden'));
      openGrid();
    }, true);
  }

  const closeBtn = document.getElementById('pf-grid-close');
  if (closeBtn) closeBtn.addEventListener('click', closeGrid);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGrid(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeGrid(); });
})();
