// Headless check of walking, collisions and stair climbing: node test-walk.mjs
import * as THREE from 'three';

const listeners = {};
const fakeEl = () => ({
  addEventListener() {}, setPointerCapture() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  querySelector: () => ({ style: {} }), style: {},
});
globalThis.window = { addEventListener: (t, f) => { listeners[t] = f; } };
globalThis.document = { getElementById: () => fakeEl() };

const { buildHouse } = await import('./src/buildWalls.js');
const { WalkControls } = await import('./src/controls.js');

const M = new Proxy({}, { get: () => Object.assign(new THREE.MeshBasicMaterial(), { userData: { size: 4 } }) });
const { colliders } = buildHouse(M);
const cam = new THREE.PerspectiveCamera();
const w = new WalkControls(cam, fakeEl(), colliders);

const press = (code) => listeners.keydown({ code, target: { tagName: 'DIV' }, preventDefault() {} });
const release = (code) => listeners.keyup({ code });
function walk(yaw, seconds, code = 'KeyW') {
  w.yaw = yaw;
  press(code);
  for (let t = 0; t < seconds; t += 1 / 60) w.update(1 / 60);
  release(code);
  for (let t = 0; t < 1; t += 1 / 60) w.update(1 / 60);
}
const facing = { px: -Math.PI / 2, nx: Math.PI / 2, pz: Math.PI, nz: 0 };
const log = (label) => console.log(label.padEnd(34), `mode=${w.mode.padEnd(6)} x=${w.x.toFixed(2)} z=${w.z.toFixed(2)} eyeY=${w.y.toFixed(2)}`);
let fails = 0;
const expect = (cond, msg) => { if (!cond) { fails++; console.log('  FAIL:', msg); } };

// 1. From the road, walk in through the porch and front door into the living room
w.setPose(2, -6, 0, facing.pz, 0);
walk(facing.pz, 2.4);
log('front door -> living');
expect(w.z > 3 && w.z < 12, 'should reach living room through the front door');

// 2. Living -> passage through the back-left door
w.setPose(2, 9, 0, facing.pz, 0);
walk(facing.pz, 1.2);
log('living -> passage');
expect(w.z > 12.5, 'should pass the living-room door into the passage');

// 3. Walls block: walk +x from living into the right wall
w.setPose(8, 9, 0, 0, 0);
walk(facing.px, 3);
log('living wall collision');
expect(w.x < 14.7, 'should stop at the right wall');

// 4. Climb the stair from the passage
w.setPose(3, 13.6, 0, facing.px, 0);
walk(facing.px, 3);
log('climb stair');
expect(w.mode === 'stair' && w.y > 12, 'should be high up on the stair');
walk(facing.pz, 1.5);
log('step off into lobby');
expect(w.mode === 'first' && Math.abs(w.y - 15.2) < 0.2, 'should be on the first floor');

// 5. Railing stops falling into the stair opening from the lobby
w.setPose(8, 17, 1, facing.nz, 0);
walk(facing.nz, 2);
log('lobby railing collision');
expect(w.mode === 'first' && w.z > 15, 'railing should block the stair opening');

// 6. Walk down from the lobby to the passage
w.setPose(13.6, 17, 1, facing.nz, 0);
walk(facing.nz, 1);
log('enter stair from top');
walk(facing.nx, 3);
log('walk down');
expect(w.mode === 'ground' && Math.abs(w.y - 5.2) < 0.2, 'should be back on the ground floor');

// 7. First floor: walk to terrace via side passage
w.setPose(13.5, 18, 1, facing.pz, 0);
walk(facing.pz, 3);
log('lobby -> terrace');
expect(w.z > 31, 'should reach the terrace through the door');
walk(facing.pz, 3);
log('terrace parapet collision');
expect(w.z < 39.7, 'parapet should stop at the back');

// 8. Balcony from bedroom 1 through the balcony door
w.setPose(2.2, 6, 1, facing.nz, 0);
walk(facing.nz, 1.5);
log('bedroom 1 -> balcony');
expect(w.z < 2 && w.z > 0.2, 'should be on the balcony, held by the railing');

// 9. Toilet and kitchen doors from the passage
w.setPose(4, 17.2, 0, facing.px, 0);
walk(facing.px, 1.2);
log('passage -> toilet');
expect(w.x > 7, 'should enter the toilet');
w.setPose(4, 25.3, 0, facing.px, 0);
walk(facing.px, 1.2);
log('passage -> kitchen');
expect(w.x > 7, 'should enter the kitchen');

// 10. Bedroom and back door
w.setPose(2, 28.5, 0, facing.pz, 0);
walk(facing.pz, 1);
log('passage -> bedroom');
expect(w.z > 31, 'should enter the bedroom');
w.setPose(13.5, 28.5, 0, facing.pz, 0);
walk(facing.pz, 3);
log('side passage -> back door -> out');
expect(w.z > 41, 'should exit through the back door');

console.log(fails ? `\n${fails} check(s) failed` : '\nAll walk checks passed');
process.exit(fails ? 1 : 0);
