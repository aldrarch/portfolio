/* Портфолио Александры Ткачук — главная: карточки из данных, фильтры, лайтбокс */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Карточки проектов из projects-data.js ---------- */
  const cardsWrap = document.getElementById('cards');
  if (cardsWrap && typeof PROJECTS !== 'undefined') {
    cardsWrap.innerHTML = PROJECTS.map((p, i) => {
      const href = p.type === 'image' ? p.src : `album.html?p=${p.id}`;
      const cover = p.cover || '';
      const mediaInner = cover
        ? `<img src="${cover}" alt="${p.title}" loading="lazy">`
        : `<div class="card-media-ph"><span>Альбом</span><strong>${p.title}</strong></div>`;
      const badge = p.type === 'image' ? 'Смотреть ↗' : 'Открыть альбом ↗';
      return `
      <article class="card reveal" data-cat="${(p.cat || []).join(' ')}" style="transition-delay:${(i % 3) * 0.08}s">
        <a class="card-media" href="${href}">
          ${mediaInner}
          <span class="card-open">${badge}</span>
        </a>
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
    /* элементы уже в первом экране показываем сразу — не ждём IO
       (в некоторых webview IntersectionObserver срабатывает с задержкой) */
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      io.observe(el);
    }
  });

  /* ---------- Фильтры ---------- */
  const filterBtns = document.querySelectorAll('.filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      document.querySelectorAll('#cards .card').forEach(card => {
        const cats = (card.dataset.cat || '').split(/\s+/);
        card.classList.toggle('is-hidden', !(f === 'all' || cats.includes(f)));
      });
    });
  });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  }
});

/* ================= VALUES SLIDER ================= */

(() => {
  const frame = document.querySelector('.values-frame');
  if (!frame) return;

  const panes = [...frame.querySelectorAll('.values-pane')];
  const dots  = [...frame.querySelectorAll('.values-dot')];
  const arrow = frame.querySelector('#values-next');
  let cur = 0;

  function show(n) {
    cur = (n + panes.length) % panes.length;
    panes.forEach((p, i) => p.classList.toggle('is-active', i === cur));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
    arrow.setAttribute('aria-label',
      cur === 0 ? 'Следующий слайд: цель' : 'Вернуться к ценностям');
  }

  arrow.addEventListener('click', () => show(cur + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => show(i)));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const r = frame.getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0) return;
    show(cur + (e.key === 'ArrowRight' ? 1 : -1));
  });
})();
