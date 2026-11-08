// Decor catalog: plants, wall art, mirrors, clocks, windows and doors, rugs, ornaments, holiday
// decor and the backyard. Floor items and props sit on their base at (0, 0); wall items and rugs are
// centred on (0, 0). Every function here is a pure SVG string builder.
import {
  type FurnCat, type FurnDef, type Mount, C, E, P, R, Ln, box, cloth, dark, light, f, glow, flame, leg, motif,
  heartD, starD, sparkleD, flowerG, bowG, FURN_STYLE_BY_ID, stylePrice, artCtx,
} from './kit';

type Art = (c: string, on: boolean) => string;
const ST = FURN_STYLE_BY_ID;

// ---------------- little drawing helpers ----------------
/** Path template: every number is formatted, so no long decimals and no NaN slip in. */
const pd = (s: TemplateStringsArray, ...v: number[]) => s.reduce((a, t, i) => a + t + (i < v.length ? f(v[i]) : ''), '');
const S = (d: string, c: string, w = 3, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (t: string, s: string) => `<g transform="${t}">${s}</g>`;
const at = (x: number, y: number, s = 1, r = 0) => `translate(${f(x)} ${f(y)})` + (s !== 1 ? ` scale(${s.toFixed(3)})` : '') + (r ? ` rotate(${f(r)})` : '');
const O = (o: number) => `opacity="${o}"`;
const shine = (x: number, y: number, rx: number, ry: number, o = 0.45) => E(x, y, rx, ry, '#fff', O(o));
const INK = '#4a3f5e';
const LEAF = '#62c78c';
const LEAF_D = '#3f9f72';
const LEAF_L = '#9be3b4';
const STEM = '#4fae7a';
const SKY = '#bfe6ff';

const NIGHT = '#4a4f9e';

const GRASS = '#8fd98a';
const BARK = '#a86b4a';
const GOLD = 'url(#g-gold)';
const SILVER = 'url(#g-silver)';
const GLASS = 'url(#g-glass)';
const SHX = 'url(#g-shadeX)';
const SHY = 'url(#g-shadeY)';
const BIG = (p: string) => `url(#w-${p})`;
const PASTELS = ['#ff9ec7', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff', '#ffab5e'];

const eyes = (x: number, y: number, dx: number, r = 3) =>
  C(x - dx, y, r, INK) + C(x + dx, y, r, INK) + C(x - dx + r * 0.35, y - r * 0.4, r * 0.38, '#fff') + C(x + dx + r * 0.35, y - r * 0.4, r * 0.38, '#fff');
/** A tiny happy face: eyes, smile and rosy cheeks. */
const cute = (x: number, y: number, s = 1) =>
  eyes(x, y, 9 * s, 2.8 * s) + S(pd`M${x - 4 * s} ${y + 5 * s} Q${x} ${y + 9.5 * s} ${x + 4 * s} ${y + 5 * s}`, INK, 1.8 * s) +
  E(x - 15 * s, y + 5 * s, 4.5 * s, 2.6 * s, '#ff8fb0', O(0.75)) + E(x + 15 * s, y + 5 * s, 4.5 * s, 2.6 * s, '#ff8fb0', O(0.75));

// SMIL animation snippets
const SPL = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
const rock = (a: number, cx: number, cy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${f(-a)} ${f(cx)} ${f(cy)};${f(a)} ${f(cx)} ${f(cy)};${f(-a)} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
const bob = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)};0 0" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite" ${SPL}/>`;
const spin = (cx: number, cy: number, dur: number, rev = false) =>
  `<animateTransform attributeName="transform" type="rotate" values="${rev ? 360 : 0} ${f(cx)} ${f(cy)};${rev ? 0 : 360} ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/>`;
const blink = (dur: number, begin = 0, lo = 0.25, hi = 1) =>
  `<animate attributeName="opacity" values="${hi};${lo};${hi}" dur="${dur}s" begin="${f(-begin)}s" repeatCount="indefinite"/>`;
const A = (anim: string, s: string) => `<g>${anim}${s}</g>`;
/** A soft halo that breathes, for lights that are switched on. */
const halo = (x: number, y: number, r: number, col: string, dur = 2, begin = 0) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="0.35">${blink(dur, begin, 0.12, 0.45)}</circle>`;

/** A leaf from its base point, pointing at `ang` degrees (0 = straight up, clockwise). */
function leafD(x: number, y: number, len: number, wid: number, ang: number): string {
  const a = (ang * Math.PI) / 180;
  const ux = Math.sin(a), uy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
  const p = (t: number, o: number) => `${f(x + ux * len * t + nx * o)} ${f(y + uy * len * t + ny * o)}`;
  return `M${p(0, 0)} C${p(0.2, wid)} ${p(0.72, wid * 0.9)} ${p(1, 0)} C${p(0.72, -wid * 0.9)} ${p(0.2, -wid)} ${p(0, 0)}Z`;
}
const along = (x: number, y: number, len: number, ang: number, t: number, o = 0): [number, number] => {
  const a = (ang * Math.PI) / 180;
  return [x + Math.sin(a) * len * t + Math.cos(a) * o, y - Math.cos(a) * len * t + Math.sin(a) * o];
};
function leaf(x: number, y: number, len: number, wid: number, ang: number, col = LEAF, rib = true): string {
  const [x1, y1] = along(x, y, len, ang, 0.08);
  const [x2, y2] = along(x, y, len, ang, 0.85);
  return P(leafD(x, y, len, wid, ang), col) + P(leafD(x, y, len, wid, ang), SHX) + (rib ? Ln(x1, y1, x2, y2, light(col, 0.35), Math.max(1, wid * 0.08)) : '');
}
/** Quadratic bezier point and direction (as a leaf angle). */
function qb(p0: [number, number], p1: [number, number], p2: [number, number], t: number): { x: number; y: number; ang: number } {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, ang: (Math.atan2(dx, -dy) * 180) / Math.PI };
}
const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
/** A round blossom made of petals, for vases and garden beds. */
function bloom(x: number, y: number, r: number, petal: string, n = 6, center = '#ffd36b'): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [px, py] = polar(x, y, r * 0.55, (i * 360) / n - 90);
    s += C(px, py, r * 0.5, petal);
  }
  return s + C(x, y, r * 0.38, center) + C(x - r * 0.12, y - r * 0.12, r * 0.12, '#fff', O(0.6));
}
function rose(x: number, y: number, r: number, col: string): string {
  return C(x, y, r, col) + S(pd`M${x - r * 0.55} ${y} Q${x} ${y - r * 0.8} ${x + r * 0.5} ${y - r * 0.1} Q${x + r * 0.1} ${y + r * 0.5} ${x - r * 0.25} ${y + r * 0.05}`, dark(col, 0.25), r * 0.16) +
    S(pd`M${x - r * 0.7} ${y + r * 0.35} Q${x} ${y + r * 0.95} ${x + r * 0.7} ${y + r * 0.35}`, dark(col, 0.18), r * 0.13) + C(x - r * 0.35, y - r * 0.4, r * 0.18, '#fff', O(0.45));
}
function tulip(x: number, y: number, r: number, col: string): string {
  return P(pd`M${x - r} ${y - r * 0.9} L${x - r * 0.5} ${y - r * 0.2} L${x} ${y - r * 1.15} L${x + r * 0.5} ${y - r * 0.2} L${x + r} ${y - r * 0.9} L${x + r} ${y + r * 0.1} Q${x} ${y + r * 1.2} ${x - r} ${y + r * 0.1}Z`, col) +
    P(pd`M${x - r} ${y - r * 0.9} L${x - r * 0.5} ${y - r * 0.2} L${x} ${y - r * 1.15} L${x + r * 0.5} ${y - r * 0.2} L${x + r} ${y - r * 0.9} L${x + r} ${y + r * 0.1} Q${x} ${y + r * 1.2} ${x - r} ${y + r * 0.1}Z`, SHX) +
    E(x - r * 0.45, y - r * 0.1, r * 0.16, r * 0.4, '#fff', O(0.4));
}
function daisy(x: number, y: number, r: number, petal = '#ffffff', center = '#ffd24a'): string {
  let s = '';
  for (let i = 0; i < 10; i++) {
    const a = i * 36;
    s += E(x, y - r * 0.55, r * 0.2, r * 0.48, petal, `transform="rotate(${a} ${f(x)} ${f(y)})"`);
  }
  return s + C(x, y, r * 0.34, center) + C(x - r * 0.1, y - r * 0.1, r * 0.1, '#fff', O(0.6));
}

// ---------------- pots ----------------
/** A plant pot with its base at (0, 0), `w` wide at the top and `h` tall. */
function pot(kind: string, w: number, h: number, c: string, pat = 'none', trim = '#ffffff'): string {
  const a = w / 2;
  switch (kind) {
    case 'round': {
      const d = pd`M${-a * 0.72} ${-h} C${-a * 1.25} ${-h * 0.62} ${-a * 1.05} ${-h * 0.04} ${-a * 0.5} 0 L${a * 0.5} 0 C${a * 1.05} ${-h * 0.04} ${a * 1.25} ${-h * 0.62} ${a * 0.72} ${-h}Z`;
      return cloth(d, c, pat) + box(-a * 0.82, -h - 10, a * 1.64, 16, 8, dark(c, 0.08)) + shine(-a * 0.5, -h * 0.55, 5, h * 0.2, 0.35);
    }
    case 'cyl':
      return box(-a, -h, w, h, 14, c, pat) + R(-a, -h, w, 14, 7, trim, O(0.9)) + (h > 50 ? R(-a + 8, -h + 22, 8, h - 36, 4, '#fff', O(0.25)) : '');
    case 'basket': {
      let s = cloth(pd`M${-a} ${-h} L${a} ${-h} L${a * 0.82} -8 Q${a * 0.8} 0 ${a * 0.68} 0 L${-a * 0.68} 0 Q${-a * 0.8} 0 ${-a * 0.82} -8Z`, c);
      for (let y = -h + 16; y < -6; y += 12) {
        const k = (-y / h) * 0.18 + 0.82;
        s += S(pd`M${-a * k} ${y} Q${-a * k * 0.5} ${y + 4} 0 ${y} Q${a * k * 0.5} ${y - 4} ${a * k} ${y}`, dark(c, 0.2), 2.4);
      }
      for (let i = -3; i <= 3; i++) s += Ln(i * a * 0.24, -h + 6, i * a * 0.2, -4, dark(c, 0.14), 1.6);
      return s + box(-a - 5, -h - 8, w + 10, 14, 7, dark(c, 0.12)) + S(pd`M${-a} ${-h - 1} L${a} ${-h - 1}`, light(c, 0.3), 2, O(0.7));
    }
    case 'legs': {
      const d = pd`M${-a} ${-h} L${a} ${-h} Q${a * 0.95} ${-h * 0.42} 0 ${-h * 0.4} Q${-a * 0.95} ${-h * 0.42} ${-a} ${-h}Z`;
      return Ln(-a * 0.55, -h * 0.5, -a * 0.8, 0, '#b07a4f', 6) + Ln(a * 0.55, -h * 0.5, a * 0.8, 0, '#b07a4f', 6) + Ln(0, -h * 0.45, 0, -2, '#c98a5a', 6) +
        cloth(d, c, pat) + R(-a - 3, -h - 6, w + 6, 10, 5, dark(c, 0.1));
    }
    case 'urn': {
      const d = pd`M${-a} ${-h + 10} C${-a * 1.1} ${-h * 0.45} ${-a * 0.5} ${-h * 0.3} ${-a * 0.3} ${-h * 0.18} L${a * 0.3} ${-h * 0.18} C${a * 0.5} ${-h * 0.3} ${a * 1.1} ${-h * 0.45} ${a} ${-h + 10}Z`;
      return box(-a * 0.55, -h * 0.2, a * 1.1, h * 0.2, 6, dark(c, 0.06)) + cloth(d, c, pat) + box(-a - 6, -h, w + 12, 16, 8, trim) +
        S(pd`M${-a * 0.8} ${-h * 0.55} Q0 ${-h * 0.45} ${a * 0.8} ${-h * 0.55}`, trim, 3, O(0.8));
    }
    case 'bucket': {
      const d = pd`M${-a} ${-h} L${a} ${-h} L${a * 0.86} 0 L${-a * 0.86} 0Z`;
      return S(pd`M${-a} ${-h + 4} Q0 ${-h - a * 0.9} ${a} ${-h + 4}`, '#9aa3b5', 3) + cloth(d, c, pat) + R(-a - 2, -h - 4, w + 4, 10, 5, light(c, 0.25)) +
        R(-a * 0.92, -h * 0.42, a * 1.84, 6, 3, dark(c, 0.1)) + C(-a * 0.9, -h + 10, 4, '#c9cfdd') + C(a * 0.9, -h + 10, 4, '#c9cfdd');
    }
    case 'face': {
      const d = pd`M${-a} ${-h} L${a} ${-h} L${a * 0.76} -4 Q${a * 0.74} 0 ${a * 0.62} 0 L${-a * 0.62} 0 Q${-a * 0.74} 0 ${-a * 0.76} -4Z`;
      return cloth(d, c, pat) + box(-a - 5, -h - 9, w + 10, 16, 8, dark(c, 0.08)) + cute(0, -h * 0.5, w / 70);
    }
    case 'bowl': {
      const d = pd`M${-a} ${-h} L${a} ${-h} Q${a * 0.95} 0 0 0 Q${-a * 0.95} 0 ${-a} ${-h}Z`;
      return cloth(d, c, pat) + E(0, -h, a, 6, dark(c, 0.12)) + S(pd`M${-a * 0.7} ${-h * 0.45} Q0 ${-h * 0.2} ${a * 0.7} ${-h * 0.45}`, trim, 2.5, O(0.7));
    }
    default: {
      const d = pd`M${-a * 0.92} ${-h} L${a * 0.92} ${-h} L${a * 0.72} 0 L${-a * 0.72} 0Z`;
      return cloth(d, c, pat) + box(-a - 4, -h - 10, w + 8, 18, 8, dark(c, 0.1)) + R(-a * 0.6, -h + 14, 7, h * 0.55, 3.5, '#fff', O(0.25));
    }
  }
}

// ---------------- catalog builder ----------------
/** Makes a catalog entry; prices are filled in per catalog section at the end. */
function it(id: string, name: string, cat: FurnCat, group: string, style: string, mount: Mount, w: number, h: number, art: Art, extra: Partial<FurnDef> = {}): FurnDef {
  return { id, name, cat, group, style, price: -1, mount, w, h, color: ST[style].main, art, ...extra };
}

// =====================================================================================
// PLANTS
// =====================================================================================
/** Stems from the pot to each leaf base. */
const stems = (top: number, pts: number[][], col = STEM, w = 4) => pts.map(([x, y]) => S(pd`M0 ${top} Q${x * 0.2} ${(top + y) / 2} ${x} ${y}`, col, w)).join('');

function monstera(top: number): string {
  const lv: number[][] = [[-40, -150, -50, 74], [34, -168, 40, 76], [-6, -196, -4, 70], [52, -118, 72, 60], [-56, -112, -76, 60], [8, -140, 14, 62]];
  let s = stems(top, lv.map(([x, y]) => [x, y]));
  for (const [x, y, a, l] of lv) {
    s += leaf(x, y, l, l * 0.52, a, LEAF);
    for (const t of [0.32, 0.52, 0.7]) for (const side of [-1, 1]) {
      const [x1, y1] = along(x, y, l, a, t, side * l * 0.45);
      const [x2, y2] = along(x, y, l, a, t + 0.05, side * l * 0.2);
      s += Ln(x1, y1, x2, y2, '#e9fff2', 2.4);
    }
  }
  return `<g class="sway">${s}</g>`;
}
function fern(top: number, col = LEAF): string {
  let s = '';
  const fr: [number, number, number][] = [[-120, 30, 0.9], [-85, -40, 1], [-40, -95, 1], [0, -120, 1], [40, -95, 1], [85, -40, 1], [120, 30, 0.9]];
  for (const [ex, ey, k] of fr) {
    const p0: [number, number] = [0, top];
    const p2: [number, number] = [ex * k, top + ey * k - 20];
    const p1: [number, number] = [ex * 0.35, top + Math.min(ey, 0) * 1.2 - 70];
    s += S(pd`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`, LEAF_D, 3);
    for (let t = 0.18; t < 0.98; t += 0.08) {
      const q = qb(p0, p1, p2, t);
      const len = 22 * (1 - t * 0.6);
      s += P(leafD(q.x, q.y, len, len * 0.32, q.ang - 62), t % 0.16 < 0.08 ? col : light(col, 0.08)) + P(leafD(q.x, q.y, len, len * 0.32, q.ang + 62), dark(col, 0.06));
    }
  }
  return `<g class="sway">${s}</g>`;
}
function snakePlant(top: number): string {
  const lv: [number, number, number, number][] = [[-30, 150, 28, -14], [-12, 190, 30, -4], [8, 210, 32, 4], [26, 170, 28, 12], [42, 120, 24, 20], [-44, 110, 24, -22]];
  let s = '';
  for (const [x, h, w, lean] of lv) {
    const d = pd`M${x - w / 2} ${top + 4} Q${x - w / 2 + lean * 0.2} ${top - h * 0.6} ${x + lean} ${top - h} Q${x + w / 2 + lean * 0.2} ${top - h * 0.6} ${x + w / 2} ${top + 4}Z`;
    s += P(d, '#3f9a6a') + S(d, '#d8e88a', 3);
    for (let k = 0.15; k < 0.8; k += 0.14) {
      const yy = top - h * k;
      const cx = x + lean * k * k;
      const hw = (w / 2) * (1 - k * 0.6) - 3;
      s += S(pd`M${cx - hw} ${yy} Q${cx} ${yy - 5} ${cx + hw} ${yy}`, '#7fcf96', 2.4, O(0.8));
    }
    s += P(d, SHX);
  }
  return s;
}
function palm(top: number): string {
  let s = '';
  const fr: [number, number, number][] = [[-110, -150, -1], [-60, -210, -1], [10, -230, 1], [70, -200, 1], [115, -130, 1], [-20, -170, -1]];
  for (const [ex, ey, dir] of fr) {
    const p0: [number, number] = [0, top];
    const p2: [number, number] = [ex, top + ey + 70];
    const p1: [number, number] = [ex * 0.4, top + ey];
    s += S(pd`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`, '#6fae5a', 3.5);
    for (let t = 0.3; t < 0.98; t += 0.07) {
      const q = qb(p0, p1, p2, t);
      const len = 34 * (1 - t * 0.45);
      s += P(leafD(q.x, q.y, len, 3.6, q.ang + 110), LEAF) + P(leafD(q.x, q.y, len, 3.6, q.ang - 110 + dir * 10), LEAF_D);
    }
  }
  return `<g class="sway">${s}</g>`;
}
function fiddle(top: number): string {
  let s = S(pd`M0 ${top} Q-8 ${top - 120} 4 ${top - 230}`, '#8a5a3c', 8);
  const lv: [number, number, number, number][] = [[-2, top - 60, -70, 46], [2, top - 84, 68, 48], [-2, top - 116, -62, 50], [3, top - 142, 58, 50], [0, top - 172, -46, 48], [3, top - 196, 40, 46], [4, top - 224, 0, 46]];
  for (const [x, y, a, l] of lv) s += leaf(x, y, l, l * 0.42, a, a > 0 ? '#5bbf80' : LEAF);
  return `<g class="sway">${s}</g>`;
}
function hydrangea(top: number): string {
  let s = '';
  for (const [x, , a] of [[-40, top - 20, -70], [40, top - 24, 70], [-20, top - 30, -30], [26, top - 34, 30], [0, top - 26, 0]]) s += leaf(x * 0.2, top - 6, 46, 20, a, LEAF);
  const balls: [number, number, string][] = [[-36, top - 66, '#ffb3d9'], [34, top - 70, '#d4b8ff'], [0, top - 96, '#b8d8ff'], [-6, top - 52, '#ffc9e6']];
  for (const [x, y, col] of balls) {
    s += C(x, y, 30, dark(col, 0.06));
    for (let i = 0; i < 11; i++) {
      const [fx, fy] = polar(x, y, i === 0 ? 0 : i < 6 ? 13 : 23, i * 66);
      s += C(fx - 3, fy - 3, 5.5, col) + C(fx + 3, fy - 3, 5.5, col) + C(fx - 3, fy + 3, 5.5, col) + C(fx + 3, fy + 3, 5.5, col) + C(fx, fy, 2, light(col, 0.6));
    }
    s += C(x - 10, y - 12, 7, '#fff', O(0.25));
  }
  return s;
}
function lemonTree(top: number): string {
  let s = R(-6, top - 130, 12, 130, 6, '#a86b4a') + S(pd`M0 ${top - 80} L-26 ${top - 120} M0 ${top - 96} L24 ${top - 140}`, '#a86b4a', 7);
  s += C(0, top - 175, 70, LEAF_D) + C(-48, top - 150, 42, LEAF) + C(48, top - 152, 42, LEAF) + C(0, top - 200, 54, LEAF) + C(-20, top - 220, 24, LEAF_L, O(0.6));
  for (const [x, y] of [[-40, -150], [36, -170], [8, -130], [-14, -200], [50, -136], [-56, -186], [26, -214]]) s += E(x, top + y, 10, 8, '#ffe06b') + C(x - 3, top + y - 3, 2.5, '#fff', O(0.7));
  for (const [x, y] of [[-24, -168], [22, -196], [-2, -236]]) s += flowerG(x, top + y, 8, '#fff');
  return `<g class="tree-sway">${s}</g>`;
}
function starlight(top: number, on: boolean): string {
  let s = '';
  const st: [number, number, string][] = [[-56, -150, '#ffe680'], [-20, -210, '#9fd6ff'], [26, -190, '#ffb3e6'], [60, -130, '#ffe680'], [0, -120, '#c9b3ff']];
  st.forEach(([x, y, col], i) => {
    s += S(pd`M0 ${top} C${x * 0.2} ${top - 40} ${x * 1.2} ${top + y * 0.5} ${x} ${top + y}`, '#5fc4b0', 5);
    s += leaf(x * 0.45, top + y * 0.45, 30, 12, x > 0 ? 50 : -50, '#6fd8c0', false);
    if (on) s += halo(x, top + y, 34, col, 1.6 + i * 0.3, i * 0.4) + glow(x, top + y, 40);
    s += C(x, top + y, 15, col) + C(x - 5, top + y - 5, 4.5, '#fff', O(0.8)) + P(sparkleD(x + 18, top + y - 16, 6), '#fff', O(0.8));
  });
  return `<g class="sway">${s}</g>`;
}
function roseTopiary(top: number, c: string): string {
  let s = R(-5, top - 110, 10, 110, 5, '#a86b4a') + `<g transform="translate(0 ${f(top - 70)}) scale(0.55)">${bowG(0, 0, 1, c)}</g>`;
  s += C(0, top - 160, 62, LEAF_D) + C(0, top - 160, 62, 'url(#g-face)');
  for (let i = 0; i < 14; i++) {
    const [x, y] = polar(0, top - 160, i < 8 ? 44 : 20, i * (i < 8 ? 45 : 60) + 15);
    s += rose(x, y, 12, i % 3 ? '#ff8fbf' : '#ffc2dc');
  }
  return s + rose(0, top - 160, 13, '#ff6fa8');
}
function firTree(top: number): string {
  const snow = artCtx.season === 'winter';
  let s = R(-8, top - 30, 16, 32, 4, '#8a5a3c');
  for (let i = 0; i < 4; i++) {
    const y = top - 20 - i * 46;
    const w = 74 - i * 15;
    const d = pd`M${-w} ${y} Q0 ${y + 12} ${w} ${y} L0 ${y - 74}Z`;
    s += cloth(d, i % 2 ? '#4aa87a' : '#3f9a6a') + (snow ? P(pd`M${-w * 0.55} ${y - 30} Q0 ${y - 26} ${w * 0.55} ${y - 30} L0 ${y - 74}Z`, '#fff', O(0.92)) : '');
  }
  if (!snow) for (const [x, y] of [[-40, -40], [30, -82], [-20, -120], [16, -160]]) s += E(x, top + y, 6, 9, '#a86b4a') + S(pd`M${x - 4} ${top + y - 2} L${x + 4} ${top + y - 2} M${x - 4} ${top + y + 3} L${x + 4} ${top + y + 3}`, '#7a4a30', 1.4);
  return s + P(starD(0, top - 200, 14), GOLD);
}
function birdOfParadise(top: number): string {
  let s = '';
  for (const [a, l, x] of [[-40, 120, -10], [-14, 160, -4], [18, 150, 4], [44, 110, 10], [-62, 90, -14]] as const) {
    const [ex, ey] = along(x, top, l * 0.55, a * 0.5, 1);
    s += S(pd`M${x} ${top} L${ex} ${ey}`, STEM, 5) + leaf(ex, ey, l * 0.6, 18, a, a > 0 ? LEAF : '#55b880');
  }
  const fl = (x: number, y: number, k: number) => G(at(x, y, k), S('M0 0 L0 60', STEM, 5) + P('M0 0 Q-10 -6 -40 2 Q-14 8 0 6Z', '#4f8f6a') + P('M-8 -2 L-30 -40 L-20 -4Z', '#ffab3d') + P('M-4 -2 L-6 -50 L4 -4Z', '#ff8a3d') + P('M0 -2 L14 -36 L6 -2Z', '#ffc23d') + P('M-26 0 L-40 -16 L-16 -2Z', '#7c8cff'));
  return `<g class="sway">${s}${fl(-20, top - 150, 1)}${fl(30, top - 110, 0.8)}</g>`;
}
function pampas(top: number): string {
  let s = '';
  const pl: [number, number, number][] = [[-30, -40, 150], [-10, -14, 190], [12, 10, 175], [32, 34, 140], [0, -2, 120]];
  for (const [x, a, l] of pl) {
    const [ex, ey] = along(x * 0.3, top, l, a, 1);
    const [mx, my] = along(x * 0.3, top, l, a, 0.55);
    s += S(pd`M${x * 0.3} ${top} Q${mx} ${my} ${ex} ${ey}`, '#c9a27e', 2.5);
    for (let k = 0; k < 7; k++) {
      const [px, py] = along(x * 0.3, top, l, a, 0.62 + k * 0.06, (k % 2 ? 1 : -1) * 4);
      s += E(px, py, 11 - k * 0.8, 16 - k, k % 2 ? '#f6ead2' : '#efdcb8', `transform="rotate(${f(a)} ${f(px)} ${f(py)})"`);
    }
  }
  for (const [a] of [[-50], [55]]) s += leaf(0, top, 70, 6, a, '#c9b37e', false);
  return `<g class="sway">${s}</g>`;
}

/** Floor plant: pot drawn by `pk` and foliage on top. */
function potted(id: string, name: string, style: string, w: number, h: number, pk: string, ph: number, pw: number, fol: (top: number, c: string, on: boolean) => string, extra: Partial<FurnDef> = {}): FurnDef {
  const s = ST[style];
  return it(id, name, 'plants', 'Potted Plants', style, 'floor', w, h, (c, on) => fol(-ph + 4, c, on) + pot(pk, pw, ph, c, s.pattern, s.trim), extra);
}

const POTTED: FurnDef[] = [
  potted('f-plant-monstera-sweet', 'Monstera', 'sweet', 170, 280, 'round', 84, 96, (t) => monstera(t)),
  potted('f-plant-hydrangea-princess', 'Hydrangea Pot', 'princess', 150, 230, 'urn', 90, 100, (t) => hydrangea(t)),
  potted('f-plant-snake-modern', 'Snake Plant', 'modern', 120, 290, 'legs', 96, 90, (t) => snakePlant(t)),
  potted('f-plant-fern-cottage', 'Fluffy Fern', 'cottage', 250, 220, 'taper', 80, 100, (t) => fern(t)),
  potted('f-plant-lemon-rainbow', 'Lemon Tree', 'rainbow', 190, 330, 'cyl', 82, 96, (t) => lemonTree(t)),
  potted('f-plant-starlight-space', 'Starlight Plant', 'space', 170, 300, 'round', 80, 90, (t, _c, on) => starlight(t, on), { toggle: true }),
  potted('f-plant-palm-beach', 'Palm Plant', 'beach', 240, 290, 'basket', 86, 100, (t) => palm(t)),
  potted('f-plant-topiary-candy', 'Rose Topiary', 'candy', 140, 330, 'cyl', 80, 84, (t, c) => roseTopiary(t, c)),
  potted('f-plant-fir-woodland', 'Little Fir Tree', 'woodland', 150, 310, 'bucket', 80, 96, (t) => firTree(t)),
  potted('f-plant-fiddle-boho', 'Fiddle-Leaf Fig', 'boho', 150, 330, 'basket', 86, 96, (t) => fiddle(t)),
  potted('f-plant-paradise-retro', 'Bird of Paradise', 'retro', 200, 300, 'legs', 100, 96, (t) => birdOfParadise(t)),
  potted('f-plant-pampas-boho', 'Pampas Vase', 'boho', 170, 330, 'urn', 120, 76, (t) => pampas(t)),
];

// ---- cacti & succulents (tabletop) ----
const spines = (pts: number[][]) => pts.map(([x, y]) => S(pd`M${x - 2} ${y} L${x + 2} ${y} M${x} ${y - 2} L${x} ${y + 2}`, '#fff', 1.2, O(0.9))).join('');
function cactusArt(kind: string): Art {
  return (c) => {
    switch (kind) {
      case 'saguaro':
        return box(-15, -110, 30, 84, 15, '#5fc47c') + box(-36, -86, 16, 38, 8, '#5fc47c') + R(-30, -58, 20, 12, 6, '#5fc47c') + box(20, -96, 16, 40, 8, '#5fc47c') + R(14, -64, 20, 12, 6, '#5fc47c') +
          S('M-6 -100 L-6 -34 M6 -100 L6 -34', '#4aa86a', 1.6) + spines([[-10, -92], [10, -80], [-10, -60], [10, -48], [-28, -76], [28, -84]]) + cute(0, -74, 0.45) +
          flowerG(-6, -112, 8, '#ff7eb6') + flowerG(8, -108, 6, '#ffd36b') + pot('face', 58, 34, c);
      case 'barrel':
        return E(0, -52, 34, 30, '#56b874') + E(0, -52, 34, 30, 'url(#g-face)') + [-22, -11, 0, 11, 22].map((x) => S(pd`M${x} -80 Q${x * 1.35} -52 ${x} -24`, '#3f9f62', 1.6)).join('') +
          spines([[-16, -62], [0, -70], [16, -60], [-24, -44], [8, -40], [24, -46]]) + bloom(-6, -84, 12, '#ff7eb6', 6) + bloom(14, -80, 8, '#ffd9e8', 5) + pot('bowl', 76, 26, c, 'dots');
      case 'bunny':
        return E(0, -50, 22, 26, '#6fcf8a') + E(-16, -84, 11, 20, '#6fcf8a', 'transform="rotate(-18 -16 -84)"') + E(16, -84, 11, 20, '#6fcf8a', 'transform="rotate(18 16 -84)"') +
          E(-16, -84, 5, 12, '#ffc2dc', 'transform="rotate(-18 -16 -84)"') + E(16, -84, 5, 12, '#ffc2dc', 'transform="rotate(18 16 -84)"') + cute(0, -52, 0.6) +
          spines([[-12, -36], [12, -38], [-18, -60], [18, -62]]) + `<g transform="translate(0 -104) scale(0.4)">${motif('crown', 0, 0, 20)}</g>` + pot('urn', 56, 30, c, 'none', '#ffd24a');
      case 'succulents': {
        const ros = (x: number, y: number, r: number, col: string) => {
          let s = '';
          for (let k = 0; k < 3; k++) for (let i = 0; i < 7; i++) s += P(leafD(x, y, r * (1 - k * 0.28), r * 0.3, i * 51 + k * 25), k === 2 ? light(col, 0.3) : k ? light(col, 0.12) : col);
          return s + C(x, y, r * 0.15, light(col, 0.4));
        };
        return ros(-26, -32, 22, '#8fd4b0') + ros(24, -34, 20, '#b7c9ff') + ros(0, -40, 24, '#a6dcae') + ros(-6, -28, 12, '#ffb3c7') + pot('bowl', 100, 26, c, 'flowers');
      }
      case 'aloe': {
        let s = '';
        for (const a of [-64, -40, -16, 8, 30, 56]) s += P(leafD(0, -40, 66 - Math.abs(a) * 0.3, 7, a), a % 16 ? '#7fcf96' : '#62b884') + P(leafD(0, -40, 66 - Math.abs(a) * 0.3, 7, a), SHX);
        return s + spines([[-24, -70], [22, -76], [0, -90]]) + pot('cyl', 54, 42, c, 'none', '#4a4a5e');
      }
      case 'pearls': {
        let s = pot('round', 58, 40, c);
        const strands: [number, number][] = [[-30, 64], [-22, 46], [-12, 30], [14, 34], [24, 52], [31, 70]];
        for (const [x0, len] of strands) {
          s += S(pd`M${x0 * 0.7} -46 Q${x0 * 1.1} -40 ${x0} ${-40 + len}`, '#6fae5a', 1.4);
          for (let j = 0; j * 7 < len; j++) s += C(x0 + Math.sin(j * 1.3) * 2.5, -42 + j * 7, 3.6, '#7fd39a') + C(x0 + Math.sin(j * 1.3) * 2.5 - 1, -43 + j * 7, 1.2, '#fff', O(0.7));
        }
        for (let i = 0; i < 11; i++) s += C(-25 + i * 5, -48 - (i % 3) * 3, 4, i % 2 ? '#7fd39a' : '#8fdca6');
        return s;
      }
      case 'moon':
        return box(-12, -66, 24, 40, 10, '#56b874') + spines([[-6, -56], [6, -44], [-6, -36]]) + C(0, -82, 20, c === '#3f4f9a' ? '#ff7eb6' : light(c, 0.2)) + C(0, -82, 20, 'url(#g-face)') +
          S('M-14 -90 Q0 -98 14 -90 M-16 -78 Q0 -70 16 -78', '#fff', 1.5, O(0.6)) + P(starD(22, -100, 6), '#ffe680') + P(sparkleD(-24, -96, 5), '#fff') +
          pot('round', 48, 30, '#3f4f9a', 'stars');
      case 'terrarium':
        return E(0, -6, 44, 8, '#a86b4a') + R(-44, -12, 88, 10, 5, '#c98a5a') + P('M-40 -12 L-40 -60 A40 40 0 0 1 40 -60 L40 -12Z', '#e6f6ff', O(0.55)) + E(0, -18, 38, 10, '#8fbf6a') +
          E(-14, -24, 14, 9, '#6fae5a') + R(10, -40, 5, 20, 2, '#fff3e6') + P('M2 -40 Q12 -56 22 -40Z', '#e8573d') + C(8, -44, 2, '#fff') + C(16, -46, 1.8, '#fff') +
          leaf(-20, -24, 26, 8, -20, LEAF) + leaf(-10, -22, 20, 6, 20, LEAF_D) + P('M-40 -12 L-40 -60 A40 40 0 0 1 40 -60 L40 -12Z', GLASS) + C(0, -102, 6, c) + R(-3, -102, 6, 4, 2, c);
      default:
        return '';
    }
  };
}
const CACTI: FurnDef[] = [
  it('f-cactus-saguaro-sweet', 'Smiley Cactus', 'plants', 'Cacti & Succulents', 'sweet', 'prop', 76, 124, cactusArt('saguaro')),
  it('f-cactus-barrel-candy', 'Bloom Cactus', 'plants', 'Cacti & Succulents', 'candy', 'prop', 80, 100, cactusArt('barrel')),
  it('f-cactus-bunny-princess', 'Bunny Ear Cactus', 'plants', 'Cacti & Succulents', 'princess', 'prop', 70, 116, cactusArt('bunny')),
  it('f-succulent-bowl-cottage', 'Succulent Bowl', 'plants', 'Cacti & Succulents', 'cottage', 'prop', 104, 64, cactusArt('succulents')),
  it('f-succulent-aloe-modern', 'Aloe Pot', 'plants', 'Cacti & Succulents', 'modern', 'prop', 80, 100, cactusArt('aloe')),
  it('f-succulent-pearls-boho', 'String of Pearls', 'plants', 'Cacti & Succulents', 'boho', 'prop', 70, 80, cactusArt('pearls')),
  it('f-cactus-moon-space', 'Moon Cactus', 'plants', 'Cacti & Succulents', 'space', 'prop', 60, 110, cactusArt('moon')),
  it('f-terrarium-woodland', 'Mossy Terrarium', 'plants', 'Cacti & Succulents', 'woodland', 'prop', 92, 112, cactusArt('terrarium')),
];

// ---- hanging plants (wall) ----
const trail = (x: number, y: number, len: number, sway: number, col = LEAF, heart = false) => {
  let s = S(pd`M${x} ${y} Q${x + sway} ${y + len * 0.5} ${x - sway * 0.4} ${y + len}`, '#4f9a5f', 1.8);
  for (let t = 0.12; t <= 1; t += 0.14) {
    const q = qb([x, y], [x + sway, y + len * 0.5], [x - sway * 0.4, y + len], t);
    const side = Math.round(t * 7) % 2 ? 1 : -1;
    s += heart ? P(heartD(q.x + side * 5, q.y - 4, 7), side > 0 ? '#7fcf96' : '#a8d88f') : P(leafD(q.x, q.y, 16, 7, 180 + side * 50), side > 0 ? col : dark(col, 0.08));
  }
  return s;
};
const HANGING: FurnDef[] = [
  it('f-hanging-macrame-boho', 'Macrame Planter', 'plants', 'Hanging Plants', 'boho', 'wall', 130, 240, (c) => {
    let s = C(0, -112, 7, 'none', 'stroke="#c9a27e" stroke-width="3"');
    for (const x of [-30, -10, 10, 30]) s += S(pd`M0 -104 Q${x * 0.5} -50 ${x} 0`, '#f4e6c8', 3);
    s += S('M-17 -50 L-5 -36 L5 -50 L17 -36', '#f4e6c8', 2.5) + C(0, -104, 5, '#e8907a') + C(-5, -36, 3.5, '#e8907a') + C(5, -50, 3.5, '#e8907a');
    s += trail(-26, 20, 96, -10) + trail(24, 20, 104, 12) + trail(-4, 24, 76, 8, LEAF_D);
    for (const a of [-64, -32, 0, 32, 64]) s += leaf(0, 0, 38, 14, a, a % 64 ? LEAF : '#55b880');
    return s + G('translate(0 36)', pot('round', 64, 40, c)) + R(-4, 36, 8, 14, 3, '#f4e6c8') + S('M-4 50 L-9 74 M0 50 L0 78 M4 50 L9 74', '#f4e6c8', 2.2);
  }),
  it('f-hanging-basket-cottage', 'Flower Basket', 'plants', 'Hanging Plants', 'cottage', 'wall', 150, 200, (c) => {
    let s = S('M-60 -40 Q0 -140 60 -40', '#8a5a3c', 3) + C(0, -98, 6, 'none', 'stroke="#8a5a3c" stroke-width="3"');
    s += trail(-46, 10, 70, -8) + trail(44, 12, 80, 10) + trail(0, 16, 60, 6, LEAF_D);
    for (const [x, y, col] of [[-40, -48, '#ff9ec7'], [-14, -58, '#ffd36b'], [14, -56, '#c99bff'], [40, -46, '#ff7eb6'], [-26, -34, '#fff'], [28, -34, '#ffb3c7'], [0, -40, '#ff7eb6']] as const) s += leaf(x, y + 10, 18, 8, x * 1.4, LEAF) + bloom(x, y, 14, col);
    return s + G('translate(0 26)', pot('basket', 110, 56, '#e8c08a')) + G('translate(0 -26) scale(0.6)', bowG(0, 0, 1, c));
  }),
  it('f-hanging-globe-modern', 'Glass Globe Planter', 'plants', 'Hanging Plants', 'modern', 'wall', 120, 240, (c) =>
    Ln(0, -120, 0, -40, '#4a4a5e', 2) + C(0, 10, 50, '#eef6ff', O(0.5)) + P('M-48 26 A50 50 0 0 0 48 26Z', '#e8d4b0') + P('M-44 34 A50 50 0 0 0 44 34Z', '#c9a27e') +
    leaf(-10, 22, 34, 10, -30, LEAF) + leaf(6, 22, 40, 10, 10, LEAF_D) + leaf(14, 24, 26, 9, 50, LEAF) + C(-26, 30, 5, '#fff') + C(24, 34, 4, '#9aa3b5') +
    C(0, 10, 50, GLASS) + C(0, 10, 50, 'none', `stroke="${c}" stroke-width="3"`) + E(0, -40, 14, 5, c === '#e6e8f0' ? '#4a4a5e' : c) + shine(-24, -10, 7, 14, 0.6)),
  it('f-hanging-pocket-woodland', 'Ivy Wall Pocket', 'plants', 'Hanging Plants', 'woodland', 'wall', 130, 200, (c) =>
    trail(-30, -10, 110, -14) + trail(26, -10, 96, 14, LEAF_D) + trail(0, -6, 70, 4) + [-50, -20, 10, 40].map((a, i) => leaf(-10 + i * 6, -36, 42, 14, a, i % 2 ? LEAF : '#55b880')).join('') +
    cloth('M-50 -60 L50 -60 L42 -6 Q0 6 -42 -6Z', c, 'check') + R(-54, -66, 108, 12, 6, '#a86b4a') + C(0, -60, 4, '#6b4a3a') + motif('leaf', 0, -32, 12)),
  it('f-hanging-hearts-sweet', 'String of Hearts', 'plants', 'Hanging Plants', 'sweet', 'wall', 120, 240, (c) => {
    let s = S('M-30 -40 L0 -116 L30 -40', '#ffffff', 2.5) + C(0, -116, 5, GOLD);
    s += trail(-26, 0, 120, -10, LEAF, true) + trail(22, 0, 104, 10, LEAF, true) + trail(-4, 4, 80, 6, LEAF, true) + trail(10, 4, 60, -6, LEAF, true);
    return s + G('translate(0 6)', P(heartD(0, -56, 44), c) + P(heartD(0, -56, 44), SHX) + E(-14, -40, 6, 10, '#fff', O(0.4)));
  }),
];

// ---- flower vases (tabletop) ----
function vaseShape(kind: string, c: string, pat: string): string {
  switch (kind) {
    case 'jug':
      return S('M18 -50 Q34 -46 26 -22', c, 6) + cloth('M-14 -60 L14 -60 Q12 -50 20 -40 Q30 -16 18 0 L-18 0 Q-30 -16 -20 -40 Q-12 -50 -14 -60Z', c, pat) + E(0, -60, 14, 4, dark(c, 0.15));
    case 'jar':
      return box(-22, -54, 44, 54, 12, '#d9efff') + R(-22, -54, 44, 54, 12, GLASS) + E(0, -56, 20, 5, '#c9cfdd') + S('M-16 -40 L16 -40', c, 4) + R(-24, -46, 48, 8, 4, c);
    case 'crystal':
      return P('M-22 -62 L22 -62 L12 -20 L18 0 L-18 0 L-12 -20Z', '#e6f6ff', O(0.85)) + P('M-22 -62 L22 -62 L12 -20 L18 0 L-18 0 L-12 -20Z', GLASS) + S('M-8 -62 L-4 -20 M8 -62 L4 -20', '#fff', 1.5, O(0.8)) + R(-18, -4, 36, 6, 3, GOLD);
    case 'bottle':
      return box(-18, -52, 36, 52, 14, '#ffffff') + R(-8, -70, 16, 20, 4, '#ffffff') + R(-18, -36, 36, 18, 2, c) + P(heartD(0, -34, 7), '#fff') + R(-18, -52, 36, 52, 14, GLASS);
    case 'tin':
      return box(-22, -46, 44, 46, 6, '#c9cfdd') + R(-22, -46, 44, 46, 6, SHX) + R(-22, -34, 44, 18, 2, c) + flowerG(0, -25, 8, '#fff', '#c99bff');
    case 'tall':
      return cloth('M-10 -100 L10 -100 Q14 -60 22 -30 Q26 0 0 0 Q-26 0 -22 -30 Q-14 -60 -10 -100Z', c, pat) + E(0, -100, 10, 3, dark(c, 0.2)) + S('M-8 -72 Q-14 -40 -10 -12', '#fff', 3, O(0.35));
    case 'stripe':
      return cloth('M-18 -56 L18 -56 L24 0 L-24 0Z', c, 'none') + [0, 1, 2].map((i) => R(-21 + i * 0.7, -46 + i * 16, 42 - i * 1.4, 7, 3, '#fff', O(0.85))).join('') + E(0, -56, 18, 4, dark(c, 0.15));
    default:
      return '';
  }
}
const stem = (x0: number, y0: number, x1: number, y1: number) => S(pd`M${x0} ${y0} Q${(x0 + x1) / 2 + (x1 - x0) * 0.2} ${(y0 + y1) / 2} ${x1} ${y1}`, STEM, 3);
const VASES: FurnDef[] = [
  it('f-vase-tulips-cottage', 'Tulip Jug', 'plants', 'Flower Vases', 'cottage', 'prop', 80, 130, (c) =>
    [[-20, -110, '#ff7eb6'], [0, -122, '#ffd36b'], [20, -108, '#ff9a6b'], [-8, -96, '#fff'], [12, -96, '#ff7eb6']].map(([x, y, col]) => stem(0, -58, x as number, (y as number) + 8) + tulip(x as number, y as number, 10, col as string)).join('') +
    leaf(-6, -60, 40, 7, -30, LEAF) + leaf(6, -60, 36, 7, 30, LEAF_D) + vaseShape('jug', c, 'flowers')),
  it('f-vase-sunflower-retro', 'Sunflower Jar', 'plants', 'Flower Vases', 'retro', 'prop', 100, 140, (c) =>
    [[-24, -112], [20, -124], [0, -96]].map(([x, y]) => stem(0, -54, x, y + 14)).join('') + leaf(-14, -70, 26, 9, -60, LEAF) + leaf(14, -74, 26, 9, 60, LEAF_D) +
    [[-24, -112, 20], [20, -124, 22], [0, -96, 17]].map(([x, y, r]) => { let s = ''; for (let i = 0; i < 12; i++) s += P(leafD(x, y, r, r * 0.3, i * 30), i % 2 ? '#ffd24a' : '#ffc23d'); return s + C(x, y, r * 0.42, '#8a5a3c') + C(x - 2, y - 2, r * 0.14, '#b07a4f'); }).join('') + vaseShape('jar', c, 'none')),
  it('f-vase-roses-princess', 'Crystal Roses', 'plants', 'Flower Vases', 'princess', 'prop', 90, 130, (c) =>
    [[-20, -100], [18, -104], [0, -118], [-6, -88], [12, -86]].map(([x, y]) => stem(0, -60, x, y)).join('') + leaf(-16, -84, 18, 8, -50, LEAF) + leaf(16, -86, 18, 8, 50, LEAF_D) +
    [[-20, -100, c === '#ffc7dc' ? '#ff8fbf' : c], [18, -104, '#ff6fa8'], [0, -118, '#ffb3d1'], [-6, -88, '#ff6fa8'], [12, -86, '#ffc2dc']].map(([x, y, col]) => rose(x as number, y as number, 11, col as string)).join('') + vaseShape('crystal', c, 'none')),
  it('f-vase-daisy-sweet', 'Daisy Bottle', 'plants', 'Flower Vases', 'sweet', 'prop', 80, 130, (c) =>
    [[-18, -110], [16, -116], [0, -126], [-4, -96]].map(([x, y]) => stem(0, -68, x, y)).join('') + [[-18, -110], [16, -116], [0, -126], [-4, -96]].map(([x, y], i) => daisy(x, y, 13, i % 2 ? '#fff' : '#fff3f8')).join('') + vaseShape('bottle', c, 'none')),
  it('f-vase-lavender-boho', 'Lavender Tin', 'plants', 'Flower Vases', 'boho', 'prop', 70, 130, (c) => {
    let s = '';
    for (let i = 0; i < 7; i++) {
      const x = -18 + i * 6;
      const top = -112 - ((i * 7) % 14);
      s += S(pd`M${x * 0.4} -44 L${x} ${top + 22}`, '#7aa86a', 2);
      for (let k = 0; k < 6; k++) s += E(x + (k % 2 ? 2 : -2), top + k * 5, 3, 4, k % 2 ? '#b38fe0' : '#c9a6f0');
    }
    return s + `<g transform="translate(0 -40) scale(0.4)">${bowG(0, 0, 1, '#e8907a')}</g>` + vaseShape('tin', c, 'none');
  }),
  it('f-vase-blossom-modern', 'Blossom Branch', 'plants', 'Flower Vases', 'modern', 'prop', 110, 190, (c) => {
    let s = S('M0 -96 Q-6 -130 -30 -170 M-6 -124 Q20 -150 40 -176 M-20 -152 L-44 -150 M16 -150 L36 -142', '#6b4a3a', 3);
    for (const [x, y] of [[-30, -170], [40, -176], [-44, -150], [36, -142], [-14, -140], [10, -132], [-24, -160], [26, -164], [-38, -176], [46, -170]]) s += bloom(x, y, 8, '#ffc2dc', 5, '#ff8fbf');
    return s + vaseShape('tall', c, 'none');
  }),
  it('f-vase-gerbera-candy', 'Gerbera Vase', 'plants', 'Flower Vases', 'candy', 'prop', 90, 130, (c) =>
    [[-20, -104, '#ff6f91'], [20, -108, '#ffd36b'], [0, -122, '#ff9ec7'], [-4, -92, '#a8e6cf']].map(([x, y, col]) => stem(0, -54, x as number, y as number) + bloom(x as number, y as number, 16, col as string, 10, '#8a5a3c')).join('') + vaseShape('stripe', c, 'none')),
];

// ---- plant stands ----
const STANDS: FurnDef[] = [
  it('f-stand-ladder-woodland', 'Ladder Plant Stand', 'plants', 'Plant Stands', 'woodland', 'floor', 180, 250, (c) => {
    let s = Ln(-80, 0, -40, -240, '#a86b4a', 10) + Ln(80, 0, 40, -240, '#a86b4a', 10);
    const sh = [[-74, -16], [-60, -96], [-46, -176]];
    for (const [x, y] of sh) s += box(x - 4, y - 8, -2 * x + 8, 14, 5, '#c98a5a');
    s += G('translate(-36 -24)', pot('bucket', 44, 34, c)) + G('translate(36 -24)', pot('taper', 44, 36, '#ffab5e')) + G('translate(36 -24)', leaf(0, -36, 40, 13, -20) + leaf(0, -36, 34, 12, 30, LEAF_D));
    s += G('translate(0 -104)', pot('round', 50, 34, '#f4ead9') + trail(-16, -30, 70, -10) + trail(14, -30, 60, 8) + leaf(0, -36, 30, 12, -30) + leaf(0, -36, 30, 12, 30, LEAF_D));
    s += G('translate(0 -184)', pot('cyl', 40, 32, c) + [-40, -10, 20, 45].map((a) => leaf(0, -30, 30, 10, a, LEAF)).join(''));
    return s;
  }),
  it('f-stand-pedestal-modern', 'Pedestal Planter', 'plants', 'Plant Stands', 'modern', 'floor', 140, 260, (c) =>
    E(0, -4, 40, 8, '#4a4a5e') + R(-6, -150, 12, 148, 5, '#4a4a5e') + R(-44, -156, 88, 10, 5, '#4a4a5e') + G('translate(0 -156)', pot('cyl', 72, 56, c, 'none', '#ffffff') +
    trail(-28, -50, 120, -16) + trail(26, -50, 110, 14, LEAF_D) + trail(-6, -50, 150, 8) + [-60, -30, 0, 30, 60].map((a) => leaf(0, -54, 36, 14, a, a % 60 ? LEAF : '#55b880')).join(''))),
  it('f-stand-bike-cottage', 'Flower Bike', 'plants', 'Plant Stands', 'cottage', 'floor', 260, 190, (c) => {
    const wheel = (x: number) => C(x, -50, 46, 'none', `stroke="${dark(c, 0.35)}" stroke-width="7"`) + C(x, -50, 6, '#c9cfdd') + [0, 45, 90, 135].map((a) => { const [x1, y1] = polar(x, -50, 42, a); const [x2, y2] = polar(x, -50, 42, a + 180); return Ln(x1, y1, x2, y2, '#c9cfdd', 1.4); }).join('');
    let s = wheel(-80) + wheel(80) + S('M-80 -50 L-20 -50 L20 -120 L-40 -120 Z M20 -120 L80 -50 M-20 -50 L-40 -120 M-46 -132 L-34 -132', c, 7) + S('M14 -132 L20 -120 M4 -138 L28 -140', c, 6) + E(-40, -136, 16, 6, '#8a5a3c');
    s += G('translate(70 -116)', pot('basket', 76, 40, '#e8c08a') + [[-26, -54, '#ff9ec7'], [0, -64, '#ffd36b'], [24, -54, '#c99bff'], [-12, -46, '#fff'], [14, -44, '#ff7eb6']].map(([x, y, col]) => leaf(x as number, (y as number) + 12, 16, 7, (x as number) * 2) + bloom(x as number, y as number, 13, col as string)).join(''));
    s += G('translate(-84 -96)', pot('basket', 52, 30, '#e8c08a') + [[-14, -40, '#ff7eb6'], [10, -44, '#fff3b0']].map(([x, y, col]) => bloom(x as number, y as number, 12, col as string)).join(''));
    return s;
  }),
];

// =====================================================================================
// WALL: pictures, mirrors, clocks, shelves
// =====================================================================================
/** A rectangular picture frame centred on (0, 0) with a mat; returns the frame and inner area. */
function frameRect(w: number, h: number, b: number, col: string, inner: string, mat = '#fffaf3'): string {
  const fr = col.startsWith('url') ? R(-w / 2, -h / 2, w, h, 6, col) : box(-w / 2, -h / 2, w, h, 6, col);
  return R(-w / 2 + 4, -h / 2 + 6, w, h, 6, '#3a1d3f', O(0.12)) + fr + R(-w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, 3, mat) + inner +
    R(-w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, 3, 'none', `stroke="${col.startsWith('url') ? '#d99a1e' : dark(col, 0.15)}" stroke-width="2" ${O(0.5)}`);
}
/** Little sky: sun and clouds by day. */
const cloudG = (x: number, y: number, s: number, col = '#ffffff') => C(x - 12 * s, y, 9 * s, col) + C(x, y - 6 * s, 12 * s, col) + C(x + 13 * s, y, 8 * s, col) + R(x - 20 * s, y, 40 * s, 9 * s, 4.5 * s, col);
const sunG = (x: number, y: number, r: number) => {
  let s = '';
  for (let i = 0; i < 10; i++) s += `<rect x="${f(-r * 0.12)}" y="${f(-r * 1.75)}" width="${f(r * 0.24)}" height="${f(r * 0.5)}" rx="${f(r * 0.12)}" fill="#ffc23d" transform="translate(${f(x)} ${f(y)}) rotate(${i * 36})"/>`;
  return s + C(x, y, r, '#ffd84a') + C(x - r * 0.3, y - r * 0.3, r * 0.3, '#fff', O(0.5));
};
const starsField = (pts: number[][], col = '#fff') => pts.map(([x, y, r], i) => `<path d="${starD(x, y, r ?? 4)}" fill="${col}">${blink(1.6 + (i % 4) * 0.5, i * 0.3, 0.35)}</path>`).join('');
const moonG = (x: number, y: number, r: number, face = true) =>
  P(pd`M${x + r * 0.3} ${y - r} A${r} ${r} 0 1 0 ${x + r} ${y + r * 0.45} A${r * 0.75} ${r * 0.75} 0 1 1 ${x + r * 0.3} ${y - r}Z`, '#ffe680') +
  (face ? C(x - r * 0.15, y + r * 0.1, r * 0.08, INK) + S(pd`M${x - r * 0.45} ${y + r * 0.35} Q${x - r * 0.25} ${y + r * 0.5} ${x - r * 0.05} ${y + r * 0.35}`, INK, r * 0.07) : '');
const glassD = (d: string, tint = '#d9efff') => P(d, tint) + P(d, GLASS);
const mirrorShine = (x: number, y: number, s: number) => S(pd`M${x - 14 * s} ${y + 8 * s} L${x + 8 * s} ${y - 14 * s}`, '#fff', 6 * s, O(0.65)) + S(pd`M${x - 4 * s} ${y + 16 * s} L${x + 14 * s} ${y - 2 * s}`, '#fff', 3 * s, O(0.5));

const ART: FurnDef[] = [
  it('f-art-mountains-woodland', 'Mountain Painting', 'wall', 'Wall Art', 'woodland', 'wall', 170, 130, (c) => frameRect(170, 130, 12, '#a86b4a',
    R(-73, -53, 146, 106, 2, '#cdeaff') + sunG(40, -26, 11) + cloudG(-36, -30, 0.7) + P('M-73 30 L-40 -16 L-22 4 L4 -34 L36 14 L52 -4 L73 22 L73 53 L-73 53Z', '#9aa9d8') +
    P('M-40 -16 L-32 -5 L-40 -2 L-48 -5Z M4 -34 L14 -20 L4 -16 L-6 -20Z', '#fff') + P('M-73 40 Q-20 18 30 34 Q56 26 73 34 L73 53 L-73 53Z', c) +
    [[-56, 40], [-44, 46], [44, 38], [58, 44]].map(([x, y]) => P(pd`M${x} ${y - 22} L${x + 8} ${y} L${x - 8} ${y}Z`, '#3f9a6a')).join(''))),
  it('f-art-sailboat-beach', 'Sailboat Sunset', 'wall', 'Wall Art', 'beach', 'wall', 150, 130, (c) => frameRect(150, 130, 11, '#ffffff',
    R(-64, -54, 128, 108, 2, '#ffd6c2') + R(-64, -54, 128, 40, 2, '#ffc7d6') + C(0, 8, 26, '#ffab5e') + R(-64, 8, 128, 46, 0, c) + [16, 28, 40].map((y, i) => S(pd`M${-50 + i * 6} ${y} Q-40 ${y - 3} -30 ${y} M${10 - i * 4} ${y + 2} Q22 ${y - 1} 34 ${y + 2}`, '#fff', 2, O(0.7))).join('') +
    A(bob(0, -2, 3), P('M-30 18 L10 18 L4 28 L-24 28Z', '#e8573d') + Ln(-12, 18, -12, -30, '#8a5a3c', 2) + P('M-10 -28 L-10 14 L16 14Z', '#fff') + P('M-14 -22 L-14 14 L-32 14Z', '#fff3d6')) +
    S('M30 -34 q4 -4 8 0 q4 -4 8 0', INK, 1.6))),
  it('f-art-kitty-sweet', 'Kitty Portrait', 'wall', 'Wall Art', 'sweet', 'wall', 120, 150, (c) => frameRect(120, 150, 12, c,
    R(-48, -63, 96, 126, 2, '#fff0f6') + P(heartD(-30, -52, 10), light(c, 0.4)) + P(heartD(30, -50, 8), light(c, 0.4)) +
    E(0, 46, 40, 30, '#fff3e6') + P('M-34 -10 L-30 -44 L-10 -24Z M34 -10 L30 -44 L10 -24Z', '#ffcf9e') + P('M-29 -18 L-27 -36 L-16 -26Z M29 -18 L27 -36 L16 -26Z', '#ffb3c7') +
    E(0, 4, 36, 30, '#ffcf9e') + E(0, 4, 36, 30, 'url(#g-face)') + P('M-10 -24 Q0 -14 10 -24 Q0 -30 -10 -24Z', '#ffb46e') + cute(0, 2, 1) + P('M-2 9 L2 9 L0 11Z', '#ff7eb6') +
    S('M-18 10 L-38 6 M-18 14 L-38 16 M18 10 L38 6 M18 14 L38 16', INK, 1.2, O(0.6)) + G('translate(20 -24) scale(0.5)', bowG(0, 0, 1, c)))),
  it('f-art-puppy-cottage', 'Puppy Portrait', 'wall', 'Wall Art', 'cottage', 'wall', 130, 160, (c) =>
    E(4, 6, 65, 80, '#3a1d3f', O(0.12)) + E(0, 0, 65, 80, '#c98a5a') + E(0, 0, 65, 80, SHX) + E(0, 0, 54, 69, c) + E(0, 0, 54, 69, 'url(#p-flowers)', O(0.6)) +
    E(0, 40, 30, 22, '#fff') + E(-30, -2, 13, 28, '#a86b4a', 'transform="rotate(16 -30 -2)"') + E(30, -2, 13, 28, '#a86b4a', 'transform="rotate(-16 30 -2)"') +
    E(0, 4, 28, 26, '#e8b88a') + E(0, 14, 15, 11, '#fff3e6') + E(10, -6, 9, 8, '#a86b4a', O(0.6)) + eyes(0, -2, 10, 3.2) + E(0, 10, 5, 3.5, INK) + S('M-5 16 Q0 20 5 16', INK, 1.6) +
    E(-18, 10, 4, 2.5, '#ff8fb0', O(0.7)) + E(18, 10, 4, 2.5, '#ff8fb0', O(0.7)) + R(-16, 28, 32, 6, 3, '#e8384f') + C(0, 36, 4, GOLD)),
  it('f-art-bunny-princess', 'Royal Bunny', 'wall', 'Wall Art', 'princess', 'wall', 130, 170, (c) => {
    let s = E(4, 6, 62, 82, '#3a1d3f', O(0.12)) + E(0, 0, 62, 82, GOLD);
    for (let i = 0; i < 18; i++) { const [x, y] = polar(0, 0, 1, i * 20); s += C(x * 62, y * 82, 5, '#ffe680'); }
    s += E(0, 0, 50, 70, light(c, 0.3)) + E(0, 0, 50, 70, BIG('hearts'), O(0.5)) + E(0, 50, 30, 18, '#ff9ec7') + E(-11, -28, 8, 22, '#fff') + E(11, -28, 8, 22, '#fff') + E(-11, -26, 4, 15, '#ffc7dc') + E(11, -26, 4, 15, '#ffc7dc') +
      E(0, 10, 25, 23, '#fff') + E(0, 10, 25, 23, 'url(#g-face)') + cute(0, 10, 0.85) + G('translate(0 -52) scale(0.55)', motif('crown', 0, 0, 20));
    return s;
  }),
  it('f-art-abstract-modern', 'Abstract Shapes', 'wall', 'Wall Art', 'modern', 'wall', 130, 170, (c) => frameRect(130, 170, 6, '#2d2a3a',
    R(-59, -79, 118, 158, 0, '#fbf8f3') + C(-14, -30, 30, '#ff9a8a') + P('M-50 70 L-50 10 A40 40 0 0 1 30 10 L30 70Z', '#9aa3b5', O(0.85)) + C(26, -46, 16, '#ffd36b') +
    R(-34, 34, 74, 16, 8, c === '#e6e8f0' ? '#4a4a5e' : c) + S('M-46 -66 Q-30 -76 -14 -66 Q2 -56 18 -66', '#2d2a3a', 2.5) + C(36, 20, 6, '#2d2a3a'), '#fbf8f3')),
  it('f-art-rainbow-rainbow', 'Rainbow Painting', 'wall', 'Wall Art', 'rainbow', 'wall', 170, 130, (c) => frameRect(170, 130, 11, '#ffffff',
    R(-74, -54, 148, 108, 2, '#e8f6ff') + ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff', '#c99bff'].map((col, i) => S(pd`M${-56 + i * 9} 30 A${56 - i * 9} ${56 - i * 9} 0 0 1 ${56 - i * 9} 30`, col, 9)).join('') +
    cloudG(-50, 30, 0.9) + cloudG(50, 30, 0.9) + P(sparkleD(-56, -36, 7), '#ffd36b') + P(sparkleD(58, -30, 5), '#ff9ec7'))),
  it('f-art-castle-candy', 'Castle Painting', 'wall', 'Wall Art', 'candy', 'wall', 140, 160, (c) => frameRect(140, 160, 11, c,
    R(-59, -69, 118, 138, 2, '#e6d4ff') + cloudG(-30, -48, 0.6) + cloudG(34, -30, 0.5) + P('M-59 50 Q0 30 59 50 L59 69 L-59 69Z', '#a8e6cf') +
    R(-30, -6, 60, 58, 2, '#ffd9e8') + R(-44, -26, 20, 78, 2, '#ffc2dc') + R(24, -26, 20, 78, 2, '#ffc2dc') + R(-10, -34, 20, 30, 2, '#ffc2dc') +
    P('M-48 -26 L-34 -50 L-20 -26Z M20 -26 L34 -50 L48 -26Z M-14 -34 L0 -62 L14 -34Z', '#c99bff') + P('M0 -62 L0 -74 L12 -70 L0 -66', '#ff4f8b') +
    P('M-10 52 L-10 34 A10 10 0 0 1 10 34 L10 52Z', '#a86b4a') + P(heartD(-34, -12, 6), '#fff') + P(heartD(34, -12, 6), '#fff') + C(0, 10, 5, '#fff'))),
  it('f-art-moon-space', 'Moon Painting', 'wall', 'Wall Art', 'space', 'wall', 150, 150, (c) =>
    C(4, 6, 72, '#3a1d3f', O(0.12)) + C(0, 0, 72, GOLD) + C(0, 0, 62, c) + C(0, 0, 62, 'url(#g-face)') + moonG(-6, 0, 30) +
    starsField([[-36, -34, 5], [34, -30, 6], [40, 22, 4], [-30, 36, 4], [12, -46, 3], [20, 42, 3]]) + cloudG(26, 34, 0.55, '#c9b3ff')),
  it('f-art-stilllife-boho', 'Flower Still Life', 'wall', 'Wall Art', 'boho', 'wall', 130, 160, (c) =>
    P('M-61 86 L-61 -9 A65 65 0 0 1 69 -9 L69 86Z', '#3a1d3f', O(0.12)) + P('M-65 80 L-65 -15 A65 65 0 0 1 65 -15 L65 80Z', '#c98a5a') + P('M-55 70 L-55 -15 A55 55 0 0 1 55 -15 L55 70Z', c) +
    R(-55, 40, 110, 30, 0, '#e8907a', O(0.6)) + P('M-16 56 Q-26 30 -10 16 L10 16 Q26 30 16 56Z', '#fff3e6') + S('M-10 30 Q0 36 10 30', '#e8907a', 2) +
    [[-24, -20, '#fff'], [0, -36, '#e8907a'], [22, -18, '#ffd36b'], [-8, -8, '#ff9ec7'], [14, -2, '#fff']].map(([x, y, col]) => stem(0, 16, x as number, y as number) + bloom(x as number, y as number, 12, col as string)).join('') +
    leaf(-4, 12, 30, 8, -60, '#8fbf6a') + leaf(4, 12, 30, 8, 60, '#8fbf6a')),
  it('f-art-balloons-retro', 'Balloon Painting', 'wall', 'Wall Art', 'retro', 'wall', 130, 160, (c) => frameRect(130, 160, 11, '#e8b46a',
    R(-54, -69, 108, 138, 2, '#d8f3ec') + cloudG(-26, 40, 0.7) + cloudG(30, 10, 0.5) +
    [[-14, -24, 1, c], [26, -44, 0.6, '#5fd3b5'], [-34, 22, 0.45, '#ffd36b']].map(([x, y, k, col], i) => A(bob(0, -5, 3 + i, i), G(at(x as number, y as number, k as number),
      P('M-30 0 A30 32 0 1 1 30 0 Q24 18 8 30 L-8 30 Q-24 18 -30 0Z', col as string) + P('M-10 -30 Q-18 0 -8 30 L8 30 Q18 0 10 -30Z', '#fff', O(0.5)) + P('M-30 0 A30 32 0 1 1 30 0 Q24 18 8 30 L-8 30 Q-24 18 -30 0Z', SHX) +
      S('M-8 30 L-7 44 M8 30 L7 44', INK, 1.4) + box(-9, 42, 18, 12, 3, '#a86b4a')))).join(''))),
  it('f-art-trio-sweet', 'Gallery Trio', 'wall', 'Wall Art', 'sweet', 'wall', 220, 120, (c) =>
    G('translate(-74 6)', frameRect(64, 80, 7, GOLD, P(heartD(0, -18, 20), c) + P(heartD(-6, -12, 5), '#fff', O(0.5)))) +
    G('translate(0 -8)', frameRect(70, 96, 7, '#ffffff', R(-28, -41, 56, 82, 2, light(c, 0.55)) + P(starD(0, 0, 22), '#ffd36b') + C(-6, -5, 4, '#fff', O(0.6)))) +
    G('translate(76 10)', frameRect(64, 64, 7, c, daisy(0, 0, 20, '#fff', '#ffd24a')))),
];

const MIRRORS: FurnDef[] = [
  it('f-mirror-arch-cottage', 'Arched Mirror', 'wall', 'Mirrors', 'cottage', 'wall', 130, 200, (c) =>
    P('M-65 100 L-65 -35 A65 65 0 0 1 65 -35 L65 100Z', c) + P('M-65 100 L-65 -35 A65 65 0 0 1 65 -35 L65 100Z', SHX) + glassD('M-52 88 L-52 -35 A52 52 0 0 1 52 -35 L52 88Z') +
    mirrorShine(-14, -24, 1.4) + flowerG(-50, -72, 12, '#ff9ec7') + flowerG(50, -72, 10, '#fff') + flowerG(-62, 70, 10, '#ffd36b') + leaf(-56, -62, 22, 8, -40) + leaf(44, -64, 22, 8, 40)),
  it('f-mirror-ornate-princess', 'Royal Mirror', 'wall', 'Mirrors', 'princess', 'wall', 150, 200, (c) => {
    let s = E(0, 4, 66, 90, GOLD);
    for (let i = 0; i < 20; i++) { const [x, y] = polar(0, 4, 1, i * 18); s += C(x * 68, 4 + y * 92, 6, '#ffe680'); }
    s += E(0, 4, 56, 80, c) + glassD(pd`M0 -66 A50 72 0 1 1 -0.1 -66Z`) + mirrorShine(-14, -10, 1.6);
    return s + G('translate(0 -92) scale(1.1)', motif('crown', 0, 0, 20)) + P(heartD(0, 86, 12), '#ff7eb6');
  }),
  it('f-mirror-sunburst-boho', 'Sunburst Mirror', 'wall', 'Mirrors', 'boho', 'wall', 200, 200, (c) => {
    let s = '';
    for (let i = 0; i < 24; i++) {
      const [x1, y1] = polar(0, 0, 50, i * 15);
      const [x2, y2] = polar(0, 0, i % 2 ? 84 : 98, i * 15);
      s += Ln(x1, y1, x2, y2, i % 2 ? '#e8907a' : '#c9a27e', i % 2 ? 6 : 8) + C(x2, y2, i % 2 ? 4 : 6, i % 2 ? c : '#e8907a');
    }
    return s + C(0, 0, 54, '#c98a5a') + C(0, 0, 46, '#d9efff') + C(0, 0, 46, GLASS) + mirrorShine(-10, -8, 1.1);
  }),
  it('f-mirror-cloud-sweet', 'Cloud Mirror', 'wall', 'Mirrors', 'sweet', 'wall', 190, 130, (c) => {
    const shape = (k: number, col: string) => G(`translate(0 8) scale(${k})`, C(-50, 4, 40, col) + C(-6, -24, 50, col) + C(46, -4, 42, col) + R(-84, -4, 168, 46, 23, col));
    return shape(1.08, c) + shape(1.08, 'url(#g-face)') + shape(0.92, '#d9efff') + shape(0.92, GLASS) + mirrorShine(-10, -14, 1.2) + P(heartD(62, -40, 10), '#fff') + P(sparkleD(-70, -26, 8), '#fff');
  }),
  it('f-mirror-heart-candy', 'Heart Mirror', 'wall', 'Mirrors', 'candy', 'wall', 170, 160, (c) => {
    const hd = heartD(0, -64, 150);
    const gd = heartD(0, -48, 118);
    return P(hd, c) + P(hd, SHX) + P(hd, 'none', 'stroke="#fff" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity="0.9"') + glassD(gd) + mirrorShine(-34, -26, 1.3) +
      P(sparkleD(70, -60, 9), '#fff') + P(sparkleD(-66, 30, 6), '#fff');
  }),
  it('f-mirror-bulbs-retro', 'Star Mirror', 'wall', 'Mirrors', 'retro', 'wall', 170, 210, (c, on) => {
    let s = box(-85, -105, 170, 210, 18, c) + R(-64, -84, 128, 168, 10, '#d9efff') + R(-64, -84, 128, 168, 10, GLASS) + mirrorShine(-20, -30, 1.5);
    const bulbs = [[-74, -70], [-74, -24], [-74, 22], [-74, 68], [74, -70], [74, -24], [74, 22], [74, 68], [-36, -94], [0, -94], [36, -94]];
    bulbs.forEach(([x, y], i) => (s += (on ? halo(x, y, 16, '#fff6c8', 1.4, i * 0.2) : '') + C(x, y, 8, on ? '#fff6c8' : '#fff3d6') + C(x - 2, y - 2, 2.5, '#fff')));
    return s;
  }, { toggle: true }),
  it('f-mirror-porthole-beach', 'Rope Mirror', 'wall', 'Mirrors', 'beach', 'wall', 150, 170, (c) => {
    let s = S('M-30 -66 Q0 -96 30 -66', '#c9a27e', 5) + C(0, -88, 5, '#9aa3b5');
    s += C(0, 10, 70, '#e8c88a') + C(0, 10, 70, 'none', 'stroke="#c9a27e" stroke-width="3" stroke-dasharray="6 5"') + C(0, 10, 58, c) + C(0, 10, 50, '#d9efff') + C(0, 10, 50, GLASS) + mirrorShine(-10, 0, 1.2);
    return s + G('translate(48 58) scale(0.9)', P(starD(0, 0, 16, 0.55), '#ffab5e') + C(-3, -3, 3, '#fff', O(0.6))) + G('translate(-50 60) scale(0.5)', motif('fish', 0, 0, 20));
  }),
  it('f-mirror-wavy-modern', 'Wavy Mirror', 'wall', 'Mirrors', 'modern', 'wall', 130, 220, (c) => {
    const d = (k: number) => pd`M${-50 * k} ${-100 * k} Q${-30 * k} ${-112 * k} ${-6 * k} ${-100 * k} Q${20 * k} ${-88 * k} ${46 * k} ${-102 * k} Q${66 * k} -50 ${54 * k} 0 Q${44 * k} ${50 * k} ${60 * k} ${96 * k} Q${30 * k} ${112 * k} 0 ${102 * k} Q${-30 * k} ${92 * k} ${-58 * k} ${104 * k} Q${-66 * k} ${50 * k} ${-54 * k} 0 Q${-44 * k} ${-50 * k} ${-50 * k} ${-100 * k}Z`;
    return P(d(1.06), c) + P(d(1.06), SHX) + glassD(d(0.92)) + mirrorShine(-10, -30, 1.4);
  }),
];

// ---- clocks ----
/** Clock hands: the minute hand turns once a minute. */
const hands = (x: number, y: number, r: number, col = INK) =>
  A(spin(x, y, 60), Ln(x, y, x, y - r * 0.78, col, Math.max(2, r * 0.07))) + Ln(x, y, x + r * 0.42, y + r * 0.2, col, Math.max(3, r * 0.1)) + C(x, y, Math.max(3, r * 0.09), col);
const ticks = (x: number, y: number, r: number, col: string, big = 2.5) => Array.from({ length: 12 }, (_, i) => { const [px, py] = polar(x, y, r, i * 30); return C(px, py, i % 3 ? big * 0.7 : big, col); }).join('');
const CLOCKS: FurnDef[] = [
  it('f-clock-cuckoo-woodland', 'Cuckoo Clock', 'wall', 'Clocks', 'woodland', 'wall', 150, 260, (c) => {
    let s = A(rock(14, 0, 40, 1.6), Ln(0, 40, 0, 104, '#c98a5a', 3) + C(0, 108, 11, GOLD));
    s += Ln(-26, 40, -26, 92, '#9aa3b5', 1.5) + Ln(26, 40, 26, 112, '#9aa3b5', 1.5) + E(-26, 102, 7, 12, '#8a5a3c') + E(26, 122, 7, 12, '#8a5a3c');
    s += box(-56, -60, 112, 104, 8, '#a86b4a') + P('M-72 -54 L0 -118 L72 -54 L60 -48 L0 -102 L-60 -48Z', c) + P('M-72 -54 L0 -118 L72 -54 L60 -48 L0 -102 L-60 -48Z', SHX);
    s += leaf(-40, -84, 24, 9, -60, '#5fae6b') + leaf(40, -84, 24, 9, 60, '#5fae6b') + R(-14, -92, 28, 26, 13, '#5a3a2a');
    s += G('translate(0 -76)', `<g><animateTransform attributeName="transform" type="scale" values="0;0;1;1;0;0" keyTimes="0;0.55;0.62;0.8;0.86;1" dur="6s" repeatCount="indefinite"/>${E(0, 0, 12, 9, '#ffd36b')}${C(6, -6, 7, '#ffd36b')}${P('M12 -6 L20 -4 L12 -2Z', '#ff8a3d')}${C(8, -8, 1.6, INK)}${E(-6, 0, 6, 4, '#ffab5e')}</g>`);
    s += C(0, -10, 34, '#fff3e6') + ticks(0, -10, 27, '#a86b4a', 2.5) + hands(0, -10, 30) + S('M-56 36 Q-28 46 0 36 Q28 46 56 36', '#c98a5a', 5);
    return s;
  }),
  it('f-clock-sunburst-boho', 'Sunburst Clock', 'wall', 'Clocks', 'boho', 'wall', 170, 170, (c) => {
    let s = '';
    for (let i = 0; i < 12; i++) { const [x, y] = polar(0, 0, 70, i * 30); const [x2, y2] = polar(0, 0, 44, i * 30); s += Ln(x2, y2, x, y, '#c9a27e', 4) + C(x, y, 9, i % 2 ? c : '#e8907a') + C(x - 2, y - 2, 3, '#fff', O(0.5)); }
    return s + C(0, 0, 46, GOLD) + C(0, 0, 40, '#fffaf0') + ticks(0, 0, 33, '#c98a5a', 2.6) + hands(0, 0, 36, '#8a5a3c');
  }),
  it('f-clock-cat-retro', 'Kitty Clock', 'wall', 'Clocks', 'retro', 'wall', 120, 280, (c) => {
    let s = A(rock(22, 0, 80, 1.2), S('M0 80 Q-6 110 6 130 Q16 146 4 158', '#2d2a3a', 10));
    s += P('M-40 -80 L-34 -126 L-10 -100Z M40 -80 L34 -126 L10 -100Z', '#2d2a3a') + P('M-34 -92 L-31 -114 L-18 -100Z M34 -92 L31 -114 L18 -100Z', '#ff9ec7');
    s += E(0, -76, 44, 38, '#2d2a3a') + box(-36, -44, 72, 130, 30, '#2d2a3a') + E(-15, -82, 11, 12, '#fff') + E(15, -82, 11, 12, '#fff');
    s += `<g><animateTransform attributeName="transform" type="translate" values="-4 0;4 0;-4 0" dur="1.2s" repeatCount="indefinite" ${SPL}/>${C(-15, -80, 5, INK)}${C(15, -80, 5, INK)}</g>`;
    s += P('M-4 -66 L4 -66 L0 -62Z', '#ff9ec7') + S('M-12 -58 Q0 -50 12 -58', '#fff', 2.5) + R(-30, -48, 60, 8, 4, c) + G('translate(0 -40) scale(0.5)', bowG(0, 0, 1, c));
    s += C(0, 10, 26, '#fff') + ticks(0, 10, 20, c, 2) + hands(0, 10, 22) + P('M-36 60 Q-50 30 -40 0 L-34 0 Q-42 30 -30 60Z M36 60 Q50 30 40 0 L34 0 Q42 30 30 60Z', '#3d3a52');
    return s;
  }),
  it('f-clock-star-space', 'Star Clock', 'wall', 'Clocks', 'space', 'wall', 160, 160, (c) =>
    P(starD(0, 4, 80, 0.62), '#ffe680') + P(starD(0, 4, 80, 0.62), SHX) + C(0, 6, 40, c) + C(0, 6, 40, 'url(#g-face)') + ticks(0, 6, 32, '#ffe680', 2.4) + hands(0, 6, 34, '#ffe680') +
    A(spin(0, 6, 20), C(0, -38, 5, '#7cc8ff') + C(0, 50, 4, '#ff9ec7'))),
  it('f-clock-flower-cottage', 'Daisy Clock', 'wall', 'Clocks', 'cottage', 'wall', 170, 170, (c) => {
    let s = '';
    for (let i = 0; i < 10; i++) s += E(0, -56, 18, 30, i % 2 ? '#fff' : light(c, 0.4), `transform="rotate(${i * 36})"`);
    return s + C(0, 0, 46, '#ffd24a') + C(0, 0, 40, '#fff8e0') + ticks(0, 0, 32, '#ffab3d', 2.6) + hands(0, 0, 34, '#8a5a3c') + leaf(30, 60, 30, 10, 140, LEAF);
  }),
  it('f-clock-donut-candy', 'Donut Clock', 'wall', 'Clocks', 'candy', 'wall', 150, 150, (c) => {
    let s = C(0, 0, 70, '#e8b46a') + P('M-64 -6 Q-62 -64 0 -66 Q62 -64 64 -6 Q58 12 46 2 Q40 22 26 10 Q14 28 0 14 Q-14 28 -26 10 Q-40 22 -46 2 Q-58 12 -64 -6Z', c) + C(0, 0, 70, 'url(#g-face)');
    const sp = ['#fff', '#7cc8ff', '#ffd36b', '#a8e6cf', '#fff'];
    for (let i = 0; i < 14; i++) { const [x, y] = polar(0, -6, 52, 190 + i * 12); s += R(x - 4, y - 1.5, 8, 3, 1.5, sp[i % 5], `transform="rotate(${i * 47} ${f(x)} ${f(y)})"`); }
    return s + C(0, 0, 32, '#fffaf0') + ticks(0, 0, 25, c, 2) + hands(0, 0, 26);
  }),
];

// ---- wall shelves (props can rest on them) ----
const bracket = (x: number, y: number, col: string) => P(pd`M${x - 4} ${y} L${x + 4} ${y} L${x + 4} ${y + 24} Q${x} ${y + 18} ${x - 4} ${y + 6}Z`, col);
const SHELVES: FurnDef[] = [
  it('f-shelf-cloud-sweet', 'Cloud Shelf', 'wall', 'Wall Shelves', 'sweet', 'wall', 220, 110, (c) =>
    C(-56, 6, 34, '#fff') + C(-10, -16, 44, '#fff') + C(44, -2, 36, '#fff') + C(80, 18, 22, '#fff') + R(-100, 4, 200, 40, 20, '#fff') + C(-10, -16, 44, 'url(#g-face)') +
    box(-104, 36, 208, 14, 7, c) + R(-104, 36, 208, 5, 3, '#fff', O(0.5)) + cute(-8, 6, 0.9) + P(heartD(60, -10, 9), light(c, 0.2)),
  { surfaces: [{ x1: -100, x2: 100, y: 36 }] }),
  it('f-shelf-house-cottage', 'House Shelf', 'wall', 'Wall Shelves', 'cottage', 'wall', 170, 220, (c) => {
    const roof = 'M-80 -40 L0 -110 L80 -40';
    return S(roof, '#ffffff', 12) + S(roof, c, 6) + R(-76, -44, 12, 154, 5, '#fff') + R(64, -44, 12, 154, 5, '#fff') + R(-66, -40, 132, 146, 2, light(c, 0.55)) + R(-66, -40, 132, 146, 2, BIG('flowers'), O(0.5)) +
      box(-76, 28, 152, 12, 5, '#fff') + box(-80, 100, 160, 14, 6, '#fff') + C(0, -60, 10, '#fff8e0') + C(0, -60, 10, 'none', 'stroke="#fff" stroke-width="3"') + S('M-10 -60 L10 -60 M0 -70 L0 -50', '#fff', 2);
  }, { surfaces: [{ x1: -64, x2: 64, y: 28 }, { x1: -64, x2: 64, y: 100 }] }),
  it('f-shelf-honeycomb-woodland', 'Honeycomb Shelves', 'wall', 'Wall Shelves', 'woodland', 'wall', 240, 170, (c) => {
    const hex = (x: number, y: number, r: number) => { let d = ''; for (let i = 0; i < 6; i++) { const [px, py] = polar(x, y, r, i * 60); d += `${i ? 'L' : 'M'}${f(px)} ${f(py)}`; } return d + 'Z'; };
    let s = '';
    for (const [x, y] of [[-64, -36], [64, -36], [0, 38]]) s += P(hex(x, y, 52), '#c98a5a') + P(hex(x, y, 52), SHX) + P(hex(x, y, 42), dark(c, 0.15)) + P(hex(x, y, 42), BIG('check'), O(0.35)) + R(x - 26, y + 30, 52, 8, 3, '#a86b4a');
    return s + G('translate(-90 -10) scale(0.6)', motif('leaf', 0, 0, 20)) + G('translate(64 -36)', A(bob(0, -4, 2), E(0, 0, 9, 7, '#ffd24a') + S('M-4 -6 L-4 6 M2 -6 L2 6', INK, 2) + E(-3, -9, 6, 4, '#fff', O(0.8)) + E(5, -9, 6, 4, '#fff', O(0.8))));
  }, { surfaces: [{ x1: -90, x2: -38, y: -4 }, { x1: 38, x2: 90, y: -4 }, { x1: -26, x2: 26, y: 70 }] }),
  it('f-shelf-rainbow-rainbow', 'Rainbow Shelf', 'wall', 'Wall Shelves', 'rainbow', 'wall', 220, 130, (c) =>
    ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff'].map((col, i) => S(pd`M${-96 + i * 14} 44 A${96 - i * 14} ${96 - i * 14} 0 0 1 ${96 - i * 14} 44`, col, 13)).join('') + S('M-96 44 A96 96 0 0 1 96 44', '#fff', 2, O(0.5)) +
    box(-108, 44, 216, 14, 7, '#ffffff') + cloudG(-86, 40, 0.8) + cloudG(88, 40, 0.8),
  { surfaces: [{ x1: -104, x2: 104, y: 44 }, { x1: -30, x2: 30, y: -48 }] }),
  it('f-shelf-scallop-princess', 'Lace Shelf', 'wall', 'Wall Shelves', 'princess', 'wall', 220, 70, (c) => {
    let s = bracket(-80, -6, GOLD) + bracket(80, -6, GOLD) + box(-110, -16, 220, 16, 6, '#ffffff');
    for (let i = 0; i < 11; i++) s += C(-100 + i * 20, 2, 10, c) + C(-100 + i * 20, 2, 4, '#fff', O(0.7));
    return s + R(-110, -16, 220, 4, 2, GOLD) + G('translate(0 26) scale(0.5)', motif('crown', 0, 0, 20));
  }, { surfaces: [{ x1: -110, x2: 110, y: -16 }] }),
];

// ---- windows (tap for night) ----
const skyFill = (d: string, on: boolean) => P(d, on ? NIGHT : SKY) + P(d, SHY, O(0.6));
/** What you see through a window or open door, laid out in the box (x, y, w, h). */
function view(x: number, y: number, w: number, h: number, on: boolean, kind: 'hills' | 'sea' | 'none' = 'hills'): string {
  let s = '';
  if (on) s += moonG(x + w * 0.72, y + h * 0.22, Math.min(w, h) * 0.1) + starsField([[x + w * 0.2, y + h * 0.18, 4], [x + w * 0.42, y + h * 0.1, 3], [x + w * 0.3, y + h * 0.4, 3], [x + w * 0.88, y + h * 0.46, 3.5], [x + w * 0.55, y + h * 0.32, 2.5]]);
  else s += sunG(x + w * 0.74, y + h * 0.2, Math.min(w, h) * 0.08) + A(bob(8, 0, 7), cloudG(x + w * 0.3, y + h * 0.26, Math.min(w, h) / 160)) + cloudG(x + w * 0.62, y + h * 0.48, Math.min(w, h) / 260, '#f4fbff');
  if (kind === 'hills') {
    s += P(pd`M${x} ${y + h} L${x} ${y + h * 0.72} Q${x + w * 0.3} ${y + h * 0.58} ${x + w * 0.58} ${y + h * 0.72} Q${x + w * 0.82} ${y + h * 0.62} ${x + w} ${y + h * 0.68} L${x + w} ${y + h}Z`, on ? '#4f8f8a' : GRASS) +
      P(pd`M${x} ${y + h} L${x} ${y + h * 0.86} Q${x + w * 0.5} ${y + h * 0.76} ${x + w} ${y + h * 0.88} L${x + w} ${y + h}Z`, on ? '#3f7a76' : '#6fc47c') +
      R(x + w * 0.2 - 3, y + h * 0.6, 6, h * 0.14, 3, BARK) + C(x + w * 0.2, y + h * 0.58, Math.min(w, h) * 0.08, on ? '#3f7a66' : '#4fb47a');
  }
  if (kind === 'sea') s += R(x, y + h * 0.62, w, h * 0.38, 0, on ? '#3f5f9a' : '#7cc8ff') + [0.72, 0.84].map((k, i) => S(pd`M${x + w * 0.15 + i * 20} ${y + h * k} q10 -5 20 0 q10 5 20 0`, '#fff', 2.5, O(0.6))).join('');
  return s;
}
const WINDOWS: FurnDef[] = [
  it('f-window-arched-cottage', 'Arched Window', 'wall', 'Windows', 'cottage', 'wall', 240, 270, (c, on) => {
    const inner = 'M-92 104 L-92 -24 A92 92 0 0 1 92 -24 L92 104Z';
    let s = P('M-110 112 L-110 -24 A110 110 0 0 1 110 -24 L110 112Z', c) + P('M-110 112 L-110 -24 A110 110 0 0 1 110 -24 L110 112Z', SHX) + skyFill(inner, on) + view(-92, -60, 184, 164, on);
    s += P(inner, GLASS) + S('M0 -116 L0 104 M-92 -24 L92 -24 M-92 44 L92 44', '#fff', 7) + P(inner, 'none', 'stroke="#fff" stroke-width="5"');
    s += [-84, -56, -28, 0, 28, 56, 84].map((x, i) => leaf(x, 112, 22, 8, (i - 3) * 16) + bloom(x + 4, 100 - (i % 2) * 8, 11, PASTELS[i % 6])).join('');
    return s + box(-120, 108, 240, 26, 8, '#c98a5a') + R(-120, 108, 240, 6, 3, '#fff', O(0.3));
  }, { toggle: true }),
  it('f-window-round-beach', 'Porthole Window', 'wall', 'Windows', 'beach', 'wall', 230, 230, (c, on) => {
    let s = C(0, 0, 112, '#e8c88a') + C(0, 0, 112, 'none', 'stroke="#c9a27e" stroke-width="4" stroke-dasharray="7 6"') + C(0, 0, 98, c) + C(0, 0, 98, 'url(#g-face)') + C(0, 0, 82, on ? NIGHT : SKY);
    s += view(-58, -62, 116, 100, on, 'none') + P(pd`M-78 26 A82 82 0 0 0 78 26Z`, on ? '#3f5f9a' : '#7cc8ff') + S('M-50 44 q10 -5 20 0 q10 5 20 0 M10 58 q10 -5 20 0 q10 5 20 0', '#fff', 2.5, O(0.6));
    s += A(bob(-6, 0, 5), P('M-20 24 L14 24 L8 32 L-14 32Z', '#e8573d') + Ln(-4, 24, -4, -8, '#8a5a3c', 2) + P('M-2 -6 L-2 20 L16 20Z', '#fff')) + (on ? '' : S('M30 -30 q5 -5 10 0 q5 -5 10 0', INK, 1.8));
    for (let i = 0; i < 8; i++) { const [x, y] = polar(0, 0, 90, i * 45 + 22); s += C(x, y, 4, '#c9cfdd'); }
    return s + C(0, 0, 82, GLASS);
  }, { toggle: true }),
  it('f-window-curtain-sweet', 'Curtain Window', 'wall', 'Windows', 'sweet', 'wall', 260, 270, (c, on) => {
    let s = box(-100, -110, 200, 220, 8, '#ffffff') + skyFill('M-86 -96 L86 -96 L86 96 L-86 96Z', on) + view(-86, -96, 172, 192, on) + R(-86, -96, 172, 192, 0, GLASS) + S('M0 -96 L0 96 M-86 0 L86 0', '#fff', 7);
    s += cloth('M-128 -112 L-60 -112 Q-56 -30 -86 20 Q-70 90 -96 132 L-128 132Z', c, 'dots') + cloth('M128 -112 L60 -112 Q56 -30 86 20 Q70 90 96 132 L128 132Z', c, 'dots');
    s += R(-110, 14, 30, 10, 5, '#fff') + R(80, 14, 30, 10, 5, '#fff') + box(-110, 108, 220, 16, 6, '#fff');
    let v = 'M-130 -132 L130 -132 L130 -100';
    for (let i = 0; i < 8; i++) v += ` Q${f(130 - i * 32.5 - 16.25)} -78 ${f(130 - (i + 1) * 32.5)} -100`;
    return s + cloth(v + 'Z', light(c, 0.2), 'none', 'y') + R(-136, -138, 272, 10, 5, GOLD) + P(heartD(0, -128, 16), '#fff');
  }, { toggle: true }),
  it('f-window-bay-boho', 'Bay Window', 'wall', 'Windows', 'boho', 'wall', 330, 280, (c, on) => {
    let s = box(-165, -130, 330, 236, 6, '#fff3e6');
    const panes: [string, number, number, number][] = [['M-150 -110 L-82 -116 L-82 96 L-150 90Z', -150, -116, 68], ['M-70 -118 L70 -118 L70 98 L-70 98Z', -70, -118, 140], ['M82 -116 L150 -110 L150 90 L82 96Z', 82, -116, 68]];
    for (const [d, x, y, w] of panes) s += skyFill(d, on) + view(x, y, w, 214, on) + P(d, GLASS) + P(d, 'none', `stroke="${c === '#f4dca0' ? '#c98a5a' : dark(c, 0.3)}" stroke-width="6"`);
    s += S('M0 -118 L0 98 M-70 -10 L70 -10', '#c98a5a', 5) + box(-170, 96, 340, 22, 6, '#c98a5a') + box(-160, 70, 320, 34, 14, c, 'none', 'y');
    for (const [x, col] of [[-110, '#e8907a'], [-40, '#fff3e6'], [40, '#8fbf6a'], [110, '#e8907a']] as const) s += box(x - 26, 40, 52, 40, 14, col) + C(x, 60, 4, dark(col, 0.2));
    return s + S('M-160 -130 Q-80 -96 0 -130 Q80 -96 160 -130', '#e8907a', 5) + [-120, -40, 40, 120].map((x) => C(x, -116, 6, '#fff3e6')).join('');
  }, { toggle: true }),
  it('f-window-gothic-princess', 'Palace Window', 'wall', 'Windows', 'princess', 'wall', 210, 280, (c, on) => {
    const outer = 'M-100 130 L-100 -30 Q-100 -110 0 -140 Q100 -110 100 -30 L100 130Z';
    const inner = 'M-84 116 L-84 -30 Q-84 -96 0 -122 Q84 -96 84 -30 L84 116Z';
    let s = P(outer, GOLD) + skyFill(inner, on) + view(-84, -70, 168, 186, on) + P(inner, GLASS);
    s += R(-84, -4, 168, 120, 0, 'url(#p-check)', O(0.25));
    s += S('M0 -122 L0 116 M-84 -4 L84 -4', '#ffe680', 6) + P(inner, 'none', 'stroke="#ffffff" stroke-width="4"') + P(heartD(0, -82, 26), c) + P(heartD(0, -82, 26), 'none', 'stroke="#ffe680" stroke-width="3"');
    return s + box(-112, 118, 224, 22, 8, c) + G('translate(0 -150) scale(0.9)', motif('crown', 0, 0, 20));
  }, { toggle: true }),
  it('f-window-space-space', 'Rocket Window', 'wall', 'Windows', 'space', 'wall', 230, 230, (c, on) => {
    let s = C(0, 0, 112, '#c9cfdd') + C(0, 0, 112, 'url(#g-face)') + C(0, 0, 96, c) + C(0, 0, 84, '#2d2a5a');
    s += starsField([[-50, -40, 4], [40, -56, 3], [56, 20, 4], [-30, 40, 3], [10, -20, 2.5], [-60, 10, 3], [30, 56, 2.5]]) + C(-34, 30, 20, '#ff9ec7') + E(-34, 30, 34, 8, 'none', 'stroke="#ffd24a" stroke-width="3" transform="rotate(-15 -34 30)"') + C(36, -24, 14, '#7fe0b0') + C(32, -28, 4, '#fff', O(0.5));
    if (on) s += `<g><animateTransform attributeName="transform" type="translate" values="-70 50;70 -50" dur="3s" repeatCount="indefinite"/>${G('rotate(55)', P('M0 -18 C8 -10 8 6 5 12 L-5 12 C-8 6 -8 -10 0 -18Z', '#fff') + C(0, -4, 3.5, '#7cc8ff') + P('M-3 12 Q0 22 3 12Z', '#ffb83a'))}</g>`;
    else s += A(bob(0, -6, 3), G('translate(-6 -2)', P(sparkleD(0, 0, 10), '#ffe680')));
    for (let i = 0; i < 10; i++) { const [x, y] = polar(0, 0, 104, i * 36); s += C(x, y, 4, '#9aa3b5'); }
    return s + C(0, 0, 84, GLASS);
  }, { toggle: true }),
  it('f-window-grid-modern', 'Tall Window', 'wall', 'Windows', 'modern', 'wall', 200, 300, (c, on) => {
    const frameC = c === '#e6e8f0' ? '#2d2a3a' : dark(c, 0.3);
    let s = R(-92, -144, 184, 288, 4, frameC) + skyFill('M-84 -136 L84 -136 L84 132 L-84 132Z', on) + view(-84, -136, 168, 268, on) + R(-84, -136, 168, 268, 0, GLASS);
    s += S('M-28 -136 L-28 132 M28 -136 L28 132 M-84 -46 L84 -46 M-84 44 L84 44', frameC, 5) + R(-100, 132, 200, 14, 3, c) + R(-100, 132, 200, 14, 3, SHY);
    return s + G('translate(54 132)', pot('cyl', 30, 28, '#fff') + leaf(0, -26, 34, 10, -20, LEAF) + leaf(0, -26, 28, 9, 30, LEAF_D));
  }, { toggle: true }),
  it('f-window-shutter-woodland', 'Shutter Window', 'wall', 'Windows', 'woodland', 'wall', 280, 240, (c, on) => {
    let s = box(-80, -100, 160, 190, 6, '#f4ead9') + skyFill('M-68 -88 L68 -88 L68 78 L-68 78Z', on) + view(-68, -88, 136, 166, on) + R(-68, -88, 136, 166, 0, GLASS) + S('M0 -88 L0 78 M-68 -6 L68 -6', '#f4ead9', 6);
    for (const sd of [-1, 1]) {
      const x = sd < 0 ? -140 : 84;
      s += box(x, -100, 56, 190, 6, c);
      for (let k = 0; k < 7; k++) s += R(x + 8, -84 + k * 18, 40, 8, 3, dark(c, 0.12));
      s += P(heartD(x + 28, 44, 14), dark(c, 0.35)) + C(sd < 0 ? x + 52 : x + 4, -8, 3, '#6b4a3a');
    }
    s += box(-96, 84, 192, 36, 8, '#a86b4a') + R(-96, 84, 192, 8, 4, '#fff', O(0.2));
    return s + [-70, -40, -10, 20, 50, 74].map((x, i) => leaf(x, 86, 26, 9, -20 + i * 8, i % 2 ? LEAF : LEAF_D) + (i % 2 ? bloom(x + 2, 68, 9, '#fff') : '')).join('');
  }, { toggle: true }),
];

// ---- decorative doors (tap to open) ----
/** The garden you see through an open door. */
function outside(d: string, x: number, y: number, w: number, h: number): string {
  return skyFill(d, false) + view(x, y, w, h * 0.7, false, 'none') + R(x, y + h * 0.62, w, h * 0.38, 0, GRASS) + P(pd`M${x + w * 0.38} ${y + h} L${x + w * 0.46} ${y + h * 0.62} L${x + w * 0.54} ${y + h * 0.62} L${x + w * 0.62} ${y + h}Z`, '#f4dca0') +
    R(x + w * 0.15 - 4, y + h * 0.46, 8, h * 0.18, 3, BARK) + C(x + w * 0.15, y + h * 0.44, w * 0.12, '#4fb47a') + flowerG(x + w * 0.8, y + h * 0.75, 10, '#ff9ec7') + flowerG(x + w * 0.9, y + h * 0.85, 8, '#ffd36b');
}
/** A door swung open toward the room, hinged on the left. */
const swung = (x: number, top: number, bot: number, c: string, pat = 'none', knob: string = GOLD) =>
  cloth(pd`M${x} ${top} L${x - 40} ${top - 14} L${x - 40} ${bot + 16} L${x} ${bot}Z`, dark(c, 0.06), pat) + C(x - 30, (top + bot) / 2 + 10, 5, knob);
const DOORS: FurnDef[] = [
  it('f-door-front-sweet', 'Front Door', 'wall', 'Doors', 'sweet', 'wall', 220, 340, (c, on) => {
    let s = box(-100, -170, 200, 340, 6, '#ffffff') + R(-84, -154, 168, 324, 3, '#7a5a6a');
    if (on) return s + outside('M-84 -154 L84 -154 L84 170 L-84 170Z', -84, -154, 168, 324) + swung(-84, -154, 170, c);
    s += box(-84, -154, 168, 324, 3, c) + box(-66, -40, 56, 90, 8, light(c, 0.15)) + box(10, -40, 56, 90, 8, light(c, 0.15)) + box(-66, 70, 132, 80, 8, light(c, 0.15));
    s += C(0, -100, 36, '#ffffff') + C(0, -100, 30, SKY) + C(0, -100, 30, GLASS) + P(heartD(0, -112, 18), c) + C(56, 50, 7, GOLD) + R(-30, 100, 60, 10, 4, GOLD);
    return s;
  }, { toggle: true }),
  it('f-door-french-cottage', 'French Doors', 'wall', 'Doors', 'cottage', 'wall', 240, 340, (c, on) => {
    let s = box(-110, -170, 220, 340, 6, c) + R(-96, -156, 192, 326, 3, '#7a5a6a');
    const leafPanel = (x: number) => box(x, -156, 96, 326, 3, '#ffffff') + R(x + 12, -142, 72, 220, 2, SKY) + R(x + 12, -142, 72, 220, 2, GLASS) + S(pd`M${x + 48} -142 L${x + 48} 78 M${x + 12} -70 L${x + 84} -70 M${x + 12} 4 L${x + 84} 4`, '#fff', 5) + box(x + 12, 94, 72, 60, 6, '#f4f4f8');
    if (on) return s + outside('M-96 -156 L96 -156 L96 170 L-96 170Z', -96, -156, 192, 326) + cloth('M-96 -156 L-130 -168 L-130 186 L-96 170Z', '#ffffff') + P('M-102 -140 L-124 -146 L-124 70 L-102 76Z', SKY) + cloth('M96 -156 L130 -168 L130 186 L96 170Z', '#ffffff') + P('M102 -140 L124 -146 L124 70 L102 76Z', SKY);
    s += leafPanel(-96) + leafPanel(0) + Ln(0, -156, 0, 170, '#d9d2e0', 2) + C(-10, 40, 5, GOLD) + C(10, 40, 5, GOLD);
    return s + G('translate(0 -182)', [-60, -30, 0, 30, 60].map((x, i) => leaf(x, 8, 18, 7, (i - 2) * 30) + bloom(x, 0, 10, i % 2 ? '#fff' : '#ff9ec7')).join(''));
  }, { toggle: true }),
  it('f-door-arched-woodland', 'Storybook Door', 'wall', 'Doors', 'woodland', 'wall', 230, 340, (c, on) => {
    const op = 'M-84 170 L-84 -76 A84 84 0 0 1 84 -76 L84 170Z';
    let s = P('M-108 170 L-108 -76 A108 108 0 0 1 108 -76 L108 170Z', '#c9bfb6');
    for (let i = 0; i < 9; i++) { const [x, y] = polar(0, -76, 96, 180 + i * 22.5); s += C(x, y, 12, i % 2 ? '#b5aaa0' : '#d6ccc2'); }
    s += P(op, '#5a3a2a');
    if (on) return s + outside(op, -84, -160, 168, 330) + cloth('M-84 170 L-84 -76 Q-92 -150 -120 -152 L-120 188Z', dark(c, 0.06)) + C(-110, 30, 5, '#6b4a3a');
    s += cloth(op, '#b07a4f') + [-56, -28, 0, 28, 56].map((x) => Ln(x, -150, x, 170, '#8a5a3c', 2.5)).join('');
    s += S('M-84 -60 L-20 -60 M-84 90 L-20 90', '#4a3f5e', 7) + C(-20, -60, 5, '#4a3f5e') + C(-20, 90, 5, '#4a3f5e') + C(56, 30, 10, 'none', 'stroke="#4a3f5e" stroke-width="4"') + C(56, 20, 4, '#4a3f5e');
    s += C(0, -100, 22, '#ffe7a6') + S('M-22 -100 L22 -100 M0 -122 L0 -78', '#8a5a3c', 3) + C(0, -100, 22, 'none', 'stroke="#8a5a3c" stroke-width="4"');
    return s + G('translate(0 -184)', leaf(-24, 6, 26, 10, -70, c) + leaf(24, 6, 26, 10, 70, c) + R(-4, -8, 8, 16, 3, '#fff3e6') + P('M-14 -6 Q0 -26 14 -6Z', '#e8573d') + C(-4, -12, 2, '#fff') + C(5, -14, 2, '#fff'));
  }, { toggle: true }),
  it('f-door-barn-boho', 'Barn Door', 'wall', 'Doors', 'boho', 'wall', 240, 350, (c, on) => {
    let s = R(-88, -150, 176, 320, 3, '#7a5a6a') + R(-120, -176, 240, 10, 5, '#4a3f5e');
    if (on) s += outside('M-88 -150 L88 -150 L88 170 L-88 170Z', -88, -150, 176, 320);
    const dx = on ? 150 : 0;
    s += G(`translate(${dx} 0)`, C(-60, -170, 9, '#4a3f5e') + C(60, -170, 9, '#4a3f5e') + box(-96, -160, 192, 330, 4, c) + [-64, -32, 0, 32, 64].map((x) => Ln(x, -156, x, 166, dark(c, 0.12), 2)).join('') +
      box(-96, -160, 192, 22, 3, '#c98a5a') + box(-96, 148, 192, 22, 3, '#c98a5a') + box(-96, -6, 192, 22, 3, '#c98a5a') + S('M-86 -134 L86 -10 M-86 140 L86 14', '#c98a5a', 14) + R(-80, -30, 8, 70, 4, '#4a3f5e'));
    return s;
  }, { toggle: true }),
  it('f-door-castle-princess', 'Castle Door', 'wall', 'Doors', 'princess', 'wall', 230, 360, (c, on) => {
    const op = 'M-84 170 L-84 -60 Q-84 -140 0 -170 Q84 -140 84 -60 L84 170Z';
    let s = P('M-104 176 L-104 -60 Q-104 -158 0 -190 Q104 -158 104 -60 L104 176Z', GOLD) + P(op, '#7a5a6a');
    if (on) return s + outside(op, -84, -170, 168, 340) + cloth('M-84 170 L-84 -60 Q-90 -130 -118 -140 L-118 188Z', dark(c, 0.06), 'hearts') + C(-108, 30, 5, GOLD);
    s += cloth(op, c, 'hearts') + Ln(0, -168, 0, 170, dark(c, 0.15), 3) + S('M-84 -40 L84 -40 M-84 80 L84 80', '#ffd24a', 6);
    for (const y of [-40, 80]) for (const x of [-66, -40, -14, 14, 40, 66]) s += C(x, y, 3.5, '#fff3b0');
    s += C(-14, 30, 7, GOLD) + C(14, 30, 7, GOLD) + P(heartD(0, -128, 26), '#fff') + P(heartD(0, -122, 18), light(c, 0.3));
    return s + G('translate(0 -196) scale(1.1)', motif('crown', 0, 0, 20));
  }, { toggle: true }),
  it('f-door-retro-retro', 'Retro Door', 'wall', 'Doors', 'retro', 'wall', 220, 340, (c, on) => {
    let s = box(-100, -170, 200, 340, 6, '#e8b46a') + R(-84, -154, 168, 324, 3, '#7a5a6a');
    if (on) return s + outside('M-84 -154 L84 -154 L84 170 L-84 170Z', -84, -154, 168, 324) + swung(-84, -154, 170, c, 'none', SILVER);
    s += box(-84, -154, 168, 324, 3, c);
    for (const [x, y] of [[-30, -100], [0, -60], [30, -20]]) s += R(x - 14, y - 14, 28, 28, 4, '#fff3d6') + R(x - 10, y - 10, 20, 20, 2, SKY) + R(x - 10, y - 10, 20, 20, 2, GLASS);
    s += [40, 70, 100].map((y, i) => R(-84, y, 168, 12, 0, ['#ffd36b', '#5fd3b5', '#fff3d6'][i])).join('') + R(52, -6, 10, 40, 5, SILVER);
    return s + P(starD(0, 140, 12), '#fff3d6');
  }, { toggle: true }),
  it('f-door-airlock-space', 'Airlock Door', 'wall', 'Doors', 'space', 'wall', 220, 340, (c, on) => {
    let s = box(-104, -170, 208, 340, 28, '#c9cfdd') + R(-84, -150, 168, 320, 18, '#2d2a5a');
    if (on) {
      s += starsField([[-50, -100, 4], [40, -120, 3], [20, -40, 4], [-30, 20, 3], [56, 40, 3]]) + C(-20, 90, 46, '#7fe0b0') + C(-34, 80, 10, '#5fc4a0') + C(0, 110, 8, '#5fc4a0') + C(30, -80, 14, '#ffd24a');
      s += box(-84, -150, 168, 26, 10, c) + R(-84, -130, 168, 6, 2, '#ffe680');
    } else {
      s += box(-84, -150, 168, 320, 18, c) + C(0, -70, 32, '#c9cfdd') + C(0, -70, 26, '#2d2a5a') + starsField([[-8, -78, 4], [10, -62, 3]]) + C(0, -70, 26, GLASS);
      for (let i = 0; i < 6; i++) s += P(pd`M${-84 + i * 30} 120 L${-64 + i * 30} 120 L${-44 + i * 30} 150 L${-64 + i * 30} 150Z`, '#ffe680');
      s += Ln(0, -150, 0, 110, dark(c, 0.2), 3) + R(-60, 10, 120, 50, 10, dark(c, 0.1)) + C(-30, 35, 7, '#ff7eb6') + C(0, 35, 7, '#7fe0b0') + C(30, 35, 7, '#ffe680');
    }
    return s + R(-104, -170, 208, 340, 28, 'none', 'stroke="#9aa3b5" stroke-width="3"') + C(-92, -150, 4, '#9aa3b5') + C(92, -150, 4, '#9aa3b5') + C(-92, 150, 4, '#9aa3b5') + C(92, 150, 4, '#9aa3b5');
  }, { toggle: true }),
];

// ---- curtains (tap to close) ----
function drapes(c: string, pat: string, closed: boolean, tie: string, top = -146, bot = 160): string {
  if (closed) {
    let s = cloth(pd`M-136 ${top} L0 ${top} L0 ${bot} Q-70 ${bot + 8} -136 ${bot}Z`, c, pat) + cloth(pd`M136 ${top} L0 ${top} L0 ${bot} Q70 ${bot + 8} 136 ${bot}Z`, c, pat);
    for (const x of [-110, -76, -40, 36, 72, 108]) s += S(pd`M${x} ${top + 6} Q${x + 6} ${(top + bot) / 2} ${x} ${bot - 4}`, dark(c, 0.12), 3, O(0.6));
    return s;
  }
  const side = (k: number) => cloth(pd`M${-136 * k} ${top} L${-72 * k} ${top} Q${-62 * k} ${top + 120} ${-100 * k} ${top + 180} Q${-84 * k} ${top + 250} ${-104 * k} ${bot} L${-138 * k} ${bot} Q${-130 * k} ${top + 200} ${-136 * k} ${top}Z`, c, pat) +
    S(pd`M${-100 * k} ${top + 6} Q${-92 * k} ${top + 100} ${-112 * k} ${top + 176}`, dark(c, 0.12), 3, O(0.6)) + R(-118 * k - 17, top + 172, 34, 12, 6, tie);
  return side(1) + side(-1);
}
const rod = (y: number, col: string, w = 150) => R(-w, y - 5, w * 2, 10, 5, col) + C(-w - 4, y, 9, col) + C(w + 4, y, 9, col);
const CURTAINS: FurnDef[] = [
  it('f-curtain-drape-princess', 'Royal Drapes', 'wall', 'Curtains', 'princess', 'wall', 300, 330, (c, on) => {
    let s = drapes(c, 'hearts', on, GOLD);
    let v = 'M-146 -150 L146 -150 L146 -120';
    for (let i = 0; i < 4; i++) v += ` Q${f(146 - i * 73 - 36.5)} -70 ${f(146 - (i + 1) * 73)} -120`;
    s += cloth(v + 'Z', light(c, 0.25), 'none', 'y') + [-73, 0, 73].map((x) => C(x, -118, 8, GOLD)).join('');
    return s + rod(-152, GOLD) + G('translate(0 -150) scale(0.6)', motif('crown', 0, 0, 20));
  }, { toggle: true }),
  it('f-curtain-cafe-cottage', 'Cafe Curtains', 'wall', 'Curtains', 'cottage', 'wall', 300, 300, (c, on) => {
    let v = 'M-140 -136 L140 -136 L140 -96';
    for (let i = 0; i < 7; i++) v += ` Q${f(140 - i * 40 - 20)} -76 ${f(140 - (i + 1) * 40)} -96`;
    let s = cloth(v + 'Z', c, 'check', 'y') + rod(-138, '#fff', 146);
    if (on) s += cloth('M-140 -10 L140 -10 L140 130 Q0 140 -140 130Z', c, 'check');
    else s += cloth('M-140 -10 L-60 -10 Q-70 60 -90 130 L-140 130Z', c, 'check') + cloth('M140 -10 L60 -10 Q70 60 90 130 L140 130Z', c, 'check');
    s += rod(-10, '#fff', 146);
    return s + [-120, -80, 80, 120].map((x) => C(x, -100, 5, '#fff')).join('');
  }, { toggle: true }),
  it('f-curtain-pompom-boho', 'Pom-Pom Curtains', 'wall', 'Curtains', 'boho', 'wall', 300, 330, (c, on) => {
    let s = drapes(c, 'none', on, '#e8907a');
    const ys = on ? [] : [-130, -100, -70, -40, -10, 20, 50, 80, 110, 140];
    for (const y of ys) s += C(-72 + Math.sin(y / 30) * 6 - (y > 20 ? 26 : y > -40 ? 8 : 0), y, 5, '#e8907a') + C(72 - Math.sin(y / 30) * 6 + (y > 20 ? 26 : y > -40 ? 8 : 0), y, 5, '#e8907a');
    if (on) for (let y = -130; y < 160; y += 30) s += C(-4, y, 5, '#e8907a') + C(4, y + 15, 5, '#e8907a');
    for (let x = -136; x <= 136; x += 17) s += C(x, 164, 6, x % 2 ? '#e8907a' : '#fff3e6');
    return s + rod(-152, '#c98a5a');
  }, { toggle: true }),
  it('f-curtain-stars-space', 'Starry Curtains', 'wall', 'Curtains', 'space', 'wall', 300, 330, (c, on) => {
    let s = drapes(c, 'stars', on, '#ffe680');
    const pts = on ? [[-90, -80], [-40, 0], [-100, 80], [50, -60], [100, 30], [40, 110]] : [[-110, -80], [-96, 40], [-118, 120], [110, -60], [100, 60], [116, 130]];
    s += pts.map(([x, y], i) => `<path d="${starD(x, y, 9)}" fill="#ffe680">${blink(1.5 + i * 0.3, i * 0.4, 0.4)}</path>`).join('');
    if (on) s += moonG(-60, -110, 16);
    return s + rod(-152, '#ffe680');
  }, { toggle: true }),
];

// ---- garlands & bunting ----
const sag = (x: number, hw = 150, depth = 46, y0 = -30) => y0 + depth * (1 - (x / hw) * (x / hw));
const swag = (col: string, w = 2, hw = 150, depth = 46, y0 = -30) => S(pd`M${-hw} ${y0} Q0 ${y0 + depth * 2} ${hw} ${y0}`, col, w);
const GARLANDS: FurnDef[] = [
  it('f-garland-bunting-rainbow', 'Rainbow Bunting', 'wall', 'Garlands & Bunting', 'rainbow', 'wall', 320, 110, (c) => {
    let s = swag('#c9a2c0', 2.5) + C(-150, -30, 5, '#fff') + C(150, -30, 5, '#fff');
    const cols = ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff', '#c99bff', '#ff7eb6'];
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40;
      const y = sag(x) - 1;
      s += A(rock(4, x, y, 2.4 + (i % 3) * 0.4, i * 0.3), P(pd`M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 40}Z`, cols[i]) + P(pd`M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 40}Z`, 'url(#p-dots)', O(i % 2 ? 0.8 : 0)) + P(pd`M${x - 16} ${y} L${x} ${y} L${x} ${y + 40}Z`, '#fff', O(0.18)));
    }
    return s;
  }),
  it('f-garland-pompom-boho', 'Pom-Pom Garland', 'wall', 'Garlands & Bunting', 'boho', 'wall', 320, 110, (c) => {
    let s = swag('#c9a27e', 2);
    const cols = [c, '#e8907a', '#fff3e6', '#c9a27e', '#f4b8a0'];
    for (let i = 0; i < 13; i++) {
      const x = -132 + i * 22;
      const y = sag(x);
      if (i % 3 === 1) s += A(rock(5, x, y, 3, i * 0.2), R(x - 3, y, 6, 6, 2, '#c9a27e') + [-4, -2, 0, 2, 4].map((dx) => Ln(x, y + 6, x + dx, y + 34, cols[i % 5], 2)).join(''));
      else s += C(x, y + 2, 11, cols[i % 5]) + C(x, y + 2, 11, 'url(#g-face)') + [0, 60, 120, 180, 240, 300].map((a) => { const [px, py] = polar(x, y + 2, 11, a); return C(px, py, 2.5, cols[i % 5]); }).join('');
    }
    return s;
  }),
  it('f-garland-hearts-sweet', 'Paper Hearts', 'wall', 'Garlands & Bunting', 'sweet', 'wall', 320, 160, (c) => {
    let s = R(-150, -70, 300, 6, 3, '#fff') + C(-150, -67, 6, GOLD) + C(150, -67, 6, GOLD);
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40;
      const n = 2 + (i % 2);
      s += A(rock(3, x, -66, 3 + i * 0.2, i * 0.4), Ln(x, -66, x, -66 + n * 34, '#fff', 1.5) + Array.from({ length: n }, (_, k) => P(heartD(x, -56 + k * 34, 22), k % 2 ? '#ffffff' : i % 2 ? c : light(c, 0.35)) + P(heartD(x - 4, -50 + k * 34, 6), '#fff', O(0.5))).join(''));
    }
    return s;
  }),
  it('f-garland-leaves-woodland', 'Leafy Garland', 'wall', 'Garlands & Bunting', 'woodland', 'wall', 320, 110, (c) => {
    let s = swag('#6b8a4a', 3);
    for (let i = 0; i <= 24; i++) {
      const x = -144 + i * 12;
      const y = sag(x);
      const slope = (-2 * 46 * x) / (150 * 150);
      const ang = (Math.atan2(1, -slope) * 180) / Math.PI;
      s += leaf(x, y, 22, 9, ang + (i % 2 ? -50 : 50), i % 3 ? c : '#a8c88a', false);
      if (i % 4 === 2) s += C(x, y + 8, 4, '#ff7a6b') + C(x + 5, y + 10, 3.5, '#ffab5e');
    }
    return s;
  }),
  it('f-garland-yay-candy', 'Party Banner', 'wall', 'Garlands & Bunting', 'candy', 'wall', 320, 120, (c) => {
    let s = swag('#ff7eb6', 2.5, 150, 36);
    const letters = ['Y', 'A', 'Y', '!'];
    const cols = [c, '#a8e6cf', '#fff3b0', '#c99bff'];
    letters.forEach((l, i) => {
      const x = -84 + i * 56;
      const y = sag(x, 150, 36) - 1;
      s += A(rock(3, x, y, 2.6 + i * 0.3, i * 0.5), P(pd`M${x - 24} ${y} L${x + 24} ${y} L${x + 24} ${y + 44} L${x} ${y + 58} L${x - 24} ${y + 44}Z`, cols[i]) + P(pd`M${x - 24} ${y} L${x + 24} ${y} L${x + 24} ${y + 44} L${x} ${y + 58} L${x - 24} ${y + 44}Z`, SHX) +
        `<text x="${f(x)}" y="${f(y + 38)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="30" text-anchor="middle" fill="#ff4f8b" stroke="#fff" stroke-width="4" paint-order="stroke">${l}</text>`);
    });
    for (const x of [-136, 136]) s += P(sparkleD(x, sag(x, 150, 36) + 14, 9), '#ffd36b');
    return s;
  }),
];

// ---- wall stickers ----
const stk = (d: string, col: string) => P(d, col, 'stroke="#ffffff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"');
const STICKERS: FurnDef[] = [
  it('f-sticker-stars-space', 'Star Stickers', 'wall', 'Wall Stickers', 'space', 'wall', 220, 160, (c) =>
    [[-70, -40, 28, '#ffe680'], [10, -50, 18, '#ff9ec7'], [70, -10, 30, '#ffe680'], [-20, 30, 22, '#9fd6ff'], [-80, 50, 14, c], [40, 54, 16, '#c99bff'], [90, -60, 10, '#fff']].map(([x, y, r, col], i) =>
      `<g>${blink(3 + i * 0.4, i * 0.5, 0.75)}${stk(starD(x as number, y as number, r as number, 0.5), col as string)}${C((x as number) - (r as number) * 0.2, (y as number) - (r as number) * 0.15, (r as number) * 0.15, '#fff', O(0.6))}</g>`).join('')),
  it('f-sticker-hearts-sweet', 'Heart Stickers', 'wall', 'Wall Stickers', 'sweet', 'wall', 220, 160, (c) =>
    [[-60, -60, 50, c], [20, -50, 32, '#ffd9e8'], [70, -10, 40, c], [-30, 10, 30, '#ff7eb6'], [-90, 20, 22, '#ffd9e8'], [30, 30, 24, '#ffb3c7']].map(([x, y, r, col]) => stk(heartD(x as number, y as number, r as number), col as string) + P(heartD((x as number) - (r as number) * 0.22, (y as number) + (r as number) * 0.12, (r as number) * 0.25), '#fff', O(0.5))).join('')),
  it('f-sticker-clouds-beach', 'Cloud Stickers', 'wall', 'Wall Stickers', 'beach', 'wall', 230, 160, (c) => {
    const cl = (x: number, y: number, k: number, face: boolean) => G(at(x, y, k), `<g stroke="${c}" stroke-width="5" paint-order="stroke">${C(-14, 0, 14, '#fff')}${C(4, -8, 18, '#fff')}${C(20, 2, 12, '#fff')}${R(-28, 0, 60, 16, 8, '#fff')}</g>${C(-14, 0, 14, '#fff')}${C(4, -8, 18, '#fff')}${C(20, 2, 12, '#fff')}${R(-28, 0, 60, 16, 8, '#fff')}` + (face ? cute(2, 2, 0.45) : ''));
    let s = cl(-56, -36, 1.5, true) + cl(56, -10, 1.2, true) + cl(-10, 44, 1, false);
    for (const [x, y] of [[-70, 10], [-50, 22], [40, 30], [62, 46], [80, 26]]) s += stk(pd`M${x} ${y - 9} Q${x + 7} ${y + 1} ${x} ${y + 5} Q${x - 7} ${y + 1} ${x} ${y - 9}Z`, '#7cc8ff');
    return s;
  }),
  it('f-sticker-butterflies-cottage', 'Butterfly Stickers', 'wall', 'Wall Stickers', 'cottage', 'wall', 230, 170, (c) => {
    const bf = (x: number, y: number, k: number, a: string, b: string, i: number) => G(at(x, y, k, (i - 1) * 14),
      `<g><animateTransform attributeName="transform" type="scale" values="1 1;0.6 1;1 1" dur="${f(0.9 + i * 0.25)}s" repeatCount="indefinite"/>` +
      stk('M0 -2 C-8 -20 -22 -16 -18 -4 C-16 2 -6 2 0 -2Z M0 -2 C8 -20 22 -16 18 -4 C16 2 6 2 0 -2Z', a) + stk('M0 0 C-6 4 -16 8 -12 16 C-8 20 -2 10 0 0Z M0 0 C6 4 16 8 12 16 C8 20 2 10 0 0Z', b) +
      C(-10, -8, 3, '#fff', O(0.8)) + C(10, -8, 3, '#fff', O(0.8)) + `</g>` + E(0, 2, 2, 9, INK) + S('M-1 -6 L-5 -14 M1 -6 L5 -14', INK, 1.2));
    return bf(-60, -30, 2.4, c, '#ffd36b', 0) + bf(40, -40, 1.6, '#ff9ec7', '#c99bff', 1) + bf(66, 36, 2, '#7cc8ff', c, 2) + bf(-30, 50, 1.3, '#ffab5e', '#fff3b0', 3) +
      S('M-40 -10 q20 30 0 50 q-14 14 4 30', '#fff', 2, 'stroke-dasharray="3 6" opacity="0.9"');
  }),
  it('f-sticker-rainbow-rainbow', 'Rainbow Sticker', 'wall', 'Wall Stickers', 'rainbow', 'wall', 240, 150, (c) =>
    S('M-66 50 A66 66 0 0 1 66 50', '#fff', 64) + ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff'].map((col, i) => S(pd`M${-90 + i * 12} 50 A${90 - i * 12} ${90 - i * 12} 0 0 1 ${90 - i * 12} 50`, col, 12)).join('') +
    G('translate(-96 50)', stk('M-28 0 A14 14 0 0 1 -10 -16 A18 18 0 0 1 22 -12 A12 12 0 0 1 30 4 Z', '#fff')) + G('translate(96 50)', stk('M-28 0 A14 14 0 0 1 -10 -16 A18 18 0 0 1 22 -12 A12 12 0 0 1 30 4 Z', '#fff')) +
    stk(sparkleD(0, -20, 12), '#fff3b0') + stk(starD(-60, -50, 10), '#ff9ec7') + stk(starD(70, -52, 8), '#c99bff')),
  it('f-sticker-daisies-retro', 'Daisy Stickers', 'wall', 'Wall Stickers', 'retro', 'wall', 220, 160, (c) =>
    [[-60, -30, 40], [40, -40, 30], [70, 40, 24], [-20, 44, 26], [-90, 50, 16]].map(([x, y, r], i) => {
      let s = '';
      for (let k = 0; k < 8; k++) s += E(x, y - r * 0.55, r * 0.26, r * 0.5, i % 2 ? '#fff3d6' : c, `transform="rotate(${k * 45} ${f(x)} ${f(y)})" stroke="#fff" stroke-width="5" paint-order="stroke"`);
      for (let k = 0; k < 8; k++) s += E(x, y - r * 0.55, r * 0.26, r * 0.5, i % 2 ? '#fff3d6' : c, `transform="rotate(${k * 45} ${f(x)} ${f(y)})"`);
      return s + C(x, y, r * 0.32, '#ffd36b') + (i < 2 ? cute(x, y - 2, r / 60) : '');
    }).join('')),
];

// ---- posters ----
const paper = (w: number, h: number, col: string) => R(-w / 2 + 4, -h / 2 + 5, w, h, 3, '#3a1d3f', O(0.12)) + R(-w / 2, -h / 2, w, h, 3, col) + R(-w / 2, -h / 2, w, h, 3, SHY, O(0.6)) +
  R(-w / 2 - 10, -h / 2 - 6, 30, 12, 2, '#fff', `opacity="0.7" transform="rotate(-30 ${f(-w / 2 + 5)} ${f(-h / 2)})"`) + R(w / 2 - 20, -h / 2 - 6, 30, 12, 2, '#fff', `opacity="0.7" transform="rotate(30 ${f(w / 2 - 5)} ${f(-h / 2)})"`);
const txt = (x: number, y: number, t: string, size: number, col: string, stroke = '#fff') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" text-anchor="middle" fill="${col}" stroke="${stroke}" stroke-width="${f(size * 0.16)}" paint-order="stroke">${t}</text>`;
const POSTERS: FurnDef[] = [
  it('f-poster-rocket-space', 'Rocket Poster', 'wall', 'Posters', 'space', 'wall', 140, 180, (c) => paper(140, 180, c) + starsField([[-46, -66, 4], [40, -54, 3], [-50, 30, 3], [48, 40, 4], [-20, -40, 2.5]]) +
    C(36, -60, 16, '#ff9ec7') + E(36, -60, 26, 6, 'none', 'stroke="#ffd24a" stroke-width="3" transform="rotate(-18 36 -60)"') +
    A(bob(0, -8, 2), P('M0 -60 C20 -40 22 6 14 24 L-14 24 C-22 6 -20 -40 0 -60Z', '#fff') + C(0, -20, 9, '#7cc8ff', 'stroke="#c9cfdd" stroke-width="3"') + P('M-14 0 L-30 28 L-14 24Z M14 0 L30 28 L14 24Z', '#e8384f') +
      `<g>${blink(0.3, 0, 0.6)}${P('M-10 24 Q0 50 10 24Z', '#ffb83a')}${P('M-5 24 Q0 38 5 24Z', '#ffe680')}</g>`) + txt(0, 74, 'BLAST OFF', 17, '#ffe680', c)),
  it('f-poster-ocean-beach', 'Whale Poster', 'wall', 'Posters', 'beach', 'wall', 140, 180, (c) => paper(140, 180, '#e8f6ff') + R(-70, 10, 140, 80, 0, c) +
    S('M-60 14 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q10 6 20 0', '#fff', 3) +
    A(bob(0, -4, 3), P('M-44 20 Q-44 -20 0 -20 Q40 -20 44 10 L60 -6 L56 22 L44 26 Q20 40 -20 36 Q-44 34 -44 20Z', '#7c8cff') + P('M-40 24 Q0 44 40 24 Q0 34 -40 24Z', '#d9e0ff') + C(-22, 4, 3, INK) + E(-30, 14, 5, 3, '#ff9ec7', O(0.7)) +
      `<g>${blink(1.5, 0, 0.2)}${S('M-6 -22 Q-6 -40 -16 -48 M-6 -22 Q-6 -40 4 -48', '#9fd6ff', 3)}</g>`) + G('translate(36 60) scale(0.6)', motif('fish', 0, 0, 20)) + G('translate(-40 66) scale(0.5)', motif('fish', 0, 0, 20)) + txt(0, -54, 'HELLO SEA', 18, '#4f9dff')),
  it('f-poster-dino-woodland', 'Dino Poster', 'wall', 'Posters', 'woodland', 'wall', 140, 180, (c) => paper(140, 180, '#fff3d6') + P('M-70 60 L-30 -10 L-10 20 L10 -30 L40 30 L70 0 L70 90 L-70 90Z', '#e8c88a', O(0.7)) +
    P('M10 -30 L0 -46 L10 -40 L18 -50 L22 -36Z', '#ffab5e') + R(-70, 60, 140, 30, 0, '#a8d88a') +
    A(rock(3, 0, 60, 2), P('M-40 60 Q-46 20 -14 10 L-10 -16 Q0 -40 20 -34 Q34 -28 30 -12 Q24 -4 14 -4 L12 10 Q36 20 34 60Z', c) + [[-24, 8], [-14, -6], [-6, -22]].map(([x, y]) => P(pd`M${x} ${y} l6 -10 l6 10Z`, '#ffab5e')).join('') +
      C(18, -24, 3, INK) + S('M18 -12 Q24 -10 28 -14', INK, 2) + E(4, 36, 14, 14, light(c, 0.3)) + R(-34, 52, 12, 12, 5, dark(c, 0.15)) + R(18, 52, 12, 12, 5, dark(c, 0.15))) + txt(0, -54, 'ROAR!', 26, '#e8573d')),
  it('f-poster-hello-retro', 'Hello Poster', 'wall', 'Posters', 'retro', 'wall', 140, 180, (c) =>
    paper(140, 180, '#fff3d6') + sunburstPoster(c) + txt(0, 20, 'hello!', 38, '#ff4f8b') + txt(0, 66, 'have a sunny day', 11, '#5fd3b5')),
];
/** Rays for the retro poster, kept inside the paper. */
function sunburstPoster(c: string): string {
  let s = '';
  for (let i = 0; i < 16; i++) {
    const a1 = (i * 22.5 * Math.PI) / 180, a2 = ((i * 22.5 + 11) * Math.PI) / 180;
    const clampP = (a: number) => { const dx = Math.cos(a), dy = Math.sin(a); const t = Math.min(62 / Math.max(Math.abs(dx), 1e-3), 82 / Math.max(Math.abs(dy), 1e-3)); return [dx * t, 6 + dy * t]; };
    const [x1, y1] = clampP(a1);
    const [x2, y2] = clampP(a2);
    s += P(pd`M0 6 L${x1} ${Math.max(-84, Math.min(88, y1))} L${x2} ${Math.max(-84, Math.min(88, y2))}Z`, i % 2 ? c : '#ffd36b', O(0.5));
  }
  return s + C(0, 6, 30, '#ffd36b', O(0.6));
}

// ---- boards ----
const BOARDS: FurnDef[] = [
  it('f-board-cork-cottage', 'Cork Board', 'wall', 'Boards', 'cottage', 'wall', 220, 160, (c) => {
    let s = box(-110, -80, 220, 160, 8, '#c98a5a') + R(-98, -68, 196, 136, 3, '#e8c08a') + R(-98, -68, 196, 136, 3, 'url(#p-dots)', O(0.25));
    s += R(-84, -56, 50, 50, 2, '#fff3b0', 'transform="rotate(-6 -59 -31)"') + S('M-78 -40 L-46 -42 M-78 -30 L-50 -32', '#c9a27e', 2) + C(-60, -54, 5, '#ff7eb6');
    s += R(-20, -60, 60, 70, 2, '#fff', 'transform="rotate(5 10 -25)"') + R(-14, -54, 48, 44, 0, SKY, 'transform="rotate(5 10 -25)"') + G('translate(10 -30) rotate(5)', P('M-24 14 Q-6 -4 6 8 Q14 0 24 10 L24 14Z', GRASS) + sunG(10, -10, 5)) + C(12, -60, 5, '#7cc8ff');
    s += R(52, -50, 40, 40, 2, c, 'transform="rotate(8 72 -30)"') + P(heartD(72, -40, 14), '#ff7eb6') + C(72, -50, 4, '#ffd36b');
    s += R(-80, 14, 70, 44, 2, '#ffd9e8', 'transform="rotate(4 -45 36)"') + S('M-72 28 L-20 30 M-72 38 L-26 40 M-72 48 L-36 50', '#ff9ec7', 2) + C(-46, 16, 4, '#5fd3b5');
    return s + R(10, 20, 80, 38, 2, '#fff', 'transform="rotate(-4 50 39)"') + txt(50, 46, 'hi :)', 18, '#7cc8ff', '#fff') + C(50, 22, 4, '#ff7eb6');
  }),
  it('f-board-chalk-modern', 'Chalkboard', 'wall', 'Boards', 'modern', 'wall', 220, 170, (c) => {
    const ch = (d: string, col = '#f4f4f8') => S(d, col, 3, O(0.9));
    let s = box(-110, -80, 220, 150, 6, c === '#e6e8f0' ? '#c9a27e' : c) + R(-98, -68, 196, 126, 3, '#3f5a52') + R(-98, -68, 196, 126, 3, SHY);
    s += ch('M-80 20 L-80 -10 L-60 -30 L-40 -10 L-40 20Z M-66 20 L-66 4 L-54 4 L-54 20') + ch('M40 -40 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M40 -60 L40 -56 M60 -40 L56 -40 M20 -40 L24 -40 M54 -54 L51 -51 M26 -54 L29 -51', '#ffe680');
    s += `<text x="-10" y="0" font-family="Fredoka, sans-serif" font-weight="600" font-size="26" fill="#ff9ec7" opacity="0.9">hi!</text>` + ch('M10 30 q8 -8 16 0 q8 8 16 0 q8 -8 16 0', '#9fd6ff') + P(heartD(-14, 20, 14), 'none', 'stroke="#ffb3c7" stroke-width="3"');
    return s + box(-104, 60, 208, 12, 4, c === '#e6e8f0' ? '#c9a27e' : c) + R(-70, 52, 26, 8, 4, '#fff') + R(-36, 52, 20, 8, 4, '#ff9ec7') + R(40, 50, 30, 12, 3, '#9aa3b5');
  }),
];

// ---- ceiling decor (hangs from the top) ----
const CEILING: FurnDef[] = [
  it('f-lanterns-paper-candy', 'Paper Lanterns', 'wall', 'Ceiling Decor', 'candy', 'wall', 260, 280, (c, on) => {
    let s = '';
    const ls: [number, number, number, string][] = [[-80, 0, 40, c], [0, 50, 50, '#a8e6cf'], [84, -10, 36, '#fff3b0']];
    ls.forEach(([x, y, r, col], i) => {
      s += Ln(x, -140, x, y - r, '#c9a2c0', 1.5);
      s += A(rock(3, x, -140, 3 + i * 0.5, i), (on ? halo(x, y, r * 1.5, '#fff6c8', 2, i * 0.5) + glow(x, y, r * 2) : '') + R(x - r * 0.35, y - r - 6, r * 0.7, 8, 2, '#4a3f5e') + C(x, y, r, on ? light(col, 0.35) : col) +
        [-0.6, -0.2, 0.2, 0.6].map((k) => S(pd`M${x + k * r} ${y - r * 0.92} Q${x + k * r * 1.5} ${y} ${x + k * r} ${y + r * 0.92}`, dark(col, 0.15), 1.5, O(0.6))).join('') + C(x, y, r, 'url(#g-face)') + R(x - r * 0.3, y + r - 2, r * 0.6, 6, 2, '#4a3f5e'));
    });
    return s;
  }, { toggle: true }),
  it('f-mobile-cloud-sweet', 'Cloud Mobile', 'wall', 'Ceiling Decor', 'sweet', 'wall', 220, 260, (c) => {
    let s = Ln(0, -130, 0, -60, '#c9a2c0', 1.5);
    const items: [number, number, string][] = [[-70, 40, 'heart'], [-30, 70, 'star'], [10, 50, 'drop'], [50, 80, 'heart'], [80, 36, 'star']];
    s += A(rock(4, 0, -130, 5), G('translate(0 -36) scale(1.2)', cloudG(0, 0, 2.2) + cute(0, 6, 0.8)) +
      items.map(([x, y, k], i) => A(rock(8, x, -10, 2.4 + i * 0.3, i * 0.4), Ln(x, -10, x, y - 12, '#c9a2c0', 1.2) + (k === 'heart' ? P(heartD(x, y - 12, 22), i % 2 ? '#ffd9e8' : c) : k === 'star' ? P(starD(x, y, 13), '#ffe680') : P(pd`M${x} ${y - 14} Q${x + 10} ${y} ${x} ${y + 8} Q${x - 10} ${y} ${x} ${y - 14}Z`, '#9fd6ff')))).join(''));
    return s;
  }),
  it('f-mobile-stars-space', 'Moon Mobile', 'wall', 'Ceiling Decor', 'space', 'wall', 240, 260, (c) => {
    let s = Ln(0, -130, 0, -80, '#c9cfdd', 1.5);
    s += A(rock(5, 0, -80, 6), R(-100, -84, 200, 8, 4, c) + C(0, -80, 6, '#ffe680') +
      [[-90, -20, 'star'], [-50, 30, 'planet'], [0, 10, 'moon'], [50, 50, 'star'], [90, -10, 'planet']].map(([x, y, k], i) => A(bob(0, 6, 2 + i * 0.4, i * 0.3), Ln(x as number, -76, x as number, (y as number) - 16, '#c9cfdd', 1.2) +
        (k === 'star' ? P(starD(x as number, y as number, 16), '#ffe680') : k === 'moon' ? moonG(x as number, (y as number) + 10, 26) : motif('planet', x as number, y as number, 18)))).join(''));
    return s;
  }),
  it('f-disco-ball-retro', 'Disco Ball', 'wall', 'Ceiling Decor', 'retro', 'wall', 220, 260, (c, on) => {
    let s = Ln(0, -130, 0, -50, '#9aa3b5', 2) + R(-8, -56, 16, 10, 3, '#9aa3b5');
    if (on) for (let i = 0; i < 8; i++) { const [x, y] = polar(0, 10, 90, i * 45 + 20); s += `<path d="${sparkleD(x, y, 10)}" fill="${PASTELS[i % 6]}">${blink(0.8 + (i % 3) * 0.3, i * 0.2, 0)}</path>`; }
    s += C(0, 10, 56, '#c9cfdd');
    const tiles = (off: number) => { let t = ''; for (let r = -5; r <= 5; r++) { const y = 10 + r * 10; const hw = Math.sqrt(Math.max(0, 56 * 56 - (r * 10) * (r * 10))); for (let x = -hw + ((off + r) % 2 ? 5 : 0); x < hw - 4; x += 10) t += R(x, y - 4, 8, 8, 1.5, (Math.round(x / 10) + r) % 3 ? '#e6e8f0' : (Math.round(x / 10) + r) % 2 ? light(c, 0.3) : '#ffffff'); } return t; };
    s += `<g>${tiles(0)}${on ? `<animate attributeName="opacity" values="1;0.6;1" dur="0.8s" repeatCount="indefinite"/>` : ''}</g>`;
    return s + C(0, 10, 56, 'url(#g-face)') + (on ? glow(-20, -10, 30) : '') + P(sparkleD(-22, -16, 10), '#fff');
  }, { toggle: true }),
];

// =====================================================================================
// RUGS (drawn top-down, then squashed flat onto the floor)
// =====================================================================================
const FLAT = 0.34;
const flat = (s: string) => `<g transform="scale(1 ${FLAT})">${s}</g>`;
/** A rug: its outline `d` gets a thick edge underneath, then the top design. */
const rugOf = (d: string, c: string, top: string, edge?: string) =>
  G('translate(0 5)', flat(P(d, edge ?? dark(c, 0.22)))) + flat(P(d, c) + top + P(d, 'url(#g-face)', O(0.6)));
const ellD = (rx: number, ry: number, cx = 0, cy = 0) => pd`M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
const rectD = (w: number, h: number, r: number) => `M${f(-w / 2 + r)} ${f(-h / 2)} H${f(w / 2 - r)} Q${f(w / 2)} ${f(-h / 2)} ${f(w / 2)} ${f(-h / 2 + r)} V${f(h / 2 - r)} Q${f(w / 2)} ${f(h / 2)} ${f(w / 2 - r)} ${f(h / 2)} H${f(-w / 2 + r)} Q${f(-w / 2)} ${f(h / 2)} ${f(-w / 2)} ${f(h / 2 - r)} V${f(-h / 2 + r)} Q${f(-w / 2)} ${f(-h / 2)} ${f(-w / 2 + r)} ${f(-h / 2)}Z`;
/** A wavy round outline (scallops or flower petals). */
function wavyD(r: number, n: number, depth: number, ry = r, cx = 0, cy = 0): string {
  let d = '';
  for (let i = 0; i <= n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const k = 1 - depth * (0.5 - 0.5 * Math.cos(a * n));
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * r * k)} ${f(cy + Math.sin(a) * ry * k)}`;
  }
  return d + 'Z';
}
const fringe = (x0: number, x1: number, y: number, len: number, col: string) => { let s = ''; for (let x = x0; x <= x1; x += 9) s += Ln(x, y, x, y + len, col, 3); return s; };
const tasselRow = (x0: number, x1: number, y: number, dir: number, col: string) => { let s = ''; for (let x = x0; x <= x1; x += 18) s += P(pd`M${x - 5} ${y} L${x + 5} ${y} L${x} ${y + dir * 22}Z`, col); return s; };
const fuzzRing = (rx: number, ry: number, col: string, n = 40) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return C(Math.cos(a) * rx, Math.sin(a) * ry, 14, col); }).join('');
const RUGS: FurnDef[] = [
  it('f-rug-scallop-sweet', 'Scallop Rug', 'rugs', 'Rugs', 'sweet', 'rug', 320, 110, (c) => {
    const d = wavyD(158, 16, 0.08, 150);
    let top = P(wavyD(130, 16, 0.08, 122), light(c, 0.35)) + P(ellD(104, 98), c);
    for (let i = 0; i < 12; i++) { const [x, y] = polar(0, 0, 116, i * 30); top += P(heartD(x, y * (122 / 116) - 8, 16), '#fff'); }
    return rugOf(d, c, top + P(heartD(0, -42, 70), light(c, 0.5)) + P(heartD(0, -30, 46), '#fff', O(0.8)));
  }),
  it('f-rug-persian-princess', 'Palace Rug', 'rugs', 'Rugs', 'princess', 'rug', 340, 110, (c) => {
    const d = rectD(300, 270, 10);
    let top = P(rectD(270, 240, 6), '#ffffff') + P(rectD(250, 220, 4), c) + P(rectD(250, 220, 4), BIG('hearts'), O(0.35));
    top += P(pd`M0 -90 L100 0 L0 90 L-100 0Z`, '#fff3f8') + P(pd`M0 -64 L70 0 L0 64 L-70 0Z`, '#ffd24a') + P(pd`M0 -40 L44 0 L0 40 L-44 0Z`, light(c, 0.2)) + P(starD(0, 0, 22), '#fff');
    for (const [x, y] of [[-100, -86], [100, -86], [-100, 86], [100, 86]]) top += P(heartD(x, y - 14, 26), '#ffd24a');
    return flat(fringe(-140, 140, -134, -20, '#fff3d6') + fringe(-140, 140, 134, 20, '#fff3d6')) + rugOf(d, c, top);
  }),
  it('f-rug-heart-candy', 'Candy Heart Rug', 'rugs', 'Shape Rugs', 'candy', 'rug', 300, 110, (c) => {
    const d = heartD(0, -150, 280);
    return rugOf(d, c, P(heartD(0, -122, 230), 'none', 'stroke="#fff" stroke-width="8" stroke-dasharray="1 16" stroke-linecap="round"') + P(heartD(0, -100, 190), BIG('dots'), O(0.7)) + P(heartD(0, -60, 110), '#a8e6cf') + P(heartD(0, -36, 66), '#fff3b0'));
  }),
  it('f-rug-star-space', 'Star Rug', 'rugs', 'Shape Rugs', 'space', 'rug', 320, 120, (c) => {
    const d = starD(0, 10, 165, 0.56);
    return rugOf(d, '#ffe680', P(starD(0, 10, 130, 0.56), c) + P(starD(0, 10, 130, 0.56), BIG('stars'), O(0.6)) + P(starD(0, 10, 60, 0.56), '#ffe680') + cute(0, 18, 1.6), '#d9b43a');
  }),
  it('f-rug-cloud-beach', 'Cloud Rug', 'rugs', 'Shape Rugs', 'beach', 'rug', 340, 110, (c) => {
    const cl = (k: number, col: string) => G(`scale(${k})`, C(-90, 20, 70, col) + C(-10, -40, 92, col) + C(86, 0, 76, col) + R(-150, 10, 300, 110, 55, col));
    return G('translate(0 5)', flat(cl(1, dark(c, 0.2)))) + flat(cl(1, '#ffffff') + cl(0.82, c) + cl(0.82, BIG('dots'), ) + cl(1, 'url(#g-face)')) + flat(cute(0, 20, 2.4));
  }),
  it('f-rug-rainbow-rainbow', 'Rainbow Rug', 'rugs', 'Shape Rugs', 'rainbow', 'rug', 340, 100, (c) => {
    const band = (r: number) => pd`M${-r} 110 A${r} ${r * 0.95} 0 0 1 ${r} 110Z`;
    const s = flat(G('translate(0 -25)', P(band(168), dark(c, 0.25))));
    let top = '';
    ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff', '#c99bff'].forEach((col, i) => (top += P(band(168 - i * 22), col)));
    top += P(band(36), '#fff') + C(-140, 104, 34, '#fff') + C(-106, 110, 26, '#fff') + C(140, 104, 34, '#fff') + C(106, 110, 26, '#fff');
    return s + flat(G('translate(0 -40)', top + P(band(168), 'url(#g-face)', O(0.6))));
  }),
  it('f-rug-bear-woodland', 'Teddy Rug', 'rugs', 'Shape Rugs', 'woodland', 'rug', 320, 120, (c) => {
    const bear = (col: string) => C(-104, -104, 50, col) + C(104, -104, 50, col) + E(0, 10, 160, 140, col);
    const brown = '#c98a5a';
    return G('translate(0 5)', flat(bear('#8a5a3c'))) + flat(bear(brown) + C(-104, -104, 26, '#f4dcc0') + C(104, -104, 26, '#f4dcc0') + E(0, 54, 66, 48, '#f4dcc0') + E(0, 36, 22, 15, '#5a3a2a') +
      eyes(0, -10, 54, 13) + S('M-16 66 Q0 80 16 66', '#5a3a2a', 6) + E(-92, 40, 22, 12, '#ff8fb0', O(0.6)) + E(92, 40, 22, 12, '#ff8fb0', O(0.6)) + E(0, 10, 160, 140, 'url(#g-face)') + G('translate(0 116) scale(1.8)', bowG(0, 0, 1, c)));
  }),
  it('f-rug-bunny-princess', 'Bunny Rug', 'rugs', 'Shape Rugs', 'princess', 'rug', 300, 130, (c) => {
    const ears = (col: string) => E(-56, -160, 34, 90, col, 'transform="rotate(-12 -56 -160)"') + E(56, -160, 34, 90, col, 'transform="rotate(12 56 -160)"');
    const body = (col: string) => ears(col) + E(0, 20, 150, 130, col);
    return G('translate(0 5)', flat(body('#e6d4e6'))) + flat(body('#ffffff') + E(-56, -160, 16, 66, c, 'transform="rotate(-12 -56 -160)"') + E(56, -160, 16, 66, c, 'transform="rotate(12 56 -160)"') +
      eyes(0, 10, 50, 12) + E(0, 40, 14, 10, '#ff7eb6') + S('M-14 56 Q0 68 14 56', INK, 5) + E(-86, 50, 22, 12, c, O(0.8)) + E(86, 50, 22, 12, c, O(0.8)) + E(0, 20, 150, 130, 'url(#g-face)') + G('translate(70 -78) scale(1.6)', bowG(0, 0, 1, '#ff7eb6')));
  }),
  it('f-rug-shaggy-modern', 'Fluffy Rug', 'rugs', 'Rugs', 'modern', 'rug', 330, 110, (c) => {
    const col = c === '#e6e8f0' ? '#f4f4f8' : c;
    return G('translate(0 5)', flat(fuzzRing(150, 132, dark(col, 0.15)) + E(0, 0, 150, 132, dark(col, 0.15)))) + flat(fuzzRing(148, 130, col) + E(0, 0, 148, 130, col) +
      Array.from({ length: 60 }, (_, i) => { const [x, y] = polar(0, 0, 20 + ((i * 37) % 110), i * 47); return S(pd`M${x} ${y} q4 -8 0 -16`, dark(col, 0.08), 3, O(0.6)); }).join('') + E(0, 0, 150, 132, 'url(#g-face)'));
  }),
  it('f-rug-braided-cottage', 'Braided Rug', 'rugs', 'Rugs', 'cottage', 'rug', 340, 110, (c) => {
    const d = ellD(165, 140);
    let top = '';
    const cols = [c, '#fff3d6', '#ff9ec7', c, '#ffd36b', '#fff3d6', c];
    cols.forEach((col, i) => (top += P(ellD(165 - i * 22, 140 - i * 19), col) + P(ellD(165 - i * 22, 140 - i * 19), 'none', `stroke="${dark(col, 0.15)}" stroke-width="3" stroke-dasharray="10 6"`)));
    return rugOf(d, c, top);
  }),
  it('f-rug-checker-retro', 'Checker Rug', 'rugs', 'Rugs', 'retro', 'rug', 340, 110, (c) => {
    const d = rectD(300, 260, 24);
    let top = '';
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) if ((r + k) % 2) top += R(-140 + k * 40, -120 + r * 40, 40, 40, 0, '#fff3d6');
    return rugOf(d, c, top + P(d, 'none', 'stroke="#ffd36b" stroke-width="12"'));
  }),
  it('f-rug-runner-beach', 'Striped Runner', 'rugs', 'Rugs', 'beach', 'rug', 400, 80, (c) => {
    const d = rectD(380, 180, 8);
    let top = '';
    for (let i = 0; i < 7; i++) top += R(-190, -78 + i * 24, 380, 12, 0, i % 2 ? '#ffffff' : light(c, 0.4));
    return flat(tasselRow(-180, 180, -90, -1, '#fff3d6') + tasselRow(-180, 180, 90, 1, '#fff3d6')) + rugOf(d, c, top + R(-190, -10, 380, 20, 0, '#ffab5e', O(0.9)));
  }),
  it('f-rug-daisy-cottage', 'Daisy Rug', 'rugs', 'Shape Rugs', 'cottage', 'rug', 320, 120, (c) => {
    const d = wavyD(165, 8, 0.32, 150);
    return rugOf(d, '#ffffff', P(wavyD(140, 8, 0.32, 126), light(c, 0.55)) + C(0, 0, 62, '#ffd24a') + C(0, 0, 62, BIG('dots'), ) + cute(0, -4, 1.8), '#e6d6c8');
  }),
  it('f-rug-moon-space', 'Moon Rug', 'rugs', 'Shape Rugs', 'space', 'rug', 320, 110, (c) => {
    const d = pd`M60 -140 A150 140 0 1 0 150 60 A120 112 0 1 1 60 -140Z`;
    return rugOf(d, '#ffe680', P(pd`M40 -110 A120 112 0 1 0 116 50 A96 90 0 1 1 40 -110Z`, '#fff3b0') + C(-60, 10, 10, INK) + S('M-96 50 Q-74 68 -50 50', INK, 5) + E(-110, 40, 16, 9, '#ff8fb0', O(0.7)) +
      G(at(120, -90), P(starD(0, 0, 30), c)) + G(at(150, -20), P(starD(0, 0, 18), c)), '#d9b43a');
  }),
  it('f-rug-kilim-boho', 'Kilim Rug', 'rugs', 'Rugs', 'boho', 'rug', 340, 110, (c) => {
    const d = rectD(300, 250, 6);
    let top = P(rectD(276, 226, 4), '#fff3e6');
    for (let i = 0; i < 4; i++) { const x = -105 + i * 70; top += P(pd`M${x} -80 L${x + 30} -40 L${x} 0 L${x - 30} -40Z`, i % 2 ? '#e8907a' : '#c98a5a') + P(pd`M${x} 0 L${x + 30} 40 L${x} 80 L${x - 30} 40Z`, i % 2 ? '#c98a5a' : '#e8907a') + C(x, 0, 8, c); }
    top += R(-138, -110, 276, 14, 0, '#e8907a') + R(-138, 96, 276, 14, 0, '#e8907a');
    return flat(fringe(-140, 140, -160, 22, '#fff3e6') + fringe(-140, 140, 120, 22, '#fff3e6')) + rugOf(d, c, top);
  }),
  it('f-rug-circles-retro', 'Groovy Rug', 'rugs', 'Rugs', 'retro', 'rug', 330, 110, (c) => {
    const d = ellD(160, 146);
    let top = '';
    ['#ffd36b', c, '#fff3d6', '#5fd3b5', '#ffab5e'].forEach((col, i) => (top += P(ellD(140 - i * 26, 128 - i * 24, i * 6, 0), col)));
    return rugOf(d, '#e8b46a', top + C(30, 0, 14, '#fff3d6'));
  }),
  it('f-rug-hexagon-modern', 'Geo Rug', 'rugs', 'Rugs', 'modern', 'rug', 330, 110, (c) => {
    const hexD = (r: number) => { let d = ''; for (let i = 0; i < 6; i++) { const [x, y] = polar(0, 0, r, i * 60); d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`; } return d + 'Z'; };
    let top = '';
    for (const [r, col] of [[136, '#ffffff'], [108, c], [80, '#9aa3b5'], [52, '#ffffff']] as const) top += P(hexD(r), col, O(col === c ? 1 : 0.8));
    return G('translate(0 5)', flat(P(hexD(165), '#9aa3b5'))) + flat(P(hexD(165), c) + top + P(hexD(165), 'none', 'stroke="#4a4a5e" stroke-width="10"') + P(hexD(70), '#4a4a5e', O(0.15)) + P(hexD(165), 'url(#g-face)', O(0.6)));
  }),
  it('f-rug-leaf-woodland', 'Leaf Rug', 'rugs', 'Shape Rugs', 'woodland', 'rug', 340, 110, (c) => {
    const d = leafD(-170, 0, 340, 130, 90);
    let top = Ln(-160, 0, 150, 0, light(c, 0.4), 8);
    for (let x = -120; x < 120; x += 40) { const k = Math.max(0.2, 1 - ((x + 40) / 170) ** 2); top += S(pd`M${x} 0 Q${x + 22} ${-36 * k} ${x + 44} ${-62 * k} M${x} 0 Q${x + 22} ${36 * k} ${x + 44} ${62 * k}`, light(c, 0.35), 5); }
    return rugOf(d, c, top);
  }),
  it('f-rug-hello-woodland', 'Hello Doormat', 'rugs', 'Rugs', 'woodland', 'rug', 240, 80, (c) => {
    const d = rectD(220, 150, 14);
    return G('translate(0 5)', flat(P(d, '#8a5a3c'))) + flat(P(d, '#d9a870') + P(d, 'url(#p-check)', O(0.35)) + P(rectD(196, 126, 8), 'none', `stroke="${c}" stroke-width="10"`) + P(d, 'url(#g-face)', O(0.6))) +
      `<g transform="scale(1 0.5)">${txt(0, 16, 'HELLO', 46, '#6b4a3a', '#d9a870')}</g>` + flat(P(heartD(84, -50, 22), c) + P(heartD(-84, -50, 22), c));
  }),
  // bath mats
  it('f-bathmat-sweet', 'Fluffy Bath Mat', 'rugs', 'Bath Mats', 'sweet', 'rug', 260, 90, (c) => {
    const d = rectD(240, 170, 60);
    let top = P(rectD(214, 146, 50), light(c, 0.2));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) top += C(-90 + k * 30, -50 + r * 32, 9, light(c, 0.35), O(0.8));
    top += P(heartD(0, -40, 66), '#fff') + P(heartD(0, -26, 40), light(c, 0.5));
    return G('translate(0 4)', flat(fuzzRing(118, 82, dark(c, 0.15), 34))) + flat(fuzzRing(116, 80, c, 34)) + rugOf(d, c, top);
  }),
  it('f-bathmat-duck-beach', 'Ducky Bath Mat', 'rugs', 'Bath Mats', 'beach', 'rug', 260, 90, (c) => {
    const d = rectD(240, 170, 30);
    let top = '';
    for (let i = 0; i < 4; i++) top += S(pd`M-110 ${-50 + i * 34} q14 -10 28 0 q14 10 28 0 q14 -10 28 0 q14 10 28 0 q14 -10 28 0 q14 10 28 0 q14 -10 28 0 q14 10 28 0`, '#fff', 4, O(0.5));
    top += G('translate(0 6) scale(2.4)', E(0, 6, 20, 12, '#ffd84a') + C(10, -10, 11, '#ffd84a') + P('M19 -10 L30 -7 L19 -4Z', '#ff8a3d') + C(12, -13, 2, INK) + P('M-14 4 Q-4 -6 4 6', 'none', 'stroke="#f0c03a" stroke-width="2.5"'));
    return rugOf(d, c, top);
  }),
  it('f-bathmat-pebble-modern', 'Pebble Bath Mat', 'rugs', 'Bath Mats', 'modern', 'rug', 270, 90, (c) => {
    const peb: [number, number, number, number][] = [[-90, -30, 34, 26], [-40, 20, 40, 30], [10, -36, 36, 28], [62, 16, 42, 30], [104, -34, 26, 22], [-104, 40, 26, 20], [16, 50, 22, 18], [-50, -60, 20, 16]];
    const cols = [c, '#c9cfdd', '#9aa3b5', '#f4f4f8'];
    return G('translate(0 5)', flat(peb.map(([x, y, rx, ry]) => E(x, y, rx, ry, '#7a8098')).join(''))) + flat(peb.map(([x, y, rx, ry], i) => E(x, y, rx, ry, cols[i % 4]) + E(x, y, rx, ry, 'url(#g-face)') + E(x - rx * 0.3, y - ry * 0.4, rx * 0.3, ry * 0.2, '#fff', O(0.5))).join(''));
  }),
];

// =====================================================================================
// DECOR: floor vases, sculptures, keepsakes, candles, cushions, photos, holiday, screens
// =====================================================================================
const plinth = (w: number, h: number, c: string) => box(-w / 2 - 8, -14, w + 16, 14, 4, dark(c, 0.06)) + box(-w / 2, -h, w, h - 12, 4, c) + box(-w / 2 - 8, -h - 12, w + 16, 14, 4, dark(c, 0.06));
const marble = '#f6f2fa';
const dollFace = (x: number, y: number, r: number, hair: string, skin: string) =>
  C(x, y - r * 0.1, r * 1.12, hair) + C(x, y, r, skin) + P(pd`M${x - r} ${y - r * 0.1} Q${x - r * 0.6} ${y - r * 1.2} ${x + r * 0.9} ${y - r * 0.6} Q${x + r * 0.2} ${y - r * 0.5} ${x - r} ${y - r * 0.1}Z`, hair) +
  C(x - r * 0.35, y + r * 0.1, r * 0.12, INK) + C(x + r * 0.35, y + r * 0.1, r * 0.12, INK) + S(pd`M${x - r * 0.2} ${y + r * 0.4} Q${x} ${y + r * 0.55} ${x + r * 0.2} ${y + r * 0.4}`, INK, r * 0.08) + E(x - r * 0.6, y + r * 0.35, r * 0.18, r * 0.1, '#ff8fb0', O(0.7)) + E(x + r * 0.6, y + r * 0.35, r * 0.18, r * 0.1, '#ff8fb0', O(0.7));
const photoScene = (x: number, y: number, w: number, h: number) => R(x, y, w, h, 2, '#cdeaff') + R(x, y + h * 0.66, w, h * 0.34, 0, GRASS) + dollFace(x + w * 0.33, y + h * 0.5, h * 0.18, '#8a5a34', '#fcd2bb') + dollFace(x + w * 0.68, y + h * 0.54, h * 0.16, '#2b1d1a', '#b9744f') + sunG(x + w * 0.85, y + h * 0.18, h * 0.07);
const ornament = (x: number, y: number, r: number, col: string) => C(x, y, r, col) + C(x - r * 0.35, y - r * 0.35, r * 0.3, '#fff', O(0.7)) + R(x - r * 0.3, y - r - 4, r * 0.6, 5, 1.5, '#ffd24a');
function tieredTree(c: string, on: boolean, cols: string[], tinsel?: string): string {
  let s = R(-14, -40, 28, 40, 4, '#8a5a3c');
  for (let i = 0; i < 4; i++) {
    const y = -36 - i * 62;
    const w = 112 - i * 24;
    s += cloth(pd`M${-w} ${y} Q${-w * 0.5} ${y + 14} 0 ${y + 6} Q${w * 0.5} ${y + 14} ${w} ${y} L0 ${y - 100}Z`, i % 2 ? dark(c, 0.06) : c);
    if (tinsel) s += S(pd`M${-w * 0.8} ${y - 6} Q0 ${y + 8} ${w * 0.8} ${y - 18}`, tinsel, 4, 'stroke-dasharray="2 5"');
  }
  const pts = [[-70, -50], [50, -56], [-20, -76], [76, -44], [-50, -112], [30, -118], [-6, -150], [44, -170], [-36, -178], [10, -220], [-16, -246], [24, -262]];
  pts.forEach(([x, y], i) => {
    if (on) s += halo(x, y, 14, cols[(i + 2) % cols.length], 1 + (i % 3) * 0.4, i * 0.2);
    s += ornament(x, y, 9, cols[i % cols.length]);
  });
  return s + (on ? glow(0, -300, 60) : '') + P(starD(0, -296, 24), GOLD) + C(-6, -302, 4, '#fff', O(0.7));
}
const giftBox = (x: number, w: number, h: number, col: string, rib: string) => box(x - w / 2, -h, w, h, 4, col) + R(x - 4, -h, 8, h, 0, rib) + G(at(x, -h, 0.5), bowG(0, 0, 1, rib));
const snowFall = (cx: number, cy: number, r: number, n = 10) => Array.from({ length: n }, (_, i) => {
  const x = cx - r * 0.7 + ((i * 37) % 100) / 100 * r * 1.4;
  const d = 2.4 + (i % 4) * 0.5;
  return `<circle cx="${f(x)}" cy="${f(cy - r * 0.7)}" r="${f(1.6 + (i % 3) * 0.7)}" fill="#fff"><animate attributeName="cy" values="${f(cy - r * 0.75)};${f(cy + r * 0.45)}" dur="${d}s" begin="${f(-i * 0.37)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="${d}s" begin="${f(-i * 0.37)}s" repeatCount="indefinite"/></circle>`;
}).join('');
const notesUp = (x: number, y: number) => [0, 1, 2].map((i) => `<g opacity="0"><animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${f(i % 2 ? 14 : -14)} -40" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/>${G(at(x + (i - 1) * 16, y, 0.5), motif('note', 0, 0, 20).replace(/#ffffff/g, PASTELS[i * 2]))}</g>`).join('');

const DECOR: FurnDef[] = [
  // floor vases
  it('f-floorvase-branches-modern', 'Tall Vase', 'decor', 'Floor Vases', 'modern', 'floor', 130, 260, (c) => {
    let s = S('M0 -150 Q-10 -200 -40 -250 M0 -150 Q14 -210 44 -240 M0 -150 Q2 -210 6 -262', '#7a8a6a', 3);
    for (let i = 0; i < 18; i++) { const t = (i % 6) / 6 + 0.1; const br = Math.floor(i / 6); const [x0, x1] = [[0, -40], [0, 44], [0, 6]][br]; const y = -150 - t * 100; const x = x0 + (x1 - x0) * t; s += E(x + (i % 2 ? 7 : -7), y, 7, 5, i % 3 ? '#9fc2a8' : '#b7d4be'); }
    return s + cloth('M-22 -160 L22 -160 Q30 -110 46 -60 Q56 -8 30 0 L-30 0 Q-56 -8 -46 -60 Q-30 -110 -22 -160Z', c) + E(0, -160, 22, 6, dark(c, 0.15)) + S('M-14 -130 Q-30 -60 -20 -16', '#fff', 5, O(0.35)) + R(-44, -66, 88, 8, 4, '#2d2a3a', O(0.6));
  }),
  it('f-floorvase-amphora-princess', 'Royal Urn', 'decor', 'Floor Vases', 'princess', 'floor', 150, 250, (c) =>
    [[-30, -196], [24, -204], [0, -222], [-8, -180], [36, -184], [-40, -170]].map(([x, y], i) => stem(0, -140, x, y) + rose(x, y, 15, i % 2 ? '#ff8fbf' : '#ffc2dc')).join('') + leaf(-26, -160, 26, 10, -60) + leaf(26, -160, 26, 10, 60, LEAF_D) +
    S('M-40 -120 Q-62 -110 -40 -86 M40 -120 Q62 -110 40 -86', GOLD, 6) + box(-34, -16, 68, 16, 6, GOLD) + cloth('M-30 -144 L30 -144 Q24 -120 46 -90 Q60 -40 24 -18 L-24 -18 Q-60 -40 -46 -90 Q-24 -120 -30 -144Z', c, 'hearts') + R(-34, -148, 68, 10, 5, GOLD) + R(-50, -86, 100, 6, 3, GOLD, O(0.9))),
  it('f-floorvase-basket-boho', 'Dried Flower Basket', 'decor', 'Floor Vases', 'boho', 'floor', 150, 230, (c) => {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const a = -40 + i * 10;
      const [x, y] = along(0, -90, 110 + (i % 3) * 22, a, 1);
      s += S(pd`M0 -90 L${x} ${y}`, '#c9a27e', 2) + (i % 3 === 0 ? E(x, y, 9, 14, '#f6ead2', `transform="rotate(${a} ${f(x)} ${f(y)})"`) : i % 3 === 1 ? C(x, y, 8, '#e8907a') + C(x, y, 8, 'url(#g-face)') : leaf(x, y + 16, 22, 6, a, '#c9b37e', false));
    }
    return s + G('translate(0 0)', pot('basket', 96, 96, c));
  }),
  // sculptures
  it('f-statue-bunny-princess', 'Bunny Statue', 'decor', 'Sculptures', 'princess', 'floor', 120, 270, (c) =>
    plinth(80, 120, c) + G('translate(0 -132)', E(0, -40, 34, 40, marble) + E(-14, -112, 9, 26, marble) + E(14, -112, 9, 26, marble) + E(-14, -110, 4, 17, '#efe3f2') + E(14, -110, 4, 17, '#efe3f2') +
      C(0, -86, 26, marble) + C(0, -86, 26, 'url(#g-face)') + E(0, -40, 34, 40, 'url(#g-face)') + S('M-8 -84 Q-5 -80 -2 -84 M2 -84 Q5 -80 8 -84', '#b8a8c8', 2) + E(0, -76, 3, 2, '#d8c0d8') + C(24, -14, 10, marble) +
      G('translate(0 -122) scale(0.55)', motif('crown', 0, 0, 20))) + P(heartD(0, -82, 16), light(c, 0.4))),
  it('f-sculpture-loops-modern', 'Swirl Sculpture', 'decor', 'Sculptures', 'modern', 'floor', 130, 260, (c) =>
    plinth(80, 110, '#4a4a5e') + G('translate(0 -122)', S('M0 0 C-60 -40 -50 -110 0 -90 C50 -70 40 -10 0 -40 C-30 -60 -10 -130 20 -130', c === '#e6e8f0' ? '#ffab5e' : c, 14) + S('M0 0 C-60 -40 -50 -110 0 -90 C50 -70 40 -10 0 -40 C-30 -60 -10 -130 20 -130', '#fff', 4, O(0.35)) + C(20, -130, 10, '#ffd36b'))),
  it('f-sculpture-balloondog-candy', 'Balloon Dog', 'decor', 'Sculptures', 'candy', 'floor', 150, 240, (c) => {
    const b = (x: number, y: number, rx: number, ry: number, a = 0) => E(x, y, rx, ry, c, `transform="rotate(${a} ${f(x)} ${f(y)})"`) + E(x, y, rx, ry, 'url(#g-face)', `transform="rotate(${a} ${f(x)} ${f(y)})"`) + E(x - rx * 0.3, y - ry * 0.4, rx * 0.25, ry * 0.18, '#fff', `opacity="0.7" transform="rotate(${a} ${f(x)} ${f(y)})"`);
    return plinth(90, 90, '#ffffff') + G('translate(0 -102)', b(-30, -16, 9, 26) + b(-6, -16, 9, 26) + b(30, -16, 9, 26) + b(50, -18, 9, 26) + b(10, -50, 40, 16) + b(-46, -80, 12, 32, 30) + b(-40, -106, 22, 16, 0) + b(-70, -108, 18, 10, 0) + b(-34, -128, 9, 20, -20) + b(64, -70, 8, 20, 30));
  }),
  // keepsakes (tabletop)
  it('f-trophy-cup-sweet', 'Gold Trophy', 'decor', 'Keepsakes', 'sweet', 'prop', 80, 110, (c) =>
    box(-28, -20, 56, 20, 4, c) + R(-20, -14, 40, 8, 3, '#fff', O(0.6)) + R(-6, -44, 12, 26, 4, GOLD) + E(0, -44, 18, 6, GOLD) + S('M-26 -94 Q-44 -92 -36 -72 Q-30 -62 -20 -62 M26 -94 Q44 -92 36 -72 Q30 -62 20 -62', GOLD, 6) +
    P('M-30 -100 L30 -100 Q30 -54 0 -50 Q-30 -54 -30 -100Z', GOLD) + E(0, -100, 30, 7, '#ffe680') + P(heartD(0, -88, 18), c) + E(-16, -80, 4, 10, '#fff', O(0.6))),
  it('f-trophy-star-retro', 'Star Trophy', 'decor', 'Keepsakes', 'retro', 'prop', 80, 120, (c) =>
    box(-26, -24, 52, 24, 4, c) + R(-20, -16, 40, 8, 2, '#fff3d6') + R(-5, -60, 10, 38, 4, SILVER) + `<g>${A(rock(6, 0, -84, 3), P(starD(0, -84, 32), GOLD) + P(starD(0, -84, 32), 'none', 'stroke="#e0a11e" stroke-width="2"') + C(-8, -92, 5, '#fff', O(0.6)))}</g>` + P(sparkleD(30, -110, 6), '#ffd36b')),
  it('f-globe-plane-woodland', 'Travel Globe', 'decor', 'Keepsakes', 'woodland', 'prop', 100, 130, (c) =>
    E(0, -6, 30, 7, '#a86b4a') + R(-5, -32, 10, 28, 4, '#a86b4a') + S('M-44 -40 A46 46 0 0 1 30 -112', '#c9a27e', 5) + C(0, -72, 38, '#9fd6ff') +
    P('M-26 -90 Q-10 -104 4 -92 Q14 -80 -2 -72 Q-18 -64 -26 -90Z M12 -60 Q26 -66 30 -50 Q16 -44 12 -60Z M-30 -60 Q-20 -54 -24 -44 Q-34 -48 -30 -60Z', c) + C(0, -72, 38, 'url(#g-face)') +
    A(spin(0, -72, 6), G('translate(0 -122) scale(0.8)', P('M-10 0 L10 0 L14 -3 L10 2 L-8 4Z', '#fff') + P('M0 0 L-4 -7 L2 -7 L4 0Z M0 2 L-4 8 L2 8 L4 2Z', '#ff7a6b')))),
  it('f-musicbox-princess', 'Music Box', 'decor', 'Keepsakes', 'princess', 'prop', 110, 140, (c, on) => {
    const dancer = G('translate(0 -60)', E(0, -6, 24, 9, '#ffd9e8') + P('M-22 -6 Q0 -30 22 -6 Q0 4 -22 -6Z', '#ffc2dc') + R(-5, -38, 10, 26, 5, '#fcd2bb') + C(0, -46, 10, '#fcd2bb') + C(0, -54, 9, '#8a5a34') + C(0, -62, 6, '#8a5a34') + S('M-4 -34 Q-18 -48 -10 -60 M4 -34 Q18 -48 10 -60', '#fcd2bb', 4) + Ln(-3, 2, -6, 16, '#fcd2bb', 4) + Ln(3, 2, 8, 12, '#fcd2bb', 4));
    return (on ? notesUp(0, -140) : '') + `<g>${on ? `<animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="1.6s" repeatCount="indefinite" additive="sum"/>` : ''}${dancer}</g>` + E(0, -58, 30, 7, '#ffe680') +
      box(-50, -56, 100, 56, 8, c) + R(-50, -56, 100, 10, 5, GOLD) + R(-50, -10, 100, 8, 4, GOLD) + P(heartD(0, -42, 20), '#fff') + C(52, -30, 6, GOLD);
  }, { toggle: true, sfx: 'music' }),
  it('f-snowglobe-village-cottage', 'Snow Globe', 'decor', 'Keepsakes', 'cottage', 'prop', 90, 110, (c) =>
    C(0, -60, 40, '#cfe9ff', O(0.55)) + P('M-36 -46 Q0 -56 36 -46 A40 40 0 0 1 -36 -46Z', '#ffffff') + R(-16, -70, 22, 18, 2, '#ff9ec7') + P('M-19 -70 L-5 -84 L9 -70Z', '#e8573d') + R(-8, -62, 6, 10, 1, '#ffe680') +
    P('M14 -50 L22 -78 L30 -50Z', '#3f9a6a') + P('M18 -66 L22 -78 L26 -66Z', '#fff') + snowFall(0, -60, 40) + C(0, -60, 40, GLASS) + shine(-18, -78, 6, 10, 0.7) + box(-34, -24, 68, 24, 8, c) + R(-34, -24, 68, 6, 3, '#fff', O(0.4)) + G('translate(0 -12) scale(0.35)', motif('daisy', 0, 0, 20))),
  // candles
  it('f-candles-pillar-cottage', 'Candle Trio', 'decor', 'Candles', 'cottage', 'prop', 100, 110, (c, on) => {
    let s = E(0, -4, 48, 6, '#c9cfdd');
    for (const [x, h, col] of [[-26, 50, c], [0, 74, '#fff3d6'], [26, 38, light(c, 0.3)]] as const) {
      s += box(x - 11, -h - 4, 22, h, 6, col) + P(pd`M${x - 11} ${-h + 4} Q${x - 6} ${-h + 14} ${x - 2} ${-h + 4}`, '#fff', O(0.6)) + Ln(x, -h - 4, x, -h - 12, INK, 2);
      if (on) s += glow(x, -h - 22, 30) + flame(x, -h - 10, 0.6);
    }
    return s;
  }, { toggle: true }),
  it('f-candle-jar-sweet', 'Candle Jar', 'decor', 'Candles', 'sweet', 'prop', 70, 90, (c, on) =>
    (on ? glow(0, -54, 40) : '') + box(-24, -56, 48, 56, 10, '#fff3f8') + R(-24, -56, 48, 56, 10, GLASS) + R(-20, -46, 40, 34, 8, c, O(on ? 0.9 : 0.75)) + P(heartD(0, -38, 14), '#fff') + E(0, -48, 18, 4, '#fff8e0') + Ln(0, -48, 0, -56, INK, 2) + (on ? flame(0, -54, 0.55) : '')
  , { toggle: true }),
  it('f-lantern-candle-boho', 'Candle Lantern', 'decor', 'Candles', 'boho', 'prop', 80, 140, (c, on) =>
    S('M-14 -122 Q0 -146 14 -122', '#4a3f5e', 4) + P('M-30 -104 L30 -104 L0 -126Z', '#4a3f5e') + (on ? glow(0, -60, 50) : '') + R(-26, -104, 52, 92, 4, '#fff8e0', O(on ? 0.7 : 0.4)) +
    box(-10, -50, 20, 36, 4, c) + Ln(0, -50, 0, -56, INK, 2) + (on ? flame(0, -56, 0.6) : '') + R(-26, -104, 52, 92, 4, GLASS) + S('M-26 -104 L-26 -12 M26 -104 L26 -12 M0 -104 L0 -96', '#4a3f5e', 4) + box(-32, -14, 64, 14, 4, '#4a3f5e') + R(-32, -108, 64, 8, 3, '#4a3f5e')
  , { toggle: true }),
  // cushions
  it('f-cushion-heart-sweet', 'Heart Cushion', 'decor', 'Cushions', 'sweet', 'prop', 90, 80, (c) => cloth(heartD(0, -80, 80), c, 'none') + P(heartD(0, -62, 46), 'none', 'stroke="#fff" stroke-width="3" stroke-dasharray="4 5"') + cute(0, -40, 0.7)),
  it('f-cushion-star-space', 'Star Cushion', 'decor', 'Cushions', 'space', 'prop', 100, 96, (c) => cloth(starD(0, -46, 48, 0.55), c, 'stars') + P(starD(0, -46, 48, 0.55), 'none', 'stroke="#ffe680" stroke-width="3" stroke-linejoin="round"') + cute(0, -42, 0.6).replace(/#4a3f5e/g, '#ffe680')),
  it('f-cushion-macaron-candy', 'Macaron Cushion', 'decor', 'Cushions', 'candy', 'prop', 90, 70, (c) =>
    E(0, -18, 40, 16, c) + E(0, -18, 40, 16, 'url(#g-face)') + E(0, -34, 42, 8, '#fff3f8') + S('M-42 -34 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0', '#fff3f8', 4) + E(0, -48, 40, 16, c) + E(0, -48, 40, 16, 'url(#g-face)') + E(-14, -54, 10, 4, '#fff', O(0.5))),
  it('f-cushion-tassel-boho', 'Tassel Cushion', 'decor', 'Cushions', 'boho', 'prop', 100, 80, (c) =>
    cloth('M-40 -72 Q0 -64 40 -72 Q34 -36 40 -2 Q0 -10 -40 -2 Q-34 -36 -40 -72Z', c) + [[-40, -72], [40, -72], [-40, -2], [40, -2]].map(([x, y]) => P(pd`M${x} ${y} L${x + (x < 0 ? -10 : 10)} ${y + (y < -30 ? -8 : 10)} L${x + (x < 0 ? -4 : 4)} ${y + (y < -30 ? -14 : 16)}Z`, '#e8907a')).join('') +
    G('translate(0 -37) scale(0.9)', motif('sun', 0, 0, 20)) + S('M-30 -14 L30 -14', '#e8907a', 3, 'stroke-dasharray="4 4"')),
  // photo frames (tabletop)
  it('f-photo-heart-princess', 'Heart Photo', 'decor', 'Photo Frames', 'princess', 'prop', 90, 90, (c) =>
    P(heartD(0, -84, 86), GOLD) + P(heartD(0, -74, 70), c) + `<g>${photoScene(-28, -66, 56, 44)}</g>` + P(heartD(0, -74, 70), 'none', `stroke="${c}" stroke-width="10"`) + P(heartD(-20, -64, 8), '#fff', O(0.6))),
  it('f-photo-polaroid-retro', 'Snapshot Easel', 'decor', 'Photo Frames', 'retro', 'prop', 90, 110, (c) =>
    Ln(-24, 0, -6, -100, '#a86b4a', 4) + Ln(24, 0, 6, -100, '#a86b4a', 4) + Ln(0, -2, 0, -60, '#a86b4a', 4) + R(-30, -40, 60, 6, 3, '#a86b4a') +
    G('rotate(-4 0 -70)', R(-32, -110, 64, 74, 3, '#ffffff') + photoScene(-26, -104, 52, 50) + R(-14, -118, 28, 10, 2, c, O(0.85)))),
  // holiday
  it('f-xmas-tinsel-candy', 'Candy Tree', 'decor', 'Holiday', 'candy', 'floor', 230, 330, (c, on) => tieredTree(c, on, ['#fff', '#a8e6cf', '#fff3b0', '#ff4f8b', '#c99bff'], '#ffffff') + giftBox(-80, 40, 30, '#a8e6cf', '#ff4f8b') + giftBox(84, 34, 26, '#fff3b0', '#ff7eb6'), { toggle: true }),
  it('f-xmas-snowy-princess', 'Snowy Tree', 'decor', 'Holiday', 'princess', 'floor', 230, 330, (c, on) => tieredTree('#f4f8ff', on, [c, '#c99bff', '#9fd6ff', '#ffd24a', '#ff9ec7']).replace(/#8a5a3c/, '#ffd9e8') + giftBox(-76, 44, 36, c, '#ffd24a') + giftBox(80, 36, 28, '#c99bff', '#fff'), { toggle: true, color: '#ffc7dc' }),
  it('f-gingerbread-woodland', 'Gingerbread House', 'decor', 'Holiday', 'woodland', 'prop', 110, 110, (c) =>
    E(0, -4, 54, 7, '#fff') + box(-40, -60, 80, 56, 4, '#c98a5a') + P('M-52 -56 L0 -100 L52 -56Z', '#a86b4a') + S('M-50 -58 L0 -98 L50 -58', '#fff', 7) + S('M-40 -60 Q-30 -52 -20 -60 Q-10 -52 0 -60 Q10 -52 20 -60 Q30 -52 40 -60', '#fff', 4) +
    P('M-10 -4 L-10 -28 A10 10 0 0 1 10 -28 L10 -4Z', '#8a5a3c') + R(-34, -46, 16, 14, 2, '#ffe680') + R(18, -46, 16, 14, 2, '#ffe680') + [[-30, -16, '#e8384f'], [26, -16, c], [0, -76, '#ff9ec7'], [-20, -66, '#7cc8ff'], [20, -66, '#ffd36b']].map(([x, y, col]) => C(x as number, y as number, 4, col as string)).join('') +
    R(-56, -40, 8, 36, 4, '#fff') + S('M-56 -34 L-48 -30 M-56 -22 L-48 -18 M-56 -10 L-48 -6', '#e8384f', 3)),
  it('f-lights-snowflake-space', 'Snowflake Lights', 'decor', 'Holiday', 'space', 'wall', 320, 110, (c, on) => {
    let s = swag('#c9cfdd', 2);
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40;
      const y = sag(x) + 14;
      const col = i % 2 ? '#bfe8ff' : '#ffffff';
      s += Ln(x, y - 14, x, y - 4, '#c9cfdd', 1.5) + (on ? halo(x, y + 8, 20, col, 1.4 + (i % 3) * 0.4, i * 0.3) : '') + G(at(x, y + 8, 0.7), A(spin(0, 0, 12, i % 2 === 0), motif('snowflake', 0, 0, 20).replace(/#ffffff/g, on ? col : light(c, 0.6))));
    }
    return s;
  }, { toggle: true }),
  it('f-pumpkins-stack-boho', 'Pumpkin Stack', 'decor', 'Holiday', 'boho', 'floor', 140, 180, (c) => {
    const pk = (y: number, r: number, col: string) => {
      const cy = y - r * 0.75;
      return E(-r * 0.5, cy, r * 0.58, r * 0.72, col) + E(r * 0.5, cy, r * 0.58, r * 0.72, col) + E(0, cy, r * 0.55, r * 0.8, light(col, 0.1)) +
        S(pd`M${-r * 0.3} ${cy - r * 0.7} Q${-r * 0.5} ${cy} ${-r * 0.3} ${cy + r * 0.7} M${r * 0.3} ${cy - r * 0.7} Q${r * 0.5} ${cy} ${r * 0.3} ${cy + r * 0.7}`, dark(col, 0.12), 2.5, O(0.7)) +
        E(0, cy, r * 1.08, r * 0.8, 'url(#g-face)') + E(-r * 0.4, cy - r * 0.35, r * 0.15, r * 0.25, '#fff', O(0.35));
    };
    return R(-3, -212, 6, 14, 2, '#6b8a4a') + leaf(4, -204, 20, 8, 60, '#8fbf6a') + S('M-6 -204 q-10 -10 -4 -18', '#8fbf6a', 2) + pk(-148, 34, '#ffd36b') + pk(-88, 48, '#ffab5e') + pk(0, 66, c === '#f4dca0' ? '#fff3e6' : c);
  }),
  it('f-harvest-basket-woodland', 'Harvest Basket', 'decor', 'Holiday', 'woodland', 'prop', 110, 90, (c) =>
    S('M-40 -50 Q0 -110 40 -50', '#a86b4a', 5) + C(-24, -54, 14, '#e8384f') + C(-20, -58, 4, '#fff', O(0.4)) + E(10, -60, 10, 22, '#ffd24a', 'transform="rotate(30 10 -60)"') + P('M18 -78 L28 -92 L22 -72Z', '#8fbf6a') +
    E(30, -50, 14, 11, '#ffab5e') + C(-2, -48, 12, '#c98aff') + leaf(-36, -50, 20, 7, -60, c) + pot('basket', 90, 44, '#e8c08a')),
  it('f-egg-basket-cottage', 'Egg Basket', 'decor', 'Holiday', 'cottage', 'prop', 110, 100, (c) =>
    S('M-42 -40 Q0 -112 42 -40', '#e8c08a', 6) + [[-26, -46, '#ffb3d9'], [-2, -52, '#fff3b0'], [22, -46, '#b8d8ff'], [-12, -40, c], [12, -40, '#d4b8ff']].map(([x, y, col]) => E(x as number, y as number, 11, 14, col as string) + S(pd`M${(x as number) - 10} ${y as number} q5 -4 10 0 q5 4 10 0`, '#fff', 2) + C((x as number) - 3, (y as number) - 6, 2.5, '#fff', O(0.6))).join('') +
    leaf(-40, -36, 18, 6, -70, LEAF) + leaf(40, -36, 18, 6, 70, LEAF) + pot('basket', 92, 40, '#e8c08a') + G('translate(34 -20) scale(0.5)', bowG(0, 0, 1, '#ff9ec7'))),
  it('f-wreath-spring-sweet', 'Flower Wreath', 'decor', 'Holiday', 'sweet', 'wall', 150, 150, (c) => {
    let s = C(0, 0, 56, 'none', 'stroke="#8fbf6a" stroke-width="22"');
    for (let i = 0; i < 18; i++) { const [x, y] = polar(0, 0, 56, i * 20); s += leaf(x, y, 22, 8, i * 20 + 30, i % 2 ? LEAF : '#8fbf6a', false); }
    for (let i = 0; i < 8; i++) { const [x, y] = polar(0, 0, 56, i * 45 + 10); s += i % 2 ? rose(x, y, 11, c) : bloom(x, y, 12, i % 4 ? '#fff' : '#ffd36b'); }
    return s + G('translate(0 60) scale(1.1)', bowG(0, 0, 1, c));
  }),
  it('f-umbrella-beach-beach', 'Beach Umbrella', 'decor', 'Fun Stuff', 'beach', 'floor', 260, 300, (c) => {
    let s = E(0, -6, 110, 14, '#f4dca0') + R(-4, -250, 8, 248, 4, '#fff');
    const top = 'M-130 -210 Q0 -310 130 -210';
    for (let i = 0; i < 6; i++) { const x0 = -130 + i * 43.3; s += P(pd`M0 -270 L${x0} -210 Q${x0 + 21.6} -196 ${x0 + 43.3} -210Z`, i % 2 ? '#ffffff' : c); }
    s += P(top + ' L0 -270Z', 'none') + S(top, dark(c, 0.1), 2, O(0.3)) + C(0, -272, 7, '#ffab5e');
    return s + G('translate(70 -6)', pot('bucket', 40, 32, '#ffab5e')) + G('translate(-70 -10) scale(0.9)', P(starD(0, -10, 16, 0.55), '#ff7a6b'));
  }),
  it('f-balloon-box-rainbow', 'Balloon Toy Box', 'decor', 'Fun Stuff', 'rainbow', 'floor', 200, 330, (c) => {
    let s = '';
    const bl: [number, number, string][] = [[-54, -250, '#ff7eb6'], [0, -290, '#7cc8ff'], [56, -246, '#c99bff'], [-20, -210, '#7fe0b0'], [30, -200, '#ffab5e']];
    bl.forEach(([x, y, col], i) => (s += A(bob(0, -8, 2.4 + i * 0.4, i * 0.5), S(pd`M${x} ${y + 34} Q${x * 0.4 + 6} ${(y - 110) / 2} 0 -110`, '#c9a2c0', 1.5) + E(x, y, 26, 31, col) + E(x, y, 26, 31, 'url(#g-face)') + P(pd`M${x - 5} ${y + 34} L${x + 5} ${y + 34} L${x} ${y + 28}Z`, col) + E(x - 8, y - 12, 6, 10, '#fff', O(0.5)))));
    return s + box(-90, -112, 180, 104, 14, c) + box(-96, -120, 192, 22, 10, dark(c, 0.06)) + R(-70, -90, 140, 60, 10, '#fff', O(0.25)) + txt(0, -48, 'TOYS', 30, '#ff7eb6') + leg(-72, -12, 12, dark(c, 0.3)) + leg(72, -12, 12, dark(c, 0.3));
  }, { spawn: ['ball', 'beachBall', 'teddyToy', 'duck'], surfaces: [{ x1: -90, x2: 90, y: -120 }] }),
  // screens and stands
  it('f-screen-folding-princess', 'Folding Screen', 'decor', 'Screens & Stands', 'princess', 'floor', 300, 300, (c) => {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const x = -144 + i * 96;
      s += leg(x + 12, -14, 14, GOLD, 8) + leg(x + 80, -14, 14, GOLD, 8) + P(pd`M${x} -16 L${x} -240 Q${x + 46} -296 ${x + 92} -240 L${x + 92} -16Z`, '#ffffff') + cloth(pd`M${x + 8} -24 L${x + 8} -236 Q${x + 46} -282 ${x + 84} -236 L${x + 84} -24Z`, i === 1 ? light(c, 0.2) : c, 'hearts');
      s += S(pd`M${x} -16 L${x} -240 Q${x + 46} -296 ${x + 92} -240 L${x + 92} -16`, GOLD, 4) + G(at(x + 46, -150, 0.6), motif(i === 1 ? 'crown' : 'heart', 0, 0, 20));
    }
    return s;
  }),
  it('f-screen-rattan-boho', 'Rattan Screen', 'decor', 'Screens & Stands', 'boho', 'floor', 280, 300, (c) => {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const x = -138 + i * 92;
      s += box(x, -290, 88, 280, 8, '#c98a5a') + R(x + 10, -278, 68, 256, 4, c);
      for (let k = 0; k < 9; k++) for (let j = 0; j < 3; j++) s += C(x + 22 + j * 22, -264 + k * 28, 9, 'none', `stroke="${dark(c, 0.2)}" stroke-width="2"`);
      s += leg(x + 14, -12, 12, '#a86b4a') + leg(x + 74, -12, 12, '#a86b4a');
    }
    return s;
  }),
  it('f-coatstand-tree-woodland', 'Tree Coat Stand', 'decor', 'Screens & Stands', 'woodland', 'floor', 170, 330, (c) =>
    E(0, -6, 50, 9, '#8a5a3c') + S('M-40 -4 Q-10 -20 0 -40 Q10 -20 40 -4', '#a86b4a', 10) + R(-8, -300, 16, 270, 8, '#a86b4a') +
    S('M0 -200 Q-30 -220 -54 -250 M0 -240 Q30 -260 52 -290 M0 -150 Q30 -170 50 -190 M0 -280 Q-20 -300 -36 -316', '#a86b4a', 8) + leaf(-54, -250, 24, 10, -40, '#8fbf6a') + leaf(52, -290, 24, 10, 40, '#8fbf6a') + leaf(-36, -316, 20, 8, -20, '#8fbf6a') +
    P('M-74 -232 Q-54 -268 -34 -232 Z', c) + E(-54, -232, 28, 6, dark(c, 0.15)) + cloth('M44 -192 Q58 -196 62 -180 L70 -110 L54 -110 L50 -170Z', '#ffab5e', 'stripes') + cloth('M60 -110 L76 -110 L76 -96 L60 -96Z', '#ffab5e')),
  it('f-coatstand-retro', 'Hat Stand', 'decor', 'Screens & Stands', 'retro', 'floor', 150, 320, (c) =>
    Ln(0, -20, -44, 0, '#e8b46a', 7) + Ln(0, -20, 44, 0, '#e8b46a', 7) + Ln(0, -20, 0, 0, '#e8b46a', 7) + R(-6, -300, 12, 284, 6, '#e8b46a') +
    [[-36, -280], [36, -280], [-30, -230], [30, -230]].map(([x, y]) => Ln(0, y + 14, x, y, '#e8b46a', 6) + C(x, y, 8, c)).join('') + C(0, -306, 10, c) +
    E(0, -284, 40, 8, '#ffd36b') + P('M-24 -286 Q-24 -318 0 -318 Q24 -318 24 -286Z', '#ffd36b') + R(-24, -296, 48, 8, 0, c) + S('M30 -224 Q50 -180 34 -120 Q28 -100 40 -96', '#5fd3b5', 9)),
];

// =====================================================================================
// YARD
// =====================================================================================
const WATER = '#7cc8ff';
const ripples = (x0: number, x1: number, y: number, col = '#ffffff') =>
  `<g>${bob(14, 0, 3)}${S(Array.from({ length: Math.ceil((x1 - x0) / 40) }, (_, i) => pd`M${x0 + i * 40} ${y} q10 -5 20 0 q10 5 20 0`).join(' '), col, 3, O(0.65))}</g>`;
const smoke = (x: number, y: number) => [0, 1, 2].map((i) => `<circle cx="${f(x + (i - 1) * 12)}" cy="${f(y)}" r="12" fill="#ffffff" opacity="0"><animate attributeName="cy" values="${f(y)};${f(y - 90)}" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/><animate attributeName="r" values="8;22" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.7;0" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/></circle>`).join('');
const plank = (x: number, y: number, w: number, h: number, col: string) => box(x, y, w, h, 4, col) + S(pd`M${x + 8} ${y + h * 0.5} L${x + w * 0.3} ${y + h * 0.5}`, dark(col, 0.12), 2, O(0.6));
/** What grows in a garden bed, by season. */
function bedPlants(x0: number, x1: number, y: number, kind: 'flowers' | 'veggies', c: string): string {
  const se = artCtx.season;
  let s = '';
  const n = Math.round((x1 - x0) / 34);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const h = 24 + ((i * 17) % 22);
    if (se === 'winter') { s += leaf(x, y, 22, 7, (i % 2 ? 20 : -20), '#5f9a7a', false) + E(x, y - 2, 14, 6, '#fff'); continue; }
    if (kind === 'veggies') {
      if (i % 3 === 0) s += C(x, y - 14, 18, '#9fd88a') + C(x, y - 14, 11, '#c4ecb0') + S(pd`M${x} ${y - 25} L${x} ${y - 3}`, '#7fc06a', 2);
      else if (i % 3 === 1) s += leaf(x, y, 30, 6, -16, LEAF) + leaf(x, y, 34, 6, 10, LEAF_D) + P(pd`M${x - 7} ${y - 2} L${x + 7} ${y - 2} L${x} ${y + 12}Z`, '#ff8a3d');
      else s += S(pd`M${x} ${y} L${x} ${y - 40}`, '#6fae5a', 3) + leaf(x, y - 20, 20, 8, -50) + C(x + 6, y - 32, 7, se === 'fall' ? '#ffab3d' : '#e8384f') + C(x - 6, y - 22, 6, se === 'fall' ? '#ffab3d' : '#e8384f');
      continue;
    }
    s += S(pd`M${x} ${y} L${x} ${y - h}`, STEM, 3) + leaf(x, y, 18, 6, i % 2 ? 40 : -40);
    if (se === 'spring') s += tulip(x, y - h - 4, 9, [c, '#ffd36b', '#ffffff', '#c99bff'][i % 4]);
    else if (se === 'fall') s += bloom(x, y - h, 11, ['#ff8a3d', '#e8573d', '#ffc23d'][i % 3], 8, '#8a5a3c');
    else s += i % 2 ? daisy(x, y - h, 13) : bloom(x, y - h, 12, [c, '#ffd36b', '#c99bff'][i % 3]);
  }
  if (se === 'fall' && kind === 'flowers') s += E(x0 + 20, y - 8, 14, 10, '#ff8a3d') + R(x0 + 18, y - 22, 4, 6, 1, '#6b8a4a');
  return s;
}
const hammockFabric = (c: string, pat: string) => cloth('M-170 -184 Q0 -60 170 -184 L170 -176 Q0 -20 -170 -176Z', c, pat, 'y');
const hammockFront = (c: string, on: boolean) => `<g>${on ? rock(3, 0, -280, 3) : ''}${cloth('M-170 -178 Q0 -60 170 -178 L170 -170 Q0 -18 -170 -170Z', light(c, 0.15), 'none', 'y')}${S('M-160 -168 Q0 -40 160 -168', '#fff', 3, 'stroke-dasharray="2 8" opacity="0.8"')}${Array.from({ length: 13 }, (_, i) => { const t = (i + 1) / 14; const x = -170 + 340 * t; const y = (1 - t) * (1 - t) * -170 + 2 * (1 - t) * t * -18 + t * t * -170; return Ln(x, y, x, y + 14, light(c, 0.3), 3); }).join('')}</g>`;
const palmTrunk = (x: number, dir: number) => {
  let s = S(pd`M${x} 0 Q${x - dir * 10} -120 ${x + dir * 6} -250`, '#c98a5a', 22) + Array.from({ length: 8 }, (_, i) => S(pd`M${x - 11 + dir * (i * 0.5)} ${-20 - i * 28} l22 -4`, '#a86b4a', 2.5)).join('');
  for (const a of [-80, -40, 0, 40, 80, 120, -120]) { const p0: [number, number] = [x + dir * 6, -250]; const [ex, ey] = along(p0[0], p0[1], 90, a, 1); const p2: [number, number] = [ex, ey + 30]; for (let t = 0.15; t < 1; t += 0.12) { const q = qb(p0, [(p0[0] + ex) / 2, ey - 10], p2, t); s += P(leafD(q.x, q.y, 20, 4, q.ang + 100), LEAF) + P(leafD(q.x, q.y, 20, 4, q.ang - 100), LEAF_D); } s += S(pd`M${p0[0]} ${p0[1]} Q${(p0[0] + ex) / 2} ${ey - 10} ${p2[0]} ${p2[1]}`, '#5fae6b', 3); }
  return s + C(x + dir * 2, -246, 8, '#8a5a3c') + C(x + dir * 14, -242, 8, '#8a5a3c');
};

const YARD: FurnDef[] = [
  // pools
  it('f-pool-sweet', 'Heart Pool', 'yard', 'Pools', 'sweet', 'floor', 380, 170, (c) =>
    R(-170, -150, 340, 12, 6, '#ffffff') + R(-162, -142, 324, 20, 4, '#5aa8e6') + R(-162, -126, 324, 26, 4, WATER) + R(-162, -126, 324, 10, 4, '#fff', O(0.25)),
  {
    front: (c) => `<rect x="-162" y="-132" width="324" height="30" fill="${WATER}" opacity="0.55"/>` + ripples(-150, 150, -122) +
      box(-180, -106, 360, 16, 8, '#ffffff') + box(-172, -94, 344, 94, 10, c, 'hearts') + R(-172, -94, 344, 10, 4, '#fff', O(0.3)) +
      S('M150 -106 L150 -170 Q150 -180 160 -180 M176 -106 L176 -170 Q176 -180 186 -180 M150 -130 L176 -130 M150 -152 L176 -152', SILVER, 5) +
      G('translate(-110 -112)', E(0, 0, 30, 10, '#ffd36b') + E(0, 0, 14, 4, light(WATER, 0.3)) + S('M-26 -4 Q0 -14 26 -4', '#fff', 4, O(0.6))) + P(heartD(0, -76, 40), '#ffffff', O(0.85)),
    seats: [{ x: -60, y: -80, pose: 'sit' }, { x: 70, y: -80, pose: 'sit' }],
  }),
  it('f-pool-donut-candy', 'Donut Pool', 'yard', 'Pools', 'candy', 'floor', 320, 160, (c) =>
    E(0, -118, 150, 26, light(c, 0.15)) + E(0, -116, 128, 18, '#5aa8e6') + E(0, -112, 124, 14, WATER),
  {
    front: (c) => `<ellipse cx="0" cy="-108" rx="124" ry="16" fill="${WATER}" opacity="0.5"/>` + ripples(-100, 100, -108) +
      box(-160, -100, 320, 50, 25, c) + box(-156, -56, 312, 54, 26, light(c, 0.2)) + R(-150, -96, 140, 10, 5, '#fff', O(0.45)) +
      [[-120, -78], [-60, -84], [10, -80], [80, -84], [130, -72], [-90, -30], [40, -26], [110, -30]].map(([x, y], i) => R(x, y, 12, 4, 2, ['#fff', '#a8e6cf', '#fff3b0', '#7cc8ff'][i % 4], `transform="rotate(${i * 40} ${x + 6} ${y + 2})"`)).join('') +
      G('translate(150 -46) scale(0.9)', C(0, 0, 24, '#fff', 'stroke="#ff7eb6" stroke-width="10"')),
    seats: [{ x: 0, y: -74, pose: 'sit' }],
  }),
  // trampolines
  it('f-trampoline-sweet', 'Trampoline', 'yard', 'Trampolines', 'sweet', 'floor', 320, 130, (c, on) => {
    let s = [-120, -40, 40, 120].map((x) => S(pd`M${x} -78 Q${x * 1.08} -36 ${x * 1.12} 0`, '#9aa3b5', 8)).join('');
    s += E(0, -80, 150, 26, c) + E(0, -80, 150, 26, 'url(#g-face)') + E(0, -82, 128, 18, '#4a3f5e');
    s += `<g>${on ? `<animateTransform attributeName="transform" type="translate" values="0 6;0 0;0 6" dur="0.9s" repeatCount="indefinite" ${SPL}/>` : ''}${E(0, -82, 120, 15, '#5a4f6e')}${P(starD(0, -82, 16, 0.5), light(c, 0.2), 'transform="matrix(1 0 0 0.35 0 -53.3)"')}</g>`;
    for (let i = 0; i < 16; i++) { const [x, y] = polar(0, -80, 1, i * 22.5); s += C(x * 140, -80 + (y + 80) * 22, 3, '#fff', O(0.7)); }
    return s + E(0, -78, 150, 26, 'none', `stroke="${dark(c, 0.15)}" stroke-width="3"`);
  }, { animWhenUsed: true, seats: [{ x: 0, y: -82, pose: 'sit', anim: { kind: 'bounce', pivot: [0, 0], amp: 46, dur: 0.9 } }] }),
  it('f-trampoline-space', 'Star Trampoline', 'yard', 'Trampolines', 'space', 'floor', 320, 300, (c, on) => {
    let s = [-130, 130].map((x) => Ln(x, 0, x, -290, '#c9cfdd', 7)).join('') + [-120, -40, 40, 120].map((x) => S(pd`M${x} -78 Q${x * 1.08} -36 ${x * 1.12} 0`, '#c9cfdd', 8)).join('');
    s += E(0, -80, 150, 26, c) + E(0, -82, 128, 18, '#2d2a5a') + `<g>${on ? `<animateTransform attributeName="transform" type="translate" values="0 6;0 0;0 6" dur="0.9s" repeatCount="indefinite" ${SPL}/>` : ''}${E(0, -82, 120, 15, '#3d3a6e')}</g>`;
    s += P('M-130 -290 Q0 -250 130 -290 L130 -90 Q0 -60 -130 -90Z', '#ffffff', O(0.12)) + S('M-130 -290 Q0 -250 130 -290', '#ffe680', 5);
    for (let i = 0; i < 9; i++) s += Ln(-130 + i * 32.5, -290 + Math.sin((i / 8) * Math.PI) * 20, -130 + i * 32.5, -86 + Math.sin((i / 8) * Math.PI) * 14, '#ffffff', 1.2, O(0.5));
    return s + starsField([[-130, -300, 12], [130, -300, 12], [0, -278, 9]], '#ffe680') + E(0, -78, 150, 26, 'none', 'stroke="#ffe680" stroke-width="3" stroke-dasharray="4 10"');
  }, { animWhenUsed: true, seats: [{ x: 0, y: -82, pose: 'sit', anim: { kind: 'bounce', pivot: [0, 0], amp: 46, dur: 0.9 } }] }),
  // barbecues
  it('f-bbq-sweet', 'BBQ Grill', 'yard', 'BBQ Grills', 'sweet', 'floor', 260, 250, (c, on) => {
    let s = leg(-60, -90, 76, '#9aa3b5', 10) + leg(60, -90, 76, '#9aa3b5', 10) + C(-60, -14, 14, '#4a4a5e') + C(60, -14, 14, '#4a4a5e') + C(-60, -14, 5, '#c9cfdd') + C(60, -14, 5, '#c9cfdd') + R(-60, -50, 120, 8, 4, '#c9cfdd');
    s += box(-120, -130, 54, 10, 4, '#ffffff') + leg(-112, -122, 70, '#c9cfdd', 6) + C(-100, -136, 7, '#e8384f') + R(-86, -140, 14, 10, 3, '#ffd36b');
    if (on) s += smoke(0, -190) + flame(-40, -150, 0.7) + flame(-10, -152, 0.8) + flame(24, -150, 0.7) + flame(52, -150, 0.6) + glow(0, -150, 70);
    s += box(-80, -150, 160, 62, 14, c) + R(-80, -150, 160, 8, 4, '#4a4a5e') + Ln(-76, -156, 76, -156, SILVER, 4);
    if (on) s += R(-56, -166, 36, 12, 6, '#c96a4a') + R(-12, -166, 36, 12, 6, '#d97a5a') + C(44, -162, 9, '#e8b46a') + C(44, -162, 3, '#c98a3e') + P('M-80 -150 Q-80 -230 0 -238 L-4 -226 Q-70 -220 -70 -150Z', dark(c, 0.06));
    else s += cloth('M-80 -150 Q-80 -220 0 -222 Q80 -220 80 -150Z', c) + R(-20, -228, 40, 12, 6, '#4a4a5e') + P(heartD(0, -200, 22), '#fff', O(0.85));
    return s + C(-50, -118, 6, '#fff') + C(-30, -118, 6, '#fff') + R(50, -124, 20, 12, 3, '#4a4a5e');
  }, { toggle: true, surfaces: [{ x1: -120, x2: -70, y: -130 }] }),
  it('f-bbq-kettle-retro', 'Kettle Grill', 'yard', 'BBQ Grills', 'retro', 'floor', 180, 230, (c, on) => {
    let s = Ln(-10, -100, -60, 0, '#4a4a5e', 7) + Ln(10, -100, 60, 0, '#4a4a5e', 7) + Ln(0, -100, 0, -6, '#4a4a5e', 7) + C(60, -6, 9, '#4a4a5e') + R(-40, -50, 80, 6, 3, '#9aa3b5');
    if (on) s += smoke(0, -180) + flame(-26, -140, 0.6) + flame(0, -144, 0.75) + flame(26, -140, 0.6) + glow(0, -140, 60) + R(-40, -152, 30, 10, 5, '#c96a4a') + R(8, -152, 30, 10, 5, '#d97a5a');
    s += P('M-70 -140 Q-70 -84 0 -84 Q70 -84 70 -140Z', c) + P('M-70 -140 Q-70 -84 0 -84 Q70 -84 70 -140Z', SHX) + R(-74, -144, 148, 8, 4, SILVER) + C(0, -108, 6, '#fff3d6');
    if (on) s += G('rotate(-40 -70 -144)', P('M-70 -144 Q-70 -196 0 -196 Q70 -196 70 -144Z', c) + R(-10, -206, 20, 10, 4, '#4a4a5e'));
    else s += P('M-70 -144 Q-70 -200 0 -200 Q70 -200 70 -144Z', c) + P('M-70 -144 Q-70 -200 0 -200 Q70 -200 70 -144Z', SHX) + R(-12, -210, 24, 12, 5, '#4a4a5e') + E(-30, -176, 10, 6, '#fff', O(0.35)) + P(starD(0, -168, 12), '#ffd36b');
    return s;
  }, { toggle: true }),
  // picnic tables
  it('f-picnic-sweet', 'Picnic Table', 'yard', 'Picnic Tables', 'sweet', 'floor', 420, 150, (c) => {
    const bench = (x: number) => box(x - 70, -86, 140, 16, 6, '#e8b88a') + leg(x - 54, -72, 72, '#c98a5a', 10) + leg(x + 54, -72, 72, '#c98a5a', 10);
    return bench(-150) + bench(150) + Ln(-70, 0, -30, -130, '#c98a5a', 12) + Ln(70, 0, 30, -130, '#c98a5a', 12) + R(-80, -64, 160, 8, 4, '#c98a5a') +
      box(-110, -140, 220, 16, 6, '#e8b88a') + cloth('M-104 -146 L104 -146 L110 -110 Q90 -100 80 -112 Q70 -100 55 -112 Q40 -100 28 -112 Q14 -100 0 -112 Q-14 -100 -28 -112 Q-40 -100 -55 -112 Q-70 -100 -80 -112 Q-90 -100 -110 -110Z', c, 'check', 'y');
  }, { seats: [{ x: -150, y: -84, pose: 'sit' }, { x: 150, y: -84, pose: 'sit' }], surfaces: [{ x1: -100, x2: 100, y: -146 }] }),
  // hammocks
  it('f-hammock-sweet', 'Hammock', 'yard', 'Hammocks', 'sweet', 'floor', 420, 300, (c, on) => {
    let s = box(-200, -14, 400, 14, 6, '#c98a5a') + S('M-190 -8 Q-210 -150 -186 -260', '#c98a5a', 14) + S('M190 -8 Q210 -150 186 -260', '#c98a5a', 14) + C(-186, -262, 9, '#a86b4a') + C(186, -262, 9, '#a86b4a');
    s += `<g>${on ? rock(3, 0, -280, 3) : ''}${S('M-186 -256 L-170 -184 M-186 -256 L-160 -186 M186 -256 L170 -184 M186 -256 L160 -186', '#f4e6c8', 2.5)}${hammockFabric(c, 'stripes')}</g>`;
    return s;
  }, { animWhenUsed: true, front: (c, on) => hammockFront(c, on), seats: [{ x: 70, y: -112, pose: 'sleep', anim: { pivot: [0, -280], amp: 3, dur: 3 } }] }),
  it('f-hammock-palm-beach', 'Palm Hammock', 'yard', 'Hammocks', 'beach', 'floor', 440, 360, (c, on) =>
    palmTrunk(-200, -1) + palmTrunk(200, 1) + `<g>${on ? rock(3, 0, -280, 3) : ''}${S('M-196 -206 L-170 -184 M196 -206 L170 -184', '#f4e6c8', 3)}${hammockFabric(c, 'stripes')}</g>`,
  { animWhenUsed: true, front: (c, on) => hammockFront(c, on), seats: [{ x: 70, y: -112, pose: 'sleep', anim: { pivot: [0, -280], amp: 3, dur: 3 } }] }),
  // garden beds
  it('f-gardenbed-sweet', 'Garden Bed', 'yard', 'Garden Beds', 'sweet', 'floor', 260, 150, (c) =>
    bedPlants(-100, 100, -62, 'flowers', c) + E(0, -62, 116, 8, '#8a5a3c') + plank(-124, -66, 248, 24, c) + plank(-124, -40, 248, 24, dark(c, 0.06)) + leg(-112, -18, 18, dark(c, 0.3), 14) + leg(112, -18, 18, dark(c, 0.3), 14) + P(heartD(0, -58, 14), '#fff', O(0.85))),
  it('f-gardenbed-veggie-woodland', 'Veggie Patch', 'yard', 'Garden Beds', 'woodland', 'floor', 280, 170, (c) =>
    bedPlants(-110, 110, -46, 'veggies', c) + E(0, -46, 126, 8, '#7a4a30') + plank(-134, -50, 268, 24, '#c98a5a') + plank(-134, -26, 268, 24, '#b07a4f') +
    G('translate(118 -50)', R(-3, -70, 6, 70, 2, '#a86b4a') + box(-30, -96, 60, 30, 4, '#f4ead9') + txt(0, -74, 'YUM', 16, c, '#f4ead9'))),
  // playhouses
  it('f-playhouse-sweet', 'Playhouse', 'yard', 'Playhouses', 'sweet', 'floor', 320, 360, (c, on) => {
    let s = R(70, -330, 30, 70, 4, '#ffffff') + P(heartD(85, -352, 14), c) + box(-130, -220, 260, 220, 8, '#fff3f8') + R(-130, -220, 260, 220, 8, 'url(#p-stripes)', O(0.4));
    let roof = 'M-160 -210 L0 -340 L160 -210';
    s += cloth(roof + 'Z', c) + S(roof, dark(c, 0.15), 10);
    for (let k = 0; k < 3; k++) { const y = -226 - k * 32; const hw = 140 - k * 40; for (let x = -hw; x < hw; x += 26) s += P(pd`M${x} ${y} Q${x + 13} ${y + 14} ${x + 26} ${y}`, light(c, 0.25)); }
    s += C(0, -260, 18, '#fff') + C(0, -260, 13, SKY) + S('M-13 -260 L13 -260 M0 -273 L0 -247', '#fff', 3);
    const door = 'M-40 0 L-40 -110 A40 40 0 0 1 40 -110 L40 0Z';
    if (on) s += P(door, '#7a4a6a') + glow(0, -80, 70) + [-28, -12, 6, 22].map((x, i) => halo(x, -128 + (i % 2) * 8, 8, '#fff6c8', 1.4, i * 0.3) + C(x, -128 + (i % 2) * 8, 3.5, '#fff6c8')).join('') + cloth('M-40 0 L-40 -110 Q-46 -150 -66 -150 L-66 10Z', c) + C(-58, -60, 4, GOLD);
    else s += cloth(door, c) + P(heartD(0, -126, 22), '#fff', O(0.85)) + C(26, -60, 5, GOLD);
    s += box(-112, -170, 56, 56, 6, '#fff') + R(-104, -162, 40, 40, 2, on ? '#ffe7a6' : SKY) + R(-104, -162, 40, 40, 2, GLASS) + S('M-84 -162 L-84 -122 M-104 -142 L-64 -142', '#fff', 3);
    s += box(56, -170, 56, 56, 6, '#fff') + R(64, -162, 40, 40, 2, on ? '#ffe7a6' : SKY) + R(64, -162, 40, 40, 2, GLASS) + S('M84 -162 L84 -122 M64 -142 L104 -142', '#fff', 3);
    s += box(-118, -112, 68, 16, 5, c) + box(50, -112, 68, 16, 5, c) + [-106, -84, -62, 62, 84, 106].map((x, i) => bloom(x, -116, 9, i % 2 ? '#fff' : '#ffd36b')).join('');
    return s + box(-60, -8, 120, 10, 4, '#e8c08a');
  }, { toggle: true }),
  it('f-playhouse-castle-princess', 'Castle Playhouse', 'yard', 'Playhouses', 'princess', 'floor', 360, 400, (c, on) => {
    const tower = (x: number, h: number) => box(x - 40, -h, 80, h, 4, c) + P(pd`M${x - 50} ${-h} L${x} ${-h - 90} L${x + 50} ${-h}Z`, '#c99bff') + P(pd`M${x - 50} ${-h} L${x} ${-h - 90} L${x + 50} ${-h}Z`, SHX) +
      Ln(x, -h - 90, x, -h - 118, '#c9cfdd', 3) + A(rock(6, x, -h - 118, 2), P(pd`M${x} ${-h - 118} L${x + 26} ${-h - 110} L${x} ${-h - 102}Z`, '#ff4f8b')) + P(pd`M${x - 10} ${-h + 50} L${x - 10} ${-h + 34} A10 10 0 0 1 ${x + 10} ${-h + 34} L${x + 10} ${-h + 50}Z`, on ? '#ffe7a6' : '#7a5a8a');
    let s = tower(-130, 280) + tower(130, 280) + box(-100, -220, 200, 220, 4, light(c, 0.2)) + R(-100, -220, 200, 220, 4, BIG('hearts'), O(0.4));
    for (let i = 0; i < 5; i++) s += box(-100 + i * 44, -246, 28, 30, 3, light(c, 0.2));
    const door = 'M-46 0 L-46 -100 A46 46 0 0 1 46 -100 L46 0Z';
    if (on) s += P(door, '#7a4a6a') + glow(0, -70, 70) + cloth('M-46 0 L-46 -100 Q-52 -140 -72 -142 L-72 10Z', '#ffffff') + P(heartD(0, -96, 18), '#fff6c8', O(0.6));
    else s += cloth(door, '#ffffff') + S('M-46 -100 A46 46 0 0 1 46 -100', GOLD, 6) + Ln(0, -146, 0, 0, '#e6dcef', 2) + C(-10, -60, 5, GOLD) + C(10, -60, 5, GOLD);
    return s + G('translate(0 -178) scale(1.4)', motif('crown', 0, 0, 20)) + box(-70, -8, 140, 10, 4, GOLD);
  }, { toggle: true }),
  // garden benches and swings
  it('f-gardenbench-cottage', 'Garden Bench', 'yard', 'Benches & Swings', 'cottage', 'floor', 280, 180, (c) =>
    S('M-120 -10 L-120 -176 M120 -10 L120 -176', '#ffffff', 12) + P('M-124 -176 Q0 -206 124 -176 L124 -150 Q0 -170 -124 -150Z', '#ffffff') + [-90, -60, -30, 0, 30, 60, 90].map((x) => R(x - 9, -164 + Math.abs(x) * 0.12, 18, 64, 6, c)).join('') +
    box(-130, -96, 260, 20, 8, c) + R(-130, -96, 260, 6, 3, '#fff', O(0.4)) + leg(-110, -80, 80, '#ffffff', 12) + leg(110, -80, 80, '#ffffff', 12) + S('M-138 -120 Q-150 -100 -132 -94 M138 -120 Q150 -100 132 -94', '#ffffff', 10) + G('translate(0 -186) scale(0.6)', motif('daisy', 0, 0, 20)),
  { seats: [{ x: -60, y: -90, pose: 'sit' }, { x: 60, y: -90, pose: 'sit' }] }),
  it('f-swing-arch-rainbow', 'Rainbow Swing', 'yard', 'Benches & Swings', 'rainbow', 'floor', 300, 340, (c, on) => {
    let s = ['#ff7eb6', '#ffab5e', c, '#7fe0b0', '#7cc8ff'].map((col, i) => S(pd`M${-134 + i * 9} 0 L${-134 + i * 9} -190 A${134 - i * 9} ${134 - i * 9} 0 0 1 ${134 - i * 9} -190 L${134 - i * 9} 0`, col, 9)).join('');
    s += cloudG(-120, -4, 1.3) + cloudG(120, -4, 1.3);
    s += `<g>${on ? rock(18, 0, -290, 2.4) : ''}${Ln(-34, -290, -34, -72, '#c9a2c0', 3)}${Ln(34, -290, 34, -72, '#c9a2c0', 3)}${box(-44, -76, 88, 14, 6, '#ffffff')}${P(heartD(0, -76, 10), '#ff7eb6')}</g>`;
    return s + R(-44, -296, 88, 10, 5, '#ffffff');
  }, { animWhenUsed: true, seats: [{ x: 0, y: -74, pose: 'sit', anim: { pivot: [0, -290], amp: 18, dur: 2.4 } }] }),
  it('f-porchswing-boho', 'Porch Swing', 'yard', 'Benches & Swings', 'boho', 'floor', 340, 340, (c, on) => {
    let s = Ln(-160, 0, -150, -320, '#c98a5a', 12) + Ln(160, 0, 150, -320, '#c98a5a', 12) + R(-170, -326, 340, 16, 6, '#a86b4a') + leaf(-150, -320, 34, 10, -60, '#8fbf6a') + leaf(150, -320, 34, 10, 60, '#8fbf6a') + trail(-120, -312, 80, -8) + trail(120, -312, 70, 8);
    s += `<g>${on ? rock(6, 0, -310, 3) : ''}${Ln(-104, -310, -104, -150, '#f4e6c8', 3)}${Ln(104, -310, 104, -150, '#f4e6c8', 3)}${box(-110, -170, 220, 80, 14, '#e8c08a')}${[-90, -60, -30, 0, 30, 60, 90].map((x) => Ln(x, -164, x, -96, '#c98a5a', 2)).join('')}${box(-116, -104, 232, 22, 8, '#c98a5a')}${box(-100, -122, 200, 20, 10, c, 'none', 'y')}${box(-96, -160, 50, 40, 12, '#e8907a')}${box(48, -160, 50, 40, 12, '#fff3e6')}</g>`;
    return s;
  }, { animWhenUsed: true, seats: [{ x: -50, y: -112, pose: 'sit', anim: { pivot: [0, -310], amp: 6, dur: 3 } }, { x: 50, y: -112, pose: 'sit', anim: { pivot: [0, -310], amp: 6, dur: 3 } }] }),
  // patio and loungers
  it('f-patio-umbrella-retro', 'Patio Table', 'yard', 'Patio', 'retro', 'floor', 300, 330, (c) => {
    let s = R(-5, -300, 10, 300, 4, '#c9cfdd') + E(0, -6, 40, 8, '#9aa3b5');
    s += P('M-150 -250 Q0 -340 150 -250Z', c) + P('M-150 -250 Q0 -340 150 -250Z', SHX);
    for (let i = 0; i < 6; i++) s += P(pd`M${-150 + i * 50} -250 Q${-125 + i * 50} -226 ${-100 + i * 50} -250Z`, i % 2 ? '#fff3d6' : c) + Ln(-125 + i * 50, -236, -125 + i * 50, -224, '#ffd36b', 3);
    s += [-100, -50, 0, 50, 100].map((x) => S(pd`M0 -310 Q${x * 0.6} -300 ${x * 1.3} -252`, dark(c, 0.15), 2, O(0.5))).join('') + C(0, -312, 7, '#ffd36b');
    return s + Ln(-60, -2, -20, -110, '#c9cfdd', 6) + Ln(60, -2, 20, -110, '#c9cfdd', 6) + E(0, -114, 92, 14, '#5fd3b5') + E(0, -118, 92, 12, '#7fe0c4') + E(-30, -120, 36, 3, '#fff', O(0.4));
  }, { surfaces: [{ x1: -86, x2: -12, y: -122 }, { x1: 12, x2: 86, y: -122 }] }),
  it('f-lounger-beach', 'Sun Lounger', 'yard', 'Patio', 'beach', 'floor', 320, 170, (c) =>
    leg(-120, -50, 50, '#ffffff', 8) + leg(110, -50, 50, '#ffffff', 8) + box(-130, -66, 260, 16, 6, '#ffffff') + P('M-130 -64 L-150 -150 L-128 -156 L-104 -64Z', '#ffffff') +
    cloth('M-100 -82 L126 -82 L126 -64 L-100 -64Z', c, 'stripes', 'y') + cloth('M-102 -70 L-140 -146 L-124 -152 L-86 -78Z', c, 'stripes') + E(-130, -146, 22, 10, '#fff3d6') + G('translate(150 -6)', box(-24, -50, 48, 44, 6, '#f4dca0') + R(-16, -76, 12, 30, 4, '#ff9ec7') + R(-14, -84, 8, 10, 3, '#fff') + C(10, -60, 9, '#ffd36b')),
  { seats: [{ x: 90, y: -82, pose: 'sleep' }] }),
  // garden decorations
  it('f-birdbath-cottage', 'Bird Bath', 'yard', 'Garden Decor', 'cottage', 'floor', 170, 200, (c) =>
    E(0, -8, 40, 10, '#c9bfb6') + P('M-16 -10 Q-8 -60 -14 -110 L14 -110 Q8 -60 16 -10Z', '#ddd4cc') + P('M-16 -10 Q-8 -60 -14 -110 L14 -110 Q8 -60 16 -10Z', SHX) + P('M-74 -128 Q0 -96 74 -128 Z', '#ddd4cc') + E(0, -128, 74, 12, '#ece4dc') + E(0, -128, 62, 8, WATER) + ripples(-50, 30, -128) +
    G('translate(40 -138)', A(`<animateTransform attributeName="transform" type="rotate" values="0 0 0;0 0 0;30 0 0;0 0 0" keyTimes="0;0.7;0.85;1" dur="4s" repeatCount="indefinite"/>`, E(0, -10, 14, 11, c) + C(10, -22, 9, c) + P('M18 -22 L26 -20 L18 -18Z', '#ffab3d') + C(12, -24, 1.8, INK) + P('M-12 -12 L-24 -18 L-16 -6Z', dark(c, 0.15)) + E(-2, -8, 7, 5, light(c, 0.3)))) + leaf(-20, -10, 30, 10, -40) + leaf(20, -10, 28, 10, 40, LEAF_D) + flowerG(-36, -24, 10, '#ff9ec7')),
  it('f-fountain-princess', 'Garden Fountain', 'yard', 'Garden Decor', 'princess', 'floor', 300, 290, (c, on) => {
    let s = E(0, -40, 140, 22, light(c, 0.3)) + box(-140, -40, 280, 40, 16, c) + E(0, -40, 124, 16, WATER) + R(-12, -140, 24, 100, 6, '#ffffff') + E(0, -140, 64, 12, '#ffffff') + P('M-64 -140 Q0 -110 64 -140Z', '#f4eef8') + E(0, -140, 54, 8, WATER);
    s += R(-6, -200, 12, 60, 4, '#ffffff') + E(0, -200, 30, 7, '#ffffff') + E(0, -200, 24, 5, WATER) + C(0, -214, 10, GOLD);
    if (on) {
      const arc = (d: string, i: number) => `<path d="${d}" fill="none" stroke="#bfe6ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 12" opacity="0.9"><animate attributeName="stroke-dashoffset" values="44;0" dur="0.8s" begin="${f(i * 0.2)}s" repeatCount="indefinite"/></path>`;
      s += arc('M0 -222 Q-30 -250 -50 -140', 0) + arc('M0 -222 Q30 -250 50 -140', 1) + arc('M-40 -142 Q-80 -150 -100 -44', 2) + arc('M40 -142 Q80 -150 100 -44', 3) + ripples(-100, 100, -40) + P(sparkleD(-60, -180, 7), '#fff') + P(sparkleD(70, -110, 6), '#fff');
    }
    return s + [-100, -50, 0, 50, 100].map((x) => P(heartD(x, -26, 10), '#fff', O(0.8))).join('');
  }, { toggle: true }),
  it('f-mailbox-sweet', 'Mailbox', 'yard', 'Garden Decor', 'sweet', 'floor', 130, 200, (c, on) =>
    R(-7, -120, 14, 120, 4, '#ffffff') + leaf(-6, -2, 26, 9, -50) + flowerG(-20, -24, 9, '#ffd36b') + box(-50, -170, 100, 56, 10, c) + P('M-50 -150 Q-50 -190 0 -190 Q50 -190 50 -150Z', c) + P('M-50 -150 Q-50 -190 0 -190 Q50 -190 50 -150Z', SHX) +
    P(heartD(0, -168, 26), '#fff') + (on ? R(-40, -186, 50, 24, 2, '#ffffff', 'transform="rotate(-10 -15 -174)"') + P(heartD(-16, -184, 10), '#ff4f8b') : '') +
    G(on ? 'rotate(-90 56 -140)' : '', R(52, -176, 6, 40, 3, '#e8384f') + R(52, -176, 22, 14, 3, '#e8384f')), { toggle: true }),
  it('f-gnome-woodland', 'Garden Gnome', 'yard', 'Garden Decor', 'woodland', 'floor', 100, 170, (c) =>
    E(-14, -6, 16, 8, '#6b4a3a') + E(14, -6, 16, 8, '#6b4a3a') + P('M-34 -14 Q-38 -70 0 -76 Q38 -70 34 -14Z', '#7cc8ff') + R(-34, -40, 68, 8, 3, '#6b4a3a') + R(-6, -42, 12, 12, 2, GOLD) +
    P('M-26 -70 Q0 -30 26 -70 Q20 -96 0 -98 Q-20 -96 -26 -70Z', '#fff') + E(0, -98, 18, 14, '#fcd2bb') + C(0, -94, 6, '#ffab9e') + C(-8, -104, 2.2, INK) + C(8, -104, 2.2, INK) +
    A(rock(4, 0, -110, 3), P('M-24 -108 Q-20 -150 12 -168 Q6 -140 24 -108Z', c) + P('M-24 -108 Q-20 -150 12 -168 Q6 -140 24 -108Z', SHX) + E(0, -108, 26, 6, dark(c, 0.15))) + C(30, -54, 9, '#fcd2bb') + bloom(34, -70, 10, '#ff9ec7')),
  it('f-fence-picket-cottage', 'Picket Fence', 'yard', 'Garden Decor', 'cottage', 'floor', 320, 150, (c) => {
    let s = R(-160, -96, 320, 14, 4, dark(c, 0.06)) + R(-160, -46, 320, 14, 4, dark(c, 0.06));
    for (let i = 0; i < 9; i++) { const x = -144 + i * 36; s += P(pd`M${x - 13} 0 L${x - 13} -116 L${x} -134 L${x + 13} -116 L${x + 13} 0Z`, c) + P(pd`M${x - 13} 0 L${x - 13} -116 L${x} -134 L${x + 13} -116 L${x + 13} 0Z`, SHX) + C(x, -112, 2.5, dark(c, 0.25)); }
    return s + [-130, -60, 20, 100].map((x, i) => leaf(x, 0, 30, 10, -20) + leaf(x + 6, 0, 28, 10, 30, LEAF_D) + bloom(x + 4, -30, 10, PASTELS[i])).join('');
  }),
  it('f-hedge-bunny-woodland', 'Bunny Topiary', 'yard', 'Garden Decor', 'woodland', 'floor', 170, 260, (c) => {
    const se = artCtx.season;
    const g = se === 'fall' ? '#c9b35a' : c;
    let s = pot('bucket', 90, 60, '#c98a5a') + E(0, -100, 62, 50, g) + C(0, -166, 34, g) + E(-16, -214, 11, 30, g) + E(16, -214, 11, 30, g) + C(54, -88, 16, g);
    for (let i = 0; i < 24; i++) { const [x, y] = polar(0, -110, 30 + (i % 3) * 20, i * 53); s += C(x, y, 5, light(g, 0.15), O(0.6)); }
    s += C(-12, -170, 3.5, INK) + C(12, -170, 3.5, INK) + E(0, -160, 4, 3, '#ff9ec7');
    if (se === 'winter') s += E(0, -144, 30, 8, '#fff') + E(-16, -240, 9, 6, '#fff') + E(16, -240, 9, 6, '#fff') + E(-10, -142, 50, 10, '#fff', O(0.9));
    if (se === 'spring') for (const [x, y] of [[-30, -110], [20, -80], [30, -130], [-10, -186], [40, -100]]) s += flowerG(x, y, 9, '#ffd9e8');
    return s;
  }),
  it('f-doghouse-retro', 'Doggy House', 'yard', 'Garden Decor', 'retro', 'floor', 240, 230, (c) =>
    box(-90, -150, 180, 150, 6, c) + P('M-110 -140 L0 -220 L110 -140Z', '#ffd36b') + S('M-110 -140 L0 -220 L110 -140', '#e8b46a', 10) + P('M-46 0 L-46 -70 A46 46 0 0 1 46 -70 L46 0Z', '#4a3a4e') +
    E(0, -54, 30, 26, '#e8b88a') + E(-28, -58, 10, 22, '#a86b4a', 'transform="rotate(16 -28 -58)"') + E(28, -58, 10, 22, '#a86b4a', 'transform="rotate(-16 28 -58)"') + eyes(0, -60, 10, 3.6) + E(0, -48, 6, 4, INK) + P('M-4 -40 Q0 -30 4 -40Z', '#ff7eb6') +
    R(-24, -28, 48, 8, 4, '#e8384f') + E(-20, -6, 12, 7, '#e8b88a') + E(20, -6, 12, 7, '#e8b88a') + box(-50, -194, 100, 30, 6, '#fff3d6') + txt(0, -172, 'WOOF', 18, '#ff7a6b', '#fff3d6') +
    A(rock(25, 96, -24, 0.5), S('M92 -20 Q110 -30 116 -50', '#e8b88a', 8)) + G('translate(-120 0)', P('M-22 -18 L22 -18 L16 0 L-16 0Z', '#5fd3b5') + E(0, -18, 22, 5, '#c98a5a'))),
  it('f-sandbox-turtle-beach', 'Turtle Sandbox', 'yard', 'Garden Decor', 'beach', 'floor', 330, 140, (c) =>
    E(150, -54, 28, 24, '#7fd39a') + eyes(156, -58, 8, 3) + S('M148 -46 Q156 -40 164 -46', INK, 2) + E(-150, -20, 22, 10, '#7fd39a') + E(-100, -8, 22, 12, '#7fd39a') + E(100, -8, 22, 12, '#7fd39a') +
    P('M-140 -40 Q-140 -84 0 -84 Q140 -84 140 -40 L130 -10 Q0 6 -130 -10Z', '#5fbf80') + E(0, -60, 132, 20, '#f4dca0') + E(-40, -62, 30, 7, '#e8c88a') + E(50, -58, 24, 6, '#e8c88a') +
    [[-90, -30], [-30, -26], [30, -26], [90, -30]].map(([x, y]) => P(pd`M${x - 22} ${y} L${x} ${y - 14} L${x + 22} ${y} L${x} ${y + 12}Z`, '#4fa870')).join('') + G('translate(-60 -64)', pot('bucket', 30, 26, c)) + R(40, -86, 6, 30, 2, '#ffab5e', 'transform="rotate(20 43 -71)"'),
  { spawn: ['bucket', 'ball'], seats: [{ x: 10, y: -58, pose: 'sit' }] }),
  it('f-lantern-post-woodland', 'Garden Lantern', 'yard', 'Garden Decor', 'woodland', 'floor', 120, 260, (c, on) => {
    let s = R(-5, -200, 10, 200, 4, '#6b4a3a') + S('M0 -200 Q0 -226 30 -226 L30 -210', '#6b4a3a', 5) + leaf(0, -60, 30, 10, -40, c) + leaf(0, -90, 26, 9, 40, c);
    s += G('translate(30 -150)', (on ? glow(0, -20, 60) + halo(0, -20, 26, '#fff6c8', 1.8) : '') + P('M-18 -50 L18 -50 L0 -64Z', '#6b4a3a') + R(-16, -50, 32, 50, 4, on ? '#fff3b0' : '#e6f0e0', O(0.85)) + R(-16, -50, 32, 50, 4, GLASS) + S('M-16 -50 L-16 0 M16 -50 L16 0', '#6b4a3a', 3) + R(-20, -4, 40, 6, 3, '#6b4a3a') + (on ? flame(0, -12, 0.5) : ''));
    if (on) s += [[-30, -180], [40, -230], [-40, -110], [50, -80]].map(([x, y], i) => A(bob(10, -12, 2 + i * 0.5, i * 0.4), `<circle cx="${x}" cy="${y}" r="4" fill="#fff3a0">${blink(1 + i * 0.3, i * 0.2, 0.1)}</circle>`)).join('');
    return s;
  }, { toggle: true }),
];

// =====================================================================================
// CATALOG
// =====================================================================================
const ALL: FurnDef[] = [
  ...POTTED, ...CACTI, ...HANGING, ...VASES, ...STANDS,
  ...ART, ...MIRRORS, ...CLOCKS, ...SHELVES, ...WINDOWS, ...DOORS, ...CURTAINS, ...GARLANDS, ...STICKERS, ...POSTERS, ...BOARDS, ...CEILING,
  ...RUGS, ...DECOR, ...YARD,
];
// Prices climb within each catalog section: the first two designs are free.
const seen: Record<string, number> = {};
for (const d of ALL) {
  const k = d.group ?? '';
  const i = seen[k] ?? 0;
  seen[k] = i + 1;
  if (d.price < 0) d.price = stylePrice(i);
}
export const DECOR_MORE: FurnDef[] = ALL;
