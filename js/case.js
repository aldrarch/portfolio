/* Рендерер case study: project.html?p=<id> + CASES[id] из cases-data.js.
   Раздел без контента пропускается; пустые поля → NEEDS_INPUT. */
(function () {
  'use strict';
  const pid = new URLSearchParams(location.search).get('p') || 'diplom';
  const c = (typeof CASES !== 'undefined') && CASES[pid];
  const root = document.getElementById('case-root');
  if (!c) {
    root.innerHTML = '<div class="container" style="padding:80px 0">' +
      '<h1>Case study ещё не готов</h1><p class="case-muted">Для этого проекта история ' +
      'собирается по материалам. <a href="projects.html">← Все проекты</a></p></div>';
    return;
  }
  document.title = c.title + ' — Александра Ткачук';

  const esc = (s) => String(s).replace(/</g, '&lt;');
  const need = (v) => !v || v === 'NEEDS_INPUT';

  /* ---------- HERO ---------- */
  const h = c.hero || {};
  let html = `
  <section class="case-hero">
    <div class="container">
      <a class="case-back" href="projects.html">← Все проекты</a>
      <p class="case-overline">${esc(h.year || 'NEEDS_INPUT')} · ${esc(h.type || 'NEEDS_INPUT')}</p>
      <h1 class="case-title">${esc(c.title)}</h1>
      <p class="case-lead">${esc(h.lead || 'NEEDS_INPUT')}</p>
      <div class="case-hero-meta">
        <div><dt>Место</dt><dd>${esc(h.location || 'NEEDS_INPUT')}</dd></div>
        <div><dt>Статус</dt><dd>${esc(h.status || 'NEEDS_INPUT')}</dd></div>
        <div><dt>Роль</dt><dd>${esc(h.role || 'NEEDS_INPUT')}</dd></div>
        <div><dt>Инструменты</dt><dd>${esc(h.tools || 'NEEDS_INPUT')}</dd></div>
      </div>
    </div>
    ${h.image ? `<figure class="case-hero-img"><img src="${h.image}" alt="${esc(c.title)}"></figure>` : ''}
  </section>`;

  /* ---------- утилиты блоков ---------- */
  const blocksHtml = (blocks) => (blocks || []).map(b =>
    `<div class="case-block"><h4>${esc(b[0])}</h4><p>${esc(b[1])}</p></div>`).join('');
  const imgsHtml = (imgs) => (imgs || []).map(i =>
    `<figure class="case-fig"><img src="${i[0]}" alt="${esc(i[1])}"><figcaption>${esc(i[1])}</figcaption></figure>`).join('');

  /* ---------- PROJECT / BRIEF ---------- */
  if (c.brief) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">01</p><h2>О проекте</h2></div>
        <div class="case-body">
          <p>${esc(c.brief.text || 'NEEDS_INPUT')}</p>
          ${c.brief.facts ? `<dl class="case-facts">${c.brief.facts.map(f =>
            `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>` : ''}
        </div>
      </div>
    </section>`;
  }

  /* ---------- QUESTION ---------- */
  if (c.question) {
    html += `
    <section class="case-section case-alt">
      <div class="container case-grid">
        <div><p class="case-num">02</p><h2>Вопрос</h2></div>
        <div class="case-body"><p class="case-question">${esc(c.question.text || 'NEEDS_INPUT')}</p></div>
      </div>
    </section>`;
  }

  /* ---------- RESEARCH ---------- */
  if (c.research) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">03</p><h2>Контекст и исследование</h2></div>
        <div class="case-body">${blocksHtml(c.research.blocks)}
          ${c.research.finding ? `<p class="case-finding"><strong>Вывод.</strong> ${esc(c.research.finding)}</p>` : ''}
        </div>
      </div>
    </section>`;
  }

  /* ---------- CONCEPT ---------- */
  if (c.concept) {
    html += `
    <section class="case-section case-alt">
      <div class="container case-grid">
        <div><p class="case-num">04</p><h2>Концепция</h2></div>
        <div class="case-body">
          ${c.concept.hypothesis ? `<p class="case-question">${esc(c.concept.hypothesis)}</p>` : ''}
          ${c.concept.response ? `<p>${esc(c.concept.response)}</p>` : ''}
          ${imgsHtml(c.concept.images)}
        </div>
      </div>
    </section>`;
  }

  /* ---------- DEVELOPMENT ---------- */
  if (c.development) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">05</p><h2>Развитие</h2></div>
        <div class="case-body">
          ${blocksHtml(c.development.iterations)}
          ${c.development.key ? `<p class="case-finding"><strong>Логика развития.</strong> ${esc(c.development.key)}</p>` : ''}
        </div>
      </div>
    </section>`;
  }

  /* ---------- ARCHITECTURE ---------- */
  if (c.architecture) {
    html += `
    <section class="case-section case-alt">
      <div class="container case-grid">
        <div><p class="case-num">06</p><h2>Архитектура</h2></div>
        <div class="case-body">${blocksHtml(c.architecture.blocks)}${imgsHtml(c.architecture.images)}</div>
      </div>
    </section>`;
  }

  /* ---------- SYSTEMS ---------- */
  if (c.systems) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">07</p><h2>Системы</h2></div>
        <div class="case-body">${blocksHtml(c.systems.blocks)}</div>
      </div>
    </section>`;
  }

  /* ---------- TECHNICAL ---------- */
  if (c.technical) {
    html += `
    <section class="case-section case-alt">
      <div class="container case-grid">
        <div><p class="case-num">08</p><h2>Техническая реализация</h2></div>
        <div class="case-body">${blocksHtml(c.technical.blocks)}
          ${c.technical.album ? `<p><a class="btn btn-solid" href="${c.technical.album}">Открыть альбом чертежей →</a></p>` : ''}
        </div>
      </div>
    </section>`;
  }

  /* ---------- RESULT ---------- */
  if (c.result) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">09</p><h2>Результат</h2></div>
        <div class="case-body">${c.result.text ? `<p>${esc(c.result.text)}</p>` : ''}${imgsHtml(c.result.images)}</div>
      </div>
    </section>`;
  }

  /* ---------- REFLECTION ---------- */
  if (c.reflection) {
    html += `
    <section class="case-section case-alt">
      <div class="container case-grid">
        <div><p class="case-num">10</p><h2>Рефлексия</h2></div>
        <div class="case-body">${blocksHtml(c.reflection.blocks)}</div>
      </div>
    </section>`;
  }

  /* ---------- SOURCES ---------- */
  if (c.sourceMaterials) {
    html += `
    <section class="case-section">
      <div class="container case-grid">
        <div><p class="case-num">11</p><h2>Материалы</h2></div>
        <div class="case-body"><ul class="case-src">${c.sourceMaterials.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>
    </section>`;
  }

  root.innerHTML = html;
})();
