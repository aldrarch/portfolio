/* Портфолио Александры Ткачук — главная: три избранных проекта (прямая навигация),
   карусель «Обо мне → Ценности → Цель». */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Три избранных проекта: клик → страница проекта ---------- */
  const FEATURED = ['diplom', 'portfolio-2026', 'river-terminal'];
  const HREF = { 'portfolio-2026': 'portfolio.html', 'diplom': 'project.html?p=diplom', 'river-terminal': 'project.html?p=river-terminal' };
  const cardsWrap = document.getElementById('cards');
  if (cardsWrap && typeof PROJECTS !== 'undefined') {
    const featured = FEATURED.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean);
    cardsWrap.innerHTML = featured.map((p, i) => {
      const cover = p.cover || '';
      const mediaInner = cover
        ? `<img src="${cover}" alt="${p.title}" loading="lazy">`
        : `<div class="card-media-ph"><span>Альбом</span><strong>${p.title}</strong></div>`;
      return `
      <a class="card reveal" href="${HREF[p.id] || `project.html?p=${p.id}`}" style="transition-delay:${i * 0.08}s" aria-label="${p.title}">
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
      </a>`;
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

  /* ---------- Карусель «Обо мне → Ценности → Цель» ---------- */
  (() => {
    const car = document.getElementById('about-carousel');
    if (!car) return;
    const track = car.querySelector('#about-track');
    const panes = [...car.querySelectorAll('.about-pane')];
    const dots = [...car.querySelectorAll('.about-dot')];
    const arrow = car.querySelector('#about-next');
    let cur = 0;

    /* панели абсолютные — раскладываем по слайдам */
    panes.forEach((p, i) => { p.style.left = (i * 100) + '%'; });

    function syncHeight() {
      const active = panes[cur];
      if (active) track.style.height = active.offsetHeight + 'px';
    }

    function show(n) {
      cur = (n + panes.length) % panes.length;
      panes.forEach((p, i) => p.classList.toggle('is-active', i === cur));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
      track.style.transform = `translateX(-${cur * 100}%)`;
      syncHeight();
      arrow.setAttribute('aria-label', 'Следующий слайд');
    }

    window.addEventListener('resize', syncHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeight);
    setTimeout(syncHeight, 400);

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
