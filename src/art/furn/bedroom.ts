// Bedroom and kids'-room catalog: beds of every kind, wardrobes, dressers, desks, lamps and toys, each
// drawn in many design collections (sweet, princess, modern, cottage, space, beach, ...). Floor items
// are drawn with their base centre at (0, 0) and grow upward; wall items and rugs are centred.
import {
  type FurnCat, type FurnDef, type FurnStyle, type Mount, FURN_STYLE_BY_ID,
  C, E, Ln, P, R, bowG, box, cloth, dark, f, flame, flowerG, glow, heartD, leg, light, motif, sparkleD, starD, stylePrice,
} from './kit';

// ---------------- local helpers ----------------
type Art = (c: string, on: boolean, s: FurnStyle) => string;
interface Design {
  st: string;
  name: string;
  art: Art;
  front?: Art;
  /** Per-design overrides (size, seats, surfaces, toggle, ...). */
  x?: Partial<FurnDef>;
}
type Base = Partial<Omit<FurnDef, 'art' | 'front'>> & { mount: Mount; w: number; h: number };

function fam(type: string, group: string, cat: FurnCat, base: Base, designs: Design[], price: (i: number) => number = (i) => stylePrice(i)): FurnDef[] {
  return designs.map((d, i) => {
    const s = FURN_STYLE_BY_ID[d.st];
    const def: FurnDef = {
      ...base, ...d.x, id: `f-${type}-${d.st}`, name: d.name, cat, group, style: d.st, price: d.x?.price ?? price(i), color: d.x?.color ?? s.main,
      art: (c, on) => d.art(c, on, s),
    };
    const fr = d.front;
    if (fr) def.front = (c, on) => fr(c, on, s);
    return def;
  });
}

const S = (d: string, c: string, w = 3, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (inner: string, tr = '') => (tr ? `<g transform="${tr}">${inner}</g>` : `<g>${inner}</g>`);
const shine = (x: number, y: number, w: number, h: number, o = 0.35) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', `opacity="${o}"`);
const knob = (x: number, y: number, r: number, c: string) => C(x, y, r, c) + C(x - r * 0.3, y - r * 0.35, r * 0.4, '#fff', 'opacity="0.6"');
const SPL = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
const rockA = (px: number, py: number, amp: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${f(-amp)} ${f(px)} ${f(py)};${f(amp)} ${f(px)} ${f(py)};${f(-amp)} ${f(px)} ${f(py)}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${SPL}/>`;
const bob = (inner: string, dy: number, dur: number, begin = 0) =>
  `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 ${f(dy)};0 0" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${SPL}/>${inner}</g>`;
const twinkle = (x: number, y: number, r: number, c: string, dur = 2, begin = 0) =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.25;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/></path>`;
const blink = (inner: string, dur: number, begin = 0) => `<g><animate attributeName="opacity" values="1;0.35;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/>${inner}</g>`;
/** Bumps along an edge from x1 to x2 at y; positive dep bulges downward. */
const scallop = (x1: number, x2: number, y: number, n: number, dep: number) => {
  let d = '';
  const st = (x2 - x1) / n;
  for (let i = 0; i < n; i++) d += ` Q${f(x1 + st * (i + 0.5))} ${f(y + dep * 2)} ${f(x1 + st * (i + 1))} ${f(y)}`;
  return d;
};
/** A ruffled bed skirt hanging from y0 down to y1. */
const skirt = (x1: number, x2: number, y0: number, y1: number, c: string, n = 9) =>
  cloth(`M${f(x1)} ${f(y0)} H${f(x2)} V${f(y1)}${scallop(x2, x1, y1, n, 5)}Z`, c, 'none', 'y') +
  Array.from({ length: n - 1 }, (_, i) => S(`M${f(x1 + ((x2 - x1) / n) * (i + 1))} ${f(y0 + 2)} V${f(y1 - 2)}`, dark(c, 0.1), 1.5, 'opacity="0.6"')).join('');
const mattress = (x1: number, x2: number, y: number, c = '#ffffff', h = 50) =>
  box(x1, y, x2 - x1, h, 18, c, 'none', 'y') + R(x1 + 16, y + 6, x2 - x1 - 32, 5, 2.5, '#fff', 'opacity="0.55"');
const pillow = (x: number, y: number, c = '#ffffff', rx = 46, ry = 24, pat = 'none') =>
  cloth(`M${f(x - rx)} ${f(y)} Q${f(x - rx)} ${f(y - ry)} ${f(x)} ${f(y - ry)} Q${f(x + rx)} ${f(y - ry)} ${f(x + rx)} ${f(y)} Q${f(x + rx)} ${f(y + ry)} ${f(x)} ${f(y + ry)} Q${f(x - rx)} ${f(y + ry)} ${f(x - rx)} ${f(y)}Z`, c, pat, 'y') +
  S(`M${f(x - rx * 0.75)} ${f(y - 4)} Q${f(x)} ${f(y + ry * 0.65)} ${f(x + rx * 0.75)} ${f(y - 4)}`, dark(c, 0.12), 2);
/** The blanket drawn in front of a sleeping doll whose hip is at (hip, mt). */
function blanket(hip: number, mt: number, c: string, pat = 'none', fold = '#ffffff', x2o?: number, tall = 0): string {
  const x1 = hip - 148;
  const x2 = x2o ?? hip + 72;
  const t = mt - 14 - tall;
  const b = mt + 62;
  const m = (x1 + x2) / 2;
  const top = `M${f(x1)} ${f(t)} Q${f(m)} ${f(t - 8)} ${f(x2)} ${f(t + 2)}`;
  return cloth(`${top} L${f(x2 + 4)} ${f(b)} Q${f(m)} ${f(b + 10)} ${f(x1 - 4)} ${f(b - 2)}Z`, c, pat, 'y') +
    S(`M${f(x1 + 6)} ${f(b - 10)} Q${f(m)} ${f(b)} ${f(x2 - 2)} ${f(b - 8)}`, '#fff', 2, 'stroke-dasharray="7 6" opacity="0.7"') +
    P(`${top} L${f(x2)} ${f(t + 20)} Q${f(m)} ${f(t + 12)} ${f(x1 - 2)} ${f(t + 20)}Z`, fold, 'opacity="0.92"');
}
/** A sleeping seat matching the original bed: head to the left, hip near the right end. */
const sleep = (x: number, y: number) => [{ x, y, pose: 'sleep' as const }];
const sit = (x: number, y: number) => ({ x, y, pose: 'sit' as const });
const RB = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#b48cff'];
const TOYC = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b'];

/** A row of books standing on a shelf at yb, from x1 to x2. */
function books(x1: number, x2: number, yb: number, maxH: number, seed: number, cols = TOYC): string {
  let s = '';
  let x = x1;
  for (let i = 0; x < x2 - 10; i++) {
    const w = Math.min(x2 - x, 10 + ((i * 7 + seed * 5) % 9));
    const h = maxH * (0.7 + (((i * 13 + seed * 3) % 7) / 7) * 0.3);
    const col = cols[(i + seed) % cols.length];
    if ((i + seed) % 6 === 5 && x + h < x2) {
      // one lying on its side
      s += R(x, yb - w, h, w, 2, col) + R(x + 3, yb - w + 2, h - 6, 2, 1, '#fff', 'opacity="0.5"');
      x += h + 2;
      continue;
    }
    s += R(x, yb - h, w, h, 2, col) + R(x + 2, yb - h + 5, w - 4, 2.5, 1, '#fff', 'opacity="0.55"') + R(x + 2, yb - 9, w - 4, 2.5, 1, '#fff', 'opacity="0.4"');
    x += w + 1.5;
  }
  return s;
}

// little toys used on shelves, in chests and in nets
const mini = {
  teddy: (x: number, y: number, s = 1, c = '#c98a5a') => G(C(-11, -36, 6, c) + C(11, -36, 6, c) + C(-11, -36, 3, '#e8c0a0') + C(11, -36, 3, '#e8c0a0') + E(0, -12, 15, 13, c) + C(0, -30, 13, c) + E(0, -26, 6, 4.5, '#e8c0a0') + C(-4.5, -32, 1.8, '#2d2a3a') + C(4.5, -32, 1.8, '#2d2a3a') + C(0, -27.5, 1.6, '#4a2e22') + C(-12, -4, 5, dark(c, 0.15)) + C(12, -4, 5, dark(c, 0.15)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  bunny: (x: number, y: number, s = 1, c = '#ffffff') => G(E(-6, -46, 4, 12, c) + E(6, -46, 4, 12, c) + E(-6, -45, 2, 8, '#ffc7dc') + E(6, -45, 2, 8, '#ffc7dc') + E(0, -12, 14, 12, c) + C(0, -28, 12, c) + C(-4, -29, 1.7, '#2d2a3a') + C(4, -29, 1.7, '#2d2a3a') + E(-7, -24, 2.5, 1.5, '#ff9ec7') + E(7, -24, 2.5, 1.5, '#ff9ec7') + E(0, -12, 14, 12, 'url(#g-shadeX)'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  ball: (x: number, y: number, r: number, c = '#ff7eb6') => C(x, y - r, r, c) + S(`M${f(x - r)} ${f(y - r)} Q${f(x)} ${f(y - r * 0.45)} ${f(x + r)} ${f(y - r)}`, '#fff', r * 0.22) + C(x - r * 0.35, y - r * 1.4, r * 0.22, '#fff', 'opacity="0.5"'),
  blocks: (x: number, y: number, s = 1) => G(box(-20, -18, 18, 18, 3, '#7cc8ff') + box(2, -18, 18, 18, 3, '#ffd36b') + box(-9, -36, 18, 18, 3, '#ff7eb6') + P(starD(-11, -9, 5), '#fff', 'opacity="0.8"') + P(heartD(11, -13, 5), '#fff', 'opacity="0.8"') + C(0, -27, 3.5, '#fff', 'opacity="0.8"'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  duck: (x: number, y: number, s = 1) => G(E(0, -10, 15, 10, '#ffd84a') + C(7, -23, 8, '#ffd84a') + P('M13 -23 L21 -21 L13 -19Z', '#ff8a3d') + C(9, -25, 1.6, '#2d2a3a') + S('M-11 -12 Q-5 -18 1 -11', '#e8c04a', 2), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  car: (x: number, y: number, s = 1, c = '#ff7a6b') => G(box(-22, -18, 44, 12, 5, c) + P('M-12 -18 Q-10 -28 0 -28 L6 -28 Q12 -28 14 -18Z', c) + P('M-8 -18 Q-7 -25 -1 -25 L4 -25 Q9 -25 10 -18Z', '#cfe9ff') + C(-12, -5, 5, '#4a4a5e') + C(12, -5, 5, '#4a4a5e') + C(-12, -5, 2, '#c9cfdd') + C(12, -5, 2, '#c9cfdd'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  dino: (x: number, y: number, s = 1, c = '#5fd3b5') => G(P('M-20 -4 Q-24 -20 -8 -22 Q0 -36 12 -34 Q22 -32 20 -24 Q14 -22 10 -20 Q12 -8 6 -4Z', c) + P('M-20 -4 Q-30 -6 -32 -14 Q-24 -10 -18 -12Z', c) + C(13, -29, 1.8, '#2d2a3a') + P('M-10 -22 L-7 -28 L-4 -23 L-1 -30 L2 -24', dark(c, 0.15)) + R(-14, -6, 6, 6, 2, dark(c, 0.15)) + R(0, -6, 6, 6, 2, dark(c, 0.15)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  doll: (x: number, y: number, s = 1, c = '#c99bff') => G(P('M-10 0 L-7 -20 L7 -20 L10 0Z', c) + C(0, -27, 9, '#ffe3d3') + P('M-10 -28 Q-10 -40 0 -40 Q10 -40 10 -28 Q6 -34 0 -33 Q-6 -34 -10 -28Z', '#8a5a34') + C(-3, -27, 1.3, '#2d2a3a') + C(3, -27, 1.3, '#2d2a3a') + E(-5, -23, 1.8, 1, '#ff9ec7') + E(5, -23, 1.8, 1, '#ff9ec7'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  robot: (x: number, y: number, s = 1, c = '#9fd6ff') => G(box(-11, -18, 22, 18, 4, c) + box(-10, -36, 20, 16, 5, light(c, 0.2)) + C(-4, -28, 2.6, '#2d2a3a') + C(4, -28, 2.6, '#2d2a3a') + Ln(0, -36, 0, -42, '#9aa3b5', 2) + C(0, -43, 2.5, '#ff7eb6') + R(-5, -12, 10, 3, 1.5, '#ffd36b'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  star: (x: number, y: number, s = 1, c = '#ffd36b') => G(P(starD(0, -14, 15, 0.5), c) + C(-3.5, -15, 1.5, '#2d2a3a') + C(3.5, -15, 1.5, '#2d2a3a') + S('M-3 -10 Q0 -8 3 -10', '#2d2a3a', 1.2), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  fish: (x: number, y: number, s = 1, c = '#ffab5e') => G(E(0, -12, 16, 11, c) + P('M14 -12 L26 -22 L26 -2Z', c) + C(-7, -14, 2, '#2d2a3a') + S('M-2 -18 Q2 -12 -2 -6', dark(c, 0.15), 1.5), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  starfish: (x: number, y: number, s = 1, c = '#ff9a6b') => G(P(starD(0, -14, 16, 0.5), c, 'stroke-linejoin="round"') + C(-3, -15, 1.4, '#2d2a3a') + C(3, -15, 1.4, '#2d2a3a') + C(-5, -9, 1, '#fff') + C(5, -9, 1, '#fff'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
};
/** A sun with a face, for rainbow and boho pieces. */
const sunFace = (x: number, y: number, r: number, c: string) => {
  let s = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    s += Ln(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15, x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45, dark(c, 0.05), r * 0.16);
  }
  return s + C(x, y, r, c) + C(x, y, r, 'url(#g-face)', 'opacity="0.35"') + C(x - r * 0.32, y - r * 0.1, r * 0.09, '#2d2a3a') + C(x + r * 0.32, y - r * 0.1, r * 0.09, '#2d2a3a') +
    S(`M${f(x - r * 0.3)} ${f(y + r * 0.22)} Q${f(x)} ${f(y + r * 0.5)} ${f(x + r * 0.3)} ${f(y + r * 0.22)}`, '#2d2a3a', r * 0.07) + E(x - r * 0.55, y + r * 0.2, r * 0.13, r * 0.08, '#ff8fb0') + E(x + r * 0.55, y + r * 0.2, r * 0.13, r * 0.08, '#ff8fb0');
};
const cloud = (x: number, y: number, s: number, c = '#ffffff') =>
  C(x - 18 * s, y, 15 * s, c) + C(x, y - 9 * s, 19 * s, c) + C(x + 19 * s, y - 1 * s, 14 * s, c) + R(x - 32 * s, y, 64 * s, 14 * s, 7 * s, c) + C(x - 4 * s, y - 14 * s, 6 * s, '#fff', 'opacity="0.6"');
/** Tufting buttons on padded headboards. */
const tufts = (x1: number, x2: number, y1: number, y2: number, step: number, c: string) => {
  let s = '';
  let row = 0;
  for (let y = y1; y <= y2; y += step, row++) for (let x = x1 + (row % 2 ? step / 2 : 0); x <= x2; x += step) s += C(x, y, 3, dark(c, 0.18)) + C(x - 1, y - 1, 1.2, '#fff', 'opacity="0.5"');
  return s;
};
/** A soft bulb that glows when on. */
const bulb = (x: number, y: number, r: number, on: boolean, offC = '#fff6e0') => (on ? C(x, y, r * 2.4, '#fff6c8', 'opacity="0.35"') : '') + C(x, y, r, on ? '#fff6c8' : offC, `stroke="${on ? '#ffd24a' : '#e8d8c0'}" stroke-width="1.5"`);
/** Wood grain rings on a log end. */
const logEnd = (x: number, y: number, rx: number, ry: number, wood: string) =>
  E(x, y, rx, ry, light(wood, 0.45)) + E(x, y, rx * 0.68, ry * 0.68, 'none', `stroke="${light(wood, 0.15)}" stroke-width="1.6"`) + E(x, y, rx * 0.35, ry * 0.35, 'none', `stroke="${light(wood, 0.15)}" stroke-width="1.6"`) + E(x, y, rx, ry, 'none', `stroke="${dark(wood, 0.15)}" stroke-width="2"`);
const bark = (x: number, y: number, w: number, h: number, wood: string, seed = 0) => {
  let s = box(x, y, w, h, Math.min(w, h) / 2.4, wood);
  for (let i = 0; i < 4; i++) {
    const yy = y + 12 + ((i * 37 + seed * 17) % Math.max(10, h - 24));
    const xx = x + w * (0.2 + ((i * 3 + seed) % 5) * 0.14);
    s += S(`M${f(xx)} ${f(yy)} q${f(w * 0.08)} 8 0 ${f(Math.min(26, h * 0.3))}`, dark(wood, 0.2), 2, 'opacity="0.7"');
  }
  return s;
};
const leaf = (x: number, y: number, r: number, c: string, rot = 0) =>
  `<path d="M0 0 Q${f(r * 0.6)} ${f(-r * 0.7)} 0 ${f(-r * 1.6)} Q${f(-r * 0.6)} ${f(-r * 0.7)} 0 0Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>` +
  `<path d="M0 -2 L0 ${f(-r * 1.3)}" stroke="${dark(c, 0.2)}" stroke-width="1.4" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>`;
const leafy = (x: number, y: number, r: number, c: string) =>
  C(x - r * 0.7, y + r * 0.15, r * 0.62, dark(c, 0.08)) + C(x + r * 0.7, y + r * 0.15, r * 0.62, dark(c, 0.08)) + C(x, y - r * 0.25, r * 0.78, c) + C(x - r * 0.35, y + r * 0.3, r * 0.55, c) + C(x + r * 0.4, y + r * 0.3, r * 0.55, c) + C(x - r * 0.25, y - r * 0.5, r * 0.25, '#fff', 'opacity="0.3"');
const mushroom = (x: number, y: number, s: number, cap: string) =>
  G(P('M-7 0 Q-9 -12 -6 -16 L6 -16 Q9 -12 7 0Z', '#fff3e6') + P('M-20 -14 Q-20 -36 0 -36 Q20 -36 20 -14Z', cap) + C(-9, -24, 3.5, '#fff') + C(6, -29, 3, '#fff') + C(11, -19, 2.4, '#fff') + P('M-20 -14 Q0 -10 20 -14', 'none', `stroke="${dark(cap, 0.2)}" stroke-width="2"`), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
/** A rocket nose/hull porthole. */
const porthole = (x: number, y: number, r: number, rim: string, glass = '#9fd6ff') => C(x, y, r + 4, rim) + C(x, y, r, glass) + C(x, y, r, 'url(#g-glass)') + C(x - r * 0.35, y - r * 0.35, r * 0.25, '#fff', 'opacity="0.7"');
/** Curvy gold cabriole leg ending at the floor. */
const cabriole = (x: number, top: number, c: string, dir = 1) =>
  P(`M${f(x - 6 * dir)} ${f(top)} Q${f(x + 10 * dir)} ${f(top * 0.5)} ${f(x - 2 * dir)} ${f(-6)} L${f(x - 8 * dir)} 0 L${f(x + 6 * dir)} 0 L${f(x + 4 * dir)} -6 Q${f(x + 18 * dir)} ${f(top * 0.5)} ${f(x + 6 * dir)} ${f(top)}Z`, c);
const hairpin = (x: number, top: number, c: string, spread = 10) => S(`M${f(x - spread / 2)} ${f(top)} L${f(x - 2)} 0 M${f(x + spread / 2)} ${f(top)} L${f(x + 2)} 0`, c, 4);
const splay = (x: number, top: number, c: string, dir = 1) => P(`M${f(x - 5)} ${f(top)} L${f(x + 5)} ${f(top)} L${f(x + 4 + 10 * dir)} 0 L${f(x - 3 + 10 * dir)} 0Z`, c);

// ---------------- single beds ----------------
const MT = -124;
const HIP = 100;
const BEDS = fam('bed', 'Beds', 'bedroom', { mount: 'floor', w: 390, h: 260, seats: sleep(HIP, MT + 6) }, [
  {
    st: 'sweet', name: 'Sweetheart Bed',
    art: (c, _on, s) => {
      let o = box(-198, -214, 34, 214, 17, c) + P(heartD(-128, -248, 84), dark(c, 0.12)) + cloth(heartD(-128, -244, 80), c, 'none', 'x');
      o += S(heartD(-128, -230, 60), light(c, 0.5), 3, 'stroke-dasharray="2 7"') + tufts(-166, -90, -208, -182, 26, c);
      o += box(162, -160, 34, 160, 17, c) + C(179, -164, 12, light(c, 0.4)) + G(bowG(0, 0, 0.9, '#ff7eb6'), 'translate(179 -150)');
      o += skirt(-178, 178, -64, -22, s.soft, 12) + box(-182, -88, 364, 30, 10, dark(c, 0.1)) + shine(-170, -84, 300, 5);
      o += leg(-168, -24, 24, s.metal, 12) + leg(168, -24, 24, s.metal, 12);
      o += mattress(-168, 170, MT) + pillow(-110, -130, s.soft) + P(heartD(-60, -158, 26), c) + P(heartD(-66, -152, 8), '#fff', 'opacity="0.5"');
      return o;
    },
    front: (c) => blanket(HIP, MT, light(c, 0.35), 'hearts', '#ffffff'),
  },
  {
    st: 'princess', name: 'Royal Crown Bed', x: { h: 340 },
    art: (c, _on, s) => {
      const arch = (x1: number, x2: number, yt: number, yb: number) => {
        const m = (x1 + x2) / 2;
        return `M${f(x1)} ${f(yb)} V${f(yt + 50)} C${f(x1)} ${f(yt + 6)} ${f(m - 30)} ${f(yt + 22)} ${f(m)} ${f(yt)} C${f(m + 30)} ${f(yt + 22)} ${f(x2)} ${f(yt + 6)} ${f(x2)} ${f(yt + 50)} V${f(yb)}Z`;
      };
      let o = P(arch(-206, -54, -300, -80), s.trim) + cloth(arch(-196, -64, -288, -80), s.wood, 'none', 'x') + cloth(arch(-184, -76, -270, -100), c, 'none', 'x');
      o += tufts(-166, -92, -232, -120, 26, c) + motif('crown', -130, -316, 26);
      o += P(arch(150, 204, -200, -60), s.trim) + cloth(arch(156, 198, -192, -60), s.wood) + C(177, -200, 8, 'url(#g-gold)') + P(starD(177, -150, 9), 'url(#g-gold)');
      o += skirt(-180, 180, -64, -20, c, 12) + R(-180, -30, 360, 4, 2, s.trim, 'opacity="0.8"');
      o += box(-186, -90, 372, 30, 10, s.wood) + R(-186, -66, 372, 4, 2, s.trim);
      o += cabriole(-170, -24, 'url(#g-gold)', -1) + cabriole(170, -24, 'url(#g-gold)', 1);
      o += mattress(-170, 170, MT) + pillow(-116, -132, '#fff') + P(`M-160 -128${scallop(-160, -72, -112, 6, 3)}`, 'none', `stroke="${c}" stroke-width="3"`) + pillow(-64, -140, s.soft, 30, 18, 'hearts');
      return o;
    },
    front: (c, _on, s) => blanket(HIP, MT, light(c, 0.3), 'hearts', s.soft) + S(`M-48 -118 Q60 -126 172 -116`, s.trim, 3),
  },
  {
    st: 'modern', name: 'Low Platform Bed',
    art: (c, _on, s) => {
      let o = G(box(-200, -216, 30, 200, 10, s.soft) + R(-192, -206, 3, 180, 1.5, '#fff', 'opacity="0.35"'), 'rotate(-5 -185 -16)');
      o += box(-190, -78, 380, 36, 6, s.wood) + R(-184, -50, 368, 4, 2, dark(s.wood, 0.2), 'opacity="0.5"') + R(-180, -74, 360, 5, 2.5, '#fff', 'opacity="0.3"');
      o += hairpin(-160, -42, s.metal, 14) + hairpin(160, -42, s.metal, 14);
      o += mattress(-176, 178, -130, '#fafbff', 54) + pillow(-112, -136, c, 48, 24) + R(-82, -156, 46, 30, 12, s.accent) + R(-78, -150, 38, 4, 2, '#fff', 'opacity="0.25"');
      return o;
    },
    front: (c, _on, s) => blanket(HIP, -130, light(c, 0.15), 'none', '#ffffff') + box(120, -140, 56, 82, 10, s.soft, 'none', 'y') + S('M124 -128 H172', '#fff', 2, 'opacity="0.5"'),
    x: { h: 230, seats: sleep(HIP, -124) },
  },
  {
    st: 'cottage', name: 'Spindle Cottage Bed', x: { h: 270 },
    art: (c, _on, s) => {
      let o = '';
      const spindles = (x1: number, x2: number, top: number, bot: number) => {
        let r = '';
        for (let x = x1 + 12; x < x2 - 6; x += 12) r += R(x - 2.5, top, 5, bot - top, 2.5, light(c, 0.15));
        return r;
      };
      o += spindles(-196, -146, -220, -100) + P(`M-202 -214 Q-171 -246 -140 -214 L-140 -202 Q-171 -232 -202 -202Z`, c);
      o += box(-206, -240, 16, 240, 8, c) + box(-150, -240, 16, 240, 8, c) + knob(-198, -248, 10, c) + knob(-142, -248, 10, c);
      o += spindles(144, 196, -160, -90) + R(144, -166, 52, 12, 6, c) + box(140, -180, 16, 180, 8, c) + box(186, -180, 16, 180, 8, c) + knob(148, -186, 9, c) + knob(194, -186, 9, c);
      o += box(-190, -92, 380, 34, 8, c) + motif('daisy', -60, -75, 10) + motif('daisy', 0, -75, 10) + motif('daisy', 60, -75, 10);
      o += leg(-196, -10, 10, dark(c, 0.3), 14) + leg(194, -10, 10, dark(c, 0.3), 14);
      o += mattress(-150, 150, MT, s.soft) + pillow(-96, -130, '#fff') + P(`M-140 -114${scallop(-140, -52, -112, 5, 3)}`, 'none', `stroke="${s.soft}" stroke-width="3"`);
      return o;
    },
    front: (c, _on, s) => {
      const x1 = HIP - 148, x2 = HIP + 52;
      let o = blanket(HIP, MT, s.soft, 'none', '#ffffff', x2);
      const cols = [light(c, 0.2), '#ffd9e8', '#fff3b0', light(c, 0.45)];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) {
        const w = (x2 - x1 - 8) / 6;
        const x = x1 + 4 + i * w;
        const y = MT + 8 + j * 26;
        o += R(x + 1, y, w - 2, 24, 3, cols[(i + j * 2) % 4]) + R(x + 1, y, w - 2, 24, 3, 'url(#p-flowers)', 'opacity="0.8"');
      }
      return o + skirt(x1 - 4, x2 + 4, MT + 60, MT + 74, '#ffffff', 10);
    },
  },
  {
    st: 'rainbow', name: 'Rainbow Cloud Bed', x: { w: 420, h: 260 },
    art: (c, _on, s) => {
      let o = '';
      RB.slice(0, 5).forEach((col, i) => (o += S(`M${f(-215 + i * 15)} -96 A${f(90 - i * 15)} ${f(90 - i * 15)} 0 0 1 ${f(-35 - i * 15)} -96`, col, 15)));
      o += cloud(-200, -98, 1.1) + cloud(-40, -98, 0.9);
      o += box(158, -150, 36, 150, 18, c) + sunFace(176, -178, 26, c);
      o += box(-186, -88, 372, 36, 12, c, 'stripes') + leg(-170, -54, 54, s.accent, 14) + leg(170, -54, 54, s.accent, 14);
      o += mattress(-166, 160, MT) + pillow(-108, -130, '#fff') + cloud(-56, -136, 0.55, s.soft);
      return o;
    },
    front: (c) => {
      const x1 = HIP - 148, x2 = HIP + 72, w = (x2 - x1) / 6;
      let o = blanket(HIP, MT, '#ffffff', 'none', '#ffffff');
      RB.forEach((col, i) => (o += R(x1 + i * w, MT + 6, w + 0.5, 48, i === 0 ? 4 : 0, col, 'opacity="0.85"')));
      return o + P(`M${x1} ${MT - 14} Q${f((x1 + x2) / 2)} ${MT - 22} ${x2} ${MT - 12} L${x2} ${MT + 6} Q${f((x1 + x2) / 2)} ${MT - 2} ${x1 - 2} ${MT + 6}Z`, light(c, 0.5)) + S(`M${x1 + 6} ${MT + 50} H${x2 - 4}`, '#fff', 2, 'stroke-dasharray="7 6"');
    },
  },
  {
    st: 'space', name: 'Rocket Bed', x: { w: 440, h: 270, seats: sleep(90, -124) },
    art: (c, _on, s) => {
      let o = P('M-150 -84 Q-168 -170 -215 -262 L-222 -262 L-222 -84Z', s.soft) + P('M-170 -100 Q-186 -170 -214 -240', 'none', `stroke="${light(s.soft, 0.3)}" stroke-width="5" stroke-linecap="round"`);
      o += twinkle(-198, -200, 9, s.accent, 2.2) + twinkle(-178, -150, 6, '#fff', 1.7, 0.6);
      o += P('M-196 -30 L-222 2 L-150 2 L-140 -30Z', s.soft) + P('M150 -30 L176 2 L120 2 L110 -30Z', s.soft);
      o += P('M-224 -78 L-200 -82 L-200 -30 L-224 -34Z', s.metal) + G(`${P('M-226 -72 Q-252 -56 -226 -40 Q-238 -56 -226 -72Z', '#ffb35e')}${P('M-226 -66 Q-240 -56 -226 -46Z', '#ffe680')}`);
      o += cloth('M-200 -86 L150 -86 Q218 -76 224 -56 Q218 -36 150 -26 L-200 -26Z', c, 'none', 'y') + P('M170 -82 Q218 -74 224 -56 Q218 -38 170 -30Z', s.accent);
      o += R(-200, -86, 350, 8, 4, '#fff', 'opacity="0.25"') + R(-150, -86, 10, 60, 2, s.metal) + R(118, -86, 10, 60, 2, s.metal);
      o += porthole(-90, -56, 12, s.metal) + porthole(-30, -56, 12, s.metal) + porthole(30, -56, 12, s.metal) + motif('planet', 82, -56, 15);
      o += mattress(-196, 160, -130, '#f6f4ff') + pillow(-140, -136, s.accent, 44, 22, 'stars');
      return o;
    },
    front: (_c, _on, s) => blanket(90, -130, s.soft, 'stars', s.accent),
  },
  {
    st: 'beach', name: 'Sailboat Bed', x: { w: 430, h: 390 },
    art: (c, _on, s) => {
      let o = R(-152, -380, 9, 290, 4, s.wood) + P('M-140 -360 L-140 -150 L-20 -150Z', '#ffffff') + P('M-140 -360 L-140 -150 L-20 -150Z', 'url(#g-shadeX)');
      o += P('M-140 -290 L-140 -270 L-74 -205 L-54 -205Z', light(c, 0.1), 'opacity="0.9"') + P('M-140 -240 L-140 -220 L-108 -190 L-88 -190Z', '#ff8a7a', 'opacity="0.8"');
      o += P('M-148 -380 L-110 -366 L-148 -352Z', '#ff8a7a') + Ln(-148, -372, 210, -116, '#c9b48a', 1.5);
      o += box(-120, -22, 60, 22, 6, s.wood) + box(60, -22, 60, 22, 6, s.wood);
      o += mattress(-176, 170, MT, '#fff');
      o += cloth('M-210 -100 L215 -120 Q200 -44 150 -18 L-170 -18 Q-200 -40 -210 -100Z', c, 'none', 'y');
      o += P('M-206 -82 L208 -100 L204 -86 L-202 -68Z', '#ffffff') + P('M-196 -54 L196 -66 L190 -56 L-190 -44Z', '#ff8a7a', 'opacity="0.85"');
      o += porthole(-110, -40, 9, '#ffffff') + porthole(-50, -40, 9, '#ffffff') + porthole(10, -40, 9, '#ffffff');
      o += C(110, -42, 18, '#fff') + C(110, -42, 18, 'none', 'stroke="#ff8a7a" stroke-width="7" stroke-dasharray="7 7"') + C(110, -42, 9, c);
      o += pillow(-112, -134, '#fff', 44, 22) + mini.starfish(-60, -128, 0.8);
      return o;
    },
    front: (c) => blanket(HIP, MT, light(c, 0.45), 'stripes', '#ffffff', 190) + P(`M-210 -100 L215 -120 L214 -112 L-208 -92Z`, light(c, 0.3)),
  },
  {
    st: 'candy', name: 'Candy Shop Bed', x: { h: 320 },
    art: (c, _on, s) => {
      let o = R(-188, -250, 12, 250, 6, '#fff') + C(-182, -278, 38, c) + S('M-182 -278 m-26 0 a26 26 0 1 1 26 26 a18 18 0 1 1 -18 -18 a10 10 0 1 1 10 10', '#fff', 6) + C(-194, -292, 7, '#fff', 'opacity="0.5"');
      o += box(-170, -210, 74, 210, 30, s.accent, 'dots') + P(`M-170 -176 Q-170 -210 -133 -210 Q-96 -210 -96 -176 L-96 -168 Q-104 -150 -110 -168 Q-118 -142 -128 -168 Q-140 -152 -148 -168 Q-160 -146 -170 -168Z`, '#ffffff');
      o += P('M150 -112 L204 -112 L196 -60 L158 -60Z', s.accent) + S('M164 -110 L166 -62 M177 -110 L177 -62 M190 -110 L188 -62', dark(s.accent, 0.15), 2);
      o += C(162, -122, 16, c) + C(192, -122, 16, c) + C(177, -138, 18, c) + C(177, -158, 7, '#e8384f') + C(174, -161, 2, '#fff');
      o += box(-186, -90, 372, 34, 12, c) + P(`M-182 -88 H182 V-78${scallop(182, -182, -78, 14, 4)}Z`, '#ffffff');
      for (let i = 0; i < 16; i++) o += R(-170 + i * 22, -66 + (i % 3) * 4, 8, 3, 1.5, TOYC[i % 6], `transform="rotate(${(i * 47) % 180} ${-166 + i * 22} ${-64 + (i % 3) * 4})"`);
      o += R(-178, -56, 12, 56, 6, '#fff') + R(166, -56, 12, 56, 6, '#fff') + R(-178, -40, 12, 6, 0, s.trim) + R(166, -40, 12, 6, 0, s.trim) + R(-178, -20, 12, 6, 0, s.trim) + R(166, -20, 12, 6, 0, s.trim);
      o += mattress(-96, 150, MT) + mattress(-150, -60, MT) + pillow(-104, -130, s.soft) + C(-52, -150, 13, '#ff7eb6') + S('M-62 -150 H-42', '#fff', 3);
      return o;
    },
    front: (c, _on, s) => blanket(HIP, MT, s.soft, 'none', light(c, 0.2)) + [[-30, -100], [10, -86], [50, -104], [90, -90], [130, -100], [-10, -74], [70, -72]].map(([x, y], i) => C(x, y, 5, TOYC[i % 6])).join(''),
  },
  {
    st: 'woodland', name: 'Log Cabin Bed', x: { h: 290 },
    art: (c, _on, s) => {
      let o = bark(-210, -250, 26, 250, s.wood, 1) + bark(-186, -230, 26, 230, dark(s.wood, 0.05), 2) + bark(-162, -210, 26, 210, s.wood, 3);
      o += logEnd(-197, -250, 13, 6, s.wood) + logEnd(-173, -230, 13, 6, s.wood) + logEnd(-149, -210, 13, 6, s.wood);
      o += leaf(-200, -252, 16, c, -30) + leaf(-196, -252, 18, light(c, 0.15), 20) + leaf(-176, -232, 14, c, 40);
      o += bark(158, -170, 24, 170, s.wood, 4) + bark(180, -150, 24, 150, dark(s.wood, 0.05), 5) + logEnd(170, -170, 12, 5.5, s.wood) + logEnd(192, -150, 12, 5.5, s.wood) + mushroom(150, 0, 0.9, s.accent);
      o += box(-170, -92, 344, 34, 17, s.wood) + logEnd(170, -75, 9, 16, s.wood) + S('M-150 -80 H-40 M10 -70 H120', dark(s.wood, 0.2), 2, 'opacity="0.6"');
      o += mattress(-158, 160, MT, s.soft) + pillow(-104, -130, '#fff') + mini.teddy(-50, -120, 0.75);
      return o;
    },
    front: (c, _on, s) => blanket(HIP, MT, c, 'check', s.soft) + leaf(40, -112, 9, '#ffab5e', -60),
  },
  {
    st: 'boho', name: 'Rattan Fan Bed', x: { h: 270 },
    art: (c, _on, s) => {
      const cx = -100, cy = -112, r = 104;
      let o = P(`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`, dark(c, 0.18)) + cloth(`M${cx - r + 8} ${cy} A${r - 8} ${r - 8} 0 0 1 ${cx + r - 8} ${cy}Z`, c);
      for (let i = 1; i < 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        o += Ln(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, cx + Math.cos(a) * (r - 10), cy + Math.sin(a) * (r - 10), dark(c, 0.2), 2.5);
      }
      for (const rr of [44, 66, 88]) o += S(`M${cx - rr} ${cy} A${rr} ${rr} 0 0 1 ${cx + rr} ${cy}`, dark(c, 0.15), 2, 'stroke-dasharray="5 4"');
      o += sunFace(cx, cy - 4, 16, '#ffd36b');
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + ((i + 0.5) / 9) * Math.PI;
        const x = cx + Math.cos(a) * (r + 2), y = cy + Math.sin(a) * (r + 2);
        o += Ln(x, y, x, y + 14, s.accent, 2) + C(x, y + 17, 5, s.accent);
      }
      o += box(-190, -88, 380, 30, 8, s.wood) + S('M-180 -73 H180', dark(s.wood, 0.2), 1.5, 'stroke-dasharray="3 5"') + leg(-176, -60, 60, dark(s.wood, 0.2), 12) + leg(176, -60, 60, dark(s.wood, 0.2), 12);
      o += box(160, -150, 26, 150, 12, s.wood) + C(173, -156, 9, c);
      o += mattress(-172, 162, MT, s.soft) + pillow(-112, -130, '#fff') + pillow(-60, -140, s.accent, 28, 18) + S('M-84 -140 H-36', '#fff', 2, 'stroke-dasharray="3 3"');
      return o;
    },
    front: (_c, _on, s) => {
      let o = blanket(HIP, MT, s.accent, 'none', s.soft);
      for (let i = 0; i < 6; i++) o += P(`M${-40 + i * 36} ${-104} l12 -10 l12 10 l-12 10Z`, '#fff', 'opacity="0.55"');
      for (let x = -50; x <= 172; x += 9) o += Ln(x, -62 + (x - 60) * (x - 60) * -0.0002, x, -50, s.accent, 3);
      return o;
    },
  },
]);

// ---------------- big beds (two sleepers) ----------------
const BMT = -134;
const BHIP = 125;
const bigSeats = [{ x: BHIP, y: BMT + 6, pose: 'sleep' as const }, { x: BHIP + 10, y: BMT - 34, pose: 'sleep' as const }];
const bigBlanket = (c: string, pat: string, fold: string) => blanket(BHIP, BMT, c, pat, fold, 214, 38);
const bigBase = (rail: string, pil: string, pil2: string, legC: string, mat = '#ffffff') =>
  box(-222, -96, 444, 36, 10, rail) + shine(-210, -92, 400, 5) + leg(-206, -60, 60, legC, 14) + leg(206, -60, 60, legC, 14) +
  mattress(-206, 210, BMT, mat, 54) + pillow(-150, -180, pil2, 50, 24) + pillow(-136, -142, pil, 50, 25);
const BIGBEDS = fam('bigbed', 'Big Beds', 'bedroom', { mount: 'floor', w: 470, h: 300, seats: bigSeats }, [
  {
    st: 'sweet', name: 'Tufted Wingback Bed',
    art: (c, _on, s) => {
      let o = P('M-236 -60 V-250 Q-236 -300 -190 -300 L-130 -300 Q-104 -300 -104 -270 L-110 -60Z', dark(c, 0.1)) + cloth('M-228 -60 V-246 Q-228 -290 -188 -290 L-132 -290 Q-114 -290 -114 -268 L-120 -60Z', c);
      o += tufts(-210, -130, -270, -120, 24, c) + P(heartD(-172, -296, 22), light(c, 0.5)) + G(bowG(0, 0, 0.7, '#ff7eb6'), 'translate(-172 -300)');
      o += box(196, -180, 40, 180, 20, c) + tufts(208, 222, -160, -110, 24, c);
      return o + bigBase(dark(c, 0.08), '#ffffff', s.soft, s.metal) + skirt(-210, 210, -60, -24, s.soft, 14);
    },
    front: (c) => bigBlanket(light(c, 0.35), 'hearts', '#ffffff'),
  },
  {
    st: 'princess', name: 'Grand Corona Bed', x: { h: 440 },
    art: (c, _on, s) => {
      let o = P('M-176 -410 Q-250 -300 -232 -110 L-200 -110 Q-196 -300 -150 -400Z', light(c, 0.35), 'opacity="0.8"') + P('M-104 -410 Q-30 -330 -10 -210 Q-28 -190 -40 -200 Q-60 -320 -130 -400Z', light(c, 0.35), 'opacity="0.8"');
      o += P('M-176 -410 Q-250 -300 -232 -110', 'none', `stroke="${s.trim}" stroke-width="3"`) + C(-25, -205, 10, s.trim);
      o += P('M-186 -400 L-94 -400 L-100 -432 L-120 -416 L-140 -440 L-160 -416 L-180 -432Z', 'url(#g-gold)') + C(-140, -440, 5, '#ff4f8b') + C(-120, -416, 3, '#7cc8ff') + C(-160, -416, 3, '#7cc8ff');
      o += P('M-226 -60 V-250 C-226 -292 -184 -270 -150 -310 C-116 -270 -74 -292 -74 -250 V-60Z', s.trim) + cloth('M-218 -60 V-246 C-218 -280 -182 -262 -150 -298 C-118 -262 -82 -280 -82 -246 V-60Z', '#ffffff');
      o += cloth('M-206 -100 V-236 C-206 -262 -178 -250 -150 -282 C-122 -250 -94 -262 -94 -236 V-100Z', c) + tufts(-190, -110, -240, -130, 24, c);
      o += box(198, -190, 36, 190, 18, '#fff') + C(216, -196, 10, 'url(#g-gold)') + P(starD(216, -150, 10), 'url(#g-gold)');
      return o + skirt(-212, 212, -60, -20, c, 14) + bigBase('#ffffff', '#ffffff', s.soft, 'url(#g-gold)');
    },
    front: (c, _on, s) => bigBlanket(light(c, 0.3), 'hearts', s.soft) + S(`M-23 ${BMT - 34} Q90 ${BMT - 44} 214 ${BMT - 30}`, s.trim, 3),
  },
  {
    st: 'modern', name: 'Floating Glow Bed', x: { toggle: true, h: 260 },
    art: (c, on, s) => {
      let o = on ? E(0, -14, 230, 26, '#cfe9ff', 'opacity="0.7"') + E(0, -14, 180, 14, '#ffffff', 'opacity="0.8"') : '';
      o += box(-236, -250, 30, 250, 6, s.wood);
      for (let y = -240; y < -10; y += 18) o += R(-232, y, 22, 3, 1.5, dark(s.wood, 0.15), 'opacity="0.6"');
      o += box(-206, -96, 412, 44, 6, s.accent) + R(-190, -52, 380, 8, 3, on ? '#e8f6ff' : dark(s.accent, 0.2)) + R(-120, -52, 240, 52, 4, dark(s.accent, 0.3));
      o += mattress(-200, 204, BMT, '#fafbff', 54) + pillow(-150, -180, s.soft, 50, 24) + pillow(-136, -142, c, 50, 25);
      return o;
    },
    front: (c, _on, s) => bigBlanket(light(c, 0.2), 'none', '#ffffff') + box(150, BMT - 44, 64, 104, 10, s.soft, 'none', 'y'),
  },
  {
    st: 'cottage', name: 'Iron Garden Bed', x: { h: 320 },
    art: (c, _on, s) => {
      const iron = '#ffffff';
      let o = R(-236, -300, 14, 300, 7, iron) + R(-120, -270, 12, 210, 6, iron) + S('M-226 -280 Q-170 -320 -114 -262', iron, 10) + S('M-226 -250 Q-170 -284 -114 -236', iron, 6);
      for (const [x, y] of [[-200, -200], [-150, -200], [-175, -150], [-200, -110], [-150, -110]]) o += S(`M${x} ${y} m-16 0 a16 16 0 1 1 16 16 a9 9 0 1 1 -9 -9`, iron, 5);
      o += C(-229, -306, 10, 'url(#g-gold)') + C(-114, -276, 9, 'url(#g-gold)') + flowerG(-175, -246, 14, c, '#ffd36b');
      o += R(222, -200, 14, 200, 7, iron) + R(188, -180, 10, 120, 5, iron) + S('M190 -180 Q212 -204 230 -190', iron, 8) + S('M206 -150 m-12 0 a12 12 0 1 1 12 12 a7 7 0 1 1 -7 -7', iron, 4) + C(229, -206, 9, 'url(#g-gold)');
      return o + bigBase(light(c, 0.1), '#ffffff', s.soft, iron, s.soft) + skirt(-210, 210, -60, -14, '#ffffff', 16);
    },
    front: (c, _on, s) => bigBlanket(light(c, 0.25), 'flowers', s.soft) + S(`M-14 ${BMT - 10} H200`, '#fff', 2, 'stroke-dasharray="6 6" opacity="0.6"'),
  },
  {
    st: 'woodland', name: 'Birch Four-Poster', x: { h: 440 },
    art: (c, _on, s) => {
      const birch = (x: number, h: number) => R(x - 10, -h, 20, h, 8, '#f4efe6') + R(x - 10, -h, 20, h, 8, 'url(#g-shadeX)') +
        [0.15, 0.3, 0.48, 0.62, 0.8].map((t, i) => R(x - 10 + (i % 2) * 6, -h + h * t, 10 + (i % 3) * 3, 3, 1.5, '#4a3f3a', 'opacity="0.8"')).join('');
      let o = birch(-226, 420) + birch(222, 420) + S('M-236 -404 Q0 -440 232 -404', s.wood, 14);
      for (let i = 0; i < 9; i++) o += leafy(-210 + i * 52, -414 + Math.abs(i - 4) * 5 - 10, 22 + (i % 2) * 6, i % 2 ? c : dark(c, 0.05));
      o += leaf(-150, -390, 14, '#ffab5e', 160) + leaf(110, -392, 12, '#ffab5e', 200) + S('M-120 -400 Q-118 -360 -122 -330', '#c9b48a', 1.5) + mushroom(-122, -312, 0.5, s.accent);
      o += box(-216, -250, 24, 250, 10, s.wood) + logEnd(-204, -250, 12, 5, s.wood) + bark(-192, -200, 70, 30, s.wood, 3);
      return o + bigBase(s.wood, s.soft, light(c, 0.4), dark(s.wood, 0.2), s.soft);
    },
    front: (c, _on, s) => bigBlanket(c, 'check', s.soft) + leaf(60, -150, 10, '#ffab5e', -50) + leaf(120, -120, 9, '#ffd36b', 30),
  },
]);

// ---------------- bunk beds ----------------
const LMT = -110;
const UMT = -340;
const bunkSeats = [{ x: HIP, y: LMT + 6, pose: 'sleep' as const }, { x: HIP, y: UMT + 6, pose: 'sleep' as const }];
interface BunkLook { post: (x: number, c: string, s: FurnStyle) => string; deck: string; mat: string; pil: string; lower: string; upper: string; pat: string; fold: string; guard: (c: string, s: FurnStyle) => string; ladder: (c: string, s: FurnStyle) => string; extra?: (c: string, s: FurnStyle) => string; top?: (c: string, s: FurnStyle) => string }
const ladderD = (x1: number, x2: number, top: number, rail: string, rung: string, w = 8) => {
  let o = R(x1, top, w, -top, w / 2, rail) + R(x2 - w, top, w, -top, w / 2, rail);
  for (let y = top + 34; y < -20; y += 46) o += box(x1 + w - 2, y, x2 - x1 - 2 * w + 4, 9, 4, rung, 'none', 'y');
  return o;
};
function bunk(look: (c: string, s: FurnStyle) => BunkLook): Pick<Design, 'art' | 'front'> {
  return {
    art: (c, _on, s) => {
      const L = look(c, s);
      let o = (L.top ? L.top(c, s) : '') + L.post(-200, c, s) + L.post(190, c, s);
      o += box(-196, -86, 392, 30, 8, L.deck) + mattress(-176, 176, LMT, L.mat, 26) + pillow(-112, -116, L.pil);
      o += box(-196, -294, 392, 28, 8, L.deck) + mattress(-176, 176, UMT, L.mat, 46) + pillow(-112, -346, L.pil);
      return o + (L.extra ? L.extra(c, s) : '');
    },
    front: (c, _on, s) => {
      const L = look(c, s);
      return blanket(HIP, LMT, L.lower, L.pat, L.fold) + blanket(HIP, UMT, L.upper, L.pat, L.fold) + L.guard(c, s) + L.ladder(c, s);
    },
  };
}
const BUNKS = fam('bunkbed', 'Bunk Beds', 'bedroom', { mount: 'floor', w: 420, h: 494, seats: bunkSeats }, [
  {
    st: 'sweet', name: 'Sweetheart Bunks',
    ...bunk((c, s) => ({
      post: (x) => box(x - 10, -464, 20, 464, 10, c) + P(heartD(x, -490, 18), c) + P(heartD(x - 4, -484, 5), '#fff', 'opacity="0.6"'),
      deck: dark(c, 0.1), mat: '#ffffff', pil: s.soft, lower: light(c, 0.35), upper: s.soft, pat: 'hearts', fold: '#ffffff',
      guard: () => box(-196, -394, 300, 22, 11, c) + [-150, -90, -30, 30].map((x) => P(heartD(x, -390, 9), '#fff', 'opacity="0.8"')).join('') + R(-194, -384, 8, 90, 4, c) + R(92, -384, 8, 90, 4, c),
      ladder: () => ladderD(140, 196, -366, c, '#ffffff', 10),
    })),
  },
  {
    st: 'princess', name: 'Princess Bunks', x: { h: 514 },
    ...bunk((c, s) => ({
      post: (x) => box(x - 10, -464, 20, 464, 10, '#ffffff') + R(x - 10, -344, 20, 6, 3, s.trim) + C(x, -472, 11, 'url(#g-gold)') + (x < 0 ? motif('crown', x, -498, 20) : ''),
      deck: '#ffffff', mat: '#ffffff', pil: s.soft, lower: light(c, 0.3), upper: light(c, 0.15), pat: 'hearts', fold: s.soft,
      extra: () => P('M-190 -266 Q-150 -170 -186 -120 L-176 -96 Q-120 -160 -160 -266Z', c, 'opacity="0.8"') + C(-178, -150, 6, s.trim) + R(-196, -272, 392, 5, 2, s.trim),
      guard: () => P(`M-196 -374 H100 V-312 H-196Z`, '#ffffff') + P(`M-196 -374${scallop(-196, 100, -374, 8, -5)} V-330Z`, c) + R(-196, -360, 296, 4, 2, s.trim) + R(-196, -374, 8, 80, 4, '#fff') + R(92, -374, 8, 80, 4, '#fff'),
      ladder: () => ladderD(140, 196, -366, '#ffffff', s.soft, 10) + C(146, -370, 6, 'url(#g-gold)') + C(190, -370, 6, 'url(#g-gold)'),
    })),
  },
  {
    st: 'modern', name: 'Metro Bunks',
    ...bunk((c, s) => ({
      post: (x) => R(x - 6, -454, 12, 454, 6, s.accent) + R(x - 2, -444, 3, 434, 1.5, '#fff', 'opacity="0.25"'),
      deck: s.accent, mat: '#fafbff', pil: s.soft, lower: light(c, 0.1), upper: s.soft, pat: 'none', fold: '#ffffff',
      top: () => R(-206, -458, 412, 10, 5, s.accent),
      guard: () => R(-196, -394, 290, 9, 4.5, s.accent) + R(-196, -370, 290, 9, 4.5, s.accent) + R(-196, -394, 9, 100, 4.5, s.accent) + R(86, -394, 9, 100, 4.5, s.accent),
      ladder: () => ladderD(148, 192, -374, s.accent, s.wood, 7),
    })),
  },
  {
    st: 'space', name: 'Space Station Bunks', x: { h: 544 },
    ...bunk((c, s) => ({
      post: (x) => x < 0
        ? cloth('M-224 -10 V-400 Q-224 -484 -196 -524 Q-168 -484 -168 -444 V-10Z', c) + P('M-196 -524 Q-180 -502 -172 -474 L-220 -474 Q-212 -502 -196 -524Z', s.accent) + porthole(-196, -424, 11, s.metal) + porthole(-196, -170, 11, s.metal) + P('M-224 -80 L-246 0 L-224 0Z', s.soft) + P('M-168 -80 L-146 0 L-168 0Z', s.soft) + twinkle(-196, -344, 8, s.accent, 2) + twinkle(-196, -240, 5, '#fff', 1.6, 0.7)
        : R(x - 8, -464, 16, 464, 8, s.metal) + C(x, -472, 10, s.accent) + Ln(x, -482, x, -506, s.metal, 3) + C(x, -508, 5, '#ff7eb6'),
      deck: dark(c, 0.15), mat: '#f6f4ff', pil: s.accent, lower: s.soft, upper: light(c, 0.2), pat: 'stars', fold: s.accent,
      guard: () => box(-168, -396, 268, 28, 12, c) + [-130, -70, -10, 50].map((x, i) => twinkle(x, -382, 6, i % 2 ? '#fff' : s.accent, 1.8 + i * 0.3, i * 0.4)).join('') + R(-168, -376, 8, 80, 4, c) + R(92, -376, 8, 80, 4, c),
      ladder: () => ladderD(140, 196, -366, s.metal, s.accent, 9),
    })),
  },
  {
    st: 'beach', name: 'Pirate Ship Bunks', x: { h: 564 },
    ...bunk((c, s) => ({
      post: (x) => box(x - 10, -374, 20, 374, 8, s.wood) + [-344, -200, -100].map((y) => S(`M${x - 10} ${y} l20 8 M${x - 10} ${y + 8} l20 8`, '#c9b48a', 3)).join(''),
      deck: s.wood, mat: '#ffffff', pil: '#ffffff', lower: light(c, 0.4), upper: light(c, 0.2), pat: 'stripes', fold: '#ffffff',
      top: () => R(-168, -554, 8, 220, 4, s.wood) + P('M-158 -544 L-158 -404 Q-90 -444 -60 -404 L-60 -524 Q-100 -504 -158 -544Z', '#ffffff') + P('M-158 -544 L-158 -404 Q-90 -444 -60 -404 L-60 -524 Q-100 -504 -158 -544Z', 'url(#g-shadeX)') + motif('fish', -108, -474, 16) + P('M-164 -554 L-130 -544 L-164 -534Z', '#ff8a7a'),
      guard: () => cloth('M-212 -364 L214 -378 Q206 -304 170 -270 L-182 -270 Q-206 -304 -212 -364Z', c, 'none', 'y') + P('M-210 -350 L212 -364 L210 -352 L-208 -338Z', '#fff') + porthole(-130, -314, 9, '#fff') + porthole(-70, -314, 9, '#fff') + porthole(-10, -314, 9, '#fff'),
      ladder: () => {
        let o = S('M150 -270 Q146 -110 152 0 M192 -270 Q196 -110 190 0', '#c9b48a', 4);
        for (let y = -244; y < 0; y += 40) o += box(148, y, 46, 8, 4, s.wood);
        return o;
      },
    })),
  },
  {
    st: 'woodland', name: 'Treehouse Bunks', x: { h: 574 },
    ...bunk((c, s) => ({
      post: (x) => bark(x - 14, -464, 28, 464, s.wood, x < 0 ? 1 : 4),
      deck: s.wood, mat: s.soft, pil: '#ffffff', lower: c, upper: light(c, 0.2), pat: 'check', fold: s.soft,
      top: () => {
        let o = P('M-232 -454 L0 -564 L232 -454 L210 -444 L0 -540 L-210 -444Z', dark(s.wood, 0.15)) + P('M-210 -448 L0 -544 L210 -448 L190 -448 L0 -530 L-190 -448Z', s.wood);
        for (let i = 0; i < 5; i++) o += S(`M${-160 + i * 24} ${-472 - i * 11} L${160 - i * 24} ${-472 - i * 11}`, dark(s.wood, 0.25), 2, 'opacity="0.5"');
        return o + leafy(-200, -448, 26, c) + leafy(200, -448, 26, c) + leafy(-120, -492, 18, light(c, 0.1)) + C(0, -494, 14, dark(s.wood, 0.35)) + C(0, -494, 9, '#4a3a2e');
      },
      extra: () => leaf(-200, -344, 16, c, -50) + leaf(204, -200, 14, c, 40) + mushroom(-190, 0, 0.8, s.accent),
      guard: () => {
        let o = '';
        for (let x = -196; x < 100; x += 26) o += box(x, -392, 24, 74, 6, x % 52 ? s.wood : dark(s.wood, 0.06));
        return o + R(-196, -384, 296, 6, 3, dark(s.wood, 0.25), 'opacity="0.4"');
      },
      ladder: () => {
        let o = S('M150 -374 Q146 -160 154 0 M194 -374 Q198 -160 190 0', dark(s.wood, 0.1), 9);
        for (let y = -344; y < -10; y += 46) o += S(`M148 ${y} Q172 ${y + 6} 196 ${y}`, s.wood, 8);
        return o + leaf(196, -304, 11, c, 60);
      },
    })),
  },
], (i) => stylePrice(i, 40, 12));

// ---------------- canopy beds ----------------
const canopyBase = (frame: string, mat: string, pil: string, rail: string, legC: string) =>
  box(-196, -230, 32, 230, 16, frame) + box(164, -160, 32, 160, 16, frame) + box(-182, -86, 364, 34, 10, rail) + leg(-170, -52, 52, legC, 14) + leg(170, -52, 52, legC, 14) +
  mattress(-168, 168, MT, mat) + pillow(-110, -130, pil);
const CANOPIES = fam('canopy', 'Canopy Beds', 'bedroom', { mount: 'floor', w: 420, h: 440 }, [
  {
    st: 'princess', name: 'Crown Canopy Bed',
    art: (c, _on, s) => {
      let o = P('M-170 -420 Q-236 -280 -206 -40 L-186 -40 Q-200 -260 -120 -420Z', c, 'opacity="0.55"') + P('M-120 -420 Q-30 -340 -30 -210 Q-50 -196 -70 -206 Q-80 -330 -150 -414Z', c, 'opacity="0.55"');
      o += P('M-170 -420 Q-236 -280 -206 -40', 'none', `stroke="${s.trim}" stroke-width="3"`) + G(bowG(0, 0, 0.8, light(c, 0.1)), 'translate(-50 -212)');
      o += P('M-200 -416 Q-140 -440 -80 -416 L-90 -396 Q-140 -410 -190 -396Z', 'url(#g-gold)') + P('M-196 -420 L-190 -452 L-170 -432 L-140 -462 L-110 -432 L-90 -452 L-84 -420Z', 'url(#g-gold)') + C(-140, -462, 6, '#ff4f8b') + C(-170, -432, 3.5, '#7cc8ff') + C(-110, -432, 3.5, '#7cc8ff');
      return o + canopyBase('#ffffff', '#ffffff', s.soft, light(c, 0.1), 'url(#g-gold)') + P(starD(-180, -206, 10), 'url(#g-gold)') + skirt(-182, 182, -54, -16, c, 12);
    },
    front: (c, _on, s) => blanket(HIP, MT, light(c, 0.35), 'hearts', s.soft),
    x: { seats: sleep(HIP, MT + 6), h: 470 },
  },
  {
    st: 'cottage', name: 'Ruffle Four-Poster',
    art: (c, _on, s) => {
      let o = R(-204, -420, 14, 420, 7, s.wood) + R(186, -420, 14, 420, 7, s.wood) + C(-197, -428, 9, s.wood) + C(193, -428, 9, s.wood);
      o += P('M-200 -404 L-200 -130 Q-170 -140 -176 -200 Q-150 -300 -170 -404Z', '#ffffff', 'opacity="0.9"') + P('M196 -404 L196 -130 Q166 -140 172 -200 Q146 -300 166 -404Z', '#ffffff', 'opacity="0.9"');
      o += R(-192, -206, 14, 8, 4, c) + R(170, -206, 14, 8, 4, c);
      o += cloth(`M-210 -414 H206 V-380${scallop(206, -210, -380, 12, 6)}Z`, c, 'flowers', 'y') + R(-212, -418, 420, 10, 5, s.wood);
      return o + canopyBase(s.wood, s.soft, '#ffffff', c, dark(s.wood, 0.2)) + motif('daisy', -180, -200, 12);
    },
    front: (c, _on, s) => blanket(HIP, MT, light(c, 0.3), 'flowers', s.soft),
  },
  {
    st: 'rainbow', name: 'Cloud Ribbon Canopy',
    art: (c, _on, s) => {
      let o = R(-202, -400, 12, 400, 6, c) + R(190, -400, 12, 400, 6, c);
      RB.forEach((col, i) => {
        o += P(`M${-196 + i * 8} -396 Q${-176 + i * 10} -300 ${-192 + i * 12} ${-200 + i * 14} L${-186 + i * 12} ${-200 + i * 14} Q${-168 + i * 10} -300 ${-188 + i * 8} -396Z`, col);
        o += P(`M${196 - i * 8} -396 Q${176 - i * 10} -300 ${192 - i * 12} ${-200 + i * 14} L${186 - i * 12} ${-200 + i * 14} Q${168 - i * 10} -300 ${188 - i * 8} -396Z`, col);
      });
      o += cloud(-140, -406, 1.3) + cloud(-30, -414, 1.5) + cloud(90, -406, 1.3) + cloud(170, -400, 1) + twinkle(-80, -440, 8, s.trim, 2) + twinkle(60, -446, 7, '#ffd36b', 2.4, 0.8);
      return o + canopyBase(c, '#ffffff', '#ffffff', light(c, 0.1), s.accent) + sunFace(-180, -232, 20, c);
    },
    front: (_c, _on, s) => blanket(HIP, MT, s.soft, 'stripes', '#ffffff'),
  },
  {
    st: 'beach', name: 'Cabana Bed',
    art: (c, _on, s) => {
      const bamboo = (x: number) => R(x - 8, -410, 16, 410, 6, s.wood) + [-330, -250, -170, -90].map((y) => R(x - 9, y, 18, 4, 2, dark(s.wood, 0.2))).join('');
      let o = bamboo(-198) + bamboo(194);
      o += P('M-200 -396 Q-240 -250 -196 -120 Q-186 -250 -170 -396Z', '#ffffff', 'opacity="0.75"') + P('M196 -396 Q236 -250 192 -120 Q182 -250 166 -396Z', '#ffffff', 'opacity="0.75"');
      o += P('M-224 -400 L0 -446 L224 -400 L200 -386 Q0 -420 -200 -386Z', '#e8c88a') + S('M-200 -394 L0 -436 L200 -394', '#c9a86a', 2);
      for (let i = 0; i < 11; i++) o += P(`M${-200 + i * 40} -390 l10 22 l10 -22Z`, '#d9b878');
      o += mini.starfish(-180, -200, 1, '#ff9a6b') + motif('fish', -110, -200, 14);
      return o + canopyBase(c, '#ffffff', '#ffffff', s.wood, dark(s.wood, 0.2));
    },
    front: (c) => blanket(HIP, MT, light(c, 0.4), 'stripes', '#ffffff'),
  },
  {
    st: 'boho', name: 'Gauze & Lights Bed', x: { toggle: true },
    art: (c, on, s) => {
      let o = R(-202, -410, 12, 410, 4, s.wood) + R(190, -410, 12, 410, 4, s.wood) + R(-210, -414, 420, 12, 4, s.wood);
      o += P(`M-200 -404 Q-150 -340 -100 -404 Q-50 -340 0 -404 Q50 -340 100 -404 Q150 -340 196 -404 L196 -396 Q150 -330 100 -396 Q50 -330 0 -396 Q-50 -330 -100 -396 Q-150 -330 -200 -396Z`, light(c, 0.4), 'opacity="0.9"');
      o += P('M-196 -400 Q-230 -250 -196 -110 L-184 -110 Q-206 -250 -176 -400Z', light(c, 0.5), 'opacity="0.8"');
      for (let i = 0; i < 10; i++) {
        const x = -180 + i * 40;
        const y = -370 + Math.sin(i * 1.3) * 6;
        o += (on ? C(x, y, 12, '#fff6c8', 'opacity="0.35"') : '') + C(x, y, 5, on ? '#fff6c8' : '#f0e6d6', `stroke="${on ? '#ffd24a' : '#d9c8b0'}" stroke-width="1"`);
      }
      o += S('M-180 -370 Q-80 -360 20 -372 Q120 -362 180 -370', '#8a6a4a', 1.2);
      o += Ln(150, -402, 150, -300, '#c9a27e', 2) + P('M136 -300 L164 -300 L160 -278 L140 -278Z', s.accent) + leaf(146, -300, 14, '#6fbf73', -40) + leaf(154, -300, 16, '#5fae6b', 30) + leaf(150, -300, 12, '#8fd18f', 0);
      for (let i = 0; i < 7; i++) o += Ln(-176 + i * 14, -390, -176 + i * 14, -350 + (i % 2) * 10, s.accent, 3);
      return o + canopyBase(s.wood, s.soft, '#ffffff', s.wood, dark(s.wood, 0.2)) + sunFace(-180, -236, 15, '#ffd36b');
    },
    front: (c, _on, s) => blanket(HIP, MT, s.accent, 'none', s.soft) + [-30, 10, 50, 90, 130].map((x) => P(`M${x} -100 l10 -8 l10 8 l-10 8Z`, '#fff', 'opacity="0.6"')).join(''),
  },
  {
    st: 'space', name: 'Starry Night Canopy', x: { h: 450 },
    art: (c, _on, s) => {
      let o = R(-202, -410, 12, 410, 6, s.metal) + R(190, -410, 12, 410, 6, s.metal);
      o += cloth('M-214 -404 Q0 -470 214 -404 L214 -380 Q0 -410 -214 -380Z', c, 'stars', 'y');
      o += P('M-200 -396 Q-150 -260 -196 -130 L-180 -130 Q-140 -260 -176 -396Z', c, 'opacity="0.85"') + P('M196 -396 Q146 -260 192 -130 L176 -130 Q136 -260 172 -396Z', c, 'opacity="0.85"');
      o += Ln(0, -420, 0, -360, '#c9cfdd', 1.5) + bob(P('M8 -362 A22 22 0 1 0 22 -336 A16 16 0 1 1 8 -362Z', s.accent) + C(-2, -342, 1.6, '#2d2a3a'), 6, 3.4);
      for (let i = 0; i < 7; i++) o += twinkle(-160 + i * 52, -424 + (i % 2) * 14, 6 + (i % 3) * 2, i % 2 ? '#fff' : s.accent, 1.8 + (i % 3) * 0.5, i * 0.3);
      return o + canopyBase(c, '#f6f4ff', s.accent, dark(c, 0.15), s.metal) + motif('planet', -180, -200, 16);
    },
    front: (_c, _on, s) => blanket(HIP, MT, s.soft, 'stars', s.accent),
  },
], (i) => stylePrice(i, 60, 15));
for (const d of CANOPIES) d.seats ??= sleep(HIP, MT + 6);

// ---------------- day beds ----------------
const DMT = -112;
const DHIP = 88;
const DAYBEDS = fam('daybed', 'Day Beds', 'bedroom', { mount: 'floor', w: 370, h: 230, seats: sleep(DHIP, DMT + 6) }, [
  {
    st: 'sweet', name: 'Scroll Day Bed',
    art: (c, _on, s) => {
      let o = cloth(`M-170 -110 V-196${scallop(-170, 170, -196, 8, -6)} V-110Z`, c) + P(heartD(0, -184, 22), light(c, 0.5)) + tufts(-140, 140, -170, -130, 28, c);
      o += box(-186, -170, 40, 170, 20, c) + C(-166, -172, 24, c) + C(-166, -172, 14, light(c, 0.3)) + box(146, -170, 40, 170, 20, c) + C(166, -172, 24, c) + C(166, -172, 14, light(c, 0.3));
      o += box(-150, -74, 300, 30, 10, dark(c, 0.1)) + leg(-140, -44, 44, s.metal, 12) + leg(140, -44, 44, s.metal, 12);
      return o + mattress(-150, 150, DMT, '#fff', 40) + pillow(-104, -122, s.soft, 40, 22) + pillow(-30, -150, '#fff', 40, 24) + pillow(50, -150, s.soft, 40, 24, 'hearts');
    },
    front: (c) => blanket(DHIP, DMT, light(c, 0.35), 'hearts', '#ffffff', 150),
  },
  {
    st: 'modern', name: 'Trundle Day Bed',
    art: (c, _on, s) => {
      let o = box(-180, -210, 360, 20, 6, s.wood) + R(-176, -190, 8, 190, 3, s.wood) + R(168, -190, 8, 190, 3, s.wood);
      for (let x = -150; x <= 150; x += 30) o += R(x - 4, -190, 8, 80, 3, s.wood);
      o += box(-170, -76, 340, 22, 4, s.wood) + box(-150, -50, 300, 44, 6, s.accent) + R(-30, -32, 60, 6, 3, s.soft) + leg(-160, -8, 8, s.accent, 8) + leg(160, -8, 8, s.accent, 8);
      return o + mattress(-168, 168, DMT, c, 40) + box(-150, -168, 140, 46, 23, s.soft) + box(-6, -168, 140, 46, 23, light(s.soft, 0.3)) + pillow(-110, -120, '#fff', 40, 20);
    },
    front: (c, _on, s) => blanket(DHIP, DMT, light(c, 0.2), 'none', s.accent, 150),
  },
  {
    st: 'boho', name: 'Cane Day Bed',
    art: (c, _on, s) => {
      let o = box(-176, -220, 352, 120, 14, s.wood) + R(-162, -206, 324, 92, 8, light(c, 0.2));
      for (let x = -156; x < 160; x += 12) o += Ln(x, -206, x + 10, -114, dark(c, 0.15), 1.5) + Ln(x + 10, -206, x, -114, dark(c, 0.15), 1.5);
      o += box(-186, -180, 26, 180, 10, s.wood) + box(160, -180, 26, 180, 10, s.wood) + box(-170, -80, 340, 26, 6, s.wood) + leg(-170, -54, 54, dark(s.wood, 0.2), 12) + leg(170, -54, 54, dark(s.wood, 0.2), 12);
      o += mattress(-160, 160, DMT, s.soft, 40) + pillow(-110, -150, s.accent, 36, 24) + pillow(-40, -150, c, 36, 24) + pillow(30, -150, '#fff', 36, 24) + pillow(100, -150, s.accent, 36, 24);
      for (let i = 0; i < 4; i++) o += P(`M${-118 + i * 70} -150 l8 -8 l8 8 l-8 8Z`, '#fff', 'opacity="0.55"');
      return o + pillow(-112, -120, '#fff', 38, 20);
    },
    front: (_c, _on, s) => {
      let o = blanket(DHIP, DMT, s.accent, 'none', s.soft, 150);
      for (let x = -56; x <= 150; x += 8) o += Ln(x, -54, x, -42, s.accent, 3);
      return o;
    },
  },
  {
    st: 'retro', name: 'Groovy Chaise Bed',
    art: (c, _on, s) => {
      let o = cloth('M-180 -110 C-190 -200 -150 -240 -100 -210 C-40 -170 40 -200 90 -200 C140 -200 170 -170 176 -110Z', c) + tufts(-140, 140, -186, -130, 30, c);
      o += S('M-170 -130 C-170 -190 -140 -214 -100 -194 C-40 -160 40 -184 90 -184 C130 -184 160 -164 164 -128', light(c, 0.35), 4);
      o += box(-176, -78, 352, 26, 13, s.accent) + splay(-150, -52, s.wood, -1) + splay(150, -52, s.wood, 1);
      return o + mattress(-170, 170, DMT, s.soft, 40) + pillow(-110, -150, s.trim, 34, 24) + C(-110, -150, 8, s.accent) + pillow(-110, -120, '#fff', 38, 20) + pillow(90, -150, s.accent, 34, 24) + P(starD(90, -150, 9), '#fff', 'opacity="0.7"');
    },
    front: (_c, _on, s) => blanket(DHIP, DMT, s.trim, 'check', '#ffffff', 150),
  },
]);

// ---------------- cribs ----------------
const CMT = -110;
const CHIP = 66;
interface CribLook { post: string; panel: string; bars: string; mat: string; blanket: string; pat: string; deco?: string; mobile?: string }
function crib(L: (c: string, s: FurnStyle) => CribLook): Pick<Design, 'art' | 'front'> {
  return {
    art: (c, _on, s) => {
      const l = L(c, s);
      let o = l.mobile ?? '';
      o += box(-176, -260, 24, 260, 12, l.post) + box(146, -230, 24, 230, 12, l.post) + box(-160, -244, 60, 140, 20, l.panel);
      for (let x = -146; x < 146; x += 24) o += R(x - 2.5, -216, 5, 110, 2.5, dark(l.bars, 0.08), 'opacity="0.7"');
      o += R(-156, -222, 310, 10, 5, dark(l.bars, 0.06)) + box(-160, -80, 320, 22, 8, l.post) + leg(-160, -58, 58, dark(l.post, 0.2), 12) + leg(156, -58, 58, dark(l.post, 0.2), 12);
      return o + mattress(-152, 152, CMT, l.mat, 32) + pillow(-104, -116, '#fff', 36, 18) + (l.deco ?? '');
    },
    front: (c, _on, s) => {
      const l = L(c, s);
      let o = blanket(CHIP, CMT, l.blanket, l.pat, '#ffffff', 140);
      for (let x = -140; x < 146; x += 28) o += R(x - 3.5, -204, 7, 128, 3.5, l.bars) + R(x - 1.5, -200, 2, 120, 1, '#fff', 'opacity="0.35"');
      return o + box(-162, -218, 322, 16, 8, l.bars) + box(-162, -86, 322, 16, 8, l.bars);
    },
  };
}
/** A mobile hanging from an arm over the crib, gently turning. */
const mobile = (items: string[], arm: string) => {
  let hang = S('M-60 -360 V-338', '#c9b8c8', 1.5) + E(-60, -334, 46, 6, 'none', `stroke="${arm}" stroke-width="3"`);
  items.forEach((it, i) => {
    const x = -60 + (i - (items.length - 1) / 2) * 30;
    const len = 30 + (i % 2) * 16;
    hang += S(`M${f(x)} -334 V${f(-334 + len)}`, '#c9b8c8', 1.2) + bob(G(it, `translate(${f(x)} ${f(-334 + len + 12)})`), 4, 2.2 + i * 0.3, i * 0.4);
  });
  return S('M-166 -260 V-372 Q-166 -384 -150 -384 L-60 -384 Q-50 -384 -50 -374', arm, 6) + `<g>${rockA(-60, -360, 6, 4.5)}${hang}</g>`;
};
const CRIBS = fam('crib', 'Cribs', 'bedroom', { mount: 'floor', w: 350, h: 390, seats: sleep(CHIP, CMT + 6) }, [
  {
    st: 'sweet', name: 'Sweetheart Crib',
    ...crib((c, s) => ({
      post: c, panel: c, bars: '#ffffff', mat: s.soft, blanket: light(c, 0.35), pat: 'hearts', deco: P(heartD(-130, -206, 26), '#fff', 'opacity="0.85"'),
      mobile: mobile([P(heartD(0, -10, 12), '#ff7eb6'), cloud(0, 0, 0.35), P(heartD(0, -10, 12), '#ffd36b'), cloud(0, 0, 0.35)], s.metal),
    })),
  },
  {
    st: 'princess', name: 'Royal Baby Crib', x: { h: 420 },
    ...crib((c, s) => ({
      post: '#ffffff', panel: c, bars: '#ffffff', mat: '#ffffff', blanket: light(c, 0.3), pat: 'hearts',
      deco: motif('crown', -130, -196, 18) + C(-164, -266, 9, 'url(#g-gold)') + C(158, -236, 9, 'url(#g-gold)'),
      mobile: P('M-166 -260 Q-200 -330 -150 -400 L-120 -400 Q-180 -330 -150 -250Z', c, 'opacity="0.5"') + P('M-176 -396 L-170 -420 L-155 -406 L-140 -428 L-125 -406 L-110 -420 L-104 -396Z', 'url(#g-gold)') +
        mobile([P(starD(0, -6, 10), s.trim), P(heartD(0, -10, 10), c), P(starD(0, -6, 10), s.trim)], '#ffffff'),
    })),
  },
  {
    st: 'cottage', name: 'Daisy Spindle Crib',
    ...crib((c, s) => ({
      post: c, panel: s.wood, bars: light(c, 0.2), mat: s.soft, blanket: s.soft, pat: 'none', deco: motif('daisy', -130, -180, 22) + motif('daisy', -112, -220, 10),
      mobile: mobile([flowerG(0, -6, 12, '#ffffff'), flowerG(0, -6, 12, '#ffb3c7'), flowerG(0, -6, 12, '#fff3b0'), flowerG(0, -6, 12, '#ffffff')], s.wood),
    })),
  },
  {
    st: 'space', name: 'Moon & Planets Crib',
    ...crib((c, s) => ({
      post: c, panel: dark(c, 0.1), bars: s.metal, mat: '#f6f4ff', blanket: s.soft, pat: 'stars',
      deco: P('M-122 -224 A26 26 0 1 0 -104 -190 A19 19 0 1 1 -122 -224Z', s.accent) + twinkle(-150, -150, 6, '#fff', 1.8) + twinkle(-150, -220, 5, s.accent, 2.4, 0.5),
      mobile: mobile([motif('planet', 0, -4, 12), P(starD(0, -6, 10), s.accent), motif('moon', 0, -4, 12), motif('rocket', 0, -4, 12)], s.metal),
    })),
  },
  {
    st: 'woodland', name: 'Forest Friends Crib',
    ...crib((c, s) => ({
      post: s.wood, panel: light(s.wood, 0.1), bars: light(s.wood, 0.25), mat: s.soft, blanket: c, pat: 'check',
      deco: leaf(-140, -150, 20, c, -30) + leaf(-118, -150, 24, light(c, 0.1), 20) + leaf(-100, -160, 16, s.accent, 50) + logEnd(-164, -260, 12, 5, s.wood) + logEnd(158, -230, 12, 5, s.wood),
      mobile: mobile([leaf(0, 6, 10, c), G(E(0, -6, 9, 10, '#c98a5a') + P('M-10 -10 Q0 -22 10 -10Z', '#8a5a3c')), mini.teddy(0, 10, 0.5), leaf(0, 6, 10, s.accent)], s.wood),
    })),
  },
]);

// ---------------- wardrobes ----------------
/** The inside of an open wardrobe: a rail of clothes and a shelf of folded things and shoes. */
function closetInside(x1: number, x2: number, yt: number, yb: number, seed = 0): string {
  const w = x2 - x1;
  let o = R(x1, yt, w, yb - yt, 8, '#5e4560') + R(x1, yt, w, 30, 8, '#3a2a40', 'opacity="0.4"');
  const ry = yt + 24;
  o += Ln(x1 + 6, ry, x2 - 6, ry, '#e8c88a', 5);
  const n = Math.max(2, Math.floor((w - 16) / 30));
  for (let i = 0; i < n; i++) {
    const x = x1 + 8 + (w - 16) * ((i + 0.5) / n);
    const col = TOYC[(i + seed) % TOYC.length];
    o += S(`M${f(x)} ${f(ry + 6)} q0 -8 5 -8 q4 0 4 4`, '#ddd', 2) + Ln(x - 10, ry + 8, x + 10, ry + 8, '#ddd', 2);
    o += (i + seed) % 2
      ? P(`M${f(x - 12)} ${f(ry + 10)} L${f(x + 12)} ${f(ry + 10)} L${f(x + 17)} ${f(ry + 24)} L${f(x + 10)} ${f(ry + 26)} L${f(x + 10)} ${f(ry + 64)} L${f(x - 10)} ${f(ry + 64)} L${f(x - 10)} ${f(ry + 26)} L${f(x - 17)} ${f(ry + 24)}Z`, col) + P(heartD(x, ry + 30, 6), '#fff', 'opacity="0.7"')
      : P(`M${f(x - 7)} ${f(ry + 9)} L${f(x + 7)} ${f(ry + 9)} L${f(x + 8)} ${f(ry + 34)} L${f(x + 16)} ${f(ry + 88)} Q${f(x)} ${f(ry + 94)} ${f(x - 16)} ${f(ry + 88)} L${f(x - 8)} ${f(ry + 34)}Z`, col) + R(x - 8, ry + 32, 16, 4, 2, light(col, 0.5));
  }
  const sy = yb - 54;
  o += R(x1 + 4, sy, w - 8, 6, 2, '#e8c88a');
  for (let i = 0; i < 3; i++) o += box(x1 + 10 + i * ((w - 20) / 3), sy - 22, (w - 20) / 3 - 6, 22, 4, TOYC[(i + seed + 2) % 6], 'none', 'y') + Ln(x1 + 14 + i * ((w - 20) / 3), sy - 12, x1 + (i + 1) * ((w - 20) / 3), sy - 12, '#fff', 1.5, 'opacity="0.6"');
  for (let i = 0; i < 2; i++) {
    const x = x1 + w * (0.3 + i * 0.4);
    const col = ['#ff4f8b', '#9b6bff'][i];
    o += E(x - 9, yb - 12, 11, 7, col) + E(x + 11, yb - 12, 11, 7, col) + E(x - 12, yb - 15, 4, 2, '#fff', 'opacity="0.5"');
  }
  return o;
}
const door = (x: number, yt: number, h: number, w: number, c: string, r = 8) => box(x, yt, w, h, r, c) + R(x + 6, yt + 8, w - 12, h - 16, r * 0.7, light(c, 0.2));
const WARDROBES = fam('wardrobe', 'Wardrobes', 'bedroom', { mount: 'floor', w: 200, h: 340, toggle: true }, [
  {
    st: 'sweet', name: 'Heart Wardrobe',
    art: (c, on, s) => {
      let o = cloth('M-95 -296 Q0 -360 95 -296 Z', dark(c, 0.06)) + P(heartD(0, -350, 26), light(c, 0.45)) + box(-95, -300, 190, 290, 14, c) + leg(-80, -12, 12, s.metal, 12) + leg(80, -12, 12, s.metal, 12);
      if (on) return o + closetInside(-86, 86, -290, -20, 0) + door(-150, -296, 280, 58, c) + door(92, -296, 280, 58, c) + P(heartD(-121, -250, 12), '#fff', 'opacity="0.8"') + P(heartD(121, -250, 12), '#fff', 'opacity="0.8"');
      o += Ln(0, -292, 0, -20, dark(c, 0.15), 2) + door(-86, -290, 266, 80, light(c, 0.1), 10) + door(6, -290, 266, 80, light(c, 0.1), 10);
      return o + P(heartD(-46, -260, 22), '#fff', 'opacity="0.85"') + P(heartD(46, -260, 22), '#fff', 'opacity="0.85"') + knob(-14, -160, 6, '#ffd24a') + knob(14, -160, 6, '#ffd24a') + G(bowG(0, 0, 0.6, '#ff7eb6'), 'translate(0 -306)');
    },
  },
  {
    st: 'princess', name: 'Palace Armoire', x: { h: 370 },
    art: (c, on, s) => {
      let o = P('M-104 -300 C-104 -330 -60 -322 -40 -340 C-20 -360 20 -360 40 -340 C60 -322 104 -330 104 -300Z', s.trim) + P('M-96 -300 C-96 -322 -60 -316 -40 -332 C-20 -350 20 -350 40 -332 C60 -316 96 -322 96 -300Z', '#ffffff') + motif('crown', 0, -350, 20);
      o += box(-100, -304, 200, 284, 12, s.wood) + R(-100, -40, 200, 6, 3, s.trim) + cabriole(-84, -24, 'url(#g-gold)', -1) + cabriole(84, -24, 'url(#g-gold)', 1);
      if (on) return o + closetInside(-90, 90, -294, -46, 2) + door(-156, -300, 262, 60, '#ffffff') + door(96, -300, 262, 60, '#ffffff') + E(-126, -170, 18, 60, c) + E(126, -170, 18, 60, c);
      o += Ln(0, -296, 0, -44, '#f0e4ea', 2);
      for (const x of [-46, 46]) o += E(x, -170, 36, 104, s.trim) + cloth(`M${x - 32} -170 A32 100 0 1 1 ${x + 32} -170 A32 100 0 1 1 ${x - 32} -170Z`, c) + E(x, -170, 22, 80, 'none', `stroke="#fff" stroke-width="2" opacity="0.6"`) + P(heartD(x, -200, 12), '#fff', 'opacity="0.7"');
      return o + knob(-10, -170, 6, 'url(#g-gold)') + knob(10, -170, 6, 'url(#g-gold)');
    },
  },
  {
    st: 'modern', name: 'Sliding Wardrobe', x: { w: 220 },
    art: (c, on, s) => {
      let o = box(-110, -330, 220, 312, 4, c) + R(-110, -18, 220, 18, 2, s.accent);
      if (on) return o + closetInside(-102, 102, -322, -24, 3) + box(-118, -326, 110, 304, 3, light(c, 0.1)) + R(-110, -318, 94, 288, 2, '#d9efff') + R(-110, -318, 94, 288, 2, 'url(#g-glass)') + R(-26, -230, 5, 100, 2.5, s.accent);
      o += R(-104, -324, 104, 300, 2, '#d9efff') + R(-104, -324, 104, 300, 2, 'url(#g-glass)') + P('M-90 -300 L-60 -300 L-100 -200 L-100 -260Z', '#fff', 'opacity="0.35"');
      o += box(2, -324, 102, 300, 2, light(c, 0.15)) + R(14, -230, 5, 100, 2.5, s.accent) + R(-110, -330, 220, 4, 2, s.wood);
      return o + motif('bolt', 70, -290, 10);
    },
  },
  {
    st: 'cottage', name: 'Painted Armoire', x: { h: 350 },
    art: (c, on, s) => {
      let o = R(-108, -330, 216, 16, 4, s.wood) + R(-100, -316, 200, 10, 3, dark(s.wood, 0.1)) + box(-98, -310, 196, 280, 10, c) + box(-100, -76, 200, 50, 8, dark(c, 0.06));
      o += E(-80, -10, 14, 12, s.wood) + E(80, -10, 14, 12, s.wood) + R(-20, -56, 40, 8, 4, s.metal) + flowerG(0, -66, 7, '#ffb3c7');
      if (on) return o + closetInside(-90, 90, -304, -82, 4) + door(-156, -306, 228, 58, c) + door(98, -306, 228, 58, c) + flowerG(-127, -200, 14, '#fff') + flowerG(127, -200, 14, '#fff');
      o += Ln(0, -304, 0, -82, dark(c, 0.15), 2);
      for (const x of [-46, 46]) {
        o += door(x - 40, -300, 214, 80, light(c, 0.12), 6) + S(`M${x} -130 Q${x - 6} -190 ${x} -240`, '#6fae6b', 3) + leaf(x, -170, 10, '#6fae6b', -60) + leaf(x, -200, 10, '#6fae6b', 60);
        o += flowerG(x, -248, 16, '#ffffff') + flowerG(x - 20, -214, 10, '#ffb3c7') + flowerG(x + 18, -180, 10, '#fff3b0');
      }
      return o + S('M-16 -170 a6 6 0 0 0 12 0 M4 -170 a6 6 0 0 0 12 0', s.metal, 3);
    },
  },
  {
    st: 'space', name: 'Rocket Wardrobe', x: { h: 370 },
    art: (c, on, s) => {
      let o = P('M-86 -270 Q-60 -340 0 -366 Q60 -340 86 -270Z', s.soft) + P('M-40 -340 Q-20 -356 0 -366 Q20 -356 40 -340Z', s.accent) + porthole(0, -300, 12, s.metal, '#ffe680');
      o += P('M-90 -110 L-130 -20 L-130 0 L-90 -20Z', s.soft) + P('M90 -110 L130 -20 L130 0 L90 -20Z', s.soft) + P('M-26 -20 L26 -20 L36 0 L-36 0Z', s.metal);
      o += box(-90, -274, 180, 254, 26, c) + R(-90, -274, 180, 10, 5, s.metal) + R(-90, -34, 180, 10, 5, s.metal);
      if (on) return o + closetInside(-78, 78, -262, -38, 5) + door(-146, -270, 240, 58, c, 22) + door(88, -270, 240, 58, c, 22) + porthole(-117, -200, 14, s.metal) + porthole(117, -200, 14, s.metal);
      o += Ln(0, -264, 0, -34, dark(c, 0.25), 2) + porthole(-42, -200, 18, s.metal) + porthole(42, -200, 18, s.metal) + twinkle(-44, -110, 8, s.accent, 2) + twinkle(44, -130, 6, '#fff', 1.6, 0.5);
      return o + R(-14, -170, 8, 30, 4, s.accent) + R(6, -170, 8, 30, 4, s.accent) + motif('planet', 0, -76, 16);
    },
  },
  {
    st: 'beach', name: 'Beach Hut Wardrobe', x: { h: 380 },
    art: (c, on, s) => {
      let o = '';
      for (let i = 0; i < 6; i++) o += R(-90 + i * 30, -290, 30, 272, 0, i % 2 ? '#ffffff' : c);
      o += R(-90, -290, 180, 272, 6, 'url(#g-shadeX)') + R(-96, -22, 192, 22, 6, s.wood) + P('M-120 -280 L0 -350 L120 -280 L110 -272 L0 -334 L-110 -272Z', '#ffffff') + P('M-110 -284 L0 -346 L110 -284 L100 -284 L0 -336 L-100 -284Z', s.wood) + Ln(0, -350, 0, -374, '#c9cfdd', 3) + P('M0 -374 L24 -368 L0 -360Z', '#ff8a7a') + mini.starfish(0, -290, 0.9);
      if (on) return o + closetInside(-80, 80, -270, -26, 1) + door(-140, -272, 248, 56, c, 4) + door(84, -272, 248, 56, c, 4);
      for (const x of [-42, 42]) {
        o += box(x - 38, -270, 76, 244, 4, light(c, 0.15));
        for (let y = -258; y < -40; y += 14) o += R(x - 32, y, 64, 7, 2, dark(c, 0.08));
      }
      return o + C(-10, -150, 6, '#fff3d6', 'stroke="#e8c88a" stroke-width="2"') + C(10, -150, 6, '#fff3d6', 'stroke="#e8c88a" stroke-width="2"');
    },
  },
  {
    st: 'woodland', name: 'Tree Trunk Wardrobe', x: { h: 400 },
    art: (c, on, s) => {
      let o = leafy(-60, -330, 46, dark(c, 0.06)) + leafy(60, -330, 46, dark(c, 0.06)) + leafy(0, -360, 54, c);
      o += P('M-110 0 Q-96 -20 -96 -60 L-96 -280 Q0 -310 96 -280 L96 -60 Q96 -20 110 0Z', s.wood) + P('M-110 0 Q-96 -20 -96 -60 L-96 -280 Q0 -310 96 -280 L96 -60 Q96 -20 110 0Z', 'url(#g-shadeX)');
      for (let i = 0; i < 7; i++) o += S(`M${-80 + i * 26} ${-270 + (i % 3) * 20} q6 30 0 ${60 + (i % 2) * 30}`, dark(s.wood, 0.25), 2.5, 'opacity="0.6"');
      o += leaf(-80, -296, 16, '#ffab5e', -40) + leaf(90, -290, 14, light(c, 0.1), 40) + mushroom(-80, 0, 0.9, s.accent) + mushroom(88, 0, 0.6, '#ff8a7a');
      if (on) return o + closetInside(-64, 64, -250, -26, 3).replace('rx="8.0"', 'rx="30.0"') + P('M66 -26 L66 -220 Q96 -262 130 -230 L130 -40Z', light(s.wood, 0.1)) + S('M74 -40 L74 -214 Q96 -244 122 -224 L122 -48', dark(s.wood, 0.2), 2);
      o += P('M-64 -26 L-64 -200 Q-64 -260 0 -260 Q64 -260 64 -200 L64 -26Z', light(s.wood, 0.12)) + S('M-54 -34 L-54 -196 Q-54 -248 0 -248 Q54 -248 54 -196 L54 -34', dark(s.wood, 0.2), 2);
      for (let x = -34; x <= 34; x += 22) o += Ln(x, -236, x, -36, dark(s.wood, 0.12), 2);
      return o + E(-20, -180, 10, 14, dark(s.wood, 0.4)) + E(-20, -180, 5, 8, dark(s.wood, 0.6)) + knob(40, -140, 8, s.accent);
    },
  },
]);

// ---------------- dressers ----------------
const drawer = (x: number, y: number, w: number, h: number, c: string, r = 6) => box(x, y, w, h, r, c) + R(x + 4, y + 3, w - 8, 3, 1.5, '#fff', 'opacity="0.35"');
const DRESSERS = fam('dresser', 'Dressers', 'bedroom', { mount: 'floor', w: 230, h: 170 }, [
  {
    st: 'sweet', name: 'Heart Knob Dresser', x: { surfaces: [{ x1: -112, x2: 112, y: -160 }] },
    art: (c, _on, s) => {
      let o = box(-105, -150, 210, 122, 14, c) + R(-112, -160, 224, 14, 7, light(c, 0.2)) + P(`M-100 -30 H100${scallop(100, -100, -30, 8, 4)}Z`, light(c, 0.15));
      for (let i = 0; i < 3; i++) o += drawer(-94, -142 + i * 36, 188, 30, light(c, 0.25), 10) + P(heartD(-30, -134 + i * 36, 9), s.metal) + P(heartD(30, -134 + i * 36, 9), s.metal);
      return o + leg(-90, -24, 24, s.metal, 10) + leg(90, -24, 24, s.metal, 10);
    },
  },
  {
    st: 'princess', name: 'Bombe Dresser', x: { surfaces: [{ x1: -116, x2: 116, y: -170 }] },
    art: (c, _on, s) => {
      let o = cloth('M-104 -160 C-122 -110 -112 -60 -96 -36 L96 -36 C112 -60 122 -110 104 -160Z', s.wood) + R(-116, -172, 232, 14, 7, '#ffffff') + R(-116, -160, 232, 3, 1.5, s.trim);
      for (let i = 0; i < 3; i++) {
        const y = -152 + i * 38;
        o += drawer(-92, y, 184, 32, c, 10) + S(`M-20 ${y + 16} q10 -10 20 0 q10 10 20 0`, s.trim, 3) + C(-60, y + 16, 4, s.trim) + C(60, y + 16, 4, s.trim);
      }
      o += S('M-96 -36 Q-50 -20 0 -34 Q50 -20 96 -36', s.trim, 4) + motif('crown', 0, -186, 16);
      return o + cabriole(-90, -36, 'url(#g-gold)', -1) + cabriole(90, -36, 'url(#g-gold)', 1);
    },
  },
  {
    st: 'modern', name: 'Low Grid Dresser', x: { w: 270, h: 140, surfaces: [{ x1: -136, x2: 136, y: -128 }] },
    art: (c, _on, s) => {
      let o = box(-136, -128, 272, 12, 3, s.wood) + box(-132, -116, 264, 82, 4, c);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) o += R(-128 + i * 86, -112 + j * 40, 82, 36, 2, light(c, 0.15)) + R(-104 + i * 86, -98 + j * 40, 34, 4, 2, s.accent);
      return o + hairpin(-112, -34, s.accent, 14) + hairpin(112, -34, s.accent, 14);
    },
  },
  {
    st: 'cottage', name: 'Daisy Chest', x: { w: 200, h: 200, surfaces: [{ x1: -100, x2: 100, y: -196 }] },
    art: (c, _on, s) => {
      let o = box(-100, -196, 200, 14, 6, s.wood) + box(-92, -184, 184, 168, 8, c);
      for (let i = 0; i < 4; i++) {
        const y = -178 + i * 40;
        o += drawer(-84, y, 168, 34, light(c, 0.2), 4) + S(`M-28 ${y + 14} a8 8 0 0 0 16 0 M12 ${y + 14} a8 8 0 0 0 16 0`, s.metal, 3);
        o += motif('daisy', i % 2 ? 60 : -60, y + 17, 9);
      }
      return o + E(-78, -8, 14, 9, s.wood) + E(78, -8, 14, 9, s.wood);
    },
  },
  {
    st: 'rainbow', name: 'Rainbow Drawers', x: { w: 180, h: 240, surfaces: [{ x1: -86, x2: 86, y: -228 }] },
    art: (c, _on, s) => {
      let o = box(-86, -228, 172, 214, 14, c) + cloud(-56, -228, 0.5) + cloud(60, -226, 0.45);
      RB.slice(0, 5).forEach((col, i) => (o += drawer(-74, -214 + i * 38, 148, 32, col, 10) + cloud(0, -196 + i * 38, 0.22)));
      return o + leg(-70, -16, 16, s.accent, 14) + leg(70, -16, 16, s.accent, 14);
    },
  },
  {
    st: 'retro', name: 'Groovy Sideboard', x: { w: 260, h: 150, surfaces: [{ x1: -128, x2: 128, y: -136 }] },
    art: (c, _on, s) => {
      let o = box(-128, -136, 256, 96, 22, c) + R(-118, -60, 236, 6, 3, dark(c, 0.15), 'opacity="0.5"');
      o += drawer(-114, -124, 110, 28, light(c, 0.15), 8) + drawer(-114, -90, 110, 28, light(c, 0.15), 8) + C(-59, -110, 5, s.trim) + C(-59, -76, 5, s.trim);
      o += box(4, -124, 110, 62, 10, s.accent) + C(30, -93, 8, dark(s.accent, 0.2)) + C(88, -93, 8, dark(s.accent, 0.2)) + P(starD(59, -93, 12, 0.35, 8), s.trim);
      return o + splay(-104, -44, s.wood, -1) + splay(104, -44, s.wood, 1);
    },
  },
]);

// ---------------- nightstands with lamps ----------------
const NIGHTSTANDS = fam('nightstand', 'Nightstands', 'bedroom', { mount: 'floor', w: 120, h: 230, toggle: true }, [
  {
    st: 'sweet', name: 'Pom-Pom Lamp Stand',
    art: (c, on, s) => {
      let o = box(-50, -104, 100, 94, 14, c) + drawer(-40, -92, 80, 32, light(c, 0.25), 8) + P(heartD(0, -82, 8), s.metal) + leg(-38, -12, 12, s.metal, 10) + leg(38, -12, 12, s.metal, 10);
      o += E(0, -116, 20, 16, '#ffffff') + E(0, -116, 20, 16, 'url(#g-shadeX)') + R(-4, -150, 8, 24, 3, '#fff') + (on ? glow(0, -180, 110) : '');
      o += P('M-38 -150 L38 -150 L26 -204 L-26 -204Z', on ? '#fff6c8' : s.soft) + P('M-38 -150 L38 -150 L26 -204 L-26 -204Z', 'url(#g-shadeX)');
      for (let x = -30; x <= 30; x += 12) o += S(`M${x * 0.8} -203 L${x} -151`, dark(s.soft, 0.08), 1.5, 'opacity="0.6"');
      for (let x = -34; x <= 34; x += 8.5) o += C(x, -148, 4, c);
      return o;
    },
  },
  {
    st: 'princess', name: 'Crystal Lamp Stand', x: { h: 250 },
    art: (c, on, s) => {
      let o = box(-52, -110, 104, 70, 10, '#ffffff') + R(-52, -50, 104, 4, 2, s.trim) + drawer(-42, -100, 84, 30, c, 8) + knob(0, -85, 5, 'url(#g-gold)') + cabriole(-40, -40, 'url(#g-gold)', -1) + cabriole(40, -40, 'url(#g-gold)', 1);
      o += E(0, -114, 22, 6, 'url(#g-gold)') + P('M-6 -114 Q-14 -140 -4 -170 L4 -170 Q14 -140 6 -114Z', 'url(#g-gold)') + (on ? glow(0, -196, 120) : '');
      o += P(`M-40 -172 L40 -172 L28 -228 L-28 -228Z`, on ? '#fff6c8' : c) + P('M-40 -172 L40 -172 L28 -228 L-28 -228Z', 'url(#g-shadeX)') + P(`M-40 -172${scallop(-40, 40, -172, 6, 3)}`, 'none', `stroke="${s.trim}" stroke-width="3"`);
      for (let i = 0; i < 6; i++) o += Ln(-34 + i * 13.6, -168, -34 + i * 13.6, -158, '#ffffff', 1) + P(`M${f(-34 + i * 13.6)} -158 l3 5 l-3 5 l-3 -5Z`, on ? '#fff' : '#d9efff');
      return o + motif('crown', 0, -238, 12);
    },
  },
  {
    st: 'modern', name: 'Globe Lamp Cube',
    art: (c, on, s) => {
      let o = box(-52, -110, 104, 76, 4, c) + R(-44, -102, 88, 30, 2, dark(c, 0.35)) + books(-40, 40, -72, 24, 2, ['#9aa3b5', '#4a4a5e', '#c9a27e', '#e6e8f0']) + drawer(-44, -66, 88, 24, light(c, 0.15), 2) + R(-10, -56, 20, 4, 2, s.accent);
      o += hairpin(-40, -34, s.accent, 10) + hairpin(40, -34, s.accent, 10) + E(0, -112, 16, 4, s.accent) + R(-2.5, -150, 5, 38, 2, '#c9a27e') + (on ? glow(0, -172, 110) : '');
      return o + C(0, -172, 26, on ? '#fff6c8' : '#f4f6fb', 'opacity="0.95"') + C(0, -172, 26, 'url(#g-glass)') + C(-8, -182, 6, '#fff', 'opacity="0.7"');
    },
  },
  {
    st: 'cottage', name: 'Gingham Lamp Stand',
    art: (c, on, s) => {
      let o = box(-50, -106, 100, 16, 5, s.wood) + P(`M-44 -92 H44 V-86${scallop(44, -44, -86, 6, 3)}Z`, '#ffffff') + R(-44, -60, 88, 10, 3, s.wood) + leg(-42, -92, 92, s.wood, 9) + leg(42, -92, 92, s.wood, 9);
      o += box(-36, -82, 50, 22, 3, '#ffb3c7') + box(-30, -96, 44, 14, 3, '#7cc8ff') + mini.duck(24, -60, 0.8);
      o += P('M-18 -106 Q-24 -126 -10 -138 L10 -138 Q24 -126 18 -106Z', c) + P('M-18 -106 Q-24 -126 -10 -138 L10 -138 Q24 -126 18 -106Z', 'url(#g-shadeX)') + S('M18 -130 Q30 -124 20 -112', c, 4) + (on ? glow(0, -170, 110) : '');
      return o + cloth('M-38 -140 L38 -140 L26 -196 L-26 -196Z', on ? '#fff6c8' : s.soft, 'none') + P('M-38 -140 L38 -140 L26 -196 L-26 -196Z', 'url(#p-check)', `opacity="${on ? 0.3 : 1}"`) + R(-38, -144, 76, 6, 3, c);
    },
  },
  {
    st: 'space', name: 'Moon Lamp Stand',
    art: (c, on, s) => {
      let o = box(-50, -104, 100, 92, 24, c) + E(0, -60, 64, 14, 'none', `stroke="${s.accent}" stroke-width="5"`) + P('M-50 -66 Q0 -40 50 -66', 'none', `stroke="${dark(c, 0.2)}" stroke-width="2"`) + leg(-30, -14, 14, s.metal, 10) + leg(30, -14, 14, s.metal, 10);
      o += P('M-30 -104 L30 -104 L20 -114 L-20 -114Z', s.metal) + R(-3, -150, 6, 38, 3, s.metal) + (on ? glow(0, -180, 120) : '');
      o += P('M8 -222 A42 42 0 1 0 36 -150 A32 32 0 1 1 8 -222Z', on ? '#fff3a0' : s.accent) + P('M8 -222 A42 42 0 1 0 36 -150 A32 32 0 1 1 8 -222Z', 'url(#g-shadeX)') + C(-12, -190, 3, dark(s.accent, 0.3)) + S('M-22 -172 Q-16 -166 -10 -172', '#2d2a3a', 2);
      if (on) o += twinkle(30, -210, 7, '#fff', 1.6) + twinkle(-40, -150, 5, '#fff', 2.1, 0.5) + twinkle(44, -120, 5, s.accent, 1.8, 0.9);
      return o;
    },
  },
  {
    st: 'woodland', name: 'Stump & Mushroom Lamp', x: { w: 130 },
    art: (c, on, s) => {
      let o = P('M-50 -100 L-50 -14 Q-60 0 -66 0 L66 0 Q60 0 50 -14 L50 -100Z', s.wood) + P('M-50 -100 L-50 -14 Q-60 0 -66 0 L66 0 Q60 0 50 -14 L50 -100Z', 'url(#g-shadeX)');
      for (let i = 0; i < 4; i++) o += S(`M${-34 + i * 22} -90 q4 30 0 ${50 + (i % 2) * 20}`, dark(s.wood, 0.25), 2, 'opacity="0.6"');
      o += logEnd(0, -100, 50, 12, s.wood) + C(-40, -100, 10, c) + C(-28, -96, 8, light(c, 0.15)) + C(42, -98, 8, c);
      o += (on ? glow(0, -150, 120) : '') + P('M-10 -100 Q-14 -124 -8 -134 L8 -134 Q14 -124 10 -100Z', '#fff3e6');
      o += P('M-44 -130 Q-44 -180 0 -180 Q44 -180 44 -130Z', on ? '#ffd9a0' : s.accent) + P('M-44 -130 Q-44 -180 0 -180 Q44 -180 44 -130Z', 'url(#g-shadeX)') + C(-18, -154, 7, '#fff') + C(14, -164, 6, '#fff') + C(26, -142, 4, '#fff');
      if (on) for (let i = 0; i < 4; i++) o += bob(C(-46 + i * 30, -200 - (i % 2) * 20, 3, '#fff6a0') + C(-46 + i * 30, -200 - (i % 2) * 20, 8, '#fff6a0', 'opacity="0.3"'), -12, 2 + i * 0.4, i * 0.3);
      return o;
    },
  },
]);

// ---------------- vanities ----------------
const VANITIES = fam('vanity', 'Vanities', 'bedroom', { mount: 'floor', w: 230, h: 310, surfaces: [{ x1: -112, x2: 112, y: -140 }] }, [
  {
    st: 'sweet', name: 'Heart Mirror Vanity',
    art: (c, _on, s) => {
      let o = R(-6, -170, 12, 30, 4, s.metal) + P(heartD(0, -290, 96), 'url(#g-gold)') + P(heartD(0, -280, 84), '#d9efff') + P(heartD(0, -280, 84), 'url(#g-glass)') + P('M-50 -260 Q-60 -240 -40 -220', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"');
      o += box(-112, -140, 224, 16, 8, light(c, 0.2)) + box(-104, -126, 208, 50, 10, c) + drawer(-96, -120, 90, 38, light(c, 0.2), 8) + drawer(6, -120, 90, 38, light(c, 0.2), 8) + P(heartD(-51, -106, 8), s.metal) + P(heartD(51, -106, 8), s.metal);
      return o + leg(-96, -76, 76, c, 12) + leg(96, -76, 76, c, 12) + R(-100, -40, 200, 8, 4, dark(c, 0.1)) + mini.bunny(-80, -140, 0.6);
    },
  },
  {
    st: 'princess', name: 'Tri-Fold Royal Vanity', x: { h: 330 },
    art: (c, _on, s) => {
      const panel = (x: number, w: number, top: number) => P(`M${x - w / 2} -146 V${top + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${top + w / 2} V-146Z`, 'url(#g-gold)') + P(`M${x - w / 2 + 6} -150 V${top + w / 2} A${w / 2 - 6} ${w / 2 - 6} 0 0 1 ${x + w / 2 - 6} ${top + w / 2} V-150Z`, '#d9efff') + P(`M${x - w / 2 + 6} -150 V${top + w / 2} A${w / 2 - 6} ${w / 2 - 6} 0 0 1 ${x + w / 2 - 6} ${top + w / 2} V-150Z`, 'url(#g-glass)');
      let o = panel(-74, 52, -260) + panel(74, 52, -260) + panel(0, 86, -304) + motif('crown', 0, -312, 18);
      o += box(-116, -146, 232, 16, 8, '#ffffff') + R(-116, -132, 232, 3, 1.5, s.trim) + cloth(`M-108 -130 H108 V-80${scallop(108, -108, -80, 7, 5)}Z`, c, 'hearts', 'y');
      o += knob(0, -104, 6, 'url(#g-gold)') + cabriole(-96, -80, 'url(#g-gold)', -1) + cabriole(96, -80, 'url(#g-gold)', 1);
      return o + P('M-30 -146 L-26 -170 L-14 -170 L-10 -146Z', '#c99bff', 'opacity="0.9"') + R(-24, -178, 8, 8, 2, 'url(#g-gold)');
    },
  },
  {
    st: 'modern', name: 'Hollywood Vanity', x: { toggle: true },
    art: (c, on, s) => {
      let o = (on ? R(-96, -306, 192, 156, 20, '#fff6c8', 'opacity="0.4"') : '') + box(-86, -296, 172, 140, 8, c) + R(-74, -284, 148, 116, 4, '#d9efff') + R(-74, -284, 148, 116, 4, 'url(#g-glass)');
      for (let i = 0; i < 5; i++) o += bulb(-70 + i * 35, -296, 7, on);
      for (let i = 1; i < 4; i++) o += bulb(-86, -296 + i * 36, 7, on) + bulb(86, -296 + i * 36, 7, on);
      o += R(-4, -156, 8, 16, 3, s.accent) + box(-112, -140, 224, 12, 3, s.wood) + box(-104, -128, 120, 34, 3, c) + R(-60, -114, 32, 4, 2, s.accent);
      return o + leg(-100, -128, 128, s.accent, 6) + leg(100, -128, 128, s.accent, 6) + leg(14, -94, 94, s.accent, 6);
    },
  },
  {
    st: 'cottage', name: 'Swivel Mirror Vanity',
    art: (c, _on, s) => {
      let o = R(-86, -280, 10, 140, 5, s.wood) + R(76, -280, 10, 140, 5, s.wood) + C(-81, -284, 8, s.wood) + C(81, -284, 8, s.wood);
      o += E(0, -222, 66, 76, s.wood) + E(0, -222, 58, 68, '#d9efff') + E(0, -222, 58, 68, 'url(#g-glass)') + C(-76, -222, 5, s.metal) + C(76, -222, 5, s.metal) + flowerG(0, -298, 10, '#ffb3c7');
      o += box(-112, -140, 224, 14, 6, s.wood) + cloth(`M-108 -126 H108 V-14${scallop(108, -108, -14, 8, 4)}Z`, c, 'check', 'y');
      return o + S('M0 -126 Q-6 -70 0 -14', dark(c, 0.15), 2) + G(P('M-12 0 L12 0 L9 -26 L-9 -26Z', '#ffffff') + flowerG(-6, -32, 8, '#ffb3c7') + flowerG(6, -36, 7, '#fff3b0'), 'translate(-80 -140)');
    },
  },
  {
    st: 'boho', name: 'Sunburst Vanity',
    art: (c, _on, s) => {
      let o = '';
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        o += Ln(Math.cos(a) * 54, -228 + Math.sin(a) * 54, Math.cos(a) * (78 + (i % 2) * 10), -228 + Math.sin(a) * (78 + (i % 2) * 10), i % 2 ? s.wood : dark(c, 0.15), 5);
      }
      o += C(0, -228, 56, dark(c, 0.2)) + C(0, -228, 50, '#d9efff') + C(0, -228, 50, 'url(#g-glass)') + P('M-30 -250 Q-36 -230 -22 -210', 'none', 'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"');
      o += box(-112, -140, 224, 14, 6, s.wood) + box(-104, -126, 208, 40, 6, c);
      for (let x = -96; x < 100; x += 8) o += Ln(x, -122, x + 4, -90, dark(c, 0.15), 1.5);
      o += R(-20, -110, 40, 6, 3, s.accent) + splay(-94, -86, s.wood, -1) + splay(94, -86, s.wood, 1);
      return o + G(P('M-14 0 L14 0 L10 -24 L-10 -24Z', s.accent) + leaf(-4, -24, 14, '#6fbf73', -30) + leaf(4, -24, 16, '#5fae6b', 20) + leaf(0, -24, 12, '#8fd18f', 0), 'translate(86 -140)');
    },
  },
]);

// ---------------- desks ----------------
const DESKS = fam('desk', 'Desks', 'bedroom', { mount: 'floor', w: 250, h: 150, surfaces: [{ x1: -122, x2: 122, y: -142 }] }, [
  {
    st: 'sweet', name: 'Heart Study Desk',
    art: (c, _on, s) => {
      let o = box(-104, -128, 56, 128, 12, dark(c, 0.06)) + P(heartD(-76, -96, 22), light(c, 0.5)) + R(-96, -36, 40, 30, 8, light(c, 0.3));
      o += box(30, -128, 76, 120, 10, dark(c, 0.04)) + drawer(38, -120, 60, 34, light(c, 0.3), 8) + drawer(38, -80, 60, 34, light(c, 0.3), 8) + P(heartD(68, -108, 7), s.metal) + P(heartD(68, -68, 7), s.metal) + leg(94, -10, 10, s.metal, 10) + leg(42, -10, 10, s.metal, 10);
      return o + box(-122, -142, 244, 18, 9, c) + shine(-112, -139, 200, 4);
    },
  },
  {
    st: 'modern', name: 'A-Frame Desk',
    art: (c, _on, s) => {
      let o = P('M-104 -130 L-92 -130 L-80 0 L-92 0Z', s.wood) + P('M-104 -130 L-92 -130 L-118 0 L-130 0Z', dark(s.wood, 0.1)) + P('M104 -130 L92 -130 L80 0 L92 0Z', s.wood) + P('M104 -130 L92 -130 L118 0 L130 0Z', dark(s.wood, 0.1));
      o += R(-100, -60, 200, 5, 2, dark(s.wood, 0.1)) + box(-122, -142, 244, 12, 3, c) + box(-60, -130, 120, 24, 3, light(c, 0.1)) + R(-16, -121, 32, 4, 2, s.accent);
      return o;
    },
  },
  {
    st: 'cottage', name: 'Hutch Writing Desk', x: { h: 270, surfaces: [{ x1: -122, x2: 122, y: -142 }, { x1: -100, x2: 100, y: -268 }] },
    art: (c, _on, s) => {
      let o = box(-104, -268, 208, 12, 5, s.wood) + box(-98, -256, 196, 114, 6, c) + R(-90, -250, 180, 104, 4, dark(c, 0.3));
      o += R(-90, -200, 180, 6, 2, c) + R(-4, -250, 8, 104, 2, c) + books(-86, -6, -200, 42, 1) + books(6, 86, -200, 40, 3) + mini.teddy(-46, -146, 0.7) + G(P('M-12 0 L12 0 L9 -22 L-9 -22Z', '#fff') + flowerG(-4, -28, 8, '#ffb3c7') + flowerG(6, -32, 7, '#fff3b0'), 'translate(40 -146)');
      o += box(-122, -142, 244, 16, 6, s.wood) + drawer(-60, -126, 120, 26, light(c, 0.15), 4) + S('M-8 -112 a8 8 0 0 0 16 0', s.metal, 3);
      for (const x of [-110, 110]) o += R(x - 6, -126, 12, 126, 5, c) + E(x, -100, 9, 6, c) + E(x, -40, 9, 6, c);
      return o + motif('daisy', 70, -113, 8) + motif('daisy', -70, -113, 8);
    },
  },
  {
    st: 'space', name: 'Mission Control Desk',
    art: (c, _on, s) => {
      let o = P('M-118 -130 L118 -130 L104 -14 L-104 -14Z', c) + P('M-118 -130 L118 -130 L104 -14 L-104 -14Z', 'url(#g-shadeX)') + R(-110, -14, 220, 14, 4, s.metal);
      o += box(-96, -116, 192, 54, 8, dark(c, 0.25));
      const cols = ['#ff7eb6', '#ffe680', '#5fd3b5', '#7cc8ff', '#ff9a6b'];
      for (let i = 0; i < 8; i++) o += blink(C(-80 + i * 22, -102, 5, cols[i % 5]), 1.2 + (i % 3) * 0.5, i * 0.25);
      o += R(-80, -84, 70, 14, 4, '#1e2a50') + S('M-76 -77 L-66 -82 L-56 -74 L-46 -80 L-36 -76 L-26 -82 L-16 -77', '#5fd3b5', 1.5);
      o += C(40, -78, 12, s.metal) + Ln(40, -78, 46, -88, '#2d2a3a', 3) + R(64, -86, 22, 16, 4, '#ff7eb6') + motif('rocket', 0, -40, 14) + twinkle(-70, -40, 7, s.accent, 2) + twinkle(70, -40, 6, '#fff', 1.6, 0.6);
      return o + box(-124, -142, 248, 14, 7, s.metal);
    },
  },
  {
    st: 'rainbow', name: 'Rainbow Pedestal Desk',
    art: (c, _on, s) => {
      let o = '';
      RB.slice(0, 4).forEach((col, i) => (o += drawer(42, -126 + i * 30, 68, 26, col, 8) + cloud(76, -113 + i * 30, 0.16)));
      o += box(36, -128, 80, 4, 2, c) + cloth('M-110 -128 L-60 -128 L-60 -40 Q-60 0 -85 0 Q-110 0 -110 -40Z', c) + cloud(-85, -70, 0.55) + leg(42, -8, 8, s.accent, 10) + leg(108, -8, 8, s.accent, 10);
      return o + box(-122, -142, 244, 16, 8, c) + R(-114, -132, 228, 4, 2, s.accent, 'opacity="0.6"');
    },
  },
  {
    st: 'woodland', name: 'Branch Slab Desk',
    art: (c, _on, s) => {
      const branch = (x: number, d: number) => S(`M${x} 0 L${x + 6 * d} -70 L${x - 10 * d} -130 M${x + 6 * d} -70 L${x + 24 * d} -128`, s.wood, 12) + S(`M${x + 2 * d} -40 L${x + 6 * d} -70`, dark(s.wood, 0.15), 3);
      let o = branch(-90, 1) + branch(90, -1) + leaf(-76, -60, 14, c, -60) + leaf(88, -90, 12, light(c, 0.1), 50);
      o += P('M-126 -142 Q-100 -150 -60 -144 Q0 -150 60 -144 Q100 -150 126 -142 L124 -126 Q0 -120 -124 -126Z', light(s.wood, 0.15)) + P('M-124 -132 Q0 -126 124 -132 L124 -126 Q0 -120 -124 -126Z', dark(s.wood, 0.25));
      return o + E(-100, -136, 10, 3, dark(s.wood, 0.1), 'opacity="0.5"') + mushroom(110, 0, 0.6, s.accent);
    },
  },
]);

// ---------------- desk chairs ----------------
const caster = (c: string) => S('M-36 -6 L0 -16 L36 -6 M-20 -2 L0 -16 L20 -2', c, 6) + C(-36, -5, 5, '#4a4a5e') + C(36, -5, 5, '#4a4a5e') + C(-20, -3, 4, '#4a4a5e') + C(20, -3, 4, '#4a4a5e') + R(-4, -66, 8, 52, 4, c);
const DESKCHAIRS = fam('deskchair', 'Desk Chairs', 'bedroom', { mount: 'floor', w: 120, h: 200, seats: [sit(0, -80)] }, [
  {
    st: 'sweet', name: 'Heart Swivel Chair',
    art: (c, _on, s) => caster(s.metal === 'url(#g-gold)' ? '#e8c06a' : s.metal) + R(-4, -120, 8, 40, 4, dark(c, 0.2)) + cloth(heartD(0, -196, 70), c) + P(heartD(0, -182, 46), light(c, 0.35)) + tufts(-16, 16, -170, -150, 32, c) + box(-50, -88, 100, 22, 11, dark(c, 0.06), 'none', 'y'),
  },
  {
    st: 'princess', name: 'Tufted Royal Chair',
    art: (c, _on, s) => E(0, -146, 44, 58, 'url(#g-gold)') + cloth('M-38 -146 A38 52 0 1 1 38 -146 A38 52 0 1 1 -38 -146Z', c) + tufts(-20, 20, -176, -116, 22, c) + motif('crown', 0, -208, 14) +
      cabriole(-36, -76, 'url(#g-gold)', -1) + cabriole(36, -76, 'url(#g-gold)', 1) + box(-54, -90, 108, 22, 11, '#ffffff', 'none', 'y') + R(-54, -72, 108, 4, 2, s.trim),
  },
  {
    st: 'modern', name: 'Ergo Office Chair',
    art: (c, _on, s) => {
      let o = caster(s.accent) + R(-4, -124, 8, 40, 4, s.accent) + box(-38, -196, 76, 90, 20, s.accent) + R(-32, -190, 64, 78, 16, c);
      for (let y = -182; y < -116; y += 9) o += Ln(-28, y, 28, y, dark(c, 0.1), 1.2);
      return o + S('M-46 -96 V-118 H-30 M46 -96 V-118 H30', s.accent, 5) + box(-50, -92, 100, 20, 8, s.accent, 'none', 'y') + R(-44, -90, 88, 4, 2, '#fff', 'opacity="0.2"');
    },
  },
  {
    st: 'cottage', name: 'Windsor Chair',
    art: (c, _on, s) => {
      let o = P('M-40 -170 Q0 -206 40 -170 L36 -164 Q0 -196 -36 -164Z', s.wood);
      for (let x = -30; x <= 30; x += 12) o += R(x - 2.5, -176 + Math.abs(x) * 0.2, 5, 90 - Math.abs(x) * 0.2, 2.5, s.wood);
      o += P('M-42 -84 L-50 0 L-40 0 L-32 -84Z', s.wood) + P('M42 -84 L50 0 L40 0 L32 -84Z', s.wood) + R(-44, -40, 88, 6, 3, dark(s.wood, 0.1));
      return o + box(-52, -94, 104, 14, 6, s.wood) + box(-48, -104, 96, 16, 8, c, 'check', 'y');
    },
  },
  {
    st: 'space', name: 'Astro Pod Chair',
    art: (c, _on, s) => {
      let o = E(0, -4, 34, 6, s.metal) + R(-6, -70, 12, 66, 6, s.metal);
      o += P('M-54 -86 Q-62 -200 0 -206 Q62 -200 54 -86 Q0 -66 -54 -86Z', '#ffffff') + P('M-54 -86 Q-62 -200 0 -206 Q62 -200 54 -86 Q0 -66 -54 -86Z', 'url(#g-shadeX)');
      o += cloth('M-42 -90 Q-48 -186 0 -190 Q48 -186 42 -90Z', c, 'stars') + twinkle(-20, -160, 6, s.accent, 1.8) + twinkle(22, -140, 5, '#fff', 2.2, 0.6);
      return o + box(-46, -96, 92, 20, 10, s.soft, 'none', 'y') + R(-54, -90, 108, 6, 3, s.accent);
    },
  },
  {
    st: 'candy', name: 'Lollipop Chair',
    art: (c, _on, s) => {
      let o = R(-5, -120, 10, 40, 5, '#ffffff') + C(0, -158, 44, c) + S('M0 -158 m-30 0 a30 30 0 1 1 30 30 a22 22 0 1 1 -22 -22 a13 13 0 1 1 13 13 a6 6 0 1 1 -6 -6', '#ffffff', 7) + C(-14, -176, 8, '#fff', 'opacity="0.45"');
      for (const x of [-34, 34]) o += R(x - 5, -80, 10, 80, 5, '#ffffff') + [-70, -50, -30, -10].map((y) => R(x - 5, y, 10, 6, 0, s.trim)).join('');
      return o + P('M-50 -78 Q-54 -100 -30 -102 L30 -102 Q54 -100 50 -78Z', s.accent) + P('M-50 -78 Q-54 -100 -30 -102 L30 -102 Q54 -100 50 -78Z', 'url(#g-shadeY)') + [[-30, -90], [-6, -96], [16, -88], [34, -94]].map(([x, y], i) => R(x, y, 7, 3, 1.5, TOYC[i], `transform="rotate(${i * 40} ${x} ${y})"`)).join('');
    },
  },
]);

// ---------------- bookshelves ----------------
const BOOKSHELVES = fam('bookshelf', 'Bookshelves', 'bedroom', { mount: 'floor', w: 210, h: 290, surfaces: [{ x1: -100, x2: 100, y: -282 }] }, [
  {
    st: 'sweet', name: 'Arched Heart Shelf', x: { surfaces: [{ x1: -60, x2: 60, y: -300 }] },
    art: (c, _on, s) => {
      let o = cloth('M-100 -8 V-230 Q-100 -300 0 -300 Q100 -300 100 -230 V-8Z', c) + P('M-88 -20 V-226 Q-88 -286 0 -286 Q88 -286 88 -226 V-20Z', dark(c, 0.3));
      o += P(heartD(0, -270, 34), light(c, 0.3)) + R(-88, -210, 176, 8, 2, c) + R(-88, -126, 176, 8, 2, c);
      o += books(-84, 40, -210, 56, 0) + mini.bunny(64, -210, 0.8) + books(-20, 84, -126, 60, 2) + mini.teddy(-52, -126, 0.9) + books(-84, 0, -20, 70, 4) + mini.ball(44, -20, 18, '#7cc8ff');
      return o + leg(-80, -10, 10, s.metal, 10) + leg(80, -10, 10, s.metal, 10);
    },
  },
  {
    st: 'modern', name: 'Ladder Shelf', x: { surfaces: [{ x1: -40, x2: 40, y: -286 }] },
    art: (c, _on, s) => {
      let o = P('M-60 -290 L-48 -290 L-90 0 L-104 0Z', s.wood) + P('M60 -290 L48 -290 L90 0 L104 0Z', s.wood);
      const shelves = [[-286, 46], [-210, 62], [-130, 78], [-50, 94]] as const;
      shelves.forEach(([y, hw], i) => {
        o += box(-hw, y, hw * 2, 10, 3, c);
        if (i === 1) o += books(-hw + 6, hw - 30, y, 44, 1, ['#9aa3b5', '#4a4a5e', '#c9a27e', '#e6e8f0', '#ff9ec7']) + C(hw - 18, y - 16, 14, s.soft);
        if (i === 2) o += P(`M-30 ${y} L-14 ${y} L-18 ${y - 34} L-26 ${y - 34}Z`, '#ffffff') + leaf(-24, y - 34, 18, '#6fbf73', -30) + leaf(-20, y - 34, 20, '#5fae6b', 20) + books(0, hw - 6, y, 50, 3, ['#4a4a5e', '#c9a27e', '#e6e8f0', '#9aa3b5']);
        if (i === 3) o += box(-80, y - 34, 70, 34, 6, s.accent) + box(10, y - 30, 64, 30, 6, s.soft);
        if (i === 0) o += P(`M-10 ${y} Q-20 ${y - 20} -6 ${y - 34} L6 ${y - 34} Q20 ${y - 20} 10 ${y}Z`, s.soft);
      });
      return o;
    },
  },
  {
    st: 'cottage', name: 'Crown Molding Shelf',
    art: (c, _on, s) => {
      let o = box(-108, -294, 216, 14, 4, s.wood) + P(`M-100 -280 H100 V-270${scallop(100, -100, -270, 8, 4)}Z`, c) + box(-100, -280, 200, 274, 6, c) + R(-88, -266, 176, 248, 4, dark(c, 0.3));
      o += P(`M-88 -266 H88 V-258${scallop(88, -88, -258, 8, 3)}Z`, '#ffffff', 'opacity="0.9"');
      for (const y of [-190, -106, -20]) o += R(-88, y, 176, 8, 2, s.wood);
      o += books(-84, 30, -190, 54, 1) + G(E(0, -16, 18, 16, '#fff') + E(0, -16, 18, 16, 'url(#g-shadeX)') + S('M16 -20 Q28 -26 26 -36', '#fff', 5) + E(0, -32, 10, 4, '#ffb3c7') + flowerG(0, -16, 6, '#ffb3c7'), 'translate(58 -190)');
      o += books(-20, 84, -106, 58, 3) + G(P('M-12 0 L12 0 L9 -22 L-9 -22Z', '#fff') + flowerG(-4, -28, 8, '#ffb3c7') + flowerG(6, -32, 7, '#fff3b0'), 'translate(-56 -106)');
      return o + books(-84, 84, -20, 66, 5) + E(-80, -4, 12, 6, s.wood) + E(80, -4, 12, 6, s.wood);
    },
  },
  {
    st: 'space', name: 'Rocket Bookcase', x: { h: 340, surfaces: [] },
    art: (c, _on, s) => {
      let o = P('M-88 -60 L-130 0 L-88 0Z', s.soft) + P('M88 -60 L130 0 L88 0Z', s.soft) + P('M-88 -250 Q-60 -320 0 -340 Q60 -320 88 -250Z', s.soft) + P('M-36 -318 Q-18 -334 0 -340 Q18 -334 36 -318Z', s.accent);
      o += box(-90, -254, 180, 250, 30, c) + porthole(0, -286, 14, s.metal, '#ffe680');
      for (const [y, h] of [[-236, 70], [-150, 70], [-66, 56]] as const) o += R(-72, y, 144, h, 14, dark(c, 0.35)) + R(-72, y + h - 6, 144, 6, 2, s.metal);
      o += books(-66, 20, -172, 54, 2) + mini.robot(46, -172, 1) + mini.star(-40, -86, 0.9) + books(-14, 66, -86, 56, 4) + books(-66, 66, -16, 44, 1) + twinkle(-70, -280, 7, s.accent, 2) + twinkle(68, -300, 5, '#fff', 1.6, 0.5);
      return o;
    },
  },
  {
    st: 'woodland', name: 'Tree Bookshelf', x: { h: 330, surfaces: [] },
    art: (c, _on, s) => {
      let o = leafy(-60, -290, 42, dark(c, 0.06)) + leafy(60, -290, 42, dark(c, 0.06)) + leafy(0, -310, 48, c);
      o += P('M-26 0 Q-18 -20 -18 -60 L-18 -280 L18 -280 L18 -60 Q18 -20 26 0Z', s.wood) + P('M-26 0 Q-18 -20 -18 -60 L-18 -280 L18 -280 L18 -60 Q18 -20 26 0Z', 'url(#g-shadeX)');
      const branches = [[-1, -220], [1, -170], [-1, -110], [1, -50]] as const;
      for (const [d, y] of branches) {
        o += P(`M${d * 18} ${y} L${d * 104} ${y - 6} L${d * 104} ${y + 6} L${d * 18} ${y + 12}Z`, s.wood) + leaf(d * 104, y - 6, 10, c, d * 70);
        o += d < 0 ? books(-98, -24, y - 6, 44, -y % 7) : books(24, 98, y - 6, 44, -y % 5);
      }
      return o + E(-2, -250, 7, 10, dark(s.wood, 0.4)) + mushroom(30, 0, 0.6, s.accent) + G(E(0, -14, 12, 14, '#c98a5a') + C(-4, -20, 3, '#fff') + C(4, -20, 3, '#fff') + C(-4, -20, 1.5, '#2d2a3a') + C(4, -20, 1.5, '#2d2a3a') + P('M-2 -15 L2 -15 L0 -11Z', '#ffab5e') + P('M-12 -26 L-8 -32 L-4 -26Z M12 -26 L8 -32 L4 -26Z', '#c98a5a'), 'translate(-60 -226)');
    },
  },
]);

// ---------------- toy chests ----------------
const TOYS = ['ball', 'teddyToy', 'blocks', 'duck'];
const peek = () => mini.teddy(-40, -112, 0.8) + mini.ball(30, -110, 14, '#7cc8ff') + mini.duck(4, -108, 0.8);
const TOYCHESTS = fam('toychest', 'Toy Chests', 'bedroom', { mount: 'floor', w: 180, h: 140, spawn: TOYS, surfaces: [{ x1: -86, x2: 86, y: -118 }] }, [
  {
    st: 'sweet', name: 'Ribbon Toy Box',
    art: (c, _on, s) => box(-85, -102, 170, 92, 14, c) + R(-10, -102, 20, 92, 0, s.soft) + box(-90, -118, 180, 24, 12, dark(c, 0.08)) + R(-10, -118, 20, 24, 0, light(s.soft, 0.2)) + G(bowG(0, 0, 0.9, '#ff7eb6'), 'translate(0 -116)') +
      P(heartD(-48, -72, 18), '#fff', 'opacity="0.8"') + P(heartD(48, -72, 18), '#fff', 'opacity="0.8"') + leg(-70, -12, 12, s.metal, 12) + leg(70, -12, 12, s.metal, 12),
  },
  {
    st: 'princess', name: 'Jewel Trunk', x: { surfaces: [{ x1: -70, x2: 70, y: -142 }] },
    art: (c, _on, s) => {
      let o = box(-86, -100, 172, 92, 10, c) + cloth('M-90 -98 Q-90 -142 0 -144 Q90 -142 90 -98Z', light(c, 0.15)) + R(-90, -104, 180, 10, 4, s.trim);
      for (const x of [-56, 56]) o += R(x - 6, -140, 12, 132, 4, 'url(#g-gold)');
      o += R(-16, -96, 32, 26, 6, 'url(#g-gold)') + C(0, -84, 5, '#9b6bff') + C(-30, -60, 6, '#ff4f8b') + C(30, -60, 6, '#7cc8ff') + C(0, -40, 7, '#5fd3b5');
      return o + motif('crown', 0, -152, 16) + cabriole(-72, -12, 'url(#g-gold)', -1) + cabriole(72, -12, 'url(#g-gold)', 1);
    },
  },
  {
    st: 'space', name: 'Robot Toy Bin', x: { h: 170 },
    art: (c, _on, s) => {
      let o = box(-84, -110, 168, 100, 16, c) + box(-90, -126, 180, 22, 10, dark(c, 0.1)) + Ln(0, -126, 0, -150, s.metal, 4) + blink(C(0, -154, 7, '#ff7eb6'), 1.4);
      o += R(-62, -96, 124, 46, 14, '#1e2a50') + blink(C(-30, -73, 11, s.accent), 3, 0) + blink(C(30, -73, 11, s.accent), 3, 0) + C(-34, -77, 3, '#fff') + C(26, -77, 3, '#fff');
      for (let i = 0; i < 5; i++) o += R(-40 + i * 17, -40, 12, 18, 3, s.metal);
      return o + C(-74, -100, 4, s.metal) + C(74, -100, 4, s.metal) + C(-74, -22, 4, s.metal) + C(74, -22, 4, s.metal) + R(-100, -86, 16, 36, 6, s.metal) + R(84, -86, 16, 36, 6, s.metal) + leg(-66, -10, 10, s.metal, 14) + leg(66, -10, 10, s.metal, 14);
    },
  },
  {
    st: 'beach', name: 'Treasure Chest', x: { surfaces: [{ x1: -70, x2: 70, y: -146 }] },
    art: (c, _on, s) => {
      let o = peek() + [[-60, -104], [-36, -110], [40, -108], [62, -104]].map(([x, y]) => E(x, y, 9, 4, '#ffd24a', 'stroke="#e0a11e" stroke-width="1.5"')).join('');
      o += box(-86, -100, 172, 92, 8, c);
      for (let y = -84; y < -10; y += 22) o += Ln(-80, y, 80, y, dark(c, 0.12), 2);
      o += G(cloth('M-92 -100 Q-92 -150 0 -152 Q92 -150 92 -100Z', light(c, 0.1)), 'translate(0 -16) rotate(-5 90 -100)');
      o += R(-62, -100, 10, 92, 3, s.wood) + R(52, -100, 10, 92, 3, s.wood) + R(-12, -104, 24, 24, 4, s.wood) + C(0, -92, 4, '#4a4a5e');
      return o + mini.starfish(-40, -26, 0.9) + motif('fish', 40, -50, 12);
    },
  },
  {
    st: 'woodland', name: 'Teddy Bear Chest', x: { surfaces: [{ x1: -80, x2: 80, y: -118 }] },
    art: (c, _on, s) => {
      const fur = s.wood;
      let o = C(-60, -124, 22, fur) + C(60, -124, 22, fur) + C(-60, -124, 12, light(fur, 0.4)) + C(60, -124, 12, light(fur, 0.4));
      o += box(-86, -104, 172, 96, 22, fur) + box(-90, -118, 180, 24, 12, dark(fur, 0.1));
      o += C(-30, -72, 7, '#2d2a3a') + C(30, -72, 7, '#2d2a3a') + C(-28, -74, 2.5, '#fff') + C(32, -74, 2.5, '#fff') + E(0, -50, 30, 22, light(fur, 0.45)) + E(0, -58, 10, 7, '#4a2e22') + S('M-10 -44 Q0 -36 10 -44', '#4a2e22', 3);
      return o + E(-54, -52, 10, 6, '#ff9ec7', 'opacity="0.7"') + E(54, -52, 10, 6, '#ff9ec7', 'opacity="0.7"') + G(bowG(0, 0, 0.6, c), 'translate(0 -104)') + E(-64, -6, 16, 8, dark(fur, 0.15)) + E(64, -6, 16, 8, dark(fur, 0.15));
    },
  },
]);

// ---------------- bean bags ----------------
const BEANBAGS = fam('beanbag', 'Bean Bags', 'bedroom', { mount: 'floor', w: 180, h: 130, seats: [sit(0, -50)] }, [
  {
    st: 'sweet', name: 'Heart Bean Bag',
    art: (c) => cloth('M0 -8 C-60 -4 -96 -30 -90 -74 C-84 -116 -36 -122 0 -96 C36 -122 84 -116 90 -74 C96 -30 60 -4 0 -8Z', c) + P('M-60 -92 Q-40 -106 -20 -98', 'none', `stroke="${light(c, 0.5)}" stroke-width="6" stroke-linecap="round" opacity="0.7"`) + S('M0 -94 Q-4 -50 0 -10', dark(c, 0.1), 2, 'stroke-dasharray="5 5"'),
  },
  {
    st: 'modern', name: 'Teardrop Pouf',
    art: (c, _on, s) => cloth('M-80 -6 C-92 -60 -50 -96 -6 -128 C20 -110 92 -70 82 -6 Q0 6 -80 -6Z', c) + S('M-6 -128 C-10 -80 -20 -40 -30 -4', dark(c, 0.12), 2) + S('M-80 -6 Q0 6 82 -6', s.accent, 4) + R(52, -40, 14, 20, 3, s.accent),
  },
  {
    st: 'space', name: 'Saturn Bean Bag',
    art: (c, _on, s) => {
      return E(0, -66, 96, 20, 'none', `stroke="${dark(s.accent, 0.1)}" stroke-width="12"`) + cloth('M-78 -10 C-96 -60 -66 -124 0 -124 C66 -124 96 -60 78 -10 Q0 4 -78 -10Z', c) + E(-30, -90, 16, 10, light(c, 0.15), 'opacity="0.7"') + E(36, -50, 12, 8, light(c, 0.15), 'opacity="0.7"') +
        P('M-94 -64 Q0 -32 94 -64 L96 -58 Q0 -22 -96 -58Z', s.accent) + twinkle(-70, -110, 7, '#fff', 1.8) + twinkle(80, -100, 5, s.accent, 2.3, 0.5);
    },
  },
  {
    st: 'candy', name: 'Donut Bean Bag',
    art: (c) => {
      let o = E(0, -42, 92, 40, '#e8b46a') + E(0, -42, 92, 40, 'url(#g-shadeY)') + P('M-88 -50 Q-90 -86 0 -88 Q90 -86 88 -50 Q80 -36 70 -44 Q60 -30 46 -42 Q30 -28 14 -40 Q0 -28 -14 -40 Q-30 -28 -46 -42 Q-60 -30 -70 -44 Q-80 -36 -88 -50Z', c);
      o += E(0, -62, 26, 9, dark(c, 0.25));
      [[-60, -66], [-36, -76], [-14, -80], [30, -78], [54, -70], [70, -58], [-70, -56], [40, -56], [-40, -54]].forEach(([x, y], i) => (o += R(x, y, 10, 4, 2, TOYC[i % 6], `transform="rotate(${i * 37} ${x} ${y})"`)));
      return o;
    },
  },
  {
    st: 'woodland', name: 'Bear Bean Bag',
    art: (c, _on, s) => {
      const fur = s.wood;
      return C(-50, -112, 20, fur) + C(50, -112, 20, fur) + C(-50, -112, 10, light(fur, 0.4)) + C(50, -112, 10, light(fur, 0.4)) + cloth('M-84 -6 C-96 -70 -60 -118 0 -116 C60 -118 96 -70 84 -6 Q0 6 -84 -6Z', fur) +
        E(0, -26, 26, 14, light(fur, 0.45)) + E(0, -30, 8, 5, '#4a2e22') + C(-26, -44, 4, '#2d2a3a') + C(26, -44, 4, '#2d2a3a') + leaf(60, -100, 14, c, 40) + leaf(66, -98, 12, s.accent, 80);
    },
  },
]);

// ---------------- benches & window seats ----------------
const BENCHES = fam('bench', 'Benches', 'bedroom', { mount: 'floor', w: 260, h: 130, seats: [sit(-60, -92), sit(60, -92)] }, [
  {
    st: 'princess', name: 'Tufted Bed Bench',
    art: (c, _on, s) => cabriole(-104, -60, 'url(#g-gold)', -1) + cabriole(104, -60, 'url(#g-gold)', 1) + R(-116, -64, 232, 10, 5, '#ffffff') + box(-126, -104, 252, 44, 20, c) + tufts(-96, 96, -88, -76, 32, c) + R(-120, -66, 240, 4, 2, s.trim) + S(`M-112 -60${scallop(-112, 112, -60, 8, 4)}`, s.trim, 2) + G(bowG(0, 0, 0.6, light(c, 0.1)), 'translate(0 -100)'),
  },
  {
    st: 'cottage', name: 'Basket Storage Bench',
    art: (c, _on, s) => {
      let o = box(-124, -84, 248, 84, 8, c) + R(-114, -70, 228, 62, 4, dark(c, 0.25));
      for (const x of [-60, 60]) {
        o += box(x - 48, -64, 96, 56, 8, '#e8c88a');
        for (let y = -56; y < -10; y += 9) o += Ln(x - 44, y, x + 44, y, '#c9a86a', 2);
        o += R(x - 14, -66, 28, 8, 4, '#c9a86a');
      }
      return o + box(-130, -100, 260, 22, 10, s.soft, 'check', 'y') + motif('daisy', 0, -40, 10);
    },
  },
  {
    st: 'boho', name: 'Rattan Window Seat', x: { h: 170 },
    art: (c, _on, s) => {
      let o = box(-126, -160, 252, 80, 10, s.wood);
      for (let x = -118; x < 122; x += 14) o += S(`M${x} -150 Q${x + 7} -120 ${x} -90`, dark(s.wood, 0.2), 1.5);
      o += box(-126, -84, 252, 30, 8, s.wood) + leg(-112, -54, 54, dark(s.wood, 0.2), 12) + leg(112, -54, 54, dark(s.wood, 0.2), 12);
      o += box(-120, -100, 240, 22, 10, c, 'none', 'y') + pillow(-80, -116, s.accent, 30, 20) + pillow(80, -116, '#ffffff', 30, 20);
      for (let x = -116; x <= 116; x += 8) o += Ln(x, -80, x, -68, s.accent, 3);
      return o + P('M-90 -120 l6 -6 l6 6 l-6 6Z', '#fff', 'opacity="0.6"');
    },
  },
]);

// ---------------- jewelry boxes (props) ----------------
const JEWELBOXES = fam('jewelbox', 'Jewelry Boxes', 'bedroom', { mount: 'prop', w: 80, h: 80, toggle: true }, [
  {
    st: 'sweet', name: 'Heart Jewelry Box',
    art: (c, on) => {
      let o = cloth('M-34 -2 L34 -2 L34 -28 L-34 -28Z', c) + R(-34, -6, 68, 4, 2, dark(c, 0.15));
      if (on) return o + C(-16, -32, 5, '#fff') + C(-6, -36, 5, '#fff') + C(6, -36, 5, '#fff') + C(16, -32, 5, '#fff') + C(0, -30, 6, '#ff4f8b') + G(cloth(heartD(0, -78, 40), light(c, 0.1)), 'rotate(-24 -30 -30)');
      return o + cloth(heartD(0, -64, 38), light(c, 0.1)) + P(heartD(0, -52, 14), '#fff', 'opacity="0.6"');
    },
  },
  {
    st: 'princess', name: 'Ballerina Music Box', x: { sfx: 'music', h: 90 },
    art: (c, on, s) => {
      let o = box(-34, -34, 68, 34, 6, c) + R(-34, -36, 68, 5, 2, 'url(#g-gold)') + C(0, -18, 5, 'url(#g-gold)') + S('M-26 -10 Q-14 -18 -2 -10 M2 -10 Q14 -18 26 -10', s.trim, 2);
      if (!on) return o + box(-36, -44, 72, 12, 5, light(c, 0.15)) + motif('crown', 0, -50, 9);
      const dancer = `<g><animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="1.6s" repeatCount="indefinite"/>${P('M-10 -50 Q0 -56 10 -50 L0 -44Z', '#ff9ec7')}${R(-1.5, -66, 3, 16, 1.5, '#ffe3d3')}${C(0, -70, 4, '#ffe3d3')}${C(0, -74, 2.5, '#8a5a34')}${Ln(0, -62, 8, -70, '#ffe3d3', 1.5)}${Ln(0, -62, -8, -70, '#ffe3d3', 1.5)}${Ln(0, -44, -2, -36, '#ffe3d3', 1.5)}</g>`;
      return o + R(-34, -84, 68, 46, 5, light(c, 0.15)) + R(-28, -80, 56, 38, 3, '#d9efff') + R(-28, -80, 56, 38, 3, 'url(#g-glass)') + E(0, -37, 10, 3, 'url(#g-gold)') + `<g transform="translate(0 2)">${dancer}</g>` + bob(P(sparkleD(20, -60, 4), '#fff'), -4, 1.2);
    },
  },
  {
    st: 'candy', name: 'Cupcake Jewel Box',
    art: (c, on, s) => {
      let o = P('M-30 -32 L30 -32 L24 0 L-24 0Z', s.accent) + S('M-18 -30 L-15 -2 M-6 -30 L-5 -2 M6 -30 L5 -2 M18 -30 L15 -2', dark(s.accent, 0.15), 2);
      const lid = C(-18, -38, 14, c) + C(18, -38, 14, c) + C(0, -46, 18, c) + C(0, -66, 6, '#e8384f') + C(-2, -68, 2, '#fff') + [[-14, -46], [10, -52], [16, -40], [-6, -38]].map(([x, y], i) => R(x, y, 6, 2.5, 1.2, TOYC[i])).join('');
      if (on) return o + C(-10, -34, 7, 'none', 'stroke="#ffd24a" stroke-width="3"') + C(10, -34, 5, '#5fd3b5') + G(lid, 'translate(26 -26) rotate(28)');
      return o + lid;
    },
  },
]);

// ---------------- bedside lamps (props) ----------------
const LAMPS = fam('bedlamp', 'Bedside Lamps', 'bedroom', { mount: 'prop', w: 70, h: 100, toggle: true }, [
  {
    st: 'sweet', name: 'Heart Lamp',
    art: (c, on, s) => (on ? glow(0, -60, 70) : '') + E(0, -4, 20, 5, s.metal) + R(-3, -30, 6, 26, 3, s.metal) + cloth(heartD(0, -92, 44), on ? '#fff3c8' : c) + P(heartD(-10, -82, 10), '#fff', 'opacity="0.6"'),
  },
  {
    st: 'space', name: 'Rocket Lamp', x: { h: 110 },
    art: (c, on, s) => (on ? glow(0, -60, 70) : '') + P('M-14 -20 L-28 0 L-14 0Z', s.soft) + P('M14 -20 L28 0 L14 0Z', s.soft) + cloth('M-16 -6 L-16 -70 Q-16 -92 0 -106 Q16 -92 16 -70 L16 -6Z', c) + P('M-12 -84 Q-6 -100 0 -106 Q6 -100 12 -84Z', s.accent) +
      C(0, -60, 9, s.metal) + C(0, -60, 6, on ? '#fff3a0' : '#9fd6ff') + (on ? G(flame(0, 0, 0.5), 'translate(0 -6) scale(1 -1)') : '') + R(-16, -12, 32, 6, 3, s.metal),
  },
  {
    st: 'woodland', name: 'Toadstool Lamp',
    art: (c, on, s) => (on ? glow(0, -54, 70) : '') + E(0, -4, 26, 6, c) + C(-16, -6, 6, light(c, 0.1)) + P('M-9 -4 Q-12 -30 -7 -40 L7 -40 Q12 -30 9 -4Z', '#fff3e6') + P('M-32 -38 Q-32 -80 0 -80 Q32 -80 32 -38Z', on ? '#ffd9a0' : s.accent) + P('M-32 -38 Q-32 -80 0 -80 Q32 -80 32 -38Z', 'url(#g-shadeX)') + C(-14, -58, 5, '#fff') + C(10, -66, 4, '#fff') + C(18, -50, 3, '#fff'),
  },
  {
    st: 'beach', name: 'Lighthouse Lamp', x: { h: 120 },
    art: (c, on) => (on ? glow(0, -96, 70) : '') + P('M-18 0 L18 0 L12 -80 L-12 -80Z', '#ffffff') + P('M-16 -24 L16 -24 L15 -40 L-15 -40Z', c) + P('M-13 -56 L13 -56 L12 -72 L-12 -72Z', c) + P('M-18 0 L18 0 L12 -80 L-12 -80Z', 'url(#g-shadeX)') +
      R(-16, -84, 32, 6, 3, '#4a4a5e') + R(-10, -104, 20, 20, 4, on ? '#fff3a0' : '#cfe9ff') + P('M-14 -104 L0 -116 L14 -104Z', c) + C(0, -118, 3, '#4a4a5e'),
  },
  {
    st: 'rainbow', name: 'Rainbow Cloud Lamp',
    art: (c, on) => (on ? glow(0, -50, 80) : '') + R(-26, -8, 52, 8, 4, c) + RB.slice(0, 4).map((col, i) => S(`M${-30 + i * 6} -40 A${30 - i * 6} ${30 - i * 6} 0 0 1 ${30 - i * 6} -40`, col, 6)).join('') + cloud(-24, -36, 0.55, on ? '#fffbe6' : '#ffffff') + cloud(22, -34, 0.5, on ? '#fffbe6' : '#ffffff') + R(-3, -24, 6, 18, 3, c),
  },
]);

// ================= kids & play =================
// ---------------- play tents ----------------
const bunting = (x1: number, y1: number, x2: number, y2: number, n: number, cols: string[]) => {
  let o = S(`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 16} ${x2} ${y2}`, '#ffffff', 1.5);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + 16 * 2 * t * (1 - t) * 2;
    o += P(`M${f(x - 8)} ${f(y)} L${f(x + 8)} ${f(y)} L${f(x)} ${f(y + 16)}Z`, cols[i % cols.length]);
  }
  return o;
};
const fairy = (x1: number, x2: number, y: number, sag: number, n: number) => {
  let o = S(`M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}`, '#8a7a6a', 1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    o += blink(C(x1 + (x2 - x1) * t, y + sag * 4 * t * (1 - t), 3.5, ['#fff6a0', '#ffc7dc', '#bfe8ff'][i % 3]), 1.6 + (i % 3) * 0.4, i * 0.2);
  }
  return o;
};
const cushion = (c: string) => box(-70, -30, 140, 26, 13, c, 'none', 'y') + E(-30, -36, 26, 14, light(c, 0.3));
const TENTS = fam('playtent', 'Play Tents', 'kids', { mount: 'floor', w: 290, h: 340, seats: [sit(0, -44)] }, [
  {
    st: 'sweet', name: 'Sweetheart Teepee',
    art: (c, _on, s) => {
      let o = Ln(-120, 0, 30, -340, s.wood, 7) + Ln(120, 0, -30, -340, s.wood, 7) + Ln(-60, 0, 10, -338, dark(s.wood, 0.1), 6);
      o += cloth('M-136 0 L0 -300 L136 0Z', c, 'hearts') + P('M-70 0 L0 -210 L70 0Z', '#6a4a6a') + fairy(-46, 46, -130, 14, 6) + cushion(s.soft);
      return o + bunting(-90, -190, 90, -190, 7, ['#ffffff', '#ffd36b', '#7cc8ff', s.soft]);
    },
    front: (c) => P('M0 -210 L-70 0 L-104 0 Q-64 -60 -50 -96 Q-30 -150 0 -210Z', light(c, 0.2)) + P('M0 -210 L70 0 L104 0 Q64 -60 50 -96 Q30 -150 0 -210Z', light(c, 0.2)) + G(bowG(0, 0, 0.6, '#ffffff'), 'translate(-56 -96)') + G(bowG(0, 0, 0.6, '#ffffff'), 'translate(56 -96)'),
  },
  {
    st: 'princess', name: 'Royal Pavilion', x: { h: 370 },
    art: (c, _on, s) => {
      let o = '';
      for (let i = 0; i < 8; i++) o += R(-120 + i * 30, -220, 30, 220, 0, i % 2 ? '#ffffff' : c);
      o += R(-120, -220, 240, 220, 4, 'url(#g-shadeX)') + P('M-60 0 L-60 -120 Q-60 -170 0 -170 Q60 -170 60 -120 L60 0Z', '#6a4a6a') + fairy(-44, 44, -130, 10, 5) + cushion(s.soft);
      o += cloth('M-140 -214 L0 -330 L140 -214Z', c, 'hearts') + P(`M-140 -214 H140 V-206${scallop(140, -140, -206, 10, 5)}Z`, '#ffffff') + R(-140, -216, 280, 4, 2, s.trim);
      return o + Ln(0, -330, 0, -366, s.trim, 3) + P('M0 -366 L30 -358 L0 -350Z', c) + C(0, -330, 6, 'url(#g-gold)') + motif('crown', 0, -260, 18);
    },
    front: (c, _on, s) => P('M-60 -170 Q-30 -170 -20 -150 Q-44 -90 -60 -60 L-88 0 L-62 0Z', light(c, 0.15)) + P('M60 -170 Q30 -170 20 -150 Q44 -90 60 -60 L88 0 L62 0Z', light(c, 0.15)) + C(-56, -70, 6, s.trim) + C(56, -70, 6, s.trim),
  },
  {
    st: 'space', name: 'Rocket Tent', x: { h: 380 },
    art: (c, _on, s) => {
      let o = P('M-110 -110 L-150 0 L-110 0Z', s.soft) + P('M110 -110 L150 0 L110 0Z', s.soft);
      o += cloth('M-110 0 L-110 -200 Q-110 -320 0 -376 Q110 -320 110 -200 L110 0Z', c, 'stars') + P('M-50 -332 Q-24 -364 0 -376 Q24 -364 50 -332Z', s.accent) + R(-110, -230, 220, 10, 4, s.metal);
      o += porthole(0, -276, 20, s.metal) + P('M-56 0 L-56 -110 Q-56 -160 0 -160 Q56 -160 56 -110 L56 0Z', '#2a2a50') + twinkle(-20, -120, 5, '#fff', 1.6) + twinkle(24, -90, 4, s.accent, 2.2, 0.5) + cushion(s.soft);
      return o + twinkle(-80, -170, 7, s.accent, 2) + twinkle(80, -200, 6, '#fff', 1.7, 0.7);
    },
    front: (c, _on, s) => P('M-56 -160 Q-20 -160 -20 -130 Q-40 -80 -56 -60 L-56 0 L-80 0 L-80 -120Z', light(c, 0.1)) + P('M56 -160 Q20 -160 20 -130 Q40 -80 56 -60 L56 0 L80 0 L80 -120Z', light(c, 0.1)) + C(-50, -70, 6, s.accent) + C(50, -70, 6, s.accent),
  },
  {
    st: 'woodland', name: 'Camping Tent', x: { w: 320, h: 270 },
    art: (c, _on, s) => {
      let o = S('M-150 0 L-110 -150 M150 0 L110 -150', '#c9b48a', 1.5) + R(-152, -6, 6, 8, 2, '#8a7a6a') + R(146, -6, 6, 8, 2, '#8a7a6a');
      o += cloth('M-140 0 L0 -240 L140 0Z', c, 'none') + P('M0 -240 L140 0 L110 0 L0 -210Z', dark(c, 0.1)) + P('M-64 0 L0 -170 L64 0Z', '#4a3f3a') + cushion(s.soft);
      o += Ln(0, -240, 0, -258, s.wood, 6) + S('M-6 -140 V-120', '#8a7a6a', 1.5) + R(-12, -120, 12, 18, 3, '#ffd36b', 'opacity="0.9"') + C(-6, -111, 10, '#fff6a0', 'opacity="0.35"');
      return o + leaf(-120, -10, 14, '#ffab5e', -40) + mushroom(130, 0, 0.6, s.accent);
    },
    front: (c, _on, s) => P('M0 -170 L-64 0 L-96 0 Q-60 -50 -46 -80 Q-30 -120 0 -170Z', light(c, 0.15)) + P('M0 -170 L64 0 L96 0 Q60 -50 46 -80 Q30 -120 0 -170Z', light(c, 0.15)) + C(-52, -82, 5, s.accent) + C(52, -82, 5, s.accent),
  },
  {
    st: 'boho', name: 'Pom-Pom Teepee', x: { h: 360 },
    art: (c, _on, s) => {
      let o = Ln(-120, 0, 34, -350, s.wood, 7) + Ln(120, 0, -34, -350, s.wood, 7) + Ln(-30, 0, 4, -350, dark(s.wood, 0.1), 6);
      o += cloth('M-136 0 L0 -300 L136 0Z', c) + P('M-100 -80 L100 -80 L92 -60 L-92 -60Z', s.accent);
      for (let i = 0; i < 9; i++) o += P(`M${-90 + i * 20} -80 l10 -12 l10 12Z`, s.accent);
      o += P('M-70 0 L0 -210 L70 0Z', '#6a4a4a') + fairy(-46, 46, -130, 14, 6) + cushion(s.accent);
      o += C(0, -246, 14, 'none', `stroke="${s.wood}" stroke-width="2"`) + S('M-8 -246 L8 -246 M0 -254 L0 -238', s.wood, 1) + [-8, 0, 8].map((x) => Ln(x, -232, x, -212, s.wood, 1) + leaf(x, -204, 6, '#fff', 180)).join('');
      return o;
    },
    front: (c, _on, s) => {
      let o = P('M0 -210 L-70 0 L-104 0 Q-64 -60 -50 -96 Q-30 -150 0 -210Z', light(c, 0.2)) + P('M0 -210 L70 0 L104 0 Q64 -60 50 -96 Q30 -150 0 -210Z', light(c, 0.2));
      for (let i = 1; i < 6; i++) o += C(-i * 13, -210 + i * 38, 6, [s.accent, '#ffd36b', '#fff'][i % 3]) + C(i * 13, -210 + i * 38, 6, [s.accent, '#ffd36b', '#fff'][i % 3]);
      return o;
    },
  },
]);

// ---------------- dollhouses ----------------
/** Tiny rooms seen when a dollhouse is opened. */
function tinyRooms(x1: number, x2: number, yt: number, yb: number, walls: string[]): string {
  const mid = (x1 + x2) / 2;
  const ym = (yt + yb) / 2;
  let o = R(x1, yt, mid - x1, ym - yt, 2, walls[0]) + R(mid, yt, x2 - mid, ym - yt, 2, walls[1]) + R(x1, ym, mid - x1, yb - ym, 2, walls[2]) + R(mid, ym, x2 - mid, yb - ym, 2, walls[3]);
  o += R(x1, ym - 5, x2 - x1, 6, 1, '#c98a5a') + R(x1, yb - 5, x2 - x1, 5, 1, '#c98a5a') + R(mid - 2, yt, 4, yb - yt, 1, '#ffffff');
  // bedroom: tiny bed
  o += R(x1 + 8, ym - 20, 40, 10, 3, '#ff9ec7') + R(x1 + 6, ym - 28, 6, 23, 2, '#c98a5a') + E(x1 + 18, ym - 22, 7, 4, '#fff') + R(x1 + 56, ym - 30, 3, 12, 1, '#c98a5a') + P(`M${x1 + 50} ${ym - 30} L${x1 + 65} ${ym - 30} L${x1 + 62} ${ym - 38} L${x1 + 53} ${ym - 38}Z`, '#ffd36b');
  // bath: tiny tub
  o += P(`M${mid + 8} ${ym - 22} H${mid + 46} Q${mid + 46} ${ym - 6} ${mid + 27} ${ym - 6} Q${mid + 8} ${ym - 6} ${mid + 8} ${ym - 22}Z`, '#ffffff') + C(mid + 20, ym - 26, 4, '#bfe8ff') + C(mid + 28, ym - 28, 3, '#bfe8ff');
  // living: sofa and picture
  o += R(x1 + 8, yb - 22, 46, 14, 5, '#7cc8ff') + R(x1 + 8, yb - 30, 46, 10, 4, '#5fb0ef') + R(x1 + 20, yb - 52, 18, 14, 2, '#ffffff') + R(x1 + 22, yb - 50, 14, 10, 1, '#a8e6cf');
  // kitchen: stove and table
  o += R(mid + 8, yb - 34, 24, 30, 3, '#ffffff') + R(mid + 11, yb - 26, 18, 12, 2, '#4a4a5e') + R(mid + 38, yb - 22, 30, 4, 2, '#c98a5a') + R(mid + 41, yb - 18, 3, 13, 1, '#c98a5a') + R(mid + 62, yb - 18, 3, 13, 1, '#c98a5a') + C(mid + 52, yb - 26, 4, '#ff7a6b');
  return o;
}
const win = (x: number, y: number, w: number, h: number, frame: string, shutter?: string) =>
  (shutter ? R(x - w / 2 - 9, y - h / 2, 8, h, 2, shutter) + R(x + w / 2 + 1, y - h / 2, 8, h, 2, shutter) : '') + R(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 4, frame) + R(x - w / 2, y - h / 2, w, h, 2, '#cfe9ff') + R(x - w / 2, y - h / 2, w, h, 2, 'url(#g-glass)') + Ln(x, y - h / 2, x, y + h / 2, frame, 2) + Ln(x - w / 2, y, x + w / 2, y, frame, 2);
const DOLLHOUSES = fam('dollhouse', 'Dollhouses', 'kids', { mount: 'floor', w: 230, h: 280, toggle: true }, [
  {
    st: 'sweet', name: 'Sweetheart Dollhouse',
    art: (c, on, s) => {
      let o = box(-104, -196, 208, 196, 6, c) + P('M-122 -190 L0 -276 L122 -190 L110 -184 L0 -260 L-110 -184Z', dark(c, 0.15)) + P('M-110 -192 L0 -266 L110 -192Z', light(c, 0.35)) + P(`M-112 -192${scallop(-112, 112, -192, 10, 4)}`, 'none', 'stroke="#fff" stroke-width="4"');
      o += C(0, -222, 18, '#fff') + P(heartD(0, -232, 18), '#ff7eb6');
      if (on) return o + tinyRooms(-96, 96, -184, -8, ['#fff3f8', '#e6f6ff', '#fff8e0', '#eafff4']);
      o += win(-52, -140, 40, 40, '#fff', s.soft) + win(52, -140, 40, 40, '#fff', s.soft) + win(-52, -60, 40, 40, '#fff', s.soft);
      o += P('M30 0 L30 -66 Q30 -86 52 -86 Q74 -86 74 -66 L74 0Z', s.soft) + C(64, -40, 3.5, s.metal) + P(heartD(52, -76, 8), c);
      return o + box(-74, -36, 44, 10, 3, '#fff') + flowerG(-64, -40, 6, '#ff7eb6') + flowerG(-50, -42, 6, '#fff3b0') + flowerG(-38, -40, 6, '#ff7eb6');
    },
  },
  {
    st: 'princess', name: 'Mini Castle', x: { w: 250, h: 300 },
    art: (c, on, s) => {
      const tower = (x: number) => box(x - 24, -230, 48, 230, 4, light(c, 0.15)) + P(`M${x - 30} -226 L${x} -290 L${x + 30} -226Z`, c) + Ln(x, -290, x, -306, s.trim, 2) + P(`M${x} -306 L${x + 16} -301 L${x} -296Z`, '#ff7eb6') + R(x - 8, -200, 16, 22, 8, '#6a4a6a');
      let o = tower(-98) + tower(98) + box(-76, -186, 152, 186, 2, '#ffffff');
      for (let i = 0; i < 6; i++) o += R(-76 + i * 27, -200, 18, 16, 2, '#ffffff');
      o += motif('crown', 0, -214, 14);
      if (on) return o + tinyRooms(-70, 70, -180, -6, ['#fff3f8', '#f3eaff', '#fff8e0', '#ffeef4']);
      o += win(-36, -130, 28, 36, s.trim) + win(36, -130, 28, 36, s.trim) + P('M-26 0 L-26 -50 Q-26 -76 0 -76 Q26 -76 26 -50 L26 0Z', c) + Ln(0, -76, 0, 0, dark(c, 0.15), 2) + C(-6, -36, 3, s.trim) + C(6, -36, 3, s.trim);
      return o + P(heartD(0, -112, 10), c);
    },
  },
  {
    st: 'cottage', name: 'Thatched Dollhouse',
    art: (c, on, s) => {
      let o = box(-100, -184, 200, 184, 6, '#fff8ec') + R(-104, -10, 208, 10, 4, s.wood);
      o += P('M-126 -170 Q-120 -270 0 -280 Q120 -270 126 -170 Q0 -150 -126 -170Z', '#e8c88a') + P('M-126 -170 Q-120 -270 0 -280 Q120 -270 126 -170 Q0 -150 -126 -170Z', 'url(#g-shadeY)');
      for (let i = 0; i < 9; i++) o += S(`M${-100 + i * 25} -170 Q${-96 + i * 24} -220 ${-70 + i * 17} -264`, '#c9a86a', 2, 'opacity="0.8"');
      o += R(60, -270, 20, 40, 3, '#c98a5a');
      if (on) return o + tinyRooms(-94, 94, -164, -12, ['#fff8ec', '#eafff4', '#fff3f8', '#fff8e0']);
      o += win(-54, -116, 36, 34, s.wood, c) + win(54, -116, 36, 34, s.wood, c) + box(-74, -96, 40, 8, 3, s.wood) + box(34, -96, 40, 8, 3, s.wood);
      for (const x of [-54, 54]) o += flowerG(x - 12, -100, 5, '#ff9ec7') + flowerG(x, -102, 5, '#fff3b0') + flowerG(x + 12, -100, 5, '#ff9ec7');
      return o + P('M-22 -10 L-22 -50 Q-22 -72 0 -72 Q22 -72 22 -50 L22 -10Z', c) + C(12, -36, 3, s.metal) + leaf(-90, -10, 14, '#6fae6b', -20) + leaf(-80, -10, 12, '#8fd18f', 20);
    },
  },
  {
    st: 'modern', name: 'Modern Dollhouse', x: { w: 250, h: 240 },
    art: (c, on, s) => {
      let o = box(-116, -110, 232, 110, 3, c) + box(-90, -214, 150, 104, 3, light(c, 0.2)) + R(-120, -114, 240, 8, 2, s.accent) + R(-94, -218, 158, 8, 2, s.accent) + R(60, -110, 56, 4, 2, '#7cc8ff', 'opacity="0.5"');
      if (on) return o + tinyRooms(-110, 110, -104, -6, ['#f6f6f9', '#eef4ff', '#fff8ec', '#f3f9f3']).replace(/#c98a5a/g, '#c9a27e') + R(-84, -206, 138, 88, 2, '#fbfbfd') + R(-74, -146, 40, 12, 4, '#9aa3b5') + C(20, -170, 12, '#ffd36b');
      for (let i = 0; i < 4; i++) o += R(-108 + i * 26, -100, 4, 90, 1, s.wood);
      o += R(-4, -98, 110, 70, 2, '#cfe9ff') + R(-4, -98, 110, 70, 2, 'url(#g-glass)') + Ln(50, -98, 50, -28, s.accent, 2) + R(-80, -200, 120, 60, 2, '#cfe9ff') + R(-80, -200, 120, 60, 2, 'url(#g-glass)');
      return o + R(-40, -60, 24, 50, 2, s.wood) + leaf(80, -114, 12, '#6fbf73', -20) + leaf(86, -114, 14, '#5fae6b', 20);
    },
  },
]);

// ---------------- rocking horses ----------------
const ROCK = { pivot: [0, 60] as [number, number], amp: 6, dur: 1.8 };
const rockSeat = [{ x: 0, y: -132, pose: 'sit' as const, anim: ROCK }];
const rocking = (on: boolean, inner: string) => (on ? `<g>${rockA(ROCK.pivot[0], ROCK.pivot[1], ROCK.amp, ROCK.dur)}${inner}</g>` : `<g>${inner}</g>`);
const rockers = (c: string) => S('M-120 -30 Q0 14 120 -30', dark(c, 0.15), 16) + S('M-120 -30 Q0 14 120 -30', c, 10) + C(-120, -30, 8, c) + C(120, -30, 8, c);
function horse(o: { body: string; mane: string; saddle: string; rock: string; legs?: string; horn?: string; spots?: boolean }): string {
  const b = o.body;
  let s = rockers(o.rock);
  for (const [x, d] of [[-52, -1], [-36, 1], [40, -1], [56, 1]] as const) s += S(`M${x} -100 L${x + d * 8} -16`, o.legs ?? dark(b, 0.08), 12);
  s += P('M-64 -112 Q-104 -120 -100 -78 Q-96 -60 -84 -66 Q-96 -94 -64 -100Z', o.mane);
  s += E(0, -112, 72, 34, b) + E(0, -112, 72, 34, 'url(#g-shadeY)');
  s += P('M36 -130 Q50 -170 70 -196 L100 -186 Q80 -150 70 -110Z', b) + E(92, -194, 32, 20, b, 'transform="rotate(20 92 -194)"') + E(112, -184, 14, 11, light(b, 0.25), 'transform="rotate(20 112 -184)"');
  s += P('M76 -212 L80 -236 L92 -212Z', b) + C(96, -200, 4, '#2d2a3a') + C(97, -201, 1.4, '#fff') + E(106, -190, 5, 3, '#ff9ec7', 'opacity="0.7"') + C(118, -184, 2, dark(b, 0.4));
  if (o.horn) s += P('M84 -214 L98 -258 L96 -210Z', o.horn) + S('M86 -222 L95 -226 M88 -234 L96 -238', '#fff', 1.5, 'opacity="0.7"');
  s += P('M70 -212 Q56 -200 52 -176 Q44 -160 40 -136 Q50 -148 54 -160 Q60 -150 58 -140 Q66 -160 64 -176 Q70 -180 72 -196Z', o.mane);
  if (o.spots) s += C(-30, -120, 8, light(b, 0.3)) + C(-6, -100, 6, light(b, 0.3)) + C(-40, -96, 5, light(b, 0.3));
  s += P('M-40 -140 Q0 -156 36 -140 L30 -110 Q0 -100 -34 -110Z', o.saddle) + R(-4, -108, 8, 40, 3, dark(o.saddle, 0.2)) + C(0, -70, 7, '#c9cfdd');
  return s + R(58, -170, 30, 7, 3.5, 'url(#g-gold)');
}
const ROCKERS = fam('rockinghorse', 'Rocking Horses', 'kids', { mount: 'floor', w: 260, h: 270, seats: rockSeat, animWhenUsed: true }, [
  {
    st: 'sweet', name: 'Sweetheart Pony',
    art: (c, on, s) => rocking(on, horse({ body: c, mane: '#ffffff', saddle: s.soft, rock: s.wood }) + P(heartD(0, -140, 12), c)),
  },
  {
    st: 'princess', name: 'Unicorn Rocker',
    art: (c, on, s) => {
      const mane = `url(#g-rainbow)`;
      return rocking(on, horse({ body: '#ffffff', mane, saddle: c, rock: c, horn: 'url(#g-gold)', legs: '#f6eef6' }) + motif('crown', 0, -132, 10));
    },
  },
  {
    st: 'cottage', name: 'Dapple Wood Horse',
    art: (c, on, s) => rocking(on, horse({ body: s.wood, mane: dark(s.wood, 0.35), saddle: c, rock: light(s.wood, 0.1), spots: true }) + motif('daisy', -26, -126, 7)),
  },
  {
    st: 'beach', name: 'Whale Rocker',
    art: (c, on, s) => rocking(on,
      rockers(s.wood) + E(-30, -40, 12, 30, dark(c, 0.1)) + E(40, -40, 12, 30, dark(c, 0.1)) +
      P('M-110 -110 Q-150 -150 -150 -180 Q-126 -160 -110 -150 Q-120 -176 -100 -196 Q-100 -160 -86 -132Z', c) +
      cloth('M-100 -110 Q-90 -164 0 -164 Q110 -164 118 -100 Q120 -60 60 -54 L-50 -54 Q-104 -60 -100 -110Z', c) + P('M-70 -80 Q20 -40 112 -90 Q110 -60 60 -54 L-50 -54 Q-70 -60 -70 -80Z', '#ffffff', 'opacity="0.9"') +
      C(70, -118, 6, '#2d2a3a') + C(71, -120, 2, '#fff') + S('M80 -96 Q96 -90 108 -100', '#2d2a3a', 3) + E(84, -104, 7, 4, '#ff9ec7', 'opacity="0.7"') +
      bob(S('M30 -168 Q20 -196 6 -204 M30 -168 Q40 -196 54 -204', '#bfe8ff', 4) + C(6, -206, 5, '#bfe8ff') + C(54, -206, 5, '#bfe8ff') + C(30, -200, 4, '#bfe8ff'), -6, 1.4) +
      P('M-40 -160 Q0 -172 40 -160 L36 -140 Q0 -132 -36 -140Z', s.accent) + R(50, -176, 28, 7, 3.5, s.metal)),
  },
  {
    st: 'space', name: 'Rocket Rocker',
    art: (c, on, s) => rocking(on,
      rockers(s.metal) + S('M-50 -70 L-44 -16 M50 -70 L44 -16', s.metal, 10) +
      P('M-90 -110 L-130 -160 L-110 -110Z', s.soft) + P('M-90 -80 L-130 -40 L-104 -78Z', s.soft) +
      cloth('M-110 -136 L60 -136 Q124 -124 132 -100 Q124 -76 60 -64 L-110 -64Z', c, 'none', 'y') + P('M80 -132 Q124 -122 132 -100 Q124 -78 80 -68Z', s.accent) +
      porthole(30, -100, 12, s.metal) + R(-110, -136, 10, 72, 2, s.metal) + G(flame(0, 0, 0.7), 'translate(-118 -100) rotate(-90)') +
      P('M-46 -150 Q0 -160 36 -150 L32 -134 Q0 -128 -42 -134Z', s.soft) + R(54, -160, 26, 7, 3.5, s.accent) + R(64, -160, 6, 24, 3, s.metal) + twinkle(-70, -40, 6, s.accent, 2)),
  },
]);

// ---------------- ball pits ----------------
const BPC = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ffffff'];
function balls(x1: number, x2: number, y: number, r: number, cols: string[], seed: number, rows = 1): string {
  let o = '';
  for (let j = 0; j < rows; j++) {
    const n = Math.floor((x2 - x1) / (r * 1.7));
    for (let i = 0; i < n; i++) {
      const x = x1 + r + i * ((x2 - x1 - 2 * r) / Math.max(1, n - 1)) + (j % 2 ? r * 0.8 : 0);
      if (x > x2 - r * 0.5) continue;
      const yy = y - j * r * 1.4 - (((i * 7 + seed + j * 3) % 5) - 2) * 2.5;
      const col = cols[(i * 3 + seed + j) % cols.length];
      o += C(x, yy, r, col) + C(x, yy, r, 'url(#g-shadeX)', 'opacity="0.6"') + C(x - r * 0.35, yy - r * 0.35, r * 0.28, '#fff', 'opacity="0.6"');
    }
  }
  return o;
}
const PIT_SEAT = [sit(0, -56)];
const BALLPITS = fam('ballpit', 'Ball Pits', 'kids', { mount: 'floor', w: 310, h: 150, seats: PIT_SEAT }, [
  {
    st: 'sweet', name: 'Sweetheart Ball Pit',
    art: (c) => E(0, -96, 150, 26, dark(c, 0.12)) + E(0, -96, 140, 20, dark(c, 0.35)) + balls(-130, 130, -96, 15, BPC, 1, 2),
    front: (c) => cloth('M-150 -96 Q-150 0 -110 0 L110 0 Q150 0 150 -96 Q0 -60 -150 -96Z', c) + P('M-150 -96 Q0 -60 150 -96', 'none', 'stroke="#fff" stroke-width="8" stroke-linecap="round"') + [-90, -30, 30, 90].map((x, i) => (i % 2 ? C(x, -40, 10, '#fff', 'opacity="0.8"') : P(heartD(x, -52, 14), '#fff', 'opacity="0.8"'))).join('') + balls(-120, 120, -76, 15, BPC, 4),
  },
  {
    st: 'rainbow', name: 'Rainbow Ring Pit',
    art: () => E(0, -110, 150, 26, '#ffd36b') + E(0, -110, 132, 18, '#c99bff') + balls(-124, 124, -104, 15, RB, 2, 2),
    front: () => {
      let o = '';
      RB.slice(0, 5).forEach((col, i) => (o += box(-150, -112 + i * 22, 300, 24, 12, col, 'none', 'y')));
      return o + balls(-120, 120, -108, 15, RB, 5);
    },
  },
  {
    st: 'beach', name: 'Splash Pool Pit',
    art: (c) => E(0, -92, 150, 24, dark(c, 0.1)) + E(0, -92, 138, 18, '#5fb8ef') + balls(-126, 126, -92, 15, ['#ffffff', '#7cc8ff', '#ffd36b', '#4f9dff'], 3, 2),
    front: (c) => cloth('M-150 -92 L-146 -6 Q0 6 146 -6 L150 -92 Q0 -64 -150 -92Z', c) + S('M-146 -50 q18 -10 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0', '#ffffff', 4) + motif('fish', -80, -26, 13) + mini.starfish(70, -10, 0.9) + balls(-124, 124, -72, 15, ['#ffffff', '#7cc8ff', '#ffd36b', '#4f9dff'], 6),
  },
  {
    st: 'candy', name: 'Cupcake Ball Pit', x: { h: 170 },
    art: (c) => E(0, -118, 150, 26, light(c, 0.3)) + E(0, -118, 136, 18, dark(c, 0.2)) + balls(-126, 126, -114, 15, ['#ff4f8b', '#a8e6cf', '#fff3b0', '#c99bff', '#ff9a6b'], 2, 2) + C(60, -156, 12, '#e8384f') + C(57, -160, 3, '#fff'),
    front: (c, _on, s) => {
      let o = P('M-150 -110 L-120 0 L120 0 L150 -110Z', s.accent);
      for (let i = 0; i <= 10; i++) o += Ln(-136 + i * 27.2, -104, -110 + i * 22, -4, dark(s.accent, 0.15), 2.5);
      return o + P('M-150 -110 L-120 0 L120 0 L150 -110Z', 'url(#g-shadeX)') + P(`M-158 -118 H158 V-108${scallop(158, -158, -108, 12, 6)}Z`, c) + balls(-120, 120, -114, 15, ['#ff4f8b', '#a8e6cf', '#fff3b0', '#c99bff'], 5);
    },
  },
]);

// ---------------- easels ----------------
function easel(frame: string, paint: string, tray = '#ffffff'): string {
  let o = Ln(0, -260, 0, -10, dark(frame, 0.1), 8) + Ln(-12, -250, -70, 0, frame, 10) + Ln(12, -250, 70, 0, frame, 10);
  o += R(-76, -246, 152, 140, 6, '#ffffff') + R(-76, -246, 152, 140, 6, 'none', 'stroke="#e6dcef" stroke-width="2"') + R(-70, -240, 140, 128, 3, '#fbf8f2') + paint;
  o += R(-86, -108, 172, 12, 5, frame) + box(-60, -120, 18, 14, 3, '#ff7eb6') + box(-36, -120, 18, 14, 3, '#7cc8ff') + box(-12, -120, 18, 14, 3, '#ffd36b');
  return o + Ln(30, -112, 64, -134, '#c98a5a', 4) + E(66, -136, 4, 6, tray, 'transform="rotate(50 66 -136)"');
}
const EASELS = fam('easel', 'Easels', 'kids', { mount: 'floor', w: 180, h: 270 }, [
  {
    st: 'sweet', name: 'Heart Art Easel',
    art: (c, _on, s) => easel(s.wood === '#f6e3d6' ? '#e8c8b4' : s.wood, R(-70, -240, 140, 128, 3, light(c, 0.7)) + P(heartD(-10, -224, 50), c) + flowerG(44, -150, 14, '#ffd36b', '#ff7eb6') + flowerG(-50, -140, 10, '#7cc8ff') + S('M44 -136 V-118 M-50 -130 V-118', '#6fae6b', 3) + P(sparkleD(46, -214, 9), '#ffd36b'), c),
  },
  {
    st: 'rainbow', name: 'Chalkboard Easel',
    art: (c) => {
      let o = Ln(-12, -270, -80, 0, c, 12) + Ln(12, -270, 80, 0, c, 12) + R(-70, -284, 140, 20, 10, '#ffffff') + R(-74, -276, 8, 8, 4, c) + R(66, -276, 8, 8, 4, c);
      o += box(-84, -258, 168, 150, 8, c) + R(-74, -248, 148, 130, 4, '#3f5a52');
      RB.slice(0, 5).forEach((col, i) => (o += S(`M${-54 + i * 7} -150 A${54 - i * 7} ${54 - i * 7} 0 0 1 ${54 - i * 7} -150`, col, 4, 'opacity="0.85"')));
      o += S('M-40 -220 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M-40 -236 v-6 M-40 -198 v6 M-56 -220 h-6 M-24 -220 h6', '#fff3a0', 2.5) + S('M40 -150 m0 -20 a6 6 0 1 0 0.1 0 M40 -164 v20 M40 -150 l-8 10 M40 -150 l8 10 M30 -160 h20', '#ffffff', 2.5);
      return o + R(-84, -110, 168, 10, 4, dark(c, 0.15)) + R(-60, -118, 18, 6, 3, '#fff') + R(-30, -118, 18, 6, 3, '#ff9ec7') + R(0, -118, 18, 6, 3, '#7cc8ff');
    },
  },
  {
    st: 'cottage', name: 'Landscape Easel',
    art: (c, _on, s) => easel(s.wood, R(-70, -240, 140, 70, 3, '#cfe9ff') + C(40, -214, 14, '#ffd36b') + cloud(-30, -212, 0.5) + P('M-70 -150 Q-30 -196 10 -168 Q40 -196 70 -170 L70 -112 L-70 -112Z', c) + P('M-70 -130 Q0 -160 70 -132 L70 -112 L-70 -112Z', dark(c, 0.12)) + R(-34, -170, 30, 24, 2, '#fff8ec') + P('M-40 -170 L-19 -188 L2 -170Z', '#ff7a6b') + R(-24, -160, 8, 14, 1, '#c98a5a') + flowerG(40, -130, 5, '#ff9ec7') + flowerG(54, -126, 5, '#fff')),
  },
  {
    st: 'space', name: 'Galaxy Easel',
    art: (c, _on, s) => easel(s.metal, R(-70, -240, 140, 128, 3, c) + C(-30, -190, 22, '#ff9ec7') + E(-30, -190, 36, 8, 'none', `stroke="${s.accent}" stroke-width="3"`) + C(40, -150, 12, '#5fd3b5') + motif('rocket', 30, -214, 14) +
      [[-56, -226, 5], [10, -230, 4], [56, -180, 5], [-50, -130, 4], [0, -140, 6]].map(([x, y, r], i) => twinkle(x, y, r, i % 2 ? '#fff' : s.accent, 1.6 + i * 0.3, i * 0.3)).join(''), s.accent),
  },
]);

// ---------------- toy kitchens ----------------
const burner = (x: number, y: number, on: boolean) => E(x, y, 26, 6, '#2d2a3a') + E(x, y, 18, 4, 'none', `stroke="${on ? '#ff7a5c' : '#5a5a6e'}" stroke-width="3"`) + (on ? `<ellipse cx="${x}" cy="${y}" rx="24" ry="6" fill="#ffab5e" opacity="0.4"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.2s" repeatCount="indefinite"/></ellipse>` : '');
const pot = (x: number, y: number, c: string, on: boolean) => P(`M${x - 18} ${y - 4} L${x + 18} ${y - 4} L${x + 15} ${y - 28} L${x - 15} ${y - 28}Z`, c) + R(x - 20, y - 32, 40, 6, 3, dark(c, 0.15)) + R(x - 4, y - 38, 8, 6, 3, dark(c, 0.15)) +
  (on ? [0, 1, 2].map((i) => `<circle cx="${x - 8 + i * 8}" cy="${y - 40}" r="3" fill="#fff" opacity="0.8"><animate attributeName="cy" values="${y - 40};${y - 70}" dur="${1.4 + i * 0.3}s" begin="${i * 0.4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="${1.4 + i * 0.3}s" begin="${i * 0.4}s" repeatCount="indefinite"/></circle>`).join('') : '');
const faucet = (x: number, y: number) => S(`M${x} ${y} V${y - 40} Q${x} ${y - 50} ${x + 12} ${y - 50} L${x + 24} ${y - 50} V${y - 40}`, 'url(#g-silver)', 7) + C(x - 12, y - 8, 5, '#7cc8ff') + C(x + 12, y - 8, 5, '#ff9ec7');
const KITCHENS = fam('toykitchen', 'Toy Kitchens', 'kids', { mount: 'floor', w: 240, h: 250, toggle: true, spawn: ['cupcake', 'cookie', 'pizza'], surfaces: [{ x1: -116, x2: 116, y: -146 }] }, [
  {
    st: 'sweet', name: 'Sweetheart Play Kitchen',
    art: (c, on, s) => {
      let o = box(-108, -246, 216, 100, 12, light(c, 0.3)) + R(-100, -238, 200, 6, 3, '#fff', 'opacity="0.5"') + C(-60, -206, 22, '#fff') + C(-60, -206, 18, light(c, 0.5)) + S('M-60 -206 V-218 M-60 -206 L-50 -200', '#4a3f5e', 2.5) + P(heartD(30, -226, 20), c) + R(40, -186, 60, 6, 3, '#fff') + mini.bunny(80, -186, 0.5);
      o += box(-112, -146, 224, 140, 12, c) + R(-116, -152, 232, 12, 6, '#ffffff') + leg(-96, -10, 10, s.metal, 10) + leg(96, -10, 10, s.metal, 10);
      o += burner(-74, -152, on) + pot(-74, -152, '#ffffff', on) + E(40, -150, 30, 6, '#c9cfdd') + faucet(66, -152);
      o += R(-100, -128, 110, 96, 12, light(c, 0.25)) + R(-90, -114, 90, 60, 8, on ? '#ffb35e' : '#5e4560') + R(-90, -114, 90, 60, 8, 'url(#g-glass)') + R(-80, -46, 70, 6, 3, '#fff') + (on ? glow(-45, -84, 50) : '');
      o += drawer(20, -128, 80, 40, light(c, 0.25), 10) + drawer(20, -80, 80, 48, light(c, 0.25), 10) + P(heartD(60, -112, 8), s.metal) + P(heartD(60, -60, 8), s.metal);
      return o + [-90, -66, -42].map((x) => knob(x, -138, 4, on ? '#ff7a6b' : '#ffffff')).join('');
    },
  },
  {
    st: 'cottage', name: 'Wooden Play Kitchen',
    art: (c, on, s) => {
      let o = box(-108, -250, 216, 104, 6, s.wood) + R(-100, -242, 200, 88, 4, light(c, 0.35));
      for (let i = 0; i < 6; i++) o += R(-100 + i * 34, -242, 32, 88, 0, i % 2 ? light(c, 0.45) : light(c, 0.35));
      o += R(-100, -200, 200, 6, 2, s.wood);
      for (let i = 0; i < 4; i++) o += box(-86 + i * 46, -232, 26, 32, 6, '#ffffff') + R(-86 + i * 46, -232, 26, 8, 3, TOYC[i]) + C(-73 + i * 46, -212, 5, TOYC[(i + 2) % 6], 'opacity="0.8"');
      o += box(-112, -146, 224, 140, 6, s.wood) + R(-116, -152, 232, 12, 4, light(s.wood, 0.2));
      o += burner(-60, -152, on) + pot(-60, -152, c, on) + E(52, -150, 32, 6, '#c9cfdd') + faucet(78, -152);
      o += R(-100, -130, 92, 110, 6, dark(s.wood, 0.1)) + R(-92, -118, 76, 60, 6, on ? '#ffb35e' : '#5e4a40') + R(-92, -118, 76, 60, 6, 'url(#g-glass)') + R(-80, -48, 52, 6, 3, s.metal) + (on ? glow(-54, -88, 46) : '');
      o += Ln(4, -134, 108, -134, s.metal, 3) + cloth(`M4 -134 Q30 -120 56 -134 Q82 -120 108 -134 L106 -16 Q80 -10 56 -16 Q30 -10 6 -16Z`, c, 'check', 'x');
      return o + [-86, -60, -34].map((x) => knob(x, -138, 4, on ? '#ff7a6b' : '#fff3d6')).join('');
    },
  },
  {
    st: 'modern', name: 'Mini Chef Kitchen', x: { w: 270 },
    art: (c, on, s) => {
      let o = box(76, -250, 56, 244, 8, c) + Ln(78, -150, 130, -150, dark(c, 0.15), 2) + R(84, -238, 6, 40, 3, s.accent) + R(84, -140, 6, 40, 3, s.accent);
      o += R(-128, -246, 196, 80, 4, s.wood) + R(-120, -238, 70, 40, 3, '#ffffff') + mini.car(-86, -198, 0.7, '#7cc8ff') + R(-40, -238, 100, 6, 2, '#fff') + G(P('M-12 0 L12 0 L9 -22 L-9 -22Z', '#fff') + leaf(-4, -22, 12, '#6fbf73', -30) + leaf(4, -22, 14, '#5fae6b', 20), 'translate(30 -238)');
      o += box(-132, -146, 208, 140, 4, c) + R(-136, -152, 216, 10, 3, s.accent);
      o += E(-90, -152, 26, 4, '#2d2a3a') + (on ? `<ellipse cx="-90" cy="-152" rx="20" ry="3" fill="none" stroke="#ff7a5c" stroke-width="3"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite"/></ellipse>` : '') + pot(-90, -152, s.soft, on) + E(26, -150, 30, 5, '#c9cfdd') + faucet(52, -152);
      o += R(-124, -130, 96, 100, 4, light(c, 0.1)) + R(-116, -120, 80, 62, 4, on ? '#ffb35e' : '#3d3a52') + R(-116, -120, 80, 62, 4, 'url(#g-glass)') + R(-104, -44, 56, 5, 2.5, s.accent) + (on ? glow(-76, -90, 46) : '');
      for (let i = 0; i < 2; i++) o += R(-20, -130 + i * 52, 88, 46, 4, light(c, 0.1)) + R(10, -110 + i * 52, 28, 4, 2, s.accent);
      return o + leg(-118, -6, 6, s.accent, 8) + leg(62, -6, 6, s.accent, 8);
    },
  },
]);

// ---------------- toy shelves ----------------
const cubbyToys = [
  (x: number, y: number) => mini.teddy(x, y, 1),
  (x: number, y: number) => mini.ball(x, y, 18, '#7cc8ff'),
  (x: number, y: number) => mini.blocks(x, y, 1),
  (x: number, y: number) => mini.duck(x, y, 1.2),
  (x: number, y: number) => mini.bunny(x, y, 0.9),
  (x: number, y: number) => mini.car(x, y, 1),
  (x: number, y: number) => mini.dino(x, y, 1),
  (x: number, y: number) => mini.robot(x, y, 1),
  (x: number, y: number) => mini.doll(x, y, 1.2),
];
const TOYSHELVES = fam('toyshelf', 'Toy Shelves', 'kids', { mount: 'floor', w: 240, h: 210, spawn: TOYS, surfaces: [{ x1: -114, x2: 114, y: -204 }] }, [
  {
    st: 'sweet', name: 'Toy Cubby Shelf',
    art: (c, _on, s) => {
      let o = box(-114, -204, 228, 196, 12, c) + leg(-96, -10, 10, s.metal, 12) + leg(96, -10, 10, s.metal, 12);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
        const x = -102 + i * 70, y = -192 + j * 90;
        o += R(x, y, 64, 80, 8, light(c, 0.35)) + R(x, y, 64, 10, 6, dark(c, 0.15), 'opacity="0.4"') + cubbyToys[[0, 1, 2, 3, 4, 8][j * 3 + i]](x + 32, y + 80);
      }
      return o + P(heartD(0, -226, 18), c);
    },
  },
  {
    st: 'modern', name: 'Bin Grid Shelf',
    art: (c, _on, s) => {
      let o = box(-114, -204, 228, 198, 4, s.wood) + R(-106, -196, 212, 182, 2, dark(s.wood, 0.35));
      const bins = [c, s.soft, '#f4ead9', s.soft, '#f4ead9', c, '#f4ead9', c, s.soft];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const x = -104 + i * 70, y = -194 + j * 60;
        o += R(x - 2, y + 54, 72, 6, 1, s.wood);
        if ((i + j) % 4 === 3) { o += cubbyToys[5 + j](x + 34, y + 54); continue; }
        o += box(x + 4, y + 10, 60, 44, 6, bins[j * 3 + i], 'none', 'y') + R(x + 24, y + 18, 20, 6, 3, '#ffffff', 'opacity="0.7"');
      }
      return o;
    },
  },
  {
    st: 'rainbow', name: 'Rainbow Arch Shelf', x: { h: 240, surfaces: [] },
    art: (c, _on, s) => {
      let o = '';
      RB.slice(0, 5).forEach((col, i) => (o += P(`M${-118 + i * 14} 0 V-110 A${118 - i * 14} ${118 - i * 14} 0 0 1 ${118 - i * 14} -110 V0Z`, col)));
      o += P('M-48 0 V-110 A48 48 0 0 1 48 -110 V0Z', light(c, 0.6)) + R(-118, -76, 236, 8, 3, '#ffffff') + R(-118, -4, 236, 8, 3, '#ffffff');
      return o + mini.teddy(-80, -76, 0.9) + mini.star(0, -136, 1.1) + mini.duck(76, -76, 1) + mini.ball(-80, -4, 16, '#ff7eb6') + mini.blocks(0, -4, 1) + mini.bunny(80, -4, 0.8) + cloud(-94, -228, 0.6) + sunFace(90, -210, 16, s.main);
    },
  },
  {
    st: 'woodland', name: 'Cabin Toy Shelf', x: { h: 260, surfaces: [] },
    art: (c, _on, s) => {
      let o = P('M-124 -186 L0 -256 L124 -186 L112 -180 L0 -240 L-112 -180Z', dark(s.wood, 0.15)) + P('M-108 -186 L0 -246 L108 -186Z', light(s.wood, 0.1)) + C(0, -210, 14, dark(s.wood, 0.35)) + mini.teddy(0, -200, 0.5);
      o += box(-110, -190, 220, 184, 6, s.wood) + R(-100, -180, 200, 166, 4, dark(s.wood, 0.35)) + R(-100, -100, 200, 8, 2, s.wood) + R(-4, -180, 8, 166, 2, s.wood);
      o += leafy(-110, -186, 20, c) + leafy(112, -184, 18, c);
      o += mini.dino(-52, -100, 1.2, c) + mini.bunny(52, -100, 0.9) + mini.car(-50, -14, 1.1, s.accent) + mini.blocks(52, -14, 1);
      return o + mushroom(-96, 0, 0.6, s.accent);
    },
  },
]);

// ---------------- train sets (rugs) ----------------
const TRACK = 'M-150 0 A150 46 0 1 1 150 0 A150 46 0 1 1 -150 0';
const loco = (c: string, s: FurnStyle, rocket = false) => rocket
  ? G(P('M-22 -8 L-22 -30 L12 -30 Q30 -30 34 -19 Q30 -8 12 -8Z', c) + P('M14 -29 Q30 -28 34 -19 Q30 -10 14 -9Z', s.accent) + C(-2, -19, 5, '#cfe9ff') + P('M-22 -30 L-32 -38 L-22 -22Z', s.soft) + C(-14, -4, 5, '#4a4a5e') + C(14, -4, 5, '#4a4a5e'))
  : G(box(-22, -26, 36, 20, 4, c) + box(-22, -42, 18, 18, 3, dark(c, 0.1)) + R(-18, -38, 10, 8, 2, '#cfe9ff') + R(4, -38, 8, 12, 2, '#4a4a5e') + C(16, -16, 5, '#ffd36b') + C(-14, -4, 6, '#4a4a5e') + C(8, -4, 6, '#4a4a5e') + C(-14, -4, 2, '#c9cfdd') + C(8, -4, 2, '#c9cfdd'));
const wagon = (c: string, load = '') => G(box(-18, -24, 36, 18, 4, c) + load + C(-10, -4, 5, '#4a4a5e') + C(10, -4, 5, '#4a4a5e') + Ln(-22, -10, -18, -10, '#4a4a5e', 3));
function trainSet(cars: string[], on: boolean): string {
  if (!on) return cars.map((car, i) => G(car, `translate(${f(60 - i * 50)} 46) scale(-1 1)`)).join('');
  return cars.map((car, i) => {
    const b = f(-i * 0.8);
    return `<g><animateMotion path="${TRACK}" dur="9s" begin="${b}s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="scale" values="1 1;-1 1" keyTimes="0;0.5" calcMode="discrete" dur="9s" begin="${b}s" repeatCount="indefinite"/>${car}</g></g>`;
  }).join('');
}
const track = (rail: string, tie: string) => {
  let o = '';
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const x = Math.cos(a), y = Math.sin(a);
    o += Ln(x * 140, y * 38, x * 160, y * 54, tie, 5);
  }
  return o + E(0, 0, 144, 41, 'none', `stroke="${rail}" stroke-width="3"`) + E(0, 0, 156, 51, 'none', `stroke="${rail}" stroke-width="3"`);
};
const TRAINS = fam('trainset', 'Train Sets', 'kids', { mount: 'rug', w: 360, h: 150, toggle: true }, [
  {
    st: 'rainbow', name: 'Rainbow Express',
    art: (c, on, s) => {
      let o = E(0, 0, 176, 64, light(c, 0.55)) + E(0, 0, 176, 64, 'none', `stroke="${c}" stroke-width="4" stroke-dasharray="10 8"`) + track('#c9cfdd', '#c99bff');
      o += RB.slice(0, 5).map((col, i) => S(`M${-46 + i * 7} 6 A${46 - i * 7} ${46 - i * 7} 0 0 1 ${46 - i * 7} 6`, col, 6)).join('') + cloud(-44, 6, 0.4) + cloud(44, 6, 0.4);
      // the far half is drawn first so the rainbow can sit in the middle of the loop
      const cars = [wagon('#7cc8ff', C(0, -28, 7, '#ff7eb6')), wagon('#5fd3b5', P(starD(0, -30, 7), '#ffd36b')), loco(c === s.main ? '#ff7eb6' : c, s)];
      return o + trainSet(cars, on);
    },
  },
  {
    st: 'woodland', name: 'Forest Railway',
    art: (c, on, s) => {
      let o = E(0, 0, 176, 64, light(c, 0.35)) + track(dark(s.wood, 0.1), s.wood);
      o += G(P('M0 0 L-16 0 L0 -40 L16 0Z', dark(c, 0.2)) + P('M0 -20 L-12 -20 L0 -50 L12 -20Z', dark(c, 0.15)), 'translate(-40 4)') + G(P('M0 0 L-14 0 L0 -36 L14 0Z', dark(c, 0.2)) + P('M0 -18 L-10 -18 L0 -44 L10 -18Z', dark(c, 0.12)), 'translate(10 -4)') + mushroom(50, 8, 0.6, s.accent) + leaf(-80, 10, 10, s.accent, -60);
      const cars = [wagon(s.wood, E(0, -26, 12, 5, dark(s.wood, 0.3)) + E(-6, -28, 8, 4, dark(s.wood, 0.2))), wagon(light(s.wood, 0.1), mini.teddy(0, -22, 0.4)), loco(c, s)];
      o += trainSet(cars, on);
      return o + P('M110 50 Q120 -10 150 -20 Q180 -10 190 50Z', dark(c, 0.1)) + P('M134 50 L134 26 Q150 10 166 26 L166 50Z', '#4a3f3a') + leaf(150, -20, 10, light(c, 0.2), 0);
    },
  },
  {
    st: 'space', name: 'Galaxy Monorail',
    art: (c, on, s) => {
      let o = E(0, 0, 176, 64, dark(c, 0.25)) + track(s.metal, light(c, 0.15)) + C(-30, 0, 18, '#ff9ec7') + E(-30, 0, 30, 7, 'none', `stroke="${s.accent}" stroke-width="3"`) + C(40, -6, 10, '#5fd3b5');
      for (let i = 0; i < 6; i++) o += twinkle(-130 + i * 52, (i % 2 ? -18 : 18), 5, i % 2 ? '#fff' : s.accent, 1.6 + i * 0.2, i * 0.3);
      const cars = [wagon(s.soft, C(0, -28, 6, s.accent)), wagon(s.soft, motif('planet', 0, -30, 8)), loco(light(c, 0.2), s, true)];
      return o + trainSet(cars, on);
    },
  },
]);

// ---------------- kid tables ----------------
const kidChair = (x: number, dir: number, c: string, back: string) => R(x + dir * 30 - 5, -150, 10, 150, 5, c) + back + R(x - 30, -70, 60, 12, 6, dark(c, 0.05)) + leg(x - 22, -58, 58, dark(c, 0.15), 8) + leg(x + 22, -58, 58, dark(c, 0.15), 8);
const KIDTABLES = fam('kidtable', 'Kid Tables', 'kids', { mount: 'floor', w: 300, h: 170, seats: [sit(-110, -64), sit(110, -64)], surfaces: [{ x1: -70, x2: 70, y: -112 }] }, [
  {
    st: 'sweet', name: 'Heart Tea Table',
    art: (c, _on, s) => kidChair(-110, -1, c, P(heartD(-140, -176, 30), c)) + kidChair(110, 1, c, P(heartD(140, -176, 30), c)) + leg(0, -104, 100, s.metal, 14) + E(0, -4, 34, 7, s.metal) +
      E(0, -110, 76, 10, light(c, 0.3)) + cloth(`M-76 -110 H76 V-92${scallop(76, -76, -92, 8, 4)}Z`, c, 'hearts', 'y'),
  },
  {
    st: 'cottage', name: 'Picnic Play Table',
    art: (c, _on, s) => {
      const back = (x: number) => R(x - 6, -150, 12, 80, 4, s.wood) + C(x, -154, 7, s.wood);
      return kidChair(-110, -1, s.wood, back(-140) + R(-148, -126, 16, 26, 4, c)) + kidChair(110, 1, s.wood, back(140) + R(132, -126, 16, 26, 4, c)) + leg(-60, -104, 104, s.wood, 10) + leg(60, -104, 104, s.wood, 10) +
        box(-76, -112, 152, 12, 4, s.wood) + cloth('M-80 -114 H80 L84 -82 H-84Z', c, 'check', 'y') + motif('daisy', 0, -96, 8);
    },
  },
  {
    st: 'rainbow', name: 'Crayon Table',
    art: (c) => {
      const crayon = (x: number, col: string, h: number) => R(x - 7, -h, 14, h - 12, 3, col) + R(x - 7, -h + 12, 14, 12, 0, '#ffffff', 'opacity="0.6"') + P(`M${x - 7} -12 L${x + 7} -12 L${x} 0Z`, col);
      return kidChair(-110, -1, RB[4], crayon(-140, RB[4], 160)) + kidChair(110, 1, RB[0], crayon(140, RB[0], 160)) + crayon(-60, RB[1], 104) + crayon(60, RB[3], 104) + crayon(-20, RB[5], 104) + crayon(20, RB[2], 104) + box(-80, -116, 160, 14, 7, c) + R(-72, -112, 144, 4, 2, '#fff', 'opacity="0.5"');
    },
  },
]);

// ---------------- mini slides ----------------
const SLIDE_SEAT = [{ x: -96, y: -196, pose: 'slide' as const, path: [[-96, -196], [-56, -186], [-14, -150], [26, -100], [66, -60], [106, -34], [150, -16]] as [number, number][] }];
const slideBody = (rail: string, step: string, top: string, chute: string, pat = 'none') => {
  let o = Ln(-136, 0, -136, -196, rail, 9) + Ln(-90, 0, -90, -196, rail, 9);
  for (let y = -30; y > -190; y -= 34) o += Ln(-136, y, -90, y, step, 7);
  o += R(-144, -206, 86, 14, 6, top);
  o += cloth('M-60 -206 C10 -196 40 -50 156 -24 L160 -6 C30 -36 0 -176 -60 -184Z', chute, pat, 'y');
  return o + P('M-60 -206 C10 -196 40 -50 156 -24', 'none', `stroke="${light(chute, 0.45)}" stroke-width="6" stroke-linecap="round"`) + Ln(130, -16, 130, 0, rail, 7);
};
const SLIDES = fam('minislide', 'Mini Slides', 'kids', { mount: 'floor', w: 320, h: 240, seats: SLIDE_SEAT }, [
  {
    st: 'sweet', name: 'Sweetheart Slide',
    art: (c, _on, s) => slideBody('#ffffff', s.soft, '#ffffff', c) + P(heartD(-113, -236, 22), c) + Ln(-113, -206, -113, -226, '#fff', 4),
  },
  {
    st: 'rainbow', name: 'Rainbow Slide',
    art: (c, _on, s) => {
      let o = slideBody(s.accent, '#ffffff', c, '#ffffff');
      RB.slice(0, 5).forEach((col, i) => (o += S(`M-60 ${-204 + i * 4.4} C10 ${-194 + i * 4.4} 40 ${-48 + i * 4} 156 ${-22 + i * 3.4}`, col, 4.4)));
      return o + cloud(-110, -214, 0.6);
    },
  },
  {
    st: 'space', name: 'Rocket Slide', x: { h: 330 },
    art: (c, _on, s) => {
      let o = cloth('M-150 0 L-150 -230 Q-150 -290 -113 -320 Q-76 -290 -76 -230 L-76 0Z', c) + P('M-138 -296 Q-124 -314 -113 -320 Q-102 -314 -88 -296Z', s.accent) + porthole(-113, -250, 12, s.metal) + P('M-150 -60 L-176 0 L-150 0Z', s.soft) + P('M-76 -60 L-50 0 L-76 0Z', s.soft);
      for (let y = -40; y > -190; y -= 34) o += R(-140, y, 54, 6, 3, s.metal);
      o += R(-150, -206, 92, 12, 6, s.metal) + cloth('M-60 -206 C10 -196 40 -50 156 -24 L160 -6 C30 -36 0 -176 -60 -184Z', s.soft, 'stars', 'y') + P('M-60 -206 C10 -196 40 -50 156 -24', 'none', `stroke="${s.accent}" stroke-width="5" stroke-linecap="round"`) + Ln(130, -16, 130, 0, s.metal, 7);
      return o + twinkle(-30, -230, 7, s.accent, 2) + twinkle(60, -160, 5, '#fff', 1.7, 0.5);
    },
  },
]);

// ---------------- plush hammocks (wall) ----------------
const HAMMOCKS = fam('plushhammock', 'Plush Hammocks', 'kids', { mount: 'wall', w: 250, h: 150 }, [
  {
    st: 'sweet', name: 'Plushie Hammock',
    art: (c, _on, s) => {
      let o = mini.teddy(-40, 34, 1.1) + mini.bunny(10, 30, 1.1) + P(heartD(56, -2, 22), c) + mini.duck(-80, 10, 1);
      o += P('M-110 -50 Q0 110 110 -50 L104 -44 Q0 90 -104 -44Z', c, 'opacity="0.3"');
      for (let i = 1; i < 8; i++) o += S(`M${-110 + i * 27.5} -50 Q${-110 + i * 27.5 + (i < 4 ? 10 : -10)} 0 ${(-110 + i * 27.5) * 0.4} ${f(45 - Math.abs(i - 4) * 6)}`, c, 2, 'opacity="0.8"');
      o += S('M-110 -50 Q0 110 110 -50', c, 4) + S('M-90 -10 Q0 60 90 -10', c, 2, 'opacity="0.7"') + S('M-60 20 Q0 70 60 20', c, 2, 'opacity="0.7"');
      return o + C(-110, -50, 7, s.metal) + C(110, -50, 7, s.metal) + G(bowG(0, 0, 0.6, c), 'translate(-110 -58)') + G(bowG(0, 0, 0.6, c), 'translate(110 -58)');
    },
  },
  {
    st: 'beach', name: 'Fishing Net Hammock',
    art: (c) => {
      let o = mini.fish(-40, 30, 1.3) + mini.starfish(20, 30, 1.3, '#ff9a6b') + mini.fish(66, 10, 1, '#ff9ec7') + mini.duck(-84, 10, 1);
      for (let i = 1; i < 8; i++) o += S(`M${-110 + i * 27.5} -50 Q${-110 + i * 27.5 + (i < 4 ? 10 : -10)} 0 ${(-110 + i * 27.5) * 0.4} ${f(45 - Math.abs(i - 4) * 6)}`, '#e8d8b0', 2.5);
      o += S('M-110 -50 Q0 110 110 -50', '#d9c08a', 5) + S('M-90 -10 Q0 60 90 -10', '#e8d8b0', 2.5) + S('M-60 20 Q0 70 60 20', '#e8d8b0', 2.5);
      return o + C(-110, -50, 9, c) + C(110, -50, 9, c) + C(-110, -50, 4, '#fff') + C(110, -50, 4, '#fff') + E(-60, -56, 8, 5, '#fff3d6', 'stroke="#e8c88a" stroke-width="1.5"');
    },
  },
]);

// ---------------- loft beds ----------------
const LUMT = -340;
const LOFT_SEATS = sleep(HIP, LUMT + 6);
const LOFTS = fam('loftbed', 'Loft Beds', 'kids', { mount: 'floor', w: 440, h: 560, seats: LOFT_SEATS }, [
  {
    st: 'princess', name: 'Castle Loft Bed',
    art: (c, _on, s) => {
      const tower = (x: number, h: number) => box(x - 28, -h, 56, h, 4, light(c, 0.2)) + P(`M${x - 36} ${-h + 4} L${x} ${-h - 80} L${x + 36} ${-h + 4}Z`, c) + Ln(x, -h - 80, x, -h - 100, s.trim, 3) + P(`M${x} ${-h - 100} L${x + 20} ${-h - 94} L${x} ${-h - 88}Z`, '#ff7eb6') + R(x - 9, -h + 40, 18, 28, 9, '#6a4a6a');
      let o = tower(-196, 440) + tower(196, 400);
      o += box(-170, -294, 340, 294, 4, '#ffffff');
      for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) o += R(-164 + i * 56 + (j % 2) * 28, -286 + j * 40, 50, 34, 4, j % 2 ? '#fff8fb' : '#fdf0f6');
      o += P('M-50 0 L-50 -130 Q-50 -190 0 -190 Q50 -190 50 -130 L50 0Z', '#6a4a6a') + P('M-50 -170 Q-30 -120 -46 0 L-30 0 Q-16 -110 -26 -184Z', c) + P('M50 -170 Q30 -120 46 0 L30 0 Q16 -110 26 -184Z', c) + motif('crown', 0, -214, 18);
      o += win(-110, -180, 28, 38, s.trim) + win(110, -180, 28, 38, s.trim);
      return o + box(-176, -300, 352, 12, 5, s.trim) + mattress(-166, 166, LUMT, '#ffffff', 40) + pillow(-112, -346, s.soft);
    },
    front: (c, _on, s) => {
      let o = blanket(HIP, LUMT, light(c, 0.3), 'hearts', s.soft) + box(-176, -384, 290, 30, 4, '#ffffff');
      for (let i = 0; i < 6; i++) o += R(-176 + i * 50, -404, 32, 24, 3, '#ffffff');
      return o + R(-176, -360, 290, 4, 2, s.trim) + ladderD(132, 182, -380, '#ffffff', c, 10);
    },
  },
  {
    st: 'woodland', name: 'Treehouse Loft Bed',
    art: (c, _on, s) => {
      let o = leafy(-150, -470, 60, dark(c, 0.06)) + leafy(150, -470, 60, dark(c, 0.06)) + leafy(0, -500, 70, c) + bark(-210, -470, 36, 470, s.wood, 2) + bark(176, -440, 36, 440, s.wood, 5);
      for (let x = -170; x < 170; x += 28) o += box(x, -294, 26, 294, 4, x % 56 ? light(s.wood, 0.1) : light(s.wood, 0.18));
      o += C(-80, -200, 32, dark(s.wood, 0.2)) + C(-80, -200, 26, '#cfe9ff') + Ln(-80, -226, -80, -174, dark(s.wood, 0.2), 3) + Ln(-106, -200, -54, -200, dark(s.wood, 0.2), 3);
      o += P('M30 0 L30 -120 Q30 -160 70 -160 Q110 -160 110 -120 L110 0Z', '#4a3a2e') + C(96, -70, 5, s.accent) + leaf(-200, -300, 18, c, -40) + leaf(204, -260, 16, c, 40) + mushroom(-150, 0, 0.8, s.accent);
      return o + box(-176, -300, 352, 14, 5, dark(s.wood, 0.1)) + mattress(-166, 166, LUMT, s.soft, 40) + pillow(-112, -346, '#ffffff');
    },
    front: (c, _on, s) => {
      let o = blanket(HIP, LUMT, c, 'check', s.soft);
      for (let x = -176; x < 110; x += 26) o += box(x, -392, 24, 80, 6, x % 52 ? s.wood : dark(s.wood, 0.06));
      o += S('M140 -380 Q136 -190 144 0 M186 -380 Q190 -190 182 0', '#c9b48a', 5);
      for (let y = -350; y < -10; y += 44) o += box(138, y, 50, 9, 4, s.wood);
      return o + leaf(120, -396, 14, c, 30);
    },
  },
  {
    st: 'space', name: 'Launch Pad Loft Bed',
    art: (c, _on, s) => {
      let o = cloth('M-230 -10 V-400 Q-230 -460 -196 -520 Q-162 -460 -162 -400 V-10Z', c) + P('M-196 -520 Q-180 -490 -168 -460 L-224 -460 Q-212 -490 -196 -520Z', s.accent) + porthole(-196, -420, 13, s.metal) + porthole(-196, -200, 13, s.metal) + P('M-230 -90 L-256 0 L-230 0Z', s.soft) + P('M-162 -90 L-136 0 L-162 0Z', s.soft);
      o += R(176, -400, 16, 400, 6, s.metal) + C(184, -408, 10, s.accent) + Ln(184, -418, 184, -450, s.metal, 3) + blink(C(184, -454, 6, '#ff7eb6'), 1.2);
      o += R(-162, -294, 338, 294, 4, dark(c, 0.3));
      for (let x = -150; x < 170; x += 80) o += S(`M${x} -290 L${x + 80} -10 M${x + 80} -290 L${x} -10`, s.metal, 5, 'opacity="0.8"');
      o += box(-40, -110, 140, 80, 10, c) + R(-30, -100, 120, 30, 6, '#1e2a50') + S('M-24 -85 L-10 -92 L4 -80 L18 -90 L32 -84 L46 -92 L60 -82 L80 -88', '#5fd3b5', 2);
      for (let i = 0; i < 5; i++) o += blink(C(-20 + i * 26, -52, 6, TOYC[i]), 1.2 + (i % 3) * 0.4, i * 0.3);
      for (let i = 0; i < 6; i++) o += twinkle(-140 + i * 56, -250 + (i % 2) * 70, 6, i % 2 ? '#fff' : s.accent, 1.8 + (i % 3) * 0.4, i * 0.3);
      return o + box(-176, -300, 352, 14, 5, s.metal) + mattress(-166, 166, LUMT, '#f6f4ff', 40) + pillow(-112, -346, s.accent);
    },
    front: (c, _on, s) => blanket(HIP, LUMT, s.soft, 'stars', s.accent) + box(-160, -394, 270, 34, 14, c) + [-120, -60, 0, 60].map((x) => porthole(x, -377, 7, s.metal)).join('') + ladderD(132, 184, -380, s.metal, s.accent, 9),
  },
], (i) => stylePrice(i, 90, 20));

export const BEDROOM_MORE: FurnDef[] = [...BEDS, ...BIGBEDS, ...BUNKS, ...CANOPIES, ...DAYBEDS, ...CRIBS, ...WARDROBES, ...DRESSERS, ...NIGHTSTANDS, ...VANITIES, ...DESKS, ...DESKCHAIRS, ...BOOKSHELVES, ...TOYCHESTS, ...BEANBAGS, ...BENCHES, ...JEWELBOXES, ...LAMPS, ...TENTS, ...DOLLHOUSES, ...ROCKERS, ...BALLPITS, ...EASELS, ...KITCHENS, ...TOYSHELVES, ...TRAINS, ...KIDTABLES, ...SLIDES, ...HAMMOCKS, ...LOFTS];
