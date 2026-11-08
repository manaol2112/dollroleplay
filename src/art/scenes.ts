// Backgrounds for every place, drawn for the current season. The design area is 1600 x 900, and each
// background bleeds well past it so wide phones and square tablets never see an edge.
import type { Season } from '../types';
import { dark, light } from './color';
import { roundRectD } from './furniture';
import { bowG, flowerG, heartD, sparkleD, starD } from './wear';

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const T = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;

export const BLEED = { x0: -600, y0: -500, w: 2800, h: 1900 };
const full = (fill: string, extra = '') => R(BLEED.x0, BLEED.y0, BLEED.w, BLEED.h, 0, fill, extra);

export interface SeasonLook {
  skyTop: string;
  skyBottom: string;
  grass: string;
  grassDark: string;
  hill1: string;
  hill2: string;
  leaves: string[];
  sun: string;
}
export const SEASON_LOOK: Record<Season, SeasonLook> = {
  spring: { skyTop: '#7fcaff', skyBottom: '#e3f5ff', grass: '#9be07f', grassDark: '#74c766', hill1: '#b6eb98', hill2: '#8fd98a', leaves: ['#ffb7d5', '#ffd1e3', '#ff9ec7', '#ffffff'], sun: '#fff2a8' },
  summer: { skyTop: '#3fb0ff', skyBottom: '#c6ecff', grass: '#64d06a', grassDark: '#47b85a', hill1: '#86dd74', hill2: '#5cc566', leaves: ['#3fbf5f', '#5fd06a', '#2fa651', '#8fe07a'], sun: '#ffe066' },
  fall: { skyTop: '#ffb98a', skyBottom: '#fff1dc', grass: '#d8bd62', grassDark: '#c29f48', hill1: '#e8c070', hill2: '#d9a756', leaves: ['#ff8a3d', '#e8573d', '#ffc23d', '#d9672e'], sun: '#ffd08a' },
  winter: { skyTop: '#9fc0e8', skyBottom: '#eef4fc', grass: '#f6f9ff', grassDark: '#dfe9f7', hill1: '#eaf1fb', hill2: '#dbe7f6', leaves: ['#2f7a5a', '#3a8a66', '#2a6b50', '#ffffff'], sun: '#fdfbe8' },
};

let uidN = 0;
export const uid = (p: string) => `${p}${++uidN}`;

// ---------------- shared pieces ----------------
export const cloud = (x: number, y: number, s: number, drift = 0) => {
  const body = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${C(-40, 0, 32, '#fff')}${C(0, -20, 42, '#fff')}${C(42, -2, 30, '#fff')}${R(-72, -4, 144, 34, 17, '#fff')}${E(0, 26, 70, 8, '#dce9f7', 'opacity="0.6"')}</g>`;
  return drift ? `<g>${body}<animateTransform attributeName="transform" type="translate" values="0 0;${drift} 0;0 0" dur="${Math.abs(drift) / 3}s" repeatCount="indefinite"/></g>` : body;
};

export function seasonTree(x: number, y: number, s: number, season: Season, variant = 0): string {
  const L = SEASON_LOOK[season].leaves;
  let g = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`;
  if (season === 'winter' && variant % 2 === 0) {
    g += R(-10, -40, 20, 40, 4, '#8a5a3c');
    for (let i = 0; i < 3; i++) {
      const yy = -30 - i * 55;
      const w = 80 - i * 18;
      g += P(`M${-w} ${yy} L0 ${yy - 90} L${w} ${yy}Z`, i % 2 ? '#2f7a5a' : '#3a8a66') + P(`M${-w * 0.5} ${yy - 45} L0 ${yy - 90} L${w * 0.5} ${yy - 45} Q${w * 0.25} ${yy - 36} 0 ${yy - 46} Q${-w * 0.25} ${yy - 36} ${-w * 0.5} ${yy - 45}Z`, '#fff');
      g += P(`M${-w} ${yy} Q${-w * 0.5} ${yy - 10} 0 ${yy - 2} Q${w * 0.5} ${yy - 10} ${w} ${yy} Q${w * 0.5} ${yy + 6} 0 ${yy + 2} Q${-w * 0.5} ${yy + 6} ${-w} ${yy}Z`, '#fff', 'opacity="0.9"');
    }
    return g + '</g>';
  }
  g += R(-14, -110, 28, 110, 10, '#a86b4a') + P('M0 -80 L-34 -130 M0 -90 L30 -140', 'none', 'stroke="#a86b4a" stroke-width="10" stroke-linecap="round"');
  if (season === 'winter') {
    g += P('M0 -110 L-50 -190 M0 -120 L44 -200 M-20 -150 L-70 -160 M20 -160 L70 -180', 'none', 'stroke="#a86b4a" stroke-width="8" stroke-linecap="round"');
    g += P('M-50 -190 l-10 -4 M44 -200 l12 -4 M-70 -160 l-10 2 M70 -180 l10 -2', 'none', 'stroke="#fff" stroke-width="8" stroke-linecap="round"');
    return g + E(0, -4, 40, 8, '#fff') + '</g>';
  }
  const blobs = [[0, -190, 78], [-62, -150, 56], [62, -150, 56], [-34, -220, 52], [38, -224, 52], [0, -140, 58]];
  blobs.forEach(([bx, by, r], i) => (g += C(bx, by, r, L[i % 3])));
  g += C(-28, -228, 26, '#fff', 'opacity="0.18"');
  if (season === 'spring') for (const [bx, by] of [[-40, -180], [30, -210], [50, -150], [-10, -150], [-60, -130], [10, -240]]) g += flowerG(bx, by, 9, '#fff', '#ff9ec7');
  if (season === 'summer') for (const [bx, by] of [[-30, -170], [40, -200], [20, -140]]) g += C(bx, by, 9, '#e8384f') + C(bx - 3, by - 3, 3, '#fff', 'opacity="0.6"');
  if (season === 'fall') for (const [bx, by] of [[-80, -40], [60, -20], [100, -60]]) g += E(bx, by, 9, 5, L[1], `transform="rotate(30 ${bx} ${by})"`);
  return g + '</g>';
}

function skyDefs(id: string, s: Season): string {
  const L = SEASON_LOOK[s];
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.skyTop}"/><stop offset="1" stop-color="${L.skyBottom}"/></linearGradient></defs>`;
}

function sun(x: number, y: number, s: Season): string {
  const L = SEASON_LOOK[s];
  const r = s === 'summer' ? 70 : 55;
  let g = C(x, y, r * 2.4, L.sun, 'opacity="0.25"') + C(x, y, r * 1.5, L.sun, 'opacity="0.35"') + C(x, y, r, L.sun);
  if (s === 'summer') g = `<g>${g}<animateTransform attributeName="transform" type="rotate" values="0 ${x} ${y};360 ${x} ${y}" dur="60s" repeatCount="indefinite"/>${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<path d="M${f(x + Math.cos(a) * r * 1.2)} ${f(y + Math.sin(a) * r * 1.2)} L${f(x + Math.cos(a + 0.12) * r * 1.65)} ${f(y + Math.sin(a + 0.12) * r * 1.65)} L${f(x + Math.cos(a - 0.12) * r * 1.65)} ${f(y + Math.sin(a - 0.12) * r * 1.65)}Z" fill="${L.sun}"/>`;
  }).join('')}</g>`;
  return g + C(x - r * 0.3, y - r * 0.1, r * 0.08, '#6b4a3a', 'opacity="0.6"') + C(x + r * 0.3, y - r * 0.1, r * 0.08, '#6b4a3a', 'opacity="0.6"') + P(`M${f(x - r * 0.25)} ${f(y + r * 0.2)} Q${f(x)} ${f(y + r * 0.4)} ${f(x + r * 0.25)} ${f(y + r * 0.2)}`, 'none', 'stroke="#6b4a3a" stroke-width="3" stroke-linecap="round" opacity="0.6"');
}

/** Sky, sun, clouds and rolling hills down to the horizon. */
export function landscape(s: Season, horizon: number, opts: { trees?: number[]; sunX?: number } = {}): string {
  const L = SEASON_LOOK[s];
  const id = uid('sky');
  let g = skyDefs(id, s) + full(`url(#${id})`);
  g += sun(opts.sunX ?? 1340, 130, s);
  g += cloud(260, 120, 1.0, 120) + cloud(820, 70, 0.8, -90) + cloud(1500, 210, 0.7, 70);
  g += P(`M-600 ${horizon - 40} Q-200 ${horizon - 180} 200 ${horizon - 60} Q600 ${horizon - 190} 1000 ${horizon - 70} Q1400 ${horizon - 200} 1800 ${horizon - 60} Q2000 ${horizon - 120} 2200 ${horizon - 80} L2200 ${horizon + 40} L-600 ${horizon + 40}Z`, L.hill1);
  g += P(`M-600 ${horizon - 10} Q-100 ${horizon - 110} 400 ${horizon - 20} Q900 ${horizon - 120} 1300 ${horizon - 20} Q1700 ${horizon - 110} 2200 ${horizon - 30} L2200 ${horizon + 40} L-600 ${horizon + 40}Z`, L.hill2);
  for (const [i, x] of (opts.trees ?? [-200, 120, 1480, 1800]).entries()) g += seasonTree(x, horizon + 10, 0.8, s, i);
  return g;
}

export function ground(s: Season, top: number): string {
  const L = SEASON_LOOK[s];
  const id = uid('gr');
  let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.grassDark}"/><stop offset="0.25" stop-color="${L.grass}"/><stop offset="1" stop-color="${light(L.grass, 0.15)}"/></linearGradient></defs>`;
  g += R(-600, top, 2800, 1400, 0, `url(#${id})`);
  // texture
  for (let i = 0; i < 70; i++) {
    const x = ((i * 397) % 2600) - 500;
    const y = top + 30 + ((i * 211) % 560);
    if (s === 'winter') g += E(x, y, 22, 5, '#fff', 'opacity="0.8"');
    else if (s === 'fall') g += E(x, y, 7, 4, L.leaves[i % 4], `transform="rotate(${(i * 47) % 180} ${x} ${y})"`);
    else g += P(`M${x} ${y} l-4 -12 M${x} ${y} l4 -14 M${x} ${y} l0 -10`, 'none', `stroke="${L.grassDark}" stroke-width="3" stroke-linecap="round" opacity="0.6"`);
  }
  if (s === 'spring' || s === 'summer') {
    for (let i = 0; i < 26; i++) {
      const x = ((i * 523) % 2600) - 500;
      const y = top + 50 + ((i * 337) % 520);
      g += flowerG(x, y, 9, ['#ff9ec7', '#fff', '#ffd36b', '#c99bff'][i % 4]);
    }
  }
  return g;
}

export function picketFence(y: number, x0 = -600, x1 = 2200, c = '#ffffff'): string {
  let g = R(x0, y - 50, x1 - x0, 10, 4, dark(c, 0.06)) + R(x0, y - 20, x1 - x0, 10, 4, dark(c, 0.06));
  for (let x = x0; x < x1; x += 46) g += P(`M${x} ${y} L${x} ${y - 64} L${x + 14} ${y - 80} L${x + 28} ${y - 64} L${x + 28} ${y}Z`, c) + P(`M${x + 20} ${y} L${x + 20} ${y - 70} L${x + 28} ${y - 64} L${x + 28} ${y}Z`, dark(c, 0.08));
  return g;
}

// ---------------- rooms ----------------
export interface WallStyle { id: string; name: string; price: number; color: string; pattern: string; }
export interface FloorStyle { id: string; name: string; price: number; kind: 'wood' | 'tiles' | 'carpet' | 'marble'; a: string; b: string; }

export const WALLS: WallStyle[] = [
  { id: 'pinkPlain', name: 'Pink', price: 0, color: '#ffd9e8', pattern: 'none' },
  { id: 'lilacDots', name: 'Lilac Dots', price: 0, color: '#e6d4ff', pattern: 'dots' },
  { id: 'mintStripes', name: 'Mint Stripes', price: 0, color: '#c9f2e3', pattern: 'stripes' },
  { id: 'peach', name: 'Peach', price: 0, color: '#ffe2cc', pattern: 'none' },
  { id: 'skyStars', name: 'Starry Sky', price: 30, color: '#bfe0ff', pattern: 'stars' },
  { id: 'hearts', name: 'Sweet Hearts', price: 30, color: '#ffc7dc', pattern: 'hearts' },
  { id: 'lemon', name: 'Lemon Check', price: 30, color: '#fff2b8', pattern: 'check' },
  { id: 'garden', name: 'Flower Garden', price: 40, color: '#d6f5c9', pattern: 'flowers' },
  { id: 'berry', name: 'Berry Stars', price: 40, color: '#d78ab8', pattern: 'stars' },
  { id: 'night', name: 'Night Sky', price: 50, color: '#5a5aa8', pattern: 'stars' },
  { id: 'cream', name: 'Cream', price: 0, color: '#fff6ea', pattern: 'none' },
  { id: 'coral', name: 'Coral Dots', price: 30, color: '#ffb8a8', pattern: 'dots' },
];
export const FLOORS: FloorStyle[] = [
  { id: 'woodLight', name: 'Honey Wood', price: 0, kind: 'wood', a: '#e8c39a', b: '#d4a77a' },
  { id: 'woodDark', name: 'Cocoa Wood', price: 0, kind: 'wood', a: '#b98160', b: '#9e6a4c' },
  { id: 'tilesPink', name: 'Pink Tiles', price: 0, kind: 'tiles', a: '#ffffff', b: '#ffc7dc' },
  { id: 'tilesMint', name: 'Mint Tiles', price: 20, kind: 'tiles', a: '#ffffff', b: '#b8ecd9' },
  { id: 'carpetLilac', name: 'Lilac Carpet', price: 20, kind: 'carpet', a: '#d9c4f5', b: '#cbb2ee' },
  { id: 'carpetPink', name: 'Fluffy Pink', price: 20, kind: 'carpet', a: '#ffc2d9', b: '#ffb0cd' },
  { id: 'marble', name: 'Marble', price: 40, kind: 'marble', a: '#f8f6fa', b: '#dcd6e6' },
  { id: 'checker', name: 'Checkerboard', price: 30, kind: 'tiles', a: '#fff', b: '#4a4a5e' },
];
export const WALL_BY_ID = Object.fromEntries(WALLS.map((w) => [w.id, w]));
export const FLOOR_BY_ID = Object.fromEntries(FLOORS.map((w) => [w.id, w]));

export function floorArt(fl: FloorStyle, top: number): string {
  let g = R(-600, top, 2800, 1400, 0, fl.a);
  if (fl.kind === 'wood') {
    for (let row = 0, y = top; y < top + 900; row++, y += 46) {
      g += R(-600, y, 2800, 3, 0, fl.b);
      for (let x = -600 + ((row * 173) % 260); x < 2200; x += 260) g += R(x, y, 3, 46, 0, fl.b) + R(x + 40, y + 14, 70, 3, 1.5, light(fl.a, 0.25), 'opacity="0.5"');
    }
  } else if (fl.kind === 'tiles') {
    for (let row = 0, y = top; y < top + 900; row++, y += 70) for (let col = 0, x = -600; x < 2200; col++, x += 90) if ((row + col) % 2) g += R(x, y, 90, 70, 0, fl.b);
    g += R(-600, top, 2800, 1400, 0, 'url(#g-glass)', 'opacity="0.25"');
  } else if (fl.kind === 'carpet') {
    for (let i = 0; i < 160; i++) g += C(((i * 397) % 2800) - 600, top + 10 + ((i * 131) % 700), 3, fl.b);
  } else {
    for (let i = 0; i < 9; i++) {
      const x = ((i * 311) % 2400) - 400;
      g += P(`M${x} ${top} q40 80 10 160 t30 200 t-20 200`, 'none', `stroke="${fl.b}" stroke-width="3" opacity="0.8"`);
    }
    for (let y = top; y < top + 900; y += 120) g += R(-600, y, 2800, 2, 0, fl.b, 'opacity="0.6"');
  }
  return g + R(-600, top, 2800, 1400, 0, 'url(#g-floorDepth)');
}

export function windowArt(x: number, y: number, w: number, h: number, s: Season, curtain: string, night = false): string {
  const id = uid('win');
  const L = SEASON_LOOK[s];
  let view = `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>${skyDefs(id + 's', s).replace(/<\/?defs>/g, '')}</defs>`;
  view += `<g clip-path="url(#${id})">${R(x, y, w, h, 0, night ? '#2a2f6a' : `url(#${id}s)`)}`;
  view += night ? C(x + w * 0.7, y + h * 0.25, 22, '#fff8d0') : C(x + w * 0.75, y + h * 0.22, 26, L.sun);
  view += cloud(x + w * 0.3, y + h * 0.25, 0.45);
  view += P(`M${x} ${y + h * 0.7} Q${x + w * 0.3} ${y + h * 0.5} ${x + w * 0.6} ${y + h * 0.68} Q${x + w * 0.85} ${y + h * 0.55} ${x + w} ${y + h * 0.65} L${x + w} ${y + h} L${x} ${y + h}Z`, L.hill1);
  view += R(x, y + h * 0.8, w, h * 0.2, 0, L.grass);
  view += seasonTree(x + w * 0.25, y + h * 0.86, 0.45, s, 1);
  if (s === 'winter') for (let i = 0; i < 14; i++) view += C(x + ((i * 53) % w), y + ((i * 37) % (h * 0.8)), 3, '#fff');
  view += `</g>`;
  const fr = '#ffffff';
  let g = R(x - 18, y - 18, w + 36, h + 36, 16, fr) + R(x - 18, y - 18, w + 36, h + 36, 16, 'url(#g-shadeY)') + view + R(x, y, w, h, 10, 'url(#g-glass)');
  g += R(x + w / 2 - 6, y, 12, h, 3, fr) + R(x, y + h / 2 - 6, w, 12, 3, fr);
  g += R(x - 34, y + h + 10, w + 68, 22, 8, fr) + R(x - 34, y + h + 26, w + 68, 8, 4, dark(fr, 0.1));
  // curtains
  const cw = w * 0.32;
  g += P(`M${x - 50} ${y - 46} L${x - 50 + cw} ${y - 46} Q${x - 50 + cw * 0.8} ${y + h * 0.45} ${x - 50 + cw * 0.35} ${y + h * 0.5} Q${x - 30 + cw * 0.3} ${y + h * 0.8} ${x - 20} ${y + h + 40} L${x - 56} ${y + h + 40}Z`, curtain);
  g += P(`M${x + w + 50} ${y - 46} L${x + w + 50 - cw} ${y - 46} Q${x + w + 50 - cw * 0.8} ${y + h * 0.45} ${x + w + 50 - cw * 0.35} ${y + h * 0.5} Q${x + w + 30 - cw * 0.3} ${y + h * 0.8} ${x + w + 20} ${y + h + 40} L${x + w + 56} ${y + h + 40}Z`, curtain);
  g += P(`M${x - 50} ${y - 46} L${x - 50 + cw} ${y - 46} Q${x - 50 + cw * 0.8} ${y + h * 0.45} ${x - 50 + cw * 0.35} ${y + h * 0.5} Q${x - 30 + cw * 0.3} ${y + h * 0.8} ${x - 20} ${y + h + 40} L${x - 56} ${y + h + 40}Z`, 'url(#g-shadeX)');
  g += P(`M${x + w + 50} ${y - 46} L${x + w + 50 - cw} ${y - 46} Q${x + w + 50 - cw * 0.8} ${y + h * 0.45} ${x + w + 50 - cw * 0.35} ${y + h * 0.5} Q${x + w + 30 - cw * 0.3} ${y + h * 0.8} ${x + w + 20} ${y + h + 40} L${x + w + 56} ${y + h + 40}Z`, 'url(#g-shadeX)');
  g += `<g transform="translate(${x - 50 + cw * 0.4} ${y + h * 0.5}) scale(0.7)">${bowG(0, 0, 1, dark(curtain, 0.15))}</g><g transform="translate(${x + w + 50 - cw * 0.4} ${y + h * 0.5}) scale(0.7)">${bowG(0, 0, 1, dark(curtain, 0.15))}</g>`;
  g += R(x - 80, y - 60, w + 160, 18, 9, '#c9a27e') + C(x - 80, y - 51, 14, '#c9a27e') + C(x + w + 80, y - 51, 14, '#c9a27e');
  g += P(`M${x - 60} ${y - 46} ${Array.from({ length: 8 }, (_, i) => `Q${f(x - 60 + ((w + 120) * (i + 0.5)) / 8)} ${y - 4} ${f(x - 60 + ((w + 120) * (i + 1)) / 8)} ${y - 46}`).join(' ')}Z`, light(curtain, 0.1));
  return g;
}

export function roomArt(room: 'bedroom' | 'kitchen' | 'living', s: Season, wall: WallStyle, floor: FloorStyle, floorTop: number): string {
  let g = full(wall.color);
  if (wall.pattern !== 'none') g += full(`url(#w-${wall.pattern})`);
  g += full('url(#g-wallDepth)');
  g += R(-600, -40, 2800, 26, 0, '#ffffff', 'opacity="0.8"') + R(-600, -14, 2800, 6, 0, dark(wall.color, 0.1), 'opacity="0.5"');
  if (room === 'bedroom') g += windowArt(1120, 120, 260, 250, s, '#ff9ec7');
  if (room === 'kitchen') {
    g += R(-600, floorTop - 300, 2800, 120, 0, '#ffffff', 'opacity="0.55"');
    for (let x = -600; x < 2200; x += 40) for (let y = floorTop - 300; y < floorTop - 180; y += 30) g += R(x + 2, y + 2, 36, 26, 4, light(wall.color, 0.4), 'opacity="0.6"');
    g += windowArt(660, 90, 280, 200, s, '#7fd8c0');
  }
  if (room === 'living') g += windowArt(560, 100, 420, 280, s, '#c99bff');
  g += floorArt(floor, floorTop);
  g += R(-600, floorTop - 22, 2800, 26, 4, '#ffffff') + R(-600, floorTop + 2, 2800, 6, 0, '#3a1d3f', 'opacity="0.12"');
  return g;
}

// ---------------- places ----------------
export function playgroundArt(s: Season): string {
  let g = landscape(s, 500, { trees: [-160, 250, 1350, 1760] });
  g += picketFence(570, -600, 2200, s === 'winter' ? '#f4f0ff' : '#ffffff');
  if (s === 'winter') g += P('M-600 520 Q0 500 800 512 Q1400 500 2200 520 L2200 530 L-600 530Z', '#fff');
  g += ground(s, 560);
  g += P('M-600 760 Q400 680 800 740 Q1200 800 2200 700 L2200 800 Q1200 900 800 840 Q400 780 -600 860Z', s === 'winter' ? '#e8eef8' : '#f2dfb4', 'opacity="0.8"');
  return g;
}

export function schoolArt(s: Season, floorTop: number): string {
  let g = full('#fff1d6') + full('url(#g-wallDepth)');
  g += R(-600, floorTop - 200, 2800, 200, 0, '#ffd9a8');
  for (let x = -600; x < 2200; x += 80) g += R(x, floorTop - 196, 4, 196, 0, '#f0c48c');
  g += R(-600, floorTop - 206, 2800, 12, 4, '#e8b47a');
  // chalkboard
  g += R(360, 100, 880, 330, 18, '#b07a4f') + R(380, 118, 840, 294, 8, '#2f6b55') + R(380, 118, 840, 294, 8, 'url(#g-glass)', 'opacity="0.25"') + R(380, 412, 840, 18, 6, '#c98a5a');
  g += R(560, 414, 34, 10, 4, '#fff') + R(610, 414, 30, 10, 4, '#ff9ec7') + R(656, 414, 30, 10, 4, '#ffd36b') + R(1100, 410, 70, 18, 6, '#4a3f5e');
  // bunting
  const letters = 'ABCDEFGHIJ';
  g += P('M-200 30 Q800 90 1800 30', 'none', 'stroke="#c9a27e" stroke-width="3"');
  for (let i = 0; i < 10; i++) {
    const x = 80 + i * 150;
    const y = 30 + 60 * Math.sin((i / 9) * Math.PI) * 0.75;
    const col = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff'][i % 5];
    g += P(`M${x - 30} ${y} L${x + 30} ${y} L${x} ${y + 60}Z`, col) + T(x, y + 30, letters[i], 24, '#fff');
  }
  g += windowArt(1330, 150, 200, 230, s, '#7cc8ff');
  g += C(220, 200, 56, '#fff', 'stroke="#ff7eb6" stroke-width="10"') + P('M220 200 L220 166 M220 200 L246 214', 'none', 'stroke="#4a3f5e" stroke-width="6" stroke-linecap="round"');
  g += floorArt(FLOOR_BY_ID.woodLight, floorTop);
  g += R(-600, floorTop - 14, 2800, 18, 4, '#e8b47a');
  return g;
}

export const CHALK_BOX = { x: 390, y: 128, w: 820, h: 274 };

export function theaterArt(s: Season, curtainsOpen: boolean, lights: boolean): string {
  void s;
  let g = full('#3b2350');
  for (let x = -600; x < 2200; x += 160) g += R(x, -500, 60, 1100, 0, '#4a2c63');
  g += R(-600, 800, 2800, 900, 0, '#2a1838');
  // stage backdrop
  g += R(100, 40, 1400, 560, 0, '#1f2a6b');
  for (let i = 0; i < 40; i++) g += `<path d="${sparkleD(140 + ((i * 337) % 1320), 70 + ((i * 191) % 460), 4 + (i % 3) * 3)}" fill="#fff8c8" opacity="${0.4 + (i % 4) * 0.15}"><animate attributeName="opacity" values="0.2;1;0.2" dur="${2 + (i % 5) * 0.6}s" repeatCount="indefinite"/></path>`;
  g += C(1200, 160, 50, '#fff8d0') + C(1222, 146, 46, '#1f2a6b');
  // stage floor
  g += P('M0 560 L1600 560 L1680 780 L-80 780Z', '#c98a5a');
  for (let i = 0; i < 12; i++) g += P(`M${i * 140} 560 L${-80 + i * 160} 780`, 'none', 'stroke="#a86b4a" stroke-width="2" opacity="0.6"');
  g += P('M0 560 L1600 560 L1680 780 L-80 780Z', 'url(#g-floorDepth)');
  g += R(-120, 780, 1840, 44, 6, '#5a2a3a');
  for (let x = 40; x < 1600; x += 120) g += C(x, 802, 9, lights ? '#ffe680' : '#9a7a5a') + (lights ? C(x, 802, 22, '#ffe680', 'opacity="0.3"') : '');
  if (lights) for (const [x, c] of [[400, '#fff8d8'], [800, '#ffd9f0'], [1200, '#d9f0ff']] as const) g += P(`M${x - 40} -60 L${x + 40} -60 L${x + 220} 760 L${x - 220} 760Z`, c, 'opacity="0.18"') + E(x, 700, 230, 50, c, 'opacity="0.25"');
  return g;
}

export function theaterCurtains(open: boolean): string {
  const red = '#c2244a';
  const side = (sgn: number) => {
    const x0 = sgn < 0 ? -600 : 2200;
    const inner = open ? (sgn < 0 ? 180 : 1420) : 800;
    let d = `M${x0} -300 L${inner} -300 Q${inner + sgn * -10} 300 ${inner + sgn * (open ? -60 : 0)} 800 L${x0} 800Z`;
    let g = P(d, red);
    for (let i = 0; i < 8; i++) {
      const xx = x0 + ((inner - x0) * (i + 0.5)) / 8;
      g += P(`M${f(xx)} -300 L${f(xx)} 800`, 'none', `stroke="${dark(red, 0.25)}" stroke-width="14" opacity="0.5"`);
    }
    d = '';
    return g + R(inner - 30 * sgn - 15, 380, 30, 14, 7, '#ffd24a');
  };
  let g = `<g class="curtains">${side(-1)}${side(1)}</g>`;
  g += P(`M-600 -300 L2200 -300 L2200 60 ${Array.from({ length: 14 }, (_, i) => `Q${f(2200 - (2800 * (i + 0.5)) / 14)} 130 ${f(2200 - (2800 * (i + 1)) / 14)} 60`).join(' ')}Z`, dark(red, 0.1));
  g += R(-600, 40, 2800, 14, 0, '#ffd24a', 'opacity="0.9"');
  g += P(starD(800, 30, 30), 'url(#g-gold)');
  return g;
}

export function audience(cheer: boolean): string {
  let g = '';
  const kinds = ['bunny', 'bear', 'cat', 'kid', 'bunny', 'cat', 'bear', 'kid', 'cat', 'bunny'];
  const cols = ['#f6efe6', '#c98a5a', '#ffb35e', '#ffd3b5', '#ffffff', '#9aa3b5', '#a86b4a', '#e8a983', '#2d2a3a', '#ffd9e8'];
  kinds.forEach((k, i) => {
    const x = -100 + i * 200;
    const c = cols[i];
    let h = C(x, 870, 52, c);
    if (k === 'bunny') h += E(x - 22, 790, 13, 40, c) + E(x + 22, 790, 13, 40, c) + E(x - 22, 792, 6, 28, '#ffb3c7') + E(x + 22, 792, 6, 28, '#ffb3c7');
    if (k === 'bear') h += C(x - 38, 830, 18, c) + C(x + 38, 830, 18, c);
    if (k === 'cat') h += P(`M${x - 46} 850 L${x - 36} 800 L${x - 10} 826Z M${x + 46} 850 L${x + 36} 800 L${x + 10} 826Z`, c);
    if (k === 'kid') h += P(`M${x - 54} 870 A54 56 0 0 1 ${x + 54} 870 Q${x} 830 ${x - 54} 870Z`, '#5a3825');
    const bob = cheer ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -18;0 0" dur="${0.5 + (i % 3) * 0.12}s" repeatCount="indefinite"/>` : '';
    g += `<g opacity="0.95"><g>${bob}${h}</g></g>`;
  });
  g += R(-600, 880, 2800, 400, 0, '#5a1e33');
  for (let x = -600; x < 2200; x += 120) g += R(x + 6, 870, 108, 60, 30, '#8a2a4a') + R(x + 16, 876, 88, 10, 5, '#a8385a');
  return g;
}

export function salonArt(s: Season, floorTop: number): string {
  void s;
  let g = full('#e9fbf4');
  for (let x = -600; x < 2200; x += 70) g += R(x, -500, 34, 1100, 0, '#d4f5e8');
  g += full('url(#g-wallDepth)');
  g += T(800, 70, 'Beauty Salon', 64, '#ff7eb6', 'stroke="#fff" stroke-width="10" paint-order="stroke" letter-spacing="2"');
  g += P(sparkleD(530, 40, 16), '#ffd36b') + P(sparkleD(1070, 50, 14), '#7cc8ff');
  // mirrors
  for (const x of [380, 1220]) {
    g += P(roundRectD(x - 150, 130, 300, 330, 140), 'url(#g-gold)') + P(roundRectD(x - 134, 146, 268, 298, 126), '#d9efff') + P(roundRectD(x - 134, 146, 268, 298, 126), 'url(#g-glass)');
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      g += C(x + Math.cos(a) * 146, 276 + Math.sin(a) * 146, 9, '#fff6c8', 'stroke="#ffd24a" stroke-width="2"');
    }
    g += R(x - 170, 470, 340, 24, 10, '#ffffff') + R(x - 170, 488, 340, 8, 4, '#d0e8e0');
    const cols = ['#ff7eb6', '#c99bff', '#7cc8ff', '#ffd36b'];
    cols.forEach((c, i) => (g += R(x - 140 + i * 30, 430, 20, 40, 6, c) + R(x - 136 + i * 30, 420, 12, 12, 3, '#4a4a5e')));
    g += C(x + 110, 452, 18, '#ffd9e8');
  }
  // shelf in the middle
  g += R(690, 160, 220, 300, 14, '#ffd9e8') + R(700, 260, 200, 8, 3, '#fff') + R(700, 360, 200, 8, 3, '#fff');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) g += R(712 + i * 38, 210 + r * 100, 24, 50, 8, ['#ff9ec7', '#7cc8ff', '#c99bff', '#5fd3b5', '#ffd36b'][(i + r) % 5]);
  g += P(heartD(800, 172, 16), '#ff7eb6');
  g += floorArt(FLOOR_BY_ID.tilesPink, floorTop);
  g += R(-600, floorTop - 14, 2800, 18, 4, '#fff');
  return g;
}

export function boutiqueArt(s: Season, floorTop: number): string {
  let g = full('#ffe3ef') + full('url(#w-dots)', 'opacity="0.5"') + full('url(#g-wallDepth)');
  for (const x of [200, 1400]) g += P(`M${x - 150} ${floorTop - 20} L${x - 150} 260 A150 150 0 0 1 ${x + 150} 260 L${x + 150} ${floorTop - 20}Z`, '#fff6fa', 'stroke="#ffffff" stroke-width="18"');
  g += windowArt(650, 150, 300, 220, s, '#ff7eb6');
  g += T(800, 80, 'Boutique', 70, 'url(#g-gold)', 'stroke="#fff" stroke-width="10" paint-order="stroke" font-style="italic"');
  // chandeliers
  for (const x of [200, 1400]) {
    g += P(`M${x} -60 L${x} 40`, 'none', 'stroke="#d9a63a" stroke-width="4"') + P(`M${x - 70} 60 Q${x} 110 ${x + 70} 60`, 'none', 'stroke="url(#g-gold)" stroke-width="8"');
    for (const dx of [-70, -35, 0, 35, 70]) g += C(x + dx, 60 + (dx === 0 ? 24 : Math.abs(dx) === 35 ? 18 : 0), 9, '#fff8d8') + `<path d="M${x + dx} ${70 + (dx === 0 ? 24 : Math.abs(dx) === 35 ? 18 : 0)} l-6 16 l6 8 l6 -8z" fill="#d9efff"/>`;
  }
  g += floorArt(FLOOR_BY_ID.marble, floorTop);
  g += R(-600, floorTop - 14, 2800, 18, 4, '#fff');
  return g;
}

// ---------------- town map ----------------
const roofSnow = (d: string, on: boolean) => (on ? P(d, '#ffffff') : '');
function label(x: number, y: number, text: string, color: string): string {
  const w = text.length * 22 + 50;
  return `<g class="map-label">${R(x - w / 2, y - 26, w, 52, 26, '#ffffff', 'opacity="0.95"')}${R(x - w / 2, y - 26, w, 52, 26, 'none', `stroke="${color}" stroke-width="5"`)}${T(x, y + 12, text, 32, color)}</g>`;
}

export function homeBuilding(s: Season): string {
  const w = s === 'winter';
  let g = R(-150, -200, 300, 200, 10, '#ffd9e8') + R(-150, -200, 300, 200, 10, 'url(#g-shadeX)');
  g += R(70, -330, 40, 90, 6, '#d96a8a') + (s === 'winter' ? '' : `<g opacity="0.7">${C(90, -350, 12, '#fff')}${C(100, -376, 16, '#fff')}<animateTransform attributeName="transform" type="translate" values="0 0;6 -20;0 0" dur="3s" repeatCount="indefinite"/></g>`);
  g += P('M-180 -190 L0 -340 L180 -190Z', '#ff6f9f') + P('M-180 -190 L0 -340 L0 -190Z', '#ff86ad');
  g += roofSnow('M-180 -190 L0 -340 L180 -190 L160 -186 Q120 -200 80 -186 Q40 -200 0 -188 Q-40 -200 -80 -186 Q-120 -200 -160 -186Z', w);
  g += C(0, -250, 26, '#fff') + C(0, -250, 20, '#bfe8ff') + P(heartD(0, -262, 10), '#ff7eb6');
  g += R(-40, -120, 80, 120, 40, '#b05a7a') + R(-34, -114, 68, 114, 34, '#d07a9a') + C(22, -56, 5, '#ffd24a') + P(heartD(0, -100, 12), '#ffd9e8');
  for (const x of [-105, 105]) {
    g += R(x - 32, -160, 64, 60, 8, '#fff') + R(x - 26, -154, 52, 48, 6, '#bfe8ff') + R(x - 26, -154, 52, 48, 6, 'url(#g-glass)') + R(x - 2, -154, 4, 48, 0, '#fff');
    g += R(x - 38, -98, 76, 18, 6, '#a86b4a') + (s === 'winter' ? R(x - 38, -104, 76, 8, 4, '#fff') : [-24, -8, 8, 24].map((dx, i) => C(x + dx, -102, 8, ['#ff4f8b', '#ffd36b', '#fff', '#c99bff'][i])).join(''));
  }
  if (s === 'winter') g += C(0, -132, 18, 'none', 'stroke="#2f7a5a" stroke-width="8"') + `<g transform="translate(0 -116) scale(0.4)">${bowG(0, 0, 1, '#e8384f')}</g>`;
  if (s === 'fall') g += E(-80, -10, 22, 18, '#ff8a3d') + R(-83, -34, 6, 10, 2, '#5fae6b');
  return g;
}

function schoolBuilding(s: Season): string {
  let g = R(-200, -230, 400, 230, 8, '#ffe8b8') + R(-200, -230, 400, 230, 8, 'url(#g-shadeX)');
  g += P('M-60 -230 L-60 -330 L60 -330 L60 -230Z', '#ffd38a') + P('M-80 -326 L0 -400 L80 -326Z', '#e85d5d') + C(0, -290, 26, '#fff', 'stroke="#c98a5a" stroke-width="5"') + P('M0 -290 L0 -306 M0 -290 L12 -284', 'none', 'stroke="#4a3f5e" stroke-width="4" stroke-linecap="round"');
  g += P('M-220 -220 L-200 -260 L200 -260 L220 -220Z', '#e85d5d') + roofSnow('M-220 -220 L-200 -262 L200 -262 L220 -220 Q100 -232 0 -224 Q-100 -232 -220 -220Z', s === 'winter') + roofSnow('M-80 -326 L0 -400 L80 -326 Q40 -334 0 -330 Q-40 -334 -80 -326Z', s === 'winter');
  g += P('M0 -400 L0 -450', 'none', 'stroke="#9aa3b5" stroke-width="4"') + P('M0 -450 L40 -438 L0 -426Z', '#ff7eb6');
  for (const x of [-150, -90, 90, 150]) for (const y of [-200, -120]) g += R(x - 24, y, 48, 54, 6, '#fff') + R(x - 19, y + 5, 38, 44, 4, '#bfe8ff') + R(x - 19, y + 5, 38, 44, 4, 'url(#g-glass)');
  g += R(-46, -130, 92, 130, 10, '#c98a5a') + R(-2, -130, 4, 130, 0, '#a86b4a') + R(-60, -150, 120, 24, 8, '#e85d5d') + T(0, -132, 'SCHOOL', 18, '#fff');
  return g;
}

function theaterBuilding(s: Season): string {
  let g = R(-190, -250, 380, 250, 10, '#9b6bff') + R(-190, -250, 380, 250, 10, 'url(#g-shadeX)');
  g += P('M-120 -250 A120 90 0 0 1 120 -250Z', '#7a4fe0') + roofSnow('M-120 -250 A120 90 0 0 1 120 -250 Q60 -262 0 -256 Q-60 -262 -120 -250Z', s === 'winter') + P(starD(0, -350, 22), 'url(#g-gold)');
  g += R(-170, -200, 340, 70, 14, '#ffd24a') + R(-160, -192, 320, 54, 10, '#c2244a') + T(0, -152, 'THEATER', 34, '#fff');
  for (let i = 0; i < 16; i++) g += `<circle cx="${-160 + i * 21.3}" cy="-200" r="5" fill="#fff8c8"><animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="${(i % 2) * 0.5}s" repeatCount="indefinite"/></circle>`;
  g += P('M-60 0 L-60 -100 A60 40 0 0 1 60 -100 L60 0Z', '#c2244a') + P('M-60 0 L-60 -100 Q-10 -60 -4 0Z', '#e03a62') + P('M60 0 L60 -100 Q10 -60 4 0Z', '#e03a62');
  for (const x of [-130, 130]) g += R(x - 30, -110, 60, 80, 30, '#fff8d8') + R(x - 24, -104, 48, 68, 24, '#ffd9f0') + P(starD(x, -70, 14), '#ffd24a');
  return g;
}

function salonBuilding(s: Season): string {
  let g = R(-160, -240, 320, 240, 10, '#a8ead2') + R(-160, -240, 320, 240, 10, 'url(#g-shadeX)');
  g += R(-176, -262, 352, 30, 8, '#fff') + roofSnow('M-176 -262 L176 -262 L176 -252 L-176 -252Z', s === 'winter');
  g += P(`M-170 -232 L170 -232 L170 -170 ${Array.from({ length: 8 }, (_, i) => `Q${f(170 - (340 * (i + 0.5)) / 8)} -140 ${f(170 - (340 * (i + 1)) / 8)} -170`).join(' ')}Z`, '#ff9ec7');
  for (let i = 0; i < 8; i++) if (i % 2) g += P(`M${-170 + i * 42.5} -232 L${-127.5 + i * 42.5} -232 L${-127.5 + i * 42.5} -170 Q${-148 + i * 42.5} -140 ${-170 + i * 42.5} -170Z`, '#fff');
  g += R(-130, -130, 150, 110, 10, '#fff') + R(-122, -122, 134, 94, 6, '#d9f7ff') + R(-122, -122, 134, 94, 6, 'url(#g-glass)') + C(-55, -80, 22, '#ffd9e8') + P(sparkleD(-20, -100, 9), '#fff');
  g += R(50, -130, 76, 130, 10, '#ff7eb6') + C(110, -66, 5, '#ffd24a');
  g += C(0, -310, 40, '#fff', 'stroke="#ff7eb6" stroke-width="6"') + C(-14, -298, 9, 'none', 'stroke="#ff7eb6" stroke-width="5"') + C(14, -298, 9, 'none', 'stroke="#ff7eb6" stroke-width="5"') + P('M-8 -304 L14 -336 M8 -304 L-14 -336', 'none', 'stroke="#9aa3b5" stroke-width="5" stroke-linecap="round"');
  g += P('M0 -270 L0 -262', 'none', 'stroke="#9aa3b5" stroke-width="4"');
  return g;
}

function boutiqueBuilding(s: Season): string {
  let g = R(-170, -250, 340, 250, 10, '#ffb3d1') + R(-170, -250, 340, 250, 10, 'url(#g-shadeX)');
  g += P('M-190 -250 L190 -250 L170 -300 L-170 -300Z', '#e0457b') + roofSnow('M-190 -250 L-170 -302 L170 -302 L190 -250 Q0 -266 -190 -250Z', s === 'winter');
  g += R(-140, -236, 280, 50, 10, '#fff') + T(0, -199, 'BOUTIQUE', 30, '#e0457b');
  g += P(`M-160 -180 L160 -180 L160 -150 ${Array.from({ length: 8 }, (_, i) => `Q${f(160 - (320 * (i + 0.5)) / 8)} -124 ${f(160 - (320 * (i + 1)) / 8)} -150`).join(' ')}Z`, '#fff');
  g += R(-140, -130, 160, 120, 8, '#fff') + R(-132, -122, 144, 104, 6, '#fff3f8') + R(-132, -122, 144, 104, 6, 'url(#g-glass)');
  g += P('M-80 -110 Q-60 -116 -40 -110 L-30 -50 Q-60 -42 -90 -50Z', '#c99bff') + C(-60, -116, 8, '#f0e6ee');
  g += R(40, -130, 90, 130, 10, '#fff') + R(48, -122, 74, 122, 8, '#ff9ec7') + P(heartD(85, -90, 16), '#fff');
  return g;
}

function playgroundMini(s: Season): string {
  let g = E(0, -10, 210, 50, s === 'winter' ? '#f2f6ff' : '#f2dfb4');
  g += picketFence(-20, -200, 200, '#fff').replace(/<path/g, '<path transform="scale(1 0.7)"');
  g += P('M-140 -40 L-140 -170 M-80 -40 L-80 -170', 'none', 'stroke="#9aa3b5" stroke-width="7"') + R(-150, -176, 80, 12, 5, '#ffd36b') + P('M-80 -176 C0 -170 20 -60 100 -40 L104 -30 C10 -50 -10 -150 -80 -156Z', '#5fd3b5');
  g += P('M110 -40 L130 -180 L150 -40 M190 -40 L170 -180 L150 -40', 'none', 'stroke="#ff7eb6" stroke-width="7"') + R(120, -186, 60, 12, 5, '#ff7eb6') + P('M140 -180 L140 -90 M160 -180 L160 -90', 'none', 'stroke="#9aa3b5" stroke-width="2"') + R(132, -94, 36, 8, 3, '#ffd36b');
  if (s === 'winter') g += C(-10, -40, 26, '#fff') + C(-10, -76, 18, '#fff') + C(-16, -80, 2.5, '#2d2a3a') + C(-4, -80, 2.5, '#2d2a3a') + P('M-10 -74 L4 -72 L-10 -70Z', '#ff8a3d');
  return g;
}

export interface MapSpot { id: string; x: number; y: number; w: number; h: number; label: string; color: string; }
export const MAP_SPOTS: MapSpot[] = [
  { id: 'home', x: 270, y: 470, w: 360, h: 360, label: 'Home', color: '#ff6f9f' },
  { id: 'school', x: 800, y: 430, w: 440, h: 460, label: 'School', color: '#e85d5d' },
  { id: 'theater', x: 1330, y: 470, w: 400, h: 380, label: 'Theater', color: '#7a4fe0' },
  { id: 'playground', x: 300, y: 830, w: 420, h: 260, label: 'Playground', color: '#3fbf8f' },
  { id: 'salon', x: 800, y: 840, w: 360, h: 360, label: 'Salon', color: '#3fbf8f' },
  { id: 'boutique', x: 1300, y: 840, w: 380, h: 340, label: 'Boutique', color: '#e0457b' },
];

export function townArt(s: Season): string {
  let g = landscape(s, 330, { trees: [-300, 560, 1060, 1900], sunX: 1500 });
  g += ground(s, 330);
  const road = s === 'winter' ? '#dfe6f2' : '#f2dfb4';
  g += P('M-600 600 Q200 540 800 600 Q1400 660 2200 590 L2200 650 Q1400 720 800 660 Q200 600 -600 660Z', road);
  g += P('M780 300 Q760 450 800 620 L840 620 Q820 450 820 300Z', road);
  for (let x = -500; x < 2200; x += 120) g += R(x, 624 + 20 * Math.sin(x / 300), 50, 6, 3, '#fff', 'opacity="0.8"');
  for (const [x, y, sc] of [[40, 560, 0.7], [1560, 580, 0.75], [1060, 330, 0.55], [560, 330, 0.55], [-120, 880, 0.9], [1720, 900, 0.9]] as const) g += seasonTree(x, y, sc, s, Math.round(x) % 3);
  const art: Record<string, string> = { home: homeBuilding(s), school: schoolBuilding(s), theater: theaterBuilding(s), playground: playgroundMini(s), salon: salonBuilding(s), boutique: boutiqueBuilding(s) };
  for (const sp of MAP_SPOTS) {
    const sc = sp.id === 'school' ? 0.95 : sp.id === 'playground' ? 0.9 : 0.85;
    g += `<g class="map-spot" data-place="${sp.id}" transform="translate(${sp.x} ${sp.y})"><g class="map-bounce">${E(0, 0, sp.w * 0.45 * sc, 22, 'url(#g-ground)')}<g transform="scale(${sc})">${art[sp.id]}</g>${label(0, 50, sp.label, sp.color)}</g></g>`;
  }
  if (s === 'winter') g += `<g transform="translate(560 640) scale(0.5)">${C(0, -60, 62, '#fff')}${C(0, -160, 46, '#fff')}${C(-12, -168, 5, '#2d2a3a')}${C(12, -168, 5, '#2d2a3a')}${P('M0 -158 L30 -152 L0 -148Z', '#ff8a3d')}${R(-44, -130, 88, 16, 8, '#e8384f')}</g>`;
  if (s === 'summer') g += `<g transform="translate(1060 660)">${E(0, 0, 90, 26, '#7cd8ff')}${E(0, -4, 80, 20, '#a8e6ff')}${C(20, -6, 10, '#ff7eb6')}</g>`;
  return g;
}
