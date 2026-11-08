// Bottoms: 17 cuts (shorts, jeans, skorts, tutus, mermaid skirts...), each in seven versions with its
// own print, color and trim. The skirt and leg helpers at the top are shared with the dresses catalog.
import { legPath, sideX } from '../body';
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { MOTIFS, MOTIF_BY_ID, motif } from '../motifs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, bowG, circ, flowerG, heartD, hipPiece, line, skirtLen, skirtPath, sparkleD, starD, waistband } from './base';
import { lace, patch, ruffle } from './trims';

// ---------- shared helpers ----------
export const f1 = (n: number) => n.toFixed(1);
/** Path template that formats every number it is given: D`M${x} ${y}`. */
export const D = (s: TemplateStringsArray, ...v: (number | string)[]) => {
  let o = s[0];
  for (let i = 0; i < v.length; i++) o += (typeof v[i] === 'number' ? f1(v[i] as number) : v[i]) + s[i + 1];
  return o;
};
/** A motif, optionally tilted a little. */
export const mot = (id: string, x: number, y: number, r: number, rot = 0) =>
  rot ? `<g transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})">${motif(id, x, y, r)}</g>` : motif(id, x, y, r);
const WHITE_MOTIFS = new Set(['paw', 'snowflake', 'note', 'cloud', 'ghost', 'daisy']);
/** A sew-on patch whose backing never hides a white motif. */
export const pt = (id: string, x: number, y: number, r: number) => patch(id, x, y, r, WHITE_MOTIFS.has(id) ? '#b9a3f0' : '#ffffff');
export const smallBow = (x: number, y: number, s: number, c: string) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s.toFixed(2)})">${bowG(0, 0, 1, c)}</g>`;
export const stroke = (c: string, w: number, op = 1) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"`;

/** A cheerful pastel that goes with c (roughly its complement), for cuffs, bows and piping. */
export function pop(c: string, shift = 150): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  let h = 0;
  if (mx !== mn) {
    const d = mx - mn;
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  const sat = mx - mn < 0.08 ? 0.75 : 0.8;
  const hue = (((mx - mn < 0.08 ? 340 : h + shift) % 360) + 360) % 360;
  const lig = 0.74;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const ch = (n: number) => Math.round((lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(8)}${ch(4)}`;
}

export type Style = 'place' | 'scatter' | 'pattern';
export const PATTERNS: Pattern[] = ['dots', 'stripes', 'hearts', 'stars', 'check', 'flowers'];
export const PAT_NAME: Record<string, string> = { dots: 'Polka Dot', stripes: 'Stripy', hearts: 'Hearts', stars: 'Starry', check: 'Gingham', flowers: 'Flowery' };
const SHORT_NAMES: Record<string, string> = { ghost: 'Ghost', leaf: 'Leaf', bolt: 'Zap', note: 'Music', ribbon: 'Bow', sun: 'Sunny', bear: 'Teddy', cute: 'Cutie', hi: 'Hello', watermelon: 'Melon', fish: 'Fishy' };
export const mName = (id: string) => SHORT_NAMES[id] ?? MOTIF_BY_ID[id]?.name ?? 'Cute';

/** Picks the garment color for a variant: the cut's own palette or the motif's suggested colors. */
export function pickColor(motifId: string, i: number, key: string, colors?: string[], avoidWhite = false): string {
  const m = MOTIF_BY_ID[motifId] ?? MOTIFS[0];
  const list = colors ?? m.bg;
  let c = list[(i + key.length) % list.length];
  if (avoidWhite && c.toLowerCase() === '#ffffff') c = list[(i + key.length + 1) % list.length];
  if (avoidWhite && c.toLowerCase() === '#ffffff') c = '#ffb3c7';
  return c;
}
export function seasonTags(cutTags: Season[] | undefined, motifId: string): Season[] | undefined {
  const s = MOTIF_BY_ID[motifId]?.season;
  const t = [...new Set([...(cutTags ?? []), ...(s ? [s] : [])])] as Season[];
  return t.length ? t : undefined;
}
/** Item name, dropping the trim word when it would get too long. */
const TINY: Record<string, string> = { 'Polka Dot': 'Dotty', Strawberry: 'Berry', Butterfly: 'Flutter', Sunflower: 'Sunny', Watermelon: 'Melon', Snowflake: 'Snowy', Ice: 'Ice' };
export function itemName(parts: string[], fallback: string[]): string {
  const a = parts.filter(Boolean).join(' ');
  if (a.length <= 22) return a;
  const b = fallback.filter(Boolean).join(' ');
  if (b.length <= 22) return b;
  return fallback.filter(Boolean).map((w) => TINY[w] ?? w).join(' ');
}

// ----- skirts -----
export interface Sk { ty: number; tx: number; hy: number; hx: number; l: number; flare: number; d: string }
/** A skirt shape that matches base.skirtPath, with its measurements for placing details. */
export function sk(x: WearCtx, l: number, flare: number, rise = 2): Sk {
  const b = x.b;
  const ty = b.waistY - rise;
  return { ty, tx: sideX(b, ty) + 1, hy: b.hipY + l, hx: b.hiW + flare, l, flare, d: skirtPath(b, l, flare, rise) };
}
/** Hem height at x (the hem dips 6 in the middle). */
export const skHem = (s: Sk, xx: number) => s.hy + 6 * (1 - Math.min(1, (xx / s.hx) ** 2));
/** Safe half width of the skirt at height y. */
export const skW = (x: WearCtx, s: Sk, y: number) => (y <= x.b.hipY ? sideX(x.b, y) + 1 : x.b.hiW + s.flare * Math.min(1, (y - x.b.hipY) / Math.max(1, s.l)));
const skSlope = (s: Sk) => (s.flare * 0.5) / (s.l + 4);
/** A band following the hem, from o1 to o2 above it. */
export function skBandD(s: Sk, o1: number, o2: number): string {
  const k = skSlope(s);
  const x1 = s.hx - o1 * k;
  const x2 = s.hx - o2 * k;
  const y1 = s.hy - o1;
  const y2 = s.hy - o2;
  return D`M${-x1} ${y1} Q0 ${y1 + 12} ${x1} ${y1} L${x2} ${y2} Q0 ${y2 + 12} ${-x2} ${y2}Z`;
}
export const skStroke = (s: Sk, o: number, c: string, w = 2.5, op = 1) => {
  const xo = s.hx - o * skSlope(s) - 1.5;
  const y = s.hy - o;
  return `<path d="${D`M${-xo} ${y} Q0 ${y + 12} ${xo} ${y}`}" ${stroke(c, w, op)}/>`;
};
/** Ruffle sewn on along the hem. */
export function skRuffle(s: Sk, c: string, depth = 7, n = 9, p: string = 'none'): string {
  const x0 = -s.hx - 3;
  const x1 = s.hx + 3;
  const w = (x1 - x0) / n;
  const H = (xx: number) => skHem(s, xx);
  let d = D`M${x0} ${s.hy - 4} L${x0} ${H(x0) + depth * 0.25}`;
  let folds = '';
  for (let i = 0; i < n; i++) {
    const xa = x0 + w * i;
    const xb = xa + w;
    const xm = (xa + xb) / 2;
    d += D` Q${xm} ${H(xm) + depth * 1.7} ${xb} ${H(xb) + depth * 0.25}`;
    if (i < n - 1) folds += line(xb, H(xb) - 1, xb, H(xb) + depth * 0.25, dark(c, 0.22), 1.2, 0.7);
    folds += P(D`M${xm - w * 0.28} ${H(xm) + depth * 0.45} Q${xm} ${H(xm) + depth * 0.9} ${xm + w * 0.28} ${H(xm) + depth * 0.45}`, 'none', stroke('#ffffff', 1.2, 0.45));
  }
  d += D` L${x1} ${s.hy - 4} Q0 ${s.hy + 8} ${x0} ${s.hy - 4}Z`;
  return cloth(d, c, p, 'y') + folds + skStroke(s, 3, dark(c, 0.12), 1.4, 0.6);
}
/** White lace peeking out under the hem (draw it before the skirt). */
export function skLace(s: Sk, c = '#ffffff', depth = 7): string {
  const n = Math.max(7, Math.round((s.hx * 2) / 9));
  const x0 = -s.hx - 1;
  const w = (s.hx * 2 + 2) / n;
  const H = (xx: number) => skHem(s, xx);
  let d = D`M${-s.hx + 4} ${s.hy - 4} L${x0} ${H(x0) + 1}`;
  let holes = '';
  for (let i = 0; i < n; i++) {
    const xa = x0 + w * i;
    const xb = xa + w;
    const xm = (xa + xb) / 2;
    d += D` Q${xm} ${H(xm) + depth * 1.9} ${xb} ${H(xb) + 1}`;
    holes += circ(xm, H(xm) + depth * 0.55, 1.3, dark(c, 0.2), 'opacity="0.45"');
  }
  d += D` L${s.hx - 4} ${s.hy - 4}Z`;
  return P(d, c, `stroke="${dark(c, 0.14)}" stroke-width="0.8"`) + holes;
}
/** Builds a skirt outline with a custom hem: segs run from (hx, hy) to (-hx, hy). */
export function skCustom(x: WearCtx, s: Sk, segs: string): string {
  const b = x.b;
  return D`M${-s.tx} ${s.ty} L${s.tx} ${s.ty} Q${b.hiW + s.flare * 0.5} ${b.hipY - 4} ${s.hx} ${s.hy}` + segs + D` Q${-b.hiW - s.flare * 0.5} ${b.hipY - 4} ${-s.tx} ${s.ty}Z`;
}
/** Rounded scallops along the hem. */
export function hemScallops(s: Sk, n: number, depth: number): string {
  let d = '';
  const w = (s.hx * 2) / n;
  for (let i = 0; i < n; i++) {
    const xa = s.hx - w * i;
    const xb = xa - w;
    const xm = (xa + xb) / 2;
    d += D` Q${xm} ${skHem(s, xm) + depth * 2} ${xb} ${skHem(s, xb)}`;
  }
  return d;
}
/** Pointy petals (or leaves) along the hem. */
export function hemPetals(s: Sk, n: number, depth: number): string {
  let d = '';
  const w = (s.hx * 2) / n;
  for (let i = 0; i < n; i++) {
    const xa = s.hx - w * i;
    const xb = xa - w;
    const xm = (xa + xb) / 2;
    const ty = skHem(s, xm) + depth;
    d += D` C${xa} ${skHem(s, xa) + depth * 0.6} ${xm + w * 0.2} ${ty - depth * 0.15} ${xm} ${ty} C${xm - w * 0.2} ${ty - depth * 0.15} ${xb} ${skHem(s, xb) + depth * 0.6} ${xb} ${skHem(s, xb)}`;
  }
  return d;
}
/** Motifs scattered over a skirt between y0 and y1, kept inside its sides. */
export function skPrint(x: WearCtx, s: Sk, id: string, y0: number, y1: number, r: number, wAt?: (y: number) => number): string {
  if (y1 - y0 < r * 1.6) return y1 - y0 > r ? mot(id, 0, (y0 + y1) / 2, r * 0.8) : '';
  const rows = Math.max(1, Math.round((y1 - y0) / (r * 3)));
  let o = '';
  for (let j = 0; j < rows; j++) {
    const y = y0 + ((j + 0.5) * (y1 - y0)) / rows;
    const hw = Math.max(0, (wAt ? wAt(y - r) : skW(x, s, y - r)) - r - 3);
    const n = Math.max(1, Math.round((hw * 2) / (r * 3.1)));
    for (let k = 0; k < n; k++) {
      let xx = n === 1 ? (j % 2 ? hw * 0.3 : -hw * 0.3) : -hw + ((hw * 2) * (k + 0.5 + (j % 2 ? 0.22 : -0.22))) / n;
      xx = Math.max(-hw, Math.min(hw, xx));
      o += mot(id, xx, y, r, ((j + k) % 3) * 9 - 9);
    }
  }
  return o;
}
/** Twinkles sprinkled inside a skirt. */
export function skSparkles(x: WearCtx, s: Sk, y0: number, y1: number, n = 8, c = '#fff8c8', wAt?: (y: number) => number): string {
  let o = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + ((i + 0.5) / n) * (y1 - y0);
    const hw = Math.max(0, (wAt ? wAt(y) : skW(x, s, y)) - 6);
    const xx = -hw + ((i * 0.618 + 0.3) % 1) * hw * 2;
    o += P(sparkleD(xx, y, 2.4 + (i % 3) * 1.1), c, 'opacity="0.95"');
  }
  return o;
}
/** Soft vertical folds from the waist to the hem. */
export function skFolds(x: WearCtx, s: Sk, n = 2, op = 0.5, y0?: number): string {
  let o = '';
  const top = y0 ?? x.b.hipY - 2;
  for (let i = -n; i <= n; i++) {
    if (i === 0) continue;
    const xh = (i / (n + 0.7)) * s.hx;
    const xt = (i / (n + 0.7)) * s.tx * 0.9;
    o += P(D`M${xt} ${top} Q${(xt + xh) / 2 + i} ${(top + s.hy) / 2} ${xh} ${skHem(s, xh) - 1}`, 'none', stroke('#3a1d3f', 1.4, op * 0.3));
  }
  return o;
}

// ----- legs -----
export const legHalf = (x: WearCtx, extra: number) => x.b.legW / 2 + extra;
/** Motifs running down a leg (mirrored on the other side). */
export function legPrint(id: string, y0: number, y1: number, r: number, hw: number, side: 1 | -1): string {
  if (y1 - y0 < r * 1.5) return '';
  const rows = Math.max(1, Math.round((y1 - y0) / (r * 2.9)));
  const ox = Math.max(0, hw - r - 1.5) * 0.6;
  let o = '';
  for (let j = 0; j < rows; j++) {
    const y = y0 + ((j + 0.5) * (y1 - y0)) / rows;
    o += mot(id, (j % 2 ? ox : -ox) * side, y, r, (j % 2 ? 9 : -9) * side);
  }
  return o;
}
const luma0 = (c: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); return (r * 0.3 + g * 0.59 + b * 0.11) / 255; };
const legShine = (hw: number, l: number, side: 1 | -1) => line(-side * hw * 0.35, 6, -side * hw * 0.3, l - 6, '#ffffff', 2, 0.18);

// ---------- the catalog ----------
type Trim = 'none' | 'band' | 'ruffle' | 'lace' | 'stripes' | 'bow' | 'sparkle' | 'pocket' | 'patch' | 'rainbow' | 'heart' | 'cuff' | 'belt' | 'flowers';
interface V { m: string; t: Trim; st: Style; i: number }
interface Cut {
  key: string;
  name: string;
  group: string;
  tags?: Season[];
  premium?: number;
  colors?: string[];
  motifs: string[];
  trims: Trim[];
  body: (x: WearCtx, v: V) => string;
  leg?: (x: WearCtx, side: 1 | -1, v: V) => string;
}

const A = (x: WearCtx) => pop(x.c);
const STYLES: Style[] = ['place', 'scatter', 'place', 'pattern', 'scatter', 'place', 'pattern'];
const TRIM_WORD: Partial<Record<Trim, string>> = { ruffle: 'Ruffle', lace: 'Lace', sparkle: 'Sparkle', stripes: 'Sporty', rainbow: 'Rainbow', heart: 'Heart' };
const PAINT = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
const DENIM = ['#7aa6e8', '#5d86d6', '#a9c8f0', '#f7a8c8', '#c9b3f0', '#9fdcc8', '#4f6fb0'];

const pantsTop = (x: WearCtx, fly = true) =>
  hipPiece(x.b, x.c, x.p) + waistband(x.b, dark(x.c, 0.12)) +
  (fly ? line(-2, x.b.waistY + 5, -2, x.b.hipY - 1, dark(x.c, 0.22), 1.3, 0.6) + circ(0, x.b.waistY + 1, 2.4, '#ffd24a') : '');
const drawstring = (x: WearCtx, c: string) => {
  const y = x.b.waistY + 2;
  return P(D`M-1 ${y} C-8 ${y - 6} -10 ${y + 4} -3 ${y + 2}Z M1 ${y} C8 ${y - 6} 10 ${y + 4} 3 ${y + 2}Z`, c) + line(-2, y + 2, -5, y + 12, c, 1.6) + line(2, y + 2, 5, y + 12, c, 1.6);
};
/** Placed/scattered/patch art on a leg, depending on the variant's style. */
function legArt(v: V, side: 1 | -1, y0: number, y1: number, hw: number, r: number): string {
  if (y1 - y0 < 6) return '';
  const rr = Math.min(r, (y1 - y0) / 2, hw - 2);
  if (v.st === 'scatter') return legPrint(v.m, y0, y1, Math.min(rr * 0.72, 5.2), hw, side);
  if (v.st === 'place') return side === -1 ? mot(v.m, 0, (y0 + y1) / 2, rr, -6) : '';
  return side === 1 ? pt(v.m, 0, (y0 + y1) / 2, Math.min(rr * 0.85, 7.5)) : '';
}
/** Trims at the bottom of a leg hem at y=l with half width hw. */
function legTrim(x: WearCtx, t: Trim, side: 1 | -1, l: number, hw: number): string {
  const a = A(x);
  switch (t) {
    case 'ruffle':
      return ruffle(-hw - 3, hw + 3, l + 5, light(x.c, 0.25), 6, 4);
    case 'lace':
      return lace(-hw - 1, hw + 1, l + 1);
    case 'band':
    case 'cuff':
      return `<rect x="${f1(-hw - 1)}" y="${f1(l - 7)}" width="${f1(hw * 2 + 2)}" height="7" rx="3" fill="${t === 'band' ? a : light(x.c, 0.18)}"/>` + line(-hw + 1, l - 3.5, hw - 1, l - 3.5, light(t === 'band' ? a : x.c, 0.5), 1, 0.7);
    case 'stripes':
      return line(side * (hw - 2.5), 0, side * (hw - 2.5), l - 2, a, 2.6) + line(side * (hw - 6.5), 0, side * (hw - 6.5), l - 2, a, 2.6);
    case 'rainbow':
      return PAINT.slice(0, 4).map((c, k) => `<rect x="${f1(-hw - 0.5)}" y="${f1(l - 4 - k * 4)}" width="${f1(hw * 2 + 1)}" height="4" fill="${c}"/>`).join('');
    case 'bow':
      return side === 1 ? smallBow(hw - 3, l - 6, 0.3, a) : '';
    case 'sparkle': {
      let s = '';
      for (let i = 0; i < 4; i++) s += P(sparkleD(((i * 0.618 + 0.2) % 1) * hw * 1.4 - hw * 0.7, 14 + ((i + 0.5) / 4) * (l - 22), 2.4 + (i % 2)), '#fff8c8');
      return s;
    }
    case 'heart':
      return side === -1 ? P(heartD(0, l * 0.44, 8), a) + P(heartD(0, l * 0.44, 8), 'none', `stroke="${light(a, 0.5)}" stroke-width="1" stroke-dasharray="1.6 1.6"`) : '';
    case 'flowers':
      return flowerG(-hw * 0.45, l - 11, 3.6, '#ffffff', a) + flowerG(hw * 0.45, l - 14, 3, light(a, 0.3));
    default:
      return '';
  }
}

/** Shared skirt trims (lace is drawn underneath by the cut itself). */
function skTrim(x: WearCtx, s: Sk, t: Trim): string {
  const a = A(x);
  switch (t) {
    case 'band':
      return P(skBandD(s, 0, 7), a) + P(skBandD(s, 0, 7), 'url(#g-shadeX)') + skStroke(s, 3.5, light(a, 0.45), 1, 0.7);
    case 'stripes':
      return skStroke(s, 6, a, 2.6) + skStroke(s, 11, a, 2.6);
    case 'ruffle':
      return skRuffle(s, light(x.c, 0.22), 6, 9, x.p);
    case 'sparkle':
      return skSparkles(x, s, x.b.hipY + 14, s.hy - 6, 9);
    case 'rainbow':
      return PAINT.map((c, k) => P(skBandD(s, k * 3.4, k * 3.4 + 3.6), c)).join('');
    case 'bow':
      return smallBow(x.b.waW - 4, x.b.waistY + 2, 0.45, a);
    case 'flowers': {
      let o = '';
      const n = Math.max(4, Math.round(s.hx / 9));
      for (let k = 0; k < n; k++) {
        const xx = -s.hx + 8 + ((s.hx * 2 - 16) * k) / Math.max(1, n - 1);
        o += flowerG(xx, skHem(s, xx) - 7, 4, k % 2 ? '#ffffff' : light(a, 0.3), '#ffd36b');
      }
      return o;
    }
    default:
      return '';
  }
}
/** Placed, scattered or patch art on a skirt's lower part. */
function skArt(x: WearCtx, s: Sk, v: V, r: number, wAt?: (y: number) => number, dx = 0): string {
  const y0 = x.b.hipY + 14;
  const y1 = s.hy - (v.t === 'band' || v.t === 'stripes' || v.t === 'flowers' || v.t === 'rainbow' ? 16 : 6);
  if (v.st === 'scatter') return skPrint(x, s, v.m, y0, y1, Math.min(6, r * 0.6), wAt);
  const yy = Math.max(y0 + 2, Math.min(y1 - r, (y0 + y1) / 2 + 2));
  const rr = Math.min(r, Math.max(5, (y1 - y0) / 2));
  if (v.st === 'place') return mot(v.m, dx || -s.hx * 0.38, yy, rr, -8);
  return pt(v.m, s.hx * 0.42, yy, Math.min(rr * 0.75, 8));
}

// ----- special shapes -----
export function bubbleShape(x: WearCtx, l: number, puff: number) {
  const b = x.b;
  const ty = b.waistY - 2;
  const tx = sideX(b, ty) + 1;
  const my = b.hipY + l * 0.45;
  const mx = b.hiW + puff;
  const hy = b.hipY + l;
  const hx = b.hiW + puff * 0.45;
  const d = D`M${-tx} ${ty} L${tx} ${ty} C${b.hiW + 2} ${b.hipY - 10} ${mx} ${my - l * 0.35} ${mx} ${my} C${mx} ${my + l * 0.32} ${hx + 6} ${hy} ${hx} ${hy} Q0 ${hy + 10} ${-hx} ${hy} C${-hx - 6} ${hy} ${-mx} ${my + l * 0.32} ${-mx} ${my} C${-mx} ${my - l * 0.35} ${-b.hiW - 2} ${b.hipY - 10} ${-tx} ${ty}Z`;
  const wAt = (y: number) => (y <= b.hipY ? sideX(b, y) : y <= my ? b.hiW + (mx - b.hiW) * ((y - b.hipY) / (my - b.hipY)) : mx + (hx - mx) * ((y - my) / (hy - my)));
  return { d, my, mx, hy, hx, wAt };
}

export function mermaidShape(x: WearCtx, l: number, fin: number) {
  const b = x.b;
  const ty = b.waistY - 2;
  const tx = sideX(b, ty) + 1;
  const hy = b.hipY + l;
  const ky = b.hipY + l * 0.64;
  const kw = b.hiW - 3;
  const hx = b.hiW + fin;
  let hem = '';
  const n = 5;
  for (let i = 0; i < n; i++) {
    const xa = hx - ((hx * 2) * i) / n;
    const xb = hx - ((hx * 2) * (i + 1)) / n;
    const xm = (xa + xb) / 2;
    hem += D` Q${xm} ${hy + 12 - Math.abs(xm / hx) * 6} ${xb} ${hy + (Math.abs(xb) < hx - 1 ? 2 : 0)}`;
  }
  const d = D`M${-tx} ${ty} L${tx} ${ty} Q${b.hiW + 3} ${b.hipY - 8} ${b.hiW + 1} ${b.hipY + 2} Q${kw + 1} ${ky - l * 0.15} ${kw} ${ky} Q${kw + 2} ${ky + (hy - ky) * 0.55} ${hx} ${hy}` + hem +
    D` Q${-kw - 2} ${ky + (hy - ky) * 0.55} ${-kw} ${ky} Q${-kw - 1} ${ky - l * 0.15} ${-b.hiW - 1} ${b.hipY + 2} Q${-b.hiW - 3} ${b.hipY - 8} ${-tx} ${ty}Z`;
  const fin2 = D`M${-kw} ${ky} Q0 ${ky + 8} ${kw} ${ky} Q${kw + 2} ${ky + (hy - ky) * 0.55} ${hx} ${hy}` + hem + D` Q${-kw - 2} ${ky + (hy - ky) * 0.55} ${-kw} ${ky}Z`;
  return { d, fin: fin2, ky, kw, hy, hx };
}

/** Tulle layer with soft scallops. */
export function tulle(x: WearCtx, y0: number, hy: number, hw: number, n: number, c: string, op = 1, pointy = false): string {
  const tx = x.b.waW + 1;
  const H = (xx: number) => hy + 5 * (1 - Math.min(1, (xx / hw) ** 2));
  const cy = y0 + (hy - y0) * 0.42;
  let d = D`M${-tx} ${y0} L${tx} ${y0} Q${hw * 0.96} ${cy} ${hw} ${H(hw) - 3}`;
  for (let i = 0; i < n; i++) {
    const xa = hw - ((hw * 2) * i) / n;
    const xb = hw - ((hw * 2) * (i + 1)) / n;
    const xm = (xa + xb) / 2;
    d += pointy ? D` Q${xa - (xa - xm) * 0.4} ${H(xm) + 2} ${xm} ${H(xm) + 5} Q${xb + (xm - xb) * 0.4} ${H(xm) + 2} ${xb} ${H(xb) - 3}` : D` Q${xm} ${H(xm) + 10} ${xb} ${H(xb) - 3}`;
  }
  d += D` Q${-hw * 0.96} ${cy} ${-tx} ${y0}Z`;
  let s = `<g opacity="${op}">${cloth(d, c, x.p, 'y')}`;
  for (let i = -2; i <= 2; i++) s += line(i * tx * 0.3, y0 + 6, i * hw * 0.32, hy - 2, '#ffffff', 1, 0.3);
  return s + '</g>';
}

// ---------- cuts ----------
const CUTS: Cut[] = [
  {
    key: 'shorts', name: 'Shorts', group: 'Shorts', tags: ['summer'],
    motifs: ['strawberry', 'cherry', 'daisy', 'lemon', 'heart', 'star', 'bunny'], trims: ['cuff', 'ruffle', 'band', 'cuff', 'bow', 'lace', 'band'],
    body: (x) => pantsTop(x, false) + drawstring(x, '#ffffff'),
    leg: (x, side, v) => {
      const l = x.L * 0.5;
      const hw = legHalf(x, 3.5) + 2;
      let s = cloth(legPath(x.b.legW, l, 3.5, 2), x.c, x.p) + legShine(hw, l, side);
      s += legArt(v, side, 13, l - (v.t === 'ruffle' || v.t === 'lace' ? 3 : 8), hw, 6.5);
      s += legTrim(x, v.t, side, l, hw);
      return s;
    },
  },
  {
    key: 'bike', name: 'Bike Shorts', group: 'Bike Shorts', tags: ['summer', 'spring'],
    motifs: ['bolt', 'star', 'heart', 'rainbow', 'butterfly', 'moon', 'gem'], trims: ['stripes', 'none', 'stripes', 'band', 'sparkle', 'stripes', 'none'],
    body: (x) => hipPiece(x.b, x.c, x.p) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="9" rx="4" fill="${A(x)}"/>`,
    leg: (x, side, v) => {
      const l = x.L * 0.6;
      const hw = legHalf(x, 1.5);
      let s = cloth(legPath(x.b.legW, l, 1.5), x.c, x.p) + legShine(hw, l, side);
      s += `<rect x="${f1(-hw)}" y="${f1(l - 5)}" width="${f1(hw * 2)}" height="5" rx="2" fill="${dark(x.c, 0.15)}"/>`;
      s += legArt(v, side, 14, l - 8, hw - 3, 6);
      s += legTrim(x, v.t, side, l, hw);
      return s;
    },
  },
  {
    key: 'cutoffs', name: 'Denim Cutoffs', group: 'Denim Cutoffs', tags: ['summer'], colors: DENIM,
    motifs: ['heart', 'daisy', 'smiley', 'star', 'cherry', 'rainbow', 'butterfly'], trims: ['none', 'heart', 'flowers', 'none', 'sparkle', 'rainbow', 'none'],
    body: (x) => pantsTop(x) + line(-x.b.waW + 8, x.b.waistY + 7, -x.b.waW + 15, x.b.hipY - 2, light(x.c, 0.3), 1.4) + line(x.b.waW - 8, x.b.waistY + 7, x.b.waW - 15, x.b.hipY - 2, light(x.c, 0.3), 1.4),
    leg: (x, side, v) => {
      const l = x.L * 0.46;
      const hw = legHalf(x, 3.5) + 1.5;
      // pocket lining peeking out below the hem
      let s = `<rect x="${f1(side > 0 ? hw - 11 : -hw + 1)}" y="${f1(l - 6)}" width="10" height="9" rx="3" fill="#ffffff"/>`;
      s += cloth(legPath(x.b.legW, l, 3.5, 1.5), x.c, x.p) + legShine(hw, l, side);
      s += line(side * (hw - 3), 2, side * (hw - 3), l - 3, '#ffc061', 1, 0.8).replace('/>', ' stroke-dasharray="2 2"/>');
      for (let i = 0; i < 9; i++) {
        const xx = -hw + 1 + ((hw * 2 - 2) * i) / 8;
        s += line(xx, l - 1, xx + (i % 2 ? 0.8 : -0.8), l + 3 + (i % 3), light(x.c, 0.55), 1.3);
      }
      s += legArt(v, side, 13, l - 5, hw, 6.5);
      if (v.t === 'heart') s += side === -1 ? '' : P(heartD(0, 12, 6), A(x)) + P(heartD(0, 12, 6), 'none', `stroke="#fff" stroke-width="0.8" stroke-dasharray="1.4 1.4"`);
      else if (v.t === 'flowers') s += flowerG(side * (hw - 6), l - 7, 3.4, '#ffffff', '#ffd36b');
      else s += legTrim(x, v.t, side, l, hw);
      return s;
    },
  },
  {
    key: 'skort', name: 'Skort', group: 'Skorts', tags: ['spring', 'summer'],
    motifs: ['tulip', 'lemon', 'paw', 'heart', 'sun', 'cherry', 'star'], trims: ['stripes', 'none', 'band', 'stripes', 'ruffle', 'bow', 'lace'],
    body: (x, v) => {
      const l = skirtLen(x, x.b.legLen * 0.44);
      const s = sk(x, l, 12);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + waistband(x.b, dark(x.c, 0.12));
      const ex = s.hx * 0.46;
      const ey = skHem(s, ex);
      o += P(D`M8 ${s.ty + 6} Q${ex * 0.5} ${x.b.hipY} ${ex} ${ey} L${ex + 7} ${skHem(s, ex + 7)} Q${ex * 0.55 + 6} ${x.b.hipY} 14 ${s.ty + 6}Z`, dark(x.c, 0.25), 'opacity="0.35"');
      o += P(D`M8 ${s.ty + 6} Q${ex * 0.5} ${x.b.hipY} ${ex} ${ey}`, 'none', stroke(light(x.c, 0.35), 1.6, 0.9));
      o += skArt(x, s, v, 9);
      o += skTrim(x, s, v.t);
      o += circ(ex - 3, ey - (v.t === 'band' || v.t === 'stripes' ? 18 : 10), 2.8, A(x), `stroke="${dark(A(x), 0.25)}" stroke-width="0.8"`);
      return o;
    },
  },
  {
    key: 'school', name: 'School Skirt', group: 'School Skirts', tags: ['fall'], colors: ['#3f4f9a', '#e85d7a', '#9b6bff', '#5fa86f', '#c2325a', '#7cc8ff', '#ffb3c7'],
    motifs: ['star', 'heart', 'crown', 'apple', 'note', 'ribbon', 'paw'], trims: ['none', 'lace', 'stripes', 'bow', 'band', 'none', 'lace'],
    body: (x, v) => {
      const l = skirtLen(x, x.b.legLen * 0.45);
      const s = sk(x, l, 18);
      const n = 8;
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(skCustom(x, s, hemScallops(s, n, 1.6)), x.c, x.p) + waistband(x.b, dark(x.c, 0.15));
      if (v.st !== 'pattern') {
        // tartan: two wide bands and fanned stripes, with a thin accent line through each
        const a = light(x.c, 0.55);
        for (const fr of [0.26, 0.62]) o += P(skBandD(s, l * fr, l * fr + 7), dark(x.c, 0.35), 'opacity="0.35"') + skStroke(s, l * fr + 3.5, a, 1.1, 0.8);
        for (let k = -3; k <= 3; k++) {
          const xh = (k / 3.5) * s.hx;
          const xt = (k / 3.5) * s.tx;
          o += line(xt, s.ty + 6, xh, skHem(s, xh) - 1, dark(x.c, 0.35), 5, 0.28) + line(xt, s.ty + 6, xh, skHem(s, xh) - 1, a, 1.1, 0.7);
        }
      }
      for (let k = 0; k < n - 1; k++) {
        const xh = s.hx - ((s.hx * 2) * (k + 1)) / n;
        const xt = xh * (sideX(x.b, x.b.hipY - 4) / s.hx);
        o += P(D`M${xt} ${x.b.hipY - 4} L${xh - 2.5} ${skHem(s, xh) + 0.5} L${xh + 2.5} ${skHem(s, xh) + 0.5}Z`, dark(x.c, 0.3), 'opacity="0.35"');
      }
      if (v.st === 'pattern') o += pt(v.m, s.hx * 0.42, s.hy - 14, 7);
      else if (v.st === 'scatter') o += skPrint(x, s, v.m, x.b.hipY + 14, s.hy - 16, 4.5);
      else o += P(D`M${-s.hx * 0.42 - 8} ${s.hy - 24} L${-s.hx * 0.42 + 8} ${s.hy - 24} L${-s.hx * 0.42 + 8} ${s.hy - 13} L${-s.hx * 0.42} ${s.hy - 8} L${-s.hx * 0.42 - 8} ${s.hy - 13}Z`, '#ffffff', `stroke="${dark(x.c, 0.2)}" stroke-width="1"`) + mot(v.m, -s.hx * 0.42, s.hy - 17, 5.5);
      o += skTrim(x, s, v.t === 'stripes' ? 'stripes' : v.t === 'band' ? 'band' : v.t === 'bow' ? 'bow' : 'none');
      return o;
    },
  },
  {
    key: 'aline', name: 'A-Line Skirt', group: 'A-Line Skirts', tags: ['spring', 'fall'],
    motifs: ['bunny', 'kitty', 'bear', 'panda', 'dino', 'unicorn', 'fish'], trims: ['pocket', 'none', 'band', 'pocket', 'none', 'lace', 'pocket'],
    body: (x, v) => {
      const l = skirtLen(x, x.b.legLen * 0.56);
      const s = sk(x, l, 16);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + waistband(x.b, dark(x.c, 0.12)) + skFolds(x, s, 2, 0.8);
      // button placket
      const bx = 6;
      o += line(bx, s.ty + 6, bx + 2, skHem(s, bx) - 2, dark(x.c, 0.2), 1.4, 0.7);
      const by0 = x.b.hipY + 14;
      for (let k = 0; k < 3; k++) {
        const y = by0 + ((s.hy - 8 - by0) * k) / 2.4;
        o += circ(bx + 1 + (k * 2) / 3 + 5, y, 2.6, '#ffffff', `stroke="${dark(x.c, 0.3)}" stroke-width="0.8"`);
      }
      if (v.t === 'pocket') {
        const py = x.b.hipY + 16;
        const px = -s.hx * 0.45;
        o += mot(v.m, px, py - 1, 7.5, -10);
        o += P(D`M${px - 10} ${py} L${px + 10} ${py} L${px + 10} ${py + 12} Q${px + 10} ${py + 16} ${px + 6} ${py + 16} L${px - 6} ${py + 16} Q${px - 10} ${py + 16} ${px - 10} ${py + 12}Z`, dark(x.c, 0.08)) +
          line(px - 8, py + 2.5, px + 8, py + 2.5, light(x.c, 0.45), 1.1, 0.8);
        if (v.st !== 'place') o += skArt(x, s, v, 8, undefined, s.hx * 0.4);
      } else o += skArt(x, s, v, 11);
      o += skTrim(x, s, v.t);
      return o;
    },
  },
  {
    key: 'tiered', name: 'Ruffle Skirt', group: 'Ruffle Skirts', tags: ['spring', 'summer'],
    motifs: ['butterfly', 'daisy', 'strawberry', 'cupcake', 'tulip', 'heart', 'candy'], trims: ['none', 'lace', 'none', 'sparkle', 'none', 'lace', 'none'],
    body: (x, v) => {
      const L = skirtLen(x, x.b.legLen * 0.52);
      const tiers = [
        { l: L, fl: 28, c: x.c },
        { l: L * 0.7, fl: 17, c: light(x.c, 0.3) },
        { l: L * 0.4, fl: 9, c: x.c },
      ];
      let o = '';
      tiers.forEach((t, k) => {
        const s = sk(x, t.l, t.fl);
        if (k === 0 && v.t === 'lace') o += skLace(s);
        const d = skCustom(x, s, hemScallops(s, 9 - k, 2.4));
        if (k > 0) o += `<path d="${d}" fill="${dark(x.c, 0.3)}" opacity="0.3" transform="translate(0 2.5)"/>`;
        o += cloth(d, t.c, x.p);
        o += skStroke(s, 3, dark(t.c, 0.15), 1.2, 0.5);
        if (k === 0) {
          const y0 = x.b.hipY + L * 0.7 + 7;
          if (v.st === 'scatter') o += skPrint(x, s, v.m, y0, s.hy - 2, 5);
          else if (v.st === 'place') o += mot(v.m, -s.hx * 0.4, (y0 + s.hy) / 2, Math.min(8, (s.hy - y0) / 2 + 1), -8) + mot(v.m, s.hx * 0.45, (y0 + s.hy) / 2 + 1, Math.min(6, (s.hy - y0) / 2), 10);
          else o += pt(v.m, s.hx * 0.4, (y0 + s.hy) / 2, Math.min(7, (s.hy - y0) / 2 + 1));
        }
        if (k === 1 && v.st === 'scatter') o += skPrint(x, s, v.m, x.b.hipY + Math.max(14, L * 0.4 + 5), s.hy - 2, 4.5);
      });
      o += waistband(x.b, dark(x.c, 0.12));
      if (v.t === 'sparkle') o += skSparkles(x, sk(x, L, 28), x.b.hipY + 14, x.b.hipY + L - 4, 9);
      return o;
    },
  },
  {
    key: 'tutu', name: 'Tutu', group: 'Tutus', tags: ['spring'], premium: 10,
    motifs: ['star', 'heart', 'butterfly', 'unicorn', 'crown', 'moon', 'gem'], trims: ['sparkle', 'none', 'bow', 'sparkle', 'bow', 'none', 'sparkle'],
    body: (x, v) => {
      const b = x.b;
      const y0 = b.waistY - 2;
      const l = skirtLen(x, b.legLen * 0.4);
      const hy = b.hipY + l;
      let o = tulle(x, y0, hy, b.hiW + 24, 10, dark(x.c, 0.08), 1, true);
      o += tulle(x, y0, hy - 5, b.hiW + 19, 9, x.c, 0.92);
      o += tulle(x, y0, hy - 11, b.hiW + 13, 8, light(x.c, 0.3), 0.8);
      const s = sk(x, l - 10, 14);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.hipY + 14, hy - 10, 4.5);
      else if (v.st === 'place') o += mot(v.m, -b.hiW * 0.55, b.hipY + Math.max(16, l * 0.6), 7.5, -10);
      else o += mot(v.m, b.hiW * 0.55, b.hipY + Math.max(16, l * 0.6), 6, 8);
      if (v.t === 'sparkle') o += skSparkles(x, s, b.hipY + 12, hy - 8, 10);
      else o += skSparkles(x, s, b.hipY + 12, hy - 8, 4, '#ffffff');
      o += `<rect x="${f1(-sideX(b, y0) - 1)}" y="${f1(y0)}" width="${f1(sideX(b, y0) * 2 + 2)}" height="8" rx="4" fill="${dark(x.c, 0.15)}"/>`;
      if (v.t === 'bow') o += smallBow(-b.hiW * 0.6, b.hipY + 14, 0.4, A(x));
      return o;
    },
  },
  {
    key: 'bubble', name: 'Bubble Skirt', group: 'Bubble Skirts', tags: ['spring'],
    motifs: ['cloud', 'donut', 'icecream', 'candy', 'cupcake', 'planet', 'smiley'], trims: ['none', 'none', 'bow', 'sparkle', 'none', 'bow', 'none'],
    body: (x, v) => {
      const l = skirtLen(x, x.b.legLen * 0.56);
      const bs = bubbleShape(x, l, 16);
      let o = cloth(bs.d, x.c, x.p) + waistband(x.b, dark(x.c, 0.12));
      o += `<ellipse cx="${f1(-bs.mx * 0.55)}" cy="${f1(bs.my - 4)}" rx="7" ry="${f1(Math.max(4, l * 0.18))}" fill="#ffffff" opacity="0.22"/>`;
      o += P(D`M${-bs.hx + 2} ${bs.hy - 3} Q0 ${bs.hy + 7} ${bs.hx - 2} ${bs.hy - 3}`, 'none', stroke(dark(x.c, 0.18), 5));
      for (let k = -3; k <= 3; k++) {
        const xx = (k / 3.6) * bs.hx;
        o += P(D`M${xx} ${bs.hy - 2 + 5 * (1 - (xx / bs.hx) ** 2)} Q${xx * 1.08} ${bs.hy - 9} ${xx * 1.15} ${bs.hy - 14}`, 'none', stroke(dark(x.c, 0.2), 1.2, 0.5));
      }
      const s = sk(x, l, 12);
      const y0 = x.b.hipY + 14;
      if (v.st === 'scatter') o += skPrint(x, s, v.m, y0, bs.hy - 12, 5, bs.wAt);
      else if (v.st === 'place') o += mot(v.m, bs.mx * 0.4, Math.max(y0 + 4, bs.my + 2), Math.min(9, Math.max(6, (bs.hy - y0) / 3)), 8);
      else o += pt(v.m, -bs.mx * 0.42, Math.max(y0 + 4, bs.my + 2), 7);
      if (v.t === 'sparkle') o += skSparkles(x, s, y0, bs.hy - 10, 8, '#fff8c8', bs.wAt);
      if (v.t === 'bow') o += smallBow(-bs.mx * 0.5, x.b.hipY + 15, 0.4, A(x));
      return o;
    },
  },
  {
    key: 'maxi', name: 'Maxi Skirt', group: 'Maxi Skirts', tags: ['summer'], premium: 10,
    motifs: ['sunflower', 'daisy', 'butterfly', 'leaf', 'tulip', 'sun', 'moon'], trims: ['flowers', 'none', 'ruffle', 'flowers', 'none', 'lace', 'flowers'],
    body: (x, v) => {
      const b = x.b;
      const l = skirtLen(x, b.legLen + 4);
      const s = sk(x, l, 30);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.5);
      // tier seams with gathers
      for (const fr of [0.36, 0.68]) {
        const oo = l * (1 - fr);
        o += skStroke(s, oo, dark(x.c, 0.12), 1.6, 0.6);
        const xo = s.hx - oo * (s.flare * 0.5) / (l + 4) - 3;
        for (let k = -4; k <= 4; k++) {
          const xx = (k / 4.5) * xo;
          const yy = s.hy - oo + 6 * (1 - (xx / s.hx) ** 2);
          o += line(xx, yy + 1, xx + k * 0.3, yy + 5, dark(x.c, 0.2), 1, 0.3);
        }
      }
      o += skArt(x, s, v, 10);
      o += skTrim(x, s, v.t);
      o += waistband(x.b, dark(x.c, 0.12));
      // tie strings with pompoms on the hip
      const tx = b.hiW * 0.55;
      const pc = A(x);
      o += P(D`M${tx} ${b.hipY + 4} Q${tx - 3} ${b.hipY + 14} ${tx - 2} ${b.hipY + 24}`, 'none', stroke(pc, 1.5)) + P(D`M${tx} ${b.hipY + 4} Q${tx + 4} ${b.hipY + 12} ${tx + 5} ${b.hipY + 19}`, 'none', stroke(pc, 1.5)) +
        circ(tx - 2, b.hipY + 26, 3.4, pc) + circ(tx + 5, b.hipY + 21, 3.4, pc) + circ(tx - 3, b.hipY + 25, 1.1, '#ffffff', 'opacity="0.6"') + circ(tx + 4, b.hipY + 20, 1.1, '#ffffff', 'opacity="0.6"') +
        P(D`M${tx - 5} ${b.hipY + 4} C${tx - 11} ${b.hipY - 2} ${tx - 11} ${b.hipY + 8} ${tx - 1} ${b.hipY + 5}Z M${tx + 5} ${b.hipY + 4} C${tx + 11} ${b.hipY - 2} ${tx + 11} ${b.hipY + 8} ${tx + 1} ${b.hipY + 5}Z`, pc);
      return o;
    },
  },
  {
    key: 'mermaid', name: 'Mermaid Skirt', group: 'Mermaid Skirts', tags: ['summer'], premium: 20, colors: ['#5fd3c8', '#c99bff', '#7cc8ff', '#ffb3c7', '#a8e6cf', '#9b6bff', '#4f9dff'],
    motifs: ['fish', 'star', 'heart', 'gem', 'moon', 'rainbow', 'sun'], trims: ['sparkle', 'none', 'sparkle', 'none', 'sparkle', 'none', 'sparkle'],
    body: (x, v) => {
      const b = x.b;
      const l = skirtLen(x, b.legLen * 0.94);
      const m = mermaidShape(x, l, 26);
      let o = cloth(m.d, x.c, x.p) + cloth(m.fin, light(x.c, 0.22), 'none', 'y');
      for (let k = -3; k <= 3; k++) o += P(D`M${k * m.kw * 0.22} ${m.ky + 5} Q${k * m.hx * 0.3} ${(m.ky + m.hy) / 2} ${k * m.hx * 0.27} ${m.hy + 6}`, 'none', stroke(light(x.c, 0.55), 1.4, 0.6));
      // scales between the hip and the knee
      const y0 = b.hipY + 10;
      const rows = Math.max(1, Math.floor((m.ky - y0) / 9));
      const scales = v.st === 'pattern' ? '' : (() => {
        let sc = '';
        for (let r = 0; r < rows; r++) {
          const y = y0 + r * 9;
          const hw = Math.min(b.hiW, m.kw) - 7;
          for (let xx = -hw + (r % 2) * 5; xx <= hw - 4; xx += 10) sc += P(D`M${xx} ${y} q5 7 10 0`, 'none', stroke(light(x.c, 0.45), 1.4, 0.75));
        }
        return sc;
      })();
      o += scales;
      const s = sk(x, l, 4);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, m.ky + 6, m.hy - 4, 4.5, (y) => Math.min(m.kw, m.kw + (m.hx - m.kw) * ((y - m.ky) / (m.hy - m.ky))) - 2);
      else if (v.st === 'place') o += mot(v.m, -m.kw * 0.4, m.ky - 4, 6.5, -10);
      else o += pt(v.m, m.kw * 0.42, m.ky - 6, 6);
      if (v.t === 'sparkle') o += skSparkles(x, s, b.hipY + 12, m.ky, 7, '#ffffff', () => m.kw - 2) + skSparkles(x, s, m.ky + 6, m.hy - 4, 5, '#fff8c8', (y) => m.kw + (m.hx - m.kw) * ((y - m.ky) / (m.hy - m.ky)) - 4);
      o += waistband(b, dark(x.c, 0.15)) + P(D`M${-m.kw} ${m.ky} Q0 ${m.ky + 8} ${m.kw} ${m.ky}`, 'none', stroke(light(x.c, 0.5), 3));
      return o;
    },
  },
  {
    key: 'jeans', name: 'Jeans', group: 'Jeans', colors: DENIM,
    motifs: ['heart', 'star', 'butterfly', 'daisy', 'rainbow', 'smiley', 'bolt'], trims: ['heart', 'cuff', 'patch', 'cuff', 'flowers', 'heart', 'cuff'],
    body: (x) => pantsTop(x) + line(-x.b.waW + 8, x.b.waistY + 7, -x.b.waW + 15, x.b.hipY - 2, light(x.c, 0.3), 1.4) + line(x.b.waW - 8, x.b.waistY + 7, x.b.waW - 15, x.b.hipY - 2, light(x.c, 0.3), 1.4),
    leg: (x, side, v) => {
      const l = x.L + 4;
      const hw = legHalf(x, 3);
      const knee = l * 0.48;
      let s = cloth(legPath(x.b.legW, l, 3), x.c, x.p) + legShine(hw, l, side);
      s += `<line x1="${f1(side * (hw - 2.5))}" y1="2" x2="${f1(side * (hw - 2.5))}" y2="${f1(l - 2)}" stroke="#ffc061" stroke-width="1" stroke-dasharray="2.2 2" opacity="0.85"/>`;
      if (v.t === 'heart' && side === 1) {
        // a little rip mended with a heart patch
        s += `<ellipse cx="0" cy="${f1(knee)}" rx="${f1(hw * 0.55)}" ry="4.2" fill="${x.skin}"/>`;
        for (let k = -2; k <= 2; k++) s += line(k * hw * 0.2, knee - 4.5, k * hw * 0.2 + 0.5, knee + 4.5, '#ffffff', 1.1, 0.85);
      }
      if (v.t === 'patch') s += side === -1 ? pt(v.m, 0, knee, 7.5) : P(starD(0, knee, 6.5), '#ffd24a', 'stroke="#f0a81e" stroke-width="1"');
      else if (v.st === 'scatter') s += legPrint(v.m, 14, l - 12, 4.6, hw, side);
      else if (v.st === 'place') s += side === -1 ? mot(v.m, 0, knee, 7, -6) : '';
      else s += side === -1 ? pt(v.m, 0, knee, 7) : '';
      s += legTrim(x, v.t === 'patch' ? 'cuff' : v.t, side, x.L - 5, hw);
      return s;
    },
  },
  {
    key: 'leggings', name: 'Leggings', group: 'Leggings', tags: ['fall', 'winter'],
    motifs: ['star', 'heart', 'snowflake', 'unicorn', 'moon', 'leaf', 'cherry'], trims: ['none', 'ruffle', 'stripes', 'lace', 'sparkle', 'ruffle', 'none'],
    body: (x) => hipPiece(x.b, x.c, x.p) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="7" rx="3" fill="${dark(x.c, 0.1)}"/>`,
    leg: (x, side, v) => {
      const l = x.L + 2;
      const hw = legHalf(x, 1);
      let s = cloth(legPath(x.b.legW, l, 1), x.c, x.p) + legShine(hw, l, side);
      if (v.st === 'scatter') s += legPrint(v.m, 13, l - 10, 4.4, hw + 1, side);
      else if (v.st === 'place') s += mot(v.m, 0, l * 0.46, 6.5, side * -6);
      else s += side === -1 ? pt(v.m, 0, l * 0.46, 6) : '';
      s += `<rect x="${f1(-hw)}" y="${f1(x.L - 8)}" width="${f1(hw * 2)}" height="5" rx="2" fill="${dark(x.c, 0.1)}"/>`;
      s += legTrim(x, v.t, side, x.L - 5, hw);
      return s;
    },
  },
  {
    key: 'flares', name: 'Flares', group: 'Flares', tags: ['spring', 'fall'],
    motifs: ['daisy', 'rainbow', 'sunflower', 'butterfly', 'smiley', 'star', 'heart'], trims: ['none', 'rainbow', 'flowers', 'band', 'none', 'rainbow', 'flowers'],
    body: (x) => pantsTop(x),
    leg: (x, side, v) => {
      const l = x.L + 4;
      const hw = legHalf(x, 3);
      const fl = x.pose === 'sit' || x.pose === 'sleep' ? 4 : 9;
      let s = cloth(legPath(x.b.legW, l, 3, fl), x.c, x.p) + legShine(hw, l, side);
      s += line(0, 4, 0, l - 2, dark(x.c, 0.15), 1.2, 0.5);
      const bw = hw + fl;
      if (v.st === 'scatter') s += legPrint(v.m, 14, l - 14, 4.6, hw, side);
      else if (v.st === 'place') s += mot(v.m, side * bw * 0.3, l - 16, 7, side * 8);
      else s += side === -1 ? pt(v.m, -2, l * 0.45, 6.5) : '';
      const wy = (y: number) => hw + fl * ((y + 10) / (l + 10)) - 0.3;
      if (v.t === 'rainbow') s += PAINT.slice(0, 4).map((c, k) => { const y = x.L - 6 - k * 4; return `<rect x="${f1(-wy(y))}" y="${f1(y)}" width="${f1(wy(y) * 2)}" height="4.2" fill="${c}"/>`; }).join('');
      else if (v.t === 'band') s += `<rect x="${f1(-wy(x.L - 10))}" y="${f1(x.L - 10)}" width="${f1(wy(x.L - 10) * 2)}" height="7" rx="2" fill="${A(x)}"/>`;
      else s += legTrim(x, v.t, side, x.L - 5, hw);
      return s;
    },
  },
  {
    key: 'joggers', name: 'Joggers', group: 'Joggers', tags: ['fall'], colors: ['#9aa3b5', '#ffb3c7', '#c99bff', '#a8e6cf', '#9fd6ff', '#ffd36b', '#4a4a5e'],
    motifs: ['heart', 'star', 'bolt', 'paw', 'cloud', 'planet', 'smiley'], trims: ['stripes', 'none', 'stripes', 'none', 'stripes', 'sparkle', 'none'],
    body: (x) => pantsTop(x, false) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="8" rx="4" fill="${dark(x.c, 0.12)}"/>` + drawstring(x, '#ffffff'),
    leg: (x, side, v) => {
      const l = x.L - 1;
      const hw = legHalf(x, 4.5);
      let s = cloth(D`M${-hw} -10 L${hw} -10 Q${hw + 1} ${l * 0.6} ${hw - 2} ${l - 6} L${-hw + 2} ${l - 6} Q${-hw - 1} ${l * 0.6} ${-hw} -10Z`, x.c, x.p) + legShine(hw, l, side);
      s += `<rect x="${f1(-hw + 1)}" y="${f1(l - 9)}" width="${f1(hw * 2 - 2)}" height="10" rx="4" fill="${dark(x.c, 0.12)}"/>`;
      for (let k = -3; k <= 3; k++) s += line(k * hw * 0.24, l - 7.5, k * hw * 0.24, l - 0.5, dark(x.c, 0.25), 1, 0.6);
      if (v.st === 'scatter') s += legPrint(v.m, 14, l - 14, 4.6, hw - 1, side);
      else if (v.st === 'place') s += side === -1 ? mot(v.m, 0, l * 0.32, 6.5, -6) : '';
      else s += side === -1 ? pt(v.m, 0, l * 0.32, 6.5) : '';
      s += legTrim(x, v.t, side, l - 8, hw);
      return s;
    },
  },
  {
    key: 'cargo', name: 'Cargo Pants', group: 'Cargo Pants', tags: ['fall'], colors: ['#c9b48a', '#a8b98a', '#e6d4ff', '#ffb3c7', '#9fd6ff', '#f4ead9', '#b6e36b'],
    motifs: ['dino', 'paw', 'star', 'planet', 'leaf', 'bolt', 'fish'], trims: ['cuff', 'none', 'cuff', 'none', 'cuff', 'none', 'cuff'],
    body: (x) => pantsTop(x),
    leg: (x, side, v) => {
      const l = x.L + 4;
      const hw = legHalf(x, 4);
      let s = cloth(legPath(x.b.legW, l, 4), x.c, x.p) + legShine(hw, l, side);
      // big side pocket with a flap
      const py = Math.max(10, l * 0.36);
      const ph = Math.min(18, l * 0.26);
      const px = side * (hw - 8);
      s += `<rect x="${f1(px - 8)}" y="${f1(py)}" width="16" height="${f1(ph)}" rx="3" fill="${dark(x.c, 0.08)}"/>` + `<rect x="${f1(px - 8)}" y="${f1(py)}" width="16" height="${f1(ph)}" rx="3" fill="none" stroke="${dark(x.c, 0.3)}" stroke-width="0.8" stroke-dasharray="2 1.6"/>`;
      s += P(D`M${px - 9} ${py - 2} L${px + 9} ${py - 2} L${px + 9} ${py + 5} Q${px} ${py + 8} ${px - 9} ${py + 5}Z`, dark(x.c, 0.16)) + circ(px, py + 3.5, 1.8, '#ffd24a');
      if (v.st === 'place' && side === -1) s += mot(v.m, px, py + ph * 0.62, Math.min(5.5, ph * 0.3), -6);
      else if (v.st === 'pattern' && side === 1) s += pt(v.m, px, py + ph * 0.62, Math.min(5.5, ph * 0.32));
      else if (v.st === 'scatter') s += legPrint(v.m, py + ph + 6, l - 12, 4.4, hw - 2, side);
      s += line(-hw + 2, l * 0.7, hw - 2, l * 0.7, dark(x.c, 0.18), 1.2, 0.5);
      s += legTrim(x, v.t, side, x.L - 5, hw);
      return s;
    },
  },
  {
    key: 'pj', name: 'PJ Pants', group: 'PJ Pants', tags: ['winter'],
    motifs: ['moon', 'star', 'cloud', 'bear', 'bunny', 'panda', 'heart'], trims: ['band', 'none', 'lace', 'band', 'none', 'ruffle', 'band'],
    body: (x) => hipPiece(x.b, x.c, x.p) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="8" rx="4" fill="${light(x.c, 0.3)}"/>` + drawstring(x, light(x.c, 0.5)),
    leg: (x, side, v) => {
      const l = x.L + 2;
      const hw = legHalf(x, 4.5);
      let s = cloth(legPath(x.b.legW, l, 4.5, 2), x.c, x.p) + legShine(hw, l, side);
      if (v.st === 'scatter') s += legPrint(v.m, 13, l - 10, 5, hw, side);
      else if (v.st === 'place') s += mot(v.m, side * 3, l * 0.42, 6.5, side * 8) + P(starD(-side * 4, l * 0.7, 3), '#fff8c8');
      else s += side === 1 ? mot(v.m, 0, l * 0.5, 5.5, 6) : '';
      if (v.t === 'band') s += `<rect x="${f1(-hw - 3)}" y="${f1(x.L - 10)}" width="${f1(hw * 2 + 6)}" height="7" rx="3" fill="${light(x.c, 0.55)}"/>`;
      else s += legTrim(x, v.t, side, x.L - 5, hw + 2);
      return s;
    },
  },
  {
    key: 'cargoshorts', name: 'Cargo Shorts', group: 'Cargo Shorts', tags: ['summer'], colors: ['#c9b48a', '#a8b98a', '#7cc8ff', '#9aa3b5', '#e3cfa6', '#ffab5e', '#5fa86f'],
    motifs: ['dino', 'fish', 'planet', 'paw', 'bolt', 'sun', 'star'], trims: ['cuff', 'none', 'cuff', 'cuff', 'none', 'cuff', 'none'],
    body: (x) => pantsTop(x),
    leg: (x, side, v) => {
      const l = x.L * 0.52;
      const hw = legHalf(x, 4.5) + 1;
      let s = cloth(legPath(x.b.legW, l, 4.5, 1), x.c, x.p) + legShine(hw, l, side);
      const py = 12;
      const ph = Math.max(8, Math.min(14, l - py - 9));
      const px = side * (hw - 8);
      s += `<rect x="${f1(px - 7)}" y="${f1(py)}" width="14" height="${f1(ph)}" rx="3" fill="${dark(x.c, 0.08)}"/>` + P(D`M${px - 8} ${py - 2} L${px + 8} ${py - 2} L${px + 8} ${py + 4} Q${px} ${py + 7} ${px - 8} ${py + 4}Z`, dark(x.c, 0.16)) + circ(px, py + 2.6, 1.6, '#ffd24a');
      if (v.st === 'place' && side === -1) s += mot(v.m, px, py + ph * 0.62 + 1, Math.min(4.8, ph * 0.34), -6);
      else if (v.st === 'pattern' && side === 1) s += pt(v.m, -px * 0.2, l - 12, 4.5);
      else if (v.st === 'scatter') s += mot(v.m, -side * 4, l - 11, 4, side * 10);
      s += legTrim(x, v.t, side, l, hw);
      return s;
    },
  },
  {
    key: 'board', name: 'Board Shorts', group: 'Board Shorts', tags: ['summer'], colors: ['#4f9dff', '#5fd3b5', '#ffab5e', '#7cc8ff', '#ff7a6b', '#3f4f9a', '#b6e36b'],
    motifs: ['fish', 'sun', 'watermelon', 'star', 'lemon', 'planet', 'dino'], trims: ['stripes', 'none', 'band', 'stripes', 'none', 'band', 'stripes'],
    body: (x) => hipPiece(x.b, x.c, x.p) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="8" rx="4" fill="${A(x)}"/>` +
      [-2, 2].map((dx) => line(dx, x.b.waistY + 1, dx * 2.5, x.b.waistY + 12, '#ffffff', 1.6)).join('') + P(D`M-3 ${x.b.waistY + 2} L0 ${x.b.waistY + 6} L3 ${x.b.waistY + 2}`, 'none', stroke('#ffffff', 1.4)),
    leg: (x, side, v) => {
      const l = x.L * 0.58;
      const hw = legHalf(x, 5) + 2;
      const a = A(x);
      let s = cloth(legPath(x.b.legW, l, 5, 2), x.c, x.p) + legShine(hw, l, side);
      // a split side panel in the contrast color
      s += P(D`M${side * (hw - 7)} -10 L${side * (hw + 0.5)} -10 L${side * (hw + 2)} ${l} L${side * (hw - 5)} ${l}Z`, a, 'opacity="0.95"');
      s += P(D`M${-hw - 2} ${l - 9} Q${-hw * 0.3} ${l - 14} 0 ${l - 9} Q${hw * 0.3} ${l - 4} ${hw + 2} ${l - 9}`, 'none', stroke('#ffffff', 2.2, 0.85));
      s += legArt(v, side, 13, l - 14, hw - 5, 6);
      if (v.t === 'stripes') s += line(side * (hw - 9), -6, side * (hw - 7.5), l - 2, '#ffffff', 1.6, 0.9);
      else if (v.t === 'band') s += `<rect x="${f1(-hw - 2)}" y="${f1(l - 5)}" width="${f1(hw * 2 + 4)}" height="5" rx="2" fill="${dark(x.c, 0.15)}"/>`;
      return s;
    },
  },
  {
    key: 'sporty', name: 'Sporty Shorts', group: 'Sporty Shorts', tags: ['summer', 'spring'], colors: ['#3f4f9a', '#e85d5d', '#5fd3b5', '#9aa3b5', '#7a5cff', '#ffd36b', '#2d2a3a'],
    motifs: ['bolt', 'star', 'paw', 'crown', 'heart', 'planet', 'fish'], trims: ['stripes', 'stripes', 'band', 'stripes', 'stripes', 'band', 'stripes'],
    body: (x) => pantsTop(x, false) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="8" rx="4" fill="${dark(x.c, 0.15)}"/>` + drawstring(x, '#ffffff'),
    leg: (x, side, v) => {
      const l = x.L * 0.5;
      const hw = legHalf(x, 4.5) + 1.5;
      const a = A(x);
      // athletic cut with a split on the outside
      const o = side;
      let s = cloth(D`M${-o * hw} -10 L${o * hw} -10 L${o * (hw + 1.5)} ${l - 7} L${o * (hw - 3)} ${l} L${-o * (hw + 1.5)} ${l}Z`, x.c, x.p);
      s += legShine(hw, l, side);
      s += P(D`M${-o * (hw + 1)} ${l - 2} L${o * (hw - 3.5)} ${l - 2} L${o * (hw + 0.8)} ${l - 7.5}`, 'none', stroke('#ffffff', 2.2, 0.9));
      if (v.t === 'stripes') s += line(side * (hw - 2), -6, side * (hw - 1), l - 8, a, 2.4) + line(side * (hw - 5.5), -6, side * (hw - 4.5), l - 8, '#ffffff', 2.4);
      else if (v.t === 'band') s += P(D`M${side * (hw - 6)} -10 L${side * (hw + 0.5)} -10 L${side * (hw + 1.5)} ${l - 6} L${side * (hw - 5)} ${l - 6}Z`, a);
      if (v.st === 'place' && side === -1) s += mot(v.m, -2, l - 13, 5, -6);
      else if (v.st === 'pattern' && side === 1) s += pt(v.m, -2, l - 13, 5);
      else if (v.st === 'scatter') s += legPrint(v.m, 13, l - 6, 4, hw - 5, side);
      return s;
    },
  },
  {
    key: 'chinos', name: 'Chinos', group: 'Chinos', tags: ['spring', 'fall'], colors: ['#c9b48a', '#3f4f9a', '#a8b98a', '#e3cfa6', '#7cc8ff', '#c9785a', '#9aa3b5'],
    motifs: ['star', 'paw', 'leaf', 'heart', 'bolt', 'apple', 'moon'], trims: ['cuff', 'none', 'cuff', 'none', 'cuff', 'cuff', 'none'],
    body: (x) => pantsTop(x) + [-1, 1].map((sd) => `<rect x="${f1(sd * (x.b.waW - 8) - 1.5)}" y="${f1(x.b.waistY - 3)}" width="3" height="8" rx="1" fill="${dark(x.c, 0.2)}"/>`).join(''),
    leg: (x, side, v) => {
      const l = x.L + 4;
      const hw = legHalf(x, 3);
      let s = cloth(D`M${-hw} -10 L${hw} -10 L${hw - 1.5} ${l} L${-hw + 1.5} ${l}Z`, x.c, x.p) + legShine(hw, l, side);
      s += line(0, 2, 0, l - 2, dark(x.c, 0.18), 1.1, 0.6);
      if (v.st === 'place') s += side === -1 ? mot(v.m, 0, x.L - 18, 4.5, -6) : '';
      else if (v.st === 'scatter') s += legPrint(v.m, 16, x.L - 12, 3.4, hw, side);
      else s += side === 1 ? pt(v.m, 0, x.L * 0.45, 5.5) : '';
      if (v.t === 'cuff') s += `<rect x="${f1(-hw + 0.5)}" y="${f1(x.L - 12)}" width="${f1(hw * 2 - 1)}" height="7" rx="2.5" fill="${light(x.c, 0.12)}"/>` + line(-hw + 2, x.L - 8.5, hw - 2, x.L - 8.5, dark(x.c, 0.15), 1, 0.6);
      return s;
    },
  },
  {
    key: 'suit', name: 'Suit Pants', group: 'Suit Pants', tags: ['fall', 'winter'], premium: 15, colors: ['#3f4f9a', '#4a4a5e', '#9aa3b5', '#2d2a3a', '#8a3a5a', '#f4ead9', '#7cc8ff'],
    motifs: ['star', 'crown', 'note', 'gem', 'moon', 'bolt', 'heart'], trims: ['none', 'stripes', 'none', 'stripes', 'none', 'stripes', 'none'],
    body: (x) => pantsTop(x) + `<rect x="${f1(-sideX(x.b, x.b.waistY) - 1)}" y="${f1(x.b.waistY - 2)}" width="${f1(sideX(x.b, x.b.waistY) * 2 + 2)}" height="7" rx="3" fill="#4a3428"/>` +
      `<rect x="-6" y="${f1(x.b.waistY - 3)}" width="12" height="9" rx="2" fill="none" stroke="url(#g-gold)" stroke-width="2.4"/>`,
    leg: (x, side, v) => {
      const l = x.L + 4;
      const hw = legHalf(x, 3);
      let s = cloth(legPath(x.b.legW, l, 3), x.c, x.p) + legShine(hw, l, side);
      s += line(-side * 1, 0, -side * 1, l - 2, light(x.c, 0.25), 1.4, 0.8) + line(-side * 2.2, 0, -side * 2.2, l - 2, dark(x.c, 0.2), 1, 0.6);
      if (v.t === 'stripes') s += `<rect x="${f1(side > 0 ? hw - 4 : -hw + 1)}" y="-8" width="3" height="${f1(l)}" fill="${luma0(x.c) > 0.6 ? dark(x.c, 0.35) : '#1d1a28'}" opacity="0.85"/>` + `<rect x="${f1(side > 0 ? hw - 3.6 : -hw + 1.4)}" y="-8" width="0.8" height="${f1(l)}" fill="#ffffff" opacity="0.4"/>`;
      if (v.st === 'place') s += side === -1 ? mot(v.m, 2, x.L - 16, 3.8, -6) : '';
      else if (v.st === 'scatter') s += legPrint(v.m, 16, x.L - 12, 3, hw - 2, side);
      else s += side === 1 ? mot(v.m, 2, x.L - 16, 3.8, 6) : '';
      return s;
    },
  },
  {
    key: 'sweats', name: 'Sweatpants', group: 'Sweatpants', tags: ['fall', 'winter'], colors: ['#9aa3b5', '#3f4f9a', '#5fa86f', '#7cc8ff', '#ff7a6b', '#c99bff', '#4a4a5e'],
    motifs: ['dino', 'panda', 'bear', 'planet', 'paw', 'star', 'bolt'], trims: ['none', 'stripes', 'none', 'none', 'stripes', 'none', 'stripes'],
    body: (x) => pantsTop(x, false) + `<rect x="${f1(-sideX(x.b, x.b.waistY - 2) - 1)}" y="${f1(x.b.waistY - 3)}" width="${f1(sideX(x.b, x.b.waistY - 2) * 2 + 2)}" height="10" rx="4" fill="${dark(x.c, 0.1)}"/>` + drawstring(x, light(x.c, 0.6)),
    leg: (x, side, v) => {
      const l = x.L - 2;
      const hw = legHalf(x, 5.5);
      let s = cloth(D`M${-hw} -10 L${hw} -10 Q${hw + 1.5} ${l * 0.7} ${hw} ${l - 8} L${-hw} ${l - 8} Q${-hw - 1.5} ${l * 0.7} ${-hw} -10Z`, x.c, x.p) + legShine(hw, l, side);
      // puffy ribbed cuff
      s += P(D`M${-hw} ${l - 9} Q0 ${l - 13} ${hw} ${l - 9} L${hw - 2} ${l + 1} Q0 ${l + 3} ${-hw + 2} ${l + 1}Z`, dark(x.c, 0.1));
      for (let k = -3; k <= 3; k++) s += line(k * hw * 0.25, l - 9.5, k * hw * 0.22, l + 0.5, dark(x.c, 0.24), 1, 0.55);
      // knee bag and a side pocket seam
      s += P(D`M${-hw * 0.5} ${l * 0.5} Q0 ${l * 0.56} ${hw * 0.5} ${l * 0.5}`, 'none', stroke(dark(x.c, 0.15), 1.2, 0.45));
      if (v.t === 'stripes') s += line(side * (hw - 2.5), -6, side * (hw - 2.5), l - 10, '#ffffff', 2.4, 0.9);
      if (v.st === 'place') s += side === -1 ? mot(v.m, 0, l * 0.3, 7, -6) : '';
      else if (v.st === 'scatter') s += legPrint(v.m, 14, l - 14, 4.6, hw - 1, side);
      else s += side === 1 ? pt(v.m, 0, l * 0.3, 6.5) : '';
      return s;
    },
  },
];

function makeBottom(cut: Cut, i: number): WearDef {
  const mid = cut.motifs[i];
  const st = STYLES[i % STYLES.length];
  const color = pickColor(mid, i, cut.key, cut.colors, st === 'pattern');
  const pattern: Pattern = st === 'pattern' ? PATTERNS[(i + cut.key.length) % PATTERNS.length] : 'none';
  const trim = cut.trims[i % cut.trims.length];
  const v: V = { m: mid, t: trim, st, i };
  const tw = cut.key === 'suit' && trim === 'stripes' ? 'Tux' : TRIM_WORD[trim];
  const word = i % 2 === 1 && tw && tw !== mName(mid) ? tw : '';
  const name = st === 'pattern'
    ? itemName([PAT_NAME[pattern], cut.name], [PAT_NAME[pattern], cut.name])
    : itemName([mName(mid), word, cut.name], [mName(mid), cut.name]);
  return {
    id: `bot-${cut.key}-${mid}`,
    name,
    slot: 'bottom',
    group: cut.group,
    price: i < 3 ? 0 : 15 + (i - 3) * 7 + (cut.premium ?? 0),
    color,
    pattern,
    tags: seasonTags(cut.tags, mid),
    body: (x) => cut.body(x, v),
    leg: cut.leg ? (x, s) => cut.leg!(x, s, v) : undefined,
  };
}

export const BOTTOMS_MORE: WearDef[] = CUTS.flatMap((c) => c.motifs.map((_, i) => makeBottom(c, i)));
