// Head accessories: bows, headbands, flower crowns, tiaras, crowns, hats, animal ears and clips.
// Each style comes in a few versions with their own colors, gems or prints, and is listed under its
// own closet section. Everything is measured from the head radius R and centre hy, so it fits every age.
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, circ, flowerG, heartD, line, sparkleD, starD } from './base';
import { patch } from './trims';
import { MOTIF_BY_ID } from '../motifs';

const f = (n: number) => n.toFixed(1);
type Pt = (x: number, y: number) => string;
/** A point in head units: x and y are multiples of R, y is measured from the head centre. */
const at = (R: number, hy: number): Pt => (x, y) => `${f(x * R)} ${f(hy + y * R)}`;
const sk = (c: string, w: number, extra = '') => `fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
const ell = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const rot = (deg: number, x: number, y: number) => `transform="rotate(${f(deg)} ${f(x)} ${f(y)})"`;
const grp = (tr: string, s: string) => `<g transform="${tr}">${s}</g>`;
/** The drawing plus its mirror image across the middle of the face. */
const mirror = (s: string) => s + `<g transform="scale(-1 1)">${s}</g>`;
const isUrl = (c: string) => c.startsWith('url');

// ---------- shared pieces ----------

/** A point on an ellipse around the head: angle in degrees (180 = left, 270 = top, 360 = right). */
const arcXY = (R: number, hy: number, a: number, rx = 1, ry = 1, cy = 0.02): [number, number] => {
  const t = (a * Math.PI) / 180;
  return [Math.cos(t) * rx * R, hy + cy * R + Math.sin(t) * ry * R];
};
/** Direction of that ellipse at angle a, in degrees, for lining things up along a band. */
const tangent = (a: number, rx = 1, ry = 1) => {
  const t = (a * Math.PI) / 180;
  return (Math.atan2(Math.cos(t) * ry, -Math.sin(t) * rx) * 180) / Math.PI;
};
const topArc = (R: number, hy: number, rx = 1, ry = 1, cy = 0.02, a0 = 188, a1 = 352) => {
  const [x0, y0] = arcXY(R, hy, a0, rx, ry, cy);
  const [x1, y1] = arcXY(R, hy, a1, rx, ry, cy);
  return `M${f(x0)} ${f(y0)} A${f(rx * R)} ${f(ry * R)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
};

/** A headband over the top of the head, with a darker rim and a soft shine. */
function band(R: number, hy: number, c: string, w = 0.12, o: { edge?: string; pattern?: Pattern; rr?: number } = {}): string {
  const rr = o.rr ?? 1;
  const d = topArc(R, hy, rr, rr);
  let s = `<path d="${d}" ${sk(o.edge ?? (isUrl(c) ? '#c98a1e' : dark(c, 0.25)), w * R)}/>`;
  s += `<path d="${d}" ${sk(c, w * R * 0.72)} transform="translate(0 ${f(-w * R * 0.1)})"/>`;
  if (o.pattern && o.pattern !== 'none') s += `<path d="${d}" ${sk(`url(#p-${o.pattern})`, w * R * 0.72)} transform="translate(0 ${f(-w * R * 0.1)})"/>`;
  return s + `<path d="${topArc(R, hy, rr, rr, 0.02 - w * 0.14, 214, 262)}" ${sk('#fff', w * R * 0.2, 'opacity="0.55"')}/>`;
}

const gem = (x: number, y: number, r: number, c: string) =>
  circ(x, y, r, dark(c, 0.35)) + circ(x, y - r * 0.08, r * 0.8, c) +
  P(`M${f(x - r * 0.55)} ${f(y - r * 0.2)} L${f(x - r * 0.1)} ${f(y - r * 0.72)} L${f(x + r * 0.45)} ${f(y - r * 0.5)} L${f(x + r * 0.05)} ${f(y - r * 0.02)}Z`, light(c, 0.5), 'opacity="0.7"') +
  circ(x - r * 0.3, y - r * 0.4, r * 0.2, '#fff', 'opacity="0.95"');
/** A teardrop gem pointing up; (x, y) is the centre of its round bottom. */
const drop = (x: number, y: number, r: number, c: string) => {
  const d = `M${f(x)} ${f(y - r * 1.7)} C${f(x + r * 0.5)} ${f(y - r * 1.1)} ${f(x + r)} ${f(y - r * 0.5)} ${f(x + r)} ${f(y)} A${f(r)} ${f(r)} 0 0 1 ${f(x - r)} ${f(y)} C${f(x - r)} ${f(y - r * 0.5)} ${f(x - r * 0.5)} ${f(y - r * 1.1)} ${f(x)} ${f(y - r * 1.7)}Z`;
  return P(d, c, `stroke="${dark(c, 0.35)}" stroke-width="${f(r * 0.22)}"`) + P(`M${f(x)} ${f(y - r * 1.5)} L${f(x - r * 0.55)} ${f(y - r * 0.1)} L${f(x)} ${f(y + r * 0.6)}Z`, light(c, 0.45), 'opacity="0.6"') +
    circ(x - r * 0.38, y - r * 0.3, r * 0.22, '#fff', 'opacity="0.9"');
};
const pearl = (x: number, y: number, r: number, c = '#f7efe9') => circ(x, y, r, c) + circ(x, y, r, 'url(#g-face)') + circ(x - r * 0.35, y - r * 0.38, r * 0.3, '#fff', 'opacity="0.9"');
const heartGem = (x: number, y: number, s: number, c: string) =>
  P(heartD(x, y - s * 0.55, s), c, `stroke="${dark(c, 0.3)}" stroke-width="${f(s * 0.08)}"`) + ell(x - s * 0.25, y - s * 0.22, s * 0.14, s * 0.09, '#fff', `opacity="0.75" ${rot(-30, x - s * 0.25, y - s * 0.22)}`);
const starGem = (x: number, y: number, r: number, c: string) =>
  P(starD(x, y, r, 0.48), c, `stroke="${isUrl(c) ? '#c98a1e' : dark(c, 0.3)}" stroke-width="${f(r * 0.12)}" stroke-linejoin="round"`) + circ(x - r * 0.25, y - r * 0.25, r * 0.16, '#fff', 'opacity="0.8"');
const sparkle = (x: number, y: number, r: number, c = '#fff', op = 0.95) => P(sparkleD(x, y, r), c, `opacity="${op}"`);

/** A fluffy pompom: lumpy shaded edge, soft body, a highlight. */
function pom(x: number, y: number, r: number, c: string): string {
  let s = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    s += circ(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66, r * 0.38, dark(c, 0.1));
  }
  s += circ(x - r * 0.05, y - r * 0.06, r * 0.78, c);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    s += circ(x + Math.cos(a) * r * 0.5 - r * 0.05, y + Math.sin(a) * r * 0.5 - r * 0.06, r * 0.3, light(c, 0.12));
  }
  return s + circ(x - r * 0.3, y - r * 0.34, r * 0.24, '#fff', 'opacity="0.6"');
}

interface BowO { rot?: number; dots?: string; satin?: boolean; velvet?: boolean; tails?: 0 | 1 | 2; knot?: string; glitter?: boolean }
/** A ribbon bow of half width w, with folds, shine and tails. */
function bow(x: number, y: number, w: number, c: string, o: BowO = {}): string {
  const d = dark(c, 0.22);
  const tail = o.tails === 2 ? 'M-3 2 C-8 16 -13 30 -15 44 L-9 40 L-4 46 C-2 30 -1 16 2 2Z' : 'M-3 2 C-6 9 -9 15 -12 21 L-6 19 L-3 24 C-1 16 0 9 2 2Z';
  const loop = 'M0 0 C-6 -15 -27 -19 -27 -3 C-27 12 -8 11 0 0Z';
  let half = o.tails === 0 ? '' : P(tail, d) + P(tail, 'url(#g-shadeX)');
  half += P(loop, c, `stroke="${dark(c, 0.12)}" stroke-width="0.8"`) + P(loop, o.velvet ? 'url(#g-face)' : 'url(#g-shadeY)');
  half += P('M0 0 C-4 -7 -13 -9 -16 -3 C-16 2 -7 4 0 0Z', d, 'opacity="0.45"');
  half += P('M-3 -1 Q-12 -5 -21 -6 M-3 1 Q-12 3 -19 5', 'none', `stroke="${d}" stroke-width="1" stroke-linecap="round" opacity="0.35"`);
  if (o.dots) for (const [px, py, pr] of [[-19, -6, 2.4], [-11, -10, 1.9], [-13, 4, 2], [-23, 3, 1.8], [-6, -5, 1.4]]) half += circ(px, py, pr, o.dots, 'opacity="0.92"');
  half += P(o.satin ? 'M-22 -9 C-17 -15 -9 -13 -5 -6' : 'M-21 -8 C-17 -13 -11 -12 -7 -6', 'none',
    `stroke="${o.satin ? '#fff' : light(c, 0.5)}" stroke-width="${o.satin ? 3.2 : 2.4}" stroke-linecap="round" opacity="${o.satin ? 0.75 : o.velvet ? 0.35 : 0.8}"`);
  if (o.satin) half += P('M-24 2 Q-20 6 -14 6', 'none', 'stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.5"');
  if (o.glitter) half += sparkle(-18, -4, 2.8) + sparkle(-9, 4, 2) + sparkle(-23, -9, 1.7);
  let s = mirror(half);
  s += `<rect x="-6" y="-7.5" width="12" height="15" rx="5" fill="${o.knot ?? d}"/>` + ell(-1.8, -3, 2.2, 3, '#fff', 'opacity="0.45"');
  return grp(`translate(${f(x)} ${f(y)}) rotate(${f(o.rot ?? 0)}) scale(${(w / 27).toFixed(3)})`, s);
}

/** A pointed leaf of length len, starting at (x, y) and pointing at angle deg. */
const leaf = (x: number, y: number, len: number, deg: number, c = '#6fc47c') =>
  grp(`translate(${f(x)} ${f(y)}) rotate(${f(deg)})`, P(`M0 0 Q${f(len * 0.5)} ${f(-len * 0.38)} ${f(len)} 0 Q${f(len * 0.5)} ${f(len * 0.38)} 0 0Z`, c) +
    line(len * 0.1, 0, len * 0.8, 0, dark(c, 0.2), Math.max(0.8, len * 0.06), 0.6));

/** A cosy dome for hats: base corners at ±rx (head units) on height yb, top at height top. */
function domeD(p: Pt, rx: number, yb: number, top: number, sag = 0.08): string {
  const yc = (top - 0.25 * yb) / 0.75;
  return `M${p(-rx, yb)} C${p(-rx * 1.05, yc)} ${p(rx * 1.05, yc)} ${p(rx, yb)} Q${p(0, yb + sag)} ${p(-rx, yb)}Z`;
}
/** A gentle shadow a hat brim casts on the forehead. */
const brimShade = (R: number, hy: number, y: number, w = 0.85) => ell(0, hy + y * R, w * R, R * 0.07, '#3a1d3f', 'opacity="0.1"');

// ---------- catalog plumbing ----------

interface V {
  k: string;
  /** Name prefix, e.g. "Mint" in "Mint Pom Beanie". */
  n: string;
  c: string;
  /** Second color (ribbon, trim). */
  a?: string;
  /** Kind of decoration, gem, motif... (style specific). */
  o?: string;
  p?: Pattern;
  /** Motif picture. */
  m?: string;
  t?: Season[];
  name?: string;
  fixed?: boolean;
  price?: number;
}
interface Style {
  key: string;
  name: string;
  group: string;
  base: number;
  step?: number;
  max?: number;
  tags?: Season[];
  fixed?: boolean;
  vars: V[];
  draw: (x: WearCtx, R: number, hy: number, v: V) => string;
}

// ---------- bows ----------
const BOWS: Style[] = [
  {
    key: 'tinybows', name: 'Tiny Bows', group: 'Bows', base: 15,
    vars: [{ k: 'cherry', n: 'Cherry', c: '#e8384f' }, { k: 'sky', n: 'Sky', c: '#7cc8ff', o: 'dots' }],
    draw: (x, R, hy, v) => [-1, 1].map((s) => bow(s * R * 0.6, hy - R * 0.77, R * 0.17, x.c, { rot: s * 30, dots: v.o === 'dots' ? '#fff' : undefined })).join(''),
  },
  {
    key: 'doublebows', name: 'Double Bows', group: 'Bows', base: 15,
    vars: [{ k: 'lilac', n: 'Lilac', c: '#c99bff' }, { k: 'pink', n: 'Sparkle', c: '#ff7eb6', o: 'glitter' }],
    draw: (x, R, hy, v) => [-1, 1].map((s) => bow(s * R * 0.84, hy - R * 0.52, R * 0.26, x.c, { rot: s * 48, glitter: v.o === 'glitter' })).join(''),
  },
  {
    key: 'polkabow', name: 'Polka Dot Bow', group: 'Bows', base: 20,
    vars: [{ k: 'red', n: 'Red', c: '#e8384f' }, { k: 'navy', n: 'Navy', c: '#3f4f9a' }],
    draw: (x, R, hy) => bow(R * 0.06, hy - R * 1.02, R * 0.6, x.c, { rot: 5, dots: '#fff' }),
  },
  {
    key: 'satinbow', name: 'Satin Bow', group: 'Bows', base: 25,
    vars: [{ k: 'blush', n: 'Blush', c: '#ffb3c7' }, { k: 'lilac', n: 'Lilac', c: '#c99bff' }],
    draw: (x, R, hy) => bow(R * 0.58, hy - R * 0.82, R * 0.34, x.c, { rot: 24, satin: true, tails: 2 }),
  },
  {
    key: 'velvetbow', name: 'Velvet Bow', group: 'Bows', base: 30,
    vars: [{ k: 'ruby', n: 'Ruby', c: '#b8243f' }, { k: 'navy', n: 'Starry', c: '#33407f', o: 'glitter' }, { k: 'emerald', n: 'Emerald', c: '#2f8a62', t: ['winter'] }],
    draw: (x, R, hy, v) => {
      const bx = -R * 0.52, by = hy - R * 0.86;
      return bow(bx, by, R * 0.36, x.c, { rot: -22, velvet: true, knot: 'url(#g-gold)', glitter: v.o === 'glitter' }) + gem(bx, by, R * 0.04, '#fff3b0');
    },
  },
];

// ---------- headbands ----------
const HEADBANDS: Style[] = [
  {
    key: 'knotband', name: 'Knot Headband', group: 'Headbands', base: 15,
    vars: [{ k: 'pink', n: 'Pink', c: '#ff7eb6' }, { k: 'mint', n: 'Mint Dot', c: '#5fd3b5', p: 'dots' }, { k: 'sunny', n: 'Sunny', c: '#ffd36b', p: 'stripes' }],
    draw: (x, R, hy) => {
      const [kx, ky] = arcXY(R, hy, 254);
      const c = x.c;
      let s = band(R, hy, c, 0.16, { pattern: x.p });
      const lump = (dx: number, r: number) => ell(kx + dx * R, ky - R * 0.03, R * 0.15, R * 0.11, c, rot(r, kx + dx * R, ky - R * 0.03));
      s += lump(-0.1, -25) + lump(0.1, 25);
      if (x.p !== 'none') s += ell(kx - 0.1 * R, ky - R * 0.03, R * 0.15, R * 0.11, `url(#p-${x.p})`, rot(-25, kx - 0.1 * R, ky - R * 0.03)) + ell(kx + 0.1 * R, ky - R * 0.03, R * 0.15, R * 0.11, `url(#p-${x.p})`, rot(25, kx + 0.1 * R, ky - R * 0.03));
      s += ell(kx - 0.1 * R, ky - R * 0.03, R * 0.15, R * 0.11, 'url(#g-face)', rot(-25, kx - 0.1 * R, ky - R * 0.03)) + ell(kx + 0.1 * R, ky - R * 0.03, R * 0.15, R * 0.11, 'url(#g-face)', rot(25, kx + 0.1 * R, ky - R * 0.03));
      s += ell(kx, ky - R * 0.01, R * 0.075, R * 0.12, dark(c, 0.12)) + ell(kx, ky - R * 0.01, R * 0.075, R * 0.12, 'url(#g-shadeX)');
      s += P(`M${f(kx - R * 0.03)} ${f(ky - R * 0.1)} Q${f(kx + R * 0.02)} ${f(ky)} ${f(kx - R * 0.02)} ${f(ky + R * 0.09)}`, 'none', sk(dark(c, 0.3), R * 0.015, 'opacity="0.5"'));
      return s + ell(kx - R * 0.15, ky - R * 0.09, R * 0.04, R * 0.022, '#fff', `opacity="0.6" ${rot(-25, kx - R * 0.15, ky - R * 0.09)}`);
    },
  },
  {
    key: 'pearlband', name: 'Pearl Headband', group: 'Headbands', base: 30,
    vars: [{ k: 'blush', n: 'Blush', c: '#ffb3c7' }, { k: 'gold', n: 'Golden', c: '#ffd36b', o: 'gold' }],
    draw: (x, R, hy, v) => {
      let s = band(R, hy, v.o === 'gold' ? 'url(#g-gold)' : x.c, 0.075);
      for (let a = 196; a <= 344; a += 9.25) {
        const [px, py] = arcXY(R, hy, a);
        const big = Math.abs(a - 270) < 5;
        s += pearl(px, py - R * 0.01, R * (big ? 0.07 : 0.045));
      }
      return s;
    },
  },
  {
    key: 'glitterband', name: 'Glitter Headband', group: 'Headbands', base: 25,
    vars: [{ k: 'lilac', n: 'Lilac', c: '#c99bff' }, { k: 'rainbow', n: 'Rainbow', name: 'Rainbow Glitter Band', c: '#ff7eb6', o: 'rainbow', fixed: true }],
    draw: (x, R, hy, v) => {
      const rb = v.o === 'rainbow';
      let s = band(R, hy, rb ? 'url(#g-rainbow)' : x.c, 0.13, { edge: rb ? '#c99bff' : undefined });
      for (let i = 0; i < 26; i++) {
        const a = 194 + ((i * 0.618) % 1) * 152;
        const [px, py] = arcXY(R, hy, a, 1, 1, 0.02 + (((i * 0.37) % 1) - 0.5) * 0.06);
        s += circ(px, py - R * 0.01, R * (0.01 + (i % 3) * 0.005), i % 2 ? '#fff' : '#fff3b0', 'opacity="0.9"');
      }
      for (const a of [214, 250, 292, 326]) {
        const [px, py] = arcXY(R, hy, a);
        s += sparkle(px, py - R * 0.02, R * 0.05);
      }
      return s;
    },
  },
  {
    key: 'flowerband', name: 'Flower Headband', group: 'Headbands', base: 25, tags: ['spring'],
    vars: [{ k: 'pink', n: 'Pink', c: '#ff7eb6' }, { k: 'sky', n: 'Sky', c: '#7cc8ff' }],
    draw: (x, R, hy) => {
      let s = band(R, hy, '#fffaf5', 0.08, { edge: '#e6dcea' });
      const spots: [number, number, string][] = [[296, 0.13, x.c], [318, 0.1, '#fff'], [276, 0.09, light(x.c, 0.4)]];
      for (const [a] of spots) {
        const [px, py] = arcXY(R, hy, a + 9);
        s += leaf(px, py, R * 0.13, tangent(a + 9) - 40) + leaf(px, py, R * 0.11, tangent(a + 9) + 200);
      }
      for (const [a, r, c] of spots) {
        const [px, py] = arcXY(R, hy, a);
        s += flowerG(px, py, R * r, c, c === '#fff' ? x.c : '#ffd36b');
      }
      return s;
    },
  },
  {
    key: 'braidband', name: 'Braided Headband', group: 'Headbands', base: 20,
    vars: [{ k: 'straw', n: 'Straw', c: '#e2b56e' }, { k: 'pink', n: 'Pink', c: '#ff9ec7' }],
    draw: (x, R, hy) => {
      let s = band(R, hy, dark(x.c, 0.15), 0.1);
      for (let i = 0; i < 22; i++) {
        const a = 190 + i * 7.6;
        const [px, py] = arcXY(R, hy, a);
        const tg = tangent(a) + (i % 2 ? 32 : -32);
        s += ell(px, py - R * 0.01, R * 0.065, R * 0.04, i % 2 ? x.c : light(x.c, 0.12), `stroke="${dark(x.c, 0.2)}" stroke-width="${f(R * 0.008)}" ${rot(tg, px, py - R * 0.01)}`);
        s += ell(px - R * 0.015, py - R * 0.025, R * 0.025, R * 0.01, '#fff', `opacity="0.5" ${rot(tg, px, py - R * 0.01)}`);
      }
      return s;
    },
  },
];

// ---------- flower crowns ----------
function crownFlower(kind: string, x: number, y: number, r: number, c: string, out: number, i: number): string {
  switch (kind) {
    case 'daisy': {
      let s = '';
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * 360;
        const t = (a * Math.PI) / 180;
        s += ell(x + Math.cos(t) * r * 0.55, y + Math.sin(t) * r * 0.55, r * 0.46, r * 0.19, c, `stroke="#ece4ef" stroke-width="${f(r * 0.04)}" ${rot(a, x + Math.cos(t) * r * 0.55, y + Math.sin(t) * r * 0.55)}`);
      }
      return s + circ(x, y, r * 0.32, '#ffd24a') + circ(x, y, r * 0.32, 'url(#g-face)') + circ(x - r * 0.1, y - r * 0.1, r * 0.09, '#fff', 'opacity="0.7"');
    }
    case 'rose':
      return circ(x, y, r, dark(c, 0.18)) + circ(x - r * 0.05, y - r * 0.05, r * 0.84, c) +
        P(`M${f(x - r * 0.55)} ${f(y + r * 0.1)} Q${f(x - r * 0.1)} ${f(y - r * 0.7)} ${f(x + r * 0.5)} ${f(y - r * 0.05)} Q${f(x + r * 0.2)} ${f(y + r * 0.55)} ${f(x - r * 0.25)} ${f(y + r * 0.2)} Q${f(x - r * 0.15)} ${f(y - r * 0.28)} ${f(x + r * 0.16)} ${f(y - r * 0.02)}`, 'none', sk(dark(c, 0.3), r * 0.11, 'opacity="0.7"')) +
        circ(x - r * 0.35, y - r * 0.4, r * 0.14, '#fff', 'opacity="0.5"');
    case 'sunflower': {
      let s = '';
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * 360 + 15;
        const t = (a * Math.PI) / 180;
        const px = x + Math.cos(t) * r * 0.62, py = y + Math.sin(t) * r * 0.62;
        s += ell(px, py, r * 0.42, r * 0.16, c, `stroke="${dark(c, 0.15)}" stroke-width="${f(r * 0.04)}" ${rot(a, px, py)}`);
      }
      s += circ(x, y, r * 0.42, '#8a5a3c') + circ(x, y, r * 0.42, 'url(#g-face)');
      for (const [dx, dy] of [[-0.15, -0.12], [0.14, -0.1], [0, 0.08], [-0.16, 0.14], [0.17, 0.15]]) s += circ(x + dx * r, y + dy * r, r * 0.05, '#5a3a24');
      return s;
    }
    case 'lavender': {
      let s = line(x, y, x + Math.cos(out) * r * 1.5, y + Math.sin(out) * r * 1.5, '#5fae6b', r * 0.12);
      for (let k = 0; k < 6; k++) {
        const d = r * (0.35 + k * 0.22);
        const side = k % 2 ? 1 : -1;
        const px = x + Math.cos(out) * d + Math.cos(out + Math.PI / 2) * side * r * 0.12;
        const py = y + Math.sin(out) * d + Math.sin(out + Math.PI / 2) * side * r * 0.12;
        s += ell(px, py, r * 0.22, r * 0.14, k % 2 ? c : light(c, 0.2), rot((out * 180) / Math.PI + side * 30, px, py));
      }
      return s;
    }
    case 'berry': {
      let s = leaf(x, y, r * 1.1, (out * 180) / Math.PI - 60) + leaf(x, y, r * 1.0, (out * 180) / Math.PI + 70);
      for (const [dx, dy] of [[-0.35, 0.1], [0.35, 0.1], [0, -0.3]]) {
        const bx = x + dx * r, by = y + dy * r;
        s += circ(bx, by, r * 0.42, i % 2 ? c : dark(c, 0.15)) + circ(bx, by, r * 0.42, 'url(#g-face)') + circ(bx - r * 0.13, by - r * 0.14, r * 0.1, '#fff', 'opacity="0.8"');
      }
      return s;
    }
    case 'blossom': {
      const petal = `M0 0 C${f(-r * 0.5)} ${f(-r * 0.3)} ${f(-r * 0.45)} ${f(-r * 0.95)} ${f(-r * 0.14)} ${f(-r * 0.98)} L0 ${f(-r * 0.82)} L${f(r * 0.14)} ${f(-r * 0.98)} C${f(r * 0.45)} ${f(-r * 0.95)} ${f(r * 0.5)} ${f(-r * 0.3)} 0 0Z`;
      let s = '';
      for (let k = 0; k < 5; k++) s += grp(`translate(${f(x)} ${f(y)}) rotate(${k * 72 + i * 11})`, P(petal, c, `stroke="${dark(c, 0.12)}" stroke-width="${f(r * 0.04)}"`) + P(`M0 ${f(-r * 0.2)} L0 ${f(-r * 0.6)}`, 'none', sk(dark(c, 0.15), r * 0.05, 'opacity="0.5"')));
      return s + circ(x, y, r * 0.2, '#ff7eb6') + [0, 1, 2, 3, 4].map((k) => circ(x + Math.cos(k * 1.256) * r * 0.3, y + Math.sin(k * 1.256) * r * 0.3, r * 0.06, '#ffd36b')).join('');
    }
    case 'rainbow':
      return flowerG(x, y, r, ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff', '#ff9ec7'][i % 7], '#fff3b0');
    default:
      return flowerG(x, y, r * 0.8, c, '#ffe680') + (i % 2 ? flowerG(x + r * 0.6, y - r * 0.6, r * 0.5, light(c, 0.3), '#ffe680') : '');
  }
}

const FLOWER_CROWNS: Style[] = [
  {
    key: 'blooms', name: 'Crown', group: 'Flower Crowns', base: 25, step: 6, tags: ['spring'],
    vars: [
      { k: 'daisy', n: 'Daisy', c: '#ffffff', o: 'daisy' },
      { k: 'rose', n: 'Rose', c: '#ff4f7b', o: 'rose' },
      { k: 'sunflower', n: 'Sunflower', c: '#ffd24a', o: 'sunflower', t: ['summer'] },
      { k: 'lavender', n: 'Lavender', c: '#b28dff', o: 'lavender', t: ['summer'] },
      { k: 'berry', n: 'Berry', c: '#e8384f', o: 'berry', t: ['summer', 'fall'] },
      { k: 'blossom', n: 'Blossom', c: '#ffb3c7', o: 'blossom' },
      { k: 'forget', n: 'Forget-Me-Not', c: '#7cc8ff', o: 'forget' },
      { k: 'rainbow', n: 'Rainbow Flower', c: '#ff6f91', o: 'rainbow', fixed: true },
    ],
    draw: (x, R, hy, v) => {
      const kind = v.o ?? 'daisy';
      const d = topArc(R, hy, 1.0, 0.99, 0.0, 192, 348);
      let s = `<path d="${d}" ${sk('#4f9a5c', R * 0.05)}/><path d="${d}" ${sk('#7ccf86', R * 0.02)} transform="translate(0 ${f(-R * 0.012)})"/>`;
      for (let i = 0; i < 9; i++) {
        const a = 196 + (i + 0.5) * 16;
        const [px, py] = arcXY(R, hy, a, 1.0, 0.99, 0.0);
        s += leaf(px, py, R * 0.13, tangent(a) + (i % 2 ? -35 : 215), i % 2 ? '#6fc47c' : '#5fae6b');
      }
      const n = kind === 'forget' || kind === 'lavender' ? 9 : 7;
      for (let i = 0; i < n; i++) {
        const a = 200 + (i * 140) / (n - 1);
        const [px, py] = arcXY(R, hy, a, 1.0, 0.99, 0.0);
        const big = i === Math.floor(n / 2) || i === 1 || i === n - 2;
        const r = R * (kind === 'forget' ? 0.085 : kind === 'lavender' ? 0.12 : big ? 0.14 : 0.115);
        s += crownFlower(kind, px, py, r, x.c, (a * Math.PI) / 180, i);
      }
      return s;
    },
  },
];

// ---------- tiaras ----------
function tiara(R: number, hy: number, gold: boolean, gc: string, kind: string): string {
  const p = at(R, hy);
  const metal = gold ? 'url(#g-gold)' : 'url(#g-silver)';
  const edge = gold ? '#c98a1e' : '#9096ad';
  const right: [number, number][] = [[0, -1.3], [0.07, -1.06], [0.17, -1.15], [0.25, -1.0], [0.35, -1.05], [0.43, -0.94], [0.51, -0.93], [0.58, -0.8]];
  const top = [...right.slice().reverse(), ...right.slice(1).map(([a, b]) => [-a, b] as [number, number])];
  const d = `M${p(-0.58, -0.76)} Q${p(0, -0.99)} ${p(0.58, -0.76)} ${top.map(([a, b]) => `L${p(a, b)}`).join(' ')}Z`;
  let s = P(d, metal, `stroke="${edge}" stroke-width="${f(R * 0.014)}" stroke-linejoin="round"`);
  s += P(`M${p(-0.52, -0.82)} Q${p(0, -1.03)} ${p(0.52, -0.82)}`, 'none', sk(edge, R * 0.012, 'opacity="0.6"'));
  s += P(`M${p(-0.5, -0.79)} Q${p(0, -1.0)} ${p(0.5, -0.79)}`, 'none', sk('#fff', R * 0.012, 'opacity="0.7"'));
  for (const sd of [-1, 1]) {
    s += P(`M${p(sd * 0.09, -0.97)} q${f(sd * R * 0.07)} ${f(-R * 0.1)} ${f(sd * R * 0.14)} ${f(R * 0.02)}`, 'none', sk(edge, R * 0.012, 'opacity="0.55"'));
    s += P(`M${p(sd * 0.27, -0.92)} q${f(sd * R * 0.07)} ${f(-R * 0.08)} ${f(sd * R * 0.14)} ${f(R * 0.03)}`, 'none', sk(edge, R * 0.012, 'opacity="0.55"'));
  }
  const peaks: [number, number][] = [[-0.51, -0.93], [-0.35, -1.05], [-0.17, -1.15], [0.17, -1.15], [0.35, -1.05], [0.51, -0.93]];
  const side = kind === 'pearl' ? '#f7efe9' : gc;
  for (const sd of [-1, 1]) {
    s += kind === 'pearl' ? pearl(sd * R * 0.17, hy - R * 0.99, R * 0.04) + pearl(sd * R * 0.35, hy - R * 0.93, R * 0.032) : gem(sd * R * 0.17, hy - R * 0.99, R * 0.042, side) + gem(sd * R * 0.35, hy - R * 0.93, R * 0.032, kind === 'classic' ? light(gc, 0.35) : side);
  }
  for (const [a, b] of peaks) s += pearl(a * R, hy + b * R, R * (kind === 'pearl' ? 0.034 : 0.026));
  const cy = hy - R * 1.02;
  switch (kind) {
    case 'heart':
      s += pearl(0, hy - R * 1.3, R * 0.028) + heartGem(0, cy - R * 0.04, R * 0.19, gc);
      break;
    case 'star':
      s += starGem(0, cy - R * 0.08, R * 0.15, gc) + sparkle(R * 0.13, cy - R * 0.22, R * 0.05);
      break;
    case 'snow': {
      s += circ(0, cy - R * 0.05, R * 0.085, light(gc, 0.3)) + circ(0, cy - R * 0.05, R * 0.085, 'url(#g-face)');
      for (let k = 0; k < 6; k++) {
        const t = (k / 6) * Math.PI * 2 - Math.PI / 2;
        const ex = Math.cos(t) * R * 0.15, ey = cy - R * 0.05 + Math.sin(t) * R * 0.15;
        s += line(0, cy - R * 0.05, ex, ey, '#ffffff', R * 0.028) + circ(ex, ey, R * 0.02, '#fff');
      }
      s += gem(0, cy - R * 0.05, R * 0.05, gc);
      break;
    }
    case 'pearl':
      s += pearl(0, hy - R * 1.3, R * 0.034) + pearl(0, cy, R * 0.075);
      break;
    default:
      s += pearl(0, hy - R * 1.3, R * 0.03) + drop(0, cy + R * 0.02, R * 0.07, gc);
  }
  return s;
}
const TIARAS: Style[] = [
  {
    key: 'tiara', name: 'Tiara', group: 'Tiaras', base: 40, step: 10, max: 150,
    vars: [
      { k: 'ruby', n: 'Ruby', c: '#e8384f', a: 'gold' },
      { k: 'sapphire', n: 'Sapphire', c: '#4f9dff', a: 'silver' },
      { k: 'emerald', n: 'Emerald', c: '#3fbf8f', a: 'gold' },
      { k: 'amethyst', n: 'Amethyst', c: '#9b6bff', a: 'silver' },
      { k: 'heart', n: 'Sweetheart', c: '#ff4f8b', a: 'gold', o: 'heart' },
      { k: 'star', n: 'Starlight', c: '#ffd36b', a: 'silver', o: 'star' },
      { k: 'snow', n: 'Snowflake', c: '#7cc8ff', a: 'silver', o: 'snow', t: ['winter'] },
      { k: 'pearl', n: 'Pearl', c: '#ffb3c7', a: 'gold', o: 'pearl' },
    ],
    draw: (x, R, hy, v) => tiara(R, hy, v.a === 'gold', x.c, v.o ?? 'classic'),
  },
];

// ---------- crowns ----------
/** Crown outline: base at height yb (centre x0), half width hw, height h, n points. */
function crownD(p: Pt, x0: number, yb: number, hw: number, h: number, n: number): { d: string; tips: [number, number][] } {
  const tips: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    tips.push([x0 + u * hw * 1.1, yb - h * (1 - 0.16 * Math.abs(u))]);
  }
  let d = `M${p(x0 - hw, yb)} Q${p(x0, yb + 0.07)} ${p(x0 + hw, yb)} L${p(tips[n - 1][0], tips[n - 1][1])}`;
  for (let i = n - 1; i > 0; i--) d += ` Q${p((tips[i][0] + tips[i - 1][0]) / 2, yb - h * 0.3)} ${p(tips[i - 1][0], tips[i - 1][1])}`;
  return { d: d + 'Z', tips };
}
function crown(R: number, hy: number, kind: string, gc: string): string {
  const p = at(R, hy);
  const gold = kind !== 'silver';
  const metal = gold ? 'url(#g-gold)' : 'url(#g-silver)';
  const edge = gold ? '#c98a1e' : '#9096ad';
  const st = `stroke="${edge}" stroke-width="${f(R * 0.016)}" stroke-linejoin="round"`;
  const bandD = (x0: number, yb: number, hw: number) => `M${p(x0 - hw, yb)} Q${p(x0, yb + 0.07)} ${p(x0 + hw, yb)} L${p(x0 + hw * 1.02, yb - 0.15)} Q${p(x0, yb - 0.08)} ${p(x0 - hw * 1.02, yb - 0.15)}Z`;
  const body = (x0: number, yb: number, hw: number, h: number, n: number) => {
    const { d, tips } = crownD(p, x0, yb, hw, h, n);
    let s = P(d, metal, st) + P(d, 'url(#g-shadeX)') + P(bandD(x0, yb, hw), metal, st) + P(bandD(x0, yb, hw), 'url(#g-shadeY)');
    s += P(`M${p(x0 - hw * 0.9, yb - 0.2)} Q${p(x0, yb - 0.14)} ${p(x0 + hw * 0.9, yb - 0.2)}`, 'none', sk('#fff', R * 0.014, 'opacity="0.6"'));
    return { s, tips };
  };
  switch (kind) {
    case 'mini': {
      const { s, tips } = body(0, -0.88, 0.24, 0.3, 3);
      let t = s + tips.map(([a, b]) => pearl(a * R, hy + b * R, R * 0.035)).join('') + gem(0, hy - R * 0.96, R * 0.045, gc) + gem(-R * 0.14, hy - R * 0.95, R * 0.03, '#7cc8ff') + gem(R * 0.14, hy - R * 0.95, R * 0.03, '#7cc8ff');
      t = `<g ${rot(20, 0, hy - R * 0.88)} >${t}</g>`;
      return grp(`translate(${f(R * 0.46)} ${f(R * -0.06)})`, t) + sparkle(R * 0.78, hy - R * 1.22, R * 0.06);
    }
    case 'royal': {
      const p2 = p;
      let s = P(`M${p2(-0.58, -0.78)} C${p2(-0.62, -1.5)} ${p2(0.62, -1.5)} ${p2(0.58, -0.78)}Z`, gc) + P(`M${p2(-0.58, -0.78)} C${p2(-0.62, -1.5)} ${p2(0.62, -1.5)} ${p2(0.58, -0.78)}Z`, 'url(#g-face)');
      const b = body(0, -0.78, 0.6, 0.58, 5);
      s += b.s + b.tips.map(([a, c]) => pearl(a * R, hy + c * R, R * 0.045)).join('');
      s += gem(0, hy - R * 0.86, R * 0.06, '#e8384f') + gem(-R * 0.3, hy - R * 0.84, R * 0.045, '#4f9dff') + gem(R * 0.3, hy - R * 0.84, R * 0.045, '#3fbf8f');
      // ermine band
      s += P(`M${p2(-0.68, -0.62)} Q${p2(0, -0.5)} ${p2(0.68, -0.62)} L${p2(0.66, -0.8)} Q${p2(0, -0.7)} ${p2(-0.66, -0.8)}Z`, '#fffaf5', `stroke="#e6dcea" stroke-width="${f(R * 0.012)}"`);
      s += P(`M${p2(-0.68, -0.62)} Q${p2(0, -0.5)} ${p2(0.68, -0.62)} L${p2(0.66, -0.8)} Q${p2(0, -0.7)} ${p2(-0.66, -0.8)}Z`, 'url(#g-shadeY)');
      for (const u of [-0.5, -0.25, 0, 0.25, 0.5]) {
        const yy = -0.62 - 0.06 * (1 - u * u) - 0.05;
        s += P(`M${p2(u, yy - 0.04)} L${p2(u - 0.025, yy + 0.03)} L${p2(u + 0.025, yy + 0.03)}Z`, '#2d2a3a');
      }
      return s + circ(0, hy - R * 1.43, R * 0.07, 'url(#g-gold)', `stroke="${edge}" stroke-width="${f(R * 0.012)}"`) + line(0, hy - R * 1.5, 0, hy - R * 1.6, '#f0b232', R * 0.035) + line(-R * 0.045, hy - R * 1.555, R * 0.045, hy - R * 1.555, '#f0b232', R * 0.035);
    }
    case 'king': {
      let s = P(`M${p(-0.6, -0.78)} C${p(-0.64, -1.52)} ${p(0.64, -1.52)} ${p(0.6, -0.78)}Z`, gc) + P(`M${p(-0.6, -0.78)} C${p(-0.64, -1.52)} ${p(0.64, -1.52)} ${p(0.6, -0.78)}Z`, 'url(#g-face)');
      const b = body(0, -0.76, 0.64, 0.6, 5);
      s += b.s + b.tips.map(([a, c]) => circ(a * R, hy + c * R, R * 0.06, 'url(#g-gold)', `stroke="${edge}" stroke-width="${f(R * 0.012)}"`) + circ(a * R - R * 0.02, hy + c * R - R * 0.02, R * 0.018, '#fff')).join('');
      s += gem(0, hy - R * 0.84, R * 0.075, gc) + gem(-R * 0.34, hy - R * 0.81, R * 0.055, '#3fbf8f') + gem(R * 0.34, hy - R * 0.81, R * 0.055, '#3fbf8f');
      s += circ(-R * 0.17, hy - R * 0.83, R * 0.025, '#fff') + circ(R * 0.17, hy - R * 0.83, R * 0.025, '#fff');
      return s + circ(0, hy - R * 1.43, R * 0.07, 'url(#g-gold)', `stroke="${edge}" stroke-width="${f(R * 0.012)}"`) + line(0, hy - R * 1.5, 0, hy - R * 1.62, '#f0b232', R * 0.04) + line(-R * 0.05, hy - R * 1.565, R * 0.05, hy - R * 1.565, '#f0b232', R * 0.04);
    }
    case 'silver': {
      const { s, tips } = body(0, -0.8, 0.5, 0.48, 3);
      return s + tips.map(([a, b]) => circ(a * R, hy + b * R, R * 0.06, 'url(#g-silver)', `stroke="${edge}" stroke-width="${f(R * 0.012)}"`) + circ(a * R - R * 0.02, hy + b * R - R * 0.02, R * 0.018, '#fff')).join('') +
        gem(0, hy - R * 0.87, R * 0.06, gc) + gem(-R * 0.3, hy - R * 0.84, R * 0.04, light(gc, 0.3)) + gem(R * 0.3, hy - R * 0.84, R * 0.04, light(gc, 0.3)) + drop(0, hy - R * 1.08, R * 0.06, gc);
    }
    case 'star': {
      const { s, tips } = body(0, -0.8, 0.52, 0.42, 5);
      return s + tips.map(([a, b], i) => starGem(a * R, hy + b * R - R * 0.04, R * (i === 2 ? 0.11 : 0.075), i === 2 ? gc : '#fff3b0')).join('') +
        [-0.3, 0, 0.3].map((u) => gem(u * R, hy - R * (0.86 - Math.abs(u) * 0.08), R * 0.04, u ? '#c99bff' : gc)).join('') + sparkle(R * 0.6, hy - R * 1.28, R * 0.06);
    }
    case 'heart': {
      const { s, tips } = body(0, -0.8, 0.5, 0.45, 3);
      return s + P(crownD(p, 0, -0.8, 0.5, 0.45, 3).d, '#ff9ec7', 'opacity="0.22"') + tips.map(([a, b], i) => heartGem(a * R, hy + b * R - R * 0.03, R * (i === 1 ? 0.15 : 0.11), gc)).join('') +
        [-0.3, 0, 0.3].map((u) => gem(u * R, hy - R * (0.86 - Math.abs(u) * 0.08), R * 0.038, u ? '#fff' : gc)).join('');
    }
    default: {
      // rainbow
      const { s, tips } = body(0, -0.8, 0.56, 0.5, 5);
      const cs = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
      return s + tips.map(([a, b], i) => drop(a * R, hy + b * R + R * 0.05, R * 0.045, cs[i])).join('') +
        [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((u, i) => gem(u * R, hy - R * (0.87 - Math.abs(u) * 0.1), R * 0.035, cs[i])).join('');
    }
  }
}
const CROWNS: Style[] = [
  {
    key: 'crown', name: 'Crown', group: 'Crowns', base: 80, step: 30, max: 200,
    vars: [
      { k: 'mini', n: 'Mini Party', c: '#ff4f8b', o: 'mini' },
      { k: 'silver', n: 'Silver Snow', c: '#4f9dff', o: 'silver' },
      { k: 'heart', n: 'Sweetheart', c: '#ff4f8b', o: 'heart' },
      { k: 'star', n: 'Shooting Star', c: '#ffd36b', o: 'star' },
      { k: 'rainbow', n: 'Rainbow Gem', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'kingblue', n: 'Blue King', c: '#2f4fbf', o: 'king' },
      { k: 'kingred', n: 'Red King', c: '#d12a3a', o: 'king' },
      { k: 'royal', n: 'Royal Velvet', c: '#b8243f', o: 'royal', price: 200 },
    ],
    draw: (x, R, hy, v) => crown(R, hy, v.o ?? 'mini', x.c),
  },
];

// ---------- beanies & ear warmers ----------
const BEANIE = { rx: 1.07, yb: -0.18, ry: 0.95 };
const beanieW = (y: number) => BEANIE.rx * Math.sqrt(Math.max(0, 1 - ((BEANIE.yb - y) / BEANIE.ry) ** 2)) * 0.985;
function beanie(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const dome = `M${p(-BEANIE.rx, BEANIE.yb)} A${f(BEANIE.rx * R)} ${f(BEANIE.ry * R)} 0 0 1 ${p(BEANIE.rx, BEANIE.yb)}Z`;
  let s = '';
  if (v.o === 'kitty') {
    for (const sd of [-1, 1]) {
      s += P(`M${p(sd * 0.3, -1.06)} L${p(sd * 0.7, -1.42)} Q${p(sd * 0.84, -1.5)} ${p(sd * 0.86, -1.34)} L${p(sd * 0.9, -0.76)}Z`, dark(c, 0.06), `stroke="${dark(c, 0.15)}" stroke-width="${f(R * 0.012)}" stroke-linejoin="round"`);
      s += P(`M${p(sd * 0.45, -1.06)} L${p(sd * 0.72, -1.3)} Q${p(sd * 0.78, -1.32)} ${p(sd * 0.79, -1.24)} L${p(sd * 0.8, -0.96)}Z`, '#ff9ec7');
    }
  }
  s += cloth(dome, c, x.p, 'x');
  for (let i = -4; i <= 4; i++) s += P(`M${p(i * 0.2, -0.48)} Q${p(i * 0.22, -0.8)} ${p(i * 0.12, -1.06 + Math.abs(i) * 0.04)}`, 'none', sk(dark(c, 0.14), R * 0.026, 'opacity="0.35"'));
  if (v.o === 'stripes') {
    for (const [y1, y2] of [[-0.6, -0.72], [-0.84, -0.96]] as [number, number][]) {
      const w1 = beanieW(y1), w2 = beanieW(y2);
      s += P(`M${p(-w1, y1)} Q${p(0, y1 + 0.07)} ${p(w1, y1)} L${p(w2, y2)} Q${p(0, y2 + 0.07)} ${p(-w2, y2)}Z`, v.a ?? '#fff');
    }
  }
  if (v.o === 'patch') s += patch('snowflake', R * 0.42, hy - R * 0.74, R * 0.17, '#3f4f9a');
  if (v.o === 'heart') s += P(heartD(R * 0.4, hy - R * 0.94, R * 0.3), v.a ?? '#ff4f8b', `stroke="#fff" stroke-width="${f(R * 0.02)}" stroke-dasharray="${f(R * 0.03)} ${f(R * 0.025)}"`);
  // ribbed cuff
  const cuff = `M${p(-1.1, -0.46)} Q${p(0, -0.6)} ${p(1.1, -0.46)} L${p(1.09, -0.13)} Q${p(0, -0.36)} ${p(-1.09, -0.13)}Z`;
  s += P(cuff, dark(c, 0.08)) + P(cuff, 'url(#g-shadeX)');
  for (let i = -9; i <= 9; i++) {
    const u = i / 9.6;
    const yt = -0.46 - 0.14 * (1 - u * u) + 0.02, ybt = -0.13 - 0.23 * (1 - u * u) - 0.02;
    s += line(u * 1.08 * R, hy + yt * R, u * 1.07 * R, hy + ybt * R, dark(c, 0.22), R * 0.022, 0.4);
  }
  s += P(`M${p(-1.02, -0.47)} Q${p(0, -0.6)} ${p(1.02, -0.47)}`, 'none', sk(light(c, 0.35), R * 0.02, 'opacity="0.6"'));
  if (v.o === 'pom' || v.o === 'stripes' || v.o === 'patch' || v.o === 'heart') s += pom(0, hy - R * 1.13, R * 0.24, v.o === 'stripes' ? v.a ?? '#fff' : '#fffaf5');
  if (v.o === 'double') s += pom(-R * 0.56, hy - R * 0.98, R * 0.2, '#fffaf5') + pom(R * 0.56, hy - R * 0.98, R * 0.2, light(c, 0.55));
  return s;
}
const BEANIES: Style[] = [
  {
    key: 'beanie', name: 'Beanie', group: 'Beanies', base: 20, tags: ['winter', 'fall'],
    vars: [
      { k: 'mint', n: 'Mint Pom', c: '#5fd3b5', o: 'pom' },
      { k: 'navy', n: 'Navy Cuff', c: '#3f4f9a', o: 'plain' },
      { k: 'lilac', n: 'Lilac Pom', c: '#c99bff', o: 'pom' },
      { k: 'candy', n: 'Candy Stripe', c: '#e8384f', a: '#fffaf5', o: 'stripes' },
      { k: 'starry', n: 'Starry Stripe', c: '#3f4f9a', a: '#ffd36b', o: 'stripes' },
      { k: 'orange', n: 'Orange Cuff', c: '#ff8a3d', o: 'plain' },
      { k: 'charcoal', n: 'Charcoal Stripe', c: '#4a4a5e', a: '#e8384f', o: 'stripes' },
      { k: 'kitty', n: 'Kitty', c: '#ffb3c7', o: 'kitty' },
      { k: 'kittygrey', n: 'Grey Kitty', c: '#9aa3b5', o: 'kitty' },
      { k: 'double', n: 'Double Pom', c: '#ff7eb6', o: 'double' },
      { k: 'snow', n: 'Snowflake', c: '#7cc8ff', o: 'patch' },
      { k: 'heart', n: 'Sweetheart', c: '#f4ead9', a: '#ff4f8b', o: 'heart' },
    ],
    draw: beanie,
  },
];

function muffs(x: WearCtx, R: number, hy: number, v: V): string {
  const c = x.c;
  let s = `<path d="${topArc(R, hy, 1.03, 1.02, 0.08, 182, 358)}" ${sk(v.a ?? dark(c, 0.25), R * 0.08)}/>` +
    `<path d="${topArc(R, hy, 1.03, 1.02, 0.07, 215, 262)}" ${sk('#fff', R * 0.018, 'opacity="0.55"')}/>`;
  for (const sd of [-1, 1]) {
    const mx = sd * R * 0.98, my = hy + R * 0.14;
    if (v.o === 'heart') {
      s += P(heartD(mx, my - R * 0.24, R * 0.46), c, `stroke="${dark(c, 0.2)}" stroke-width="${f(R * 0.02)}"`) + P(heartD(mx, my - R * 0.24, R * 0.46), 'url(#g-face)');
      s += P(heartD(mx, my - R * 0.15, R * 0.28), light(c, 0.35), 'opacity="0.6"') + circ(mx - R * 0.1, my - R * 0.12, R * 0.04, '#fff', 'opacity="0.7"');
    } else s += pom(mx, my, R * 0.3, c);
  }
  return s;
}
function knitWarmer(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const d = `M${p(-1.1, -0.2)} Q${p(0, -0.98)} ${p(1.1, -0.2)} L${p(1.08, 0.34)} Q${p(0.96, 0.44)} ${p(0.86, 0.3)} Q${p(0, -0.82)} ${p(-0.86, 0.3)} Q${p(-0.96, 0.44)} ${p(-1.08, 0.34)}Z`;
  let s = cloth(d, c, x.p, 'y');
  for (let i = -6; i <= 6; i++) {
    const u = i / 6.5;
    s += P(`M${p(u * 1.0, -0.62 + Math.abs(u) * 0.38 - 0.02)} L${p(u * 0.9, -0.36 + Math.abs(u) * 0.52)}`, 'none', sk(dark(c, 0.2), R * 0.022, 'opacity="0.35"'));
  }
  // twist at the front
  s += P(`M${p(-0.2, -0.62)} Q${p(0, -0.5)} ${p(0.2, -0.62)} L${p(0.16, -0.35)} Q${p(0, -0.44)} ${p(-0.16, -0.35)}Z`, dark(c, 0.12));
  s += P(`M${p(-0.16, -0.62)} Q${p(0.08, -0.52)} ${p(0.12, -0.35)} M${p(0.16, -0.63)} Q${p(-0.06, -0.48)} ${p(-0.12, -0.36)}`, 'none', sk(dark(c, 0.3), R * 0.02, 'opacity="0.5"'));
  return s + P(`M${p(-0.8, -0.5)} Q${p(-0.4, -0.72)} ${p(-0.25, -0.72)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.4"'));
}
const EAR_WARMERS: Style[] = [
  {
    key: 'fluffmuffs', name: 'Fluffy Earmuffs', group: 'Ear Warmers', base: 20, tags: ['winter'],
    vars: [{ k: 'snow', n: 'Snowy', c: '#fffaf5', a: '#ff9ec7' }, { k: 'lilac', n: 'Lilac', c: '#d9c2ff', a: '#9b6bff' }],
    draw: muffs,
  },
  { key: 'heartmuffs', name: 'Heart Earmuffs', group: 'Ear Warmers', base: 25, tags: ['winter'], vars: [{ k: 'pink', n: 'Pink', c: '#ff7eb6', a: '#fff' }], draw: (x, R, hy, v) => muffs(x, R, hy, { ...v, o: 'heart' }) },
  {
    key: 'knitwarmer', name: 'Knit Ear Warmer', group: 'Ear Warmers', base: 20, tags: ['winter', 'fall'],
    vars: [{ k: 'cherry', n: 'Cherry', c: '#e8384f' }, { k: 'cream', n: 'Cream', c: '#f4ead9' }],
    draw: knitWarmer,
  },
];

// ---------- sun hats & bucket hats ----------
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  const mid = (i: number) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let d = `M${f(mid(n - 1)[0])} ${f(mid(n - 1)[1])}`;
  for (let i = 0; i < n; i++) d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mid(i)[0])} ${f(mid(i)[1])}`;
  return d + 'Z';
}
function sunHat(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const cy = hy - R * 0.52;
  const pts: [number, number][] = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const w = 1 + 0.035 * Math.sin(t * 7);
    pts.push([Math.cos(t) * R * 1.62 * w, cy + Math.sin(t) * R * 0.32 * w]);
  }
  const brim = smoothClosed(pts);
  let s = brimShade(R, hy, -0.17, 1.0) + P(brim, c, `stroke="${dark(c, 0.12)}" stroke-width="${f(R * 0.012)}"`) + P(brim, 'url(#g-shadeY)');
  const straw = v.o !== 'bow';
  if (straw) for (const k of [0.45, 0.65, 0.85]) s += ell(0, cy + R * 0.02, R * 1.62 * k, R * 0.32 * k, 'none', `stroke="${dark(c, 0.18)}" stroke-width="${f(R * 0.012)}" stroke-dasharray="${f(R * 0.05)} ${f(R * 0.04)}" opacity="0.5"`);
  const crownD = `M${p(-0.78, -0.52)} C${p(-0.82, -1.46)} ${p(0.82, -1.46)} ${p(0.78, -0.52)} Q${p(0, -0.44)} ${p(-0.78, -0.52)}Z`;
  s += cloth(crownD, c, x.p, 'x');
  if (straw) for (let i = -3; i <= 3; i++) s += P(`M${p(i * 0.2, -0.62)} Q${p(i * 0.24, -0.95)} ${p(i * 0.1, -1.18)}`, 'none', sk(dark(c, 0.16), R * 0.012, `stroke-dasharray="${f(R * 0.04)} ${f(R * 0.03)}" opacity="0.5"`));
  const a = v.a ?? '#ff7eb6';
  s += P(`M${p(-0.79, -0.56)} Q${p(0, -0.46)} ${p(0.79, -0.56)} L${p(0.77, -0.72)} Q${p(0, -0.62)} ${p(-0.77, -0.72)}Z`, a) + P(`M${p(-0.79, -0.56)} Q${p(0, -0.46)} ${p(0.79, -0.56)} L${p(0.77, -0.72)} Q${p(0, -0.62)} ${p(-0.77, -0.72)}Z`, 'url(#g-shadeX)');
  const fx = R * 0.6, fy = hy - R * 0.66;
  switch (v.o) {
    case 'cherry':
      s += leaf(fx - R * 0.02, fy - R * 0.14, R * 0.18, -50) + P(`M${f(fx - R * 0.1)} ${f(fy + R * 0.08)} Q${f(fx - R * 0.06)} ${f(fy - R * 0.12)} ${f(fx)} ${f(fy - R * 0.16)} M${f(fx + R * 0.1)} ${f(fy + R * 0.1)} Q${f(fx + R * 0.06)} ${f(fy - R * 0.1)} ${f(fx)} ${f(fy - R * 0.16)}`, 'none', sk('#5f8f3a', R * 0.025));
      for (const dx of [-0.1, 0.1]) s += circ(fx + dx * R, fy + R * 0.1, R * 0.09, '#e8384f') + circ(fx + dx * R, fy + R * 0.1, R * 0.09, 'url(#g-face)') + circ(fx + dx * R - R * 0.03, fy + R * 0.07, R * 0.025, '#fff', 'opacity="0.8"');
      break;
    case 'sunflower':
      s += leaf(fx, fy, R * 0.2, 200) + crownFlower('sunflower', fx, fy, R * 0.17, '#ffd24a', 0, 0);
      break;
    case 'bow':
      s += bow(fx + R * 0.1, fy, R * 0.26, a, { rot: 10, tails: 2 });
      break;
    case 'lavender':
      for (const [dx, an] of [[-0.06, -2.0], [0.04, -1.6], [0.12, -1.2]]) s += crownFlower('lavender', fx + dx * R, fy + R * 0.04, R * 0.08, '#b28dff', an, 0);
      s += bow(fx + R * 0.04, fy + R * 0.04, R * 0.1, a);
      break;
    default:
      s += leaf(fx - R * 0.05, fy, R * 0.18, 150) + flowerG(fx, fy - R * 0.02, R * 0.13, '#fff', '#ffd24a') + flowerG(fx + R * 0.17, fy + R * 0.03, R * 0.09, '#ffb3c7', '#ffd24a');
  }
  return s;
}
const SUN_HATS: Style[] = [
  {
    key: 'sunhat', name: 'Sun Hat', group: 'Sun Hats', base: 25, tags: ['summer'],
    vars: [
      { k: 'daisy', n: 'Daisy Straw', c: '#f2d79a', a: '#ff7eb6', o: 'daisy' },
      { k: 'cherry', n: 'Cherry', c: '#fffaf5', a: '#e8384f', o: 'cherry' },
      { k: 'sunflower', n: 'Sunflower', c: '#f6e3b0', a: '#5fae6b', o: 'sunflower' },
      { k: 'bow', n: 'Pink Bow', c: '#ffb3c7', a: '#fffaf5', o: 'bow' },
      { k: 'lavender', n: 'Lavender', c: '#e6d4ff', a: '#9b6bff', o: 'lavender' },
    ],
    draw: sunHat,
  },
];

function bucketHat(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const crownD = `M${p(-0.84, -0.5)} C${p(-0.86, -1.3)} ${p(0.86, -1.3)} ${p(0.84, -0.5)} Q${p(0, -0.42)} ${p(-0.84, -0.5)}Z`;
  const brimD = `M${p(-0.86, -0.54)} Q${p(0, -0.66)} ${p(0.86, -0.54)} L${p(1.16, -0.2)} Q${p(0, -0.4)} ${p(-1.16, -0.2)}Z`;
  let s = brimShade(R, hy, -0.16, 0.9) + cloth(crownD, c, x.p, 'x');
  s += P(`M${p(-0.6, -0.86)} Q${p(0, -1.02)} ${p(0.6, -0.86)}`, 'none', sk(dark(c, 0.2), R * 0.014, `stroke-dasharray="${f(R * 0.035)} ${f(R * 0.025)}" opacity="0.6"`));
  s += cloth(brimD, dark(c, 0.06), x.p, 'y') + P(brimD, 'none', `stroke="${dark(c, 0.2)}" stroke-width="${f(R * 0.012)}"`);
  for (const k of [0.3, 0.62]) s += P(`M${p(-0.86 - 0.3 * k, -0.54 + 0.34 * k)} Q${p(0, -0.66 + 0.26 * k)} ${p(0.86 + 0.3 * k, -0.54 + 0.34 * k)}`, 'none', sk(light(c, 0.45), R * 0.014, `stroke-dasharray="${f(R * 0.035)} ${f(R * 0.025)}" opacity="0.8"`));
  if (v.o) s += patch(v.o, R * 0.34, hy - R * 0.78, R * 0.19, '#ffffff');
  return s;
}
const BUCKET_HATS: Style[] = [
  {
    key: 'bucket', name: 'Bucket Hat', group: 'Bucket Hats', base: 20, tags: ['summer', 'spring'],
    vars: [
      { k: 'mint', n: 'Daisy', c: '#a8e6cf', o: 'daisy' },
      { k: 'check', n: 'Lemon Check', c: '#ffe680', p: 'check' },
      { k: 'hearts', n: 'Heart', c: '#ffb3c7', p: 'hearts' },
      { k: 'denim', n: 'Denim Star', c: '#7aa6e8', o: 'star' },
      { k: 'berry', n: 'Strawberry', c: '#fffaf5', o: 'strawberry', p: 'dots' },
      { k: 'charcoal', n: 'Lightning', c: '#4a4a5e', o: 'bolt' },
      { k: 'navy', n: 'Fishing', c: '#3f4f9a', o: 'fish' },
    ],
    draw: bucketHat,
  },
];

// ---------- caps & berets ----------
const motifAt = (id: string, x: number, y: number, r: number, deg = 0) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${deg}) scale(${(r / 20).toFixed(3)})">${MOTIF_BY_ID[id]?.draw() ?? ''}</g>`;
function cap(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const kind = v.o ?? 'cap';
  let s = '';
  // backwards: the bill peeks out behind the crown
  if (kind === 'back') s += ell(R * 0.1, hy - R * 1.12, R * 0.66, R * 0.12, dark(c, 0.2), rot(-6, R * 0.1, hy - R * 1.12));
  const crownD = `M${p(-0.98, -0.4)} C${p(-1.03, -1.33)} ${p(1.03, -1.33)} ${p(0.98, -0.4)} Q${p(0, -0.5)} ${p(-0.98, -0.4)}Z`;
  s += cloth(crownD, c, x.p, 'x');
  if (kind === 'trucker') {
    // foam front panel, mesh at the sides
    for (const sd of [-1, 1]) for (let i = 0; i < 14; i++) {
      const u = 0.5 + ((i * 0.618) % 1) * 0.42, w = -0.5 - ((i * 0.7548) % 1) * 0.55 * (1 - (u - 0.5));
      s += circ(sd * u * R, hy + w * R, R * 0.018, dark(c, 0.3), 'opacity="0.55"');
    }
    s += P(`M${p(-0.5, -0.47)} C${p(-0.54, -1.18)} ${p(0.54, -1.18)} ${p(0.5, -0.47)} Q${p(0, -0.52)} ${p(-0.5, -0.47)}Z`, v.a ?? '#fffaf5') + P(`M${p(-0.5, -0.47)} C${p(-0.54, -1.18)} ${p(0.54, -1.18)} ${p(0.5, -0.47)}Z`, 'url(#g-shadeX)');
  } else if (v.a) s += P(`M${p(-0.34, -0.48)} C${p(-0.36, -1.05)} ${p(0.36, -1.05)} ${p(0.34, -0.48)}Z`, v.a, 'opacity="0.9"');
  for (const u of [-0.55, 0, 0.55]) s += P(`M${p(0, -1.08)} Q${p(u * 1.1, -0.9)} ${p(u, -0.48)}`, 'none', sk(dark(c, 0.2), R * 0.014, 'opacity="0.45"'));
  s += circ(0, hy - R * 1.08, R * 0.055, dark(c, 0.18)) + circ(-R * 0.015, hy - R * 1.095, R * 0.018, '#fff', 'opacity="0.6"');
  if (kind === 'back') {
    // the snap strap and opening at the front
    const hole = `M${p(-0.3, -0.44)} Q${p(-0.3, -0.74)} ${p(0, -0.76)} Q${p(0.3, -0.74)} ${p(0.3, -0.44)}Z`;
    s += P(hole, x.p === 'none' ? dark(c, 0.35) : dark(c, 0.35), 'opacity="0.55"') + P(`M${p(-0.3, -0.5)} Q${p(0, -0.56)} ${p(0.3, -0.5)}`, 'none', sk(dark(c, 0.15), R * 0.07));
    for (const u of [-0.16, 0, 0.16]) s += circ(u * R, hy - R * 0.52, R * 0.022, '#fff', 'opacity="0.7"');
    s += P(`M${p(-0.98, -0.42)} Q${p(0, -0.52)} ${p(0.98, -0.42)}`, 'none', sk(dark(c, 0.2), R * 0.04));
    if (v.m) s += motifAt(v.m, R * 0.58, hy - R * 0.78, R * 0.13, 10);
    return s;
  }
  if (v.m) s += kind === 'cap' ? motifAt(v.m, 0, hy - R * 0.76, R * 0.2) : patch(v.m, 0, hy - R * 0.8, R * 0.21, kind === 'trucker' ? '#ffffff' : light(c, 0.7));
  const bill = kind === 'snap'
    ? `M${p(-0.96, -0.42)} Q${p(0, -0.56)} ${p(0.96, -0.42)} L${p(0.98, -0.3)} Q${p(0, -0.36)} ${p(-0.98, -0.3)}Z`
    : `M${p(-0.92, -0.44)} Q${p(0, -0.58)} ${p(0.92, -0.44)} Q${p(0.84, -0.14)} ${p(0, -0.12)} Q${p(-0.84, -0.14)} ${p(-0.92, -0.44)}Z`;
  s += brimShade(R, hy, kind === 'snap' ? -0.22 : -0.08, 0.7) + P(bill, dark(c, 0.15)) + P(bill, 'url(#g-shadeY)');
  if (kind === 'snap') s += P(`M${p(-0.9, -0.34)} Q${p(0, -0.4)} ${p(0.9, -0.34)}`, 'none', sk(light(c, 0.3), R * 0.012, `stroke-dasharray="${f(R * 0.035)} ${f(R * 0.025)}" opacity="0.7"`));
  else s += P(`M${p(-0.8, -0.38)} Q${p(0, -0.18)} ${p(0.8, -0.38)}`, 'none', sk(light(c, 0.35), R * 0.014, `stroke-dasharray="${f(R * 0.035)} ${f(R * 0.025)}" opacity="0.7"`));
  return s;
}
const CAPS: Style[] = [
  {
    key: 'cap', name: 'Cap', group: 'Caps', base: 15, step: 4, tags: ['summer'],
    vars: [
      { k: 'star', n: 'Red Star', c: '#e8384f', m: 'star' },
      { k: 'cherry', n: 'Bubblegum', c: '#ff7eb6', m: 'cherry' },
      { k: 'back', n: 'Backwards', c: '#4f9dff', o: 'back', m: 'bolt' },
      { k: 'paw', n: 'Mint Paw', c: '#5fd3b5', m: 'paw' },
      { k: 'dino', n: 'Dino Snapback', name: 'Dino Snapback', c: '#3fbf8f', o: 'snap', m: 'dino' },
      { k: 'bolt', n: 'Lightning', c: '#3f4f9a', m: 'bolt' },
      { k: 'backred', n: 'Red Backwards', c: '#e8384f', o: 'back' },
      { k: 'planet', n: 'Space Snapback', name: 'Space Snapback', c: '#2d2a3a', o: 'snap', m: 'planet' },
      { k: 'trucker', n: 'Trucker', c: '#4f9dff', a: '#fffaf5', o: 'trucker', m: 'sun' },
      { k: 'smiley', n: 'Smiley', c: '#ffd36b', a: '#fffaf5', m: 'smiley' },
      { k: 'truckerfish', n: 'Fishing Trucker', name: 'Fishing Trucker Cap', c: '#3fbf8f', a: '#fffaf5', o: 'trucker', m: 'fish' },
    ],
    draw: cap,
  },
];

function beret(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const d = `M${p(-1.0, -0.52)} C${p(-1.26, -1.28)} ${p(0.96, -1.54)} ${p(1.22, -0.78)} Q${p(1.26, -0.56)} ${p(0.92, -0.52)} Q${p(0, -0.42)} ${p(-1.0, -0.52)}Z`;
  let s = cloth(d, c, x.p, 'y');
  for (const [a, b] of [[-0.5, -1.0], [0.1, -1.2], [0.7, -1.04]]) s += P(`M${p(0.08, -1.26)} Q${p((a + 0.08) / 2, -1.1)} ${p(a, b + 0.35)}`, 'none', sk(dark(c, 0.15), R * 0.016, 'opacity="0.3"'));
  s += P(`M${p(-0.98, -0.5)} Q${p(0, -0.4)} ${p(0.94, -0.52)}`, 'none', sk(dark(c, 0.22), R * 0.07));
  s += P(`M${p(-0.6, -0.96)} Q${p(-0.3, -1.2)} ${p(0.1, -1.24)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.3"'));
  s += line(R * 0.08, hy - R * 1.26, R * 0.14, hy - R * 1.38, dark(c, 0.2), R * 0.05);
  if (v.o) s += motifAt(v.o, R * 0.66, hy - R * 0.8, R * 0.15, 12);
  return s;
}
const BERETS: Style[] = [
  {
    key: 'beret', name: 'Beret', group: 'Berets', base: 20, tags: ['fall'],
    vars: [
      { k: 'navy', n: 'Navy Star', c: '#3f4f9a', o: 'star' },
      { k: 'cream', n: 'Cherry', c: '#f4ead9', o: 'cherry' },
      { k: 'lilac', n: 'Lilac Daisy', c: '#c99bff', o: 'daisy' },
      { k: 'black', n: 'Midnight', c: '#2d2a3a', o: 'heart' },
      { k: 'mint', n: 'Mint Berry', c: '#a8e6cf', o: 'strawberry' },
    ],
    draw: beret,
  },
];

// ---------- dress-up hats ----------
function partyHat(x: WearCtx, R: number, hy: number, v: V): string {
  const c = x.c;
  const bx = R * 0.02, by = hy - R * 0.88, ax = R * 0.12, ay = hy - R * 1.6, hw = R * 0.36;
  const lerp = (t: number, sd: number): [number, number] => [bx + sd * hw + (ax - bx - sd * hw) * t, by + (ay - by) * t];
  const cone = `M${f(bx - hw)} ${f(by)} L${f(ax)} ${f(ay)} L${f(bx + hw)} ${f(by)} Q${f(bx)} ${f(by + R * 0.08)} ${f(bx - hw)} ${f(by)}Z`;
  let s = P(cone, c) + P(cone, 'url(#g-shadeX)');
  if (v.o === 'stripes') {
    for (const [t1, t2] of [[0.12, 0.25], [0.4, 0.53], [0.68, 0.8]]) {
      const [l1x, l1y] = lerp(t1, -1), [r1x, r1y] = lerp(t1, 1), [l2x, l2y] = lerp(t2, -1), [r2x, r2y] = lerp(t2, 1);
      s += P(`M${f(l1x)} ${f(l1y)} Q${f((l1x + r1x) / 2)} ${f(l1y + R * 0.06 * (1 - t1))} ${f(r1x)} ${f(r1y)} L${f(r2x)} ${f(r2y)} Q${f((l2x + r2x) / 2)} ${f(l2y + R * 0.06 * (1 - t2))} ${f(l2x)} ${f(l2y)}Z`, v.a ?? '#fff');
    }
  } else {
    const cs = ['#ffd36b', '#ff7eb6', '#fff', '#5fd3b5', '#9b6bff'];
    for (let i = 0; i < 12; i++) {
      const t = 0.08 + ((i * 0.618) % 1) * 0.72;
      const u = ((i * 0.7548) % 1) * 1.4 - 0.7;
      const [lx, ly] = lerp(t, -1), [rx] = lerp(t, 1);
      s += circ((lx + rx) / 2 + u * (rx - lx) * 0.5, ly + R * 0.02, R * 0.032, cs[i % cs.length]);
    }
  }
  s += P(`M${f(bx - hw * 0.5)} ${f(by - R * 0.12)} L${f(ax - R * 0.03)} ${f(ay + R * 0.1)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.35"'));
  // fluffy trim along the base
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const xx = bx - hw * 1.05 + u * hw * 2.1;
    s += circ(xx, by + R * 0.02 + Math.sin(u * Math.PI) * R * 0.06, R * 0.06, i % 2 ? (v.a ?? '#fff') : light(v.a ?? '#fff', 0.3));
  }
  return s + pom(ax, ay, R * 0.11, v.a ?? '#fff');
}
function chefHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const e = dark(c, 0.1);
  let s = '';
  for (const [a, b, r] of [[-0.48, -1.06, 0.28], [0.48, -1.06, 0.28], [-0.2, -1.24, 0.3], [0.22, -1.25, 0.3], [0, -1.12, 0.32]]) s += circ(a * R, hy + b * R, r * R, c, `stroke="${e}" stroke-width="${f(R * 0.016)}"`) + circ(a * R, hy + b * R, r * R, 'url(#g-face)');
  for (const [a, b] of [[-0.26, -1.36], [0.14, -1.38], [-0.56, -1.16]]) s += circ(a * R, hy + b * R, R * 0.06, '#fff', 'opacity="0.8"');
  const bandD = `M${p(-0.66, -0.66)} Q${p(0, -0.56)} ${p(0.66, -0.66)} L${p(0.64, -0.98)} Q${p(0, -0.9)} ${p(-0.64, -0.98)}Z`;
  s += P(bandD, c, `stroke="${e}" stroke-width="${f(R * 0.016)}"`) + P(bandD, 'url(#g-shadeX)');
  for (const u of [-0.45, -0.22, 0, 0.22, 0.45]) s += P(`M${p(u, -0.9 + u * u * 0.1)} L${p(u * 1.02, -0.64 + u * u * 0.1)}`, 'none', sk(dark(c, 0.15), R * 0.014, 'opacity="0.5"'));
  return s;
}
function topHat(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const a = v.a ?? '#ff7eb6';
  let s = ell(0, hy - R * 0.76, R * 0.92, R * 0.15, dark(c, 0.1)) + ell(0, hy - R * 0.78, R * 0.86, R * 0.11, light(c, 0.12));
  const body = `M${p(-0.56, -0.8)} L${p(-0.6, -1.5)} Q${p(0, -1.58)} ${p(0.6, -1.5)} L${p(0.56, -0.8)} Q${p(0, -0.72)} ${p(-0.56, -0.8)}Z`;
  s += P(body, c) + P(body, 'url(#g-shadeX)') + ell(0, hy - R * 1.5, R * 0.6, R * 0.09, light(c, 0.15));
  const bandD = `M${p(-0.57, -0.84)} Q${p(0, -0.76)} ${p(0.57, -0.84)} L${p(0.58, -1.02)} Q${p(0, -0.94)} ${p(-0.58, -1.02)}Z`;
  s += P(bandD, a) + P(bandD, 'url(#g-shadeX)');
  s += P(`M${p(-0.42, -1.4)} L${p(-0.4, -1.08)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.18"'));
  if (v.o === 'star') s += starGem(R * 0.38, hy - R * 0.94, R * 0.12, '#ffd36b') + sparkle(R * 0.2, hy - R * 1.3, R * 0.06);
  else s += leaf(R * 0.38, hy - R * 0.94, R * 0.18, -40) + crownFlower('rose', R * 0.36, hy - R * 0.92, R * 0.12, '#ff4f7b', 0, 0);
  return s;
}
function cowboyHat(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const crownP = `M${p(-0.74, -0.6)} C${p(-0.82, -1.08)} ${p(-0.62, -1.36)} ${p(-0.32, -1.28)} Q${p(0, -1.14)} ${p(0.32, -1.28)} C${p(0.62, -1.36)} ${p(0.82, -1.08)} ${p(0.74, -0.6)}Z`;
  let s = brimShade(R, hy, -0.26, 0.85) + cloth(crownP, c, x.p, 'x') + P(`M${p(0, -1.14)} L${p(0, -0.8)}`, 'none', sk(dark(c, 0.18), R * 0.02, 'opacity="0.4"'));
  const bandD = `M${p(-0.76, -0.62)} Q${p(0, -0.54)} ${p(0.76, -0.62)} L${p(0.77, -0.78)} Q${p(0, -0.7)} ${p(-0.77, -0.78)}Z`;
  s += P(bandD, v.a ?? '#8a5a3c');
  const brimP = `M${p(-1.55, -0.8)} Q${p(-1.45, -0.42)} ${p(-0.8, -0.44)} Q${p(0, -0.32)} ${p(0.8, -0.44)} Q${p(1.45, -0.42)} ${p(1.55, -0.8)} Q${p(1.25, -0.58)} ${p(0.8, -0.62)} Q${p(0, -0.56)} ${p(-0.8, -0.62)} Q${p(-1.25, -0.58)} ${p(-1.55, -0.8)}Z`;
  s += P(brimP, dark(c, 0.06)) + P(brimP, 'url(#g-shadeY)');
  s += P(`M${p(-1.45, -0.72)} Q${p(-1.35, -0.48)} ${p(-0.8, -0.5)} Q${p(0, -0.39)} ${p(0.8, -0.5)} Q${p(1.35, -0.48)} ${p(1.45, -0.72)}`, 'none', sk(light(c, 0.35), R * 0.014, `stroke-dasharray="${f(R * 0.04)} ${f(R * 0.03)}" opacity="0.75"`));
  if (v.o === 'heart') s += heartGem(0, hy - R * 0.68, R * 0.13, '#ff4f8b') + sparkle(-R * 0.5, hy - R * 1.0, R * 0.06) + sparkle(R * 0.45, hy - R * 1.12, R * 0.05);
  else s += starGem(0, hy - R * 0.69, R * 0.1, 'url(#g-silver)');
  return s;
}
function gradCap(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const skull = `M${p(-0.8, -0.6)} Q${p(0, -0.5)} ${p(0.8, -0.6)} L${p(0.76, -0.98)} Q${p(0, -0.9)} ${p(-0.76, -0.98)}Z`;
  let s = P(skull, c) + P(skull, 'url(#g-shadeX)');
  s += P(`M${p(-1.12, -1.0)} L${p(0, -0.8)} L${p(1.12, -1.0)} L${p(1.12, -0.93)} L${p(0, -0.72)} L${p(-1.12, -0.93)}Z`, dark(c, 0.25));
  s += P(`M${p(-1.12, -1.0)} L${p(0, -1.22)} L${p(1.12, -1.0)} L${p(0, -0.8)}Z`, light(c, 0.12)) + P(`M${p(-1.12, -1.0)} L${p(0, -1.22)} L${p(1.12, -1.0)} L${p(0, -0.8)}Z`, 'url(#g-shadeY)');
  s += P(`M${p(-0.7, -1.04)} L${p(0, -1.18)}`, 'none', sk('#fff', R * 0.02, 'opacity="0.35"'));
  s += P(`M${p(0, -1.01)} Q${p(0.5, -0.98)} ${p(0.86, -0.95)} L${p(0.88, -0.64)}`, 'none', sk('#ffd24a', R * 0.025));
  s += P(`M${p(0.83, -0.66)} L${p(0.93, -0.66)} L${p(0.96, -0.44)} L${p(0.8, -0.44)}Z`, '#ffd24a') + P(`M${p(0.83, -0.66)} L${p(0.93, -0.66)} L${p(0.96, -0.44)} L${p(0.8, -0.44)}Z`, 'url(#g-shadeX)');
  return s + circ(0, hy - R * 1.01, R * 0.05, '#ffd24a');
}
function coneHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const veil = `M${p(0.26, -1.64)} C${p(0.75, -1.5)} ${p(1.05, -0.9)} ${p(1.12, -0.1)} L${p(0.86, -0.04)} C${p(0.85, -0.7)} ${p(0.6, -1.3)} ${p(0.26, -1.64)}Z`;
  let s = P(veil, '#ffffff', 'opacity="0.55"') + P(veil, light(c, 0.4), 'opacity="0.35"');
  const cone = `M${p(-0.42, -0.86)} L${p(0.26, -1.66)} L${p(0.44, -0.86)} Q${p(0, -0.78)} ${p(-0.42, -0.86)}Z`;
  s += P(cone, c) + P(cone, 'url(#g-shadeX)');
  for (const [a, b, r] of [[-0.06, -1.0, 0.05], [0.16, -1.2, 0.04], [0.1, -0.96, 0.03], [0.2, -1.42, 0.035], [-0.15, -0.95, 0.03]]) s += sparkle(a * R, hy + b * R, r * R);
  s += P(`M${p(-0.44, -0.84)} Q${p(0, -0.74)} ${p(0.46, -0.84)}`, 'none', sk('#fff', R * 0.06));
  for (let i = 0; i <= 6; i++) s += pearl((-0.4 + i * 0.14) * R, hy - R * (0.82 - Math.sin((i / 6) * Math.PI) * 0.04 - 0.02), R * 0.03);
  return s + pearl(R * 0.26, hy - R * 1.68, R * 0.05) + P(`M${p(0.3, -1.6)} Q${p(0.7, -1.4)} ${p(0.92, -0.5)}`, 'none', sk('#fff', R * 0.015, 'opacity="0.8"'));
}
function fireHelmet(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const brim = `M${p(-1.14, -0.34)} Q${p(0, -0.64)} ${p(1.14, -0.34)} Q${p(1.22, -0.22)} ${p(1.0, -0.24)} Q${p(0, -0.42)} ${p(-1.0, -0.24)} Q${p(-1.22, -0.22)} ${p(-1.14, -0.34)}Z`;
  let s = brimShade(R, hy, -0.14, 0.9) + P(brim, dark(c, 0.12)) + P(brim, 'url(#g-shadeY)');
  const dome = domeD(p, 0.92, -0.46, -1.24, 0.06);
  s += P(dome, c) + P(dome, 'url(#g-shadeX)') + P(`M${p(0, -1.24)} L${p(0, -0.5)}`, 'none', sk(dark(c, 0.15), R * 0.06)) + P(`M${p(-0.02, -1.22)} L${p(-0.02, -0.6)}`, 'none', sk(light(c, 0.3), R * 0.015, 'opacity="0.7"'));
  s += P(`M${p(-0.6, -0.9)} Q${p(-0.4, -1.14)} ${p(-0.12, -1.18)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.35"'));
  const sh = `M${p(-0.2, -0.98)} L${p(0.2, -0.98)} L${p(0.22, -0.72)} Q${p(0, -0.54)} ${p(-0.22, -0.72)}Z`;
  return s + P(sh, 'url(#g-gold)', `stroke="#c98a1e" stroke-width="${f(R * 0.014)}"`) + starGem(0, hy - R * 0.79, R * 0.09, '#e8384f');
}
function captainHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const top = `M${p(-1.02, -0.96)} Q${p(0, -1.34)} ${p(1.02, -0.96)} Q${p(0.92, -0.72)} ${p(0.72, -0.68)} L${p(-0.72, -0.68)} Q${p(-0.92, -0.72)} ${p(-1.02, -0.96)}Z`;
  let s = P(top, c, `stroke="${dark(c, 0.12)}" stroke-width="${f(R * 0.012)}"`) + P(top, 'url(#g-shadeY)');
  const bandD = `M${p(-0.74, -0.7)} L${p(0.74, -0.7)} L${p(0.72, -0.48)} Q${p(0, -0.42)} ${p(-0.72, -0.48)}Z`;
  s += P(bandD, '#2d3a6e') + P(bandD, 'url(#g-shadeX)') + P(`M${p(-0.7, -0.52)} Q${p(0, -0.58)} ${p(0.7, -0.52)}`, 'none', sk('#ffd24a', R * 0.03));
  const visor = `M${p(-0.68, -0.5)} Q${p(0, -0.44)} ${p(0.68, -0.5)} Q${p(0.52, -0.26)} ${p(0, -0.26)} Q${p(-0.52, -0.26)} ${p(-0.68, -0.5)}Z`;
  s += brimShade(R, hy, -0.2, 0.6) + P(visor, '#2d2a3a') + P(`M${p(-0.44, -0.42)} Q${p(0, -0.36)} ${p(0.3, -0.4)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.35"'));
  for (const sd of [-1, 1]) s += P(`M${p(sd * 0.08, -0.84)} Q${p(sd * 0.24, -0.92)} ${p(sd * 0.34, -0.82)} Q${p(sd * 0.22, -0.84)} ${p(sd * 0.08, -0.78)}Z`, 'url(#g-gold)');
  return s + circ(0, hy - R * 0.82, R * 0.08, 'url(#g-gold)', `stroke="#c98a1e" stroke-width="${f(R * 0.012)}"`) + starGem(0, hy - R * 0.82, R * 0.05, '#fff');
}
function doctorBand(x: WearCtx, R: number, hy: number): string {
  const c = x.c;
  const my = hy - R * 0.66;
  let s = band(R, hy, c, 0.07);
  s += `<rect x="${f(-R * 0.04)}" y="${f(my - R * 0.2)}" width="${f(R * 0.08)}" height="${f(R * 0.12)}" rx="${f(R * 0.02)}" fill="#9aa3b5"/>`;
  s += circ(0, my, R * 0.21, 'url(#g-silver)', `stroke="#8a90a8" stroke-width="${f(R * 0.02)}"`) + circ(0, my, R * 0.15, '#dfe9f5') + circ(0, my, R * 0.15, 'url(#g-glass)');
  s += circ(0, my, R * 0.035, '#5a6077') + P(`M${f(-R * 0.1)} ${f(my - R * 0.04)} Q${f(-R * 0.08)} ${f(my - R * 0.1)} ${f(-R * 0.03)} ${f(my - R * 0.12)}`, 'none', sk('#fff', R * 0.025, 'opacity="0.9"'));
  return s;
}
function witchHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  let s = brimShade(R, hy, -0.4, 0.9) + ell(0, hy - R * 0.62, R * 1.36, R * 0.22, dark(c, 0.14)) + ell(0, hy - R * 0.64, R * 1.24, R * 0.17, c, 'opacity="0.45"');
  const cone = `M${p(-0.64, -0.64)} C${p(-0.4, -1.0)} ${p(-0.22, -1.5)} ${p(0.08, -1.72)} C${p(0.35, -1.86)} ${p(0.62, -1.7)} ${p(0.74, -1.52)} C${p(0.52, -1.58)} ${p(0.34, -1.5)} ${p(0.3, -1.3)} C${p(0.36, -1.0)} ${p(0.52, -0.84)} ${p(0.64, -0.64)} Q${p(0, -0.56)} ${p(-0.64, -0.64)}Z`;
  s += cloth(cone, c, x.p, 'x');
  const bandD = `M${p(-0.62, -0.66)} Q${p(0, -0.58)} ${p(0.62, -0.66)} L${p(0.54, -0.8)} Q${p(0, -0.72)} ${p(-0.54, -0.8)}Z`;
  s += P(bandD, '#ff9ec7');
  s += P(`M${p(0.62, -1.5)} A${f(R * 0.12)} ${f(R * 0.12)} 0 1 0 ${p(0.76, -1.3)} A${f(R * 0.09)} ${f(R * 0.09)} 0 1 1 ${p(0.62, -1.5)}Z`, '#ffe680');
  for (const [a, b, r] of [[-0.2, -1.0, 0.07], [0.12, -1.3, 0.05], [0.2, -0.95, 0.045], [-0.05, -1.5, 0.04]]) s += P(starD(a * R, hy + b * R, r * R), '#ffe680');
  return s + starGem(0, hy - R * 0.73, R * 0.07, '#fff3b0');
}
const DRESS_UP: Style[] = [
  { key: 'party', name: 'Party Hat', group: 'Dress-Up Hats', base: 15, vars: [{ k: 'pink', n: 'Pink Stripe', c: '#ff7eb6', a: '#ffe680', o: 'stripes' }, { k: 'confetti', n: 'Confetti', c: '#7cc8ff', a: '#ffffff' }], draw: partyHat },
  { key: 'chef', name: 'Chef Hat', group: 'Dress-Up Hats', base: 20, vars: [{ k: 'white', n: '', name: 'Chef Hat', c: '#fffaf5' }], draw: chefHat },
  { key: 'tophat', name: 'Top Hat', group: 'Dress-Up Hats', base: 30, vars: [{ k: 'midnight', n: 'Rose', c: '#2d2a3a', a: '#ff7eb6' }, { k: 'pink', n: 'Starry Pink', c: '#ff7eb6', a: '#fffaf5', o: 'star' }], draw: topHat },
  { key: 'cowboy', name: 'Cowboy Hat', group: 'Dress-Up Hats', base: 30, vars: [{ k: 'caramel', n: 'Caramel', c: '#c9a27e', a: '#8a5a3c' }, { k: 'pink', n: 'Pink', name: 'Pink Cowgirl Hat', c: '#ff9ec7', a: '#fffaf5', o: 'heart' }], draw: cowboyHat },
  { key: 'grad', name: 'Graduation Cap', group: 'Dress-Up Hats', base: 35, vars: [{ k: 'navy', n: '', name: 'Graduation Cap', c: '#3f4f9a' }], draw: gradCap },
  { key: 'cone', name: 'Princess Cone Hat', group: 'Dress-Up Hats', base: 45, vars: [{ k: 'pink', n: '', name: 'Princess Cone Hat', c: '#ffb3c7' }], draw: coneHat },
  { key: 'firehelmet', name: 'Firefighter Helmet', group: 'Dress-Up Hats', base: 40, vars: [{ k: 'red', n: '', name: 'Firefighter Helmet', c: '#e8384f' }], draw: fireHelmet },
  { key: 'captain', name: 'Captain Hat', group: 'Dress-Up Hats', base: 40, vars: [{ k: 'white', n: '', name: 'Captain Hat', c: '#fffaf5' }], draw: captainHat },
  { key: 'doctor', name: 'Doctor Headband', group: 'Dress-Up Hats', base: 25, vars: [{ k: 'grey', n: '', name: 'Doctor Headband', c: '#6b7390' }], draw: doctorBand },
  { key: 'pirate', name: 'Pirate Hat', group: 'Dress-Up Hats', base: 35, vars: [{ k: 'black', n: '', name: 'Pirate Hat', c: '#2d2a3a' }], draw: pirateHat },
  { key: 'heroband', name: 'Hero Mask Band', group: 'Dress-Up Hats', base: 25, vars: [{ k: 'red', n: 'Red', c: '#e8384f' }, { k: 'midnight', n: 'Star', c: '#2d3a6e', o: 'star' }], draw: heroBand },
  { key: 'witch', name: 'Witch Hat', group: 'Dress-Up Hats', base: 45, tags: ['fall'], vars: [{ k: 'starry', n: 'Starry', c: '#9b6bff' }], draw: witchHat },
];

// ---------- holiday ----------
function elfHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const body = `M${p(-1.0, -0.42)} C${p(-1.02, -1.12)} ${p(-0.3, -1.42)} ${p(0.25, -1.32)} C${p(0.72, -1.24)} ${p(1.12, -0.92)} ${p(1.32, -0.4)} C${p(1.16, -0.62)} ${p(1.02, -0.72)} ${p(0.9, -0.68)} L${p(1.0, -0.42)}Z`;
  let s = cloth(body, c, x.p, 'y') + P(`M${p(-0.5, -1.04)} Q${p(0, -1.3)} ${p(0.4, -1.2)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.3"'));
  let zig = `M${p(-1.06, -0.52)} Q${p(0, -0.68)} ${p(1.06, -0.52)} L${p(1.04, -0.3)}`;
  for (let i = 0; i < 10; i++) {
    const u1 = 1.04 - (i + 0.5) * 0.208, u2 = 1.04 - (i + 1) * 0.208;
    zig += ` L${p(u1, -0.18 - 0.16 * (1 - u1 * u1))} L${p(u2, -0.3 - 0.16 * (1 - u2 * u2))}`;
  }
  s += P(zig + 'Z', '#e8384f') + P(zig + 'Z', 'url(#g-shadeX)');
  for (let i = 0; i < 5; i++) s += circ((-0.8 + i * 0.4) * R, hy - R * (0.4 + 0.16 * (1 - (-0.8 + i * 0.4) ** 2)), R * 0.035, '#ffd24a');
  return s + circ(R * 1.32, hy - R * 0.34, R * 0.1, 'url(#g-gold)', `stroke="#c98a1e" stroke-width="${f(R * 0.014)}"`) + line(R * 1.27, hy - R * 0.3, R * 1.37, hy - R * 0.3, '#c98a1e', R * 0.02) + circ(R * 1.32, hy - R * 0.27, R * 0.02, '#8a5a1e');
}
function antlers(x: WearCtx, R: number, hy: number, v: V): string {
  const gold = v.o === 'gold';
  const c = gold ? '#f0b232' : x.c;
  let s = band(R, hy, gold ? '#c98a1e' : dark(c, 0.15), 0.07);
  const ant = (sd: number) => {
    const p = at(R, hy);
    const main = `M${p(sd * 0.34, -0.98)} Q${p(sd * 0.36, -1.3)} ${p(sd * 0.56, -1.5)}`;
    const b1 = `M${p(sd * 0.36, -1.2)} Q${p(sd * 0.22, -1.32)} ${p(sd * 0.2, -1.46)}`;
    const b2 = `M${p(sd * 0.44, -1.36)} Q${p(sd * 0.6, -1.36)} ${p(sd * 0.7, -1.3)}`;
    return [main, b1, b2].map((d) => `<path d="${d}" ${sk(gold ? '#c98a1e' : dark(c, 0.25), R * 0.09)}/><path d="${d}" ${sk(gold ? 'url(#g-gold)' : c, R * 0.065)}/>`).join('') +
      `<path d="${main}" ${sk('#fff', R * 0.018, 'opacity="0.45"')} transform="translate(${f(-sd * R * 0.012)} 0)"/>`;
  };
  s += ant(-1) + ant(1);
  if (gold) s += sparkle(-R * 0.62, hy - R * 1.42, R * 0.07) + sparkle(R * 0.24, hy - R * 1.5, R * 0.05) + sparkle(R * 0.72, hy - R * 1.2, R * 0.05, '#fff3b0');
  else {
    for (const sd of [-1, 1]) s += ell(sd * R * 0.58, hy - R * 0.9, R * 0.14, R * 0.07, '#a8744a', rot(sd * -30, sd * R * 0.58, hy - R * 0.9)) + ell(sd * R * 0.58, hy - R * 0.9, R * 0.08, R * 0.035, '#ffb3c7', rot(sd * -30, sd * R * 0.58, hy - R * 0.9));
    s += bow(0, hy - R * 1.0, R * 0.16, '#e8384f') + circ(-R * 0.1, hy - R * 0.9, R * 0.04, 'url(#g-gold)') + circ(R * 0.1, hy - R * 0.9, R * 0.04, 'url(#g-gold)');
  }
  return s;
}
function hollyBand(x: WearCtx, R: number, hy: number): string {
  let s = band(R, hy, x.c, 0.08);
  const [hx, hyy] = arcXY(R, hy, 300);
  const holly = (deg: number) => grp(`translate(${f(hx)} ${f(hyy)}) rotate(${deg})`, P(`M0 0 Q${f(R * 0.06)} ${f(-R * 0.08)} ${f(R * 0.1)} ${f(-R * 0.04)} Q${f(R * 0.12)} ${f(-R * 0.09)} ${f(R * 0.18)} ${f(-R * 0.06)} Q${f(R * 0.2)} ${f(-R * 0.11)} ${f(R * 0.27)} 0 Q${f(R * 0.2)} ${f(R * 0.11)} ${f(R * 0.18)} ${f(R * 0.06)} Q${f(R * 0.12)} ${f(R * 0.09)} ${f(R * 0.1)} ${f(R * 0.04)} Q${f(R * 0.06)} ${f(R * 0.08)} 0 0Z`, '#2f8a62') + line(R * 0.03, 0, R * 0.22, 0, '#1f6a48', R * 0.012));
  s += holly(-160) + holly(-30) + holly(-95);
  for (const [dx, dy] of [[-0.04, 0.0], [0.05, -0.01], [0.0, 0.07]]) s += circ(hx + dx * R, hyy + dy * R, R * 0.055, '#e8384f') + circ(hx + dx * R - R * 0.018, hyy + dy * R - R * 0.018, R * 0.015, '#fff', 'opacity="0.8"');
  return s;
}
function pumpkinHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const dome = domeD(p, 1.06, -0.36, -1.24, 0.12);
  let s = P(dome, c) + P(dome, 'url(#g-shadeX)');
  for (const u of [-0.7, -0.35, 0, 0.35, 0.7]) s += P(`M${p(u * 0.3, -1.22)} Q${p(u * 1.25, -1.0)} ${p(u * 1.0, -0.3 + 0.04 * (1 - u * u))}`, 'none', sk(dark(c, 0.2), R * 0.03, 'opacity="0.45"'));
  s += P(`M${p(-0.6, -1.0)} Q${p(-0.3, -1.18)} ${p(-0.05, -1.2)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.3"'));
  s += P(`M${p(-0.06, -1.2)} Q${p(-0.04, -1.38)} ${p(0.06, -1.44)} L${p(0.12, -1.38)} Q${p(0.06, -1.32)} ${p(0.07, -1.2)}Z`, '#5f8f3a');
  s += leaf(R * 0.08, hy - R * 1.22, R * 0.3, -18, '#6fc47c') + P(`M${p(-0.06, -1.22)} q${f(-R * 0.1)} ${f(-R * 0.1)} ${f(-R * 0.18)} ${f(-R * 0.02)} q${f(-R * 0.08)} ${f(R * 0.08)} ${f(-R * 0.02)} ${f(R * 0.1)}`, 'none', sk('#5f8f3a', R * 0.02));
  return s;
}
function candyCanes(x: WearCtx, R: number, hy: number): string {
  let s = band(R, hy, '#fffaf5', 0.08, { edge: '#e6dcea' });
  for (const sd of [-1, 1]) {
    const p = at(R, hy);
    const d = `M${p(sd * 0.36, -0.98)} L${p(sd * 0.42, -1.4)} Q${p(sd * 0.46, -1.6)} ${p(sd * 0.62, -1.56)} Q${p(sd * 0.74, -1.5)} ${p(sd * 0.7, -1.38)}`;
    s += `<path d="${d}" ${sk('#d9cfdc', R * 0.1)}/><path d="${d}" ${sk('#fffaf5', R * 0.08)}/><path d="${d}" ${sk('#e8384f', R * 0.08, `stroke-dasharray="${f(R * 0.06)} ${f(R * 0.06)}" stroke-linecap="butt"`)}/>`;
    s += `<path d="${d}" ${sk('#fff', R * 0.018, 'opacity="0.6"')} transform="translate(${f(-R * 0.015)} 0)"/>`;
  }
  return s + bow(0, hy - R * 0.99, R * 0.15, '#3fbf8f');
}
const HOLIDAY: Style[] = [
  { key: 'elf', name: 'Elf Hat', group: 'Holiday', base: 25, tags: ['winter'], vars: [{ k: 'green', n: '', name: 'Elf Hat', c: '#3fbf8f' }], draw: elfHat },
  { key: 'antlers', name: 'Antlers', group: 'Holiday', base: 25, tags: ['winter'], vars: [{ k: 'cocoa', n: 'Reindeer', c: '#c9a27e' }, { k: 'gold', n: 'Golden', c: '#f0b232', o: 'gold', fixed: true }], draw: antlers },
  { key: 'holly', name: 'Holly Headband', group: 'Holiday', base: 20, tags: ['winter'], vars: [{ k: 'red', n: '', name: 'Holly Headband', c: '#e8384f' }], draw: hollyBand },
  { key: 'candycane', name: 'Candy Cane Boppers', group: 'Holiday', base: 25, tags: ['winter'], fixed: true, vars: [{ k: 'red', n: '', name: 'Candy Cane Boppers', c: '#e8384f' }], draw: candyCanes },
  { key: 'pumpkin', name: 'Pumpkin Hat', group: 'Holiday', base: 30, tags: ['fall'], vars: [{ k: 'orange', n: '', name: 'Pumpkin Hat', c: '#ff8a3d' }], draw: pumpkinHat },
];

// ---------- magic ----------
function halo(x: WearCtx, R: number, hy: number, v: V): string {
  const cy = hy - R * 1.36;
  const glow = `<ellipse cx="0" cy="${f(cy)}" rx="${f(R * 0.85)}" ry="${f(R * 0.36)}" fill="url(#g-glow)" opacity="0.7"><animate attributeName="opacity" values="0.45;0.95;0.45" dur="2.6s" repeatCount="indefinite"/></ellipse>`;
  let s = glow + ell(0, cy, R * 0.55, R * 0.14, 'none', `stroke="${v.o === 'stars' ? '#9096ad' : '#d99a1e'}" stroke-width="${f(R * 0.085)}"`) +
    ell(0, cy, R * 0.55, R * 0.14, 'none', `stroke="${v.o === 'stars' ? 'url(#g-silver)' : 'url(#g-gold)'}" stroke-width="${f(R * 0.06)}"`) +
    P(`M${f(-R * 0.4)} ${f(cy - R * 0.09)} Q${f(-R * 0.1)} ${f(cy - R * 0.15)} ${f(R * 0.2)} ${f(cy - R * 0.13)}`, 'none', sk('#fff', R * 0.02, 'opacity="0.85"'));
  if (v.o === 'stars') for (let i = 0; i < 5; i++) {
    const t = (i / 5) * Math.PI * 2 + 0.3;
    s += starGem(Math.cos(t) * R * 0.55, cy + Math.sin(t) * R * 0.14, R * 0.07, i % 2 ? '#fff3b0' : '#c99bff');
  }
  else s += `<g opacity="0.9">${sparkle(R * 0.62, cy - R * 0.14, R * 0.07)}<animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite"/></g>` + sparkle(-R * 0.66, cy + R * 0.08, R * 0.05, '#fff3b0');
  return s;
}
function unicornHorn(x: WearCtx, R: number, hy: number, v: V): string {
  const rb = v.o === 'rainbow';
  const by = hy - R * 0.94;
  let s = band(R, hy, x.c, 0.08);
  // mane puffs along the band
  const mane = rb ? ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'] : ['#ffd9e8', '#e6d4ff', '#c9f0ff', '#fff3b0', '#ffd9e8', '#e6d4ff'];
  [228, 240, 252, 288, 300, 312].forEach((a, i) => {
    const [px, py] = arcXY(R, hy, a);
    s += circ(px, py - R * 0.02, R * 0.08, mane[i]) + circ(px - R * 0.02, py - R * 0.045, R * 0.025, '#fff', 'opacity="0.7"');
  });
  for (const sd of [-1, 1]) s += P(`M${f(sd * R * 0.44)} ${f(by + R * 0.06)} L${f(sd * R * 0.6)} ${f(by - R * 0.28)} L${f(sd * R * 0.72)} ${f(by + R * 0.12)}Z`, '#fffaf5', `stroke="#ece4ef" stroke-width="${f(R * 0.012)}"`) + P(`M${f(sd * R * 0.5)} ${f(by + R * 0.05)} L${f(sd * R * 0.6)} ${f(by - R * 0.16)} L${f(sd * R * 0.67)} ${f(by + R * 0.08)}Z`, '#ffb3c7');
  const horn = `M${f(-R * 0.15)} ${f(by + R * 0.04)} L${f(R * 0.01)} ${f(by - R * 0.66)} L${f(R * 0.15)} ${f(by + R * 0.04)} Q0 ${f(by + R * 0.1)} ${f(-R * 0.15)} ${f(by + R * 0.04)}Z`;
  s += P(horn, rb ? 'url(#g-rainbow)' : '#fff6fb', `stroke="${rb ? '#c99bff' : '#e8cfe4'}" stroke-width="${f(R * 0.014)}"`);
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const w = R * 0.15 * (1 - t);
    s += P(`M${f(-w)} ${f(by + R * 0.04 - t * R * 0.7 + R * 0.03)} Q0 ${f(by + R * 0.04 - t * R * 0.7 + R * 0.06)} ${f(w)} ${f(by + R * 0.04 - t * R * 0.7 - R * 0.03)}`, 'none', sk(rb ? '#fff' : '#e3b8f0', R * 0.02, 'opacity="0.75"'));
  }
  s += P(`M${f(-R * 0.07)} ${f(by - R * 0.05)} L${f(-R * 0.01)} ${f(by - R * 0.5)}`, 'none', sk('#fff', R * 0.025, 'opacity="0.7"'));
  return s + sparkle(R * 0.2, by - R * 0.6, R * 0.07) + sparkle(-R * 0.24, by - R * 0.35, R * 0.045, '#fff3b0');
}
function boppers(x: WearCtx, R: number, hy: number, v: V): string {
  let s = band(R, hy, x.c, 0.08);
  for (const sd of [-1, 1]) {
    const p = at(R, hy);
    const d = `M${p(sd * 0.3, -0.98)} C${p(sd * 0.28, -1.2)} ${p(sd * 0.5, -1.28)} ${p(sd * 0.46, -1.34)} S${p(sd * 0.56, -1.42)} ${p(sd * 0.58, -1.44)}`;
    s += `<path d="${d}" ${sk(dark(x.c, 0.3), R * 0.03)}/>`;
    const tx = sd * R * 0.58, ty = hy - R * 1.46;
    s += v.o === 'heart' ? heartGem(tx, ty, R * 0.2, '#ff4f8b') : starGem(tx, ty, R * 0.13, 'url(#g-gold)');
    s += sparkle(tx + sd * R * 0.14, ty - R * 0.1, R * 0.045);
  }
  return s;
}
const MAGIC: Style[] = [
  { key: 'halo', name: 'Halo', group: 'Magic', base: 40, vars: [{ k: 'gold', n: 'Glowing', c: '#ffd24a', fixed: true }, { k: 'stars', n: 'Starry', c: '#c99bff', o: 'stars', fixed: true }], draw: halo },
  { key: 'unihorn', name: 'Unicorn Horn', group: 'Magic', base: 50, vars: [{ k: 'pastel', n: 'Pastel', c: '#ffd9e8' }, { k: 'rainbow', n: 'Rainbow', c: '#c99bff', o: 'rainbow' }], draw: unicornHorn },
  { key: 'boppers', name: 'Boppers', group: 'Magic', base: 20, vars: [{ k: 'star', n: 'Star', c: '#9b6bff' }, { k: 'heart', n: 'Heart', c: '#ff7eb6', o: 'heart' }], draw: boppers },
];

// ---------- animal ears ----------
const thinBand = (R: number, hy: number, c: string) => `<path d="${topArc(R, hy, 1.0, 0.99, 0.03, 190, 350)}" ${sk(c, R * 0.07)}/>`;
function ears(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const dk = dark(c, 0.15);
  const inner = v.a ?? '#ffb3c7';
  const st = `stroke="${dk}" stroke-width="${f(R * 0.014)}" stroke-linejoin="round"`;
  switch (v.o) {
    case 'bear':
    case 'panda':
    case 'mouse': {
      const big = v.o === 'mouse';
      const ex = big ? 0.74 : 0.68, ey = big ? -0.9 : -0.92, r = big ? 0.34 : 0.25;
      return thinBand(R, hy, dk) + mirror(circ(ex * R, hy + ey * R, r * R, c, st) + circ(ex * R, hy + ey * R, r * R, 'url(#g-face)') + (v.o === 'panda' ? '' : circ(ex * R * 0.97, hy + (ey + 0.03) * R, r * R * 0.58, inner)) + circ((ex - r * 0.4) * R, hy + (ey - r * 0.4) * R, R * 0.035, '#fff', 'opacity="0.45"'));
    }
    case 'fox':
    case 'kitty': {
      const fox = v.o === 'fox';
      const tip: [number, number] = fox ? [0.8, -1.5] : [0.76, -1.34];
      const b1: [number, number] = [0.28, -1.0], b2: [number, number] = [0.88, -0.62];
      const ear = `M${p(...b1)} Q${p(tip[0] - 0.12, tip[1] + 0.05)} ${p(...tip)} Q${p(tip[0] + 0.1, tip[1] + 0.1)} ${p(...b2)}Z`;
      const lerp = (a: [number, number], t: number): [number, number] => [tip[0] + (a[0] - tip[0]) * t, tip[1] + (a[1] - tip[1]) * t];
      let e = P(ear, c, st) + P(ear, 'url(#g-shadeX)');
      const i1 = lerp(b1, 0.75), i2 = lerp(b2, 0.75), it = lerp([0.58, -0.82], 0.12);
      e += P(`M${p(i1[0] + 0.06, i1[1])} Q${p(it[0] - 0.06, it[1] + 0.04)} ${p(...it)} Q${p(it[0] + 0.06, it[1] + 0.06)} ${p(i2[0] - 0.02, i2[1] - 0.05)}Z`, fox ? '#fffaf5' : inner);
      if (fox) {
        const t1 = lerp(b1, 0.28), t2 = lerp(b2, 0.28);
        e += P(`M${p(...t1)} Q${p(tip[0] - 0.06, tip[1])} ${p(...tip)} Q${p(tip[0] + 0.06, tip[1] + 0.06)} ${p(...t2)} Q${p((t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2 + 0.03)} ${p(...t1)}Z`, '#4a3a3a');
      }
      for (const k of [0.2, 0.0, -0.2]) e += line((0.58 + k * 0.2) * R, hy - R * (0.84 + 0.02 * k), (0.6 + k * 0.3) * R, hy - R * (1.02 - Math.abs(k) * 0.1), '#fff', R * 0.016, 0.85);
      return thinBand(R, hy, dk) + mirror(e);
    }
    case 'tiger': {
      const ear = `M${p(0.34, -0.98)} C${p(0.38, -1.36)} ${p(0.92, -1.3)} ${p(0.88, -0.7)}Z`;
      let e = P(ear, c, st) + P(ear, 'url(#g-shadeX)') + P(`M${p(0.46, -0.96)} C${p(0.5, -1.2)} ${p(0.8, -1.18)} ${p(0.78, -0.82)}Z`, '#fffaf5');
      e += P(`M${p(0.4, -1.12)} l${f(R * 0.1)} ${f(R * 0.03)} M${p(0.84, -1.0)} l${f(-R * 0.1)} ${f(-R * 0.01)}`, 'none', sk('#2d2a3a', R * 0.035));
      return thinBand(R, hy, dk) + mirror(e);
    }
    case 'deer': {
      let e = `<g ${rot(-28, 0.86 * R, hy - 0.66 * R)}>` + ell(0.98 * R, hy - 0.66 * R, R * 0.2, R * 0.09, c, st) + ell(1.0 * R, hy - 0.66 * R, R * 0.13, R * 0.045, inner) + '</g>';
      const ant = `M${p(0.3, -0.98)} Q${p(0.3, -1.18)} ${p(0.38, -1.3)} M${p(0.31, -1.14)} Q${p(0.22, -1.2)} ${p(0.2, -1.28)}`;
      e += `<path d="${ant}" ${sk('#8a5a3c', R * 0.07)}/><path d="${ant}" ${sk('#c9a27e', R * 0.045)}/>`;
      return thinBand(R, hy, dk) + mirror(e) + circ(-R * 0.62, hy - R * 0.74, R * 0.03, '#fff') + circ(R * 0.66, hy - R * 0.7, R * 0.025, '#fff');
    }
    case 'puppy': {
      const ear = `M${p(0.4, -1.0)} C${p(0.92, -1.16)} ${p(1.22, -0.74)} ${p(1.2, -0.3)} C${p(1.2, 0.02)} ${p(1.0, 0.1)} ${p(0.92, -0.1)} C${p(0.84, -0.42)} ${p(0.7, -0.72)} ${p(0.4, -1.0)}Z`;
      return thinBand(R, hy, dk) + mirror(P(ear, c, st) + P(ear, 'url(#g-shadeX)') + P(`M${p(0.62, -0.94)} C${p(0.98, -0.98)} ${p(1.12, -0.6)} ${p(1.1, -0.3)}`, 'none', sk(dk, R * 0.025, 'opacity="0.5"')));
    }
    case 'lamb': {
      let s = thinBand(R, hy, '#e6dcea') + mirror(`<g ${rot(-20, 0.92 * R, hy - 0.5 * R)}>` + ell(1.02 * R, hy - 0.5 * R, R * 0.2, R * 0.09, '#f3d2c4', `stroke="#e0b6a8" stroke-width="${f(R * 0.012)}"`) + ell(1.04 * R, hy - 0.5 * R, R * 0.12, R * 0.04, '#ffb3c7') + '</g>');
      for (const [a, b, r] of [[-0.3, -0.98, 0.16], [0.3, -0.98, 0.16], [-0.14, -1.08, 0.18], [0.16, -1.08, 0.18], [0, -1.0, 0.16]]) s += circ(a * R, hy + b * R, r * R, dark(c, 0.06)) + circ(a * R - R * 0.02, hy + b * R - R * 0.02, r * R * 0.85, c);
      return s + circ(-R * 0.18, hy - R * 1.16, R * 0.05, '#fff', 'opacity="0.8"');
    }
    default: {
      // bunny with one floppy ear
      const up = `M${p(-0.44, -0.96)} C${p(-0.58, -1.36)} ${p(-0.48, -1.66)} ${p(-0.34, -1.64)} C${p(-0.18, -1.62)} ${p(-0.16, -1.28)} ${p(-0.22, -0.98)}Z`;
      const flop = `M${p(0.22, -0.98)} C${p(0.2, -1.32)} ${p(0.36, -1.5)} ${p(0.52, -1.48)} C${p(0.74, -1.46)} ${p(0.92, -1.26)} ${p(0.98, -1.0)} C${p(1.0, -0.92)} ${p(0.92, -0.88)} ${p(0.88, -0.96)} C${p(0.78, -1.16)} ${p(0.62, -1.28)} ${p(0.52, -1.26)} C${p(0.44, -1.22)} ${p(0.44, -1.1)} ${p(0.46, -0.96)}Z`;
      return thinBand(R, hy, dk) + P(up, c, st) + P(up, 'url(#g-shadeX)') + P(`M${p(-0.4, -1.0)} C${p(-0.48, -1.32)} ${p(-0.42, -1.52)} ${p(-0.34, -1.52)} C${p(-0.26, -1.5)} ${p(-0.24, -1.26)} ${p(-0.28, -1.0)}Z`, inner) +
        P(flop, c, st) + P(flop, 'url(#g-shadeX)') + P(`M${p(0.3, -1.0)} C${p(0.3, -1.26)} ${p(0.4, -1.38)} ${p(0.52, -1.38)} C${p(0.66, -1.36)} ${p(0.78, -1.24)} ${p(0.84, -1.08)}`, 'none', sk(inner, R * 0.07)) + bow(0, hy - R * 1.0, R * 0.13, '#ff7eb6');
    }
  }
}
const ANIMAL_EARS: Style[] = [
  {
    key: 'ears', name: 'Ears', group: 'Animal Ears', base: 20, step: 4,
    vars: [
      { k: 'bunny', n: 'Floppy Bunny', c: '#f4ead9', o: 'bunny', t: ['spring'] },
      { k: 'kitty', n: 'Ginger Kitty', c: '#ffab5e', o: 'kitty' },
      { k: 'bear', n: 'Teddy Bear', c: '#a8744a', a: '#f0c9a0', o: 'bear' },
      { k: 'fox', n: 'Fox', c: '#ff8a3d', o: 'fox', t: ['fall'] },
      { k: 'mouse', n: 'Mouse', c: '#b9bdd0', o: 'mouse' },
      { k: 'panda', n: 'Panda', c: '#2d2a3a', o: 'panda', fixed: true },
      { k: 'deer', n: 'Fawn', c: '#c9a27e', o: 'deer', t: ['spring'] },
      { k: 'puppy', n: 'Puppy', c: '#c98a5a', o: 'puppy' },
      { k: 'lamb', n: 'Lamb', c: '#fffaf5', o: 'lamb', t: ['spring'] },
      { k: 'tiger', n: 'Tiger', c: '#ffab3d', o: 'tiger' },
    ],
    draw: ears,
  },
];

// ---------- hair clips ----------
/** Spots along the right hairline where clips sit, with their angle. */
const clipSpots = (R: number, hy: number, angles: number[], k = 0.92): [number, number, number][] =>
  angles.map((a) => {
    const [x, y] = arcXY(R, hy, a, 1.07 * k, 1.05 * k, 0);
    return [x, y, tangent(a, 1.07, 1.05)];
  });
function butterfly(x: number, y: number, r: number, c: string, c2: string, deg: number, glitter = false): string {
  const up = `M0 0 C${f(-r * 0.2)} ${f(-r * 0.95)} ${f(-r * 1.15)} ${f(-r * 1.05)} ${f(-r * 1.05)} ${f(-r * 0.35)} C${f(-r)} 0 ${f(-r * 0.4)} ${f(r * 0.05)} 0 0Z`;
  const lo = `M0 0 C${f(-r * 0.5)} ${f(r * 0.1)} ${f(-r * 0.85)} ${f(r * 0.55)} ${f(-r * 0.55)} ${f(r * 0.78)} C${f(-r * 0.3)} ${f(r * 0.9)} ${f(-r * 0.1)} ${f(r * 0.4)} 0 0Z`;
  let half = P(up, c, `stroke="${dark(c, 0.25)}" stroke-width="${f(r * 0.06)}"`) + P(up, 'url(#g-shadeY)') + P(lo, c2, `stroke="${dark(c2, 0.25)}" stroke-width="${f(r * 0.06)}"`);
  half += circ(-r * 0.6, -r * 0.5, r * 0.17, '#fff', 'opacity="0.85"') + circ(-r * 0.4, r * 0.4, r * 0.1, '#fff', 'opacity="0.7"');
  if (glitter) half += sparkle(-r * 0.75, -r * 0.2, r * 0.18);
  const body = ell(0, r * 0.05, r * 0.12, r * 0.5, '#4a3f5e') + P(`M0 ${f(-r * 0.35)} Q${f(-r * 0.15)} ${f(-r * 0.8)} ${f(-r * 0.35)} ${f(-r * 0.85)} M0 ${f(-r * 0.35)} Q${f(r * 0.15)} ${f(-r * 0.8)} ${f(r * 0.35)} ${f(-r * 0.85)}`, 'none', sk('#4a3f5e', r * 0.07));
  return grp(`translate(${f(x)} ${f(y)}) rotate(${f(deg)})`, mirror(half) + body);
}
function clips(x: WearCtx, R: number, hy: number, v: V): string {
  const c = x.c;
  switch (v.o) {
    case 'butterfly':
      return clipSpots(R, hy, [292, 318, 342]).map(([a, b, t], i) => butterfly(a, b, R * (i === 1 ? 0.2 : 0.15), c, v.a ?? '#ff9ec7', t + (i - 1) * 15, v.k === 'glitter')).join('');
    case 'heart':
      return clipSpots(R, hy, [198, 220, 244]).map(([a, b, t], i) => grp(`rotate(${f(t + 180)} ${f(a)} ${f(b)})`, heartGem(a, b, R * (i === 1 ? 0.27 : 0.2), c)) + (v.k === 'glitter' ? sparkle(a + R * 0.05, b - R * 0.08, R * 0.04) : '')).join('');
    case 'pearl': {
      const sp = clipSpots(R, hy, [300, 312, 324, 336, 348], 0.86);
      return P(`M${f(sp[0][0])} ${f(sp[0][1])} ${sp.map(([a, b]) => `L${f(a)} ${f(b)}`).join(' ')}`, 'none', sk('url(#g-gold)', R * 0.03)) + sp.map(([a, b]) => pearl(a, b, R * 0.06)).join('') +
        clipSpots(R, hy, [204, 216, 228], 0.9).map(([a, b]) => pearl(a, b, R * 0.045)).join('');
    }
    case 'snap': {
      const cs = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
      return clipSpots(R, hy, [200, 218, 236, 304, 322, 340], 0.88).map(([a, b, t], i) => {
        const L = R * 0.28, W = R * 0.085;
        const d = `M${f(-L / 2)} ${f(-W / 2)} L${f(L / 2)} ${f(-W * 0.2)} Q${f(L / 2 + W * 0.4)} 0 ${f(L / 2)} ${f(W * 0.2)} L${f(-L / 2)} ${f(W / 2)} Q${f(-L / 2 - W * 0.6)} 0 ${f(-L / 2)} ${f(-W / 2)}Z`;
        return grp(`translate(${f(a)} ${f(b)}) rotate(${f(t + (i < 3 ? 70 : -70))})`, P(d, cs[i], `stroke="${dark(cs[i], 0.25)}" stroke-width="${f(R * 0.01)}"`) + P(`M${f(-L * 0.35)} ${f(-W * 0.15)} L${f(L * 0.3)} ${f(-W * 0.08)}`, 'none', sk('#fff', R * 0.014, 'opacity="0.7"')));
      }).join('');
    }
    case 'bobby':
      return clipSpots(R, hy, [296, 314, 332], 0.86).map(([a, b, t], i) => grp(`translate(${f(a)} ${f(b)}) rotate(${f(t + 60 + i * 12)})`,
        line(-R * 0.12, -R * 0.015, R * 0.12, -R * 0.015, '#d99a1e', R * 0.03) + line(-R * 0.12, R * 0.02, R * 0.1, R * 0.02, '#f0b232', R * 0.03) + line(-R * 0.08, -R * 0.02, R * 0.06, -R * 0.02, '#fff3b0', R * 0.012) + circ(R * 0.12, 0, R * 0.025, '#ff7eb6'))).join('') +
        grp(`translate(${f(-R * 0.62)} ${f(hy - R * 0.74)}) rotate(-50)`, line(-R * 0.12, 0, R * 0.12, 0, '#d99a1e', R * 0.03) + line(-R * 0.03, -R * 0.1, R * 0.03, R * 0.1, '#f0b232', R * 0.03) + circ(0, 0, R * 0.03, '#ff7eb6'));
    case 'scrunchie': {
      const cy = hy - R * 1.02, rx = R * 0.42, ry = R * 0.12;
      let back = '', front = '';
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2;
        const bx = Math.cos(t) * rx, by = cy + Math.sin(t) * ry;
        const r = R * 0.1 * (1 + 0.15 * Math.sin(i * 2.3));
        const lump = circ(bx, by, r, Math.sin(t) < 0 ? dark(c, 0.12) : c) + (v.p === 'dots' && Math.sin(t) >= 0 ? circ(bx + r * 0.2, by - r * 0.1, r * 0.22, '#fff', 'opacity="0.9"') : '');
        if (Math.sin(t) < 0) back += lump;
        else front += lump + P(`M${f(bx - r * 0.5)} ${f(by - r * 0.3)} Q${f(bx)} ${f(by + r * 0.4)} ${f(bx + r * 0.5)} ${f(by - r * 0.3)}`, 'none', sk(dark(c, 0.2), R * 0.012, 'opacity="0.4"'));
      }
      return back + front + P(`M${f(-rx * 0.8)} ${f(cy + ry * 0.4)} Q0 ${f(cy + ry * 1.2)} ${f(rx * 0.4)} ${f(cy + ry * 0.9)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.5"'));
    }
    default: {
      // moon and star
      const [mx, my] = arcXY(R, hy, 302, 0.98, 0.97, 0);
      const moon = `M${f(mx)} ${f(my - R * 0.2)} A${f(R * 0.2)} ${f(R * 0.2)} 0 1 0 ${f(mx + R * 0.19)} ${f(my + R * 0.08)} A${f(R * 0.15)} ${f(R * 0.15)} 0 1 1 ${f(mx)} ${f(my - R * 0.2)}Z`;
      const [sx, sy] = arcXY(R, hy, 328, 0.94, 0.94, 0);
      return P(moon, 'url(#g-gold)', `stroke="#c98a1e" stroke-width="${f(R * 0.014)}"`) + circ(mx - R * 0.08, my + R * 0.02, R * 0.025, '#fff', 'opacity="0.8"') + starGem(sx, sy, R * 0.12, c) + sparkle(mx + R * 0.1, my - R * 0.18, R * 0.04);
    }
  }
}
const CLIPS: Style[] = [
  {
    key: 'clips', name: 'Clips', group: 'Hair Clips', base: 10, step: 4,
    vars: [
      { k: 'butterfly', n: 'Butterfly', c: '#c99bff', a: '#ff9ec7', o: 'butterfly', t: ['spring'] },
      { k: 'heart', n: 'Heart', c: '#ff4f7b', o: 'heart' },
      { k: 'snap', n: 'Rainbow Snap', c: '#ff6f91', o: 'snap', fixed: true },
      { k: 'glitter', n: 'Glitter Butterfly', name: 'Glitter Butterflies', c: '#7cc8ff', a: '#e6d4ff', o: 'butterfly' },
      { k: 'pearl', n: 'Pearl', c: '#f7efe9', o: 'pearl', fixed: true },
      { k: 'pinkglitter', n: 'Glitter Heart', c: '#ffb3c7', o: 'heart' },
      { k: 'bobby', n: 'Gold Bobby Pin', name: 'Gold Bobby Pins', c: '#f0b232', o: 'bobby', fixed: true },
      { k: 'moon', n: 'Moon & Star', c: '#c99bff', o: 'moon' },
      { k: 'scrunchie', n: 'Satin', name: 'Satin Scrunchie', c: '#ffb3c7', o: 'scrunchie' },
      { k: 'dotscrunchie', n: 'Polka', name: 'Polka Scrunchie', c: '#9b6bff', o: 'scrunchie', p: 'dots' },
    ],
    draw: (x, R, hy, v) => clips(x, R, hy, v),
  },
];

// ---------- sporty ----------
function visor(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const bandD = `M${p(-1.05, -0.3)} Q${p(0, -0.82)} ${p(1.05, -0.3)} L${p(1.06, -0.14)} Q${p(0, -0.66)} ${p(-1.06, -0.14)}Z`;
  const bill = `M${p(-0.76, -0.46)} Q${p(0, -0.64)} ${p(0.76, -0.46)} Q${p(0.66, -0.14)} ${p(0, -0.12)} Q${p(-0.66, -0.14)} ${p(-0.76, -0.46)}Z`;
  return P(bandD, '#fffaf5') + P(bandD, 'url(#g-shadeX)') + P(`M${p(-1.0, -0.26)} Q${p(0, -0.74)} ${p(1.0, -0.26)}`, 'none', sk(c, R * 0.035)) +
    P(bill, c, `opacity="0.6" stroke="${dark(c, 0.2)}" stroke-width="${f(R * 0.02)}"`) + P(bill, 'url(#g-glass)') + P(`M${p(-0.5, -0.46)} Q${p(-0.2, -0.54)} ${p(0.1, -0.55)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.7"'));
}
function bikeHelmet(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  let s = '';
  for (const sd of [-1, 1]) s += P(`M${p(sd * 0.92, -0.2)} Q${p(sd * 0.96, 0.5)} ${p(sd * 0.7, 0.78)} Q${p(sd * 0.5, 0.92)} ${p(sd * 0.2, 0.95)}`, 'none', sk('#4a4a5e', R * 0.03, 'opacity="0.9"'));
  s += `<rect x="${f(-R * 0.08)}" y="${f(hy + R * 0.9)}" width="${f(R * 0.16)}" height="${f(R * 0.08)}" rx="${f(R * 0.03)}" fill="#4a4a5e"/>`;
  const shell = `M${p(-1.1, -0.28)} C${p(-1.16, -1.42)} ${p(1.16, -1.42)} ${p(1.1, -0.28)} Q${p(0.6, -0.4)} ${p(0.3, -0.36)} L${p(0, -0.42)} L${p(-0.3, -0.36)} Q${p(-0.6, -0.4)} ${p(-1.1, -0.28)}Z`;
  s += brimShade(R, hy, -0.2, 0.9) + P(shell, c, `stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.02)}"`) + P(shell, 'url(#g-shadeX)');
  s += P(`M${p(-1.08, -0.32)} Q${p(-0.6, -0.44)} ${p(-0.3, -0.4)} L${p(0, -0.46)} L${p(0.3, -0.4)} Q${p(0.6, -0.44)} ${p(1.08, -0.32)}`, 'none', sk(v.a ?? '#fff', R * 0.05));
  for (const u of [-0.5, 0, 0.5]) {
    const vy = -0.86 - 0.12 * (1 - Math.abs(u));
    s += P(`M${p(u - 0.08, vy + 0.24)} Q${p(u * 1.05, vy - 0.06)} ${p(u + 0.08, vy + 0.24)} Q${p(u, vy + 0.16)} ${p(u - 0.08, vy + 0.24)}Z`, '#2d2a3a', 'opacity="0.75"');
  }
  s += P(`M${p(-0.72, -0.86)} Q${p(-0.45, -1.14)} ${p(-0.12, -1.18)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.35"'));
  if (v.o === 'stars') s += starGem(R * 0.62, hy - R * 0.62, R * 0.09, '#ffe680') + starGem(-R * 0.7, hy - R * 0.6, R * 0.06, '#fff');
  else s += P(`M${p(0.62, -0.84)} L${p(0.5, -0.66)} L${p(0.6, -0.66)} L${p(0.54, -0.5)} L${p(0.72, -0.72)} L${p(0.62, -0.72)}Z`, '#ffe06b', `stroke="#f0b232" stroke-width="${f(R * 0.01)}" stroke-linejoin="round"`);
  return s;
}
function bandana(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const tails = `M${p(0.94, -0.3)} Q${p(1.18, -0.2)} ${p(1.32, 0.08)} L${p(1.18, 0.12)} Q${p(1.1, -0.06)} ${p(0.96, -0.16)}Z M${p(0.94, -0.28)} Q${p(1.22, -0.36)} ${p(1.38, -0.22)} L${p(1.3, -0.1)} Q${p(1.16, -0.2)} ${p(0.98, -0.18)}Z`;
  let s = cloth(tails, dark(c, 0.08), x.p, 'y');
  const cap = `M${p(-1.07, -0.3)} C${p(-1.12, -1.34)} ${p(1.12, -1.34)} ${p(1.07, -0.3)} Q${p(0, -0.66)} ${p(-1.07, -0.3)}Z`;
  s += cloth(cap, c, x.p, 'x') + P(`M${p(-1.04, -0.34)} Q${p(0, -0.68)} ${p(1.04, -0.34)}`, 'none', sk(dark(c, 0.2), R * 0.05));
  s += P(`M${p(-0.6, -0.96)} Q${p(-0.3, -1.12)} ${p(0.1, -1.14)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.3"'));
  return s + circ(R * 0.98, hy - R * 0.24, R * 0.08, dark(c, 0.15)) + circ(R * 0.98, hy - R * 0.24, R * 0.08, 'url(#g-face)');
}
const SPORTY: Style[] = [
  { key: 'visor', name: 'Visor', group: 'Sporty', base: 15, tags: ['summer'], vars: [{ k: 'pink', n: 'Pink', c: '#ff7eb6' }, { k: 'aqua', n: 'Aqua', c: '#5fd3b5' }], draw: visor },
  { key: 'bandana', name: 'Bandana', group: 'Sporty', base: 15, vars: [{ k: 'red', n: 'Red', c: '#e8384f', p: 'dots' }, { k: 'blue', n: 'Blue Flower', c: '#4f9dff', p: 'flowers' }], draw: bandana },
  { key: 'sweatband', name: 'Sweatband', group: 'Sporty', base: 15, vars: [{ k: 'red', n: 'Red', c: '#e8384f', a: '#fff' }, { k: 'blue', n: 'Blue', c: '#4f9dff', a: '#fff', m: 'star' }, { k: 'lime', n: 'Lime', c: '#b6e36b', a: '#2d2a3a' }], draw: sweatband },
  { key: 'sportband', name: 'Sports Headband', group: 'Sporty', base: 15, vars: [{ k: 'black', n: 'Bolt', c: '#2d2a3a', o: 'thin', m: 'bolt' }, { k: 'pink', n: 'Pink', c: '#ff7eb6', o: 'thin', m: 'heart' }], draw: sweatband },
  { key: 'helmet', name: 'Bike Helmet', group: 'Sporty', base: 30, vars: [{ k: 'sky', n: 'Lightning', c: '#4f9dff', a: '#ffe06b' }, { k: 'pink', n: 'Starry', c: '#ff7eb6', a: '#fff', o: 'stars' }, { k: 'lime', n: 'Racer', c: '#b6e36b', a: '#2d2a3a' }], draw: bikeHelmet },
];

// ---------- silly hats ----------
function sillyHat(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  switch (v.o) {
    case 'frog': {
      const dome = domeD(p, 1.06, -0.3, -1.1, 0.12);
      let s = P(dome, c) + P(dome, 'url(#g-shadeX)');
      for (const sd of [-1, 1]) s += circ(sd * R * 0.44, hy - R * 1.08, R * 0.26, c) + circ(sd * R * 0.44, hy - R * 1.08, R * 0.26, 'url(#g-face)') + circ(sd * R * 0.44, hy - R * 1.1, R * 0.17, '#fff') + circ(sd * R * 0.44 + sd * R * 0.02, hy - R * 1.08, R * 0.09, '#2d2a3a') + circ(sd * R * 0.44 - R * 0.02, hy - R * 1.13, R * 0.035, '#fff');
      s += ell(-R * 0.6, hy - R * 0.62, R * 0.09, R * 0.05, '#ff9ec7', 'opacity="0.8"') + ell(R * 0.6, hy - R * 0.62, R * 0.09, R * 0.05, '#ff9ec7', 'opacity="0.8"');
      return s + P(`M${p(-0.3, -0.72)} Q${p(0, -0.56)} ${p(0.3, -0.72)}`, 'none', sk(dark(c, 0.35), R * 0.03)) + P(`M${p(-1.04, -0.34)} Q${p(0, -0.24)} ${p(1.04, -0.34)}`, 'none', sk(dark(c, 0.15), R * 0.05));
    }
    case 'mushroom': {
      const capD = `M${p(-1.32, -0.4)} C${p(-1.34, -1.46)} ${p(1.34, -1.46)} ${p(1.32, -0.4)} Q${p(0, -0.6)} ${p(-1.32, -0.4)}Z`;
      let s = brimShade(R, hy, -0.2, 1.0) + P(`M${p(-1.24, -0.44)} Q${p(0, -0.6)} ${p(1.24, -0.44)} Q${p(0, -0.32)} ${p(-1.24, -0.44)}Z`, '#f4ead9') + P(capD, c) + P(capD, 'url(#g-shadeY)');
      for (const [a, b, r] of [[-0.7, -0.8, 0.16], [0.1, -1.08, 0.2], [0.75, -0.75, 0.14], [-0.28, -0.62, 0.1], [0.42, -0.56, 0.09], [-0.4, -1.08, 0.1]]) s += ell(a * R, hy + b * R, r * R, r * R * 0.85, '#fffaf5');
      return s + P(`M${p(-0.8, -1.0)} Q${p(-0.5, -1.2)} ${p(-0.2, -1.24)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.35"'));
    }
    case 'bee': {
      const dome = domeD(p, 1.06, -0.3, -1.12, 0.12);
      let s = '';
      for (const sd of [-1, 1]) s += P(`M${p(sd * 0.24, -1.06)} Q${p(sd * 0.3, -1.36)} ${p(sd * 0.46, -1.48)}`, 'none', sk('#2d2a3a', R * 0.035)) + circ(sd * R * 0.47, hy - R * 1.5, R * 0.08, '#2d2a3a') + circ(sd * R * 0.45, hy - R * 1.52, R * 0.025, '#fff', 'opacity="0.7"');
      s += P(dome, c) + P(dome, 'url(#g-shadeX)');
      for (const [y1, y2] of [[-0.5, -0.64], [-0.8, -0.94]] as [number, number][]) {
        const w = (y: number) => 1.04 * Math.sqrt(Math.max(0, 1 - ((y + 0.3) / 0.84) ** 2));
        s += P(`M${p(-w(y1), y1)} Q${p(0, y1 + 0.08)} ${p(w(y1), y1)} L${p(w(y2), y2)} Q${p(0, y2 + 0.08)} ${p(-w(y2), y2)}Z`, '#2d2a3a');
      }
      for (const sd of [-1, 1]) s += ell(sd * R * 0.82, hy - R * 1.0, R * 0.2, R * 0.12, '#e8f6ff', `opacity="0.85" stroke="#bfe0f5" stroke-width="${f(R * 0.012)}" ${rot(sd * -30, sd * R * 0.82, hy - R * 1.0)}`);
      return s;
    }
    case 'cupcake': {
      let s = '';
      const wrap = `M${p(-0.98, -0.3)} L${p(-0.86, -0.7)} L${p(0.86, -0.7)} L${p(0.98, -0.3)} Q${p(0, -0.5)} ${p(-0.98, -0.3)}Z`;
      s += P(wrap, '#7cc8ff') + P(wrap, 'url(#g-shadeX)');
      for (let i = -4; i <= 4; i++) s += line(i * 0.2 * R, hy - R * 0.68, i * 0.23 * R, hy - R * (0.36 + 0.1 * (1 - (i / 4) ** 2)), '#5ab0ef', R * 0.025);
      for (const [a, b, r] of [[-0.68, -0.76, 0.22], [0.68, -0.76, 0.22], [-0.34, -0.86, 0.26], [0.34, -0.86, 0.26], [0, -0.92, 0.26], [-0.2, -1.14, 0.24], [0.2, -1.14, 0.24], [0, -1.34, 0.18]]) s += circ(a * R, hy + b * R, r * R, c, `stroke="${dark(c, 0.12)}" stroke-width="${f(R * 0.012)}"`) + circ(a * R - r * R * 0.3, hy + b * R - r * R * 0.35, r * R * 0.25, '#fff', 'opacity="0.5"');
      const cs = ['#ffd36b', '#7cc8ff', '#fff', '#5fd3b5', '#ff4f8b'];
      for (let i = 0; i < 12; i++) {
        const a = -0.7 + ((i * 0.618) % 1) * 1.4, b = -0.8 - ((i * 0.7548) % 1) * 0.45;
        s += `<rect x="${f(a * R)}" y="${f(hy + b * R)}" width="${f(R * 0.06)}" height="${f(R * 0.02)}" rx="${f(R * 0.01)}" fill="${cs[i % 5]}" ${rot(i * 37, a * R, hy + b * R)}/>`;
      }
      return s + circ(0, hy - R * 1.52, R * 0.12, '#e8384f') + circ(0, hy - R * 1.52, R * 0.12, 'url(#g-face)') + circ(-R * 0.04, hy - R * 1.56, R * 0.03, '#fff') + P(`M${p(0.02, -1.62)} Q${p(0.06, -1.74)} ${p(0.16, -1.76)}`, 'none', sk('#5f8f3a', R * 0.025));
    }
    case 'chick': {
      const dome = domeD(p, 1.06, -0.3, -1.14, 0.12);
      let s = P(dome, c) + P(dome, 'url(#g-shadeX)');
      for (const [a, deg] of [[-0.08, -20], [0.04, 10], [0.14, 35]]) s += ell(a * R, hy - R * 1.18, R * 0.05, R * 0.14, c, rot(deg, a * R, hy - R * 1.12));
      for (const sd of [-1, 1]) s += circ(sd * R * 0.3, hy - R * 0.82, R * 0.07, '#2d2a3a') + circ(sd * R * 0.3 - R * 0.02, hy - R * 0.85, R * 0.025, '#fff') + ell(sd * R * 0.52, hy - R * 0.68, R * 0.09, R * 0.05, '#ff9ec7', 'opacity="0.7"');
      s += P(`M${p(-0.14, -0.7)} Q${p(0, -0.78)} ${p(0.14, -0.7)} L${p(0, -0.54)}Z`, '#ffab3d', `stroke="#e8862a" stroke-width="${f(R * 0.012)}" stroke-linejoin="round"`);
      return s + P(`M${p(-1.04, -0.34)} Q${p(0, -0.24)} ${p(1.04, -0.34)}`, 'none', sk(dark(c, 0.12), R * 0.05));
    }
    default: {
      // strawberry
      const dome = domeD(p, 1.08, -0.3, -1.12, 0.12);
      let s = P(dome, c) + P(dome, 'url(#g-shadeX)');
      [-0.46, -0.64, -0.82, -0.98].forEach((yy, row) => {
        const half = Math.sqrt(Math.max(0, 1 - ((yy + 0.3) / 0.84) ** 2)) * 1.0 - 0.1;
        for (let xx = -half + (row % 2 ? 0.12 : 0.02); xx <= half; xx += 0.24) {
          s += ell(xx * R, hy + yy * R, R * 0.025, R * 0.038, '#ffe680') + ell(xx * R - R * 0.008, hy + yy * R - R * 0.012, R * 0.008, R * 0.012, '#fff', 'opacity="0.8"');
        }
      });
      for (const [deg, len] of [[-168, 0.34], [-140, 0.3], [-112, 0.26], [-68, 0.26], [-40, 0.3], [-12, 0.34], [-90, 0.2]] as [number, number][]) {
        s += leaf(0, hy - R * 1.04, R * len, deg, deg === -90 ? '#7ccf86' : Math.abs(deg + 90) > 60 ? '#5fae6b' : '#6fc47c');
      }
      return s + P(`M${p(0, -1.08)} Q${p(0.02, -1.3)} ${p(0.12, -1.36)}`, 'none', sk('#4f8a3a', R * 0.05)) + P(`M${p(-0.66, -0.66)} Q${p(-0.5, -0.92)} ${p(-0.2, -1.0)}`, 'none', sk('#fff', R * 0.05, 'opacity="0.3"'));
    }
  }
}
const SILLY: Style[] = [
  {
    key: 'silly', name: 'Hat', group: 'Silly Hats', base: 25, step: 5,
    vars: [
      { k: 'strawberry', n: 'Strawberry', c: '#ff4f6d', t: ['summer'] },
      { k: 'frog', n: 'Froggy', c: '#7cd36b', o: 'frog', t: ['spring'] },
      { k: 'mushroom', n: 'Mushroom', c: '#e8384f', o: 'mushroom', t: ['fall'] },
      { k: 'bee', n: 'Bumblebee', c: '#ffd24a', o: 'bee', t: ['spring'] },
      { k: 'cupcake', n: 'Cupcake', c: '#ffd9e8', o: 'cupcake' },
      { k: 'chick', n: 'Baby Chick', c: '#ffe680', o: 'chick', t: ['spring'] },
    ],
    draw: sillyHat,
  },
  { key: 'dinohood', name: 'Hood', group: 'Silly Hats', base: 40, tags: ['fall', 'winter'], vars: [{ k: 'green', n: 'Dino', c: '#6fc47c', a: '#ffab5e' }, { k: 'blue', n: 'Dragon', c: '#7cc8ff', a: '#c99bff' }], draw: dinoHood },
];

// ---------- cool hats, headphones and hoods ----------
function fedora(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const crownP = `M${p(-0.66, -0.62)} C${p(-0.7, -1.12)} ${p(-0.5, -1.36)} ${p(-0.2, -1.3)} Q${p(0, -1.18)} ${p(0.2, -1.3)} C${p(0.5, -1.36)} ${p(0.7, -1.12)} ${p(0.66, -0.62)}Z`;
  let s = brimShade(R, hy, -0.3, 0.85) + cloth(crownP, c, x.p, 'x') + P(`M${p(0, -1.18)} Q${p(-0.04, -1.0)} ${p(0, -0.86)}`, 'none', sk(dark(c, 0.22), R * 0.025, 'opacity="0.5"'));
  const bandD = `M${p(-0.67, -0.66)} Q${p(0, -0.6)} ${p(0.67, -0.66)} L${p(0.68, -0.84)} Q${p(0, -0.78)} ${p(-0.68, -0.84)}Z`;
  s += P(bandD, v.a ?? '#2d2a3a') + P(bandD, 'url(#g-shadeX)');
  if (v.o === 'feather') s += P(`M${p(0.42, -0.74)} C${p(0.5, -0.98)} ${p(0.66, -1.12)} ${p(0.8, -1.18)} C${p(0.74, -1.0)} ${p(0.62, -0.84)} ${p(0.42, -0.74)}Z`, '#e8384f') + P(`M${p(0.44, -0.76)} Q${p(0.62, -0.96)} ${p(0.78, -1.14)}`, 'none', sk('#fff', R * 0.012, 'opacity="0.7"'));
  const brimP = `M${p(-1.2, -0.66)} Q${p(-1.22, -0.48)} ${p(-0.9, -0.46)} Q${p(0, -0.38)} ${p(0.9, -0.46)} Q${p(1.22, -0.48)} ${p(1.2, -0.66)} Q${p(0, -0.74)} ${p(-1.2, -0.66)}Z`;
  s += P(brimP, dark(c, 0.08)) + P(brimP, 'url(#g-shadeY)') + P(`M${p(-1.0, -0.56)} Q${p(0, -0.44)} ${p(1.0, -0.56)}`, 'none', sk(light(c, 0.3), R * 0.014, 'opacity="0.6"'));
  return s;
}
function newsboy(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const crownP = `M${p(-1.06, -0.42)} C${p(-1.22, -1.1)} ${p(-0.4, -1.32)} ${p(0.2, -1.26)} C${p(0.92, -1.22)} ${p(1.26, -0.9)} ${p(1.08, -0.42)} Q${p(0, -0.54)} ${p(-1.06, -0.42)}Z`;
  let s = cloth(crownP, c, x.p, 'y');
  for (const [a, b] of [[-0.9, -0.5], [-0.4, -0.5], [0.3, -0.5], [0.85, -0.5], [1.1, -0.8], [-1.05, -0.85]]) s += P(`M${p(0.05, -1.18)} Q${p((a + 0.05) / 2 + a * 0.1, (b - 1.18) / 2 - 0.05)} ${p(a, b)}`, 'none', sk(dark(c, 0.2), R * 0.016, 'opacity="0.45"'));
  s += circ(R * 0.05, hy - R * 1.18, R * 0.055, dark(c, 0.2)) + P(`M${p(-0.7, -0.92)} Q${p(-0.4, -1.16)} ${p(-0.05, -1.18)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.25"'));
  const bill = `M${p(-0.72, -0.46)} Q${p(0, -0.58)} ${p(0.72, -0.46)} Q${p(0.6, -0.24)} ${p(0, -0.22)} Q${p(-0.6, -0.24)} ${p(-0.72, -0.46)}Z`;
  return s + brimShade(R, hy, -0.16, 0.6) + P(bill, dark(c, 0.18)) + P(bill, 'url(#g-shadeY)') + P(`M${p(-0.6, -0.4)} Q${p(0, -0.3)} ${p(0.6, -0.4)}`, 'none', sk(light(c, 0.3), R * 0.012, `stroke-dasharray="${f(R * 0.03)} ${f(R * 0.025)}" opacity="0.7"`));
}
function sweatband(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const thin = v.o === 'thin';
  const t = thin ? 0.1 : 0.22;
  const d = `M${p(-1.07, -0.44 + (0.22 - t))} Q${p(0, -0.72 + (0.22 - t))} ${p(1.07, -0.44 + (0.22 - t))} L${p(1.07, -0.22)} Q${p(0, -0.5)} ${p(-1.07, -0.22)}Z`;
  let s = P(d, c) + P(d, 'url(#g-shadeX)');
  if (!thin) {
    for (let i = 0; i < 30; i++) {
      const u = ((i * 0.618) % 1) * 2 - 1, w = (i * 0.7548) % 1;
      s += circ(u * R, hy + (-0.4 - 0.14 * (1 - u * u) + w * 0.16) * R, R * 0.012, dark(c, 0.15), 'opacity="0.5"');
    }
    for (const k of [0.3, 0.7]) s += P(`M${p(-1.07, -0.44 + k * 0.22)} Q${p(0, -0.72 + k * 0.22)} ${p(1.07, -0.44 + k * 0.22)}`, 'none', sk(v.a ?? '#fff', R * 0.035));
  } else s += P(`M${p(-1.0, -0.3)} Q${p(0, -0.56)} ${p(1.0, -0.3)}`, 'none', sk(light(c, 0.4), R * 0.015, 'opacity="0.7"'));
  if (v.m) s += motifAt(v.m, R * 0.45, hy - R * (thin ? 0.43 : 0.47), R * (thin ? 0.07 : 0.1));
  return s;
}
function headphones(x: WearCtx, R: number, hy: number, v: V): string {
  const c = x.c;
  const a = v.a ?? '#4f9dff';
  let s = `<path d="${topArc(R, hy, 1.06, 1.04, 0.08, 184, 356)}" ${sk(dark(c, 0.2), R * 0.11)}/><path d="${topArc(R, hy, 1.06, 1.04, 0.07, 184, 356)}" ${sk(c, R * 0.08)}/>`;
  s += `<path d="${topArc(R, hy, 1.0, 0.99, 0.06, 236, 304)}" ${sk(a, R * 0.1)}/><path d="${topArc(R, hy, 0.99, 0.98, 0.05, 240, 268)}" ${sk('#fff', R * 0.02, 'opacity="0.5"')}/>`;
  if (v.o === 'kitty') for (const sd of [-1, 1]) {
    const p = at(R, hy);
    s += P(`M${p(sd * 0.36, -1.0)} L${p(sd * 0.56, -1.34)} L${p(sd * 0.76, -0.86)}Z`, c, `stroke="${dark(c, 0.2)}" stroke-width="${f(R * 0.014)}" stroke-linejoin="round"`) + P(`M${p(sd * 0.46, -0.98)} L${p(sd * 0.56, -1.2)} L${p(sd * 0.68, -0.92)}Z`, '#fff');
  }
  for (const sd of [-1, 1]) {
    const cx = sd * R * 1.0, cy = hy + R * 0.12;
    s += `<rect x="${f(cx - R * 0.06)}" y="${f(cy - R * 0.4)}" width="${f(R * 0.12)}" height="${f(R * 0.2)}" rx="${f(R * 0.04)}" fill="url(#g-silver)"/>`;
    s += ell(cx, cy, R * 0.2, R * 0.29, dark(c, 0.15)) + ell(cx + sd * R * 0.03, cy, R * 0.17, R * 0.26, c) + ell(cx + sd * R * 0.03, cy, R * 0.17, R * 0.26, 'url(#g-face)');
    s += ell(cx + sd * R * 0.04, cy, R * 0.09, R * 0.15, a) + ell(cx - sd * R * 0.0 - R * 0.04, cy - R * 0.12, R * 0.035, R * 0.06, '#fff', 'opacity="0.5"');
    if (v.o === 'kitty') s += P(heartD(cx + sd * R * 0.04, cy - R * 0.07, R * 0.11), '#fff', 'opacity="0.9"');
  }
  if (v.o === 'mic') {
    const p = at(R, hy);
    s += P(`M${p(-0.92, 0.3)} Q${p(-0.85, 0.6)} ${p(-0.42, 0.6)}`, 'none', sk('#4a4a5e', R * 0.035)) + ell(-R * 0.38, hy + R * 0.6, R * 0.07, R * 0.05, '#2d2a3a') + circ(-R * 0.4, hy + R * 0.58, R * 0.015, '#fff', 'opacity="0.6"');
  }
  return s;
}
function pirateHat(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const d = `M${p(-1.25, -0.6)} C${p(-1.0, -1.0)} ${p(-0.8, -1.38)} ${p(-0.5, -1.2)} Q${p(0, -1.44)} ${p(0.5, -1.2)} C${p(0.8, -1.38)} ${p(1.0, -1.0)} ${p(1.25, -0.6)} Q${p(0, -0.42)} ${p(-1.25, -0.6)}Z`;
  let s = brimShade(R, hy, -0.24, 0.9) + P(d, c) + P(d, 'url(#g-shadeY)');
  s += P(`M${p(-1.2, -0.62)} C${p(-0.98, -0.98)} ${p(-0.8, -1.32)} ${p(-0.5, -1.15)} Q${p(0, -1.38)} ${p(0.5, -1.15)} C${p(0.8, -1.32)} ${p(0.98, -0.98)} ${p(1.2, -0.62)}`, 'none', sk('#f0b232', R * 0.04));
  // a friendly little skull
  const sy = hy - R * 0.86;
  s += line(-R * 0.2, sy - R * 0.05, R * 0.2, sy + R * 0.2, '#fffaf5', R * 0.05) + line(R * 0.2, sy - R * 0.05, -R * 0.2, sy + R * 0.2, '#fffaf5', R * 0.05);
  s += circ(0, sy, R * 0.14, '#fffaf5') + `<rect x="${f(-R * 0.08)}" y="${f(sy + R * 0.06)}" width="${f(R * 0.16)}" height="${f(R * 0.1)}" rx="${f(R * 0.03)}" fill="#fffaf5"/>`;
  s += circ(-R * 0.055, sy - R * 0.01, R * 0.035, c) + circ(R * 0.055, sy - R * 0.01, R * 0.035, c) + ell(0, sy + R * 0.06, R * 0.015, R * 0.02, c) + P(`M${f(-R * 0.05)} ${f(sy + R * 0.1)} Q0 ${f(sy + R * 0.13)} ${f(R * 0.05)} ${f(sy + R * 0.1)}`, 'none', sk(c, R * 0.012));
  return s + P(`M${p(-0.8, -0.9)} Q${p(-0.6, -1.12)} ${p(-0.5, -1.1)}`, 'none', sk('#fff', R * 0.03, 'opacity="0.25"'));
}
const holeD = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
function heroBand(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const tails = `M${p(1.0, 0.06)} Q${p(1.22, 0.16)} ${p(1.34, 0.46)} L${p(1.22, 0.5)} Q${p(1.14, 0.28)} ${p(1.0, 0.2)}Z M${p(1.0, 0.08)} Q${p(1.26, 0.0)} ${p(1.42, 0.14)} L${p(1.36, 0.26)} Q${p(1.2, 0.14)} ${p(1.0, 0.2)}Z`;
  let s = P(tails, dark(c, 0.12)) + P(tails, 'url(#g-shadeX)');
  const outer = `M${p(-1.04, -0.08)} Q${p(0, -0.26)} ${p(1.04, -0.08)} L${p(1.04, 0.3)} C${p(0.7, 0.42)} ${p(0.36, 0.46)} ${p(0.16, 0.33)} Q${p(0, 0.24)} ${p(-0.16, 0.33)} C${p(-0.36, 0.46)} ${p(-0.7, 0.42)} ${p(-1.04, 0.3)}Z`;
  const holes = holeD(-R * 0.38, hy + R * 0.12, R * 0.2, R * 0.19) + holeD(R * 0.38, hy + R * 0.12, R * 0.2, R * 0.19);
  s += `<path d="${outer} ${holes}" fill="${c}" fill-rule="evenodd"/><path d="${outer} ${holes}" fill="url(#g-shadeY)" fill-rule="evenodd"/>`;
  s += `<path d="${holes}" ${sk(dark(c, 0.3), R * 0.025)}/>`;
  if (v.o === 'star') s += starGem(0, hy - R * 0.06, R * 0.07, '#ffe680');
  return s + circ(R * 1.02, hy + R * 0.14, R * 0.07, dark(c, 0.15)) + P(`M${p(-0.9, -0.06)} Q${p(-0.5, -0.18)} ${p(-0.2, -0.18)}`, 'none', sk('#fff', R * 0.025, 'opacity="0.35"'));
}
function dinoHood(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const a = v.a ?? '#ffab5e';
  let s = '';
  for (const [u, w, deg] of [[-0.66, -1.08, -50], [-0.36, -1.24, -22], [0, -1.3, 0], [0.36, -1.24, 22], [0.66, -1.08, 50]] as [number, number, number][]) {
    s += grp(`translate(${f(u * R)} ${f(hy + w * R)}) rotate(${deg})`, P(`M${f(-R * 0.11)} ${f(R * 0.05)} Q0 ${f(-R * 0.26)} ${f(R * 0.11)} ${f(R * 0.05)}Z`, a, `stroke="${dark(a, 0.2)}" stroke-width="${f(R * 0.012)}"`));
  }
  const hood = `M${p(-1.12, 0.6)} C${p(-1.3, -0.5)} ${p(-0.8, -1.3)} ${p(0, -1.3)} C${p(0.8, -1.3)} ${p(1.3, -0.5)} ${p(1.12, 0.6)} Q${p(1.0, 0.72)} ${p(0.9, 0.6)} C${p(0.98, -0.1)} ${p(0.6, -0.62)} ${p(0, -0.64)} C${p(-0.6, -0.62)} ${p(-0.98, -0.1)} ${p(-0.9, 0.6)} Q${p(-1.0, 0.72)} ${p(-1.12, 0.6)}Z`;
  s += cloth(hood, c, x.p, 'x');
  for (const [u, w] of [[-0.4, -0.66], [-0.2, -0.64], [0, -0.64], [0.2, -0.64], [0.4, -0.66]]) s += P(`M${p(u - 0.07, w + 0.01)} L${p(u, w + 0.11)} L${p(u + 0.07, w + 0.01)}Z`, '#fffaf5');
  for (const sd of [-1, 1]) s += circ(sd * R * 0.32, hy - R * 0.98, R * 0.1, '#fff') + circ(sd * R * 0.32, hy - R * 0.97, R * 0.055, '#2d2a3a') + circ(sd * R * 0.31 - R * 0.02, hy - R * 1.0, R * 0.02, '#fff') + ell(sd * R * 0.62, hy - R * 0.8, R * 0.06, R * 0.04, '#ff9ec7', 'opacity="0.7"');
  for (const [u, w] of [[-0.7, -0.4], [0.75, -0.2], [-0.9, 0.2]]) s += circ(u * R, hy + w * R, R * 0.06, light(c, 0.3), 'opacity="0.8"');
  return s + P(`M${p(-0.72, -0.96)} Q${p(-0.5, -1.18)} ${p(-0.2, -1.22)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.3"'));
}
const COOL_HATS: Style[] = [
  { key: 'fedora', name: 'Fedora', group: 'Cool Hats', base: 30, vars: [{ k: 'grey', n: 'Feather', c: '#6b7390', a: '#2d2a3a', o: 'feather' }, { k: 'caramel', n: 'Caramel', c: '#c9a27e', a: '#8a5a3c' }, { k: 'midnight', n: 'Midnight', c: '#2d2a3a', a: '#e8384f' }], draw: fedora },
  { key: 'newsboy', name: 'Newsboy Cap', group: 'Cool Hats', base: 25, tags: ['fall'], vars: [{ k: 'grey', n: 'Grey Check', c: '#9aa3b5', p: 'check' }, { k: 'cocoa', n: 'Cocoa', c: '#8a5a3c', p: 'check' }], draw: newsboy },
];
const HEADPHONES: Style[] = [
  {
    key: 'phones', name: 'Headphones', group: 'Headphones', base: 25,
    vars: [{ k: 'midnight', n: 'Cool', c: '#2d2a3a', a: '#4f9dff' }, { k: 'kitty', n: 'Kitty', c: '#ff9ec7', a: '#fff', o: 'kitty' }, { k: 'gamer', n: 'Gamer', c: '#3fbf8f', a: '#2d2a3a', o: 'mic' }, { k: 'lemon', n: 'Lemon', c: '#ffd36b', a: '#ff7eb6' }],
    draw: headphones,
  },
];

// ---------- building the catalog ----------
function build(styles: Style[]): WearDef[] {
  const seen: Record<string, number> = {};
  return styles.flatMap((st) => st.vars.map((v) => {
    const gi = (seen[st.group] = (seen[st.group] ?? -1) + 1);
    const price = v.price ?? (gi < 3 ? 0 : Math.min(st.max ?? 120, st.base + (gi - 3) * (st.step ?? 5)));
    const tags = [...new Set([...(st.tags ?? []), ...(v.t ?? [])])] as Season[];
    const def: WearDef = {
      id: `head-${st.key}-${v.k}`,
      name: v.name ?? `${v.n} ${st.name}`.trim(),
      slot: 'head',
      group: st.group,
      price,
      color: v.c,
      tags: tags.length ? tags : undefined,
      fixed: v.fixed ?? st.fixed,
      head: (x) => st.draw(x, x.b.R, x.b.headY, v),
    };
    if (v.p) def.pattern = v.p;
    return def;
  }));
}

export const HEAD_MORE: WearDef[] = build([
  ...BOWS, ...HEADBANDS, ...FLOWER_CROWNS, ...TIARAS, ...CROWNS, ...BEANIES, ...EAR_WARMERS, ...SUN_HATS, ...BUCKET_HATS,
  ...CAPS, ...BERETS, ...COOL_HATS, ...HEADPHONES, ...DRESS_UP, ...HOLIDAY, ...MAGIC, ...ANIMAL_EARS, ...CLIPS, ...SPORTY, ...SILLY,
]);
