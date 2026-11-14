import * as THREE from 'three';
import { box, cyl, mesh } from './buildWalls.js';
import { H } from './layout.js';

// Every piece is built around its own floor-centre origin with its front facing +z.
// rot: 0 faces +z, Math.PI faces -z, Math.PI/2 faces +x, -Math.PI/2 faces -x.

function legs(g, w, d, h, mat, r = 0.06, inset = 0.15) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(cyl(r, r * 0.8, h, mat, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset), 8));
  }
}

export function sofa(M, w = 6.5, mat = M.sofa) {
  const g = new THREE.Group();
  const d = 2.8;
  g.add(box(w, 0.9, d, mat, 0, 0.75, 0));
  g.add(box(w, 1.6, 0.6, mat, 0, 1.9, -d / 2 + 0.3));
  g.add(box(0.5, 1.2, d, mat, -w / 2 + 0.25, 1.4, 0));
  g.add(box(0.5, 1.2, d, mat, w / 2 - 0.25, 1.4, 0));
  const n = Math.max(2, Math.round((w - 1) / 2));
  const cw = (w - 1) / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.5 + cw * (i + 0.5);
    g.add(box(cw - 0.06, 0.35, d - 0.7, M.cushion2, x, 1.37, 0.25));
    const c = box(1.3, 1.1, 0.35, i % 2 ? M.cushion : M.cushion2, x, 2.0, -d / 2 + 0.8);
    c.rotation.x = -0.15;
    g.add(c);
  }
  legs(g, w, d, 0.3, M.darkWood, 0.07, 0.2);
  return g;
}

export function armchair(M) {
  const g = sofa(M, 3, M.sofa);
  return g;
}

export function coffeeTable(M, w = 3.6, d = 2) {
  const g = new THREE.Group();
  g.add(box(w, 0.12, d, M.lightWood, 0, 1.45, 0));
  g.add(box(w - 0.4, 0.08, d - 0.4, M.lightWood, 0, 0.4, 0));
  legs(g, w, d, 1.4, M.darkWood, 0.07);
  g.add(cyl(0.25, 0.2, 0.5, M.ceramic, -0.8, 1.76, 0, 16));
  g.add(box(1, 0.08, 0.7, M.book[1], 0.7, 1.55, 0.2));
  g.add(box(0.9, 0.08, 0.65, M.book[2], 0.7, 1.63, 0.2));
  return g;
}

export function rug(M, w, d, mat = M.rug) {
  return box(w, 0.04, d, mat, 0, 0.03, 0, { cast: false });
}

export function tvUnit(M, w = 6.5) {
  const g = new THREE.Group();
  // Wooden feature panel on the wall
  g.add(box(w + 1, 6.4, 0.12, M.furnitureWood, 0, 4.2, -0.75 + 0.06));
  g.add(box(w, 1.5, 1.4, M.laminate, 0, 1.0, 0));
  g.add(box(w + 0.05, 0.08, 1.45, M.darkWood, 0, 1.79, 0));
  for (let i = -1; i <= 1; i++) g.add(box(w / 3 - 0.1, 1.2, 0.03, M.furnitureWood, (i * w) / 3, 1.0, 0.71));
  // TV
  g.add(box(4.4, 2.55, 0.12, M.black, 0, 4.4, -0.55));
  g.add(box(4.2, 2.35, 0.02, M.tv, 0, 4.4, -0.48, { cast: false }));
  // Speaker + decor
  g.add(box(2.4, 0.3, 0.4, M.black, 0, 1.98, 0.2));
  g.add(cyl(0.2, 0.25, 0.9, M.ceramic, w / 2 - 0.6, 2.28, 0, 16));
  g.position.y = 0;
  return g;
}

export function chair(M, mat = M.furnitureWood, seat = M.cushion) {
  const g = new THREE.Group();
  g.add(box(1.4, 0.12, 1.4, mat, 0, 1.5, 0));
  g.add(box(1.36, 0.1, 1.3, seat, 0, 1.6, 0.02));
  g.add(box(1.4, 1.6, 0.12, mat, 0, 2.35, -0.64));
  legs(g, 1.4, 1.4, 1.5, mat, 0.05, 0.1);
  return g;
}

export function diningSet(M) {
  const g = new THREE.Group();
  const tw = 2.4, tl = 4;
  g.add(box(tw, 0.14, tl, M.furnitureWood, 0, 2.45, 0));
  legs(g, tw, tl, 2.4, M.darkWood, 0.08, 0.2);
  for (const sx of [-1, 1]) for (const sz of [-0.9, 0.9]) {
    const c = chair(M);
    c.position.set(sx * 1.55, 0, sz);
    c.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(c);
  }
  // Table runner, fruit bowl, plates
  g.add(box(0.8, 0.02, tl - 0.4, M.cushion, 0, 2.53, 0, { cast: false }));
  const bowl = mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ceramic);
  bowl.position.y = 2.95;
  bowl.rotation.x = Math.PI;
  g.add(bowl);
  for (const [c, x, z] of [['#e0412f', 0.1, 0.1], ['#f2b230', -0.15, -0.05], ['#7ab33c', 0.05, -0.2]]) {
    const f = mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
    f.position.set(x, 2.75, z);
    g.add(f);
  }
  for (const sx of [-1, 1]) for (const sz of [-0.9, 0.9]) {
    g.add(cyl(0.38, 0.32, 0.04, M.ceramic, sx * 0.75, 2.54, sz, 20));
  }
  return g;
}

export function bed(M, w = 5, l = 6.6, blanket = M.blanket) {
  const g = new THREE.Group();
  g.add(box(w + 0.3, 1.0, l + 0.2, M.furnitureWood, 0, 0.75, 0));
  g.add(box(w, 0.7, l - 0.2, M.bedsheet, 0, 1.6, 0.05));
  g.add(box(w + 0.6, 3.6, 0.35, M.darkWood, 0, 1.8, -l / 2 - 0.05));
  g.add(box(w - 0.2, 2.2, 0.15, M.sofa, 0, 2.8, -l / 2 + 0.2));
  g.add(box(w + 0.3, 1.6, 0.2, M.furnitureWood, 0, 0.8, l / 2 + 0.05));
  g.add(box(w + 0.12, 0.25, l * 0.55, blanket, 0, 2.0, l * 0.2));
  g.add(box(w + 0.14, 0.6, l * 0.55 - 0.05, blanket, 0, 1.75, l * 0.2));
  for (const sx of [-1, 1]) {
    const p = box(w / 2 - 0.4, 0.45, 1.2, M.cushion2, sx * (w / 4), 2.15, -l / 2 + 0.9);
    p.rotation.x = -0.25;
    g.add(p);
  }
  return g;
}

export function sideTable(M, lamp = true) {
  const g = new THREE.Group();
  g.add(box(1.6, 1.8, 1.4, M.furnitureWood, 0, 0.95, 0));
  g.add(box(1.5, 0.5, 0.03, M.lightWood, 0, 1.3, 0.71));
  g.add(box(0.3, 0.05, 0.05, M.chrome, 0, 1.3, 0.75));
  if (lamp) {
    g.add(cyl(0.12, 0.2, 0.9, M.ceramic, 0, 2.3, -0.1, 12));
    g.add(cyl(0.35, 0.5, 0.65, M.lampShade, 0, 3.0, -0.1, 16, { cast: false }));
  }
  return g;
}

export function wardrobe(M, w = 6, h = 7.2, d = 2) {
  const g = new THREE.Group();
  g.add(box(w, h, d, M.wardrobe, 0, h / 2, 0));
  const n = Math.round(w / 1.5);
  for (let i = 1; i < n; i++) g.add(box(0.03, h - 0.4, 0.02, M.furnitureWood, -w / 2 + (i * w) / n, h / 2, d / 2 + 0.01));
  g.add(box(w, 0.03, 0.02, M.furnitureWood, 0, h - 1.4, d / 2 + 0.01));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + ((i + 0.5) * w) / n + (i % 2 ? -0.5 : 0.5) * (w / n - 0.3);
    g.add(box(0.05, 1.2, 0.08, M.chrome, x, h / 2, d / 2 + 0.05));
  }
  g.add(box(w * 0.3, h - 2.2, 0.02, M.mirror, -w / 2 + w * 0.3 / 2 + 0.2, (h - 1.4) / 2 + 0.3, d / 2 + 0.02, { cast: false }));
  return g;
}

export function dressingTable(M) {
  const g = new THREE.Group();
  g.add(box(3, 0.15, 1.4, M.furnitureWood, 0, 2.5, 0));
  g.add(box(0.9, 2.4, 1.3, M.furnitureWood, -1.0, 1.2, 0));
  g.add(box(0.9, 2.4, 1.3, M.furnitureWood, 1.0, 1.2, 0));
  g.add(box(2.4, 3.2, 0.12, M.darkWood, 0, 4.3, -0.6));
  g.add(box(2.1, 2.9, 0.02, M.mirror, 0, 4.3, -0.53, { cast: false }));
  g.add(cyl(0.6, 0.6, 1.6, M.cushion, 0, 0.8, 1.2, 16));
  for (let i = 0; i < 3; i++) g.add(cyl(0.08, 0.1, 0.4, M.book[i], -0.8 + i * 0.3, 2.78, -0.3, 10));
  return g;
}

export function studyDesk(M) {
  const g = new THREE.Group();
  g.add(box(4, 0.14, 2, M.lightWood, 0, 2.45, 0));
  g.add(box(0.12, 2.4, 1.9, M.lightWood, -1.9, 1.2, 0));
  g.add(box(1.4, 2.4, 1.9, M.lightWood, 1.3, 1.2, 0));
  // laptop
  g.add(box(1.2, 0.04, 0.85, M.blackSteel, -0.4, 2.54, 0.2));
  const scr = box(1.2, 0.8, 0.03, M.tv, -0.4, 2.95, -0.25, { cast: false });
  scr.rotation.x = -0.25;
  g.add(scr);
  // wall shelf with books
  g.add(box(3.6, 0.1, 0.8, M.lightWood, 0, 5.2, -0.6));
  for (let i = 0; i < 9; i++) g.add(box(0.2, 0.9 + (i % 3) * 0.1, 0.6, M.book[i % 4], -1.6 + i * 0.25, 5.7 + (i % 3) * 0.05, -0.6));
  g.add(cyl(0.15, 0.25, 1.1, M.steel, 1.4, 3.05, -0.4, 10));
  g.add(cyl(0.3, 0.35, 0.3, M.lampShade, 1.4, 3.7, -0.3, 12, { cast: false }));
  const c = chair(M, M.blackSteel, M.sofa);
  c.position.set(-0.3, 0, 1.4);
  c.rotation.y = Math.PI;
  g.add(c);
  return g;
}

export function bookshelf(M, w = 3, h = 6) {
  const g = new THREE.Group();
  g.add(box(w, h, 0.12, M.furnitureWood, 0, h / 2, -0.55));
  g.add(box(0.12, h, 1.2, M.furnitureWood, -w / 2, h / 2, 0));
  g.add(box(0.12, h, 1.2, M.furnitureWood, w / 2, h / 2, 0));
  for (let s = 0; s <= 4; s++) g.add(box(w, 0.1, 1.2, M.furnitureWood, 0, 0.05 + (s * (h - 0.1)) / 4, 0));
  for (let s = 0; s < 4; s++) {
    let x = -w / 2 + 0.2;
    let i = s;
    while (x < w / 2 - 0.4) {
      const bw = 0.15 + ((i * 7) % 5) * 0.03;
      const bh = 0.8 + ((i * 3) % 4) * 0.08;
      g.add(box(bw, bh, 0.8, M.book[i % 4], x + bw / 2, 0.1 + (s * (h - 0.1)) / 4 + bh / 2, 0));
      x += bw + 0.02;
      i++;
    }
  }
  return g;
}

export function plant(M, s = 1, tall = false) {
  const g = new THREE.Group();
  g.add(cyl(0.45 * s, 0.32 * s, 0.9 * s, M.pot, 0, 0.45 * s, 0, 14));
  g.add(cyl(0.42 * s, 0.42 * s, 0.05, M.soil, 0, 0.88 * s, 0, 14, { cast: false }));
  if (tall) {
    g.add(cyl(0.05 * s, 0.07 * s, 2.6 * s, M.trunk, 0, 2.1 * s, 0, 6));
    for (let i = 0; i < 6; i++) {
      const l = mesh(new THREE.IcosahedronGeometry(0.6 * s, 0), i % 2 ? M.leaf : M.leaf2);
      const a = (i / 6) * Math.PI * 2;
      l.position.set(Math.cos(a) * 0.45 * s, (2.6 + (i % 3) * 0.5) * s, Math.sin(a) * 0.45 * s);
      l.scale.set(1, 1.3, 0.5);
      l.rotation.y = a;
      g.add(l);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const l = mesh(new THREE.ConeGeometry(0.18 * s, 1.4 * s, 5), i % 2 ? M.leaf : M.leaf2);
      const a = (i / 7) * Math.PI * 2;
      l.position.set(Math.cos(a) * 0.15 * s, 1.5 * s, Math.sin(a) * 0.15 * s);
      l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
      g.add(l);
    }
  }
  return g;
}

export function ceilingFan(M, ceilingY) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 1.0, M.steel, 0, -0.5, 0, 8));
  g.add(cyl(0.3, 0.3, 0.1, M.steel, 0, 0, 0, 16));
  const rotor = new THREE.Group();
  rotor.add(cyl(0.38, 0.32, 0.35, M.white, 0, 0, 0, 20));
  for (let i = 0; i < 3; i++) {
    const b = box(2.0, 0.04, 0.42, M.white, 1.25, -0.05, 0);
    const holder = new THREE.Group();
    holder.add(b);
    holder.rotation.y = (i * Math.PI * 2) / 3;
    rotor.add(holder);
  }
  rotor.position.y = -1.15;
  rotor.userData.spin = true;
  g.add(rotor);
  g.position.y = ceilingY;
  return g;
}

export function wallArt(M, mat, w = 2.4, h = 1.6) {
  const g = new THREE.Group();
  g.add(box(w + 0.15, h + 0.15, 0.06, M.darkWood, 0, 0, 0));
  g.add(box(w, h, 0.02, mat, 0, 0, 0.04, { cast: false }));
  return g;
}

export function fridge(M) {
  const g = new THREE.Group();
  g.add(box(2, 5.8, 2, M.fridge, 0, 2.9, 0));
  g.add(box(1.98, 0.03, 0.02, M.blackSteel, 0, 3.9, 1.01));
  g.add(box(0.06, 1.2, 0.1, M.chrome, 0.8, 4.7, 1.05));
  g.add(box(0.06, 1.6, 0.1, M.chrome, 0.8, 2.9, 1.05));
  return g;
}

export function wc(M) {
  const g = new THREE.Group();
  g.add(cyl(0.55, 0.42, 1.2, M.ceramic, 0, 0.6, 0.3, 20));
  const seat = mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 24), M.white);
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 1.24, 0.3);
  g.add(seat);
  g.add(box(1.4, 1.6, 0.6, M.ceramic, 0, 1.9, -0.55));
  g.add(box(0.3, 0.06, 0.06, M.chrome, 0.45, 2.55, -0.55));
  return g;
}

export function basin(M) {
  const g = new THREE.Group();
  g.add(box(1.8, 0.5, 1.4, M.ceramic, 0, 2.65, 0));
  const bowl = mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.3, 20), M.white);
  bowl.position.set(0, 2.78, 0.05);
  g.add(bowl);
  g.add(cyl(0.12, 0.15, 2.4, M.ceramic, 0, 1.2, -0.3, 12));
  g.add(cyl(0.04, 0.04, 0.5, M.chrome, 0, 3.1, -0.5, 8));
  g.add(box(0.05, 0.05, 0.4, M.chrome, 0, 3.3, -0.35));
  g.add(box(2.2, 2.6, 0.06, M.mirror, 0, 4.8, -0.68, { cast: false }));
  g.add(box(2.2, 0.08, 0.5, M.ceramic, 0, 3.4, -0.45));
  return g;
}

export function showerSet(M) {
  const g = new THREE.Group();
  // Assumes the shower wall is at local -z. Head + arm + mixer.
  g.add(cyl(0.04, 0.04, 1.2, M.chrome, 0, 6.2, -0.05, 8));
  const arm = cyl(0.03, 0.03, 0.8, M.chrome, 0, 6.8, 0.35, 8);
  arm.rotation.x = Math.PI / 2;
  g.add(arm);
  g.add(cyl(0.35, 0.3, 0.08, M.chrome, 0, 6.75, 0.75, 20));
  g.add(box(0.5, 0.25, 0.15, M.chrome, 0, 3.6, 0.05));
  // Bucket and mug
  const bucket = cyl(0.55, 0.45, 1.1, new THREE.MeshStandardMaterial({ color: '#2f6bd1', roughness: 0.5 }), 0.9, 0.55, 1.3, 18);
  g.add(bucket);
  g.add(cyl(0.18, 0.16, 0.35, new THREE.MeshStandardMaterial({ color: '#e04848', roughness: 0.5 }), 1.6, 0.18, 1.7, 12));
  // Corner shelf with bottles
  g.add(box(1, 0.06, 0.5, M.glass, -0.9, 4.5, 0.25));
  for (let i = 0; i < 3; i++) g.add(cyl(0.08, 0.08, 0.5, M.book[i], -1.2 + i * 0.25, 4.78, 0.25, 10));
  return g;
}

export function geyser(M) {
  const g = new THREE.Group();
  const body = cyl(0.55, 0.55, 2.2, M.white, 0, 0, 0, 20);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  g.add(box(0.5, 0.15, 0.1, M.black, 0.4, -0.2, 0.56));
  return g;
}

export function towelRail(M, color = '#d2a24c') {
  const g = new THREE.Group();
  const bar = cyl(0.03, 0.03, 2, M.chrome, 0, 0, 0.15, 8);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  g.add(box(1.2, 1.6, 0.06, new THREE.MeshStandardMaterial({ color, roughness: 1 }), 0, -0.75, 0.18));
  return g;
}

export function waterTank(M) {
  const g = new THREE.Group();
  g.add(box(4, 1.5, 4, M.slabEdge, 0, 0.75, 0));
  g.add(cyl(1.75, 1.75, 4.2, M.tank, 0, 3.6, 0, 28));
  g.add(cyl(0.7, 0.7, 0.3, M.tank, 0, 5.85, 0, 20));
  for (let i = 0; i < 4; i++) g.add(cyl(1.77, 1.77, 0.08, M.blackSteel, 0, 2.1 + i * 1.1, 0, 28));
  return g;
}

export function outdoorSet(M) {
  const g = new THREE.Group();
  const plastic = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.5 });
  g.add(cyl(1.4, 1.4, 0.1, plastic, 0, 2.4, 0, 28));
  g.add(cyl(0.12, 0.3, 2.4, plastic, 0, 1.2, 0, 12));
  for (const a of [0, Math.PI * 0.66, Math.PI * 1.33]) {
    const c = chair(M, plastic, plastic);
    c.position.set(Math.sin(a) * 2.3, 0, Math.cos(a) * 2.3);
    c.rotation.y = a + Math.PI;
    g.add(c);
  }
  // Parasol
  g.add(cyl(0.06, 0.06, 7.5, M.steel, 0, 3.75, 0, 8));
  const canopy = mesh(new THREE.ConeGeometry(3.2, 1.1, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#c8462d', roughness: 0.9, side: THREE.DoubleSide }));
  canopy.position.y = 7.3;
  g.add(canopy);
  return g;
}

export function clothesStand(M) {
  const g = new THREE.Group();
  for (const x of [-2, 2]) g.add(box(0.1, 5, 0.1, M.steel, x, 2.5, 0));
  for (let i = 0; i < 3; i++) {
    const w = cyl(0.02, 0.02, 4, M.steel, 0, 4.9, -0.3 + i * 0.3, 6);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  const colors = ['#d94a4a', '#3d79c2', '#f2c14e', '#5aa36b'];
  for (let i = 0; i < 4; i++) {
    g.add(box(0.9, 1.4, 0.03, new THREE.MeshStandardMaterial({ color: colors[i], roughness: 1, side: THREE.DoubleSide }), -1.4 + i * 0.95, 4.2, -0.3 + (i % 3) * 0.3, { receive: false }));
  }
  return g;
}

export function shoeRack(M) {
  const g = new THREE.Group();
  g.add(box(3, 2.6, 1.2, M.furnitureWood, 0, 1.3, 0));
  for (const y of [0.9, 1.8]) g.add(box(2.9, 0.03, 0.02, M.darkWood, 0, y, 0.61));
  g.add(cyl(0.2, 0.25, 0.7, M.ceramic, 0.9, 2.95, 0, 12));
  g.add(box(2.2, 3.2, 0.06, M.mirror, 0, 5, -0.55, { cast: false }));
  return g;
}

export function pendant(M) {
  const g = new THREE.Group();
  g.add(cyl(0.015, 0.015, 2.2, M.black, 0, -1.1, 0, 4));
  g.add(cyl(0.3, 0.6, 0.55, M.black, 0, -2.4, 0, 18));
  g.add(cyl(0.2, 0.2, 0.05, M.bulb, 0, -2.66, 0, 12, { cast: false }));
  return g;
}

export function furnishHouse(M, groups, colliders) {
  const fans = [];
  const put = (level, obj, x, z, rot = 0, { y = 0, solid = false, shrink = 0.1 } = {}) => {
    obj.position.set(x, level * H.floor + y, z);
    obj.rotation.y = rot;
    (level === 0 ? groups.ground : groups.first).add(obj);
    if (solid) {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      (level === 0 ? colliders.ground : colliders.first).push({
        x0: b.min.x + shrink, x1: b.max.x - shrink, z0: b.min.z + shrink, z1: b.max.z - shrink,
      });
    }
    return obj;
  };
  const fan = (level, x, z) => fans.push(put(level, ceilingFan(M, 0), x, z, 0, { y: H.clear }));
  const S = { solid: true };
  const R = Math.PI / 2;

  // ---------- Ground floor ----------
  // Living
  put(0, rug(M, 7.5, 5), 9, 7.3);
  put(0, sofa(M, 6.5), 9, 3.85, 0, S);
  put(0, coffeeTable(M), 9, 7.2, 0, S);
  put(0, armchair(M), 13.2, 7.4, -R, S);
  put(0, tvUnit(M), 9, 11.1, Math.PI, S);
  put(0, shoeRack(M), 0.95, 8.6, R, S);
  put(0, plant(M, 1.1, true), 13.9, 10.9);
  put(0, plant(M, 0.9), 5.0, 2.9);
  put(0, wallArt(M, M.art1, 2.6, 1.8), 14.6, 7.4, -R, { y: 5.6 });
  fan(0, 8.5, 7.3);

  // Passage & dining
  put(0, diningSet(M), 2.6, 21.5, 0, S);
  put(0, pendant(M), 2.6, 21.5, 0, { y: H.clear });
  put(0, wallArt(M, M.art2, 2.2, 3), 0.42, 21.5, R, { y: 5.2 });
  put(0, plant(M, 1, true), 5.5, 29.2);
  put(0, plant(M, 0.8), 0.9, 13.0);
  put(0, wallArt(M, M.art3, 1.6, 2.2), 0.42, 16.5, R, { y: 5.2 });

  // Toilet & bath
  put(0, showerSet(M), 13.5, 12 + H.inner / 2 + 0.02);
  put(0, box(0.04, 6.5, 2.0, M.glass, 0, 3.3, 0, { cast: false }), 12.2, 14.15);
  put(0, wc(M), 13.75, 17.3, -R, S);
  put(0, basin(M), 9.6, 19 - H.inner / 2 - 0.7, Math.PI);
  put(0, geyser(M), 14.0, 16.0, R, { y: 7.6 });
  put(0, towelRail(M), 12.0, 19 - H.inner / 2, Math.PI, { y: 5 });

  // Kitchen
  groups.ground.add(kitchen(M));
  colliders.ground.push(
    { x0: 15 - H.outer / 2 - 2, x1: 15, z0: 19, z1: 27 },
    { x0: 6.5, x1: 15, z0: 19, z1: 19 + H.inner / 2 + 2 },
  );
  put(0, fridge(M), 7.75, 22.4, R, S);
  put(0, pendant(M), 9.5, 23.5, 0, { y: H.clear });

  // Bedroom
  put(0, rug(M, 4, 6.5, M.rug), 4.3, 35);
  put(0, bed(M, 5, 6.6, M.blanket), 8.25, 35, -R, S);
  put(0, sideTable(M), 11.05, 31.35, -R, S);
  put(0, sideTable(M), 11.05, 38.65, -R, S);
  put(0, wardrobe(M, 6), 1.4, 36.4, R, S);
  put(0, dressingTable(M), 3.9, 39.0, Math.PI, S);
  put(0, wallArt(M, M.art3, 3, 1.6), 11.78, 35, -R, { y: 5.6 });
  fan(0, 6.5, 35);

  // Side passage
  put(0, plant(M, 0.8), 14.15, 31.0);
  put(0, plant(M, 0.7), 14.2, 33.0);
  put(0, plant(M, 1, true), 10.8, 41.6, 0, { y: -0.5 });

  // ---------- First floor ----------
  // Balcony
  for (const x of [5, 8, 11, 13.8]) put(1, plant(M, 0.6), x, 0.75);
  put(1, chair(M, M.darkWood, M.cushion), 1.6, 0.95, R); // Moved back to original position

  // Bedroom 1
  put(1, rug(M, 5, 7, M.rug), 7.0, 7.1);
  put(1, bed(M, 5.2, 6.6, M.blanket2), 11.05, 7.1, -R, S);
  put(1, sideTable(M), 13.9, 3.3, -R, S);
  put(1, sideTable(M), 13.9, 10.9, -R, S);
  put(1, wardrobe(M, 5), 6.0, 10.8, Math.PI, S);
  put(1, dressingTable(M), 1.15, 7.0, R, S);
  // armchair removed here
  put(1, wallArt(M, M.art1, 3.2, 1.8), 14.6, 7.1, -R, { y: 5.8 });
  fan(1, 8, 7.1);

  // Lobby / family sitting
  put(1, sofa(M, 4.5, M.sofa), 1.8, 17.0, R, S);
  // coffeeTable removed here
  put(1, bookshelf(M, 3, 6), 7.8, 19.2, Math.PI, S);
  put(1, plant(M, 1, true), 9.9, 19.15);
  put(1, plant(M, 0.8), 0.9, 12.8);
  put(1, wallArt(M, M.art2, 2.4, 1.6), 0.42, 17.0, R, { y: 5.6 });

  // Bedroom 2
  put(1, bed(M, 5, 6.6, M.blanket3), 8.25, 25, -R, S);
  put(1, sideTable(M), 11.05, 21.35, -R, S);
  put(1, sideTable(M), 11.05, 28.65, -R, S);
  put(1, wardrobe(M, 5), 8.5, 21.2, 0, S);
  put(1, studyDesk(M), 1.4, 26.2, R, S);
  put(1, wallArt(M, M.art3, 3, 1.6), 11.78, 25, -R, { y: 5.6 });
  fan(1, 6.5, 25);

  // Passage to terrace
  put(1, plant(M, 0.8), 14.15, 22.0);
  put(1, plant(M, 1, true), 14.0, 28.6);

  // Terrace
  put(1, waterTank(M), 2.6, 37.4, 0, S);
  put(1, outdoorSet(M), 9.8, 36.4, 0.4, { solid: true, shrink: 1.4 });
  put(1, clothesStand(M), 5.6, 32.6, 0, S);
  for (const [x, z, s] of [[14.0, 31.2, 0.8], [14.0, 39.0, 1], [11.5, 39.1, 0.7], [7, 39.1, 0.9], [0.9, 31.2, 0.8], [5.2, 39.1, 0.6]]) {
    put(1, plant(M, s, s > 0.85), x, z);
  }

  return { fans };
}

export function kitchen(M) {
  // Absolute placement inside the kitchen (x 6.5..15, z 19..27).
  const g = new THREE.Group();
  const xi = 6.5 + H.inner / 2, xr = 15 - H.outer / 2;
  const zf = 19 + H.inner / 2, zb = 27 - H.inner / 2;
  const d = 2, ch = 2.65;
  // Counter along right wall
  g.add(box(d, ch, zb - zf, M.cabinet2, xr - d / 2, ch / 2, (zf + zb) / 2));
  g.add(box(d + 0.1, 0.15, zb - zf, M.granite, xr - d / 2 - 0.05, ch + 0.075, (zf + zb) / 2));
  // Counter along the toilet wall
  g.add(box(xr - d - xi, ch, d, M.cabinet2, (xi + xr - d) / 2, ch / 2, zf + d / 2));
  g.add(box(xr - d - xi, 0.15, d + 0.1, M.granite, (xi + xr - d) / 2, ch + 0.075, zf + d / 2 + 0.05));
  // Shutters (maroon)
  for (let z = zf + d + 0.1; z < zb - 0.3; z += 1.5) g.add(box(0.03, 2.1, 1.42, M.cabinet, xr - d - 0.02, 1.3, z + 0.72));
  for (let x = xi + 0.1; x < xr - d - 0.3; x += 1.5) g.add(box(1.42, 2.1, 0.03, M.cabinet, x + 0.72, 1.3, zf + d + 0.02));
  // Sink
  g.add(box(2, 0.05, 1.4, M.steel, 9.2, ch + 0.16, zf + 1.0));
  g.add(box(1.8, 0.04, 1.2, M.blackSteel, 9.2, ch + 0.17, zf + 1.0, { cast: false }));
  g.add(cyl(0.04, 0.04, 0.9, M.chrome, 9.2, ch + 0.6, zf + 0.25, 8));
  const spout = cyl(0.035, 0.035, 0.6, M.chrome, 9.2, ch + 1.02, zf + 0.5, 8);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  // Gas hob (3 burner)
  const hz = 23.4;
  g.add(box(1.6, 0.12, 2.4, M.black, xr - 1.0, ch + 0.21, hz));
  for (const dz of [-0.75, 0, 0.75]) {
    g.add(cyl(0.22, 0.22, 0.08, M.blackSteel, xr - 1.0, ch + 0.31, hz + dz, 16));
    g.add(cyl(0.1, 0.1, 0.09, M.steel, xr - 1.0, ch + 0.33, hz + dz, 12));
  }
  // Pressure cooker + kettle
  g.add(cyl(0.32, 0.3, 0.6, M.steel, xr - 1.0, ch + 0.65, hz - 0.75, 16));
  g.add(cyl(0.25, 0.3, 0.45, M.chrome, xr - 0.9, ch + 0.55, hz + 0.75, 16));
  // Chimney
  g.add(box(1.8, 0.5, 2.6, M.steel, xr - 0.9, 5.7, hz));
  g.add(box(0.9, 3.3, 1.0, M.steel, xr - 0.45, 7.8, hz));
  // Wall cabinets
  const wy = 5.3, wh = 2.4, wd = 1.1;
  g.add(box(xr - xi - 0.05, wh, wd, M.cabinet, (xi + xr) / 2, wy + wh / 2, zf + wd / 2));
  g.add(box(wd, wh, hz - 1.4 - (zf + wd), M.cabinet, xr - wd / 2, wy + wh / 2, (zf + wd + hz - 1.4) / 2));
  g.add(box(wd, wh, zb - (hz + 1.4), M.cabinet, xr - wd / 2, wy + wh / 2, (hz + 1.4 + zb) / 2));
  for (let x = xi + 1.4; x < xr; x += 1.4) g.add(box(0.03, wh - 0.1, 0.02, M.darkWood, x, wy + wh / 2, zf + wd + 0.01));
  // Microwave + jars
  g.add(box(1.6, 0.95, 1.2, M.blackSteel, xr - 1.0, ch + 0.62, 26.0));
  g.add(box(0.03, 0.6, 0.9, M.glass, xr - 1.81, ch + 0.62, 25.9, { cast: false }));
  for (let i = 0; i < 4; i++) g.add(cyl(0.15, 0.15, 0.45, M.glass, 7.2 + i * 0.4, ch + 0.38, zf + 0.35, 12, { cast: false }));
  return g;
}