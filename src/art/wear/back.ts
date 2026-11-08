// Back accessories: fairy, butterfly, feather, critter and magic wings, backpacks, capes, tails,
// big back bows and cool gear. Everything here is drawn first, behind the body and hair, so it is
// shaped to peek out where it can be seen: wings spread wider than the big head, packs and capes
// bulge past the arms, tails swing out to the left (the right hand holds things). Straps, clasps
// and ties are drawn in front with `over`.
import type { Body } from '../body';
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { motif } from '../motifs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, bowG, circ, f, heartD, line, sparkleD, starD } from './base';

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
  over?: (x: WearCtx, v: V) => string;
  tags?: Season[];
  premium?: number;
  /** Price step between versions (wings cost more). */
  step?: number;
  max?: number;
}

// ---------- helpers ----------
const stroke = (d: string, c: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shine = (x: number, y: number, r: number, op = 0.75) => circ(x, y, r, '#fff', `opacity="${op}"`);
const ell = (x: number, y: number, rx: number, ry: number, c: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, rx: number, c: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${c}" ${extra}/>`;
const ball = (x: number, y: number, r: number, c: string) => circ(x, y, r, c) + circ(x, y, r, 'url(#g-face)') + shine(x - r * 0.35, y - r * 0.38, r * 0.28, 0.8);
const sparkle = (x: number, y: number, r: number, c = '#fff') => P(sparkleD(x, y, r), c);
const twinkle = (x: number, y: number, r: number, delay = 0, c = '#fff') =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.2;1" dur="1.8s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></path>`;
const tx = (x: number, y: number, s = '') => `transform="translate(${f(x)} ${f(y)}) ${s}"`;
const edge = (c: string, w = 1) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
/** Scales a drawing about a point, for nested wing bands. */
const about = (px: number, py: number, k: number, inner: string) => `<g transform="translate(${f(px)} ${f(py)}) scale(${k.toFixed(3)}) translate(${f(-px)} ${f(-py)})">${inner}</g>`;
const RAINBOW = ['#ff6f91', '#ffab5e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
const GOLD = 'url(#g-gold)';
const SILVER = 'url(#g-silver)';
const pair = (fn: (s: 1 | -1) => string, cls = 'flutter') => `<g class="${cls}">${fn(-1)}${fn(1)}</g>`;
/** Two straps over the shoulders, like a backpack's. */
const straps = (b: Body, c: string, w = 6) =>
  [-1, 1].map((s) => stroke(`M${s * 20} ${f(b.shY - 1)} Q${s * 24} ${f(b.shY + 20)} ${s * 25} ${f(b.waistY + 4)}`, dark(c, 0.3), w + 1.4) +
    stroke(`M${s * 20} ${f(b.shY - 1)} Q${s * 24} ${f(b.shY + 20)} ${s * 25} ${f(b.waistY + 4)}`, c, w) +
    stroke(`M${s * 20} ${f(b.shY + 2)} Q${s * 24} ${f(b.shY + 20)} ${s * 25} ${f(b.waistY + 2)}`, light(c, 0.4), 1, 'stroke-dasharray="2 2" opacity="0.8"')).join('');
/** One strap across the chest from the right shoulder to the left hip. */
const sash = (b: Body, c: string, w = 6) => {
  const d = `M24 ${f(b.shY)} Q4 ${f(b.waistY - 10)} -30 ${f(b.waistY + 22)}`;
  return stroke(d, dark(c, 0.3), w + 1.4) + stroke(d, c, w) + stroke(d, light(c, 0.4), 1, 'stroke-dasharray="2 2" opacity="0.8"');
};

// ---------- wings ----------
function fairyWing(b: Body, s: number, c: string, kind: string): string {
  const y = b.shY + 10;
  const X = (n: number) => f(s * n);
  const st = 'stroke="#fff" stroke-width="3" stroke-linejoin="round"';
  let up: string;
  let lo: string;
  if (kind === 'pointed') {
    up = `M${X(8)} ${y} C${X(40)} ${y - 40} ${X(96)} ${y - 92} ${X(132)} ${y - 108} C${X(122)} ${y - 52} ${X(100)} ${y - 4} ${X(8)} ${y + 6}Z`;
    lo = `M${X(8)} ${y + 12} C${X(52)} ${y + 18} ${X(84)} ${y + 58} ${X(98)} ${y + 98} C${X(58)} ${y + 82} ${X(24)} ${y + 46} ${X(8)} ${y + 18}Z`;
  } else if (kind === 'crystal') {
    up = `M${X(8)} ${y} L${X(64)} ${y - 98} L${X(128)} ${y - 76} L${X(116)} ${y - 12} L${X(8)} ${y + 6}Z`;
    lo = `M${X(8)} ${y + 12} L${X(94)} ${y + 28} L${X(80)} ${y + 88} L${X(8)} ${y + 20}Z`;
  } else {
    up = `M${X(8)} ${y} C${X(28)} ${y - 104} ${X(136)} ${y - 108} ${X(122)} ${y - 22} C${X(116)} ${y + 4} ${X(52)} ${y + 12} ${X(8)} ${y + 6}Z`;
    lo = `M${X(8)} ${y + 10} C${X(62)} ${y + 12} ${X(100)} ${y + 46} ${X(80)} ${y + 80} C${X(62)} ${y + 102} ${X(22)} ${y + 58} ${X(8)} ${y + 18}Z`;
  }
  const rim = `fill="none" stroke="${dark(c, 0.18)}" stroke-width="5" stroke-linejoin="round" opacity="0.5"`;
  let g = P(up, '', rim) + P(lo, '', rim) + P(up, c, `opacity="0.78" ${st}`) + P(lo, light(c, 0.25), `opacity="0.78" ${st}`) + P(up, 'url(#g-glass)') + P(lo, 'url(#g-glass)');
  if (kind === 'crystal') {
    g += stroke(`M${X(8)} ${y} L${X(64)} ${y - 98} M${X(8)} ${y} L${X(128)} ${y - 76} M${X(8)} ${y} L${X(116)} ${y - 12} M${X(64)} ${y - 98} L${X(116)} ${y - 12} M${X(8)} ${y + 14} L${X(80)} ${y + 88} M${X(94)} ${y + 28} L${X(40)} ${y + 40}`, '#fff', 1.2, 'opacity="0.8"');
    g += P(`M${X(30)} ${y - 30} L${X(64)} ${y - 98} L${X(70)} ${y - 50}Z`, '#fff', 'opacity="0.35"');
  } else {
    g += stroke(`M${X(12)} ${y + 2} Q${X(60)} ${y - 40} ${X(112)} ${y - 70} M${X(12)} ${y + 3} Q${X(70)} ${y - 14} ${X(114)} ${y - 26} M${X(12)} ${y + 15} Q${X(46)} ${y + 34} ${X(70)} ${y + 70}`, '#fff', 1.2, 'opacity="0.7"');
  }
  if (kind === 'glitter') {
    for (let i = 0; i < 16; i++) {
      const px = 24 + ((i * 0.618) % 1) * 92;
      const py = y - 80 + ((i * 0.7548) % 1) * 150;
      const inUp = py < y && px < 120 - (y - py) * 0.1;
      const inLo = py >= y + 14 && px < 86 - (py - y) * 0.3;
      if (inUp || inLo) g += circ(s * px, py, i % 3 ? 1.6 : 2.2, i % 2 ? '#fff' : '#fff3b0', 'opacity="0.9"');
    }
    g += twinkle(s * 96, y - 64, 6, s > 0 ? 0 : 0.9) + twinkle(s * 58, y + 46, 4.5, s > 0 ? 0.6 : 1.4);
  } else g += sparkle(s * 84, y - 52, 6) + sparkle(s * 52, y + 44, 4);
  return g;
}

const BFLY_UP = (y: number, X: (n: number) => string) => `M${X(8)} ${y - 4} C${X(28)} ${y - 100} ${X(140)} ${y - 108} ${X(122)} ${y - 24} C${X(116)} ${y + 2} ${X(50)} ${y + 10} ${X(8)} ${y + 4}Z`;
const BFLY_LO = (y: number, X: (n: number) => string, tail: boolean) => tail
  ? `M${X(8)} ${y + 8} C${X(58)} ${y + 10} ${X(100)} ${y + 36} ${X(86)} ${y + 70} L${X(96)} ${y + 106} Q${X(86)} ${y + 112} ${X(76)} ${y + 88} C${X(56)} ${y + 98} ${X(20)} ${y + 58} ${X(8)} ${y + 16}Z`
  : `M${X(8)} ${y + 8} C${X(58)} ${y + 10} ${X(104)} ${y + 40} ${X(84)} ${y + 82} C${X(62)} ${y + 108} ${X(20)} ${y + 60} ${X(8)} ${y + 16}Z`;
function butterflyWing(b: Body, s: number, c: string, a: string, kind: string): string {
  const y = b.shY + 8;
  const X = (n: number) => f(s * n);
  const up = BFLY_UP(y, X);
  const lo = BFLY_LO(y, X, kind === 'swallowtail');
  const rx = s * 8;
  const ry = y + 4;
  let g = '';
  const edgeC = kind === 'monarch' || kind === 'morpho' || kind === 'swallowtail' ? '#2d2a3a' : dark(c, 0.25);
  const base = (fill: string) => P(up, fill) + P(lo, fill === c ? dark(c, 0.06) : fill);
  switch (kind) {
    case 'monarch':
      g = base('#2d2a3a') + about(rx, ry, 0.86, base(c)) + stroke(`M${X(10)} ${y} L${X(96)} ${y - 66} M${X(10)} ${y} L${X(112)} ${y - 32} M${X(10)} ${y + 12} L${X(70)} ${y + 72} M${X(10)} ${y + 12} L${X(84)} ${y + 48}`, '#2d2a3a', 2.4);
      for (let i = 0; i < 7; i++) g += circ(s * (40 + i * 14), y - 92 + Math.abs(i - 3) * 6 + i * 6, 2.2, '#fff');
      for (let i = 0; i < 5; i++) g += circ(s * (30 + i * 12), y + 74 + i * 2 - i * i * 1.6, 2, '#fff');
      break;
    case 'morpho':
      g = base('#2d2a3a') + about(rx, ry, 0.88, base(c)) + about(rx, ry, 0.6, base(light(c, 0.35))) + about(rx, ry, 0.35, base(light(c, 0.6)));
      for (let i = 0; i < 6; i++) g += circ(s * (52 + i * 13), y - 94 + i * 12, 1.8, '#fff');
      break;
    case 'rainbow': case 'sunset': {
      const cols = kind === 'rainbow' ? RAINBOW : ['#ff7a6b', '#ffab5e', '#ffd36b', '#fff3b0'];
      g = cols.map((col, i) => about(rx, ry, 1 - i * (kind === 'rainbow' ? 0.14 : 0.2), base(col))).join('');
      break;
    }
    case 'stripes':
      g = [0, 1, 2, 3, 4].map((i) => about(rx, ry, 1 - i * 0.18, base(i % 2 ? light(c, 0.45) : c))).join('');
      break;
    case 'swallowtail':
      g = base('#2d2a3a') + about(rx, ry, 0.88, base(c)) + stroke(`M${X(30)} ${y - 60} L${X(50)} ${y + 4} M${X(60)} ${y - 86} L${X(80)} ${y - 4} M${X(94)} ${y - 88} L${X(104)} ${y - 18}`, '#2d2a3a', 5) +
        circ(s * 70, y + 70, 5, '#7cc8ff') + circ(s * 70, y + 70, 2.4, '#ff7a6b');
      break;
    default:
      g = base(c) + P(up, 'url(#g-shadeY)');
      if (kind === 'polka') g += [[44, -62, 10], [84, -76, 8], [96, -40, 7], [60, -24, 6], [40, 40, 8], [64, 64, 6]].map(([px, py, r]) => circ(s * px, y + py, r, a, 'opacity="0.95"')).join('');
      if (kind === 'hearts') g += [[54, -60, 13], [94, -50, 9], [46, 34, 10], [72, 66, 6]].map(([px, py, r]) => P(heartD(s * px, y + py - r * 0.5, r), a)).join('');
      if (kind === 'spots') g += [[50, -60, 12, a], [92, -62, 8, '#2d2a3a'], [100, -30, 6, a], [48, 42, 9, '#2d2a3a'], [70, 64, 6, a]].map(([px, py, r, col]) => circ(s * +px, y + +py, +r, `${col}`, 'opacity="0.85"') + circ(s * +px, y + +py, +r * 0.45, '#fff', 'opacity="0.8"')).join('');
      if (kind === 'lace') {
        for (let i = 0; i < 9; i++) g += circ(s * (30 + i * 11), y - 96 + Math.pow(i - 4, 2) * 1.6 + i * 3, 3.6, '#fff', 'opacity="0.9"');
        g += about(rx, ry, 0.55, P(up, light(c, 0.45)) + P(lo, light(c, 0.45)));
      }
  }
  g += P(up, 'none', `stroke="${edgeC}" stroke-width="2"`) + P(lo, 'none', `stroke="${edgeC}" stroke-width="2"`);
  return g + ell(s * 40, y - 50, 14, 8, '#fff', `opacity="0.25" transform="rotate(${s * -30} ${f(s * 40)} ${f(y - 50)})"`);
}

/** Feathered wing: rows of soft feathers hanging from the wing's top edge. */
function featherWing(b: Body, s: number, rows: string[], k = 1, spots?: string): string {
  const y = b.shY + 4;
  let g = '';
  const lens = [52, 36, 22];
  for (let r = 0; r < rows.length; r++) {
    const n = 12 - r * 2;
    for (let i = n - 1; i >= 0; i--) {
      const t = i / (n - 1);
      const bx = s * (12 + t * 108 * k) * 1;
      const by = y - t * 80 * k + r * 7 * k;
      const th = ((12 + t * 52) * Math.PI) / 180;
      const len = (lens[r] + t * 22 * (r === 0 ? 1 : 0.4)) * k;
      const cx = bx + s * Math.sin(th) * len * 0.5;
      const cy = by + Math.cos(th) * len * 0.5;
      const col = rows[r] === 'rainbow' ? RAINBOW[i % 6] : rows[r];
      const rot = (-s * th * 180) / Math.PI;
      g += ell(cx, cy, 10 * k, len * 0.5, col, `transform="rotate(${rot.toFixed(1)} ${f(cx)} ${f(cy)})" stroke="${dark(col === '#ffffff' ? '#e8e2f2' : col, 0.1)}" stroke-width="1"`);
      g += line(bx, by, cx + s * Math.sin(th) * len * 0.3, cy + Math.cos(th) * len * 0.3, light(col, 0.4), 0.9, 0.7);
      if (spots && r === 0 && i % 2) g += circ(cx, cy + len * 0.2, 2.2 * k, spots, 'opacity="0.8"');
    }
  }
  const top = rows[rows.length - 1] === 'rainbow' ? '#fff' : rows[rows.length - 1];
  g += P(`M${f(s * 8)} ${f(y + 12)} Q${f(s * 50 * k)} ${f(y - 84 * k)} ${f(s * 126 * k)} ${f(y - 84 * k)} Q${f(s * 70 * k)} ${f(y - 50 * k)} ${f(s * 10)} ${f(y + 22)}Z`, top, `stroke="${dark(top === '#ffffff' ? '#e8e2f2' : top, 0.1)}" stroke-width="1"`);
  return g;
}

/** Bat and dragon wings with rounded scallops (no sharp points). */
function leatherWing(b: Body, s: number, c: string, kind: string, a: string): string {
  const y = b.shY + 6;
  const X = (n: number) => f(s * n);
  const dragon = kind === 'dragon';
  const tipY = dragon ? y - 92 : y - 60;
  const d = dragon
    ? `M${X(10)} ${y - 4} Q${X(40)} ${y - 70} ${X(118)} ${tipY} Q${X(126)} ${y - 60} ${X(124)} ${y - 30} Q${X(108)} ${y - 26} ${X(102)} ${y - 4} Q${X(86)} ${y - 8} ${X(80)} ${y + 18} Q${X(62)} ${y + 12} ${X(56)} ${y + 34} Q${X(30)} ${y + 22} ${X(10)} ${y + 24}Z`
    : `M${X(10)} ${y - 6} Q${X(50)} ${y - 62} ${X(112)} ${tipY} Q${X(122)} ${y - 40} ${X(114)} ${y - 18} Q${X(100)} ${y - 24} ${X(92)} ${y - 6} Q${X(80)} ${y - 14} ${X(70)} ${y + 6} Q${X(58)} ${y - 2} ${X(50)} ${y + 18} Q${X(30)} ${y + 8} ${X(10)} ${y + 20}Z`;
  let g = P(d, c) + P(d, 'url(#g-shadeY)');
  if (dragon) g += P(`M${X(14)} ${y} Q${X(50)} ${y - 40} ${X(102)} ${y - 4} Q${X(80)} ${y + 6} ${X(56)} ${y + 30} Q${X(30)} ${y + 18} ${X(14)} ${y + 18}Z`, light(c, 0.3), 'opacity="0.8"');
  const tips = dragon ? [[124, y - 30], [102, y - 4], [80, y + 18], [56, y + 34]] : [[114, y - 18], [92, y - 6], [70, y + 6], [50, y + 18]];
  for (const [px, py] of tips) g += stroke(`M${X(16)} ${y + 2} Q${f(s * (px * 0.6))} ${f(y - (dragon ? 40 : 30) + (py - y) * 0.4)} ${f(s * px)} ${f(py)}`, dark(c, 0.22), dragon ? 3 : 2);
  g += stroke(`M${X(10)} ${y - 4} Q${X(dragon ? 40 : 50)} ${y - (dragon ? 70 : 62)} ${X(dragon ? 118 : 112)} ${tipY}`, dark(c, 0.25), dragon ? 4.4 : 3);
  g += circ(s * (dragon ? 118 : 112), tipY, dragon ? 4 : 3, a);
  if (kind === 'heart') g += P(heartD(s * 66, y - 30, 14), a) + shine(s * 62, y - 24, 1.6);
  if (dragon) g += [[60, -30], [84, -48], [40, -10]].map(([px, py]) => circ(s * px, y + py, 3, light(c, 0.45), 'opacity="0.7"')).join('');
  return g;
}

function critterWing(b: Body, s: number, c: string, a: string, kind: string): string {
  const y = b.shY + 8;
  const X = (n: number) => f(s * n);
  switch (kind) {
    case 'bee': {
      const w = (cx: number, cy: number, rx: number, ry: number, r: number) => ell(s * cx, cy, rx, ry, '#ffffff', `opacity="0.7" stroke="${c}" stroke-width="2.4" transform="rotate(${s * r} ${f(s * cx)} ${f(cy)})"`) +
        ell(s * cx, cy, rx, ry, 'url(#g-glass)', `transform="rotate(${s * r} ${f(s * cx)} ${f(cy)})"`) + line(s * (cx - rx * 0.6), cy + ry * 0.2, s * (cx + rx * 0.5), cy - ry * 0.3, c, 1, 0.6);
      return w(62, y - 46, 52, 30, -32) + w(56, y + 14, 34, 20, 18) + sparkle(s * 84, y - 66, 5);
    }
    case 'ladybug': {
      const shell = `M${X(10)} ${y - 26} Q${X(70)} ${y - 60} ${X(100)} ${y - 6} Q${X(96)} ${y + 40} ${X(40)} ${y + 50} Q${X(14)} ${y + 20} ${X(10)} ${y - 26}Z`;
      let g = ell(s * 70, y + 40, 34, 18, '#ffffff', `opacity="0.55" stroke="#d9e4f2" stroke-width="2" transform="rotate(${s * 30} ${f(s * 70)} ${f(y + 40)})"`);
      g += P(shell, c) + P(shell, 'url(#g-shadeY)') + stroke(shell, dark(c, 0.3), 2);
      g += [[50, -24, 9], [80, -4, 7], [44, 14, 8], [66, 30, 6], [28, -4, 5]].map(([px, py, r]) => circ(s * px, y + py, r, a)).join('');
      return g + ell(s * 54, y - 30, 16, 7, '#fff', `opacity="0.35" transform="rotate(${s * -25} ${f(s * 54)} ${f(y - 30)})"`);
    }
    case 'dragonfly': {
      const w = (cy: number, len: number, r: number) => ell(s * (10 + len / 2), cy, len / 2, 10, c, `opacity="0.55" stroke="#fff" stroke-width="2" transform="rotate(${s * r} ${f(s * 10)} ${f(cy)})"`) +
        ell(s * (10 + len / 2), cy, len / 2, 10, 'url(#g-glass)', `transform="rotate(${s * r} ${f(s * 10)} ${f(cy)})"`) + line(s * 14, cy, s * (8 + len), cy, '#fff', 1, 0.7).replace('/>', ` transform="rotate(${s * r} ${f(s * 10)} ${f(cy)})"/>`);
      return w(y - 20, 120, -14) + w(y + 4, 104, 10) + sparkle(s * 110, y - 54, 4);
    }
    default:
      return leatherWing(b, s, c, kind, a);
  }
}

function magicWing(b: Body, s: number, c: string, a: string, kind: string): string {
  const y = b.shY + 8;
  const X = (n: number) => f(s * n);
  switch (kind) {
    case 'unicorn': {
      const up = BFLY_UP(y, X);
      const lo = BFLY_LO(y, X, false);
      const base = (col: string) => P(up, col) + P(lo, col);
      return ['#ffb3c7', '#ffd0a0', '#fff0a0', '#b8f0d0', '#b8dcff', '#d8c0ff'].map((col, i) => about(s * 8, y + 4, 1 - i * 0.14, base(col))).join('') +
        P(up, 'none', 'stroke="#fff" stroke-width="3"') + P(lo, 'none', 'stroke="#fff" stroke-width="3"') + P(starD(s * 88, y - 58, 8), '#ffd24a') + twinkle(s * 60, y - 80, 5, 0.3) + twinkle(s * 50, y + 50, 4, 1);
    }
    case 'star':
      return P(starD(s * 74, y - 44, 52, 0.56, 5, -Math.PI / 2 + s * 0.3), c, `stroke="${light(c, 0.5)}" stroke-width="4" stroke-linejoin="round"`) + P(starD(s * 74, y - 44, 52, 0.56, 5, -Math.PI / 2 + s * 0.3), 'url(#g-shine)') +
        P(starD(s * 60, y + 30, 26, 0.56, 5, -Math.PI / 2 - s * 0.2), light(c, 0.3), `stroke="${light(c, 0.5)}" stroke-width="3" stroke-linejoin="round"`) + twinkle(s * 74, y - 44, 9, s > 0 ? 0 : 0.8, '#fff');
    case 'heart':
      return `<g transform="translate(${X(96)} ${y - 40}) rotate(${s * 32})">${P(heartD(0, -44, 80), c, `stroke="${light(c, 0.5)}" stroke-width="4"`)}${P(heartD(0, -44, 80), 'url(#g-shine)')}${P(heartD(-18, -30, 18), '#fff', 'opacity="0.4"')}</g>` +
        `<g transform="translate(${X(70)} ${y + 34}) rotate(${s * 150})">${P(heartD(0, -20, 40), light(c, 0.3), `stroke="${light(c, 0.5)}" stroke-width="3"`)}</g>`;
    case 'cloud': {
      let g = '';
      const puffs: [number, number, number][] = [[30, -30, 24], [60, -56, 28], [96, -62, 24], [114, -36, 20], [90, -20, 22], [56, -10, 22], [34, 22, 18], [58, 40, 16], [76, 18, 16]];
      for (const [px, py, r] of puffs) g += circ(s * px, y + py, r + 2.4, dark(c, 0.14));
      for (const [px, py, r] of puffs) g += circ(s * px, y + py, r, c);
      g += puffs.map(([px, py, r]) => circ(s * px, y + py, r, 'url(#g-face)', 'opacity="0.6"')).join('');
      return g + `<g ${tx(s * 76, y - 36)}>${circ(-5, 0, 2, '#2d2a3a')}${circ(5, 0, 2, '#2d2a3a')}${stroke('M-3 4 Q0 6.6 3 4', '#2d2a3a', 1.3)}${ell(-9, 4, 3, 1.8, '#ff8fb0', 'opacity="0.8"')}${ell(9, 4, 3, 1.8, '#ff8fb0', 'opacity="0.8"')}</g>`;
    }
    case 'snow': {
      let g = fairyWing(b, s, c, 'crystal');
      g += motif('snowflake', s * 80, y - 54, 12) + motif('snowflake', s * 48, y + 42, 9) + motif('snowflake', s * 104, y - 22, 7);
      return g;
    }
    case 'moon': {
      const R = 48;
      const cx = s * 84;
      const cy = y - 34;
      const rr = R * 1.336;
      const d = `M${f(cx)} ${f(cy - R)} A${R} ${R} 0 0 ${s > 0 ? 1 : 0} ${f(cx)} ${f(cy + R)} A${f(rr)} ${f(rr)} 0 0 ${s > 0 ? 0 : 1} ${f(cx)} ${f(cy - R)}Z`;
      return P(d, c, `stroke="${light(c, 0.5)}" stroke-width="4" stroke-linejoin="round"`) + P(d, 'url(#g-shine)') + P(starD(s * 62, y + 36, 13), '#ffe06b', `stroke="${a}" stroke-width="2" stroke-linejoin="round"`) + P(starD(s * 116, y + 10, 8), '#ffe06b') + twinkle(s * 112, y - 70, 5, 0.5);
    }
    default: {
      // candy wings: lollipop swirls
      const cx = s * 72;
      const cy = y - 34;
      let g = circ(cx, cy, 46, c) + circ(cx, cy, 46, 'none', 'stroke="#fff" stroke-width="3"');
      for (let i = 0; i < 6; i++) g += `<path d="M${f(cx)} ${f(cy)} m0 -44 a44 44 0 0 1 0 ${88 - i * 14}" fill="none" stroke="${i % 2 ? '#fff' : a}" stroke-width="7" opacity="0.85" transform="rotate(${i * 60 * s} ${f(cx)} ${f(cy)})"/>`;
      g += circ(cx, cy, 46, 'url(#g-face)') + circ(s * 44, y + 38, 20, a) + circ(s * 44, y + 38, 20, 'none', 'stroke="#fff" stroke-width="3"') + circ(s * 44, y + 38, 9, '#fff', 'opacity="0.8"');
      return g;
    }
  }
}

// ---------- backpacks ----------
function backpack(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const mini = v.o === 'mini';
  const W = b.shW + (mini ? 6 : 14);
  const top = b.shY - (mini ? 4 : 14);
  const bot = mini ? b.waistY + 4 : b.waistY + 24;
  const d = `M${f(-W)} ${f(top + 18)} Q${f(-W)} ${f(top)} ${f(-W + 18)} ${f(top)} L${f(W - 18)} ${f(top)} Q${f(W)} ${f(top)} ${f(W)} ${f(top + 18)} L${f(W - 2)} ${f(bot - 10)} Q${f(W - 2)} ${f(bot)} ${f(W - 12)} ${f(bot)} L${f(-W + 12)} ${f(bot)} Q${f(-W + 2)} ${f(bot)} ${f(-W + 2)} ${f(bot - 10)}Z`;
  let s = '';
  // character ears or spikes peeking past the shoulders
  if (v.o === 'bunny') s += ell(-W + 2, top - 6, 7, 18, c, `transform="rotate(-38 ${f(-W + 2)} ${f(top - 6)})"`) + ell(W - 2, top - 6, 7, 18, c, `transform="rotate(38 ${f(W - 2)} ${f(top - 6)})"`) + ell(-W + 2, top - 6, 3.4, 12, '#ffd6e3', `transform="rotate(-38 ${f(-W + 2)} ${f(top - 6)})"`) + ell(W - 2, top - 6, 3.4, 12, '#ffd6e3', `transform="rotate(38 ${f(W - 2)} ${f(top - 6)})"`);
  if (v.o === 'kitty') s += P(`M${f(-W - 4)} ${f(top + 16)} L${f(-W - 6)} ${f(top - 16)} L${f(-W + 18)} ${f(top + 2)}Z M${f(W + 4)} ${f(top + 16)} L${f(W + 6)} ${f(top - 16)} L${f(W - 18)} ${f(top + 2)}Z`, c, `stroke="${c}" stroke-width="4" stroke-linejoin="round"`) + P(`M${f(-W - 1)} ${f(top + 10)} L${f(-W - 2)} ${f(top - 8)} L${f(-W + 10)} ${f(top + 2)}Z M${f(W + 1)} ${f(top + 10)} L${f(W + 2)} ${f(top - 8)} L${f(W - 10)} ${f(top + 2)}Z`, '#ffb3c7');
  if (v.o === 'bear') s += circ(-W + 4, top + 2, 11, c) + circ(W - 4, top + 2, 11, c) + circ(-W + 4, top + 2, 6, light(c, 0.35)) + circ(W - 4, top + 2, 6, light(c, 0.35));
  if (v.o === 'dino') for (let i = 0; i < 5; i++) {
    const py = top + 8 + i * ((bot - top - 16) / 4);
    s += P(`M${f(-W + 1)} ${f(py - 8)} Q${f(-W - 12)} ${f(py)} ${f(-W + 1)} ${f(py + 8)}Z`, v.a ?? '#ffab5e') + P(`M${f(W - 1)} ${f(py - 8)} Q${f(W + 12)} ${f(py)} ${f(W - 1)} ${f(py + 8)}Z`, v.a ?? '#ffab5e');
  }
  if (v.o === 'unicorn') s += P(`M${f(W - 10)} ${f(top + 4)} L${f(W + 14)} ${f(top - 26)} L${f(W + 2)} ${f(top + 14)}Z`, GOLD, edge('#d99a1e', 1)) + stroke(`M${f(-W)} ${f(top + 10)} Q${f(-W - 14)} ${f(top + 34)} ${f(-W - 4)} ${f(top + 60)}`, '#ff9ec7', 7) + stroke(`M${f(-W + 2)} ${f(top + 14)} Q${f(-W - 8)} ${f(top + 40)} ${f(-W + 2)} ${f(top + 66)}`, '#9fd6ff', 5);
  s += cloth(d, c, x.p) + P(d, 'none', `stroke="${dark(c, 0.2)}" stroke-width="1.2"`);
  // side pockets show past the arms
  const py = b.waistY - (mini ? 14 : 6);
  for (const sd of [-1, 1]) {
    const px = sd * (W + 2);
    const pd = `M${f(px - 8)} ${f(py)} L${f(px + 8)} ${f(py)} L${f(px + 7)} ${f(py + 24)} Q${f(px)} ${f(py + 28)} ${f(px - 7)} ${f(py + 24)}Z`;
    s += P(pd, dark(c, 0.12)) + stroke(`M${f(px - 8)} ${f(py + 2)} L${f(px + 8)} ${f(py + 2)}`, light(c, 0.4), 1.2, 'stroke-dasharray="2 2"');
  }
  if (v.o === 'sport') s += ball(-W - 2, py - 4, 10, '#ffffff') + P(`M${f(-W - 2)} ${f(py - 8)} l3 2 -1 4 -4 0 -1 -4Z`, '#2d2a3a') + stroke(`M${f(-W - 10)} ${f(py + 2)} L${f(-W + 6)} ${f(py + 2)}`, '#fff', 2) +
    rect(W - 4, top + 14, 6, bot - top - 30, 2, v.a ?? '#ffffff', 'opacity="0.9"');
  if (v.o === 'team') s += [0, 1].map((i) => rect(-W + 3, top + 16 + i * 8, 2 * W - 6, 4, 2, v.a ?? '#ffffff', 'opacity="0.9"')).join('');
  if (v.o === 'strawberry') s += [[-W + 8, top + 20], [W - 8, top + 26], [-W + 6, bot - 20], [W - 6, bot - 16]].map(([sx, sy]) => ell(sx, sy, 1.6, 2.4, '#ffe680')).join('') + P(`M${f(-W + 10)} ${f(top + 2)} L${f(-W + 22)} ${f(top - 10)} L${f(-W + 28)} ${f(top)}Z M${f(W - 10)} ${f(top + 2)} L${f(W - 22)} ${f(top - 10)} L${f(W - 28)} ${f(top)}Z`, '#5fae6b');
  // a keychain dangling on the left pocket
  const kc = v.a && v.o !== 'sport' && v.o !== 'team' && v.o !== 'dino' && v.o !== 'mini' ? v.a : '';
  if (kc) s += line(-W - 2, py + 4, -W - 4, py + 18, '#cfd3e0', 1.2) + motif(kc, -W - 4, py + 27, 9);
  return s;
}
function backpackOver(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const sc = v.o === 'team' || v.o === 'sport' ? '#2d2a3a' : dark(c, 0.15);
  let s = straps(b, sc, v.o === 'mini' ? 4.4 : 6);
  const pin = v.o === 'heart' ? 'heart' : v.o === 'star' ? 'star' : v.o === 'bunny' ? 'bunny' : v.o === 'kitty' ? 'kitty' : v.o === 'bear' ? 'bear' : v.o === 'unicorn' ? 'unicorn' : v.o === 'dino' ? 'dino' : v.o === 'strawberry' ? 'strawberry' : v.o === 'sport' ? 'bolt' : '';
  if (pin) s += circ(-23, b.shY + 21, 9.6, '#ffffff', `stroke="${dark(sc, 0.1)}" stroke-width="1.2"`) + motif(pin, -23, b.shY + 21, 8);
  if (v.o !== 'mini') s += rect(-24, b.shY + 34, 48, 4, 2, sc) + rect(-4, b.shY + 32, 8, 8, 2, v.o === 'team' ? '#ffd24a' : SILVER);
  return s;
}

// ---------- capes ----------
function cape(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const kind = v.o ?? 'hero';
  const len = kind === 'princess' ? x.L * 0.98 : kind === 'hood' ? x.L * 0.35 : x.L * 0.8;
  const by = b.hipY + len;
  const flare = kind === 'princess' ? 58 : kind === 'hood' ? 26 : 46;
  const d = `M${f(-b.shW + 4)} ${f(b.shY - 4)} L${f(b.shW - 4)} ${f(b.shY - 4)} Q${f(b.shW + flare * 0.8)} ${f(b.hipY)} ${f(b.shW + flare)} ${f(by - 8)} Q0 ${f(by + 8)} ${f(-b.shW - flare)} ${f(by - 8)} Q${f(-b.shW - flare * 0.8)} ${f(b.hipY)} ${f(-b.shW + 4)} ${f(b.shY - 4)}Z`;
  let s = '';
  if (kind === 'hood') {
    const R = b.R;
    const hy = b.headY;
    s += circ(0, hy + R * 0.05, R * 1.13, dark(c, 0.12)) + circ(0, hy + R * 0.05, R * 1.13, 'url(#g-face)', 'opacity="0.5"');
    if (v.a === 'kitty') s += P(`M${f(-R * 0.95)} ${f(hy - R * 0.55)} L${f(-R * 0.85)} ${f(hy - R * 1.35)} L${f(-R * 0.3)} ${f(hy - R * 0.98)}Z M${f(R * 0.95)} ${f(hy - R * 0.55)} L${f(R * 0.85)} ${f(hy - R * 1.35)} L${f(R * 0.3)} ${f(hy - R * 0.98)}Z`, dark(c, 0.12), `stroke="${dark(c, 0.12)}" stroke-width="8" stroke-linejoin="round"`) +
      P(`M${f(-R * 0.86)} ${f(hy - R * 0.7)} L${f(-R * 0.8)} ${f(hy - R * 1.2)} L${f(-R * 0.45)} ${f(hy - R * 0.98)}Z M${f(R * 0.86)} ${f(hy - R * 0.7)} L${f(R * 0.8)} ${f(hy - R * 1.2)} L${f(R * 0.45)} ${f(hy - R * 0.98)}Z`, '#ffb3c7');
    if (v.a === 'bear') s += circ(-R * 0.8, hy - R * 0.95, R * 0.3, dark(c, 0.12)) + circ(R * 0.8, hy - R * 0.95, R * 0.3, dark(c, 0.12)) + circ(-R * 0.8, hy - R * 0.95, R * 0.16, light(c, 0.35)) + circ(R * 0.8, hy - R * 0.95, R * 0.16, light(c, 0.35));
    if (v.a === 'bunny') s += ell(-R * 0.5, hy - R * 1.45, R * 0.18, R * 0.55, dark(c, 0.12), `transform="rotate(-14 ${f(-R * 0.5)} ${f(hy - R * 1.45)})"`) + ell(R * 0.5, hy - R * 1.45, R * 0.18, R * 0.55, dark(c, 0.12), `transform="rotate(14 ${f(R * 0.5)} ${f(hy - R * 1.45)})"`) +
      ell(-R * 0.5, hy - R * 1.42, R * 0.08, R * 0.38, '#ffd6e3', `transform="rotate(-14 ${f(-R * 0.5)} ${f(hy - R * 1.42)})"`) + ell(R * 0.5, hy - R * 1.42, R * 0.08, R * 0.38, '#ffd6e3', `transform="rotate(14 ${f(R * 0.5)} ${f(hy - R * 1.42)})"`);
    // fluffy trim around the hood opening
    for (let i = 0; i <= 16; i++) {
      const an = Math.PI * (0.92 + (i / 16) * 1.16);
      s += circ(Math.cos(an) * R * 1.1, hy + R * 0.05 + Math.sin(an) * R * 1.1, R * 0.1, v.a === 'riding' ? light(c, 0.2) : '#fffaf5');
    }
  }
  s += cloth(d, c, x.p);
  if (kind === 'princess') {
    s += P(d, 'none', `stroke="${v.a ?? '#ffd24a'}" stroke-width="4"`);
    const stars: [number, number][] = [[b.shW + 24, b.hipY - 20], [b.shW + 40, b.hipY + 30], [-b.shW - 26, b.hipY - 10], [-b.shW - 44, b.hipY + 36], [b.shW + 50, by - 24], [-b.shW - 52, by - 20]];
    stars.forEach(([sx, sy], i) => (s += v.p ? '' : i % 2 ? P(starD(sx, sy, 6), v.a ?? '#ffd24a') : sparkle(sx, sy, 6, '#fff8c8')));
    if (v.k.includes('royal')) for (let i = 0; i < 7; i++) s += circ(-b.shW - 50 + i * ((2 * b.shW + 100) / 6), by - 6 + (i === 0 || i === 6 ? -2 : 3), 3, '#2d2a3a');
  }
  if (kind === 'hero') s += P(d, 'none', `stroke="${dark(c, 0.2)}" stroke-width="1.5"`) + stroke(`M${f(b.shW + 10)} ${f(b.shY + 30)} Q${f(b.shW + 30)} ${f(b.hipY)} ${f(b.shW + 36)} ${f(by - 30)}`, light(c, 0.3), 3, 'opacity="0.5"');
  return s;
}
function capeOver(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const y = b.shY;
  const kind = v.o ?? 'hero';
  if (kind === 'hero') {
    const a = v.a ?? 'star';
    return P(`M-22 ${f(y - 2)} L-8 ${f(y + 6)} L-16 ${f(y + 14)}Z M22 ${f(y - 2)} L8 ${f(y + 6)} L16 ${f(y + 14)}Z`, dark(c, 0.1)) +
      circ(0, y + 13, 9.5, GOLD, edge('#d99a1e', 1.2)) + circ(0, y + 13, 7.2, c) + motif(a, 0, y + 13, 5.6) + shine(-3, y + 9.6, 1.4, 0.6);
  }
  if (kind === 'princess') return stroke(`M-16 ${f(y)} Q-8 ${f(y + 8)} 0 ${f(y + 10)} M16 ${f(y)} Q8 ${f(y + 8)} 0 ${f(y + 10)}`, v.a ?? '#ffd24a', 2.4) + `<g ${tx(0, y + 11, 'scale(0.4)')}>${bowG(0, 0, 1, light(c, 0.15))}</g>`;
  // cozy hood: ties with pom-poms
  const pc = v.a === 'riding' ? '#ffffff' : '#fffaf5';
  return stroke(`M-14 ${f(y + 1)} Q-6 ${f(y + 10)} -5 ${f(y + 24)} M14 ${f(y + 1)} Q6 ${f(y + 10)} 5 ${f(y + 24)}`, dark(c, 0.15), 2.4) + ball(-5, y + 26, 3.6, pc) + ball(5, y + 26, 3.6, pc);
}

// ---------- tails ----------
function tail(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const kind = v.o ?? 'kitty';
  const hy = b.hipY - 6;
  const wag = (inner: string, deg = 6, dur = 2.4) => `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="0 -14 ${f(hy)};${deg} -14 ${f(hy)};0 -14 ${f(hy)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
  switch (kind) {
    case 'kitty': {
      const d = `M-14 ${f(hy)} Q-60 ${f(hy + 12)} -66 ${f(hy - 26)} Q-70 ${f(hy - 58)} -50 ${f(hy - 64)}`;
      let s = stroke(d, dark(c, 0.15), 11) + stroke(d, c, 9) + stroke(`M-30 ${f(hy + 4)} Q-56 ${f(hy + 4)} -62 ${f(hy - 22)}`, light(c, 0.35), 2, 'opacity="0.5"') + circ(-50, hy - 64, 4.5, v.a === 'tip' ? '#ffffff' : c);
      if (v.a && v.a !== 'tip') s += `<g ${tx(-64, hy - 20, 'scale(0.42) rotate(-20)')}>${bowG(0, 0, 1, v.a)}</g>`;
      return wag(s, -5, 2.8);
    }
    case 'fox': {
      const d = `M-14 ${f(hy)} C-50 ${f(hy + 10)} -92 ${f(hy - 6)} -84 ${f(hy - 52)} C-80 ${f(hy - 74)} -66 ${f(hy - 84)} -58 ${f(hy - 86)} C-66 ${f(hy - 62)} -56 ${f(hy - 36)} -14 ${f(hy - 16)}Z`;
      return wag(cloth(d, c, x.p) + P(`M-84 ${f(hy - 52)} C-80 ${f(hy - 74)} -66 ${f(hy - 84)} -58 ${f(hy - 86)} C-62 ${f(hy - 72)} -62 ${f(hy - 64)} -58 ${f(hy - 54)} Q-72 ${f(hy - 46)} -84 ${f(hy - 52)}Z`, '#ffffff') +
        stroke(`M-30 ${f(hy - 4)} Q-60 ${f(hy - 4)} -70 ${f(hy - 40)}`, light(c, 0.3), 2.4, 'opacity="0.6"'), -4, 3);
    }
    case 'bunny': {
      let s = '';
      const px = -b.hiW - 20;
      const py = hy - 12;
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * Math.PI * 2;
        s += circ(px + Math.cos(an) * 8, py + Math.sin(an) * 8, 6.5, i % 2 ? c : light(c, 0.25));
      }
      return s + circ(px, py, 9, light(c, 0.15)) + circ(px, py, 14, 'url(#g-face)', 'opacity="0.5"') + shine(px - 4, py - 5, 2.4, 0.5);
    }
    case 'mermaid': {
      const pts: [number, number, number][] = [[-14, hy - 4, 13], [-40, hy + 6, 12], [-60, hy + 22, 10], [-70, hy + 44, 7.5], [-72, hy + 62, 5]];
      let s = '';
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0, w0] = pts[i];
        const [x1, y1, w1] = pts[i + 1];
        s += P(`M${f(x0)} ${f(y0 - w0)} L${f(x1 + w1 * 0.4)} ${f(y1 - w1)} L${f(x1 - w1 * 0.4)} ${f(y1 + w1)} L${f(x0)} ${f(y0 + w0)}Z`, c, `stroke="${c}" stroke-width="6" stroke-linejoin="round"`);
      }
      for (const [px, py] of pts.slice(1, 4)) s += stroke(`M${f(px - 5)} ${f(py - 2)} Q${f(px)} ${f(py + 4)} ${f(px + 5)} ${f(py - 2)}`, light(c, 0.45), 1.4);
      const fx = -72;
      const fy = hy + 66;
      s += P(`M${fx} ${f(fy)} C${fx - 30} ${f(fy + 4)} ${fx - 34} ${f(fy + 28)} ${fx - 20} ${f(fy + 30)} C${fx - 12} ${f(fy + 22)} ${fx - 6} ${f(fy + 16)} ${fx} ${f(fy + 8)} C${fx + 6} ${f(fy + 16)} ${fx + 12} ${f(fy + 24)} ${fx + 22} ${f(fy + 28)} C${fx + 32} ${f(fy + 22)} ${fx + 26} ${f(fy + 2)} ${fx} ${f(fy)}Z`, v.a ?? light(c, 0.3)) +
        stroke(`M${fx} ${f(fy + 4)} L${fx - 18} ${f(fy + 24)} M${fx} ${f(fy + 4)} L${fx + 18} ${f(fy + 22)}`, '#fff', 1.2, 'opacity="0.6"');
      return wag(s, 4, 3.2) + sparkle(-50, hy + 30, 3.4) + sparkle(-90, hy + 60, 3);
    }
    case 'puppy':
      return wag(stroke(`M-14 ${f(hy)} Q-56 ${f(hy - 2)} -66 ${f(hy - 40)}`, dark(c, 0.15), 11) + stroke(`M-14 ${f(hy)} Q-56 ${f(hy - 2)} -66 ${f(hy - 40)}`, c, 9) + circ(-66, hy - 40, 5, light(c, 0.35)), 12, 0.7);
    case 'dino': {
      const d = `M-14 ${f(hy - 14)} Q-60 ${f(hy - 10)} -96 ${f(hy + 30)} Q-56 ${f(hy + 20)} -14 ${f(hy + 14)}Z`;
      let s = '';
      for (let i = 0; i < 4; i++) {
        const t = 0.25 + i * 0.18;
        const px = -14 - 82 * t;
        const py = hy - 14 + 44 * t * t - 6;
        s += P(`M${f(px - 7)} ${f(py + 4)} Q${f(px - 2)} ${f(py - 12 + i * 2)} ${f(px + 6)} ${f(py + 2)}Z`, v.a ?? '#ffab5e');
      }
      return s + cloth(d, c, x.p) + stroke(`M-20 ${f(hy + 10)} Q-56 ${f(hy + 16)} -88 ${f(hy + 28)}`, light(c, 0.35), 3, 'opacity="0.7"');
    }
    case 'dragon': {
      const d = `M-14 ${f(hy)} Q-56 ${f(hy + 24)} -70 ${f(hy - 6)} Q-80 ${f(hy - 34)} -60 ${f(hy - 46)}`;
      return wag(stroke(d, dark(c, 0.2), 9) + stroke(d, c, 7) + [0.3, 0.5, 0.7].map((t) => circ(-14 - 56 * t, hy + 16 * Math.sin(t * Math.PI) - 4, 2.4, v.a ?? '#ffd24a')).join('') +
        P(heartD(-58, hy - 60, 16), v.a ?? '#ffd24a', `stroke="${dark(c, 0.2)}" stroke-width="1.4"`), -5, 3);
    }
    case 'unicorn': {
      let s = '';
      RAINBOW.forEach((col, i) => (s += stroke(`M-14 ${f(hy - 6 + i * 2)} Q${-50 - i * 3} ${f(hy - 10 + i * 6)} ${-62 - i * 2} ${f(hy + 20 + i * 8)} Q${-70 - i * 2} ${f(hy + 40 + i * 6)} ${-56 - i * 4} ${f(hy + 52 + i * 4)}`, col, 5.4)));
      return wag(s, 4, 3) + twinkle(-80, hy + 24, 4, 0.3);
    }
    case 'lion':
      return wag(stroke(`M-14 ${f(hy)} Q-56 ${f(hy + 16)} -62 ${f(hy - 20)}`, dark(c, 0.15), 6) + stroke(`M-14 ${f(hy)} Q-56 ${f(hy + 16)} -62 ${f(hy - 20)}`, c, 4.4) +
        [0, 1, 2, 3, 4].map((i) => circ(-62 + Math.cos(i * 1.25) * 5, hy - 26 + Math.sin(i * 1.25) * 5, 5.4, v.a ?? '#b9744f')).join('') + circ(-62, hy - 26, 5, v.a ?? '#b9744f'), -6, 2.6);
    case 'squirrel': {
      const d = `M-14 ${f(hy + 4)} C-60 ${f(hy + 14)} -96 ${f(hy - 30)} -70 ${f(hy - 80)} C-56 ${f(hy - 104)} -28 ${f(hy - 96)} -34 ${f(hy - 74)} C-48 ${f(hy - 84)} -66 ${f(hy - 66)} -56 ${f(hy - 40)} C-48 ${f(hy - 22)} -30 ${f(hy - 16)} -14 ${f(hy - 12)}Z`;
      return wag(cloth(d, c, x.p) + stroke(`M-24 ${f(hy)} C-62 ${f(hy + 2)} -84 ${f(hy - 34)} -66 ${f(hy - 76)}`, light(c, 0.35), 3, 'opacity="0.6"'), -3, 3.4);
    }
    default:
      return '';
  }
}

// ---------- big back bows ----------
function bigBow(x: WearCtx, v: V): string {
  const { b } = x;
  const y = b.waistY + 2;
  const k = 2.7;
  const c = x.c;
  let s = `<g ${tx(0, y, `scale(${k})`)}>${bowG(0, 0, 1, c)}</g>`;
  if (v.o === 'dots') s += [[-46, -10], [-34, 6], [-54, 2], [46, -10], [34, 6], [54, 2], [-14, 40], [16, 44]].map(([dx, dy]) => circ(dx, y + dy, 3.6, v.a ?? '#fff', 'opacity="0.9"')).join('');
  if (v.o === 'sparkle') s += [[-50, -6], [-36, 8], [44, -8], [56, 4], [-20, 50], [22, 54]].map(([dx, dy], i) => (i % 2 ? sparkle(dx, y + dy, 4, '#fff8c8') : circ(dx, y + dy, 1.8, '#fff'))).join('') + twinkle(-58, y - 14, 5, 0.2) + twinkle(60, y - 10, 4.4, 1);
  if (v.o === 'gingham') s = `<g ${tx(0, y, `scale(${k})`)}>${bowG(0, 0, 1, c)}</g>` + [-1, 1].map((sd) => P(`M${sd * 4} ${y} C${sd * 22} ${f(y - 38)} ${sd * 70} ${f(y - 43)} ${sd * 70} ${f(y - 5)} C${sd * 70} ${f(y + 32)} ${sd * 22} ${f(y + 27)} ${sd * 4} ${y}Z`, 'url(#p-check)')).join('');
  if (v.o === 'rainbow') s = [-1, 1].map((sd) => RAINBOW.map((col, i) => P(`M${sd * 4} ${y} C${sd * (22 - i)} ${f(y - 38 + i * 5)} ${sd * (70 - i * 8)} ${f(y - 43 + i * 6)} ${sd * (70 - i * 8)} ${f(y - 5)} C${sd * (70 - i * 8)} ${f(y + 32 - i * 5)} ${sd * (22 - i)} ${f(y + 27 - i * 4)} ${sd * 4} ${y}Z`, col)).join('')).join('') +
    `<g ${tx(0, y, `scale(${k})`)}>${P('M-2 2 L-10 20 L-4 18 L-1 24Z', '#c99bff')}${P('M2 2 L10 20 L4 18 L1 24Z', '#7cc8ff')}<ellipse cx="0" cy="0" rx="6" ry="7" fill="#ffd36b"/></g>`;
  return about(0, y, 1.22, s);
}

// ---------- cool gear ----------
function gearBack(x: WearCtx, v: V): string {
  const { b } = x;
  const c = x.c;
  const kind = v.o ?? 'jetpack';
  switch (kind) {
    case 'jetpack': {
      let s = rect(-b.shW - 4, b.shY - 2, 2 * b.shW + 8, b.waistY - b.shY + 8, 8, dark(c, 0.2));
      for (const sd of [-1, 1]) {
        const cx = sd * (b.shW + 14);
        const t0 = b.shY - 18;
        const t1 = b.waistY + 10;
        const flame = (w: number, h: number, col: string) => P(`M${-w} 0 Q${-w} ${f(h * 0.6)} 0 ${h} Q${w} ${f(h * 0.6)} ${w} 0Z`, col);
        s += `<g ${tx(cx, t1 + 6)}><g>${flame(8, 30, '#ffab3d')}${flame(5, 20, '#ffe06b')}${flame(2.6, 10, '#fff8c8')}<animateTransform attributeName="transform" type="scale" values="1 1;0.9 0.72;1 1" dur="0.45s" begin="${sd > 0 ? 0 : 0.2}s" repeatCount="indefinite"/></g></g>`;
        s += P(`M${f(cx - 8)} ${f(t1)} L${f(cx + 8)} ${f(t1)} L${f(cx + 10)} ${f(t1 + 8)} L${f(cx - 10)} ${f(t1 + 8)}Z`, '#4a4a5e');
        s += cloth(`M${f(cx - 12)} ${f(t0 + 14)} Q${f(cx - 12)} ${f(t0 - 6)} ${f(cx)} ${f(t0 - 10)} Q${f(cx + 12)} ${f(t0 - 6)} ${f(cx + 12)} ${f(t0 + 14)} L${f(cx + 12)} ${f(t1)} L${f(cx - 12)} ${f(t1)}Z`, kind === 'jetpack' && v.a === 'silver' ? '#d9dbe6' : c, 'none');
        s += P(`M${f(cx - 12)} ${f(t0 + 14)} Q${f(cx - 12)} ${f(t0 - 6)} ${f(cx)} ${f(t0 - 10)} Q${f(cx + 12)} ${f(t0 - 6)} ${f(cx + 12)} ${f(t0 + 14)}Z`, v.a === 'silver' ? '#e8384f' : v.a ?? '#ffd24a');
        s += rect(cx - 12, (t0 + t1) / 2, 24, 5, 1, dark(c, 0.15)) + circ(cx, (t0 + t1) / 2 + 14, 3.4, '#7fe0ff') + shine(cx - 5, t0 + 10, 2, 0.5);
      }
      return s;
    }
    case 'guitar': case 'case': case 'skate': case 'archery': {
      // a long thing slung diagonally: from lower left to upper right
      const ax = -58;
      const ay = b.hipY - 4;
      const bx2 = 78;
      const by2 = b.shY - 26;
      const ang = (Math.atan2(by2 - ay, bx2 - ax) * 180) / Math.PI;
      const L = Math.hypot(bx2 - ax, by2 - ay);
      let s = '';
      if (kind === 'guitar') {
        s = rect(20, -4, L - 20, 8, 2, '#8a5a34') + rect(L - 6, -7, 22, 14, 4, '#5a3825') + [4, 10].map((dx) => circ(L - 6 + dx * 1.6, -9, 1.6, SILVER) + circ(L - 6 + dx * 1.6, 9, 1.6, SILVER)).join('') +
          `<path d="M-28 0 C-28 -26 -6 -26 2 -18 C10 -24 26 -22 26 -10 L26 10 C26 22 10 24 2 18 C-6 26 -28 26 -28 0Z" fill="${c}"/>` + `<path d="M-28 0 C-28 -26 -6 -26 2 -18 C10 -24 26 -22 26 -10 L26 10 C26 22 10 24 2 18 C-6 26 -28 26 -28 0Z" fill="url(#g-shadeY)"/>` +
          circ(-2, 0, 6, '#3a2a2a') + rect(10, -8, 4, 16, 1, '#3a2a2a') + [-2.4, 0, 2.4].map((dy) => line(-2, dy, L + 10, dy, '#fff', 0.5, 0.8)).join('');
      } else if (kind === 'case') {
        s = `<path d="M-30 0 C-30 -28 -4 -28 4 -18 C12 -16 ${f(L - 10)} -10 ${f(L + 8)} -8 Q${f(L + 14)} 0 ${f(L + 8)} 8 C${f(L - 10)} 10 12 16 4 18 C-4 28 -30 28 -30 0Z" fill="${c}"/>` +
          `<path d="M-30 0 C-30 -28 -4 -28 4 -18 C12 -16 ${f(L - 10)} -10 ${f(L + 8)} -8 Q${f(L + 14)} 0 ${f(L + 8)} 8 C${f(L - 10)} 10 12 16 4 18 C-4 28 -30 28 -30 0Z" fill="url(#g-shadeY)"/>` +
          stroke(`M-26 0 C-26 -22 -4 -24 4 -14 C14 -12 ${f(L - 12)} -6 ${f(L + 6)} -4`, light(c, 0.3), 1.2, 'stroke-dasharray="3 2"') + rect(-6, 12, 18, 5, 2.5, '#4a4a5e') +
          `<g transform="rotate(${f(-ang)} -12 -4)">${motif(v.a ?? 'star', -12, -4, 8)}</g>` + `<g transform="rotate(${f(-ang)} 34 0)">${motif('note', 34, 0, 6)}</g>`;
      } else if (kind === 'skate') {
        s = circ(4, 14, 6, '#ffd24a') + circ(L - 4, 14, 6, '#ffd24a') + circ(4, -14, 6, '#ffd24a') + circ(L - 4, -14, 6, '#ffd24a') +
          `<path d="M-6 -12 L${f(L + 6)} -12 Q${f(L + 18)} -12 ${f(L + 18)} 0 Q${f(L + 18)} 12 ${f(L + 6)} 12 L-6 12 Q-18 12 -18 0 Q-18 -12 -6 -12Z" fill="${c}"/>` +
          `<path d="M-6 -12 L${f(L + 6)} -12 Q${f(L + 18)} -12 ${f(L + 18)} 0 Q${f(L + 18)} 12 ${f(L + 6)} 12 L-6 12 Q-18 12 -18 0 Q-18 -12 -6 -12Z" fill="url(#g-shadeY)"/>` +
          `<g transform="rotate(${f(-ang)} -6 0)">${motif(v.a ?? 'bolt', -6, 0, 9)}</g>` + `<g transform="rotate(${f(-ang)} ${f(L + 4)} 0)">${motif(v.a === 'star' ? 'planet' : 'star', L + 4, 0, 8)}</g>`;
      } else {
        // archery bag: a soft tube with a cap and a flower patch, nothing sharp inside
        s = rect(-24, -11, L + 14, 22, 11, c) + rect(-24, -11, L + 14, 22, 11, 'url(#g-shadeY)') + rect(L - 16, -13, 18, 26, 6, dark(c, 0.2)) + rect(-26, -12, 10, 24, 5, dark(c, 0.15)) +
          [0.25, 0.5, 0.75].map((t) => line(-24 + (L + 14) * t, -11, -24 + (L + 14) * t, 11, light(c, 0.3), 1.2, 0.7)).join('') + `<g transform="rotate(${f(-ang)} 30 0)">${motif(v.a ?? 'daisy', 30, 0, 9)}</g>`;
      }
      return `<g transform="translate(${f(ax)} ${f(ay)}) rotate(${f(ang)})">${s}</g>`;
    }
    case 'camping': {
      const W = b.shW + 16;
      const top = b.shY - 6;
      const bot = b.hipY - 4;
      const d = `M${f(-W)} ${f(top + 16)} Q${f(-W)} ${f(top)} ${f(-W + 16)} ${f(top)} L${f(W - 16)} ${f(top)} Q${f(W)} ${f(top)} ${f(W)} ${f(top + 16)} L${f(W - 2)} ${f(bot - 10)} Q${f(W - 2)} ${f(bot)} ${f(W - 12)} ${f(bot)} L${f(-W + 12)} ${f(bot)} Q${f(-W + 2)} ${f(bot)} ${f(-W + 2)} ${f(bot - 10)}Z`;
      let s = cloth(d, c, x.p) + rect(-W - 4, b.waistY - 6, 12, 30, 5, dark(c, 0.15)) + rect(W - 8, b.waistY - 6, 12, 30, 5, dark(c, 0.15));
      // bedroll on top
      const ry = top - 12;
      const rw = W + 14;
      const roll = v.a ?? '#4f9dff';
      s += rect(-rw, ry - 12, rw * 2, 24, 12, roll) + rect(-rw, ry - 12, rw * 2, 24, 12, 'url(#g-shadeY)') + ell(-rw + 4, ry, 6, 12, dark(roll, 0.15)) + ell(rw - 4, ry, 6, 12, light(roll, 0.15)) +
        stroke(`M${f(rw - 6)} ${f(ry - 6)} A5 6 0 1 0 ${f(rw - 3)} ${f(ry + 4)}`, dark(roll, 0.25), 1.2) + rect(-rw + 16, ry - 13, 6, 26, 2, '#8a5a3c') + rect(rw - 22, ry - 13, 6, 26, 2, '#8a5a3c');
      // a little mug hanging on the side
      s += line(-W - 2, b.waistY - 6, -W - 6, b.waistY + 26, '#9aa3b5', 1.2) + rect(-W - 14, b.waistY + 26, 14, 12, 3, SILVER) + stroke(`M${f(-W)} ${f(b.waistY + 29)} q5 0 5 3 q0 3 -5 3`, '#9aa3b5', 1.6);
      return s;
    }
    case 'balloons': {
      const R = b.R;
      const hy = b.headY;
      const spots: [number, number, string][] = [[-R * 1.25, hy - R * 0.9, c], [R * 1.25, hy - R * 0.75, v.a ?? '#7cc8ff'], [R * 0.45, hy - R * 1.6, '#ffd36b'], [-R * 0.55, hy - R * 1.55, '#ff7eb6']];
      let s = '';
      for (const [bx, by] of spots) s += stroke(`M${bx > 0 ? 16 : -16} ${f(b.shY)} Q${f(bx * 0.6)} ${f((b.shY + by) / 2)} ${f(bx)} ${f(by + 28)}`, '#d9d4e2', 1.2);
      spots.forEach(([bx, by, col], i) => (s += `<g>${ell(bx, by, 21, 24, col)}${ell(bx, by, 21, 24, 'url(#g-face)')}${ell(bx - 8, by - 10, 4, 7, '#fff', `opacity="0.7" transform="rotate(25 ${f(bx - 8)} ${f(by - 10)})"`)}${P(`M${f(bx - 3.5)} ${f(by + 29)} L${f(bx + 3.5)} ${f(by + 29)} L${f(bx)} ${f(by + 23)}Z`, dark(col, 0.15))}<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="${(3 + i * 0.4).toFixed(1)}s" repeatCount="indefinite"/></g>`));
      return s;
    }
    case 'duffel': {
      const y = b.waistY - 4;
      const W = b.shW + 26;
      const d = `M${f(-W)} ${f(y)} Q${f(-W)} ${f(y - 22)} ${f(-W + 22)} ${f(y - 22)} L${f(W - 22)} ${f(y - 22)} Q${f(W)} ${f(y - 22)} ${f(W)} ${f(y)} Q${f(W)} ${f(y + 22)} ${f(W - 22)} ${f(y + 22)} L${f(-W + 22)} ${f(y + 22)} Q${f(-W)} ${f(y + 22)} ${f(-W)} ${f(y)}Z`;
      return cloth(d, c, x.p) + ell(-W + 6, y, 8, 18, dark(c, 0.15)) + ell(W - 6, y, 8, 18, dark(c, 0.15)) + rect(-W + 14, y - 6, 2 * W - 28, 5, 2, v.a ?? '#ffffff') + rect(-W + 14, y + 2, 2 * W - 28, 3, 1.5, v.a ?? '#ffffff', 'opacity="0.7"') +
        motif('star', -W + 6, y, 6) + motif('star', W - 6, y, 6);
    }
    default:
      return '';
  }
}
function gearOver(x: WearCtx, v: V): string {
  const { b } = x;
  const kind = v.o ?? 'jetpack';
  if (kind === 'jetpack') return straps(b, '#4a4a5e', 6) + rect(-10, b.shY + 30, 20, 12, 4, x.c) + circ(-4, b.shY + 36, 2, '#ff4f6d') + circ(4, b.shY + 36, 2, '#5fd3b5');
  if (kind === 'camping') return straps(b, dark(x.c, 0.3), 6.4) + rect(-26, b.shY + 34, 52, 4, 2, dark(x.c, 0.3)) + rect(-5, b.shY + 31, 10, 10, 3, v.a ?? '#4f9dff');
  if (kind === 'balloons') return straps(b, '#ff9ec7', 3.4);
  if (kind === 'duffel') return sash(b, dark(x.c, 0.25), 5);
  return sash(b, kind === 'guitar' ? '#3a2a2a' : kind === 'archery' ? '#8a5a3c' : dark(x.c, 0.3), 5.4);
}

// ---------- the catalog ----------
const wingDraw = (fn: (b: Body, s: 1 | -1, c: string, a: string, o: string) => string, cls = 'flutter') => (x: WearCtx, v: V) => pair((s) => fn(x.b, s, x.c, v.a ?? '#ffffff', v.o ?? ''), cls);
const STYLES: Style[] = [
  {
    group: 'Fairy Wings', key: 'wings-fairy', step: 8, max: 160, draw: wingDraw((b, s, c, _a, o) => fairyWing(b, s, c, o)), vs: [
      { k: 'mint', n: 'Mint Fairy Wings', c: '#a8e6cf', o: 'round' },
      { k: 'pink', n: 'Pink Fairy Wings', c: '#ffb3c7', o: 'round' },
      { k: 'lilac', n: 'Lilac Fairy Wings', c: '#c99bff', o: 'round' },
      { k: 'sky', n: 'Sky Fairy Wings', c: '#7cc8ff', o: 'round' },
      { k: 'peach-pointed', n: 'Peach Pixie Wings', c: '#ffab5e', o: 'pointed' },
      { k: 'aqua-pointed', n: 'Aqua Pixie Wings', c: '#5fd3b5', o: 'pointed' },
      { k: 'lavender-pointed', n: 'Lavender Pixie Wings', c: '#e6d4ff', o: 'pointed' },
      { k: 'ice-crystal', n: 'Ice Crystal Wings', c: '#bfe8ff', o: 'crystal', t: ['winter'] },
      { k: 'rose-crystal', n: 'Rose Quartz Wings', c: '#ffc2d6', o: 'crystal' },
      { k: 'amethyst-crystal', n: 'Amethyst Wings', c: '#b583ff', o: 'crystal' },
      { k: 'gold-glitter', n: 'Golden Glitter Wings', c: '#ffd36b', o: 'glitter' },
      { k: 'silver-glitter', n: 'Silver Glitter Wings', c: '#d9dbe6', o: 'glitter' },
      { k: 'pink-glitter', n: 'Pink Glitter Wings', c: '#ff9ec7', o: 'glitter' },
      { k: 'mint-glitter', n: 'Mint Glitter Wings', c: '#7fe0b0', o: 'glitter' },
    ],
  },
  {
    group: 'Butterfly Wings', key: 'wings-butterfly', step: 8, max: 160, tags: ['spring'], draw: wingDraw((b, s, c, a, o) => butterflyWing(b, s, c, a, o)), vs: [
      { k: 'monarch', n: 'Monarch Wings', c: '#ff9a3d', o: 'monarch' },
      { k: 'polka', n: 'Polka Butterfly Wings', c: '#ff7eb6', o: 'polka', a: '#ffffff' },
      { k: 'morpho', n: 'Blue Morpho Wings', c: '#4f9dff', o: 'morpho' },
      { k: 'rainbow', n: 'Rainbow Butterfly', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'hearts', n: 'Heart Butterfly Wings', c: '#c99bff', o: 'hearts', a: '#ff7eb6' },
      { k: 'swallowtail', n: 'Swallowtail Wings', c: '#ffe06b', o: 'swallowtail' },
      { k: 'spots', n: 'Spotty Butterfly', c: '#a8e6cf', o: 'spots', a: '#ff9ec7' },
      { k: 'stripes', n: 'Candy Stripe Wings', c: '#ff9ec7', o: 'stripes' },
      { k: 'sunset', n: 'Sunset Wings', c: '#ff7a6b', o: 'sunset', fixed: true, t: ['summer'] },
      { k: 'lace', n: 'Lace Butterfly Wings', c: '#9fd6ff', o: 'lace' },
    ],
  },
  {
    group: 'Feather Wings', key: 'wings-feather', step: 10, max: 200, draw: (x, v) => pair((s) => {
      const rows: Record<string, [string[], number, string?]> = {
        gold: [['#ffd36b', '#ffffff', '#ffffff'], 1],
        pink: [['#ff9ec7', '#ffd6e3', '#fff3f8'], 1],
        sky: [['#7cc8ff', '#bfe8ff', '#ffffff'], 1],
        mini: [[x.c, light(x.c, 0.5), '#ffffff'], 0.62],
        rainbow: [['rainbow', '#ffffff', '#ffffff'], 1],
        bluebird: [[dark(x.c, 0.15), x.c, light(x.c, 0.4)], 0.9],
        parrot: [['#4f9dff', '#ffe06b', '#e8384f'], 0.92],
        owl: [[x.c, light(x.c, 0.25), light(x.c, 0.45)], 0.85, '#fff3d6'],
        sunbird: [['#ff7a6b', '#ffab5e', '#ffe06b'], 0.95],
      };
      const [r, k, sp] = rows[v.o ?? 'gold'] ?? rows.gold;
      return featherWing(x.b, s, r, k, sp) + (v.o === 'gold' || v.o === 'rainbow' ? twinkle(s * 96, x.b.shY - 60, 6, s > 0 ? 0 : 0.8) : '');
    }), vs: [
      { k: 'angel-gold', n: 'Golden Angel Wings', c: '#ffffff', o: 'gold', fixed: true },
      { k: 'angel-pink', n: 'Pink Angel Wings', c: '#ffb3c7', o: 'pink', fixed: true },
      { k: 'angel-mini', n: 'Little Angel Wings', c: '#e6d4ff', o: 'mini' },
      { k: 'angel-sky', n: 'Sky Angel Wings', c: '#9fd6ff', o: 'sky', fixed: true },
      { k: 'unicorn-rainbow', n: 'Unicorn Rainbow Wings', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'bluebird', n: 'Bluebird Wings', c: '#4f9dff', o: 'bluebird', t: ['spring'] },
      { k: 'parrot', n: 'Parrot Wings', c: '#e8384f', o: 'parrot', fixed: true, t: ['summer'] },
      { k: 'owl', n: 'Owl Wings', c: '#b07a4f', o: 'owl', t: ['fall'] },
      { k: 'sunbird', n: 'Sunbird Wings', c: '#ff7a6b', o: 'sunbird', fixed: true },
    ],
  },
  {
    group: 'Critter Wings', key: 'wings-critter', step: 8, max: 160, draw: wingDraw((b, s, c, a, o) => critterWing(b, s, c, a, o)), vs: [
      { k: 'bat-heart', n: 'Cute Bat Wings', c: '#ff7eb6', o: 'heart', a: '#ffffff', t: ['fall'] },
      { k: 'bee', n: 'Bumblebee Wings', c: '#ffc23a', o: 'bee', t: ['spring', 'summer'] },
      { k: 'ladybug', n: 'Ladybug Wings', c: '#e8384f', o: 'ladybug', a: '#2d2a3a', t: ['spring'] },
      { k: 'dragon-green', n: 'Green Dragon Wings', c: '#5fbf6b', o: 'dragon', a: '#ffd24a' },
      { k: 'dragon-pink', n: 'Pink Dragon Wings', c: '#ff7eb6', o: 'dragon', a: '#ffffff' },
      { k: 'dragon-purple', n: 'Purple Dragon Wings', c: '#8a5ad6', o: 'dragon', a: '#7fe0ff' },
      { k: 'bat-lilac', n: 'Lilac Bat Wings', c: '#b583ff', o: 'bat', a: '#ffe06b', t: ['fall'] },
      { k: 'dragonfly', n: 'Dragonfly Wings', c: '#5fd3b5', o: 'dragonfly', t: ['summer'] },
      { k: 'ladybug-pink', n: 'Pink Ladybug Wings', c: '#ff7eb6', o: 'ladybug', a: '#ffffff' },
      { k: 'dragon-blue', n: 'Blue Dragon Wings', c: '#4f9dff', o: 'dragon', a: '#ffffff' },
    ],
  },
  {
    group: 'Magic Wings', key: 'wings-magic', step: 12, max: 200, premium: 20, draw: wingDraw((b, s, c, a, o) => magicWing(b, s, c, a, o)), vs: [
      { k: 'unicorn', n: 'Unicorn Dream Wings', c: '#ffd6e3', o: 'unicorn', fixed: true },
      { k: 'star', n: 'Superstar Wings', c: '#ffd24a', o: 'star' },
      { k: 'heart', n: 'Sweetheart Wings', c: '#ff7eb6', o: 'heart' },
      { k: 'cloud', n: 'Cloud Puff Wings', c: '#eef7ff', o: 'cloud' },
      { k: 'snow', n: 'Snow Queen Wings', c: '#bfe8ff', o: 'snow', t: ['winter'] },
      { k: 'moon', n: 'Moonlight Wings', c: '#ffe680', o: 'moon', a: '#ffffff' },
      { k: 'candy', n: 'Candy Swirl Wings', c: '#ffb3c7', o: 'candy', a: '#ff4f8b' },
    ],
  },
  {
    group: 'Backpacks', key: 'backpack', tags: ['fall'], draw: backpack, over: backpackOver, vs: [
      { k: 'mint', n: 'Mint Backpack', c: '#5fd3b5', o: 'plain', a: 'star' },
      { k: 'heart', n: 'Heart Backpack', c: '#ff7eb6', o: 'heart', a: 'heart' },
      { k: 'sport', n: 'Sports Backpack', c: '#4f9dff', o: 'sport', a: '#ffffff' },
      { k: 'bunny', n: 'Bunny Backpack', c: '#ffffff', o: 'bunny', a: 'bunny', t: ['spring'] },
      { k: 'star', n: 'Star Backpack', c: '#3f4f9a', o: 'star', a: 'moon' },
      { k: 'unicorn', n: 'Unicorn Backpack', c: '#e6d4ff', o: 'unicorn', a: 'rainbow' },
      { k: 'team', n: 'Team Backpack', c: '#e8384f', o: 'team', a: '#ffffff' },
      { k: 'kitty', n: 'Kitty Backpack', c: '#ffab5e', o: 'kitty', a: 'paw' },
      { k: 'dino', n: 'Dino Backpack', c: '#6fc47c', o: 'dino', a: '#ffab5e' },
      { k: 'bear', n: 'Bear Backpack', c: '#c98a5a', o: 'bear', a: 'bear' },
      { k: 'mini', n: 'Mini Backpack', c: '#ffb3c7', o: 'mini' },
      { k: 'strawberry', n: 'Strawberry Backpack', c: '#ff4f6d', o: 'strawberry', a: 'cherry', t: ['summer'] },
      { k: 'navy', n: 'Navy Backpack', c: '#3f4f9a', o: 'plain', a: 'planet' },
    ],
  },
  {
    group: 'Capes', key: 'cape', draw: cape, over: capeOver, vs: [
      { k: 'hero-star', n: 'Star Hero Cape', c: '#e8384f', o: 'hero', a: 'star' },
      { k: 'hero-bolt', n: 'Lightning Hero Cape', c: '#4f9dff', o: 'hero', a: 'bolt' },
      { k: 'princess-lilac', n: 'Starry Princess Cape', c: '#c99bff', o: 'princess', a: '#ffd24a' },
      { k: 'hood-kitty', n: 'Kitty Hood Cape', c: '#ffb3c7', o: 'hood', a: 'kitty', t: ['winter', 'fall'] },
      { k: 'hero-heart', n: 'Heart Hero Cape', c: '#ff4f8b', o: 'hero', a: 'heart' },
      { k: 'hero-moon', n: 'Moon Hero Cape', c: '#3f4f9a', o: 'hero', a: 'moon' },
      { k: 'princess-pink', n: 'Rosy Princess Cape', c: '#ffb3c7', o: 'princess', a: '#ffffff', p: 'hearts' },
      { k: 'hood-bear', n: 'Bear Hood Cape', c: '#c98a5a', o: 'hood', a: 'bear', t: ['winter', 'fall'] },
      { k: 'hero-paw', n: 'Paw Hero Cape', c: '#3fbf8f', o: 'hero', a: 'paw' },
      { k: 'princess-snow', n: 'Snow Princess Cape', c: '#9fd6ff', o: 'princess', a: '#ffffff', p: 'stars', t: ['winter'] },
      { k: 'hood-bunny', n: 'Bunny Hood Cape', c: '#ffffff', o: 'hood', a: 'bunny', t: ['spring'] },
      { k: 'hero-planet', n: 'Space Hero Cape', c: '#2d2a3a', o: 'hero', a: 'planet' },
      { k: 'princess-royal', n: 'Royal Velvet Cape', c: '#9b3a6a', o: 'princess', a: '#ffffff' },
      { k: 'hood-riding', n: 'Red Riding Cape', c: '#e8384f', o: 'hood', a: 'riding', t: ['fall'] },
      { k: 'hero-crown', n: 'Royal Hero Cape', c: '#9b6bff', o: 'hero', a: 'crown' },
    ],
  },
  {
    group: 'Tails', key: 'tail', draw: tail, vs: [
      { k: 'kitty', n: 'Kitty Tail', c: '#2d2a3a', o: 'kitty', a: 'tip' },
      { k: 'bunny', n: 'Bunny Puff Tail', c: '#ffffff', o: 'bunny', t: ['spring'] },
      { k: 'fox', n: 'Fluffy Fox Tail', c: '#ff8a3d', o: 'fox', t: ['fall'] },
      { k: 'mermaid', n: 'Mermaid Tail', c: '#3fbf8f', o: 'mermaid', a: '#7fe0d0', t: ['summer'] },
      { k: 'kitty-bow', n: 'Ginger Kitty Tail', c: '#ffab5e', o: 'kitty', a: '#ff4f8b' },
      { k: 'puppy', n: 'Waggy Puppy Tail', c: '#c9a27e', o: 'puppy' },
      { k: 'dino', n: 'Dino Tail', c: '#6fc47c', o: 'dino', a: '#ffab5e' },
      { k: 'dragon', n: 'Dragon Heart Tail', c: '#9b6bff', o: 'dragon', a: '#ff7eb6' },
      { k: 'unicorn', n: 'Unicorn Tail', c: '#ff6f91', o: 'unicorn', fixed: true },
      { k: 'mermaid-pink', n: 'Pink Mermaid Tail', c: '#ff7eb6', o: 'mermaid', a: '#c99bff', t: ['summer'] },
      { k: 'lion', n: 'Lion Tail', c: '#ffc94a', o: 'lion', a: '#b9744f' },
      { k: 'squirrel', n: 'Squirrel Tail', c: '#b9744f', o: 'squirrel', t: ['fall'] },
      { k: 'bunny-pink', n: 'Pink Puff Tail', c: '#ffb3c7', o: 'bunny' },
    ],
  },
  {
    group: 'Big Bows', key: 'bow', draw: bigBow, vs: [
      { k: 'pink', n: 'Big Pink Bow', c: '#ff7eb6' },
      { k: 'red', n: 'Big Red Bow', c: '#e8384f', t: ['winter'] },
      { k: 'polka', n: 'Polka Dot Back Bow', c: '#9b6bff', o: 'dots' },
      { k: 'gingham', n: 'Picnic Back Bow', c: '#ff9ec7', o: 'gingham', t: ['spring'] },
      { k: 'sparkle', n: 'Sparkle Back Bow', c: '#ffc94a', o: 'sparkle' },
      { k: 'mint', n: 'Big Mint Bow', c: '#5fd3b5' },
      { k: 'rainbow', n: 'Rainbow Back Bow', c: '#ff6f91', o: 'rainbow', fixed: true },
    ],
  },
  {
    group: 'Cool Gear', key: 'gear', draw: gearBack, over: gearOver, vs: [
      { k: 'jetpack', n: 'Rocket Jetpack', c: '#9aa3b5', o: 'jetpack', a: 'silver' },
      { k: 'guitar', n: 'Rock Star Guitar', c: '#e8384f', o: 'guitar' },
      { k: 'skate', n: 'Skateboard Pack', c: '#4f9dff', o: 'skate', a: 'bolt' },
      { k: 'jetpack-pink', n: 'Pink Jetpack', c: '#ff7eb6', o: 'jetpack', a: '#ffffff' },
      { k: 'balloons', n: 'Floaty Balloon Pack', c: '#ff4f8b', o: 'balloons', a: '#7cc8ff' },
      { k: 'guitar-blue', n: 'Blue Guitar', c: '#4f9dff', o: 'guitar' },
      { k: 'skate-star', n: 'Star Skateboard Pack', c: '#9b6bff', o: 'skate', a: 'star' },
    ],
  },
  {
    group: 'Adventure Packs', key: 'adventure', tags: ['summer', 'fall'], draw: gearBack, over: gearOver, vs: [
      { k: 'camping-green', n: 'Camping Pack', c: '#3fbf8f', o: 'camping', a: '#4f9dff' },
      { k: 'guitar-case', n: 'Guitar Case', c: '#2d2a3a', o: 'case', a: 'star' },
      { k: 'archery', n: 'Archery Bag', c: '#c9a27e', o: 'archery', a: 'daisy' },
      { k: 'camping-orange', n: 'Explorer Pack', c: '#ff8a3d', o: 'camping', a: '#e8384f' },
      { k: 'duffel', n: 'Sports Duffel', c: '#3f4f9a', o: 'duffel', a: '#ffd24a' },
      { k: 'guitar-case-pink', n: 'Pink Guitar Case', c: '#ff7eb6', o: 'case', a: 'heart' },
      { k: 'archery-green', n: 'Forest Archery Bag', c: '#5f8f3a', o: 'archery', a: 'leaf' },
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
    const over = st.over;
    out.push({
      id: `back-${st.key}-${v.k}`,
      name: v.n,
      slot: 'back',
      group: st.group,
      price: i < 3 ? 0 : Math.min(st.max ?? 120, 15 + (i - 3) * (st.step ?? 6) + (st.premium ?? 0)),
      color: v.c,
      pattern: v.p,
      fixed: v.fixed,
      tags: tags.length ? tags : undefined,
      back: (x) => st.draw(x, v),
      over: over ? (x) => over(x, v) : undefined,
    });
  }
  return out;
}

export const BACK_MORE: WearDef[] = build(STYLES);
