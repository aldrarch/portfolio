/* Сетка листов портфолио на отдельной странице portfolio.html:
   рендер всех листов portfolio-2026.pdf + увеличение и листание. */
(function () {
  'use strict';
  const P = (typeof PROJECTS !== 'undefined') && PROJECTS.find(x => x.id === 'portfolio-2026');
  const SRC = P ? P.src : 'assets/albums/portfolio-2026.pdf';
  if (!window.pdfjsLib) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const grid = document.getElementById('pf-grid');
  if (!grid) return;

  /* ---------- рендер одной страницы в канвас ---------- */
  async function renderPage(pdfDoc, n, canvas, maxW) {
    const page = await pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min((maxW || 900) / base.width, 2);
    const vp = page.getViewport({ scale });
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    canvas.style.aspectRatio = "";
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    canvas.dataset.done = '1';
  }

  /* ---------- зум-вьюер одного листа ---------- */
  const vw = document.getElementById('pf-viewer');
  const vCanvas = document.getElementById('pf-v-canvas');
  const vCounter = document.getElementById('pf-v-counter');
  let pdfDoc = null, pages = [], vIdx = 0;

  async function showViewerPage() {
    const src = pages[vIdx].querySelector('canvas');
    vCounter.textContent = pages[vIdx].querySelector('figcaption').textContent;
    if (src.dataset.done) {
      vCanvas.width = src.width; vCanvas.height = src.height;
      vCanvas.style.aspectRatio = '';
      vCanvas.getContext('2d').drawImage(src, 0, 0);
    } else if (pdfDoc) {
      vCanvas.width = 800; vCanvas.height = 1131;
      vCanvas.style.aspectRatio = '';
      await renderPage(pdfDoc, vIdx + 1, vCanvas, 1600);
    }
  }
  function openViewer(i) { vIdx = (i + pages.length) % pages.length; vw.hidden = false; showViewerPage(); }
  function stepViewer(d) { openViewer(vIdx + d); }
  function closeViewer() { vw.hidden = true; }

  document.getElementById('pf-v-close').addEventListener('click', closeViewer);
  document.getElementById('pf-v-prev').addEventListener('click', () => stepViewer(-1));
  document.getElementById('pf-v-next').addEventListener('click', () => stepViewer(1));
  document.addEventListener('keydown', e => {
    if (vw.hidden) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') stepViewer(-1);
    if (e.key === 'ArrowRight') stepViewer(1);
  });
  let tx = null;
  vw.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  vw.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) stepViewer(dx < 0 ? 1 : -1);
    tx = null;
  }, { passive: true });

  /* ---------- сетка листов ---------- */
  (async function build() {
    grid.innerHTML = '<p class="pf-loading">Загрузка альбома…</p>';
    try {
      pdfDoc = await pdfjsLib.getDocument(SRC).promise;
    } catch (e) {
      grid.innerHTML = '<p class="pf-loading">Не удалось загрузить альбом.</p>';
      return;
    }
    const total = pdfDoc.numPages;
    grid.innerHTML = '';
    for (let n = 1; n <= total; n++) {
      const fig = document.createElement('figure');
      fig.className = 'pf-cell';
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'Лист ' + n);
      fig.innerHTML = `<canvas></canvas><figcaption><span class="pf-num">${String(n).padStart(2, '0')}</span></figcaption>`;
      grid.appendChild(fig);
      pages.push(fig);
      renderPage(pdfDoc, n, fig.querySelector('canvas'), 900)
        .catch(() => fig.classList.add('is-broken'));
    }
    grid.addEventListener('click', e => {
      const cell = e.target.closest('.pf-cell');
      if (cell) openViewer(pages.indexOf(cell));
    });
    grid.addEventListener('keydown', e => {
      const cell = e.target.closest('.pf-cell');
      if (cell && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openViewer(pages.indexOf(cell)); }
    });
  })();

  /* мобильное меню */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  }
})();
