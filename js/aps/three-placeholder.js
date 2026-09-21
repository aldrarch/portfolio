/* Демо-движок (three.js) для компонента «Интерактивная модель».
   Тот же контракт, что и адаптер Autodesk Viewer. */
(function () {
  'use strict';
  const T = window.THREE;

  class ThreePlaceholder {
    constructor(opts) {
      this.opts = opts;
      this.ui = opts.ui;
      this._tgt = new T.Vector3(0, 10, 0);
      this.ray = new T.Raycaster();
      this.selection = [];
      this.hidden = [];
      this.presets = [];
      this._bbox = new T.Box3();
    }

    async init() {
      const host = this.opts.host, w = host.clientWidth, h = host.clientHeight;
      this.renderer = new T.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
      this.renderer.localClippingEnabled = true;
      host.appendChild(this.renderer.domElement);
      this.scene = new T.Scene();
      this.scene.background = new T.Color(0x101216);
      this.scene.add(new T.HemisphereLight(0xffffff, 0x33383f, .95));
      const d = new T.DirectionalLight(0xffffff, .85);
      d.position.set(1.4, 2.2, 1);
      this.scene.add(d);
      this.camera = new T.PerspectiveCamera(50, w / h, .1, 2000);
      this.camera.position.set(56, 40, 56);
      this.camera.lookAt(this._tgt);
      this._bindInput();
      const loop = () => {
        this._raf = requestAnimationFrame(loop);
        try { this.renderer.render(this.scene, this.camera); }
        catch (e) { console.error('render loop:', e); }
      };
      loop();
      window.addEventListener('resize', () => this._resize());
      return this;
    }

    _resize() {
      const host = this.opts.host;
      this.camera.aspect = host.clientWidth / host.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(host.clientWidth, host.clientHeight);
    }

    _bindInput() {
      const el = this.renderer.domElement;
      el.addEventListener('pointerdown', (e) => {
        this._down = true; this._btn = e.button;
        this._lx = e.clientX; this._ly = e.clientY;
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!this._down) return;
        const dx = e.clientX - this._lx, dy = e.clientY - this._ly;
        this._lx = e.clientX; this._ly = e.clientY;
        if (this._btn === 0) this._orbit(dx, dy); else this._pan(dx, dy);
      });
      el.addEventListener('pointerup', (e) => {
        const still = Math.abs(e.clientX - this._lx) < 4 && Math.abs(e.clientY - this._ly) < 4;
        if (this._down && this._btn === 0 && still) this._pick(e);
        this._down = false;
      });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        this._dolly(e.deltaY > 0 ? 1.12 : 1 / 1.12);
      }, { passive: false });
    }

    _orbit(dx, dy) {
      const off = this.camera.position.clone().sub(this._tgt);
      const s = new T.Spherical().setFromVector3(off);
      s.theta -= dx * .005;
      s.phi = Math.max(.08, Math.min(Math.PI - .08, s.phi - dy * .005));
      off.setFromSpherical(s);
      this.camera.position.copy(this._tgt.clone().add(off));
      this.camera.lookAt(this._tgt);
    }

    _pan(dx, dy) {
      const cam = this.camera;
      const s = cam.position.distanceTo(this._tgt) * .0016;
      const right = new T.Vector3().setFromMatrixColumn(cam.matrix, 0);
      const up = new T.Vector3().setFromMatrixColumn(cam.matrix, 1);
      const mv = new T.Vector3().addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
      cam.position.add(mv); this._tgt.add(mv);
      cam.lookAt(this._tgt);
    }

    _dolly(f) {
      const v = this.camera.position.clone().sub(this._tgt);
      v.setLength(Math.max(2, v.length() * f));
      this.camera.position.copy(this._tgt.clone().add(v));
      this.camera.lookAt(this._tgt);
    }
  }

  window.ThreePlaceholder = ThreePlaceholder;
})();

(function () {
  'use strict';
  const T = window.THREE;
  const P = window.ThreePlaceholder.prototype;

  P.setModel = function (urn) {
    void urn;
    this.ui.showLoader('Построение демо-модели…');
    if (this.group) { this.scene.remove(this.group); }
    const g = this.group = new T.Group();
    const M = (c) => new T.MeshLambertMaterial({ color: c });
    const mat = {
      wall: M(0xd6d9dd), col: M(0xb7bcc4), slab: M(0xa9aeb7),
      glz: new T.MeshLambertMaterial({ color: 0x7fa8d8, transparent: true, opacity: .5 }),
      mul: M(0x4a4f57), core: M(0x9aa0a9), roof: M(0x6d727b),
    };
    const catOf = {
      wall: ['Стены', 8], col: ['Колонны', 48], slab: ['Перекрытия', 2],
      glz: ['Витражи (панели)', 16], mul: ['Раскладка витражей', 12],
      core: ['Ядро', 1], roof: ['Крыша', 1], dem: ['Демо-объект', 1],
    };
    const counts = {};
    let id = 1;
    const self = this;
    function box(w, h, d, m, x, y, z, name, params) {
      const k = m === mat.glz ? 'glz' : m === mat.mul ? 'mul' : m === mat.core ? 'core'
        : m === mat.roof ? 'roof' : m === mat.wall ? 'wall'
        : m === mat.slab ? 'slab' : m === mat.col ? 'col' : 'dem';
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m.clone());
      mesh.position.set(x, y, z);
      counts[k] = (counts[k] || 0) + 1;
      mesh.userData = {
        dbId: id++, cat: k, catLabel: catOf[k][0],
        name: name || catOf[k][0],
        params: params || null,
        base: { w, h, d, x, y, z },
      };
      g.add(mesh);
      return mesh;
    }

    // колонны 8x6, 2 этажа
    for (let fl = 0; fl < 2; fl++) {
      const y0 = fl * 4.2;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++)
        box(.5, 4.2, .5, mat.col, i * 3.2 - 11.2, y0 + 2.1, j * 3 - 7.5, 'Колонна ' + (fl + 1) + '.' + (i * 6 + j + 1));
      box(24.8, .3, 16.8, mat.slab, 0, y0 + 4.2, 0, 'Плита перекрытия ' + (fl + 1));
      // витражные панели по периметру
      for (let i = 0; i < 8; i++) {
        box(3.1, 3.9, .1, mat.glz, i * 3.2 - 11.2, y0 + 2.1, -8, 'Витраж');
        box(3.1, 3.9, .1, mat.glz, i * 3.2 - 11.2, y0 + 2.1, 8, 'Витраж');
      }
      for (let j = 0; j < 6; j++) {
        box(.1, 3.9, 2.9, mat.glz, -12.4, y0 + 2.1, j * 3 - 7.5, 'Витраж');
        box(.1, 3.9, 2.9, mat.glz, 12.4, y0 + 2.1, j * 3 - 7.5, 'Витраж');
      }
    }
    // парапетные стены 2 этажа
    box(6, 1.4, .3, mat.wall, -9, 10.6, -8, 'Стена парапета');
    box(6, 1.4, .3, mat.wall, 9, 10.6, 8, 'Стена парапета');
    // ядро, крыша, демо-объект
    box(3, 8.6, 4, mat.core, 6, 4.3, 1.5, 'Ядро (лифт+лестница)');
    box(25.6, .35, 17.6, mat.roof, 0, 8.75, 0, 'Крыша');
    const dem = box(1.6, 3.6, .28, mat.col, -4, 6.3, 0, 'Демо-параметрический объект',
      { Width: 1600, Height: 3600, Rotation: 0 });
    dem.userData.cat = 'dem';
    dem.userData.catLabel = catOf.dem[0];
    counts.dem = 1;

    this.scene.add(g);
    this._bbox.setFromObject(g);

    // категории
    this.cats = Object.keys(catOf).map((k) => ({
      key: k, label: catOf[k][0], count: counts[k] || 0,
    }));

    // заготовленные виды
    this.presets = [
      { name: 'Вид снаружи', pos: [56, 40, 56], tgt: [0, 8, 0] },
      { name: 'Фасад', pos: [0, 9, 78], tgt: [0, 8, 0] },
      { name: 'План 2-го этажа', pos: [0, 95, .01], tgt: [0, 8, 0] },
      { name: 'Разрез-изометрия', pos: [40, 6, 40], tgt: [0, 10, 0] },
    ];

    this.ui.hideLoader();
    this.fit();
    this.ui.setCatCount(this.cats.length);
    this._meshes = g.children.slice();
    this._dem = dem;
    return { dbIds: this._meshes.length };
  };

  P._applyVis = function () {
    if (!this._meshes) return;
    this._meshes.forEach((m) => {
      const u = m.userData;
      m.visible = !this.hidden.includes(u.dbId);
    });
  };

  P.select = function (dbId) {
    this.selection = dbId == null ? [] : [dbId];
    this.ui.selectionChanged();
  };

  P._pick = function (e) {
    if (!this._meshes) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera({
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -((e.clientY - r.top) / r.height) * 2 + 1,
    }, this.camera);
    const vis = this._meshes.filter((m) => m.visible);
    const hit = this.ray.intersectObjects(vis, false)[0];
    this.select(hit ? hit.object.userData.dbId : null);
  };

(function () {
  'use strict';
  const T = window.THREE;
  const P = window.ThreePlaceholder.prototype;

  P.hide = function (ids) { this.hidden = this.hidden.concat(ids.filter(i => !this.hidden.includes(i))); this._applyVis(); };
  P.show = function (ids) { this.hidden = this.hidden.filter(i => !ids.includes(i)); this._applyVis(); };
  P.showAll = function () { this.hidden = []; this._applyVis(); };
  P.isolate = function (ids) {
    this.hidden = this._meshes.map(m => m.userData.dbId).filter(i => !ids.includes(i));
    this._applyVis();
  };
  P.enumerateDbIds = function () { return this._meshes.map(m => m.userData.dbId); };

  P.fit = function () {
    const b = this._bbox, c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
    const r = Math.max(s.x, s.y, s.z);
    this._tgt.copy(c);
    this.camera.position.copy(c).add(new T.Vector3(r * .85, r * .62, r * .85));
    this.camera.lookAt(c);
  };

  P._fly = function (pos, tgt) {
    this.camera.position.set(pos[0], pos[1], pos[2]);
    this._tgt.set(tgt[0], tgt[1], tgt[2]);
    this.camera.lookAt(this._tgt);
  };

  /* Разрез: одна плана отсечения на ось */
  P.setSectionAxis = function (axis) {
    if (this.section) { this.scene.remove(this.section); this.section = null; }
    if (!axis) {
      this._meshes && this._meshes.forEach(m => m.material.clippingPlanes = null);
      this.sectionAxis = null;
      return;
    }
    this.sectionAxis = axis;
    const n = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
    const c = this._bbox.getCenter(new T.Vector3());
    this._secRange = { min: (axis === 'x' ? this._bbox.min.x : axis === 'y' ? this._bbox.min.y : this._bbox.min.z),
                       max: (axis === 'x' ? this._bbox.max.x : axis === 'y' ? this._bbox.max.y : this._bbox.max.z) };
    this.sectionPlane = new T.Plane(new T.Vector3(...n), 0);
    this.setSectionPos(.5);
  };

  P.setSectionPos = function (t) {
    if (!this.sectionPlane || !this._secRange) return;
    const v = this._secRange.min + (this._secRange.max - this._secRange.min) * t;
    this.sectionPlane.constant = -v;
    this._meshes && this._meshes.forEach(m => m.material.clippingPlanes = [this.sectionPlane]);
    this.sectionPos = t;
  };

  P.applyParams = function (dbId, params) {
    const m = this._meshes && this._meshes.find(x => x.userData.dbId === dbId);
    if (!m) return false;
    Object.assign(m.userData.params, params);
    const b = m.userData.base;
    const k = .001;
    const w = (params.Width || b.w * 1000) * k, h = (params.Height || b.h * 1000) * k;
    m.scale.set(1, 1, 1);
    m.geometry.dispose();
    m.geometry = new T.BoxGeometry(Math.max(.05, w), Math.max(.05, h), b.d);
    const rot = params.Rotation || 0;
    m.rotation.y = (rot * Math.PI) / 180;
    if (params.Spacing != null) {
      const dx = Math.max(.5, params.Spacing * k);
      this._meshes.filter(x => x.userData.cat === 'col').forEach((c, ci) => {
        c.position.x = -11.2 + (ci % 8) * dx;
      });
    }
    return true;
  };

  P.getProperties = function (dbId) {
    const m = this._meshes && this._meshes.find(x => x.userData.dbId === dbId);
    if (!m) return null;
    const u = m.userData;
    const rows = [['Категория', u.catLabel], ['Имя', u.name]];
    if (u.params) for (const k in u.params) rows.push([k, u.params[k] + ' мм']);
    rows.push(['Габариты', u.base.w.toFixed(1) + ' × ' + u.base.d.toFixed(1) + ' × ' + u.base.h.toFixed(1) + ' м']);
    return rows;
  };

  P.dispose = function () {
    cancelAnimationFrame(this._raf);
    this.renderer && this.renderer.dispose();
  };
})();

})();
