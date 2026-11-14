import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { H, ROOMS, TOUR } from './layout.js';
import { createMaterials, setAnisotropy } from './materials.js';
import { buildHouse, cyl } from './buildWalls.js';
import { furnishHouse } from './furniture.js';
import { WalkControls, yawPitchTo } from './controls.js';
import { createUI, roomAt } from './ui.js';

const params = new URLSearchParams(location.search);
const container = document.getElementById('app');

// ---------- Renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: params.has('shot') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
container.appendChild(renderer.domElement);
setAnisotropy(renderer.capabilities.getMaxAnisotropy());



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800);
const dollCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 1200);

const M = createMaterials();
scene.background = M.sky;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
scene.fog = new THREE.Fog('#dde7ee', 140, 420);

// ---------- House ----------
const { groups, colliders } = buildHouse(M);
const { fans } = furnishHouse(M, groups, colliders);
for (const g of Object.values(groups)) scene.add(g);
const rotors = [];
for (const f of fans) f.traverse((o) => { o.castShadow = false; if (o.userData.spin) rotors.push(o); });

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight('#e6f0fa', '#cbbfae', 0.7));
const sun = new THREE.DirectionalLight('#fff3e0', 2.6);
sun.position.set(45, 70, -35);
sun.target.position.set(7.5, 0, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 10, far: 200 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// Warm ceiling lights in each room (fixture + point light)
for (const r of ROOMS) {
  if (!r.light) continue;
  const [a, b, c, d] = r.rects[0];
  const x = (a + c) / 2, z = (b + d) / 2;
  const base = r.level * H.floor;
  const g = r.level === 0 ? groups.ground : groups.first;
  const fixture = cyl(0.55, 0.55, 0.08, M.bulb, x + (r.id === 'living' || r.id.startsWith('bed') ? 2.2 : 0), base + H.clear - 0.05, z, 24, { cast: false, receive: false });
  g.add(fixture);
  const light = new THREE.PointLight('#ffdcb0', 16, 26, 1.3);
  light.position.set(fixture.position.x, base + H.clear - 0.8, z);
  g.add(light);
}

// ---------- Controls ----------
const walk = new WalkControls(camera, renderer.domElement, colliders);
const orbit = new OrbitControls(dollCamera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(7.5, 6, 20);
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.minDistance = 15;
orbit.maxDistance = 160;
dollCamera.position.set(48, 52, -26);
orbit.enabled = false;

// ---------- App state ----------
const fadeEl = document.getElementById('fade');
const app = {
  mode: 'walk',
  floors: 'full',
  touring: false,
  addLabel(obj, level) { (level === 0 ? groups.ground : groups.first).add(obj); },
  setMode(m) {
    app.mode = m;
    walk.enabled = m === 'walk';
    orbit.enabled = m === 'doll';
    if (m === 'walk') app.setFloors('full', true);
    else { groups.neighbors.visible = false; app.setFloors(app.floors === 'full' ? 'both' : app.floors); }
    groups.neighbors.visible = m === 'walk';
    ui.setModeButtons(m);
    ui.setCurrentRoom(null, true);
    renderer.shadowMap.needsUpdate = true;
  },
  setFloors(f, silent) {
    app.floors = f;
    groups.first.visible = f !== 'ground';
    groups.roof.visible = f === 'full';
    const shownLevel = f === 'ground' ? 0 : 1;
    if (!silent) ui.setFloorButtons(f);
    renderer.shadowMap.needsUpdate = true;
  },
  goToRoom(id, instant = false) {
    const r = ROOMS.find((q) => q.id === id);
    if (!r) return Promise.resolve();
    if (app.mode !== 'walk') app.setMode('walk');
    ui.setActive(id);
    const v = r.view;
    const base = r.level * H.floor;
    const eye = v.y ?? H.eye;
    const look = [v.look[0], base + v.look[1], v.look[2]];
    const from = [v.pos[0], (r.exterior ? -0.5 : base) + eye, v.pos[1]];
    const { yaw, pitch } = yawPitchTo(from, look);
    const jump = () => walk.setPose(v.pos[0], v.pos[1], r.level, yaw, pitch, r.exterior ? from[1] : undefined);
    if (instant) { jump(); return Promise.resolve(); }
    return new Promise((res) => {
      fadeEl.style.opacity = 1;
      setTimeout(() => {
        jump();
        fadeEl.style.opacity = 0;
        setTimeout(res, 300);
      }, 300);
    });
  },
  async startTour() {
    app.touring = true;
    ui.setTourButton(true);
    const token = (app.tourToken = Symbol('tour'));
    for (let i = 0; app.touring && app.tourToken === token; i = (i + 1) % TOUR.length) {
      await app.goToRoom(TOUR[i]);
      if (!app.touring || app.tourToken !== token) break;
      walk.autoYaw = i % 2 ? -0.16 : 0.16;
      await new Promise((r) => setTimeout(r, 5200));
      walk.autoYaw = 0;
    }
  },
  stopTour() {
    if (!app.touring) return;
    app.touring = false;
    app.tourToken = null;
    walk.autoYaw = 0;
    ui.setTourButton(false);
  },
};
const ui = createUI(app);
walk.onInput = () => app.stopTour();

// ---------- Resize ----------
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  for (const c of [camera, dollCamera]) { c.aspect = w / h; c.updateProjectionMatrix(); }
}
window.addEventListener('resize', onResize);

// ---------- Start ----------
ui.setLang(params.get('lang') === 'hi' ? 'hi' : 'en');
app.setMode('walk');
app.goToRoom(params.get('room') || 'front', true);
if (params.get('mode') === 'doll') {
  app.setMode('doll');
  if (params.get('floors')) app.setFloors(params.get('floors'));
  if (params.get('cam')) {
    const [x, y, z] = params.get('cam').split(',').map(Number);
    dollCamera.position.set(x, y, z);
  }
}
if (params.get('tour') === '1') app.startTour();

// ---------- Loop ----------
const timer = new THREE.Timer();
let currentLevelRoom = null;
let frames = 0;
function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  if (app.mode === 'walk') {
    walk.update(dt);
    const r = roomAt(walk.x, walk.z, walk.level);
    const room = walk.mode === 'stair' ? ROOMS.find((q) => q.id === 'stair') : r;
    if (room !== currentLevelRoom) { currentLevelRoom = room; ui.setCurrentRoom(room); }
  } else {
    orbit.update();
  }
  for (const r of rotors) r.rotation.y += dt * 9;
  const cam = app.mode === 'walk' ? camera : dollCamera;
  renderer.render(scene, cam);
    if (++frames === 2) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('gone');
      setTimeout(() => loadingEl.remove(), 450);
    }
    ui.flashHelp();
    window.__ready = true;
  }
  requestAnimationFrame(tick);
}
renderer.shadowMap.needsUpdate = true;
tick();
