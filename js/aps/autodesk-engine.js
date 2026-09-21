/* ============================================================
   Адаптер Autodesk Platform Services Viewer v7 — реальные RVT.
   Рабочий процесс: RVT → Model Derivative (SVF2) → Viewer.
   Тот же контракт, что у демо-движка three-placeholder.js.
   ============================================================ */
(function () {
  'use strict';

  const VIEWER_BASE = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/v7/';
  const VIEWER_CSS = VIEWER_BASE + 'viewer3D.min.css';
  const VIEWER_JS = VIEWER_BASE + 'viewer3D.min.js';

  function loadScript(src) {
    return new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => bad(new Error('script load fail'));
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  class AutodeskEngine {
    constructor(opts) {
      this.ui = opts.ui;
      this.opts = opts;
      this.selection = [];
      this.hidden = [];
      this.cats = [];
      this.presets = [];
      this._propsCache = {};
    }

    async init() {
      loadCss(VIEWER_CSS);
      if (!window.Autodesk) await loadScript(VIEWER_JS);
      return this;
    }

    async loadURN(urn, token) {
      const V = Autodesk.Viewing;
      this.ui.showLoader('Загрузка модели…');
      const host = this._host = this.ui.canvasHost();
      this.viewer = new V.GuiViewer3D(host, { disabledExtensions: { toolbar: true } });
      await new Promise((ok) => V.Initializer({ accessToken: token }, ok));
      this.viewer.start();
      this.viewer.addEventListener(V.SELECTION_CHANGED_EVENT, (e) => {
        this.selection = e.dbIdArray || [];
        this.ui.selectionChanged();
      });

      const loaded = await new Promise((ok, bad) =>
        this.viewer.loadModel('urn:' + urn, null, ok,
          (code) => bad(new Error('код ' + code))));
      this.model = loaded || this.viewer.model;

      // категории из дерева
      this.cats = await this._categories();
      // заготовленные виды камеры
      this.presets = await this._views();
      // состояние
      this.ui.hideLoader();
      this.fit();
      return this.model;
    }

    /* ---------- Категории Revit (по свойствам leaf-узлов) ---------- */

    _categories() {
      return new Promise((ok) => {
        const m = this.model;
        const tree = m.getData().instanceTree;
        if (!tree) return ok([]);
        // leaf-узлы группируем по имени ветки верхнего уровня (у Revit — категория)
        const byCat = {};
        const roots = tree.getRootId();
        const walk = (id, cat) => {
          const name = (tree.getNodeName(id) || '').trim();
          const kids = tree.getChildCount(id);
          if (kids === 0) {
            const key = cat || name || 'Прочее';
            byCat[key] = (byCat[key] || 0) + 1;
          } else {
            const nextCat = (cat && cat !== 'Прочее') ? cat
              : (name && !/^\[|^__/.test(name) && name.length < 40 ? name : cat);
            tree.enumNodeChildren(id, ch => walk(ch, nextCat));
          }
        };
        walk(roots, null);
        const keys = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).slice(0, 30);
        ok(keys.map(k => ({ key: k, label: k, count: byCat[k] })));
      });
    }

    /* ---------- Заготовленные виды из документа ---------- */

    _views() {
      // Камерные пресеты: стандартные ракурсы через навигацию viewer
      return Promise.resolve([
        { name: 'Изометрия', fit: true },
        { name: 'Фасад', view: 'front' },
        { name: 'Сверху', view: 'top' },
      ]);
    }

    _goView(kind) {
      const v = this.viewer;
      v.fitToView();
      setTimeout(() => {
        const nav = v.navigation;
        if (kind === 'top') nav.setView(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
        else if (kind === 'front') nav.setView(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0));
      }, 350);
    }

    /* ---------- Контракт ---------- */

    fit() { this.viewer.fitToView(); }
    _fly(p) {
      const pr = (this.presets || [])[p];
      if (pr && pr.view) this._goView(pr.view);
      else this.viewer.fitToView();
    }
    select(dbId) { this.viewer.clearSelection(); if (dbId != null) this.viewer.select([dbId]); }
    hide(ids) { this.viewer.hide(ids); }
    show(ids) { this.viewer.show(ids); }
    showAll() { this.viewer.showAllObjects(); this.hidden = []; }
    isolate(ids) { ids && ids.length ? this.viewer.isolate(ids) : this.viewer.clearIsolation(); }

    setSectionAxis(axis) {
      if (!axis) { this.viewer.setCutPlanes([]); this._secAxis = null; return; }
      this._secAxis = axis;
      const bb = this.model.getBoundingBox();
      const c = bb.center();
      const v = axis === 'x' ? c.x : axis === 'y' ? c.y : c.z;
      this.viewer.setCutPlanes([-v]); // плоскость x=const и т.п.
    }

    setSectionPos(t) {
      if (!this._secAxis) return;
      const bb = this.model.getBoundingBox();
      const c = bb.center();
      const mn = this._secAxis === 'x' ? bb.min.x : this._secAxis === 'y' ? bb.min.y : bb.min.z;
      const mx = this._secAxis === 'x' ? bb.max.x : this._secAxis === 'y' ? bb.max.y : bb.max.z;
      const val = mn + (mx - mn) * t;
      // нормаль секущей смотрит внутрь — знак согласован с setSectionAxis
      const sign = t < .5 ? 1 : -1;
      void c; void sign;
      this.viewer.setCutPlanes([-val]);
    }

    applyParams() { return false; }

    /* dbId всех элементов категории; mode: true=показать, false=скрыть */
    catDbIds(cat, show) {
      const tree = this.model.getData().instanceTree;
      const ids = [];
      const walk = (id, cur) => {
        const name = (tree.getNodeName(id) || '').trim();
        const kids = tree.getChildCount(id);
        if (kids === 0) { if (cur === cat) ids.push(id); }
        else {
          const next = (cur && cur !== 'Прочее') ? cur
            : (name && !/^\[|^__/.test(name) && name.length < 40 ? name : cur);
          tree.enumNodeChildren(id, ch => walk(ch, next));
        }
      };
      walk(tree.getRootId(), null);
      if (show) { this.viewer.show(ids); this.hidden = this.hidden.filter(i => !ids.includes(i)); }
      else { this.viewer.hide(ids); this.hidden = this.hidden.concat(ids); }
    }

    getProperties(dbId) {
      // Синхронный контракт — возвращаем из кэша, заполняемый при выборе
      const key = String(dbId);
      const cached = this._propsCache[key];
      if (cached) return cached;
      this.viewer.getProperties(dbId, (r) => {
        const rows = (r.properties || [])
          .filter(p => p.displayName && p.displayValue != null)
          .slice(0, 14)
          .map(p => [p.displayName, String(p.displayValue)]);
        this._propsCache[key] = rows.length ? rows : [['Id', key]];
        this.ui.selectionChanged(); // перерисовать панель, когда свойства пришли
      }, () => { this._propsCache[key] = [['Id', key]]; });
      return [['Загрузка свойств…', '']];
    }

    enumerateDbIds() {
      const tree = this.model.getData().instanceTree;
      const a = [];
      if (tree) tree.enumNodeChildren(tree.getRootId(), id => a.push(id), true);
      return a;
    }

    dispose() { if (this.viewer) this.viewer.finish(); }
  }

  window.AutodeskEngine = AutodeskEngine;
})();
