// The clothing kit: the item format, the drawing helpers every catalog file shares, and the original
// ("Favorites") items. Each item draws into the doll's layers (behind the body, legs, torso, arms,
// head) using the doll's measurements, so it fits every age.
import { type Body, type Pose, legPath, sideX, sleevePath, torsoPath } from '../body';
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import type { Season, Slot } from '../../types';

export interface WearCtx {
  b: Body;
  c: string;
  p: Pattern;
  pose: Pose;
  skin: string;
  /** Leg length as drawn: shorter while sitting. */
  L: number;
  armAngle: number;
}

export interface WearDef {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  color: string;
  tags?: Season[];
  /** Colors are part of the design, so recoloring is not offered. */
  fixed?: boolean;
  /** Closet section this item is listed under, e.g. "Hoodies". */
  group?: string;
  /** Print it comes with; the player can still change it. */
  pattern?: Pattern;
  back?(x: WearCtx): string;
  leg?(x: WearCtx, side: 1 | -1): string;
  foot?(x: WearCtx, side: 1 | -1): string;
  body?(x: WearCtx): string;
  arm?(x: WearCtx, side: 1 | -1): string;
  hand?(x: WearCtx): string;
  over?(x: WearCtx): string;
  head?(x: WearCtx): string;
}

export const f = (n: number) => n.toFixed(1);
export const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const line = (x1: number, y1: number, x2: number, y2: number, c: string, w = 2, op = 1) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
export const circ = (x: number, y: number, r: number, fill: string, extra = '') =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
export const heartD = (x: number, y: number, s: number) =>
  `M${f(x)} ${f(y + s * 0.3)} C${f(x - s * 0.5)} ${f(y - s * 0.25)} ${f(x - s * 1.05)} ${f(y + s * 0.25)} ${f(x)} ${f(y + s)} C${f(x + s * 1.05)} ${f(y + s * 0.25)} ${f(x + s * 0.5)} ${f(y - s * 0.25)} ${f(x)} ${f(y + s * 0.3)}Z`;
export const starD = (x: number, y: number, r: number, inner = 0.45, n = 5, rot = -Math.PI / 2) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? r : r * inner;
    d += `${i === 0 ? 'M' : 'L'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
};
export const sparkleD = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y - r)} Q${f(x + r * 0.15)} ${f(y - r * 0.15)} ${f(x + r)} ${f(y)} Q${f(x + r * 0.15)} ${f(y + r * 0.15)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.15)} ${f(y + r * 0.15)} ${f(x - r)} ${f(y)} Q${f(x - r * 0.15)} ${f(y - r * 0.15)} ${f(x)} ${f(y - r)}Z`;
export const flowerG = (x: number, y: number, r: number, petal: string, center = '#ffd36b') => {
  let s = `<g>`;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += circ(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, petal);
  }
  return s + circ(x, y, r * 0.38, center) + circ(x - r * 0.12, y - r * 0.12, r * 0.12, '#fff', 'opacity="0.7"') + '</g>';
};
export const bowG = (x: number, y: number, s: number, c: string) => {
  const d = dark(c, 0.25);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
    ${P('M0 0 C-8 -14 -26 -16 -26 -2 C-26 12 -8 10 0 0Z', c)}${P('M0 0 C8 -14 26 -16 26 -2 C26 12 8 10 0 0Z', c)}
    ${P('M-2 2 L-10 20 L-4 18 L-1 24Z', d)}${P('M2 2 L10 20 L4 18 L1 24Z', d)}
    ${P('M-20 -4 C-16 -9 -10 -8 -6 -3', 'none', `stroke="${light(c, 0.45)}" stroke-width="2.5" stroke-linecap="round"`)}
    <ellipse cx="0" cy="0" rx="6" ry="7" fill="${d}"/><ellipse cx="-1.5" cy="-2" rx="2" ry="2.4" fill="#fff" opacity="0.4"/></g>`;
};

// ---------- tops ----------
export type Sleeve = 'none' | 'short' | 'cap' | 'puff' | 'long' | 'flare';
export type Hem = 'crop' | 'hip' | 'long' | 'coat';
export const hemY = (b: Body, h: Hem) => ({ crop: b.waistY + 6, hip: b.hipY + 8, long: b.hipY + 24, coat: b.hipY + 42 })[h];

export function sleeve(x: WearCtx, kind: Sleeve, extra = 3, cuff?: string): string {
  const { b, c, p } = x;
  const w = b.armW;
  switch (kind) {
    case 'none':
      return '';
    case 'short':
      return cloth(sleevePath(w, b.armLen * 0.36, extra), c, p);
    case 'cap':
      return cloth(sleevePath(w, b.armLen * 0.2, extra), c, p);
    case 'puff': {
      const d = `M${-w / 2 - 9} 6 C${-w / 2 - 12} -14 ${w / 2 + 12} -14 ${w / 2 + 9} 6 C${w / 2 + 9} 20 ${-w / 2 - 9} 20 ${-w / 2 - 9} 6Z`;
      return cloth(d, c, p) + `<rect x="${-w / 2 - 4}" y="16" width="${w + 8}" height="5" rx="2.5" fill="${cuff ?? dark(c, 0.15)}"/>`;
    }
    case 'long':
      return cloth(sleevePath(w, b.armLen - 4, extra), c, p) +
        `<rect x="${f(-w / 2 - extra)}" y="${f(b.armLen - 13)}" width="${f(w + extra * 2)}" height="9" rx="3" fill="${cuff ?? dark(c, 0.12)}"/>`;
    case 'flare':
      return cloth(sleevePath(w, b.armLen - 6, extra, 6), c, p);
  }
}

export interface TopOpts {
  hem?: Hem;
  sleeve?: Sleeve;
  neck?: 'crew' | 'v' | 'scoop' | 'none';
  strapless?: boolean;
  deco?: (x: WearCtx) => string;
  back?: (x: WearCtx) => string;
  cuff?: (c: string) => string;
  flare?: number;
}

export function topBody(x: WearCtx, o: TopOpts): string {
  const { b } = x;
  const nk = o.neck ?? 'crew';
  const path = torsoPath(b, {
    hemY: hemY(b, o.hem ?? 'hip'),
    flare: o.flare ?? 0,
    neckW: nk === 'none' ? 0 : nk === 'v' ? 14 : nk === 'scoop' ? 19 : 13,
    neckDip: nk === 'v' ? 24 : nk === 'scoop' ? 16 : 9,
    vneck: nk === 'v',
    topY: o.strapless ? b.shY + 16 : undefined,
  });
  return cloth(path, x.c, x.p) + (o.deco ? o.deco(x) : '');
}

export function top(id: string, name: string, price: number, color: string, o: TopOpts, tags?: Season[], slot: Slot = 'top'): WearDef {
  return {
    id, name, slot, price, color, tags,
    body: (x) => topBody(x, o),
    arm: (x) => sleeve(x, o.sleeve ?? 'short', slot === 'outer' ? 4.5 : 3, o.cuff?.(x.c)),
    back: o.back,
  };
}

export const chestY = (b: Body) => b.shY + (b.waistY - b.shY) * 0.55;
export const strap = (x: WearCtx, w = 6) => {
  const { b } = x;
  const y2 = b.shY + 18;
  return [-1, 1].map((s) => P(`M${s * 16 - w / 2} ${b.shY - 1} L${s * 16 + w / 2} ${b.shY - 1} L${s * 18 + w / 2} ${y2} L${s * 18 - w / 2} ${y2}Z`, dark(x.c, 0.05))).join('');
};
export const buttons = (x: WearCtx, n: number, y0: number, y1: number, c = '#fff', dx = 0) => {
  let s = '';
  for (let i = 0; i < n; i++) s += circ(dx, y0 + ((y1 - y0) * i) / Math.max(1, n - 1), 3.2, c, `stroke="${dark(x.c, 0.3)}" stroke-width="0.8"`);
  return s;
};
export const hoodBack = (x: WearCtx) => {
  const { b } = x;
  return P(`M${-b.shW + 6} ${b.shY + 6} Q${-b.shW} ${b.shY - 34} 0 ${b.shY - 30} Q${b.shW} ${b.shY - 34} ${b.shW - 6} ${b.shY + 6}Z`, dark(x.c, 0.18));
};

export const TOPS: WearDef[] = [
  top('tee', 'T-Shirt', 0, '#7cc8ff', { sleeve: 'short' }),
  top('heartTee', 'Heart Tee', 0, '#ffffff', {
    sleeve: 'short',
    deco: (x) => P(heartD(0, chestY(x.b) - 10, 17), '#ff6f9f') + P(heartD(-5, chestY(x.b) - 7, 5), '#fff', 'opacity="0.5"'),
  }),
  top('tank', 'Tank Top', 0, '#ffb3c7', { sleeve: 'none', strapless: true, deco: (x) => strap(x) }, ['summer']),
  top('blouse', 'Puff Blouse', 0, '#fff3f8', {
    sleeve: 'puff',
    deco: (x) => {
      const y = x.b.shY;
      return P(`M-1 ${y + 1} Q-20 ${y - 2} -22 ${y + 8} Q-20 ${y + 20} -2 ${y + 14}Z`, '#fff', `stroke="${dark(x.c, 0.15)}" stroke-width="1"`) +
        P(`M1 ${y + 1} Q20 ${y - 2} 22 ${y + 8} Q20 ${y + 20} 2 ${y + 14}Z`, '#fff', `stroke="${dark(x.c, 0.15)}" stroke-width="1"`) +
        buttons(x, 3, y + 24, x.b.hipY - 8, '#ff9ec7');
    },
  }),
  top('hoodie', 'Cozy Hoodie', 0, '#c99bff', {
    sleeve: 'long',
    hem: 'hip',
    back: hoodBack,
    deco: (x) => {
      const { b } = x;
      const py = b.waistY + 6;
      return P(`M-24 ${py} L24 ${py} L30 ${b.hipY + 2} L-30 ${b.hipY + 2}Z`, dark(x.c, 0.1)) +
        line(-7, b.shY + 6, -9, b.shY + 34, '#fff', 2.5) + line(7, b.shY + 6, 9, b.shY + 34, '#fff', 2.5) +
        circ(-9, b.shY + 36, 3, '#fff') + circ(9, b.shY + 36, 3, '#fff') +
        `<rect x="${-b.hiW}" y="${b.hipY + 1}" width="${b.hiW * 2}" height="8" rx="3" fill="${dark(x.c, 0.15)}"/>`;
    },
  }),
  top('sweater', 'Knit Sweater', 40, '#ff9a6b', {
    sleeve: 'long',
    deco: (x) => {
      const { b } = x;
      let s = '';
      for (let i = -2; i <= 2; i++) s += P(`M${i * 14 - 6} ${chestY(b) - 6} L${i * 14} ${chestY(b) + 4} L${i * 14 + 6} ${chestY(b) - 6}`, 'none', `stroke="${light(x.c, 0.45)}" stroke-width="3" stroke-linejoin="round"`);
      for (let i = -2; i <= 2; i++) s += circ(i * 14, chestY(b) + 14, 2.5, light(x.c, 0.5));
      return s + `<rect x="${-b.hiW - 1}" y="${b.hipY - 2}" width="${b.hiW * 2 + 2}" height="11" rx="4" fill="${dark(x.c, 0.12)}"/>`;
    },
  }, ['fall', 'winter']),
  top('crop', 'Crop Top', 30, '#5fd3b5', { sleeve: 'short', hem: 'crop', deco: (x) => P(starD(0, chestY(x.b) - 8, 10), '#fff', 'opacity="0.85"') }, ['summer']),
  top('sailor', 'Sailor Top', 60, '#ffffff', {
    sleeve: 'short',
    neck: 'v',
    deco: (x) => {
      const y = x.b.shY;
      return P(`M-24 ${y} L-14 ${y} L0 ${y + 24} L14 ${y} L24 ${y} L30 ${y + 22} L0 ${y + 36} L-30 ${y + 22}Z`, '#3f6fd8') +
        P(`M-26 ${y + 16} L0 ${y + 30} L26 ${y + 16}`, 'none', 'stroke="#fff" stroke-width="2"') +
        `<g transform="translate(0 ${y + 32}) scale(0.55)">${bowG(0, 0, 1, '#ff4f6d')}</g>`;
    },
  }),
  top('turtleneck', 'Turtleneck', 45, '#f4ead9', {
    sleeve: 'long',
    neck: 'none',
    deco: (x) => `<rect x="-15" y="${x.b.shY - 12}" width="30" height="18" rx="6" fill="${dark(x.c, 0.08)}"/>` +
      line(-8, x.b.shY - 9, -8, x.b.shY + 3, dark(x.c, 0.2), 1.5) + line(0, x.b.shY - 9, 0, x.b.shY + 3, dark(x.c, 0.2), 1.5) + line(8, x.b.shY - 9, 8, x.b.shY + 3, dark(x.c, 0.2), 1.5),
  }, ['fall', 'winter']),
  top('ruffle', 'Ruffle Top', 50, '#ffd36b', {
    sleeve: 'none',
    strapless: true,
    deco: (x) => {
      const { b } = x;
      const y = b.shY + 14;
      let d = `M${-b.shW - 6} ${y}`;
      for (let i = 0; i < 8; i++) {
        const x0 = -b.shW - 6 + ((b.shW * 2 + 12) * i) / 8;
        const x1 = x0 + (b.shW * 2 + 12) / 8;
        d += ` Q${f((x0 + x1) / 2)} ${y + 22} ${f(x1)} ${y}`;
      }
      return cloth(d + ` L${b.shW + 6} ${y - 6} L${-b.shW - 6} ${y - 6}Z`, light(x.c, 0.2), x.p);
    },
  }, ['summer']),
  top('sparkle', 'Sparkle Top', 90, '#c99bff', {
    sleeve: 'long',
    neck: 'scoop',
    deco: (x) => {
      const { b } = x;
      let s = '';
      const pts = [[-20, -10], [12, -18], [22, 8], [-8, 12], [-24, 24], [6, 30], [24, 34], [-12, 40]];
      for (const [dx, dy] of pts) s += P(sparkleD(dx, chestY(b) + dy - 6, 4.5), '#fff8c8', 'opacity="0.95"');
      return s;
    },
  }),
  top('polo', 'School Shirt', 25, '#ffffff', {
    sleeve: 'short',
    neck: 'v',
    deco: (x) => {
      const y = x.b.shY;
      return P(`M-1 ${y + 2} L-18 ${y - 2} L-14 ${y + 14}Z`, '#fff', `stroke="${dark(x.c, 0.2)}" stroke-width="1"`) +
        P(`M1 ${y + 2} L18 ${y - 2} L14 ${y + 14}Z`, '#fff', `stroke="${dark(x.c, 0.2)}" stroke-width="1"`) + buttons(x, 2, y + 30, y + 46, '#ddd');
    },
  }),
  top('rainbowTee', 'Rainbow Tee', 70, '#ffffff', {
    sleeve: 'short',
    deco: (x) => {
      const y = chestY(x.b) + 6;
      const cols = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff'];
      return cols.map((c, i) => P(`M${-22 + i * 4} ${y} A${22 - i * 4} ${22 - i * 4} 0 0 1 ${22 - i * 4} ${y}`, 'none', `stroke="${c}" stroke-width="4"`)).join('') +
        circ(-24, y, 6, '#fff', 'stroke="#e6e6f0"') + circ(24, y, 6, '#fff', 'stroke="#e6e6f0"');
    },
  }),
];

// ---------- outerwear ----------
export function panelPath(b: Body, hem: number, side: 1 | -1, gap: number, flare = 0): string {
  const s = side;
  let d = `M${f(s * gap)} ${f(b.shY + 4)} L${f(s * 12)} ${f(b.shY)} L${f(s * (b.shW - 14))} ${f(b.shY)} Q${f(s * b.shW)} ${f(b.shY)} ${f(s * b.shW)} ${f(b.shY + 16)}`;
  for (let y = b.shY + 22; y < hem; y += 8) d += ` L${f(s * (sideX(b, y, flare) + 1))} ${f(y)}`;
  d += ` L${f(s * (sideX(b, hem, flare) + 1))} ${f(hem)} Q${f(s * (gap + 10))} ${f(hem + 6)} ${f(s * gap)} ${f(hem + 2)}Z`;
  return d;
}

export function coat(id: string, name: string, price: number, color: string, o: {
  hem: Hem; gap: number; sleeve?: Sleeve; deco?: (x: WearCtx) => string; back?: (x: WearCtx) => string; cuff?: (c: string) => string;
  flare?: number; trim?: (x: WearCtx, side: 1 | -1, hem: number) => string;
}, tags?: Season[]): WearDef {
  return {
    id, name, slot: 'outer', price, color, tags,
    back: o.back,
    body: (x) => {
      const hem = hemY(x.b, o.hem);
      let s = '';
      for (const side of [-1, 1] as const) {
        s += cloth(panelPath(x.b, hem, side, o.gap, o.flare ?? 0), x.c, x.p);
        if (o.trim) s += o.trim(x, side, hem);
      }
      return s + (o.deco ? o.deco(x) : '');
    },
    arm: (x) => sleeve(x, o.sleeve ?? 'long', 4.5, o.cuff?.(x.c)),
  };
}

export const quilt = (x: WearCtx, hem: number) => {
  let s = '';
  for (let y = x.b.shY + 26; y < hem; y += 18) s += P(`M${-sideX(x.b, y) - 2} ${y} Q0 ${y + 5} ${sideX(x.b, y) + 2} ${y}`, 'none', `stroke="${dark(x.c, 0.22)}" stroke-width="2" opacity="0.7"`);
  return s;
};
export const fluff = (cx: number, y0: number, y1: number, r: number, c = '#fffaf5') => {
  let s = '';
  if (r <= 0) return s;
  for (let y = y0; y <= y1; y += r * 1.2) s += circ(cx + ((y / r) % 2 ? 1.5 : -1.5), y, r, c);
  return s;
};

export const OUTER: WearDef[] = [
  coat('cardigan', 'Cardigan', 0, '#ffb3c7', {
    hem: 'hip', gap: 6,
    trim: (x, side) => buttons(x, 3, x.b.shY + 24, x.b.hipY - 6, '#fff', side * 10),
    cuff: (c) => dark(c, 0.1),
  }, ['spring', 'fall']),
  coat('puffer', 'Puffy Coat', 80, '#ff7eb6', {
    hem: 'long', gap: 0, cuff: () => '#fffaf5',
    back: hoodBack,
    deco: (x) => {
      const hem = hemY(x.b, 'long');
      return quilt(x, hem) + line(0, x.b.shY + 4, 0, hem, dark(x.c, 0.35), 2.5) +
        P(`M${-x.b.shW + 4} ${x.b.shY + 6} Q0 ${x.b.shY - 16} ${x.b.shW - 4} ${x.b.shY + 6} Q0 ${x.b.shY + 4} ${-x.b.shW + 4} ${x.b.shY + 6}Z`, '#fffaf5');
    },
  }, ['winter']),
  coat('raincoat', 'Raincoat', 50, '#ffd84a', {
    hem: 'coat', gap: 0, flare: 10, back: hoodBack,
    deco: (x) => {
      const hem = hemY(x.b, 'coat');
      return line(0, x.b.shY + 4, 0, hem, dark(x.c, 0.3), 2) + buttons(x, 4, x.b.shY + 22, hem - 14, dark(x.c, 0.35), 8) +
        P(`M${-x.b.shW + 10} ${x.b.shY + 4} L-4 ${x.b.shY + 22} L-2 ${x.b.shY}Z M${x.b.shW - 10} ${x.b.shY + 4} L4 ${x.b.shY + 22} L2 ${x.b.shY}Z`, dark(x.c, 0.12));
    },
  }, ['spring']),
  coat('denim', 'Denim Jacket', 55, '#6f9be0', {
    hem: 'hip', gap: 5,
    trim: (x, s) => P(`M${s * 12} ${chestY(x.b) - 8} L${s * 30} ${chestY(x.b) - 8} L${s * 30} ${chestY(x.b) + 6} L${s * 12} ${chestY(x.b) + 6}Z`, dark(x.c, 0.12)) +
      P(`M${s * 4} ${x.b.shY + 2} L${s * 26} ${x.b.shY} L${s * 12} ${x.b.shY + 24}Z`, light(x.c, 0.15)),
    cuff: (c) => dark(c, 0.15),
  }, ['spring', 'fall']),
  coat('blazer', 'School Blazer', 60, '#3f4f9a', {
    hem: 'hip', gap: 4,
    trim: (x, s) => P(`M${s * 4} ${x.b.shY + 4} L${s * 20} ${x.b.shY} L${s * 22} ${x.b.shY + 18} L${s * 8} ${x.b.waistY}Z`, dark(x.c, 0.2)) +
      (s === -1 ? `<path d="${starD(-22, chestY(x.b) - 2, 6)}" fill="url(#g-gold)"/>` : buttons(x, 2, x.b.waistY - 4, x.b.waistY + 12, '#ffd24a', 12)),
  }, ['fall']),
  coat('furcoat', 'Fluffy Coat', 120, '#f6efe6', {
    hem: 'coat', gap: 4, flare: 6, cuff: () => '#ffffff',
    trim: (x, s, hem) => fluff(s * 6, x.b.shY + 4, hem, 6, '#ffffff'),
  }, ['winter']),
  coat('moto', 'Cool Jacket', 75, '#4a3f5e', {
    hem: 'hip', gap: 3,
    trim: (x, s) => P(`M${s * 3} ${x.b.shY + 4} L${s * 24} ${x.b.shY - 2} L${s * 20} ${x.b.shY + 22}Z`, light(x.c, 0.1)) + line(s * 18, chestY(x.b), s * 30, chestY(x.b) + 4, '#cfd3e0', 2),
  }, ['fall']),
];

// ---------- bottoms ----------
export function hipPiece(b: Body, c: string, p: Pattern, rise = 2): string {
  const wy = b.waistY - rise;
  const wx = sideX(b, wy) + 1;
  const lx = b.legX + b.legW / 2 + 3;
  const d = `M${f(-wx)} ${f(wy)} L${f(wx)} ${f(wy)} Q${f(b.hiW + 3)} ${f(b.hipY - 8)} ${f(lx + 1)} ${f(b.hipY + 12)} L3 ${f(b.hipY + 12)} Q0 ${f(b.hipY + 4)} -3 ${f(b.hipY + 12)} L${f(-lx - 1)} ${f(b.hipY + 12)} Q${f(-b.hiW - 3)} ${f(b.hipY - 8)} ${f(-wx)} ${f(wy)}Z`;
  return cloth(d, c, p);
}
export const waistband = (b: Body, c: string, rise = 2) => {
  const wy = b.waistY - rise;
  return `<rect x="${f(-sideX(b, wy) - 1)}" y="${f(wy)}" width="${f(sideX(b, wy) * 2 + 2)}" height="6" rx="3" fill="${c}"/>`;
};

export function pants(id: string, name: string, price: number, color: string, len: number, o: { flare?: number; cuff?: boolean; tight?: boolean; deco?: (x: WearCtx) => string; legDeco?: (x: WearCtx, s: 1 | -1, l: number) => string } = {}, tags?: Season[]): WearDef {
  return {
    id, name, slot: 'bottom', price, color, tags,
    body: (x) => hipPiece(x.b, x.c, x.p) + waistband(x.b, dark(x.c, 0.12)) + (o.deco ? o.deco(x) : ''),
    leg: (x, s) => {
      const l = len >= 1 ? x.L + 4 : x.L * len;
      return cloth(legPath(x.b.legW, l, o.tight ? 1.5 : 3, (o.flare ?? 0) * (len >= 1 ? 1 : 0)), x.c, x.p) +
        (o.cuff ? `<rect x="${f(-x.b.legW / 2 - 4)}" y="${f(l - 8)}" width="${f(x.b.legW + 8)}" height="8" rx="3" fill="${dark(x.c, 0.15)}"/>` : '') +
        (o.legDeco ? o.legDeco(x, s, l) : '');
    },
  };
}

export function skirtPath(b: Body, len: number, flare: number, rise = 2): string {
  const ty = b.waistY - rise;
  const tx = sideX(b, ty) + 1;
  const hy = b.hipY + len;
  const hx = b.hiW + flare;
  return `M${f(-tx)} ${f(ty)} L${f(tx)} ${f(ty)} Q${f(b.hiW + flare * 0.5)} ${f(b.hipY - 4)} ${f(hx)} ${f(hy)} Q0 ${f(hy + 12)} ${f(-hx)} ${f(hy)} Q${f(-b.hiW - flare * 0.5)} ${f(b.hipY - 4)} ${f(-tx)} ${f(ty)}Z`;
}
export const skirtLen = (x: WearCtx, len: number) => (x.pose === 'sit' || x.pose === 'sleep' ? Math.min(len, x.L + 10) : len);

export function skirt(id: string, name: string, price: number, color: string, len: number | 'floor', flare: number, deco?: (x: WearCtx, l: number) => string, tags?: Season[]): WearDef {
  return {
    id, name, slot: 'bottom', price, color, tags,
    body: (x) => {
      const l = skirtLen(x, len === 'floor' ? x.b.ankleY - x.b.hipY + 6 : len);
      return cloth(skirtPath(x.b, l, flare), x.c, x.p) + waistband(x.b, dark(x.c, 0.12)) + (deco ? deco(x, l) : '');
    },
  };
}
export const pleats = (x: WearCtx, l: number, flare: number) => {
  let s = '';
  for (let i = -2; i <= 2; i++) s += line(i * 9, x.b.waistY + 6, i * ((x.b.hiW + flare) / 3), x.b.hipY + l, dark(x.c, 0.25), 1.6, 0.6);
  return s;
};
export function tutuLayers(x: WearCtx, y0: number, len: number, w: number, c: string): string {
  let s = '';
  for (let k = 0; k < 2; k++) {
    const hy = y0 + len - k * 8;
    const hw = w - k * 8;
    let d = `M${f(-x.b.waW - 1)} ${f(y0)} L${f(x.b.waW + 1)} ${f(y0)} L${f(hw)} ${f(hy - 8)}`;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const xa = hw - ((hw * 2) * i) / n;
      const xb = hw - ((hw * 2) * (i + 1)) / n;
      d += ` Q${f((xa + xb) / 2)} ${f(hy + 8)} ${f(xb)} ${f(hy - 6)}`;
    }
    d += 'Z';
    s += cloth(d, k === 0 ? dark(c, 0.08) : light(c, 0.15), x.p, 'y');
  }
  for (const [dx, dy] of [[-22, 14], [0, 22], [20, 10], [-10, 30], [26, 26]]) s += P(sparkleD(dx, y0 + dy, 3), '#fff', 'opacity="0.9"');
  return s;
}

export const BOTTOMS: WearDef[] = [
  pants('shorts', 'Shorts', 0, '#ff7eb6', 0.32, { cuff: true }, ['summer']),
  pants('denimShorts', 'Denim Shorts', 30, '#6f9be0', 0.3, {
    deco: (x) => line(-x.b.waW + 8, x.b.waistY + 8, -x.b.waW + 16, x.b.hipY - 2, light(x.c, 0.3), 1.5) + line(x.b.waW - 8, x.b.waistY + 8, x.b.waW - 16, x.b.hipY - 2, light(x.c, 0.3), 1.5),
    legDeco: (x, _s, l) => `<rect x="${-x.b.legW / 2 - 3}" y="${l - 4}" width="${x.b.legW + 6}" height="4" fill="${light(x.c, 0.35)}"/>`,
  }, ['summer']),
  skirt('pleated', 'Pleated Skirt', 0, '#9b6bff', 36, 18, (x, l) => pleats(x, l, 18)),
  skirt('tutu', 'Tutu', 45, '#ff9ec7', 0, 0, undefined),
  pants('jeans', 'Jeans', 0, '#5d86d6', 1, {
    legDeco: (x, s) => line(s * -4, 10, s * -4, x.L - 4, light(x.c, 0.25), 1.2, 0.8),
    deco: (x) => circ(0, x.b.waistY + 1, 2.5, '#ffd24a'),
  }),
  pants('leggings', 'Leggings', 20, '#2d2a3a', 1, { tight: true }, ['fall', 'winter']),
  pants('flares', 'Flare Pants', 55, '#ffab5e', 1, { flare: 8 }),
  pants('joggers', 'Joggers', 35, '#9aa3b5', 1, { cuff: true }, ['fall']),
  skirt('bubble', 'Bubble Skirt', 50, '#5fd3b5', 30, 24, (x, l) => `<path d="M${-x.b.hiW - 22} ${x.b.hipY + l - 4} Q0 ${x.b.hipY + l + 14} ${x.b.hiW + 22} ${x.b.hipY + l - 4}" stroke="${dark(x.c, 0.15)}" stroke-width="6" fill="none" stroke-linecap="round"/>`, ['spring']),
  skirt('maxi', 'Long Flowy Skirt', 65, '#ffd36b', 'floor', 30, (x, l) => pleats(x, l, 30), ['summer']),
  {
    id: 'overalls', name: 'Overalls', slot: 'bottom', price: 60, color: '#7aa6e8',
    body: (x) => {
      const { b } = x;
      const bib = `M-20 ${b.shY + 24} L20 ${b.shY + 24} L22 ${b.waistY} L-22 ${b.waistY}Z`;
      return hipPiece(b, x.c, x.p) + cloth(bib, x.c, x.p) +
        P(`M-12 ${chestY(b)} L12 ${chestY(b)} L12 ${chestY(b) + 12} Q0 ${chestY(b) + 16} -12 ${chestY(b) + 12}Z`, dark(x.c, 0.1)) +
        line(-22, b.shY + 1, -17, b.shY + 26, dark(x.c, 0.1), 6) + line(22, b.shY + 1, 17, b.shY + 26, dark(x.c, 0.1), 6) +
        circ(-17, b.shY + 27, 3.4, '#ffd24a') + circ(17, b.shY + 27, 3.4, '#ffd24a');
    },
    leg: (x) => cloth(legPath(x.b.legW, x.L * 0.82, 3), x.c, x.p) + `<rect x="${-x.b.legW / 2 - 4}" y="${x.L * 0.82 - 7}" width="${x.b.legW + 8}" height="7" rx="3" fill="${dark(x.c, 0.12)}"/>`,
  },
  {
    id: 'tutuSkirt', name: 'Sparkle Tutu', slot: 'bottom', price: 80, color: '#c99bff', tags: ['spring'],
    body: (x) => tutuLayers(x, x.b.waistY - 2, x.b.hipY - x.b.waistY + 26, x.b.hiW + 26, x.c) + waistband(x.b, dark(x.c, 0.15)),
  },
];
// The plain tutu reuses the layered skirt art.
BOTTOMS[3].body = (x) => tutuLayers(x, x.b.waistY - 2, x.b.hipY - x.b.waistY + 20, x.b.hiW + 18, x.c) + waistband(x.b, dark(x.c, 0.15));

// ---------- dresses ----------
export interface DressOpts {
  len: number | 'floor';
  flare: number;
  sleeve?: Sleeve;
  neck?: 'crew' | 'v' | 'scoop' | 'none';
  strapless?: boolean;
  skirtColor?: (c: string) => string;
  tutu?: boolean;
  sash?: (c: string) => string | null;
  deco?: (x: WearCtx, l: number) => string;
  bodiceDeco?: (x: WearCtx) => string;
  legs?: (x: WearCtx, s: 1 | -1) => string;
  back?: (x: WearCtx) => string;
  cuff?: (c: string) => string;
}
export function dress(id: string, name: string, price: number, color: string, o: DressOpts, tags?: Season[], fixed = false): WearDef {
  return {
    id, name, slot: 'dress', price, color, tags, fixed,
    back: o.back,
    leg: o.legs,
    body: (x) => {
      const { b } = x;
      const l = skirtLen(x, o.len === 'floor' ? b.ankleY - b.hipY + 6 : o.len);
      const sc = o.skirtColor ? o.skirtColor(x.c) : x.c;
      let s = '';
      if (o.tutu) s += tutuLayers(x, b.waistY - 2, b.hipY - b.waistY + l, b.hiW + o.flare, sc);
      else s += cloth(skirtPath(b, l, o.flare, 4), sc, x.p);
      const nk = o.neck ?? 'scoop';
      s += cloth(torsoPath(b, {
        hemY: b.waistY + 6,
        neckW: nk === 'none' ? 0 : nk === 'v' ? 14 : nk === 'scoop' ? 18 : 13,
        neckDip: nk === 'v' ? 22 : nk === 'scoop' ? 14 : 9,
        vneck: nk === 'v',
        topY: o.strapless ? b.shY + 16 : undefined,
      }), x.c, x.p);
      if (o.strapless) s += strap(x, 5);
      if (o.bodiceDeco) s += o.bodiceDeco(x);
      if (o.deco) s += o.deco(x, l);
      const sash = o.sash ? o.sash(x.c) : null;
      if (sash) s += `<rect x="${f(-sideX(b, b.waistY) - 1)}" y="${f(b.waistY - 2)}" width="${f(sideX(b, b.waistY) * 2 + 2)}" height="9" rx="4" fill="${sash}"/>` + `<g transform="translate(${b.waW - 8} ${b.waistY + 2}) scale(0.5)">${bowG(0, 0, 1, sash)}</g>`;
      return s;
    },
    arm: (x) => sleeve(x, o.sleeve ?? 'none', 3, o.cuff?.(x.c)),
  };
}

export const DRESSES: WearDef[] = [
  dress('sundress', 'Sundress', 0, '#ffd36b', { len: 40, flare: 22, strapless: true, sash: () => '#fff' }, ['summer']),
  dress('party', 'Party Dress', 0, '#ff7eb6', { len: 30, flare: 30, tutu: true, sleeve: 'cap', sash: (c) => light(c, 0.6) }),
  dress('princess', 'Princess Gown', 150, '#ffb3d9', {
    len: 'floor', flare: 46, sleeve: 'puff', neck: 'scoop', sash: () => '#ffd24a',
    deco: (x, l) => {
      let s = '';
      const hy = x.b.hipY + l;
      s += P(`M${-x.b.hiW - 46} ${hy} Q0 ${hy + 12} ${x.b.hiW + 46} ${hy}`, 'none', 'stroke="#ffd24a" stroke-width="5"');
      for (const [dx, dy] of [[-30, 0.3], [20, 0.4], [-8, 0.6], [34, 0.75], [-40, 0.85], [6, 0.9]]) s += P(sparkleD(dx, x.b.hipY + l * dy, 5), '#fff', 'opacity="0.9"');
      for (let i = -2; i <= 2; i++) s += P(`M${i * 10} ${x.b.waistY + 8} Q${i * 18} ${x.b.hipY + l * 0.5} ${i * 26} ${hy + 4}`, 'none', `stroke="${dark(x.c, 0.12)}" stroke-width="1.5" opacity="0.6"`);
      return s;
    },
    bodiceDeco: (x) => P(heartD(0, x.b.shY + 18, 7), '#ffd24a'),
  }),
  dress('pinafore', 'School Pinafore', 40, '#e85d7a', {
    len: 34, flare: 16, sleeve: 'puff', neck: 'none', cuff: () => '#fff',
    deco: (x, l) => pleats(x, l, 16),
    bodiceDeco: (x) => {
      const y = x.b.shY;
      return P(`M-28 ${y + 2} L-12 ${y - 1} L0 ${y + 10} L12 ${y - 1} L28 ${y + 2} L22 ${y + 18} L0 ${y + 14} L-22 ${y + 18}Z`, '#fff') +
        `<g transform="translate(0 ${y + 14}) scale(0.45)">${bowG(0, 0, 1, '#3f4f9a')}</g>`;
    },
  }, ['fall']),
  dress('ballet', 'Ballerina', 90, '#ffc7dc', { len: 10, flare: 40, tutu: true, strapless: true, bodiceDeco: (x) => `<g transform="translate(0 ${x.b.shY + 20}) scale(0.4)">${bowG(0, 0, 1, '#ff8fb8')}</g>` }),
  dress('velvet', 'Winter Velvet', 110, '#c2325a', {
    len: 40, flare: 22, sleeve: 'long', neck: 'crew', cuff: () => '#fffaf5',
    deco: (x, l) => P(`M${-x.b.hiW - 22} ${x.b.hipY + l} Q0 ${x.b.hipY + l + 12} ${x.b.hiW + 22} ${x.b.hipY + l}`, 'none', 'stroke="#fffaf5" stroke-width="8" stroke-linecap="round"'),
    bodiceDeco: (x) => P(`M-13 ${x.b.shY} Q0 ${x.b.shY + 12} 13 ${x.b.shY}`, 'none', 'stroke="#fffaf5" stroke-width="7" stroke-linecap="round"') + buttons(x, 3, x.b.shY + 18, x.b.waistY - 4, '#ffd24a'),
  }, ['winter']),
  dress('swim', 'Swimsuit', 35, '#4fc3f7', {
    len: -2, flare: 0, strapless: true,
    deco: (x) => {
      const y = x.b.hipY - 4;
      let d = `M${-x.b.hiW - 4} ${y}`;
      for (let i = 0; i < 6; i++) {
        const xa = -x.b.hiW - 4 + ((x.b.hiW * 2 + 8) * i) / 6;
        const xb = xa + (x.b.hiW * 2 + 8) / 6;
        d += ` Q${f((xa + xb) / 2)} ${y + 18} ${f(xb)} ${y}`;
      }
      return cloth(d + 'Z', light(x.c, 0.2), x.p) + hipPiece(x.b, x.c, x.p, -4);
    },
  }, ['summer']),
  dress('starGown', 'Starry Night Gown', 200, '#3b3a8f', {
    len: 'floor', flare: 40, sleeve: 'flare', neck: 'v',
    deco: (x, l) => {
      let s = '';
      for (const [dx, dy, r] of [[-26, 0.25, 6], [14, 0.32, 4], [30, 0.6, 7], [-12, 0.55, 5], [-38, 0.8, 5], [8, 0.82, 8], [36, 0.92, 4]]) s += P(starD(dx, x.b.hipY + l * dy, r), '#ffe680');
      return s + P(`M${-x.b.hiW - 40} ${x.b.hipY + l} Q0 ${x.b.hipY + l + 12} ${x.b.hiW + 40} ${x.b.hipY + l}`, 'none', 'stroke="#c99bff" stroke-width="5"');
    },
    bodiceDeco: (x) => P(starD(0, x.b.shY + 30, 7), '#ffe680'),
  }),
  dress('floral', 'Flower Dress', 55, '#ff9ec7', { len: 38, flare: 24, sleeve: 'cap', neck: 'scoop', sash: () => '#fff', deco: (x, l) => flowerG(-20, x.b.hipY + l * 0.6, 7, '#fff') + flowerG(22, x.b.hipY + l * 0.4, 6, '#fff') }, ['spring']),
  dress('pjs', 'Starry Pajamas', 30, '#9ec9ff', {
    len: -6, flare: 0, sleeve: 'long', neck: 'crew', cuff: (c) => light(c, 0.4),
    deco: (x) => {
      const top = torsoPath(x.b, { hemY: x.b.hipY + 10, neckW: 13, neckDip: 9 });
      return hipPiece(x.b, x.c, x.p) + cloth(top, x.c, x.p) + buttons(x, 3, x.b.shY + 22, x.b.hipY - 2, '#fff') +
        P(starD(-20, chestY(x.b) - 6, 6), '#fff8c8') + P(starD(18, chestY(x.b) + 14, 5), '#fff8c8');
    },
    legs: (x) => cloth(legPath(x.b.legW, x.L + 2, 3), x.c, x.p) + `<rect x="${-x.b.legW / 2 - 4}" y="${x.L - 6}" width="${x.b.legW + 8}" height="8" rx="3" fill="${light(x.c, 0.4)}"/>` + P(starD(0, x.L * 0.5, 4), '#fff8c8'),
  }),
  dress('mermaid', 'Mermaid Gown', 180, '#5fd3c8', {
    len: 'floor', flare: 4, strapless: true,
    deco: (x, l) => {
      const hy = x.b.hipY + l;
      let s = cloth(`M${-x.b.hiW + 2} ${hy - 30} Q${-x.b.hiW - 30} ${hy - 4} ${-x.b.hiW - 34} ${hy + 4} Q0 ${hy + 14} ${x.b.hiW + 34} ${hy + 4} Q${x.b.hiW + 30} ${hy - 4} ${x.b.hiW - 2} ${hy - 30}Z`, light(x.c, 0.2), 'none');
      for (let r = 0; r < 4; r++) for (let i = -2; i <= 2; i++) s += P(`M${i * 14 - 6 + (r % 2) * 7} ${x.b.waistY + 16 + r * 18} q6 8 12 0`, 'none', `stroke="${light(x.c, 0.45)}" stroke-width="1.6"`);
      return s;
    },
    bodiceDeco: (x) => P(`M-18 ${x.b.shY + 18} q4 -10 9 0 q4 -10 9 0 q4 -10 9 0 q4 -10 9 0`, 'none', 'stroke="#fff" stroke-width="2" opacity="0.8"'),
  }, ['summer']),
  dress('rainbowDress', 'Rainbow Dress', 160, '#ffffff', {
    len: 36, flare: 28, sleeve: 'puff', neck: 'scoop', skirtColor: () => '#ffffff',
    deco: (x, l) => {
      const cols = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
      let s = '';
      cols.forEach((c, i) => {
        const y = x.b.waistY + 8 + ((x.b.hipY + l - x.b.waistY - 8) * (i + 0.5)) / cols.length;
        const w = sideX(x.b, Math.min(y, x.b.hipY)) + (y > x.b.hipY ? 28 * ((y - x.b.hipY) / l) : 0) + 2;
        s += `<rect x="${f(-w)}" y="${f(y - 4)}" width="${f(w * 2)}" height="8" fill="${c}" opacity="0.9"/>`;
      });
      return s;
    },
  }, undefined, true),
];

// ---------- shoes ----------
export const shoeBlob = (cx: number, top: number, bottom: number, w = 17) => {
  const h = bottom - top;
  return `M${f(cx - w)} ${f(top + h * 0.5)} Q${f(cx - w)} ${f(top)} ${f(cx)} ${f(top)} Q${f(cx + w)} ${f(top)} ${f(cx + w)} ${f(top + h * 0.5)} L${f(cx + w)} ${f(bottom - 4)} Q${f(cx + w)} ${f(bottom)} ${f(cx + w - 4)} ${f(bottom)} L${f(cx - w + 4)} ${f(bottom)} Q${f(cx - w)} ${f(bottom)} ${f(cx - w)} ${f(bottom - 4)}Z`;
};
export function shoe(id: string, name: string, price: number, color: string, draw: (x: WearCtx, s: 1 | -1, L: number) => string, shaft?: (x: WearCtx, L: number) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'shoes', price, color, tags, fixed, foot: (x, s) => draw(x, s, x.L), leg: shaft ? (x) => shaft(x, x.L) : undefined };
}
export const SHOES: WearDef[] = [
  shoe('sneakers', 'Sneakers', 0, '#ff7eb6', (x, s, L) => cloth(shoeBlob(s * 3, L - 6, L + 14), x.c, 'none', 'y') +
    `<rect x="${s * 3 - 17}" y="${L + 8}" width="34" height="6" rx="3" fill="#fff"/>` + P(`M${s * 3 - 10} ${L - 6} Q${s * 3} ${L - 12} ${s * 3 + 10} ${L - 6}`, '#fff', 'opacity="0.6"') +
    line(s * 3 - 6, L - 1, s * 3 + 6, L - 1, '#fff', 2) + line(s * 3 - 5, L + 3, s * 3 + 5, L + 3, '#fff', 2)),
  shoe('maryjanes', 'Mary Janes', 0, '#e0457b', (x, s, L) => cloth(shoeBlob(s * 3, L - 2, L + 14, 16), x.c, 'none', 'y') +
    `<rect x="${s * 3 - 15}" y="${L - 4}" width="30" height="5" rx="2.5" fill="${dark(x.c, 0.2)}"/>` + circ(s * 3 + s * 9, L - 1.5, 2.6, '#ffd24a') + P(`M${s * 3 - 10} ${L + 3} Q${s * 3 - 4} ${L} ${s * 3 + 2} ${L + 2}`, 'none', 'stroke="#fff" stroke-width="2" opacity="0.6" stroke-linecap="round"'),
  (x, L) => `<rect x="${-x.b.legW / 2 - 1}" y="${L - 16}" width="${x.b.legW + 2}" height="16" rx="4" fill="#ffffff"/>` + P(`M${-x.b.legW / 2 - 2} ${L - 15} q3.5 -5 7 0 q3.5 -5 7 0 q3.5 -5 7 0 q3.5 -5 7 0`, '#ffffff')),
  shoe('sandals', 'Sandals', 0, '#ffab5e', (x, s, L) => P(shoeBlob(s * 3, L + 1, L + 12, 14), x.skin) +
    `<rect x="${s * 3 - 16}" y="${L + 10}" width="32" height="5" rx="2.5" fill="${dark(x.c, 0.1)}"/>` + line(s * 3 - 11, L + 9, s * 3 + 11, L + 3, x.c, 4) + line(s * 3 - 11, L + 3, s * 3 + 11, L + 9, x.c, 4) +
    flowerG(s * 3, L + 6, 5, '#fff'), undefined, ['summer']),
  shoe('boots', 'Ankle Boots', 40, '#8a5a3c', (x, s, L) => cloth(shoeBlob(s * 3, L - 6, L + 14), x.c, 'none', 'y') + `<rect x="${s * 3 - 17}" y="${L + 10}" width="34" height="4" rx="2" fill="${dark(x.c, 0.35)}"/>`,
    (x, L) => cloth(`M${-x.b.legW / 2 - 3} ${L - 26} L${x.b.legW / 2 + 3} ${L - 26} L${x.b.legW / 2 + 4} ${L} L${-x.b.legW / 2 - 4} ${L}Z`, x.c, 'none') + `<rect x="${-x.b.legW / 2 - 4}" y="${L - 28}" width="${x.b.legW + 8}" height="6" rx="3" fill="${dark(x.c, 0.18)}"/>`, ['fall']),
  shoe('rainboots', 'Rain Boots', 35, '#ffd84a', (x, s, L) => cloth(shoeBlob(s * 3, L - 6, L + 14, 18), x.c, 'none', 'y'),
    (x, L) => {
      const t = L * 0.4;
      return cloth(`M${-x.b.legW / 2 - 5} ${t} L${x.b.legW / 2 + 5} ${t} L${x.b.legW / 2 + 5} ${L + 2} L${-x.b.legW / 2 - 5} ${L + 2}Z`, x.c, 'none') +
        `<rect x="${-x.b.legW / 2 - 6}" y="${t - 2}" width="${x.b.legW + 12}" height="7" rx="3" fill="${dark(x.c, 0.15)}"/>` + line(-6, t + 10, -6, L - 6, '#fff', 3, 0.5);
    }, ['spring']),
  shoe('snowboots', 'Snow Boots', 60, '#c99bff', (x, s, L) => cloth(shoeBlob(s * 3, L - 6, L + 14, 19), x.c, 'none', 'y') + `<rect x="${s * 3 - 19}" y="${L + 9}" width="38" height="5" rx="2.5" fill="${dark(x.c, 0.3)}"/>`,
    (x, L) => cloth(`M${-x.b.legW / 2 - 5} ${L - 34} L${x.b.legW / 2 + 5} ${L - 34} L${x.b.legW / 2 + 6} ${L} L${-x.b.legW / 2 - 6} ${L}Z`, x.c, 'none') +
      [-12, -4, 4, 12].map((dx) => circ(dx, L - 34, 7, '#fffaf5')).join(''), ['winter']),
  shoe('flats', 'Ballet Flats', 25, '#ffb3c7', (x, s, L) => P(shoeBlob(s * 3, L - 2, L + 8, 14), x.skin) + cloth(shoeBlob(s * 3, L + 3, L + 14, 16), x.c, 'none', 'y') + `<g transform="translate(${s * 3} ${L + 5}) scale(0.28)">${bowG(0, 0, 1, dark(x.c, 0.1))}</g>`),
  shoe('hightops', 'High Tops', 45, '#9b6bff', (x, s, L) => cloth(shoeBlob(s * 3, L - 6, L + 14), x.c, 'none', 'y') + `<rect x="${s * 3 - 17}" y="${L + 7}" width="34" height="7" rx="3" fill="#fff"/>` + circ(s * 3 + s * 9, L - 14, 4.5, '#fff') + P(starD(s * 3 + s * 9, L - 14, 3.5), x.c),
    (x, L) => cloth(`M${-x.b.legW / 2 - 4} ${L - 22} L${x.b.legW / 2 + 4} ${L - 22} L${x.b.legW / 2 + 4} ${L} L${-x.b.legW / 2 - 4} ${L}Z`, x.c, 'none') + `<rect x="${-x.b.legW / 2 - 4}" y="${L - 24}" width="${x.b.legW + 8}" height="5" rx="2.5" fill="#fff"/>`),
  shoe('bunnySlippers', 'Bunny Slippers', 50, '#ffffff', (x, s, L) => {
    const cx = s * 3;
    return P(`M${cx - 7} ${L - 2} Q${cx - 12} ${L - 26} ${cx - 6} ${L - 24} Q${cx - 2} ${L - 18} ${cx - 3} ${L - 2}Z`, x.c) + P(`M${cx + 7} ${L - 2} Q${cx + 12} ${L - 26} ${cx + 6} ${L - 24} Q${cx + 2} ${L - 18} ${cx + 3} ${L - 2}Z`, x.c) +
      P(`M${cx - 6} ${L - 4} Q${cx - 8} ${L - 18} ${cx - 6} ${L - 19}`, 'none', 'stroke="#ffb3c7" stroke-width="3" stroke-linecap="round"') +
      cloth(shoeBlob(cx, L - 4, L + 14, 19), x.c, 'none', 'y') + circ(cx - 6, L + 3, 2, '#3a2a3a') + circ(cx + 6, L + 3, 2, '#3a2a3a') + circ(cx, L + 7, 2.2, '#ff9ec7');
  }),
  shoe('skates', 'Roller Skates', 90, '#5fd3b5', (x, s, L) => cloth(shoeBlob(s * 3, L - 8, L + 10), x.c, 'none', 'y') + `<rect x="${s * 3 - 18}" y="${L + 8}" width="36" height="5" rx="2" fill="#fff"/>` +
    circ(s * 3 - 10, L + 17, 5.5, '#ffd36b', 'stroke="#d9a63a" stroke-width="1.5"') + circ(s * 3 + 10, L + 17, 5.5, '#ffd36b', 'stroke="#d9a63a" stroke-width="1.5"'),
    (x, L) => cloth(`M${-x.b.legW / 2 - 4} ${L - 28} L${x.b.legW / 2 + 4} ${L - 28} L${x.b.legW / 2 + 4} ${L} L${-x.b.legW / 2 - 4} ${L}Z`, x.c, 'none') + line(-5, L - 22, 5, L - 18, '#fff', 2) + line(-5, L - 14, 5, L - 10, '#fff', 2), ['summer']),
  shoe('heels', 'Party Heels', 70, '#ff4f8b', (x, s, L) => P(shoeBlob(s * 3, L - 2, L + 8, 13), x.skin) + cloth(`M${s * 3 - 14} ${L + 2} Q${s * 3} ${L - 6} ${s * 3 + 14} ${L + 2} L${s * 3 + 14} ${L + 10} L${s * 3 - 14} ${L + 10}Z`, x.c, 'none') +
    `<rect x="${s * 3 + s * 8 - 2.5}" y="${L + 8}" width="5" height="6" fill="${dark(x.c, 0.3)}"/>` + P(sparkleD(s * 3, L + 3, 4), '#fff')),
];
// Mary janes come with frilly socks.
SHOES[1].leg = (x) => `<rect x="${-x.b.legW / 2 - 1}" y="${x.L - 16}" width="${x.b.legW + 2}" height="16" rx="4" fill="#ffffff"/>` + P(`M${-x.b.legW / 2 - 2} ${x.L - 15} q3.5 -5 7 0 q3.5 -5 7 0 q3.5 -5 7 0 q3.5 -5 7 0`, '#ffffff');

// ---------- head ----------
export function headItem(id: string, name: string, price: number, color: string, draw: (x: WearCtx, R: number, hy: number) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'head', price, color, tags, fixed, head: (x) => draw(x, x.b.R, x.b.headY) };
}
export const arcPts = (R: number, hy: number, a0: number, a1: number, n: number, rr = 1.02) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
    pts.push([Math.cos(a) * R * rr, hy - R * 0.04 + Math.sin(a) * R * rr * 0.97]);
  }
  return pts;
};
export const HEAD: WearDef[] = [
  headItem('bow', 'Cute Bow', 0, '#ff4f8b', (x, R, hy) => bowG(R * 0.55, hy - R * 0.78, 1.15, x.c)),
  headItem('bigbow', 'Big Bow', 30, '#ff7eb6', (x, R, hy) => bowG(0, hy - R * 1.0, 2.0, x.c)),
  headItem('headband', 'Headband', 0, '#9b6bff', (x, R, hy) => `<path d="M${-R * 0.98} ${hy + R * 0.02} A${R * 1.02} ${R * 1.0} 0 0 1 ${R * 0.98} ${hy + R * 0.02}" fill="none" stroke="${x.c}" stroke-width="${R * 0.13}" stroke-linecap="round"/>` +
    `<path d="M${-R * 0.7} ${hy - R * 0.7} A${R} ${R} 0 0 1 ${R * 0.1} ${hy - R * 1.0}" fill="none" stroke="#fff" stroke-width="${R * 0.035}" stroke-linecap="round" opacity="0.6"/>`),
  headItem('flowercrown', 'Flower Crown', 40, '#ff9ec7', (x, R, hy) => {
    const pts = arcPts(R, hy, 195, 345, 8);
    let s = `<path d="M${pts[0][0]} ${pts[0][1]} ${pts.map((p) => `L${f(p[0])} ${f(p[1])}`).join(' ')}" stroke="#5fae6b" stroke-width="5" fill="none"/>`;
    pts.forEach((p, i) => {
      if (i % 2) s += `<ellipse cx="${f(p[0])}" cy="${f(p[1] - 6)}" rx="7" ry="4" fill="#6fc47c" transform="rotate(${i * 25} ${f(p[0])} ${f(p[1] - 6)})"/>`;
    });
    pts.forEach((p, i) => (s += flowerG(p[0], p[1], 10 + (i % 2) * 2, i % 3 === 0 ? '#fff' : i % 3 === 1 ? x.c : '#ffd36b', i % 3 === 2 ? '#ff9ec7' : '#ffd36b')));
    return s;
  }, ['spring']),
  headItem('tiara', 'Tiara', 60, '#ff7eb6', (x, R, hy) => {
    const y = hy - R * 0.86;
    return `<path d="M${-R * 0.5} ${y + 10} Q0 ${y - 4} ${R * 0.5} ${y + 10} L${R * 0.42} ${y - 6} L${R * 0.22} ${y + 2} L0 ${y - 22} L${-R * 0.22} ${y + 2} L${-R * 0.42} ${y - 6}Z" fill="url(#g-silver)" stroke="#b9bdd0" stroke-width="1"/>` +
      circ(0, y - 6, 6, x.c) + circ(-R * 0.28, y + 2, 3.5, '#7cc8ff') + circ(R * 0.28, y + 2, 3.5, '#7cc8ff') + circ(-2, y - 8, 2, '#fff');
  }),
  headItem('crown', 'Royal Crown', 120, '#e0245e', (x, R, hy) => {
    const y = hy - R * 0.95;
    return `<path d="M${-R * 0.42} ${y + 14} L${-R * 0.48} ${y - 26} L${-R * 0.22} ${y - 6} L0 ${y - 36} L${R * 0.22} ${y - 6} L${R * 0.48} ${y - 26} L${R * 0.42} ${y + 14} Q0 ${y + 22} ${-R * 0.42} ${y + 14}Z" fill="url(#g-gold)" stroke="#c98a1e" stroke-width="1.5"/>` +
      circ(0, y + 4, 7, x.c) + circ(-R * 0.28, y + 6, 4.5, '#7cc8ff') + circ(R * 0.28, y + 6, 4.5, '#5fd3b5') + circ(0, y - 36, 4.5, '#fff') + circ(-R * 0.48, y - 26, 3.5, '#fff') + circ(R * 0.48, y - 26, 3.5, '#fff') + circ(-2, y + 2, 2.2, '#fff', 'opacity="0.8"');
  }),
  headItem('beanie', 'Pompom Beanie', 35, '#ff7eb6', (x, R, hy) => {
    const y0 = hy - R * 0.25;
    const d = `M${-R * 1.04} ${y0} C${-R * 1.1} ${hy - R * 1.25} ${R * 1.1} ${hy - R * 1.25} ${R * 1.04} ${y0}Z`;
    let s = cloth(d, x.c, x.p);
    for (let i = -3; i <= 3; i++) s += line(i * R * 0.24, y0 - 4, i * R * 0.2, hy - R * 0.85 + Math.abs(i) * 5, dark(x.c, 0.15), 3, 0.5);
    s += `<rect x="${-R * 1.08}" y="${y0 - 10}" width="${R * 2.16}" height="${R * 0.28}" rx="${R * 0.12}" fill="${dark(x.c, 0.1)}"/>`;
    for (let i = -4; i <= 4; i++) s += line(i * R * 0.22, y0 - 6, i * R * 0.22, y0 + R * 0.28 - 14, dark(x.c, 0.25), 2.5, 0.45);
    return s + circ(0, hy - R * 1.1, R * 0.24, '#fffaf5') + circ(-R * 0.08, hy - R * 1.17, R * 0.08, '#fff');
  }, ['winter', 'fall']),
  headItem('sunhat', 'Sun Hat', 40, '#f4dca0', (x, R, hy) => {
    const y = hy - R * 0.5;
    return `<ellipse cx="0" cy="${y}" rx="${R * 1.6}" ry="${R * 0.3}" fill="${x.c}"/><ellipse cx="0" cy="${y}" rx="${R * 1.6}" ry="${R * 0.3}" fill="url(#g-shadeY)"/>` +
      cloth(`M${-R * 0.78} ${y} C${-R * 0.8} ${hy - R * 1.45} ${R * 0.8} ${hy - R * 1.45} ${R * 0.78} ${y}Z`, x.c, x.p) +
      `<path d="M${-R * 0.78} ${y - 6} Q0 ${y + 2} ${R * 0.78} ${y - 6} L${R * 0.76} ${y - 22} Q0 ${y - 14} ${-R * 0.76} ${y - 22}Z" fill="#ff7eb6"/>` + flowerG(R * 0.62, y - 16, 12, '#fff');
  }, ['summer']),
  headItem('cap', 'Baseball Cap', 0, '#4f9dff', (x, R, hy) => {
    const y = hy - R * 0.42;
    return cloth(`M${-R * 1.0} ${y} C${-R * 1.04} ${hy - R * 1.22} ${R * 1.04} ${hy - R * 1.22} ${R * 1.0} ${y}Z`, x.c, x.p) +
      `<path d="M${-R * 1.0} ${y - 4} Q${R * 0.2} ${y - 18} ${R * 1.25} ${y + 4} Q${R * 0.2} ${y + 14} ${-R * 1.0} ${y + 6}Z" fill="${dark(x.c, 0.2)}"/>` + circ(0, hy - R * 1.08, 6, dark(x.c, 0.2)) + P(starD(-R * 0.1, hy - R * 0.72, 13), '#fff');
  }, ['summer']),
  headItem('earmuffs', 'Earmuffs', 30, '#ff9ec7', (x, R, hy) => `<path d="M${-R * 0.98} ${hy} A${R * 1.03} ${R * 1.02} 0 0 1 ${R * 0.98} ${hy}" fill="none" stroke="${dark(x.c, 0.2)}" stroke-width="8"/>` +
    [-1, 1].map((s) => circ(s * R * 1.0, hy + R * 0.1, R * 0.3, x.c) + circ(s * R * 1.0, hy + R * 0.1, R * 0.3, 'url(#g-face)') + circ(s * R * 0.96 - 4, hy + R * 0.02, R * 0.08, '#fff', 'opacity="0.7"')).join(''), ['winter']),
  headItem('bunnyears', 'Bunny Ears', 45, '#ffffff', (x, R, hy) => {
    const ear = (s: number) => `<g transform="rotate(${s * 12} ${s * R * 0.35} ${hy - R * 0.85})">` +
      P(`M${s * R * 0.35 - 14} ${hy - R * 0.85} C${s * R * 0.35 - 22} ${hy - R * 1.9} ${s * R * 0.35 + 22} ${hy - R * 1.9} ${s * R * 0.35 + 14} ${hy - R * 0.85}Z`, x.c) +
      P(`M${s * R * 0.35 - 7} ${hy - R * 0.9} C${s * R * 0.35 - 11} ${hy - R * 1.65} ${s * R * 0.35 + 11} ${hy - R * 1.65} ${s * R * 0.35 + 7} ${hy - R * 0.9}Z`, '#ffb3c7') + '</g>';
    return ear(-1) + ear(1) + `<path d="M${-R * 0.96} ${hy - R * 0.05} A${R * 1.02} ${R} 0 0 1 ${R * 0.96} ${hy - R * 0.05}" fill="none" stroke="${x.c}" stroke-width="9"/>`;
  }, ['spring']),
  headItem('catears', 'Kitty Ears', 35, '#2d2a3a', (x, R, hy) => [-1, 1].map((s) => P(`M${s * R * 0.3} ${hy - R * 0.9} L${s * R * 0.75} ${hy - R * 1.32} L${s * R * 0.86} ${hy - R * 0.62}Z`, x.c) + P(`M${s * R * 0.4} ${hy - R * 0.88} L${s * R * 0.72} ${hy - R * 1.16} L${s * R * 0.78} ${hy - R * 0.72}Z`, '#ff9ec7')).join('') +
    `<path d="M${-R * 0.96} ${hy - R * 0.05} A${R * 1.02} ${R} 0 0 1 ${R * 0.96} ${hy - R * 0.05}" fill="none" stroke="${x.c}" stroke-width="8"/>`),
  headItem('witch', 'Witch Hat', 55, '#6b3fa0', (x, R, hy) => {
    const y = hy - R * 0.6;
    return `<ellipse cx="0" cy="${y}" rx="${R * 1.45}" ry="${R * 0.24}" fill="${dark(x.c, 0.15)}"/>` +
      cloth(`M${-R * 0.7} ${y} Q${-R * 0.3} ${y - R * 0.9} ${R * 0.1} ${y - R * 1.6} Q${R * 0.6} ${y - R * 1.4} ${R * 0.75} ${y - R * 1.3} Q${R * 0.35} ${y - R * 0.8} ${R * 0.7} ${y}Z`, x.c, x.p) +
      `<path d="M${-R * 0.7} ${y - 4} Q0 ${y + 4} ${R * 0.7} ${y - 4} L${R * 0.64} ${y - 18} Q0 ${y - 10} ${-R * 0.64} ${y - 18}Z" fill="#ffab5e"/>` + P(starD(0, y - 10, 8), '#ffe680');
  }, ['fall']),
  headItem('santa', 'Holiday Hat', 40, '#e8384f', (x, R, hy) => {
    const y = hy - R * 0.45;
    return cloth(`M${-R * 0.98} ${y} C${-R * 0.9} ${hy - R * 1.5} ${R * 0.5} ${hy - R * 1.6} ${R * 1.3} ${hy - R * 0.6} L${R * 0.98} ${y}Z`, x.c, x.p) +
      `<rect x="${-R * 1.06}" y="${y - 14}" width="${R * 2.12}" height="${R * 0.3}" rx="${R * 0.15}" fill="#fffaf5"/>` + circ(R * 1.3, hy - R * 0.6, R * 0.2, '#fffaf5');
  }, ['winter']),
  headItem('unicorn', 'Unicorn Horn', 85, '#c99bff', (x, R, hy) => {
    const y = hy - R * 0.9;
    let s = `<path d="M${-R * 0.18} ${y + 6} L0 ${y - R * 0.75} L${R * 0.18} ${y + 6}Z" fill="url(#g-gold)"/>`;
    for (let i = 1; i < 4; i++) s += line(-R * 0.18 + i * 3.5, y + 6 - i * R * 0.17, R * 0.18 - i * 3.5, y + 2 - i * R * 0.19, '#d99a1e', 2);
    s += [-1, 1].map((sd) => P(`M${sd * R * 0.45} ${y + 8} L${sd * R * 0.62} ${y - 26} L${sd * R * 0.76} ${y + 14}Z`, '#fff') + P(`M${sd * R * 0.5} ${y + 6} L${sd * R * 0.62} ${y - 14} L${sd * R * 0.7} ${y + 10}Z`, '#ffb3c7')).join('');
    return s + flowerG(-R * 0.28, y + 10, 9, x.c) + flowerG(R * 0.28, y + 10, 9, '#ffb3c7') + flowerG(0, y + 14, 7, '#7cc8ff');
  }, undefined),
  headItem('beret', 'Beret', 30, '#e0457b', (x, R, hy) => cloth(`M${-R * 0.95} ${hy - R * 0.58} C${-R * 1.2} ${hy - R * 1.3} ${R * 1.25} ${hy - R * 1.4} ${R * 1.15} ${hy - R * 0.62} Q${R * 0.1} ${hy - R * 0.4} ${-R * 0.95} ${hy - R * 0.58}Z`, x.c, x.p) + line(R * 0.1, hy - R * 1.18, R * 0.16, hy - R * 1.3, dark(x.c, 0.2), 5), ['fall']),
  headItem('starclips', 'Star Clips', 15, '#ffd36b', (x, R, hy) => P(starD(R * 0.62, hy - R * 0.5, 11), x.c, `stroke="${dark(x.c, 0.2)}" stroke-width="1.2"`) + P(starD(R * 0.82, hy - R * 0.22, 9), '#ff9ec7', 'stroke="#e0457b" stroke-width="1.2"') + P(starD(R * 0.4, hy - R * 0.72, 8), '#7cc8ff', 'stroke="#4f9dff" stroke-width="1.2"')),
  headItem('flowerclip', 'Big Flower', 20, '#ff7eb6', (x, R, hy) => flowerG(R * 0.72, hy - R * 0.45, 22, x.c) + `<ellipse cx="${R * 0.48}" cy="${hy - R * 0.28}" rx="12" ry="6" fill="#6fc47c" transform="rotate(30 ${R * 0.48} ${hy - R * 0.28})"/>`, ['spring', 'summer']),
];

// ---------- face ----------
export function faceItem(id: string, name: string, price: number, color: string, draw: (x: WearCtx, R: number, hy: number) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'face', price, color, tags, fixed, head: (x) => draw(x, x.b.R, x.b.headY) };
}
export const eyePos = (R: number, hy: number) => ({ ex: R * 0.38, ey: hy + R * 0.12 });
export const FACE: WearDef[] = [
  faceItem('glasses', 'Round Glasses', 0, '#e0457b', (x, R, hy) => {
    const { ex, ey } = eyePos(R, hy);
    return [-1, 1].map((s) => circ(s * ex, ey, R * 0.24, 'rgba(255,255,255,0.18)', `stroke="${x.c}" stroke-width="4.5"`)).join('') +
      `<path d="M${-ex + R * 0.24} ${ey - 3} Q0 ${ey - 12} ${ex - R * 0.24} ${ey - 3}" fill="none" stroke="${x.c}" stroke-width="4"/>`;
  }),
  faceItem('heartShades', 'Heart Shades', 40, '#ff4f8b', (x, R, hy) => {
    const { ex, ey } = eyePos(R, hy);
    return [-1, 1].map((s) => P(heartD(s * ex, ey - R * 0.2, R * 0.27), x.c, 'opacity="0.88" stroke="#fff" stroke-width="3"') + P(heartD(s * ex - 6, ey - R * 0.15, R * 0.07), '#fff', 'opacity="0.6"')).join('') +
      line(-ex + R * 0.2, ey - 4, ex - R * 0.2, ey - 4, '#fff', 3);
  }, ['summer']),
  faceItem('starGlasses', 'Star Glasses', 45, '#ffd36b', (x, R, hy) => {
    const { ex, ey } = eyePos(R, hy);
    return [-1, 1].map((s) => P(starD(s * ex, ey, R * 0.32, 0.55), x.c, 'opacity="0.9" stroke="#fff" stroke-width="2.5"')).join('') + line(-ex + R * 0.24, ey - 2, ex - R * 0.24, ey - 2, '#fff', 3);
  }),
  faceItem('shades', 'Sunglasses', 30, '#2d2a3a', (x, R, hy) => {
    const { ex, ey } = eyePos(R, hy);
    return [-1, 1].map((s) => `<rect x="${s * ex - R * 0.27}" y="${ey - R * 0.17}" width="${R * 0.54}" height="${R * 0.34}" rx="${R * 0.14}" fill="${x.c}" opacity="0.92"/>` + line(s * ex - R * 0.14, ey - R * 0.07, s * ex - R * 0.02, ey - R * 0.12, '#fff', 3, 0.5)).join('') +
      line(-ex + R * 0.27, ey - 4, ex - R * 0.27, ey - 4, x.c, 4);
  }, ['summer']),
  faceItem('butterflyPaint', 'Butterfly Paint', 35, '#c99bff', (x, R, hy) => {
    const cx = R * 0.6, cy = hy + R * 0.38;
    return `<g opacity="0.92">${P(`M${cx} ${cy} C${cx - 16} ${cy - 22} ${cx - 22} ${cy - 2} ${cx} ${cy}Z`, x.c)}${P(`M${cx} ${cy} C${cx + 16} ${cy - 22} ${cx + 22} ${cy - 2} ${cx} ${cy}Z`, x.c)}` +
      `${P(`M${cx} ${cy} C${cx - 12} ${cy + 14} ${cx - 2} ${cy + 16} ${cx} ${cy}Z`, '#ff9ec7')}${P(`M${cx} ${cy} C${cx + 12} ${cy + 14} ${cx + 2} ${cy + 16} ${cx} ${cy}Z`, '#ff9ec7')}` +
      `${circ(cx - 8, cy - 8, 2.5, '#fff')}${circ(cx + 8, cy - 8, 2.5, '#fff')}</g>`;
  }),
];

// ---------- neck ----------
export function neckItem(id: string, name: string, price: number, color: string, draw: (x: WearCtx, b: Body) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'neck', price, color, tags, fixed, over: (x) => draw(x, x.b) };
}
export const NECK: WearDef[] = [
  neckItem('pearls', 'Pearl Necklace', 50, '#fff8f0', (x, b) => {
    let s = '';
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / 10));
      s += circ(Math.cos(a) * 17, b.shY + 2 + Math.sin(a) * 14, 3.6, x.c, 'stroke="#e6d8c8" stroke-width="0.8"') + circ(Math.cos(a) * 17 - 1, b.shY + 1 + Math.sin(a) * 14, 1.2, '#fff');
    }
    return s;
  }, undefined),
  neckItem('heartNecklace', 'Heart Locket', 0, '#ff4f8b', (x, b) => `<path d="M-15 ${b.shY + 1} Q0 ${b.shY + 18} 15 ${b.shY + 1}" fill="none" stroke="url(#g-gold)" stroke-width="2.5"/>` + P(heartD(0, b.shY + 13, 9), x.c, 'stroke="#ffd24a" stroke-width="1.5"') + circ(-2.5, b.shY + 17, 1.6, '#fff', 'opacity="0.7"')),
  neckItem('scarf', 'Cozy Scarf', 30, '#e8384f', (x, b) => {
    const y = b.shY;
    let s = cloth(`M${-b.shW + 6} ${y - 2} Q0 ${y - 14} ${b.shW - 6} ${y - 2} L${b.shW - 4} ${y + 10} Q0 ${y + 22} ${-b.shW + 4} ${y + 10}Z`, x.c, x.p, 'y');
    s += cloth(`M8 ${y + 10} L24 ${y + 8} L28 ${b.waistY + 16} L12 ${b.waistY + 18}Z`, dark(x.c, 0.06), x.p);
    for (let i = 0; i < 4; i++) s += line(13 + i * 4.5, b.waistY + 17, 13.5 + i * 4.5, b.waistY + 25, dark(x.c, 0.1), 2.5);
    for (let i = -2; i <= 2; i++) s += line(i * 12, y - 4, i * 12 + 2, y + 14, light(x.c, 0.3), 3, 0.5);
    return s;
  }, ['winter', 'fall']),
  neckItem('bowtie', 'Bow Tie', 15, '#9b6bff', (x, b) => `<g transform="translate(0 ${b.shY + 6}) scale(0.62)">${bowG(0, 0, 1, x.c).replace(/<path d="M-2 2[^>]*>|<path d="M2 2[^>]*>/g, '')}</g>`),
  neckItem('lei', 'Flower Lei', 35, '#ff7eb6', (x, b) => {
    let s = '';
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI * (0.05 + 0.9 * (i / 9));
      s += flowerG(Math.cos(a) * 24, b.shY + 4 + Math.sin(a) * 20, 7.5, i % 2 ? x.c : '#ffd36b', i % 2 ? '#fff' : '#ff7eb6');
    }
    return s;
  }, ['summer']),
  neckItem('medal', 'Gold Medal', 100, '#e8384f', (x, b) => P(`M-14 ${b.shY} L-4 ${b.shY + 30} L4 ${b.shY + 30} L14 ${b.shY}L8 ${b.shY} L0 ${b.shY + 22} L-8 ${b.shY}Z`, x.c) +
    `<circle cx="0" cy="${b.shY + 38}" r="11" fill="url(#g-gold)" stroke="#c98a1e" stroke-width="1.5"/>` + P(starD(0, b.shY + 38, 6), '#fff3b0'), undefined, false),
];

// ---------- hand ----------
export function handItem(id: string, name: string, price: number, color: string, draw: (x: WearCtx) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'hand', price, color, tags, fixed, hand: draw };
}
export const HAND: WearDef[] = [
  handItem('purse', 'Little Purse', 0, '#ff7eb6', (x) => `<path d="M-10 -2 Q0 -22 10 -2" fill="none" stroke="${dark(x.c, 0.25)}" stroke-width="3"/>` +
    cloth('M-17 4 Q-18 -4 -10 -4 L10 -4 Q18 -4 17 4 L15 24 Q14 30 8 30 L-8 30 Q-14 30 -15 24Z', x.c, x.p) + `<rect x="-17" y="-4" width="34" height="9" rx="4" fill="${dark(x.c, 0.12)}"/>` + circ(0, 5, 3.5, '#ffd24a'), undefined),
  handItem('balloon', 'Heart Balloon', 20, '#ff4f6d', (x) => `<g transform="translate(0 0)"><path d="M0 0 Q30 -30 40 -60 Q48 -80 50 -112" fill="none" stroke="#ddd" stroke-width="1.5"/>` +
    P(heartD(50, -164, 32), x.c) + P(heartD(40, -156, 8), '#fff', 'opacity="0.55"') + P(`M46 -116 L54 -116 L50 -108Z`, dark(x.c, 0.2)) + '</g>'),
  handItem('teddy', 'Teddy Bear', 40, '#c98a5a', (x) => {
    const c = x.c, d = dark(c, 0.2), l = light(c, 0.35);
    return `<g transform="translate(16 8)">${circ(-14, -32, 8, c)}${circ(14, -32, 8, c)}${circ(-14, -32, 4, l)}${circ(14, -32, 4, l)}` +
      `<ellipse cx="0" cy="8" rx="19" ry="20" fill="${c}"/><ellipse cx="0" cy="10" rx="11" ry="12" fill="${l}"/>` + circ(0, -18, 18, c) + `<ellipse cx="0" cy="-12" rx="8" ry="6" fill="${l}"/>` +
      circ(-6, -21, 2.4, '#2d2a3a') + circ(6, -21, 2.4, '#2d2a3a') + `<ellipse cx="0" cy="-14" rx="3" ry="2" fill="${d}"/>` + `<g transform="translate(0 -4) scale(0.35)">${bowG(0, 0, 1, '#ff7eb6')}</g></g>`;
  }),
  handItem('icecream', 'Ice Cream', 15, '#ffb3c7', (x) => `<path d="M-11 -10 L11 -10 L0 16Z" fill="#e8b46a"/><path d="M-6 -6 L4 6 M4 -8 L-3 2" stroke="#c98a3e" stroke-width="1.5"/>` +
    circ(0, -20, 13, x.c) + circ(-7, -30, 10, '#fff3d8') + circ(8, -30, 9, '#a86b4a') + circ(0, -40, 5, '#e8384f') + circ(-4, -24, 3, '#fff', 'opacity="0.6"'), ['summer']),
  handItem('umbrella', 'Umbrella', 35, '#7cc8ff', (x) => {
    let s = `<g transform="rotate(28)"><path d="M0 10 L0 -110" stroke="#4a3f5e" stroke-width="3"/><path d="M0 10 Q0 18 -7 16" fill="none" stroke="#4a3f5e" stroke-width="3" stroke-linecap="round"/>`;
    s += cloth('M-62 -96 Q-60 -150 0 -152 Q60 -150 62 -96 Q52 -104 41 -96 Q31 -104 21 -96 Q10 -104 0 -96 Q-10 -104 -21 -96 Q-31 -104 -41 -96 Q-52 -104 -62 -96Z', x.c, x.p, 'y');
    return s + `<path d="M-21 -96 Q-14 -140 0 -152 M21 -96 Q14 -140 0 -152" fill="none" stroke="${dark(x.c, 0.15)}" stroke-width="1.5"/>` + circ(0, -154, 3.5, '#4a3f5e') + '</g>';
  }, ['spring']),
  handItem('wand', 'Magic Wand', 55, '#ff9ec7', (x) => `<path d="M0 8 L0 -54" stroke="${x.c}" stroke-width="4" stroke-linecap="round"/>` + P(starD(0, -64, 15), 'url(#g-gold)', 'stroke="#d99a1e" stroke-width="1.2"') +
    P(sparkleD(16, -82, 5), '#fff') + P(sparkleD(-15, -76, 4), '#fff8c8') + `<path d="M3 -52 q10 -6 18 2" fill="none" stroke="#ff7eb6" stroke-width="2.5"/>`),
  handItem('bouquet', 'Flower Bouquet', 30, '#ff7eb6', (x) => `<path d="M-4 16 L-8 -18 M2 16 L2 -24 M6 16 L12 -16" stroke="#5fae6b" stroke-width="3"/>` +
    flowerG(-10, -24, 10, x.c) + flowerG(10, -22, 10, '#ffd36b', '#ff7eb6') + flowerG(0, -36, 11, '#fff') + P('M-12 0 L12 0 L6 20 L-6 20Z', '#c99bff'), ['spring']),
  handItem('book', 'Story Book', 10, '#5fd3b5', (x) => `<g transform="rotate(-8)"><rect x="-16" y="-14" width="32" height="40" rx="3" fill="${x.c}"/><rect x="12" y="-12" width="5" height="36" fill="#fff"/>` + P(heartD(-2, -2, 7), '#fff') + '</g>'),
  handItem('lollipop', 'Lollipop', 10, '#ff4f8b', (x) => `<path d="M0 8 L0 -30" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` + circ(0, -46, 18, x.c) +
    `<path d="M0 -46 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
  handItem('mic', 'Microphone', 45, '#9b6bff', (x) => `<rect x="-5" y="-14" width="10" height="34" rx="4" fill="#4a4a5e"/>` + circ(0, -24, 12, 'url(#g-silver)') + `<rect x="-6" y="-14" width="12" height="5" fill="${x.c}"/>`),
];

// ---------- back ----------
export function backItem(id: string, name: string, price: number, color: string, draw: (x: WearCtx, b: Body) => string, over?: (x: WearCtx, b: Body) => string, tags?: Season[], fixed = false): WearDef {
  return { id, name, slot: 'back', price, color, tags, fixed, back: (x) => draw(x, x.b), over: over ? (x) => over(x, x.b) : undefined };
}
export const wing = (b: Body, s: number, c: string, kind: 'fairy' | 'butterfly' | 'angel' | 'bat') => {
  const y = b.shY + 10;
  if (kind === 'angel') {
    let g = '';
    for (let i = 0; i < 4; i++) g += P(`M${s * 10} ${y + i * 6} Q${s * (60 + i * 6)} ${y - 60 + i * 22} ${s * (100 - i * 10)} ${y - 40 + i * 30} Q${s * (60 - i * 4)} ${y + 10 + i * 10} ${s * 10} ${y + 10 + i * 8}Z`, i % 2 ? '#ffffff' : '#f2eef8', 'stroke="#e2dcef" stroke-width="1"');
    return g;
  }
  if (kind === 'bat') {
    return P(`M${s * 10} ${y} L${s * 100} ${y - 50} L${s * 92} ${y - 10} L${s * 110} ${y + 10} L${s * 84} ${y + 18} L${s * 92} ${y + 44} L${s * 60} ${y + 30} L${s * 10} ${y + 30}Z`, c) +
      P(`M${s * 20} ${y + 6} L${s * 90} ${y - 36}`, 'none', `stroke="${light(c, 0.2)}" stroke-width="2"`);
  }
  const top = P(`M${s * 8} ${y} C${s * 40} ${y - 90} ${s * 130} ${y - 80} ${s * 104} ${y - 10} C${s * 96} ${y + 10} ${s * 40} ${y + 14} ${s * 8} ${y + 8}Z`, c, `opacity="${kind === 'fairy' ? 0.62 : 0.95}" stroke="#fff" stroke-width="3"`);
  const bot = P(`M${s * 8} ${y + 10} C${s * 50} ${y + 14} ${s * 90} ${y + 40} ${s * 70} ${y + 70} C${s * 50} ${y + 90} ${s * 20} ${y + 50} ${s * 8} ${y + 18}Z`, kind === 'fairy' ? light(c, 0.3) : dark(c, 0.1), `opacity="${kind === 'fairy' ? 0.62 : 0.95}" stroke="#fff" stroke-width="3"`);
  const spots = kind === 'butterfly'
    ? circ(s * 70, y - 34, 11, '#fff', 'opacity="0.85"') + circ(s * 50, y + 42, 8, '#fff', 'opacity="0.85"') + circ(s * 92, y - 20, 6, '#2d2a3a', 'opacity="0.6"')
    : P(sparkleD(s * 76, y - 36, 6), '#fff') + P(sparkleD(s * 50, y + 40, 4), '#fff');
  return top + bot + spots;
};
export const BACK: WearDef[] = [
  backItem('fairy', 'Fairy Wings', 70, '#a8e6ff', (x, b) => `<g class="flutter">${wing(b, -1, x.c, 'fairy') + wing(b, 1, x.c, 'fairy')}</g>`),
  backItem('angel', 'Angel Wings', 110, '#ffffff', (x, b) => `<g class="flutter">${wing(b, -1, x.c, 'angel') + wing(b, 1, x.c, 'angel')}</g>`, undefined, undefined, true),
  backItem('butterfly', 'Butterfly Wings', 90, '#ff9a6b', (x, b) => `<g class="flutter">${wing(b, -1, x.c, 'butterfly') + wing(b, 1, x.c, 'butterfly')}</g>`, undefined, ['spring']),
  backItem('backpack', 'Backpack', 0, '#ff7eb6', (x, b) => cloth(`M${-b.shW - 10} ${b.shY + 6} Q${-b.shW - 12} ${b.shY - 12} 0 ${b.shY - 12} Q${b.shW + 12} ${b.shY - 12} ${b.shW + 10} ${b.shY + 6} L${b.shW + 8} ${b.waistY + 20} Q0 ${b.waistY + 28} ${-b.shW - 8} ${b.waistY + 20}Z`, x.c, x.p),
    (x, b) => line(-22, b.shY + 2, -26, b.waistY + 4, dark(x.c, 0.2), 6) + line(22, b.shY + 2, 26, b.waistY + 4, dark(x.c, 0.2), 6), ['fall']),
  backItem('cape', 'Hero Cape', 60, '#e8384f', (x, b) => cloth(`M${-b.shW + 4} ${b.shY - 4} L${b.shW - 4} ${b.shY - 4} Q${b.shW + 40} ${b.hipY} ${b.shW + 50} ${b.ankleY - 10} Q0 ${b.ankleY + 4} ${-b.shW - 50} ${b.ankleY - 10} Q${-b.shW - 40} ${b.hipY} ${-b.shW + 4} ${b.shY - 4}Z`, x.c, x.p),
    (x, b) => circ(-14, b.shY + 2, 5, '#ffd24a') + circ(14, b.shY + 2, 5, '#ffd24a') + line(-14, b.shY + 2, 14, b.shY + 2, '#ffd24a', 2)),
  backItem('batwings', 'Bat Wings', 45, '#5a3a7a', (x, b) => wing(b, -1, x.c, 'bat') + wing(b, 1, x.c, 'bat'), undefined, ['fall']),
];

/** The original items, shown first in each closet tab. */
export const FAVORITES: WearDef[] = [...TOPS, ...BOTTOMS, ...DRESSES, ...OUTER, ...SHOES, ...HEAD, ...FACE, ...NECK, ...HAND, ...BACK];
for (const w of FAVORITES) w.group ??= 'Favorites';
