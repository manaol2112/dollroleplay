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
  bangs: 'side' | 'blunt' | 'part' | 'curly' | 'short' | 'sweep';
  back: (b: Body, c: string) => string;
  locks?: boolean;
}

function capPath(b: Body, bangs: HairStyle['bangs'], locks = true): string {
  const { R, headY: hy } = b;
  const p = (x: number, y: number) => `${f(x * R)} ${f(hy + y * R)}`;
  let d = `M${p(-1.06, 0.12)} A${f(R * 1.07)} ${f(R * 1.05)} 0 1 1 ${p(1.06, 0.12)}`;
  const lockY = bangs === 'short' ? 0.2 : 0.44;
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
  } else if (st.bangs === 'part') {
    s += `<path d="M${p(0.02, -1.0)} L${p(0.02, -0.7)}" stroke="${dk}" stroke-width="${f(R * 0.03)}" stroke-linecap="round" opacity="0.5"/>`;
  } else if (st.bangs === 'blunt') {
    s += `<path d="M${p(-0.4, -0.9)} Q${p(-0.45, -0.5)} ${p(-0.42, -0.24)} M${p(0.25, -0.95)} Q${p(0.28, -0.5)} ${p(0.28, -0.24)}" stroke="${dk}" stroke-width="${f(R * 0.022)}" fill="none" stroke-linecap="round" opacity="0.4"/>`;
  }
  s += `<path d="M${p(-0.66, -0.62)} Q${p(-0.25, -0.98)} ${p(0.32, -0.88)}" stroke="${light(c, 0.55)}" stroke-width="${f(R * 0.085)}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  s += `<path d="M${p(0.48, -0.8)} Q${p(0.62, -0.72)} ${p(0.7, -0.62)}" stroke="${light(c, 0.55)}" stroke-width="${f(R * 0.06)}" fill="none" stroke-linecap="round" opacity="0.45"/>`;
  return s;
}

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
    id: 'bun', name: 'Top Bun', price: 20, bangs: 'part', locks: true,
    back: (b, c) => {
      const { R, headY: hy } = b;
      return capBack(b, c) + `<circle cx="0" cy="${f(hy - R * 1.05)}" r="${f(R * 0.44)}" fill="${c}"/><circle cx="0" cy="${f(hy - R * 1.05)}" r="${f(R * 0.44)}" fill="url(#g-shine)"/>` +
        `<path d="M${f(-R * 0.25)} ${f(hy - R * 1.2)} Q0 ${f(hy - R * 1.38)} ${f(R * 0.22)} ${f(hy - R * 1.22)}" stroke="${light(c, 0.5)}" stroke-width="${f(R * 0.06)}" fill="none" stroke-linecap="round" opacity="0.5"/>` +
        `<ellipse cx="0" cy="${f(hy - R * 0.7)}" rx="${f(R * 0.3)}" ry="${f(R * 0.08)}" fill="#ff7eb6"/>`;
    },
  },
  {
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
    open += `<ellipse cx="${f(cx)}" cy="${f(ey)}" rx="${f(rx)}" ry="${f(ry)}" fill="${look.eyeColor}"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey - ry * 0.35)}" rx="${f(rx)}" ry="${f(ry * 0.65)}" fill="${ink}" opacity="0.28"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey + R * 0.01)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.6)}" fill="#1d1020"/>`;
    open += `<ellipse cx="${f(cx)}" cy="${f(ey + ry * 0.55)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.25)}" fill="${light(look.eyeColor, 0.5)}" opacity="0.7"/>`;
    open += `<circle cx="${f(cx - rx * 0.38)}" cy="${f(ey - ry * 0.38)}" r="${f(R * 0.05)}" fill="#fff"/>`;
    open += `<circle cx="${f(cx + rx * 0.4)}" cy="${f(ey + ry * 0.35)}" r="${f(R * 0.022)}" fill="#fff"/>`;
    if (style === 'sparkle') open += `<path d="${sparkleD(cx + rx * 0.3, ey - ry * 0.1, R * 0.05)}" fill="#fff"/>`;
    // upper lid line with outer flick
    open += `<path d="M${f(cx - sd * rx * 1.15)} ${f(ey - ry * 0.25)} Q${f(cx)} ${f(ey - ry * 1.55)} ${f(cx + sd * rx * 1.25)} ${f(ey - ry * 0.45)} L${f(cx + sd * rx * 1.5)} ${f(ey - ry * 0.75)}" stroke="${ink}" stroke-width="${f(R * 0.042)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
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
  s += `<ellipse cx="0" cy="${f(hy)}" rx="${f(R)}" ry="${f(R * 0.93)}" fill="${skin}"/><ellipse cx="0" cy="${f(hy)}" rx="${f(R)}" ry="${f(R * 0.93)}" fill="url(#g-face)"/>`;
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
  for (const sd of [-1, 1]) s += `<path d="M${f(sd * R * 0.27)} ${f(by + R * 0.02)} Q${f(sd * R * 0.38)} ${f(by - R * 0.04)} ${f(sd * R * 0.5)} ${f(by + R * 0.01)}" stroke="${brow}" stroke-width="${f(R * 0.035)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  s += `<ellipse cx="0" cy="${f(hy + R * 0.3)}" rx="${f(R * 0.035)}" ry="${f(R * 0.024)}" fill="${dark(skin, 0.2)}"/>`;
  s += mouth(b, look, expr);
  if (look.sticker) s += sticker(look.sticker, R * 0.66, hy + R * 0.5, R * 0.2);
  return s;
}

// ---------------- composition ----------------
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
  return `<path d="M${-wx} ${b.waistY + 8} L${wx} ${b.waistY + 8} Q${b.hiW + 2} ${b.hipY - 6} ${lx} ${b.hipY + 8} L3 ${b.hipY + 8} Q0 ${b.hipY + 2} -3 ${b.hipY + 8} L${-lx} ${b.hipY + 8} Q${-b.hiW - 2} ${b.hipY - 6} ${-wx} ${b.waistY + 8}Z" fill="#ffd9e8"/>` +
    `<g transform="translate(0 ${b.waistY + 12}) scale(0.28)">${bowG(0, 0, 1, '#ff7eb6')}</g>`;
};

export function renderDoll(look: Look, opts: DollOpts = {}): string {
  const pose = opts.pose ?? 'stand';
  const expr = opts.expr ?? (pose === 'sleep' ? 'sleep' : 'normal');
  const b = body(look.age);
  const seated = pose === 'sit' || pose === 'sleep';
  const L = seated ? b.legLen * 0.42 : b.legLen;
  const hair = HAIR_BY_ID[look.hair] ?? HAIR[0];
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

  if (opts.headOnly) {
    return hair.back(b, look.hairColor) + head(b, look, expr) + hairFront(b, hair, look.hairColor) + call('face', 'head') + call('head', 'head');
  }

  const armA = pose === 'held' ? 118 : pose === 'sit' ? 14 : pose === 'sleep' ? 4 : 9;
  const armAngle = (side: 1 | -1) => (pose === 'wave' && side === 1 ? -128 : side === -1 ? armA : -armA);
  const legAngle = (side: 1 | -1) => (pose === 'held' ? -side * 7 : 0);

  let s = '';
  // behind the body
  s += call('back', 'back');
  for (const slot of ['dress', 'top', 'outer'] as Slot[]) if (!(dressOn && slot === 'top')) s += call(slot, 'back');
  s += hair.back(b, look.hairColor);

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
    s += `<g transform="translate(${side * b.legX} ${b.hipY}) rotate(${legAngle(side)})">${g}</g>`;
  }

  // torso
  s += `<rect x="-11" y="${f(b.shY - 18)}" width="22" height="26" rx="8" fill="${dark(look.skin, 0.14)}"/>`;
  s += cloth(torsoPath(b, { hemY: b.hipY - 2 }), look.skin);
  if (!dressOn && !worn('bottom')) s += UNDIES_BOTTOM(b);
  if (!dressOn && !worn('top')) s += UNDIES_TOP(b, look.skin);
  for (const slot of order) s += call(slot, 'body');

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
    s += `<g transform="translate(${side * b.armX} ${b.armY}) rotate(${a})">${g}</g>`;
  }
  s += call('neck', 'over') + call('back', 'over');

  // head
  s += head(b, look, expr);
  s += hairFront(b, hair, look.hairColor);
  s += call('face', 'head');
  s += call('head', 'head');

  if (seated) {
    const t = `translate(0 ${f(-b.hipY)})`;
    return `<g transform="${pose === 'sleep' ? `rotate(-90) ${t}` : t}">${s}</g>`;
  }
  return s;
}

/** Height of the doll's hip above its feet, used to line sitting dolls up with seats. */
export const hipHeight = (look: Look) => -body(look.age).hipY;
export const dollHeight = (look: Look) => {
  const b = body(look.age);
  return -(b.headY - b.R * 1.1);
};
