import { H, STAIR, stairRamp } from './layout.js';

const RADIUS = 0.6;
const WALK_SPEED = 6; // feet per second
const TURN_SPEED = 1.8; // radians per second (arrow keys)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function groundHeight(x, z) {
  const inside = x > -0.4 && x < 15.4 && z > -0.3 && z < 40.4;
  if (inside) return 0;
  if ((z > -1.2 && z <= -0.3 && x > 0 && x < 15) || (z >= 40.4 && z < 41.4 && x > 11.8 && x < 15.2)) return -0.25;
  return -0.5;
}

export function yawPitchTo(from, to) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}

export class WalkControls {
  constructor(camera, dom, colliders) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.enabled = true;
    this.x = 7.5; this.z = -14; this.y = H.eye;
    this.yaw = 0; this.pitch = 0;
    this.mode = 'ground'; // 'ground' | 'stair' | 'first'
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.onInput = null;
    this.autoYaw = 0; // used by the guided tour
    camera.rotation.order = 'YXZ';
    this.#bind();
  }

  get level() {
    if (this.mode === 'first') return 1;
    if (this.mode === 'stair') return stairRamp(this.x) > H.floor / 2 ? 1 : 0;
    return 0;
  }

  setPose(x, z, level, yaw, pitch, eyeY) {
    this.x = x; this.z = z;
    this.mode = level === 1 ? 'first' : 'ground';
    this.yaw = yaw; this.pitch = pitch;
    this.y = eyeY ?? this.#baseHeight() + H.eye;
    this.#apply();
  }

  #touched() { if (this.onInput) this.onInput(); }

  #bind() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled || e.target.tagName === 'INPUT') return;
      this.keys.add(e.code);
      if (e.code.startsWith('Arrow')) e.preventDefault();
      this.#touched();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    // Drag to look (mouse or touch outside the joystick)
    const drags = new Map();
    this.dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      drags.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dom.setPointerCapture(e.pointerId);
      this.#touched();
    });
    this.dom.addEventListener('pointermove', (e) => {
      const d = drags.get(e.pointerId);
      if (!d || !this.enabled) return;
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
      this.yaw += (e.clientX - d.x) * k;
      this.pitch = clamp(this.pitch + (e.clientY - d.y) * k, -1.25, 1.25);
      d.x = e.clientX; d.y = e.clientY;
    });
    const end = (e) => drags.delete(e.pointerId);
    this.dom.addEventListener('pointerup', end);
    this.dom.addEventListener('pointercancel', end);

    // On-screen joystick
    const joy = document.getElementById('joystick');
    const knob = joy.querySelector('.knob');
    let jid = null;
    const setKnob = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      this.joy.x = dx; this.joy.y = dy;
      knob.style.transform = `translate(${dx * 35}px, ${dy * 35}px)`;
    };
    joy.addEventListener('pointerdown', (e) => {
      jid = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      setKnob(e);
      this.#touched();
      e.stopPropagation();
    });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) setKnob(e); });
    const jend = (e) => {
      if (e.pointerId !== jid) return;
      jid = null;
      this.joy.x = this.joy.y = 0;
      knob.style.transform = '';
    };
    joy.addEventListener('pointerup', jend);
    joy.addEventListener('pointercancel', jend);
  }

  #baseHeight() {
    if (this.mode === 'stair') return stairRamp(this.x);
    if (this.mode === 'first') return H.floor;
    return groundHeight(this.x, this.z);
  }

  #collide() {
    const list = this.colliders[this.mode];
    for (let pass = 0; pass < 2; pass++) {
      for (const b of list) {
        const cx = clamp(this.x, b.x0, b.x1), cz = clamp(this.z, b.z0, b.z1);
        const dx = this.x - cx, dz = this.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          this.x = cx + (dx / d) * RADIUS;
          this.z = cz + (dz / d) * RADIUS;
        } else {
          const l = this.x - b.x0, r = b.x1 - this.x, f = this.z - b.z0, k = b.z1 - this.z;
          const m = Math.min(l, r, f, k);
          if (m === l) this.x = b.x0 - RADIUS;
          else if (m === r) this.x = b.x1 + RADIUS;
          else if (m === f) this.z = b.z0 - RADIUS;
          else this.z = b.z1 + RADIUS;
        }
      }
    }
    this.x = clamp(this.x, -24, 39);
    this.z = clamp(this.z, -28, 60);
  }

  #transition() {
    const inStairBand = this.z > STAIR.z0 && this.z < STAIR.z1;
    if (this.mode === 'ground') {
      if (inStairBand && this.x > STAIR.x0 && this.x < 6.5) this.mode = 'stair';
    } else if (this.mode === 'first') {
      if (inStairBand && this.x > 12.5) this.mode = 'stair';
    } else if (this.mode === 'stair') {
      if (this.x <= STAIR.x0) this.mode = 'ground';
      else if (this.z >= STAIR.z1) this.mode = 'first';
    }
  }

  update(dt) {
    if (!this.enabled) return;
    const k = this.keys;
    let fwd = 0, side = 0, turn = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) fwd += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) fwd -= 1;
    if (k.has('KeyA')) side -= 1;
    if (k.has('KeyD')) side += 1;
    if (k.has('ArrowLeft') || k.has('KeyQ')) turn += 1;
    if (k.has('ArrowRight') || k.has('KeyE')) turn -= 1;
    fwd -= this.joy.y;
    side += this.joy.x * 0.8;
    this.yaw += turn * TURN_SPEED * dt + this.autoYaw * dt;

    const run = k.has('ShiftLeft') || k.has('ShiftRight') ? 1.8 : 1;
    const len = Math.hypot(fwd, side);
    if (len > 0.01) {
      const s = (WALK_SPEED * run * dt) / Math.max(1, len);
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const mx = (-sin * fwd + cos * side) * s;
      const mz = (-cos * fwd - sin * side) * s;
      const steps = Math.ceil(Math.hypot(mx, mz) / 0.2);
      for (let i = 0; i < steps; i++) {
        this.x += mx / steps;
        this.z += mz / steps;
        this.#transition();
        this.#collide();
      }
    }
    const target = this.#baseHeight() + H.eye;
    this.y += (target - this.y) * (1 - Math.exp(-dt * 9));
    this.#apply();
  }

  #apply() {
    this.camera.position.set(this.x, this.y, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
