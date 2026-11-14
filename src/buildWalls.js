import * as THREE from 'three';
import { H, STAIR, WALLS, RAILS, ROOMS, stairRamp, stairSoffit } from './layout.js';
import { uvSize, worldBoxUV } from './materials.js';

const FACE = { '+x': 0, '-x': 1, '+y': 2, '-y': 3, '+z': 4, '-z': 5 };

export function mesh(geom, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geom, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0, opts) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, opts);
  m.position.set(x, y, z);
  return m;
}

// Box given by min/max corners.
function boxMM(x0, y0, z0, x1, y1, z1, mat, opts) {
  return box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, opts);
}

export function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 16, opts) {
  const m = mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat, opts);
  m.position.set(x, y, z);
  return m;
}

function wallMaterials(M, outside) {
  const arr = [M.wallIn, M.wallIn, M.wallIn, M.wallIn, M.wallIn, M.wallIn];
  if (outside) arr[FACE[outside]] = M.wallExt;
  return arr;
}

// Place a box spanning [a,b] along the wall axis, [y0,y1] vertically, thickness t around the wall line.
function wallPiece(w, a, b, y0, y1, t, mat) {
  const base = w.level * H.floor;
  const len = b - a, mid = (a + b) / 2, hh = y1 - y0, cy = base + (y0 + y1) / 2;
  return w.axis === 'x' ? box(len, hh, t, mat, mid, cy, w.at) : box(t, hh, len, mat, w.at, cy, mid);
}

function toAABB(w, a, b, t) {
  return w.axis === 'x'
    ? { x0: a, x1: b, z0: w.at - t / 2, z1: w.at + t / 2 }
    : { x0: w.at - t / 2, x1: w.at + t / 2, z0: a, z1: b };
}

// Local frame helper: position along wall axis `u`, along normal `n` (from wall line), height `y`.
function place(w, obj, u, y, n) {
  const base = w.level * H.floor;
  if (w.axis === 'x') obj.position.set(u, base + y, w.at + n);
  else { obj.position.set(w.at + n, base + y, u); obj.rotation.y = -Math.PI / 2; }
  return obj;
}

function buildDoor(w, o, M, group) {
  const t = w.t;
  const fw = 0.14; // frame width
  const len = o.to - o.from;
  const frameMat = o.glass ? M.alu : M.frame;

  // Frame (jambs + head), in local axis frame: x = along wall, z = normal
  const frame = new THREE.Group();
  frame.add(box(fw, H.doorTop, t + 0.06, frameMat, -len / 2 + fw / 2, H.doorTop / 2, 0));
  frame.add(box(fw, H.doorTop, t + 0.06, frameMat, len / 2 - fw / 2, H.doorTop / 2, 0));
  frame.add(box(len, fw, t + 0.06, frameMat, 0, H.doorTop - fw / 2, 0));
  group.add(place(w, frame, (o.from + o.to) / 2, 0, 0));

  // Leaf, opened 90 degrees on the swing side.
  const L = len - 2 * fw - 0.04;
  const lh = H.doorTop - fw - 0.06;
  const leaf = new THREE.Group();
  const th = 0.13;
  if (o.glass) {
    leaf.add(box(th, lh, 0.16, M.alu, 0, lh / 2, 0.08));
    leaf.add(box(th, lh, 0.16, M.alu, 0, lh / 2, L - 0.08));
    leaf.add(box(th, 0.16, L, M.alu, 0, 0.08, L / 2));
    leaf.add(box(th, 0.16, L, M.alu, 0, lh - 0.08, L / 2));
    leaf.add(box(th, 0.1, L, M.alu, 0, 3, L / 2));
    leaf.add(box(0.04, lh - 0.3, L - 0.3, M.glass, 0, lh / 2, L / 2, { cast: false }));
  } else {
    leaf.add(box(th, lh, L, M.door, 0, lh / 2, L / 2));
    // Raised panels on both faces
    const pm = o.main ? M.darkWood : M.frame;
    for (const s of [-1, 1]) {
      for (const [py, ph] of [[1.7, 2.6], [4.9, 2.6]]) {
        leaf.add(box(0.03, ph, L * 0.32, pm, s * (th / 2 + 0.01), py, L * 0.27));
        leaf.add(box(0.03, ph, L * 0.32, pm, s * (th / 2 + 0.01), py, L * 0.73));
      }
    }
  }
  // Handle
  leaf.add(box(0.28, 0.05, 0.05, M.chrome, 0, 3.3, L - 0.3));
  leaf.add(box(0.05, 0.05, 0.4, M.chrome, 0.14, 3.3, L - 0.42));
  leaf.add(box(0.05, 0.05, 0.4, M.chrome, -0.14, 3.3, L - 0.42));

  const s = o.swing === '+' ? 1 : -1;
  const hingeU = o.hinge === 'start' ? o.from + fw + th / 2 : o.to - fw - th / 2;
  const base = w.level * H.floor;
  // leaf local +z extends away from hinge; orient along wall normal on swing side
  if (w.axis === 'x') {
    leaf.position.set(hingeU, base, w.at + s * (t / 2));
    if (s < 0) leaf.rotation.y = Math.PI;
  } else {
    leaf.position.set(w.at + s * (t / 2), base, hingeU);
    leaf.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  group.add(leaf);

  // Threshold for exterior doors
  if (o.main) group.add(place(w, box(len, 0.06, t + 0.2, M.granite), (o.from + o.to) / 2, 0.03, 0));
}

function buildWindow(w, o, M, group) {
  const t = w.t;
  const len = o.to - o.from;
  const hgt = H.winTop - H.sill;
  const mid = (o.from + o.to) / 2;
  const g = new THREE.Group();
  const fw = 0.16;
  // frame
  g.add(box(len, fw, 0.3, M.alu, 0, fw / 2, 0));
  g.add(box(len, fw, 0.3, M.alu, 0, hgt - fw / 2, 0));
  g.add(box(fw, hgt, 0.3, M.alu, -len / 2 + fw / 2, hgt / 2, 0));
  g.add(box(fw, hgt, 0.3, M.alu, len / 2 - fw / 2, hgt / 2, 0));
  g.add(box(0.08, hgt, 0.3, M.alu, 0, hgt / 2, 0));
  // two sliding glass panes
  g.add(box(len / 2 - 0.1, hgt - 0.3, 0.03, M.glass, -len / 4, hgt / 2, -0.05, { cast: false }));
  g.add(box(len / 2 - 0.1, hgt - 0.3, 0.03, M.glass, len / 4, hgt / 2, 0.05, { cast: false }));
  // grill on the outer side
  // place() rotates z-axis walls so local +z points to world -x.
  const toLocal = (s) => (w.axis === 'x' ? s : -s);
  const outSign = toLocal(w.outside ? (w.outside.startsWith('+') ? 1 : -1) : -1);
  const gz = outSign * (t / 2 - 0.08);
  for (let u = -len / 2 + 0.35; u < len / 2 - 0.2; u += 0.42) {
    g.add(box(0.04, hgt - 0.1, 0.04, M.grill, u, hgt / 2, gz, { receive: false }));
  }
  for (const hy of [0.25, hgt / 2, hgt - 0.25]) g.add(box(len - 0.1, 0.05, 0.03, M.grill, 0, hy, gz));
  // sill (granite), protruding both sides
  g.add(box(len + 0.3, 0.08, t + 0.3, M.granite, 0, -0.04, 0));
  // sunshade (chajja) outside exterior windows
  if (w.outside) {
    g.add(box(len + 1.2, 0.22, 1.6, M.slabEdge, 0, hgt + 0.45, outSign * (t / 2 + 0.8)));
  }
  // curtains on the inner side
  const inSign = w.outside ? -outSign : toLocal(o.curtain === '-' ? -1 : 1);
  if (o.curtain !== 'none') {
    const cz = inSign * (t / 2 + 0.25);
    const cm = w.level === 1 ? M.curtain2 : M.curtain;
    for (const sx of [-1, 1]) {
      const c = mesh(new THREE.PlaneGeometry(1.1, hgt + 1.4, 1, 1), cm, { cast: false });
      c.position.set(sx * (len / 2 + 0.25), hgt / 2 + 0.2, cz);
      g.add(c);
    }
    g.add(cyl(0.04, 0.04, len + 2, M.steel, 0, hgt + 0.9, cz, 8));
    g.children[g.children.length - 1].rotation.z = Math.PI / 2;
  }
  group.add(place(w, g, mid, H.sill, 0));
}

function buildWall(w, M, group, colliders) {
  const h = w.h ?? H.clear;
  const ops = (w.openings || []).slice().sort((a, b) => a.from - b.from);
  const mats = wallMaterials(M, w.outside);
  let cur = w.from;
  const add = (a, b, y0, y1, solid) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return;
    group.add(wallPiece(w, a, b, y0, y1, w.t, mats));
    if (solid) colliders.push(toAABB(w, a, b, w.t));
  };
  for (const o of ops) {
    add(cur, o.from, 0, h, true);
    if (o.type === 'door') {
      add(o.from, o.to, H.doorTop, h, false);
      buildDoor(w, o, M, group);
    } else {
      add(o.from, o.to, 0, H.sill, true);
      add(o.from, o.to, H.winTop, h, false);
      buildWindow(w, o, M, group);
    }
    cur = o.to;
  }
  add(cur, w.to, 0, h, true);
}

function buildRail(r, M, group, colliders) {
  const base = r.level * H.floor + (r.followStair ? stairRamp((r.from + r.to) / 2) : 0);
  const len = r.to - r.from;
  const mid = (r.from + r.to) / 2;
  const g = new THREE.Group();
  if (r.kind === 'parapet') {
    const t = r.t ?? 0.5;
    g.add(box(len, r.h, t, M.wallExt, 0, r.h / 2, 0));
    g.add(box(len + 0.1, 0.15, t + 0.2, M.slabEdge, 0, r.h + 0.075, 0));
  } else {
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) {
      g.add(box(0.12, r.h, 0.12, M.steel, -len / 2 + (i * len) / n, r.h / 2, 0));
    }
    g.add(box(len, 0.14, 0.22, M.darkWood, 0, r.h, 0));
    g.add(box(len, 0.06, 0.06, M.steel, 0, 0.35, 0));
    g.add(box(len - 0.1, r.h - 0.6, 0.04, M.glass, 0, r.h / 2 + 0.1, 0, { cast: false }));
  }
  if (r.axis === 'x') g.position.set(mid, base, r.at);
  else { g.position.set(r.at, base, mid); g.rotation.y = Math.PI / 2; }
  group.add(g);
  const t = 0.25;
  colliders.push(r.axis === 'x'
    ? { x0: r.from, x1: r.to, z0: r.at - t / 2, z1: r.at + t / 2 }
    : { x0: r.at - t / 2, x1: r.at + t / 2, z0: r.from, z1: r.to });
}

function buildStair(M, group) {
  const { x0, x1, z0, z1, risers, rise, going } = STAIR;
  const width = z1 - z0;
  // Structural waist: stepped top, sloped plastered soffit underneath.
  const shape = new THREE.Shape();
  shape.moveTo(x0, 0);
  for (let i = 0; i < risers - 1; i++) {
    shape.lineTo(x0 + i * going, (i + 1) * rise);
    shape.lineTo(x0 + (i + 1) * going, (i + 1) * rise);
  }
  shape.lineTo(x1, stairSoffit(x1));
  shape.lineTo(x0 + (0.5 * (x1 - x0)) / H.clear, 0);
  shape.lineTo(x0, 0);
  const geom = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  const waist = mesh(geom, [M.wallIn, M.wallIn]);
  waist.position.z = z0;
  group.add(waist);

  // Granite treads with nosing + risers
  for (let i = 0; i < risers - 1; i++) {
    const top = (i + 1) * rise;
    group.add(box(going + 0.1, 0.07, width, M.granite, x0 + i * going + going / 2 - 0.05, top + 0.035, z0 + width / 2));
    group.add(box(0.03, rise, width, M.slabEdge, x0 + i * going - 0.02, top - rise / 2, z0 + width / 2));
  }
  // Top riser into the landing
  group.add(box(0.03, H.floor - (risers - 1) * rise, width, M.slabEdge, x1 - 0.02, H.floor - (H.floor - (risers - 1) * rise) / 2, z0 + width / 2));

  // Wall handrail on the toilet-wall side, following the pitch
  const len = Math.hypot(x1 - x0, H.floor);
  const rail = cyl(0.07, 0.07, len, M.darkWood, (x0 + x1) / 2, H.floor / 2 + 3, z1 - 0.35, 10);
  rail.rotation.z = -Math.atan2(x1 - x0, H.floor);
  group.add(rail);
  for (let i = 1; i < 4; i++) {
    const x = x0 + ((x1 - x0) * i) / 4;
    group.add(box(0.05, 0.3, 0.3, M.steel, x, stairRamp(x) + 2.85, z1 - 0.25));
  }

  // Wall between the stair and the toilet: only above the stair soffit, so the toilet continues underneath.
  const tri = new THREE.Shape();
  const xs = 6.5;
  tri.moveTo(xs, stairSoffit(xs));
  tri.lineTo(x1, stairSoffit(x1));
  tri.lineTo(15, stairSoffit(x1));
  tri.lineTo(15, H.clear);
  tri.lineTo(xs, H.clear);
  tri.lineTo(xs, stairSoffit(xs));
  const tg = new THREE.ExtrudeGeometry(tri, { depth: H.inner, bevelEnabled: false });
  const tw = mesh(tg, [M.wallIn, M.wallIn]);
  tw.position.z = 15 - H.inner / 2;
  group.add(tw);
}

function buildFloors(M, groups) {
  for (const r of ROOMS) {
    if (!r.floor || r.noFloor) continue;
    const mat = M[r.floor];
    const base = r.level * H.floor;
    for (const [a, b, c, d] of r.rects) {
      const w = c - a, dd = d - b;
      const g = uvSize(new THREE.PlaneGeometry(w, dd), w, dd, mat.userData.size || 6);
      const m = mesh(g, mat, { cast: false });
      m.rotation.x = -Math.PI / 2;
      m.position.set((a + c) / 2, base + 0.012, (b + d) / 2);
      (r.level === 0 ? groups.ground : groups.first).add(m);
    }
  }
}

function slabBox(x0, z0, x1, z1, yTop, M, opts) {
  const mats = [M.wallExtAccent, M.wallExtAccent, M.slabEdge, M.ceiling, M.wallExtAccent, M.wallExtAccent];
  return boxMM(x0, yTop - H.slab, z0, x1, yTop, z1, mats, opts);
}

function buildSlabs(M, groups) {
  const L = -H.outer / 2, R = 15 + H.outer / 2;
  // Plinth under the ground floor
  groups.ground.add(boxMM(L, -0.6, 0, R, 0, 40 + H.outer / 2, M.slabEdge, { cast: false }));
  // First-floor slab with the stair opening
  const f = groups.first;
  f.add(slabBox(L, -0.3, R, 12, H.floor, M));
  f.add(slabBox(L, 12, STAIR.x0, 15, H.floor, M));
  f.add(slabBox(STAIR.x1, 12, R, 15, H.floor, M));
  f.add(slabBox(L, 15, R, 40 + H.outer / 2, H.floor, M));
  // Roof slab over the first-floor rooms (balcony and terrace stay open)
  const roofTop = 2 * H.floor;
  groups.roof.add(slabBox(L, 1.4, R, 30 + H.outer / 2, roofTop, M));
  // Roof parapet
  const p = 2.5, t = 0.5;
  groups.roof.add(boxMM(L, roofTop, 1.4, R, roofTop + p, 1.4 + t, M.wallExt));
  groups.roof.add(boxMM(L, roofTop, 30 + H.outer / 2 - t, R, roofTop + p, 30 + H.outer / 2, M.wallExt));
  groups.roof.add(boxMM(L, roofTop, 1.4, L + t, roofTop + p, 30 + H.outer / 2, M.wallExt));
  groups.roof.add(boxMM(R - t, roofTop, 1.4, R, roofTop + p, 30 + H.outer / 2, M.wallExt));
  // Accent band on the front elevation (ground porch side piers)
  groups.ground.add(boxMM(L, 0, -0.1, L + 0.9, H.clear, 0.9, M.wallExtAccent));
  groups.ground.add(boxMM(R - 0.9, 0, -0.1, R, H.clear, 0.9, M.wallExtAccent));
}

// Ceramic wall tiles inside the toilet and the kitchen splash area.
function buildCladding(M, group) {
  const tileH = 7;
  const add = (x0, z0, x1, z1, y0, y1, mat) => {
    const g = worldBoxUV(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat.userData.size);
    const m = mesh(g, mat, { cast: false });
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    group.add(m);
  };
  const i = H.inner / 2, o = H.outer / 2, e = 0.03;
  // Toilet (x 6.5..15, z 12..19) - main part z 15..19
  add(15 - o - e, 15 + i, 15 - o, 19 - i, 0, tileH, M.wallTile); // right wall
  add(6.5 + i, 19 - i - e, 15 - o, 19 - i, 0, tileH, M.wallTile); // wall to kitchen
  add(6.5 + i, 15 + i, 6.5 + i + e, 16, 0, tileH, M.wallTile);
  add(6.5 + i, 18.5, 6.5 + i + e, 19 - i, 0, tileH, M.wallTile);
  // Under-stair part (shower) - right wall and front wall up to soffit
  add(15 - o - e, 12 + i, 15 - o, 15 + i, 0, stairSoffit(STAIR.x1), M.wallTile);
  add(11, 12 + i, 15 - o, 12 + i + e, 0, 7.5, M.wallTile);
  // Kitchen splash between counter and wall cabinets
  add(15 - o - e, 19 + i, 15 - o, 27 - i, 2.8, 5, M.kitchenTile);
  add(6.5 + i, 19 + i, 15 - o, 19 + i + e, 2.8, 5, M.kitchenTile);
}

function tree(M, x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.35 * s, 0.5 * s, 7 * s, M.trunk, 0, 3.5 * s, 0, 8));
  const c1 = mesh(new THREE.IcosahedronGeometry(4 * s, 1), M.leaf);
  c1.position.y = 9 * s;
  const c2 = mesh(new THREE.IcosahedronGeometry(3 * s, 1), M.leaf2);
  c2.position.set(1.5 * s, 11 * s, 1 * s);
  g.add(c1, c2);
  g.position.set(x, -0.5, z);
  return g;
}

function buildSurroundings(M, groups) {
  const ex = groups.exterior;
  const ground = mesh(uvSize(new THREE.PlaneGeometry(260, 260), 260, 260, M.grass.userData.size), M.grass, { cast: false });
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(7.5, -0.52, 20);
  ex.add(ground);
  const plane = (x0, z0, x1, z1, y, mat) => {
    const w = x1 - x0, d = z1 - z0;
    const m = mesh(uvSize(new THREE.PlaneGeometry(w, d), w, d, mat.userData.size), mat, { cast: false });
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    ex.add(m);
  };
  plane(-80, -30, 95, -6, -0.5, M.road); // front road
  plane(-80, 46, 95, 62, -0.5, M.road); // back lane
  plane(-80, -6, 95, -0.3, -0.48, M.paving); // front footpath
  plane(-80, 40.4, 95, 46, -0.48, M.paving); // back footpath
  // Road markings
  for (let x = -76; x < 95; x += 8) ex.add(box(4, 0.02, 0.35, M.white, x, -0.48, -18, { cast: false }));
  // Entrance step at the porch and the back door
  ex.add(boxMM(0, -0.5, -1.2, 15, -0.25, -0.3, M.granite));
  ex.add(boxMM(11.8, -0.5, 40.4, 15.2, -0.25, 41.4, M.granite));
  // Trees along the road
  for (const [x, z, s] of [[-14, -4, 1], [26, -4.5, 0.9], [3, -26, 0.8], [40, -27, 1.1], [-30, 48.5, 0.9], [22, 63, 1]]) {
    ex.add(tree(M, x, z, s));
  }
  // Neighbouring row houses (hidden in dollhouse view)
  const nb = groups.neighbors;
  nb.add(boxMM(-26, -0.5, 0, -H.outer / 2 - 0.05, 21, 40, M.neighbor));
  nb.add(boxMM(-26, 9.5, -0.6, -H.outer / 2 - 0.05, 10, 0, M.wallExtAccent));
  nb.add(boxMM(15 + H.outer / 2 + 0.05, -0.5, 0, 40, 18, 40, M.neighbor2));
  nb.add(boxMM(15 + H.outer / 2 + 0.05, 9.5, -0.6, 40, 10, 0, M.slabEdge));
  // Far buildings across the road
  for (const [x, w, h, m] of [[-40, 22, 24, M.neighbor2], [-14, 20, 18, M.neighbor], [10, 18, 28, M.neighbor2], [32, 24, 20, M.neighbor]]) {
    ex.add(boxMM(x, -0.5, -70, x + w, h, -38, m, { cast: false }));
    ex.add(boxMM(x, -0.5, 70, x + w, h * 0.8, 96, m, { cast: false }));
  }
}

export function buildHouse(M) {
  const groups = {
    ground: new THREE.Group(),
    first: new THREE.Group(),
    roof: new THREE.Group(),
    exterior: new THREE.Group(),
    neighbors: new THREE.Group(),
  };
  const colliders = { ground: [], first: [], stair: [] };

  for (const w of WALLS) {
    buildWall(w, M, w.level === 0 ? groups.ground : groups.first, w.level === 0 ? colliders.ground : colliders.first);
  }
  for (const r of RAILS) {
    buildRail(r, M, r.level === 0 ? groups.ground : groups.first, r.level === 0 ? colliders.ground : colliders.first);
  }
  buildStair(M, groups.ground);
  buildFloors(M, groups);
  buildSlabs(M, groups);
  buildCladding(M, groups.ground);
  buildSurroundings(M, groups);

  // Ground: toilet area under the low end of the stair is not walkable (no headroom).
  colliders.ground.push({ x0: 6.5, x1: 12, z0: 12, z1: 15 });
  // While on the stair: walls on both long sides, open at the bottom (passage) and top (lobby).
  colliders.stair.push(
    { x0: -1, x1: 16, z0: 11.5, z1: STAIR.z0 },
    { x0: 15 - H.outer / 2, x1: 16, z0: 11, z1: 16 },
    { x0: STAIR.x0, x1: 12.5, z0: 14.95, z1: 15.3 },
  );
  // Neighbour buildings block walking sideways outside.
  colliders.ground.push({ x0: -30, x1: -H.outer / 2, z0: 0, z1: 40 }, { x0: 15 + H.outer / 2, x1: 45, z0: 0, z1: 40 });

  return { groups, colliders };
}
