import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ROOMS, UI_TEXT, H } from './layout.js';

const $ = (id) => document.getElementById(id);

export function roomAt(x, z, level) {
  for (const r of ROOMS) {
    if (r.level !== level || r.exterior) continue;
    for (const [a, b, c, d] of r.rects) if (x >= a && x <= c && z >= b && z <= d) return r;
  }
  return null;
}

export function createUI(app) {
  const state = { lang: 'en', active: null };
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('touch');

  // Labels shown in dollhouse view
  const labels = [];
  for (const r of ROOMS) {
    if (r.exterior || !r.rects.length) continue;
    const [a, b, c, d] = r.rects[0];
    const el = document.createElement('div');
    el.className = 'room-label';
    const obj = new CSS2DObject(el);
    const [lx, lz] = r.labelAt || [(a + c) / 2, (b + d) / 2];
    obj.position.set(lx, r.level * H.floor + 4, lz);
    obj.userData.room = r;
    labels.push(obj);
    app.addLabel(obj, r.level);
  }

  const panel = $('panel');
  const buttons = new Map();
  function buildPanel() {
    const t = UI_TEXT[state.lang];
    panel.innerHTML = '';
    for (const [level, title] of [[0, t.ground], [1, t.first]]) {
      const h = document.createElement('h3');
      h.textContent = title;
      panel.appendChild(h);
      for (const r of ROOMS.filter((q) => q.level === level)) {
        const b = document.createElement('button');
        b.className = 'room' + (state.active === r.id ? ' active' : '');
        b.textContent = state.lang === 'hi' ? r.hi : r.en;
        b.onclick = () => {
          app.stopTour();
          app.goToRoom(r.id);
          if (window.innerWidth < 700) panel.classList.add('hidden');
        };
        buttons.set(r.id, b);
        panel.appendChild(b);
      }
    }
  }

  function applyText() {
    const t = UI_TEXT[state.lang];
    $('title').textContent = t.title;
    $('btnWalk').textContent = t.walk;
    $('btnDoll').textContent = t.doll;
    $('btnGround').textContent = t.gOnly;
    $('btnBoth').textContent = t.both;
    $('btnFull').textContent = t.full;
    $('btnTour').textContent = app.touring ? t.stop : t.tour;
    $('btnLang').textContent = t.lang;
    for (const l of labels) l.element.textContent = state.lang === 'hi' ? l.userData.room.hi : l.userData.room.en;
    updateHelp();
    buildPanel();
    setCurrentRoom(state.current, true);
  }

  function updateHelp() {
    const t = UI_TEXT[state.lang];
    $('help').textContent = app.mode === 'doll' ? t.helpDoll : isTouch ? t.helpTouch : t.helpDesk;
  }

  function setCurrentRoom(room, force = false) {
    if (room === state.current && !force) return;
    state.current = room;
    const t = UI_TEXT[state.lang];
    const label = room ? (state.lang === 'hi' ? room.hi : room.en) : app.mode === 'doll' ? '' : t.outside;
    $('currentRoom').textContent = label;
  }

  function setActive(id) {
    state.active = id;
    for (const [k, b] of buttons) b.classList.toggle('active', k === id);
  }

  function setModeButtons(mode) {
    $('btnWalk').classList.toggle('on', mode === 'walk');
    $('btnDoll').classList.toggle('on', mode === 'doll');
    document.body.classList.toggle('doll', mode === 'doll');
    document.body.classList.toggle('walk', mode === 'walk');
    updateHelp();
  }

  function setFloorButtons(f) {
    $('btnGround').classList.toggle('on', f === 'ground');
    $('btnBoth').classList.toggle('on', f === 'both');
    $('btnFull').classList.toggle('on', f === 'full');
  }

  function setTourButton(on) {
    const t = UI_TEXT[state.lang];
    $('btnTour').textContent = on ? t.stop : t.tour;
    $('btnTour').classList.toggle('on', on);
  }

  $('btnWalk').onclick = () => { app.stopTour(); app.setMode('walk'); };
  $('btnDoll').onclick = () => { app.stopTour(); app.setMode('doll'); };
  $('btnGround').onclick = () => app.setFloors('ground');
  $('btnBoth').onclick = () => app.setFloors('both');
  $('btnFull').onclick = () => app.setFloors('full');
  $('btnTour').onclick = () => (app.touring ? app.stopTour() : app.startTour());
  $('btnLang').onclick = () => { state.lang = state.lang === 'en' ? 'hi' : 'en'; applyText(); };
  $('menuToggle').onclick = () => panel.classList.toggle('hidden');
  if (window.innerWidth < 700) panel.classList.add('hidden');

  // Keep UI clicks from moving the camera
  for (const id of ['panel', 'bottombar', 'topbar', 'menuToggle']) {
    $(id).addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  let helpTimer = null;
  const flashHelp = () => {
    $('help').style.opacity = 1;
    clearTimeout(helpTimer);
    helpTimer = setTimeout(() => { $('help').style.opacity = 0; }, 9000);
  };

  return {
    state,
    setLang(l) { state.lang = l; applyText(); },
    applyText,
    setCurrentRoom,
    setActive,
    setModeButtons: (m) => { setModeButtons(m); flashHelp(); },
    setFloorButtons,
    setTourButton,
    labels,
    flashHelp,
  };
}
