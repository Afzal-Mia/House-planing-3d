import * as THREE from 'three';

let maxAniso = 4;
export const setAnisotropy = (n) => { maxAniso = n; };

function canvasTex(size, draw, { repeat = true, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}

// Small deterministic RNG so textures look the same every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function noise(g, size, alpha, seed = 1, dot = 1) {
  const r = rng(seed);
  for (let i = 0; i < size * size * 0.08; i++) {
    const v = Math.floor(r() * 255);
    g.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    g.fillRect(r() * size, r() * size, dot, dot);
  }
}

// Tiles: one texture covers `n x n` tiles.
function tiles(base, grout, n, vary, seed, marble = false) {
  return canvasTex(512, (g, s) => {
    const r = rng(seed);
    const step = s / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const c = new THREE.Color(base);
        c.offsetHSL(0, 0, (r() - 0.5) * vary);
        g.fillStyle = `#${c.getHexString()}`;
        g.fillRect(i * step, j * step, step, step);
        if (marble) {
          g.strokeStyle = 'rgba(120,110,100,0.18)';
          g.lineWidth = 1.2;
          for (let k = 0; k < 3; k++) {
            g.beginPath();
            let x = i * step + r() * step, y = j * step;
            g.moveTo(x, y);
            for (let q = 0; q < 6; q++) { x += (r() - 0.5) * step * 0.4; y += step / 6; g.lineTo(x, y); }
            g.stroke();
          }
        }
      }
    }
    noise(g, s, 0.05, seed + 7);
    g.strokeStyle = grout;
    g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, s); g.stroke();
      g.beginPath(); g.moveTo(0, i * step); g.lineTo(s, i * step); g.stroke();
    }
  });
}

function planks(base, n, seed, dark = 0.12) {
  return canvasTex(512, (g, s) => {
    const r = rng(seed);
    const h = s / n;
    for (let j = 0; j < n; j++) {
      const off = r() * s;
      for (let k = -1; k < 2; k++) {
        const c = new THREE.Color(base);
        c.offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * dark);
        g.fillStyle = `#${c.getHexString()}`;
        g.fillRect(off + k * s * 0.7, j * h, s * 0.7, h);
        g.fillStyle = 'rgba(40,20,10,0.5)';
        g.fillRect(off + k * s * 0.7, j * h, 2, h);
      }
      g.strokeStyle = 'rgba(60,35,15,0.12)';
      for (let q = 0; q < 6; q++) {
        g.beginPath();
        const y = j * h + r() * h;
        g.moveTo(0, y);
        g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 6, s * 0.6, y + (r() - 0.5) * 6, s, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(30,15,5,0.55)';
      g.fillRect(0, j * h, s, 2);
    }
  });
}

function speckle(base, colors, seed, count = 9000, size = 2.2) {
  return canvasTex(512, (g, s) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < count; i++) {
      g.fillStyle = colors[Math.floor(r() * colors.length)];
      const d = r() * size + 0.5;
      g.fillRect(r() * s, r() * s, d, d);
    }
  });
}

function solidNoise(base, alpha, seed) {
  return canvasTex(256, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    noise(g, s, alpha, seed, 2);
  });
}

function grassTex() {
  return canvasTex(512, (g, s) => {
    const r = rng(42);
    g.fillStyle = '#5f7f3a';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26000; i++) {
      const c = new THREE.Color().setHSL(0.22 + r() * 0.06, 0.45, 0.25 + r() * 0.2);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(r() * s, r() * s, 1.5, 3);
    }
  });
}

function asphaltTex() {
  return speckle('#4a4b4d', ['#3a3b3d', '#5d5e60', '#6b6b6b', '#333'], 9, 30000, 1.6);
}

function skyTex() {
  return canvasTex(512, (g, s) => {
    const grd = g.createLinearGradient(0, 0, 0, s);
    grd.addColorStop(0, '#4f86c6');
    grd.addColorStop(0.5, '#9cc3e6');
    grd.addColorStop(1, '#e6eef2');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  }, { repeat: false });
}

function curtainTex(color) {
  return canvasTex(256, (g, s) => {
    for (let x = 0; x < s; x++) {
      const v = 0.82 + 0.18 * Math.sin(x / 7);
      const c = new THREE.Color(color).multiplyScalar(v);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(x, 0, 1, s);
    }
  });
}

function artTex(seed) {
  return canvasTex(256, (g, s) => {
    const r = rng(seed);
    const grd = g.createLinearGradient(0, 0, s, s);
    grd.addColorStop(0, '#f0d9a8');
    grd.addColorStop(1, '#c97b4a');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = `hsla(${Math.floor(r() * 360)},45%,${35 + r() * 30}%,0.75)`;
      g.beginPath();
      g.arc(r() * s, r() * s, 20 + r() * 60, 0, Math.PI * 2);
      g.fill();
    }
  }, { repeat: false });
}

function tvScreenTex() {
  return canvasTex(256, (g, s) => {
    const grd = g.createLinearGradient(0, 0, s, s * 0.6);
    grd.addColorStop(0, '#1d3b5c');
    grd.addColorStop(0.6, '#3b7bb0');
    grd.addColorStop(1, '#f2b766');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(30,60,30,0.85)';
    g.beginPath();
    g.moveTo(0, s * 0.75);
    g.quadraticCurveTo(s * 0.3, s * 0.45, s * 0.6, s * 0.7);
    g.quadraticCurveTo(s * 0.8, s * 0.55, s, s * 0.68);
    g.lineTo(s, s);
    g.lineTo(0, s);
    g.fill();
  }, { repeat: false });
}

const std = (o) => new THREE.MeshStandardMaterial(o);

export function createMaterials() {
  const M = {};
  // Floors (texture covers the given world size via UV scaling, see uvSize)
  M.tile = std({ map: tiles('#e9e2d4', '#c9c0ae', 4, 0.05, 3, true), roughness: 0.35 });
  M.tile.userData.size = 8; // 4 tiles of 2' each
  M.woodTile = std({ map: planks('#a57449', 6, 11), roughness: 0.55 });
  M.woodTile.userData.size = 6;
  M.wood = std({ map: planks('#b8875a', 8, 5), roughness: 0.5 });
  M.wood.userData.size = 5;
  M.bathTile = std({ map: tiles('#9fb3b8', '#7b8d91', 8, 0.06, 13), roughness: 0.6 });
  M.bathTile.userData.size = 8;
  M.stone = std({ map: speckle('#b9a58c', ['#a48f74', '#cbb89f', '#8f7b62'], 21), roughness: 0.7 });
  M.stone.userData.size = 4;
  M.terracotta = std({ map: tiles('#b56a45', '#8b5036', 6, 0.08, 17), roughness: 0.8 });
  M.terracotta.userData.size = 6;

  // Walls
  M.wallIn = std({ color: '#f1ebdf', roughness: 0.92 });
  M.wallExt = std({ map: solidNoise('#e7c9a0', 0.06, 2), roughness: 0.95 });
  M.wallExtAccent = std({ map: solidNoise('#9a5a3c', 0.06, 4), roughness: 0.95 });
  M.ceiling = std({ color: '#fbfaf6', roughness: 0.95 });
  M.slabEdge = std({ color: '#d9d2c4', roughness: 0.9 });
  M.wallTile = std({ map: tiles('#e8eef0', '#c3cdd1', 6, 0.03, 31), roughness: 0.25 });
  M.wallTile.userData.size = 4;
  M.kitchenTile = std({ map: tiles('#f3efe6', '#cbbfa8', 8, 0.03, 37), roughness: 0.25 });
  M.kitchenTile.userData.size = 4;

  // Woods / furniture
  M.door = std({ map: planks('#7a4a2a', 3, 51, 0.06), roughness: 0.5 });
  M.frame = std({ color: '#5a3820', roughness: 0.55 });
  M.furnitureWood = std({ map: planks('#8a5a36', 4, 61, 0.08), roughness: 0.55 });
  M.lightWood = std({ map: planks('#c99d6b', 4, 71, 0.06), roughness: 0.55 });
  M.darkWood = std({ map: planks('#4a2e1c', 4, 81, 0.06), roughness: 0.5 });
  M.laminate = std({ color: '#efe8dc', roughness: 0.4 });
  M.wardrobe = std({ color: '#d9c6a5', roughness: 0.45 });

  // Fabrics
  M.sofa = std({ map: solidNoise('#55606e', 0.1, 91), roughness: 0.95 });
  M.cushion = std({ map: solidNoise('#d98c3a', 0.1, 92), roughness: 0.95 });
  M.cushion2 = std({ map: solidNoise('#e6dccb', 0.1, 93), roughness: 0.95 });
  M.bedsheet = std({ map: solidNoise('#f4efe6', 0.06, 94), roughness: 0.95 });
  M.blanket = std({ map: solidNoise('#7d3c4b', 0.1, 95), roughness: 0.95 });
  M.blanket2 = std({ map: solidNoise('#3f6d74', 0.1, 96), roughness: 0.95 });
  M.blanket3 = std({ map: solidNoise('#8a7d3b', 0.1, 97), roughness: 0.95 });
  M.rug = std({ map: speckle('#8c3b2e', ['#a85a3c', '#6e2a22', '#c79a5a'], 98, 12000, 3), roughness: 1 });
  M.curtain = std({ map: curtainTex('#c9b18a'), roughness: 1, side: THREE.DoubleSide });
  M.curtain2 = std({ map: curtainTex('#8fa3a8'), roughness: 1, side: THREE.DoubleSide });

  // Hard surfaces
  M.granite = std({ map: speckle('#2b2b2e', ['#4a4a50', '#151515', '#6c6058', '#3a3236'], 101), roughness: 0.18, metalness: 0.1 });
  M.steel = std({ color: '#c8ccd0', roughness: 0.25, metalness: 0.9 });
  M.blackSteel = std({ color: '#2a2c2e', roughness: 0.4, metalness: 0.6 });
  M.chrome = std({ color: '#e8eaec', roughness: 0.1, metalness: 1 });
  M.ceramic = std({ color: '#fbfbfa', roughness: 0.15 });
  M.black = std({ color: '#141516', roughness: 0.4 });
  M.white = std({ color: '#f5f5f2', roughness: 0.5 });
  M.cabinet = std({ color: '#7d2f2a', roughness: 0.35 });
  M.cabinet2 = std({ color: '#efe6d6', roughness: 0.35 });
  M.fridge = std({ color: '#b9bec4', roughness: 0.3, metalness: 0.6 });
  M.glass = std({ color: '#b9d6e6', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
  M.mirror = std({ color: '#dfe8ee', roughness: 0.02, metalness: 1 });
  M.grill = std({ color: '#2f3336', roughness: 0.5, metalness: 0.5 });
  M.alu = std({ color: '#d6d3cc', roughness: 0.4, metalness: 0.5 });
  M.tank = std({ color: '#1f2224', roughness: 0.6 });
  M.pot = std({ color: '#a75434', roughness: 0.85 });
  M.soil = std({ color: '#3d2a1c', roughness: 1 });
  M.leaf = std({ color: '#3f7a35', roughness: 0.8 });
  M.leaf2 = std({ color: '#5d9440', roughness: 0.8 });
  M.trunk = std({ color: '#5a4030', roughness: 0.9 });
  M.lampShade = std({ color: '#fff3d6', emissive: '#ffdc9a', emissiveIntensity: 0.6, roughness: 0.8 });
  M.bulb = std({ color: '#ffffff', emissive: '#fff1d0', emissiveIntensity: 2.2 });
  M.tv = std({ map: tvScreenTex(), emissive: '#ffffff', emissiveMap: null, roughness: 0.2 });
  M.tv.emissiveMap = M.tv.map;
  M.tv.emissiveIntensity = 0.55;
  M.art1 = std({ map: artTex(5), roughness: 0.6 });
  M.art2 = std({ map: artTex(9), roughness: 0.6 });
  M.art3 = std({ map: artTex(14), roughness: 0.6 });
  M.book = [std({ color: '#8b2e2e' }), std({ color: '#2e4f8b' }), std({ color: '#d6a63a' }), std({ color: '#2f6b45' })];

  // Exterior
  M.grass = std({ map: grassTex(), roughness: 1 });
  M.grass.userData.size = 12;
  M.road = std({ map: asphaltTex(), roughness: 0.95 });
  M.road.userData.size = 10;
  M.paving = std({ map: tiles('#9c9488', '#7a7368', 3, 0.08, 111), roughness: 0.9 });
  M.paving.userData.size = 4;
  M.neighbor = std({ map: solidNoise('#d8d2c4', 0.05, 121), roughness: 0.95 });
  M.neighbor2 = std({ map: solidNoise('#c9b9a0', 0.05, 122), roughness: 0.95 });
  M.sky = skyTex();
  return M;
}

// Scale a geometry's UVs so a texture repeats every `size` feet.
export function uvSize(geom, w, h, size) {
  const uv = geom.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / size), uv.getY(i) * (h / size));
  uv.needsUpdate = true;
  return geom;
}

// Box with world-scaled UVs on each face pair (for tiled surfaces).
export function worldBoxUV(geom, size) {
  const pos = geom.attributes.position;
  const nrm = geom.attributes.normal;
  const uv = geom.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (nx > 0.5) uv.setXY(i, z / size, y / size);
    else if (ny > 0.5) uv.setXY(i, x / size, z / size);
    else uv.setXY(i, x / size, y / size);
  }
  uv.needsUpdate = true;
  return geom;
}
