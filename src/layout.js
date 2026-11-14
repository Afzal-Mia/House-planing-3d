// All dimensions in feet. Plan x = left->right (0..15), plan z = front (road) -> back (0..40).
// Three.js: x = plan x, y = up, z = plan z.

export const PLOT = { w: 15, d: 40 };

export const H = {
  floor: 10, // floor-to-floor height
  slab: 0.5,
  clear: 9.5, // wall height per floor
  doorTop: 7,
  sill: 3,
  winTop: 7,
  outer: 0.75,
  inner: 0.375,
  parapet: 3.5,
  eye: 5.2,
};

// Stair: one straight flight, 3' wide, between the living wall (z=12) and the toilet (z=15).
// Starts at the passage (x=5.5) and rises toward the right outer wall.
export const STAIR = {
  x0: 5.5,
  x1: 14.2, // last riser; 14.2..15 is the first-floor landing (slab)
  z0: 12 + H.inner / 2,
  z1: 15,
  risers: 12,
};
STAIR.rise = H.floor / STAIR.risers;
STAIR.going = (STAIR.x1 - STAIR.x0) / (STAIR.risers - 1);
export const stairRamp = (x) => Math.min(H.floor, Math.max(0, ((x - STAIR.x0) / (STAIR.x1 - STAIR.x0)) * H.floor));
// Underside (soffit) height of the stair at x.
export const stairSoffit = (x) => Math.max(0, (x - STAIR.x0) * (H.clear / (STAIR.x1 - STAIR.x0)) - 0.5);

// Door: hinge 'start' | 'end' along the wall axis; swing '+' | '-' along the wall normal.
const door = (from, to, hinge = 'start', swing = '+', extra = {}) => ({ type: 'door', from, to, hinge, swing, ...extra });
const win = (from, to, extra = {}) => ({ type: 'window', from, to, ...extra });

// Wall: axis 'x' (runs along x at fixed z) or 'z' (runs along z at fixed x).
// outside: which box face is exterior ('+x','-x','+z','-z') for exterior paint.
export const WALLS = [
  // ---------------- Ground floor (level 0) ----------------
  { level: 0, axis: 'z', at: 0, from: 0, to: 40, t: H.outer, outside: '-x' },
  { level: 0, axis: 'z', at: 15, from: 0, to: 40, t: H.outer, outside: '+x' },
  {
    level: 0, axis: 'x', at: 40, from: -H.outer / 2, to: 15 + H.outer / 2, t: H.outer, outside: '+z',
    openings: [win(4, 8), door(12.25, 14.75, 'start', '-', { main: true })],
  },
  {
    level: 0, axis: 'x', at: 2, from: 0, to: 15, t: H.outer, outside: '-z',
    openings: [door(0.5, 3.5, 'start', '+', { main: true }), win(6.5, 11.5)],
  },
  { level: 0, axis: 'x', at: 12, from: 0, to: 15, t: H.inner, openings: [door(0.5, 3.5, 'start', '+')] },
  {
    level: 0, axis: 'z', at: 6.5, from: 15, to: 27, t: H.inner,
    openings: [door(16, 18.5, 'start', '+'), door(24, 26.5, 'end', '+')],
  },
  { level: 0, axis: 'x', at: 19, from: 6.5, to: 15, t: H.inner },
  { level: 0, axis: 'x', at: 27, from: 6.5, to: 15, t: H.inner },
  {
    level: 0, axis: 'x', at: 30, from: 0, to: 12, t: H.inner,
    openings: [door(0.5, 3.5, 'start', '+'), win(6.25, 10.25)],
  },
  { level: 0, axis: 'z', at: 12, from: 30, to: 40, t: H.inner },

  // ---------------- First floor (level 1) ----------------
  { level: 1, axis: 'z', at: 0, from: 2, to: 30, t: H.outer, outside: '-x' },
  { level: 1, axis: 'z', at: 15, from: 2, to: 30, t: H.outer, outside: '+x' },
  {
    level: 1, axis: 'x', at: 2, from: 0, to: 15, t: H.outer, outside: '-z',
    openings: [door(0.75, 3.75, 'start', '+', { glass: true }), win(6.5, 11.5)],
  },
  { level: 1, axis: 'x', at: 12, from: 0, to: 15, t: H.inner, openings: [door(0.5, 3.5, 'start', '-')] },
  { level: 1, axis: 'x', at: 20, from: 0, to: 12, t: H.inner, openings: [door(1, 4, 'start', '+')] },
  { level: 1, axis: 'z', at: 12, from: 20, to: 30, t: H.inner },
  {
    level: 1, axis: 'x', at: 30, from: -H.outer / 2, to: 15 + H.outer / 2, t: H.outer, outside: '+z',
    openings: [win(3, 8), door(12.25, 14.75, 'end', '-', { glass: true })],
  },
];

// Low walls / railings. kind: 'parapet' (solid) | 'railing' (steel + glass)
export const RAILS = [
  // Balcony
  { level: 1, axis: 'x', at: 0.1, from: 0, to: 15, h: 3.5, kind: 'railing' },
  { level: 1, axis: 'z', at: 0, from: 0, to: 2, h: 3.5, kind: 'parapet', t: H.outer },
  { level: 1, axis: 'z', at: 15, from: 0, to: 2, h: 3.5, kind: 'parapet', t: H.outer },
  // Terrace
  { level: 1, axis: 'x', at: 40, from: -H.outer / 2, to: 15 + H.outer / 2, h: 3.5, kind: 'parapet', t: H.outer },
  { level: 1, axis: 'z', at: 0, from: 30, to: 40, h: 3.5, kind: 'parapet', t: H.outer },
  { level: 1, axis: 'z', at: 15, from: 30, to: 40, h: 3.5, kind: 'parapet', t: H.outer },
  // Stair opening guard on first floor (open at x 12.5..14.2 where the stair arrives)
  { level: 1, axis: 'x', at: 15, from: STAIR.x0, to: 12.5, h: 3.2, kind: 'railing' },
  { level: 1, axis: 'z', at: STAIR.x0, from: STAIR.z0, to: 15, h: 3.2, kind: 'railing' },
  // Stair side over the ground passage
  { level: 0, axis: 'x', at: 15, from: STAIR.x0, to: 6.5, h: 3.2, kind: 'railing', followStair: true },
];

// Rooms: rects [x0,z0,x1,z1]; floor material key; view = camera spot + look target.
export const ROOMS = [
  {
    id: 'front', level: 0, en: 'Front View', hi: 'सामने का दृश्य', exterior: true,
    rects: [], view: { pos: [7.5, -16], y: 6, look: [7.5, 9, 8] },
  },
  {
    id: 'porch', level: 0, en: 'Porch', hi: 'बरामदा', floor: 'stone',
    rects: [[0, 0, 15, 2]], view: { pos: [12.5, -5.2], look: [3, 3.4, 2.5] },
  },
  {
    id: 'living', level: 0, en: 'Living Area', hi: 'बैठक कक्ष', floor: 'tile', light: true,
    rects: [[0, 2, 15, 12]], view: { pos: [2, 3.2], look: [11, 3.8, 9] },
  },
  {
    id: 'passage', level: 0, en: 'Passage & Dining', hi: 'गलियारा व भोजन', floor: 'tile', light: true,
    rects: [[0, 12, 6.5, 30], [6.5, 27, 15, 30]], view: { pos: [2.2, 13.2], look: [3.5, 3.6, 26] },
  },
  {
    id: 'stair', level: 0, en: 'Stair (Up & Down)', hi: 'सीढ़ी (ऊपर-नीचे)', noFloor: true,
    rects: [[STAIR.x0, 12, 15, 15]], labelAt: [8.5, 13.6], view: { pos: [2.2, 14.2], look: [14, 8, 13.4] },
  },
  {
    id: 'toilet', level: 0, en: 'Toilet & Bath', hi: 'शौचालय व स्नानघर', floor: 'bathTile', light: true,
    rects: [[6.5, 12, 15, 19]], labelAt: [11, 17.3], view: { pos: [7.6, 18.2], look: [13.5, 3.4, 13.5] },
  },
  {
    id: 'kitchen', level: 0, en: 'Kitchen', hi: 'रसोई', floor: 'tile', light: true,
    rects: [[6.5, 19, 15, 27]], view: { pos: [8.2, 26.1], look: [13.5, 3.0, 20.5] },
  },
  {
    id: 'bedroom', level: 0, en: 'Bedroom', hi: 'शयनकक्ष', floor: 'woodTile', light: true,
    rects: [[0, 30, 12, 40]], view: { pos: [2, 31.2], look: [10, 3.2, 38] },
  },
  {
    id: 'side', level: 0, en: 'Side Passage', hi: 'साइड गलियारा', floor: 'tile',
    rects: [[12, 30, 15, 40]], view: { pos: [13.4, 30.9], look: [13.4, 3.6, 40] },
  },
  {
    id: 'back', level: 0, en: 'Back View', hi: 'पीछे का दृश्य', exterior: true,
    rects: [], view: { pos: [7.5, 56], y: 6, look: [7.5, 9, 32] },
  },

  {
    id: 'balcony', level: 1, en: 'Front Balcony', hi: 'बालकनी', floor: 'stone',
    rects: [[0, 0, 15, 2]], view: { pos: [13.5, 1.1], look: [2, 4, 0] },
  },
  {
    id: 'bed1', level: 1, en: 'Bedroom 1', hi: 'शयनकक्ष 1', floor: 'wood', light: true,
    rects: [[0, 2, 15, 12]], view: { pos: [1.9, 9.3], look: [12, 3.4, 4.5] },
  },
  {
    id: 'lobby', level: 1, en: 'Lobby / Family Sitting', hi: 'लॉबी / पारिवारिक बैठक', floor: 'tile', light: true,
    rects: [[0, 15, 15, 20], [0, 12, STAIR.x0, 15]], view: { pos: [13.8, 16.4], look: [1.5, 3.2, 18] },
  },
  {
    id: 'bed2', level: 1, en: 'Bedroom 2', hi: 'शयनकक्ष 2', floor: 'wood', light: true,
    rects: [[0, 20, 12, 30]], view: { pos: [2.3, 23.0], look: [10, 3.0, 27.5] },
  },
  {
    id: 'side1', level: 1, en: 'Passage to Terrace', hi: 'छत का गलियारा', floor: 'tile',
    rects: [[12, 20, 15, 30]], view: { pos: [13.5, 20.5], look: [13.5, 4, 32] },
  },
  {
    id: 'terrace', level: 1, en: 'Open Terrace', hi: 'खुली छत', floor: 'terracotta',
    rects: [[0, 30, 15, 40]], view: { pos: [13.7, 31.0], look: [3, 2.6, 37.5] },
  },
];

export const TOUR = [
  'front', 'porch', 'living', 'passage', 'stair', 'toilet', 'kitchen', 'bedroom', 'side', 'back',
  'bed1', 'balcony', 'lobby', 'bed2', 'side1', 'terrace',
];

export const UI_TEXT = {
  en: {
    title: "15' x 40' House - 3D Walkthrough",
    ground: 'Ground Floor', first: 'First Floor',
    walk: 'Walk', doll: 'Dollhouse',
    gOnly: 'Ground floor', both: 'Both floors', full: 'Full house',
    tour: 'Guided tour', stop: 'Stop tour',
    lang: 'हिंदी',
    helpDesk: 'Drag to look around  |  W A S D / arrow keys to walk  |  Walk onto the stair to go up or down',
    helpTouch: 'Left joystick to walk  |  Drag to look around',
    helpDoll: 'Drag to rotate  |  Scroll / pinch to zoom  |  Right-drag / two fingers to pan',
    outside: 'Outside',
  },
  hi: {
    title: "15' x 40' मकान - 3D वॉकथ्रू",
    ground: 'भूतल (ग्राउंड फ्लोर)', first: 'पहली मंज़िल',
    walk: 'चलें', doll: 'डॉलहाउस',
    gOnly: 'केवल भूतल', both: 'दोनों मंज़िलें', full: 'पूरा मकान',
    tour: 'गाइडेड टूर', stop: 'टूर रोकें',
    lang: 'English',
    helpDesk: 'देखने के लिए ड्रैग करें  |  चलने के लिए W A S D / तीर कुंजियाँ  |  ऊपर-नीचे जाने के लिए सीढ़ी पर चलें',
    helpTouch: 'चलने के लिए बायाँ जॉयस्टिक  |  देखने के लिए ड्रैग करें',
    helpDoll: 'घुमाने के लिए ड्रैग करें  |  ज़ूम के लिए स्क्रॉल / पिंच करें',
    outside: 'बाहर',
  },
};
