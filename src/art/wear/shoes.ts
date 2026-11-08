// Shoes: 25 styles (sneakers, light-ups, mary janes, sandals, boots, skates, slippers...), each in a
// handful of versions with its own color, print and trim. Each foot is drawn inside its leg group:
// the hip is at (0, 0), the ankle at y = L and the sole rests near L + 14.
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { MOTIF_BY_ID, accentFor, colorName, motif } from '../motifs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, bowG, circ, f, flowerG, heartD, line, shoeBlob, sparkleD, starD } from './base';

type Trim = 'none' | 'glitter' | 'bow' | 'pompom' | 'fur' | 'heart' | 'star' | 'flower' | 'gem' | 'pearl';

interface Var { c: string; m?: string; p?: Pattern; t?: Trim; c2?: string; n?: string; kind?: string }

/** What a style's drawing gets: the accent, the variant, the foot centre and the ankle line. */
interface K { a: string; v: Var; cx: number; L: number; s: 1 | -1; hw: number }

interface Style {
  key: string;
  name: string;
  group: string;
  tags?: Season[];
  premium?: number;
  free?: number;
  foot: (x: WearCtx, k: K) => string;
  leg?: (x: WearCtx, k: K) => string;
  vars: Var[];
}

const seated = (x: WearCtx) => x.pose === 'sit' || x.pose === 'sleep';
/** Height of a boot shaft, shortened while the legs are folded. */
const tall = (x: WearCtx, h: number) => (seated(x) ? h * 0.55 : h);
const stroke = (c: string, w = 1.6, op = 1) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"`;
const rr = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const sole = (cx: number, y0: number, y1: number, w: number, c: string) => rr(cx - w, y0, w * 2, y1 - y0, Math.min(3, (y1 - y0) / 2), c) + rr(cx - w, y1 - 1.6, w * 2, 1.6, 0.8, dark(c, 0.18));
/** A glossy highlight on the toe. */
const gloss = (cx: number, y: number, w = 6, op = 0.6) =>
  `<ellipse cx="${f(cx - w * 0.9)}" cy="${f(y)}" rx="${f(w)}" ry="${f((w * 0.38))}" fill="#ffffff" opacity="${op}" transform="rotate(-14 ${f(cx - w * 0.9)} ${f(y)})"/>` + circ(cx + w * 0.5, y - 1, w * 0.22, '#ffffff', `opacity="${op}"`);
const laces = (cx: number, y0: number, y1: number, w: number, c = '#ffffff') => {
  let s = '';
  for (let y = y0; y < y1 - 1; y += 4.2) s += line(cx - w, y, cx + w, y + 3, c, 1.7) + line(cx + w, y, cx - w, y + 3, c, 1.7);
  return s;
};
/** A boot shaft up the leg from `top` to the ankle. */
const shaft = (x: WearCtx, top: number, e = 4, flare = 1, c = x.c, p: string = x.p) => {
  const hw = x.b.legW / 2 + e;
  const L = x.L;
  return cloth(`M${f(-hw)} ${f(top + 3)} Q${f(-hw)} ${f(top)} ${f(-hw + 3)} ${f(top)} L${f(hw - 3)} ${f(top)} Q${f(hw)} ${f(top)} ${f(hw)} ${f(top + 3)} L${f(hw + flare)} ${f(L + 3)} L${f(-hw - flare)} ${f(L + 3)}Z`, c, p);
};
const fluffRow = (x0: number, x1: number, y: number, r: number, c: string) => {
  let s = '';
  const n = Math.max(2, Math.round((x1 - x0) / (r * 1.2)));
  for (let i = 0; i <= n; i++) s += circ(x0 + ((x1 - x0) * i) / n, y + (i % 2 ? 1 : -1), r, c);
  return s;
};
const pom = (x: number, y: number, r: number, c: string) => circ(x, y, r, c) + circ(x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff', 'opacity="0.5"');
const twinkle = (x: number, y: number, r: number, delay: number) =>
  `<path d="${sparkleD(x, y, r)}" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></path>`;
const glitter = (cx: number, y0: number, y1: number, w: number, c: string, n = 16) => {
  let s = '';
  const cols = ['#ffffff', light(c, 0.5), dark(c, 0.15)];
  for (let i = 0; i < n; i++) s += circ(cx - w + ((i * 0.618) % 1) * w * 2, y0 + ((i * 0.7548 + 0.1) % 1) * (y1 - y0), 0.9 + (i % 3) * 0.35, cols[i % 3], 'opacity="0.9"');
  return s;
};

/** Small decorations every style can wear on the toe. */
function trimArt(t: Trim | undefined, cx: number, y: number, a: string, s: 1 | -1): string {
  switch (t) {
    case 'bow':
      return `<g transform="translate(${f(cx)} ${f(y)}) scale(0.3)">${bowG(0, 0, 1, a)}</g>`;
    case 'heart':
      return P(heartD(cx, y - 4, 7), '#ff5c8a', 'stroke="#ffffff" stroke-width="0.8"');
    case 'star':
      return P(starD(cx, y, 4.2), 'url(#g-gold)', 'stroke="#d99a1e" stroke-width="0.6"');
    case 'flower':
      return flowerG(cx, y, 5, '#ffffff');
    case 'gem':
      return P(`M${f(cx - 4)} ${f(y - 1.5)} L${f(cx - 2)} ${f(y - 4)} L${f(cx + 2)} ${f(y - 4)} L${f(cx + 4)} ${f(y - 1.5)} L${f(cx)} ${f(y + 4)}Z`, '#9fe3ff', 'stroke="#ffffff" stroke-width="0.8"');
    case 'pearl':
      return circ(cx, y, 2.8, '#fffaf0', 'stroke="#e8dcc8" stroke-width="0.6"') + circ(cx - 0.9, y - 0.9, 0.9, '#ffffff');
    case 'pompom':
      return pom(cx, y, 4.2, a);
    case 'glitter':
      return twinkle(cx + s * 6, y - 2, 3.4, 0) + twinkle(cx - s * 7, y + 3, 2.8, 0.9);
    default:
      return '';
  }
}

// ---------- shared shoe bodies ----------
const sneakerFoot = (x: WearCtx, k: K, top = -6) => {
  const { cx, L } = k;
  const toe = k.v.c2 ?? '#ffffff';
  let s = rr(cx - 6, L + top - 4, 12, 10, 4, light(x.c, 0.18));
  s += cloth(shoeBlob(cx, L + top, L + 12, 17), x.c, x.p, 'y');
  s += P(`M${f(cx - 16)} ${f(L + 7)} Q${f(cx)} ${f(L + 1)} ${f(cx + 16)} ${f(L + 7)} L${f(cx + 16.5)} ${f(L + 10)} L${f(cx - 16.5)} ${f(L + 10)}Z`, toe);
  s += laces(cx, L + top + 1, L + 3, 5.5);
  s += sole(cx, L + 9, L + 14.5, 17.5, '#ffffff') + line(cx - 15, L + 11.6, cx + 15, L + 11.6, k.a, 1.4, 0.8);
  return s + gloss(cx - 3, L + top + 5, 4.5, 0.45);
};
const maryFoot = (x: WearCtx, k: K) => {
  const { cx, L } = k;
  let s = cloth(shoeBlob(cx, L - 2, L + 14, 16), x.c, x.p, 'y');
  s += P(`M${f(cx - 10)} ${f(L - 1)} Q${f(cx)} ${f(L + 4)} ${f(cx + 10)} ${f(L - 1)}`, 'none', stroke(dark(x.c, 0.25), 2));
  s += rr(cx - 15, L - 5, 30, 5, 2.5, dark(x.c, 0.12)) + rr(cx + k.s * 8 - 3, L - 6, 6, 7, 1.5, 'none', 'stroke="url(#g-gold)" stroke-width="1.8"');
  s += sole(cx, L + 11.5, L + 14.5, 16.5, dark(x.c, 0.3));
  return s + gloss(cx - 2, L + 4, 5, 0.65);
};
const socks = (x: WearCtx, kind: string | undefined, c: string) => {
  const L = x.L;
  const hw = x.b.legW / 2 + 1;
  switch (kind) {
    case 'frill':
      return rr(-hw, L - 14, hw * 2, 16, 4, c) + P(`M${f(-hw - 2)} ${f(L - 13)} q${f(hw / 2)} -6 ${f(hw)} 0 q${f(hw / 2)} -6 ${f(hw)} 0 q${f(hw / 2)} -6 ${f(hw + 2)} 0Z`, c, `stroke="${dark(c, 0.1)}" stroke-width="0.6"`);
    case 'lace': {
      let s = rr(-hw, L - 12, hw * 2, 14, 4, c);
      for (let i = 0; i < 5; i++) s += circ(-hw + 1 + i * ((hw * 2 - 2) / 4), L - 12, 3, c) + circ(-hw + 1 + i * ((hw * 2 - 2) / 4), L - 12, 1, dark(c, 0.2), 'opacity="0.5"');
      return s;
    }
    case 'knee': {
      const t = L * (seated(x) ? 0.2 : 0.42);
      let s = cloth(`M${f(-hw)} ${f(t)} L${f(hw)} ${f(t)} L${f(hw)} ${f(L + 2)} L${f(-hw)} ${f(L + 2)}Z`, c) + rr(-hw - 1, t - 1, hw * 2 + 2, 6, 3, dark(c, 0.06));
      for (let y = t + 12; y < L - 6; y += 12) s += P(heartD(0, y - 3, 6), '#ff9ec7');
      return s;
    }
    case 'stripe': {
      const t = L - tall(x, 30);
      let s = cloth(`M${f(-hw)} ${f(t)} L${f(hw)} ${f(t)} L${f(hw)} ${f(L + 2)} L${f(-hw)} ${f(L + 2)}Z`, c);
      for (let y = t + 6; y < L - 2; y += 7) s += rr(-hw, y, hw * 2, 3, 1, '#ff9ec7');
      return s;
    }
    default:
      return '';
  }
};

// ---------- the styles ----------
const STYLES: Style[] = [
  {
    key: 'sneak', name: 'Sneakers', group: 'Sneakers',
    foot: (x, k) => sneakerFoot(x, k) + (k.v.m ? circ(k.cx + k.s * 10, k.L + 1, 4.8, '#ffffff') + motif(k.v.m, k.cx + k.s * 10, k.L + 1, 4.2) : '') + trimArt(k.v.t, k.cx - k.s * 9, k.L + 2, k.a, k.s),
    vars: [
      { c: '#7cc8ff', m: 'star' }, { c: '#ffb3c7', m: 'heart' }, { c: '#a8e6cf', m: 'strawberry' }, { c: '#c99bff', p: 'stars' },
      { c: '#ffe680', m: 'smiley', c2: '#ff9ec7' }, { c: '#ff7a6b', p: 'dots', t: 'glitter' }, { c: '#ffffff', m: 'rainbow', c2: '#c99bff' },
      { c: '#3f4f9a', c2: '#ffffff', t: 'star', n: 'Navy Racer Sneakers' }, { c: '#2d2a3a', c2: '#e8384f', n: 'Black Red Sneakers' }, { c: '#3fbf8f', c2: '#ffffff', m: 'bolt' }, { c: '#9aa3b5', c2: '#ff8a3d', m: 'planet', n: 'Rocket Sneakers' },
    ],
  },
  {
    key: 'hitop', name: 'High Tops', group: 'High Tops', tags: ['fall'],
    leg: (x, k) => {
      const t = k.L - tall(x, 26);
      const hw = x.b.legW / 2 + 4;
      let s = shaft(x, t, 4, 1) + rr(-hw - 0.5, t - 1, hw * 2 + 1, 5, 2.5, '#ffffff');
      s += rr(-4.5, t + 3, 9, k.L - t - 2, 3, light(x.c, 0.18)) + laces(0, t + 6, k.L - 1, 5);
      const px = k.s * (hw - 4);
      s += circ(px, t + 12, 5, '#ffffff') + (k.v.m ? motif(k.v.m, px, t + 12, 4.2) : P(starD(px, t + 12, 3.8), x.c));
      return s;
    },
    foot: (x, k) => sneakerFoot(x, k, -4) + trimArt(k.v.t, k.cx, k.L + 6, k.a, k.s),
    vars: [
      { c: '#9b6bff' }, { c: '#ff7eb6', m: 'heart' }, { c: '#5fd3b5', m: 'bolt' }, { c: '#3f4f9a', m: 'planet', p: 'stars' }, { c: '#e8384f', m: 'cherry', c2: '#fff3d6' }, { c: '#ffd36b', m: 'sun', t: 'glitter' },
      { c: '#2d2a3a', m: 'star', n: 'Black Star High Tops' }, { c: '#4f9dff', m: 'note' }, { c: '#9aa3b5', c2: '#ff7a6b', m: 'paw', n: 'Silver Paw High Tops' },
    ],
  },
  {
    key: 'slipon', name: 'Slip-Ons', group: 'Slip-Ons', tags: ['summer'],
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 1, L + 12, 17), x.c, x.p, 'y');
      s += P(`M${f(cx - 11)} ${f(L - 0.5)} Q${f(cx)} ${f(L + 5)} ${f(cx + 11)} ${f(L - 0.5)}`, 'none', stroke(dark(x.c, 0.25), 2.2));
      for (const sd of [-1, 1]) s += P(`M${f(cx + sd * 13)} ${f(L + 1)} l${f(sd * 2.5)} 4 l${f(sd * -2.5)} 0Z`, dark(x.c, 0.2));
      s += sole(cx, L + 8, L + 14.5, 17.5, '#ffffff') + line(cx - 15, L + 10.5, cx + 15, L + 10.5, k.v.c2 ?? k.a, 1.6);
      if (k.v.m) s += motif(k.v.m, cx, L + 5, 4.5);
      return s + gloss(cx - 4, L + 3, 4, 0.4) + trimArt(k.v.t, cx + k.s * 8, L + 4, k.a, k.s);
    },
    vars: [
      { c: '#2d2a3a', p: 'check', n: 'Checkerboard Slip-Ons' }, { c: '#ffb3c7', m: 'cherry' }, { c: '#9fd6ff', m: 'cloud' }, { c: '#a8e6cf', p: 'flowers' }, { c: '#ffe680', m: 'lemon', t: 'star' },
    ],
  },
  {
    key: 'platform', name: 'Platforms', group: 'Platform Sneakers',
    foot: (x, k) => {
      const { cx, L } = k;
      let s = rr(cx - 6, L - 12, 12, 10, 4, light(x.c, 0.18)) + cloth(shoeBlob(cx, L - 8, L + 5, 16), x.c, x.p, 'y') + laces(cx, L - 7, L, 5);
      const cols = k.v.c2 === 'rainbow' ? ['#ff9ec7', '#ffd36b', '#a8e6cf', '#9fd6ff'] : [k.v.c2 ?? '#ffffff', '#ffffff', k.v.c2 ?? light(x.c, 0.5), '#ffffff'];
      const ys = [L + 3, L + 6, L + 9, L + 12];
      cols.forEach((c, i) => {
        s += rr(cx - 17.5, ys[i], 35, i === 3 ? 2.8 : 3.4, 1.5, c);
      });
      s += rr(cx - 17.5, L + 3, 35, 11.8, 3, 'none', `stroke="${dark(k.v.c2 && k.v.c2 !== 'rainbow' ? k.v.c2 : '#e6e0ee', 0.15)}" stroke-width="0.8"`);
      if (k.v.m) s += motif(k.v.m, cx + k.s * 9, L - 1, 4);
      return s + gloss(cx - 3, L - 3, 4, 0.45) + trimArt(k.v.t, cx - k.s * 8, L - 1, k.a, k.s);
    },
    vars: [
      { c: '#ffffff', c2: 'rainbow', n: 'Rainbow Platforms' }, { c: '#ffb3c7', c2: '#ffffff', m: 'heart' }, { c: '#c99bff', c2: '#ffe680', m: 'star' }, { c: '#a8e6cf', c2: '#ff9ec7', p: 'dots' }, { c: '#2d2a3a', c2: '#ff7eb6', m: 'bolt', t: 'glitter' },
    ],
  },
  {
    key: 'cleat', name: 'Soccer Cleats', group: 'Soccer Cleats', tags: ['spring', 'fall'], premium: 10,
    leg: (x, k) => {
      const t = x.L * (seated(x) ? 0.25 : 0.42);
      const hw = x.b.legW / 2 + 1.5;
      const sc = k.v.c2 ?? '#ffffff';
      let s = cloth(`M${f(-hw)} ${f(t)} L${f(hw)} ${f(t)} L${f(hw)} ${f(x.L + 2)} L${f(-hw)} ${f(x.L + 2)}Z`, sc);
      s += `<ellipse cx="0" cy="${f(t + (x.L - t) * 0.45)}" rx="${f(hw - 1.5)}" ry="${f((x.L - t) * 0.28)}" fill="#ffffff" opacity="0.12"/>`;
      s += rr(-hw - 0.5, t - 1, hw * 2 + 1, 6, 2.5, dark(sc, 0.06)) + rr(-hw, t + 6, hw * 2, 2.6, 1, x.c) + rr(-hw, t + 10, hw * 2, 2.6, 1, x.c);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      const c2 = k.v.c2 ?? '#ffffff';
      let s = cloth(shoeBlob(cx, L - 4, L + 11, 17), x.c, x.p, 'y');
      for (let i = 0; i < 3; i++) s += line(cx + k.s * (5 + i * 3.4), L + 9, cx + k.s * (10 + i * 3.4), L - 1, c2 === '#ffffff' ? '#ffffff' : c2, 1.8);
      s += laces(cx - k.s * 3, L - 3, L + 3, 4.5, c2 === '#ffffff' ? '#ffffff' : light(c2, 0.4));
      s += rr(cx - 17.5, L + 9, 35, 3, 1.5, c2);
      for (const dx of [-13, -5, 5, 13]) s += P(`M${f(cx + dx - 2.4)} ${f(L + 12)} L${f(cx + dx + 2.4)} ${f(L + 12)} L${f(cx + dx + 1.4)} ${f(L + 14.8)} L${f(cx + dx - 1.4)} ${f(L + 14.8)}Z`, dark(c2, 0.25));
      if (k.v.m) s += motif(k.v.m, cx - k.s * 9, L + 5, 3.4);
      return s + gloss(cx - 3, L, 4.6, 0.6);
    },
    vars: [
      { c: '#ff8a3d', c2: '#ffffff', n: 'Orange Blaze Cleats' }, { c: '#4f9dff', c2: '#ffffff', n: 'Blue Strike Cleats' }, { c: '#e6f55a', c2: '#2d2a3a', n: 'Neon Cleats' },
      { c: '#2d2a3a', c2: '#e8384f', n: 'Black Red Cleats' }, { c: '#ff4f8b', c2: '#ffffff', m: 'heart', n: 'Pink Goal Cleats' }, { c: '#3fbf8f', c2: '#ffe680', m: 'star', n: 'Star Player Cleats' }, { c: '#ffffff', c2: '#3f4f9a', m: 'bolt', n: 'Lightning Cleats' },
    ],
  },
  {
    key: 'skate', name: 'Skate Shoes', group: 'Skate Shoes',
    foot: (x, k) => {
      const { cx, L } = k;
      const c2 = k.v.c2 ?? '#ffffff';
      let s = rr(cx - 7.5, L - 14, 15, 14, 6, light(x.c, 0.12), `stroke="${dark(x.c, 0.15)}" stroke-width="0.8"`);
      s += cloth(shoeBlob(cx, L - 7, L + 10, 18.5), x.c, x.p, 'y');
      s += P(`M${f(cx - 18)} ${f(L + 6)} Q${f(cx - 9)} ${f(L - 3)} ${f(cx)} ${f(L + 3)} Q${f(cx + 9)} ${f(L + 8)} ${f(cx + 18)} ${f(L - 1)}`, 'none', `stroke="${c2}" stroke-width="2.6" stroke-linecap="round"`);
      for (let y = L - 6; y < L + 1; y += 4) s += rr(cx - 6.5, y, 13, 2.6, 1.3, '#ffffff');
      s += rr(cx - 19, L + 8, 38, 6.5, 3, '#ffffff') + rr(cx - 19, L + 10.2, 38, 1.6, 0.8, k.v.kind === 'gum' ? '#c98a5a' : dark(x.c, 0.1));
      for (let i = 0; i < 9; i++) s += line(cx - 16 + i * 4, L + 12.5, cx - 16 + i * 4, L + 13.8, '#d9dbe6', 0.8);
      if (k.v.m) s += circ(cx + k.s * 11, L + 1, 4.4, '#ffffff') + motif(k.v.m, cx + k.s * 11, L + 1, 3.8);
      return s + gloss(cx - 3, L - 2, 4.6, 0.35);
    },
    vars: [
      { c: '#2d2a3a', c2: '#ffffff', n: 'Classic Skate Shoes' }, { c: '#3f4f9a', c2: '#ff7a6b', kind: 'gum', n: 'Navy Skate Shoes' }, { c: '#8a2e4a', c2: '#ffffff', n: 'Maroon Skate Shoes' },
      { c: '#6b6f80', c2: '#5fd3b5', n: 'Grey Skate Shoes' }, { c: '#5fd3b5', c2: '#ffffff', m: 'bolt', n: 'Bolt Skate Shoes' }, { c: '#ffab5e', c2: '#2d2a3a', p: 'check', n: 'Checker Skate Shoes' },
    ],
  },
  {
    key: 'slide', name: 'Slides', group: 'Slides', tags: ['summer'],
    foot: (x, k) => {
      const { cx, L } = k;
      const bed = k.v.c2 ?? dark(x.c, 0.35);
      let s = rr(cx - 17.5, L + 9, 35, 5.5, 2.6, bed) + rr(cx - 17.5, L + 9, 35, 1.6, 0.8, light(bed, 0.3));
      s += P(shoeBlob(cx, L - 2, L + 11, 14), x.skin) + P(shoeBlob(cx, L - 2, L + 11, 14), 'url(#g-shadeY)');
      for (let i = 0; i < 5; i++) s += circ(cx - 10 + i * 5, L + 9.4, 2.5, x.skin);
      const strap = `M${f(cx - 17)} ${f(L + 1)} Q${f(cx)} ${f(L - 4)} ${f(cx + 17)} ${f(L + 1)} L${f(cx + 17)} ${f(L + 8)} Q${f(cx)} ${f(L + 5)} ${f(cx - 17)} ${f(L + 8)}Z`;
      s += cloth(strap, x.c, x.p, 'y');
      if (k.v.kind === 'stripes') for (const dx of [-7, 0, 7]) s += P(`M${f(cx + dx - 1.6)} ${f(L - 1.4 + Math.abs(dx) * 0.12)} L${f(cx + dx + 1.6)} ${f(L - 1.4 + Math.abs(dx) * 0.12)} L${f(cx + dx + 1.6)} ${f(L + 5.8 + Math.abs(dx) * 0.12)} L${f(cx + dx - 1.6)} ${f(L + 5.8 + Math.abs(dx) * 0.12)}Z`, '#ffffff');
      if (k.v.kind === 'fuzzy') s += fluffRow(cx - 16, cx + 16, L + 0.5, 2.8, light(x.c, 0.3)) + fluffRow(cx - 16, cx + 16, L + 5, 2.8, light(x.c, 0.2));
      if (k.v.m) s += motif(k.v.m, cx, L + 2.5, 3.8);
      return s + gloss(cx - 4, L + 1, 3.6, 0.45);
    },
    vars: [
      { c: '#2d2a3a', kind: 'stripes', c2: '#ffffff', n: 'Sporty Stripe Slides' }, { c: '#3f4f9a', kind: 'stripes', n: 'Navy Stripe Slides' }, { c: '#e8384f', m: 'star', c2: '#ffffff', n: 'Red Star Slides' },
      { c: '#9fd6ff', m: 'cloud' }, { c: '#ffb3c7', kind: 'fuzzy', c2: '#ffffff', n: 'Fluffy Pink Slides' }, { c: '#a8e6cf', m: 'avocado' }, { c: '#ffd36b', m: 'sun', c2: '#ff8a3d' },
    ],
  },
  {
    key: 'lightup', name: 'Light-Ups', group: 'Light-Up Sneakers', premium: 20,
    foot: (x, k) => {
      const { cx, L } = k;
      const seq = k.v.c2 === 'rainbow' || !k.v.c2 ? '#ff7eb6;#ffd36b;#7fe0b0;#7cc8ff;#c99bff;#ff7eb6' : `${k.v.c2};#ffffff;${k.v.c2}`;
      const first = seq.split(';')[0];
      let s = `<ellipse cx="${f(cx)}" cy="${f(L + 14)}" rx="22" ry="6" fill="${first}" opacity="0.35"><animate attributeName="fill" values="${seq}" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.55;0.2" dur="0.7s" repeatCount="indefinite"/></ellipse>`;
      s += sneakerFoot(x, k);
      s += rr(cx - 17, L + 10, 34, 3.2, 1.6, first, '').replace('/>', `><animate attributeName="fill" values="${seq}" dur="1.4s" repeatCount="indefinite"/></rect>`);
      for (let i = 0; i < 5; i++) s += circ(cx - 12 + i * 6, L + 11.6, 0.9, '#ffffff', 'opacity="0.9"');
      if (k.v.m) s += circ(cx + k.s * 10, L + 1, 4.8, '#ffffff') + motif(k.v.m, cx + k.s * 10, L + 1, 4.2);
      return s + trimArt(k.v.t, cx - k.s * 9, L + 2, k.a, k.s);
    },
    vars: [
      { c: '#ff9ec7', c2: 'rainbow', n: 'Rainbow Light-Ups' }, { c: '#9fd6ff', c2: '#7cc8ff', m: 'star' }, { c: '#c99bff', c2: '#ff7eb6', m: 'unicorn' }, { c: '#ffffff', m: 'heart', p: 'hearts' }, { c: '#5fd3b5', c2: '#ffe06b', m: 'bolt', t: 'glitter' }, { c: '#2d2a3a', m: 'moon', n: 'Night Glow Light-Ups' },
    ],
  },
  {
    key: 'mj', name: 'Mary Janes', group: 'Mary Janes',
    leg: (x, k) => socks(x, k.v.kind, k.v.c2 ?? '#ffffff'),
    foot: (x, k) => maryFoot(x, k) + (k.v.m ? motif(k.v.m, k.cx, k.L + 6.5, 4) : '') + trimArt(k.v.t, k.cx, k.L + 6, k.a, k.s),
    vars: [
      { c: '#e8384f', kind: 'frill', n: 'Cherry Mary Janes' }, { c: '#2d2a3a', kind: 'lace', t: 'bow' }, { c: '#ffb3c7', kind: 'frill', t: 'heart' }, { c: '#c99bff', kind: 'knee', n: 'Heart Sock Mary Janes' },
      { c: '#9fd6ff', kind: 'stripe', t: 'flower', n: 'Stripy Sock Mary Janes' }, { c: '#ffd36b', kind: 'lace', m: 'daisy' }, { c: '#ff7eb6', p: 'dots', kind: 'frill', t: 'glitter' },
    ],
  },
  {
    key: 'flat', name: 'Ballet Flats', group: 'Ballet Flats', tags: ['spring'],
    foot: (x, k) => {
      const { cx, L } = k;
      let s = P(shoeBlob(cx, L - 2, L + 9, 14), x.skin) + P(shoeBlob(cx, L - 2, L + 9, 14), 'url(#g-shadeY)');
      s += cloth(`M${f(cx - 16)} ${f(L + 5)} Q${f(cx - 16)} ${f(L + 1)} ${f(cx - 11)} ${f(L + 2)} Q${f(cx)} ${f(L + 6)} ${f(cx + 11)} ${f(L + 2)} Q${f(cx + 16)} ${f(L + 1)} ${f(cx + 16)} ${f(L + 5)} L${f(cx + 16)} ${f(L + 11)} Q${f(cx + 16)} ${f(L + 14.5)} ${f(cx + 12)} ${f(L + 14.5)} L${f(cx - 12)} ${f(L + 14.5)} Q${f(cx - 16)} ${f(L + 14.5)} ${f(cx - 16)} ${f(L + 11)}Z`, x.c, x.p, 'y');
      s += P(`M${f(cx - 11)} ${f(L + 2.6)} Q${f(cx)} ${f(L + 6.6)} ${f(cx + 11)} ${f(L + 2.6)}`, 'none', stroke(dark(x.c, 0.2), 1.4));
      if (k.v.m) s += motif(k.v.m, cx, L + 9, 3.8);
      return s + gloss(cx - 3, L + 9, 3.6, 0.55) + trimArt(k.v.t ?? 'bow', cx, L + 5.5, dark(x.c, 0.1), k.s);
    },
    vars: [{ c: '#ffd0dc' }, { c: '#fff3d6', t: 'pearl' }, { c: '#c99bff', t: 'flower' }, { c: '#e8384f', m: 'cherry', t: 'none' }, { c: '#9fd6ff', p: 'dots', t: 'gem' }],
  },
  {
    key: 'jelly', name: 'Jelly Sandals', group: 'Jelly Sandals', tags: ['summer'],
    foot: (x, k) => {
      const { cx, L } = k;
      let s = P(shoeBlob(cx, L - 2, L + 12, 14.5), x.skin) + P(shoeBlob(cx, L - 2, L + 12, 14.5), 'url(#g-shadeY)');
      const st = `fill-opacity="0.72" stroke="${light(x.c, 0.4)}" stroke-width="0.8"`;
      for (let i = 0; i < 4; i++) s += rr(cx - 12 + i * 7, L + 1, 4, 11, 2, x.c, st);
      s += rr(cx - 16, L + 2.5, 32, 3.6, 1.8, x.c, st) + rr(cx - 16, L + 7.5, 32, 3.6, 1.8, x.c, st);
      s += rr(cx - 14, L - 4, 28, 4, 2, x.c, st);
      s += rr(cx - 17, L + 11, 34, 3.6, 1.8, dark(x.c, 0.05), 'fill-opacity="0.85"');
      s += glitter(cx, L + 1, L + 12, 14, x.c, 10);
      if (k.v.m) s += motif(k.v.m, cx, L + 6.5, 4);
      return s + gloss(cx - 4, L + 4, 3.2, 0.7) + trimArt(k.v.t, cx + k.s * 9, L - 2, k.a, k.s);
    },
    vars: [{ c: '#ff7eb6', n: 'Bubblegum Jellies' }, { c: '#7cc8ff', t: 'star', n: 'Starry Blue Jellies' }, { c: '#c99bff', t: 'glitter' }, { c: '#5fd3b5', m: 'fish' }, { c: '#ffd36b', t: 'flower' }],
  },
  {
    key: 'flip', name: 'Flip-Flops', group: 'Flip-Flops', tags: ['summer'],
    foot: (x, k) => {
      const { cx, L } = k;
      let s = `<ellipse cx="${f(cx)}" cy="${f(L + 12.5)}" rx="17.5" ry="3.4" fill="${k.v.c2 ?? light(x.c, 0.35)}"/>` + `<ellipse cx="${f(cx)}" cy="${f(L + 13.6)}" rx="17.5" ry="2.4" fill="${dark(k.v.c2 ?? light(x.c, 0.35), 0.15)}"/>`;
      s += P(shoeBlob(cx, L - 2, L + 12, 14), x.skin) + P(shoeBlob(cx, L - 2, L + 12, 14), 'url(#g-shadeY)');
      for (let i = 0; i < 5; i++) s += circ(cx - 10 + i * 5, L + 10.6, 2.6, x.skin) + circ(cx - 10 + i * 5, L + 9.8, 1, k.v.kind === 'polish' ? '#ff7eb6' : '#ffffff', 'opacity="0.6"');
      s += P(`M${f(cx - 13)} ${f(L + 3)} Q${f(cx - 4)} ${f(L + 3)} ${f(cx)} ${f(L + 9)} Q${f(cx + 4)} ${f(L + 3)} ${f(cx + 13)} ${f(L + 3)}`, 'none', `stroke="${x.c}" stroke-width="3.6" stroke-linecap="round"`);
      s += P(`M${f(cx - 12)} ${f(L + 2.4)} Q${f(cx - 4)} ${f(L + 2.4)} ${f(cx - 1)} ${f(L + 7)}`, 'none', stroke('#ffffff', 1, 0.5));
      if (k.v.m) s += motif(k.v.m, cx, L + 7, 4.5);
      else s += trimArt(k.v.t ?? 'flower', cx, L + 7, k.a, k.s);
      return s;
    },
    vars: [{ c: '#ff9ec7', t: 'flower' }, { c: '#5fd3b5', m: 'watermelon' }, { c: '#ffd36b', m: 'sun' }, { c: '#7cc8ff', m: 'fish', kind: 'polish' }, { c: '#ff7a6b', m: 'strawberry', c2: '#fff3b0' }],
  },
  {
    key: 'glad', name: 'Gladiators', group: 'Gladiator Sandals', tags: ['summer'], premium: 10,
    leg: (x, k) => {
      const t = k.L - tall(x, 40);
      const hw = x.b.legW / 2 + 1.5;
      let s = rr(-2, t, 4, k.L - t + 2, 2, dark(x.c, 0.08));
      for (let y = t; y < k.L - 3; y += 8) s += rr(-hw, y, hw * 2, 3.6, 1.8, x.c) + circ(k.s * (hw - 2), y + 1.8, 1.4, 'url(#g-gold)');
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = P(shoeBlob(cx, L - 2, L + 12, 14.5), x.skin) + P(shoeBlob(cx, L - 2, L + 12, 14.5), 'url(#g-shadeY)');
      s += sole(cx, L + 10.5, L + 14.5, 17, k.v.c2 ?? dark(x.c, 0.2));
      s += rr(cx - 15, L + 1, 30, 3.6, 1.8, x.c) + rr(cx - 15.5, L + 6, 31, 3.6, 1.8, x.c) + rr(cx - 2, L - 2, 4, 12, 2, dark(x.c, 0.08));
      return s + trimArt(k.v.t ?? 'star', cx, L + 3, k.a, k.s);
    },
    vars: [{ c: '#c9a27e', t: 'none' }, { c: '#ffd36b', c2: '#c9a27e', t: 'gem' }, { c: '#ffffff', c2: '#ff9ec7', t: 'flower' }, { c: '#ff7eb6', t: 'heart' }],
  },
  {
    key: 'socksandal', name: 'Sock Sandals', group: 'Socks & Sandals', tags: ['spring', 'summer'],
    leg: (x, k) => {
      const t = k.L - tall(x, 24);
      const hw = x.b.legW / 2 + 1;
      const sc = k.v.c2 ?? '#ffffff';
      let s = cloth(`M${f(-hw)} ${f(t)} L${f(hw)} ${f(t)} L${f(hw)} ${f(k.L + 2)} L${f(-hw)} ${f(k.L + 2)}Z`, sc) + rr(-hw - 0.5, t - 1, hw * 2 + 1, 6, 2.5, dark(sc, 0.05));
      for (let xx = -hw + 2; xx < hw - 1; xx += 3) s += line(xx, t, xx, t + 4, dark(sc, 0.15), 0.8, 0.6);
      if (k.v.m) s += motif(k.v.m, 0, t + 13, 5);
      else s += rr(-hw, t + 8, hw * 2, 2.5, 1, x.c) + rr(-hw, t + 12, hw * 2, 2.5, 1, k.a);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      const sc = k.v.c2 ?? '#ffffff';
      let s = cloth(shoeBlob(cx, L - 2, L + 12, 15), sc, 'none', 'y');
      s += sole(cx, L + 9, L + 14.5, 17.5, dark(x.c, 0.15)) + rr(cx - 17.5, L + 9, 35, 2, 1, light(x.c, 0.2));
      s += rr(cx - 16, L - 1, 32, 5, 2.5, x.c, `stroke="${dark(x.c, 0.15)}" stroke-width="0.6"`) + rr(cx - 16.5, L + 4.5, 33, 5, 2.5, x.c, `stroke="${dark(x.c, 0.15)}" stroke-width="0.6"`);
      s += rr(cx + k.s * 10 - 3, L - 1.5, 6, 6, 1.5, light(x.c, 0.3)) + rr(cx + k.s * 10 - 3, L + 4, 6, 6, 1.5, light(x.c, 0.3));
      return s + trimArt(k.v.t, cx - k.s * 4, L + 1.5, k.a, k.s);
    },
    vars: [{ c: '#5fd3b5', c2: '#ffffff' }, { c: '#ff7eb6', c2: '#fff3d6', m: 'cherry' }, { c: '#9b6bff', c2: '#ffe680', m: 'smiley' }, { c: '#4f9dff', c2: '#ffb3c7', m: 'heart', p: 'stripes' }],
  },
  {
    key: 'clog', name: 'Clogs', group: 'Clogs',
    foot: (x, k) => {
      const { cx, L } = k;
      const sc = k.v.c2 ?? '#c9a27e';
      let s = cloth(shoeBlob(cx, L - 4, L + 11, 18), x.c, x.p, 'y');
      s += sole(cx, L + 9, L + 14.5, 18, sc) + line(cx - 14, L + 11, cx - 4, L + 11.4, dark(sc, 0.2), 0.8, 0.6) + line(cx + 2, L + 12, cx + 13, L + 11.6, dark(sc, 0.2), 0.8, 0.6);
      if (k.v.kind === 'holes') {
        for (const [dx, dy] of [[-8, 0], [0, -1.5], [8, 0], [-4, 4], [4, 4]]) s += `<ellipse cx="${f(cx + dx)}" cy="${f(L + dy)}" rx="1.9" ry="1.4" fill="${dark(x.c, 0.3)}"/>`;
        s += rr(cx + k.s * 15 - 2, L - 2, 4, 8, 2, dark(x.c, 0.1));
        const ms = [k.v.m ?? 'star', 'heart'];
        s += circ(cx - 9, L + 5, 3.6, '#ffffff') + motif(ms[0], cx - 9, L + 5, 3.2) + circ(cx + 9, L + 5, 3.6, '#ffffff') + motif(ms[1], cx + 9, L + 5, 3.2);
      } else {
        s += flowerG(cx, L + 3, 5, k.v.t === 'heart' ? '#ff9ec7' : '#ffffff', '#ffd36b');
        for (const sd of [-1, 1]) s += P(`M${f(cx + sd * 6)} ${f(L + 4)} q${f(sd * 4)} -3 ${f(sd * 8)} 1`, 'none', stroke('#5fae6b', 1.6));
        if (k.v.m) s += motif(k.v.m, cx + k.s * 11, L + 3, 3.5);
      }
      return s + gloss(cx - 2, L + 1, 4.5, 0.5);
    },
    vars: [{ c: '#9fd6ff', n: 'Dutch Flower Clogs' }, { c: '#ff9ec7', kind: 'holes', m: 'star', n: 'Charm Clogs' }, { c: '#a8e6cf', kind: 'holes', m: 'dino', n: 'Dino Charm Clogs' }, { c: '#ffffff', c2: '#ffab5e', m: 'tulip', t: 'heart' }],
  },
  {
    key: 'loafer', name: 'Loafers', group: 'Loafers', tags: ['fall'],
    leg: (x, k) => {
      const hw = x.b.legW / 2 + 1;
      const t = k.L - tall(x, 12);
      return rr(-hw, t, hw * 2, k.L - t + 3, 3, k.v.c2 ?? '#ffffff') + rr(-hw, t, hw * 2, 3.5, 1.5, dark(k.v.c2 ?? '#ffffff', 0.08));
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 1, L + 13, 16), x.c, x.p, 'y');
      s += P(`M${f(cx - 11)} ${f(L + 0.4)} Q${f(cx)} ${f(L + 4)} ${f(cx + 11)} ${f(L + 0.4)}`, 'none', stroke(dark(x.c, 0.3), 2));
      s += sole(cx, L + 11.5, L + 14.5, 16.5, dark(x.c, 0.4));
      s += P(`M${f(cx - 12)} ${f(L + 3)} Q${f(cx)} ${f(L + 7)} ${f(cx + 12)} ${f(L + 3)} L${f(cx + 12)} ${f(L + 6.5)} Q${f(cx)} ${f(L + 10.5)} ${f(cx - 12)} ${f(L + 6.5)}Z`, dark(x.c, 0.14));
      if (k.v.kind === 'tassel') s += line(cx - 3, L + 6, cx - 5, L + 12, dark(x.c, 0.3), 1.6) + line(cx + 3, L + 6, cx + 5, L + 12, dark(x.c, 0.3), 1.6) + circ(cx - 5, L + 12, 1.8, dark(x.c, 0.3)) + circ(cx + 5, L + 12, 1.8, dark(x.c, 0.3));
      else s += `<ellipse cx="${f(cx)}" cy="${f(L + 6.8)}" rx="3.6" ry="1.4" fill="${dark(x.c, 0.4)}"/>` + (k.v.kind === 'penny' ? circ(cx, L + 6.5, 2.2, 'url(#g-gold)') : '');
      if (k.v.m) s += motif(k.v.m, cx, L + 6.5, 3.6);
      return s + gloss(cx - 3, L + 3, 4, 0.55);
    },
    vars: [{ c: '#8a5a3c', kind: 'penny' }, { c: '#2d2a3a', kind: 'tassel', c2: '#ffb3c7' }, { c: '#e0457b', kind: 'penny', c2: '#fff3d6' }, { c: '#c99bff', m: 'heart', c2: '#ffffff' }],
  },
  {
    key: 'oxford', name: 'Oxfords', group: 'Dress Shoes', premium: 10,
    leg: (x, k) => {
      const hw = x.b.legW / 2 + 1;
      const t = k.L - tall(x, 14);
      const sc = k.v.kind === 'dance' ? '#ffffff' : '#4a4a5e';
      return rr(-hw, t, hw * 2, k.L - t + 3, 3, sc) + rr(-hw, t, hw * 2, 3, 1.5, dark(sc, 0.12));
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 3, L + 12.5, 16.5), x.c, x.p, 'y');
      if (k.v.kind === 'saddle') s += P(`M${f(cx - 15)} ${f(L + 1)} Q${f(cx)} ${f(L - 6)} ${f(cx + 15)} ${f(L + 1)} L${f(cx + 16)} ${f(L + 6)} Q${f(cx)} ${f(L + 1)} ${f(cx - 16)} ${f(L + 6)}Z`, k.v.c2 ?? '#3f4f9a');
      s += P(`M${f(cx - 15)} ${f(L + 7)} Q${f(cx)} ${f(L + 1.5)} ${f(cx + 15)} ${f(L + 7)}`, 'none', stroke(dark(x.c, 0.3), 1.3));
      if (k.v.kind === 'brogue') for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const px = cx - 14 + 28 * t;
        const py = L + 7 - 4.6 * (1 - (2 * t - 1) ** 2) + 1.8;
        s += circ(px, py, 0.7, dark(x.c, 0.35));
      }
      s += rr(cx - 6, L - 4, 12, 7, 3, dark(x.c, 0.1)) + line(cx - 5, L - 2, cx + 5, L - 2, k.v.kind === 'dance' ? '#2d2a3a' : '#ffffff', 1.4, 0.8) + line(cx - 5, L + 1, cx + 5, L + 1, k.v.kind === 'dance' ? '#2d2a3a' : '#ffffff', 1.4, 0.8);
      s += sole(cx, L + 11.5, L + 14.5, 17, k.v.kind === 'saddle' ? '#e8384f' : dark(x.c, 0.45));
      return s + gloss(cx - 3, L + 4, 5, k.v.kind === 'suede' ? 0.15 : 0.7) + (k.v.m ? motif(k.v.m, cx + k.s * 9, L + 4, 3.2) : '');
    },
    vars: [
      { c: '#2d2a3a', n: 'Shiny Black Oxfords' }, { c: '#8a5a3c', kind: 'brogue', n: 'Brown Brogues' }, { c: '#c98a5a', kind: 'brogue', n: 'Tan Brogues' }, { c: '#8a2e4a', n: 'Burgundy Oxfords' },
      { c: '#ffffff', kind: 'saddle', c2: '#3f4f9a', n: 'Navy Saddle Shoes' }, { c: '#9aa3b5', kind: 'suede', n: 'Grey Suede Oxfords' }, { c: '#ffffff', kind: 'dance', m: 'star', n: 'White Dance Shoes' },
    ],
  },
  {
    key: 'heel', name: 'Party Heels', group: 'Party Heels', premium: 15,
    foot: (x, k) => {
      const { cx, L } = k;
      let s = P(shoeBlob(cx, L - 3, L + 9, 13), x.skin) + P(shoeBlob(cx, L - 3, L + 9, 13), 'url(#g-shadeY)');
      s += rr(cx + k.s * 9 - 3, L + 8, 6, 6.5, 1.5, dark(x.c, 0.25));
      s += cloth(`M${f(cx - 15)} ${f(L + 3)} Q${f(cx)} ${f(L - 4)} ${f(cx + 15)} ${f(L + 3)} L${f(cx + 15)} ${f(L + 9)} Q${f(cx + 15)} ${f(L + 12)} ${f(cx + 12)} ${f(L + 12)} L${f(cx - 12)} ${f(L + 12)} Q${f(cx - 15)} ${f(L + 12)} ${f(cx - 15)} ${f(L + 9)}Z`, x.c, x.p, 'y');
      s += rr(cx - 12, L - 4, 24, 3.4, 1.7, x.c) + rr(cx - 1.6, L - 2, 3.2, 6, 1.5, x.c);
      if (k.v.t === 'glitter') s += glitter(cx, L + 1, L + 11, 13, x.c, 14);
      if (k.v.m) s += motif(k.v.m, cx, L + 6, 4);
      return s + gloss(cx - 3, L + 3, 4.2, 0.65) + trimArt(k.v.t === 'glitter' ? 'glitter' : k.v.t ?? 'gem', cx, L + 3.5, light(x.c, 0.3), k.s);
    },
    vars: [{ c: '#ff4f8b', t: 'bow' }, { c: '#ffffff', t: 'pearl' }, { c: '#c99bff', t: 'gem' }, { c: '#ffd36b', t: 'glitter', n: 'Golden Party Heels' }, { c: '#e8384f', t: 'heart' }, { c: '#9fd6ff', m: 'crown', t: 'none' }],
  },
  {
    key: 'glitter', name: 'Glitter Shoes', group: 'Glitter Shoes', premium: 25, free: 2,
    foot: (x, k) => {
      const { cx, L } = k;
      let s = maryFoot(x, k);
      if (k.v.kind === 'rainbow') s += P(shoeBlob(cx, L - 2, L + 11.5, 16), 'url(#g-rainbow)', 'opacity="0.7"');
      s += glitter(cx, L - 1, L + 11, 14, x.c, 26);
      s += twinkle(cx - 7, L + 2, 3.6, 0) + twinkle(cx + 7, L + 7, 3, 0.7) + twinkle(cx + 2, L - 0.5, 2.6, 1.3);
      return s + trimArt(k.v.t ?? 'bow', cx, L + 4, k.v.kind === 'rainbow' ? '#ff7eb6' : light(x.c, 0.3), k.s);
    },
    vars: [{ c: '#ff9ec7', n: 'Pink Glitter Shoes' }, { c: '#d9dbe6', t: 'star', n: 'Silver Glitter Shoes' }, { c: '#ffd36b', t: 'heart', n: 'Gold Glitter Shoes' }, { c: '#ffffff', kind: 'rainbow', n: 'Rainbow Glitter Shoes' }],
  },
  {
    key: 'ankle', name: 'Ankle Boots', group: 'Ankle Boots', tags: ['fall'],
    leg: (x, k) => {
      const t = k.L - tall(x, 24);
      let s = shaft(x, t, 4, 1.5);
      const hw = x.b.legW / 2 + 4;
      switch (k.v.kind) {
        case 'chelsea':
          for (const sd of [-1, 1]) s += P(`M${f(sd * (hw - 1))} ${f(t + 1)} L${f(sd * (hw - 7))} ${f(t + 1)} L${f(sd * (hw - 3))} ${f(k.L + 2)} L${f(sd * (hw + 0.5))} ${f(k.L + 2)}Z`, dark(x.c, 0.25));
          s += rr(-3, t - 5, 6, 8, 2, dark(x.c, 0.15));
          break;
        case 'lace':
          s += laces(0, t + 3, k.L, 5, light(x.c, 0.55)) + rr(-hw, t, hw * 2, 3.5, 1.5, dark(x.c, 0.15));
          break;
        case 'fur':
          s += fluffRow(-hw - 1, hw + 1, t + 1, 4.4, '#fffaf5');
          break;
        default:
          for (let y = t + 5; y < k.L - 2; y += 6) s += circ(k.s * (hw - 3), y, 1.8, '#ffd24a');
          s += rr(-hw, t, hw * 2, 3.5, 1.5, dark(x.c, 0.15));
      }
      if (k.v.m) s += motif(k.v.m, -k.s * 2, t + 11, 4.5);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 12, 17), x.c, x.p, 'y');
      s += sole(cx, L + 10, L + 14.5, 17.5, dark(x.c, 0.38));
      if (k.v.kind === 'heel') s += rr(cx + k.s * 9 - 3.5, L + 12, 7, 2.5, 1, dark(x.c, 0.45));
      return s + gloss(cx - 3, L - 1, 4.4, 0.45) + trimArt(k.v.t, cx, L + 3, k.a, k.s);
    },
    vars: [{ c: '#8a5a3c', kind: 'chelsea', n: 'Cocoa Chelsea Boots' }, { c: '#2d2a3a', kind: 'lace' }, { c: '#ffb3c7', kind: 'button', t: 'heart' }, { c: '#f4ead9', kind: 'fur' }, { c: '#c99bff', kind: 'lace', p: 'stars', m: 'moon' }],
  },
  {
    key: 'hike', name: 'Hiking Boots', group: 'Hiking Boots', tags: ['fall', 'spring'], premium: 10,
    leg: (x, k) => {
      const t = k.L - tall(x, 26);
      const hw = x.b.legW / 2 + 5;
      const lc = k.v.c2 ?? '#e8384f';
      let s = shaft(x, t, 5, 1);
      s += rr(-hw - 1, t - 3, hw * 2 + 2, 8, 4, dark(x.c, 0.18)) + rr(-hw, t - 2, hw * 2, 3, 1.5, light(x.c, 0.2), 'opacity="0.6"');
      s += rr(-4.5, t + 4, 9, k.L - t - 2, 3, light(x.c, 0.12)) + laces(0, t + 6, k.L, 5.5, lc);
      for (let y = t + 6; y < k.L; y += 4.2) s += circ(-6.5, y + 1.5, 1.1, 'url(#g-silver)') + circ(6.5, y + 1.5, 1.1, 'url(#g-silver)');
      s += P(`M${f(-hw)} ${f(t + 14)} Q0 ${f(t + 10)} ${f(hw)} ${f(t + 14)}`, 'none', `stroke="${dark(x.c, 0.25)}" stroke-width="1" stroke-dasharray="2 1.6"`);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 11, 18), x.c, x.p, 'y');
      s += P(`M${f(cx - 17.5)} ${f(L + 5)} Q${f(cx)} ${f(L - 1)} ${f(cx + 17.5)} ${f(L + 5)} L${f(cx + 18)} ${f(L + 10)} L${f(cx - 18)} ${f(L + 10)}Z`, dark(x.c, 0.3));
      const sc = k.v.kind === 'gum' ? '#c98a5a' : '#4a4a5e';
      s += rr(cx - 19, L + 8.5, 38, 6, 2.6, sc);
      for (let i = 0; i < 6; i++) s += P(`M${f(cx - 17 + i * 6.4)} ${f(L + 14.5)} l1.6 -2.6 l2 0 l1.6 2.6Z`, dark(sc, 0.3));
      if (k.v.m) s += motif(k.v.m, cx + k.s * 10, L + 1, 3.4);
      return s + gloss(cx - 3, L - 1, 4.4, 0.35);
    },
    vars: [
      { c: '#8a5a3c', c2: '#e8384f', kind: 'gum', n: 'Trail Hiking Boots' }, { c: '#7a8a5a', c2: '#ff8a3d', n: 'Olive Hiking Boots' }, { c: '#9aa3b5', c2: '#5fd3b5', n: 'Grey Hiking Boots' },
      { c: '#3f4f9a', c2: '#ffd36b', kind: 'gum', n: 'Navy Hiking Boots' }, { c: '#c9a27e', c2: '#3fbf8f', m: 'leaf', n: 'Explorer Boots' }, { c: '#ff9ec7', c2: '#9b6bff', m: 'star', n: 'Pink Hiking Boots' },
    ],
  },
  {
    key: 'cowboy', name: 'Cowboy Boots', group: 'Cowboy Boots', premium: 10,
    leg: (x, k) => {
      const t = k.L - tall(x, 38);
      const hw = x.b.legW / 2 + 5;
      const L = k.L;
      let s = cloth(`M${f(-hw - 1)} ${f(t - 2)} Q${f(-hw / 2)} ${f(t - 3)} 0 ${f(t + 5)} Q${f(hw / 2)} ${f(t - 3)} ${f(hw + 1)} ${f(t - 2)} L${f(hw + 1.5)} ${f(L + 3)} L${f(-hw - 1.5)} ${f(L + 3)}Z`, x.c, x.p);
      s += P(`M${f(-hw)} ${f(t + 2)} Q${f(-hw / 2)} ${f(t + 1)} 0 ${f(t + 9)} Q${f(hw / 2)} ${f(t + 1)} ${f(hw)} ${f(t + 2)}`, 'none', `stroke="${k.v.c2 ?? light(x.c, 0.5)}" stroke-width="1.2" stroke-dasharray="2 1.6"`);
      const c2 = k.v.c2 ?? light(x.c, 0.5);
      const my = t + (L - t) * 0.5;
      if (k.v.m) s += motif(k.v.m, 0, my, 6);
      else if (k.v.kind === 'heart') s += P(heartD(0, my - 6, 11), c2);
      else s += P(starD(0, my, 6.5), c2);
      s += P(`M-6 ${f(my + 9)} Q0 ${f(my + 5)} 6 ${f(my + 9)} M-7 ${f(my - 9)} Q0 ${f(my - 14)} 7 ${f(my - 9)}`, 'none', stroke(c2, 1.2, 0.8));
      if (k.v.t === 'fur') for (let y = t + 6; y < L - 4; y += 4) s += line(k.s * (hw + 1), y, k.s * (hw + 5), y + 3, light(x.c, 0.3), 1.6);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(`M${f(cx - 16)} ${f(L + 4)} Q${f(cx - 16)} ${f(L - 5)} ${f(cx)} ${f(L - 5)} Q${f(cx + 16)} ${f(L - 5)} ${f(cx + 16)} ${f(L + 4)} L${f(cx + 13)} ${f(L + 11)} Q${f(cx)} ${f(L + 14)} ${f(cx - 13)} ${f(L + 11)}Z`, x.c, x.p, 'y');
      s += P(`M${f(cx - 12)} ${f(L + 11.5)} Q${f(cx)} ${f(L + 15)} ${f(cx + 12)} ${f(L + 11.5)} L${f(cx + 14)} ${f(L + 14.5)} L${f(cx - 14)} ${f(L + 14.5)}Z`, dark(x.c, 0.4));
      s += rr(cx + k.s * 10 - 3.5, L + 11, 7, 3.5, 1, dark(x.c, 0.45));
      s += P(`M${f(cx - 8)} ${f(L + 1)} Q${f(cx)} ${f(L - 3)} ${f(cx + 8)} ${f(L + 1)}`, 'none', `stroke="${k.v.c2 ?? light(x.c, 0.5)}" stroke-width="1.1" stroke-dasharray="2 1.6"`);
      return s + gloss(cx - 3, L + 2, 4.4, 0.5) + trimArt(k.v.t === 'fur' ? undefined : k.v.t, cx, L + 6, k.a, k.s);
    },
    vars: [{ c: '#c98a5a', c2: '#fff3d6' }, { c: '#ff9ec7', c2: '#ffffff', kind: 'heart' }, { c: '#ffffff', c2: '#ff7eb6', t: 'fur', n: 'Fringe Cowboy Boots' }, { c: '#9fd6ff', m: 'star', c2: '#ffffff' }, { c: '#c99bff', m: 'sunflower', c2: '#ffe680', t: 'glitter' }],
  },
  {
    key: 'knee', name: 'Knee Boots', group: 'Knee-High Boots', tags: ['fall', 'winter'], premium: 15,
    leg: (x, k) => {
      const t = x.L * (seated(x) ? 0.22 : 0.36);
      const hw = x.b.legW / 2 + 3.5;
      let s = shaft(x, t, 3.5, 1);
      switch (k.v.kind) {
        case 'cuff':
          s += rr(-hw - 1.5, t - 2, hw * 2 + 3, 10, 3, k.v.c2 ?? light(x.c, 0.3)) + (k.v.c2 ? P(starD(0, t + 3, 3), x.c) : '');
          break;
        case 'lace':
          s += laces(0, t + 4, x.L - 1, 4.5, light(x.c, 0.5));
          break;
        case 'buckle':
          for (let y = t + 8; y < x.L - 6; y += 12) s += rr(-hw, y, hw * 2, 3.5, 1.5, dark(x.c, 0.2)) + rr(k.s * (hw - 5) - 2.5, y - 1, 5, 5.5, 1, 'none', 'stroke="url(#g-silver)" stroke-width="1.4"');
          break;
        case 'knit':
          for (let xx = -hw + 3; xx < hw - 1; xx += 4) s += line(xx, t + 2, xx, x.L - 2, dark(x.c, 0.12), 1.2, 0.6);
          s += rr(-hw - 1, t - 2, hw * 2 + 2, 7, 3, light(x.c, 0.2));
          if (k.v.t === 'pompom') s += pom(k.s * (hw - 2), t + 6, 3.4, k.a) + pom(k.s * (hw - 6), t + 8, 3, light(k.a, 0.3));
          break;
        default:
          for (let y = t + 6; y < x.L - 2; y += 7) s += circ(k.s * (hw - 3), y, 1.8, k.v.c2 ?? '#ffffff');
      }
      s += `<path d="M${f(-hw * 0.5)} ${f(t + 6)} L${f(-hw * 0.5)} ${f(x.L - 4)}" ${stroke('#ffffff', 2.4, 0.35)}/>`;
      if (k.v.m) s += motif(k.v.m, 0, t + (x.L - t) * 0.45, 4.6);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 12, 16.5), x.c, x.p, 'y') + sole(cx, L + 10, L + 14.5, 17, dark(x.c, 0.38));
      return s + gloss(cx - 3, L - 1, 4.4, 0.5) + trimArt(k.v.t === 'pompom' ? undefined : k.v.t, cx, L + 3, k.a, k.s);
    },
    vars: [{ c: '#2d2a3a', kind: 'buckle' }, { c: '#e0457b', kind: 'button', c2: '#ffd24a' }, { c: '#fff3d6', kind: 'knit', t: 'pompom', n: 'Sweater Knee Boots' }, { c: '#c99bff', kind: 'cuff', c2: '#ffe680' }, { c: '#8a5a3c', kind: 'lace', m: 'leaf' }],
  },
  {
    key: 'rain', name: 'Rain Boots', group: 'Rain Boots', tags: ['spring'],
    leg: (x, k) => {
      const t = x.L * (seated(x) ? 0.3 : 0.48);
      const hw = x.b.legW / 2 + 5;
      let s = shaft(x, t, 5, 0.5) + rr(-hw - 1, t - 2, hw * 2 + 2, 7, 3, k.v.c2 ?? dark(x.c, 0.15));
      if (k.v.m && k.v.kind !== 'frog') {
        const h = x.L - t;
        s += motif(k.v.m, -4, t + h * 0.32, 4.6) + motif(k.v.m, 5, t + h * 0.62, 4.6);
      }
      return s + `<path d="M${f(-hw + 3.5)} ${f(t + 7)} L${f(-hw + 3.5)} ${f(x.L - 4)}" ${stroke('#ffffff', 3, 0.5)}/>`;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 12, 18), x.c, x.p, 'y') + sole(cx, L + 10, L + 14.5, 18.5, k.v.c2 ?? dark(x.c, 0.2));
      if (k.v.kind === 'frog') {
        for (const sd of [-1, 1]) s += circ(cx + sd * 7, L - 5, 5, x.c) + circ(cx + sd * 7, L - 5, 3.4, '#ffffff') + circ(cx + sd * 7, L - 4.5, 2, '#2d2a3a') + circ(cx + sd * 7 + 0.7, L - 5.3, 0.7, '#ffffff');
        s += P(`M${f(cx - 6)} ${f(L + 3)} Q${f(cx)} ${f(L + 7)} ${f(cx + 6)} ${f(L + 3)}`, 'none', stroke(dark(x.c, 0.4), 1.6)) + `<ellipse cx="${f(cx - 10)}" cy="${f(L + 3)}" rx="2.6" ry="1.6" fill="#ff8fb0" opacity="0.8"/><ellipse cx="${f(cx + 10)}" cy="${f(L + 3)}" rx="2.6" ry="1.6" fill="#ff8fb0" opacity="0.8"/>`;
      } else if (k.v.m) s += motif(k.v.m, cx + k.s * 6, L + 3, 4);
      return s + gloss(cx - 3, L - 1, 5.5, 0.65) + trimArt(k.v.t, cx - k.s * 6, L + 3, k.a, k.s);
    },
    vars: [
      { c: '#ffd84a', m: 'cloud' }, { c: '#ff9ec7', m: 'heart' }, { c: '#6fc47c', kind: 'frog', n: 'Froggy Rain Boots' }, { c: '#7cc8ff', m: 'rainbow', c2: '#ffffff' },
      { c: '#c99bff', p: 'dots', m: 'star' }, { c: '#ff7a6b', m: 'cherry', c2: '#ffffff' }, { c: '#ffffff', p: 'flowers', c2: '#ff9ec7', m: 'daisy', n: 'Garden Rain Boots' },
    ],
  },
  {
    key: 'snow', name: 'Snow Boots', group: 'Snow Boots', tags: ['winter'], premium: 15,
    leg: (x, k) => {
      const t = k.L - tall(x, 32);
      const hw = x.b.legW / 2 + 6;
      let s = shaft(x, t, 6, 1);
      for (let y = t + 10; y < k.L - 2; y += 8) s += P(`M${f(-hw)} ${f(y)} Q0 ${f(y + 3)} ${f(hw)} ${f(y)}`, 'none', stroke(dark(x.c, 0.2), 1.4, 0.7));
      s += laces(0, t + 8, k.L, 4, '#ffffff');
      s += fluffRow(-hw - 1, hw + 1, t, 5, '#fffaf5');
      if (k.v.t === 'pompom') s += line(-2, t + 2, -5, t + 10, '#ffffff', 1.2) + line(2, t + 2, 5, t + 10, '#ffffff', 1.2) + pom(-5, t + 11, 3.6, k.a) + pom(5, t + 11, 3.6, k.a);
      if (k.v.m) s += motif(k.v.m, k.s * 5, t + (k.L - t) * 0.6, 4.4);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 11, 19), x.c, x.p, 'y');
      const sc = k.v.c2 ?? dark(x.c, 0.35);
      s += rr(cx - 19.5, L + 8, 39, 6.5, 3, sc);
      for (let i = 0; i < 6; i++) s += rr(cx - 17 + i * 6.4, L + 13, 3.6, 2, 0.8, dark(sc, 0.2));
      return s + gloss(cx - 3, L - 1, 5, 0.4) + trimArt(k.v.t === 'pompom' ? undefined : k.v.t, cx, L + 2, k.a, k.s);
    },
    vars: [{ c: '#c99bff', m: 'snowflake' }, { c: '#ff7eb6', t: 'pompom' }, { c: '#7cc8ff', m: 'star', c2: '#3f4f9a' }, { c: '#ffffff', p: 'stars', c2: '#9fd6ff', t: 'pompom', n: 'Snow Angel Boots' }],
  },
  {
    key: 'fuzzy', name: 'Fuzzy Boots', group: 'Fuzzy Boots', tags: ['winter'], premium: 10,
    leg: (x, k) => {
      const t = k.L - tall(x, 30);
      const hw = x.b.legW / 2 + 6;
      const fc = k.v.c2 ?? '#fffaf5';
      let s = cloth(`M${f(-hw)} ${f(t)} L${f(hw)} ${f(t)} Q${f(hw + 2)} ${f((t + k.L) / 2)} ${f(hw + 1)} ${f(k.L + 3)} L${f(-hw - 1)} ${f(k.L + 3)} Q${f(-hw - 2)} ${f((t + k.L) / 2)} ${f(-hw)} ${f(t)}Z`, x.c, x.p);
      s += `<path d="M0 ${f(t + 10)} L0 ${f(k.L)}" fill="none" stroke="${dark(x.c, 0.2)}" stroke-width="1.1" stroke-dasharray="2 1.8"/>`;
      s += rr(-hw - 1.5, t - 4, hw * 2 + 3, 11, 5, fc) + fluffRow(-hw - 1, hw + 1, t + 6, 3.4, fc) + fluffRow(-hw, hw, t - 4, 3, fc);
      if (k.v.t === 'pompom') s += pom(k.s * (hw - 1), t + 9, 3.8, k.a) + pom(k.s * (hw - 5), t + 12, 3.4, light(k.a, 0.3));
      if (k.v.t === 'bow') s += `<g transform="translate(${f(k.s * (hw - 3))} ${f(t + 6)}) scale(0.3)">${bowG(0, 0, 1, k.a)}</g>`;
      if (k.v.m) s += motif(k.v.m, -k.s * 3, t + (k.L - t) * 0.6, 4.6);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 12.5, 18.5), x.c, x.p, 'y');
      s += fluffRow(cx - 17, cx + 17, L + 12.5, 1.8, k.v.c2 ?? '#fffaf5') + sole(cx, L + 12, L + 14.5, 18.5, dark(x.c, 0.15));
      return s + (k.v.t === 'heart' ? trimArt('heart', cx, L + 3, k.a, k.s) : '');
    },
    vars: [{ c: '#c9a27e' }, { c: '#ffb3c7', t: 'pompom' }, { c: '#e6d4ff', t: 'bow', c2: '#ffffff' }, { c: '#9aa3b5', m: 'heart', c2: '#ffd0dc' }],
  },
  {
    key: 'iceskate', name: 'Ice Skates', group: 'Ice Skates', tags: ['winter'], premium: 25,
    leg: (x, k) => {
      const t = k.L - tall(x, 28);
      const hw = x.b.legW / 2 + 4;
      let s = shaft(x, t, 4, 1) + rr(-hw - 1, t - 2, hw * 2 + 2, 6, 3, k.v.c2 ?? light(x.c, 0.2));
      s += laces(0, t + 5, k.L, 5, dark(x.c, 0.25));
      for (let y = t + 5; y < k.L; y += 4.2) s += circ(-5.5, y, 1, 'url(#g-silver)') + circ(5.5, y, 1, 'url(#g-silver)');
      if (k.v.t === 'pompom') s += pom(-4, t + 4, 3.6, k.v.c2 ?? '#ff9ec7') + pom(4, t + 4, 3.6, k.v.c2 ?? '#ff9ec7');
      if (k.v.t === 'fur') s += fluffRow(-hw - 1, hw + 1, t, 4.2, '#fffaf5');
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = cloth(shoeBlob(cx, L - 6, L + 8, 16), x.c, x.p, 'y') + sole(cx, L + 6, L + 8.5, 16.5, dark(x.c, 0.2));
      s += rr(cx - 3, L + 8, 6, 3.5, 1, '#c9ccd9') + rr(cx - 11, L + 8, 4, 3.5, 1, '#c9ccd9') + rr(cx + 7, L + 8, 4, 3.5, 1, '#c9ccd9');
      s += P(`M${f(cx - 15)} ${f(L + 11.5)} L${f(cx + 14)} ${f(L + 11.5)} Q${f(cx + 19)} ${f(L + 11.5)} ${f(cx + 18)} ${f(L + 8)}`.replace(/ /g, ' '), 'none', 'stroke="url(#g-silver)" stroke-width="3" stroke-linecap="round"');
      s += line(cx - 14, L + 11, cx + 10, L + 11, '#ffffff', 0.8, 0.9);
      if (k.v.m) s += motif(k.v.m, cx, L + 1, 4);
      return s + gloss(cx - 3, L - 2, 4, 0.5) + trimArt(k.v.t === 'pompom' || k.v.t === 'fur' ? undefined : k.v.t, cx + k.s * 8, L + 1, k.a, k.s);
    },
    vars: [{ c: '#ffffff', t: 'pompom', n: 'Snow White Skates' }, { c: '#ffd0dc', t: 'fur' }, { c: '#e6d4ff', m: 'snowflake', t: 'glitter' }, { c: '#9fd6ff', m: 'star', c2: '#ffffff' }],
  },
  {
    key: 'roller', name: 'Roller Skates', group: 'Roller Skates', tags: ['summer'], premium: 25,
    leg: (x, k) => {
      const t = k.L - tall(x, 26);
      const hw = x.b.legW / 2 + 4;
      let s = shaft(x, t, 4, 1) + rr(-hw - 1, t - 2, hw * 2 + 2, 6, 3, k.v.c2 ?? '#ffffff');
      s += laces(0, t + 5, k.L, 5, '#ffffff');
      if (k.v.t === 'pompom') s += pom(-4, t + 5, 3.8, k.a) + pom(4, t + 5, 3.8, light(k.a, 0.3));
      if (k.v.m) s += circ(k.s * (hw - 3), t + 13, 4.4, '#ffffff') + motif(k.v.m, k.s * (hw - 3), t + 13, 3.8);
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      const wc = k.v.c2 ?? '#ffd36b';
      let s = cloth(shoeBlob(cx, L - 6, L + 8, 17), x.c, x.p, 'y') + rr(cx - 17.5, L + 6, 35, 4, 2, '#ffffff');
      s += rr(cx - 14, L + 9.5, 28, 3, 1.5, '#c9ccd9');
      for (const dx of [-9.5, 9.5]) s += circ(cx + dx, L + 15, 5.4, wc, `stroke="${dark(wc, 0.25)}" stroke-width="1.2"`) + circ(cx + dx, L + 15, 1.8, '#ffffff') + circ(cx + dx - 2, L + 13, 1.2, '#ffffff', 'opacity="0.6"');
      s += circ(cx, L + 11, 3, '#ff7eb6');
      return s + gloss(cx - 3, L - 2, 4.4, 0.5) + trimArt(k.v.t === 'pompom' ? undefined : k.v.t, cx + k.s * 8, L + 1, k.a, k.s);
    },
    vars: [{ c: '#ffffff', c2: '#ff9ec7', t: 'pompom' }, { c: '#7cc8ff', c2: '#ffe680', m: 'star' }, { c: '#ffb3c7', c2: '#a8e6cf', m: 'heart', t: 'glitter' }, { c: '#c99bff', c2: '#7fe0d0', m: 'bolt', n: 'Disco Roller Skates' }],
  },
  {
    key: 'pointe', name: 'Pointe Shoes', group: 'Ballet Pointe Shoes', premium: 20,
    leg: (x, k) => {
      const t = k.L - tall(x, 34);
      const hw = x.b.legW / 2 + 0.5;
      let s = '';
      const n = 3;
      const step = (k.L - 2 - t) / n;
      for (let i = 0; i < n; i++) {
        const y = k.L - 2 - i * step;
        s += line(-hw, y, hw, y - step, x.c, 3) + line(hw, y, -hw, y - step, light(x.c, 0.15), 3);
      }
      s += `<g transform="translate(${f(k.s * 2)} ${f(t + 1)}) scale(0.3)">${bowG(0, 0, 1, x.c)}</g>`;
      return s;
    },
    foot: (x, k) => {
      const { cx, L } = k;
      let s = P(shoeBlob(cx, L - 3, L + 8, 13), x.skin) + P(shoeBlob(cx, L - 3, L + 8, 13), 'url(#g-shadeY)');
      s += cloth(`M${f(cx - 14)} ${f(L + 4)} Q${f(cx)} ${f(L - 3)} ${f(cx + 14)} ${f(L + 4)} L${f(cx + 13)} ${f(L + 10)} Q${f(cx + 12)} ${f(L + 14.5)} ${f(cx + 6)} ${f(L + 14.5)} L${f(cx - 6)} ${f(L + 14.5)} Q${f(cx - 12)} ${f(L + 14.5)} ${f(cx - 13)} ${f(L + 10)}Z`, x.c, x.p, 'y');
      s += P(`M${f(cx - 9)} ${f(L + 2)} Q${f(cx)} ${f(L - 1)} ${f(cx + 9)} ${f(L + 2)}`, 'none', stroke(dark(x.c, 0.18), 1.2)) + line(cx, L + 3, cx, L + 13, dark(x.c, 0.12), 1, 0.6);
      if (k.v.m) s += motif(k.v.m, cx + k.s * 7, L + 7, 3.4);
      return s + `<ellipse cx="${f(cx - 4)}" cy="${f(L + 7)}" rx="2.2" ry="5" fill="#ffffff" opacity="0.5"/>` + trimArt(k.v.t, cx, L + 3, k.a, k.s);
    },
    vars: [{ c: '#ffc9d6', n: 'Ballerina Pointe Shoes' }, { c: '#ffffff', t: 'pearl', n: 'Swan Pointe Shoes' }, { c: '#e6d4ff', t: 'glitter', m: 'star' }, { c: '#ff9ec7', t: 'flower', m: 'heart' }],
  },
  {
    key: 'slipper', name: 'Slippers', group: 'Animal Slippers', premium: 10,
    foot: (x, k) => {
      const { cx, L } = k;
      const c = x.c;
      const inner = '#ff9ec7';
      let s = '';
      const kind = k.v.kind ?? 'bear';
      // ears and other parts behind the face
      if (kind === 'bunny') s += [-1, 1].map((sd) => P(`M${f(cx + sd * 7)} ${f(L - 2)} Q${f(cx + sd * 13)} ${f(L - 27)} ${f(cx + sd * 6)} ${f(L - 25)} Q${f(cx + sd * 2)} ${f(L - 19)} ${f(cx + sd * 3)} ${f(L - 2)}Z`, c) + P(`M${f(cx + sd * 6)} ${f(L - 4)} Q${f(cx + sd * 9)} ${f(L - 21)} ${f(cx + sd * 6)} ${f(L - 21)}`, 'none', stroke(inner, 2.6))).join('');
      if (kind === 'bear' || kind === 'panda') s += [-1, 1].map((sd) => circ(cx + sd * 12, L - 4, 5.5, kind === 'panda' ? '#2d2a3a' : c) + (kind === 'bear' ? circ(cx + sd * 12, L - 4, 2.6, light(c, 0.4)) : '')).join('');
      if (kind === 'kitty' || kind === 'fox') s += [-1, 1].map((sd) => P(`M${f(cx + sd * 5)} ${f(L - 2)} L${f(cx + sd * 14)} ${f(L - 13)} L${f(cx + sd * 16)} ${f(L + 1)}Z`, c) + P(`M${f(cx + sd * 8)} ${f(L - 2)} L${f(cx + sd * 13.5)} ${f(L - 9)} L${f(cx + sd * 14.5)} ${f(L - 1)}Z`, kind === 'fox' ? '#ffffff' : inner)).join('');
      if (kind === 'unicorn') s += P(`M${f(cx - 2.6)} ${f(L - 3)} L${f(cx)} ${f(L - 17)} L${f(cx + 2.6)} ${f(L - 3)}Z`, 'url(#g-gold)') + [-1, 1].map((sd) => P(`M${f(cx + sd * 6)} ${f(L - 1)} L${f(cx + sd * 12)} ${f(L - 10)} L${f(cx + sd * 14)} ${f(L)}Z`, c)).join('') +
        circ(cx - 9, L - 4, 3.4, '#ff9ec7') + circ(cx - 4.5, L - 6, 3, '#9fd6ff') + circ(cx + 5, L - 6, 3, '#c99bff');
      if (kind === 'dino') for (let i = -2; i <= 2; i++) s += P(`M${f(cx + i * 5.5 - 3)} ${f(L - 3 + Math.abs(i) * 1.6)} L${f(cx + i * 5.5)} ${f(L - 10 + Math.abs(i) * 1.6)} L${f(cx + i * 5.5 + 3)} ${f(L - 3 + Math.abs(i) * 1.6)}Z`, k.v.c2 ?? '#ffd36b');
      if (kind === 'frog') for (const sd of [-1, 1]) s += circ(cx + sd * 8, L - 4, 5.5, c) + circ(cx + sd * 8, L - 4, 3.6, '#ffffff') + circ(cx + sd * 8, L - 3.5, 2.1, '#2d2a3a') + circ(cx + sd * 8 + 0.7, L - 4.4, 0.7, '#ffffff');
      s += cloth(shoeBlob(cx, L - 4, L + 14.5, 19), c, x.p, 'y');
      s += fluffRow(cx - 17, cx + 17, L - 2.5, 2.4, light(c, 0.25));
      // faces
      const eyes = (y: number, dx = 5.5) => circ(cx - dx, y, 1.9, '#2d2a3a') + circ(cx + dx, y, 1.9, '#2d2a3a') + circ(cx - dx + 0.6, y - 0.6, 0.6, '#ffffff') + circ(cx + dx + 0.6, y - 0.6, 0.6, '#ffffff');
      const blush = (y: number) => `<ellipse cx="${f(cx - 10.5)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="#ff8fb0" opacity="0.8"/><ellipse cx="${f(cx + 10.5)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="#ff8fb0" opacity="0.8"/>`;
      const smile = (y: number) => P(`M${f(cx - 2.6)} ${f(y)} Q${f(cx)} ${f(y + 2.4)} ${f(cx + 2.6)} ${f(y)}`, 'none', stroke('#2d2a3a', 1.2));
      switch (kind) {
        case 'bear':
          s += `<ellipse cx="${f(cx)}" cy="${f(L + 8)}" rx="6.5" ry="4.6" fill="${light(c, 0.45)}"/>` + eyes(L + 3) + `<ellipse cx="${f(cx)}" cy="${f(L + 6.6)}" rx="2.2" ry="1.6" fill="#4a2e22"/>` + smile(L + 8.6) + blush(L + 7);
          break;
        case 'panda':
          s += `<ellipse cx="${f(cx - 6)}" cy="${f(L + 3.5)}" rx="3.4" ry="4" fill="#2d2a3a" transform="rotate(-20 ${f(cx - 6)} ${f(L + 3.5)})"/><ellipse cx="${f(cx + 6)}" cy="${f(L + 3.5)}" rx="3.4" ry="4" fill="#2d2a3a" transform="rotate(20 ${f(cx + 6)} ${f(L + 3.5)})"/>` +
            circ(cx - 6, L + 3, 1.1, '#ffffff') + circ(cx + 6, L + 3, 1.1, '#ffffff') + `<ellipse cx="${f(cx)}" cy="${f(L + 7.6)}" rx="2" ry="1.4" fill="#2d2a3a"/>` + smile(L + 9) + blush(L + 8.4);
          break;
        case 'bunny':
          s += eyes(L + 4) + `<ellipse cx="${f(cx)}" cy="${f(L + 7.4)}" rx="2" ry="1.5" fill="#ff7eb6"/>` + smile(L + 9) + blush(L + 8) + circ(cx, L + 12, 2.4, '#ffffff', 'opacity="0.0"');
          break;
        case 'kitty':
          s += eyes(L + 4) + P(`M${f(cx - 1.6)} ${f(L + 7)} L${f(cx + 1.6)} ${f(L + 7)} L${f(cx)} ${f(L + 8.6)}Z`, '#ff7eb6') + P(`M${f(cx - 3)} ${f(L + 9.4)} Q${f(cx - 1.5)} ${f(L + 11)} ${f(cx)} ${f(L + 9.4)} Q${f(cx + 1.5)} ${f(L + 11)} ${f(cx + 3)} ${f(L + 9.4)}`, 'none', stroke('#2d2a3a', 1)) +
            line(cx - 8, L + 8, cx - 15, L + 7, dark(c, 0.35), 0.9) + line(cx - 8, L + 9.5, cx - 15, L + 10.5, dark(c, 0.35), 0.9) + line(cx + 8, L + 8, cx + 15, L + 7, dark(c, 0.35), 0.9) + line(cx + 8, L + 9.5, cx + 15, L + 10.5, dark(c, 0.35), 0.9);
          break;
        case 'fox':
          s += P(`M${f(cx - 13)} ${f(L + 4)} Q${f(cx)} ${f(L + 2)} ${f(cx + 13)} ${f(L + 4)} Q${f(cx + 8)} ${f(L + 13)} ${f(cx)} ${f(L + 13)} Q${f(cx - 8)} ${f(L + 13)} ${f(cx - 13)} ${f(L + 4)}Z`, '#ffffff') + eyes(L + 4.5) + circ(cx, L + 9, 1.8, '#2d2a3a') + blush(L + 8);
          break;
        case 'unicorn':
          s += P(`M${f(cx - 8)} ${f(L + 4)} Q${f(cx - 5.5)} ${f(L + 6)} ${f(cx - 3)} ${f(L + 4)} M${f(cx + 3)} ${f(L + 4)} Q${f(cx + 5.5)} ${f(L + 6)} ${f(cx + 8)} ${f(L + 4)}`, 'none', stroke('#2d2a3a', 1.3)) + smile(L + 9) + blush(L + 7.6) + P(sparkleD(cx + 11, L + 1, 2.6), '#ffd24a');
          break;
        case 'dino':
          s += eyes(L + 3.5, 6) + P(`M${f(cx - 6)} ${f(L + 8)} Q${f(cx)} ${f(L + 12)} ${f(cx + 6)} ${f(L + 8)}`, 'none', stroke('#2d2a3a', 1.3)) + P(`M${f(cx - 3)} ${f(L + 9.4)} l1.4 2 l1.4 -1.6Z M${f(cx + 1)} ${f(L + 9.6)} l1.4 1.8 l1.4 -2.2Z`, '#ffffff') + circ(cx - 9, L + 1, 1.2, dark(c, 0.2)) + circ(cx + 10, L + 0, 1.4, dark(c, 0.2)) + blush(L + 7);
          break;
        case 'frog':
          s += P(`M${f(cx - 7)} ${f(L + 6)} Q${f(cx)} ${f(L + 11)} ${f(cx + 7)} ${f(L + 6)}`, 'none', stroke(dark(c, 0.45), 1.5)) + blush(L + 6);
          break;
      }
      return s + circ(cx - 9, L + 1, 1.4, '#ffffff', 'opacity="0.35"');
    },
    vars: [
      { c: '#ffffff', kind: 'bunny', n: 'Bunny Hop Slippers' }, { c: '#c98a5a', kind: 'bear', n: 'Teddy Bear Slippers' }, { c: '#ffffff', kind: 'unicorn', n: 'Unicorn Slippers' }, { c: '#ffb3c7', kind: 'kitty', n: 'Kitty Slippers' },
      { c: '#a8e6cf', kind: 'dino', c2: '#ffab5e', n: 'Dino Slippers' }, { c: '#ffffff', kind: 'panda', n: 'Panda Slippers' }, { c: '#6fc47c', kind: 'frog', n: 'Froggy Slippers' }, { c: '#ffab5e', kind: 'fox', n: 'Fox Slippers' },
    ],
  },
];

const PAT_NAMES: Record<string, string> = { dots: 'Polka Dot', stripes: 'Stripy', hearts: 'Heart', stars: 'Starry', check: 'Plaid', flowers: 'Flower' };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const used = new Set<string>();
const usedNames = new Set<string>();

function makeShoe(st: Style, v: Var, i: number): WearDef {
  const m = v.m ? MOTIF_BY_ID[v.m] : undefined;
  const base = v.n ?? (v.p ? `${PAT_NAMES[v.p]} ${st.name}` : m ? `${m.name} ${st.name}` : `${colorName(v.c)} ${st.name}`);
  let name = base;
  if (usedNames.has(name)) name = `${colorName(v.c)} ${name}`;
  usedNames.add(name);
  let id = `shoe-${st.key}-${v.kind && st.key === 'slipper' ? v.kind : v.p ? v.p : m ? m.id : slug(colorName(v.c))}`;
  if (used.has(id)) id += `-${slug(colorName(v.c))}`;
  while (used.has(id)) id += 'x';
  used.add(id);
  const free = st.free ?? 3;
  const ctx = (x: WearCtx, s: 1 | -1): K => ({ a: accentFor(x.c), v, cx: s * 3, L: x.L, s, hw: x.b.legW / 2 });
  return {
    id,
    name,
    slot: 'shoes',
    group: st.group,
    price: i < free ? 0 : Math.min(180, 15 + (i - free) * 8 + (st.premium ?? 0)),
    color: v.c,
    pattern: v.p ?? 'none',
    tags: st.tags ?? (m?.season ? [m.season] : undefined),
    foot: (x, s) => st.foot(x, ctx(x, s)),
    leg: st.leg ? (x, s) => st.leg!(x, ctx(x, s)) : undefined,
  };
}

export const SHOES_MORE: WearDef[] = STYLES.flatMap((st) => st.vars.map((v, i) => makeShoe(st, v, i)));
