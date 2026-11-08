// Things held in one hand: purses, plushies, balloons, wands, umbrellas, treats, drinks, flowers,
// toys and arty gadgets. The origin is the centre of the doll's right hand (radius about 11), kept
// upright however the arm is angled. Tall things rise up and a little outward so the head never
// hides them. Most held things get a few skin-colored fingers drawn over the handle.
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { motif } from '../motifs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, bowG, circ, f, flowerG, heartD, line, sparkleD, starD } from './base';

interface V {
  k: string;
  n: string;
  c: string;
  a?: string;
  o?: string;
  t?: Season[];
  p?: Pattern;
  fixed?: boolean;
}
interface Style {
  group: string;
  key: string;
  vs: V[];
  draw: (x: WearCtx, v: V) => string;
  tags?: Season[];
  premium?: number;
}

// ---------- helpers ----------
const stroke = (d: string, c: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shine = (x: number, y: number, r: number, op = 0.75) => circ(x, y, r, '#fff', `opacity="${op}"`);
const ell = (x: number, y: number, rx: number, ry: number, c: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}" ${extra}/>`;
const ball = (x: number, y: number, r: number, c: string) => circ(x, y, r, c) + circ(x, y, r, 'url(#g-face)') + shine(x - r * 0.35, y - r * 0.38, r * 0.28, 0.8);
const rect = (x: number, y: number, w: number, h: number, rx: number, c: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${c}" ${extra}/>`;
const sparkle = (x: number, y: number, r: number, c = '#fff') => P(sparkleD(x, y, r), c);
const twinkle = (x: number, y: number, r: number, delay = 0, c = '#fff') =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></path>`;
const tx = (x: number, y: number, s = '') => `transform="translate(${f(x)} ${f(y)}) ${s}"`;
const edge = (c: string, w = 1) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
const RAINBOW = ['#ff6f91', '#ffab5e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
const GOLD = 'url(#g-gold)';
const SILVER = 'url(#g-silver)';
const eyes = (dx: number, y: number, r = 2.2) => circ(-dx, y, r, '#2d2a3a') + circ(dx, y, r, '#2d2a3a') + circ(-dx + 0.7, y - 0.8, r * 0.38, '#fff') + circ(dx + 0.7, y - 0.8, r * 0.38, '#fff');
const blush = (dx: number, y: number) => ell(-dx, y, 2.8, 1.7, '#ff8fb0', 'opacity="0.75"') + ell(dx, y, 2.8, 1.7, '#ff8fb0', 'opacity="0.75"');
const smile = (y: number, w = 2.6) => stroke(`M${f(-w)} ${f(y)} Q0 ${f(y + w * 0.9)} ${f(w)} ${f(y)}`, '#2d2a3a', 1.3);
/** Fingers wrapped around a handle, drawn over it so the item looks held. */
const grip = (x: WearCtx, gx = 0, gy = 0) =>
  `<g ${tx(gx, gy)}>${ell(1.2, 1, 7.4, 6.4, x.skin)}${ell(1.2, 1, 7.4, 6.4, 'url(#g-shadeX)')}${stroke('M-3.6 -1.2 L4 -1.2 M-3.6 2.4 L3.6 2.4', dark(x.skin, 0.2), 0.9, 'opacity="0.6"')}</g>`;
/** A gentle sway around the hand, for things on strings. */
const sway = (inner: string, dur = 3.4, deg = 2.5) =>
  `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${-deg} 0 0;${deg} 0 0;${-deg} 0 0" dur="${dur}s" repeatCount="indefinite"/></g>`;
const stick = (y0: number, y1: number, c: string, w = 3.4) => stroke(`M0 ${f(y0)} L0 ${f(y1)}`, dark(c, 0.2), w + 1) + stroke(`M0 ${f(y0)} L0 ${f(y1)}`, c, w) + stroke(`M-0.8 ${f(y0 - 2)} L-0.8 ${f(y1 + 2)}`, '#fff', w * 0.25, 'opacity="0.5"');

// ---------- purses ----------
function purse(x: WearCtx, v: V): string {
  const c = x.c;
  const d = dark(c, 0.22);
  const a = v.a ?? '#ffd24a';
  const handle = (y = 14, w = 10, col = d) => stroke(`M${-w} ${y} Q${-w - 2} -9 0 -9 Q${w + 2} -9 ${w} ${y}`, col, 3);
  const clasp = (y: number) => circ(0, y, 3.4, GOLD, edge('#d99a1e', 0.8)) + shine(-1, y - 1, 1);
  switch (v.o) {
    case 'heart':
      return handle(18) + cloth(heartD(0, 12, 36), c, x.p) + P(heartD(0, 12, 36), 'none', edge(d, 1)) + stroke(`M-14 ${f(22)} Q0 30 14 22`, light(c, 0.4), 1, 'stroke-dasharray="2 2"') + P(heartD(-9, 20, 7), '#fff', 'opacity="0.45"') + clasp(26) + grip(x, 0, -6);
    case 'star':
      return handle(16) + `<path d="${starD(0, 32, 19, 0.55)}" fill="${c}" stroke="${c}" stroke-width="7" stroke-linejoin="round"/>` + P(starD(0, 32, 19, 0.55), 'url(#g-shadeX)') +
        P(starD(0, 32, 13, 0.55), 'none', `stroke="${light(c, 0.45)}" stroke-width="1" stroke-dasharray="2 2" stroke-linejoin="round"`) + circ(0, 32, 4, a) + shine(-1.4, 30.6, 1.3) + grip(x, 0, -6);
    case 'clutch': case 'sparkle': {
      let s = cloth('M-22 -9 L22 -9 Q25 -9 25 -6 L25 12 Q25 15 22 15 L-22 15 Q-25 15 -25 12 L-25 -6 Q-25 -9 -22 -9Z', c, x.p) + P('M-25 -7 L0 6 L25 -7 L25 -9 L-25 -9Z', dark(c, 0.1)) + stroke('M-25 -7 L0 6 L25 -7', dark(c, 0.25), 1);
      if (v.o === 'sparkle') for (let i = 0; i < 22; i++) s += circ(-22 + ((i * 0.618) % 1) * 44, -7 + ((i * 0.7548) % 1) * 20, 1.1, i % 3 ? '#fff' : '#fff3b0', 'opacity="0.85"');
      s += v.o === 'sparkle' ? twinkle(18, -10, 3, 0.3) + twinkle(-17, 12, 2.4, 1) + clasp(6) : `<g ${tx(0, 5, 'scale(0.32)')}>${bowG(0, 0, 1, a)}</g>`;
      return s + grip(x, -14, 2);
    }
    case 'basket': {
      let s = stroke('M-17 20 Q-18 -10 0 -10 Q18 -10 17 20', '#b07a4f', 3.6) + stroke('M-17 20 Q-18 -10 0 -10 Q18 -10 17 20', '#d9a873', 1.6);
      s += flowerG(-8, 15, 6, '#fff') + flowerG(6, 13, 6.5, c) + ball(13, 17, 4.6, '#e8384f');
      s += P('M-20 18 L20 18 L16 44 Q15 47 12 47 L-12 47 Q-15 47 -16 44Z', '#d9a873') + P('M-20 18 L20 18 L16 44 Q15 47 12 47 L-12 47 Q-15 47 -16 44Z', 'url(#g-shadeX)');
      for (let r = 0; r < 3; r++) s += stroke(`M${-19 + r * 1.2} ${25 + r * 7} L${19 - r * 1.2} ${25 + r * 7}`, '#b07a4f', 1.2);
      for (let i = -3; i <= 3; i++) s += line(i * 5, 20, i * 4.2, 45, '#c48d58', 1, 0.8);
      s += rect(-21, 16, 42, 5, 2.5, '#c48d58') + P('M-20 20 L-6 20 L-12 28Z', c) + P('M20 20 L6 20 L12 28Z', c);
      return s + grip(x, 0, -6);
    }
    case 'tote':
      return stroke('M-9 16 L-6 -9 M9 16 L6 -9', d, 3) + cloth('M-17 14 L17 14 L19 48 Q19 50 17 50 L-17 50 Q-19 50 -19 48Z', c, x.p) +
        rect(-17, 14, 34, 5, 1, dark(c, 0.1)) + motif(v.a ?? 'heart', 0, 33, 10) + grip(x, 0, -6);
    case 'bucket': {
      const s = cloth('M-16 14 L16 14 L14 44 Q0 50 -14 44Z', c, x.p) + ell(0, 14, 16, 4.5, dark(c, 0.15)) + ell(0, 14, 13, 3, dark(c, 0.35)) +
        stroke('M-15 19 Q0 24 15 19', light(c, 0.5), 1.6) + stroke('M-6 22 L-9 32 M6 22 L9 32', light(c, 0.5), 1.4) + ball(-9, 33, 2.2, a) + ball(9, 33, 2.2, a);
      return stroke('M-13 15 Q-12 -9 0 -9 Q12 -9 13 15', d, 2.6) + s + grip(x, 0, -6);
    }
    case 'kitty': {
      const s = handle(18) + P('M-15 18 L-13 4 L-5 13Z M15 18 L13 4 L5 13Z', c) + P('M-12 15 L-11 8 L-7 13Z M12 15 L11 8 L7 13Z', '#ff9ec7') + cloth('M-17 28 A17 16 0 1 1 17 28 A17 16 0 1 1 -17 28Z', c, x.p);
      return s + eyes(6, 27, 2) + P('M-1.6 31 L1.6 31 L0 33Z', '#ff7eb6') + stroke('M-3 34 Q-1.5 35.5 0 34 Q1.5 35.5 3 34', '#2d2a3a', 1) + blush(10, 32) +
        stroke('M-9 32 L-18 30 M-9 34 L-18 35 M9 32 L18 30 M9 34 L18 35', dark(c, 0.3), 0.8) + grip(x, 0, -6);
    }
    case 'strawberry': {
      let s = handle(16, 9, '#5fae6b') + cloth('M-18 18 Q0 8 18 18 Q18 40 0 52 Q-18 40 -18 18Z', c, x.p);
      for (const [sx, sy] of [[-9, 24], [0, 22], [9, 24], [-5, 32], [5, 32], [-10, 34], [10, 34], [0, 40], [-4, 46], [4, 46]]) s += ell(sx, sy, 1.2, 1.8, '#ffe680');
      return s + P('M-15 16 L-8 10 L-3 15 L0 9 L3 15 L8 10 L15 16 Q0 22 -15 16Z', '#5fae6b') + ell(-9, 26, 3, 4.5, '#fff', 'opacity="0.35"') + grip(x, 0, -6);
    }
    case 'shell': {
      let s = handle(16, 10, '#f2c14e') + cloth('M0 50 L-20 24 Q-19 12 0 11 Q19 12 20 24Z', c, x.p) + P('M0 50 L-20 24 Q-19 12 0 11 Q19 12 20 24Z', 'none', edge(dark(c, 0.2), 1));
      for (let i = -2; i <= 2; i++) s += stroke(`M0 48 L${i * 7.5} ${13 + Math.abs(i) * 2.5}`, dark(c, 0.15), 1);
      return s + ell(0, 49, 6, 3, dark(c, 0.1)) + ball(0, 22, 3.4, '#fffaf2') + grip(x, 0, -6);
    }
    case 'lunch':
      return stroke('M-9 13 L-9 -6 Q-9 -10 -5 -10 L5 -10 Q9 -10 9 -6 L9 13', dark(c, 0.3), 3.4) + cloth('M-22 14 L22 14 Q25 14 25 17 L25 42 Q25 45 22 45 L-22 45 Q-25 45 -25 42 L-25 17 Q-25 14 -22 14Z', c, x.p) +
        rect(-25, 24, 50, 3, 0, dark(c, 0.15)) + rect(-4, 21, 8, 8, 2, SILVER) + motif(v.a ?? 'apple', -12, 36, 6) + motif('star', 13, 36, 5) + grip(x, 0, -6);
    default:
      // round purse with a flap
      return handle(16) + cloth('M-17 30 A17 17 0 1 1 17 30 A17 17 0 1 1 -17 30Z', c, x.p) + P('M-17 26 A17 16 0 0 1 17 26 Q0 36 -17 26Z', dark(c, 0.1)) +
        stroke('M-17 26 Q0 36 17 26', dark(c, 0.25), 1) + clasp(31) + grip(x, 0, -6);
  }
}

// ---------- plushies ----------
function plush(x: WearCtx, v: V): string {
  const c = x.c;
  const l = light(c, 0.4);
  const d = dark(c, 0.2);
  const kind = v.o ?? 'bunny';
  let back = '';
  let front = '';
  let face = eyes(6, -20) + blush(10, -14) + smile(-14, 2.4);
  let bodyC = c;
  let headC = c;
  let belly = l;
  switch (kind) {
    case 'bunny':
      back += ell(-7, -42, 5.5, 14, c, 'transform="rotate(-10 -7 -42)"') + ell(7, -42, 5.5, 14, c, 'transform="rotate(10 7 -42)"') + ell(-7, -41, 2.6, 9, '#ffb3c7', 'transform="rotate(-10 -7 -41)"') + ell(7, -41, 2.6, 9, '#ffb3c7', 'transform="rotate(10 7 -41)"');
      face = eyes(6, -20) + blush(10, -14) + ell(0, -15, 2, 1.5, '#ff7eb6') + smile(-13, 2);
      break;
    case 'unicorn':
      back += P('M-15 -30 Q-24 -16 -16 -2 Q-22 -18 -10 -28Z', '#ff9ec7') + P('M-13 -33 Q-22 -26 -19 -12 Q-14 -24 -6 -30Z', '#9fd6ff') + P('M-9 -35 Q-14 -32 -14 -24 Q-8 -30 0 -33Z', '#c99bff');
      front += P('M-3 -33 L0 -50 L3 -33Z', GOLD, edge('#d99a1e', 0.8)) + stroke('M-2 -38 L2 -40 M-2.5 -35 L2.5 -37', '#d99a1e', 0.8) + P('M-14 -30 L-12 -40 L-6 -33Z M14 -30 L12 -40 L6 -33Z', c);
      face = stroke('M-8 -20 Q-6 -18 -4 -20 M4 -20 Q6 -18 8 -20', '#2d2a3a', 1.4) + blush(10, -14) + smile(-14, 2);
      break;
    case 'kitty':
      back += P('M-15 -26 L-13 -42 L-3 -33Z M15 -26 L13 -42 L3 -33Z', c) + P('M-12 -29 L-11.5 -38 L-6 -33Z M12 -29 L11.5 -38 L6 -33Z', '#ffb3c7');
      face = eyes(6, -20) + blush(11, -14) + P('M-1.6 -16 L1.6 -16 L0 -14Z', '#ff7eb6') + stroke('M-3 -13 Q-1.5 -11.5 0 -13 Q1.5 -11.5 3 -13', '#2d2a3a', 1) + stroke('M-9 -15 L-18 -17 M-9 -13 L-18 -12 M9 -15 L18 -17 M9 -13 L18 -12', dark(c, 0.3), 0.7);
      front += stroke('M-4 -33 L-3 -29 M0 -34 L0 -30 M4 -33 L3 -29', d, 1.4);
      break;
    case 'puppy':
      back += ell(-15, -22, 6, 11, d, 'transform="rotate(20 -15 -22)"') + ell(15, -22, 6, 11, d, 'transform="rotate(-20 15 -22)"');
      front += ell(-6, -21, 5, 5.4, d);
      face = eyes(6, -20) + blush(11, -13) + ell(0, -14, 5, 3.6, l) + ell(0, -15.6, 2.2, 1.6, '#2d2a3a') + ell(0, -10.4, 1.6, 2, '#ff7eb6');
      front = ell(-15, -22, 6, 11, d, 'transform="rotate(20 -15 -22)"') + ell(15, -22, 6, 11, d, 'transform="rotate(-20 15 -22)"');
      back = '';
      face = ell(-6, -21, 5, 5.4, light(d, 0.2)) + face;
      break;
    case 'dino':
      back += [-12, -4, 4, 12].map((sx, i) => P(`M${sx - 4} ${-30 + Math.abs(sx) * 0.4} L${sx} ${-39 + Math.abs(sx) * 0.4 - (i % 2)} L${sx + 4} ${-30 + Math.abs(sx) * 0.4}Z`, v.a ?? '#ffab5e')).join('');
      back += P('M14 14 Q34 18 32 4 Q26 12 14 6Z', c);
      face = eyes(6, -21) + blush(10, -14) + stroke('M-5 -14 Q0 -10 5 -14', '#2d2a3a', 1.3) + circ(-2, -17, 0.8, d) + circ(2, -17, 0.8, d);
      break;
    case 'panda':
      bodyC = '#2d2a3a';
      headC = '#ffffff';
      belly = '#ffffff';
      back += circ(-13, -31, 6, '#2d2a3a') + circ(13, -31, 6, '#2d2a3a');
      face = ell(-6, -20, 4.6, 5.6, '#2d2a3a', 'transform="rotate(-20 -6 -20)"') + ell(6, -20, 4.6, 5.6, '#2d2a3a', 'transform="rotate(20 6 -20)"') + circ(-6, -21, 1.6, '#fff') + circ(6, -21, 1.6, '#fff') + ell(0, -14.4, 2.2, 1.6, '#2d2a3a') + blush(11, -13) + smile(-12.6, 1.8);
      break;
    case 'penguin':
      belly = '#ffffff';
      face = ell(0, -16, 12, 10, '#ffffff') + eyes(5, -19, 2) + P('M-3 -15 L3 -15 L0 -11Z', '#ffab3d') + blush(9, -13);
      front += ell(-7, 25, 5, 2.6, '#ffab3d') + ell(7, 25, 5, 2.6, '#ffab3d');
      break;
    case 'frog':
      back += circ(-8, -32, 6.5, c) + circ(8, -32, 6.5, c);
      face = circ(-8, -32, 4.2, '#fff') + circ(8, -32, 4.2, '#fff') + circ(-8, -31.5, 2.4, '#2d2a3a') + circ(8, -31.5, 2.4, '#2d2a3a') + shine(-7.2, -32.6, 0.9, 1) + shine(8.8, -32.6, 0.9, 1) +
        stroke('M-9 -16 Q0 -9 9 -16', '#2d2a3a', 1.4) + blush(11, -16);
      belly = light(c, 0.5);
      break;
    case 'octopus': {
      for (let i = 0; i < 6; i++) {
        const sx = -15 + i * 6;
        back += stroke(`M${sx} 6 Q${sx + (i % 2 ? 6 : -6)} 18 ${sx + (i < 3 ? -4 : 4)} 26`, c, 5.4);
      }
      face = eyes(6, -16) + blush(11, -9) + smile(-9, 2.6);
      front += circ(-8, 4, 1.4, l) + circ(8, 6, 1.4, l);
      return `<g ${tx(16, 6)}>${back}${cloth('M-17 6 Q-20 -30 0 -32 Q20 -30 17 6 Q0 12 -17 6Z', c, x.p)}${ell(-6, -24, 4, 2.6, '#fff', 'opacity="0.3"')}${face}${front}${`<g ${tx(10, -26, 'scale(0.28)')}>${bowG(0, 0, 1, v.a ?? '#ff7eb6')}</g>`}</g>` + grip(x, 1, 3);
    }
    case 'elephant':
      back += ell(-16, -20, 10, 12, c) + ell(16, -20, 10, 12, c) + ell(-16, -20, 6, 8, '#ffb3c7', 'opacity="0.7"') + ell(16, -20, 6, 8, '#ffb3c7', 'opacity="0.7"');
      face = eyes(6, -22, 2) + blush(10, -15);
      front += stroke('M0 -18 Q1 -8 -2 -4 Q-5 -2 -6 -5', c, 6.4) + stroke('M0 -18 Q1 -8 -2 -4', d, 0.8, 'opacity="0.5"');
      break;
    case 'owl':
      back += P('M-15 -26 L-14 -38 L-6 -32Z M15 -26 L14 -38 L6 -32Z', c);
      face = circ(-6, -20, 6, '#fff') + circ(6, -20, 6, '#fff') + circ(-6, -20, 3.2, '#2d2a3a') + circ(6, -20, 3.2, '#2d2a3a') + shine(-5, -21.4, 1.1, 1) + shine(7, -21.4, 1.1, 1) + P('M-2.4 -14 L2.4 -14 L0 -10Z', '#ffab3d') + blush(12, -12);
      front += [-6, 0, 6].map((sx) => stroke(`M${sx - 3} 6 Q${sx} 9 ${sx + 3} 6`, d, 1)).join('') + [-4, 2].map((sx) => stroke(`M${sx - 2} 13 Q${sx + 1} 16 ${sx + 4} 13`, d, 1)).join('');
      break;
    case 'lamb': {
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * Math.PI * 2;
        back += circ(Math.cos(an) * 17, 8 + Math.sin(an) * 17, 6, '#ffffff', 'stroke="#efe6f2" stroke-width="0.8"');
      }
      for (let i = 0; i < 7; i++) {
        const an = Math.PI * (1.05 + (i / 6) * 0.9);
        back += circ(Math.cos(an) * 15, -18 + Math.sin(an) * 14, 5.6, '#ffffff', 'stroke="#efe6f2" stroke-width="0.8"');
      }
      bodyC = '#ffffff';
      headC = c;
      belly = '#fffaf5';
      back += ell(-17, -16, 6, 3, dark(c, 0.1), 'transform="rotate(25 -17 -16)"') + ell(17, -16, 6, 3, dark(c, 0.1), 'transform="rotate(-25 17 -16)"');
      break;
    }
    default:
      // strawberry bear
      back += circ(-14, -31, 7.5, c) + circ(14, -31, 7.5, c) + circ(-14, -31, 4, l) + circ(14, -31, 4, l);
      face = eyes(6, -21) + blush(11, -14) + ell(0, -13, 7, 5, l) + ell(0, -14.6, 2.8, 2, d) + smile(-11.6, 1.8);
      front += P(heartD(0, 2, 11), v.a ?? '#ff4f7b') + shine(-3, 5, 1.2);
      belly = 'none';
  }
  const body = cloth('M-17 8 A17 18 0 1 1 17 8 A17 18 0 1 1 -17 8Z', bodyC, x.p) + (belly !== 'none' ? ell(0, 11, 10, 11.5, belly) : '');
  const arms = ell(-15, 4, 5.2, 8.4, kind === 'panda' ? '#2d2a3a' : bodyC, 'transform="rotate(25 -15 4)"') + ell(15, 4, 5.2, 8.4, kind === 'panda' ? '#2d2a3a' : bodyC, 'transform="rotate(-25 15 4)"');
  const feet = ell(-9, 25, 6.5, 4.6, kind === 'panda' ? '#2d2a3a' : kind === 'lamb' ? c : dark(bodyC, 0.06)) + ell(9, 25, 6.5, 4.6, kind === 'panda' ? '#2d2a3a' : kind === 'lamb' ? c : dark(bodyC, 0.06));
  const head = cloth('M-18 -19 A18 17 0 1 1 18 -19 A18 17 0 1 1 -18 -19Z', headC, kind === 'panda' || kind === 'lamb' ? 'none' : x.p) + ell(-7, -29, 5, 3, '#fff', 'opacity="0.3"');
  return `<g ${tx(16, 6)}>${back}${feet}${body}${arms}${head}${face}${front}</g>` + grip(x, 1, 3);
}

// ---------- balloons ----------
const BX = 82;
const BY = -142;
const stringTo = (bx: number, by: number) => stroke(`M0 -4 Q${f(bx * 0.15)} ${f(by * 0.35)} ${f(bx * 0.55)} ${f(by * 0.6)} Q${f(bx * 0.9)} ${f(by * 0.8)} ${f(bx)} ${f(by)}`, '#d9d4e2', 1.3);
const knot = (bx: number, by: number, c: string) => P(`M${f(bx - 3.5)} ${f(by + 5)} L${f(bx + 3.5)} ${f(by + 5)} L${f(bx)} ${f(by - 1)}Z`, dark(c, 0.15));
const roundBalloon = (bx: number, by: number, r: number, c: string, extra = '') =>
  ell(bx, by, r * 0.9, r, c) + extra + ell(bx, by, r * 0.9, r, 'url(#g-face)') + ell(bx - r * 0.38, by - r * 0.42, r * 0.18, r * 0.3, '#fff', `opacity="0.7" transform="rotate(25 ${f(bx - r * 0.38)} ${f(by - r * 0.42)})"`) + knot(bx, by + r + 3, c);
function balloon(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'round';
  switch (kind) {
    case 'polka': {
      const dots = [[-8, -8], [8, -12], [10, 6], [-6, 10], [0, -1], [-13, 2]].map(([dx, dy]) => circ(BX + dx, BY + dy, 2.8, v.a ?? '#fff')).join('');
      return sway(stringTo(BX, BY + 26) + roundBalloon(BX, BY, 23, c, dots)) + grip(x);
    }
    case 'star':
      return sway(stringTo(BX, BY + 22) + `<path d="${starD(BX, BY, 28, 0.52)}" fill="${c}" stroke="${light(c, 0.5)}" stroke-width="3" stroke-linejoin="round"/>` + P(starD(BX, BY, 28, 0.52), 'url(#g-shine)') +
        P(starD(BX - 3, BY - 3, 12, 0.52), '#fff', 'opacity="0.25"') + twinkle(BX + 24, BY - 20, 4) + rect(BX - 2.5, BY + 20, 5, 4, 1, dark(c, 0.2))) + grip(x);
    case 'moon': {
      const k = 1.6;
      const d = `M${f(BX + 6 * k)} ${f(BY - 18 * k)} A${f(18 * k)} ${f(18 * k)} 0 1 0 ${f(BX + 18 * k)} ${f(BY + 8 * k)} A${f(13 * k)} ${f(13 * k)} 0 1 1 ${f(BX + 6 * k)} ${f(BY - 18 * k)}Z`;
      return sway(stringTo(BX - 6, BY + 26) + `<path d="${d}" fill="${c}" stroke="${light(c, 0.5)}" stroke-width="3" stroke-linejoin="round"/>` + P(d, 'url(#g-shine)') +
        circ(BX - 8, BY + 4, 1.8, '#2d2a3a') + stroke(`M${BX - 12} ${BY + 10} Q${BX - 9} ${BY + 13} ${BX - 6} ${BY + 10}`, '#2d2a3a', 1.4) + ell(BX - 14, BY + 9, 2.6, 1.6, '#ff8fb0', 'opacity="0.8"') + twinkle(BX + 22, BY - 18, 4, 0.5, '#fff8c8')) + grip(x);
    }
    case 'bunch': case 'rainbow': {
      const cols = kind === 'rainbow' ? RAINBOW : [c, v.a ?? '#ffd36b', '#7cc8ff', '#ff7eb6'];
      const spots: [number, number][] = kind === 'rainbow' ? [[62, -124], [86, -140], [110, -126], [72, -160], [100, -164], [86, -186]] : [[68, -130], [100, -132], [80, -160], [108, -162]];
      let s = spots.map(([bx, by]) => stringTo(bx, by + 20)).join('');
      spots.forEach(([bx, by], i) => (s += roundBalloon(bx, by, kind === 'rainbow' ? 15 : 17, cols[i % cols.length])));
      return sway(s, 3.8, 2) + grip(x);
    }
    case 'dog': {
      const sausage = (sx: number, sy: number, rx: number, ry: number, r: number) => ell(sx, sy, rx, ry, c, `transform="rotate(${r} ${f(sx)} ${f(sy)})"`) + ell(sx, sy, rx, ry, 'url(#g-face)', `transform="rotate(${r} ${f(sx)} ${f(sy)})"`) + ell(sx - rx * 0.3, sy - ry * 0.4, rx * 0.3, ry * 0.25, '#fff', `opacity="0.6" transform="rotate(${r} ${f(sx)} ${f(sy)})"`);
      return `<g ${tx(22, -36, 'scale(1.35)')}>` + sausage(-8, 18, 4, 11, 10) + sausage(10, 18, 4, 11, -10) + sausage(-9, -2, 4, 11, -15) + sausage(11, -2, 4, 11, 15) + sausage(1, 4, 15, 6, 0) +
        sausage(17, -10, 4, 9, 40) + sausage(-14, -14, 4, 12, -10) + sausage(-20, -26, 10, 7, 0) + sausage(-24, -18, 4, 9, 20) + circ(-29, -27, 1.5, '#2d2a3a') + '</g>' + grip(x);
    }
    case 'bunny': case 'kitty': {
      const ears = kind === 'bunny'
        ? ell(BX - 9, BY - 30, 6, 15, c, `transform="rotate(-12 ${BX - 9} ${BY - 30})"`) + ell(BX + 9, BY - 30, 6, 15, c, `transform="rotate(12 ${BX + 9} ${BY - 30})"`) + ell(BX - 9, BY - 30, 3, 10, '#ffd6e3', `transform="rotate(-12 ${BX - 9} ${BY - 30})"`) + ell(BX + 9, BY - 30, 3, 10, '#ffd6e3', `transform="rotate(12 ${BX + 9} ${BY - 30})"`)
        : P(`M${BX - 19} ${BY - 8} L${BX - 16} ${BY - 30} L${BX - 4} ${BY - 20}Z M${BX + 19} ${BY - 8} L${BX + 16} ${BY - 30} L${BX + 4} ${BY - 20}Z`, c, `stroke="${c}" stroke-width="3" stroke-linejoin="round"`);
      const face = `<g ${tx(BX, BY)}>${eyes(7, -2, 2.6)}${blush(12, 5)}${stroke('M-3 6 Q0 9 3 6', '#2d2a3a', 1.4)}` +
        (kind === 'kitty' ? stroke('M-10 4 L-20 2 M10 4 L20 2', dark(c, 0.3), 0.9) : '') + '</g>';
      return sway(stringTo(BX, BY + 26) + ears + roundBalloon(BX, BY, 22, c, '') + face) + grip(x);
    }
    case 'cloud': {
      const d = `M${BX - 26} ${BY + 10} Q${BX - 34} ${BY - 6} ${BX - 18} ${BY - 10} Q${BX - 16} ${BY - 28} ${BX} ${BY - 24} Q${BX + 14} ${BY - 34} ${BX + 22} ${BY - 14} Q${BX + 36} ${BY - 10} ${BX + 28} ${BY + 10} Q${BX} ${BY + 18} ${BX - 26} ${BY + 10}Z`;
      return sway(stringTo(BX, BY + 15) + P(d, c, `stroke="${light(c, 0.4)}" stroke-width="2"`) + P(d, 'url(#g-shine)') + `<g ${tx(BX, BY)}>${eyes(7, -2, 2.4)}${blush(12, 4)}${smile(3, 3)}</g>` + knot(BX, BY + 18, c)) + grip(x);
    }
    case 'planet':
      return sway(stringTo(BX, BY + 26) + roundBalloon(BX, BY, 21, c, stroke(`M${BX - 18} ${BY - 4} Q${BX} ${BY - 10} ${BX + 18} ${BY - 4}`, light(c, 0.3), 2.4, 'opacity="0.7"')) +
        `<ellipse cx="${BX}" cy="${BY + 2}" rx="34" ry="8" fill="none" stroke="${v.a ?? '#ffd24a'}" stroke-width="4" transform="rotate(-14 ${BX} ${BY + 2})" stroke-dasharray="64 18 200"/>` + twinkle(BX - 28, BY - 22, 3.4, 0.2) + twinkle(BX + 30, BY - 18, 2.6, 0.9)) + grip(x);
    default:
      return sway(stringTo(BX, BY + 26) + roundBalloon(BX, BY, 23, c)) + grip(x);
  }
}

// ---------- wands ----------
function wand(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'heart';
  const ty = -64;
  const a = v.a ?? '#ff7eb6';
  let top = '';
  switch (kind) {
    case 'heart':
      top = P(heartD(0, ty - 14, 28), c, edge(dark(c, 0.25), 1.4)) + P(heartD(0, ty - 8, 17), light(c, 0.35)) + P(heartD(-6, ty - 9, 6), '#fff', 'opacity="0.6"');
      break;
    case 'moon':
      top = P(`M4 ${ty - 17} A17 17 0 1 0 17 ${ty + 6} A12 12 0 1 1 4 ${ty - 17}Z`, GOLD, edge('#d99a1e', 1.2)) + P(starD(10, ty - 4, 5.5), c) + circ(-6, ty - 4, 2, '#fff', 'opacity="0.6"');
      break;
    case 'crown':
      top = P(`M-15 ${ty + 8} L-17 ${ty - 10} L-8 ${ty - 2} L0 ${ty - 16} L8 ${ty - 2} L17 ${ty - 10} L15 ${ty + 8}Z`, GOLD, edge('#d99a1e', 1.2)) + rect(-15, ty + 4, 30, 5, 1.5, '#f0b232') +
        circ(0, ty + 1, 3.4, c) + circ(-9, ty + 2, 2.2, '#7cc8ff') + circ(9, ty + 2, 2.2, '#5fd3b5') + circ(0, ty - 16, 2.4, '#fff') + circ(-17, ty - 10, 2, '#fff') + circ(17, ty - 10, 2, '#fff');
      break;
    case 'butterfly':
      top = `<g class="flutter">` + ell(-9, ty - 6, 10, 8, c, `transform="rotate(-25 -9 ${ty - 6})"`) + ell(9, ty - 6, 10, 8, c, `transform="rotate(25 9 ${ty - 6})"`) + ell(-7, ty + 7, 6.5, 5.5, light(c, 0.35)) + ell(7, ty + 7, 6.5, 5.5, light(c, 0.35)) +
        circ(-10, ty - 7, 3, '#fff', 'opacity="0.8"') + circ(10, ty - 7, 3, '#fff', 'opacity="0.8"') + '</g>' + ell(0, ty, 2.4, 11, '#4a3f5e') + stroke(`M-1 ${ty - 10} L-5 ${ty - 17} M1 ${ty - 10} L5 ${ty - 17}`, '#4a3f5e', 1.2);
      break;
    case 'flower':
      top = flowerG(0, ty, 17, c) + `<ellipse cx="-9" cy="${ty + 20}" rx="7" ry="3" fill="#6fc47c" transform="rotate(-30 -9 ${ty + 20})"/>`;
      break;
    case 'snowflake': {
      for (let i = 0; i < 3; i++) top += `<g transform="translate(0 ${ty}) rotate(${i * 60})">${stroke('M0 -17 L0 17 M-5 -12 L0 -8 L5 -12 M-5 12 L0 8 L5 12', dark(c, 0.25), 5)}${stroke('M0 -17 L0 17 M-5 -12 L0 -8 L5 -12 M-5 12 L0 8 L5 12', c, 3)}</g>`;
      top += circ(0, ty, 4, '#fff');
      break;
    }
    case 'orb':
      top = circ(0, ty, 15, c, 'opacity="0.85"') + circ(0, ty, 15, 'url(#g-glass)') + circ(0, ty, 15, 'none', `stroke="${light(c, 0.5)}" stroke-width="1.4"`) + P(starD(2, ty + 2, 5), '#fff8c8') + ell(-6, ty - 7, 4, 2.4, '#fff', `opacity="0.8" transform="rotate(-30 -6 ${ty - 7})"`) +
        P(`M-9 ${ty + 12} Q0 ${ty + 18} 9 ${ty + 12} L6 ${ty + 18} L-6 ${ty + 18}Z`, GOLD);
      break;
    case 'unicorn': {
      top = P(`M-8 ${ty + 12} L0 ${ty - 22} L8 ${ty + 12}Z`, light(c, 0.3), edge(dark(c, 0.15), 1)) + [0, 1, 2, 3].map((i) => stroke(`M${-6 + i * 1.6} ${ty + 6 - i * 8} L${6 - i * 1.6} ${ty + 2 - i * 8}`, c, 2)).join('');
      top += P(`M-8 ${ty + 12} Q0 ${ty + 16} 8 ${ty + 12}`, 'none', `stroke="${GOLD}" stroke-width="3"`);
      break;
    }
    default: {
      // rainbow shooting star
      RAINBOW.slice(0, 4).forEach((col, i) => (top += stroke(`M0 ${ty} Q${-14 - i * 2} ${ty + 6 + i * 4} ${-20 - i * 3} ${ty + 24 + i * 4}`, col, 3)));
      top += P(starD(0, ty, 16, 0.5), GOLD, edge('#d99a1e', 1.2)) + circ(-4, ty - 4, 2.2, '#fff', 'opacity="0.7"');
    }
  }
  const stickC = kind === 'crown' || kind === 'moon' ? '#ffd9e8' : light(c, 0.55);
  const ribbon = stroke(`M1 ${ty + 18} Q10 ${ty + 22} 14 ${ty + 32} M-1 ${ty + 18} Q-8 ${ty + 26} -6 ${ty + 36}`, a, 2.4);
  return stick(12, ty + 12, stickC) + ribbon + top + twinkle(18, ty - 16, 4.2, 0) + twinkle(-17, ty - 6, 3.2, 0.8, '#fff8c8') + grip(x);
}

// ---------- umbrellas ----------
function umbrella(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'dots';
  const handle = `<path d="M0 10 L0 -100" stroke="#4a3f5e" stroke-width="3"/>` + stroke('M0 10 Q0 18 -7 16', v.a ?? '#4a3f5e', 3.4);
  const dome = 'M-62 -96 Q-60 -150 0 -152 Q60 -150 62 -96 Q52 -104 41 -96 Q31 -104 21 -96 Q10 -104 0 -96 Q-10 -104 -21 -96 Q-31 -104 -41 -96 Q-52 -104 -62 -96Z';
  const ribs = `<path d="M-21 -96 Q-14 -140 0 -152 M21 -96 Q14 -140 0 -152" fill="none" stroke="${dark(c, 0.15)}" stroke-width="1.5"/>`;
  let s = '';
  switch (kind) {
    case 'rainbow': {
      const xs = [-62, -41, -21, 0, 21, 41, 62];
      s = P(dome, RAINBOW[0]);
      for (let i = 1; i < 5; i++) s += P(`M0 -152 L${xs[i]} -96 Q${(xs[i] + xs[i + 1]) / 2} -104 ${xs[i + 1]} -96Z`, RAINBOW[i]);
      s += P('M0 -152 Q60 -150 62 -96 Q52 -104 41 -96Z', RAINBOW[5]) + P(dome, 'url(#g-shadeX)') + stroke('M-41 -96 L0 -152 L41 -96', '#fff', 1, 'opacity="0.4"');
      break;
    }
    case 'bubble': {
      const bd = 'M-48 -92 Q-52 -164 0 -166 Q52 -164 48 -92 Q0 -84 -48 -92Z';
      s = P(bd, '#ffffff', 'opacity="0.35"') + P(bd, 'url(#g-glass)') + P(bd, 'none', `stroke="${c}" stroke-width="3"`) + stroke('M-48 -92 Q0 -84 48 -92', c, 4) +
        stroke('M-34 -140 Q-24 -156 -6 -158', '#fff', 3, 'opacity="0.8"') + stroke('M-16 -96 Q-12 -150 0 -166 M16 -96 Q12 -150 0 -166', light(c, 0.3), 1, 'opacity="0.6"');
      return `<g transform="rotate(38) scale(0.92)">${handle}${s}${circ(0, -167, 3.5, c)}</g>` + grip(x);
    }
    case 'frog':
      s = cloth(dome, c, x.p, 'y') + ribs + circ(-16, -150, 9, c) + circ(16, -150, 9, c) + circ(-16, -151, 6, '#fff') + circ(16, -151, 6, '#fff') + circ(-15, -151, 3.4, '#2d2a3a') + circ(17, -151, 3.4, '#2d2a3a') +
        stroke('M-20 -118 Q0 -104 20 -118', '#2d2a3a', 2.4) + ell(-30, -118, 5, 3, '#ff8fb0', 'opacity="0.8"') + ell(30, -118, 5, 3, '#ff8fb0', 'opacity="0.8"');
      return `<g transform="rotate(38) scale(0.92)">${handle}${s}</g>` + grip(x);
    case 'parasol': {
      const pd = 'M-52 -104 Q-50 -146 0 -148 Q50 -146 52 -104Z';
      for (let i = 0; i < 11; i++) {
        const px = -52 + i * 10.4;
        s += circ(px, -102, 5.5, '#ffffff', 'stroke="#efe6f2" stroke-width="0.8"') + circ(px, -101, 1.4, '#efe6f2');
      }
      s += cloth(pd, c, x.p, 'y') + stroke('M-52 -104 Q0 -96 52 -104', light(c, 0.5), 2) + `<path d="M-18 -104 Q-12 -138 0 -148 M18 -104 Q12 -138 0 -148" fill="none" stroke="${dark(c, 0.12)}" stroke-width="1.2"/>`;
      s += `<g ${tx(0, -104, 'scale(0.4)')}>${bowG(0, 0, 1, v.a ?? '#ff7eb6')}</g>`;
      return `<g transform="rotate(36) scale(0.95)">${stroke('M0 10 L0 -104', '#fff', 2.6)}${stroke('M0 10 Q0 18 -7 16', '#fff', 3)}${s}${circ(0, -150, 3, '#fff')}</g>` + grip(x);
    }
    case 'stars':
      s = cloth(dome, c, x.p, 'y') + ribs + [[-38, -116, 5], [-14, -132, 6], [10, -118, 4.4], [30, -134, 5], [44, -112, 4], [-4, -144, 3.6], [-30, -136, 3.4]].map(([sx, sy, r]) => P(starD(sx, sy, r), v.a ?? '#ffe06b')).join('');
      break;
    default:
      s = cloth(dome, c, x.p, 'y') + ribs;
  }
  return `<g transform="rotate(38) scale(0.92)">${handle}${s}${circ(0, -154, 3.5, '#4a3f5e')}</g>` + grip(x);
}

// ---------- ice cream and pops ----------
const cone = (y0 = -10, y1 = 18) => P(`M-11 ${y0} L11 ${y0} L0 ${y1}Z`, '#e8b46a') + stroke(`M-6 ${y0 + 4} L3 ${y0 + 14} M2 ${y0 + 2} L-3 ${y0 + 10} M7 ${y0 + 3} L-1 ${y0 + 18}`, '#c98a3e', 1.2) + P(`M-11 ${y0} L11 ${y0} L0 ${y1}Z`, 'url(#g-shadeX)');
const sprinkles = (cx: number, cy: number, w: number, h: number, n = 8) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const sx = cx - w / 2 + ((i * 0.618) % 1) * w;
    const sy = cy - h / 2 + ((i * 0.7548) % 1) * h;
    s += `<rect x="${f(sx - 1.6)}" y="${f(sy - 0.6)}" width="3.2" height="1.3" rx="0.6" fill="${RAINBOW[i % 6]}" transform="rotate(${(i * 47) % 180} ${f(sx)} ${f(sy)})"/>`;
  }
  return s;
};
function pop(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'classic';
  const popStick = rect(-3, -6, 6, 22, 3, '#f0d3a0') + rect(-3, -6, 6, 22, 3, 'url(#g-shadeX)');
  switch (kind) {
    case 'softserve': {
      let s = cone(-8, 20);
      const tiers: [number, number, number][] = [[-12, 14, 6], [-22, 11, 6], [-31, 8, 5.5], [-39, 5, 5]];
      for (const [ty, rx, ry] of tiers) s += ell(0, ty, rx, ry, c) + stroke(`M${-rx + 2} ${ty + 1} Q0 ${ty + ry} ${rx - 2} ${ty + 1}`, dark(c, 0.1), 1, 'opacity="0.6"');
      return s + P('M-2 -42 Q2 -50 4 -44 Q2 -42 -2 -42Z', c) + ell(-5, -24, 2.4, 4, '#fff', 'opacity="0.55"') + sprinkles(0, -24, 18, 22, 9) + grip(x, 0, 6);
    }
    case 'double':
      return cone() + circ(0, -18, 12.5, c) + sprinkles(0, -18, 14, 10, 0) + [[-5, -20], [4, -14], [6, -22], [-2, -12]].map(([dx, dy]) => rect(dx, dy, 2.4, 2.4, 0.6, '#6b4226')).join('') +
        circ(0, -36, 11.5, v.a ?? '#a86b4a') + ell(-5, -40, 3, 2, '#fff', 'opacity="0.4"') + ell(-4, -21, 3, 2, '#fff', 'opacity="0.4"') + P('M-12 -14 Q-12 -6 -8 -8 Q-6 -4 -3 -8 Q0 -6 2 -9', c) + grip(x, 0, 6);
    case 'cup':
      return circ(-6, -14, 10, c) + circ(7, -16, 9, v.a ?? '#fff3d8') + P('M-12 -24 Q-6 -34 0 -26 Q6 -36 10 -26 Q4 -20 -12 -24Z', '#fff') + ball(2, -34, 4, '#e8384f') + stroke('M2 -38 Q4 -44 8 -46', '#5f8f3a', 1.2) +
        stroke('M12 -8 L22 -34', '#ffb3c7', 3) + P('M-15 -8 L15 -8 L11 14 Q0 18 -11 14Z', '#ffffff', `stroke="#efe6f2" stroke-width="1"`) + P('M-15 -8 L15 -8 L14 -2 L-14 -2Z', '#ff7eb6') + motif('heart', 0, 6, 5) + grip(x, 0, 8);
    case 'rocket':
      return popStick + P('M-10 -6 L10 -6 L10 -16 L-10 -16Z', '#4f9dff') + P('M-10 -16 L10 -16 L9 -30 L-9 -30Z', '#ffffff') + P('M-9 -30 L9 -30 L0 -46Z', '#e8384f', 'stroke="#e8384f" stroke-width="3" stroke-linejoin="round"') +
        rect(-10, -30, 20, 24, 0, 'url(#g-shadeX)') + ell(-5, -22, 1.6, 4, '#fff', 'opacity="0.5"') + grip(x, 0, 8);
    case 'twin':
      return `<g transform="rotate(-6)">${rect(-9, -6, 5, 22, 2.5, '#f0d3a0')}${rect(4, -6, 5, 22, 2.5, '#f0d3a0')}${P('M-16 -2 L16 -2 L16 -32 Q16 -44 8 -44 Q0 -44 0 -36 Q0 -44 -8 -44 Q-16 -44 -16 -32Z', c)}${P('M-16 -2 L16 -2 L16 -32 Q16 -44 8 -44 Q0 -44 0 -36 Q0 -44 -8 -44 Q-16 -44 -16 -32Z', 'url(#g-shadeX)')}${line(0, -34, 0, -4, dark(c, 0.15), 1.4)}${ell(-10, -30, 1.8, 6, '#fff', 'opacity="0.5"')}</g>` + grip(x, 0, 8);
    case 'fudge':
      return popStick + P('M-11 -6 L11 -6 L11 -34 Q11 -44 4 -44 Q4 -38 -1 -40 Q-4 -44 -6 -44 Q-11 -44 -11 -36Z', '#8a5a3c') + P('M-11 -6 L11 -6 L11 -34 Q11 -44 4 -44 Q4 -38 -1 -40 Q-4 -44 -6 -44 Q-11 -44 -11 -36Z', 'url(#g-shadeX)') +
        stroke('M-7 -14 L7 -14 M-7 -24 L7 -24', '#6b4226', 1.2) + ell(-6, -30, 1.6, 5, '#fff', 'opacity="0.35"') + grip(x, 0, 8);
    case 'watermelon':
      return popStick + P('M-15 -8 L15 -8 L0 -44Z', '#ff5c7a', 'stroke="#ff5c7a" stroke-width="4" stroke-linejoin="round"') + rect(-17, -10, 34, 6, 3, '#5fae6b') + rect(-17, -11, 34, 2, 1, '#fff') +
        [[-6, -18], [5, -20], [0, -28], [-2, -36]].map(([dx, dy]) => ell(dx, dy, 1.2, 2, '#2d2a3a')).join('') + grip(x, 0, 8);
    case 'bunny':
      return popStick + ell(-6, -46, 3.6, 8, c) + ell(6, -46, 3.6, 8, c) + ell(-6, -45, 1.6, 5, '#ffb3c7') + ell(6, -45, 1.6, 5, '#ffb3c7') + P('M-12 -6 L12 -6 L12 -30 Q12 -42 0 -42 Q-12 -42 -12 -30Z', c) +
        P('M-12 -6 L12 -6 L12 -30 Q12 -42 0 -42 Q-12 -42 -12 -30Z', 'url(#g-shadeX)') + `<g ${tx(0, -22)}>${eyes(4.5, -4, 1.8)}${blush(7, 1)}${ell(0, 0, 1.6, 1.2, '#ff7eb6')}${smile(1.6, 1.8)}</g>` + grip(x, 0, 8);
    default: {
      // classic fruit pop with a bite and a drip
      const d = 'M-11 -6 L11 -6 L11 -34 Q11 -44 4 -44 Q4 -38 -1 -40 Q-4 -44 -6 -44 Q-11 -44 -11 -36Z';
      return popStick + P(d, c) + P(d, 'url(#g-shadeX)') + P('M5 -6 Q6 0 4 2 Q2 0 2 -6Z', c) + ell(-6, -28, 1.8, 6, '#fff', 'opacity="0.5"') + motif(v.a ?? 'strawberry', 2, -20, 5) + grip(x, 0, 8);
    }
  }
}

// ---------- sweets ----------
function sweet(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'swirl';
  switch (kind) {
    case 'swirl': {
      let s = stick(10, -30, '#ffffff', 4);
      RAINBOW.forEach((col, i) => (s += circ(0, -50, 21 - i * 3.4, col)));
      s += stroke('M0 -50 m-14 0 a14 14 0 1 1 14 14 a9 9 0 1 1 -9 -9 a4.5 4.5 0 1 1 4.5 4.5', '#fff', 2.2, 'opacity="0.85"');
      return s + circ(0, -50, 21, 'url(#g-face)') + circ(0, -50, 21, 'none', 'stroke="#fff" stroke-width="2"') + ell(-8, -60, 4, 2.6, '#fff', 'opacity="0.7" transform="rotate(-30 -8 -60)"') + grip(x);
    }
    case 'heart':
      return stick(10, -26, '#ffffff', 4) + P(heartD(0, -58, 34), c, `stroke="${light(c, 0.4)}" stroke-width="2"`) + stroke('M-8 -50 Q0 -40 8 -50 Q2 -46 0 -36', light(c, 0.5), 2.4, 'opacity="0.8"') + P(heartD(-8, -52, 7), '#fff', 'opacity="0.5"') +
        `<g ${tx(0, -24, 'scale(0.36)')}>${bowG(0, 0, 1, v.a ?? '#ff7eb6')}</g>` + grip(x);
    case 'star':
      return stick(10, -28, '#ffffff', 4) + `<path d="${starD(0, -48, 20, 0.52)}" fill="${c}" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>` + P(starD(0, -48, 12, 0.52), light(c, 0.4)) + P(starD(0, -48, 20, 0.52), 'url(#g-shine)') + twinkle(16, -66, 3.6) + grip(x);
    case 'cotton': {
      const cols = v.fixed ? ['#ffb3c7', '#9fd6ff', '#e6d4ff', '#ffb3c7', '#9fd6ff'] : [c, light(c, 0.3), c, light(c, 0.2), c];
      let s = stick(12, -26, '#fff3d6', 3.4);
      const puffs: [number, number, number][] = [[-12, -36, 11], [12, -36, 11], [0, -30, 12], [-8, -50, 12], [8, -52, 12], [0, -62, 10], [-16, -48, 8], [16, -48, 8]];
      puffs.forEach(([px, py, r], i) => (s += circ(px, py, r, cols[i % cols.length])));
      return s + puffs.map(([px, py, r]) => circ(px, py, r, 'url(#g-face)', 'opacity="0.5"')).join('') + circ(-6, -56, 3, '#fff', 'opacity="0.6"') + grip(x);
    }
    case 'cupcake':
      return `<g ${tx(0, -14)}>${P('M-13 2 L13 2 L9 18 L-9 18Z', v.a ?? '#7cc8ff')}${stroke('M-6 4 L-5 17 M0 4 L0 17 M6 4 L5 17', dark(v.a ?? '#7cc8ff', 0.15), 1.2)}${circ(-8, -2, 7, c)}${circ(8, -2, 7, c)}${circ(0, -8, 9, c)}${circ(0, -15, 5, c)}` +
        `${circ(0, -8, 11, 'url(#g-face)', 'opacity="0.5"')}${sprinkles(0, -6, 18, 8, 7)}${ball(0, -21, 3.8, '#e8384f')}</g>` + grip(x, 0, 6);
    case 'donut':
      return `<g ${tx(0, -18)}>${circ(0, 0, 18, '#e8b46a')}${P('M-16 -4 Q-14 -16 0 -16 Q14 -16 16 -4 Q15 6 10 4 Q8 10 3 6 Q0 10 -4 6 Q-9 9 -11 4 Q-16 5 -16 -4Z', c)}${circ(0, 0, 6, '#fff5f8')}${circ(0, 0, 6, 'url(#g-face)')}${sprinkles(0, -6, 26, 14, 10)}${circ(0, 0, 18, 'url(#g-face)', 'opacity="0.6"')}</g>` + grip(x, 0, 2);
    case 'cane': {
      const d = 'M0 14 L0 -40 Q0 -54 -12 -54 Q-22 -54 -22 -44';
      return stroke(d, '#fff', 7) + `<path d="${d}" fill="none" stroke="${c}" stroke-width="7" stroke-dasharray="5 5" stroke-linecap="butt"/>` + stroke(d, '#fff', 1.6, 'opacity="0.5" transform="translate(-1.6 0)"') + `<g ${tx(0, -26, 'scale(0.32)')}>${bowG(0, 0, 1, '#3fbf8f')}</g>` + grip(x);
    }
    case 'cookie':
      return `<g ${tx(2, -16)}>${P(starD(0, 0, 20, 0.6), '#e0a868', 'stroke="#e0a868" stroke-width="4" stroke-linejoin="round"')}${P(starD(0, 0, 16, 0.6), 'none', `stroke="${c}" stroke-width="2" stroke-dasharray="3 2" stroke-linejoin="round"`)}${eyes(4, -2, 1.6)}${blush(7, 3)}${smile(2.4, 2)}</g>` + grip(x, 0, 2);
    case 'cakepop':
      return stick(10, -26, '#ffffff', 3) + ball(0, -38, 13, c) + P('M-12 -42 Q-6 -52 0 -50 Q6 -52 12 -42 Q10 -36 7 -40 Q4 -34 1 -40 Q-3 -35 -6 -40 Q-9 -36 -12 -42Z', v.a ?? '#fff5f8') + sprinkles(0, -45, 18, 6, 6) +
        `<g ${tx(0, -24, 'scale(0.3)')}>${bowG(0, 0, 1, '#ff7eb6')}</g>` + grip(x);
    default:
      return '';
  }
}

// ---------- drinks ----------
function drink(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'boba';
  switch (kind) {
    case 'boba': {
      const cup = 'M-13 -32 L13 -32 L10 12 Q0 15 -10 12Z';
      return stroke('M4 -32 L10 -64', v.a ?? '#ff7eb6', 5) + P('M-14 -32 Q0 -48 14 -32Z', '#ffffff', 'opacity="0.75" stroke="#efe6f2" stroke-width="1"') + P(cup, c) +
        [[-6, 6], [0, 8], [6, 6], [-3, 2], [4, 2], [-7, 10], [7, 10]].map(([dx, dy]) => circ(dx, dy, 2.4, '#4a2e22')).join('') + P(cup, 'url(#g-glass)') + P(cup, 'url(#g-shadeX)') +
        rect(-13, -33, 26, 3, 1.5, light(c, 0.4)) + `<g ${tx(0, -14)}>${eyes(4.6, -2, 1.8)}${blush(8, 2)}${smile(1.4, 2)}</g>` + grip(x, 0, 4);
    }
    case 'juice':
      return stroke('M6 -30 L6 -38 L12 -44', '#ffffff', 2.6) + rect(-12, -30, 24, 40, 3, c) + rect(-12, -30, 24, 40, 3, 'url(#g-shadeX)') + P('M-12 -30 L-6 -36 L18 -36 L12 -30Z', light(c, 0.3)) + P('M12 -30 L18 -36 L18 4 L12 10Z', dark(c, 0.15)) +
        motif(v.a ?? 'apple', 0, -16, 7) + `<g ${tx(0, -2)}>${eyes(4, 0, 1.5)}${smile(2.4, 1.8)}</g>` + grip(x, 0, 4);
    case 'shake': {
      const cup = 'M-11 -28 L11 -28 L7 10 Q0 12 -7 10Z';
      return stroke('M3 -36 L10 -60', '#ff7eb6', 3.4) + `<path d="M3 -36 L10 -60" stroke="#fff" stroke-width="3.4" stroke-dasharray="3 3"/>` + P(cup, c) + P(cup, 'url(#g-glass)') + P(cup, 'url(#g-shadeX)') +
        circ(-6, -32, 7, '#fff') + circ(6, -32, 7, '#fff') + circ(0, -38, 7, '#fff') + ball(1, -46, 3.6, '#e8384f') + sprinkles(0, -35, 14, 8, 5) + rect(-3, 10, 6, 4, 1, '#fff') + grip(x, 0, 2);
    }
    case 'cocoa': {
      const steam = (sx: number, dl: number) => `<path d="M${sx} -30 q-4 -6 0 -12 q4 -6 0 -12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.7"><animate attributeName="opacity" values="0;0.8;0" dur="2.6s" begin="${dl}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 4;0 -4" dur="2.6s" begin="${dl}s" repeatCount="indefinite"/></path>`;
      return steam(-4, 0) + steam(5, 1.3) + stroke('M14 -18 Q24 -18 24 -8 Q24 2 13 2', dark(c, 0.15), 4) + rect(-14, -26, 28, 30, 6, c) + rect(-14, -26, 28, 30, 6, 'url(#g-shadeX)') + ell(0, -26, 14, 3.4, '#8a5a3c') +
        rect(-8, -29, 6, 5, 1.6, '#fff') + rect(2, -30, 6, 5, 1.6, '#ffd6e3') + P(heartD(0, -16, 10), '#fff', 'opacity="0.85"') + grip(x, -12, -6);
    }
    case 'lemonade': {
      const jar = 'M-12 -30 L12 -30 L12 8 Q12 12 8 12 L-8 12 Q-12 12 -12 8Z';
      return stroke('M5 -34 L12 -56', '#ffe06b', 3) + P(jar, c, 'opacity="0.9"') + P(jar, 'url(#g-glass)') + rect(-13, -34, 26, 6, 2, SILVER) + circ(-3, -10, 5, '#ffe06b') + circ(-3, -10, 3.6, '#fff8c8') +
        stroke('M-3 -14 L-3 -6 M-7 -10 L1 -10', '#ffe06b', 0.8) + rect(4, -4, 4, 4, 1, '#fff', 'opacity="0.6"') + rect(1, 2, 4, 4, 1, '#fff', 'opacity="0.6"') + `<g ${tx(14, -34)}>${circ(0, 0, 7, '#ffe06b')}${circ(0, 0, 5.4, '#fff8c8')}</g>` + grip(x, 0, 4);
    }
    default:
      return '';
  }
}

// ---------- flowers ----------
function bloom(kind: string, bx: number, by: number, c: string): string {
  switch (kind) {
    case 'rose':
      return circ(bx, by, 9, c) + stroke(`M${bx - 5} ${by} A5 5 0 1 1 ${bx} ${by + 5} A3 3 0 1 1 ${bx + 1.6} ${by - 1}`, dark(c, 0.22), 1.6) + P(`M${bx - 9} ${by + 2} Q${bx} ${by + 14} ${bx + 9} ${by + 2} Q${bx} ${by + 8} ${bx - 9} ${by + 2}Z`, dark(c, 0.1)) + circ(bx - 3, by - 4, 2, '#fff', 'opacity="0.4"');
    case 'tulip':
      return P(`M${bx - 9} ${by - 8} L${bx - 5} ${by - 1} L${bx} ${by - 10} L${bx + 5} ${by - 1} L${bx + 9} ${by - 8} L${bx + 9} ${by + 2} Q${bx} ${by + 12} ${bx - 9} ${by + 2}Z`, c) + P(`M${bx} ${by - 10} L${bx + 5} ${by - 1} L${bx} ${by + 7} L${bx - 5} ${by - 1}Z`, light(c, 0.25));
    case 'daisy':
      return flowerG(bx, by, 11, c);
    default:
      return flowerG(bx, by, 9, c);
  }
}
const leaf = (lx: number, ly: number, r: number, c = '#6fc47c') => `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="7" ry="3.2" fill="${c}" transform="rotate(${r} ${f(lx)} ${f(ly)})"/>`;
function flowers(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'rose';
  const stem = (x1: number, y1: number) => stroke(`M0 12 Q${f(x1 * 0.3)} ${f(y1 * 0.5)} ${f(x1)} ${f(y1)}`, '#5fae6b', 3);
  switch (kind) {
    case 'rose': case 'tulip': case 'daisy':
      return stem(4, -50) + leaf(-6, -20, -30) + leaf(7, -32, 30) + bloom(kind, 4, -56, c) + grip(x);
    case 'sunflower': {
      let s = stem(4, -56) + leaf(-8, -22, -30) + leaf(9, -34, 30);
      for (let i = 0; i < 12; i++) s += `<ellipse cx="4" cy="-73" rx="4" ry="8" fill="${i % 2 ? '#ffd24a' : '#ffc23a'}" transform="rotate(${i * 30} 4 -60)"/>`;
      return s + circ(4, -60, 8, '#8a5a3c') + [[-3, -3], [3, -2], [0, 3], [-3, 3], [3, 4]].map(([dx, dy]) => circ(4 + dx, -60 + dy, 1, '#5a3a24')).join('') + `<g ${tx(4, -60)}>${eyes(3, -1, 1.2)}${smile(2, 2)}</g>` + grip(x);
    }
    case 'lavender': {
      let s = '';
      for (const [sx, sy] of [[-8, -46], [0, -54], [8, -46], [-4, -50], [5, -52]] as const) {
        s += stroke(`M0 12 L${sx} ${sy + 18}`, '#5fae6b', 2);
        for (let i = 0; i < 5; i++) s += ell(sx + (i % 2 ? 1.4 : -1.4), sy + i * 4, 2.6, 3.2, i % 2 ? c : light(c, 0.2));
      }
      return s + `<g ${tx(0, -6, 'scale(0.36)')}>${bowG(0, 0, 1, v.a ?? '#fff')}</g>` + grip(x);
    }
    case 'dandelion': {
      let s = stem(2, -46);
      for (let i = 0; i < 16; i++) {
        const an = (i / 16) * Math.PI * 2;
        s += line(2, -56, 2 + Math.cos(an) * 14, -56 + Math.sin(an) * 14, '#ffffff', 1, 0.9) + circ(2 + Math.cos(an) * 14, -56 + Math.sin(an) * 14, 2, '#fff');
      }
      s += `<g>${line(18, -66, 24, -70, '#fff', 1)}${circ(25, -71, 2, '#fff')}<animateTransform attributeName="transform" type="translate" values="0 0;10 -14" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="4s" repeatCount="indefinite"/></g>`;
      return s + circ(2, -56, 4, '#f4ead9') + grip(x);
    }
    default: {
      // bouquets
      const cols = kind === 'rainbow' ? RAINBOW : [c, light(c, 0.35), dark(c, 0.08)];
      const b = kind === 'rainbow' ? 'tulip' : 'rose';
      let s = [-12, -4, 4, 12].map((sx) => stroke(`M0 8 L${sx} -24`, '#5fae6b', 2.4)).join('') + leaf(-14, -18, -40) + leaf(14, -20, 40);
      const spots: [number, number][] = kind === 'rainbow' ? [[-14, -32], [0, -42], [14, -32], [-7, -26], [7, -28]] : [[-11, -30], [11, -30], [0, -40], [0, -24]];
      spots.forEach(([bx, by], i) => (s += bloom(b, bx, by, cols[i % cols.length])));
      s += circ(-17, -42, 3, '#fff') + circ(17, -40, 3, '#fff') + circ(-6, -50, 2.6, '#fff');
      s += P('M-16 -16 L16 -16 L6 16 L-6 16Z', v.a ?? '#fff3f8') + P('M-16 -16 L16 -16 L6 16 L-6 16Z', 'url(#g-shadeX)') + stroke('M-16 -16 L-4 4 M16 -16 L4 4', dark(v.a ?? '#fff3f8', 0.12), 1);
      return s + `<g ${tx(0, 2, 'scale(0.4)')}>${bowG(0, 0, 1, kind === 'rainbow' ? '#c99bff' : '#ff4f7b')}</g>` + grip(x, 0, 6);
    }
  }
}

// ---------- play time ----------
function toy(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'bubbles';
  switch (kind) {
    case 'bubbles': {
      let s = stick(12, -30, c, 3.4) + circ(0, -40, 9, 'none', `stroke="${c}" stroke-width="3"`) + circ(0, -40, 7.5, '#ffffff', 'opacity="0.25"');
      const bub = (bx: number, r: number, dur: number, dl: number) =>
        `<circle cx="${bx}" cy="-50" r="${r}" fill="#ffffff" fill-opacity="0.25" stroke="#9fd6ff" stroke-width="1.2"><animate attributeName="cy" values="-50;-150" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/><animate attributeName="cx" values="${bx};${bx + 14};${bx + 4};${bx + 20}" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/></circle>`;
      s += bub(6, 7, 4, 0) + bub(16, 5, 3.4, 1.2) + bub(0, 9, 4.6, 2.2) + bub(24, 4, 3, 0.6);
      s += circ(20, -84, 8, '#ffffff', 'fill-opacity="0.2" stroke="#c99bff" stroke-width="1.2"') + circ(17, -87, 2, '#fff', 'opacity="0.8"') + circ(30, -112, 6, '#ffffff', 'fill-opacity="0.2" stroke="#ffb3c7" stroke-width="1.2"');
      return s + grip(x);
    }
    case 'sparkler': {
      let s = stroke('M0 12 L0 -40', '#9aa3b5', 2) + stroke('M0 -26 L0 -40', '#5a5a6e', 3);
      const rays = Array.from({ length: 10 }, (_, i) => {
        const an = (i / 10) * Math.PI * 2;
        const r = i % 2 ? 12 : 18;
        return line(0, -42, Math.cos(an) * r, -42 + Math.sin(an) * r, i % 3 ? '#ffe06b' : '#fff8c8', 1.6);
      }).join('');
      s += `<g>${rays}<animateTransform attributeName="transform" type="rotate" values="0 0 -42;36 0 -42" dur="0.5s" repeatCount="indefinite"/></g>`;
      s += circ(0, -42, 9, 'url(#g-glow)') + circ(0, -42, 3, '#fff') + twinkle(12, -56, 4, 0, '#fff8c8') + twinkle(-12, -52, 3, 0.4, '#ffe06b') + twinkle(4, -64, 3.4, 0.8, '#fff');
      return s + grip(x);
    }
    case 'pinwheel': {
      const cols = v.fixed ? ['#ff6f91', '#ffe06b', '#6fdca0', '#7cc8ff'] : [c, light(c, 0.45), c, light(c, 0.45)];
      let blades = '';
      for (let i = 0; i < 4; i++) blades += `<g transform="rotate(${i * 90})">${P('M0 0 L0 -20 Q14 -16 14 -2Z', cols[i])}${P('M0 0 L14 -2 Q10 2 0 0Z', dark(cols[i], 0.15))}</g>`;
      return stick(12, -46, '#ffffff', 3) + `<g ${tx(0, -50)}><g>${blades}<animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite"/></g>${circ(0, 0, 3, '#ffd24a')}${shine(-1, -1, 1)}</g>` + grip(x);
    }
    case 'kite': case 'bkite': {
      const kx = 66;
      const ky = -160;
      const kite = kind === 'kite'
        ? P(`M${kx} ${ky - 28} L${kx + 20} ${ky} L${kx} ${ky + 30} L${kx - 20} ${ky}Z`, c) + P(`M${kx} ${ky - 28} L${kx + 20} ${ky} L${kx} ${ky}Z`, light(c, 0.35)) + P(`M${kx} ${ky} L${kx - 20} ${ky} L${kx} ${ky + 30}Z`, light(c, 0.35)) + stroke(`M${kx} ${ky - 28} L${kx} ${ky + 30} M${kx - 20} ${ky} L${kx + 20} ${ky}`, dark(c, 0.2), 1)
        : ell(kx - 15, ky - 8, 16, 12, c, `transform="rotate(-25 ${kx - 15} ${ky - 8})"`) + ell(kx + 15, ky - 8, 16, 12, c, `transform="rotate(25 ${kx + 15} ${ky - 8})"`) + ell(kx - 10, ky + 12, 10, 8, light(c, 0.35)) + ell(kx + 10, ky + 12, 10, 8, light(c, 0.35)) +
          circ(kx - 16, ky - 9, 5, '#fff', 'opacity="0.8"') + circ(kx + 16, ky - 9, 5, '#fff', 'opacity="0.8"') + ell(kx, ky + 2, 3, 15, '#4a3f5e') + stroke(`M${kx - 1} ${ky - 12} L${kx - 6} ${ky - 22} M${kx + 1} ${ky - 12} L${kx + 6} ${ky - 22}`, '#4a3f5e', 1.4);
      const tail = stroke(`M${kx} ${ky + 30} Q${kx - 10} ${ky + 44} ${kx + 2} ${ky + 56} Q${kx + 12} ${ky + 68} ${kx} ${ky + 80}`, '#d9d4e2', 1.2) +
        [[kx - 4, ky + 42], [kx + 6, ky + 60], [kx - 1, ky + 76]].map(([bx, by], i) => `<g ${tx(bx, by, 'scale(0.24)')}>${bowG(0, 0, 1, RAINBOW[(i * 2) % 6])}</g>`).join('');
      return sway(stroke(`M0 -4 Q${kx * 0.2} ${ky * 0.2} ${kx} ${kind === 'kite' ? ky : ky + 4}`, '#d9d4e2', 1.2) + tail + kite, 3, 3) + grip(x);
    }
    case 'snowball':
      return ball(2, -14, 13, '#ffffff') + circ(2, -14, 13, 'none', 'stroke="#dfe8f5" stroke-width="1"') + circ(-4, -16, 2, '#dfe8f5') + circ(7, -10, 2.6, '#dfe8f5') + twinkle(14, -28, 3.6, 0.2, '#bfe8ff') + grip(x, -2, 2);
    case 'pumpkin': {
      const s = stroke('M-16 6 Q-18 -10 0 -10 Q18 -10 16 6', '#4a3f5e', 2.4) + ell(-9, 22, 10, 14, '#ff8a3d') + ell(9, 22, 10, 14, '#ff8a3d') + ell(0, 22, 12, 15, '#ffab3d') + ell(0, 22, 18, 15, 'url(#g-face)', 'opacity="0.6"') +
        ell(0, 8, 13, 3, '#c86a1e') + P('M-9 18 L-5 14 L-3 19Z M9 18 L5 14 L3 19Z', '#7a3a10') + stroke('M-7 27 Q0 33 7 27', '#7a3a10', 2.2) + [-8, 6, 12].map((cx, i) => circ(cx, 6 - i, 3, RAINBOW[i * 2])).join('');
      return s + grip(x, 0, -6);
    }
    case 'gift':
      return `<g ${tx(4, -8)}>${rect(-16, -12, 32, 26, 3, c)}${rect(-16, -12, 32, 26, 3, 'url(#g-shadeX)')}${rect(-18, -16, 36, 8, 2.5, dark(c, 0.06))}${rect(-3, -16, 6, 30, 0, v.a ?? '#ffd24a')}${`<g ${tx(0, -18, 'scale(0.5)')}>${bowG(0, 0, 1, v.a ?? '#ffd24a')}</g>`}${motif('star', -9, 4, 4)}</g>` + grip(x, -10, 2);
    case 'racket':
      return stroke('M0 12 L0 -22', '#4a3f5e', 4.4) + stroke('M0 -22 L-6 -32 M0 -22 L6 -32', c, 3) + ell(0, -52, 17, 22, 'none', `stroke="${c}" stroke-width="4.4"`) +
        [-10, -5, 0, 5, 10].map((dx) => line(dx, -52 - Math.sqrt(Math.max(0, 1 - (dx / 16) ** 2)) * 20, dx, -52 + Math.sqrt(Math.max(0, 1 - (dx / 16) ** 2)) * 20, '#fff', 0.9, 0.8)).join('') +
        [-12, -6, 0, 6, 12].map((dy) => line(-Math.sqrt(Math.max(0, 1 - (dy / 21) ** 2)) * 15, -52 + dy, Math.sqrt(Math.max(0, 1 - (dy / 21) ** 2)) * 15, -52 + dy, '#fff', 0.9, 0.8)).join('') + ball(20, -14, 6, '#d9f25a') + grip(x);
    case 'yoyo':
      return `<g>${line(0, 0, 0, 38, '#d9d4e2', 1)}<g ${tx(0, 44)}>${circ(0, 0, 10, c)}${circ(0, 0, 10, 'url(#g-face)')}${circ(0, 0, 4, v.a ?? '#fff')}${P(starD(0, 0, 3), c)}</g><animateTransform attributeName="transform" type="translate" values="0 0;0 -26;0 0" dur="1.8s" repeatCount="indefinite"/></g>` + grip(x);
    default:
      return '';
  }
}

// ---------- gadgets & arts ----------
function gadget(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'phone';
  switch (kind) {
    case 'phone':
      return `<g transform="rotate(-8)">${rect(-11, -34, 22, 40, 5, c)}${rect(-8.5, -31, 17, 33, 3, '#2d2a3a')}${rect(-8.5, -31, 17, 33, 3, 'url(#g-glass)')}${P(heartD(0, -20, 9), v.a ?? '#ff7eb6')}${rect(-3, -33, 6, 1.4, 0.7, dark(c, 0.3))}${circ(-13, -30, 3.4, c)}${circ(-13, -30, 1.6, light(c, 0.4))}</g>` + grip(x, 0, 2);
    case 'camera':
      return rect(-17, -28, 34, 28, 6, c) + rect(-17, -28, 34, 28, 6, 'url(#g-shadeX)') + rect(-17, -6, 34, 6, 3, dark(c, 0.1)) + circ(0, -16, 9, '#4a4a5e') + circ(0, -16, 6.4, SILVER) + circ(0, -16, 4, '#2d2a3a') + shine(-1.4, -17.4, 1.4, 0.9) +
        rect(-14, -25, 6, 4, 1.2, '#fff8c8') + circ(12, -24, 2, '#ff4f6d') + rect(-10, -1, 20, 9, 1, '#ffffff', 'stroke="#efe6f2" stroke-width="0.8"') + grip(x, 12, 0);
    case 'palette': {
      const d = 'M-22 -6 Q-24 -30 0 -32 Q24 -32 24 -14 Q24 -4 14 -6 Q6 -8 6 0 Q6 8 -6 6 Q-20 4 -22 -6Z';
      return P(d, '#e8c08a') + P(d, 'url(#g-shadeX)') + ell(-6, -4, 4, 3, '#c79a66') + [[-14, -14, '#ff4f6d'], [-6, -24, '#ffd24a'], [6, -24, '#5fd3b5'], [16, -18, '#4f9dff'], [-14, -24, '#c99bff']].map(([px, py, pc]) => ell(+px, +py, 4.2, 3.4, `${pc}`) + shine(+px - 1.4, +py - 1, 1)).join('') +
        stroke('M10 4 L30 -34', '#c98a5a', 3) + P('M28 -32 L32 -40 L34 -34Z', c, `stroke="${c}" stroke-width="3" stroke-linejoin="round"`) + rect(26, -32, 5, 4, 1, SILVER, 'transform="rotate(28 28 -30)"') + grip(x, -4, -2);
    }
    case 'brush':
      return stroke('M0 14 L0 -34', '#c98a5a', 4) + rect(-3, -42, 6, 9, 1, SILVER) + P('M-3.4 -42 Q-4 -54 0 -60 Q4 -54 3.4 -42Z', c) + circ(8, -58, 2.4, c, 'opacity="0.7"') + circ(12, -50, 1.6, c, 'opacity="0.5"') + grip(x);
    case 'mirror':
      return stroke('M0 12 L0 -24', '#ffc94a', 4.4) + ell(0, -44, 15, 19, GOLD, edge('#d99a1e', 1.2)) + ell(0, -44, 11.5, 15.5, '#dff3ff') + ell(0, -44, 11.5, 15.5, 'url(#g-glass)') +
        stroke('M-6 -52 L-1 -57 M-6 -46 L2 -54', '#fff', 1.8, 'opacity="0.9"') + P(heartD(0, -66, 7), '#ff7eb6') + twinkle(14, -60, 3, 0.3) + grip(x);
    case 'fan': case 'lacefan': {
      let s = '';
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a0 = -160 + (i * 140) / n;
        const a1 = a0 + 140 / n;
        const p = (a: number, r: number) => `${f(Math.cos((a * Math.PI) / 180) * r)} ${f(-4 + Math.sin((a * Math.PI) / 180) * r)}`;
        s += P(`M${p(a0, 6)} L${p(a0, 34)} A34 34 0 0 1 ${p(a1, 34)} L${p(a1, 6)}Z`, i % 2 ? c : light(c, 0.25), `stroke="${dark(c, 0.12)}" stroke-width="0.6"`);
      }
      if (kind === 'lacefan') for (let i = 0; i <= 12; i++) {
        const a = ((-160 + i * (140 / 12)) * Math.PI) / 180;
        s += circ(Math.cos(a) * 34, -4 + Math.sin(a) * 34, 3, '#fff', 'stroke="#efe6f2" stroke-width="0.6"');
      }
      else s += flowerG(-10, -26, 5, '#fff', '#ffd36b') + flowerG(8, -28, 4, '#fff8c8', '#ff7eb6') + flowerG(-2, -18, 3, '#fff');
      return `<g transform="rotate(14)">${s}${circ(0, -4, 3, GOLD)}</g>` + stroke('M0 -2 L1 12', dark(c, 0.3), 2) + grip(x);
    }
    case 'magnifier':
      return stroke('M0 12 L0 -20', '#8a5a3c', 5) + circ(4, -38, 16, 'none', `stroke="${c}" stroke-width="5"`) + circ(4, -38, 13.5, '#dff3ff', 'opacity="0.6"') + circ(4, -38, 13.5, 'url(#g-glass)') +
        stroke('M-4 -46 Q0 -50 6 -50', '#fff', 2, 'opacity="0.9"') + motif('butterfly', 6, -36, 6) + grip(x);
    case 'diary':
      return `<g transform="rotate(-8)">${rect(-16, -30, 32, 40, 4, c)}${rect(-16, -30, 32, 40, 4, 'url(#g-shadeX)')}${rect(12, -28, 4, 36, 1, '#fff')}${P(heartD(-1, -20, 14), v.a ?? '#ff4f8b')}${sparkle(-9, -24, 3)}${rect(14, -14, 8, 7, 2, GOLD)}${circ(18, -10.5, 1.2, '#b07a1e')}</g>` + grip(x, -8, 2);
    default:
      return '';
  }
}


// ---------- sports ----------
function sport(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'soccer';
  switch (kind) {
    case 'soccer': {
      const cx = 6, cy = -14, r = 16;
      let s = circ(cx, cy, r, '#ffffff', 'stroke="#d9d4e2" stroke-width="1"');
      s += P(`M${cx} ${cy - 5} L${cx + 5} ${cy - 1.5} L${cx + 3} ${cy + 4.5} L${cx - 3} ${cy + 4.5} L${cx - 5} ${cy - 1.5}Z`, c);
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const px = cx + Math.cos(an) * 13, py = cy + Math.sin(an) * 13;
        s += line(cx + Math.cos(an) * 5.4, cy + Math.sin(an) * 5.4, px, py, '#9aa3b5', 1) + circ(px, py, 3.6, c);
      }
      return s + circ(cx, cy, r, 'url(#g-face)') + grip(x, 0, 2);
    }
    case 'basketball': {
      const cx = 6, cy = -14, r = 16;
      return circ(cx, cy, r, c) + stroke(`M${cx - r} ${cy} L${cx + r} ${cy} M${cx} ${cy - r} L${cx} ${cy + r} M${cx - 11} ${cy - 11} Q${cx - 4} ${cy} ${cx - 11} ${cy + 11} M${cx + 11} ${cy - 11} Q${cx + 4} ${cy} ${cx + 11} ${cy + 11}`, '#5a2e1a', 1.3) +
        circ(cx, cy, r, 'url(#g-face)') + grip(x, 0, 2);
    }
    case 'football':
      return `<g ${tx(6, -14, 'rotate(-35)')}>${ell(0, 0, 18, 11, c)}${ell(0, 0, 18, 11, 'url(#g-face)')}${stroke('M-15 -3 Q-17 0 -15 3 M15 -3 Q17 0 15 3', '#fff', 1.6)}${line(-6, 0, 6, 0, '#fff', 1.4)}${[-4, -1.3, 1.3, 4].map((dx) => line(dx, -2.2, dx, 2.2, '#fff', 1.2)).join('')}</g>` + grip(x, 0, 2);
    case 'bat':
      return `<g transform="rotate(16)">${P('M-2.4 12 L2.4 12 L5.6 -58 Q5.6 -66 0 -66 Q-5.6 -66 -5.6 -58Z', c)}${P('M-2.4 12 L2.4 12 L5.6 -58 Q5.6 -66 0 -66 Q-5.6 -66 -5.6 -58Z', 'url(#g-shadeX)')}${ell(0, 13, 4.4, 2.2, dark(c, 0.2))}${rect(-2.8, -4, 5.6, 14, 1, v.a ?? '#4a4a5e')}${stroke('M-2 -56 L-3 -20', '#fff', 1.2, 'opacity="0.5"')}</g>` + grip(x);
    case 'glove': {
      const d = 'M-16 6 Q-20 -10 -14 -20 Q-12 -26 -8 -22 L-7 -30 Q-4 -36 0 -31 L1 -33 Q5 -38 8 -31 L10 -27 Q15 -30 16 -22 Q18 -6 14 6 Q0 14 -16 6Z';
      return P(d, c) + P(d, 'url(#g-shadeX)') + stroke('M-8 -22 L-6 -6 M1 -31 L1 -8 M10 -27 L7 -6', dark(c, 0.25), 1.2) + stroke('M-18 -4 Q-24 -14 -14 -20', dark(c, 0.15), 3) + rect(-15, 2, 29, 6, 3, dark(c, 0.15)) +
        ball(4, -14, 7.4, '#ffffff') + stroke('M-1 -20 Q2 -14 -1 -8 M9 -20 Q6 -14 9 -8', '#e8384f', 1, 'stroke-dasharray="1.4 1"');
    }
    case 'skateboard': {
      const deck = `M8 -58 Q20 -58 20 -46 L20 14 Q20 26 8 26 Q-4 26 -4 14 L-4 -46 Q-4 -58 8 -58Z`;
      return circ(22, -40, 4, '#ffd24a') + circ(22, 8, 4, '#ffd24a') + rect(19, -43, 4, 6, 1, SILVER) + rect(19, 5, 4, 6, 1, SILVER) + cloth(deck, c, x.p) + P(deck, 'none', edge(dark(c, 0.25), 1)) +
        motif(v.a ?? 'bolt', 8, -18, 8) + grip(x, -2, 2);
    }
    case 'fishing': {
      const tipX = 44, tipY = -112;
      return stroke(`M0 12 L${tipX} ${tipY}`, '#4a4a5e', 2.6) + stroke(`M-2 18 L4 0`, c, 4.4) + circ(5, -4, 5, SILVER) + circ(5, -4, 2, '#4a4a5e') +
        sway(line(tipX, tipY, tipX + 6, -44, '#d9d4e2', 1) + `<g ${tx(tipX + 6, -40)}>${ell(0, 0, 9, 6, v.a ?? '#ffab5e')}${P('M7 0 L14 -5 L14 5Z', v.a ?? '#ffab5e')}${circ(-4, -1, 1.4, '#2d2a3a')}${stroke('M-1 -3 Q1 0 -1 3', '#fff', 1)}</g>`, 2.6, 3) + grip(x);
    }
    default:
      return '';
  }
}

// ---------- toys & gear ----------
function gear(x: WearCtx, v: V): string {
  const c = x.c;
  const kind = v.o ?? 'car';
  switch (kind) {
    case 'car': case 'race': {
      const race = kind === 'race';
      const body = race ? 'M-16 2 L-14 -6 L-4 -8 L2 -16 L12 -16 L18 -8 L26 -6 L26 2Z' : 'M-14 2 L-14 -8 L-8 -9 L-4 -19 L12 -19 L18 -9 L24 -8 L24 2Z';
      return `<g ${tx(8, -14)}>${cloth(body, c, x.p)}${P(race ? 'M3 -14 L11 -14 L15 -8 L0 -8Z' : 'M-2 -17 L5 -17 L5 -10 L-6 -10Z M7 -17 L11 -17 L15 -10 L7 -10Z', '#bfe8ff')}${race ? circ(-6, -3, 4, '#fff') + `<text x="-6" y="-1" font-family="Fredoka, sans-serif" font-weight="700" font-size="6" text-anchor="middle" fill="${c}">7</text>` : ''}` +
        `${circ(-7, 3, 5.4, '#2d2a3a')}${circ(17, 3, 5.4, '#2d2a3a')}${circ(-7, 3, 2.4, SILVER)}${circ(17, 3, 2.4, SILVER)}${rect(21, -6, 4, 3, 1, '#fff8c8')}</g>` + grip(x, 0, 2);
    }
    case 'robot':
      return `<g ${tx(16, -6)}>${line(0, -34, 0, -42, '#9aa3b5', 1.6)}${circ(0, -43, 2.6, v.a ?? '#ff4f6d')}${rect(-12, -34, 24, 18, 5, c)}${rect(-9, -31, 18, 11, 3, '#2d2a3a')}${circ(-4, -26, 2, '#7fe0ff')}${circ(4, -26, 2, '#7fe0ff')}${stroke('M-3 -23 Q0 -21 3 -23', '#7fe0ff', 1)}` +
        `${rect(-14, -14, 28, 22, 5, c)}${rect(-14, -14, 28, 22, 5, 'url(#g-shadeX)')}${circ(-5, -6, 2.4, '#ffd24a')}${circ(2, -6, 2.4, '#5fd3b5')}${rect(-6, 0, 12, 3, 1.5, dark(c, 0.2))}${rect(-11, 8, 8, 6, 2, dark(c, 0.15))}${rect(3, 8, 8, 6, 2, dark(c, 0.15))}</g>` + grip(x, 2, 0);
    case 'rocket':
      return `<g ${tx(4, -30)}>${P('M-12 18 L-18 26 L-8 24Z M12 18 L18 26 L8 24Z', v.a ?? '#ff4f6d')}${P('M-9 22 L-9 -6 Q-9 -24 0 -32 Q9 -24 9 -6 L9 22Z', c)}${P('M-9 22 L-9 -6 Q-9 -24 0 -32 Q9 -24 9 -6 L9 22Z', 'url(#g-shadeX)')}` +
        `${P('M-9 -6 Q-9 -24 0 -32 Q9 -24 9 -6Z', v.a ?? '#ff4f6d')}${circ(0, 2, 5, SILVER)}${circ(0, 2, 3.4, '#9fd6ff')}${shine(-1.2, 0.8, 1)}${P('M-6 22 L6 22 L0 34Z', '#ffd24a')}${P('M-3 22 L3 22 L0 29Z', '#fff8c8')}</g>` + grip(x, 0, 2);
    case 'controller': {
      const d = 'M-22 -10 Q-22 -18 -14 -18 L14 -18 Q22 -18 22 -10 L24 4 Q25 12 18 12 Q13 12 10 6 L-10 6 Q-13 12 -18 12 Q-25 12 -24 4Z';
      return `<g ${tx(4, -8)}>${P(d, c)}${P(d, 'url(#g-shadeX)')}${rect(-16, -11, 9, 3, 1, '#2d2a3a')}${rect(-13, -14, 3, 9, 1, '#2d2a3a')}${circ(12, -12, 2.4, '#ff4f6d')}${circ(17, -8, 2.4, '#ffd24a')}${circ(7, -8, 2.4, '#5fd3b5')}${circ(12, -4, 2.4, '#4f9dff')}${circ(-4, -2, 3, dark(c, 0.3))}${circ(4, -2, 3, dark(c, 0.3))}</g>` + grip(x, -14, 2);
    }
    case 'guitar':
      return stroke('M0 -30 L0 16', '#8a5a3c', 4) + rect(-3.4, -40, 6.8, 11, 2, '#6b4226') + [-37, -33].map((yy) => circ(-4.4, yy, 1.2, SILVER) + circ(4.4, yy, 1.2, SILVER)).join('') +
        circ(0, 24, 12, c) + circ(0, 40, 15, c) + circ(0, 32, 15, 'url(#g-face)', 'opacity="0.5"') + circ(0, 28, 5, '#4a2e22') + rect(-6, 40, 12, 3, 1, '#4a2e22') + [-1.5, 0, 1.5].map((dx) => line(dx, -30, dx, 41, '#fff', 0.4, 0.8)).join('') + grip(x);
    case 'flashlight':
      return `<g transform="rotate(30)">${P('M-5 -60 L5 -60 L40 -150 L-40 -150Z', '#fff6c8', 'opacity="0.35"')}<path d="M-5 -60 L5 -60 L24 -120 L-24 -120Z" fill="#fff6c8" opacity="0.4"><animate attributeName="opacity" values="0.4;0.25;0.4" dur="2.4s" repeatCount="indefinite"/></path>` +
        `${rect(-5, -30, 10, 42, 3, c)}${rect(-5, -30, 10, 42, 3, 'url(#g-shadeX)')}${P('M-5 -30 L-8 -48 L8 -48 L5 -30Z', dark(c, 0.15))}${ell(0, -49, 8, 2.6, '#fff8c8')}${rect(-2, -22, 4, 6, 1.5, v.a ?? '#ffd24a')}</g>` + grip(x);
    case 'walkie':
      return line(8, -34, 8, -54, '#4a4a5e', 3) + circ(8, -55, 2, '#4a4a5e') + rect(-10, -36, 22, 42, 5, c) + rect(-10, -36, 22, 42, 5, 'url(#g-shadeX)') + rect(-6, -32, 14, 10, 2, '#bfe8ff') +
        [-18, -14, -10].map((yy) => line(-5, yy, 7, yy, dark(c, 0.3), 1.6)).join('') + circ(-4, -2, 2.4, '#ff4f6d') + circ(5, -2, 2.4, '#ffd24a') + grip(x);
    default:
      return '';
  }
}

// ---------- the catalog ----------
const STYLES: Style[] = [
  {
    group: 'Purses', key: 'purse', draw: purse, vs: [
      { k: 'round', n: 'Round Purse', c: '#c99bff', o: 'round' },
      { k: 'heart', n: 'Heart Purse', c: '#ff4f8b', o: 'heart' },
      { k: 'clutch', n: 'Bow Clutch', c: '#ffb3c7', o: 'clutch', a: '#ff4f8b' },
      { k: 'star', n: 'Star Purse', c: '#ffd36b', o: 'star', a: '#ff7eb6' },
      { k: 'basket', n: 'Picnic Basket', c: '#ff7a6b', o: 'basket', t: ['spring', 'summer'] },
      { k: 'tote', n: 'Bunny Tote', c: '#a8e6cf', o: 'tote', a: 'bunny', p: 'none' },
      { k: 'bucket', n: 'Bucket Bag', c: '#7cc8ff', o: 'bucket', a: '#ffd24a' },
      { k: 'kitty', n: 'Kitty Purse', c: '#2d2a3a', o: 'kitty' },
      { k: 'strawberry', n: 'Strawberry Purse', c: '#ff4f6d', o: 'strawberry', t: ['summer'] },
      { k: 'shell', n: 'Seashell Purse', c: '#ffd6e3', o: 'shell', t: ['summer'] },
      { k: 'lunch', n: 'Lunch Box', c: '#5fd3b5', o: 'lunch', a: 'apple', t: ['fall'] },
      { k: 'sparkle', n: 'Sparkle Clutch', c: '#9b6bff', o: 'sparkle' },
    ],
  },
  {
    group: 'Plushies', key: 'plush', draw: plush, vs: [
      { k: 'bunny', n: 'Bunny Plush', c: '#ffffff', o: 'bunny' },
      { k: 'kitty', n: 'Kitty Plush', c: '#ffab5e', o: 'kitty' },
      { k: 'puppy', n: 'Puppy Plush', c: '#f4ead9', o: 'puppy' },
      { k: 'unicorn', n: 'Unicorn Plush', c: '#ffffff', o: 'unicorn' },
      { k: 'dino', n: 'Dino Plush', c: '#6fc47c', o: 'dino', a: '#ffab5e' },
      { k: 'panda', n: 'Panda Plush', c: '#ffffff', o: 'panda', fixed: true },
      { k: 'penguin', n: 'Penguin Plush', c: '#3f4f9a', o: 'penguin', t: ['winter'] },
      { k: 'frog', n: 'Froggy Plush', c: '#9ad66a', o: 'frog', t: ['spring'] },
      { k: 'octopus', n: 'Octopus Plush', c: '#c99bff', o: 'octopus', a: '#ff7eb6', t: ['summer'] },
      { k: 'elephant', n: 'Elephant Plush', c: '#b9c3e0', o: 'elephant' },
      { k: 'owl', n: 'Owl Plush', c: '#c9a27e', o: 'owl', t: ['fall'] },
      { k: 'lamb', n: 'Lamb Plush', c: '#fcd2bb', o: 'lamb', t: ['spring'] },
      { k: 'bear', n: 'Strawberry Bear', c: '#ffb3c7', o: 'bear', a: '#ff4f7b' },
    ],
  },
  {
    group: 'Balloons', key: 'balloon', draw: balloon, vs: [
      { k: 'round', n: 'Round Balloon', c: '#7cc8ff', o: 'round' },
      { k: 'polka', n: 'Polka Dot Balloon', c: '#ff7eb6', o: 'polka' },
      { k: 'star', n: 'Star Foil Balloon', c: '#ffd24a', o: 'star' },
      { k: 'moon', n: 'Moon Foil Balloon', c: '#c99bff', o: 'moon' },
      { k: 'bunch', n: 'Balloon Bunch', c: '#ff4f8b', o: 'bunch' },
      { k: 'rainbow', n: 'Rainbow Bunch', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'dog', n: 'Balloon Puppy', c: '#ff9ec7', o: 'dog' },
      { k: 'bunny', n: 'Bunny Balloon', c: '#ffffff', o: 'bunny', t: ['spring'] },
      { k: 'kitty', n: 'Kitty Balloon', c: '#ffab5e', o: 'kitty' },
      { k: 'cloud', n: 'Happy Cloud Balloon', c: '#e6f4ff', o: 'cloud' },
      { k: 'planet', n: 'Planet Balloon', c: '#9b6bff', o: 'planet' },
    ],
  },
  {
    group: 'Magic Wands', key: 'wand', premium: 10, draw: wand, vs: [
      { k: 'heart', n: 'Heart Wand', c: '#ff4f8b', o: 'heart' },
      { k: 'moon', n: 'Moon Wand', c: '#9b6bff', o: 'moon' },
      { k: 'crown', n: 'Royal Crown Wand', c: '#ff4f8b', o: 'crown' },
      { k: 'butterfly', n: 'Butterfly Wand', c: '#7cc8ff', o: 'butterfly', t: ['spring'] },
      { k: 'flower', n: 'Blossom Wand', c: '#ff9ec7', o: 'flower', t: ['spring'] },
      { k: 'snowflake', n: 'Snowflake Wand', c: '#9fd6ff', o: 'snowflake', t: ['winter'] },
      { k: 'rainbow', n: 'Shooting Star Wand', c: '#c99bff', o: 'rainbow' },
      { k: 'orb', n: 'Crystal Orb Wand', c: '#c99bff', o: 'orb' },
      { k: 'unicorn', n: 'Unicorn Horn Wand', c: '#ffb3c7', o: 'unicorn' },
    ],
  },
  {
    group: 'Umbrellas', key: 'umbrella', tags: ['spring'], draw: umbrella, vs: [
      { k: 'dots', n: 'Polka Umbrella', c: '#ff7eb6', p: 'dots' },
      { k: 'rainbow', n: 'Rainbow Umbrella', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'bubble', n: 'Bubble Umbrella', c: '#7cc8ff', o: 'bubble' },
      { k: 'frog', n: 'Froggy Umbrella', c: '#7ed36b', o: 'frog', a: '#ffd24a' },
      { k: 'parasol', n: 'Lace Parasol', c: '#ffd6e3', o: 'parasol', t: ['summer'] },
      { k: 'stars', n: 'Starry Umbrella', c: '#3f4f9a', o: 'stars' },
    ],
  },
  {
    group: 'Ice Cream & Pops', key: 'pop', tags: ['summer'], draw: pop, vs: [
      { k: 'softserve', n: 'Soft Serve Swirl', c: '#ffd6e3', o: 'softserve' },
      { k: 'strawberry', n: 'Strawberry Pop', c: '#ff7a8a', o: 'classic', a: 'strawberry' },
      { k: 'rocket', n: 'Rocket Pop', c: '#e8384f', o: 'rocket', fixed: true },
      { k: 'mintchip', n: 'Mint Chip Cone', c: '#a8e6cf', o: 'double', a: '#a86b4a' },
      { k: 'twin', n: 'Orange Twin Pop', c: '#ffab5e', o: 'twin' },
      { k: 'fudge', n: 'Fudge Bar', c: '#8a5a3c', o: 'fudge', fixed: true },
      { k: 'watermelon', n: 'Watermelon Pop', c: '#ff5c7a', o: 'watermelon', fixed: true },
      { k: 'sundae', n: 'Sundae Cup', c: '#ffb3c7', o: 'cup' },
      { k: 'bunny', n: 'Bunny Pop', c: '#e6d4ff', o: 'bunny' },
      { k: 'lemon', n: 'Lemon Pop', c: '#ffe680', o: 'classic', a: 'lemon' },
    ],
  },
  {
    group: 'Sweets', key: 'sweet', draw: sweet, vs: [
      { k: 'swirl', n: 'Rainbow Lollipop', c: '#ff6f91', o: 'swirl', fixed: true },
      { k: 'cotton', n: 'Cotton Candy', c: '#ffb3c7', o: 'cotton' },
      { k: 'cupcake', n: 'Cherry Cupcake', c: '#fff3f8', o: 'cupcake', a: '#ff7eb6' },
      { k: 'heart', n: 'Heart Lollipop', c: '#ff4f7b', o: 'heart' },
      { k: 'donut', n: 'Sprinkle Donut', c: '#ff7eb6', o: 'donut' },
      { k: 'unicorn-cotton', n: 'Unicorn Cotton Candy', c: '#ffb3c7', o: 'cotton', fixed: true },
      { k: 'star', n: 'Star Lollipop', c: '#ffd24a', o: 'star' },
      { k: 'choc-cupcake', n: 'Choco Cupcake', c: '#a86b4a', o: 'cupcake', a: '#ffb3c7' },
      { k: 'cane', n: 'Candy Cane', c: '#e8384f', o: 'cane', t: ['winter'] },
      { k: 'cookie', n: 'Star Cookie', c: '#ff7eb6', o: 'cookie', t: ['winter'] },
      { k: 'cakepop', n: 'Cake Pop', c: '#c99bff', o: 'cakepop' },
      { k: 'mint-donut', n: 'Minty Donut', c: '#a8e6cf', o: 'donut' },
    ],
  },
  {
    group: 'Drinks', key: 'drink', draw: drink, vs: [
      { k: 'boba-taro', n: 'Taro Boba Tea', c: '#c9a8e8', o: 'boba', a: '#9b6bff' },
      { k: 'juice', n: 'Apple Juice Box', c: '#7ed36b', o: 'juice', a: 'apple' },
      { k: 'boba-strawberry', n: 'Strawberry Boba', c: '#ffb3c7', o: 'boba', a: '#ff4f8b' },
      { k: 'shake', n: 'Berry Milkshake', c: '#ff9ec7', o: 'shake' },
      { k: 'cocoa', n: 'Hot Cocoa', c: '#ff7eb6', o: 'cocoa', t: ['winter'] },
      { k: 'lemonade', n: 'Pink Lemonade', c: '#ffb3c7', o: 'lemonade', t: ['summer'] },
      { k: 'boba-matcha', n: 'Matcha Boba', c: '#b6e36b', o: 'boba', a: '#3fbf8f' },
      { k: 'orange-juice', n: 'Orange Juice Box', c: '#ffab5e', o: 'juice', a: 'sun' },
    ],
  },
  {
    group: 'Flowers', key: 'flower', tags: ['spring'], draw: flowers, vs: [
      { k: 'rose', n: 'Red Rose', c: '#e8384f', o: 'rose' },
      { k: 'sunflower', n: 'Sunny Sunflower', c: '#ffd24a', o: 'sunflower', fixed: true, t: ['summer'] },
      { k: 'tulip', n: 'Pink Tulip', c: '#ff7eb6', o: 'tulip' },
      { k: 'daisy', n: 'Little Daisy', c: '#ffffff', o: 'daisy' },
      { k: 'roses', n: 'Rose Bouquet', c: '#ff4f7b', o: 'bouquet', a: '#fff3f8' },
      { k: 'tulips', n: 'Rainbow Tulips', c: '#ff6f91', o: 'rainbow', a: '#e6f4ff', fixed: true },
      { k: 'lavender', n: 'Lavender Bunch', c: '#9b6bff', o: 'lavender', a: '#ffffff' },
      { k: 'dandelion', n: 'Wishing Dandelion', c: '#ffffff', o: 'dandelion', fixed: true },
    ],
  },
  {
    group: 'Play Time', key: 'toy', draw: toy, vs: [
      { k: 'bubbles', n: 'Bubble Wand', c: '#c99bff', o: 'bubbles', t: ['summer'] },
      { k: 'pinwheel', n: 'Rainbow Pinwheel', c: '#ff6f91', o: 'pinwheel', fixed: true },
      { k: 'gift', n: 'Pink Gift Box', c: '#ff7eb6', o: 'gift', a: '#ffd24a' },
      { k: 'kite', n: 'Diamond Kite', c: '#ff4f6d', o: 'kite', t: ['spring'] },
      { k: 'sparkler', n: 'Sparkler', c: '#ffe06b', o: 'sparkler', fixed: true, t: ['summer'] },
      { k: 'pinwheel-pink', n: 'Pink Pinwheel', c: '#ff9ec7', o: 'pinwheel' },
      { k: 'snowball', n: 'Snowball', c: '#ffffff', o: 'snowball', fixed: true, t: ['winter'] },
      { k: 'pumpkin', n: 'Pumpkin Pail', c: '#ffab3d', o: 'pumpkin', fixed: true, t: ['fall'] },
      { k: 'butterfly-kite', n: 'Butterfly Kite', c: '#7cc8ff', o: 'bkite', t: ['spring'] },
      { k: 'gift-blue', n: 'Starry Gift Box', c: '#4f9dff', o: 'gift', a: '#ffffff', t: ['winter'] },
      { k: 'racket', n: 'Tennis Racket', c: '#ff7eb6', o: 'racket', t: ['summer'] },
      { k: 'yoyo', n: 'Yo-Yo', c: '#5fd3b5', o: 'yoyo', a: '#ffffff' },
    ],
  },
  {
    group: 'Gadgets & Arts', key: 'gadget', draw: gadget, vs: [
      { k: 'phone', n: 'Heart Phone', c: '#ffb3c7', o: 'phone', a: '#ff4f8b' },
      { k: 'palette', n: 'Paint Palette', c: '#ff4f6d', o: 'palette' },
      { k: 'mirror', n: 'Hand Mirror', c: '#ffd24a', o: 'mirror', fixed: true },
      { k: 'camera', n: 'Instant Camera', c: '#7cc8ff', o: 'camera' },
      { k: 'fan', n: 'Blossom Fan', c: '#ff9ec7', o: 'fan', t: ['summer'] },
      { k: 'brush', n: 'Paintbrush', c: '#9b6bff', o: 'brush' },
      { k: 'lacefan', n: 'Lace Fan', c: '#c99bff', o: 'lacefan' },
      { k: 'magnifier', n: 'Bug Explorer Lens', c: '#3fbf8f', o: 'magnifier' },
      { k: 'diary', n: 'Secret Diary', c: '#c99bff', o: 'diary', a: '#ff4f8b' },
    ],
  },
  {
    group: 'Sports', key: 'sport', draw: sport, vs: [
      { k: 'soccer', n: 'Soccer Ball', c: '#2d2a3a', o: 'soccer' },
      { k: 'basketball', n: 'Basketball', c: '#ff8a3d', o: 'basketball' },
      { k: 'skateboard', n: 'Skateboard', c: '#4f9dff', o: 'skateboard', a: 'bolt' },
      { k: 'bat', n: 'Baseball Bat', c: '#e0b07a', o: 'bat', t: ['spring', 'summer'] },
      { k: 'glove', n: 'Baseball Glove', c: '#b9744f', o: 'glove', t: ['spring', 'summer'] },
      { k: 'football', n: 'Football', c: '#9a5a34', o: 'football', t: ['fall'] },
      { k: 'fishing', n: 'Fishing Rod', c: '#3fbf8f', o: 'fishing', a: '#ffab5e', t: ['summer'] },
      { k: 'skateboard-flame', n: 'Star Skateboard', c: '#e8384f', o: 'skateboard', a: 'star' },
    ],
  },
  {
    group: 'Toys & Gear', key: 'gear', draw: gear, vs: [
      { k: 'car', n: 'Toy Car', c: '#e8384f', o: 'car' },
      { k: 'robot', n: 'Robot Buddy', c: '#9aa3b5', o: 'robot' },
      { k: 'rocket', n: 'Toy Rocket', c: '#ffffff', o: 'rocket', a: '#ff4f6d' },
      { k: 'controller', n: 'Game Controller', c: '#4a4a5e', o: 'controller' },
      { k: 'race', n: 'Race Car', c: '#4f9dff', o: 'race' },
      { k: 'guitar', n: 'Little Guitar', c: '#e8384f', o: 'guitar' },
      { k: 'flashlight', n: 'Flashlight', c: '#3fbf8f', o: 'flashlight', t: ['fall'] },
      { k: 'walkie', n: 'Walkie-Talkie', c: '#ffab5e', o: 'walkie' },
    ],
  },
];

function build(styles: Style[]): WearDef[] {
  const count = new Map<string, number>();
  const out: WearDef[] = [];
  for (const st of styles) for (const v of st.vs) {
    const i = count.get(st.group) ?? 0;
    count.set(st.group, i + 1);
    const tags = [...new Set([...(st.tags ?? []), ...(v.t ?? [])])] as Season[];
    out.push({
      id: `hand-${st.key}-${v.k}`,
      name: v.n,
      slot: 'hand',
      group: st.group,
      price: i < 3 ? 0 : Math.min(120, 15 + (i - 3) * 6 + (st.premium ?? 0)),
      color: v.c,
      pattern: v.p,
      fixed: v.fixed,
      tags: tags.length ? tags : undefined,
      hand: (x) => st.draw(x, v),
    });
  }
  return out;
}

export const HAND_MORE: WearDef[] = build(STYLES);
