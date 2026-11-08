// Picture-book art for the library and the cinema: soft pastel backgrounds, a cast of animal friends
// and kid dolls, and little props. A picture is 1000 x 600 and feet stand near y = 520. With
// `animate` (cinema) things gently bob, drift and twinkle; book pages stay still.
import { baseLook, wornOf } from '../data/looks';
import type { CastMember, Story, StoryPage, StoryProp } from '../data/stories';
import type { Look } from '../types';
import { body, type Body } from './body';
import { dark, light, luma } from './color';
import { dollHeight, renderDoll } from './doll';
import { bowG, flowerG, heartD, sparkleD, starD } from './wear';

// ---------------------------------------------------------------- tiny SVG helpers
const num = (n: number) => (Number.isFinite(n) ? n : 0);
const f = (n: number) => num(n).toFixed(1);
const f2 = (n: number) => num(n).toFixed(2);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.max(0, w))}" height="${f(Math.max(0, h))}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0, r))}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(Math.max(0, rx))}" ry="${f(Math.max(0, ry))}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const SK = (c: string, w: number, extra = '') => `fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
const LN = (x1: number, y1: number, x2: number, y2: number, c: string, w: number, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" ${extra}/>`;
const G = (t: string, inner: string, extra = '') => `<g transform="${t}" ${extra}>${inner}</g>`;
const at = (x: number, y: number, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${s !== 1 ? ` scale(${f2(s)})` : ''}${r ? ` rotate(${f(r)})` : ''}`;
const op = (o: number) => `opacity="${f2(o)}"`;
const T = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, num(v)));
/** Repeatable pseudo-random numbers, so a page always looks the same. */
const rnd = (i: number) => {
  const v = Math.sin(i * 91.7 + 13.3) * 43758.5453;
  return v - Math.floor(v);
};
let uidN = 0;
const uid = (p: string) => `sa-${p}${++uidN}`;
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- gentle motion (SMIL)
const EASE = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"';
const rep = (dur: number, begin = 0) => `dur="${f2(dur)}s" begin="${f2(-Math.abs(begin))}s" repeatCount="indefinite"`;
const aMove = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)};0 0" ${EASE} ${rep(dur, begin)}/>`;
const aTurn = (deg: number, cx: number, cy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${f(-deg)} ${f(cx)} ${f(cy)};${f(deg)} ${f(cx)} ${f(cy)};${f(-deg)} ${f(cx)} ${f(cy)}" ${EASE} ${rep(dur, begin)}/>`;
const aSpin = (dur: number, rev = false) =>
  `<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="${rev ? -360 : 360} 0 0" ${rep(dur)}/>`;
const aFade = (lo: number, dur: number, begin = 0) => `<animate attributeName="opacity" values="1;${f2(lo)};1" ${EASE} ${rep(dur, begin)}/>`;
const aScale = (sx: number, sy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="scale" values="1 1;${f2(sx)} ${f2(sy)};1 1" ${EASE} ${rep(dur, begin)}/>`;
const aRise = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)}" ${rep(dur, begin)}/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.7;1" ${rep(dur, begin)}/>`;
/** Wraps art in a group that carries an animation, only when animating. */
const mv = (A: boolean, inner: string, anim: string) => (A ? `<g>${inner}${anim}</g>` : inner);

// ---------------------------------------------------------------- background pieces
function skyG(top: string, bot: string, mid?: string): string {
  const id = uid('sky');
  const stops = mid
    ? `<stop offset="0" stop-color="${top}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/>`
    : `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/>`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>${R(-10, -10, 1020, 620, 0, `url(#${id})`)}`;
}
function cloudG(x: number, y: number, s: number, A: boolean, i = 0, c = '#ffffff'): string {
  const b = G(at(x, y, s), `${C(-36, 0, 26, c)}${C(-4, -18, 36, c)}${C(34, -4, 26, c)}${R(-62, -6, 124, 32, 16, c)}${E(0, 24, 54, 5, '#dfe8f6', op(0.5))}`);
  return mv(A, b, aMove(26 + i * 10, 0, 14 + i * 5, i * 4));
}
function sunG(x: number, y: number, r: number, A: boolean, c = '#ffe680'): string {
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rays += LN(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12), Math.cos(a) * (r + 26), Math.sin(a) * (r + 26), c, 7);
  }
  return G(at(x, y), C(0, 0, r * 1.9, c, op(0.22)) + mv(A, `<g>${rays}</g>`, aSpin(60)) + C(0, 0, r, c) + C(-r * 0.3, -r * 0.3, r * 0.32, '#fff', op(0.45)));
}
function hillP(y: number, amp: number, c: string, ph = 0): string {
  let d = '';
  for (let x = -20; x <= 1020; x += 20) {
    const yy = y - amp * (0.5 + 0.35 * Math.sin((x + ph) / 150) + 0.15 * Math.sin((x * 1.7 + ph) / 70));
    d += `${d ? 'L' : 'M'}${f(x)} ${f(yy)}`;
  }
  return P(`${d}L1020 620L-20 620Z`, c);
}
function groundP(top: number, c: string, hi?: string): string {
  const d = `M-20 ${f(top)} Q250 ${f(top - 14)} 500 ${f(top)} Q750 ${f(top + 14)} 1020 ${f(top - 6)} L1020 620 L-20 620Z`;
  return P(d, c) + (hi ? P(`M-20 ${f(top)} Q250 ${f(top - 14)} 500 ${f(top)} Q750 ${f(top + 14)} 1020 ${f(top - 6)} L1020 ${f(top + 16)} Q750 ${f(top + 30)} 500 ${f(top + 16)} Q250 ${f(top + 2)} -20 ${f(top + 16)}Z`, hi, op(0.7)) : '');
}
function treeG(x: number, y: number, s: number, c: string, A: boolean, i = 0, fruit = ''): string {
  let t = R(-12, -96, 24, 98, 10, '#b98257') + LN(0, -70, -26, -106, '#b98257', 9);
  t += C(-38, -118, 40, dark(c, 0.07)) + C(38, -124, 42, dark(c, 0.07)) + C(0, -162, 52, c) + C(-30, -130, 36, c) + C(30, -134, 36, c);
  t += C(-18, -180, 20, light(c, 0.3), op(0.7));
  if (fruit) for (let k = 0; k < 5; k++) t += C(-44 + rnd(i * 7 + k) * 88, -170 + rnd(i * 3 + k * 5) * 70, 7, fruit);
  return G(at(x, y, s), mv(A, t, aTurn(1.2, 0, 0, 5 + i, i)));
}
function pineG(x: number, y: number, s: number, c: string, snow = false): string {
  let t = R(-9, -30, 18, 32, 4, '#9a6a48');
  for (let k = 0; k < 3; k++) {
    const yy = -22 - k * 44;
    const w = 62 - k * 14;
    t += P(`M${-w} ${yy} Q0 ${yy - 14} ${w} ${yy} L0 ${yy - 74}Z`, k % 2 ? dark(c, 0.06) : c);
    if (snow) t += P(`M${f(-w * 0.45)} ${f(yy - 40)} L0 ${f(yy - 74)} L${f(w * 0.45)} ${f(yy - 40)} Q${f(w * 0.2)} ${f(yy - 32)} 0 ${f(yy - 40)} Q${f(-w * 0.2)} ${f(yy - 32)} ${f(-w * 0.45)} ${f(yy - 40)}Z`, '#fff');
  }
  return G(at(x, y, s), t);
}
const bushG = (x: number, y: number, s: number, c: string) =>
  G(at(x, y, s), C(-30, -18, 26, dark(c, 0.06)) + C(28, -18, 26, dark(c, 0.06)) + C(0, -30, 32, c) + C(-10, -40, 10, light(c, 0.3), op(0.6)));
function flowersScatter(n: number, y0: number, y1: number, seed: number, cols = ['#ff8fc5', '#ffd36b', '#c99bff', '#ffffff', '#7cc8ff']): string {
  let s = '';
  for (let k = 0; k < n; k++) {
    const x = 20 + rnd(seed + k * 3) * 960;
    const y = y0 + rnd(seed + k * 7) * (y1 - y0);
    s += P(`M${f(x)} ${f(y + 10)} q-6 -4 -9 2`, 'none', SK('#5fae5a', 2.5)) + flowerG(x, y, 7 + rnd(seed + k) * 4, cols[k % cols.length]);
  }
  return s;
}
function grassTufts(n: number, y0: number, y1: number, seed: number, c: string): string {
  let s = '';
  for (let k = 0; k < n; k++) {
    const x = rnd(seed + k * 11) * 1000;
    const y = y0 + rnd(seed + k * 13) * (y1 - y0);
    s += P(`M${f(x - 8)} ${f(y)} q4 -14 6 -16 M${f(x)} ${f(y)} q0 -16 2 -20 M${f(x + 8)} ${f(y)} q-2 -12 -6 -15`, 'none', SK(c, 3));
  }
  return s;
}
function starsField(n: number, y1: number, seed: number, A: boolean): string {
  let s = '';
  for (let k = 0; k < n; k++) {
    const x = rnd(seed + k * 5) * 1000;
    const y = rnd(seed + k * 9) * y1;
    const r = 1.5 + rnd(seed + k) * 2.5;
    const st = k % 5 === 0 ? P(sparkleD(x, y, r * 3), '#fff8d6') : C(x, y, r, '#fff8e6');
    s += mv(A, st, aFade(0.25, 1.6 + rnd(k) * 2.4, rnd(k * 3) * 3));
  }
  return s;
}
/** A soft round glow that fades out at the edge. */
function glowG(x: number, y: number, r: number, c: string, o = 0.5): string {
  const id = uid('glow');
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${f2(o)}"/><stop offset="0.5" stop-color="${c}" stop-opacity="${f2(o * 0.45)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>${C(x, y, r, `url(#${id})`)}`;
}
function moonG(x: number, y: number, r: number): string {
  return glowG(x, y, r * 2.8, '#fff6c8', 0.45) +
    P(`M${f(x)} ${f(y - r)} A${f(r)} ${f(r)} 0 1 0 ${f(x)} ${f(y + r)} A${f(r * 0.72)} ${f(r)} 0 1 1 ${f(x)} ${f(y - r)}Z`, '#fff4c2') +
    C(x - r * 0.45, y + r * 0.1, r * 0.08, '#f2d98a') + P(`M${f(x - r * 0.6)} ${f(y + r * 0.35)} q${f(r * 0.15)} ${f(r * 0.15)} ${f(r * 0.3)} 0`, 'none', SK('#e0bf6a', 2.5));
}
function windowG(x: number, y: number, w: number, h: number, night: boolean, curtain: string, A: boolean, snowy = false): string {
  let s = R(x - 10, y - 10, w + 20, h + 20, 14, '#ffffff');
  const id = uid('win');
  s += `<defs><clipPath id="${id}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="8"/></clipPath></defs>`;
  let view = R(x, y, w, h, 8, night ? '#2e3578' : '#9edcff');
  if (night) {
    view += moonG(x + w * 0.7, y + h * 0.3, 18);
    for (let k = 0; k < 7; k++) view += mv(A, C(x + rnd(k + x) * w, y + rnd(k * 3 + y) * h * 0.8, 2, '#fff8e6'), aFade(0.3, 2 + k * 0.3, k));
  } else {
    view += cloudG(x + w * 0.3, y + h * 0.35, 0.45, A, 1) + cloudG(x + w * 0.8, y + h * 0.6, 0.3, A, 2);
    view += hillP(y + h * 0.95, 30, snowy ? '#f6f9ff' : '#a6e08c', x);
  }
  s += `<g clip-path="url(#${id})">${view}</g>`;
  s += R(x + w / 2 - 4, y, 8, h, 0, '#ffffff') + R(x, y + h / 2 - 4, w, 8, 0, '#ffffff');
  s += P(`M${f(x - 24)} ${f(y - 18)} L${f(x + w * 0.24)} ${f(y - 18)} Q${f(x + w * 0.12)} ${f(y + h * 0.5)} ${f(x + w * 0.2)} ${f(y + h + 20)} L${f(x - 24)} ${f(y + h + 20)}Z`, curtain);
  s += P(`M${f(x + w + 24)} ${f(y - 18)} L${f(x + w * 0.76)} ${f(y - 18)} Q${f(x + w * 0.88)} ${f(y + h * 0.5)} ${f(x + w * 0.8)} ${f(y + h + 20)} L${f(x + w + 24)} ${f(y + h + 20)}Z`, curtain);
  s += R(x - 30, y - 24, w + 60, 10, 5, dark(curtain, 0.2));
  return s;
}
function floorBoards(top: number, c: string): string {
  let s = R(-10, top, 1020, 620 - top, 0, c);
  for (let k = 1; k < 6; k++) s += LN(-10, top + k * ((600 - top) / 5.5), 1010, top + k * ((600 - top) / 5.5), dark(c, 0.1), 2);
  for (let k = 0; k < 12; k++) {
    const row = k % 5;
    const yy = top + row * ((600 - top) / 5.5);
    const xx = rnd(k * 17) * 1000;
    s += LN(xx, yy, xx, yy + (600 - top) / 5.5, dark(c, 0.1), 2);
  }
  return s + R(-10, top - 8, 1020, 12, 0, '#ffffff', op(0.85));
}
function wallDots(c: string, dot: string): string {
  let s = R(-10, -10, 1020, 620, 0, c);
  for (let yy = 30; yy < 460; yy += 56) for (let xx = (yy / 56) % 2 ? 28 : 0; xx < 1020; xx += 56) s += C(xx, yy, 5, dot, op(0.6));
  return s;
}
function bunting(y: number, cols: string[], A: boolean): string {
  let s = P(`M-10 ${f(y)} Q500 ${f(y + 50)} 1010 ${f(y)}`, 'none', SK('#b98a9a', 2.5));
  for (let k = 0; k < 14; k++) {
    const x = 20 + k * 70;
    const t = x / 1000;
    const yy = y + 50 * 2 * t * (1 - t) * 1.0 - 4;
    s += mv(A, P(`M${f(x - 16)} ${f(yy)} L${f(x + 16)} ${f(yy)} L${f(x)} ${f(yy + 30)}Z`, cols[k % cols.length]), aTurn(4, x, yy, 2.6 + (k % 3) * 0.4, k * 0.3));
  }
  return s;
}
function shelfBooks(x: number, y: number, w: number, seed: number): string {
  const cols = ['#ff8fb1', '#7cc8ff', '#ffd36b', '#9be07f', '#c99bff', '#ff9a6b', '#5fd3b5', '#f4f4f8'];
  let s = '';
  let xx = x;
  let k = 0;
  while (xx < x + w - 12) {
    const bw = 12 + rnd(seed + k) * 12;
    const bh = 40 + rnd(seed + k * 3) * 26;
    if (rnd(seed + k * 7) < 0.08) {
      xx += 10;
      k++;
      continue;
    }
    const c = cols[Math.floor(rnd(seed + k * 5) * cols.length) % cols.length];
    s += R(xx, y - bh, bw - 2, bh, 3, c) + R(xx + 2, y - bh + 8, bw - 6, 4, 2, '#ffffff', op(0.55));
    xx += bw;
    k++;
  }
  return s;
}

// ---------------------------------------------------------------- backgrounds
type BgFn = (A: boolean, night: boolean) => string;

const meadow: BgFn = (A) =>
  skyG('#8fd3ff', '#eaf8ff') + sunG(850, 100, 46, A) + cloudG(200, 110, 0.9, A, 0) + cloudG(560, 70, 0.65, A, 1) + cloudG(980, 190, 0.5, A, 2) +
  hillP(380, 70, '#c6eda8', 40) + hillP(420, 44, '#a9e08e', 300) + treeG(105, 448, 0.95, '#86d67a', A, 0) + treeG(905, 440, 1.1, '#78c96e', A, 1, '#ff7b7b') +
  groundP(445, '#9be07f', '#b4ea96') + grassTufts(18, 470, 595, 5, '#7cc96c') + flowersScatter(16, 470, 590, 9) +
  (A ? butterfliesG() : '');

function butterfliesG(): string {
  const cols = ['#ff7eb6', '#ffd36b', '#c99bff'];
  let s = '';
  for (let i = 0; i < 3; i++) {
    const cx = 160 + i * 330;
    const cy = 380 + (i % 2) * 60;
    const c = cols[i];
    const path = `M${cx} ${cy} C${cx + 90} ${cy - 90} ${cx + 160} ${cy + 40} ${cx + 60} ${cy + 30} S${cx - 100} ${cy - 70} ${cx} ${cy}`;
    const wings = `<g><animateTransform attributeName="transform" type="scale" values="1 1;0.25 1;1 1" dur="0.35s" repeatCount="indefinite"/>${P('M0 0 C-10 -16 -22 -10 -16 0 C-12 6 -4 4 0 0Z M0 0 C10 -16 22 -10 16 0 C12 6 4 4 0 0Z', c)}${P('M0 1 C-8 6 -12 14 -6 14 C-2 14 0 8 0 1Z M0 1 C8 6 12 14 6 14 C2 14 0 8 0 1Z', dark(c, 0.15))}</g>`;
    s += `<g><animateMotion path="${path}" dur="${9 + i * 2}s" begin="${-i * 2}s" repeatCount="indefinite"/>${wings}${R(-1.5, -6, 3, 16, 1.5, '#4a3f5e')}</g>`;
  }
  return s;
}

const forest: BgFn = (A) => {
  let s = skyG('#cdeedd', '#f6fff0');
  for (let k = 0; k < 4; k++) s += P(`M${200 + k * 220} -10 L${260 + k * 220} -10 L${180 + k * 220} 470 L${100 + k * 220} 470Z`, '#ffffff', op(0.22));
  for (let k = 0; k < 9; k++) s += G(at(-30 + k * 130, 450, 1), E(0, -150, 60, 130, '#c3e6c3') + R(-8, -40, 16, 40, 4, '#c9b39a'));
  for (let k = 0; k < 7; k++) s += treeG(30 + k * 160 + rnd(k) * 40, 455, 1.05 + rnd(k * 3) * 0.3, k % 2 ? '#8fcf8e' : '#9fd8a0', A, k);
  s += groundP(455, '#93d38a', '#a9df9c');
  s += G(at(-10, 470), R(-30, -470, 80, 480, 20, '#a8714d') + C(40, -470, 140, '#6fbf72') + C(-40, -380, 100, '#7fca7e'));
  s += G(at(1010, 470), R(-50, -470, 80, 480, 20, '#a8714d') + C(-40, -470, 140, '#6fbf72') + C(40, -380, 100, '#7fca7e'));
  const shroom = (x: number, y: number, s2: number) =>
    G(at(x, y, s2), R(-8, -24, 16, 24, 6, '#fff3e0') + P('M-26 -20 Q-26 -50 0 -50 Q26 -50 26 -20Z', '#ff7a7a') + C(-10, -36, 4, '#fff') + C(8, -40, 5, '#fff') + C(14, -26, 3, '#fff'));
  s += shroom(190, 548, 1) + shroom(222, 556, 0.7) + shroom(820, 566, 1.1);
  s += grassTufts(20, 480, 595, 3, '#76c070') + flowersScatter(8, 490, 590, 21, ['#ffffff', '#ffd36b', '#c99bff']);
  if (A) for (let k = 0; k < 5; k++) s += mv(true, G(at(150 + k * 180, 60), P('M0 0 q10 -8 18 0 q-8 10 -18 0Z', k % 2 ? '#ffc23d' : '#9fd86a')), aRise(40, 420, 9 + k, k * 2));
  return s;
};

const beach: BgFn = (A) => {
  const id = uid('sea');
  let s = skyG('#7fd0ff', '#e6f7ff') + sunG(840, 95, 44, A) + cloudG(250, 90, 0.8, A, 0) + cloudG(600, 140, 0.55, A, 1);
  s += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fc3e8"/><stop offset="1" stop-color="#a6eaf3"/></linearGradient></defs>`;
  s += R(-10, 290, 1020, 140, 0, `url(#${id})`);
  s += G(at(180, 300), P('M-26 0 L26 0 L18 10 L-18 10Z', '#ff8fa3') + P('M0 -2 L0 -40 L22 -6Z', '#ffffff') + LN(0, 0, 0, -44, '#8a6a4a', 2));
  for (let k = 0; k < 3; k++) s += mv(A, P(`M-20 ${330 + k * 26} q30 -10 60 0 t60 0 t60 0 M400 ${340 + k * 24} q30 -10 60 0 t60 0 M760 ${325 + k * 28} q30 -10 60 0 t60 0`, 'none', SK('#ffffff', 3, op(0.7))), aMove(30, 0, 5 + k, k));
  s += mv(A, P('M-20 418 Q60 404 140 418 T300 418 T460 418 T620 418 T780 418 T940 418 T1100 418 L1100 432 L-20 432Z', '#ffffff', op(0.9)), aMove(0, 5, 3.5));
  s += P('M-20 424 Q250 412 500 424 Q750 436 1020 420 L1020 620 L-20 620Z', '#ffe3a8') + P('M-20 424 Q250 412 500 424 Q750 436 1020 420 L1020 440 Q750 452 500 440 Q250 428 -20 440Z', '#f6d396');
  // palm tree
  s += G(at(70, 480), P('M-10 0 Q-6 -120 30 -230 L46 -226 Q14 -120 12 0Z', '#c99566') + [0, 1, 2, 3, 4].map((k) => LN(-4 + k * 2, -40 - k * 40, 14 + k * 4, -46 - k * 40, '#a8774c', 3)).join('') +
    mv(A, [-150, -110, -60, -20, 20].map((a, k) => G(at(38, -232, 1, a), P('M0 0 Q50 -30 110 10 Q60 -6 0 6Z', k % 2 ? '#5fbf6a' : '#73cf74'))).join('') + C(30, -222, 10, '#8a5a34') + C(46, -218, 10, '#8a5a34'), aTurn(2, 38, -232, 4)));
  // umbrella and towel
  s += G(at(915, 470), LN(0, 0, 0, -170, '#ffffff', 5) + P('M-90 -160 Q0 -230 90 -160Z', '#ff7eb6') + P('M-30 -160 Q-26 -210 0 -214 Q-10 -190 -30 -160Z M30 -160 Q26 -210 0 -214 Q10 -190 30 -160Z', '#ffffff') + C(0, -216, 6, '#ffd36b'));
  for (let k = 0; k < 5; k++) {
    const x = 300 + rnd(k * 3) * 600;
    const y = 545 + rnd(k * 5) * 45;
    s += k % 2 ? P(starD(x, y, 9, 0.5), '#ff9a6b') : P(`M${f(x - 9)} ${f(y + 4)} Q${f(x)} ${f(y - 14)} ${f(x + 9)} ${f(y + 4)}Z`, '#ffd1dc');
  }
  return s;
};

const ocean: BgFn = (A) => {
  let s = skyG('#8de6f2', '#2f86c9', '#4fb6e0');
  for (let k = 0; k < 4; k++) s += mv(A, P(`M${120 + k * 250} -10 L${200 + k * 250} -10 L${150 + k * 250} 470 L${40 + k * 250} 470Z`, '#ffffff', op(0.1)), aTurn(2, 160 + k * 250, -10, 7 + k, k));
  s += P('M-20 420 Q60 330 150 380 Q220 300 320 390 L320 470 L-20 470Z', '#5fb0d8', op(0.6)) + P('M640 400 Q720 320 800 370 Q880 300 1020 380 L1020 470 L640 470Z', '#5fb0d8', op(0.6));
  s += P('M-20 470 Q250 450 500 466 Q750 482 1020 462 L1020 620 L-20 620Z', '#f6dfa6') + E(260, 520, 60, 8, '#ecd08e', op(0.7)) + E(760, 560, 80, 9, '#ecd08e', op(0.7));
  const weed = (x: number, h: number, c: string, k: number) =>
    mv(A, P(`M${x} 480 q-16 ${-h * 0.25} 0 ${-h * 0.5} q16 ${-h * 0.25} 0 ${-h * 0.5}`, 'none', SK(c, 12)), aTurn(6, x, 480, 3 + k * 0.5, k));
  s += weed(60, 200, '#5fc28a', 0) + weed(100, 140, '#7fd39a', 1) + weed(930, 220, '#5fc28a', 2) + weed(890, 150, '#7fd39a', 3) + weed(560, 90, '#7fd39a', 4);
  const coral = (x: number, y: number, c: string) =>
    P(`M${x} ${y} L${x} ${y - 60} M${x} ${y - 30} L${x - 24} ${y - 64} M${x} ${y - 40} L${x + 22} ${y - 74} M${x - 14} ${y - 50} L${x - 30} ${y - 54}`, 'none', SK(c, 10));
  s += coral(180, 500, '#ff9ec7') + coral(830, 500, '#ffb38a') + E(150, 498, 30, 10, '#ff7eb6') + G(at(760, 500), P('M0 0 Q-40 -60 0 -80 Q40 -60 0 0Z', '#ffd36b', op(0.85)));
  s += P(starD(400, 560, 14, 0.5), '#ff9a6b') + P('M640 560 Q650 540 660 560Z', '#ffd1dc');
  const fish = (x: number, y: number, c: string, sc: number, k: number) =>
    mv(A, G(at(x, y, sc), E(0, 0, 22, 13, c) + P('M18 0 L36 -12 L36 12Z', c) + C(-10, -3, 3, '#2d2240') + P('M-4 -12 Q2 0 -4 12', 'none', SK(light(c, 0.4), 3))), aMove(-60 - k * 20, 10, 6 + k * 2, k));
  s += fish(300, 200, '#ffd36b', 0.8, 0) + fish(700, 150, '#ff9ec7', 0.6, 1) + fish(840, 260, '#c99bff', 0.7, 2);
  for (let k = 0; k < 10; k++) {
    const x = 40 + rnd(k * 7) * 920;
    const b = C(x, 480 - rnd(k) * 300, 4 + rnd(k * 3) * 6, 'none', `stroke="#ffffff" stroke-width="2" ${op(0.7)}`);
    s += A ? `<g>${C(x, 480, 4 + rnd(k * 3) * 6, 'none', 'stroke="#ffffff" stroke-width="2"')}${aRise(10, -480, 5 + rnd(k) * 4, rnd(k * 9) * 6)}</g>` : b;
  }
  return s;
};

const night: BgFn = (A) =>
  skyG('#262c6a', '#6d5fae') + starsField(46, 330, 3, A) + moonG(800, 110, 44) + cloudG(300, 160, 0.6, A, 1, '#7b78b8') +
  hillP(390, 70, '#43518f', 60) + hillP(430, 40, '#36447f', 400) + G(at(110, 452, 1), pineG(0, 0, 1, '#2d3a6e')) + G(at(900, 448), pineG(0, 0, 1.3, '#2d3a6e')) +
  groundP(452, '#3e5c8a', '#4a6a98') + grassTufts(16, 480, 595, 7, '#34507c') + flowersScatter(6, 490, 590, 33, ['#c9c5ff', '#fff6c8']);

const bedroom: BgFn = (A, nt) => {
  let s = wallDots('#ffe1ec', '#ffffff');
  s += bunting(40, ['#ff9ec7', '#ffd36b', '#9fd6ff', '#c99bff'], A);
  s += windowG(110, 120, 200, 180, nt, '#ff9ec7', A);
  s += R(420, 200, 200, 12, 6, '#d9a06b') + R(440, 160, 30, 40, 6, '#7cc8ff') + R(474, 172, 26, 28, 5, '#ffd36b') + T(487, 194, 'A', 18, '#fff');
  s += G(at(560, 200), C(0, -24, 22, '#c99263') + C(-16, -42, 8, '#c99263') + C(16, -42, 8, '#c99263') + E(0, -18, 9, 7, '#f3d6b6') + C(-7, -28, 2.5, '#2d2240') + C(7, -28, 2.5, '#2d2240'));
  s += G(at(600, 200), R(-10, -26, 20, 26, 4, '#ff9a6b') + C(0, -34, 12, '#7fca7e'));
  // bed on the right
  s += R(720, 240, 300, 220, 40, '#c99bff') + R(740, 262, 260, 70, 30, '#d9b8ff') + R(700, 380, 330, 80, 22, '#ffffff') + E(780, 380, 54, 24, '#ffffff', 'stroke="#f1e3f5" stroke-width="3"');
  s += R(700, 396, 330, 70, 22, '#8fd0ff') + [0, 1, 2, 3].map((k) => P(starD(740 + k * 70, 428, 9, 0.5), '#ffffff', op(0.8))).join('') + R(708, 460, 16, 30, 6, '#a77fd6') + R(1000, 460, 16, 30, 6, '#a77fd6');
  s += floorBoards(470, '#f2cfa8');
  s += E(470, 545, 240, 40, '#c9b6ff') + E(470, 545, 200, 30, 'none', 'stroke="#ffffff" stroke-width="4" stroke-dasharray="10 10"');
  if (nt) s += R(-10, -10, 1020, 620, 0, '#1d2160', op(0.2)) + glowG(560, 120, 90, '#fff6c8', 0.5) + P(starD(560, 120, 20, 0.5), '#fff2a8');
  return s;
};

const classroom: BgFn = (A, nt) => {
  let s = R(-10, -10, 1020, 620, 0, '#fff2d4') + R(-10, 330, 1020, 140, 0, '#ffe2b3');
  s += windowG(40, 110, 170, 170, nt, '#9fd6ff', A);
  s += R(300, 80, 400, 220, 14, '#c48a5a') + R(314, 94, 372, 192, 8, '#4f8f72');
  s += T(410, 160, 'A B C', 44, '#ffffff', op(0.92)) + T(600, 250, '1 + 1 = 2', 34, '#fff6c8', op(0.92));
  s += G(at(380, 240), C(0, 0, 18, 'none', SK('#ffd36b', 3)) + [0, 1, 2, 3, 4, 5, 6, 7].map((k) => LN(Math.cos(k * 0.785) * 24, Math.sin(k * 0.785) * 24, Math.cos(k * 0.785) * 32, Math.sin(k * 0.785) * 32, '#ffd36b', 3)).join(''));
  s += P(heartD(640, 120, 22), 'none', SK('#ff9ec7', 3));
  s += R(320, 292, 360, 12, 4, '#b07a50') + R(560, 284, 30, 8, 3, '#ffffff');
  s += bunting(20, ['#ff9ec7', '#ffd36b', '#9be07f', '#9fd6ff'], A);
  s += G(at(870, 110), C(0, 0, 40, '#ffffff', 'stroke="#ff9ec7" stroke-width="8"') + LN(0, 0, 0, -24, '#2d2240', 4) + LN(0, 0, 16, 6, '#2d2240', 4) + C(0, 0, 4, '#ff6f91'));
  s += R(790, 250, 190, 220, 10, '#c48a5a') + R(800, 260, 170, 200, 6, '#e8b98a');
  for (let k = 0; k < 3; k++) s += shelfBooks(806, 320 + k * 66, 160, 40 + k * 9) + R(800, 320 + k * 66, 170, 8, 2, '#b07a50');
  s += G(at(885, 250), C(0, -36, 30, '#7cc8ff') + P('M-18 -50 Q0 -40 -6 -24 Q10 -20 18 -40', 'none', SK('#9be07f', 6)) + R(-4, -8, 8, 10, 2, '#b07a50') + R(-18, -2, 36, 6, 3, '#b07a50'));
  s += floorBoards(470, '#d9b48c');
  if (nt) s += R(-10, -10, 1020, 620, 0, '#1d2160', op(0.3));
  return s;
};

const kitchen: BgFn = (A, nt) => {
  let s = R(-10, -10, 1020, 620, 0, '#e4f6ee');
  for (let yy = 230; yy < 340; yy += 22) for (let xx = -10; xx < 400; xx += 22) s += R(xx, yy, 20, 20, 3, '#ffffff', op(0.7));
  s += windowG(90, 90, 220, 120, nt, '#ffd36b', A);
  s += R(-10, 332, 410, 16, 6, '#ffe3c4') + R(-10, 348, 400, 122, 8, '#ff9ec7');
  for (let k = 0; k < 4; k++) s += R(6 + k * 96, 362, 84, 96, 8, '#ffb6d2') + C(76 + k * 96, 410, 5, '#ffffff');
  s += R(150, 318, 90, 14, 4, '#d9dbe6') + LN(195, 318, 195, 296, '#c9cfdd', 6) + LN(195, 296, 210, 296, '#c9cfdd', 6);
  s += R(450, 190, 260, 10, 5, '#d9a06b');
  for (let k = 0; k < 4; k++) s += R(470 + k * 60, 140, 40, 50, 10, ['#ffd36b', '#ff9a6b', '#9be07f', '#c99bff'][k], op(0.85)) + R(470 + k * 60, 132, 40, 12, 4, '#ffffff');
  s += G(at(560, 280), P('M-40 0 Q-40 40 0 40 Q40 40 40 0Z', '#9fd6ff') + R(-46, -6, 92, 10, 5, '#7cb8e8') + LN(-46, 0, -64, -6, '#7cb8e8', 6) + LN(46, 0, 64, -6, '#7cb8e8', 6)) + LN(560, 240, 560, 274, '#c9cfdd', 3);
  s += R(840, 150, 150, 320, 26, '#9fd6ff') + LN(845, 270, 985, 270, '#7cb8e8', 4) + R(858, 190, 10, 60, 5, '#ffffff') + R(858, 290, 10, 80, 5, '#ffffff');
  s += P(heartD(930, 200, 14), '#ff6f91') + P(starD(910, 330, 12, 0.5), '#ffd36b') + C(950, 380, 9, '#9be07f');
  // checkered floor
  s += R(-10, 470, 1020, 140, 0, '#ffffff');
  for (let yy = 470, r = 0; yy < 610; yy += 34, r++) for (let xx = -10 + (r % 2) * 50; xx < 1020; xx += 100) s += R(xx, yy, 50, 34, 0, '#ffd1e3');
  s += R(-10, 462, 1020, 10, 0, '#ffffff');
  if (nt) s += R(-10, -10, 1020, 620, 0, '#1d2160', op(0.3));
  return s;
};

const garden: BgFn = (A) => {
  let s = skyG('#8fd3ff', '#eef9ff') + sunG(140, 90, 40, A) + cloudG(430, 90, 0.7, A, 0) + cloudG(760, 60, 0.6, A, 2);
  s += hillP(360, 40, '#9fd99a', 20);
  s += G(at(900, 430), R(-80, -170, 160, 170, 6, '#ffb38a') + P('M-100 -164 L0 -240 L100 -164Z', '#a77fd6') + R(-24, -100, 48, 100, 6, '#c9805a') + C(14, -50, 4, '#ffd36b') + R(-62, -140, 30, 30, 4, '#ffffff') + R(34, -140, 30, 30, 4, '#ffffff'));
  for (let x = -10; x < 820; x += 40) s += P(`M${x} 432 L${x} 352 L${x + 14} 338 L${x + 28} 352 L${x + 28} 432Z`, '#ffffff');
  s += R(-10, 368, 830, 10, 4, '#ffffff') + R(-10, 405, 830, 10, 4, '#ffffff');
  s += groundP(430, '#a5e08a', '#b9ea9e');
  for (let k = 0; k < 18; k++) s += flowerG(14 + k * 44, 428 - rnd(k) * 20, 11, ['#ff8fc5', '#ffd36b', '#c99bff', '#ff9a6b'][k % 4]);
  const bed = (x: number, w: number) => {
    let b = R(x, 458, w, 30, 14, '#a8754f');
    for (let k = 0; k < Math.floor(w / 46); k++) {
      const cx = x + 24 + k * 46;
      b += k % 2 ? C(cx, 458, 15, '#8fd36f') + C(cx - 4, 452, 6, '#b7ea93') : P(`M${cx} 466 L${cx - 8} 440 M${cx} 466 L${cx} 436 M${cx} 466 L${cx + 8} 440`, 'none', SK('#5fae5a', 5)) + P(`M${cx - 7} 466 L${cx + 7} 466 L${cx} 482Z`, '#ff9a4f');
    }
    return b;
  };
  s += bed(20, 280) + bed(700, 280);
  s += grassTufts(14, 510, 595, 11, '#7fc96c') + flowersScatter(6, 540, 595, 41);
  return s;
};

const snow: BgFn = (A) => {
  let s = skyG('#b9d4f0', '#f3f8fd') + sunG(820, 100, 36, A, '#fffbe0') + cloudG(250, 110, 0.8, A, 0) + cloudG(600, 70, 0.55, A, 1);
  s += hillP(380, 80, '#eaf2fb', 50) + hillP(420, 50, '#dde9f7', 260);
  s += pineG(90, 440, 1.2, '#3a8a66', true) + pineG(170, 430, 0.8, '#2f7a5a', true) + pineG(880, 440, 1.35, '#3a8a66', true) + pineG(960, 430, 0.9, '#2f7a5a', true) + pineG(600, 400, 0.6, '#5f9a86', true);
  s += groundP(445, '#fbfdff', '#eef4fc') + P('M80 560 q60 -20 120 0 M600 580 q80 -24 160 0 M380 500 q40 -12 80 0', 'none', SK('#dbe7f6', 6));
  for (let k = 0; k < 44; k++) {
    const x = rnd(k * 3) * 1000;
    const r = 2.5 + rnd(k * 5) * 3;
    if (A) {
      const dur = 6 + rnd(k) * 6;
      s += `<circle cx="${f(x)}" cy="-10" r="${f(r)}" fill="#ffffff"><animate attributeName="cy" from="-10" to="610" ${rep(dur, rnd(k * 7) * dur)}/><animate attributeName="cx" values="${f(x)};${f(x + 20)};${f(x)}" ${EASE} ${rep(3 + rnd(k) * 2)}/></circle>`;
    } else s += C(x, rnd(k * 7) * 590, r, '#ffffff', op(0.95));
  }
  return s;
};

const town: BgFn = (A, nt) => {
  let s = skyG('#8fd3ff', '#eef9ff') + cloudG(180, 80, 0.7, A, 0) + cloudG(720, 60, 0.6, A, 1);
  s += hillP(300, 40, '#cfe3f7', 0);
  const hs = [
    { x: -10, w: 190, h: 230, c: '#ffd1dc', roof: '#ff8fa3', sign: '' },
    { x: 180, w: 210, h: 270, c: '#fff1b8', roof: '#ffb347', sign: 'Bakery' },
    { x: 390, w: 170, h: 215, c: '#c9ecff', roof: '#7cb8e8', sign: '' },
    { x: 560, w: 220, h: 262, c: '#d9f5d0', roof: '#6fc07a', sign: 'Books' },
    { x: 780, w: 240, h: 232, c: '#e6dcff', roof: '#a77fd6', sign: '' },
  ];
  const lit = nt ? '#ffe9a0' : '#bfe9ff';
  hs.forEach((h, k) => {
    const top = 455 - h.h;
    s += R(h.x, top, h.w, h.h, 6, h.c);
    s += k % 2 ? R(h.x - 8, top - 18, h.w + 16, 24, 8, h.roof) : P(`M${h.x - 12} ${top + 4} L${h.x + h.w / 2} ${top - 70} L${h.x + h.w + 12} ${top + 4}Z`, h.roof);
    for (let j = 0; j < 2; j++) {
      const wx = h.x + 26 + j * (h.w - 90);
      s += R(wx, top + 34, 40, 46, 6, '#ffffff') + R(wx + 5, top + 39, 30, 36, 4, lit) + R(wx - 4, top + 80, 48, 10, 4, h.roof) + C(wx + 10, top + 80, 5, '#ff8fc5') + C(wx + 30, top + 80, 5, '#ffd36b');
    }
    const dx = h.x + h.w / 2;
    if (h.sign) {
      s += R(dx - 70, 455 - 128, 140, 28, 8, '#ffffff') + T(dx, 455 - 107, h.sign, 20, dark(h.roof, 0.25));
      let aw = '';
      for (let j = 0; j < 7; j++) aw += P(`M${dx - 84 + j * 24} ${455 - 96} l24 0 l0 22 q-12 10 -24 0Z`, j % 2 ? '#ffffff' : h.roof);
      s += aw + R(dx - 64, 455 - 64, 50, 64, 4, lit) + R(dx + 10, 455 - 72, 44, 72, 6, dark(h.roof, 0.15)) + C(dx + 20, 455 - 36, 3, '#ffd36b');
    } else s += R(dx - 24, 455 - 70, 48, 70, 22, dark(h.c, 0.25)) + C(dx + 12, 455 - 34, 3.5, '#ffd36b');
  });
  s += R(-10, 455, 1020, 95, 0, '#f3e6da');
  for (let x = -10; x < 1020; x += 80) s += LN(x, 455, x - 20, 548, '#e3d2c3', 2);
  s += R(-10, 546, 1020, 10, 0, '#e0cfc0') + R(-10, 556, 1020, 60, 0, '#c4bfd1');
  for (let x = 20; x < 1020; x += 120) s += R(x, 580, 60, 6, 3, '#ffffff', op(0.8));
  const lamp = (x: number) => R(x - 4, 330, 8, 150, 4, '#6a5a8a') + C(x, 324, 16, nt ? '#ffe9a0' : '#fff6c8') + (nt ? C(x, 324, 40, '#ffe9a0', op(0.3)) : '') + R(x - 12, 304, 24, 8, 4, '#6a5a8a');
  s += lamp(60) + lamp(950);
  if (nt) s = R(-10, -10, 1020, 620, 0, '#20245e') + s.replace(/#8fd3ff|#eef9ff/g, '#3a3f80') + R(-10, -10, 1020, 620, 0, '#1d2160', op(0.25));
  return s;
};

const castle: BgFn = (A) => {
  let s = skyG('#a9dcff', '#f4fbff') + sunG(120, 90, 36, A) + cloudG(420, 70, 0.6, A, 1) + cloudG(860, 120, 0.75, A, 2);
  s += hillP(400, 60, '#c4ecb0', 90);
  const wall = '#efe6ff';
  const tower = (x: number, w: number, top: number, roof: string, k: number) => {
    let t = R(x, top, w, 450 - top, 4, wall) + R(x + w - 14, top, 14, 450 - top, 0, '#ddd2f5');
    t += P(`M${x - 12} ${top + 2} L${x + w / 2} ${top - w * 0.95} L${x + w + 12} ${top + 2}Z`, roof);
    t += LN(x + w / 2, top - w * 0.95, x + w / 2, top - w * 0.95 - 40, '#8a6a4a', 3);
    t += mv(A, P(`M${x + w / 2} ${top - w * 0.95 - 40} q16 -4 30 4 q-14 6 -30 10Z`, '#ffd36b'), aScale(0.8, 1, 1.2 + k * 0.2, k));
    t += P(`M${x + w / 2 - 12} ${top + 70} L${x + w / 2 - 12} ${top + 50} Q${x + w / 2} ${top + 36} ${x + w / 2 + 12} ${top + 50} L${x + w / 2 + 12} ${top + 70}Z`, '#8fb8ff');
    return t;
  };
  s += tower(220, 110, 170, '#ff9ec7', 0) + tower(670, 110, 170, '#ff9ec7', 1);
  s += R(320, 220, 360, 230, 4, wall);
  for (let k = 0; k < 9; k++) s += R(320 + k * 42, 200, 26, 26, 3, wall);
  s += tower(445, 110, 110, '#c99bff', 2);
  s += P('M440 450 L440 360 Q500 300 560 360 L560 450Z', '#b9805a') + P('M450 450 L450 364 Q500 314 550 364 L550 450', 'none', SK('#8a5a3a', 3)) + LN(500, 330, 500, 450, '#8a5a3a', 3);
  s += R(360, 260, 24, 70, 6, '#ff8fb1') + P('M360 330 l12 12 l12 -12Z', '#ff8fb1') + R(616, 260, 24, 70, 6, '#ff8fb1') + P('M616 330 l12 12 l12 -12Z', '#ff8fb1');
  s += P(starD(372, 290, 8, 0.5), '#ffd36b') + P(starD(628, 290, 8, 0.5), '#ffd36b');
  s += groundP(448, '#a5e08a', '#b9ea9e') + P('M440 450 L560 450 L700 610 L300 610Z', '#f6e3b8');
  s += bushG(260, 470, 1, '#7fca7e') + bushG(760, 470, 1.1, '#7fca7e') + flowersScatter(10, 480, 595, 51);
  return s;
};

function spaceSky(A: boolean): string {
  let s = skyG('#1b1940', '#43307f', '#2b2366');
  s += glowG(260, 280, 260, '#ff9ec7', 0.22) + glowG(760, 200, 300, '#7cc8ff', 0.2) + glowG(520, 520, 240, '#c99bff', 0.18);
  s += starsField(70, 600, 11, A);
  return s;
}
function planetG(x: number, y: number, r: number, c: string, ring: string): string {
  return G(at(x, y, 1, -16), P(`M${f(-r * 1.8)} 0 A${f(r * 1.8)} ${f(r * 0.45)} 0 0 1 ${f(r * 1.8)} 0`, 'none', SK(ring, 7)) + C(0, 0, r, c) + P(`M${f(-r)} ${f(-r * 0.25)} Q0 ${f(-r * 0.1)} ${f(r)} ${f(-r * 0.3)}`, 'none', SK(light(c, 0.3), 6)) +
    C(-r * 0.35, -r * 0.4, r * 0.2, '#fff', op(0.35)) + P(`M${f(-r * 1.8)} 0 A${f(r * 1.8)} ${f(r * 0.45)} 0 0 0 ${f(r * 1.8)} 0`, 'none', SK(ring, 7)));
}
const space: BgFn = (A) => {
  let s = spaceSky(A) + planetG(90, 70, 30, '#ffb38a', '#ffe0c2');
  s += glowG(900, 80, 70, '#7cc8ff', 0.5) + G(at(900, 80, 0.8), C(0, 0, 50, '#5fb8ff') + P('M-30 -20 Q-10 -36 6 -20 Q0 0 -20 4Z M10 14 Q30 4 38 20 Q24 36 8 30Z', '#7fd98a') + C(-16, -18, 12, '#fff', op(0.3)));
  s += P('M-20 470 Q250 420 500 446 Q750 472 1020 434 L1020 620 L-20 620Z', '#dcd6ee') + P('M-20 470 Q250 420 500 446 Q750 472 1020 434 L1020 452 Q750 490 500 464 Q250 438 -20 488Z', '#eeeaf8');
  const crater = (x: number, y: number, r: number) => E(x, y, r, r * 0.32, '#c3bade') + E(x, y - r * 0.08, r * 0.8, r * 0.22, '#d2cae6');
  s += crater(140, 540, 50) + crater(420, 580, 30) + crater(800, 530, 60) + crater(620, 500, 22) + crater(950, 590, 34);
  return s;
};
const stars: BgFn = (A) => {
  let s = spaceSky(A) + planetG(820, 470, 70, '#c99bff', '#ffd1f0') + G(at(150, 520), C(0, 0, 90, '#e8e2f6') + C(-30, -20, 14, '#d2cae6') + C(30, 20, 20, '#d2cae6'));
  s += mv(A, G(at(500, 90), P(sparkleD(0, 0, 16), '#fff6c8')), aFade(0.3, 1.4));
  return s;
};

const farm: BgFn = (A) => {
  let s = skyG('#8fd3ff', '#eef9ff') + sunG(120, 90, 40, A) + cloudG(400, 80, 0.7, A, 0) + cloudG(860, 70, 0.55, A, 1);
  s += hillP(370, 50, '#e8e08a', 0) + hillP(400, 40, '#c4e28a', 300);
  for (let k = 0; k < 6; k++) s += P(`M${-20 + k * 90} 400 Q${200 + k * 60} 380 ${520 + k * 30} 410`, 'none', SK('#b4d47a', 4, op(0.6)));
  s += G(at(860, 455), R(-30, -300, 80, 300, 30, '#e8e2f0') + P('M-30 -280 Q10 -330 50 -280Z', '#a77fd6') + LN(-30, -200, 50, -200, '#d2cae6', 3) + LN(-30, -120, 50, -120, '#d2cae6', 3));
  s += G(at(690, 455), R(-130, -190, 260, 190, 6, '#ff8a8a') + P('M-150 -186 L-110 -260 L110 -260 L150 -186Z', '#c95b6b') + P('M-110 -260 L0 -300 L110 -260Z', '#b84d5d') +
    R(-56, -120, 112, 120, 4, '#ffffff') + R(-48, -112, 96, 112, 2, '#e86a6a') + LN(-48, -112, 48, 0, '#ffffff', 6) + LN(48, -112, -48, 0, '#ffffff', 6) + R(-26, -230, 52, 40, 4, '#ffffff') + R(-20, -224, 40, 34, 2, '#ffd36b'));
  for (let x = -10; x < 540; x += 60) s += R(x, 380, 12, 76, 4, '#c9945f');
  s += R(-10, 396, 550, 10, 4, '#c9945f') + R(-10, 428, 550, 10, 4, '#c9945f');
  s += groundP(452, '#a8de84', '#bce89a') + P('M470 610 Q520 520 560 455 L600 455 Q620 520 640 610Z', '#e8cfa0', op(0.8));
  s += grassTufts(18, 480, 595, 17, '#85c96a') + flowersScatter(8, 500, 595, 61, ['#ffffff', '#ffd36b']);
  return s;
};

const stage: BgFn = (A) => {
  let s = skyG('#6a3a7f', '#3f2560');
  for (let k = 0; k < 12; k++) s += P(starD(100 + rnd(k) * 800, 90 + rnd(k * 3) * 260, 6, 0.5), '#ffd36b', op(0.35));
  const beam = (x: number, k: number) => mv(A, P(`M${x - 20} -10 L${x + 20} -10 L${x + 150} 470 L${x - 150} 470Z`, '#fff6c8', op(0.13)), aTurn(5, x, -10, 6 + k, k * 2));
  s += beam(300, 0) + beam(700, 1);
  s += R(-10, 430, 1020, 190, 0, '#e0a66b');
  for (let k = 0; k < 6; k++) s += LN(-10, 450 + k * 26, 1010, 450 + k * 26, '#c98d55', 2);
  s += R(-10, 425, 1020, 10, 0, '#c98d55');
  const curtain = (side: number) => {
    const x0 = side < 0 ? -10 : 1010;
    const x1 = side < 0 ? 170 : 830;
    let c = P(`M${x0} -10 L${x1} -10 Q${x1 - side * 40} 200 ${x1 - side * 10} 300 Q${x1 - side * 60} 420 ${x1 - side * 10} 470 L${x0} 470Z`, '#e8456b');
    for (let k = 1; k < 4; k++) c += P(`M${x0 + side * -1 * k * 40} 0 Q${x0 - side * (k * 40 + 10)} 240 ${x0 - side * k * 40} 470`, 'none', SK('#c8325a', 6));
    return c;
  };
  s += curtain(-1) + curtain(1);
  let val = R(-10, -10, 1020, 70, 0, '#d63a5f');
  for (let x = -10; x < 1020; x += 60) val += P(`M${x} 58 Q${x + 30} 100 ${x + 60} 58Z`, '#d63a5f') + C(x + 30, 82, 5, '#ffd36b');
  s += val + R(-10, 52, 1020, 8, 0, '#ffd36b');
  for (let k = 0; k < 10; k++) s += mv(A, C(60 + k * 100, 598, 8, '#fff2a8') + C(60 + k * 100, 598, 18, '#fff2a8', op(0.25)), aFade(0.5, 1.2 + (k % 3) * 0.3, k * 0.2));
  return s;
};

const rain: BgFn = (A) => {
  let s = skyG('#a3b4cc', '#e2e8f0');
  s += cloudG(160, 70, 1.3, A, 0, '#c9d2df') + cloudG(500, 50, 1.5, A, 1, '#bcc6d6') + cloudG(860, 80, 1.3, A, 2, '#c9d2df');
  s += hillP(390, 60, '#aed4a6', 20) + hillP(430, 40, '#9bc994', 240);
  s += treeG(110, 450, 0.9, '#86c084', A, 0) + treeG(900, 445, 1.05, '#7ab478', A, 1);
  s += groundP(450, '#9ccf8f', '#addb9f') + E(210, 560, 80, 14, '#b9daf2') + E(200, 556, 50, 6, '#e0f0fb') + E(790, 548, 100, 16, '#b9daf2') + E(780, 544, 60, 7, '#e0f0fb');
  s += flowersScatter(6, 490, 590, 71, ['#ffffff', '#c99bff']);
  for (let k = 0; k < 60; k++) {
    const x = rnd(k * 3) * 1040 - 20;
    const y = rnd(k * 5) * 600;
    if (A) {
      const dur = 0.7 + rnd(k) * 0.5;
      s += `<line x1="${f(x)}" y1="-30" x2="${f(x - 6)}" y2="-4" stroke="#7f9cc2" stroke-width="3" stroke-linecap="round" ${op(0.7)}><animateTransform attributeName="transform" type="translate" values="0 0;-30 640" ${rep(dur, rnd(k * 7) * dur)}/></line>`;
    } else s += LN(x, y, x - 6, y + 26, '#7f9cc2', 3, op(0.6));
  }
  return s;
};

const library: BgFn = (A, nt) => {
  let s = R(-10, -10, 1020, 620, 0, '#f7e6d4');
  s += P('M390 300 L390 140 Q500 40 610 140 L610 300Z', '#ffffff') + P('M402 292 L402 144 Q500 56 598 144 L598 292Z', nt ? '#2e3578' : '#9edcff');
  s += nt ? moonG(540, 140, 18) : cloudG(470, 190, 0.45, A, 1);
  s += LN(500, 70, 500, 292, '#ffffff', 6) + LN(402, 200, 598, 200, '#ffffff', 6);
  const shelf = (x: number, w: number, seed: number) => {
    let t = R(x, 60, w, 410, 8, '#b97d55') + R(x + 10, 70, w - 20, 390, 4, '#e2b28a');
    for (let k = 0; k < 4; k++) t += shelfBooks(x + 14, 160 + k * 100, w - 28, seed + k * 13) + R(x + 6, 160 + k * 100, w - 12, 10, 3, '#a8704a');
    return t;
  };
  s += shelf(-10, 330, 100) + shelf(680, 330, 200);
  const lamp = (x: number) => LN(x, -10, x, 60, '#8a6a4a', 3) + mv(A, glowG(x, 96, 60, '#fff2a8', 0.6), aFade(0.6, 3)) + P(`M${x - 30} 90 Q${x} 40 ${x + 30} 90Z`, '#ffd36b');
  s += lamp(440) + lamp(560);
  s += G(at(640, 470), R(-18, -40, 36, 40, 8, '#ff9a6b') + C(-10, -56, 18, '#7fca7e') + C(12, -60, 20, '#8fd18a') + C(0, -76, 16, '#7fca7e'));
  s += floorBoards(470, '#e0b083') + E(500, 548, 250, 42, '#ffb6cf') + E(500, 548, 210, 32, 'none', 'stroke="#ffffff" stroke-width="4" stroke-dasharray="12 10"');
  if (nt) s += R(-10, -10, 1020, 620, 0, '#1d2160', op(0.3));
  return s;
};

const cave: BgFn = (A, nt) => {
  let s = skyG('#6b5a8e', '#3e3260');
  s += P('M700 460 Q690 130 830 90 Q980 70 1020 160 L1020 460Z', nt ? '#262c6a' : '#9edcff');
  if (nt) for (let k = 0; k < 12; k++) s += mv(A, C(730 + rnd(k * 5) * 280, 110 + rnd(k * 9) * 300, 2 + rnd(k) * 2, '#fff8e6'), aFade(0.3, 1.6 + rnd(k) * 2, k));
  if (nt) s += moonG(900, 170, 22);
  else s += cloudG(880, 200, 0.45, A, 1) + hillP(440, 40, '#a6e08c', 720);
  s += P('M690 470 Q680 120 830 80 Q990 60 1020 150 L1030 70 Q900 40 800 60 Q660 100 660 470Z', '#4e406f');
  for (let k = 0; k < 9; k++) s += P(`M${40 + k * 80} -10 L${70 + k * 80} -10 L${55 + k * 80} ${40 + rnd(k) * 60}Z`, '#56477c');
  for (let k = 0; k < 10; k++) s += E(rnd(k * 3) * 650, 80 + rnd(k * 5) * 300, 40 + rnd(k) * 30, 20 + rnd(k * 2) * 12, k % 2 ? '#5f4f86' : '#544476', op(0.8));
  const crystal = (x: number, y: number, c: string, k: number) =>
    mv(A, glowG(x, y - 30, 70, c, 0.45), aFade(0.4, 2.2 + k * 0.4, k)) + P(`M${x - 18} ${y} L${x - 12} ${y - 50} L${x - 4} ${y}Z M${x - 4} ${y} L${x + 4} ${y - 70} L${x + 12} ${y}Z M${x + 10} ${y} L${x + 18} ${y - 40} L${x + 24} ${y}Z`, c) + P(`M${x - 1} ${y - 4} L${x + 4} ${y - 60}`, 'none', SK('#ffffff', 2, op(0.6)));
  s += crystal(110, 462, '#ff9ec7', 0) + crystal(590, 452, '#7fe0d0', 1) + crystal(320, 300, '#c99bff', 2).replace(/<path/, '<path opacity="0.8"');
  s += P('M-20 452 Q250 436 500 452 Q750 468 1020 448 L1020 620 L-20 620Z', '#7d6a9e') + E(160, 560, 60, 14, '#6f5d91') + E(820, 540, 80, 16, '#6f5d91');
  s += E(450, 545, 230, 38, '#ff9ec7') + E(450, 545, 190, 28, 'none', 'stroke="#ffffff" stroke-width="4" stroke-dasharray="12 10"');
  if (nt) s += R(-10, -10, 1020, 620, 0, '#14123a', op(0.35));
  return s;
};

const treehouse: BgFn = (A) => {
  let s = skyG('#8fd3ff', '#eef9ff') + sunG(120, 90, 38, A) + cloudG(380, 90, 0.75, A, 0);
  s += hillP(400, 50, '#c6eda8', 0) + groundP(455, '#9be07f', '#b4ea96');
  s += P('M720 470 Q730 300 745 120 L835 120 Q845 300 860 470 Q890 480 900 470 L680 470 Q700 480 720 470Z', '#b07a50') + P('M760 440 Q770 300 775 140', 'none', SK('#9a6a44', 5));
  s += P('M770 260 Q700 240 640 250', 'none', SK('#b07a50', 18));
  s += C(640, 40, 110, '#7fca7e') + C(800, -10, 130, '#6fbf72') + C(960, 60, 120, '#7fca7e') + C(880, 130, 90, '#8fd18a') + C(1010, 170, 80, '#6fbf72') + C(720, 100, 60, '#8fd18a');
  s += C(700, 10, 26, '#a5dd9a', op(0.7)) + C(920, 20, 30, '#a5dd9a', op(0.7));
  // the house on its platform
  s += R(560, 140, 230, 112, 8, '#ffcf9e') + P('M540 146 L675 70 L810 146Z', '#ff8fa3') + R(590, 164, 56, 88, 10, '#8a5a3c') + C(735, 190, 26, '#ffffff') + C(735, 190, 20, '#bfe9ff') + LN(715, 190, 755, 190, '#ffffff', 4);
  s += R(530, 250, 300, 16, 6, '#a8754f');
  for (let x = 545; x < 830; x += 30) s += LN(x, 250, x, 266, '#8a5a3c', 2);
  // rope ladder down to the grass
  s += LN(640, 262, 640, 470, '#d9b07a', 4) + LN(690, 262, 690, 470, '#d9b07a', 4);
  for (let y = 282; y < 470; y += 19) s += R(636, y, 58, 7, 3, '#c9945f');
  s += flowersScatter(12, 475, 590, 91) + grassTufts(12, 480, 595, 23, '#7cc96c');
  s += G(at(120, 560), R(-6, -20, 12, 20, 4, '#fff3e0') + P('M-20 -16 Q-20 -40 0 -40 Q20 -40 20 -16Z', '#ff7a7a') + C(-6, -30, 4, '#fff') + C(8, -28, 3, '#fff'));
  return s;
};

const treetop: BgFn = (A) => {
  let s = skyG('#ffa9a0', '#ffe6b8', '#ffc6a6') + C(500, 360, 150, '#fff2c0', op(0.35)) + C(500, 360, 80, '#ffd27a');
  s += cloudG(200, 120, 0.8, A, 0, '#ffe4ec') + cloudG(780, 90, 0.7, A, 1, '#ffe4ec');
  s += R(-10, 330, 1020, 40, 0, '#ffc3a3') + P('M-10 340 q60 -6 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0', 'none', SK('#fff2e0', 3, op(0.6)));
  s += hillP(380, 40, '#d99ab8', 30) + hillP(400, 30, '#c886ae', 240);
  s += C(-20, 30, 120, '#7fca7e') + C(80, -30, 100, '#6fbf72') + C(1020, 30, 120, '#7fca7e') + C(920, -30, 100, '#6fbf72');
  for (let x = 0; x < 1020; x += 70) s += R(x, 360, 14, 90, 5, '#b07a50');
  s += R(-10, 368, 1020, 14, 6, '#c98d5e') + R(-10, 410, 1020, 10, 5, '#c98d5e');
  s += R(-10, 445, 1020, 175, 0, '#d9a06b');
  for (let k = 0; k < 6; k++) s += LN(-10, 470 + k * 26, 1010, 470 + k * 26, '#c48a5a', 2);
  return s;
};

const sunset: BgFn = (A) => {
  let s = skyG('#ff9fae', '#ffe0b0', '#ffbfa8') + C(700, 400, 130, '#fff2c0', op(0.3)) + C(700, 400, 72, '#ffcf6a');
  s += cloudG(250, 120, 0.9, A, 0, '#ffe4ec') + cloudG(620, 80, 0.6, A, 1, '#ffe4ec');
  s += hillP(400, 70, '#e8a0b4', 60) + hillP(430, 50, '#d68fac', 360);
  s += groundP(450, '#e9b58a', '#f2c69e') + grassTufts(16, 480, 595, 29, '#d69a6a') + flowersScatter(8, 490, 590, 101, ['#ffffff', '#ffe3a0', '#ff9ec7']);
  for (let k = 0; k < 3; k++) s += mv(A, P(`M${300 + k * 50} ${150 + k * 20} q8 -8 16 0 q8 -8 16 0`, 'none', SK('#a35a7a', 3)), aMove(30, -6, 6 + k, k));
  return s;
};

const pond: BgFn = (A, nt) => {
  let s = nt ? skyG('#262c6a', '#6d5fae') + starsField(30, 300, 5, A) + moonG(820, 100, 36) : skyG('#8fd3ff', '#eef9ff') + sunG(830, 90, 38, A) + cloudG(260, 90, 0.8, A, 0);
  const g1 = nt ? '#43518f' : '#c6eda8';
  const g2 = nt ? '#3e5c8a' : '#9be07f';
  s += hillP(340, 50, g1, 80) + treeG(90, 390, 0.85, nt ? '#2d3a6e' : '#86d67a', A, 2) + treeG(930, 385, 0.95, nt ? '#2d3a6e' : '#78c96e', A, 3);
  s += groundP(385, g2, nt ? '#4a6a98' : '#b4ea96');
  s += E(500, 442, 380, 62, nt ? '#3f6aa8' : '#8fd3f0') + E(500, 438, 340, 48, nt ? '#4f7cbc' : '#a9e2f7');
  s += mv(A, E(380, 440, 60, 8, 'none', SK('#ffffff', 2.5, op(0.6))) + E(640, 450, 80, 9, 'none', SK('#ffffff', 2.5, op(0.6))), aScale(1.06, 1.06, 3));
  const pad = (x: number, y: number, r: number, fl: boolean) =>
    P(`M${x} ${y} L${f(x + r)} ${f(y - 2)} A${f(r)} ${f(r * 0.4)} 0 1 1 ${f(x + r * 0.7)} ${f(y - r * 0.3)}Z`, nt ? '#3f8a6a' : '#6fc06a') + (fl ? flowerG(x - r * 0.3, y - 4, 9, '#ff9ec7', '#fff3b0') : '');
  s += pad(250, 450, 34, true) + pad(330, 470, 26, false) + pad(700, 425, 30, false) + pad(780, 460, 36, true) + pad(560, 476, 22, false);
  const reeds = (x: number) => [0, 1, 2, 3].map((k) => P(`M${x + k * 12} 470 q-4 -60 ${4 - k * 3} -110`, 'none', SK(nt ? '#3f7a5a' : '#5fae5a', 5)) + (k % 2 ? E(x + k * 12 + 2 - k * 3, 360 + k * 4, 6, 18, '#a8754f') : '')).join('');
  s += reeds(110) + reeds(860);
  s += grassTufts(14, 500, 595, 31, nt ? '#34507c' : '#7cc96c') + flowersScatter(8, 510, 595, 111, nt ? ['#c9c5ff', '#fff6c8'] : undefined);
  return s;
};

const BG: Record<string, BgFn> = {
  meadow, forest, beach, ocean, night, bedroom, classroom, kitchen, garden, snow, town, castle, space, stars, farm, stage, rain, library, cave, treehouse, treetop, sunset, pond,
};
/** Backgrounds that draw their own night look. */
const NIGHT_NATIVE = new Set(['night', 'bedroom', 'classroom', 'kitchen', 'library', 'cave', 'pond', 'town', 'space', 'stars']);
const INDOOR = new Set(['bedroom', 'classroom', 'kitchen', 'library', 'stage', 'cave', 'treetop']);
export const STORY_BACKGROUNDS = Object.keys(BG);

// ---------------------------------------------------------------- props
interface PropDef {
  draw: (c: string | undefined, A: boolean, i: number, p: StoryProp) => string;
  /** Scale and grip point (in prop units) when a character holds it. */
  hold?: [number, number];
  /** Flat things that lie on the ground and go behind the cast. */
  back?: boolean;
  /** For things a character can ride on: seat height and a front part drawn over the rider. */
  seat?: number;
  front?: (c: string | undefined) => string;
  /** Has a handle, so the paw is drawn wrapped around it. */
  handle?: boolean;
}
const PAL = ['#ff6f91', '#7cc8ff', '#ffd36b', '#9be07f', '#c99bff', '#ff9a6b'];
const apple = (x: number, y: number, r = 14, c = '#ff5a5a') =>
  C(x, y, r, c) + P(`M${f(x)} ${f(y - r)} q2 -8 6 -10`, 'none', SK('#8a5a34', 3)) + P(`M${f(x + 2)} ${f(y - r - 4)} q10 -6 14 2 q-8 4 -14 -2Z`, '#7fca7e') + C(x - r * 0.35, y - r * 0.35, r * 0.25, '#fff', op(0.5));
const musicNote = (x: number, y: number, c: string, s = 1) =>
  G(at(x, y, s), E(0, 0, 10, 7.5, c, 'transform="rotate(-20)"') + R(7, -42, 4.5, 42, 2, c) + P('M9 -42 q16 6 14 22 q-4 -12 -14 -12Z', c));
const oneBalloon = (bx: number, by: number, c: string) =>
  P(`M0 0 Q${f(bx * 0.4 + 8)} ${f(by * 0.5)} ${f(bx)} ${f(by + 36)}`, 'none', SK('#9a8aa8', 2)) + E(bx, by, 30, 36, c) + P(`M${f(bx - 5)} ${f(by + 37)} L${f(bx + 5)} ${f(by + 37)} L${f(bx)} ${f(by + 30)}Z`, dark(c, 0.1)) + E(bx - 10, by - 12, 7, 11, '#fff', op(0.45));
const lanternArt = (on: boolean, A: boolean, k: number) =>
  (on ? mv(A, glowG(0, -42, 80, '#fff3b0', 0.7), aFade(0.55, 2 + k * 0.3, k)) : '') + P('M-14 -70 Q0 -96 14 -70', 'none', SK('#8a6a4a', 4)) + R(-18, -76, 36, 10, 4, '#8a6a4a') +
  R(-16, -66, 32, 46, 8, on ? '#fff3b0' : '#c9cfe0') + (on ? mv(A, E(0, -40, 6, 11, '#ffb703'), aScale(1, 0.85, 0.6, k)) + E(0, -38, 3, 6, '#fff6c8') : E(0, -38, 2, 4, '#8a8aa0')) +
  LN(-16, -44, 16, -44, '#8a6a4a', 2, op(0.4)) + R(-20, -22, 40, 12, 4, '#8a6a4a');
const sandColor = '#f2cf8a';
const coinG = (x: number, y: number, r = 12) => C(x, y, r, '#ffd23f', `stroke="#e8a71c" stroke-width="2"`) + P(starD(x, y, r * 0.5, 0.5), '#ffe98a');
const kidTable = (food: string) =>
  E(0, -6, 40, 8, '#3a1d3f', op(0.12)) + R(-8, -118, 16, 112, 6, '#d9a06b') + E(0, -6, 34, 8, '#d9a06b') + E(0, -120, 90, 18, '#ffd1a8') + E(0, -124, 86, 14, '#ffe2c4') + E(0, -128, 52, 11, '#ffffff', 'stroke="#e8e2f0" stroke-width="2"') + food;

const PROPS: Record<string, PropDef> = {
  present: { draw: (c = '#ff7eb6') => R(-34, -62, 68, 62, 8, c) + R(-38, -72, 76, 18, 6, light(c, 0.18)) + R(-7, -72, 14, 72, 0, '#ffe066') + bowG(0, -74, 1.1, '#ffe066') + R(-28, -56, 8, 48, 4, '#fff', op(0.25)), hold: [0.6, -36] },
  balloon: { draw: (c = '#ff6f91', A, i) => mv(A, oneBalloon(0, -150, c), aTurn(4, 0, 0, 3.4, i)), hold: [0.8, 0], handle: true },
  balloons: { draw: (c, A, i) => mv(A, oneBalloon(-36, -170, c ?? '#ff6f91') + oneBalloon(36, -160, '#7cc8ff') + oneBalloon(0, -205, '#ffd36b'), aTurn(3, 0, 0, 3.8, i)), hold: [0.7, 0], handle: true },
  cake: {
    draw: (c = '#ffc2d6', A) => {
      let s = E(0, -6, 84, 12, '#ffffff', 'stroke="#efe3f3" stroke-width="2"') + R(-64, -72, 128, 66, 14, c) + P('M-64 -60 Q-56 -44 -48 -60 Q-40 -44 -32 -60 Q-24 -44 -16 -60 Q-8 -44 0 -60 Q8 -44 16 -60 Q24 -44 32 -60 Q40 -44 48 -60 Q56 -44 64 -60 L64 -68 L-64 -68Z', '#ffffff');
      s += R(-44, -118, 88, 50, 12, '#fff3f8') + P('M-44 -108 Q-36 -94 -28 -108 Q-20 -94 -12 -108 Q-4 -94 4 -108 Q12 -94 20 -108 Q28 -94 36 -108 Q40 -100 44 -108 L44 -114 L-44 -114Z', c);
      for (const x of [-24, 0, 24]) s += R(x - 3, -144, 6, 26, 2, x ? '#7cc8ff' : '#ffd36b') + mv(A, E(x, -152, 5, 9, '#ffb703') + E(x, -150, 2.5, 5, '#fff6c8'), aScale(0.85, 0.8, 0.5, x * 0.01));
      return s + C(-40, -30, 5, '#ff6f91') + C(0, -30, 5, '#ff6f91') + C(40, -30, 5, '#ff6f91');
    },
  },
  star: { draw: (c = '#ffd36b', A, i) => mv(A, P(starD(0, -44, 42, 0.5), c, `stroke="${light(c, 0.45)}" stroke-width="4" stroke-linejoin="round"`) + C(-12, -54, 6, '#fff', op(0.5)) + P(sparkleD(44, -84, 10), '#fff'), aMove(0, -8, 2.4, i)), hold: [0.5, -44] },
  stars: {
    draw: (c = '#ffd36b', A) => {
      const pts: [number, number, number][] = [[0, 0, 26], [-90, 30, 16], [80, -30, 18], [-150, -40, 12], [150, 40, 12], [-40, -70, 10], [40, 70, 10]];
      return pts.map(([x, y, r], k) => mv(A, P(starD(x, y, r, 0.5), c, `stroke="${light(c, 0.5)}" stroke-width="2"`), aFade(0.3, 1.4 + k * 0.3, k * 0.4))).join('');
    },
  },
  littlestar: {
    draw: (c, A, i) => {
      const sad = c === 'sad';
      const col = sad ? '#fff0b0' : '#ffd84a';
      let s = mv(A, glowG(0, 0, sad ? 90 : 140, '#fff6c8', sad ? 0.5 : 0.8), aFade(0.6, 1.6));
      s += P(starD(0, 0, 54, 0.52), col, `stroke="${light(col, 0.5)}" stroke-width="5" stroke-linejoin="round"`);
      s += sad ? E(-14, -4, 5, 6.5, '#2d2240') + E(14, -4, 5, 6.5, '#2d2240') + P('M-8 16 Q0 10 8 16', 'none', SK('#7a2f4a', 3)) + P('M-16 6 C-20 13 -20 18 -16 18 C-12 18 -12 13 -16 6Z', '#8fd4ff')
        : P('M-20 -2 Q-14 -10 -8 -2 M8 -2 Q14 -10 20 -2', 'none', SK('#2d2240', 4)) + P('M-10 10 Q0 22 10 10Z', '#7a2f4a');
      s += E(-24, 8, 7, 4, '#ff9db5', op(0.7)) + E(24, 8, 7, 4, '#ff9db5', op(0.7));
      return mv(A, s, aMove(0, -10, 3, i));
    },
  },
  flower: { draw: (c = '#ff8fc5') => P('M0 0 Q-4 -30 0 -60', 'none', SK('#5fae5a', 5)) + P('M0 -26 Q-22 -34 -24 -18 Q-10 -14 0 -26Z', '#7fca7e') + flowerG(0, -66, 22, c), hold: [0.8, -20] },
  flowers: {
    draw: (c) => {
      const cols = c ? [c, '#ffd36b', c] : ['#ff8fc5', '#ffd36b', '#c99bff', '#ff9a6b', '#ffffff'];
      let s = '';
      [-60, -30, 0, 30, 60].forEach((x, k) => {
        const h = 40 + rnd(k * 5) * 30;
        s += P(`M${x} 0 Q${x - 4} ${-h / 2} ${x} ${-h}`, 'none', SK('#5fae5a', 4)) + flowerG(x, -h, 14 + rnd(k) * 4, cols[k % cols.length]);
      });
      return s + E(-36, -8, 18, 7, '#7fca7e') + E(34, -6, 18, 7, '#7fca7e');
    },
  },
  sunflower: {
    draw: (_c, A, i) => {
      let s = P('M0 0 Q-10 -150 0 -290', 'none', SK('#5fae5a', 12)) + G(at(-6, -120, 1, -30), E(-34, 0, 38, 16, '#6fbf72')) + G(at(-4, -190, 1, 25), E(34, 0, 38, 16, '#6fbf72'));
      let head = '';
      for (let k = 0; k < 16; k++) head += G(`rotate(${f((k * 360) / 16)})`, E(0, -62, 15, 30, k % 2 ? '#ffd23f' : '#ffc61a'));
      head += C(0, 0, 44, '#8a5a34') + C(0, 0, 36, '#9b6a40');
      for (let k = 0; k < 14; k++) head += C(Math.cos(k * 2.4) * (k * 2.4), Math.sin(k * 2.4) * (k * 2.4), 2.5, '#6b4226');
      head += P('M-18 -6 Q-12 -14 -6 -6 M6 -6 Q12 -14 18 -6', 'none', SK('#2d2240', 4)) + P('M-12 10 Q0 22 12 10', 'none', SK('#2d2240', 4)) + E(-24, 6, 7, 4, '#ff9db5', op(0.7)) + E(24, 6, 7, 4, '#ff9db5', op(0.7));
      s += G(at(0, -300), head);
      return mv(A, s, aTurn(2, 0, 0, 4, i));
    },
  },
  book: { draw: (c = '#7c6cff') => R(-30, -80, 60, 80, 6, c) + R(-30, -80, 10, 80, 4, dark(c, 0.2)) + R(-12, -64, 34, 6, 3, '#fff', op(0.8)) + R(-12, -52, 24, 5, 2.5, '#fff', op(0.6)) + P(starD(5, -26, 11, 0.5), '#ffd36b'), hold: [0.55, -40] },
  books: { draw: () => R(-46, -20, 92, 20, 4, '#7cc8ff') + R(-40, -16, 4, 12, 2, '#fff') + R(-38, -38, 80, 18, 4, '#ff8fb1') + R(-42, -56, 86, 18, 4, '#ffd36b') + R(-30, -52, 50, 4, 2, '#fff', op(0.7)) },
  chewedbook: {
    draw: (c = '#7cc89f') =>
      P('M-30 0 L-30 -80 L2 -80 Q6 -70 12 -74 Q14 -64 22 -66 Q22 -56 30 -54 L30 0Z', c) + R(-30, -80, 10, 80, 4, dark(c, 0.2)) + P('M30 -40 L40 -34 L34 -26 L40 -18 L30 -14', '#ffffff') +
      G(at(4, -30), P('M-14 6 L-6 -12 L4 -4 L10 -16 L16 0 L4 4 Z', '#9be07f', 'stroke="#5fae5a" stroke-width="2"')) + C(36, -60, 4, '#9fd8ff') + C(-36, -20, 3, '#9fd8ff'),
    hold: [0.55, -40],
  },
  bone: { draw: () => R(-26, -18, 52, 12, 6, '#ffffff', 'stroke="#e8dff0" stroke-width="2"') + C(-26, -20, 8, '#fff') + C(-26, -6, 8, '#fff') + C(26, -20, 8, '#fff') + C(26, -6, 8, '#fff'), hold: [0.7, -12] },
  ball: {
    draw: (_c, A, i) => {
      const s = C(0, -30, 30, '#ffffff') + P('M0 -30 L0 -60 A30 30 0 0 1 26 -45Z', '#ff6f91') + P('M0 -30 L26 -15 A30 30 0 0 1 -0 0Z', '#7cc8ff') + P('M0 -30 L-26 -15 A30 30 0 0 1 -26 -45Z', '#ffd36b') + C(0, -30, 6, '#ffffff') + C(-10, -44, 6, '#fff', op(0.6));
      return mv(A, s, aMove(0, -14, 0.9, i));
    },
    hold: [0.7, -30],
  },
  soccer: {
    draw: (_c, A, i) => {
      let s = C(0, -26, 26, '#ffffff', 'stroke="#3a3a4a" stroke-width="2"');
      const pent = (cx: number, cy: number, r: number) => P([0, 1, 2, 3, 4].map((k) => `${k ? 'L' : 'M'}${f(cx + Math.cos(-Math.PI / 2 + k * 1.2566) * r)} ${f(cy + Math.sin(-Math.PI / 2 + k * 1.2566) * r)}`).join('') + 'Z', '#3a3a4a');
      s += pent(0, -26, 9) + pent(-20, -40, 5) + pent(20, -40, 5) + pent(-16, -6, 5) + pent(16, -6, 5);
      return mv(A, s, aTurn(10, 0, -26, 1.5, i));
    },
    hold: [0.8, -26],
  },
  goal: {
    draw: () => {
      let s = '';
      for (let x = -110; x <= 110; x += 20) s += LN(x, -140, x, 0, '#ffffff', 1.5, op(0.7));
      for (let y = -140; y <= 0; y += 20) s += LN(-120, y, 120, y, '#ffffff', 1.5, op(0.7));
      return s + LN(-120, 0, -120, -150, '#ffffff', 8) + LN(120, 0, 120, -150, '#ffffff', 8) + LN(-120, -150, 120, -150, '#ffffff', 8);
    },
  },
  lantern: { draw: (c, A, i, p) => ((p.y ?? 0.88) < 0.7 ? LN(0, -94, 0, -700, '#8a6a4a', 2) : '') + lanternArt(c !== 'off', A, i), hold: [0.75, -90], handle: true },
  'lantern-off': { draw: (_c, A, i) => lanternArt(false, A, i), hold: [0.75, -90] },
  lanterns: { draw: (c, A) => [-70, -20, 30, 76].map((x, k) => G(at(x, k % 2 ? 6 : 0, 0.8 + (k % 2) * 0.2), lanternArt(c !== 'off', A, k))).join('') },
  'lanterns-off': { draw: (_c, A) => [-70, -20, 30, 76].map((x, k) => G(at(x, k % 2 ? 6 : 0, 0.8 + (k % 2) * 0.2), lanternArt(false, A, k))).join('') },
  map: {
    draw: () =>
      P('M-60 -80 Q-30 -86 0 -80 Q30 -74 60 -80 L60 -6 Q30 0 0 -6 Q-30 -12 -60 -6Z', '#fbe8c0') + R(-68, -84, 14, 82, 7, '#e8cf9a') + R(54, -84, 14, 82, 7, '#e8cf9a') +
      P('M-40 -26 Q-20 -60 6 -40 T36 -56', 'none', SK('#c46a4a', 3, 'stroke-dasharray="6 6"')) + P('M30 -64 L42 -50 M42 -64 L30 -50', 'none', SK('#e8455f', 5)) + E(-36, -24, 14, 8, '#9be07f') + LN(-36, -28, -36, -40, '#8a6a4a', 2) + E(-36, -42, 8, 5, '#5fae5a'),
    hold: [0.6, -40],
  },
  key: {
    draw: (_c, A, i) => mv(A, C(-30, -22, 16, 'none', SK('#ffc21a', 8)) + R(-16, -26, 52, 9, 4, '#ffd23f') + R(24, -26, 8, 20, 2, '#ffd23f') + R(34, -26, 6, 14, 2, '#ffd23f') + P(sparkleD(-40, -44, 8), '#fff'), aMove(0, -4, 2, i)),
    hold: [0.6, -22],
  },
  seed: { draw: (_c, A) => mv(A, P(sparkleD(14, -24, 7), '#fff6a8') + P(sparkleD(-14, -28, 5), '#fff6a8'), aFade(0.2, 1.4)) + P('M0 -20 C-9 -12 -8 0 0 0 C8 0 9 -12 0 -20Z', '#9a6a40') + E(-2, -8, 2, 4, '#fff', op(0.4)), hold: [1, -10] },
  mound: { draw: () => P('M-56 0 Q-30 -30 0 -30 Q30 -30 56 0Z', '#a8754f') + C(-20, -14, 3, '#8a5a3c') + C(14, -20, 3, '#8a5a3c') + C(30, -8, 2.5, '#8a5a3c') },
  sprout: {
    draw: (_c, A, i) => P('M-56 0 Q-30 -30 0 -30 Q30 -30 56 0Z', '#a8754f') + C(-24, -12, 3, '#8a5a3c') + C(28, -10, 3, '#8a5a3c') +
      mv(A, P('M0 -26 Q-2 -44 2 -58', 'none', SK('#5fae5a', 5)) + P('M2 -56 Q-20 -72 -26 -56 Q-12 -48 2 -56Z', '#8fd36f') + P('M2 -54 Q22 -70 28 -54 Q14 -46 2 -54Z', '#7fca7e'), aTurn(5, 0, -26, 2.5, i)),
  },
  wateringcan: {
    draw: (c = '#7cc8ff') => R(-30, -48, 60, 48, 12, c) + P('M28 -36 L66 -64 L70 -58 L32 -24Z', c) + E(70, -64, 8, 6, dark(c, 0.15)) + P('M-28 -40 Q-50 -40 -48 -22 Q-46 -10 -28 -12', 'none', SK(dark(c, 0.15), 6)) + R(-24, -50, 48, 8, 4, dark(c, 0.15)) + P(heartD(0, -32, 10), '#ffffff', op(0.8)),
    hold: [0.6, -40],
  },
  strawberry: {
    draw: (c = '#ff5a6e') => {
      let s = P('M0 0 C-46 -22 -60 -70 -30 -86 C-14 -94 -4 -88 0 -84 C4 -88 14 -94 30 -86 C60 -70 46 -22 0 0Z', c);
      for (let k = 0; k < 12; k++) s += E(-30 + (k % 4) * 20 + (Math.floor(k / 4) % 2) * 10, -70 + Math.floor(k / 4) * 20, 2, 3.5, '#ffe98a');
      return s + P(starD(0, -88, 22, 0.4, 6), '#5fbf6a') + LN(0, -92, 4, -108, '#5fae5a', 4) + E(-22, -62, 7, 12, '#fff', op(0.35));
    },
    hold: [0.5, -44],
  },
  squashed: {
    draw: () => {
      let s = P('M-80 0 Q-90 -12 -60 -16 Q-50 -30 -20 -20 Q0 -34 26 -20 Q60 -30 70 -12 Q96 -8 80 0Z', '#ff5a6e') + C(-96, -10, 6, '#ff5a6e') + C(100, -14, 5, '#ff5a6e') + C(-60, -30, 4, '#ff5a6e');
      for (let k = 0; k < 8; k++) s += E(-56 + k * 16, -8 - (k % 2) * 6, 2, 3, '#ffe98a');
      return s + P(starD(30, -22, 16, 0.4, 6), '#5fbf6a', 'transform="scale(1 0.6) translate(0 -14)"');
    },
  },
  butterfly: {
    draw: (c = '#ff9ec7', A, i) => {
      const wings = P('M0 0 C-14 -24 -34 -16 -26 0 C-18 10 -6 6 0 0Z M0 0 C14 -24 34 -16 26 0 C18 10 6 6 0 0Z', c) + P('M0 2 C-12 10 -18 22 -10 22 C-4 22 0 12 0 2Z M0 2 C12 10 18 22 10 22 C4 22 0 12 0 2Z', dark(c, 0.12)) + C(-14, -6, 4, '#fff', op(0.6)) + C(14, -6, 4, '#fff', op(0.6));
      return mv(A, mv(A, wings, aScale(0.3, 1, 0.4)) + R(-2, -10, 4, 26, 2, '#4a3f5e') + P('M-1 -10 q-6 -10 -10 -12 M1 -10 q6 -10 10 -12', 'none', SK('#4a3f5e', 1.5)), aMove(30, -20, 3, i));
    },
  },
  bird: {
    draw: (c = '#7cc8ff') => E(0, -24, 22, 20, c) + E(4, -18, 13, 11, '#e8f6ff') + C(-10, -38, 13, c) + C(-14, -40, 3, '#2d2240') + C(-13, -41, 1, '#fff') + P('M-24 -38 L-34 -35 L-24 -32Z', '#ffa94d') + P('M18 -30 L34 -40 L30 -24Z', dark(c, 0.15)) + LN(-4, -4, -6, 0, '#ffa94d', 3) + LN(6, -4, 6, 0, '#ffa94d', 3) + E(-4, -30, 4, 2.5, '#ff9db5', op(0.6)),
  },
  birds: {
    draw: (_c, A) => [[-60, 0], [0, -30], [50, 10]].map(([x, y], k) => mv(A, P(`M${x - 14} ${y} q7 -9 14 0 q7 -9 14 0`, 'none', SK('#5a4a6a', 4)), aMove(20, -8, 2 + k * 0.4, k))).join(''),
  },
  jam: {
    draw: (c = '#e8455f') => R(-24, -56, 48, 56, 10, c) + R(-24, -56, 48, 56, 10, '#ffffff', op(0.15)) + R(-18, -50, 8, 40, 4, '#fff', op(0.35)) + P('M-30 -56 Q-28 -70 0 -72 Q28 -70 30 -56 L24 -50 L-24 -50Z', '#ffffff') + C(-14, -62, 3, '#ff6f91') + C(0, -64, 3, '#ff6f91') + C(14, -62, 3, '#ff6f91') + R(-26, -56, 52, 6, 3, '#ff9ec7') + R(-15, -38, 30, 18, 4, '#ffffff') + P(heartD(0, -35, 8), c),
    hold: [0.7, -30],
  },
  ribbon: {
    draw: () => {
      let s = P('M-14 -50 L-26 0 L-14 -8 L-4 2 L4 -40Z M14 -50 L26 0 L14 -8 L4 2 L-4 -40Z', '#3f7fdc');
      for (let k = 0; k < 12; k++) s += C(Math.cos(k * 0.5236) * 26, -60 + Math.sin(k * 0.5236) * 26, 11, '#4f8bff');
      return s + C(0, -60, 22, '#7cb0ff') + C(0, -60, 15, '#ffd36b') + P(starD(0, -60, 9, 0.5), '#ffffff');
    },
    hold: [0.6, -60],
  },
  notes: { draw: (_c, A) => [[-50, 0, '#ff6f91'], [10, -40, '#7c6cff'], [60, 10, '#3fa58a']].map(([x, y, c], k) => mv(A, musicNote(x as number, y as number, c as string, 0.9), aRise(10 + k * 6, -60, 3 + k * 0.5, k))).join('') },
  umbrella: {
    draw: (c = '#ff7eb6') => LN(0, -140, 0, -6, '#6a5a8a', 4) + P('M0 -6 Q0 6 -12 4', 'none', SK('#6a5a8a', 5)) + P('M-80 -128 Q-76 -200 0 -204 Q76 -200 80 -128 Q60 -142 40 -128 Q20 -142 0 -128 Q-20 -142 -40 -128 Q-60 -142 -80 -128Z', c) +
      P('M-40 -128 Q-34 -190 0 -204 Q-14 -170 -20 -134Z M40 -128 Q34 -190 0 -204 Q14 -170 20 -134Z', '#ffffff', op(0.5)) + C(0, -206, 5, dark(c, 0.2)),
    hold: [0.9, -20], handle: true,
  },
  kite: {
    draw: (c = '#7cc8ff', A, i, p) => {
      let s = '';
      const low = (p.y ?? 0.88) > 0.6;
      if (!low) s += P('M20 24 Q60 140 170 330', 'none', SK('#ffffff', 2, op(0.9)));
      let fish = P('M-70 0 Q-40 -44 20 -36 L60 -10 L92 -40 L86 0 L92 40 L60 10 L20 36 Q-40 44 -70 0Z', c);
      for (let k = 0; k < 3; k++) fish += P(`M${-20 + k * 22} -26 Q${-10 + k * 22} 0 ${-20 + k * 22} 26`, 'none', SK(light(c, 0.4), 4));
      fish += C(-46, -6, 9, '#ffffff') + C(-46, -6, 5, '#2d2240') + P('M-66 8 Q-60 14 -54 10', 'none', SK('#2d2240', 3)) + E(-40, 12, 6, 3.5, '#ff9db5', op(0.7));
      fish += P('M88 0 q20 10 40 0 t40 0', 'none', SK('#ffd36b', 4)) + P('M88 4 q20 18 46 14', 'none', SK('#ff9ec7', 4));
      s += mv(A, fish, aTurn(6, 0, 0, 2.2, i));
      return mv(A, s, aMove(0, -14, 3, i));
    },
  },
  puddle: { draw: () => E(0, -8, 84, 16, '#a9d8f5') + E(-10, -10, 52, 7, '#d6f0ff') + E(30, -6, 14, 3, '#ffffff', op(0.7)), back: true },
  drum: {
    draw: (c = '#ff6f91') => R(-32, -52, 64, 48, 8, c) + E(0, -4, 32, 8, dark(c, 0.15)) + E(0, -52, 32, 9, '#fff3e6') + P('M-30 -46 L-14 -10 L0 -46 L14 -10 L30 -46', 'none', SK('#ffd36b', 3)) + LN(-20, -80, 6, -56, '#c9945f', 5) + C(-20, -80, 5, '#ffffff') + LN(24, -82, 0, -58, '#c9945f', 5) + C(24, -82, 5, '#ffffff'),
    hold: [0.65, -28],
  },
  muffins: {
    draw: () => {
      let s = P('M-50 -30 Q-58 -80 0 -82 Q58 -80 50 -30', 'none', SK('#c9945f', 5)) + P('M-56 -34 L56 -34 L46 0 L-46 0Z', '#e0a86a');
      for (let k = 0; k < 3; k++) s += LN(-50 + k * 4, -24 + k * 10, 50 - k * 4, -24 + k * 10, '#c9945f', 2);
      for (const x of [-26, 0, 26]) s += P(`M${x - 13} -34 L${x - 10} -46 L${x + 10} -46 L${x + 13} -34Z`, '#ff9ec7') + C(x, -52, 14, '#e8b06a') + C(x - 5, -56, 2.6, '#5a5aa8') + C(x + 5, -50, 2.6, '#5a5aa8') + C(x + 2, -60, 2.6, '#5a5aa8');
      return s;
    },
    hold: [0.6, -60],
  },
  apple: { draw: () => apple(0, -14), hold: [0.9, -14] },
  apples: { draw: () => [[-80, -10], [-40, -6], [10, -12], [50, -4], [90, -10], [-10, -30]].map(([x, y]) => apple(x, y + 2, 13)).join(''), back: true },
  basket: {
    draw: () => P('M-46 -34 Q-50 -76 0 -78 Q50 -76 46 -34', 'none', SK('#b07a50', 5)) + apple(-18, -40, 12) + apple(8, -44, 12) + apple(26, -38, 11, '#9be07f') + P('M-50 -36 L50 -36 L42 0 L-42 0Z', '#d99a5a') + LN(-46, -24, 46, -24, '#b07a50', 2) + LN(-44, -12, 44, -12, '#b07a50', 2),
    hold: [0.6, -60],
  },
  shells: { draw: () => P('M-60 -2 Q-48 -26 -36 -2Z', '#ffd1dc') + P('M-54 -4 L-48 -20 M-48 -4 L-48 -22 M-42 -4 L-48 -20', 'none', SK('#ff9ec7', 1.5)) + P(starD(0, -10, 12, 0.5), '#ff9a6b') + P('M40 -2 Q46 -22 60 -14 Q56 -2 40 -2Z', '#fff3e0'), back: true },
  towel: { draw: () => P('M-120 0 L-90 -30 L120 -30 L96 0Z', '#7cc8ff') + P('M-110 -10 L106 -10 L100 -4 L-104 -4Z M-100 -20 L114 -20 L110 -14 L-96 -14Z', '#ffffff'), back: true },
  bubbles: { draw: (_c, A) => [[0, 0, 10], [-20, -30, 7], [16, -50, 12], [-6, -80, 6], [24, -100, 8]].map(([x, y, r], k) => mv(A, C(x, y, r, '#ffffff', 'fill-opacity="0.25" stroke="#ffffff" stroke-width="2"') + C(x - r * 0.3, y - r * 0.3, r * 0.25, '#fff'), aRise(6, -60, 2.4, k * 0.5))).join('') },
  crab: {
    draw: (c = '#ff7b6b', A, i) => {
      const claw = (sd: number) => mv(A, G(at(sd * 34, -24), LN(0, 0, sd * 10, -20, c, 6) + P(`M${sd * 10} -20 q${sd * 14} -14 ${sd * 4} -26 q${sd * -6} 8 ${sd * -10} 4Z`, c)), aTurn(10, sd * 34, -24, 0.8, i + sd));
      let s = claw(-1) + claw(1);
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) s += LN(sd * 20, -14, sd * (32 + k * 4), -2 + k * 2, c, 4);
      s += E(0, -20, 32, 18, c) + LN(-10, -34, -12, -48, c, 4) + LN(10, -34, 12, -48, c, 4) + C(-12, -50, 7, '#fff') + C(12, -50, 7, '#fff') + C(-12, -50, 3.5, '#2d2240') + C(12, -50, 3.5, '#2d2240');
      return s + P('M-8 -14 Q0 -8 8 -14', 'none', SK('#7a2f4a', 3)) + E(-18, -16, 5, 3, '#ffc2c2', op(0.8)) + E(18, -16, 5, 3, '#ffc2c2', op(0.8));
    },
  },
  fish: {
    draw: (c = '#ffd36b', A, i) =>
      mv(A, E(0, 0, 34, 22, c) + P('M28 0 L56 -20 L52 0 L56 20Z', c) + P('M-4 -20 Q8 0 -4 20 M10 -18 Q20 0 10 18', 'none', SK(light(c, 0.4), 4)) + C(-16, -4, 6, '#fff') + C(-17, -4, 3.5, '#2d2240') + P('M-32 6 Q-26 10 -22 6', 'none', SK('#7a2f4a', 2.5)), aMove(-40, 8, 4, i)),
  },
  puffer: {
    draw: (_c, A, i) => {
      let s = '';
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        s += P(`M${f(Math.cos(a - 0.12) * 50)} ${f(Math.sin(a - 0.12) * 50)} L${f(Math.cos(a) * 64)} ${f(Math.sin(a) * 64)} L${f(Math.cos(a + 0.12) * 50)} ${f(Math.sin(a + 0.12) * 50)}Z`, '#f2b33a');
      }
      s += C(0, 0, 52, '#ffd36b') + E(0, 18, 36, 24, '#fff3c4') + C(-18, -12, 11, '#fff') + C(18, -12, 11, '#fff') + C(-16, -11, 6, '#2d2240') + C(20, -11, 6, '#2d2240') + E(0, 12, 7, 9, '#7a2f4a') + E(-32, 6, 8, 5, '#ff9db5', op(0.7)) + E(32, 6, 8, 5, '#ff9db5', op(0.7));
      s += P('M50 0 L70 -14 L70 14Z', '#f2b33a');
      return mv(A, mv(A, s, aScale(1.08, 1.08, 1.4, i)), aMove(10, -10, 3, i));
    },
  },
  chest: {
    draw: () => {
      let s = R(-62, -70, 124, 70, 8, '#b9774a') + P('M-62 -66 Q-62 -110 0 -110 Q62 -110 62 -66Z', '#c98a58');
      s += R(-62, -72, 124, 10, 3, '#ffd36b') + R(-46, -110, 12, 110, 3, '#ffd36b') + R(34, -110, 12, 110, 3, '#ffd36b') + R(-10, -78, 20, 24, 4, '#ffd36b') + C(0, -68, 3.5, '#8a5a3c');
      for (let k = 0; k < 5; k++) s += C(-50 + rnd(k) * 100, -20 - rnd(k * 3) * 70, 4 + rnd(k * 5) * 3, '#d9d4e6');
      return s + LN(-62, -40, 62, -40, '#a0653c', 2);
    },
  },
  'chest-open': {
    draw: (_c, A) => {
      let s = mv(A, glowG(0, -80, 140, '#fff3b0', 0.8), aFade(0.6, 2));
      s += P('M-62 -66 L-70 -150 Q0 -170 70 -150 L62 -66Z', '#a8693f') + P('M-56 -74 L-62 -140 Q0 -156 62 -140 L56 -74Z', '#8a5232');
      for (let k = 0; k < 16; k++) s += coinG(-48 + (k % 8) * 14, -70 - Math.floor(k / 8) * 10 - (k % 3) * 3, 9);
      s += G(at(18, -96, 1, 12), R(-14, -10, 28, 20, 3, '#fbe8c0') + LN(-8, -3, 8, -3, '#c9945f', 2) + LN(-8, 3, 6, 3, '#c9945f', 2));
      s += R(-62, -70, 124, 70, 8, '#b9774a') + R(-62, -72, 124, 10, 3, '#ffd36b') + R(-46, -70, 12, 70, 3, '#ffd36b') + R(34, -70, 12, 70, 3, '#ffd36b') + LN(-62, -40, 62, -40, '#a0653c', 2);
      for (let k = 0; k < 4; k++) s += mv(A, P(sparkleD(-60 + k * 40, -150 + (k % 2) * 30, 10), '#ffffff'), aFade(0.1, 1.2, k * 0.3));
      return s;
    },
  },
  coin: { draw: () => coinG(0, -14, 14), hold: [0.9, -14] },
  coins: { draw: () => [[-40, -8], [-20, -6], [0, -8], [20, -6], [40, -8], [-30, -18], [-10, -18], [10, -18], [30, -18], [-20, -28], [0, -28], [20, -28], [0, -38]].map(([x, y]) => coinG(x, y, 11)).join('') },
  bottle: { draw: () => G(at(0, -16, 1, -14), R(-40, -16, 70, 32, 14, '#bff0e6', op(0.85)) + R(30, -8, 18, 16, 4, '#bff0e6', op(0.85)) + R(46, -9, 10, 18, 3, '#c9945f') + R(-26, -10, 46, 20, 8, '#fbe8c0') + R(-34, -12, 30, 6, 3, '#fff', op(0.6))), back: true },
  poster: {
    draw: () => R(-5, -200, 10, 200, 5, '#8a7aa8') + R(-50, -190, 100, 120, 6, '#ffffff', 'stroke="#ffd36b" stroke-width="4"') + T(0, -166, 'Lost', 20, '#e8455f') + T(0, -146, 'Puppy', 18, '#e8455f') +
      E(0, -106, 12, 10, '#c48a5a') + C(-14, -122, 5, '#c48a5a') + C(-5, -127, 5, '#c48a5a') + C(5, -127, 5, '#c48a5a') + C(14, -122, 5, '#c48a5a'),
  },
  pawprints: {
    draw: () => {
      let s = '';
      for (let k = 0; k < 6; k++) {
        const x = k * 56;
        const y = -6 - (k % 2) * 16;
        s += E(x, y, 10, 8, '#8a5a3c', op(0.7)) + C(x - 9, y - 11, 4, '#8a5a3c', op(0.7)) + C(x, y - 14, 4, '#8a5a3c', op(0.7)) + C(x + 9, y - 11, 4, '#8a5a3c', op(0.7));
      }
      return s;
    },
    back: true,
  },
  hay: {
    draw: () => {
      let s = P('M-120 0 Q-120 -100 0 -110 Q120 -100 120 0Z', '#ffd66b');
      for (let k = 0; k < 16; k++) {
        const x = -100 + rnd(k) * 200;
        const y = -10 - rnd(k * 3) * 80;
        s += LN(x, y, x + 10 - rnd(k * 5) * 20, y - 14, '#e8b84a', 3);
      }
      return s + P('M-60 -96 Q-40 -120 -30 -100 M40 -100 Q60 -124 66 -96', 'none', SK('#e8b84a', 3));
    },
  },
  ducklings: {
    draw: (_c, A) => [-34, 0, 34].map((x, k) => mv(A, G(at(x, 0), E(0, -12, 14, 12, '#ffe98a') + C(-6, -26, 9, '#ffe98a') + C(-9, -28, 1.8, '#2d2240') + P('M-14 -26 L-21 -24 L-14 -22Z', '#ffa94d') + P('M10 -16 L18 -22 L14 -10Z', '#ffd84a')), aMove(0, -4, 0.8 + k * 0.15, k))).join(''),
  },
  trophy: {
    draw: (_c, A) =>
      R(-30, -16, 60, 16, 4, '#a77fd6') + R(-8, -40, 16, 26, 4, '#ffd23f') + P('M-34 -100 L34 -100 Q34 -44 0 -40 Q-34 -44 -34 -100Z', '#ffd23f') + P('M-34 -92 Q-56 -92 -50 -70 Q-46 -60 -30 -60 M34 -92 Q56 -92 50 -70 Q46 -60 30 -60', 'none', SK('#ffc21a', 6)) +
      P(starD(0, -74, 14, 0.5), '#fff6c8') + mv(A, P(sparkleD(30, -108, 10), '#ffffff'), aFade(0.1, 1.2)),
    hold: [0.55, -60],
  },
  rocket: {
    draw: () => {
      let s = P('M-50 -50 L-90 0 L-50 -10Z M50 -50 L90 0 L50 -10Z', '#7cc8ff') + R(-52, -250, 104, 250, 30, '#d9a06b') + R(-52, -250, 104, 250, 30, '#ffffff', op(0.08));
      s += P('M-52 -230 Q-52 -300 0 -330 Q52 -300 52 -230Z', '#ff6f91') + R(-52, -150, 104, 14, 0, '#c48a5a', op(0.5)) + R(-52, -62, 104, 14, 0, '#c48a5a', op(0.5));
      s += C(0, -190, 28, '#ffffff') + C(0, -190, 21, '#bfe9ff') + E(-8, -198, 6, 4, '#fff', op(0.7));
      s += P(starD(-24, -100, 12, 0.5), '#ffd36b') + P(heartD(22, -112, 10), '#ff6f91') + C(-12, -30, 6, '#ff6f91') + C(10, -30, 6, '#9be07f') + C(32, -30, 6, '#7cc8ff');
      return s + R(-36, 0, 72, 6, 3, '#c48a5a', op(0.5));
    },
  },
  'rocket-fly': {
    draw: (_c, A) => {
      let s = mv(A, E(0, 20, 30, 56, '#ffb347') + E(0, 10, 18, 36, '#ffe066'), aScale(1.05, 1.2, 0.3));
      s += C(-40, 70, 26, '#ffffff', op(0.8)) + C(40, 80, 22, '#ffffff', op(0.8)) + C(0, 96, 30, '#ffffff', op(0.8));
      s += P('M-50 -50 L-90 0 L-50 -10Z M50 -50 L90 0 L50 -10Z', '#7cc8ff') + R(-52, -250, 104, 250, 30, '#d9a06b') + P('M-52 -230 Q-52 -300 0 -330 Q52 -300 52 -230Z', '#ff6f91');
      s += C(0, -170, 30, '#ffffff') + C(0, -170, 24, '#bfe9ff') + E(-10, -196, 5, 14, '#ece2f7') + E(0, -196, 5, 14, '#ece2f7') + C(-5, -170, 13, '#ece2f7') + C(10, -170, 12, '#d69068') + P('M0 -184 Q10 -192 20 -182', '#2b1d1a');
      s += P(starD(-24, -100, 12, 0.5), '#ffd36b') + P(heartD(22, -112, 10), '#ff6f91');
      return mv(A, s, aMove(0, -16, 1.2));
    },
  },
  carrot: { draw: (_c, A, i) => mv(A, G(at(0, 0, 1, 30), P('M-12 -20 L12 -20 L0 30Z', '#ff9a3c') + LN(-6, -6, 2, -8, '#e07a2a', 2) + LN(-2, 8, 4, 6, '#e07a2a', 2) + P('M0 -20 L-10 -40 M0 -20 L0 -44 M0 -20 L10 -40', 'none', SK('#5fbf6a', 5))), aSpin(6)), hold: [0.8, 0] },
  sandwich: { draw: (_c, A) => mv(A, P('M-30 20 L30 20 L0 -30Z', '#f5d9a0') + P('M-26 14 L26 14', 'none', SK('#7fca7e', 6)) + P('M-22 8 L22 8', 'none', SK('#ff9ec7', 4)) + P('M-30 20 L30 20 L0 -30Z', 'none', SK('#d9a96a', 4)), aSpin(9, true)) },
  planet: { draw: (c = '#ffb38a') => planetG(0, 0, 44, c, '#ffe0c2') },
  shootingstar: {
    draw: (_c, A) => {
      const s = P('M0 0 L180 -40 L180 -20Z', '#fff6c8', op(0.5)) + P('M0 0 L140 -20 L140 -6Z', '#ffffff', op(0.7)) + P(starD(0, 0, 18, 0.5), '#fff2a8');
      return A ? `<g>${s}<animateTransform attributeName="transform" type="translate" values="200 -40;-200 60" ${rep(3)}/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.7;1" ${rep(3)}/></g>` : s;
    },
  },
  rocketsled: {
    draw: () =>
      LN(-90, -2, 80, -2, '#ff4f6b', 6) + P('M80 -2 Q104 -2 100 -24', 'none', SK('#ff4f6b', 6)) + LN(-60, -2, -60, -14, '#ff4f6b', 5) + LN(40, -2, 40, -14, '#ff4f6b', 5) +
      P('M-96 -14 L80 -14 Q100 -14 100 -30 L-84 -30 Q-96 -30 -96 -14Z', '#ffd36b') + P('M-96 -18 L-120 -40 L-90 -30Z', '#7cc8ff') + P(starD(-40, -22, 6, 0.5), '#ff6f91') + P(starD(20, -22, 6, 0.5), '#ff6f91') + C(70, -22, 5, '#ffffff'),
    seat: 30,
  },
  'basket-sled': {
    draw: () => P('M-84 -50 Q-90 -6 -70 0 L70 0 Q90 -6 84 -50Z', '#5fbfb0') + E(0, -50, 84, 12, '#4aa89a'),
    seat: 14,
    front: () => {
      let s = P('M-84 -50 Q-90 -6 -70 0 L70 0 Q90 -6 84 -50 Q0 -36 -84 -50Z', '#7fd0c0');
      for (let k = 0; k < 7; k++) for (let j = 0; j < 2; j++) s += R(-66 + k * 20, -36 + j * 16, 10, 8, 3, '#5fbfb0');
      return s + R(-92, -56, 20, 10, 5, '#5fbfb0') + R(72, -56, 20, 10, 5, '#5fbfb0');
    },
  },
  snowman: {
    draw: (c) => {
      let s = E(0, -4, 50, 8, '#dbe7f6') + C(0, -44, 44, '#ffffff') + C(0, -116, 34, '#ffffff') + C(0, -172, 26, '#ffffff') + C(-10, -180, 3.5, '#2d2240') + C(10, -180, 3.5, '#2d2240') + P('M0 -172 L26 -168 L0 -166Z', '#ff9a3c');
      s += [-10, -4, 4, 10].map((x, k) => C(x, -158 + (k === 1 || k === 2 ? 3 : 0), 2.2, '#2d2240')).join('') + C(0, -124, 4, '#2d2240') + C(0, -104, 4, '#2d2240');
      s += LN(-32, -120, -70, -146, '#9a6a44', 5) + LN(32, -120, 70, -142, '#9a6a44', 5) + R(-28, -150, 56, 12, 6, '#ff6f91') + R(10, -146, 12, 30, 5, '#ff6f91');
      s += c ? P('M-26 -190 Q-26 -226 0 -228 Q26 -226 26 -190Z', c) + R(-28, -196, 56, 12, 6, dark(c, 0.15)) + C(0, -232, 9, '#ffffff') : R(-22, -230, 44, 36, 4, '#3a2f52') + R(-32, -198, 64, 8, 4, '#3a2f52');
      return s;
    },
  },
  drift: { draw: () => P('M-130 0 Q-120 -60 -50 -66 Q0 -90 50 -64 Q120 -60 130 0Z', '#ffffff') + P('M-90 -20 Q-40 -34 10 -24', 'none', SK('#dbe7f6', 6)) + P('M30 -40 Q70 -46 100 -26', 'none', SK('#dbe7f6', 5)) },
  finish: {
    draw: (_c, A) => {
      let s = LN(-150, 0, -150, -230, '#ffffff', 8) + LN(150, 0, 150, -230, '#ffffff', 8);
      for (let k = 0; k < 15; k++) for (let j = 0; j < 2; j++) s += R(-150 + k * 20, -224 + j * 20, 20, 20, 0, (k + j) % 2 ? '#3a2f52' : '#ffffff');
      s += mv(A, P('M-150 -230 l30 8 l-30 8Z', '#ff6f91'), aScale(0.8, 1, 1)) + mv(A, P('M150 -230 l-30 8 l30 8Z', '#7cc8ff'), aScale(0.8, 1, 1.1));
      return s;
    },
  },
  wind: { draw: (_c, A) => [0, 1, 2].map((k) => mv(A, P(`M${-120 + k * 30} ${k * 40} q60 -30 120 0 t100 -10 q20 -20 0 -30`, 'none', SK('#ffffff', 5, op(0.85))), aMove(40, 0, 1.6 + k * 0.3, k * 0.4))).join('') },
  juggle: {
    draw: (_c, A) => {
      const apples = apple(-60, 0, 16) + apple(0, -60, 16) + apple(60, 0, 16);
      return P('M-60 0 Q0 -100 60 0', 'none', SK('#ffffff', 3, `${op(0.6)} stroke-dasharray="6 8"`)) + (A ? `<g transform="translate(0 0)">${G(at(0, 0), `<g>${apples}<animateTransform attributeName="transform" type="rotate" values="0 0 -10;360 0 -10" ${rep(2.4)}/></g>`)}</g>` : apples);
    },
  },
  magichat: {
    draw: (_c, A) =>
      E(0, -6, 56, 12, '#3a2f52') + R(-36, -90, 72, 84, 6, '#4a3f66') + R(-36, -40, 72, 14, 0, '#ff6f91') + E(0, -90, 36, 8, '#5a4f76') + LN(24, -100, 70, -150, '#3a2f52', 6) + LN(64, -142, 70, -150, '#ffffff', 6) +
      mv(A, P(sparkleD(78, -164, 14), '#ffd36b') + P(sparkleD(50, -180, 8), '#fff') + P(sparkleD(96, -130, 7), '#fff'), aFade(0.2, 1)),
  },
  violin: {
    draw: () => G(at(0, 0, 1, -30), E(0, -24, 18, 22, '#c97a3e') + E(0, -56, 14, 16, '#c97a3e') + R(-4, -110, 8, 50, 3, '#5a3a2a') + C(0, -114, 6, '#5a3a2a') + P('M-6 -34 q-4 6 0 12 M6 -34 q4 6 0 12', 'none', SK('#5a3a2a', 2)) + LN(-2, -104, -2, -8, '#fff6c8', 1) + LN(2, -104, 2, -8, '#fff6c8', 1)) + LN(-40, -80, 40, -20, '#c9a06b', 3),
    hold: [0.7, -40],
  },
  sparkles: { draw: (c = '#ffd36b', A) => [[0, 0, 18], [-60, -30, 10], [50, -50, 12], [-30, 40, 8], [70, 30, 9], [-80, 30, 6], [20, 60, 7]].map(([x, y, r], k) => mv(A, P(sparkleD(x, y, r), k % 2 ? '#ffffff' : c), aFade(0.1, 1 + k * 0.2, k * 0.3))).join('') },
  confetti: {
    draw: (_c, A) => {
      let s = '';
      for (let k = 0; k < 40; k++) {
        const x = -420 + rnd(k * 3) * 840;
        const y = -140 + rnd(k * 7) * 280;
        const c = PAL[k % PAL.length];
        const piece = k % 3 ? R(x, y, 10, 6, 2, c, `transform="rotate(${f(rnd(k) * 180)} ${f(x)} ${f(y)})"`) : C(x, y, 4, c);
        s += mv(A, piece, aMove(rnd(k) * 20 - 10, 30, 2 + rnd(k * 5) * 2, rnd(k) * 2));
      }
      return s;
    },
  },
  hearts: { draw: (c = '#ff6f91', A) => [[0, 0, 22], [-60, 20, 14], [60, 10, 16], [-30, -50, 12], [40, -60, 10]].map(([x, y, s2], k) => mv(A, P(heartD(x, y, s2), k % 2 ? '#ff9ec7' : c), aMove(0, -14, 1.6 + k * 0.3, k * 0.3))).join('') },
  fireflies: {
    draw: (_c, A) => {
      let s = '';
      for (let k = 0; k < 14; k++) {
        const x = -320 + rnd(k * 3) * 640;
        const y = -160 + rnd(k * 7) * 260;
        const dot = C(x, y, 14, '#fff6a0', op(0.3)) + C(x, y, 5, '#fffbd0');
        s += A ? `<g>${mv(true, dot, aFade(0.1, 1.2 + rnd(k) * 1.5, rnd(k * 9) * 2))}${aMove(rnd(k) * 40 - 20, rnd(k * 2) * 30 - 15, 3 + rnd(k) * 3, k)}</g>` : dot;
      }
      return s;
    },
  },
  sparks: {
    draw: (_c, A) => {
      let s = mv(A, glowG(0, 0, 130, '#ffd36b', 0.5), aFade(0.5, 1.2));
      for (let k = 0; k < 14; k++) {
        const x = -120 + rnd(k * 3) * 240;
        const y = -80 + rnd(k * 7) * 160;
        s += mv(A, P(sparkleD(x, y, 6 + rnd(k) * 10), k % 3 ? '#ffd36b' : '#ff9f43') + C(x, y, 12, '#fff3b0', op(0.3)), aFade(0.1, 0.8 + rnd(k) * 1, k * 0.2));
      }
      return s;
    },
  },
  litter: {
    draw: () =>
      G(at(-40, -10, 1, -20), R(-26, -8, 44, 16, 7, '#9fd8ff', op(0.85)) + R(16, -5, 10, 10, 3, '#4f9dff')) + P('M0 -8 L14 -20 L26 -10 L20 2 L6 4Z', '#ffd36b') + P('M4 -10 L20 -12', 'none', SK('#ff6f91', 2)) +
      G(at(52, -8, 1, 30), R(-12, -16, 24, 30, 5, '#ff8fb1') + R(-12, -10, 24, 6, 0, '#ffffff')) + P('M-80 -4 L-66 -14 L-56 -2Z', '#c99bff'),
  },
  bag: { draw: () => P('M-32 0 Q-40 -50 -12 -64 L-6 -76 L6 -76 L12 -64 Q40 -50 32 0Z', '#5f8a6a') + P('M-8 -70 Q0 -82 8 -70', 'none', SK('#ffd36b', 4)) + P('M-14 -40 Q-20 -20 -16 -8', 'none', SK('#7fa88a', 3)), hold: [0.6, -70] },
  sock: { draw: () => P('M-10 -70 L10 -70 L10 -20 Q30 -18 30 -6 Q30 4 6 2 L-10 2Z', '#ff9ec7') + R(-10, -70, 20, 10, 2, '#ffffff') + R(-10, -48, 20, 8, 0, '#ffffff') + R(-10, -30, 20, 6, 0, '#ffffff'), hold: [0.6, -64] },
  bin: {
    draw: () =>
      P('M-38 -96 L38 -96 L32 0 L-32 0Z', '#5fbf6a') + R(-44, -108, 88, 16, 6, '#4aa85a') + R(-12, -116, 24, 8, 4, '#4aa85a') +
      P('M0 -76 L14 -52 L-14 -52Z', 'none', SK('#ffffff', 5)) + P('M14 -52 l2 -10 M-14 -52 l9 4 M0 -76 l-8 6', 'none', SK('#ffffff', 4)),
  },
  sign: {
    draw: (c = '#d9a06b', _A, _i, p) => {
      const words = (p.text ?? 'Hello').split(' ');
      const lines: string[] = [];
      for (const w of words) {
        const last = lines[lines.length - 1];
        if (last && (last + ' ' + w).length <= 16) lines[lines.length - 1] = last + ' ' + w;
        else lines.push(w);
      }
      const n = Math.min(3, lines.length);
      const h = 30 + n * 26;
      let s = R(-6, -110, 12, 110, 4, '#a8754f') + R(-130, -110 - h, 260, h, 12, c) + R(-122, -102 - h, 244, h - 16, 8, light(c, 0.35));
      lines.slice(0, 3).forEach((l, k) => (s += T(0, -110 - h + 40 + k * 26, esc(l), 22, '#6b3e24')));
      return s + P(heartD(-112, -110 - h + 10, 8), '#ff6f91');
    },
  },
  frog: {
    draw: (_c, A, i) =>
      E(0, -4, 46, 11, '#6fc06a') + mv(A, E(0, -26, 26, 18, '#8fd36f') + C(-14, -42, 9, '#8fd36f') + C(14, -42, 9, '#8fd36f') + C(-14, -43, 5, '#fff') + C(14, -43, 5, '#fff') + C(-14, -43, 2.8, '#2d2240') + C(14, -43, 2.8, '#2d2240') +
        P('M-12 -26 Q0 -18 12 -26', 'none', SK('#3f8a4a', 3)) + E(-26, -12, 10, 5, '#7fca6a') + E(26, -12, 10, 5, '#7fca6a') + E(-18, -30, 4, 2.5, '#ff9db5', op(0.7)) + E(18, -30, 4, 2.5, '#ff9db5', op(0.7)), aMove(0, -6, 1.3, i)),
  },
  table: { draw: () => kidTable('') },
  rainbowplate: {
    draw: () =>
      kidTable(C(-30, -130, 7, '#ff5a6e') + C(-22, -136, 6, '#ff5a6e') + R(-16, -134, 18, 6, 3, '#ff9a3c', 'transform="rotate(-20 -7 -131)"') + C(6, -132, 6, '#ffd84a') + C(12, -136, 6, '#ffd84a') + C(22, -128, 5, '#7fd36f') + C(28, -132, 5, '#7fd36f') + C(34, -126, 5, '#7fd36f') + C(-4, -124, 5, '#a77fd6') + C(4, -122, 5, '#a77fd6')),
  },
  toast: { draw: () => kidTable(R(-26, -144, 52, 18, 6, '#e8b46a') + P('M-24 -144 Q-10 -150 0 -142 Q14 -150 24 -144 L24 -136 L-24 -136Z', '#ffd84a') + R(14, -140, 22, 12, 4, '#e8b46a')) },
  cookie: { draw: () => C(0, -16, 16, '#e8b46a') + C(-6, -20, 2.6, '#6b4226') + C(5, -12, 2.6, '#6b4226') + C(4, -24, 2.2, '#6b4226') + C(-5, -9, 2, '#6b4226'), hold: [0.9, -16] },
  cookiejar: {
    draw: () =>
      R(-32, -84, 64, 84, 18, '#e6f6ff', op(0.85)) + C(-12, -26, 14, '#e8b46a') + C(12, -30, 14, '#e8b46a') + C(0, -52, 14, '#e8b46a') + C(-12, -26, 2.5, '#6b4226') + C(14, -30, 2.5, '#6b4226') + C(2, -54, 2.5, '#6b4226') +
      R(-34, -94, 68, 14, 6, '#ff9ec7') + C(0, -100, 7, '#ff9ec7') + R(-24, -76, 8, 50, 4, '#fff', op(0.5)),
  },
  toothbrush: { draw: () => R(-4, -80, 8, 80, 4, '#7cc8ff') + R(-6, -100, 12, 24, 3, '#ffffff') + C(0, -106, 7, '#ffffff') + C(8, -112, 4, '#ffffff', op(0.8)), hold: [0.6, -20], handle: true },
  starpaper: {
    draw: (c) => {
      let s = R(-30, -76, 60, 76, 5, '#ffffff', 'stroke="#e8e2f0" stroke-width="2"');
      const n = c === 'one' ? 1 : c === 'few' ? 5 : 16;
      for (let k = 0; k < n; k++) s += P(starD(-18 + (k % 4) * 12, -64 + Math.floor(k / 4) * 16, 5.5, 0.5), '#ffd23f');
      return s;
    },
    hold: [0.7, -38],
  },
  card: { draw: () => P('M-34 -60 L0 -54 L0 0 L-34 -6Z', '#ffd1e3') + P('M34 -60 L0 -54 L0 0 L34 -6Z', '#ff9ec7') + P(heartD(17, -40, 12), '#ffffff'), hold: [0.7, -30] },
  scepter: { draw: (_c, A) => R(-4, -120, 8, 120, 4, '#ffd23f') + C(0, -4, 7, '#ffc21a') + mv(A, P(starD(0, -136, 20, 0.5), '#ffe066', 'stroke="#ffc21a" stroke-width="3"') + P(sparkleD(26, -156, 8), '#fff'), aFade(0.6, 1.4)), hold: [0.8, -30], handle: true },
  bucket: { draw: () => P('M-26 -44 L26 -44 L20 0 L-20 0Z', '#ff6f91') + R(-28, -48, 56, 8, 4, '#ff8fab') + P('M-24 -44 Q0 -80 24 -44', 'none', SK('#ffd36b', 3)) + LN(30, 0, 54, -40, '#7cc8ff', 5) + P('M48 -36 l16 -16 l8 8 l-16 16Z', '#7cc8ff') },
  smallcastle: {
    draw: (c = '#ff6f91') =>
      P('M-40 0 L-34 -50 L34 -50 L40 0Z', sandColor) + P('M-14 -50 L-18 -90 L14 -94 L18 -50Z', '#e9c27c', 'transform="rotate(-6 0 -50)"') + R(-34, -58, 14, 10, 2, sandColor) + R(-7, -58, 14, 10, 2, sandColor) + R(20, -58, 14, 10, 2, sandColor) +
      LN(-4, -96, -6, -122, '#8a6a4a', 2) + P('M-6 -122 l18 4 l-18 6Z', c) + P('M-8 -20 Q0 -34 8 -20 L8 0 L-8 0Z', '#d9ac62'),
  },
  sandcastle: {
    draw: () => {
      let s = E(0, -4, 190, 22, '#8fd8f0') + E(0, -6, 170, 14, '#b4e8f7');
      const tw = (x: number, w: number, top: number) => {
        let t = P(`M${x - w / 2 - 4} 0 L${x - w / 2} ${top} L${x + w / 2} ${top} L${x + w / 2 + 4} 0Z`, sandColor) + R(x + w / 2 - 10, top, 10, -top, 0, '#e3b86f', op(0.6));
        for (let k = 0; k < 3; k++) t += R(x - w / 2 + k * (w / 3), top - 12, w / 3 - 4, 14, 2, sandColor);
        return t + P(`M${x - 8} ${top + 40} Q${x} ${top + 28} ${x + 8} ${top + 40} L${x + 8} ${top + 56} L${x - 8} ${top + 56}Z`, '#c9985a');
      };
      s += tw(-100, 56, -150) + tw(100, 56, -150) + R(-120, -90, 240, 90, 4, sandColor) + R(80, -90, 40, 90, 0, '#e3b86f', op(0.5));
      for (let k = 0; k < 8; k++) s += R(-120 + k * 30, -102, 22, 14, 2, sandColor);
      s += tw(0, 74, -220);
      s += LN(0, -232, 0, -270, '#8a6a4a', 3) + P('M0 -270 l26 7 l-26 9Z', '#ff6f91') + LN(-100, -162, -100, -190, '#8a6a4a', 3) + P('M-100 -190 l20 6 l-20 7Z', '#7cc8ff') + LN(100, -162, 100, -190, '#8a6a4a', 3) + P('M100 -190 l20 6 l-20 7Z', '#ffd36b');
      s += P('M-20 0 L-20 -40 Q0 -62 20 -40 L20 0Z', '#c9985a');
      for (let k = 0; k < 7; k++) s += P(`M${-110 + k * 36} -54 q6 -12 12 0Z`, k % 2 ? '#ffd1dc' : '#ffffff');
      return s + P(starD(-60, -30, 8, 0.5), '#ff9a6b') + P(starD(60, -30, 8, 0.5), '#ff9a6b');
    },
  },
  splash: {
    draw: (_c, A) =>
      mv(A, P('M-320 0 Q-300 -80 -220 -90 Q-160 -96 -120 -60 Q-100 -110 -30 -110 Q40 -110 60 -60 Q100 -100 170 -90 Q260 -80 320 0Z', '#7fd4f0') + P('M-300 -40 Q-240 -96 -170 -80 M-90 -90 Q-30 -130 40 -96 M110 -86 Q200 -110 280 -40', 'none', SK('#ffffff', 10)) +
        C(-200, -110, 8, '#ffffff') + C(-40, -140, 10, '#ffffff') + C(160, -120, 7, '#ffffff') + C(240, -96, 6, '#ffffff'), aMove(0, -10, 1.2)),
  },
  cocoa: {
    draw: (_c, A) => R(-22, -44, 44, 44, 10, '#ff9ec7') + P('M22 -34 Q38 -34 36 -20 Q34 -10 22 -12', 'none', SK('#ff9ec7', 6)) + E(0, -44, 22, 6, '#8a5a3c') + R(-10, -50, 9, 8, 2, '#ffffff') + R(4, -52, 9, 8, 2, '#ffffff') +
      [-8, 6].map((x, k) => mv(A, P(`M${x} -58 q-8 -10 0 -20 q8 -10 0 -20`, 'none', SK('#ffffff', 3, op(0.7))), aRise(0, -10, 2, k))).join(''),
    hold: [0.75, -22],
  },
  mic: { draw: () => R(-6, -60, 12, 46, 6, '#ff6f91') + C(0, -70, 14, '#9aa0b0') + C(-4, -74, 4, '#fff', op(0.6)), hold: [0.8, -30], handle: true },
  leaves: {
    draw: (_c, A) => [[-60, -20, '#9fd86a'], [10, -60, '#ffc23d'], [60, -10, '#7fca7e'], [-20, 30, '#ff9a3c']].map(([x, y, c], k) => mv(A, G(at(x as number, y as number, 1.4, k * 40), P('M0 0 q12 -10 24 0 q-12 12 -24 0Z', c as string)), aMove(10, 30, 2 + k * 0.4, k))).join(''),
  },
  foxtail: {
    draw: (_c, A) => {
      // a big bushy tail lying across the front, thin at the base and fluffy at the white tip
      let t = '';
      const pts: [number, number, number][] = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        pts.push([-300 + u * 560, -24 - u * 46 - Math.sin(u * Math.PI) * 16, 22 + Math.pow(u, 0.8) * 44]);
      }
      for (const [x, y, r] of pts) t += C(x, y + 5, r + 3, '#e2843f');
      pts.forEach(([x, y, r], k) => (t += C(x, y, r, k > 9 ? '#fff4e8' : '#f7a25e')));
      pts.slice(1, 10).forEach(([x, y, r]) => (t += P(`M${f(x - r * 0.6)} ${f(y - r * 0.2)} q${f(r * 0.5)} ${f(-r * 0.5)} ${f(r * 1.1)} ${f(-r * 0.3)}`, 'none', SK('#ffc08a', 4, op(0.8)))));
      const [tx, ty, tr] = pts[12];
      t += C(tx + tr * 0.5, ty - tr * 0.2, tr * 0.7, '#fff4e8') + C(tx - tr * 0.3, ty - tr * 0.5, tr * 0.5, '#ffffff', op(0.6));
      return mv(A, t, aTurn(1.5, -300, -24, 3));
    },
  },
};
export const STORY_PROPS = Object.keys(PROPS);

function propG(p: StoryProp, A: boolean, i: number): string {
  const def = PROPS[p.id];
  if (!def) return '';
  const x = clamp(p.x, -0.2, 1.2) * 1000;
  const y = clamp(p.y ?? 0.88, -0.2, 1.2) * 600;
  const s = clamp(p.size ?? 1, 0.1, 4);
  const inner = def.draw(p.color, A, i, p);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f2(p.flip ? -s : s)} ${f2(s)})">${inner}</g>`;
}

// ---------------------------------------------------------------- the animal cast
type Pose = 'stand' | 'wave' | 'held' | 'sit';
type Ex = 'normal' | 'happy' | 'surprised' | 'sleep' | 'yum' | 'sad';
interface Kit {
  hy: number;
  by: number;
  ex: Ex;
  pose: Pose;
  A: boolean;
  fur: string;
  i: number;
}
interface Species {
  fur: string;
  belly?: string;
  legs?: string;
  feet?: string;
  hands?: string;
  arm?: 'paw' | 'wing' | 'flipper';
  foot?: 'paw' | 'bunny' | 'web' | 'claw';
  size: number;
  eyeX?: number;
  eyeY?: number;
  eyeBig?: number;
  mouthY?: number;
  mouthX?: number;
  /** Beaked birds draw their own mouth. */
  beak?: boolean;
  back?: (k: Kit) => string;
  ears?: (k: Kit) => string;
  face?: (k: Kit) => string;
  nose?: (k: Kit) => string;
  bodyDeco?: (k: Kit) => string;
}
const EYE = '#2d2240';
const MOUTH = '#7a2f4a';
const HR = 66;
const open = (ex: Ex) => ex === 'happy' || ex === 'surprised' || ex === 'yum';

const SPECIES: Record<string, Species> = {
  bunny: {
    fur: '#ece2f7', belly: '#fffafd', feet: '#fffafd', foot: 'bunny', size: 0.95, mouthY: 30,
    back: (k) => C(46, k.by + 18, 17, '#fffafd'),
    ears: (k) => [-1, 1].map((sd) => G(at(sd * 24, k.hy - 46, 1, sd * (k.ex === 'sad' ? 50 : 9)), mv(k.A && sd === 1, E(0, -46, 17, 50, k.fur) + E(0, -42, 9, 37, '#ffb6d2'), aTurn(5, 0, 0, 2.6, k.i)))).join(''),
    face: (k) => E(-10, k.hy + 22, 13, 11, '#fffafd') + E(10, k.hy + 22, 13, 11, '#fffafd'),
    nose: (k) => P(`M-6 ${k.hy + 12} Q0 ${k.hy + 8} 6 ${k.hy + 12} Q0 ${k.hy + 20} -6 ${k.hy + 12}Z`, '#ff8fb1') + (k.ex === 'normal' || k.ex === 'sad' ? R(-5, k.hy + 33, 4.5, 7, 1.5, '#ffffff', 'stroke="#e8dff0" stroke-width="1"') + R(0.5, k.hy + 33, 4.5, 7, 1.5, '#ffffff', 'stroke="#e8dff0" stroke-width="1"') : ''),
  },
  bear: {
    fur: '#c99263', belly: '#f2d7b8', size: 1.08, mouthY: 32,
    ears: (k) => [-1, 1].map((sd) => C(sd * 48, k.hy - 46, 23, k.fur) + C(sd * 48, k.hy - 46, 13, '#f0bfa0')).join(''),
    face: (k) => E(0, k.hy + 24, 28, 22, '#f2d7b8'),
    nose: (k) => E(0, k.hy + 13, 10, 7, '#5a3a2e') + E(-3, k.hy + 11, 3, 2, '#fff', op(0.5)),
  },
  fox: {
    fur: '#f7a25e', belly: '#fff4e8', legs: '#8a5642', hands: '#8a5642', size: 1, mouthY: 34,
    back: (k) => G(at(36, k.by + 20, 1, 52), mv(k.A, E(0, -44, 26, 50, k.fur) + E(0, -84, 17, 16, '#fff4e8'), aTurn(8, 0, 0, 1.6, k.i))),
    ears: (k) => [-1, 1].map((sd) => {
      const a = [sd * 50, k.hy - 112], b = [sd * 14, k.hy - 52], c = [sd * 64, k.hy - 26];
      const lerp = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      const tb = lerp(a, b, 0.32), tc = lerp(a, c, 0.32);
      const ib = lerp(a, b, 0.75), ic = lerp(a, c, 0.75), ia = lerp(a, [sd * 40, k.hy - 50], 0.25);
      return P(`M${f(b[0])} ${f(b[1])} L${f(a[0])} ${f(a[1])} L${f(c[0])} ${f(c[1])}Z`, k.fur) + P(`M${f(ib[0])} ${f(ib[1])} L${f(ia[0])} ${f(ia[1])} L${f(ic[0])} ${f(ic[1])}Z`, '#fff4e8') + P(`M${f(tb[0])} ${f(tb[1])} L${f(a[0])} ${f(a[1])} L${f(tc[0])} ${f(tc[1])}Z`, '#8a5642');
    }).join(''),
    face: (k) => E(-24, k.hy + 26, 25, 21, '#fff4e8') + E(24, k.hy + 26, 25, 21, '#fff4e8'),
    nose: (k) => E(0, k.hy + 16, 8, 6, '#3a2a30') + E(-2, k.hy + 14, 2.5, 1.5, '#fff', op(0.5)),
  },
  owl: {
    fur: '#b48e70', belly: '#f3dcc0', feet: '#ffb24d', arm: 'wing', foot: 'claw', size: 0.95, eyeBig: 1.2, eyeX: 25, eyeY: -4, beak: true,
    ears: (k) => [-1, 1].map((sd) => P(`M${sd * 30} ${k.hy - 56} L${sd * 58} ${k.hy - 92} L${sd * 60} ${k.hy - 40}Z`, dark(k.fur, 0.12))).join(''),
    face: (k) => C(-25, k.hy - 4, 27, '#f6e6cf') + C(25, k.hy - 4, 27, '#f6e6cf') + P(`M-46 ${k.hy - 34} Q-25 ${k.hy - 44} -4 ${k.hy - 30} M4 ${k.hy - 30} Q25 ${k.hy - 44} 46 ${k.hy - 34}`, 'none', SK(dark(k.fur, 0.2), 4)),
    nose: (k) => (open(k.ex) ? P(`M-10 ${k.hy + 12} Q0 ${k.hy + 8} 10 ${k.hy + 12} L0 ${k.hy + 22}Z`, '#ffb24d') + E(0, k.hy + 26, 7, 5, MOUTH) + P(`M-7 ${k.hy + 28} L7 ${k.hy + 28} L0 ${k.hy + 36}Z`, '#f29a2e') : P(`M-10 ${k.hy + 12} Q0 ${k.hy + 8} 10 ${k.hy + 12} L0 ${k.hy + 30}Z`, '#ffb24d')),
    bodyDeco: (k) => [0, 1, 2].map((r) => [-1, 0, 1].map((c) => P(`M${c * 14 - 5 + (r % 2) * 7} ${k.by - 10 + r * 14} l5 5 l5 -5`, 'none', SK(dark('#f3dcc0', 0.2), 2.5))).join('')).join(''),
  },
  turtle: {
    fur: '#a9de8c', belly: '#f6e7a6', size: 0.95, mouthY: 28,
    back: (k) => {
      let s = C(0, k.by - 8, 62, '#e3cf86') + C(0, k.by - 10, 56, '#6dbb72');
      for (let j = 0; j < 8; j++) s += C(Math.cos((j / 8) * Math.PI * 2) * 42, k.by - 10 + Math.sin((j / 8) * Math.PI * 2) * 42, 11, '#8fd18c');
      return s;
    },
    bodyDeco: (k) => [0, 1, 2].map((j) => P(`M-24 ${k.by - 14 + j * 18} Q0 ${k.by - 10 + j * 18} 24 ${k.by - 14 + j * 18}`, 'none', SK(dark('#f6e7a6', 0.15), 2.5))).join('') + LN(0, k.by - 28, 0, k.by + 36, dark('#f6e7a6', 0.15), 2.5),
    face: (k) => C(-20, k.hy - 40, 8, dark(k.fur, 0.07)) + C(16, k.hy - 46, 6, dark(k.fur, 0.07)) + C(34, k.hy - 28, 5, dark(k.fur, 0.07)),
    nose: (k) => C(-5, k.hy + 16, 2.2, dark(k.fur, 0.45)) + C(5, k.hy + 16, 2.2, dark(k.fur, 0.45)),
  },
  puppy: {
    fur: '#f0d0a2', belly: '#fff5e6', size: 0.95, mouthY: 33,
    back: (k) => G(at(36, k.by + 6), mv(k.A, P('M0 0 Q26 -12 22 -36', 'none', SK(k.fur, 13)), aTurn(16, 0, 0, 0.5, k.i))),
    face: (k) => E(25, k.hy - 6, 20, 18, '#dcae7a') + E(0, k.hy + 25, 27, 20, '#fff5e6') + [-1, 1].map((sd) => G(at(sd * 54, k.hy - 36, 1, -sd * (k.ex === 'sad' ? 4 : 18)), mv(k.A, E(0, 36, 19, 40, '#b37b52'), aTurn(4, 0, 0, 1.4, k.i + sd)))).join(''),
    nose: (k) => E(0, k.hy + 13, 10, 7, '#3a2a30') + E(-3, k.hy + 11, 3, 2, '#fff', op(0.5)),
  },
  kitty: {
    fur: '#c4bfd9', belly: '#f7f4fd', size: 0.92, mouthY: 27,
    back: (k) => mv(k.A, P(`M34 ${k.by + 22} C72 ${k.by + 22} 82 ${k.by - 26} 62 ${k.by - 58}`, 'none', SK(k.fur, 13)) + P(`M68 ${k.by - 40} L62 ${k.by - 58}`, 'none', SK(dark(k.fur, 0.2), 13)), aTurn(6, 34, k.by + 22, 2.2, k.i)),
    ears: (k) => [-1, 1].map((sd) => P(`M${sd * 18} ${k.hy - 56} L${sd * 48} ${k.hy - 104} L${sd * 62} ${k.hy - 26}Z`, k.fur) + P(`M${sd * 28} ${k.hy - 54} L${sd * 47} ${k.hy - 88} L${sd * 54} ${k.hy - 38}Z`, '#ffbcd4')).join(''),
    face: (k) => [-12, 0, 12].map((x) => LN(x, k.hy - 62, x * 0.8, k.hy - 48, dark(k.fur, 0.18), 4)).join('') + E(-10, k.hy + 20, 12, 9, '#f7f4fd') + E(10, k.hy + 20, 12, 9, '#f7f4fd'),
    nose: (k) => P(`M-5 ${k.hy + 12} L5 ${k.hy + 12} L0 ${k.hy + 18}Z`, '#ff8fb1') + [-1, 1].map((sd) => [0, 1, 2].map((j) => LN(sd * 26, k.hy + 16 + j * 6, sd * 60, k.hy + 8 + j * 10, dark(k.fur, 0.3), 2)).join('')).join(''),
  },
  duck: {
    fur: '#ffe27a', belly: '#fff3bf', feet: '#ffa94d', arm: 'wing', foot: 'web', size: 0.82, beak: true,
    back: (k) => P(`M30 ${k.by + 10} L62 ${k.by - 4} L52 ${k.by + 22}Z`, dark('#ffe27a', 0.06)),
    ears: (k) => P(`M0 ${k.hy - 62} Q-8 ${k.hy - 90} 6 ${k.hy - 96} M2 ${k.hy - 62} Q14 ${k.hy - 84} 22 ${k.hy - 82}`, 'none', SK(k.fur, 8)),
    nose: (k) => open(k.ex) ? E(0, k.hy + 14, 25, 10, '#ffa94d') + E(0, k.hy + 22, 17, 7, MOUTH) + E(0, k.hy + 29, 19, 7, '#ff9a3c') + C(-7, k.hy + 10, 1.8, '#c46a2a') + C(7, k.hy + 10, 1.8, '#c46a2a')
      : E(0, k.hy + 18, 25, 11, '#ffa94d') + P(`M-21 ${k.hy + 18} Q0 ${k.hy + 23} 21 ${k.hy + 18}`, 'none', SK('#e0832a', 2)) + C(-7, k.hy + 13, 1.8, '#c46a2a') + C(7, k.hy + 13, 1.8, '#c46a2a'),
  },
  elephant: {
    fur: '#b7c3df', belly: '#d7def0', size: 1.12, mouthY: 40, mouthX: -24, eyeY: -14,
    back: (k) => P(`M-30 ${k.by + 20} Q-52 ${k.by + 30} -56 ${k.by + 10}`, 'none', SK(k.fur, 5)) + C(-57, k.by + 8, 5, dark(k.fur, 0.2)),
    ears: (k) => [-1, 1].map((sd) => G(at(sd * 60, k.hy + 6), mv(k.A, E(0, 0, 42, 50, k.fur) + E(sd * 4, 2, 28, 36, '#f7c6d9'), aScale(0.86, 1, 2.4, k.i)))).join(''),
    nose: (k) => {
      const d = open(k.ex)
        ? `M-2 ${k.hy + 4} C-4 ${k.hy + 38} 18 ${k.hy + 54} 34 ${k.hy + 36} C42 ${k.hy + 26} 40 ${k.hy + 14} 32 ${k.hy + 12}`
        : `M-2 ${k.hy + 4} C-4 ${k.hy + 36} 6 ${k.hy + 58} 24 ${k.hy + 60} C36 ${k.hy + 61} 42 ${k.hy + 52} 38 ${k.hy + 44}`;
      return P(d, 'none', SK(k.fur, 22)) + P(d, 'none', SK(dark(k.fur, 0.1), 22, `stroke-dasharray="2 14" ${op(0.5)}`));
    },
  },
  mouse: {
    fur: '#d5c9d1', belly: '#f8f1f4', size: 0.72, mouthY: 28,
    back: (k) => P(`M30 ${k.by + 30} C80 ${k.by + 42} 92 ${k.by - 8} 72 ${k.by - 30} C62 ${k.by - 40} 52 ${k.by - 30} 58 ${k.by - 22}`, 'none', SK('#f0aac0', 5)),
    ears: (k) => [-1, 1].map((sd) => C(sd * 50, k.hy - 46, 33, k.fur) + C(sd * 50, k.hy - 46, 22, '#ffc2d4')).join(''),
    face: (k) => E(0, k.hy + 18, 23, 17, '#f8f1f4'),
    nose: (k) => C(0, k.hy + 11, 7.5, '#ff8fb1') + C(-2, k.hy + 9, 2.2, '#fff', op(0.6)) + [-1, 1].map((sd) => [0, 1, 2].map((j) => LN(sd * 22, k.hy + 14 + j * 5, sd * 56, k.hy + 6 + j * 9, dark(k.fur, 0.3), 2)).join('')).join(''),
  },
  penguin: {
    fur: '#46557d', belly: '#ffffff', feet: '#ffa94d', arm: 'flipper', foot: 'web', size: 0.9, beak: true,
    face: (k) => C(-18, k.hy + 8, 34, '#ffffff') + C(18, k.hy + 8, 34, '#ffffff'),
    nose: (k) => open(k.ex) ? P(`M-11 ${k.hy + 18} Q0 ${k.hy + 12} 11 ${k.hy + 18} L0 ${k.hy + 24}Z`, '#ffa94d') + E(0, k.hy + 26, 7, 4, MOUTH) + P(`M-8 ${k.hy + 28} L8 ${k.hy + 28} L0 ${k.hy + 34}Z`, '#f29a2e')
      : P(`M-11 ${k.hy + 18} Q0 ${k.hy + 12} 11 ${k.hy + 18} Q0 ${k.hy + 32} -11 ${k.hy + 18}Z`, '#ffa94d'),
  },
  dragon: {
    fur: '#94dbb6', belly: '#fff0b8', size: 1.08, mouthY: 36,
    back: (k) => {
      const wing = (sd: number) => G(at(sd * 24, k.by - 34), mv(k.A, P(`M0 0 C${sd * 40} -50 ${sd * 82} -62 ${sd * 96} -40 C${sd * 80} -36 ${sd * 84} -20 ${sd * 72} -14 C${sd * 60} -16 ${sd * 58} 0 ${sd * 46} 4 C${sd * 30} 2 ${sd * 20} 6 0 10Z`, '#c9a8ff'), aTurn(10, 0, 0, 1.4, k.i)));
      const tail = P(`M26 ${k.by + 28} C80 ${k.by + 44} 104 ${k.by + 12} 100 ${k.by - 18}`, 'none', SK(k.fur, 18)) + P(`M100 ${k.by - 18} l-16 -6 l18 -22 l12 24Z`, '#ff9ec7');
      return wing(-1) + wing(1) + tail;
    },
    ears: (k) => [-1, 1].map((sd) => P(`M${sd * 14} ${k.hy - 56} Q${sd * 20} ${k.hy - 94} ${sd * 34} ${k.hy - 98} Q${sd * 30} ${k.hy - 76} ${sd * 38} ${k.hy - 54}Z`, '#ffd36b')).join('') +
      [-22, 0, 22].map((x) => P(`M${x - 11} ${k.hy - 56} L${x} ${k.hy - 82 - (x ? 0 : 6)} L${x + 11} ${k.hy - 56}Z`, '#ff9ec7')).join(''),
    face: (k) => E(0, k.hy + 24, 32, 21, light(k.fur, 0.38)),
    nose: (k) => E(-9, k.hy + 17, 3.5, 2.5, dark(k.fur, 0.45)) + E(9, k.hy + 17, 3.5, 2.5, dark(k.fur, 0.45)),
    bodyDeco: (k) => [0, 1, 2].map((j) => P(`M-20 ${k.by - 10 + j * 16} Q0 ${k.by - 6 + j * 16} 20 ${k.by - 10 + j * 16}`, 'none', SK('#f2d98a', 3))).join(''),
  },
};
export const STORY_ANIMALS = Object.keys(SPECIES);

function eyesG(k: Kit, sp: Species): string {
  const ex = sp.eyeX ?? 24;
  const y = k.hy + (sp.eyeY ?? -6);
  const b = sp.eyeBig ?? 1;
  let s = '';
  for (const sd of [-1, 1]) {
    const x = sd * ex;
    if (k.ex === 'happy' || k.ex === 'yum') s += P(`M${f(x - 9 * b)} ${f(y + 3)} Q${f(x)} ${f(y - 9 * b)} ${f(x + 9 * b)} ${f(y + 3)}`, 'none', SK(EYE, 5));
    else if (k.ex === 'sleep') s += P(`M${f(x - 9 * b)} ${f(y)} Q${f(x)} ${f(y + 8 * b)} ${f(x + 9 * b)} ${f(y)}`, 'none', SK(EYE, 4.5));
    else {
      const r = k.ex === 'surprised' ? 1.25 : 1;
      const rx = 8 * b * r;
      const ry = 10 * b * r;
      const blink = k.A && k.ex === 'normal' ? `<animate attributeName="ry" values="${f(ry)};${f(ry)};1;${f(ry)}" keyTimes="0;0.93;0.96;1" ${rep(4 + (k.i % 3), k.i)}/>` : '';
      s += `<ellipse cx="${f(x)}" cy="${f(y + (k.ex === 'sad' ? 2 : 0))}" rx="${f(rx)}" ry="${f(ry)}" fill="${EYE}">${blink}</ellipse>`;
      s += C(x + 3 * b, y - 4 * b, 3.2 * b, '#ffffff') + C(x - 2.5 * b, y + 3.5 * b, 1.5 * b, '#ffffff');
      if (k.ex === 'surprised') s += P(`M${f(x - 9)} ${f(y - 22 * b)} Q${f(x)} ${f(y - 30 * b)} ${f(x + 9)} ${f(y - 22 * b)}`, 'none', SK(dark(k.fur, 0.45), 4));
      if (k.ex === 'sad') s += LN(x - sd * 8, y - 22 * b, x + sd * 9, y - 15 * b, dark(k.fur, 0.45), 4);
    }
  }
  return s;
}
function mouthG(ex: Ex, y: number): string {
  switch (ex) {
    case 'happy':
      return P(`M-13 ${f(y)} Q0 ${f(y + 4)} 13 ${f(y)} Q0 ${f(y + 22)} -13 ${f(y)}Z`, MOUTH) + E(0, y + 11, 6, 4, '#ff8fab');
    case 'yum':
      return P(`M-11 ${f(y)} Q0 ${f(y + 10)} 11 ${f(y)}`, 'none', SK(MOUTH, 3.5)) + P(`M-1 ${f(y + 4)} Q8 ${f(y + 5)} 9 ${f(y + 12)} Q2 ${f(y + 16)} -1 ${f(y + 4)}Z`, '#ff8fab');
    case 'surprised':
      return E(0, y + 7, 6, 8, MOUTH);
    case 'sad':
      return P(`M-9 ${f(y + 8)} Q0 ${f(y)} 9 ${f(y + 8)}`, 'none', SK(MOUTH, 3.5));
    case 'sleep':
      return E(0, y + 4, 4, 3, MOUTH);
    default:
      return P(`M-10 ${f(y)} Q-5 ${f(y + 7)} 0 ${f(y + 1)} Q5 ${f(y + 7)} 10 ${f(y)}`, 'none', SK(MOUTH, 3.5));
  }
}
const tearG = (x: number, y: number, A: boolean, s = 1) => {
  const t = G(at(x, y, s), P('M0 0 C-6 9 -6 15 0 15 C6 15 6 9 0 0Z', '#8fd4ff', 'stroke="#ffffff" stroke-width="1.5"') + C(-1.5, 10, 1.8, '#fff'));
  return A ? `<g>${t}<animateTransform attributeName="transform" type="translate" values="0 0;0 14" ${rep(1.8)}/><animate attributeName="opacity" values="1;1;0" ${rep(1.8)}/></g>` : t;
};
const zzzG = (x: number, y: number, A: boolean, flip: boolean, s = 1) => {
  const z = [0, 1, 2].map((k) => T(k * 14, -k * 18, 'z', 18 + k * 5, '#8a7fd0', op(0.9 - k * 0.15))).join('');
  return G(`${at(x, y, s)} scale(${flip ? -1 : 1} 1)`, mv(A, z, aRise(10, -20, 2.6)));
};
function armG(sx: number, sy: number, ang: number, c: string, kind: Species['arm'], wave: boolean, A: boolean, i: number): string {
  const len = 44;
  let g: string;
  if (kind === 'wing') g = P(`M-13 -2 Q-18 ${len * 0.6} 0 ${len + 10} Q18 ${len * 0.6} 13 -2Z`, c) + P(`M-6 ${len * 0.5} Q0 ${len * 0.8} 6 ${len * 0.5}`, 'none', SK(dark(c, 0.15), 2.5));
  else if (kind === 'flipper') g = P(`M-12 -2 Q-15 ${len * 0.7} 0 ${len + 8} Q15 ${len * 0.7} 12 -2Z`, c);
  else g = R(-10, -6, 20, len, 10, c) + C(0, len - 3, 12, c) + C(0, len, 5, light(c, 0.3), op(0.6));
  const inner = wave && A ? `<g>${g}<animateTransform attributeName="transform" type="rotate" values="0;-22;0" ${EASE} ${rep(0.9, i)}/></g>` : g;
  return G(at(sx, sy, 1, ang), inner);
}
function legsG(k: Kit, sp: Species): string {
  const lc = sp.legs ?? k.fur;
  const fc = sp.feet ?? lc;
  const foot = sp.foot ?? 'paw';
  let s = '';
  for (const sd of [-1, 1]) {
    if (k.pose === 'sit') {
      const x = sd * 27;
      if (foot === 'web') s += P(`M${x - 16} -2 L${x} -24 L${x + 16} -2 Q${x + 8} 4 ${x} 0 Q${x - 8} 4 ${x - 16} -2Z`, fc);
      else if (foot === 'claw') s += [-7, 0, 7].map((t) => E(x + t, -6, 4.5, 9, fc)).join('');
      else s += E(x, -13, foot === 'bunny' ? 18 : 16, foot === 'bunny' ? 17 : 15, fc) + E(x, -9, 8, 7, light(fc, 0.4)) + [-8, 0, 8].map((t) => C(x + t, -22, 3.2, light(fc, 0.4))).join('');
      continue;
    }
    const x = sd * (k.pose === 'held' ? 22 : 18);
    const birdy = foot === 'web' || foot === 'claw';
    if (birdy) s += R(x - 4, -28, 8, 26, 4, fc);
    else s += R(x - 10, -38, 20, 34, 9, lc);
    if (foot === 'web') s += P(`M${x - 15} 0 Q${x - 16} -10 ${x} -10 Q${x + 16} -10 ${x + 15} 0 Q${x + 7} -4 ${x} 0 Q${x - 7} -4 ${x - 15} 0Z`, fc);
    else if (foot === 'claw') s += [-6, 0, 6].map((t) => E(x + t, -4, 4, 7, fc)).join('');
    else if (foot === 'bunny') s += E(x + sd * 3, -7, 21, 9, fc);
    else s += E(x, -7, 16, 9, fc);
  }
  return s;
}

/** Accessories that sit on an animal (hats, scarves, glasses, helmets). */
function animalAcc(acc: string[], k: Kit, sp: Species, A: boolean): { back: string; front: string } {
  let back = '';
  let front = '';
  const hy = k.hy;
  const ex = sp.eyeX ?? 24;
  const ey = hy + (sp.eyeY ?? -6);
  for (const a of acc) {
    switch (a) {
      case 'cape':
        back += mv(A, P(`M-36 ${k.by - 44} L36 ${k.by - 44} L66 ${k.by + 50} Q0 ${k.by + 64} -66 ${k.by + 50}Z`, '#e8455f'), aTurn(3, 0, k.by - 44, 2.4, k.i));
        front += R(-30, k.by - 50, 60, 12, 6, '#c8325a') + C(0, k.by - 44, 7, '#ffd36b');
        break;
      case 'scarf':
        front += R(-46, hy + 58, 92, 20, 10, '#ff6f91') + R(16, hy + 66, 18, 46, 7, '#ff6f91') + [0, 1, 2].map((j) => LN(-34 + j * 22, hy + 60, -34 + j * 22, hy + 76, '#ffffff', 4, op(0.6))).join('');
        break;
      case 'collar':
        front += R(-38, hy + 58, 76, 12, 6, '#e8455f') + C(0, hy + 76, 9, '#ffd23f', 'stroke="#e8a71c" stroke-width="2"') + P(heartD(0, hy + 72, 5), '#e8a71c');
        break;
      case 'medal':
        front += P(`M-18 ${hy + 60} L0 ${k.by - 10} L18 ${hy + 60}`, 'none', SK('#7cc8ff', 7)) + C(0, k.by - 6, 13, '#ffd23f', 'stroke="#e8a71c" stroke-width="2"') + P(starD(0, k.by - 6, 7, 0.5), '#fff6c8');
        break;
      case 'glasses':
        front += C(-ex, ey, 15, 'none', SK('#7a4fe0', 3.5)) + C(ex, ey, 15, 'none', SK('#7a4fe0', 3.5)) + LN(-ex + 15, ey, ex - 15, ey, '#7a4fe0', 3);
        break;
      case 'goggles':
        front += LN(-HR, ey - 2, HR, ey - 2, '#ff9f43', 7) + E(-ex, ey, 18, 15, '#bfefff', `fill-opacity="0.55" stroke="#ff9f43" stroke-width="4"`) + E(ex, ey, 18, 15, '#bfefff', `fill-opacity="0.55" stroke="#ff9f43" stroke-width="4"`);
        break;
      case 'crown':
        front += G(at(0, hy - 58), P('M-30 0 L-34 -34 L-17 -14 L0 -40 L17 -14 L34 -34 L30 0Z', '#ffd23f', 'stroke="#f2b51c" stroke-width="3" stroke-linejoin="round"') + R(-31, -7, 62, 10, 4, '#f2b51c') + C(0, -40, 4.5, '#ff6f91') + C(-34, -34, 3.5, '#7cc8ff') + C(34, -34, 3.5, '#7cc8ff') + C(-14, -2, 3, '#ff6f91') + C(14, -2, 3, '#ff6f91'));
        break;
      case 'party':
        front += G(at(14, hy - 56, 1, 14), P('M-22 0 L0 -66 L22 0Z', '#7cc8ff') + P('M-15 -20 L15 -20 L11 -32 L-11 -32Z M-7 -44 L7 -44 L4 -52 L-4 -52Z', '#ffd36b') + C(0, -68, 8, '#ff6f91') + E(0, 0, 24, 5, '#5aa8e8'));
        break;
      case 'beanie':
        front += P(`M-62 ${hy - 16} Q-62 ${hy - 80} 0 ${hy - 82} Q62 ${hy - 80} 62 ${hy - 16}Z`, '#4f9dff') + R(-65, hy - 30, 130, 22, 11, '#3d86e6') + C(0, hy - 88, 14, '#ffffff');
        break;
      case 'cap':
        front += P(`M-56 ${hy - 26} Q-56 ${hy - 76} 0 ${hy - 78} Q56 ${hy - 76} 56 ${hy - 26}Z`, '#ff6f61') + P(`M20 ${hy - 30} Q70 ${hy - 36} 86 ${hy - 22} Q60 ${hy - 14} 20 ${hy - 22}Z`, '#e8554f') + C(0, hy - 78, 5, '#e8554f');
        break;
      case 'chef':
        front += R(-34, hy - 82, 68, 30, 6, '#ffffff', 'stroke="#ece6f2" stroke-width="2"') + C(-24, hy - 96, 20, '#ffffff') + C(0, hy - 108, 24, '#ffffff') + C(24, hy - 96, 20, '#ffffff');
        break;
      case 'bow':
        front += bowG(38, hy - 50, 1.2, '#ff6f91');
        break;
      case 'flower':
        front += flowerG(40, hy - 50, 16, '#ff8fc5');
        break;
      case 'sticks':
        front += [-1, 1].map((sd) => LN(sd * 16, hy - 56, sd * 26, hy - 140, '#9a6a44', 8) + P(`M${sd * 24} ${hy - 116} q${sd * 14} -6 ${sd * 18} 4 q${sd * -10} 4 ${sd * -18} -4Z`, '#7fca7e')).join('');
        break;
      case 'pondweed':
        front += P(`M-50 ${hy - 40} Q-30 ${hy - 80} 0 ${hy - 70} Q30 ${hy - 82} 50 ${hy - 40}`, 'none', SK('#5fae5a', 10)) + P(`M-50 ${hy - 40} q-6 30 4 50 M50 ${hy - 40} q6 30 -4 54 M-20 ${hy - 72} q-4 20 2 34`, 'none', SK('#5fae5a', 6)) + E(10, hy - 80, 18, 6, '#6fc06a');
        break;
      case 'carrot':
        front += G(at(0, hy - 60, 1, 180), P('M-12 -20 L12 -20 L0 40Z', '#ff9a3c') + P('M0 -20 L-10 -40 M0 -20 L0 -44 M0 -20 L10 -40', 'none', SK('#5fbf6a', 5)));
        break;
      case 'helmet':
        front += E(0, hy + 70, 54, 12, '#c9cfe0') + C(0, hy - 4, HR + 32, '#cdefff', `fill-opacity="0.22" stroke="#ffffff" stroke-width="4" stroke-opacity="0.85"`) + P(`M${-HR + 2} ${hy - 30} Q${-HR + 10} ${hy - HR - 10} ${-14} ${hy - HR - 24}`, 'none', SK('#ffffff', 6, op(0.6)));
        break;
    }
  }
  return { back, front };
}

function animalArt(sp: Species, m: CastMember, A: boolean, i: number): string {
  const pose = (m.pose ?? 'stand') as Pose;
  const ex = (m.expr ?? 'normal') as Ex;
  const fur = m.tint ?? sp.fur;
  const by = pose === 'sit' ? -46 : -64;
  const k: Kit = { hy: by - 94, by, ex, pose, A, fur, i };
  const acc = animalAcc(m.acc ?? [], k, sp, A);
  const up = pose === 'wave' || pose === 'held';
  const hand = sp.hands ?? fur;
  const holding = !!(m.hold && PROPS[m.hold]);
  const angR = pose === 'wave' ? -145 : pose === 'held' ? -140 : holding ? -52 : pose === 'sit' ? -28 : -20;
  const angL = pose === 'wave' ? 20 : pose === 'held' ? 140 : pose === 'sit' ? 28 : 20;
  const sx = 38;
  const sy = by - 28;
  const arms = armG(-sx, sy, angL, hand, sp.arm, false, A, i) + armG(sx, sy, angR, hand, sp.arm, pose === 'wave', A, i);

  let s = acc.back + (sp.back?.(k) ?? '');
  s += legsG(k, sp);
  s += E(0, by, 42, 46, fur) + E(-16, by - 20, 14, 10, '#ffffff', op(0.18));
  if (sp.belly) s += E(0, by + 8, 28, 32, sp.belly);
  s += sp.bodyDeco?.(k) ?? '';
  if (!up) s += arms;
  s += sp.ears?.(k) ?? '';
  s += C(0, k.hy, HR, fur) + E(-24, k.hy - 32, 18, 11, '#ffffff', op(0.22));
  s += sp.face?.(k) ?? '';
  s += eyesG(k, sp);
  if (!sp.beak) s += G(at(sp.mouthX ?? 0, 0), mouthG(ex, k.hy + (sp.mouthY ?? 30)));
  s += sp.nose?.(k) ?? '';
  const cx = (sp.eyeX ?? 24) + 20;
  s += E(-cx, k.hy + 14, 11, 6.5, '#ff8fb1', op(0.55)) + E(cx, k.hy + 14, 11, 6.5, '#ff8fb1', op(0.55));
  if (up) s += arms;
  if (holding) {
    const def = PROPS[m.hold!];
    const [hs, gy] = def.hold ?? [0.6, -30];
    const a = rad(angR);
    const hx = sx - Math.sin(a) * 44;
    const hyy = sy + Math.cos(a) * 44;
    s += `<g transform="translate(${f(hx)} ${f(hyy)}) scale(${f2(hs)}) translate(0 ${f(-gy)})">${def.draw(undefined, A, i, { id: m.hold!, x: 0 })}</g>`;
    if ((sp.arm ?? 'paw') === 'paw' && def.handle) s += C(hx, hyy, 11, hand);
  }
  s += acc.front;
  if (ex === 'sad') s += tearG(-(sp.eyeX ?? 24) - 6, k.hy + (sp.eyeY ?? -6) + 12, A);
  if (ex === 'sleep' && !m.swim) s += zzzG(40, k.hy - 70, A, !!m.flip);
  return s;
}

// ---------------------------------------------------------------- the kid cast (doll renderer)
const KIDS: Record<string, () => Look> = {
  zoe: () => ({
    ...baseLook(), skin: '#74432c', hair: 'spacebuns', hairColor: '#2b1d1a', eyes: 'sparkle', eyeColor: '#3b2418', mouth: 'grin', blush: '#ff7a8a',
    wear: { dress: wornOf('sundress', '#ffd36b'), shoes: wornOf('sneakers', '#ff7eb6') },
  }),
  sam: () => ({
    ...baseLook(), boy: true, skin: '#ffe3d3', hair: 'shaggy', hairColor: '#e86a3a', freckles: true, eyes: 'round', eyeColor: '#3f7fbf', mouth: 'grin',
    wear: { top: wornOf('tee', '#5fd3b5'), bottom: wornOf('shorts', '#4f6fb8'), shoes: wornOf('sneakers', '#ff9a6b') },
  }),
  ruby: () => ({
    ...baseLook(), skin: '#f5c09f', hair: 'highpigs', hairColor: '#b5432f', eyes: 'lashes', eyeColor: '#3c9a6b', blush: '#ff9db5',
    wear: { top: wornOf('heartTee'), bottom: wornOf('pleated', '#ff4f8b'), shoes: wornOf('maryjanes', '#ff4f8b'), head: wornOf('bow', '#ff4f8b') },
  }),
  kai: () => ({
    ...baseLook(), boy: true, skin: '#d69068', hair: 'spiky', hairColor: '#2b1d1a', eyes: 'almond', eyeColor: '#3b2418', mouth: 'smile',
    wear: { top: wornOf('hoodie', '#7cc8ff'), bottom: wornOf('joggers', '#5a5a7a'), shoes: wornOf('hightops', '#ff6f61') },
  }),
  nina: () => ({
    ...baseLook(), skin: '#fcd2bb', hair: 'bob', hairColor: '#2b1d1a', eyes: 'almond', eyeColor: '#3b2418', blush: '#ff9db5',
    wear: { top: wornOf('blouse', '#c99bff'), bottom: wornOf('bubble', '#7cc8ff'), shoes: wornOf('flats', '#c99bff'), face: wornOf('glasses', '#ff7eb6') },
  }),
  milo: () => ({
    ...baseLook(), boy: true, skin: '#965a3c', hair: 'curlytop', hairColor: '#2b1d1a', eyes: 'round', eyeColor: '#3b2418', mouth: 'grin',
    wear: { top: wornOf('top-longtee-dino', '#9be07f'), bottom: wornOf('jeans', '#4f6fb8'), shoes: wornOf('sneakers', '#ffb347') },
  }),
};
export const STORY_KIDS = Object.keys(KIDS);
const DOLL_HAND = new Set(['mic', 'umbrella']);
const DOLL_ACC: Record<string, [keyof Look['wear'], string, string?]> = {
  crown: ['head', 'crown'], beanie: ['head', 'beanie', '#4f9dff'], scarf: ['neck', 'scarf', '#ff6f91'], glasses: ['face', 'glasses'], medal: ['neck', 'medal'],
  bow: ['head', 'bow', '#ff6f91'], flower: ['head', 'flowerclip'], cape: ['back', 'cape', '#e8455f'], cap: ['head', 'cap', '#ff6f61'],
};

function dressKid(look: Look, m: CastMember): Look {
  const w = { ...look.wear };
  switch (m.outfit) {
    case 'swim':
      delete w.top; delete w.bottom; delete w.shoes; delete w.outer;
      if (look.boy) { w.top = wornOf('tank', '#ffd36b'); w.bottom = wornOf('shorts', '#ff6f91'); }
      else { delete w.dress; w.dress = wornOf('swim', look.hairColor === '#2b1d1a' ? '#ff7eb6' : '#4fc3f7'); }
      if (look.boy) delete w.dress;
      break;
    case 'snow':
      w.outer = wornOf('puffer', look.boy ? '#4f9dff' : '#ff7eb6'); w.shoes = wornOf('snowboots'); w.head = wornOf('beanie', look.boy ? '#4f9dff' : '#c99bff'); w.neck = wornOf('scarf', '#ffd36b');
      break;
    case 'rain':
      w.outer = wornOf('raincoat', '#ffd36b'); w.shoes = wornOf('rainboots', '#ffd36b');
      break;
    case 'pjs':
      delete w.top; delete w.bottom; delete w.outer; w.dress = wornOf('pjs', look.boy ? '#9ec9ff' : '#ffb6d2'); w.shoes = wornOf('bunnySlippers');
      break;
    case 'fancy':
      if (look.boy) w.neck = wornOf('bowtie', '#ff6f91');
      else { delete w.top; delete w.bottom; w.dress = wornOf('party', '#ff9ec7'); }
      break;
  }
  for (const a of m.acc ?? []) {
    if (a === 'carrot' || a === 'helmet') delete w.head;
    const map = DOLL_ACC[a];
    if (map) w[map[0]] = wornOf(map[1], map[2]);
  }
  if (m.hold && DOLL_HAND.has(m.hold)) w.hand = wornOf(m.hold, m.hold === 'umbrella' ? '#ff7eb6' : undefined);
  return { ...look, wear: w };
}

function kidArt(m: CastMember, bg: string, A: boolean, i: number): string {
  const look = dressKid(KIDS[m.who](), m);
  const pose = (m.pose ?? 'stand') as Pose;
  const ex = (m.expr ?? 'normal') as Ex;
  const b: Body = body(look.age, !!look.boy);
  const k = 340 / dollHeight(look);
  let doll = renderDoll(look, { pose, expr: ex === 'sad' ? 'normal' : ex });
  // extras drawn in standing doll space
  let extra = '';
  const eyeX = b.R * 0.38;
  const eyeY = b.headY + b.R * 0.12;
  if (ex === 'sad') extra += tearG(-eyeX - 4, eyeY + 16, A, 1.3) + P(`M${f(-eyeX - 14)} ${f(eyeY - 30)} L${f(-eyeX + 10)} ${f(eyeY - 38)} M${f(eyeX + 14)} ${f(eyeY - 30)} L${f(eyeX - 10)} ${f(eyeY - 38)}`, 'none', SK(dark(look.hairColor, 0.1), 4));
  if (ex === 'sleep' && !m.swim) extra += zzzG(b.R * 0.9, b.headY - b.R, A, !!m.flip, 1.3);
  for (const a of m.acc ?? []) {
    if (a === 'helmet') extra += E(0, b.shY + 4, b.R * 0.75, 16, '#c9cfe0') + C(0, b.headY - 6, b.R + 40, '#cdefff', `fill-opacity="0.2" stroke="#ffffff" stroke-width="5" stroke-opacity="0.85"`) + P(`M${f(-b.R - 20)} ${f(b.headY - 40)} Q${f(-b.R)} ${f(b.headY - b.R - 20)} ${f(-20)} ${f(b.headY - b.R - 40)}`, 'none', SK('#ffffff', 8, op(0.6)));
    if (a === 'goggles') extra += LN(-b.R, eyeY - 4, b.R, eyeY - 4, '#ff9f43', 8) + E(-eyeX, eyeY, 24, 20, '#bfefff', `fill-opacity="0.5" stroke="#ff9f43" stroke-width="5"`) + E(eyeX, eyeY, 24, 20, '#bfefff', `fill-opacity="0.5" stroke="#ff9f43" stroke-width="5"`);
    if (a === 'party') extra += G(at(20, b.headY - b.R * 0.92, 1.4, 14), P('M-22 0 L0 -66 L22 0Z', '#7cc8ff') + P('M-15 -20 L15 -20 L11 -32 L-11 -32Z', '#ffd36b') + C(0, -68, 8, '#ff6f91'));
    if (a === 'chef') extra += G(at(0, b.headY - b.R * 0.85, 1.5), R(-34, -30, 68, 30, 6, '#ffffff') + C(-24, -44, 20, '#ffffff') + C(0, -56, 24, '#ffffff') + C(24, -44, 20, '#ffffff'));
    if (a === 'carrot') extra += G(at(0, b.headY - b.R * 0.9, 1.6, 180), P('M-12 -20 L12 -20 L0 40Z', '#ff9a3c') + P('M0 -20 L-10 -40 M0 -20 L0 -44 M0 -20 L10 -40', 'none', SK('#5fbf6a', 5)));
  }
  if (m.hold && PROPS[m.hold] && !DOLL_HAND.has(m.hold)) {
    const def = PROPS[m.hold];
    const [hs, gy] = def.hold ?? [0.6, -30];
    const angle = pose === 'held' ? -118 : pose === 'wave' ? -128 : pose === 'sit' ? -14 : -9;
    const a = rad(angle);
    const hx = b.armX - Math.sin(a) * b.armLen;
    const hyy = b.armY + Math.cos(a) * b.armLen;
    extra += `<g transform="translate(${f(hx)} ${f(hyy)}) scale(${f2(hs / k)}) translate(0 ${f(-gy)})">${def.draw(undefined, A, i, { id: m.hold, x: 0 })}</g>` + (def.handle ? C(hx, hyy, b.armW * 0.62, look.skin) : '');
  }
  if (pose === 'sit') {
    // renderDoll lifted the seated doll so its hip is at 0; put the extras in that same frame
    doll = doll.replace(/<\/g>$/, () => `${extra}</g>`);
    const ride = m.ride ? PROPS[m.ride] : undefined;
    const drop = ride?.seat !== undefined ? ride.seat / k : b.legLen * 0.42 + 16;
    let seat = '';
    if (!ride) {
      const top = -drop + 4;
      if (INDOOR.has(bg)) seat = R(-64, top, 128, -top, 22, '#ff9ec7') + R(-64, top, 128, 18, 9, '#ffb6d2');
      else if (bg === 'snow') seat = P(`M-74 0 Q-70 ${f(top)} 0 ${f(top - 6)} Q70 ${f(top)} 74 0Z`, '#ffffff') + P(`M-50 ${f(top + 14)} Q0 ${f(top + 4)} 50 ${f(top + 14)}`, 'none', SK('#dbe7f6', 5));
      else if (bg === 'beach' || bg === 'ocean' || bg === 'space') seat = P(`M-70 0 Q-74 ${f(top)} -20 ${f(top - 4)} Q60 ${f(top - 6)} 70 0Z`, bg === 'space' ? '#c3bade' : '#c9b8a8') + E(-20, top + 8, 22, 6, '#ffffff', op(0.25));
      else seat = R(-60, top, 120, -top, 10, '#c48a5a') + E(0, top, 60, 12, '#e8b98a') + E(0, top, 40, 7, 'none', SK('#c48a5a', 2));
    }
    return seat + G(at(0, 0, k), G(`translate(0 ${f(-drop)})`, doll));
  }
  return G(at(0, 0, k), doll + extra);
}

// ---------------------------------------------------------------- placing the cast
const FEET = 520 / 600;
function castG(m: CastMember, bg: string, A: boolean, i: number): string {
  const sp = SPECIES[m.who];
  const kid = !sp && !!KIDS[m.who];
  if (!sp && !kid) return '';
  const pose = m.pose ?? 'stand';
  const x = clamp(m.x, -0.2, 1.2) * 1000;
  const y = clamp(m.y ?? FEET, -0.2, 1.3) * 600;
  const sc = clamp(m.size ?? 1, 0.2, 3) * (sp ? sp.size : 1);
  const ride = m.ride ? PROPS[m.ride] : undefined;
  let inner = kid ? kidArt(m, bg, A, i) : animalArt(sp!, m, A, i);
  const water = kid ? (pose === 'sit' ? 40 : 150) : pose === 'sit' ? 20 : 56;
  const lift = !A && pose === 'held' && !m.swim ? -12 : 0;
  let motion = '';
  if (A) {
    const b = i * 0.37;
    if (m.swim) motion = aMove(0, -8, 2.2, b);
    else if (pose === 'held') motion = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -26;0 0" keyTimes="0;0.4;1" calcMode="spline" keySplines="0.2 0.6 0.4 1;0.6 0 0.8 0.4" ${rep(0.75, b)}/>`;
    else if (m.expr === 'sleep') motion = aScale(1.0, 1.02, 3.4, b);
    else motion = aMove(0, pose === 'sit' ? -3 : -6, 2 + (i % 3) * 0.3, b);
  }
  if (ride && pose === 'sit') {
    const rs = sc * (sp ? 1.1 / sp.size : 1.6);
    const seatY = (ride.seat ?? 20) * rs;
    const rider = `<g transform="translate(0 ${f(-seatY)}) scale(${f2(m.flip ? -sc : sc)} ${f2(sc)})">${inner}</g>`;
    const sled = `<g transform="scale(${f2(m.flip ? -rs : rs)} ${f2(rs)})">${ride.draw(undefined, A, i, { id: m.ride!, x: 0 })}</g>`;
    const front = ride.front ? `<g transform="scale(${f2(m.flip ? -rs : rs)} ${f2(rs)})">${ride.front(undefined)}</g>` : '';
    const all = sled + rider + front;
    return E(x, y, 110 * rs, 12 * rs, '#3a1d3f', op(0.12)) + `<g transform="translate(${f(x)} ${f(y)})">${mv(A, all, A ? aMove(4, -3, 0.8, i) : '')}</g>`;
  }
  if (m.swim) {
    const id = uid('swim');
    inner = `<defs><clipPath id="${id}"><rect x="-400" y="-1400" width="800" height="${f(1400 - water)}"/></clipPath></defs><g clip-path="url(#${id})"><g>${inner}${motion}</g></g>`;
    const ripple = mv(A, E(0, 0, 70 * sc, 10 * sc, 'none', `stroke="#ffffff" stroke-width="3" ${op(0.8)}`) + E(0, 0, 95 * sc, 15 * sc, 'none', `stroke="#ffffff" stroke-width="2" ${op(0.45)}`), aScale(1.1, 1.1, 1.8, i));
    return `<g transform="translate(${f(x)} ${f(y + water * sc)}) scale(${f2(m.flip ? -sc : sc)} ${f2(sc)})">${inner}</g><g transform="translate(${f(x)} ${f(y)})">${ripple}</g>`;
  }
  const grounded = y >= 0.78 * 600 || (y > 0.38 * 600 && y < 0.45 * 600);
  const shadow = grounded ? E(x, y, (kid ? 56 : 52) * sc, 10 * sc, '#3a1d3f', op(0.13)) : '';
  return shadow + `<g transform="translate(${f(x)} ${f(y + lift)}) scale(${f2(m.flip ? -sc : sc)} ${f2(sc)})"><g>${inner}${motion}</g></g>`;
}

// ---------------------------------------------------------------- public API
/** Inner SVG for a story page, in a 1000 x 600 box. With animate, characters move (for movies). */
export function storyScene(page: StoryPage, opts: { animate?: boolean } = {}): string {
  const A = !!opts.animate;
  const night = page.time === 'night';
  const bg = BG[page.bg] ? page.bg : 'meadow';
  let s = BG[bg](A, night);
  if (night && !NIGHT_NATIVE.has(bg)) s += R(-10, -10, 1020, 620, 0, '#1f2468', op(0.32));
  const props = page.props ?? [];
  const isBack = (p: StoryProp) => p.back ?? PROPS[p.id]?.back ?? false;
  props.forEach((p, k) => { if (isBack(p)) s += propG(p, A, k); });
  const cast = page.cast.map((m, k) => ({ m, k })).sort((a, b) => (a.m.y ?? FEET) - (b.m.y ?? FEET) || a.k - b.k);
  for (const { m, k } of cast) s += castG(m, bg, A, k);
  props.forEach((p, k) => { if (!isBack(p)) s += propG(p, A, k + 20); });
  return s;
}

function wrapTitle(title: string, max: number): string[] {
  const words = title.split(/\s+/).filter(Boolean);
  // prefer two balanced lines when they fit
  if (title.length > max) {
    let best: string[] | null = null;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' ');
      const b = words.slice(k).join(' ');
      if (a.length <= max + 2 && b.length <= max + 2 && (!best || Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length))) best = [a, b];
    }
    if (best) return best;
  }
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + ' ' + w).length <= max) lines[lines.length - 1] = last + ' ' + w;
    else lines.push(w);
  }
  return lines.length ? lines : [''];
}

/** A whole book cover <svg>, viewBox 0 0 300 400. */
export function storyCover(story: Story): string {
  const bg = story.cover.bg || '#ffd6e0';
  const col = story.cover.color || '#d6336c';
  const movie = story.kind === 'movie';
  const id = uid('cov');
  const first = story.pages[0];
  const sceneBg = first && BG[first.bg] ? first.bg : 'meadow';
  const who = (story.cover.who.length ? story.cover.who : (first?.cast ?? []).map((c) => c.who)).filter((w) => SPECIES[w] || KIDS[w]).slice(0, 3);
  const n = who.length;
  const spots = n === 1 ? [0.5] : n === 2 ? [0.4, 0.6] : [0.32, 0.5, 0.68];
  const animal = (w: string) => (n === 1 ? 1.25 : 1.05) * (0.45 + 0.55 / SPECIES[w].size);
  const cast: CastMember[] = who.map((w, k) => ({ who: w, x: spots[k], pose: k === 0 ? 'wave' : k === 2 ? 'held' : 'stand', expr: 'happy', size: KIDS[w] ? 0.95 : animal(w), flip: k === n - 1 && n > 1 }));
  const art = storyScene({ text: '', bg: sceneBg, cast, time: first?.time }, { animate: false });

  // title lettering
  const lines = wrapTitle(story.title, 13);
  const longest = Math.max(...lines.map((l) => l.length), 4);
  const size = Math.min(40, Math.max(22, 250 / (longest * 0.56)), lines.length > 2 ? 30 : 40);
  const lh = size * 1.08;
  const top = 26 + (3 - Math.min(3, lines.length)) * lh * 0.32;
  let title = '';
  lines.forEach((l, k) => {
    const y = top + size * 0.9 + k * lh;
    const t = esc(l);
    const darkCover = luma(bg) < 0.45;
    title += (darkCover ? '' : T(152, y + 3, t, size, dark(col, 0.35), op(0.35))) + T(150, y, t, size, col, `stroke="${darkCover ? dark(bg, 0.45) : '#ffffff'}" stroke-width="${f(size * 0.2)}" stroke-linejoin="round" paint-order="stroke"`);
  });
  const titleBottom = top + lines.length * lh + 6;
  const frameY = Math.max(148, Math.min(178, titleBottom + 6));
  const frameH = 372 - frameY;

  let s = `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><clipPath id="${id}"><rect x="34" y="${f(frameY)}" width="232" height="${f(frameH)}" rx="16"/></clipPath></defs>`;
  s += R(0, 0, 300, 400, 18, bg) + R(0, 0, 300, 400, 18, '#ffffff', op(0.08));
  for (let k = 0; k < 14; k++) s += P(k % 2 ? sparkleD(20 + rnd(k) * 260, 20 + rnd(k * 3) * 360, 5) : heartD(20 + rnd(k) * 260, 20 + rnd(k * 3) * 360, 5), '#ffffff', op(0.35));
  if (movie) {
    s += R(0, 0, 22, 400, 0, '#2d2240', op(0.85)) + R(278, 0, 22, 400, 0, '#2d2240', op(0.85));
    for (let y = 10; y < 400; y += 26) s += R(6, y, 10, 14, 3, '#ffffff', op(0.9)) + R(284, y, 10, 14, 3, '#ffffff', op(0.9));
  } else {
    s += R(0, 0, 20, 400, 0, dark(bg, 0.18)) + R(20, 0, 4, 400, 0, '#ffffff', op(0.35)) + R(292, 6, 8, 388, 3, '#fffaf2');
  }
  s += R(28, frameY - 6, 244, frameH + 12, 20, '#ffffff') + R(28, frameY - 6, 244, frameH + 12, 20, 'none', `stroke="${col}" stroke-width="3" ${op(0.5)}`);
  s += `<g clip-path="url(#${id})"><svg x="34" y="${f(frameY)}" width="232" height="${f(frameH)}" viewBox="250 130 500 ${f((500 * frameH) / 232)}" preserveAspectRatio="xMidYMax slice">${art}</svg></g>`;
  s += title;
  if (movie) s += C(244, frameY + 22, 18, col) + P(`M238 ${f(frameY + 12)} L254 ${f(frameY + 22)} L238 ${f(frameY + 32)}Z`, '#ffffff');
  return s + '</svg>';
}
