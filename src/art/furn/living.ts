// The living-room catalog: sofas, chairs, tables, fireplaces, shelves and pets' corners, plus
// electronics (TVs, games, music) and lighting (lamps, chandeliers, neon). Every type comes in several
// design collections from FURN_STYLES, and each collection changes the shape, not only the colors.
import {
  type FurnCat, type FurnDef, type Mount, type SeatDef, C, E, Ln, P, R, box, cloth, dark, f, flame, glow, heartD, light, motif, starD, sparkleD,
  flowerG, bowG, FURN_STYLE_BY_ID, stylePrice,
} from './kit';

type Draw = (c: string, on: boolean) => string;
const ST = FURN_STYLE_BY_ID;
const INK = '#2d2a3a';
const GOLD = 'url(#g-gold)';
const RB = ['#ff7eb6', '#ffab5e', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff'];
const BOOKC = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b', '#e85d5d', '#a8e6cf'];
const FONT = 'font-family="Fredoka, sans-serif" font-weight="700"';

// ---------------- small drawing helpers ----------------
const S = (d: string, c: string, w = 3, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (inner: string, attr = '') => `<g ${attr}>${inner}</g>`;
/** Draws a part on both sides: fn(1) for the right, fn(-1) for the mirrored left. */
const sym = (fn: (k: number) => string) => fn(1) + fn(-1);
const ease = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
const spin = (cx: number, cy: number, dur: number) =>
  `<animateTransform attributeName="transform" type="rotate" values="0 ${f(cx)} ${f(cy)};360 ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/>`;
const sway = (deg: number, cx: number, cy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="rotate" values="${-deg} ${f(cx)} ${f(cy)};${deg} ${f(cx)} ${f(cy)};${-deg} ${f(cx)} ${f(cy)}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${ease}/>`;
const bob = (dx: number, dy: number, dur: number, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;${f(dx)} ${f(dy)};0 0" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${ease}/>`;
const pulse = (a: number, b: number, dur: number, begin = 0) =>
  `<animate attributeName="opacity" values="${a};${b};${a}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/>`;
/** A tufting button. */
const btn = (x: number, y: number, c: string, r = 3.2) => C(x, y, r, dark(c, 0.25)) + C(x - r * 0.3, y - r * 0.35, r * 0.4, '#fff', 'opacity="0.55"');
/** A soft highlight streak. */
const hi = (x: number, y: number, w: number, h: number, o = 0.4) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', `opacity="${o}"`);
const glass = (x: number, y: number, w: number, h: number, r = 6) => R(x, y, w, h, r, 'url(#g-glass)');
/** A plump cushion: shaded box with a little top highlight. */
const cush = (x: number, y: number, w: number, h: number, c: string, pat = 'none', r = 14) =>
  box(x, y, w, h, r, c, pat, 'y') + hi(x + w * 0.12, y + 5, w * 0.5, 4, 0.35);
/** Basket weave texture for wicker and rattan. */
const weave = (x: number, y: number, w: number, h: number, col: string, gap = 8) => {
  let s = '';
  let k = 0;
  for (let yy = y + gap / 2; yy < y + h - 1; yy += gap, k++) s += Ln(x + 4, yy, x + w - 4, yy, col, gap * 0.42, `stroke-dasharray="7 4" stroke-dashoffset="${k % 2 ? 5.5 : 0}" opacity="0.6"`);
  return s;
};
const fringe = (x1: number, x2: number, y: number, len: number, col: string, step = 6) => {
  let s = '';
  for (let x = x1; x <= x2; x += step) s += Ln(x, y, x, y + len, col, 2);
  return s;
};
/** A row of books standing on a shelf. */
function books(x1: number, x2: number, yBase: number, maxH: number, seed = 0): string {
  let s = '';
  let x = x1;
  let i = seed;
  while (x < x2 - 10) {
    const w = 9 + ((i * 7) % 3) * 3;
    const h = maxH * (0.72 + ((i * 5) % 4) * 0.08);
    if (x + w > x2) break;
    const col = BOOKC[i % BOOKC.length];
    s += R(x, yBase - h, w, h, 2, col) + R(x + 2, yBase - h + 5, w - 4, 2.5, 1, '#fff', 'opacity="0.55"') + R(x + 2, yBase - 9, w - 4, 2, 1, '#fff', 'opacity="0.35"');
    x += w + 1.5;
    i++;
  }
  return s;
}
/** A keyboard: white keys with black keys on top. */
function keys(x: number, y: number, w: number, h: number, n: number, black = '#2d2a3a', whites?: string[]): string {
  const kw = w / n;
  let s = R(x, y, w, h, 3, '#fff');
  for (let i = 0; i < n; i++) {
    if (whites) s += R(x + i * kw + 0.8, y, kw - 1.6, h, 2, whites[i % whites.length]);
    if (i) s += Ln(x + i * kw, y, x + i * kw, y + h, '#c9cfdd', 1);
  }
  for (let i = 0; i < n - 1; i++) if (i % 7 !== 2 && i % 7 !== 6) s += R(x + (i + 1) * kw - kw * 0.3, y, kw * 0.6, h * 0.6, 1.5, black);
  return s;
}
const noteG = (x: number, y: number, col: string) => S(`M${f(x)} ${f(y)} V${f(y - 20)} L${f(x + 12)} ${f(y - 24)} V${f(y - 4)}`, col, 3) + E(x - 3, y, 5, 4, col) + E(x + 9, y - 4, 5, 4, col);
/** Music notes that float up while something plays. */
const notes = (x: number, y: number, cols = ['#9b6bff', '#ff4f8b', '#4f9dff']) => cols.map((col, i) =>
  `<g opacity="0"><animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/>` +
  `<animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 14 : -14} -46" dur="2.4s" begin="${f(i * 0.8)}s" repeatCount="indefinite"/>${noteG(x + (i - 1) * 24, y, col)}</g>`).join('');
/** A soft colored halo (the shared glow gradient is always yellow). */
const cglow = (x: number, y: number, r: number, col: string, o = 1) =>
  E(x, y, r, r, col, `opacity="${f(0.12 * o)}"`) + E(x, y, r * 0.66, r * 0.66, col, `opacity="${f(0.16 * o)}"`) + E(x, y, r * 0.38, r * 0.38, col, `opacity="${f(0.2 * o)}"`);
/** A flame in any colors. */
const cflame = (x: number, y: number, s: number, outer: string, inner: string, dur = 0.5) =>
  `<g transform="translate(${f(x)} ${f(y)})"><g><animateTransform attributeName="transform" type="scale" values="1 1;1.06 0.92;0.96 1.08;1 1" dur="${dur}s" repeatCount="indefinite"/>` +
  P(`M0 ${f(-26 * s)} C${f(12 * s)} ${f(-12 * s)} ${f(10 * s)} 0 0 0 C${f(-10 * s)} 0 ${f(-12 * s)} ${f(-12 * s)} 0 ${f(-26 * s)}Z`, outer) +
  P(`M0 ${f(-16 * s)} C${f(6 * s)} ${f(-8 * s)} ${f(6 * s)} 0 0 0 C${f(-6 * s)} 0 ${f(-6 * s)} ${f(-8 * s)} 0 ${f(-16 * s)}Z`, inner) + '</g></g>';
/** Logs and flames for a firebox whose floor is at y. */
const fire = (on: boolean, x: number, y: number, s = 1) =>
  R(x - 50 * s, y - 14 * s, 100 * s, 13 * s, 6 * s, '#8a5a3c') + R(x - 44 * s, y - 26 * s, 88 * s, 13 * s, 6 * s, '#a86b4a', `transform="rotate(-6 ${f(x)} ${f(y - 20 * s)})"`) +
  E(x + 44 * s, y - 8 * s, 4 * s, 6 * s, '#e8c49a') +
  (on ? glow(x, y - 40 * s, 90 * s) + flame(x - 26 * s, y - 20 * s, 1.3 * s) + flame(x + 24 * s, y - 20 * s, 1.2 * s) + flame(x, y - 24 * s, 1.75 * s) : '');
/** A light bulb glow that only shows when switched on. */
const lit = (on: boolean, x: number, y: number, r: number) => (on ? glow(x, y, r) : '');
/** Neon tube: bright and glowing when on, pale glass when off. */
const neon = (d: string, col: string, on: boolean, w = 7) => on
  ? `<g>${pulse(1, 0.82, 2.6)}${S(d, col, w * 3.4, 'opacity="0.16"')}${S(d, col, w * 2, 'opacity="0.3"')}${S(d, col, w)}${S(d, '#fff', w * 0.35, 'opacity="0.85"')}</g>`
  : S(d, light(col, 0.55), w, 'opacity="0.95"') + S(d, '#ffffff', w * 0.3, 'opacity="0.6"');
const neonText = (t: string, x: number, y: number, size: number, col: string, on: boolean) => {
  const tx = (stroke: string, w: number, extra = '') => `<text x="${x}" y="${y}" ${FONT} font-size="${size}" text-anchor="middle" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra}>${t}</text>`;
  return on ? `<g>${pulse(1, 0.8, 2.2)}${tx(col, 14, 'opacity="0.18"')}${tx(col, 8, 'opacity="0.35"')}${tx(col, 4)}${tx('#fff', 1.4, 'opacity="0.9"')}</g>`
    : tx(light(col, 0.55), 4) + tx('#fff', 1.2, 'opacity="0.6"');
};
/** The wall plate a hanging lamp hangs from. */
const canopy = (y: number, col = '#4a4a5e') => R(-18, y, 36, 8, 4, col);
/** A cat napping, with a swishing tail. */
const kitty = (x: number, y: number, col = '#ffab5e') =>
  G(`<g>${sway(14, x - 26, y - 6, 2.4)}${S(`M${x - 24} ${y - 6} Q${x - 46} ${y - 8} ${x - 44} ${y - 28}`, col, 7)}</g>` +
    E(x, y - 14, 30, 16, col) + C(x + 24, y - 22, 14, col) + P(`M${x + 14} ${y - 32} L${x + 16} ${y - 46} L${x + 26} ${y - 34}Z`, col) + P(`M${x + 26} ${y - 34} L${x + 34} ${y - 46} L${x + 38} ${y - 30}Z`, col) +
    P(`M${x + 17} ${y - 35} L${x + 18} ${y - 42} L${x + 23} ${y - 35}Z`, '#ff9ec7') + S(`M${x + 17} ${y - 22} q3 3 6 0 M${x + 27} ${y - 22} q3 3 6 0`, INK, 1.6) +
    E(x + 24, y - 15, 2, 1.4, '#ff7eb6') + S(`M${x - 12} ${y - 24} q4 -4 8 0 M${x - 2} ${y - 26} q4 -4 8 0`, dark(col, 0.2), 2) +
    `<g opacity="0"><animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/><text x="${x + 40}" y="${y - 44}" ${FONT} font-size="14" fill="#9b6bff">z</text></g>`);
/** Wraps a whole piece in a gentle rock while someone sits in it. */
const rockG = (on: boolean, inner: string, amp = 4, dur = 2.4) => on ? G(sway(amp, 0, -4, dur) + inner) : G(inner);

// ---------------- animated screens ----------------
/** A picture for screens, drawn in a 160x100 box and scaled to fill the screen. */
function scene(kind: string): string {
  const fish = (y: number, col: string, dur: number, dir: number, begin = 0) =>
    `<g><animateTransform attributeName="transform" type="translate" values="${dir > 0 ? '-30 0;190 0' : '190 0;-30 0'}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>` +
    `<g transform="translate(0 ${y}) scale(${dir} 1)">${E(0, 0, 9, 6, col)}${P('M-8 0 L-16 -6 L-16 6Z', col)}${C(4, -2, 1.5, INK)}</g></g>`;
  const twinkle = (pts: number[][], col = '#fff') => pts.map(([x, y, r], i) => `<g>${pulse(1, 0.2, 1.4 + (i % 3) * 0.5, i * 0.3)}${P(sparkleD(x, y, r), col)}</g>`).join('');
  switch (kind) {
    case 'ocean':
      return R(0, 0, 160, 100, 0, '#4fb6e8') + R(0, 0, 160, 34, 0, '#7cc8ff', 'opacity="0.6"') + P('M0 88 Q40 80 80 88 Q120 96 160 84 V100 H0Z', '#f4dca0') +
        S('M24 90 Q18 76 26 64 Q32 54 26 44', '#3fbf8f', 4) + S('M136 88 Q142 74 134 62', '#5fae6b', 4) + C(100, 86, 6, '#ff7eb6') + C(108, 88, 4, '#ff9ec7') +
        fish(36, '#ffab5e', 7, 1) + fish(60, '#ff7eb6', 9, -1, 1) + fish(48, '#ffd36b', 6, 1, 2) +
        [30, 90, 130].map((x, i) => `<circle cx="${x}" cy="90" r="3" fill="#fff" opacity="0.7"><animate attributeName="cy" values="90;0" dur="${2 + i * 0.6}s" repeatCount="indefinite"/></circle>`).join('');
    case 'space':
      return R(0, 0, 160, 100, 0, '#2a2850') + twinkle([[20, 20, 4], [60, 12, 3], [100, 30, 3], [140, 14, 4], [30, 70, 3], [80, 84, 4], [150, 70, 3]]) +
        C(124, 66, 16, '#c99bff') + E(124, 66, 26, 6, 'none', 'stroke="#ffd24a" stroke-width="3" transform="rotate(-16 124 66)"') + C(40, 36, 8, '#ffe680') +
        `<g><animateTransform attributeName="transform" type="translate" values="-20 90;180 10" dur="5s" repeatCount="indefinite"/><g transform="rotate(60)">` +
        P('M0 -14 C6 -8 6 4 4 10 L-4 10 C-6 4 -6 -8 0 -14Z', '#fff') + C(0, -3, 3, '#7cc8ff') + P('M-4 6 L-9 12 L-4 10Z M4 6 L9 12 L4 10Z', '#ff4f6d') + `<g>${flicker()}${P('M-3 11 L0 20 L3 11Z', '#ffab3d')}</g></g></g>`;
    case 'game':
      return R(0, 0, 160, 100, 0, '#7cc8ff') + C(30, 22, 9, '#fff') + C(42, 20, 11, '#fff') + C(54, 24, 8, '#fff') +
        Array.from({ length: 10 }, (_, i) => R(i * 16, 80, 16, 20, 0, '#c98a5a') + R(i * 16, 80, 16, 5, 0, '#6fc47c') + R(i * 16 + 1, 85, 14, 14, 0, 'none', 'stroke="#a86b4a" stroke-width="1"')).join('') +
        R(84, 38, 16, 16, 2, '#ffd36b') + `<text x="92" y="51" font-size="12" ${FONT} text-anchor="middle" fill="#c98a3e">?</text>` +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -26;0 0" dur="1.2s" repeatCount="indefinite" ${ease}/>${R(84, 64, 16, 16, 3, '#ff4f6d')}${R(86, 66, 12, 5, 2, '#ffd9b8')}${C(89, 72, 1.5, INK)}${C(95, 72, 1.5, INK)}</g>` +
        `<g>${pulse(1, 0.3, 0.8)}${C(124, 40, 6, '#ffd24a')}${C(124, 40, 3, '#fff3b0')}</g>` +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;-40 0;0 0" dur="3s" repeatCount="indefinite"/>${P('M128 80 Q128 68 138 68 Q148 68 148 80Z', '#9b6bff')}${C(134, 74, 1.5, '#fff')}${C(142, 74, 1.5, '#fff')}</g>`;
    case 'music':
      return R(0, 0, 160, 100, 0, '#3d2a5e') + Array.from({ length: 8 }, (_, i) => {
        const x = 12 + i * 18;
        const v = [[20, 64, 34], [50, 24, 70], [36, 72, 18], [64, 30, 48], [28, 58, 22], [70, 40, 60], [44, 16, 54], [24, 60, 36]][i];
        return `<rect x="${x}" width="12" rx="3" fill="${RB[i % 6]}" y="${86 - v[0]}" height="${v[0]}"><animate attributeName="height" values="${v.join(';')};${v[0]}" dur="1.1s" repeatCount="indefinite"/><animate attributeName="y" values="${v.map((h) => 86 - h).join(';')};${86 - v[0]}" dur="1.1s" repeatCount="indefinite"/></rect>`;
      }).join('') + R(0, 88, 160, 12, 0, '#2a1d40');
    case 'rainbow':
      return R(0, 0, 160, 100, 0, '#e9f6ff') + RB.map((col, i) => S(`M${16 + i * 9} 96 A${64 - i * 9} ${64 - i * 9} 0 0 1 ${144 - i * 9} 96`, col, 9)).join('') +
        `<g>${bob(0, -5, 2)}${C(20, 88, 12, '#fff')}${C(34, 92, 10, '#fff')}${C(140, 88, 12, '#fff')}${C(126, 92, 10, '#fff')}</g>` + twinkle([[30, 20, 5], [130, 24, 6], [80, 14, 4]], '#ffd24a');
    case 'castle':
      return R(0, 0, 160, 100, 0, '#c99bff') + R(0, 50, 160, 50, 0, '#ffb3c7', 'opacity="0.7"') +
        P('M50 100 V54 H58 V46 H66 V54 H74 V36 L80 24 L86 36 V54 H94 V46 H102 V54 H110 V100Z', '#fff7fb') + R(76, 70, 8, 30, 4, '#ff7eb6') + P('M74 36 L80 20 L86 36Z', '#ff7eb6') +
        [[30, 26, '#ffd24a', 0], [126, 20, '#7cc8ff', 0.7], [104, 34, '#ff7eb6', 1.3]].map(([x, y, col, b]) =>
          `<g transform="translate(${x} ${y})"><g><animateTransform attributeName="transform" type="scale" values="0.2;1.2;0.2" dur="2s" begin="${b}s" repeatCount="indefinite"/>${pulse(0, 1, 2, b as number)}${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="0" x2="${f(Math.cos(i * 0.785) * 12)}" y2="${f(Math.sin(i * 0.785) * 12)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g></g>`).join('');
    case 'karaoke':
      return R(0, 0, 160, 100, 0, '#5a3a8a') + twinkle([[20, 18, 5], [140, 20, 5], [80, 10, 3]], '#ffe680') +
        `<text x="80" y="58" ${FONT} font-size="20" text-anchor="middle" fill="#fff">La la la!</text>` +
        `<rect x="34" y="64" width="0" height="5" rx="2.5" fill="#ff7eb6"><animate attributeName="width" values="0;92" dur="2.5s" repeatCount="indefinite"/></rect>` +
        `<g><animateTransform attributeName="transform" type="translate" values="40 0;60 -10;80 0;100 -10;120 0" dur="2.5s" repeatCount="indefinite"/>${C(0, 36, 4, '#ffd24a')}</g>` + noteG(24, 88, '#7cc8ff') + noteG(130, 86, '#ffd36b');
    case 'desktop':
      return R(0, 0, 160, 100, 0, '#bfe8ff') + R(0, 88, 160, 12, 0, '#9b6bff') + C(8, 94, 4, '#fff') +
        [[14, 14, '#ffd36b'], [14, 38, '#ff7eb6'], [14, 62, '#7fe0b0']].map(([x, y, col]) => R(x as number, y as number, 16, 14, 3, col as string)).join('') +
        R(46, 12, 100, 68, 5, '#fff') + R(46, 12, 100, 12, 5, '#ff9ec7') + C(138, 18, 2.5, '#fff') + P(heartD(96, 34, 30), '#ff7eb6') + C(70, 64, 6, '#7cc8ff') + C(124, 62, 6, '#ffd36b') +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;30 -20;10 10;0 0" dur="4s" repeatCount="indefinite"/>${P('M110 50 L110 64 L114 60 L118 67 L121 65 L117 58 L122 58Z', '#2d2a3a', 'stroke="#fff" stroke-width="1"')}</g>`;
    default:
      return R(0, 0, 160, 100, 0, '#9fd6ff') + C(132, 22, 11, '#ffd84a') +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;-30 0;0 0" dur="8s" repeatCount="indefinite"/>${C(60, 22, 9, '#fff')}${C(72, 18, 11, '#fff')}${C(84, 23, 8, '#fff')}</g>` +
        P('M0 70 Q40 52 80 68 Q120 52 160 66 V100 H0Z', '#7fe0b0') + P('M0 84 Q50 72 100 86 Q130 78 160 84 V100 H0Z', '#5fc47c') +
        flowerG(30, 84, 5, '#ff9ec7') + flowerG(140, 88, 5, '#fff') +
        `<g><animateTransform attributeName="transform" type="translate" values="-20 0;180 0" dur="6s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -14;0 0" dur="0.6s" repeatCount="indefinite"/>` +
        E(0, 74, 9, 8, '#fff') + E(-3, 62, 2.5, 7, '#fff') + E(3, 62, 2.5, 7, '#fff') + E(-3, 62, 1, 4, '#ff9ec7') + E(3, 62, 1, 4, '#ff9ec7') + C(3, 72, 1.3, INK) + E(7, 76, 2, 1.4, '#ff9ec7') + '</g></g>';
  }
}
const flicker = () => `<animateTransform attributeName="transform" type="scale" values="1 1;1.1 0.85;0.95 1.1;1 1" dur="0.3s" repeatCount="indefinite"/>`;
/** A screen: a moving picture when on, dark glass when off. */
const screen = (x: number, y: number, w: number, h: number, kind: string, on: boolean, r = 6) => on
  ? R(x, y, w, h, r, '#3d3a52') + `<svg x="${f(x + 1)}" y="${f(y + 1)}" width="${f(w - 2)}" height="${f(h - 2)}" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${scene(kind)}</svg>` + R(x, y, w, h, r, 'url(#g-glass)', 'opacity="0.5"')
  : R(x, y, w, h, r, '#3d3a52') + glass(x, y, w, h, r);

// ---------------- the series builder ----------------
interface Spec extends Partial<FurnDef> { s: string; name: string; w: number; h: number; art: Draw }
function series(type: string, group: string, cat: FurnCat, mount: Mount, specs: Spec[], extra: Partial<FurnDef> = {}): FurnDef[] {
  return specs.map(({ s, ...rest }, i) => ({
    id: `f-${type}-${s}`, cat, mount, group, style: s, price: stylePrice(i), color: ST[s].main, ...extra, ...rest,
  }) as FurnDef);
}
const two = (y: number, dx = 75): SeatDef[] => [{ x: -dx, y, pose: 'sit' }, { x: dx, y, pose: 'sit' }];
const three = (y: number, dx = 105): SeatDef[] => [{ x: -dx, y, pose: 'sit' }, { x: 0, y, pose: 'sit' }, { x: dx, y, pose: 'sit' }];
const one = (y: number, x = 0): SeatDef[] => [{ x, y, pose: 'sit' }];

// ================= LIVING =================
const SOFAS = series('sofa', 'Sofas', 'living', 'floor', [
  {
    s: 'sweet', name: 'Sweetheart Sofa', w: 370, h: 215, seats: two(-100),
    art: (c) => {
      const back = 'M-158 -70 V-130 A50 50 0 0 1 -58 -150 A58 58 0 0 1 58 -150 A50 50 0 0 1 158 -130 V-70Z';
      let s = cloth(back, dark(c, 0.05)) + S(back, light(c, 0.5), 4, 'opacity="0.8"') + btn(-108, -150, c) + btn(0, -170, c) + btn(108, -150, c) + btn(-54, -128, c) + btn(54, -128, c);
      s += cush(-150, -102, 148, 42, light(c, 0.12), 'none', 16) + cush(2, -102, 148, 42, light(c, 0.12), 'none', 16);
      s += C(-92, -124, 22, light(c, 0.5)) + C(-92, -124, 22, 'url(#g-face)') + bowG(-92, -126, 0.42, c);
      s += P(heartD(92, -140, 36), '#fff') + P(heartD(92, -140, 36), 'url(#g-face)') + P(heartD(92, -130, 16), light(c, 0.2));
      s += box(-180, -134, 46, 106, 22, c) + box(134, -134, 46, 106, 22, c) + hi(-172, -128, 26, 5) + hi(142, -128, 26, 5);
      s += box(-172, -64, 344, 34, 12, dark(c, 0.12));
      for (let x = -168; x < 168; x += 28) s += P(`M${x} -32 Q${x + 14} -12 ${x + 28} -32Z`, light(c, 0.55));
      return s + C(-146, -11, 10, GOLD) + C(146, -11, 10, GOLD);
    },
  },
  {
    s: 'princess', name: 'Royal Tufted Sofa', w: 380, h: 250, seats: two(-104),
    art: (c) => {
      const back = 'M-165 -90 V-150 Q-160 -192 -100 -186 Q-40 -180 -20 -204 Q0 -222 20 -204 Q40 -180 100 -186 Q160 -192 165 -150 V-90Z';
      let s = cloth(back, c);
      const rows = [[-170, 0], [-145, 20], [-120, 0]];
      for (const [y, o] of rows) for (let x = -140 + o; x <= 140 - o; x += 40) {
        if (y === -120) continue;
        s += Ln(x, y, x + 20, y + 25, dark(c, 0.18), 1.5) + Ln(x, y, x - 20, y + 25, dark(c, 0.18), 1.5);
      }
      for (const [y, o] of rows) for (let x = -140 + o; x <= 140 - o; x += 40) s += btn(x, y, c);
      s += S(back, GOLD, 6) + motif('crown', 0, -230, 20);
      s += cush(-152, -106, 304, 44, light(c, 0.2), 'hearts', 18);
      s += sym((k) => box(k > 0 ? 142 : -184, -142, 42, 110, 20, c) + C(163 * k, -136, 13, light(c, 0.2)) + S(`M${163 * k} -136 m-6 0 a6 6 0 1 1 6 6 a10 10 0 1 1 -10 -10`, GOLD, 3));
      s += P('M-172 -64 H172 V-44 Q150 -30 120 -40 Q60 -26 0 -38 Q-60 -26 -120 -40 Q-150 -30 -172 -44Z', dark(c, 0.08));
      s += S('M-172 -44 Q-150 -30 -120 -40 Q-60 -26 0 -38 Q60 -26 120 -40 Q150 -30 172 -44', GOLD, 4) + C(0, -48, 8, GOLD) + C(0, -48, 4.5, '#ff7eb6');
      return s + sym((k) => P(`M${150 * k} -40 Q${166 * k} -24 ${150 * k} -8 Q${144 * k} 0 ${156 * k} 0 L${166 * k} 0 Q${172 * k} -6 ${164 * k} -10 Q${180 * k} -28 ${166 * k} -40Z`, GOLD));
    },
  },
  {
    s: 'modern', name: 'Boxy Modern Sofa', w: 380, h: 165, seats: three(-100, 106),
    art: (c) => {
      let s = box(-172, -160, 344, 72, 6, dark(c, 0.08));
      for (const x of [-160, -53, 54]) s += box(x, -154, 106, 60, 8, light(c, 0.06)) + Ln(x + 12, -150, x + 94, -150, '#fff', 2, 'opacity="0.5"');
      for (const x of [-160, -53, 54]) s += cush(x, -102, 106, 40, c, 'none', 6);
      s += box(-150, -140, 48, 40, 10, ST.modern.soft) + S('M-142 -132 L-110 -108 M-110 -132 L-142 -108', '#fff', 2, 'opacity="0.6"');
      s += box(98, -142, 52, 44, 10, '#ffd36b') + P('M104 -100 L124 -132 L144 -100Z', '#fff', 'opacity="0.45"');
      s += box(-190, -130, 32, 96, 6, c) + box(158, -130, 32, 96, 6, c);
      s += P('M-190 -130 H-156 V-62 L-160 -54 L-165 -62 L-170 -54 L-175 -62 L-180 -54 L-185 -62 L-190 -54Z', ST.modern.accent) + Ln(-182, -124, -182, -70, '#fff', 2, 'opacity="0.25"') + Ln(-166, -124, -166, -70, '#fff', 2, 'opacity="0.25"');
      s += box(-190, -64, 380, 24, 4, dark(c, 0.18));
      return s + sym((k) => Ln(168 * k, -42, 176 * k, -2, INK, 6) + Ln(120 * k, -42, 114 * k, -2, INK, 6));
    },
  },
  {
    s: 'cottage', name: 'Flowery Cottage Sofa', w: 370, h: 205, seats: two(-102),
    art: (c) => {
      const wd = ST.cottage.wood;
      const back = 'M-160 -92 V-148 Q-160 -188 -112 -186 Q0 -200 112 -186 Q160 -188 160 -148 V-92Z';
      let s = cloth(back, c, 'flowers') + S(back, light(c, 0.45), 4);
      s += P('M-40 -194 Q0 -200 40 -194 L36 -166 Q0 -156 -36 -166Z', '#fff', 'opacity="0.92"');
      for (let i = 0; i <= 6; i++) s += C(-36 + i * 12, -164 + (i === 0 || i === 6 ? -1 : 2), 4.5, '#fff');
      s += flowerG(0, -180, 8, '#ff9ec7');
      s += cush(-150, -104, 148, 44, light(c, 0.1), 'flowers') + cush(2, -104, 148, 44, light(c, 0.1), 'flowers');
      s += G(R(-132, -146, 22, 22, 3, '#ffb3c7') + R(-110, -146, 22, 22, 3, '#fff3d6') + R(-132, -124, 22, 22, 3, '#9fd6ff') + R(-110, -124, 22, 22, 3, '#ffd36b') +
        R(-132, -146, 44, 44, 5, 'none', 'stroke="#fff" stroke-width="2" stroke-dasharray="3 3"'), 'transform="rotate(-8 -110 -124)"');
      s += box(-184, -136, 48, 100, 24, c, 'flowers') + box(136, -136, 48, 100, 24, c, 'flowers') + E(-160, -130, 20, 12, dark(c, 0.06)) + E(160, -130, 20, 12, dark(c, 0.06)) + E(-160, -130, 9, 5, light(c, 0.3)) + E(160, -130, 9, 5, light(c, 0.3));
      s += box(-176, -60, 352, 54, 4, light(c, 0.2), 'none', 'y') + R(-176, -66, 352, 9, 4, dark(c, 0.15));
      for (const x of [-132, -44, 44, 132]) s += P(`M${x - 8} -6 L${x} -56 L${x + 8} -6Z`, dark(c, 0.08));
      return s + R(-164, -8, 18, 8, 3, wd) + R(146, -8, 18, 8, 3, wd);
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Cloud Sofa', w: 410, h: 205, seats: two(-104),
    art: (c) => {
      let s = '';
      RB.forEach((col, i) => {
        const rx = 168 - i * 13;
        const ry = 112 - i * 13;
        s += P(`M${-rx} -86 A${rx} ${ry} 0 0 1 ${rx} -86Z`, col);
      });
      s += P('M-90 -86 A90 34 0 0 1 90 -86Z', light(c, 0.55)) + P('M-168 -86 A168 112 0 0 1 168 -86Z', 'url(#g-shadeX)');
      s += cush(-152, -106, 304, 46, c, 'none', 20) + Ln(0, -100, 0, -66, dark(c, 0.12), 2);
      s += sym((k) => [[165, -104, 22], [182, -80, 22], [156, -76, 24], [172, -56, 22], [150, -50, 18]].map(([x, y, r]) => C(x * k, y, r, '#fff') + C(x * k, y, r, 'url(#g-face)')).join(''));
      s += box(-150, -64, 300, 30, 14, dark(c, 0.12));
      return s + [-120, -40, 40, 120].map((x, i) => C(x, -16, 12, RB[i + 1]) + C(x - 4, -20, 3, '#fff', 'opacity="0.6"')).join('');
    },
  },
  {
    s: 'space', name: 'Starship Lounge', w: 360, h: 195, seats: two(-104),
    art: (c) => {
      const m = ST.space.metal;
      let s = box(-176, -190, 352, 164, 70, m) + R(-176, -190, 352, 164, 70, 'url(#g-shine)');
      s += box(-160, -174, 320, 132, 58, c, 'stars');
      for (const x of [-80, 0, 80]) s += C(x, -140, 17, m) + C(x, -140, 13, '#1d1a3a') + C(x - 4, -144, 2, '#fff') + C(x + 5, -135, 1.4, '#fff') + C(x + 2, -146, 1, '#ffe680') + C(x, -140, 13, 'url(#g-glass)');
      s += cush(-150, -106, 300, 46, light(c, 0.28), 'none', 22);
      s += P(starD(108, -128, 22), ST.space.accent) + P(starD(108, -128, 22), 'url(#g-face)') + C(100, -132, 2, INK) + C(114, -132, 2, INK);
      s += `<rect x="-130" y="-52" width="260" height="7" rx="3.5" fill="#ffe680">${pulse(1, 0.45, 2)}</rect>`;
      return s + sym((k) => P(`M${110 * k} -28 L${140 * k} -28 L${134 * k} -8 L${116 * k} -8Z`, '#9aa3b5') + `<ellipse cx="${125 * k}" cy="-4" rx="10" ry="3.5" fill="#ffe680">${pulse(0.9, 0.3, 1.2)}</ellipse>`);
    },
  },
  {
    s: 'beach', name: 'Wicker Beach Sofa', w: 370, h: 180, seats: two(-102),
    art: (c) => {
      const wd = ST.beach.wood;
      const wv = dark(wd, 0.22);
      let s = box(-172, -176, 344, 116, 22, wd) + weave(-164, -170, 328, 104, wv);
      s += cush(-152, -164, 148, 64, light(c, 0.35), 'stripes', 18) + cush(4, -164, 148, 64, light(c, 0.35), 'stripes', 18);
      s += cush(-152, -104, 150, 42, c, 'stripes') + cush(2, -104, 150, 42, c, 'stripes');
      s += box(62, -152, 74, 50, 18, '#fff') + motif('fish', 99, -127, 15);
      s += P(starD(-100, -124, 22, 0.5), '#ffab5e') + C(-100, -124, 3, '#fff', 'opacity="0.6"') + C(-108, -130, 1.5, '#fff') + C(-92, -118, 1.5, '#fff');
      s += box(-186, -130, 38, 104, 14, wd) + weave(-184, -126, 34, 96, wv) + box(148, -130, 38, 104, 14, wd) + weave(150, -126, 34, 96, wv);
      s += box(-176, -62, 352, 22, 8, dark(wd, 0.08)) + weave(-172, -60, 344, 18, wv, 9);
      return s + sym((k) => R(150 * k - 7, -42, 14, 42, 5, dark(wd, 0.1)) + Ln(150 * k - 7, -26, 150 * k + 7, -26, dark(wd, 0.35), 2) + Ln(150 * k - 7, -12, 150 * k + 7, -12, dark(wd, 0.35), 2));
    },
  },
  {
    s: 'candy', name: 'Macaron Sofa', w: 410, h: 226, seats: two(-108),
    art: (c) => {
      const ac = ST.candy.accent;
      let s = box(-150, -198, 300, 116, 56, c);
      for (let x = -134; x <= 134; x += 12) s += C(x, -88, 6, dark(c, 0.07));
      [[-90, -170, 20, '#fff'], [-40, -184, -30, '#7cc8ff'], [20, -176, 50, '#ffd36b'], [76, -166, -10, '#fff'], [-110, -136, 60, '#ff4f8b'], [100, -134, 30, '#7fe0b0'], [-10, -146, -60, '#c99bff'], [50, -126, 10, '#fff']]
        .forEach(([x, y, r, col]) => { s += R((x as number) - 6, (y as number) - 2, 12, 4, 2, col as string, `transform="rotate(${r} ${x} ${y})"`); });
      s += S('M0 -198 Q4 -214 14 -220', '#5fae6b', 3) + C(0, -204, 12, '#e8384f') + C(-4, -208, 3, '#fff', 'opacity="0.6"');
      s += box(-168, -58, 336, 52, 26, c) + box(-162, -78, 324, 24, 12, ST.candy.soft);
      for (let x = -150; x <= 150; x += 25) s += C(x, -56, 7, ST.candy.soft);
      s += box(-172, -110, 344, 38, 19, light(c, 0.1), 'none', 'y') + hi(-140, -104, 180, 5);
      for (let x = -160; x <= 160; x += 11) s += C(x, -73, 4.5, light(c, 0.02)) + C(x, -59, 4.5, dark(c, 0.04));
      return s + sym((k) => R(170 * k - 4, -112, 8, 106, 4, '#fff') + C(170 * k, -132, 30, ac) +
        S(`M${170 * k} -132 a5 5 0 0 1 10 0 a10 10 0 0 1 -20 0 a15 15 0 0 1 30 0 a20 20 0 0 1 -40 0 a24 24 0 0 1 48 0`, '#fff', 5, 'opacity="0.85"') + C(170 * k - 12, -146, 5, '#fff', 'opacity="0.5"'));
    },
  },
  {
    s: 'woodland', name: 'Log Cabin Sofa', w: 380, h: 215, seats: two(-102),
    art: (c) => {
      const wd = ST.woodland.wood;
      const ring = '#e8c49a';
      const bark = (x: number, y1: number, y2: number) => Ln(x, y1, x, y2, dark(wd, 0.25), 2, 'opacity="0.6"');
      let s = sym((k) => box(166 * k - 14, -206, 28, 206, 8, wd) + E(166 * k, -206, 14, 5, ring) + bark(166 * k - 5, -196, -110) + bark(166 * k + 6, -180, -130));
      s += box(-170, -196, 340, 30, 15, wd, 'none', 'y') + E(-170, -181, 9, 15, ring) + E(170, -181, 9, 15, ring) + E(170, -181, 4, 7, 'none', `stroke="${dark(ring, 0.25)}" stroke-width="1.5"`) + Ln(-110, -186, -60, -186, dark(wd, 0.25), 2) + Ln(30, -176, 100, -176, dark(wd, 0.25), 2);
      s += cush(-152, -166, 304, 66, c, 'check', 20);
      s += cush(-150, -104, 148, 44, c, 'check') + cush(2, -104, 148, 44, c, 'check');
      s += P('M60 -104 Q70 -164 132 -152 Q128 -112 60 -104Z', ST.woodland.accent) + S('M64 -106 Q96 -128 128 -150 M86 -120 L84 -138 M104 -132 L112 -146 M92 -124 L108 -118', dark(ST.woodland.accent, 0.25), 2);
      s += C(-96, -126, 22, ST.woodland.soft) + C(-96, -126, 22, 'url(#g-face)') + motif('leaf', -96, -126, 12);
      s += sym((k) => box(178 * k - 18, -130, 36, 130, 10, wd) + E(178 * k, -130, 18, 6, ring) + E(178 * k, -130, 10, 3, 'none', `stroke="${dark(ring, 0.25)}" stroke-width="1.5"`) + bark(178 * k - 6, -118, -20) + bark(178 * k + 7, -100, -30));
      s += box(-160, -62, 320, 30, 15, dark(wd, 0.05), 'none', 'y') + Ln(-120, -48, -40, -48, dark(wd, 0.3), 2) + Ln(20, -42, 110, -42, dark(wd, 0.3), 2);
      return s + E(118, -6, 12, 7, '#e8573d') + C(114, -8, 2, '#fff') + C(122, -6, 1.6, '#fff') + R(115, -2, 6, 3, 1, '#fff');
    },
  },
  {
    s: 'boho', name: 'Boho Cane Daybed', w: 360, h: 215, seats: two(-102),
    art: (c) => {
      const wd = ST.boho.wood;
      const ac = ST.boho.accent;
      let s = cloth('M-160 -84 V-150 Q-160 -208 -104 -208 H104 Q160 -208 160 -150 V-84Z', wd);
      s += P('M-146 -84 V-148 Q-146 -194 -102 -194 H102 Q146 -194 146 -148 V-84Z', light(wd, 0.45));
      let mesh = '';
      for (let i = -20; i < 40; i++) mesh += Ln(i * 12, 0, i * 12 - 100, 100, dark(wd, 0.05), 2.2) + Ln(i * 12 - 200, 0, i * 12 - 100, 100, dark(wd, 0.05), 2.2);
      s += `<svg x="-130" y="-182" width="260" height="98" overflow="hidden">${mesh}</svg>`;
      s += cush(-160, -104, 320, 44, c);
      s += G(box(-146, -156, 58, 52, 14, ac) + C(-146, -156, 4, ac) + C(-88, -156, 4, ac) + R(-136, -134, 38, 3, 1.5, '#fff', 'opacity="0.5"'), 'transform="rotate(-10 -117 -130)"');
      s += G(box(-80, -150, 56, 48, 14, ST.boho.soft) + motif('sun', -52, -126, 13), 'transform="rotate(5 -52 -126)"');
      s += box(78, -150, 62, 48, 14, '#e8b46a') + [92, 104, 116, 128].map((x) => Ln(x, -146, x, -106, '#fff', 2, 'opacity="0.45"')).join('');
      s += P('M-30 -100 L64 -100 L60 -42 L-26 -42Z', '#fff3e6') + Ln(-28, -86, 62, -86, ac, 4) + Ln(-27, -72, 61, -72, '#e8b46a', 3) + fringe(-24, 58, -42, 9, '#e8d6c0');
      s += R(-170, -60, 340, 22, 8, wd);
      for (let x = -164; x <= 164; x += 8) s += Ln(x, -58, x, -40, dark(wd, 0.15), 2);
      return s + sym((k) => P(`M${150 * k} -38 L${162 * k} -38 L${159 * k} 0 L${153 * k} 0Z`, dark(wd, 0.15)));
    },
  },
  {
    s: 'retro', name: 'Mid-Century Sofa', w: 380, h: 180, seats: three(-100, 104),
    art: (c) => {
      const wd = ST.retro.wood;
      let s = box(-160, -170, 320, 80, 22, c);
      for (let x = -120; x <= 120; x += 40) s += btn(x, -148, c);
      for (let x = -100; x <= 100; x += 40) s += btn(x, -118, c);
      s += sym((k) => R(170 * k - 7, -122, 14, 62, 6, wd) + R(k > 0 ? 150 : -190, -128, 40, 12, 6, wd) + hi(k > 0 ? 156 : -184, -126, 24, 3));
      for (const x of [-158, -52, 54]) s += cush(x, -102, 104, 40, c, 'none', 10);
      s += C(110, -124, 22, ST.retro.accent) + C(110, -124, 22, 'url(#g-face)') + P(starD(110, -124, 11), ST.retro.trim);
      s += R(-178, -64, 356, 16, 6, wd) + hi(-160, -62, 200, 3, 0.3);
      return s + sym((k) => P(`M${148 * k} -48 L${160 * k} -48 L${176 * k} 0 L${168 * k} 0Z`, dark(wd, 0.1)) + R(170 * k - 5, -6, 10, 6, 2, '#ffd36b'));
    },
  },
]);

const LOVESEATS = series('loveseat', 'Loveseats', 'living', 'floor', [
  {
    s: 'sweet', name: 'Heart Loveseat', w: 300, h: 235, seats: two(-102, 56),
    art: (c) => {
      const hd = heartD(0, -244, 210);
      let s = cloth(hd, c) + S(hd, light(c, 0.5), 5, 'opacity="0.8"');
      for (const [x, y] of [[-70, -196], [70, -196], [0, -168], [-40, -140], [40, -140]]) s += btn(x, y, c);
      s += cush(-118, -104, 236, 44, light(c, 0.14), 'none', 18) + box(-146, -124, 32, 94, 16, c) + box(114, -124, 32, 94, 16, c);
      s += box(-132, -62, 264, 30, 12, dark(c, 0.12)) + R(-132, -36, 264, 4, 2, '#fff', 'opacity="0.5"');
      return s + sym((k) => P(`M${108 * k} -34 L${122 * k} -34 L${118 * k} 0 L${112 * k} 0Z`, GOLD));
    },
  },
  {
    s: 'princess', name: 'Camelback Settee', w: 320, h: 260, seats: two(-104, 58),
    art: (c) => {
      let s = cloth('M-140 -90 V-150 Q-130 -190 -70 -190 Q-30 -190 -10 -222 Q0 -232 10 -222 Q30 -190 70 -190 Q130 -190 140 -150 V-90Z', '#ffffff');
      const inner = 'M-126 -90 V-148 Q-118 -176 -70 -176 Q-26 -176 -8 -206 Q0 -214 8 -206 Q26 -176 70 -176 Q118 -176 126 -148 V-90Z';
      s += cloth(inner, c, 'hearts') + S(inner, GOLD, 3) + bowG(0, -228, 0.7, '#ff7eb6');
      s += cush(-130, -106, 260, 44, light(c, 0.12), 'hearts', 16);
      s += sym((k) => box(k > 0 ? 126 : -156, -134, 30, 96, 14, '#fff') + C(141 * k, -128, 9, light(c, 0.1)) + S(`M${141 * k} -128 m-4 0 a4 4 0 1 1 4 4`, GOLD, 2.5));
      s += box(-150, -62, 300, 24, 10, '#fff') + S('M-140 -40 Q-70 -30 0 -40 Q70 -30 140 -40', GOLD, 3) + flowerG(0, -50, 9, '#ffd24a', '#fff');
      return s + sym((k) => P(`M${130 * k} -40 Q${150 * k} -26 ${136 * k} -10 Q${132 * k} -2 ${140 * k} 0 L${150 * k} 0 Q${148 * k} -8 ${152 * k} -14 Q${162 * k} -30 ${148 * k} -40Z`, '#fff') +
        S(`M${136 * k} -36 Q${150 * k} -24 ${140 * k} -10`, '#e6dce8', 2) + E(145 * k, -2, 7, 3, GOLD));
    },
  },
  {
    s: 'beach', name: 'Clamshell Loveseat', w: 330, h: 255, seats: two(-104, 58),
    art: (c) => {
      const lobes = 7;
      const shell = (rx: number, ry: number, bulge: number) => {
        let d = `M${-rx} -80`;
        for (let i = 0; i < lobes; i++) {
          const a0 = Math.PI - (i * Math.PI) / lobes;
          const a1 = Math.PI - ((i + 1) * Math.PI) / lobes;
          const am = (a0 + a1) / 2;
          d += ` Q${f(Math.cos(am) * rx * bulge)} ${f(-80 - Math.sin(am) * ry * bulge)} ${f(Math.cos(a1) * rx)} ${f(-80 - Math.sin(a1) * ry)}`;
        }
        return d + 'Z';
      };
      let s = cloth(shell(140, 150, 1.16), c) + P(shell(118, 128, 1.14), light(c, 0.35));
      for (let i = 1; i < lobes; i++) {
        const a = Math.PI - (i * Math.PI) / lobes;
        s += Ln(0, -80, Math.cos(a) * 138, -80 - Math.sin(a) * 148, dark(c, 0.12), 3);
      }
      s += cush(-132, -106, 264, 46, light(c, 0.6), 'stripes', 18) + C(74, -128, 20, '#fff') + C(74, -128, 20, 'url(#g-face)') + C(68, -134, 5, '#fff');
      s += box(-142, -64, 284, 60, 22, ST.beach.wood) + S('M-130 -40 Q-110 -50 -90 -40 Q-70 -30 -50 -40 Q-30 -50 -10 -40 Q10 -30 30 -40 Q50 -50 70 -40 Q90 -30 110 -40 Q120 -45 130 -40', '#fff', 4);
      return s + P(starD(-96, -24, 12, 0.5), '#ffab5e') + P(starD(96, -22, 9, 0.5), '#ff9ec7');
    },
  },
  {
    s: 'retro', name: 'Mod Pod Loveseat', w: 310, h: 200, seats: two(-104, 56),
    art: (c) => {
      let s = box(-150, -190, 300, 162, 66, c) + box(-128, -170, 256, 120, 50, ST.retro.soft) + S('M-136 -150 Q0 -205 136 -150', ST.retro.trim, 6);
      s += cush(-126, -106, 252, 46, ST.retro.accent, 'none', 20);
      s += box(-150, -72, 300, 44, 22, c) + R(-140, -58, 280, 6, 3, ST.retro.trim) + hi(-120, -68, 140, 4);
      return s + P('M-60 -30 H60 L84 -6 H-84Z', '#c9cfdd') + E(0, -6, 94, 7, '#9aa3b5') + hi(-40, -26, 60, 3, 0.6);
    },
  },
]);

const SECTIONALS = series('sectional', 'Sectionals', 'living', 'floor', [
  {
    s: 'modern', name: 'Corner Sectional', w: 500, h: 165, seats: [{ x: -170, y: -100, pose: 'sit' }, { x: -20, y: -100, pose: 'sit' }, { x: 160, y: -104, pose: 'sit' }],
    art: (c) => {
      let s = box(-240, -160, 340, 70, 6, dark(c, 0.08)) + box(-228, -154, 156, 60, 8, light(c, 0.06)) + box(-70, -154, 156, 60, 8, light(c, 0.06));
      s += cush(-228, -102, 156, 40, c, 'none', 6) + cush(-70, -102, 156, 40, c, 'none', 6) + box(-250, -130, 30, 96, 6, c);
      s += box(-200, -138, 50, 42, 10, ST.modern.soft) + box(40, -138, 46, 40, 10, '#ffd36b') + P('M44 -100 L62 -128 L82 -100Z', '#fff', 'opacity="0.45"');
      s += box(-250, -64, 340, 24, 4, dark(c, 0.18)) + Ln(-236, -42, -242, -2, INK, 6) + Ln(76, -42, 80, -2, INK, 6);
      s += P('M88 -108 H240 L248 -94 H82Z', light(c, 0.16)) + box(82, -96, 166, 80, 6, c) + Ln(86, -76, 244, -76, dark(c, 0.1), 2) + box(82, -18, 166, 10, 3, dark(c, 0.2));
      s += box(206, -132, 34, 26, 12, ST.modern.accent);
      return s + Ln(96, -8, 92, 0, INK, 6) + Ln(234, -8, 238, 0, INK, 6);
    },
  },
  {
    s: 'boho', name: 'Floor Lounge Sectional', w: 490, h: 180, seats: [{ x: -150, y: -80, pose: 'sit' }, { x: -10, y: -80, pose: 'sit' }, { x: 150, y: -80, pose: 'sit' }],
    art: (c) => {
      const wd = ST.boho.wood;
      const pc = [ST.boho.accent, c, ST.boho.soft, '#e8b46a', '#c9a27e'];
      let s = '';
      [-190, -100, -10, 80, 170].forEach((x, i) => {
        const tilt = [-6, 4, -3, 5, -5][i];
        s += G(box(x - 44, -172, 88, 92, 26, pc[i]) + (i === 2 ? motif('sun', x, -126, 18) : i % 2 ? [-20, 0, 20].map((d) => Ln(x + d, -164, x + d, -88, '#fff', 3, 'opacity="0.4"')).join('') : C(x, -126, 10, '#fff', 'opacity="0.5"')) +
          C(x - 44, -172, 4, pc[i]) + C(x + 44, -172, 4, pc[i]), `transform="rotate(${tilt} ${x} -126)"`);
      });
      s += cush(-236, -84, 300, 44, c, 'none', 20) + cush(66, -84, 172, 44, light(c, 0.1), 'none', 20);
      for (const x of [-180, -110, -40, 30, 110, 190]) s += btn(x, -62, c, 3.6);
      s += fringe(-226, 228, -42, 8, '#e8d6c0', 7);
      return s + R(-244, -38, 488, 34, 10, wd) + weave(-240, -36, 480, 30, dark(wd, 0.2), 10);
    },
  },
  {
    s: 'sweet', name: 'Puffy Cloud Sectional', w: 500, h: 185, seats: [{ x: 160, y: -102, pose: 'sit' }, { x: 20, y: -102, pose: 'sit' }, { x: -170, y: -106, pose: 'sit' }],
    art: (c) => {
      let d = 'M-80 -84 V-140';
      for (let i = 0; i < 4; i++) d += ` A42 42 0 0 1 ${-80 + (i + 1) * 79} -140`;
      d += ' V-84Z';
      let s = cloth(d, dark(c, 0.04)) + S(d, '#fff', 4, 'opacity="0.6"');
      for (let i = 0; i < 4; i++) s += btn(-40 + i * 79, -150, c);
      s += cush(-76, -104, 152, 44, light(c, 0.15), 'none', 20) + cush(80, -104, 152, 44, light(c, 0.15), 'none', 20) + box(228, -128, 40, 96, 20, c);
      s += P(heartD(196, -142, 36), '#fff') + P(heartD(196, -142, 36), 'url(#g-face)');
      s += box(-80, -64, 348, 30, 12, dark(c, 0.12)) + C(250, -12, 10, GOLD) + C(-60, -12, 10, GOLD);
      s += P('M-236 -112 H-80 L-80 -98 H-246Z', light(c, 0.25)) + box(-250, -100, 178, 84, 26, c) + Ln(-236, -76, -90, -76, dark(c, 0.08), 3) + hi(-230, -94, 90, 5);
      s += C(-226, -124, 20, '#fff') + C(-226, -124, 20, 'url(#g-face)') + bowG(-226, -126, 0.36, c);
      return s + C(-230, -12, 10, GOLD) + C(-96, -12, 10, GOLD);
    },
  },
]);

const ARMCHAIRS = series('armchair', 'Armchairs', 'living', 'floor', [
  {
    s: 'sweet', name: 'Scallop Shell Chair', w: 210, h: 215, seats: one(-102),
    art: (c) => {
      let s = '';
      [-178, -198, -210, -198, -178].forEach((top, i) => { s += box(-85 + i * 34, top, 34, -top - 80, 17, i % 2 ? light(c, 0.06) : c); });
      s += box(-100, -128, 28, 94, 14, c) + box(72, -128, 28, 94, 14, c);
      s += cush(-84, -104, 168, 44, light(c, 0.14), 'none', 18) + P(heartD(0, -152, 32), '#fff') + P(heartD(0, -152, 32), 'url(#g-face)');
      s += box(-92, -64, 184, 30, 12, dark(c, 0.12)) + R(-92, -38, 184, 4, 2, '#fff', 'opacity="0.5"');
      return s + sym((k) => P(`M${68 * k} -36 L${82 * k} -36 L${77 * k} 0 L${72 * k} 0Z`, GOLD));
    },
  },
  {
    s: 'princess', name: 'Royal Throne', w: 220, h: 335, seats: one(-104),
    art: (c) => {
      let s = P('M-82 -90 V-232 Q-82 -270 -42 -278 Q-12 -284 0 -302 Q12 -284 42 -278 Q82 -270 82 -232 V-90Z', GOLD);
      s += cloth('M-68 -92 V-228 Q-68 -258 -38 -264 Q-8 -269 0 -284 Q8 -269 38 -264 Q68 -258 68 -228 V-92Z', c, 'hearts');
      for (let r = 0; r < 5; r++) for (let x = -40 + (r % 2) * 20; x <= 40 - (r % 2) * 20; x += 40) s += btn(x, -240 + r * 30, c);
      s += motif('crown', 0, -312, 22) + C(0, -260, 6, '#ff4f8b') + C(-2, -262, 2, '#fff');
      s += cush(-82, -108, 164, 44, light(c, 0.15), 'hearts', 16);
      s += sym((k) => box(k > 0 ? 76 : -106, -140, 30, 100, 14, c) + S(`M${91 * k} -140 Q${108 * k} -142 ${104 * k} -124`, GOLD, 4));
      s += box(-96, -64, 192, 26, 10, GOLD) + C(0, -51, 6, '#ff4f8b') + C(-44, -51, 4, '#7cc8ff') + C(44, -51, 4, '#5fd3b5');
      return s + sym((k) => P(`M${80 * k} -40 Q${94 * k} -20 ${82 * k} -6 L${90 * k} 0 L${70 * k} 0 L${72 * k} -6 Q${80 * k} -20 ${66 * k} -40Z`, GOLD));
    },
  },
  {
    s: 'modern', name: 'Cube Chair', w: 200, h: 165, seats: one(-102),
    art: (c) => {
      let s = box(-80, -160, 160, 74, 6, dark(c, 0.06)) + box(-70, -154, 140, 62, 8, light(c, 0.05));
      s += cush(-72, -104, 144, 42, c, 'none', 6) + box(-34, -132, 68, 28, 12, ST.modern.soft) + Ln(-20, -118, 20, -118, '#fff', 2, 'opacity="0.5"');
      s += box(-96, -128, 26, 100, 6, c) + box(70, -128, 26, 100, 6, c) + box(-96, -62, 192, 34, 4, dark(c, 0.15));
      return s + S('M-84 -28 V-4 H84 V-28', INK, 6);
    },
  },
  {
    s: 'cottage', name: 'Floral Wingback', w: 220, h: 250, seats: one(-104),
    art: (c) => {
      let s = cloth('M-70 -90 V-210 Q-70 -240 -40 -242 H40 Q70 -240 70 -210 V-90Z', c, 'flowers');
      s += sym((k) => cloth(`M${68 * k} -206 Q${100 * k} -204 ${100 * k} -162 L${98 * k} -110 L${68 * k} -110Z`, dark(c, 0.06), 'flowers'));
      s += P('M-26 -242 Q0 -246 26 -242 L24 -222 Q0 -214 -24 -222Z', '#fff', 'opacity="0.9"') + flowerG(0, -232, 6, '#ff9ec7');
      s += cush(-80, -106, 160, 44, light(c, 0.1), 'flowers');
      s += box(-104, -136, 36, 100, 18, c, 'flowers') + box(68, -136, 36, 100, 18, c, 'flowers');
      s += box(-104, -60, 208, 50, 4, light(c, 0.2), 'none', 'y') + R(-104, -66, 208, 9, 4, dark(c, 0.15));
      for (const x of [-52, 52]) s += P(`M${x - 8} -10 L${x} -56 L${x + 8} -10Z`, dark(c, 0.08));
      return s + R(-94, -12, 18, 12, 4, ST.cottage.wood) + R(76, -12, 18, 12, 4, ST.cottage.wood);
    },
  },
  {
    s: 'space', name: 'Egg Pod Chair', w: 220, h: 295, seats: one(-106),
    art: (c) => {
      const soft = ST.space.soft;
      const egg = 'M0 -286 C72 -286 104 -204 104 -144 C104 -92 72 -60 0 -60 C-72 -60 -104 -92 -104 -144 C-104 -204 -72 -286 0 -286Z';
      const hole = 'M0 -254 C54 -254 78 -194 78 -146 C78 -106 58 -84 0 -84 C-58 -84 -78 -106 -78 -146 C-78 -194 -54 -254 0 -254Z';
      let s = cloth(egg, c, 'stars') + cloth(hole, soft) + S(hole, ST.space.metal, 6);
      for (const x of [-40, 0, 40]) s += Ln(x, -236, x, -112, dark(soft, 0.15), 3);
      s += cush(-68, -110, 136, 32, light(soft, 0.25), 'none', 14) + P(starD(0, -272, 8), ST.space.accent);
      return s + R(-8, -62, 16, 50, 4, ST.space.metal) + E(0, -9, 58, 9, '#9aa3b5') + E(0, -12, 54, 7, ST.space.metal);
    },
  },
  {
    s: 'beach', name: 'Wicker Tub Chair', w: 210, h: 190, seats: one(-104),
    art: (c) => {
      const wd = ST.beach.wood;
      const wv = dark(wd, 0.22);
      let s = box(-92, -184, 184, 150, 60, wd) + weave(-84, -176, 168, 136, wv);
      s += cush(-70, -166, 140, 64, light(c, 0.35), 'stripes', 24) + cush(-76, -106, 152, 44, c, 'stripes');
      s += box(-100, -130, 34, 100, 17, wd) + weave(-98, -124, 30, 90, wv) + box(66, -130, 34, 100, 17, wd) + weave(68, -124, 30, 90, wv);
      s += box(-92, -64, 184, 48, 14, dark(wd, 0.05)) + weave(-88, -62, 176, 44, wv, 9);
      return s + R(-80, -18, 14, 18, 4, dark(wd, 0.12)) + R(66, -18, 14, 18, 4, dark(wd, 0.12)) + P(starD(44, -126, 15, 0.5), '#ffab5e');
    },
  },
  {
    s: 'candy', name: 'Cupcake Chair', w: 210, h: 250, seats: one(-104),
    art: (c) => {
      const ac = ST.candy.accent;
      let s = box(-92, -164, 184, 74, 36, c) + box(-72, -202, 144, 52, 26, light(c, 0.08)) + box(-46, -230, 92, 40, 20, light(c, 0.16));
      s += S('M0 -238 Q4 -252 14 -256', '#5fae6b', 3) + C(0, -242, 13, '#e8384f') + C(-4, -246, 3.5, '#fff', 'opacity="0.6"');
      [[-50, -140, 20, '#fff'], [30, -150, -40, '#7cc8ff'], [-20, -186, 50, '#ffd36b'], [40, -190, 0, '#fff'], [60, -128, 60, '#7fe0b0'], [-8, -214, -20, '#c99bff']]
        .forEach(([x, y, r, col]) => { s += R((x as number) - 6, (y as number) - 2, 12, 4, 2, col as string, `transform="rotate(${r} ${x} ${y})"`); });
      s += cush(-84, -108, 168, 44, ST.candy.soft, 'none', 20);
      s += P('M-92 -66 L92 -66 L74 0 L-74 0Z', ac);
      for (let i = -4; i <= 4; i++) s += Ln(i * 20, -64, i * 16, -2, dark(ac, 0.15), 3);
      return s + R(-98, -72, 196, 12, 6, light(ac, 0.25)) + P('M-92 -66 L92 -66 L74 0 L-74 0Z', 'url(#g-shadeX)');
    },
  },
  {
    s: 'woodland', name: 'Leafy Stump Chair', w: 210, h: 240, seats: one(-104),
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = P('M0 -238 Q96 -206 78 -100 L-78 -100 Q-96 -206 0 -238Z', c) + P('M0 -238 Q96 -206 78 -100 L-78 -100 Q-96 -206 0 -238Z', 'url(#g-shadeX)');
      s += S('M0 -226 V-104 M0 -200 L-34 -176 M0 -200 L34 -176 M0 -166 L-46 -136 M0 -166 L46 -136', dark(c, 0.2), 3);
      s += P('M-82 -64 Q-86 -30 -102 0 H102 Q86 -30 82 -64Z', wd) + P('M-102 0 Q-96 -10 -80 -6 Q-74 -12 -60 -4Z M102 0 Q96 -10 80 -6 Q74 -12 60 -4Z', dark(wd, 0.12));
      for (const x of [-50, -16, 20, 52]) s += S(`M${x} -60 Q${x + 4} -32 ${x - 2} -6`, dark(wd, 0.25), 2.5);
      s += cush(-88, -108, 176, 46, ST.woodland.soft, 'check', 20) + E(0, -66, 82, 6, '#e8c49a');
      return s + E(84, -16, 15, 9, '#e8573d') + C(80, -19, 2.2, '#fff') + C(90, -15, 1.8, '#fff') + R(80, -10, 8, 10, 3, '#fff');
    },
  },
  {
    s: 'boho', name: 'Peacock Rattan Chair', w: 250, h: 325, seats: one(-106),
    art: (c) => {
      const wd = ST.boho.wood;
      const fan = 'M-30 -96 Q-124 -150 -114 -240 Q-84 -322 0 -322 Q84 -322 114 -240 Q124 -150 30 -96Z';
      let s = cloth(fan, wd);
      for (const r of [60, 100, 140]) {
        const a0 = Math.PI + 0.72;
        const a1 = 2 * Math.PI - (a0 - Math.PI);
        s += S(`M${f(Math.cos(a0) * r)} ${f(-100 + Math.sin(a0) * r)} A${r} ${r} 0 0 1 ${f(Math.cos(a1) * r)} ${f(-100 + Math.sin(a1) * r)}`, light(wd, 0.35), 4);
      }
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + 0.75 + (i / 8) * (Math.PI - 1.5);
        const len = 150 + Math.sin((i / 8) * Math.PI) * 50;
        s += Ln(Math.cos(a) * 40, -100 + Math.sin(a) * 40, Math.cos(a) * len, -100 + Math.sin(a) * len, dark(wd, 0.12), 2.5);
      }
      s += S(fan, dark(wd, 0.15), 6) + cush(-72, -110, 144, 44, c, 'none', 18);
      s += G(box(-34, -146, 52, 40, 18, ST.boho.accent) + C(-8, -126, 8, '#fff3e6') + fringe(-28, 12, -108, 6, ST.boho.accent, 8), 'transform="rotate(-6 -8 -126)"');
      s += P('M-62 -66 L62 -66 L22 -34 L62 0 L-62 0 L-22 -34Z', wd);
      return s + [-50, -30, -10, 10, 30, 50].map((x) => Ln(x, -64, x * 0.4, -34, dark(wd, 0.18), 2) + Ln(x * 0.4, -34, x, -2, dark(wd, 0.18), 2)).join('');
    },
  },
  {
    s: 'retro', name: 'Swivel Tub Chair', w: 200, h: 190, seats: one(-104),
    art: (c) => {
      let s = box(-92, -184, 184, 140, 70, c) + box(-74, -168, 148, 100, 52, ST.retro.soft) + S('M-80 -150 Q0 -196 80 -150', ST.retro.trim, 5);
      s += cush(-76, -108, 152, 44, ST.retro.accent, 'none', 20) + box(-92, -76, 184, 40, 20, c) + R(-84, -60, 168, 5, 2.5, ST.retro.trim);
      s += R(-7, -38, 14, 26, 4, '#c9cfdd');
      return s + [-1, -0.5, 0.5, 1].map((t) => Ln(0, -12, t * 70, -2, '#9aa3b5', 7)).join('') + C(0, -12, 9, '#c9cfdd');
    },
  },
]);

const ROCKERS = series('rocker', 'Rocking Chairs', 'living', 'floor', [
  {
    s: 'cottage', name: 'Spindle Rocker', w: 210, h: 265, animWhenUsed: true, seats: [{ x: 4, y: -108, pose: 'sit', anim: { pivot: [0, -4], amp: 4, dur: 2.4 } }],
    art: (c, on) => {
      const wd = ST.cottage.wood;
      let s = Ln(-54, -96, -76, -250, wd, 10) + Ln(-24, -96, -42, -246, wd, 8);
      for (let i = 1; i < 5; i++) s += Ln(-54 + i * 6, -100, -76 + i * 7, -238, dark(wd, 0.1), 4);
      s += S('M-84 -250 Q-58 -266 -34 -248', wd, 12) + G(cush(-80, -230, 46, 110, c, 'flowers', 16), 'transform="rotate(-8 -57 -175)"');
      s += Ln(-50, -96, -64, -20, wd, 9) + Ln(48, -96, 56, -20, wd, 9) + R(-62, -100, 120, 12, 5, dark(wd, 0.08));
      s += cush(-58, -118, 112, 20, c, 'flowers', 8) + S('M-62 -160 Q0 -170 54 -150', wd, 9) + Ln(48, -150, 48, -100, wd, 7);
      return rockG(on, s + S('M-100 -28 Q0 6 100 -26', dark(wd, 0.1), 10));
    },
  },
  {
    s: 'sweet', name: 'Heart Rocker', w: 210, h: 255, animWhenUsed: true, seats: [{ x: 6, y: -108, pose: 'sit', anim: { pivot: [0, -4], amp: 4, dur: 2.4 } }],
    art: (c, on) => {
      let s = G(box(-88, -246, 64, 150, 30, c) + P(heartD(-56, -214, 26), '#fff', 'opacity="0.85"') + btn(-56, -150, c) + btn(-56, -126, c), 'transform="rotate(-8 -56 -170)"');
      s += Ln(-52, -96, -66, -22, '#fff', 9) + Ln(50, -96, 58, -22, '#fff', 9) + R(-64, -100, 124, 12, 5, '#f6e3d6');
      s += cush(-60, -120, 116, 22, light(c, 0.2), 'none', 10) + S('M-64 -154 Q0 -164 56 -146', '#fff', 9) + Ln(50, -146, 50, -100, '#fff', 7) + bowG(56, -150, 0.35, ST.sweet.soft);
      return rockG(on, s + S('M-102 -28 Q0 6 102 -26', '#fff', 10) + S('M-102 -28 Q0 6 102 -26', GOLD, 3));
    },
  },
  {
    s: 'modern', name: 'Shell Rocker', w: 210, h: 200, animWhenUsed: true, seats: [{ x: 4, y: -106, pose: 'sit', anim: { pivot: [0, -4], amp: 4, dur: 2.4 } }],
    art: (c, on) => {
      let s = cloth('M-70 -188 Q-84 -110 -54 -96 L60 -96 Q74 -98 72 -112 L60 -112 Q-36 -112 -46 -186Z', c) + S('M-70 -188 Q-84 -110 -54 -96 L60 -96', dark(c, 0.15), 3);
      s += cush(-44, -118, 100, 14, ST.modern.soft, 'none', 7);
      s += Ln(-40, -96, -60, -28, INK, 4) + Ln(-40, -96, 20, -28, INK, 4) + Ln(40, -96, 60, -28, INK, 4) + Ln(40, -96, -20, -28, INK, 4) + Ln(-50, -62, 50, -62, INK, 3);
      return rockG(on, s + S('M-96 -30 Q0 2 96 -28', ST.modern.wood, 9));
    },
  },
  {
    s: 'beach', name: 'Wicker Rocker', w: 210, h: 250, animWhenUsed: true, seats: [{ x: 4, y: -108, pose: 'sit', anim: { pivot: [0, -4], amp: 4, dur: 2.4 } }],
    art: (c, on) => {
      const wd = ST.beach.wood;
      let s = G(box(-92, -242, 66, 150, 22, wd) + weave(-88, -236, 58, 138, dark(wd, 0.22)) + cush(-84, -224, 50, 110, light(c, 0.3), 'stripes', 16), 'transform="rotate(-8 -59 -167)"');
      s += box(-64, -102, 124, 16, 6, wd) + weave(-62, -100, 120, 12, dark(wd, 0.22), 6) + cush(-58, -122, 114, 22, c, 'stripes', 10);
      s += S('M-64 -158 Q0 -168 56 -148', wd, 11) + Ln(50, -148, 50, -102, wd, 8);
      s += Ln(-50, -90, -64, -22, dark(wd, 0.1), 9) + Ln(48, -90, 58, -22, dark(wd, 0.1), 9);
      return rockG(on, s + S('M-102 -28 Q0 6 102 -26', dark(wd, 0.15), 10));
    },
  },
]);

const POUFS = series('pouf', 'Ottomans & Poufs', 'living', 'floor', [
  {
    s: 'sweet', name: 'Tufted Pouf', w: 140, h: 100, seats: one(-88),
    art: (c) => box(-62, -84, 124, 72, 30, c) + E(0, -82, 56, 12, light(c, 0.18)) + btn(0, -82, c) + btn(-30, -80, c) + btn(30, -80, c) + R(-62, -38, 124, 6, 3, '#fff', 'opacity="0.6"') +
      bowG(0, -46, 0.5, '#fff') + C(-44, -9, 9, GOLD) + C(44, -9, 9, GOLD),
  },
  {
    s: 'princess', name: 'Velvet Footstool', w: 150, h: 100, seats: one(-90),
    art: (c) => {
      let s = cush(-66, -96, 132, 36, c, 'hearts', 18) + btn(-30, -78, c) + btn(0, -80, c) + btn(30, -78, c);
      s += R(-62, -62, 124, 16, 6, GOLD) + fringe(-56, 56, -46, 10, '#ffd24a', 7);
      return s + sym((k) => P(`M${50 * k} -48 Q${66 * k} -30 ${54 * k} -6 L${62 * k} 0 L${46 * k} 0 L${46 * k} -6 Q${54 * k} -28 ${40 * k} -48Z`, GOLD));
    },
  },
  {
    s: 'modern', name: 'Felt Cube Ottoman', w: 120, h: 100, seats: one(-92),
    art: (c) => box(-52, -96, 104, 92, 8, c) + R(-44, -88, 88, 76, 6, 'none', `stroke="${dark(c, 0.2)}" stroke-width="2" stroke-dasharray="5 4"`) + S('M-12 -96 Q0 -110 12 -96', ST.modern.accent, 4),
  },
  {
    s: 'candy', name: 'Macaron Pouf', w: 140, h: 100, seats: one(-92),
    art: (c) => {
      let s = box(-62, -44, 124, 40, 20, c) + box(-58, -62, 116, 22, 11, ST.candy.soft) + box(-64, -96, 128, 38, 19, light(c, 0.1), 'none', 'y');
      for (let x = -56; x <= 56; x += 10) s += C(x, -59, 4, light(c, 0.02)) + C(x, -45, 4, dark(c, 0.04));
      return s + hi(-40, -90, 60, 5) + P(heartD(0, -86, 12), '#fff', 'opacity="0.7"');
    },
  },
  {
    s: 'boho', name: 'Knitted Pouf', w: 140, h: 85, seats: one(-78),
    art: (c) => {
      let s = box(-64, -80, 128, 76, 34, c) + E(0, -76, 54, 9, light(c, 0.15));
      for (let r = 0; r < 4; r++) for (let x = -48; x <= 48; x += 16) s += S(`M${x - 5} ${-64 + r * 15} L${x} ${-56 + r * 15} L${x + 5} ${-64 + r * 15}`, dark(c, 0.12), 2.5);
      return s + C(0, -76, 6, dark(c, 0.15));
    },
  },
  {
    s: 'space', name: 'Saturn Pouf', w: 170, h: 120, seats: one(-108),
    art: (c) => P('M-84 -58 A84 20 0 0 1 84 -58', 'none', `stroke="${dark(ST.space.accent, 0.2)}" stroke-width="9" stroke-linecap="round"`) + C(0, -58, 54, c) + C(0, -58, 54, 'url(#g-face)') +
      E(-20, -76, 12, 6, light(c, 0.15)) + C(26, -40, 6, dark(c, 0.15)) + P('M-84 -58 A84 20 0 0 0 84 -58', 'none', `stroke="${ST.space.accent}" stroke-width="9" stroke-linecap="round"`) + P(starD(-30, -92, 5), '#fff'),
  },
]);

const COFFEE = series('coffeetable', 'Coffee Tables', 'living', 'floor', [
  {
    s: 'princess', name: 'Glass & Gold Table', w: 250, h: 100, surfaces: [{ x1: -110, x2: 110, y: -92 }],
    art: () => sym((k) => S(`M${100 * k} -84 Q${80 * k} -50 ${100 * k} -20 Q${108 * k} -8 ${96 * k} 0`, GOLD, 7)) + E(0, -30, 92, 9, '#d9efff', 'opacity="0.7"') + E(0, -30, 92, 9, 'none', `stroke="${GOLD}" stroke-width="3"`) +
      E(0, -88, 118, 15, GOLD) + E(0, -91, 112, 12, '#e6f5ff') + E(0, -91, 112, 12, 'url(#g-glass)') + E(-40, -93, 40, 3, '#fff', 'opacity="0.7"') + bowG(0, -76, 0.45, '#ff7eb6'),
  },
  {
    s: 'modern', name: 'Slab Coffee Table', w: 250, h: 80, surfaces: [{ x1: -115, x2: 115, y: -78 }],
    art: (c) => box(-118, -78, 236, 16, 3, c) + hi(-100, -76, 120, 3, 0.5) + R(-108, -34, 216, 8, 2, ST.modern.accent) +
      G(R(-60, -46, 54, 12, 2, '#ff7eb6') + R(-56, -56, 48, 10, 2, '#7cc8ff'), 'transform="rotate(-3 -34 -46)"') + R(20, -50, 40, 16, 3, '#fff') + C(40, -42, 4, '#ffd36b') +
      sym((k) => R(106 * k - 5, -62, 10, 62, 2, ST.modern.trim)),
  },
  {
    s: 'space', name: 'UFO Table', w: 250, h: 110, surfaces: [{ x1: -100, x2: 100, y: -86 }],
    art: (c) => {
      let s = Ln(-60, -60, -90, 0, '#9aa3b5', 7) + Ln(60, -60, 90, 0, '#9aa3b5', 7) + Ln(0, -60, 0, 0, '#c9cfdd', 7) + E(0, -6, 30, 5, ST.space.accent, 'opacity="0.4"');
      s += E(0, -66, 120, 20, ST.space.metal) + E(0, -70, 118, 16, c) + E(0, -82, 100, 10, light(c, 0.2)) + E(-30, -84, 40, 3, '#fff', 'opacity="0.45"');
      return s + [-90, -45, 0, 45, 90].map((x, i) => `<circle cx="${x}" cy="${-62 + Math.abs(x) * 0.06}" r="5" fill="${RB[i]}">${pulse(1, 0.3, 1.2, i * 0.25)}</circle>`).join('');
    },
  },
  {
    s: 'beach', name: 'Surfboard Table', w: 270, h: 90, surfaces: [{ x1: -110, x2: 110, y: -80 }],
    art: (c) => sym((k) => S(`M${80 * k} -66 Q${74 * k} -34 ${86 * k} 0`, '#d9c8a8', 10) + S(`M${80 * k} -40 l${-14 * k} 6`, '#d9c8a8', 5)) +
      P('M-130 -74 Q-120 -90 -40 -92 L80 -92 Q120 -90 132 -76 Q120 -62 80 -62 L-40 -62 Q-120 -62 -130 -74Z', c) + P('M-130 -74 Q-120 -90 -40 -92 L80 -92 Q120 -90 132 -76', 'none', 'stroke="#fff" stroke-width="3" opacity="0.6"') +
      R(-70, -82, 160, 7, 3.5, ST.beach.wood) + R(-60, -72, 140, 4, 2, '#ff9ec7') + P('M-130 -74 Q-120 -90 -40 -92 L80 -92 Q120 -90 132 -76 Q120 -62 80 -62 L-40 -62 Q-120 -62 -130 -74Z', 'url(#g-shadeY)'),
  },
  {
    s: 'candy', name: 'Donut Table', w: 230, h: 105, surfaces: [{ x1: -96, x2: 96, y: -94 }],
    art: (c) => {
      let s = P('M-30 -50 L30 -50 L46 -10 L-46 -10Z', '#fff') + E(0, -8, 64, 8, '#fff') + E(0, -8, 64, 8, 'url(#g-shadeX)') + R(-30, -54, 60, 8, 4, ST.candy.accent);
      s += E(0, -70, 110, 32, '#e8b46a') + P('M-108 -80 Q-110 -100 -60 -102 Q0 -106 60 -102 Q110 -100 108 -80 Q100 -66 90 -72 Q80 -60 66 -70 Q52 -56 36 -68 Q20 -56 0 -66 Q-20 -56 -36 -68 Q-52 -58 -66 -70 Q-80 -60 -90 -72 Q-100 -64 -108 -80Z', c);
      s += E(0, -88, 30, 8, dark('#e8b46a', 0.25)) + E(-50, -94, 30, 3, '#fff', 'opacity="0.4"');
      [[-70, -88, 20, '#fff'], [-30, -98, -30, '#7cc8ff'], [40, -96, 40, '#ffd36b'], [76, -86, -10, '#7fe0b0'], [20, -80, 70, '#fff'], [-50, -78, 50, '#c99bff']]
        .forEach(([x, y, r, col]) => { s += R((x as number) - 6, (y as number) - 2, 12, 4, 2, col as string, `transform="rotate(${r} ${x} ${y})"`); });
      return s;
    },
  },
  {
    s: 'woodland', name: 'Log Slice Table', w: 240, h: 95, surfaces: [{ x1: -105, x2: 105, y: -88 }],
    art: () => {
      const wd = ST.woodland.wood;
      let s = [-80, 0, 80].map((x) => box(x - 14, -66, 28, 66, 8, dark(wd, x ? 0.05 : 0.12)) + Ln(x - 4, -58, x - 4, -10, dark(wd, 0.3), 2)).join('');
      s += E(0, -74, 118, 18, dark(wd, 0.1)) + R(-118, -84, 236, 10, 0, dark(wd, 0.1)) + E(0, -84, 118, 16, '#e8c49a');
      for (const r of [0.8, 0.6, 0.4, 0.2]) s += E(0, -84, 118 * r, 16 * r, 'none', `stroke="${dark('#e8c49a', 0.2)}" stroke-width="2"`);
      return s + E(70, -10, 8, 9, '#a86b4a') + P('M62 -14 Q70 -24 78 -14Z', '#6b4a3a') + Ln(70, -22, 72, -26, '#6b4a3a', 2);
    },
  },
  {
    s: 'retro', name: 'Kidney Coffee Table', w: 260, h: 90, surfaces: [{ x1: -110, x2: 110, y: -80 }],
    art: (c) => sym((k) => P(`M${84 * k} -70 L${94 * k} -70 L${112 * k} 0 L${104 * k} 0Z`, ST.retro.wood) + P(`M${40 * k} -70 L${50 * k} -70 L${42 * k} 0 L${34 * k} 0Z`, dark(ST.retro.wood, 0.1))) +
      P('M-120 -76 Q-124 -94 -90 -92 Q-40 -88 0 -82 Q40 -94 90 -94 Q126 -92 122 -76 Q118 -64 80 -66 L-80 -66 Q-118 -62 -120 -76Z', c) +
      P('M-110 -82 Q-90 -90 -50 -86', 'none', 'stroke="#fff" stroke-width="3" opacity="0.5"') + P(starD(60, -78, 7, 0.3, 4), ST.retro.trim) + P(starD(-60, -76, 5, 0.3, 4), ST.retro.accent),
  },
]);

const SIDES = series('sidetable', 'Side Tables', 'living', 'floor', [
  {
    s: 'sweet', name: 'Ruffle Side Table', w: 110, h: 115, surfaces: [{ x1: -48, x2: 48, y: -110 }],
    art: (c) => {
      let s = P('M-44 -104 L44 -104 L54 -4 L-54 -4Z', c) + P('M-44 -104 L44 -104 L54 -4 L-54 -4Z', 'url(#g-shadeX)');
      for (let x = -54; x < 54; x += 18) s += P(`M${x} -6 Q${x + 9} 6 ${x + 18} -6Z`, light(c, 0.2));
      return s + E(0, -106, 50, 8, light(c, 0.3)) + bowG(0, -96, 0.45, '#fff') + Ln(-30, -90, -36, -12, dark(c, 0.1), 2) + Ln(30, -90, 36, -12, dark(c, 0.1), 2);
    },
  },
  {
    s: 'modern', name: 'Tulip Side Table', w: 110, h: 105, surfaces: [{ x1: -48, x2: 48, y: -100 }],
    art: (c) => E(0, -4, 36, 6, c) + P('M-8 -88 Q-6 -30 -30 -6 H30 Q6 -30 8 -88Z', c) + P('M-8 -88 Q-6 -30 -30 -6 H30 Q6 -30 8 -88Z', 'url(#g-shadeX)') + E(0, -94, 52, 9, dark(c, 0.1)) + E(0, -98, 52, 8, light(c, 0.2)),
  },
  {
    s: 'woodland', name: 'Toadstool Table', w: 120, h: 120, surfaces: [{ x1: -50, x2: 50, y: -110 }],
    art: (c) => box(-18, -78, 36, 78, 12, '#fff3e6') + E(0, -2, 26, 5, '#e8d6c0') + P('M-58 -78 Q-60 -116 0 -116 Q60 -116 58 -78Z', c) + P('M-58 -78 Q-60 -116 0 -116 Q60 -116 58 -78Z', 'url(#g-shadeX)') +
      C(-30, -92, 7, '#fff') + C(8, -102, 8, '#fff') + C(36, -88, 5, '#fff') + E(0, -78, 58, 6, dark(c, 0.15)) + C(-6, -40, 2.5, INK) + C(6, -40, 2.5, INK) + S('M-4 -34 Q0 -30 4 -34', INK, 1.6),
  },
  {
    s: 'space', name: 'Rocket Side Table', w: 120, h: 135, surfaces: [{ x1: -44, x2: 44, y: -128 }],
    art: (c) => sym((k) => P(`M${28 * k} -48 L${52 * k} -12 L${52 * k} 0 L${28 * k} -14Z`, '#ff7a6b')) + box(-30, -110, 60, 104, 26, ST.space.metal) + C(0, -70, 14, c) + C(0, -70, 10, '#7cc8ff') + C(-3, -73, 3, '#fff') +
      E(0, -122, 44, 8, dark(c, 0.1)) + E(0, -126, 44, 7, c) + R(-4, -118, 8, 10, 2, '#ff7a6b') + P(starD(26, -96, 5), ST.space.accent),
  },
]);

const TVSTANDS = series('tvstand', 'TV Stands', 'living', 'floor', [
  {
    s: 'modern', name: 'Slatted Media Console', w: 270, h: 95, surfaces: [{ x1: -130, x2: 130, y: -88 }],
    art: (c) => {
      let s = box(-132, -88, 264, 62, 4, c) + R(-132, -88, 264, 5, 2, ST.modern.wood);
      for (let x = -120; x < -20; x += 8) s += Ln(x, -78, x, -34, dark(c, 0.12), 3);
      for (let x = 28; x < 124; x += 8) s += Ln(x, -78, x, -34, dark(c, 0.12), 3);
      s += R(-14, -80, 28, 20, 3, light(c, 0.2)) + R(-14, -56, 28, 20, 3, light(c, 0.2)) + R(-5, -71, 10, 3, 1.5, ST.modern.accent) + R(-5, -47, 10, 3, 1.5, ST.modern.accent);
      return s + S('M-40 -30 Q-30 -10 -50 0', INK, 2) + sym((k) => Ln(112 * k, -28, 118 * k, 0, ST.modern.trim, 6));
    },
  },
  {
    s: 'cottage', name: 'Painted Console', w: 260, h: 110, surfaces: [{ x1: -126, x2: 126, y: -104 }],
    art: (c) => {
      const wd = ST.cottage.wood;
      let s = box(-120, -98, 240, 82, 8, c) + R(-128, -106, 256, 12, 6, wd) + hi(-110, -104, 120, 3, 0.35);
      s += sym((k) => box(k > 0 ? 8 : -110, -88, 102, 56, 6, light(c, 0.2)) + R(k > 0 ? 18 : -100, -80, 82, 40, 4, 'none', `stroke="${dark(c, 0.12)}" stroke-width="2"`) + flowerG(16 * k, -60, 7, '#ff9ec7') + flowerG(60 * k, -60, 9, '#fff'));
      s += P('M-120 -18 Q-90 -6 -60 -16 Q0 -2 60 -16 Q90 -6 120 -18 V-16 H-120Z', c);
      return s + sym((k) => P(`M${104 * k} -18 Q${112 * k} -8 ${106 * k} 0 L${116 * k} 0 Q${120 * k} -10 ${116 * k} -18Z`, wd));
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Cubby Stand', w: 270, h: 105, surfaces: [{ x1: -130, x2: 130, y: -100 }],
    art: (c) => {
      let s = box(-134, -100, 268, 96, 10, '#fff') + R(-134, -100, 268, 8, 4, c);
      [RB[0], RB[2], RB[3], RB[4]].forEach((col, i) => { s += R(-124 + i * 63, -86, 57, 72, 6, col) + R(-124 + i * 63, -86, 57, 72, 6, 'url(#g-shadeY)'); });
      s += books(-118, -74, -18, 52, 0) + C(-32, -36, 16, '#fff') + P('M-48 -36 Q-32 -28 -16 -36', 'none', 'stroke="#ff7eb6" stroke-width="3"') + C(-38, -42, 4, '#fff', 'opacity="0.6"');
      s += R(14, -40, 22, 22, 3, '#ff7eb6') + R(38, -40, 22, 22, 3, '#7cc8ff') + R(26, -62, 22, 22, 3, '#ffd36b') + `<text x="37" y="-45" ${FONT} font-size="14" fill="#fff" text-anchor="middle">A</text>`;
      return s + E(97, -24, 20, 8, '#c99bff') + E(97, -32, 16, 10, '#fff') + C(90, -34, 2, INK) + C(104, -34, 2, INK) + C(97, -42, 6, '#fff');
    },
  },
  {
    s: 'space', name: 'Mission Control Stand', w: 270, h: 105, surfaces: [{ x1: -128, x2: 128, y: -96 }],
    art: (c) => {
      let s = box(-130, -96, 260, 80, 12, ST.space.metal) + R(-130, -96, 260, 80, 12, 'url(#g-shine)') + box(-118, -84, 140, 54, 8, c);
      const cols = ['#ff7eb6', '#ffe680', '#7fe0b0', '#7cc8ff'];
      for (let i = 0; i < 8; i++) s += `<circle cx="${-104 + (i % 4) * 22}" cy="${-70 + Math.floor(i / 4) * 24}" r="6" fill="${cols[(i * 3) % 4]}">${pulse(1, 0.35, 1 + (i % 3) * 0.4, i * 0.2)}</circle>`;
      s += C(66, -58, 22, '#1d1a3a') + C(66, -58, 18, '#2a2850') + S('M66 -58 L78 -68', '#7fe0b0', 3) + C(66, -58, 3, '#7fe0b0') + R(98, -78, 18, 40, 4, '#1d1a3a') + R(102, -74, 10, 12, 2, '#ffe680');
      return s + sym((k) => R(110 * k - 10, -18, 20, 18, 4, '#9aa3b5'));
    },
  },
  {
    s: 'retro', name: 'Vintage Credenza', w: 280, h: 100, surfaces: [{ x1: -134, x2: 134, y: -94 }],
    art: (c) => {
      const wd = ST.retro.wood;
      let s = box(-136, -94, 272, 62, 6, wd) + R(-128, -86, 168, 46, 4, c);
      for (let x = -120; x < 36; x += 28) s += P(`M${x} -63 L${x + 14} -80 L${x + 28} -63 L${x + 14} -46Z`, light(c, 0.25));
      s += R(46, -86, 82, 46, 4, dark(wd, 0.35));
      for (let i = 0; i < 6; i++) s += R(52 + i * 12, -82, 9, 40, 2, ['#2d2a3a', '#ff7a6b', '#2d2a3a', '#5fd3b5', '#2d2a3a', '#ffd36b'][i]);
      s += R(-44, -66, 3, 8, 1.5, ST.retro.trim) + R(-40, -66, 3, 8, 1.5, ST.retro.trim);
      return s + sym((k) => P(`M${112 * k} -32 L${122 * k} -32 L${134 * k} 0 L${126 * k} 0Z`, dark(wd, 0.12)) + R(130 * k - 4, -5, 8, 5, 2, '#ffd36b'));
    },
  },
]);

const FIREPLACES = series('fireplace', 'Fireplaces', 'living', 'floor', [
  {
    s: 'princess', name: 'Marble Palace Fireplace', w: 310, h: 300, toggle: true, surfaces: [{ x1: -150, x2: 150, y: -262 }],
    art: (c, on) => {
      let s = box(-140, -254, 280, 254, 8, '#fdf8fb') + S('M-120 -230 Q-90 -200 -110 -160 M100 -220 Q120 -180 96 -140 M-60 -246 Q-30 -236 -20 -250', '#e6d4ea', 2.5);
      s += sym((k) => box(k > 0 ? 100 : -132, -240, 32, 240, 6, '#fff') + R(k > 0 ? 96 : -136, -240, 40, 12, 4, GOLD) + R(k > 0 ? 96 : -136, -14, 40, 12, 4, GOLD) + Ln(116 * k, -222, 116 * k, -20, '#f0e6f2', 3));
      s += R(-154, -270, 308, 18, 7, '#fff') + R(-154, -254, 308, 6, 3, GOLD) + motif('crown', 0, -232, 16);
      s += cloth('M-84 0 V-150 Q-84 -196 0 -196 Q84 -196 84 -150 V0Z', c) + P('M-70 0 V-146 Q-70 -182 0 -182 Q70 -182 70 -146 V0Z', '#3a2a35');
      s += fire(on, 0, -6, 0.95);
      return s + S('M-60 -6 V-30 M-30 -6 V-34 M0 -6 V-36 M30 -6 V-34 M60 -6 V-30 M-64 -30 Q0 -44 64 -30', GOLD, 4);
    },
  },
  {
    s: 'cottage', name: 'Stone Cottage Fireplace', w: 300, h: 280, toggle: true, surfaces: [{ x1: -148, x2: 148, y: -250 }],
    art: (c, on) => {
      let s = box(-140, -244, 280, 244, 10, '#cfc3c0');
      const stones = ['#e6ddd8', '#d9cfc9', '#f0e9e4', '#c9bdb6'];
      let i = 0;
      for (let y = -230; y < 0; y += 26) for (let x = -128 + ((y / 26) % 2 ? 0 : 18); x < 128; x += 40, i++) {
        if (Math.abs(x) < 92 && y > -200) continue;
        s += E(x + 14, y + 10, 18, 11, stones[i % 4]) + E(x + 10, y + 6, 8, 3, '#fff', 'opacity="0.4"');
      }
      s += box(-152, -262, 304, 26, 6, ST.cottage.wood) + Ln(-130, -250, -60, -250, dark(ST.cottage.wood, 0.25), 2) + Ln(20, -246, 110, -246, dark(ST.cottage.wood, 0.25), 2);
      s += P('M-92 0 V-140 Q-92 -200 0 -200 Q92 -200 92 -140 V0Z', '#a89a96') + P('M-78 0 V-136 Q-78 -186 0 -186 Q78 -186 78 -136 V0Z', '#3a2a35');
      s += fire(on, 0, -6, 1);
      return s + R(-110, -232, 40, 10, 3, c) + R(-104, -228, 6, 6, 1, '#fff') + flowerG(96, -238, 10, c) + flowerG(116, -234, 8, '#fff');
    },
  },
  {
    s: 'modern', name: 'Linear Fireplace', w: 330, h: 190, toggle: true, surfaces: [{ x1: -160, x2: 160, y: -184 }],
    art: (c, on) => {
      let s = box(-160, -184, 320, 184, 6, c) + R(-164, -190, 328, 10, 3, ST.modern.wood) + R(-120, -110, 240, 70, 6, '#2d2a3a');
      for (let x = -110; x <= 110; x += 10) s += C(x, -48, 5, ['#9aa3b5', '#c9cfdd', '#7cc8ff'][Math.abs(x / 10) % 3]);
      if (on) s += E(0, -76, 130, 50, 'url(#g-glow)') + [-90, -54, -18, 18, 54, 90].map((x, i) => cflame(x, -50, 1 + (i % 2) * 0.3, '#ff8a3d', '#ffd84a', 0.4 + (i % 3) * 0.1)).join('');
      return s + R(-120, -110, 240, 70, 6, 'url(#g-glass)') + R(-130, -120, 260, 90, 8, 'none', `stroke="${ST.modern.accent}" stroke-width="5"`);
    },
  },
  {
    s: 'retro', name: 'Cone Fireplace', w: 220, h: 340, toggle: true,
    art: (c, on) => {
      let s = R(-14, -340, 28, 170, 4, c) + R(-14, -340, 28, 170, 4, 'url(#g-shadeX)');
      s += sym((k) => Ln(40 * k, -40, 70 * k, 0, INK, 6)) + Ln(0, -40, 0, 0, INK, 6);
      s += cloth('M-20 -180 L20 -180 L100 -90 Q100 -40 0 -40 Q-100 -40 -100 -90Z', c) + P('M-74 -84 Q-74 -54 0 -54 Q74 -54 74 -84 Q60 -120 0 -120 Q-60 -120 -74 -84Z', '#3a2a35');
      if (on) s += glow(0, -80, 90) + flame(-24, -60, 1) + flame(22, -60, 0.9) + flame(0, -62, 1.3);
      s += R(-40, -66, 80, 10, 5, '#8a5a3c') + S('M-100 -90 Q0 -70 100 -90', ST.retro.trim, 5);
      return s + C(-60, -138, 5, ST.retro.trim) + C(60, -138, 5, ST.retro.trim);
    },
  },
  {
    s: 'candy', name: 'Gingerbread Fireplace', w: 310, h: 290, toggle: true, surfaces: [{ x1: -150, x2: 150, y: -262 }],
    art: (c, on) => {
      const gb = '#c98a5a';
      let s = box(-136, -252, 272, 252, 10, gb);
      for (let x = -136; x < 136; x += 17) s += P(`M${x} -252 Q${x + 8.5} -230 ${x + 17} -252Z`, '#fff');
      s += box(-154, -270, 308, 22, 10, c) + `<g>${[-110, -60, 60, 110].map((x, i) => P(`M${x - 12} -270 Q${x} -296 ${x + 12} -270Z`, RB[i + 1])).join('')}</g>`;
      s += sym((k) => {
        let cane = R(118 * k - 9, -240, 18, 240, 9, '#fff');
        for (let y = -232; y < -4; y += 22) cane += P(`M${118 * k - 9} ${y} L${118 * k + 9} ${y - 10} L${118 * k + 9} ${y - 2} L${118 * k - 9} ${y + 8}Z`, '#ff4f6d');
        return cane;
      });
      s += P('M-80 0 V-140 Q-80 -190 0 -190 Q80 -190 80 -140 V0Z', '#fff') + P('M-70 0 V-138 Q-70 -180 0 -180 Q70 -180 70 -138 V0Z', '#3a2a35');
      s += fire(on, 0, -6, 0.9) + C(-50, -212, 11, '#fff') + C(-50, -212, 7, '#ff4f6d') + C(50, -212, 11, '#fff') + C(50, -212, 7, '#7fe0b0') + P(heartD(0, -226, 26), c);
      return s;
    },
  },
  {
    s: 'space', name: 'Plasma Hearth', w: 280, h: 270, toggle: true, surfaces: [{ x1: -120, x2: 120, y: -262 }],
    art: (c, on) => {
      let s = box(-124, -262, 248, 262, 30, ST.space.metal) + R(-124, -262, 248, 262, 30, 'url(#g-shine)') + box(-108, -246, 216, 230, 22, c, 'stars');
      s += C(0, -126, 84, '#c9cfdd') + C(0, -126, 74, '#1d1a3a');
      if (on) s += cglow(0, -110, 80, '#c99bff', 2) + cflame(-28, -76, 1.6, '#9b6bff', '#7cc8ff', 0.5) + cflame(30, -76, 1.5, '#ff7eb6', '#c99bff', 0.45) + cflame(0, -74, 2.2, '#7cc8ff', '#ffffff', 0.55);
      s += E(0, -70, 50, 8, '#4a4a6e') + C(0, -126, 74, 'url(#g-glass)');
      for (let i = 0; i < 8; i++) s += C(Math.cos(i * 0.785) * 79, -126 + Math.sin(i * 0.785) * 79, 3, '#9aa3b5');
      return s + `<circle cx="-84" cy="-236" r="5" fill="#7fe0b0">${pulse(1, 0.3, 1.4)}</circle>` + `<circle cx="84" cy="-236" r="5" fill="#ff7eb6">${pulse(1, 0.3, 1.4, 0.7)}</circle>`;
    },
  },
]);

const BOOKCASES = series('bookcase', 'Bookcases', 'living', 'floor', [
  {
    s: 'sweet', name: 'Scalloped Bookcase', w: 200, h: 300, surfaces: [{ x1: -90, x2: 90, y: -268 }],
    art: (c) => {
      let s = box(-96, -268, 192, 260, 10, c);
      for (let x = -96; x < 96; x += 32) s += P(`M${x} -266 A16 16 0 0 1 ${x + 32} -266Z`, c) + C(x + 16, -272, 4, '#fff');
      s += R(-84, -256, 168, 236, 6, dark(c, 0.2));
      for (let r = 0; r < 3; r++) s += R(-84, -184 + r * 78, 168, 8, 3, light(c, 0.2));
      s += books(-80, 20, -186, 60, 0) + P(heartD(50, -226, 28), '#ff4f8b') + R(44, -200, 12, 14, 3, '#fff');
      s += books(-80, -10, -108, 56, 3) + C(36, -132, 20, '#c98a5a') + C(22, -150, 8, '#c98a5a') + C(50, -150, 8, '#c98a5a') + E(36, -126, 9, 7, '#e8c0a0') + C(30, -136, 2, INK) + C(42, -136, 2, INK);
      s += books(-20, 80, -30, 58, 5) + P(starD(-52, -50, 16), '#ffd36b');
      return s + C(-84, -4, 8, GOLD) + C(84, -4, 8, GOLD);
    },
  },
  {
    s: 'modern', name: 'Cube Grid Shelf', w: 220, h: 230, surfaces: [{ x1: -105, x2: 105, y: -226 }],
    art: (c) => {
      let s = box(-106, -226, 212, 220, 4, c);
      const cell = (i: number, j: number) => [-98 + i * 68, -218 + j * 70] as const;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const [x, y] = cell(i, j); s += R(x, y, 64, 64, 2, dark(c, 0.18)); }
      s += books(-94, -40, -156, 56, 1) + books(-26, 30, -16, 56, 4) + books(42, 100, -86, 54, 6);
      s += R(48, -184, 22, 34, 6, '#fff') + S('M59 -184 Q50 -210 44 -214 M59 -184 Q66 -208 74 -212 M59 -184 V-214', '#5fae6b', 3) + R(-26, -116, 52, 30, 4, ST.modern.accent) + R(-20, -110, 40, 18, 2, '#9fd6ff');
      return s + C(-66, -48, 14, '#ffd36b') + C(-66, -48, 6, '#fff', 'opacity="0.6"') + R(-14, -196, 24, 34, 10, '#ff7eb6') + R(-6, -204, 8, 10, 2, '#ff7eb6') + R(-6, -24, 2, 2, 1, '#fff');
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Arch Bookcase', w: 220, h: 300, surfaces: [],
    art: () => {
      let s = P('M-104 0 V-190 A104 104 0 0 1 104 -190 V0Z', '#fff') + P('M-104 0 V-190 A104 104 0 0 1 104 -190 V0Z', 'url(#g-shadeX)');
      s += P('M-92 -200 A92 92 0 0 1 92 -200Z', RB[5]) + books(-60, 60, -204, 44, 2);
      [0, 1, 2, 3].forEach((r) => { s += R(-92, -196 + r * 48, 184, 44, 4, RB[r]) + R(-92, -196 + r * 48, 184, 44, 4, 'url(#g-shadeY)') + books(-86, 86, -152 + r * 48, 36, r * 3); });
      return s + R(-104, -8, 208, 8, 3, '#e6dce8');
    },
  },
  {
    s: 'space', name: 'Rocket Bookcase', w: 220, h: 340, surfaces: [],
    art: (c) => {
      let s = sym((k) => P(`M${64 * k} -110 L${108 * k} -40 L${108 * k} 0 L${64 * k} -20Z`, '#ff7a6b'));
      s += cloth('M-70 0 V-220 Q-70 -300 0 -336 Q70 -300 70 -220 V0Z', ST.space.metal) + C(0, -262, 22, c) + C(0, -262, 16, '#7cc8ff') + C(-5, -267, 4, '#fff');
      for (let r = 0; r < 3; r++) s += R(-58, -220 + r * 70, 116, 62, 6, c) + R(-58, -164 + r * 70, 116, 6, 2, dark(ST.space.metal, 0.1)) + books(-52, 52, -164 + r * 70, 48, r * 2);
      return s + R(-30, -6, 60, 6, 3, '#ffab3d') + P(starD(48, -240, 7), ST.space.accent);
    },
  },
  {
    s: 'woodland', name: 'Tree Bookcase', w: 260, h: 340, surfaces: [],
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = C(-70, -270, 52, c) + C(0, -296, 60, light(c, 0.08)) + C(74, -268, 52, c) + C(-30, -250, 50, dark(c, 0.05)) + C(36, -248, 50, dark(c, 0.03));
      s += P('M-34 0 Q-26 -120 -30 -240 H30 Q26 -120 34 0Z', wd) + E(0, -190, 12, 16, dark(wd, 0.4)) + C(-4, -194, 4, '#ffd36b') + C(5, -194, 4, '#ffd36b') + C(-4, -194, 1.6, INK) + C(5, -194, 1.6, INK);
      s += sym((k) => R(k > 0 ? 26 : -120, -150, 94, 10, 5, wd) + R(k > 0 ? 26 : -120, -76, 94, 10, 5, wd) + Ln(30 * k, -150, 60 * k, -170, wd, 8));
      s += books(-112, -40, -150, 46, 1) + books(36, 110, -76, 44, 4) + C(70, -164, 14, ST.woodland.accent) + R(66, -180, 8, 8, 2, '#5fae6b') + books(-112, -50, -76, 40, 6);
      return s + C(-70, -290, 5, '#e8384f') + C(60, -280, 5, '#e8384f') + C(10, -320, 5, '#e8384f');
    },
  },
]);

const CURIOS = series('curio', 'Display Cabinets', 'living', 'floor', [
  {
    s: 'princess', name: 'Crown Curio Cabinet', w: 190, h: 320,
    art: (c) => {
      let s = cloth('M-86 -10 V-260 Q-86 -296 0 -300 Q86 -296 86 -260 V-10Z', '#fff') + motif('crown', 0, -292, 16);
      s += R(-74, -264, 148, 236, 8, light(c, 0.55));
      for (let r = 0; r < 3; r++) s += R(-74, -190 + r * 74, 148, 5, 2, '#fff');
      s += G(E(-30, -200, 14, 8, '#fff') + P('M-44 -204 Q-30 -186 -16 -204Z', c) + E(-30, -192, 18, 3, '#fff')) + P(heartD(34, -230, 26), '#ff4f8b');
      s += motif('gem', -30, -136, 16) + R(20, -146, 26, 30, 4, '#c99bff') + C(33, -150, 6, '#ff9ec7');
      s += motif('unicorn', -24, -66, 22) + E(36, -46, 16, 6, '#ffd36b');
      s += R(-74, -264, 148, 236, 8, 'url(#g-glass)') + Ln(0, -264, 0, -28, '#fff', 4) + C(-8, -150, 4, GOLD) + C(8, -150, 4, GOLD);
      return s + sym((k) => P(`M${70 * k} -12 Q${82 * k} -6 ${76 * k} 0 L${88 * k} 0 Q${90 * k} -8 ${82 * k} -12Z`, GOLD));
    },
  },
  {
    s: 'cottage', name: 'Plate Hutch', w: 210, h: 310, surfaces: [{ x1: -100, x2: 100, y: -120 }],
    art: (c) => {
      const wd = ST.cottage.wood;
      let s = box(-90, -304, 180, 190, 8, c) + R(-98, -310, 196, 12, 5, wd) + R(-78, -290, 156, 170, 4, light(c, 0.3)) + R(-78, -210, 156, 6, 2, c);
      [[-50, '#ff9ec7'], [0, '#7cc8ff'], [50, '#ffd36b']].forEach(([x, col]) => { s += C(x as number, -248, 22, '#fff') + C(x as number, -248, 15, col as string) + C(x as number, -248, 8, '#fff'); });
      s += G(E(-40, -172, 16, 10, '#fff') + S('M-24 -176 q10 2 4 10', '#fff', 3)) + G(E(30, -170, 18, 12, '#fff') + flowerG(30, -170, 6, '#ff9ec7'));
      s += box(-100, -124, 200, 120, 8, c) + R(-104, -126, 208, 10, 5, wd);
      s += sym((k) => box(k > 0 ? 6 : -88, -108, 82, 90, 6, light(c, 0.15)) + flowerG(16 * k, -64, 6, '#ff9ec7'));
      return s + R(-96, -8, 16, 8, 3, wd) + R(80, -8, 16, 8, 3, wd);
    },
  },
  {
    s: 'candy', name: 'Candy Jar Cabinet', w: 190, h: 290,
    art: (c) => {
      let s = box(-88, -280, 176, 272, 14, c) + R(-76, -268, 152, 246, 8, '#fff7fb');
      for (let r = 0; r < 3; r++) s += R(-76, -196 + r * 80, 152, 6, 3, light(c, 0.3));
      const jar = (x: number, y: number, col: string) => R(x - 18, y - 52, 36, 50, 10, '#fff', 'opacity="0.7"') + R(x - 14, y - 34, 28, 30, 6, col) +
        C(x - 6, y - 26, 4, '#fff', 'opacity="0.6"') + C(x + 5, y - 16, 4, '#fff', 'opacity="0.5"') + R(x - 14, y - 58, 28, 8, 4, ST.candy.trim);
      s += jar(-40, -196, '#ff7eb6') + jar(10, -196, '#7fe0b0') + jar(-20, -116, '#ffd36b') + jar(36, -116, '#c99bff') + jar(-42, -36, '#7cc8ff');
      s += motif('candy', 50, -230, 16) + motif('donut', 30, -60, 18);
      return s + R(-76, -268, 152, 246, 8, 'url(#g-glass)') + C(-88, -4, 7, ST.candy.trim) + C(88, -4, 7, ST.candy.trim);
    },
  },
]);

const PIANOS = series('piano', 'Pianos & Keyboards', 'living', 'floor', [
  {
    s: 'sweet', name: 'Pink Upright Piano', w: 240, h: 240, sfx: 'note', surfaces: [{ x1: -112, x2: 112, y: -232 }],
    art: (c) => {
      let s = box(-112, -232, 224, 224, 14, c) + R(-118, -238, 236, 14, 7, light(c, 0.25)) + box(-96, -214, 192, 84, 10, light(c, 0.15));
      s += P(heartD(0, -206, 56), '#fff', 'opacity="0.5"') + R(-40, -184, 80, 44, 3, '#fff') + S('M-30 -172 H30 M-30 -164 H30 M-30 -156 H30', '#ffb3c7', 1.5) + noteG(-10, -158, INK);
      s += R(-110, -126, 220, 10, 4, dark(c, 0.15)) + keys(-104, -118, 208, 30, 14);
      return s + R(-110, -86, 220, 6, 3, dark(c, 0.1)) + box(-84, -66, 168, 44, 10, light(c, 0.08)) + sym((k) => R(98 * k - 7, -14, 14, 14, 5, GOLD));
    },
  },
  {
    s: 'princess', name: 'White Grand Piano', w: 360, h: 290, sfx: 'note',
    art: (c) => {
      let s = P('M-160 -122 L-150 -270 L40 -190 Z', '#fff') + P('M-160 -122 L-150 -270 L40 -190 Z', 'url(#g-shadeX)') + Ln(-150, -122, -60, -230, GOLD, 4);
      s += cloth('M-170 -130 H120 Q174 -130 172 -100 Q170 -80 120 -80 H-170Z', '#fff') + R(-170, -96, 340, 10, 4, GOLD);
      s += keys(-160, -130, 150, 22, 14) + R(-164, -136, 158, 6, 3, c);
      s += sym((k) => P(`M${140 * k} -80 Q${150 * k} -40 ${136 * k} -10 L${150 * k} 0 L${126 * k} 0 Q${132 * k} -40 ${126 * k} -80Z`, '#fff') + E(138 * k, -2, 10, 3, GOLD)) + P('M-12 -80 Q-4 -40 -16 0 H12 Q4 -40 12 -80Z', '#fff');
      return s + R(-14, -40, 28, 8, 3, GOLD) + R(-148, -164, 40, 30, 3, '#fff7fb') + noteG(-132, -142, '#ff7eb6') + motif('crown', 120, -110, 10);
    },
  },
  {
    s: 'modern', name: 'Keyboard on Stand', w: 250, h: 150, sfx: 'note',
    art: (c) => {
      let s = Ln(-70, -96, 70, 0, INK, 7) + Ln(70, -96, -70, 0, INK, 7) + C(0, -48, 6, '#4a4a5e');
      s += box(-120, -140, 240, 44, 10, c) + R(-112, -134, 70, 12, 3, '#2d2a3a') + keys(-112, -118, 224, 18, 22, INK);
      for (let i = 0; i < 4; i++) s += `<circle cx="${-30 + i * 14}" cy="-128" r="3.5" fill="${RB[i * 2 % 6]}">${pulse(1, 0.4, 1.2, i * 0.3)}</circle>`;
      return s + C(80, -128, 5, '#9aa3b5') + C(98, -128, 5, '#9aa3b5') + R(-108, -132, 24, 8, 2, '#7fe0b0', 'opacity="0.8"');
    },
  },
  {
    s: 'rainbow', name: 'Rainbow Toy Piano', w: 180, h: 135, sfx: 'note', surfaces: [{ x1: -80, x2: 80, y: -128 }],
    art: (c) => {
      let s = box(-84, -128, 168, 92, 20, c) + R(-84, -128, 168, 92, 20, 'url(#g-shine)') + keys(-72, -84, 144, 32, 8, INK, RB);
      s += P(starD(-50, -108, 10), '#fff') + P(heartD(50, -118, 18), '#ff7eb6') + `<text x="0" y="-100" ${FONT} font-size="16" fill="#fff" text-anchor="middle">do re mi</text>`;
      return s + sym((k) => R(66 * k - 8, -40, 16, 40, 6, dark(c, 0.15)) + C(66 * k, -4, 9, RB[k > 0 ? 4 : 0]));
    },
  },
]);

const TANKS = series('fishtank', 'Fish Tanks', 'living', 'floor', [
  {
    s: 'princess', name: 'Castle Fishbowl', w: 180, h: 260,
    art: () => {
      let s = P('M-24 -100 L24 -100 L40 -14 L-40 -14Z', GOLD) + E(0, -10, 56, 10, GOLD) + C(0, -170, 76, '#bfe8ff') + E(0, -236, 50, 12, '#fff', 'opacity="0.6"');
      s += P('M-60 -120 Q0 -100 60 -120 Q50 -96 0 -94 Q-50 -96 -60 -120Z', '#ffd9e8') + P('M-24 -112 V-150 H-16 V-160 H-8 V-150 H8 V-160 H16 V-150 H24 V-112Z', '#fff') + P('M-6 -150 L0 -170 L6 -150Z', '#ff7eb6') + R(-5, -126, 10, 14, 5, '#ff7eb6');
      s += `<g>${bob(40, 6, 4)}<g transform="translate(-36 -190)">${E(0, 0, 14, 9, '#ffab3d')}${P('M-12 0 L-24 -9 L-24 9Z', '#ffab3d')}${C(6, -2, 2, INK)}</g></g>`;
      s += `<g>${bob(-30, -8, 5, 1)}<g transform="translate(30 -150) scale(-1 1)">${E(0, 0, 11, 7, '#ff7eb6')}${P('M-10 0 L-20 -7 L-20 7Z', '#ff7eb6')}${C(5, -2, 1.8, INK)}</g></g>`;
      s += [-10, 14].map((x, i) => `<circle cx="${x}" cy="-120" r="3.5" fill="#fff" opacity="0.7"><animate attributeName="cy" values="-120;-236" dur="${2.5 + i}s" repeatCount="indefinite"/></circle>`).join('');
      return s + C(0, -170, 76, 'url(#g-glass)') + E(0, -244, 46, 8, 'none', 'stroke="#fff" stroke-width="4" opacity="0.8"');
    },
  },
  {
    s: 'beach', name: 'Coral Reef Tank', w: 260, h: 250, surfaces: [{ x1: -118, x2: 118, y: -244 }],
    art: (c) => {
      let s = box(-116, -88, 232, 84, 10, ST.beach.wood) + R(-104, -76, 100, 60, 6, light(ST.beach.wood, 0.3)) + R(4, -76, 100, 60, 6, light(ST.beach.wood, 0.3)) + C(-14, -46, 4, '#c9cfdd') + C(14, -46, 4, '#c9cfdd');
      s += R(-120, -244, 240, 158, 12, c) + R(-120, -244, 240, 158, 12, 'url(#g-shadeY)') + R(-120, -244, 240, 16, 8, '#fff');
      s += P('M-118 -96 Q-80 -110 -40 -98 Q0 -112 40 -98 Q80 -110 118 -98 V-88 H-118Z', '#f4dca0');
      s += S('M-80 -98 V-140 M-80 -124 L-96 -146 M-80 -118 L-62 -150', '#ff7eb6', 8) + S('M70 -98 V-130 M70 -116 L86 -140 M70 -112 L54 -134', '#ffab5e', 7) + C(10, -104, 10, '#c99bff') + C(26, -102, 7, '#ff9ec7');
      s += S('M-30 -100 Q-40 -140 -26 -170 Q-18 -190 -28 -210', '#3fbf8f', 5);
      const fish = (y: number, col: string, dur: number, dir: number) => `<g><animateTransform attributeName="transform" type="translate" values="${-70 * dir} 0;${70 * dir} 0;${-70 * dir} 0" dur="${dur}s" repeatCount="indefinite"/><g transform="translate(0 ${y}) scale(${dir} 1)">${E(0, 0, 14, 9, col)}${P('M-12 0 L-24 -9 L-24 9Z', col)}${R(-4, -9, 3, 18, 1.5, '#fff', 'opacity="0.8"')}${C(6, -2, 2, INK)}</g></g>`;
      s += fish(-190, '#ffab3d', 7, 1) + fish(-150, '#ffd36b', 6, -1) + fish(-210, '#7cc8ff', 9, -1);
      return s + R(-120, -244, 240, 158, 12, 'url(#g-glass)');
    },
  },
  {
    s: 'space', name: 'Jellyfish Bubble Tube', w: 130, h: 320, toggle: true,
    art: (c, on) => {
      let s = box(-54, -40, 108, 40, 10, ST.space.metal) + box(-54, -320, 108, 22, 10, ST.space.metal) + R(-44, -300, 88, 262, 10, on ? '#7a6ad8' : c);
      if (on) s += cglow(0, -170, 90, '#c99bff');
      for (let i = 0; i < 7; i++) s += `<circle cx="${-28 + (i * 13) % 56}" cy="-50" r="${3 + (i % 3)}" fill="#fff" opacity="0.6"><animate attributeName="cy" values="-50;-296" dur="${2 + (i % 4) * 0.7}s" begin="${f(i * 0.4)}s" repeatCount="indefinite"/></circle>`;
      const jelly = (x: number, y: number, col: string, d: number) => `<g>${bob(0, -40, d)}${P(`M${x - 16} ${y} Q${x - 16} ${y - 20} ${x} ${y - 20} Q${x + 16} ${y - 20} ${x + 16} ${y}Z`, col, 'opacity="0.85"')}${S(`M${x - 10} ${y} q-4 12 0 22 M${x} ${y} q4 12 0 24 M${x + 10} ${y} q-4 12 0 22`, col, 2.5, 'opacity="0.8"')}${C(x - 5, y - 8, 1.6, INK)}${C(x + 5, y - 8, 1.6, INK)}</g>`;
      s += jelly(-12, -200, '#ff9ec7', 4) + jelly(16, -120, '#ffe680', 5);
      return s + R(-44, -300, 88, 262, 10, 'url(#g-glass)') + P(starD(0, -309, 6), ST.space.accent);
    },
  },
]);

const CATTREES = series('cattree', 'Cat Trees', 'living', 'floor', [
  {
    s: 'sweet', name: 'Kitty Castle Tree', w: 210, h: 320, surfaces: [{ x1: -90, x2: -10, y: -296 }],
    art: (c) => {
      let s = R(-60, -290, 18, 200, 6, '#e8d6c0') + R(40, -200, 18, 110, 6, '#e8d6c0');
      for (let y = -280; y < -96; y += 10) s += Ln(-60, y, -42, y + 4, dark('#e8d6c0', 0.15), 2);
      s += box(-96, -96, 192, 90, 20, c) + C(0, -52, 26, dark(c, 0.35)) + R(-100, -10, 200, 10, 5, light(c, 0.2));
      s += box(-96, -300, 92, 16, 8, light(c, 0.15)) + box(10, -210, 92, 16, 8, light(c, 0.15)) + kitty(-50, -300, '#ffab5e');
      s += P(heartD(-60, -80, 18), '#fff');
      return s + `<g>${sway(10, 80, -194, 2)}${Ln(80, -194, 80, -150, '#fff', 2)}${C(80, -146, 8, '#ff7eb6')}</g>`;
    },
  },
  {
    s: 'woodland', name: 'Treehouse Cat Tree', w: 230, h: 340, surfaces: [{ x1: 10, x2: 100, y: -230 }],
    art: (c) => {
      const wd = ST.woodland.wood;
      let s = C(-40, -300, 40, c) + C(10, -320, 36, light(c, 0.1)) + C(-70, -270, 30, dark(c, 0.05));
      s += P('M-30 0 Q-20 -150 -26 -290 H6 Q0 -150 10 0Z', wd) + E(-60, -6, 70, 8, '#6fae55');
      for (let y = -280; y < -20; y += 12) s += Ln(-24, y, 4, y + 5, dark(wd, 0.2), 2);
      s += box(4, -234, 100, 18, 9, '#e8c49a') + E(54, -234, 50, 6, '#e8c49a') + kitty(56, -234, '#9aa3b5');
      s += box(-110, -130, 88, 70, 30, wd) + C(-66, -96, 20, dark(wd, 0.45)) + C(-72, -98, 3, '#ffd36b') + C(-60, -98, 3, '#ffd36b');
      return s + box(-110, -136, 88, 12, 6, '#6fae55') + E(70, -6, 40, 6, '#6fae55');
    },
  },
]);

const DIVIDERS = series('divider', 'Room Dividers', 'living', 'floor', [
  {
    s: 'boho', name: 'Rattan Screen', w: 280, h: 300,
    art: (c) => {
      const wd = ST.boho.wood;
      let s = '';
      for (const x of [-132, -44, 44]) {
        s += cloth(`M${x} -8 V-240 Q${x} -290 ${x + 44} -290 Q${x + 88} -290 ${x + 88} -240 V-8Z`, wd);
        s += P(`M${x + 8} -16 V-238 Q${x + 8} -280 ${x + 44} -280 Q${x + 80} -280 ${x + 80} -238 V-16Z`, c);
        for (let y = -250; y < -20; y += 12) s += Ln(x + 12, y, x + 76, y, dark(c, 0.12), 2, 'stroke-dasharray="4 4"');
        s += R(x + 4, -8, 10, 8, 3, dark(wd, 0.2)) + R(x + 74, -8, 10, 8, 3, dark(wd, 0.2));
      }
      return s + motif('sun', 0, -240, 16);
    },
  },
  {
    s: 'princess', name: 'Gilded Folding Screen', w: 280, h: 310,
    art: (c) => {
      let s = '';
      [-132, -44, 44].forEach((x, i) => {
        s += R(x, -300 + (i === 1 ? -0 : 16), 88, 294 - (i === 1 ? 0 : 16), 10, GOLD) + R(x + 8, -290 + (i === 1 ? 0 : 16), 72, 274 - (i === 1 ? 0 : 16), 6, c) + R(x + 8, -290 + (i === 1 ? 0 : 16), 72, 274 - (i === 1 ? 0 : 16), 6, 'url(#p-hearts)');
        s += flowerG(x + 44, -160, 14, '#fff', '#ffd24a') + S(`M${x + 44} -146 Q${x + 34} -100 ${x + 44} -40`, '#5fae6b', 3);
      });
      return s + motif('crown', 0, -318, 16);
    },
  },
  {
    s: 'modern', name: 'Slat Divider', w: 260, h: 300,
    art: (c) => {
      let s = R(-130, -300, 260, 10, 3, ST.modern.trim) + R(-130, -14, 260, 10, 3, ST.modern.trim);
      for (let x = -124; x <= 116; x += 20) s += R(x, -290, 10, 276, 3, c) + R(x, -290, 10, 276, 3, 'url(#g-shadeX)');
      return s + R(-130, -4, 14, 4, 1, INK) + R(116, -4, 14, 4, 1, INK);
    },
  },
]);

// ================= ELECTRONICS =================
const TVS = series('tv', 'TVs', 'electronics', 'floor', [
  {
    s: 'modern', name: 'Big Screen TV', w: 320, h: 260,
    art: (c, on) => R(-6, -90, 12, 80, 3, ST.modern.trim) + E(0, -8, 70, 8, ST.modern.trim) + E(0, -11, 66, 6, c) +
      R(-152, -256, 304, 176, 10, '#2d2a3a') + screen(-144, -248, 288, 160, 'cartoon', on, 6) + R(-20, -82, 40, 4, 2, '#4a4a5e') + `<circle cx="136" cy="-84" r="2.5" fill="${on ? '#7fe0b0' : '#ff7eb6'}"/>`,
  },
  {
    s: 'retro', name: 'Retro Tube TV', w: 230, h: 270,
    art: (c, on) => {
      const wd = ST.retro.wood;
      let s = Ln(-20, -206, -64, -262, '#9aa3b5', 3) + Ln(20, -206, 70, -258, '#9aa3b5', 3) + C(-64, -262, 5, ST.retro.trim) + C(70, -258, 5, ST.retro.trim) + E(0, -206, 22, 8, '#4a4a5e');
      s += sym((k) => P(`M${70 * k} -40 L${82 * k} -40 L${96 * k} 0 L${88 * k} 0Z`, dark(wd, 0.15)));
      s += box(-110, -210, 220, 174, 24, c) + box(-96, -196, 150, 140, 30, '#fff3d6') + screen(-88, -188, 134, 124, 'castle', on, 30);
      return s + C(80, -170, 11, ST.retro.accent) + C(80, -136, 11, ST.retro.trim) + Ln(80, -170, 86, -176, INK, 2) + Ln(80, -136, 74, -142, INK, 2) + [-110, -100, -90, -80, -70].map((y) => Ln(68, y + 20, 92, y + 20, dark(c, 0.2), 2)).join('');
    },
  },
  {
    s: 'princess', name: 'Royal Frame TV', w: 280, h: 200, mount: 'wall',
    art: (c, on) => {
      let s = box(-136, -94, 272, 188, 14, GOLD) + R(-122, -80, 244, 160, 8, c);
      for (const [x, y] of [[-128, -86], [128, -86], [-128, 86], [128, 86]]) s += C(x, y, 10, GOLD) + C(x, y, 4, '#ff7eb6');
      return s + screen(-112, -70, 224, 140, 'castle', on, 4) + motif('crown', 0, -100, 18);
    },
  },
  {
    s: 'space', name: 'Cinema Wall TV', w: 340, h: 200, mount: 'wall',
    art: (c, on) => R(-166, -96, 332, 192, 8, '#1d1a2a') + R(-166, -96, 332, 192, 8, 'none', `stroke="${c}" stroke-width="4"`) + screen(-158, -88, 316, 168, 'space', on, 3) +
      (on ? `<g>${pulse(1, 0.4, 2)}${R(-150, 90, 300, 6, 3, '#c99bff', 'opacity="0.5"')}</g>` : '') + `<circle cx="150" cy="86" r="2.5" fill="${on ? '#7fe0b0' : '#ff7eb6'}"/>`,
  },
  {
    s: 'rainbow', name: 'Chunky Kids TV', w: 200, h: 165, mount: 'prop',
    art: (c, on) => sym((k) => R(70 * k - 10, -22, 20, 22, 8, RB[k > 0 ? 4 : 0])) + box(-96, -160, 192, 142, 32, c) + R(-96, -160, 192, 142, 32, 'url(#p-stripes)', 'opacity="0.5"') +
      R(-80, -146, 160, 114, 22, '#fff') + screen(-72, -138, 144, 98, 'rainbow', on, 16) + C(-80, -26, 5, '#ff7eb6') + C(80, -26, 5, '#7cc8ff'),
  },
  {
    s: 'sweet', name: 'Kitty TV', w: 190, h: 170, mount: 'prop',
    art: (c, on) => P('M-80 -136 L-70 -172 L-44 -146Z', c) + P('M80 -136 L70 -172 L44 -146Z', c) + P('M-72 -142 L-68 -160 L-54 -146Z M72 -142 L68 -160 L54 -146Z', '#fff') +
      box(-88, -152, 176, 136, 40, c) + R(-74, -138, 148, 104, 28, '#fff') + screen(-66, -130, 132, 88, 'ocean', on, 22) + bowG(56, -146, 0.5, '#fff') +
      sym((k) => C(40 * k, -10, 10, light(c, 0.2))) + C(0, -24, 4, dark(c, 0.2)),
  },
], { toggle: true, sfx: 'music' });

const GAMES = series('game', 'Game Consoles', 'electronics', 'prop', [
  {
    s: 'modern', name: 'Game Console', w: 200, h: 70, color: ST.modern.accent,
    art: (c, on) => {
      let s = box(-50, -56, 100, 50, 8, c) + R(-50, -32, 100, 3, 1.5, on ? '#7cc8ff' : '#9aa3b5') + (on ? cglow(0, -31, 26, '#7cc8ff') : '') + C(36, -18, 3, on ? '#7fe0b0' : '#9aa3b5');
      const pad = (x: number, col: string) => P(`M${x - 22} -18 Q${x - 24} -32 ${x - 12} -32 H${x + 12} Q${x + 24} -32 ${x + 22} -18 L${x + 20} -6 Q${x + 18} 0 ${x + 10} -4 L${x + 6} -8 H${x - 6} L${x - 10} -4 Q${x - 18} 0 ${x - 20} -6Z`, col) +
        C(x - 11, -20, 3, '#fff', 'opacity="0.6"') + C(x + 8, -23, 2.4, '#ff7eb6') + C(x + 14, -18, 2.4, '#7fe0b0');
      s += S('M-50 -14 Q-64 -6 -72 -20', '#4a4a5e', 2) + S('M50 -14 Q64 -6 72 -20', '#4a4a5e', 2);
      return s + pad(-74, ST.modern.accent) + pad(74, '#ff7eb6');
    },
  },
  {
    s: 'retro', name: 'Arcade Machine', w: 160, h: 310, mount: 'floor', sfx: 'music',
    art: (c, on) => {
      let s = P('M-70 0 V-200 L-60 -300 H60 L70 -200 V0Z', c) + P('M-70 0 V-200 L-60 -300 H60 L70 -200 V0Z', 'url(#g-shadeX)');
      s += R(-56, -296, 112, 32, 6, '#2d2a3a') + `<text x="0" y="-273" ${FONT} font-size="18" text-anchor="middle" fill="${on ? ST.retro.trim : '#9aa3b5'}">GAME</text>`;
      s += R(-54, -254, 108, 92, 8, '#2d2a3a') + screen(-48, -248, 96, 80, 'game', on, 4);
      s += P('M-70 -150 L70 -150 L76 -120 L-76 -120Z', ST.retro.accent) + Ln(-36, -138, -40, -158, INK, 4) + C(-40, -160, 7, '#e8384f') + C(10, -134, 6, ST.retro.trim) + C(28, -138, 6, '#7cc8ff') + C(46, -134, 6, '#ff7eb6');
      return s + R(-20, -90, 40, 30, 4, '#2d2a3a') + R(-6, -84, 12, 4, 2, ST.retro.trim) + (on ? notes(0, -310) : '');
    },
  },
  {
    s: 'candy', name: 'Handheld Game', w: 80, h: 110,
    art: (c, on) => box(-34, -106, 68, 104, 14, c) + screen(-26, -98, 52, 44, 'game', on, 4) + R(-22, -36, 16, 5, 2, INK) + R(-16.5, -41.5, 5, 16, 2, INK) +
      C(14, -34, 5, ST.candy.trim) + C(24, -42, 5, ST.candy.accent) + R(-10, -16, 8, 4, 2, dark(c, 0.2)) + R(4, -16, 8, 4, 2, dark(c, 0.2)),
  },
  {
    s: 'rainbow', name: 'Light-Up Dance Pad', w: 240, h: 100, mount: 'rug', sfx: 'music',
    art: (c, on) => {
      let s = R(-110, -110, 220, 220, 20, c) + R(-110, -110, 220, 220, 20, 'url(#g-shadeY)');
      const arrow = (rot: number, col: string, i: number) => `<g transform="rotate(${rot})">${R(-30, -100, 60, 60, 10, on ? col : light(col, 0.5))}${on ? `<rect x="-30" y="-100" width="60" height="60" rx="10" fill="#fff">${pulse(0, 0.7, 1, i * 0.25)}</rect>` : ''}${P('M0 -90 L18 -64 H7 V-50 H-7 V-64 H-18Z', '#fff')}</g>`;
      s += arrow(0, RB[0], 0) + arrow(90, RB[2], 1) + arrow(180, RB[3], 2) + arrow(270, RB[4], 3) + C(0, 0, 22, '#fff') + P(starD(0, 0, 14), on ? '#ffd24a' : '#ffe9a6');
      for (const [x, y] of [[-70, -70], [70, -70], [-70, 70], [70, 70]]) s += C(x, y, 12, light(c, 0.3));
      return `<g transform="scale(1 0.4)">${s}</g>`;
    },
  },
], { toggle: true });

const COMPUTERS = series('computer', 'Computers & Laptops', 'electronics', 'prop', [
  {
    s: 'modern', name: 'Laptop', w: 150, h: 100,
    art: (c, on) => P('M-62 -96 H62 Q66 -96 66 -92 V-12 H-66 V-92 Q-66 -96 -62 -96Z', c) + screen(-58, -90, 116, 74, 'desktop', on, 3) +
      P('M-76 -12 H76 L70 0 H-70Z', light(c, 0.15)) + R(-14, -9, 28, 3, 1.5, dark(c, 0.15)) + C(0, -93, 1.5, INK),
  },
  {
    s: 'sweet', name: 'Sticker Laptop', w: 150, h: 100,
    art: (c, on) => P('M-62 -96 H62 Q66 -96 66 -92 V-12 H-66 V-92 Q-66 -96 -62 -96Z', c) + screen(-58, -90, 116, 74, 'cartoon', on, 3) +
      P('M-76 -12 H76 L70 0 H-70Z', light(c, 0.2)) + R(-14, -9, 28, 3, 1.5, dark(c, 0.15)) + P(heartD(58, -24, 16), '#ff4f8b', 'stroke="#fff" stroke-width="2"') + P(starD(-60, -16, 8), '#ffd36b', 'stroke="#fff" stroke-width="1.5"'),
  },
  {
    s: 'retro', name: 'Retro Computer', w: 150, h: 140,
    art: (c, on) => box(-56, -136, 112, 100, 14, ST.retro.soft) + R(-44, -124, 88, 70, 10, '#5a5a6e') + (on ? R(-38, -118, 76, 58, 8, '#1d3a2a') +
      `<text x="-30" y="-100" font-family="monospace" font-size="11" fill="#7fe0b0">HELLO!</text><text x="-30" y="-84" font-family="monospace" font-size="11" fill="#7fe0b0">&gt; <tspan>_<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></tspan></text>` : R(-38, -118, 76, 58, 8, '#3d3a52')) +
      R(-38, -118, 76, 58, 8, 'url(#g-glass)') + R(30, -50, 18, 4, 2, c) + R(-70, -30, 140, 26, 6, ST.retro.soft) + [0, 1, 2].map((r) => Array.from({ length: 9 }, (_, i) => R(-62 + i * 14, -26 + r * 7, 11, 5, 1.5, r === 1 && i === 4 ? c : '#d9cfc9')).join('')).join('') +
      R(-16, -46, 32, 10, 2, c),
  },
], { toggle: true });

const TABLETS = series('tablet', 'Tablets', 'electronics', 'prop', [
  {
    s: 'rainbow', name: 'Kids Tablet', w: 140, h: 110,
    art: (c, on) => S('M-30 -96 Q0 -124 30 -96', c, 10) + box(-66, -98, 132, 94, 22, c) + R(-66, -98, 132, 94, 22, 'url(#p-stripes)', 'opacity="0.4"') + screen(-52, -86, 104, 70, 'cartoon', on, 8),
  },
  {
    s: 'princess', name: 'Sparkle Tablet', w: 140, h: 120,
    art: (c, on) => P('M-30 -4 L-10 -40 H10 L30 -4Z', GOLD) + G(box(-60, -110, 120, 84, 12, c) + R(-60, -110, 120, 84, 12, 'url(#p-hearts)') + screen(-50, -102, 100, 68, 'castle', on, 5), 'transform="rotate(-4 0 -60)"') +
      P(sparkleD(54, -110, 8), '#fff') + P(sparkleD(-58, -24, 6), '#fff') + R(44, -40, 6, 40, 3, '#ff7eb6', 'transform="rotate(20 47 -20)"'),
  },
], { toggle: true });

const SPEAKERS = series('speaker', 'Speakers', 'electronics', 'floor', [
  {
    s: 'modern', name: 'Tower Speaker', w: 90, h: 230,
    art: (c, on) => {
      const woof = (y: number, r: number) => C(0, y, r, '#2d2a3a') + (on ? `<circle cx="0" cy="${y}" r="${r * 0.6}" fill="#4a4a5e"><animate attributeName="r" values="${f(r * 0.55)};${f(r * 0.72)};${f(r * 0.55)}" dur="0.45s" repeatCount="indefinite"/></circle>` : C(0, y, r * 0.6, '#4a4a5e')) + C(0, y, r * 0.18, '#9aa3b5');
      return box(-40, -226, 80, 214, 8, c) + woof(-196, 14) + woof(-140, 26) + woof(-70, 30) + R(-36, -12, 10, 12, 2, INK) + R(26, -12, 10, 12, 2, INK) + (on ? notes(0, -236) : '');
    },
  },
  {
    s: 'candy', name: 'Cupcake Speaker', w: 90, h: 100, mount: 'prop',
    art: (c, on) => P('M-36 -44 L36 -44 L28 0 L-28 0Z', ST.candy.accent) + [-24, -12, 0, 12, 24].map((x) => Ln(x, -42, x * 0.78, -2, dark(ST.candy.accent, 0.15), 2)).join('') + C(0, -22, 12, INK) + C(0, -22, 6, '#4a4a5e') +
      `<g>${on ? bob(0, -3, 0.45) : ''}${box(-42, -78, 84, 38, 19, c)}${box(-28, -96, 56, 26, 13, light(c, 0.1))}${C(0, -100, 8, '#e8384f')}</g>` + (on ? notes(0, -110) : ''),
  },
  {
    s: 'space', name: 'Glow Orb Speaker', w: 100, h: 110, mount: 'prop',
    art: (c, on) => E(0, -6, 36, 6, ST.space.metal) + (on ? cglow(0, -52, 58, '#c99bff', 1.3) : '') + C(0, -52, 44, c) + C(0, -52, 44, 'url(#g-face)') +
      (on ? `<circle cx="0" cy="-52" r="30" fill="none" stroke="#c99bff" stroke-width="3"><animate attributeName="r" values="20;42;20" dur="1s" repeatCount="indefinite"/>${pulse(1, 0, 1)}</circle>` : '') + P(starD(-16, -68, 6), ST.space.accent) + C(14, -36, 3, '#fff', 'opacity="0.6"') + (on ? notes(0, -104) : ''),
  },
  {
    s: 'retro', name: 'Bubble Jukebox', w: 190, h: 290,
    art: (c, on) => {
      let s = cloth('M-86 0 V-190 Q-86 -284 0 -284 Q86 -284 86 -190 V0Z', c) + P('M-70 -190 Q-70 -268 0 -268 Q70 -268 70 -190Z', 'none', `stroke="${ST.retro.trim}" stroke-width="12"`);
      RB.forEach((col, i) => { if (i < 3) s += S(`M${-76 + i * 6} -20 V-190 Q${-76 + i * 6} -${276 - i * 6} 0 -${276 - i * 6}`, col, 4, 'opacity="0.8"') + S(`M${76 - i * 6} -20 V-190 Q${76 - i * 6} -${276 - i * 6} 0 -${276 - i * 6}`, RB[5 - i], 4, 'opacity="0.8"'); });
      if (on) for (let i = 0; i < 6; i++) s += `<circle cx="${i % 2 ? 70 : -70}" r="3" fill="#fff" opacity="0.8" cy="-30"><animate attributeName="cy" values="-30;-180" dur="${2 + (i % 3) * 0.6}s" begin="${f(i * 0.5)}s" repeatCount="indefinite"/></circle>`;
      s += R(-56, -200, 112, 70, 10, '#fff3d6') + R(-48, -192, 96, 54, 6, '#3d2a5e');
      s += on ? `<g>${spin(0, -165, 2)}${C(0, -165, 22, '#2d2a3a')}${C(0, -165, 7, ST.retro.accent)}${E(-8, -172, 6, 2, '#fff', 'opacity="0.3"')}</g>` : C(0, -165, 22, '#2d2a3a') + C(0, -165, 7, ST.retro.accent);
      s += R(-56, -120, 112, 40, 6, light(c, 0.3));
      for (let i = 0; i < 5; i++) s += R(-46 + i * 20, -112, 12, 22, 3, '#fff');
      return s + R(-56, -70, 112, 50, 8, '#2d2a3a') + [-36, -12, 12, 36].map((x) => Ln(x, -64, x, -26, '#4a4a5e', 4)).join('') + (on ? notes(0, -294) : '');
    },
  },
], { toggle: true, sfx: 'music' });

const TURNTABLES = series('turntable', 'Record Players', 'electronics', 'prop', [
  {
    s: 'retro', name: 'Suitcase Record Player', w: 150, h: 110,
    art: (c, on) => {
      const rec = C(-12, -48, 30, '#2d2a3a') + E(-12, -48, 22, 22, 'none', 'stroke="#4a4a5e" stroke-width="1.5"') + C(-12, -48, 9, ST.retro.trim) + E(-24, -58, 8, 3, '#fff', 'opacity="0.25"');
      return P('M-70 -96 H70 L64 -84 H-64Z', light(c, 0.2)) + box(-70, -84, 140, 80, 10, c) + R(-62, -78, 124, 60, 6, '#fff3d6') + (on ? G(spin(-12, -48, 1.8) + rec) : rec) +
        S('M46 -72 L40 -44 L20 -40', '#9aa3b5', 3) + C(46, -72, 5, '#c9cfdd') + C(50, -30, 4, ST.retro.accent) + R(-14, -10, 28, 6, 3, dark(c, 0.2)) + (on ? notes(0, -100) : '');
    },
  },
  {
    s: 'boho', name: 'Wooden Record Console', w: 220, h: 150, mount: 'floor', surfaces: [],
    art: (c, on) => {
      const wd = ST.boho.wood;
      const rec = C(-30, -118, 34, '#2d2a3a') + E(-30, -118, 24, 24, 'none', 'stroke="#4a4a5e" stroke-width="1.5"') + C(-30, -118, 10, ST.boho.accent);
      let s = box(-100, -106, 200, 70, 8, wd) + E(-30, -110, 40, 8, dark(wd, 0.2)) + `<g transform="translate(-30 -118) scale(1 0.3) translate(30 118)"><g>${on ? spin(-30, -118, 1.8) : ''}${rec}${R(-34, -150, 8, 20, 2, '#fff', 'opacity="0.25"')}</g></g>`;
      s += S('M60 -116 L44 -112 L20 -116', '#c9a27e', 3) + C(62, -116, 4, '#c9a27e');
      s += R(-90, -96, 116, 50, 4, c);
      for (let i = 0; i < 7; i++) s += R(-86 + i * 16, -92, 12, 42, 2, ['#e8907a', '#2d2a3a', '#f4dca0', '#2d2a3a', '#a8e6cf', '#e8b46a', '#2d2a3a'][i]);
      s += R(36, -96, 54, 50, 4, dark(wd, 0.1)) + weave(38, -94, 50, 46, dark(wd, 0.3), 7);
      return s + sym((k) => P(`M${84 * k} -36 L${94 * k} -36 L${100 * k} 0 L${92 * k} 0Z`, dark(wd, 0.15))) + (on ? notes(0, -150) : '');
    },
  },
  {
    s: 'princess', name: 'Golden Gramophone', w: 140, h: 170,
    art: (c, on) => {
      const rec = E(-10, -52, 34, 9, '#2d2a3a') + E(-10, -52, 10, 3, '#ff7eb6');
      return box(-56, -46, 112, 42, 8, '#fff') + R(-56, -12, 112, 6, 3, GOLD) + flowerG(0, -26, 9, c, '#ffd24a') + (on ? G(`<animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur="0.5s" repeatCount="indefinite"/>` + rec) : rec) +
        S('M30 -54 Q40 -90 30 -110', GOLD, 6) + P('M30 -108 Q10 -150 -30 -164 Q20 -170 70 -150 Q50 -130 34 -104Z', c) + P('M-30 -164 Q20 -170 70 -150', 'none', `stroke="${GOLD}" stroke-width="5"`) + P('M30 -108 Q10 -150 -30 -164 Q20 -170 70 -150 Q50 -130 34 -104Z', 'url(#g-shadeX)') + (on ? notes(20, -170) : '');
    },
  },
], { toggle: true, sfx: 'music' });

const RADIOS = series('radio', 'Radios', 'electronics', 'prop', [
  {
    s: 'retro', name: 'Vintage Radio', w: 140, h: 95,
    art: (c, on) => box(-64, -86, 128, 82, 20, c) + R(-52, -74, 64, 58, 10, '#fff3d6') + [-66, -56, -46, -36, -26].map((y) => Ln(-44, y, 4, y, dark('#fff3d6', 0.2), 3)).join('') +
      R(20, -72, 36, 16, 4, '#2d2a3a') + R(on ? 40 : 26, -70, 2, 12, 1, '#ff4f6d') + C(28, -36, 9, ST.retro.accent) + C(48, -36, 9, ST.retro.trim) + (on ? notes(0, -96) : ''),
  },
  {
    s: 'cottage', name: 'Cathedral Radio', w: 120, h: 140,
    art: (c, on) => {
      const wd = ST.cottage.wood;
      return cloth('M-52 -4 V-90 Q-52 -136 0 -136 Q52 -136 52 -90 V-4Z', wd) + P('M-38 -46 V-90 Q-38 -120 0 -120 Q38 -120 38 -90 V-46Z', c) + [-24, -10, 4, 18].map((x) => Ln(x + 3, -112, x + 3, -50, dark(c, 0.2), 3)).join('') +
        R(-34, -38, 68, 12, 4, '#fff3d6') + R(on ? 10 : -16, -37, 2, 10, 1, '#ff4f6d') + C(-24, -16, 6, '#fff3d6') + C(24, -16, 6, '#fff3d6') + flowerG(0, -16, 6, '#ff9ec7') + (on ? notes(0, -146) : '');
    },
  },
], { toggle: true, sfx: 'music' });

const KARAOKE = series('karaoke', 'Karaoke', 'electronics', 'floor', [
  {
    s: 'sweet', name: 'Karaoke Machine', w: 230, h: 280,
    art: (c, on) => {
      let s = Ln(80, 0, 80, -190, '#9aa3b5', 6) + E(80, -4, 30, 6, '#9aa3b5') + S('M80 -190 L70 -210', '#9aa3b5', 5) + R(56, -236, 22, 34, 10, '#c9cfdd', 'transform="rotate(-20 67 -219)"') + C(60, -236, 13, '#4a4a5e', 'transform="rotate(-20 67 -219)"');
      s += box(-100, -150, 140, 146, 16, c) + screen(-88, -138, 116, 64, 'karaoke', on, 6) + C(-30, -40, 26, INK) + C(-30, -40, 12, '#4a4a5e');
      for (let i = 0; i < 4; i++) s += `<circle cx="${-84 + i * 10}" cy="-66" r="3" fill="${RB[i]}">${on ? pulse(1, 0.3, 0.8, i * 0.2) : ''}</circle>`;
      return s + P(heartD(16, -60, 18), '#fff') + S('M60 -228 Q20 -170 40 -150', '#4a4a5e', 2) + (on ? notes(-30, -160) : '');
    },
  },
  {
    s: 'rainbow', name: 'Star Karaoke Speaker', w: 130, h: 140, mount: 'prop',
    art: (c, on) => box(-56, -96, 112, 92, 18, c) + R(-56, -96, 112, 92, 18, 'url(#p-stripes)', 'opacity="0.4"') + C(0, -50, 30, INK) + (on ? `<g>${pulse(1, 0.6, 0.6)}${P(starD(0, -50, 24), '#ffd24a')}</g>` : P(starD(0, -50, 24), '#6a6a80')) +
      R(56, -84, 16, 34, 8, '#c9cfdd', 'transform="rotate(20 64 -67)"') + C(70, -88, 10, '#4a4a5e') + (on ? notes(0, -110) : ''),
  },
], { toggle: true, sfx: 'music' });

// ================= LIGHTING =================
/** A lampshade trapezoid that glows warm when on. */
const shade = (x1: number, x2: number, y1: number, t1: number, t2: number, y2: number, c: string, on: boolean, pat = 'none') => {
  const d = `M${x1} ${y1} L${x2} ${y1} L${t2} ${y2} L${t1} ${y2}Z`;
  return cloth(d, on ? light(c, 0.55) : c, pat) + (on ? P(d, '#fff6c8', 'opacity="0.35"') : '');
};

const FLOORLAMPS = series('floorlamp', 'Floor Lamps', 'lighting', 'floor', [
  {
    s: 'modern', name: 'Arc Floor Lamp', w: 260, h: 350,
    art: (c, on) => E(-90, -10, 36, 9, ST.modern.trim) + R(-110, -22, 40, 14, 5, ST.modern.accent) + S('M-90 -20 Q-90 -330 90 -300 Q110 -296 110 -270', ST.modern.metal, 7) + lit(on, 110, -220, 130) +
      P('M70 -220 Q70 -270 110 -270 Q150 -270 150 -220Z', c) + P('M70 -220 Q70 -270 110 -270 Q150 -270 150 -220Z', 'url(#g-shadeX)') + E(110, -220, 32, 6, on ? '#fff6c8' : dark(c, 0.15)),
  },
  {
    s: 'princess', name: 'Tassel Floor Lamp', w: 150, h: 360,
    art: (c, on) => {
      let s = E(0, -8, 44, 10, GOLD) + P('M-14 -16 Q0 -40 14 -16Z', GOLD) + R(-5, -260, 10, 240, 5, GOLD) + C(0, -140, 9, GOLD) + lit(on, 0, -290, 150);
      s += shade(-66, 66, -250, -42, 42, -330, c, on, 'hearts');
      for (let x = -60; x <= 60; x += 20) s += Ln(x, -250, x, -236, '#ffd24a', 2) + C(x, -232, 4, '#ff7eb6');
      return s + R(-66, -254, 132, 8, 4, GOLD) + R(-44, -334, 88, 6, 3, GOLD) + motif('crown', 0, -346, 12);
    },
  },
  {
    s: 'cottage', name: 'Tripod Lamp', w: 160, h: 340,
    art: (c, on) => {
      const wd = ST.cottage.wood;
      return Ln(0, -240, -56, 0, wd, 9) + Ln(0, -240, 56, 0, wd, 9) + Ln(0, -240, 0, 0, dark(wd, 0.12), 8) + C(0, -240, 9, dark(wd, 0.15)) + lit(on, 0, -280, 150) +
        R(-64, -320, 128, 76, 10, on ? light(c, 0.55) : c) + R(-64, -320, 128, 76, 10, 'url(#p-flowers)') + R(-64, -320, 128, 76, 10, 'url(#g-shadeX)') + R(-64, -250, 128, 6, 3, '#fff') + R(-64, -324, 128, 6, 3, '#fff');
    },
  },
  {
    s: 'space', name: 'Planet Lamp', w: 160, h: 340,
    art: (c, on) => E(0, -8, 46, 10, ST.space.metal) + R(-5, -230, 10, 222, 5, ST.space.metal) + (on ? cglow(0, -270, 110, '#ffe680', 1.6) + glow(0, -270, 90) : '') +
      C(0, -270, 48, on ? '#fff0b0' : c) + C(0, -270, 48, 'url(#g-face)') + (on ? '' : C(-14, -282, 9, light(c, 0.15)) + C(16, -258, 6, dark(c, 0.15))) +
      E(0, -270, 76, 16, 'none', `stroke="${ST.space.accent}" stroke-width="6" transform="rotate(-14 0 -270)"`) + P(starD(52, -316, 7), ST.space.accent),
  },
  {
    s: 'beach', name: 'Rattan Lantern Lamp', w: 120, h: 330,
    art: (c, on) => {
      const wd = ST.beach.wood;
      let s = (on ? glow(0, -170, 130) : '') + R(-46, -320, 92, 312, 30, on ? '#fff6c8' : light(c, 0.3)) + (on ? E(0, -170, 30, 110, '#ffe680', 'opacity="0.5"') : '');
      for (let x = -40; x <= 40; x += 10) s += Ln(x, -314, x, -14, wd, 4);
      for (let y = -300; y < -20; y += 28) s += Ln(-44, y, 44, y, dark(wd, 0.1), 3);
      return s + R(-50, -326, 100, 14, 7, dark(wd, 0.1)) + R(-50, -16, 100, 16, 7, dark(wd, 0.1)) + S('M-20 -326 Q0 -350 20 -326', wd, 4);
    },
  },
  {
    s: 'retro', name: 'Tulip Trio Lamp', w: 200, h: 330,
    art: (c, on) => {
      let s = E(0, -8, 46, 10, ST.retro.metal) + S('M0 -10 V-200 Q0 -240 -60 -250 M0 -200 Q0 -260 10 -300 M0 -160 Q10 -200 64 -220', '#9aa3b5', 6);
      const tulip = (x: number, y: number, col: string, rot: number) => `<g transform="rotate(${rot} ${x} ${y})">${lit(on, x, y + 10, 70)}${P(`M${x - 26} ${y} Q${x - 28} ${y + 30} ${x} ${y + 34} Q${x + 28} ${y + 30} ${x + 26} ${y} Q${x + 14} ${y + 8} ${x} ${y} Q${x - 14} ${y + 8} ${x - 26} ${y}Z`, on ? light(col, 0.45) : col)}${E(x, y + 32, 10, 4, on ? '#fff6c8' : dark(col, 0.2))}</g>`;
      return s + tulip(-60, -262, c, 150) + tulip(10, -312, ST.retro.accent, 175) + tulip(64, -232, ST.retro.trim, 210);
    },
  },
], { toggle: true });

const TABLELAMPS = series('tablelamp', 'Table Lamps', 'lighting', 'prop', [
  {
    s: 'sweet', name: 'Bunny Lamp', w: 90, h: 130,
    art: (c, on) => (on ? glow(0, -60, 70) : '') + E(-16, -100, 9, 26, on ? light(c, 0.6) : c) + E(16, -100, 9, 26, on ? light(c, 0.6) : c) + E(-16, -98, 4, 16, '#fff', 'opacity="0.6"') + E(16, -98, 4, 16, '#fff', 'opacity="0.6"') +
      box(-36, -82, 72, 78, 34, on ? light(c, 0.6) : c) + C(-12, -50, 3, INK) + C(12, -50, 3, INK) + E(0, -42, 3, 2, '#ff7eb6') + E(-20, -40, 5, 3, '#ff7eb6', 'opacity="0.6"') + E(20, -40, 5, 3, '#ff7eb6', 'opacity="0.6"'),
  },
  {
    s: 'modern', name: 'Mushroom Dome Lamp', w: 100, h: 120,
    art: (c, on) => E(0, -6, 30, 6, c) + R(-5, -76, 10, 70, 5, c) + lit(on, 0, -80, 80) + P('M-48 -76 Q-48 -120 0 -120 Q48 -120 48 -76Z', c) + P('M-48 -76 Q-48 -120 0 -120 Q48 -120 48 -76Z', 'url(#g-shadeX)') + E(0, -76, 48, 6, on ? '#fff6c8' : dark(c, 0.2)),
  },
  {
    s: 'woodland', name: 'Toadstool Lamp', w: 100, h: 120,
    art: (c, on) => E(0, -4, 34, 6, '#6fae55') + box(-14, -66, 28, 64, 10, '#fff3e6') + (on ? glow(0, -70, 80) : '') + P('M-46 -62 Q-48 -114 0 -114 Q48 -114 46 -62Z', on ? light(c, 0.35) : c) +
      C(-22, -84, 7, '#fff') + C(10, -98, 8, '#fff') + C(30, -76, 5, '#fff') + E(0, -62, 46, 6, on ? '#fff6c8' : dark(c, 0.2)) + C(-5, -34, 2, INK) + C(5, -34, 2, INK),
  },
  {
    s: 'princess', name: 'Crystal Lamp', w: 100, h: 150,
    art: (c, on) => {
      let s = E(0, -6, 30, 7, GOLD) + R(-6, -90, 12, 84, 6, GOLD) + C(0, -40, 10, '#e6f5ff') + C(0, -40, 10, 'url(#g-glass)') + lit(on, 0, -110, 90) + shade(-46, 46, -90, -30, 30, -144, c, on);
      for (let x = -40; x <= 40; x += 16) s += `<g>${sway(5, x, -90, 2 + Math.abs(x) / 40)}${Ln(x, -90, x, -78, '#fff', 1.5)}${P(`M${x} -78 L${x + 4} -72 L${x} -64 L${x - 4} -72Z`, '#dff3ff')}</g>`;
      return s + R(-46, -94, 92, 6, 3, GOLD);
    },
  },
  {
    s: 'space', name: 'Moon Lamp', w: 100, h: 130,
    art: (c, on) => E(0, -6, 30, 7, c) + R(-4, -30, 8, 26, 3, ST.space.metal) + (on ? cglow(0, -76, 70, '#ffe680', 1.4) : '') + C(0, -76, 44, on ? '#fff3b0' : '#e6e0d0') + C(0, -76, 44, 'url(#g-face)') +
      C(-16, -88, 9, on ? '#f0dc90' : '#cfc6b0') + C(14, -62, 7, on ? '#f0dc90' : '#cfc6b0') + C(18, -94, 5, on ? '#f0dc90' : '#cfc6b0'),
  },
  {
    s: 'rainbow', name: 'Rainbow Cloud Lamp', w: 120, h: 120,
    art: (c, on) => R(-50, -12, 100, 12, 6, c) + RB.map((col, i) => S(`M${-40 + i * 6} -12 A${40 - i * 6} ${40 - i * 6} 0 0 1 ${40 - i * 6} -12`, on ? col : light(col, 0.4), 6)).join('') + (on ? glow(0, -50, 80) : '') +
      C(-20, -82, 18, '#fff') + C(4, -92, 22, '#fff') + C(26, -80, 16, '#fff') + R(-34, -84, 70, 18, 9, '#fff') + (on ? `<g>${pulse(0.4, 0.9, 2)}${E(0, -82, 40, 18, '#fff6c8')}</g>` : '') + C(-4, -80, 2, INK) + C(10, -80, 2, INK) + S('M-2 -74 Q3 -70 8 -74', INK, 1.5),
  },
], { toggle: true });

const HANGING = series('chandelier', 'Chandeliers & Pendants', 'lighting', 'wall', [
  {
    s: 'princess', name: 'Crystal Chandelier', w: 260, h: 280,
    art: (c, on) => {
      let s = canopy(-140, '#ffd24a') + Ln(0, -132, 0, -40, '#d99a1e', 4) + (on ? glow(0, 20, 170) : '');
      s += S('M0 -10 Q-40 40 -110 10 M0 -10 Q40 40 110 10 M0 -10 Q-20 30 -54 30 M0 -10 Q20 30 54 30', '#ffd24a', 6);
      s += E(0, -10, 26, 20, GOLD) + E(0, 20, 14, 12, GOLD) + E(0, -10, 26, 20, c, 'opacity="0.35"');
      for (const [x, y] of [[-110, 10], [110, 10], [-54, 30], [54, 30]]) {
        s += E(x, y, 16, 6, GOLD) + R(x - 5, y - 30, 10, 28, 3, '#fff') + (on ? flame(x, y - 30, 0.6) : '');
        s += `<g>${sway(5, x, y, 2.4 + x / 100)}${Ln(x, y, x, y + 34, '#fff', 1.5)}${P(`M${x} ${y + 34} L${x + 6} ${y + 42} L${x} ${y + 56} L${x - 6} ${y + 42}Z`, '#dff3ff')}${C(x - 1, y + 42, 1.6, '#fff')}</g>`;
      }
      for (const x of [-30, 0, 30]) s += `<g>${sway(4, x, 30, 2.8)}${Ln(x, 30, x, 70 - Math.abs(x) / 2, '#fff', 1.5)}${P(`M${x} ${70 - Math.abs(x) / 2} l6 8 l-6 14 l-6 -14Z`, '#dff3ff')}</g>`;
      return s;
    },
  },
  {
    s: 'modern', name: 'Globe Pendant Trio', w: 240, h: 280,
    art: (c, on) => R(-110, -140, 220, 8, 4, ST.modern.trim) + [[-80, 40], [0, 100], [80, 0]].map(([x, y]) =>
      Ln(x, -132, x, y - 30, ST.modern.trim, 2) + R(x - 6, y - 34, 12, 8, 2, ST.modern.trim) + lit(on, x, y, 80) + C(x, y, 28, on ? '#fff3c0' : c, 'opacity="0.9"') + C(x, y, 28, 'url(#g-glass)') + (on ? C(x, y, 9, '#fff') : S(`M${x - 6} ${y + 4} Q${x} ${y - 10} ${x + 6} ${y + 4}`, '#c9a27e', 2))).join(''),
  },
  {
    s: 'boho', name: 'Woven Pendant', w: 220, h: 280,
    art: (c, on) => {
      const wd = ST.boho.wood;
      let s = canopy(-140, wd) + Ln(0, -132, 0, 10, '#8a5a3c', 3) + (on ? glow(0, 90, 150) : '');
      s += P('M-90 90 Q-90 10 0 10 Q90 10 90 90Z', c);
      for (let i = 1; i < 6; i++) s += S(`M${-90 + i * 3} ${90 - i * 14} Q0 ${10 + i * 4 - 18 + i * 10} ${90 - i * 3} ${90 - i * 14}`, dark(c, 0.15), 3, 'stroke-dasharray="6 4"');
      return s + P('M-90 90 Q-90 10 0 10 Q90 10 90 90Z', 'url(#g-shadeX)') + E(0, 90, 90, 9, on ? '#fff6c8' : dark(c, 0.25)) + fringe(-80, 80, 94, 14, ST.boho.accent, 10);
    },
  },
  {
    s: 'space', name: 'Starburst Chandelier', w: 260, h: 280,
    art: (c, on) => {
      let s = canopy(-140, ST.space.metal) + Ln(0, -132, 0, -20, '#9aa3b5', 4) + (on ? glow(0, 20, 170) : '');
      const arms: number[][] = [];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; arms.push([Math.cos(a) * (i % 2 ? 80 : 110), 20 + Math.sin(a) * (i % 2 ? 80 : 100)]); }
      for (const [x, y] of arms) s += Ln(0, 20, x, y, '#c9cfdd', 4);
      s += C(0, 20, 22, c) + C(0, 20, 22, 'url(#g-face)');
      return s + arms.map(([x, y], i) => (on ? `<g>${pulse(1, 0.6, 1.4, i * 0.15)}${C(x, y, 16, '#ffe680', 'opacity="0.35"')}</g>` : '') + C(x, y, 8, on ? '#fff6c8' : '#e6e8f0') + C(x - 2, y - 2, 2, '#fff')).join('');
    },
  },
  {
    s: 'candy', name: 'Gumdrop Pendants', w: 240, h: 280,
    art: (c, on) => R(-110, -140, 220, 8, 4, ST.candy.trim) + [[-76, 20, c], [0, 70, ST.candy.accent], [76, 10, ST.candy.soft]].map(([x, y, col]) => {
      const X = x as number; const Y = y as number; const cc = col as string;
      return Ln(X, -132, X, Y - 40, '#fff', 3) + lit(on, X, Y + 10, 80) + P(`M${X - 36} ${Y + 14} Q${X - 36} ${Y - 40} ${X} ${Y - 40} Q${X + 36} ${Y - 40} ${X + 36} ${Y + 14}Z`, on ? light(cc, 0.3) : cc) +
        [[-16, -10], [8, -24], [18, 2], [-4, 4]].map(([dx, dy]) => C(X + dx, Y + dy, 2.5, '#fff', 'opacity="0.8"')).join('') + E(X, Y + 14, 36, 6, on ? '#fff6c8' : dark(cc, 0.2));
    }).join(''),
  },
  {
    s: 'cottage', name: 'Flower Bell Pendant', w: 200, h: 270,
    art: (c, on) => canopy(-135, ST.cottage.wood) + S('M0 -128 Q10 -80 -4 -40 Q-12 -10 0 10', '#5fae6b', 4) + E(-12, -70, 14, 6, '#6fc47c', 'transform="rotate(-30 -12 -70)"') + E(12, -30, 14, 6, '#6fc47c', 'transform="rotate(30 12 -30)"') +
      (on ? glow(0, 90, 140) : '') + P('M-70 90 Q-80 40 -50 20 Q-20 0 0 10 Q20 0 50 20 Q80 40 70 90 Q52 76 35 92 Q18 76 0 92 Q-18 76 -35 92 Q-52 76 -70 90Z', on ? light(c, 0.4) : c) +
      S('M-36 30 Q-34 60 -35 88 M0 20 V88 M36 30 Q34 60 35 88', dark(c, 0.12), 2) + C(0, 96, 8, on ? '#fff6c8' : '#ffd36b'),
  },
], { toggle: true });

const LAVA = series('lavalamp', 'Lava Lamps', 'lighting', 'prop', [
  { s: 'rainbow', name: 'Rainbow Lava Lamp', w: 70, h: 170, blob: '#ff7eb6' },
  { s: 'space', name: 'Galaxy Lava Lamp', w: 70, h: 170, blob: '#7fe0b0' },
  { s: 'candy', name: 'Bubblegum Lava Lamp', w: 70, h: 170, blob: '#ffd36b' },
].map(({ s, name, w, h, blob }) => ({
  s, name, w, h,
  art: (c: string, on: boolean) => {
    const metal = s === 'candy' ? '#ff7eb6' : s === 'space' ? '#c9cfdd' : '#9b6bff';
    const blobs = [[-6, -40, 10, 0, 6], [8, -60, 8, 1.5, 7], [-4, -90, 7, 3, 5]].map(([x, y, r, b, d]) =>
      on ? `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 ${y > -60 ? -60 : -20};0 0" dur="${d}s" begin="${b}s" repeatCount="indefinite" ${ease}/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="${blob}"><animate attributeName="rx" values="${r};${r * 1.3};${r}" dur="${d / 2}s" repeatCount="indefinite"/></ellipse></g>`
        : E(x, -36 - (r as number) * 0.4, r as number, r as number, blob)).join('');
    return P('M-24 -30 L24 -30 L32 -4 L-32 -4Z', metal) + E(0, -4, 32, 5, dark(metal, 0.2)) + (on ? cglow(0, -80, 50, c, 1.2) : '') +
      P('M-18 -30 L-10 -130 L10 -130 L18 -30Z', on ? light(c, 0.3) : c) + G(blobs) + P('M-18 -30 L-10 -130 L10 -130 L18 -30Z', 'url(#g-glass)') + P('M-10 -130 L10 -130 L6 -160 L-6 -160Z', metal);
  },
})) as Spec[], { toggle: true });

const NEONS = series('neon', 'Neon Signs', 'lighting', 'wall', [
  { s: 'sweet', name: 'Neon Heart', w: 170, h: 160, color: '#ff4f8b', art: (c, on) => R(-80, -74, 160, 148, 16, '#fff', 'opacity="0.25"') + neon(heartD(0, -56, 120).replace(/Z/g, ''), c, on, 8) },
  { s: 'retro', name: 'Neon Star', w: 170, h: 170, color: '#ffd24a', art: (c, on) => R(-80, -80, 160, 160, 16, '#fff', 'opacity="0.25"') + neon(starD(0, 6, 66, 0.46) + 'Z', c, on, 7) },
  {
    s: 'rainbow', name: 'Neon Rainbow', w: 220, h: 140, color: '#ff7eb6',
    art: (c, on) => R(-104, -64, 208, 128, 16, '#fff', 'opacity="0.25"') + [c, '#ffd24a', '#7fe0b0', '#7cc8ff'].map((col, i) => neon(`M${-84 + i * 16} 40 A${84 - i * 16} ${84 - i * 16} 0 0 1 ${84 - i * 16} 40`, col, on, 6)).join(''),
  },
  { s: 'candy', name: 'Neon LOVE', w: 230, h: 120, color: '#ff4f8b', art: (c, on) => R(-110, -54, 220, 108, 16, '#fff', 'opacity="0.25"') + neonText('LOVE', 0, 26, 74, c, on) + P(heartD(92, -46, 16), on ? c : light(c, 0.5)) },
  { s: 'space', name: 'Neon Moon', w: 170, h: 170, color: '#ffe680', art: (c, on) => R(-80, -80, 160, 160, 16, '#fff', 'opacity="0.25"') + neon('M14 -62 A62 62 0 1 0 54 30 A46 46 0 1 1 14 -62Z', c, on, 7) + neon(starD(44, -30, 14, 0.45) + 'Z', '#7cc8ff', on, 4) },
  { s: 'modern', name: 'Neon Music Note', w: 150, h: 170, color: '#c99bff', art: (c, on) => R(-70, -80, 140, 160, 16, '#fff', 'opacity="0.25"') + neon('M-20 44 V-56 L40 -66 V30 M-20 -30 L40 -40', c, on, 7) + neon('M-20 44 m-18 0 a18 13 0 1 0 36 0 a18 13 0 1 0 -36 0 M40 30 m-18 0 a18 13 0 1 0 36 0 a18 13 0 1 0 -36 0', c, on, 7) },
], { toggle: true });

const SCONCES = series('sconce', 'Wall Sconces', 'lighting', 'wall', [
  {
    s: 'princess', name: 'Candle Sconce', w: 150, h: 150,
    art: (c, on) => (on ? glow(0, -40, 110) : '') + box(-14, -40, 28, 70, 12, GOLD) + C(0, -4, 8, c) + S('M0 20 Q-40 30 -50 0 M0 20 Q40 30 50 0', '#ffd24a', 6) +
      [-50, 50].map((x) => E(x, 0, 14, 5, GOLD) + R(x - 5, -30, 10, 30, 3, '#fff') + (on ? flame(x, -30, 0.65) : '')).join('') + C(0, 40, 6, GOLD),
  },
  {
    s: 'modern', name: 'Up-Down Sconce', w: 110, h: 180, color: ST.modern.accent,
    art: (c, on) => (on ? E(0, -60, 30, 40, 'url(#g-spot)', 'transform="rotate(180 0 -60)"') + E(0, 60, 30, 40, 'url(#g-spot)') : '') + R(-6, -10, 12, 20, 3, ST.modern.trim) + box(-18, -36, 36, 72, 8, c) +
      E(0, -36, 14, 3, on ? '#fff6c8' : dark(c, 0.2)) + E(0, 36, 14, 3, on ? '#fff6c8' : dark(c, 0.2)),
  },
  {
    s: 'cottage', name: 'Lantern Sconce', w: 120, h: 170,
    art: (c, on) => S('M-30 -60 H20 Q30 -60 30 -50 V40', '#4a4a5e', 5) + R(-36, -72, 12, 30, 4, '#4a4a5e') + Ln(10, -60, 10, -34, '#4a4a5e', 3) + (on ? glow(10, 10, 90) : '') +
      P('M-10 -34 H30 L24 -26 H-4Z', c) + R(-4, -26, 28, 50, 3, on ? '#fff3c0' : '#e6f5ff') + R(-4, -26, 28, 50, 3, 'url(#g-glass)') + (on ? flame(10, 18, 0.6) : '') + R(-8, 24, 36, 8, 3, c) + flowerG(-30, 30, 9, '#ff9ec7'),
  },
], { toggle: true });

const LANTERNS = series('lantern', 'Lanterns', 'lighting', 'prop', [
  {
    s: 'boho', name: 'Star Lantern', w: 90, h: 150,
    art: (c, on) => {
      let s = (on ? glow(0, -60, 100) : '') + S('M-10 -140 Q0 -152 10 -140', '#c9a27e', 3) + P('M-12 -124 L12 -124 L6 -140 L-6 -140Z', '#c9a27e');
      s += P('M-12 -124 Q-40 -100 -36 -60 Q-34 -20 -20 -6 H20 Q34 -20 36 -60 Q40 -100 12 -124Z', c) + R(-24, -8, 48, 8, 3, '#c9a27e');
      const cut = [[-16, -96], [8, -100], [-4, -70], [18, -62], [-20, -40], [6, -36]];
      return s + cut.map(([x, y], i) => P(starD(x, y, 6), on ? '#fff3a0' : dark(c, 0.25)) + (on && i % 2 ? `<g>${pulse(0.3, 1, 1.4, i * 0.3)}${C(x, y, 9, '#ffe680', 'opacity="0.4"')}</g>` : '')).join('');
    },
  },
  {
    s: 'woodland', name: 'Firefly Jar', w: 80, h: 120,
    art: (c, on) => {
      let s = R(-30, -96, 60, 92, 14, on ? '#fff8d8' : '#e6f5ff', 'opacity="0.85"') + R(-30, -96, 60, 92, 14, 'url(#g-glass)') + R(-26, -108, 52, 14, 4, ST.woodland.wood) + S('M-20 -108 Q0 -126 20 -108', '#8a5a3c', 2.5) + S('M-20 -10 Q-10 -40 -16 -60 M10 -10 Q16 -30 8 -50', '#5fae6b', 3);
      if (on) [[-12, -70], [10, -50], [0, -30], [-8, -44], [14, -80]].forEach(([x, y], i) => { s += `<g>${bob(i % 2 ? 6 : -6, -8, 2 + i * 0.4)}<circle cx="${x}" cy="${y}" r="7" fill="#e8ff80" opacity="0.4">${pulse(0.1, 0.6, 1.2, i * 0.3)}</circle>${C(x, y, 2.5, '#f6ffb0')}</g>`; });
      return s + E(0, -6, 26, 4, c, 'opacity="0.5"');
    },
  },
], { toggle: true });

const CURTAINS = series('lightcurtain', 'Fairy Light Curtains', 'lighting', 'wall', [
  { s: 'sweet', name: 'Heart Light Curtain', w: 300, h: 260, kind: 'heart' },
  { s: 'rainbow', name: 'Star Light Curtain', w: 300, h: 260, kind: 'star' },
].map(({ s, name, w, h, kind }) => ({
  s, name, w, h,
  art: (c: string, on: boolean) => {
    let out = S('M-145 -125 Q0 -105 145 -125', '#6b5a6b', 3);
    for (let i = 0; i < 10; i++) {
      const x = -135 + i * 30;
      const top = -125 + 20 * (1 - ((x / 145) ** 2));
      const len = 160 + ((i * 37) % 70);
      out += Ln(x, top, x, top + len, '#8a7a8a', 1.5, 'opacity="0.8"');
      for (let j = 1; j <= 4; j++) {
        const y = top + (len * j) / 4;
        const col = kind === 'heart' ? [c, '#fff', '#ffd9e8'][(i + j) % 3] : RB[(i + j) % 6];
        const shape = kind === 'heart' ? P(heartD(x, y - 8, 14), on ? col : light(col, 0.4)) : P(starD(x, y, 8), on ? col : light(col, 0.4));
        out += (on ? `<circle cx="${x}" cy="${f(y)}" r="12" fill="${col}" opacity="0.3">${pulse(0.1, 0.5, 1.2 + ((i + j) % 4) * 0.4, (i * j) % 3 * 0.3)}</circle>` : '') + shape;
      }
    }
    return out;
  },
})) as Spec[], { toggle: true });

const PARTY = series('partylight', 'Party Lights', 'lighting', 'wall', [
  {
    s: 'retro', name: 'Disco Ball', w: 220, h: 280, color: '#c9cfdd', sfx: 'music',
    art: (c, on) => {
      let s = canopy(-140, '#9aa3b5') + Ln(0, -132, 0, -26, '#9aa3b5', 3);
      if (on) s += `<g>${spin(0, 40, 8)}${[0, 1, 2, 3, 4, 5].map((i) => P(`M0 40 L${f(Math.cos(i * 1.047) * 130 - 10)} ${f(40 + Math.sin(i * 1.047) * 130)} L${f(Math.cos(i * 1.047) * 130 + 10)} ${f(40 + Math.sin(i * 1.047) * 130)}Z`, RB[i], 'opacity="0.22"')).join('')}</g>`;
      s += C(0, 40, 62, dark(c, 0.3));
      let k = 0;
      for (let y = -54; y <= 54; y += 12) {
        const half = Math.sqrt(Math.max(0, 62 * 62 - (Math.abs(y) + 6) ** 2));
        for (let x = -half; x < half - 8; x += 12, k++) {
          const tone = [light(c, 0.5), c, light(c, 0.2), dark(c, 0.1)][(k * 7) % 4];
          s += `<rect x="${f(x + 1)}" y="${f(40 + y - 5)}" width="10" height="10" rx="1.5" fill="${tone}">${on && k % 3 === 0 ? `<animate attributeName="fill" values="${tone};#ffffff;${RB[k % 6]};${tone}" dur="${f(1.5 + (k % 5) * 0.3)}s" begin="${f((k % 7) * 0.2)}s" repeatCount="indefinite"/>` : ''}</rect>`;
        }
      }
      s += C(0, 40, 62, 'url(#g-face)') + C(-22, 16, 10, '#fff', 'opacity="0.45"');
      if (on) [[-90, -40], [90, -20], [-70, 110], [80, 100], [0, -60]].forEach(([x, y], i) => { s += `<g>${pulse(0, 1, 1.2, i * 0.35)}${P(sparkleD(x, y, 12), '#fff')}</g>`; });
      return s;
    },
  },
  {
    s: 'space', name: 'Star Projector', w: 120, h: 120, mount: 'prop',
    art: (c, on) => {
      let s = '';
      if (on) s += `<g>${spin(0, -60, 30)}${[[-100, -180], [60, -240], [110, -120], [-40, -260], [-120, -80], [20, -170], [90, -200], [-80, -230]].map(([x, y], i) => `<g>${pulse(1, 0.3, 1.6, i * 0.2)}${P(starD(x, y, 8 + (i % 3) * 3), [ST.space.accent, '#7cc8ff', '#ff9ec7'][i % 3])}</g>`).join('')}</g>`;
      s += E(0, -6, 46, 7, ST.space.metal) + P('M-40 -8 Q-44 -40 -30 -46 H30 Q44 -40 40 -8Z', c) + P('M-34 -46 Q-34 -96 0 -96 Q34 -96 34 -46Z', on ? '#fff3b0' : light(c, 0.3)) + (on ? glow(0, -70, 70) : '');
      for (const [x, y] of [[-14, -66], [12, -78], [0, -56], [18, -58], [-20, -52]]) s += P(starD(x, y, 5), on ? '#fff' : c);
      return s + P('M-34 -46 Q-34 -96 0 -96 Q34 -96 34 -46Z', 'url(#g-glass)');
    },
  },
], { toggle: true });

export const LIVING_MORE: FurnDef[] = [
  ...SOFAS, ...LOVESEATS, ...SECTIONALS, ...ARMCHAIRS, ...ROCKERS, ...POUFS, ...COFFEE, ...SIDES,
  ...TVSTANDS, ...FIREPLACES, ...BOOKCASES, ...CURIOS, ...PIANOS, ...TANKS, ...CATTREES, ...DIVIDERS,
  ...TVS, ...GAMES, ...COMPUTERS, ...TABLETS, ...SPEAKERS, ...TURNTABLES, ...RADIOS, ...KARAOKE,
  ...FLOORLAMPS, ...TABLELAMPS, ...HANGING, ...LAVA, ...NEONS, ...SCONCES, ...LANTERNS, ...CURTAINS, ...PARTY,
];
