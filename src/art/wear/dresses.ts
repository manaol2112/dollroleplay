// Dresses: 19 cuts (sundresses to ball gowns, overalls and nighties), each in six versions with its
// own print, color and trim, plus a closet of one-of-a-kind costume dresses.
import { legPath, sideX, torsoPath } from '../body';
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, buttons, chestY, circ, flowerG, fluff, hipPiece, line, sleeve, sparkleD, starD } from './base';
import {
  D, PATTERNS, PAT_NAME, type Sk, type Style, bubbleShape, f1, hemPetals, hemScallops, itemName, mName, mermaidShape, mot, pickColor, pop, pt, seasonTags,
  sk, skBandD, skCustom, skFolds, skHem, skLace, skPrint, skRuffle, skSparkles, skStroke, skW, smallBow, stroke, tulle,
} from './bottoms';
import { belt, lace, ruffle } from './trims';

// ---------- helpers ----------
/** Sewn-on sequins spread evenly over a box. */
function sequins(x0: number, y0: number, w: number, h: number, c = '#fff8c8', n = 14): string {
  let s = '';
  for (let i = 0; i < n; i++) s += circ(x0 + ((i * 0.618 + 0.13) % 1) * w, y0 + ((i + 0.5) / n) * h, 1.5 + (i % 3) * 0.3, c, 'opacity="0.9"');
  return s;
}
type Neck = 'crew' | 'v' | 'scoop' | 'square' | 'none';
interface BodiceOpts { neck?: Neck; straps?: boolean; hem?: number; flare?: number; c?: string; p?: string }
/** The dress top, following the torso down to the waist (or further for one-piece cuts). */
function bodice(x: WearCtx, o: BodiceOpts = {}): string {
  const b = x.b;
  const nk = o.neck ?? 'scoop';
  const c = o.c ?? x.c;
  const d = torsoPath(b, {
    hemY: o.hem ?? b.waistY + 6,
    flare: o.flare ?? 0,
    neckW: nk === 'none' ? 0 : nk === 'v' ? 14 : nk === 'scoop' ? 18 : nk === 'square' ? 17 : 13,
    neckDip: nk === 'v' ? 22 : nk === 'scoop' ? 14 : nk === 'square' ? 12 : 9,
    vneck: nk === 'v',
    topY: o.straps ? b.shY + 16 : undefined,
  });
  let s = cloth(d, c, o.p ?? x.p);
  if (o.straps) s += [-1, 1].map((sd) => P(D`M${sd * 16 - 3} ${b.shY - 1} L${sd * 16 + 3} ${b.shY - 1} L${sd * 18 + 3} ${b.shY + 18} L${sd * 18 - 3} ${b.shY + 18}Z`, dark(c, 0.06))).join('');
  return s;
}
const sash = (x: WearCtx, c: string, bowSide = 1, bowC = c.toLowerCase() === '#ffffff' ? '#ffd0e0' : c) => {
  const b = x.b;
  const w = sideX(b, b.waistY) + 1;
  return `<rect x="${f1(-w)}" y="${f1(b.waistY - 2)}" width="${f1(w * 2)}" height="9" rx="4" fill="${c}"/>` + `<rect x="${f1(-w)}" y="${f1(b.waistY - 1)}" width="${f1(w * 2)}" height="2" rx="1" fill="#ffffff" opacity="0.3"/>` +
    (bowSide ? smallBow(bowSide * (b.waW - 8), b.waistY + 2, 0.5, bowC) : smallBow(0, b.waistY + 2, 0.55, bowC));
};
const peterPan = (x: WearCtx, c = '#ffffff') => {
  const y = x.b.shY;
  const st = `stroke="${dark(c === '#ffffff' ? x.c : c, 0.2)}" stroke-width="1"`;
  return P(D`M-1 ${y + 1} Q-20 ${y - 2} -22 ${y + 8} Q-20 ${y + 20} -2 ${y + 14}Z`, c, st) + P(D`M1 ${y + 1} Q20 ${y - 2} 22 ${y + 8} Q20 ${y + 20} 2 ${y + 14}Z`, c, st);
};
const shirtCollar = (x: WearCtx, c: string) => {
  const y = x.b.shY;
  const st = `stroke="${dark(c, 0.2)}" stroke-width="1"`;
  return P(D`M-1 ${y + 2} L-19 ${y - 3} L-14 ${y + 15}Z`, c, st) + P(D`M1 ${y + 2} L19 ${y - 3} L14 ${y + 15}Z`, c, st);
};
/** Little motifs scattered over the bodice. */
function bodicePrint(x: WearCtx, id: string, r: number, y0?: number): string {
  const b = x.b;
  const top = y0 ?? b.shY + 18;
  const bot = b.waistY - 1;
  if (bot - top < r * 2) return '';
  const rows = Math.max(1, Math.round((bot - top) / (r * 3)));
  let s = '';
  for (let j = 0; j < rows; j++) {
    const y = top + ((j + 0.5) * (bot - top)) / rows;
    const hw = sideX(b, y) - r - 5;
    const n = Math.max(1, Math.round((hw * 2) / (r * 3.2)));
    for (let k = 0; k < n; k++) s += mot(id, -hw + ((hw * 2) * (k + 0.5 + (j % 2 ? 0.2 : -0.2))) / n, y, r, ((j + k) % 3) * 9 - 9);
  }
  return s;
}
/** Skirt length for a dress: a fraction of the leg, or 'floor'. Shortens when sitting. */
const dl = (x: WearCtx, len: number | 'floor') => {
  const full = len === 'floor' ? x.b.legLen + 6 : x.b.legLen * len;
  return { l: x.pose === 'sit' || x.pose === 'sleep' ? Math.min(full, x.L + 10) : full, full };
};
/** Flare shrinks a bit when a long skirt is shortened for sitting, so it does not turn into a disc. */
const dflare = (base: number, l: number, full: number) => base * Math.max(0.55, Math.min(1, l / full));

type Sl = 'none' | 'short' | 'cap' | 'puff' | 'bigpuff' | 'long' | 'flare' | 'flutter' | 'fur' | 'petal';
function sl(x: WearCtx, kind: Sl, c?: string, p?: string): string {
  const xx: WearCtx = c ? { ...x, c, p: (p ?? 'none') as Pattern } : x;
  const w = x.b.armW;
  const cc = xx.c;
  switch (kind) {
    case 'bigpuff': {
      const d = D`M${-w / 2 - 12} 9 C${-w / 2 - 17} -17 ${w / 2 + 17} -17 ${w / 2 + 12} 9 C${w / 2 + 12} 26 ${-w / 2 - 12} 26 ${-w / 2 - 12} 9Z`;
      return cloth(d, cc, xx.p) + [-5, 0, 5].map((dx) => P(D`M${dx} -8 Q${dx * 1.5} 6 ${dx} 20`, 'none', stroke(dark(cc, 0.15), 1.2, 0.5))).join('') +
        `<rect x="${f1(-w / 2 - 4)}" y="21" width="${f1(w + 8)}" height="5" rx="2.5" fill="${dark(cc, 0.12)}"/>`;
    }
    case 'flutter': {
      const r = w / 2 + 3;
      const len = x.b.armLen * 0.32;
      let d = D`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 L${r + 7} ${len}`;
      for (let i = 0; i < 4; i++) {
        const xa = r + 7 - ((r + 7) * 2 * i) / 4;
        const xb = r + 7 - ((r + 7) * 2 * (i + 1)) / 4;
        d += D` Q${(xa + xb) / 2} ${len + 7} ${xb} ${len}`;
      }
      return cloth(d + 'Z', cc, xx.p, 'y') + [-1, 1].map((sd) => line(sd * 4, len * 0.3, sd * 7, len + 2, dark(cc, 0.15), 1.1, 0.5)).join('');
    }
    case 'petal': {
      const len = x.b.armLen * 0.36;
      const r = w / 2 + 4;
      return cloth(D`M${-r} 2 Q${-r - 4} ${len * 0.7} ${-2} ${len} Q${r * 0.4} ${len * 0.5} ${r * 0.3} 0Z`, light(cc, 0.12), xx.p) + cloth(D`M${r} 2 Q${r + 4} ${len * 0.7} 2 ${len} Q${-r * 0.4} ${len * 0.5} ${-r * 0.3} 0Z`, cc, xx.p) +
        cloth(D`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 L${r} 6 L${-r} 6Z`, cc, xx.p);
    }
    case 'fur':
      return sleeve(xx, 'long', 3, cc) + fluff(-w / 2 - 1, x.b.armLen - 10, x.b.armLen - 10, 5) + fluff(w / 2 + 1, x.b.armLen - 10, x.b.armLen - 10, 5) + fluff(0, x.b.armLen - 11, x.b.armLen - 11, 5.5);
    default:
      return sleeve(xx, kind, 3);
  }
}

// ---------- the catalog ----------
type Trim = 'none' | 'ruffle' | 'lace' | 'band' | 'sash' | 'bow' | 'sparkle' | 'belt' | 'flowers' | 'stripes' | 'pocket';
interface V { m: string; t: Trim; st: Style; i: number }
interface Cut {
  key: string;
  name: string;
  group: string;
  tags?: Season[];
  premium?: number;
  free?: number;
  colors?: string[];
  /** Print the place-style variants come with. */
  placePattern?: Pattern;
  motifs: string[];
  trims: Trim[];
  sleeve: Sl | ((v: V) => Sl);
  sleeveColor?: (x: WearCtx) => string;
  body: (x: WearCtx, v: V) => string;
  back?: (x: WearCtx, v: V) => string;
  leg?: (x: WearCtx, side: 1 | -1, v: V) => string;
  hasLegs?: (v: V) => boolean;
  nameFor?: (v: V) => string;
}

const A = (x: WearCtx) => pop(x.c);
const STYLES: Style[] = ['place', 'scatter', 'place', 'pattern', 'scatter', 'pattern'];
const TRIM_WORD: Partial<Record<Trim, string>> = { ruffle: 'Ruffle', lace: 'Lace', sparkle: 'Sparkle', flowers: 'Flower' };

/** Hem trims shared by the A-line style cuts (lace is drawn under the skirt by each cut). */
function hemTrim(x: WearCtx, s: Sk, t: Trim): string {
  const a = A(x);
  switch (t) {
    case 'ruffle':
      return skRuffle(s, light(x.c, 0.22), 7, 10, x.p);
    case 'band':
      return P(skBandD(s, 0, 8), a) + P(skBandD(s, 0, 8), 'url(#g-shadeX)') + skStroke(s, 4, light(a, 0.45), 1, 0.7);
    case 'stripes':
      return skStroke(s, 6, a, 2.6) + skStroke(s, 11, a, 2.6);
    case 'sparkle':
      return skSparkles(x, s, x.b.waistY + 10, s.hy - 6, 10);
    case 'flowers': {
      let o = '';
      const n = Math.max(5, Math.round(s.hx / 9));
      for (let k = 0; k < n; k++) {
        const xx = -s.hx + 8 + ((s.hx * 2 - 16) * k) / Math.max(1, n - 1);
        o += flowerG(xx, skHem(s, xx) - 7, 4.2, k % 2 ? '#ffffff' : light(a, 0.3), '#ffd36b');
      }
      return o;
    }
    default:
      return '';
  }
}
const waistTrim = (x: WearCtx, t: Trim) => (t === 'sash' ? sash(x, A(x)) : t === 'belt' ? belt(-sideX(x.b, x.b.waistY) - 1, sideX(x.b, x.b.waistY) + 1, x.b.waistY - 2, A(x)) : t === 'bow' ? smallBow(0, x.b.shY + 18, 0.42, A(x)) : '');
/** Motif art on the skirt (and a little on the bodice) for the variant's style. */
function skirtArt(x: WearCtx, s: Sk, v: V, r = 11, o: { bodice?: boolean; y0?: number; wAt?: (y: number) => number; px?: number } = {}): string {
  const b = x.b;
  const y0 = o.y0 ?? b.waistY + 12;
  const y1 = s.hy - (o.wAt ? 6 : 10);
  if (v.st === 'scatter') return skPrint(x, s, v.m, y0, y1, Math.min(6.5, r * 0.6), o.wAt) + (o.bodice ? bodicePrint(x, v.m, 4.5) : '');
  const yy = Math.max(y0 + r * 0.5, s.hy - r - 12);
  if (v.st === 'place') return mot(v.m, o.px ?? -s.hx * 0.42, yy, Math.min(r, (s.hy - y0) / 2), -8);
  return pt(v.m, s.hx * 0.44, yy, Math.min(r * 0.75, 9));
}

const CUTS: Cut[] = [
  {
    key: 'sun', name: 'Sundress', group: 'Sundresses', tags: ['summer'], sleeve: 'none',
    motifs: ['lemon', 'strawberry', 'cherry', 'watermelon', 'sunflower', 'daisy'], trims: ['ruffle', 'sash', 'lace', 'band', 'ruffle', 'sash'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.6);
      const s = sk(x, l, 22, 4);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.7, b.waistY + 8);
      o += skirtArt(x, s, v, 11, { bodice: true });
      o += hemTrim(x, s, v.t);
      o += bodice(x, { straps: true });
      for (let k = 0; k < 3; k++) {
        const y = b.shY + 24 + k * ((b.waistY - b.shY - 26) / 3);
        const w = sideX(b, y) - 2;
        o += P(D`M${-w} ${y} q${w / 4} 3 ${w / 2} 0 t${w / 2} 0 t${w / 2} 0 t${w / 2} 0`, 'none', stroke(dark(x.c, 0.14), 1.1, 0.6));
      }
      if (v.st === 'place') o += mot(v.m, 0, b.shY + 30, 7, 0);
      o += smallBow(-17, b.shY, 0.22, light(x.c, 0.3)) + smallBow(17, b.shY, 0.22, light(x.c, 0.3));
      o += waistTrim(x, v.t);
      return o;
    },
  },
  {
    key: 'party', name: 'Party Dress', group: 'Party Dresses', premium: 15, sleeve: 'puff',
    colors: ['#ffb3c7', '#ffffff', '#9b6bff', '#e6d4ff', '#9fd6ff', '#ff7eb6'],
    motifs: ['star', 'heart', 'crown', 'gem', 'butterfly', 'ribbon'], trims: ['sparkle', 'bow', 'sash', 'sparkle', 'bow', 'sash'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.46);
      const y0 = b.waistY + 2;
      const hy = b.hipY + l;
      let o = tulle(x, y0, hy, b.hiW + 30, 10, dark(x.c, 0.08), 1, true) + tulle(x, y0, hy - 6, b.hiW + 24, 9, x.c, 0.92) + tulle(x, y0, hy - 13, b.hiW + 16, 8, light(x.c, 0.32), 0.82);
      const s = sk(x, l - 12, 16, 4);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.waistY + 14, hy - 12, 5);
      o += skSparkles(x, s, b.waistY + 12, hy - 10, v.t === 'sparkle' ? 10 : 5, v.t === 'sparkle' ? '#fff8c8' : '#ffffff');
      o += bodice(x, { neck: 'scoop' }) + sequins(-sideX(b, b.shY + 20) + 8, b.shY + 16, sideX(b, b.shY + 20) * 2 - 16, b.waistY - b.shY - 18, '#fff8c8', 16);
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 2, 9, 0);
      else if (v.st === 'pattern') o += pt(v.m, 0, chestY(b) + 2, 7);
      else o += bodicePrint(x, v.m, 4);
      o += v.t === 'bow' ? sash(x, light(x.c, 0.5), 0) : sash(x, A(x), v.t === 'sash' ? 1 : 0);
      return o;
    },
  },
  {
    key: 'princess', name: 'Princess Gown', group: 'Princess Gowns', premium: 90, free: 1, sleeve: 'bigpuff',
    motifs: ['crown', 'gem', 'heart', 'star', 'butterfly', 'ribbon'], trims: ['sparkle', 'flowers', 'bow', 'sparkle', 'flowers', 'bow'],
    body: (x, v) => {
      const b = x.b;
      const { l, full } = dl(x, 'floor');
      const fl = dflare(46, l, full);
      const s = sk(x, l, fl, 4);
      const under = light(x.c, 0.5);
      let o = cloth(s.d, under, x.p) + skFolds(x, s, 2, 0.6, b.waistY + 10);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.waistY + 14, s.hy - 8, 5.5, (y) => Math.max(8, (y - b.waistY) * 0.42));
      else o += skSparkles(x, s, b.waistY + 14, s.hy - 8, 8, '#ffffff', (y) => Math.max(6, (y - b.waistY) * 0.4));
      // overskirt opening in a soft V, with gathered swags at the hem
      for (const sd of [-1, 1] as const) {
        const ix = sd * s.hx * 0.5;
        const d = D`M${sd * 3} ${b.waistY + 2} L${sd * s.tx} ${s.ty} Q${sd * (b.hiW + fl * 0.5)} ${b.hipY - 4} ${sd * s.hx} ${s.hy} Q${sd * s.hx * 0.75} ${skHem(s, sd * s.hx * 0.75) + 4} ${ix} ${skHem(s, ix) - 6} Q${sd * s.hx * 0.2} ${b.hipY + l * 0.45} ${sd * 3} ${b.waistY + 2}Z`;
        o += cloth(d, x.c, x.p);
        o += P(D`M${ix} ${skHem(s, ix) - 6} Q${sd * s.hx * 0.2} ${b.hipY + l * 0.45} ${sd * 3} ${b.waistY + 4}`, 'none', 'stroke="url(#g-gold)" stroke-width="3" fill="none"');
        o += P(D`M${sd * s.hx} ${s.hy} Q${sd * s.hx * 0.75} ${skHem(s, sd * s.hx * 0.75) + 4} ${ix} ${skHem(s, ix) - 6}`, 'none', 'stroke="url(#g-gold)" stroke-width="3" fill="none"');
        for (const fr of [0.3, 0.6]) o += P(D`M${sd * 6} ${b.waistY + 8} Q${sd * s.hx * (fr + 0.1)} ${b.hipY + l * fr} ${sd * s.hx * (fr + 0.25)} ${b.hipY + l * (fr + 0.3)}`, 'none', stroke(dark(x.c, 0.15), 1.4, 0.5));
        if (v.t === 'flowers') for (const fr of [0.35, 0.7]) o += flowerG(sd * s.hx * (0.2 + fr * 0.32), b.hipY + l * fr * 0.95, 4.5, '#ffffff', '#ffd24a');
        if (v.t === 'bow') o += smallBow(ix, skHem(s, ix) - 8, 0.32, A(x));
      }
      o += P(D`M${-s.hx} ${s.hy} Q0 ${s.hy + 12} ${s.hx} ${s.hy}`, 'none', stroke(dark(under, 0.1), 3, 0.5));
      // pointed bodice with gold trim
      o += bodice(x, { neck: 'scoop' }) + cloth(D`M${-sideX(b, b.waistY) + 2} ${b.waistY + 4} L0 ${b.waistY + 16} L${sideX(b, b.waistY) - 2} ${b.waistY + 4}Z`, x.c, x.p);
      o += P(D`M${-sideX(b, b.waistY) + 1} ${b.waistY + 4} L0 ${b.waistY + 16} L${sideX(b, b.waistY) - 1} ${b.waistY + 4}`, 'none', 'stroke="url(#g-gold)" stroke-width="3" fill="none" stroke-linejoin="round"');
      o += P(D`M-18 ${b.shY + 1} Q0 ${b.shY + 16} 18 ${b.shY + 1}`, 'none', 'stroke="url(#g-gold)" stroke-width="2.5" fill="none"');
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 4, 8, 0);
      else if (v.st === 'pattern') o += pt(v.m, 0, chestY(b) + 4, 7);
      else o += P(starD(0, chestY(b) + 4, 6), 'url(#g-gold)');
      if (v.t === 'sparkle') o += skSparkles(x, s, b.hipY, s.hy - 10, 10);
      return o;
    },
  },
  {
    key: 'ball', name: 'Ball Gown', group: 'Ball Gowns', premium: 100, free: 1, tags: ['winter'], sleeve: 'flutter',
    colors: ['#c99bff', '#ffb3c7', '#9fd6ff', '#ffe680', '#e6d4ff', '#7cc8ff'],
    motifs: ['star', 'moon', 'heart', 'snowflake', 'gem', 'butterfly'], trims: ['sparkle', 'flowers', 'sparkle', 'none', 'sparkle', 'flowers'],
    body: (x, v) => {
      const b = x.b;
      const { l, full } = dl(x, 'floor');
      const k = Math.max(0.55, l / full);
      const y0 = b.waistY + 2;
      const hy = b.hipY + l;
      let o = tulle(x, y0, hy, b.hiW + 50 * k, 12, dark(x.c, 0.06), 1);
      o += tulle(x, y0, hy - l * 0.3, b.hiW + 38 * k, 10, x.c, 0.95);
      o += tulle(x, y0, hy - l * 0.58, b.hiW + 24 * k, 8, light(x.c, 0.28), 0.95);
      const s = sk(x, l, 40 * k, 4);
      const wAt = (y: number) => b.hiW + 20 * k + (y - b.hipY) * 0.3;
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.hipY + 4, hy - 8, 5.5, wAt);
      else if (v.st === 'place') o += mot(v.m, -b.hiW * 0.8, hy - l * 0.18, 9, -10) + mot(v.m, b.hiW * 0.9, hy - l * 0.45, 7, 10);
      else o += pt(v.m, b.hiW * 0.8, hy - l * 0.18, 7);
      o += skSparkles(x, s, b.hipY, hy - 8, v.t === 'sparkle' ? 14 : 6, v.t === 'sparkle' ? '#fff8c8' : '#ffffff', wAt);
      o += bodice(x, { straps: true });
      o += ruffle(-b.shW - 8, b.shW + 8, b.shY + 22, light(x.c, 0.3), 10, 9);
      o += sash(x, light(x.c, 0.45), 0);
      if (v.t === 'flowers') o += flowerG(-b.waW + 6, b.waistY + 2, 7, '#ffffff', A(x)) + flowerG(-b.waW + 16, b.waistY + 8, 4.5, light(A(x), 0.3), '#ffd24a');
      else o += flowerG(b.waW - 8, b.waistY + 2, 6.5, A(x), '#ffffff');
      return o;
    },
  },
  {
    key: 'tiered', name: 'Tiered Dress', group: 'Tiered Dresses', tags: ['spring'], sleeve: 'flutter',
    motifs: ['daisy', 'butterfly', 'tulip', 'strawberry', 'bunny', 'heart'], trims: ['none', 'lace', 'none', 'sash', 'lace', 'sparkle'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.64);
      let o = '';
      const tiers = [
        { l, fl: 30, c: x.c },
        { l: l * 0.66, fl: 18, c: light(x.c, 0.3) },
        { l: l * 0.32, fl: 9, c: x.c },
      ];
      tiers.forEach((t, k) => {
        const s = sk(x, t.l, t.fl, 4);
        if (k === 0 && v.t === 'lace') o += skLace(s);
        const d = skCustom(x, s, hemScallops(s, 10 - k, 2.4));
        if (k > 0) o += `<path d="${d}" fill="${dark(x.c, 0.3)}" opacity="0.28" transform="translate(0 2.5)"/>`;
        o += cloth(d, t.c, x.p) + skStroke(s, 3, dark(t.c, 0.15), 1.2, 0.5);
        const top = k === 2 ? b.waistY + 12 : b.hipY + tiers[k + 1].l + 6;
        if (v.st === 'scatter') o += skPrint(x, s, v.m, top, s.hy - 2, 5);
        else if (k === 0 && v.st === 'place') o += mot(v.m, -s.hx * 0.45, (top + s.hy) / 2, Math.min(8, (s.hy - top) / 2), -8) + mot(v.m, s.hx * 0.45, (top + s.hy) / 2, Math.min(8, (s.hy - top) / 2), 8);
        else if (k === 0 && v.st === 'pattern') o += pt(v.m, s.hx * 0.45, (top + s.hy) / 2, Math.min(7, (s.hy - top) / 2));
      });
      o += bodice(x, { neck: 'square' }) + lace(-17, 17, b.shY + 13);
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 4, 6.5);
      if (v.t === 'sparkle') o += skSparkles(x, sk(x, l, 30, 4), b.waistY + 10, b.hipY + l - 4, 10);
      o += waistTrim(x, v.t);
      return o;
    },
  },
  {
    key: 'shirt', name: 'Shirt Dress', group: 'Shirt Dresses', tags: ['spring', 'fall'], sleeve: 'short',
    motifs: ['bunny', 'kitty', 'apple', 'star', 'paw', 'dino'], trims: ['belt', 'sash', 'belt', 'none', 'belt', 'sash'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.62);
      const s = sk(x, l, 14, 4);
      let o = cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.6, b.waistY + 8);
      if (v.st !== 'place') o += skirtArt(x, s, v, 10, { bodice: true });
      else o += mot(v.m, s.hx * 0.45, s.hy - 16, 8, 8);
      o += bodice(x, { neck: 'crew' });
      o += line(0, b.shY + 8, 0, skHem(s, 0) - 1, dark(x.c, 0.18), 1.4, 0.7) + buttons(x, 6, b.shY + 14, s.hy - 6, '#ffffff', 4);
      // chest pocket with a friend peeking out
      const px = -15;
      const py = chestY(b) - 4;
      if (v.st === 'place') o += mot(v.m, px, py - 1, 6.5, -8);
      o += P(D`M${px - 8} ${py} L${px + 8} ${py} L${px + 8} ${py + 10} Q${px} ${py + 14} ${px - 8} ${py + 10}Z`, dark(x.c, 0.07), `stroke="${dark(x.c, 0.2)}" stroke-width="0.8"`);
      o += shirtCollar(x, v.i % 2 ? '#ffffff' : light(x.c, 0.3));
      o += waistTrim(x, v.t);
      return o;
    },
  },
  {
    key: 'pinafore', name: 'Pinafore', group: 'Pinafores', tags: ['fall'], sleeve: 'puff', sleeveColor: () => '#ffffff',
    colors: ['#e85d7a', '#7cc8ff', '#9b6bff', '#5fa86f', '#ffab5e', '#3f4f9a'],
    motifs: ['heart', 'bunny', 'strawberry', 'daisy', 'apple', 'bear'], trims: ['none', 'lace', 'none', 'bow', 'lace', 'none'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.58);
      const s = sk(x, l, 20, 4);
      let o = bodice(x, { neck: 'crew', c: '#ffffff', p: 'none' });
      o += (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.7, b.waistY + 8);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.waistY + 12, s.hy - 10, 5.5);
      // heart pocket on the skirt
      const hx = s.hx * 0.42;
      const hy = Math.max(b.hipY + 2, s.hy - 22);
      o += P(D`M${hx} ${hy + 3} C${hx - 7} ${hy - 6} ${hx - 15} ${hy + 2} ${hx} ${hy + 15} C${hx + 15} ${hy + 2} ${hx + 7} ${hy - 6} ${hx} ${hy + 3}Z`, dark(x.c, 0.1), `stroke="${light(x.c, 0.4)}" stroke-width="1" stroke-dasharray="2 1.6"`);
      if (v.st === 'pattern') o += mot(v.m, hx, hy + 6, 4.5);
      // bib with ruffled straps
      const top = b.shY + 20;
      o += cloth(D`M-17 ${top} L17 ${top} L${sideX(b, b.waistY) - 3} ${b.waistY + 4} L${-sideX(b, b.waistY) + 3} ${b.waistY + 4}Z`, x.c, x.p);
      for (const sd of [-1, 1] as const) {
        o += P(D`M${sd * 13} ${b.shY - 1} L${sd * 19} ${b.shY - 1} L${sd * 19} ${top + 2} L${sd * 13} ${top + 2}Z`, x.c);
        let rf = D`M${sd * 19} ${b.shY - 1}`;
        for (let k = 0; k < 4; k++) rf += D` Q${sd * 27} ${b.shY + k * 5.5 + 2.75} ${sd * 19} ${b.shY + (k + 1) * 5.5}`;
        o += P(rf + 'Z', light(x.c, 0.3)) + circ(sd * 16, top - 1, 2.6, '#ffffff', `stroke="${dark(x.c, 0.3)}" stroke-width="0.8"`);
      }
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 6, 7);
      else if (v.st === 'pattern') o += pt(v.m, 0, chestY(b) + 6, 6);
      o += peterPan(x);
      if (v.t === 'bow') o += smallBow(0, b.shY + 12, 0.32, A(x));
      return o;
    },
  },
  {
    key: 'sailor', name: 'Sailor Dress', group: 'Sailor Dresses', tags: ['summer'], sleeve: 'short',
    colors: ['#ffffff', '#3f4f9a', '#7cc8ff', '#ffb3c7', '#e6d4ff', '#a8e6cf'],
    motifs: ['star', 'fish', 'heart', 'cloud', 'sun', 'moon'], trims: ['stripes', 'none', 'stripes', 'stripes', 'none', 'stripes'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.56);
      const s = sk(x, l, 18, 4);
      const col = x.c.toLowerCase() === '#ffffff' || x.c.toLowerCase() > '#e' ? '#3f4f9a' : '#ffffff';
      const n = 9;
      let o = cloth(skCustom(x, s, hemScallops(s, n, 1.6)), x.c, x.p);
      for (let k = 0; k < n - 1; k++) {
        const xh = s.hx - ((s.hx * 2) * (k + 1)) / n;
        const xt = xh * 0.55;
        o += P(D`M${xt} ${b.waistY + 6} L${xh - 2.5} ${skHem(s, xh) + 0.5} L${xh + 2.5} ${skHem(s, xh) + 0.5}Z`, dark(x.c, 0.3), 'opacity="0.25"');
      }
      if (v.t === 'stripes') o += skStroke(s, 6, col, 2.6) + skStroke(s, 11, col, 2.6);
      o += skirtArt(x, s, v, 9);
      o += bodice(x, { neck: 'v' });
      const y = b.shY;
      o += P(D`M-24 ${y} L-14 ${y} L0 ${y + 24} L14 ${y} L24 ${y} L30 ${y + 22} L0 ${y + 36} L-30 ${y + 22}Z`, col) + P(D`M-26 ${y + 16} L0 ${y + 30} L26 ${y + 16}`, 'none', stroke(col === '#ffffff' ? '#3f4f9a' : '#ffffff', 2));
      o += smallBow(0, y + 33, 0.5, '#ff4f6d');
      if (v.st === 'place') o += mot(v.m, -16, b.waistY - 6, 5);
      return o;
    },
  },
  {
    key: 'picnic', name: 'Picnic Dress', group: 'Picnic Dresses', tags: ['spring', 'summer'], sleeve: 'puff', placePattern: 'check',
    motifs: ['cherry', 'strawberry', 'lemon', 'apple', 'watermelon', 'daisy'], trims: ['ruffle', 'lace', 'ruffle', 'none', 'ruffle', 'lace'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.6);
      const s = sk(x, l, 24, 4);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.6, b.waistY + 8);
      o += skirtArt(x, s, v, 9.5, { px: -s.hx * 0.42 });
      o += hemTrim(x, s, v.t);
      o += bodice(x, { neck: 'crew' });
      // smocked yoke
      for (let k = 0; k < 4; k++) {
        const y = b.shY + 22 + k * 5;
        const w = sideX(b, y) - 3;
        o += P(D`M${-w} ${y} q${w / 8} 3 ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0`, 'none', stroke(k % 2 ? '#ffffff' : dark(x.c, 0.2), 1.2, 0.8));
      }
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 10, 5.5);
      o += peterPan(x) + smallBow(0, b.shY + 12, 0.28, '#ff4f6d');
      return o;
    },
  },
  {
    key: 'overall', name: 'Overalls', group: 'Overalls', sleeve: 'short', sleeveColor: (x) => (x.c.toLowerCase() === '#ffffff' ? '#ffd9e8' : '#ffffff'),
    colors: ['#7aa6e8', '#f7a8c8', '#5d86d6', '#c9b3f0', '#9fdcc8', '#ffd36b'],
    motifs: ['daisy', 'cherry', 'dino', 'heart', 'star', 'paw'], trims: ['none', 'stripes', 'none', 'stripes', 'none', 'stripes'],
    hasLegs: (v) => v.i % 3 !== 0,
    nameFor: (v) => (v.i % 3 === 0 ? 'Overall Dress' : v.i % 3 === 1 ? 'Shortalls' : 'Overalls'),
    leg: (x, side, v) => {
      if (v.i % 3 === 0) return '';
      const l = v.i % 3 === 1 ? x.L * 0.46 : x.L + 4;
      const hw = x.b.legW / 2 + 3.5;
      let s = cloth(legPath(x.b.legW, l, 3.5), x.c, x.p);
      s += `<line x1="${f1(side * (hw - 2.5))}" y1="2" x2="${f1(side * (hw - 2.5))}" y2="${f1(l - 2)}" stroke="#ffc061" stroke-width="1" stroke-dasharray="2.2 2" opacity="0.85"/>`;
      const cy = v.i % 3 === 1 ? l : x.L - 5;
      s += `<rect x="${f1(-hw - 1)}" y="${f1(cy - 7)}" width="${f1(hw * 2 + 2)}" height="7" rx="3" fill="${light(x.c, 0.18)}"/>`;
      if (v.st === 'scatter') s += mot(v.m, side * 2, Math.min(l - 12, x.L * 0.4), 4.5, side * 8);
      else if (v.st === 'pattern' && side === 1 && v.i % 3 === 2) s += pt(v.m, 0, x.L * 0.48, 6.5);
      return s;
    },
    body: (x, v) => {
      const b = x.b;
      const tee = x.c.toLowerCase() === '#ffffff' ? '#ffd9e8' : '#ffffff';
      let o = cloth(torsoPath(b, { hemY: b.hipY + 2, neckW: 13, neckDip: 9 }), tee, 'none');
      if (v.t === 'stripes') for (let y = b.shY + 8; y < b.waistY + 6; y += 9) o += `<rect x="${f1(-sideX(b, y) + 0.5)}" y="${f1(y)}" width="${f1(sideX(b, y) * 2 - 1)}" height="4" fill="${A(x)}" opacity="0.8"/>`;
      if (v.i % 3 === 0) {
        const { l } = dl(x, 0.5);
        const s = sk(x, l, 12, 4);
        o += cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.6, b.waistY + 8) + line(0, b.waistY + 8, 0, skHem(s, 0) - 2, '#ffc061', 1, 0.8);
        if (v.st === 'scatter') o += skPrint(x, s, v.m, b.hipY - 4, s.hy - 8, 5);
        else if (v.st === 'pattern') o += pt(v.m, s.hx * 0.45, s.hy - 14, 6.5);
        o += skStroke(s, 4, light(x.c, 0.35), 1.2, 0.8);
      } else o += hipPiece(b, x.c, x.p);
      const top = chestY(b) - 10;
      o += cloth(D`M-18 ${top} L18 ${top} L${sideX(b, b.waistY) - 4} ${b.waistY + 6} L${-sideX(b, b.waistY) + 4} ${b.waistY + 6}Z`, x.c, x.p);
      o += `<rect x="${f1(-sideX(b, b.waistY) - 1)}" y="${f1(b.waistY + 2)}" width="${f1(sideX(b, b.waistY) * 2 + 2)}" height="7" rx="3" fill="${dark(x.c, 0.1)}"/>`;
      o += P(D`M-11 ${top + 6} L11 ${top + 6} L11 ${top + 17} Q0 ${top + 21} -11 ${top + 17}Z`, dark(x.c, 0.08), `stroke="#ffc061" stroke-width="0.9" stroke-dasharray="2 1.6"`);
      if (v.st === 'place') o += mot(v.m, 0, top + 9, 6.5);
      else if (v.st === 'pattern') o += pt(v.m, 0, top + 12, 5.5);
      o += line(-21, b.shY + 1, -16, top + 2, dark(x.c, 0.08), 6) + line(21, b.shY + 1, 16, top + 2, dark(x.c, 0.08), 6);
      o += circ(-16, top + 3, 3.4, '#ffd24a', 'stroke="#e0a11e" stroke-width="0.8"') + circ(16, top + 3, 3.4, '#ffd24a', 'stroke="#e0a11e" stroke-width="0.8"');
      return o;
    },
  },
  {
    key: 'puff', name: 'Puff Dress', group: 'Puff Dresses', sleeve: 'bigpuff',
    motifs: ['bunny', 'unicorn', 'kitty', 'cupcake', 'panda', 'rainbow'], trims: ['bow', 'none', 'lace', 'bow', 'ruffle', 'none'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.5);
      const s = sk(x, l, 20, 4);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.6, b.waistY + 8);
      if (v.st === 'place') o += mot(v.m, 0, Math.max(b.waistY + 20, s.hy - 18), Math.min(12, (s.hy - b.waistY) / 3), -6);
      else o += skirtArt(x, s, v, 10, { bodice: true });
      o += hemTrim(x, s, v.t);
      o += bodice(x, { neck: 'crew' }) + peterPan(x);
      o += `<rect x="${f1(-sideX(b, b.waistY) - 1)}" y="${f1(b.waistY + 1)}" width="${f1(sideX(b, b.waistY) * 2 + 2)}" height="5" rx="2.5" fill="${dark(x.c, 0.12)}"/>`;
      if (v.t === 'bow') o += smallBow(0, b.shY + 13, 0.4, A(x));
      return o;
    },
  },
  {
    key: 'wrap', name: 'Wrap Dress', group: 'Wrap Dresses', tags: ['spring'], sleeve: 'flutter',
    motifs: ['tulip', 'daisy', 'leaf', 'butterfly', 'sunflower', 'heart'], trims: ['none', 'none', 'lace', 'none', 'none', 'ruffle'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.78);
      const s = sk(x, l, 20, 4);
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(s.d, x.c, x.p);
      // the wrapped front edge sweeping across the skirt
      const ex = s.hx * 0.5;
      o += P(D`M${-sideX(b, b.waistY) + 4} ${b.waistY + 6} Q${-6} ${b.hipY + l * 0.45} ${ex} ${skHem(s, ex)} L${ex + 8} ${skHem(s, ex + 8)} Q0 ${b.hipY + l * 0.42} ${-sideX(b, b.waistY) + 10} ${b.waistY + 6}Z`, dark(x.c, 0.25), 'opacity="0.3"');
      o += P(D`M${-sideX(b, b.waistY) + 4} ${b.waistY + 6} Q${-6} ${b.hipY + l * 0.45} ${ex} ${skHem(s, ex)}`, 'none', stroke(light(x.c, 0.3), 1.5, 0.9));
      o += skFolds(x, s, 1, 0.5, b.waistY + 10);
      o += skirtArt(x, s, v, 10, { bodice: true, px: -s.hx * 0.45 });
      o += hemTrim(x, s, v.t);
      o += bodice(x, { neck: 'v' });
      o += P(D`M-14 ${b.shY} L${sideX(b, b.waistY) - 2} ${b.waistY + 2}`, 'none', stroke(dark(x.c, 0.22), 1.6, 0.8));
      o += `<rect x="${f1(-sideX(b, b.waistY) - 1)}" y="${f1(b.waistY)}" width="${f1(sideX(b, b.waistY) * 2 + 2)}" height="6" rx="3" fill="${dark(x.c, 0.1)}"/>`;
      // tie at the side with long tails
      const tx = -sideX(b, b.waistY) + 6;
      o += P(D`M${tx} ${b.waistY + 5} Q${tx - 6} ${b.waistY + 20} ${tx - 3} ${b.waistY + 34} L${tx + 2} ${b.waistY + 33} Q${tx - 1} ${b.waistY + 20} ${tx + 4} ${b.waistY + 6}Z`, dark(x.c, 0.1));
      o += P(D`M${tx + 2} ${b.waistY + 5} Q${tx + 4} ${b.waistY + 18} ${tx + 10} ${b.waistY + 28} L${tx + 14} ${b.waistY + 26} Q${tx + 7} ${b.waistY + 16} ${tx + 5} ${b.waistY + 5}Z`, dark(x.c, 0.06));
      o += smallBow(tx + 2, b.waistY + 3, 0.34, dark(x.c, 0.06));
      return o;
    },
  },
  {
    key: 'boho', name: 'Maxi Dress', group: 'Maxi Dresses', tags: ['summer'], premium: 20, sleeve: 'flare',
    motifs: ['sunflower', 'butterfly', 'daisy', 'sun', 'leaf', 'moon'], trims: ['flowers', 'none', 'flowers', 'ruffle', 'none', 'flowers'],
    body: (x, v) => {
      const b = x.b;
      const { l, full } = dl(x, 'floor');
      const s = sk(x, l, dflare(34, l, full), 4);
      let o = cloth(s.d, x.c, x.p) + skFolds(x, s, 2, 0.5, b.waistY + 8);
      for (const fr of [0.38, 0.7]) {
        const oo = l * (1 - fr);
        o += skStroke(s, oo, dark(x.c, 0.12), 1.6, 0.6);
      }
      o += skirtArt(x, s, v, 11, { bodice: true });
      o += hemTrim(x, s, v.t);
      o += bodice(x, { neck: 'v' });
      // empire band with embroidery dots
      const ey = chestY(b) + 6;
      const ew = sideX(b, ey) + 1;
      o += `<rect x="${f1(-ew)}" y="${f1(ey)}" width="${f1(ew * 2)}" height="7" rx="3" fill="${A(x)}"/>`;
      for (let k = -3; k <= 3; k++) o += circ(k * ew * 0.27, ey + 3.5, 1.4, '#ffffff', 'opacity="0.9"');
      o += line(-3, b.shY + 18, -6, ey + 18, '#ffffff', 1.4) + line(3, b.shY + 18, 6, ey + 16, '#ffffff', 1.4) + circ(-6, ey + 19, 2.4, A(x)) + circ(6, ey + 17, 2.4, A(x));
      return o;
    },
  },
  {
    key: 'mermaid', name: 'Mermaid Gown', group: 'Mermaid Gowns', tags: ['summer'], premium: 80, free: 1, sleeve: 'none',
    colors: ['#5fd3c8', '#c99bff', '#7cc8ff', '#ffb3c7', '#a8e6cf', '#4f9dff'],
    motifs: ['fish', 'star', 'heart', 'gem', 'moon', 'sun'], trims: ['sparkle', 'none', 'sparkle', 'sparkle', 'none', 'sparkle'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 'floor');
      const m = mermaidShape(x, l, 30);
      let o = cloth(m.d, x.c, x.p) + cloth(m.fin, light(x.c, 0.22), 'none', 'y');
      for (let k = -3; k <= 3; k++) o += P(D`M${k * m.kw * 0.22} ${m.ky + 5} Q${k * m.hx * 0.3} ${(m.ky + m.hy) / 2} ${k * m.hx * 0.27} ${m.hy + 6}`, 'none', stroke(light(x.c, 0.55), 1.4, 0.6));
      const hw = m.kw - 7;
      if (v.st !== 'pattern') for (let r = 0, y = b.waistY + 12; y < m.ky - 4; r++, y += 9) for (let xx = -hw + (r % 2) * 5; xx <= hw - 4; xx += 10) o += P(D`M${xx} ${y} q5 7 10 0`, 'none', stroke(light(x.c, 0.45), 1.4, 0.75));
      const s = sk(x, l, 4, 4);
      const finW = (y: number) => m.kw + (m.hx - m.kw) * ((y - m.ky) / (m.hy - m.ky)) - 2;
      if (v.st === 'scatter') o += skPrint(x, s, v.m, m.ky + 6, m.hy - 4, 4.5, finW);
      else if (v.st === 'place') o += mot(v.m, -m.kw * 0.45, m.ky - 8, 7, -10);
      else o += pt(v.m, m.kw * 0.42, m.ky - 8, 6.5);
      if (v.t === 'sparkle') o += skSparkles(x, s, b.waistY + 10, m.ky, 8, '#ffffff', () => m.kw - 3) + skSparkles(x, s, m.ky + 6, m.hy - 4, 6, '#fff8c8', finW);
      o += P(D`M${-m.kw} ${m.ky} Q0 ${m.ky + 8} ${m.kw} ${m.ky}`, 'none', stroke(light(x.c, 0.5), 3));
      // shell bodice
      o += bodice(x, { straps: true });
      const ty = b.shY + 16;
      for (const sd of [-1, 1] as const) {
        const cx = sd * 13;
        o += P(D`M${cx - 12} ${ty + 12} Q${cx - 13} ${ty - 6} ${cx} ${ty - 7} Q${cx + 13} ${ty - 6} ${cx + 12} ${ty + 12}Z`, light(x.c, 0.35));
        for (let k = -2; k <= 2; k++) o += line(cx, ty + 12, cx + k * 5, ty - 4 + Math.abs(k) * 1.5, dark(x.c, 0.15), 1, 0.6);
      }
      for (let k = -4; k <= 4; k++) o += circ(k * (sideX(b, b.waistY) / 4.6), b.waistY + 3, 2.3, '#fffaf5', `stroke="${dark('#fffaf5', 0.15)}" stroke-width="0.5"`);
      return o;
    },
  },
  {
    key: 'fairy', name: 'Fairy Dress', group: 'Fairy Dresses', tags: ['spring'], premium: 25, sleeve: 'petal',
    colors: ['#a8e6cf', '#ffb3c7', '#c99bff', '#9fd6ff', '#fff3b0', '#e6d4ff'],
    motifs: ['butterfly', 'daisy', 'star', 'tulip', 'moon', 'heart'], trims: ['sparkle', 'sparkle', 'flowers', 'sparkle', 'none', 'sparkle'],
    back: (x) => {
      const b = x.b;
      const y = b.shY + 26;
      let s = '';
      for (const sd of [-1, 1] as const) {
        s += `<ellipse cx="${f1(sd * 42)}" cy="${f1(y - 22)}" rx="30" ry="20" transform="rotate(${sd * -28} ${f1(sd * 42)} ${f1(y - 22)})" fill="${light(x.c, 0.55)}" opacity="0.75" stroke="#ffffff" stroke-width="2"/>`;
        s += `<ellipse cx="${f1(sd * 36)}" cy="${f1(y + 14)}" rx="20" ry="13" transform="rotate(${sd * 30} ${f1(sd * 36)} ${f1(y + 14)})" fill="${light(x.c, 0.45)}" opacity="0.75" stroke="#ffffff" stroke-width="2"/>`;
        s += P(sparkleD(sd * 48, y - 26, 4), '#ffffff') + P(sparkleD(sd * 38, y + 14, 3), '#ffffff');
      }
      return s;
    },
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.54);
      const s1 = sk(x, l, 28, 4);
      const s2 = sk(x, l * 0.78, 20, 4);
      let o = cloth(skCustom(x, s1, hemPetals(s1, 7, 12)), dark(x.c, 0.05), x.p) + cloth(skCustom(x, s2, hemPetals(s2, 6, 12)), light(x.c, 0.3), x.p);
      for (let k = -2; k <= 2; k++) o += line(k * 7, b.waistY + 10, k * s2.hx * 0.32, s2.hy + 4, dark(x.c, 0.2), 1.1, 0.4);
      const wAt = (y: number) => skW(x, s2, y) - 2;
      if (v.st === 'scatter') o += skPrint(x, s2, v.m, b.waistY + 12, s2.hy - 2, 5, wAt);
      else if (v.st === 'place') o += mot(v.m, -s2.hx * 0.4, s2.hy - 10, 8, -10);
      else o += pt(v.m, s2.hx * 0.4, s2.hy - 10, 6.5);
      o += skSparkles(x, s1, b.waistY + 10, s1.hy, v.t === 'sparkle' ? 12 : 5);
      o += bodice(x, { neck: 'v' });
      // leafy waistband
      const w = sideX(b, b.waistY);
      for (let k = 0; k < 7; k++) {
        const xx = -w + (w * 2 * (k + 0.5)) / 7;
        o += P(D`M${xx - 4} ${b.waistY + 2} Q${xx} ${b.waistY + 12} ${xx + 4} ${b.waistY + 2} Q${xx} ${b.waistY - 2} ${xx - 4} ${b.waistY + 2}Z`, k % 2 ? '#6fc47c' : '#8fd88f');
      }
      o += flowerG(w - 6, b.waistY + 2, 5, v.t === 'flowers' ? '#ffffff' : A(x), '#ffd24a');
      if (v.t === 'flowers') o += flowerG(-w + 8, b.waistY + 4, 4, A(x), '#ffd24a') + flowerG(0, b.shY + 20, 4, '#ffffff', '#ffd24a');
      return o;
    },
  },
  {
    key: 'holiday', name: 'Holiday Dress', group: 'Holiday Dresses', tags: ['winter'], premium: 15, sleeve: 'fur',
    colors: ['#c2325a', '#3f8f6a', '#3f4f9a', '#9b6bff', '#e0457b', '#8a3a5a'],
    motifs: ['snowflake', 'star', 'candy', 'heart', 'bear', 'ribbon'], trims: ['bow', 'sparkle', 'bow', 'none', 'sparkle', 'bow'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.6);
      const s = sk(x, l, 22, 4);
      let o = cloth(s.d, x.c, x.p) + `<path d="${s.d}" fill="url(#g-shine)" opacity="0.6"/>` + skFolds(x, s, 2, 0.7, b.waistY + 8);
      o += skirtArt(x, s, v, 10, { y0: b.waistY + 12, px: -s.hx * 0.42 });
      // fluffy fur hem
      const n = Math.max(8, Math.round(s.hx / 4.6));
      for (let k = 0; k <= n; k++) {
        const xx = -s.hx + (s.hx * 2 * k) / n;
        o += circ(xx, skHem(s, xx) - 1, 5.2, '#fffaf5');
      }
      o += skStroke(s, 4, '#ffffff', 5, 0.9);
      if (v.t === 'sparkle') o += skSparkles(x, s, b.waistY + 10, s.hy - 10, 10);
      o += bodice(x, { neck: 'crew' }) + `<path d="${torsoPath(b, { hemY: b.waistY + 6, neckW: 13, neckDip: 9 })}" fill="url(#g-shine)" opacity="0.5"/>`;
      o += P(D`M-13 ${b.shY} Q0 ${b.shY + 12} 13 ${b.shY}`, 'none', stroke('#fffaf5', 7));
      o += buttons(x, 3, b.shY + 20, b.waistY - 4, '#ffd24a');
      if (v.t === 'bow') o += sash(x, v.i % 2 ? '#ffffff' : '#ffd24a', 0);
      else o += `<rect x="${f1(-sideX(b, b.waistY) - 1)}" y="${f1(b.waistY)}" width="${f1(sideX(b, b.waistY) * 2 + 2)}" height="6" rx="3" fill="${dark(x.c, 0.2)}"/>`;
      if (v.st === 'scatter') o += bodicePrint(x, v.m, 4, b.shY + 24);
      return o;
    },
  },
  {
    key: 'nightie', name: 'Nightgown', group: 'Nightgowns', tags: ['winter'], sleeve: (v) => (v.i % 2 ? 'long' : 'puff'),
    colors: ['#e6d4ff', '#ffb3c7', '#9fd6ff', '#fff3d6', '#a8e6cf', '#c99bff'],
    motifs: ['moon', 'star', 'cloud', 'bunny', 'bear', 'heart'], trims: ['ruffle', 'lace', 'ruffle', 'lace', 'ruffle', 'lace'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.86);
      const hem = b.hipY + l;
      const d = torsoPath(b, { hemY: hem, flare: 26, neckW: 15, neckDip: 11, hemCurve: 12 });
      const hx = sideX(b, hem, 26);
      const s: Sk = { ty: b.waistY, tx: b.waW, hy: hem, hx, l, flare: hx - b.hiW, d };
      let o = (v.t === 'lace' ? skLace(s) : '') + cloth(d, x.c, x.p);
      for (let k = -2; k <= 2; k++) if (k) o += P(D`M${k * 6} ${chestY(b) + 12} Q${k * 12} ${(chestY(b) + hem) / 2} ${k * hx * 0.36} ${hem + 4}`, 'none', stroke('#3a1d3f', 1.3, 0.14));
      const wAt = (y: number) => sideX(b, y, 26) - 2;
      if (v.st === 'scatter') o += skPrint(x, s, v.m, chestY(b) + 14, hem - 8, 5.5, wAt);
      else if (v.st === 'place') o += mot(v.m, -hx * 0.4, hem - 18, 9, -8) + P(starD(hx * 0.35, hem - 26, 3.5), '#fff8c8') + P(starD(hx * 0.1, hem - 14, 2.5), '#fff8c8');
      else o += pt(v.m, hx * 0.4, hem - 16, 7);
      if (v.t === 'ruffle') o += skRuffle(s, light(x.c, 0.3), 7, 10, x.p);
      // lace yoke and a ribbon
      const yy = b.shY + 18;
      o += lace(-sideX(b, yy) + 1, sideX(b, yy) - 1, yy + 3) + smallBow(0, b.shY + 10, 0.3, A(x));
      return o;
    },
  },
  {
    key: 'sweater', name: 'Sweater Dress', group: 'Sweater Dresses', tags: ['fall', 'winter'], sleeve: 'long',
    colors: ['#f4ead9', '#ffab5e', '#c99bff', '#ffb3c7', '#9aa3b5', '#a8b98a'],
    motifs: ['heart', 'snowflake', 'leaf', 'bear', 'apple', 'star'], trims: ['band', 'none', 'band', 'band', 'none', 'band'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.48);
      const hem = b.hipY + l;
      const turtle = v.i % 2 === 1;
      const d = torsoPath(b, { hemY: hem, flare: 8, neckW: turtle ? 0 : 13, neckDip: 9 });
      let o = cloth(d, x.c, x.p);
      // cable knit
      for (const cx of [-0.55, 0.55]) {
        for (let y = b.shY + 22; y < hem - 12; y += 10) {
          const xx = cx * sideX(b, y);
          o += P(D`M${xx - 4} ${y} Q${xx} ${y + 5} ${xx + 4} ${y + 10} M${xx + 4} ${y} Q${xx} ${y + 5} ${xx - 4} ${y + 10}`, 'none', stroke(light(x.c, 0.35), 1.8, 0.8));
        }
      }
      const hx = sideX(b, hem, 8);
      o += `<rect x="${f1(-hx - 0.5)}" y="${f1(hem - 9)}" width="${f1(hx * 2 + 1)}" height="11" rx="4" fill="${v.t === 'band' ? A(x) : dark(x.c, 0.1)}"/>`;
      for (let k = -6; k <= 6; k++) o += line((k / 6.5) * hx, hem - 8, (k / 6.5) * hx, hem + 1, dark(v.t === 'band' ? A(x) : x.c, 0.2), 1, 0.5);
      if (v.st === 'place') o += mot(v.m, 0, chestY(b) + 4, 12, 0);
      else if (v.st === 'pattern') o += pt(v.m, 0, chestY(b) + 4, 9);
      else o += bodicePrint(x, v.m, 5, b.shY + 18) + skPrint(x, sk(x, l, 8), v.m, b.waistY + 8, hem - 12, 5, (y) => sideX(b, y, 8) - 3);
      if (turtle) o += `<rect x="-15" y="${f1(b.shY - 12)}" width="30" height="18" rx="6" fill="${dark(x.c, 0.08)}"/>` + [-8, 0, 8].map((dx) => line(dx, b.shY - 9, dx, b.shY + 3, dark(x.c, 0.2), 1.5)).join('');
      return o;
    },
  },
  {
    key: 'tennis', name: 'Tennis Dress', group: 'Tennis Dresses', tags: ['summer', 'spring'], sleeve: 'cap',
    colors: ['#ffffff', '#a8e6cf', '#ffb3c7', '#9fd6ff', '#fff3b0', '#e6d4ff'],
    motifs: ['star', 'heart', 'bolt', 'cherry', 'lemon', 'paw'], trims: ['stripes', 'stripes', 'stripes', 'stripes', 'stripes', 'stripes'],
    body: (x, v) => {
      const b = x.b;
      const { l } = dl(x, 0.46);
      const s = sk(x, l, 20, 4);
      const n = 10;
      const a = A(x);
      let o = cloth(skCustom(x, s, hemScallops(s, n, 1.4)), x.c, x.p);
      for (let k = 0; k < n - 1; k++) {
        const xh = s.hx - ((s.hx * 2) * (k + 1)) / n;
        o += P(D`M${xh * 0.5} ${b.waistY + 8} L${xh - 2.2} ${skHem(s, xh) + 0.5} L${xh + 2.2} ${skHem(s, xh) + 0.5}Z`, dark(x.c, 0.3), 'opacity="0.2"');
      }
      o += skStroke(s, 5, a, 2.4) + skStroke(s, 9.5, a, 2.4);
      if (v.st === 'scatter') o += skPrint(x, s, v.m, b.waistY + 12, s.hy - 14, 4.5);
      else if (v.st === 'pattern') o += pt(v.m, s.hx * 0.44, s.hy - 20, 6);
      o += bodice(x, { neck: 'v' });
      for (const sd of [-1, 1]) o += P(D`M${sd * (sideX(b, b.shY + 18) - 1)} ${b.shY + 18} L${sd * (sideX(b, b.shY + 18) - 6)} ${b.shY + 18} L${sd * (sideX(b, b.waistY) - 5)} ${b.waistY + 6} L${sd * (sideX(b, b.waistY) + 0.5)} ${b.waistY + 6}Z`, a, 'opacity="0.9"');
      o += shirtCollar(x, '#ffffff') + buttons(x, 2, b.shY + 27, b.shY + 37, '#ffffff');
      if (v.st === 'place') o += mot(v.m, -16, chestY(b) - 2, 6);
      return o;
    },
  },
];

// ---------- costumes ----------
interface Costume { key: string; name: string; color: string; price: number; tags?: Season[]; sleeve: Sl; sleeveColor?: string; body: (x: WearCtx) => string; back?: (x: WearCtx) => string }
const leafCollar = (x: WearCtx, c = '#5fae6b', n = 7) => {
  const b = x.b;
  let s = '';
  for (let k = 0; k < n; k++) {
    const a = Math.PI * (0.12 + (0.76 * k) / (n - 1));
    const cx = -Math.cos(a) * 18;
    const cy = b.shY + 4 + Math.sin(a) * 6;
    const tx = -Math.cos(a) * 32;
    const ty = b.shY + 8 + Math.sin(a) * 20;
    s += P(D`M${cx - 8} ${cy} Q${(cx + tx) / 2 - 8} ${(cy + ty) / 2} ${tx} ${ty} Q${(cx + tx) / 2 + 8} ${(cy + ty) / 2} ${cx + 8} ${cy}Z`, k % 2 ? c : light(c, 0.15)) + line(cx, cy + 1, (cx + tx) / 2, (cy + ty) / 2, dark(c, 0.2), 1, 0.6);
  }
  return s;
};
const wings = (x: WearCtx, c: string, op = 0.7) => {
  const y = x.b.shY + 24;
  let s = '';
  for (const sd of [-1, 1] as const) {
    s += `<ellipse cx="${f1(sd * 40)}" cy="${f1(y - 16)}" rx="26" ry="17" transform="rotate(${sd * -24} ${f1(sd * 40)} ${f1(y - 16)})" fill="${c}" opacity="${op}" stroke="#ffffff" stroke-width="2"/>`;
    s += `<ellipse cx="${f1(sd * 34)}" cy="${f1(y + 12)}" rx="17" ry="11" transform="rotate(${sd * 26} ${f1(sd * 34)} ${f1(y + 12)})" fill="${c}" opacity="${op}" stroke="#ffffff" stroke-width="2"/>`;
  }
  return s;
};
const COSTUMES: Costume[] = [
  {
    key: 'pumpkin', name: 'Pumpkin Dress', color: '#ff9a3d', price: 0, tags: ['fall'], sleeve: 'petal', sleeveColor: '#6fc47c',
    body: (x) => {
      const b = x.b;
      const { l } = dl(x, 0.5);
      const bs = bubbleShape(x, l, 24);
      let o = cloth(bs.d, '#ff9a3d', 'none');
      for (let k = -2; k <= 2; k++) o += P(D`M${k * 6} ${b.waistY + 6} Q${k * bs.mx * 0.42} ${bs.my} ${k * bs.hx * 0.34} ${bs.hy + 4}`, 'none', stroke('#e86f1f', 2.4, 0.7));
      o += `<ellipse cx="${f1(-bs.mx * 0.5)}" cy="${f1(bs.my - 4)}" rx="8" ry="${f1(Math.max(4, l * 0.18))}" fill="#ffffff" opacity="0.25"/>`;
      o += bodice(x, { neck: 'crew', c: '#ff9a3d', p: 'none' }) + leafCollar(x);
      o += P(D`M0 ${b.shY - 2} q4 -8 10 -6 q4 2 1 6`, 'none', stroke('#5f8f3a', 2.2));
      o += mot('pumpkin', 0, chestY(b) + 4, 9);
      return o;
    },
  },
  {
    key: 'snowflake', name: 'Snowflake Princess', color: '#bfe4ff', price: 0, tags: ['winter'], sleeve: 'flare', sleeveColor: '#e3f4ff',
    back: (x) => {
      const b = x.b;
      const { l } = dl(x, 'floor');
      const hy = b.hipY + l;
      return cloth(D`M${-b.shW + 4} ${b.shY + 4} Q${-b.shW - 40} ${hy - 30} ${-b.hiW - 52} ${hy + 4} Q0 ${hy + 20} ${b.hiW + 52} ${hy + 4} Q${b.shW + 40} ${hy - 30} ${b.shW - 4} ${b.shY + 4}Z`, '#d9f0ff', 'none', 'y').replace('fill="#d9f0ff"', 'fill="#d9f0ff" opacity="0.8"') +
        [-1, 1].map((sd) => mot('snowflake', sd * (b.hiW + 30), hy - 30, 7)).join('');
    },
    body: (x) => {
      const b = x.b;
      const { l, full } = dl(x, 'floor');
      const s = sk(x, l, dflare(42, l, full), 4);
      let o = cloth(s.d, '#bfe4ff', 'none') + skFolds(x, s, 2, 0.6, b.waistY + 8);
      o += skPrint(x, s, 'snowflake', b.waistY + 16, s.hy - 10, 6.5) + skSparkles(x, s, b.waistY + 10, s.hy - 6, 10, '#ffffff');
      o += P(D`M${-s.hx} ${s.hy} Q0 ${s.hy + 12} ${s.hx} ${s.hy}`, 'none', stroke('#ffffff', 5));
      o += bodice(x, { neck: 'scoop', c: '#a6d8ff', p: 'none' }) + sequins(-20, b.shY + 16, 40, b.waistY - b.shY - 18, '#ffffff', 18);
      o += mot('snowflake', 0, chestY(b) + 4, 8) + sash(x, '#ffffff', 0, '#9fd6ff');
      return o;
    },
  },
  {
    key: 'bee', name: 'Bumblebee Dress', color: '#ffd84a', price: 40, tags: ['spring'], sleeve: 'puff', sleeveColor: '#ffd84a',
    back: (x) => wings(x, '#e8f6ff', 0.8),
    body: (x) => {
      const b = x.b;
      const { l } = dl(x, 0.52);
      const bs = bubbleShape(x, l, 20);
      let o = cloth(bs.d, '#ffd84a', 'none');
      o += stripesInside(x, bs);
      o += `<ellipse cx="${f1(-bs.mx * 0.5)}" cy="${f1(bs.my - 4)}" rx="7" ry="${f1(Math.max(4, l * 0.16))}" fill="#ffffff" opacity="0.25"/>`;
      o += bodice(x, { neck: 'crew', c: '#ffd84a', p: 'none' });
      o += `<rect x="${f1(-sideX(b, chestY(b) + 6) + 0.5)}" y="${f1(chestY(b) + 2)}" width="${f1(sideX(b, chestY(b) + 6) * 2 - 1)}" height="8" fill="#3a3346"/>`;
      o += peterPan(x, '#ffffff') + mot('heart', 0, b.shY + 22, 5);
      return o;
    },
  },
  {
    key: 'ladybug', name: 'Ladybug Dress', color: '#e8384f', price: 50, tags: ['spring'], sleeve: 'cap', sleeveColor: '#2d2a3a',
    body: (x) => {
      const b = x.b;
      const { l } = dl(x, 0.56);
      const s = sk(x, l, 22, 4);
      let o = cloth(s.d, '#e8384f', 'none') + line(0, b.waistY + 6, 0, skHem(s, 0) - 1, '#2d2a3a', 2.4);
      const spots: [number, number, number][] = [[-0.55, 0.3, 6], [0.5, 0.25, 5], [-0.3, 0.65, 5.5], [0.62, 0.7, 6.5], [-0.75, 0.85, 4.5], [0.25, 0.9, 4.5]];
      for (const [fx, fy, r] of spots) {
        const y = b.waistY + 10 + (s.hy - b.waistY - 18) * fy;
        o += circ(fx * (skW(x, s, y) - r - 3), y, r, '#2d2a3a');
      }
      o += P(D`M${-s.hx} ${s.hy} Q0 ${s.hy + 12} ${s.hx} ${s.hy}`, 'none', stroke(dark('#e8384f', 0.2), 2.5, 0.6));
      o += bodice(x, { neck: 'crew', c: '#2d2a3a', p: 'none' }) + peterPan(x, '#ffffff');
      o += circ(-14, chestY(b) + 6, 4, '#e8384f') + circ(14, chestY(b) + 6, 4, '#e8384f') + circ(-15, chestY(b) + 5, 1.2, '#ffffff', 'opacity="0.6"');
      return o;
    },
  },
  {
    key: 'strawberry', name: 'Strawberry Dress', color: '#ff4f6d', price: 60, tags: ['summer'], sleeve: 'petal', sleeveColor: '#5fae6b',
    body: (x) => {
      const b = x.b;
      const { l } = dl(x, 0.54);
      const bs = bubbleShape(x, l, 22);
      let o = cloth(bs.d, '#ff4f6d', 'none');
      for (let j = 0, y = b.waistY + 14; y < bs.hy - 6; j++, y += 9) {
        const w = bs.wAt(y) - 6;
        for (let xx = -w + (j % 2) * 5; xx <= w; xx += 11) o += `<ellipse cx="${f1(xx)}" cy="${f1(y)}" rx="1.6" ry="2.4" fill="#ffe680"/>`;
      }
      o += `<ellipse cx="${f1(-bs.mx * 0.5)}" cy="${f1(bs.my - 4)}" rx="7" ry="${f1(Math.max(4, l * 0.16))}" fill="#ffffff" opacity="0.25"/>`;
      o += bodice(x, { neck: 'crew', c: '#ff4f6d', p: 'none' }) + leafCollar(x, '#5fae6b', 8);
      o += P(D`M0 ${b.shY - 1} q-2 -7 3 -9`, 'none', stroke('#5f8f3a', 2.4));
      o += smallBow(0, b.waistY + 2, 0.42, '#ffe3ee');
      return o;
    },
  },
  {
    key: 'cupcake', name: 'Cupcake Dress', color: '#ffb3c7', price: 70, sleeve: 'puff', sleeveColor: '#fff3f8',
    body: (x) => {
      const b = x.b;
      const { l } = dl(x, 0.5);
      const s = sk(x, l, 24, 4);
      let o = cloth(s.d, '#7cc8ff', 'none');
      for (let k = -5; k <= 5; k++) o += line(k * s.tx * 0.17, b.waistY + 8, k * s.hx * 0.17, skHem(s, k * s.hx * 0.17) - 1, '#4fa8ea', 3, 0.7);
      o += P(D`M${-s.hx} ${s.hy} Q0 ${s.hy + 12} ${s.hx} ${s.hy}`, 'none', stroke('#ffffff', 2.5, 0.7));
      // frosting bodice with a drippy edge and sprinkles
      o += bodice(x, { neck: 'scoop', c: '#fff3f8', p: 'none' });
      const w = sideX(b, b.waistY) + 4;
      let d = D`M${-w} ${b.waistY - 8} L${w} ${b.waistY - 8}`;
      for (let k = 0; k < 6; k++) {
        const xa = w - (w * 2 * k) / 6;
        const xb = w - (w * 2 * (k + 1)) / 6;
        d += D` Q${(xa + xb) / 2} ${b.waistY + 16 + (k % 2) * 5} ${xb} ${b.waistY + 4}`;
      }
      o += cloth(d + 'Z', '#ffb3c7', 'none', 'y');
      const cols = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#6fdca0', '#c99bff'];
      for (let k = 0; k < 14; k++) {
        const xx = -w + 6 + ((k * 0.618) % 1) * (w * 2 - 12);
        const yy = b.shY + 16 + ((k + 0.5) / 14) * (b.waistY - b.shY - 14);
        o += `<rect x="${f1(xx)}" y="${f1(yy)}" width="4" height="1.6" rx="0.8" fill="${cols[k % cols.length]}" transform="rotate(${(k * 47) % 180} ${f1(xx + 2)} ${f1(yy)})"/>`;
      }
      o += circ(0, b.shY + 10, 6, '#e8384f') + circ(-2, b.shY + 8, 1.8, '#ffffff', 'opacity="0.6"') + P(D`M0 ${b.shY + 4} q2 -6 6 -8`, 'none', stroke('#5f8f3a', 1.6));
      return o;
    },
  },
];
/** Black stripes that follow the bumblebee's round skirt. */
function stripesInside(x: WearCtx, bs: ReturnType<typeof bubbleShape>): string {
  let o = '';
  for (const fr of [0.3, 0.6, 0.86]) {
    const y = x.b.waistY + (bs.hy - x.b.waistY) * fr;
    const w = bs.wAt(y + 4) - 0.5;
    const w0 = bs.wAt(y - 4) - 0.5;
    o += P(D`M${-w0} ${y - 4} Q0 ${y} ${w0} ${y - 4} L${w} ${y + 4} Q0 ${y + 8} ${-w} ${y + 4}Z`, '#3a3346');
  }
  return o;
}

function costume(c: Costume): WearDef {
  return {
    id: `dress-costume-${c.key}`,
    name: c.name,
    slot: 'dress',
    group: 'Costumes',
    price: c.price,
    color: c.color,
    fixed: true,
    tags: c.tags,
    body: c.body,
    back: c.back,
    arm: (x) => sl(x, c.sleeve, c.sleeveColor),
  };
}

function makeDress(cut: Cut, i: number): WearDef {
  const mid = cut.motifs[i];
  const st = STYLES[i % STYLES.length];
  const color = pickColor(mid, i, cut.key, cut.colors, st === 'pattern' || (st === 'place' && !!cut.placePattern));
  const pattern: Pattern = st === 'pattern' ? PATTERNS[(i + cut.key.length) % PATTERNS.length] : st === 'place' && cut.placePattern ? cut.placePattern : 'none';
  const trim = cut.trims[i % cut.trims.length];
  const v: V = { m: mid, t: trim, st, i };
  const cname = cut.nameFor ? cut.nameFor(v) : cut.name;
  const word = i % 2 === 1 && TRIM_WORD[trim] && TRIM_WORD[trim] !== mName(mid) ? TRIM_WORD[trim]! : '';
  const name = st === 'pattern' ? itemName([PAT_NAME[pattern], cname], [PAT_NAME[pattern], cname]) : itemName([mName(mid), word, cname], [mName(mid), cname]);
  const free = cut.free ?? 3;
  const sleeveKind = (v2: V) => (typeof cut.sleeve === 'function' ? cut.sleeve(v2) : cut.sleeve);
  const legs = cut.leg && (!cut.hasLegs || cut.hasLegs(v));
  return {
    id: `dress-${cut.key}-${mid}`,
    name,
    slot: 'dress',
    group: cut.group,
    price: i < free ? 0 : Math.min(200, 20 + (i - free) * 12 + (cut.premium ?? 0)),
    color,
    pattern,
    tags: seasonTags(cut.tags, mid),
    body: (x) => cut.body(x, v),
    back: cut.back ? (x) => cut.back!(x, v) : undefined,
    leg: legs ? (x, s) => cut.leg!(x, s, v) : undefined,
    arm: (x) => sl(x, sleeveKind(v), cut.sleeveColor?.(x)),
  };
}

export const DRESSES_MORE: WearDef[] = [...CUTS.flatMap((c) => c.motifs.map((_, i) => makeDress(c, i))), ...COSTUMES.map(costume)];
