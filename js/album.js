/* ================= ALBUM VIEWER ================= */

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const params = new URLSearchParams(location.search);
const pid = params.get('p') || 'diplom';
const pIdx = PROJECTS.findIndex(p => p.id === pid);
const project = PROJECTS[pIdx >= 0 ? pIdx : 0];

/* ---------- Шапка ---------- */
document.title = `${project.title} — Альбом · Александра Ткачук`;
document.getElementById('album-title').textContent = project.title;
document.getElementById('album-tag').textContent = `${project.tag} · ${project.tools}`;

/* ---------- Следующий проект ---------- */
const nextProject = PROJECTS[(pIdx + 1 + PROJECTS.length) % PROJECTS.length];
document.getElementById('album-next-link').href = `album.html?p=${nextProject.id}`;
document.getElementById('album-next-title').textContent = nextProject.title;

/* ---------- Утилиты ---------- */
const main = document.getElementById('album-main');
const loader = document.getElementById('album-loader');
const loaderText = document.getElementById('album-loader-text');
const counter = document.getElementById('album-counter');
const MAX_W = 1600;

function hideLoader() { loader.style.display = 'none'; }
function setCounter(text) { counter.textContent = text; }

function showPdfError() {
  hideLoader();
  main.innerHTML = `
    <div class="album-fallback">
      <p>Не удалось показать альбом прямо на странице.</p>
      <a class="btn btn-solid" href="${project.src}" target="_blank" rel="noopener">Открыть PDF в новой вкладке ↗</a>
    </div>`;
}

function showImage() {
  hideLoader();
  setCounter('1 / 1');
  main.innerHTML = `<figure class="album-sheet is-single"><img src="${project.src}" alt="${project.title}"></figure>`;
}

/* ---------- Ленивый рендер PDF-листов ----------
   Планировщик на rAF + getBoundingClientRect: надёжнее IntersectionObserver
   (в некоторых webview IO не срабатывает). Рендерим листы рядом с экраном,
   максимум 2 одновременно. */
async function renderPdf() {
  if (!window.pdfjsLib) { showPdfError(); return; }
  try {
    const pdf = await pdfjsLib.getDocument({ url: project.src }).promise;
    const total = pdf.numPages;
    setCounter(`1 / ${total}`);
    hideLoader();

    const sheets = [];
    for (let n = 1; n <= total; n++) {
      const fig = document.createElement('figure');
      fig.className = 'album-sheet';
      fig.innerHTML = `
        <img alt="Лист ${n}">
        <figcaption>
          <span class="sheet-no">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
          <span class="sheet-name">${project.title}</span>
        </figcaption>`;
      main.appendChild(fig);
      sheets.push(fig);
    }

    const renderSheet = (fig, n) => {
      const img = fig.querySelector('img');
      if (img.dataset.done) return true;
      img.dataset.done = '1';
      pdf.getPage(n).then(async page => {
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2.2, Math.max(1.1, MAX_W / base.width));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        img.src = canvas.toDataURL('image/jpeg', 0.86);
        canvas.width = canvas.height = 0;
      }).catch(() => fig.classList.add('is-broken'));
      return true;
    };

    const MARGIN = 900;
    const pending = new Map();          // fig -> n
    sheets.forEach((fig, i) => pending.set(fig, i + 1));
    let active = 0;

    function tick() {
      if (pending.size === 0) return;
      const vh = window.innerHeight;
      let running = 0;
      for (const [fig, n] of pending) {
        const r = fig.getBoundingClientRect();
        const near = r.top < vh + MARGIN && r.bottom > -MARGIN;
        if (img_done(fig)) pending.delete(fig);
        else if (near && running < 2) { renderSheet(fig, n); pending.delete(fig); running++; }
      }
      updateCounter();
    }
    function img_done(fig) { return fig.querySelector('img').dataset.done === '1'; }

    function updateCounter() {
      const vh = window.innerHeight;
      let best = null, bestTop = Infinity;
      sheets.forEach(fig => {
        const r = fig.getBoundingClientRect();
        if (r.top < vh * 0.6 && r.bottom > 0 && r.top < bestTop) { bestTop = r.top; best = fig; }
      });
      if (best) setCounter(best.querySelector('.sheet-no').textContent);
    }

    // первый лист — сразу, остальные по мере приближения
    renderSheet(sheets[0], 1);
    pending.delete(sheets[0]);
    window.addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
    window.addEventListener('resize', () => requestAnimationFrame(tick), { passive: true });
    const iv = setInterval(() => { tick(); if (pending.size === 0) clearInterval(iv); }, 700);
    tick();
  } catch (err) {
    console.error('PDF load failed:', err);
    showPdfError();
  }
}

/* ---------- Запуск ---------- */
if (project.type === 'aps') {
  // интерактивная 3D-модель вместо листов альбома
  hideLoader();
  main.hidden = true;
  const sec = document.getElementById('aps-section');
  sec.hidden = false;
  counter.textContent = '3D';
  window.__aps = window.ApsViewer.mount(document.getElementById('aps-host'), { projectId: 'demo' });
} else if (project.type === 'image') {
  showImage();
} else {
  renderPdf();
}

/* ---------- Плавный скролл-наверх по логотипу, активный заголовок ---------- */
document.querySelector('.album-back').addEventListener('click', () => {});
