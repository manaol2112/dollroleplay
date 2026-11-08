// The shops catalog: the grocery shop, the restaurant and the shopping mall, plus their town-map
// building fronts. Every type comes in several design collections from FURN_STYLES, and each
// collection changes the shape and the little details, not only the colors.
import type { Season } from '../../types';
import {
  type FurnCat, type FurnDef, type FurnStyle, type Mount, type SeatDef,
  C, E, FURN_STYLE_BY_ID, Ln, P, R, WOOD, WOOD_D, bowG, box, cloth, dark, f, flame, flowerG, glow, heartD, leg, light, motif, sparkleD, starD, stylePrice,
} from './kit';

// ---------------- drawing helpers ----------------
const ST = FURN_STYLE_BY_ID;
const SIL = 'url(#g-silver)';
const GOLD = 'url(#g-gold)';
const GLASS = 'url(#g-glass)';
const INK = '#2d2a3a';
const IRON = '#4a4048';
const WATER = '#9fe0ff';
const RAIN = ['#ff7eb6', '#ffab5e', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff'];
const CANDY = ['#ff4f8b', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ffffff'];
const PACK = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b', '#e85d5d', '#a8e6cf'];
const SPL = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';

const S = (d: string, c: string, w = 3, extra = '') => P(d, 'none', `stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
const op = (o: number) => `opacity="${o}"`;
const stroked = (c: string, w: number) => `stroke="${c}" stroke-width="${f(w)}"`;
const gloss = (x: number, y: number, w: number, h: number, o = 0.38) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', op(o));
const knob = (x: number, y: number, r: number, col: string) => C(x, y, r, col) + C(x - r * 0.32, y - r * 0.32, r * 0.36, '#fff', op(0.65));
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const tr = (x: number, y: number, inner: string, s = 1, rot = 0) =>
  `<g transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${s.toFixed(3)})` : ''}">${inner}</g>`;
const txt = (x: number, y: number, size: number, col: string, t: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" text-anchor="middle" fill="${col}" ${extra}>${t}</text>`;
/** Rounded rectangle with different top and bottom corner radii. */
function rrD(x: number, y: number, w: number, h: number, rt: number, rb: number): string {
  rt = Math.min(rt, w / 2, h / 2); rb = Math.min(rb, w / 2, h / 2);
  return `M${f(x + rt)} ${f(y)} H${f(x + w - rt)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rt)} V${f(y + h - rb)} Q${f(x + w)} ${f(y + h)} ${f(x + w - rb)} ${f(y + h)} H${f(x + rb)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rb)} V${f(y + rt)} Q${f(x)} ${f(y)} ${f(x + rt)} ${f(y)}Z`;
}
/** A shape with an arched top of height a. */
const archD = (x: number, y: number, w: number, h: number, a: number) =>
  `M${f(x)} ${f(y + h)} V${f(y + a)} C${f(x)} ${f(y + a * 0.45)} ${f(x + w * 0.22)} ${f(y)} ${f(x + w / 2)} ${f(y)} C${f(x + w * 0.78)} ${f(y)} ${f(x + w)} ${f(y + a * 0.45)} ${f(x + w)} ${f(y + a)} V${f(y + h)}Z`;
/** A top band (from y to y+b) with icing drips hanging below it. */
function dripD(x: number, y: number, w: number, b: number, depth: number, n: number, seed = 0): string {
  const sw = w / n;
  let d = `M${f(x)} ${f(y)} H${f(x + w)} V${f(y + b)}`;
  for (let i = n - 1; i >= 0; i--) {
    const cx = x + (i + 0.5) * sw;
    const r = Math.min(sw * 0.2, 7);
    const dd = b + depth * (0.3 + 0.7 * rnd(i + seed));
    d += ` Q${f(cx + sw * 0.35)} ${f(y + b + 2)} ${f(cx + r)} ${f(y + b + 3)} V${f(y + dd - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx - r)} ${f(y + dd - r)} V${f(y + b + 3)} Q${f(cx - sw * 0.35)} ${f(y + b + 2)} ${f(x + i * sw)} ${f(y + b)}`;
  }
  return d + 'Z';
}
function sprinkles(x: number, y: number, w: number, h: number, n: number, seed = 0): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const px = x + rnd(i * 3 + seed) * w, py = y + rnd(i * 3 + 1 + seed) * h, a = Math.round(rnd(i * 3 + 2 + seed) * 180);
    s += `<rect x="${f(px - 3.5)}" y="${f(py - 1.2)}" width="7" height="2.6" rx="1.3" fill="${CANDY[i % 5]}" transform="rotate(${a} ${f(px)} ${f(py)})"/>`;
  }
  return s;
}
const blinkC = (x: number, y: number, r: number, col: string, dur: number, begin = 0) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"><animate attributeName="opacity" values="1;0.25;1" dur="${dur}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"/></circle>`;
const bob = (inner: string, amp = 2, dur = 2.4, begin = 0) =>
  `<g>${inner}<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f(-amp)};0 0" dur="${dur}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite" ${SPL}/></g>`;
const sway = (cx: number, cy: number, deg: number, dur: number, inner: string, begin = 0) =>
  `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${-deg} ${f(cx)} ${f(cy)};${deg} ${f(cx)} ${f(cy)};${-deg} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite" ${SPL}/></g>`;
const pulse = (inner: string, dur = 1.6) => `<g>${inner}<animate attributeName="opacity" values="1;0.55;1" dur="${dur}s" repeatCount="indefinite"/></g>`;
/** Soft rising steam puffs. */
function steam(x: number, y: number, s = 1): string {
  return [0, 1, 2].map((i) => `<circle cx="${f(x + (i - 1) * 6 * s)}" cy="${f(y)}" r="${f(5 * s)}" fill="#fff" opacity="0"><animate attributeName="cy" values="${f(y)};${f(y - 34 * s)}" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="r" values="${f(4 * s)};${f(10 * s)}" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('');
}
/** Cold mist rolling out of an open freezer and sinking down. */
function chill(x: number, y: number, w: number): string {
  return [0, 1, 2, 3].map((i) => {
    const cx = x - w / 2 + (i + 0.5) * (w / 4), b = (i * 0.5).toFixed(1);
    return `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="14" ry="8" fill="#eaf8ff" opacity="0"><animate attributeName="cy" values="${f(y)};${f(y + 46)}" dur="2s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="rx" values="10;${f(w / 5)}" dur="2s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" dur="2s" begin="${b}s" repeatCount="indefinite"/></ellipse>`;
  }).join('');
}
const leaf = (x: number, y: number, s: number, rot: number, col = '#6fc47c') =>
  `<path d="M0 0 C${f(4 * s)} ${f(-8 * s)} ${f(14 * s)} ${f(-8 * s)} ${f(18 * s)} 0 C${f(14 * s)} ${f(6 * s)} ${f(4 * s)} ${f(6 * s)} 0 0Z" fill="${col}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"/>`;
/** Little wood-grain swirls. */
function grain(x: number, y: number, w: number, h: number, c: string, seed = 0): string {
  let s = '';
  const n = Math.max(1, Math.round(h / 22));
  for (let i = 0; i < n; i++) {
    const yy = y + ((i + 0.5) * h) / n, x1 = x + w * (0.08 + rnd(i + seed) * 0.2), x2 = x + w * (0.6 + rnd(i + seed + 7) * 0.32);
    s += S(`M${f(x1)} ${f(yy)} Q${f((x1 + x2) / 2)} ${f(yy - 4)} ${f(x2)} ${f(yy)}`, c, 1.6, op(0.55));
  }
  return s;
}
const planksV = (x: number, y: number, w: number, h: number, n: number, c: string) =>
  Array.from({ length: n - 1 }, (_, i) => Ln(x + ((i + 1) * w) / n, y + 3, x + ((i + 1) * w) / n, y + h - 3, c, 2)).join('');
const planksH = (x: number, y: number, w: number, h: number, n: number, c: string) =>
  Array.from({ length: n - 1 }, (_, i) => Ln(x + 3, y + ((i + 1) * h) / n, x + w - 3, y + ((i + 1) * h) / n, c, 2)).join('');
/** A striped awning from y down to y+h with scallops hanging below. */
function awning(x: number, y: number, w: number, h: number, n: number, c1: string, c2: string, depth = 12): string {
  const sw = w / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x0 = x + i * sw;
    s += P(`M${f(x0)} ${f(y)} H${f(x0 + sw)} V${f(y + h)} Q${f(x0 + sw / 2)} ${f(y + h + depth * 2)} ${f(x0)} ${f(y + h)}Z`, i % 2 ? c2 : c1);
  }
  return s + R(x, y, w, h, 0, 'url(#g-shadeY)', op(0.45)) + R(x - 5, y - 7, w + 10, 9, 4.5, dark(c1, 0.18));
}
/** A wooden crate; x, y is its top-left corner. */
const crate = (x: number, y: number, w: number, h: number, col = WOOD) =>
  box(x, y, w, h, 4, col) + planksH(x, y, w, h, 3, dark(col, 0.18)) + R(x + 4, y + 2, w - 8, 3, 1.5, '#fff', op(0.3)) + C(x + 7, y + h / 2, 2, dark(col, 0.35)) + C(x + w - 7, y + h / 2, 2, dark(col, 0.35));
/** A little white price tag on a pick. */
const tag = (x: number, y: number, col: string, t: string, w = 30) =>
  R(x - w / 2, y - 9, w, 18, 5, '#fff', stroked(col, 2)) + txt(x, y + 4.5, 10, col, t);
const glassD = (x: number, y: number, w: number, h: number, r = 6) => R(x, y, w, h, r, GLASS) + P(`M${f(x + w * 0.12)} ${f(y + h * 0.85)} L${f(x + w * 0.42)} ${f(y + h * 0.1)}`, 'none', `${stroked('#fff', 4)} ${op(0.5)} stroke-linecap="round"`);
const frost = (x: number, y: number, w: number, h: number) =>
  P(`M${f(x)} ${f(y)} h${f(w * 0.3)} q-${f(w * 0.12)} ${f(h * 0.05)} -${f(w * 0.3)} ${f(h * 0.14)}Z`, '#fff', op(0.7)) + P(`M${f(x + w)} ${f(y + h)} h-${f(w * 0.34)} q${f(w * 0.2)} -${f(h * 0.04)} ${f(w * 0.34)} -${f(h * 0.12)}Z`, '#fff', op(0.6)) + C(x + w * 0.8, y + h * 0.2, 3, '#fff', op(0.6)) + C(x + w * 0.2, y + h * 0.7, 2, '#fff', op(0.6));
const plateE = (x: number, y: number, rx: number, col = '#ffffff') => E(x, y, rx, rx * 0.26, dark(col, 0.08)) + E(x, y - 2, rx, rx * 0.24, col) + E(x, y - 2, rx * 0.68, rx * 0.15, dark(col, 0.04));

// ---------------- the series builder ----------------
type Spec = Omit<FurnDef, 'id' | 'cat' | 'group' | 'style' | 'price' | 'mount' | 'name'> & { name?: string; price?: number; mount?: Mount };
function series(type: string, group: string, label: string, cat: FurnCat, mount: Mount, designs: Record<string, (st: FurnStyle) => Spec>): FurnDef[] {
  return Object.entries(designs).map(([sid, make], i) => {
    const st = ST[sid];
    const { name, price, mount: m, color, ...rest } = make(st);
    return { id: `f-${type}-${sid}`, name: name ?? `${st.name} ${label}`, cat, group, style: sid, price: price ?? stylePrice(i), mount: m ?? mount, color: color ?? st.main, ...rest };
  });
}
const sit = (x: number, y: number): SeatDef => ({ x, y, pose: 'sit' });
/** A free food prop. */
const dish = (id: string, name: string, cat: FurnCat, group: string, w: number, h: number, art: () => string, color = '#ffffff'): FurnDef =>
  ({ id, name, cat, group, price: 0, mount: 'prop', w, h, color, food: true, art: () => art() });

// ---------------- fruit, vegetables and packages (shared by stands, shelves and props) ----------------
const appleF = (x: number, y: number, r: number, col = '#e8384f') => C(x, y, r, col) + C(x - r * 0.35, y - r * 0.35, r * 0.28, '#fff', op(0.45)) + Ln(x, y - r * 0.8, x + r * 0.15, y - r * 1.25, '#8a5a3c', Math.max(1.5, r * 0.18)) + E(x + r * 0.45, y - r * 1.1, r * 0.4, r * 0.2, '#5fae6b');
const orangeF = (x: number, y: number, r: number) => C(x, y, r, '#ffa53d') + C(x - r * 0.35, y - r * 0.35, r * 0.25, '#fff', op(0.4)) + C(x + r * 0.2, y + r * 0.1, r * 0.08, '#e8892a') + C(x - r * 0.15, y + r * 0.35, r * 0.08, '#e8892a') + E(x + r * 0.2, y - r * 0.95, r * 0.35, r * 0.17, '#5fae6b');
const tomatoF = (x: number, y: number, r: number) => E(x, y, r * 1.08, r, '#ff4a4a') + C(x - r * 0.4, y - r * 0.3, r * 0.25, '#fff', op(0.45)) + P(starD(x, y - r * 0.82, r * 0.45, 0.4), '#4fa85c');
const lemonF = (x: number, y: number, r: number, col = '#ffe14d') => E(x, y, r * 1.2, r * 0.9, col) + C(x - r * 1.15, y, r * 0.18, col) + C(x + r * 1.15, y, r * 0.18, col) + E(x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.15, '#fff', op(0.5));
const grapeF = (x: number, y: number, s: number, col = '#9b6bff') => {
  let g = Ln(x, y - 22 * s, x + 4 * s, y - 30 * s, '#8a5a3c', 2.5 * s) + leaf(x + 3 * s, y - 26 * s, 0.8 * s, -20, '#6fc47c');
  for (const [dx, dy] of [[-8, -16], [0, -18], [8, -16], [-4, -9], [4, -9], [-8, -2], [8, -2], [0, -1], [-4, 6], [4, 6], [0, 13]]) g += C(x + dx * s, y + dy * s, 5.2 * s, col) + C(x + dx * s - 1.5 * s, y + dy * s - 1.5 * s, 1.5 * s, '#fff', op(0.5));
  return g;
};
const carrotF = (x: number, y: number, s: number, rot = 0) => tr(x, y, P('M-7 0 Q0 -3 7 0 L1 38 Q0 41 -1 38Z', '#ff8a3d') + Ln(-4, 10, 0, 10, '#e06a1e', 1.6) + Ln(1, 20, 4, 20, '#e06a1e', 1.6) + leaf(0, 0, 0.8, -110, '#5fae6b') + leaf(0, 0, 0.8, -70, '#6fc47c') + leaf(0, 0, 0.7, -90, '#4fa85c'), s, rot);
const broccoliF = (x: number, y: number, s: number) => tr(x, y, P('M-6 0 L6 0 L4 -16 L-4 -16Z', '#8fd36b') + C(-9, -20, 9, '#4fa85c') + C(9, -20, 9, '#4fa85c') + C(0, -27, 10, '#5fbf6a') + C(-4, -30, 3, '#8fe08a', op(0.7)) + C(6, -22, 2.5, '#8fe08a', op(0.7)), s);
const bananaF = (x: number, y: number, s: number) => tr(x, y, [0, 1, 2].map((i) => P(`M-24 ${-4 - i * 7} Q0 ${14 - i * 7} 24 ${-6 - i * 7} Q20 ${2 - i * 7} 0 ${8 - i * 7} Q-18 ${6 - i * 7} -24 ${-4 - i * 7}Z`, ['#ffd84a', '#ffe06b', '#ffe880'][i])).join('') + R(22, -24, 6, 10, 2, '#8a6a3c'), s);
const pumpkinF = (x: number, y: number, r: number) => E(x - r * 0.45, y, r * 0.6, r * 0.8, '#ff8a3d') + E(x + r * 0.45, y, r * 0.6, r * 0.8, '#ff8a3d') + E(x, y, r * 0.6, r * 0.85, '#ffa04d') + R(x - r * 0.12, y - r * 1.05, r * 0.24, r * 0.35, 2, '#5f8f3a');
const berryF = (x: number, y: number, r: number) => P(heartD(x, y - r * 0.5, r * 1.6), '#ff4f6d') + E(x, y - r * 0.55, r * 0.6, r * 0.25, '#5fae6b');
/** One piece of produce of the named kind, centred near (x, y). */
function produce(kind: string, x: number, y: number, r: number, i: number): string {
  switch (kind) {
    case 'apple': return appleF(x, y, r, i % 3 === 2 ? '#7fd36b' : '#e8384f');
    case 'orange': return orangeF(x, y, r);
    case 'tomato': return tomatoF(x, y, r);
    case 'lemon': return lemonF(x, y, r * 0.9);
    case 'lime': return lemonF(x, y, r * 0.85, '#8fd36b');
    case 'plum': return C(x, y, r, '#9b6bff') + C(x - r * 0.3, y - r * 0.35, r * 0.25, '#fff', op(0.4));
    case 'peach': return C(x, y, r, '#ffb38a') + P(`M${f(x)} ${f(y - r)} Q${f(x + r * 0.3)} ${f(y)} ${f(x)} ${f(y + r)}`, 'none', stroked('#ff8a6b', 1.4)) + C(x - r * 0.35, y - r * 0.35, r * 0.25, '#fff', op(0.5));
    case 'berry': return berryF(x, y, r * 0.9);
    case 'blue': return C(x, y, r * 0.75, '#5a7ad8') + C(x, y - r * 0.6, r * 0.2, '#3a4a9a');
    case 'carrot': return carrotF(x, y - r * 1.2, r / 14, (i % 3 - 1) * 14);
    case 'broccoli': return broccoliF(x, y + r * 0.8, r / 13);
    case 'pumpkin': return pumpkinF(x, y, r);
    case 'grape': return grapeF(x, y, r / 13);
    default: return appleF(x, y, r);
  }
}
/** A heap of produce whose bottom row rests at y. */
function heap(kind: string, x: number, y: number, w: number, r: number, rows = 3, seed = 0): string {
  let s = '';
  const n0 = Math.max(1, Math.floor(w / (r * 1.95)));
  for (let row = 0; row < rows; row++) {
    const n = n0 - row;
    if (n <= 0) break;
    const yy = y - r * 0.6 - row * r * 1.45;
    for (let i = 0; i < n; i++) s += produce(kind, x - ((n - 1) * r * 1.95) / 2 + i * r * 1.95 + (rnd(i + row * 7 + seed) - 0.5) * 2, yy, r, i + row + seed);
  }
  return s;
}
/** A cereal box standing on y. */
const cerealG = (x: number, y: number, w: number, h: number, col: string, k = 0) =>
  box(x - w / 2, y - h, w, h, 3, col) + R(x - w / 2 + 4, y - h + 5, w - 8, h * 0.22, 3, '#fff', op(0.9)) + R(x - w / 2 + 7, y - h + 8, w - 14, 3, 1.5, col) + R(x - w / 2 + 7, y - h + 13, w * 0.4, 3, 1.5, dark(col, 0.2)) +
  E(x, y - h * 0.32, w * 0.34, h * 0.12, '#fff') + E(x, y - h * 0.36, w * 0.28, h * 0.07, ['#ffd36b', '#ff9a6b', '#e8b46a'][k % 3]) + C(x - w * 0.1, y - h * 0.4, 2.2, '#ff7eb6') + C(x + w * 0.12, y - h * 0.39, 2.2, '#7cc8ff') +
  P(starD(x + w * 0.22, y - h * 0.58, w * 0.12), '#ffd84a');
const canG = (x: number, y: number, w: number, h: number, col: string) =>
  R(x - w / 2, y - h, w, h, 3, SIL) + R(x - w / 2, y - h * 0.8, w, h * 0.6, 0, col) + C(x, y - h * 0.5, Math.min(w, h) * 0.18, '#fff', op(0.85)) + E(x, y - h, w / 2, 2.5, '#e3e6ee') + R(x - w / 2 + 2, y - h * 0.78, 3, h * 0.55, 1.5, '#fff', op(0.45));
const bottleG = (x: number, y: number, h: number, col: string) =>
  R(x - 8, y - h * 0.7, 16, h * 0.7, 6, col, op(0.9)) + P(`M${f(x - 8)} ${f(y - h * 0.66)} Q${f(x - 8)} ${f(y - h * 0.82)} ${f(x - 3)} ${f(y - h * 0.86)} V${f(y - h)} H${f(x + 3)} V${f(y - h * 0.86)} Q${f(x + 8)} ${f(y - h * 0.82)} ${f(x + 8)} ${f(y - h * 0.66)}Z`, col, op(0.9)) + R(x - 4, y - h - 4, 8, 6, 2, '#fff') + R(x - 8, y - h * 0.5, 16, h * 0.22, 0, '#fff', op(0.85)) + R(x - 5, y - h * 0.66, 3, h * 0.5, 1.5, '#fff', op(0.5));
const cartonG = (x: number, y: number, w: number, h: number, col: string) =>
  R(x - w / 2, y - h, w, h, 2, '#fff') + P(`M${f(x - w / 2)} ${f(y - h)} L${f(x)} ${f(y - h - w * 0.45)} L${f(x + w / 2)} ${f(y - h)}Z`, '#e9eef6') + R(x - w / 2, y - h * 0.62, w, h * 0.3, 0, col) + P(heartD(x, y - h * 0.58, w * 0.22), '#fff') + R(x - 2, y - h - w * 0.5, 4, 4, 1, '#d7deea');
const jarG = (x: number, y: number, w: number, h: number, fill: string, lid: string) =>
  R(x - w / 2, y - h, w, h, 6, '#eef6fb', op(0.9)) + R(x - w / 2 + 3, y - h * 0.75, w - 6, h * 0.75 - 3, 4, fill) + R(x - w / 2 - 2, y - h - 6, w + 4, 8, 3, lid) + R(x - w / 2 + 3, y - h + 3, 4, h - 8, 2, '#fff', op(0.7));
const chipsG = (x: number, y: number, w: number, h: number, col: string) =>
  P(`M${f(x - w / 2)} ${f(y)} L${f(x - w / 2 + 2)} ${f(y - h)} l${f(w / 6)} -4 l${f(w / 6)} 4 l${f(w / 6)} -4 l${f(w / 6)} 4 l${f(w / 6)} -4 l${f(w / 6 - 4)} 4 L${f(x + w / 2)} ${f(y)}Z`, col) + E(x, y - h * 0.48, w * 0.3, h * 0.2, '#fff', op(0.9)) + E(x, y - h * 0.48, w * 0.18, h * 0.1, '#ffd36b') + R(x - w / 2 + 3, y - h + 6, 3, h - 12, 1.5, '#fff', op(0.4));
const tubG = (x: number, y: number, w: number, h: number, col: string, scoop: string) =>
  P(`M${f(x - w / 2)} ${f(y - h)} H${f(x + w / 2)} L${f(x + w * 0.42)} ${f(y)} H${f(x - w * 0.42)}Z`, col) + E(x, y - h, w / 2, 4, dark(col, 0.12)) + C(x, y - h * 0.45, h * 0.24, scoop) + C(x, y - h * 0.45, h * 0.24, '#fff', op(0.25));
const popBoxG = (x: number, y: number, w: number, h: number, col: string) =>
  box(x - w / 2, y - h, w, h, 4, col) + R(x - 4, y - h * 0.72, 8, h * 0.62, 3, '#e8c88a') + box(x - w * 0.3, y - h * 0.9, w * 0.6, h * 0.42, w * 0.28, '#fff') + R(x - w * 0.3, y - h * 0.68, w * 0.6, h * 0.1, 0, light(col, 0.3));
/** Fills a shelf from x1 to x2 standing on y with a repeating mix of packages. */
function goods(x1: number, x2: number, y: number, kinds: string[], seed = 0, hMax = 54): string {
  let s = '', x = x1 + 3, i = 0;
  while (x < x2 - 14) {
    const k = kinds[(i + seed) % kinds.length], col = PACK[(i * 3 + seed) % PACK.length];
    const w = k === 'cereal' ? 28 : k === 'can' ? 18 : k === 'bottle' ? 18 : k === 'carton' ? 20 : k === 'jar' ? 22 : k === 'chips' ? 30 : k === 'tub' ? 28 : 26;
    if (x + w > x2) break;
    const cx = x + w / 2, h = hMax * (k === 'cereal' ? 1 : k === 'bottle' ? 0.95 : k === 'can' ? 0.5 : 0.62);
    if (k === 'cereal') s += cerealG(cx, y, w, h, col, i);
    else if (k === 'can') s += canG(cx, y, w, h, col) + (i % 2 ? canG(cx, y - h, w, h, col) : '');
    else if (k === 'bottle') s += bottleG(cx, y, h, col);
    else if (k === 'carton') s += cartonG(cx, y, w, h * 0.9, col);
    else if (k === 'jar') s += jarG(cx, y, w, h * 0.75, ['#ff6b8a', '#ffb83d', '#b583ff'][i % 3], '#fff');
    else if (k === 'chips') s += chipsG(cx, y, w, h, col);
    else if (k === 'tub') s += tubG(cx, y, w, h * 0.7, light(col, 0.2), ['#ffd9e8', '#8a5a3c', '#fff3d8'][i % 3]);
    else if (k === 'pop') s += popBoxG(cx, y, w, h, col);
    x += w + 3; i++;
  }
  return s;
}
// pastries for bakery cases
const croissantG = (x: number, y: number, s: number) => tr(x, y, P('M-22 0 Q-24 -12 -12 -14 Q0 -22 12 -14 Q24 -12 22 0 Q0 -6 -22 0Z', '#e8a64a') + S('M-12 -14 Q-8 -6 -10 -2 M0 -18 Q2 -8 0 -3 M12 -14 Q8 -6 10 -2', '#c9852e', 2) + E(-4, -14, 6, 2, '#fff', op(0.4)), s);
const loafG = (x: number, y: number, s: number) => tr(x, y, P('M-26 0 Q-30 -24 0 -26 Q30 -24 26 0Z', '#d99a52') + S('M-12 -20 l6 8 M0 -22 l6 8 M12 -20 l6 8', '#f4d29a', 3) + E(-10, -20, 8, 3, '#fff', op(0.3)), s);
const baguetteG = (x: number, y: number, s: number, rot = 0) => tr(x, y, R(-6, -46, 12, 46, 6, '#e0a456') + S('M-3 -38 l6 -4 M-3 -26 l6 -4 M-3 -14 l6 -4', '#f4d29a', 2.4), s, rot);
const cupcakeG = (x: number, y: number, s: number, col: string) => tr(x, y, P('M-12 -16 L12 -16 L9 0 L-9 0Z', col) + C(-7, -20, 7, '#fff3f8') + C(7, -20, 7, '#fff3f8') + C(0, -26, 8, '#fff3f8') + C(0, -34, 3.5, '#e8384f') + sprinkles(-8, -28, 16, 8, 3, x), s);
const donutG = (x: number, y: number, s: number, col: string) => tr(x, y, E(0, -9, 15, 9, '#e8b46a') + E(0, -10, 14, 7.5, col) + E(0, -10, 4.5, 2.2, '#e8b46a') + sprinkles(-10, -15, 20, 8, 4, Math.round(x)), s);
const cookieG = (x: number, y: number, s: number) => tr(x, y, E(0, -6, 14, 7, '#d9a066') + E(0, -7, 13, 6, '#e8b46a') + C(-5, -8, 1.8, '#6b4226') + C(4, -6, 1.8, '#6b4226') + C(1, -10, 1.6, '#6b4226'), s);
const pieG = (x: number, y: number, s: number, col = '#e8384f') => tr(x, y, P('M-26 0 L-22 -10 H22 L26 0Z', '#e0a456') + E(0, -10, 22, 5, col) + S('M-16 -11 L16 -11 M-8 -14 L-8 -8 M8 -14 L8 -8', '#f4d29a', 2.5) + E(0, -11, 22, 5, 'none', stroked('#d99a52', 3)), s);
const cakeG = (x: number, y: number, s: number, col: string, top = '#fff') => tr(x, y, box(-22, -32, 44, 32, 6, col) + cloth(dripD(-23, -34, 46, 6, 10, 5, Math.round(x)), top, 'none', 'y') + C(0, -38, 4.5, '#e8384f') + C(-1, -39, 1.5, '#fff', op(0.6)), s);
const macaronG = (x: number, y: number, col: string) => E(x, y - 4, 9, 4, col) + E(x, y - 8, 8, 2, '#fff8ee') + E(x, y - 12, 9, 4, col) + E(x - 3, y - 14, 3, 1.2, '#fff', op(0.5));

// =====================================================================
// GROCERY
// =====================================================================
const PRODUCE_SPAWN = ['apple', 'orange', 'banana', 'carrot', 'tomato', 'broccoli', 'grapes', 'strawberry'];
/** A tilted produce bin: the fruit peeks over the top edge at y. */
const bin = (x: number, y: number, w: number, col: string, kind: string, seed = 0, r = 12, dh = 34) =>
  heap(kind, x, y + 4, w - 8, r, 2, seed) + P(`M${f(x - w / 2)} ${f(y)} H${f(x + w / 2)} L${f(x + w / 2 - 6)} ${f(y + dh)} H${f(x - w / 2 + 6)}Z`, col) + R(x - w / 2, y - 2, w, 6, 3, dark(col, 0.12)) + R(x - w / 2 + 6, y + 6, w * 0.3, 3, 1.5, '#fff', op(0.4));
const PRODUCE = series('produce', 'Produce Stands', 'Produce Stand', 'grocery', 'floor', {
  sweet: (st) => ({ w: 290, h: 300, spawn: PRODUCE_SPAWN, art: (c) => {
    let s = R(-136, -270, 9, 270, 4.5, GOLD) + R(127, -270, 9, 270, 4.5, GOLD);
    s += bin(-84, -176, 88, '#fff', 'orange', 1, 12) + bin(0, -182, 88, '#fff', 'grape', 2, 13) + bin(84, -176, 88, '#fff', 'lemon', 3, 12);
    s += box(-132, -140, 264, 128, 22, c) + R(-132, -40, 264, 28, 0, light(c, 0.3));
    for (let x = -118; x <= 118; x += 23.6) s += C(x, -40, 9, light(c, 0.3));
    s += bin(-84, -132, 86, light(c, 0.55), 'apple', 4, 12) + bin(0, -132, 86, light(c, 0.55), 'carrot', 5, 12) + bin(84, -132, 86, light(c, 0.55), 'broccoli', 6, 12);
    s += tag(-84, -84, c, '♥') + tag(0, -84, c, '★') + tag(84, -84, c, '♥');
    s += C(-100, -8, 11, GOLD) + C(100, -8, 11, GOLD) + C(-100, -8, 4, '#fff');
    s += awning(-150, -296, 300, 26, 10, c, '#fff', 10);
    s += Ln(0, -262, 0, -246, GOLD, 2.5) + P(heartD(0, -250, 34), '#fff', stroked(c, 3)) + txt(0, -224, 11, dark(c, 0.3), 'Fresh!');
    return s + gloss(-122, -132, 8, 70);
  } }),
  cottage: (st) => ({ w: 300, h: 300, spawn: PRODUCE_SPAWN, art: (c) => {
    let s = R(-138, -280, 12, 280, 4, st.wood) + R(126, -280, 12, 280, 4, st.wood);
    s += crate(-136, -66, 86, 58) + crate(-43, -66, 86, 58) + crate(50, -66, 86, 58);
    s += heap('pumpkin', -93, -66, 76, 15, 1, 1) + heap('tomato', 0, -66, 80, 12, 2, 2) + heap('peach', 93, -66, 80, 12, 2, 3);
    s += crate(-136, -130, 86, 52) + crate(-43, -150, 86, 52) + crate(50, -130, 86, 52);
    s += P('M-136 -78 L-50 -78 L-50 -70 L-136 -70Z', WOOD_D) + heap('apple', -93, -128, 76, 11, 2, 4) + heap('carrot', 0, -148, 76, 11, 1, 5) + heap('lime', 93, -128, 76, 11, 2, 6);
    s += P('M-158 -248 L0 -296 L158 -248 L150 -236 L0 -282 L-150 -236Z', st.wood) + cloth('M-150 -236 L0 -282 L150 -236 V-222 H-150Z', c, 'check', 'y');
    for (let x = -140; x <= 140; x += 28) s += P(`M${x} -222 q14 14 28 0`, c);
    s += R(-56, -216, 112, 44, 6, '#3a4a40', stroked(st.wood, 5)) + txt(0, -198, 13, '#fff', 'Farm Fresh') + S('M-34 -186 q8 -6 16 0 M18 -186 q8 -6 16 0', '#ffd36b', 2);
    return s + flowerG(-120, -150, 9, '#ff9ec7') + flowerG(120, -150, 9, '#fff') + leaf(-108, -146, 1, 30) + E(0, -4, 140, 5, dark(st.wood, 0.2));
  } }),
  modern: (st) => ({ w: 300, h: 270, toggle: true, spawn: PRODUCE_SPAWN, art: (c, on) => {
    let s = R(-140, -20, 280, 20, 3, INK) + box(-146, -120, 292, 102, 6, c) + R(-146, -122, 292, 8, 2, st.accent);
    const lane = (x: number, kind: string, i: number) => P(`M${x - 44} -122 L${x + 44} -122 L${x + 40} -168 L${x - 40} -168Z`, '#c9cfdd') + heap(kind, x, -128, 78, 11, 2, i) + R(x - 44, -128, 88, 8, 2, '#9aa3b5') + R(x - 30, -104, 60, 18, 3, INK) + txt(x, -91, 10, '#7fe0ff', ['0.99', '1.49', '0.79'][i]);
    s += lane(-96, 'lime', 0) + lane(0, 'tomato', 1) + lane(96, 'orange', 2);
    s += R(-146, -250, 292, 34, 4, INK) + txt(0, -227, 16, '#fff', 'PRODUCE', 'letter-spacing="4"') + R(-140, -216, 4, 50, 2, INK) + R(136, -216, 4, 50, 2, INK) + R(-146, -186, 292, 8, 4, SIL);
    for (let x = -120; x <= 120; x += 40) s += C(x, -178, 3, '#7fe0ff');
    if (on) for (let x = -120; x <= 120; x += 40) s += `<g>${[0, 1, 2].map((i) => `<line x1="${x + (i - 1) * 6}" y1="-176" x2="${x + (i - 1) * 16}" y2="-140" stroke="#cfefff" stroke-width="2.4" stroke-dasharray="3 6" opacity="0.9"><animate attributeName="stroke-dashoffset" from="9" to="0" dur="0.3s" repeatCount="indefinite"/></line>`).join('')}</g>`;
    return s + R(-140, -60, 280, 3, 1.5, '#fff', op(0.5)) + gloss(-138, -112, 6, 80);
  } }),
  rainbow: (st) => ({ name: 'Rainbow Fruit Tower', w: 300, h: 290, spawn: PRODUCE_SPAWN, art: (c) => {
    const kinds = ['tomato', 'orange', 'lemon', 'lime', 'blue', 'grape'];
    let s = R(-6, -270, 12, 270, 5, '#fff') + motif('rainbow', 0, -276, 24);
    for (let i = 5; i >= 0; i--) {
      const y = -30 - i * 40, w = 280 - i * 38;
      s += heap(kinds[i], 0, y - 14, w - 20, kinds[i] === 'grape' ? 13 : 10, 1, i) + box(-w / 2, y - 18, w, 22, 11, RAIN[i]) + R(-w / 2 + 8, y - 15, w * 0.3, 4, 2, '#fff', op(0.45));
    }
    return s + box(-146, -16, 292, 16, 6, c) + motif('cloud', -150, -20, 18) + motif('cloud', 150, -20, 18);
  } }),
  woodland: (st) => ({ name: 'Farm Wagon Stand', w: 320, h: 260, spawn: PRODUCE_SPAWN, art: (c) => {
    let s = Ln(110, -60, 158, -20, st.wood, 8) + Ln(150, -30, 160, -12, st.wood, 6);
    s += P('M-146 -150 L146 -150 L134 -60 L-134 -60Z', st.wood) + planksH(-140, -150, 280, 90, 4, dark(st.wood, 0.2));
    s += heap('pumpkin', -84, -150, 110, 18, 2, 1) + heap('carrot', 32, -150, 80, 12, 1, 2) + heap('apple', 104, -150, 70, 11, 2, 3);
    s += P('M-150 -152 L150 -152 L146 -140 L-146 -140Z', dark(st.wood, 0.15)) + E(-30, -150, 30, 6, '#f2d27a') + S('M-50 -152 l6 -10 M-34 -154 l3 -12 M-18 -152 l-4 -10', '#e8c05a', 2);
    for (const x of [-96, 96]) s += C(x, -42, 38, IRON) + C(x, -42, 32, st.wood) + C(x, -42, 8, IRON) + Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3; return Ln(x, -42, x + Math.cos(a) * 30, -42 + Math.sin(a) * 30, IRON, 4); }).join('');
    s += R(-60, -238, 120, 40, 8, '#fff3d6', stroked(st.wood, 5)) + txt(0, -213, 15, dark(c, 0.3), 'Harvest') + Ln(-50, -198, -60, -150, st.wood, 5) + Ln(50, -198, 60, -150, st.wood, 5);
    return s + leaf(-60, -242, 1.4, -150, '#e8573d') + leaf(54, -244, 1.3, -30, '#ffab5e') + motif('leaf', 0, -100, 14);
  } }),
});

const GROC_SPAWN = ['cereal', 'cookie', 'juice', 'milk', 'bread', 'cheese'];
const GROCSHELF = series('grocshelf', 'Grocery Shelves', 'Grocery Shelf', 'grocery', 'floor', {
  sweet: (st) => ({ name: 'Sweet Snack Shelf', w: 250, h: 330, spawn: GROC_SPAWN, surfaces: [{ x1: -110, x2: 110, y: -286 }], art: (c) => {
    let s = box(-120, -286, 240, 286, 14, c) + R(-108, -274, 216, 256, 8, light(c, 0.55));
    for (const [y, k, sd] of [[-206, ['cereal'], 0], [-128, ['chips', 'jar'], 2], [-26, ['can', 'carton', 'can'], 4]] as [number, string[], number][]) {
      s += goods(-106, 106, y, k, sd, 62) + R(-112, y, 224, 10, 4, '#fff') + R(-112, y + 6, 224, 4, 2, dark(c, 0.15));
      for (let x = -90; x <= 90; x += 60) s += R(x - 10, y + 1, 20, 8, 2, '#fff', stroked(c, 1.5)) + P(heartD(x, y + 2.5, 4), c);
    }
    s += P('M-126 -286 Q-126 -330 -80 -330 H80 Q126 -330 126 -286Z', '#fff') + P(heartD(0, -326, 30), c) + txt(-58, -296, 15, dark(c, 0.25), 'Snacks') + txt(60, -296, 15, dark(c, 0.25), 'Yum!');
    return s + gloss(-114, -272, 6, 220);
  } }),
  modern: (st) => ({ name: 'Modern Aisle Shelf', w: 260, h: 320, spawn: GROC_SPAWN, surfaces: [{ x1: -120, x2: 120, y: -270 }], art: (c) => {
    let s = R(-126, -270, 252, 270, 2, '#9aa3b5') + R(-118, -262, 236, 250, 0, c) + R(-126, -14, 252, 14, 0, INK);
    for (const [y, k, sd] of [[-200, ['bottle'], 1], [-130, ['can'], 3], [-60, ['cereal', 'cereal', 'pop'], 5]] as [number, string[], number][]) {
      s += goods(-116, 116, y, k, sd, 60) + R(-122, y, 244, 12, 1, '#c9cfdd') + R(-122, y + 8, 244, 4, 0, '#7fe0ff');
      for (let x = -96; x <= 96; x += 48) s += R(x - 10, y + 2, 20, 6, 1, '#fff') + Ln(x - 6, y + 5, x + 4, y + 5, INK, 1);
    }
    s += R(-126, -270, 252, 6, 0, INK) + R(-70, -320, 140, 40, 4, INK) + Ln(-50, -280, -50, -270, INK, 3) + Ln(50, -280, 50, -270, INK, 3) + txt(0, -305, 11, '#7fe0ff', 'AISLE 3', 'letter-spacing="2"') + txt(0, -290, 10, '#fff', 'drinks · cans');
    return s + R(-118, -262, 6, 250, 0, '#fff', op(0.4));
  } }),
  candy: (st) => ({ name: 'Candy Bin Wall', w: 260, h: 330, spawn: ['donut', 'cookie', 'cupcake'], surfaces: [{ x1: -110, x2: 110, y: -270 }], art: (c) => {
    let s = box(-122, -270, 244, 270, 16, '#fff') + R(-110, -258, 220, 250, 10, light(c, 0.5));
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
      const x = -72 + i * 72, y = -186 + row * 82, col = CANDY[(row * 3 + i) % 5];
      s += R(x - 32, y - 60, 64, 62, 8, '#fff', op(0.6));
      for (let k = 0; k < 9; k++) s += C(x - 22 + (k % 3) * 22 + (row % 2) * 4, y - 10 - Math.floor(k / 3) * 13, 7, k % 2 ? col : CANDY[(k + row) % 5]);
      s += R(x - 32, y - 60, 64, 62, 8, GLASS) + R(x - 32, y - 2, 64, 8, 3, dark(c, 0.1)) + R(x - 8, y - 66, 16, 8, 3, SIL);
    }
    s += cloth(dripD(-128, -282, 256, 16, 22, 9, 2), c, 'none', 'y') + sprinkles(-110, -280, 220, 12, 16, 3);
    for (const [x, col] of [[-90, '#ff4f8b'], [0, '#7cc8ff'], [90, '#ffd36b']] as [number, string][]) s += Ln(x, -282, x, -300, '#fff', 4) + C(x, -310, 14, col) + S(`M${x - 7} -310 A7 7 0 1 1 ${x} -303`, '#fff', 3.5);
    return s;
  } }),
  cottage: (st) => ({ name: 'Cottage Pantry Hutch', w: 250, h: 330, spawn: ['bread', 'eggs', 'cheese', 'apple'], surfaces: [{ x1: -112, x2: 112, y: -300 }], art: (c) => {
    let s = box(-118, -300, 236, 300, 6, st.wood) + R(-106, -290, 212, 270, 4, light(c, 0.35)) + R(-106, -290, 212, 270, 4, 'url(#p-check)', op(0.35));
    s += goods(-102, 102, -222, ['jar'], 0, 58) + R(-110, -222, 220, 9, 2, dark(st.wood, 0.1));
    s += P('M-100 -142 Q-100 -178 -60 -178 Q-20 -178 -20 -142Z', '#e8c08a') + E(-60, -170, 20, 8, '#fff8ee') + C(-70, -172, 8, '#fff8ee') + C(-52, -174, 8, '#fff3e0');
    s += R(-8, -184, 40, 42, 6, '#f4ead9') + txt(12, -158, 10, '#a86b4a', 'flour') + R(40, -178, 60, 36, 6, '#fff3d6') + E(70, -170, 22, 4, '#ffd36b');
    s += R(-110, -142, 220, 9, 2, dark(st.wood, 0.1)) + goods(-102, 102, -62, ['carton', 'jar', 'bottle'], 1, 60) + R(-110, -62, 220, 9, 2, dark(st.wood, 0.1));
    s += box(-128, -316, 256, 18, 4, st.wood) + P('M-118 -298 H118 V-290 Q0 -280 -118 -290Z', dark(st.wood, 0.15)) + R(-118, -20, 236, 20, 2, dark(st.wood, 0.2));
    return s + motif('daisy', -96, -310, 10) + motif('daisy', 96, -310, 10) + grain(-116, -18, 230, 14, WOOD_D);
  } }),
  space: (st) => ({ name: 'Space Snack Pod', w: 260, h: 340, spawn: GROC_SPAWN, surfaces: [{ x1: -90, x2: 90, y: -322 }], art: (c) => {
    let s = R(-70, -10, 140, 10, 5, SIL) + box(-124, -320, 248, 312, 90, c, 'stars') + box(-104, -296, 208, 270, 70, '#1e2350');
    for (const [y, k, sd] of [[-220, ['pop', 'cereal'], 2], [-150, ['can', 'bottle'], 4], [-80, ['chips'], 6]] as [number, string[], number][]) {
      const w = y === -220 ? 150 : 190;
      s += goods(-w / 2, w / 2, y, k, sd, 54) + R(-w / 2 - 6, y, w + 12, 8, 4, '#c9cfdd');
      for (let x = -w / 2 + 10; x < w / 2; x += 30) s += blinkC(x, y + 4, 2, ['#7fe0ff', st.accent, '#ff7eb6'][Math.abs(x) % 3], 1.2 + (Math.abs(x) % 5) * 0.2);
    }
    s += P(starD(-60, -260, 8), st.accent) + P(starD(64, -252, 6), '#fff') + R(-104, -296, 208, 270, 70, GLASS, op(0.7));
    s += Ln(0, -320, 0, -340, '#c9cfdd', 4) + blinkC(0, -344, 6, '#ff6b8a', 1.1) + txt(0, -300, 12, st.accent, 'SPACE SNACKS');
    return s + gloss(-110, -260, 8, 120);
  } }),
});

const FREEZE_SPAWN = ['iceCone', 'popsicle', 'sundae', 'pizza'];
/** The inside of a freezer: shelves of ice cream tubs and popsicle boxes. */
function freezerIn(x: number, y: number, w: number, h: number, seed = 0): string {
  let s = R(x, y, w, h, 6, '#eaf6ff') + glow(x + w / 2, y + 20, w * 0.5);
  const rows = Math.max(2, Math.floor(h / 72));
  for (let r = 0; r < rows; r++) {
    const yy = y + ((r + 1) * h) / rows - 6;
    s += goods(x + 2, x + w - 2, yy, r % 2 ? ['pop', 'tub'] : ['tub', 'pop'], seed + r, Math.min(56, h / rows - 8)) + R(x + 2, yy, w - 4, 5, 2, '#bcdcf0');
  }
  return s;
}
const fz = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 240, h: 330, toggle: true, spawn: FREEZE_SPAWN, art, ...extra });
const FREEZERS = series('freezer', 'Freezers', 'Freezer', 'grocery', 'floor', {
  sweet: (st) => fz((c, on) => {
    let s = R(-110, -14, 220, 14, 4, dark(c, 0.2)) + P(rrD(-116, -310, 232, 300, 48, 10), c) + P(rrD(-116, -310, 232, 300, 48, 10), 'url(#g-shadeX)');
    s += R(-60, -330, 120, 34, 17, '#fff', stroked(c, 4)) + txt(0, -307, 16, dark(c, 0.3), 'Frozen') + motif('snowflake', -76, -312, 10) + motif('snowflake', 76, -312, 10);
    s += freezerIn(-100, -280, 200, 252, 1);
    if (on) return s + P('M-100 -282 L-148 -298 L-148 -14 L-100 -26Z', light(c, 0.3)) + P('M100 -282 L148 -298 L148 -14 L100 -26Z', light(c, 0.3)) + P('M-108 -270 L-140 -280 L-140 -32 L-108 -40Z', GLASS) + P('M108 -270 L140 -280 L140 -32 L108 -40Z', GLASS) + chill(0, -60, 180);
    s += Ln(0, -282, 0, -26, c, 6) + R(-100, -282, 200, 256, 6, '#dff2ff', op(0.35)) + glassD(-100, -282, 98, 256) + glassD(2, -282, 98, 256) + frost(-100, -282, 98, 256) + frost(2, -282, 98, 256);
    s += R(-14, -200, 6, 70, 3, GOLD) + R(8, -200, 6, 70, 3, GOLD);
    return s + P(heartD(-50, -60, 14), '#fff', op(0.8)) + P(heartD(50, -60, 14), '#fff', op(0.8));
  }),
  modern: (st) => fz((c, on) => {
    let s = R(-136, -14, 272, 14, 0, INK) + box(-136, -320, 272, 308, 4, c) + R(-136, -320, 272, 34, 0, INK) + txt(0, -298, 13, '#7fe0ff', 'FROZEN FOODS', 'letter-spacing="3"');
    s += freezerIn(-126, -280, 252, 256, 3) + R(-126, -282, 252, 4, 0, '#7fe0ff');
    if (on) return s + P('M-126 -282 L-160 -294 L-160 -20 L-126 -24Z', '#c9cfdd') + P('M126 -282 L160 -294 L160 -20 L126 -24Z', '#c9cfdd') + chill(0, -50, 220);
    for (const x of [-126, -42, 42]) s += R(x, -282, 84, 258, 0, '#dff2ff', op(0.3)) + glassD(x, -282, 84, 258, 0) + R(x, -282, 84, 258, 0, 'none', stroked('#c9cfdd', 5)) + R(x + 70, -200, 5, 90, 2.5, SIL);
    return s;
  }, { w: 280 }),
  space: (st) => fz((c, on) => {
    let s = R(-60, -12, 120, 12, 6, SIL) + box(-110, -330, 220, 320, 100, c, 'stars') + C(0, -170, 92, '#c9cfdd');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += C(Math.cos(a) * 86, -170 + Math.sin(a) * 86, 3, '#9aa3b5'); }
    s += freezerIn(-68, -236, 136, 140, 5);
    if (on) return s + E(-150, -170, 22, 88, '#c9cfdd') + E(-150, -170, 14, 74, GLASS) + chill(0, -90, 140) + blinkC(0, -300, 7, '#7fe0b0', 0.8);
    s += C(0, -170, 76, '#bfe8ff', op(0.45)) + C(0, -170, 76, GLASS) + frost(-60, -230, 120, 120) + R(60, -186, 26, 34, 8, SIL);
    return s + R(-40, -306, 80, 22, 11, '#262b55') + blinkC(-24, -295, 4, st.accent, 1.3) + blinkC(0, -295, 4, '#7fe0ff', 1, 0.3) + blinkC(24, -295, 4, '#ff7eb6', 1.6, 0.5) + txt(0, -40, 12, st.accent, '-200°');
  }, { h: 340 }),
  candy: (st) => fz((c, on) => {
    let s = '';
    if (on) s += P('M-116 -150 L116 -150 L106 -250 L-106 -250Z', light(c, 0.35)) + P('M-104 -158 L104 -158 L96 -238 L-96 -238Z', GLASS);
    s += P('M-22 -232 L22 -232 L0 -170Z', '#e8b46a') + C(-12, -244, 16, '#ffb3c7') + C(12, -244, 16, '#fff3d8') + C(0, -262, 16, '#a8e6cf') + C(4, -282, 6, '#e8384f');
    s += box(-120, -152, 240, 144, 20, c, 'dots') + R(-110, -8, 220, 8, 4, dark(c, 0.2)) + cloth(dripD(-122, -156, 244, 10, 18, 8, 4), '#fff3f8', 'none', 'y');
    s += R(-90, -110, 180, 70, 12, '#fff', op(0.85)) + txt(0, -66, 22, c, 'Ice Cream', `stroke="${dark(c, 0.2)}" stroke-width="0.8"`);
    if (on) s += [-70, -30, 10, 50].map((x, i) => tubG(x + 10, -152, 30, 22, '#fff', ['#ffb3c7', '#8a5a3c', '#a8e6cf', '#fff3d8'][i])).join('') + chill(0, -170, 200);
    else s += R(-118, -164, 236, 12, 6, light(c, 0.3)) + R(-30, -168, 60, 6, 3, '#fff');
    return s + sprinkles(-100, -40, 200, 24, 10, 2);
  }, { w: 250, h: 300, name: 'Candy Ice Cream Chest' }),
  retro: (st) => fz((c, on) => {
    let s = R(-110, -20, 220, 20, 8, SIL) + box(-120, -170, 240, 154, 30, c) + R(-120, -110, 240, 30, 0, st.accent) + R(-120, -114, 240, 5, 2, SIL) + R(-120, -80, 240, 5, 2, SIL);
    s += txt(0, -89, 20, '#fff', 'Ice Cream', 'font-style="italic"');
    if (on) s += R(-108, -186, 216, 18, 6, '#eaf6ff') + [-80, -40, 0, 40, 80].map((x, i) => tubG(x, -170, 32, 18, '#fff', ['#ffb3c7', '#8a5a3c', '#a8e6cf', '#fff3d8', '#ffd36b'][i])).join('') + chill(0, -190, 200) + R(-120, -176, 110, 10, 5, SIL, 'transform="translate(-20 0)"');
    else s += R(-116, -178, 232, 12, 6, SIL) + R(-114, -174, 112, 6, 3, '#dff2ff') + R(2, -174, 112, 6, 3, '#dff2ff') + R(-20, -186, 40, 8, 4, SIL);
    s += R(-60, -280, 120, 70, 35, '#fff', stroked(SIL, 6)) + txt(0, -238, 20, c, 'Scoops!', 'font-style="italic"') + Ln(-40, -212, -40, -178, SIL, 5) + Ln(40, -212, 40, -178, SIL, 5);
    return s + motif('star', -96, -48, 10) + motif('star', 96, -48, 10) + gloss(-108, -160, 8, 40);
  }, { h: 290, name: 'Retro Ice Cream Chest' }),
});

const DAIRY = series('dairy', 'Dairy Fridges', 'Dairy Fridge', 'grocery', 'floor', {
  sweet: (st) => ({ name: 'Moo Dairy Fridge', w: 250, h: 320, toggle: true, spawn: ['milk', 'cheese', 'eggs'], art: (c, on) => {
    let s = box(-122, -300, 244, 300, 12, c) + R(-108, -250, 216, 220, 6, '#f4faff') + (on ? glow(0, -240, 120) : '');
    s += cloth(rrD(-128, -320, 256, 70, 22, 8), '#fff') + [[-90, -300, 18, 12], [-30, -286, 12, 9], [40, -304, 20, 12], [96, -284, 12, 10]].map(([x, y, rx, ry]) => E(x, y, rx, ry, c)).join('') + txt(0, -272, 22, dark(c, 0.35), 'Moo!');
    s += goods(-104, 104, -190, ['carton', 'carton', 'bottle'], 1, 56) + R(-108, -190, 216, 8, 3, '#cfe3f0');
    s += goods(-104, 104, -120, ['tub', 'jar'], 2, 50) + R(-108, -120, 216, 8, 3, '#cfe3f0');
    for (let i = 0; i < 4; i++) { const x = -78 + i * 52; s += R(x - 22, -66, 44, 20, 3, '#e8d8c0') + [0, 1, 2].map((k) => E(x - 13 + k * 13, -66, 6, 8, '#fff8ee')).join(''); }
    s += R(-108, -46, 216, 8, 3, '#cfe3f0') + R(-122, -38, 244, 38, 0, dark(c, 0.15)) + Array.from({ length: 10 }, (_, i) => Ln(-104 + i * 23, -30, -104 + i * 23, -8, dark(c, 0.3), 3)).join('');
    if (on) s += chill(0, -40, 200);
    return s + R(-108, -250, 216, 4, 2, on ? '#fff6c8' : '#dfe8f0');
  } }),
  cottage: (st) => ({ name: 'Cottage Dairy Cart', w: 260, h: 300, toggle: true, spawn: ['milk', 'cheese', 'eggs'], art: (c, on) => {
    let s = box(-126, -210, 252, 196, 10, st.wood) + R(-112, -198, 224, 170, 6, light(c, 0.55)) + leg(-110, -16, 16, dark(st.wood, 0.1), 14) + leg(110, -16, 16, dark(st.wood, 0.1), 14);
    s += [-80, -50, -20].map((x) => R(x - 12, -190, 24, 52, 8, '#fff', op(0.95)) + R(x - 6, -198, 12, 10, 3, '#5fae6b') + R(x - 12, -164, 24, 10, 0, '#cfe8ff')).join('') + E(40, -150, 50, 10, '#e0c090') + P('M0 -150 L40 -186 L80 -150Z', '#ffd84a') + C(30, -162, 4, '#e8b83a') + C(50, -158, 3, '#e8b83a');
    s += R(-118, -140, 236, 8, 3, st.wood);
    for (let i = 0; i < 6; i++) s += E(-90 + i * 36, -112, 13, 17, i % 2 ? '#f4dca0' : '#fff8ee');
    s += R(-118, -92, 236, 8, 3, st.wood) + cloth('M-112 -86 H112 V-30 H-112Z', c, 'check', 'y');
    s += P('M-60 -290 Q-60 -250 -40 -232 H40 Q60 -250 60 -290Z', SIL) + R(-30, -306, 60, 18, 6, SIL) + R(-44, -286, 88, 8, 4, '#c9cfdd') + Ln(-62, -270, -76, -258, SIL, 5) + Ln(62, -270, 76, -258, SIL, 5);
    s += P('M-130 -212 L-100 -232 H100 L130 -212Z', dark(st.wood, 0.1)) + txt(0, -216, 13, '#fff', 'Fresh Milk');
    if (on) s += chill(0, -40, 200) + glow(0, -150, 100);
    return s + flowerG(-100, -228, 8, '#ff9ec7') + flowerG(100, -228, 8, '#fff');
  } }),
});

const CHECKOUTS = series('checkout', 'Checkouts', 'Checkout', 'grocery', 'floor', {
  sweet: (st) => ({ w: 340, h: 280, toggle: true, sfx: 'ding', surfaces: [{ x1: -160, x2: 0, y: -144 }], art: (c, on) => {
    let s = box(-166, -140, 300, 132, 18, c) + R(-160, -8, 290, 8, 4, dark(c, 0.2));
    s += R(-168, -150, 180, 14, 7, '#4a3f5e') + `<line x1="-160" y1="-143" x2="6" y2="-143" stroke="#6a5f7e" stroke-width="10" stroke-dasharray="6 10">${on ? '<animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.4s" repeatCount="indefinite"/>' : ''}</line>`;
    s += R(14, -152, 44, 14, 4, '#3a3346') + P(heartD(36, -152, 12), on ? '#ff4f6d' : '#ff9ec7', op(0.9));
    s += R(70, -164, 60, 24, 6, '#fff') + R(76, -158, 48, 10, 3, on ? '#7fe0b0' : '#ddd');
    s += R(84, -176, 32, 16, 4, GOLD) + R(64, -236, 72, 60, 10, GOLD) + R(72, -228, 56, 30, 5, '#2d2a3a') + txt(100, -208, 13, on ? '#ff9ec7' : '#7fe0ff', on ? '♥ ♥ ♥' : '0.00');
    for (let i = 0; i < 6; i++) s += C(80 + (i % 3) * 20, -188 + Math.floor(i / 3) * 0, 3.5, '#fff');
    if (on) s += R(64, -150, 70, 16, 4, GOLD) + C(80, -146, 4, '#ffd24a') + C(94, -146, 4, '#ffd24a') + C(108, -146, 4, '#c9cfdd') + [0, 1, 2].map((i) => `<path d="${sparkleD(100 + (i - 1) * 30, -256 - i * 6, 8)}" fill="#ffe680"><animate attributeName="opacity" values="0;1;0" dur="1s" begin="${i * 0.3}s" repeatCount="indefinite"/></path>`).join('');
    s += R(146, -260, 8, 252, 4, GOLD) + C(150, -270, 16, on ? '#ff4f7b' : '#fff', stroked(GOLD, 3)) + txt(150, -264, 15, on ? '#fff' : c, '1');
    s += R(-140, -110, 110, 80, 10, '#fff', op(0.8)) + [0, 1, 2, 3].map((i) => R(-132 + i * 26, -100, 18, 26, 3, CANDY[i]) + R(-132 + i * 26, -66, 18, 26, 3, CANDY[(i + 2) % 5])).join('');
    return s + P(heartD(50, -110, 30), '#fff', op(0.85)) + gloss(-158, -132, 7, 60);
  } }),
  modern: (st) => ({ w: 340, h: 280, toggle: true, sfx: 'ding', surfaces: [{ x1: -160, x2: 0, y: -134 }], art: (c, on) => {
    let s = R(-160, -14, 300, 14, 0, INK) + box(-166, -130, 300, 118, 4, c) + R(-166, -46, 300, 6, 0, st.accent);
    s += R(-168, -140, 180, 12, 2, INK) + `<line x1="-162" y1="-134" x2="8" y2="-134" stroke="#4a4a5e" stroke-width="8" stroke-dasharray="3 7">${on ? '<animate attributeName="stroke-dashoffset" from="0" to="-10" dur="0.3s" repeatCount="indefinite"/>' : ''}</line>` + R(-168, -128, 180, 3, 0, on ? '#7fe0ff' : '#5a5a6e');
    s += R(18, -142, 46, 12, 2, INK) + R(24, -140, 34, 6, 1, on ? '#ff4f4f' : '#3a3a4e') + (on ? pulse(R(24, -170, 34, 30, 2, '#ff4f4f', op(0.2)), 0.5) : '');
    s += R(96, -220, 8, 90, 3, INK) + `<g transform="rotate(-8 100 -230)">${R(64, -260, 76, 50, 6, INK)}${R(70, -254, 64, 38, 3, on ? '#fff' : '#3d4a66')}${on ? txt(102, -230, 12, '#5fd3b5', 'Thanks!') + P(heartD(102, -226, 8), '#ff7eb6') : txt(102, -232, 10, '#7fe0ff', 'TOTAL')}</g>`;
    s += R(60, -142, 26, 18, 3, '#3d3a4e') + R(66, -152, 14, 12, 2, '#7cc8ff');
    s += R(150, -280, 6, 270, 3, INK) + R(134, -284, 38, 30, 4, INK) + txt(153, -262, 17, on ? '#7fe0b0' : '#7fe0ff', '3');
    return s + R(-160, -120, 4, 70, 2, '#fff', op(0.5)) + R(-120, -100, 160, 30, 3, dark(c, 0.06)) + txt(-40, -80, 12, st.accent, 'express lane');
  } }),
  rainbow: (st) => ({ w: 340, h: 280, toggle: true, sfx: 'ding', surfaces: [{ x1: -160, x2: 0, y: -146 }], art: (c, on) => {
    let s = box(-166, -140, 300, 132, 30, c) + R(-160, -10, 290, 10, 5, dark(c, 0.15));
    s += R(-170, -152, 184, 16, 8, '#fff');
    s += `<g>${RAIN.map((col, i) => R(-166 + i * 30, -149, 26, 10, 5, col)).join('')}${on ? '<animateTransform attributeName="transform" type="translate" values="0 0;-30 0" dur="0.5s" repeatCount="indefinite"/>' : ''}</g>`;
    s += R(-176, -156, 12, 24, 6, '#fff') + R(10, -156, 12, 24, 6, '#fff');
    s += motif('cloud', 90, -200, 34) + R(70, -214, 40, 18, 4, '#3a3a5a') + txt(90, -201, 11, on ? '#ffd36b' : '#7fe0ff', on ? '★★★' : '0.00') + R(70, -160, 40, 20, 6, '#fff', stroked(c, 2));
    RAIN.forEach((col, i) => { s += S(`M${-120 + i * 8} -30 A${120 - i * 8} ${70 - i * 8} 0 0 1 ${120 - i * 8 - 40} -30`, col, 6, op(0.5)); });
    s += R(146, -260, 8, 252, 4, '#fff') + motif('star', 150, -270, 18) + (on ? [0, 1].map((i) => `<path d="${starD(120 + i * 60, -240, 7)}" fill="${RAIN[i * 2]}"><animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="${i * 0.4}s" repeatCount="indefinite"/></path>`).join('') : '');
    return s + gloss(-156, -130, 7, 70);
  } }),
  retro: (st) => ({ w: 340, h: 290, toggle: true, sfx: 'ding', surfaces: [{ x1: -160, x2: 0, y: -146 }], art: (c, on) => {
    let s = R(-150, -18, 270, 18, 6, SIL) + box(-166, -140, 300, 124, 14, c) + R(-166, -100, 300, 8, 0, SIL) + R(-166, -60, 300, 8, 0, SIL);
    for (let x = -150; x < 130; x += 28) s += R(x, -92, 14, 32, 0, st.accent, op(0.6));
    s += R(-170, -152, 184, 14, 7, '#a83a3a') + `<line x1="-162" y1="-145" x2="6" y2="-145" stroke="#c94f4f" stroke-width="9" stroke-dasharray="8 8">${on ? '<animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.5s" repeatCount="indefinite"/>' : ''}</line>`;
    s += P('M50 -146 L130 -146 L124 -200 L56 -200Z', SIL) + R(56, -222, 68, 24, 6, '#3a3346') + txt(90, -205, 14, '#ffd36b', on ? '★' : '0.00');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) s += C(66 + i * 16, -184 + r * 14, 5, ['#fff', st.accent, '#fff', st.trim][(i + r) % 4]) + C(66 + i * 16, -184 + r * 14, 5, 'none', stroked('#9aa3b5', 1));
    if (on) s += [0, 1, 2].map((i) => R(64 + i * 22, -248, 14, 18, 2, '#fff', stroked(c, 1.5)) + txt(71 + i * 22, -235, 11, c, '$')).join('') + R(54, -146, 72, 14, 3, SIL, 'transform="translate(0 8)"');
    s += R(140, -270, 7, 254, 3, SIL) + C(143, -276, 16, on ? st.trim : '#fff', stroked(SIL, 4)) + txt(143, -270, 15, c, '7');
    return s + motif('star', -120, -40, 9) + motif('star', -80, -36, 7) + gloss(-160, -132, 7, 30);
  } }),
});

const CARTS = series('cart', 'Shopping Carts', 'Shopping Cart', 'grocery', 'floor', {
  sweet: (st) => ({ w: 200, h: 220, surfaces: [{ x1: -60, x2: 70, y: -104 }], art: (c) => {
    let s = Ln(-74, -90, -60, -26, GOLD, 5) + Ln(80, -96, 66, -26, GOLD, 5) + R(-72, -32, 150, 7, 3.5, GOLD) + R(-58, -58, 128, 5, 2.5, '#e0b040');
    for (const x of [-56, 56]) s += C(x, -14, 12, '#fff', stroked(c, 4)) + P(heartD(x, -19, 9), c);
    const bk = 'M-78 -176 L88 -176 L74 -94 L-60 -94Z';
    s += P(bk, light(c, 0.55), op(0.6));
    for (let x = -64; x <= 76; x += 14) s += Ln(x, -174, x * 0.92 + 2, -96, c, 2.4);
    for (let y = -160; y <= -110; y += 16) s += Ln(-76 + (y + 176) * 0.2, y, 86 - (y + 176) * 0.17, y, c, 2.4);
    s += P(bk, 'none', stroked(c, 5)) + Ln(-80, -176, -102, -196, GOLD, 5) + R(-118, -206, 34, 14, 7, c) + P(heartD(-101, -206, 8), '#fff');
    return s + R(-76, -148, 30, 20, 4, '#fff', stroked(c, 2)) + P(heartD(-61, -144, 8), c);
  } }),
  modern: (st) => ({ w: 200, h: 220, surfaces: [{ x1: -60, x2: 70, y: -104 }], art: (c) => {
    let s = Ln(-70, -94, -60, -24, SIL, 6) + Ln(78, -94, 68, -24, SIL, 6) + R(-74, -30, 152, 6, 3, SIL) + R(-66, -64, 140, 26, 4, st.accent, op(0.7));
    for (const x of [-56, 60]) s += C(x, -12, 12, INK) + C(x, -12, 5, '#9aa3b5');
    s += P('M-80 -178 L90 -178 L76 -92 L-62 -92Z', c) + P('M-80 -178 L90 -178 L76 -92 L-62 -92Z', 'url(#g-shadeX)');
    for (let x = -60; x <= 70; x += 20) s += R(x, -166, 10, 60, 5, dark(c, 0.12));
    s += R(-84, -182, 178, 8, 3, dark(c, 0.15)) + Ln(-84, -178, -104, -200, SIL, 6) + R(-122, -210, 36, 12, 6, st.accent) + txt(6, -120, 10, '#fff', 'SHOP');
    return s;
  } }),
  rainbow: (st) => ({ w: 200, h: 220, surfaces: [{ x1: -60, x2: 70, y: -104 }], art: (c) => {
    let s = Ln(-70, -94, -60, -24, '#fff', 6) + Ln(78, -94, 68, -24, '#fff', 6) + R(-74, -30, 152, 6, 3, '#fff');
    s += [-56, 60].map((x, i) => C(x, -14, 13, RAIN[i * 3 + 1]) + C(x, -14, 5, '#fff')).join('');
    for (let i = 0; i < 6; i++) { const y = -176 + i * 14; s += P(`M${-80 + i * 3} ${y} L${90 - i * 2.4} ${y} L${88 - (i + 1) * 2.4} ${y + 14} L${-80 + (i + 1) * 3} ${y + 14}Z`, RAIN[i]); }
    s += R(-82, -180, 174, 8, 4, '#fff') + Ln(-82, -178, -104, -200, '#fff', 6) + R(-124, -210, 38, 14, 7, '#ff7eb6') + motif('cloud', 70, -186, 14);
    return s + P(starD(0, -136, 14), '#fff', op(0.85));
  } }),
  space: (st) => ({ name: 'Hover Cart', w: 200, h: 230, surfaces: [{ x1: -60, x2: 70, y: -114 }], art: (c) => {
    let s = bob(E(0, -10, 70, 10, '#7fe0ff', op(0.35)) + [-50, 0, 50].map((x) => flame(x, -20, 0.6)).join('') + E(0, -36, 86, 16, '#c9cfdd') + E(0, -40, 80, 11, c), 4, 1.6);
    s += bob(P('M-80 -186 L90 -186 L76 -100 L-62 -100Z', c, 'opacity="0.9"') + P('M-80 -186 L90 -186 L76 -100 L-62 -100Z', 'url(#p-stars)') + R(-84, -190, 178, 8, 4, '#c9cfdd') + Ln(-84, -188, -104, -208, '#c9cfdd', 6) + R(-122, -218, 36, 12, 6, st.accent) + Ln(-50, -100, -40, -46, '#c9cfdd', 5) + Ln(60, -100, 50, -46, '#c9cfdd', 5) + blinkC(76, -160, 4, st.accent, 1) + blinkC(-60, -160, 4, '#7fe0b0', 1.4), 4, 1.6);
    return s;
  } }),
  candy: (st) => ({ name: 'Race Car Kid Cart', w: 230, h: 220, surfaces: [{ x1: -40, x2: 80, y: -112 }], art: (c) => {
    let s = Ln(-50, -100, -40, -50, SIL, 5) + Ln(90, -100, 80, -50, SIL, 5);
    s += P('M-50 -186 L104 -186 L92 -104 L-36 -104Z', '#fff', op(0.7));
    for (let x = -40; x <= 92; x += 14) s += Ln(x, -184, x * 0.94, -106, SIL, 2.2);
    s += P('M-50 -186 L104 -186 L92 -104 L-36 -104Z', 'none', stroked(SIL, 4)) + Ln(-52, -186, -70, -204, SIL, 5) + R(-88, -212, 34, 12, 6, st.trim);
    s += P('M-110 -30 Q-112 -86 -60 -92 L60 -92 Q94 -90 100 -60 L104 -30Z', c) + P('M-110 -30 Q-112 -86 -60 -92 L60 -92 Q94 -90 100 -60 L104 -30Z', 'url(#p-dots)');
    s += P('M-70 -92 Q-60 -130 -20 -130 Q10 -130 16 -92Z', '#bfe8ff') + P('M-70 -92 Q-60 -130 -20 -130 Q10 -130 16 -92Z', GLASS) + C(-24, -60, 14, '#fff') + txt(-24, -54, 15, c, '1');
    s += [-70, 64].map((x) => C(x, -22, 20, INK) + C(x, -22, 9, '#fff') + C(x, -22, 4, st.trim)).join('') + C(-108, -56, 6, '#fff6c8');
    return s + sprinkles(30, -84, 60, 40, 8, 3);
  } }),
});

const BASKETS = series('basket', 'Shopping Baskets', 'Basket', 'grocery', 'prop', {
  sweet: (st) => ({ w: 100, h: 90, art: (c) => S('M-34 -50 Q-30 -88 0 -88 Q30 -88 34 -50', c, 6) + appleF(-14, -62, 10) + bananaF(14, -56, 0.6) + P('M-44 -54 H44 L36 0 H-36Z', c) + [-28, -14, 0, 14, 28].map((x) => R(x - 4, -46, 8, 38, 4, light(c, 0.4))).join('') + R(-46, -58, 92, 8, 4, dark(c, 0.1)) + P(heartD(0, -32, 12), '#fff', op(0.85)) }),
  cottage: (st) => ({ name: 'Wicker Basket', w: 110, h: 90, art: (c) => S('M-38 -48 Q-36 -94 0 -94 Q36 -94 38 -48', '#c98a5a', 6) + cloth('M-30 -58 Q0 -76 30 -58 L26 -46 H-26Z', c, 'check', 'y') + loafG(14, -54, 0.6) + carrotF(-20, -90, 0.8, -20) + P('M-46 -50 H46 L38 0 H-38Z', '#e8c08a') + [-36, -20, -4, 12, 28].map((x) => Ln(x + 4, -46, x + 2, -4, '#c9965a', 3)).join('') + [-38, -24, -10].map((y) => Ln(-42, y, 42, y, '#b58a50', 2.5)).join('') + R(-48, -54, 96, 8, 4, '#c9965a') }),
  modern: (st) => ({ name: 'Rolling Basket', w: 100, h: 110, art: (c) => Ln(36, -54, 36, -104, SIL, 4) + R(26, -110, 20, 8, 4, INK) + C(-30, -6, 7, INK) + C(30, -6, 7, INK) + broccoliF(-12, -56, 0.8) + cartonG(14, -54, 18, 30, '#7cc8ff') + box(-42, -60, 84, 52, 6, c) + [-26, -10, 6, 22].map((x) => R(x - 3, -52, 8, 34, 3, dark(c, 0.15))).join('') + R(-44, -64, 88, 6, 3, INK) }),
});

const SCALES = series('scale', 'Produce Scales', 'Scale', 'grocery', 'prop', {
  sweet: (st) => ({ w: 90, h: 110, sfx: 'ding', toggle: true, art: (c, on) => R(-30, -12, 60, 12, 5, c) + R(-6, -44, 12, 34, 4, GOLD) + C(0, -48, 26, c) + C(0, -48, 20, '#fff') + Ln(0, -48, on ? 12 : -4, on ? -60 : -64, '#ff4f6d', 2.5) + C(0, -48, 3, INK) + E(0, -84, 38, 7, GOLD) + R(-4, -78, 8, 8, 2, GOLD) + (on ? heap('apple', 0, -88, 50, 9, 2) : '') + P(heartD(0, -38, 6), c) }),
  retro: (st) => ({ w: 90, h: 120, sfx: 'ding', toggle: true, art: (c, on) => box(-30, -64, 60, 64, 10, c) + C(0, -40, 20, '#fff', stroked(SIL, 4)) + Array.from({ length: 8 }, (_, i) => { const a = Math.PI + (i / 7) * Math.PI; return Ln(Math.cos(a) * 14, -40 + Math.sin(a) * 14, Math.cos(a) * 18, -40 + Math.sin(a) * 18, INK, 1.4); }).join('') + Ln(0, -40, on ? 12 : -12, on ? -52 : -50, '#e8384f', 2.4) + R(-4, -76, 8, 14, 2, SIL) + P('M-40 -78 Q0 -60 40 -78Z', SIL) + (on ? heap('orange', 0, -80, 50, 9, 2) : '') }),
  modern: (st) => ({ name: 'Digital Scale', w: 90, h: 80, sfx: 'ding', toggle: true, art: (c, on) => box(-40, -26, 80, 26, 4, c) + R(-28, -20, 40, 14, 2, INK) + txt(-8, -9.5, 10, '#7fe0ff', on ? '1.25' : '0.00') + C(24, -13, 5, st.accent) + R(-42, -34, 84, 8, 2, SIL) + (on ? heap('tomato', 0, -36, 60, 10, 2) : '') }),
});

const FLOWERSTANDS = series('flowerstand', 'Flower Stands', 'Flower Stand', 'grocery', 'floor', {
  sweet: (st) => ({ w: 220, h: 230, spawn: ['roses'], art: (c) => {
    let s = R(-100, -20, 200, 20, 6, dark(c, 0.15)) + P('M-90 -20 L-70 -140 H70 L90 -20Z', '#fff') + R(-80, -88, 160, 8, 4, dark(c, 0.1)) + R(-70, -146, 140, 8, 4, dark(c, 0.1));
    const bunch = (x: number, y: number, col: string, n: number) => Array.from({ length: n }, (_, i) => Ln(x, y, x + (i - (n - 1) / 2) * 9, y - 40, '#5fae6b', 2.5) + flowerG(x + (i - (n - 1) / 2) * 9, y - 44 - (i % 2) * 8, 9, col)).join('');
    s += bunch(-44, -150, '#ff4f6d', 4) + bunch(0, -156, '#fff', 4) + bunch(44, -150, c, 4) + bunch(-56, -92, '#ffd36b', 3) + bunch(0, -92, '#c99bff', 3) + bunch(56, -92, '#ff9a6b', 3);
    s += [-44, 0, 44].map((x) => P(`M${x - 18} -150 H${x + 18} L${x + 14} -120 H${x - 14}Z`, SIL)).join('') + [-56, 0, 56].map((x) => P(`M${x - 18} -92 H${x + 18} L${x + 14} -60 H${x - 14}Z`, c)).join('');
    return s + R(-60, -52, 120, 26, 8, c) + txt(0, -34, 13, '#fff', 'Flowers') + bowG(0, -126, 0.5, c);
  } }),
  cottage: (st) => ({ name: 'Flower Ladder', w: 220, h: 270, spawn: ['roses'], art: (c) => {
    let s = `<g transform="rotate(6 -80 -130)">${R(-86, -260, 12, 260, 4, st.wood)}</g><g transform="rotate(-6 80 -130)">${R(74, -260, 12, 260, 4, st.wood)}</g>`;
    for (const [y, w] of [[-70, 170], [-140, 150], [-210, 130]]) s += box(-w / 2, y, w, 12, 3, st.wood);
    const pail = (x: number, y: number, col: string, kind: 'daisy' | 'sun' | 'tulip') => {
      let g = '';
      for (let i = -1; i <= 1; i++) {
        const fx = x + i * 11, fy = y - 40 - Math.abs(i) * -6;
        g += Ln(x, y - 10, fx, fy, '#5fae6b', 2.4);
        g += kind === 'sun' ? flowerG(fx, fy, 11, '#ffd84a', '#8a5a3c') : kind === 'tulip' ? P(`M${fx - 7} ${fy + 4} L${fx - 7} ${fy - 8} L${fx - 3} ${fy - 3} L${fx} ${fy - 10} L${fx + 3} ${fy - 3} L${fx + 7} ${fy - 8} L${fx + 7} ${fy + 4}Z`, col) : flowerG(fx, fy, 9, '#fff');
      }
      return g + P(`M${x - 18} ${y - 26} H${x + 18} L${x + 14} ${y} H${x - 14}Z`, col) + R(x - 20, y - 28, 40, 5, 2.5, dark(col, 0.12));
    };
    s += pail(-44, -70, '#9fd6ff', 'sun') + pail(44, -70, c, 'tulip') + pail(-30, -140, '#fff3d6', 'daisy') + pail(34, -140, '#ffb3c7', 'tulip') + pail(0, -210, c, 'daisy');
    return s + R(-50, -40, 100, 26, 4, '#3a4a40', stroked(st.wood, 3)) + txt(0, -22, 11, '#fff', 'posies');
  } }),
});

const BREADRACKS = series('breadrack', 'Bread Racks', 'Bread Rack', 'grocery', 'floor', {
  cottage: (st) => ({ name: 'Bakery Bread Rack', w: 230, h: 300, spawn: ['bread'], surfaces: [{ x1: -100, x2: 100, y: -280 }], art: (c) => {
    let s = R(-108, -280, 14, 280, 4, st.wood) + R(94, -280, 14, 280, 4, st.wood) + R(-110, -284, 220, 12, 4, st.wood);
    s += P('M-96 -200 L96 -220 L96 -208 L-96 -188Z', st.wood) + loafG(-60, -198, 1) + loafG(0, -204, 1) + loafG(58, -210, 1);
    s += P('M-96 -112 L96 -132 L96 -120 L-96 -100Z', st.wood) + croissantG(-62, -110, 1) + croissantG(-14, -114, 1) + croissantG(34, -120, 1) + croissantG(74, -124, 0.8);
    s += P('M-90 -20 H90 L80 -60 H-80Z', '#e8c08a') + [-60, -30, 0, 30, 60].map((x) => Ln(x, -58, x * 1.1, -22, '#c9965a', 3)).join('') + baguetteG(-50, -56, 1.1, -14) + baguetteG(-20, -58, 1.1, -4) + baguetteG(10, -58, 1.1, 6) + baguetteG(42, -56, 1.1, 14);
    return s + cloth('M-80 -60 Q0 -70 80 -60 L76 -50 H-76Z', c, 'check', 'y') + R(-48, -300, 96, 26, 6, '#fff3d6', stroked(st.wood, 3)) + txt(0, -282, 13, '#a86b4a', 'Bread');
  } }),
  sweet: (st) => ({ name: 'Sweet Bun Rack', w: 200, h: 290, spawn: ['bread', 'cupcake', 'donut'], surfaces: [{ x1: -86, x2: 86, y: -246 }], art: (c) => {
    let s = R(-92, -246, 8, 236, 4, GOLD) + R(84, -246, 8, 236, 4, GOLD) + C(-74, -10, 9, GOLD) + C(74, -10, 9, GOLD);
    for (const [y, k] of [[-246, 0], [-170, 1], [-94, 2]] as [number, number][]) {
      s += R(-92, y, 184, 8, 4, '#fff') + R(-92, y + 6, 184, 3, 1.5, c);
      const y2 = y + 70;
      s += k === 0 ? [-50, 0, 50].map((x) => loafG(x, y2 - 6, 0.8)).join('') : k === 1 ? [-56, -18, 20, 58].map((x, i) => donutG(x, y2 - 6, 1, CANDY[i])).join('') : [-54, -18, 18, 54].map((x, i) => cupcakeG(x, y2 - 6, 1, PACK[i])).join('');
      s += R(-92, y2 - 6, 184, 6, 3, '#fff', op(0.8));
    }
    return s + P(heartD(0, -284, 34), c) + txt(0, -258, 11, '#fff', 'Buns');
  } }),
});

const bakeryFront = (x: number, y: number, w: number, h: number, curve: boolean) =>
  curve ? P(`M${f(x)} ${f(y + h)} V${f(y + 30)} Q${f(x)} ${f(y)} ${f(x + 30)} ${f(y)} H${f(x + w)} V${f(y + h)}Z`, '#e6f7ff', op(0.45)) + P(`M${f(x)} ${f(y + h)} V${f(y + 30)} Q${f(x)} ${f(y)} ${f(x + 30)} ${f(y)} H${f(x + w)} V${f(y + h)}Z`, GLASS)
    : R(x, y, w, h, 4, '#e6f7ff', op(0.45)) + glassD(x, y, w, h, 4);
const BAKE_SPAWN = ['cupcake', 'donut', 'cookie', 'cake', 'bread'];
const BAKERYCASES = series('bakerycase', 'Bakery Cases', 'Bakery Case', 'grocery', 'floor', {
  sweet: (st) => ({ w: 280, h: 200, spawn: BAKE_SPAWN, surfaces: [{ x1: -130, x2: 130, y: -186 }], art: (c) => {
    let s = box(-136, -90, 272, 84, 16, c) + R(-130, -6, 260, 6, 3, dark(c, 0.2));
    for (let x = -120; x <= 120; x += 24) s += C(x, -60, 10, light(c, 0.35));
    s += R(-130, -184, 260, 96, 10, '#fff8fb') + R(-128, -136, 256, 5, 2, '#f2dfe8');
    s += [-100, -64, -28].map((x, i) => cupcakeG(x, -138, 1, PACK[i])).join('') + [10, 48, 86, 116].map((x, i) => donutG(x, -138, 0.9, CANDY[i])).join('');
    s += [-100, -60, -20, 20, 60, 100].map((x) => cookieG(x, -92, 1)).join('');
    s += bakeryFront(-132, -186, 264, 98, true) + R(-138, -192, 276, 8, 4, GOLD) + R(-138, -94, 276, 8, 4, GOLD);
    return s + P(heartD(0, -64, 24), '#fff') + txt(0, -22, 13, '#fff', 'Bakery');
  } }),
  cottage: (st) => ({ name: 'Cottage Pie Case', w: 280, h: 210, spawn: ['bread', 'cookie', 'cake'], surfaces: [{ x1: -130, x2: 130, y: -186 }], art: (c) => {
    let s = box(-136, -92, 272, 92, 6, st.wood) + planksV(-136, -92, 272, 92, 6, dark(st.wood, 0.15)) + cloth('M-136 -92 H136 V-64 Q0 -54 -136 -64Z', c, 'check', 'y');
    s += R(-130, -184, 260, 92, 4, '#fffaf0') + R(-130, -140, 260, 5, 2, st.wood);
    s += pieG(-90, -142, 1, '#e8384f') + pieG(-30, -142, 1, '#9b6bff') + loafG(34, -142, 0.9) + loafG(94, -142, 0.9);
    s += croissantG(-90, -96, 1) + croissantG(-40, -96, 1) + cookieG(14, -96, 1.1) + cookieG(50, -96, 1.1) + cookieG(90, -96, 1.1);
    s += bakeryFront(-132, -186, 264, 94, false) + R(-140, -192, 280, 10, 3, st.wood) + R(-140, -96, 280, 6, 2, st.wood);
    return s + R(-30, -244, 60, 50, 6, '#3a4a40', stroked(st.wood, 4)) + txt(0, -215, 11, '#fff', 'pies') + motif('daisy', -40, -200, 10);
  } }),
  candy: (st) => ({ name: 'Macaron Case', w: 280, h: 210, spawn: ['cupcake', 'donut', 'cookie'], surfaces: [{ x1: -128, x2: 128, y: -184 }], art: (c) => {
    let s = box(-132, -92, 264, 86, 12, c, 'dots') + cloth(dripD(-136, -96, 272, 12, 22, 9, 6), '#fff3f8', 'none', 'y') + R(-120, -6, 240, 6, 3, dark(c, 0.2));
    s += R(-128, -184, 256, 92, 20, '#fff8fb') + R(-126, -140, 252, 4, 2, '#f2dfe8');
    for (let i = 0; i < 9; i++) s += macaronG(-104 + i * 26, -142, CANDY[i % 5]);
    for (let i = 0; i < 8; i++) s += macaronG(-92 + i * 26, -160, CANDY[(i + 2) % 5]);
    s += [-90, -30, 30, 90].map((x, i) => cakeG(x, -96, 0.75, PACK[i], '#fff')).join('');
    s += bakeryFront(-128, -184, 256, 92, true) + R(-134, -190, 268, 8, 4, '#fff');
    return s + sprinkles(-110, -70, 220, 30, 12, 9) + C(-120, -200, 12, '#ff4f8b') + C(120, -200, 12, '#7cc8ff') + Ln(-120, -188, -120, -192, '#fff', 4);
  } }),
  princess: (st) => ({ name: 'Royal Cake Case', w: 280, h: 260, spawn: ['cake', 'cupcake'], surfaces: [{ x1: -128, x2: 128, y: -186 }], art: (c) => {
    let s = box(-132, -92, 264, 76, 12, c, 'hearts') + R(-132, -26, 264, 10, 5, GOLD) + R(-120, -16, 14, 16, 4, GOLD) + R(106, -16, 14, 16, 4, GOLD);
    s += R(-128, -186, 256, 94, 8, '#fffaff') + E(0, -100, 30, 6, GOLD) + R(-4, -112, 8, 12, 2, GOLD) + cakeG(0, -112, 1.2, '#ffd9e8', '#fff') + motif('crown', 0, -170, 10);
    s += [-96, -56, 56, 96].map((x, i) => cupcakeG(x, -96, 1, ['#c99bff', '#ff9ec7', '#ff9ec7', '#c99bff'][i])).join('');
    s += bakeryFront(-128, -186, 256, 94, false) + R(-136, -192, 272, 8, 4, GOLD) + R(-136, -96, 272, 8, 4, GOLD);
    s += P(archD(-90, -260, 180, 64, 50), '#fff') + P(archD(-80, -252, 160, 56, 44), 'none', stroked(st.trim, 3)) + txt(0, -214, 16, dark(c, 0.3), 'Cakes', 'font-style="italic"');
    return s + motif('crown', 0, -268, 14) + bowG(-110, -196, 0.6, '#ff7eb6') + bowG(110, -196, 0.6, '#ff7eb6');
  } }),
});

const SAMPLETABLES = series('sampletable', 'Sample Tables', 'Sample Table', 'grocery', 'floor', {
  sweet: (st) => ({ name: 'Sweet Tasting Table', w: 180, h: 200, spawn: ['cheese', 'cookie', 'strawberry'], surfaces: [{ x1: -80, x2: 80, y: -112 }], art: (c) => {
    let d = 'M-84 -112 H84 V-30';
    for (let i = 0; i < 6; i++) { const x = 84 - (i + 1) * 28; d += ` Q${x + 14} -14 ${x} -30`; }
    let s = leg(-70, -30, 30, GOLD, 8) + leg(70, -30, 30, GOLD, 8) + cloth(d + 'Z', c, 'hearts', 'y') + R(-86, -116, 172, 8, 4, '#fff');
    s += E(-36, -118, 34, 6, '#fff') + [-52, -40, -28, -16].map((x, i) => R(x - 5, -128, 10, 10, 2, i % 2 ? '#ffd84a' : '#fff3d8') + Ln(x, -128, x, -136, '#c9965a', 1.5)).join('');
    s += [20, 36, 52].map((x) => R(x - 6, -132, 12, 14, 3, '#fff', stroked('#e0e0ea', 1.5)) + R(x - 5, -126, 10, 7, 2, '#ff9ec7')).join('');
    return s + R(54, -186, 6, 70, 3, GOLD) + R(30, -200, 54, 30, 8, '#fff', stroked(c, 3)) + txt(57, -180, 11, c, 'Try me!');
  } }),
  modern: (st) => ({ name: 'Modern Sample Cart', w: 170, h: 200, spawn: ['cheese', 'juice', 'cookie'], surfaces: [{ x1: -76, x2: 76, y: -110 }], art: (c) => {
    let s = box(-76, -110, 152, 92, 4, c) + R(-76, -64, 152, 6, 0, st.accent) + C(-58, -10, 9, INK) + C(58, -10, 9, INK) + R(-80, -114, 160, 6, 2, INK);
    s += R(-60, -126, 70, 12, 3, '#fff') + [-50, -36, -22, -8].map((x) => R(x - 5, -136, 10, 10, 2, '#ffd84a') + Ln(x, -136, x, -144, '#c9965a', 1.5)).join('') + bottleG(40, -114, 44, '#ff9a6b');
    return s + R(-60, -100, 120, 26, 4, '#fff') + txt(0, -82, 12, INK, 'Free taste!');
  } }),
});

const AISLESIGNS = series('aislesign', 'Aisle Signs', 'Aisle Sign', 'grocery', 'wall', {
  sweet: (st) => ({ name: 'Sweet Fruit Sign', w: 260, h: 120, art: (c) => Ln(-90, -60, -80, -26, GOLD, 3) + Ln(90, -60, 80, -26, GOLD, 3) + box(-120, -30, 240, 70, 35, c) + R(-108, -22, 216, 54, 27, '#fff') + appleF(-80, 6, 14) + appleF(80, 6, 14, '#7fd36b') + txt(0, 14, 24, dark(c, 0.3), 'Fruit') + P(heartD(-118, -36, 14), '#fff') + P(heartD(118, -36, 14), '#fff') }),
  modern: (st) => ({ name: 'Aisle Number Sign', w: 280, h: 120, art: (c) => Ln(-100, -60, -100, -30, INK, 3) + Ln(100, -60, 100, -30, INK, 3) + R(-130, -32, 260, 72, 4, INK) + R(-122, -24, 56, 56, 4, st.accent) + txt(-94, 14, 34, '#fff', '1') + txt(30, 0, 16, '#fff', 'Snacks') + txt(30, 22, 13, '#7fe0ff', 'Cereal · Juice') }),
  rainbow: (st) => ({ name: 'Rainbow Treats Sign', w: 280, h: 140, art: (c) => Ln(-60, -70, -60, -40, '#fff', 3) + Ln(60, -70, 60, -40, '#fff', 3) + RAIN.map((col, i) => S(`M${-120 + i * 8} 30 A${120 - i * 8} ${70 - i * 8} 0 0 1 ${120 - i * 8} 30`, col, 8)).join('') + motif('cloud', -110, 30, 22) + motif('cloud', 110, 30, 22) + R(-60, -10, 120, 40, 20, '#fff') + txt(0, 18, 20, '#c99bff', 'Treats') }),
});

const GROCERIES: FurnDef[] = [
  dish('carrot', 'Carrot', 'grocery', 'Groceries', 40, 76, () => carrotF(0, -54, 1.3)),
  dish('broccoli', 'Broccoli', 'grocery', 'Groceries', 56, 60, () => broccoliF(0, 0, 1.5)),
  dish('tomato', 'Tomato', 'grocery', 'Groceries', 50, 46, () => tomatoF(0, -20, 20)),
  dish('grapes', 'Grapes', 'grocery', 'Groceries', 50, 70, () => grapeF(0, -26, 1.6)),
  dish('watermelon', 'Watermelon Slice', 'grocery', 'Groceries', 70, 50, () => P('M-34 0 Q0 10 34 0 L0 -50Z', '#ff5a6e') + P('M-34 0 Q0 10 34 0 Q0 2 -34 0Z', '#4fa85c') + P('M-36 1 Q0 14 36 1 L34 -2 Q0 9 -34 -2Z', '#4fa85c') + P('M-30 -4 Q0 4 30 -4', 'none', stroked('#e8fbd8', 3)) + [[-10, -16], [8, -18], [0, -30], [-16, -8], [16, -8]].map(([x, y]) => E(x, y, 1.8, 3, INK)).join('')),
  dish('bread', 'Bread Loaf', 'grocery', 'Groceries', 70, 40, () => loafG(0, 0, 1.25)),
  dish('eggs', 'Egg Carton', 'grocery', 'Groceries', 80, 40, () => [-24, -8, 8, 24].map((x) => E(x, -18, 8, 11, '#fff8ee') + E(x - 2, -22, 2.5, 3.5, '#fff', op(0.8))).join('') + P('M-34 -16 H34 L30 0 H-30Z', '#e8d8c0') + [-24, -8, 8, 24].map((x) => P(`M${x - 7} -16 Q${x} -8 ${x + 7} -16`, 'none', stroked('#cdb898', 2))).join('')),
  dish('cereal', 'Cereal Box', 'grocery', 'Groceries', 50, 76, () => cerealG(0, 0, 44, 70, '#ff7eb6', 0)),
  dish('orange', 'Orange', 'grocery', 'Groceries', 46, 50, () => orangeF(0, -21, 20)),
];

// =====================================================================
// RESTAURANT
// =====================================================================
// ---- dishes: each is drawn standing on y, scaled by s, so menus can show them too ----
const burgerG = (x: number, y: number, s: number) => tr(x, y,
  P('M-30 -8 Q-30 0 -22 0 H22 Q30 0 30 -8Z', '#e8a64a') + R(-32, -20, 64, 13, 6.5, '#8a4a2a') + P('M-32 -20 H32 L28 -12 L20 -18 L12 -8 L4 -18 L-8 -12 L-16 -18 L-26 -10Z', '#ffd84a') +
  E(-14, -22, 12, 4, '#ff5a5a') + E(12, -22, 12, 4, '#ff5a5a') + P('M-34 -24 Q-24 -30 -14 -24 Q-4 -30 6 -24 Q16 -30 26 -24 Q32 -28 34 -24 L30 -21 H-30Z', '#7fd36b') +
  P('M-30 -26 Q-30 -54 0 -54 Q30 -54 30 -26Z', '#f0b25a') + P('M-30 -26 Q-30 -54 0 -54 Q30 -54 30 -26Z', 'url(#g-shadeX)') + [[-14, -42], [0, -47], [12, -40], [-4, -36], [20, -33], [-20, -33]].map(([a, b]) => E(a, b, 2.4, 1.4, '#fff8ee')).join('') + E(-12, -46, 8, 3, '#fff', op(0.35)), s);
const spaghettiG = (x: number, y: number, s: number) => tr(x, y,
  plateE(0, 0, 40) + P('M-30 -6 Q-32 -30 0 -32 Q32 -30 30 -6Z', '#ffd98a') + S('M-24 -10 Q-10 -30 4 -12 Q14 -28 24 -10 M-18 -16 Q0 -36 18 -16 M-26 -14 Q-6 -24 12 -8', '#f0c060', 2.4) +
  P('M-20 -24 Q0 -36 20 -24 Q10 -16 0 -20 Q-10 -16 -20 -24Z', '#e8473d') + C(-10, -26, 7, '#9a4a2a') + C(8, -28, 7, '#9a4a2a') + C(0, -34, 6, '#8a3a1e') + C(-12, -28, 2, '#fff', op(0.4)) + C(6, -30, 2, '#fff', op(0.4)) + leaf(-4, -38, 0.6, -30, '#4fa85c') + leaf(2, -38, 0.6, -150, '#5fbf6a'), s);
const pancakesG = (x: number, y: number, s: number) => tr(x, y,
  plateE(0, 0, 40) + [0, 1, 2, 3].map((i) => E(0, -8 - i * 10, 30, 7, '#d99a52') + E(0, -11 - i * 10, 29, 6, '#f0c070')).join('') + R(-8, -50, 16, 8, 2, '#fff3a0') +
  P('M-24 -42 Q0 -50 24 -42 L26 -32 Q22 -26 20 -34 Q10 -40 -4 -38 L-6 -28 Q-9 -24 -11 -30 L-12 -38 Q-20 -38 -24 -36Z', '#b5651d', op(0.85)) + berryF(-24, -6, 7) + berryF(28, -6, 7), s);
const sushiG = (x: number, y: number, s: number) => tr(x, y,
  R(-44, -8, 88, 8, 2, '#d9a066') + R(-38, 0, 8, 4, 1, '#b07a4f') + R(30, 0, 8, 4, 1, '#b07a4f') +
  [-26, -2].map((cx) => R(cx - 11, -32, 22, 24, 4, '#2d3a2a') + E(cx, -32, 11, 4, '#fff') + E(cx, -32, 5, 2.4, '#ff8a6b') + C(cx - 2, -33, 1.4, '#7fd36b')).join('') +
  E(26, -14, 15, 6, '#fff') + P('M10 -18 Q26 -30 42 -18 Q26 -14 10 -18Z', '#ff8a6b') + S('M16 -20 l4 -4 M24 -22 l4 -4 M32 -22 l4 -3', '#ffc0a8', 1.6) + R(22, -20, 6, 8, 1, '#2d3a2a'), s);
const saladG = (x: number, y: number, s: number) => tr(x, y,
  [[-22, -24, 13], [-6, -30, 14], [12, -28, 13], [24, -22, 11], [0, -22, 14]].map(([a, b, r], i) => C(a, b, r, ['#7fd36b', '#5fbf6a', '#8fe08a', '#6fc47c', '#9fe07a'][i])).join('') +
  C(-12, -30, 5, '#ff4a4a') + C(14, -32, 5, '#ff4a4a') + E(4, -22, 6, 4, '#e8fbd8', stroked('#5fae6b', 1.5)) + E(-22, -20, 5, 3.5, '#e8fbd8', stroked('#5fae6b', 1.5)) + R(20, -30, 6, 4, 1, '#ffd84a') +
  P('M-36 -20 H36 Q34 0 0 0 Q-34 0 -36 -20Z', '#fff') + P('M-36 -20 H36 Q34 0 0 0 Q-34 0 -36 -20Z', 'url(#g-shadeX)') + R(-36, -22, 72, 4, 2, '#9fd6ff'), s);
const milkshakeG = (x: number, y: number, s: number, col = '#ffb3c7') => tr(x, y,
  Ln(6, -96, 14, -116, '#ff4f6d', 5) + Ln(6, -96, 14, -116, '#fff', 2, 'stroke-dasharray="3 4"') + E(0, -2, 14, 4, '#e3ecf6') + R(-3, -18, 6, 16, 2, '#e3ecf6') + P('M-20 -76 H20 L12 -18 H-12Z', col) + P('M-20 -76 H20 L12 -18 H-12Z', GLASS) +
  C(-12, -80, 10, '#fff') + C(0, -86, 12, '#fff') + C(12, -80, 10, '#fff') + C(0, -98, 6, '#e8384f') + S('M0 -104 Q4 -110 8 -112', '#5f8f3a', 1.8) + R(-14, -70, 4, 40, 2, '#fff', op(0.5)), s);
const friesG = (x: number, y: number, s: number) => tr(x, y,
  [[-14, -60, -8], [-6, -66, -2], [2, -62, 4], [10, -66, 8], [16, -58, 12], [-18, -54, -14], [6, -70, 0]].map(([a, b, r]) => `<rect x="${a - 3}" y="${b}" width="7" height="44" rx="2" fill="#ffd84a" transform="rotate(${r} ${a} ${b + 40})"/>`).join('') +
  P('M-22 -36 H22 L18 0 H-18Z', '#e8384f') + P('M-22 -36 Q0 -26 22 -36 L20 -28 Q0 -18 -20 -28Z', '#c92a3a') + P(heartD(0, -24, 12), '#ffd84a'), s);
const sundaeG = (x: number, y: number, s: number) => tr(x, y,
  E(0, -2, 16, 4, '#e3ecf6') + R(-3, -20, 6, 18, 2, '#e3ecf6') + P('M-26 -46 Q-26 -20 0 -20 Q26 -20 26 -46Z', '#e6f4ff', op(0.8)) + C(-12, -50, 13, '#ffb3c7') + C(12, -50, 13, '#fff3d8') + C(0, -62, 13, '#8a5a3c') +
  P('M-14 -66 Q0 -76 14 -66 Q16 -58 10 -60 Q8 -52 4 -58 Q-2 -50 -6 -58 Q-12 -52 -12 -60Z', '#5a2a1a') + C(0, -78, 6, '#e8384f') + sprinkles(-18, -64, 36, 12, 6, 8) + P('M-26 -46 Q-26 -20 0 -20 Q26 -20 26 -46Z', GLASS) + Ln(18, -60, 26, -80, '#ffd84a', 5), s);
const tacoG = (x: number, y: number, s: number) => tr(x, y,
  P('M-34 -4 Q-34 -40 0 -40 Q34 -40 34 -4Z', '#ffd36b') + [[-22, -34], [-8, -40], [8, -40], [22, -34]].map(([a, b], i) => C(a, b, 9, ['#7fd36b', '#ff4a4a', '#7fd36b', '#ffd84a'][i])).join('') + P('M-26 -30 Q0 -44 26 -30 L24 -24 H-24Z', '#9a5a3a') +
  P('M-38 0 Q-38 -34 0 -34 Q38 -34 38 0Z', '#f4c060') + P('M-38 0 Q-38 -34 0 -34 Q38 -34 38 0Z', 'url(#g-shadeX)') + [[-20, -14], [0, -24], [18, -12], [-6, -8]].map(([a, b]) => C(a, b, 2, '#d99a3a')).join(''), s);
const soupG = (x: number, y: number, s: number, anim = true) => tr(x, y,
  (anim ? steam(-6, -34, 0.9) + steam(10, -36, 0.8) : '') + E(0, -2, 22, 4, dark('#ff9ec7', 0.1)) + P('M-36 -26 H36 Q34 -2 0 -2 Q-34 -2 -36 -26Z', '#ff9ec7') + P('M-36 -26 H36 Q34 -2 0 -2 Q-34 -2 -36 -26Z', 'url(#g-shadeX)') +
  E(0, -26, 36, 7, '#ffab3d') + E(0, -26, 36, 7, 'none', stroked('#fff', 2.5)) + C(-12, -27, 3, '#ff8a3d') + C(8, -25, 3, '#7fd36b') + C(16, -28, 2.5, '#fff3d8') + P(heartD(0, -18, 8), '#fff') + Ln(18, -26, 36, -46, '#c9cfdd', 4) + E(14, -24, 7, 3, '#c9cfdd'), s);
const DISHES: FurnDef[] = [
  dish('burger', 'Burger', 'restaurant', 'Dishes', 72, 60, () => burgerG(0, 0, 1)),
  dish('spaghetti', 'Spaghetti', 'restaurant', 'Dishes', 90, 46, () => spaghettiG(0, 0, 1.05)),
  dish('pancakes', 'Pancakes', 'restaurant', 'Dishes', 90, 60, () => pancakesG(0, 0, 1.05)),
  dish('sushi', 'Sushi Plate', 'restaurant', 'Dishes', 96, 40, () => sushiG(0, 0, 1)),
  dish('salad', 'Salad', 'restaurant', 'Dishes', 80, 50, () => saladG(0, 0, 1)),
  dish('milkshake', 'Milkshake', 'restaurant', 'Dishes', 48, 116, () => milkshakeG(0, 0, 1)),
  dish('fries', 'Fries', 'restaurant', 'Dishes', 52, 72, () => friesG(0, 0, 1)),
  dish('sundae', 'Sundae', 'restaurant', 'Dishes', 58, 86, () => sundaeG(0, 0, 1)),
  dish('taco', 'Taco', 'restaurant', 'Dishes', 80, 50, () => tacoG(0, 0, 1)),
  dish('soup', 'Soup', 'restaurant', 'Dishes', 80, 56, () => soupG(0, 0, 1)),
];

// ---- tables & chairs ----
type ChairFn = (x: number, c: string) => string;
const heartChair: ChairFn = (x, c) => leg(x - 34, -84, 84, GOLD, 8) + leg(x + 34, -84, 84, GOLD, 8) + R(x - 7, -150, 14, 60, 6, dark(c, 0.1)) + P(heartD(x, -206, 66), c) + P(heartD(x, -206, 66), 'url(#g-shadeX)') + P(heartD(x, -190, 34), light(c, 0.4)) + box(x - 48, -98, 96, 20, 10, dark(c, 0.06), 'none', 'y');
const moldChair: ChairFn = (x, c) => `<g transform="rotate(8 ${x - 28} -40)">${R(x - 32, -80, 6, 80, 3, WOOD)}</g><g transform="rotate(-8 ${x + 28} -40)">${R(x + 26, -80, 6, 80, 3, WOOD)}</g>` + Ln(x - 26, -50, x + 26, -50, INK, 2.5) + cloth(`M${x - 46} -166 Q${x - 52} -110 ${x - 46} -94 Q${x - 46} -78 ${x - 28} -78 H${x + 28} Q${x + 46} -78 ${x + 46} -94 Q${x + 52} -110 ${x + 46} -166 Q${x + 36} -176 ${x} -176 Q${x - 36} -176 ${x - 46} -166Z`, c) + gloss(x - 38, -164, 7, 46);
const ladderChair: ChairFn = (x, c) => {
  let s = R(x - 40, -204, 11, 204, 5, WOOD) + R(x + 29, -204, 11, 204, 5, WOOD) + C(x - 35, -206, 7, WOOD) + C(x + 35, -206, 7, WOOD);
  for (const y of [-188, -162, -136]) s += box(x - 30, y, 60, 11, 5, WOOD);
  return s + R(x - 36, -40, 72, 6, 3, WOOD_D) + box(x - 48, -98, 96, 14, 5, WOOD) + cloth(`M${x - 46} -108 Q${x} -116 ${x + 46} -108 Q${x + 50} -96 ${x + 42} -94 H${x - 42} Q${x - 50} -96 ${x - 46} -108Z`, c, 'check', 'y');
};
const throneChair: ChairFn = (x, c) => {
  let s = R(x - 40, -84, 8, 84, 4, GOLD) + R(x + 32, -84, 8, 84, 4, GOLD) + P(archD(x - 46, -240, 92, 154, 52), GOLD) + cloth(archD(x - 38, -232, 76, 144, 46), c, 'hearts');
  return s + motif('crown', x, -246, 16) + box(x - 54, -100, 108, 22, 11, c, 'none', 'y') + R(x - 54, -82, 108, 5, 2.5, GOLD);
};
const stumpSeat: ChairFn = (x, c) => box(x - 38, -90, 76, 90, 14, '#a86b4a') + S(`M${x - 20} -80 V-8 M${x + 14} -84 V-10`, '#7a4a32', 2) + E(x, -90, 38, 10, '#e8b46a') + E(x, -90, 26, 6, 'none', stroked('#c98a5a', 2)) + E(x, -92, 30, 6, c, op(0.85)) + leaf(x + 30, -8, 1, -30);
const deckChair: ChairFn = (x, c) => {
  let s = `<g transform="rotate(10 ${x} -60)">${R(x - 3, -120, 6, 130, 3, WOOD)}</g><g transform="rotate(-10 ${x} -60)">${R(x - 3, -120, 6, 130, 3, WOOD)}</g>`;
  s += cloth(`M${x - 40} -200 H${x + 40} L${x + 44} -100 H${x - 44}Z`, c, 'stripes') + R(x - 44, -204, 88, 8, 4, WOOD);
  return s + box(x - 50, -100, 100, 16, 6, WOOD) + starfishLike(x + 26, -170);
};
function starfishLike(x: number, y: number) { return P(starD(x, y, 9, 0.5), '#ffab5e'); }

const DININGSETS = series('diningset', 'Tables for Two', 'Table for Two', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweetheart Table for Two', w: 380, h: 230, seats: [sit(-130, -86), sit(130, -86)], surfaces: [{ x1: -70, x2: 70, y: -146 }], art: (c) => {
    let s = heartChair(-130, c) + heartChair(130, c) + E(0, -6, 40, 8, GOLD) + R(-8, -110, 16, 106, 6, GOLD) + E(0, -146, 78, 12, '#fff');
    let d = 'M-80 -144 Q0 -156 80 -144 L82 -104';
    for (let i = 0; i < 6; i++) { const x = 82 - (i + 1) * 27.3; d += ` Q${f(x + 13.6)} -90 ${f(x)} -104`; }
    s += cloth(d + 'Z', light(c, 0.3), 'hearts', 'y');
    return s + R(-74, -160, 10, 14, 3, '#fff', op(0.85)) + flowerG(-69, -168, 7, c) + P(heartD(0, -132, 12), '#fff');
  } }),
  modern: (st) => ({ name: 'Modern Bistro Set', w: 380, h: 200, seats: [sit(-130, -84), sit(130, -84)], surfaces: [{ x1: -66, x2: 66, y: -140 }], art: (c) => {
    let s = moldChair(-130, c) + moldChair(130, c);
    s += S('M-50 0 L-30 -136 M50 0 L30 -136 M-40 -70 H40', INK, 4) + R(-70, -146, 140, 10, 2, '#fff') + R(-70, -138, 140, 4, 1, WOOD);
    return s + R(54, -164, 8, 18, 3, INK) + C(58, -168, 5, '#7fe0b0');
  } }),
  cottage: (st) => ({ name: 'Cottage Café Set', w: 380, h: 230, seats: [sit(-130, -88), sit(130, -88)], surfaces: [{ x1: -72, x2: 72, y: -146 }], art: (c) => {
    let s = ladderChair(-130, c) + ladderChair(130, c);
    s += R(-62, -140, 12, 140, 5, WOOD) + R(50, -140, 12, 140, 5, WOOD) + box(-76, -150, 152, 14, 4, WOOD) + cloth('M-60 -150 H60 V-110 L0 -100 L-60 -110Z', c, 'check', 'y');
    return s + bottleG(-60, -150, 34, '#5fae6b') + C(-60, -188, 4, '#ffd24a') + `<g transform="translate(-60 -192)">${flame(0, 0, 0.35)}</g>`;
  } }),
  princess: (st) => ({ name: 'Royal Dinner for Two', w: 400, h: 260, seats: [sit(-136, -88), sit(136, -88)], surfaces: [{ x1: -70, x2: 70, y: -146 }], art: (c) => {
    let s = throneChair(-136, c) + throneChair(136, c);
    s += P('M-20 0 L20 0 L8 -100 L14 -140 H-14 L-8 -100Z', GOLD) + E(0, -146, 80, 10, '#fff') + cloth('M-80 -146 H80 L76 -118 Q0 -104 -76 -118Z', c, 'none', 'y') + R(-80, -126, 160, 4, 2, GOLD);
    for (let i = 0; i < 5; i++) s += C(-64 + i * 32, -112, 3.5, GOLD);
    return s + R(52, -186, 6, 40, 2, GOLD) + E(55, -146, 10, 3, GOLD) + R(51, -200, 8, 16, 2, '#fff8ee') + `<g transform="translate(55 -202)">${flame(0, 0, 0.32)}</g>`;
  } }),
});

/** A table for four: the table is drawn in front so the guests behind it look seated. */
const FAMILYTABLES = series('familytable', 'Tables for Four', 'Table for Four', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweet Family Table', w: 560, h: 240, seats: [sit(-220, -86), sit(-72, -100), sit(72, -100), sit(220, -86)], surfaces: [{ x1: -136, x2: 136, y: -150 }],
    art: (c) => P(heartD(-72, -236, 70), c) + P(heartD(-72, -236, 70), 'url(#g-shadeX)') + P(heartD(72, -236, 70), c) + P(heartD(72, -236, 70), 'url(#g-shadeX)') + box(-122, -112, 100, 18, 9, dark(c, 0.06)) + box(22, -112, 100, 18, 9, dark(c, 0.06)) + heartChair(-220, c) + heartChair(220, c),
    front: (c) => {
      let d = 'M-146 -150 H146 V-84';
      for (let i = 0; i < 9; i++) { const x = 146 - (i + 1) * 32.4; d += ` Q${f(x + 16.2)} -68 ${f(x)} -84`; }
      return leg(-120, -84, 84, GOLD, 10) + leg(120, -84, 84, GOLD, 10) + box(-150, -156, 300, 12, 6, '#fff') + cloth(d + 'Z', light(c, 0.3), 'hearts', 'y') + [-110, -40, 40, 110].map((x) => P(heartD(x, -134, 9), '#fff')).join('');
    } }),
  woodland: (st) => ({ name: 'Log Picnic Table', w: 560, h: 240, seats: [sit(-220, -90), sit(-72, -100), sit(72, -100), sit(220, -90)], surfaces: [{ x1: -140, x2: 140, y: -150 }],
    art: (c) => box(-140, -112, 280, 16, 8, '#c98a5a') + R(-130, -100, 10, 100, 4, '#a86b4a') + R(120, -100, 10, 100, 4, '#a86b4a') + stumpSeat(-220, c) + stumpSeat(220, c) + leaf(-120, -114, 1, -150, '#e8573d') + leaf(110, -114, 1, -20, '#ffab5e'),
    front: (c) => {
      let s = '';
      for (const x of [-100, 100]) s += `<g transform="rotate(${x < 0 ? 14 : -14} ${x} -70)">${box(x - 9, -140, 18, 140, 8, '#a86b4a')}</g><g transform="rotate(${x < 0 ? -14 : 14} ${x} -70)">${box(x - 9, -140, 18, 140, 8, '#8a5a3c')}</g>`;
      s += box(-150, -158, 300, 20, 10, '#c98a5a') + C(-150, -148, 10, '#e8b46a') + C(150, -148, 10, '#e8b46a') + C(-150, -148, 5, 'none', stroked('#a86b4a', 1.5)) + grain(-140, -156, 280, 14, '#8a5a3c', 4);
      return s + cloth('M-60 -158 H60 V-130 L0 -122 L-60 -130Z', c, 'check', 'y');
    } }),
  beach: (st) => ({ name: 'Beach Umbrella Table', w: 560, h: 380, seats: [sit(-220, -96), sit(-72, -104), sit(72, -104), sit(220, -96)], surfaces: [{ x1: -134, x2: -12, y: -150 }, { x1: 12, x2: 134, y: -150 }],
    art: (c) => {
      let s = R(-3, -350, 6, 200, 3, '#fff') + P('M-170 -300 Q0 -390 170 -300Z', c);
      for (let i = 0; i < 6; i++) if (i % 2) s += P(`M0 -360 L${-170 + i * 56.7} -300 L${-170 + (i + 1) * 56.7} -300Z`, '#fff');
      for (let i = 0; i < 6; i++) s += P(`M${-170 + i * 56.7} -300 q28.3 14 56.7 0`, i % 2 ? '#fff' : c);
      return s + C(0, -362, 6, st.wood) + deckChair(-72, c) + deckChair(72, c) + deckChair(-220, c) + deckChair(220, c);
    },
    front: (c) => R(-140, -150, 280, 12, 6, st.wood) + R(-136, -140, 272, 6, 3, dark(st.wood, 0.15)) + Ln(-110, -140, -130, 0, st.wood, 9) + Ln(110, -140, 130, 0, st.wood, 9) + Ln(-120, -60, 120, -60, st.wood, 6) + motif('fish', 0, -100, 14) + R(-3, -160, 6, 160, 3, '#fff') }),
});

const boothBack = (x: number, c: string, kind: string, st: FurnStyle) => {
  if (kind === 'sweet') {
    let g = box(x - 76, -236, 152, 150, 44, c) + R(x - 64, -222, 128, 122, 34, light(c, 0.15));
    for (const [dx, dy] of [[-36, -190], [0, -190], [36, -190], [-18, -158], [18, -158], [-36, -126], [0, -126], [36, -126]]) g += C(x + dx, dy, 3, dark(c, 0.2)) + C(x + dx - 1, dy - 1, 1, '#fff');
    return g + P(heartD(x, -262, 40), c) + P(heartD(x, -256, 18), '#fff', op(0.8));
  }
  if (kind === 'retro') {
    let g = box(x - 78, -230, 156, 140, 26, c);
    for (let i = 0; i < 4; i++) g += box(x - 66 + i * 34, -220, 30, 122, 14, light(c, 0.12));
    return g + R(x - 80, -236, 160, 9, 4.5, SIL);
  }
  if (kind === 'modern') return box(x - 78, -222, 156, 132, 4, c) + Array.from({ length: 7 }, (_, i) => Ln(x - 60 + i * 20, -214, x - 60 + i * 20, -98, dark(c, 0.12), 3)).join('') + R(x - 82, -228, 164, 8, 2, WOOD);
  const arch = archD(x - 78, -250, 156, 160, 70);
  return cloth(arch, c) + sprinkles(x - 60, -200, 120, 90, 12, x > 0 ? 6 : 2) + P(archD(x - 66, -238, 132, 40, 34), '#fff3f8') + C(x, -256, 10, st.trim) + C(x - 3, -259, 3, '#fff', op(0.6));
};
const booth = (kind: string, st: FurnStyle, extra: (c: string) => string, tableCol: (c: string) => string, base: string): Spec => ({
  w: 430, h: kind === 'modern' ? 280 : 270, seats: [sit(-128, -94), sit(128, -94)], surfaces: [{ x1: -56, x2: 56, y: -150 }],
  art: (c) => {
    let s = boothBack(-128, c, kind, st) + boothBack(128, c, kind, st);
    for (const x of [-128, 128]) s += box(x - 78, -100, 156, 24, 12, kind === 'modern' ? dark(c, 0.08) : c, 'none', 'y') + R(x - 72, -78, 144, 74, 6, base);
    s += R(-8, -146, 16, 140, 4, base) + E(0, -6, 36, 6, base) + box(-66, -154, 132, 14, 6, tableCol(c)) + R(-66, -144, 132, 4, 2, dark(tableCol(c), 0.2));
    return s + extra(c);
  },
});
const BOOTHS = series('booth', 'Diner Booths', 'Booth', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweetheart Booth', ...booth('sweet', st, (c) => R(-34, -168, 12, 14, 3, '#fff', stroked(c, 2)) + R(24, -166, 16, 12, 3, SIL), () => '#fff', light(ST.sweet.main, 0.3)) }),
  retro: (st) => ({ name: 'Retro Diner Booth', ...booth('retro', st, () => R(-30, -184, 30, 30, 6, st.accent) + R(-26, -180, 22, 12, 6, '#fff6c8') + C(-15, -162, 3, st.trim) + R(18, -168, 10, 14, 2, '#e8384f') + R(30, -166, 10, 12, 2, '#ffd84a'), () => '#fff', SIL) }),
  modern: (st) => ({ name: 'Modern Booth', ...booth('modern', st, (c) => Ln(0, -270, 0, -220, INK, 2) + P('M-20 -200 L20 -200 L10 -220 H-10Z', INK) + glow(0, -190, 40) + R(-30, -166, 10, 12, 2, '#fff'), () => WOOD, INK) }),
  candy: (st) => ({ name: 'Candy Booth', ...booth('candy', st, () => cupcakeG(-28, -154, 0.8, '#7cc8ff') + C(26, -164, 10, CANDY[0]) + S('M21 -164 A5 5 0 1 1 26 -159', '#fff', 2.5), () => '#a8e6cf', '#fff') }),
});

const DINERCOUNTERS = series('dinercounter', 'Diner Counters', 'Diner Counter', 'restaurant', 'floor', {
  retro: (st) => ({ name: 'Retro Diner Counter', w: 440, h: 270, seats: [sit(-140, -128), sit(0, -128), sit(140, -128)], surfaces: [{ x1: -150, x2: 216, y: -184 }], art: (c) => {
    let s = box(-216, -180, 432, 172, 10, '#fff') + R(-216, -60, 432, 52, 0, c);
    for (let x = -216; x < 216; x += 24) s += R(x, -60, 12, 26, 0, INK, op(0.85)) + R(x + 12, -34, 12, 26, 0, INK, op(0.85));
    s += R(-222, -190, 444, 14, 6, st.accent) + R(-222, -180, 444, 4, 2, SIL) + R(-216, -68, 432, 6, 0, SIL) + R(-216, -8, 432, 8, 0, SIL);
    s += E(-180, -190, 24, 4, SIL) + R(-182, -224, 4, 34, 2, SIL) + P('M-202 -194 Q-202 -250 -180 -250 Q-158 -250 -158 -194Z', '#e6f4ff', op(0.6)) + pieG(-180, -192, 0.8) + P('M-202 -194 Q-202 -250 -180 -250 Q-158 -250 -158 -194Z', GLASS);
    for (const x of [-140, 0, 140]) s += E(x, -4, 30, 6, SIL) + R(x - 5, -120, 10, 116, 4, SIL) + R(x - 40, -126, 80, 10, 5, SIL) + box(x - 40, -146, 80, 24, 12, c, 'none', 'y');
    return s + gloss(-210, -170, 40, 6);
  } }),
  sweet: (st) => ({ name: 'Sweet Soda Counter', w: 440, h: 270, seats: [sit(-140, -128), sit(0, -128), sit(140, -128)], surfaces: [{ x1: -216, x2: 150, y: -184 }], art: (c) => {
    let s = box(-216, -180, 432, 172, 22, c) + R(-216, -100, 432, 92, 0, light(c, 0.3));
    for (let x = -196; x <= 196; x += 28) s += P(heartD(x, -84, 14), '#fff', op(0.7));
    s += box(-222, -192, 444, 16, 8, '#fff', 'none', 'y') + R(-222, -180, 444, 4, 2, GOLD);
    s += E(180, -192, 22, 4, GOLD) + R(178, -218, 4, 26, 2, GOLD) + cupcakeG(170, -218, 0.8, '#ff9ec7') + cupcakeG(190, -218, 0.8, '#c99bff') + E(180, -220, 26, 4, GOLD);
    for (const x of [-140, 0, 140]) s += E(x, -4, 30, 6, GOLD) + R(x - 5, -120, 10, 116, 4, GOLD) + P(heartD(x, -158, 44), c) + P(heartD(x, -158, 44), 'url(#g-shadeX)') + box(x - 38, -134, 76, 14, 7, '#fff', 'none', 'y');
    return s + gloss(-210, -170, 40, 6);
  } }),
});

const GRILL_SPAWN = ['burger', 'pancakes', 'fries'];
const sizzle = (x: number, y: number) => steam(x, y, 0.8);
const CHEFGRILLS = series('chefgrill', 'Chef Grills', 'Chef Grill', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweet Chef Grill', w: 260, h: 290, toggle: true, spawn: GRILL_SPAWN, surfaces: [{ x1: -110, x2: 110, y: -190 }], art: (c, on) => {
    let s = box(-120, -180, 240, 170, 20, c) + R(-110, -10, 220, 10, 4, dark(c, 0.2));
    s += R(-126, -194, 252, 16, 6, SIL) + R(-118, -192, 236, 4, 2, '#fff', op(0.6));
    s += E(-50, -194, 26, 5, '#8a4a2a') + E(-50, -196, 22, 3.5, '#a85a32') + E(40, -194, 30, 5, '#f0c070') + E(40, -196, 26, 3.5, '#f4d090');
    if (on) s += sizzle(-50, -200) + sizzle(40, -200) + [-80, -50, -20, 20, 50, 80].map((x) => flame(x, -178, 0.45)).join('');
    for (let i = 0; i < 4; i++) s += C(-72 + i * 48, -160, 9, '#fff') + C(-72 + i * 48, -160, 3.5, on && i < 2 ? '#ff4f6d' : c);
    s += R(-90, -140, 180, 100, 14, '#fff', op(0.85)) + R(-80, -130, 160, 80, 10, on ? '#ffb35e' : '#4a3346') + (on ? glow(0, -90, 70) : '') + R(-80, -130, 160, 80, 10, GLASS) + R(-50, -146, 100, 8, 4, GOLD);
    s += R(-112, -280, 224, 80, 10, '#fff', op(0.95)) + Array.from({ length: 4 }, (_, i) => Ln(-112, -260 + i * 18, 112, -260 + i * 18, light(c, 0.4), 1.6)).join('');
    s += Ln(-60, -272, -60, -230, SIL, 3) + R(-72, -230, 24, 16, 3, SIL) + Ln(0, -272, 0, -236, '#c98a5a', 4) + E(0, -228, 10, 8, '#c98a5a') + Ln(60, -272, 60, -240, SIL, 3) + E(60, -232, 14, 8, SIL);
    s += tr(96, -244, E(0, 0, 18, 6, '#fff') + P('M-14 -2 V-16 Q-22 -30 -8 -30 Q0 -40 8 -30 Q22 -30 14 -16 V-2Z', '#fff') + R(-14, -8, 28, 6, 0, light(c, 0.4)));
    return s + P(heartD(0, -50, 18), '#fff') + gloss(-112, -170, 7, 60);
  } }),
  modern: (st) => ({ name: 'Pro Chef Range', w: 270, h: 280, toggle: true, spawn: GRILL_SPAWN, surfaces: [{ x1: -120, x2: 120, y: -188 }], art: (c, on) => {
    let s = R(-128, -14, 256, 14, 0, INK) + box(-132, -180, 264, 168, 4, c) + R(-136, -192, 272, 12, 2, INK);
    for (let x = -120; x <= 120; x += 12) s += Ln(x, -190, x, -184, '#6a6a7e', 3);
    if (on) s += [-100, -70, -40, -10, 20, 50, 80, 110].map((x) => flame(x, -186, 0.5)).join('') + sizzle(-30, -200) + sizzle(50, -200);
    s += R(-120, -172, 240, 20, 3, INK) + [0, 1, 2, 3, 4].map((i) => knob(-92 + i * 46, -162, 7, SIL)).join('');
    s += R(-120, -144, 116, 120, 3, dark(c, 0.06)) + R(4, -144, 116, 120, 3, dark(c, 0.06)) + R(-110, -136, 96, 6, 3, SIL) + R(14, -136, 96, 6, 3, SIL);
    s += R(-108, -120, 92, 70, 3, on ? '#ff9e4a' : INK) + R(16, -120, 92, 70, 3, on ? '#ff9e4a' : INK) + (on ? glow(-62, -85, 40) + glow(62, -85, 40) : '') + R(-108, -120, 92, 70, 3, GLASS) + R(16, -120, 92, 70, 3, GLASS);
    s += R(-130, -280, 260, 70, 4, '#c9cfdd') + R(-130, -224, 260, 14, 2, SIL) + Ln(-90, -250, 90, -250, INK, 3);
    for (let i = 0; i < 6; i++) s += Ln(-80 + i * 32, -250, -80 + i * 32, -236, SIL, 2) + R(-86 + i * 32, -236, 12, 14, 3, ['#9aa3b5', '#c9cfdd'][i % 2]);
    return s + txt(0, -262, 11, INK, 'CHEF', 'letter-spacing="4"') + R(-126, -172, 4, 140, 2, '#fff', op(0.5));
  } }),
  retro: (st) => ({ name: 'Diner Flat-Top', w: 270, h: 300, toggle: true, spawn: GRILL_SPAWN, surfaces: [{ x1: -120, x2: 120, y: -188 }], art: (c, on) => {
    let s = R(-110, -20, 18, 20, 6, SIL) + R(92, -20, 18, 20, 6, SIL) + box(-130, -180, 260, 162, 18, c) + R(-130, -60, 260, 30, 0, st.accent) + R(-130, -64, 260, 5, 2, SIL);
    s += R(-136, -194, 272, 16, 6, '#3a3a46') + R(-136, -180, 272, 4, 2, SIL);
    s += [-80, -30].map((x) => E(x, -196, 22, 4.5, '#8a4a2a')).join('') + E(40, -196, 14, 3, '#fff8ee') + C(40, -197, 5, '#ffd84a') + E(84, -196, 22, 4, '#ffd84a');
    if (on) s += sizzle(-80, -202) + sizzle(-30, -204) + sizzle(84, -202) + [-100, -60, -20, 20, 60, 100].map((x) => flame(x, -176, 0.42)).join('');
    for (let i = 0; i < 5; i++) s += knob(-96 + i * 48, -160, 8, '#fff');
    s += R(-90, -140, 180, 72, 20, SIL) + R(-82, -132, 164, 56, 16, on ? '#ffb35e' : '#3a3346') + R(-82, -132, 164, 56, 16, GLASS);
    s += R(-136, -300, 272, 96, 0, '#fff3d6') + Array.from({ length: 34 }, (_, i) => R(-136 + (i % 17) * 16, -300 + Math.floor(i / 17) * 16, 16, 16, 0, (i + Math.floor(i / 17)) % 2 ? st.accent : '#fff3d6', op(0.7))).join('');
    s += Ln(-120, -250, 120, -250, SIL, 4) + [-90, -40, 10, 60].map((x, i) => `<g transform="rotate(${i % 2 ? 4 : -4} ${x} -250)">${R(x - 14, -250, 28, 36, 2, '#fff')}${Ln(x - 8, -240, x + 8, -240, '#c9cfdd', 2)}${Ln(x - 8, -232, x + 4, -232, '#c9cfdd', 2)}${Ln(x - 8, -224, x + 6, -224, '#e8384f', 2)}</g>`).join('');
    return s + motif('star', 100, -230, 12) + gloss(-122, -170, 7, 40);
  } }),
  woodland: (st) => ({ name: 'Campfire Brick Grill', w: 280, h: 340, toggle: true, spawn: ['burger', 'soup'], surfaces: [{ x1: -126, x2: 126, y: -170 }], art: (c, on) => {
    const brick = '#c96a4a';
    let s = R(40, -330, 50, 160, 4, brick) + (on ? steam(65, -336, 1.4) : '');
    s += box(-136, -166, 272, 166, 8, brick);
    for (let r = 0; r < 10; r++) for (let i = 0; i < 9; i++) s += R(-134 + i * 30 + (r % 2 ? 15 : 0), -164 + r * 16.4, 26, 13, 2, dark(brick, (r + i) % 3 === 0 ? 0.08 : 0.02), op(0.8));
    for (let r = 0; r < 9; r++) s += R(42 + (r % 2 ? 0 : 6), -328 + r * 17, 40, 13, 2, dark(brick, 0.06), op(0.8));
    s += P(archD(-80, -130, 160, 110, 50), '#2d2630');
    if (on) s += glow(0, -70, 70) + flame(-30, -36, 1.1) + flame(0, -36, 1.5) + flame(30, -36, 1);
    s += [-44, 0, 44].map((x, i) => `<g transform="rotate(${(i - 1) * 12} ${x} -30)">${R(x - 28, -36, 56, 12, 6, '#8a5a3c')}${C(x + 28, -30, 6, '#e8b46a')}</g>`).join('');
    s += R(-140, -178, 280, 12, 4, '#9aa3b5');
    for (let x = -126; x <= 126; x += 14) s += Ln(x, -176, x, -170, '#6a6a7e', 3);
    s += E(-60, -180, 26, 5, '#8a4a2a') + soupG(50, -178, 0.8, on) + leaf(-130, -166, 1.4, -160, '#e8573d') + leaf(120, -166, 1.3, -20, '#ffab5e');
    return s + R(-100, -240, 4, 60, 2, '#8a5a3c') + E(-98, -244, 14, 10, '#8a5a3c');
  } }),
});

const PIZZAOVENS = series('pizzaoven', 'Pizza Ovens', 'Pizza Oven', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweet Pizza Oven', w: 270, h: 310, toggle: true, spawn: ['pizza'], surfaces: [{ x1: 70, x2: 126, y: -120 }], art: (c, on) => {
    let s = box(-126, -120, 252, 112, 12, '#fff') + R(-126, -16, 252, 16, 4, dark(c, 0.15));
    for (let i = 0; i < 4; i++) s += C(-90 + i * 40, -34, 12, '#e8a64a') + C(-90 + i * 40, -34, 5, '#c98a5a');
    s += R(-114, -100, 168, 44, 6, light(c, 0.4)) + txt(-30, -72, 16, dark(c, 0.3), 'Pizza');
    const dome = 'M-118 -120 Q-118 -290 0 -290 Q118 -290 118 -120Z';
    s += P(dome, c) + P(dome, 'url(#g-shadeX)');
    for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) s += C(-90 + i * 30 + (r % 2) * 15, -140 - r * 30, 7, light(c, 0.3), op(0.7));
    s += P(archD(-56, -200, 112, 80, 50), '#4a3040');
    if (on) s += glow(0, -150, 70) + flame(-30, -124, 0.8) + flame(30, -124, 0.9) + E(0, -128, 36, 7, '#ffd36b') + C(-12, -130, 4, '#e8384f') + C(10, -128, 4, '#e8384f') + steam(0, -300, 1.2);
    s += P(archD(-62, -206, 124, 86, 54), 'none', stroked('#fff', 6)) + R(-20, -310, 40, 30, 4, dark(c, 0.15));
    return s + tr(100, -120, R(-4, -120, 8, 120, 3, WOOD) + E(0, -128, 22, 14, WOOD)) + P(heartD(0, -270, 18), '#fff');
  } }),
  cottage: (st) => ({ name: 'Brick Wood Oven', w: 280, h: 330, toggle: true, spawn: ['pizza'], art: (c, on) => {
    const brick = '#c96a4a';
    let s = box(-130, -130, 260, 130, 6, '#e8d8c0') + P('M-110 -10 V-110 H110 V-10Z', '#5a4038');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) s += C(-80 + i * 32 + r * 16, -26 - r * 26, 13, '#c98a5a') + C(-80 + i * 32 + r * 16, -26 - r * 26, 7, '#e8b46a');
    s += R(-136, -140, 272, 14, 4, '#e8d8c0');
    const dome = 'M-124 -140 Q-124 -300 0 -300 Q124 -300 124 -140Z';
    s += P(dome, brick) + P(dome, 'url(#g-shadeX)');
    for (let r = 0; r < 5; r++) for (let i = 0; i < 8; i++) s += R(-110 + i * 28 + (r % 2) * 14, -164 - r * 26, 22, 12, 2, dark(brick, 0.1), op(0.7));
    s += R(-14, -330, 28, 50, 3, dark(brick, 0.1)) + (on ? steam(0, -336, 1.3) : '');
    s += P(archD(-60, -230, 120, 90, 56), '#2d2630');
    if (on) s += glow(0, -170, 80) + flame(-34, -144, 1) + flame(0, -144, 1.3) + flame(32, -144, 0.9);
    s += P(archD(-68, -238, 136, 98, 62), 'none', stroked('#e8d8c0', 8));
    return s + cloth('M-40 -258 H40 V-240 H-40Z', c, 'check', 'y') + txt(0, -244, 11, '#fff', 'forno');
  } }),
});

const MENUBOARDS = series('menuboard', 'Menu Boards', 'Menu Board', 'restaurant', 'wall', {
  sweet: (st) => ({ name: 'Sweet Menu Board', w: 320, h: 220, art: (c) => {
    let s = box(-150, -100, 300, 200, 24, c) + R(-138, -64, 276, 152, 14, '#fff');
    s += P(heartD(0, -112, 40), '#fff', stroked(c, 4)) + txt(0, -76, 16, c, 'Menu');
    const row = (y: number, pic: string, name: string) => pic + txt(-14, y + 6, 15, dark(c, 0.35), name, 'text-anchor="start"') + [0, 1, 2].map((i) => P(heartD(96 + i * 14, y - 4, 10), c)).join('');
    s += row(-34, burgerG(-80, -20, 0.45), 'Burger') + row(10, spaghettiG(-80, 24, 0.45), 'Pasta') + row(54, milkshakeG(-80, 76, 0.4), 'Shake');
    return s + Ln(-130, -12, 130, -12, light(c, 0.4), 2) + Ln(-130, 32, 130, 32, light(c, 0.4), 2);
  } }),
  modern: (st) => ({ name: 'Digital Menu Screen', w: 340, h: 200, art: (c) => {
    let s = R(-166, -96, 332, 192, 8, INK) + R(-156, -86, 312, 172, 4, '#1e2030');
    const pics = [burgerG(0, 0, 0.8), friesG(0, 0, 0.8), sushiG(0, 0, 0.7)];
    for (let i = 0; i < 3; i++) {
      const x = -104 + i * 104;
      s += R(x - 46, -76, 92, 150, 6, '#2d3046') + tr(x, 12, pics[i]) + txt(x, 40, 13, '#fff', ['Burger', 'Fries', 'Sushi'][i]) + txt(x, 60, 12, '#7fe0ff', ['4.50', '2.00', '6.00'][i]);
      s += `<rect x="${x - 46}" y="-76" width="92" height="150" rx="6" fill="none" stroke="${st.accent}" stroke-width="3" opacity="0"><animate attributeName="opacity" values="0;1;1;0;0;0" dur="6s" begin="${i * 2}s" repeatCount="indefinite"/></rect>`;
    }
    return s + R(-156, -86, 312, 172, 4, GLASS, op(0.4));
  } }),
  retro: (st) => ({ name: 'Diner Letter Board', w: 320, h: 230, art: (c) => {
    let s = box(-150, -110, 300, 220, 14, c) + R(-136, -70, 272, 166, 6, '#fff') + R(-136, -70, 272, 166, 6, 'url(#g-shadeY)', op(0.25));
    s += R(-110, -124, 220, 46, 23, st.trim, stroked('#fff', 4)) + txt(0, -92, 22, c, 'EATS', 'letter-spacing="4"');
    for (let i = 0; i < 4; i++) s += Ln(-130, -46 + i * 38, 130, -46 + i * 38, '#e3e6ee', 1.5);
    const lines = ['BURGERS', 'HOT DOGS', 'PANCAKES', 'SHAKES'];
    lines.forEach((l, i) => { s += txt(-120, -26 + i * 38, 15, INK, l, 'text-anchor="start" letter-spacing="1.5"') + txt(118, -26 + i * 38, 15, '#e8384f', `${i + 2}.99`, 'text-anchor="end"'); });
    return s + motif('star', -136, -110, 14) + motif('star', 136, -110, 14);
  } }),
  cottage: (st) => ({ name: 'Chalkboard Menu', w: 300, h: 230, art: (c) => {
    let s = R(-146, -110, 292, 220, 8, st.wood) + R(-132, -96, 264, 192, 4, '#3a4a40') + grain(-146, -110, 292, 12, WOOD_D);
    s += txt(0, -62, 26, '#fff', 'Today', 'font-style="italic"') + S('M-60 -52 Q0 -44 60 -52', c, 2.5);
    s += txt(-110, -20, 16, '#fff', '· soup', 'text-anchor="start" opacity="0.9"') + txt(-110, 10, 16, '#fff', '· pancakes', 'text-anchor="start" opacity="0.9"') + txt(-110, 40, 16, '#fff', '· pie', 'text-anchor="start" opacity="0.9"');
    s += tr(80, -4, S('M-26 -8 H26 Q24 18 0 18 Q-24 18 -26 -8Z', '#fff', 2.5) + S('M-10 -16 q4 -8 0 -14 M4 -16 q4 -8 0 -14', '#fff', 2)) + flowerG(90, 60, 10, c) + flowerG(110, 66, 8, '#ffd36b');
    return s + R(-60, 82, 40, 8, 3, '#fff', op(0.9)) + R(-10, 84, 24, 6, 3, '#ffd36b', op(0.9));
  } }),
});

const HOSTSTANDS = series('hoststand', 'Host Stands', 'Host Stand', 'restaurant', 'floor', {
  sweet: (st) => ({ w: 150, h: 220, sfx: 'ding', surfaces: [{ x1: -58, x2: 58, y: -172 }], art: (c) => {
    let s = P('M-50 0 L-58 -164 H58 L50 0Z', c) + P('M-50 0 L-58 -164 H58 L50 0Z', 'url(#g-shadeX)') + R(-54, -16, 108, 16, 6, dark(c, 0.15));
    s += P(heartD(0, -128, 50), '#fff', op(0.9)) + txt(0, -96, 12, c, 'Welcome');
    s += `<g transform="rotate(-10 0 -172)">${R(-64, -178, 128, 10, 4, '#fff')}${R(-50, -192, 50, 14, 2, '#ff7eb6')}${R(-48, -190, 46, 10, 1, '#fff3f8')}</g>`;
    return s + R(46, -146, 30, 8, 3, '#fff') + E(61, -150, 12, 8, GOLD) + C(61, -159, 3, GOLD) + gloss(-50, -156, 6, 100);
  } }),
  modern: (st) => ({ w: 140, h: 220, sfx: 'ding', surfaces: [{ x1: -50, x2: 50, y: -164 }], art: (c) => {
    let s = R(-50, -160, 100, 160, 2, c) + R(-50, -160, 100, 160, 2, 'url(#g-shadeX)') + planksV(-50, -160, 100, 160, 6, dark(c, 0.1)) + R(-54, -168, 108, 8, 1, INK) + R(-46, -6, 92, 6, 0, INK);
    s += `<g transform="rotate(-14 0 -170)">${R(-26, -196, 52, 30, 4, INK)}${R(-22, -192, 44, 22, 2, '#7fe0ff')}${Ln(-16, -186, 10, -186, '#fff', 2)}${Ln(-16, -178, 4, -178, '#fff', 2)}</g>`;
    return s + R(-30, -110, 60, 22, 3, INK) + txt(0, -94, 11, '#fff', 'Hello');
  } }),
  princess: (st) => ({ name: 'Royal Host Stand', w: 160, h: 250, sfx: 'ding', surfaces: [{ x1: -60, x2: 60, y: -176 }], art: (c) => {
    let s = E(0, -6, 50, 8, GOLD) + P('M-26 -8 Q-40 -60 -20 -100 L-40 -170 H40 L20 -100 Q40 -60 26 -8Z', '#fff') + P('M-26 -8 Q-40 -60 -20 -100 L-40 -170 H40 L20 -100 Q40 -60 26 -8Z', 'url(#g-shadeX)');
    s += cloth('M-62 -176 H62 L56 -132 Q40 -120 30 -140 Q0 -112 -30 -140 Q-40 -120 -56 -132Z', c, 'hearts', 'y') + R(-66, -182, 132, 10, 5, GOLD);
    s += bowG(0, -138, 0.6, '#ff7eb6') + motif('crown', 0, -60, 14) + C(-50, -128, 5, GOLD) + C(50, -128, 5, GOLD);
    return s + R(-24, -196, 48, 14, 2, '#c99bff') + R(-22, -194, 44, 9, 1, '#fff');
  } }),
});

const DESSERT_SPAWN = ['cake', 'cupcake', 'sundae', 'donut'];
/** Shelves inside a dessert tower; the shelves turn gently when it is switched on. */
const turnShelf = (y: number, w: number, inner: string, on: boolean, i: number) =>
  `<g>${inner}${on ? `<animateTransform attributeName="transform" type="translate" values="-8 0;8 0;-8 0" dur="${(3 + i * 0.5).toFixed(1)}s" repeatCount="indefinite" ${SPL}/>` : ''}</g>` + E(0, y, w / 2, 5, '#e3ecf6') + E(0, y - 1, w / 2 - 2, 3, '#fff');
const DESSERTCASES = series('dessertcase', 'Dessert Cases', 'Dessert Case', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweet Dessert Tower', w: 210, h: 340, toggle: true, spawn: DESSERT_SPAWN, art: (c, on) => {
    let s = box(-90, -80, 180, 74, 14, c) + R(-84, -6, 168, 6, 3, dark(c, 0.2));
    for (let x = -72; x <= 72; x += 24) s += C(x, -44, 9, light(c, 0.35));
    s += R(-86, -300, 172, 220, 30, '#fff8fb') + (on ? glow(0, -200, 100) : '');
    s += turnShelf(-226, 150, cakeG(-34, -228, 0.8, '#ffd9e8') + cakeG(30, -228, 0.8, '#c99bff', '#fff3f8'), on, 0);
    s += turnShelf(-160, 150, pieG(-36, -162, 0.9) + cupcakeG(12, -162, 0.9, '#7cc8ff') + cupcakeG(46, -162, 0.9, '#ffd36b'), on, 1);
    s += turnShelf(-94, 150, donutG(-44, -96, 1, CANDY[0]) + donutG(-6, -96, 1, CANDY[2]) + donutG(34, -96, 1, CANDY[1]), on, 2);
    s += R(-4, -300, 8, 210, 3, GOLD, op(0.6)) + P(rrD(-86, -300, 172, 220, 30, 4), GLASS) + P(rrD(-86, -300, 172, 220, 30, 4), 'none', stroked(GOLD, 5));
    s += P('M-96 -296 Q-96 -330 -60 -330 H60 Q96 -330 96 -296Z', c) + P(heartD(0, -336, 26), '#fff', stroked(c, 3));
    return s + txt(0, -30, 13, '#fff', 'Desserts') + gloss(-78, -286, 8, 150);
  } }),
  candy: (st) => ({ name: 'Gumball Dessert Globe', w: 220, h: 340, toggle: true, spawn: DESSERT_SPAWN, art: (c, on) => {
    let s = P('M-60 0 L-46 -120 H46 L60 0Z', c) + R(-66, -10, 132, 10, 5, dark(c, 0.2)) + C(0, -76, 22, '#fff') + C(0, -76, 14, SIL) + R(-3, -88, 6, 24, 2, '#9aa3b5') + R(-22, -40, 44, 18, 4, '#3a3346') + R(-16, -36, 32, 8, 2, on ? '#ffd36b' : '#5a5a6e');
    s += R(-56, -132, 112, 18, 6, '#fff') + C(0, -224, 100, '#fff8fb', op(0.9)) + (on ? glow(0, -220, 100) : '');
    s += turnShelf(-180, 160, cupcakeG(-46, -182, 1, '#ff9ec7') + cakeG(0, -182, 0.8, '#a8e6cf') + cupcakeG(46, -182, 1, '#c99bff'), on, 0);
    s += turnShelf(-250, 130, sundaeG(-26, -252, 0.65) + donutG(26, -254, 1.1, CANDY[1]), on, 1);
    s += C(0, -224, 100, GLASS) + C(0, -224, 100, 'none', stroked('#fff', 5)) + R(-18, -336, 36, 18, 6, c) + C(0, -342, 10, '#e8384f');
    return s + sprinkles(-40, -110, 80, 70, 10, 3);
  } }),
  retro: (st) => ({ name: 'Chrome Pie Carousel', w: 230, h: 330, toggle: true, spawn: ['cake', 'donut', 'cookie'], art: (c, on) => {
    let s = R(-100, -86, 200, 80, 12, c) + R(-100, -60, 200, 6, 0, SIL) + R(-92, -6, 184, 6, 3, SIL) + txt(0, -24, 16, '#fff', 'Pies', 'font-style="italic"');
    s += R(-96, -300, 192, 214, 8, '#f6fbff') + (on ? glow(0, -200, 100) : '');
    s += turnShelf(-226, 170, pieG(-44, -228, 1, '#e8384f') + pieG(40, -228, 1, '#9b6bff'), on, 0);
    s += turnShelf(-150, 170, cakeG(-40, -152, 0.85, '#fff3d6', '#8a5a3c') + pieG(40, -152, 1, '#ffd84a'), on, 1);
    s += R(-96, -300, 192, 214, 8, GLASS) + R(-102, -306, 204, 12, 6, SIL) + R(-102, -92, 204, 10, 5, SIL) + Ln(-96, -300, -96, -86, SIL, 6) + Ln(96, -300, 96, -86, SIL, 6);
    return s + R(-60, -330, 120, 26, 13, st.accent) + txt(0, -312, 13, '#fff', 'fresh!') + (on ? blinkC(-74, -317, 5, st.trim, 0.8) + blinkC(74, -317, 5, st.trim, 0.8, 0.4) : C(-74, -317, 5, st.trim) + C(74, -317, 5, st.trim));
  } }),
});

const BOOSTERS = series('boosterchair', 'Restaurant High Chairs', 'High Chair', 'restaurant', 'floor', {
  sweet: (st) => ({ name: 'Sweet Café High Chair', w: 130, h: 250, seats: [sit(0, -130)], art: (c) => `<g transform="rotate(8 -40 -60)">${R(-44, -130, 9, 130, 4, '#fff')}</g><g transform="rotate(-8 40 -60)">${R(35, -130, 9, 130, 4, '#fff')}</g>` + Ln(-42, -40, 42, -40, '#fff', 4) + box(-44, -230, 88, 100, 30, c) + C(0, -196, 18, '#fff') + P(heartD(0, -204, 18), c) + box(-46, -142, 92, 16, 8, dark(c, 0.06), 'none', 'y'),
    front: (c) => box(-60, -168, 120, 14, 7, '#fff', 'none', 'y') + R(-48, -156, 10, 30, 4, c) + R(38, -156, 10, 30, 4, c) + plateE(20, -168, 14) }),
  retro: (st) => ({ name: 'Diner High Chair', w: 130, h: 240, seats: [sit(0, -130)], art: (c) => `<g transform="rotate(8 -40 -60)">${R(-44, -130, 9, 130, 4, SIL)}</g><g transform="rotate(-8 40 -60)">${R(35, -130, 9, 130, 4, SIL)}</g>` + Ln(-42, -40, 42, -40, '#c9cfdd', 4) + box(-44, -224, 88, 94, 16, c) + R(-36, -214, 72, 76, 10, light(c, 0.15)) + R(-46, -142, 92, 16, 8, c),
    front: (c) => R(-62, -168, 124, 12, 5, SIL) + R(-48, -156, 9, 28, 4, SIL) + R(39, -156, 9, 28, 4, SIL) + R(-16, -186, 16, 18, 4, '#fff') + R(-13, -182, 10, 10, 2, '#ffb3c7') }),
});

const SHAKEBARS = series('shakebar', 'Milkshake Bars', 'Milkshake Bar', 'restaurant', 'floor', {
  retro: (st) => ({ name: 'Retro Shake Bar', w: 320, h: 330, toggle: true, spawn: ['milkshake', 'sundae'], surfaces: [{ x1: -150, x2: -20, y: -184 }], art: (c, on) => {
    let s = box(-150, -180, 300, 172, 14, c) + R(-150, -110, 300, 40, 0, '#fff') + R(-150, -114, 300, 4, 0, SIL) + R(-150, -70, 300, 4, 0, SIL) + R(-140, -8, 280, 8, 4, SIL);
    for (let x = -140; x < 150; x += 20) s += R(x, -110, 10, 40, 0, st.accent, op(0.5));
    s += R(-156, -192, 312, 14, 6, SIL);
    for (const [x, col, i] of [[20, '#ffb3c7', 0], [70, '#8a5a3c', 1], [120, '#fff3d8', 2]] as [number, string, number][]) {
      s += R(x - 6, -280, 12, 90, 4, SIL) + R(x - 18, -292, 36, 22, 8, st.accent) + R(x - 2, -270, 4, 40, 1, '#9aa3b5');
      const cup = P(`M${x - 13} -230 H${x + 13} L${x + 10} -192 H${x - 10}Z`, SIL) + E(x, -230, 13, 3, col);
      s += on ? `<g>${cup}<animateTransform attributeName="transform" type="translate" values="-1.5 0;1.5 0;-1.5 0" dur="0.15s" begin="${i * 0.05}s" repeatCount="indefinite"/></g>` : cup;
    }
    s += R(-130, -320, 160, 50, 25, INK) + `<g>${on ? '<animate attributeName="opacity" values="1;0.7;1;1;0.85;1" dur="2s" repeatCount="indefinite"/>' : ''}${txt(-50, -287, 26, on ? '#ff7eb6' : '#8a6a8e', 'Shakes', `font-style="italic"${on ? ' style="filter:drop-shadow(0 0 5px #ff7eb6)"' : ''}`)}</g>`;
    return s + gloss(-144, -170, 50, 6);
  } }),
  sweet: (st) => ({ name: 'Sweet Shake Fountain', w: 300, h: 320, toggle: true, spawn: ['milkshake', 'sundae'], surfaces: [{ x1: -140, x2: 140, y: -184 }], art: (c, on) => {
    let s = box(-140, -180, 280, 172, 22, c) + R(-140, -8, 280, 8, 4, dark(c, 0.2)) + box(-146, -192, 292, 14, 7, '#fff', 'none', 'y');
    for (let x = -120; x <= 120; x += 30) s += milkshakeG(x, -40, 0.5, CANDY[Math.abs(x / 30) % 5]);
    s += R(-120, -320, 240, 110, 20, '#fff') + R(-120, -320, 240, 110, 20, 'url(#g-shadeX)');
    for (const [x, col] of [[-70, '#ffb3c7'], [0, '#8a5a3c'], [70, '#fff3d8']] as [number, string][]) {
      s += R(x - 26, -310, 52, 70, 12, '#e6f4ff', op(0.9)) + R(x - 22, on ? -280 : -290, 44, on ? 36 : 46, 8, col) + R(x - 26, -310, 52, 70, 12, GLASS) + R(x - 6, -240, 12, 22, 3, SIL) + R(x - 10, -246, 20, 8, 3, c);
      if (on) s += R(x - 3, -218, 6, 28, 3, col, op(0.95)) + E(x, -190, 10, 3, col);
    }
    return s + P(heartD(0, -344, 28), c) + txt(0, -88, 18, '#fff', 'Milkshakes');
  } }),
});

const TABLESETTINGS = series('tablesetting', 'Table Settings', 'Table Setting', 'restaurant', 'prop', {
  sweet: (st) => ({ w: 120, h: 50, art: (c) => R(-58, -6, 18, 6, 2, c) + P('M-56 -8 L-44 -8 L-46 -40 L-54 -40Z', c) + plateE(0, -2, 34) + P(heartD(0, -10, 12), light(c, 0.3)) + Ln(44, -4, 44, -34, GOLD, 3) + E(44, -36, 4, 6, GOLD) + Ln(54, -4, 54, -36, GOLD, 3) }),
  princess: (st) => ({ name: 'Royal Place Setting', w: 130, h: 70, art: (c) => plateE(0, -2, 40, '#fff') + plateE(0, -6, 26, light(c, 0.4)) + motif('crown', 0, -12, 7) + Ln(-50, -4, -50, -36, GOLD, 3) + S('M-54 -36 V-28 M-50 -36 V-28 M-46 -36 V-28', GOLD, 2) + Ln(50, -4, 50, -36, GOLD, 3) + E(50, -36, 4, 7, GOLD) + P('M-14 -66 H14 Q14 -46 0 -44 Q-14 -46 -14 -66Z', '#e6f4ff', op(0.8)) + R(-1.5, -44, 3, 10, 1, '#e6f4ff') }),
  modern: (st) => ({ name: 'Modern Place Setting', w: 120, h: 40, art: (c) => R(-60, -6, 120, 6, 1, c) + plateE(0, -6, 30, '#fff') + E(0, -12, 18, 5, '#2d2a3a') + Ln(-44, -8, -40, -32, INK, 3) + Ln(44, -8, 40, -32, INK, 3) + R(30, -26, 8, 18, 3, '#e6f4ff', op(0.8)) }),
});

// =====================================================================
// MALL
// =====================================================================
// ---- little shop-window things ----
const teddyG = (x: number, y: number, s: number, col = '#c98a5a') => tr(x, y, C(-14, -52, 8, col) + C(14, -52, 8, col) + C(0, -42, 15, col) + E(0, -14, 18, 16, col) + E(0, -36, 7, 5, light(col, 0.4)) + C(-5, -44, 2, INK) + C(5, -44, 2, INK) + C(0, -38, 2, INK) + C(-16, -8, 6, light(col, 0.3)) + C(16, -8, 6, light(col, 0.3)) + bowG(0, -28, 0.35, '#ff7eb6'), s);
const blocksG = (x: number, y: number, s: number) => tr(x, y, box(-28, -24, 24, 24, 3, '#7cc8ff') + box(4, -24, 24, 24, 3, '#ff7eb6') + box(-12, -48, 24, 24, 3, '#ffd36b') + txt(-16, -6, 14, '#fff', 'A') + txt(16, -6, 14, '#fff', 'B') + txt(0, -30, 14, '#fff', 'C'), s);
const rocketToy = (x: number, y: number, s: number) => tr(x, y, P('M-12 0 L-24 8 L-12 -20Z', '#ff6b8a') + P('M12 0 L24 8 L12 -20Z', '#ff6b8a') + P('M-12 0 V-40 Q0 -64 12 -40 V0Z', '#fff') + C(0, -32, 6, '#7cc8ff') + flame(0, 12, 0.5), s);
const ballG = (x: number, y: number, r: number, c1: string, c2: string) => C(x, y - r, r, c1) + P(`M${f(x - r)} ${f(y - r)} Q${f(x)} ${f(y - r * 1.6)} ${f(x + r)} ${f(y - r)} Q${f(x)} ${f(y - r * 0.4)} ${f(x - r)} ${f(y - r)}Z`, c2) + C(x - r * 0.4, y - r * 1.4, r * 0.2, '#fff', op(0.6));
const sneakerG = (x: number, y: number, s: number, col: string) => tr(x, y, P('M-22 0 V-16 Q-22 -24 -12 -24 L0 -14 Q14 -12 22 -6 V0Z', col) + R(-24, -4, 48, 5, 2, '#fff') + S('M-10 -18 l6 4 M-6 -22 l6 4', '#fff', 2) + C(-15, -14, 2, '#fff'), s);
const heelG = (x: number, y: number, s: number, col: string) => tr(x, y, P('M-20 -16 Q-12 -24 -2 -14 L16 -6 Q22 -4 22 0 H4 L-14 -10 L-16 0 H-20Z', col) + Ln(-18, -14, -18, 0, col, 3) + C(10, -10, 3, '#ffd36b'), s);
const bootG = (x: number, y: number, s: number, col: string) => tr(x, y, P('M-12 -40 H6 V-12 Q20 -10 22 0 H-14Z', col) + R(-14, -44, 22, 6, 3, '#fff8ee') + R(-14, -4, 36, 4, 2, dark(col, 0.25)), s);
const puppyG = (x: number, y: number, s: number, col = '#f4dca0') => tr(x, y, E(0, -16, 22, 16, col) + C(0, -40, 15, col) + E(-14, -38, 6, 12, dark(col, 0.25)) + E(14, -38, 6, 12, dark(col, 0.25)) + C(-5, -42, 2.2, INK) + C(5, -42, 2.2, INK) + E(0, -35, 4, 3, INK) + P('M-3 -31 Q0 -27 3 -31', 'none', stroked('#ff7eb6', 2)) + E(-10, -2, 6, 4, col) + E(10, -2, 6, 4, col) + S('M22 -20 q10 -6 6 -16', col, 5), s);
const kittyG = (x: number, y: number, s: number, col = '#ffab5e') => tr(x, y, E(0, -14, 20, 14, col) + C(0, -36, 14, col) + P('M-12 -44 L-10 -58 L-2 -48Z M12 -44 L10 -58 L2 -48Z', col) + C(-5, -37, 2, INK) + C(5, -37, 2, INK) + P('M-2 -32 L2 -32 L0 -30Z', '#ff7eb6') + S('M-14 -32 h-8 M14 -32 h8', INK, 1) + S('M20 -10 q14 -4 10 -20', col, 5), s);
const fishbowlG = (x: number, y: number, s: number) => tr(x, y, C(0, -28, 26, '#bfe8ff', op(0.7)) + P('M-24 -22 Q0 -12 24 -22 Q22 0 0 2 Q-22 0 -24 -22Z', '#7cc8ff', op(0.6)) + E(4, -22, 8, 5, '#ffab3d') + P('M12 -22 L18 -27 L18 -17Z', '#ffab3d') + C(1, -23, 1.2, INK) + C(-8, -44, 3, '#fff', op(0.8)) + E(0, -54, 14, 3, '#e3ecf6'), s);
const lollyG = (x: number, y: number, r: number, col: string) => Ln(x, y, x, y - r * 2.6, '#fff', r * 0.25) + C(x, y - r * 2.6 - r, r, col) + S(`M${f(x - r * 0.5)} ${f(y - r * 3.6)} A${f(r * 0.5)} ${f(r * 0.5)} 0 1 1 ${f(x)} ${f(y - r * 3.1)}`, '#fff', r * 0.25) + C(x - r * 0.35, y - r * 4, r * 0.2, '#fff', op(0.7));
const bookG = (x: number, y: number, w: number, h: number, col: string) => R(x, y - h, w, h, 2, col) + R(x + 2, y - h + 6, w - 4, 3, 1, '#fff', op(0.7)) + R(x + 2, y - 10, w - 4, 3, 1, '#fff', op(0.5));
const booksRow = (x1: number, x2: number, y: number, seed = 0) => { let s = '', x = x1, i = 0; while (x < x2 - 10) { const w = 10 + Math.round(rnd(i + seed) * 6), h = 34 + Math.round(rnd(i + seed + 9) * 16); s += bookG(x, y, w, h, PACK[(i + seed) % PACK.length]); x += w + 1; i++; } return s; };
const openBookG = (x: number, y: number, s: number, col: string) => tr(x, y, P('M0 -6 Q-18 -16 -36 -10 V20 Q-18 14 0 24Z', '#fff') + P('M0 -6 Q18 -16 36 -10 V20 Q18 14 0 24Z', '#fff8ee') + S('M-30 0 q12 -4 24 0 M-30 8 q12 -4 24 0 M6 0 q12 -4 24 0 M6 8 q12 -4 24 0', '#c9cfdd', 1.6) + P('M-38 -8 V24 Q-18 18 0 28 Q18 18 38 24 V-8', 'none', stroked(col, 3)), s);
const glassesG = (x: number, y: number, s: number, col: string, heart = false) => tr(x, y, (heart ? P(heartD(-11, -8, 16), col) + P(heartD(11, -8, 16), col) : C(-11, 0, 8, col) + C(11, 0, 8, col)) + Ln(-3, -1, 3, -1, col, 2) + Ln(-19, -2, -24, -6, col, 2) + Ln(19, -2, 24, -6, col, 2) + C(-13, -2, 2.5, '#fff', op(0.6)) + C(9, -2, 2.5, '#fff', op(0.6)), s);
const phoneCaseG = (x: number, y: number, col: string, i: number) => R(x - 9, y - 16, 18, 32, 4, col) + C(x - 4, y - 10, 2.5, INK, op(0.7)) + (i % 3 === 0 ? P(heartD(x, y - 2, 7), '#fff') : i % 3 === 1 ? P(starD(x, y + 2, 5), '#fff') : C(x, y + 2, 3.5, '#fff'));
const flowerRow = (x: number, y: number, w: number) => R(x, y, w, 14, 5, '#a86b4a') + Array.from({ length: 6 }, (_, i) => flowerG(x + (w * (i + 0.5)) / 6, y - 2, 8, ['#ff7eb6', '#ffd36b', '#ffffff', '#c99bff'][i % 4]) + leaf(x + (w * (i + 0.5)) / 6, y + 2, 0.7, -40)).join('');
const bowSmall = (x: number, y: number, col: string) => bowG(x, y, 0.45, col);

interface FrontOpts { wall: string; trim: string; sign: string; signText: string; textCol: string; shape: 'rect' | 'arch' | 'scallop' | 'roof' | 'marquee' | 'frost' | 'flat'; awn?: [string, string]; display: () => string; door?: string; deco?: () => string }
/** A shop front for the mall wall: a sign, a big display window and a glass door. Centred on (0, 0). */
function storefront(o: FrontOpts): string {
  let s = box(-212, -150, 424, 340, 8, o.wall) + R(-212, 150, 424, 40, 0, dark(o.wall, 0.12));
  // sign
  if (o.shape === 'arch') s += P(archD(-200, -200, 400, 90, 60), o.sign) + P(archD(-186, -190, 372, 74, 52), 'none', stroked(o.trim, 4));
  else if (o.shape === 'scallop') { let d = 'M-200 -196 H200 V-130'; for (let i = 0; i < 10; i++) d += ` Q${f(200 - 40 * (i + 0.5))} -108 ${f(200 - 40 * (i + 1))} -130`; s += P(d + 'Z', o.sign) + R(-200, -196, 400, 8, 4, o.trim); }
  else if (o.shape === 'roof') { s += P('M-224 -136 L0 -200 L224 -136Z', o.sign) + Array.from({ length: 3 }, (_, r) => { let d = `M${-190 + r * 44} ${-146 - r * 14}`; for (let i = 0; i < 8 - r * 2; i++) d += ' q11 10 22 0'; return P(d, 'none', `${stroked(light(o.sign, 0.25), 3)} ${op(0.7)}`); }).join('') + R(-130, -150, 260, 40, 8, o.trim); }
  else if (o.shape === 'marquee') { s += R(-200, -196, 400, 70, 10, o.sign) + R(-190, -186, 380, 50, 6, 'none', stroked(o.trim, 3)); for (let i = 0; i < 18; i++) s += blinkC(-190 + i * 22.3, -192, 4, '#fff6c8', 1.2, (i % 3) * 0.4) + blinkC(-190 + i * 22.3, -130, 4, '#fff6c8', 1.2, ((i + 1) % 3) * 0.4); }
  else if (o.shape === 'frost') s += P('M-210 -190 Q-210 -210 -180 -206 Q-120 -230 -60 -208 Q0 -232 60 -208 Q120 -230 180 -206 Q210 -210 210 -190 V-130 H-210Z', o.sign) + cloth(dripD(-210, -150, 420, 6, 26, 12, 2), o.sign, 'none', 'y') + sprinkles(-190, -206, 380, 40, 26, 4);
  else if (o.shape === 'flat') s += R(-212, -196, 424, 56, 0, o.sign) + R(-212, -144, 424, 4, 0, o.trim);
  else s += R(-200, -196, 400, 66, 14, o.sign) + R(-192, -188, 384, 50, 9, 'none', stroked(o.trim, 3));
  const ty = o.shape === 'roof' ? -122 : -152;
  s += txt(0, ty, o.shape === 'roof' ? 26 : 32, o.textCol, o.signText, o.shape === 'flat' ? 'letter-spacing="6"' : '');
  if (o.awn) s += awning(-200, -122, 250, 22, 8, o.awn[0], o.awn[1], 8);
  // window
  s += R(-198, -84, 238, 234, 10, o.trim) + R(-188, -74, 218, 214, 6, '#f4fbff') + o.display() + R(-188, -74, 218, 214, 6, GLASS) + R(-200, 140, 242, 14, 6, dark(o.trim, 0.1));
  s += S('M-186 -70 Q-131 -40 -76 -70 Q-21 -40 30 -70', '#fff', 1.6) + [-170, -150, -131, -112, -92, -60, -40, -21, -2, 16].map((x, i) => { const y = -70 + Math.abs(Math.sin(((x + 186) / 108) * Math.PI)) * 15; return P(`M${f(x - 6)} ${f(y - 2)} L${f(x + 6)} ${f(y - 2)} L${f(x)} ${f(y + 12)}Z`, PACK[i % PACK.length]); }).join('');
  // door
  const dc = o.door ?? o.trim;
  s += R(66, -84, 128, 274, 12, dc) + R(78, -72, 104, 262, 6, '#dff2ff') + R(78, -72, 104, 262, 6, GLASS) + R(160, 30, 8, 50, 4, GOLD) + R(92, -40, 64, 26, 6, '#fff', stroked(dc, 2)) + txt(124, -22, 14, dark(dc, 0.3), 'OPEN');
  return s + (o.deco ? o.deco() : '');
}
const sf = (name: string, o: FrontOpts): Spec => ({ name, w: 440, h: 400, art: () => storefront(o) });
const STOREFRONTS = [
  ...series('storefront-toys', 'Storefronts', 'Toy Store', 'mall', 'wall', {
    sweet: (st) => sf('Sweet Toy Store', { wall: '#ffe3ef', trim: '#fff', sign: st.main, signText: 'Toys', textCol: '#fff', shape: 'rect', awn: [st.main, '#fff'],
      display: () => R(-180, 100, 200, 40, 6, light(st.main, 0.4)) + teddyG(-140, 100, 1.2) + blocksG(-70, 100, 1) + rocketToy(-10, 92, 1.2) + ballG(-90, 40, 18, '#7cc8ff', '#ffd36b') + R(-180, 40, 120, 6, 3, light(st.main, 0.3)) + teddyG(-150, 40, 0.7, '#fff3d8'),
      deco: () => motif('star', -180, -192, 14) + motif('star', 180, -192, 14) }),
    rainbow: (st) => sf('Rainbow Toy Shop', { wall: '#fff8dc', trim: '#c99bff', sign: '#fff', signText: 'Toy Box', textCol: '#ff7eb6', shape: 'arch',
      display: () => RAIN.map((col, i) => E(-130, 128 - i * 12, 34 - i * 4, 7, col)).join('') + R(-133, 40, 6, 90, 3, '#fff') + P('M-70 20 L-30 -20 L10 20 L-30 60Z', '#ff7eb6') + P('M-30 -20 L-30 60 M-70 20 L10 20', 'none', stroked('#fff', 2)) + S('M-30 60 Q-20 90 -40 110 Q-50 120 -30 130', '#c99bff', 2) + bowSmall(-34, 88, '#ffd36b') + box(-80, 110, 60, 28, 6, '#7cc8ff') + C(-66, 138, 7, INK) + C(-34, 138, 7, INK) + R(-70, 96, 20, 16, 3, '#ffd36b'),
      deco: () => motif('rainbow', -170, -110, 22) + motif('rainbow', 170, -110, 22), door: '#ff7eb6' }),
  }),
  ...series('storefront-shoes', 'Storefronts', 'Shoe Store', 'mall', 'wall', {
    sweet: (st) => sf('Sweet Shoe Store', { wall: '#fff0f6', trim: '#fff', sign: '#fff', signText: 'Shoes', textCol: st.main, shape: 'scallop', awn: ['#fff', st.main],
      display: () => [-150, -80, -10].map((x, i) => R(x - 26, 96, 52, 44, 6, ['#ffd9e8', '#fff', '#ffd9e8'][i]) + E(x, 96, 26, 5, '#fff')).join('') + heelG(-150, 96, 1.4, st.main) + sneakerG(-80, 96, 1.5, '#7cc8ff') + bootG(-10, 96, 1.3, '#c98a5a') + R(-180, 20, 200, 6, 3, '#fff') + sneakerG(-130, 20, 1, '#ffd36b') + heelG(-40, 20, 1, '#c99bff'),
      deco: () => P(heartD(-190, -200, 22), st.main) + P(heartD(190, -200, 22), st.main) }),
    modern: (st) => sf('Modern Sneaker Shop', { wall: '#e6e8f0', trim: INK, sign: INK, signText: 'KICKS', textCol: '#fff', shape: 'flat', door: INK,
      display: () => [-40, 20, 80].map((y, r) => R(-180, y, 200, 5, 1, '#fff') + [-150, -90, -30].map((x, i) => sneakerG(x, y, 1.1, PACK[(r * 3 + i) % PACK.length])).join('')).join('') + R(-188, 120, 218, 20, 0, '#c9cfdd') }),
  }),
  ...series('storefront-pets', 'Storefronts', 'Pet Shop', 'mall', 'wall', {
    sweet: (st) => sf('Sweet Pet Shop', { wall: '#e6f7ff', trim: '#fff', sign: '#7cc8ff', signText: 'Pets', textCol: '#fff', shape: 'rect', awn: ['#7cc8ff', '#fff'],
      display: () => E(-130, 132, 46, 12, st.main) + puppyG(-130, 128, 1.3) + fishbowlG(-40, 136, 1) + R(-180, 50, 210, 6, 3, '#fff') + kittyG(-60, 50, 0.9) + motif('paw', -150, 20, 14) + C(-100, 34, 6, '#ff4f6d'),
      deco: () => motif('paw', -180, -192, 12) + motif('paw', 180, -192, 12) }),
    cottage: (st) => sf('Cottage Pet Barn', { wall: '#f4ead9', trim: st.wood, sign: '#e8907a', signText: 'Pet Barn', textCol: '#fff', shape: 'roof', door: st.wood,
      display: () => P('M-170 136 Q-170 100 -120 100 Q-70 100 -70 136Z', '#e8c08a') + kittyG(-120, 120, 1.1, '#9aa3b5') + R(-60, 30, 6, 106, 3, st.wood) + P('M-60 -40 Q-20 -60 20 -40 V40 H-60Z', 'none', stroked('#c9a27e', 3)) + Array.from({ length: 5 }, (_, i) => Ln(-50 + i * 16, -44, -50 + i * 16, 40, '#c9a27e', 1.5)).join('') + E(-20, 10, 10, 8, '#ffd84a') + C(-14, 4, 5, '#ffd84a') + P('M-9 4 L-4 6 L-9 8Z', '#ff8a3d') + Ln(-50, 30, 10, 30, '#c9a27e', 2) + R(-180, 136, 200, 4, 2, st.wood),
      deco: () => flowerRow(-198, 154, 238) }),
  }),
  ...series('storefront-candy', 'Storefronts', 'Candy Store', 'mall', 'wall', {
    sweet: (st) => sf('Sweet Candy Shop', { wall: '#fff3f8', trim: '#fff', sign: '#ff4f8b', signText: 'Candy', textCol: '#fff', shape: 'rect', awn: ['#ff4f8b', '#fff'],
      display: () => lollyG(-150, 140, 18, '#ff4f8b') + lollyG(-104, 140, 14, '#7cc8ff') + lollyG(-60, 140, 20, '#ffd36b') + jarG(-10, 140, 36, 50, '#c99bff', '#ff4f8b') + jarG(-10, 70, 30, 40, '#5fd3b5', '#fff') + R(-180, 6, 120, 6, 3, '#fff') + [-170, -150, -130, -110, -90].map((x, i) => C(x, -4, 8, CANDY[i])).join(''),
      deco: () => C(-196, -196, 12, '#ff4f8b') + C(196, -196, 12, '#7cc8ff') }),
    candy: (st) => sf('Gingerbread Sweet Shop', { wall: '#d99a52', trim: '#fff3f8', sign: '#fff3f8', signText: 'Sweets', textCol: '#ff4f8b', shape: 'frost', door: '#ff7eb6',
      display: () => cakeG(-130, 140, 1.6, '#ffb3c7') + cupcakeG(-60, 140, 1.5, '#7cc8ff') + cupcakeG(-10, 140, 1.3, '#ffd36b') + donutG(-120, 40, 1.6, '#ff4f8b') + donutG(-50, 40, 1.6, '#5fd3b5') + R(-180, 40, 210, 5, 2, '#fff'),
      deco: () => [-206, 206].map((x) => R(x - 7, -120, 14, 300, 7, '#fff') + Array.from({ length: 10 }, (_, i) => Ln(x - 6, -104 + i * 30, x + 6, -114 + i * 30, '#ff4f6d', 6)).join('')).join('') + sprinkles(-200, -110, 400, 20, 10, 8) }),
  }),
  ...series('storefront-books', 'Storefronts', 'Bookshop', 'mall', 'wall', {
    sweet: (st) => sf('Sweet Bookshop', { wall: '#f1ecff', trim: '#fff', sign: '#c99bff', signText: 'Books', textCol: '#fff', shape: 'rect', awn: ['#c99bff', '#fff'],
      display: () => booksRow(-180, -100, 140, 1) + booksRow(-60, 20, 140, 4) + openBookG(-80, 90, 1.2, '#c99bff') + R(-180, 30, 210, 6, 3, '#fff') + booksRow(-176, 16, 30, 7) + teddyG(-80, 140, 0.6, '#fff3d8'),
      deco: () => motif('star', -186, -190, 12) + motif('moon', 186, -190, 12) }),
    retro: (st) => sf('Story Corner Bookshop', { wall: '#fff3d6', trim: '#a86b4a', sign: st.main, signText: 'Story Corner', textCol: '#fff', shape: 'marquee', door: '#a86b4a',
      display: () => [-30, 50, 130].map((y, i) => booksRow(-182, 24, y, i * 5) + R(-188, y, 218, 6, 0, '#a86b4a')).join('') + tr(-160, -40, C(0, -24, 22, '#7cc8ff') + P('M-14 -34 Q-4 -40 4 -30 Q12 -24 6 -14 Q-6 -10 -12 -20Z', '#7fd36b') + R(-2, -2, 4, 8, 1, '#a86b4a') + E(0, 6, 14, 4, '#a86b4a')) + openBookG(-60, -50, 0.9, st.main) }),
  }),
];

const ESCALATORS = series('escalator', 'Escalators', 'Escalator', 'mall', 'floor', {
  sweet: (st) => ({ w: 470, h: 470, art: (c) => escalator(c, '#fff', GOLD, (x, y) => P(heartD(x, y - 8, 26), '#fff', op(0.7))) }),
  modern: (st) => ({ w: 470, h: 470, art: (c) => escalator(c, '#9aa3b5', INK, () => '') }),
  space: (st) => ({ name: 'Space Lift Escalator', w: 470, h: 470, art: (c) => escalator(c, '#c9cfdd', st.accent, (x, y) => P(starD(x, y, 10), st.accent, op(0.8))) + blinkC(-200, -60, 5, '#7fe0ff', 1) + blinkC(200, -380, 5, '#ff7eb6', 1.3) }),
});
/** An escalator rising from the bottom left to the top right, with moving step edges. */
function escalator(c: string, side: string, rail: string, deco: (x: number, y: number) => string): string {
  const x0 = -150, y0 = -40, n = 10, dx = 30, dy = -30;
  let z = `M-232 ${y0} H${x0}`;
  for (let k = 0; k < n; k++) z += ` V${y0 + (k + 1) * dy} H${x0 + (k + 1) * dx}`;
  z += ` H232 V${y0 + n * dy + 30} L${x0 + n * dx} ${y0 + n * dy + 30} L${x0} ${y0 + 30} H-232Z`;
  let s = R(-236, -60, 8, 60, 3, '#9aa3b5') + P(z, '#c9cfdd') + P(z, 'none', stroked('#9aa3b5', 2));
  const top = y0 + n * dy;
  s += `<line x1="${x0 + 4}" y1="${y0 - 4}" x2="${x0 + n * dx}" y2="${top}" stroke="#ffd84a" stroke-width="5" stroke-dasharray="6 36.4" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="-42.4" dur="0.9s" repeatCount="indefinite"/></line>`;
  // glass balustrade
  const glassP = `M-224 ${y0 - 8} H${x0 - 10} L${x0 + n * dx - 10} ${top - 8} H226 V${top - 120} H${x0 + n * dx - 20} L${x0 - 20} ${y0 - 120} H-224Z`;
  s += P(z, 'none', stroked('#6a6a7e', 2.5)) + P(glassP, '#e6f7ff', op(0.22)) + P(glassP, GLASS, op(0.6)) + deco(-40, -150) + deco(60, -250);
  s += `<path d="M-226 ${y0 - 120} H${x0 - 20} L${x0 + n * dx - 20} ${top - 120} H228" fill="none" stroke="${rail}" stroke-width="10" stroke-linecap="round" stroke-dasharray="14 10"><animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.9s" repeatCount="indefinite"/></path>`;
  s += S(`M-226 ${y0 - 120} H${x0 - 20} L${x0 + n * dx - 20} ${top - 120} H228`, rail, 10, op(0.5));
  // the side truss
  const truss = `M-232 ${y0 + 4} H${x0} L${x0 + n * dx} ${top + 4} H232 V${top + 60} H${x0 + n * dx + 50} L${x0 + 50} 0 H-232Z`;
  s += P(truss, c) + P(truss, 'url(#g-shadeY)', op(0.4)) + P(`M-232 ${y0 + 4} H${x0} L${x0 + n * dx} ${top + 4} H232`, 'none', stroked(side, 6));
  s += R(-232, y0 - 2, 70, 6, 3, '#9aa3b5') + R(162, top - 2, 70, 6, 3, '#9aa3b5');
  return s + Ln(150, top + 60, 150, 0, '#9aa3b5', 12) + E(150, 0, 20, 5, '#9aa3b5');
}

const MALLFOUNTAINS = series('mallfountain', 'Mall Fountains', 'Mall Fountain', 'mall', 'floor', {
  sweet: (st) => ({ w: 360, h: 300, toggle: true, seats: [sit(-130, -74), sit(130, -74)], art: (c, on) => {
    let s = E(0, -40, 176, 40, dark(c, 0.15)) + E(0, -60, 172, 30, c) + E(0, -62, 156, 22, on ? '#8fd3ff' : '#bfe8ff') + (on ? ripples(0, -62, 140) : '');
    s += R(-14, -200, 28, 140, 10, '#fff') + E(0, -200, 54, 12, c) + E(0, -204, 46, 8, '#8fd3ff') + P(heartD(0, -260, 40), c) + P(heartD(0, -254, 18), '#fff', op(0.7));
    if (on) s += jets(0, -206, [-1, 1], 130, 140) + jets(0, -260, [-0.4, 0.4], 50, 60);
    s += P('M-176 -40 Q-176 0 0 0 Q176 0 176 -40 V-56 Q176 -26 0 -26 Q-176 -26 -176 -56Z', light(c, 0.2));
    for (let i = 0; i < 9; i++) s += P(heartD(-140 + i * 35, -24, 10), '#fff', op(0.7));
    return s;
  } }),
  modern: (st) => ({ name: 'Dancing Water Fountain', w: 380, h: 300, toggle: true, seats: [sit(-140, -76), sit(140, -76)], art: (c, on) => {
    let s = R(-186, -70, 372, 70, 4, c) + R(-186, -76, 372, 10, 2, '#fff') + R(-172, -66, 344, 20, 2, on ? '#8fd3ff' : '#bfe8ff');
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40, hh = 80 + (i % 3) * 40;
      s += C(x, -60, 4, '#9aa3b5');
      if (on) s += `<rect x="${x - 4}" y="${-60 - hh}" width="8" height="${hh}" rx="4" fill="${WATER}" opacity="0.85"><animate attributeName="height" values="${hh};${hh * 0.3};${hh}" dur="${(1.6 + i * 0.2).toFixed(1)}s" repeatCount="indefinite" ${SPL}/><animate attributeName="y" values="${-60 - hh};${-60 - hh * 0.3};${-60 - hh}" dur="${(1.6 + i * 0.2).toFixed(1)}s" repeatCount="indefinite" ${SPL}/></rect>`;
    }
    return s + R(-186, -40, 372, 6, 0, st.accent) + R(-180, -20, 360, 3, 1.5, '#fff', op(0.5));
  } }),
  princess: (st) => ({ name: 'Royal Swan Fountain', w: 380, h: 340, toggle: true, seats: [sit(-140, -74), sit(140, -74)], art: (c, on) => {
    let s = E(0, -40, 182, 40, GOLD) + E(0, -58, 176, 30, '#fff') + E(0, -60, 160, 22, on ? '#8fd3ff' : '#bfe8ff') + (on ? ripples(0, -60, 140) : '');
    s += tr(-90, -64, E(0, 0, 22, 10, '#fff') + S('M14 -2 Q26 -30 12 -36', '#fff', 6) + P('M12 -40 L22 -36 L12 -32Z', '#ffab3d') + C(12, -38, 4, '#fff') + motif('crown', 12, -46, 5));
    s += P('M-16 -60 L16 -60 L10 -170 H-10Z', '#fff') + E(0, -170, 70, 14, c) + E(0, -174, 62, 9, '#8fd3ff') + R(-8, -250, 16, 80, 6, '#fff') + E(0, -250, 40, 9, c) + E(0, -253, 34, 6, '#8fd3ff') + motif('crown', 0, -276, 20);
    if (on) s += jets(0, -282, [-0.8, 0.8], 60, 90) + jets(0, -176, [-1, 1], 100, 120) + `<g>${[0, 1, 2].map((i) => `<path d="${sparkleD(-60 + i * 60, -220 - i * 20, 8)}" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.4s" begin="${i * 0.4}s" repeatCount="indefinite"/></path>`).join('')}</g>`;
    return s + P('M-182 -40 Q-182 0 0 0 Q182 0 182 -40 V-56 Q182 -26 0 -26 Q-182 -26 -182 -56Z', c) + Array.from({ length: 8 }, (_, i) => C(-140 + i * 40, -20, 4, GOLD)).join('');
  } }),
});
function ripples(cx: number, cy: number, w: number): string {
  return [0, 1].map((i) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="10" ry="3" fill="none" stroke="#fff" stroke-width="2" opacity="0"><animate attributeName="rx" values="10;${f(w / 2)}" dur="2s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="ry" values="3;${f(w / 10)}" dur="2s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="2s" begin="${i}s" repeatCount="indefinite"/></ellipse>`).join('');
}
/** Arcs of falling water from (x, y), spreading out to the sides. */
function jets(x: number, y: number, dirs: number[], reach: number, drop: number): string {
  return dirs.map((d, i) => `<path d="M${f(x)} ${f(y)} Q${f(x + d * reach * 0.5)} ${f(y - 50)} ${f(x + d * reach)} ${f(y + drop)}" fill="none" stroke="${WATER}" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 10" opacity="0.9"><animate attributeName="stroke-dashoffset" values="0;-44" dur="0.8s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/></path>`).join('');
}

/** A cart kiosk: base with wheels, counter at y −150, canopy on poles and a display wall. */
function kiosk(c: string, roof: string, roof2: string, wall: string, show: string, counter: string, roofKind: 'stripe' | 'dome' | 'flat' = 'stripe'): string {
  let s = R(-118, -300, 8, 150, 4, '#fff') + R(110, -300, 8, 150, 4, '#fff') + R(-104, -290, 208, 136, 8, wall) + show;
  s += box(-136, -150, 272, 126, 14, c) + R(-142, -156, 284, 12, 6, '#fff') + counter;
  for (const x of [-100, 100]) s += C(x, -16, 15, INK) + C(x, -16, 6, '#c9cfdd');
  if (roofKind === 'dome') s += P('M-150 -296 Q0 -360 150 -296Z', roof) + R(-150, -300, 300, 12, 6, roof2) + C(0, -340, 10, GOLD);
  else if (roofKind === 'flat') s += R(-150, -320, 300, 26, 4, roof) + R(-150, -296, 300, 4, 0, roof2);
  else s += P('M-150 -296 L-120 -340 H120 L150 -296Z', roof) + awning(-150, -300, 300, 4, 10, roof, roof2, 10);
  return s + gloss(-128, -140, 7, 80);
}
const KIOSKS = series('kiosk', 'Kiosks', 'Kiosk', 'mall', 'floor', {
  sweet: (st) => ({ name: 'Sunglasses Kiosk', w: 300, h: 370, surfaces: [{ x1: -130, x2: 130, y: -156 }], art: (c) => {
    let show = '';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) show += glassesG(-66 + i * 44, -256 + r * 38, 0.9, PACK[(r * 4 + i) % PACK.length], (r + i) % 2 === 0);
    return kiosk(c, c, '#fff', '#fff', show, E(80, -170, 18, 22, SIL) + E(80, -170, 13, 17, '#dff2ff') + R(78, -152, 4, 8, 1, SIL) + P(heartD(-40, -110, 30), '#fff', op(0.85)) + txt(0, -60, 18, '#fff', 'Shades')) + P(heartD(0, -372, 26), c);
  } }),
  modern: (st) => ({ name: 'Phone Case Kiosk', w: 300, h: 350, surfaces: [{ x1: -130, x2: 130, y: -156 }], art: (c) => {
    let show = R(-104, -290, 208, 136, 8, '#fff') + glow(0, -220, 100);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) show += phoneCaseG(-78 + i * 26, -258 + r * 40, PACK[(r * 7 + i) % PACK.length], r + i);
    return kiosk(c, INK, st.accent, '#fff', show, R(-60, -146, 120, 50, 4, '#dff2ff', op(0.6)) + phoneCaseG(-30, -116, '#ff7eb6', 0) + phoneCaseG(0, -116, '#7cc8ff', 1) + phoneCaseG(30, -116, '#ffd36b', 2) + R(-60, -146, 120, 50, 4, GLASS) + txt(0, -56, 16, INK, 'CASES'), 'flat') + txt(0, -301, 14, '#fff', 'phone fun');
  } }),
  princess: (st) => ({ name: 'Jewelry Kiosk', w: 300, h: 370, surfaces: [{ x1: -130, x2: 130, y: -156 }], art: (c) => {
    let show = '';
    for (let i = 0; i < 4; i++) { const x = -66 + i * 44; show += S(`M${x - 14} -272 Q${x} -240 ${x + 14} -272`, GOLD, 2.5) + C(x, -244, 6, CANDY[i]) + C(x - 2, -246, 2, '#fff', op(0.7)); }
    show += [-60, 0, 60].map((x, i) => motif('crown', x, -192, 16 - (i % 2) * 3)).join('');
    const ctr = R(-110, -146, 220, 60, 6, '#fff8fb', op(0.7)) + [-80, -40, 0, 40, 80].map((x, i) => C(x, -116, 7, 'none', stroked(GOLD, 3)) + P(starD(x, -124, 4, 0.5, 4), CANDY[i])).join('') + R(-110, -146, 220, 60, 6, GLASS) + txt(0, -50, 16, '#fff', 'Sparkles', 'font-style="italic"');
    return kiosk(c, '#fff', GOLD, light(c, 0.3), show, ctr, 'dome') + [0, 1, 2].map((i) => `<path d="${sparkleD(-90 + i * 90, -330 + (i % 2) * 20, 9)}" fill="#ffe680"><animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="${i * 0.5}s" repeatCount="indefinite"/></path>`).join('');
  } }),
  rainbow: (st) => ({ name: 'Bows & Clips Kiosk', w: 300, h: 370, surfaces: [{ x1: -130, x2: 130, y: -156 }], art: (c) => {
    let show = '';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) show += bowSmall(-72 + i * 36, -262 + r * 40, RAIN[(r * 5 + i) % 6]);
    return kiosk(c, '#fff', RAIN[4], '#fff', show, RAIN.map((col, i) => R(-130 + i * 43.3, -40, 43.3, 10, 0, col)).join('') + txt(0, -86, 20, '#fff', 'Bows!'), 'stripe') + motif('rainbow', 0, -360, 24);
  } }),
});

const CLAW_SPAWN = ['teddyToy', 'duck', 'ball'];
function claw(on: boolean, col: string): string {
  const g = Ln(0, 0, 0, 40, '#9aa3b5', 3) + R(-10, 38, 20, 12, 4, col) + S('M-8 50 Q-20 62 -10 74 M8 50 Q20 62 10 74 M0 50 V72', '#9aa3b5', 4);
  if (!on) return tr(-20, -296, g);
  return `<g transform="translate(-20 -296)"><g>${g}<animateTransform attributeName="transform" type="translate" values="0 0;40 0;40 70;40 70;40 0;-20 0;0 0" keyTimes="0;0.2;0.4;0.5;0.7;0.9;1" dur="4s" repeatCount="indefinite"/></g></g>`;
}
const plushPile = (x: number, y: number, seed = 0) => teddyG(x - 40, y, 0.7, '#c98a5a') + kittyG(x, y + 2, 0.7, '#ff9ec7') + puppyG(x + 40, y, 0.7, '#fff3d8') + ballG(x - 16, y - 18, 10, '#7cc8ff', '#ffd36b') + teddyG(x + 20, y - 20, 0.55, PACK[seed % 8]);
const CLAWS = series('clawmachine', 'Claw Machines', 'Claw Machine', 'mall', 'floor', {
  sweet: (st) => ({ w: 210, h: 360, toggle: true, sfx: 'boing', spawn: CLAW_SPAWN, art: (c, on) => {
    let s = box(-90, -130, 180, 126, 12, c) + R(-84, -6, 168, 6, 3, dark(c, 0.2)) + R(-70, -110, 60, 50, 8, '#3a3346') + R(-64, -104, 48, 38, 6, '#5a4a66') + C(40, -100, 12, '#fff') + Ln(40, -100, 40, -126, INK, 4) + C(40, -128, 8, '#ff4f6d') + C(70, -92, 6, '#ffd36b');
    s += R(-90, -310, 180, 182, 6, '#f4fbff') + Ln(-84, -296, 84, -296, '#9aa3b5', 5) + plushPile(0, -134, 2) + claw(on, GOLD) + R(-90, -310, 180, 182, 6, GLASS) + R(-90, -310, 180, 182, 6, 'none', stroked('#fff', 6));
    s += box(-100, -360, 200, 54, 20, c) + P(heartD(0, -356, 44), '#fff') + txt(0, -326, 11, c, 'GRAB!');
    for (let i = 0; i < 8; i++) s += on ? blinkC(-86 + i * 24.6, -312, 4, '#fff6c8', 0.8, (i % 2) * 0.4) : C(-86 + i * 24.6, -312, 4, '#fff');
    return s + txt(0, -30, 13, '#fff', 'Prize ♥');
  } }),
  space: (st) => ({ name: 'UFO Claw Machine', w: 220, h: 370, toggle: true, sfx: 'boing', spawn: CLAW_SPAWN, art: (c, on) => {
    let s = P('M-80 0 L-70 -130 H70 L80 0Z', c) + P('M-80 0 L-70 -130 H70 L80 0Z', 'url(#p-stars)') + R(-50, -110, 50, 44, 22, '#262b55') + C(40, -96, 12, SIL) + Ln(40, -96, 40, -120, '#c9cfdd', 4) + C(40, -122, 8, st.accent);
    s += R(-86, -300, 172, 172, 70, '#1e2350') + plushPile(0, -134, 5) + P(starD(-50, -260, 6), '#fff') + P(starD(54, -230, 4), st.accent) + claw(on, '#7fe0b0') + R(-86, -300, 172, 172, 70, GLASS, op(0.8));
    s += E(0, -310, 110, 24, '#c9cfdd') + E(0, -318, 96, 16, c) + P('M-50 -326 Q-48 -370 0 -370 Q48 -370 50 -326Z', '#bfe8ff', op(0.8)) + P('M-50 -326 Q-48 -370 0 -370 Q48 -370 50 -326Z', GLASS);
    for (let i = 0; i < 7; i++) s += on ? blinkC(-90 + i * 30, -308, 4, [st.accent, '#7fe0ff', '#ff7eb6'][i % 3], 0.6 + i * 0.1) : C(-90 + i * 30, -308, 4, '#9aa3b5');
    return s;
  } }),
  candy: (st) => ({ name: 'Candy Grabber', w: 210, h: 370, toggle: true, sfx: 'boing', spawn: ['cupcake', 'donut', 'cookie'], art: (c, on) => {
    let s = box(-90, -130, 180, 126, 16, c, 'dots') + R(-70, -110, 60, 50, 8, '#fff') + C(40, -100, 12, '#fff') + Ln(40, -100, 40, -126, '#fff', 4) + C(40, -128, 8, st.trim);
    s += R(-90, -310, 180, 182, 8, '#fff8fb');
    for (let i = 0; i < 14; i++) s += C(-76 + (i % 7) * 25, -144 - Math.floor(i / 7) * 20, 11, CANDY[i % 5]) + C(-79 + (i % 7) * 25, -147 - Math.floor(i / 7) * 20, 3, '#fff', op(0.6));
    s += lollyG(-50, -170, 9, '#ff4f8b') + lollyG(50, -172, 9, '#7cc8ff') + claw(on, '#ff4f8b') + R(-90, -310, 180, 182, 8, GLASS);
    s += cloth(dripD(-100, -340, 200, 30, 20, 7, 3), '#fff3f8', 'none', 'y') + txt(0, -318, 16, c, 'SWEETS') + C(0, -350, 12, '#e8384f');
    return s + sprinkles(-80, -60, 160, 40, 10, 5);
  } }),
  retro: (st) => ({ name: 'Arcade Claw Machine', w: 210, h: 360, toggle: true, sfx: 'boing', spawn: CLAW_SPAWN, art: (c, on) => {
    let s = R(-90, -130, 180, 126, 6, c) + R(-90, -80, 180, 8, 0, SIL) + R(-90, -10, 180, 10, 0, SIL) + R(-60, -60, 40, 44, 4, '#3a3346') + C(40, -104, 10, INK) + Ln(40, -104, 40, -126, SIL, 4) + C(40, -128, 8, '#e8384f') + R(10, -60, 60, 16, 3, INK) + txt(40, -48, 10, '#ffd36b', '1 PLAY');
    s += R(-90, -310, 180, 182, 0, '#f4fbff') + plushPile(0, -134, 7) + claw(on, SIL) + R(-90, -310, 180, 182, 0, GLASS) + R(-96, -316, 192, 194, 4, 'none', stroked(SIL, 8));
    s += R(-96, -360, 192, 48, 6, st.accent) + txt(0, -328, 20, '#fff', 'CLAW', 'letter-spacing="4"');
    for (let i = 0; i < 9; i++) s += on ? blinkC(-88 + i * 22, -356, 4, st.trim, 0.7, (i % 3) * 0.23) : C(-88 + i * 22, -356, 4, '#fff6c8');
    return s;
  } }),
});

const PHOTOBOOTHS = series('photobooth', 'Photo Booths', 'Photo Booth', 'mall', 'floor', {
  sweet: (st) => ({ w: 270, h: 370, toggle: true, sfx: 'ding', seats: [sit(10, -92)], art: (c, on) => {
    let s = box(-130, -340, 260, 336, 16, c) + R(-110, -300, 220, 296, 6, '#fff3f8');
    for (let i = 0; i < 6; i++) s += P(heartD(-80 + (i % 3) * 80, -270 + Math.floor(i / 3) * 70, 26), light(c, 0.4));
    s += E(10, -86, 40, 8, '#c9cfdd') + R(-2, -80, 24, 76, 4, GOLD) + box(-30, -100, 80, 18, 9, light(c, 0.2));
    s += R(-120, -360, 240, 40, 20, '#fff', stroked(c, 4)) + txt(0, -333, 18, c, 'Photos ♥') + R(132, -200, 14, 80, 4, dark(c, 0.2));
    if (on) s += `<rect x="-110" y="-300" width="220" height="296" fill="#fff"><animate attributeName="opacity" values="0.9;0;0;0" dur="2s" repeatCount="indefinite"/></rect>` + R(134, -196, 30, 96, 2, '#fff', stroked('#e3e6ee', 1.5)) + [0, 1, 2].map((i) => R(138, -190 + i * 30, 22, 24, 1, '#ffd9e8') + P(heartD(149, -186 + i * 30, 10), c)).join('');
    return s;
  }, front: (c) => R(-130, -320, 260, 26, 10, dark(c, 0.1)) + cloth('M-124 -300 H-50 Q-56 -150 -40 -10 H-124Z', light(c, 0.2), 'hearts') + R(-130, -300, 14, 296, 6, c) + R(116, -300, 14, 296, 6, c) + E(-46, -150, 10, 14, GOLD) }),
  retro: (st) => ({ name: 'Retro Photo Booth', w: 270, h: 380, toggle: true, sfx: 'ding', seats: [sit(10, -92)], art: (c, on) => {
    let s = box(-130, -340, 260, 336, 6, c) + R(-110, -296, 220, 292, 2, '#2d2a3a') + R(-110, -296, 220, 292, 2, 'url(#p-stars)', op(0.4));
    s += E(10, -86, 40, 8, SIL) + R(-2, -80, 24, 76, 4, SIL) + box(-30, -100, 80, 18, 9, st.accent);
    s += R(-120, -376, 240, 40, 6, '#fff') + txt(0, -347, 20, c, 'PHOTO', 'letter-spacing="5"');
    for (let i = 0; i < 9; i++) s += on ? blinkC(-110 + i * 27.5, -380, 4, st.trim, 0.6, (i % 2) * 0.3) : C(-110 + i * 27.5, -380, 4, '#fff6c8');
    s += R(132, -210, 14, 90, 3, SIL);
    if (on) s += `<rect x="-110" y="-296" width="220" height="292" fill="#fff"><animate attributeName="opacity" values="0.95;0;0;0" dur="2s" repeatCount="indefinite"/></rect>` + R(134, -206, 30, 100, 2, '#fff') + [0, 1, 2].map((i) => R(138, -200 + i * 32, 22, 26, 1, '#5a5a6e') + C(149, -188 + i * 32, 5, '#c9cfdd')).join('');
    return s;
  }, front: (c) => R(-130, -320, 260, 24, 0, SIL) + cloth('M-124 -296 H-46 Q-60 -150 -44 -10 H-124Z', '#e8384f') + Array.from({ length: 5 }, (_, i) => Ln(-114 + i * 14, -290, -114 + i * 12, -16, '#c92a3a', 2.5)).join('') + R(-130, -296, 14, 292, 0, c) + R(116, -296, 14, 292, 0, c) + R(-130, -10, 260, 10, 0, SIL) }),
});

const MALLBENCHES = series('mallbench', 'Mall Benches', 'Mall Bench', 'mall', 'floor', {
  sweet: (st) => ({ w: 260, h: 190, seats: [sit(-60, -90), sit(60, -90)], art: (c) => leg(-104, -76, 76, GOLD, 9) + leg(104, -76, 76, GOLD, 9) + P(heartD(-60, -200, 110), c) + P(heartD(60, -200, 110), c) + P(heartD(-60, -200, 110), 'url(#g-shadeX)') + P(heartD(60, -200, 110), 'url(#g-shadeX)') + box(-124, -100, 248, 24, 12, dark(c, 0.06), 'none', 'y') + R(-118, -98, 60, 5, 2.5, '#fff', op(0.4)) }),
  modern: (st) => ({ name: 'Slatted Mall Bench', w: 280, h: 110, seats: [sit(-66, -84), sit(66, -84)], art: (c) => R(-120, -80, 14, 80, 2, INK) + R(106, -80, 14, 80, 2, INK) + R(-120, -20, 240, 8, 0, INK) + [0, 1, 2, 3].map((i) => R(-136, -92 + i * 5, 272, 4, 1, i % 2 ? dark(c, 0.15) : WOOD)).join('') + box(-136, -96, 272, 16, 3, WOOD) + planksV(-136, -96, 272, 16, 9, WOOD_D) }),
  woodland: (st) => ({ name: 'Planter Bench', w: 320, h: 230, seats: [sit(-60, -92), sit(60, -92)], art: (c) => {
    let s = '';
    for (const x of [-130, 130]) s += box(x - 30, -100, 60, 100, 8, st.wood) + planksH(x - 30, -100, 60, 100, 4, dark(st.wood, 0.2)) + [-1, 0, 1].map((k) => leaf(x + k * 12, -104, 2, -90 + k * 40, k ? '#6fc47c' : '#5fae6b')).join('') + leaf(x - 6, -110, 1.6, -150, '#8fd36b') + leaf(x + 6, -110, 1.6, -30, '#8fd36b');
    return s + box(-104, -100, 208, 20, 6, '#c98a5a') + planksV(-104, -100, 208, 20, 6, '#a86b4a') + R(-96, -80, 192, 8, 3, '#a86b4a') + motif('leaf', 0, -60, 12);
  } }),
  retro: (st) => ({ name: 'Curvy Retro Bench', w: 280, h: 180, seats: [sit(-60, -92), sit(60, -92)], art: (c) => R(-90, -40, 12, 40, 4, SIL) + R(78, -40, 12, 40, 4, SIL) + cloth('M-130 -90 Q-140 -170 -60 -170 Q0 -150 60 -170 Q140 -170 130 -90Z', c) + Array.from({ length: 6 }, (_, i) => Ln(-90 + i * 36, -150, -90 + i * 36, -100, dark(c, 0.15), 3)).join('') + box(-134, -104, 268, 26, 13, c, 'none', 'y') + R(-134, -82, 268, 6, 3, SIL) + R(-100, -76, 200, 36, 18, st.accent) }),
});

const palmFrond = (x: number, y: number, len: number, rot: number, col: string) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${P(`M0 0 Q${f(len * 0.5)} ${f(-len * 0.28)} ${f(len)} ${f(len * 0.1)} Q${f(len * 0.5)} ${f(-len * 0.08)} 0 0Z`, col)}${Array.from({ length: 6 }, (_, i) => Ln(len * (0.15 + i * 0.13), -len * 0.12 + i * len * 0.02, len * (0.2 + i * 0.13), len * 0.06, dark(col, 0.15), 1.6)).join('')}</g>`;
const palmTop = (x: number, y: number, col: string) => sway(x, y, 3, 4, [[-160, 120], [-130, 110], [-100, 120], [-60, 110], [-30, 120], [-10, 100], [-200, 100], [20, 110]].map(([r, l], i) => palmFrond(x, y, l, r, i % 2 ? col : dark(col, 0.1))).join('') + C(x, y, 12, '#a86b4a'));
const MALLPALMS = series('mallpalm', 'Big Potted Palms', 'Palm', 'mall', 'floor', {
  sweet: (st) => ({ name: 'Sweet Potted Palm', w: 240, h: 420, art: (c) => S('M0 -90 Q-14 -200 0 -310', '#c98a5a', 18) + S('M0 -90 Q-14 -200 0 -310', '#a86b4a', 18, 'stroke-dasharray="4 14"') + palmTop(0, -310, '#5fbf6a') + box(-60, -94, 120, 94, 40, c) + R(-66, -100, 132, 16, 8, light(c, 0.3)) + bowG(0, -60, 0.9, '#fff') }),
  modern: (st) => ({ name: 'Cube Planter Palm', w: 240, h: 420, art: (c) => S('M-10 -100 Q-20 -200 -6 -300', '#a86b4a', 14) + S('M10 -100 Q22 -180 30 -250', '#a86b4a', 12) + palmTop(-6, -300, '#4fa85c') + tr(30, -250, palmTop(0, 0, '#6fc47c'), 0.6) + R(-70, -110, 140, 110, 4, c) + R(-70, -110, 140, 110, 4, 'url(#g-shadeX)') + R(-74, -116, 148, 10, 2, INK) }),
  boho: (st) => ({ name: 'Woven Basket Palm', w: 260, h: 400, art: (c) => S('M0 -90 Q10 -200 0 -280', '#a86b4a', 16) + palmTop(0, -280, '#5fae6b') + P('M-70 -100 H70 L56 0 H-56Z', '#e8c08a') + [-80, -60, -40, -20].map((y) => Ln(-66 - (y + 100) * 0.13, y, 66 + (y + 100) * 0.13, y, '#c9965a', 3)).join('') + [-50, -25, 0, 25, 50].map((x) => Ln(x, -98, x * 0.8, -4, '#c9965a', 2)).join('') + R(-74, -106, 148, 10, 5, c) + S('M-56 -50 q-16 10 -10 24 M56 -50 q16 10 10 24', st.accent, 3) }),
});

/** Kiddie rides only move while someone rides them. */
const bounceArt = (inner: string, on: boolean, amp: number, dur: number, phase = 0) =>
  on ? `<g>${inner}<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f(-amp)};0 0" dur="${dur}s" begin="${f(-phase)}s" repeatCount="indefinite" ${SPL}/></g>` : inner;
const horseG = (x: number, y: number, col: string, mane: string) => tr(x, y, E(0, 0, 40, 18, col) + P('M26 -8 L40 -46 Q52 -54 58 -40 L44 -4Z', col) + E(52, -44, 12, 8, col) + C(52, -46, 2, INK) + S('M34 -40 Q30 -50 40 -56 M30 -30 Q24 -38 30 -46', mane, 5) + S('M-38 -4 Q-56 -4 -54 18', mane, 6) + Ln(-24, 12, -30, 40, col, 7) + Ln(20, 12, 26, 40, col, 7) + R(-16, -18, 30, 10, 5, '#fff') + E(0, -14, 14, 6, '#ff4f6d'));
const KIDDIERIDES = series('kiddieride', 'Kiddie Rides', 'Kiddie Ride', 'mall', 'floor', {
  sweet: (st) => ({ name: 'Mini Carousel', w: 340, h: 400, animWhenUsed: true,
    seats: [{ ...sit(-80, -136), anim: { kind: 'bounce', pivot: [0, 0], amp: 16, dur: 1.4 } }, { ...sit(80, -136), anim: { kind: 'bounce', pivot: [0, 0], amp: 16, dur: 1.4, phase: 0.7 } }],
    art: (c, on) => {
      let s = E(0, -16, 166, 22, dark(c, 0.15)) + E(0, -26, 160, 18, '#fff') + E(0, -28, 150, 13, light(c, 0.3)) + R(-10, -340, 20, 320, 6, GOLD);
      for (const [x, ph, col] of [[-80, 0, '#fff'], [80, 0.7, '#fff3d8']] as [number, number, string][]) s += bounceArt(R(x - 3, -330, 6, 300, 3, GOLD) + horseG(x, -118, col, c), on, 16, 1.4, ph);
      s += P('M-170 -330 L0 -390 L170 -330Z', c);
      for (let i = 0; i < 6; i++) if (i % 2) s += P(`M0 -390 L${-170 + i * 56.7} -330 L${-170 + (i + 1) * 56.7} -330Z`, '#fff');
      s += awning(-170, -332, 340, 6, 12, c, '#fff', 8) + P(heartD(0, -414, 28), c) + R(-3, -392, 6, 10, 2, GOLD);
      for (let i = 0; i < 9; i++) s += on ? blinkC(-160 + i * 40, -320, 4, '#fff6c8', 0.8, (i % 2) * 0.4) : C(-160 + i * 40, -320, 4, '#fff6c8');
      return s;
    } }),
  space: (st) => ({ name: 'Rocket Ride', w: 240, h: 360, animWhenUsed: true, seats: [{ ...sit(0, -150), anim: { kind: 'bounce', pivot: [0, 0], amp: 12, dur: 0.9 } }],
    art: (c, on) => {
      let s = E(0, -14, 100, 16, '#c9cfdd') + E(0, -20, 92, 12, '#262b55') + R(-40, -60, 80, 44, 10, '#c9cfdd') + txt(0, -32, 12, st.accent, '★ RIDE ★');
      const rocket = P('M-50 -100 L-90 -60 L-50 -70Z', '#ff6b8a') + P('M50 -100 L90 -60 L50 -70Z', '#ff6b8a') + P('M-50 -66 V-220 Q0 -330 50 -220 V-66Z', c) + P('M-50 -66 V-220 Q0 -330 50 -220 V-66Z', 'url(#p-stars)') + C(0, -240, 18, SIL) + C(0, -240, 13, '#bfe8ff') + R(-40, -150, 80, 14, 7, '#fff') + (on ? flame(-24, -58, 0.9) + flame(24, -58, 0.9) + flame(0, -54, 1.2) : '') + R(-36, -70, 72, 10, 4, SIL);
      return s + bounceArt(rocket, on, 12, 0.9);
    } }),
  candy: (st) => ({ name: 'Candy Car Ride', w: 260, h: 260, animWhenUsed: true, seats: [{ ...sit(0, -104), anim: { kind: 'sway', pivot: [0, 0], amp: 14, dur: 1.6 } }],
    art: (c, on) => {
      let s = R(-110, -24, 220, 24, 10, '#fff') + R(-110, -24, 220, 8, 4, dark(c, 0.15)) + txt(0, -6, 12, c, 'ride me!');
      const car = P('M-110 -40 Q-114 -100 -70 -110 H70 Q114 -100 110 -40Z', c) + P('M-110 -40 Q-114 -100 -70 -110 H70 Q114 -100 110 -40Z', 'url(#p-dots)') + box(-50, -120, 100, 20, 10, light(c, 0.3)) + P('M40 -110 Q60 -170 90 -150 L80 -110Z', '#bfe8ff', op(0.8)) +
        [-70, 70].map((x) => C(x, -34, 22, INK) + C(x, -34, 10, '#fff') + P(starD(x, -34, 7), st.trim)).join('') + lollyG(-96, -110, 10, '#7cc8ff') + C(104, -70, 7, '#fff6c8');
      return s + (on ? `<g>${car}<animateTransform attributeName="transform" type="translate" values="-14 0;14 0;-14 0" dur="1.6s" repeatCount="indefinite" ${SPL}/></g>` : car);
    } }),
});

const DIRECTORIES = series('directory', 'Directory Signs', 'Directory', 'mall', 'floor', {
  sweet: (st) => ({ name: 'Sweet Mall Map', w: 210, h: 330, art: (c) => {
    let s = E(0, -6, 50, 8, GOLD) + R(-10, -120, 20, 116, 6, GOLD) + box(-96, -320, 192, 210, 20, c) + R(-84, -280, 168, 160, 8, '#fff');
    const blocks: [number, number, number, number, string][] = [[-78, -274, 60, 44, '#ffd36b'], [-12, -274, 90, 44, '#7cc8ff'], [-78, -224, 40, 98, '#a8e6cf'], [-32, -224, 54, 46, '#c99bff'], [28, -224, 50, 98, '#ff9a6b'], [-32, -172, 54, 46, '#ffb3c7']];
    for (const [x, y, w, h, col] of blocks) s += R(x, y, w, h, 4, col);
    s += `<path d="${starD(-5, -150, 10)}" fill="#ff4f6d"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></path>`;
    return s + txt(0, -294, 16, '#fff', 'Mall Map') + txt(28, -136, 9, INK, 'you!');
  } }),
  modern: (st) => ({ name: 'Touch Screen Directory', w: 170, h: 340, art: (c) => {
    let s = R(-70, -330, 140, 330, 10, INK) + R(-58, -300, 116, 200, 4, '#fff') + R(-58, -300, 116, 26, 4, st.accent) + txt(0, -282, 12, '#fff', 'DIRECTORY');
    for (let i = 0; i < 6; i++) s += C(-44, -260 + i * 26, 6, PACK[i]) + R(-32, -264 + i * 26, 76, 8, 4, '#e6e8f0');
    s += C(0, -60, 14, '#3d3a4e') + C(0, -60, 6, st.accent);
    return s + `<circle cx="30" cy="-160" r="8" fill="${st.accent}" opacity="0.5"><animate attributeName="r" values="4;14;4" dur="1.6s" repeatCount="indefinite"/></circle>` + R(-58, -300, 116, 200, 4, GLASS, op(0.5));
  } }),
});

const balloon = (x: number, y: number, r: number, col: string, i: number) => sway(x, y + r * 3, 5, 2.4 + (i % 3) * 0.4, S(`M${f(x)} ${f(y + r)} Q${f(x + 6)} ${f(y + r * 2)} ${f(x)} ${f(y + r * 3)}`, '#9aa3b5', 1.4) + E(x, y, r * 0.86, r, col) + P(`M${f(x - 4)} ${f(y + r + 4)} L${f(x)} ${f(y + r - 1)} L${f(x + 4)} ${f(y + r + 4)}Z`, col) + E(x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.3, '#fff', op(0.6)), i * 0.3);
const BALLOONSTANDS = series('mallballoons', 'Balloon Kiosks', 'Balloon Kiosk', 'mall', 'floor', {
  sweet: (st) => ({ name: 'Sweet Balloon Cart', w: 230, h: 420, art: (c) => {
    let s = '';
    const bs: [number, number, string][] = [[-60, -330, '#ff7eb6'], [0, -370, '#fff'], [60, -330, '#c99bff'], [-30, -290, '#ffd36b'], [30, -290, '#7cc8ff'], [-80, -260, '#5fd3b5'], [80, -270, '#ff4f6d']];
    bs.forEach(([x, y, col], i) => { s += Ln(0, -130, x, y + 24, '#9aa3b5', 1.2) + balloon(x, y, 22, col, i); });
    s += P(heartD(0, -250, 40), c) + box(-80, -130, 160, 100, 16, c) + R(-86, -136, 172, 12, 6, '#fff') + txt(0, -72, 16, '#fff', 'Balloons');
    return s + C(-50, -20, 14, INK) + C(50, -20, 14, INK) + C(-50, -20, 5, '#fff') + C(50, -20, 5, '#fff');
  } }),
  rainbow: (st) => ({ name: 'Rainbow Balloon Pole', w: 220, h: 430, art: (c) => {
    let s = E(0, -6, 50, 8, '#fff') + R(-5, -230, 10, 224, 5, '#fff') + motif('cloud', 0, -40, 28);
    RAIN.forEach((col, i) => { const a = -Math.PI / 2 + (i - 2.5) * 0.42; const x = Math.cos(a) * 90, y = -300 + Math.sin(a) * 60 + 30; s += Ln(0, -230, x, y + 24, '#9aa3b5', 1.2) + balloon(x, y, 22, col, i); });
    return s + balloon(0, -390, 20, '#fff', 7) + Ln(0, -230, 0, -346, '#9aa3b5', 1.2);
  } }),
});

const bagG = (col: string, handle: string, inner: string) => S('M-14 -64 Q-14 -84 0 -84 Q14 -84 14 -64', handle, 4) + P('M-28 -66 H28 L32 0 H-32Z', col) + P('M-28 -66 H28 L32 0 H-32Z', 'url(#g-shadeX)') + R(-28, -66, 56, 6, 0, dark(col, 0.1)) + inner;
const SHOPBAGS = series('shopbag', 'Shopping Bags', 'Shopping Bag', 'mall', 'prop', {
  sweet: (st) => ({ w: 70, h: 90, art: (c) => bagG(c, '#fff', P(heartD(0, -44, 22), '#fff')) }),
  princess: (st) => ({ name: 'Royal Gift Bag', w: 70, h: 96, art: (c) => S('M-6 -66 Q-16 -90 -20 -78 M6 -66 Q16 -90 20 -78', '#fff', 4) + bagG(c, GOLD, motif('crown', 0, -34, 14) + R(-32, -12, 64, 6, 0, GOLD)) }),
  modern: (st) => ({ name: 'Modern Shopper', w: 70, h: 90, art: (c) => bagG(c, INK, txt(0, -26, 12, INK, 'SHOP') + R(-18, -50, 36, 3, 1, INK)) }),
  candy: (st) => ({ name: 'Candy Stripe Bag', w: 70, h: 90, art: (c) => bagG(c, '#fff', [-20, -4, 12].map((x) => `<path d="M${x} -60 L${x + 8} -60 L${x + 10} -4 L${x + 2} -4Z" fill="#fff" opacity="0.7"/>`).join('') + C(0, -34, 9, CANDY[0]) + S('M-4 -34 A4 4 0 1 1 0 -30', '#fff', 2)) }),
  rainbow: (st) => ({ name: 'Rainbow Bag', w: 70, h: 90, art: (c) => bagG('#fff', RAIN[4], RAIN.map((col, i) => R(-29 + i * 0.6, -58 + i * 9, 58, 9, 0, col)).join('') + motif('cloud', 0, -22, 12)) }),
});

// =====================================================================
// TOWN-MAP BUILDING FRONTS (base centre at 0,0, drawn upward)
// =====================================================================
const shadeT = (x: number, y: number, w: number, h: number, r = 0) => R(x, y, w, h, r, 'url(#g-shadeX)');
function windowBoxT(x: number, y: number, w: number, h: number, curtain: string, lit = false): string {
  let s = R(x - 6, y - 6, w + 12, h + 12, 8, '#ffffff') + R(x, y, w, h, 5, lit ? '#fff1b8' : '#bfe3ff') + R(x, y, w, h, 5, GLASS);
  s += P(`M${f(x)} ${f(y)} L${f(x + w * 0.3)} ${f(y)} Q${f(x + w * 0.22)} ${f(y + h * 0.5)} ${f(x)} ${f(y + h * 0.72)}Z`, curtain) + P(`M${f(x + w)} ${f(y)} L${f(x + w * 0.7)} ${f(y)} Q${f(x + w * 0.78)} ${f(y + h * 0.5)} ${f(x + w)} ${f(y + h * 0.72)}Z`, curtain);
  return s + R(x + w / 2 - 2, y, 4, h, 1, '#ffffff', op(0.9));
}
/** Flowers in spring and summer, autumn colors in fall, a strip of snow in winter. */
function flowerBoxT(x: number, y: number, w: number, s: Season): string {
  if (s === 'winter') return R(x - 6, y - 4, w + 12, 8, 4, '#fff');
  const cols = s === 'fall' ? ['#ff8a3d', '#ffc23d', '#e8573d'] : ['#ff7eb6', '#ffd36b', '#ffffff', '#c99bff'];
  let g = '';
  const n = Math.max(3, Math.round(w / 18));
  for (let i = 0; i < n; i++) g += flowerG(x + (w * (i + 0.5)) / n, y - 4, 7, cols[i % cols.length]);
  return g;
}
const snowCap = (d: string, s: Season) => (s === 'winter' ? P(d, '#ffffff') + P(d, 'url(#g-shadeY)', op(0.4)) : '');
const bushT = (x: number, y: number, sc: number, s: Season) => {
  const c = s === 'winter' ? '#e8f0fa' : s === 'fall' ? '#d98a3d' : '#5fc47c';
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})">${C(-26, -20, 26, dark(c, 0.06))}${C(22, -18, 24, dark(c, 0.06))}${C(0, -32, 30, c)}${C(-8, -42, 10, '#fff', op(0.18))}${s === 'spring' || s === 'summer' ? flowerG(-14, -36, 6, '#ff9ec7') + flowerG(14, -24, 6, '#fff') : ''}</g>`;
};
const fallLeaves = (x: number, w: number, s: Season) => s === 'fall' ? [0, 1, 2, 3, 4, 5].map((i) => E(x + rnd(i + 40) * w, -4 - rnd(i + 50) * 8, 9, 5, ['#ff8a3d', '#ffc23d', '#e8573d'][i % 3], `transform="rotate(${Math.round(rnd(i) * 180)} ${f(x + rnd(i + 40) * w)} ${f(-4 - rnd(i + 50) * 8)})"`)).join('') : '';
const T = (x: number, y: number, t: string, size: number, fill: string, extra = '') => txt(x, y, size, fill, t, extra);

function groceryFacade(s: Season): string {
  const wall = '#eaf7e0', green = '#4fb36a';
  let g = E(0, 4, 250, 18, 'url(#g-ground)');
  g += R(-210, -330, 420, 330, 8, wall) + shadeT(-210, -330, 420, 330, 8) + R(-210, -40, 420, 40, 0, dark(wall, 0.08));
  // parapet sign
  g += P(archD(-170, -440, 340, 120, 80), '#ffffff') + P(archD(-158, -430, 316, 104, 72), green) + T(0, -360, 'Market', 44, '#ffffff') + appleF(-104, -378, 16) + appleF(108, -378, 16, '#ffd84a');
  g += snowCap('M-172 -364 C-172 -414 -130 -442 0 -442 C130 -442 172 -414 172 -364 L162 -362 C150 -400 120 -424 0 -426 C-120 -424 -150 -400 -162 -362Z', s);
  g += R(-220, -336, 440, 14, 6, '#ffffff') + snowCap('M-222 -334 Q-110 -346 0 -338 Q110 -346 222 -334 V-326 H-222Z', s);
  // windows with shelves
  for (const x of [-190, 70]) {
    g += R(x, -290, 120, 130, 6, '#ffffff') + R(x + 8, -282, 104, 114, 4, '#f4fbff');
    g += goods(x + 10, x + 110, -236, ['cereal', 'chips'], x > 0 ? 3 : 0, 40) + R(x + 8, -236, 104, 4, 0, '#c9cfdd') + goods(x + 10, x + 110, -176, ['can', 'bottle', 'carton'], x > 0 ? 5 : 1, 46) + R(x + 8, -176, 104, 4, 0, '#c9cfdd');
    g += R(x + 8, -282, 104, 114, 4, GLASS);
  }
  // striped awning over the door and produce
  g += awning(-200, -150, 400, 30, 12, green, '#ffffff', 12) + snowCap('M-204 -156 H204 V-148 Q0 -140 -204 -148Z', s);
  // automatic glass doors
  g += R(-60, -110, 120, 110, 6, '#c9cfdd') + R(-54, -104, 52, 104, 3, '#dff2ff') + R(2, -104, 52, 104, 3, '#dff2ff') + R(-54, -104, 108, 104, 3, GLASS) + R(-30, -66, 60, 18, 9, '#ffffff') + T(0, -53, 'OPEN', 12, green);
  g += R(-70, -4, 140, 8, 4, '#f2e6d8');
  // produce crates out front
  g += crate(-196, -50, 60, 44) + crate(-130, -50, 60, 44) + crate(-163, -94, 60, 40);
  if (s === 'winter') g += heap('orange', -166, -50, 54, 9, 2, 1) + heap('apple', -100, -50, 54, 9, 2, 2) + heap('lemon', -133, -94, 54, 9, 1, 3) + R(-198, -60, 62, 8, 4, '#fff') + R(-132, -60, 62, 8, 4, '#fff');
  else if (s === 'fall') g += heap('pumpkin', -166, -50, 54, 13, 1, 1) + heap('apple', -100, -50, 54, 9, 2, 2) + heap('pumpkin', -133, -94, 54, 12, 1, 3);
  else g += heap('apple', -166, -50, 54, 9, 2, 1) + heap('orange', -100, -50, 54, 9, 2, 2) + heap('grape', -133, -94, 54, 12, 1, 3);
  g += tag(-100, -16, green, '♥') + tag(-166, -16, green, '★');
  // a shopping cart parked by the door
  g += tr(130, 0, Ln(-34, -40, -28, -12, '#9aa3b5', 4) + Ln(38, -40, 32, -12, '#9aa3b5', 4) + C(-24, -6, 6, INK) + C(28, -6, 6, INK) + P('M-40 -86 L46 -86 L38 -40 L-32 -40Z', '#ff9ec7', op(0.5)) + Array.from({ length: 6 }, (_, i) => Ln(-34 + i * 14, -84, -28 + i * 12, -42, '#ff7eb6', 2)).join('') + P('M-40 -86 L46 -86 L38 -40 L-32 -40Z', 'none', stroked('#ff7eb6', 3)) + Ln(-40, -86, -56, -100, '#9aa3b5', 4) + R(-66, -106, 20, 8, 4, '#ff7eb6') + (s === 'winter' ? '' : bananaF(10, -86, 0.6) + carrotF(-16, -110, 0.7, -20)));
  g += R(184, -64, 30, 64, 6, '#a86b4a') + (s === 'winter' ? R(182, -70, 34, 10, 5, '#fff') : flowerBoxT(186, -64, 26, s));
  if (s === 'fall') g += pumpkinF(56, -14, 14);
  return g + bushT(-232, 0, 0.7, s) + fallLeaves(-200, 400, s);
}

function restaurantFacade(s: Season): string {
  const wall = '#ffe6d6', roof = '#e85d5d';
  let g = E(0, 4, 270, 18, 'url(#g-ground)');
  g += R(-200, -330, 400, 330, 8, wall) + shadeT(-200, -330, 400, 330, 8);
  // tiled roof band
  g += P('M-222 -320 L-196 -370 H196 L222 -320Z', roof);
  for (let r = 0; r < 2; r++) { let d = `M${-200 + r * 12} ${-332 - r * 18}`; for (let i = 0; i < 17 - r; i++) d += ' q12 10 24 0'; g += P(d, 'none', `${stroked(light(roof, 0.25), 3)} ${op(0.7)}`); }
  g += snowCap('M-224 -318 L-196 -372 H196 L224 -318 Q110 -330 0 -322 Q-110 -330 -224 -318Z', s);
  // the big chef-hat sign
  g += R(-6, -400, 12, 40, 4, '#9aa3b5');
  g += P('M-90 -400 V-430 Q-124 -436 -118 -470 Q-110 -500 -76 -490 Q-60 -520 -24 -510 Q0 -530 26 -510 Q62 -520 76 -490 Q110 -500 118 -470 Q124 -436 90 -430 V-400Z', '#ffffff', stroked('#e6d4c2', 3));
  g += R(-92, -412, 184, 26, 6, roof) + T(0, -393, 'Yummy Diner', 17, '#ffffff') + T(0, -448, '♥', 22, roof);
  g += snowCap('M-118 -470 Q-110 -500 -76 -490 Q-60 -520 -24 -510 Q0 -530 26 -510 Q62 -520 76 -490 Q110 -500 118 -470 Q96 -482 70 -474 Q40 -496 0 -490 Q-40 -496 -70 -474 Q-96 -482 -118 -470Z', s);
  // windows and door
  g += windowBoxT(-170, -296, 100, 80, '#ff9ec7', true) + windowBoxT(70, -296, 100, 80, '#ff9ec7', true);
  g += R(-176, -210, 112, 12, 4, '#a86b4a') + flowerBoxT(-170, -210, 100, s) + R(64, -210, 112, 12, 4, '#a86b4a') + flowerBoxT(70, -210, 100, s);
  g += awning(-60, -260, 120, 20, 5, roof, '#ffffff', 8);
  g += R(-46, -210, 92, 210, 40, '#a85a3a') + R(-38, -200, 76, 200, 34, '#c97a4a') + C(0, -160, 20, '#fff1b8') + C(0, -160, 20, GLASS) + C(0, -160, 20, 'none', stroked('#a85a3a', 4)) + C(24, -90, 5, '#ffd24a');
  g += R(-60, -4, 120, 10, 4, '#f2e6d8');
  // string lights strung across the patio, post to post
  g += Ln(-250, 0, -250, -236, '#6a5a4a', 6) + Ln(250, 0, 250, -236, '#6a5a4a', 6) + C(-250, -238, 5, '#6a5a4a') + C(250, -238, 5, '#6a5a4a');
  const bulbs = (x1: number, y1: number, x2: number, y2: number, sag: number, seed: number) => {
    const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + sag;
    let b = S(`M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`, '#4a4048', 2);
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2, y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2;
      b += R(x - 2, y - 1, 4, 5, 1, '#4a4048') + blinkC(x, y + 9, 6, ['#fff6a0', '#ffb3c7', '#bfe8ff'][(i + seed) % 3], 1.6 + (i % 3) * 0.3, i * 0.2);
    }
    return b;
  };
  g += bulbs(-250, -236, -86, -264, 36, 0) + bulbs(-86, -264, 86, -264, 30, 1) + bulbs(86, -264, 250, -236, 36, 2);
  // patio tables with umbrellas
  for (const [x, c1] of [[-140, '#ff9ec7'], [140, '#7cc8ff']] as [number, string][]) {
    g += R(x - 3, -170, 6, 130, 3, '#ffffff');
    if (s === 'winter') g += P(`M${x - 8} -170 L${x} -120 L${x + 8} -170Z`, c1) + E(x, -172, 10, 4, '#fff');
    else {
      g += P(`M${x - 76} -150 Q${x} -210 ${x + 76} -150Z`, c1);
      for (let i = 1; i < 4; i += 2) g += P(`M${x} -186 L${x - 76 + i * 38} -150 L${x - 38 + i * 38} -150Z`, '#ffffff');
      for (let i = 0; i < 4; i++) g += P(`M${x - 76 + i * 38} -150 q19 10 38 0`, i % 2 ? '#ffffff' : c1);
    }
    g += E(x, -66, 50, 8, '#ffffff') + R(x - 4, -62, 8, 58, 3, '#9aa3b5') + E(x, -4, 22, 4, '#9aa3b5');
    g += s === 'winter' ? soupG(x - 18, -70, 0.45, false) + milkshakeG(x + 20, -70, 0.35, '#8a5a3c') : burgerG(x - 18, -70, 0.45) + milkshakeG(x + 20, -70, 0.35);
    for (const dx of [-60, 60]) g += R(x + dx - 18, -110, 36, 60, 10, c1) + R(x + dx - 22, -54, 44, 10, 5, c1) + Ln(x + dx - 16, -44, x + dx - 18, 0, '#9aa3b5', 4) + Ln(x + dx + 16, -44, x + dx + 18, 0, '#9aa3b5', 4);
  }
  if (s === 'fall') g += pumpkinF(-80, -14, 14) + pumpkinF(80, -12, 12);
  return g + fallLeaves(-240, 480, s);
}

function mallFacade(s: Season): string {
  const wall = '#f1ecff', glassC = '#bfe3ff', frame = '#9aa3b5';
  let g = E(0, 4, 310, 20, 'url(#g-ground)');
  // wings with glass curtain walls
  for (const x of [-280, 120]) {
    g += R(x, -300, 160, 300, 6, wall) + shadeT(x, -300, 160, 300, 6) + R(x + 14, -280, 132, 220, 4, glassC) + R(x + 14, -280, 132, 220, 4, GLASS);
    for (let i = 1; i < 4; i++) g += Ln(x + 14 + i * 33, -280, x + 14 + i * 33, -60, frame, 3);
    for (let j = 1; j < 4; j++) g += Ln(x + 14, -280 + j * 55, x + 146, -280 + j * 55, frame, 3);
    g += R(x - 6, -310, 172, 14, 6, '#ffffff') + snowCap(`M${x - 8} -308 H${x + 168} V-300 Q${x + 80} -292 ${x - 8} -300Z`, s);
    g += R(x + 14, -60, 132, 14, 4, '#a86b4a') + flowerBoxT(x + 20, -60, 120, s);
  }
  // shoppers' silhouettes in the windows
  g += tr(-220, -150, bagG('#ff7eb6', '#fff', ''), 0.5) + tr(-170, -210, teddyG(0, 0, 0.8), 1) + tr(180, -160, sneakerG(0, 0, 1.4, '#7cc8ff'), 1) + tr(230, -220, bagG('#ffd36b', '#fff', ''), 0.5);
  // the central hall with the dome
  g += R(-120, -380, 240, 380, 8, '#ffffff') + shadeT(-120, -380, 240, 380, 8);
  g += P('M-110 -380 A110 110 0 0 1 110 -380Z', glassC) + P('M-110 -380 A110 110 0 0 1 110 -380Z', GLASS);
  for (const a of [0.2, 0.4, 0.6, 0.8]) { const ang = Math.PI * (1 - a); g += Ln(0, -380, Math.cos(ang) * 110, -380 - Math.sin(ang) * 110, frame, 3); }
  g += S('M-96 -430 Q0 -470 96 -430', frame, 3) + S('M-64 -470 Q0 -488 64 -470', frame, 3) + P('M-110 -380 A110 110 0 0 1 110 -380', 'none', stroked('#ffffff', 6));
  g += R(-6, -520, 12, 34, 4, frame) + C(0, -524, 10, 'url(#g-gold)') + `<path d="M6 -520 Q30 -528 50 -516 Q30 -506 6 -506Z" fill="#ff7eb6"><animate attributeName="d" values="M6 -520 Q30 -528 50 -516 Q30 -506 6 -506Z;M6 -520 Q30 -510 50 -520 Q30 -500 6 -506Z;M6 -520 Q30 -528 50 -516 Q30 -506 6 -506Z" dur="1.6s" repeatCount="indefinite"/></path>`;
  g += snowCap('M-112 -382 A112 112 0 0 1 112 -382 L100 -380 Q60 -440 0 -446 Q-60 -440 -100 -380Z', s);
  g += R(-104, -360, 208, 60, 14, '#c99bff') + T(0, -316, 'Mall', 46, '#ffffff') + P(sparkleD(-80, -340, 10), '#ffe680') + P(sparkleD(82, -320, 8), '#ffe680');
  // tall glass entrance with a revolving door
  g += R(-96, -280, 192, 280, 6, frame) + R(-88, -272, 176, 272, 4, glassC) + R(-88, -272, 176, 272, 4, GLASS);
  for (let i = 1; i < 4; i++) g += Ln(-88 + i * 44, -272, -88 + i * 44, -130, '#ffffff', 2);
  g += Ln(-88, -130, 88, -130, frame, 4) + P('M-54 0 V-110 A54 20 0 0 1 54 -110 V0Z', '#dff2ff') + P('M-54 0 V-110 A54 20 0 0 1 54 -110 V0Z', GLASS);
  g += `<g><line x1="0" y1="-110" x2="0" y2="0" stroke="${frame}" stroke-width="4"/><line x1="-30" y1="-110" x2="-30" y2="0" stroke="${frame}" stroke-width="3"><animate attributeName="x1" values="-50;50;-50" dur="5s" repeatCount="indefinite"/><animate attributeName="x2" values="-50;50;-50" dur="5s" repeatCount="indefinite"/></line></g>`;
  g += R(-80, -4, 160, 10, 4, '#f2e6d8');
  // banners hanging from poles
  const bannerPic = (x: number, i: number) => s === 'winter' ? motif('snowflake', x, -340, 12) : s === 'fall' ? motif(i % 2 ? 'leaf' : 'pumpkin', x, -340, 12) : s === 'summer' ? motif(i % 2 ? 'sun' : 'icecream', x, -340, 12) : flowerG(x, -340, 11, '#fff');
  [-250, -170, 170, 250].forEach((x, i) => {
    const col = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5'][i];
    g += Ln(x - 22, -380, x + 22, -380, frame, 4) + sway(x, -380, 3, 3 + i * 0.3, P(`M${x - 20} -380 H${x + 20} V-310 L${x} -296 L${x - 20} -310Z`, col) + bannerPic(x, i));
    g += Ln(x, -380, x, -396, frame, 3) + C(x, -398, 4, 'url(#g-gold)');
  });
  // planters and a little fountain at the door
  for (const x of [-140, 140]) g += R(x - 22, -50, 44, 50, 8, '#ffffff') + (s === 'winter' ? P(`M${x - 22} -50 L${x} -110 L${x + 22} -50Z`, '#2f7a5a') + P(`M${x - 12} -80 L${x} -110 L${x + 12} -80Z`, '#fff') + P(starD(x, -112, 7), '#ffd24a') : C(x, -76, 28, s === 'fall' ? '#d98a3d' : '#5fc47c') + C(x - 8, -86, 8, '#fff', op(0.2)) + (s === 'fall' ? '' : flowerG(x + 10, -84, 6, '#ff7eb6')));
  if (s === 'fall') g += pumpkinF(-190, -14, 14) + pumpkinF(196, -12, 12);
  return g + bushT(-262, 0, 0.5, s) + bushT(262, 0, 0.5, s) + fallLeaves(-280, 560, s);
}

export const SHOPS_MORE: FurnDef[] = [...PRODUCE, ...GROCSHELF, ...FREEZERS, ...DAIRY, ...CHECKOUTS, ...CARTS, ...BASKETS, ...SCALES, ...FLOWERSTANDS, ...BREADRACKS, ...BAKERYCASES, ...SAMPLETABLES, ...AISLESIGNS, ...GROCERIES,
  ...DININGSETS, ...FAMILYTABLES, ...BOOTHS, ...DINERCOUNTERS, ...CHEFGRILLS, ...PIZZAOVENS, ...MENUBOARDS, ...HOSTSTANDS, ...DESSERTCASES, ...BOOSTERS, ...SHAKEBARS, ...TABLESETTINGS, ...DISHES,
  ...STOREFRONTS, ...ESCALATORS, ...MALLFOUNTAINS, ...KIOSKS, ...CLAWS, ...PHOTOBOOTHS, ...MALLBENCHES, ...MALLPALMS, ...KIDDIERIDES, ...DIRECTORIES, ...BALLOONSTANDS, ...SHOPBAGS];
/** Town-map building fronts: base centre at (0,0), drawn upward; h is the height for the name tag. */
export const SHOPS_FACADES: Record<string, { h: number; art: (s: Season) => string }> = {
  grocery: { h: 450, art: groceryFacade },
  restaurant: { h: 520, art: restaurantFacade },
  mall: { h: 540, art: mallFacade },
};
