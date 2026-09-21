/* Портфолио Александры Ткачук — главная: три избранных проекта с лайтбоксом,
   карусель «Обо мне → Ценности → Цель». */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Три избранных проекта ---------- */
  const FEATURED = ['diplom', 'portfolio-2026', 'river-terminal'];
  const cardsWrap = document.getElementById('cards');
  if (cardsWrap && typeof PROJECTS !== 'undefined') {
    const featured = FEATURED.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean);
    cardsWrap.innerHTML = featured.map((p, i) => {
      const cover = p.cover || '';
      const mediaInner = cover
        ? `<img src="${cover}" alt="${p.title}" loading="lazy">`
        : `<div class="card-media-ph"><span>Альбом</span><strong>${p.title}</strong></div>`;
      return `
      <article class="card reveal" data-id="${p.id}" data-idx="${i}" style="transition-delay:${i * 0.08}s" tabindex="0" role="button" aria-label="${p.title}">
        <div class="card-media">
          ${mediaInner}
          <span class="card-open">Смотреть ↗</span>
        </div>
        <div class="card-body">
          <p class="card-cat">${p.tag}</p>
          <h3>${p.title}</h3>
          <p class="card-desc">${p.desc}</p>
          <p class="card-tools">${p.tools}</p>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
    else io.observe(el);
  });

  /* ---------- Лайтбокс избранных (PDF-первая страница через pdf.js) ---------- */
  (() => {
    const lb = document.getElementById('lightbox');
    if (!lb || typeof PROJECTS === 'undefined') return;
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const featured = FEATURED.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean);
    const holder = document.getElementById('lbHolder');
    const elCounter = document.getElementById('lbCounter');
    const elTitle = document.getElementById('lbTitle');
    const elTag = document.getElementById('lbTag');
    const elAlbum = document.getElementById('lbAlbum');
    let currentProject = null;
    const pageCache = new Map();

    async function firstPageDataURL(project) {
      if (project.type !== 'pdf' || !window.pdfjsLib) return null;
      if (pageCache.has(project.id)) return pageCache.get(project.id);
      const doc = await pdfjsLib.getDocument(project.src).promise;
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1400 / base.width, 2);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
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
      } else {
        elAlbum.href = `album.html?p=${project.id}`;
        elAlbum.textContent = 'Открыть весь альбом →';
      }
      holder.innerHTML = '<div class="lb-loading">Загрузка листа…</div>';
      try {
        const url = await firstPageDataURL(project);
        if (currentProject !== project) return;
        holder.innerHTML = url
          ? `<img src="${url}" alt="${project.title}">`
          : `<img src="${project.src}" alt="${project.title}">`;
      } catch (e) {
        if (currentProject !== project) return;
        holder.innerHTML = `<div class="lb-loading">Не удалось открыть — <a href="${project.src}" target="_blank">скачать файл</a></div>`;
      }
    }

    function openAt(i) {
      currentProject = featured[i];
      elCounter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(featured.length).padStart(2, '0')}`;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      show(currentProject);
    }
    function step(d) { openAt((+lb.dataset.cur + d + featured.length) % featured.length); }

    cardsWrap.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (card) { lb.dataset.cur = card.dataset.idx; openAt(+card.dataset.idx); }
    });
    cardsWrap.addEventListener('keydown', e => {
      const card = e.target.closest('.card');
      if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lb.dataset.cur = card.dataset.idx; openAt(+card.dataset.idx); }
    });

    document.getElementById('lbClose').addEventListener('click', () => { lb.hidden = true; document.body.style.overflow = ''; currentProject = null; });
    document.getElementById('lbPrev').addEventListener('click', () => step(-1));
    document.getElementById('lbNext').addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb) { lb.hidden = true; document.body.style.overflow = ''; currentProject = null; } });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') { lb.hidden = true; document.body.style.overflow = ''; currentProject = null; }
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  })();

  /* ---------- Карусель «Обо мне → Ценности → Цель» ---------- */
  (() => {
    const car = document.getElementById('about-carousel');
    if (!car) return;
    const track = car.querySelector('#about-track');
    const panes = [...car.querySelectorAll('.about-pane')];
    const dots = [...car.querySelectorAll('.about-dot')];
    const arrow = car.querySelector('#about-next');
    let cur = 0;

    function show(n) {
      cur = (n + panes.length) % panes.length;
      panes.forEach((p, i) => p.classList.toggle('is-active', i === cur));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
      track.style.transform = `translateX(-${cur * 100}%)`;
      arrow.setAttribute('aria-label', 'Следующий слайд');
    }

    arrow.addEventListener('click', () => show(cur + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const r = car.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      show(cur + (e.key === 'ArrowRight' ? 1 : -1));
    });
  })();
});
