/* «Интерактивная модель» — переиспользуемый компонент.
   window.ApsViewer.mount(hostEl, {projectId}) → API: on/fit/hide/isolate/
   showAll/select/resetView/setParameters/setSectionAxis/setSectionPos */
(function () {
  'use strict';

  const ENGINES = { placeholder: 'ThreePlaceholder', autodesk: 'AutodeskEngine' };

  class ApsViewer {
    constructor(host, opts) {
      this.host = typeof host === 'string' ? document.querySelector(host) : host;
      this.opts = opts || {};
      this.listeners = {};
    }

    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); return this; }
    emit(ev, d) { (this.listeners[ev] || []).forEach(f => f(d)); }

    async init() {
      this._buildUI();
      const Cls = window[ENGINES[this.opts.engine || 'placeholder']];
      this.engine = new Cls({ host: this.hostEl, ui: this.ui });
      await this.engine.init();
      return this;
    }

    async loadFromRegistry(id) {
      let m = null;
      try {
        const reg = await (await fetch('js/aps/aps-models.json')).json();
        m = (reg.models || []).find(x => x.id === id) || reg.models[0];
      } catch (e) { void e; }
      m = m || { id: id, title: id, engine: 'placeholder' };
      this.model = m;
      if (m.engine === 'autodesk') await this._loadAutodesk(m);
      else await this.engine.setModel(null);
      this._fillViews(); this._fillCats();
      return this;
    }

    async _loadAutodesk(m) {
      if (!window.AutodeskEngine) { this.ui.status('Адаптер Autodesk не загружен.', true); return; }
      try {
        const r = await fetch(m.tokenUrl || '/api/aps/token');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const tok = await r.json();
        await this.engine.loadURN(m.urn, tok.access_token);
      } catch (e) {
        this.ui.status('APS недоступен: ' + e.message + ' (нужен бэкенд-токен, см. README)', true);
      }
    }

    _buildUI() {
      const h = this.host;
      h.classList.add('aps-mount');
      h.innerHTML = `
        <div class="aps-canvas-host"></div>
        <div class="aps-toolbar">
          <button class="aps-pill" data-p="model">Модель</button>
          <button class="aps-pill" data-p="views">Виды</button>
          <button class="aps-pill" data-p="cats">Категории</button>
          <span style="flex:1"></span>
          <button class="aps-pill" data-p="section">Разрез</button>
          <button class="aps-pill" data-act="fit">Fit</button>
          <button class="aps-pill" data-act="reset">Сброс</button>
        </div>
        <div class="aps-panel" data-panel="model" hidden>
          <h4>Модель</h4><div class="aps-model-info"></div>
          <h4 style="margin-top:14px">Свойства</h4><div class="aps-props-wrap"><p class="aps-empty">Кликните элемент модели</p></div>
          <div class="aps-params-wrap"></div>
        </div>
        <div class="aps-panel" data-panel="views" hidden>
          <h4>Виды</h4><div class="aps-views"></div>
        </div>
        <div class="aps-panel" data-panel="cats" hidden>
          <h4>Категории</h4>
          <input class="aps-cat-search" type="text" placeholder="Поиск…" style="width:100%;margin-bottom:8px">
          <div class="aps-cats"></div>
          <button class="aps-section-off" data-act="showall">Показать все</button>
        </div>
        <div class="aps-panel" data-panel="section" hidden>
          <h4>Разрез</h4>
          <div class="aps-section-axis">
            <button class="aps-axis-btn" data-axis="x">X</button>
            <button class="aps-axis-btn" data-axis="y">Y</button>
            <button class="aps-axis-btn" data-axis="z">Z</button>
          </div>
          <input class="aps-section-slider" type="range" min="0" max="100" value="50">
          <button class="aps-section-off" data-act="sectionoff">Выключить</button>
        </div>
        <div class="aps-selbar" hidden>
          <span class="aps-sel-name"></span><span class="aps-sel-cat"></span>
          <button class="aps-sel-btn" data-act="hide">Скрыть</button>
          <button class="aps-sel-btn" data-act="isolate">Изолировать</button>
          <button class="aps-sel-btn" data-act="deselect">×</button>
        </div>
        <div class="aps-status"></div>
        <div class="aps-loader"><div class="aps-loader-bar"><span></span></div><p></p></div>`;
      this.hostEl = h.querySelector('.aps-canvas-host');
      this.ui = {
        showLoader: (t) => { const l = h.querySelector('.aps-loader'); l.querySelector('p').textContent = t || 'Загрузка…'; l.classList.remove('is-done'); },
        hideLoader: () => h.querySelector('.aps-loader').classList.add('is-done'),
        status: (t, err) => { h.querySelector('.aps-status').innerHTML = err ? '<span class="aps-error">' + t + '</span>' : t; },
        setCatCount: () => {},
        selectionChanged: () => this._onEngineSelection(),
      };
      this._wire();
    }

    _wire() {
      const h = this.host;
      h.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => this._togglePanel(b.dataset.p, b)));
      h.querySelectorAll('[data-act="fit"]').forEach(b => b.addEventListener('click', () => this.engine.fit()));
      h.querySelectorAll('[data-act="reset"]').forEach(b => b.addEventListener('click', () => this.resetView()));
      h.querySelectorAll('[data-act="showall"]').forEach(b => b.addEventListener('click', () => this.showAll()));
      h.querySelectorAll('[data-act="sectionoff"]').forEach(b => b.addEventListener('click', () => this._sectionOff()));
      h.querySelectorAll('[data-act="hide"]').forEach(b => b.addEventListener('click', () => { this.engine.hide(this.engine.selection); this._onEngineSelection(); }));
      h.querySelectorAll('[data-act="isolate"]').forEach(b => b.addEventListener('click', () => { this.engine.isolate(this.engine.selection); this._onEngineSelection(); }));
      h.querySelectorAll('[data-act="deselect"]').forEach(b => b.addEventListener('click', () => this.engine.select(null)));
      const sl = h.querySelector('.aps-section-slider');
      sl.addEventListener('input', () => this.engine.setSectionPos(sl.value / 100));
      h.querySelectorAll('.aps-axis-btn').forEach(b => b.addEventListener('click', () => {
        h.querySelectorAll('.aps-axis-btn').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        this.engine.setSectionAxis(b.dataset.axis);
        this.engine.setSectionPos(sl.value / 100);
      }));
      const search = h.querySelector('.aps-cat-search');
      search.addEventListener('input', () => {
        const q = search.value.toLowerCase();
        h.querySelectorAll('.aps-cat').forEach(c => { c.hidden = !c.textContent.toLowerCase().includes(q); });
      });
      document.addEventListener('click', (e) => { if (!h.contains(e.target)) this._closePanels(); });
    }

    _togglePanel(name, btn) {
      const panel = this.host.querySelector('[data-panel="' + name + '"]');
      const wasOpen = !panel.hidden;
      this._closePanels();
      if (!wasOpen) {
        panel.hidden = false;
        btn.classList.add('is-open');
        if (name === 'model') this._renderModelInfo();
        if (name === 'cats') this._fillCats();
        if (name === 'views') this._fillViews();
      }
    }

    _closePanels() {
      this.host.querySelectorAll('.aps-panel').forEach(p => p.hidden = true);
      this.host.querySelectorAll('.aps-pill.is-open').forEach(b => b.classList.remove('is-open'));
    }

    _renderModelInfo() {
      const wrap = this.host.querySelector('.aps-model-info');
      const n = this.engine.enumerateDbIds ? this.engine.enumerateDbIds().length : 0;
      wrap.innerHTML = '<p class="aps-empty">' + ((this.model && this.model.title) || 'Демо-модель') +
        ' — элементов: ' + n + '</p>';
    }

    _fillViews() {
      const wrap = this.host.querySelector('.aps-views');
      wrap.innerHTML = '';
      (this.engine.presets || []).forEach((p, i) => {
        const b = document.createElement('button');
        b.className = 'aps-view-btn' + (i === 0 ? ' is-active' : '');
        b.textContent = p.name;
        b.addEventListener('click', () => {
          wrap.querySelectorAll('.aps-view-btn').forEach(x => x.classList.remove('is-active'));
          b.classList.add('is-active');
          this.engine._fly(p.pos, p.tgt);
        });
        wrap.appendChild(b);
      });
    }

    _fillCats() {
      const wrap = this.host.querySelector('.aps-cats');
      wrap.innerHTML = '';
      (this.engine.cats || []).forEach((c) => {
        const l = document.createElement('label');
        l.className = 'aps-cat';
        l.innerHTML = '<input type="checkbox" checked><span>' + c.label + '</span><span class="aps-cat-n">' + c.count + '</span>';
        l.querySelector('input').addEventListener('change', (e) => this._toggleCat(c.key, e.target.checked));
        wrap.appendChild(l);
      });
    }

    _toggleCat(key, on) {
      const arr = (this.engine._meshes || []).filter(m => m.userData.cat === key).map(m => m.userData.dbId);
      if (on) this.engine.show(arr); else this.engine.hide(arr);
    }

    _onEngineSelection() {
      const sel = this.engine.selection || [];
      const bar = this.host.querySelector('.aps-selbar');
      if (!sel.length) { bar.hidden = true; this.emit('selection', []); this._renderProps(null); return; }
      const m = (this.engine._meshes || []).find(x => x.userData.dbId === sel[0]);
      const u = m && m.userData;
      bar.hidden = false;
      bar.querySelector('.aps-sel-name').textContent = u ? u.name : 'Элемент ' + sel[0];
      bar.querySelector('.aps-sel-cat').textContent = u ? u.catLabel : '';
      this.emit('selection', sel);
      this._renderProps(sel[0]);
    }

    _renderProps(dbId) {
      const wrap = this.host.querySelector('.aps-props-wrap');
      const pw = this.host.querySelector('.aps-params-wrap');
      pw.innerHTML = '';
      if (dbId == null) { wrap.innerHTML = '<p class="aps-empty">Кликните элемент модели</p>'; return; }
      const rows = this.engine.getProperties(dbId) || [];
      wrap.innerHTML = rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
      const m = (this.engine._meshes || []).find(x => x.userData.dbId === dbId);
      const params = m && m.userData.params;
      if (!params) return;
      pw.innerHTML = '<h4>Параметры</h4><div class="aps-params"></div>';
      const list = pw.querySelector('.aps-params');
      Object.keys(params).forEach(k => {
        const d = document.createElement('div');
        d.className = 'aps-param';
        const isRot = k === 'Rotation';
        const unit = isRot ? '°' : ' мм';
        d.innerHTML = '<label>' + k + ' <span class="aps-param-val">' + params[k] + unit + '</span></label>' +
          '<input type="range" min="' + (isRot ? 0 : 300) + '" max="' + (isRot ? 180 : 6000) + '" step="' + (isRot ? 5 : 50) + '" value="' + params[k] + '">';
        const inp = d.querySelector('input');
        inp.addEventListener('input', () => {
          params[k] = +inp.value;
          d.querySelector('.aps-param-val').textContent = inp.value + unit;
          this.setParameters(dbId, { [k]: +inp.value });
        });
        list.appendChild(d);
      });
    }

    /* ---------- Публичный API ---------- */

    setParameters(dbId, params) { return this.engine.applyParams(dbId, params); }

    resetView() {
      this.engine.showAll();
      this._sectionOff();
      const p = (this.engine.presets || [])[0];
      if (p) this.engine._fly(p.pos, p.tgt); else this.engine.fit();
    }

    _sectionOff() {
      this.engine.setSectionAxis(null);
      this.host.querySelectorAll('.aps-axis-btn').forEach(b => b.classList.remove('is-active'));
    }

    fit() { this.engine.fit(); }
    hide(ids) { this.engine.hide(ids); }
    isolate(ids) { this.engine.isolate(ids); }
    showAll() { this.engine.showAll(); }
    select(dbId) { this.engine.select(dbId); }
    destroy() { this.engine.dispose(); this.host.innerHTML = ''; }
  }

  window.ApsViewerClass = ApsViewer;
  window.ApsViewer = {
    mount: (host, opts) =>
      new ApsViewer(host, opts).init()
        .then(v => v.loadFromRegistry((opts && opts.projectId) || 'demo')),
  };
})();
