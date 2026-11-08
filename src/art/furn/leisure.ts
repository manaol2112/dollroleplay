// Library, cinema and hotel catalog: bookshelves, reading nooks, story rugs and book carts; movie
// screens, cinema seats, popcorn machines and snack bars; reception desks, luggage carts, hotel beds
// and lobby pieces. It also draws the town-map fronts of these three buildings. Floor items and props
// sit on their base at (0, 0); wall items and rugs are centred on (0, 0).
import type { Season } from '../../types';
import {
  type FurnCat, type FurnDef, type Mount, type SeatDef, C, E, Ln, P, R, box, cloth, dark, f, glow, heartD, light, motif, starD, sparkleD,
  flowerG, bowG, FURN_STYLE_BY_ID, stylePrice,
} from './kit';

type Draw = (c: string, on: boolean) => string;
const ST = FURN_STYLE_BY_ID;
const INK = '#2d2a3a';
const GOLD = 'url(#g-gold)';
const SILVER = 'url(#g-silver)';
const RB = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#b48cff'];
const BOOKC = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b', '#e85d5d', '#a8e6cf'];
const FONT = 'font-family="Fredoka, sans-serif" font-weight="700"';

// ---------------- small drawing helpers ----------------
const sc = (n: number) => n.toFixed(3);
const S = (d: string, c: string, w = 3, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (inner: string, attr = '') => `<g ${attr}>${inner}</g>`;
const at = (x: number, y: number, s = 1) => `transform="translate(${f(x)} ${f(y)}) scale(${sc(s)})"`;
const T = (x: number, y: number, t: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" ${FONT} font-size="${size}" text-anchor="middle" fill="${fill}" ${extra}>${t}</text>`;
/** Draws a part on both sides: fn(1) for the right, fn(-1) for the mirrored left. */
const sym = (fn: (k: number) => string) => fn(1) + fn(-1);
const ease = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
const spin = (cx: number, cy: number, dur: number, dir = 1) =>
  `<animateTransform attributeName="transform" type="rotate" values="0 ${f(cx)} ${f(cy)};${dir * 360} ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/>`;
const sway = (deg: number, cx: number, cy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${-deg} ${f(cx)} ${f(cy)};${deg} ${f(cx)} ${f(cy)};${-deg} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${ease}/>`;
const bob = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)};0 0" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${ease}/>`;
const pulse = (a: number, b: number, dur: number, begin = 0) =>
  `<animate attributeName="opacity" values="${a};${b};${a}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/>`;
const twinkle = (x: number, y: number, r: number, c: string, dur = 2, begin = 0) =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.2;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/></path>`;
/** A tufting button. */
const btn = (x: number, y: number, c: string, r = 3.2) => C(x, y, r, dark(c, 0.25)) + C(x - r * 0.3, y - r * 0.35, r * 0.4, '#fff', 'opacity="0.55"');
/** A soft highlight streak. */
const hi = (x: number, y: number, w: number, h: number, o = 0.4) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', `opacity="${o}"`);
const glass = (x: number, y: number, w: number, h: number, r = 6) => R(x, y, w, h, r, 'url(#g-glass)');
/** A plump cushion: shaded box with a little top highlight. */
const cush = (x: number, y: number, w: number, h: number, c: string, pat = 'none', r = 14) =>
  box(x, y, w, h, r, c, pat, 'y') + hi(x + w * 0.12, y + 5, w * 0.5, 4, 0.35);
const wheel = (x: number, y: number, r: number, c = INK) => C(x, y, r, c) + C(x, y, r * 0.45, '#c9cfdd') + C(x - r * 0.25, y - r * 0.3, r * 0.18, '#fff', 'opacity="0.6"');
/** Bumps along an edge from x1 to x2 at y; positive dep bulges downward. */
const scallop = (x1: number, x2: number, y: number, n: number, dep: number) => {
  let d = '';
  const st = (x2 - x1) / n;
  for (let i = 0; i < n; i++) d += ` Q${f(x1 + st * (i + 0.5))} ${f(y + dep * 2)} ${f(x1 + st * (i + 1))} ${f(y)}`;
  return d;
};
/** A row of light bulbs from (x1,y1) to (x2,y2) that chase when on. */
const bulbs = (x1: number, y1: number, x2: number, y2: number, n: number, on = true, r = 5, col = '#fff6c8') => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    s += C(x, y, r + 1.5, '#c98a1e', 'opacity="0.5"');
    s += on ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"><animate attributeName="opacity" values="1;0.25;1" dur="0.9s" begin="${f(-(i % 3) * 0.3)}s" repeatCount="indefinite"/></circle>`
      : C(x, y, r, '#f2ead0');
  }
  return s;
};
/** A soft colored halo (the shared glow gradient is always yellow). */
const cglow = (x: number, y: number, r: number, col: string, o = 1) =>
  E(x, y, r, r, col, `opacity="${f(0.12 * o)}"`) + E(x, y, r * 0.66, r * 0.66, col, `opacity="${f(0.16 * o)}"`) + E(x, y, r * 0.38, r * 0.38, col, `opacity="${f(0.2 * o)}"`);
const leafy = (x: number, y: number, r: number, c: string) =>
  C(x - r * 0.6, y + r * 0.2, r * 0.7, dark(c, 0.1)) + C(x + r * 0.6, y + r * 0.2, r * 0.7, dark(c, 0.06)) + C(x, y - r * 0.2, r * 0.85, c) + C(x - r * 0.3, y - r * 0.5, r * 0.25, '#fff', 'opacity="0.22"');
const owl = (x: number, y: number, s = 1, c = '#a86b4a') => G(
  E(0, -20, 16, 20, c) + E(0, -14, 10, 12, light(c, 0.45)) + P('M-14 -32 L-12 -44 L-4 -36Z M14 -32 L12 -44 L4 -36Z', c) +
  C(-6, -28, 6, '#fff') + C(6, -28, 6, '#fff') + C(-6, -28, 3, INK) + C(6, -28, 3, INK) + C(-5, -29, 1, '#fff') + C(7, -29, 1, '#fff') +
  P('M-3 -22 L3 -22 L0 -17Z', '#ffab3d') + E(-6, -1, 4, 2, '#ffab3d') + E(6, -1, 4, 2, '#ffab3d') + S('M-8 -12 q2 2 4 0 M4 -12 q2 2 4 0', dark(c, 0.15), 1.4), at(x, y, s));
const teddy = (x: number, y: number, s = 1, c = '#c98a5a') => G(
  C(-11, -36, 6, c) + C(11, -36, 6, c) + C(-11, -36, 3, '#e8c0a0') + C(11, -36, 3, '#e8c0a0') + E(0, -12, 15, 13, c) + C(0, -30, 13, c) +
  E(0, -26, 6, 4.5, '#e8c0a0') + C(-4.5, -32, 1.8, INK) + C(4.5, -32, 1.8, INK) + C(0, -27.5, 1.6, '#4a2e22') + C(-12, -4, 5, dark(c, 0.15)) + C(12, -4, 5, dark(c, 0.15)), at(x, y, s));
const sleepyEye = (x: number, y: number, w = 8, c = INK) => S(`M${f(x - w)} ${f(y)} Q${f(x)} ${f(y + w * 0.8)} ${f(x + w)} ${f(y)}`, c, 2.4);
const zzz = (x: number, y: number, col = '#9b6bff') => [0, 1].map((i) =>
  `<g opacity="0"><animate attributeName="opacity" values="0;1;0" dur="3s" begin="${f(i * 1.5)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;10 -26" dur="3s" begin="${f(i * 1.5)}s" repeatCount="indefinite"/>${T(x, y, 'z', 18 - i * 4, col)}</g>`).join('');

/** A row of books standing on a shelf at yb, from x1 to x2. */
function books(x1: number, x2: number, yb: number, maxH: number, seed = 0, cols = BOOKC): string {
  let s = '';
  let x = x1;
  for (let i = 0; x < x2 - 10; i++) {
    const w = Math.min(x2 - x, 10 + ((i * 7 + seed * 5) % 9));
    const h = maxH * (0.7 + (((i * 13 + seed * 3) % 7) / 7) * 0.3);
    const col = cols[(i + seed) % cols.length];
    if ((i + seed) % 7 === 5 && x + h < x2) {
      s += R(x, yb - w, h, w, 2, col) + R(x + 3, yb - w + 2, h - 6, 2, 1, '#fff', 'opacity="0.5"');
      x += h + 2;
      continue;
    }
    s += R(x, yb - h, w, h, 2, col) + R(x + 2, yb - h + 5, w - 4, 2.5, 1, '#fff', 'opacity="0.55"') + R(x + 2, yb - 9, w - 4, 2.5, 1, '#fff', 'opacity="0.4"');
    x += w + 1.5;
  }
  return s;
}
/** A picture book standing face-out, its cover showing a motif. */
function cover(x: number, yb: number, w: number, h: number, col: string, m: string, tilt = 0): string {
  const y = yb - h;
  const s = R(x, y, w, h, 3, col) + R(x, y, 6, h, 2, dark(col, 0.22)) + R(x + 9, y + 6, w - 14, h * 0.56, 3, '#fff', 'opacity="0.9"') +
    motif(m, x + 2 + w / 2, y + 6 + h * 0.28, Math.min(w, h) * 0.2) + R(x + 11, y + h * 0.72, w - 20, 3.5, 1.7, '#fff', 'opacity="0.75"') + R(x + 15, y + h * 0.82, w - 28, 3, 1.5, '#fff', 'opacity="0.5"');
  return tilt ? G(s, `transform="rotate(${f(tilt)} ${f(x + w / 2)} ${f(yb)})"`) : s;
}
/** A book lying flat (for stacks). */
const flatBook = (x: number, yb: number, w: number, h: number, col: string) =>
  R(x, yb - h, w, h, 3, col) + R(x + w - 7, yb - h + 2, 5, h - 4, 1.5, '#fffaf0') + R(x + 4, yb - h + 3, w - 16, 2.5, 1, '#fff', 'opacity="0.5"');
/** Swept-back curtains: closed meets in the middle, open is tied back to the sides. */
function drapes(x1: number, x2: number, y1: number, y2: number, col: string, open: boolean, pat = 'none', tie = GOLD, owf = 0.16): string {
  const mid = (x1 + x2) / 2;
  const fold = (a: number, b: number) => {
    let s = '';
    for (let x = a + 14; x < b - 6; x += 22) s += S(`M${f(x)} ${f(y1 + 6)} Q${f(x + 5)} ${f((y1 + y2) / 2)} ${f(x)} ${f(y2 - 6)}`, dark(col, 0.18), 3, 'opacity="0.6"');
    return s;
  };
  if (!open) {
    const n = Math.max(3, Math.round((mid - x1) / 26));
    return cloth(`M${f(x1)} ${f(y1)} H${f(mid + 1)} V${f(y2)}${scallop(mid + 1, x1, y2, n, 3)}Z`, col, pat) + fold(x1, mid) +
      cloth(`M${f(mid - 1)} ${f(y1)} H${f(x2)} V${f(y2)}${scallop(x2, mid - 1, y2, n, 3)}Z`, col, pat) + fold(mid, x2) + Ln(mid, y1 + 4, mid, y2 - 2, dark(col, 0.3), 2);
  }
  const ow = (x2 - x1) * owf;
  const ty = y1 + (y2 - y1) * 0.58;
  return sym((k) => {
    const xo = k > 0 ? x2 : x1;
    const d = `M${f(xo)} ${f(y1)} L${f(xo - k * ow * 1.6)} ${f(y1)} Q${f(xo - k * ow * 0.5)} ${f(ty - 30)} ${f(xo - k * ow * 0.6)} ${f(ty)} Q${f(xo - k * ow * 1.3)} ${f(y2 - 30)} ${f(xo - k * ow * 1.1)} ${f(y2)} L${f(xo)} ${f(y2)}Z`;
    return cloth(d, col, pat) + S(`M${f(xo - k * ow * 0.4)} ${f(y1 + 10)} Q${f(xo - k * ow * 0.3)} ${f(ty - 20)} ${f(xo - k * ow * 0.45)} ${f(ty)}`, dark(col, 0.18), 3, 'opacity="0.6"') +
      R(Math.min(xo, xo - k * ow * 0.8) - 2, ty - 6, ow * 0.8 + 4, 12, 6, tie) + C(xo - k * ow * 0.7, ty, 7, tie);
  });
}
/** A moving picture for movie screens, drawn in a 160x100 box. */
function movie(kind: string): string {
  const moveX = (a: number, b: number, dur: number, begin = 0) => `<animateTransform attributeName="transform" type="translate" values="${a} 0;${b} 0" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/>`;
  const hop = (dy: number, dur: number) => `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${dy};0 0" dur="${dur}s" repeatCount="indefinite" ${ease}/>`;
  switch (kind) {
    case 'castle':
      return R(0, 0, 160, 100, 0, '#6b4fc0') + R(0, 55, 160, 45, 0, '#ff9ec7', 'opacity="0.55"') + C(130, 20, 9, '#fff3b0') +
        P('M44 100 V58 H52 V50 H60 V58 H70 V38 L80 22 L90 38 V58 H100 V50 H108 V58 H116 V100Z', '#fff7fb') + R(75, 74, 10, 26, 5, '#ff7eb6') + P('M68 38 L80 18 L92 38Z', '#ff7eb6') + R(78, 46, 4, 6, 2, '#ffe680') +
        [[30, 30, '#ffd24a', 0], [126, 44, '#7cc8ff', 0.7], [104, 22, '#ff7eb6', 1.3]].map(([x, y, col, b]) =>
          `<g transform="translate(${x} ${y})"><g><animateTransform attributeName="transform" type="scale" values="0.2;1.2;0.2" dur="2s" begin="${b}s" repeatCount="indefinite"/>${pulse(0, 1, 2, b as number)}${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="0" x2="${f(Math.cos(i * 0.785) * 12)}" y2="${f(Math.sin(i * 0.785) * 12)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g></g>`).join('');
    case 'space':
      return R(0, 0, 160, 100, 0, '#24224a') + [[20, 18, 3], [60, 10, 2], [104, 26, 3], [146, 12, 3], [28, 74, 2], [86, 86, 3], [150, 70, 2], [70, 50, 2]].map(([x, y, r], i) => twinkle(x, y, r, '#fff', 1.4 + (i % 3) * 0.4, i * 0.2)).join('') +
        C(124, 68, 17, '#ff9ec7') + E(124, 68, 28, 6, 'none', 'stroke="#ffd24a" stroke-width="3" transform="rotate(-16 124 68)"') + C(36, 34, 10, '#ffe680') + C(33, 31, 2, '#e8c04a') +
        `<g>${moveX(-30, 190, 5)}<g>${hop(-10, 1)}<g transform="translate(0 56) rotate(90)">` +
        P('M0 -16 C7 -9 7 5 5 12 L-5 12 C-7 5 -7 -9 0 -16Z', '#fff') + C(0, -3, 3.5, '#7cc8ff') + P('M-5 6 L-10 13 L-5 11Z M5 6 L10 13 L5 11Z', '#ff4f6d') +
        `<g><animateTransform attributeName="transform" type="scale" values="1 1;1.1 0.8;1 1" dur="0.3s" repeatCount="indefinite"/>${P('M-3 12 L0 22 L3 12Z', '#ffab3d')}</g></g></g></g>`;
    case 'sea':
      return R(0, 0, 160, 100, 0, '#4fb6e8') + R(0, 0, 160, 30, 0, '#9fd6ff', 'opacity="0.5"') + P('M0 88 Q40 80 80 88 Q120 96 160 84 V100 H0Z', '#f4dca0') +
        S('M22 92 Q16 76 24 64 Q30 54 24 44', '#3fbf8f', 4) + S('M140 90 Q146 74 138 62', '#5fae6b', 4) + C(104, 88, 5, '#ff7eb6') +
        `<g>${moveX(-30, 190, 7)}<g>${hop(-8, 1.6)}` + P('M0 52 Q-14 48 -22 56 Q-14 54 -10 60 Q-2 58 0 52Z', '#5fd3b5') + E(6, 48, 10, 6, '#5fd3b5') +
        E(16, 44, 6, 7, '#ffe3d3') + P('M10 38 Q16 32 24 38 Q26 48 20 52 Q18 42 10 38Z', '#ff7eb6') + C(18, 44, 1.2, INK) + '</g></g>' +
        `<g>${moveX(190, -30, 9, 1)}<g transform="translate(0 30)">${E(0, 0, 9, 6, '#ffd36b')}${P('M8 0 L15 -6 L15 6Z', '#ffd36b')}${C(-4, -1, 1.4, INK)}</g></g>` +
        [30, 90, 130].map((x, i) => `<circle cx="${x}" cy="90" r="2.5" fill="#fff" opacity="0.7"><animate attributeName="cy" values="90;0" dur="${f(2 + i * 0.6)}s" repeatCount="indefinite"/></circle>`).join('');
    case 'dino':
      return R(0, 0, 160, 100, 0, '#ffe3b0') + C(30, 24, 12, '#ffab5e') + P('M0 70 Q30 50 60 64 L70 40 L80 64 Q120 48 160 66 V100 H0Z', '#9fd67a') + R(0, 86, 160, 14, 0, '#c98a5a') +
        `<g>${moveX(190, -40, 6)}<g>${hop(-6, 0.5)}` + P('M0 80 Q-4 64 10 60 L14 46 Q20 38 28 44 Q30 52 22 54 Q28 64 22 80Z', '#5fd3b5') + P('M0 72 Q-12 70 -16 62 Q-6 66 2 66Z', '#5fd3b5') +
        C(23, 48, 1.6, INK) + [[6, 60], [10, 54], [14, 48]].map(([x, y]) => P(`M${x} ${y} l3 -5 l3 5Z`, '#ffab5e')).join('') + '</g></g>';
    default: // 'pony'
      return R(0, 0, 160, 100, 0, '#bfe8ff') + RB.map((col, i) => S(`M${20 + i * 7} 90 A${60 - i * 7} ${60 - i * 7} 0 0 1 ${140 - i * 7} 90`, col, 7, 'opacity="0.8"')).join('') +
        `<g>${moveX(0, -30, 8)}${C(30, 20, 8, '#fff')}${C(40, 17, 10, '#fff')}${C(52, 21, 7, '#fff')}</g>` +
        P('M0 78 Q40 62 80 76 Q120 62 160 74 V100 H0Z', '#7fe0b0') + flowerG(24, 88, 4, '#ff9ec7') + flowerG(136, 90, 4, '#fff') +
        `<g>${moveX(-30, 190, 6)}<g>${hop(-12, 0.6)}` + E(0, 70, 13, 8, '#fff') + P('M8 66 L14 52 L20 54 L14 68Z', '#fff') + E(18, 52, 7, 5, '#fff') + P('M18 46 L22 36 L21 47Z', '#ffd24a') +
        P('M10 54 Q4 60 6 68 Q10 60 14 58Z', '#ff7eb6') + P('M-12 68 Q-22 66 -22 76 Q-16 70 -12 72Z', '#c99bff') + C(20, 51, 1.3, INK) +
        R(-8, 76, 3, 8, 1.5, '#fff') + R(-2, 76, 3, 8, 1.5, '#fff') + R(4, 76, 3, 8, 1.5, '#fff') + R(10, 76, 3, 8, 1.5, '#fff') + '</g></g>';
  }
}
/** A screen: a moving picture when on, a pale blank screen when off. */
const screen = (x: number, y: number, w: number, h: number, kind: string, on: boolean, r = 4) => on
  ? R(x, y, w, h, r, '#3d3a52') + `<svg x="${f(x + 1)}" y="${f(y + 1)}" width="${f(w - 2)}" height="${f(h - 2)}" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${movie(kind)}</svg>` + R(x, y, w, h, r, 'url(#g-glass)', 'opacity="0.35"')
  : R(x, y, w, h, r, '#f4f2fa') + R(x, y, w, h, r, 'url(#g-shadeY)', 'opacity="0.5"');
/** Rugs are drawn top-down and squashed flat onto the floor. */
const flat = (s: string) => `<g transform="scale(1 0.34)">${s}</g>`;
const rugEdge = (d: string, c: string, top: string) => `<g transform="translate(0 5)">${flat(P(d, dark(c, 0.22)))}</g>` + flat(P(d, c) + top + P(d, 'url(#g-face)', 'opacity="0.5"'));
const circD = (r: number, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
/** A wavy round outline (scallops). */
function wavyD(r: number, n: number, depth: number, ry = r): string {
  let d = '';
  for (let i = 0; i <= n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const k = 1 - depth * (0.5 - 0.5 * Math.cos(a * n));
    d += `${i ? 'L' : 'M'}${f(Math.cos(a) * r * k)} ${f(Math.sin(a) * ry * k)}`;
  }
  return d + 'Z';
}
/** A bed pillow. */
const pillow = (x: number, y: number, c = '#ffffff', rx = 46, ry = 24, pat = 'none') =>
  cloth(`M${f(x - rx)} ${f(y)} Q${f(x - rx)} ${f(y - ry)} ${f(x)} ${f(y - ry)} Q${f(x + rx)} ${f(y - ry)} ${f(x + rx)} ${f(y)} Q${f(x + rx)} ${f(y + ry)} ${f(x)} ${f(y + ry)} Q${f(x - rx)} ${f(y + ry)} ${f(x - rx)} ${f(y)}Z`, c, pat, 'y') +
  S(`M${f(x - rx * 0.75)} ${f(y - 4)} Q${f(x)} ${f(y + ry * 0.65)} ${f(x + rx * 0.75)} ${f(y - 4)}`, dark(c, 0.12), 2);
/** A ding bell for desks. */
const bell = (x: number, y: number, s = 1) => G(E(0, -2, 17, 4.5, '#8a8fa3') + P('M-14 -4 Q-14 -22 0 -22 Q14 -22 14 -4Z', GOLD) + R(-2, -28, 4, 7, 2, '#c9a23a') + C(0, -29, 3.5, GOLD) + hi(-9, -17, 6, 3, 0.6), at(x, y, s));
/** A tiny potted plant. */
const potPlant = (x: number, yb: number, s: number, pot: string, leaf = '#5fc47c') => G(
  P('M-12 -20 Q-26 -40 -18 -54 Q-6 -40 -4 -20Z M12 -20 Q26 -42 16 -56 Q4 -40 4 -20Z M0 -20 Q-6 -50 2 -64 Q10 -50 4 -20Z', leaf) + P('M-14 -22 H14 L10 0 H-10Z', pot) + R(-16, -24, 32, 6, 3, dark(pot, 0.12)), at(x, yb, s));

// ---------------- the series builder ----------------
interface Spec extends Partial<FurnDef> { s: string; name: string; w: number; h: number; art: Draw }
function series(type: string, group: string, cat: FurnCat, mount: Mount, specs: Spec[], extra: Partial<FurnDef> = {}): FurnDef[] {
  return specs.map(({ s, ...rest }, i) => ({
    id: `f-${type}-${s}`, cat, mount, group, style: s, price: stylePrice(i), color: ST[s].main, ...extra, ...rest,
  }) as FurnDef);
}
const one = (y: number, x = 0): SeatDef[] => [{ x, y, pose: 'sit' }];
const two = (y: number, dx = 75): SeatDef[] => [{ x: -dx, y, pose: 'sit' }, { x: dx, y, pose: 'sit' }];
const three = (y: number, dx = 105): SeatDef[] => [{ x: -dx, y, pose: 'sit' }, { x: 0, y, pose: 'sit' }, { x: dx, y, pose: 'sit' }];
/** A small prop (food or toy) defined once, not in every collection. */
function prop(id: string, name: string, cat: FurnCat, group: string, w: number, h: number, art: Draw, extra: Partial<FurnDef> = {}): FurnDef {
  return { id, name, cat, group, price: 0, mount: 'prop', w, h, art, ...extra };
}
const PICTURE_BOOKS = ['f-picturebook-sweet', 'f-picturebook-woodland', 'f-picturebook-space'];

// =====================================================================================
// LIBRARY
// =====================================================================================
const TALLSHELVES = series('bookshelf-tall', 'Tall Bookshelves', 'library', 'floor', [
  {
    s: 'sweet', name: 'Sweetheart Tall Bookshelf', w: 250, h: 425, surfaces: [{ x1: -120, x2: 120, y: -420 }],
    art: (c) => {
      let s = box(-120, -420, 240, 412, 16, c) + R(-104, -394, 208, 370, 8, dark(c, 0.32)) + R(-104, -394, 208, 370, 8, 'url(#g-shadeX)', 'opacity="0.5"');
      s += P(`M-120 -404 Q-120 -420 -104 -420 H104 Q120 -420 120 -404 V-394${scallop(120, -120, -394, 9, 5)}Z`, light(c, 0.45));
      const rows = [-301, -209, -117, -24];
      rows.forEach((yb, r) => { if (r < 3) s += R(-106, yb, 212, 9, 3, light(c, 0.2)) + hi(-100, yb + 1, 120, 3, 0.4); });
      s += books(-100, 100, -301, 70, 0);
      s += books(-100, 18, -209, 70, 2) + cover(26, -209, 58, 68, '#fff3f8', 'unicorn', -6) + P(heartD(92, -238, 10), '#fff');
      s += teddy(-68, -117, 1.25) + books(-38, 100, -117, 68, 4);
      s += books(-100, 100, -24, 70, 6);
      s += C(0, -404, 12, '#fff') + P(heartD(0, -413, 14), c) + sym((k) => P(heartD(80 * k, -414, 9), '#fff', 'opacity="0.8"'));
      return s + sym((k) => E(96 * k, -6, 16, 7, dark(c, 0.25)));
    },
  },
  {
    s: 'princess', name: 'Royal Arched Bookcase', w: 260, h: 470,
    art: (c) => {
      const out = 'M-122 -8 V-350 Q-122 -452 0 -462 Q122 -452 122 -350 V-8Z';
      const inn = 'M-104 -24 V-344 Q-104 -432 0 -442 Q104 -432 104 -344 V-24Z';
      let s = cloth(out, '#ffffff') + S(out, GOLD, 5) + cloth(inn, dark(c, 0.18), 'hearts');
      s += C(0, -386, 38, '#fff') + C(0, -386, 31, light(c, 0.35)) + motif('crown', 0, -390, 24) + S(circD(38, 0, -386), GOLD, 4);
      for (const yb of [-264, -184, -104, -24]) {
        if (yb !== -24) s += R(-106, yb, 212, 8, 3, GOLD);
      }
      s += books(-100, 100, -264, 62, 1) + books(-100, 30, -184, 62, 3) + cover(38, -184, 54, 62, '#fff3f8', 'crown', 5);
      s += books(-100, 100, -104, 62, 5) + books(-100, -10, -24, 62, 7) + cover(0, -24, 50, 60, '#c99bff', 'heart', -4) + C(78, -40, 14, '#fff') + C(78, -40, 9, '#7cc8ff');
      s += P('M-122 -350 Q-140 -340 -132 -320', 'none', `stroke="${ST.princess.trim}" stroke-width="4"`) + P('M122 -350 Q140 -340 132 -320', 'none', `stroke="${ST.princess.trim}" stroke-width="4"`);
      s += P(starD(0, -470, 10), GOLD);
      return s + sym((k) => P(`M${100 * k} -8 Q${110 * k} 4 ${124 * k} 0 L${124 * k} -8Z`, GOLD));
    },
  },
  {
    s: 'modern', name: 'Cube Grid Bookshelf', w: 280, h: 405, surfaces: [{ x1: -130, x2: 130, y: -400 }],
    art: (c) => {
      const a = ST.modern.accent;
      let s = R(-130, -400, 260, 392, 4, c) + R(-130, -400, 260, 392, 4, 'url(#g-shadeX)', 'opacity="0.4"');
      const rows: [number, number, number[]][] = [[-392, -296, [-122, -30, 122]], [-296, -200, [-122, 40, 122]], [-200, -104, [-122, -60, 60, 122]], [-104, -16, [-122, 0, 122]]];
      for (const [, y2, xs] of rows) for (let i = 0; i < xs.length - 1; i++) s += R(xs[i] + 3, y2 - 2, xs[i + 1] - xs[i] - 6, 2, 1, dark(c, 0.12));
      s += books(-118, -36, -296, 74, 1, ['#4a4a5e', '#9aa3b5', '#ffd36b', '#ffffff']) + flatBook(-24, -296, 70, 12, '#ffd36b') + flatBook(-20, -308, 62, 10, '#4a4a5e') + potPlant(84, -296, 1.1, '#ffffff', '#3fbf8f');
      s += books(-118, 34, -200, 74, 3, ['#9aa3b5', '#4a4a5e', '#ff7a6b', '#ffffff', '#7cc8ff']) + box(46, -290, 70, 84, 4, a) + R(70, -250, 22, 4, 2, '#fff');
      s += P('M-100 -104 Q-110 -150 -92 -170 H-88 Q-70 -150 -80 -104Z', '#ffd36b') + Ln(-90, -168, -96, -190, '#4a4a5e', 2) + Ln(-90, -168, -84, -186, '#4a4a5e', 2) + C(-96, -192, 4, '#ff7a6b') + C(-84, -188, 4, '#7cc8ff');
      s += books(-54, 56, -104, 74, 5, ['#4a4a5e', '#ffd36b', '#9aa3b5', '#ffffff']) + box(66, -194, 50, 84, 4, '#ffd36b') + C(91, -152, 4, '#fff');
      s += box(-116, -98, 110, 76, 4, a) + R(-72, -64, 22, 4, 2, '#fff') + books(6, 118, -16, 76, 7, ['#9aa3b5', '#ff7a6b', '#4a4a5e', '#ffffff']);
      s += R(-130, -400, 260, 392, 4, 'none', `stroke="${a}" stroke-width="8"`);
      for (const [y1, y2, xs] of rows) {
        s += Ln(-126, y2, 126, y2, a, 6);
        for (const x of xs.slice(1, -1)) s += Ln(x, y1, x, y2, a, 6);
      }
      return s + Ln(-112, -10, -116, 0, INK, 6) + Ln(112, -10, 116, 0, INK, 6);
    },
  },
  {
    s: 'woodland', name: 'Book Tree', w: 340, h: 490,
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = P('M-62 0 Q-44 -120 -52 -300 Q-56 -350 -26 -380 L26 -380 Q56 -350 52 -300 Q44 -120 62 0Z', wd) + P('M-62 0 Q-44 -120 -52 -300 Q-56 -350 -26 -380 L0 -380 L0 0Z', '#fff', 'opacity="0.08"');
      s += P('M-62 0 Q-90 -4 -100 6 L-40 6Z M62 0 Q90 -4 100 6 L40 6Z', dark(wd, 0.1));
      for (const [x, y, h] of [[-28, -80, 40], [20, -150, 50], [-16, -270, 44], [30, -330, 30]]) s += S(`M${x} ${y} q-4 ${h / 2} 0 ${h}`, dark(wd, 0.2), 3);
      s += E(0, -200, 26, 34, dark(wd, 0.45)) + owl(0, -172, 1.15, '#c98a5a');
      const plank = (x1: number, x2: number, y: number) => R(x1, y, x2 - x1, 14, 7, dark(wd, 0.06)) + hi(x1 + 8, y + 2, (x2 - x1) * 0.6, 3, 0.3);
      s += S('M-46 -120 Q-90 -124 -150 -112', wd, 18) + plank(-160, -40, -122) + books(-150, -56, -122, 60, 1);
      s += S('M46 -230 Q90 -236 150 -224', wd, 18) + plank(40, 160, -234) + books(52, 150, -234, 60, 3);
      s += S('M-44 -320 Q-80 -330 -136 -322', wd, 16) + plank(-146, -40, -332) + books(-136, -60, -332, 52, 5);
      s += plank(64, 170, -40) + books(76, 160, -40, 54, 7);
      for (const [x, y, r] of [[-120, -420, 52], [-40, -450, 62], [50, -446, 60], [126, -414, 50], [0, -404, 56], [-80, -392, 40], [92, -380, 40]]) s += leafy(x, y, r, c);
      s += C(-60, -440, 6, '#ff6f91') + C(86, -460, 6, '#ff6f91') + C(10, -480, 5, '#ffab5e');
      return s + G(C(-110, -18, 16, '#e8573d') + R(-114, -18, 8, 18, 3, '#fff3d6') + C(-116, -22, 3, '#fff') + C(-104, -20, 2.5, '#fff'));
    },
  },
  {
    s: 'space', name: 'Rocket Bookshelf', w: 300, h: 495,
    art: (c) => {
      const a = ST.space.accent;
      let s = sym((k) => P(`M${100 * k} -170 L${146 * k} -70 L${146 * k} -8 L${100 * k} -40Z`, '#ff6f91') + P(`M${100 * k} -170 L${146 * k} -70 L${130 * k} -70Z`, '#fff', 'opacity="0.2"'));
      s += R(-60, -40, 120, 34, 8, ST.space.metal) + R(-46, -12, 92, 12, 4, dark(ST.space.metal, 0.2));
      const body = 'M-100 -40 V-330 Q-100 -410 0 -480 Q100 -410 100 -330 V-40Z';
      s += cloth(body, c) + P('M-100 -330 Q-100 -410 0 -480 Q100 -410 100 -330Z', a) + P('M-100 -330 Q-100 -410 0 -480 L0 -330Z', '#fff', 'opacity="0.15"');
      s += C(0, -380, 32, ST.space.metal) + C(0, -380, 25, '#24224a') + motif('planet', 0, -380, 18) + C(0, -380, 25, 'url(#g-glass)');
      s += R(-84, -320, 168, 272, 10, dark(c, 0.4));
      for (const yb of [-230, -140]) s += R(-86, yb, 172, 8, 3, a);
      s += books(-80, 80, -230, 70, 1, ['#ffe680', '#7cc8ff', '#ff9ec7', '#c99bff', '#fff']) + books(-80, 10, -140, 70, 3, ['#7cc8ff', '#fff', '#ffe680', '#ff9ec7']) + cover(18, -140, 56, 66, '#ffe680', 'rocket', 4);
      s += books(-80, 80, -48, 70, 5, ['#c99bff', '#ffe680', '#7cc8ff', '#ff9ec7']);
      for (const [x, y] of [[-100, -270], [100, -200], [-100, -120]]) s += C(x, y, 5, ST.space.metal);
      return s + P(starD(-70, -440, 9), a) + P(starD(80, -460, 7), a) + P(sparkleD(120, -300, 9), '#fff');
    },
  },
]);

const NOOKS = series('readingnook', 'Reading Nooks', 'library', 'floor', [
  {
    s: 'sweet', name: 'Window Seat Nook', w: 340, h: 420, seats: two(-104, 64),
    art: (c) => {
      const wd = ST.sweet.wood;
      let s = P('M-162 0 V-300 Q-162 -414 0 -414 Q162 -414 162 -300 V0Z', wd) + P('M-162 0 V-300 Q-162 -414 0 -414 L0 0Z', '#fff', 'opacity="0.15"');
      s += cloth('M-142 -20 V-296 Q-142 -394 0 -394 Q142 -394 142 -296 V-20Z', light(c, 0.55), 'hearts', 'y');
      s += C(0, -282, 62, '#fff') + C(0, -282, 54, '#3f4f9a') + P('M10 -312 A22 22 0 1 0 30 -280 A16 16 0 1 1 10 -312Z', '#ffe680') + twinkle(-24, -300, 6, '#fff', 2) + twinkle(-14, -258, 4, '#fff', 1.6, 0.5) + twinkle(28, -246, 4, '#fff', 2.2, 1);
      s += Ln(0, -336, 0, -228, '#fff', 4) + Ln(-54, -282, 54, -282, '#fff', 4) + C(0, -282, 54, 'url(#g-glass)');
      s += sym((k) => R(k > 0 ? 70 : -134, -196, 64, 7, 3, wd) + books(k > 0 ? 74 : -130, k > 0 ? 130 : -74, -196, 40, k > 0 ? 2 : 5));
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        s += C(Math.cos(a) * 126, -296 + Math.sin(a) * 84, 4.5, ['#fff6c8', '#ffd9e8', '#d9f2ff'][i % 3], `stroke="${ST.sweet.trim}" stroke-width="1.5"`);
      }
      s += drapes(-150, 150, -380, -116, c, true, 'none', '#ffffff');
      s += box(-150, -80, 300, 76, 10, c) + sym((k) => R(k > 0 ? 14 : -134, -66, 120, 50, 8, light(c, 0.2)) + C(74 * k, -41, 5, GOLD));
      s += cush(-146, -110, 292, 32, light(c, 0.35), 'none', 14);
      s += pillow(-108, -138, '#ffffff', 34, 22) + P(heartD(108, -168, 40), light(c, 0.25)) + P(heartD(108, -168, 40), 'url(#g-face)');
      return s;
    },
  },
  {
    s: 'cottage', name: 'Canopy Reading Tent', w: 340, h: 450, seats: one(-58),
    art: (c) => {
      const so = ST.cottage.soft;
      let s = P('M0 -430 L-150 -12 L150 -12Z', dark(c, 0.35)) + P('M0 -430 L-150 -12 L150 -12Z', 'url(#g-shadeY)', 'opacity="0.5"');
      let zig = 'M-110 -140';
      for (let i = 0; i < 8; i++) zig += ` Q${f(-110 + i * 27.5 + 14)} ${f(i % 2 ? -150 : -120)} ${f(-110 + (i + 1) * 27.5)} -140`;
      s += S(zig, '#4a4a5e', 1.5);
      for (let i = 0; i <= 8; i++) s += `<circle cx="${f(-110 + i * 27.5)}" cy="-138" r="4" fill="#fff6c8"><animate attributeName="opacity" values="1;0.4;1" dur="1.6s" begin="${f(i * 0.2)}s" repeatCount="indefinite"/></circle>`;
      s += sym((k) => cloth(`M0 -430 Q${-60 * k} -260 ${-170 * k} -10 L${-96 * k} -10 Q${-60 * k} -150 ${-6 * k} -400Z`, c, 'flowers'));
      s += sym((k) => R(-106 * k - 6, -170, 12, 18, 5, ST.cottage.trim) + C(-84 * k, -160, 7, '#ff9ec7'));
      for (let i = 0; i < 7; i++) {
        const x1 = -150 + i * 14;
        s += P(`M${f(x1 + 4)} ${f(-10 - i * 40 + 6)} l12 4 l-8 10Z`, RB[i % 6], 'opacity="0.9"');
      }
      s += R(-6, -446, 12, 22, 6, GOLD) + C(0, -446, 9, 'none', `stroke="${ST.cottage.metal}" stroke-width="4"`);
      s += pillow(-60, -86, '#fff3d6', 40, 24, 'flowers') + pillow(64, -92, light(c, 0.2), 40, 26);
      s += box(-120, -62, 240, 56, 26, so, 'flowers', 'y') + hi(-90, -56, 120, 5, 0.4);
      return s + books(100, 150, -10, 34, 2) + flatBook(-160, -10, 50, 12, '#ff9ec7') + flatBook(-156, -22, 44, 10, '#7cc8ff');
    },
  },
  {
    s: 'space', name: 'Moon Reading Nook', w: 420, h: 440, color: '#ffe680', seats: one(-108, 40),
    art: (c) => {
      let s = C(-110, -30, 34, '#fff') + C(-44, -40, 46, '#fff') + C(40, -34, 44, '#fff') + C(118, -28, 34, '#fff') + R(-150, -30, 300, 30, 15, '#fff') + E(0, -6, 160, 10, '#e6eefa');
      const moon = 'M-17.9 -399.1 A190 190 0 1 0 189.1 -192.1 A160 160 0 1 1 -17.9 -399.1Z';
      s += cloth(moon, c) + C(-100, -150, 14, dark(c, 0.1)) + C(-60, -80, 9, dark(c, 0.1)) + C(-130, -260, 10, dark(c, 0.1)) + C(-40, -350, 7, dark(c, 0.1));
      s += sleepyEye(-120, -206, 10) + E(-128, -186, 9, 5, '#ff9ec7', 'opacity="0.7"') + S('M-104 -170 q8 6 16 0', INK, 2.4);
      s += S('M154.9 -153.6 A150 150 0 0 1 -74.9 -153.6', ST.space.soft, 22) + S('M140 -164 A140 140 0 0 1 -60 -164', '#fff', 3, 'opacity="0.35"');
      s += Ln(-6, -392, -6, -330, '#fff', 1.5) + G(`<g>${sway(8, -6, -392, 3)}${P(starD(-6, -318, 14), ST.space.accent)}${C(-10, -320, 1.6, INK)}${C(-2, -320, 1.6, INK)}</g>`);
      s += Ln(50, -360, 50, -300, '#fff', 1.5) + G(`<g>${sway(10, 50, -360, 3.6, 1)}${P(starD(50, -290, 10), '#ff9ec7')}</g>`);
      s += pillow(140, -196, '#fff', 30, 20, 'stars');
      return s + flatBook(112, -10, 56, 12, '#ff9ec7') + flatBook(116, -22, 48, 10, '#7cc8ff') + zzz(-160, -300);
    },
  },
]);

const LIBDESKS = series('librarydesk', 'Librarian Desks', 'library', 'floor', [
  {
    s: 'sweet', name: 'Librarian Desk', w: 370, h: 235, surfaces: [{ x1: -40, x2: 90, y: -166 }], spawn: PICTURE_BOOKS,
    art: (c) => {
      const wd = ST.sweet.wood;
      let s = cloth('M-160 -150 H160 V-16 Q0 -4 -160 -16Z', c) + R(-152, -26, 304, 16, 6, dark(c, 0.2));
      s += P(`M-140 -136 H140 V-112${scallop(140, -140, -112, 10, 4)}Z`, light(c, 0.4));
      s += R(-74, -98, 148, 40, 20, '#fff') + T(0, -70, 'LIBRARY', 24, dark(c, 0.45));
      for (const x of [-120, 120]) s += P(heartD(x, -88, 22), light(c, 0.45)) + P(heartD(x, -88, 22), 'url(#g-face)');
      s += R(-110, -50, 220, 6, 3, '#fff', 'opacity="0.5"');
      s += box(-174, -168, 348, 20, 10, wd) + hi(-160, -164, 220, 4, 0.5);
      // stamp, ink pad and the "return" book stack
      s += R(-160, -180, 52, 14, 4, '#4a4a5e') + R(-156, -182, 44, 6, 3, '#ff4f8b');
      s += R(-96, -184, 36, 16, 5, INK) + R(-82, -206, 8, 22, 3, '#c98a5a') + E(-78, -210, 13, 9, '#ff7eb6') + C(-82, -214, 3, '#fff', 'opacity="0.6"');
      s += P(heartD(-62, -196, 9), '#ff4f8b', 'opacity="0.6"');
      s += flatBook(100, -168, 64, 14, '#7cc8ff') + flatBook(104, -182, 58, 14, '#ffd36b') + flatBook(98, -196, 62, 14, '#ff7eb6') + P(heartD(130, -224, 14), '#fff') + S('M130 -196 V-212', '#fff', 2);
      return s;
    },
  },
  {
    s: 'modern', name: 'Check-Out Desk', w: 390, h: 300, surfaces: [{ x1: -180, x2: -10, y: -170 }], spawn: PICTURE_BOOKS,
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = box(-180, -160, 360, 152, 6, c) + R(-180, -160, 120, 152, 6, ST.modern.wood) + R(-170, -150, 100, 132, 4, dark(ST.modern.wood, 0.12));
      for (let y = -140; y < -20; y += 14) s += Ln(-166, y, -74, y, light(ST.modern.wood, 0.25), 2, 'opacity="0.6"');
      s += T(60, -76, 'CHECK OUT', 22, a) + R(6, -64, 110, 4, 2, '#ffd36b') + R(-180, -16, 360, 10, 3, a);
      s += R(-188, -172, 376, 14, 4, a) + hi(-180, -170, 280, 3, 0.4);
      s += R(78, -252, 100, 70, 6, a) + R(84, -246, 88, 58, 4, on ? '#bfe8ff' : '#e8f6ff') + R(92, -238, 34, 44, 3, '#ff7a6b') + R(132, -238, 34, 44, 3, '#7cc8ff') + R(96, -230, 26, 4, 2, '#fff') + R(136, -230, 26, 4, 2, '#fff') + R(122, -182, 12, 12, 2, '#9aa3b5') + R(104, -174, 48, 4, 2, '#9aa3b5');
      s += R(30, -182, 40, 10, 4, INK) + R(46, -198, 8, 16, 3, '#ffd36b') + C(50, -204, 8, '#ffd36b');
      s += flatBook(-170, -172, 70, 14, '#ffd36b') + flatBook(-166, -186, 62, 12, '#4a4a5e');
      return s;
    },
  },
  {
    s: 'woodland', name: 'Log Cabin Desk', w: 370, h: 260, surfaces: [{ x1: -60, x2: 170, y: -156 }], spawn: PICTURE_BOOKS,
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = '';
      for (let i = 0; i < 4; i++) {
        const y = -150 + i * 36;
        s += R(-166, y, 332, 34, 17, i % 2 ? dark(wd, 0.06) : wd) + hi(-150, y + 4, 240, 4, 0.25);
        s += sym((k) => C(166 * k, y + 17, 17, light(wd, 0.35)) + C(166 * k, y + 17, 11, 'none', `stroke="${dark(wd, 0.1)}" stroke-width="2"`) + C(166 * k, y + 17, 5, 'none', `stroke="${dark(wd, 0.1)}" stroke-width="2"`));
      }
      s += R(-80, -116, 160, 42, 10, ST.woodland.soft) + T(0, -86, 'LIBRARY', 22, dark(wd, 0.2)) + G(leafy(-96, -96, 12, c) + leafy(96, -96, 12, c));
      s += R(-180, -166, 360, 16, 8, dark(wd, 0.15)) + hi(-170, -164, 260, 3, 0.3);
      s += R(-152, -236, 8, 70, 4, '#f4ead9') + P('M-180 -232 Q-148 -280 -116 -232Z', '#e8573d') + C(-162, -246, 5, '#fff') + C(-140, -252, 4, '#fff') + C(-150, -236, 3, '#fff');
      s += owl(-90, -166, 0.9, '#ffab5e');
      s += flatBook(80, -166, 70, 14, '#e8573d') + flatBook(86, -180, 60, 12, '#8fbf6a') + R(20, -180, 30, 14, 4, INK) + R(31, -196, 8, 16, 3, wd) + C(35, -200, 7, '#ffab5e');
      return s;
    },
  },
]);

const STORYRUGS = series('storyrug', 'Story-Time Rugs', 'library', 'rug', [
  {
    s: 'sweet', name: 'ABC Story Rug', w: 390, h: 140,
    art: (c) => {
      const d = wavyD(186, 18, 0.06, 186);
      let top = P(circD(150), light(c, 0.55)) + P(circD(100), c);
      const L = 'ABCDEFGHIJKL';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 126;
        const y = Math.sin(a) * 126;
        top += G(R(-20, -20, 40, 40, 8, RB[i % 6]) + T(0, 10, L[i], 28, '#fff'), `transform="translate(${f(x)} ${f(y)}) rotate(${f((a * 180) / Math.PI + 90)})"`);
      }
      top += P('M-70 -10 Q-36 -36 0 -18 Q36 -36 70 -10 L70 40 Q36 18 0 34 Q-36 18 -70 40Z', '#fff') + S('M0 -18 V34', dark(c, 0.2), 3);
      for (const y of [-2, 10, 22]) top += S(`M-56 ${y} Q-30 ${y - 12} -10 ${y}`, '#c9cfdd', 3) + S(`M10 ${y} Q30 ${y - 12} 56 ${y}`, '#c9cfdd', 3);
      top += P(heartD(0, -66, 34), '#fff');
      return rugEdge(d, c, top);
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Circle Rug', w: 400, h: 120,
    art: (c) => {
      const d = 'M-196 90 A196 196 0 0 1 196 90Z';
      let top = '';
      RB.forEach((col, i) => { top += S(`M${-182 + i * 26} 90 A${182 - i * 26} ${182 - i * 26} 0 0 1 ${182 - i * 26} 90`, col, 26); });
      top += P('M-36 90 A36 36 0 0 1 36 90Z', '#fff') + P('M-36 90 A36 36 0 0 1 36 90Z', light(c, 0.3), 'opacity="0.6"');
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + ((i + 0.5) / 7) * Math.PI;
        top += C(Math.cos(a) * 130, 90 + Math.sin(a) * 130, 14, '#fff', 'opacity="0.85"') + P(starD(Math.cos(a) * 130, 90 + Math.sin(a) * 130, 10), RB[i % 6]);
      }
      return `<g transform="translate(0 -14)">${rugEdge(d, c, top + C(-170, 84, 22, '#fff') + C(-146, 90, 18, '#fff') + C(170, 84, 22, '#fff') + C(146, 90, 18, '#fff'))}</g>`;
    },
  },
  {
    s: 'space', name: 'Galaxy Story Rug', w: 390, h: 140,
    art: (c) => {
      const d = circD(186);
      let top = P(circD(160), light(c, 0.12));
      for (let i = 0; i < 3; i++) top += S(`M0 0 m${-40 - i * 40} 0 a${40 + i * 40} ${34 + i * 34} 0 1 1 ${80 + i * 80} 0`, light(c, 0.3 + i * 0.1), 6, 'opacity="0.6"');
      for (const [x, y, r] of [[-120, -60, 10], [90, -110, 8], [130, 50, 12], [-60, 120, 9], [40, 140, 7], [-150, 40, 7], [10, -150, 9]]) top += P(starD(x, y, r), ST.space.accent);
      top += C(0, 0, 54, '#ff9ec7') + P('M-54 0 Q0 18 54 0', 'none', `stroke="${dark('#ff9ec7', 0.15)}" stroke-width="6"`) + E(0, 0, 90, 22, 'none', `stroke="${ST.space.accent}" stroke-width="10" transform="rotate(-14)"`) + C(-14, -16, 14, '#fff', 'opacity="0.35"');
      top += G(motif('rocket', 0, 0, 30), 'transform="translate(110 -40) rotate(30)"');
      return rugEdge(d, c, top);
    },
  },
]);

const BOOKCARTS = series('bookcart', 'Book Carts', 'library', 'floor', [
  {
    s: 'sweet', name: 'Pink Book Cart', w: 240, h: 255, spawn: PICTURE_BOOKS,
    art: (c) => {
      let s = S('M98 -206 Q132 -210 132 -240', ST.sweet.wood, 8) + C(132, -244, 7, GOLD);
      s += R(-100, -226, 200, 80, 6, dark(c, 0.3)) + books(-94, 94, -150, 66, 1);
      s += R(-100, -126, 200, 90, 6, dark(c, 0.3)) + books(-94, -10, -40, 74, 4) + cover(-2, -40, 50, 66, '#fff3f8', 'bunny', -10) + cover(46, -40, 48, 62, '#ffd36b', 'star', -4);
      s += box(-108, -154, 216, 18, 8, c) + box(-108, -44, 216, 18, 8, c) + P(`M-108 -136 H108${scallop(108, -108, -136, 9, 3)}Z`, light(c, 0.4));
      s += sym((k) => box(k > 0 ? 96 : -112, -236, 16, 214, 8, c) + P(heartD(104 * k, -200, 8), '#fff'));
      return s + wheel(-86, -14, 14) + wheel(86, -14, 14);
    },
  },
  {
    s: 'modern', name: 'Rolling Book Rack', w: 250, h: 245, spawn: PICTURE_BOOKS,
    art: (c) => {
      const m = ST.modern.accent;
      let s = '';
      const tray = (y: number) => {
        let t = G(books(-96, 0, y, 56, y > -100 ? 2 : 6, ['#4a4a5e', '#ffd36b', '#9aa3b5', '#ffffff', '#ff7a6b']), `transform="rotate(-8 -48 ${y})"`) + G(books(4, 98, y, 56, y > -100 ? 5 : 1, ['#7cc8ff', '#ffffff', '#4a4a5e', '#ffd36b']), `transform="rotate(8 52 ${y})"`);
        t += P(`M-112 ${y - 26} L0 ${y} L112 ${y - 26} L112 ${y - 18} L0 ${y + 10} L-112 ${y - 18}Z`, c) + P(`M-112 ${y - 26} L0 ${y} L112 ${y - 26}`, 'none', `stroke="${m}" stroke-width="4"`);
        for (let x = -100; x <= 100; x += 20) t += Ln(x, y - 22 + Math.abs(x) * -0.0 + (Math.abs(x) / 112) * -4, x, y - 14 + (1 - Math.abs(x) / 112) * 20, m, 1.5, 'opacity="0.5"');
        return t;
      };
      s += sym((k) => R(110 * k - 4, -230, 8, 210, 4, m)) + R(-114, -236, 228, 10, 5, m);
      s += tray(-140) + tray(-40);
      return s + wheel(-100, -12, 12) + wheel(100, -12, 12);
    },
  },
  {
    s: 'retro', name: 'Book Wagon', w: 270, h: 215, spawn: PICTURE_BOOKS,
    art: (c) => {
      const wd = ST.retro.wood;
      let s = books(-104, 104, -86, 90, 2, ['#ff7a6b', '#5fd3b5', '#ffd36b', '#fff3d6', '#7cc8ff']) + cover(-20, -90, 60, 80, '#5fd3b5', 'star', 6);
      s += box(-120, -96, 240, 64, 10, c) + R(-108, -86, 216, 6, 3, '#fff', 'opacity="0.4"');
      for (let x = -96; x <= 96; x += 32) s += R(x - 2, -90, 4, 52, 2, dark(c, 0.15));
      s += R(-90, -76, 180, 30, 15, '#fff3d6') + T(0, -54, 'BOOKS', 20, c);
      s += S('M120 -60 Q170 -66 186 -120', INK, 6) + R(176, -140, 26, 12, 6, ST.retro.accent);
      return s + wheel(-80, -24, 24, wd) + wheel(80, -24, 24, wd) + C(-80, -24, 6, ST.retro.trim) + C(80, -24, 6, ST.retro.trim);
    },
  },
]);

const READCHAIRS = series('readchair', 'Reading Chairs', 'library', 'floor', [
  {
    s: 'sweet', name: 'Wingback Reading Chair', w: 220, h: 270, seats: one(-102),
    art: (c) => {
      const back = 'M-82 -110 V-226 Q-82 -266 -40 -268 H40 Q82 -266 82 -226 V-110Z';
      let s = cloth(back, c) + S(back, light(c, 0.45), 3);
      for (const [x, y] of [[-40, -230], [0, -238], [40, -230], [-20, -196], [20, -196], [-40, -160], [0, -164], [40, -160]]) s += btn(x, y, c);
      s += sym((k) => cloth(`M${86 * k} -116 V-216 Q${86 * k} -244 ${110 * k} -246 Q${112 * k} -200 ${106 * k} -150 Z`, dark(c, 0.06)));
      s += sym((k) => box(k > 0 ? 70 : -106, -150, 36, 104, 18, c) + hi(76 * k - (k > 0 ? 0 : 20), -144, 20, 4));
      s += cush(-74, -112, 148, 32, light(c, 0.15)) + box(-100, -82, 200, 48, 8, dark(c, 0.1));
      s += P(`M-100 -42 H100${scallop(100, -100, -42, 8, 4)}Z`, light(c, 0.45));
      s += P(heartD(30, -158, 40), light(c, 0.45)) + P(heartD(30, -158, 40), 'url(#g-face)');
      return s + sym((k) => R(82 * k - 5, -34, 10, 34, 4, GOLD));
    },
  },
  {
    s: 'cottage', name: 'Comfy Granny Chair', w: 240, h: 245, seats: one(-104),
    art: (c) => {
      const so = ST.cottage.soft;
      const back = 'M-96 -100 Q-110 -240 0 -240 Q110 -240 96 -100Z';
      let s = cloth(back, c, 'flowers') + S(back, light(c, 0.4), 4);
      s += sym((k) => cloth(`M${70 * k} -150 Q${126 * k} -160 ${118 * k} -100 L${112 * k} -40 L${74 * k} -40Z`, c, 'flowers') + E(102 * k, -150, 22, 14, light(c, 0.2)));
      s += cush(-80, -114, 160, 36, light(c, 0.2), 'flowers', 16) + box(-104, -80, 208, 50, 12, dark(c, 0.06));
      s += P('M70 -170 L120 -160 L114 -60 L80 -40 L64 -110Z', so) + fringeRow(84, 116, -50, 12, '#ff9ec7');
      for (let y = -150; y < -60; y += 18) s += S(`M80 ${y} L112 ${y + 6}`, '#ff9ec7', 3, 'stroke-dasharray="4 4"');
      return s + sym((k) => P(`M${86 * k} -30 L${92 * k} 0 L${80 * k} 0 L${76 * k} -30Z`, ST.cottage.wood));
    },
  },
  {
    s: 'modern', name: 'Scoop Lounge Chair', w: 220, h: 230, seats: one(-98), color: '#7cc8ff',
    art: (c) => {
      const m = ST.modern.accent;
      let s = sym((k) => Ln(30 * k, -70, 70 * k, 0, m, 5) + Ln(10 * k, -70, 40 * k, 0, m, 5));
      s += cloth('M-100 -150 Q-110 -76 -60 -70 H60 Q110 -76 100 -150 Q90 -210 0 -214 Q-90 -210 -100 -150Z', c) + S('M-100 -150 Q-90 -210 0 -214 Q90 -210 100 -150', light(c, 0.5), 3);
      s += cloth('M-84 -140 Q-88 -98 -54 -94 H54 Q88 -98 84 -140 Q78 -190 0 -192 Q-78 -190 -84 -140Z', ST.modern.soft);
      s += box(-30, -156, 60, 44, 14, '#ffd36b') + P('M-22 -116 L0 -150 L22 -116Z', '#fff', 'opacity="0.4"');
      return s + cush(-74, -106, 148, 24, light(ST.modern.soft, 0.2), 'none', 10);
    },
  },
]);

const FLOORCUSHIONS = series('floorcushion', 'Bean Bags & Floor Cushions', 'library', 'floor', [
  {
    s: 'rainbow', name: 'Open Book Cushion', w: 280, h: 125, seats: one(-64),
    art: (c) => {
      let s = P('M-136 -4 Q-140 -60 -128 -96 Q-60 -112 0 -86 Q60 -112 128 -96 Q140 -60 136 -4 Q60 -24 0 0 Q-60 -24 -136 -4Z', dark(c, 0.15));
      s += cloth('M-124 -16 Q-128 -64 -118 -96 Q-60 -110 0 -80 L0 -12 Q-60 -36 -124 -16Z', '#fffaf0') + cloth('M124 -16 Q128 -64 118 -96 Q60 -110 0 -80 L0 -12 Q60 -36 124 -16Z', '#fffaf0');
      for (let i = 0; i < 4; i++) s += sym((k) => S(`M${16 * k} ${-70 + i * 14} Q${56 * k} ${-92 + i * 14} ${100 * k} ${-82 + i * 14}`, RB[(i + (k > 0 ? 2 : 0)) % 6], 4, 'opacity="0.7"'));
      s += S('M0 -82 V-10', dark(c, 0.2), 4) + R(-6, -100, 12, 30, 3, '#ff4f8b') + P('M-6 -70 L0 -62 L6 -70Z', '#ff4f8b');
      return s + R(-136, -10, 272, 10, 5, c);
    },
  },
  {
    s: 'space', name: 'Planet Bean Bag', w: 220, h: 145, color: '#c99bff', seats: one(-66),
    art: (c) => {
      let s = E(0, -138 + 66, 100, 64, 'none', `stroke="${ST.space.accent}" stroke-width="14" opacity="0.9"`);
      s += cloth('M-96 -6 C-108 -80 -60 -134 0 -134 C60 -134 108 -80 96 -6 Q0 8 -96 -6Z', c, 'stars') + C(-46, -96, 14, light(c, 0.3)) + C(40, -40, 10, dark(c, 0.1)) + C(56, -100, 7, dark(c, 0.1));
      s += P('M-110 -60 Q0 -30 110 -60 Q100 -48 92 -44 Q0 -18 -92 -44 Q-102 -48 -110 -60Z', ST.space.accent);
      return s;
    },
  },
  {
    s: 'candy', name: 'Marshmallow Pouf Stack', w: 170, h: 120, seats: one(-110),
    art: (c) => {
      let s = '';
      [[-4, 40, '#ffffff'], [-42, 38, c], [-80, 36, ST.candy.accent]].forEach(([y, h, col]) => {
        const yy = y as number;
        s += box(-74, yy - (h as number), 148, h as number, 18, col as string, 'none', 'y') + E(0, yy - (h as number) + 4, 70, 8, light(col as string, 0.35));
      });
      return s + E(0, -112, 70, 8, '#fff', 'opacity="0.6"') + sym((k) => C(50 * k, -60, 3, '#fff')) + P(heartD(0, -64, 16), '#fff', 'opacity="0.8"');
    },
  },
]);

/** A spinning globe: its continents slide behind a round window when on. */
function globe(id: string, cx: number, cy: number, r: number, land: string, on: boolean): string {
  const blobs = (ox: number) => P(`M${ox - 30} -20 q10 -16 26 -10 q14 8 4 22 q-6 16 -20 10 q-16 -6 -10 -22Z M${ox + 18} 6 q14 -8 22 4 q6 16 -8 24 q-12 4 -14 -10Z M${ox - 10} 26 q10 -4 14 6 q-4 8 -14 4Z M${ox + 30} -34 q12 -4 16 6 q-6 8 -16 2Z`, land);
  const move = on ? '<animateTransform attributeName="transform" type="translate" values="0 0;-120 0" dur="4s" repeatCount="indefinite"/>' : '';
  return `<clipPath id="${id}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/></clipPath>` + C(cx, cy, r, '#7cc8ff') +
    `<g clip-path="url(#${id})"><g transform="translate(${f(cx)} ${f(cy)}) scale(${sc(r / 60)})"><g>${move}${blobs(0)}${blobs(120)}</g></g></g>` +
    C(cx, cy, r, 'url(#g-face)') + C(cx - r * 0.35, cy - r * 0.4, r * 0.18, '#fff', 'opacity="0.5"');
}
const GLOBES = series('globestand', 'Globe Stands', 'library', 'floor', [
  {
    s: 'sweet', name: 'Spinning Floor Globe', w: 170, h: 300, toggle: true,
    art: (c, on) => {
      const wd = ST.sweet.wood;
      let s = sym((k) => S(`M0 -96 Q${30 * k} -60 ${54 * k} 0`, dark(wd, 0.2), 9)) + R(-6, -130, 12, 40, 5, dark(wd, 0.2)) + E(0, -96, 24, 8, wd);
      s += globe('lzc-globe-sweet', 0, -200, 64, light(c, 0.1), on);
      s += S('M-30 -262 A70 70 0 0 1 -30 -138', GOLD, 7) + P('M-36 -270 A78 78 0 1 1 -36 -130', 'none', `stroke="${dark(wd, 0.2)}" stroke-width="4"`) + C(0, -274, 6, GOLD) + C(0, -126, 6, GOLD);
      return s + P(heartD(0, -150, 10), '#fff', 'opacity="0.7"');
    },
  },
  {
    s: 'princess', name: 'Golden Armillary Globe', w: 170, h: 300, toggle: true,
    art: (c, on) => {
      let s = sym((k) => S(`M${6 * k} -110 Q${20 * k} -50 ${60 * k} -4`, GOLD, 7) + C(60 * k, -4, 7, GOLD)) + Ln(0, -110, 0, -6, GOLD, 7) + C(0, -6, 7, GOLD);
      s += E(0, -112, 30, 10, GOLD);
      s += globe('lzc-globe-princess', 0, -200, 58, c, on);
      s += E(0, -200, 76, 20, 'none', `stroke="${GOLD}" stroke-width="5" transform="rotate(-20 0 -200)"`) + E(0, -200, 20, 76, 'none', `stroke="${GOLD}" stroke-width="4"`) + C(0, -200, 76, 'none', `stroke="${GOLD}" stroke-width="5"`);
      return s + motif('crown', 0, -290, 14);
    },
  },
]);

const READLAMPS = series('readlamp', 'Reading Lamps', 'library', 'floor', [
  {
    s: 'sweet', name: 'Arc Reading Lamp', w: 220, h: 400, toggle: true,
    art: (c, on) => {
      let s = E(-70, -8, 40, 12, dark(c, 0.25)) + S('M-70 -10 V-280 Q-70 -380 20 -380 Q70 -380 70 -330', GOLD, 8);
      s += on ? glow(70, -260, 150) : '';
      s += P('M30 -330 Q70 -350 110 -330 L118 -290 H22Z', on ? '#fff6c8' : c) + P('M30 -330 Q70 -350 110 -330 L118 -290 H22Z', 'url(#g-shadeX)');
      s += P(`M22 -292 H118${scallop(118, 22, -292, 6, 3)}Z`, '#fff') + C(70, -284, 6, on ? '#fff' : light(c, 0.4));
      return s + P(heartD(70, -324, 12), '#fff', 'opacity="0.7"');
    },
  },
  {
    s: 'retro', name: 'Green Banker Lamp', w: 140, h: 120, mount: 'prop', color: '#3fbf8f', toggle: true,
    art: (c, on) => {
      let s = R(-50, -14, 100, 14, 6, GOLD) + R(-4, -70, 8, 56, 3, GOLD) + R(40, -40, 4, 26, 2, GOLD) + C(42, -42, 4, GOLD);
      s += on ? glow(0, -40, 80) : '';
      s += P('M-56 -66 Q-50 -100 0 -102 Q50 -100 56 -66Z', c) + P('M-56 -66 Q-50 -100 0 -102 Q50 -100 56 -66Z', 'url(#g-shadeY)') + R(-58, -70, 116, 6, 3, GOLD);
      return s + (on ? E(0, -62, 40, 5, '#fff6c8') : '') + hi(-36, -94, 30, 5, 0.4);
    },
  },
]);

const QUIETSIGNS = series('quietsign', 'Quiet Signs', 'library', 'wall', [
  {
    s: 'sweet', name: 'Shhh Cloud Sign', w: 240, h: 150,
    art: (c) => {
      const d = 'M-90 50 Q-120 50 -116 20 Q-130 -14 -96 -24 Q-96 -64 -50 -60 Q-30 -80 0 -66 Q30 -82 56 -58 Q100 -66 100 -26 Q128 -10 112 22 Q116 52 86 50Z';
      let s = P(d, c, 'transform="translate(0 6)"') + P(d, '#fff') + S(d, c, 5);
      s += T(0, 0, 'Shhh...', 40, dark(c, 0.3)) + sleepyEye(-30, 22, 7) + sleepyEye(30, 22, 7) + E(-54, 30, 10, 5, c, 'opacity="0.5"') + E(54, 30, 10, 5, c, 'opacity="0.5"');
      return s + zzz(96, -50) + T(0, 46, 'quiet please', 12, dark(c, 0.15));
    },
  },
  {
    s: 'woodland', name: 'Hush Owl Sign', w: 220, h: 200,
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = S('M-70 -20 L0 -90 L70 -20', '#c9a27e', 3) + C(0, -90, 5, '#8a8fa3');
      s += box(-100, -20, 200, 90, 12, wd) + Ln(-90, 10, 90, 10, dark(wd, 0.15), 2) + Ln(-90, 40, 90, 40, dark(wd, 0.15), 2);
      s += T(0, 44, 'QUIET', 42, '#fff4e0') + leafy(-92, -18, 16, c) + leafy(92, -16, 14, c);
      return s + owl(30, -20, 1.3, '#c98a5a');
    },
  },
]);

const BOOKBINS = series('bookbin', 'Picture-Book Bins', 'library', 'floor', [
  {
    s: 'sweet', name: 'Picture Book Bin', w: 250, h: 165, spawn: PICTURE_BOOKS,
    art: (c) => {
      let s = box(-112, -150, 224, 30, 8, dark(c, 0.15));
      s += cover(-104, -66, 60, 84, '#7cc8ff', 'star', -8) + cover(-48, -66, 60, 90, '#ffd36b', 'bunny', -3) + cover(8, -66, 60, 86, '#c99bff', 'rainbow', 3) + cover(62, -66, 54, 80, '#5fd3b5', 'fish', 8);
      s += box(-120, -86, 240, 80, 12, c) + P(heartD(0, -76, 44), light(c, 0.5)) + P(heartD(0, -76, 44), 'url(#g-face)') + T(0, -42, 'BOOKS', 15, dark(c, 0.35));
      s += sym((k) => C(88 * k, -46, 8, '#fff', 'opacity="0.7"'));
      return s + sym((k) => R(100 * k - 10, -8, 20, 8, 3, dark(c, 0.3)));
    },
  },
  {
    s: 'beach', name: 'Sailboat Book Bin', w: 290, h: 320, spawn: PICTURE_BOOKS,
    art: (c) => {
      let s = R(-34, -310, 7, 220, 3, ST.beach.wood) + P('M-26 -300 Q40 -240 70 -130 H-26Z', '#fff') + P('M-26 -300 Q40 -240 70 -130 H-26Z', 'url(#g-shadeX)') + P('M-34 -306 L-34 -290 L-62 -298Z', '#ff6f91');
      s += P('M-26 -250 Q14 -220 32 -170 H-26Z', '#ff9ec7', 'opacity="0.6"');
      s += cover(-110, -76, 56, 74, '#ffd36b', 'fish', -10) + cover(-60, -76, 56, 80, '#ff9ec7', 'star', -2) + cover(-4, -76, 56, 76, '#5fd3b5', 'shark', 5) + cover(48, -76, 50, 70, '#fff', 'sun', 10);
      s += cloth('M-140 -90 H140 Q124 -20 90 -8 H-90 Q-124 -20 -140 -90Z', c) + P('M-136 -72 H136 L132 -60 H-132Z', '#fff') + P('M-128 -46 H128 L122 -34 H-122Z', '#fff');
      return s + C(98, -60, 10, '#fff') + C(98, -60, 6, c) + S('M-104 0 q12 -8 24 0 t24 0 M40 2 q12 -8 24 0 t24 0', '#7cc8ff', 3);
    },
  },
  {
    s: 'woodland', name: 'Hedgehog Book Bin', w: 290, h: 185, spawn: PICTURE_BOOKS,
    art: (c) => {
      const br = '#a86b4a';
      let s = '';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + 0.25 + (i / 8) * (Math.PI - 0.7);
        const x = -10 + Math.cos(a) * 112;
        const y = -60 + Math.sin(a) * 90;
        const col = BOOKC[i % BOOKC.length];
        s += G(R(-9, -50, 18, 60, 3, col) + R(-6, -44, 12, 3, 1.5, '#fff', 'opacity="0.6"'), `transform="translate(${f(x)} ${f(y + 20)}) rotate(${f((a * 180) / Math.PI + 90)})"`);
      }
      s += cloth('M-130 -10 Q-140 -110 -20 -116 Q90 -116 112 -50 Q132 -40 138 -24 Q130 -10 100 -8Z', br) + P('M60 -96 Q112 -84 120 -50 Q132 -40 138 -24 Q130 -10 100 -8 Q60 -40 60 -96Z', '#f4dcb8');
      s += C(108, -54, 5, INK) + C(110, -56, 1.5, '#fff') + C(138, -26, 7, INK) + E(96, -32, 9, 5, '#ff9ec7', 'opacity="0.7"') + leafy(-60, -106, 14, c);
      s += R(-110, -70, 140, 36, 18, light(br, 0.4)) + T(-40, -45, 'BOOKS', 20, dark(br, 0.2));
      return s + E(-90, -6, 18, 8, dark(br, 0.2)) + E(60, -6, 18, 8, dark(br, 0.2));
    },
  },
]);

const LADDERS = series('laddershelf', 'Ladder Shelves', 'library', 'floor', [
  {
    s: 'sweet', name: 'Leaning Ladder Shelf', w: 210, h: 390,
    surfaces: [{ x1: -60, x2: 60, y: -306 }, { x1: -72, x2: 72, y: -212 }, { x1: -84, x2: 84, y: -118 }],
    art: (c) => {
      let s = sym((k) => P(`M${88 * k} 0 L${58 * k} -380 L${48 * k} -380 L${76 * k} 0Z`, ST.sweet.wood));
      const board = (y: number, hw: number) => R(-hw, y, hw * 2, 12, 5, c) + hi(-hw + 6, y + 2, hw, 3, 0.4);
      s += books(-56, 0, -306, 48, 1) + potPlant(30, -306, 0.9, '#fff', '#5fc47c');
      s += teddy(-46, -212, 1.1) + books(-16, 66, -212, 52, 3);
      s += books(-80, 10, -118, 56, 5) + P('M30 -118 L80 -118 L74 -156 L36 -156Z', '#f4dca0') + P('M30 -150 H80', 'none', 'stroke="#d9b98a" stroke-width="2"') + C(48, -160, 8, '#ff9ec7') + C(62, -162, 8, '#7cc8ff');
      s += board(-306, 62) + board(-212, 74) + board(-118, 86) + board(-24, 96);
      return s + P(heartD(0, -366, 16), c);
    },
  },
]);

const MAGRACKS = series('magrack', 'Magazine Racks', 'library', 'floor', [
  {
    s: 'retro', name: 'Comic Book Rack', w: 180, h: 260,
    art: (c) => {
      let s = sym((k) => R(78 * k - 3, -250, 6, 250, 3, ST.retro.metal)) + R(-82, -254, 164, 8, 4, ST.retro.metal);
      const covers = [['WOW!', '#ffd36b'], ['POW', '#5fd3b5'], ['ZAP', '#ff9ec7'], ['YAY', '#7cc8ff'], ['HI!', '#fff3d6'], ['OH!', '#c99bff']];
      for (let r = 0; r < 3; r++) {
        const y = -170 + r * 76;
        for (let i = 0; i < 2; i++) {
          const [t, col] = covers[r * 2 + i];
          s += G(R(-70 + i * 72, y - 60, 64, 84, 3, col) + R(-64 + i * 72, y - 54, 52, 14, 2, c) + T(-38 + i * 72, y - 12, t, 18, INK) + P(starD(-38 + i * 72, y + 8, 9), '#fff'), `transform="rotate(${i ? 4 : -4} ${-38 + i * 72} ${y})"`);
        }
        s += R(-82, y + 18, 164, 7, 3, c);
      }
      return s + sym((k) => R(78 * k - 10, -6, 20, 6, 3, INK));
    },
  },
]);

const LOFTS = series('treeloft', 'Reading Lofts', 'library', 'floor', [
  {
    s: 'woodland', name: 'Treehouse Reading Loft', w: 440, h: 590, seats: [{ x: -40, y: -306, pose: 'sit' }, { x: -160, y: -64, pose: 'sit' }],
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = '';
      for (const [x, y, r] of [[-170, -470, 60], [-90, -520, 70], [10, -540, 74], [110, -510, 70], [180, -450, 56], [-180, -380, 40], [176, -360, 42]]) s += leafy(x, y, r, c);
      s += P('M-44 0 Q-30 -160 -40 -310 H40 Q30 -160 44 0Z', wd) + P('M-44 0 Q-70 -6 -84 4 H-24Z M44 0 Q70 -6 84 4 H24Z', dark(wd, 0.1));
      s += R(-26, -240, 52, 150, 10, dark(wd, 0.45)) + R(-26, -168, 52, 6, 2, wd) + books(-22, 22, -168, 60, 1) + books(-22, 22, -92, 60, 4);
      s += box(-120, -460, 240, 150, 6, light(wd, 0.2)) + P('M-140 -456 L0 -560 L140 -456Z', ST.woodland.accent) + P('M-140 -456 L0 -560 L0 -456Z', '#fff', 'opacity="0.15"');
      for (let y = -440; y < -320; y += 22) s += Ln(-116, y, 116, y, dark(wd, 0.08), 2, 'opacity="0.6"');
      s += C(70, -400, 32, '#fff3d6') + C(70, -400, 26, '#3f4f9a') + C(70, -400, 26, 'url(#g-glass)') + Ln(70, -426, 70, -374, '#fff3d6', 4) + Ln(44, -400, 96, -400, '#fff3d6', 4);
      s += R(-100, -430, 70, 50, 6, '#fff3d6') + T(-65, -398, 'READ', 18, wd);
      s += box(-180, -316, 360, 20, 8, dark(wd, 0.1)) + hi(-170, -314, 260, 3, 0.3);
      for (const x of [-176, 176]) s += R(x - 5, -380, 10, 64, 4, dark(wd, 0.1));
      s += S('M-176 -370 Q-160 -360 -150 -370 M176 -370 Q160 -360 150 -370', dark(wd, 0.1), 5);
      s += R(126, -296, 8, 296, 4, '#c9a27e') + R(170, -296, 8, 296, 4, '#c9a27e');
      for (let y = -270; y < -10; y += 36) s += R(128, y, 48, 7, 3, '#e8c49a');
      s += R(100, -360, 40, 44, 6, '#f4dca0') + books(104, 136, -316, 34, 3);
      s += box(-196, -60, 72, 60, 10, wd) + E(-160, -60, 36, 10, light(wd, 0.35)) + cush(-194, -74, 68, 18, ST.woodland.soft, 'check', 8);
      return s + owl(-150, -460, 0.9, '#ffab5e') + C(-60, -520, 7, '#ff6f91') + C(120, -540, 7, '#ff6f91');
    },
  },
  {
    s: 'princess', name: 'Castle Tower Loft', w: 420, h: 600, seats: [{ x: -40, y: -306, pose: 'sit' }],
    art: (c) => {
      const stone = '#f4eef8';
      let s = R(-60, -560, 6, 90, 3, GOLD) + `<path d="M-54 -560 Q-24 -572 4 -556 Q-24 -544 -54 -548Z" fill="${c}"><animate attributeName="d" values="M-54 -560 Q-24 -572 4 -556 Q-24 -544 -54 -548Z;M-54 -560 Q-24 -548 4 -560 Q-24 -540 -54 -548Z;M-54 -560 Q-24 -572 4 -556 Q-24 -544 -54 -548Z" dur="1.6s" repeatCount="indefinite"/></path>`;
      s += box(-100, -470, 200, 160, 6, stone) + P('M-120 -466 L0 -480 L120 -466 L0 -580Z', c) + P('M-120 -466 L0 -580 L0 -480Z', '#fff', 'opacity="0.15"');
      s += P('M-30 -310 V-380 A30 30 0 0 1 30 -380 V-310Z', dark(c, 0.3)) + P(heartD(0, -420, 22), c) + P(heartD(0, -420, 22), 'url(#g-face)');
      for (let x = -180; x <= 150; x += 44) s += R(x, -350, 30, 36, 4, stone) + R(x, -350, 30, 36, 4, 'url(#g-shadeY)', 'opacity="0.4"');
      s += box(-190, -316, 380, 20, 6, light(c, 0.4)) + R(-190, -300, 380, 6, 3, GOLD);
      s += box(-90, -296, 180, 296, 6, stone);
      for (let y = -280; y < 0; y += 30) for (let x = -86 + ((y / 30) % 2 ? 0 : 20); x < 80; x += 40) s += R(x, y, 36, 26, 5, dark(stone, 0.04), 'opacity="0.9"');
      s += P('M-36 0 V-90 A36 36 0 0 1 36 -90 V0Z', c) + P('M-28 0 V-88 A28 28 0 0 1 28 -88 V0Z', light(c, 0.3)) + C(16, -50, 4, GOLD);
      s += P('M-20 -180 V-216 A20 20 0 0 1 20 -216 V-180Z', '#cfe9ff') + P('M-20 -180 V-216 A20 20 0 0 1 20 -216 V-180Z', 'url(#g-glass)');
      s += R(116, -296, 8, 296, 4, '#fff') + R(160, -296, 8, 296, 4, '#fff');
      for (let y = -270; y < -10; y += 36) s += R(118, y, 48, 7, 3, GOLD);
      return s + sym((k) => C(94 * k, -40, 22, '#5fc47c') + C(94 * k + 8, -48, 5, '#ff9ec7'));
    },
  },
]);

const BOOKSTACKS = series('bookstack', 'Book Stacks', 'library', 'prop', [
  {
    s: 'sweet', name: 'Book Stack & Teacup', w: 110, h: 110,
    art: (c) => {
      let s = flatBook(-48, 0, 96, 16, c) + flatBook(-40, -16, 84, 14, '#ffffff') + flatBook(-46, -30, 90, 16, light(c, 0.3)) + flatBook(-36, -46, 76, 14, '#c99bff');
      s += R(14, -46, 6, 22, 2, '#ff4f8b') + P('M14 -24 L17 -18 L20 -24Z', '#ff4f8b');
      s += E(-3, -60, 24, 4, '#f0e6ee');
      s += P('M-22 -80 H16 Q14 -60 -3 -60 Q-20 -60 -22 -80Z', '#fff') + S('M16 -76 q10 0 8 8 q-2 6 -10 4', '#fff', 3) + P(heartD(-3, -76, 8), c);
      return s + `<g opacity="0.6">${pulse(0.6, 0.1, 2)}${S('M-8 -86 q-4 -8 0 -14 M2 -86 q4 -8 0 -14', '#fff', 2)}</g>`;
    },
  },
  {
    s: 'rainbow', name: 'Wobbly Rainbow Stack', w: 110, h: 160,
    art: () => {
      let s = '';
      RB.forEach((col, i) => { s += G(flatBook(-44 + (i % 2) * 6, -i * 20, 88 - i * 4, 18, col), `transform="rotate(${((i % 3) - 1) * 3} 0 ${-i * 20 - 9})"`); });
      return `<g>${sway(2, 0, 0, 3)}${s}${P(starD(0, -138, 14), '#ffd24a')}${C(-4, -140, 1.6, INK)}${C(4, -140, 1.6, INK)}</g>`;
    },
  },
  {
    s: 'woodland', name: 'Owl on Books', w: 110, h: 120,
    art: (c) => flatBook(-48, 0, 96, 18, '#e8573d') + flatBook(-42, -18, 86, 16, c) + flatBook(-46, -34, 90, 16, '#f4dca0') + owl(0, -50, 1.3, '#a86b4a') + leafy(36, -54, 9, c),
  },
]);

const PICTUREBOOKS = series('picturebook', 'Picture Books', 'library', 'prop', [
  { s: 'sweet', name: 'Unicorn Picture Book', w: 80, h: 100, art: (c) => cover(-34, 0, 68, 90, c, 'unicorn') + R(-34, -4, 68, 4, 2, dark(c, 0.2)) },
  {
    s: 'woodland', name: 'Pop-Up Forest Book', w: 120, h: 90,
    art: (c) => P('M-56 0 L-50 -24 Q-24 -32 0 -22 Q24 -32 50 -24 L56 0 Q28 -8 0 0 Q-28 -8 -56 0Z', '#a86b4a') + P('M-50 -6 L-46 -26 Q-22 -34 0 -24 L0 -6 Q-24 -14 -50 -6Z', '#fffaf0') + P('M50 -6 L46 -26 Q22 -34 0 -24 L0 -6 Q24 -14 50 -6Z', '#fffaf0') +
      P('M-30 -24 L-20 -64 L-10 -24Z', c) + P('M10 -26 L22 -78 L34 -26Z', dark(c, 0.1)) + C(-2, -46, 8, '#ff6f91') + R(-3, -38, 3, 14, 1, '#fff'),
  },
  { s: 'space', name: 'Rocket Picture Book', w: 80, h: 100, art: (c) => cover(-34, 0, 68, 90, c, 'rocket') + P(starD(24, -80, 6), ST.space.accent) },
]);

const LIBPOSTERS = series('libposter', 'Library Posters', 'library', 'wall', [
  {
    s: 'sweet', name: 'Bookworm READ Poster', w: 180, h: 240,
    art: (c) => {
      let s = box(-90, -120, 180, 240, 8, '#ffffff') + R(-78, -108, 156, 216, 5, light(c, 0.55));
      s += T(0, -60, 'READ!', 44, dark(c, 0.3));
      s += flatBook(-56, 90, 112, 24, c) + flatBook(-50, 66, 100, 20, '#7cc8ff');
      s += `<g>${bob(0, -6, 1.6)}${S('M-16 46 Q-30 20 -10 6 Q10 -8 4 -24', '#7fe0b0', 18)}${C(4, -30, 16, '#7fe0b0')}${C(-2, -32, 6, 'none', `stroke="${INK}" stroke-width="2"`)}${C(12, -32, 6, 'none', `stroke="${INK}" stroke-width="2"`)}${Ln(4, -32, 6, -32, INK, 2)}${C(-2, -32, 2, INK)}${C(12, -32, 2, INK)}${S('M0 -22 q5 4 10 0', INK, 2)}</g>`;
      return s + P(heartD(56, -26, 14), c) + P(heartD(-60, -10, 10), '#fff');
    },
  },
  {
    s: 'space', name: 'Read to the Stars Poster', w: 180, h: 240,
    art: (c) => {
      let s = box(-90, -120, 180, 240, 8, ST.space.accent) + R(-78, -108, 156, 216, 5, c);
      for (const [x, y] of [[-50, -80], [40, -90], [60, -20], [-60, 0], [10, -50]]) s += twinkle(x, y, 6, '#fff', 2, x / 100 + 1);
      s += P('M-60 90 Q-30 76 0 86 Q30 76 60 90 L60 70 Q30 56 0 66 Q-30 56 -60 70Z', '#fff') + S('M0 66 V86', '#c9cfdd', 2);
      s += `<g>${bob(0, -10, 2)}${G(motif('rocket', 0, 0, 30), 'transform="translate(4 20) rotate(20)"')}</g>` + S('M-6 60 Q-10 50 -4 40', '#ffab3d', 4, 'stroke-dasharray="4 6"');
      return s + T(0, -50, 'READ', 34, '#fff') + T(0, -24, 'to the stars', 14, ST.space.accent);
    },
  },
]);

const fringeRow = (x1: number, x2: number, y: number, len: number, col: string) => {
  let s = '';
  for (let x = x1; x <= x2; x += 6) s += Ln(x, y, x, y + len, col, 2);
  return s;
};

const LIBRARY: FurnDef[] = [
  ...TALLSHELVES, ...NOOKS, ...LIBDESKS, ...STORYRUGS, ...BOOKCARTS, ...READCHAIRS, ...FLOORCUSHIONS, ...GLOBES, ...READLAMPS,
  ...QUIETSIGNS, ...BOOKBINS, ...LADDERS, ...MAGRACKS, ...LOFTS, ...BOOKSTACKS, ...PICTUREBOOKS, ...LIBPOSTERS,
];

// =====================================================================================
// CINEMA
// =====================================================================================
const SNACKS = ['cinePopcorn', 'cinePopcornBag', 'cineNachos', 'cineSoda', 'cineCandy'];

const SCREENS = series('moviescreen', 'Movie Screens', 'cinema', 'wall', [
  {
    s: 'sweet', name: 'Sweetheart Movie Screen', w: 640, h: 410,
    art: (c, on) => {
      let s = R(-296, -172, 592, 360, 10, '#3d3a52') + screen(-262, -144, 524, 290, 'pony', on);
      s += drapes(-312, 312, -170, 196, c, on, 'none', '#ffffff', 0.09);
      s += cloth(`M-318 -206 H318 V-160${scallop(318, -318, -160, 14, 6)}Z`, light(c, 0.2)) + R(-322, -210, 644, 12, 6, GOLD);
      for (let i = 0; i < 14; i++) s += P(heartD(-295 + i * 45.4, -184, 13), '#fff', 'opacity="0.85"');
      return s;
    },
  },
  {
    s: 'princess', name: 'Royal Velvet Screen', w: 660, h: 420,
    art: (c, on) => {
      const vel = dark(c, 0.35);
      let s = R(-306, -176, 612, 364, 8, GOLD) + R(-292, -162, 584, 336, 6, '#3d3a52') + screen(-270, -144, 540, 296, 'castle', on);
      s += drapes(-316, 316, -168, 200, vel, on, 'none', GOLD, 0.09);
      s += cloth('M-328 -210 H328 V-150 Q300 -124 272 -150 Q244 -124 216 -150 Q188 -124 160 -150 Q132 -124 104 -150 Q76 -124 48 -150 Q20 -124 -8 -150 Q-36 -124 -64 -150 Q-92 -124 -120 -150 Q-148 -124 -176 -150 Q-204 -124 -232 -150 Q-260 -124 -288 -150 Q-310 -128 -328 -150Z', vel);
      s += S('M-328 -150 Q-310 -128 -288 -150 Q-260 -124 -232 -150 Q-204 -124 -176 -150 Q-148 -124 -120 -150 Q-92 -124 -64 -150 Q-36 -124 -8 -150 Q20 -124 48 -150 Q76 -124 104 -150 Q132 -124 160 -150 Q188 -124 216 -150 Q244 -124 272 -150 Q300 -124 328 -150', GOLD, 5);
      for (let x = -300; x <= 300; x += 56) s += R(x - 3, -142, 6, 16, 3, GOLD);
      return s + R(-334, -214, 668, 12, 6, GOLD) + motif('crown', 0, -222, 26);
    },
  },
  {
    s: 'modern', name: 'Widescreen Home Cinema', w: 660, h: 380,
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = R(-300, -160, 600, 330, 6, INK) + screen(-288, -148, 576, 306, 'space', on, 2);
      s += on ? sym((k) => R(296 * k - (k > 0 ? 0 : 30), -148, 30, 306, 4, ST.modern.soft) + Ln(296 * k + (k > 0 ? 15 : -15), -140, 296 * k + (k > 0 ? 15 : -15), 150, '#fff', 2, 'opacity="0.4"'))
        : R(-300, -160, 300, 330, 2, ST.modern.soft) + R(0, -160, 300, 330, 2, ST.modern.soft) + Ln(0, -160, 0, 170, a, 2) + [-240, -160, -80, 80, 160, 240].map((x) => Ln(x, -156, x, 166, '#fff', 2, 'opacity="0.25"')).join('');
      s += R(-320, -190, 640, 32, 6, c) + R(-320, -190, 640, 32, 6, 'url(#g-shadeY)') + T(0, -166, 'CINEMA', 18, a, 'letter-spacing="8"');
      return s + sym((k) => C(290 * k, -174, 5, on ? '#7fe0b0' : '#9aa3b5'));
    },
  },
  {
    s: 'beach', name: 'Seaside Movie Screen', w: 640, h: 410,
    art: (c, on) => {
      let s = R(-296, -172, 592, 360, 10, '#2d4a6a') + screen(-262, -144, 524, 290, 'sea', on);
      s += drapes(-312, 312, -170, 196, c, on, 'stripes', '#ffffff', 0.09);
      let wave = 'M-320 -206 H320 V-160';
      for (let i = 0; i < 16; i++) wave += ` Q${f(320 - 40 * i - 10)} -176 ${f(320 - 40 * i - 20)} -160 Q${f(320 - 40 * i - 30)} -144 ${f(320 - 40 * (i + 1))} -160`;
      s += cloth(wave + 'Z', '#4f9dff') + S('M-320 -186 H320', '#fff', 3, 'stroke-dasharray="14 10" opacity="0.6"');
      return s + G(motif('fish', 0, 0, 16), 'transform="translate(-260 -184)"') + G(motif('starfish', 0, 0, 16), 'transform="translate(260 -184)"') + E(0, -190, 30, 14, '#fff3d6') + S('M-24 -190 Q0 -210 24 -190', '#ffb3c7', 3);
    },
  },
  {
    s: 'retro', name: 'Golden Age Picture Screen', w: 660, h: 430,
    art: (c, on) => {
      let s = R(-310, -180, 620, 376, 12, ST.retro.trim) + R(-296, -166, 592, 348, 8, '#3d3a52') + screen(-266, -140, 532, 292, 'dino', on);
      s += drapes(-314, 314, -168, 200, c, on, 'none', ST.retro.trim, 0.09);
      s += P('M-330 -150 H330 L310 -214 H-310Z', dark(c, 0.15)) + bulbs(-300, -200, 300, -200, 21, true, 5);
      return s + P('M-60 -214 L0 -246 L60 -214Z', ST.retro.trim) + P(starD(0, -226, 12), '#fff');
    },
  },
], { toggle: true, sfx: 'music' });

// a cinema seat back, its cushion, and the arms (which stand down to the floor)
const cushSeat = (x: number, w: number, c: string) => cush(x - w / 2 - 3, -110, w + 6, 30, c, 'none', 12) + R(x - w / 2, -80, w, 12, 4, dark(c, 0.35));
const cArm = (x: number, c: string, top = -140) => box(x - 12, top, 24, -top, 9, c) + hi(x - 7, top + 4, 8, 3, 0.4);
const cup = (x: number, y: number, col = '#ff4f6d') => E(x, y, 11, 4, INK) + P(`M${f(x - 9)} ${f(y - 22)} L${f(x + 9)} ${f(y - 22)} L${f(x + 7)} ${f(y)} L${f(x - 7)} ${f(y)}Z`, col) + R(x - 10, y - 26, 20, 5, 2.5, '#fff') + Ln(x + 2, y - 26, x + 6, y - 40, '#fff', 2.5) + R(x - 7, y - 14, 14, 4, 2, '#fff', 'opacity="0.7"');
const SEATS = series('cinemaseats', 'Cinema Seats', 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Plush Cinema Row', w: 370, h: 250, seats: three(-106, 112),
    art: (c) => {
      let s = '';
      for (const x of [-112, 0, 112]) s += box(x - 46, -238, 92, 140, 40, c) + P(heartD(x, -214, 22), light(c, 0.45)) + hi(x - 30, -230, 40, 5) + R(x - 34, -150, 68, 6, 3, dark(c, 0.12));
      for (const x of [-112, 0, 112]) s += cushSeat(x, 92, light(c, 0.12));
      for (const x of [-170, -56, 56, 170]) s += cArm(x, dark(c, 0.15));
      return s + cup(-56, -138) + cup(56, -138, '#7cc8ff') + sym((k) => C(170 * k, -140, 7, GOLD));
    },
  },
  {
    s: 'princess', name: 'Royal Velvet Seats', w: 320, h: 290, seats: two(-106, 78),
    art: (c) => {
      let s = '';
      for (const x of [-78, 78]) {
        const d = `M${x - 60} -100 V-220 Q${x - 60} -262 ${x - 20} -258 Q${x} -284 ${x + 20} -258 Q${x + 60} -262 ${x + 60} -220 V-100Z`;
        s += cloth(d, dark(c, 0.3)) + S(d, GOLD, 5);
        for (const [dx, dy] of [[-28, -220], [0, -230], [28, -220], [-14, -190], [14, -190], [-28, -160], [0, -160], [28, -160]]) s += btn(x + dx, dy, dark(c, 0.3));
        s += motif('crown', x, -286, 14);
      }
      for (const x of [-78, 78]) s += cushSeat(x, 112, dark(c, 0.15)) + S(`M${x - 56} -110 H${x + 56}`, GOLD, 3);
      for (const x of [-148, 0, 148]) s += cArm(x, '#ffffff') + C(x, -140, 8, GOLD);
      return s + cup(0, -142, '#ff9ec7');
    },
  },
  {
    s: 'modern', name: 'Recliner Cinema Seats', w: 340, h: 230, seats: two(-104, 82), toggle: true,
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = '';
      for (const x of [-82, 82]) s += box(x - 62, -224, 124, 130, 16, a) + box(x - 50, -214, 100, 40, 14, light(a, 0.15)) + R(x - 50, -164, 100, 4, 2, dark(a, 0.2));
      for (const x of [-82, 82]) s += cushSeat(x, 124, light(a, 0.08)) + R(x - 58, -76, 116, 30, 8, dark(a, 0.15));
      for (const x of [-160, 0, 160]) s += cArm(x, c, -130) + E(x, -130, 9, 3.5, on ? '#7cc8ff' : INK) + (on ? cglow(x, -130, 30, '#7cc8ff') : '');
      return s + cup(0, -132, '#ffd36b') + (on ? R(-170, -6, 340, 4, 2, '#7cc8ff', 'opacity="0.8"') : '');
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Movie Row', w: 370, h: 240, seats: three(-106, 112),
    art: (c) => {
      let s = '';
      [-112, 0, 112].forEach((x, i) => {
        const col = [RB[0], RB[2], RB[4]][i];
        s += box(x - 46, -232, 92, 134, 18, col) + C(x, -190, 22, '#fff') + T(x, -180, String(i + 1), 28, col) + hi(x - 30, -226, 40, 5);
      });
      [-112, 0, 112].forEach((x, i) => { s += cushSeat(x, 92, light([RB[0], RB[2], RB[4]][i], 0.2)); });
      for (const x of [-170, -56, 56, 170]) s += cArm(x, c);
      return s + cup(-56, -138, RB[5]) + P(starD(170, -150, 9), '#fff');
    },
  },
  {
    s: 'retro', name: 'Classic Red Theater Seats', w: 370, h: 240, seats: three(-106, 112),
    art: (c) => {
      let s = '';
      [-112, 0, 112].forEach((x, i) => {
        s += P(`M${x - 46} -100 V-212 Q${x} -244 ${x + 46} -212 V-100Z`, c) + P(`M${x - 46} -100 V-212 Q${x} -244 ${x + 46} -212 V-100Z`, 'url(#g-shadeX)');
        for (let k = -2; k <= 2; k++) s += Ln(x + k * 16, -206 + Math.abs(k) * 3, x + k * 16, -112, dark(c, 0.15), 3);
        s += R(x - 14, -132, 28, 16, 4, ST.retro.trim) + T(x, -119, `A${i + 1}`, 12, INK);
      });
      for (const x of [-112, 0, 112]) s += cushSeat(x, 92, dark(c, 0.06));
      for (const x of [-170, -56, 56, 170]) {
        s += box(x - 14, -140, 28, 140, 6, ST.retro.metal) + P(`M${x} -60 L${x - 10} -20 H${x + 10}Z`, ST.retro.trim) + C(x, -96, 6, ST.retro.trim);
      }
      return s;
    },
  },
]);

/** A puff of popcorn. */
const puff = (x: number, y: number, r: number) => C(x, y, r, '#fff3d0') + C(x + r * 0.6, y - r * 0.35, r * 0.72, '#fffaf0') + C(x - r * 0.55, y - r * 0.25, r * 0.62, '#ffe7a3') + C(x - r * 0.1, y - r * 0.6, r * 0.5, '#fff');
const pile = (x1: number, x2: number, yb: number, h: number) => {
  let s = P(`M${f(x1)} ${f(yb)} Q${f((x1 + x2) / 2)} ${f(yb - h * 2)} ${f(x2)} ${f(yb)}Z`, '#ffe9a8');
  const n = Math.round((x2 - x1) / 14);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    s += puff(x, yb - h * 4 * t * (1 - t) * 0.9 - 4, 7 + ((i * 3) % 4));
  }
  return s;
};
const popping = (x1: number, x2: number, yb: number, yt: number, n: number) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x1 + ((x2 - x1) * ((i * 37) % 100)) / 100;
    const dx = ((i % 3) - 1) * 14;
    s += `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx / 2} ${f(yt - yb)};${dx} 0" dur="${f(0.7 + (i % 4) * 0.12)}s" begin="${f(i * 0.11)}s" repeatCount="indefinite"/>${puff(x, yb, 6)}</g>`;
  }
  return s;
};
const kettle = (x: number, y: number, on: boolean, col = '#c9cfdd') => G((on ? sway(14, x, y - 20, 0.8) : '') + Ln(x, y - 26, x, y - 6, col, 4) + P(`M${x - 26} ${y} Q${x - 26} ${y + 26} ${x} ${y + 26} Q${x + 26} ${y + 26} ${x + 26} ${y}Z`, col) + R(x - 28, y - 4, 56, 7, 3, dark(col, 0.15)));
const POPCORN = series('popcorn', 'Popcorn Machines', 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Pink Popcorn Cart', w: 220, h: 360,
    art: (c, on) => {
      let s = S('M88 -150 Q118 -150 118 -186', ST.sweet.wood, 7) + box(-86, -150, 172, 120, 12, c) + P(heartD(0, -126, 36), light(c, 0.5)) + T(0, -50, 'YUM!', 18, '#fff');
      s += R(-80, -300, 160, 150, 6, on ? '#fff8de' : '#eef8ff') + (on ? glow(0, -230, 120) : '');
      s += pile(-78, 78, -152, 26) + kettle(0, -280, on) + (on ? popping(-60, 60, -170, -250, 10) : '');
      s += R(-80, -300, 160, 150, 6, 'url(#g-glass)') + sym((k) => R(78 * k - 5, -304, 10, 158, 4, '#fff'));
      s += cloth(`M-96 -300 H96 L96 -320 Q60 -380 0 -384 Q-60 -380 -96 -320Z`, c) + P(`M-96 -300 H96 V-292${scallop(96, -96, -292, 8, 4)}Z`, '#fff');
      for (let i = -2; i <= 2; i++) s += P(`M${i * 30} -384 Q${i * 34} -340 ${i * 38} -300 L${i * 38 + 14} -300 Q${i * 34 + 12} -340 ${i * 30 + 8} -383Z`, '#fff', 'opacity="0.55"');
      s += C(0, -390, 10, GOLD) + R(-62, -344, 124, 28, 14, '#fff') + T(0, -323, 'POPCORN', 19, dark(c, 0.3));
      return s + wheel(-60, -22, 22, '#fff') + wheel(60, -22, 22, '#fff') + C(-60, -22, 6, c) + C(60, -22, 6, c);
    },
  },
  {
    s: 'retro', name: 'Classic Popcorn Wagon', w: 250, h: 380,
    art: (c, on) => {
      const g = ST.retro.trim;
      let s = box(-100, -160, 200, 120, 6, c) + R(-90, -150, 180, 100, 4, 'none', `stroke="${g}" stroke-width="3"`) + T(0, -88, 'FRESH', 24, g) + T(0, -62, 'POPCORN', 18, '#fff');
      s += R(-96, -326, 192, 166, 4, on ? '#fff8de' : '#eef8ff') + (on ? glow(0, -240, 130) : '');
      s += pile(-94, 94, -162, 30) + kettle(-20, -300, on, GOLD) + (on ? popping(-80, 80, -180, -280, 12) : '');
      s += R(-96, -326, 192, 166, 4, 'url(#g-glass)') + sym((k) => R(94 * k - 6, -332, 12, 174, 4, g)) + R(-104, -166, 208, 10, 4, g);
      s += P('M-112 -326 L-90 -360 H90 L112 -326Z', c) + R(-116, -332, 232, 10, 5, g) + P('M-50 -360 Q0 -400 50 -360Z', g) + C(0, -394, 7, '#fff');
      const spoke = (x: number) => { let w = C(x, -40, 38, 'none', `stroke="${g}" stroke-width="5"`) + C(x, -40, 7, g); for (let i = 0; i < 8; i++) w += Ln(x, -40, x + Math.cos(i * 0.785) * 36, -40 + Math.sin(i * 0.785) * 36, g, 2.5); return w; };
      return s + spoke(-60) + spoke(60);
    },
  },
  {
    s: 'modern', name: 'Popcorn Maker Station', w: 200, h: 320,
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = R(-70, -150, 140, 150, 6, a) + R(-60, -140, 120, 60, 4, light(a, 0.1)) + C(40, -110, 6, on ? '#7fe0b0' : '#9aa3b5') + R(-50, -60, 100, 6, 3, light(a, 0.2));
      s += R(-90, -310, 180, 160, 14, INK) + R(-80, -300, 160, 120, 10, on ? '#fff8de' : '#e8f0f8') + (on ? glow(0, -240, 110) : '');
      s += pile(-78, 78, -182, 22) + (on ? popping(-56, 56, -196, -280, 9) : '') + R(-80, -300, 160, 120, 10, 'url(#g-glass)');
      return s + R(-90, -176, 180, 26, 6, c) + T(0, -157, 'POP!', 18, INK) + R(-30, -316, 60, 8, 4, c);
    },
  },
  {
    s: 'candy', name: 'Carnival Popcorn Stand', w: 240, h: 380,
    art: (c, on) => {
      let s = box(-90, -150, 180, 130, 10, ST.candy.accent) + T(0, -76, 'POP', 34, '#fff', `stroke="${ST.candy.trim}" stroke-width="2"`);
      for (let x = -80; x <= 80; x += 40) s += C(x, -140, 6, '#fff');
      s += R(-86, -300, 172, 150, 6, on ? '#fff8de' : '#eef8ff') + (on ? glow(0, -230, 120) : '');
      s += pile(-84, 84, -152, 28) + kettle(10, -282, on, '#ffb3c7') + (on ? popping(-66, 66, -170, -260, 10) : '') + R(-86, -300, 172, 150, 6, 'url(#g-glass)');
      let tent = 'M-114 -300 L0 -380 L114 -300';
      for (let i = 0; i < 6; i++) tent += ` Q${f(114 - 38 * (i + 0.5))} -276 ${f(114 - 38 * (i + 1))} -300`;
      s += P(tent + 'Z', c);
      for (let i = 0; i < 6; i += 2) s += P(`M${-114 + i * 38} -300 L0 -380 L${-76 + i * 38} -300 Q${-95 + i * 38} -276 ${-114 + i * 38} -300Z`, '#fff');
      s += Ln(0, -380, 0, -404, ST.candy.trim, 3) + P('M0 -404 L20 -398 L0 -392Z', ST.candy.trim);
      return s + sym((k) => R(84 * k - 6, -150, 12, 130, 4, '#fff') + wheel(64 * k, -16, 16, ST.candy.trim));
    },
  },
], { toggle: true, spawn: ['cinePopcorn', 'cinePopcornBag'] });

const BOOTHS = series('ticketbooth', 'Ticket Booths', 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Sweet Ticket Kiosk', w: 280, h: 430,
    art: (c) => {
      let s = box(-110, -230, 220, 222, 14, c) + R(-96, -210, 192, 120, 10, light(c, 0.3)) + P(heartD(0, -190, 70), light(c, 0.55)) + P(heartD(0, -190, 70), 'url(#g-face)');
      s += R(-110, -26, 220, 18, 6, dark(c, 0.2));
      s += P('M-90 -232 V-320 Q-90 -356 0 -356 Q90 -356 90 -320 V-232Z', '#cfe9ff') + P('M-90 -232 V-320 Q-90 -356 0 -356 Q90 -356 90 -320 V-232Z', 'url(#g-glass)');
      s += P('M-90 -232 V-320 Q-90 -356 0 -356 Q90 -356 90 -320 V-232', 'none', `stroke="#fff" stroke-width="8"`) + C(0, -290, 18, 'none', 'stroke="#fff" stroke-width="3" opacity="0.8"');
      s += box(-120, -244, 240, 16, 8, '#fff');
      s += cloth('M-124 -352 Q-124 -420 0 -424 Q124 -420 124 -352Z', c) + R(-128, -360, 256, 16, 8, '#fff') + C(0, -430, 10, GOLD);
      s += R(-70, -404, 140, 32, 16, '#fff') + T(0, -381, 'TICKETS', 20, dark(c, 0.35));
      s += G(R(-30, -18, 60, 30, 4, '#ffd36b') + T(0, 2, 'ADMIT 1', 10, INK), 'transform="translate(70 -250) rotate(-12)"') + bell(-60, -244, 0.8);
      return s;
    },
  },
  {
    s: 'retro', name: 'Box Office Booth', w: 300, h: 450,
    art: (c) => {
      const g = ST.retro.trim;
      let s = box(-120, -220, 240, 212, 6, c) + P('M-120 -150 H120 M-120 -80 H120', 'none', `stroke="${g}" stroke-width="4"`);
      for (const x of [-80, 0, 80]) s += P(`M${x} -40 L${x - 26} -8 H${x + 26}Z`, g, 'opacity="0.8"') + P(`M${x} -120 L${x - 20} -86 H${x + 20}Z`, g, 'opacity="0.5"');
      s += R(-100, -340, 200, 120, 6, '#cfe9ff') + R(-100, -340, 200, 120, 6, 'url(#g-glass)') + R(-100, -340, 200, 120, 6, 'none', `stroke="${g}" stroke-width="8"`) + C(0, -270, 14, 'none', `stroke="${g}" stroke-width="3"`);
      s += R(-40, -236, 80, 10, 3, g) + box(-128, -232, 256, 16, 4, g);
      s += P('M-140 -340 H140 L120 -400 H-120Z', dark(c, 0.15)) + bulbs(-128, -348, -112, -392, 4, true, 5) + bulbs(128, -348, 112, -392, 4, true, 5) + bulbs(-100, -398, 100, -398, 9, true, 5);
      s += T(0, -360, 'BOX OFFICE', 22, '#fff') + P('M-60 -400 L0 -440 L60 -400Z', g) + P(starD(0, -414, 10), '#fff');
      return s;
    },
  },
  {
    s: 'modern', name: 'Ticket Machine', w: 160, h: 340,
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = box(-70, -330, 140, 322, 18, a) + R(-56, -300, 112, 30, 6, c) + T(0, -279, 'TICKETS', 16, a);
      s += R(-56, -260, 112, 110, 8, on ? '#bfe8ff' : '#2d3a52') + (on ? R(-46, -250, 92, 24, 4, '#fff') + R(-46, -220, 44, 30, 4, '#ff7a6b') + R(2, -220, 44, 30, 4, '#7cc8ff') + R(-46, -184, 92, 18, 4, '#ffd36b') : '') + glass(-56, -260, 112, 110, 8);
      s += R(-40, -130, 80, 8, 4, INK) + R(-30, -100, 60, 30, 6, light(a, 0.15)) + R(-20, -86, 40, 4, 2, INK);
      return s + R(-70, -20, 140, 12, 4, dark(a, 0.2));
    },
  },
], { sfx: 'ding', spawn: ['cineTicket'] });

const SNACKBARS = series('snackbar', 'Snack Counters', 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Sweet Snack Counter', w: 420, h: 330, spawn: SNACKS, surfaces: [{ x1: -150, x2: 150, y: -172 }],
    art: (c) => {
      let s = sym((k) => R(176 * k - 5, -330, 10, 160, 4, '#fff')) + box(-190, -334, 380, 60, 14, '#fff') + R(-182, -326, 364, 44, 10, light(c, 0.4));
      s += T(-30, -295, 'SNACKS', 28, dark(c, 0.35)) + G(puff(0, 0, 9) + puff(14, -4, 8) + P('M-14 2 L28 2 L22 30 L-8 30Z', '#ff4f6d') + R(0, 2, 6, 28, 0, '#fff') + R(12, 2, 6, 28, 0, '#fff'), 'transform="translate(110 -322)"');
      s += box(-180, -160, 360, 152, 10, c) + R(-166, -150, 332, 74, 8, '#e8f6ff');
      const cand = ['#ff4f6d', '#ffd36b', '#7fe0b0', '#c99bff', '#7cc8ff', '#ffab5e'];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 11; i++) s += box(-158 + i * 29.5, -144 + r * 34, 24, 28, 4, cand[(i + r * 2) % 6]) + R(-154 + i * 29.5, -140 + r * 34, 16, 4, 2, '#fff', 'opacity="0.6"');
      s += glass(-166, -150, 332, 74, 8) + R(-180, -66, 360, 6, 3, '#fff', 'opacity="0.6"');
      for (let x = -160; x <= 160; x += 40) s += P(heartD(x, -50, 14), light(c, 0.45));
      s += box(-192, -176, 384, 18, 9, '#fff') + R(-190, -12, 380, 12, 4, dark(c, 0.2));
      return s + R(140, -206, 26, 30, 4, '#c9cfdd') + R(144, -200, 18, 6, 2, '#fff') + [-6, 0, 6].map((d) => Ln(-150 + d, -176, -152 + d * 2, -214, ['#ff4f6d', '#7cc8ff', '#ffd36b'][(d + 6) / 6], 2.5)).join('') + R(-160, -186, 20, 12, 3, '#f0e6ee');
    },
  },
  {
    s: 'retro', name: 'Diner Snack Bar', w: 420, h: 340, spawn: SNACKS, surfaces: [{ x1: -190, x2: 190, y: -172 }],
    art: (c, on) => {
      let s = box(-180, -340, 360, 70, 14, INK) + T(0, -293, 'SNACK BAR', 34, on ? '#ff9ec7' : light('#ff9ec7', 0.4), on ? 'style="filter:drop-shadow(0 0 6px #ff7eb6)"' : '');
      s += sym((k) => R(150 * k - 4, -270, 8, 100, 3, ST.retro.metal));
      s += box(-190, -160, 380, 152, 6, c);
      for (let y = -150; y < -20; y += 26) for (let x = -190; x < 190; x += 26) if (((x + 190) / 26 + (y + 150) / 26) % 2 === 0) s += R(x, y, 26, 26, 0, '#fff', 'opacity="0.9"');
      s += R(-190, -160, 380, 14, 0, ST.retro.metal) + R(-190, -30, 380, 10, 0, ST.retro.metal);
      s += box(-200, -176, 400, 18, 6, ST.retro.accent) + hi(-190, -174, 300, 3, 0.4);
      return s + R(-190, -10, 380, 10, 3, dark(c, 0.3));
    },
    toggle: true,
  },
  {
    s: 'modern', name: 'Concession Counter', w: 420, h: 300, spawn: SNACKS, surfaces: [{ x1: -190, x2: 190, y: -172 }],
    art: (c) => {
      const a = ST.modern.accent;
      let s = R(-150, -300, 300, 90, 8, INK) + R(-142, -292, 292 - 8, 74, 4, '#3d3a52');
      const item = (x: number, t: string, col: string) => R(x - 40, -286, 80, 62, 4, col) + T(x, -232, t, 12, '#fff');
      s += item(-92, 'POPCORN', '#ff7a6b') + item(0, 'NACHOS', '#ffab5e') + item(92, 'SODA', '#4f9dff') + G(puff(-92, -258, 10)) + P('M-12 -250 L0 -272 L12 -250Z', '#ffd36b') + cup(92, -244, '#fff');
      s += sym((k) => R(110 * k - 3, -210, 6, 40, 2, a));
      s += box(-190, -160, 380, 152, 6, c) + R(-190, -100, 380, 30, 0, ST.modern.wood) + R(-190, -74, 380, 4, 0, '#7cc8ff', 'opacity="0.7"');
      return s + box(-198, -176, 396, 18, 4, a) + R(-190, -10, 380, 10, 3, dark(c, 0.3));
    },
  },
]);

const FOUNTAINS = series('sodafountain', 'Soda Fountains', 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Fizzy Soda Fountain', w: 190, h: 290,
    art: (c, on) => {
      let s = box(-84, -120, 168, 112, 10, c) + P(heartD(0, -104, 40), light(c, 0.5)) + R(-84, -20, 168, 12, 4, dark(c, 0.2));
      s += R(-80, -280, 160, 40, 12, '#fff') + T(0, -253, 'SODA', 22, dark(c, 0.3)) + R(-70, -240, 140, 70, 8, light(c, 0.2));
      [-40, 0, 40].forEach((x, i) => { s += R(x - 14, -236, 28, 30, 6, ['#ff4f6d', '#ffab5e', '#7fe0b0'][i]) + R(x - 4, -206, 8, 14, 3, '#c9cfdd'); });
      s += R(-76, -140, 152, 20, 6, '#c9cfdd');
      s += cup(0, -142, '#7cc8ff') + (on ? `<rect x="-3" y="-192" width="6" height="34" rx="3" fill="#ffab5e"><animate attributeName="opacity" values="1;0.6;1" dur="0.3s" repeatCount="indefinite"/></rect>` + [0, 1, 2].map((i) => `<circle cx="${-6 + i * 6}" cy="-164" r="2" fill="#fff"><animate attributeName="cy" values="-164;-196" dur="0.8s" begin="${f(i * 0.25)}s" repeatCount="indefinite"/></circle>`).join('') : '');
      return s;
    },
  },
  {
    s: 'retro', name: 'Chrome Soda Fountain', w: 200, h: 290,
    art: (c, on) => {
      const g = ST.retro.metal;
      let s = box(-90, -130, 180, 122, 8, c) + R(-90, -80, 180, 10, 0, '#fff', 'opacity="0.7"') + T(0, -36, 'FIZZ', 26, '#fff');
      s += P('M-60 -150 Q-60 -280 0 -280 Q60 -280 60 -150Z', g) + P('M-60 -150 Q-60 -280 0 -280 Q60 -280 60 -150Z', 'url(#g-shadeX)') + C(0, -230, 26, ST.retro.accent) + P(starD(0, -230, 16), '#fff');
      s += S('M-40 -170 Q-60 -170 -60 -190', g, 8) + S('M40 -170 Q60 -170 60 -190', g, 8) + R(-96, -152, 192, 22, 6, ST.retro.trim);
      return s + cup(-40, -154, '#ff7a6b') + (on ? `<rect x="-43" y="-170" width="5" height="14" rx="2" fill="#ff7a6b"><animate attributeName="height" values="4;14;4" dur="0.4s" repeatCount="indefinite"/></rect>` : '') + cup(40, -154, '#5fd3b5');
    },
  },
], { toggle: true, spawn: ['cineSoda'] });

/** A light-box movie poster with chasing bulbs. */
function lightbox(frame: string, inner: string, title: string, tc: string): string {
  let s = box(-86, -126, 172, 252, 10, frame) + R(-70, -110, 140, 220, 4, '#ffffff');
  s += `<svg x="-68" y="-108" width="136" height="216" viewBox="-68 -108 136 216">${inner}</svg>`;
  s += R(-70, 70, 140, 40, 3, 'rgba(0,0,0,0.25)') + T(0, 98, title, 17, tc, 'stroke="#2d2a3a" stroke-width="0.6"');
  return s + bulbs(-78, -118, 78, -118, 9, true, 4) + bulbs(-78, 118, 78, 118, 9, true, 4) + bulbs(-78, -96, -78, 96, 9, true, 3.5) + bulbs(78, -96, 78, 96, 9, true, 3.5);
}
const POSTERS = series('movieposter', 'Movie Posters', 'cinema', 'wall', [
  {
    s: 'sweet', name: 'Pony Party Poster', w: 180, h: 260,
    art: (c) => lightbox(c, R(-68, -108, 136, 216, 0, '#bfe8ff') + RB.map((col, i) => S(`M${-60 + i * 8} 60 A${60 - i * 8} ${60 - i * 8} 0 0 1 ${60 - i * 8} 60`, col, 8)).join('') +
      E(0, 20, 30, 18, '#fff') + P('M16 10 L28 -24 L42 -18 L30 14Z', '#fff') + E(40, -22, 16, 11, '#fff') + P('M40 -34 L48 -60 L46 -34Z', '#ffd24a') + P('M24 -22 Q14 -6 18 10 Q26 -4 32 -10Z', '#ff7eb6') + C(44, -24, 2.5, INK) + E(48, -16, 3, 2, '#ff9ec7') +
      P('M-30 14 Q-52 10 -50 34 Q-40 20 -30 24Z', '#c99bff') + [-20, -8, 6, 18].map((x) => R(x, 32, 6, 22, 3, '#fff')).join('') + twinkle(-40, -60, 8, '#ffd24a') + twinkle(-14, -86, 6, '#ff7eb6', 1.6, 0.5), 'PONY PARTY', '#ffe680'),
  },
  {
    s: 'space', name: 'Space Pups Poster', w: 180, h: 260,
    art: (c) => lightbox(c, R(-68, -108, 136, 216, 0, '#24224a') + twinkle(-40, -80, 6, '#fff') + twinkle(44, -50, 5, '#fff', 1.6, 0.4) + twinkle(-50, 30, 5, '#fff', 2.4, 1) + C(40, 40, 18, '#ff9ec7') +
      G(`<g>${bob(0, -6, 2)}${C(0, -20, 40, '#cfe9ff', 'opacity="0.5"')}${C(0, -20, 40, 'none', 'stroke="#fff" stroke-width="3"')}${E(0, -14, 26, 24, '#e8b46a')}${E(-24, -22, 9, 18, '#a86b4a', 'transform="rotate(20 -24 -22)"')}${E(24, -22, 9, 18, '#a86b4a', 'transform="rotate(-20 24 -22)"')}${E(0, -6, 12, 9, '#fff3d6')}${C(-9, -20, 3.5, INK)}${C(9, -20, 3.5, INK)}${E(0, -10, 4, 3, INK)}${S('M-4 -2 Q0 2 4 -2', INK, 1.6)}${R(-20, 18, 40, 30, 10, '#fff')}${C(0, 32, 5, '#ff4f6d')}</g>`), 'SPACE PUPS', '#ffe680'),
  },
  {
    s: 'beach', name: 'Mermaid Magic Poster', w: 180, h: 260,
    art: (c) => lightbox(c, R(-68, -108, 136, 216, 0, '#4fb6e8') + P('M-68 50 Q0 30 68 54 V108 H-68Z', '#f4dca0') + S('M-50 60 Q-58 30 -46 10', '#3fbf8f', 5) + S('M52 60 Q60 34 50 16', '#5fae6b', 5) +
      G(`<g>${bob(4, -8, 2.4)}${P('M-6 30 Q-20 10 -10 -20 L10 -20 Q20 10 6 30 Q20 44 26 40 Q16 54 0 42 Q-16 54 -26 40 Q-20 44 -6 30Z', '#5fd3b5')}${P('M-12 -20 Q-14 -40 0 -42 Q14 -40 12 -20Z', '#ffe3d3')}${C(0, -54, 14, '#ffe3d3')}${P('M-16 -54 Q-18 -76 0 -74 Q18 -76 16 -54 Q22 -30 12 -16 Q12 -40 8 -60 Q0 -64 -8 -60 Q-12 -40 -12 -16 Q-22 -30 -16 -54Z', '#ff7eb6')}${C(-5, -54, 2, INK)}${C(5, -54, 2, INK)}${S('M-4 -46 Q0 -43 4 -46', INK, 1.4)}${E(-6, -32, 6, 4, '#c99bff')}${E(6, -32, 6, 4, '#c99bff')}</g>`) +
      [[-40, -60], [44, -80], [30, -10]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#fff" stroke-width="2">${pulse(1, 0.3, 2, i * 0.5)}</circle>`).join(''), 'MERMAID MAGIC', '#ffffff'),
  },
  {
    s: 'woodland', name: 'Forest Friends Poster', w: 180, h: 260,
    art: (c) => lightbox(ST.woodland.wood, R(-68, -108, 136, 216, 0, '#ffe3b0') + C(40, -70, 16, '#ffab5e') + leafy(-50, -70, 26, c) + leafy(56, 0, 22, c) + P('M-68 50 Q0 30 68 50 V108 H-68Z', c) +
      P('M-30 50 Q-36 10 -10 0 L-18 -30 L-4 -14 Q0 -16 4 -14 L18 -30 L10 0 Q36 10 30 50Z', '#ff8a3d') + P('M-10 0 Q0 22 10 0 Q0 6 -10 0Z', '#fff') + C(-8, -6, 2.5, INK) + C(8, -6, 2.5, INK) + C(0, 4, 3, INK) +
      P('M30 46 Q60 40 54 10 Q46 30 26 30Z', '#ff8a3d') + P('M54 10 Q58 4 52 2 Q48 8 50 16Z', '#fff') + owl(-44, 48, 0.9) + teddy(44, 52, 0.7), 'FOREST FRIENDS', '#fff3d6'),
  },
]);

const CARPETS = series('redcarpet', 'Red Carpets', 'cinema', 'rug', [
  {
    s: 'princess', name: 'Royal Red Carpet', w: 480, h: 110, color: '#e03a62',
    art: (c) => {
      const d = 'M-232 -140 H232 V140 H-232Z';
      let top = R(-232, -120, 464, 18, 0, GOLD) + R(-232, 102, 464, 18, 0, GOLD);
      for (let x = -200; x <= 200; x += 80) top += P(starD(x, 0, 30), GOLD, 'opacity="0.8"');
      return rugEdge(d, c, top + fringeRow(-232, 232, 140, 12, ST.princess.trim).replace(/stroke-width="2"/g, 'stroke-width="4"'));
    },
  },
  {
    s: 'sweet', name: 'Pink Party Carpet', w: 480, h: 110,
    art: (c) => {
      const d = 'M-232 -140 H232 V140 H-232Z';
      let top = R(-232, -120, 464, 14, 0, '#fff') + R(-232, 106, 464, 14, 0, '#fff');
      for (let x = -198; x <= 198; x += 66) top += P(heartD(x, -40, 76), '#fff', 'opacity="0.75"');
      return rugEdge(d, c, top);
    },
  },
  {
    s: 'retro', name: 'Walk of Stars Carpet', w: 480, h: 110, color: '#e85d5d',
    art: (c) => {
      const d = 'M-232 -140 H232 V140 H-232Z';
      let top = '';
      for (let i = 0; i < 4; i++) {
        const x = -174 + i * 116;
        top += R(x - 52, -52, 104, 104, 8, '#ffb3c7') + P(starD(x, 0, 44), ST.retro.trim) + C(x, 0, 12, '#fff', 'opacity="0.5"');
      }
      return rugEdge(d, c, top + R(-232, -140, 464, 20, 0, dark(c, 0.15)) + R(-232, 120, 464, 20, 0, dark(c, 0.15)));
    },
  },
]);

const ROPES = series('velvetrope', 'Velvet Ropes', 'cinema', 'floor', [
  {
    s: 'princess', name: 'Golden Velvet Rope', w: 330, h: 150, color: '#e03a62',
    art: (c) => {
      let s = sym((k) => E(130 * k, -6, 26, 8, GOLD) + R(130 * k - 6, -126, 12, 120, 6, GOLD) + C(130 * k, -132, 14, GOLD) + C(130 * k - 4, -136, 4, '#fff', 'opacity="0.6"'));
      s += S('M-124 -110 Q0 -40 124 -110', c, 12) + S('M-124 -112 Q0 -44 124 -112', '#fff', 2, 'opacity="0.35"');
      return s + P('M-10 -74 H10 L14 -48 H-14Z', GOLD) + R(-40, -60, 80, 30, 6, '#fff') + T(0, -39, 'STARS', 14, c);
    },
  },
  {
    s: 'modern', name: 'Silver Queue Rope', w: 330, h: 150, color: '#3f4f9a',
    art: (c) => {
      let s = sym((k) => E(130 * k, -6, 22, 7, SILVER) + R(130 * k - 5, -120, 10, 114, 5, SILVER) + R(130 * k - 10, -128, 20, 10, 4, SILVER));
      return s + S('M-124 -112 Q0 -60 124 -112', c, 9) + S('M-124 -114 Q0 -64 124 -114', '#fff', 2, 'opacity="0.3"');
    },
  },
]);

const PROJECTORS = series('projector', 'Projectors', 'cinema', 'floor', [
  {
    s: 'retro', name: 'Film Reel Projector', w: 260, h: 330,
    art: (c, on) => {
      const g = ST.retro.metal;
      let s = on ? `<g>${pulse(0.9, 0.6, 0.3)}${P('M-70 -170 L-130 -240 L-130 -110Z', '#fff6c8', 'opacity="0.55"')}</g>` + glow(-80, -170, 80) : '';
      s += sym((k) => Ln(0, -130, 60 * k, 0, INK, 6)) + Ln(0, -130, 0, -4, INK, 6);
      s += box(-60, -200, 130, 70, 10, c) + R(-80, -184, 22, 30, 6, g) + C(-80, -169, 10, on ? '#fff6c8' : '#9aa3b5');
      const reel = (x: number, y: number, r: number) => G((on ? spin(x, y, 1.6) : '') + C(x, y, r, g) + C(x, y, r * 0.8, INK) + [0, 1, 2, 3, 4].map((i) => C(x + Math.cos(i * 1.256) * r * 0.5, y + Math.sin(i * 1.256) * r * 0.5, r * 0.18, g)).join('') + C(x, y, r * 0.15, g));
      s += reel(-20, -250, 44) + reel(70, -232, 36) + S('M-20 -206 L40 -200 L70 -196', INK, 3);
      return s + C(30, -160, 6, on ? '#7fe0b0' : '#ffd36b');
    },
  },
  {
    s: 'modern', name: 'Mini Movie Projector', w: 140, h: 90, mount: 'prop',
    art: (c, on) => {
      let s = on ? `<g>${pulse(0.9, 0.6, 0.3)}${P('M-56 -40 L-140 -100 L-140 10Z', '#fff6c8', 'opacity="0.5"')}</g>` : '';
      s += box(-50, -66, 110, 56, 14, c) + C(-50, -38, 18, ST.modern.accent) + C(-50, -38, 11, on ? '#fff6c8' : '#9fd6ff') + C(-54, -42, 4, '#fff', 'opacity="0.6"');
      return s + R(10, -56, 40, 6, 3, ST.modern.accent) + C(40, -26, 4, on ? '#7fe0b0' : '#9aa3b5') + R(-34, -10, 10, 10, 2, INK) + R(34, -10, 10, 10, 2, INK);
    },
  },
], { toggle: true, sfx: 'music' });

const REELS = series('filmreel', 'Film Reels', 'cinema', 'prop', [
  {
    s: 'retro', name: 'Big Film Reel', w: 130, h: 140,
    art: (c) => {
      let s = P('M20 -12 Q40 -4 64 -6 L64 6 Q40 8 16 2Z', INK) + C(0, -66, 60, c) + C(0, -66, 50, dark(c, 0.15));
      for (let i = 0; i < 6; i++) s += C(Math.cos(i * 1.047) * 30, -66 + Math.sin(i * 1.047) * 30, 12, light(c, 0.35));
      s += C(0, -66, 10, '#fff') + C(0, -66, 4, INK);
      for (let x = 30; x < 62; x += 8) s += R(x, -6, 4, 3, 1, '#fff') + R(x, 2, 4, 2.5, 1, '#fff');
      return s + C(-20, -96, 8, '#fff', 'opacity="0.3"');
    },
  },
]);

const CINESIGNS = series('cinesign', 'Cinema Signs', 'cinema', 'wall', [
  {
    s: 'retro', name: 'CINEMA Marquee Letters', w: 470, h: 140, toggle: true,
    art: (c, on) => {
      let s = '';
      'CINEMA'.split('').forEach((ch, i) => {
        const x = -200 + i * 80;
        s += box(x - 36, -56, 72, 112, 10, c) + R(x - 30, -50, 60, 100, 6, dark(c, 0.15)) + T(x, 26, ch, 72, on ? '#fff6c8' : '#fff', on ? 'style="filter:drop-shadow(0 0 6px #ffd36b)"' : '');
        s += bulbs(x - 26, -46, x + 26, -46, 3, on, 3.5) + bulbs(x - 26, 46, x + 26, 46, 3, on, 3.5);
      });
      return (on ? E(0, 0, 250, 80, '#ffd36b', 'opacity="0.18"') + E(0, 0, 220, 64, '#ffd36b', 'opacity="0.2"') : '') + s;
    },
  },
]);

const DIRCHAIRS = series('directorchair', "Director's Chairs", 'cinema', 'floor', [
  {
    s: 'sweet', name: 'Star Director Chair', w: 170, h: 270, seats: one(-110),
    art: (c) => {
      const wd = ST.sweet.wood;
      let s = sym((k) => R(66 * k - 5, -260, 10, 160, 4, wd)) + cloth('M-66 -250 H66 V-190 H-66Z', c) + T(0, -212, 'STAR', 26, '#fff') + P(starD(48, -236, 8), '#fff');
      s += sym((k) => Ln(60 * k, -112, -60 * k, 0, wd, 9)) + R(-72, -122, 144, 12, 5, wd) + cloth('M-66 -116 H66 V-102 Q0 -92 -66 -102Z', c);
      return s + sym((k) => R(72 * k - (k > 0 ? 0 : 14), -160, 14, 50, 4, wd) + R(66 * k - (k > 0 ? 0 : 20), -164, 20, 8, 4, dark(wd, 0.1)));
    },
  },
  {
    s: 'retro', name: 'Clapperboard Chair', w: 170, h: 280, color: '#2d2a3a', seats: one(-110),
    art: (c) => {
      const wd = ST.retro.wood;
      let s = sym((k) => R(66 * k - 5, -260, 10, 160, 4, wd)) + cloth('M-66 -250 H66 V-190 H-66Z', c);
      for (let i = 0; i < 6; i++) s += P(`M${-66 + i * 24} -250 L${-54 + i * 24} -250 L${-62 + i * 24} -236 L${-74 + i * 24} -236Z`, '#fff');
      s += T(0, -200, 'ACTION!', 18, '#fff');
      s += sym((k) => Ln(60 * k, -112, -60 * k, 0, wd, 9)) + R(-72, -122, 144, 12, 5, wd) + cloth('M-66 -116 H66 V-102 Q0 -92 -66 -102Z', c);
      return s + sym((k) => R(72 * k - (k > 0 ? 0 : 14), -160, 14, 50, 4, wd));
    },
  },
]);

const CINE_PROPS: FurnDef[] = [
  prop('cinePopcorn', 'Popcorn Bucket', 'cinema', 'Snacks', 80, 100, () => {
    let s = P('M-28 -64 L28 -64 L20 0 L-20 0Z', '#fff');
    for (let i = 0; i < 4; i++) s += P(`M${-28 + i * 14 + 3.5} -64 L${-28 + i * 14 + 10.5} -64 L${-20 + i * 10 + 7.5} 0 L${-20 + i * 10 + 2.5} 0Z`, '#ff4f6d');
    s += R(-16, -44, 32, 18, 9, '#fff') + T(0, -31, 'POP', 11, '#ff4f6d');
    return s + puff(-18, -66, 9) + puff(0, -74, 11) + puff(18, -66, 9) + puff(-8, -84, 8) + puff(10, -86, 7);
  }, { food: true }),
  prop('cinePopcornBag', 'Popcorn Bag', 'cinema', 'Snacks', 64, 90, () => P('M-22 -60 L22 -60 L18 0 L-18 0Z', '#ff9ec7') + R(-22, -60, 44, 8, 0, '#fff') + P(heartD(0, -42, 18), '#fff') + puff(-12, -62, 8) + puff(4, -70, 9) + puff(16, -62, 7), { food: true }),
  prop('cineNachos', 'Nachos', 'cinema', 'Snacks', 90, 60, () => {
    let s = P('M-40 -18 L40 -18 L34 0 L-34 0Z', '#4a4a5e') + E(0, -18, 40, 6, '#ff7a6b');
    for (const [x, a] of [[-24, -20], [-8, 10], [10, -12], [24, 18], [0, -2]] as [number, number][]) s += G(P('M0 -22 L12 0 L-12 0Z', '#ffd36b') + P('M0 -22 L12 0 L-12 0Z', 'none', 'stroke="#e8b46a" stroke-width="1.5"'), `transform="translate(${x} -18) rotate(${a})"`);
    return s + E(26, -26, 12, 7, '#ffab3d') + E(26, -28, 9, 4, '#ffc94d') + P('M-10 -34 Q0 -26 10 -34 Q4 -30 0 -40Z', '#ffc94d');
  }, { food: true }),
  prop('cineSoda', 'Big Soda', 'cinema', 'Snacks', 56, 100, () => P('M-20 -70 L20 -70 L15 0 L-15 0Z', '#4f9dff') + R(-15, -50, 30, 22, 4, '#fff') + P(starD(0, -39, 9), '#ff4f6d') + R(-23, -76, 46, 8, 4, '#fff') + E(0, -78, 18, 4, '#e6e8f0') + Ln(4, -78, 10, -98, '#ff4f6d', 4), { food: true }),
  prop('cineCandy', 'Candy Box', 'cinema', 'Snacks', 60, 60, () => box(-24, -50, 48, 50, 6, '#c99bff') + R(-24, -50, 48, 12, 4, '#fff') + C(-10, -24, 7, '#ff4f6d') + C(8, -18, 7, '#ffd36b') + C(4, -34, 6, '#7fe0b0') + C(-8, -54, 6, '#ff9ec7') + C(8, -56, 6, '#7cc8ff'), { food: true }),
  prop('cine3dGlasses', '3D Glasses', 'cinema', 'Movie Props', 100, 50, () => S('M-44 -26 L-50 -10 M44 -26 L50 -10', '#fff', 4) + R(-46, -40, 92, 8, 4, '#fff') + R(-42, -36, 36, 26, 8, '#ff4f6d', 'opacity="0.85"') + R(6, -36, 36, 26, 8, '#4f9dff', 'opacity="0.85"') + R(-42, -36, 84, 26, 8, 'none', 'stroke="#fff" stroke-width="4"') + hi(-36, -32, 12, 4, 0.6) + hi(12, -32, 12, 4, 0.6)),
  prop('cineTicket', 'Movie Ticket', 'cinema', 'Movie Props', 90, 50, () => G(P('M-36 -36 H36 V-26 A6 6 0 0 0 36 -14 V-4 H-36 V-14 A6 6 0 0 0 -36 -26Z', '#ffd36b') + Ln(16, -34, 16, -6, '#fff', 2, 'stroke-dasharray="3 3"') + T(-10, -16, 'ADMIT', 10, INK) + T(-10, -7, 'ONE', 8, INK) + P(starD(27, -20, 6), '#ff4f6d'), 'transform="rotate(-8 0 -20)"')),
];

const CINEMA: FurnDef[] = [
  ...SCREENS, ...SEATS, ...POPCORN, ...BOOTHS, ...SNACKBARS, ...FOUNTAINS, ...POSTERS, ...CARPETS, ...ROPES, ...PROJECTORS, ...REELS, ...CINESIGNS, ...DIRCHAIRS, ...CINE_PROPS,
];

// =====================================================================================
// HOTEL
// =====================================================================================
const SUITCASES = ['f-suitcase-sweet', 'f-suitcase-retro', 'f-suitcase-space', 'f-suitcase-beach'];
const ROOM_FOOD = ['hotelPancakes', 'cake', 'cupcake', 'juice', 'teaSet', 'donut', 'cookie', 'milk'];

const RECEPTIONS = series('reception', 'Reception Desks', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Sweetheart Reception Desk', w: 450, h: 245, surfaces: [{ x1: -110, x2: 200, y: -184 }],
    art: (c) => {
      let s = cloth('M-200 -172 H200 Q212 -90 198 -10 H-198 Q-212 -90 -200 -172Z', c);
      for (let x = -160; x <= 160; x += 64) s += R(x - 24, -150, 48, 120, 18, light(c, 0.2)) + R(x - 24, -150, 48, 120, 18, 'url(#g-shadeX)', 'opacity="0.4"');
      s += R(-206, -60, 412, 10, 5, GOLD) + R(-200, -18, 400, 10, 4, dark(c, 0.25));
      s += R(-80, -128, 160, 44, 22, '#fff') + T(0, -98, 'WELCOME', 22, dark(c, 0.35)) + P(heartD(0, -154, 18), GOLD);
      s += box(-214, -192, 428, 22, 10, '#fffaf6') + R(-214, -174, 428, 5, 2, GOLD) + hi(-200, -188, 300, 4, 0.6);
      s += bell(-150, -192, 1.2) + R(-104, -206, 46, 14, 3, '#fff') + T(-81, -195, 'RING', 9, dark(c, 0.3));
      return s + P('M150 -192 Q140 -220 150 -232 H170 Q180 -220 170 -192Z', '#cfe9ff') + flowerG(152, -244, 9, '#ff7eb6') + flowerG(170, -238, 8, '#fff') + Ln(158, -236, 160, -206, '#5fae6b', 2);
    },
  },
  {
    s: 'princess', name: 'Marble Grand Desk', w: 470, h: 290, surfaces: [{ x1: -140, x2: 160, y: -196 }],
    art: (c) => {
      const mar = '#fbf7fb';
      let s = box(-190, -180, 380, 172, 6, mar);
      for (const [x1, y1, x2, y2] of [[-170, -160, -120, -60], [-60, -170, 10, -120], [40, -100, 120, -30], [130, -170, 170, -110]]) s += S(`M${x1} ${y1} Q${(x1 + x2) / 2 + 20} ${(y1 + y2) / 2} ${x2} ${y2}`, '#e6dcef', 2);
      s += R(-90, -150, 180, 110, 10, c) + R(-80, -140, 160, 90, 6, 'none', `stroke="${GOLD}" stroke-width="3"`) + motif('crown', 0, -112, 22) + T(0, -66, 'RECEPTION', 16, '#fff');
      for (const x of [-210, 210]) s += R(x - 18, -186, 36, 186, 6, mar) + R(x - 22, -196, 44, 14, 4, GOLD) + R(x - 22, -12, 44, 12, 4, GOLD) + Ln(x - 6, -180, x - 6, -14, '#e6dcef', 3) + Ln(x + 6, -180, x + 6, -14, '#e6dcef', 3);
      s += box(-200, -200, 400, 18, 6, mar) + R(-200, -186, 400, 5, 2, GOLD);
      return s + bell(-120, -200, 1.2) + R(80, -214, 60, 14, 3, '#fff') + P('M100 -214 L120 -214 L116 -246 L104 -246Z', '#cfe9ff', 'opacity="0.8"') + C(110, -250, 10, '#ff9ec7') + C(102, -244, 6, '#fff');
    },
  },
  {
    s: 'modern', name: 'Lobby Front Desk', w: 450, h: 300, surfaces: [{ x1: -200, x2: 60, y: -176 }],
    art: (c, on) => {
      const a = ST.modern.accent;
      let s = box(-200, -164, 400, 156, 4, c) + R(-200, -164, 140, 156, 4, ST.modern.wood);
      for (let x = -194; x < -66; x += 10) s += Ln(x, -158, x, -14, dark(ST.modern.wood, 0.08), 2, 'opacity="0.6"');
      s += C(60, -96, 34, a) + T(60, -82, 'H', 40, '#fff') + R(-200, -16, 400, 8, 3, a);
      s += R(-208, -178, 416, 14, 3, a);
      s += R(90, -260, 100, 70, 6, a) + R(96, -254, 88, 58, 4, on ? '#bfe8ff' : '#e8f6ff') + R(134, -190, 12, 12, 2, '#9aa3b5') + R(116, -182, 48, 4, 2, '#9aa3b5');
      return s + bell(-120, -178, 1.2) + potPlant(30, -178, 0.9, '#fff', '#3fbf8f');
    },
  },
  {
    s: 'beach', name: 'Tiki Welcome Desk', w: 450, h: 290, surfaces: [{ x1: -120, x2: 200, y: -176 }],
    art: (c) => {
      const bam = '#e8c88a';
      let s = '';
      for (let x = -190; x < 190; x += 24) s += R(x, -160, 22, 152, 10, x % 48 ? bam : dark(bam, 0.06)) + R(x, -110, 22, 4, 2, dark(bam, 0.2)) + R(x, -56, 22, 4, 2, dark(bam, 0.2));
      let fr = 'M-206 -176 H206 V-150';
      for (let i = 0; i < 20; i++) fr += ` L${f(206 - 20.6 * (i + 0.5))} -124 L${f(206 - 20.6 * (i + 1))} -150`;
      s += P(fr + 'Z', '#d9b36a') + R(-206, -184, 412, 12, 5, bam);
      s += R(-80, -110, 160, 40, 20, c) + T(0, -83, 'HELLO!', 22, '#fff') + G(motif('starfish', 0, 0, 18), 'transform="translate(-130 -80)"') + G(motif('fish', 0, 0, 16), 'transform="translate(130 -84)"');
      return s + bell(-150, -184, 1.2) + E(150, -190, 22, 8, '#fff3d6') + P('M130 -190 Q150 -216 170 -190Z', '#ff9ec7') + S('M140 -196 L150 -210 L160 -196', '#fff', 2);
    },
  },
], { sfx: 'ding', spawn: ['hotelKey'] });

const LUGGAGECARTS = series('luggagecart', 'Luggage Carts', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Golden Birdcage Cart', w: 270, h: 380, spawn: SUITCASES,
    art: (c) => {
      let s = S('M-104 -50 V-300 Q-104 -356 0 -356 Q104 -356 104 -300 V-50', GOLD, 9) + Ln(-104, -300, 104, -300, GOLD, 6) + C(0, -362, 9, GOLD) + S('M0 -372 q-10 -14 0 -20', GOLD, 4);
      s += box(-80, -150, 120, 100, 12, c) + R(-80, -110, 120, 8, 0, dark(c, 0.15)) + R(-34, -162, 28, 14, 7, 'none', `stroke="${dark(c, 0.3)}" stroke-width="5"`);
      s += box(-60, -226, 90, 76, 10, '#7cc8ff') + R(-24, -236, 20, 10, 5, 'none', `stroke="${dark('#7cc8ff', 0.3)}" stroke-width="4"`) + R(-60, -194, 90, 6, 0, '#fff', 'opacity="0.6"');
      s += box(44, -126, 50, 76, 8, '#ffd36b') + E(70, -260, 40, 10, '#fff') + R(30, -260, 80, 34, 6, '#fff3f8') + E(70, -226, 40, 10, '#ffd9e8') + bowG(70, -244, 0.5, c);
      s += box(-118, -54, 236, 22, 8, light(c, 0.3)) + R(-118, -36, 236, 6, 3, GOLD);
      return s + wheel(-90, -16, 16) + wheel(90, -16, 16);
    },
  },
  {
    s: 'modern', name: 'Silver Luggage Trolley', w: 260, h: 350, spawn: SUITCASES,
    art: (c) => {
      let s = sym((k) => R(100 * k - 5, -330, 10, 290, 5, SILVER)) + R(-104, -334, 208, 10, 5, SILVER) + R(-104, -200, 208, 6, 3, SILVER);
      s += box(-80, -150, 90, 104, 8, c) + Ln(-60, -146, -60, -50, dark(c, 0.15), 3) + Ln(-10, -146, -10, -50, dark(c, 0.15), 3);
      s += box(20, -130, 70, 84, 8, ST.modern.accent) + box(-70, -196, 120, 46, 8, '#ffd36b');
      s += box(-112, -48, 224, 16, 4, ST.modern.accent);
      return s + wheel(-90, -16, 16) + wheel(90, -16, 16);
    },
  },
  {
    s: 'retro', name: 'Brass Bellhop Cart', w: 270, h: 380, spawn: SUITCASES,
    art: (c) => {
      const br = ST.retro.trim;
      let s = sym((k) => R(104 * k - 6, -340, 12, 296, 6, br) + C(104 * k, -346, 10, br)) + S('M-104 -330 Q0 -380 104 -330', br, 8) + Ln(-104, -300, 104, -300, br, 6);
      s += box(-90, -140, 110, 94, 8, '#a86b4a') + R(-60, -140, 10, 94, 2, '#6b4226') + R(-10, -140, 10, 94, 2, '#6b4226') + C(-50, -110, 10, ST.retro.accent) + C(-20, -80, 9, '#ffd36b');
      s += box(30, -120, 64, 74, 8, ST.retro.accent) + box(-70, -206, 100, 66, 8, c) + R(-40, -218, 30, 12, 6, 'none', `stroke="${dark(c, 0.3)}" stroke-width="4"`);
      s += box(-120, -52, 240, 20, 6, '#c2244a') + R(-120, -36, 240, 6, 3, br);
      return s + wheel(-92, -16, 16) + wheel(92, -16, 16);
    },
  },
]);

const SUITCASE = series('suitcase', 'Suitcases', 'hotel', 'prop', [
  {
    s: 'sweet', name: 'Pink Spinner Suitcase', w: 100, h: 160,
    art: (c) => sym((k) => R(14 * k - 3, -156, 6, 50, 3, '#9aa3b5')) + R(-20, -160, 40, 8, 4, INK) + box(-42, -110, 84, 102, 16, c) +
      [-24, -8, 8, 24].map((x) => Ln(x, -100, x, -18, dark(c, 0.12), 3)).join('') + P(heartD(0, -76, 22), '#fff', 'opacity="0.8"') + hi(-34, -104, 30, 5) + sym((k) => C(30 * k, -4, 5, INK)),
  },
  {
    s: 'retro', name: 'Travel Sticker Case', w: 130, h: 100,
    art: (c) => R(-18, -98, 36, 14, 7, 'none', `stroke="${dark(c, 0.3)}" stroke-width="5"`) + box(-60, -86, 120, 80, 10, c) + sym((k) => R(34 * k - 5, -86, 10, 80, 2, dark(c, 0.3)) + R(34 * k - 7, -50, 14, 10, 2, ST.retro.trim)) +
      C(-14, -54, 14, '#5fd3b5') + P(starD(-14, -54, 8), '#fff') + R(4, -70, 22, 16, 3, '#ffd36b', 'transform="rotate(10 15 -62)"') + C(14, -24, 10, '#ff7a6b') + R(-56, -14, 112, 6, 3, dark(c, 0.2)),
    color: '#a86b4a',
  },
  {
    s: 'space', name: 'Galaxy Suitcase', w: 100, h: 150, color: '#c9cfdd',
    art: (c) => R(-14, -150, 28, 8, 4, INK) + sym((k) => R(10 * k - 3, -146, 6, 40, 3, '#9aa3b5')) + box(-40, -108, 80, 100, 18, c) + R(-40, -60, 80, 6, 0, dark(c, 0.15)) +
      motif('planet', -14, -84, 14) + motif('rocket', 16, -32, 13) + P(starD(18, -88, 6), ST.space.accent) + sym((k) => C(28 * k, -4, 5, INK)),
  },
  {
    s: 'beach', name: 'Stripy Beach Duffel', w: 130, h: 90,
    art: (c) => S('M-30 -60 Q0 -96 30 -60', '#4f9dff', 6) + cloth('M-58 -12 Q-64 -60 -40 -62 H40 Q64 -60 58 -12 Q0 0 -58 -12Z', c, 'stripes') + R(-44, -52, 88, 5, 2.5, '#fff', 'opacity="0.7"') + motif('starfish', 30, -30, 12),
  },
]);

// big hotel beds: two sleepers, like the bedroom's big beds
const BMT = -134;
const BHIP = 125;
const bigSeats: SeatDef[] = [{ x: BHIP, y: BMT + 6, pose: 'sleep' }, { x: BHIP + 10, y: BMT - 34, pose: 'sleep' }];
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
/** The blanket with a hotel bed runner across the foot. */
const hotelBlanket = (c: string, runner: string, pat = 'none') => {
  const x1 = BHIP - 148;
  const x2 = 214;
  return blanket(BHIP, BMT, c, pat, '#ffffff', x2, 38) + P(`M${x2 - 70} ${BMT - 48} L${x2 - 18} ${BMT - 50} L${x2 - 14} ${BMT + 66} L${x2 - 66} ${BMT + 68}Z`, runner) +
    S(`M${x2 - 62} ${BMT - 40} L${x2 - 58} ${BMT + 60}`, '#fff', 2, 'stroke-dasharray="5 5" opacity="0.6"') + R(x1 + 40, BMT - 36, 26, 14, 3, '#8a5a3c') + R(x1 + 43, BMT - 34, 20, 4, 2, '#ffd36b');
};
const hotelBase = (rail: string, pil: string, pil2: string, legC: string) =>
  box(-222, -96, 444, 36, 10, rail) + hi(-210, -92, 400, 5) + R(-213, -60, 14, 60, 6, legC) + R(199, -60, 14, 60, 6, legC) +
  box(-206, BMT, 416, 54, 18, '#ffffff', 'none', 'y') + pillow(-160, -184, pil2, 44, 22) + pillow(-70, -184, pil2, 44, 22) + pillow(-150, -146, pil, 50, 24) + pillow(-60, -148, pil, 40, 20);
const HOTELBEDS = series('hotelbed', 'Hotel Beds', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Sweetheart Suite Bed', w: 480, h: 330, seats: bigSeats,
    art: (c) => {
      let s = box(-236, -326, 472, 240, 26, dark(c, 0.06)) + box(-222, -312, 444, 220, 20, c);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) s += btn(-180 + i * 52 + (r % 2) * 26, -280 + r * 46, c);
      s += P(heartD(0, -348, 30), GOLD) + R(-236, -100, 472, 8, 4, GOLD);
      return s + hotelBase(dark(c, 0.15), '#ffffff', light(c, 0.5), GOLD);
    },
    front: (c) => hotelBlanket('#ffffff', c, 'none'),
  },
  {
    s: 'princess', name: 'Royal Canopy Suite Bed', w: 500, h: 470, seats: bigSeats,
    art: (c) => {
      let s = sym((k) => R(226 * k - 7, -450, 14, 450, 7, GOLD));
      s += cloth('M-240 -456 Q0 -490 240 -456 L240 -420 Q200 -396 160 -420 Q120 -396 80 -420 Q40 -396 0 -420 Q-40 -396 -80 -420 Q-120 -396 -160 -420 Q-200 -396 -240 -420Z', c) + motif('crown', 0, -482, 26);
      s += sym((k) => P(`M${222 * k} -420 Q${170 * k} -300 ${206 * k} -110 L${222 * k} -110Z`, light(c, 0.4), 'opacity="0.8"'));
      s += P('M-200 -90 V-280 Q-200 -330 -140 -330 Q-70 -330 0 -360 Q70 -330 140 -330 Q200 -330 200 -280 V-90Z', '#fff') + P('M-184 -100 V-272 Q-184 -314 -136 -314 Q-68 -316 0 -342 Q68 -316 136 -314 Q184 -314 184 -272 V-100Z', light(c, 0.25));
      for (let i = 0; i < 6; i++) s += btn(-150 + i * 60, -280, c) + btn(-120 + i * 60, -236, c);
      return s + hotelBase('#ffffff', '#ffffff', light(c, 0.4), GOLD);
    },
    front: (c) => hotelBlanket(light(c, 0.35), GOLD, 'hearts'),
  },
  {
    s: 'modern', name: 'Panel Wall Suite Bed', w: 520, h: 320, seats: bigSeats, toggle: true,
    art: (c, on) => {
      const wd = ST.modern.wood;
      let s = R(-256, -316, 512, 240, 6, wd);
      for (let x = -248; x < 256; x += 32) s += Ln(x, -310, x, -82, dark(wd, 0.1), 2, 'opacity="0.6"');
      s += R(-200, -290, 400, 170, 6, ST.modern.soft) + R(-200, -290, 400, 170, 6, 'url(#g-shadeY)', 'opacity="0.4"');
      s += sym((k) => R(228 * k - 4, -270, 8, 30, 3, ST.modern.accent) + (on ? glow(228 * k, -230, 70) : '') + P(`M${228 * k - 14} -240 H${228 * k + 14} L${228 * k + 10} -214 H${228 * k - 10}Z`, on ? '#fff6c8' : '#f4f4f8'));
      return s + hotelBase(ST.modern.accent, '#ffffff', c, ST.modern.accent);
    },
    front: (c) => hotelBlanket('#ffffff', ST.modern.accent),
  },
  {
    s: 'beach', name: 'Island Rattan Bed', w: 490, h: 360, seats: bigSeats,
    art: (c) => {
      const rat = '#e8c88a';
      let s = '';
      for (const [x, a] of [[-180, -30], [180, 30], [-120, -12], [120, 12]] as [number, number][]) s += G(P('M0 0 Q-20 -80 0 -160 Q20 -80 0 0Z', '#5fc47c') + S('M0 -10 V-150', '#3f9a5c', 2), `transform="translate(${x} -280) rotate(${a})"`);
      s += P('M-220 -90 V-260 Q-220 -330 0 -334 Q220 -330 220 -260 V-90Z', rat);
      for (let y = -320; y < -96; y += 14) s += Ln(-210, y, 210, y, dark(rat, 0.12), 6, `stroke-dasharray="10 6" stroke-dashoffset="${(y / 14) % 2 ? 8 : 0}" opacity="0.6"`);
      s += S('M-220 -90 V-260 Q-220 -330 0 -334 Q220 -330 220 -260 V-90', dark(rat, 0.2), 6) + G(motif('starfish', 0, 0, 22), 'transform="translate(0 -300)"');
      return s + hotelBase(rat, '#ffffff', c, dark(rat, 0.3));
    },
    front: (c) => hotelBlanket(light(c, 0.3), '#ffffff', 'stripes'),
  },
]);

const BELLSTANDS = series('bellstand', 'Concierge Podiums', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Concierge Podium', w: 150, h: 230,
    art: (c) => {
      let s = P('M-50 -180 H50 L40 -14 H-40Z', c) + P('M-50 -180 H50 L40 -14 H-40Z', 'url(#g-shadeX)') + R(-48, -16, 96, 14, 5, dark(c, 0.25));
      s += P('M-64 -194 H64 L56 -176 H-56Z', '#fffaf6') + R(-64, -198, 128, 6, 3, GOLD) + R(-34, -150, 68, 26, 13, '#fff') + T(0, -132, 'ASK ME', 13, dark(c, 0.35)) + P(heartD(0, -104, 24), GOLD);
      return s + bell(-20, -196, 1) + R(14, -208, 30, 12, 3, '#fff');
    },
  },
  {
    s: 'retro', name: 'Brass Bellhop Stand', w: 150, h: 230,
    art: (c) => {
      const br = ST.retro.trim;
      let s = E(0, -8, 50, 10, br) + R(-8, -160, 16, 150, 6, br) + box(-60, -196, 120, 40, 8, c) + R(-60, -164, 120, 6, 3, br) + T(0, -170, 'BELLHOP', 15, '#fff');
      return s + bell(0, -196, 1.2) + P('M-60 -196 L-70 -210 H70 L60 -196Z', dark(c, 0.15));
    },
  },
], { sfx: 'ding' });

const LOBBYSOFAS = series('lobbysofa', 'Lobby Sofas', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Round Lobby Sofa', w: 420, h: 400, seats: two(-104, 100),
    art: (c) => {
      let s = P('M-30 -380 Q-60 -330 -40 -300 M30 -380 Q60 -330 40 -300', 'none');
      for (const [a, l] of [[-50, 90], [-20, 110], [10, 110], [40, 90], [-80, 70], [70, 70]] as [number, number][]) s += G(P(`M0 0 Q-16 ${-l / 2} 0 ${-l} Q16 ${-l / 2} 0 0Z`, a % 20 ? '#5fc47c' : '#3fbf8f') + S(`M0 -4 V${-l + 6}`, '#2f8a5a', 2), `transform="translate(0 -290) rotate(${a})"`);
      s += P('M-40 -296 H40 L32 -260 H-32Z', GOLD);
      s += cloth('M-60 -110 Q-60 -200 -32 -262 H32 Q60 -200 60 -110Z', dark(c, 0.06)) + sym((k) => btn(18 * k, -230, c) + btn(30 * k, -180, c) + btn(40 * k, -134, c)) + btn(0, -200, c) + btn(0, -150, c);
      s += cloth('M-190 -100 Q-200 -170 -150 -176 Q-90 -180 -60 -150 L-60 -100Z', c) + cloth('M190 -100 Q200 -170 150 -176 Q90 -180 60 -150 L60 -100Z', c);
      s += cush(-196, -112, 392, 34, light(c, 0.15), 'none', 17) + box(-200, -80, 400, 56, 18, dark(c, 0.1));
      s += P(`M-200 -34 H200${scallop(200, -200, -34, 14, 4)}Z`, light(c, 0.4));
      return s + sym((k) => R(170 * k - 5, -22, 10, 22, 4, GOLD));
    },
  },
  {
    s: 'princess', name: 'Grand Chesterfield', w: 420, h: 230, seats: three(-104, 112),
    art: (c) => {
      let s = box(-180, -200, 360, 110, 22, c);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
        const x = -160 + i * 40 + (r % 2) * 20;
        if (x < 170) s += btn(x, -184 + r * 30, c);
      }
      s += sym((k) => box(k > 0 ? 160 : -206, -160, 46, 120, 20, c) + E(183 * k, -158, 24, 16, light(c, 0.2)) + S(`M${183 * k} -158 m-8 0 a8 8 0 1 1 8 8 a13 13 0 1 1 -13 -13`, dark(c, 0.2), 2.5));
      s += cush(-168, -112, 336, 36, light(c, 0.12), 'none', 14) + box(-190, -78, 380, 40, 8, dark(c, 0.1)) + R(-190, -46, 380, 6, 3, GOLD);
      return s + sym((k) => P(`M${160 * k} -40 Q${170 * k} -20 ${160 * k} 0 H${176 * k} Q${180 * k} -20 ${172 * k} -40Z`, GOLD)) + motif('crown', 0, -216, 18);
    },
  },
  {
    s: 'modern', name: 'Long Lounge Sofa', w: 440, h: 190, seats: three(-102, 120),
    art: (c) => {
      let s = box(-200, -186, 400, 90, 8, dark(c, 0.06));
      for (const x of [-180, -60, 60]) s += box(x + 2, -178, 116, 70, 10, light(c, 0.06));
      for (const x of [-180, -60, 60]) s += cush(x, -108, 120, 34, c, 'none', 8);
      s += box(-150, -158, 50, 44, 10, '#ffd36b') + box(104, -160, 46, 46, 10, ST.modern.accent);
      s += box(-210, -76, 420, 26, 4, dark(c, 0.2));
      return s + sym((k) => Ln(190 * k, -50, 196 * k, 0, INK, 6) + Ln(60 * k, -50, 56 * k, 0, INK, 6));
    },
  },
  {
    s: 'retro', name: 'Curvy Velvet Sofa', w: 420, h: 220, seats: three(-104, 110),
    art: (c) => {
      const back = 'M-196 -90 Q-210 -210 -100 -206 Q0 -226 100 -206 Q210 -210 196 -90Z';
      let s = cloth(back, c);
      for (let x = -160; x <= 160; x += 32) s += S(`M${x} -198 Q${x * 1.02} -150 ${x} -108`, dark(c, 0.2), 3, 'opacity="0.7"');
      s += cush(-180, -112, 360, 36, light(c, 0.1), 'none', 18) + cloth('M-200 -80 Q0 -60 200 -80 L196 -44 Q0 -24 -196 -44Z', dark(c, 0.1));
      return s + sym((k) => Ln(150 * k, -40, 166 * k, 0, ST.retro.trim, 7) + C(166 * k, 0, 5, ST.retro.trim));
    },
  },
]);

/** A revolving door: four glass wings that turn when on. */
function revolver(on: boolean, frame: string, bar: string): string {
  const R0 = 104;
  let s = R(-R0, -160, R0 * 2, 330, 4, '#cfe9ff', 'opacity="0.55"') + R(-R0, -160, R0 * 2, 330, 4, 'url(#g-glass)');
  const xs = (k: number, steps = 12) => Array.from({ length: steps + 1 }, (_, i) => f(R0 * Math.sin(((i / steps) * 90 + k * 90 + 20) * (Math.PI / 180)))).join(';');
  for (let k = 0; k < 4; k++) {
    const x0 = R0 * Math.sin((k * 90 + 20) * (Math.PI / 180));
    const anim = on ? `<animateTransform attributeName="transform" type="translate" values="${xs(k).split(';').map((v) => `${v} 0`).join(';')}" dur="2.4s" repeatCount="indefinite"/>` : '';
    s += `<g ${on ? '' : `transform="translate(${f(x0)} 0)"`}>${anim}${R(-5, -160, 10, 330, 3, frame)}${R(-4, 0, 8, 26, 3, bar)}</g>`;
  }
  return s + Ln(0, -160, 0, 170, frame, 6);
}
const REVOLVING = series('revolvingdoor', 'Revolving Doors', 'hotel', 'wall', [
  {
    s: 'sweet', name: 'Golden Revolving Door', w: 320, h: 450,
    art: (c, on) => {
      let s = R(-150, -170, 300, 350, 8, GOLD) + R(-138, -160, 276, 330, 4, '#3d3a52') + revolver(on, GOLD, '#fff');
      s += cloth('M-160 -224 H160 V-170 Q0 -150 -160 -170Z', c) + R(-166, -228, 332, 12, 6, GOLD) + T(0, -180, 'HOTEL', 30, '#fff') + P(heartD(-110, -206, 18), '#fff', 'opacity="0.8"') + P(heartD(110, -206, 18), '#fff', 'opacity="0.8"');
      return s + R(-150, 170, 300, 20, 6, dark(c, 0.2));
    },
  },
  {
    s: 'modern', name: 'Glass Revolving Door', w: 320, h: 440,
    art: (c, on) => {
      let s = R(-150, -170, 300, 350, 4, SILVER) + R(-140, -160, 280, 330, 2, '#2d3a52') + revolver(on, SILVER, c);
      s += R(-160, -214, 320, 44, 4, ST.modern.accent) + T(0, -184, 'HOTEL', 24, '#fff', 'letter-spacing="10"') + sym((k) => C(130 * k, -192, 5, on ? '#7fe0b0' : '#9aa3b5'));
      return s + R(-150, 170, 300, 16, 3, INK);
    },
  },
], { toggle: true });

const HCHANDELIERS = series('chandelier-hotel', 'Grand Chandeliers', 'hotel', 'wall', [
  {
    s: 'sweet', name: 'Pink Crystal Chandelier', w: 340, h: 360,
    art: (c, on) => {
      let s = R(-18, -180, 36, 8, 4, GOLD) + Ln(0, -172, 0, -100, GOLD, 4) + (on ? glow(0, -10, 220) : '');
      const drop = (x: number, y: number, col: string) => P(`M${f(x)} ${f(y)} Q${f(x + 7)} ${f(y + 12)} ${f(x)} ${f(y + 20)} Q${f(x - 7)} ${f(y + 12)} ${f(x)} ${f(y)}Z`, col) + C(x - 2, y + 10, 2, '#fff', 'opacity="0.8"');
      for (const [y, rx, n] of [[-60, 120, 7], [0, 160, 9]] as [number, number, number][]) {
        s += S(`M${-rx} ${y} Q0 ${y + 60} ${rx} ${y}`, GOLD, 6);
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          const x = -rx + t * 2 * rx;
          const yy = y + 60 * 2 * t * (1 - t) * 0.98;
          s += S(`M${f(x)} ${f(yy)} V${f(yy - 20)}`, GOLD, 4) + R(x - 5, yy - 40, 10, 22, 3, '#fff') + (on ? `<g>${pulse(1, 0.7, 1.4, i * 0.2)}${E(x, yy - 48, 6, 9, '#fff6c8')}</g>` : E(x, yy - 48, 5, 8, '#fffaf0', 'opacity="0.7"'));
          s += drop(x, yy + 4, i % 2 ? light(c, 0.3) : '#ffffff');
        }
      }
      for (let i = 0; i < 7; i++) s += drop(-60 + i * 20, 80 + Math.abs(i - 3) * -6 + 20, light(c, 0.2));
      s += E(0, -94, 30, 12, GOLD) + E(0, 40, 26, 10, GOLD);
      return s + P(heartD(0, 112, 26), c) + P(heartD(0, 112, 26), 'url(#g-face)');
    },
  },
  {
    s: 'princess', name: 'Palace Gold Chandelier', w: 380, h: 380,
    art: (c, on) => {
      let s = R(-20, -190, 40, 10, 5, GOLD) + Ln(0, -180, 0, -130, GOLD, 5) + (on ? glow(0, 0, 240) : '');
      for (const [y, rx, n] of [[-110, 70, 4], [-40, 130, 6], [40, 180, 8]] as [number, number, number][]) {
        s += E(0, y + 20, rx, 16, 'none', `stroke="${GOLD}" stroke-width="7"`);
        for (let i = 0; i < n; i++) {
          const x = -rx + (i / (n - 1)) * 2 * rx;
          s += R(x - 6, y - 16, 12, 28, 3, '#fff') + (on ? `<g>${pulse(1, 0.75, 1.2, i * 0.15)}${E(x, y - 24, 7, 10, '#fff6c8')}</g>` : E(x, y - 24, 5, 8, '#fffaf0', 'opacity="0.7"'));
          s += P(`M${f(x)} ${f(y + 28)} l6 10 l-6 12 l-6 -12Z`, light(c, 0.3));
        }
      }
      s += S('M0 -120 V150', GOLD, 8) + C(0, 150, 14, GOLD) + C(0, 172, 8, light(c, 0.2));
      return s + motif('crown', 0, -150, 20);
    },
  },
  {
    s: 'modern', name: 'Glass Globe Cascade', w: 320, h: 380,
    art: (c, on) => {
      let s = E(0, -178, 140, 12, ST.modern.accent);
      const globes = [[-120, 40], [-90, -40], [-60, 110], [-30, 0], [0, 150], [30, 60], [60, -30], [90, 100], [120, 20], [-110, 130], [100, 160]];
      for (const [x, y] of globes) s += Ln(x, -170, x, y - 20, ST.modern.accent, 1.5);
      if (on) s += glow(0, 40, 220);
      globes.forEach(([x, y], i) => { s += C(x, y, 20, on ? '#fff6c8' : light(c, 0.4), 'opacity="0.9"') + C(x, y, 20, 'url(#g-glass)') + (on ? `<g>${pulse(1, 0.6, 1.8, i * 0.2)}${C(x, y, 8, '#fff')}</g>` : C(x, y, 5, '#fff', 'opacity="0.6"')); });
      return s;
    },
  },
], { toggle: true });

const KEYRACKS = series('keyrack', 'Key Racks', 'hotel', 'wall', [
  {
    s: 'sweet', name: 'Room Key Rack', w: 280, h: 220, spawn: ['hotelKey'],
    art: (c) => {
      let s = box(-130, -100, 260, 200, 12, ST.sweet.wood) + R(-118, -88, 236, 176, 6, dark(ST.sweet.wood, 0.3));
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
        const x = -88 + i * 58;
        const y = -60 + r * 56;
        s += C(x, y, 3.5, GOLD);
        if ((r * 4 + i) % 5 !== 3) s += G(`<g>${sway(6, x, y, 2.4 + i * 0.3, r * 0.4)}${Ln(x, y, x, y + 12, GOLD, 2)}${C(x, y + 16, 6, 'none', `stroke="${GOLD}" stroke-width="3"`)}${R(x - 2, y + 20, 4, 14, 1, GOLD)}${R(x + 2, y + 28, 6, 3, 1, GOLD)}${R(x + 4, y + 2, 20, 26, 6, [c, '#7cc8ff', '#ffd36b', '#7fe0b0'][(r + i) % 4])}${T(x + 14, y + 20, String(101 + r * 100 + i), 8, '#fff')}</g>`);
      }
      return s + R(-60, -116, 120, 26, 13, c) + T(0, -98, 'KEYS', 16, '#fff');
    },
  },
]);

const PLANTWALLS = series('plantwall', 'Plant Walls', 'hotel', 'wall', [
  {
    s: 'woodland', name: 'Leafy Welcome Wall', w: 400, h: 300,
    art: (c) => {
      let s = box(-196, -146, 392, 292, 10, ST.woodland.wood) + R(-182, -132, 364, 264, 6, dark(c, 0.35));
      const greens = [c, dark(c, 0.12), light(c, 0.15), '#5fc47c', '#3fbf8f'];
      for (let y = -120; y <= 120; y += 30) for (let x = -170; x <= 170; x += 30) {
        const k = Math.abs((x * 7 + y * 13) % 5);
        s += leafy(x + ((y / 30) % 2 ? 12 : 0), y, 22, greens[k]);
      }
      for (const [x, y, col] of [[-120, -80, '#ff9ec7'], [80, -100, '#fff'], [140, 60, '#ffd36b'], [-60, 90, '#ff7eb6'], [20, 30, '#fff'], [-150, 40, '#ffd36b']] as [number, number, string][]) s += flowerG(x, y, 12, col);
      return s + R(-90, -24, 180, 48, 24, '#fff3d6') + T(0, 10, 'Welcome', 30, ST.woodland.wood);
    },
  },
]);

const ROOMSERVICE = series('roomservice', 'Room Service Carts', 'hotel', 'floor', [
  {
    s: 'sweet', name: 'Room Service Cart', w: 280, h: 280,
    art: (c, on) => {
      let s = sym((k) => R(110 * k - 4, -40, 8, 30, 3, GOLD)) + wheel(-110, -10, 10, '#9aa3b5') + wheel(110, -10, 10, '#9aa3b5');
      s += cloth(`M-130 -150 H130 V-50${scallop(130, -130, -50, 10, 5)}Z`, '#ffffff') + P(`M-130 -150 H130 V-130 H-130Z`, '#fff');
      s += cloth(`M-130 -110 H130 V-80${scallop(130, -130, -80, 10, 4)}Z`, c, 'none', 'y');
      s += S('M130 -150 Q160 -150 160 -180', SILVER, 6);
      s += E(-30, -152, 66, 8, '#e6e8f0');
      s += on ? G(E(-30, -162, 40, 8, '#e8b46a') + E(-30, -172, 38, 8, '#f0c47a') + E(-30, -182, 36, 8, '#e8b46a') + P('M-50 -188 Q-30 -196 -10 -188 Q-20 -176 -30 -170 Q-40 -176 -50 -188Z', '#ffd84a', 'opacity="0.9"') + C(-30, -194, 6, '#e8384f'))
        + `<g>${bob(0, -6, 1.2)}<g transform="translate(0 -70)">${P('M-90 -156 Q-90 -218 -30 -218 Q30 -218 30 -156Z', SILVER)}${C(-30, -224, 8, SILVER)}</g></g>`
        : P('M-90 -156 Q-90 -218 -30 -218 Q30 -218 30 -156Z', SILVER) + C(-30, -224, 8, SILVER) + hi(-74, -200, 24, 6, 0.6);
      s += P('M66 -152 L94 -152 L90 -196 L70 -196Z', '#cfe9ff', 'opacity="0.85"') + flowerG(80, -210, 12, c) + flowerG(68, -198, 8, '#fff') + Ln(80, -200, 80, -160, '#5fae6b', 2);
      return s;
    },
  },
  {
    s: 'princess', name: 'Golden Tea Trolley', w: 260, h: 290,
    art: (c, on) => {
      let s = sym((k) => R(104 * k - 5, -280, 10, 260, 5, GOLD)) + S('M104 -280 Q130 -290 126 -260', GOLD, 6);
      for (const y of [-200, -110]) s += E(0, y, 110, 12, GOLD) + E(0, y - 2, 104, 9, '#fff');
      s += G(teddyCake(-50, -202, c)) + E(40, -214, 22, 18, '#fff') + P('M60 -220 Q76 -228 74 -240', 'none', 'stroke="#fff" stroke-width="5"') + E(40, -232, 10, 4, c);
      s += (on ? `<g>${pulse(0.9, 0.2, 2)}${S('M40 -244 q-6 -10 0 -18 M48 -244 q6 -10 0 -18', '#fff', 2)}</g>` : '') + E(-40, -114, 22, 6, '#fff') + C(-48, -122, 8, '#ff9ec7') + C(-32, -122, 8, '#ffe680') + C(-40, -130, 8, '#7fe0b0') + E(40, -114, 26, 6, '#fff') + P('M20 -116 L60 -116 L56 -134 L24 -134Z', '#e8b46a');
      return s + wheel(-104, -14, 14, '#fff') + wheel(104, -14, 14, '#fff') + motif('crown', 0, -300, 14);
    },
  },
  {
    s: 'modern', name: 'Steel Service Cart', w: 240, h: 250,
    art: (c, on) => {
      let s = sym((k) => R(100 * k - 4, -150, 8, 130, 3, SILVER)) + R(-110, -156, 220, 10, 4, SILVER) + R(-110, -70, 220, 8, 4, SILVER);
      s += box(-80, -66, 60, 46, 6, c) + box(10, -66, 60, 46, 6, ST.modern.accent);
      s += E(-10, -158, 60, 7, '#e6e8f0');
      s += on ? G(E(-10, -164, 34, 7, '#e8b46a') + E(-10, -172, 32, 7, '#f0c47a') + E(-10, -180, 30, 7, '#e8b46a') + C(-10, -188, 5, '#e8384f')) + `<g>${bob(0, -6, 1.2)}<g transform="translate(0 -60)">${P('M-60 -158 Q-60 -214 -10 -214 Q40 -214 40 -158Z', SILVER)}${C(-10, -220, 7, SILVER)}</g></g>`
        : P('M-60 -158 Q-60 -214 -10 -214 Q40 -214 40 -158Z', SILVER) + C(-10, -220, 7, SILVER);
      return s + R(60, -184, 26, 28, 4, '#fff') + R(64, -176, 18, 4, 2, c) + wheel(-96, -12, 12) + wheel(96, -12, 12);
    },
  },
], { toggle: true, spawn: ROOM_FOOD });

function teddyCake(x: number, y: number, c: string): string {
  return box(x - 26, y - 34, 52, 34, 8, light(c, 0.4)) + R(x - 26, y - 22, 52, 6, 0, c) + P(`M${x - 26} ${y - 34}${scallop(x - 26, x + 26, y - 34, 5, 3)} V${y - 38} H${x - 26}Z`, '#fff') + C(x, y - 42, 6, '#e8384f');
}

const LOUNGERS = series('poollounger', 'Pool Loungers', 'hotel', 'floor', [
  {
    s: 'beach', name: 'Umbrella Sun Lounger', w: 380, h: 400, seats: one(-80, -30),
    art: (c) => {
      let s = R(110, -380, 8, 380, 4, '#fff') + P('M-10 -330 Q114 -430 238 -330 Q207 -346 176 -330 Q145 -346 114 -330 Q83 -346 52 -330 Q21 -346 -10 -330Z', c);
      for (let i = 0; i < 4; i += 2) s += P(`M${-10 + i * 62} -330 Q${20 + i * 62} -400 114 -392 L${114} -392 Q${70 + i * 40} -380 ${52 + i * 62} -330 Q${21 + i * 62} -346 ${-10 + i * 62} -330Z`, '#fff', 'opacity="0.9"');
      s += C(114, -394, 6, '#fff');
      s += sym((k) => Ln(130 * k, -50, 130 * k, 0, '#fff', 7));
      s += P('M-150 -60 L-200 -190 L-176 -196 L-124 -66Z', '#fff') + cloth('M-146 -70 L-190 -180 L-174 -186 L-128 -76Z', c, 'stripes');
      s += box(-150, -80, 300, 26, 10, c, 'stripes') + R(-156, -58, 312, 10, 5, '#fff');
      return s + E(-190, -196, 26, 14, '#fff') + G(motif('starfish', 0, 0, 14), 'transform="translate(160 -96)"');
    },
  },
  {
    s: 'sweet', name: 'Heart Pool Lounger', w: 340, h: 220, seats: one(-80, -30),
    art: (c) => {
      let s = sym((k) => R(130 * k - 4, -56, 8, 56, 4, GOLD));
      s += cloth('M-146 -64 Q-200 -170 -178 -206 Q-150 -214 -140 -190 Q-116 -120 -110 -70Z', c) + P(heartD(-164, -190, 30), light(c, 0.5));
      s += box(-154, -84, 310, 28, 14, c) + R(-150, -60, 300, 8, 4, '#fff') + pillow(-140, -110, '#fff', 30, 16);
      return s + P(heartD(120, -110, 20), light(c, 0.4));
    },
  },
  {
    s: 'retro', name: 'Strappy Lounge Chair', w: 340, h: 210, seats: one(-80, -30),
    art: (c) => {
      const fr = ST.retro.metal;
      let s = sym((k) => Ln(130 * k, -70, 130 * k, 0, fr, 6)) + S('M-140 -70 L-190 -190 M-120 -70 L-170 -190', fr, 6);
      for (let i = 0; i < 5; i++) s += G(R(-14, -10, 28, 20, 4, i % 2 ? c : ST.retro.accent), `transform="translate(${-152 - i * 8} ${-90 - i * 22}) rotate(-22)"`);
      for (let x = -120; x <= 130; x += 28) s += R(x - 12, -86, 24, 20, 3, (x / 28) % 2 ? c : ST.retro.accent);
      return s + R(-140, -70, 280, 6, 3, fr);
    },
  },
]);

const DNDSIGNS = series('dndsign', 'Door Hangers', 'hotel', 'wall', [
  {
    s: 'sweet', name: 'Do Not Disturb Hanger', w: 130, h: 240,
    art: (c, on) => {
      const d = 'M-54 -110 Q-54 -116 -48 -116 H48 Q54 -116 54 -110 V110 Q54 116 48 116 H-48 Q-54 116 -54 110Z';
      let s = P(d, on ? '#fff3b0' : c) + C(0, -80, 22, '#fff') + C(0, -80, 18, 'none', `stroke="${dark(c, 0.2)}" stroke-width="2"`);
      if (on) s += motif('sun', 0, 0, 30) + T(0, 62, 'COME', 18, '#ff7eb6') + T(0, 84, 'IN!', 18, '#ff7eb6');
      else s += P('M6 -36 A30 30 0 1 0 30 6 A22 22 0 1 1 6 -36Z', '#ffe680') + sleepyEye(-4, -6, 5) + zzz(30, -30, '#fff') + T(0, 54, 'DO NOT', 16, '#fff') + T(0, 76, 'DISTURB', 16, '#fff');
      return s + S(d, '#fff', 3, 'opacity="0.7"');
    },
  },
  {
    s: 'space', name: 'Sleepy Planet Hanger', w: 130, h: 240,
    art: (c, on) => {
      const d = 'M-54 -110 Q-54 -116 -48 -116 H48 Q54 -116 54 -110 V110 Q54 116 48 116 H-48 Q-54 116 -54 110Z';
      let s = P(d, on ? '#9fd6ff' : c) + C(0, -80, 22, '#fff') + P(starD(-34, 20, 6), ST.space.accent) + P(starD(34, -30, 5), ST.space.accent);
      s += on ? motif('rocket', 0, 0, 30) + T(0, 70, 'HELLO!', 18, '#fff') : motif('planet', 0, 0, 30) + T(0, 56, 'SHH...', 18, '#fff') + T(0, 80, 'SLEEPING', 13, ST.space.accent);
      return s;
    },
  },
], { toggle: true });

const LOBBYFOUNTAINS = series('lobbyfountain', 'Lobby Fountains', 'hotel', 'floor', [
  {
    s: 'princess', name: 'Marble Tiered Fountain', w: 320, h: 360, color: '#7cc8ff',
    art: (c) => {
      const mar = '#fbf7fb';
      let s = E(0, -40, 150, 30, dark(mar, 0.08)) + R(-150, -70, 300, 40, 18, mar) + E(0, -70, 150, 18, c, 'opacity="0.8"') + R(-150, -46, 300, 6, 3, GOLD);
      s += R(-16, -210, 32, 140, 6, mar) + E(0, -210, 80, 14, mar) + E(0, -214, 72, 10, c, 'opacity="0.8"') + R(-10, -290, 20, 80, 5, mar) + E(0, -290, 40, 9, mar) + C(0, -300, 12, GOLD);
      const fall = (x: number, y1: number, y2: number, d: number) => `<path d="M${x} ${y1} Q${x * 1.3} ${(y1 + y2) / 2} ${x * 1.2} ${y2}" fill="none" stroke="${light(c, 0.2)}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 8"><animate attributeName="stroke-dashoffset" values="0;-36" dur="0.8s" begin="${f(-d)}s" repeatCount="indefinite"/></path>`;
      s += fall(-70, -210, -76, 0) + fall(70, -210, -76, 0.3) + fall(-36, -292, -216, 0.1) + fall(36, -292, -216, 0.5);
      s += `<path d="M0 -312 L0 -350" stroke="${light(c, 0.5)}" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"><animate attributeName="stroke-dashoffset" values="0;36" dur="0.6s" repeatCount="indefinite"/></path>`;
      return s + sym((k) => C(110 * k, -76, 4, '#fff', 'opacity="0.8"'));
    },
  },
  {
    s: 'modern', name: 'Waterfall Glass Wall', w: 300, h: 380,
    art: (c) => {
      let s = R(-140, -370, 280, 320, 6, '#3d3a52') + R(-130, -360, 260, 300, 4, light(c, 0.2), 'opacity="0.6"');
      for (let x = -120; x <= 120; x += 20) s += `<path d="M${x} -356 V-66" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="20 14" opacity="0.6"><animate attributeName="stroke-dashoffset" values="0;-68" dur="${f(1 + (Math.abs(x) % 3) * 0.2)}s" repeatCount="indefinite"/></path>`;
      s += glass(-130, -360, 260, 300, 4) + R(-150, -60, 300, 54, 6, ST.modern.accent) + E(0, -60, 140, 10, c);
      return s + R(-150, -10, 300, 10, 3, INK) + potPlant(-120, -60, 0.8, '#fff', '#3fbf8f') + potPlant(120, -60, 0.8, '#fff', '#3fbf8f');
    },
  },
]);

const ELEVATORS = series('elevator', 'Elevators', 'hotel', 'wall', [
  {
    s: 'sweet', name: 'Golden Elevator', w: 320, h: 460,
    art: (c, on) => {
      let s = R(-140, -224, 280, 448, 10, GOLD) + R(-122, -156, 244, 370, 4, '#3d3a52');
      s += P('M-60 -170 A60 60 0 0 1 60 -170Z', '#fff') + G((on ? sway(60, 0, -170, 3) : '') + Ln(0, -170, 0, -216, c, 4), on ? '' : 'transform="rotate(-50 0 -170)"') + C(0, -170, 6, c);
      s += elevatorInside(on, -116, -150, 232, 360, light(c, 0.5)) + elevatorDoors(on, -116, -150, 232, 360, c, (x) => P(heartD(x, -20, 30), light(c, 0.35)));
      return s + R(-150, 210, 300, 14, 4, dark(c, 0.3)) + callBtns(152, on, '#fff');
    },
  },
  {
    s: 'modern', name: 'Steel Elevator', w: 320, h: 450,
    art: (c, on) => {
      let s = R(-140, -220, 280, 440, 4, SILVER) + R(-120, -150, 240, 362, 2, '#3d3a52');
      s += R(-40, -200, 80, 34, 6, INK) + T(0, -175, on ? '▲ 3' : '1', 22, '#ff7a6b');
      s += elevatorInside(on, -116, -146, 232, 356, '#e6e8f0') + elevatorDoors(on, -116, -146, 232, 356, '#c9cfdd', () => '');
      return s + R(-150, 210, 300, 12, 3, INK) + callBtns(150, on, c);
    },
  },
  {
    s: 'retro', name: 'Art Deco Elevator', w: 330, h: 470,
    art: (c, on) => {
      const g = ST.retro.trim;
      let s = P('M-150 230 V-170 L-110 -230 H110 L150 -170 V230Z', g) + R(-124, -150, 248, 370, 4, '#3d3a52');
      s += P('M-70 -170 A70 70 0 0 1 70 -170Z', c) + `<g>${on ? sway(60, 0, -170, 3) : ''}${Ln(0, -170, 0, -224, '#fff', 4)}</g>` + C(0, -170, 6, '#fff');
      for (let i = 0; i < 5; i++) s += T(-56 + i * 28, -186 + Math.abs(i - 2) * 10, String(i + 1), 12, '#fff');
      const sun = (x: number) => { let r = ''; for (let i = 0; i < 7; i++) r += Ln(x, 40, x - 50 + i * (100 / 6), -60, light(c, 0.3), 3); return r + C(x, 40, 16, light(c, 0.3)); };
      s += elevatorInside(on, -118, -146, 236, 362, '#fff3d6') + elevatorDoors(on, -118, -146, 236, 362, c, sun);
      return s + callBtns(156, on, g);
    },
  },
], { toggle: true, sfx: 'ding' });

/** Inside an elevator: a lit cabin with a mirror and a handrail. */
function elevatorInside(on: boolean, x: number, y: number, w: number, h: number, wall: string): string {
  if (!on) return '';
  return R(x, y, w, h, 2, wall) + glow(x + w / 2, y + 40, 120) + R(x + 30, y + 30, w - 60, h * 0.45, 4, '#cfe9ff') + R(x + 30, y + 30, w - 60, h * 0.45, 4, 'url(#g-glass)') +
    R(x + 10, y + h * 0.6, w - 20, 8, 4, GOLD) + R(x, y + h - 40, w, 40, 0, '#c2244a') + R(x, y + h - 40, w, 6, 0, '#fff', 'opacity="0.3"');
}
/** Elevator doors: shut in the middle when off, slid into the sides when on. */
function elevatorDoors(on: boolean, x: number, y: number, w: number, h: number, c: string, deco: (cx: number) => string): string {
  const half = w / 2;
  const gap = on ? half - 18 : 0;
  let s = '';
  for (const k of [-1, 1]) {
    const dx = k < 0 ? x - gap : x + half + gap;
    const id = `lzc-elev-${k < 0 ? 'l' : 'r'}-${Math.round(-x)}-${Math.round(-y)}-${Math.round(h)}`;
    s += `<g><clipPath id="${id}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath><g clip-path="url(#${id})">` +
      R(dx, y, half, h, 2, c) + R(dx, y, half, h, 2, 'url(#g-shadeX)', 'opacity="0.5"') + G(deco(0), `transform="translate(${f(dx + half / 2)} ${f(y + h / 2 - 20)})"`) + Ln(k < 0 ? dx + half - 2 : dx + 2, y, k < 0 ? dx + half - 2 : dx + 2, y + h, dark(c, 0.3), 3) + '</g></g>';
  }
  return s;
}
/** Up and down call buttons beside an elevator. */
const callBtns = (x: number, on: boolean, plate = '#c9cfdd') => R(x - 9, -30, 18, 48, 8, plate) + C(x, -16, 5, on ? '#ffd36b' : '#fff') + C(x, 4, 5, '#fff') + P(`M${x - 3} -14 L${x} -19 L${x + 3} -14Z`, INK) + P(`M${x - 3} 2 L${x} 7 L${x + 3} 2Z`, INK);

const HOTEL_PROPS: FurnDef[] = [
  prop('hotelKey', 'Room Key', 'hotel', 'Hotel Props', 80, 50, () => G(C(-24, -20, 13, 'none', `stroke="${GOLD}" stroke-width="6"`) + R(-12, -23, 44, 7, 3, GOLD) + R(22, -18, 6, 12, 2, GOLD) + R(12, -18, 5, 9, 2, GOLD) + Ln(-30, -30, -40, -40, '#ff7eb6', 2) + R(-50, -54, 20, 16, 4, '#ff7eb6') + T(-40, -42, '7', 10, '#fff'), 'transform="rotate(-6 0 -20)"')),
  prop('hotelPancakes', 'Pancake Stack', 'hotel', 'Hotel Props', 90, 70, () => E(0, -4, 42, 8, '#e6e8f0') + E(0, -12, 34, 8, '#d9a066') + E(0, -20, 34, 8, '#e8b46a') + E(0, -28, 32, 8, '#d9a066') + E(0, -36, 32, 8, '#e8b46a') + P('M-20 -40 Q0 -50 20 -40 Q16 -30 6 -28 Q4 -18 0 -16 Q-4 -24 -10 -30 Q-18 -32 -20 -40Z', '#ffd84a', 'opacity="0.9"') + C(0, -46, 6, '#e8384f') + R(-6, -52, 12, 6, 2, '#fff8de'), { food: true }),
  prop('hotelTowelSwan', 'Towel Swan', 'hotel', 'Hotel Props', 100, 90, () => P('M-40 -4 Q-46 -36 -10 -40 Q20 -42 36 -20 Q40 -4 -40 -4Z', '#fff') + S('M10 -36 Q30 -60 18 -76 Q8 -84 4 -72', '#fff', 10) + P('M4 -76 L-8 -72 L4 -68Z', '#ffab3d') + C(10, -76, 1.8, INK) + S('M-30 -20 Q-10 -30 20 -22', '#e6e0ee', 2) + P(heartD(-12, -32, 10), '#ff9ec7')),
];

const HOTEL: FurnDef[] = [
  ...RECEPTIONS, ...LUGGAGECARTS, ...SUITCASE, ...HOTELBEDS, ...BELLSTANDS, ...LOBBYSOFAS, ...REVOLVING, ...HCHANDELIERS, ...KEYRACKS, ...PLANTWALLS,
  ...ROOMSERVICE, ...LOUNGERS, ...DNDSIGNS, ...LOBBYFOUNTAINS, ...ELEVATORS, ...HOTEL_PROPS,
];

export const LEISURE_MORE: FurnDef[] = [...LIBRARY, ...CINEMA, ...HOTEL];

// =====================================================================================
// TOWN FRONTS (base centre at 0,0, drawn upward) — helpers copied from the town map's style
// =====================================================================================
const shadeX = (x: number, y: number, w: number, h: number, r = 0) => R(x, y, w, h, r, 'url(#g-shadeX)');
function winBox(x: number, y: number, w: number, h: number, curtain: string, lit = false, under = ''): string {
  let s = R(x - 6, y - 6, w + 12, h + 12, 8, '#ffffff') + R(x, y, w, h, 5, lit ? '#fff1b8' : '#bfe3ff') + R(x, y, w, h, 5, 'url(#g-glass)');
  s += P(`M${f(x)} ${f(y)} L${f(x + w * 0.3)} ${f(y)} Q${f(x + w * 0.22)} ${f(y + h * 0.5)} ${f(x)} ${f(y + h * 0.72)}Z`, curtain) + P(`M${f(x + w)} ${f(y)} L${f(x + w * 0.7)} ${f(y)} Q${f(x + w * 0.78)} ${f(y + h * 0.5)} ${f(x + w)} ${f(y + h * 0.72)}Z`, curtain);
  s += R(x + w / 2 - 2, y, 4, h, 1, '#ffffff', 'opacity="0.9"');
  if (under) s += R(x - 10, y + h + 4, w + 20, 14, 5, '#a86b4a') + under;
  return s;
}
/** Flowers in spring and summer, autumn leaves in fall, a strip of snow in winter. */
function flowerRow(x: number, y: number, w: number, s: Season): string {
  if (s === 'winter') return R(x - 10, y - 4, w + 20, 8, 4, '#fff');
  const cols = s === 'fall' ? ['#ff8a3d', '#ffc23d', '#e8573d'] : ['#ff7eb6', '#ffd36b', '#ffffff', '#c99bff'];
  let g = '';
  const n = Math.max(2, Math.round(w / 16));
  for (let i = 0; i < n; i++) g += flowerG(x + (w * (i + 0.5)) / n, y - 4, 7, cols[i % cols.length]);
  return g;
}
const snowOn = (d: string, s: Season) => (s === 'winter' ? P(d, '#ffffff') + P(d, 'url(#g-shadeY)', 'opacity="0.4"') : '');
const bushG = (x: number, y: number, s: number, c: string) => `<g ${at(x, y, s)}>${C(-26, -20, 26, dark(c, 0.06))}${C(22, -18, 24, dark(c, 0.06))}${C(0, -32, 30, c)}${C(-8, -42, 10, '#fff', 'opacity="0.18"')}</g>`;
const bushCol = (s: Season) => (s === 'winter' ? '#e8f0fa' : s === 'fall' ? '#d98a3d' : '#5fc47c');
function streetLamp(x: number, y: number): string {
  return R(x - 4, y - 170, 8, 170, 4, '#4a4a5e') + E(x, y, 16, 5, '#4a4a5e') + E(x, y - 178, 46, 46, 'url(#g-glow)') + P(`M${x - 16} ${y - 168} L${x + 16} ${y - 168} L${x + 11} ${y - 196} L${x - 11} ${y - 196}Z`, '#fff6c8') + P(`M${x - 20} ${y - 196} L${x + 20} ${y - 196} L${x} ${y - 210}Z`, '#4a4a5e');
}
const pumpkin = (x: number, y: number, s = 1) => `<g ${at(x, y, s)}>${E(-9, -14, 11, 14, '#ff8a3d')}${E(9, -14, 11, 14, '#ff8a3d')}${E(0, -14, 12, 15, '#ffab3d')}${R(-2, -34, 4, 8, 2, '#5f8f3a')}${E(6, -32, 6, 3, '#6fc47c')}</g>`;
const leavesOnGround = (x1: number, x2: number, y: number) => {
  let g = '';
  for (let i = 0; i < 8; i++) {
    const x = x1 + ((x2 - x1) * ((i * 37) % 100)) / 100;
    g += E(x, y + (i % 3) * 3, 7, 3.5, ['#e8573d', '#ffab3d', '#ffc23d'][i % 3], `transform="rotate(${(i * 47) % 90 - 45} ${f(x)} ${f(y)})"`);
  }
  return g;
};
/** Something seasonal by the front steps. */
const seasonal = (x: number, s: Season) => s === 'fall' ? pumpkin(x, 0, 1.2) + pumpkin(x + 26, 2, 0.8)
  : s === 'winter' ? `<g ${at(x, 0, 0.32)}>${C(0, -60, 62, '#fff')}${C(0, -160, 46, '#fff')}${C(-12, -168, 5, INK)}${C(12, -168, 5, INK)}${P('M0 -158 L30 -152 L0 -148Z', '#ff8a3d')}${R(-44, -130, 88, 16, 8, '#e8384f')}</g>`
    : R(x - 18, -40, 36, 40, 8, '#a86b4a') + flowerRow(x - 16, -40, 32, s);

function libraryFront(s: Season): string {
  const wall = '#f6ead8';
  const col = '#fffaf2';
  const roof = '#6f86d6';
  let g = E(0, 4, 260, 18, 'url(#g-ground)');
  g += R(-210, -336, 420, 296, 8, wall) + shadeX(-210, -336, 420, 296, 8);
  // tall arched windows with flower boxes
  for (const x of [-145, 145]) {
    g += P(`M${x - 32} -120 V-250 A32 32 0 0 1 ${x + 32} -250 V-120Z`, '#ffffff') + P(`M${x - 26} -126 V-248 A26 26 0 0 1 ${x + 26} -248 V-126Z`, '#fff1b8') + P(`M${x - 26} -126 V-248 A26 26 0 0 1 ${x + 26} -248 V-126Z`, 'url(#g-glass)');
    g += Ln(x, -272, x, -126, '#fff', 3) + Ln(x - 26, -200, x + 26, -200, '#fff', 3) + books(x - 22, x + 22, -128, 26, x > 0 ? 2 : 5);
    g += R(x - 40, -118, 80, 14, 5, '#a86b4a') + flowerRow(x - 34, -118, 68, s);
  }
  for (const x of [-190, -100, 100, 190]) g += R(x - 14, -330, 28, 290, 6, col) + R(x - 14, -330, 8, 290, 4, '#ffffff', 'opacity="0.7"') + R(x - 20, -340, 40, 14, 5, '#e6d8c6') + R(x - 20, -54, 40, 14, 5, '#e6d8c6');
  // big door
  g += P('M-56 -42 V-180 A56 56 0 0 1 56 -180 V-42Z', '#8a5a3c') + P('M-48 -42 V-178 A48 48 0 0 1 48 -178 V-42Z', '#a86b4a') + Ln(0, -226, 0, -42, '#8a5a3c', 4) + C(-10, -110, 4, '#ffd24a') + C(10, -110, 4, '#ffd24a');
  g += P('M-30 -186 A30 30 0 0 1 30 -186Z', '#fff1b8') + Ln(0, -216, 0, -186, '#a86b4a', 2) + Ln(-21, -207, 0, -186, '#a86b4a', 2) + Ln(21, -207, 0, -186, '#a86b4a', 2);
  // steps
  g += R(-120, -42, 240, 14, 4, '#f2e6d8') + R(-140, -28, 280, 14, 4, '#e9dccb') + R(-160, -14, 320, 14, 4, '#e0d0bc');
  g += snowOn('M-120 -42 H120 V-38 H-120Z M-140 -28 H140 V-24 H-140Z M-160 -14 H160 V-10 H-160Z', s);
  // frieze and pediment
  g += R(-226, -362, 452, 30, 6, col) + R(-226, -340, 452, 6, 2, '#e6d8c6') + T(0, -340, 'LIBRARY', 26, roof, 'letter-spacing="6"');
  g += P('M-236 -360 L0 -440 L236 -360Z', roof) + P('M-200 -366 L0 -428 L200 -366Z', light(roof, 0.25)) + P('M-236 -360 L0 -440 L0 -360Z', '#fff', 'opacity="0.1"');
  g += C(0, -392, 22, '#fff') + C(0, -392, 17, '#fff1b8') + C(0, -392, 17, 'url(#g-glass)') + P(starD(0, -392, 9), '#ffd24a');
  g += snowOn('M-240 -358 L0 -444 L240 -358 L214 -356 Q160 -372 110 -358 Q60 -376 0 -362 Q-60 -376 -110 -358 Q-160 -372 -214 -356Z', s);
  // the big book sign on top
  g += R(-4, -460, 8, 30, 3, '#8a5a3c');
  g += P('M-84 -440 Q-42 -458 0 -446 Q42 -458 84 -440 L84 -486 Q42 -504 0 -492 Q-42 -504 -84 -486Z', '#e85d5d');
  g += P('M-76 -446 Q-40 -462 -2 -452 V-494 Q-40 -504 -76 -490Z', '#fffaf0') + P('M76 -446 Q40 -462 2 -452 V-494 Q40 -504 76 -490Z', '#fffaf0');
  for (let i = 0; i < 3; i++) g += S(`M-64 ${-480 + i * 10} Q-36 ${-490 + i * 10} -12 ${-482 + i * 10}`, '#c9cfdd', 2.5) + S(`M12 ${-482 + i * 10} Q36 ${-490 + i * 10} 64 ${-480 + i * 10}`, '#c9cfdd', 2.5);
  g += R(-3, -500, 6, 30, 2, '#ff4f8b') + snowOn('M-84 -486 Q-42 -504 0 -492 Q42 -504 84 -486 Q42 -496 0 -486 Q-42 -496 -84 -486Z', s);
  // sparkle, lamps, bushes and the season's touch
  g += twinkle(110, -470, 9, '#ffe680') + twinkle(-120, -456, 7, '#ffe680', 1.6, 0.6) + owl(-176, -372, 1.1, '#c98a5a');
  if (s === 'winter') g += C(0, -120, 18, 'none', 'stroke="#2f7a5a" stroke-width="8"') + `<g ${at(0, -104, 0.36)}>${bowG(0, 0, 1, '#e8384f')}</g>`;
  g += streetLamp(-232, 0) + bushG(-205, 2, 0.6, bushCol(s)) + bushG(205, 2, 0.6, bushCol(s)) + seasonal(-150, s) + seasonal(130, s);
  if (s === 'fall') g += leavesOnGround(-220, 220, 6);
  return g;
}

function cinemaFront(s: Season): string {
  const wall = '#4b4fa8';
  const gold = '#ffd24a';
  let g = E(0, 4, 270, 20, 'url(#g-ground)');
  // stepped art-deco top with a star
  g += R(-110, -474, 220, 60, 6, wall) + R(-56, -508, 112, 40, 6, wall) + shadeX(-110, -474, 220, 60, 6) + P(starD(0, -510, 18), gold) + twinkle(-30, -530, 8, '#fff') + twinkle(36, -520, 6, '#fff', 1.6, 0.5);
  g += snowOn('M-112 -476 H112 V-470 Q0 -462 -112 -470Z M-58 -510 H58 V-504 Q0 -498 -58 -504Z', s);
  g += R(-220, -424, 440, 424, 8, wall) + shadeX(-220, -424, 440, 424, 8) + R(-232, -432, 464, 16, 6, gold) + snowOn('M-234 -432 H234 V-424 Q0 -414 -234 -424Z', s);
  for (const x of [-200, 200]) g += R(x - 10, -416, 20, 416, 4, light(wall, 0.15));
  // the CINEMA sign in lights
  g += R(-170, -404, 340, 76, 16, '#2d2a3a') + T(0, -348, 'CINEMA', 54, '#fff6c8', 'style="filter:drop-shadow(0 0 6px #ffd36b)"');
  g += bulbs(-160, -410, 160, -410, 15) + bulbs(-160, -322, 160, -322, 15);
  // the marquee with chasing lights
  g += P('M-206 -306 H206 L186 -226 H-186Z', '#ffffff') + P('M-206 -306 H206 L186 -226 H-186Z', 'url(#g-shadeY)', 'opacity="0.4"');
  g += T(0, -276, 'NOW SHOWING', 26, '#e8384f') + T(0, -244, 'PONY PARTY', 20, '#4b4fa8');
  g += bulbs(-200, -310, 200, -310, 21, true, 5) + bulbs(-182, -222, 182, -222, 19, true, 5);
  g += snowOn('M-210 -312 H210 V-304 Q100 -296 0 -304 Q-100 -296 -210 -304Z', s);
  // posters beside the doors
  for (const x of [-160, 160]) {
    g += R(x - 34, -206, 68, 100, 6, gold) + R(x - 28, -200, 56, 88, 4, x < 0 ? '#bfe8ff' : '#24224a');
    if (x < 0) g += RB.map((cl, i) => S(`M${x - 22 + i * 4} -126 A${22 - i * 4} ${22 - i * 4} 0 0 1 ${x + 22 - i * 4} -126`, cl, 4)).join('') + E(x, -150, 12, 8, '#fff') + E(x + 10, -162, 7, 5, '#fff') + P(`M${x + 10} -168 L${x + 13} -180 L${x + 13} -167Z`, gold);
    else g += C(x, -160, 14, '#ff9ec7') + E(x, -160, 22, 5, 'none', `stroke="${gold}" stroke-width="2.5"`) + P(sparkleD(x - 18, -186, 5), '#fff') + P(sparkleD(x + 16, -130, 4), '#fff');
    g += bulbs(x - 30, -212, x + 30, -212, 5, true, 3);
  }
  // glass doors, ticket window and red carpet
  g += R(-100, -206, 200, 206, 8, gold) + R(-92, -198, 184, 198, 4, '#3d3a52');
  for (const x of [-88, -28, 32]) g += R(x, -194, 56, 194, 3, '#cfe9ff', 'opacity="0.85"') + R(x, -194, 56, 194, 3, 'url(#g-glass)') + R(x + (x < 0 ? 44 : 6), -110, 6, 30, 3, gold);
  g += P('M-80 0 L80 0 L104 30 L-104 30Z', '#e03a62') + P('M-80 0 L80 0 L84 6 L-84 6Z', '#c2244a');
  for (const x of [-120, 120]) g += R(x - 4, -6, 8, 40, 3, gold) + C(x, -10, 7, gold);
  // a giant popcorn bucket on the roof
  g += `<g ${at(176, -432, 1)}>${P('M-30 -70 L30 -70 L22 0 L-22 0Z', '#fff')}${[0, 1, 2, 3].map((i) => P(`M${-30 + i * 15 + 4} -70 L${-30 + i * 15 + 11} -70 L${-22 + i * 11 + 8} 0 L${-22 + i * 11 + 3} 0Z`, '#e8384f')).join('')}${puff(-18, -72, 10)}${puff(2, -82, 12)}${puff(20, -72, 10)}${puff(-6, -94, 9)}${s === 'winter' ? E(0, -96, 30, 8, '#fff') : ''}</g>`;
  g += bushG(-238, 2, 0.6, bushCol(s)) + bushG(238, 2, 0.6, bushCol(s)) + seasonal(-178, s) + seasonal(170, s);
  if (s === 'fall') g += leavesOnGround(-230, 230, 6);
  return g;
}

function hotelFront(s: Season): string {
  const wall = '#ffe1c8';
  const trim = '#3f6fc8';
  const gold = '#ffd24a';
  let g = E(0, 4, 250, 18, 'url(#g-ground)');
  g += R(-180, -536, 360, 536, 8, wall) + shadeX(-180, -536, 360, 536, 8);
  for (let y = -500; y < -200; y += 74) g += R(-180, y + 62, 360, 4, 0, dark(wall, 0.06));
  // rooftop sign
  g += R(-120, -560, 6, 30, 2, '#4a4a5e') + R(114, -560, 6, 30, 2, '#4a4a5e') + R(-140, -604, 280, 50, 12, trim) + T(0, -566, 'HOTEL', 38, '#fff6c8', 'letter-spacing="6" style="filter:drop-shadow(0 0 5px #ffd36b)"');
  g += bulbs(-130, -604, 130, -604, 11, true, 4) + P(starD(-150, -580, 10), gold) + P(starD(150, -580, 10), gold);
  g += snowOn('M-142 -606 H142 V-600 Q0 -592 -142 -600Z', s);
  g += R(-196, -548, 392, 22, 6, trim) + snowOn('M-198 -550 H198 V-540 Q100 -530 0 -540 Q-100 -530 -198 -540Z', s);
  // floors of windows: some lit, some with flower boxes
  const curt = ['#ff9ec7', '#ffd36b', '#9fd6ff', '#c99bff'];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
    const x = -150 + i * 80;
    const y = -506 + r * 74;
    const lit = (r * 4 + i) % 3 !== 1;
    const box = (r + i) % 2 === 0;
    g += winBox(x + 6, y, 48, 46, curt[(r + i) % 4], lit, box ? flowerRow(x + 6, y + 56, 48, s) : '');
  }
  // ground floor: awning, revolving door and lobby windows
  for (const x of [-160, 90]) g += R(x, -186, 70, 120, 6, '#fff') + R(x + 6, -180, 58, 108, 4, '#fff1b8') + glow(x + 35, -150, 50) + R(x + 6, -180, 58, 108, 4, 'url(#g-glass)') + R(x + 30, -180, 10, 6, 2, gold) + C(x + 35, -166, 8, gold, 'opacity="0.8"');
  for (const x of [-160, 90]) g += R(x - 6, -66, 82, 12, 5, '#a86b4a') + flowerRow(x, -66, 70, s);
  g += R(-62, -168, 124, 168, 8, gold) + R(-54, -160, 108, 160, 4, '#3d3a52') + G(revolver(true, gold, '#fff'), 'transform="translate(0 -84) scale(0.5 0.47)"') + E(0, -166, 64, 10, gold);
  if (s === 'winter') g += C(-80, -110, 14, 'none', 'stroke="#2f7a5a" stroke-width="7"') + `<g ${at(-80, -98, 0.3)}>${bowG(0, 0, 1, '#e8384f')}</g>`;
  let aw = 'M-110 -226 L110 -226 L120 -180';
  for (let i = 0; i < 8; i++) aw += ` Q${f(120 - 30 * (i + 0.5))} -160 ${f(120 - 30 * (i + 1))} -180`;
  g += P(aw + 'Z', '#e8384f');
  for (let i = 0; i < 8; i += 2) g += P(`M${f(-110 + i * 27.5)} -226 L${f(-82.5 + i * 27.5)} -226 L${f(-90 + i * 30)} -180 Q${f(-105 + i * 30)} -160 ${f(-120 + i * 30)} -180Z`, '#fff');
  g += R(-60, -248, 120, 24, 8, trim) + T(0, -230, 'WELCOME', 16, '#fff');
  g += snowOn('M-112 -228 L112 -228 L116 -214 Q0 -206 -116 -214Z', s);
  g += R(-60, -4, 120, 10, 4, '#e03a62');
  // topiaries, a luggage stack and the season's touch
  for (const x of [-205, 205]) g += R(x - 16, -40, 32, 40, 6, gold) + R(x - 3, -70, 6, 30, 2, '#8a5a3c') + C(x, -92, 26, bushCol(s)) + (s === 'winter' ? E(x, -112, 20, 8, '#fff') : '') + C(x - 8, -100, 7, '#fff', 'opacity="0.2"');
  g += box(112, -36, 40, 32, 6, '#ff7eb6') + box(118, -60, 30, 24, 5, '#7cc8ff') + seasonal(-130, s);
  if (s === 'fall') g += leavesOnGround(-220, 220, 6);
  return g;
}

/** Town-map building fronts: base centre at (0,0), drawn upward; h is the height for the name tag. */
export const LEISURE_FACADES: Record<string, { h: number; art: (s: Season) => string }> = {
  library: { h: 505, art: libraryFront },
  cinema: { h: 540, art: cinemaFront },
  hotel: { h: 610, art: hotelFront },
};
