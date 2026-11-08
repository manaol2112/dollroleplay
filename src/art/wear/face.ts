// Face accessories: glasses, sunglasses, goggles, masks, face paint, stickers, silly noses, and
// beards and mustaches. Glasses are centred on the doll's eyes (±0.38R, hy+0.12R) and their lenses
// stay see-through, except for sunglasses. Everything scales from R and hy, so it fits every age.
import { dark, light } from '../color';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, circ, flowerG, heartD, line, sparkleD, starD } from './base';

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
const sparkle = (x: number, y: number, r: number, c = '#fff', op = 0.95) => P(sparkleD(x, y, r), c, `opacity="${op}"`);
const EX = 0.38;
const EY = 0.12;

const gem = (x: number, y: number, r: number, c: string) =>
  circ(x, y, r, dark(c, 0.35)) + circ(x, y - r * 0.08, r * 0.8, c) +
  P(`M${f(x - r * 0.55)} ${f(y - r * 0.2)} L${f(x - r * 0.1)} ${f(y - r * 0.72)} L${f(x + r * 0.45)} ${f(y - r * 0.5)} L${f(x + r * 0.05)} ${f(y - r * 0.02)}Z`, light(c, 0.5), 'opacity="0.7"') +
  circ(x - r * 0.3, y - r * 0.4, r * 0.2, '#fff', 'opacity="0.95"');
const pearl = (x: number, y: number, r: number) => circ(x, y, r, '#f7efe9') + circ(x, y, r, 'url(#g-face)') + circ(x - r * 0.35, y - r * 0.38, r * 0.3, '#fff', 'opacity="0.9"');
const heartGem = (x: number, y: number, s: number, c: string) =>
  P(heartD(x, y - s * 0.55, s), c, `stroke="${dark(c, 0.3)}" stroke-width="${f(s * 0.08)}"`) + ell(x - s * 0.25, y - s * 0.22, s * 0.14, s * 0.09, '#fff', `opacity="0.75" ${rot(-30, x - s * 0.25, y - s * 0.22)}`);
const starGem = (x: number, y: number, r: number, c: string) =>
  P(starD(x, y, r, 0.48), c, `stroke="${isUrl(c) ? '#c98a1e' : dark(c, 0.3)}" stroke-width="${f(r * 0.12)}" stroke-linejoin="round"`) + circ(x - r * 0.25, y - r * 0.25, r * 0.16, '#fff', 'opacity="0.8"');
const holeD = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
const leaf = (x: number, y: number, len: number, deg: number, c = '#6fc47c') =>
  grp(`translate(${f(x)} ${f(y)}) rotate(${f(deg)})`, P(`M0 0 Q${f(len * 0.5)} ${f(-len * 0.38)} ${f(len)} 0 Q${f(len * 0.5)} ${f(len * 0.38)} 0 0Z`, c) +
    line(len * 0.1, 0, len * 0.8, 0, dark(c, 0.2), Math.max(0.8, len * 0.06), 0.6));

// ---------- glasses ----------
type Kind = 'round' | 'oval' | 'square' | 'big' | 'cat' | 'heart' | 'star' | 'aviator' | 'flower' | 'hex';
/** Outer half width, inner half width and top half height of each lens, in head units. */
const LENS: Record<Kind, { out: number; inn: number; top: number }> = {
  round: { out: 0.25, inn: 0.25, top: 0.25 },
  oval: { out: 0.29, inn: 0.29, top: 0.21 },
  square: { out: 0.29, inn: 0.28, top: 0.22 },
  big: { out: 0.33, inn: 0.3, top: 0.26 },
  cat: { out: 0.38, inn: 0.27, top: 0.2 },
  heart: { out: 0.31, inn: 0.3, top: 0.3 },
  star: { out: 0.34, inn: 0.3, top: 0.32 },
  aviator: { out: 0.32, inn: 0.28, top: 0.18 },
  flower: { out: 0.3, inn: 0.3, top: 0.3 },
  hex: { out: 0.27, inn: 0.27, top: 0.24 },
};
const rrect = (cx: number, cy: number, hw: number, hh: number, r: number) =>
  `M${f(cx - hw + r)} ${f(cy - hh)} L${f(cx + hw - r)} ${f(cy - hh)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + hw)} ${f(cy - hh + r)} L${f(cx + hw)} ${f(cy + hh - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + hw - r)} ${f(cy + hh)} L${f(cx - hw + r)} ${f(cy + hh)} A${f(r)} ${f(r)} 0 0 1 ${f(cx - hw)} ${f(cy + hh - r)} L${f(cx - hw)} ${f(cy - hh + r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx - hw + r)} ${f(cy - hh)}Z`;
/** Lens outline centred at (cx, cy); s is +1 for the right lens (outer side is +x) and -1 for the left. */
function lensD(kind: Kind, R: number, cx: number, cy: number, s: number): string {
  const q = (x: number, y: number) => `${f(cx + s * x * R)} ${f(cy + y * R)}`;
  switch (kind) {
    case 'round':
    case 'flower':
      return holeD(cx, cy, R * (kind === 'flower' ? 0.22 : 0.25), R * (kind === 'flower' ? 0.22 : 0.25));
    case 'oval':
      return holeD(cx, cy, R * 0.29, R * 0.21);
    case 'square':
      return rrect(cx, cy, R * 0.29, R * 0.22, R * 0.09);
    case 'big':
      return rrect(cx, cy + R * 0.01, R * 0.32, R * 0.26, R * 0.12);
    case 'cat':
      return `M${q(-0.27, -0.08)} C${q(-0.2, -0.22)} ${q(0.1, -0.22)} ${q(0.38, -0.26)} C${q(0.36, -0.06)} ${q(0.28, 0.18)} ${q(0.06, 0.2)} C${q(-0.14, 0.22)} ${q(-0.28, 0.12)} ${q(-0.27, -0.08)}Z`;
    case 'heart':
      return heartD(cx, cy - R * 0.32, R * 0.56);
    case 'star':
      return starD(cx, cy + R * 0.03, R * 0.36, 0.58);
    case 'aviator':
      return `M${q(-0.27, -0.15)} C${q(-0.1, -0.19)} ${q(0.2, -0.2)} ${q(0.32, -0.16)} C${q(0.38, -0.06)} ${q(0.3, 0.16)} ${q(0.08, 0.22)} C${q(-0.12, 0.27)} ${q(-0.28, 0.16)} ${q(-0.28, 0.0)} C${q(-0.28, -0.08)} ${q(-0.28, -0.12)} ${q(-0.27, -0.15)}Z`;
    case 'hex': {
      let d = '';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * R * 0.27)} ${f(cy + Math.sin(a) * R * 0.25)}`;
      }
      return d + 'Z';
    }
  }
}

interface GOpt {
  kind: Kind;
  frame: string;
  edge?: string;
  /** Frame thickness, in head units. */
  w?: number;
  tint?: string;
  op?: number;
  /** Dark lenses (sunglasses). */
  sun?: boolean;
  /** Lens paint instead of a tint, e.g. a mirror gradient. */
  lensFill?: string;
  bridge?: 'arc' | 'double' | 'none';
  /** Thick top bar in this color (browline glasses). */
  brow?: string;
  /** Speckles over the frame (tortoiseshell). */
  speckle?: string;
  only?: 1;
  deco?: (cx: number, cy: number, s: number) => string;
}
function glasses(R: number, hy: number, o: GOpt): string {
  const ex = EX * R, ey = hy + EY * R;
  const L = LENS[o.kind];
  const w = (o.w ?? 0.05) * R;
  const edge = o.edge ?? (isUrl(o.frame) ? '#b98a2e' : dark(o.frame, 0.28));
  const sides = o.only ? [1] : [-1, 1];
  let s = '';
  for (const sd of sides) s += line(sd * (ex + L.out * R - R * 0.02), ey - R * 0.07, sd * R * 0.97, ey - R * 0.11, edge, w * 0.9) + line(sd * (ex + L.out * R - R * 0.02), ey - R * 0.08, sd * R * 0.96, ey - R * 0.12, o.frame, w * 0.55);
  for (const sd of sides) {
    const cx = sd * ex;
    const d = lensD(o.kind, R, cx, ey, sd);
    if (o.lensFill) s += P(d, o.lensFill, `opacity="${o.op ?? 0.9}"`);
    else if (o.sun) s += P(d, o.tint ?? '#2d2a3a', `opacity="${o.op ?? 0.9}"`);
    else s += P(d, o.tint ?? '#ffffff', `opacity="${o.op ?? 0.16}"`);
    s += P(d, 'url(#g-glass)');
    if (o.sun || o.lensFill) s += P(`M${f(cx - L.inn * R * 0.55)} ${f(ey - L.top * R * 0.25)} L${f(cx - L.inn * R * 0.1)} ${f(ey - L.top * R * 0.7)}`, 'none', sk('#fff', R * 0.035, 'opacity="0.55"')) + P(`M${f(cx - L.inn * R * 0.35)} ${f(ey + L.top * R * 0.1)} L${f(cx - L.inn * R * 0.08)} ${f(ey - L.top * R * 0.25)}`, 'none', sk('#fff', R * 0.02, 'opacity="0.4"'));
    if (o.kind === 'flower') {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        s += circ(cx + Math.cos(a) * R * 0.26, ey + Math.sin(a) * R * 0.26, R * 0.085, i % 2 ? o.frame : light(o.frame, 0.25), `stroke="${edge}" stroke-width="${f(R * 0.01)}"`);
      }
    } else {
      s += P(d, 'none', `stroke="${edge}" stroke-width="${f(w)}" stroke-linejoin="round"`) + P(d, 'none', `stroke="${o.frame}" stroke-width="${f(w * 0.7)}" stroke-linejoin="round" transform="translate(0 ${f(-w * 0.12)})"`);
      if (o.speckle) s += P(d, 'none', `stroke="${o.speckle}" stroke-width="${f(w * 0.45)}" stroke-dasharray="${f(R * 0.03)} ${f(R * 0.05)} ${f(R * 0.015)} ${f(R * 0.04)}" opacity="0.8"`);
    }
    if (o.brow) s += P(`M${f(cx - L.inn * R - R * 0.02)} ${f(ey - R * 0.08)} Q${f(cx)} ${f(ey - L.top * R - R * 0.06)} ${f(cx + L.out * R + R * 0.02)} ${f(ey - R * 0.1)}`, 'none', sk(o.brow, R * 0.075));
    s += ell(cx - L.inn * R * 0.55, ey - L.top * R * 0.82, R * 0.035, R * 0.016, '#fff', `opacity="0.75" ${rot(-30, cx - L.inn * R * 0.55, ey - L.top * R * 0.82)}`);
    if (o.deco) s += o.deco(cx, ey, sd);
  }
  if (!o.only && o.bridge !== 'none') {
    const bx = ex - L.inn * R + R * 0.01, by = ey - R * 0.05;
    s += P(`M${f(-bx)} ${f(by)} Q0 ${f(by - R * 0.08)} ${f(bx)} ${f(by)}`, 'none', sk(edge, w * 0.9)) + P(`M${f(-bx)} ${f(by - w * 0.1)} Q0 ${f(by - R * 0.08 - w * 0.1)} ${f(bx)} ${f(by - w * 0.1)}`, 'none', sk(o.frame, w * 0.55));
    if (o.bridge === 'double') s += P(`M${f(-ex)} ${f(ey - R * 0.19)} Q0 ${f(ey - R * 0.22)} ${f(ex)} ${f(ey - R * 0.19)}`, 'none', sk(edge, w * 0.7)) + P(`M${f(-ex)} ${f(ey - R * 0.195)} Q0 ${f(ey - R * 0.225)} ${f(ex)} ${f(ey - R * 0.195)}`, 'none', sk(o.frame, w * 0.4));
  }
  return s;
}

// ---------- catalog plumbing ----------
interface V {
  k: string;
  n: string;
  c: string;
  a?: string;
  o?: string;
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

const earsOn = (kind: 'bunny' | 'kitty', c: string, R: number) => (cx: number, cy: number, s: number) => {
  if (kind === 'kitty') {
    const bx = cx + s * R * 0.1, by = cy - R * 0.2;
    return P(`M${f(bx - s * R * 0.08)} ${f(by + R * 0.02)} L${f(bx + s * R * 0.08)} ${f(by - R * 0.16)} L${f(bx + s * R * 0.16)} ${f(by + R * 0.06)}Z`, c, `stroke="${dark(c, 0.3)}" stroke-width="${f(R * 0.015)}" stroke-linejoin="round"`) +
      P(`M${f(bx - s * R * 0.01)} ${f(by + R * 0.01)} L${f(bx + s * R * 0.08)} ${f(by - R * 0.09)} L${f(bx + s * R * 0.11)} ${f(by + R * 0.03)}Z`, '#ffb3c7');
  }
  const bx = cx - s * R * 0.02, by = cy - R * 0.24;
  return ell(bx - R * 0.05, by - R * 0.12, R * 0.05, R * 0.14, c, `stroke="${dark(c, 0.3)}" stroke-width="${f(R * 0.014)}" ${rot(-12, bx - R * 0.05, by - R * 0.12)}`) + ell(bx + R * 0.06, by - R * 0.12, R * 0.05, R * 0.14, c, `stroke="${dark(c, 0.3)}" stroke-width="${f(R * 0.014)}" ${rot(12, bx + R * 0.06, by - R * 0.12)}`) +
    ell(bx - R * 0.05, by - R * 0.12, R * 0.022, R * 0.09, '#ffb3c7', rot(-12, bx - R * 0.05, by - R * 0.12)) + ell(bx + R * 0.06, by - R * 0.12, R * 0.022, R * 0.09, '#ffb3c7', rot(12, bx + R * 0.06, by - R * 0.12));
};

const ROUND: Style[] = [
  {
    key: 'round', name: 'Round Specs', group: 'Round Glasses', base: 15,
    vars: [
      { k: 'bubblegum', n: 'Bubblegum', c: '#ff7eb6' },
      { k: 'mint', n: 'Mint', c: '#5fd3b5' },
      { k: 'midnight', n: 'Bookworm', c: '#2d2a3a', o: 'thick' },
      { k: 'gold', n: 'Gold Wire', c: '#f0b232', o: 'gold', fixed: true },
      { k: 'tortoise', n: 'Tortoise', c: '#8a5a3c', o: 'tortoise' },
      { k: 'crystal', n: 'Crystal', c: '#e6d4ff', o: 'crystal' },
      { k: 'cherry', n: 'Cherry', c: '#e8384f' },
      { k: 'rainbow', n: 'Rainbow', c: '#ff6f91', o: 'rainbow', fixed: true },
    ],
    draw: (x, R, hy, v) => glasses(R, hy, {
      kind: 'round',
      frame: v.o === 'gold' ? 'url(#g-gold)' : v.o === 'rainbow' ? 'url(#g-rainbow)' : x.c,
      edge: v.o === 'rainbow' ? '#b583ff' : undefined,
      w: v.o === 'gold' ? 0.032 : v.o === 'thick' ? 0.07 : 0.05,
      speckle: v.o === 'tortoise' ? '#e0a96a' : undefined,
      tint: v.o === 'crystal' ? x.c : undefined,
      op: v.o === 'crystal' ? 0.25 : undefined,
      deco: v.o === 'crystal' ? (cx, cy) => sparkle(cx + R * 0.2, cy - R * 0.2, R * 0.05) : undefined,
    }),
  },
];
const SQUARE: Style[] = [
  {
    key: 'square', name: 'Square Specs', group: 'Square Glasses', base: 15,
    vars: [
      { k: 'midnight', n: 'Midnight', c: '#2d2a3a', o: 'thick' },
      { k: 'ocean', n: 'Ocean', c: '#4f9dff' },
      { k: 'cherry', n: 'Cherry', c: '#e8384f' },
      { k: 'browline', n: 'Browline', c: '#4a4a5e', o: 'brow' },
      { k: 'frost', n: 'Frosty', c: '#ffb3c7', o: 'frost' },
      { k: 'grape', n: 'Grape', c: '#9b6bff' },
      { k: 'lime', n: 'Lime', c: '#b6e36b', o: 'thick' },
    ],
    draw: (x, R, hy, v) => v.o === 'brow'
      ? glasses(R, hy, { kind: 'square', frame: 'url(#g-silver)', edge: '#9096ad', w: 0.028, brow: x.c })
      : glasses(R, hy, { kind: 'square', frame: x.c, w: v.o === 'thick' ? 0.075 : 0.055, tint: v.o === 'frost' ? x.c : undefined, op: v.o === 'frost' ? 0.28 : undefined }),
  },
];
const CAT_EYE: Style[] = [
  {
    key: 'catEye', name: 'Cat-Eyes', group: 'Cat-Eye Glasses', base: 20,
    vars: [
      { k: 'pink', n: 'Pink', c: '#ff4f8b', o: 'gems' },
      { k: 'midnight', n: 'Midnight', c: '#2d2a3a', o: 'gold' },
      { k: 'leopard', n: 'Leopard', c: '#c9a27e', o: 'spots' },
      { k: 'lilac', n: 'Lilac', c: '#c99bff', o: 'sparkle' },
      { k: 'cherry', n: 'Cherry', c: '#e8384f', o: 'pearl' },
      { k: 'mint', n: 'Mint', c: '#5fd3b5' },
      { k: 'gold', n: 'Golden', c: '#f0b232', o: 'goldframe', fixed: true },
      { k: 'white', n: 'Cloud', c: '#fffaf5', o: 'gems' },
    ],
    draw: (x, R, hy, v) => glasses(R, hy, {
      kind: 'cat',
      frame: v.o === 'goldframe' ? 'url(#g-gold)' : x.c,
      edge: x.c === '#fffaf5' ? '#d9cfdc' : undefined,
      w: 0.055,
      speckle: v.o === 'spots' ? '#5a3a24' : undefined,
      deco: (cx, cy, s) => {
        const tx = cx + s * R * 0.36, ty = cy - R * 0.24;
        if (v.o === 'gems') return gem(tx, ty, R * 0.035, '#7cc8ff') + gem(tx - s * R * 0.07, ty + R * 0.01, R * 0.025, '#fff');
        if (v.o === 'gold') return circ(tx, ty, R * 0.03, 'url(#g-gold)') + circ(tx - s * R * 0.06, ty + R * 0.02, R * 0.02, 'url(#g-gold)');
        if (v.o === 'sparkle') return sparkle(tx, ty - R * 0.02, R * 0.06) + sparkle(cx - s * R * 0.05, cy - R * 0.24, R * 0.03);
        if (v.o === 'pearl') return pearl(tx, ty, R * 0.03);
        return '';
      },
    }),
  },
];
const FUN: Style[] = [
  { key: 'heartFrame', name: 'Heart Glasses', group: 'Fun Glasses', base: 20, vars: [{ k: 'pink', n: '', name: 'Heart Glasses', c: '#ff4f8b' }, { k: 'red', n: 'Sweetie', c: '#e8384f' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'heart', frame: x.c, w: 0.05, tint: '#ffb3c7', op: 0.18 }) },
  { key: 'twinkle', name: 'Twinkle Star Glasses', group: 'Fun Glasses', base: 25, vars: [{ k: 'gold', n: '', name: 'Twinkle Star Glasses', c: '#ffd36b' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'star', frame: x.c, w: 0.05, tint: '#fff3b0', op: 0.2, deco: (cx, cy, s) => sparkle(cx + s * R * 0.32, cy - R * 0.3, R * 0.05) }) },
  { key: 'flowerFrame', name: 'Flower Glasses', group: 'Fun Glasses', base: 25, tags: ['spring'], vars: [{ k: 'pink', n: '', name: 'Flower Glasses', c: '#ff9ec7' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'flower', frame: x.c, w: 0.04 }) },
  { key: 'bunnyFrame', name: 'Bunny Glasses', group: 'Fun Glasses', base: 25, tags: ['spring'], vars: [{ k: 'white', n: '', name: 'Bunny Glasses', c: '#fffaf5' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'round', frame: x.c, edge: '#d9cfdc', w: 0.055, deco: earsOn('bunny', x.c, R) }) },
  { key: 'kittyFrame', name: 'Kitty Glasses', group: 'Fun Glasses', base: 25, vars: [{ k: 'grape', n: '', name: 'Kitty Glasses', c: '#9b6bff' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'round', frame: x.c, w: 0.055, deco: earsOn('kitty', x.c, R) }) },
  { key: 'hexFrame', name: 'Hexagon Glasses', group: 'Fun Glasses', base: 20, vars: [{ k: 'gold', n: 'Gold', c: '#f0b232', fixed: true }], draw: (x, R, hy) => glasses(R, hy, { kind: 'hex', frame: 'url(#g-gold)', w: 0.035 }) },
  { key: 'ovalFrame', name: 'Oval Glasses', group: 'Fun Glasses', base: 15, vars: [{ k: 'caramel', n: 'Caramel', c: '#c9a27e' }], draw: (x, R, hy) => glasses(R, hy, { kind: 'oval', frame: x.c, w: 0.045 }) },
  {
    key: 'monocle', name: 'Fancy Monocle', group: 'Fun Glasses', base: 35, fixed: true,
    vars: [{ k: 'gold', n: '', name: 'Fancy Monocle', c: '#f0b232' }],
    draw: (x, R, hy) => {
      const cx = EX * R, cy = hy + EY * R;
      let s = P(`M${f(cx + R * 0.2)} ${f(cy + R * 0.16)} Q${f(cx + R * 0.45)} ${f(cy + R * 0.6)} ${f(cx + R * 0.2)} ${f(cy + R * 0.85)}`, 'none', sk('#d99a1e', R * 0.018, `stroke-dasharray="${f(R * 0.03)} ${f(R * 0.015)}"`));
      const d = holeD(cx, cy, R * 0.25, R * 0.25);
      s += P(d, '#ffffff', 'opacity="0.15"') + P(d, 'url(#g-glass)');
      return s + circ(cx, cy, R * 0.25, 'none', `stroke="#b98a2e" stroke-width="${f(R * 0.05)}"`) + circ(cx, cy, R * 0.25, 'none', `stroke="url(#g-gold)" stroke-width="${f(R * 0.035)}"`) + circ(cx - R * 0.14, cy - R * 0.17, R * 0.02, '#fff', 'opacity="0.8"');
    },
  },
];

const SUNGLASSES: Style[] = [
  {
    key: 'shades', name: 'Shades', group: 'Sunglasses', base: 20, tags: ['summer'],
    vars: [
      { k: 'retro', n: 'Retro Round', c: '#f0b232', o: 'round' },
      { k: 'cool', n: 'Cool', c: '#2d2a3a', o: 'square' },
      { k: 'party', n: 'Pink Party', c: '#fffaf5', a: '#ff7eb6', o: 'square' },
      { k: 'mirror', n: 'Rainbow Mirror', c: '#c99bff', o: 'mirror' },
      { k: 'superstar', n: 'Superstar', c: '#ff7eb6', o: 'star' },
      { k: 'movie', n: 'Movie Star', c: '#2d2a3a', a: '#6b3fa0', o: 'cat' },
      { k: 'love', n: 'Love Heart', c: '#e8384f', a: '#8a1a30', o: 'heart' },
      { k: 'lemonade', n: 'Lemonade', c: '#ffd36b', a: '#ff8a3d', o: 'big' },
      { k: 'daisy', n: 'Daisy', c: '#fffaf5', a: '#3a3550', o: 'flower' },
    ],
    draw: (x, R, hy, v) => {
      const kind = (v.o === 'mirror' ? 'square' : v.o ?? 'square') as Kind;
      const gold = v.o === 'round';
      return glasses(R, hy, {
        kind, frame: gold ? 'url(#g-gold)' : x.c, w: gold ? 0.035 : v.o === 'square' ? 0.07 : 0.055, sun: true,
        edge: x.c === '#fffaf5' ? '#d9cfdc' : undefined,
        tint: v.a ?? '#3a3550', op: v.o === 'big' ? 0.82 : 0.9,
        lensFill: v.o === 'mirror' ? 'url(#g-rainbow)' : undefined,
      });
    },
  },
  {
    key: 'sportShades', name: 'Sport Shades', group: 'Sunglasses', base: 30, tags: ['summer'],
    vars: [{ k: 'ocean', n: 'Ocean', c: '#2d2a3a', a: '#4f9dff' }, { k: 'fire', n: 'Fire', c: '#e8384f', a: '#ffab3d' }, { k: 'lime', n: 'Racer', c: '#b6e36b', a: '#3fbf8f' }],
    draw: (x, R, hy, v) => {
      const p = at(R, hy);
      const lens = `M${p(-0.74, -0.04)} C${p(-0.7, -0.14)} ${p(-0.4, -0.12)} ${p(0, -0.1)} C${p(0.4, -0.12)} ${p(0.7, -0.14)} ${p(0.74, -0.04)} C${p(0.74, 0.18)} ${p(0.6, 0.32)} ${p(0.38, 0.32)} C${p(0.22, 0.32)} ${p(0.12, 0.22)} ${p(0, 0.2)} C${p(-0.12, 0.22)} ${p(-0.22, 0.32)} ${p(-0.38, 0.32)} C${p(-0.6, 0.32)} ${p(-0.74, 0.18)} ${p(-0.74, -0.04)}Z`;
      let s = mirror(line(R * 0.72, hy - R * 0.02, R * 0.97, hy - R * 0.02, x.c, R * 0.05));
      s += P(lens, v.a ?? '#4f9dff', 'opacity="0.92"') + P(lens, 'url(#g-glass)') + P(lens, 'url(#g-shadeY)');
      s += P(`M${p(-0.76, -0.06)} C${p(-0.7, -0.18)} ${p(-0.4, -0.16)} ${p(0, -0.14)} C${p(0.4, -0.16)} ${p(0.7, -0.18)} ${p(0.76, -0.06)}`, 'none', sk(x.c, R * 0.07));
      s += P(`M${p(-0.58, 0.0)} L${p(-0.44, -0.06)} M${p(0.2, 0.02)} L${p(0.36, -0.05)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.6"'));
      return s + P(`M${p(0.48, 0.14)} L${p(0.62, 0.06)}`, 'none', sk('#fff', R * 0.025, 'opacity="0.45"'));
    },
  },
];
const AVIATORS: Style[] = [
  {
    key: 'aviator', name: 'Aviators', group: 'Aviators', base: 25, step: 6, tags: ['summer'],
    vars: [
      { k: 'classic', n: 'Classic', c: '#4a4a5e', a: 'gold' },
      { k: 'rose', n: 'Rose', c: '#ff7eb6', a: 'gold' },
      { k: 'ocean', n: 'Ocean Mirror', c: '#4f9dff', a: 'silver' },
      { k: 'mint', n: 'Mint', c: '#5fd3b5', a: 'silver' },
      { k: 'amber', n: 'Amber', c: '#ffab5e', a: 'gold' },
      { k: 'grape', n: 'Grape', c: '#9b6bff', a: 'silver' },
    ],
    draw: (x, R, hy, v) => glasses(R, hy, { kind: 'aviator', frame: v.a === 'silver' ? 'url(#g-silver)' : 'url(#g-gold)', edge: v.a === 'silver' ? '#8a90a8' : '#b98a2e', w: 0.032, sun: true, tint: x.c, op: 0.82, bridge: 'double' }),
  },
];

// ---------- goggles ----------
function swimGoggles(x: WearCtx, R: number, hy: number, v: V): string {
  const ey = hy + EY * R, ex = EX * R;
  const c = x.c;
  let s = mirror(`<path d="M${f(ex + R * 0.24)} ${f(ey - R * 0.04)} Q${f(R * 0.86)} ${f(ey - R * 0.1)} ${f(R * 1.02)} ${f(ey - R * 0.1)}" ${sk(dark(c, 0.2), R * 0.1)}/><path d="M${f(ex + R * 0.24)} ${f(ey - R * 0.05)} Q${f(R * 0.86)} ${f(ey - R * 0.11)} ${f(R * 1.02)} ${f(ey - R * 0.11)}" ${sk(c, R * 0.07)}/>`);
  for (const sd of [-1, 1]) {
    const d = holeD(sd * ex, ey, R * 0.24, R * 0.2);
    s += P(d, v.a ?? '#7cc8ff', 'opacity="0.3"') + P(d, 'url(#g-glass)') + P(d, 'none', `stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.085)}"`) + P(d, 'none', `stroke="${c}" stroke-width="${f(R * 0.06)}" transform="translate(0 ${f(-R * 0.008)})"`);
    s += ell(sd * ex - R * 0.12, ey - R * 0.17, R * 0.05, R * 0.02, '#fff', `opacity="0.7" ${rot(-25, sd * ex - R * 0.12, ey - R * 0.17)}`);
  }
  return s + P(`M${f(-ex + R * 0.24)} ${f(ey - R * 0.02)} Q0 ${f(ey - R * 0.1)} ${f(ex - R * 0.24)} ${f(ey - R * 0.02)}`, 'none', sk(dark(c, 0.15), R * 0.05));
}
function skiGoggles(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const ey = EY;
  let s = mirror(`<path d="M${p(0.7, ey - 0.04)} L${p(1.03, ey - 0.08)}" ${sk(dark(v.a ?? c, 0.2), R * 0.2)} stroke-linecap="butt"/><path d="M${p(0.7, ey - 0.06)} L${p(1.03, ey - 0.1)}" ${sk(v.a ?? c, R * 0.15)} stroke-linecap="butt"/>`);
  const outer = `M${p(-0.78, ey - 0.06)} C${p(-0.78, ey - 0.3)} ${p(-0.5, ey - 0.32)} ${p(0, ey - 0.3)} C${p(0.5, ey - 0.32)} ${p(0.78, ey - 0.3)} ${p(0.78, ey - 0.06)} C${p(0.78, ey + 0.22)} ${p(0.6, ey + 0.3)} ${p(0.36, ey + 0.28)} C${p(0.2, ey + 0.27)} ${p(0.12, ey + 0.18)} ${p(0, ey + 0.18)} C${p(-0.12, ey + 0.18)} ${p(-0.2, ey + 0.27)} ${p(-0.36, ey + 0.28)} C${p(-0.6, ey + 0.3)} ${p(-0.78, ey + 0.22)} ${p(-0.78, ey - 0.06)}Z`;
  const lens = `M${p(-0.7, ey - 0.05)} C${p(-0.7, ey - 0.23)} ${p(-0.46, ey - 0.25)} ${p(0, ey - 0.23)} C${p(0.46, ey - 0.25)} ${p(0.7, ey - 0.23)} ${p(0.7, ey - 0.05)} C${p(0.7, ey + 0.16)} ${p(0.56, ey + 0.22)} ${p(0.36, ey + 0.21)} C${p(0.2, ey + 0.2)} ${p(0.12, ey + 0.11)} ${p(0, ey + 0.11)} C${p(-0.12, ey + 0.11)} ${p(-0.2, ey + 0.2)} ${p(-0.36, ey + 0.21)} C${p(-0.56, ey + 0.22)} ${p(-0.7, ey + 0.16)} ${p(-0.7, ey - 0.05)}Z`;
  s += P(outer, c, `stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.015)}"`) + P(outer, 'url(#g-shadeY)');
  s += P(lens, v.o === 'gold' ? 'url(#g-gold)' : 'url(#g-rainbow)', 'opacity="0.92"') + P(lens, 'url(#g-glass)');
  s += P(`M${p(-0.56, ey - 0.08)} L${p(-0.36, ey - 0.18)} M${p(-0.5, ey + 0.04)} L${p(-0.22, ey - 0.12)}`, 'none', sk('#fff', R * 0.04, 'opacity="0.55"'));
  return s;
}
function snorkel(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const tube = `M${p(0.78, 0.36)} Q${p(1.0, 0.3)} ${p(1.0, 0.0)} L${p(1.02, -1.0)}`;
  let s = `<path d="${tube}" ${sk(dark(v.a ?? '#ffd36b', 0.2), R * 0.14)}/><path d="${tube}" ${sk(v.a ?? '#ffd36b', R * 0.1)}/>` + `<rect x="${f(R * 0.92)}" y="${f(hy - R * 1.16)}" width="${f(R * 0.2)}" height="${f(R * 0.16)}" rx="${f(R * 0.05)}" fill="${c}"/>`;
  s += mirror(`<path d="M${p(0.74, 0.08)} L${p(1.02, 0.02)}" ${sk(dark(c, 0.2), R * 0.09)}/>`);
  const d = `M${p(-0.72, 0.02)} C${p(-0.72, -0.2)} ${p(-0.4, -0.22)} ${p(0, -0.18)} C${p(0.4, -0.22)} ${p(0.72, -0.2)} ${p(0.72, 0.02)} C${p(0.72, 0.28)} ${p(0.52, 0.36)} ${p(0.3, 0.34)} C${p(0.2, 0.34)} ${p(0.16, 0.42)} ${p(0, 0.44)} C${p(-0.16, 0.42)} ${p(-0.2, 0.34)} ${p(-0.3, 0.34)} C${p(-0.52, 0.36)} ${p(-0.72, 0.28)} ${p(-0.72, 0.02)}Z`;
  s += P(d, '#bfe8ff', 'opacity="0.25"') + P(d, 'url(#g-glass)') + P(d, 'none', `stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.09)}"`) + P(d, 'none', `stroke="${c}" stroke-width="${f(R * 0.065)}" transform="translate(0 ${f(-R * 0.01)})"`);
  return s + P(`M${p(-0.56, -0.06)} L${p(-0.4, -0.13)} M${p(-0.6, 0.08)} L${p(-0.5, 0.02)}`, 'none', sk('#fff', R * 0.035, 'opacity="0.7"'));
}
function pilotGoggles(x: WearCtx, R: number, hy: number): string {
  const ex = EX * R, ey = hy + EY * R;
  let s = mirror(`<path d="M${f(ex + R * 0.26)} ${f(ey - R * 0.06)} L${f(R * 1.03)} ${f(ey - R * 0.12)}" ${sk(dark(x.c, 0.25), R * 0.16)} stroke-linecap="butt"/><path d="M${f(ex + R * 0.26)} ${f(ey - R * 0.08)} L${f(R * 1.03)} ${f(ey - R * 0.14)}" ${sk(x.c, R * 0.11)} stroke-linecap="butt"/>`);
  for (const sd of [-1, 1]) {
    const d = holeD(sd * ex, ey, R * 0.24, R * 0.24);
    s += P(d, '#ffd9a0', 'opacity="0.28"') + P(d, 'url(#g-glass)') + circ(sd * ex, ey, R * 0.25, 'none', `stroke="#8a5a1e" stroke-width="${f(R * 0.1)}"`) + circ(sd * ex, ey, R * 0.25, 'none', `stroke="url(#g-gold)" stroke-width="${f(R * 0.075)}"`);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      s += circ(sd * ex + Math.cos(a) * R * 0.25, ey + Math.sin(a) * R * 0.25, R * 0.014, '#8a5a1e');
    }
  }
  return s + P(`M${f(-ex + R * 0.25)} ${f(ey - R * 0.04)} Q0 ${f(ey - R * 0.12)} ${f(ex - R * 0.25)} ${f(ey - R * 0.04)}`, 'none', sk('#8a5a3c', R * 0.06));
}
function scienceGoggles(x: WearCtx, R: number, hy: number): string {
  const p = at(R, hy);
  const c = x.c;
  const ey = EY;
  const d = `M${p(-0.7, ey - 0.1)} Q${p(-0.68, ey - 0.28)} ${p(-0.4, ey - 0.28)} L${p(0.4, ey - 0.28)} Q${p(0.68, ey - 0.28)} ${p(0.7, ey - 0.1)} L${p(0.68, ey + 0.16)} Q${p(0.62, ey + 0.28)} ${p(0.38, ey + 0.27)} Q${p(0.14, ey + 0.26)} ${p(0, ey + 0.17)} Q${p(-0.14, ey + 0.26)} ${p(-0.38, ey + 0.27)} Q${p(-0.62, ey + 0.28)} ${p(-0.68, ey + 0.16)}Z`;
  let s = mirror(`<path d="M${p(0.68, ey - 0.06)} L${p(1.02, ey - 0.1)}" ${sk('#4a4a5e', R * 0.06)}/>`);
  s += P(d, '#e8fff4', 'opacity="0.22"') + P(d, 'url(#g-glass)') + P(d, 'none', `stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.075)}" stroke-linejoin="round"`) + P(d, 'none', `stroke="${c}" stroke-width="${f(R * 0.05)}" stroke-linejoin="round"`);
  for (const sd of [-1, 1]) for (const k of [0, 1, 2]) s += circ(sd * R * (0.5 - k * 0.1), hy + (ey - 0.28) * R, R * 0.018, dark(c, 0.3));
  return s + P(`M${p(-0.58, ey - 0.12)} L${p(-0.44, ey - 0.2)}`, 'none', sk('#fff', R * 0.035, 'opacity="0.7"'));
}
const GOGGLES: Style[] = [
  { key: 'swim', name: 'Swim Goggles', group: 'Goggles', base: 15, tags: ['summer'], vars: [{ k: 'aqua', n: 'Aqua', c: '#5fd3b5' }, { k: 'pink', n: 'Pink', c: '#ff7eb6', a: '#ffb3c7' }], draw: swimGoggles },
  { key: 'ski', name: 'Ski Goggles', group: 'Goggles', base: 35, tags: ['winter'], vars: [{ k: 'rainbow', n: 'Rainbow', c: '#fffaf5', a: '#ff7eb6' }, { k: 'gold', n: 'Golden', c: '#2d2a3a', a: '#4f9dff', o: 'gold' }], draw: skiGoggles },
  { key: 'snorkel', name: 'Snorkel Mask', group: 'Goggles', base: 40, tags: ['summer'], vars: [{ k: 'coral', n: 'Coral', c: '#ff7a6b', a: '#ffd36b' }, { k: 'sky', n: 'Sky', c: '#7cc8ff', a: '#b6e36b' }], draw: snorkel },
  { key: 'pilot', name: 'Pilot Goggles', group: 'Goggles', base: 40, vars: [{ k: 'leather', n: '', name: 'Pilot Goggles', c: '#8a5a3c' }], draw: pilotGoggles },
  { key: 'science', name: 'Science Goggles', group: 'Goggles', base: 25, vars: [{ k: 'green', n: '', name: 'Science Goggles', c: '#3fbf8f' }], draw: scienceGoggles },
];

// ---------- masks ----------
function masquerade(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const gold = v.o === 'gold';
  const fill = gold ? 'url(#g-gold)' : c;
  const edge = gold ? '#b98a2e' : dark(c, 0.3);
  const outer = `M${p(0, -0.04)} C${p(0.15, -0.2)} ${p(0.5, -0.28)} ${p(0.8, -0.22)} C${p(0.76, 0.04)} ${p(0.64, 0.38)} ${p(0.38, 0.4)} C${p(0.2, 0.41)} ${p(0.08, 0.26)} ${p(0, 0.24)} C${p(-0.08, 0.26)} ${p(-0.2, 0.41)} ${p(-0.38, 0.4)} C${p(-0.64, 0.38)} ${p(-0.76, 0.04)} ${p(-0.8, -0.22)} C${p(-0.5, -0.28)} ${p(-0.15, -0.2)} ${p(0, -0.04)}Z`;
  const holes = holeD(-EX * R, hy + EY * R, R * 0.19, R * 0.18) + holeD(EX * R, hy + EY * R, R * 0.19, R * 0.18);
  let s = mirror(line(R * 0.78, hy - R * 0.06, R * 0.98, hy - R * 0.02, edge, R * 0.025));
  if (v.o === 'feather' || v.o === 'peacock') {
    const fc = v.o === 'peacock' ? ['#2f8a62', '#3fbf8f', '#4f9dff'] : [v.a ?? '#ff9ec7', light(v.a ?? '#ff9ec7', 0.3), '#fffaf5'];
    [[-25, 0.62], [5, 0.7], [35, 0.58]].forEach(([deg, len], i) => {
      const bx = R * 0.66, by = hy - R * 0.18;
      s += grp(`translate(${f(bx)} ${f(by)}) rotate(${deg - 90})`, P(`M0 0 C${f(R * 0.1)} ${f(-R * 0.08)} ${f(len * R * 0.8)} ${f(-R * 0.14)} ${f(len * R)} 0 C${f(len * R * 0.8)} ${f(R * 0.14)} ${f(R * 0.1)} ${f(R * 0.08)} 0 0Z`, fc[i]) +
        line(0, 0, len * R * 0.95, 0, dark(fc[i], 0.3), R * 0.012) + (v.o === 'peacock' ? circ(len * R * 0.78, 0, R * 0.06, '#7a4fd0') + circ(len * R * 0.78, 0, R * 0.03, '#ffd36b') : ''));
    });
  }
  s += `<path d="${outer} ${holes}" fill="${fill}" fill-rule="evenodd" stroke="${edge}" stroke-width="${f(R * 0.015)}"/><path d="${outer} ${holes}" fill="url(#g-shadeY)" fill-rule="evenodd"/>`;
  s += `<path d="${holes}" ${sk(gold ? '#fff3b0' : v.a ?? 'url(#g-gold)', R * 0.025)}/>`;
  switch (v.o) {
    case 'gems':
      for (const u of [-0.6, -0.38, -0.16, 0.16, 0.38, 0.6]) s += gem(u * R, hy - R * (0.14 + 0.06 * (1 - Math.abs(u))) + R * 0.02, R * 0.04, Math.abs(u) < 0.2 ? '#ff4f8b' : '#fff');
      s += gem(0, hy + R * 0.06, R * 0.05, '#7cc8ff');
      break;
    case 'lace':
      for (let i = 0; i <= 12; i++) {
        const u = -0.72 + i * 0.12;
        s += circ(u * R, hy - R * (0.17 + 0.07 * (1 - (u / 0.8) ** 2)), R * 0.035, '#fffaf5', `stroke="${dark(c, 0.15)}" stroke-width="${f(R * 0.008)}"`);
      }
      break;
    case 'glitter':
      for (let i = 0; i < 18; i++) {
        const u = (((i * 0.618) % 1) * 2 - 1) * 0.7;
        const w = -0.12 + ((i * 0.7548) % 1) * 0.42;
        if (Math.abs(Math.abs(u) - EX) > 0.2 || Math.abs(w - EY) > 0.19) s += circ(u * R, hy + w * R, R * 0.012, '#fff', 'opacity="0.9"');
      }
      s += sparkle(R * 0.66, hy - R * 0.14, R * 0.06) + sparkle(-R * 0.6, hy + R * 0.28, R * 0.045);
      break;
  }
  return s;
}
function sleepMask(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const d = `M${p(-0.74, -0.08)} C${p(-0.76, -0.24)} ${p(-0.5, -0.26)} ${p(-0.2, -0.2)} Q${p(0, -0.16)} ${p(0.2, -0.2)} C${p(0.5, -0.26)} ${p(0.76, -0.24)} ${p(0.74, -0.08)} C${p(0.76, 0.24)} ${p(0.6, 0.38)} ${p(0.38, 0.38)} C${p(0.2, 0.38)} ${p(0.1, 0.28)} ${p(0, 0.26)} C${p(-0.1, 0.28)} ${p(-0.2, 0.38)} ${p(-0.38, 0.38)} C${p(-0.6, 0.38)} ${p(-0.76, 0.24)} ${p(-0.74, -0.08)}Z`;
  let s = mirror(`<path d="M${p(0.72, 0.04)} L${p(1.0, 0.0)}" ${sk(dark(c, 0.15), R * 0.06)}/>`);
  if (v.o === 'kitty') s += mirror(P(`M${p(0.36, -0.2)} L${p(0.58, -0.44)} L${p(0.7, -0.14)}Z`, c, `stroke="${dark(c, 0.15)}" stroke-width="${f(R * 0.012)}" stroke-linejoin="round"`) + P(`M${p(0.45, -0.2)} L${p(0.58, -0.36)} L${p(0.64, -0.17)}Z`, '#ffb3c7'));
  s += P(d, c, `stroke="${dark(c, 0.15)}" stroke-width="${f(R * 0.015)}"`) + P(d, 'url(#g-face)');
  s += P(`M${p(-0.7, -0.08)} C${p(-0.72, -0.2)} ${p(-0.5, -0.22)} ${p(-0.2, -0.17)} Q${p(0, -0.13)} ${p(0.2, -0.17)} C${p(0.5, -0.22)} ${p(0.72, -0.2)} ${p(0.7, -0.08)}`, 'none', sk('#fff', R * 0.02, `stroke-dasharray="${f(R * 0.03)} ${f(R * 0.025)}" opacity="0.7"`));
  const ink = v.a ?? '#2d2a3a';
  switch (v.o) {
    case 'stars':
      s += P(`M${p(-0.5, -0.04)} A${f(R * 0.12)} ${f(R * 0.12)} 0 1 0 ${p(-0.36, 0.16)} A${f(R * 0.09)} ${f(R * 0.09)} 0 1 1 ${p(-0.5, -0.04)}Z`, '#ffe680');
      for (const [a, b, r] of [[0.36, 0.06, 0.08], [0.56, 0.2, 0.05], [0.2, -0.04, 0.04], [-0.16, 0.18, 0.035]]) s += P(starD(a * R, hy + b * R, r * R), '#ffe680');
      break;
    case 'hearts':
      for (const [a, b, r] of [[-0.38, 0.06, 0.16], [0.38, 0.06, 0.16], [0, 0.02, 0.07], [-0.6, 0.22, 0.06], [0.6, 0.22, 0.06]]) s += P(heartD(a * R, hy + (b - r * 0.5) * R, r * R), '#fff', 'opacity="0.9"');
      break;
    default:
      // sleepy closed eyes with lashes
      s += mirror(P(`M${p(0.22, 0.12)} Q${p(0.38, 0.24)} ${p(0.54, 0.12)}`, 'none', sk(ink, R * 0.035)) + [0.28, 0.38, 0.48].map((u, i) => line(u * R, hy + (0.17 + (i === 1 ? 0.03 : 0)) * R, (u + (i - 1) * 0.03) * R, hy + (0.25 + (i === 1 ? 0.03 : 0)) * R, ink, R * 0.022)).join(''));
      if (v.o === 'kitty') s += P(`M${p(-0.05, 0.22)} L${p(0.05, 0.22)} L${p(0, 0.28)}Z`, '#ff7eb6');
      else s += ell(-R * 0.58, hy + R * 0.3, R * 0.07, R * 0.04, '#ff9ec7', 'opacity="0.7"') + ell(R * 0.58, hy + R * 0.3, R * 0.07, R * 0.04, '#ff9ec7', 'opacity="0.7"');
  }
  return s;
}
function heroMask(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const outer = `M${p(0, -0.02)} C${p(0.2, -0.16)} ${p(0.55, -0.18)} ${p(0.74, -0.06)} C${p(0.82, 0.12)} ${p(0.66, 0.36)} ${p(0.4, 0.36)} C${p(0.22, 0.36)} ${p(0.1, 0.26)} ${p(0, 0.24)} C${p(-0.1, 0.26)} ${p(-0.22, 0.36)} ${p(-0.4, 0.36)} C${p(-0.66, 0.36)} ${p(-0.82, 0.12)} ${p(-0.74, -0.06)} C${p(-0.55, -0.18)} ${p(-0.2, -0.16)} ${p(0, -0.02)}Z`;
  const holes = holeD(-EX * R, hy + EY * R, R * 0.18, R * 0.17) + holeD(EX * R, hy + EY * R, R * 0.18, R * 0.17);
  let s = mirror(line(R * 0.76, hy - R * 0.0, R * 0.98, hy + R * 0.02, dark(c, 0.2), R * 0.03));
  s += `<path d="${outer} ${holes}" fill="${c}" fill-rule="evenodd" stroke="${dark(c, 0.3)}" stroke-width="${f(R * 0.015)}"/><path d="${outer} ${holes}" fill="url(#g-shadeY)" fill-rule="evenodd"/>`;
  s += P(`M${p(-0.6, -0.06)} Q${p(-0.4, -0.13)} ${p(-0.2, -0.1)}`, 'none', sk('#fff', R * 0.025, 'opacity="0.4"'));
  if (v.o === 'bolt') s += P(`M${p(0.04, -0.06)} L${p(-0.04, 0.06)} L${p(0.01, 0.06)} L${p(-0.03, 0.18)} L${p(0.06, 0.03)} L${p(0.01, 0.03)}Z`, '#ffe06b');
  if (v.o === 'star') s += starGem(0, hy + R * 0.06, R * 0.06, '#ffe06b');
  return s;
}
const MASKS: Style[] = [
  {
    key: 'masq', name: 'Mask', group: 'Masks', base: 30, step: 8,
    vars: [
      { k: 'feather', n: 'Feather Party', c: '#c99bff', a: '#ff9ec7', o: 'feather' },
      { k: 'gold', n: 'Golden', c: '#f0b232', a: '#fff3b0', o: 'gold', fixed: true },
      { k: 'midnight', n: 'Midnight Gem', c: '#2d3a6e', o: 'gems' },
      { k: 'lace', n: 'Lace Masquerade', c: '#ff7eb6', a: '#fffaf5', o: 'lace' },
      { k: 'peacock', n: 'Peacock', c: '#3fbf8f', o: 'peacock' },
    ],
    draw: masquerade,
  },
  { key: 'sleep', name: 'Sleep Mask', group: 'Masks', base: 15, vars: [{ k: 'pink', n: 'Sleepy', c: '#ffb3c7' }, { k: 'kitty', n: 'Kitty', c: '#e6d4ff', o: 'kitty' }, { k: 'stars', n: 'Starry', c: '#3f4f9a', o: 'stars' }, { k: 'hearts', n: 'Heart', c: '#ff7eb6', o: 'hearts' }], draw: sleepMask },
  { key: 'hero', name: 'Hero Mask', group: 'Masks', base: 20, vars: [{ k: 'purple', n: 'Purple', c: '#7a5cff', o: 'star' }, { k: 'green', n: 'Lightning', c: '#3fbf8f', o: 'bolt' }, { k: 'black', n: 'Night', c: '#2d2a3a' }], draw: heroMask },
];

// ---------- face paint ----------
const CX = 0.6;
const CY = 0.4;
function paint(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const a = v.a ?? '#ff9ec7';
  const cx = CX * R, cy = hy + CY * R;
  switch (v.o) {
    case 'butterfly': {
      const up = `M${p(0.02, 0.14)} C${p(0.08, -0.22)} ${p(0.56, -0.5)} ${p(0.86, -0.26)} C${p(1.0, -0.06)} ${p(0.86, 0.26)} ${p(0.56, 0.32)} C${p(0.3, 0.34)} ${p(0.12, 0.26)} ${p(0.02, 0.14)}Z`;
      const lo = `M${p(0.04, 0.26)} C${p(0.3, 0.32)} ${p(0.7, 0.38)} ${p(0.66, 0.6)} C${p(0.6, 0.74)} ${p(0.3, 0.64)} ${p(0.06, 0.34)}Z`;
      const hole = holeD(EX * R, hy + EY * R, R * 0.2, R * 0.21);
      let half = `<path d="${up} ${hole}" fill="${c}" fill-rule="evenodd" opacity="0.85"/>` + `<path d="${up} ${hole}" fill="none" stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.02)}" opacity="0.7"/>`;
      half += P(lo, a, `opacity="0.85" stroke="${dark(a, 0.25)}" stroke-width="${f(R * 0.02)}"`);
      for (const [u, w, r] of [[0.74, -0.22, 0.04], [0.82, 0.0, 0.03], [0.5, -0.3, 0.025], [0.5, 0.52, 0.035], [0.7, 0.2, 0.025]]) half += circ(u * R, hy + w * R, r * R, '#fff', 'opacity="0.9"');
      half += P(`M${p(0.03, 0.02)} Q${p(0.08, -0.16)} ${p(0.16, -0.24)}`, 'none', sk(dark(c, 0.35), R * 0.018, 'opacity="0.8"')) + circ(R * 0.16, hy - R * 0.25, R * 0.022, dark(c, 0.35));
      return mirror(half) + ell(0, hy + R * 0.16, R * 0.03, R * 0.12, dark(c, 0.35), 'opacity="0.8"') + sparkle(R * 0.62, hy + R * 0.46, R * 0.05);
    }
    case 'rainbow': {
      const r0 = R * 0.2;
      let s = '';
      ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff'].forEach((col, i) => {
        const r = r0 - i * R * 0.03;
        s += P(`M${f(cx - r)} ${f(cy + R * 0.04)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + r)} ${f(cy + R * 0.04)}`, 'none', sk(col, R * 0.03, 'opacity="0.9" stroke-linecap="butt"'));
      });
      for (const sd of [-1, 1]) s += circ(cx + sd * r0 * 0.9, cy + R * 0.06, R * 0.06, '#fff') + circ(cx + sd * r0 * 0.65, cy + R * 0.08, R * 0.045, '#fff');
      return s + sparkle(cx + R * 0.2, cy - R * 0.2, R * 0.04) + sparkle(-cx, cy - R * 0.04, R * 0.04, '#ffe06b');
    }
    case 'hearts':
      return mirror(P(heartD(cx, cy - R * 0.11, R * 0.23), c, `opacity="0.9" stroke="#fff" stroke-width="${f(R * 0.012)}"`) + ell(cx - R * 0.04, cy - R * 0.04, R * 0.025, R * 0.015, '#fff', 'opacity="0.7"')) +
        P(heartD(R * 0.68, hy + R * 0.16, R * 0.08), light(c, 0.3), 'opacity="0.9"') + (v.k === 'glitter' ? sparkle(cx + R * 0.12, cy - R * 0.12, R * 0.04) + sparkle(-cx - R * 0.12, cy - R * 0.1, R * 0.035) : '');
    case 'stars':
      return starGem(R * 0.66, hy + R * 0.32, R * 0.13, c) + starGem(R * 0.82, hy + R * 0.14, R * 0.075, light(c, 0.3)) + starGem(R * 0.52, hy + R * 0.5, R * 0.06, '#fff') + starGem(-R * 0.64, hy + R * 0.34, R * 0.085, c) + sparkle(R * 0.82, hy + R * 0.44, R * 0.05);
    case 'kitty': {
      let s = P(`M${p(-0.07, 0.27)} L${p(0.07, 0.27)} Q${p(0.04, 0.33)} ${p(0, 0.34)} Q${p(-0.04, 0.33)} ${p(-0.07, 0.27)}Z`, c);
      s += P(`M${p(0, 0.34)} L${p(0, 0.39)}`, 'none', sk(c, R * 0.018));
      s += mirror([[0.33, 0.3], [0.4, 0.38], [0.36, 0.46]].map(([u, w]) => P(`M${p(0.16, 0.36)} Q${p(0.26, (0.36 + w) / 2 - 0.01)} ${p(u + 0.24, w)}`, 'none', sk(c, R * 0.018, 'opacity="0.85"'))).join('') + circ(R * 0.2, hy + R * 0.42, R * 0.012, c) + circ(R * 0.24, hy + R * 0.38, R * 0.012, c));
      return s;
    }
    case 'tiger': {
      const o = v.a ?? '#ffab3d';
      let s = mirror(ell(R * 0.62, hy + R * 0.4, R * 0.24, R * 0.15, o, 'opacity="0.35"'));
      const stripe = (x1: number, y1: number, x2: number, y2: number, w: number) => P(`M${p(x1, y1 - w)} Q${p((x1 + x2) / 2, (y1 + y2) / 2 - w * 0.6)} ${p(x2, y2)} Q${p((x1 + x2) / 2, (y1 + y2) / 2 + w * 0.6)} ${p(x1, y1 + w)}Z`, c, 'opacity="0.85"');
      s += mirror(stripe(0.97, 0.22, 0.66, 0.26, 0.045) + stripe(0.95, 0.4, 0.7, 0.4, 0.04) + stripe(0.9, 0.56, 0.72, 0.52, 0.035));
      s += line(0, hy - R * 0.44, 0, hy - R * 0.32, c, R * 0.04, 0.85) + mirror(line(R * 0.13, hy - R * 0.42, R * 0.1, hy - R * 0.32, c, R * 0.03, 0.85));
      return s + P(`M${p(-0.08, 0.26)} L${p(0.08, 0.26)} Q${p(0.05, 0.33)} ${p(0, 0.34)} Q${p(-0.05, 0.33)} ${p(-0.08, 0.26)}Z`, c, 'opacity="0.9"');
    }
    case 'flowers': {
      let s = P(`M${p(0.58, 0.0)} Q${p(0.82, 0.2)} ${p(0.7, 0.6)}`, 'none', sk('#5fae6b', R * 0.02, 'opacity="0.9"'));
      s += leaf(R * 0.75, hy + R * 0.2, R * 0.1, 20) + leaf(R * 0.74, hy + R * 0.42, R * 0.09, 160) + leaf(R * 0.68, hy + R * 0.05, R * 0.08, -30);
      return s + flowerG(R * 0.64, hy + R * 0.0, R * 0.09, c) + flowerG(R * 0.78, hy + R * 0.3, R * 0.12, light(c, 0.3)) + flowerG(R * 0.7, hy + R * 0.58, R * 0.085, c) + flowerG(-R * 0.64, hy + R * 0.42, R * 0.1, c);
    }
    case 'unicorn': {
      let s = '';
      ['#ff6f91', '#ffe06b', '#7cc8ff', '#c99bff'].forEach((col, i) => {
        s += P(`M${p(0.56 + i * 0.03, 0.04 + i * 0.02)} Q${p(0.82 + i * 0.02, 0.0 + i * 0.03)} ${p(0.86 + i * 0.02, -0.3 + i * 0.05)}`, 'none', sk(col, R * 0.03, 'opacity="0.85"'));
      });
      s += P(`M${p(-0.06, -0.3)} L${p(0, -0.52)} L${p(0.06, -0.3)}Z`, 'url(#g-gold)', `stroke="#d99a1e" stroke-width="${f(R * 0.01)}"`) + P(`M${p(-0.04, -0.36)} L${p(0.04, -0.39)} M${p(-0.025, -0.43)} L${p(0.03, -0.45)}`, 'none', sk('#d99a1e', R * 0.012));
      return s + starGem(R * 0.62, hy + R * 0.34, R * 0.06, '#ffd36b') + sparkle(R * 0.76, hy + R * 0.44, R * 0.04) + sparkle(-R * 0.66, hy + R * 0.34, R * 0.05, '#c99bff') + mirror(ell(cx, cy, R * 0.12, R * 0.06, '#ff9ec7', 'opacity="0.5"'));
    }
    case 'snow': {
      let s = '';
      for (let k = 0; k < 6; k++) {
        const t = (k / 6) * Math.PI * 2;
        const ex = cx + Math.cos(t) * R * 0.18, ey = cy - R * 0.04 + Math.sin(t) * R * 0.18;
        s += line(cx, cy - R * 0.04, ex, ey, c, R * 0.026) + line(cx + Math.cos(t) * R * 0.11, cy - R * 0.04 + Math.sin(t) * R * 0.11, cx + Math.cos(t + 0.5) * R * 0.15, cy - R * 0.04 + Math.sin(t + 0.5) * R * 0.15, c, R * 0.018) + line(cx + Math.cos(t) * R * 0.11, cy - R * 0.04 + Math.sin(t) * R * 0.11, cx + Math.cos(t - 0.5) * R * 0.15, cy - R * 0.04 + Math.sin(t - 0.5) * R * 0.15, c, R * 0.018);
      }
      return s + circ(cx, cy - R * 0.04, R * 0.025, c) + [[0.42, 0.52], [0.8, 0.2], [0.82, 0.48], [-0.6, 0.42], [-0.7, 0.3]].map(([u, w]) => circ(u * R, hy + w * R, R * 0.018, '#fff', `stroke="${c}" stroke-width="${f(R * 0.006)}"`)).join('');
    }
    case 'leaves':
      return leaf(R * 0.5, hy + R * 0.46, R * 0.3, -30, '#e8573d') + leaf(R * 0.56, hy + R * 0.48, R * 0.25, 30, '#ffab3d') + leaf(R * 0.54, hy + R * 0.46, R * 0.22, -80, '#f0c23a') + leaf(-R * 0.5, hy + R * 0.46, R * 0.24, -150, '#e8573d');
    default: {
      // ladybug
      const bx = cx + R * 0.02, by = cy;
      let s = circ(bx, by - R * 0.09, R * 0.05, '#2d2a3a') + ell(bx, by, R * 0.1, R * 0.09, c) + line(bx, by - R * 0.08, bx, by + R * 0.09, '#2d2a3a', R * 0.012);
      for (const [u, w] of [[-0.05, -0.02], [0.05, -0.02], [-0.05, 0.04], [0.05, 0.04]]) s += circ(bx + u * R, by + w * R, R * 0.017, '#2d2a3a');
      s += circ(bx - R * 0.04, by - R * 0.05, R * 0.012, '#fff', 'opacity="0.7"') + P(`M${f(bx - R * 0.02)} ${f(by - R * 0.13)} q${f(-R * 0.02)} ${f(-R * 0.05)} ${f(-R * 0.05)} ${f(-R * 0.05)} M${f(bx + R * 0.02)} ${f(by - R * 0.13)} q${f(R * 0.02)} ${f(-R * 0.05)} ${f(R * 0.05)} ${f(-R * 0.05)}`, 'none', sk('#2d2a3a', R * 0.01)) +
        P(`M${f(bx - R * 0.12)} ${f(by + R * 0.12)} q${f(-R * 0.1)} ${f(R * 0.04)} ${f(-R * 0.16)} ${f(-R * 0.04)}`, 'none', sk('#2d2a3a', R * 0.008, `stroke-dasharray="${f(R * 0.02)} ${f(R * 0.02)}" opacity="0.6"`));
      return grp(`translate(${f(bx)} ${f(by)}) scale(1.6) translate(${f(-bx)} ${f(-by)})`, s);
    }
  }
}
const FACE_PAINT: Style[] = [
  {
    key: 'paint', name: 'Face Paint', group: 'Face Paint', base: 15, step: 4,
    vars: [
      { k: 'butterfly', n: 'Butterfly', name: 'Butterfly Face Paint', c: '#c99bff', a: '#ff9ec7', o: 'butterfly' },
      { k: 'hearts', n: 'Heart Cheeks', name: 'Heart Cheeks', c: '#ff4f7b', o: 'hearts' },
      { k: 'kitty', n: 'Kitty Whiskers', name: 'Kitty Whiskers', c: '#2d2a3a', o: 'kitty' },
      { k: 'rainbow', n: 'Rainbow', name: 'Rainbow Cheek', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'stars', n: 'Star', name: 'Golden Stars', c: '#ffd36b', o: 'stars' },
      { k: 'tiger', n: 'Tiger', name: 'Tiger Stripes', c: '#3a2a35', o: 'tiger' },
      { k: 'flowers', n: 'Flower', name: 'Flower Vine', c: '#ff7eb6', o: 'flowers', t: ['spring'] },
      { k: 'butterflyblue', n: 'Blue', name: 'Blue Butterfly Paint', c: '#7cc8ff', a: '#c99bff', o: 'butterfly' },
      { k: 'pinkkitty', n: 'Pink Kitty', name: 'Pink Kitty Whiskers', c: '#ff7eb6', o: 'kitty' },
      { k: 'glitter', n: 'Glitter', name: 'Glitter Heart Cheeks', c: '#ff9ec7', o: 'hearts' },
      { k: 'bluestars', n: 'Blue', name: 'Blue Stars', c: '#7cc8ff', o: 'stars' },
      { k: 'unicorn', n: 'Unicorn', name: 'Unicorn Paint', c: '#c99bff', o: 'unicorn', fixed: true },
      { k: 'daisies', n: 'Sky', name: 'Forget-Me-Not Vine', c: '#7cc8ff', o: 'flowers', t: ['spring'] },
      { k: 'snow', n: 'Snowflake', name: 'Snowflake Cheek', c: '#7cc8ff', o: 'snow', t: ['winter'] },
      { k: 'leaves', n: 'Leaf', name: 'Autumn Leaves', c: '#e8573d', o: 'leaves', fixed: true, t: ['fall'] },
      { k: 'ladybug', n: 'Ladybug', name: 'Ladybug Cheek', c: '#e8384f', o: 'ladybug', t: ['spring', 'summer'] },
    ],
    draw: paint,
  },
];

// ---------- stickers ----------
function stickers(x: WearCtx, R: number, hy: number, v: V): string {
  const c = x.c;
  switch (v.o) {
    case 'freckles':
    case 'goldfreckles': {
      let s = '';
      const spots: [number, number][] = [[0.1, 0.26], [0.18, 0.3], [0.3, 0.32], [0.42, 0.3], [0.52, 0.34], [0.36, 0.38], [0.24, 0.37], [0.46, 0.4]];
      for (const sd of [-1, 1]) for (const [u, w] of spots) s += circ(sd * u * R, hy + w * R, R * (0.016 + ((u * 37) % 1) * 0.008), c, 'opacity="0.75"');
      if (v.o === 'goldfreckles') s += sparkle(R * 0.5, hy + R * 0.28, R * 0.035) + sparkle(-R * 0.3, hy + R * 0.38, R * 0.03);
      return s;
    }
    case 'gems': {
      const cs = v.k === 'rainbow' ? ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff'] : [c, light(c, 0.3), c, light(c, 0.3), c];
      return mirror([[0.62, 0.22], [0.66, 0.31], [0.64, 0.4], [0.58, 0.48], [0.5, 0.54]].map(([u, w], i) => gem(u * R, hy + w * R, R * (0.035 - i * 0.003), cs[i])).join(''));
    }
    case 'heart':
      return heartGem(R * 0.62, hy + R * 0.42, R * 0.17, c) + sparkle(R * 0.76, hy + R * 0.3, R * 0.04);
    case 'star':
      return starGem(R * 0.7, hy + R * 0.26, R * 0.1, c) + starGem(R * 0.58, hy + R * 0.42, R * 0.05, '#fff') + sparkle(R * 0.82, hy + R * 0.4, R * 0.035);
    case 'pearls':
      return mirror([[0.56, -0.08], [0.64, -0.02], [0.7, 0.06], [0.72, 0.16]].map(([u, w], i) => pearl(u * R, hy + w * R, R * (0.038 + (i === 1 ? 0.01 : 0)))).join(''));
    default: {
      // glitter cheeks
      let s = mirror(ell(R * 0.6, hy + R * 0.38, R * 0.16, R * 0.1, c, 'opacity="0.35"'));
      for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) {
        const u = 0.6 + (((i * 0.618) % 1) - 0.5) * 0.28, w = 0.38 + (((i * 0.7548) % 1) - 0.5) * 0.16;
        s += circ(sd * u * R, hy + w * R, R * 0.01, i % 2 ? '#fff' : '#fff3b0', 'opacity="0.95"');
      }
      return s + sparkle(R * 0.7, hy + R * 0.32, R * 0.04) + sparkle(-R * 0.52, hy + R * 0.42, R * 0.035);
    }
  }
}
const STICKERS: Style[] = [
  {
    key: 'sticker', name: 'Stickers', group: 'Stickers', base: 10, step: 4,
    vars: [
      { k: 'freckles', n: '', name: 'Painted Freckles', c: '#a86b4a', o: 'freckles' },
      { k: 'pinkgems', n: 'Pink Gem', name: 'Pink Gem Stickers', c: '#ff7eb6', o: 'gems' },
      { k: 'heart', n: 'Heart', name: 'Heart Sticker', c: '#ff4f7b', o: 'heart' },
      { k: 'goldfreckles', n: '', name: 'Gold Freckles', c: '#d99a1e', o: 'goldfreckles' },
      { k: 'bluegems', n: 'Blue Gem', name: 'Blue Gem Stickers', c: '#7cc8ff', o: 'gems' },
      { k: 'rainbow', n: 'Rainbow Gem', name: 'Rainbow Gems', c: '#ff6f91', o: 'gems', fixed: true },
      { k: 'star', n: 'Star', name: 'Star Stickers', c: '#ffd36b', o: 'star' },
      { k: 'pearls', n: 'Pearl', name: 'Pearl Stickers', c: '#f7efe9', o: 'pearls', fixed: true },
      { k: 'glitter', n: 'Glitter', name: 'Glitter Cheeks', c: '#ff9ec7', o: 'glitter' },
    ],
    draw: stickers,
  },
];

// ---------- silly faces ----------
function silly(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const ny = hy + R * 0.3;
  switch (v.o) {
    case 'clown':
      return circ(0, ny, R * 0.12, dark(c, 0.15)) + circ(0, ny - R * 0.01, R * 0.11, c) + circ(0, ny, R * 0.12, 'url(#g-face)') + ell(-R * 0.04, ny - R * 0.05, R * 0.035, R * 0.022, '#fff', 'opacity="0.85"');
    case 'bunny':
      return mirror([[0.42, 0.24], [0.46, 0.32], [0.42, 0.4]].map(([u, w]) => P(`M${p(0.12, 0.31)} Q${p(0.28, (0.31 + w) / 2)} ${p(u, w)}`, 'none', sk('#ffffff', R * 0.014, 'opacity="0.95"'))).join('') + circ(R * 0.1, hy + R * 0.33, R * 0.012, '#c98aa8')) +
        P(`M${p(-0.07, 0.27)} L${p(0.07, 0.27)} Q${p(0.04, 0.33)} ${p(0, 0.34)} Q${p(-0.04, 0.33)} ${p(-0.07, 0.27)}Z`, c) + ell(-R * 0.02, ny - R * 0.02, R * 0.02, R * 0.012, '#fff', 'opacity="0.7"') +
        `<rect x="${f(-R * 0.06)}" y="${f(hy + R * 0.49)}" width="${f(R * 0.055)}" height="${f(R * 0.07)}" rx="${f(R * 0.012)}" fill="#fff" stroke="#e6dcea" stroke-width="${f(R * 0.008)}"/><rect x="${f(R * 0.005)}" y="${f(hy + R * 0.49)}" width="${f(R * 0.055)}" height="${f(R * 0.07)}" rx="${f(R * 0.012)}" fill="#fff" stroke="#e6dcea" stroke-width="${f(R * 0.008)}"/>`;
    case 'puppy':
      return ell(0, ny, R * 0.1, R * 0.07, c) + ell(-R * 0.03, ny - R * 0.025, R * 0.03, R * 0.015, '#fff', 'opacity="0.6"') + P(`M${p(0, 0.37)} L${p(0, 0.43)}`, 'none', sk(c, R * 0.018)) +
        P(`M${p(-0.06, 0.5)} Q${p(-0.07, 0.64)} ${p(0, 0.65)} Q${p(0.07, 0.64)} ${p(0.06, 0.5)}Z`, '#ff7e9a', `stroke="#e0566f" stroke-width="${f(R * 0.01)}"`) + line(0, hy + R * 0.52, 0, hy + R * 0.6, '#e0566f', R * 0.01);
    case 'pig':
      return ell(0, ny + R * 0.02, R * 0.14, R * 0.1, c, `stroke="${dark(c, 0.15)}" stroke-width="${f(R * 0.012)}"`) + ell(0, ny + R * 0.02, R * 0.14, R * 0.1, 'url(#g-face)') + ell(-R * 0.05, ny + R * 0.02, R * 0.025, R * 0.04, dark(c, 0.35)) + ell(R * 0.05, ny + R * 0.02, R * 0.025, R * 0.04, dark(c, 0.35)) + ell(-R * 0.06, ny - R * 0.04, R * 0.03, R * 0.015, '#fff', 'opacity="0.6"');
    case 'bear':
      return ell(0, hy + R * 0.38, R * 0.22, R * 0.16, c, 'opacity="0.95"') + ell(0, ny, R * 0.08, R * 0.055, '#4a2e22') + ell(-R * 0.025, ny - R * 0.02, R * 0.025, R * 0.012, '#fff', 'opacity="0.6"') + P(`M${p(0, 0.35)} L${p(0, 0.42)}`, 'none', sk('#4a2e22', R * 0.015));
    case 'duck': {
      const top = `M${p(-0.2, 0.36)} C${p(-0.2, 0.26)} ${p(0.2, 0.26)} ${p(0.2, 0.36)} Q${p(0.24, 0.44)} ${p(0, 0.45)} Q${p(-0.24, 0.44)} ${p(-0.2, 0.36)}Z`;
      const low = `M${p(-0.16, 0.45)} Q${p(0, 0.47)} ${p(0.16, 0.45)} Q${p(0.14, 0.56)} ${p(0, 0.56)} Q${p(-0.14, 0.56)} ${p(-0.16, 0.45)}Z`;
      return grp(`translate(0 ${f(ny + R * 0.1)}) scale(1.4) translate(0 ${f(-ny - R * 0.1)})`, P(low, dark(c, 0.12)) + P(top, c, `stroke="${dark(c, 0.2)}" stroke-width="${f(R * 0.012)}"`) + P(top, 'url(#g-shadeY)') + ell(-R * 0.05, ny + R * 0.04, R * 0.015, R * 0.01, dark(c, 0.4)) + ell(R * 0.05, ny + R * 0.04, R * 0.015, R * 0.01, dark(c, 0.4)) + ell(-R * 0.08, ny + R * 0.0, R * 0.04, R * 0.015, '#fff', 'opacity="0.6"'));
    }
    case 'fangs':
      return mirror(P(`M${p(0.03, 0.49)} L${p(0.11, 0.49)} L${p(0.07, 0.62)}Z`, '#fff', `stroke="#e6dcea" stroke-width="${f(R * 0.008)}" stroke-linejoin="round"`)) + mirror(ell(R * 0.6, hy + R * 0.38, R * 0.12, R * 0.06, '#c99bff', 'opacity="0.35"'));
    case 'groucho': {
      let s = glasses(R, hy, { kind: 'round', frame: '#2d2a3a', w: 0.06 });
      s += mirror(P(`M${p(0.2, -0.12)} Q${p(0.38, -0.24)} ${p(0.58, -0.12)}`, 'none', sk('#2d2a3a', R * 0.07)));
      s += P(`M${p(-0.08, 0.1)} C${p(-0.12, 0.26)} ${p(-0.16, 0.36)} ${p(0, 0.38)} C${p(0.16, 0.36)} ${p(0.12, 0.26)} ${p(0.08, 0.1)}Z`, c) + P(`M${p(-0.08, 0.1)} C${p(-0.12, 0.26)} ${p(-0.16, 0.36)} ${p(0, 0.38)} C${p(0.16, 0.36)} ${p(0.12, 0.26)} ${p(0.08, 0.1)}Z`, 'url(#g-shadeX)') + ell(-R * 0.04, hy + R * 0.28, R * 0.02, R * 0.04, '#fff', 'opacity="0.5"');
      return s + mustacheD(R, hy, 'bushy', '#2d2a3a', 0.02);
    }
    default:
      return circ(0, ny, R * 0.12, dark(c, 0.15)) + circ(0, ny - R * 0.01, R * 0.11, c) + circ(0, ny, R * 0.12, 'url(#g-face)') + ell(-R * 0.04, ny - R * 0.05, R * 0.035, R * 0.022, '#fff', 'opacity="0.85"') + sparkle(R * 0.1, ny - R * 0.1, R * 0.03);
  }
}
const SILLY: Style[] = [
  {
    key: 'silly', name: 'Nose', group: 'Silly Faces', base: 10, step: 4,
    vars: [
      { k: 'clown', n: 'Clown', c: '#e8384f', o: 'clown' },
      { k: 'bunny', n: 'Bunny', name: 'Bunny Nose & Teeth', c: '#ff9ec7', o: 'bunny', t: ['spring'] },
      { k: 'puppy', n: 'Puppy', name: 'Puppy Nose & Tongue', c: '#2d2a3a', o: 'puppy' },
      { k: 'pig', n: 'Piggy', name: 'Piggy Snout', c: '#ffb3c7', o: 'pig' },
      { k: 'bear', n: 'Bear', name: 'Teddy Snout', c: '#e8c0a0', o: 'bear' },
      { k: 'duck', n: 'Duck', name: 'Duck Bill', c: '#ffab3d', o: 'duck' },
      { k: 'pinkclown', n: 'Sparkle Clown', c: '#ff7eb6', o: 'pinkclown' },
      { k: 'fangs', n: 'Fangs', name: 'Little Vampire Fangs', c: '#ffffff', o: 'fangs', fixed: true, t: ['fall'] },
      { k: 'groucho', n: 'Disguise', name: 'Silly Disguise', c: '#ffc9a8', o: 'groucho' },
    ],
    draw: silly,
  },
];

// ---------- beards & mustaches ----------
/** A mustache between the nose and the mouth (hy+0.3R .. hy+0.47R), leaving the mouth visible. */
function mustacheD(R: number, hy: number, kind: string, c: string, dy = 0): string {
  const p = (x: number, y: number) => `${f(x * R)} ${f(hy + (y + dy) * R)}`;
  const dk = dark(c, 0.3);
  const st = `stroke="${dk}" stroke-width="${f(R * 0.012)}" stroke-linejoin="round"`;
  let half: string;
  switch (kind) {
    case 'handlebar':
      half = P(`M${p(0, 0.37)} C${p(0.1, 0.33)} ${p(0.22, 0.35)} ${p(0.3, 0.41)} C${p(0.38, 0.45)} ${p(0.46, 0.4)} ${p(0.44, 0.3)} C${p(0.5, 0.36)} ${p(0.48, 0.46)} ${p(0.38, 0.47)} C${p(0.28, 0.48)} ${p(0.16, 0.43)} ${p(0, 0.42)}Z`, c, st);
      break;
    case 'curly':
      half = P(`M${p(0, 0.37)} C${p(0.1, 0.32)} ${p(0.24, 0.34)} ${p(0.3, 0.4)} C${p(0.36, 0.45)} ${p(0.44, 0.42)} ${p(0.42, 0.36)} C${p(0.4, 0.32)} ${p(0.35, 0.34)} ${p(0.37, 0.37)} C${p(0.46, 0.36)} ${p(0.46, 0.48)} ${p(0.36, 0.48)} C${p(0.26, 0.48)} ${p(0.14, 0.43)} ${p(0, 0.42)}Z`, c, st);
      break;
    case 'bushy':
      half = P(`M${p(0, 0.35)} C${p(0.12, 0.3)} ${p(0.28, 0.32)} ${p(0.32, 0.42)} C${p(0.33, 0.48)} ${p(0.3, 0.52)} ${p(0.26, 0.5)} L${p(0.22, 0.46)} L${p(0.18, 0.49)} L${p(0.13, 0.45)} L${p(0.08, 0.48)} L${p(0.04, 0.44)} L${p(0, 0.45)}Z`, c, st);
      break;
    default:
      half = P(`M${p(0, 0.37)} C${p(0.1, 0.33)} ${p(0.22, 0.35)} ${p(0.26, 0.43)} C${p(0.18, 0.44)} ${p(0.08, 0.42)} ${p(0, 0.42)}Z`, c, st);
  }
  half += P(`M${p(0.05, 0.37)} Q${p(0.14, 0.35)} ${p(0.22, 0.38)}`, 'none', sk(light(c, 0.35), R * 0.014, 'opacity="0.7"'));
  return mirror(half);
}
/** Little hair strokes so a beard looks soft and furry. */
function fur(R: number, hy: number, c: string, pts: [number, number][], len = 0.05): string {
  let s = '';
  pts.forEach(([u, w], i) => {
    const a = Math.atan2(w - 0.3, u) + (i % 2 ? 0.25 : -0.25);
    s += line(u * R, hy + w * R, (u + Math.cos(a) * len) * R, hy + (w + Math.sin(a) * len) * R, i % 3 ? dark(c, 0.22) : light(c, 0.25), R * 0.016, 0.6);
  });
  return s;
}
function beard(x: WearCtx, R: number, hy: number, v: V): string {
  const p = at(R, hy);
  const c = x.c;
  const dk = dark(c, 0.25);
  const st = `stroke="${dk}" stroke-width="${f(R * 0.014)}" stroke-linejoin="round"`;
  const strokes: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const t = ((i * 0.618) % 1) * Math.PI * 0.8 + Math.PI * 0.1;
    const rr = 0.82 + ((i * 0.7548) % 1) * 0.14;
    strokes.push([Math.cos(t) * rr * 0.96, 0.12 + Math.sin(t) * rr * 0.86]);
  }
  const keep = (minY: number) => strokes.filter(([u, w]) => w > minY && !(Math.abs(u) < 0.22 && w < 0.66));
  switch (v.o) {
    case 'full': {
      const d = `M${p(0.97, 0.04)} C${p(1.03, 0.52)} ${p(0.82, 1.0)} ${p(0, 1.08)} C${p(-0.82, 1.0)} ${p(-1.03, 0.52)} ${p(-0.97, 0.04)} L${p(-0.84, 0.06)} C${p(-0.84, 0.42)} ${p(-0.66, 0.6)} ${p(-0.36, 0.6)} Q${p(-0.2, 0.6)} ${p(-0.17, 0.54)} Q${p(0, 0.68)} ${p(0.17, 0.54)} Q${p(0.2, 0.6)} ${p(0.36, 0.6)} C${p(0.66, 0.6)} ${p(0.84, 0.42)} ${p(0.84, 0.06)}Z`;
      return P(d, c, st) + P(d, 'url(#g-shadeX)') + fur(R, hy, c, keep(0.5)) + mustacheD(R, hy, 'plain', c) + P(`M${p(-0.3, 0.88)} Q${p(0, 0.98)} ${p(0.3, 0.88)}`, 'none', sk(light(c, 0.3), R * 0.02, 'opacity="0.5"'));
    }
    case 'short': {
      const d = `M${p(0.97, 0.12)} C${p(1.0, 0.56)} ${p(0.8, 0.98)} ${p(0, 1.0)} C${p(-0.8, 0.98)} ${p(-1.0, 0.56)} ${p(-0.97, 0.12)} L${p(-0.9, 0.12)} C${p(-0.88, 0.52)} ${p(-0.66, 0.78)} ${p(-0.3, 0.8)} Q${p(-0.18, 0.66)} ${p(0, 0.66)} Q${p(0.18, 0.66)} ${p(0.3, 0.8)} C${p(0.66, 0.78)} ${p(0.88, 0.52)} ${p(0.9, 0.12)}Z`;
      let s = P(d, c, st) + P(d, 'url(#g-shadeX)');
      for (let i = 0; i < 30; i++) {
        const t = ((i * 0.618) % 1) * Math.PI * 0.84 + Math.PI * 0.08;
        s += circ(Math.cos(t) * 0.88 * R, hy + (0.1 + Math.sin(t) * 0.82) * R, R * 0.012, dk, 'opacity="0.5"');
      }
      return s + mustacheD(R, hy, 'plain', c);
    }
    case 'goatee': {
      const d = `M${p(-0.3, 0.44)} C${p(-0.32, 0.62)} ${p(-0.2, 0.88)} ${p(0, 0.9)} C${p(0.2, 0.88)} ${p(0.32, 0.62)} ${p(0.3, 0.44)} L${p(0.22, 0.46)} C${p(0.2, 0.56)} ${p(0.12, 0.6)} ${p(0, 0.6)} C${p(-0.12, 0.6)} ${p(-0.2, 0.56)} ${p(-0.22, 0.46)}Z`;
      return P(d, c, st) + P(d, 'url(#g-shadeY)') + fur(R, hy, c, [[-0.1, 0.72], [0.08, 0.76], [0, 0.82], [-0.16, 0.66], [0.16, 0.66]], 0.04) + mustacheD(R, hy, 'plain', c);
    }
    case 'stubble': {
      const d = `M${p(0.96, 0.1)} C${p(0.97, 0.45)} ${p(0.68, 0.88)} ${p(0, 0.9)} C${p(-0.68, 0.88)} ${p(-0.97, 0.45)} ${p(-0.96, 0.1)} L${p(-0.86, 0.12)} C${p(-0.84, 0.44)} ${p(-0.64, 0.56)} ${p(-0.34, 0.56)} Q${p(-0.3, 0.36)} ${p(0, 0.35)} Q${p(0.3, 0.36)} ${p(0.34, 0.56)} C${p(0.64, 0.56)} ${p(0.84, 0.44)} ${p(0.86, 0.12)}Z`;
      const hole = holeD(0, hy + R * 0.47, R * 0.15, R * 0.07);
      let s = `<path d="${d} ${hole}" fill="${c}" fill-rule="evenodd" opacity="0.22"/>`;
      for (let i = 0; i < 70; i++) {
        const u = (((i * 0.618) % 1) * 2 - 1) * 0.9, w = 0.4 + ((i * 0.7548) % 1) * 0.56;
        const inside = (u / 0.92) ** 2 + (w / 0.86) ** 2 < 1 && !(Math.abs(u) < 0.2 && w < 0.56) && !(Math.abs(u) > 0.34 && w < 0.56 && Math.abs(u) < 0.8);
        if (inside) s += circ(u * R, hy + w * R, R * 0.008, dark(c, 0.2), 'opacity="0.7"');
      }
      return s;
    }
    case 'santa': {
      const d = `M${p(0.98, 0.04)} C${p(1.1, 0.6)} ${p(0.8, 1.3)} ${p(0, 1.36)} C${p(-0.8, 1.3)} ${p(-1.1, 0.6)} ${p(-0.98, 0.04)} L${p(-0.84, 0.06)} C${p(-0.84, 0.42)} ${p(-0.66, 0.6)} ${p(-0.36, 0.6)} Q${p(-0.2, 0.6)} ${p(-0.17, 0.54)} Q${p(0, 0.68)} ${p(0.17, 0.54)} Q${p(0.2, 0.6)} ${p(0.36, 0.6)} C${p(0.66, 0.6)} ${p(0.84, 0.42)} ${p(0.84, 0.06)}Z`;
      let s = P(d, c, `stroke="#e6dcea" stroke-width="${f(R * 0.014)}"`);
      for (const [u, w, r] of [[-0.6, 0.9, 0.18], [0.6, 0.9, 0.18], [-0.3, 1.12, 0.2], [0.3, 1.12, 0.2], [0, 1.2, 0.18], [-0.8, 0.6, 0.14], [0.8, 0.6, 0.14], [0, 0.86, 0.16]]) s += circ(u * R, hy + w * R, r * R, c) + circ(u * R - r * R * 0.3, hy + w * R - r * R * 0.3, r * R * 0.3, '#fff', 'opacity="0.6"');
      s += P(d, 'url(#g-shadeX)', 'opacity="0.6"');
      return s + mustacheD(R, hy, 'curly', c);
    }
    default:
      return mustacheD(R, hy, v.o ?? 'plain', c);
  }
}
const BEARDS: Style[] = [
  { key: 'fullBeard', name: 'Full Beard', group: 'Beards & Mustaches', base: 20, vars: [{ k: 'brown', n: 'Brown', c: '#6b4430', o: 'full' }, { k: 'black', n: 'Black', c: '#2d2a3a', o: 'full' }, { k: 'ginger', n: 'Ginger', c: '#d9733a', o: 'full' }, { k: 'gray', n: 'Gray', c: '#a7abbd', o: 'full' }], draw: beard },
  { key: 'shortBeard', name: 'Short Beard', group: 'Beards & Mustaches', base: 20, vars: [{ k: 'blond', n: 'Blond', c: '#e2b56e', o: 'short' }, { k: 'brown', n: 'Dark', c: '#4a3024', o: 'short' }], draw: beard },
  { key: 'goatee', name: 'Goatee', group: 'Beards & Mustaches', base: 15, vars: [{ k: 'black', n: 'Black', c: '#2d2a3a', o: 'goatee' }, { k: 'brown', n: 'Brown', c: '#6b4430', o: 'goatee' }], draw: beard },
  { key: 'stubble', name: 'Stubble', group: 'Beards & Mustaches', base: 10, vars: [{ k: 'dark', n: 'Dark', c: '#3a2a2a', o: 'stubble' }, { k: 'ginger', n: 'Ginger', c: '#b85a2a', o: 'stubble' }], draw: beard },
  { key: 'curlyStache', name: 'Curly Mustache', group: 'Beards & Mustaches', base: 15, vars: [{ k: 'black', n: 'Black', c: '#2d2a3a', o: 'curly' }, { k: 'ginger', n: 'Ginger', c: '#d9733a', o: 'curly' }], draw: beard },
  { key: 'handlebar', name: 'Handlebar Stache', group: 'Beards & Mustaches', base: 15, vars: [{ k: 'brown', n: 'Brown', c: '#6b4430', o: 'handlebar' }, { k: 'gray', n: 'Gray', c: '#a7abbd', o: 'handlebar' }], draw: beard },
  { key: 'bushyStache', name: 'Bushy Mustache', group: 'Beards & Mustaches', base: 15, vars: [{ k: 'brown', n: 'Brown', c: '#4a3024', o: 'bushy' }, { k: 'blond', n: 'Blond', c: '#e2b56e', o: 'bushy' }], draw: beard },
  { key: 'santaBeard', name: 'Snowy Santa Beard', group: 'Beards & Mustaches', base: 40, tags: ['winter'], vars: [{ k: 'white', n: '', name: 'Snowy Santa Beard', c: '#fffaf5', o: 'santa' }], draw: beard },
];

// ---------- building the catalog ----------
function build(styles: Style[]): WearDef[] {
  const seen: Record<string, number> = {};
  return styles.flatMap((st) => st.vars.map((v) => {
    const gi = (seen[st.group] = (seen[st.group] ?? -1) + 1);
    const price = v.price ?? (gi < 3 ? 0 : Math.min(st.max ?? 120, st.base + (gi - 3) * (st.step ?? 5)));
    const tags = [...new Set([...(st.tags ?? []), ...(v.t ?? [])])] as Season[];
    return {
      id: `face-${st.key}-${v.k}`,
      name: v.name ?? `${v.n} ${st.name}`.trim(),
      slot: 'face',
      group: st.group,
      price,
      color: v.c,
      tags: tags.length ? tags : undefined,
      fixed: v.fixed ?? st.fixed,
      head: (x: WearCtx) => st.draw(x, x.b.R, x.b.headY, v),
    } satisfies WearDef;
  }));
}

export const FACE_MORE: WearDef[] = build([
  ...ROUND, ...SQUARE, ...CAT_EYE, ...FUN, ...SUNGLASSES, ...AVIATORS, ...GOGGLES, ...MASKS, ...FACE_PAINT, ...STICKERS, ...SILLY, ...BEARDS,
]);
