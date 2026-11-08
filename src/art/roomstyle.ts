// Room styles: wallpapers, floors, trim and curtain colors. Each style is drawn with its own SVG
// pattern so rooms look rich without hundreds of shared defs.
import { dark, light, luma } from './color';
import { flowerG, heartD, starD } from './wear';

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;

let n = 0;
const pid = (p: string) => `${p}${++n}`;
const pattern = (id: string, w: number, h: number, body: string, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" ${extra}>${body}</pattern>`;

// ---------------- walls ----------------
export type WallKind = 'paint' | 'pattern' | 'brick' | 'panels' | 'wainscot' | 'tiles' | 'mural';
export interface WallStyle { id: string; name: string; price: number; color: string; pattern: string; kind?: WallKind; b?: string; group?: string; }

const WALL_COLORS: [string, string][] = [
  ['Pink', '#ffd9e8'], ['Rose', '#ffc7dc'], ['Lilac', '#e6d4ff'], ['Lavender', '#d9c8f5'], ['Mint', '#c9f2e3'], ['Sky', '#cfe8ff'], ['Lemon', '#fff2b8'],
  ['Peach', '#ffe2cc'], ['Coral', '#ffb8a8'], ['Cream', '#fff6ea'], ['Sage', '#d6e8c9'], ['Berry', '#d78ab8'], ['Navy', '#5a5aa8'], ['Cloud Gray', '#e4e6ee'],
];
const WALL_PATTERNS: [string, string][] = [
  ['dots', 'Dots'], ['bigdots', 'Polka'], ['stripes', 'Candy Stripes'], ['vstripes', 'Stripes'], ['hearts', 'Hearts'], ['stars', 'Stars'], ['check', 'Gingham'],
  ['flowers', 'Flowers'], ['clouds', 'Clouds'], ['damask', 'Fancy'], ['scallop', 'Scallops'], ['diamond', 'Argyle'], ['confetti', 'Confetti'], ['leaves', 'Leaves'],
];

/** Wallpapers from before there were so many: kept with the same ids so saved rooms stay the same. */
const CLASSIC_WALLS: WallStyle[] = [
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
].map((w) => ({ ...w, group: 'Favorites' }));

function buildWalls(): WallStyle[] {
  const out: WallStyle[] = [...CLASSIC_WALLS];
  WALL_COLORS.forEach(([name, color], i) => out.push({ id: `wall-paint-${i}`, name: `${name} Paint`, price: i < 8 ? 0 : 10, color, pattern: 'none', kind: 'paint', group: 'Paint' }));
  WALL_PATTERNS.forEach(([pat, pname], pi) => {
    for (let k = 0; k < 6; k++) {
      const [cname, color] = WALL_COLORS[(pi * 3 + k * 2) % WALL_COLORS.length];
      out.push({ id: `wall-${pat}-${k}`, name: `${cname} ${pname}`, price: k < 2 ? 0 : 15 + k * 5, color, pattern: pat, kind: 'pattern', group: pname });
    }
  });
  const special: WallStyle[] = [
    { id: 'wall-brick-red', name: 'Red Brick', price: 30, color: '#e8907a', pattern: 'none', kind: 'brick', group: 'Brick & Wood' },
    { id: 'wall-brick-white', name: 'White Brick', price: 30, color: '#f6efe8', pattern: 'none', kind: 'brick', group: 'Brick & Wood' },
    { id: 'wall-brick-pink', name: 'Pink Brick', price: 35, color: '#f4b8c8', pattern: 'none', kind: 'brick', group: 'Brick & Wood' },
    { id: 'wall-brick-gray', name: 'Stone Brick', price: 35, color: '#c9cad6', pattern: 'none', kind: 'brick', group: 'Brick & Wood' },
    { id: 'wall-panels-honey', name: 'Honey Wood Wall', price: 30, color: '#e8c39a', pattern: 'none', kind: 'panels', group: 'Brick & Wood' },
    { id: 'wall-panels-white', name: 'White Wood Wall', price: 30, color: '#f6f1ea', pattern: 'none', kind: 'panels', group: 'Brick & Wood' },
    { id: 'wall-panels-cocoa', name: 'Cocoa Wood Wall', price: 35, color: '#b98160', pattern: 'none', kind: 'panels', group: 'Brick & Wood' },
    { id: 'wall-panels-mint', name: 'Mint Wood Wall', price: 35, color: '#b8e6d2', pattern: 'none', kind: 'panels', group: 'Brick & Wood' },
  ];
  const wains: [string, string, string, string][] = [
    ['Pink & White', '#ffd9e8', '#ffffff', 'dots'], ['Lilac & Cream', '#e6d4ff', '#fff6ea', 'stars'], ['Mint & White', '#c9f2e3', '#ffffff', 'vstripes'], ['Sky & White', '#cfe8ff', '#ffffff', 'clouds'],
    ['Lemon & Sage', '#fff2b8', '#d6e8c9', 'flowers'], ['Peach & Coral', '#ffe2cc', '#ffb8a8', 'scallop'], ['Rose & Berry', '#ffc7dc', '#d78ab8', 'hearts'], ['Cream & Wood', '#fff6ea', '#d9a477', 'none'],
  ];
  wains.forEach(([name, a, b, pat], i) => special.push({ id: `wall-wainscot-${i}`, name, price: i < 2 ? 0 : 25, color: a, b, pattern: pat, kind: 'wainscot', group: 'Wainscot' }));
  const tiles: [string, string, string][] = [['White Tiles', '#ffffff', '#e6e2ee'], ['Pink Tiles', '#ffd9e8', '#ffffff'], ['Mint Tiles', '#c9f2e3', '#ffffff'], ['Sky Tiles', '#cfe8ff', '#ffffff'], ['Lilac Tiles', '#e6d4ff', '#ffffff'], ['Lemon Tiles', '#fff2b8', '#ffffff']];
  tiles.forEach(([name, a, b], i) => special.push({ id: `wall-tiles-${i}`, name, price: i < 2 ? 0 : 20, color: a, b, pattern: 'none', kind: 'tiles', group: 'Tiles' }));
  const murals: [string, string, string][] = [['rainbow', 'Rainbow Mural', '#cfe8ff'], ['night', 'Starry Night Mural', '#3b3a8f'], ['garden', 'Garden Mural', '#d9f2ff'], ['ocean', 'Ocean Mural', '#9fd6ff'], ['castle', 'Castle Mural', '#ffe6f1']];
  murals.forEach(([pat, name, color]) => special.push({ id: `wall-mural-${pat}`, name, price: 60, color, pattern: pat, kind: 'mural', group: 'Murals' }));
  return [...out, ...special];
}
export const WALLS: WallStyle[] = buildWalls();
export const WALL_BY_ID: Record<string, WallStyle> = Object.fromEntries(WALLS.map((w) => [w.id, w]));

/** The repeating picture for a wallpaper pattern, in a given ink color. */
function wallTile(pat: string, ink: string, base: string): { w: number; h: number; body: string; rot?: number } | null {
  const a = 0.55;
  switch (pat) {
    case 'dots': return { w: 56, h: 56, body: C(14, 14, 7, ink, `opacity="${a}"`) + C(42, 42, 7, ink, `opacity="${a}"`) };
    case 'bigdots': return { w: 130, h: 130, body: C(32, 32, 20, ink, `opacity="${a}"`) + C(97, 97, 20, ink, `opacity="${a}"`) };
    case 'stripes': return { w: 60, h: 60, body: R(0, 0, 24, 60, 0, ink, `opacity="${a}"`), rot: 35 };
    case 'vstripes': return { w: 80, h: 80, body: R(0, 0, 34, 80, 0, ink, `opacity="${a * 0.8}"`) + R(42, 0, 4, 80, 0, ink, `opacity="${a}"`) };
    case 'hearts': return { w: 110, h: 110, body: P(heartD(28, 16, 15), ink, `opacity="${a}"`) + P(heartD(82, 70, 15), ink, `opacity="${a}"`) };
    case 'stars': return { w: 110, h: 110, body: P(starD(28, 30, 15), ink, `opacity="${a}"`) + P(starD(82, 84, 15), ink, `opacity="${a}"`) + C(80, 22, 3, ink, `opacity="${a}"`) + C(24, 82, 3, ink, `opacity="${a}"`) };
    case 'check': return { w: 80, h: 80, body: R(0, 0, 40, 80, 0, ink, 'opacity="0.3"') + R(0, 0, 80, 40, 0, ink, 'opacity="0.3"') };
    case 'flowers': return { w: 120, h: 120, body: `<g opacity="0.85">${flowerG(30, 30, 18, ink, '#ffd36b')}${flowerG(90, 90, 18, ink, '#ff9ec7')}</g>` + P('M78 34 q8 -10 16 0 q-8 10 -16 0Z', '#8fd18a', 'opacity="0.7"') };
    case 'clouds': return { w: 240, h: 170, body: `<g fill="${ink}" opacity="0.7">${C(40, 50, 22, ink)}${C(68, 40, 28, ink)}${C(96, 52, 20, ink)}${R(30, 50, 80, 22, 11, ink)}${C(160, 128, 16, ink)}${C(182, 120, 20, ink)}${C(202, 130, 14, ink)}${R(150, 128, 62, 16, 8, ink)}</g>` };
    case 'damask': return { w: 120, h: 150, body: `<g fill="${ink}" opacity="0.45"><path d="M60 15 C75 35 90 45 60 75 C30 45 45 35 60 15Z"/><path d="M60 75 C80 80 92 98 78 112 C70 100 64 96 60 110 C56 96 50 100 42 112 C28 98 40 80 60 75Z"/><circle cx="60" cy="125" r="6"/><path d="M0 75 C10 90 20 95 0 115Z M120 75 C110 90 100 95 120 115Z"/></g>` };
    case 'scallop': {
      let d = '';
      for (let i = 0; i < 2; i++) d += `M${i * 50} 50 a25 25 0 0 1 50 0`;
      return { w: 100, h: 50, body: `<path d="${d}" fill="none" stroke="${ink}" stroke-width="5" opacity="${a}"/>` + C(25, 32, 3, ink, `opacity="${a}"`) + C(75, 32, 3, ink, `opacity="${a}"`) };
    }
    case 'diamond': return { w: 100, h: 140, body: P('M50 0 L100 70 L50 140 L0 70Z', ink, 'opacity="0.3"') + `<path d="M0 0 L100 140 M100 0 L0 140" stroke="${dark(base, 0.25)}" stroke-width="2" opacity="0.5" stroke-dasharray="6 6"/>` };
    case 'confetti': {
      const cols = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff'];
      let b = '';
      for (let i = 0; i < 10; i++) b += R((i * 37) % 120, (i * 53) % 120, 14, 5, 2.5, cols[i % 5], `transform="rotate(${(i * 47) % 180} ${(i * 37) % 120} ${(i * 53) % 120})" opacity="0.8"`);
      return { w: 120, h: 120, body: b };
    }
    case 'leaves': return { w: 120, h: 120, body: `<g fill="${ink}" opacity="0.6"><path d="M20 40 C20 15 45 10 55 20 C45 40 30 45 20 40Z"/><path d="M75 100 C75 75 100 70 110 80 C100 100 85 105 75 100Z"/></g><path d="M22 40 L52 22 M77 100 L107 82" stroke="${dark(ink, 0.2)}" stroke-width="2" opacity="0.5"/>` };
  }
  return null;
}

function mural(pat: string, top: number): string {
  switch (pat) {
    case 'rainbow': {
      let g = '';
      ['#ff8fb0', '#ffc18a', '#ffe680', '#9fe6a8', '#8fd3ff', '#c9a8ff'].forEach((c, i) => (g += `<path d="M${-100 + i * 40} ${top} A${900 - i * 40} ${700 - i * 40} 0 0 1 ${1700 - i * 40} ${top}" fill="none" stroke="${c}" stroke-width="40" opacity="0.85"/>`));
      return g + [[120, 150], [1450, 200], [700, 80]].map(([x, y]) => C(x, y, 30, '#fff') + C(x + 36, y - 10, 38, '#fff') + C(x + 76, y, 28, '#fff')).join('');
    }
    case 'night': {
      let g = C(1320, 140, 60, '#fff8d0') + C(1346, 124, 54, '#3b3a8f');
      for (let i = 0; i < 60; i++) g += P(starD((i * 271) % 2400 - 400, (i * 131) % (top - 40) - 300, 4 + (i % 3) * 3), '#fff8c8', `opacity="${0.5 + (i % 4) * 0.12}"`);
      return g;
    }
    case 'garden': {
      let g = P(`M-600 ${top} Q0 ${top - 260} 600 ${top - 120} Q1200 ${top - 300} 2200 ${top - 100} L2200 ${top} Z`, '#b6eb98') + P(`M-600 ${top} Q300 ${top - 160} 900 ${top - 60} Q1500 ${top - 180} 2200 ${top - 40} L2200 ${top} Z`, '#8fd98a');
      for (let i = 0; i < 30; i++) g += flowerG((i * 211) % 2600 - 500, top - 30 - ((i * 37) % 120), 14, ['#ff9ec7', '#fff', '#ffd36b', '#c99bff'][i % 4]);
      return g + C(300, 120, 50, '#ffe066');
    }
    case 'ocean': {
      let g = '';
      for (let k = 0; k < 4; k++) g += `<path d="M-600 ${top - 360 + k * 90} ${Array.from({ length: 30 }, (_, i) => `q50 -24 100 0`).join(' ')}" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.5"/>`;
      for (let i = 0; i < 8; i++) {
        const x = 100 + i * 200;
        const y = top - 120 - (i % 3) * 120;
        g += `<g transform="translate(${x} ${y})"><ellipse rx="34" ry="20" fill="${['#ffab5e', '#ff7eb6', '#ffd36b'][i % 3]}"/><path d="M28 0 L52 -16 L52 16Z" fill="${['#ffab5e', '#ff7eb6', '#ffd36b'][i % 3]}"/><circle cx="-14" cy="-5" r="4" fill="#2d2a3a"/></g>`;
      }
      return g + [0, 1, 2, 3, 4, 5].map((i) => P(`M${i * 300 - 200} ${top} Q${i * 300 - 180} ${top - 140} ${i * 300 - 150} ${top - 200} Q${i * 300 - 130} ${top - 120} ${i * 300 - 110} ${top}Z`, '#5fc47c', 'opacity="0.8"')).join('');
    }
    case 'castle': {
      const c = '#ffb3d1';
      let g = R(500, top - 340, 600, 340, 0, c);
      for (const [x, w, h] of [[440, 120, 460], [1040, 120, 460], [740, 120, 520]]) {
        g += R(x, top - h, w, h, 0, light(c, 0.15)) + P(`M${x - 20} ${top - h} L${x + w / 2} ${top - h - 140} L${x + w + 20} ${top - h}Z`, '#c99bff');
        g += R(x + w / 2 - 20, top - h + 60, 40, 60, 20, '#fff6c8');
      }
      for (let x = 500; x < 1100; x += 60) g += R(x, top - 370, 40, 30, 4, c);
      return g + R(740, top - 160, 120, 160, 60, '#d07aa0') + [[300, 140], [1300, 110]].map(([x, y]) => C(x, y, 30, '#fff') + C(x + 36, y - 10, 38, '#fff') + C(x + 76, y, 28, '#fff')).join('');
    }
  }
  return '';
}

/** Draws a wall from x0..x1, y0 down to the floor line. */
export function wallArt(w: WallStyle, x0: number, y0: number, x1: number, floorTop: number): string {
  const W = x1 - x0;
  const H = floorTop - y0;
  let g = R(x0, y0, W, H, 0, w.color);
  const kind = w.kind ?? (w.pattern === 'none' ? 'paint' : 'pattern');
  // White on pastel walls, a soft darker tint on very pale ones, and pale gold on dark ones.
  const lum = luma(w.color);
  const ink = lum < 0.5 ? '#fff8c8' : lum > 0.93 ? dark(w.color, 0.16) : '#ffffff';
  const patFill = (pat: string, base: string, yA: number, yB: number) => {
    const t = wallTile(pat, ink, base);
    if (!t) return '';
    const id = pid('wp');
    return `<defs>${pattern(id, t.w, t.h, t.body, t.rot ? `patternTransform="rotate(${t.rot})"` : '')}</defs>` + R(x0, yA, W, yB - yA, 0, `url(#${id})`);
  };
  if (kind === 'pattern') g += patFill(w.pattern, w.color, y0, floorTop);
  if (kind === 'brick') {
    const id = pid('br');
    const m = light(w.color, 0.45);
    const tile = R(0, 0, 120, 60, 0, m) + R(3, 3, 114, 24, 4, w.color) + R(3, 33, 54, 24, 4, dark(w.color, 0.05)) + R(63, 33, 54, 24, 4, w.color) + R(8, 6, 40, 4, 2, '#fff', 'opacity="0.25"');
    g += `<defs>${pattern(id, 120, 60, tile)}</defs>` + R(x0, y0, W, H, 0, `url(#${id})`);
  }
  if (kind === 'panels') {
    const id = pid('pn');
    const tile = R(0, 0, 70, 400, 0, w.color) + R(0, 0, 3, 400, 0, dark(w.color, 0.18)) + R(30, 120, 3, 24, 1.5, dark(w.color, 0.12), 'opacity="0.6"') + R(48, 300, 3, 16, 1.5, dark(w.color, 0.12), 'opacity="0.6"');
    g += `<defs>${pattern(id, 70, 400, tile)}</defs>` + R(x0, y0, W, H, 0, `url(#${id})`);
  }
  if (kind === 'tiles') {
    const id = pid('tl');
    const tile = R(0, 0, 60, 60, 0, w.b ?? '#ffffff') + R(3, 3, 54, 54, 6, w.color) + R(8, 8, 18, 6, 3, '#fff', 'opacity="0.5"');
    g += `<defs>${pattern(id, 60, 60, tile)}</defs>` + R(x0, y0, W, H, 0, `url(#${id})`);
  }
  if (kind === 'wainscot') {
    const panelTop = floorTop - 230;
    g += patFill(w.pattern, w.color, y0, panelTop);
    const b = w.b ?? '#ffffff';
    g += R(x0, panelTop, W, floorTop - panelTop, 0, b);
    for (let x = x0 + 20; x < x1; x += 140) g += R(x, panelTop + 30, 110, floorTop - panelTop - 60, 8, 'none', `stroke="${dark(b, 0.12)}" stroke-width="4"`);
    g += R(x0, panelTop - 10, W, 20, 6, light(b, 0.3)) + R(x0, panelTop + 6, W, 5, 0, dark(b, 0.15), 'opacity="0.6"');
  }
  if (kind === 'mural') g += mural(w.pattern, floorTop);
  return g + R(x0, y0, W, H, 0, 'url(#g-wallDepth)');
}

// ---------------- floors ----------------
export type FloorKind = 'wood' | 'tiles' | 'carpet' | 'marble' | 'herringbone' | 'chevron' | 'parquet' | 'hex' | 'mosaic' | 'terrazzo' | 'diamond' | 'stars' | 'grass' | 'stone' | 'deck' | 'sand';
export interface FloorStyle { id: string; name: string; price: number; kind: FloorKind; a: string; b: string; c?: string; group?: string; outdoor?: boolean; }

const WOODS: [string, string, string][] = [['Honey', '#e8c39a', '#d4a77a'], ['Cocoa', '#b98160', '#9e6a4c'], ['Whitewash', '#f2ebe4', '#ddd2c8'], ['Driftwood', '#c9c6cf', '#b0adb8'], ['Cherry', '#c46a4a', '#a85a3e'], ['Blush', '#f4c9d6', '#e2adbd']];
const CLASSIC_FLOORS: FloorStyle[] = [
  { id: 'woodLight', name: 'Honey Wood', price: 0, kind: 'wood', a: '#e8c39a', b: '#d4a77a' },
  { id: 'woodDark', name: 'Cocoa Wood', price: 0, kind: 'wood', a: '#b98160', b: '#9e6a4c' },
  { id: 'tilesPink', name: 'Pink Tiles', price: 0, kind: 'tiles', a: '#ffffff', b: '#ffc7dc' },
  { id: 'tilesMint', name: 'Mint Tiles', price: 20, kind: 'tiles', a: '#ffffff', b: '#b8ecd9' },
  { id: 'carpetLilac', name: 'Lilac Carpet', price: 20, kind: 'carpet', a: '#d9c4f5', b: '#cbb2ee' },
  { id: 'carpetPink', name: 'Fluffy Pink', price: 20, kind: 'carpet', a: '#ffc2d9', b: '#ffb0cd' },
  { id: 'marble', name: 'Marble', price: 40, kind: 'marble', a: '#f8f6fa', b: '#dcd6e6' },
  { id: 'checker', name: 'Checkerboard', price: 30, kind: 'tiles', a: '#fff', b: '#4a4a5e' },
].map((x) => ({ ...x, group: 'Favorites' } as FloorStyle));

function buildFloors(): FloorStyle[] {
  const out: FloorStyle[] = [...CLASSIC_FLOORS];
  WOODS.forEach(([n, a, b], i) => i > 1 && out.push({ id: `floor-wood-${i}`, name: `${n} Planks`, price: i < 4 ? 0 : 20, kind: 'wood', a, b, group: 'Wood' }));
  WOODS.slice(0, 4).forEach(([n, a, b], i) => out.push({ id: `floor-herring-${i}`, name: `${n} Herringbone`, price: i ? 30 : 0, kind: 'herringbone', a, b, group: 'Wood' }));
  WOODS.slice(0, 4).forEach(([n, a, b], i) => out.push({ id: `floor-chevron-${i}`, name: `${n} Chevron`, price: i ? 30 : 15, kind: 'chevron', a, b, group: 'Wood' }));
  WOODS.slice(0, 3).forEach(([n, a, b], i) => out.push({ id: `floor-parquet-${i}`, name: `${n} Parquet`, price: 25, kind: 'parquet', a, b, group: 'Wood' }));
  const checks: [string, string, string][] = [['Sky Check', '#ffffff', '#bfe3ff'], ['Lilac Check', '#ffffff', '#e0ccff'], ['Lemon Check', '#ffffff', '#fff0a8'], ['Cherry Check', '#ffffff', '#ff9ab0'], ['Mint & Pink', '#ffd9e8', '#b8ecd9']];
  checks.forEach(([n, a, b], i) => out.push({ id: `floor-check-${i}`, name: n, price: i < 2 ? 0 : 20, kind: 'tiles', a, b, group: 'Tiles' }));
  const diamonds: [string, string, string][] = [['Pink Diamonds', '#ffffff', '#ffc7dc'], ['Black & White Diamonds', '#ffffff', '#4a4a5e'], ['Sky Diamonds', '#ffffff', '#bfe3ff']];
  diamonds.forEach(([n, a, b], i) => out.push({ id: `floor-diamond-${i}`, name: n, price: 25, kind: 'diamond', a, b, group: 'Tiles' }));
  const hexes: [string, string, string][] = [['White Hex', '#ffffff', '#e2dcea'], ['Mint Hex', '#c9f2e3', '#ffffff'], ['Pink Hex', '#ffd9e8', '#ffffff'], ['Honeycomb', '#ffe27a', '#f0b232']];
  hexes.forEach(([n, a, b], i) => out.push({ id: `floor-hex-${i}`, name: n, price: i ? 25 : 0, kind: 'hex', a, b, group: 'Tiles' }));
  const mosaics: [string, string, string, string][] = [['Pool Mosaic', '#9fd6ff', '#ffffff', '#5fb8ee'], ['Candy Mosaic', '#ffb3c7', '#fff3b0', '#c99bff'], ['Garden Mosaic', '#a8e6cf', '#fff3d6', '#5fd3b5']];
  mosaics.forEach(([n, a, b, c], i) => out.push({ id: `floor-mosaic-${i}`, name: n, price: 30, kind: 'mosaic', a, b, c, group: 'Tiles' }));
  out.push({ id: 'floor-stars-0', name: 'Star Tiles', price: 35, kind: 'stars', a: '#3f4f9a', b: '#ffe680', group: 'Tiles' }, { id: 'floor-stars-1', name: 'Pink Star Tiles', price: 35, kind: 'stars', a: '#ffd9e8', b: '#ffffff', group: 'Tiles' });
  const terr: [string, string, string, string][] = [['Sprinkle Terrazzo', '#fff6ea', '#ff9ec7', '#7cc8ff'], ['Mint Terrazzo', '#e2f6ee', '#3fbf8f', '#ffab5e'], ['Gray Terrazzo', '#eceef3', '#9aa3b5', '#4a4a5e']];
  terr.forEach(([n, a, b, c], i) => out.push({ id: `floor-terrazzo-${i}`, name: n, price: 30, kind: 'terrazzo', a, b, c, group: 'Stone' }));
  out.push({ id: 'floor-marble-pink', name: 'Pink Marble', price: 45, kind: 'marble', a: '#fde8ee', b: '#f0b8c8', group: 'Stone' }, { id: 'floor-marble-black', name: 'Black Marble', price: 50, kind: 'marble', a: '#3a3846', b: '#8a88a0', group: 'Stone' }, { id: 'floor-marble-lilac', name: 'Lilac Marble', price: 45, kind: 'marble', a: '#f1eaff', b: '#cdb8f0', group: 'Stone' });
  const carpets: [string, string][] = [['Sky Carpet', '#cfe6ff'], ['Mint Carpet', '#c9f0e0'], ['Cream Carpet', '#f6ecdc'], ['Gray Carpet', '#d9dbe4'], ['Lemon Carpet', '#fff0b0'], ['Coral Carpet', '#ffc3b4']];
  carpets.forEach(([nm, a], i) => out.push({ id: `floor-carpet-${i}`, name: nm, price: i < 2 ? 0 : 15, kind: 'carpet', a, b: dark(a, 0.06), group: 'Carpet' }));
  out.push(
    { id: 'floor-grass-0', name: 'Green Grass', price: 0, kind: 'grass', a: '#8fdc7a', b: '#6fc766', group: 'Outdoor', outdoor: true },
    { id: 'floor-grass-1', name: 'Flower Meadow', price: 20, kind: 'grass', a: '#9be07f', b: '#74c766', c: 'flowers', group: 'Outdoor', outdoor: true },
    { id: 'floor-stone-0', name: 'Stone Path', price: 0, kind: 'stone', a: '#d9d6df', b: '#b8b4c2', group: 'Outdoor', outdoor: true },
    { id: 'floor-stone-1', name: 'Pink Pavers', price: 25, kind: 'stone', a: '#f2d6de', b: '#d8b2be', group: 'Outdoor', outdoor: true },
    { id: 'floor-deck-0', name: 'Wood Deck', price: 0, kind: 'deck', a: '#d9a477', b: '#b07a4f', group: 'Outdoor', outdoor: true },
    { id: 'floor-deck-1', name: 'Gray Deck', price: 20, kind: 'deck', a: '#c9c6cf', b: '#a8a4b2', group: 'Outdoor', outdoor: true },
    { id: 'floor-sand-0', name: 'Beach Sand', price: 20, kind: 'sand', a: '#f4dca0', b: '#e8c480', group: 'Outdoor', outdoor: true },
  );
  return out;
}
export const FLOORS: FloorStyle[] = buildFloors();
export const FLOOR_BY_ID: Record<string, FloorStyle> = Object.fromEntries(FLOORS.map((x) => [x.id, x]));

function floorTile(fl: FloorStyle): { w: number; h: number; body: string } | null {
  const { a, b } = fl;
  switch (fl.kind) {
    case 'herringbone': return { w: 120, h: 120, body: R(0, 0, 120, 120, 0, a) + `<g stroke="${b}" stroke-width="3">${Array.from({ length: 4 }, (_, i) => `<path d="M${i * 30} 0 L${i * 30 + 60} 60 L${i * 30} 120" fill="none"/>`).join('')}</g>` + P('M0 0 L60 60 L0 120', 'none', `stroke="${light(a, 0.2)}" stroke-width="2" opacity="0.6"`) };
    case 'chevron': return { w: 120, h: 80, body: R(0, 0, 120, 80, 0, a) + P('M0 0 L60 40 L120 0 L120 40 L60 80 L0 40Z', b, 'opacity="0.55"') };
    case 'parquet': return { w: 120, h: 120, body: R(0, 0, 120, 120, 0, a) + [0, 20, 40].map((y) => R(0, y, 60, 18, 2, b, 'opacity="0.35"')).join('') + [60, 80, 100].map((x) => R(x, 60, 18, 60, 2, b, 'opacity="0.35"')).join('') + R(0, 60, 60, 60, 0, light(a, 0.08)) + R(60, 0, 60, 60, 0, light(a, 0.08)) };
    case 'hex': {
      const h = (x: number, y: number) => `M${x - 30} ${y} L${x - 15} ${y - 26} L${x + 15} ${y - 26} L${x + 30} ${y} L${x + 15} ${y + 26} L${x - 15} ${y + 26}Z`;
      return { w: 90, h: 52, body: R(0, 0, 90, 52, 0, b) + P(h(0, 0), a, `stroke="${b}" stroke-width="4"`) + P(h(45, 26), a, `stroke="${b}" stroke-width="4"`) + P(h(90, 0), a, `stroke="${b}" stroke-width="4"`) + P(h(0, 52), a, `stroke="${b}" stroke-width="4"`) + P(h(90, 52), a, `stroke="${b}" stroke-width="4"`) };
    }
    case 'mosaic': {
      let s = R(0, 0, 80, 80, 0, '#ffffff');
      const cols = [a, b, fl.c ?? a];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += R(i * 20 + 1.5, j * 20 + 1.5, 17, 17, 3, cols[(i * 7 + j * 3) % 3]);
      return { w: 80, h: 80, body: s };
    }
    case 'terrazzo': {
      let s = R(0, 0, 140, 140, 0, a);
      for (let i = 0; i < 16; i++) s += P(`M${(i * 53) % 140} ${(i * 89) % 140} l${4 + (i % 3) * 3} ${-3 - (i % 2) * 3} l${3 + (i % 4)} ${5 + (i % 3)}Z`, i % 2 ? b : (fl.c ?? b), 'opacity="0.8"');
      return { w: 140, h: 140, body: s };
    }
    case 'diamond': return { w: 100, h: 70, body: R(0, 0, 100, 70, 0, a) + P('M50 0 L100 35 L50 70 L0 35Z', b) };
    case 'stars': return { w: 90, h: 70, body: R(0, 0, 90, 70, 0, a) + R(0, 0, 90, 2, 0, dark(a, 0.15)) + R(0, 0, 2, 70, 0, dark(a, 0.15)) + P(starD(45, 36, 16), b, 'opacity="0.85"') };
    case 'stone': return { w: 160, h: 90, body: R(0, 0, 160, 90, 0, b) + R(4, 4, 70, 38, 14, a) + R(80, 4, 76, 38, 14, a) + R(4, 48, 44, 38, 14, a) + R(54, 48, 102, 38, 14, a) };
    case 'deck': return { w: 240, h: 40, body: R(0, 0, 240, 40, 0, a) + R(0, 36, 240, 4, 0, b) + R(150, 0, 3, 36, 0, b) + C(20, 18, 2, b) + C(170, 18, 2, b) };
    default: return null;
  }
}

export function floorArt(fl: FloorStyle, top: number): string {
  let g = R(-600, top, 2800, 1400, 0, fl.a);
  const t = floorTile(fl);
  if (t) {
    const id = pid('fl');
    g += `<defs>${pattern(id, t.w, t.h, t.body, `x="0" y="${top}"`)}</defs>` + R(-600, top, 2800, 1400, 0, `url(#${id})`);
  } else if (fl.kind === 'wood') {
    for (let row = 0, y = top; y < top + 900; row++, y += 46) {
      g += R(-600, y, 2800, 3, 0, fl.b);
      for (let x = -600 + ((row * 173) % 260); x < 2200; x += 260) g += R(x, y, 3, 46, 0, fl.b) + R(x + 40, y + 14, 70, 3, 1.5, light(fl.a, 0.25), 'opacity="0.5"');
    }
  } else if (fl.kind === 'tiles') {
    for (let row = 0, y = top; y < top + 900; row++, y += 70) for (let col = 0, x = -600; x < 2200; col++, x += 90) if ((row + col) % 2) g += R(x, y, 90, 70, 0, fl.b);
    g += R(-600, top, 2800, 1400, 0, 'url(#g-glass)', 'opacity="0.25"');
  } else if (fl.kind === 'carpet') {
    for (let i = 0; i < 160; i++) g += C(((i * 397) % 2800) - 600, top + 10 + ((i * 131) % 700), 3, fl.b);
  } else if (fl.kind === 'marble') {
    for (let i = 0; i < 9; i++) {
      const x = ((i * 311) % 2400) - 400;
      g += P(`M${x} ${top} q40 80 10 160 t30 200 t-20 200`, 'none', `stroke="${fl.b}" stroke-width="3" opacity="0.8"`);
    }
    for (let y = top; y < top + 900; y += 120) g += R(-600, y, 2800, 2, 0, fl.b, 'opacity="0.6"');
  } else if (fl.kind === 'grass') {
    for (let i = 0; i < 140; i++) {
      const x = ((i * 397) % 2800) - 600;
      const y = top + 16 + ((i * 131) % 600);
      g += P(`M${x} ${y} l-5 -14 M${x} ${y} l5 -16 M${x} ${y} l0 -12`, 'none', `stroke="${fl.b}" stroke-width="3.5" stroke-linecap="round" opacity="0.8"`);
      if (fl.c === 'flowers' && i % 3 === 0) g += flowerG(x + 20, y - 4, 9, ['#ff9ec7', '#fff', '#ffd36b', '#c99bff'][i % 4]);
    }
  } else if (fl.kind === 'sand') {
    for (let i = 0; i < 200; i++) g += C(((i * 397) % 2800) - 600, top + 10 + ((i * 131) % 700), 2 + (i % 3), fl.b, 'opacity="0.7"');
    g += [[200, 760], [1300, 820]].map(([x, y]) => P(`M${x} ${y} q20 -26 40 0 q-20 10 -40 0Z`, '#ffb3c7')).join('');
  }
  return g + R(-600, top, 2800, 1400, 0, 'url(#g-floorDepth)');
}

// ---------------- trim and curtains ----------------
export const TRIMS: [string, string][] = [['White', '#ffffff'], ['Cream', '#fff3e0'], ['Pink', '#ff9ec7'], ['Lilac', '#c99bff'], ['Mint', '#7fd8c0'], ['Sky', '#8fc8ff'], ['Lemon', '#ffd36b'], ['Honey Wood', '#d9a477'], ['Cocoa Wood', '#9e6a4c'], ['Navy', '#3f4f9a'], ['Charcoal', '#4a4a5e']];
export const CURTAINS: [string, string][] = [['Pink', '#ff9ec7'], ['Rose', '#e0457b'], ['Lilac', '#c99bff'], ['Mint', '#7fd8c0'], ['Sky', '#8fc8ff'], ['Lemon', '#ffd36b'], ['Peach', '#ffab5e'], ['Cream', '#f6ecdc'], ['White', '#ffffff'], ['Navy', '#3f4f9a'], ['Sage', '#a8c99a'], ['Berry', '#b05a8a']];

/** Little square previews for the style tray. */
export function wallSwatch(w: WallStyle): string {
  return `<svg viewBox="0 330 400 270" preserveAspectRatio="xMidYMid slice">${wallArt(w, 0, 300, 400, 600)}</svg>`;
}
export function floorSwatch(fl: FloorStyle): string {
  return `<svg viewBox="0 600 300 200" preserveAspectRatio="xMidYMid slice">${floorArt(fl, 600)}</svg>`;
}
