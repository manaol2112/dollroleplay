// Backgrounds for the decoratable town places (library, cinema, hotel, grocery, restaurant, mall,
// hospital, car shop, theme park). Walls and floors come from the player's room style; each place adds
// its own sign, windows and a few fixed touches so it still feels like that place.
import type { SceneState, Season } from '../types';
import { dark } from './color';
import { FLOOR_BY_ID, WALL_BY_ID, floorArt, wallArt } from './roomstyle';
import { landscape, picketFence, windowArt } from './scenes';
import { sparkleD, starD } from './wear';

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const T = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;

export interface TownPlaceLook {
  sign: string;
  signColor: string;
  wall: string;
  floor: string;
  windows: [number, number, number, number][];
  curtain: string;
  /** Fixed decorations drawn on the wall, behind furniture. */
  extra?: (s: Season) => string;
}

const ceilingLights = (n: number, c = '#fff6c8') => Array.from({ length: n }, (_, i) => {
  const x = 100 + (i * 1400) / Math.max(1, n - 1);
  return R(x - 2, -60, 4, 70, 2, '#c9cfdd') + P(`M${x - 34} 10 L${x + 34} 10 L${x + 20} -12 L${x - 20} -12Z`, '#ffffff') + `<ellipse cx="${x}" cy="20" rx="60" ry="30" fill="url(#g-glow)" opacity="0.8"/>` + C(x, 12, 8, c);
}).join('');

export const TOWN_PLACE_LOOK: Record<string, TownPlaceLook> = {
  library: {
    sign: 'Library', signColor: '#7a4fe0', wall: 'wall-panels-honey', floor: 'floor-herring-0', curtain: '#c99bff', windows: [[1180, 110, 230, 260]],
    extra: () => [200, 520, 840].map((x) => P(`M${x} 380 L${x} 160 A90 90 0 0 1 ${x + 180} 160 L${x + 180} 380Z`, '#ffffff', 'opacity="0.35"')).join('') +
      T(800, 470, 'Shhh... happy reading!', 26, '#a86b4a', 'opacity="0.6"'),
  },
  cinema: {
    sign: 'Cinema', signColor: '#e0245e', wall: 'wall-paint-12', floor: 'floor-carpet-3', curtain: '#c2244a', windows: [],
    extra: () => {
      let s = '';
      for (let i = 0; i < 36; i++) s += `<path d="${sparkleD(((i * 263) % 1800) - 100, 20 + ((i * 97) % 300), 3 + (i % 3) * 2)}" fill="#fff8c8" opacity="${0.4 + (i % 4) * 0.15}"><animate attributeName="opacity" values="0.2;1;0.2" dur="${2 + (i % 5) * 0.6}s" repeatCount="indefinite"/></path>`;
      return s + [-200, 1800].map((x) => R(x - 30, 100, 60, 480, 10, '#ffd24a', 'opacity="0.25"')).join('');
    },
  },
  hotel: {
    sign: 'Grand Hotel', signColor: '#c98a1e', wall: 'wall-damask-0', floor: 'floor-marble-pink', curtain: '#e0457b', windows: [[220, 120, 220, 250], [1160, 120, 220, 250]],
    extra: () => ceilingLights(3),
  },
  hotelroom: {
    sign: 'Room 7', signColor: '#c98a1e', wall: 'wall-damask-0', floor: 'floor-carpet-3', curtain: '#e0457b', windows: [[560, 110, 480, 260]],
    extra: () => R(1250, 160, 150, 110, 12, '#fff8e6') + R(1262, 172, 126, 86, 8, '#ffd9e8') + T(1325, 226, '♥', 40, '#ff7eb6'),
  },
  grocery: {
    sign: 'Grocery Shop', signColor: '#3fbf8f', wall: 'wall-tiles-2', floor: 'floor-check-0', curtain: '#7fd8c0', windows: [[1220, 120, 220, 220]],
    extra: () => {
      const signs = [['Fruit', '#ff7a6b'], ['Bakery', '#ffab5e'], ['Dairy', '#7cc8ff'], ['Snacks', '#c99bff']] as const;
      return ceilingLights(4) + signs.map(([t, c], i) => R(120 + i * 260, 150, 190, 54, 27, c) + T(215 + i * 260, 188, t, 28, '#fff')).join('');
    },
  },
  restaurant: {
    sign: 'Yummy Restaurant', signColor: '#e85d5d', wall: 'wall-wainscot-5', floor: 'floor-check-3', curtain: '#ff7a6b', windows: [[180, 120, 260, 230], [1160, 120, 260, 230]],
    extra: () => {
      let s = P('M-200 60 Q800 140 1800 60', 'none', 'stroke="#6b5a6b" stroke-width="2"');
      for (let i = 0; i < 24; i++) {
        const x = -150 + i * 85;
        const y = 60 + Math.sin((i / 23) * Math.PI) * 70;
        s += C(x, y + 8, 7, ['#ffd36b', '#ff9ec7', '#7cc8ff', '#7fe0b0'][i % 4]) + `<circle cx="${f(x)}" cy="${f(y + 8)}" r="18" fill="#fff6c8" opacity="0.3"/>`;
      }
      return s;
    },
  },
  mall: {
    sign: 'Sunshine Mall', signColor: '#ff6f9f', wall: 'wall-paint-9', floor: 'marble', curtain: '#ff9ec7', windows: [[560, 60, 480, 180]],
    extra: () => R(-600, 300, 2800, 20, 6, '#ffffff', 'opacity="0.9"') + R(-600, 318, 2800, 8, 0, '#c9cfdd') +
      Array.from({ length: 12 }, (_, i) => R(-500 + i * 200, 300, 6, 22, 2, '#c9cfdd')).join('') + ceilingLights(5),
  },
  hospital: {
    sign: 'Happy Hospital', signColor: '#e8384f', wall: 'wall-paint-5', floor: 'floor-hex-1', curtain: '#8fc8ff', windows: [[1180, 120, 220, 230]],
    extra: () => R(-600, 420, 2800, 30, 0, '#9fd6ff', 'opacity="0.7"') + R(-600, 452, 2800, 8, 0, '#ff9ec7', 'opacity="0.7"') +
      [220, 700].map((x) => R(x, 160, 120, 120, 20, '#ffffff') + R(x + 45, 175, 30, 90, 8, '#ff4f6d') + R(x + 15, 205, 90, 30, 8, '#ff4f6d')).join(''),
  },
  carshop: {
    sign: 'Zoom Car Shop', signColor: '#4f9dff', wall: 'wall-paint-13', floor: 'floor-terrazzo-2', curtain: '#8fc8ff', windows: [[180, 80, 420, 300], [1000, 80, 420, 300]],
    extra: () => {
      let s = '';
      for (let i = 0; i < 18; i++) s += P(`M${-600 + i * 160} 560 L${-520 + i * 160} 560 L${-480 + i * 160} 590 L${-560 + i * 160} 590Z`, i % 2 ? '#2d2a3a' : '#ffd24a', 'opacity="0.85"');
      return s + T(800, 470, 'Wash · Paint · Drive!', 30, '#4f9dff', 'opacity="0.55"');
    },
  },
};

function sign(text: string, c: string): string {
  const w = Math.max(360, text.length * 30 + 120);
  const x = 800 - w / 2;
  return R(x - 10, -40, w + 20, 96, 30, dark(c, 0.15)) + R(x, -48, w, 92, 28, '#ffffff') + R(x + 8, -40, w - 16, 76, 22, c) +
    T(800, 12, text, 46, '#ffffff', `stroke="${dark(c, 0.3)}" stroke-width="2" paint-order="stroke"`) +
    P(starD(x + 34, -2, 12), '#fff3b0') + P(starD(x + w - 34, -2, 12), '#fff3b0');
}

/** Indoor town place: player wall and floor plus the place's sign and touches. */
export function townInteriorArt(placeId: string, s: Season, sc: SceneState): string {
  const L = TOWN_PLACE_LOOK[placeId];
  const wall = WALL_BY_ID[sc.wall ?? L.wall] ?? WALL_BY_ID.cream;
  const floor = FLOOR_BY_ID[sc.floor ?? L.floor] ?? FLOOR_BY_ID.woodLight;
  const trim = sc.trim ?? '#ffffff';
  let g = wallArt(wall, -600, -500, 2200, 600);
  g += R(-600, -60, 2800, 26, 0, trim, 'opacity="0.9"');
  if (L.extra) g += L.extra(s);
  for (const [x, y, w, h] of L.windows) g += windowArt(x, y, w, h, s, sc.curtain ?? L.curtain);
  g += sign(L.sign, L.signColor);
  g += floorArt(floor, 600);
  g += R(-600, 578, 2800, 26, 4, trim) + R(-600, 578, 2800, 26, 4, 'url(#g-shadeY)', 'opacity="0.5"') + R(-600, 602, 2800, 6, 0, '#3a1d3f', 'opacity="0.12"');
  return g;
}

/** The theme park: open sky across the whole wide park, a fairytale castle and rides far away on the
 * hills, bunting overhead and a ground the player can restyle. W is the park's width. */
export function themeParkArt(s: Season, sc: SceneState, W = 1600): string {
  const floor = FLOOR_BY_ID[sc.floor ?? 'floor-stone-1'] ?? FLOOR_BY_ID['floor-stone-1'];
  const x0 = -600;
  const x1 = W + 600;
  const trees: number[] = [];
  for (let x = -240; x < x1; x += 520 + ((x * 7) % 260)) trees.push(x);
  let g = landscape(s, 520, { trees, span: [x0, x1], sunX: 1340 });
  // far-away castle on the hill in the middle of the park
  const cx = W / 2;
  const castle = (x: number, y: number, w: number, h: number, roof: string) =>
    R(x - w / 2, y - h, w, h, 4, '#f6e8ff') + P(`M${x - w / 2 - 8} ${y - h} L${x} ${y - h - w * 1.1} L${x + w / 2 + 8} ${y - h}Z`, roof) +
    P(`M${x} ${y - h - w * 1.1} l0 -26 l22 8 l-22 8`, '#ff7eb6') + R(x - 6, y - h * 0.62, 12, 18, 6, '#c9a6ff');
  g += `<g opacity="0.75">` + castle(cx - 120, 470, 60, 170, '#c99bff') + castle(cx + 120, 470, 60, 170, '#c99bff') + castle(cx - 60, 470, 70, 230, '#ff9ec7') + castle(cx + 60, 470, 70, 230, '#ff9ec7') +
    castle(cx, 470, 100, 300, '#b28aff') + R(cx - 160, 400, 320, 72, 6, '#f6e8ff') + R(cx - 30, 420, 60, 52, 30, '#c9a6ff') + `</g>`;
  // far-away coaster track and flags, repeated along the park
  for (let off = 0; off < W; off += 2200) {
    g += P(`M${off - 200} 470 C${off + 100} 300 ${off + 260} 300 ${off + 420} 440 C${off + 560} 560 ${off + 700} 260 ${off + 880} 300 C${off + 1040} 340 ${off + 1100} 470 ${off + 1300} 420`, 'none', 'stroke="#ff9ec7" stroke-width="10" opacity="0.4"');
    for (let x = off - 150; x < off + 1300; x += 90) g += R(x, 380 + Math.sin(x / 120) * 40, 5, 160, 2, '#ff9ec7', 'opacity="0.3"');
  }
  // hot air balloons drifting over the park
  const balloon = (x: number, y: number, c: string, dur: number, i: number) =>
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;60 -24;0 0" dur="${dur}s" begin="${-i * 3}s" repeatCount="indefinite"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="38" ry="46" fill="${c}"/><path d="M${x - 38} ${y} Q${x} ${y + 12} ${x + 38} ${y}" fill="none" stroke="#fff" stroke-width="5" opacity="0.6"/>` +
    `<ellipse cx="${x - 12}" cy="${y - 18}" rx="9" ry="14" fill="#fff" opacity="0.4"/><path d="M${x - 20} ${y + 40} L${x - 10} ${y + 68} M${x + 20} ${y + 40} L${x + 10} ${y + 68}" stroke="#8a7a8a" stroke-width="2"/>` +
    R(x - 13, y + 66, 26, 18, 5, '#c98a5a') + `</g>`;
  [[700, 250, '#ff7eb6'], [1900, 180, '#ffd36b'], [3000, 270, '#7cc8ff'], [3900, 200, '#c99bff']].forEach(([x, y, c], i) => {
    if ((x as number) < x1) g += balloon(x as number, y as number, c as string, 14 + i * 3, i);
  });
  // bunting overhead, swagging between poles
  const flagCols = ['#ff7eb6', '#ffd36b', '#7cc8ff', '#7fe0b0', '#c99bff'];
  for (let px = -400, n = 0; px < x1; px += 600, n++) {
    const sag = 60;
    g += P(`M${px} 110 Q${px + 300} ${110 + sag * 2} ${px + 600} 110`, 'none', 'stroke="#6b5a6b" stroke-width="2"');
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      const x = px + 600 * t;
      const y = 110 + 2 * sag * 2 * t * (1 - t);
      g += P(`M${f(x - 18)} ${f(y)} L${f(x + 18)} ${f(y)} L${f(x)} ${f(y + 36)}Z`, flagCols[(i + n) % 5]);
    }
  }
  g += picketFence(600, x0, x1, sc.trim ?? '#ffffff');
  g += floorArt(floor, 596, x0, x1);
  if (s === 'winter') for (let i = 0; i < 30 * (W / 1600); i++) g += `<ellipse cx="${((i * 397) % (x1 - x0)) + x0}" cy="${620 + ((i * 131) % 360)}" rx="40" ry="9" fill="#ffffff" opacity="0.85"/>`;
  return g;
}
