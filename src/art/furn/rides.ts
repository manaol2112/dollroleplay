// Theme park catalog: rides with moving seats (ferris wheels, carousels, teacups, bumper cars,
// coasters, drop towers, swing rides, swinging ships, water slides, kiddie trains and balloon rides),
// park furniture (booths, carts, gates, fences, lamps, benches...) and the treats and prizes they hand
// out. Floor items sit on their base at (0, 0); wall items are centred on (0, 0). Every function here
// is a pure SVG string builder.
//
// Moving seats: each seat's `anim` (see SeatDef in ./kit) is copied exactly by the art, so a doll
// dropped on a seat rides along with it: same pivot, same dur and the same begin time (-phase).
import type { Season } from '../../types';
import {
  type FurnCat, type FurnDef, type Mount, type SeatDef, C, E, P, R, Ln, box, dark, light, f, glow, motif,
  heartD, starD, sparkleD, flowerG, bowG, stylePrice, artCtx,
} from './kit';

type Art = (c: string, on: boolean) => string;
type Pt = [number, number];

// ---------------- little drawing helpers ----------------
/** Path template: every number is formatted, so no long decimals and no NaN slip in. */
const pd = (s: TemplateStringsArray, ...v: number[]) => s.reduce((a, t, i) => a + t + (i < v.length ? f(v[i]) : ''), '');
const S = (d: string, c: string, w = 3, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (t: string, s: string) => `<g transform="${t}">${s}</g>`;
const at = (x: number, y: number, s = 1) => `translate(${f(x)} ${f(y)})` + (s !== 1 ? ` scale(${s.toFixed(3)})` : '');
const O = (o: number) => `opacity="${o}"`;
const shine = (x: number, y: number, rx: number, ry: number, o = 0.45) => E(x, y, rx, ry, '#fff', O(o));
const txt = (x: number, y: number, s: string, size: number, fill: string, stroke = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" fill="${fill}" text-anchor="middle"${stroke ? ` stroke="${stroke}" stroke-width="${f(size * 0.16)}" paint-order="stroke" stroke-linejoin="round"` : ''}>${s}</text>`;
const INK = '#4a3f5e';
const GOLD = 'url(#g-gold)';
const GLASS = 'url(#g-glass)';
const SHX = 'url(#g-shadeX)';
const SHY = 'url(#g-shadeY)';
const LEAF = '#62c78c';
const WATER = '#8fd3ff';
const RAINBOW = ['#ff7a7a', '#ffab5e', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff'];

const eyes = (x: number, y: number, dx: number, r = 3) =>
  C(x - dx, y, r, INK) + C(x + dx, y, r, INK) + C(x - dx + r * 0.35, y - r * 0.4, r * 0.38, '#fff') + C(x + dx + r * 0.35, y - r * 0.4, r * 0.38, '#fff');
/** A tiny happy face: eyes, smile and rosy cheeks. */
const cute = (x: number, y: number, s = 1) =>
  eyes(x, y, 9 * s, 2.8 * s) + S(pd`M${x - 4 * s} ${y + 5 * s} Q${x} ${y + 9.5 * s} ${x + 4 * s} ${y + 5 * s}`, INK, 1.8 * s) +
  E(x - 15 * s, y + 5 * s, 4.5 * s, 2.6 * s, '#ff8fb0', O(0.75)) + E(x + 15 * s, y + 5 * s, 4.5 * s, 2.6 * s, '#ff8fb0', O(0.75));

// ---------------- SMIL snippets (these match the engine's seat motion exactly) ----------------
const SPL = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
/** Full turn about (cx, cy); dir -1 turns backwards. */
const turn = (cx: number, cy: number, dur: number, dir = 1, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="0 ${f(cx)} ${f(cy)};${360 * dir} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite"/>`;
/** 'rotate' seats: rock -a..a about the pivot. */
const rock = (a: number, cx: number, cy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${f(-a)} ${f(cx)} ${f(cy)};${f(a)} ${f(cx)} ${f(cy)};${f(-a)} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
/** 'bounce' seats: up by amp and back. */
const lift = (amp: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f(-amp)};0 0" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
/** 'sway' seats: left/right by amp. */
const swayA = (amp: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="${f(-amp)} 0;${f(amp)} 0;${f(-amp)} 0" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
const bob = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)};0 0" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
const blink = (dur: number, begin = 0, lo = 0.25, hi = 1) =>
  `<animate attributeName="opacity" values="${hi};${lo};${hi}" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite"/>`;
const A = (anim: string, s: string) => `<g>${anim}${s}</g>`;
/** Wraps art in an animation only while the ride is running. */
const when = (on: boolean, anim: string, s: string) => (on ? A(anim, s) : `<g>${s}</g>`);
/** A light bulb; it twinkles while the ride is on. */
const bulb = (x: number, y: number, r: number, col: string, on: boolean, i = 0) =>
  on ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.2)}" fill="${col}" opacity="0.3">${blink(0.9, (i % 3) * 0.3, 0.05, 0.4)}</circle><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}">${blink(0.9, (i % 3) * 0.3, 0.45)}</circle>`
    : C(x, y, r, col) + C(x - r * 0.3, y - r * 0.3, r * 0.35, '#fff', O(0.6));
const bulbsAlong = (pts: Pt[], r: number, cols: string[], on: boolean) => pts.map(([x, y], i) => bulb(x, y, r, cols[i % cols.length], on, i)).join('');
/** Scalloped valance hanging from y, from x0 to x1. */
function scallops(x0: number, x1: number, y: number, n: number, depth: number, cols: string[]): string {
  const w = (x1 - x0) / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w;
    s += P(pd`M${x} ${y} L${x + w} ${y} Q${x + w} ${y + depth} ${x + w / 2} ${y + depth} Q${x} ${y + depth} ${x} ${y}Z`, cols[i % cols.length]);
  }
  return s;
}
/** A striped awning roof from x0 to x1, top at y, hanging h. */
function awning(x0: number, x1: number, y: number, h: number, n: number, c1: string, c2: string): string {
  const w = (x1 - x0) / n;
  let s = '';
  for (let i = 0; i < n; i++) s += P(pd`M${x0 + i * w + 6} ${y} L${x0 + (i + 1) * w - 6} ${y} L${x0 + (i + 1) * w} ${y + h} L${x0 + i * w} ${y + h}Z`, i % 2 ? c2 : c1);
  return s + scallops(x0, x1, y + h, n, h * 0.4, [c1, c2]);
}
/** A little flag waving on a pole top. */
const flag = (x: number, y: number, col: string, h = 50, begin = 0) =>
  Ln(x, y, x, y - h, '#9aa3b5', 4) + A(`<animateTransform attributeName="transform" type="skewY" values="0;-8;0" dur="1.6s" begin="${f(-begin)}s" repeatCount="indefinite"/>`, G(at(x, y - h), P('M0 0 L34 8 L0 18Z', col)));
/** Samples a smooth Catmull-Rom curve through pts. */
function smooth(pts: Pt[], seg = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      out.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const polyD = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
const rnd = (n: number) => Math.round(n * 10) / 10;
/** A slide seat that follows the sampled curve, lifted to hip height. */
const pathSeat = (pts: Pt[], lift: number): SeatDef => {
  const path = pts.map(([x, y]) => [Math.round(x), Math.round(y - lift)] as Pt);
  return { x: path[0][0], y: path[0][1], pose: 'slide', path };
};
const candyStripe = (x: number, y: number, w: number, h: number, c1: string, c2: string, n = 6) => {
  let s = R(x, y, w, h, Math.min(w, h) / 2, c1);
  const step = h / n;
  for (let i = 0; i < n; i += 2) s += P(pd`M${x} ${y + i * step + step * 0.6} L${x + w} ${y + i * step} L${x + w} ${y + i * step + step} L${x} ${y + i * step + step * 1.6}Z`, c2);
  return s;
};

// ---------------- themes for each collection ----------------
interface Theme { main: string; alt: string; trim: string; deep: string; metal: string; cols: string[]; motif: string; bulb: string }
const TH: Record<string, Theme> = {
  sweet: { main: '#ff9ec7', alt: '#ffd9e8', trim: '#ffffff', deep: '#e0659b', metal: '#ffffff', cols: ['#ff9ec7', '#ffc2db', '#ff7eb6', '#ffb3d1', '#ff9ec7', '#ffd0e3'], motif: 'heart', bulb: '#fff3a0' },
  rainbow: { main: '#ffd36b', alt: '#7cc8ff', trim: '#ffffff', deep: '#9b6bff', metal: '#ffffff', cols: RAINBOW, motif: 'rainbow', bulb: '#ffffff' },
  candy: { main: '#ff7eb6', alt: '#a8e6cf', trim: '#ffffff', deep: '#e8384f', metal: '#ffffff', cols: ['#ff7eb6', '#a8e6cf', '#fff3b0', '#ffb3c7', '#c99bff', '#7fd6ff'], motif: 'candy', bulb: '#fff3b0' },
  space: { main: '#3f4f9a', alt: '#7a6ad8', trim: '#ffe680', deep: '#262f66', metal: '#c9cfdd', cols: ['#7a6ad8', '#5ab0ef', '#3fd0c9', '#ff7eb6', '#ffb84a', '#9b8cff'], motif: 'planet', bulb: '#8ff3ff' },
  princess: { main: '#ffc7dc', alt: '#e8d4ff', trim: '#ffd24a', deep: '#e89bbd', metal: GOLD, cols: ['#ffc7dc', '#e8d4ff', '#fff3f8', '#ffd9a8', '#c7ecff', '#ffd9e8'], motif: 'crown', bulb: '#fff6c8' },
  beach: { main: '#5ab0ef', alt: '#fff3d6', trim: '#ffffff', deep: '#2f7fc0', metal: '#ffffff', cols: ['#5ab0ef', '#ffd36b', '#ff7a6b', '#7fe0b0'], motif: 'fish', bulb: '#ffffff' },
  woodland: { main: '#8fbf6a', alt: '#ffab5e', trim: '#f4ead9', deep: '#5c8a45', metal: '#a86b4a', cols: ['#c98a5a', '#8fbf6a', '#ffab5e', '#a86b4a'], motif: 'leaf', bulb: '#fff3b0' },
  retro: { main: '#ff7a6b', alt: '#5fd3b5', trim: '#ffd36b', deep: '#d9534a', metal: '#c9cfdd', cols: ['#ff7a6b', '#5fd3b5', '#ffd36b', '#7cc8ff'], motif: 'star', bulb: '#fff3b0' },
};

// ---------------- catalog builder ----------------
const RIDE_GROUPS = new Set<string>();
function it(id: string, name: string, group: string, style: string, mount: Mount, w: number, h: number, art: Art, extra: Partial<FurnDef> = {}, cat: FurnCat = 'rides'): FurnDef {
  return { id, name, cat, group, style, price: -1, mount, w, h, color: TH[style]?.main ?? '#ff9ec7', art, ...extra };
}
const ride = (group: string) => { RIDE_GROUPS.add(group); return group; };

// =====================================================================================
// FERRIS WHEELS: 'wheel' seats. The wheel turns about its hub and each cabin turns back about the
// rider's hip, exactly like the engine moves a seated doll, so cabin and doll stay together.
// =====================================================================================
const FW = { cx: 0, cy: -290, r: 180, n: 6, dur: 24 };
const FW_PINS: Pt[] = Array.from({ length: FW.n }, (_, i) => {
  const a = ((-90 + (i * 360) / FW.n) * Math.PI) / 180;
  return [rnd(FW.cx + FW.r * Math.cos(a)), rnd(FW.cy + FW.r * Math.sin(a))];
});
type Cabin = 'heart' | 'rainbow' | 'candy' | 'ufo' | 'carriage';
function cabinBack(kind: Cabin, col: string, th: Theme): string {
  let s = Ln(0, 0, 0, -14, th.metal === GOLD ? '#e8b83a' : dark(col, 0.3), 5);
  if (kind === 'ufo') return s + E(0, -52, 60, 66, '#dff3ff', O(0.55)) + E(0, -52, 60, 66, GLASS) + E(-22, -84, 12, 20, '#fff', O(0.5)) + C(0, -122, 6, th.trim) + Ln(0, -118, 0, -112, th.trim, 3);
  if (kind === 'carriage') return s + box(-54, -98, 108, 100, 40, col) + P('M-40 -98 Q0 -132 40 -98Z', th.trim) + P(pd`M-14 -112 L-14 -130 L-6 -120 L0 -134 L6 -120 L14 -130 L14 -112Z`, GOLD) + C(0, -60, 22, '#fff', O(0.5));
  s += box(-52, -88, 104, 92, 22, col) + shine(-30, -66, 8, 18, 0.3);
  if (kind === 'candy') return s + P('M-62 -88 Q-31 -118 0 -88 Q31 -118 62 -88Z', '#fff') + S('M-62 -88 Q-31 -118 0 -88 Q31 -118 62 -88', th.deep, 4) + C(0, -112, 9, th.deep) + C(0, -112, 4, '#fff');
  if (kind === 'rainbow') return s + E(-24, -96, 24, 14, '#fff') + E(4, -102, 26, 16, '#fff') + E(28, -94, 20, 12, '#fff');
  return s + scallops(-60, 60, -92, 4, 16, ['#fff', th.alt]) + R(-60, -98, 120, 10, 5, '#fff') + P(heartD(0, -104, 11), th.deep);
}
function cabinFront(kind: Cabin, col: string, th: Theme): string {
  if (kind === 'ufo') {
    return E(0, 16, 84, 26, col) + E(0, 16, 84, 26, SHY, O(0.6)) + E(0, 6, 70, 12, light(col, 0.25)) +
      [-56, -28, 0, 28, 56].map((x, i) => C(x, 22, 5, i % 2 ? th.trim : '#8ff3ff')).join('') + P('M-30 36 L-40 52 L-20 40Z M30 36 L40 52 L20 40Z', dark(col, 0.2));
  }
  if (kind === 'carriage') {
    return P('M-64 -8 Q-64 58 0 58 Q64 58 64 -8Z', col) + P('M-64 -8 Q-64 58 0 58 Q64 58 64 -8Z', SHX) + R(-68, -14, 136, 12, 6, GOLD) +
      S('M-40 10 Q-30 30 -10 22 M40 10 Q30 30 10 22', '#e8b83a', 3) + motif('crown', 0, 26, 13) + C(-50, 56, 9, GOLD) + C(50, 56, 9, GOLD);
  }
  let s = P('M-62 -8 L62 -8 L56 44 Q54 58 40 58 L-40 58 Q-54 58 -56 44Z', col) + P('M-62 -8 L62 -8 L56 44 Q54 58 40 58 L-40 58 Q-54 58 -56 44Z', SHX);
  if (kind === 'candy') s += [-40, -10, 20, 50].map((x) => P(pd`M${x} -8 L${x + 14} -8 L${x - 6} 58 L${x - 20} 58Z`, '#fff', O(0.7))).join('') + R(-66, -14, 132, 12, 6, th.deep);
  else s += R(-66, -14, 132, 12, 6, th.trim) + R(-56, 36, 112, 6, 3, '#fff', O(0.4));
  return s + C(0, 22, 16, '#fff') + (kind === 'rainbow' ? motif('rainbow', 0, 22, 13) : P(heartD(0, 14, 11), th.deep));
}
function ferris(style: string, name: string, kind: Cabin): FurnDef {
  const th = TH[style];
  const { cx, cy, dur } = FW;
  const colOf = (c: string, i: number) => (kind === 'heart' ? (i % 2 ? light(c, 0.3) : c) : kind === 'carriage' ? (i % 2 ? c : th.alt) : th.cols[i % th.cols.length]);
  const spin = (on: boolean, s: string) => (on ? A(turn(cx, cy, dur), s) : `<g>${s}</g>`);
  const cabins = (c: string, on: boolean, part: (k: Cabin, col: string, th: Theme) => string) =>
    FW_PINS.map(([x, y], i) => (on ? A(turn(x, y, dur, -1), G(at(x, y), part(kind, colOf(c, i), th))) : G(at(x, y), part(kind, colOf(c, i), th)))).join('');
  return it(`f-ferriswheel-${style}`, name, ride('Ferris Wheels'), style, 'floor', 600, 560, (c, on) => ferrisArt(c, on, style, kind, colOf), {
    front: (c, on) => spin(on, cabins(c, on, cabinFront)),
    seats: FW_PINS.map(([x, y]) => ({ x, y, pose: 'sit' as const, anim: { pivot: [cx, cy] as Pt, amp: 1, dur, kind: 'wheel' as const } })),
    animWhenUsed: true,
  });
}
function ferrisArt(c: string, on: boolean, style: string, kind: Cabin, colOf: (c: string, i: number) => string): string {
  const th = TH[style];
  const { cx, cy, r, dur } = FW;
  const leg = style === 'space' ? '#9aa3b5' : style === 'princess' ? '#fff3f8' : dark(c, 0.2);
  let s = '';
  if (style === 'space') for (const [x, y, z] of [[-230, -470, 12], [220, -510, 9], [-260, -250, 8], [250, -300, 10]]) s += P(sparkleD(x, y, z), th.trim);
  // A-frame legs and brace
  s += Ln(-170, -18, cx, cy, leg, 20) + Ln(170, -18, cx, cy, leg, 20) + Ln(-112, -110, 112, -110, leg, 10);
  s += Ln(-170, -18, cx, cy, '#fff', 5, O(0.3)) + Ln(170, -18, cx, cy, '#fff', 5, O(0.3));
  // the rim, spokes and lights
  let w = '';
  if (style === 'rainbow') w += RAINBOW.map((col, i) => C(cx, cy, r + 12 - i * 5, 'none', `stroke="${col}" stroke-width="5.5"`)).join('');
  else if (style === 'candy') w += C(cx, cy, r, 'none', 'stroke="#fff" stroke-width="14"') + C(cx, cy, r, 'none', `stroke="${th.deep}" stroke-width="14" stroke-dasharray="20 20"`);
  else w += C(cx, cy, r, 'none', `stroke="${style === 'space' ? '#8ff3ff' : style === 'princess' ? '#ffd24a' : c}" stroke-width="12"`);
  w += C(cx, cy, r - 32, 'none', `stroke="${style === 'space' ? th.alt : style === 'candy' ? '#a8e6cf' : style === 'princess' ? '#ffe9a8' : light(c, 0.35)}" stroke-width="5"`);
  const spoke = style === 'princess' ? '#ffd24a' : style === 'space' ? '#c9cfdd' : '#fff';
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    w += Ln(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a), spoke, 4);
  }
  for (let i = 0; i < 12; i++) {
    const a = ((i * 30 + 15) * Math.PI) / 180;
    const [x, y] = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    if (style === 'space') w += on ? A(blink(1, i * 0.25, 0.2), P(starD(x, y, 9), th.trim)) : P(starD(x, y, 9), th.trim);
    else if (style === 'sweet') w += on ? A(blink(1.2, (i % 2) * 0.6, 0.35), P(heartD(x, y - 6, 8), '#fff')) : P(heartD(x, y - 6, 8), '#fff');
    else w += bulb(x, y, 5.5, i % 2 ? th.bulb : '#fff', on, i);
  }
  // hub
  w += C(cx, cy, 36, style === 'space' ? th.deep : '#fff') + C(cx, cy, 28, style === 'princess' ? GOLD : style === 'candy' ? th.deep : th.alt);
  if (style === 'candy') w += S(pd`M${cx} ${cy} m-4 0 a4 4 0 1 1 8 0 a9 9 0 1 1 -18 0 a14 14 0 1 1 28 0 a19 19 0 1 1 -38 0`, '#fff', 4);
  else w += motif(style === 'sweet' ? 'heart' : th.motif, cx, cy, 20);
  // cabins ride on the rim and turn back so they stay upright
  for (let i = 0; i < FW_PINS.length; i++) {
    const [x, y] = FW_PINS[i];
    const cab = G(at(x, y), cabinBack(kind, colOf(c, i), th));
    w += on ? A(turn(x, y, dur, -1), cab) : cab;
  }
  s += on ? A(turn(cx, cy, dur), w) : `<g>${w}</g>`;
  s += C(cx, cy, 10, style === 'space' ? th.trim : '#fff') + C(cx, cy, 5, dark(leg, 0.2));
  // platform with steps and a sign
  s += box(-200, -34, 400, 34, 10, style === 'space' ? th.deep : light(c, 0.15), 'none', 'y') + R(-200, -34, 400, 8, 4, '#fff', O(0.35));
  s += bulbsAlong([-170, -120, -70, 70, 120, 170].map((x) => [x, -17] as Pt), 4, [th.bulb, '#fff'], on);
  if (style === 'princess') s += flagPair(-200, -34, th) + flagPair(200, -34, th);
  return s;
}
const flagPair = (x: number, y: number, th: Theme) => flag(x, y, th.deep, 60) + C(x, y - 62, 5, GOLD);

// =====================================================================================
// CAROUSELS: 'bounce' seats; each horse goes up and down its pole with its own phase.
// =====================================================================================
type Mount2 = 'horse' | 'pony' | 'candyHorse' | 'rocket' | 'unicorn';
const CR = { y: -210, amp: 40, dur: 2.4, xs: [-200, 0, 200], ph: [0, 0.8, 1.6] };
/** A horse (or rocket) with its saddle at (0, 0), facing right. */
function steed(kind: Mount2, col: string, th: Theme): string {
  if (kind === 'rocket') {
    return P('M-80 14 Q-80 -14 -40 -18 L50 -18 Q100 -12 112 6 Q100 24 50 30 L-40 30 Q-80 28 -80 14Z', col) + P('M-80 14 Q-80 -14 -40 -18 L50 -18 Q100 -12 112 6 Q100 24 50 30 L-40 30 Q-80 28 -80 14Z', SHY, O(0.5)) +
      P('M-60 -16 L-92 -46 L-30 -18Z M-60 28 L-92 58 L-30 30Z', th.trim) + C(64, 4, 13, '#fff') + C(64, 4, 9, '#8ff3ff') + C(64, 4, 9, GLASS) + R(-24, -8, 50, 12, 6, '#fff', O(0.5)) +
      `<g transform="translate(-84 6)"><g>${'<animateTransform attributeName="transform" type="scale" values="1 1;1.25 0.85;1 1" dur="0.35s" repeatCount="indefinite"/>'}${P('M0 -12 L-34 0 L0 12Z', '#ffab3d')}${P('M0 -6 L-18 0 L0 6Z', '#ffe680')}</g></g>` + R(-26, -8, 52, 10, 5, th.trim);
  }
  const mane = kind === 'unicorn' ? RAINBOW : kind === 'pony' ? [dark(col, 0.3)] : kind === 'candyHorse' ? ['#fff', th.deep] : [th.deep];
  const body = kind === 'candyHorse' ? '#fff' : col;
  let s = '';
  // legs (prancing), tail, body, neck and head
  s += S('M-38 34 L-58 62 L-50 88', dark(body, 0.12), 14) + S('M40 34 L66 52 L60 78', dark(body, 0.12), 14);
  s += S('M-30 36 L-38 92', body, 14) + S('M30 36 L42 70 L34 92', body, 14);
  for (const [x, y] of [[-38, 92], [34, 92], [-50, 88], [60, 78]] as Pt[]) s += E(x, y + 2, 9, 6, th.metal === GOLD ? '#e8b83a' : INK);
  s += P('M-58 4 Q-96 6 -92 54 Q-82 30 -64 22Z', mane[0]) + (mane.length > 1 ? P('M-62 10 Q-86 18 -84 42 Q-76 26 -64 22Z', mane[1 % mane.length]) : '');
  s += E(0, 18, 64, 30, body) + E(0, 18, 64, 30, SHY, O(0.45));
  if (kind === 'candyHorse') for (const x of [-40, -10, 20, 50]) s += P(pd`M${x} -10 L${x + 12} -10 L${x - 6} 46 L${x - 18} 46Z`, th.deep, O(0.75));
  s += P('M34 4 Q46 -40 70 -62 L96 -48 Q74 -24 62 22Z', body) + E(86, -60, 30, 19, body, 'transform="rotate(24 86 -60)"');
  s += E(106, -50, 11, 9, light(body, 0.25)) + C(110, -52, 2, INK) + C(84, -66, 3.6, INK) + C(85, -67, 1.2, '#fff') + E(92, -56, 6, 3.5, '#ff8fb0', O(0.7));
  s += P('M68 -78 L72 -96 L80 -76Z', body) + P('M71 -80 L73 -90 L77 -79Z', '#ff9ec7');
  if (kind === 'unicorn') s += P('M80 -82 L94 -122 L90 -78Z', GOLD) + S('M84 -92 L91 -94 M86 -102 L92 -104', '#fff', 1.5);
  for (let i = 0; i < 4; i++) s += E(46 + i * 7, -40 - i * 11, 12, 8, mane[i % mane.length], `transform="rotate(-40 ${46 + i * 7} ${-40 - i * 11})"`);
  // saddle, blanket and reins
  s += P('M-34 -2 Q-36 30 -20 34 L20 34 Q36 30 34 -2Z', th.alt) + R(-30, -10, 60, 14, 7, th.deep) + R(-30, -10, 60, 5, 3, '#fff', O(0.4));
  s += S('M100 -46 Q60 -10 28 -6', th.trim === '#ffffff' ? th.deep : th.trim, 2.5) + C(0, 22, 7, th.trim === '#ffffff' ? '#ffd24a' : th.trim);
  return s;
}
function carousel(style: string, name: string, kind: Mount2): FurnDef {
  const th = TH[style];
  const cols = (c: string) => (style === 'rainbow' ? RAINBOW : style === 'space' ? th.cols : [c, th.alt]);
  const art: Art = (c, on) => {
    const top = -470;
    const c1 = style === 'space' ? th.main : c;
    const c2 = style === 'princess' ? '#fff' : style === 'space' ? th.deep : style === 'rainbow' ? '#fff' : th.trim;
    let s = '';
    // centre drum with mirrors
    s += box(-56, top + 40, 112, 410, 10, style === 'space' ? th.deep : light(c1, 0.25)) + R(-40, top + 80, 80, 300, 30, '#fff', O(0.35));
    for (let i = 0; i < 3; i++) s += R(-26, top + 100 + i * 96, 52, 70, 26, '#e8f6ff') + R(-26, top + 100 + i * 96, 52, 70, 26, GLASS) + motif(th.motif === 'planet' ? 'star' : th.motif, 0, top + 135 + i * 96, 13);
    // two smaller horses behind, then the poles and the riding horses
    for (const [x, ph] of [[-100, 0.4], [100, 1.2]] as Pt[]) {
      const p = R(x - 4, top + 40, 8, 420, 4, th.metal === GOLD ? '#e8c96a' : '#d8dce6', O(0.9));
      s += p + when(on, lift(CR.amp, CR.dur, ph), G(at(x, CR.y - 46, 0.62), steed(kind, light(cols(c)[1 % cols(c).length], 0.2), th)));
    }
    s += E(0, -48, 300, 26, dark(style === 'space' ? th.deep : c1, 0.25), O(0.25));
    CR.xs.forEach((x, i) => {
      const pole = style === 'candy' ? candyStripe(x - 6, top + 40, 12, 430, '#fff', th.deep, 30) : R(x - 6, top + 40, 12, 430, 6, th.metal) + R(x - 6, top + 40, 4, 430, 2, '#fff', O(0.5));
      s += pole + when(on, lift(CR.amp, CR.dur, CR.ph[i]), G(at(x, CR.y), steed(kind, cols(c)[(i * 2) % cols(c).length], th)));
    });
    // base drum with lights
    s += box(-300, -56, 600, 56, 18, style === 'space' ? th.deep : dark(c1, 0.12), 'none', 'y') + R(-292, -62, 584, 14, 7, light(c1, 0.35));
    s += bulbsAlong(Array.from({ length: 13 }, (_, i) => [-264 + i * 44, -28] as Pt), 5, [th.bulb, '#fff'], on);
    // canopy: cone roof, valance and topper
    const roof = pd`M-318 ${top + 6} L0 ${top - 66} L318 ${top + 6}Z`;
    s += P(roof, c1);
    for (let i = 0; i < 8; i++) {
      const x0 = -318 + i * 79.5;
      if (i % 2) s += P(pd`M${x0} ${top + 6} L0 ${top - 66} L${x0 + 79.5} ${top + 6}Z`, style === 'rainbow' ? RAINBOW[i % 6] : c2, style === 'rainbow' ? '' : O(0.85));
      else if (style === 'rainbow') s += P(pd`M${x0} ${top + 6} L0 ${top - 66} L${x0 + 79.5} ${top + 6}Z`, RAINBOW[i % 6]);
    }
    s += P(pd`M-318 ${top + 6} L0 ${top - 66} L0 ${top + 6}Z`, '#fff', O(0.12));
    s += box(-310, top, 620, 44, 12, style === 'space' ? th.deep : style === 'princess' ? '#fff' : dark(c1, 0.08)) + scallops(-310, 310, top + 44, 10, 22, style === 'rainbow' ? RAINBOW : [c1, c2]);
    if (style === 'space') for (let i = 0; i < 6; i++) s += P(starD(-250 + i * 100, top + 22, 9), th.trim);
    else s += bulbsAlong(Array.from({ length: 12 }, (_, i) => [-280 + i * 51, top + 22] as Pt), 5, [th.bulb, '#fff', style === 'princess' ? '#ffd24a' : th.alt], on);
    if (style === 'princess') s += G(at(0, top - 64), P('M-26 0 L-26 -26 L-13 -12 L0 -34 L13 -12 L26 -26 L26 0Z', GOLD) + C(0, -36, 5, '#ff7eb6'));
    else if (style === 'space') s += G(at(0, top - 72), C(0, 0, 16, th.alt) + E(0, 0, 30, 7, 'none', `stroke="${th.trim}" stroke-width="3"`));
    else s += flag(0, top - 62, style === 'candy' ? th.alt : th.deep, 40) + C(0, top - 64, 8, '#fff');
    return s;
  };
  return it(`f-carousel-${style}`, name, ride('Carousels'), style, 'floor', 640, 550, art, {
    seats: CR.xs.map((x, i) => ({ x, y: CR.y, pose: 'sit' as const, anim: { pivot: [x, CR.y] as Pt, amp: CR.amp, dur: CR.dur, phase: CR.ph[i], kind: 'bounce' as const } })),
    animWhenUsed: true, sfx: 'music',
  });
}

// =====================================================================================
// TEACUPS: small 'wheel' seats; each cup circles its own spot (the middle one backwards).
// =====================================================================================
type Cup = 'heart' | 'rainbow' | 'candy' | 'planet' | 'rose';
const TC = { y: -100, rad: 28, dur: 3, xs: [-200, 0, 200], dirs: [1, -1, 1], ph: [0, 1, 2] };
function cupBack(kind: Cup, col: string): string {
  return E(0, -12, 80, 18, dark(col, 0.12)) + E(0, -10, 72, 13, dark(col, 0.35)) + (kind === 'planet' ? E(0, -14, 116, 16, 'none', `stroke="${light(col, 0.4)}" stroke-width="6" opacity="0.8"`) : '');
}
function cupFront(kind: Cup, col: string, th: Theme): string {
  const bowl = 'M-80 -12 C-80 56 80 56 80 -12 Q0 6 -80 -12Z';
  let s = E(0, 58, 74, 13, kind === 'rose' ? '#fff' : light(col, 0.4)) + E(0, 56, 60, 8, dark(col, 0.08), O(0.4));
  s += S('M78 0 Q118 4 106 36 Q98 50 66 40', kind === 'rose' ? GOLD : dark(col, 0.12), 11);
  s += P(bowl, col) + P(bowl, SHX);
  if (kind === 'candy') for (const [x, y, k] of [[-46, 12, 0], [-14, 28, 1], [20, 14, 2], [50, 24, 3], [0, 4, 4]]) s += C(x, y, 6, th.cols[(k + 1) % th.cols.length]);
  if (kind === 'rainbow') s += P('M-60 34 Q0 50 60 34', 'none', 'stroke="#fff" stroke-width="7" opacity="0.7"');
  if (kind === 'planet') s += S('M-116 -6 Q0 34 116 -6', light(col, 0.4), 7) + P(sparkleD(-40, 18, 7), th.trim) + P(sparkleD(44, 26, 5), '#fff');
  if (kind === 'heart') s += P(heartD(0, 12, 13), '#fff') + C(-48, 14, 5, '#fff', O(0.8)) + C(48, 14, 5, '#fff', O(0.8));
  if (kind === 'rose') s += flowerG(-36, 18, 9, '#ff9ec7') + flowerG(0, 26, 11, '#ffb3c7') + flowerG(36, 18, 9, '#c99bff') + S('M-78 -10 Q0 8 78 -10', GOLD, 4);
  else s += S('M-78 -10 Q0 8 78 -10', '#fff', 4, O(0.8));
  return s + shine(-54, 10, 6, 14, 0.35);
}
function teacups(style: string, name: string, kind: Cup): FurnDef {
  const th = TH[style];
  const colOf = (c: string, i: number) => (kind === 'heart' ? [c, light(c, 0.25), th.deep][i] : kind === 'rose' ? ['#fff3f8', '#ffffff', '#fff3f8'][i] : th.cols[(i * 2 + 1) % th.cols.length]);
  const cupG = (on: boolean, i: number, s: string) => {
    const [x, y] = [TC.xs[i], TC.y];
    const g = G(at(x, y), s);
    return on ? A(turn(x, y + TC.rad, TC.dur, TC.dirs[i], TC.ph[i]), A(turn(x, y, TC.dur, -TC.dirs[i], TC.ph[i]), g)) : g;
  };
  const art: Art = (c, on) => {
    const floor = style === 'space' ? th.deep : style === 'princess' ? '#fff3f8' : light(c, 0.3);
    let s = '';
    // posts and a string of lights
    for (const x of [-300, 300]) s += R(x - 7, -360, 14, 340, 6, style === 'princess' ? '#ffd24a' : th.metal === '#ffffff' ? dark(c, 0.15) : th.metal) + C(x, -366, 12, style === 'space' ? th.trim : th.deep);
    const garland: Pt[] = Array.from({ length: 11 }, (_, i) => [-300 + i * 60, -352 + Math.sin((i / 10) * Math.PI) * 48] as Pt);
    s += S(polyD(smooth(garland, 3)), '#9aa3b5', 2);
    if (style === 'space') s += garland.map(([x, y], i) => (on ? A(blink(1, i * 0.2, 0.3), P(starD(x, y + 10, 10), th.trim)) : P(starD(x, y + 10, 10), th.trim))).join('');
    else s += garland.map(([x, y], i) => P(pd`M${x - 14} ${y} L${x + 14} ${y} L${x} ${y + 28}Z`, th.cols[i % th.cols.length])).join('');
    // the platter
    s += E(0, -18, 310, 36, dark(floor, 0.15)) + E(0, -24, 300, 30, floor) + E(0, -24, 220, 20, light(floor, 0.2), O(0.6));
    if (style === 'rainbow') s += RAINBOW.map((col, i) => E(0, -24, 290 - i * 40, 28 - i * 4, 'none', `stroke="${col}" stroke-width="5" opacity="0.7"`)).join('');
    else s += E(0, -24, 150, 14, 'none', `stroke="${style === 'space' ? th.trim : '#fff'}" stroke-width="4" stroke-dasharray="10 12" opacity="0.8"`);
    s += C(0, -24, 16, style === 'space' ? th.alt : th.deep);
    for (let i = 0; i < 3; i++) s += cupG(on, i, cupBack(kind, colOf(c, i)));
    return s;
  };
  return it(`f-teacups-${style}`, name, ride('Teacups'), style, 'floor', 640, 420, art, {
    front: (c, on) => [0, 1, 2].map((i) => cupG(on, i, cupFront(kind, colOf(c, i), th))).join(''),
    seats: TC.xs.map((x, i) => ({ x, y: TC.y, pose: 'sit' as const, anim: { pivot: [x, TC.y + TC.rad] as Pt, amp: TC.dirs[i], dur: TC.dur, phase: TC.ph[i], kind: 'wheel' as const } })),
    animWhenUsed: true,
  });
}

// =====================================================================================
// BUMPER CARS: 'sway' seats sliding toward each other; the car bodies are drawn in front.
// =====================================================================================
const BC = { y: -100, amp: 70, dur: 3, xs: [-150, 150], ph: [0, 1.5] };
function bumpercars(style: string, name: string): FurnDef {
  const th = TH[style];
  const carCol = (c: string, i: number) => (style === 'sweet' ? [c, '#fff'][i] : style === 'rainbow' ? ['#ffd36b', '#7cc8ff'][i] : style === 'space' ? ['#c9cfdd', th.alt][i] : [c, th.alt][i]);
  const carG = (on: boolean, i: number, s: string) => when(on, swayA(BC.amp, BC.dur, BC.ph[i]), G(at(BC.xs[i], BC.y), s));
  const art: Art = (c, on) => {
    const frame = style === 'space' ? th.deep : style === 'retro' ? '#4a4a5e' : dark(c, 0.15);
    let s = '';
    // posts, electric ceiling and sign
    for (const x of [-312, 312]) s += R(x - 9, -390, 18, 390, 6, frame) + R(x - 9, -390, 6, 390, 3, '#fff', O(0.25));
    s += R(-330, -400, 660, 26, 10, style === 'retro' ? th.trim : c) + R(-320, -376, 640, 8, 3, '#9aa3b5');
    for (let i = 0; i < 16; i++) s += Ln(-300 + i * 40, -376, -300 + i * 40, -368, '#c9cfdd', 2);
    s += box(-130, -446, 260, 50, 16, style === 'space' ? th.alt : '#fff') + txt(0, -411, 'BUMPER CARS', 26, style === 'space' ? '#fff' : th.deep);
    s += bulbsAlong(Array.from({ length: 9 }, (_, i) => [-120 + i * 30, -400] as Pt), 4, [th.bulb, th.alt], on);
    // rink floor and rubber walls
    s += R(-320, -150, 640, 40, 20, style === 'retro' ? th.alt : th.alt, O(0.6)) + R(-320, -126, 640, 10, 5, dark(th.alt, 0.15), O(0.6));
    if (style === 'retro') for (let i = 0; i < 16; i++) s += R(-320 + i * 40, -30, 20, 15, 0, '#2d2a3a') + R(-300 + i * 40, -15, 20, 15, 0, '#2d2a3a');
    s += R(-320, -30, 640, 30, 6, style === 'retro' ? '#fff' : style === 'space' ? th.deep : '#5a5f80', style === 'retro' ? O(0.4) : '');
    if (style === 'space') for (let i = 0; i < 8; i++) s += P(starD(-280 + i * 80, -15, 5), th.trim);
    else if (style !== 'retro') for (let i = 0; i < 8; i++) s += P(sparkleD(-280 + i * 80, -15, 4), '#fff', O(0.5));
    // each car's pole (with sparks) and seat back slide with the car
    for (let i = 0; i < 2; i++) {
      const col = carCol(c, i);
      const spark = on ? A(blink(0.3, i * 0.15, 0), P(sparkleD(-70, -276, 14), '#fff36b')) : '';
      s += carG(on, i, Ln(-70, -10, -70, -272, '#9aa3b5', 5) + spark + C(-70, -272, 5, '#c9cfdd') + box(-82, -78, 72, 82, 20, dark(col, 0.12)) + R(-76, -70, 12, 60, 6, '#fff', O(0.3)));
    }
    return s;
  };
  const car = (i: number, c: string): string => {
    const col = carCol(c, i);
    const body = 'M-100 -6 Q-104 -20 -86 -20 L56 -20 Q92 -20 104 10 L108 40 Q108 56 92 56 L-92 56 Q-108 56 -108 40Z';
    let s = R(-112, 34, 224, 24, 12, style === 'space' ? th.trim : '#3d3a52') + P(body, col) + P(body, SHX) + S('M-92 -12 L56 -12', '#fff', 4, O(0.6));
    s += C(96, 16, 8, '#fff6c8') + Ln(48, -18, 36, -40, '#4a4a5e', 5) + E(32, -44, 18, 6, '#4a4a5e');
    if (style === 'space') s += P('M-108 -2 L-130 -30 L-90 -14Z', th.trim) + C(-40, 18, 14, '#8ff3ff') + C(-40, 18, 14, GLASS) + P(starD(20, 20, 10), th.trim);
    else if (style === 'retro') s += R(-100, 10, 200, 8, 4, '#fff') + C(-20, 20, 16, '#fff') + txt(-20, 27, String(i + 7), 20, th.deep);
    else if (style === 'rainbow') s += motif('rainbow', -20, 22, 16) + motif('star', 40, 22, 10);
    else s += P(heartD(-20, 10, 15), i ? c : '#fff') + C(40, 22, 5, '#fff', O(0.7));
    return s;
  };
  return it(`f-bumpercars-${style}`, name, ride('Bumper Cars'), style, 'floor', 660, 450, art, {
    front: (c, on) => carG(on, 0, car(0, c)) + carG(on, 1, car(1, c)),
    seats: BC.xs.map((x, i) => ({ x, y: BC.y, pose: 'sit' as const, anim: { pivot: [x, BC.y] as Pt, amp: BC.amp, dur: BC.dur, phase: BC.ph[i], kind: 'sway' as const } })),
    animWhenUsed: true,
  });
}

// =====================================================================================
// ROLLER COASTERS: a 'slide' seat; the rider zooms along the track from the station.
// =====================================================================================
const COASTER_PTS: Pt[] = [
  [-330, -330], [-262, -330], [-205, -315], [-160, -240], [-118, -110], [-78, -54], [-28, -64], [12, -170], [44, -236], [86, -244],
  [122, -196], [150, -110], [178, -62], [220, -54], [268, -76], [302, -128], [304, -196], [270, -238], [222, -240], [192, -200],
  [196, -132], [236, -76], [290, -48], [336, -38],
];
const COASTER = smooth(COASTER_PTS, 5);
function coaster(style: string, name: string): FurnDef {
  const th = TH[style];
  const d = polyD(COASTER);
  const art: Art = (c) => {
    const sup = style === 'space' ? th.deep : style === 'rainbow' ? '#fff' : style === 'candy' ? '#fff' : '#fff3f8';
    let s = '';
    if (style === 'space') for (const [x, y, z] of [[-200, -440, 10], [80, -420, 12], [300, -330, 8], [-40, -300, 7]]) s += P(sparkleD(x, y, z), th.trim);
    // station tower and stairs
    s += R(-336, -336, 10, 336, 4, dark(sup, 0.2)) + R(-226, -336, 10, 336, 4, dark(sup, 0.2));
    for (let i = 0; i < 8; i++) s += Ln(-326, -30 - i * 38, -226, -50 - i * 38, dark(sup, 0.25), 4);
    s += box(-346, -346, 132, 18, 6, style === 'space' ? th.alt : c);
    // supports under the track
    COASTER.forEach(([x, y], i) => {
      if (i % 4 !== 2 || x < -200 || y > -40 || (x > 185 && x < 310 && y < -100)) return;
      s += style === 'candy' ? candyStripe(x - 5, y + 8, 10, -y - 8, '#fff', th.deep, Math.max(2, Math.round(-y / 18))) : R(x - 4, y + 8, 8, -y - 8, 3, sup) + R(x - 4, y + 8, 3, -y - 8, 1.5, dark(sup, 0.2), O(0.4));
    });
    s += R(242, -60, 10, 60, 4, sup);
    // ties, rails and running lights
    s += S(d, style === 'space' ? '#2d2a3a' : dark(c, 0.3), 20, 'stroke-dasharray="4 12"');
    s += S(d, style === 'rainbow' ? 'url(#g-rainbow)' : style === 'space' ? '#8ff3ff' : style === 'candy' ? th.alt : c, 11) + S(d, '#fff', 3, O(0.7));
    if (style === 'space') s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="6 40" stroke-linecap="round"><animate attributeName="stroke-dashoffset" values="0;-92" dur="1.2s" repeatCount="indefinite"/></path>`;
    // the cart waiting at the station
    const cart = style === 'space'
      ? P('M-50 -38 L34 -38 Q60 -30 64 -10 L64 0 L-50 0Z', '#c9cfdd') + P('M-50 -38 L-70 -60 L-44 -38Z', th.trim) + C(40, -20, 10, '#8ff3ff') + C(40, -20, 10, GLASS)
      : box(-50, -40, 104, 40, 14, style === 'rainbow' ? '#ff7a7a' : style === 'candy' ? '#fff' : th.deep) + R(-50, -40, 104, 10, 5, '#fff', O(0.4)) + (style === 'candy' ? motif('candy', 0, -18, 14) : style === 'rainbow' ? motif('rainbow', 0, -20, 14) : P(heartD(0, -28, 12), '#fff'));
    s += G(at(-262, -334), cart + C(-30, 2, 8, INK) + C(30, 2, 8, INK));
    s += flag(-336, -346, style === 'space' ? th.trim : th.deep, 46) + txt(-280, -360, 'GO!', 22, '#fff', style === 'space' ? th.alt : th.deep);
    return s;
  };
  const start = COASTER.findIndex(([x]) => x >= -262);
  return it(`f-coaster-${style}`, name, ride('Roller Coasters'), style, 'floor', 690, 470, art, { seats: [pathSeat(COASTER.slice(start), 34)] });
}

// =====================================================================================
// DROP TOWERS: 'bounce' seats with a big lift.
// =====================================================================================
const DT = { y: -110, amp: 290, dur: 5, xs: [-78, 78] };
function droptower(style: string, name: string): FurnDef {
  const th = TH[style];
  const carriage = (on: boolean, s: string) => when(on, lift(DT.amp, DT.dur), s);
  const art: Art = (c, on) => {
    let s = '';
    // the tower
    if (style === 'rainbow') RAINBOW.forEach((col, i) => { s += R(-28, -540 + i * 90, 56, 90, 0, col); });
    else if (style === 'candy') s += candyStripe(-28, -540, 56, 540, '#fff', c, 24);
    else s += R(-28, -540, 56, 540, 6, style === 'space' ? '#e8ecf5' : c);
    s += R(-28, -540, 56, 540, 6, SHX) + R(-8, -530, 16, 520, 8, style === 'space' ? '#9aa3b5' : '#fff', O(0.35));
    for (let i = 0; i < 9; i++) s += bulb(0, -510 + i * 56, 5, i % 2 ? th.bulb : '#fff', on, i);
    // the top
    if (style === 'space') s += P('M-46 -540 Q0 -640 46 -540Z', th.deep) + C(0, -570, 12, '#8ff3ff') + C(0, -570, 12, GLASS) + P('M-28 -60 L-74 0 L-28 -20Z M28 -60 L74 0 L28 -20Z', th.alt);
    else if (style === 'candy') s += C(0, -566, 40, th.alt) + S('M0 -566 m-5 0 a5 5 0 1 1 10 0 a12 12 0 1 1 -24 0 a19 19 0 1 1 38 0 a26 26 0 1 1 -52 0', '#fff', 5);
    else s += box(-60, -566, 120, 30, 14, style === 'rainbow' ? '#fff' : th.deep) + (style === 'rainbow' ? motif('rainbow', 0, -584, 26) : P(heartD(0, -600, 26), c) + P(heartD(0, -598, 14), '#fff', O(0.5)));
    // base
    s += box(-150, -32, 300, 32, 10, style === 'space' ? th.main : light(c, 0.2), 'none', 'y') + R(-150, -32, 300, 8, 4, '#fff', O(0.35));
    // the carriage with its seat backs
    let cg = R(-150, DT.y - 12, 300, 22, 10, style === 'space' ? '#9aa3b5' : '#fff') + R(-34, DT.y - 30, 68, 50, 12, style === 'space' ? th.deep : dark(c, 0.15));
    for (const x of DT.xs) cg += box(x - 46, DT.y - 96, 92, 98, 24, style === 'space' ? th.alt : style === 'rainbow' ? '#7cc8ff' : th.deep) + R(x - 30, DT.y - 86, 60, 10, 5, '#fff', O(0.4));
    s += carriage(on, cg);
    return s;
  };
  const front: Art = (c, on) => {
    let s = '';
    for (const x of DT.xs) {
      const bar = style === 'space' ? th.trim : style === 'candy' ? th.alt : style === 'rainbow' ? '#ffd36b' : light(c, 0.2);
      s += S(pd`M${x - 40} ${DT.y - 70} Q${x - 46} ${DT.y + 4} ${x} ${DT.y + 6} Q${x + 46} ${DT.y + 4} ${x + 40} ${DT.y - 70}`, bar, 9) + R(x - 44, DT.y + 2, 88, 14, 7, bar) + R(x - 38, DT.y + 52, 76, 10, 5, '#9aa3b5');
    }
    return carriage(on, s);
  };
  return it(`f-droptower-${style}`, name, ride('Drop Towers'), style, 'floor', 320, 610, art, {
    front,
    seats: DT.xs.map((x) => ({ x, y: DT.y, pose: 'sit' as const, anim: { pivot: [x, DT.y] as Pt, amp: DT.amp, dur: DT.dur, kind: 'bounce' as const } })),
    animWhenUsed: true,
  });
}

// =====================================================================================
// SWING RIDES: 'rotate' seats; chairs on chains swing out from the canopy rim in a wave.
// =====================================================================================
const SW = { top: -450, y: -196, amp: 18, dur: 3.2, xs: [-210, -70, 70, 210], ph: [0, 0.3, 0.6, 0.9] };
function swingride(style: string, name: string): FurnDef {
  const th = TH[style];
  const chairCol = (c: string, i: number) => (style === 'rainbow' ? RAINBOW[(i * 2) % 6] : style === 'space' ? th.cols[i] : i % 2 ? th.alt : c);
  const art: Art = (c, on) => {
    const main = style === 'space' ? th.main : c;
    let s = '';
    // pole and base
    s += R(-20, SW.top, 40, -SW.top, 8, style === 'princess' ? '#fff3f8' : style === 'space' ? '#c9cfdd' : dark(main, 0.1)) + R(-20, SW.top, 12, -SW.top, 6, '#fff', O(0.3));
    s += box(-170, -34, 340, 34, 12, style === 'space' ? th.deep : light(main, 0.25), 'none', 'y') + R(-170, -34, 340, 8, 4, '#fff', O(0.35));
    // the chairs on chains
    SW.xs.forEach((x, i) => {
      const col = chairCol(c, i);
      const chair = Ln(x - 30, SW.top, x - 34, SW.y - 4, '#9aa3b5', 2.5) + Ln(x + 30, SW.top, x + 34, SW.y - 4, '#9aa3b5', 2.5) +
        box(x - 34, SW.y - 70, 68, 72, 18, dark(col, 0.1)) + box(x - 40, SW.y - 4, 80, 16, 8, col) + Ln(x - 20, SW.y + 46, x + 20, SW.y + 46, '#9aa3b5', 4) + Ln(x - 30, SW.y + 10, x - 18, SW.y + 46, '#9aa3b5', 2) + Ln(x + 30, SW.y + 10, x + 18, SW.y + 46, '#9aa3b5', 2);
      s += when(on, rock(SW.amp, x, SW.top, SW.dur, SW.ph[i]), chair);
    });
    // canopy
    if (style === 'space') {
      s += E(0, SW.top - 6, 270, 30, '#c9cfdd') + E(0, SW.top - 16, 160, 50, th.alt) + E(0, SW.top - 30, 90, 46, '#8ff3ff', O(0.7)) + E(0, SW.top - 30, 90, 46, GLASS);
      s += bulbsAlong(Array.from({ length: 9 }, (_, i) => [-240 + i * 60, SW.top - 2] as Pt), 6, [th.trim, '#8ff3ff', '#ff7eb6'], on);
    } else {
      const dome = pd`M-266 ${SW.top} Q-240 ${SW.top - 70} 0 ${SW.top - 92} Q240 ${SW.top - 70} 266 ${SW.top}Z`;
      s += P(dome, main);
      for (let i = 0; i < 6; i++) if (i % 2) s += P(pd`M${-266 + i * 88.7} ${SW.top} Q${-240 + i * 80} ${SW.top - 60} 0 ${SW.top - 92} Q${-240 + (i + 1) * 80} ${SW.top - 60} ${-266 + (i + 1) * 88.7} ${SW.top}Z`, style === 'rainbow' ? RAINBOW[i] : '#fff', O(0.85));
      if (style === 'rainbow') for (let i = 0; i < 6; i += 2) s += P(pd`M${-266 + i * 88.7} ${SW.top} Q${-240 + i * 80} ${SW.top - 60} 0 ${SW.top - 92} Q${-240 + (i + 1) * 80} ${SW.top - 60} ${-266 + (i + 1) * 88.7} ${SW.top}Z`, RAINBOW[i]);
      s += P(dome, SHX, O(0.5)) + R(-270, SW.top - 8, 540, 22, 10, style === 'princess' ? GOLD : dark(main, 0.12)) + scallops(-270, 270, SW.top + 14, 9, 18, style === 'rainbow' ? RAINBOW : [main, '#fff']);
      s += bulbsAlong(Array.from({ length: 10 }, (_, i) => [-243 + i * 54, SW.top + 3] as Pt), 4.5, [th.bulb, '#fff'], on);
      if (style === 'princess') s += G(at(0, SW.top - 90), P('M-24 0 L-24 -24 L-12 -10 L0 -32 L12 -10 L24 -24 L24 0Z', GOLD) + C(0, -34, 5, '#c99bff'));
      else s += A(on ? turn(0, SW.top - 110, 4) : '', P(starD(0, SW.top - 110, 20), style === 'rainbow' ? '#ffd36b' : '#fff')) + C(0, SW.top - 92, 8, th.deep);
    }
    return s;
  };
  const front: Art = (c, on) => SW.xs.map((x, i) => {
    const col = chairCol(c, i);
    const bar = style === 'princess' ? GOLD : style === 'space' ? th.trim : '#fff';
    return when(on, rock(SW.amp, x, SW.top, SW.dur, SW.ph[i]), box(x - 44, SW.y - 2, 88, 18, 9, col) + R(x - 40, SW.y + 2, 80, 5, 2.5, '#fff', O(0.4)) +
      S(pd`M${x - 36} ${SW.y - 58} Q${x - 42} ${SW.y + 2} ${x} ${SW.y + 4} Q${x + 42} ${SW.y + 2} ${x + 36} ${SW.y - 58}`, bar, 5) + R(x - 28, SW.y + 44, 56, 8, 4, dark(col, 0.15)) +
      (style === 'princess' ? motif('crown', x, SW.y + 7, 7) : style === 'space' ? P(starD(x, SW.y + 7, 7), th.trim) : P(heartD(x, SW.y + 2, 6), '#fff')));
  }).join('');
  return it(`f-swingride-${style}`, name, ride('Swing Rides'), style, 'floor', 640, 590, art, {
    front,
    seats: SW.xs.map((x, i) => ({ x, y: SW.y, pose: 'sit' as const, anim: { pivot: [x, SW.top] as Pt, amp: SW.amp, dur: SW.dur, phase: SW.ph[i] } })),
    animWhenUsed: true,
  });
}

// =====================================================================================
// SWINGING SHIPS: 'rotate' seats with a big swing about the top of the A-frame.
// =====================================================================================
const SH = { pivot: [0, -470] as Pt, y: -210, amp: 30, dur: 4, xs: [-140, 0, 140] };
function ship(style: string, name: string): FurnDef {
  const th = TH[style];
  const swing = (on: boolean, s: string) => when(on, rock(SH.amp, SH.pivot[0], SH.pivot[1], SH.dur), s);
  const hullD = 'M-224 -205 L224 -205 Q222 -150 184 -110 Q100 -86 0 -86 Q-100 -86 -184 -110 Q-222 -150 -224 -205Z';
  const art: Art = (c, on) => {
    const frame = style === 'princess' ? '#fff3f8' : style === 'beach' ? '#fff' : dark(c, 0.25);
    let s = '';
    // A-frame
    s += Ln(-250, -6, 0, -470, frame, 18) + Ln(250, -6, 0, -470, frame, 18) + Ln(-200, -6, -20, -460, dark(frame, 0.15), 10) + Ln(200, -6, 20, -460, dark(frame, 0.15), 10);
    s += box(-280, -26, 560, 26, 8, style === 'beach' ? '#f4dca0' : light(c, 0.2), 'none', 'y');
    // the swinging part: arms, mast, sail and deck back wall
    let sw = Ln(0, -470, -170, -206, '#9aa3b5', 8) + Ln(0, -470, 170, -206, '#9aa3b5', 8);
    sw += R(-6, -420, 12, 215, 4, '#a86b4a');
    if (style === 'princess') sw += P('M-200 -205 Q-260 -280 -230 -330 Q-210 -290 -190 -250Z', '#fff') + E(-226, -340, 16, 14, '#fff') + P('M-240 -342 L-262 -336 L-240 -330Z', '#ffab3d') + C(-222, -344, 3, INK) + P('M-226 -356 L-232 -372 L-220 -366 L-214 -378 L-210 -362Z', GOLD);
    sw += P('M10 -410 Q90 -360 10 -260Z', style === 'beach' ? '#fff' : '#fff') + P('M10 -410 Q90 -360 10 -260Z', SHX, O(0.4));
    sw += style === 'beach' ? motif('fish', 36, -340, 16) : style === 'princess' ? motif('crown', 36, -340, 15) : P(heartD(36, -350, 15), th.deep);
    sw += flagWave(6, -420, style === 'beach' ? '#ff7a6b' : th.deep);
    sw += R(-222, -246, 444, 44, 14, dark(style === 'princess' ? '#fff3f8' : c, 0.2));
    s += swing(on, sw);
    s += C(0, -470, 14, '#fff') + C(0, -470, 6, '#9aa3b5');
    return s;
  };
  const front: Art = (c, on) => {
    const hull = style === 'princess' ? '#fff' : c;
    let s = P(hullD, hull) + P(hullD, SHY, O(0.4)) + R(-232, -212, 464, 14, 7, style === 'princess' ? GOLD : style === 'beach' ? '#fff' : th.deep);
    if (style === 'beach') s += S('M-210 -150 Q-180 -166 -150 -150 Q-120 -134 -90 -150 Q-60 -166 -30 -150 Q0 -134 30 -150 Q60 -166 90 -150 Q120 -134 150 -150 Q180 -166 210 -150', '#fff', 6);
    if (style === 'princess') s += S('M-200 -170 Q-100 -130 0 -170 Q100 -130 200 -170', GOLD, 5) + [-120, 0, 120].map((x) => flowerG(x, -132, 10, '#ff9ec7')).join('') + P('M224 -205 Q262 -200 250 -168 Q236 -184 214 -176Z', '#fff');
    else for (const x of [-150, -75, 0, 75, 150]) s += C(x, -152, 12, '#fff') + C(x, -152, 8, WATER) + C(x, -152, 8, GLASS);
    if (style === 'sweet') s += P(heartD(196, -176, 14), '#fff');
    return swing(on, s);
  };
  return it(`f-pirateship-${style}`, name, ride('Swinging Ships'), style, 'floor', 640, 520, art, {
    front,
    seats: SH.xs.map((x) => ({ x, y: SH.y, pose: 'sit' as const, anim: { pivot: SH.pivot, amp: SH.amp, dur: SH.dur } })),
    animWhenUsed: true,
  });
}
const flagWave = (x: number, y: number, col: string) => Ln(x, y, x, y - 36, '#a86b4a', 4) + A(`<animateTransform attributeName="transform" type="skewY" values="0;-10;0" dur="1.4s" repeatCount="indefinite"/>`, G(at(x, y - 36), P('M0 0 L40 9 L0 20Z', col)));

// =====================================================================================
// WATER SLIDES / LOG FLUMES: a 'slide' seat down a watery chute into a splash pool.
// =====================================================================================
const FLUME_PTS: Pt[] = [[-330, -372], [-252, -372], [-196, -352], [-142, -300], [-92, -282], [-30, -276], [30, -250], [86, -170], [136, -84], [190, -40], [256, -28], [316, -26]];
const FLUME = smooth(FLUME_PTS, 5);
function flume(style: string, name: string): FurnDef {
  const th = TH[style];
  const d = polyD(FLUME);
  const art: Art = (c) => {
    const wood = style === 'woodland';
    let s = '';
    // supports
    FLUME.forEach(([x, y], i) => { if (i % 5 === 3 && y < -60) s += R(x - 5, y + 14, 10, -y - 14, 4, wood ? '#8a5a3c' : style === 'beach' ? '#fff' : light(c, 0.3)); });
    s += R(-336, -372, 12, 372, 4, wood ? '#8a5a3c' : '#fff') + R(-240, -372, 12, 372, 4, wood ? '#8a5a3c' : '#fff');
    for (let i = 0; i < 8; i++) s += Ln(-330, -30 - i * 42, -240, -50 - i * 42, wood ? '#6b4a3a' : '#c9cfdd', 4);
    // pool
    s += E(250, -22, 110, 26, wood ? '#6b8f5a' : dark(WATER, 0.15)) + E(250, -24, 100, 20, WATER) + E(220, -28, 40, 6, '#fff', O(0.5));
    // the chute and its running water
    s += S(d, wood ? '#a86b4a' : style === 'beach' ? '#fff' : c, 34) + S(d, wood ? '#8a5a3c' : style === 'beach' ? th.main : dark(c, 0.12), 34, 'stroke-dasharray="2 26"');
    s += S(d, WATER, 20) + `<path d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 34" opacity="0.8"><animate attributeName="stroke-dashoffset" values="0;-88" dur="0.9s" repeatCount="indefinite"/></path>`;
    // splash drops at the bottom
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 14;
      const dx = (i - 3) * 12;
      s += `<circle cx="${f(x)}" cy="-30" r="${f(5 + (i % 3) * 2)}" fill="#e6f6ff"><animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(-50 - (i % 3) * 20)};${f(dx * 1.6)} 0" dur="1.1s" begin="${f(-i * 0.16)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.8;0" dur="1.1s" begin="${f(-i * 0.16)}s" repeatCount="indefinite"/></circle>`;
    }
    // station deck and the boat waiting at the top
    s += box(-346, -386, 120, 16, 6, wood ? '#c98a5a' : th.deep);
    const boat = wood
      ? E(0, -14, 56, 18, '#a86b4a') + E(-52, -14, 8, 18, '#e8c88a') + S('M-50 -20 L44 -20', '#8a5a3c', 2) + leafy(30, -30)
      : style === 'beach'
        ? E(0, -12, 50, 16, '#ffd36b') + E(0, -12, 30, 8, th.main) + [-34, 0, 34].map((x) => R(x - 5, -26, 10, 26, 4, '#ff7a6b')).join('')
        : E(0, -14, 54, 18, '#fff') + P(heartD(0, -24, 10), c);
    s += G(at(-262, -372), boat);
    s += style === 'beach' ? motif('fish', -290, -420, 18) : wood ? leafy(-290, -400) + leafy(-250, -404) : flag(-336, -386, th.deep, 40);
    return s;
  };
  const start = FLUME.findIndex(([x]) => x >= -262);
  return it(`f-waterslide-${style}`, name, ride('Water Rides'), style, 'floor', 690, 440, art, { seats: [pathSeat(FLUME.slice(start), 26)] });
}
const leafy = (x: number, y: number) => E(x - 8, y, 14, 8, LEAF, `transform="rotate(-30 ${x - 8} ${y})"`) + E(x + 8, y, 14, 8, '#4fae7a', `transform="rotate(30 ${x + 8} ${y})"`);

// =====================================================================================
// KIDDIE TRAINS: 'sway' seats; the whole train rolls back and forth together.
// =====================================================================================
const KT = { y: -96, amp: 40, dur: 5, xs: [-230, -70, 120] };
function train(style: string, name: string): FurnDef {
  const th = TH[style];
  const carCol = (c: string, i: number) => (style === 'rainbow' ? ['#ff7a7a', '#7fe0b0', '#7cc8ff'][i] : style === 'woodland' ? ['#c98a5a', '#a86b4a', c][i] : [light(c, 0.3), c, c][i]);
  const roll = (on: boolean, s: string) => when(on, swayA(KT.amp, KT.dur), s);
  const wheel = (x: number, y: number, r: number, on: boolean, col: string) => {
    const w = C(x, y, r, '#4a4a5e') + C(x, y, r * 0.7, col) + Ln(x - r * 0.6, y, x + r * 0.6, y, '#4a4a5e', 3) + Ln(x, y - r * 0.6, x, y + r * 0.6, '#4a4a5e', 3) + C(x, y, 4, '#fff');
    return on ? A(turn(x, y, 1.2), w) : w;
  };
  const art: Art = (c, on) => {
    let s = R(-330, -16, 660, 8, 4, '#9aa3b5') + R(-330, -8, 660, 8, 3, '#c9cfdd');
    for (let i = 0; i < 17; i++) s += R(-324 + i * 40, -4, 24, 8, 2, style === 'woodland' ? '#8a5a3c' : '#c98a5a');
    let t = '';
    // engine: boiler, chimney with smoke and cab back wall
    const eng = carCol(c, 2);
    t += box(150, -170, 150, 120, 30, eng) + box(150, -170, 150, 120, 30, eng, 'none', 'y').replace(/fill="[^"]*"/, 'fill="none"');
    t += R(150, -150, 150, 10, 4, '#fff', O(0.4)) + C(298, -110, 22, style === 'woodland' ? '#ffab5e' : th.deep) + cute(298, -116, 0.7);
    t += P('M240 -170 L232 -230 L276 -230 L268 -170Z', style === 'woodland' ? '#6b4a3a' : '#4a4a5e') + R(226, -240, 56, 14, 6, style === 'woodland' ? '#8a5a3c' : th.deep);
    if (on) for (let i = 0; i < 3; i++) t += `<circle cx="254" cy="-250" r="${f(12 + i * 4)}" fill="#fff" opacity="0.8"><animate attributeName="cy" values="-250;-330" dur="2s" begin="${f(-i * 0.66)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="2s" begin="${f(-i * 0.66)}s" repeatCount="indefinite"/><animate attributeName="cx" values="254;224" dur="2s" begin="${f(-i * 0.66)}s" repeatCount="indefinite"/></circle>`;
    t += box(64, -210, 100, 160, 20, dark(eng, 0.1)) + R(78, -196, 72, 50, 14, '#e8f6ff') + R(78, -196, 72, 50, 14, GLASS);
    t += P('M56 -214 L172 -214 L164 -236 L64 -236Z', style === 'woodland' ? '#8fbf6a' : th.deep);
    t += P('M300 -50 L336 -20 L300 -20Z', '#9aa3b5');
    // coupling bars and car seat backs
    t += R(-280, -50, 400, 8, 4, '#4a4a5e');
    for (let i = 0; i < 2; i++) t += box(KT.xs[i] - 66, KT.y - 70, 132, 74, 18, dark(carCol(c, i), 0.12));
    s += roll(on, t);
    s += style === 'woodland' ? leafy(-300, -40) + leafy(310, -40) : '';
    return s;
  };
  const front: Art = (c, on) => {
    let t = '';
    for (let i = 0; i < 3; i++) {
      const x = KT.xs[i];
      const col = carCol(c, i);
      const w = i === 2 ? 110 : 150;
      t += box(x - w / 2, KT.y - 8, w, 64, 16, col) + R(x - w / 2, KT.y - 12, w, 12, 6, style === 'woodland' ? '#8a5a3c' : '#fff');
      if (style === 'woodland') t += S(pd`M${x - w / 2 + 10} ${KT.y + 20} L${x + w / 2 - 10} ${KT.y + 20} M${x - w / 2 + 10} ${KT.y + 38} L${x + w / 2 - 10} ${KT.y + 38}`, dark(col, 0.2), 3) + leafy(x, KT.y + 26);
      else if (style === 'rainbow') t += motif(['star', 'rainbow', 'heart'][i], x, KT.y + 26, 15);
      else t += P(heartD(x, KT.y + 16, 13), i === 0 ? c : '#fff');
      const wc = style === 'woodland' ? '#e8c88a' : style === 'rainbow' ? '#ffd36b' : '#fff';
      t += wheel(x - w / 2 + 28, KT.y + 66, i === 2 ? 26 : 20, on, wc) + wheel(x + w / 2 - 28, KT.y + 66, 20, on, wc);
    }
    t += wheel(250, KT.y + 66, 22, on, style === 'woodland' ? '#e8c88a' : '#fff');
    return roll(on, t);
  };
  return it(`f-kiddietrain-${style}`, name, ride('Kiddie Trains'), style, 'floor', 680, 340, art, {
    front,
    seats: KT.xs.map((x) => ({ x, y: KT.y, pose: 'sit' as const, anim: { pivot: [x, KT.y] as Pt, amp: KT.amp, dur: KT.dur, kind: 'sway' as const } })),
    animWhenUsed: true,
  });
}

// =====================================================================================
// BALLOON RIDES: 'bounce' seats; baskets float up and down under their balloons.
// =====================================================================================
const HB = { y: -110, amp: 90, dur: 4, xs: [-132, 132], ph: [0, 2] };
function envelope(x: number, y: number, r: number, cols: string[]): string {
  const d = (k: number) => pd`M${x} ${y - r} C${x + r * 1.35 * k} ${y - r} ${x + r * 0.9 * k} ${y + r * 0.75} ${x + r * 0.32 * k} ${y + r * 1.05} L${x - r * 0.32 * k} ${y + r * 1.05} C${x - r * 0.9 * k} ${y + r * 0.75} ${x - r * 1.35 * k} ${y - r} ${x} ${y - r}Z`;
  let s = '';
  [1, 0.68, 0.36].forEach((k, i) => { s += P(d(k), cols[i % cols.length]); });
  return s + P(d(1), SHX, O(0.5)) + E(x - r * 0.45, y - r * 0.4, r * 0.14, r * 0.3, '#fff', O(0.4));
}
function balloonride(style: string, name: string): FurnDef {
  const th = TH[style];
  const cols = (c: string, i: number) => (style === 'rainbow' ? (i ? ['#7cc8ff', '#c99bff', '#7fe0b0'] : ['#ff7a7a', '#ffd36b', '#ffab5e']) : style === 'candy' ? (i ? ['#a8e6cf', '#fff', '#ff7eb6'] : ['#ff7eb6', '#fff', '#a8e6cf']) : (i ? ['#fff', c, '#fff'] : [c, '#fff', c]));
  const float = (on: boolean, i: number, s: string) => when(on, lift(HB.amp, HB.dur, HB.ph[i]), s);
  const art: Art = (c, on) => {
    let s = R(-8, -540, 16, 520, 6, style === 'candy' ? '#fff' : '#c9cfdd') + P(starD(0, -560, 22), style === 'rainbow' ? '#ffd36b' : th.deep);
    s += box(-250, -26, 500, 26, 12, light(c, 0.25), 'none', 'y') + bulbsAlong([-210, -140, -70, 70, 140, 210].map((x) => [x, -13] as Pt), 4, [th.bulb, '#fff'], on);
    HB.xs.forEach((x, i) => {
      const y = HB.y;
      let b = envelope(x, y - 372, 96, cols(c, i));
      if (style === 'sweet') b += P(heartD(x, y - 388, 18), '#fff', O(0.9));
      if (style === 'candy') b += C(x, y - 372, 20, 'none', 'stroke="#fff" stroke-width="5" opacity="0.8"');
      b += Ln(x - 30, y - 268, x - 50, y - 4, '#a86b4a', 3) + Ln(x + 30, y - 268, x + 50, y - 4, '#a86b4a', 3) + R(x - 32, y - 276, 64, 10, 5, '#a86b4a');
      b += box(x - 54, y - 30, 108, 34, 10, '#c98a5a');
      s += float(on, i, b);
    });
    return s;
  };
  const front: Art = (_c, on) => HB.xs.map((x, i) => {
    let b = box(x - 58, HB.y - 6, 116, 66, 14, '#e0a26a') + R(x - 62, HB.y - 12, 124, 14, 7, '#a86b4a');
    for (let k = 0; k < 4; k++) b += S(pd`M${x - 50} ${HB.y + 10 + k * 13} L${x + 50} ${HB.y + 10 + k * 13}`, '#c98a5a', 2.5, O(0.8));
    b += style === 'rainbow' ? motif('rainbow', x, HB.y + 28, 14) : style === 'candy' ? motif('candy', x, HB.y + 28, 14) : P(heartD(x, HB.y + 18, 12), th.deep);
    return float(on, i, b);
  }).join('');
  return it(`f-balloonride-${style}`, name, ride('Balloon Rides'), style, 'floor', 540, 580, art, {
    front,
    seats: HB.xs.map((x, i) => ({ x, y: HB.y, pose: 'sit' as const, anim: { pivot: [x, HB.y] as Pt, amp: HB.amp, dur: HB.dur, phase: HB.ph[i], kind: 'bounce' as const } })),
    animWhenUsed: true,
  });
}

const RIDES: FurnDef[] = [
  ferris('sweet', 'Sweetheart Wheel', 'heart'), ferris('rainbow', 'Rainbow Wheel', 'rainbow'), ferris('candy', 'Candy Wheel', 'candy'), ferris('space', 'Star Wheel', 'ufo'), ferris('princess', 'Royal Wheel', 'carriage'),
  carousel('sweet', 'Sweet Carousel', 'horse'), carousel('rainbow', 'Pony Carousel', 'pony'), carousel('candy', 'Candy Carousel', 'candyHorse'), carousel('space', 'Rocket Carousel', 'rocket'), carousel('princess', 'Unicorn Carousel', 'unicorn'),
  teacups('sweet', 'Sweet Teacups', 'heart'), teacups('rainbow', 'Rainbow Teacups', 'rainbow'), teacups('candy', 'Sprinkle Teacups', 'candy'), teacups('space', 'Planet Cups', 'planet'), teacups('princess', 'Royal Tea Party', 'rose'),
  bumpercars('sweet', 'Sweet Bumper Cars'), bumpercars('rainbow', 'Rainbow Bumper Cars'), bumpercars('space', 'Space Bumper Cars'), bumpercars('retro', 'Retro Bumper Cars'),
  coaster('sweet', 'Sweet Coaster'), coaster('rainbow', 'Rainbow Coaster'), coaster('candy', 'Candy Cane Coaster'), coaster('space', 'Comet Coaster'),
  droptower('sweet', 'Sweet Drop Tower'), droptower('rainbow', 'Rainbow Drop'), droptower('candy', 'Lollipop Drop'), droptower('space', 'Rocket Launch'),
  swingride('sweet', 'Sweet Swing Ride'), swingride('rainbow', 'Rainbow Swinger'), swingride('princess', 'Royal Swings'), swingride('space', 'UFO Swings'),
  ship('sweet', 'Pirate Swing Ship'), ship('beach', 'Sea Wave Ship'), ship('princess', 'Swan Boat Swing'),
  flume('sweet', 'Splash Slide'), flume('beach', 'Wave Water Slide'), flume('woodland', 'Log Flume'),
  train('sweet', 'Choo-Choo Train'), train('rainbow', 'Rainbow Express'), train('woodland', 'Forest Train'),
  balloonride('sweet', 'Balloon Ride'), balloonride('rainbow', 'Rainbow Balloons'), balloonride('candy', 'Candy Balloons'),
];

// =====================================================================================
// PARK FURNITURE
// =====================================================================================
const BOOTHS: FurnDef[] = (['sweet', 'candy', 'space'] as const).map((st) => {
  const th = TH[st];
  const name = { sweet: 'Ticket Booth', candy: 'Candy Ticket Booth', space: 'Space Ticket Booth' }[st];
  return it(`f-ticketbooth-park-${st}`, name, 'Ticket Booths', st, 'floor', 230, 320, (c, on) => {
    const wall = st === 'space' ? th.main : c;
    let s = box(-90, -200, 180, 200, 12, wall) + R(-90, -60, 180, 60, 0, dark(wall, 0.1));
    s += R(-62, -170, 124, 80, 12, '#e8f6ff') + R(-62, -170, 124, 80, 12, GLASS) + R(-70, -96, 140, 12, 6, '#fff');
    s += C(30, -140, 12, '#ffd9b8') + E(30, -118, 18, 14, th.alt);
    s += st === 'candy' ? candyStripe(-110, -246, 220, 46, '#fff', th.deep, 4) : awning(-110, 110, -250, 36, 6, st === 'space' ? th.alt : '#fff', st === 'space' ? th.deep : th.deep);
    s += box(-80, -300, 160, 44, 14, st === 'space' ? th.deep : '#fff') + txt(0, -270, 'TICKETS', 24, st === 'space' ? th.trim : th.deep);
    s += bulbsAlong([-60, -30, 0, 30, 60].map((x) => [x, -300] as Pt), 4, [th.bulb, '#fff'], on);
    s += st === 'space' ? P(starD(0, -40, 16), th.trim) : motif(th.motif, 0, -32, 16);
    s += G(at(-46, -98), R(-14, -10, 28, 12, 3, '#fff3a0') + S('M-14 -4 L14 -4', '#ff9ec7', 1.5, 'stroke-dasharray="3 3"'));
    return s;
  }, { toggle: true, sfx: 'ding', spawn: ['parkTicket'] });
});

const CARTS: FurnDef[] = (['sweet', 'rainbow', 'candy'] as const).map((st) => {
  const th = TH[st];
  const name = { sweet: 'Cotton Candy Cart', rainbow: 'Rainbow Treat Cart', candy: 'Sugar Cart' }[st];
  return it(`f-cottoncandy-${st}`, name, 'Snack Carts', st, 'floor', 250, 340, (c) => {
    let s = C(-60, -24, 22, '#4a4a5e') + C(-60, -24, 12, '#fff') + C(60, -24, 22, '#4a4a5e') + C(60, -24, 12, '#fff');
    s += box(-100, -130, 200, 96, 14, st === 'rainbow' ? '#fff' : c) + R(-100, -130, 200, 12, 6, '#fff', O(0.5));
    if (st === 'rainbow') RAINBOW.forEach((col, i) => { s += R(-100 + i * 33.3, -100, 33.3, 40, 0, col); });
    else s += st === 'candy' ? [-60, -20, 20, 60].map((x, i) => C(x, -82, 10, th.cols[i + 1])).join('') : P(heartD(0, -96, 16), '#fff');
    s += txt(0, -112, 'YUMMY', 16, st === 'rainbow' ? th.deep : '#fff');
    // glass bowl of spun sugar and the umbrella
    s += E(0, -166, 70, 36, '#e8f6ff', O(0.7)) + E(-6, -176, 48, 24, '#ffb3d6') + E(22, -170, 30, 18, '#ffd0e6') + E(0, -166, 70, 36, GLASS);
    s += R(-4, -310, 8, 180, 3, '#c9cfdd') + R(84, -186, 6, 60, 3, '#c9cfdd');
    for (const [x, col] of [[-56, '#ff9ec7'], [-30, '#c99bff'], [56, '#7cc8ff']] as [number, string][]) s += Ln(x, -130, x, -172, '#fff3d6', 4) + C(x, -186, 18, col) + C(x - 6, -192, 6, '#fff', O(0.5));
    const um = pd`M-120 -270 Q0 -350 120 -270Z`;
    s += P(um, st === 'rainbow' ? '#ffd36b' : th.deep) + (st === 'rainbow' ? RAINBOW.map((col, i) => P(pd`M${-120 + i * 40} -270 Q${-80 + i * 26} -310 0 -330 Q${-80 + (i + 1) * 26} -310 ${-120 + (i + 1) * 40} -270Z`, col)).join('') : [1, 3, 5].map((i) => P(pd`M${-120 + i * 40} -270 Q${-80 + i * 26} -310 0 -330 Q${-80 + (i + 1) * 26} -310 ${-120 + (i + 1) * 40} -270Z`, '#fff')).join(''));
    s += scallops(-120, 120, -270, 6, 14, [st === 'rainbow' ? '#ff7a7a' : th.deep, '#fff']) + C(0, -332, 7, '#fff');
    return s;
  }, { spawn: ['cottonCandy', 'caramelApple', 'snowCone'] });
});

const POPCORN: FurnDef[] = (['sweet', 'retro'] as const).map((st) => {
  const th = TH[st];
  return it(`f-popcorncart-${st}`, st === 'sweet' ? 'Popcorn Cart' : 'Retro Snack Cart', 'Popcorn Carts', st, 'floor', 230, 320, (c, on) => {
    let s = C(-60, -22, 20, '#4a4a5e') + C(-60, -22, 10, '#fff') + C(60, -22, 20, '#4a4a5e') + C(60, -22, 10, '#fff');
    s += box(-90, -120, 180, 90, 12, c) + R(-90, -120, 180, 90, 12, SHX);
    for (let i = 0; i < 5; i++) s += R(-80 + i * 36, -114, 16, 78, 6, '#fff', O(0.85));
    s += box(-80, -230, 160, 110, 10, '#fff3d6', 'none') + R(-80, -230, 160, 110, 10, GLASS);
    for (let i = 0; i < 26; i++) {
      const [x, y] = [-64 + ((i * 37) % 128), -128 - ((i * 23) % 50)];
      s += on && i % 3 === 0 ? A(bob(0, -26, 0.6, i * 0.1), C(x, y, 8, '#fff8e0')) : C(x, y, 8, '#fff8e0') + C(x + 3, y - 2, 4, '#ffe08a');
    }
    s += R(-90, -244, 180, 18, 6, st === 'retro' ? th.trim : th.deep) + box(-70, -290, 140, 44, 14, '#fff') + txt(0, -260, 'POPCORN', 22, st === 'retro' ? th.deep : c);
    s += st === 'retro' ? P(starD(-80, -290, 12), th.trim) + P(starD(80, -290, 12), th.trim) : P(heartD(-80, -296, 10), th.deep) + P(heartD(80, -296, 10), th.deep);
    return s;
  }, { toggle: true, spawn: ['parkPopcorn', 'pretzel', 'churro'] });
});

const BALLOONS: FurnDef[] = (['sweet', 'rainbow'] as const).map((st) => {
  const th = TH[st];
  return it(`f-balloonstand-${st}`, st === 'sweet' ? 'Balloon Stand' : 'Rainbow Balloon Stand', 'Balloon Stands', st, 'floor', 240, 400, (c) => {
    let s = C(-50, -16, 16, '#4a4a5e') + C(50, -16, 16, '#4a4a5e') + box(-80, -100, 160, 80, 14, st === 'rainbow' ? '#fff' : c) + R(-80, -100, 160, 10, 5, '#fff', O(0.5));
    s += st === 'rainbow' ? motif('rainbow', 0, -60, 22) : P(heartD(0, -74, 18), '#fff');
    const cols = st === 'rainbow' ? RAINBOW : [c, '#fff', th.deep, '#ffd36b', '#c99bff', '#7cc8ff'];
    const spots: Pt[] = [[-70, -300], [-20, -340], [36, -320], [80, -280], [-50, -240], [10, -270], [60, -220]];
    spots.forEach(([x, y], i) => {
      const b = S(pd`M0 -96 Q${-x * 0.3} ${(y + 96) * 0.4 - 96} ${x} ${y + 28}`, '#9aa3b5', 1.5) + (i % 3 === 1 ? P(heartD(x, y - 16, 28), cols[i % cols.length]) : E(x, y, 26, 31, cols[i % cols.length])) + E(x - 9, y - 10, 6, 10, '#fff', O(0.45)) + P(pd`M${x - 5} ${y + 33} L${x + 5} ${y + 33} L${x} ${y + 26}Z`, cols[i % cols.length]);
      s += A(bob(i % 2 ? 6 : -6, -8, 2.4 + (i % 3) * 0.5, i * 0.3), b);
    });
    return s;
  }, { spawn: ['parkBalloon'] });
});

const GAMES: FurnDef[] = (['sweet', 'rainbow', 'space'] as const).map((st) => {
  const th = TH[st];
  const name = { sweet: 'Ring Toss Booth', rainbow: 'Duck Pond Game', space: 'Star Toss Booth' }[st];
  return it(`f-gamesbooth-${st}`, name, 'Game Booths', st, 'floor', 320, 340, (c, on) => {
    const wall = st === 'space' ? th.main : light(c, 0.2);
    let s = R(-150, -260, 14, 260, 5, '#fff') + R(136, -260, 14, 260, 5, '#fff') + box(-140, -250, 280, 160, 8, wall, 'none', 'y');
    // prizes hanging at the back
    for (const [x, k] of [[-100, 0], [-40, 1], [40, 2], [100, 0]] as Pt[]) s += Ln(x, -250, x, -228, '#9aa3b5', 2) + G(at(x, -180, 0.7), plush(k));
    s += box(-150, -90, 300, 90, 10, st === 'space' ? th.deep : c, 'none', 'y') + R(-160, -98, 320, 16, 8, '#fff');
    if (st === 'rainbow') {
      s += R(-130, -84, 260, 34, 17, '#4f9dff') + R(-130, -84, 260, 34, 17, WATER, O(0.8));
      for (let i = 0; i < 4; i++) {
        const dk = G(at(-90 + i * 60, -86), E(0, 0, 16, 10, '#ffd84a') + C(9, -12, 8, '#ffd84a') + P('M16 -12 L24 -10 L16 -8Z', '#ff8a3d') + C(10, -14, 1.6, INK) + C(-4, 2, 4, RAINBOW[i]));
        s += A(swayA(14, 3, i * 0.7), dk);
      }
    } else {
      const bottles = st === 'space' ? [th.alt, '#5ab0ef', th.trim, '#ff7eb6', '#3fd0c9'] : ['#7fe0b0', '#7cc8ff', '#ffd36b', '#c99bff', '#ff9ec7'];
      bottles.forEach((col, i) => { const x = -96 + i * 48; s += st === 'space' ? P(starD(x, -120, 16), col) + R(x - 3, -104, 6, 10, 2, '#c9cfdd') : R(x - 9, -136, 18, 38, 7, col, O(0.9)) + R(x - 4, -150, 8, 16, 3, col) + E(x - 3, -122, 3, 9, '#fff', O(0.5)); });
      s += E(-48, -136, 20, 7, 'none', `stroke="${th.deep}" stroke-width="5"`) + E(48, -112, 20, 7, 'none', 'stroke="#ffd36b" stroke-width="5"');
    }
    s += awning(-170, 170, -306, 46, 8, st === 'space' ? th.alt : th.deep, '#fff');
    s += box(-90, -346, 180, 42, 14, st === 'space' ? th.deep : '#fff') + txt(0, -316, st === 'rainbow' ? 'DUCK POND' : st === 'space' ? 'STAR TOSS' : 'RING TOSS', 22, st === 'space' ? th.trim : th.deep);
    s += bulbsAlong([-70, -35, 0, 35, 70].map((x) => [x, -346] as Pt), 4, [th.bulb, '#fff'], on);
    s += txt(0, -40, 'WIN A PRIZE!', 18, '#fff');
    return s;
  }, { toggle: true, sfx: 'ding', spawn: ['prizeBunny', 'prizeBear', 'prizeUnicorn'] });
});
/** Plush prizes: 0 bunny, 1 bear, 2 unicorn; drawn standing on (0, 0). */
function plush(k: number): string {
  const body = ['#fff3f8', '#c98a5a', '#ffffff'][k];
  const ear = ['#ffb3d1', '#b07a4f', '#ffd9e8'][k];
  let s = '';
  if (k === 0) s += E(-14, -82, 9, 24, body) + E(14, -82, 9, 24, body) + E(-14, -80, 4, 16, ear) + E(14, -80, 4, 16, ear);
  if (k === 1) s += C(-20, -66, 10, body) + C(20, -66, 10, body) + C(-20, -66, 5, ear) + C(20, -66, 5, ear);
  s += E(0, -22, 24, 22, body) + C(0, -52, 22, body) + E(-16, -4, 9, 6, ear) + E(16, -4, 9, 6, ear);
  if (k === 2) s += P('M-4 -72 L0 -96 L6 -72Z', GOLD) + P('M14 -66 Q30 -60 26 -38 Q22 -50 12 -54Z', '#c99bff') + P('M18 -58 Q32 -44 24 -28 Q22 -40 14 -46Z', '#7cc8ff');
  if (k === 1) s += E(0, -46, 9, 7, '#e8c0a0');
  s += cute(0, -54, 0.62) + C(0, -46, 2, k === 1 ? INK : '#ff8fb0');
  return s + G(at(0, -32, 0.32), bowG(0, 0, 1, ['#ff7eb6', '#7cc8ff', '#c99bff'][k]));
}

const PRIZES: FurnDef[] = (['sweet', 'rainbow'] as const).map((st) => {
  const th = TH[st];
  return it(`f-prizeshelf-${st}`, st === 'sweet' ? 'Prize Shelf' : 'Rainbow Prize Wall', 'Prize Shelves', st, 'floor', 280, 330, (c) => {
    let s = box(-130, -300, 260, 300, 12, st === 'rainbow' ? '#fff' : light(c, 0.3)) + R(-130, -300, 260, 300, 12, SHX);
    for (let r = 0; r < 3; r++) {
      const y = -210 + r * 90;
      s += R(-124, y, 248, 12, 4, st === 'rainbow' ? RAINBOW[r * 2] : c);
      for (let i = 0; i < 3; i++) s += G(at(-80 + i * 80, y, 0.72), plush((i + r) % 3));
    }
    s += box(-110, -330, 220, 40, 14, th.deep) + txt(0, -302, 'PRIZES', 24, '#fff') + P(starD(-120, -312, 14), '#ffd36b') + P(starD(120, -312, 14), '#ffd36b');
    return s;
  }, { spawn: ['prizeBunny', 'prizeBear', 'prizeUnicorn'] });
});

const GATES: FurnDef[] = (['sweet', 'rainbow', 'princess'] as const).map((st) => {
  const th = TH[st];
  const name = { sweet: 'Park Entrance', rainbow: 'Rainbow Gate', princess: 'Castle Gate' }[st];
  return it(`f-parkentrance-${st}`, name, 'Park Gates', st, 'floor', 620, 540, (c, on) => {
    let s = '';
    // pillars
    for (const x of [-250, 250]) {
      if (st === 'princess') s += box(x - 46, -380, 92, 380, 8, '#fff3f8') + P(pd`M${x - 56} -380 L${x} -470 L${x + 56} -380Z`, c) + flag(x, -468, '#c99bff', 36) + R(x - 20, -320, 40, 60, 20, '#bfe3ff') + R(x - 20, -320, 40, 60, 20, GLASS);
      else if (st === 'rainbow') RAINBOW.forEach((col, i) => { s += R(x - 40, -380 + i * 63.3, 80, 63.3, i === 0 ? 10 : 0, col); });
      else s += box(x - 40, -380, 80, 380, 14, c) + R(x - 30, -370, 14, 360, 7, '#fff', O(0.3)) + candyStripe(x - 40, -40, 80, 40, '#fff', th.deep, 2);
      if (st !== 'princess') s += C(x, -404, 30, st === 'rainbow' ? '#fff' : th.deep) + (st === 'rainbow' ? motif('star', x, -404, 22) : P(heartD(x, -416, 18), '#fff'));
    }
    // arched sign
    const arch = 'M-290 -330 Q0 -560 290 -330 L290 -280 Q0 -500 -290 -280Z';
    if (st === 'rainbow') RAINBOW.forEach((col, i) => { s += S(pd`M-280 ${-290 - i * 8} Q0 ${-520 - i * 8} 280 ${-290 - i * 8}`, col, 9); });
    else s += P(arch, st === 'princess' ? GOLD : th.deep) + P(arch, '#fff', O(0.15));
    s += box(-180, -460, 360, 76, 30, '#fff') + R(-170, -452, 340, 60, 24, st === 'princess' ? '#fff3f8' : light(c, 0.35));
    s += txt(0, -406, 'FUN PARK', 46, st === 'princess' ? '#c99bff' : th.deep, '#fff');
    s += bulbsAlong(Array.from({ length: 12 }, (_, i) => [-165 + i * 30, -460] as Pt), 5, [th.bulb, '#fff', st === 'princess' ? '#ffd24a' : th.alt], on);
    s += bulbsAlong(Array.from({ length: 12 }, (_, i) => [-165 + i * 30, -384] as Pt), 5, ['#fff', th.bulb], on);
    if (st === 'princess') s += G(at(0, -462), P('M-36 0 L-36 -36 L-18 -16 L0 -46 L18 -16 L36 -36 L36 0Z', GOLD) + C(0, -48, 6, '#ff7eb6'));
    else s += flag(-150, -470, th.alt, 40) + flag(150, -470, th.alt, 40, 0.7);
    // bunting between the pillars and balloons tied on
    const bunt: Pt[] = Array.from({ length: 9 }, (_, i) => [-210 + i * 52.5, -360 + Math.sin((i / 8) * Math.PI) * 40] as Pt);
    s += S(polyD(smooth(bunt, 3)), '#fff', 2) + bunt.map(([x, y], i) => P(pd`M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 30}Z`, (st === 'rainbow' ? RAINBOW : th.cols)[i % 6])).join('');
    for (const [x, col] of [[-300, '#ffd36b'], [-286, '#7cc8ff'], [300, '#ff9ec7'], [288, '#7fe0b0']] as [number, string][]) s += A(bob(0, -8, 2.6, x * 0.01), Ln(x < 0 ? -290 : 290, -200, x, -270, '#9aa3b5', 1.5) + E(x, -292, 18, 22, col) + E(x - 6, -300, 4, 7, '#fff', O(0.5)));
    return s;
  }, { toggle: true });
});

const FENCES: FurnDef[] = (['sweet', 'candy'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkfence-${st}`, st === 'sweet' ? 'Park Fence' : 'Candy Cane Fence', 'Park Fences', st, 'floor', 320, 130, (c) => {
    let s = '';
    if (st === 'candy') {
      s += R(-150, -70, 300, 10, 5, th.alt) + R(-150, -36, 300, 10, 5, th.alt);
      for (let i = 0; i < 6; i++) { const x = -135 + i * 54; s += candyStripe(x - 7, -100, 14, 100, '#fff', th.deep, 8) + S(pd`M${x} -96 Q${x} -122 ${x + 18} -118 Q${x + 26} -114 ${x + 24} -102`, th.deep, 12) + S(pd`M${x} -96 Q${x} -122 ${x + 18} -118 Q${x + 26} -114 ${x + 24} -102`, '#fff', 4, 'stroke-dasharray="5 7"'); }
    } else {
      s += R(-150, -76, 300, 12, 6, dark(c, 0.08)) + R(-150, -38, 300, 12, 6, dark(c, 0.08));
      for (let i = 0; i < 7; i++) { const x = -132 + i * 44; s += P(pd`M${x - 14} 0 L${x - 14} -96 L${x} -112 L${x + 14} -96 L${x + 14} 0Z`, i % 2 ? '#fff' : c) + P(heartD(x, -94, 6), i % 2 ? c : '#fff'); }
    }
    return s;
  });
});

const LAMPS: FurnDef[] = (['sweet', 'space'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parklamp-${st}`, st === 'sweet' ? 'Park Lamp Post' : 'Star Lamp Post', 'Lamp Posts', st, 'floor', 140, 340, (c, on) => {
    let s = E(0, -6, 30, 8, '#4a4a5e') + R(-8, -280, 16, 274, 6, st === 'space' ? th.main : c) + R(-8, -280, 5, 274, 3, '#fff', O(0.3)) + R(-18, -40, 36, 34, 8, st === 'space' ? th.deep : dark(c, 0.15));
    if (st === 'space') {
      s += (on ? glow(0, -300, 110) + `<circle cx="0" cy="-300" r="40" fill="#fff6c8" opacity="0.4">${blink(2, 0, 0.15, 0.45)}</circle>` : '') + P(starD(0, -300, 34), on ? '#fff6a0' : th.trim) + C(0, -300, 10, '#fff', O(on ? 0.9 : 0.5));
      s += A(on ? turn(0, -300, 8) : '', [0, 1, 2, 3].map((i) => C(Math.cos(i * 1.57) * 50, -300 + Math.sin(i * 1.57) * 50, 5, '#8ff3ff')).join(''));
    } else {
      for (const x of [-46, 46]) s += S(pd`M0 -260 Q${x} -270 ${x} -240`, c, 6) + (on ? glow(x, -220, 70) : '') + P(pd`M${x - 16} -240 L${x + 16} -240 L${x + 10} -200 L${x - 10} -200Z`, on ? '#fff6c8' : '#fff', O(0.95)) + R(x - 18, -246, 36, 8, 4, c) + C(x, -198, 5, c);
      s += P(heartD(0, -296, 16), th.deep) + P(heartD(0, -293, 8), '#fff', O(0.5)) + G(at(0, -150, 0.5), bowG(0, 0, 1, th.deep));
    }
    return s;
  }, { toggle: true });
});

const PLANTERS: FurnDef[] = (['sweet', 'rainbow'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkplanter-${st}`, st === 'sweet' ? 'Flower Planter' : 'Rainbow Planter', 'Planters', st, 'floor', 230, 170, (c) => {
    const se = artCtx.season;
    let s = box(-100, -70, 200, 70, 14, st === 'rainbow' ? '#fff' : c) + R(-110, -80, 220, 18, 9, st === 'rainbow' ? '#7cc8ff' : dark(c, 0.1));
    if (st === 'rainbow') RAINBOW.forEach((col, i) => { s += R(-90 + i * 30, -54, 30, 10, 0, col); });
    else s += P(heartD(0, -50, 14), '#fff');
    s += E(0, -82, 100, 14, '#8a5a3c');
    if (se === 'winter') return s + E(0, -88, 104, 16, '#fff') + E(-40, -96, 30, 10, '#fff') + [-60, 0, 60].map((x) => S(pd`M${x} -86 L${x - 10} -130 M${x} -86 L${x + 12} -124`, '#8a5a3c', 4)).join('');
    const cols = se === 'fall' ? ['#ff8a3d', '#ffc23d', '#e8573d', '#c94f2f'] : st === 'rainbow' ? RAINBOW : [c, '#fff', th.deep, '#ffd36b'];
    for (let i = 0; i < 7; i++) {
      const x = -84 + i * 28;
      const y = -112 - (i % 2) * 22;
      s += Ln(x, -82, x, y, '#4fae7a', 4) + E(x - 8, -96, 10, 5, LEAF, `transform="rotate(-30 ${x - 8} -96)"`) + flowerG(x, y, 12, cols[i % cols.length]);
    }
    if (se === 'fall') s += E(-60, -88, 18, 14, '#ff8a3d') + R(-62, -104, 4, 8, 2, '#5fae6b');
    return s;
  });
});

const BENCHES: FurnDef[] = (['sweet', 'candy'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkbench-${st}`, st === 'sweet' ? 'Heart Bench' : 'Candy Bench', 'Park Benches', st, 'floor', 280, 190, (c) => {
    let s = '';
    if (st === 'candy') s += candyStripe(-130, -96, 260, 22, '#fff', c, 2) + C(-120, -170, 34, th.alt) + C(120, -170, 34, '#fff3b0') + S('M-120 -170 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0', '#fff', 4) + S('M120 -170 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0', '#ff7eb6', 4) + R(-100, -176, 200, 20, 10, c) + R(-100, -144, 200, 20, 10, '#fff');
    else s += P(heartD(0, -186, 44), c) + R(-120, -160, 240, 20, 10, c) + R(-120, -132, 240, 20, 10, light(c, 0.2)) + P(heartD(0, -178, 22), '#fff', O(0.6));
    s += box(-130, -96, 260, 22, 10, st === 'candy' ? th.deep : dark(c, 0.06), 'none', 'y');
    for (const x of [-100, 100]) s += R(x - 6, -76, 12, 76, 5, '#4a4a5e') + R(x - 14, -6, 28, 8, 4, '#4a4a5e');
    return s;
  }, { seats: [{ x: -60, y: -96, pose: 'sit' }, { x: 60, y: -96, pose: 'sit' }] });
});

const FOUNTAINS: FurnDef[] = (['sweet', 'princess'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkfountain-${st}`, st === 'sweet' ? 'Heart Fountain' : 'Royal Fountain', 'Fountains', st, 'floor', 320, 300, (c) => {
    const frozen = artCtx.season === 'winter';
    const stone = st === 'princess' ? '#fff3f8' : light(c, 0.25);
    let s = E(0, -40, 150, 34, dark(stone, 0.12)) + R(-150, -70, 300, 50, 20, stone) + E(0, -70, 150, 22, light(stone, 0.2)) + E(0, -70, 132, 16, frozen ? '#e6f4ff' : WATER);
    s += R(-14, -200, 28, 130, 8, stone) + E(0, -200, 70, 16, stone) + E(0, -204, 60, 10, frozen ? '#e6f4ff' : WATER);
    s += st === 'princess' ? G(at(0, -212), P('M-26 0 L-26 -30 L-13 -14 L0 -40 L13 -14 L26 -30 L26 0Z', GOLD)) : P(heartD(0, -250, 30), c) + P(heartD(0, -246, 16), '#fff', O(0.5));
    s += R(-150, -40, 300, 10, 5, st === 'princess' ? GOLD : th.deep, O(0.8));
    if (frozen) return s + E(0, -206, 66, 12, '#fff') + [-90, 0, 90].map((x) => P(pd`M${x - 8} -72 L${x} -50 L${x + 8} -72Z`, '#dff2ff')).join('');
    for (const [x0, x1, dur] of [[-30, -110, 1.2], [30, 110, 1.3], [-20, -60, 1], [20, 60, 1.1]]) {
      s += `<path d="${pd`M${x0} -210 Q${(x0 + x1) / 2} -290 ${x1} -76`}" fill="none" stroke="#bfe6ff" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 12" opacity="0.9"><animate attributeName="stroke-dashoffset" values="0;-52" dur="${dur}s" repeatCount="indefinite"/></path>`;
    }
    s += `<circle cx="0" cy="-236" r="8" fill="#e6f6ff"><animate attributeName="cy" values="-210;-260;-210" dur="0.8s" repeatCount="indefinite"/></circle>`;
    return s;
  });
});

const PHOTO: FurnDef[] = (['princess', 'space'] as const).map((st) => {
  const th = TH[st];
  return it(`f-photoboard-${st}`, st === 'princess' ? 'Princess Photo Board' : 'Astronaut Photo Board', 'Photo Boards', st, 'floor', 260, 360, (c) => {
    // a painted board with a face hole to peek through
    const hole = 'M0 -282 m-38 0 a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0';
    const board = `M-120 -340 L120 -340 L120 -20 L-120 -20Z ${hole}`;
    let s = R(-100, -20, 12, 20, 4, '#a86b4a') + R(88, -20, 12, 20, 4, '#a86b4a');
    s += P(board, st === 'space' ? th.deep : '#bfe6ff', 'fill-rule="evenodd"');
    if (st === 'space') {
      for (const [x, y, z] of [[-90, -310, 8], [90, -300, 10], [-80, -120, 6], [96, -150, 7]]) s += P(sparkleD(x, y, z), th.trim);
      s += P('M-70 -240 Q-74 -60 -60 -40 L60 -40 Q74 -60 70 -240 Q0 -226 -70 -240Z', '#f6f8fc') + R(-40, -190, 80, 50, 10, '#c9cfdd') + C(-20, -166, 8, '#ff7eb6') + C(4, -166, 8, '#7cc8ff') + C(26, -166, 6, th.trim);
      s += P(hole.replace('a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0', 'a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0'), 'none', 'stroke="#f6f8fc" stroke-width="16"') + C(80, -320, 18, '#ffd36b') + E(80, -320, 30, 7, 'none', 'stroke="#ff9ec7" stroke-width="3"');
    } else {
      s += P('M-90 -40 Q-60 -200 -30 -232 L30 -232 Q60 -200 90 -40Z', c) + P('M-90 -40 Q-60 -200 -30 -232 L30 -232 Q60 -200 90 -40Z', SHX) + S('M-80 -80 Q0 -60 80 -80', '#fff', 6);
      s += P('M-30 -232 Q0 -214 30 -232 L24 -250 L-24 -250Z', light(c, 0.3)) + G(at(0, -322), P('M-30 0 L-30 -30 L-15 -14 L0 -40 L15 -14 L30 -30 L30 0Z', GOLD));
      s += P(hole, 'none', 'stroke="#ffd9b8" stroke-width="10"') + flowerG(-60, -120, 12, '#fff') + flowerG(50, -100, 12, '#fff');
    }
    s += R(-120, -340, 240, 320, 12, 'none', `stroke="${st === 'space' ? th.trim : GOLD}" stroke-width="8"`);
    return s;
  });
});

const BUNTING: FurnDef[] = (['sweet', 'rainbow', 'candy'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkbunting-${st}`, { sweet: 'Heart Bunting', rainbow: 'Rainbow Flags', candy: 'Candy Bunting' }[st], 'Park Bunting', st, 'wall', 420, 110, (c) => {
    const pts: Pt[] = Array.from({ length: 9 }, (_, i) => [-180 + i * 45, -40 + Math.sin((i / 8) * Math.PI) * 36] as Pt);
    let s = C(-200, -44, 6, '#9aa3b5') + C(200, -44, 6, '#9aa3b5') + S(polyD(smooth([[-200, -44], ...pts, [200, -44]], 3)), '#9aa3b5', 2.5);
    pts.forEach(([x, y], i) => {
      const col = st === 'rainbow' ? RAINBOW[i % 6] : st === 'candy' ? th.cols[i % 4] : i % 2 ? '#fff' : c;
      s += A(`<animateTransform attributeName="transform" type="rotate" values="-6 ${f(x)} ${f(y)};6 ${f(x)} ${f(y)};-6 ${f(x)} ${f(y)}" dur="${f(2 + (i % 3) * 0.4)}s" repeatCount="indefinite"/>`, st === 'sweet' ? P(heartD(x, y + 2, 20), col) : P(pd`M${x - 18} ${y} L${x + 18} ${y} L${x} ${y + 40}Z`, col) + (st === 'candy' ? C(x, y + 12, 5, '#fff') : ''));
    });
    return s;
  });
});

const BINS: FurnDef[] = (['sweet', 'rainbow'] as const).map((st) => {
  const th = TH[st];
  return it(`f-parkbin-${st}`, st === 'sweet' ? 'Heart Trash Can' : 'Rainbow Trash Can', 'Trash Cans', st, 'floor', 110, 150, (c) => {
    let s = P('M-40 -110 L40 -110 L32 0 L-32 0Z', st === 'rainbow' ? '#fff' : c) + P('M-40 -110 L40 -110 L32 0 L-32 0Z', SHX);
    if (st === 'rainbow') RAINBOW.forEach((col, i) => { s += R(-38 + i * 1.3, -100 + i * 15, 76 - i * 2.6, 9, 0, col); });
    else s += P(heartD(0, -70, 18), '#fff') + Ln(-28, -20, 28, -20, '#fff', 4);
    s += box(-48, -128, 96, 22, 11, st === 'rainbow' ? '#7cc8ff' : th.deep) + R(-12, -140, 24, 14, 7, '#fff') + cute(0, -42, 0.7);
    return s;
  });
});

const MAPSIGN: FurnDef[] = [
  it('f-parkmap-sweet', 'Park Map', 'Park Signs', 'sweet', 'floor', 300, 340, (c) => {
    let s = R(-110, -260, 14, 260, 5, '#a86b4a') + R(96, -260, 14, 260, 5, '#a86b4a');
    s += box(-140, -320, 280, 220, 16, '#fff') + R(-128, -308, 256, 196, 10, '#c9f2b8');
    s += S('M-110 -130 Q-60 -200 0 -180 Q60 -160 70 -240 Q80 -280 110 -290', '#f4dca0', 14) + E(-60, -270, 26, 14, WATER);
    // tiny rides on the map
    s += C(70, -250, 26, 'none', `stroke="${c}" stroke-width="4"`) + Ln(70, -250, 70, -224, c, 3) + P('M-30 -150 L0 -176 L30 -150Z', th('sweet').deep) + R(-26, -150, 52, 16, 3, '#fff');
    s += S('M-110 -240 Q-90 -290 -60 -230 Q-40 -200 -20 -260', '#ff7a7a', 4) + P(starD(100, -160, 10), '#ffd36b') + P(heartD(-100, -170, 9), '#ff7eb6');
    s += C(-20, -210, 9, '#ff4f6d') + C(-20, -210, 4, '#fff') + txt(-20, -228, 'YOU', 12, '#ff4f6d');
    s += box(-90, -340, 180, 38, 14, c) + txt(0, -313, 'PARK MAP', 22, '#fff');
    return s;
  }),
];
function th(id: string): Theme { return TH[id]; }

const PARK: FurnDef[] = [...BOOTHS, ...CARTS, ...POPCORN, ...BALLOONS, ...GAMES, ...PRIZES, ...GATES, ...FENCES, ...LAMPS, ...PLANTERS, ...BENCHES, ...FOUNTAINS, ...PHOTO, ...BUNTING, ...BINS, ...MAPSIGN];

// =====================================================================================
// TREATS AND PRIZES the carts and booths hand out
// =====================================================================================
const prop = (id: string, name: string, cat: FurnCat, group: string, w: number, h: number, art: Art, extra: Partial<FurnDef> = {}): FurnDef =>
  ({ id, name, cat, group, price: -1, mount: 'prop', w, h, art, food: cat === 'food', ...extra });
const TREATS: FurnDef[] = [
  prop('cottonCandy', 'Cotton Candy', 'food', 'Park Treats', 60, 100, () => R(-3, -50, 6, 50, 3, '#fff3d6') + C(-10, -70, 18, '#ffb3d6') + C(12, -74, 18, '#ffc8e2') + C(0, -88, 18, '#ff9ec7') + C(-4, -64, 14, '#ffd0e6') + C(-8, -84, 5, '#fff', O(0.6)), { color: '#ff9ec7' }),
  prop('caramelApple', 'Caramel Apple', 'food', 'Park Treats', 50, 90, () => R(-3, -86, 6, 40, 3, '#e8c88a') + C(0, -28, 22, '#e8384f') + P('M-22 -34 Q0 -50 22 -34 Q24 -20 18 -16 Q12 -24 6 -14 Q0 -22 -6 -14 Q-12 -24 -18 -16 Q-24 -20 -22 -34Z', '#d9903d') + [[-10, -40, '#ff9ec7'], [6, -42, '#7cc8ff'], [12, -34, '#ffd36b']].map(([x, y, col]) => R(x as number, y as number, 5, 2.4, 1, col as string)).join('') + C(-8, -24, 5, '#fff', O(0.4)), { color: '#e8384f' }),
  prop('pretzel', 'Pretzel', 'food', 'Park Treats', 70, 60, () => S('M0 -20 C-30 -54 -40 -14 -14 -10 C10 -6 22 -30 0 -40 C-22 -30 -10 -6 14 -10 C40 -14 30 -54 0 -20', '#c98a3d', 11) + S('M0 -20 C-30 -54 -40 -14 -14 -10 C10 -6 22 -30 0 -40', '#e0a85a', 4, O(0.6)) + [[-20, -34], [16, -36], [0, -14], [-28, -16], [26, -18]].map(([x, y]) => R(x, y, 3, 2, 1, '#fff')).join(''), { color: '#c98a3d' }),
  prop('snowCone', 'Snow Cone', 'food', 'Park Treats', 50, 90, () => P('M-20 -40 L20 -40 L8 0 L-8 0Z', '#fff') + S('M-16 -30 L16 -30 M-12 -18 L12 -18', '#7cc8ff', 3) + C(-8, -50, 15, '#ff7eb6') + C(8, -52, 15, '#7cc8ff') + C(0, -64, 14, '#ffd36b') + C(-4, -66, 4, '#fff', O(0.6)), { color: '#7cc8ff' }),
  prop('churro', 'Churro', 'food', 'Park Treats', 50, 100, () => P('M-16 -30 L16 -30 L12 0 L-12 0Z', '#ff9ec7') + R(-8, -92, 16, 70, 8, '#d9903d') + [0, 1, 2, 3, 4].map((i) => Ln(-6, -84 + i * 13, 6, -78 + i * 13, '#b06f2a', 2)).join('') + [[-4, -70], [3, -56], [-2, -44]].map(([x, y]) => C(x, y, 1.6, '#fff8e0')).join(''), { color: '#d9903d' }),
  prop('parkPopcorn', 'Popcorn', 'food', 'Park Treats', 56, 80, () => P('M-22 -50 L22 -50 L16 0 L-16 0Z', '#fff') + [-14, -2, 10].map((x) => P(pd`M${x - 4} -50 L${x + 4} -50 L${x + 3} 0 L${x - 3} 0Z`, '#ff4f6d')).join('') + [[-14, -56], [0, -60], [14, -56], [-6, -68], [8, -70], [0, -78]].map(([x, y]) => C(x, y, 9, '#fff8e0') + C(x + 2, y - 2, 4, '#ffe08a')).join(''), { color: '#ff4f6d' }),
  prop('parkBalloon', 'Balloon', 'toys', 'Park Prizes', 60, 130, () => S('M0 0 Q-10 -30 0 -60', '#9aa3b5', 1.5) + A(bob(4, -6, 2.4), E(0, -92, 26, 32, '#ff7eb6') + E(-8, -102, 6, 10, '#fff', O(0.5)) + P('M-5 -60 L5 -60 L0 -66Z', '#ff7eb6')) + R(-8, -6, 16, 8, 3, '#c9cfdd'), { color: '#ff7eb6', sfx: 'squeak' }),
  prop('parkTicket', 'Ride Ticket', 'toys', 'Park Prizes', 70, 40, () => P('M-30 -34 L30 -34 Q26 -20 30 -6 L-30 -6 Q-26 -20 -30 -34Z', '#ffd36b') + S('M-18 -32 L-18 -8', '#ff9ec7', 2, 'stroke-dasharray="3 3"') + P(starD(8, -20, 9), '#ff7eb6'), { color: '#ffd36b' }),
  prop('prizeBunny', 'Prize Bunny', 'toys', 'Park Prizes', 70, 110, () => plush(0), { color: '#fff3f8', sfx: 'squeak' }),
  prop('prizeBear', 'Prize Bear', 'toys', 'Park Prizes', 70, 90, () => plush(1), { color: '#c98a5a', sfx: 'squeak' }),
  prop('prizeUnicorn', 'Prize Unicorn', 'toys', 'Park Prizes', 70, 100, () => plush(2), { color: '#ffffff', sfx: 'squeak' }),
];

// =====================================================================================
// CATALOG
// =====================================================================================
const ALL: FurnDef[] = [...RIDES, ...PARK, ...TREATS];
// Prices climb within each catalog section; the first design of each is free.
const seen: Record<string, number> = {};
for (const d of ALL) {
  const k = d.group ?? '';
  const i = seen[k] ?? 0;
  seen[k] = i + 1;
  if (d.price >= 0) continue;
  if (d.mount === 'prop') d.price = i === 0 ? 0 : 10;
  else if (RIDE_GROUPS.has(k)) d.price = i === 0 ? 0 : stylePrice(i + 1, 40, 15, 200);
  else d.price = i === 0 ? 0 : stylePrice(i + 1, 20, 10, 120);
}
export const RIDES_MORE: FurnDef[] = ALL;

// =====================================================================================
// TOWN MAP FRONT: the theme park entrance, with the rides peeking over the gate.
// =====================================================================================
const roofSnow = (d: string, s: Season) => (s === 'winter' ? P(d, '#ffffff') + P(d, SHY, O(0.4)) : '');
const bush = (x: number, y: number, s: number, c: string) => G(at(x, y, s), C(-26, -20, 26, dark(c, 0.06)) + C(22, -18, 24, dark(c, 0.06)) + C(0, -32, 30, c) + C(-8, -42, 10, '#fff', O(0.18)));
function seasonPatch(x: number, s: Season): string {
  if (s === 'winter') return bush(x, 0, 0.8, '#e8f0fa') + E(x, -38, 24, 8, '#fff');
  if (s === 'fall') return bush(x, 0, 0.8, '#d98a3d') + G(at(x + 26, 4), E(-12, -18, 14, 18, '#ff8a3d') + E(12, -18, 14, 18, '#ff8a3d') + E(0, -18, 15, 20, '#ffab5e') + R(-2, -42, 4, 8, 2, '#5fae6b')) + E(x - 30, -2, 7, 4, '#e8573d') + E(x + 6, 2, 6, 3, '#ffc23d');
  return bush(x, 0, 0.8, '#5fc47c') + [-20, 0, 18].map((dx, i) => flowerG(x + dx, -40 - (i % 2) * 10, 8, ['#ff7eb6', '#ffd36b', '#fff'][i])).join('');
}
function themepark(s: Season): string {
  let g = E(0, 4, 290, 20, 'url(#g-ground)');
  // ferris wheel behind (it turns, cabins stay upright)
  const [wx, wy, wr] = [-110, -390, 150];
  g += Ln(-190, -120, wx, wy, '#e0659b', 14) + Ln(-30, -120, wx, wy, '#e0659b', 14);
  let w = C(wx, wy, wr, 'none', 'stroke="#ff9ec7" stroke-width="10"') + C(wx, wy, wr - 24, 'none', 'stroke="#ffd9e8" stroke-width="4"');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; w += Ln(wx, wy, wx + wr * Math.cos(a), wy + wr * Math.sin(a), '#fff', 3); }
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) * Math.PI) / 6; w += `<circle cx="${f(wx + wr * Math.cos(a))}" cy="${f(wy + wr * Math.sin(a))}" r="4.5" fill="#fff3a0">${blink(1, (i % 3) * 0.33, 0.35)}</circle>`; }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const [x, y] = [wx + wr * Math.cos(a), wy + wr * Math.sin(a)];
    const col = RAINBOW[i % 6];
    w += A(turn(x, y, 20, -1), Ln(x, y, x, y + 10, '#9aa3b5', 3) + box(x - 22, y + 8, 44, 34, 12, col) + R(x - 16, y + 12, 32, 12, 5, '#e8f6ff') + (s === 'winter' ? R(x - 24, y + 4, 48, 8, 4, '#fff') : ''));
  }
  w += C(wx, wy, 22, '#fff') + P(heartD(wx, wy - 10, 12), '#ff7eb6');
  g += A(turn(wx, wy, 20), w);
  // coaster on the right with a loop
  const track = smooth([[40, -170], [90, -300], [140, -420], [190, -380], [215, -270], [250, -210], [300, -250], [300, -330], [255, -350], [232, -300], [262, -230], [300, -180]], 5);
  for (const [x, y] of track.filter((_, i) => i % 6 === 3)) if (x < 230 || x > 305) g += R(x - 3, y + 6, 6, -y - 6, 2, '#fff');
  g += S(polyD(track), '#9b6bff', 12, '') + S(polyD(track), '#fff', 3, O(0.7));
  g += `<g>${'<animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path="' + polyD(track) + '"/>'}${R(-14, -20, 28, 14, 5, '#ffd36b')}${C(-6, -24, 5, '#ff9ec7')}${C(6, -24, 5, '#7cc8ff')}</g>`;
  // carousel roof on the left
  const top = 'M-290 -230 L-215 -300 L-140 -230Z';
  g += R(-280, -232, 130, 110, 6, '#fff3f8') + P(top, '#ff7eb6') + P('M-265 -230 L-215 -300 L-240 -230Z M-190 -230 L-215 -300 L-165 -230Z', '#fff') + roofSnow('M-292 -228 L-215 -302 L-138 -228 Q-215 -240 -292 -228Z', s);
  g += scallops(-290, -140, -232, 6, 14, ['#ff7eb6', '#fff']) + flag(-215, -300, '#ffd36b', 30);
  for (const [x, ph] of [[-250, 0], [-180, 0.8]] as Pt[]) g += A(lift(14, 2.4, ph), G(at(x, -170, 0.38), steed('horse', ph ? '#c99bff' : '#ffd36b', TH.sweet)));
  // fence along the front
  for (let i = 0; i < 12; i++) { const x = -280 + i * 51; if (x > -190 && x < 190) continue; g += R(x - 8, -90, 16, 90, 6, '#fff') + C(x, -92, 9, i % 2 ? '#ff9ec7' : '#7cc8ff'); }
  g += R(-290, -70, 110, 10, 5, '#ffd9e8') + R(180, -70, 110, 10, 5, '#ffd9e8');
  // the entrance arch
  for (const x of [-150, 150]) g += box(x - 30, -270, 60, 270, 10, '#ff9ec7') + R(x - 22, -262, 10, 254, 5, '#fff', O(0.35)) + candyStripe(x - 30, -30, 60, 30, '#fff', '#e0659b', 2) + C(x, -290, 22, '#e0659b') + P(heartD(x, -300, 14), '#fff') + roofSnow(pd`M${x - 22} -300 Q${x} -322 ${x + 22} -300Z`, s);
  g += S('M-170 -250 Q0 -420 170 -250', '#e0659b', 26) + S('M-170 -250 Q0 -420 170 -250', '#fff', 6, 'stroke-dasharray="2 22"');
  g += box(-130, -380, 260, 66, 26, '#fff') + R(-120, -372, 240, 50, 20, '#ffd9e8') + txt(0, -336, 'THEME PARK', 34, '#e0659b', '#fff');
  for (let i = 0; i < 10; i++) g += `<circle cx="${f(-112 + i * 24.9)}" cy="-380" r="5" fill="#fff3a0"><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="${f(-(i % 3) * 0.3)}s" repeatCount="indefinite"/></circle>`;
  g += roofSnow('M-132 -372 Q-128 -386 -100 -386 L100 -386 Q128 -386 132 -372 Q60 -380 0 -376 Q-60 -380 -132 -372Z', s);
  g += flag(-100, -384, '#7cc8ff', 34) + flag(100, -384, '#ffd36b', 34, 0.6);
  // open gates and a path inside
  g += P('M-120 0 L120 0 L80 -100 L-80 -100Z', s === 'winter' ? '#f0f4fb' : '#f4dca0', O(0.9));
  g += P('M-120 0 L-120 -160 L-78 -170 L-78 -14Z', '#fff', O(0.8)) + P('M120 0 L120 -160 L78 -170 L78 -14Z', '#fff', O(0.8));
  for (const x of [-108, -92, 92, 108]) g += Ln(x, -6, x, -158, '#ffb3d1', 4);
  // ticket booth and balloon seller at the side
  g += box(190, -150, 80, 150, 10, '#7cc8ff') + R(200, -130, 60, 44, 8, '#e8f6ff') + awning(180, 280, -176, 26, 4, '#fff', '#5ab0ef') + txt(230, -60, 'TIX', 18, '#fff');
  for (const [x, y, col] of [[-212, -150, '#ff7eb6'], [-236, -164, '#ffd36b'], [-196, -176, '#7fe0b0']] as [number, number, string][]) g += A(bob(4, -6, 2.4, x * 0.01), Ln(-214, -80, x, y + 22, '#9aa3b5', 1.5) + E(x, y, 14, 18, col) + E(x - 4, y - 6, 3, 5, '#fff', O(0.5)));
  // season touches
  g += seasonPatch(-250, s) + seasonPatch(250, s);
  if (s === 'winter') g += [[-60, -460], [60, -440], [-260, -330], [200, -460], [-180, -510], [250, -380]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"><animate attributeName="cy" values="${y};${y + 120}" dur="${3 + (i % 3)}s" repeatCount="indefinite"/></circle>`).join('');
  if (s === 'fall') g += [[-40, -200], [40, -150], [200, -220]].map(([x, y], i) => A(bob(16, 40, 3 + i, i), E(x, y, 8, 4, ['#ff8a3d', '#e8573d', '#ffc23d'][i], `transform="rotate(30 ${x} ${y})"`))).join('');
  if (s === 'summer') g += C(250, -500, 30, '#ffe066', O(0.9)) + C(250, -500, 44, '#ffe066', O(0.25));
  return g;
}

/** Town-map building fronts: base centre at (0,0), drawn upward; h is the height for the name tag. */
export const RIDES_FACADES: Record<string, { h: number; art: (s: Season) => string }> = {
  themepark: { h: 560, art: themepark },
};
