// Draws a whole doll from its look: body, face, hair and every worn item, layered back to front.
import { type Body, type Pose, body, legPath, sleevePath, torsoPath } from './body';
import { dark, light } from './color';
import { cloth } from './defs';
import { type WearCtx, WEAR_BY_ID, bowG, heartD, sparkleD, starD } from './wear';
import type { Look, Slot } from '../types';

export type Expr = 'normal' | 'happy' | 'surprised' | 'sleep' | 'yum';

const f = (n: number) => n.toFixed(1);

// ---------------- hair ----------------
export interface HairStyle {
  id: string;
  name: string;
  price: number;
  bangs: 'side' | 'blunt' | 'part' | 'curly' | 'short' | 'sweep' | 'buzz' | 'sidepart';
  back: (b: Body, c: string) => string;
  /** Drawn over the bangs, e.g. a braid wrapped across the top. */
  over?: (b: Body, c: string) => string;
  /** Has hair piled on top (buns, spikes, a quiff) that a covering hat should tuck away. */
  top?: boolean;
  locks?: boolean;
}

function capPath(b: Body, bangs: HairStyle['bangs'], locks = true): string {
  const { R, headY: hy } = b;
  const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
  let d = `M${p(-1.06, 0.12)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0.12)}`;
  const lockY = bangs === 'short' || bangs === 'buzz' || bangs === 'sidepart' ? 0.18 : 0.44;
  d += locks ? ` L${p(1.04, lockY)} Q${p(0.99, lockY + 0.1)} ${p(0.9, lockY - 0.02)} L${p(0.86, 0.04)}` : ` L${p(0.92, 0.1)}`;
  switch (bangs) {
    case 'side':
      d += ` C${p(0.82, -0.32)} ${p(0.62, -0.52)} ${p(0.3, -0.5)} C${p(-0.08, -0.48)} ${p(-0.52, -0.32)} ${p(-0.86, 0.04)}`;
      break;
    case 'sweep':
      d += ` C${p(0.84, -0.36)} ${p(0.55, -0.58)} ${p(0.25, -0.6)} C${p(-0.25, -0.58)} ${p(-0.62, -0.38)} ${p(-0.8, -0.12)} Q${p(-0.6, -0.36)} ${p(-0.2, -0.42)} Q${p(-0.6, -0.2)} ${p(-0.86, 0.04)}`;
      break;
    case 'blunt': {
      d += ` L${p(0.84, -0.2)}`;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const xa = 0.84 - (1.68 * i) / n;
        const xb = 0.84 - (1.68 * (i + 1)) / n;
        d += ` Q${p((xa + xb) / 2, -0.12)} ${p(xb, -0.24 - (i % 2) * 0.02)}`;
      }
      d += ` L${p(-0.86, 0.04)}`;
      break;
    }
    case 'part':
      d += ` C${p(0.84, -0.42)} ${p(0.38, -0.74)} ${p(0.02, -0.68)} C${p(-0.38, -0.74)} ${p(-0.84, -0.42)} ${p(-0.86, 0.04)}`;
      break;
    case 'curly': {
      const n = 7;
      d += ` L${p(0.84, -0.18)}`;
      for (let i = 0; i < n; i++) {
        const xa = 0.84 - (1.68 * i) / n;
        const xb = 0.84 - (1.68 * (i + 1)) / n;
        const ya = -0.3 - Math.sin((i / n) * Math.PI) * 0.12;
        d += ` Q${p((xa + xb) / 2, ya + 0.16)} ${p(xb, ya)}`;
      }
      d += ` L${p(-0.86, 0.04)}`;
      break;
    }
    case 'buzz':
      d += ` C${p(0.84, -0.3)} ${p(0.5, -0.56)} ${p(0, -0.56)} C${p(-0.5, -0.56)} ${p(-0.84, -0.3)} ${p(-0.86, 0.04)}`;
      break;
    case 'sidepart':
      d += ` C${p(0.84, -0.3)} ${p(0.6, -0.5)} ${p(0.2, -0.46)} C${p(-0.1, -0.44)} ${p(-0.3, -0.5)} ${p(-0.42, -0.66)} C${p(-0.6, -0.5)} ${p(-0.8, -0.3)} ${p(-0.86, 0.04)}`;
      break;
    case 'short': {
      d += ` L${p(0.82, -0.3)}`;
      const pts = [[0.6, -0.4], [0.45, -0.28], [0.2, -0.44], [0.0, -0.3], [-0.25, -0.46], [-0.45, -0.32], [-0.65, -0.42], [-0.82, -0.28]];
      for (const [x, y] of pts) d += ` L${p(x, y)}`;
      d += ` L${p(-0.86, 0.04)}`;
      break;
    }
  }
  if (locks) d += ` L${p(-0.9, lockY - 0.02)} Q${p(-0.99, lockY + 0.1)} ${p(-1.04, lockY)}`;
  else d += ` L${p(-0.92, 0.1)}`;
  return d + 'Z';
}

function hairFront(b: Body, st: HairStyle, c: string): string {
  const { R, headY: hy } = b;
  const d = capPath(b, st.bangs, st.locks !== false);
  const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
  const dk = dark(c, 0.28);
  let s = `<path d="${d}" fill="${c}"/><path d="${d}" fill="url(#g-shine)"/>`;
  // strands
  if (st.bangs === 'side' || st.bangs === 'sweep') {
    s += `<path d="M${p(0.55, -0.8)} Q${p(0.3, -0.6)} ${p(0.0, -0.48)} M${p(0.75, -0.6)} Q${p(0.55, -0.5)} ${p(0.4, -0.5)}" stroke="${dk}" stroke-width="${f(R * 0.025)}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  } else if (st.bangs === 'sidepart') {
    s += `<path d="M${p(-0.42, -0.66)} Q${p(-0.38, -0.9)} ${p(-0.3, -1.04)} M${p(-0.2, -0.6)} Q${p(0.2, -0.75)} ${p(0.6, -0.62)}" stroke="${dk}" stroke-width="${f(R * 0.025)}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  } else if (st.bangs === 'part') {
    s += `<path d="M${p(0.02, -1.0)} L${p(0.02, -0.7)}" stroke="${dk}" stroke-width="${f(R * 0.03)}" stroke-linecap="round" opacity="0.5"/>`;
  } else if (st.bangs === 'blunt') {
    s += `<path d="M${p(-0.4, -0.9)} Q${p(-0.45, -0.5)} ${p(-0.42, -0.24)} M${p(0.25, -0.95)} Q${p(0.28, -0.5)} ${p(0.28, -0.24)}" stroke="${dk}" stroke-width="${f(R * 0.022)}" fill="none" stroke-linecap="round" opacity="0.4"/>`;
  }
  s += `<path d="M${p(-0.66, -0.62)} Q${p(-0.25, -0.98)} ${p(0.32, -0.88)}" stroke="${light(c, 0.55)}" stroke-width="${f(R * 0.085)}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  s += `<path d="M${p(0.48, -0.8)} Q${p(0.62, -0.72)} ${p(0.7, -0.62)}" stroke="${light(c, 0.55)}" stroke-width="${f(R * 0.06)}" fill="none" stroke-linecap="round" opacity="0.45"/>`;
  return s;
}

const bowShape = (c: string) => `<path d="M0 0 C-8 -14 -26 -16 -26 -2 C-26 12 -8 10 0 0Z M0 0 C8 -14 26 -16 26 -2 C26 12 8 10 0 0Z" fill="${c}"/><ellipse cx="0" cy="0" rx="6" ry="7" fill="${dark(c, 0.25)}"/><path d="M-20 -4 C-16 -9 -10 -8 -6 -3" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>`;
const backShape = (d: string, c: string) => `<path d="${d}" fill="${dark(c, 0.12)}"/><path d="${d}" fill="url(#g-shadeX)"/>`;
const tie = (x: number, y: number, R: number) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R * 0.1)}" ry="${f(R * 0.08)}" fill="#ff7eb6"/><ellipse cx="${f(x - R * 0.03)}" cy="${f(y - R * 0.03)}" rx="${f(R * 0.03)}" ry="${f(R * 0.025)}" fill="#fff" opacity="0.6"/>`;

const capBack = (b: Body, c: string, w = 1.08, down = 0.3) => {
  const { R, headY: hy } = b;
  return backShape(`M${f(-R * w)} ${f(hy + R * down)} A${f(R * 1.08)} ${f(R * 1.06)} 0 1 1 ${f(R * w)} ${f(hy + R * down)}Z`, c);
};

export const HAIR: HairStyle[] = [
  {
    id: 'long', name: 'Long & Straight', price: 0, bangs: 'side',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.13, 1.35)} Q${p(1.12, 1.72)} ${p(0.82, 1.74)} Q${p(0.55, 1.62)} ${p(0.36, 1.7)} L${p(-0.36, 1.7)} Q${p(-0.55, 1.62)} ${p(-0.82, 1.74)} Q${p(-1.12, 1.72)} ${p(-1.13, 1.35)}Z`, c);
    },
  },
  {
    id: 'wavy', name: 'Wavy Waves', price: 0, bangs: 'part',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      let d = `M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)}`;
      d += ` Q${p(1.3, 0.3)} ${p(1.12, 0.6)} Q${p(0.98, 0.9)} ${p(1.2, 1.2)} Q${p(1.32, 1.5)} ${p(1.05, 1.82)} Q${p(0.8, 1.7)} ${p(0.6, 1.85)} Q${p(0.3, 1.7)} ${p(0, 1.82)}`;
      d += ` Q${p(-0.3, 1.7)} ${p(-0.6, 1.85)} Q${p(-0.8, 1.7)} ${p(-1.05, 1.82)} Q${p(-1.32, 1.5)} ${p(-1.2, 1.2)} Q${p(-0.98, 0.9)} ${p(-1.12, 0.6)} Q${p(-1.3, 0.3)} ${p(-1.06, 0)}Z`;
      return backShape(d, c);
    },
  },
  {
    id: 'bob', name: 'Bob Cut', price: 0, bangs: 'blunt',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.16, 0.62)} Q${p(1.16, 0.86)} ${p(0.92, 0.84)} L${p(-0.92, 0.84)} Q${p(-1.16, 0.86)} ${p(-1.16, 0.62)}Z`, c);
    },
  },
  {
    id: 'pigtails', name: 'Pigtails', price: 0, bangs: 'blunt', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      for (const sd of [-1, 1]) {
        const p = (x: number, y: number) => `${f(sd * x * R)} ${f(hy + y * R)}`;
        s += backShape(`M${p(0.9, -0.15)} C${p(1.55, -0.2)} ${p(1.62, 0.7)} ${p(1.32, 1.35)} C${p(1.25, 1.1)} ${p(1.12, 0.9)} ${p(1.12, 0.6)} C${p(1.0, 0.7)} ${p(0.95, 0.3)} ${p(0.9, -0.15)}Z`, c);
        s += `<path d="M${p(1.2, 0.1)} Q${p(1.42, 0.5)} ${p(1.34, 1.0)}" stroke="${light(c, 0.4)}" stroke-width="${f(R * 0.05)}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
        s += tie(sd * R * 1.02, hy - R * 0.12, R);
      }
      return s;
    },
  },
  {
    id: 'ponytail', name: 'High Ponytail', price: 0, bangs: 'side', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return capBack(b, c) + backShape(`M${p(0.45, -0.92)} C${p(1.25, -1.1)} ${p(1.55, -0.2)} ${p(1.3, 0.6)} C${p(1.25, 0.9)} ${p(1.1, 1.1)} ${p(1.0, 1.25)} C${p(1.05, 0.6)} ${p(0.95, 0.0)} ${p(0.62, -0.6)}Z`, c) +
        `<path d="M${p(1.05, -0.7)} Q${p(1.35, -0.2)} ${p(1.15, 0.7)}" stroke="${light(c, 0.4)}" stroke-width="${f(R * 0.05)}" fill="none" stroke-linecap="round" opacity="0.5"/>` + tie(R * 0.62, hy - R * 0.86, R);
    },
  },
  {
    top: true,
    id: 'bun', name: 'Top Bun', price: 20, bangs: 'part', locks: true,
    back: (b, c) => {
      const { R, headY: hy } = b;
      return capBack(b, c) + `<circle cx="0" cy="${f(hy - R * 1.05)}" r="${f(R * 0.44)}" fill="${c}"/><circle cx="0" cy="${f(hy - R * 1.05)}" r="${f(R * 0.44)}" fill="url(#g-shine)"/>` +
        `<path d="M${f(-R * 0.25)} ${f(hy - R * 1.2)} Q0 ${f(hy - R * 1.38)} ${f(R * 0.22)} ${f(hy - R * 1.22)}" stroke="${light(c, 0.5)}" stroke-width="${f(R * 0.06)}" fill="none" stroke-linecap="round" opacity="0.5"/>` +
        `<ellipse cx="0" cy="${f(hy - R * 0.7)}" rx="${f(R * 0.3)}" ry="${f(R * 0.08)}" fill="#ff7eb6"/>`;
    },
  },
  {
    top: true,
    id: 'spacebuns', name: 'Space Buns', price: 30, bangs: 'blunt', locks: true,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      for (const sd of [-1, 1]) {
        s += `<circle cx="${f(sd * R * 0.66)}" cy="${f(hy - R * 0.86)}" r="${f(R * 0.34)}" fill="${c}"/><circle cx="${f(sd * R * 0.66)}" cy="${f(hy - R * 0.86)}" r="${f(R * 0.34)}" fill="url(#g-shine)"/>`;
        s += `<path d="M${f(sd * R * 0.5)} ${f(hy - R * 1.0)} Q${f(sd * R * 0.66)} ${f(hy - R * 1.12)} ${f(sd * R * 0.82)} ${f(hy - R * 1.0)}" stroke="${light(c, 0.5)}" stroke-width="${f(R * 0.05)}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
      }
      return s;
    },
  },
  {
    id: 'braids', name: 'Two Braids', price: 40, bangs: 'part', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const y = hy + R * (0.25 + i * 0.25);
          const x = sd * R * (0.98 + Math.sin(i * 0.8) * 0.03);
          s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R * 0.2)}" ry="${f(R * 0.17)}" fill="${i % 2 ? c : dark(c, 0.08)}"/>`;
          s += `<path d="M${f(x - R * 0.14)} ${f(y - R * 0.04)} Q${f(x)} ${f(y + R * 0.08)} ${f(x + R * 0.14)} ${f(y - R * 0.04)}" stroke="${dark(c, 0.3)}" stroke-width="1.5" fill="none" opacity="0.6"/>`;
        }
        const ty = hy + R * 1.72;
        s += tie(sd * R * 0.98, ty, R) + `<path d="M${f(sd * R * 0.98 - 8)} ${f(ty + 4)} Q${f(sd * R * 0.98)} ${f(ty + R * 0.3)} ${f(sd * R * 0.98 + 8)} ${f(ty + 4)}Z" fill="${c}"/>`;
      }
      return s;
    },
  },
  {
    id: 'curly', name: 'Curly Puff', price: 40, bangs: 'curly', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = `<circle cx="0" cy="${f(hy - R * 0.1)}" r="${f(R * 1.25)}" fill="${dark(c, 0.12)}"/>`;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        s += `<circle cx="${f(Math.cos(a) * R * 1.22)}" cy="${f(hy - R * 0.1 + Math.sin(a) * R * 1.16)}" r="${f(R * 0.3)}" fill="${dark(c, 0.12)}"/>`;
      }
      return s + `<circle cx="0" cy="${f(hy - R * 0.1)}" r="${f(R * 1.45)}" fill="url(#g-shadeX)"/>`;
    },
  },
  {
    id: 'pixie', name: 'Pixie Cut', price: 0, bangs: 'sweep', locks: false,
    back: (b, c) => capBack(b, c, 1.08, 0.35),
  },
  {
    id: 'sidepony', name: 'Side Ponytail', price: 25, bangs: 'side', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return capBack(b, c) + backShape(`M${p(-0.9, -0.2)} C${p(-1.6, -0.1)} ${p(-1.5, 0.9)} ${p(-1.2, 1.5)} C${p(-1.1, 1.1)} ${p(-0.95, 0.7)} ${p(-0.95, 0.3)}Z`, c) + tie(-R * 1.0, hy - R * 0.12, R);
    },
  },
  {
    id: 'princess', name: 'Princess Curls', price: 60, bangs: 'part',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      let s = backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.18, 1.5)} L${p(-1.18, 1.5)}Z`, c);
      for (const [x, y] of [[-1.05, 1.55], [-0.7, 1.65], [0.7, 1.65], [1.05, 1.55], [-1.18, 1.1], [1.18, 1.1]]) {
        s += `<circle cx="${f(x * R)}" cy="${f(hy + y * R)}" r="${f(R * 0.24)}" fill="${dark(c, 0.12)}"/><path d="M${f(x * R - R * 0.12)} ${f(hy + y * R)} a${f(R * 0.12)} ${f(R * 0.12)} 0 1 1 ${f(R * 0.12)} ${f(R * 0.12)}" stroke="${light(c, 0.3)}" stroke-width="2.5" fill="none"/>`;
      }
      return s;
    },
  },
  {
    id: 'short', name: 'Short & Sporty', price: 0, bangs: 'short',
    back: (b, c) => capBack(b, c, 1.07, 0.2),
  },
  {
    id: 'longcurly', name: 'Long Curls', price: 50, bangs: 'curly', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c, 1.08, 0.2);
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const y = hy + R * (0.1 + i * 0.28);
          for (let k = 0; k < 2; k++) {
            const x = sd * R * (0.85 + k * 0.32);
            s += `<circle cx="${f(x)}" cy="${f(y + k * R * 0.12)}" r="${f(R * 0.22)}" fill="${dark(c, 0.1 + ((i + k) % 2) * 0.06)}"/>`;
          }
        }
      }
      return s;
    },
  },
  {
    top: true,
    id: 'halfup', name: 'Half-Up Bow', price: 30, bangs: 'part',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.12, 1.4)} Q${p(1.0, 1.7)} ${p(0.6, 1.6)} L${p(-0.6, 1.6)} Q${p(-1.0, 1.7)} ${p(-1.12, 1.4)}Z`, c);
    },
    over: (b) => `<g transform="translate(${f(b.R * 0.35)} ${f(b.headY - b.R * 0.95)}) rotate(14) scale(${f(b.R / 80)})">${bowShape('#ff7eb6')}</g>`,
  },
  {
    top: true,
    id: 'messybun', name: 'Messy Bun', price: 25, bangs: 'sweep', locks: true,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      for (const [dx, dy, r] of [[0, -1.08, 0.34], [-0.2, -1.0, 0.24], [0.22, -1.02, 0.25], [0.05, -1.28, 0.2]]) s += `<circle cx="${f(dx * R)}" cy="${f(hy + dy * R)}" r="${f(r * R)}" fill="${c}"/>`;
      s += `<path d="M${f(-R * 0.1)} ${f(hy - R * 1.36)} q${f(-R * 0.2)} ${f(-R * 0.12)} ${f(-R * 0.3)} 0 M${f(R * 0.2)} ${f(hy - R * 1.3)} q${f(R * 0.18)} ${f(-R * 0.14)} ${f(R * 0.28)} ${f(R * 0.02)}" stroke="${c}" stroke-width="${f(R * 0.06)}" fill="none" stroke-linecap="round"/>`;
      return s + `<circle cx="0" cy="${f(hy - R * 1.08)}" r="${f(R * 0.4)}" fill="url(#g-shine)"/><ellipse cx="0" cy="${f(hy - R * 0.8)}" rx="${f(R * 0.28)}" ry="${f(R * 0.07)}" fill="#c99bff"/>`;
    },
  },
  {
    top: true,
    id: 'crownbraid', name: 'Crown Braid', price: 45, bangs: 'part', locks: true,
    back: (b, c) => capBack(b, c, 1.08, 0.25),
    over: (b, c) => {
      const { R, headY: hy } = b;
      let s = '';
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * (1.02 + (i / 10) * 0.96);
        const x = Math.cos(a) * R * 0.94;
        const y = hy - R * 0.14 + Math.sin(a) * R * 0.86;
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R * 0.15)}" ry="${f(R * 0.11)}" fill="${i % 2 ? c : dark(c, 0.12)}" transform="rotate(${f((a * 180) / Math.PI + 90 + (i % 2 ? 25 : -25))} ${f(x)} ${f(y)})"/>`;
      }
      return s + `<circle cx="${f(R * 0.72)}" cy="${f(hy - R * 0.62)}" r="${f(R * 0.1)}" fill="#ffd9e8"/><circle cx="${f(R * 0.72)}" cy="${f(hy - R * 0.62)}" r="${f(R * 0.04)}" fill="#ffd36b"/>`;
    },
  },
  {
    id: 'afro', name: 'Big Afro', price: 0, bangs: 'curly', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = `<circle cx="0" cy="${f(hy - R * 0.2)}" r="${f(R * 1.42)}" fill="${dark(c, 0.1)}"/>`;
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        s += `<circle cx="${f(Math.cos(a) * R * 1.38)}" cy="${f(hy - R * 0.2 + Math.sin(a) * R * 1.3)}" r="${f(R * 0.26)}" fill="${dark(c, 0.1)}"/>`;
      }
      return s + `<circle cx="0" cy="${f(hy - R * 0.2)}" r="${f(R * 1.6)}" fill="url(#g-shadeX)"/><path d="M${f(-R * 0.9)} ${f(hy - R * 1.1)} Q${f(-R * 0.3)} ${f(hy - R * 1.6)} ${f(R * 0.4)} ${f(hy - R * 1.45)}" stroke="${light(c, 0.35)}" stroke-width="${f(R * 0.1)}" fill="none" stroke-linecap="round" opacity="0.4"/>`;
    },
  },
  {
    id: 'hime', name: 'Sleek Long', price: 35, bangs: 'blunt',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.1, 1.9)} L${p(-1.1, 1.9)}Z`, c) +
        backShape(`M${p(0.86, 0.1)} L${p(1.06, 0.1)} L${p(1.06, 0.8)} L${p(0.84, 0.8)}Z M${p(-0.86, 0.1)} L${p(-1.06, 0.1)} L${p(-1.06, 0.8)} L${p(-0.84, 0.8)}Z`, light(c, 0.05));
    },
  },
  {
    id: 'mermaid', name: 'Mermaid Waves', price: 60, bangs: 'side',
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      let d = `M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)}`;
      for (let i = 1; i <= 6; i++) d += ` Q${p(i % 2 ? 1.38 : 1.0, i * 0.36 - 0.18)} ${p(1.16, i * 0.36)}`;
      d += ` Q${p(0.6, 2.4)} ${p(0, 2.25)} Q${p(-0.6, 2.4)} ${p(-1.16, 2.16)}`;
      for (let i = 5; i >= 0; i--) d += ` Q${p(i % 2 ? -1.38 : -1.0, i * 0.36 + 0.18)} ${p(-1.16, i * 0.36)}`;
      return backShape(d + 'Z', c) + `<path d="M${p(0.9, 0.6)} Q${p(1.2, 1.2)} ${p(0.95, 1.9)}" stroke="${light(c, 0.4)}" stroke-width="${f(R * 0.05)}" fill="none" opacity="0.5"/>`;
    },
  },
  {
    id: 'fishtail', name: 'Side Fishtail', price: 40, bangs: 'side', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      s += backShape(`M${f(R * 0.7)} ${f(hy - R * 0.2)} Q${f(R * 1.15)} ${f(hy - R * 0.1)} ${f(R * 1.1)} ${f(hy + R * 0.3)} L${f(R * 0.86)} ${f(hy + R * 0.3)}Z`, c);
      for (let i = 0; i < 7; i++) {
        const x = R * (0.98 + Math.sin(i * 0.6) * 0.04);
        const y = hy + R * (0.28 + i * 0.22);
        const w = R * (0.22 - i * 0.012);
        s += `<path d="M${f(x - w)} ${f(y - R * 0.04)} Q${f(x - w * 0.2)} ${f(y + R * 0.2)} ${f(x + w * 0.15)} ${f(y + R * 0.08)} Q${f(x - w * 0.3)} ${f(y - R * 0.1)} ${f(x - w)} ${f(y - R * 0.04)}Z" fill="${dark(c, 0.06)}"/>`;
        s += `<path d="M${f(x + w)} ${f(y - R * 0.04)} Q${f(x + w * 0.2)} ${f(y + R * 0.2)} ${f(x - w * 0.15)} ${f(y + R * 0.08)} Q${f(x + w * 0.3)} ${f(y - R * 0.1)} ${f(x + w)} ${f(y - R * 0.04)}Z" fill="${dark(c, 0.16)}"/>`;
      }
      return s + tie(R * 0.98, hy + R * 1.75, R) + `<path d="M${f(R * 0.9)} ${f(hy + R * 1.8)} Q${f(R * 0.98)} ${f(hy + R * 2.05)} ${f(R * 1.06)} ${f(hy + R * 1.8)}Z" fill="${c}"/>`;
    },
  },
  {
    id: 'curlybob', name: 'Curly Bob', price: 20, bangs: 'curly', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c, 1.1, 0.5);
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) s += `<circle cx="${f(sd * R * (1.02 + (i % 2) * 0.12))}" cy="${f(hy + R * (0.05 + i * 0.22))}" r="${f(R * 0.2)}" fill="${dark(c, 0.12)}"/>`;
      for (let i = -2; i <= 2; i++) s += `<circle cx="${f(i * R * 0.42)}" cy="${f(hy + R * 0.82)}" r="${f(R * 0.18)}" fill="${dark(c, 0.12)}"/>`;
      return s;
    },
  },
  {
    top: true,
    id: 'highpigs', name: 'Bouncy Pigtails', price: 30, bangs: 'blunt', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c);
      for (const sd of [-1, 1]) {
        const p = (x: number, y: number) => `${f(sd * x * R)} ${f(hy + y * R)}`;
        s += backShape(`M${p(0.62, -0.82)} C${p(1.5, -1.3)} ${p(1.8, -0.2)} ${p(1.45, 0.5)} C${p(1.4, 0.2)} ${p(1.2, -0.1)} ${p(1.0, -0.2)} C${p(0.9, -0.4)} ${p(0.75, -0.6)} ${p(0.62, -0.82)}Z`, c);
        s += `<g transform="translate(${f(sd * R * 0.7)} ${f(hy - R * 0.84)}) scale(${f(R / 140)})">${bowShape('#ff4f8b')}</g>`;
      }
      return s;
    },
  },
  {
    id: 'locs', name: 'Long Locs', price: 40, bangs: 'part', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = capBack(b, c, 1.08, 0.2);
      for (let i = 0; i < 10; i++) {
        const x = -R * 1.05 + (i / 9) * R * 2.1;
        const len = R * (1.4 + ((i * 7) % 4) * 0.08);
        s += `<path d="M${f(x)} ${f(hy - R * 0.1)} Q${f(x + (i % 2 ? 6 : -6))} ${f(hy + len * 0.5)} ${f(x + (i < 5 ? -8 : 8))} ${f(hy + len)}" stroke="${i % 2 ? dark(c, 0.08) : dark(c, 0.16)}" stroke-width="${f(R * 0.15)}" fill="none" stroke-linecap="round"/>`;
      }
      return s + `<circle cx="${f(-R * 0.96)}" cy="${f(hy + R * 1.2)}" r="${f(R * 0.06)}" fill="url(#g-gold)"/><circle cx="${f(R * 0.86)}" cy="${f(hy + R * 1.0)}" r="${f(R * 0.06)}" fill="url(#g-gold)"/>`;
    },
  },
  {
    id: 'buzz', name: 'Buzz Cut', price: 0, bangs: 'buzz', locks: false,
    back: (b, c) => capBack(b, c, 1.04, 0.12),
  },
  {
    top: true,
    id: 'spiky', name: 'Spiky', price: 0, bangs: 'short', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      let s = '';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.08 + (i / 8) * 0.84);
        const x0 = Math.cos(a - 0.12) * R * 0.98, y0 = hy + Math.sin(a - 0.12) * R * 0.96;
        const x1 = Math.cos(a) * R * 1.32, y1 = hy - R * 0.06 + Math.sin(a) * R * 1.28;
        const x2 = Math.cos(a + 0.12) * R * 0.98, y2 = hy + Math.sin(a + 0.12) * R * 0.96;
        s += `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}Z" fill="${dark(c, 0.12)}"/>`;
      }
      return s + capBack(b, c, 1.06, 0.18);
    },
  },
  {
    id: 'sidepart', name: 'Side Part', price: 0, bangs: 'sidepart', locks: false,
    back: (b, c) => capBack(b, c, 1.07, 0.2),
  },
  {
    top: true,
    id: 'swoop', name: 'Swoop Quiff', price: 25, bangs: 'buzz', locks: false,
    back: (b, c) => capBack(b, c, 1.06, 0.15),
    over: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      const d = `M${p(-0.84, -0.18)} C${p(-0.9, -0.9)} ${p(-0.1, -1.38)} ${p(0.7, -1.16)} C${p(1.0, -1.06)} ${p(0.98, -0.8)} ${p(0.84, -0.6)} C${p(0.5, -0.72)} ${p(0.0, -0.66)} ${p(-0.4, -0.44)} C${p(-0.6, -0.34)} ${p(-0.76, -0.26)} ${p(-0.84, -0.18)}Z`;
      return `<path d="${d}" fill="${c}"/><path d="${d}" fill="url(#g-shine)"/><path d="M${p(-0.5, -0.8)} Q${p(0.1, -1.18)} ${p(0.7, -1.02)}" stroke="${light(c, 0.5)}" stroke-width="${f(R * 0.07)}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
    },
  },
  {
    top: true,
    id: 'curlytop', name: 'Curly Top', price: 20, bangs: 'buzz', locks: false,
    back: (b, c) => capBack(b, c, 1.05, 0.15),
    over: (b, c) => {
      const { R, headY: hy } = b;
      let s = '';
      const pts = [[-0.62, -0.62], [-0.36, -0.86], [-0.05, -0.96], [0.28, -0.92], [0.58, -0.72], [-0.2, -0.66], [0.15, -0.7], [0.45, -0.52], [-0.48, -0.46]];
      for (const [x, y] of pts) s += `<circle cx="${f(x * R)}" cy="${f(hy + y * R)}" r="${f(R * 0.2)}" fill="${c}"/><path d="M${f(x * R - R * 0.09)} ${f(hy + y * R)} a${f(R * 0.09)} ${f(R * 0.09)} 0 1 1 ${f(R * 0.09)} ${f(R * 0.09)}" stroke="${dark(c, 0.25)}" stroke-width="${f(R * 0.022)}" fill="none" opacity="0.6"/>`;
      return s;
    },
  },
  {
    top: true,
    id: 'mohawk', name: 'Soft Mohawk', price: 35, bangs: 'buzz', locks: false,
    back: (b, c) => capBack(b, c, 1.04, 0.1),
    over: (b, c) => {
      const { R, headY: hy } = b;
      let s = '';
      for (let i = 0; i < 6; i++) {
        const y = hy - R * (0.5 + i * 0.12);
        const h = R * (0.36 + Math.sin((i / 5) * Math.PI) * 0.2);
        s += `<path d="M${f(-R * 0.26)} ${f(y + R * 0.12)} Q${f(-R * 0.18)} ${f(y - h)} ${f(R * 0.1)} ${f(y - h * 1.05)} Q${f(R * 0.06)} ${f(y - h * 0.4)} ${f(R * 0.26)} ${f(y + R * 0.12)}Z" fill="${i % 2 ? c : dark(c, 0.1)}"/>`;
      }
      return s;
    },
  },
  {
    top: true,
    id: 'manbun', name: 'Top Knot', price: 30, bangs: 'sidepart', locks: false,
    back: (b, c) => {
      const { R, headY: hy } = b;
      return capBack(b, c, 1.07, 0.2) + `<circle cx="${f(R * 0.1)}" cy="${f(hy - R * 1.08)}" r="${f(R * 0.27)}" fill="${c}"/><circle cx="${f(R * 0.1)}" cy="${f(hy - R * 1.08)}" r="${f(R * 0.27)}" fill="url(#g-shine)"/><ellipse cx="${f(R * 0.1)}" cy="${f(hy - R * 0.86)}" rx="${f(R * 0.18)}" ry="${f(R * 0.06)}" fill="${dark(c, 0.3)}"/>`;
    },
  },
  {
    id: 'shaggy', name: 'Shaggy', price: 20, bangs: 'sweep', locks: true,
    back: (b, c) => {
      const { R, headY: hy } = b;
      const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
      return backShape(`M${p(-1.06, 0)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0)} L${p(1.14, 0.5)} L${p(1.0, 0.42)} L${p(1.08, 0.72)} L${p(0.86, 0.6)} L${p(0.6, 0.7)} L${p(-0.6, 0.7)} L${p(-0.86, 0.6)} L${p(-1.08, 0.72)} L${p(-1.0, 0.42)} L${p(-1.14, 0.5)}Z`, c);
    },
  },
  {
    top: true,
    id: 'flattop', name: 'Flat Top', price: 25, bangs: 'buzz', locks: false,
    back: (b, c) => capBack(b, c, 1.04, 0.1),
    over: (b, c) => {
      const { R, headY: hy } = b;
      const d = `M${f(-R * 0.86)} ${f(hy - R * 0.48)} Q${f(-R * 0.9)} ${f(hy - R * 0.98)} ${f(-R * 0.66)} ${f(hy - R * 1.1)} Q${f(0)} ${f(hy - R * 1.17)} ${f(R * 0.66)} ${f(hy - R * 1.1)} Q${f(R * 0.9)} ${f(hy - R * 0.98)} ${f(R * 0.86)} ${f(hy - R * 0.48)} Q0 ${f(hy - R * 0.62)} ${f(-R * 0.86)} ${f(hy - R * 0.48)}Z`;
      return `<path d="${d}" fill="${c}"/><path d="${d}" fill="url(#g-shadeX)"/>`;
    },
  },
];
export const HAIR_BY_ID: Record<string, HairStyle> = Object.fromEntries(HAIR.map((h) => [h.id, h]));

// ---------------- face ----------------
export const EYE_STYLES = [
  { id: 'round', name: 'Round' },
  { id: 'lashes', name: 'Lashes' },
  { id: 'sparkle', name: 'Sparkly' },
  { id: 'almond', name: 'Almond' },
  { id: 'sleepy', name: 'Dreamy' },
  { id: 'happy', name: 'Smiley' },
];
export const MOUTHS = [
  { id: 'smile', name: 'Smile' },
  { id: 'grin', name: 'Big Grin' },
  { id: 'cat', name: 'Kitty' },
  { id: 'o', name: 'Ooh' },
  { id: 'tongue', name: 'Silly' },
  { id: 'teeth', name: 'Cheese' },
  { id: 'smirk', name: 'Smirk' },
];
export const STICKERS = [
  { id: 'heart', name: 'Heart' },
  { id: 'star', name: 'Star' },
  { id: 'sparkle', name: 'Sparkle' },
  { id: 'flower', name: 'Flower' },
];

function eyes(b: Body, look: Look, expr: Expr): string {
  const { R, headY: hy } = b;
  const ex = R * 0.38;
  const ey = hy + R * 0.12;
  const ink = '#2a1626';
  const style = look.eyes;
  const closed = expr === 'happy' || expr === 'yum' || style === 'happy';
  let s = '';
  if (look.shadow && !closed && expr !== 'sleep') {
    for (const sd of [-1, 1]) s += `<ellipse cx="${f(sd * ex)}" cy="${f(ey - R * 0.1)}" rx="${f(R * 0.2)}" ry="${f(R * 0.12)}" fill="${look.shadow}" opacity="0.55"/>`;
  }
  if (expr === 'sleep') {
    for (const sd of [-1, 1]) s += `<path d="M${f(sd * ex - R * 0.12)} ${f(ey)} Q${f(sd * ex)} ${f(ey + R * 0.1)} ${f(sd * ex + R * 0.12)} ${f(ey)}" stroke="${ink}" stroke-width="${f(R * 0.04)}" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  if (closed) {
    for (const sd of [-1, 1]) s += `<path d="M${f(sd * ex - R * 0.13)} ${f(ey + R * 0.04)} Q${f(sd * ex)} ${f(ey - R * 0.14)} ${f(sd * ex + R * 0.13)} ${f(ey + R * 0.04)}" stroke="${ink}" stroke-width="${f(R * 0.045)}" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  const rx = R * 0.14;
  const ry = style === 'almond' ? R * 0.13 : R * 0.17;
  let open = '';
  for (const sd of [-1, 1]) {
    const cx = sd * ex;
    open += `<g class="look">`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey)}" rx="${f(rx)}" ry="${f(ry)}" fill="${look.eyeColor}"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey - ry * 0.35)}" rx="${f(rx)}" ry="${f(ry * 0.65)}" fill="${ink}" opacity="0.28"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey + R * 0.01)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.6)}" fill="#1d1020"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey + ry * 0.55)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.25)}" fill="${light(look.eyeColor, 0.5)}" opacity="0.7"/>`;
    open += `<circle cx="${f(cx - rx * 0.38)}" cy="${f(ey - ry * 0.38)}" r="${f(R * 0.05)}" fill="#fff"/>`;
    open += `<circle cx="${f(cx + rx * 0.4)}" cy="${f(ey + ry * 0.35)}" r="${f(R * 0.022)}" fill="#fff"/>`;
    if (style === 'sparkle') open += `<path d="${sparkleD(cx + rx * 0.3, ey - ry * 0.1, R * 0.05)}" fill="#fff"/>`;
    open += `</g>`;
    // upper lid line with outer flick
    const flick = look.boy ? '' : ` L${f(cx + sd * rx * 1.5)} ${f(ey - ry * 0.75)}`;
    open += `<path d="M${f(cx - sd * rx * 1.15)} ${f(ey - ry * 0.25)} Q${f(cx)} ${f(ey - ry * 1.55)} ${f(cx + sd * rx * 1.25)} ${f(ey - ry * 0.45)}${flick}" stroke="${ink}" stroke-width="${f(R * (look.boy ? 0.036 : 0.042))}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (style === 'lashes' || style === 'sparkle') {
      for (let i = 0; i < 3; i++) {
        const a = -0.5 - i * 0.45;
        const bx = cx + sd * rx * (0.55 + i * 0.25);
        const by = ey - ry * (1.0 - i * 0.2);
        open += `<path d="M${f(bx)} ${f(by)} l${f(sd * Math.cos(a) * R * 0.08)} ${f(Math.sin(a) * R * 0.1 - R * 0.02)}" stroke="${ink}" stroke-width="${f(R * 0.03)}" stroke-linecap="round"/>`;
      }
    }
    if (style === 'sleepy') {
      open += `<path d="M${f(cx - rx * 1.2)} ${f(ey - ry * 0.05)} Q${f(cx)} ${f(ey - ry * 1.7)} ${f(cx + rx * 1.2)} ${f(ey - ry * 0.05)}Z" fill="${look.skin}"/>`;
      open += `<path d="M${f(cx - rx * 1.2)} ${f(ey - ry * 0.05)} Q${f(cx)} ${f(ey - ry * 0.3)} ${f(cx + rx * 1.2)} ${f(ey - ry * 0.05)}" stroke="${ink}" stroke-width="${f(R * 0.04)}" fill="none" stroke-linecap="round"/>`;
    }
  }
  return s + `<g class="eyes">${open}</g>`;
}

function mouth(b: Body, look: Look, expr: Expr): string {
  const { R, headY: hy } = b;
  const y = hy + R * 0.47;
  const lip = look.lips ?? '#8a2a3f';
  const line = look.lips ?? '#7a2a3a';
  const lw = R * (look.lips ? 0.05 : 0.035);
  let m = look.mouth;
  if (expr === 'happy') m = 'grin';
  if (expr === 'surprised') m = 'o';
  if (expr === 'yum') m = 'tongue';
  if (expr === 'sleep') m = 'o';
  const k = (n: number) => f(n * R);
  switch (m) {
    case 'grin':
      return `<path d="M-${k(0.13)} ${f(y - R * 0.02)} Q0 ${f(y + R * 0.22)} ${k(0.13)} ${f(y - R * 0.02)}Z" fill="${dark(lip, 0.1)}"/><ellipse cx="0" cy="${f(y + R * 0.1)}" rx="${k(0.06)}" ry="${k(0.035)}" fill="#ff8aa5"/>`;
    case 'teeth':
      return `<path d="M-${k(0.15)} ${f(y - R * 0.02)} Q0 ${f(y + R * 0.22)} ${k(0.15)} ${f(y - R * 0.02)}Z" fill="${dark(lip, 0.1)}"/><path d="M-${k(0.13)} ${f(y)} L${k(0.13)} ${f(y)} Q0 ${f(y + R * 0.07)} -${k(0.13)} ${f(y)}Z" fill="#fff"/>`;
    case 'cat':
      return `<path d="M-${k(0.12)} ${f(y)} Q-${k(0.06)} ${f(y + R * 0.08)} 0 ${f(y)} Q${k(0.06)} ${f(y + R * 0.08)} ${k(0.12)} ${f(y)}" stroke="${line}" stroke-width="${f(lw)}" fill="none" stroke-linecap="round"/>`;
    case 'o':
      return `<ellipse cx="0" cy="${f(y + R * 0.03)}" rx="${k(expr === 'sleep' ? 0.03 : 0.05)}" ry="${k(expr === 'sleep' ? 0.035 : 0.065)}" fill="${dark(lip, 0.1)}"/>`;
    case 'tongue':
      return `<path d="M-${k(0.11)} ${f(y)} Q0 ${f(y + R * 0.1)} ${k(0.11)} ${f(y)}" stroke="${line}" stroke-width="${f(lw)}" fill="none" stroke-linecap="round"/><path d="M${k(0.0)} ${f(y + R * 0.04)} q${k(0.04)} ${k(0.12)} ${k(0.08)} 0Z" fill="#ff7a95"/>`;
    case 'smirk':
      return `<path d="M-${k(0.08)} ${f(y + R * 0.03)} Q${k(0.04)} ${f(y + R * 0.06)} ${k(0.12)} ${f(y - R * 0.03)}" stroke="${line}" stroke-width="${f(lw)}" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M-${k(0.1)} ${f(y)} Q0 ${f(y + R * 0.1)} ${k(0.1)} ${f(y)}" stroke="${line}" stroke-width="${f(lw)}" fill="none" stroke-linecap="round"/>`;
  }
}

function sticker(id: string, x: number, y: number, s: number): string {
  switch (id) {
    case 'heart':
      return `<path d="${heartD(x, y - s * 0.5, s * 0.6)}" fill="#ff4f8b"/>`;
    case 'star':
      return `<path d="${starD(x, y, s * 0.6)}" fill="#ffd24a"/>`;
    case 'sparkle':
      return `<path d="${sparkleD(x, y, s * 0.6)}" fill="#7cc8ff"/><path d="${sparkleD(x + s * 0.5, y - s * 0.5, s * 0.25)}" fill="#c99bff"/>`;
    case 'flower': {
      let g = '';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g += `<circle cx="${f(x + Math.cos(a) * s * 0.3)}" cy="${f(y + Math.sin(a) * s * 0.3)}" r="${f(s * 0.24)}" fill="#ff9ec7"/>`;
      }
      return g + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.18)}" fill="#ffd36b"/>`;
    }
  }
  return '';
}

function head(b: Body, look: Look, expr: Expr): string {
  const { R, headY: hy } = b;
  const skin = look.skin;
  let s = '';
  for (const sd of [-1, 1]) {
    s += `<circle cx="${f(sd * R * 0.97)}" cy="${f(hy + R * 0.14)}" r="${f(R * 0.16)}" fill="${skin}"/><circle cx="${f(sd * R * 0.98)}" cy="${f(hy + R * 0.15)}" r="${f(R * 0.08)}" fill="${dark(skin, 0.12)}"/>`;
  }
  s += `<ellipse cx="0" cy="${f(hy)}" rx="${f(R)}" ry="${f(R * 0.93)}" fill="${skin}" stroke="${dark(skin, 0.16)}" stroke-width="${f(R * 0.018)}"/><ellipse cx="0" cy="${f(hy)}" rx="${f(R)}" ry="${f(R * 0.93)}" fill="url(#g-face)"/>`;
  const bl = look.blush ?? '#ff9db5';
  for (const sd of [-1, 1]) {
    s += `<ellipse cx="${f(sd * R * 0.6)}" cy="${f(hy + R * 0.38)}" rx="${f(R * 0.15)}" ry="${f(R * 0.09)}" fill="${bl}" opacity="${look.blush ? 0.6 : 0.28}"/>`;
    if (look.blush) for (let i = 0; i < 3; i++) s += `<path d="M${f(sd * R * 0.6 - R * 0.07 + i * R * 0.06)} ${f(hy + R * 0.42)} l${f(R * 0.03)} ${f(-R * 0.06)}" stroke="#fff" stroke-width="${f(R * 0.018)}" stroke-linecap="round" opacity="0.7"/>`;
  }
  if (look.freckles) {
    for (const sd of [-1, 1]) for (const [dx, dy] of [[0.36, 0.3], [0.46, 0.27], [0.42, 0.36], [0.52, 0.34]]) s += `<circle cx="${f(sd * dx * R)}" cy="${f(hy + dy * R)}" r="${f(R * 0.018)}" fill="${dark(skin, 0.35)}" opacity="0.7"/>`;
  }
  s += eyes(b, look, expr);
  const brow = dark(look.hairColor, 0.35);
  const by = hy + R * (expr === 'surprised' ? -0.3 : -0.2);
  const bw = look.boy ? 0.055 : 0.035;
  const arch = look.boy ? 0.015 : 0.04;
  for (const sd of [-1, 1]) s += `<path d="M${f(sd * R * 0.26)} ${f(by + R * 0.02)} Q${f(sd * R * 0.38)} ${f(by - R * arch)} ${f(sd * R * 0.51)} ${f(by + R * 0.02)}" stroke="${brow}" stroke-width="${f(R * bw)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  s += `<ellipse cx="0" cy="${f(hy + R * 0.3)}" rx="${f(R * 0.035)}" ry="${f(R * 0.024)}" fill="${dark(skin, 0.2)}"/><circle cx="${f(-R * 0.012)}" cy="${f(hy + R * 0.29)}" r="${f(R * 0.01)}" fill="#fff" opacity="0.7"/>`;
  s += mouth(b, look, expr);
  if (look.lips && expr !== 'sleep') s += `<ellipse cx="${f(-R * 0.04)}" cy="${f(hy + R * 0.49)}" rx="${f(R * 0.025)}" ry="${f(R * 0.012)}" fill="#fff" opacity="0.7"/>`;
  if (look.sticker) s += sticker(look.sticker, R * 0.66, hy + R * 0.5, R * 0.2);
  return s;
}

// ---------------- composition ----------------
/** Hats that sit over the crown of the head (not headbands, clips or ears). */
export const COVERS = /beanie|hat\b|hat-|cap\b|cap-|helmet|hood|beret|fedora|newsboy|bandana|santa|witch|visor|bucket|beanie|toque|earflap|chef|pirate|cowboy/i;

export interface DollOpts {
  pose?: Pose;
  expr?: Expr;
  headOnly?: boolean;
}

const UNDIES_TOP = (b: Body, skin: string) => {
  void skin;
  const d = torsoPath(b, { hemY: b.hipY + 2, topY: b.shY + 18 });
  return cloth(d, '#ffffff', 'none') + [-1, 1].map((s) => `<path d="M${s * 14 - 2.5} ${b.shY} L${s * 14 + 2.5} ${b.shY} L${s * 16 + 2.5} ${b.shY + 19} L${s * 16 - 2.5} ${b.shY + 19}Z" fill="#f3eaf3"/>`).join('');
};
const UNDIES_BOTTOM = (b: Body) => {
  const wx = b.waW + 1;
  const lx = b.legX + b.legW / 2 + 2;
  if (b.boy) {
    const d = `M${-wx} ${b.waistY + 6} L${wx} ${b.waistY + 6} L${lx + 3} ${b.hipY + 18} L3 ${b.hipY + 18} Q0 ${b.hipY + 8} -3 ${b.hipY + 18} L${-lx - 3} ${b.hipY + 18}Z`;
    return cloth(d, '#9fd6ff', 'stars') + `<rect x="${-wx}" y="${b.waistY + 4}" width="${wx * 2}" height="6" rx="3" fill="#ffffff"/>`;
  }
  return `<path d="M${-wx} ${b.waistY + 8} L${wx} ${b.waistY + 8} Q${b.hiW + 2} ${b.hipY - 6} ${lx} ${b.hipY + 8} L3 ${b.hipY + 8} Q0 ${b.hipY + 2} -3 ${b.hipY + 8} L${-lx} ${b.hipY + 8} Q${-b.hiW - 2} ${b.hipY - 6} ${-wx} ${b.waistY + 8}Z" fill="#ffd9e8"/>` +
    `<g transform="translate(0 ${b.waistY + 12}) scale(0.28)">${bowG(0, 0, 1, '#ff7eb6')}</g>`;
};

export function renderDoll(look: Look, opts: DollOpts = {}): string {
  const pose = opts.pose ?? 'stand';
  const expr = opts.expr ?? (pose === 'sleep' ? 'sleep' : 'normal');
  const b = body(look.age, !!look.boy);
  const seated = pose === 'sit' || pose === 'sleep';
  const L = seated ? b.legLen * 0.42 : b.legLen;
  let hair = HAIR_BY_ID[look.hair] ?? HAIR[0];
  const worn = (slot: Slot) => {
    const w = look.wear[slot];
    const def = w ? WEAR_BY_ID[w.id] : undefined;
    return def && w ? { def, w } : null;
  };
  const dressOn = worn('dress');
  const order: Slot[] = dressOn ? ['dress', 'outer'] : ['bottom', 'top', 'outer'];
  const ctx = (slot: Slot, angle = 0): WearCtx | null => {
    const it = worn(slot);
    if (!it) return null;
    return { b, c: it.def.fixed ? it.def.color : it.w.color, p: it.w.pattern, pose, L, armAngle: angle, skin: look.skin };
  };
  const call = (slot: Slot, layer: 'back' | 'body' | 'over' | 'head' | 'hand', angle = 0) => {
    const it = worn(slot);
    const x = ctx(slot, angle);
    const fn = it?.def[layer];
    return it && x && fn ? fn(x) : '';
  };

  // A hat that covers the top of the head tucks away buns, spikes and the like.
  const hatDef = worn('head')?.def;
  const covered = !!hatDef && COVERS.test(`${hatDef.id} ${hatDef.name}`);
  if (covered && hair.top) hair = { ...hair, back: (bb, c) => capBack(bb, c), over: undefined };

  if (opts.headOnly) {
    return hair.back(b, look.hairColor) + head(b, look, expr) + hairFront(b, hair, look.hairColor) + (hair.over?.(b, look.hairColor) ?? '') + call('face', 'head') + call('head', 'head');
  }

  const armA = pose === 'held' ? 118 : pose === 'sit' ? 14 : pose === 'sleep' ? 4 : 9;
  const armAngle = (side: 1 | -1) => (pose === 'wave' && side === 1 ? -128 : side === -1 ? armA : -armA);
  const legAngle = (side: 1 | -1) => (pose === 'held' ? -side * 7 : 0);

  let s = '';
  // behind the body
  s += call('back', 'back');
  for (const slot of ['dress', 'top', 'outer'] as Slot[]) if (!(dressOn && slot === 'top')) s += call(slot, 'back');
  const tiltO = `style="transform-origin:0px ${f(b.shY - 6)}px"`;
  s += `<g class="tilt" ${tiltO}>${hair.back(b, look.hairColor)}</g>`;

  // legs
  for (const side of [-1, 1] as const) {
    let g = cloth(legPath(b.legW, L + 4, 0), look.skin);
    const shoes = worn('shoes');
    if (!shoes) g += `<ellipse cx="${side * 3}" cy="${f(L + 8)}" rx="13" ry="8" fill="${look.skin}"/><ellipse cx="${side * 3}" cy="${f(L + 8)}" rx="13" ry="8" fill="url(#g-shadeY)"/>`;
    const order2: Slot[] = dressOn ? ['dress'] : ['bottom'];
    for (const slot of [...order2, 'shoes'] as Slot[]) {
      const it = worn(slot);
      const x = ctx(slot);
      if (it && x && it.def.leg) g += it.def.leg(x, side);
    }
    if (shoes) {
      const x = ctx('shoes');
      if (x && shoes.def.foot) g += shoes.def.foot(x, side);
    }
    s += `<g transform="translate(${side * b.legX} ${b.hipY}) rotate(${legAngle(side)})"><g class="leg leg-${side < 0 ? 'l' : 'r'}">${g}</g></g>`;
  }

  // torso
  let torso = `<rect x="-11" y="${f(b.shY - 18)}" width="22" height="26" rx="8" fill="${dark(look.skin, 0.14)}"/>`;
  torso += cloth(torsoPath(b, { hemY: b.hipY - 2 }), look.skin);
  if (!dressOn && !worn('bottom')) torso += UNDIES_BOTTOM(b);
  if (!dressOn && !worn('top')) torso += UNDIES_TOP(b, look.skin);
  for (const slot of order) torso += call(slot, 'body');
  // soft shadow the big head casts on the chest
  torso += `<ellipse cx="0" cy="${f(b.shY + 4)}" rx="${f(b.shW * 0.7)}" ry="7" fill="#3a1d3f" opacity="0.1"/>`;
  s += `<g class="breathe" style="transform-origin:0px ${f(b.hipY)}px">${torso}</g>`;

  // arms
  for (const side of [-1, 1] as const) {
    const a = armAngle(side);
    let g = cloth(sleevePath(b.armW, b.armLen, 0), look.skin) + `<circle cx="0" cy="${f(b.armLen + 1)}" r="${f(b.armW * 0.6)}" fill="${look.skin}"/><circle cx="0" cy="${f(b.armLen + 1)}" r="${f(b.armW * 0.6)}" fill="url(#g-shadeX)"/>`;
    for (const slot of order) {
      const it = worn(slot);
      const x = ctx(slot, a);
      if (it && x && it.def.arm) g += it.def.arm(x, side);
    }
    if (side === 1) {
      const hand = call('hand', 'hand', a);
      if (hand) g += `<g transform="translate(0 ${f(b.armLen + 1)}) rotate(${-a})">${hand}</g>`;
    }
    s += `<g transform="translate(${side * b.armX} ${b.armY}) rotate(${a})"><g class="arm arm-${side < 0 ? 'l' : 'r'}">${g}</g></g>`;
  }
  s += call('neck', 'over') + call('back', 'over');

  // head (tilts gently together with the back hair)
  s += `<g class="tilt" ${tiltO}>${head(b, look, expr)}${hairFront(b, hair, look.hairColor)}${hair.over?.(b, look.hairColor) ?? ''}${call('face', 'head')}${call('head', 'head')}</g>`;

  if (seated) {
    const t = `translate(0 ${f(-b.hipY)})`;
    return `<g transform="${pose === 'sleep' ? `rotate(-90) ${t}` : t}">${s}</g>`;
  }
  return s;
}

/** Height of the doll's hip above its feet, used to line sitting dolls up with seats. */
export const hipHeight = (look: Look) => -body(look.age, !!look.boy).hipY;
export const dollHeight = (look: Look) => {
  const b = body(look.age, !!look.boy);
  return -(b.headY - b.R * 1.1);
};
