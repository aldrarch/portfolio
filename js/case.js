/* Рендерер case study: project.html?p=<id> + CASES[id] из cases-data.js.
   Разделы рендерятся в порядке наличия; нумерация автоматическая. */
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
  const esc = (s) => String(s).replace(/</g, '&lt;');

  document.title = c.title + ' — Александра Ткачук';

  /* ---------- Заготовка: страница проекта с встроенным документом ---------- */
  if (c.blank) {
    root.innerHTML = `
    <section class="case-hero">
      <div class="container">
        <a class="case-back" href="projects.html">← Все проекты</a>
        <p class="case-overline">Проект</p>
        <h1 class="case-title">${esc(c.title)}</h1>
        <div class="case-blank-note">
          <p>Материалы проекта — ниже; страница дополнится описанием по мере подготовки.</p>
        </div>
      </div>
    </section>
    <section class="case-section">
      <div class="container">
        ${c.doc ? (c.isImage
          ? `<figure class="case-fig-wide case-doc-embed"><img src="${c.doc}" alt="${esc(c.title)}"></figure>
             <p class="case-muted"><a href="${c.doc}" target="_blank" download>Открыть в новом окне</a></p>`
          : `<div class="case-doc-embed" id="doc-embed"></div>
             <p class="case-muted"><a href="${c.doc}" target="_blank">Открыть документ в новом окне</a>${c.docLabel ? ' · ' + esc(c.docLabel) : ''}</p>`
        ) : ''}
      </div>
    </section>`;

    /* встроенный PDF-просмотрщик */
    if (c.doc && !c.isImage && window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const host = document.getElementById('doc-embed');
      pdfjsLib.getDocument(c.doc).promise.then(() => {
        const iframe = document.createElement('iframe');
        iframe.src = c.doc; iframe.title = c.title;
        iframe.style.cssText = 'width:100%;height:min(78vh,900px);border:1px solid var(--line);border-radius:12px;background:#fff;display:block';
        host.appendChild(iframe);
      }).catch(() => { host.innerHTML = '<p class="case-muted">Документ временно недоступен.</p>'; });
    }
    return;
  }

  /* ---------- утилиты ---------- */
  const blocksHtml = (blocks) => (blocks || []).map(b =>
    `<div class="case-block"><h4>${esc(b[0])}</h4><p>${esc(b[1])}</p></div>`).join('');
  const imgsHtml = (imgs) => (imgs || []).map(i =>
    `<figure class="case-fig"><img src="${i[0]}" alt="${esc(i[1])}" loading="lazy"><figcaption>${esc(i[1])}</figcaption></figure>`).join('');
  const gridsHtml = (imgs) => (imgs || []).map(i =>
    `<figure class="case-fig case-fig-tile"><img src="${i[0]}" alt="${esc(i[1])}" loading="lazy"><figcaption>${esc(i[1])}</figcaption></figure>`).join('');

  let num = 0;
  const section = (title, alt, bodyHtml) => {
    num += 1;
    return `
    <section class="case-section${alt ? ' case-alt' : ''}">
      <div class="container case-grid">
        <div><p class="case-num">${String(num).padStart(2, '0')}</p><h2>${esc(title)}</h2></div>
        <div class="case-body">${bodyHtml}</div>
      </div>
    </section>`;
  };

  /* ---------- HERO ---------- */
  const h = c.hero || {};
  let html = `
  <section class="case-hero">
    <div class="container">
      <a class="case-back" href="projects.html">← Все проекты</a>
      <p class="case-overline">${esc(h.year || '')} · ${esc(h.type || '')}</p>
      <h1 class="case-title">${esc(c.title)}</h1>
      <p class="case-lead">${esc(h.lead || '')}</p>
      <div class="case-hero-meta">
        <div><dt>Место</dt><dd>${esc(h.location || '')}</dd></div>
        <div><dt>Статус</dt><dd>${esc(h.status || '')}</dd></div>
        <div><dt>Роль</dt><dd>${esc(h.role || '')}</dd></div>
        <div><dt>Инструменты</dt><dd>${esc(h.tools || '')}</dd></div>
      </div>
    </div>
  </section>`;

  /* ---------- 01 О проекте ---------- */
  if (c.brief) {
    html += section('О проекте', false,
      `<p>${esc(c.brief.text || '')}</p>
       ${c.brief.facts ? `<dl class="case-facts">${c.brief.facts.map(f =>
         `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>` : ''}`);
  }

  /* ---------- 02 Вопрос ---------- */
  if (c.question) {
    html += section('Вопрос', true,
      `<p class="case-question">${esc(c.question.text || '')}</p>`);
  }

  /* ---------- 03 Контекст и исследование ---------- */
  if (c.research) {
    html += section('Контекст и исследование', false,
      `${blocksHtml(c.research.blocks)}
       ${c.research.finding ? `<p class="case-finding"><strong>Вывод.</strong> ${esc(c.research.finding)}</p>` : ''}
       ${c.research.images ? `<div class="case-grid-2">${gridsHtml(c.research.images)}</div>` : ''}`);
  }

  /* ---------- 04 Аналоги ---------- */
  if (c.analogs) {
    html += section('Аналоги', true, blocksHtml(c.analogs.blocks) +
      (c.analogs.finding ? `<p class="case-finding"><strong>Принято в проект.</strong> ${esc(c.analogs.finding)}</p>` : ''));
  }

  /* ---------- 05 Концепция ---------- */
  if (c.concept) {
    html += section('Концепция', false,
      `${c.concept.hypothesis ? `<p class="case-question">${esc(c.concept.hypothesis)}</p>` : ''}
       ${c.concept.response ? `<p>${esc(c.concept.response)}</p>` : ''}
       ${c.concept.images ? `<div class="case-ai-grid">${gridsHtml(c.concept.images)}</div>` : ''}
       ${c.concept.aiNote ? `<p class="case-muted case-ai-note">${esc(c.concept.aiNote)}</p>` : ''}`);
  }

  /* ---------- 06 Развитие ---------- */
  if (c.development) {
    html += section('Развитие', true,
      `${blocksHtml(c.development.iterations)}
       ${c.development.key ? `<p class="case-finding"><strong>Логика развития.</strong> ${esc(c.development.key)}</p>` : ''}`);
  }

  /* ---------- 07 Архитектура ---------- */
  if (c.architecture) {
    html += section('Архитектура', false,
      `${blocksHtml(c.architecture.blocks)}
       ${c.architecture.images ? `<div class="case-fig-wide">${imgsHtml(c.architecture.images.slice(0, 2))}</div>
       <div class="case-grid-2">${gridsHtml(c.architecture.images.slice(2))}</div>` : ''}`);
  }

  /* ---------- 08 Конструкции ---------- */
  if (c.structures) {
    html += section('Конструкции', true,
      `${blocksHtml(c.structures.blocks)}
       ${c.structures.images ? `<div class="case-grid-2">${gridsHtml(c.structures.images)}</div>` : ''}`);
  }

  /* ---------- 09 Инженерия ---------- */
  if (c.systems) {
    html += section('Инженерия', false, blocksHtml(c.systems.blocks));
  }

  /* ---------- 10 BIM и смета ---------- */
  if (c.bim) {
    html += section('BIM и смета', true, blocksHtml(c.bim.blocks));
  }

  /* ---------- 11 Результат ---------- */
  if (c.result) {
    html += section('Результат', false,
      `${c.result.text ? `<p>${esc(c.result.text)}</p>` : ''}
       ${c.result.images ? `<div class="case-fig-wide">${imgsHtml(c.result.images)}</div>` : ''}`);
  }

  /* ---------- 12 Рефлексия ---------- */
  if (c.reflection) {
    html += section('Рефлексия', true, blocksHtml(c.reflection.blocks));
  }

  /* ---------- 13 Материалы ---------- */
  if (c.sourceMaterials) {
    html += section('Материалы', false,
      `<ul class="case-src">${c.sourceMaterials.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`);
  }

  root.innerHTML = html;
})();
