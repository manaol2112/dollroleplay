// Collectible stickers: over a hundred little drawings in themed sets, drawn as puffy die-cut stickers.
// Each design is a function of a drawing kit. The same design is drawn several times: once as a shadow,
// once as the thick white die-cut border (every shape stroked fat and white), once in color, and once as
// a mask so the glossy shine only lands on the art. Sparkle stickers also get a moving holographic sheen.
// Nothing here touches the page, so it can be tested.
import { heartD, sparkleD, starD } from './wear/base';

export type Rarity = 'common' | 'rare' | 'sparkle';
export interface StickerDef { id: string; name: string; set: string; rarity: Rarity }
export interface StickerSet { id: string; name: string; color: string }

export const STICKER_SETS: StickerSet[] = [
  { id: 'animals', name: 'Cute Animals', color: '#ffb3d1' },
  { id: 'treats', name: 'Sweet Treats', color: '#ffc3a0' },
  { id: 'space', name: 'Outer Space', color: '#b9b3ff' },
  { id: 'sea', name: 'Under the Sea', color: '#8fd3ff' },
  { id: 'fashion', name: 'Fashion', color: '#ffa8dc' },
  { id: 'music', name: 'Music', color: '#c99bff' },
  { id: 'sports', name: 'Sports', color: '#8fe3c4' },
  { id: 'garden', name: 'Garden', color: '#a8e6a0' },
  { id: 'fairy', name: 'Fairy Tale', color: '#ffd59e' },
  { id: 'seasons', name: 'Seasons', color: '#ffe08a' },
  { id: 'pets', name: 'Pets', color: '#ffc9a8' },
  { id: 'magic', name: 'Rainbow Magic', color: '#f5b3ff' },
];

// ---------------- drawing kit ----------------
type Mode = 'color' | 'cut' | 'shadow' | 'sil' | 'mask';
const B = 10; // die-cut border: every shape is stroked this wide, so the white edge is half of it
const SHADOW = '#7a2a55';
const SIL = '#ddd0e8';
const INK = '#4a2546';
const DARK = '#4a3f5e';
const f = (n: number) => String(Math.round(n * 10) / 10);
const ROUND = (col: string, w = 5) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round"`;
const OUT = (col: string, w = 1.5) => `stroke="${col}" stroke-width="${w}"`;

interface FaceOpts { gap?: number; my?: number; mouth?: 'smile' | 'cat' | 'open' | 'o' | 'none'; eyes?: 'dot' | 'happy' | 'sleep'; blush?: string | false; ink?: string }

class Kit {
  private n = 0;
  constructor(readonly m: Mode, private readonly u: string, private readonly cut = '#fff') {}

  private fa(fill: string, extra: string): string {
    switch (this.m) {
      case 'color': return `fill="${fill}"${extra ? ' ' + extra : ''}`;
      case 'cut': return `fill="${this.cut}" stroke="${this.cut}" stroke-width="${B}" stroke-linejoin="round"`;
      case 'shadow': return `fill="${SHADOW}" stroke="${SHADOW}" stroke-width="${B + 2}" stroke-linejoin="round"`;
      case 'sil': return `fill="${SIL}"`;
      case 'mask': return 'fill="#fff"';
    }
  }

  private la(col: string, w: number): string {
    const base = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
    switch (this.m) {
      case 'color': return `${base} stroke="${col}" stroke-width="${f(w)}"`;
      case 'cut': return `${base} stroke="${this.cut}" stroke-width="${f(w + B)}"`;
      case 'shadow': return `${base} stroke="${SHADOW}" stroke-width="${f(w + B + 2)}"`;
      case 'sil': return `${base} stroke="${SIL}" stroke-width="${f(w)}"`;
      case 'mask': return `${base} stroke="#fff" stroke-width="${f(w)}"`;
    }
  }

  c = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${this.fa(fill, extra)}/>`;
  e = (x: number, y: number, rx: number, ry: number, fill: string, rot = 0, extra = '') =>
    `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}"${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ''} ${this.fa(fill, extra)}/>`;
  r = (x: number, y: number, w: number, h: number, rx: number, fill: string, rot = 0, extra = '') =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}"${rot ? ` transform="rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})"` : ''} ${this.fa(fill, extra)}/>`;
  p = (d: string, fill: string, extra = '') => `<path d="${d}" ${this.fa(fill, extra)}/>`;
  /** A stroked line that is part of the sticker's shape (it gets a white border too). */
  l = (d: string, col: string, w: number) => `<path d="${d}" ${this.la(col, w)}/>`;
  g = (t: string, ...kids: string[]) => `<g transform="${t}">${kids.join('')}</g>`;
  /** Details (eyes, spots, stripes) only show in color; the border and silhouette ignore them. */
  d = (...kids: string[]) => (this.m === 'color' ? kids.join('') : '');
  /** Color details clipped to a shape (stripes on a bee, water in a bowl). */
  inside = (shape: (k: Kit) => string, ...kids: string[]) => {
    if (this.m !== 'color') return '';
    const id = `${this.u}i${this.n++}`;
    return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${shape(new Kit('mask', this.u))}</mask><g mask="url(#${id})">${kids.join('')}</g>`;
  };
  /** A soft white shine spot. */
  shine = (x: number, y: number, rx: number, ry: number, rot = -30, op = 0.75) => this.d(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(x)} ${f(y)})" fill="#fff" opacity="${op}"/>`);
  /** A cute face: two eyes, a little mouth and pink cheeks. */
  face = (x: number, y: number, s = 1, o: FaceOpts = {}) => {
    if (this.m !== 'color') return '';
    const gap = (o.gap ?? 7) * s;
    const ink = o.ink ?? INK;
    let out = '';
    for (const sx of [-1, 1]) {
      const ex = x + sx * gap;
      if ((o.eyes ?? 'dot') === 'dot') {
        out += `<ellipse cx="${f(ex)}" cy="${f(y)}" rx="${f(2.4 * s)}" ry="${f(3 * s)}" fill="${ink}"/><circle cx="${f(ex + 0.8 * s)}" cy="${f(y - 1.1 * s)}" r="${f(0.95 * s)}" fill="#fff"/>`;
      } else {
        const up = o.eyes === 'happy';
        out += `<path d="M${f(ex - 2.6 * s)} ${f(y + (up ? 1 : -0.6) * s)} Q${f(ex)} ${f(y + (up ? -2.8 : 2.6) * s)} ${f(ex + 2.6 * s)} ${f(y + (up ? 1 : -0.6) * s)}" fill="none" stroke="${ink}" stroke-width="${f(1.7 * s)}" stroke-linecap="round"/>`;
      }
    }
    const my = y + (o.my ?? 5) * s;
    const mouth = o.mouth ?? 'smile';
    const line = `fill="none" stroke="${ink}" stroke-width="${f(1.6 * s)}" stroke-linecap="round" stroke-linejoin="round"`;
    if (mouth === 'smile') out += `<path d="M${f(x - 2.6 * s)} ${f(my)} Q${f(x)} ${f(my + 2.8 * s)} ${f(x + 2.6 * s)} ${f(my)}" ${line}/>`;
    else if (mouth === 'cat') out += `<path d="M${f(x - 3.4 * s)} ${f(my)} Q${f(x - 1.7 * s)} ${f(my + 2.4 * s)} ${f(x)} ${f(my)} Q${f(x + 1.7 * s)} ${f(my + 2.4 * s)} ${f(x + 3.4 * s)} ${f(my)}" ${line}/>`;
    else if (mouth === 'open') out += `<path d="M${f(x - 3 * s)} ${f(my)} Q${f(x)} ${f(my + 5.5 * s)} ${f(x + 3 * s)} ${f(my)}Z" fill="#e0457b" stroke="${ink}" stroke-width="${f(1.2 * s)}" stroke-linejoin="round"/>`;
    else if (mouth === 'o') out += `<ellipse cx="${f(x)}" cy="${f(my + 1 * s)}" rx="${f(1.6 * s)}" ry="${f(2 * s)}" fill="${ink}"/>`;
    if (o.blush !== false) for (const sx of [-1, 1]) out += `<ellipse cx="${f(x + sx * (gap + 3.6 * s))}" cy="${f(y + 3.4 * s)}" rx="${f(3 * s)}" ry="${f(1.8 * s)}" fill="${o.blush ?? '#ff7eb6'}" opacity="0.5"/>`;
    return out;
  };
}

const spiral = (cx: number, cy: number, r0: number, r1: number, turns: number) => {
  const n = Math.round(turns * 28);
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
  }
  return d;
};
const poly = (cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => `${i ? 'L' : 'M'}${f(cx + Math.cos(rot + (i * Math.PI * 2) / n) * r)} ${f(cy + Math.sin(rot + (i * Math.PI * 2) / n) * r)}`).join('') + 'Z';
const ring = (n: number, fn: (i: number, deg: number) => string) => Array.from({ length: n }, (_, i) => fn(i, (i * 360) / n)).join('');
const sprinkles = (k: Kit, pts: [number, number, number][], cols = ['#fff', '#ffd36b', '#8fd3ff', '#9de8cf', '#c99bff']) =>
  k.d(...pts.map(([x, y, a], i) => k.r(x - 2.6, y - 0.9, 5.2, 1.8, 0.9, cols[i % cols.length], a)));
/** A row of little arcs, like fish scales. */
const scallop = (x0: number, x1: number, y: number, step: number) => {
  let d = `M${f(x0)} ${f(y)}`;
  for (let x = x0; x < x1; x += step) d += ` Q${f(x + step / 2)} ${f(y + step * 0.7)} ${f(x + step)} ${f(y)}`;
  return d;
};
const heelShape = 'M10 74 Q10 62 24 62 Q42 64 56 50 Q68 38 80 38 Q88 38 88 46 L88 54 Q78 56 72 66 Q64 80 46 80 L16 80 Q10 80 10 74Z';

type Design = (k: Kit) => string;

// [id, name, rarity, design]
type Entry = [string, string, Rarity, Design];

const ANIMALS: Entry[] = [
  ['bunny', 'Bunny', 'common', (k) =>
    k.e(38, 31, 7.5, 18, '#ffd6e7', -10) + k.e(62, 31, 7.5, 18, '#ffd6e7', 10) +
    k.d(k.e(38, 32, 3.6, 12, '#ff9ec7', -10), k.e(62, 32, 3.6, 12, '#ff9ec7', 10)) +
    k.e(50, 63, 27, 22, '#ffd6e7') + k.face(50, 61, 1.15, { mouth: 'cat' }) +
    k.d(k.r(47.8, 68.6, 4.4, 3.6, 1.2, '#fff', 0, OUT('#e7b9cf', 0.8)))],
  ['kitty', 'Kitty', 'common', (k) =>
    k.p('M24 52 L25 20 L46 36Z', '#ffc08a', ROUND('#ffc08a')) + k.p('M76 52 L75 20 L54 36Z', '#ffc08a', ROUND('#ffc08a')) +
    k.e(50, 60, 29, 23, '#ffc08a') +
    k.d(k.p('M29.5 42 L30 27 L40 36Z', '#ff9ec7'), k.p('M70.5 42 L70 27 L60 36Z', '#ff9ec7'),
      k.l('M50 38 L50 45 M43 39 L44.5 44.5 M57 39 L55.5 44.5', '#f29a5a', 2.6),
      k.l('M15 60 L27 62 M16 67 L27 66 M85 60 L73 62 M84 67 L73 66', INK, 1.2)) +
    k.face(50, 59, 1.1, { mouth: 'cat' })],
  ['bear', 'Teddy Bear', 'common', (k) =>
    k.c(28, 38, 10, '#c98a5e') + k.c(72, 38, 10, '#c98a5e') + k.d(k.c(28, 38, 5, '#eab48a'), k.c(72, 38, 5, '#eab48a')) +
    k.e(50, 60, 28, 24, '#c98a5e') + k.d(k.e(50, 68, 11, 8, '#f3d4b4'), k.e(50, 64.5, 3.6, 2.6, INK)) +
    k.face(50, 55, 1.1, { gap: 10, mouth: 'cat', my: 12.5 })],
  ['panda', 'Panda', 'sparkle', (k) =>
    k.c(28, 37, 9.5, DARK) + k.c(72, 37, 9.5, DARK) +
    k.e(50, 60, 28, 24, '#fbf8ff', 0, OUT('#e4d8ef')) +
    k.d(k.e(39, 57, 6.5, 8.5, DARK, 35), k.e(61, 57, 6.5, 8.5, DARK, -35), k.c(39.5, 56, 2.8, '#fff'), k.c(60.5, 56, 2.8, '#fff'),
      k.c(40, 56.4, 1.5, INK), k.c(60, 56.4, 1.5, INK), k.e(50, 66, 3.4, 2.4, DARK), k.l('M46.6 69 Q48.3 71.4 50 69 Q51.7 71.4 53.4 69', INK, 1.4),
      k.e(30, 67, 3.6, 2, '#ff9ec7', 0, 'opacity=".55"'), k.e(70, 67, 3.6, 2, '#ff9ec7', 0, 'opacity=".55"'))],
  ['fox', 'Fox', 'rare', (k) =>
    k.p('M20 50 L24 15 L46 34Z', '#ff9a52', ROUND('#ff9a52')) + k.p('M80 50 L76 15 L54 34Z', '#ff9a52', ROUND('#ff9a52')) +
    k.p('M14 46 Q18 30 50 32 Q82 30 86 46 Q82 66 50 84 Q18 66 14 46Z', '#ff9a52') +
    k.d(k.p('M27 41 L28 24 L39 34Z', '#5a3a4a'), k.p('M73 41 L72 24 L61 34Z', '#5a3a4a'),
      k.p('M14 46 Q30 58 50 62 Q70 58 86 46 Q82 66 50 84 Q18 66 14 46Z', '#fff4e6'), k.e(50, 70, 3.6, 2.6, INK)) +
    k.face(50, 51, 1.1, { gap: 12, mouth: 'cat', my: 19.5 })],
  ['piggy', 'Piggy', 'common', (k) =>
    k.p('M24 44 Q18 20 42 30Z', '#ffa3c0', ROUND('#ffa3c0', 4)) + k.p('M76 44 Q82 20 58 30Z', '#ffa3c0', ROUND('#ffa3c0', 4)) +
    k.c(50, 58, 28, '#ffb7cc') + k.d(k.e(50, 66, 11, 7.5, '#ff8fb1'), k.e(46.2, 66, 2, 3, '#d85f8a'), k.e(53.8, 66, 2, 3, '#d85f8a'), k.l('M46 77 Q50 79.5 54 77', INK, 1.5)) +
    k.face(50, 53, 1.1, { gap: 12, mouth: 'none' })],
  ['koala', 'Koala', 'common', (k) =>
    k.c(24, 42, 14, '#b9b4c9') + k.c(76, 42, 14, '#b9b4c9') + k.d(k.c(24, 42, 8, '#f4dbe8'), k.c(76, 42, 8, '#f4dbe8')) +
    k.e(50, 60, 26, 24, '#b9b4c9') + k.d(k.e(50, 63, 6, 8, DARK), k.e(48.4, 60, 1.6, 2.4, '#8a7f9e'), k.l('M46 74 Q50 76.5 54 74', INK, 1.5)) +
    k.face(50, 54, 1.1, { gap: 12, mouth: 'none' })],
  ['mouse', 'Mouse', 'common', (k) =>
    k.c(28, 34, 14, '#d9d2e6') + k.c(72, 34, 14, '#d9d2e6') + k.d(k.c(28, 34, 8.5, '#ffb7d3'), k.c(72, 34, 8.5, '#ffb7d3')) +
    k.e(50, 62, 24, 22, '#d9d2e6') +
    k.d(k.c(50, 67, 3, '#ff6f9f'), k.l('M21 65 L33 66.5 M22 71.5 L33 70 M79 65 L67 66.5 M78 71.5 L67 70', INK, 1.2)) +
    k.face(50, 59, 1.05, { gap: 9, mouth: 'cat', my: 10.5 })],
  ['penguin', 'Penguin', 'rare', (k) =>
    k.e(27, 62, 5.5, 13, '#4a5a8a', 25) + k.e(73, 62, 5.5, 13, '#4a5a8a', -25) +
    k.e(41, 85, 7, 3.5, '#ffab3d') + k.e(59, 85, 7, 3.5, '#ffab3d') +
    k.e(50, 56, 24, 29, '#4a5a8a') +
    k.d(k.p('M50 44 Q40 28 32 42 Q27 58 33 71 Q41 82 50 82 Q59 82 67 71 Q73 58 68 42 Q60 28 50 44Z', '#fff'),
      k.p('M46 54 L54 54 L50 59.5Z', '#ffab3d', ROUND('#ffab3d', 2))) +
    k.face(50, 50, 1, { gap: 8, mouth: 'none' })],
];

const TREATS: Entry[] = [
  ['cupcake', 'Cupcake', 'sparkle', (k) =>
    k.p('M27 58 L73 58 L66 86 L34 86Z', '#8fd3ff', ROUND('#8fd3ff', 4)) +
    k.e(50, 55, 27, 9, '#ff9ec7') + k.e(50, 46, 22, 10, '#ff9ec7') + k.e(50, 36, 14, 9, '#ff9ec7') +
    k.c(51, 25, 6.5, '#ff4f6d') + k.l('M51 19 Q52 14 57 13', '#7a4a2a', 2) +
    k.d(k.l('M40 61 L42 84 M50 61 L50 84 M60 61 L58 84', '#6bbdf0', 2.4)) +
    sprinkles(k, [[38, 46, 30], [58, 42, -20], [46, 36, 70], [64, 52, 10], [34, 54, -40], [52, 50, 40]]) +
    k.shine(48.5, 23, 2, 1.4) + k.face(50, 70, 0.95)],
  ['icecream', 'Ice Cream', 'rare', (k) =>
    k.p('M33 54 L67 54 L50 90Z', '#f6c27a', ROUND('#f6c27a', 5)) +
    k.inside((m) => m.p('M33 54 L67 54 L50 90Z', ''), k.l('M30 56 L60 86 M40 52 L68 80 M70 56 L40 86 M60 52 L32 80', '#dc9f55', 1.8)) +
    k.c(50, 30, 13, '#9de8cf') + k.c(50, 46, 16, '#ffb3d1') +
    k.p('M33 50 Q35 60 39.5 56 Q43 64 47.5 57 Q51.5 63 56 57 Q60 62 63.5 56 Q66 59 67 50Z', '#ffb3d1') +
    sprinkles(k, [[44, 24, 30], [56, 26, -30], [50, 20, 80], [42, 32, -60], [58, 33, 20]], ['#ff6f9f', '#ffd36b', '#fff', '#c99bff']) +
    k.shine(42, 39, 3, 2) + k.face(50, 46, 1)],
  ['donut', 'Donut', 'common', (k) =>
    k.c(50, 52, 32, '#e9b27a') +
    k.p('M21 47 Q21 22 50 22 Q79 22 79 47 Q81 57 75 59 Q71 67 66 59 Q60 65 56 61 Q50 70 44 61 Q38 65 34 61 Q28 67 25 59 Q19 57 21 47Z', '#ff9ec7') +
    k.d(k.c(50, 46, 10, '#f082b3'), k.c(50, 46.5, 8, '#fff', OUT('#e3cfe0', 1))) +
    sprinkles(k, [[32, 36, 40], [40, 28, -20], [62, 28, 30], [70, 40, -50], [30, 50, 80], [68, 54, 15], [52, 60, -30], [58, 36, 60]]) +
    k.face(50, 70, 0.85, { gap: 6 })],
  ['lollipop', 'Lollipop', 'common', (k) =>
    k.r(46.5, 56, 7, 32, 3.5, '#ffe9c7', 0, OUT('#f0d3a3', 1.2)) +
    k.c(50, 38, 25, '#ff9ec7') +
    k.inside((m) => m.c(50, 38, 25, ''), k.l(spiral(50, 38, 1, 25, 3), '#fff', 4.6)) +
    k.p('M50 63 L38 57 L38 69Z', '#9de8cf', ROUND('#9de8cf', 4)) + k.p('M50 63 L62 57 L62 69Z', '#9de8cf', ROUND('#9de8cf', 4)) + k.c(50, 63, 3.6, '#7fd8bb') +
    k.shine(39, 27, 4, 2.4)],
  ['macaron', 'Macaron', 'rare', (k) =>
    k.e(50, 63, 32, 12, '#c99bff') + k.r(20, 47, 60, 14, 7, '#fff3d6', 0, OUT('#f3dfb6', 1)) + k.e(50, 42, 32, 15, '#c99bff') +
    k.d(k.l('M22 52 Q25 56 28 52 Q31 56 34 52 Q37 56 40 52 Q43 56 46 52 Q49 56 52 52 Q55 56 58 52 Q61 56 64 52 Q67 56 70 52 Q73 56 76 52', '#b384f5', 2)) +
    k.shine(36, 34, 5, 2.4, -15) + k.face(50, 41, 1)],
  ['strawberry', 'Strawberry', 'common', (k) =>
    k.p('M50 88 C30 80 16 62 18 46 C20 32 36 30 50 34 C64 30 80 32 82 46 C84 62 70 80 50 88Z', '#ff5f7e') +
    k.p(starD(50, 33, 17, 0.42, 6), '#5fd38a', ROUND('#5fd38a', 3)) + k.r(48, 15, 4, 11, 2, '#4fae6e') +
    k.d(...[[30, 50], [70, 50], [38, 72], [62, 72], [50, 80], [28, 62], [72, 62], [42, 44], [58, 44]].map(([x, y]) => k.e(x, y, 1.3, 2, '#ffe08a'))) +
    k.face(50, 58, 1.1)],
  ['cake', 'Cake Slice', 'common', (k) =>
    k.p('M14 50 L86 50 L86 82 Q86 86 82 86 L18 86 Q14 86 14 82Z', '#ffe7b8') +
    k.p('M14 50 L60 28 L86 50Z', '#ffb3d1', ROUND('#ffb3d1', 4)) +
    k.d(k.r(14, 60, 72, 5, 0, '#ff9ec7'), k.r(14, 77, 72, 4, 0, '#ff9ec7'),
      k.p('M14 50 L86 50 L86 55 Q83 59 80 55 Q76 61 72 55 Q68 58 64 55 Q60 61 56 55 Q52 58 48 55 Q44 61 40 55 Q36 58 32 55 Q28 61 24 55 Q20 58 14 55Z', '#ffb3d1')) +
    k.c(60, 26, 7, '#ff5f7e') + k.d(k.p('M56 20 L60 23 L64 20 L62 17 L58 17Z', '#5fd38a')) + k.shine(57.5, 24, 1.8, 1.2) +
    k.face(50, 68, 0.95, { gap: 8 })],
  ['candy', 'Wrapped Candy', 'common', (k) =>
    k.g('rotate(-25 50 50)',
      k.p('M34 50 L14 35 Q10 50 14 65Z', '#ffd36b', ROUND('#ffd36b', 4)), k.p('M66 50 L86 35 Q90 50 86 65Z', '#ffd36b', ROUND('#ffd36b', 4)),
      k.d(k.l('M20 40 L28 48 M20 60 L28 52 M80 40 L72 48 M80 60 L72 52', '#ffb84d', 2)),
      k.e(50, 50, 19, 15, '#ff9ec7'), k.shine(42, 42, 4, 2.2, -10), k.face(50, 51, 0.95))],
  ['cookie', 'Cookie', 'common', (k) =>
    k.p('M50 19 Q60 18 68 24 Q78 28 80 38 Q84 48 80 58 Q78 70 68 76 Q58 82 48 80 Q36 80 28 74 Q18 66 19 54 Q17 42 24 32 Q34 20 50 19Z', '#e3a868') +
    k.d(k.e(34, 36, 4, 3.2, '#7a4a2a', 20), k.e(62, 30, 3.6, 2.8, '#7a4a2a', -30), k.e(72, 50, 3.4, 3, '#7a4a2a'), k.e(30, 60, 3.6, 3, '#7a4a2a', 40), k.e(64, 70, 3.8, 3, '#7a4a2a', -10), k.e(46, 74, 3, 2.4, '#7a4a2a'),
      k.e(46, 30, 2, 1.6, '#c98a4e'), k.e(76, 38, 1.6, 1.4, '#c98a4e'), k.e(24, 48, 1.8, 1.4, '#c98a4e')) +
    k.face(50, 52, 1.1)],
  ['boba', 'Bubble Tea', 'common', (k) =>
    k.r(53, 12, 6, 30, 3, '#ff6f9f', 12) +
    k.p('M29 38 L71 38 L65 86 Q50 91 35 86Z', '#ffe3c2') +
    k.inside((m) => m.p('M29 38 L71 38 L65 86 Q50 91 35 86Z', ''), k.r(0, 52, 100, 50, 0, '#e9b98d'),
      ...[[39, 80], [47, 82], [55, 81], [62, 78], [43, 75], [58, 74], [36, 74]].map(([x, y]) => k.c(x, y, 3.4, '#5a3a4a'))) +
    k.p('M28 37 Q28 23 50 23 Q72 23 72 37Z', '#ffd6e7', OUT('#ffb3d1')) + k.r(25, 34, 50, 7, 3.5, '#ff9ec7') +
    k.shine(37, 30, 4, 2) + k.face(50, 60, 1)],
];

const SPACE: Entry[] = [
  ['rocket', 'Rocket', 'sparkle', (k) =>
    k.g('rotate(25 50 50)',
      k.p('M37 56 L22 76 L38 72Z', '#ff6f9f', ROUND('#ff6f9f', 4)), k.p('M63 56 L78 76 L62 72Z', '#ff6f9f', ROUND('#ff6f9f', 4)),
      k.p('M41 70 Q50 94 59 70Z', '#ffab3d'),
      k.p('M50 12 C66 24 67 50 63 72 L37 72 C33 50 34 24 50 12Z', '#efeaff', OUT('#d3c8f5')),
      k.d(k.p('M43 70 Q50 86 57 70Z', '#ffe27a'), k.p('M50 12 C57 17 61 24 63 32 L37 32 C39 24 43 17 50 12Z', '#ff6f9f'),
        k.c(50, 47, 9, '#c3b5ff'), k.c(50, 47, 6.4, '#8fd3ff'), k.e(47.6, 44.6, 2.2, 1.4, '#fff', -30), k.r(37, 64, 26, 4, 2, '#c99bff')))],
  ['planet', 'Ringed Planet', 'rare', (k) =>
    k.g('rotate(-18 50 50)',
      k.l('M12 52 A38 10 0 0 1 88 52', '#ffd36b', 6), k.c(50, 50, 23, '#ffb3d1'),
      k.inside((m) => m.c(50, 50, 23, ''), k.r(20, 36, 60, 5, 2.5, '#ff9ec7'), k.r(20, 60, 60, 4, 2, '#ff9ec7')),
      k.l('M12 52 A38 10 0 0 0 88 52', '#ffd36b', 6)) +
    k.shine(40, 38, 4, 2.4) + k.face(50, 47, 0.95)],
  ['moon', 'Sleepy Moon', 'common', (k) =>
    k.p('M58 14 A36 36 0 1 0 86 62 A28 28 0 0 1 58 14Z', '#ffe27a') +
    k.p(starD(72, 44, 9, 0.5), '#ffd36b', ROUND('#ffd36b', 3)) +
    k.shine(30, 32, 4, 2.4, -50) + k.face(31, 56, 0.95, { gap: 6, eyes: 'sleep', mouth: 'smile' })],
  ['star', 'Happy Star', 'common', (k) =>
    k.p(starD(50, 53, 36, 0.52), '#ffd36b', ROUND('#ffd36b', 7)) + k.shine(40, 38, 4, 2.2) + k.face(50, 56, 1.15)],
  ['alien', 'Little Alien', 'rare', (k) =>
    k.l('M41 33 Q37 24 32 20 M59 33 Q63 24 68 20', '#8fe39a', 3) + k.c(32, 19, 4.5, '#ff9ec7') + k.c(68, 19, 4.5, '#ff9ec7') +
    k.p('M50 29 C74 29 80 48 76 62 C72 78 60 84 50 84 C40 84 28 78 24 62 C20 48 26 29 50 29Z', '#8fe39a') +
    k.d(k.e(39, 56, 7, 9, DARK, -20), k.e(61, 56, 7, 9, DARK, 20), k.c(41, 52.5, 2.4, '#fff'), k.c(63, 52.5, 2.4, '#fff'),
      k.l('M45 72 Q50 75.5 55 72', INK, 1.7), k.e(30, 67, 3.4, 2, '#ff7eb6', 0, 'opacity=".5"'), k.e(70, 67, 3.4, 2, '#ff7eb6', 0, 'opacity=".5"')) +
    k.shine(38, 37, 4, 2.2)],
  ['ufo', 'UFO', 'common', (k) =>
    k.e(50, 44, 17, 17, '#cdeeff', 0, OUT('#9fd4f5')) +
    k.d(k.c(50, 46, 8.5, '#8fe39a'), k.c(47, 45, 1.6, INK), k.c(53, 45, 1.6, INK), k.l('M40 34 Q46 30 50 31', '#fff', 2)) +
    k.e(50, 57, 38, 12, '#c99bff') + k.d(k.e(50, 53, 26, 5, '#b384f5')) +
    k.d(...[[24, 58], [37, 62.5], [50, 64], [63, 62.5], [76, 58]].map(([x, y]) => k.c(x, y, 3, '#ffd36b'))) +
    k.p('M38 68 L62 68 L70 84 L30 84Z', '#fff3a8', 'opacity=".75"')],
  ['comet', 'Comet', 'common', (k) =>
    k.p('M20 62 C40 42 62 24 84 16 C80 36 62 60 40 82Z', '#ffb3d1', ROUND('#ffb3d1', 6)) + k.d(k.p('M30 64 C46 48 62 34 76 26 C70 42 58 58 42 72Z', '#ffe27a', ROUND('#ffe27a', 4))) +
    k.p(starD(32, 70, 16, 0.55), '#ffd36b', ROUND('#ffd36b', 5)) + k.face(32, 71, 0.8, { gap: 5 })],
  ['earth', 'Planet Earth', 'common', (k) =>
    k.c(50, 50, 31, '#8fd3ff') +
    k.inside((m) => m.c(50, 50, 31, ''),
      k.p('M20 34 Q28 22 42 26 Q48 34 40 40 Q32 46 22 44Z', '#7fe0a0'), k.p('M58 20 Q74 20 82 32 Q78 42 68 38 Q60 34 58 20Z', '#7fe0a0'),
      k.p('M60 66 Q74 58 86 62 Q80 82 62 82Z', '#7fe0a0'), k.p('M16 58 Q28 58 30 72 Q20 74 16 58Z', '#7fe0a0')) +
    k.shine(37, 31, 5, 2.6) + k.face(50, 52, 1.1)],
];

const SEA: Entry[] = [
  ['fish', 'Fishy', 'common', (k) =>
    k.p('M64 52 L86 34 Q82 52 86 70Z', '#ff9a6a', ROUND('#ff9a6a', 5)) + k.p('M34 36 Q46 20 58 36Z', '#ff9a6a', ROUND('#ff9a6a', 4)) +
    k.e(44, 54, 28, 20, '#ffb48a') +
    k.inside((m) => m.e(44, 54, 28, 20, ''), k.l('M50 32 Q56 54 50 76', '#ff9a6a', 4), k.l('M60 34 Q65 54 60 74', '#ff9a6a', 4)) +
    k.d(k.e(46, 62, 6, 3.6, '#ff9a6a', 30)) + k.face(30, 52, 0.95, { gap: 6 }) +
    k.c(14, 28, 3.6, '#cdeeff', OUT('#9fd4f5', 1)) + k.c(21, 19, 2.6, '#cdeeff', OUT('#9fd4f5', 1))],
  ['octopus', 'Octopus', 'rare', (k) =>
    k.l('M29 56 Q18 68 24 79 Q27 85 20 86', '#c99bff', 9) + k.l('M40 60 Q35 74 40 84', '#c99bff', 9) + k.l('M50 60 Q53 74 49 85', '#c99bff', 9) +
    k.l('M60 60 Q65 74 60 84', '#c99bff', 9) + k.l('M71 56 Q82 68 76 79 Q73 85 80 86', '#c99bff', 9) +
    k.e(50, 42, 26, 24, '#c99bff') +
    k.d(k.c(36, 29, 3, '#b384f5'), k.c(62, 26, 2.4, '#b384f5'), k.c(68, 36, 3.2, '#b384f5'), k.c(30, 40, 2, '#b384f5')) +
    k.shine(40, 28, 4, 2.2) + k.face(50, 46, 1.15)],
  ['whale', 'Whale', 'common', (k) =>
    k.p('M12 58 Q12 32 44 32 Q72 32 78 54 Q82 48 84 38 Q92 40 90 50 Q90 58 84 62 Q74 82 44 82 Q12 82 12 58Z', '#7cbcff') +
    k.inside((m) => m.p('M12 58 Q12 32 44 32 Q72 32 78 54 Q82 48 84 38 Q92 40 90 50 Q90 58 84 62 Q74 82 44 82 Q12 82 12 58Z', ''), k.p('M8 64 Q44 76 86 60 L86 90 L8 90Z', '#cfe6ff')) +
    k.l('M38 30 Q36 22 28 17 M38 30 Q40 20 48 16', '#8fd3ff', 3.5) + k.shine(30, 40, 5, 2.4) + k.face(32, 55, 1, { gap: 7 })],
  ['starfish', 'Starfish', 'common', (k) =>
    k.p(starD(50, 54, 35, 0.55), '#ff9a7a', ROUND('#ff9a7a', 9)) +
    k.d(...[[50, 30], [28, 48], [72, 48], [36, 72], [64, 72], [44, 40], [56, 40]].map(([x, y]) => k.c(x, y, 1.8, '#ffd0bf'))) +
    k.face(50, 56, 1.1)],
  ['shell', 'Seashell', 'common', (k) =>
    k.p('M50 82 L20 52 Q16 24 50 17 Q84 24 80 52Z', '#ffc3d9', ROUND('#ffc3d9', 5)) + k.p('M40 78 L60 78 L56 86 L44 86Z', '#ffb0cc', ROUND('#ffb0cc', 3)) +
    k.d(k.l('M50 80 L32 26 M50 80 L50 19 M50 80 L68 26 M50 80 L22 42 M50 80 L78 42', '#ff9ec7', 2.4)) +
    k.c(80, 77, 6, '#fff6fb', OUT('#f0d7e6', 1.2)) + k.shine(78, 75, 1.8, 1.2) + k.shine(36, 30, 4, 2)],
  ['crab', 'Crab', 'common', (k) =>
    k.l('M30 64 L18 70 M30 70 L20 78 M70 64 L82 70 M70 70 L80 78', '#ff6f6f', 4) + k.l('M34 52 L25 42 M66 52 L75 42', '#ff6f6f', 4) +
    k.p('M14 40 Q14 26 26 26 Q32 28 30 34 L24 36 L30 40 Q28 48 20 48 Q14 46 14 40Z', '#ff6f6f', ROUND('#ff6f6f', 3)) +
    k.p('M86 40 Q86 26 74 26 Q68 28 70 34 L76 36 L70 40 Q72 48 80 48 Q86 46 86 40Z', '#ff6f6f', ROUND('#ff6f6f', 3)) +
    k.l('M43 47 L41 36 M57 47 L59 36', '#ff6f6f', 3) +
    k.c(41, 33, 5.4, '#fff', OUT('#ff6f6f', 2)) + k.c(59, 33, 5.4, '#fff', OUT('#ff6f6f', 2)) +
    k.e(50, 60, 24, 16, '#ff7a7a') +
    k.d(k.c(41.5, 33.5, 2.6, INK), k.c(59.5, 33.5, 2.6, INK), k.c(42.4, 32.4, 0.9, '#fff'), k.c(60.4, 32.4, 0.9, '#fff')) +
    k.face(50, 58, 1, { gap: 7, eyes: 'happy', mouth: 'smile' })],
  ['turtle', 'Sea Turtle', 'rare', (k) =>
    k.e(24, 72, 7, 5, '#bff0c8', 20) + k.e(62, 72, 7, 5, '#bff0c8', -20) + k.p('M12 62 L6 66 L14 68Z', '#bff0c8', ROUND('#bff0c8', 3)) +
    k.c(78, 52, 9.5, '#bff0c8') +
    k.r(10, 58, 64, 10, 5, '#bff0c8') + k.p('M12 64 Q14 30 42 30 Q70 30 72 64Z', '#7fd39a') +
    k.inside((m) => m.p('M12 64 Q14 30 42 30 Q70 30 72 64Z', ''), k.p(poly(42, 46, 8, 6, 0), '#5fb87e'), k.p(poly(25, 54, 7, 6, 0), '#5fb87e'), k.p(poly(59, 54, 7, 6, 0), '#5fb87e'), k.p(poly(30, 36, 6, 6, 0), '#5fb87e'), k.p(poly(55, 36, 6, 6, 0), '#5fb87e')) +
    k.shine(28, 38, 4, 2) + k.face(79, 51, 0.75, { gap: 4.5 })],
  ['jellyfish', 'Jellyfish', 'common', (k) =>
    k.l('M32 52 Q28 62 34 70 Q40 78 34 86', '#ffb3e6', 4) + k.l('M44 54 Q40 66 46 74 Q50 80 46 86', '#ffb3e6', 4) +
    k.l('M56 54 Q60 66 54 74 Q50 80 54 86', '#ffb3e6', 4) + k.l('M68 52 Q72 62 66 70 Q60 78 66 86', '#ffb3e6', 4) +
    k.p('M20 50 Q20 18 50 18 Q80 18 80 50 Q75 57 68 51 Q62 57 56 51 Q50 57 44 51 Q38 57 32 51 Q25 57 20 50Z', '#ffb3e6') +
    k.d(k.c(34, 30, 2.4, '#fff', 'opacity=".6"'), k.c(64, 28, 3, '#fff', 'opacity=".6"'), k.c(70, 40, 1.8, '#fff', 'opacity=".6"')) +
    k.shine(36, 26, 4, 2) + k.face(50, 37, 1.1)],
  ['mermaid', 'Mermaid Tail', 'sparkle', (k) =>
    k.g('rotate(-12 50 50)',
      k.p('M36 14 L64 14 Q66 40 58 60 Q55 66 52 70 L48 70 Q45 66 42 60 Q34 40 36 14Z', '#7fe0d0'),
      k.inside((m) => m.p('M36 14 L64 14 Q66 40 58 60 Q55 66 52 70 L48 70 Q45 66 42 60 Q34 40 36 14Z', ''),
        ...[22, 30, 38, 46, 54, 62].map((y, i) => k.l(scallop(28 + (i % 2) * 3, 72, y, 6), '#5fc8b8', 1.6))),
      k.p('M50 66 Q66 58 86 70 Q76 76 72 86 Q60 80 50 74 Q40 80 28 86 Q24 76 14 70 Q34 58 50 66Z', '#ff9ed8'),
      k.d(k.l('M50 70 Q62 68 74 76 M50 70 Q38 68 26 76', '#ff7ec4', 1.6), k.r(35, 12, 30, 6, 3, '#ffd36b')),
      k.shine(42, 24, 2.6, 6, 5))],
];

const FASHION: Entry[] = [
  ['dress', 'Party Dress', 'common', (k) =>
    k.l('M38 26 L40 16 M62 26 L60 16', '#ff9ec7', 3) +
    k.p('M36 24 Q43 32 50 28 Q57 32 64 24 L63 46 L37 46Z', '#ff9ec7') + k.p('M37 46 L63 46 L84 82 Q50 92 16 82Z', '#ff9ec7') +
    k.inside((m) => m.p('M37 46 L63 46 L84 82 Q50 92 16 82Z', ''), ...[[30, 70], [44, 60], [56, 72], [70, 64], [40, 80], [62, 84], [50, 52]].map(([x, y]) => k.p(heartD(x, y - 2, 5), '#fff', 'opacity=".75"'))) +
    k.d(k.r(35, 43, 30, 6, 3, '#c99bff'), k.p('M50 46 L42 41 L42 51Z M50 46 L58 41 L58 51Z', '#b384f5'), k.c(50, 46, 2.4, '#9b6bff')) +
    k.shine(42, 33, 2, 3.6, 10)],
  ['heel', 'High Heel', 'common', (k) =>
    k.p('M80 50 L87 50 L85 86 L82 86Z', '#ff4f8b', ROUND('#ff4f8b', 3)) + k.p(heelShape, '#ff6f9f') +
    k.d(k.p('M40 60 Q56 54 66 44 Q76 38 84 41 Q74 46 66 54 Q56 62 40 60Z', '#c93a72'), k.l('M16 80 L46 80', '#d94379', 2.4),
      k.p('M26 62 L18 57 L18 67Z M26 62 L34 57 L34 67Z', '#ffd6e7'), k.c(26, 62, 2.4, '#fff')) +
    k.shine(20, 68, 3, 1.6, -10)],
  ['handbag', 'Handbag', 'common', (k) =>
    k.l('M34 46 Q34 18 50 18 Q66 18 66 46', '#9b6bff', 5) +
    k.p('M18 44 L82 44 L76 84 Q50 88 24 84Z', '#c99bff', ROUND('#c99bff', 5)) +
    k.d(k.p('M16 42 L84 42 L78 58 Q50 64 22 58Z', '#b384f5'), k.c(50, 59, 5, '#ffd36b', OUT('#f0b840', 1.2))) +
    k.shine(28, 50, 4, 2, -10) + k.face(50, 72, 0.9)],
  ['lipstick', 'Lipstick', 'rare', (k) =>
    k.p('M39 52 L39 28 Q39 21 46 17 L57 12 Q61 11 61 16 L61 52Z', '#ff4f8b') + k.r(35, 48, 30, 10, 3, '#f0b840') + k.r(32, 56, 36, 32, 7, '#ffd36b') +
    k.d(k.r(43, 24, 3, 24, 1.5, '#fff', 0, 'opacity=".45"'), k.r(32, 56, 36, 5, 2, '#f0b840')) +
    k.shine(38, 62, 2, 3, 0) + k.face(50, 72, 1)],
  ['sunglasses', 'Heart Sunglasses', 'rare', (k) =>
    k.l('M16 44 Q8 42 8 34 M84 44 Q92 42 92 34', '#ff6f9f', 3.5) +
    k.p(heartD(31, 33, 34), '#ff6f9f') + k.p(heartD(69, 33, 34), '#ff6f9f') + k.l('M44 44 Q50 38 56 44', '#ff6f9f', 4) +
    k.d(k.p(heartD(31, 38, 25), '#5a2c58'), k.p(heartD(69, 38, 25), '#5a2c58'), k.e(24, 45, 4, 2, '#fff', -35, 'opacity=".8"'), k.e(62, 45, 4, 2, '#fff', -35, 'opacity=".8"'),
      k.c(29, 50, 1.4, '#fff', 'opacity=".7"'), k.c(67, 50, 1.4, '#fff', 'opacity=".7"'))],
  ['bow', 'Big Bow', 'common', (k) =>
    k.p('M47 52 L32 82 L40 80 L44 87 L53 55Z', '#ff6f9f', ROUND('#ff6f9f', 3)) + k.p('M53 52 L68 82 L60 80 L56 87 L47 55Z', '#ff6f9f', ROUND('#ff6f9f', 3)) +
    k.p('M50 48 Q30 24 17 33 Q9 44 15 57 Q25 68 50 54Z', '#ff6f9f') + k.p('M50 48 Q70 24 83 33 Q91 44 85 57 Q75 68 50 54Z', '#ff6f9f') +
    k.d(k.p('M47 50 Q32 36 23 41 Q30 46 47 52Z', '#e0457b'), k.p('M53 50 Q68 36 77 41 Q70 46 53 52Z', '#e0457b'),
      ...[[24, 50], [32, 58], [76, 50], [68, 58]].map(([x, y]) => k.c(x, y, 2, '#fff', 'opacity=".7"'))) +
    k.c(50, 51, 8, '#ff4f8b') + k.shine(47.5, 48.5, 2.4, 1.4)],
  ['polish', 'Nail Polish', 'common', (k) =>
    k.r(40, 13, 20, 24, 6, '#9b6bff') + k.r(42, 34, 16, 10, 2, '#ffe3ef') + k.r(28, 42, 44, 44, 14, '#ff9ec7') +
    k.d(k.r(44, 16, 4, 16, 2, '#fff', 0, 'opacity=".4"')) + k.shine(36, 52, 2.4, 5, 10) + k.face(50, 64, 1.05)],
  ['ring', 'Diamond Ring', 'sparkle', (k) =>
    k.l('M30 64 A20 20 0 1 0 70 64 A20 20 0 1 0 30 64', '#ffd36b', 7) +
    k.r(42, 42, 16, 6, 2, '#f0b840') +
    k.p('M38 24 L62 24 L70 34 L50 54 L30 34Z', '#bfe8ff', ROUND('#bfe8ff', 2)) +
    k.d(k.p('M38 24 L44 34 L30 34Z', '#e6f6ff'), k.p('M62 24 L56 34 L70 34Z', '#9fd4ff'), k.p('M44 34 L56 34 L50 54Z', '#e6f6ff'), k.p('M44 34 L50 24 L56 34Z', '#d4efff'),
      k.l('M30 34 L70 34', '#9fd4ff', 1.2), k.l('M38 66 A12 12 0 0 0 48 76', '#fff3b0', 2)) + k.shine(40, 28, 2.4, 1.4)],
  ['perfume', 'Perfume', 'common', (k) =>
    k.c(25, 22, 6.5, '#ff6f9f') + k.l('M30 25 Q38 30 43 28', '#ff6f9f', 2) +
    k.r(43, 22, 14, 11, 3, '#ffd36b') + k.p(heartD(50, 31, 52), '#ffcbec') +
    k.inside((m) => m.p(heartD(50, 31, 52), ''), k.r(0, 60, 100, 40, 0, '#ff9ed8')) +
    k.shine(34, 44, 5, 2.6, -40) + k.face(50, 56, 1.05)],
];

const MUSIC: Entry[] = [
  ['notes', 'Music Notes', 'common', (k) =>
    k.p('M38 28 L82 17 L82 29 L38 40Z', '#b384f5', ROUND('#b384f5', 3)) + k.r(34, 28, 6, 46, 3, '#b384f5') + k.r(77, 17, 6, 46, 3, '#b384f5') +
    k.e(29, 73, 12, 9, '#b384f5', -20) + k.e(72, 62, 12, 9, '#b384f5', -20) +
    k.face(29, 73, 0.75, { gap: 5 }) + k.face(72, 62, 0.75, { gap: 5 })],
  ['guitar', 'Guitar', 'rare', (k) =>
    k.g('rotate(35 50 50)',
      k.r(46, 12, 8, 40, 2, '#a5703f'), k.r(43, 8, 14, 12, 4, '#7a4a2a'),
      k.c(50, 58, 13, '#ff9a52'), k.c(50, 74, 16, '#ff9a52'),
      k.d(k.c(50, 63, 5.4, '#7a4a2a'), k.r(43, 76, 14, 3.4, 1.7, '#7a4a2a'), k.l('M48.4 14 L48.4 78 M51.6 14 L51.6 78', '#fff3d6', 0.8),
        k.c(42, 11, 1.4, '#ffd36b'), k.c(58, 11, 1.4, '#ffd36b'), k.c(42, 16, 1.4, '#ffd36b'), k.c(58, 16, 1.4, '#ffd36b')),
      k.shine(42, 52, 3, 2))],
  ['headphones', 'Headphones', 'common', (k) =>
    k.l('M22 56 Q22 17 50 17 Q78 17 78 56', '#ff9ec7', 8) +
    k.r(12, 48, 20, 32, 10, '#ff6f9f') + k.r(68, 48, 20, 32, 10, '#ff6f9f') +
    k.d(k.r(27, 52, 6, 24, 3, '#ffc3dc'), k.r(67, 52, 6, 24, 3, '#ffc3dc'), k.p(heartD(21, 58, 9), '#fff'), k.p(heartD(79, 58, 9), '#fff')) +
    k.e(46, 40, 3.6, 2.8, '#c99bff', -20) + k.r(48.2, 26, 2.6, 14, 1.3, '#c99bff') + k.e(60, 36, 3.6, 2.8, '#c99bff', -20) + k.r(62.2, 22, 2.6, 14, 1.3, '#c99bff') + k.r(48.2, 23, 16.6, 3, 1.5, '#c99bff', -16)],
  ['mic', 'Microphone', 'sparkle', (k) =>
    k.p('M41 50 L59 50 L55 86 Q50 90 45 86Z', '#ff6f9f') + k.r(38, 46, 24, 8, 4, '#ffd36b') + k.c(50, 31, 18, '#ddd5ec') +
    k.inside((m) => m.c(50, 31, 18, ''), ...[[38, 22], [46, 18], [54, 18], [62, 22], [34, 30], [66, 30], [36, 40], [64, 40]].map(([x, y]) => k.c(x, y, 1.3, '#c1b6d6'))) +
    k.d(k.p(starD(50, 70, 6, 0.5), '#ffd36b')) + k.shine(42, 22, 4, 2.4) + k.face(50, 32, 1)],
  ['drum', 'Drum', 'common', (k) =>
    k.l('M23 17 L45 38', '#e8b07a', 4.5) + k.c(22, 16, 4.4, '#ffd6e7') + k.l('M77 17 L55 38', '#e8b07a', 4.5) + k.c(78, 16, 4.4, '#ffd6e7') +
    k.r(18, 40, 64, 42, 10, '#ff6f9f') + k.e(50, 40, 32, 9, '#fff3d6', 0, OUT('#ffd36b', 3)) +
    k.d(k.r(18, 74, 64, 5, 2.5, '#ffd36b'), k.l('M28 50 L28 70 M72 50 L72 70', '#ffc3dc', 2)) + k.face(50, 58, 1.05)],
  ['cassette', 'Mixtape', 'rare', (k) =>
    k.r(12, 26, 76, 50, 9, '#8fd3ff') +
    k.d(k.r(20, 32, 60, 22, 5, '#fff3d6'), k.r(20, 47, 60, 3, 0, '#ff9ec7'), k.r(30, 58, 40, 13, 6.5, '#4a3f5e'),
      k.c(40, 64.5, 4.2, '#fff'), k.c(60, 64.5, 4.2, '#fff'), k.c(40, 64.5, 1.6, '#4a3f5e'), k.c(60, 64.5, 1.6, '#4a3f5e'),
      k.c(17, 31, 1.4, '#6bbdf0'), k.c(83, 31, 1.4, '#6bbdf0'), k.c(17, 71, 1.4, '#6bbdf0'), k.c(83, 71, 1.4, '#6bbdf0')) +
    k.face(50, 39, 0.95, { my: 4 })],
  ['trumpet', 'Trumpet', 'common', (k) =>
    k.g('rotate(-20 50 50)',
      k.r(18, 56, 40, 6, 3, '#ffd36b'), k.r(14, 46, 48, 7, 3.5, '#ffd36b'),
      k.p('M60 42 L84 31 L84 69 L60 58Z', '#ffd36b', ROUND('#ffd36b', 4)), k.e(84, 50, 6, 20, '#f0b840'),
      k.r(9, 44, 8, 11, 3, '#f0b840'),
      ...[28, 37, 46].map((x) => k.r(x, 35, 5, 12, 2, '#f0b840')),
      k.d(...[30.5, 39.5, 48.5].map((x) => k.c(x, 34, 3.4, '#ff9ec7')), k.e(84, 50, 3, 14, '#d99a2b'), k.l('M20 48 L56 48', '#fff3b0', 1.6)))],
  ['piano', 'Piano Keys', 'common', (k) =>
    k.r(12, 28, 76, 46, 8, '#4a3f5e') +
    k.d(...Array.from({ length: 7 }, (_, i) => k.r(15.5 + i * 10, 35, 9, 34, 2, '#fff')), ...[1, 2, 4, 5, 6].map((i) => k.r(12.5 + i * 10, 35, 6, 20, 1.5, '#4a3f5e')),
      k.p(heartD(50, 29.5, 4), '#ff9ec7')) +
    k.e(78, 20, 4, 3, '#ff9ec7', -20) + k.r(80.5, 9, 2.4, 11, 1.2, '#ff9ec7') + k.p(sparkleD(22, 18, 6), '#ffd36b')],
];

const SPORTS: Entry[] = [
  ['soccer', 'Soccer Ball', 'common', (k) =>
    k.c(50, 50, 30, '#fff', OUT('#d8cfe4', 2)) +
    k.inside((m) => m.c(50, 50, 30, ''),
      k.p(poly(50, 50, 9.5, 5), DARK), ...Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const b = a + Math.PI / 5;
        return k.p(poly(50 + Math.cos(b) * 29, 50 + Math.sin(b) * 29, 9, 5, b + Math.PI), DARK) + k.l(`M${f(50 + Math.cos(a) * 9.5)} ${f(50 + Math.sin(a) * 9.5)} L${f(50 + Math.cos(a) * 22)} ${f(50 + Math.sin(a) * 22)}`, DARK, 1.6);
      })) + k.shine(38, 34, 5, 2.6)],
  ['basketball', 'Basketball', 'common', (k) =>
    k.c(50, 50, 30, '#ff9a52') +
    k.inside((m) => m.c(50, 50, 30, ''), k.l('M50 18 L50 82 M18 50 L82 50', '#8a4a2a', 2.4), k.l('M29 26 Q42 50 29 74 M71 26 Q58 50 71 74', '#8a4a2a', 2.4)) +
    k.shine(38, 33, 5, 2.6)],
  ['tennis', 'Tennis Ball', 'common', (k) =>
    k.c(50, 50, 29, '#dcef5a') +
    k.inside((m) => m.c(50, 50, 29, ''), k.l('M26 28 Q42 50 26 72', '#fff', 4), k.l('M74 28 Q58 50 74 72', '#fff', 4)) +
    k.shine(40, 32, 5, 2.4) + k.face(50, 50, 1.05)],
  ['trophy', 'Trophy', 'sparkle', (k) =>
    k.l('M32 28 Q16 28 18 40 Q20 50 36 50', '#ffd36b', 5) + k.l('M68 28 Q84 28 82 40 Q80 50 64 50', '#ffd36b', 5) +
    k.p('M30 18 L70 18 Q72 56 50 60 Q28 56 30 18Z', '#ffd36b') +
    k.r(45, 58, 10, 13, 2, '#f0b840') + k.r(33, 69, 34, 8, 3, '#f0b840') + k.r(28, 75, 44, 11, 4, '#c98a5e') +
    k.d(k.p(starD(50, 36, 10, 0.5), '#fff3a8'), k.r(36, 79, 28, 3.5, 1.7, '#ffd36b'), k.r(26, 17, 48, 4, 2, '#f0b840')) +
    k.shine(37, 30, 2.4, 6, 10)],
  ['medal', 'Gold Medal', 'rare', (k) =>
    k.p('M30 15 L44 15 L57 46 L45 50Z', '#8fd3ff', ROUND('#8fd3ff', 3)) + k.p('M70 15 L56 15 L43 46 L55 50Z', '#ff6f9f', ROUND('#ff6f9f', 3)) +
    k.c(50, 63, 22, '#ffd36b') + k.d(k.c(50, 63, 16, '#ffe27a', OUT('#f0b840', 1.5)), k.p(starD(50, 64, 11, 0.5), '#f0b840', ROUND('#f0b840', 2))) +
    k.shine(40, 52, 4, 2)],
  ['skateboard', 'Skateboard', 'common', (k) =>
    k.g('rotate(-15 50 50)',
      k.c(30, 64, 7, '#ffd36b'), k.c(70, 64, 7, '#ffd36b'), k.r(26, 54, 8, 6, 2, '#b9b4c9'), k.r(66, 54, 8, 6, 2, '#b9b4c9'),
      k.r(12, 42, 76, 14, 7, '#ff9ec7'),
      k.d(k.c(30, 64, 2.4, '#fff'), k.c(70, 64, 2.4, '#fff'), k.p(heartD(50, 44.5, 9), '#fff'), k.p(starD(30, 49, 4.4), '#ffd36b'), k.p(starD(70, 49, 4.4), '#ffd36b')))],
  ['skate', 'Roller Skate', 'rare', (k) =>
    k.p('M28 18 L52 18 L54 50 L74 54 Q84 56 84 66 L84 70 L26 70Z', '#c99bff', ROUND('#c99bff', 6)) +
    k.r(22, 68, 66, 9, 4.5, '#ff6f9f') + k.c(34, 82, 7, '#ffd36b') + k.c(74, 82, 7, '#ffd36b') +
    k.d(k.r(24, 14, 32, 8, 4, '#ffd6e7'), k.l('M38 28 L50 31 M38 36 L50 39 M38 44 L50 47', '#fff', 2.2), k.c(34, 82, 2.6, '#fff'), k.c(74, 82, 2.6, '#fff'),
      k.p(starD(68, 62, 5), '#fff')) + k.shine(32, 40, 2.4, 5, 0)],
  ['bowling', 'Bowling', 'common', (k) =>
    k.p('M30 86 Q20 70 26 55 Q30 46 32 40 Q28 28 32 20 Q36 14 40 14 Q44 14 48 20 Q52 28 48 40 Q50 46 54 55 Q60 70 50 86Z', '#fffafc', OUT('#e4d8ef')) +
    k.inside((m) => m.p('M30 86 Q20 70 26 55 Q30 46 32 40 Q28 28 32 20 Q36 14 40 14 Q44 14 48 20 Q52 28 48 40 Q50 46 54 55 Q60 70 50 86Z', ''), k.r(20, 34, 40, 3, 0, '#ff6f9f'), k.r(20, 39, 40, 3, 0, '#ff6f9f')) +
    k.c(67, 69, 18, '#9b6bff') + k.d(k.c(62, 62, 2.6, '#6a42c9'), k.c(70, 60, 2.6, '#6a42c9'), k.c(67, 67, 2.6, '#6a42c9')) +
    k.shine(60, 76, 3, 1.6, 30) + k.face(40, 60, 0.8, { gap: 5 })],
];

const GARDEN: Entry[] = [
  ['sunflower', 'Sunflower', 'common', (k) =>
    ring(12, (_, a) => k.g(`rotate(${a} 50 50)`, k.e(50, 26, 7, 11, '#ffd36b'))) +
    k.c(50, 50, 17, '#b8804e') +
    k.inside((m) => m.c(50, 50, 17, ''), ...Array.from({ length: 16 }, (_, i) => k.c(50 + Math.cos(i * 2.4) * (4 + i * 0.8), 50 + Math.sin(i * 2.4) * (4 + i * 0.8), 1.1, '#9a6a3e'))) +
    k.face(50, 50, 1)],
  ['tulip', 'Tulip', 'common', (k) =>
    k.l('M50 56 L50 87', '#5fd38a', 5) +
    k.p('M50 86 Q30 82 25 60 Q42 62 50 80Z', '#7fe0a0') + k.p('M50 82 Q70 78 76 58 Q58 62 50 78Z', '#7fe0a0') +
    k.p('M29 25 L40 35 L50 20 L60 35 L71 25 Q75 56 50 60 Q25 56 29 25Z', '#ff6f9f', ROUND('#ff6f9f', 4)) +
    k.d(k.p('M40 35 L50 20 L60 35 Q58 37 50 38 Q42 37 40 35Z', '#ff8fb1')) + k.shine(36, 40, 2, 4, 10) + k.face(50, 46, 0.95)],
  ['mushroom', 'Mushroom', 'common', (k) =>
    k.p('M37 54 L63 54 L65 80 Q50 86 35 80Z', '#fff3d6', OUT('#f3dfb6', 1)) +
    k.p('M12 56 Q12 18 50 18 Q88 18 88 56 Q88 60 82 60 L18 60 Q12 60 12 56Z', '#ff5f7e') +
    k.d(k.c(30, 38, 6, '#fff'), k.c(50, 28, 5, '#fff'), k.c(68, 40, 7, '#fff'), k.c(44, 48, 4, '#fff'), k.c(80, 52, 3, '#fff'), k.c(20, 52, 3, '#fff')) +
    k.face(50, 69, 0.95)],
  ['ladybug', 'Ladybug', 'common', (k) =>
    k.l('M44 24 Q40 16 34 17 M56 24 Q60 16 66 17', DARK, 2.4) + k.c(50, 31, 12, DARK) +
    k.c(50, 57, 28, '#ff4f6d') +
    k.d(k.c(34, 44, 4.6, DARK), k.c(66, 44, 4.6, DARK), k.c(30, 66, 4.2, DARK), k.c(70, 66, 4.2, DARK), k.c(50, 79, 3.6, DARK),
      k.c(45, 30, 2, '#fff'), k.c(55, 30, 2, '#fff')) +
    k.shine(38, 38, 4, 2) + k.face(50, 57, 1.1, { blush: '#ffb3c2' })],
  ['butterfly', 'Butterfly', 'sparkle', (k) =>
    k.e(32, 37, 18, 15, '#c99bff', -25) + k.e(68, 37, 18, 15, '#c99bff', 25) +
    k.e(35, 64, 13, 11, '#ff9ec7', 25) + k.e(65, 64, 13, 11, '#ff9ec7', -25) +
    k.d(k.c(30, 35, 6, '#e6d3ff'), k.c(70, 35, 6, '#e6d3ff'), k.p(heartD(35, 61, 7), '#ffd6e7'), k.p(heartD(65, 61, 7), '#ffd6e7')) +
    k.e(50, 53, 5.5, 22, '#7a5a9e') + k.l('M48 33 Q44 22 38 20 M52 33 Q56 22 62 20', '#7a5a9e', 2.2) +
    k.face(50, 40, 0.55, { gap: 2.6, ink: '#fff', blush: false })],
  ['bee', 'Bumblebee', 'rare', (k) =>
    k.e(50, 36, 10, 13, '#e8f6ff', -20, OUT('#bfe0ff')) + k.e(66, 36, 10, 13, '#e8f6ff', 20, OUT('#bfe0ff')) +
    k.p('M80 56 L90 58 L80 63Z', DARK, ROUND(DARK, 2)) +
    k.e(57, 59, 26, 18, '#ffd36b') +
    k.inside((m) => m.e(57, 59, 26, 18, ''), k.r(52, 30, 7, 60, 0, DARK), k.r(66, 30, 7, 60, 0, DARK)) +
    k.l('M22 45 Q18 36 14 34 M30 45 Q32 36 37 32', DARK, 2) + k.c(14, 33, 2.6, DARK) + k.c(37, 31, 2.6, DARK) +
    k.c(27, 57, 14, '#ffd36b') + k.shine(22, 50, 3, 1.8) + k.face(27, 57, 0.9, { gap: 5.5 })],
  ['snail', 'Snail', 'common', (k) =>
    k.l('M28 39 L22 25 M34 39 L38 25', '#ffd9a0', 3) + k.c(22, 24, 3.6, '#ffd9a0') + k.c(38, 24, 3.6, '#ffd9a0') +
    k.p('M14 82 Q12 72 20 68 Q22 52 24 44 Q26 36 33 37 Q40 39 38 48 L37 66 L82 72 Q90 76 86 82 Z', '#ffd9a0') +
    k.c(60, 52, 22, '#ff9ec7') + k.inside((m) => m.c(60, 52, 22, ''), k.l(spiral(60, 52, 1, 18, 2.4), '#e0457b', 3)) +
    k.d(k.c(22, 24, 1.6, INK), k.c(38, 24, 1.6, INK)) + k.shine(50, 38, 4, 2.2) + k.face(30, 52, 0.7, { gap: 4, eyes: 'happy' })],
  ['cactus', 'Cactus', 'rare', (k) =>
    k.r(20, 34, 12, 22, 6, '#7fd39a') + k.r(25, 48, 16, 8, 4, '#7fd39a') + k.r(68, 28, 12, 22, 6, '#7fd39a') + k.r(59, 42, 16, 8, 4, '#7fd39a') +
    k.r(38, 20, 24, 46, 12, '#7fd39a') +
    k.p('M30 66 L70 66 L64 88 L36 88Z', '#ff9a52') + k.r(27, 61, 46, 9, 4.5, '#ffab70') +
    k.c(44, 19, 4, '#ff9ec7') + k.c(56, 19, 4, '#ff9ec7') + k.c(50, 15, 4, '#ff9ec7') + k.d(k.c(50, 19, 2.6, '#ffd36b')) +
    k.d(k.l('M42 30 L40 29 M58 30 L60 29 M42 56 L40 57 M58 56 L60 57 M24 40 L22 39 M76 34 L78 33', '#4fae6e', 1.4), k.p(heartD(50, 74, 7), '#fff', 'opacity=".8"')) +
    k.face(50, 40, 1)],
  ['wateringcan', 'Watering Can', 'common', (k) =>
    k.l('M22 42 Q22 24 36 24 Q50 24 50 42', '#6bbdf0', 5) +
    k.p('M54 54 L78 34 L82 38 L58 66Z', '#8fd3ff', ROUND('#8fd3ff', 3)) + k.e(80, 35, 4, 7.5, '#6bbdf0', 50) +
    k.r(14, 40, 46, 42, 10, '#8fd3ff') +
    k.e(84, 48, 2.2, 3.4, '#8fd3ff') + k.e(78, 52, 2.2, 3.4, '#8fd3ff') + k.e(86, 58, 2.2, 3.4, '#8fd3ff') +
    k.d(k.r(14, 72, 46, 4, 0, '#6bbdf0'), ...[0, 72, 144, 216, 288].map((a) => k.c(50 + Math.cos((a * Math.PI) / 180) * 3.4, 50 + Math.sin((a * Math.PI) / 180) * 3.4, 2.6, '#ff9ec7')), k.c(50, 50, 2, '#ffd36b')) +
    k.shine(20, 48, 2, 4, 0) + k.face(34, 60, 1)],
];

const FAIRY: Entry[] = [
  ['castle', 'Castle', 'rare', (k) =>
    k.r(16, 38, 18, 48, 2, '#ffd6e7') + k.r(66, 38, 18, 48, 2, '#ffd6e7') + k.r(30, 48, 40, 38, 2, '#ffe3ef') +
    k.p('M13 40 L25 16 L37 40Z', '#c99bff', ROUND('#c99bff', 3)) + k.p('M63 40 L75 16 L87 40Z', '#c99bff', ROUND('#c99bff', 3)) +
    k.p('M30 50 L50 26 L70 50Z', '#ff9ec7', ROUND('#ff9ec7', 3)) +
    k.d(k.p('M41 86 L41 72 Q50 62 59 72 L59 86Z', '#9b6bff'), k.r(22, 52, 6, 9, 3, '#9b6bff'), k.r(72, 52, 6, 9, 3, '#9b6bff'), k.p(heartD(50, 52, 9), '#ff6f9f'),
      k.c(25, 16, 2.4, '#ffd36b'), k.c(75, 16, 2.4, '#ffd36b'), k.r(16, 70, 18, 3, 0, '#ffc3dc'), k.r(66, 70, 18, 3, 0, '#ffc3dc'))],
  ['crown', 'Crown', 'common', (k) =>
    k.p('M18 70 L14 34 L33 50 L50 26 L67 50 L86 34 L82 70Z', '#ffd36b', ROUND('#ffd36b', 4)) +
    k.c(14, 32, 5, '#ffd36b') + k.c(50, 24, 5.5, '#ffd36b') + k.c(86, 32, 5, '#ffd36b') + k.r(16, 64, 68, 14, 5, '#f0b840') +
    k.d(k.c(50, 71, 4.5, '#ff6f9f'), k.c(32, 71, 3.5, '#8fd3ff'), k.c(68, 71, 3.5, '#9de8cf'), k.p(heartD(50, 44, 10), '#ff6f9f'), k.c(14, 32, 2, '#fff', 'opacity=".7"'), k.c(86, 32, 2, '#fff', 'opacity=".7"')) +
    k.shine(26, 50, 2, 5, -10)],
  ['unicorn', 'Unicorn', 'sparkle', (k) =>
    k.p('M30 44 L27 25 L42 34Z', '#fdf6ff', ROUND('#fdf6ff', 3)) + k.p('M70 44 L73 25 L58 34Z', '#fdf6ff', ROUND('#fdf6ff', 3)) +
    k.p('M44 41 L50 14 L56 41Z', '#ffd36b', ROUND('#ffd36b', 3)) +
    k.e(50, 61, 25, 22, '#fdf6ff', 0, OUT('#ead9f7')) +
    k.c(37, 41, 8, '#ff9ec7') + k.c(28, 49, 7, '#c99bff') + k.c(25, 61, 6.5, '#8fd3ff') + k.c(28, 72, 6, '#9de8cf') + k.c(63, 41, 6, '#ffd36b') +
    k.d(k.p('M29.5 40 L28.5 29 L37 34Z', '#ffc3dc'), k.p('M70.5 40 L71.5 29 L63 34Z', '#ffc3dc'), k.l('M46.5 34 L53.5 31 M47.5 27 L52.5 25', '#f0b840', 1.6),
      k.e(52, 72, 12, 7, '#ffe3ef'), k.e(48, 72, 1.2, 1.6, '#e7a8c8'), k.e(56, 72, 1.2, 1.6, '#e7a8c8')) +
    k.face(52, 60, 1.05, { gap: 9, mouth: 'none' })],
  ['wand', 'Magic Wand', 'common', (k) =>
    k.l('M28 82 L54 46', '#c99bff', 6) + k.d(k.l('M30 79 L52 49', '#e6d3ff', 1.6)) +
    k.p(starD(60, 37, 22, 0.5), '#ffd36b', ROUND('#ffd36b', 6)) +
    k.p(sparkleD(24, 30, 7), '#ff9ec7') + k.p(sparkleD(84, 66, 6), '#8fd3ff') + k.p(sparkleD(78, 84, 4), '#c99bff') +
    k.face(60, 39, 0.9)],
  ['dragon', 'Baby Dragon', 'rare', (k) =>
    k.p('M30 52 L14 40 L16 50 L12 58 L30 64Z', '#7fd39a', ROUND('#7fd39a', 3)) + k.p('M70 52 L86 40 L84 50 L88 58 L70 64Z', '#7fd39a', ROUND('#7fd39a', 3)) +
    k.p('M36 38 L32 22 L45 33Z', '#ffd36b', ROUND('#ffd36b', 3)) + k.p('M64 38 L68 22 L55 33Z', '#ffd36b', ROUND('#ffd36b', 3)) +
    k.p('M45 34 L50 26 L55 34Z', '#ff9ec7', ROUND('#ff9ec7', 3)) +
    k.c(50, 56, 24, '#9de8a8') +
    k.d(k.e(50, 67, 13, 8.5, '#d8f7c8'), k.e(45.5, 65, 1.4, 1.1, '#5fae6e'), k.e(54.5, 65, 1.4, 1.1, '#5fae6e')) +
    k.shine(38, 42, 4, 2.2) + k.face(50, 53, 1.1, { gap: 9, mouth: 'smile', my: 17 })],
  ['slipper', 'Glass Slipper', 'common', (k) =>
    k.p('M80 50 L87 50 L85 86 L82 86Z', '#9fd4ff', ROUND('#9fd4ff', 3)) + k.p(heelShape, '#cdeeff', OUT('#9fd4ff', 2)) +
    k.d(k.p('M40 60 Q56 54 66 44 Q76 38 84 41 Q74 46 66 54 Q56 62 40 60Z', '#9fd4ff'), k.l('M18 72 Q30 66 44 70', '#fff', 2.6),
      k.p(sparkleD(30, 70, 4), '#fff'), k.p(sparkleD(60, 64, 3), '#fff')) +
    k.p(sparkleD(28, 34, 8), '#ffd36b') + k.p(sparkleD(46, 22, 5), '#c99bff')],
  ['potion', 'Love Potion', 'common', (k) =>
    k.r(42, 14, 16, 10, 3, '#c98a5e') + k.r(43, 22, 14, 20, 3, '#efeaff', 0, OUT('#d3c8f5', 1.2)) +
    k.c(50, 62, 24, '#efeaff', OUT('#d3c8f5')) +
    k.inside((m) => m.c(50, 62, 24, ''), k.p('M20 58 Q35 52 50 58 Q65 64 80 58 L80 100 L20 100Z', '#ff9ed8'), k.c(40, 68, 2.6, '#fff', 'opacity=".6"'), k.c(60, 76, 2, '#fff', 'opacity=".6"')) +
    k.p(heartD(70, 22, 9), '#ff6f9f') + k.shine(37, 50, 4, 2.2, -40) + k.face(50, 69, 1)],
  ['frog', 'Frog Prince', 'common', (k) =>
    k.c(32, 43, 11, '#7fd39a') + k.c(68, 43, 11, '#7fd39a') + k.e(50, 63, 32, 21, '#7fd39a') +
    k.p('M42 42 L41 28 L46 34 L50 26 L54 34 L59 28 L58 42Z', '#ffd36b', ROUND('#ffd36b', 3)) +
    k.d(k.c(32, 43, 7, '#fff'), k.c(68, 43, 7, '#fff'), k.c(33, 44, 3.6, INK), k.c(67, 44, 3.6, INK), k.c(34.2, 42.6, 1.2, '#fff'), k.c(68.2, 42.6, 1.2, '#fff'),
      k.l('M36 66 Q50 76 64 66', INK, 2), k.e(26, 62, 4, 2.4, '#ff7eb6', 0, 'opacity=".5"'), k.e(74, 62, 4, 2.4, '#ff7eb6', 0, 'opacity=".5"'), k.c(50, 37, 1.8, '#ff6f9f')) +
    k.shine(36, 56, 4, 2)],
];

const SEASONS_SET: Entry[] = [
  ['snowman', 'Snowman', 'common', (k) =>
    k.c(50, 68, 19, '#f6f9ff', OUT('#d5e3f5')) + k.c(50, 40, 14, '#f6f9ff', OUT('#d5e3f5')) +
    k.r(39, 15, 22, 14, 3, DARK) + k.r(34, 26, 32, 5, 2.5, DARK) +
    k.p('M36 50 Q50 58 64 50 L66 56 Q50 64 34 56Z', '#ff6f9f') + k.r(56, 54, 8, 16, 3, '#ff6f9f', -10) +
    k.d(k.r(39, 21, 22, 4, 0, '#ff9ec7'), k.p('M50 42 L60 44 L50 46Z', '#ffab3d', ROUND('#ffab3d', 1.5)), k.c(50, 66, 2.4, DARK), k.c(50, 74, 2.4, DARK)) +
    k.face(50, 38, 0.9, { mouth: 'smile', my: 9 })],
  ['pumpkin', 'Pumpkin', 'common', (k) =>
    k.r(46, 20, 8, 14, 3, '#7fae4a', 10) +
    k.e(36, 59, 18, 24, '#ffab3d') + k.e(64, 59, 18, 24, '#ffab3d') + k.e(50, 59, 18, 26, '#ffb54d') +
    k.p('M54 28 Q66 18 72 28 Q62 34 54 28Z', '#7fd39a') +
    k.d(k.l('M41 37 Q36 59 41 81 M59 37 Q64 59 59 81', '#f0932a', 1.6)) + k.shine(30, 46, 2.4, 5, 15) + k.face(50, 60, 1.15)],
  ['leaf', 'Autumn Leaf', 'common', (k) =>
    k.l('M50 70 L50 88', '#c96a3a', 3) +
    k.p('M50 12 L57 30 L68 24 L65 42 L84 38 L76 52 L88 58 L64 64 L66 74 L52 68 L48 68 L34 74 L36 64 L12 58 L24 52 L16 38 L35 42 L32 24 L43 30Z', '#ff8a5c', ROUND('#ff8a5c', 4)) +
    k.d(k.l('M50 68 L50 22 M50 52 L72 42 M50 52 L28 42 M50 60 L72 58 M50 60 L28 58', '#f0703e', 1.4)) + k.face(50, 46, 0.9, { gap: 8 })],
  ['sun', 'Sunny Sun', 'common', (k) =>
    ring(10, (_, a) => k.g(`rotate(${a} 50 50)`, k.p('M44 24 L50 14 L56 24Z', '#ffb84d', ROUND('#ffb84d', 4)))) +
    k.c(50, 50, 25, '#ffd36b') + k.shine(40, 38, 5, 2.6) + k.face(50, 52, 1.2)],
  ['snowflake', 'Snowflake', 'sparkle', (k) =>
    ring(6, (_, a) => k.g(`rotate(${a} 50 50)`, k.l('M50 50 L50 16', '#8fd3ff', 6), k.l('M50 29 L42 21 M50 29 L58 21', '#8fd3ff', 4.5), k.l('M50 40 L44 35 M50 40 L56 35', '#8fd3ff', 3.5))) +
    k.c(50, 50, 11, '#8fd3ff') + k.face(50, 49, 0.75, { gap: 4.5 })],
  ['blossom', 'Cherry Blossom', 'rare', (k) =>
    ring(5, (_, a) => k.g(`rotate(${a} 50 50)`, k.p('M50 50 Q32 36 37 22 Q42 15 50 21 Q58 15 63 22 Q68 36 50 50Z', '#ffc3d9'))) +
    k.d(ring(5, (_, a) => k.g(`rotate(${a} 50 50)`, k.l('M50 46 L50 32', '#ff8fb1', 1.4), k.c(50, 31, 1.6, '#ff6f9f')))) +
    k.c(50, 50, 9, '#ffe27a') + k.face(50, 49, 0.62, { gap: 4.6 })],
  ['watermelon', 'Watermelon', 'common', (k) =>
    k.p('M12 32 A38 38 0 0 0 88 32Z', '#7fd39a') +
    k.d(k.p('M16.5 32 A33.5 33.5 0 0 0 83.5 32Z', '#f4ffe8'), k.p('M19.5 32 A30.5 30.5 0 0 0 80.5 32Z', '#ff6f86'),
      ...[[30, 44, -30], [40, 54, -15], [60, 54, 15], [70, 44, 30], [50, 58, 0]].map(([x, y, a]) => k.e(x, y, 1.6, 2.6, '#4a2546', a))) +
    k.shine(28, 36, 4, 1.6, 0) + k.face(50, 41, 1)],
  ['mitten', 'Cozy Mitten', 'common', (k) =>
    k.e(27, 52, 9, 14, '#ff6f9f', -30) + k.p('M32 72 L32 38 Q32 16 52 16 Q70 16 70 38 L70 72Z', '#ff6f9f') + k.r(28, 68, 46, 18, 7, '#ffe3ef', 0, OUT('#ffc3dc')) +
    k.d(k.p(heartD(51, 33, 17), '#fff'), k.l('M36 72 L36 82 M44 72 L44 82 M52 72 L52 82 M60 72 L60 82 M68 72 L68 82', '#ffc3dc', 2)) + k.shine(40, 26, 4, 2)],
  ['cocoa', 'Hot Cocoa', 'rare', (k) =>
    k.l('M38 30 Q34 24 38 18 M52 30 Q48 24 52 18', '#e3d7f5', 3) +
    k.l('M68 48 Q86 48 84 61 Q82 72 66 70', '#ff9ec7', 6) + k.r(20, 40, 50, 44, 12, '#ff9ec7') + k.e(45, 42, 25, 7, '#ffd6e7') +
    k.d(k.e(45, 42, 21, 5, '#a5703f'), k.r(34, 36, 8, 7, 2, '#fff', -10), k.r(46, 35, 8, 7, 2, '#fff', 20), k.r(28, 76, 34, 3, 1.5, '#ffc3dc')) +
    k.shine(26, 52, 2.2, 5, 0) + k.face(45, 60, 1)],
];

const PETS: Entry[] = [
  ['puppy', 'Puppy', 'sparkle', (k) =>
    k.e(50, 58, 25, 23, '#f2c48d') + k.e(25, 54, 9, 17, '#a5703f', 18) + k.e(75, 54, 9, 17, '#a5703f', -18) +
    k.d(k.e(62, 46, 7, 6, '#e3a868'), k.e(50, 67, 11, 8, '#fff3e0'), k.e(50, 63, 4, 3, INK), k.p('M47 71 Q50 79 53 71Z', '#ff6f86')) +
    k.face(50, 54, 1.05, { gap: 10, mouth: 'cat', my: 13 })],
  ['hamster', 'Hamster', 'rare', (k) =>
    k.c(28, 36, 7, '#ffc68a') + k.c(72, 36, 7, '#ffc68a') + k.d(k.c(28, 36, 3.6, '#ffb3d1'), k.c(72, 36, 3.6, '#ffb3d1')) +
    k.e(50, 60, 30, 26, '#ffc68a') +
    k.d(k.e(50, 71, 18, 13, '#fff3e0'), k.e(50, 74, 4, 6, '#7a5a3e'), k.c(44.5, 73, 3.4, '#ffd9b0'), k.c(55.5, 73, 3.4, '#ffd9b0')) +
    k.face(50, 54, 1.1, { gap: 11, mouth: 'cat', my: 5.5 })],
  ['goldfish', 'Goldfish Bowl', 'common', (k) =>
    k.c(50, 56, 30, '#e3f4ff', OUT('#a8d8f5', 2)) + k.e(50, 28, 15, 4.5, '#bfe8ff', 0, OUT('#a8d8f5')) +
    k.inside((m) => m.c(50, 56, 30, ''), k.r(0, 42, 100, 60, 0, '#a8dcff'), k.e(38, 84, 6, 3, '#ffc3d9'), k.e(56, 85, 7, 3.4, '#c99bff'), k.e(66, 82, 4, 2.4, '#ffd36b'),
      k.l('M28 86 Q24 76 30 68 M32 86 Q36 78 32 70', '#7fd39a', 3)) +
    k.p('M57 60 L67 53 L67 67Z', '#ffab70', ROUND('#ffab70', 2)) + k.e(48, 60, 11, 8, '#ffab70') +
    k.d(k.c(46, 46, 2, '#fff', 'opacity=".8"'), k.c(50, 38, 1.4, '#fff', 'opacity=".8"')) + k.shine(32, 46, 3, 6, 20, 0.6) +
    k.face(46, 59, 0.6, { gap: 3.6 })],
  ['parrot', 'Parrot', 'rare', (k) =>
    k.p('M44 72 L40 90 L50 84 L56 90 L56 72Z', '#8fd3ff', ROUND('#8fd3ff', 3)) +
    k.r(16, 74, 68, 6, 3, '#a5703f') +
    k.e(50, 56, 17, 22, '#ff6f6f') + k.c(50, 34, 15, '#ff6f6f') +
    k.e(42, 60, 9, 16, '#8fd3ff', 15) +
    k.p('M60 30 Q72 30 70 43 Q66 38 59 39Z', '#ffd36b', ROUND('#ffd36b', 2)) +
    k.d(k.e(42, 66, 6, 9, '#ffd36b', 15), k.c(52, 31, 5, '#fff'), k.c(53, 31.5, 2.6, INK), k.c(53.8, 30.6, 0.9, '#fff'), k.e(54, 41, 3, 1.8, '#ff9ec7', 0, 'opacity=".6"'),
      k.l('M46 76 L46 80 M54 76 L54 80', '#ffab3d', 2.4))],
  ['paw', 'Paw Print', 'common', (k) =>
    k.p('M50 52 Q66 52 70 66 Q72 80 58 80 Q54 78 50 78 Q46 78 42 80 Q28 80 30 66 Q34 52 50 52Z', '#ff9ec7') +
    k.e(26, 44, 7.5, 9.5, '#ff9ec7', -20) + k.e(41, 30, 7.5, 9.5, '#ff9ec7', -6) + k.e(59, 30, 7.5, 9.5, '#ff9ec7', 6) + k.e(74, 44, 7.5, 9.5, '#ff9ec7', 20) +
    k.d(k.e(25, 42, 3, 4, '#ffd6e7', -20), k.e(40, 28, 3, 4, '#ffd6e7'), k.e(58, 28, 3, 4, '#ffd6e7'), k.e(73, 42, 3, 4, '#ffd6e7', 20), k.p(heartD(50, 61, 12), '#ffd6e7'))],
  ['bone', 'Doggy Bone', 'common', (k) =>
    k.g('rotate(-28 50 50)', ...[[22, 41], [22, 59], [78, 41], [78, 59]].map(([x, y]) => k.c(x, y, 10, '#ffe2b5')), k.r(22, 40, 56, 20, 8, '#ffe2b5')) +
    k.shine(28, 52, 3, 1.6, -28) + k.face(50, 49, 1)],
  ['chick', 'Baby Chick', 'common', (k) =>
    k.p('M46 26 Q47 15 52 23 Q56 15 57 27Z', '#ffe27a', ROUND('#ffe27a', 3)) + k.c(50, 46, 22, '#ffe27a') +
    k.p('M22 58 L30 52 L38 60 L46 52 L54 60 L62 52 L70 60 L78 54 Q80 85 50 86 Q20 85 22 58Z', '#fff6ea', OUT('#f0dcc0')) +
    k.d(k.p('M46 49 L54 49 L50 54Z', '#ffab3d', ROUND('#ffab3d', 1.5)), k.c(30, 70, 2, '#ffc3d9'), k.c(66, 74, 2.4, '#c9e8ff')) + k.shine(40, 34, 4, 2.2) +
    k.face(50, 44, 1, { gap: 8, mouth: 'none' })],
  ['yarn', 'Yarn Ball', 'common', (k) =>
    k.l('M70 70 Q84 80 78 86 Q72 88 60 86', '#c99bff', 3) + k.c(48, 48, 30, '#c99bff') +
    k.inside((m) => m.c(48, 48, 30, ''), k.l('M18 34 Q30 40 40 20 M16 48 Q32 50 48 18 M28 76 Q36 60 60 54 Q72 50 80 60 M62 20 Q70 34 80 36 M54 18 Q64 38 80 44', '#8f63e8', 2.8)) +
    k.shine(34, 32, 4, 2.2) + k.face(46, 46, 1)],
];

const MAGIC: Entry[] = [
  ['rainbow', 'Rainbow', 'common', (k) =>
    ['#ff8fb1', '#ffb86b', '#ffe27a', '#8fe3b0', '#8fd3ff', '#c99bff'].map((col, i) => {
      const r = 36 - i * 5.6;
      return k.l(`M${f(50 - r)} 68 A${f(r)} ${f(r)} 0 0 1 ${f(50 + r)} 68`, col, 6);
    }).join('') +
    k.c(14, 70, 7, '#eef6ff') + k.c(22, 64, 9, '#eef6ff') + k.c(28, 72, 7, '#eef6ff') + k.r(12, 70, 22, 8, 4, '#eef6ff') +
    k.c(86, 70, 7, '#eef6ff') + k.c(78, 64, 9, '#eef6ff') + k.c(72, 72, 7, '#eef6ff') + k.r(66, 70, 22, 8, 4, '#eef6ff') +
    k.face(21, 68, 0.6, { gap: 3.6 }) + k.face(79, 68, 0.6, { gap: 3.6 })],
  ['heart', 'Puffy Heart', 'common', (k) =>
    k.p(heartD(50, 21, 64), '#ff6f9f') + k.shine(33, 34, 5, 3, -35) + k.face(50, 47, 1.25)],
  ['cloud', 'Happy Cloud', 'common', (k) =>
    k.c(31, 58, 15, '#dcefff') + k.c(50, 46, 20, '#dcefff') + k.c(70, 56, 15, '#dcefff') + k.r(17, 56, 66, 18, 9, '#dcefff') +
    k.e(30, 86, 2.4, 3.4, '#8fd3ff') + k.e(50, 88, 2.4, 3.4, '#8fd3ff') + k.e(70, 86, 2.4, 3.4, '#8fd3ff') +
    k.shine(42, 36, 5, 2.6) + k.face(50, 57, 1.1)],
  ['gem', 'Diamond', 'rare', (k) =>
    k.p('M28 28 L72 28 L86 44 L50 86 L14 44Z', '#bfe8ff', ROUND('#bfe8ff', 3)) +
    k.d(k.p('M28 28 L38 44 L14 44Z', '#e6f6ff'), k.p('M72 28 L62 44 L86 44Z', '#9fd4ff'), k.p('M38 44 L62 44 L50 86Z', '#d4efff'), k.p('M14 44 L38 44 L50 86Z', '#a8dcff'),
      k.p('M38 44 L50 28 L62 44Z', '#d4efff')) + k.shine(30, 34, 3, 1.6) + k.face(50, 52, 0.9)],
  ['shootingstar', 'Shooting Star', 'sparkle', (k) =>
    k.l('M16 56 L48 40', '#8fd3ff', 6) + k.l('M20 74 L52 48', '#ffb3d1', 7) + k.l('M32 86 L58 56', '#c99bff', 6) +
    k.p(starD(62, 40, 24, 0.5), '#ffd36b', ROUND('#ffd36b', 6)) + k.shine(54, 30, 3, 1.8) + k.face(62, 42, 0.95)],
  ['crystal', 'Crystal Ball', 'rare', (k) =>
    k.p('M28 72 L72 72 L78 86 L22 86Z', '#9b6bff', ROUND('#9b6bff', 4)) + k.c(50, 46, 27, '#dccdff', OUT('#c4b0f5')) +
    k.inside((m) => m.c(50, 46, 27, ''), k.p('M22 56 Q38 40 52 52 Q66 64 80 46 L80 80 L20 80Z', '#c4b0f5'), k.p(sparkleD(60, 36, 6), '#fff'), k.p(sparkleD(40, 56, 4), '#fff'), k.p(sparkleD(66, 58, 3), '#fff'), k.p(sparkleD(46, 30, 3), '#fff')) +
    k.d(k.r(26, 76, 48, 4, 2, '#c99bff')) + k.shine(37, 32, 6, 3.4, -35)],
  ['balloons', 'Balloons', 'common', (k) =>
    k.l('M33 54 Q38 70 50 84 M67 50 Q60 70 50 84 M50 52 Q47 66 50 84', '#c9b6dc', 1.8) +
    k.e(32, 38, 14, 17, '#ff9ec7') + k.e(68, 34, 14, 17, '#c99bff') + k.p(heartD(50, 25, 30), '#ff6f9f') +
    k.p('M44 86 L38 82 L38 90Z M56 86 L62 82 L62 90Z', '#ffd36b') + k.c(50, 86, 2.6, '#ffd36b') +
    k.shine(27, 30, 3, 2) + k.shine(63, 26, 3, 2) + k.face(50, 37, 0.8)],
  ['twinkle', 'Twinkle', 'common', (k) =>
    k.p(sparkleD(44, 52, 32), '#ffd36b', ROUND('#ffd36b', 4)) + k.p(sparkleD(76, 26, 12), '#ff9ec7', ROUND('#ff9ec7', 3)) + k.p(sparkleD(78, 72, 9), '#8fd3ff', ROUND('#8fd3ff', 3)) +
    k.face(44, 53, 1)],
  ['letter', 'Love Letter', 'common', (k) =>
    k.r(12, 28, 76, 52, 7, '#ffe3ef', 0, OUT('#ffc3dc')) +
    k.d(k.l('M15 32 L50 58 L85 32', '#ff9ec7', 2.4), k.l('M15 76 L40 56 M85 76 L60 56', '#ffc3dc', 2)) +
    k.p(heartD(50, 47, 22), '#ff4f6d') + k.face(50, 56, 0.65, { gap: 4.6 })],
];

const ALL: [string, Entry[]][] = [
  ['animals', ANIMALS], ['treats', TREATS], ['space', SPACE], ['sea', SEA], ['fashion', FASHION], ['music', MUSIC],
  ['sports', SPORTS], ['garden', GARDEN], ['fairy', FAIRY], ['seasons', SEASONS_SET], ['pets', PETS], ['magic', MAGIC],
];

const DESIGNS: Record<string, Design> = {};
export const STICKERS: StickerDef[] = [];
for (const [set, list] of ALL) for (const [id, name, rarity, draw] of list) {
  STICKERS.push({ id, name, set, rarity });
  DESIGNS[id] = draw;
}
export const STICKER_BY_ID: Record<string, StickerDef> = Object.fromEntries(STICKERS.map((s) => [s.id, s]));
export const SET_BY_ID: Record<string, StickerSet> = Object.fromEntries(STICKER_SETS.map((s) => [s.id, s]));
export const stickersInSet = (set: string) => STICKERS.filter((s) => s.set === set);

// ---------------- drawing a whole sticker ----------------
let uid = 0;
const HOLO = ['#ff9ec7', '#ffe27a', '#9de8cf', '#8fd3ff', '#c99bff', '#ff9ec7'];

export interface StickerOpts { silhouette?: boolean; /** No moving shimmer (for many small copies). */ still?: boolean }

/** A whole sticker as an `<svg>`: puffy white die-cut edge, soft shadow and glossy shine. */
export function stickerSvg(id: string, size = 96, opts: StickerOpts = {}): string {
  const design = DESIGNS[id];
  const def = STICKER_BY_ID[id];
  if (!design || !def) return '';
  const u = `sk${(uid = (uid + 1) % 1e9)}`;
  const open = `<svg class="sk-svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">`;
  if (opts.silhouette) {
    return open + `<g opacity="0.1" transform="translate(0 2)">${design(new Kit('shadow', u))}</g>` + design(new Kit('cut', u, '#fbf7fd')) + design(new Kit('sil', u)) +
      `<text x="50" y="63" font-size="34" font-weight="700" text-anchor="middle" fill="#fff" stroke="#c2b1d3" stroke-width="5" paint-order="stroke" font-family="Fredoka, sans-serif">?</text></svg>`;
  }
  const cut = design(new Kit('cut', u));
  const sparkle = def.rarity === 'sparkle';
  const defs = `<defs><radialGradient id="${u}g" cx="0.3" cy="0.22" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#5a1446" stop-opacity="0"/><stop offset="1" stop-color="#5a1446" stop-opacity="0.16"/></linearGradient>` +
    `<mask id="${u}a" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${design(new Kit('mask', u))}</mask>` +
    (sparkle
      ? `<mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${cut}</mask><linearGradient id="${u}h" x1="0" y1="0" x2="0.5" y2="0.5" spreadMethod="reflect">${HOLO.map((c, i) => `<stop offset="${f(i / (HOLO.length - 1))}" stop-color="${c}"/>`).join('')}` +
        (opts.still ? '' : `<animateTransform attributeName="gradientTransform" type="translate" values="0 0;1 1" dur="3.2s" repeatCount="indefinite"/>`) + `</linearGradient>`
      : '') + `</defs>`;
  const stars = sparkle
    ? [[12, 18, 7, '#ffd36b', 0], [88, 30, 5, '#ff9ec7', 0.7], [84, 88, 6, '#c99bff', 1.3], [14, 80, 4, '#8fd3ff', 1.9]].map(([x, y, r, c, delay]) =>
      `<path d="${sparkleD(x as number, y as number, r as number)}" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round">${opts.still ? '' : `<animate attributeName="opacity" values="1;0.25;1" dur="1.8s" begin="${delay}s" repeatCount="indefinite"/>`}</path>`).join('')
    : '';
  return open + defs +
    `<g opacity="0.2" transform="translate(0 2.6)">${design(new Kit('shadow', u))}</g>` + cut +
    (sparkle ? `<rect width="100" height="100" fill="url(#${u}h)" opacity="0.55" mask="url(#${u}m)"/>` : '') +
    design(new Kit('color', u)) +
    `<rect width="100" height="100" fill="url(#${u}s)" mask="url(#${u}a)"/><rect width="100" height="100" fill="url(#${u}g)" mask="url(#${u}a)"/>` +
    (sparkle ? `<rect width="100" height="100" fill="url(#${u}h)" opacity="0.14" mask="url(#${u}a)" style="mix-blend-mode:screen"/>` : '') +
    stars + `</svg>`;
}

// ---------------- collecting ----------------
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 70, rare: 25, sparkle: 5 };

/** Picks the next sticker: rarity by weight (70 / 25 / 5), almost always one the player has not found yet. */
export function pickSticker(have: readonly string[], rnd: () => number = Math.random): string {
  const owned = new Set(have);
  const roll = rnd() * 100;
  const rarity: Rarity = roll < RARITY_WEIGHT.common ? 'common' : roll < RARITY_WEIGHT.common + RARITY_WEIGHT.rare ? 'rare' : 'sparkle';
  const fresh = STICKERS.filter((s) => !owned.has(s.id));
  const dupe = owned.size > 0 && rnd() < 0.06; // now and then a double, so swapping and counting stays fun
  const from = (list: StickerDef[]) => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))].id;
  if (fresh.length && !dupe) {
    const same = fresh.filter((s) => s.rarity === rarity);
    if (same.length) return from(same);
    // None left of that rarity: pick among what is left, still by weight.
    const total = fresh.reduce((t, s) => t + RARITY_WEIGHT[s.rarity], 0);
    let x = rnd() * total;
    for (const s of fresh) if ((x -= RARITY_WEIGHT[s.rarity]) < 0) return s.id;
    return fresh[fresh.length - 1].id;
  }
  return from(STICKERS.filter((s) => s.rarity === rarity));
}

export function setProgress(have: readonly string[], set: string): { found: number; total: number } {
  const owned = new Set(have);
  const list = stickersInSet(set);
  return { found: list.filter((s) => owned.has(s.id)).length, total: list.length };
}
export const setComplete = (have: readonly string[], set: string) => {
  const p = setProgress(have, set);
  return p.total > 0 && p.found === p.total;
};
