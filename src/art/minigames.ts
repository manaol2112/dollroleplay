// Drawings for the action mini-games: go-karts, swim caps, ring-toss bottles, balloons, plush prizes,
// the podium and the backgrounds (town street, hotel pool, frozen pond, carnival booth). Every function
// returns an SVG string; nothing here touches the page.
import { body } from './body';
import { dark, light } from './color';
import { renderDoll } from './doll';
import { heartD, sparkleD, starD } from './wear';
import type { Look } from '../types';

export const f = (n: number) => n.toFixed(1);
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const R = (x: number, y: number, w: number, h: number, rx: number, fill: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const S = (d: string, c: string, w = 3, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (t: string, s: string, extra = '') => `<g transform="${t}" ${extra}>${s}</g>`;
const T = (x: number, y: number, s: string, size: number, fill: string, stroke = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" fill="${fill}" text-anchor="middle"${stroke ? ` stroke="${stroke}" stroke-width="${f(size * 0.18)}" paint-order="stroke" stroke-linejoin="round"` : ''}>${s}</text>`;

const escText = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Small seeded random numbers so backgrounds look the same every time. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------- dolls ----------------
/** A doll's head (with hair and hats) centred on (0, 0); the head radius is about 92 for kids. */
export function headG(look: Look, expr: 'normal' | 'happy' | 'surprised' = 'normal'): string {
  const b = body(look.age, !!look.boy);
  return G(`translate(0 ${f(-b.headY)})`, renderDoll(look, { headOnly: true, expr }));
}
export const headR = (look: Look) => body(look.age, !!look.boy).R;

/** Head in a swim cap and goggles, centred on (0, 0). */
export function swimHead(look: Look, cap: string, expr: 'normal' | 'happy' = 'normal'): string {
  const b = body(look.age, !!look.boy);
  const R0 = b.R;
  const bare: Look = { ...look, hair: 'buzz', wear: {}, sticker: null };
  let s = renderDoll(bare, { headOnly: true, expr });
  const hy = b.headY;
  const k = (n: number) => f(n * R0);
  s += P(`M${k(-1.03)} ${f(hy - R0 * 0.02)} Q${k(-1.12)} ${f(hy - R0 * 1.15)} 0 ${f(hy - R0 * 1.1)} Q${k(1.12)} ${f(hy - R0 * 1.15)} ${k(1.03)} ${f(hy - R0 * 0.02)} Q${k(0.7)} ${f(hy - R0 * 0.36)} 0 ${f(hy - R0 * 0.38)} Q${k(-0.7)} ${f(hy - R0 * 0.36)} ${k(-1.03)} ${f(hy - R0 * 0.02)}Z`, cap, `stroke="${dark(cap, 0.2)}" stroke-width="${k(0.03)}"`);
  s += P(`M${k(-0.7)} ${f(hy - R0 * 0.8)} Q${k(-0.3)} ${f(hy - R0 * 1.02)} ${k(0.1)} ${f(hy - R0 * 0.98)}`, 'none', `stroke="#fff" stroke-width="${k(0.09)}" stroke-linecap="round" opacity="0.45"`);
  s += P(starD(R0 * 0.5, hy - R0 * 0.66, R0 * 0.16), '#fff', 'opacity="0.85"');
  // goggles
  const ey = hy + R0 * 0.1;
  const frame = dark(cap, 0.35);
  s += S(`M${k(-1.0)} ${f(ey - R0 * 0.08)} L${k(-0.6)} ${f(ey)} M${k(1.0)} ${f(ey - R0 * 0.08)} L${k(0.6)} ${f(ey)}`, frame, R0 * 0.07);
  s += S(`M${k(-0.17)} ${f(ey)} Q0 ${f(ey - R0 * 0.08)} ${k(0.17)} ${f(ey)}`, frame, R0 * 0.06);
  for (const sd of [-1, 1]) {
    s += E(sd * R0 * 0.38, ey, R0 * 0.23, R0 * 0.2, '#9fe0ff', `opacity="0.5" stroke="${frame}" stroke-width="${k(0.06)}"`);
    s += E(sd * R0 * 0.38 - R0 * 0.08, ey - R0 * 0.07, R0 * 0.06, R0 * 0.04, '#fff', 'opacity="0.85"');
  }
  return G(`translate(0 ${f(-hy)})`, s);
}

const shirtOf = (look: Look) => look.wear.top?.color ?? look.wear.dress?.color ?? look.wear.outer?.color ?? '#ff9ec7';

// ---------------- go-karts ----------------
export interface KartStyle { id: string; name: string; color: string; }
export const KARTS: KartStyle[] = [
  { id: 'classic', name: 'Classic', color: '#ff5c7a' },
  { id: 'rocket', name: 'Rocket', color: '#7cc8ff' },
  { id: 'candy', name: 'Candy', color: '#ff9ec7' },
  { id: 'flower', name: 'Flower', color: '#7fd67a' },
  { id: 'monster', name: 'Monster', color: '#9b6bff' },
  { id: 'unicorn', name: 'Unicorn', color: '#c99bff' },
  { id: 'bee', name: 'Bumble', color: '#ffd36b' },
];
export const KART_COLORS = ['#ff5c7a', '#ff9ec7', '#c99bff', '#9b6bff', '#7cc8ff', '#5fd3b5', '#7fd67a', '#ffd36b', '#ff9a5c', '#f4f0ff'];

function wheel(x: number, r: number, hub: string, kind: 'plain' | 'mint' | 'flower' | 'star' = 'plain'): string {
  let w = C(0, 0, r, '#3a3346') + C(0, 0, r * 0.82, '#4c4459');
  if (kind === 'mint') {
    w += C(0, 0, r * 0.62, '#fff');
    for (let i = 0; i < 6; i++) w += P(`M0 0 L${f(Math.cos((i * Math.PI) / 3) * r * 0.62)} ${f(Math.sin((i * Math.PI) / 3) * r * 0.62)} A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(Math.cos(((i + 0.5) * Math.PI) / 3) * r * 0.62)} ${f(Math.sin(((i + 0.5) * Math.PI) / 3) * r * 0.62)}Z`, '#ff4f6d');
  } else if (kind === 'flower') {
    for (let i = 0; i < 5; i++) w += E(0, -r * 0.34, r * 0.2, r * 0.3, hub, `transform="rotate(${i * 72})"`);
    w += C(0, 0, r * 0.2, '#ffd36b');
  } else if (kind === 'star') {
    w += C(0, 0, r * 0.6, hub) + P(starD(0, 0, r * 0.45), '#fff');
  } else {
    w += C(0, 0, r * 0.55, hub) + S(`M${f(-r * 0.5)} 0 L${f(r * 0.5)} 0 M0 ${f(-r * 0.5)} L0 ${f(r * 0.5)}`, dark(hub, 0.25), r * 0.12) + C(0, 0, r * 0.16, '#fff');
  }
  return G(`translate(${f(x)} ${f(-r)})`, `<g class="mg-wheel">${w}</g>`);
}

function driver(look: Look, x: number, seatY: number, s = 0.46): string {
  const shirt = shirtOf(look);
  const hr = headR(look) * s;
  let g = R(x - 22, seatY - 46, 44, 50, 18, shirt) + R(x - 22, seatY - 46, 44, 50, 18, 'url(#g-shadeX)');
  g += S(`M${f(x + 8)} ${f(seatY - 34)} Q${f(x + 30)} ${f(seatY - 26)} ${f(x + 44)} ${f(seatY - 34)}`, shirt, 13);
  g += C(x + 46, seatY - 35, 7.5, look.skin);
  g += G(`translate(${f(x)} ${f(seatY - 46 - hr * 0.78)}) scale(${s})`, headG(look, 'happy'));
  return g;
}

const BOOST_FX = `<g class="mg-boostfx"><g class="mg-flame">${P('M-96 -54 Q-160 -46 -196 -40 Q-160 -32 -96 -26Z', '#ff8a3d')}${P('M-96 -50 Q-150 -42 -170 -40 Q-150 -36 -96 -30Z', '#ffd36b')}${P('M-96 -46 Q-126 -41 -140 -40 Q-126 -38 -96 -34Z', '#fff3b0')}</g></g>`;

/** A go-kart seen from the side, facing right, wheels on y = 0, about 220 long. `look` is the driver. */
export function kartArt(style: string, color: string, look: Look | null): string {
  return BOOST_FX + kartBody(style, color, look);
}
function kartBody(style: string, color: string, look: Look | null): string {
  const c = color;
  const dk = dark(c, 0.22);
  const lt = light(c, 0.45);
  const steer = (x: number, y: number) => S(`M${x - 6} ${y + 20} L${x + 4} ${y}`, '#4c4459', 6) + E(x + 5, y - 2, 4, 12, '#4c4459', `transform="rotate(-20 ${x + 5} ${y - 2})"`);
  let back = '';
  let bodyS = '';
  let front = '';
  let seatY = -50;
  const shade = (d: string) => P(d, 'url(#g-shadeY)', 'opacity="0.6"');
  switch (style) {
    case 'rocket': {
      const d = 'M-96 -28 Q-104 -66 -64 -68 L10 -68 Q70 -66 122 -42 Q128 -34 118 -28 Q104 -22 80 -22 L-88 -22 Q-96 -22 -96 -28Z';
      back = P('M-80 -66 L-108 -112 L-86 -112 L-52 -66Z', dk) + R(-112, -52, 18, 26, 6, '#9aa3b5') +
        `<g class="mg-flame">${P('M-112 -48 Q-150 -40 -176 -38 Q-150 -34 -112 -28Z', '#ffd36b')}${P('M-112 -44 Q-136 -39 -150 -38 Q-136 -36 -112 -32Z', '#fff3b0')}</g>`;
      bodyS = P(d, c) + shade(d) + P('M-60 -62 L80 -58 Q100 -52 112 -42', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.6"') +
        P(starD(40, -42, 11), '#fff') + P(starD(66, -40, 7), '#ffd36b') + C(-30, -44, 10, lt, 'stroke="#fff" stroke-width="3"') + P('M-64 -24 L-80 -6 L-52 -22Z', dk);
      front = steer(26, -76);
      seatY = -58;
      break;
    }
    case 'candy': {
      const d = 'M-98 -32 Q-100 -76 -50 -74 L50 -74 Q104 -72 106 -34 Q106 -22 92 -22 L-86 -22 Q-98 -22 -98 -32Z';
      back = S('M-82 -70 L-82 -132', '#fff', 6) + C(-82, -140, 20, '#ff7eb6') + S('M-82 -140 m-14 0 a14 14 0 1 1 14 14 a9 9 0 1 1 -9 -9 a4 4 0 1 1 4 4', '#fff', 4);
      bodyS = P(d, c) + shade(d) + P('M-80 -60 Q0 -72 90 -58', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.55"');
      const r = rng(7);
      const sprinkle = ['#fff', '#ffd36b', '#7cc8ff', '#5fd3b5', '#c99bff'];
      for (let i = 0; i < 14; i++) {
        const x = -84 + r() * 170;
        const y = -58 + r() * 28;
        bodyS += R(x, y, 11, 4, 2, sprinkle[i % 5], `transform="rotate(${f(r() * 180)} ${f(x + 5)} ${f(y + 2)})"`);
      }
      bodyS += P('M-98 -36 Q-60 -26 -20 -36 Q20 -26 60 -36 Q90 -28 106 -36 L106 -30 Q106 -22 92 -22 L-86 -22 Q-98 -22 -98 -32Z', '#fff', 'opacity="0.85"');
      front = steer(24, -82);
      seatY = -62;
      break;
    }
    case 'flower': {
      const d = 'M-96 -30 Q-98 -64 -66 -66 L60 -66 Q100 -64 104 -34 Q104 -22 90 -22 L-86 -22 Q-96 -22 -96 -30Z';
      back = P('M-80 -64 Q-120 -110 -86 -116 Q-70 -96 -66 -64Z', '#5fbf6a') + S('M-78 -66 Q-90 -92 -88 -110', '#3f9a4f', 3);
      bodyS = P(d, c) + shade(d);
      for (let i = 0; i < 5; i++) bodyS += E(36, -58, 9, 14, '#fff', `transform="rotate(${i * 72} 36 -44)"`);
      bodyS += C(36, -44, 8, '#ffd36b') + C(-46, -42, 6, '#fff', 'opacity="0.8"') + C(-20, -50, 4, '#fff', 'opacity="0.8"') + C(-60, -54, 3, '#ffd36b');
      front = steer(24, -74) + S('M92 -60 Q96 -86 104 -98', '#3f9a4f', 3);
      for (let i = 0; i < 5; i++) front += E(104, -108, 5, 8, '#ff9ec7', `transform="rotate(${i * 72} 104 -100)"`);
      front += C(104, -100, 4, '#ffd36b');
      seatY = -56;
      break;
    }
    case 'monster': {
      const d = 'M-100 -74 Q-102 -108 -72 -110 L54 -110 Q100 -108 106 -82 Q108 -68 94 -68 L-88 -68 Q-100 -68 -100 -74Z';
      back = S('M-60 -108 L-52 -150 L20 -150 L34 -108', '#4c4459', 7);
      bodyS = S('M-62 -40 l8 -6 l-8 -6 l8 -6 l-8 -6 l8 -6 M62 -40 l8 -6 l-8 -6 l8 -6 l-8 -6 l8 -6', '#9aa3b5', 4) + P(d, c) + shade(d) +
        P('M-86 -98 L80 -98', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.5"') + P('M-30 -74 l12 -26 l8 14 l12 -20', 'none', `stroke="#ffd36b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`);
      front = steer(26, -118);
      seatY = -98;
      return `<g class="mg-kart-body">${back}${look ? driver(look, -14, seatY) : ''}${bodyS}${wheel(-64, 40, '#ffd36b')}${wheel(66, 40, '#ffd36b')}${front}</g>`;
    }
    case 'unicorn': {
      const bodyC = light(c, 0.75);
      const d = 'M-96 -30 Q-98 -68 -60 -70 L56 -70 Q100 -66 108 -36 Q110 -22 94 -22 L-86 -22 Q-96 -22 -96 -30Z';
      const rain = ['#ff7eb6', '#ffd36b', '#7fd67a', '#7cc8ff', '#c99bff'];
      back = rain.map((col, i) => S(`M${-74 + i * 4} -66 Q${-112 - i * 6} ${-84 + i * 10} ${-128 - i * 4} ${-52 + i * 9}`, col, 9)).join('');
      bodyS = P(d, bodyC) + shade(d) + P(heartD(10, -54, 10), c) + P(heartD(-34, -50, 7), lt) + P(sparkleD(54, -48, 9), '#ffd36b') +
        P('M96 -58 L128 -96 L104 -52Z', 'url(#g-gold)') + S('M104 -66 L114 -70 M110 -76 L119 -80', '#e0a11e', 2) + P('M82 -66 L88 -84 L94 -64Z', bodyC, `stroke="${dark(bodyC, 0.15)}" stroke-width="2"`);
      front = steer(26, -78);
      seatY = -58;
      return `<g class="mg-kart-body">${back}${look ? driver(look, -20, seatY) : ''}${bodyS}${wheel(-62, 25, c, 'star')}${wheel(64, 25, c, 'star')}${front}</g>`;
    }
    case 'bee': {
      const d = 'M-98 -32 Q-100 -74 -50 -74 L50 -74 Q106 -72 108 -34 Q108 -22 94 -22 L-86 -22 Q-98 -22 -98 -32Z';
      back = E(-60, -100, 30, 18, '#ffffff', 'opacity="0.75" stroke="#bfe3ff" stroke-width="3" transform="rotate(-25 -60 -100)"') + E(-34, -108, 26, 16, '#ffffff', 'opacity="0.75" stroke="#bfe3ff" stroke-width="3" transform="rotate(-10 -34 -108)"');
      bodyS = P(d, c) + [-60, -20, 20, 60].map((x) => R(x, -74, 16, 52, 0, '#4a3f5e', 'opacity="0.85"')).join('') + shade(d) + P('M-80 -62 Q0 -74 90 -60', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.5"');
      front = steer(24, -82) + S('M96 -66 Q102 -90 112 -96 M100 -64 Q112 -84 124 -84', '#4a3f5e', 3) + C(112, -96, 4, '#4a3f5e') + C(124, -84, 4, '#4a3f5e');
      seatY = -62;
      break;
    }
    default: {
      // classic
      const d = 'M-96 -28 Q-100 -58 -74 -60 L-30 -60 Q-20 -60 -14 -54 L40 -54 Q88 -54 104 -36 Q108 -28 98 -24 L-88 -24 Q-96 -24 -96 -28Z';
      back = R(-92, -88, 8, 30, 3, '#4c4459') + R(-116, -98, 50, 13, 6, dk);
      bodyS = P(d, c) + shade(d) + P('M-80 -50 L-30 -52 M10 -46 L84 -44', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.55"') +
        C(34, -38, 13, '#fff') + T(34, -32, '1', 17, dk) + R(98, -38, 14, 12, 5, '#9aa3b5');
      front = steer(22, -66);
      seatY = -50;
    }
  }
  const wk = style === 'candy' ? 'mint' : style === 'flower' ? 'flower' : 'plain';
  const hub = style === 'flower' ? '#fff' : style === 'bee' ? '#4a3f5e' : lt;
  return `<g class="mg-kart-body">${back}${look ? driver(look, -24, seatY) : ''}${bodyS}${wheel(-62, 25, hub, wk)}${wheel(64, 25, hub, wk)}${front}</g>`;
}

/** Big flame icon for the boost button. */
export const flameIcon = `<svg viewBox="0 0 64 64" aria-hidden="true">${P('M32 4 C40 18 52 24 50 40 C48 54 38 60 32 60 C22 60 12 52 14 38 C15 30 20 26 22 18 C26 24 26 30 30 32 C30 22 28 14 32 4Z', '#ff8a3d')}${P('M32 26 C36 34 42 38 41 46 C40 54 36 56 32 56 C27 56 22 52 23 45 C24 40 28 38 29 33 C31 36 31 38 33 39 C33 34 31 30 32 26Z', '#ffd36b')}${P(sparkleD(48, 14, 6), '#fff')}</svg>`;
export const arrowIcon = (up: boolean) => `<svg viewBox="0 0 64 64" aria-hidden="true">${C(32, 32, 28, '#fff')}${S(up ? 'M18 38 L32 22 L46 38' : 'M18 26 L32 42 L46 26', '#9b6bff', 8)}</svg>`;
export const ticketIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-14 32 32)">${P('M6 18 L58 18 L58 27 A5 5 0 0 0 58 37 L58 46 L6 46 L6 37 A5 5 0 0 0 6 27Z', '#ffb347', 'stroke="#e07a1e" stroke-width="2.5"')}${S('M18 21 L18 43', '#fff', 2, 'stroke-dasharray="3 3"')}${P(starD(38, 32, 9), '#fff')}</g></svg>`;
export const handIcon = (left: boolean) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="${left ? '' : 'translate(64 0) scale(-1 1)'}">${P('M14 40 C8 30 20 18 30 22 L46 10 C52 6 58 12 54 18 L44 28 C52 30 56 38 50 46 C44 56 24 58 14 40Z', '#ffd9c4', 'stroke="#e8a88a" stroke-width="2.5"')}${S('M8 50 Q4 44 6 36 M14 56 Q8 54 4 50', '#7cc8ff', 3.5)}</g></svg>`;
export const spinIcon = `<svg viewBox="0 0 64 64" aria-hidden="true">${S('M50 30 A18 18 0 1 1 40 14', '#9b6bff', 7)}${P('M34 6 L48 14 L34 22Z', '#9b6bff')}${P(sparkleD(32, 34, 9), '#ffd36b')}</svg>`;
export const jumpIcon = `<svg viewBox="0 0 64 64" aria-hidden="true">${S('M8 52 Q32 -4 56 52', '#ff7eb6', 6, 'stroke-dasharray="2 9"')}${P(starD(32, 22, 13), 'url(#g-gold)')}${E(32, 56, 18, 4, '#c9cfdd')}</svg>`;

// ---------------- podium ----------------
/** Three dolls on a podium (1st in the middle). `you` is the index of the player in `looks`. */
export function podiumArt(looks: Look[], names: string[], you: number): string {
  const spots = [{ x: 0, h: 200, c: '#ffd36b' }, { x: -290, h: 140, c: '#d9dbe6' }, { x: 290, h: 96, c: '#ffb38a' }];
  let s = E(0, 8, 520, 30, '#3a1d3f', 'opacity="0.12"');
  spots.forEach((p, i) => {
    s += R(p.x - 135, -p.h, 270, p.h, 18, p.c) + R(p.x - 135, -p.h, 270, p.h, 18, 'url(#g-shadeX)') + R(p.x - 135, -p.h, 270, 22, 11, light(p.c, 0.4));
    s += T(p.x, -p.h + 92, String(i + 1), 72, '#fff', dark(p.c, 0.3));
  });
  spots.forEach((p, i) => {
    const lk = looks[i];
    if (!lk) return;
    const sc = 0.72;
    s += G(`translate(${p.x} ${-p.h}) scale(${sc})`, `<g class="${i === 0 ? 'mg-cheer' : 'mg-sway'}">${renderDoll(lk, { pose: i === 0 ? 'held' : 'wave', expr: 'happy' })}</g>`);
    s += T(p.x, 54, escText(names[i] ?? ''), 38, i === you ? '#e0457b' : '#8a6488', '#fff');
  });
  s += G(`translate(0 ${f(-200 - (looks[0] ? dollTop(looks[0]) : 300) * 0.72 - 120)}) scale(0.8)`, P('M-56 -50 L56 -50 L46 10 Q40 40 0 44 Q-40 40 -46 10Z', 'url(#g-gold)') + R(-14, 40, 28, 30, 4, '#e0a11e') + R(-40, 66, 80, 18, 6, '#c98a00') + S('M-54 -40 Q-90 -36 -80 -6 Q-72 12 -46 8 M54 -40 Q90 -36 80 -6 Q72 12 46 8', '#e0a11e', 8) + P(starD(0, -6, 18), '#fff', 'opacity="0.85"'));
  return s;
}
const dollTop = (look: Look) => {
  const b = body(look.age, !!look.boy);
  return -(b.headY - b.R * 1.1);
};

// ---------------- town street (kart race) ----------------
const PASTEL = ['#ffd1e3', '#d9c8ff', '#c8ecff', '#cdf5e4', '#fff1c2', '#ffd9c2', '#f6d6ff'];
/** A row of pastel shops and houses `w` long standing on y = 0. */
export function townStrip(w: number, seed: number): string {
  const r = rng(seed);
  let s = '';
  let x = 0;
  let i = 0;
  while (x < w) {
    const bw = 170 + Math.floor(r() * 150);
    const bh = 220 + Math.floor(r() * 300);
    const col = PASTEL[(i + seed) % PASTEL.length];
    const trim = dark(col, 0.18);
    if (x + bw > w) break;
    s += R(x, -bh, bw, bh, 8, col) + R(x, -bh, bw, bh, 8, 'url(#g-shadeX)', 'opacity="0.5"');
    const roof = Math.floor(r() * 3);
    if (roof === 0) s += P(`M${x - 10} ${-bh + 4} L${x + bw / 2} ${-bh - 70} L${x + bw + 10} ${-bh + 4}Z`, ['#ff7eb6', '#9b6bff', '#7cc8ff', '#ff9a5c'][i % 4]);
    else if (roof === 1) s += R(x - 8, -bh - 14, bw + 16, 22, 8, trim);
    else s += P(`M${x} ${-bh} Q${x + bw / 2} ${-bh - 60} ${x + bw} ${-bh}Z`, trim);
    // windows
    const cols = Math.max(2, Math.floor((bw - 30) / 56));
    const rows = Math.max(1, Math.floor((bh - 120) / 78));
    const gx = (bw - cols * 38) / (cols + 1);
    for (let yy = 0; yy < rows; yy++) {
      for (let xx = 0; xx < cols; xx++) {
        const wx = x + gx + xx * (38 + gx);
        const wy = -bh + 34 + yy * 78;
        s += R(wx, wy, 38, 46, 10, '#fff') + R(wx + 4, wy + 4, 30, 38, 8, '#bfe6ff') + R(wx + 6, wy + 6, 8, 20, 4, '#fff', 'opacity="0.7"');
      }
    }
    // shop front with awning
    const ac = ['#ff7eb6', '#5fd3b5', '#9b6bff', '#ffb347'][(i + 1) % 4];
    s += R(x + 18, -96, bw - 36, 70, 6, '#fff7fb') + R(x + bw / 2 - 18, -80, 36, 80, 8, trim);
    for (let k = 0; k < Math.floor((bw - 20) / 26); k++) s += P(`M${x + 10 + k * 26} -112 L${x + 36 + k * 26} -112 L${x + 36 + k * 26} -92 Q${x + 23 + k * 26} -80 ${x + 10 + k * 26} -92Z`, k % 2 ? '#fff' : ac);
    if (r() < 0.5) s += P(heartD(x + bw / 2, -bh + 6 - (roof === 0 ? 30 : 0), 12), '#fff', 'opacity="0.9"');
    x += bw;
    // a tree or a lamp between buildings
    const gap = 40 + Math.floor(r() * 50);
    if (r() < 0.6) s += R(x + gap / 2 - 5, -90, 10, 90, 4, '#a86b4a') + C(x + gap / 2, -110, 34, '#7fd67a') + C(x + gap / 2 - 16, -96, 22, '#6cc46c') + C(x + gap / 2 + 12, -126, 18, '#9be38f');
    else s += R(x + gap / 2 - 3, -150, 6, 150, 3, '#8f86a8') + C(x + gap / 2, -156, 12, '#fff3b0') + C(x + gap / 2, -156, 18, '#fff3b0', 'opacity="0.35"');
    x += gap;
    i++;
  }
  return s;
}

/** Rolling hills and puffy clouds `w` long, base on y = 0. */
export function hillStrip(w: number): string {
  let d = 'M0 0';
  for (let x = 0; x < w; x += 400) d += ` Q${x + 200} ${-140 - ((x / 400) % 3) * 40} ${x + 400} 0`;
  let s = P(d + 'Z', '#bfe8c4');
  d = 'M0 0';
  for (let x = -150; x < w; x += 500) d += ` Q${x + 250} ${-90 - ((x / 500 + 1) % 2) * 30} ${x + 500} 0`;
  s += P(d + `L${w} 0Z`, '#a5dcae');
  for (let x = 120; x < w; x += 520) s += cloudG(x, -330 - ((x / 520) % 3) * 70, 0.8 + ((x / 520) % 2) * 0.3);
  return s;
}
export const cloudG = (x: number, y: number, s: number) => G(`translate(${f(x)} ${f(y)}) scale(${f(s)})`, C(-40, 0, 32, '#fff') + C(0, -20, 42, '#fff') + C(42, -2, 30, '#fff') + R(-72, -4, 144, 34, 17, '#fff'));

export function cone(): string {
  return E(0, 0, 30, 9, '#3a1d3f', 'opacity="0.18"') + R(-28, -10, 56, 12, 4, '#ff8a3d') + P('M-20 -8 L-6 -62 L6 -62 L20 -8Z', '#ff8a3d') + P('M-15 -26 L15 -26 L12 -38 L-12 -38Z', '#fff') + E(0, -62, 6, 3, '#ff9f5c');
}
export function puddle(): string {
  return E(0, -4, 62, 18, '#7cc8ff', 'opacity="0.85"') + E(-12, -8, 40, 10, '#bfe6ff') + E(-22, -10, 12, 4, '#fff', 'opacity="0.9"') + C(30, -12, 4, '#fff', 'opacity="0.8"');
}
export function coinG(r = 22): string {
  return C(0, 0, r, 'url(#g-gold)') + C(0, 0, r * 0.72, '#ffe27a') + P(starD(0, 0, r * 0.42), '#ffc21e');
}
export function starG(r = 30): string {
  return P(starD(0, 0, r, 0.48), 'url(#g-gold)', 'stroke="#fff" stroke-width="4"') + P(sparkleD(r * 0.8, -r * 0.8, r * 0.3), '#fff');
}

/** Checkered strip across the road between y0 and y1. */
export function checkers(y0: number, y1: number, w = 60): string {
  let s = '';
  const n = Math.ceil((y1 - y0) / 30);
  for (let i = 0; i < n; i++) for (let j = 0; j < w / 30; j++) s += R(j * 30, y0 + i * 30, 30, 30, 0, (i + j) % 2 ? '#2d2a3a' : '#fff');
  return s;
}
/** A banner on two poles standing on y = 0 (far side of the road). */
export function gantry(text: string, col: string): string {
  return R(-150, -330, 12, 330, 5, '#8f86a8') + R(140, -330, 12, 330, 5, '#8f86a8') + R(-170, -340, 340, 96, 22, col, 'stroke="#fff" stroke-width="7"') +
    T(0, -276, text, 50, '#fff', dark(col, 0.3)) + P('M-144 -330 L-144 -390 L-104 -376 L-144 -362Z', '#ff7eb6') + P('M146 -330 L146 -390 L186 -376 L146 -362Z', '#9b6bff');
}

// ---------------- hotel pool ----------------
export function loungerG(towel: string): string {
  return R(-80, -30, 160, 14, 6, '#fff') + R(-80, -30, 160, 14, 6, 'url(#g-shadeY)', 'opacity="0.4"') + P('M50 -28 L96 -76 L104 -70 L62 -24Z', '#fff') + S('M-70 -16 L-74 0 M70 -16 L74 0', '#c9cfdd', 6) +
    R(-60, -38, 110, 10, 5, towel) + R(-60, -38, 110, 10, 5, 'url(#g-shadeY)', 'opacity="0.3"');
}
export function umbrellaG(c1: string, c2: string): string {
  let s = R(-4, -190, 8, 190, 3, '#fff') + E(0, 0, 50, 10, '#3a1d3f', 'opacity="0.12"');
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI + (i * Math.PI) / 6;
    const a1 = Math.PI + ((i + 1) * Math.PI) / 6;
    s += P(`M0 -200 L${f(Math.cos(a0) * 130)} ${f(-170 + Math.sin(a0) * 10)} Q${f(Math.cos((a0 + a1) / 2) * 120)} ${f(-150)} ${f(Math.cos(a1) * 130)} ${f(-170 + Math.sin(a1) * 10)}Z`, i % 2 ? c1 : c2);
  }
  return s + C(0, -204, 7, c1);
}
export function palmG(): string {
  let s = R(-34, -50, 68, 50, 10, '#ff9ec7') + R(-34, -50, 68, 12, 6, '#ff7eb6') + P('M-6 -50 Q-10 -150 6 -230 L14 -228 Q2 -150 8 -50Z', '#c9905e');
  for (const a of [-160, -120, -60, -20, -95]) s += E(0, 0, 80, 18, '#5fc46a', `transform="translate(10 -230) rotate(${a}) translate(70 0)"`);
  return s + C(4, -226, 9, '#a86b4a') + C(16, -222, 9, '#a86b4a');
}
export function hotelFacade(w: number, top: number): string {
  // a tall pink hotel with balconies across the back of the pool deck (base at y = 0)
  let s = R(0, top, w, -top, 0, '#ffd9e8') + R(0, top, w, -top, 0, 'url(#g-shadeX)', 'opacity="0.35"');
  for (let y = top + 40; y < -120; y += 130) {
    for (let x = 40; x < w - 120; x += 170) {
      s += R(x, y, 110, 80, 14, '#fff') + R(x + 8, y + 8, 94, 64, 10, '#bfe6ff') + R(x + 14, y + 12, 16, 40, 6, '#fff', 'opacity="0.65"');
      s += R(x - 10, y + 70, 130, 14, 7, '#ff7eb6') + S(`M${x} ${y + 84} L${x} ${y + 100} M${x + 110} ${y + 84} L${x + 110} ${y + 100}`, '#ff7eb6', 4);
    }
  }
  s += R(w / 2 - 230, -150, 460, 70, 35, '#ff7eb6', 'stroke="#fff" stroke-width="6"') + T(w / 2, -100, 'HOTEL POOL', 44, '#fff');
  return s;
}

// ---------------- frozen pond ----------------
export function snowPine(s: number): string {
  return G(`scale(${f(s)})`, R(-10, -30, 20, 30, 4, '#7a5a4a') + P('M-90 -30 L0 -150 L90 -30Z', '#2f6b5a') + P('M-70 -110 L0 -220 L70 -110Z', '#357a66') + P('M-50 -180 L0 -280 L50 -180Z', '#3d8a72') +
    P('M-90 -30 Q-45 -48 0 -36 Q45 -48 90 -30 L70 -48 Q30 -60 0 -52 Q-30 -60 -70 -48Z', '#fff') + P('M-70 -110 Q-30 -126 0 -116 Q30 -126 70 -110 L50 -128 Q20 -138 0 -132 Q-20 -138 -50 -128Z', '#fff') + P('M-50 -180 L0 -280 L18 -244 Q0 -236 -16 -246Z', '#fff', 'opacity="0.9"'));
}
export function snowflakeG(r: number, col = '#fff'): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    s += S(`M0 0 L${f(x)} ${f(y)} M${f(x * 0.6)} ${f(y * 0.6)} L${f(x * 0.6 + Math.cos(a + 0.8) * r * 0.3)} ${f(y * 0.6 + Math.sin(a + 0.8) * r * 0.3)} M${f(x * 0.6)} ${f(y * 0.6)} L${f(x * 0.6 + Math.cos(a - 0.8) * r * 0.3)} ${f(y * 0.6 + Math.sin(a - 0.8) * r * 0.3)}`, col, r * 0.16);
  }
  return s + C(0, 0, r * 0.18, col);
}
/** Ice skates drawn over the doll's feet (feet at y = 0). */
export function skatesG(legX: number, boot: string): string {
  let s = '';
  for (const sd of [-1, 1]) {
    const x = sd * legX;
    s += R(x - 15, -26, 30, 30, 10, boot) + R(x - 15, -26, 30, 30, 10, 'url(#g-shadeX)', 'opacity="0.5"') + S(`M${x - 6} -18 L${x + 6} -14 M${x - 6} -10 L${x + 6} -6`, dark(boot, 0.25), 2.5) +
      S(`M${x - 18} 10 L${x + 16} 10 Q${x + 24} 10 ${x + 22} 2`, '#c9cfdd', 4) + S(`M${x - 8} 4 L${x - 8} 10 M${x + 8} 4 L${x + 8} 10`, '#9aa3b5', 3);
  }
  return s;
}

// ---------------- carnival booths ----------------
/** Striped booth canopy `w` wide with scalloped edge, top at y = 0. */
export function canopy(w: number, c1: string, c2: string): string {
  let s = R(0, 0, w, 120, 0, c1);
  const n = Math.round(w / 90);
  const sw = w / n;
  for (let i = 0; i < n; i += 2) s += R(i * sw, 0, sw, 120, 0, c2);
  for (let i = 0; i < n; i++) s += P(`M${f(i * sw)} 118 Q${f(i * sw + sw / 2)} 170 ${f((i + 1) * sw)} 118Z`, i % 2 ? c1 : c2);
  for (let i = 0; i <= n; i++) s += C(i * sw, 120, 9, '#ffd36b') + C(i * sw, 120, 16, '#fff3b0', 'opacity="0.35"');
  return s;
}
/** A glass bottle standing on y = 0, neck top at y = -150. */
export function bottleG(col: string, golden = false): string {
  const fill = golden ? 'url(#g-gold)' : col;
  const d = 'M-28 -8 Q-32 -70 -14 -92 L-9 -110 L-9 -146 L9 -146 L9 -110 L14 -92 Q32 -70 28 -8 Q28 0 18 0 L-18 0 Q-28 0 -28 -8Z';
  let s = E(0, 0, 32, 8, '#3a1d3f', 'opacity="0.2"') + P(d, fill, `opacity="${golden ? 1 : 0.88}" stroke="${dark(golden ? '#ffd24a' : col, 0.25)}" stroke-width="2.5"`);
  s += R(-11, -152, 22, 10, 4, golden ? '#e0a11e' : light(col, 0.4), `stroke="${dark(golden ? '#ffd24a' : col, 0.25)}" stroke-width="2"`);
  s += S('M-17 -16 Q-22 -60 -8 -86', '#fff', 6, 'opacity="0.6"') + S('M-4 -104 L-4 -138', '#fff', 3.5, 'opacity="0.55"');
  s += R(-26, -60, 52, 26, 6, '#fff', 'opacity="0.9"') + (golden ? P(starD(0, -47, 11), '#ffc21e') : P(heartD(0, -56, 9), col));
  return s;
}
export const RING_COLS = ['#ff4f8b', '#9b6bff', '#2fb3ff', '#2fc79a', '#ffb000', '#ff7a3d'];
/** One half of a ring lying flat (rx by ry): the back arc or the front arc. */
export function ringHalf(rx: number, ry: number, col: string, half: 'back' | 'front', w = 9): string {
  const sweep = half === 'back' ? 1 : 0;
  return `<path d="M${f(-rx)} 0 A${f(rx)} ${f(ry)} 0 0 ${sweep} ${f(rx)} 0" fill="none" stroke="${dark(col, 0.2)}" stroke-width="${f(w + 3)}" stroke-linecap="round"/><path d="M${f(-rx)} 0 A${f(rx)} ${f(ry)} 0 0 ${sweep} ${f(rx)} 0" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
}
export function ringG(rx: number, ry: number, col: string, w = 9): string {
  return E(0, 0, rx, ry, 'none', `stroke="${dark(col, 0.2)}" stroke-width="${f(w + 3)}"`) + E(0, 0, rx, ry, 'none', `stroke="${col}" stroke-width="${f(w)}"`) + E(0, -ry * 0.15, rx * 0.8, ry * 0.75, 'none', `stroke="#fff" stroke-width="${f(w * 0.25)}" opacity="0.5" stroke-dasharray="${f(rx * 0.8)} ${f(rx * 3)}"`);
}
export const BALLOON_COLS = ['#ff7eb6', '#9b6bff', '#7cc8ff', '#5fd3b5', '#ffb347', '#ff5c7a', '#c99bff'];
/** A balloon centred on (0, 0), about 100 tall, with its string hanging below. */
export function balloonG(col: string, golden = false): string {
  const fill = golden ? 'url(#g-gold)' : col;
  let s = S('M0 52 Q-10 74 0 96 Q10 118 -2 140', '#9aa3b5', 2.5, 'class="mg-string"');
  s += P('M0 -54 C34 -54 46 -26 44 -2 C42 26 20 48 0 50 C-20 48 -42 26 -44 -2 C-46 -26 -34 -54 0 -54Z', fill, `stroke="${dark(golden ? '#ffd24a' : col, 0.2)}" stroke-width="2"`);
  s += P('M-7 48 L7 48 L4 56 L-4 56Z', golden ? '#e0a11e' : dark(col, 0.15));
  s += E(-18, -26, 9, 15, '#fff', 'opacity="0.55" transform="rotate(25 -18 -26)"') + C(-8, -42, 4, '#fff', 'opacity="0.7"');
  if (golden) s += P(starD(4, 2, 20), '#fff', 'opacity="0.9"') + P(sparkleD(34, -44, 12), '#fff');
  return s;
}
export const dartG = () => R(-3, -16, 6, 46, 3, '#8f86a8') + P('M-4 -16 L0 -40 L4 -16Z', '#c9cfdd') + P('M0 22 L-14 44 L0 36 L14 44Z', '#ff7eb6') + P('M0 22 L0 44', 'none', 'stroke="#e0457b" stroke-width="2"');

// ---------------- prizes ----------------
export const PRIZES = ['parkBalloon', 'prizeBunny', 'prizeBear', 'prizeUnicorn'] as const;
export type PrizeId = (typeof PRIZES)[number];
export const PRIZE_NAME: Record<PrizeId, string> = { parkBalloon: 'Balloon', prizeBunny: 'Plush Bunny', prizeBear: 'Teddy Bear', prizeUnicorn: 'Unicorn Plush' };
const eyesHappy = (y: number, dx: number) => S(`M${-dx - 7} ${y} Q${-dx} ${y - 8} ${-dx + 7} ${y} M${dx - 7} ${y} Q${dx} ${y - 8} ${dx + 7} ${y}`, '#4a3f5e', 3.5);
const dotEyes = (y: number, dx: number) => C(-dx, y, 5.5, '#4a3f5e') + C(dx, y, 5.5, '#4a3f5e') + C(-dx + 2, y - 2, 1.8, '#fff') + C(dx + 2, y - 2, 1.8, '#fff');
/** Prize preview standing on y = 0, about 160 tall. */
export function prizeArt(id: string): string {
  const shadow = E(0, 0, 54, 10, '#3a1d3f', 'opacity="0.15"');
  if (id === 'prizeBunny') {
    const fur = '#fff6fa';
    const ln = 'stroke="#f0cfe0" stroke-width="3"';
    return shadow + E(-22, -150, 15, 44, fur, `${ln} transform="rotate(-12 -22 -150)"`) + E(-22, -146, 7, 32, '#ffb8d4', 'transform="rotate(-12 -22 -146)"') +
      E(22, -150, 15, 44, fur, `${ln} transform="rotate(12 22 -150)"`) + E(22, -146, 7, 32, '#ffb8d4', 'transform="rotate(12 22 -146)"') +
      E(0, -36, 44, 38, fur, ln) + E(0, -30, 24, 22, '#ffe6f0') + E(-34, -8, 16, 11, fur, ln) + E(34, -8, 16, 11, fur, ln) +
      C(0, -92, 44, fur, ln) + dotEyes(-96, 16) + E(0, -84, 5, 4, '#ff7eb6') + S('M-6 -76 Q0 -72 6 -76', '#4a3f5e', 2.5) + E(-26, -80, 9, 5, '#ffb8d4', 'opacity="0.8"') + E(26, -80, 9, 5, '#ffb8d4', 'opacity="0.8"') +
      P('M0 -56 L-22 -66 L-22 -46Z M0 -56 L22 -66 L22 -46Z', '#9b6bff') + C(0, -56, 6, '#b583ff');
  }
  if (id === 'prizeBear') {
    const fur = '#d39a68';
    const ln = `stroke="${dark(fur, 0.2)}" stroke-width="3"`;
    return shadow + C(-34, -126, 17, fur, ln) + C(-34, -126, 9, '#f2c9a2') + C(34, -126, 17, fur, ln) + C(34, -126, 9, '#f2c9a2') +
      E(0, -38, 46, 40, fur, ln) + E(0, -32, 26, 24, '#f2c9a2') + P(heartD(0, -44, 12), '#ff7eb6') + E(-36, -8, 17, 12, fur, ln) + E(36, -8, 17, 12, fur, ln) + E(-48, -50, 12, 20, fur, `${ln} transform="rotate(30 -48 -50)"`) + E(48, -50, 12, 20, fur, `${ln} transform="rotate(-30 48 -50)"`) +
      C(0, -96, 44, fur, ln) + E(0, -82, 20, 15, '#f2c9a2') + dotEyes(-102, 17) + E(0, -88, 7, 5, '#4a3f5e') + S('M-7 -78 Q0 -73 7 -78', '#4a3f5e', 2.5) +
      P('M0 -58 L-20 -68 L-20 -48Z M0 -58 L20 -68 L20 -48Z', '#ff4f8b');
  }
  if (id === 'prizeUnicorn') {
    const fur = '#ffffff';
    const ln = 'stroke="#e6dcf2" stroke-width="3"';
    const mane = ['#ff9ec7', '#ffd36b', '#9be38f', '#7cc8ff', '#c99bff'];
    let s = shadow + E(0, -38, 46, 38, fur, ln) + E(-36, -8, 16, 11, fur, ln) + E(36, -8, 16, 11, fur, ln) + P('M44 -40 Q76 -36 70 -6 Q64 -24 46 -24Z', '#c99bff');
    s += C(0, -94, 44, fur, ln);
    mane.forEach((c, i) => (s += S(`M${-6 + i * 4} -136 Q${-44 - i * 4} ${-128 + i * 6} ${-40 - i * 2} ${-84 + i * 8}`, c, 11)));
    s += P('M-10 -132 L0 -186 L10 -132Z', 'url(#g-gold)') + S('M-6 -146 L6 -150 M-4 -160 L5 -163', '#e0a11e', 2.5);
    s += P('M18 -128 L30 -152 L36 -122Z', fur, ln) + eyesHappy(-96, 16) + E(-26, -80, 9, 5, '#ffb8d4') + E(26, -80, 9, 5, '#ffb8d4') + S('M-6 -78 Q0 -73 6 -78', '#4a3f5e', 2.5) + P(starD(0, -40, 12), '#ffd36b');
    return s;
  }
  // balloon
  return shadow + S('M0 -4 Q-14 -40 0 -76', '#9aa3b5', 2.5) + R(-10, -8, 20, 10, 4, '#c9cfdd') + G('translate(0 -128) scale(1.05)', `<g class="mg-bob">${P('M0 -54 C34 -54 46 -26 44 -2 C42 26 20 48 0 50 C-20 48 -42 26 -44 -2 C-46 -26 -34 -54 0 -54Z', '#ff7eb6', 'stroke="#e0457b" stroke-width="2"')}${P('M-6 48 L6 48 L0 56Z', '#e0457b')}${E(-18, -26, 9, 15, '#fff', 'opacity="0.55" transform="rotate(25 -18 -26)"')}${P(heartD(4, -6, 16), '#fff', 'opacity="0.85"')}</g>`);
}
