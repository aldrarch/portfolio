/* Адаптер Autodesk Platform Services Viewer v7 для реальных URN (SVF2).
   Тот же контракт, что у демо-движка: loadURN/select/hide/isolate/... */
(function () {
  'use strict';

  const VIEWER_CSS = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.css';
  const VIEWER_JS = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';

  function loadScript(src) {
    return new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => bad(new Error('script ' + src));
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
    constructor(opts) { this.ui = opts.ui; this.selection = []; this.hidden = []; this.cats = []; this.presets = []; }

    async init() {
      loadCss(VIEWER_CSS);
      if (!window.Autodesk) await loadScript(VIEWER_JS);
      return this;
    }

    async loadURN(urn, token) {
      this.ui.showLoader('Загрузка модели Autodesk Viewer…');
      const host = this.hostEl = this.optsHost();
      const viewer = this.viewer = new Autodesk.Viewing.GuiViewer3D(host, { disabledExtensions: { toolbar: true } });
      Autodesk.Viewing.Initializer({ accessToken: token }, async () => {
        viewer.start();
        viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (e) => {
          this.selection = e.dbIdArray || [];
          this.ui.selectionChanged();
        });
        viewer.loadModel('urn:' + urn, null, () => {
          this.ui.hideLoader();
          this._afterLoad();
        }, (code, err) => {
          this.ui.status('Ошибка загрузки модели: ' + code + ' ' + (err || ''), true);
          this.ui.hideLoader();
        });
      });
    }

    optsHost() { return this._host || (this._host = this.ui.canvasHost()); }

    _afterLoad() {
      const m = this.viewer.model;
      const tree = m.getInstanceTree();
      const catsMap = {};
      Object.keys(tree.nodeAccess.dbIdToIndex).forEach(() => {});
      // категории берём из свойств модели (Revit category)
      this.viewer.model.getObjectTree((tree2) => {
        const walk = (id) => {
          const name = tree2.getNodeName(id) || '';
          const cat = tree2.getNodeType ? tree2.getNodeType(id) : '';
          void name; void cat;
          tree2.enumNodeChildren(id, walk, false);
        };
        walk(tree2.getRootId());
      });
      this._bboxReady();
    }

    _bboxReady() {
      this.presets = [
        { name: 'Вид снаружи', pos: null, tgt: null, fit: true },
        { name: 'Сверху', pos: null, tgt: null, fit: true },
      ];
    }

    fit() { this.viewer.fitToView(); }
    _fly(p, t) { void p; void t; this.viewer.fitToView(); }
    select(dbId) { this.viewer.select(dbId == null ? [] : [dbId]); }
    hide(ids) { this.viewer.hide(ids); }
    show(ids) { this.viewer.show(ids); }
    showAll() { this.viewer.showAllObjects(); }
    isolate(ids) { ids && ids.length ? this.viewer.isolate(ids) : this.viewer.clearIsolation(); }
    setSectionAxis(axis) {
      void axis;
      this.ui.status('Section cut: доступен в инспекторе модели (в демо не используется).');
    }
    setSectionPos() {}
    applyParams() { return false; }
    getProperties(dbId) {
      const out = [];
      this.viewer.getProperties(dbId, (r) => {
        (r.properties || []).slice(0, 12).forEach(p => out.push([p.displayName, String(p.displayValue)]));
      }, () => {});
      return out.length ? out : [['Id', String(dbId)]];
    }
    enumerateDbIds() { const a = []; this.viewer.model.getObjectTree(t => t.enumNodeChildren(t.getRootId(), id => a.push(id), true)); return a; }
    dispose() { this.viewer && this.viewer.finish(); }
  }

  window.AutodeskEngine = AutodeskEngine;
})();
