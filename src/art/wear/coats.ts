// Coats and jackets: 21 cuts (cardigans, puffers, raincoats, capes, kimonos...), each in a handful of
// versions with its own color, print and trim. Open coats are drawn as two side panels so the top
// shows in the middle; closed ones meet at the centre.
import { type Body, sideX, sleevePath } from '../body';
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { MOTIF_BY_ID, accentFor, colorName, motif } from '../motifs';
import type { Season } from '../../types';
import { type Hem, type WearCtx, type WearDef, P, bowG, chestY, circ, f, heartD, hemY, line, sparkleD, starD } from './base';
import { band, lace, patch, pocket, ruffle, sparkles } from './trims';

type Trim = 'none' | 'fur' | 'bow' | 'glitter' | 'patches' | 'pompom' | 'ruffle' | 'lace' | 'pins' | 'bowtie';
type SleeveK = 'long' | 'puffer' | 'wide' | 'cape' | 'puff' | 'none' | 'poncho';
type CuffK = 'plain' | 'rib' | 'fur' | 'none';
type Spot = 'chest' | 'pocket' | 'center' | 'scatter' | 'none';

/** One version of a cut: its color, print (motif or pattern), trim and an optional second color. */
interface Var { c: string; m?: string; p?: Pattern; t?: Trim; c2?: string; n?: string; ms?: string[]; num?: number; kind?: string }

/** What a cut's decoration gets: the accent color, the variant, the hem line and the panel edges. */
interface K { a: string; v: Var; hem: number; gap: number; sx: (y: number) => number; out: number }

interface Cut {
  key: string;
  name: string;
  group: string;
  hem: Hem | 'bolero';
  gap: number;
  flare?: number;
  /** Extra bulk outside the body line (puffers, fur). */
  out?: number;
  /** Cut-away front for boleros: how far the front edges spread at the hem. */
  open?: number;
  /** V neckline: the front edge starts this far out at the shoulder and meets the opening lower down. */
  vee?: number;
  /** How deep the V goes, from shoulder (0) to waist (1). */
  veeDepth?: number;
  /** Pointed front tips at the hem, like a waistcoat. */
  point?: boolean;
  sleeve: SleeveK;
  cuff?: CuffK;
  sleeveColor?: (c: string, v: Var) => string;
  cuffColor?: (c: string, v: Var) => string;
  hood?: boolean;
  tags?: Season[];
  premium?: number;
  free?: number;
  spot?: Spot;
  /** Replace the two panels with a shape of its own (poncho). */
  shape?: (x: WearCtx, k: K) => string;
  deco?: (x: WearCtx, k: K) => string;
  armDeco?: (x: WearCtx, side: 1 | -1, k: K) => string;
  vars: Var[];
}

const seated = (x: WearCtx) => x.pose === 'sit' || x.pose === 'sleep';

function hemOf(x: WearCtx, h: Cut['hem']): number {
  const y = h === 'bolero' ? chestY(x.b) + 18 : hemY(x.b, h);
  return seated(x) ? Math.min(y, x.b.hipY + 14) : y;
}

/** One front panel of a coat, with room for bulk and a cut-away front. */
const veeY = (b: Body, depth: number) => b.shY + (b.waistY - 2 - b.shY) * depth;

function panel(b: Body, hem: number, side: 1 | -1, gap: number, flare: number, out: number, open = 0, vee = 0, depth = 1, point = false): string {
  const s = side;
  const W = b.shW + out;
  const top = b.shY - out * 0.4;
  const y0 = vee > 0 ? Math.min(veeY(b, depth), hem - 4) : b.shY + 4;
  let d = vee > 0
    ? `M${f(s * gap)} ${f(y0)} L${f(s * vee)} ${f(b.shY + 1)} L${f(s * Math.max(vee + 3, 13))} ${f(top)}`
    : `M${f(s * gap)} ${f(y0)} L${f(s * 12)} ${f(top)}`;
  d += ` L${f(s * (W - 14))} ${f(top)} Q${f(s * W)} ${f(top)} ${f(s * W)} ${f(b.shY + 16)}`;
  for (let y = b.shY + 22; y < hem; y += 8) d += ` L${f(s * (sideX(b, y, flare) + 1 + out))} ${f(y)}`;
  const g2 = gap + open;
  d += ` L${f(s * (sideX(b, hem, flare) + 1 + out))} ${f(hem)}`;
  d += point ? ` L${f(s * (g2 + 4))} ${f(hem + 9)} L${f(s * g2)} ${f(hem + 6)}` : ` Q${f(s * (g2 + 10))} ${f(hem + 6)} ${f(s * g2)} ${f(hem + 2)}`;
  if (open > 0) d += ` Q${f(s * (gap + open * 0.2))} ${f((y0 + hem) / 2 + 6)} ${f(s * gap)} ${f(y0)}`;
  return d + 'Z';
}

// ---------- small drawing helpers ----------
const rib = (x0: number, x1: number, y: number, h: number, c: string) => {
  let s = band(x0, x1, y, h, c);
  for (let xx = x0 + 3; xx < x1 - 1.5; xx += 3.4) s += line(xx, y + 1.6, xx, y + h - 1.6, dark(c, 0.16), 1, 0.55);
  return s;
};
const stroke = (c: string, w = 1.6, op = 1) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"`;
const stitch = (d: string, c: string) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.1" stroke-dasharray="2.4 2" opacity="0.8"/>`;
const shine = (x0: number, y0: number, x1: number, y1: number, w = 3, op = 0.35) =>
  `<path d="M${f(x0)} ${f(y0)} Q${f((x0 + x1) / 2 - 3)} ${f((y0 + y1) / 2)} ${f(x1)} ${f(y1)}" ${stroke('#ffffff', w, op)}/>`;
const fluffRow = (x0: number, x1: number, y: number, r: number, c: string) => {
  let s = '';
  const n = Math.max(2, Math.round((x1 - x0) / (r * 1.25)));
  for (let i = 0; i <= n; i++) s += circ(x0 + ((x1 - x0) * i) / n, y + (i % 2 ? 1.2 : -1.2), r, c);
  return s;
};
const fluffCol = (cx: number, y0: number, y1: number, r: number, c: string) => {
  let s = '';
  const n = Math.max(2, Math.round((y1 - y0) / (r * 1.2)));
  for (let i = 0; i <= n; i++) s += circ(cx + (i % 2 ? 1.4 : -1.4), y0 + ((y1 - y0) * i) / n, r, c);
  return s;
};
const btn = (x: number, y: number, r: number, c: string) =>
  circ(x, y, r, c, `stroke="${dark(c, 0.3)}" stroke-width="0.8"`) + circ(x - 0.8, y - 0.6, r * 0.42, '#ffffff', 'opacity="0.35"') +
  circ(x - r * 0.3, y, 0.55, dark(c, 0.4)) + circ(x + r * 0.3, y, 0.55, dark(c, 0.4));
const toggle = (x: number, y: number, c: string, cord: string) =>
  line(x - 9, y, x + 1, y, cord, 1.6) + `<rect x="${f(x - 2)}" y="${f(y - 2.6)}" width="11" height="5.2" rx="2.6" fill="${c}" stroke="${dark(c, 0.3)}" stroke-width="0.8"/>` + circ(x - 10, y, 2.2, dark(cord, 0.2));
const zipLine = (x0: number, y0: number, x1: number, y1: number, c = '#d9dbe6') =>
  `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="${c}" stroke-width="2.6"/><path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="${dark(c, 0.35)}" stroke-width="2.6" stroke-dasharray="1.3 1.9"/>` +
  `<rect x="${f(x0 - 2.4)}" y="${f(y0 + 2)}" width="4.8" height="8" rx="1.6" fill="${c}" stroke="${dark(c, 0.3)}" stroke-width="0.6"/>`;
const lapel = (x: WearCtx, s: number, gap: number, low: number, c: string) => {
  const y = x.b.shY;
  return P(`M${f(s * gap)} ${f(y + 3)} L${f(s * 15)} ${f(y - 1)} L${f(s * 24)} ${f(y + 8)} L${f(s * 18)} ${f(y + 14)} L${f(s * 23)} ${f(y + 20)} L${f(s * (gap + 1))} ${f(low)}Z`, c, `stroke="${dark(c, 0.15)}" stroke-width="0.8"`);
};
const rr = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const numText = (x: number, y: number, n: number, size: number, fill: string, edge: string) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" text-anchor="middle" fill="${fill}" stroke="${edge}" stroke-width="1.2" paint-order="stroke">${n}</text>`;
/** Plaid over one front panel: soft colored bands both ways, with thin light lines. */
function plaid(x: WearCtx, k: K, side: 1 | -1, c2: string): string {
  const { b } = x;
  const s = side;
  let out = '';
  const xmax = k.sx(b.waistY) - 1;
  for (let xx = k.gap + 4; xx + 6 < xmax; xx += 14) out += rr(s > 0 ? xx : -xx - 6, b.shY + 4, 6, k.hem - b.shY - 4, 0, c2, 'opacity="0.42"');
  for (let y = b.shY + 10; y < k.hem - 4; y += 14) {
    const w = k.sx(y + 6) - k.gap;
    out += rr(s > 0 ? k.gap : -k.gap - w, y, w, 6, 0, c2, 'opacity="0.42"') + rr(s > 0 ? k.gap : -k.gap - w, y + 2.6, w, 0.9, 0, '#ffffff', 'opacity="0.35"');
  }
  return out;
}
const flapPocket = (cx: number, y: number, w: number, h: number, c: string, b?: string) =>
  pocket(cx, y, w, h, dark(c, 0.06)) + P(`M${f(cx - w / 2 - 1)} ${f(y - 2)} L${f(cx + w / 2 + 1)} ${f(y - 2)} L${f(cx + w / 2 + 1)} ${f(y + 4)} Q${f(cx)} ${f(y + 8)} ${f(cx - w / 2 - 1)} ${f(y + 4)}Z`, dark(c, 0.12)) +
  (b ? btn(cx, y + 3.5, 2.2, b) : '');
const pinStar = (x: number, y: number) => P(starD(x, y, 4.6), 'url(#g-gold)', 'stroke="#d99a1e" stroke-width="0.6"');
const pinHeart = (x: number, y: number) => P(heartD(x, y - 4, 8), '#ff6f9f', 'stroke="#ffffff" stroke-width="1"');
const twinkle = (x: number, y: number, r: number, delay: number) =>
  `<path d="${sparkleD(x, y, r)}" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></path>`;

/** A hood lying down behind the neck. */
const hoodDown = (x: WearCtx) => {
  const { b } = x;
  return cloth(`M${f(-b.shW + 2)} ${f(b.shY + 14)} C${f(-b.shW - 8)} ${f(b.shY - 26)} ${f(b.shW + 8)} ${f(b.shY - 26)} ${f(b.shW - 2)} ${f(b.shY + 14)}Z`, dark(x.c, 0.16));
};

// ---------- trims ----------
function trimArt(x: WearCtx, t: Trim, k: K): string {
  const { b } = x;
  const hem = k.hem;
  switch (t) {
    case 'fur': {
      return fluffRow(-b.shW + 8 - k.out, -k.gap - 3, b.shY + 3, 5.5, '#fffaf5') + fluffRow(k.gap + 3, b.shW - 8 + k.out, b.shY + 3, 5.5, '#fffaf5');
    }
    case 'bow':
      return `<g transform="translate(0 ${f(b.shY + 12)}) scale(0.42)">${bowG(0, 0, 1, k.a)}</g>`;
    case 'glitter':
      return sparkles(-k.sx(chestY(b)) + 6, b.shY + 14, k.sx(chestY(b)) * 2 - 12, hem - b.shY - 22, 9, '#fff8c8') +
        twinkle(-k.sx(chestY(b)) * 0.55, chestY(b), 4, 0) + twinkle(k.sx(chestY(b)) * 0.5, b.waistY + 8, 3.5, 1.1);
    case 'patches': {
      const ms = k.v.ms ?? ['star', 'heart'];
      return ms.slice(0, 2).map((id, i) => patch(id, (i ? 1 : -1) * (k.gap + 12), i ? b.hipY - 4 : b.waistY + 2, 7.5, i ? '#fff3d6' : '#ffffff')).join('');
    }
    case 'pompom':
      return line(-5, b.shY + 6, -7, b.shY + 26, '#ffffff', 1.6) + line(5, b.shY + 6, 8, b.shY + 24, '#ffffff', 1.6) +
        circ(-7, b.shY + 29, 4.6, k.a) + circ(8, b.shY + 27, 4.6, k.a) + circ(-8.4, b.shY + 27.5, 1.6, '#fff', 'opacity="0.5"') + circ(6.6, b.shY + 25.5, 1.6, '#fff', 'opacity="0.5"');
    case 'ruffle':
      return ruffle(-k.sx(hem) - 3, -k.gap, hem + 5, light(x.c, 0.3), 7, 4) + ruffle(k.gap, k.sx(hem) + 3, hem + 5, light(x.c, 0.3), 7, 4);
    case 'lace':
      return lace(-k.sx(hem) - 1, -k.gap, hem + 2) + lace(k.gap, k.sx(hem) + 1, hem + 2);
    case 'bowtie': {
      const y = b.shY + 9;
      const c = k.v.c2 ?? '#2d2a3a';
      return P(`M0 ${f(y)} L-9 ${f(y - 5)} L-9 ${f(y + 5)}Z M0 ${f(y)} L9 ${f(y - 5)} L9 ${f(y + 5)}Z`, c, `stroke="${light(c, 0.2)}" stroke-width="0.8" stroke-linejoin="round"`) + rr(-2.6, y - 2.8, 5.2, 5.6, 1.6, light(c, 0.1));
    }
    case 'pins':
      return pinStar(k.gap + 8, chestY(b) - 4) + pinHeart(k.gap + 14, chestY(b) + 6);
    default:
      return '';
  }
}

function motifArt(x: WearCtx, spot: Spot, k: K): string {
  const id = k.v.m;
  if (!id || spot === 'none') return '';
  const { b } = x;
  const cy = chestY(b);
  switch (spot) {
    case 'chest': {
      return patch(id, -(k.gap + 11), cy + 4, 8, light(x.c, 0.7));
    }
    case 'pocket': {
      const py = b.waistY + 2;
      const px = k.gap + 11;
      return pocket(px, py, 18, 16, dark(x.c, 0.08)) + motif(id, px, py + 8.5, 6.5);
    }
    case 'center':
      return motif(id, 0, cy + 2, 12);
    case 'scatter': {
      let s = '';
      const rows = [b.shY + 30, cy + 14, b.waistY + 14, b.hipY + 4, b.hipY + 26, b.hipY + 46].filter((y) => y < k.hem - 8);
      rows.forEach((y, j) => {
        for (const sd of [-1, 1]) {
          const w = k.sx(y) - k.gap;
          s += motif(id, sd * (k.gap + w * (j % 2 === (sd > 0 ? 0 : 1) ? 0.22 : 0.52)), y, 5.5);
        }
      });
      return s;
    }
    default:
      return '';
  }
}

// ---------- sleeves ----------
function coatArm(x: WearCtx, cut: Cut, k: K, side: 1 | -1): string {
  const { b, p } = x;
  const c = cut.sleeveColor ? cut.sleeveColor(x.c, k.v) : x.c;
  const w = b.armW;
  const L = b.armLen;
  const cc = cut.cuffColor ? cut.cuffColor(x.c, k.v) : dark(c, 0.12);
  let s = '';
  let cuffY = L - 13;
  let half = w / 2 + 4.5;
  switch (cut.sleeve) {
    case 'none':
      return cut.armDeco ? cut.armDeco(x, side, k) : '';
    case 'long':
      s += cloth(sleevePath(w, L - 4, 4.5), c, p);
      break;
    case 'puffer': {
      half = w / 2 + 7;
      s += cloth(sleevePath(w, L - 3, 7), c, p);
      for (let y = 14; y < L - 14; y += 14) s += P(`M${f(-half + 1)} ${f(y)} Q0 ${f(y + 4)} ${f(half - 1)} ${f(y)}`, 'none', stroke(dark(c, 0.22), 1.8, 0.7));
      s += shine(-half * 0.45, 6, -half * 0.4, L * 0.55, 2.4, 0.3);
      cuffY = L - 12;
      break;
    }
    case 'wide': {
      const len = L * 0.82;
      s += cloth(sleevePath(w, len, 5, 9), c, p) + `<rect x="${f(-w / 2 - 14)}" y="${f(len - 8)}" width="${f(w + 28)}" height="8" rx="3" fill="${cut.cuffColor ? cc : k.a}"/>`;
      return s + (cut.armDeco ? cut.armDeco(x, side, k) : '');
    }
    case 'cape': {
      s += cloth(sleevePath(w, L - 4, 4.5), c, p);
      s += `<rect x="${f(-half)}" y="${f(cuffY)}" width="${f(half * 2)}" height="9" rx="3" fill="${cc}"/>`;
      const dl = L * 0.52;
      s += cloth(sleevePath(w, dl, 10, 9), c, p) + P(`M${f(-w / 2 - 19)} ${f(dl - 2)} Q0 ${f(dl + 3)} ${f(w / 2 + 19)} ${f(dl - 2)}`, 'none', stroke(dark(c, 0.2), 1.4, 0.6));
      return s + (cut.armDeco ? cut.armDeco(x, side, k) : '');
    }
    case 'poncho': {
      const dl = L * 0.6;
      s += cloth(sleevePath(w, dl, 11, 10), c, p, 'y');
      for (let xx = -w / 2 - 19; xx <= w / 2 + 19.5; xx += 3.6) s += line(xx, dl - 1, xx + side * 0.6, dl + 7, light(c, 0.15), 1.6);
      return s + (cut.armDeco ? cut.armDeco(x, side, k) : '');
    }
    case 'puff': {
      const len = L * 0.42;
      s += cloth(sleevePath(w, len, 5.5), c, p) + `<rect x="${f(-w / 2 - 5.5)}" y="${f(len - 6)}" width="${f(w + 11)}" height="6" rx="3" fill="${cc}"/>`;
      const d = `M${f(-w / 2 - 9)} 6 C${f(-w / 2 - 12)} -14 ${f(w / 2 + 12)} -14 ${f(w / 2 + 9)} 6 C${f(w / 2 + 9)} 20 ${f(-w / 2 - 9)} 20 ${f(-w / 2 - 9)} 6Z`;
      s += cloth(d, c, p);
      s += P(`M${f(-w / 2 - 3)} -4 Q0 -10 ${f(w / 2 + 3)} -4`, 'none', stroke('#ffffff', 2, 0.35));
      return s + (cut.armDeco ? cut.armDeco(x, side, k) : '');
    }
  }
  const cuff = cut.cuff ?? 'plain';
  if (cuff === 'plain') s += `<rect x="${f(-half)}" y="${f(cuffY)}" width="${f(half * 2)}" height="9" rx="3" fill="${cc}"/>`;
  if (cuff === 'rib') s += rib(-half, half, cuffY, 9, cc);
  if (cuff === 'fur') s += fluffRow(-half - 1, half + 1, cuffY + 4, 5, '#fffaf5');
  if (k.v.t === 'fur' && cuff !== 'fur') s += fluffRow(-half - 1, half + 1, cuffY + 4, 4.6, '#fffaf5');
  return s + (cut.armDeco ? cut.armDeco(x, side, k) : '');
}

// ---------- the cuts ----------
const CUTS: Cut[] = [
  {
    key: 'cardi', name: 'Cardigan', group: 'Cardigans', hem: 'hip', gap: 7, sleeve: 'long', cuff: 'rib', spot: 'pocket', tags: ['spring', 'fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const bc = dark(x.c, 0.08);
      let s = '';
      for (const sd of [-1, 1] as const) {
        s += P(`M${f(sd * k.gap)} ${f(b.shY + 4)} L${f(sd * (k.gap + 6))} ${f(b.shY + 1)} L${f(sd * (k.gap + 6))} ${f(hem + 2)} L${f(sd * k.gap)} ${f(hem + 2)}Z`, bc);
        s += rib(sd < 0 ? -k.sx(hem) : k.gap + 6, sd < 0 ? -k.gap - 6 : k.sx(hem), hem - 7, 9, bc);
        const cx = sd * (k.gap + 13);
        for (let y = b.shY + 18; y < hem - 12; y += 9) s += P(`M${f(cx - 4)} ${f(y)} l4 4.5 l4 -4.5`, 'none', stroke(light(x.c, 0.35), 1.6, 0.9));
      }
      const bcol = k.v.t === 'pins' ? '#ffd24a' : '#ffffff';
      for (let i = 0; i < 4; i++) s += btn(-k.gap - 3, b.shY + 20 + ((hem - b.shY - 34) * i) / 3, 2.8, bcol);
      return s;
    },
    vars: [
      { c: '#ffb3c7', m: 'strawberry' }, { c: '#a8e6cf', m: 'daisy' }, { c: '#fff3d6', m: 'bear' }, { c: '#c99bff', p: 'dots', t: 'pins' },
      { c: '#9fd6ff', m: 'cloud', t: 'bow' }, { c: '#ffe680', p: 'flowers' }, { c: '#ff7eb6', m: 'heart', t: 'glitter' },
    ],
  },
  {
    key: 'cropcardi', name: 'Crop Cardi', group: 'Crop Cardigans', hem: 'crop', gap: 2, sleeve: 'long', cuff: 'rib', spot: 'none', tags: ['spring'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = rib(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 6, 8, dark(x.c, 0.08));
      s += P(`M-12 ${f(b.shY + 1)} Q0 ${f(b.shY + 22)} 12 ${f(b.shY + 1)}`, 'none', stroke(dark(x.c, 0.1), 3.5));
      for (let i = 0; i < 4; i++) s += circ(0, b.shY + 18 + ((hem - b.shY - 28) * i) / 3, 2.6, '#fffaf0', 'stroke="#e8dcc8" stroke-width="0.7"') + circ(-0.8, b.shY + 17.2 + ((hem - b.shY - 28) * i) / 3, 0.9, '#fff');
      const id = k.v.m;
      if (id) {
        const spots: [number, number, number][] = [[-12, chestY(b) - 8, 5.5], [13, chestY(b) + 2, 5], [-11, b.waistY - 3, 4.5], [11, b.shY + 18, 4]];
        for (const [mx, my, r] of spots) if (my < hem - 6) s += motif(id, mx, my, r);
      }
      return s;
    },
    armDeco: (x) => P(`M${f(-x.b.armW / 2 - 4)} 2 Q0 -8 ${f(x.b.armW / 2 + 4)} 2`, 'none', stroke(light(x.c, 0.4), 2, 0.6)),
    vars: [
      { c: '#e6d4ff', m: 'cherry' }, { c: '#ffb3c7', m: 'heart' }, { c: '#a8e6cf', m: 'strawberry' }, { c: '#fff3b0', m: 'daisy', t: 'bow' },
      { c: '#9fd6ff', m: 'star', t: 'pompom' }, { c: '#ffd0dc', p: 'hearts', t: 'lace' },
    ],
  },
  {
    key: 'puffer', name: 'Puffer', group: 'Puffer Jackets', hem: 'hip', gap: 0, out: 5, sleeve: 'puffer', cuff: 'rib', spot: 'chest', tags: ['winter'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = '';
      for (let y = b.shY + 24; y < hem - 6; y += 16) s += P(`M${f(-k.sx(y) - 1)} ${f(y)} Q0 ${f(y + 6)} ${f(k.sx(y) + 1)} ${f(y)}`, 'none', stroke(dark(x.c, 0.22), 2, 0.75));
      for (let y = b.shY + 12; y < hem - 14; y += 16) for (const sd of [-1, 1]) s += shine(sd * k.sx(y) * 0.62, y + 2, sd * k.sx(y) * 0.32, y + 4, 2.2, 0.35);
      s += rib(-k.sx(hem), k.sx(hem), hem - 6, 8, dark(x.c, 0.12));
      s += `<rect x="-21" y="${f(b.shY - 6)}" width="42" height="16" rx="8" fill="${dark(x.c, 0.06)}"/>` + P(`M-18 ${f(b.shY + 8)} Q0 ${f(b.shY + 12)} 18 ${f(b.shY + 8)}`, 'none', stroke(dark(x.c, 0.2), 1.4, 0.7));
      return s + zipLine(0, b.shY + 6, 0, hem);
    },
    vars: [
      { c: '#a8e6cf', m: 'snowflake' }, { c: '#ffb3c7', m: 'heart' }, { c: '#c99bff', m: 'star' }, { c: '#ffe680', m: 'smiley', t: 'fur' },
      { c: '#7cc8ff', p: 'stars' }, { c: '#fbe6f4', m: 'unicorn', t: 'glitter', n: 'Unicorn Shine Puffer' },
    ],
  },
  {
    key: 'parka', name: 'Fur Hood Parka', group: 'Parkas', hem: 'coat', gap: 0, out: 3, flare: 6, sleeve: 'puffer', cuff: 'fur', hood: true, spot: 'none', tags: ['winter'], premium: 20,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = `<rect x="-5" y="${f(b.shY + 4)}" width="10" height="${f(hem - b.shY - 3)}" rx="3" fill="${dark(x.c, 0.08)}"/>`;
      for (let y = b.shY + 22; y < hem - 6; y += 18) s += circ(0, y, 2.2, '#d9dbe6', `stroke="${dark(x.c, 0.3)}" stroke-width="0.6"`);
      const wy = b.waistY + 2;
      s += P(`M${f(-k.sx(wy))} ${f(wy)} Q0 ${f(wy + 5)} ${f(k.sx(wy))} ${f(wy)}`, 'none', stroke(dark(x.c, 0.25), 1.6, 0.8));
      s += line(-10, wy + 3, -12, wy + 14, '#fffaf5', 1.4) + line(10, wy + 3, 12, wy + 14, '#fffaf5', 1.4) + circ(-12, wy + 15, 2.6, k.a) + circ(12, wy + 15, 2.6, k.a);
      if (!seated(x)) for (const sd of [-1, 1]) s += flapPocket(sd * (k.sx(b.hipY + 10) * 0.55), b.hipY + 8, 18, 16, x.c);
      if (k.v.m) s += patch(k.v.m, -14, chestY(b) + 2, 7.5, light(x.c, 0.7));
      s += fluffRow(-b.shW - 1, b.shW + 1, b.shY + 4, 7.5, '#fffaf5') + fluffRow(-b.shW + 10, b.shW - 10, b.shY + 11, 6, '#f6ece0') + circ(-6, b.shY + 13, 2, '#ffffff', 'opacity="0.7"');
      return s;
    },
    vars: [
      { c: '#ff9ec7', m: 'snowflake', n: 'Snowflake Parka' }, { c: '#9fd6ff' }, { c: '#c9a27e', m: 'bear' }, { c: '#7a8a5a', n: 'Olive Fur Hood Parka' }, { c: '#3f4f9a', m: 'planet', n: 'Navy Fur Hood Parka' },
      { c: '#c99bff', m: 'star' }, { c: '#ff8a3d', m: 'bolt', n: 'Orange Fur Hood Parka' }, { c: '#5fd3b5', p: 'stars', t: 'glitter' },
    ],
  },
  {
    key: 'rain', name: 'Raincoat', group: 'Raincoats', hem: 'coat', gap: 0, out: 1, flare: 12, sleeve: 'long', spot: 'scatter', hood: true, tags: ['spring'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const y = b.shY;
      let s = P(`M${f(-b.shW + 4)} ${f(y + 6)} Q${f(-b.shW + 2)} ${f(y + 20)} -12 ${f(y + 22)} L0 ${f(y + 16)} L12 ${f(y + 22)} Q${f(b.shW - 2)} ${f(y + 20)} ${f(b.shW - 4)} ${f(y + 6)} L12 ${f(y)} L-12 ${f(y)}Z`, dark(x.c, 0.08));
      s += line(0, y + 16, 0, hem, dark(x.c, 0.22), 1.8);
      for (let i = 0; i < 4; i++) s += btn(6, y + 28 + ((hem - y - 44) * i) / 3, 3, k.a);
      s += shine(-k.sx(y + 30) * 0.6, y + 28, -k.sx(hem) * 0.55, hem - 8, 3.5, 0.32) + shine(k.sx(y + 30) * 0.7, y + 30, k.sx(hem) * 0.75, hem - 20, 2, 0.25);
      s += band(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 5, 6, dark(x.c, 0.1));
      return s;
    },
    armDeco: (x) => shine(-x.b.armW * 0.25, 8, -x.b.armW * 0.25, x.b.armLen * 0.6, 2.4, 0.3),
    vars: [
      { c: '#ffd84a', m: 'cloud' }, { c: '#ff9ec7', m: 'heart' }, { c: '#9fd6ff', m: 'rainbow' }, { c: '#a8e6cf', m: 'butterfly' },
      { c: '#c99bff', m: 'star', t: 'pins' }, { c: '#ff7a6b', p: 'dots', t: 'bow' },
    ],
  },
  {
    key: 'trench', name: 'Trench Coat', group: 'Trench Coats', hem: 'coat', gap: 3, out: 1, flare: 8, sleeve: 'long', spot: 'none', tags: ['fall', 'spring'], premium: 10,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const wy = b.waistY - 2;
      let s = '';
      for (const sd of [-1, 1]) s += lapel(x, sd, k.gap, chestY(b) + 6, light(x.c, 0.12));
      s += P(`M-2 ${f(b.shY + 22)} L${f(-k.sx(chestY(b)) + 6)} ${f(b.shY + 24)} L${f(-k.sx(chestY(b)) + 8)} ${f(chestY(b) + 10)} L-2 ${f(chestY(b) + 12)}Z`, dark(x.c, 0.06), 'opacity="0.8"');
      for (const bx of [-10, 10]) for (const by of [chestY(b) + 18, wy + 18]) if (by < hem - 6) s += btn(bx, by, 2.8, dark(x.c, 0.35));
      s += band(-k.sx(wy) - 1, k.sx(wy) + 1, wy, 8, dark(x.c, 0.15));
      s += `<rect x="6" y="${f(wy - 2)}" width="10" height="12" rx="2" fill="none" stroke="#e7c97a" stroke-width="2"/>` + P(`M14 ${f(wy + 6)} L20 ${f(wy + 22)} L25 ${f(wy + 20)} L18 ${f(wy + 5)}Z`, dark(x.c, 0.15));
      if (k.v.m) s += circ(-13, chestY(b) + 6, 6, '#ffffff') + motif(k.v.m, -13, chestY(b) + 6, 5.2);
      return s;
    },
    armDeco: (x) => `<rect x="-8" y="-6" width="16" height="6" rx="3" fill="${dark(x.c, 0.12)}"/>` + circ(5, -3, 1.6, dark(x.c, 0.4)) + band(-x.b.armW / 2 - 4.5, x.b.armW / 2 + 4.5, x.b.armLen - 24, 5, dark(x.c, 0.15)),
    vars: [
      { c: '#d9b48a' }, { c: '#f4c6c6', m: 'heart' }, { c: '#c8e0c0', m: 'daisy' }, { c: '#d9c8f0', p: 'check' }, { c: '#f4ead9', m: 'ribbon', t: 'pins' },
    ],
  },
  {
    key: 'jean', name: 'Patch Denim', group: 'Denim Jackets', hem: 'hip', gap: 5, sleeve: 'long', spot: 'none', tags: ['spring', 'fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const st = light(x.c, 0.45);
      let s = '';
      for (const sd of [-1, 1] as const) {
        s += P(`M${f(sd * 3)} ${f(b.shY + 3)} L${f(sd * 26)} ${f(b.shY)} L${f(sd * 13)} ${f(b.shY + 24)}Z`, light(x.c, 0.15), `stroke="${dark(x.c, 0.12)}" stroke-width="0.8"`);
        s += stitch(`M${f(sd * (k.gap + 3))} ${f(b.shY + 10)} L${f(sd * (k.gap + 3))} ${f(hem - 2)}`, st);
        s += stitch(`M${f(sd * (k.gap + 2))} ${f(chestY(b) - 14)} L${f(sd * (k.sx(chestY(b)) - 2))} ${f(chestY(b) - 18)}`, st);
        s += flapPocket(sd * (k.gap + 13), chestY(b) - 8, 15, 14, x.c, '#c9a24a');
        s += band(sd < 0 ? -k.sx(hem) : k.gap, sd < 0 ? -k.gap : k.sx(hem), hem - 8, 9, dark(x.c, 0.1)) + btn(sd * (k.gap + 4), hem - 3.5, 2.4, '#c9a24a');
      }
      const ms = [k.v.m ?? 'star', ...(k.v.ms ?? ['heart', 'rainbow'])];
      s += patch(ms[0], -(k.gap + 16), b.waistY + 8, 8, '#ffffff');
      s += patch(ms[1], k.gap + 18, b.waistY + 14, 7, '#fff3d6');
      return s;
    },
    armDeco: (x, side, k) => (side === -1 ? patch((k.v.ms ?? ['heart', 'rainbow'])[1] ?? 'rainbow', 0, x.b.armLen * 0.34, 6.5, '#ffe6ef') : stitch(`M0 6 L0 ${f(x.b.armLen - 16)}`, light(x.c, 0.45))),
    cuffColor: (c) => dark(c, 0.12),
    vars: [
      { c: '#6f9be0', m: 'strawberry', ms: ['smiley', 'rainbow'] }, { c: '#9cc0ef', m: 'butterfly', ms: ['daisy', 'heart'] }, { c: '#f4a3c0', m: 'cherry', ms: ['heart', 'star'] },
      { c: '#4a6fb5', m: 'planet', ms: ['bolt', 'moon'] }, { c: '#b9a3e8', m: 'unicorn', ms: ['gem', 'rainbow'] }, { c: '#f4f4fa', m: 'avocado', ms: ['donut', 'icecream'], t: 'glitter' },
    ],
  },
  {
    key: 'flannel', name: 'Flannel', group: 'Flannel Overshirts', hem: 'long', gap: 7, flare: 2, sleeve: 'long', spot: 'none', tags: ['fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const c2 = k.v.c2 ?? dark(x.c, 0.4);
      let s = '';
      for (const sd of [-1, 1] as const) {
        s += plaid(x, k, sd, c2);
        s += P(`M${f(sd * 2)} ${f(b.shY + 1)} L${f(sd * 22)} ${f(b.shY - 1)} L${f(sd * 15)} ${f(b.shY + 16)} L${f(sd * (k.gap + 1))} ${f(b.shY + 8)}Z`, x.c, `stroke="${dark(x.c, 0.2)}" stroke-width="0.8"`);
        s += flapPocket(sd * (k.gap + 11), chestY(b) - 6, 14, 13, x.c, '#f4ead9');
      }
      s += rr(-k.gap - 5, b.shY + 6, 5, hem - b.shY - 4, 1.5, dark(x.c, 0.06));
      for (let i = 0; i < 5; i++) s += btn(-k.gap - 2.5, b.shY + 18 + ((hem - b.shY - 28) * i) / 4, 2.2, '#f4ead9');
      if (k.v.m) s += patch(k.v.m, k.gap + 11, b.waistY + 10, 6.5, '#fff3d6');
      return s;
    },
    armDeco: (x, _s, k) => {
      const c2 = k.v.c2 ?? dark(x.c, 0.4);
      const w = x.b.armW / 2 + 4.5;
      let s = rr(-3, 2, 6, x.b.armLen - 16, 0, c2, 'opacity="0.42"');
      for (let y = 10; y < x.b.armLen - 16; y += 14) s += rr(-w, y, w * 2, 6, 0, c2, 'opacity="0.42"') + rr(-w, y + 2.6, w * 2, 0.9, 0, '#ffffff', 'opacity="0.35"');
      return s;
    },
    cuffColor: (c, v) => v.c2 ? dark(c, 0.15) : dark(c, 0.15),
    vars: [
      { c: '#e8384f', c2: '#2d2a3a', n: 'Buffalo Check Flannel' }, { c: '#4f9dff', c2: '#2d2a3a', n: 'Blue Flannel' }, { c: '#3fbf8f', c2: '#3f4f9a', n: 'Forest Flannel' }, { c: '#ffd36b', c2: '#6b6f80', n: 'Sunny Flannel' },
      { c: '#ff9ec7', c2: '#ffffff', n: 'Pink Flannel' }, { c: '#9b6bff', c2: '#2d2a3a', m: 'star', n: 'Grape Flannel' }, { c: '#ffab5e', c2: '#8a5a3c', m: 'leaf', n: 'Pumpkin Flannel' }, { c: '#5fd3b5', c2: '#ffffff', m: 'fish', n: 'Seafoam Flannel' },
    ],
  },
  {
    key: 'varsity', name: 'Varsity Jacket', group: 'Varsity Jackets', hem: 'hip', gap: 0, out: 2, sleeve: 'long', cuff: 'rib', spot: 'none', tags: ['fall'],
    sleeveColor: (_c, v) => v.c2 ?? '#fff6ea',
    cuffColor: (c) => dark(c, 0.15),
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const rc = dark(x.c, 0.15);
      const sc = k.v.c2 ?? '#fff6ea';
      let s = rib(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 10, 11, rc) + band(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 7, 2, sc) + band(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 3.5, 2, sc);
      s += P(`M-18 ${f(b.shY - 1)} Q0 ${f(b.shY + 20)} 18 ${f(b.shY - 1)} L14 ${f(b.shY + 6)} Q0 ${f(b.shY + 26)} -14 ${f(b.shY + 6)}Z`, rc);
      for (let i = 0; i < 5; i++) s += circ(0, b.shY + 22 + ((hem - b.shY - 38) * i) / 4, 2.4, sc, `stroke="${dark(sc, 0.3)}" stroke-width="0.6"`);
      const cy = chestY(b);
      const px = -13;
      if (k.v.num !== undefined) s += circ(px, cy - 2, 10, sc, `stroke="${rc}" stroke-width="2"`) + numText(px, cy - 2, k.v.num, 13, x.c, '#ffffff');
      else if (k.v.m) s += circ(px, cy - 2, 10, sc, `stroke="${rc}" stroke-width="2"`) + motif(k.v.m, px, cy - 2, 9);
      s += pocket(k.sx(b.waistY) * 0.55, b.waistY + 4, 3, 18, rc);
      return s;
    },
    armDeco: (x, _s, k) => band(-x.b.armW / 2 - 4.5, x.b.armW / 2 + 4.5, x.b.armLen - 22, 3, dark(x.c, 0.15)) + band(-x.b.armW / 2 - 4.5, x.b.armW / 2 + 4.5, x.b.armLen - 17.5, 3, dark(x.c, 0.15)) + (k.v.t === 'patches' ? patch('star', 0, x.b.armLen * 0.3, 6, '#fff') : ''),
    vars: [
      { c: '#ff7eb6', m: 'heart' }, { c: '#9b6bff', m: 'star' }, { c: '#5fd3b5', m: 'bolt', n: 'Lightning Varsity' }, { c: '#3f4f9a', m: 'crown', c2: '#ffe9a8', t: 'patches' },
      { c: '#e8384f', m: 'cherry', c2: '#ffffff' }, { c: '#7cc8ff', m: 'planet', c2: '#fff3b0', t: 'pins' },
      { c: '#3f4f9a', num: 7, c2: '#e6e8ef', n: 'Navy No. 7 Varsity' }, { c: '#2d2a3a', num: 23, c2: '#ffd36b', n: 'Black No. 23 Varsity' },
    ],
  },
  {
    key: 'track', name: 'Track Jacket', group: 'Sports Jackets', hem: 'hip', gap: 0, out: 1, sleeve: 'long', cuff: 'rib', spot: 'none', tags: ['spring', 'fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const c2 = k.v.c2 ?? '#ffffff';
      let s = '';
      for (const sd of [-1, 1]) s += P(`M${f(sd * 12)} ${f(b.shY - 0.4)} L${f(sd * (b.shW - 12))} ${f(b.shY - 0.4)} Q${f(sd * (b.shW + 1))} ${f(b.shY)} ${f(sd * (b.shW + 1))} ${f(b.shY + 16)} L${f(sd * (k.sx(chestY(b)) - 4))} ${f(chestY(b) - 6)} Z`, c2, 'opacity="0.95"');
      s += rr(-16, b.shY - 6, 32, 14, 6, c2) + zipLine(0, b.shY + 6, 0, hem);
      s += rib(-k.sx(hem), k.sx(hem), hem - 6, 8, dark(x.c, 0.12));
      const cy = chestY(b) + 4;
      if (k.v.num !== undefined) s += numText(12, cy, k.v.num, 15, c2, dark(x.c, 0.3));
      if (k.v.m) s += circ(12, k.v.num !== undefined ? b.waistY + 12 : cy, 7, c2) + motif(k.v.m, 12, k.v.num !== undefined ? b.waistY + 12 : cy, 5.8);
      s += line(-12, b.waistY + 6, -20, b.waistY + 6, dark(x.c, 0.3), 1.6);
      return s;
    },
    armDeco: (x, side, k) => {
      const c2 = k.v.c2 ?? '#ffffff';
      const ox = side * (x.b.armW / 2 + 1);
      return line(ox, 4, ox, x.b.armLen - 15, c2, 2.4) + line(ox - side * 4, 6, ox - side * 4, x.b.armLen - 15, c2, 2.4);
    },
    vars: [
      { c: '#4f9dff', c2: '#ffffff', num: 10, n: 'Blue No. 10 Track Top' }, { c: '#e8384f', c2: '#ffffff', num: 7, n: 'Red No. 7 Track Top' }, { c: '#3fbf8f', c2: '#ffe680', m: 'star' }, { c: '#2d2a3a', c2: '#ff7a6b', num: 23, n: 'Black No. 23 Track Top' },
      { c: '#ffd36b', c2: '#3f4f9a', num: 9, m: 'star', n: 'Gold Star Track Top' }, { c: '#9b6bff', c2: '#ffffff', m: 'bolt' }, { c: '#ff8a3d', c2: '#ffffff', num: 1, n: 'Orange No. 1 Track Top' },
    ],
  },
  {
    key: 'bomber', name: 'Bomber', group: 'Bomber Jackets', hem: 'hip', gap: 0, out: 2.5, sleeve: 'long', cuff: 'rib', spot: 'none', tags: ['spring', 'fall'],
    cuffColor: (c, v) => v.c2 ?? dark(c, 0.3),
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const rc = k.v.c2 ?? dark(x.c, 0.3);
      let s = '';
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 3; i++) s += line(sd * (8 + i * 9), hem - 18, sd * (9 + i * 9), hem - 10, dark(x.c, 0.18), 1.2, 0.6);
        s += shine(sd * k.sx(b.shY + 26) * 0.66, b.shY + 22, sd * k.sx(b.waistY) * 0.6, b.waistY + 6, k.v.kind === 'satin' ? 3.6 : 2, k.v.kind === 'satin' ? 0.5 : 0.22);
      }
      s += P(`M-17 ${f(b.shY - 3)} Q0 ${f(b.shY + 14)} 17 ${f(b.shY - 3)} L15 ${f(b.shY + 5)} Q0 ${f(b.shY + 20)} -15 ${f(b.shY + 5)}Z`, rc);
      s += rib(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 10, 11, rc) + band(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 6, 1.6, k.a);
      s += zipLine(0, b.shY + 10, 0, hem - 1);
      s += line(-11, b.waistY + 4, -15, b.hipY - 6, dark(x.c, 0.3), 1.8) + line(11, b.waistY + 4, 15, b.hipY - 6, dark(x.c, 0.3), 1.8);
      if (k.v.m) s += circ(-12, chestY(b) + 2, 7.5, light(x.c, 0.6)) + motif(k.v.m, -12, chestY(b) + 2, 6.4);
      return s;
    },
    armDeco: (x, side, k) => (side === -1 ? rr(-6, 12, 12, 10, 2, dark(x.c, 0.08)) + zipLine(-5, 13, 5, 13, '#e4e6ef').replace(/<rect[^>]*\/>$/, '') + rr(3, 11, 3, 5, 1, '#e4e6ef') : '') +
      shine(-x.b.armW * 0.25, 6, -x.b.armW * 0.2, x.b.armLen * 0.6, 2.2, k.v.kind === 'satin' ? 0.45 : 0.2),
    vars: [
      { c: '#7a8a5a', c2: '#3a3f2e', n: 'Olive Bomber' }, { c: '#2d2a3a', c2: '#ff8a3d', n: 'Black Bomber' }, { c: '#3f4f9a', c2: '#e8384f', m: 'star' }, { c: '#a8c8a0', c2: '#5a7a52', n: 'Sage Bomber' },
      { c: '#ffb3c7', c2: '#ff4f8b', m: 'crown', kind: 'satin', n: 'Pink Satin Bomber' }, { c: '#9fd6ff', c2: '#3f4f9a', m: 'planet', kind: 'satin', n: 'Space Satin Bomber' }, { c: '#8a2e4a', c2: '#2d2a3a', m: 'dino', n: 'Dino Bomber' },
    ],
  },
  {
    key: 'blazer', name: 'Blazer', group: 'Blazers', hem: 'hip', gap: 4, sleeve: 'long', spot: 'none', tags: ['fall'],
    deco: (x, k) => {
      const { b } = x;
      const cy = chestY(b);
      let s = '';
      for (const sd of [-1, 1]) s += lapel(x, sd, k.gap, b.waistY - 2, dark(x.c, 0.1));
      s += btn(-k.gap - 4, b.waistY + 4, 3, '#ffd24a') + btn(-k.gap - 4, b.waistY + 16, 3, '#ffd24a');
      for (const sd of [-1, 1]) s += line(sd * (k.gap + 8), b.hipY - 6, sd * (k.gap + 26), b.hipY - 7, dark(x.c, 0.3), 2);
      s += line(k.gap + 6, cy - 4, k.gap + 19, cy - 5, dark(x.c, 0.3), 2) + P(`M${f(k.gap + 7)} ${f(cy - 4)} L${f(k.gap + 10)} ${f(cy - 12)} L${f(k.gap + 13)} ${f(cy - 6)} L${f(k.gap + 16)} ${f(cy - 11)} L${f(k.gap + 18)} ${f(cy - 4.5)}Z`, k.a);
      if (k.v.m) {
        const px = -(k.gap + 10);
        s += P(`M${f(px - 8)} ${f(cy - 12)} L${f(px + 8)} ${f(cy - 12)} L${f(px + 8)} ${f(cy - 2)} Q${f(px + 8)} ${f(cy + 7)} ${f(px)} ${f(cy + 10)} Q${f(px - 8)} ${f(cy + 7)} ${f(px - 8)} ${f(cy - 2)}Z`, '#ffffff', 'stroke="url(#g-gold)" stroke-width="1.6"') + motif(k.v.m, px, cy - 2, 6);
      }
      return s;
    },
    armDeco: (x) => [0, 4.5, 9].map((dy) => circ(x.b.armW / 2 - 1, x.b.armLen - 22 + dy, 1.5, '#ffd24a')).join(''),
    vars: [
      { c: '#ffb3c7', m: 'crown' }, { c: '#e6d4ff', m: 'star' }, { c: '#a8e6cf', m: 'apple' }, { c: '#3f4f9a', p: 'check', m: 'star', n: 'Plaid Blazer' }, { c: '#fff3d6', m: 'note', t: 'pins' },
    ],
  },
  {
    key: 'suit', name: 'Suit Jacket', group: 'Suits & Tuxedos', hem: 'hip', gap: 0, out: 0.5, vee: 11, veeDepth: 1, open: 8, sleeve: 'long', spot: 'none', premium: 10,
    deco: (x, k) => {
      const { b } = x;
      const tux = k.v.kind === 'tux';
      const yv = veeY(b, 1);
      const lc = tux ? (k.v.c2 ?? '#2d2a3a') : dark(x.c, 0.1);
      let s = P(`M-11 ${f(b.shY + 0.6)} L11 ${f(b.shY + 0.6)} L0 ${f(yv + 1)}Z`, '#ffffff');
      for (const sd of [-1, 1]) s += P(`M0 ${f(b.shY + 1)} L${f(sd * 9)} ${f(b.shY - 1)} L${f(sd * 6)} ${f(b.shY + 9)}Z`, '#ffffff', 'stroke="#d9dbe6" stroke-width="0.7"');
      if (tux) for (let i = 0; i < 3; i++) s += circ(0, b.shY + 16 + i * 8, 1.3, '#2d2a3a');
      for (const sd of [-1, 1] as const) {
        s += tux
          ? P(`M${f(sd * 11)} ${f(b.shY + 1)} Q${f(sd * 19)} ${f(b.shY + 4)} ${f(sd * 21)} ${f(b.shY + 18)} Q${f(sd * 18)} ${f(yv - 14)} ${f(sd * 1)} ${f(yv)}Z`, lc, `stroke="${light(lc, 0.25)}" stroke-width="0.8"`) + shine(sd * 15, b.shY + 6, sd * 12, b.shY + 26, 1.6, 0.4)
          : P(`M${f(sd * 11)} ${f(b.shY + 1)} L${f(sd * 18)} ${f(b.shY - 1)} L${f(sd * 22)} ${f(b.shY + 9)} L${f(sd * 17)} ${f(b.shY + 12)} L${f(sd * 23)} ${f(b.shY + 19)} L${f(sd * 1)} ${f(yv)}Z`, lc, `stroke="${dark(x.c, 0.22)}" stroke-width="0.8"`);
        s += line(sd * 8, b.hipY - 4, sd * 24, b.hipY - 5, dark(x.c, 0.3), 2);
      }
      s += btn(0, yv + 6, 3, tux ? lc : dark(x.c, 0.3));
      const cy = chestY(b);
      s += line(12, cy + 2, 25, cy + 1, dark(x.c, 0.3), 2) + P(`M13 ${f(cy + 2)} L15.5 ${f(cy - 5)} L18.5 ${f(cy - 1)} L21 ${f(cy - 5.5)} L23.5 ${f(cy + 1.5)}Z`, tux ? '#ffffff' : k.a);
      if (k.v.m) s += circ(-16, cy + 4, 3.6, 'url(#g-gold)') + motif(k.v.m, -16, cy + 4, 3);
      return s;
    },
    armDeco: (x) => [0, 4.5, 9].map((dy) => circ(x.b.armW / 2 - 1, x.b.armLen - 22 + dy, 1.5, dark(x.c, 0.35))).join(''),
    vars: [
      { c: '#3f4f9a', n: 'Navy Suit Jacket' }, { c: '#6b6f80', n: 'Grey Suit Jacket' }, { c: '#2d2a3a', kind: 'tux', c2: '#1f1c28', t: 'bowtie', n: 'Black Tuxedo' },
      { c: '#ffffff', kind: 'tux', c2: '#2d2a3a', t: 'bowtie', n: 'White Tuxedo' }, { c: '#8a2e4a', kind: 'tux', c2: '#5e1f33', m: 'star', n: 'Velvet Party Tux' }, { c: '#9fd6ff', n: 'Sky Summer Suit' },
      { c: '#7a8a9a', p: 'check', n: 'Plaid Suit Jacket' }, { c: '#f4ead9', m: 'crown', n: 'Linen Suit Jacket' },
    ],
  },
  {
    key: 'moto', name: 'Moto Jacket', group: 'Moto Jackets', hem: 'hip', gap: 0, out: 1, sleeve: 'long', spot: 'none', tags: ['fall'], premium: 10,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const y = b.shY;
      let s = P(`M-3 ${f(y + 3)} L-24 ${f(y)} L-30 ${f(y + 16)} L-22 ${f(y + 20)} L-26 ${f(y + 30)} L-6 ${f(chestY(b) + 10)}Z`, light(x.c, 0.12), `stroke="${dark(x.c, 0.25)}" stroke-width="0.8"`);
      s += P(`M3 ${f(y + 3)} L24 ${f(y)} L30 ${f(y + 16)} L22 ${f(y + 20)} L28 ${f(y + 34)} L10 ${f(chestY(b) + 6)}Z`, light(x.c, 0.12), `stroke="${dark(x.c, 0.25)}" stroke-width="0.8"`);
      s += zipLine(9, chestY(b) + 6, 4, hem, '#e4e6ef');
      s += zipLine(-k.sx(chestY(b)) * 0.75, chestY(b) + 12, -12, chestY(b) + 6, '#e4e6ef');
      s += circ(-24, y + 24, 1.8, '#e4e6ef') + circ(24, y + 26, 1.8, '#e4e6ef');
      s += band(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 8, 8, dark(x.c, 0.1)) + `<rect x="-${f(k.sx(hem) - 8)}" y="${f(hem - 10)}" width="9" height="12" rx="1.5" fill="none" stroke="#e4e6ef" stroke-width="1.8"/>`;
      for (const sd of [-1, 1]) s += shine(sd * k.sx(y + 30) * 0.7, y + 28, sd * k.sx(b.waistY) * 0.65, b.waistY + 10, 3, 0.38);
      if (k.v.m) s += motif(k.v.m, k.sx(b.waistY) * 0.5, b.waistY + 12, 6.5);
      return s;
    },
    armDeco: (x) => shine(-x.b.armW * 0.25, 6, -x.b.armW * 0.2, x.b.armLen * 0.62, 2.6, 0.38) + zipLine(x.b.armW / 2 + 1, x.b.armLen - 24, x.b.armW / 2 + 1, x.b.armLen - 12, '#e4e6ef'),
    vars: [
      { c: '#4a3f5e' }, { c: '#c99bff', m: 'star' }, { c: '#ff9ec7', m: 'heart' }, { c: '#5fd3b5', m: 'bolt', t: 'pins' }, { c: '#2d2a3a', m: 'moon', t: 'glitter', n: 'Midnight Star Moto' },
    ],
  },
  {
    key: 'fur', name: 'Faux Fur Coat', group: 'Fluffy Coats', hem: 'coat', gap: 1, out: 4, flare: 6, sleeve: 'long', cuff: 'fur', spot: 'none', tags: ['winter'], premium: 30, free: 2,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const tuft = light(x.c, 0.22);
      let s = '';
      let j = 0;
      for (let y = b.shY + 16; y < hem - 4; y += 10, j++) {
        for (const sd of [-1, 1]) {
          const x0 = k.gap + 6;
          const x1 = k.sx(y) - 4;
          for (let xx = x0 + (j % 2 ? 5 : 0); xx < x1; xx += 10) s += circ(sd * xx, y, 5.2, tuft, 'opacity="0.45"') + P(`M${f(sd * xx - 3)} ${f(y + 1)} q3 -4 6 -1`, 'none', stroke(dark(x.c, 0.08), 1.1, 0.35));
        }
      }
      const edge = light(x.c, 0.4);
      s += fluffCol(0, b.shY + 6, hem, 6.4, edge);
      s += fluffRow(-k.sx(hem), -k.gap, hem, 5.6, edge) + fluffRow(k.gap, k.sx(hem), hem, 5.6, edge);
      s += fluffRow(-b.shW + 2, -k.gap - 2, b.shY + 2, 6.5, edge) + fluffRow(k.gap + 2, b.shW - 2, b.shY + 2, 6.5, edge);
      if (k.v.m) s += motif(k.v.m, -(k.gap + 11), chestY(b) + 6, 6.5);
      return s;
    },
    armDeco: (x) => {
      let s = '';
      for (let y = 10; y < x.b.armLen - 16; y += 11) s += circ(-3, y, 5, light(x.c, 0.22), 'opacity="0.45"') + circ(5, y + 5, 4.6, light(x.c, 0.22), 'opacity="0.4"');
      return s;
    },
    cuffColor: (c) => light(c, 0.4),
    vars: [
      { c: '#fff7f2', n: 'Snow Fluff Coat' }, { c: '#ffd9e8', n: 'Pink Fluff Coat' }, { c: '#e6d4ff', m: 'gem', t: 'bow' }, { c: '#c9a27e', n: 'Teddy Fluff Coat' }, { c: '#bfe8ff', m: 'snowflake', t: 'glitter', n: 'Snowflake Fur Coat' },
    ],
  },
  {
    key: 'teddy', name: 'Sherpa', group: 'Sherpa Fleece', hem: 'hip', gap: 0, out: 2, sleeve: 'long', cuff: 'rib', spot: 'none', tags: ['fall', 'winter'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const ca = k.v.c2 ?? accentFor(x.c);
      let s = '';
      let j = 0;
      for (let y = b.shY + 10; y < hem - 2; y += 6.5, j++) {
        const w = k.sx(y) - 2;
        for (let xx = -w + (j % 2 ? 3.2 : 0); xx < w; xx += 6.4) s += P(`M${f(xx - 1.8)} ${f(y + 0.6)} q1.8 -3 3.6 0`, 'none', stroke(j % 3 ? light(x.c, 0.3) : dark(x.c, 0.1), 1.3, 0.8));
      }
      s += P(`M-17 ${f(b.shY - 4)} L17 ${f(b.shY - 4)} L19 ${f(b.shY + 10)} Q0 ${f(b.shY + 16)} -19 ${f(b.shY + 10)}Z`, ca);
      s += zipLine(0, b.shY + 4, 0, chestY(b) + 4, '#e4e6ef');
      s += rib(-k.sx(hem) - 1, k.sx(hem) + 1, hem - 6, 8, ca);
      const py = b.waistY - 2;
      const px = k.sx(py) * 0.5;
      s += flapPocket(px, py, 20, 18, ca);
      if (k.v.m) s += motif(k.v.m, px, py + 10, 6.5);
      return s;
    },
    armDeco: (x) => {
      let s = '';
      for (let y = 8; y < x.b.armLen - 16; y += 7) s += P(`M-5 ${f(y)} q1.8 -3 3.6 0 M3 ${f(y + 3.5)} q1.8 -3 3.6 0`, 'none', stroke(light(x.c, 0.3), 1.3, 0.8));
      return s;
    },
    cuffColor: (c, v) => v.c2 ?? accentFor(c),
    vars: [
      { c: '#fff3e4', m: 'bear', c2: '#c9a27e' }, { c: '#c9a27e', m: 'paw', c2: '#fff3e4' }, { c: '#ffd0dc', m: 'bunny', c2: '#ff7eb6' }, { c: '#cdeedd', m: 'dino', c2: '#5fd3b5' }, { c: '#e6d4ff', m: 'panda', c2: '#9b6bff', t: 'pompom' },
    ],
  },
  {
    key: 'cape', name: 'Cape Coat', group: 'Cape Coats', hem: 'long', gap: 0, out: 1, flare: 12, sleeve: 'cape', spot: 'none', tags: ['fall', 'winter'], premium: 15,
    deco: (x, k) => {
      const { b } = x;
      const y = b.shY;
      const cy = chestY(b) + 12;
      const W = b.shW + 7;
      let s = cloth(`M${f(-W + 10)} ${f(y - 1)} L${f(W - 10)} ${f(y - 1)} Q${f(W + 2)} ${f(y)} ${f(W + 2)} ${f(y + 20)} L${f(W + 4)} ${f(cy)} Q0 ${f(cy + 12)} ${f(-W - 4)} ${f(cy)} L${f(-W - 2)} ${f(y + 20)} Q${f(-W - 2)} ${f(y)} ${f(-W + 10)} ${f(y - 1)}Z`, x.c, x.p, 'y');
      s += P(`M${f(-W - 4)} ${f(cy)} Q0 ${f(cy + 12)} ${f(W + 4)} ${f(cy)}`, 'none', stroke(dark(x.c, 0.2), 1.6, 0.7));
      if (k.v.t === 'lace') s += lace(-W - 4, W + 4, cy + 4);
      for (const sd of [-1, 1]) s += P(`M${f(sd * 1)} ${f(y + 1)} Q${f(sd * 20)} ${f(y - 2)} ${f(sd * 21)} ${f(y + 8)} Q${f(sd * 19)} ${f(y + 19)} ${f(sd * 2)} ${f(y + 13)}Z`, '#ffffff', `stroke="${dark(x.c, 0.12)}" stroke-width="0.8"`);
      for (let i = 0; i < 3; i++) s += btn(0, cy + 12 + i * 15, 3.4, k.a);
      if (k.v.m) s += motif(k.v.m, -k.sx(b.waistY) * 0.5, b.waistY + 22, 6.5);
      return s;
    },
    cuffColor: (c) => dark(c, 0.15),
    vars: [
      { c: '#e8384f', t: 'bow', n: 'Red Riding Cape' }, { c: '#ffb3c7', m: 'heart' }, { c: '#9fd6ff', m: 'snowflake' }, { c: '#c99bff', p: 'stars', t: 'lace' }, { c: '#f4ead9', m: 'ribbon', t: 'fur' },
    ],
  },
  {
    key: 'poncho', name: 'Poncho', group: 'Ponchos', hem: 'hip', gap: 0, sleeve: 'poncho', spot: 'none', tags: ['spring', 'fall'],
    shape: (x, k) => {
      const { b } = x;
      const W = b.shW + 12;
      const yS = Math.min(b.waistY + 8, k.hem - 8);
      const yP = Math.max(yS + 12, k.hem + 4);
      const d = `M-13 ${f(b.shY - 1)} L13 ${f(b.shY - 1)} Q${f(b.shW)} ${f(b.shY - 1)} ${f(W - 4)} ${f(b.shY + 14)} L${f(W)} ${f(yS)} L0 ${f(yP)} L${f(-W)} ${f(yS)} L${f(-W + 4)} ${f(b.shY + 14)} Q${f(-b.shW)} ${f(b.shY - 1)} -13 ${f(b.shY - 1)}Z`;
      let s = cloth(d, x.c, x.p, 'y');
      const c2 = k.v.c2 ?? k.a;
      const cols = k.v.c2 === 'rainbow' ? ['#ff7eb6', '#ffd36b', '#7fe0b0', '#7cc8ff'] : [c2, '#ffffff', c2];
      cols.forEach((col, i) => {
        const o = 8 + i * 7;
        s += P(`M${f(-W + 1)} ${f(yS - o)} L0 ${f(yP - o)} L${f(W - 1)} ${f(yS - o)}`, 'none', `stroke="${col}" stroke-width="4" stroke-linejoin="round"`);
      });
      for (let t = 0; t <= 1.0001; t += 1 / 14) {
        for (const sd of [-1, 1]) {
          const px = sd * W * (1 - t);
          const py = yS + (yP - yS) * t;
          s += line(px, py, px, py + 7, light(x.c, 0.15), 1.6);
        }
      }
      s += P(`M-13 ${f(b.shY - 1)} Q0 ${f(b.shY + 10)} 13 ${f(b.shY - 1)}`, 'none', stroke(dark(x.c, 0.15), 3));
      if (k.v.m) s += motif(k.v.m, 0, chestY(b) - 2, 9);
      return s;
    },
    armDeco: (x, _s, k) => {
      const dl = x.b.armLen * 0.6;
      const c2 = k.v.c2 ?? k.a;
      const cols = k.v.c2 === 'rainbow' ? ['#ff7eb6', '#ffd36b', '#7fe0b0', '#7cc8ff'] : [c2, '#ffffff', c2];
      const hw = x.b.armW / 2 + 20;
      return cols.map((col, i) => P(`M${f(-hw)} ${f(dl - 8 - i * 7)} L${f(hw)} ${f(dl - 8 - i * 7)}`, 'none', `stroke="${col}" stroke-width="4"`)).join('');
    },
    vars: [
      { c: '#fff3d6', c2: 'rainbow', n: 'Rainbow Poncho' }, { c: '#ffb3c7', c2: '#ff4f8b', m: 'heart' }, { c: '#a8e6cf', c2: '#3fbf8f', m: 'leaf' },
      { c: '#ffab5e', c2: '#8a5a3c', m: 'sunflower', t: 'pompom' }, { c: '#c99bff', c2: '#ffd36b', m: 'moon' },
    ],
  },
  {
    key: 'vest', name: 'Puffer Vest', group: 'Puffer Vests', hem: 'hip', gap: 0, out: 3, sleeve: 'none', spot: 'chest', tags: ['fall', 'winter'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = '';
      for (let y = b.shY + 22; y < hem - 6; y += 14) s += P(`M${f(-k.sx(y))} ${f(y - 4)} L0 ${f(y + 5)} L${f(k.sx(y))} ${f(y - 4)}`, 'none', stroke(dark(x.c, 0.22), 1.8, 0.7));
      for (let y = b.shY + 12; y < hem - 12; y += 14) for (const sd of [-1, 1]) s += shine(sd * k.sx(y) * 0.66, y + 1, sd * k.sx(y) * 0.3, y + 6, 2, 0.32);
      for (const sd of [-1, 1]) s += P(`M${f(sd * (b.shW + k.out))} ${f(b.shY + 16)} Q${f(sd * (b.shW - 4))} ${f(b.shY + 34)} ${f(sd * (k.sx(b.shY + 48)))} ${f(b.shY + 48)}`, 'none', stroke(dark(x.c, 0.15), 3));
      s += `<rect x="-17" y="${f(b.shY - 4)}" width="34" height="13" rx="6" fill="${dark(x.c, 0.06)}"/>`;
      for (let i = 0; i < 4; i++) s += circ(0, b.shY + 18 + ((hem - b.shY - 26) * i) / 3, 2.3, '#f4f4fa', `stroke="${dark(x.c, 0.3)}" stroke-width="0.7"`);
      return s + line(0, b.shY + 10, 0, hem, dark(x.c, 0.25), 1.2, 0.6) + band(-k.sx(hem), k.sx(hem), hem - 5, 6, dark(x.c, 0.12));
    },
    vars: [
      { c: '#ff9ec7', m: 'heart' }, { c: '#7cc8ff', m: 'cloud' }, { c: '#ffd36b', m: 'sun' }, { c: '#5fd3b5', m: 'leaf', t: 'fur', n: 'Leafy Puffer Vest' }, { c: '#c99bff', p: 'check', t: 'patches', ms: ['star', 'moon'] },
    ],
  },
  {
    key: 'waistcoat', name: 'Waistcoat', group: 'Vests & Waistcoats', hem: 'hip', gap: 0, vee: 10, veeDepth: 0.62, point: true, sleeve: 'none', spot: 'none', tags: ['fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const yv = veeY(b, 0.62);
      let s = '';
      for (const sd of [-1, 1]) {
        s += P(`M${f(sd * 10)} ${f(b.shY + 1)} L${f(sd * 0.5)} ${f(yv)}`, 'none', stroke(dark(x.c, 0.25), 1.6));
        s += line(sd * 8, b.waistY + 8, sd * 20, b.waistY + 7, dark(x.c, 0.3), 2);
        s += P(`M${f(sd * k.sx(hem))} ${f(hem)} L${f(sd * 4)} ${f(hem + 9)}`, 'none', stroke(dark(x.c, 0.25), 1.6));
      }
      const bc = k.v.c2 ?? '#ffd24a';
      for (let i = 0; i < 4; i++) s += btn(0, yv + 6 + ((hem - yv - 8) * i) / 3, 2.4, bc);
      s += line(12, chestY(b) - 2, 20, chestY(b) - 3, dark(x.c, 0.3), 1.8);
      if (k.v.m) s += motif(k.v.m, -14, chestY(b), 4.5);
      return s;
    },
    vars: [
      { c: '#6b6f80', n: 'Grey Waistcoat' }, { c: '#3f4f9a', c2: '#e4e6ef', n: 'Navy Waistcoat' }, { c: '#2d2a3a', n: 'Black Waistcoat' }, { c: '#f4ead9', c2: '#c9a27e', m: 'star', n: 'Cream Waistcoat' },
      { c: '#8a5a3c', p: 'check', n: 'Plaid Waistcoat' },
    ],
  },
  {
    key: 'sweatervest', name: 'Sweater Vest', group: 'Vests & Waistcoats', free: 1, hem: 'hip', gap: 0, vee: 10, veeDepth: 0.55, sleeve: 'none', spot: 'none', tags: ['fall', 'winter'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const yv = veeY(b, 0.55);
      const c2 = k.v.c2 ?? dark(x.c, 0.3);
      let s = '';
      for (let y = yv + 8, j = 0; y < hem - 14; y += 16, j++) {
        for (const dx of [-16, 0, 16]) {
          const cx = dx + (j % 2 ? 8 : 0);
          if (Math.abs(cx) > k.sx(y) - 8) continue;
          s += P(`M${f(cx)} ${f(y - 8)} L${f(cx + 7)} ${f(y)} L${f(cx)} ${f(y + 8)} L${f(cx - 7)} ${f(y)}Z`, c2, 'opacity="0.75"');
        }
        s += P(`M${f(-k.sx(y) + 2)} ${f(y - 8)} L${f(k.sx(y) - 2)} ${f(y + 8)} M${f(k.sx(y) - 2)} ${f(y - 8)} L${f(-k.sx(y) + 2)} ${f(y + 8)}`, 'none', stroke('#ffffff', 0.9, 0.5));
      }
      for (const sd of [-1, 1]) s += P(`M${f(sd * 10.5)} ${f(b.shY + 1)} L0 ${f(yv + 1)}`, 'none', stroke(dark(x.c, 0.1), 4));
      s += rib(-k.sx(hem), k.sx(hem), hem - 8, 9, dark(x.c, 0.08));
      return s;
    },
    vars: [
      { c: '#3f4f9a', c2: '#e8384f', n: 'Navy Argyle Vest' }, { c: '#f4ead9', c2: '#c98a5a', n: 'Cream Argyle Vest' }, { c: '#a8e6cf', c2: '#ffffff', n: 'Mint Argyle Vest' },
    ],
  },
  {
    key: 'wind', name: 'Windbreaker', group: 'Windbreakers', hem: 'hip', gap: 0, out: 2, sleeve: 'long', spot: 'none', tags: ['spring', 'fall'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const c2 = k.v.c2 ?? k.a;
      const ya = chestY(b) + 8;
      const yb = chestY(b) - 8;
      let s = P(`M${f(-k.sx(ya))} ${f(ya)} L${f(k.sx(yb))} ${f(yb)} L${f(k.sx(yb + 9))} ${f(yb + 9)} L${f(-k.sx(ya + 9))} ${f(ya + 9)}Z`, '#ffffff');
      s += P(`M${f(-k.sx(ya + 9))} ${f(ya + 9)} L${f(k.sx(yb + 9))} ${f(yb + 9)} L${f(k.sx(yb + 22))} ${f(yb + 22)} L${f(-k.sx(ya + 22))} ${f(ya + 22)}Z`, c2);
      s += `<rect x="-18" y="${f(b.shY - 6)}" width="36" height="15" rx="6" fill="${c2}"/>`;
      s += zipLine(0, b.shY + 6, 0, hem);
      s += P(`M${f(-k.sx(hem))} ${f(hem - 4)} Q0 ${f(hem + 2)} ${f(k.sx(hem))} ${f(hem - 4)}`, 'none', stroke(dark(x.c, 0.22), 2));
      s += line(-9, hem - 2, -10, hem + 8, '#ffffff', 1.4) + line(9, hem - 2, 10, hem + 8, '#ffffff', 1.4) + circ(-10, hem + 9, 2.2, c2) + circ(10, hem + 9, 2.2, c2);
      if (k.v.m) s += motif(k.v.m, -k.sx(b.waistY) * 0.5, b.waistY + 12, 6);
      return s;
    },
    armDeco: (x, _s, k) => {
      const w = x.b.armW / 2 + 4.5;
      const y = x.b.armLen * 0.3;
      return band(-w, w, y, 8, '#ffffff') + band(-w, w, y + 8, 10, k.v.c2 ?? k.a);
    },
    cuffColor: (_c, v) => v.c2 ?? '#ffffff',
    vars: [
      { c: '#7cc8ff', c2: '#ff7eb6' }, { c: '#c99bff', c2: '#5fd3b5', m: 'bolt' }, { c: '#ffd36b', c2: '#ff7a6b' }, { c: '#5fd3b5', c2: '#9b6bff', m: 'star' }, { c: '#ff9ec7', c2: '#4f9dff', m: 'smiley' },
    ],
  },
  {
    key: 'kimono', name: 'Kimono Cardi', group: 'Kimono Cardigans', hem: 'long', gap: 6, flare: 6, sleeve: 'wide', spot: 'scatter', tags: ['spring', 'summer'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = '';
      for (const sd of [-1, 1] as const) {
        s += P(`M${f(sd * (k.gap - 1))} ${f(b.shY + 4)} L${f(sd * 13)} ${f(b.shY - 1)} L${f(sd * 20)} ${f(b.shY - 1)} L${f(sd * (k.gap + 7))} ${f(b.shY + 12)} L${f(sd * (k.gap + 7))} ${f(hem + 1)} L${f(sd * (k.gap - 1))} ${f(hem + 2)}Z`, k.v.c2 ?? k.a, `stroke="${dark(k.v.c2 ?? k.a, 0.12)}" stroke-width="0.8"`);
      }
      const wy = b.waistY - 4;
      const oc = light(k.v.c2 ?? k.a, 0.45);
      s += band(-k.sx(wy) - 1, k.sx(wy) + 1, wy, 12, oc) + line(-k.sx(wy), wy + 6, k.sx(wy), wy + 6, dark(oc, 0.2), 1.2, 0.6);
      s += `<g transform="translate(${f(-k.gap - 14)} ${f(wy + 6)}) scale(0.38)">${bowG(0, 0, 1, oc)}</g>`;
      return s;
    },
    armDeco: (x, _s, k) => (k.v.m ? motif(k.v.m, 2, x.b.armLen * 0.45, 5.5) + motif(k.v.m, -5, x.b.armLen * 0.2, 4.5) : ''),
    cuffColor: (c, v) => v.c2 ?? accentFor(c),
    vars: [
      { c: '#ffd0dc', m: 'daisy', c2: '#ff7eb6' }, { c: '#a8e6cf', m: 'butterfly', c2: '#ffd36b' }, { c: '#9fd6ff', m: 'fish', c2: '#ffffff' }, { c: '#e6d4ff', m: 'moon', c2: '#9b6bff' }, { c: '#fff3d6', m: 'cherry', c2: '#e8384f' },
    ],
  },
  {
    key: 'bolero', name: 'Bolero', group: 'Boleros', hem: 'bolero', gap: 4, open: 12, sleeve: 'puff', spot: 'none', tags: ['spring', 'summer'],
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      let s = '';
      for (const sd of [-1, 1] as const) {
        const g2 = k.gap + 12;
        const edge = `M${f(sd * k.gap)} ${f(b.shY + 4)} Q${f(sd * (k.gap + 3.2))} ${f((b.shY + hem) / 2 + 6)} ${f(sd * g2)} ${f(hem + 2)} Q${f(sd * (g2 + 10))} ${f(hem + 6)} ${f(sd * (k.sx(hem)))} ${f(hem)}`;
        s += `<path d="${edge}" ${stroke(k.v.t === 'lace' ? '#ffffff' : dark(x.c, 0.12), 3.5)}/>`;
        if (k.v.t === 'ruffle') s += ruffle(sd < 0 ? -k.sx(hem) - 2 : g2 - 2, sd < 0 ? -g2 + 2 : k.sx(hem) + 2, hem + 6, light(x.c, 0.3), 5, 3);
      }
      if (k.v.m) s += motif(k.v.m, -(k.gap + 8), b.shY + 24, 5.5);
      s += `<g transform="translate(0 ${f(b.shY + 10)}) scale(0.36)">${bowG(0, 0, 1, k.a)}</g>`;
      return s;
    },
    vars: [
      { c: '#ffffff', t: 'lace', n: 'Lacy White Bolero' }, { c: '#ffb3c7', m: 'heart', t: 'ruffle' }, { c: '#e6d4ff', p: 'dots' }, { c: '#9fd6ff', m: 'star', t: 'glitter' }, { c: '#fff3b0', m: 'daisy', t: 'ruffle' },
    ],
  },
  {
    key: 'ski', name: 'Ski Jacket', group: 'Ski Jackets', hem: 'hip', gap: 0, out: 4, sleeve: 'puffer', cuff: 'rib', spot: 'none', tags: ['winter'], premium: 15,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const c2 = k.v.c2 ?? '#ffffff';
      const y1 = chestY(b) - 2;
      let s = P(`M${f(-k.sx(y1))} ${f(y1)} L0 ${f(y1 + 14)} L${f(k.sx(y1))} ${f(y1)} L${f(k.sx(y1 + 10))} ${f(y1 + 10)} L0 ${f(y1 + 24)} L${f(-k.sx(y1 + 10))} ${f(y1 + 10)}Z`, c2);
      s += P(`M${f(-k.sx(y1 + 10))} ${f(y1 + 10)} L0 ${f(y1 + 24)} L${f(k.sx(y1 + 10))} ${f(y1 + 10)} L${f(k.sx(y1 + 15))} ${f(y1 + 15)} L0 ${f(y1 + 29)} L${f(-k.sx(y1 + 15))} ${f(y1 + 15)}Z`, k.a);
      s += `<rect x="-20" y="${f(b.shY - 9)}" width="40" height="19" rx="7" fill="${dark(x.c, 0.06)}"/>` + line(-16, b.shY + 1, 16, b.shY + 1, dark(x.c, 0.2), 1.2, 0.6);
      s += zipLine(0, b.shY + 8, 0, hem);
      s += rib(-k.sx(hem), k.sx(hem), hem - 6, 8, dark(x.c, 0.12));
      const tx = -k.sx(b.waistY) * 0.55;
      const ty = b.waistY + 4;
      s += line(tx, ty - 8, tx, ty - 1, '#9aa3b5', 1.2) + `<rect x="${f(tx - 6)}" y="${f(ty - 1)}" width="12" height="15" rx="2" fill="#ffffff" stroke="#9aa3b5" stroke-width="0.8"/>`;
      s += motif(k.v.m ?? 'snowflake', tx, ty + 7, 4.5);
      for (const sd of [-1, 1]) s += shine(sd * k.sx(b.shY + 26) * 0.6, b.shY + 22, sd * k.sx(chestY(b)) * 0.5, chestY(b) - 6, 2.6, 0.3);
      return s;
    },
    armDeco: (x, _s, k) => band(-x.b.armW / 2 - 7, x.b.armW / 2 + 7, x.b.armLen * 0.28, 6, k.v.c2 ?? '#ffffff'),
    vars: [
      { c: '#ff7eb6', c2: '#ffffff', m: 'snowflake' }, { c: '#7cc8ff', c2: '#ffffff', m: 'star' }, { c: '#9b6bff', c2: '#ffe680', m: 'moon' }, { c: '#5fd3b5', c2: '#ffffff', m: 'heart' }, { c: '#ffffff', c2: '#ff9ec7', m: 'snowflake', t: 'fur', n: 'Snow Bunny Ski Coat' },
    ],
  },
  {
    key: 'duffle', name: 'Duffle Coat', group: 'Duffle Coats', hem: 'long', gap: 0, out: 2, flare: 4, sleeve: 'long', hood: true, spot: 'none', tags: ['fall', 'winter'], premium: 10,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const yk = b.shY + 20;
      let s = P(`M${f(-b.shW - k.out)} ${f(b.shY + 14)} Q${f(-b.shW - k.out)} ${f(b.shY - 1)} ${f(-b.shW + 12)} ${f(b.shY - 1)} L${f(b.shW - 12)} ${f(b.shY - 1)} Q${f(b.shW + k.out)} ${f(b.shY - 1)} ${f(b.shW + k.out)} ${f(b.shY + 14)} L${f(k.sx(yk))} ${f(yk)} L${f(-k.sx(yk))} ${f(yk)}Z`, dark(x.c, 0.1));
      s += line(0, b.shY + 4, 0, hem, dark(x.c, 0.25), 1.6, 0.7);
      const tc = k.v.c2 ?? '#fff3d6';
      for (let i = 0; i < 3; i++) s += toggle(2, b.shY + 28 + i * 16, tc, dark(x.c, 0.35));
      if (!seated(x)) for (const sd of [-1, 1]) s += pocket(sd * k.sx(b.hipY) * 0.55, b.hipY - 4, 18, 18, dark(x.c, 0.07));
      if (k.v.m) s += motif(k.v.m, k.sx(b.hipY) * 0.55, b.hipY + 5, 6);
      return s;
    },
    cuffColor: (c) => dark(c, 0.1),
    vars: [
      { c: '#d9b48a' }, { c: '#3f4f9a', c2: '#ffe680', m: 'star' }, { c: '#e8384f', m: 'heart', c2: '#ffffff' }, { c: '#ffb3c7', m: 'bunny' }, { c: '#a8e6cf', p: 'check', c2: '#fff3d6' },
    ],
  },
  {
    key: 'party', name: 'Sequin Jacket', group: 'Party Jackets', hem: 'crop', gap: 6, out: 1, sleeve: 'long', spot: 'none', premium: 30, free: 1,
    deco: (x, k) => {
      const { b } = x;
      const hem = k.hem;
      const cols = [light(x.c, 0.45), dark(x.c, 0.12), '#ffffff', x.c];
      let s = '';
      let j = 0;
      for (let y = b.shY + 6; y < hem; y += 5.5, j++) {
        for (const sd of [-1, 1]) {
          const x1 = k.sx(y) - 2;
          let i = 0;
          for (let xx = k.gap + 3 + (j % 2 ? 2.8 : 0); xx < x1; xx += 5.6, i++) s += circ(sd * xx, y, 2.1, cols[(i + j * 2) % 4], 'opacity="0.85"');
        }
      }
      for (const sd of [-1, 1]) s += P(`M${f(sd * k.gap)} ${f(b.shY + 4)} L${f(sd * k.gap)} ${f(hem + 2)}`, 'none', stroke(dark(x.c, 0.15), 2.5));
      s += twinkle(-k.sx(chestY(b)) * 0.6, chestY(b) - 6, 5, 0) + twinkle(k.sx(chestY(b)) * 0.5, chestY(b) + 6, 4.5, 0.8) + twinkle(-k.sx(b.waistY) * 0.4, b.waistY, 4, 1.5);
      s += P(sparkleD(k.sx(chestY(b)) * 0.55, chestY(b) - 10, 3.5), '#fff8c8');
      if (k.v.m) s += circ(-(k.gap + 10), b.waistY - 6, 6.5, '#ffffff', 'opacity="0.9"') + motif(k.v.m, -(k.gap + 10), b.waistY - 6, 5.5);
      return s;
    },
    armDeco: (x) => {
      let s = '';
      const cols = [light(x.c, 0.45), '#ffffff', dark(x.c, 0.1)];
      let j = 0;
      for (let y = 4; y < x.b.armLen - 16; y += 6, j++) for (let xx = -x.b.armW / 2 - 2 + (j % 2 ? 3 : 0); xx < x.b.armW / 2 + 3; xx += 6) s += circ(xx, y, 2, cols[(j + Math.round(xx)) % 3 < 0 ? 0 : (j + Math.round(xx)) % 3], 'opacity="0.8"');
      return s + twinkle(-3, x.b.armLen * 0.4, 3.5, 0.4);
    },
    vars: [
      { c: '#ffd36b', n: 'Gold Sequin Jacket' }, { c: '#d9dbe6', n: 'Silver Sequin Jacket' }, { c: '#ff9ec7', m: 'heart' }, { c: '#c99bff', m: 'star' }, { c: '#7fe0d0', m: 'gem', n: 'Mermaid Sequin Jacket' },
    ],
  },
];

const PAT_NAMES: Record<string, string> = { dots: 'Polka Dot', stripes: 'Stripy', hearts: 'Heart', stars: 'Starry', check: 'Plaid', flowers: 'Flower' };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const used = new Set<string>();
const usedNames = new Set<string>();

function makeCoat(cut: Cut, v: Var, i: number): WearDef {
  const m = v.m ? MOTIF_BY_ID[v.m] : undefined;
  const nameBase = v.n ?? (v.p ? `${PAT_NAMES[v.p]} ${cut.name}` : m ? `${m.name} ${cut.name}` : `${colorName(v.c)} ${cut.name}`);
  let id = `coat-${cut.key}-${v.p ? v.p : m ? m.id : slug(colorName(v.c))}`;
  if (used.has(id)) id += `-${slug(colorName(v.c))}`;
  while (used.has(id)) id += 'x';
  used.add(id);
  let name = nameBase;
  if (usedNames.has(name)) name = `${colorName(v.c)} ${name}`;
  usedNames.add(name);
  const free = cut.free ?? 3;
  const tags = cut.tags ?? (m?.season ? [m.season] : undefined);
  const out = cut.out ?? 0;
  const ctx = (x: WearCtx): K => {
    const hem = hemOf(x, cut.hem);
    return { a: accentFor(x.c), v, hem, gap: cut.gap, out, sx: (y: number) => sideX(x.b, y, cut.flare ?? 0) + 1 + out };
  };
  return {
    id,
    name,
    slot: 'outer',
    group: cut.group,
    price: i < free ? 0 : Math.min(180, 15 + (i - free) * 8 + (cut.premium ?? 0)),
    color: v.c,
    pattern: v.p ?? 'none',
    tags,
    back: cut.hood ? hoodDown : undefined,
    body: (x) => {
      const k = ctx(x);
      let s = '';
      if (cut.shape) s += cut.shape(x, k);
      else for (const side of [-1, 1] as const) s += cloth(panel(x.b, k.hem, side, cut.gap, cut.flare ?? 0, out, cut.open ?? 0, cut.vee ?? 0, cut.veeDepth ?? 1, cut.point ?? false), x.c, x.p);
      if (cut.deco) s += cut.deco(x, k);
      if (cut.spot) s += motifArt(x, cut.spot, k);
      if (v.t && v.t !== 'none' && !(cut.key === 'bolero' && (v.t === 'lace' || v.t === 'ruffle')) && !(cut.key === 'cape' && v.t === 'lace')) s += trimArt(x, v.t, k);
      return s;
    },
    arm: (x, side) => coatArm(x, cut, ctx(x), side),
  };
}

export const COATS_MORE: WearDef[] = CUTS.flatMap((c) => c.vars.map((v, i) => makeCoat(c, v, i)));
