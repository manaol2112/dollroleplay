// The kitchen, bathroom and laundry catalog: every appliance and fitting in many design collections.
// Each collection changes the shape and the little details, not just the colors: a retro fridge is
// rounded with chrome, a space fridge is a rocket pod, a candy fridge is a cupcake, and so on.
import {
  type FurnCat, type FurnDef, type FurnStyle, type Mount,
  C, E, FURN_STYLE_BY_ID, Ln, P, R, WOOD, WOOD_D, bowG, box, cloth, dark, f, flame, flowerG, glow, heartD, leg, light, motif, roundRectD, sparkleD, starD, stylePrice,
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

const S = (d: string, c: string, w = 3, extra = '') => P(d, 'none', `stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
const op = (o: number) => `opacity="${o}"`;
const gloss = (x: number, y: number, w: number, h: number, o = 0.38) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', op(o));
const knob = (x: number, y: number, r: number, col: string) => C(x, y, r, col) + C(x - r * 0.32, y - r * 0.32, r * 0.36, '#fff', op(0.65));
const bun = (x: number, y: number, col: string, rx = 13) => E(x, y - 7, rx, 8, col) + E(x - rx * 0.3, y - 10, rx * 0.38, 2.5, '#fff', op(0.45));
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const tr = (x: number, y: number, inner: string, s = 1) => `<g transform="translate(${f(x)} ${f(y)})${s !== 1 ? ` scale(${s.toFixed(3)})` : ''}">${inner}</g>`;
const txt = (x: number, y: number, size: number, col: string, t: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" text-anchor="middle" fill="${col}" ${extra}>${t}</text>`;
const stroked = (c: string, w: number) => `stroke="${c}" stroke-width="${f(w)}"`;

/** Rounded rectangle with different top and bottom corner radii. */
function rrD(x: number, y: number, w: number, h: number, rt: number, rb: number): string {
  rt = Math.min(rt, w / 2, h / 2); rb = Math.min(rb, w / 2, h / 2);
  return `M${f(x + rt)} ${f(y)} H${f(x + w - rt)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rt)} V${f(y + h - rb)} Q${f(x + w)} ${f(y + h)} ${f(x + w - rb)} ${f(y + h)} H${f(x + rb)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rb)} V${f(y + rt)} Q${f(x)} ${f(y)} ${f(x + rt)} ${f(y)}Z`;
}
const boxT = (x: number, y: number, w: number, h: number, rt: number, rb: number, c: string, pat = 'none') => cloth(rrD(x, y, w, h, rt, rb), c, pat);
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
function sprinkles(x: number, y: number, w: number, h: number, n: number, seed = 0, skipWhite = true): string {
  let s = '';
  const cols = skipWhite ? CANDY.slice(0, 5) : CANDY;
  for (let i = 0; i < n; i++) {
    const px = x + rnd(i * 3 + seed) * w, py = y + rnd(i * 3 + 1 + seed) * h, a = Math.round(rnd(i * 3 + 2 + seed) * 180);
    s += `<rect x="${f(px - 3.5)}" y="${f(py - 1.2)}" width="7" height="2.6" rx="1.3" fill="${cols[i % cols.length]}" transform="rotate(${a} ${f(px)} ${f(py)})"/>`;
  }
  return s;
}
/** A gold C-scroll ornament. */
const curl = (x: number, y: number, s: number, col: string, flip = 1, w = 2.6) =>
  S(`M${f(x)} ${f(y)} C${f(x + flip * 10 * s)} ${f(y - 12 * s)} ${f(x + flip * 24 * s)} ${f(y - 2 * s)} ${f(x + flip * 16 * s)} ${f(y + 6 * s)} C${f(x + flip * 10 * s)} ${f(y + 10 * s)} ${f(x + flip * 6 * s)} ${f(y + 2 * s)} ${f(x + flip * 12 * s)} ${f(y)}`, col, w);
/** A curvy princess leg. */
const cabLeg = (x: number, y: number, h: number, col: string, fl: number) =>
  P(`M${f(x - 6)} ${f(y)} H${f(x + 6)} C${f(x + 8 + fl * 4)} ${f(y + h * 0.4)} ${f(x - fl * 4)} ${f(y + h * 0.65)} ${f(x + fl * 6)} ${f(y + h - 3)} L${f(x + fl * 6)} ${f(y + h)} H${f(x - fl * 2 - 6)} C${f(x - fl * 10)} ${f(y + h * 0.65)} ${f(x - 8)} ${f(y + h * 0.4)} ${f(x - 6)} ${f(y)}Z`, col) + E(x + fl * 3, y + h - 2, 9, 3.5, col);
/** Vertical plank seams. */
const planksV = (x: number, y: number, w: number, h: number, n: number, c: string) =>
  Array.from({ length: n - 1 }, (_, i) => Ln(x + ((i + 1) * w) / n, y + 3, x + ((i + 1) * w) / n, y + h - 3, c, 2)).join('');
/** Horizontal plank seams (shiplap). */
const planksH = (x: number, y: number, w: number, h: number, n: number, c: string) =>
  Array.from({ length: n - 1 }, (_, i) => Ln(x + 3, y + ((i + 1) * h) / n, x + w - 3, y + ((i + 1) * h) / n, c, 2)).join('');
/** Little wood-grain swirls and a knot. */
function grain(x: number, y: number, w: number, h: number, c: string, seed = 0): string {
  let s = '';
  const n = Math.max(2, Math.round(h / 22));
  for (let i = 0; i < n; i++) {
    const yy = y + ((i + 0.5) * h) / n, x1 = x + w * (0.08 + rnd(i + seed) * 0.2), x2 = x + w * (0.6 + rnd(i + seed + 7) * 0.32);
    s += S(`M${f(x1)} ${f(yy)} Q${f((x1 + x2) / 2)} ${f(yy - 4)} ${f(x2)} ${f(yy)}`, c, 1.6, op(0.55));
  }
  return s + E(x + w * 0.7, y + h * 0.4, 5, 3, 'none', `${stroked(c, 1.6)} ${op(0.6)}`);
}
/** A rattan cane-weave panel. */
function weave(x: number, y: number, w: number, h: number, c: string, step = 11): string {
  let s = '';
  for (let yy = y + step / 2; yy < y + h; yy += step) for (let xx = x + step / 2; xx < x + w; xx += step) s += C(xx, yy, step * 0.3, 'none', `${stroked(c, 1.6)} ${op(0.7)}`);
  return s;
}
/** A grid of tile seams. */
function tiles(x: number, y: number, w: number, h: number, sx: number, sy: number, c: string, brick = false): string {
  let s = '';
  for (let yy = y + sy; yy < y + h - 1; yy += sy) s += Ln(x, yy, x + w, yy, c, 1.6);
  let row = 0;
  for (let yy = y; yy < y + h - 1; yy += sy, row++) {
    const off = brick && row % 2 ? sx / 2 : 0;
    for (let xx = x + sx - off; xx < x + w - 1; xx += sx) if (xx > x + 1) s += Ln(xx, yy, xx, Math.min(y + h, yy + sy), c, 1.6);
  }
  return s;
}
const blinkC = (x: number, y: number, r: number, col: string, dur: number, begin = 0) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"><animate attributeName="opacity" values="1;0.25;1" dur="${dur}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"/></circle>`;
const spin = (cx: number, cy: number, dur: number, inner: string) =>
  `<g>${inner}<animateTransform attributeName="transform" type="rotate" from="0 ${f(cx)} ${f(cy)}" to="360 ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
const bob = (inner: string, amp = 2, dur = 2.4, begin = 0) =>
  `<g>${inner}<animateTransform attributeName="transform" type="translate" values="0 0;0 ${-amp};0 0" dur="${dur}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"/></g>`;
const sway = (cx: number, cy: number, deg: number, dur: number, inner: string) =>
  `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${-deg} ${f(cx)} ${f(cy)};${deg} ${f(cx)} ${f(cy)};${-deg} ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
/** A pulsing glow, for lights that are on. */
const pulse = (inner: string, dur = 1.6) => `<g>${inner}<animate attributeName="opacity" values="1;0.7;1" dur="${dur}s" repeatCount="indefinite"/></g>`;

/** Running water from a tap at (x, y1) down to y2. */
function stream(x: number, y1: number, y2: number, w = 10): string {
  return R(x - w / 2, y1, w, y2 - y1, w / 2, WATER, op(0.85)) +
    `<line x1="${f(x)}" y1="${f(y1 + 4)}" x2="${f(x)}" y2="${f(y2 - 2)}" stroke="#fff" stroke-width="${f(w * 0.3)}" stroke-dasharray="7 12" stroke-linecap="round" opacity="0.75"><animate attributeName="stroke-dashoffset" from="19" to="0" dur="0.3s" repeatCount="indefinite"/></line>` +
    `<ellipse cx="${f(x)}" cy="${f(y2)}" rx="${f(w * 1.6)}" ry="${f(w * 0.45)}" fill="#bfeaff" opacity="0.9"><animate attributeName="rx" values="${f(w * 1.3)};${f(w * 1.9)};${f(w * 1.3)}" dur="0.5s" repeatCount="indefinite"/></ellipse>`;
}
/** Shower spray fanning out from (x, y1) down to y2. */
function rain(x: number, y1: number, y2: number, spread: number, n = 7): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = i - (n - 1) / 2;
    s += `<line x1="${f(x + t * spread * 0.18)}" y1="${f(y1)}" x2="${f(x + t * spread)}" y2="${f(y2)}" stroke="${WATER}" stroke-width="3.4" stroke-dasharray="12 16" stroke-linecap="round" opacity="0.85"><animate attributeName="stroke-dashoffset" from="28" to="0" dur="0.42s" begin="${(rnd(i) * 0.4).toFixed(2)}s" repeatCount="indefinite"/></line>`;
  }
  return s;
}
/** Soft rising steam puffs. */
function steam(x: number, y: number, s = 1): string {
  return [0, 1, 2].map((i) => `<circle cx="${f(x + (i - 1) * 6 * s)}" cy="${f(y)}" r="${f(5 * s)}" fill="#fff" opacity="0"><animate attributeName="cy" values="${f(y)};${f(y - 34 * s)}" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="r" values="${f(4 * s)};${f(10 * s)}" dur="1.8s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('');
}
/** A cluster of bath foam. */
function foam(cx: number, y: number, w: number, n: number, seed = 0, tint = '#f1ecff'): string {
  let s = R(cx - w / 2, y - 12, w, 16, 8, '#fff');
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + 10 + (rnd(i + seed) * (w - 20)), r = 9 + rnd(i + seed + 50) * 11, yy = y - 8 - rnd(i + seed + 90) * 12;
    s += C(x, yy, r, '#fff') + C(x + r * 0.2, yy + r * 0.25, r * 0.85, tint, op(0.5)) + C(x - r * 0.3, yy - r * 0.35, r * 0.28, '#fff');
  }
  return s;
}
/** Little bubbles floating up, gently. */
function floaters(cx: number, y: number, w: number, seed = 0): string {
  return [0, 1, 2, 3].map((i) => {
    const x = cx - w / 2 + rnd(i + seed) * w, r = 4 + rnd(i + seed + 3) * 5, d = (2.6 + rnd(i + seed + 9) * 1.6).toFixed(1), b = (rnd(i + seed + 5) * 2).toFixed(1);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" fill-opacity="0.35" stroke="#bfe0ff" stroke-width="1.4" opacity="0"><animate attributeName="cy" values="${f(y)};${f(y - 70)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }).join('');
}
/** A flame in custom colors. */
const flameC = (x: number, y: number, s: number, o: string, i: string) =>
  `<g transform="translate(${f(x)} ${f(y)})"><g><animateTransform attributeName="transform" type="scale" values="1 1;1.06 0.92;0.96 1.08;1 1" dur="0.45s" repeatCount="indefinite" additive="sum"/>${P(`M0 ${f(-26 * s)} C${f(12 * s)} ${f(-12 * s)} ${f(10 * s)} 0 0 0 C${f(-10 * s)} 0 ${f(-12 * s)} ${f(-12 * s)} 0 ${f(-26 * s)}Z`, o)}${P(`M0 ${f(-16 * s)} C${f(6 * s)} ${f(-8 * s)} ${f(6 * s)} 0 0 0 C${f(-6 * s)} 0 ${f(-6 * s)} ${f(-8 * s)} 0 ${f(-16 * s)}Z`, i)}</g></g>`;
const burnerFlames = (x: number, y: number, s = 0.6) => flame(x - 12, y, s) + flame(x + 12, y, s) + flame(x, y - 2, s * 1.3);
/** A cooktop burner seen from the front: a flat ring with a grate. */
const burner = (x: number, y: number, rx: number, rim = '#4a4a5e') => E(x, y, rx, rx * 0.22, rim) + E(x, y - 1, rx * 0.7, rx * 0.14, INK) + Ln(x - rx, y - 2, x + rx, y - 2, '#6a6a7e', 2);
/** A gingham tea towel hanging from a rail at (x, y). */
const towel = (x: number, y: number, w: number, h: number, c: string, pat = 'check') =>
  cloth(`M${f(x - w / 2)} ${f(y)} H${f(x + w / 2)} L${f(x + w / 2 + 2)} ${f(y + h)} Q${f(x)} ${f(y + h + 6)} ${f(x - w / 2 - 2)} ${f(y + h)}Z`, c, pat, 'y') + R(x - w / 2, y + h - 10, w, 4, 1, '#fff', op(0.6));
/** A mushroom knob. */
const shroom = (x: number, y: number, r: number) => R(x - r * 0.35, y - r * 0.2, r * 0.7, r * 0.9, r * 0.3, '#f4ead9') + P(`M${f(x - r)} ${f(y)} Q${f(x - r)} ${f(y - r * 1.1)} ${f(x)} ${f(y - r * 1.1)} Q${f(x + r)} ${f(y - r * 1.1)} ${f(x + r)} ${f(y)}Z`, '#e8573d') + C(x - r * 0.4, y - r * 0.5, r * 0.18, '#fff') + C(x + r * 0.35, y - r * 0.7, r * 0.15, '#fff');
/** A lollipop pull. */
const lolly = (x: number, y: number, r: number, col: string) => C(x, y, r, col) + S(`M${f(x - r * 0.5)} ${f(y)} A${f(r * 0.5)} ${f(r * 0.5)} 0 1 1 ${f(x)} ${f(y + r * 0.5)}`, '#fff', r * 0.28) + C(x - r * 0.35, y - r * 0.4, r * 0.2, '#fff', op(0.7));
const leaf = (x: number, y: number, s: number, rot: number, col = '#6fc47c') =>
  `<path d="M0 0 C${f(4 * s)} ${f(-8 * s)} ${f(14 * s)} ${f(-8 * s)} ${f(18 * s)} 0 C${f(14 * s)} ${f(6 * s)} ${f(4 * s)} ${f(6 * s)} 0 0Z" fill="${col}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"/>`;
/** A shell motif (scallop). */
function shellG(x: number, y: number, s: number, col: string): string {
  let s2 = P(`M${f(x - 16 * s)} ${f(y)} A${f(16 * s)} ${f(16 * s)} 0 0 1 ${f(x + 16 * s)} ${f(y)} L${f(x + 4 * s)} ${f(y + 10 * s)} L${f(x - 4 * s)} ${f(y + 10 * s)}Z`, col);
  for (let i = 1; i < 6; i++) { const a = Math.PI + (i * Math.PI) / 6; s2 += Ln(x, y + 8 * s, x + Math.cos(a) * 14 * s, y + Math.sin(a) * 14 * s, dark(col, 0.18), 1.4 * s); }
  return s2 + R(x - 5 * s, y + 8 * s, 10 * s, 5 * s, 2 * s, dark(col, 0.1));
}
const starfish = (x: number, y: number, r: number, col = '#ffab5e') => P(starD(x, y, r, 0.5), col, `stroke="${dark(col, 0.15)}" stroke-width="1.5" stroke-linejoin="round"`) + C(x, y, r * 0.12, '#fff', op(0.7));

// ---------------- the series builder ----------------
type Spec = Omit<FurnDef, 'id' | 'cat' | 'group' | 'style' | 'price' | 'mount' | 'name'> & { name?: string; price?: number; mount?: Mount };
function series(type: string, group: string, label: string, cat: FurnCat, mount: Mount, designs: Record<string, (st: FurnStyle) => Spec>): FurnDef[] {
  return Object.entries(designs).map(([sid, make], i) => {
    const st = ST[sid];
    const { name, price, mount: m, color, ...rest } = make(st);
    return { id: `f-${type}-${sid}`, name: name ?? `${st.name} ${label}`, cat, group, style: sid, price: price ?? stylePrice(i), mount: m ?? mount, color: color ?? st.main, ...rest };
  });
}

// ---------------- fridges ----------------
const FRIDGE_SPAWN = ['apple', 'milk', 'cake', 'strawberry', 'juice', 'pizza', 'banana', 'cheese'];
/** The lit inside of an open fridge, full of food. */
function fridgeIn(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  let s = R(x, y, w, h, 12, '#f4faff') + R(x, y, w, h, 12, 'url(#g-shadeX)') + glow(cx, y + h * 0.2, w * 0.6);
  const s1 = y + h * 0.3, s2 = y + h * 0.55, s3 = y + h * 0.78;
  for (const yy of [s1, s2, s3]) s += R(x + 3, yy, w - 6, 6, 3, '#cfe3f0') + R(x + 3, yy, w - 6, 2, 1, '#fff', op(0.9));
  // top shelf: an apple, a jam jar and milk
  s += C(cx - 40, s1 - 14, 14, '#e8384f') + C(cx - 45, s1 - 19, 4, '#fff', op(0.5)) + Ln(cx - 40, s1 - 27, cx - 38, s1 - 34, '#8a5a3c', 3) + E(cx - 32, s1 - 32, 6, 3, '#5fae6b');
  s += R(cx - 14, s1 - 30, 24, 30, 6, '#ff7eb6') + R(cx - 16, s1 - 37, 28, 9, 3, '#fff') + R(cx - 9, s1 - 22, 14, 10, 2, '#fff', op(0.8));
  s += R(cx + 18, s1 - 50, 26, 50, 3, '#fff', stroked('#d7e7f2', 2)) + P(`M${f(cx + 18)} ${f(s1 - 50)} L${f(cx + 31)} ${f(s1 - 62)} L${f(cx + 44)} ${f(s1 - 50)}Z`, '#e9f3fb') + R(cx + 18, s1 - 38, 26, 13, 0, '#7cc8ff');
  // middle shelf: cake and a bowl of strawberries
  s += R(cx - 52, s2 - 30, 46, 30, 5, '#fff3d8') + R(cx - 52, s2 - 30, 46, 9, 5, '#ff9ec7') + R(cx - 52, s2 - 16, 46, 4, 0, '#ff9ec7') + C(cx - 29, s2 - 34, 6, '#e8384f');
  s += P(`M${f(cx + 4)} ${f(s2 - 20)} L${f(cx + 54)} ${f(s2 - 20)} Q${f(cx + 50)} ${f(s2)} ${f(cx + 29)} ${f(s2)} Q${f(cx + 8)} ${f(s2)} ${f(cx + 4)} ${f(s2 - 20)}Z`, '#9fd6ff');
  for (const [dx, dy] of [[14, -30], [29, -34], [44, -29]]) s += P(heartD(cx + dx, s2 + dy, 9), '#ff4f6d') + E(cx + dx, s2 + dy + 1, 4, 2, '#5fae6b');
  // bottom shelf: juice, cheese and grapes
  s += R(cx - 50, s3 - 46, 20, 46, 7, '#ffb35e') + R(cx - 46, s3 - 54, 12, 9, 2, '#5fd3b5') + R(cx - 47, s3 - 32, 14, 14, 3, '#fff', op(0.7));
  s += P(`M${f(cx - 22)} ${f(s3)} L${f(cx + 16)} ${f(s3)} L${f(cx + 16)} ${f(s3 - 20)} L${f(cx - 22)} ${f(s3 - 8)}Z`, '#ffd84a') + C(cx - 4, s3 - 8, 3.5, '#e8b83a') + C(cx + 8, s3 - 12, 2.5, '#e8b83a');
  for (const [dx, dy] of [[30, -8], [40, -8], [35, -16], [45, -16], [40, -24]]) s += C(cx + dx, s3 + dy, 6, '#b583ff');
  // the crisper drawer with veggies
  const dy = s3 + 12, dh = y + h - 8 - dy;
  if (dh > 16) {
    s += E(cx - 28, dy + dh * 0.45, 22, dh * 0.4, '#7fd36b') + P(`M${f(cx + 8)} ${f(dy + 4)} L${f(cx + 20)} ${f(dy + dh - 4)} L${f(cx + 32)} ${f(dy + 4)}Z`, '#ff8a3d') + E(cx + 20, dy + 2, 7, 3, '#5fae6b') + C(cx + 46, dy + dh * 0.5, dh * 0.32, '#e8384f');
    s += R(x + 8, dy, w - 16, dh, 8, '#d9f0ff', op(0.55)) + R(x + 8, dy, w - 16, 5, 3, '#fff', op(0.8));
  }
  return s;
}
/** An open fridge door seen from inside, with bottles on its shelves. */
function fridgeDoor(x: number, y: number, w: number, h: number, c: string, deco = ''): string {
  let s = box(x, y, w, h, 16, c) + R(x + 8, y + 12, w - 16, h - 24, 10, light(c, 0.6));
  [0.26, 0.52, 0.78].forEach((t, i) => {
    const yy = y + h * t;
    s += R(x + 12, yy - 22, 12, 22, 4, ['#ffb35e', '#7cc8ff', '#ff7eb6'][i]) + R(x + 28, yy - 30, 12, 30, 4, ['#fff', '#7fe0b0', '#ffd36b'][i], stroked('#e3edf5', 1.5)) + R(x + 8, yy, w - 16, 7, 3, light(c, 0.3));
  });
  return s + deco;
}
const fr = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 170, h: 330, toggle: true, spawn: FRIDGE_SPAWN, art, ...extra });
const openFr = (c: string, deco = '', x = -72, y = -316, w = 144, h = 294) => fridgeIn(x, y, w, h) + fridgeDoor(-154, -326, 66, 314, c, deco);

const FRIDGES = series('fridge', 'Fridges', 'Fridge', 'kitchen', 'floor', {
  sweet: () => fr((c, on) => {
    let s = bun(-58, 0, GOLD) + bun(58, 0, GOLD) + box(-85, -330, 170, 322, 36, c);
    if (on) return s + openFr(c, P(heartD(-121, -300, 13), '#ff4f7b'));
    s += R(-85, -232, 170, 6, 0, dark(c, 0.12));
    for (let x = -74; x <= 74; x += 14.8) s += C(x, -223, 6.5, '#fff');
    s += R(56, -312, 11, 62, 5.5, GOLD) + R(56, -206, 11, 96, 5.5, GOLD) + gloss(-72, -312, 12, 60) + gloss(-72, -204, 12, 150);
    s += P(heartD(-34, -304, 16), '#ff4f7b') + P(heartD(-38, -301, 5), '#fff', op(0.6)) + P(starD(0, -270, 10), '#ffd36b');
    s += P(heartD(0, -176, 46), light(c, 0.35)) + P(sparkleD(26, -164, 9), '#fff');
    s += `<g transform="rotate(-7 -36 -84)">${R(-60, -104, 46, 40, 3, '#fff')}${R(-55, -99, 36, 24, 2, '#bfe8ff')}${flowerG(-37, -86, 6, '#ff7eb6')}</g>`;
    return s + bowG(0, -332, 0.9, '#ff4f8b');
  }, { h: 346 }),
  princess: (st) => fr((c, on) => {
    let s = cabLeg(-62, -16, 16, GOLD, -1) + cabLeg(62, -16, 16, GOLD, 1) + cloth(archD(-85, -345, 170, 331, 64), c, on ? 'none' : 'hearts');
    if (on) return s + openFr(c, motif('crown', -121, -300, 13), -70, -300, 140, 278);
    s += P(archD(-76, -336, 152, 313, 58), 'none', stroked(st.trim, 3));
    s += Ln(0, -322, 0, -104, dark(c, 0.15), 3) + Ln(-76, -100, 76, -100, dark(c, 0.15), 3);
    s += R(-64, -280, 52, 150, 16, 'none', stroked(st.trim, 2.5)) + R(12, -280, 52, 150, 16, 'none', stroked(st.trim, 2.5));
    s += R(-14, -250, 7, 76, 3.5, GOLD) + R(7, -250, 7, 76, 3.5, GOLD) + C(-10.5, -254, 5, '#ff7eb6') + C(10.5, -254, 5, '#ff7eb6');
    s += curl(-50, -150, 0.8, st.trim, 1) + curl(50, -150, 0.8, st.trim, -1) + P(heartD(-38, -230, 10), '#fff', op(0.85)) + P(heartD(38, -230, 10), '#fff', op(0.85));
    s += R(-34, -66, 68, 8, 4, GOLD) + curl(-58, -56, 0.7, st.trim, 1) + curl(58, -56, 0.7, st.trim, -1);
    s += gloss(-68, -290, 9, 140) + motif('crown', 0, -350, 24) + C(0, -316, 6, '#7cc8ff') + C(-2, -318, 2, '#fff');
    return s;
  }, { h: 382 }),
  modern: (st) => fr((c, on) => {
    let s = R(-84, -14, 168, 10, 2, INK) + box(-90, -330, 180, 318, 6, c);
    if (on) return s + openFr(c, R(-150, -250, 6, 120, 3, st.accent), -78, -318, 156, 296);
    s += Ln(0, -330, 0, -112, dark(c, 0.18), 2.5) + Ln(-90, -110, 90, -110, dark(c, 0.18), 2.5);
    s += R(-14, -300, 6, 160, 3, st.accent) + R(8, -300, 6, 160, 3, st.accent) + R(-60, -96, 120, 6, 3, st.accent);
    s += R(-66, -262, 40, 64, 6, INK) + R(-60, -254, 28, 12, 3, '#3d4a66') + txt(-46, -244.5, 9, '#7fe0ff', '3°') + R(-52, -232, 12, 22, 3, '#3d3a4e') + C(-46, -218, 3, '#7fe0ff');
    s += R(-86, -326, 172, 3, 1.5, '#fff', op(0.6)) + R(-84, -322, 4, 200, 2, '#fff', op(0.5)) + R(20, -320, 60, 200, 4, 'url(#g-glass)', op(0.6));
    return s + R(-30, -48, 60, 3, 1.5, dark(c, 0.12));
  }, { w: 180 }),
  cottage: (st) => fr((c, on) => {
    let s = leg(-64, -18, 18, st.wood, 12) + leg(64, -18, 18, st.wood, 12) + box(-85, -326, 170, 310, 22, c);
    if (on) return s + openFr(c, flowerG(-121, -300, 9, '#fff'), -72, -312, 144, 288);
    s += box(-92, -340, 184, 16, 7, st.wood) + grain(-90, -338, 180, 12, WOOD_D);
    s += R(-85, -236, 170, 18, 0, light(c, 0.35)) + R(-85, -236, 170, 18, 0, 'url(#p-check)');
    const cup = (x: number, y: number) => P(`M${f(x - 22)} ${f(y)} Q${f(x - 22)} ${f(y + 14)} ${f(x)} ${f(y + 14)} Q${f(x + 22)} ${f(y + 14)} ${f(x + 22)} ${f(y)}Z`, SIL) + C(x - 22, y, 3.5, SIL) + C(x + 22, y, 3.5, SIL);
    s += cup(40, -262) + cup(40, -200) + gloss(-72, -312, 12, 60) + gloss(-72, -210, 12, 160);
    s += motif('daisy', -44, -290, 14) + motif('daisy', -20, -272, 9);
    s += `<g transform="rotate(5 -10 -150)">${R(-48, -180, 64, 56, 3, '#fffaf0')}${Ln(-40, -164, 8, -164, '#e6c9b0', 2)}${Ln(-40, -152, 8, -152, '#e6c9b0', 2)}${Ln(-40, -140, -8, -140, '#e6c9b0', 2)}${P(heartD(-16, -178, 6), '#e8384f')}</g>`;
    s += flowerG(30, -96, 9, '#fff') + flowerG(52, -78, 7, '#ffb3c7') + leaf(36, -84, 0.9, 30);
    return s + flowerG(-60, -352, 8, '#ff9ec7') + R(-70, -348, 20, 10, 3, '#e8907a');
  }, { h: 366 }),
  rainbow: (st) => fr((c, on) => {
    let s = bun(-58, 0, st.metal) + bun(58, 0, st.accent) + box(-85, -330, 170, 322, 30, c);
    if (on) return s + openFr(c, motif('rainbow', -121, -300, 14));
    s += R(-85, -236, 170, 6, 0, dark(c, 0.14));
    RAIN.forEach((col, i) => { s += S(`M${-66 + i * 10} -94 A${66 - i * 10} ${66 - i * 10} 0 0 1 ${66 - i * 10} -94`, col, 9.5); });
    s += motif('cloud', -58, -96, 18) + motif('cloud', 58, -96, 18);
    s += RAIN.slice(0, 4).map((col, i) => knob(-48 + i * 32, -260, 9, col)).join('') + R(56, -212, 11, 60, 5.5, '#fff');
    s += P(starD(-50, -300, 9), '#fff') + P(starD(40, -296, 7), '#fff') + gloss(-72, -312, 12, 56) + gloss(-72, -222, 10, 60);
    return s;
  }),
  space: (st) => fr((c, on) => {
    const body = `M-80 -10 V-236 C-80 -330 -40 -368 0 -370 C40 -368 80 -330 80 -236 V-10Z`;
    let s = P('M-80 -110 L-104 -40 L-104 -6 L-80 -26Z', '#ff6b8a') + P('M80 -110 L104 -40 L104 -6 L80 -26Z', '#ff6b8a') + R(-26, -16, 52, 14, 6, SIL);
    s += Ln(0, -368, 0, -392, '#c9cfdd', 4) + blinkC(0, -394, 6, '#ff6b8a', 1.2);
    s += cloth(body, c, on ? 'none' : 'stars');
    if (on) return s + openFr(c, motif('planet', -121, -300, 14), -64, -300, 128, 280);
    s += S(body, '#c9cfdd', 4) + Ln(-80, -190, 80, -190, '#c9cfdd', 3);
    s += C(0, -280, 38, SIL) + C(0, -280, 31, '#1e2350') + P(starD(-10, -290, 6), '#fff') + C(12, -272, 7, '#c99bff') + C(8, -296, 2.5, '#ffe680') + C(-14, -268, 2, '#fff') + C(0, -280, 31, GLASS);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += C(Math.cos(a) * 34.5, -280 + Math.sin(a) * 34.5, 2.2, '#9aa3b5'); }
    s += R(-60, -176, 120, 26, 10, '#262b55') + blinkC(-40, -163, 5, st.accent, 1.4) + blinkC(-14, -163, 5, '#7fe0ff', 1.1, 0.3) + blinkC(12, -163, 5, '#ff7eb6', 1.7, 0.6) + blinkC(38, -163, 5, '#7fe0b0', 1.3, 0.2);
    s += R(54, -140, 12, 80, 6, SIL) + R(-50, -128, 80, 54, 10, light(c, 0.12)) + P(starD(-10, -101, 14), st.accent) + gloss(-64, -300, 10, 70) + gloss(-66, -140, 9, 90);
    return s;
  }, { h: 400, w: 210 }),
  retro: (st) => fr((c, on) => {
    let s = R(-70, -22, 14, 18, 5, SIL) + R(56, -22, 14, 18, 5, SIL) + boxT(-85, -330, 170, 310, 64, 16, c);
    if (on) return s + openFr(c, motif('star', -121, -300, 13), -70, -300, 140, 270);
    s += R(-85, -50, 170, 30, 0, st.accent) + R(-85, -50, 170, 30, 0, 'url(#g-shadeY)');
    for (let x = -60; x <= 60; x += 15) s += R(x - 3, -44, 6, 18, 3, light(st.accent, 0.35));
    s += R(-85, -54, 170, 6, 3, SIL) + R(-85, -236, 170, 9, 4, SIL);
    s += P('M58 -300 Q72 -300 72 -284 V-252 Q72 -240 60 -240', 'none', `stroke="${SIL}" stroke-width="9" stroke-linecap="round"`) + P('M58 -214 Q72 -214 72 -198 V-136 Q72 -124 60 -124', 'none', `stroke="${SIL}" stroke-width="9" stroke-linecap="round"`);
    s += R(-46, -276, 70, 22, 11, SIL) + txt(-11, -260, 14, st.trim, 'chill', `stroke="#c97a3a" stroke-width="0.6" font-style="italic"`);
    s += motif('star', -40, -170, 16) + P(starD(-10, -140, 7), '#fff') + gloss(-70, -300, 12, 44) + gloss(-72, -214, 12, 140);
    return s;
  }),
  candy: (st) => fr((c, on) => {
    let s = bun(-52, 0, st.trim, 12) + bun(52, 0, st.trim, 12) + boxT(-78, -252, 156, 244, 10, 18, c);
    if (on) return s + cloth(archD(-86, -345, 172, 120, 90), st.soft) + openFr(c, motif('candy', -121, -300, 14), -66, -246, 132, 228);
    for (let x = -60; x <= 60; x += 20) s += Ln(x, -244, x * 0.92, -16, dark(c, 0.12), 3);
    s += R(-78, -252, 156, 244, 18, 'url(#g-shadeX)');
    const fro = `M-88 -232 C-96 -300 -54 -342 0 -344 C54 -342 96 -300 88 -232`;
    s += cloth(`${fro} Z`, '#fff3f8') + cloth(dripD(-88, -236, 176, 6, 34, 7, 3), '#fff3f8', 'none', 'y');
    s += sprinkles(-64, -320, 128, 70, 22, 1) + C(0, -352, 13, '#e8384f') + C(-4, -356, 4, '#fff', op(0.6)) + S('M0 -362 Q4 -374 12 -378', '#5f8f3a', 3);
    s += Ln(54, -150, 54, -100, '#fff', 4) + lolly(54, -160, 13, st.trim) + gloss(-64, -230, 9, 130) + gloss(-70, -330, 30, 9, 0.5);
    return s + motif('cupcake', -20, -110, 20);
  }, { h: 380 }),
  woodland: (st) => fr((c, on) => {
    let s = R(-76, -20, 22, 20, 4, st.wood) + R(54, -20, 22, 20, 4, st.wood) + box(-88, -330, 176, 316, 18, st.wood) + grain(-84, -326, 20, 300, WOOD_D, 2) + grain(64, -326, 20, 300, WOOD_D, 5);
    if (on) return s + openFr(c, motif('leaf', -121, -300, 13), -70, -318, 140, 296);
    s += box(-66, -318, 132, 86, 12, c) + box(-66, -222, 132, 196, 12, c);
    s += Ln(-66, -226, 66, -226, st.wood, 6);
    s += shroom(50, -270, 10) + shroom(50, -184, 10) + R(46, -176, 8, 60, 4, '#c98a5a');
    s += leaf(-46, -286, 1.4, -30, '#e8573d') + leaf(-30, -270, 1.1, 20, '#ffab5e') + motif('leaf', -20, -130, 18);
    s += C(-36, -80, 10, '#c98a5a') + P('M-46 -82 Q-36 -94 -26 -82Z', '#8a5a3c') + Ln(-36, -92, -34, -98, '#6b4a3a', 2.5);
    s += gloss(-58, -310, 9, 50) + gloss(-58, -214, 9, 140);
    s += leaf(-80, -334, 1.6, -160, '#6fc47c') + leaf(-60, -340, 1.4, -120, '#8fd36b') + leaf(70, -336, 1.5, -20, '#6fc47c') + leaf(50, -340, 1.2, -60, '#5fae6b');
    return s + C(-2, -342, 9, '#c98a5a') + P('M-12 -344 Q-2 -356 8 -344Z', '#6b4a3a');
  }, { h: 372, w: 176 }),
});

// ---------------- stoves & ovens ----------------
const OVEN_SPAWN = ['cupcake', 'cookie', 'pizza', 'cake'];
const ov = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 180, h: 186, toggle: true, spawn: OVEN_SPAWN, art, surfaces: [{ x1: -90, x2: 90, y: -186 }], ...extra });
/** The oven's window: dark when off, glowing with a little cake when baking. */
const ovenGlow = (cx: number, cy: number, w: number, on: boolean) => on ? glow(cx, cy, w * 0.55) + R(cx - w * 0.22, cy + 4, w * 0.44, 4, 2, '#c9cfdd') + P(`M${f(cx - w * 0.16)} ${f(cy + 4)} Q${f(cx)} ${f(cy - 18)} ${f(cx + w * 0.16)} ${f(cy + 4)}Z`, '#e8b46a') : '';

const STOVES = series('stove', 'Stoves & Ovens', 'Stove', 'kitchen', 'floor', {
  sweet: (st) => ov((c, on) => {
    let s = bun(-66, 0, GOLD) + bun(66, 0, GOLD) + box(-90, -178, 180, 166, 24, c);
    s += box(-94, -188, 188, 14, 7, '#fff', 'none', 'y') + burner(-46, -188, 32, GOLD) + burner(46, -188, 32, GOLD);
    if (on) s += burnerFlames(-46, -189) + burnerFlames(46, -189);
    for (let i = 0; i < 4; i++) s += knob(-54 + i * 36, -160, 7, GOLD) + C(-54 + i * 36, -160, 2.5, on && i < 2 ? '#ff4f7b' : '#fff');
    s += R(-48, -144, 96, 8, 4, GOLD);
    const hd = heartD(0, -132, 60);
    s += P(hd, on ? '#ffb35e' : '#4a3346') + ovenGlow(0, -96, 100, on) + P(hd, GLASS) + P(hd, 'none', stroked('#fff', 4));
    for (let x = -78; x <= 78; x += 15.6) s += C(x, -24, 7, light(c, 0.45));
    return s + gloss(-80, -168, 8, 40);
  }),
  princess: (st) => ov((c, on) => {
    let s = cabLeg(-70, -30, 30, GOLD, -1) + cabLeg(70, -30, 30, GOLD, 1);
    s += cloth(archD(-80, -262, 160, 80, 56), '#fff') + P(archD(-72, -254, 144, 72, 50), 'none', stroked(st.trim, 2.5)) + motif('crown', 0, -232, 20) + curl(-50, -200, 0.8, st.trim, 1) + curl(50, -200, 0.8, st.trim, -1);
    s += box(-90, -178, 180, 150, 16, c, 'hearts') + box(-94, -188, 188, 14, 7, '#fff', 'none', 'y') + burner(-46, -188, 30, GOLD) + burner(46, -188, 30, GOLD);
    if (on) s += burnerFlames(-46, -189) + burnerFlames(46, -189);
    for (let i = 0; i < 4; i++) s += knob(-54 + i * 36, -162, 7.5, GOLD) + C(-54 + i * 36, -162, 3, ['#ff7eb6', '#7cc8ff', '#5fd3b5', '#c99bff'][i]);
    const win = archD(-56, -140, 112, 84, 30);
    s += P(win, on ? '#ffb35e' : '#4a3346') + ovenGlow(0, -86, 110, on) + P(win, GLASS) + P(archD(-62, -146, 124, 96, 34), 'none', `stroke="${GOLD}" stroke-width="6"`);
    s += curl(-66, -48, 0.7, st.trim, 1) + curl(66, -48, 0.7, st.trim, -1) + R(-30, -48, 60, 7, 3.5, GOLD);
    return s + gloss(-80, -168, 8, 50);
  }, { h: 262 }),
  modern: (st) => ov((c, on) => {
    let s = R(-84, -14, 168, 10, 2, INK) + box(-90, -180, 180, 168, 5, c);
    s += R(-92, -190, 184, 10, 2, INK) + R(-88, -189, 60, 2, 1, '#fff', op(0.35));
    for (const x of [-46, 46]) s += E(x, -191, 30, 4, 'none', stroked(on ? '#ff5a3d' : '#5a5a6e', 2.5)) + (on ? pulse(E(x, -192, 34, 7, '#ff7a3d', op(0.35)), 1.2) : '');
    s += R(-72, -172, 144, 16, 3, INK) + txt(-40, -160, 10, on ? '#ff9a5e' : '#7fe0ff', on ? '180°' : '12:00') + C(20, -164, 3, '#7fe0ff') + C(36, -164, 3, '#7fe0ff') + C(52, -164, 3, on ? '#ff9a5e' : '#7fe0ff');
    s += R(-72, -148, 144, 6, 3, st.accent);
    s += R(-76, -136, 152, 90, 4, on ? '#ff9e4a' : '#2d2a3a') + ovenGlow(0, -92, 150, on) + R(-76, -136, 152, 90, 4, GLASS);
    s += Ln(-90, -36, 90, -36, dark(c, 0.15), 2) + R(-30, -28, 60, 3, 1.5, dark(c, 0.2));
    return s + R(-86, -176, 4, 150, 2, '#fff', op(0.5));
  }),
  cottage: (st) => ov((c, on) => {
    let s = R(-96, -20, 192, 14, 4, IRON) + box(-100, -178, 200, 160, 18, c);
    for (const x of [-50, 50]) {
      s += R(x - 34, -190, 68, 12, 4, '#9aa3b5');
      if (on && x < 0) s += E(x - 20, -214, 32, 8, SIL, `transform="rotate(-24 ${x - 20} -214)"`) + E(x, -191, 26, 5, '#ff7a3d') + burnerFlames(x, -192);
      else s += P(`M${x - 32} -189 Q${x - 32} -214 ${x} -214 Q${x + 32} -214 ${x + 32} -189Z`, SIL) + R(x - 6, -220, 12, 8, 4, IRON) + gloss(x - 20, -208, 12, 5);
    }
    s += R(-92, -170, 184, 8, 4, SIL) + C(-92, -166, 5, SIL) + C(92, -166, 5, SIL);
    s += towel(-40, -166, 36, 50, '#ff9ec7');
    s += box(-14, -148, 92, 54, 10, light(c, 0.15)) + box(-14, -86, 92, 54, 10, light(c, 0.15));
    s += R(-4, -140, 72, 38, 6, on ? '#ffb35e' : light(c, 0.3)) + (on ? glow(32, -121, 46) + P('M18 -106 Q32 -120 46 -106Z', '#e8b46a') + R(-4, -140, 72, 38, 6, GLASS) : '');
    s += knob(32, -98, 6, SIL) + knob(32, -36, 6, SIL) + C(56, -136, 4, IRON) + C(56, -74, 4, IRON);
    s += box(-88, -100, 64, 68, 10, light(c, 0.15)) + C(-56, -66, 7, SIL) + flowerG(-56, -90, 7, '#fff');
    return s + gloss(-92, -168, 6, 40);
  }, { w: 200, h: 222, surfaces: [{ x1: -100, x2: 100, y: -190 }] }),
  retro: (st) => ov((c, on) => {
    let s = R(-76, -22, 14, 18, 6, SIL) + R(62, -22, 14, 18, 6, SIL);
    s += box(-86, -250, 172, 66, 14, SIL) + C(0, -222, 20, '#fff') + C(0, -222, 20, 'none', stroked(st.accent, 4)) + Ln(0, -222, 0, -236, INK, 2.5) + Ln(0, -222, 10, -218, INK, 2.5);
    for (const x of [-64, -38, 38, 64]) s += knob(x, -222, 8, st.accent);
    s += box(-90, -180, 180, 162, 26, c) + R(-94, -190, 188, 12, 6, SIL) + burner(-46, -190, 30, SIL) + burner(46, -190, 30, SIL);
    if (on) s += burnerFlames(-46, -191) + burnerFlames(46, -191);
    s += R(-60, -166, 120, 8, 4, SIL);
    s += R(-62, -146, 124, 90, 30, SIL) + R(-54, -138, 108, 74, 24, on ? '#ffb35e' : '#3a3346') + ovenGlow(0, -100, 108, on) + R(-54, -138, 108, 74, 24, GLASS);
    s += R(-90, -48, 180, 24, 0, st.accent) + R(-90, -50, 180, 4, 2, SIL) + motif('star', 64, -36, 9) + motif('star', -64, -36, 9);
    return s + gloss(-80, -168, 8, 60);
  }, { h: 250 }),
  space: (st) => ov((c, on) => {
    let s = P('M-90 -80 L-108 -10 L-90 -24Z', '#ff6b8a') + P('M90 -80 L108 -10 L90 -24Z', '#ff6b8a') + R(-30, -14, 60, 12, 6, SIL);
    s += box(-90, -180, 180, 166, 34, c, 'stars') + R(-94, -190, 188, 12, 6, '#c9cfdd');
    for (const x of [-46, 46]) s += E(x, -190, 30, 6, '#262b55') + (on ? flameC(x - 12, -191, 0.55, '#7cc8ff', '#e0f6ff') + flameC(x + 12, -191, 0.55, '#c99bff', '#f2e6ff') + flameC(x, -193, 0.75, '#7cc8ff', '#ffffff') : E(x, -191, 22, 3, '#4a5aa8'));
    s += R(-70, -172, 140, 18, 9, '#262b55') + blinkC(-50, -163, 4, st.accent, 1.3) + blinkC(-30, -163, 4, '#7fe0ff', 1, 0.3) + blinkC(30, -163, 4, '#ff7eb6', 1.6, 0.5) + blinkC(50, -163, 4, '#7fe0b0', 1.2, 0.1) + R(-14, -167, 28, 8, 4, on ? '#ffb35e' : '#4a5aa8');
    s += C(0, -94, 50, SIL) + C(0, -94, 42, on ? '#ffb35e' : '#1e2350') + (on ? glow(0, -94, 46) + E(0, -80, 24, 8, '#e8b46a') : P(starD(-14, -106, 6), '#fff') + C(14, -86, 3, st.accent)) + C(0, -94, 42, GLASS);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; s += C(Math.cos(a) * 46, -94 + Math.sin(a) * 46, 2, '#9aa3b5'); }
    return s + gloss(-78, -166, 8, 50);
  }, { w: 216 }),
  candy: (st) => ov((c, on) => {
    let s = Ln(-66, -30, -66, 0, '#fff', 6) + Ln(66, -30, 66, 0, '#fff', 6);
    s += box(-90, -178, 180, 152, 22, c, 'dots') + cloth(dripD(-94, -192, 188, 16, 26, 8, 5), '#fff3f8', 'none', 'y') + sprinkles(-80, -190, 160, 12, 14, 4);
    for (const x of [-46, 46]) s += E(x, -193, 26, 4.5, '#c94f7b') + (on ? burnerFlames(x, -194, 0.55) : '');
    for (let i = 0; i < 4; i++) { const x = -54 + i * 36; s += P(`M${x - 9} -136 Q${x - 9} -152 ${x} -152 Q${x + 9} -152 ${x + 9} -136Z`, CANDY[i]) + C(x - 3, -146, 2.5, '#fff', op(0.6)); }
    const win = roundRectD(-58, -126, 116, 80, 18);
    s += P(win, on ? '#ffb35e' : '#5a3346') + ovenGlow(0, -86, 116, on) + P(win, GLASS) + P(win, 'none', stroked('#fff', 7)) + P(win, 'none', `stroke="#ff4f6d" stroke-width="7" stroke-dasharray="9 9"`);
    s += C(-66, -40, 9, st.soft) + C(66, -40, 9, st.soft) + lolly(-66, -40, 9, '#ff4f8b') + lolly(66, -40, 9, '#7cc8ff');
    return s + gloss(-80, -164, 8, 40);
  }),
  woodland: (st) => ov((c, on) => {
    let s = R(30, -330, 26, 150, 4, IRON) + R(26, -300, 34, 8, 3, '#6a5a64') + R(26, -230, 34, 8, 3, '#6a5a64') + gloss(33, -326, 5, 140, 0.18);
    if (on) s += steam(43, -336, 1.2);
    s += R(-82, -36, 164, 30, 6, dark(st.wood, 0.2));
    for (const [x, r] of [[-60, 11], [-36, 12], [-12, 11], [12, 12], [-48, 11]] as [number, number][]) { const y = x === -48 ? -30 : -18; s += C(x, y, r, st.wood) + C(x, y, r * 0.6, '#e8b46a') + C(x, y, r * 0.25, 'none', stroked(st.wood, 1.4)); }
    s += R(-72, -8, 12, 8, 2, IRON) + R(60, -8, 12, 8, 2, IRON);
    s += box(-88, -178, 176, 140, 14, c) + R(-94, -190, 188, 14, 4, IRON) + R(-90, -188, 60, 3, 1.5, '#fff', op(0.25));
    for (const x of [-46, 46]) s += E(x, -190, 24, 4, '#2d2630') + (on ? burnerFlames(x, -191, 0.5) : '');
    const door = archD(-52, -160, 104, 102, 40);
    s += P(door, IRON) + P(archD(-42, -150, 84, 84, 32), on ? '#ff8a3d' : '#2d2630');
    if (on) s += glow(0, -100, 60) + flame(-14, -70, 0.9) + flame(14, -70, 0.8) + flame(0, -72, 1.2);
    for (let x = -30; x <= 30; x += 15) s += Ln(x, -144, x, -68, IRON, 4);
    s += R(-60, -62, 120, 10, 4, IRON) + knob(58, -110, 6, '#c9cfdd') + leaf(-80, -160, 1.2, -20, '#ffab5e') + leaf(64, -60, 1.1, 200, '#e8573d');
    return s;
  }, { h: 340 }),
  rainbow: (st) => ov((c, on) => {
    let s = bun(-66, 0, '#7cc8ff') + bun(66, 0, '#ff7eb6') + box(-90, -178, 180, 166, 20, c);
    s += box(-94, -190, 188, 14, 7, '#fff', 'none', 'y') + burner(-46, -190, 30, '#c99bff') + burner(46, -190, 30, '#7cc8ff');
    if (on) s += burnerFlames(-46, -191) + burnerFlames(46, -191);
    for (let i = 0; i < 5; i++) s += knob(-60 + i * 30, -162, 7, RAIN[i]);
    const win = archD(-44, -136, 88, 84, 40);
    RAIN.forEach((col, i) => { s += P(archD(-68 + i * 4, -150 + i * 4, 136 - i * 8, 112 - i * 4, 64 - i * 4), col); });
    s += P(win, on ? '#ffb35e' : '#3a3346') + ovenGlow(0, -90, 88, on) + P(win, GLASS) + motif('cloud', -70, -42, 14) + motif('cloud', 70, -42, 14);
    s += R(-90, -34, 180, 6, 3, '#fff', op(0.6));
    return s + gloss(-82, -168, 7, 60);
  }),
});

// ---------------- range hoods (wall) ----------------
const hoodLight = (on: boolean, y: number, w: number) => on ? `<path d="M${f(-w / 2)} ${f(y)} L${f(w / 2)} ${f(y)} L${f(w / 2 + 30)} ${f(y + 80)} L${f(-w / 2 - 30)} ${f(y + 80)}Z" fill="url(#g-spot)" opacity="0.8"/>` : '';
const hd = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 200, h: 170, toggle: true, art, ...extra });
const HOODS = series('hood', 'Range Hoods', 'Range Hood', 'kitchen', 'wall', {
  sweet: () => hd((c, on) => {
    let s = hoodLight(on, 40, 150) + box(-28, -84, 56, 70, 10, c) + cloth('M-30 -20 H30 L92 40 Q92 50 82 50 H-82 Q-92 50 -92 40Z', c);
    for (let x = -80; x <= 80; x += 16) s += C(x, 52, 8, '#fff');
    s += P(heartD(0, -6, 30), light(c, 0.4)) + R(-70, 44, 140, 6, 3, dark(c, 0.15));
    return s + C(-44, 48, 5, on ? '#fff6c8' : '#fff') + C(44, 48, 5, on ? '#fff6c8' : '#fff') + gloss(-22, -80, 6, 56);
  }),
  modern: (st) => hd((c, on) => {
    let s = hoodLight(on, 46, 160) + R(-24, -84, 48, 100, 2, SIL) + R(-24, -84, 48, 100, 2, 'url(#g-shadeX)');
    s += cloth('M-40 16 H40 L96 34 V46 H-96 V34Z', c) + R(-96, 44, 192, 6, 1, st.accent) + R(-60, 36, 120, 2, 1, dark(c, 0.15));
    return s + C(70, 30, 3, on ? '#7fe0ff' : '#9aa3b5') + C(80, 30, 3, '#9aa3b5') + R(-90, 47, 180, 2, 1, on ? '#fff6c8' : '#6a6a7e');
  }),
  cottage: (st) => hd((c, on) => {
    let s = hoodLight(on, 46, 160) + box(-36, -84, 72, 62, 6, c);
    s += cloth('M-40 -24 H40 Q50 10 92 30 V46 H-92 V30 Q-50 10 -40 -24Z', c) + box(-100, 26, 200, 14, 4, st.wood) + grain(-96, 28, 190, 10, WOOD_D, 3);
    s += R(-60, 8, 12, 18, 3, '#fff') + R(-44, 4, 12, 22, 3, '#e8907a') + R(36, 10, 22, 16, 4, '#ffd36b') + flowerG(47, 4, 6, '#ff7eb6');
    for (let i = 0; i < 7; i++) s += flowerG(-60 + i * 20, -16 + Math.abs(i - 3) * 4, 5, i % 2 ? '#ffb3c7' : '#fff');
    return s + R(-80, 40, 160, 8, 3, dark(c, 0.15)) + gloss(-30, -80, 6, 50);
  }),
  retro: (st) => hd((c, on) => {
    let s = hoodLight(on, 40, 160) + box(-30, -84, 60, 64, 6, c) + cloth('M-36 -24 H36 Q96 -16 96 32 Q96 44 84 44 H-84 Q-96 44 -96 32 Q-96 -16 -36 -24Z', c);
    s += R(-92, 0, 184, 6, 3, SIL) + R(-94, 16, 188, 6, 3, SIL) + R(-30, -60, 60, 5, 2.5, SIL);
    for (let x = -50; x <= 50; x += 20) s += R(x - 4, 28, 8, 12, 3, dark(c, 0.2));
    return s + motif('star', 0, -40, 10) + gloss(-80, -10, 30, 6);
  }),
  princess: (st) => hd((c, on) => {
    let s = hoodLight(on, 40, 160) + R(-26, -78, 52, 50, 6, '#fff') + cloth('M-30 -30 C-40 0 -92 6 -92 38 H92 C92 6 40 0 30 -30Z', c, 'hearts');
    for (let x = -80; x <= 80; x += 20) s += P(`M${x - 10} 38 Q${x} 54 ${x + 10} 38Z`, GOLD);
    s += R(-92, 34, 184, 6, 3, GOLD) + curl(-40, 14, 0.8, st.trim, -1) + curl(40, 14, 0.8, st.trim, 1);
    return s + motif('crown', 0, -82, 20) + C(0, 8, 7, '#7cc8ff') + C(-2, 6, 2, '#fff');
  }),
});

// ---------------- sink counters ----------------
/** A tap that rises from (x, y), arcs over by `reach` and ends pointing down. */
const swanD = (x: number, y: number, h: number, reach: number) => `M${f(x)} ${f(y)} V${f(y - h)} Q${f(x)} ${f(y - h - 18)} ${f(x + reach / 2)} ${f(y - h - 18)} Q${f(x + reach)} ${f(y - h - 18)} ${f(x + reach)} ${f(y - h)} V${f(y - h + 8)}`;
const basin = (x: number, y: number, rx: number) => E(x, y, rx, 7, '#d9dbe6') + E(x, y + 1, rx - 8, 4.5, '#a9adbf') + E(x - rx * 0.4, y - 2, rx * 0.3, 1.5, '#fff', op(0.8));
const sk = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 230, h: 280, toggle: true, art, surfaces: [{ x1: 30, x2: 114, y: -184 }], ...extra });
const SINKS = series('sink', 'Sink Counters', 'Sink', 'kitchen', 'floor', {
  sweet: () => sk((c, on) => {
    let s = bun(-86, 0, GOLD) + bun(86, 0, GOLD) + box(-110, -172, 220, 160, 22, c) + box(-116, -186, 232, 16, 8, '#fff', 'none', 'y') + basin(-30, -186, 52);
    s += S(swanD(-30, -190, 58, 36), GOLD, 10) + knob(-58, -194, 7, GOLD) + knob(-2, -194, 7, GOLD) + C(-58, -194, 2.5, '#e8384f') + C(-2, -194, 2.5, '#7cc8ff');
    if (on) s += stream(6, -238, -188, 9);
    for (const x of [-98, 6]) s += box(x, -158, 92, 126, 14, light(c, 0.22)) + P(heartD(x + 46, -142, 30), light(c, 0.55)) + P(heartD(x + (x < 0 ? 80 : 12), -100, 7), GOLD);
    for (let x = -100; x <= 100; x += 16.6) s += C(x, -168, 5, '#fff');
    return s + gloss(-104, -160, 6, 100);
  }),
  modern: (st) => sk((c, on) => {
    let s = R(-104, -16, 208, 10, 2, st.wood) + box(-110, -174, 220, 160, 4, c) + R(-114, -186, 228, 12, 2, '#f4f4f8') + R(-114, -175, 228, 2, 1, dark(c, 0.15));
    s += R(-74, -187, 88, 5, 2, '#9aa3b5') + S(swanD(-36, -188, 80, 40), INK, 7) + R(-48, -198, 10, 4, 2, INK);
    if (on) s += stream(4, -260, -188, 8);
    s += Ln(-110, -120, 110, -120, dark(c, 0.15), 2) + Ln(0, -120, 0, -16, dark(c, 0.15), 2) + Ln(0, -68, 110, -68, dark(c, 0.15), 2);
    s += R(-90, -164, 180, 4, 2, st.accent) + R(-30, -114, 24, 4, 2, st.accent) + R(40, -114, 30, 4, 2, st.accent) + R(40, -62, 30, 4, 2, st.accent);
    return s + R(-106, -170, 4, 150, 2, '#fff', op(0.5));
  }),
  cottage: (st) => sk((c, on) => {
    let s = leg(-96, -20, 20, st.wood, 12) + leg(96, -20, 20, st.wood, 12) + box(-110, -176, 220, 160, 12, c);
    s += box(-116, -188, 232, 16, 5, WOOD) + grain(-112, -186, 224, 12, WOOD_D, 4);
    s += box(-96, -188, 120, 56, 10, '#fff', 'none', 'y') + R(-90, -186, 108, 4, 2, '#e3e6ee') + E(-36, -188, 52, 5, '#c9cfdd');
    s += S('M-58 -192 V-206 H-14 V-192', '#e8b45a', 6) + S(swanD(-36, -206, 26, 30), '#e8b45a', 7) + P('M-66 -210 H-50 M-58 -218 V-202', 'none', stroked('#e8b45a', 4)) + P('M-22 -210 H-6 M-14 -218 V-202', 'none', stroked('#e8b45a', 4));
    if (on) s += stream(-6, -222, -190, 8);
    s += cloth('M-102 -130 H26 Q30 -60 22 -18 Q-6 -10 -38 -20 Q-70 -10 -102 -18 Q-108 -60 -102 -130Z', '#ff9ec7', 'check', 'y') + R(-104, -134, 132, 6, 3, st.wood);
    s += Ln(-38, -128, -38, -22, dark('#ff9ec7', 0.12), 2);
    s += box(36, -160, 66, 60, 8, light(c, 0.18)) + box(36, -92, 66, 70, 8, light(c, 0.18)) + knob(69, -130, 6, '#fff') + knob(69, -57, 6, '#fff');
    return s + flowerG(80, -150, 5, '#fff');
  }),
  princess: (st) => sk((c, on) => {
    let s = cabLeg(-90, -30, 30, GOLD, -1) + cabLeg(90, -30, 30, GOLD, 1) + cloth(archD(-60, -262, 120, 80, 52), '#fff') + P(archD(-52, -254, 104, 70, 46), 'none', stroked(st.trim, 2.5)) + motif('crown', 0, -270, 16) + P(heartD(24, -236, 10), light(c, 0.2));
    s += box(-106, -176, 212, 148, 16, c, 'hearts') + box(-114, -190, 228, 14, 7, '#fbf7fa', 'none', 'y') + S('M-100 -186 Q-70 -180 -50 -186 M40 -184 Q70 -188 96 -182', '#d9d0e0', 1.5) + basin(0, -190, 50);
    s += S(swanD(-24, -192, 44, 24), GOLD, 9) + C(-44, -196, 7, '#bfe8ff') + C(-44, -196, 7, GLASS) + C(30, -196, 7, '#bfe8ff') + C(30, -196, 7, GLASS) + C(-24, -240, 4, '#ff7eb6');
    if (on) s += stream(0, -228, -190, 8);
    for (const x of [-94, 6]) s += P(archD(x + 6, -156, 76, 114, 30), 'none', stroked(st.trim, 3)) + knob(x + (x < 0 ? 76 : 12), -100, 5, GOLD);
    return s + curl(-50, -44, 0.8, st.trim, 1) + curl(50, -44, 0.8, st.trim, -1) + gloss(-100, -166, 7, 90);
  }, { h: 290, surfaces: [{ x1: 54, x2: 112, y: -190 }] }),
  beach: (st) => sk((c, on) => {
    let s = box(-110, -174, 220, 162, 10, c) + planksH(-110, -174, 220, 162, 7, light(c, 0.4)) + R(-104, -14, 208, 10, 3, st.wood);
    s += box(-116, -188, 232, 16, 6, st.wood) + grain(-112, -186, 224, 12, '#d9b27a', 8) + basin(-30, -188, 50) + S(swanD(-30, -190, 54, 34), SIL, 9) + knob(-56, -194, 6, '#fff') + knob(-4, -194, 6, '#fff');
    if (on) s += stream(4, -242, -190, 9);
    for (const x of [-98, 6]) s += box(x, -156, 92, 128, 10, '#fff') + planksV(x, -156, 92, 128, 4, '#e3eef6') + S(`M${x + (x < 0 ? 72 : 20)} -112 a9 9 0 1 0 0.1 0`, '#d9b27a', 3.5);
    return s + starfish(-52, -80, 16) + shellG(54, -86, 1.1, '#ffd9e8') + motif('fish', 54, -130, 12);
  }),
  retro: (st) => sk((c, on) => {
    let s = box(-110, -174, 220, 156, 18, c);
    for (let x = -108; x < 108; x += 12) s += R(x, -20, 12, 10, 0, (x / 12) % 2 === 0 ? '#fff' : INK);
    s += R(-116, -188, 232, 14, 6, st.accent) + R(-116, -176, 232, 4, 2, SIL) + basin(-30, -188, 50);
    for (const [x, y] of [[40, -184], [70, -182], [96, -185]] as [number, number][]) s += P(`M${x} ${y} q6 -3 10 0 q-4 1 -10 0Z`, dark(st.accent, 0.25));
    s += S(swanD(-30, -190, 40, 34), SIL, 9) + R(-62, -198, 18, 8, 4, SIL) + R(-14, -198, 18, 8, 4, SIL) + C(-53, -202, 4, st.trim) + C(-5, -202, 4, st.trim);
    if (on) s += stream(4, -224, -190, 9);
    for (const x of [-98, 6]) s += box(x, -160, 92, 132, 14, light(c, 0.15)) + R(x + 8, -152, 76, 4, 2, '#fff', op(0.5)) + knob(x + 46, -94, 8, SIL);
    return s + motif('star', 0, -42, 10);
  }),
  woodland: (st) => sk((c, on) => {
    let s = box(-110, -174, 220, 162, 8, st.wood) + planksV(-110, -174, 220, 162, 6, WOOD_D) + R(-104, -14, 16, 14, 3, IRON) + R(88, -14, 16, 14, 3, IRON);
    s += box(-116, -188, 232, 16, 8, '#b9b4bf', 'none', 'y') + C(-90, -184, 4, '#a39eaa') + C(60, -183, 5, '#a39eaa');
    s += P('M-76 -188 Q-76 -222 -24 -224 Q28 -222 28 -188Z', '#d9874a') + E(-24, -224, 52, 7, '#e8a06a') + E(-24, -223, 44, 4, '#8a5a3c') + gloss(-62, -214, 30, 5, 0.4);
    s += R(36, -254, 18, 66, 4, IRON) + R(32, -262, 26, 12, 5, IRON) + S('M44 -238 H8 V-232', IRON, 8) + S('M48 -262 Q60 -290 86 -292', IRON, 6) + C(86, -292, 6, '#c9cfdd');
    if (on) s += stream(8, -230, -226, 7) + E(-24, -226, 40, 3, WATER, op(0.8));
    s += box(-92, -156, 84, 126, 10, c) + box(8, -156, 84, 126, 10, c) + motif('leaf', -50, -120, 14) + shroom(-18, -90, 8) + shroom(18, -90, 8);
    return s + leaf(-110, -190, 1.2, -150) + leaf(100, -192, 1.1, -30, '#8fd36b');
  }, { h: 300, surfaces: [{ x1: 60, x2: 114, y: -188 }] }),
});

// ---------------- counters ----------------
const ct = (art: (c: string) => string, extra: Partial<Spec> = {}): Spec => ({ w: 188, h: 186, art, surfaces: [{ x1: -94, x2: 94, y: -184 }], ...extra });
const COUNTERS = series('counter', 'Counters', 'Counter', 'kitchen', 'floor', {
  sweet: () => ct((c) => {
    let s = bun(-70, 0, GOLD) + bun(70, 0, GOLD) + box(-88, -172, 176, 160, 22, c) + box(-94, -184, 188, 14, 7, '#fff', 'none', 'y');
    for (let x = -82; x <= 82; x += 16.4) s += C(x, -168, 5, '#fff');
    for (const x of [-78, 4]) s += box(x, -154, 74, 124, 14, light(c, 0.22)) + P(heartD(x + 37, -136, 24), light(c, 0.55)) + P(heartD(x + (x < 0 ? 64 : 10), -96, 6), GOLD);
    return s + gloss(-82, -158, 6, 100);
  }),
  princess: (st) => ct((c) => {
    let s = cabLeg(-72, -30, 30, GOLD, -1) + cabLeg(72, -30, 30, GOLD, 1) + box(-88, -172, 176, 144, 16, c, 'hearts') + box(-94, -186, 188, 14, 7, '#fbf7fa', 'none', 'y') + S('M-84 -182 Q-50 -176 -20 -182 M20 -180 Q50 -186 84 -178', '#d9d0e0', 1.5);
    s += R(-78, -164, 156, 26, 8, light(c, 0.3)) + R(-24, -154, 48, 6, 3, GOLD);
    for (const x of [-78, 4]) s += P(archD(x + 4, -130, 66, 92, 26), 'none', stroked(st.trim, 3)) + C(x + 37, -60, 5, '#ff7eb6') + C(x + 37, -60, 5, 'none', `stroke="${GOLD}" stroke-width="2"`);
    return s + motif('crown', 0, -110, 12) + curl(-44, -42, 0.6, st.trim, 1) + curl(44, -42, 0.6, st.trim, -1);
  }),
  modern: (st) => ct((c) => {
    let s = R(-84, -16, 168, 10, 2, st.wood) + box(-90, -174, 180, 160, 3, c) + R(-92, -186, 184, 12, 2, '#5a5a6e') + R(-92, -186, 184, 3, 1.5, '#7a7a8e');
    for (const y of [-128, -76]) s += Ln(-90, y, 90, y, dark(c, 0.15), 2);
    for (const y of [-164, -118, -66]) s += R(-50, y, 100, 4, 2, st.accent);
    return s + R(-86, -170, 4, 150, 2, '#fff', op(0.5)) + R(30, -172, 56, 154, 0, 'url(#g-shadeX)', op(0.5));
  }),
  cottage: (st) => ct((c) => {
    let s = leg(-76, -20, 20, st.wood, 12) + leg(76, -20, 20, st.wood, 12) + box(-88, -172, 176, 156, 10, c) + box(-96, -188, 192, 18, 5, WOOD) + grain(-92, -186, 184, 14, WOOD_D, 9);
    s += box(-80, -164, 160, 30, 6, light(c, 0.2));
    const cup = (x: number) => P(`M${x - 14} -150 Q${x - 14} -140 ${x} -140 Q${x + 14} -140 ${x + 14} -150Z`, SIL);
    s += cup(-40) + cup(40);
    for (const x of [-80, 4]) s += box(x, -126, 76, 104, 8, light(c, 0.2)) + planksV(x + 6, -120, 64, 92, 5, dark(c, 0.1)) + knob(x + (x < 0 ? 64 : 12), -74, 5, '#fff');
    return s + towel(-42, -134, 30, 44, '#ff9ec7') + flowerG(42, -100, 7, '#fff');
  }),
  rainbow: () => ct((c) => {
    let s = bun(-70, 0, '#c99bff') + bun(70, 0, '#7cc8ff') + box(-88, -172, 176, 160, 18, c) + box(-94, -186, 188, 14, 7, '#fff', 'none', 'y');
    ['#ff7eb6', '#ffab5e', '#7fe0b0', '#7cc8ff'].forEach((col, i) => { s += box(-78, -160 + i * 36, 156, 30, 9, col) + knob(0, -145 + i * 36, 5.5, '#fff'); });
    return s + P(starD(-60, -146, 5), '#fff') + P(starD(62, -74, 5), '#fff') + gloss(-82, -160, 5, 80);
  }),
  space: (st) => ct((c) => {
    let s = R(-70, -16, 26, 14, 5, SIL) + R(44, -16, 26, 14, 5, SIL) + box(-88, -174, 176, 160, 28, c, 'stars') + box(-94, -186, 188, 12, 6, '#c9cfdd', 'none', 'y');
    for (const x of [-42, 42]) s += C(x, -96, 34, SIL) + C(x, -96, 27, '#1e2350') + C(x, -96, 27, GLASS) + C(x + 8, -104, 3, st.accent) + P(starD(x - 8, -90, 5), '#fff');
    s += R(-60, -166, 120, 16, 8, '#262b55') + blinkC(-40, -158, 4, st.accent, 1.3) + blinkC(-14, -158, 4, '#7fe0ff', 1, 0.3) + blinkC(14, -158, 4, '#ff7eb6', 1.6, 0.5) + blinkC(40, -158, 4, '#7fe0b0', 1.2, 0.1);
    return s + motif('planet', 0, -40, 12);
  }),
  candy: (st) => ct((c) => {
    let s = Ln(-66, -24, -66, 0, '#fff', 6) + Ln(66, -24, 66, 0, '#fff', 6) + C(-66, -6, 7, st.trim) + C(66, -6, 7, '#7cc8ff');
    s += box(-88, -172, 176, 150, 18, c);
    for (let x = -80; x < 80; x += 20) s += R(x, -150, 10, 120, 4, light(c, 0.35));
    s += cloth(dripD(-94, -190, 188, 16, 30, 7, 11), '#fff3f8', 'none', 'y') + sprinkles(-84, -188, 168, 12, 14, 7);
    return s + lolly(-30, -90, 11, '#ff4f8b') + lolly(30, -90, 11, '#5fd3b5') + motif('candy', 0, -50, 12);
  }),
  woodland: (st) => ct((c) => {
    let s = box(-90, -174, 180, 162, 8, st.wood) + planksV(-90, -174, 180, 162, 5, WOOD_D) + R(-84, -14, 16, 14, 3, IRON) + R(68, -14, 16, 14, 3, IRON);
    s += box(-96, -188, 192, 16, 8, '#b9b4bf', 'none', 'y') + C(-70, -183, 4, '#a39eaa') + C(40, -184, 3, '#a39eaa');
    for (const x of [-78, 4]) s += box(x, -158, 74, 128, 10, c) + R(x + 10, -148, 54, 108, 8, 'none', stroked(light(c, 0.35), 2.5)) + shroom(x + (x < 0 ? 64 : 10), -90, 7);
    return s + motif('leaf', -41, -116, 13) + leaf(30, -124, 1.1, -40, '#ffab5e') + leaf(-96, -190, 1.3, -160) + leaf(-80, -192, 1, -120, '#8fd36b');
  }),
  boho: (st) => ct((c) => {
    let s = leg(-76, -24, 24, st.wood, 10) + leg(76, -24, 24, st.wood, 10) + box(-90, -174, 180, 154, 10, st.wood) + box(-96, -186, 192, 14, 6, st.accent, 'none', 'y');
    for (const x of [-82, 2]) s += box(x, -164, 80, 136, 8, c) + weave(x + 6, -158, 68, 124, dark(c, 0.25), 11) + R(x + 6, -158, 68, 124, 6, 'url(#g-shadeY)');
    s += Ln(-6, -100, -6, -84, st.accent, 3) + C(-6, -104, 4, st.wood) + Ln(10, -100, 10, -84, st.accent, 3) + C(10, -104, 4, st.wood);
    return s + motif('sun', 0, -40, 0.01) + P('M-90 -170 Q0 -150 90 -170', 'none', stroked('#fff3e6', 3)) + [-70, -40, -10, 20, 50, 80].map((x) => C(x - 6, -162 + Math.abs(x - 6) * 0.04, 3, '#fff3e6')).join('');
  }),
});

// ---------------- wall cabinets (wall) ----------------
const cupRow = (x: number, y: number, n: number, gap: number) => Array.from({ length: n }, (_, i) => { const xx = x + i * gap, col = ['#ff9ec7', '#7cc8ff', '#ffd36b', '#7fe0b0'][i % 4]; return R(xx - 9, y - 16, 18, 16, 5, col) + S(`M${xx + 9} ${y - 12} q6 2 0 8`, col, 2.5); }).join('');
const plates = (x: number, y: number, n: number, gap: number) => Array.from({ length: n }, (_, i) => C(x + i * gap, y - 15, 15, '#fff', stroked('#d9e4ee', 2)) + C(x + i * gap, y - 15, 9, 'none', stroked(['#ff9ec7', '#7cc8ff', '#7fe0b0'][i % 3], 2))).join('');
const WALLCABS = series('wallcab', 'Wall Cabinets', 'Wall Cabinet', 'kitchen', 'wall', {
  sweet: () => ({ w: 184, h: 120, art: (c) => {
    let s = box(-92, -54, 184, 102, 18, c);
    for (const x of [-84, 4]) s += box(x, -46, 80, 86, 14, light(c, 0.22)) + P(heartD(x + 40, -38, 32), '#fff8fb') + cupRow(x + 30, -4, 2, 20) + P(heartD(x + 40, -38, 32), GLASS) + P(heartD(x + (x < 0 ? 70 : 10), 18, 6), GOLD);
    for (let x = -82; x <= 82; x += 16.4) s += C(x, 50, 6, '#fff');
    return s;
  } }),
  modern: (st) => ({ w: 200, h: 90, art: (c) => {
    let s = box(-100, -36, 200, 66, 3, c) + Ln(0, -36, 0, 30, dark(c, 0.15), 2) + R(-96, -32, 92, 58, 2, '#e9eef6') + R(-82, -10, 10, 30, 3, '#cfe6f5') + R(-62, -16, 12, 36, 3, '#cfe6f5') + R(-40, -6, 18, 26, 4, '#fff') + R(-96, -32, 92, 58, 2, GLASS);
    s += R(10, 18, 80, 4, 2, st.accent) + R(-96, 30, 192, 5, 2, '#fff6c8') + `<path d="M-96 35 H96 L110 60 H-110Z" fill="url(#g-spot)" opacity="0.5"/>`;
    return s;
  } }),
  cottage: (st) => ({ w: 190, h: 130, art: (c) => {
    let s = box(-90, -50, 180, 104, 8, c) + R(-82, -42, 78, 88, 6, '#f4faff') + R(4, -42, 78, 88, 6, '#f4faff');
    s += plates(-62, 2, 3, 20) + plates(24, 2, 3, 20) + R(-82, 2, 164, 4, 2, light(c, 0.2)) + cupRow(-60, 42, 3, 20) + cupRow(26, 42, 3, 20);
    s += R(-82, -42, 78, 88, 6, GLASS) + R(4, -42, 78, 88, 6, GLASS) + R(-82, -42, 78, 88, 6, 'none', stroked(light(c, 0.3), 3)) + R(4, -42, 78, 88, 6, 'none', stroked(light(c, 0.3), 3));
    s += cloth('M-98 -64 H98 V-50 Q88 -38 78 -50 Q68 -38 58 -50 Q48 -38 38 -50 Q28 -38 18 -50 Q8 -38 -2 -50 Q-12 -38 -22 -50 Q-32 -38 -42 -50 Q-52 -38 -62 -50 Q-72 -38 -82 -50 Q-92 -38 -98 -50Z', st.wood, 'none', 'y');
    return s + knob(-10, 6, 4, '#fff') + knob(10, 6, 4, '#fff');
  } }),
  princess: (st) => ({ w: 190, h: 150, art: (c) => {
    let s = cloth(archD(-92, -62, 184, 120, 36), c, 'hearts');
    for (const x of [-80, 4]) { const a = archD(x, -42, 76, 88, 28); s += P(a, '#fff8fb') + cupRow(x + 28, 0, 2, 22) + R(x + 4, 0, 68, 4, 2, light(c, 0.2)) + plates(x + 24, 40, 2, 28) + P(a, GLASS) + P(a, 'none', `stroke="${GOLD}" stroke-width="4"`); }
    return s + motif('crown', 0, -66, 18) + knob(-6, 10, 4, GOLD) + knob(6, 10, 4, GOLD) + R(-92, 52, 184, 7, 3, GOLD) + curl(-30, -50, 0.6, st.trim, -1) + curl(30, -50, 0.6, st.trim, 1);
  } }),
  boho: (st) => ({ w: 190, h: 140, art: (c) => {
    let s = '';
    for (const y of [-14, 44]) s += box(-92, y, 184, 12, 4, st.wood) + R(-80, y + 12, 8, 12, 2, dark(st.wood, 0.2)) + R(72, y + 12, 8, 12, 2, dark(st.wood, 0.2));
    s += P('M-70 -14 L-66 -40 H-40 L-36 -14Z', st.accent) + sway(-53, -40, 4, 4, leaf(-56, -40, 1.2, -110) + leaf(-52, -40, 1.1, -60, '#8fd36b') + leaf(-54, -38, 1.3, 120) + leaf(-50, -36, 1.2, 60, '#5fae6b') + leaf(-40, -26, 1.1, 80, '#6fc47c'));
    s += R(-10, -42, 22, 28, 6, '#fff3e6', stroked(c, 2)) + R(-10, -34, 22, 8, 0, c) + R(20, -38, 22, 24, 6, '#e9f3fb', op(0.85)) + C(31, -24, 7, '#ffab5e') + R(52, -46, 20, 32, 8, light(st.accent, 0.2));
    s += cupRow(-60, 44, 3, 22) + E(40, 36, 28, 8, c) + E(40, 34, 22, 5, '#fff');
    return s + S('M-92 -64 V-14 M92 -64 V-14', st.wood, 2) + motif('sun', 0, -56, 12);
  } }),
  candy: (st) => ({ w: 190, h: 150, art: (c) => {
    let s = P('M-96 -24 L0 -76 L96 -24Z', '#a86b4a') + cloth(dripD(-98, -30, 196, 8, 18, 8, 2), '#fff3f8', 'none', 'y') + P('M-96 -24 L0 -76 L96 -24', 'none', stroked('#fff3f8', 8));
    s += C(-50, -42, 6, '#ff4f8b') + C(0, -60, 7, '#7cc8ff') + C(50, -42, 6, '#5fd3b5');
    s += box(-86, -18, 172, 74, 14, c, 'dots');
    for (const x of [-76, 6]) s += box(x, -10, 70, 58, 12, light(c, 0.35)) + P(`M${x + 8} -2 h54 v42 h-54Z`, '#fff8fb', op(0.0)) + lolly(x + 35, 18, 12, x < 0 ? '#ff4f8b' : '#c99bff');
    return s + sprinkles(-60, -60, 120, 26, 12, 3);
  } }),
});

// ---------------- kitchen islands ----------------
const isl = (art: (c: string) => string, extra: Partial<Spec> = {}): Spec => ({ w: 300, h: 190, art, surfaces: [{ x1: -150, x2: 150, y: -186 }], ...extra });
const ISLANDS = series('island', 'Kitchen Islands', 'Island', 'kitchen', 'floor', {
  modern: (st) => isl((c) => {
    let s = R(-126, -14, 240, 10, 2, st.wood) + box(-134, -174, 262, 164, 3, c) + R(-152, -188, 304, 14, 2, '#f7f7fa') + R(130, -188, 22, 188, 2, '#f7f7fa') + R(130, -188, 22, 188, 2, 'url(#g-shadeX)');
    s += S('M-140 -184 Q-90 -176 -40 -184 M136 -150 Q144 -100 138 -40', '#d9dde8', 1.5);
    for (const x of [-134, -46, 42]) s += Ln(x + 88, -174, x + 88, -14, dark(c, 0.15), 2) + R(x + 24, -162, 40, 4, 2, st.accent);
    return s + R(-130, -170, 4, 150, 2, '#fff', op(0.5));
  }),
  cottage: (st) => isl((c) => {
    let s = '';
    for (const x of [-136, 124]) s += R(x, -176, 14, 176, 5, st.wood) + C(x + 7, -120, 9, st.wood) + C(x + 7, -50, 9, st.wood);
    s += box(-124, -172, 248, 100, 8, c) + R(-124, -70, 248, 8, 3, st.wood) + R(-124, -20, 248, 8, 3, st.wood);
    for (const x of [-110, -40, 30]) s += box(x + 8, -164, 56, 84, 8, light(c, 0.18)) + knob(x + 36, -122, 5, '#fff');
    for (const x of [-100, -6, 88]) s += box(x - 36, -62, 72, 42, 8, '#e8c08a') + weave(x - 32, -58, 64, 34, '#b58a50', 9);
    s += C(-100, -66, 8, '#e8384f') + C(-88, -68, 8, '#ff7a3d') + C(-6, -66, 9, '#ffd84a');
    s += box(-156, -194, 312, 22, 6, WOOD) + grain(-150, -192, 300, 18, WOOD_D, 12);
    return s + towel(110, -172, 28, 44, '#ff9ec7');
  }, { surfaces: [{ x1: -156, x2: 156, y: -194 }], h: 196 }),
  princess: (st) => isl((c) => {
    let s = cabLeg(-110, -30, 30, GOLD, -1) + cabLeg(110, -30, 30, GOLD, 1) + cabLeg(-40, -30, 30, GOLD, -1) + cabLeg(40, -30, 30, GOLD, 1);
    s += box(-140, -176, 280, 148, 60, c, 'hearts') + box(-152, -190, 304, 16, 8, '#fbf7fa', 'none', 'y') + S('M-140 -186 Q-90 -178 -50 -186 M60 -184 Q100 -190 140 -182', '#d9d0e0', 1.5);
    for (const x of [-100, 0, 100]) s += R(x - 34, -158, 68, 112, 18, 'none', stroked(st.trim, 3)) + knob(x, -100, 5, GOLD);
    return s + motif('crown', 0, -160, 12) + curl(-60, -40, 0.7, st.trim, 1) + curl(60, -40, 0.7, st.trim, -1);
  }),
  candy: (st) => isl((c) => {
    let s = box(-140, -176, 280, 170, 22, c) + R(-140, -116, 280, 18, 0, st.soft) + R(-140, -60, 280, 18, 0, '#fff3f8');
    for (let x = -126; x <= 126; x += 21) s += C(x, -10, 11, '#fff3f8') + C(x - 3, -13, 3, '#fff');
    s += cloth(dripD(-148, -194, 296, 16, 36, 10, 9), '#fff3f8', 'none', 'y') + sprinkles(-136, -190, 272, 12, 26, 2) + sprinkles(-130, -150, 260, 26, 14, 5);
    return s + motif('strawberry', -80, -84, 14) + motif('strawberry', 0, -84, 14) + motif('strawberry', 80, -84, 14) + gloss(-130, -160, 6, 120);
  }, { surfaces: [{ x1: -148, x2: 148, y: -194 }], h: 196 }),
  woodland: (st) => isl((c) => {
    let s = '';
    for (const x of [-108, 108]) s += box(x - 30, -170, 60, 170, 10, '#a86b4a') + S(`M${x - 18} -160 Q${x - 22} -90 ${x - 16} -10 M${x + 2} -164 Q${x - 2} -90 ${x + 4} -10 M${x + 18} -160 Q${x + 22} -90 ${x + 16} -14`, '#7a4a32', 2.2) + E(x, 0, 40, 6, '#5fae6b');
    s += box(-78, -160, 156, 120, 10, c) + R(-78, -100, 156, 4, 2, dark(c, 0.15)) + shroom(-20, -130, 7) + shroom(20, -130, 7) + shroom(-20, -70, 7) + shroom(20, -70, 7);
    s += box(-156, -196, 312, 26, 13, '#c98a5a') + R(-156, -176, 312, 8, 4, '#7a4a32') + C(-148, -183, 13, '#e8b46a') + C(-148, -183, 8, 'none', stroked('#c98a5a', 2)) + C(-148, -183, 3, '#c98a5a') + grain(-130, -194, 260, 16, '#8a5a3c', 13);
    return s + leaf(-150, -198, 1.3, -150) + leaf(-134, -200, 1, -110, '#8fd36b') + leaf(140, -198, 1.2, -40);
  }, { surfaces: [{ x1: -156, x2: 156, y: -196 }], h: 200 }),
});

// ---------------- dining tables ----------------
const TABLES = series('table', 'Dining Tables', 'Table', 'kitchen', 'floor', {
  sweet: () => ({ name: 'Sweet Round Table', w: 240, h: 150, surfaces: [{ x1: -110, x2: 110, y: -146 }], art: (c) => {
    let s = E(0, -6, 52, 9, GOLD) + R(-10, -110, 20, 106, 8, GOLD) + E(0, -40, 18, 6, GOLD) + E(0, -146, 112, 14, '#fff');
    let d = 'M-118 -144 Q0 -160 118 -144 L120 -98';
    for (let i = 0; i < 8; i++) { const x = 120 - (i + 1) * 30; d += ` Q${x + 15} -82 ${x} -98`; }
    s += cloth(d + 'Z', c, 'hearts', 'y') + P('M-118 -144 Q0 -160 118 -144 L118 -136 Q0 -152 -118 -136Z', '#fff', op(0.6));
    for (let i = 0; i < 8; i++) s += C(105 - i * 30, -92, 4, '#fff');
    return s;
  } }),
  cottage: (st) => ({ name: 'Cottage Long Table', w: 330, h: 150, surfaces: [{ x1: -165, x2: 165, y: -150 }], art: (c) => {
    let s = '';
    for (const x of [-140, 140]) s += R(x - 8, -134, 16, 134, 6, c) + C(x, -90, 10, c) + C(x, -40, 9, c) + E(x, -90, 10, 10, 'url(#g-shadeX)');
    s += box(-150, -136, 300, 22, 4, c) + box(-165, -150, 330, 16, 5, WOOD) + grain(-160, -148, 320, 12, WOOD_D, 14);
    return s + cloth('M-50 -150 H50 V-104 L0 -94 L-50 -104Z', '#fff', 'check', 'y') + R(-50, -150, 100, 4, 0, '#ff9ec7');
  } }),
  modern: (st) => ({ name: 'Modern Café Table', w: 170, h: 136, surfaces: [{ x1: -80, x2: 80, y: -134 }], art: (c) => {
    return E(0, -4, 44, 7, INK) + R(-5, -128, 10, 124, 4, INK) + E(0, -128, 82, 10, dark(c, 0.15)) + E(0, -133, 82, 10, c) + E(0, -133, 82, 10, 'url(#g-shadeX)') + E(-30, -136, 30, 3, '#fff', op(0.5));
  } }),
  princess: (st) => ({ name: 'Princess Banquet Table', w: 330, h: 156, surfaces: [{ x1: -160, x2: 160, y: -150 }], art: (c) => {
    let s = cabLeg(-130, -100, 100, GOLD, -1) + cabLeg(130, -100, 100, GOLD, 1) + R(-130, -60, 260, 6, 3, GOLD) + box(-162, -152, 324, 14, 6, '#fff');
    let d = 'M-160 -146 H160 V-96';
    for (let i = 0; i < 10; i++) { const x = 160 - (i + 1) * 32; d += ` Q${x + 16} -78 ${x} -96`; }
    s += cloth(d + 'Z', c, 'hearts', 'y') + cloth('M-160 -146 H160 V-128 H-160Z', '#fff', 'dots', 'y') + R(-160, -132, 320, 4, 2, GOLD);
    for (let i = 0; i < 10; i++) s += C(144 - i * 32, -86, 4, GOLD);
    return s + bowG(-120, -122, 0.6, '#ff7eb6') + bowG(120, -122, 0.6, '#ff7eb6') + motif('crown', 0, -112, 12);
  } }),
  woodland: (st) => ({ name: 'Woodland Log Table', w: 320, h: 150, surfaces: [{ x1: -160, x2: 160, y: -150 }], art: (c) => {
    let s = '';
    for (const x of [-110, 110]) s += `<g transform="rotate(${x < 0 ? 12 : -12} ${x} -70)">${box(x - 10, -140, 20, 140, 8, '#a86b4a')}</g>` + `<g transform="rotate(${x < 0 ? -12 : 12} ${x} -70)">${box(x - 10, -140, 20, 140, 8, '#8a5a3c')}</g>`;
    s += box(-160, -152, 320, 18, 9, c === ST.woodland.main ? '#c98a5a' : c);
    s += Ln(-60, -150, -60, -134, '#7a4a32', 2) + Ln(50, -150, 50, -134, '#7a4a32', 2) + C(-160, -143, 9, '#e8b46a') + C(-160, -143, 4, 'none', stroked('#a86b4a', 1.5)) + grain(-150, -150, 300, 14, '#8a5a3c', 4);
    return s + E(0, -152, 30, 4, c) + leaf(-10, -158, 1.2, -20, c) + leaf(4, -156, 1, 30, '#8fd36b') + shroom(140, -152, 7);
  } }),
  retro: (st) => ({ name: 'Retro Diner Table', w: 260, h: 140, surfaces: [{ x1: -130, x2: 130, y: -138 }], art: (c) => {
    let s = E(0, -6, 56, 9, SIL) + R(-9, -124, 18, 120, 6, SIL) + box(-130, -140, 260, 16, 6, c) + R(-132, -128, 264, 5, 2.5, SIL);
    for (const [x, y] of [[-90, -134], [-40, -132], [20, -135], [80, -133]] as [number, number][]) s += P(`M${x} ${y} q8 -4 14 0 q-6 1 -14 0Z`, dark(c, 0.25)) + C(x + 26, y + 1, 1.5, st.accent);
    return s + gloss(-120, -138, 60, 3);
  } }),
});

// ---------------- dining chairs & benches ----------------
const sit = (x: number, y: number) => ({ x, y, pose: 'sit' as const });
const CHAIRS = series('chair', 'Dining Chairs', 'Chair', 'kitchen', 'floor', {
  sweet: () => ({ w: 110, h: 200, seats: [sit(0, -86)], art: (c) => {
    return leg(-36, -84, 84, GOLD, 8) + leg(36, -84, 84, GOLD, 8) + R(-8, -150, 16, 64, 6, dark(c, 0.1)) + P(heartD(0, -206, 72), c) + P(heartD(0, -206, 72), 'url(#g-shadeX)') + P(heartD(0, -188, 40), light(c, 0.4)) + box(-52, -96, 104, 20, 10, dark(c, 0.06), 'none', 'y') + R(-44, -94, 30, 5, 2.5, '#fff', op(0.4));
  } }),
  princess: (st) => ({ w: 120, h: 250, seats: [sit(0, -86)], art: (c) => {
    let s = cabLeg(-40, -80, 80, GOLD, -1) + cabLeg(40, -80, 80, GOLD, 1) + P(archD(-48, -236, 96, 150, 50), GOLD) + cloth(archD(-40, -228, 80, 140, 44), c);
    for (const [x, y] of [[-16, -190], [16, -190], [0, -165], [-16, -140], [16, -140], [0, -115]] as [number, number][]) s += C(x, y, 3, dark(c, 0.2)) + C(x - 1, y - 1, 1, '#fff');
    return s + motif('crown', 0, -244, 16) + box(-56, -98, 112, 22, 11, c, 'none', 'y') + R(-56, -80, 112, 5, 2.5, GOLD);
  } }),
  modern: (st) => ({ w: 110, h: 180, seats: [sit(0, -84)], art: (c) => {
    let s = `<g transform="rotate(8 -30 -40)">${R(-34, -80, 7, 80, 3, st.wood)}</g><g transform="rotate(-8 30 -40)">${R(27, -80, 7, 80, 3, st.wood)}</g>` + Ln(-28, -50, 28, -50, INK, 2.5) + Ln(-20, -80, -26, -50, INK, 2.5) + Ln(20, -80, 26, -50, INK, 2.5);
    return s + cloth('M-50 -170 Q-56 -110 -50 -94 Q-50 -78 -30 -78 H30 Q50 -78 50 -94 Q56 -110 50 -170 Q40 -180 0 -180 Q-40 -180 -50 -170Z', c) + P('M-42 -100 Q0 -88 42 -100', 'none', stroked(dark(c, 0.15), 3)) + gloss(-42, -168, 7, 50);
  } }),
  cottage: (st) => ({ w: 110, h: 210, seats: [sit(0, -86)], art: (c) => {
    let s = R(-44, -206, 12, 206, 5, st.wood) + R(32, -206, 12, 206, 5, st.wood) + C(-38, -208, 7, st.wood) + C(38, -208, 7, st.wood);
    for (const y of [-190, -162, -134]) s += box(-34, y, 68, 12, 5, st.wood);
    s += R(-40, -40, 80, 6, 3, st.wood) + box(-52, -98, 104, 14, 5, st.wood) + cloth('M-50 -108 Q0 -116 50 -108 Q54 -96 46 -94 H-46 Q-54 -96 -50 -108Z', c, 'check', 'y');
    return s + S('M-44 -100 q-8 6 -4 16 M44 -100 q8 6 4 16', c, 3);
  } }),
  woodland: (st) => ({ name: 'Woodland Log Bench', w: 240, h: 110, seats: [sit(-55, -90), sit(55, -90)], art: (c) => {
    let s = '';
    for (const x of [-90, 90]) s += box(x - 24, -66, 48, 66, 10, '#a86b4a') + S(`M${x - 10} -60 V-6 M${x + 8} -62 V-8`, '#7a4a32', 2) + E(x, 0, 30, 5, '#5fae6b');
    s += box(-120, -92, 240, 30, 15, '#c98a5a') + R(-120, -72, 240, 10, 5, '#7a4a32') + C(-116, -77, 14, '#e8b46a') + C(-116, -77, 8, 'none', stroked('#c98a5a', 2)) + grain(-100, -90, 210, 18, '#8a5a3c', 3);
    return s + cloth('M-30 -96 Q0 -104 30 -96 V-84 H-30Z', c, 'check', 'y') + leaf(100, -96, 1.2, -40) + leaf(86, -98, 1, -90, '#8fd36b');
  } }),
  retro: (st) => ({ name: 'Retro Diner Booth', w: 240, h: 180, seats: [sit(-55, -94), sit(55, -94)], art: (c) => {
    let s = R(-110, -20, 220, 20, 4, SIL) + box(-120, -180, 240, 100, 30, c);
    for (let x = -96; x <= 96; x += 32) s += box(x - 15, -170, 30, 86, 14, light(c, 0.12));
    s += R(-120, -184, 240, 8, 4, SIL) + box(-124, -96, 248, 28, 12, c, 'none', 'y') + R(-124, -72, 248, 6, 3, SIL) + box(-116, -66, 232, 46, 4, dark(c, 0.15));
    return s + R(-116, -62, 232, 4, 2, st.accent) + gloss(-112, -170, 6, 70);
  } }),
  boho: (st) => ({ name: 'Boho Rattan Chair', w: 150, h: 230, seats: [sit(0, -86)], art: (c) => {
    let s = leg(-40, -80, 80, st.wood, 8) + leg(40, -80, 80, st.wood, 8) + Ln(-40, -30, 40, -30, st.wood, 4);
    s += P('M0 -84 C-90 -96 -86 -230 0 -230 C86 -230 90 -96 0 -84Z', '#e8c08a') + weave(-60, -214, 120, 118, '#b58a50', 12) + P('M0 -84 C-90 -96 -86 -230 0 -230 C86 -230 90 -96 0 -84Z', 'none', stroked('#c9965a', 6));
    return s + box(-58, -100, 116, 22, 11, c, 'none', 'y') + E(0, -120, 34, 20, st.soft) + E(0, -120, 34, 20, 'url(#g-shadeX)') + motif('sun', 0, -120, 8);
  } }),
});

// ---------------- bar stools ----------------
const STOOLS = series('barstool', 'Bar Stools', 'Bar Stool', 'kitchen', 'floor', {
  modern: (st) => ({ w: 100, h: 140, seats: [sit(0, -132)], art: (c) => E(0, -4, 34, 6, INK) + R(-4, -126, 8, 122, 3, INK) + E(0, -50, 26, 5, 'none', stroked(INK, 4)) + cloth('M-44 -134 Q-44 -146 -30 -142 Q0 -132 30 -142 Q44 -146 44 -134 Q40 -122 0 -122 Q-40 -122 -44 -134Z', c) + gloss(-34, -140, 22, 4) }),
  retro: (st) => ({ w: 100, h: 140, seats: [sit(0, -132)], art: (c) => E(0, -4, 34, 7, SIL) + R(-6, -124, 12, 120, 4, SIL) + E(0, -48, 24, 5, 'none', `stroke="${SIL}" stroke-width="5"`) + R(-44, -128, 88, 10, 5, SIL) + box(-44, -148, 88, 24, 12, c, 'none', 'y') + C(-16, -138, 2.5, dark(c, 0.25)) + C(16, -138, 2.5, dark(c, 0.25)) + C(0, -138, 2.5, dark(c, 0.25)) }),
  candy: (st) => ({ name: 'Cupcake Stool', w: 100, h: 150, seats: [sit(0, -128)], art: (c) => {
    let s = cloth('M-34 -108 H34 L26 0 H-26Z', c);
    for (let x = -24; x <= 24; x += 12) s += Ln(x * 1.3, -104, x, -4, dark(c, 0.14), 3);
    s += cloth('M-46 -110 C-54 -130 -30 -150 0 -150 C30 -150 54 -130 46 -110 Q0 -100 -46 -110Z', '#fff3f8', 'none', 'y') + P('M-30 -130 Q0 -146 30 -130', 'none', stroked('#f2dfe8', 3)) + sprinkles(-34, -146, 68, 30, 10, 6);
    return s + C(0, -154, 8, '#e8384f') + C(-2, -156, 2.5, '#fff', op(0.6));
  } }),
  beach: (st) => ({ w: 100, h: 140, seats: [sit(0, -128)], art: (c) => {
    let s = '';
    for (const x of [-30, 30]) { s += R(x - 5, -120, 10, 120, 4, st.wood); for (let y = -110; y < -20; y += 8) s += Ln(x - 6, y, x + 6, y + 4, '#d9b27a', 2.4); }
    return s + Ln(-30, -50, 30, -50, st.wood, 5) + E(0, -124, 46, 9, dark(c, 0.12)) + E(0, -130, 46, 10, c) + E(0, -130, 46, 10, 'url(#g-shadeX)') + starfish(0, -131, 8, '#fff');
  } }),
  space: (st) => ({ name: 'UFO Stool', w: 110, h: 150, seats: [sit(0, -126)], art: (c) => {
    let s = E(0, -4, 30, 6, SIL) + P('M-10 -116 L10 -116 L24 -6 H-24Z', '#7fe0ff', op(0.35)) + R(-5, -116, 10, 112, 4, SIL);
    s += E(0, -122, 54, 12, '#c9cfdd') + E(0, -126, 50, 9, c) + P('M-26 -130 Q-24 -152 0 -152 Q24 -152 26 -130Z', '#bfe8ff', op(0.75)) + P('M-26 -130 Q-24 -152 0 -152 Q24 -152 26 -130Z', GLASS);
    for (let i = 0; i < 5; i++) s += blinkC(-40 + i * 20, -121, 3, [st.accent, '#7fe0ff', '#ff7eb6', '#7fe0b0', st.accent][i], 1 + i * 0.2, i * 0.2);
    return s;
  } }),
});

// ---------------- high chairs ----------------
const HIGHCHAIRS = series('highchair', 'High Chairs', 'High Chair', 'kitchen', 'floor', {
  sweet: () => ({ w: 130, h: 250, seats: [sit(0, -130)], art: (c) => `<g transform="rotate(7 -40 -60)">${R(-44, -130, 9, 130, 4, GOLD)}</g><g transform="rotate(-7 40 -60)">${R(35, -130, 9, 130, 4, GOLD)}</g>` + Ln(-40, -40, 40, -40, '#e0b040', 3) + R(-34, -200, 9, 66, 4, dark(c, 0.1)) + R(25, -200, 9, 66, 4, dark(c, 0.1)) + P(heartD(0, -250, 64), c) + P(heartD(0, -250, 64), 'url(#g-shadeX)') + box(-44, -140, 88, 18, 8, dark(c, 0.06), 'none', 'y'),
    front: (c) => box(-60, -168, 120, 14, 7, '#fff', 'none', 'y') + R(-48, -156, 10, 30, 4, c) + R(38, -156, 10, 30, 4, c) + P(heartD(0, -164, 7), c) }),
  cottage: (st) => ({ w: 130, h: 250, seats: [sit(0, -130)], art: (c) => {
    let s = `<g transform="rotate(7 -40 -60)">${R(-45, -136, 11, 136, 4, st.wood)}</g><g transform="rotate(-7 40 -60)">${R(34, -136, 11, 136, 4, st.wood)}</g>` + R(-40, -60, 80, 7, 3, st.wood) + R(-40, -236, 10, 100, 4, st.wood) + R(30, -236, 10, 100, 4, st.wood);
    for (const y of [-228, -200]) s += box(-34, y, 68, 12, 5, st.wood);
    return s + box(-46, -142, 92, 16, 6, c, 'check', 'y');
  }, front: () => box(-62, -168, 124, 12, 5, WOOD) + R(-48, -156, 9, 28, 4, ST.cottage.wood) + R(39, -156, 9, 28, 4, ST.cottage.wood) + E(26, -170, 16, 6, '#fff') + E(26, -172, 10, 3, '#ffe3a8') }),
  rainbow: () => ({ w: 130, h: 250, seats: [sit(0, -130)], art: (c) => {
    let s = '';
    RAIN.slice(0, 4).forEach((col, i) => { const x = -42 + i * 28; s += `<g transform="rotate(${(x * -0.15).toFixed(1)} ${x} -70)">${R(x - 4, -134, 8, 134, 4, col)}</g>`; });
    return s + box(-46, -236, 92, 104, 36, c) + motif('rainbow', 0, -200, 22) + box(-46, -142, 92, 16, 8, dark(c, 0.06), 'none', 'y');
  }, front: (c) => box(-62, -168, 124, 14, 7, '#fff', 'none', 'y') + R(-48, -156, 10, 30, 4, c) + R(38, -156, 10, 30, 4, c) + C(-20, -172, 5, '#ff7eb6') + C(-6, -172, 5, '#7cc8ff') }),
});

// ---------------- pantry shelves ----------------
const jar = (x: number, y: number, w: number, h: number, fill: string, lid: string) => R(x - w / 2, y - h, w, h, 6, '#eef6fb', op(0.9)) + R(x - w / 2 + 3, y - h * 0.75, w - 6, h * 0.75 - 3, 4, fill) + R(x - w / 2 - 2, y - h - 6, w + 4, 8, 3, lid) + R(x - w / 2 + 3, y - h + 3, 4, h - 8, 2, '#fff', op(0.7));
const PANTRY_SPAWN = ['apple', 'cookie', 'banana', 'cheese', 'juice', 'apples3'];
const pantry = (art: (c: string) => string, ys: number[], x1 = -80, x2 = 80, extra: Partial<Spec> = {}): Spec => ({ w: 180, h: 300, spawn: PANTRY_SPAWN, art, surfaces: ys.map((y) => ({ x1, x2, y })), ...extra });
const PANTRIES = series('pantry', 'Pantry Shelves', 'Pantry', 'kitchen', 'floor', {
  cottage: (st) => pantry((c) => {
    let s = box(-88, -300, 176, 292, 8, c) + R(-78, -290, 156, 276, 4, light(c, 0.55)) + R(-78, -290, 156, 276, 4, 'url(#g-shadeY)');
    for (const y of [-212, -136, -60]) s += box(-84, y, 168, 10, 3, st.wood);
    s += jar(-52, -212, 30, 40, '#ffd36b', '#e8907a') + jar(-14, -212, 30, 50, '#fff3e6', '#ff9ec7') + jar(24, -212, 30, 36, '#e8384f', '#fff') + E(56, -222, 18, 10, '#e8c08a');
    s += box(-70, -170, 60, 34, 6, '#e8c08a') + weave(-66, -166, 52, 26, '#b58a50', 9) + C(-50, -172, 9, '#e8384f') + C(-32, -174, 9, '#5fc47c') + P('M10 -136 Q4 -182 30 -186 Q56 -182 50 -136Z', '#fff3e6') + txt(30, -150, 10, '#c98a5a', 'flour');
    s += cloth('M-80 -56 H80 V-12 Q60 -6 40 -12 Q20 -6 0 -12 Q-20 -6 -40 -12 Q-60 -6 -80 -12Z', '#fff', 'check', 'y');
    return s + box(-92, -306, 184, 12, 4, st.wood) + flowerG(-60, -314, 7, '#ff9ec7');
  }, [-300, -212, -136], -88, 88, { h: 320 }),
  modern: (st) => pantry((c) => {
    let s = R(-84, -300, 6, 300, 2, INK) + R(78, -300, 6, 300, 2, INK);
    for (const y of [-296, -222, -148, -74]) s += R(-86, y, 172, 6, 2, c) + R(-86, y + 6, 172, 2, 1, dark(c, 0.2));
    s += [[-50, -222], [0, -222], [50, -222], [-36, -148], [30, -148]].map(([x, y]) => R(x - 20, y - 40, 40, 40, 4, '#e9f3fb', op(0.85)) + R(x - 16, y - 26, 32, 24, 3, ['#ffd36b', '#e8384f', '#7fe0b0', '#ffab5e', '#c99bff'][(x + 60) % 5 === 0 ? 0 : Math.abs(x) % 5]) + R(x - 20, y - 40, 40, 40, 4, GLASS)).join('');
    s += box(-70, -74, 64, 60, 6, st.wood) + box(6, -74, 64, 60, 6, st.wood);
    return s + R(-66, -64, 56, 3, 1.5, dark(st.wood, 0.2)) + R(10, -64, 56, 3, 1.5, dark(st.wood, 0.2)) + R(-86, -8, 172, 8, 2, INK);
  }, [-296, -222, -148]),
  candy: (st) => pantry((c) => {
    let s = box(-88, -300, 176, 292, 22, c) + R(-76, -280, 152, 260, 12, '#fff8fb') + cloth(dripD(-92, -312, 184, 14, 22, 7, 4), '#fff3f8', 'none', 'y');
    for (const y of [-210, -124, -40]) s += box(-80, y, 160, 9, 4, light(c, 0.2));
    for (const [x, y, col] of [[-48, -210, '#ff4f8b'], [0, -210, '#7cc8ff'], [48, -210, '#ffd36b'], [-40, -124, '#5fd3b5'], [36, -124, '#c99bff']] as [number, number, string][]) {
      s += C(x, y - 26, 22, '#eef6fb', op(0.9));
      for (let i = 0; i < 7; i++) s += C(x - 12 + (i % 4) * 8, y - 14 - Math.floor(i / 4) * 10, 4.5, CANDY[(i + x) % 5 === 0 ? 0 : (i + Math.abs(x)) % 5]);
      s += R(x - 10, y - 52, 20, 7, 3, col) + C(x, y - 26, 22, GLASS);
    }
    s += Ln(-40, -40, -40, -76, '#fff', 4) + lolly(-40, -84, 14, '#ff4f8b') + Ln(0, -40, 0, -70, '#fff', 4) + lolly(0, -78, 12, '#ffd36b') + Ln(40, -40, 40, -80, '#fff', 4) + lolly(40, -88, 14, '#5fd3b5');
    return s + sprinkles(-70, -306, 140, 10, 10, 8);
  }, [-306, -210, -124], -80, 80, { h: 320 }),
  woodland: (st) => pantry((c) => {
    let s = '';
    for (const y of [-300, -206, -112]) s += box(-84, y, 168, 88, 6, '#c98a5a') + R(-76, y + 8, 152, 72, 4, '#8a5a3c') + Ln(-76, y + 44, 76, y + 44, '#a86b4a', 3) + R(-84, y + 80, 168, 8, 3, '#a86b4a');
    s += C(-50, -226, 12, '#e8384f') + C(-28, -224, 12, '#e8573d') + C(-40, -240, 11, '#ff7a3d') + E(30, -226, 26, 14, '#ffd84a') + E(30, -236, 16, 6, '#5fae6b');
    s += P('M-60 -132 L-48 -170 L-36 -132Z', '#ff8a3d') + E(-48, -172, 8, 4, '#5fae6b') + P('M-34 -132 L-22 -166 L-10 -132Z', '#ff8a3d') + E(-22, -168, 8, 4, '#5fae6b') + C(32, -146, 16, '#8fd36b') + C(32, -146, 9, '#b6e79a');
    s += shroom(-40, -40, 14) + shroom(-10, -44, 10) + C(36, -46, 14, '#c98a5a') + P('M22 -48 Q36 -64 50 -48Z', '#6b4a3a');
    return s + leaf(-90, -304, 1.3, -150, c) + leaf(-72, -308, 1, -110, '#8fd36b') + leaf(80, -304, 1.2, -30, c);
  }, [-300, -206, -112], -80, 80, { h: 316 }),
});

// ---------------- countertop props ----------------
const pr = (w: number, h: number, art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w, h, art, ...extra });
const MICROWAVES = series('microwave', 'Microwaves', 'Microwave', 'kitchen', 'prop', {
  sweet: () => pr(120, 84, (c, on) => {
    let s = bun(-42, 0, GOLD, 7) + bun(42, 0, GOLD, 7) + box(-56, -72, 112, 66, 16, c);
    s += R(-46, -62, 70, 46, 10, on ? '#ffd36b' : '#4a3346') + (on ? glow(-11, -39, 40) + bob(tr(-11, -24, P('M-10 0 L10 0 L7 -12 H-7Z', '#7cc8ff') + C(0, -16, 8, '#fff3f8') + C(0, -24, 3, '#e8384f')), 1.5, 0.8) : '') + R(-46, -62, 70, 46, 10, GLASS);
    s += P(heartD(40, -60, 8), '#fff') + C(34, -38, 3.5, '#fff') + C(46, -38, 3.5, '#fff') + C(34, -28, 3.5, '#fff') + C(46, -28, 3.5, '#fff') + R(32, -20, 16, 6, 3, on ? '#7fe0b0' : light(c, 0.4));
    return s + bowG(-30, -72, 0.45, '#ff4f8b');
  }, { toggle: true, sfx: 'ding', spawn: ['pizza', 'cupcake'] }),
  retro: (st) => pr(120, 80, (c, on) => {
    let s = R(-44, -8, 12, 8, 3, SIL) + R(32, -8, 12, 8, 3, SIL) + box(-58, -76, 116, 68, 24, c) + R(-58, -40, 116, 4, 2, SIL, op(0.7));
    s += R(-50, -66, 72, 50, 18, SIL) + R(-44, -60, 60, 38, 14, on ? '#ffd36b' : '#3a3346') + (on ? glow(-14, -41, 34) : '') + R(-44, -60, 60, 38, 14, GLASS);
    for (const y of [-56, -32]) s += knob(40, y, 9, st.accent) + Ln(40, y, 40, y - 7, '#fff', 2.5);
    return s + R(30, -18, 20, 5, 2.5, on ? '#ff7a6b' : '#fff') + gloss(-52, -70, 30, 4);
  }, { toggle: true, sfx: 'ding', spawn: ['pizza'] }),
  space: (st) => pr(120, 100, (c, on) => {
    let s = Ln(-30, -84, -40, -98, '#c9cfdd', 3) + blinkC(-40, -100, 4, '#ff6b8a', 1.1) + R(-50, -10, 100, 10, 5, SIL);
    s += cloth(archD(-58, -86, 116, 78, 40), c, 'stars') + C(-10, -44, 26, SIL) + C(-10, -44, 21, on ? '#ffd36b' : '#1e2350') + (on ? glow(-10, -44, 30) : P(starD(-16, -50, 4), '#fff')) + C(-10, -44, 21, GLASS);
    return s + blinkC(36, -56, 4, st.accent, 1.2) + blinkC(36, -42, 4, '#7fe0ff', 0.9, 0.3) + blinkC(36, -28, 4, '#ff7eb6', 1.5, 0.6);
  }, { toggle: true, sfx: 'ding', spawn: ['pizza'] }),
});

/** Toast slices popping out of a toaster. */
const toast = (x: number, y: number, on: boolean) => on ? bob(R(x - 8, y - 26, 16, 28, 6, '#e8b46a') + R(x - 6, y - 24, 12, 4, 2, '#f6d39a'), 3, 0.9) : R(x - 8, y - 4, 16, 6, 3, '#e8b46a');
const TOASTERS = series('toaster', 'Toasters', 'Toaster', 'kitchen', 'prop', {
  retro: (st) => pr(96, 80, (c, on) => {
    let s = toast(-12, -56, on) + toast(12, -56, on) + P('M-44 -6 C-48 -60 -30 -62 0 -62 C30 -62 48 -60 44 -6Z', SIL) + R(-46, -6, 92, 6, 3, INK);
    s += R(-46, -34, 92, 12, 0, c) + R(-14, -60, 8, 4, 2, INK) + R(8, -60, 8, 4, 2, INK) + R(44, on ? -46 : -24, 10, 6, 3, INK) + gloss(-30, -54, 6, 40, 0.6);
    return s + motif('star', 0, -28, 5);
  }, { toggle: true, sfx: 'ding' }),
  cottage: (st) => pr(96, 72, (c, on) => {
    let s = toast(-12, -54, on) + toast(12, -54, on) + R(-48, -8, 96, 8, 3, st.wood) + box(-42, -58, 84, 52, 14, c);
    return s + R(-20, -60, 14, 5, 2.5, '#fff') + R(6, -60, 14, 5, 2.5, '#fff') + flowerG(-16, -30, 7, '#fff') + flowerG(4, -24, 5, '#ffb3c7') + R(42, on ? -48 : -28, 10, 6, 3, '#fff3d6');
  }, { toggle: true, sfx: 'ding' }),
  candy: (st) => pr(96, 76, (c, on) => {
    let s = toast(-12, -56, on) + toast(12, -56, on) + (on ? bob(P(heartD(-12, -76, 5), '#e8384f') + P(heartD(12, -76, 5), '#e8384f'), 3, 0.9) : '');
    s += box(-42, -58, 84, 54, 16, c, 'dots') + cloth(dripD(-42, -58, 84, 6, 12, 4, 2), '#fff3f8', 'none', 'y') + R(-20, -60, 14, 5, 2.5, '#c94f7b') + R(6, -60, 14, 5, 2.5, '#c94f7b');
    return s + lolly(48, on ? -44 : -26, 7, '#7cc8ff') + bun(-26, 0, st.accent, 6) + bun(26, 0, st.accent, 6);
  }, { toggle: true, sfx: 'ding' }),
});

const cup = (x: number, y: number, col: string) => P(`M${f(x - 11)} ${f(y - 18)} H${f(x + 11)} L${f(x + 9)} ${f(y)} H${f(x - 9)}Z`, col) + S(`M${f(x + 10)} ${f(y - 14)} q7 2 0 9`, col, 2.5) + E(x, y - 18, 11, 3, '#8a5a3c');
const drip = (x: number, y1: number, y2: number) => `<line x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2)}" stroke="#8a5a3c" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.4s" repeatCount="indefinite"/></line>`;
const COFFEE = series('coffee', 'Coffee Machines', 'Coffee Machine', 'kitchen', 'prop', {
  modern: (st) => pr(90, 110, (c, on) => {
    let s = box(-40, -106, 80, 100, 6, c) + R(-42, -8, 84, 8, 2, INK) + R(-40, -106, 80, 14, 4, INK) + R(-28, -86, 56, 12, 3, INK) + txt(-12, -77, 8, '#7fe0ff', on ? 'brew' : 'ready') + C(18, -80, 3, on ? '#7fe0b0' : '#9aa3b5');
    s += R(-18, -68, 36, 10, 3, INK) + R(-30, -14, 60, 6, 2, '#9aa3b5') + cup(0, -14, '#fff');
    return s + (on ? drip(0, -58, -32) + steam(0, -40, 0.6) : '') + R(-36, -100, 4, 86, 2, '#fff', op(0.5));
  }, { toggle: true }),
  retro: (st) => pr(90, 120, (c, on) => {
    let s = R(-40, -10, 80, 10, 4, SIL) + boxT(-36, -110, 72, 100, 30, 8, c) + R(-36, -70, 72, 5, 2.5, SIL) + C(0, -90, 13, SIL) + C(0, -90, 10, '#fff') + Ln(0, -90, on ? 6 : -6, -96, '#ff4f6d', 2);
    s += R(-16, -62, 32, 10, 4, SIL) + R(-26, -50, 8, 4, 2, INK) + cup(0, -12, st.accent);
    return s + (on ? drip(0, -50, -30) + steam(0, -38, 0.6) : '') + gloss(-28, -100, 5, 30);
  }, { toggle: true }),
  sweet: () => pr(90, 110, (c, on) => {
    let s = R(-40, -8, 80, 8, 4, GOLD) + box(-38, -104, 76, 96, 22, c) + P(heartD(0, -96, 16), '#fff') + R(-16, -66, 32, 10, 5, GOLD);
    s += R(-30, -14, 60, 5, 2, light(c, 0.3)) + cup(0, -14, '#fff') + P(heartD(0, -30, 4), '#fff');
    return s + (on ? drip(0, -56, -32) + steam(0, -40, 0.6) : '') + gloss(-30, -94, 5, 40) + knob(26, -78, 4, GOLD);
  }, { toggle: true }),
});

/** A blender jar with its smoothie; the blade whirls while on. */
function blendJar(x: number, y: number, w: number, h: number, juice: string, on: boolean, lid: string): string {
  const jar = `M${f(x - w / 2)} ${f(y - h)} H${f(x + w / 2)} L${f(x + w * 0.36)} ${f(y)} H${f(x - w * 0.36)}Z`;
  let s = P(jar, '#eef6fb', op(0.75));
  const top = on ? `M${f(x - w * 0.44)} ${f(y - h * 0.7)} Q${f(x)} ${f(y - h * 0.85)} ${f(x + w * 0.44)} ${f(y - h * 0.7)} L${f(x + w * 0.36)} ${f(y - 2)} H${f(x - w * 0.36)}Z` : `M${f(x - w * 0.42)} ${f(y - h * 0.6)} H${f(x + w * 0.42)} L${f(x + w * 0.36)} ${f(y - 2)} H${f(x - w * 0.36)}Z`;
  s += P(top, juice);
  if (on) s += `<g transform="translate(${f(x)} 0)"><ellipse cx="0" cy="${f(y - h * 0.4)}" rx="${f(w * 0.25)}" ry="${f(h * 0.18)}" fill="#fff" opacity="0.35"/><animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="0.3s" repeatCount="indefinite" additive="sum"/></g>`;
  s += on ? spin(x, y - 6, 0.2, E(x, y - 6, w * 0.25, 2.5, '#9aa3b5')) : E(x, y - 6, w * 0.25, 2.5, '#9aa3b5');
  return s + P(jar, GLASS) + R(x - w / 2 - 3, y - h - 8, w + 6, 10, 4, lid) + S(`M${f(x + w / 2 - 2)} ${f(y - h * 0.8)} q14 4 8 ${f(h * 0.5)}`, '#eef6fb', 5, op(0.9));
}
const BLENDERS = series('blender', 'Blenders', 'Blender', 'kitchen', 'prop', {
  sweet: () => pr(70, 130, (c, on) => box(-30, -40, 60, 40, 12, c) + knob(0, -20, 6, GOLD) + P(heartD(-16, -34, 5), '#fff') + blendJar(0, -40, 50, 80, '#ff8fb0', on, c) + (on ? C(-6, -98, 4, '#e8384f') : C(-8, -66, 6, '#e8384f') + C(6, -60, 5, '#e8384f')), { toggle: true, spawn: ['juice'] }),
  modern: (st) => pr(70, 130, (c, on) => box(-30, -40, 60, 40, 4, c) + R(-22, -26, 44, 8, 3, INK) + C(-10, -22, 2, on ? '#7fe0b0' : '#9aa3b5') + C(0, -22, 2, '#9aa3b5') + C(10, -22, 2, '#9aa3b5') + blendJar(0, -40, 48, 84, '#9fe08a', on, INK), { toggle: true, spawn: ['juice'] }),
  beach: (st) => pr(70, 130, (c, on) => box(-30, -40, 60, 40, 14, c) + motif('fish', 0, -20, 10) + blendJar(0, -40, 50, 80, '#ffb35e', on, '#fff') + Ln(10, -136, 18, -92, '#ff7eb6', 4) + E(-18, -124, 10, 4, '#ffe06b', 'transform="rotate(-20 -18 -124)"'), { toggle: true, spawn: ['juice'] }),
});

const KETTLES = series('kettle', 'Kettles', 'Kettle', 'kitchen', 'prop', {
  cottage: (st) => pr(90, 80, (c, on) => {
    let s = P('M30 -34 Q46 -40 48 -56', 'none', stroked(c, 7)) + E(0, -28, 34, 28, c) + E(0, -28, 34, 28, 'url(#g-shadeX)') + R(-30, -6, 60, 6, 3, dark(c, 0.15));
    s += S('M-22 -50 Q0 -78 22 -50', INK, 5) + E(0, -54, 16, 5, '#fff') + C(0, -60, 5, INK) + flowerG(-4, -26, 9, '#fff') + flowerG(14, -16, 5, '#ff9ec7') + leaf(-18, -20, 0.7, 160);
    return s + (on ? steam(48, -60, 0.8) : '');
  }, { toggle: true }),
  modern: (st) => pr(100, 90, (c, on) => {
    let s = S('M24 -20 Q50 -24 46 -60 Q46 -66 54 -66', c, 4) + P('M-28 -6 L-24 -46 Q0 -54 24 -46 L28 -6Z', c) + P('M-28 -6 L-24 -46 Q0 -54 24 -46 L28 -6Z', 'url(#g-shadeX)');
    s += S('M-26 -40 Q-48 -36 -40 -14', st.wood, 6) + E(0, -48, 24, 5, dark(c, 0.15)) + C(0, -54, 4, st.wood) + R(-32, -6, 64, 6, 2, INK);
    return s + (on ? steam(56, -70, 0.7) : '');
  }, { toggle: true }),
  retro: (st) => pr(90, 80, (c, on) => {
    let s = P('M26 -26 L44 -46 L48 -42 L32 -22Z', SIL) + P('M-34 -6 Q-36 -50 0 -52 Q36 -50 34 -6Z', SIL) + R(-36, -10, 72, 6, 3, c);
    s += S('M-24 -46 Q0 -76 24 -46', c, 7) + C(0, -54, 5, c) + gloss(-24, -44, 8, 26, 0.6) + motif('star', 0, -26, 7);
    return s + (on ? sway(46, -44, 8, 0.25, C(48, -46, 4, c)) + steam(50, -52, 0.8) : C(48, -46, 4, c));
  }, { toggle: true, sfx: 'ding' }),
});

/** A stand mixer: head, bowl and a whisk that whirls while on. */
function mixer(c: string, on: boolean, bowl: string, deco: string): string {
  let s = box(-42, -10, 84, 10, 4, c) + box(18, -82, 24, 76, 10, c) + boxT(-44, -98, 88, 30, 16, 12, c);
  const whisk = E(-10, -54, 6, 14, 'none', stroked('#c9cfdd', 2)) + Ln(-10, -68, -10, -72, '#c9cfdd', 3);
  s += on ? `<g transform="translate(-10 0)"><g>${E(0, -54, 6, 14, 'none', stroked('#c9cfdd', 2))}<animateTransform attributeName="transform" type="scale" values="1 1;0.2 1;1 1" dur="0.25s" repeatCount="indefinite"/></g></g>` + Ln(-10, -68, -10, -72, '#c9cfdd', 3) : whisk;
  s += P('M-40 -48 H20 Q18 -12 -10 -12 Q-38 -12 -40 -48Z', bowl) + P('M-40 -48 H20 Q18 -12 -10 -12 Q-38 -12 -40 -48Z', 'url(#g-shadeX)') + E(-10, -48, 30, 5, '#fff3f8');
  return s + deco + gloss(-36, -94, 30, 5, 0.5);
}
const MIXERS = series('mixer', 'Mixers', 'Mixer', 'kitchen', 'prop', {
  sweet: () => pr(100, 104, (c, on) => mixer(c, on, '#fff', P(heartD(-10, -40, 8), '#ff9ec7') + knob(30, -70, 4, GOLD)), { toggle: true, spawn: ['cupcake', 'cookie'] }),
  retro: (st) => pr(100, 104, (c, on) => mixer(c, on, SIL, R(-44, -76, 88, 4, 2, SIL) + knob(30, -70, 4, st.accent) + motif('star', 4, -86, 6)), { toggle: true, spawn: ['cake', 'cookie'] }),
});

const BREADBOX = series('breadbox', 'Bread Boxes', 'Bread Box', 'kitchen', 'prop', {
  cottage: (st) => pr(110, 80, (c, on) => {
    let s = box(-50, -56, 100, 56, 8, WOOD) + grain(-46, -52, 92, 50, WOOD_D, 2);
    if (on) s += R(-42, -52, 84, 46, 6, '#8a5a3c') + E(0, -24, 34, 16, '#e8b46a') + S('M-20 -32 L-14 -20 M-4 -34 L2 -22 M12 -32 L18 -20', '#c98a3e', 2) + cloth('M-50 -56 Q-50 -76 -30 -80 H30 Q50 -76 50 -56 H42 Q40 -70 28 -72 H-28 Q-40 -70 -42 -56Z', c);
    else s += cloth('M-50 -56 Q-50 -86 0 -86 Q50 -86 50 -56Z', c) + txt(0, -64, 12, '#fff', 'BREAD') + R(-12, -58, 24, 5, 2.5, '#fff');
    return s;
  }, { toggle: true, spawn: ['cookie', 'cheese'] }),
  woodland: (st) => pr(110, 84, (c, on) => {
    let s = box(-48, -60, 96, 60, 12, '#a86b4a') + S('M-36 -54 Q-38 -30 -34 -6 M-12 -56 V-6 M14 -56 Q12 -30 16 -6 M36 -54 V-8', '#7a4a32', 2);
    if (on) s += E(0, -62, 46, 9, '#7a4a32') + E(-4, -64, 30, 9, '#e8b46a') + S('M-18 -66 L-12 -60 M-2 -68 L4 -62', '#c98a3e', 2) + E(56, -46, 9, 44, '#c98a5a', 'transform="rotate(10 56 -46)"');
    else s += E(0, -62, 50, 10, '#c98a5a') + E(0, -62, 30, 5, 'none', stroked('#a86b4a', 1.6)) + E(0, -62, 14, 2.5, 'none', stroked('#a86b4a', 1.6)) + shroom(0, -70, 7);
    return s + leaf(-50, -10, 1, 200, c) + leaf(40, -4, 0.9, -20, c);
  }, { toggle: true, spawn: ['cookie', 'apple'] }),
});

/** A frosted layer cake. */
const cakeG = (x: number, y: number, w: number, h: number, body: string, icing: string) =>
  box(x - w / 2, y - h, w, h, 6, body) + cloth(dripD(x - w / 2, y - h, w, h * 0.2, h * 0.3, 5, Math.round(w)), icing, 'none', 'y') + R(x - w / 2, y - h * 0.45, w, 3, 1, icing, op(0.6));
const CAKESTANDS = series('cakestand', 'Cake Stands', 'Cake Stand', 'kitchen', 'prop', {
  sweet: () => pr(90, 120, (c) => {
    let s = E(0, -4, 22, 5, GOLD) + R(-4, -26, 8, 22, 3, GOLD) + E(0, -28, 40, 6, GOLD) + cakeG(0, -30, 56, 40, '#fff3d8', c) + C(-12, -76, 5, '#e8384f') + C(0, -78, 5, '#e8384f') + C(12, -76, 5, '#e8384f');
    return s + P('M-40 -30 Q-42 -104 0 -106 Q42 -104 40 -30Z', '#e9f6ff', op(0.35)) + P('M-40 -30 Q-42 -104 0 -106 Q42 -104 40 -30Z', 'none', stroked('#fff', 2)) + C(0, -110, 5, GOLD) + gloss(-30, -90, 6, 40, 0.6);
  }, { spawn: ['cake', 'cupcake'] }),
  princess: (st) => pr(90, 130, (c) => E(0, -4, 26, 5, GOLD) + R(-4, -18, 8, 14, 3, GOLD) + E(0, -20, 42, 6, GOLD) + cakeG(0, -22, 70, 34, c, '#fff') + cakeG(0, -56, 50, 28, c, '#fff') + cakeG(0, -84, 32, 22, c, '#fff') + motif('crown', 0, -116, 14) + [-24, -8, 8, 24].map((x) => C(x, -26, 2.5, '#fff')).join(''), { spawn: ['cake', 'cupcake'] }),
  candy: (st) => pr(100, 124, (c) => {
    let s = E(0, -4, 28, 5, st.trim) + R(-3, -110, 6, 106, 3, '#fff');
    for (const [y, w] of [[-10, 88], [-50, 66], [-90, 42]] as [number, number][]) s += E(0, y, w / 2, 5, '#fff', stroked('#ffd0e0', 2));
    const cc = (x: number, y: number, col: string) => P(`M${x - 9} ${y} L${x - 7} ${y - 12} H${x + 7} L${x + 9} ${y}Z`, col) + C(x, y - 16, 9, '#fff3f8') + C(x, y - 24, 3, '#e8384f');
    s += cc(-28, -12, '#7cc8ff') + cc(0, -12, c) + cc(28, -12, '#ffd36b') + cc(-14, -52, '#5fd3b5') + cc(14, -52, c) + cc(0, -92, '#c99bff');
    return s;
  }, { spawn: ['cupcake', 'cupcake', 'donut'] }),
});

const FRUITBOWLS = series('fruitbowl', 'Fruit Bowls', 'Fruit Bowl', 'kitchen', 'prop', {
  boho: (st) => pr(100, 70, (c) => C(-18, -32, 13, '#e8384f') + C(16, -34, 13, '#ff8a3d') + C(0, -42, 12, '#5fc47c') + P('M-34 -46 Q-10 -66 20 -54 Q34 -52 38 -40', 'none', stroked('#ffe06b', 9)) + P('M-44 -30 H44 Q40 0 0 0 Q-40 0 -44 -30Z', c) + weave(-38, -28, 76, 24, '#b58a50', 8) + R(-46, -34, 92, 6, 3, dark(c, 0.15)), { spawn: ['apple', 'banana', 'strawberry'] }),
  modern: (st) => pr(100, 70, (c) => C(-16, -30, 13, '#e8384f') + C(14, -30, 13, '#b6e36b') + C(0, -42, 12, '#ffab5e') + P('M-42 -30 Q-40 -6 0 -4 Q40 -6 42 -30', 'none', stroked(st.accent, 3)) + P('M-30 -20 Q0 -12 30 -20 M-20 -8 V-28 M0 -4 V-30 M20 -8 V-28', 'none', stroked(st.accent, 2)) + E(0, -2, 16, 3, st.accent), { spawn: ['apple', 'banana'] }),
  beach: (st) => pr(100, 70, (c) => `<g transform="translate(0 -34) scale(1 -1)">${shellG(0, 0, 2.2, c)}</g>` + E(0, -34, 36, 6, light(c, 0.3)) + P('M2 -50 L8 -66 L14 -50Z', '#5fae6b') + E(8, -46, 9, 13, '#ffb35e') + E(-16, -38, 15, 10, '#ffe06b') + C(18, -38, 12, '#ff8a3d') + C(-4, -36, 9, '#e8384f') + C(-7, -39, 2.5, '#fff', op(0.6)) + starfish(36, -6, 8), { spawn: ['banana', 'strawberry', 'apple'] }),
});

const COOKIEJARS = series('cookiejar', 'Cookie Jars', 'Cookie Jar', 'kitchen', 'prop', {
  sweet: () => pr(70, 90, (c) => {
    let s = box(-28, -54, 56, 54, 20, c) + C(-20, -76, 9, c) + C(20, -76, 9, c) + C(-20, -76, 4.5, light(c, 0.4)) + C(20, -76, 4.5, light(c, 0.4)) + E(0, -64, 26, 18, c) + E(0, -64, 26, 18, 'url(#g-shadeX)');
    return s + C(-9, -66, 2.5, INK) + C(9, -66, 2.5, INK) + E(0, -58, 6, 4, '#fff') + E(0, -60, 2, 1.5, INK) + E(-15, -58, 4, 2.5, '#ff7eb6', op(0.6)) + E(15, -58, 4, 2.5, '#ff7eb6', op(0.6)) + R(-28, -46, 56, 4, 2, dark(c, 0.12)) + P(heartD(0, -32, 12), '#fff', op(0.8));
  }, { spawn: ['cookie'] }),
  candy: (st) => pr(70, 100, (c) => {
    let s = R(-20, -24, 40, 24, 6, c) + C(0, -58, 30, '#eef6fb', op(0.85));
    for (let i = 0; i < 12; i++) s += C(-18 + (i % 4) * 12, -42 - Math.floor(i / 4) * 12, 5.5, CANDY[i % 5]);
    return s + C(0, -58, 30, GLASS) + R(-14, -92, 28, 8, 4, c) + C(0, -96, 5, st.trim) + R(-6, -18, 12, 8, 2, SIL);
  }, { name: 'Gumball Cookie Jar', spawn: ['cookie', 'donut'] }),
  cottage: (st) => pr(70, 90, (c) => R(-26, -64, 52, 64, 12, '#eef6fb', op(0.85)) + [[-12, -12], [8, -14], [-4, -28], [12, -32], [-12, -44]].map(([x, y]) => E(x, y, 11, 6, '#e8b46a') + C(x - 3, y - 1, 1.8, '#6b4226') + C(x + 3, y + 1, 1.8, '#6b4226')).join('') + R(-26, -64, 52, 64, 12, GLASS) + cloth('M-32 -62 Q-34 -78 0 -78 Q34 -78 32 -62 L28 -54 Q0 -50 -28 -54Z', c, 'check', 'y') + S('M-28 -60 H28', '#ff9ec7', 3) + bowG(18, -60, 0.3, '#ff9ec7'), { spawn: ['cookie'] }),
});

const SPICERACKS = series('spicerack', 'Spice Racks', 'Spice Rack', 'kitchen', 'wall', {
  cottage: (st) => ({ w: 160, h: 90, art: (c) => {
    let s = '';
    for (const y of [-6, 36]) s += box(-78, y, 156, 10, 3, st.wood) + R(-78, y - 26, 4, 30, 2, st.wood) + R(74, y - 26, 4, 30, 2, st.wood);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = -60 + i * 24, y = r ? 36 : -6; s += R(x - 8, y - 26, 16, 26, 4, '#eef6fb') + R(x - 6, y - 18, 12, 16, 2, ['#e8573d', '#ffd36b', '#8fbf6a', '#c98a5a', '#ffab5e', '#b583ff'][(i + r * 2) % 6]) + R(x - 9, y - 30, 18, 6, 2, c); }
    return s + sway(0, -40, 3, 4, S('M-78 -40 Q0 -54 78 -40', '#5fae6b', 2) + leaf(-40, -46, 0.8, 80) + leaf(0, -50, 0.8, 100) + leaf(40, -46, 0.8, 70));
  } }),
  modern: (st) => ({ w: 160, h: 70, art: (c) => {
    let s = R(-80, -6, 160, 8, 2, st.accent) + R(-80, -30, 4, 26, 2, st.accent) + R(76, -30, 4, 26, 2, st.accent);
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; s += R(x - 8, -32, 16, 26, 2, '#fff', stroked(c, 1.5)) + R(x - 8, -40, 16, 8, 2, INK) + R(x - 5, -22, 10, 12, 1, ['#e8573d', '#ffd36b', '#8fbf6a', '#c98a5a', '#ffab5e', '#9aa3b5'][i]); }
    return s;
  } }),
});

// ---------------- bathtubs ----------------
// The doll sits inside at water level: art() is the back of the tub, front() is the tub's front wall
// and the foam, drawn over the doll's legs and tummy.
const TUB_SEAT = [sit(24, -82)];
const tub = (art: (c: string, on: boolean) => string, front: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 320, h: 200, toggle: true, art, front, seats: TUB_SEAT, ...extra });
/** A tap over the left end of a tub, with water when on. */
const tubTap = (x: number, y: number, col: string, on: boolean, h = 50) => S(swanD(x, y, h, 26), col, 9) + knob(x - 16, y - 6, 6, col) + (on ? stream(x + 26, y - h + 10, y - 2, 8) : '');
const clawFoot = (x: number, col: string, fl: number) => P(`M${f(x - 10)} -40 Q${f(x - 6)} -14 ${f(x + fl * 6)} -6 Q${f(x + fl * 16)} -2 ${f(x + fl * 14)} 0 H${f(x - fl * 10)} Q${f(x - fl * 14)} -16 ${f(x + 10)} -40Z`, col) + C(x + fl * 12, -3, 4, col);
const TUBS = series('bathtub', 'Bathtubs', 'Bathtub', 'bath', 'floor', {
  sweet: () => tub((c, on) => E(0, -132, 140, 16, dark(c, 0.25)) + E(0, -130, 132, 12, '#bfe8ff') + tubTap(-118, -138, GOLD, on),
    (c) => {
      const body = 'M-152 -138 Q-156 -60 -104 -36 Q-60 -22 0 -22 Q60 -22 104 -36 Q156 -60 152 -138 Q0 -124 -152 -138Z';
      let s = clawFoot(-104, GOLD, -1) + clawFoot(104, GOLD, 1) + cloth(body, c) + S('M-152 -138 Q0 -124 152 -138', '#fff', 9);
      s += P(heartD(0, -96, 26), light(c, 0.4)) + gloss(-136, -120, 8, 40);
      return s + foam(14, -132, 230, 12, 3, '#ffe3f0') + floaters(20, -150, 200, 1) + motif('heart', 120, -150, 10);
    }),
  princess: (st) => tub((c, on) => P('M-150 -132 C-170 -200 -150 -238 -112 -232 L-100 -132Z', c) + P('M-150 -132 C-170 -200 -150 -238 -112 -232', 'none', stroked(st.trim, 4)) + motif('crown', -134, -244, 16) + E(10, -132, 136, 14, dark(c, 0.25)) + E(10, -130, 128, 10, '#bfe8ff') + tubTap(118, -138, GOLD, on, 46),
    (c, on) => {
      const body = 'M-152 -134 Q-154 -60 -100 -40 Q-50 -26 10 -26 Q80 -26 120 -44 Q156 -66 150 -138 Q0 -124 -152 -134Z';
      let s = cabLeg(-100, -42, 42, GOLD, -1) + cabLeg(110, -42, 42, GOLD, 1) + cloth(body, c, 'hearts') + S('M-152 -134 Q0 -124 150 -138', GOLD, 8);
      for (let i = 0; i < 12; i++) s += C(-130 + i * 23, -112 + Math.abs(i - 5.5) * -1.2, 3.5, '#fff');
      s += curl(-40, -70, 1, st.trim, -1) + curl(40, -70, 1, st.trim, 1) + C(0, -72, 7, '#7cc8ff');
      return s + foam(14, -130, 230, 12, 7, '#ffe3f0') + floaters(20, -150, 200, 4) + (on ? '' : '');
    }, { h: 260 }),
  modern: (st) => tub((c, on) => R(-176, -184, 8, 184, 4, INK) + S('M-172 -184 Q-172 -196 -160 -196 H-140 V-188', INK, 7) + (on ? stream(-140, -186, -132, 7) : '') + E(0, -134, 136, 12, dark(c, 0.2)) + E(0, -132, 128, 8, '#cfeefe'),
    (c) => {
      const body = 'M-150 -136 C-150 -30 -110 -6 0 -6 C110 -6 150 -30 150 -136 Q0 -124 -150 -136Z';
      return cloth(body, c) + S('M-150 -136 Q0 -124 150 -136', light(c, 0.5), 5) + gloss(-134, -116, 8, 60, 0.5) + foam(16, -132, 220, 10, 11, '#eef0ff') + floaters(20, -150, 200, 8);
    }, { w: 360 }),
  cottage: (st) => tub((c, on) => E(0, -132, 140, 16, '#e3e6ee') + E(0, -130, 132, 12, '#bfe8ff') + tubTap(-118, -138, '#e8b45a', on) + R(126, -150, 30, 6, 3, st.wood),
    (c) => {
      const body = 'M-154 -138 Q-156 -60 -104 -36 Q-60 -22 0 -22 Q60 -22 104 -36 Q156 -60 154 -138 Q0 -124 -154 -138Z';
      let s = clawFoot(-104, '#e8b45a', -1) + clawFoot(104, '#e8b45a', 1) + cloth(body, c, 'flowers') + S('M-154 -138 Q0 -124 154 -138', '#fff', 10);
      const duck = E(0, -8, 14, 9, '#ffd84a') + C(6, -20, 8, '#ffd84a') + P('M12 -21 L20 -18 L12 -16Z', '#ff8a3d') + C(8, -22, 1.8, INK);
      return s + foam(10, -132, 220, 12, 13, '#eef0ff') + bob(tr(118, -138, duck), 2, 2.2) + floaters(10, -150, 200, 6);
    }),
  beach: (st) => tub((c, on) => {
    let s = '';
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) * (Math.PI / 9), x = Math.cos(a) * 150, y = -110 + Math.sin(a) * 150; s += P(`M0 -110 L${f(x - 14)} ${f(y + 6)} Q${f(x)} ${f(y - 14)} ${f(x + 14)} ${f(y + 6)}Z`, i % 2 ? c : light(c, 0.3)); }
    return s + P('M0 -110 L-150 -110 A150 150 0 0 1 150 -110Z', 'url(#g-shadeY)') + E(0, -130, 136, 14, dark(c, 0.2)) + E(0, -128, 128, 10, '#bfe8ff') + (on ? stream(-80, -230, -132, 8) + C(-80, -236, 10, SIL) : C(-80, -236, 10, SIL));
  }, (c) => {
    let s = cloth('M-150 -136 Q-140 -40 -60 -20 Q0 -10 60 -20 Q140 -40 150 -136 Q0 -122 -150 -136Z', c);
    for (let x = -120; x <= 120; x += 30) s += S(`M${x * 0.9} -128 Q${x * 0.75} -70 ${x * 0.4} -22`, light(c, 0.35), 4);
    s += C(-150, -136, 10, '#fff') + C(150, -136, 10, '#fff') + C(0, -16, 9, '#fff') + C(-3, -19, 3, '#fff', op(0.9)) + C(0, -16, 9, 'url(#g-face)');
    return s + foam(14, -130, 230, 12, 17, '#e3f4ff') + starfish(120, -150, 12) + floaters(10, -150, 200, 9);
  }, { h: 270, name: 'Seashell Bathtub' }),
  candy: (st) => tub((c, on) => E(0, -140, 130, 16, dark(c, 0.25)) + E(0, -138, 122, 12, '#ffd9f0') + (on ? stream(-100, -200, -140, 8) + R(-116, -212, 32, 14, 7, st.trim) : R(-116, -212, 32, 14, 7, st.trim)) + R(-104, -200, 8, 60, 4, '#fff'),
    (c) => {
      let s = Ln(-96, -40, -96, 0, '#fff', 7) + Ln(96, -40, 96, 0, '#fff', 7) + C(-96, -4, 9, '#ff4f8b') + C(96, -4, 9, '#7cc8ff');
      s += cloth('M-140 -144 Q-150 -20 -60 -12 H60 Q150 -20 140 -144 Q0 -128 -140 -144Z', c, 'dots') + S('M-140 -144 Q0 -128 140 -144', '#fff3f8', 10) + sprinkles(-110, -110, 220, 60, 18, 12);
      return s + foam(10, -138, 260, 18, 21, '#ffd9f0') + foam(0, -168, 140, 8, 25, '#e6d4ff') + floaters(10, -170, 220, 12) + floaters(0, -160, 160, 2);
    }, { name: 'Bubble Bathtub', h: 230 }),
  rainbow: () => tub((c, on) => E(0, -142, 124, 18, dark(c, 0.25)) + E(0, -140, 116, 14, '#bfe8ff') + tubTap(-100, -148, '#fff', on, 40),
    (c) => {
      let s = cloth('M-130 -146 Q-136 -10 0 -8 Q136 -10 130 -146 Q0 -128 -130 -146Z', c);
      RAIN.forEach((col, i) => { const y = -116 + i * 16; s += P(`M${-130 + i * 2} ${y} Q0 ${y + 14} ${130 - i * 2} ${y} L${130 - i * 3} ${y + 9} Q0 ${y + 23} ${-130 + i * 3} ${y + 9}Z`, col, op(0.9)); });
      s += S('M-130 -146 Q0 -128 130 -146', '#fff', 10) + motif('cloud', -112, -18, 22) + motif('cloud', 112, -18, 22);
      return s + foam(10, -140, 210, 11, 31, '#fff3d6') + floaters(10, -160, 180, 14);
    }, { name: 'Rainbow Round Tub', w: 290, h: 200 }),
  woodland: (st) => tub((c, on) => E(0, -146, 124, 14, '#7a4a32') + E(0, -144, 116, 10, '#bfe8ff') + (on ? stream(-96, -188, -146, 7) : '') + S('M-124 -150 V-196 H-96 V-188', '#8a5a3c', 8),
    (c) => {
      let s = cloth('M-128 -150 L-118 -10 H118 L128 -150 Q0 -134 -128 -150Z', '#c98a5a');
      for (let x = -96; x <= 96; x += 32) s += Ln(x * 1.05, -142, x * 0.95, -12, '#a86b4a', 3);
      s += R(-130, -116, 260, 10, 3, IRON) + R(-124, -46, 248, 10, 3, IRON) + S('M-128 -150 Q0 -134 128 -150', '#a86b4a', 8);
      return s + foam(10, -146, 210, 11, 37) + leaf(-120, -150, 1.3, -150, c) + leaf(110, -152, 1.3, -30, c) + floaters(10, -160, 180, 15);
    }, { name: 'Woodland Barrel Tub', w: 280, color: ST.woodland.main }),
});

// ---------------- showers ----------------
const shw = (art: (c: string, on: boolean) => string, front: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 190, h: 380, toggle: true, art, front, ...extra });
const curtainD = (x: number, top: number, w: number, bot: number) => `M${f(x)} ${f(top)} H${f(x + w)} Q${f(x + w + 6)} ${f((top + bot) / 2)} ${f(x + w - 4)} ${f(bot)} Q${f(x + w * 0.5)} ${f(bot + 8)} ${f(x + 4)} ${f(bot)} Q${f(x - 6)} ${f((top + bot) / 2)} ${f(x)} ${f(top)}Z`;
const SHOWERS = series('shower', 'Showers', 'Shower', 'bath', 'floor', {
  sweet: (st) => shw((c) => {
    let s = R(-84, -350, 168, 330, 12, light(c, 0.55)) + tiles(-84, -350, 168, 330, 28, 28, light(c, 0.3)) + box(-92, -24, 184, 24, 8, '#fff', 'none', 'y');
    s += R(-4, -330, 8, 90, 4, GOLD) + S('M0 -330 Q0 -348 20 -348 H40', GOLD, 7) + P('M24 -336 H60 Q58 -320 42 -320 Q26 -320 24 -336Z', GOLD) + knob(-20, -200, 8, GOLD) + knob(20, -200, 8, GOLD);
    s += R(-94, -364, 188, 6, 3, GOLD) + [-80, -60, 60, 80].map((x) => C(x, -360, 5, 'none', `stroke="${GOLD}" stroke-width="2.5"`)).join('');
    return s + cloth(curtainD(48, -358, 44, -40), c, 'hearts') + cloth(curtainD(-92, -358, 30, -40), c, 'hearts') + bowG(70, -200, 0.5, '#fff') + bowG(-77, -200, 0.5, '#fff');
  }, (c, on) => on ? rain(42, -318, -28, 18, 7) + steam(0, -60, 1.4) : ''),
  modern: (st) => shw((c) => {
    let s = R(-90, -370, 180, 346, 2, c) + tiles(-90, -370, 180, 346, 60, 86, dark(c, 0.08)) + R(-96, -24, 192, 24, 2, INK);
    s += R(-30, -376, 6, 26, 2, INK) + R(-60, -352, 66, 8, 2, INK) + R(-20, -220, 6, 80, 3, INK) + R(-28, -200, 22, 6, 3, INK) + R(50, -260, 24, 60, 4, '#fff', stroked(dark(c, 0.15), 2)) + R(56, -250, 12, 22, 3, '#7fe0b0');
    return s;
  }, (c, on) => (on ? rain(-27, -342, -28, 22, 9) : '') + R(-96, -376, 4, 352, 2, INK) + R(-92, -374, 110, 350, 2, '#dff2ff', op(0.25)) + R(-92, -374, 110, 350, 2, GLASS) + R(16, -374, 4, 350, 2, INK) + C(8, -200, 4, INK), { h: 390 }),
  cottage: (st) => shw((c) => {
    let s = R(-86, -350, 172, 326, 6, '#fff') + tiles(-86, -350, 172, 326, 28, 14, '#e3e6ee', true) + box(-92, -24, 184, 24, 6, '#fff', 'none', 'y') + R(-92, -8, 184, 8, 2, dark(c, 0.2));
    s += R(36, -330, 8, 160, 4, '#e8b45a') + S('M40 -330 Q40 -350 20 -350 H6', '#e8b45a', 7) + E(0, -342, 22, 9, '#e8b45a') + C(40, -170, 9, '#e8b45a') + P('M28 -182 H52 M40 -194 V-170', 'none', stroked('#e8b45a', 4));
    s += S('M-96 -372 Q0 -392 96 -372', '#e8b45a', 5);
    return s + cloth(curtainD(-96, -372, 52, -34), c, 'flowers') + cloth(curtainD(54, -372, 40, -34), c, 'flowers') + S('M-90 -200 Q-70 -190 -44 -200', '#fff', 3);
  }, (c, on) => on ? rain(0, -332, -28, 20, 7) + steam(-10, -60, 1.4) : '', { h: 390 }),
  beach: (st) => shw((c) => {
    let s = '';
    for (let x = -88; x < 88; x += 22) s += box(x, -330 + Math.abs(x) * 0.1, 20, 310, 6, st.wood);
    s += R(-6, -360, 12, 230, 5, SIL) + shellG(20, -340, 1.8, c) + knob(0, -150, 9, c) + R(-96, -22, 192, 22, 8, '#e8d6b0');
    for (let i = 0; i < 9; i++) s += E(-80 + i * 20, -12 + (i % 2) * 4, 9, 5, ['#c9cfdd', '#fff3d6', '#b9b4bf'][i % 3]);
    s += C(60, -240, 5, st.wood) + towel(60, -236, 36, 80, c, 'stripes');
    return s + starfish(-60, -280, 14) + motif('fish', -50, -200, 12);
  }, (c, on) => on ? rain(20, -326, -28, 18, 7) : '', { name: 'Beach Outdoor Shower' }),
  space: (st) => shw((c) => {
    let s = R(-80, -360, 160, 340, 70, '#1e2350') + P(starD(-40, -300, 6), '#fff') + P(starD(40, -200, 5), '#fff') + C(30, -280, 10, '#c99bff') + C(-44, -140, 3, st.accent);
    s += box(-94, -30, 188, 30, 14, c) + blinkC(-60, -15, 4, st.accent, 1.2) + blinkC(-40, -15, 4, '#7fe0ff', 1, 0.3) + blinkC(40, -15, 4, '#ff7eb6', 1.4, 0.6) + blinkC(60, -15, 4, '#7fe0b0', 1.1, 0.2);
    return s + box(-94, -380, 188, 36, 18, c) + C(0, -350, 16, SIL) + C(0, -350, 11, '#7fe0ff');
  }, (c, on) => (on ? rain(0, -340, -34, 24, 9) + pulse(R(-80, -344, 160, 310, 60, '#7fe0ff', op(0.12)), 1.4) : '') + R(-84, -346, 168, 316, 70, '#dff2ff', op(0.18)) + R(-84, -346, 168, 316, 70, GLASS) + R(-84, -346, 168, 316, 70, 'none', stroked('#c9cfdd', 5)) + R(-60, -320, 10, 220, 5, '#fff', op(0.35)), { name: 'Space Shower Pod', h: 390 }),
});

// ---------------- toilets ----------------
const TOILET_SEAT = [sit(0, -74)];
const tlt = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 120, h: 190, seats: TOILET_SEAT, art, ...extra });
/** The bowl and seat seen from the front: a lid up against the tank, a seat ring and the bowl. */
const bowl = (c: string, seat: string, lid: string) => P('M-26 -4 L-30 -40 H30 L26 -4Z', c) + E(0, -2, 30, 6, dark(c, 0.15)) + cloth('M-46 -74 Q-48 -40 0 -36 Q48 -40 46 -74Z', c) + E(0, -76, 48, 10, seat) + E(0, -77, 34, 6, '#bfe8ff') + E(0, -77, 34, 6, 'url(#g-shadeY)') + cloth(`M-40 -82 Q-42 -150 0 -152 Q42 -150 40 -82Z`, lid);
const TOILETS = series('toilet', 'Toilets', 'Toilet', 'bath', 'floor', {
  sweet: () => tlt((c) => {
    let s = box(-44, -186, 88, 80, 20, c) + P(heartD(0, -206, 32), light(c, 0.35)) + R(28, -170, 14, 8, 4, GOLD);
    return s + bowl(c, '#fff', light(c, 0.3)) + P(heartD(0, -132, 18), '#fff', op(0.8)) + gloss(-36, -178, 6, 40);
  }, { h: 200 }),
  princess: (st) => tlt((c) => {
    let s = cloth(archD(-46, -220, 92, 116, 40), '#fff') + P(archD(-38, -212, 76, 100, 34), 'none', stroked(st.trim, 3)) + motif('crown', 0, -224, 16) + R(26, -170, 16, 8, 4, GOLD);
    s += bowl('#fff', GOLD, c) + C(0, -118, 8, '#ff7eb6') + C(-2, -120, 2.5, '#fff') + curl(-30, -130, 0.6, st.trim, 1) + curl(30, -130, 0.6, st.trim, -1);
    return s + R(-30, -8, 60, 8, 4, GOLD);
  }, { h: 250 }),
  modern: (st) => tlt((c) => box(-42, -180, 84, 74, 4, c) + R(-14, -164, 28, 18, 3, '#fff', stroked(dark(c, 0.15), 2)) + Ln(0, -164, 0, -146, dark(c, 0.15), 2) + P('M-26 -4 L-30 -40 H30 L26 -4Z', c) + cloth('M-44 -72 L-40 -40 H40 L44 -72Z', c) + R(-46, -80, 92, 10, 3, '#fff') + R(-40, -150, 80, 70, 6, light(c, 0.35)) + R(-38, -148, 4, 60, 2, '#fff', op(0.5))),
  cottage: (st) => tlt((c) => {
    let s = box(-50, -340, 100, 56, 8, c) + R(-56, -346, 112, 10, 4, st.wood) + R(-6, -284, 12, 180, 4, '#e8b45a') + Ln(36, -290, 36, -200, '#c9cfdd', 2.5) + `<g>${E(36, -194, 7, 10, st.wood)}<animateTransform attributeName="transform" type="rotate" values="-4 36 -290;4 36 -290;-4 36 -290" dur="3s" repeatCount="indefinite"/></g>`;
    return s + flowerG(0, -314, 10, '#fff') + bowl('#fff', st.wood, st.wood) + grain(-36, -146, 72, 60, WOOD_D, 2);
  }, { name: 'Cottage Pull-Chain Toilet', h: 350 }),
  space: (st) => tlt((c) => {
    let s = P('M-44 -120 L-60 -84 L-44 -94Z', '#ff6b8a') + P('M44 -120 L60 -84 L44 -94Z', '#ff6b8a') + cloth(archD(-44, -210, 88, 104, 44), c, 'stars') + C(0, -170, 16, SIL) + C(0, -170, 12, '#1e2350') + C(4, -174, 3, st.accent);
    s += blinkC(-20, -126, 3.5, st.accent, 1.2) + blinkC(0, -126, 3.5, '#7fe0ff', 1, 0.3) + blinkC(20, -126, 3.5, '#ff7eb6', 1.4, 0.5);
    return s + bowl('#e6e8f0', '#c9cfdd', light(c, 0.15)) + motif('planet', 0, -116, 10) + R(-30, -8, 60, 8, 4, SIL);
  }, { name: 'Rocket Toilet', h: 220 }),
});

// ---------------- bathroom sinks ----------------
const bsk = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 150, h: 230, toggle: true, art, ...extra });
const BATHSINKS = series('bathsink', 'Bathroom Sinks', 'Bathroom Sink', 'bath', 'floor', {
  sweet: () => bsk((c, on) => {
    let s = E(0, -4, 40, 8, dark(c, 0.15)) + cloth('M-22 -4 Q-16 -60 -18 -110 H18 Q16 -60 22 -4Z', c) + R(-18, -116, 36, 8, 4, dark(c, 0.08));
    s += cloth('M-70 -150 H70 Q66 -110 0 -110 Q-66 -110 -70 -150Z', c) + R(-72, -154, 144, 10, 5, '#fff') + basin(0, -152, 46);
    s += S(swanD(0, -156, 30, 22), GOLD, 7) + knob(-22, -160, 5, GOLD) + knob(34, -160, 5, GOLD) + (on ? stream(22, -180, -154, 7) : '');
    return s + P(heartD(0, -146, 18), light(c, 0.45)) + gloss(-60, -146, 30, 5);
  }, { surfaces: [{ x1: 40, x2: 72, y: -154 }] }),
  princess: (st) => bsk((c, on) => {
    let s = E(0, -4, 40, 8, GOLD) + P('M-16 -4 Q-30 -40 -12 -70 Q-26 -96 -14 -112 H14 Q26 -96 12 -70 Q30 -40 16 -4Z', GOLD);
    let shell = 'M-74 -150 H74';
    for (let i = 0; i < 6; i++) { const x = 74 - (i + 1) * 24.6; shell += ` Q${f(x + 12.3)} -108 ${f(x)} -118`; }
    s += cloth(shell + 'Z', c) + R(-76, -156, 152, 10, 5, GOLD) + basin(0, -154, 46);
    for (let x = -50; x <= 50; x += 25) s += S(`M${x * 0.3} -146 L${x} -122`, light(c, 0.4), 3);
    s += S(swanD(0, -158, 32, 24), GOLD, 7) + C(-24, -162, 6, '#bfe8ff') + C(-24, -162, 6, GLASS) + C(40, -162, 6, '#bfe8ff') + (on ? stream(24, -184, -156, 7) : '');
    return s + motif('crown', 0, -200, 12);
  }, { surfaces: [{ x1: 50, x2: 76, y: -156 }], name: 'Princess Shell Sink' }),
  modern: (st) => bsk((c, on) => {
    let s = R(-66, -60, 6, 60, 2, INK) + R(60, -60, 6, 60, 2, INK) + box(-72, -140, 144, 82, 3, st.wood) + Ln(-72, -100, 72, -100, dark(st.wood, 0.2), 2) + R(-20, -128, 40, 4, 2, INK) + R(-20, -88, 40, 4, 2, INK);
    s += R(-74, -144, 148, 6, 2, '#fff') + box(-40, -170, 80, 26, 6, c) + R(-34, -170, 68, 4, 2, dark(c, 0.15));
    s += R(-4, -210, 8, 40, 3, INK) + R(-4, -210, 30, 7, 3, INK) + (on ? stream(22, -203, -172, 6) : '');
    return s;
  }, { surfaces: [{ x1: 44, x2: 74, y: -144 }], name: 'Modern Vanity' }),
  cottage: (st) => bsk((c, on) => {
    let s = R(-64, -150, 10, 150, 4, st.wood) + R(54, -150, 10, 150, 4, st.wood) + box(-70, -156, 140, 14, 4, WOOD) + R(-60, -40, 120, 8, 3, st.wood);
    s += cloth('M-66 -142 H66 Q70 -90 62 -46 Q30 -38 0 -46 Q-30 -38 -62 -46 Q-70 -90 -66 -142Z', c, 'flowers', 'y') + R(-68, -146, 136, 6, 3, '#fff');
    s += P('M-40 -156 Q-40 -184 0 -184 Q40 -184 40 -156Z', '#fff') + E(0, -184, 40, 6, '#e3e6ee') + flowerG(0, -168, 7, '#ff9ec7');
    s += S('M-10 -184 V-206 Q-10 -214 0 -214 Q10 -214 12 -206', '#e8b45a', 6) + P('M-22 -212 H2 M-10 -222 V-202', 'none', stroked('#e8b45a', 3.5)) + (on ? stream(12, -204, -186, 6) : '');
    return s;
  }, { surfaces: [{ x1: 42, x2: 70, y: -156 }], name: 'Cottage Washstand' }),
  beach: (st) => bsk((c, on) => {
    let s = box(-68, -144, 136, 136, 10, c) + planksH(-68, -144, 136, 136, 5, light(c, 0.4)) + R(-62, -8, 124, 8, 3, st.wood);
    for (const y of [-110, -60]) s += S(`M-70 ${y} Q0 ${y + 10} 70 ${y}`, '#d9b27a', 4);
    s += box(-74, -156, 148, 14, 6, st.wood) + P('M-44 -156 Q-44 -180 0 -180 Q44 -180 44 -156Z', '#fff') + E(0, -180, 44, 6, '#e3e6ee');
    s += S('M24 -180 V-206 Q24 -214 14 -214 H0 V-206', SIL, 6) + (on ? stream(0, -204, -182, 6) : '');
    return s + starfish(-40, -100, 12) + shellG(36, -60, 1, '#ffd9e8');
  }, { surfaces: [{ x1: 46, x2: 74, y: -156 }] }),
});

// ---------------- mirrors (wall) ----------------
/** A point on a heart curve (t in 0..2π), centred near the middle. */
const heartPt = (t: number, k: number): [number, number] => [16 * Math.sin(t) ** 3 * k, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k - 2.5 * k];
const heartParD = (cx: number, cy: number, k: number) => Array.from({ length: 48 }, (_, i) => { const [x, y] = heartPt((i / 48) * Math.PI * 2, k); return `${i ? 'L' : 'M'}${f(cx + x)} ${f(cy + y)}`; }).join(' ') + 'Z';
const glassFill = (d: string) => P(d, '#dff2ff') + P(d, GLASS) + P(d, 'url(#g-shadeY)', op(0.4));
const MIRRORS = series('bathmirror', 'Mirrors', 'Mirror', 'bath', 'wall', {
  sweet: () => ({ w: 150, h: 140, toggle: true, art: (c, on) => {
    let s = (on ? glow(0, 0, 90) : '') + P(heartParD(0, -2, 4.3), c) + P(heartParD(0, -2, 4.3), 'url(#g-shadeX)') + glassFill(heartParD(0, -2, 3.3));
    for (let i = 0; i < 12; i++) { const [x, y] = heartPt((i + 0.5) / 12 * Math.PI * 2, 3.85); s += C(x, y - 2, 4.5, on ? '#fff6c8' : '#fff') + (on ? C(x, y - 2, 7, '#fff6c8', op(0.35)) : ''); }
    return s + P(sparkleD(-24, -16, 7), '#fff') + bowG(0, -48, 0.5, '#ff4f8b');
  } }),
  princess: (st) => ({ w: 130, h: 180, art: (c) => {
    let s = E(0, 0, 54, 74, GOLD) + E(0, 0, 46, 66, c) + E(0, 0, 40, 60, '#dff2ff') + E(0, 0, 40, 60, GLASS);
    s += curl(-50, -50, 1, st.trim, -1, 4) + curl(50, -50, 1, st.trim, 1, 4) + curl(-46, 54, 0.8, st.trim, -1, 4) + curl(46, 54, 0.8, st.trim, 1, 4);
    return s + motif('crown', 0, -82, 20) + C(0, 74, 7, '#ff7eb6') + P(sparkleD(-16, -24, 7), '#fff');
  } }),
  modern: (st) => ({ w: 130, h: 130, toggle: true, art: (c, on) => (on ? glow(0, 0, 90) : '') + C(0, 0, 62, on ? '#fff6c8' : c) + C(0, 0, 56, '#dff2ff') + C(0, 0, 56, GLASS) + P('M-30 -30 L10 -50 M-40 -6 L20 -40', 'none', stroked('#fff', 4, ) + ' ' + op(0.6)) }),
  cottage: (st) => ({ w: 130, h: 160, art: (c) => {
    let s = box(-56, -74, 112, 148, 12, st.wood) + R(-46, -64, 92, 128, 6, c) + glassFill(roundRectD(-40, -58, 80, 116, 4));
    s += S('M-56 -60 Q-70 -20 -52 20 Q-66 50 -40 74', '#5fae6b', 3) + flowerG(-56, -60, 9, '#ff9ec7') + flowerG(-60, 0, 8, '#fff') + flowerG(-44, 70, 9, '#ffd36b') + leaf(-60, -30, 0.8, 200) + leaf(-56, 40, 0.8, 160);
    return s + C(0, -84, 6, st.wood) + S('M-30 -74 L0 -84 L30 -74', st.wood, 2);
  } }),
  space: (st) => ({ w: 140, h: 140, art: (c) => {
    let s = C(0, 0, 64, SIL) + C(0, 0, 54, c) + C(0, 0, 48, '#dff2ff') + C(0, 0, 48, GLASS);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += C(Math.cos(a) * 59, Math.sin(a) * 59, 3, '#9aa3b5'); }
    return s + P(starD(-24, -26, 6), st.accent) + P(starD(28, 18, 4), st.accent) + blinkC(0, -59, 4, '#ff6b8a', 1.2);
  } }),
});

// ---------------- towel racks (wall) ----------------
const towelHang = (x: number, y: number, w: number, h: number, c: string, pat = 'none', stripe = '#fff') => cloth(`M${f(x - w / 2)} ${f(y)} H${f(x + w / 2)} V${f(y + h)} Q${f(x)} ${f(y + h + 5)} ${f(x - w / 2)} ${f(y + h)}Z`, c, pat, 'y') + R(x - w / 2, y + h - 16, w, 6, 0, stripe, op(0.75)) + R(x - w / 2, y - 6, w, 12, 6, dark(c, 0.06));
const TOWELRACKS = series('towelrack', 'Towel Racks', 'Towel Rack', 'bath', 'wall', {
  sweet: () => ({ w: 170, h: 120, art: (c) => R(-80, -44, 160, 8, 4, GOLD) + C(-82, -40, 7, GOLD) + C(82, -40, 7, GOLD) + towelHang(-36, -40, 58, 84, c, 'hearts') + towelHang(32, -40, 50, 64, light(c, 0.45), 'none', c) + P(heartD(32, -4, 10), c) }),
  modern: (st) => ({ w: 120, h: 180, art: (c) => {
    let s = R(-46, -86, 6, 172, 3, st.accent) + R(40, -86, 6, 172, 3, st.accent);
    for (let y = -70; y <= 70; y += 28) s += R(-44, y, 88, 5, 2.5, st.accent);
    return s + towelHang(-6, -42, 64, 86, c) + towelHang(10, -70, 40, 20, light(c, 0.4));
  } }),
  beach: (st) => ({ w: 170, h: 140, art: (c) => {
    let s = box(-80, -60, 160, 18, 6, st.wood) + S('M-80 -51 Q-90 -70 -70 -70', '#d9b27a', 3);
    for (const x of [-50, 0, 50]) s += C(x, -36, 6, st.wood);
    return s + towelHang(-50, -32, 40, 80, c, 'stripes') + towelHang(0, -32, 40, 66, '#ffab5e', 'stripes') + towelHang(50, -32, 40, 74, '#fff3d6', 'none', c) + starfish(-70, -76, 9) + shellG(70, -72, 0.7, '#ffd9e8');
  } }),
});

// ---------------- bath shelves ----------------
const bottle = (x: number, y: number, w: number, h: number, col: string, cap = '#fff') => box(x - w / 2, y - h, w, h, w * 0.35, col) + R(x - w * 0.2, y - h - 8, w * 0.4, 9, 2, cap) + R(x - w * 0.3, y - h * 0.6, w * 0.6, h * 0.3, 2, '#fff', op(0.7));
const BATHSHELVES = series('bathshelf', 'Bath Shelves', 'Bath Shelf', 'bath', 'floor', {
  sweet: () => ({ name: 'Sweet Bath Tower', w: 110, h: 260, surfaces: [{ x1: -48, x2: 48, y: -250 }, { x1: -48, x2: 48, y: -170 }], art: (c) => {
    let s = R(-44, -250, 6, 250, 3, GOLD) + R(38, -250, 6, 250, 3, GOLD);
    for (const y of [-250, -170, -90]) s += box(-52, y, 104, 12, 6, c);
    s += towelHang(0, -76, 70, 16, '#fff').replace(/<rect[^>]*opacity="0.75"\/>/, '') + box(-40, -36, 80, 26, 10, light(c, 0.4)) + box(-36, -60, 72, 26, 10, '#fff');
    return s + bottle(-20, -90, 18, 40, '#ff9ec7') + bottle(10, -90, 14, 30, '#c99bff', GOLD) + bob(motif('heart', 30, -100, 0.01));
  } }),
  boho: (st) => ({ name: 'Boho Ladder Shelf', w: 120, h: 290, surfaces: [{ x1: -44, x2: 44, y: -220 }], art: (c) => {
    let s = `<g transform="rotate(-4 -40 0)">${R(-46, -290, 10, 290, 4, st.wood)}</g><g transform="rotate(4 40 0)">${R(36, -290, 10, 290, 4, st.wood)}</g>`;
    for (const y of [-260, -220, -150, -80]) s += R(-46, y, 92, 7, 3, st.wood);
    s += cloth('M-40 -150 H40 V-86 Q0 -80 -40 -86Z', c, 'none', 'y') + S('M-36 -96 H36', st.accent, 3) + [-30, -18, -6, 6, 18, 30].map((x) => Ln(x, -86, x, -76, st.accent, 2)).join('');
    s += P('M-28 -220 L-24 -248 H4 L8 -220Z', st.accent) + leaf(-12, -248, 1.2, -120) + leaf(-10, -248, 1.3, -60, '#8fd36b') + leaf(-14, -246, 1, 160);
    return s + box(-36, -36, 72, 36, 8, '#e8c08a') + weave(-32, -32, 64, 28, '#b58a50', 9) + bottle(26, -220, 14, 30, '#fff3e6', st.wood);
  } }),
  modern: (st) => ({ name: 'Modern Bath Shelf', w: 100, h: 270, surfaces: [{ x1: -44, x2: 44, y: -266 }, { x1: -44, x2: 44, y: -180 }, { x1: -44, x2: 44, y: -94 }], art: (c) => {
    let s = box(-48, -270, 96, 270, 3, c) + R(-40, -260, 80, 254, 2, dark(c, 0.12));
    for (const y of [-180, -94]) s += R(-40, y, 80, 6, 1, c);
    s += bottle(-18, -180, 16, 44, '#fff', INK) + bottle(10, -180, 16, 34, st.soft, INK) + R(-32, -130, 64, 36, 3, '#fff') + Ln(-32, -118, 32, -118, '#e3e6ee', 2) + Ln(-32, -106, 32, -106, '#e3e6ee', 2);
    return s + E(0, -24, 30, 14, '#bfe8ff') + R(-26, -6, 52, 6, 2, '#fff');
  } }),
});

// ---------------- hampers ----------------
const HAMPERS = series('hamper', 'Hampers', 'Hamper', 'bath', 'floor', {
  boho: (st) => ({ w: 100, h: 130, art: (c) => P('M-40 -110 H40 L34 0 H-34Z', c) + weave(-38, -104, 76, 100, dark(c, 0.25), 10) + P('M-40 -110 H40 L34 0 H-34Z', 'url(#g-shadeX)') + E(0, -112, 44, 8, dark(c, 0.1)) + E(0, -116, 42, 8, c) + R(-6, -126, 12, 10, 4, st.accent) + cloth('M30 -108 Q40 -90 34 -76 Q26 -84 24 -104Z', '#ff9ec7') }),
  sweet: () => ({ w: 100, h: 130, art: (c) => cloth('M-38 -100 Q-44 -50 -36 -4 Q0 4 36 -4 Q44 -50 38 -100Z', c, 'dots') + R(-42, -108, 84, 12, 6, GOLD) + bowG(0, -92, 0.6, '#fff') + cloth('M-30 -108 Q-20 -128 0 -120 Q14 -130 26 -110Z', '#7cc8ff') + P(heartD(0, -60, 16), light(c, 0.4)) }),
  woodland: (st) => ({ w: 100, h: 130, art: (c) => {
    let s = P('M-40 -100 H40 L36 0 H-36Z', '#c98a5a');
    for (let y = -90; y < 0; y += 14) s += S(`M-39 ${y} Q0 ${y + 6} 38 ${y}`, '#a86b4a', 3);
    return s + R(-42, -106, 84, 10, 5, '#a86b4a') + leaf(-36, -104, 1.4, -150, c) + leaf(30, -106, 1.3, -30, c) + shroom(28, 0, 9) + cloth('M-20 -104 Q-4 -122 14 -104Z', '#ffab5e');
  } }),
});

// ---------------- rubber ducks ----------------
const duckG = (x: number, y: number, s: number, col = '#ffd84a') => tr(x, y, E(0, -12, 20, 13, col) + C(10, -30, 11, col) + P('M18 -30 L30 -27 L18 -24Z', '#ff8a3d') + C(12, -33, 2.2, INK) + P('M-16 -16 Q-6 -24 4 -14', 'none', stroked(dark(col, 0.15), 3)) + C(6, -36, 3, '#fff', op(0.6)), s);
const DUCKS = series('ducks', 'Rubber Ducks', 'Rubber Ducks', 'bath', 'prop', {
  sweet: () => ({ name: 'Duck Family', w: 110, h: 50, sfx: 'squeak', art: () => bob(duckG(-28, 0, 1.1), 2, 2) + bob(duckG(14, 0, 0.75, '#ff9ec7'), 2, 2, 0.4) + bob(duckG(42, 0, 0.6, '#7cc8ff'), 2, 2, 0.8) }),
  princess: () => ({ name: 'Princess Duck', w: 70, h: 70, sfx: 'squeak', art: () => duckG(-4, 0, 1.4) + motif('crown', 10, -58, 10) + bowG(-8, -24, 0.3, '#ff7eb6') }),
});

// ---------------- laundry ----------------
/** Clothes inside a washer drum; they spin while on. */
const drum = (cx: number, cy: number, r: number, on: boolean, water = true) => {
  const clothes = E(-r * 0.3, r * 0.3, r * 0.35, r * 0.22, '#ff7eb6') + E(r * 0.3, r * 0.2, r * 0.3, r * 0.2, '#7cc8ff') + E(0, -r * 0.35, r * 0.32, r * 0.2, '#ffd36b') + C(-r * 0.2, -r * 0.05, r * 0.14, '#fff');
  let s = C(cx, cy, r, water && on ? '#bfe8ff' : '#3d3a52');
  s += on ? spin(cx, cy, 1.2, tr(cx, cy, clothes)) : tr(cx, cy, clothes);
  if (water && on) s += P(`M${f(cx - r)} ${f(cy + r * 0.2)} Q${f(cx - r / 2)} ${f(cy + r * 0.05)} ${f(cx)} ${f(cy + r * 0.2)} Q${f(cx + r / 2)} ${f(cy + r * 0.35)} ${f(cx + r)} ${f(cy + r * 0.2)} A${f(r)} ${f(r)} 0 0 1 ${f(cx - r)} ${f(cy + r * 0.2)}Z`, WATER, op(0.6)) + floaters(cx, cy, r, 3);
  return s + C(cx, cy, r, GLASS);
};
const wsh = (art: (c: string, on: boolean) => string, extra: Partial<Spec> = {}): Spec => ({ w: 170, h: 180, toggle: true, art, surfaces: [{ x1: -82, x2: 82, y: -176 }], ...extra });
const LAUNDRY = [
  ...series('washer', 'Laundry', 'Washing Machine', 'bath', 'floor', {
    sweet: () => wsh((c, on) => {
      let s = bun(-60, 0, GOLD) + bun(60, 0, GOLD) + box(-82, -176, 164, 166, 22, c) + R(-82, -146, 164, 4, 2, dark(c, 0.12));
      s += knob(-52, -160, 9, '#fff') + C(20, -160, 4, on ? '#7fe0b0' : '#fff') + C(36, -160, 4, '#fff') + C(52, -160, 4, '#fff') + P(heartD(-24, -168, 8), '#fff');
      return s + C(0, -78, 52, GOLD) + drum(0, -78, 42, on) + gloss(-74, -168, 6, 60);
    }),
    modern: (st) => wsh((c, on) => {
      let s = R(-78, -12, 156, 10, 2, INK) + box(-82, -178, 164, 166, 4, c) + R(-82, -178, 164, 28, 4, '#fff') + R(-70, -170, 60, 12, 3, INK) + txt(-40, -161, 9, '#7fe0ff', on ? '0:42' : '1:00') + knob(50, -164, 9, '#c9cfdd');
      return s + C(0, -82, 54, '#c9cfdd') + C(0, -82, 50, INK) + drum(0, -82, 44, on) + R(-78, -146, 4, 120, 2, '#fff', op(0.5));
    }),
    retro: (st) => wsh((c, on) => {
      let s = R(-70, -16, 14, 16, 5, SIL) + R(56, -16, 14, 16, 5, SIL) + boxT(-82, -178, 164, 164, 34, 14, c) + R(-82, -40, 164, 24, 0, st.accent) + R(-82, -42, 164, 4, 2, SIL);
      s += R(-60, -170, 120, 22, 11, SIL) + knob(-40, -159, 7, st.trim) + knob(40, -159, 7, st.trim) + C(0, -159, 6, on ? '#ff7a6b' : '#fff');
      return s + C(0, -94, 50, SIL) + drum(0, -94, 40, on) + motif('star', 62, -60, 7);
    }),
    space: (st) => wsh((c, on) => {
      let s = R(-30, -14, 60, 14, 6, SIL) + box(-82, -178, 164, 164, 40, c, 'stars') + R(-56, -170, 112, 18, 9, '#262b55');
      for (let i = 0; i < 5; i++) s += blinkC(-40 + i * 20, -161, 4, [st.accent, '#7fe0ff', '#ff7eb6', '#7fe0b0', st.accent][i], 1 + i * 0.2, i * 0.15);
      s += C(0, -86, 56, SIL);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; s += C(Math.cos(a) * 52, -86 + Math.sin(a) * 52, 2, '#9aa3b5'); }
      return s + drum(0, -86, 44, on);
    }, { name: 'Space Washing Pod' }),
  }),
  ...series('dryer', 'Laundry', 'Dryer', 'bath', 'floor', {
    cottage: (st) => wsh((c, on) => {
      let s = leg(-62, -14, 14, st.wood, 12) + leg(62, -14, 14, st.wood, 12) + box(-82, -176, 164, 164, 16, c) + R(-82, -176, 164, 26, 8, light(c, 0.3)) + knob(-56, -163, 7, st.wood) + knob(56, -163, 7, st.wood) + flowerG(0, -163, 7, '#fff');
      return s + C(0, -84, 52, '#fff') + drum(0, -84, 42, on, false) + (on ? steam(60, -180, 0.8) : '') + R(-30, -24, 60, 4, 2, dark(c, 0.15));
    }),
    rainbow: () => wsh((c, on) => {
      let s = bun(-60, 0, '#7cc8ff') + bun(60, 0, '#ff7eb6') + box(-82, -176, 164, 164, 22, c);
      RAIN.slice(0, 5).forEach((col, i) => { s += knob(-48 + i * 24, -160, 6, col); });
      RAIN.forEach((col, i) => { s += C(0, -80, 56 - i * 2.5, col); });
      return s + drum(0, -80, 40, on, false) + motif('cloud', 58, -28, 12);
    }),
    candy: (st) => wsh((c, on) => {
      let s = box(-82, -170, 164, 158, 22, c, 'dots') + cloth(dripD(-86, -182, 172, 14, 22, 7, 14), '#fff3f8', 'none', 'y') + sprinkles(-74, -180, 148, 10, 12, 9);
      s += Ln(-60, -14, -60, 0, '#fff', 6) + Ln(60, -14, 60, 0, '#fff', 6) + C(0, -78, 52, '#fff') + C(0, -78, 52, 'none', 'stroke="#ff4f6d" stroke-width="6" stroke-dasharray="9 9"');
      return s + drum(0, -78, 42, on, false) + lolly(62, -150, 8, '#7cc8ff');
    }, { surfaces: [{ x1: -82, x2: 82, y: -182 }] }),
  }),
  ...series('laundrybasket', 'Laundry', 'Laundry Basket', 'bath', 'floor', {
    rainbow: () => ({ w: 130, h: 90, art: (c) => cloth('M-60 -60 Q-30 -86 0 -70 Q30 -88 58 -62Z', '#7cc8ff') + E(-24, -66, 20, 12, '#ff7eb6') + E(26, -66, 22, 12, '#7fe0b0') + P('M-62 -60 H62 L54 0 H-54Z', c) + [0, 1, 2, 3, 4].map((i) => R(-44 + i * 20, -48, 10, 34, 5, dark(c, 0.15))).join('') + P('M-62 -60 H62 L54 0 H-54Z', 'url(#g-shadeX)') + R(-64, -64, 128, 8, 4, light(c, 0.3)) }),
    cottage: (st) => ({ w: 130, h: 90, art: (c) => cloth('M-54 -60 Q-30 -80 0 -66 Q30 -80 54 -60Z', '#fff') + cloth('M-20 -66 Q0 -84 24 -66Z', '#ff9ec7', 'check') + P('M-60 -60 H60 Q58 -10 44 0 H-44 Q-58 -10 -60 -60Z', '#e8c08a') + weave(-56, -56, 112, 52, '#b58a50', 9) + R(-62, -64, 124, 8, 4, '#c9965a') + S('M-62 -60 Q-74 -50 -60 -40 M62 -60 Q74 -50 60 -40', '#c9965a', 5) + bowG(0, -30, 0.4, c) }),
  }),
  ...series('ironing', 'Laundry', 'Ironing Board', 'bath', 'floor', {
    sweet: () => ({ w: 220, h: 130, toggle: true, art: (c, on) => {
      let s = Ln(-60, -96, 40, 0, '#c9cfdd', 6) + Ln(40, -96, -60, 0, '#c9cfdd', 6) + cloth('M-100 -110 H70 Q104 -110 104 -100 Q104 -92 70 -92 H-100 Q-108 -101 -100 -110Z', c, 'hearts', 'y');
      s += P('M30 -112 L38 -130 H72 Q80 -130 80 -122 L80 -112Z', '#fff') + S('M44 -130 Q56 -146 70 -130', light(c, 0.2), 5) + R(30, -114, 52, 4, 2, SIL);
      return s + (on ? steam(80, -126, 0.7) : '') + P(heartD(-40, -108, 7), '#fff');
    } }),
    cottage: (st) => ({ w: 220, h: 130, toggle: true, art: (c, on) => {
      let s = Ln(-60, -96, 40, 0, st.wood, 7) + Ln(40, -96, -60, 0, st.wood, 7) + cloth('M-100 -110 H70 Q104 -110 104 -100 Q104 -92 70 -92 H-100 Q-108 -101 -100 -110Z', c, 'flowers', 'y');
      s += P('M30 -112 L36 -128 H74 Q82 -128 82 -120 V-112Z', IRON) + S('M44 -128 Q56 -146 70 -128', st.wood, 6) + R(-90, -128, 50, 18, 3, '#fff') + Ln(-90, -122, -40, -122, '#ff9ec7', 2);
      return s + (on ? steam(82, -124, 0.7) : '');
    } }),
  }),
];
export const KITCHEN_MORE: FurnDef[] = [...FRIDGES, ...STOVES, ...HOODS, ...SINKS, ...COUNTERS, ...WALLCABS, ...ISLANDS, ...TABLES, ...CHAIRS, ...STOOLS, ...HIGHCHAIRS, ...PANTRIES, ...MICROWAVES, ...TOASTERS, ...COFFEE, ...BLENDERS, ...KETTLES, ...MIXERS, ...BREADBOX, ...CAKESTANDS, ...FRUITBOWLS, ...COOKIEJARS, ...SPICERACKS, ...TUBS, ...SHOWERS, ...TOILETS, ...BATHSINKS, ...MIRRORS, ...TOWELRACKS, ...BATHSHELVES, ...HAMPERS, ...DUCKS, ...LAUNDRY];
