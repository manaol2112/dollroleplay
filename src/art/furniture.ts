// Furniture, appliances, playground equipment and small props. Floor items are drawn with their
// base centre at (0, 0); wall items and rugs are centred on (0, 0).
import { dark, light } from './color';
import { cloth } from './defs';
import { bowG, flowerG, heartD, sparkleD, starD } from './wear';

import type { Season } from '../types';

/** Lets a few outdoor items change with the season. */
export const artCtx: { season: Season } = { season: 'spring' };

export type Mount = 'floor' | 'wall' | 'rug' | 'prop';
export type FurnCat = 'bedroom' | 'kitchen' | 'living' | 'decor' | 'wall' | 'toys' | 'food' | 'outdoor' | 'school' | 'stage' | 'salon' | 'shop';

export interface SeatDef {
  x: number;
  y: number;
  pose: 'sit' | 'sleep' | 'slide';
  /** Rocking motion shared by the seat and whoever sits in it. */
  anim?: { pivot: [number, number]; amp: number; dur: number; phase?: number };
  /** For slides: where the rider travels, relative to the item. */
  path?: [number, number][];
}

export interface FurnDef {
  id: string;
  name: string;
  cat: FurnCat;
  price: number;
  mount: Mount;
  w: number;
  h: number;
  color?: string;
  art: (c: string, on: boolean) => string;
  front?: (c: string, on: boolean) => string;
  seats?: SeatDef[];
  surfaces?: { x1: number; x2: number; y: number }[];
  toggle?: boolean;
  /** Tapping drops one of these props nearby. */
  spawn?: string[];
  food?: boolean;
  /** Plays a sound when tapped. */
  sfx?: 'note' | 'boing' | 'squeak' | 'ding' | 'music';
  /** Seats animate only while someone sits there. */
  animWhenUsed?: boolean;
}

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const box = (x: number, y: number, w: number, h: number, r: number, c: string, pat = 'none', shade: 'x' | 'y' = 'x') => {
  const d = roundRectD(x, y, w, h, r);
  return cloth(d, c, pat, shade);
};
export function roundRectD(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)} H${f(x + w - r)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H${f(x + r)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const Ln = (x1: number, y1: number, x2: number, y2: number, c: string, w = 3, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const leg = (x: number, y: number, h: number, c: string, w = 10) => R(x - w / 2, y, w, h, w / 2.5, c);
const glow = (x: number, y: number, r: number) => E(x, y, r, r, 'url(#g-glow)');
const WOOD = '#d9a477';
const WOOD_D = '#b07a4f';
const flicker = (dur = 0.5) => `<animateTransform attributeName="transform" type="scale" values="1 1;1.06 0.92;0.96 1.08;1 1" dur="${dur}s" repeatCount="indefinite" additive="sum"/>`;
const flame = (x: number, y: number, s: number) =>
  `<g transform="translate(${f(x)} ${f(y)})"><g>${flicker(0.4 + Math.abs(x % 3) * 0.1)}${P(`M0 ${-26 * s} C${12 * s} ${-12 * s} ${10 * s} 0 0 0 C${-10 * s} 0 ${-12 * s} ${-12 * s} 0 ${-26 * s}Z`, '#ff8a3d')}${P(`M0 ${-16 * s} C${6 * s} ${-8 * s} ${6 * s} 0 0 0 C${-6 * s} 0 ${-6 * s} ${-8 * s} 0 ${-16 * s}Z`, '#ffd84a')}</g></g>`;

// ---------------- bedroom ----------------
const BEDROOM: FurnDef[] = [
  {
    id: 'bed', name: 'Cozy Bed', cat: 'bedroom', price: 0, mount: 'floor', w: 390, h: 220, color: '#ff9ec7',
    art: (c) => box(-195, -220, 34, 220, 17, c) + P(heartD(-178, -196, 11), light(c, 0.55)) + box(161, -150, 34, 150, 17, c) +
      box(-180, -82, 360, 40, 10, dark(c, 0.12)) + leg(-170, -44, 44, dark(c, 0.3), 14) + leg(170, -44, 44, dark(c, 0.3), 14) +
      box(-166, -124, 334, 50, 18, '#ffffff', 'none', 'y') + E(-112, -128, 46, 24, '#fff') + E(-112, -128, 46, 24, 'url(#g-shadeY)') + P(`M-150 -132 Q-112 -112 -74 -132`, 'none', 'stroke="#eadcef" stroke-width="2"'),
    front: (c) => {
      const b = light(c, 0.35);
      return cloth('M-48 -138 Q60 -146 172 -136 L176 -62 Q64 -52 -52 -64Z', b, 'hearts', 'y') + P('M-48 -138 Q60 -146 172 -136 L172 -118 Q60 -128 -50 -118Z', '#fff', 'opacity="0.85"');
    },
    seats: [{ x: 100, y: -118, pose: 'sleep' }],
  },
  {
    id: 'canopyBed', name: 'Princess Bed', cat: 'bedroom', price: 180, mount: 'floor', w: 410, h: 400, color: '#c99bff',
    art: (c) => {
      let s = R(-200, -400, 14, 400, 7, 'url(#g-gold)') + R(186, -400, 14, 400, 7, 'url(#g-gold)');
      s += cloth('M-210 -404 Q0 -440 210 -404 L210 -370 Q180 -350 150 -370 Q120 -350 90 -370 Q60 -350 30 -370 Q0 -350 -30 -370 Q-60 -350 -90 -370 Q-120 -350 -150 -370 Q-180 -350 -210 -370Z', c, 'none', 'y');
      s += P('M-190 -370 Q-150 -250 -176 -120 L-190 -120Z', light(c, 0.4), 'opacity="0.75"') + P('M190 -370 Q150 -250 176 -120 L190 -120Z', light(c, 0.4), 'opacity="0.75"');
      s += box(-186, -230, 30, 230, 15, '#fff') + P(starD(-171, -205, 10), 'url(#g-gold)') + box(156, -150, 30, 150, 15, '#fff');
      s += box(-176, -84, 352, 42, 10, c) + box(-160, -126, 322, 50, 18, '#fff', 'none', 'y') + E(-108, -130, 46, 24, '#fff') + E(-108, -130, 46, 24, 'url(#g-shadeY)');
      return s + P(starD(0, -415, 14), 'url(#g-gold)');
    },
    front: (c) => cloth('M-44 -140 Q60 -148 166 -138 L170 -62 Q60 -52 -48 -64Z', light(c, 0.5), 'stars', 'y') + P('M-44 -140 Q60 -148 166 -138 L166 -120 Q60 -130 -46 -120Z', '#fff', 'opacity="0.85"'),
    seats: [{ x: 100, y: -120, pose: 'sleep' }],
  },
  {
    id: 'wardrobe', name: 'Wardrobe', cat: 'bedroom', price: 0, mount: 'floor', w: 190, h: 320, color: '#ffffff', toggle: true,
    art: (c, on) => {
      let s = P('M-95 -300 Q0 -340 95 -300 Z', dark(c, 0.08)) + box(-95, -300, 190, 290, 12, c) + leg(-80, -12, 12, dark(c, 0.3)) + leg(80, -12, 12, dark(c, 0.3));
      if (on) {
        s += R(-86, -290, 172, 270, 6, '#5a3a5a') + Ln(-80, -270, 80, -270, '#c9a27e', 5);
        const cols = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#c99bff', '#5fd3b5'];
        cols.forEach((col, i) => (s += P(`M${-68 + i * 32} -266 L${-80 + i * 32} -250 L${-80 + i * 32} -160 L${-56 + i * 32} -160 L${-56 + i * 32} -250Z`, col) + Ln(-68 + i * 32, -272, -68 + i * 32, -264, '#ddd', 2)));
        s += R(-80, -120, 160, 6, 2, '#c9a27e') + E(-46, -128, 18, 10, '#ff4f8b') + E(0, -128, 18, 10, '#9b6bff') + E(46, -128, 18, 10, '#5fd3b5');
        s += box(-150, -296, 58, 280, 8, c) + box(92, -296, 58, 280, 8, c);
      } else {
        s += Ln(0, -292, 0, -20, dark(c, 0.15), 2) + box(-84, -284, 76, 250, 6, light(c, 0.2)) + box(8, -284, 76, 250, 6, light(c, 0.2));
        s += C(-14, -160, 6, '#ffd24a') + C(14, -160, 6, '#ffd24a') + P(heartD(-46, -250, 12), '#ff9ec7') + P(heartD(46, -250, 12), '#ff9ec7');
      }
      return s;
    },
  },
  {
    id: 'dresser', name: 'Mirror Dresser', cat: 'bedroom', price: 60, mount: 'floor', w: 220, h: 290, color: '#ffd9e8',
    art: (c) => E(0, -205, 70, 82, 'url(#g-gold)') + E(0, -205, 60, 72, '#cfe9ff') + E(0, -205, 60, 72, 'url(#g-glass)') + box(-110, -130, 220, 120, 10, c) +
      R(-118, -136, 236, 14, 7, dark(c, 0.1)) + box(-96, -110, 92, 40, 6, light(c, 0.25)) + box(4, -110, 92, 40, 6, light(c, 0.25)) + box(-96, -62, 192, 40, 6, light(c, 0.25)) +
      C(-50, -90, 5, '#ffd24a') + C(50, -90, 5, '#ffd24a') + C(0, -42, 5, '#ffd24a') + leg(-96, -12, 12, dark(c, 0.3)) + leg(96, -12, 12, dark(c, 0.3)),
    surfaces: [{ x1: -110, x2: 110, y: -136 }],
  },
  {
    id: 'desk', name: 'Study Desk', cat: 'bedroom', price: 0, mount: 'floor', w: 240, h: 140, color: '#7cc8ff',
    art: (c) => box(-120, -140, 240, 22, 8, c) + box(40, -120, 70, 120, 6, dark(c, 0.06)) + R(50, -106, 50, 30, 4, light(c, 0.3)) + R(50, -66, 50, 30, 4, light(c, 0.3)) +
      C(75, -91, 4, '#fff') + C(75, -51, 4, '#fff') + leg(-108, -120, 120, dark(c, 0.15), 12),
    surfaces: [{ x1: -120, x2: 120, y: -140 }],
  },
  {
    id: 'chair', name: 'Chair', cat: 'bedroom', price: 0, mount: 'floor', w: 110, h: 190, color: '#ff7eb6',
    art: (c) => box(-46, -190, 92, 104, 26, c) + P(heartD(0, -166, 16), light(c, 0.4)) + leg(-36, -80, 80, dark(c, 0.2)) + leg(36, -80, 80, dark(c, 0.2)) + box(-54, -88, 108, 22, 10, dark(c, 0.06), 'none', 'y'),
    seats: [{ x: 0, y: -80, pose: 'sit' }],
  },
  {
    id: 'nightstand', name: 'Night Lamp', cat: 'bedroom', price: 0, mount: 'floor', w: 110, h: 210, color: '#c99bff', toggle: true,
    art: (c, on) => box(-50, -100, 100, 92, 10, c) + R(-40, -80, 80, 30, 6, light(c, 0.25)) + C(0, -65, 5, '#ffd24a') + leg(-40, -12, 12, dark(c, 0.3)) + leg(40, -12, 12, dark(c, 0.3)) +
      R(-6, -160, 12, 60, 5, '#f4ead9') + E(0, -100, 24, 6, dark(c, 0.2)) + (on ? glow(0, -175, 110) : '') +
      P('M-34 -150 L34 -150 L22 -205 L-22 -205Z', on ? '#fff6c8' : '#ffe3ef') + P('M-34 -150 L34 -150 L22 -205 L-22 -205Z', 'url(#g-shadeX)'),
  },
  {
    id: 'floorLamp', name: 'Floor Lamp', cat: 'living', price: 30, mount: 'floor', w: 120, h: 330, color: '#ffd36b', toggle: true,
    art: (c, on) => E(0, -6, 44, 10, dark(c, 0.3)) + R(-5, -260, 10, 256, 5, dark(c, 0.3)) + (on ? glow(0, -270, 150) : '') +
      P('M-56 -240 L56 -240 L36 -320 L-36 -320Z', on ? '#fff6c8' : c) + P('M-56 -240 L56 -240 L36 -320 L-36 -320Z', 'url(#g-shadeX)') + R(-56, -246, 112, 8, 4, dark(c, 0.15)),
  },
  {
    id: 'bookshelf', name: 'Bookshelf', cat: 'bedroom', price: 40, mount: 'floor', w: 200, h: 280, color: '#d9a477',
    art: (c) => {
      let s = box(-100, -280, 200, 272, 8, c) + R(-88, -268, 176, 248, 4, dark(c, 0.25));
      const cols = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b', '#e85d5d'];
      for (let row = 0; row < 3; row++) {
        const y = -268 + row * 84;
        s += R(-88, y + 76, 176, 8, 2, c);
        let x = -84;
        for (let i = 0; x < 70; i++) {
          const w = 14 + ((i * 7 + row * 5) % 12);
          const h = 50 + ((i * 13 + row * 3) % 22);
          s += R(x, y + 76 - h, w, h, 2, cols[(i + row * 2) % cols.length]) + R(x + 2, y + 82 - h, w - 4, 3, 1, '#fff', 'opacity="0.5"');
          x += w + 2;
        }
      }
      return s;
    },
    surfaces: [{ x1: -100, x2: 100, y: -280 }],
  },
  {
    id: 'toychest', name: 'Toy Chest', cat: 'bedroom', price: 35, mount: 'floor', w: 170, h: 110, color: '#5fd3b5', spawn: ['ball', 'teddyToy', 'blocks', 'duck'],
    art: (c) => box(-85, -100, 170, 92, 12, c) + box(-90, -112, 180, 24, 10, dark(c, 0.1)) + P(starD(0, -56, 22), '#fff', 'opacity="0.85"') + leg(-70, -12, 12, dark(c, 0.3)) + leg(70, -12, 12, dark(c, 0.3)),
    surfaces: [{ x1: -85, x2: 85, y: -112 }],
  },
  {
    id: 'beanbag', name: 'Bean Bag', cat: 'bedroom', price: 30, mount: 'floor', w: 170, h: 120, color: '#ffb35e',
    art: (c) => cloth('M-84 -6 C-96 -70 -60 -118 -10 -116 C50 -114 96 -76 84 -6 Q0 6 -84 -6Z', c, 'dots', 'x') + P('M-50 -70 Q-20 -90 20 -84', 'none', `stroke="${light(c, 0.4)}" stroke-width="6" stroke-linecap="round" opacity="0.6"`),
    seats: [{ x: 0, y: -50, pose: 'sit' }],
  },
  {
    id: 'vanity', name: 'Vanity Table', cat: 'bedroom', price: 90, mount: 'floor', w: 230, h: 300, color: '#ffffff',
    art: (c) => {
      let s = P('M-80 -150 L-80 -230 A80 80 0 0 1 80 -230 L80 -150Z', 'url(#g-gold)') + P('M-68 -150 L-68 -226 A68 68 0 0 1 68 -226 L68 -150Z', '#d9efff') + P('M-68 -150 L-68 -226 A68 68 0 0 1 68 -226 L68 -150Z', 'url(#g-glass)');
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        s += C(Math.cos(a) * 88, -226 + Math.sin(a) * 88, 7, '#fff6c8', 'stroke="#ffd24a" stroke-width="2"');
      }
      s += box(-115, -150, 230, 20, 8, c) + cloth('M-108 -132 L108 -132 L100 -40 Q0 -20 -100 -40Z', '#ffc7dc', 'none', 'y');
      for (let i = -3; i <= 3; i++) s += P(`M${i * 30} -132 Q${i * 30 + 15} -100 ${i * 30} -40`, 'none', 'stroke="#ff9ec7" stroke-width="2" opacity="0.7"');
      return s + leg(-96, -40, 40, '#ffd24a', 10) + leg(96, -40, 40, '#ffd24a', 10) + `<g transform="translate(0 -134) scale(0.7)">${bowG(0, 0, 1, '#ff7eb6')}</g>`;
    },
    surfaces: [{ x1: -115, x2: 115, y: -150 }],
  },
];

// ---------------- kitchen ----------------
const KITCHEN: FurnDef[] = [
  {
    id: 'fridge', name: 'Fridge', cat: 'kitchen', price: 0, mount: 'floor', w: 170, h: 330, color: '#bfe8ff', toggle: true,
    spawn: ['apple', 'milk', 'cake', 'strawberry', 'juice', 'pizza', 'banana', 'cheese'],
    art: (c, on) => {
      let s = box(-85, -330, 170, 322, 22, c) + leg(-66, -12, 12, '#9aa3b5') + leg(66, -12, 12, '#9aa3b5');
      if (on) {
        s += R(-75, -320, 150, 300, 12, '#f6fbff') + glow(0, -250, 90);
        for (const y of [-246, -170, -96]) s += R(-75, y, 150, 6, 2, '#d7e7f2');
        s += C(-40, -264, 16, '#e8384f') + R(10, -296, 26, 50, 6, '#fff', 'stroke="#d7e7f2" stroke-width="2"') + R(10, -296, 26, 14, 4, '#7cc8ff');
        s += P('M-58 -176 L-12 -176 L-35 -214Z', '#ffe06b') + C(30, -192, 20, '#ff9ec7') + C(30, -200, 8, '#e8384f');
        s += E(-30, -108, 30, 12, '#5fae6b') + E(36, -112, 22, 16, '#ffab5e');
        s += box(-150, -326, 66, 316, 18, c) + R(-142, -260, 8, 60, 4, '#fff');
      } else {
        s += Ln(-78, -210, 78, -210, dark(c, 0.15), 3) + R(56, -300, 10, 60, 5, '#fff') + R(56, -190, 10, 60, 5, '#fff');
        s += P(heartD(-30, -290, 14), '#ff7eb6') + P(starD(0, -258, 12), '#ffd36b') + C(-40, -150, 12, '#5fd3b5') + R(-12, -165, 40, 28, 4, '#fff', 'transform="rotate(-6 8 -151)"');
      }
      return s;
    },
  },
  {
    id: 'stove', name: 'Stove & Oven', cat: 'kitchen', price: 0, mount: 'floor', w: 180, h: 180, color: '#ffffff', toggle: true, spawn: ['cupcake', 'cookie', 'pizza'],
    art: (c, on) => {
      let s = box(-90, -180, 180, 172, 12, c) + R(-90, -180, 180, 20, 8, '#4a4a5e') + leg(-74, -12, 12, '#4a4a5e') + leg(74, -12, 12, '#4a4a5e');
      for (const x of [-48, 48]) s += E(x, -180, 30, 7, '#2d2a3a') + (on ? flame(x - 12, -180, 0.6) + flame(x + 12, -180, 0.6) + flame(x, -182, 0.8) : '');
      s += R(-74, -150, 148, 106, 12, on ? '#ffb35e' : '#3a3346') + R(-64, -140, 128, 86, 8, 'url(#g-glass)') + (on ? glow(0, -97, 70) : '');
      s += R(-60, -36, 120, 8, 4, '#c9cfdd');
      for (let i = 0; i < 4; i++) s += C(-54 + i * 36, -170, 5, on && i < 2 ? '#ff7a3d' : '#c9cfdd');
      return s;
    },
    surfaces: [{ x1: -90, x2: 90, y: -186 }],
  },
  {
    id: 'sink', name: 'Sink Counter', cat: 'kitchen', price: 0, mount: 'floor', w: 230, h: 260, color: '#ffd9e8', toggle: true,
    art: (c, on) => {
      let s = box(-115, -170, 230, 162, 10, c) + R(-122, -180, 244, 16, 6, '#f6f1fa') + R(-100, -150, 96, 120, 8, light(c, 0.3)) + R(4, -150, 96, 120, 8, light(c, 0.3)) +
        C(-14, -90, 5, '#ffd24a') + C(18, -90, 5, '#ffd24a') + leg(-100, -12, 12, dark(c, 0.3)) + leg(100, -12, 12, dark(c, 0.3));
      s += E(-30, -180, 54, 8, '#c9cfdd') + P('M-34 -180 L-34 -250 Q-34 -262 -20 -262 L10 -262 Q22 -262 22 -248 L22 -238', 'none', 'stroke="url(#g-silver)" stroke-width="10" stroke-linecap="round"');
      if (on) s += `<rect x="16" y="-236" width="12" height="56" rx="5" fill="#9fe0ff" opacity="0.8"><animate attributeName="opacity" values="0.6;0.95;0.6" dur="0.4s" repeatCount="indefinite"/></rect>` + E(22, -182, 22, 5, '#9fe0ff');
      s += C(-60, -248, 7, '#e8384f') + C(-6, -248, 7, '#7cc8ff');
      return s;
    },
    surfaces: [{ x1: 40, x2: 122, y: -180 }],
  },
  {
    id: 'counter', name: 'Counter', cat: 'kitchen', price: 20, mount: 'floor', w: 180, h: 180, color: '#a8e6cf',
    art: (c) => box(-90, -170, 180, 162, 10, c) + R(-96, -180, 192, 16, 6, '#f6f1fa') + R(-76, -150, 152, 50, 6, light(c, 0.3)) + R(-76, -90, 152, 60, 6, light(c, 0.3)) +
      R(-20, -128, 40, 6, 3, '#fff') + R(-20, -64, 40, 6, 3, '#fff') + leg(-74, -12, 12, dark(c, 0.3)) + leg(74, -12, 12, dark(c, 0.3)),
    surfaces: [{ x1: -96, x2: 96, y: -180 }],
  },
  {
    id: 'diningTable', name: 'Dining Table', cat: 'kitchen', price: 0, mount: 'floor', w: 300, h: 150, color: '#ffffff',
    art: (c) => leg(-120, -130, 130, WOOD_D, 14) + leg(120, -130, 130, WOOD_D, 14) + E(0, -140, 150, 18, WOOD) + cloth('M-150 -146 L150 -146 L156 -96 Q120 -84 100 -100 Q75 -84 50 -100 Q25 -84 0 -100 Q-25 -84 -50 -100 Q-75 -84 -100 -100 Q-120 -84 -156 -96Z', c, 'check', 'y'),
    surfaces: [{ x1: -150, x2: 150, y: -150 }],
  },
  {
    id: 'stool', name: 'Kitchen Stool', cat: 'kitchen', price: 15, mount: 'floor', w: 90, h: 110, color: '#ff7eb6',
    art: (c) => leg(-28, -84, 84, '#c9cfdd', 8) + leg(28, -84, 84, '#c9cfdd', 8) + R(-28, -40, 56, 6, 3, '#c9cfdd') + E(0, -92, 46, 16, dark(c, 0.15)) + E(0, -96, 44, 14, c) + E(-10, -100, 16, 5, '#fff', 'opacity="0.4"'),
    seats: [{ x: 0, y: -96, pose: 'sit' }],
  },
  {
    id: 'pendantLamp', name: 'Hanging Lamp', cat: 'wall', price: 25, mount: 'wall', w: 120, h: 200, color: '#ffd36b', toggle: true,
    art: (c, on) => Ln(0, -100, 0, 30, '#4a4a5e', 3) + (on ? glow(0, 70, 120) : '') + P('M-50 70 Q-50 20 0 20 Q50 20 50 70Z', c) + P('M-50 70 Q-50 20 0 20 Q50 20 50 70Z', 'url(#g-shadeX)') + E(0, 72, 16, 8, on ? '#fff6c8' : '#fff'),
  },
];

// ---------------- living room ----------------
const LIVING: FurnDef[] = [
  {
    id: 'sofa', name: 'Comfy Sofa', cat: 'living', price: 0, mount: 'floor', w: 350, h: 180, color: '#9b6bff',
    art: (c) => box(-160, -180, 320, 100, 30, dark(c, 0.06)) + box(-150, -170, 145, 82, 24, light(c, 0.08)) + box(5, -170, 145, 82, 24, light(c, 0.08)) +
      box(-155, -100, 152, 40, 14, c, 'none', 'y') + box(3, -100, 152, 40, 14, c, 'none', 'y') + box(-175, -128, 40, 108, 20, c) + box(135, -128, 40, 108, 20, c) +
      R(-165, -34, 330, 18, 8, dark(c, 0.2)) + leg(-150, -18, 18, '#4a3f5e') + leg(150, -18, 18, '#4a3f5e') + C(-90, -128, 14, '#ffd36b') + P(heartD(80, -142, 16), '#ff9ec7'),
    seats: [{ x: -75, y: -96, pose: 'sit' }, { x: 75, y: -96, pose: 'sit' }],
  },
  {
    id: 'armchair', name: 'Armchair', cat: 'living', price: 40, mount: 'floor', w: 180, h: 180, color: '#ff9ec7',
    art: (c) => box(-70, -180, 140, 100, 34, dark(c, 0.05)) + box(-70, -100, 140, 40, 14, c, 'none', 'y') + box(-90, -130, 36, 110, 18, c) + box(54, -130, 36, 110, 18, c) +
      R(-82, -34, 164, 18, 8, dark(c, 0.2)) + leg(-70, -18, 18, '#4a3f5e') + leg(70, -18, 18, '#4a3f5e'),
    seats: [{ x: 0, y: -96, pose: 'sit' }],
  },
  {
    id: 'coffeeTable', name: 'Coffee Table', cat: 'living', price: 0, mount: 'floor', w: 230, h: 90, color: '#d9a477',
    art: (c) => leg(-90, -72, 72, dark(c, 0.25), 12) + leg(90, -72, 72, dark(c, 0.25), 12) + E(0, -78, 115, 16, dark(c, 0.15)) + E(0, -84, 115, 14, c) + E(-30, -88, 50, 4, '#fff', 'opacity="0.3"'),
    surfaces: [{ x1: -110, x2: 110, y: -88 }],
  },
  {
    id: 'tv', name: 'TV', cat: 'living', price: 0, mount: 'floor', w: 260, h: 240, color: '#ffd9e8', toggle: true, sfx: 'music',
    art: (c, on) => {
      let s = box(-120, -90, 240, 82, 10, c) + R(-104, -74, 96, 50, 6, light(c, 0.3)) + R(8, -74, 96, 50, 6, light(c, 0.3)) + leg(-100, -12, 12, '#4a4a5e') + leg(100, -12, 12, '#4a4a5e');
      s += R(-14, -104, 28, 16, 3, '#4a4a5e') + R(-118, -240, 236, 140, 14, '#2d2a3a');
      if (on) {
        s += `<g><rect x="-106" y="-228" width="212" height="116" rx="8" fill="#7cc8ff"/><rect x="-106" y="-150" width="212" height="38" rx="8" fill="#7fe0b0"/>` +
          `<circle cx="70" cy="-200" r="16" fill="#ffd84a"/>` +
          `<g><animateTransform attributeName="transform" type="translate" values="-60 0;60 0;-60 0" dur="4s" repeatCount="indefinite"/>${C(0, -160, 16, '#ff9ec7')}${C(-6, -164, 3, '#2d2a3a')}${C(6, -164, 3, '#2d2a3a')}${C(-12, -178, 7, '#ff9ec7')}${C(12, -178, 7, '#ff9ec7')}</g>` +
          `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -14;0 0" dur="0.8s" repeatCount="indefinite"/>${P(starD(-60, -200, 10), '#fff')}</g></g>`;
      } else s += R(-106, -228, 212, 116, 8, '#3d3a52') + R(-106, -228, 212, 116, 8, 'url(#g-glass)');
      return s;
    },
    surfaces: [{ x1: -120, x2: -60, y: -92 }, { x1: 60, x2: 120, y: -92 }],
  },
  {
    id: 'fireplace', name: 'Fireplace', cat: 'living', price: 80, mount: 'floor', w: 280, h: 260, color: '#f0d9cf', toggle: true,
    art: (c, on) => {
      let s = box(-140, -250, 280, 250, 8, c) + R(-152, -262, 304, 22, 8, '#d9a477') + R(-90, -180, 180, 180, 0, '#3a2a35') + P('M-90 -180 A90 60 0 0 1 90 -180Z', '#3a2a35');
      for (let y = -230; y < 0; y += 24) for (let x = -140 + ((y / 24) % 2 ? 0 : 20); x < 140; x += 40) if (Math.abs(x) > 100 || y < -200) s += R(x + 2, y + 2, 36, 20, 3, light(c, 0.2), 'opacity="0.5"');
      s += R(-70, -30, 140, 14, 7, '#8a5a3c') + R(-60, -44, 120, 14, 7, '#a86b4a', 'transform="rotate(-6 0 -37)"');
      if (on) s += glow(0, -70, 120) + flame(-34, -40, 1.6) + flame(30, -40, 1.5) + flame(0, -44, 2.1);
      return s;
    },
    surfaces: [{ x1: -150, x2: 150, y: -262 }],
  },
  {
    id: 'aquarium', name: 'Fish Tank', cat: 'living', price: 70, mount: 'floor', w: 220, h: 230, color: '#5fd3b5',
    art: (c) => {
      let s = box(-100, -90, 200, 82, 8, c) + leg(-84, -12, 12, dark(c, 0.3)) + leg(84, -12, 12, dark(c, 0.3)) + R(-104, -226, 208, 140, 10, '#7fd4f5') + R(-104, -226, 208, 22, 8, '#4a4a5e');
      s += P('M-100 -96 Q-80 -106 -60 -96 Q-40 -108 -10 -96 Q30 -110 60 -96 Q80 -106 100 -96 L100 -90 L-100 -90Z', '#f4dca0');
      s += P('M-70 -96 Q-80 -130 -66 -160 Q-60 -130 -62 -96Z', '#5fae6b') + P('M70 -96 Q60 -140 76 -170 Q80 -130 78 -96Z', '#3fbf8f');
      const fish = (y: number, col: string, dur: number, dir: number) =>
        `<g><animateTransform attributeName="transform" type="translate" values="${-60 * dir} 0;${60 * dir} 0;${-60 * dir} 0" dur="${dur}s" repeatCount="indefinite"/>` +
        `<g transform="translate(0 ${y})">${E(0, 0, 16, 10, col)}${P(`M-14 0 L-28 -10 L-28 10Z`, col)}${C(7, -3, 2.5, '#2d2a3a')}</g></g>`;
      s += fish(-170, '#ffab5e', 6, 1) + fish(-130, '#ff7eb6', 8, -1) + fish(-150, '#ffd36b', 5, 1);
      for (const [x, d] of [[-30, 2], [10, 3], [40, 2.5]]) s += `<circle cx="${x}" cy="-110" r="4" fill="#fff" opacity="0.7"><animate attributeName="cy" values="-110;-200" dur="${d}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="${d}s" repeatCount="indefinite"/></circle>`;
      return s + R(-104, -226, 208, 140, 10, 'url(#g-glass)');
    },
    surfaces: [{ x1: -104, x2: 104, y: -226 }],
  },
  {
    id: 'upright', name: 'Piano', cat: 'living', price: 120, mount: 'floor', w: 230, h: 220, color: '#2d2a3a', sfx: 'note',
    art: (c) => {
      let s = box(-115, -220, 230, 212, 10, c) + R(-104, -120, 208, 30, 4, '#fff');
      for (let i = 0; i < 14; i++) s += Ln(-104 + i * 15, -120, -104 + i * 15, -90, '#c9cfdd', 1);
      for (const i of [0, 1, 3, 4, 5, 7, 8, 10, 11, 12]) s += R(-96 + i * 15, -120, 9, 18, 2, '#1d1020');
      return s + R(-80, -200, 160, 60, 8, light(c, 0.1)) + P('M-40 -180 l0 30 m0 -30 l18 -4 l0 30', 'none', 'stroke="#ffd24a" stroke-width="3"') + C(-44, -150, 5, '#ffd24a') + C(-26, -154, 5, '#ffd24a') + leg(-100, -12, 12, '#1d1020') + leg(100, -12, 12, '#1d1020');
    },
    surfaces: [{ x1: -115, x2: 115, y: -220 }],
  },
  {
    id: 'xmasTree', name: 'Holiday Tree', cat: 'decor', price: 90, mount: 'floor', w: 220, h: 330, color: '#3fbf8f', toggle: true,
    art: (c, on) => {
      let s = R(-16, -40, 32, 40, 4, '#8a5a3c') + box(-40, -44, 80, 40, 6, '#e8384f');
      for (let i = 0; i < 3; i++) {
        const y = -60 - i * 80;
        const w = 110 - i * 28;
        s += cloth(`M${-w} ${y} L0 ${y - 130} L${w} ${y}Q0 ${y + 16} ${-w} ${y}Z`, i % 2 ? dark(c, 0.06) : c, 'none');
      }
      const cols = ['#e8384f', '#ffd24a', '#7cc8ff', '#ff7eb6', '#fff'];
      [[-60, -80], [40, -90], [-20, -130], [50, -160], [-44, -180], [10, -220], [-20, -260], [30, -250], [70, -70], [-80, -70]].forEach(([x, y], i) => {
        s += C(x, y, 8, cols[i % 5]) + C(x - 2, y - 2, 2.5, '#fff', 'opacity="0.7"');
        if (on) s += `<circle cx="${x}" cy="${y}" r="16" fill="${cols[(i + 2) % 5]}" opacity="0.3"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="${1 + (i % 3) * 0.4}s" repeatCount="indefinite"/></circle>`;
      });
      return s + P(starD(0, -322, 24), 'url(#g-gold)') + (on ? glow(0, -322, 50) : '');
    },
  },
  {
    id: 'plant', name: 'Big Plant', cat: 'decor', price: 0, mount: 'floor', w: 140, h: 230, color: '#ff9ec7',
    art: (c) => {
      let s = '';
      const leaves = [[-50, -170, -30], [40, -190, 25], [-10, -210, -5], [55, -130, 50], [-60, -120, -55], [10, -160, 10]];
      for (const [x, y, r] of leaves) s += `<g transform="rotate(${r} ${x} ${y})">${E(x, y, 26, 48, '#3fbf8f')}${E(x, y, 26, 48, 'url(#g-shadeX)')}${Ln(x, y + 40, x, y - 40, '#2f9a70', 2)}</g>`;
      for (const [x, y] of leaves) s += Ln(0, -70, x * 0.8, y + 30, '#2f9a70', 4);
      return s + cloth('M-50 -80 L50 -80 L38 0 L-38 0Z', c, 'dots') + R(-56, -88, 112, 16, 6, dark(c, 0.1));
    },
  },
  {
    id: 'cactus', name: 'Cute Cactus', cat: 'decor', price: 15, mount: 'prop', w: 60, h: 90, color: '#ffd36b',
    art: (c) => box(-14, -84, 28, 60, 14, '#5fc47c') + box(-30, -66, 14, 28, 7, '#5fc47c') + box(16, -74, 14, 30, 7, '#5fc47c') + C(-4, -64, 2, '#2d2a3a') + C(4, -64, 2, '#2d2a3a') + P('M-3 -58 Q0 -55 3 -58', 'none', 'stroke="#2d2a3a" stroke-width="1.5"') + flowerG(0, -86, 8, '#ff7eb6') +
      cloth('M-26 -30 L26 -30 L20 0 L-20 0Z', c),
  },
  {
    id: 'boombox', name: 'Music Player', cat: 'living', price: 50, mount: 'prop', w: 120, h: 80, color: '#ff7eb6', sfx: 'music', toggle: true,
    art: (c, on) => box(-58, -66, 116, 62, 12, c) + R(-40, -82, 80, 18, 8, 'none', `stroke="${dark(c, 0.3)}" stroke-width="5"`) + C(-30, -34, 18, '#2d2a3a') + C(30, -34, 18, '#2d2a3a') + C(-30, -34, 8, '#9aa3b5') + C(30, -34, 8, '#9aa3b5') + R(-10, -56, 20, 10, 3, '#fff') +
      (on ? `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -20;0 0" dur="1s" repeatCount="indefinite"/>${P('M-50 -100 l0 -20 l12 -3 l0 20', 'none', 'stroke="#9b6bff" stroke-width="3"')}${C(-53, -100, 4, '#9b6bff')}${C(-41, -103, 4, '#9b6bff')}${P('M40 -96 l0 -22', 'none', 'stroke="#ff4f8b" stroke-width="3"')}${C(37, -96, 4, '#ff4f8b')}</g>` : ''),
  },
];

// ---------------- wall & rugs ----------------
const WALL: FurnDef[] = [
  { id: 'frameHeart', name: 'Heart Picture', cat: 'wall', price: 0, mount: 'wall', w: 120, h: 140, color: '#ff7eb6', art: (c) => box(-60, -70, 120, 140, 8, 'url(#g-gold)') + R(-48, -58, 96, 116, 4, '#fff7fb') + P(heartD(0, -26, 30), c) + P(heartD(-10, -18, 8), '#fff', 'opacity="0.5"') },
  { id: 'frameSun', name: 'Sunny Painting', cat: 'wall', price: 20, mount: 'wall', w: 160, h: 120, color: '#7cc8ff', art: (c) => box(-80, -60, 160, 120, 6, '#d9a477') + R(-68, -48, 136, 96, 3, c) + C(30, -18, 16, '#ffd84a') + P('M-68 48 Q-30 0 0 30 Q30 4 68 40 L68 48Z', '#7fe0b0') },
  { id: 'clock', name: 'Wall Clock', cat: 'wall', price: 15, mount: 'wall', w: 100, h: 100, color: '#ff9ec7',
    art: (c) => C(0, 0, 48, c) + C(0, 0, 40, '#fff') + Array.from({ length: 12 }, (_, i) => C(Math.cos((i * Math.PI) / 6) * 33, Math.sin((i * Math.PI) / 6) * 33, 2.5, '#c9a2c0')).join('') +
      `<g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="60s" repeatCount="indefinite"/>${Ln(0, 0, 0, -30, '#4a3f5e', 3)}</g>` + Ln(0, 0, 18, 8, '#4a3f5e', 4) + C(0, 0, 4, '#4a3f5e') },
  { id: 'shelf', name: 'Wall Shelf', cat: 'wall', price: 10, mount: 'wall', w: 200, h: 40, color: '#f3dcff', art: (c) => box(-100, -8, 200, 16, 6, c) + P('M-80 8 L-80 30 L-60 8Z', dark(c, 0.15)) + P('M80 8 L80 30 L60 8Z', dark(c, 0.15)), surfaces: [{ x1: -100, x2: 100, y: -8 }] },
  { id: 'stringLights', name: 'Fairy Lights', cat: 'wall', price: 25, mount: 'wall', w: 320, h: 70, color: '#ffd36b', toggle: true,
    art: (c, on) => {
      let s = P('M-160 -20 Q-80 30 0 -10 Q80 30 160 -20', 'none', 'stroke="#6b5a6b" stroke-width="2"');
      const cols = [c, '#ff9ec7', '#7cc8ff', '#c99bff', '#7fe0b0'];
      for (let i = 0; i < 11; i++) {
        const t = i / 10;
        const x = -160 + t * 320;
        const y = t < 0.5 ? -20 + Math.sin(t * 2 * Math.PI) * 26 + 10 * Math.sin(t * Math.PI * 2) : -10 + Math.sin((t - 0.5) * 2 * Math.PI) * 26;
        s += E(x, y + 10, 7, 10, cols[i % 5]) + (on ? `<circle cx="${f(x)}" cy="${f(y + 10)}" r="20" fill="${cols[i % 5]}" opacity="0.35"><animate attributeName="opacity" values="0.15;0.5;0.15" dur="${1.2 + (i % 3) * 0.5}s" repeatCount="indefinite"/></circle>` : '');
      }
      return s;
    } },
  { id: 'mirrorRound', name: 'Round Mirror', cat: 'wall', price: 30, mount: 'wall', w: 140, h: 140, color: '#ffd24a', art: () => C(0, 0, 68, 'url(#g-gold)') + C(0, 0, 58, '#d9efff') + C(0, 0, 58, 'url(#g-glass)') },
  { id: 'poster', name: 'Unicorn Poster', cat: 'wall', price: 35, mount: 'wall', w: 130, h: 170, color: '#c99bff',
    art: (c) => R(-65, -85, 130, 170, 4, c) + P('M-50 50 Q-50 -20 0 -20 Q50 -20 50 50', 'none', 'stroke="url(#g-rainbow)" stroke-width="14"') + E(0, 20, 32, 26, '#fff') + C(18, -6, 18, '#fff') + P('M22 -22 L30 -52 L32 -20Z', 'url(#g-gold)') + C(24, -6, 2.5, '#2d2a3a') + P('M4 -20 Q-10 -10 -4 10', 'none', 'stroke="#ff9ec7" stroke-width="8" stroke-linecap="round"') + P(starD(-40, -60, 9), '#fff') + P(starD(40, 60, 7), '#fff') },
  { id: 'window2', name: 'Star Garland', cat: 'wall', price: 15, mount: 'wall', w: 280, h: 80, color: '#ffd36b',
    art: (c) => P('M-140 -24 Q0 30 140 -24', 'none', 'stroke="#ddd" stroke-width="2"') + [-110, -60, 0, 60, 110].map((x, i) => P(starD(x, -10 + 20 * Math.cos((x / 140) * 1.4), 16), i % 2 ? '#ff9ec7' : c)).join('') },
  { id: 'rugRound', name: 'Round Rug', cat: 'decor', price: 0, mount: 'rug', w: 320, h: 90, color: '#ffb3c7', art: (c) => E(0, 0, 160, 44, dark(c, 0.08)) + E(0, -2, 150, 40, c) + E(0, -2, 110, 28, light(c, 0.3)) + E(0, -2, 60, 14, c) },
  { id: 'rugHeart', name: 'Heart Rug', cat: 'decor', price: 30, mount: 'rug', w: 260, h: 110, color: '#ff7eb6', art: (c) => `<g transform="scale(1 0.42)">${P(heartD(0, -130, 130), dark(c, 0.1))}${P(heartD(0, -118, 112), c)}${P(heartD(0, -100, 70), light(c, 0.3))}</g>` },
  { id: 'rugStripe', name: 'Stripy Rug', cat: 'decor', price: 20, mount: 'rug', w: 340, h: 80, color: '#7cc8ff',
    art: (c) => P('M-150 -36 L150 -36 L170 36 L-170 36Z', c) + [0, 1, 2].map((i) => P(`M${-145 + i * 2} ${-24 + i * 22} L${145 - i * 2} ${-24 + i * 22} L${148 - i * 2} ${-14 + i * 22} L${-148 + i * 2} ${-14 + i * 22}Z`, '#fff', 'opacity="0.7"')).join('') },
];

// ---------------- outdoor / playground ----------------
const swingAnim = (phase = 0) => ({ pivot: [0, -300] as [number, number], amp: 20, dur: 2.2, phase });
const OUTDOOR: FurnDef[] = [
  {
    id: 'swings', name: 'Swing Set', cat: 'outdoor', price: 0, mount: 'floor', w: 480, h: 320, color: '#ff7eb6', animWhenUsed: true,
    art: (c, on) => {
      let s = Ln(-235, 0, -200, -305, dark(c, 0.15), 14) + Ln(-165, 0, -200, -305, dark(c, 0.15), 14) + Ln(235, 0, 200, -305, dark(c, 0.15), 14) + Ln(165, 0, 200, -305, dark(c, 0.15), 14);
      s += R(-220, -316, 440, 20, 10, c) + R(-220, -316, 440, 8, 4, '#fff', 'opacity="0.35"');
      for (const [x, ph] of [[-95, 0], [95, 1.1]] as const) {
        const anim = on ? `<animateTransform attributeName="transform" type="rotate" values="-20 ${x} -300;20 ${x} -300;-20 ${x} -300" dur="2.2s" begin="${-ph}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>` : '';
        s += `<g>${anim}${Ln(x - 30, -300, x - 30, -72, '#9aa3b5', 3)}${Ln(x + 30, -300, x + 30, -72, '#9aa3b5', 3)}${box(x - 38, -76, 76, 14, 6, '#ffd36b')}</g>`;
      }
      return s;
    },
    seats: [{ x: -95, y: -74, pose: 'sit', anim: { ...swingAnim(0), pivot: [-95, -300] } }, { x: 95, y: -74, pose: 'sit', anim: { ...swingAnim(1.1), pivot: [95, -300] } }],
  },
  {
    id: 'slide', name: 'Slide', cat: 'outdoor', price: 0, mount: 'floor', w: 400, h: 300, color: '#5fd3b5',
    art: (c) => {
      let s = Ln(-150, 0, -150, -250, '#9aa3b5', 10) + Ln(-90, 0, -90, -250, '#9aa3b5', 10);
      for (let y = -30; y > -240; y -= 34) s += Ln(-150, y, -90, y, '#c9cfdd', 7);
      s += R(-160, -262, 80, 16, 6, '#ffd36b');
      s += cloth('M-90 -262 C20 -250 40 -60 190 -26 L196 -6 C40 -40 0 -220 -90 -232Z', c, 'none', 'y');
      return s + P('M-90 -262 C20 -250 40 -60 190 -26', 'none', `stroke="${light(c, 0.4)}" stroke-width="6" stroke-linecap="round"`) + Ln(150, -20, 150, 0, '#9aa3b5', 8);
    },
    seats: [{ x: -110, y: -262, pose: 'slide', path: [[-110, -262], [-60, -250], [0, -200], [40, -130], [90, -70], [150, -36], [200, -14]] }],
  },
  {
    id: 'seesaw', name: 'Seesaw', cat: 'outdoor', price: 40, mount: 'floor', w: 420, h: 140, color: '#ffab5e', animWhenUsed: true,
    art: (c, on) => {
      const anim = on ? `<animateTransform attributeName="transform" type="rotate" values="-12 0 -60;12 0 -60;-12 0 -60" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>` : '';
      return P('M-36 0 L0 -60 L36 0Z', '#9b6bff') + C(0, -60, 10, '#fff') + `<g>${anim}${box(-200, -74, 400, 18, 9, c)}${R(-176, -96, 10, 24, 4, '#9aa3b5')}${R(166, -96, 10, 24, 4, '#9aa3b5')}</g>`;
    },
    seats: [{ x: -150, y: -76, pose: 'sit', anim: { pivot: [0, -60], amp: 12, dur: 2.6 } }, { x: 150, y: -76, pose: 'sit', anim: { pivot: [0, -60], amp: 12, dur: 2.6 } }],
  },
  {
    id: 'sandbox', name: 'Sandbox', cat: 'outdoor', price: 30, mount: 'rug', w: 300, h: 100, color: '#ff7eb6', spawn: ['bucket', 'ball'],
    art: (c) => P('M-150 -30 L150 -30 L160 40 L-160 40Z', dark(c, 0.1)) + P('M-136 -20 L136 -20 L144 30 L-144 30Z', '#f4dca0') + E(-40, 0, 30, 8, '#e8c88a') + E(60, 10, 24, 6, '#e8c88a') + R(30, -36, 28, 26, 4, '#7cc8ff') + C(-90, 6, 10, '#ffd36b'),
  },
  {
    id: 'bench', name: 'Park Bench', cat: 'outdoor', price: 0, mount: 'floor', w: 260, h: 150, color: '#e85d5d',
    art: (c) => R(-120, -150, 240, 20, 6, c) + R(-120, -124, 240, 20, 6, c) + box(-130, -96, 260, 20, 6, dark(c, 0.06), 'none', 'y') + leg(-100, -80, 80, '#4a4a5e') + leg(100, -80, 80, '#4a4a5e') + leg(-100, -140, 50, '#4a4a5e', 8) + leg(100, -140, 50, '#4a4a5e', 8),
    seats: [{ x: -60, y: -90, pose: 'sit' }, { x: 60, y: -90, pose: 'sit' }],
  },
  {
    id: 'iceCart', name: 'Ice Cream Cart', cat: 'outdoor', price: 60, mount: 'floor', w: 240, h: 320, color: '#ff9ec7', spawn: ['iceCone', 'popsicle'], sfx: 'ding',
    art: (c) => {
      let s = Ln(-80, -170, -80, -280, '#9aa3b5', 5) + Ln(80, -170, 80, -280, '#9aa3b5', 5);
      s += P('M-110 -280 Q0 -330 110 -280 Z', '#fff') + [0, 1, 2, 3].map((i) => P(`M${-110 + i * 55} -280 Q${-82 + i * 55} -318 ${-55 + i * 55} -284Z`, i % 2 ? c : '#fff')).join('');
      s += box(-100, -170, 200, 120, 14, c) + R(-100, -170, 200, 16, 8, '#fff') + C(-60, -40, 26, '#4a4a5e') + C(-60, -40, 10, '#c9cfdd') + C(60, -40, 26, '#4a4a5e') + C(60, -40, 10, '#c9cfdd');
      s += P('M-10 -130 L10 -130 L0 -96Z', '#e8b46a') + C(0, -138, 12, '#fff3d8') + C(0, -150, 9, '#ff9ec7');
      return s;
    },
    surfaces: [{ x1: -100, x2: 100, y: -170 }],
  },
  {
    id: 'snowman', name: 'Snowman', cat: 'outdoor', price: 30, mount: 'floor', w: 160, h: 260, color: '#e8384f',
    art: (c) => C(0, -60, 62, '#ffffff') + C(0, -60, 62, 'url(#g-shadeX)') + C(0, -160, 46, '#ffffff') + C(0, -160, 46, 'url(#g-shadeX)') + C(0, -232, 34, '#fff') + C(0, -232, 34, 'url(#g-shadeX)') +
      C(-11, -238, 4, '#2d2a3a') + C(11, -238, 4, '#2d2a3a') + P('M0 -228 L28 -222 L0 -220Z', '#ff8a3d') + C(0, -170, 5, '#2d2a3a') + C(0, -145, 5, '#2d2a3a') +
      R(-44, -206, 88, 16, 8, c) + R(18, -206, 16, 50, 8, c) + R(-30, -296, 60, 12, 4, '#4a3f5e') + R(-20, -330, 40, 36, 4, '#4a3f5e') + Ln(-44, -165, -100, -200, '#8a5a3c', 5) + Ln(44, -165, 100, -200, '#8a5a3c', 5),
  },
  {
    id: 'flowerBed', name: 'Flower Bed', cat: 'outdoor', price: 20, mount: 'floor', w: 220, h: 90, color: '#ff7eb6',
    art: (c) => {
      let s = box(-110, -40, 220, 40, 10, '#a86b4a');
      [[-80, -60, c], [-40, -70, '#ffd36b'], [0, -58, '#fff'], [40, -72, c], [80, -60, '#c99bff']].forEach(([x, y, col]) => (s += Ln(x as number, -36, x as number, (y as number) + 6, '#5fae6b', 4) + flowerG(x as number, y as number, 16, col as string)));
      return s;
    },
  },
  {
    id: 'lampPost', name: 'Lamp Post', cat: 'outdoor', price: 25, mount: 'floor', w: 90, h: 360, color: '#4a4a5e', toggle: true,
    art: (c, on) => E(0, -6, 30, 8, c) + R(-7, -300, 14, 296, 6, c) + (on ? glow(0, -320, 110) : '') + P('M-30 -300 L30 -300 L20 -350 L-20 -350Z', on ? '#fff6c8' : '#d9efff') + P('M-34 -350 L34 -350 L0 -372Z', c) + R(-34, -304, 68, 8, 4, c),
  },
  {
    id: 'tree', name: 'Round Tree', cat: 'outdoor', price: 0, mount: 'floor', w: 260, h: 400, color: '#5fc47c',
    art: (c) => {
      const se = artCtx.season;
      const trunk = R(-22, -180, 44, 180, 12, '#a86b4a') + P('M0 -150 L-50 -210 M0 -170 L46 -230', 'none', 'stroke="#a86b4a" stroke-width="14" stroke-linecap="round"');
      if (se === 'winter') {
        return trunk + P('M0 -170 L-70 -280 M0 -190 L60 -300 M-30 -230 L-100 -250 M30 -250 L100 -280 M0 -200 L0 -330', 'none', 'stroke="#a86b4a" stroke-width="10" stroke-linecap="round"') +
          P('M-70 -280 l-14 -6 M60 -300 l14 -6 M-100 -250 l-14 2 M100 -280 l14 -2 M0 -330 l0 -12', 'none', 'stroke="#fff" stroke-width="12" stroke-linecap="round"') + E(0, -4, 70, 14, '#fff');
      }
      const cols = se === 'spring' ? ['#ffb7d5', '#ffd1e3', '#ff9ec7'] : se === 'fall' ? ['#ff8a3d', '#e8573d', '#ffc23d'] : [c, dark(c, 0.06), light(c, 0.1)];
      let s = trunk + C(0, -250, 110, cols[0]) + C(-70, -220, 70, cols[1]) + C(70, -220, 70, cols[1]) + C(0, -300, 80, cols[2]) + C(-30, -320, 30, '#fff', 'opacity="0.18"');
      if (se === 'summer') s += C(-40, -230, 9, '#e8384f') + C(50, -270, 9, '#e8384f') + C(20, -200, 9, '#e8384f');
      if (se === 'spring') for (const [x, y] of [[-50, -250], [40, -290], [60, -200], [-20, -190], [-80, -200], [10, -330]]) s += flowerG(x, y, 12, '#fff', '#ff9ec7');
      if (se === 'fall') s += E(-90, -6, 14, 7, '#ff8a3d') + E(80, -4, 12, 6, '#ffc23d') + E(30, -2, 12, 6, '#e8573d');
      return s;
    },
  },
];

// ---------------- school ----------------
const SCHOOL: FurnDef[] = [
  {
    id: 'schoolDesk', name: 'School Desk', cat: 'school', price: 0, mount: 'floor', w: 200, h: 200, color: '#7cc8ff',
    art: (c) => box(-44, -196, 88, 90, 20, c) + leg(-34, -100, 100, '#9aa3b5', 8) + leg(34, -100, 100, '#9aa3b5', 8) + box(-50, -104, 100, 18, 8, dark(c, 0.08)),
    front: () => leg(-80, -110, 110, '#9aa3b5', 9) + leg(80, -110, 110, '#9aa3b5', 9) + box(-96, -124, 192, 18, 6, WOOD) + R(-86, -108, 172, 46, 4, '#c9cfdd') + R(-86, -108, 172, 8, 4, '#b5bccd'),
    seats: [{ x: 0, y: -94, pose: 'sit' }],
    surfaces: [{ x1: -96, x2: 96, y: -124 }],
  },
  {
    id: 'teacherDesk', name: 'Teacher Desk', cat: 'school', price: 0, mount: 'floor', w: 300, h: 160, color: '#d9a477',
    art: (c) => box(-150, -150, 300, 22, 8, c) + box(-140, -130, 280, 122, 8, dark(c, 0.08)) + R(-120, -110, 90, 80, 6, light(c, 0.15)) + R(30, -110, 90, 80, 6, light(c, 0.15)) + C(-75, -70, 5, '#ffd24a') + C(75, -70, 5, '#ffd24a'),
    surfaces: [{ x1: -150, x2: 150, y: -150 }],
  },
  {
    id: 'globe', name: 'Globe', cat: 'school', price: 20, mount: 'prop', w: 80, h: 110, color: '#7cc8ff',
    art: (c) => E(0, -4, 26, 6, '#c9a27e') + R(-4, -30, 8, 28, 3, '#c9a27e') + C(0, -64, 34, c) + P('M-20 -80 Q-4 -90 6 -76 Q14 -66 0 -60 Q-14 -56 -20 -80Z M8 -50 Q20 -54 22 -40 Q10 -36 8 -50Z', '#7fe0b0') + C(0, -64, 34, 'url(#g-shadeX)') + P('M-36 -64 A36 36 0 0 0 36 -64', 'none', 'stroke="#c9a27e" stroke-width="4"'),
  },
  {
    id: 'cubbies', name: 'Cubbies', cat: 'school', price: 25, mount: 'floor', w: 240, h: 170, color: '#ffd36b',
    art: (c) => {
      let s = box(-120, -170, 240, 162, 8, c);
      const cols = ['#ff7eb6', '#7cc8ff', '#5fd3b5', '#c99bff', '#ff9a6b', '#ffd36b'];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) s += R(-108 + i * 74, -158 + r * 74, 66, 66, 6, dark(c, 0.25)) + box(-100 + i * 74, -130 + r * 74, 50, 34, 8, cols[r * 3 + i]);
      return s;
    },
    surfaces: [{ x1: -120, x2: 120, y: -170 }],
  },
];

// ---------------- stage ----------------
const STAGE: FurnDef[] = [
  {
    id: 'grandPiano', name: 'Grand Piano', cat: 'stage', price: 0, mount: 'floor', w: 360, h: 250, color: '#2d2a3a', sfx: 'note',
    art: (c) => {
      let s = leg(-120, -100, 100, '#1d1020', 14) + leg(130, -100, 100, '#1d1020', 14) + leg(10, -100, 100, '#1d1020', 14);
      s += P('M-150 -150 L-150 -100 L170 -100 C200 -100 200 -170 140 -170 C80 -170 60 -200 0 -210 L-140 -210Z', c) + P('M-150 -150 L-150 -100 L170 -100 C200 -100 200 -170 140 -170 C80 -170 60 -200 0 -210 L-140 -210Z', 'url(#g-shadeY)');
      s += P('M-140 -210 L0 -210 L-40 -300 L-130 -300Z', light(c, 0.1)) + Ln(-60, -210, -90, -290, '#ffd24a', 3);
      s += R(-180, -150, 60, 40, 4, '#fff');
      for (let i = 0; i < 5; i++) s += R(-176 + i * 12, -150, 7, 22, 2, '#1d1020');
      return s + R(-250, -84, 70, 18, 6, '#e8384f') + leg(-240, -66, 66, '#1d1020', 8) + leg(-190, -66, 66, '#1d1020', 8);
    },
    seats: [{ x: -215, y: -80, pose: 'sit' }],
  },
  {
    id: 'micStand', name: 'Microphone', cat: 'stage', price: 0, mount: 'floor', w: 80, h: 260, color: '#ff7eb6',
    art: (c) => E(0, -6, 34, 8, '#4a4a5e') + R(-4, -220, 8, 216, 4, '#4a4a5e') + R(-9, -250, 18, 36, 8, '#4a4a5e') + C(0, -256, 14, 'url(#g-silver)') + R(-10, -238, 20, 6, 3, c),
  },
  {
    id: 'roses', name: 'Rose Bouquet', cat: 'stage', price: 0, mount: 'prop', w: 80, h: 90, color: '#e8384f',
    art: (c) => P('M-16 -8 L16 -8 L24 -50 L-24 -50Z', '#fff') + [[-12, -62], [10, -66], [0, -78], [-20, -76], [20, -80]].map(([x, y]) => C(x, y, 12, c) + P(`M${x - 6} ${y} q6 -10 12 0`, 'none', `stroke="${dark(c, 0.3)}" stroke-width="2"`)).join(''),
  },
];

// ---------------- salon ----------------
const SALON: FurnDef[] = [
  {
    id: 'salonChair', name: 'Salon Chair', cat: 'salon', price: 0, mount: 'floor', w: 180, h: 230, color: '#ff7eb6',
    art: (c) => E(0, -6, 60, 12, '#9aa3b5') + R(-8, -60, 16, 56, 4, 'url(#g-silver)') + box(-60, -230, 120, 140, 30, c) + box(-70, -100, 140, 40, 16, dark(c, 0.06), 'none', 'y') + box(-86, -134, 26, 70, 12, light(c, 0.1)) + box(60, -134, 26, 70, 12, light(c, 0.1)) +
      P('M-40 -210 Q0 -222 40 -210', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.5"'),
    seats: [{ x: 0, y: -96, pose: 'sit' }],
  },
  {
    id: 'dryer', name: 'Hair Dryer Seat', cat: 'salon', price: 40, mount: 'floor', w: 200, h: 420, color: '#c99bff', toggle: true,
    art: (c) => E(0, -6, 60, 12, '#9aa3b5') + R(-8, -60, 16, 56, 4, 'url(#g-silver)') + box(-56, -200, 112, 110, 26, c) + box(-66, -100, 132, 40, 16, dark(c, 0.06), 'none', 'y') + R(70, -380, 12, 380, 5, 'url(#g-silver)'),
    front: (c, on) => P('M-96 -330 Q-100 -430 0 -436 Q100 -430 96 -330 Q0 -310 -96 -330Z', light(c, 0.3)) + P('M-96 -330 Q-100 -430 0 -436 Q100 -430 96 -330 Q0 -310 -96 -330Z', 'url(#g-shadeX)') + R(76, -400, 30, 20, 6, 'url(#g-silver)') +
      (on ? `<g opacity="0.8">${[-40, 0, 40].map((x, i) => `<path d="M${x} -320 q6 10 0 20 q-6 10 0 20" stroke="#fff" stroke-width="3" fill="none"><animate attributeName="opacity" values="0;1;0" dur="1s" begin="${i * 0.3}s" repeatCount="indefinite"/></path>`).join('')}</g>` : ''),
    seats: [{ x: 0, y: -96, pose: 'sit' }],
  },
  {
    id: 'productCart', name: 'Beauty Cart', cat: 'salon', price: 30, mount: 'floor', w: 140, h: 200, color: '#ffffff', spawn: ['nailPolish', 'perfume', 'lipstickProp'],
    art: (c) => {
      let s = box(-60, -200, 120, 12, 5, c) + box(-60, -120, 120, 12, 5, c) + box(-60, -40, 120, 12, 5, c) + R(-58, -200, 8, 180, 4, 'url(#g-silver)') + R(50, -200, 8, 180, 4, 'url(#g-silver)') + C(-44, -16, 9, '#4a4a5e') + C(44, -16, 9, '#4a4a5e');
      const cols = ['#ff4f8b', '#c99bff', '#7cc8ff', '#ffd36b', '#5fd3b5'];
      cols.forEach((col, i) => (s += R(-46 + i * 20, -232, 14, 32, 4, col) + R(-44 + i * 20, -240, 10, 10, 2, '#4a4a5e')));
      return s + R(-40, -150, 30, 30, 6, '#ff9ec7') + C(20, -138, 16, '#ffd9e8') + R(-40, -72, 80, 32, 6, '#7cc8ff');
    },
  },
];

// ---------------- shop ----------------
const SHOP: FurnDef[] = [
  {
    id: 'rack', name: 'Clothes Rack', cat: 'shop', price: 0, mount: 'floor', w: 300, h: 300, color: '#ff7eb6',
    art: (c) => {
      let s = Ln(-130, 0, -130, -280, '#c9cfdd', 6) + Ln(130, 0, 130, -280, '#c9cfdd', 6) + Ln(-140, -280, 140, -280, '#c9cfdd', 6) + Ln(-150, 0, -110, 0, '#c9cfdd', 6) + Ln(110, 0, 150, 0, '#c9cfdd', 6);
      const cols = [c, '#7cc8ff', '#ffd36b', '#c99bff', '#5fd3b5', '#ff9a6b'];
      cols.forEach((col, i) => {
        const x = -100 + i * 40;
        s += P(`M${x} -282 q0 -8 6 -8`, 'none', 'stroke="#9aa3b5" stroke-width="2"') + cloth(`M${x - 18} -268 L${x + 18} -268 L${x + 24} ${-150 - (i % 2) * 30} L${x - 24} ${-150 - (i % 2) * 30}Z`, col, i % 3 === 0 ? 'dots' : 'none') + Ln(x - 16, -274, x + 16, -274, '#9aa3b5', 3);
      });
      return s;
    },
  },
  {
    id: 'mannequin', name: 'Mannequin', cat: 'shop', price: 0, mount: 'floor', w: 120, h: 320, color: '#c99bff',
    art: (c) => E(0, -6, 40, 9, '#4a4a5e') + R(-4, -120, 8, 116, 3, '#4a4a5e') + cloth('M-40 -270 Q0 -280 40 -270 L30 -190 L56 -110 Q0 -96 -56 -110 L-30 -190Z', c, 'stars') + E(0, -286, 16, 12, '#f0e6ee') + `<g transform="translate(0 -196) scale(0.6)">${bowG(0, 0, 1, '#ff4f8b')}</g>`,
  },
  {
    id: 'counterShop', name: 'Shop Counter', cat: 'shop', price: 0, mount: 'floor', w: 300, h: 170, color: '#ffffff',
    art: (c) => box(-150, -150, 300, 142, 12, c) + R(-160, -162, 320, 18, 8, '#ff9ec7') + P(heartD(0, -120, 36), '#ffb3c7') + R(60, -200, 70, 40, 8, '#4a4a5e') + R(66, -194, 58, 20, 4, '#7fe0b0') + R(-120, -186, 60, 24, 6, '#ffd36b'),
    surfaces: [{ x1: -160, x2: 40, y: -162 }],
  },
  {
    id: 'shoeShelf', name: 'Shoe Shelf', cat: 'shop', price: 0, mount: 'floor', w: 200, h: 220, color: '#ffd9e8',
    art: (c) => {
      let s = box(-100, -220, 200, 212, 8, c);
      const cols = ['#ff4f8b', '#7cc8ff', '#ffd36b', '#9b6bff', '#5fd3b5', '#ff9a6b'];
      for (let r = 0; r < 3; r++) {
        s += R(-92, -150 + r * 66, 184, 8, 3, '#fff');
        for (let i = 0; i < 2; i++) s += P(`M${-70 + i * 90} ${-150 + r * 66} Q${-70 + i * 90} ${-176 + r * 66} ${-50 + i * 90} ${-174 + r * 66} L${-10 + i * 90} ${-160 + r * 66} Q${0 + i * 90} ${-150 + r * 66} ${-10 + i * 90} ${-150 + r * 66}Z`, cols[r * 2 + i]);
      }
      return s;
    },
  },
];

// ---------------- props ----------------
function prop(id: string, name: string, cat: 'food' | 'toys' | 'decor', w: number, h: number, art: (c: string, on: boolean) => string, extra: Partial<FurnDef> = {}): FurnDef {
  return { id, name, cat, price: 0, mount: 'prop', w, h, art, food: cat === 'food', ...extra };
}
const PROPS: FurnDef[] = [
  prop('apple', 'Apple', 'food', 50, 56, () => C(-9, -24, 18, '#e8384f') + C(9, -24, 18, '#e8384f') + C(0, -22, 20, '#e8384f') + C(-6, -30, 6, '#fff', 'opacity="0.4"') + Ln(0, -42, 3, -52, '#8a5a3c', 3) + E(10, -48, 9, 5, '#5fae6b')),
  prop('strawberry', 'Strawberry', 'food', 44, 50, () => P('M-18 -36 Q0 -46 18 -36 Q16 -10 0 0 Q-16 -10 -18 -36Z', '#ff4f6d') + [[-8, -28], [6, -30], [-2, -18], [8, -16], [-10, -14]].map(([x, y]) => E(x, y, 1.6, 2.4, '#ffe680')).join('') + P('M-14 -38 L-4 -48 L0 -38 L6 -48 L14 -38Z', '#5fae6b')),
  prop('cupcake', 'Cupcake', 'food', 60, 70, () => P('M-22 -30 L22 -30 L16 0 L-16 0Z', '#ff9ec7') + [-12, -4, 4, 12].map((x) => Ln(x, -28, x * 0.75, -2, '#ff7eb6', 2)).join('') + C(-12, -36, 13, '#fff3f8') + C(12, -36, 13, '#fff3f8') + C(0, -46, 15, '#fff3f8') + C(0, -60, 7, '#e8384f') + [[-10, -40, '#7cc8ff'], [8, -46, '#ffd36b'], [2, -36, '#5fd3b5']].map(([x, y, c]) => R(x as number, y as number, 6, 2.5, 1, c as string)).join('')),
  prop('cake', 'Cake', 'food', 100, 90, () => box(-46, -60, 92, 58, 10, '#ffd9e8') + R(-46, -40, 92, 10, 0, '#ff7eb6') + P('M-46 -58 Q-40 -46 -34 -58 Q-28 -46 -22 -58 Q-16 -46 -10 -58 Q-4 -46 2 -58 Q8 -46 14 -58 Q20 -46 26 -58 Q32 -46 38 -58 Q42 -48 46 -58 L46 -64 L-46 -64Z', '#fff') + E(0, -2, 54, 6, '#e6e6f0') + R(-3, -84, 6, 22, 2, '#7cc8ff') + `<path d="M0 -92 q5 4 0 8 q-5 -4 0 -8" fill="#ffab3d"/>` + C(-24, -68, 6, '#e8384f') + C(24, -68, 6, '#e8384f')),
  prop('pizza', 'Pizza', 'food', 70, 60, () => P('M-30 -50 Q0 -62 30 -50 L0 0Z', '#ffd36b') + P('M-30 -50 Q0 -62 30 -50 L26 -42 Q0 -52 -26 -42Z', '#e8b46a') + C(-8, -34, 6, '#e8384f') + C(10, -38, 6, '#e8384f') + C(0, -18, 5, '#e8384f') + C(-14, -44, 2, '#5fae6b') + C(6, -26, 2, '#5fae6b')),
  prop('milk', 'Milk', 'food', 44, 80, () => box(-18, -64, 36, 64, 4, '#fff') + P('M-18 -64 L0 -80 L18 -64Z', '#e6e6f0') + R(-18, -44, 36, 20, 0, '#7cc8ff') + P(heartD(0, -42, 7), '#fff')),
  prop('juice', 'Juice Box', 'food', 40, 70, () => box(-16, -54, 32, 54, 4, '#ffab5e') + C(0, -28, 9, '#ffd36b') + Ln(8, -54, 14, -72, '#fff', 4) + Ln(14, -72, 20, -72, '#fff', 4)),
  prop('cookie', 'Cookie', 'food', 50, 40, () => E(0, -14, 24, 14, '#d9a066') + E(0, -16, 24, 12, '#e8b46a') + [[-10, -18], [6, -14], [10, -20], [-2, -22], [-6, -12]].map(([x, y]) => C(x, y, 3, '#6b4226')).join('')),
  prop('donut', 'Donut', 'food', 56, 40, () => E(0, -16, 26, 16, '#e8b46a') + E(0, -18, 24, 13, '#ff7eb6') + E(0, -18, 8, 4, '#e8b46a') + [[-14, -20, '#fff'], [10, -24, '#7cc8ff'], [14, -14, '#ffd36b'], [-6, -10, '#5fd3b5']].map(([x, y, c]) => R(x as number, y as number, 5, 2, 1, c as string)).join('')),
  prop('banana', 'Banana', 'food', 70, 40, () => P('M-30 -26 Q0 6 30 -28 Q26 -16 0 -8 Q-24 -10 -30 -26Z', '#ffe06b') + P('M-30 -26 Q0 6 30 -28', 'none', 'stroke="#e8c04a" stroke-width="2"') + Ln(30, -28, 34, -34, '#8a5a3c', 3)),
  prop('cheese', 'Cheese', 'food', 60, 40, () => P('M-28 -4 L28 -4 L28 -26 L-28 -34Z', '#ffd84a') + P('M-28 -34 L28 -26 L10 -40Z', '#ffe680') + C(-10, -18, 4, '#e8b83a') + C(12, -14, 3, '#e8b83a')),
  prop('iceCone', 'Ice Cream', 'food', 40, 80, () => P('M-14 -40 L14 -40 L0 0Z', '#e8b46a') + C(0, -48, 15, '#ffb3c7') + C(0, -64, 12, '#fff3d8') + C(4, -76, 5, '#e8384f')),
  prop('popsicle', 'Popsicle', 'food', 36, 80, () => R(-4, -24, 8, 24, 3, '#e8c88a') + box(-15, -76, 30, 54, 14, '#7cc8ff') + R(-15, -50, 30, 10, 0, '#ff9ec7')),
  prop('ball', 'Ball', 'toys', 60, 60, () => C(0, -28, 28, '#ff7eb6') + P('M-28 -28 Q0 -14 28 -28', 'none', 'stroke="#fff" stroke-width="6"') + P('M0 -56 Q-14 -28 0 0', 'none', 'stroke="#ffd36b" stroke-width="6"') + C(-10, -40, 6, '#fff', 'opacity="0.4"'), { sfx: 'boing' }),
  prop('teddyToy', 'Teddy', 'toys', 70, 80, () => C(-20, -66, 10, '#c98a5a') + C(20, -66, 10, '#c98a5a') + E(0, -20, 26, 22, '#c98a5a') + C(0, -52, 22, '#c98a5a') + E(0, -46, 9, 7, '#e8c0a0') + C(-7, -56, 2.5, '#2d2a3a') + C(7, -56, 2.5, '#2d2a3a') + C(-20, -6, 9, '#b07a4f') + C(20, -6, 9, '#b07a4f') + `<g transform="translate(0 -32) scale(0.4)">${bowG(0, 0, 1, '#ff4f8b')}</g>`, { sfx: 'squeak' }),
  prop('blocks', 'Toy Blocks', 'toys', 80, 70, () => box(-36, -32, 32, 32, 4, '#7cc8ff') + box(4, -32, 32, 32, 4, '#ffd36b') + box(-16, -64, 32, 32, 4, '#ff7eb6') + `<text x="-20" y="-9" font-size="20" font-weight="700" fill="#fff" text-anchor="middle" font-family="Fredoka, sans-serif">A</text><text x="20" y="-9" font-size="20" font-weight="700" fill="#fff" text-anchor="middle" font-family="Fredoka, sans-serif">B</text><text x="0" y="-41" font-size="20" font-weight="700" fill="#fff" text-anchor="middle" font-family="Fredoka, sans-serif">C</text>`),
  prop('duck', 'Rubber Duck', 'toys', 60, 50, () => E(0, -16, 24, 16, '#ffd84a') + C(10, -36, 13, '#ffd84a') + P('M20 -36 L32 -32 L20 -30Z', '#ff8a3d') + C(13, -39, 2.5, '#2d2a3a') + P('M-20 -20 Q-10 -30 0 -18', 'none', 'stroke="#e8c04a" stroke-width="3"'), { sfx: 'squeak' }),
  prop('bucket', 'Sand Bucket', 'toys', 60, 60, () => P('M-22 -44 L22 -44 L16 0 L-16 0Z', '#7cc8ff') + P('M-22 -44 Q0 -76 22 -44', 'none', 'stroke="#4f9dff" stroke-width="3"') + E(0, -44, 22, 6, '#f4dca0')),
  prop('gift', 'Gift Box', 'toys', 60, 70, () => box(-26, -46, 52, 46, 4, '#c99bff') + R(-5, -46, 10, 46, 0, '#ffd36b') + R(-30, -54, 60, 14, 4, '#b583ff') + `<g transform="translate(0 -56) scale(0.7)">${bowG(0, 0, 1, '#ffd36b')}</g>`),
  prop('vase', 'Flower Vase', 'decor', 50, 90, () => P('M-12 -36 Q-22 -16 -14 0 L14 0 Q22 -16 12 -36Z', '#7cc8ff') + Ln(-6, -36, -12, -66, '#5fae6b', 3) + Ln(4, -36, 8, -74, '#5fae6b', 3) + flowerG(-12, -70, 10, '#ff7eb6') + flowerG(8, -78, 10, '#ffd36b', '#ff7eb6')),
  prop('pumpkin', 'Pumpkin', 'decor', 80, 70, () => E(-16, -26, 18, 24, '#ff8a3d') + E(16, -26, 18, 24, '#ff8a3d') + E(0, -26, 20, 26, '#ffab5e') + R(-3, -60, 6, 12, 2, '#5fae6b') + E(10, -56, 8, 4, '#5fae6b')),
  prop('beachBall', 'Beach Ball', 'toys', 70, 70, () => C(0, -32, 32, '#fff', 'stroke="#e6e0ee" stroke-width="2"') + P('M0 -64 Q-30 -32 0 0 Q-16 -32 0 -64Z', '#ff4f6d') + P('M0 -64 Q30 -32 0 0 Q16 -32 0 -64Z', '#7cc8ff') + P('M-32 -32 Q0 -40 32 -32 Q0 -24 -32 -32Z', '#ffd36b', 'opacity="0.8"') + C(0, -32, 6, '#fff'), { sfx: 'boing' }),
  prop('apples3', 'Fruit Bowl', 'food', 90, 60, () => C(-18, -30, 14, '#e8384f') + C(16, -32, 14, '#ffd36b') + C(0, -40, 14, '#5fc47c') + P('M-40 -26 L40 -26 Q36 0 0 0 Q-36 0 -40 -26Z', '#ff9ec7')),
  prop('booksStack', 'Books', 'decor', 70, 50, () => box(-30, -14, 60, 14, 3, '#7cc8ff') + box(-26, -28, 54, 14, 3, '#ff7eb6') + box(-32, -42, 58, 14, 3, '#ffd36b')),
  prop('teaSet', 'Tea Pot', 'food', 70, 70, () => E(0, -26, 26, 22, '#fff') + E(0, -26, 26, 22, 'url(#g-shadeX)') + P('M24 -32 Q40 -40 38 -52', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round"') + P('M-24 -36 Q-40 -30 -24 -16', 'none', 'stroke="#fff" stroke-width="5"') + E(0, -48, 14, 5, '#ff9ec7') + C(0, -54, 4, '#ff9ec7') + flowerG(0, -26, 8, '#ff9ec7')),
  prop('microwave', 'Microwave', 'decor', 110, 70, (c, on) => box(-52, -64, 104, 64, 8, '#f6f1fa') + R(-44, -56, 66, 48, 5, on ? '#ffd36b' : '#3d3a52') + R(-44, -56, 66, 48, 5, 'url(#g-glass)') + C(36, -46, 5, '#9aa3b5') + C(36, -30, 5, '#9aa3b5') + R(30, -18, 12, 6, 2, on ? '#7fe0b0' : '#9aa3b5') + (on ? glow(-11, -32, 40) : ''), { toggle: true, sfx: 'ding', color: '#ffffff' }),
  prop('toaster', 'Toaster', 'decor', 80, 60, (_c, on) => (on ? R(-20, -70, 14, 30, 4, '#e8b46a') + R(4, -70, 14, 30, 4, '#e8b46a') : '') + box(-36, -52, 72, 52, 14, '#ff9ec7') + R(-22, -54, 14, 6, 3, '#4a4a5e') + R(6, -54, 14, 6, 3, '#4a4a5e') + R(36, -34, 8, 10, 3, '#4a4a5e'), { toggle: true, sfx: 'ding' }),
  prop('nailPolish', 'Nail Polish', 'decor', 30, 50, () => box(-11, -30, 22, 30, 6, '#ff4f8b') + R(-6, -46, 12, 18, 3, '#4a4a5e')),
  prop('perfume', 'Perfume', 'decor', 40, 60, () => P('M-16 -36 L16 -36 L18 0 L-18 0Z', '#c99bff', 'opacity="0.9"') + R(-6, -46, 12, 10, 2, 'url(#g-gold)') + C(0, -52, 7, '#ff9ec7') + P(heartD(0, -24, 7), '#fff', 'opacity="0.6"')),
  prop('lipstickProp', 'Lipstick', 'decor', 24, 56, () => R(-9, -26, 18, 26, 3, 'url(#g-gold)') + P('M-7 -26 L-7 -44 L7 -52 L7 -26Z', '#e0245e')),
  prop('apple2', 'Teacher Apple', 'food', 50, 56, () => C(0, -22, 20, '#e8384f') + C(-6, -30, 6, '#fff', 'opacity="0.4"') + Ln(0, -42, 2, -50, '#8a5a3c', 3) + E(9, -46, 8, 4, '#5fae6b')),
];

export const FURNITURE: FurnDef[] = [...BEDROOM, ...KITCHEN, ...LIVING, ...WALL, ...OUTDOOR, ...SCHOOL, ...STAGE, ...SALON, ...SHOP, ...PROPS];
export const FURN_BY_ID: Record<string, FurnDef> = Object.fromEntries(FURNITURE.map((d) => [d.id, d]));

/** Bounding box for drawing a thumbnail of an item. */
export function furnViewBox(d: FurnDef): string {
  const pad = 14;
  if (d.mount === 'wall' || d.mount === 'rug') return `${-d.w / 2 - pad} ${-d.h / 2 - pad} ${d.w + pad * 2} ${d.h + pad * 2}`;
  const top = d.id === 'canopyBed' ? 440 : d.h;
  return `${-d.w / 2 - pad} ${-top - pad} ${d.w + pad * 2} ${top + pad * 2}`;
}

export function furnThumb(d: FurnDef, color?: string): string {
  const c = color ?? d.color ?? '#ff9ec7';
  return `<svg viewBox="${furnViewBox(d)}" preserveAspectRatio="xMidYMid meet">${d.art(c, false)}${d.front ? d.front(c, false) : ''}</svg>`;
}

export { sparkleD };
