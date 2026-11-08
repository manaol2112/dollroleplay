// The town map: a wide street you swipe through, drawn as separate layers (far mountains, middle
// hills, the main street, front bushes) that slide at different speeds for depth.
import type { Look, Season } from '../types';
import { dark, light } from './color';
import { renderDoll } from './doll';
import { SEASON_LOOK, birds, cloud, seasonTree, uid } from './scenes';
import { bowG, flowerG, heartD, sparkleD, starD } from './wear';
import { LEISURE_FACADES } from './furn/leisure';
import { SHOPS_FACADES } from './furn/shops';
import { CARE_FACADES } from './furn/care';
import { RIDES_FACADES } from './furn/rides';

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const L = (x1: number, y1: number, x2: number, y2: number, c: string, w = 3, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const T = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;
const shade = (x: number, y: number, w: number, h: number, r = 0) => R(x, y, w, h, r, 'url(#g-shadeX)');

export const TOWN_W = 10500;
/** The world is 960 units tall; the street's sidewalk is at y = 650. */
export const TOWN_TOP = -30;
export const TOWN_H = 960;
const BASE = 650;
const ROAD_Y = 690;
const ROAD_H = 100;

export interface TownSpot { id: string; x: number; label: string; color: string; top: number; }
export const TOWN_SPOTS: TownSpot[] = [
  { id: 'home', x: 430, label: 'Home', color: '#ff6f9f', top: 450 },
  { id: 'playground', x: 1560, label: 'Playground', color: '#3fbf8f', top: 330 },
  { id: 'school', x: 2300, label: 'School', color: '#e85d5d', top: 560 },
  { id: 'salon', x: 3420, label: 'Salon', color: '#2fae8a', top: 420 },
  { id: 'boutique', x: 3880, label: 'Boutique', color: '#e0457b', top: 430 },
  { id: 'theater', x: 4430, label: 'Theater', color: '#7a4fe0', top: 540 },
  // The second half of town: places you can also decorate.
  { id: 'cinema', x: 5060, label: 'Cinema', color: '#e0245e', top: 520 },
  { id: 'restaurant', x: 5640, label: 'Restaurant', color: '#e85d5d', top: 480 },
  { id: 'mall', x: 6290, label: 'Mall', color: '#ff6f9f', top: 520 },
  { id: 'grocery', x: 6960, label: 'Grocery', color: '#3fbf8f', top: 470 },
  { id: 'hospital', x: 7560, label: 'Hospital', color: '#e8384f', top: 540 },
  { id: 'hotel', x: 8180, label: 'Hotel', color: '#c98a1e', top: 590 },
  { id: 'library', x: 8780, label: 'Library', color: '#7a4fe0', top: 500 },
  { id: 'carshop', x: 9380, label: 'Car Shop', color: '#4f9dff', top: 470 },
  { id: 'themepark', x: 10040, label: 'Theme Park', color: '#ff7eb6', top: 560 },
];
/** Building fronts drawn by the place catalogs (with their height for the name tag). */
const EXTRA_FACADES: Record<string, { h: number; art: (s: Season) => string }> = { ...LEISURE_FACADES, ...SHOPS_FACADES, ...CARE_FACADES, ...RIDES_FACADES };
// Name tags sit just above each front, but never so high that they leave the top of the screen.
for (const sp of TOWN_SPOTS) if (EXTRA_FACADES[sp.id]) sp.top = Math.min(EXTRA_FACADES[sp.id].h + 30, 555);
const placeholder = (s: Season) => {
  void s;
  return `<rect x="-180" y="-380" width="360" height="380" rx="14" fill="#ffe6f1"/><rect x="-60" y="-140" width="120" height="140" rx="20" fill="#ff9ec7"/>`;
};
const SQUARE_X = 2950;

// ---------------- little pieces ----------------
function windowBox(x: number, y: number, w: number, h: number, curtain: string, lit = false, box?: string): string {
  let s = R(x - 6, y - 6, w + 12, h + 12, 8, '#ffffff') + R(x, y, w, h, 5, lit ? '#fff1b8' : '#bfe3ff') + R(x, y, w, h, 5, 'url(#g-glass)');
  s += P(`M${x} ${y} L${x + w * 0.3} ${y} Q${x + w * 0.22} ${y + h * 0.5} ${x} ${y + h * 0.72}Z`, curtain) + P(`M${x + w} ${y} L${x + w * 0.7} ${y} Q${x + w * 0.78} ${y + h * 0.5} ${x + w} ${y + h * 0.72}Z`, curtain);
  s += R(x + w / 2 - 2, y, 4, h, 1, '#ffffff', 'opacity="0.9"');
  if (box) s += R(x - 10, y + h + 4, w + 20, 14, 5, '#a86b4a') + box;
  return s;
}
function flowerBox(x: number, y: number, w: number, s: Season): string {
  if (s === 'winter') return R(x - 10, y - 4, w + 20, 8, 4, '#fff');
  const cols = s === 'fall' ? ['#ff8a3d', '#ffc23d', '#e8573d'] : ['#ff7eb6', '#ffd36b', '#ffffff', '#c99bff'];
  let g = '';
  for (let i = 0; i < 4; i++) g += flowerG(x + (w * (i + 0.5)) / 4, y - 4, 7, cols[i % cols.length]);
  return g;
}
const roofSnow = (d: string, s: Season) => (s === 'winter' ? P(d, '#ffffff') + P(d, 'url(#g-shadeY)', 'opacity="0.4"') : '');
const smoke = (x: number, y: number) => `<g opacity="0.75">${[0, 1, 2].map((i) => `<circle cx="${x}" cy="${y}" r="${10 + i * 4}" fill="#fff"><animate attributeName="cy" values="${y};${y - 120}" dur="4s" begin="${-i * 1.3}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="4s" begin="${-i * 1.3}s" repeatCount="indefinite"/><animate attributeName="cx" values="${x};${x + 30}" dur="4s" begin="${-i * 1.3}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
const bush = (x: number, y: number, s: number, c: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${C(-26, -20, 26, dark(c, 0.06))}${C(22, -18, 24, dark(c, 0.06))}${C(0, -32, 30, c)}${C(-8, -42, 10, '#fff', 'opacity="0.18"')}</g>`;
function lamp(x: number, y: number, glow = true): string {
  return R(x - 4, y - 170, 8, 170, 4, '#4a4a5e') + E(x, y, 16, 5, '#4a4a5e') + (glow ? E(x, y - 178, 46, 46, 'url(#g-glow)') : '') + P(`M${x - 16} ${y - 168} L${x + 16} ${y - 168} L${x + 11} ${y - 196} L${x - 11} ${y - 196}Z`, '#fff6c8') + P(`M${x - 20} ${y - 196} L${x + 20} ${y - 196} L${x} ${y - 210}Z`, '#4a4a5e');
}

// ---------------- buildings (base centre at 0,0) ----------------
function home(s: Season): string {
  const wall = '#ffd9e8';
  const roof = '#ff6f9f';
  let g = E(0, 4, 230, 18, 'url(#g-ground)');
  g += R(100, -420, 46, 110, 6, '#d96a8a') + R(94, -428, 58, 16, 5, '#c25578') + (s === 'summer' ? '' : smoke(123, -440));
  g += R(-180, -290, 360, 290, 10, wall) + shade(-180, -290, 360, 290, 10);
  g += R(-180, -34, 360, 34, 0, dark(wall, 0.06));
  const rd = 'M-215 -280 L0 -455 L215 -280Z';
  g += P(rd, roof);
  for (let r = 0; r < 5; r++) {
    const y = -300 - r * 32;
    const half = 190 - r * 38;
    let d = `M${-half} ${y}`;
    for (let i = 0; i < Math.max(2, Math.round(half / 22)); i++) d += ` q11 12 22 0`;
    g += P(d, 'none', `stroke="${light(roof, 0.25)}" stroke-width="3" opacity="0.7"`);
  }
  g += P('M-215 -280 L0 -455 L0 -280Z', '#fff', 'opacity="0.12"');
  g += roofSnow('M-218 -278 L0 -458 L218 -278 L196 -276 Q150 -290 110 -276 Q60 -292 0 -280 Q-60 -292 -110 -276 Q-150 -290 -196 -276Z', s);
  g += C(0, -340, 32, '#fff') + C(0, -340, 25, '#bfe3ff') + C(0, -340, 25, 'url(#g-glass)') + P(heartD(0, -352, 12), '#ff7eb6');
  const fb = (x: number) => flowerBox(x, -146, 64, s);
  g += windowBox(-140, -250, 64, 70, '#ff9ec7', false) + windowBox(76, -250, 64, 70, '#ff9ec7', false);
  g += windowBox(-140, -146, 64, 64, '#ffb3c7', true, fb(-140)) + windowBox(76, -146, 64, 64, '#ffb3c7', true, fb(76));
  g += P('M-62 -168 L62 -168 L72 -150 L-72 -150Z', roof) + R(-50, -150, 100, 6, 2, dark(roof, 0.2));
  g += P('M-40 0 L-40 -110 A40 40 0 0 1 40 -110 L40 0Z', '#b05a7a') + P('M-33 0 L-33 -108 A33 33 0 0 1 33 -108 L33 0Z', '#d07a9a') + P(heartD(0, -120, 12), '#ffd9e8') + C(22, -50, 5, '#ffd24a');
  g += R(-58, -4, 116, 10, 4, '#f2e6d8') + R(-48, 4, 96, 8, 4, '#e6d4c2');
  g += E(-64, -96, 9, 12, '#fff6c8') + E(-64, -96, 34, 34, 'url(#g-glow)') + R(-66, -110, 4, 10, 2, '#4a4a5e');
  if (s === 'winter') g += C(0, -60, 20, 'none', 'stroke="#2f7a5a" stroke-width="9"') + `<g transform="translate(0 -42) scale(0.45)">${bowG(0, 0, 1, '#e8384f')}</g>`;
  if (s === 'fall') g += E(-90, -8, 22, 18, '#ff8a3d') + R(-93, -32, 6, 10, 2, '#5fae6b') + E(-118, -6, 16, 13, '#ffab3d');
  // mailbox and garden
  g += R(214, -80, 8, 80, 3, '#8a5a3c') + R(196, -112, 44, 34, 12, '#ff7eb6') + P(heartD(218, -104, 8), '#fff');
  g += bush(-215, 0, 0.9, s === 'winter' ? '#e8f0fa' : s === 'fall' ? '#d98a3d' : '#5fc47c');
  return g;
}

function neighbor(s: Season): string {
  const wall = '#c9f2e3';
  const roof = '#5ab0ef';
  let g = E(0, 4, 170, 14, 'url(#g-ground)');
  g += R(-140, -230, 280, 230, 10, wall) + shade(-140, -230, 280, 230, 10);
  g += P('M-168 -222 L0 -360 L168 -222Z', roof) + P('M-168 -222 L0 -360 L0 -222Z', '#fff', 'opacity="0.12"');
  g += roofSnow('M-170 -220 L0 -362 L170 -220 Q90 -236 0 -224 Q-90 -236 -170 -220Z', s);
  g += windowBox(-100, -190, 56, 56, '#ffffff', false, flowerBox(-100, -130, 56, s)) + windowBox(44, -190, 56, 56, '#ffffff', true, flowerBox(44, -130, 56, s));
  g += R(-30, -110, 60, 110, 26, '#3f88c9') + C(16, -54, 4, '#ffd24a');
  // a cat napping on the roof
  g += `<g transform="translate(70 -300) rotate(-38)">${E(0, 0, 22, 12, '#2d2a3a')}${C(20, -8, 11, '#2d2a3a')}${P('M14 -16 L17 -26 L22 -17Z M24 -16 L28 -25 L30 -14Z', '#2d2a3a')}${P('M-22 0 Q-36 -14 -28 -24', 'none', 'stroke="#2d2a3a" stroke-width="5" stroke-linecap="round"')}<path d="M17 -9 q2 2 4 0 M23 -9 q2 2 4 0" stroke="#ffe680" stroke-width="1.5" fill="none"/></g>`;
  return g;
}

function playground(s: Season): string {
  const sand = s === 'winter' ? '#eef3fb' : '#f2dfb4';
  let g = E(0, -10, 300, 70, sand) + E(0, -10, 300, 70, 'url(#g-shadeY)', 'opacity="0.4"');
  // pond with ducks, frozen in winter
  const pond = s === 'winter' ? '#d9efff' : '#8fd3ff';
  g += E(-190, -40, 110, 34, dark(pond, 0.08)) + E(-190, -44, 100, 28, pond) + E(-220, -52, 40, 8, '#fff', 'opacity="0.45"');
  if (s !== 'winter') {
    for (const [dx, d] of [[-220, 3], [-160, 4]] as const) g += `<g><animateTransform attributeName="transform" type="translate" values="0 0;24 -2;0 0" dur="${d}s" repeatCount="indefinite"/><g transform="translate(${dx} -48)">${E(0, 0, 14, 9, '#ffd84a')}${C(9, -10, 7, '#ffd84a')}${P('M15 -10 L23 -8 L15 -6Z', '#ff8a3d')}${C(10, -12, 1.5, '#2d2a3a')}</g></g>`;
  } else g += `<g transform="translate(-160 -40) scale(0.32)">${C(0, -60, 62, '#fff')}${C(0, -160, 46, '#fff')}${C(-12, -168, 5, '#2d2a3a')}${C(12, -168, 5, '#2d2a3a')}${P('M0 -158 L30 -152 L0 -148Z', '#ff8a3d')}${R(-44, -130, 88, 16, 8, '#e8384f')}</g>`;
  // slide
  g += L(-40, -20, -40, -210, '#9aa3b5', 9) + L(20, -20, 20, -210, '#9aa3b5', 9);
  for (let y = -50; y > -200; y -= 32) g += L(-40, y, 20, y, '#c9cfdd', 6);
  g += R(-50, -222, 80, 14, 6, '#ffd36b') + P('M20 -222 C110 -212 120 -70 220 -34 L224 -18 C110 -54 98 -190 20 -194Z', '#5fd3b5') + P('M20 -222 C110 -212 120 -70 220 -34', 'none', 'stroke="#a8f0dc" stroke-width="5" stroke-linecap="round"');
  // swings
  g += L(150, -20, 180, -250, '#ff7eb6', 9) + L(230, -20, 200, -250, '#ff7eb6', 9) + L(260, -20, 290, -250, '#ff7eb6', 9) + L(340, -20, 310, -250, '#ff7eb6', 9) + R(170, -262, 150, 16, 8, '#ff9ec7');
  for (const [x, ph] of [[218, 0], [270, 1]] as const) g += `<g><animateTransform attributeName="transform" type="rotate" values="-14 ${x} -250;14 ${x} -250;-14 ${x} -250" dur="2.4s" begin="${-ph}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${L(x - 14, -250, x - 14, -80, '#9aa3b5', 2)}${L(x + 14, -250, x + 14, -80, '#9aa3b5', 2)}${R(x - 20, -84, 40, 9, 4, '#ffd36b')}</g>`;
  // sign arch
  g += L(-280, 0, -280, -150, '#a86b4a', 10) + L(-120, 0, -120, -150, '#a86b4a', 10) + R(-300, -190, 200, 50, 25, '#ffffff', 'stroke="#3fbf8f" stroke-width="5"') + T(-200, -156, 'PARK', 30, '#3fbf8f');
  g += flowerG(-280, -190, 12, '#ff7eb6') + flowerG(-120, -190, 12, '#ffd36b');
  g += seasonTree(330, 0, 0.9, s, 1);
  return g;
}

function bus(): string {
  return `<g>${R(-130, -96, 260, 86, 18, '#ffd23a')}${R(-130, -96, 260, 86, 18, 'url(#g-shadeY)')}${R(-130, -40, 260, 10, 0, '#2d2a3a', 'opacity="0.8"')}` +
    [-100, -56, -12, 32].map((x) => R(x, -84, 36, 30, 6, '#bfe3ff') + R(x, -84, 36, 30, 6, 'url(#g-glass)')).join('') + R(80, -84, 40, 74, 6, '#bfe3ff') +
    T(-20, -16, 'SCHOOL BUS', 15, '#2d2a3a') + C(-82, -8, 18, '#2d2a3a') + C(-82, -8, 8, '#c9cfdd') + C(86, -8, 18, '#2d2a3a') + C(86, -8, 8, '#c9cfdd') + C(128, -40, 6, '#fff6c8') + R(-142, -30, 12, 18, 4, '#e8384f') + '</g>';
}

function school(s: Season): string {
  const wall = '#ffe8b8';
  const brick = '#e8907a';
  let g = E(0, 4, 330, 20, 'url(#g-ground)');
  g += R(-300, -310, 600, 310, 8, wall) + shade(-300, -310, 600, 310, 8) + R(-300, -60, 600, 60, 0, brick);
  for (let y = -56; y < 0; y += 14) for (let x = -300 + ((y / 14) % 2 ? 0 : 20); x < 300; x += 40) g += R(x + 2, y + 2, 36, 10, 2, dark(brick, 0.08), 'opacity="0.5"');
  g += P('M-322 -300 L-300 -340 L300 -340 L322 -300Z', '#e85d5d') + roofSnow('M-324 -298 L-300 -342 L300 -342 L324 -298 Q160 -312 0 -302 Q-160 -312 -324 -298Z', s);
  for (const row of [-270, -170]) for (let i = 0; i < 6; i++) if (Math.abs(i - 2.5) > 1 || row === -270) g += windowBox(-270 + i * 92, row, 56, 64, i % 2 ? '#ffb3c7' : '#a8d8ff', row === -170 && i % 3 === 0);
  // tower
  g += R(-80, -470, 160, 170, 6, wall) + shade(-80, -470, 160, 170, 6) + P('M-100 -462 L0 -560 L100 -462Z', '#e85d5d') + roofSnow('M-102 -460 L0 -562 L102 -460 Q50 -470 0 -464 Q-50 -470 -102 -460Z', s);
  g += C(0, -390, 44, '#fff', 'stroke="#c98a5a" stroke-width="8"');
  for (let i = 0; i < 12; i++) g += C(Math.cos((i * Math.PI) / 6) * 32, -390 + Math.sin((i * Math.PI) / 6) * 32, 3, '#c9a2c0');
  g += `<g><animateTransform attributeName="transform" type="rotate" values="0 0 -390;360 0 -390" dur="60s" repeatCount="indefinite"/>${L(0, -390, 0, -420, '#4a3f5e', 4)}</g>` + L(0, -390, 20, -380, '#4a3f5e', 5) + C(0, -390, 5, '#4a3f5e');
  g += L(0, -560, 0, -640, '#9aa3b5', 5) + `<path d="M0 -640 Q30 -650 56 -636 Q30 -626 0 -616Z" fill="#ff7eb6"><animate attributeName="d" values="M0 -640 Q30 -650 56 -636 Q30 -626 0 -616Z;M0 -640 Q30 -630 56 -640 Q30 -620 0 -616Z;M0 -640 Q30 -650 56 -636 Q30 -626 0 -616Z" dur="1.6s" repeatCount="indefinite"/></path>`;
  // doors and sign
  g += R(-70, -150, 140, 150, 10, '#c98a5a') + R(-62, -140, 60, 140, 6, '#d9a477') + R(2, -140, 60, 140, 6, '#d9a477') + C(-8, -70, 4, '#ffd24a') + C(8, -70, 4, '#ffd24a');
  g += R(-110, -196, 220, 40, 14, '#e85d5d') + T(0, -166, 'SCHOOL', 28, '#ffffff');
  g += R(-90, -4, 180, 10, 4, '#f2e6d8') + R(-80, 4, 160, 8, 4, '#e6d4c2');
  g += bush(-320, 0, 0.8, s === 'winter' ? '#e8f0fa' : '#5fc47c') + bush(320, 0, 0.8, s === 'winter' ? '#e8f0fa' : '#5fc47c');
  // bus stop
  g += L(380, 0, 380, -150, '#4a4a5e', 5) + R(360, -186, 40, 40, 20, '#ffd23a', 'stroke="#fff" stroke-width="3"') + T(380, -158, 'B', 22, '#2d2a3a');
  return g;
}

function square(s: Season, gift: boolean): string {
  let g = E(0, -6, 230, 46, s === 'winter' ? '#eef3fb' : '#f2e6d8');
  for (let i = -3; i <= 3; i++) g += E(i * 60, -6, 26, 8, s === 'winter' ? '#e2eaf6' : '#e6d4c2');
  // fountain
  g += E(0, -20, 120, 30, '#c9cfdd') + E(0, -28, 108, 24, s === 'winter' ? '#e6f4ff' : '#8fd3ff') + R(-14, -140, 28, 112, 8, '#e6e8f0') + E(0, -140, 46, 14, '#c9cfdd') + E(0, -146, 40, 10, '#8fd3ff');
  if (s !== 'winter') {
    for (const [dx, d] of [[-1, 0], [1, 0.6]] as const) g += `<path d="M0 -150 Q${dx * 50} -230 ${dx * 96} -36" fill="none" stroke="#bfe8ff" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 12" opacity="0.9"><animate attributeName="stroke-dashoffset" values="0;-52" dur="0.9s" begin="${-d}s" repeatCount="indefinite"/></path>`;
    g += `<path d="M0 -150 L0 -220" stroke="#d9f2ff" stroke-width="8" stroke-linecap="round" stroke-dasharray="12 10"><animate attributeName="stroke-dashoffset" values="0;44" dur="0.7s" repeatCount="indefinite"/></path>`;
  }
  // benches and lamps
  for (const x of [-215, 215]) g += R(x - 50, -70, 100, 14, 5, '#e85d5d') + R(x - 50, -50, 100, 14, 5, '#e85d5d') + L(x - 40, -40, x - 40, -6, '#4a4a5e', 5) + L(x + 40, -40, x + 40, -6, '#4a4a5e', 5);
  g += lamp(-300, 0) + lamp(300, 0);
  g += [-130, 130].map((x) => R(x - 28, -40, 56, 34, 8, '#a86b4a') + flowerBox(x - 24, -40, 48, s)).join('');
  if (gift) g += `<g class="gift-box" data-gift="1" transform="translate(165 10)"><g class="map-bounce"><ellipse cx="0" cy="6" rx="46" ry="12" fill="url(#g-ground)"/><rect x="-38" y="-60" width="76" height="62" rx="8" fill="#c99bff"/><rect x="-44" y="-74" width="88" height="20" rx="6" fill="#b583ff"/><rect x="-7" y="-74" width="14" height="76" fill="#ffd36b"/><path d="M0 -74 C-20 -104 -44 -84 -16 -74Z M0 -74 C20 -104 44 -84 16 -74Z" fill="#ffd36b"/>${[[-50, -80], [52, -60], [0, -120]].map(([x, y]) => `<path d="${sparkleD(x, y, 8)}" fill="#ffe680"><animate attributeName="opacity" values="0;1;0" dur="1.4s" begin="${x / 100}s" repeatCount="indefinite"/></path>`).join('')}</g></g>`;
  return g;
}

function salon(s: Season): string {
  const wall = '#a8ead2';
  let g = E(0, 4, 220, 16, 'url(#g-ground)');
  g += R(-200, -400, 400, 400, 8, wall) + shade(-200, -400, 400, 400, 8) + R(-214, -414, 428, 22, 8, '#ffffff') + roofSnow('M-214 -414 L214 -414 L214 -404 L-214 -404Z', s);
  g += windowBox(-160, -370, 80, 70, '#ffffff', false, flowerBox(-160, -296, 80, s)) + windowBox(-40, -370, 80, 70, '#ffffff', true, flowerBox(-40, -296, 80, s)) + windowBox(80, -370, 80, 70, '#ffffff', false, flowerBox(80, -296, 80, s));
  // neon sign
  g += R(-120, -268, 240, 64, 20, '#3a2a4a') + `<g><animate attributeName="opacity" values="1;0.75;1;1;0.85;1" dur="3s" repeatCount="indefinite"/>${T(0, -222, 'Salon', 46, '#ff9ec7', 'font-style="italic" stroke="#ffd9e8" stroke-width="1.5" style="filter:drop-shadow(0 0 6px #ff7eb6)"')}</g>`;
  // awning
  let aw = 'M-200 -196 L200 -196 L200 -146';
  for (let i = 0; i < 10; i++) aw += ` Q${f(200 - 40 * (i + 0.5))} -118 ${f(200 - 40 * (i + 1))} -146`;
  g += P(aw + 'Z', '#ff9ec7');
  for (let i = 0; i < 10; i += 2) g += P(`M${-200 + i * 40} -196 L${-160 + i * 40} -196 L${-160 + i * 40} -146 Q${-180 + i * 40} -118 ${-200 + i * 40} -146Z`, '#ffffff');
  // shop window: mirror and chair
  g += R(-180, -130, 230, 126, 8, '#ffffff') + R(-172, -122, 214, 110, 6, '#e6fbff') + R(-172, -122, 214, 110, 6, 'url(#g-glass)');
  g += E(-100, -78, 34, 40, 'url(#g-gold)') + E(-100, -78, 27, 33, '#d9efff') + R(-36, -60, 50, 44, 14, '#ff7eb6') + R(-14, -16, 8, 14, 3, '#9aa3b5');
  g += R(80, -140, 90, 140, 10, '#ff7eb6') + R(90, -130, 70, 90, 8, '#ffd9e8') + C(150, -60, 5, '#ffd24a');
  // hanging scissors sign
  g += L(200, -250, 250, -250, '#9aa3b5', 4) + C(250, -210, 34, '#ffffff', 'stroke="#ff7eb6" stroke-width="5"') + C(240, -200, 8, 'none', 'stroke="#ff7eb6" stroke-width="4"') + C(260, -200, 8, 'none', 'stroke="#ff7eb6" stroke-width="4"') + L(244, -206, 262, -232, '#9aa3b5', 4) + L(256, -206, 238, -232, '#9aa3b5', 4) + L(250, -250, 250, -244, '#9aa3b5', 3);
  return g;
}

function boutique(s: Season): string {
  const wall = '#ffc7dc';
  let g = E(0, 4, 220, 16, 'url(#g-ground)');
  g += R(-200, -420, 400, 420, 8, wall) + shade(-200, -420, 400, 420, 8);
  g += P('M-214 -420 L214 -420 L196 -460 L-196 -460Z', '#e0457b') + roofSnow('M-216 -418 L-196 -462 L196 -462 L216 -418 Q0 -432 -216 -418Z', s);
  g += R(-160, -400, 320, 56, 14, '#ffffff') + T(0, -360, 'Boutique', 40, 'url(#g-gold)', 'font-style="italic" stroke="#c98a1e" stroke-width="1"');
  for (const x of [-170, 50]) {
    g += P(`M${x} -40 L${x} -240 A60 60 0 0 1 ${x + 120} -240 L${x + 120} -40Z`, '#ffffff') + P(`M${x + 8} -48 L${x + 8} -238 A52 52 0 0 1 ${x + 112} -238 L${x + 112} -48Z`, '#fff3f8') + P(`M${x + 8} -48 L${x + 8} -238 A52 52 0 0 1 ${x + 112} -238 L${x + 112} -48Z`, 'url(#g-glass)');
    const dress = x < 0 ? '#c99bff' : '#7cc8ff';
    g += C(x + 60, -222, 10, '#f0e6ee') + P(`M${x + 44} -210 Q${x + 60} -216 ${x + 76} -210 L${x + 90} -100 Q${x + 60} -90 ${x + 30} -100Z`, dress) + P(`M${x + 44} -210 Q${x + 60} -216 ${x + 76} -210 L${x + 90} -100 Q${x + 60} -90 ${x + 30} -100Z`, 'url(#p-stars)') + R(x + 57, -100, 6, 50, 2, '#4a4a5e');
  }
  g += R(-34, -170, 68, 170, 30, '#e0457b') + R(-26, -160, 52, 110, 24, '#ffd9e8') + P(heartD(0, -130, 12), '#ff7eb6');
  let aw = 'M-200 -290 L200 -290 L200 -262';
  for (let i = 0; i < 8; i++) aw += ` Q${f(200 - 50 * (i + 0.5))} -236 ${f(200 - 50 * (i + 1))} -262`;
  g += P(aw + 'Z', '#ffffff') + P('M-200 -290 L200 -290 L200 -282 L-200 -282Z', '#ff7eb6');
  for (const x of [-230, 230]) g += R(x - 22, -50, 44, 50, 8, '#ffffff') + C(x, -86, 34, s === 'winter' ? '#e8f0fa' : '#5fc47c') + C(x - 10, -96, 10, '#fff', 'opacity="0.2"') + (s === 'winter' ? '' : C(x + 12, -94, 6, '#ff7eb6'));
  return g;
}

function theater(s: Season): string {
  const wall = '#8f5ff0';
  let g = '';
  // sweeping spotlights behind
  for (const [x, d] of [[-160, 0], [160, 2]] as const) g += `<g><animateTransform attributeName="transform" type="rotate" values="-14 ${x} -300;14 ${x} -300;-14 ${x} -300" dur="6s" begin="${-d}s" repeatCount="indefinite"/><path d="M${x - 20} -300 L${x + 20} -300 L${x + 120} -900 L${x - 120} -900Z" fill="url(#g-spot)" opacity="0.55"/></g>`;
  g += E(0, 4, 300, 20, 'url(#g-ground)');
  g += R(-270, -440, 540, 440, 8, wall) + shade(-270, -440, 540, 440, 8);
  g += P('M-290 -436 L0 -540 L290 -436Z', '#6b3fd0') + P('M-250 -444 L0 -526 L250 -444Z', '#7a4fe0') + P(starD(0, -480, 28), 'url(#g-gold)') + roofSnow('M-292 -434 L0 -542 L292 -434 Q140 -448 0 -440 Q-140 -448 -292 -434Z', s);
  for (const x of [-220, -110, 110, 220]) g += R(x - 18, -420, 36, 420, 6, '#f6efff') + R(x - 18, -420, 10, 420, 4, '#ffffff', 'opacity="0.6"') + R(x - 26, -430, 52, 16, 6, '#ffd24a') + R(x - 26, -16, 52, 16, 6, '#ffd24a');
  // marquee with chasing lights
  g += R(-150, -360, 300, 110, 16, '#ffd24a') + R(-138, -348, 276, 86, 10, '#c2244a') + T(0, -292, 'THEATER', 46, '#ffffff');
  for (let i = 0; i < 24; i++) {
    const t = i / 24;
    const [x, y] = t < 0.5 ? [-150 + t * 2 * 300, -360] : [150 - (t - 0.5) * 2 * 300, -250];
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="#fff8c8"><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="${-(i % 3) * 0.3}s" repeatCount="indefinite"/></circle>`;
  }
  // posters and doors
  for (const x of [-165, 165]) g += R(x - 34, -210, 68, 96, 6, '#fff3f8') + R(x - 28, -204, 56, 84, 4, x < 0 ? '#ff9ec7' : '#7cc8ff') + P(starD(x, -168, 16), '#ffe680') + T(x, -126, x < 0 ? 'Piano' : 'Show', 14, '#ffffff');
  g += P('M-60 0 L-60 -170 A60 46 0 0 1 60 -170 L60 0Z', '#c2244a') + P('M-60 0 L-60 -170 Q-12 -110 -4 0Z', '#e03a62') + P('M60 0 L60 -170 Q12 -110 4 0Z', '#e03a62');
  // red carpet with ropes
  g += P('M-60 0 L60 0 L90 46 L-90 46Z', '#e03a62') + P('M-60 0 L60 0 L64 8 L-64 8Z', '#c2244a');
  for (const x of [-110, 110]) g += R(x - 4, 0, 8, 52, 3, 'url(#g-gold)') + C(x, -4, 8, 'url(#g-gold)');
  g += P('M-110 10 Q-90 30 -70 14', 'none', 'stroke="#c2244a" stroke-width="5"') + P('M110 10 Q90 30 70 14', 'none', 'stroke="#c2244a" stroke-width="5"');
  return g;
}

// ---------------- cars ----------------
function car(body: string, top: string): string {
  return `<g transform="translate(0 -30)">${R(-58, -14, 116, 40, 18, body)}${R(-58, -14, 116, 40, 18, 'url(#g-shadeY)')}${P('M-34 -14 Q-24 -46 6 -46 L24 -46 Q42 -46 46 -14Z', top)}${P('M-22 -16 Q-16 -38 4 -38 L16 -38 Q32 -38 34 -16Z', '#d9efff')}${P('M-22 -16 Q-16 -38 4 -38 L16 -38 Q32 -38 34 -16Z', 'url(#g-glass)')}` +
    `${C(-34, 26, 14, '#4a4a5e')}${C(-34, 26, 6, '#c9cfdd')}${C(34, 26, 14, '#4a4a5e')}${C(34, 26, 6, '#c9cfdd')}${C(56, 2, 6, '#fff6c8')}${E(70, 2, 24, 10, 'url(#g-glow)')}${P(heartD(0, -4, 8), '#fff', 'opacity="0.8"')}</g>`;
}
function traffic(): string {
  const lane1 = ROAD_Y + 32;
  const lane2 = ROAD_Y + 80;
  const ride = (y: number, dur: number, begin: number, rev: boolean, art: string) =>
    `<g><animateTransform attributeName="transform" type="translate" values="${rev ? `${TOWN_W + 300} ${y};-300 ${y}` : `-300 ${y};${TOWN_W + 300} ${y}`}" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite"/>${rev ? `<g transform="scale(-1 1)">${art}</g>` : art}</g>`;
  return ride(lane1, 40, 6, true, car('#7cc8ff', '#a8d8ff')) + ride(lane2, 32, 0, false, car('#ff7eb6', '#ff9ec7')) + ride(lane2, 46, 22, false, car('#ffd36b', '#ffe680')) + ride(lane1, 52, 30, true, car('#5fd3b5', '#8ee6cf'));
}

// ---------------- layers ----------------
export interface TownLayers { sky: string; far: string; mid: string; main: string; front: string }

export function townLayers(s: Season, friends: Record<string, Look[]>, gift: boolean): TownLayers {
  const L0 = SEASON_LOOK[s];
  const sky = (() => {
    const id = uid('tsky');
    let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L0.skyTop}"/><stop offset="1" stop-color="${L0.skyBottom}"/></linearGradient></defs><rect x="-100" y="-100" width="1800" height="1200" fill="url(#${id})"/>`;
    g += C(1300, 130, 140, L0.sun, 'opacity="0.25"') + C(1300, 130, 85, L0.sun, 'opacity="0.4"') + C(1300, 130, 58, L0.sun);
    g += cloud(260, 120, 1.0, 140) + cloud(820, 80, 0.8, -110) + cloud(1450, 220, 0.7, 90) + birds(s, 150);
    return g;
  })();

  // far mountains
  const farW = TOWN_LAYER.far.w;
  const mount = s === 'winter' ? '#dfe8f6' : s === 'fall' ? '#e8c9a8' : '#c9d9f0';
  let far = '';
  for (let x = -200; x < farW; x += 520) {
    const h = 200 + ((x * 7) % 120);
    far += P(`M${x} 520 L${x + 260} ${520 - h} L${x + 560} 520Z`, mount) + P(`M${x + 200} ${520 - h * 0.78} L${x + 260} ${520 - h} L${x + 330} ${520 - h * 0.72} Q${x + 270} ${520 - h * 0.66} ${x + 200} ${520 - h * 0.78}Z`, '#ffffff', 'opacity="0.85"');
  }
  far += R(-200, 500, farW + 400, 600, 0, light(L0.hill1, 0.25));

  // middle hills, trees, a windmill and a balloon
  const midW = TOWN_LAYER.mid.w;
  let mid = P(`M-200 540 ${Array.from({ length: Math.ceil(midW / 380) + 1 }, (_, i) => `Q${-200 + (i + 0.5) * 380} ${440 + (i % 2) * 40} ${-200 + (i + 1) * 380} 540`).join(' ')} L${midW} 1100 L-200 1100Z`, L0.hill1);
  mid += P(`M-200 580 ${Array.from({ length: Math.ceil(midW / 440) + 1 }, (_, i) => `Q${-200 + (i + 0.5) * 440} ${500 + ((i + 1) % 2) * 50} ${-200 + (i + 1) * 440} 580`).join(' ')} L${midW} 1100 L-200 1100Z`, L0.hill2);
  for (let i = 0; i < Math.ceil(midW / 215); i++) mid += seasonTree(60 + i * 215 + ((i * 53) % 90), 560 + ((i * 37) % 30), 0.42 + ((i * 13) % 10) / 60, s, i);
  for (const wx of [900, 3300, 5200, 7400]) {
    mid += P(`M${wx - 24} 520 L${wx - 12} 380 L${wx + 12} 380 L${wx + 24} 520Z`, '#fff3e6') + P(`M${wx - 18} 380 L${wx} 352 L${wx + 18} 380Z`, '#e85d5d');
    mid += `<g><animateTransform attributeName="transform" type="rotate" values="0 ${wx} 384;360 ${wx} 384" dur="9s" repeatCount="indefinite"/>${[0, 90, 180, 270].map((a) => `<path d="M${wx} 384 L${wx - 8} ${384 - 90} L${wx + 8} ${384 - 90}Z" fill="#ffffff" transform="rotate(${a} ${wx} 384)"/>`).join('')}</g>` + C(wx, 384, 6, '#c98a5a');
  }
  mid += `<g><animateTransform attributeName="transform" type="translate" values="0 0;40 -30;0 0" dur="11s" repeatCount="indefinite"/><g transform="translate(2100 170) scale(0.9)"><path d="M0 -70 C46 -70 56 -20 30 14 L12 34 L-12 34 L-30 14 C-56 -20 -46 -70 0 -70Z" fill="#ff9ec7"/><path d="M0 -70 C18 -70 22 -20 12 14 L6 34 L-6 34 L-12 14 C-22 -20 -18 -70 0 -70Z" fill="#ffd36b"/><path d="M-12 34 L-10 52 M12 34 L10 52" stroke="#8a5a3c" stroke-width="2"/><rect x="-14" y="50" width="28" height="18" rx="4" fill="#c98a5a"/></g></g>`;

  // main street
  const grassId = uid('tg');
  let main = `<defs><linearGradient id="${grassId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L0.grassDark}"/><stop offset="0.4" stop-color="${L0.grass}"/><stop offset="1" stop-color="${light(L0.grass, 0.12)}"/></linearGradient></defs>`;
  main += P(`M-200 600 ${Array.from({ length: Math.ceil(TOWN_W / 380) + 2 }, (_, i) => `Q${-200 + (i + 0.5) * 380} ${574 + (i % 2) * 16} ${-200 + (i + 1) * 380} 600`).join(' ')} L${TOWN_W + 200} 1100 L-200 1100Z`, `url(#${grassId})`);
  for (let i = 0; i < 260; i++) {
    const x = (i * 211) % TOWN_W;
    const y = 610 + ((i * 97) % 34);
    if (s === 'winter') main += E(x, y, 20, 5, '#ffffff', 'opacity="0.8"');
    else if (s === 'fall') main += E(x, y, 6, 3.5, L0.leaves[i % 4], `transform="rotate(${(i * 47) % 180} ${x} ${y})"`);
    else if (i % 3 === 0) main += flowerG(x, y, 6, ['#ff9ec7', '#ffffff', '#ffd36b', '#c99bff'][i % 4]);
  }
  // sidewalk, curb, road
  const walk = s === 'winter' ? '#eef2f8' : '#f6eadb';
  main += R(-200, BASE - 6, TOWN_W + 400, ROAD_Y - BASE + 6, 0, walk);
  for (let x = -200; x < TOWN_W + 200; x += 70) main += R(x, BASE - 6, 2, ROAD_Y - BASE + 6, 0, dark(walk, 0.08));
  main += R(-200, ROAD_Y - 6, TOWN_W + 400, 8, 0, '#ffffff') + R(-200, ROAD_Y, TOWN_W + 400, ROAD_H, 0, s === 'winter' ? '#c6ccdc' : '#b6bccf') + R(-200, ROAD_Y, TOWN_W + 400, ROAD_H, 0, 'url(#g-shadeY)', 'opacity="0.5"');
  for (let x = -160; x < TOWN_W + 200; x += 120) main += R(x, ROAD_Y + ROAD_H / 2 - 3, 60, 6, 3, '#ffffff', 'opacity="0.9"');
  for (const cx of [2300, SQUARE_X, 6290, 8180]) for (let i = 0; i < 6; i++) main += R(cx - 110 + i * 40, ROAD_Y + 10, 24, ROAD_H - 20, 4, '#ffffff', 'opacity="0.85"');
  main += R(-200, ROAD_Y + ROAD_H, TOWN_W + 400, 10, 0, '#ffffff');
  for (let i = 0; i < 340; i++) {
    const x = (i * 157) % TOWN_W;
    const y = ROAD_Y + ROAD_H + 22 + ((i * 61) % 70);
    if (s === 'winter') main += E(x, y, 26, 6, '#ffffff', 'opacity="0.85"');
    else if (s === 'fall') main += E(x, y, 7, 4, L0.leaves[i % 4], `transform="rotate(${(i * 53) % 180} ${x} ${y})"`);
    else main += P(`M${x} ${y} l-5 -14 M${x} ${y} l5 -16 M${x} ${y} l0 -12`, 'none', `stroke="${L0.grassDark}" stroke-width="3.5" stroke-linecap="round" opacity="0.7"`);
  }
  for (let i = 0; i < 30; i++) {
    const x = 160 + i * 340 + ((i * 71) % 120);
    const y = ROAD_Y + ROAD_H + 64 + ((i * 29) % 26);
    if (s === 'winter') main += i % 3 === 0 ? `<g transform="translate(${x} ${y}) scale(0.3)">${C(0, -60, 62, '#fff')}${C(0, -160, 46, '#fff')}${C(-12, -168, 5, '#2d2a3a')}${C(12, -168, 5, '#2d2a3a')}${P('M0 -158 L30 -152 L0 -148Z', '#ff8a3d')}${R(-44, -130, 88, 16, 8, ['#e8384f', '#4f9dff', '#9b6bff'][i % 3])}</g>` : E(x, y, 60, 14, '#ffffff');
    else if (s === 'fall') main += E(x - 14, y - 16, 18, 22, '#ff8a3d') + E(x + 14, y - 16, 18, 22, '#ff8a3d') + E(x, y - 16, 20, 24, '#ffab3d') + R(x - 3, y - 46, 6, 10, 2, '#5fae6b') + E(x + 40, y - 4, 30, 10, L0.leaves[i % 4]);
    else if (s === 'summer' && i % 3 === 0) main += C(x, y - 22, 22, '#ffffff') + P(`M${x} ${y - 44} Q${x - 22} ${y - 22} ${x} ${y} Q${x - 10} ${y - 22} ${x} ${y - 44}Z`, '#ff4f6d') + P(`M${x} ${y - 44} Q${x + 22} ${y - 22} ${x} ${y} Q${x + 10} ${y - 22} ${x} ${y - 44}Z`, '#7cc8ff');
    else for (let k = 0; k < 5; k++) main += L(x - 30 + k * 15, y, x - 30 + k * 15, y - 22, '#5fae6b', 3) + flowerG(x - 30 + k * 15, y - 26, 9, ['#ff9ec7', '#ffd36b', '#ffffff', '#c99bff', '#ff7eb6'][(k + i) % 5]);
  }
  if (s === 'winter') for (let x = -200; x < TOWN_W; x += 260) main += E(x + 80, ROAD_Y - 4, 60, 8, '#ffffff');

  // trees and lamps between places
  for (const x of [80, 760, 1180, 1960, 2700, 3200, 3650, 4100, 4760, 5340, 5960, 6620, 7260, 7870, 8480, 9080, 9700, 10400]) main += seasonTree(x, BASE - 4, 0.75, s, Math.round(x / 7));
  for (const x of [700, 1900, 2650, 3640, 4120, 5350, 6620, 7870, 9080]) main += lamp(x, BASE + 30);

  const spots: Record<string, (s: Season) => string> = { home, playground, school, salon, boutique, theater };
  main += `<g transform="translate(960 ${BASE})">${neighbor(s)}</g>`;
  main += `<g transform="translate(${SQUARE_X} ${BASE + 20})">${square(s, gift)}</g>`;
  main += `<g transform="translate(2560 ${ROAD_Y + 60})">${bus()}</g>`;
  for (const sp of TOWN_SPOTS) {
    const label = `<g class="map-label"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="2.6s" begin="${-sp.x / 900}s" repeatCount="indefinite"/>` +
      `${R(-(sp.label.length * 17 + 46) / 2, -sp.top - 70, sp.label.length * 17 + 46, 54, 27, '#ffffff', `stroke="${sp.color}" stroke-width="5"`)}${T(0, -sp.top - 31, sp.label, 32, sp.color)}<path d="M-10 ${-sp.top - 18} L10 ${-sp.top - 18} L0 ${-sp.top - 4}Z" fill="${sp.color}"/></g></g>`;
    const art = spots[sp.id] ? spots[sp.id](s) : (EXTRA_FACADES[sp.id]?.art ?? placeholder)(s);
    main += `<g class="map-spot" data-place="${sp.id}" transform="translate(${sp.x} ${BASE})"><g class="map-bounce">${art}</g>${label}</g>`;
  }
  // friends standing outside wherever they are
  for (const sp of TOWN_SPOTS) {
    const list = friends[sp.id] ?? [];
    list.slice(0, 4).forEach((look, i) => {
      const x = sp.x + (i - (Math.min(list.length, 4) - 1) / 2) * 62 + (sp.id === 'theater' ? 150 : 0);
      main += `<g class="doll map-doll" transform="translate(${f(x)} ${ROAD_Y - 2}) scale(0.3)" style="--blink-delay:${i * 0.7}s">${E(0, 0, 50, 12, 'url(#g-ground)')}<g class="bob" style="animation-delay:${i * 0.5}s"><g class="art">${renderDoll(look, { expr: 'happy' })}</g></g></g>`;
    });
  }
  main += traffic();

  // front bushes, flowers and fence (pointer-transparent)
  const frontW = TOWN_LAYER.front.w;
  const bc = s === 'winter' ? '#e8f0fa' : s === 'fall' ? '#d98a3d' : '#4fb46c';
  let front = '';
  for (let x = -200; x < frontW; x += 300) {
    front += bush(x + ((x * 7) % 90), 968, 1.15 + ((x / 300) % 3) * 0.12, bc);
    if (s === 'spring' || s === 'summer') front += flowerG(x + 120, 918, 13, ['#ff9ec7', '#ffd36b', '#ffffff', '#c99bff'][(x / 300) % 4 | 0]);
  }
  for (let x = -200; x < frontW; x += 46) if (((x / 46) | 0) % 14 < 6) front += P(`M${x} 960 L${x} 900 L${x + 14} 886 L${x + 28} 900 L${x + 28} 960Z`, '#ffffff', 'opacity="0.95"');
  return { sky, far, mid, main, front };
}

// Each layer is just wide enough to cover the screen at the far end of town.
export const TOWN_LAYER = {
  far: { k: 0.25, w: Math.round(TOWN_W * 0.25 + 2400) },
  mid: { k: 0.55, w: Math.round(TOWN_W * 0.55 + 2400) },
  main: { k: 1, w: TOWN_W },
  front: { k: 1.15, w: Math.round(TOWN_W * 1.15 + 2400) },
};
