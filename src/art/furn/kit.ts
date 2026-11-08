// The furniture kit: the item format, drawing helpers and design collections shared by every
// furniture catalog. Floor items are drawn with their base centre at (0, 0); wall items and rugs are
// centred on (0, 0); props sit on their base like floor items.
import { dark, light } from '../color';
import { cloth } from '../defs';
import type { Pattern } from '../defs';
import type { Season } from '../../types';
export { dark, light, cloth };
export { bowG, flowerG, heartD, sparkleD, starD } from '../wear';
export { motif, scatter } from '../motifs';

/** Lets a few outdoor items change with the season. */
export const artCtx: { season: Season } = { season: 'spring' };

export type Mount = 'floor' | 'wall' | 'rug' | 'prop';
export type FurnCat =
  | 'bedroom' | 'kids' | 'living' | 'electronics' | 'lighting' | 'kitchen' | 'bath'
  | 'decor' | 'plants' | 'wall' | 'rugs' | 'yard'
  | 'toys' | 'food' | 'outdoor' | 'school' | 'stage' | 'salon' | 'shop';

export interface SeatDef {
  x: number;
  y: number;
  pose: 'sit' | 'sleep' | 'slide';
  /** Motion shared by the seat and whoever sits in it: rocking around a pivot, or bouncing up and down. */
  anim?: { pivot: [number, number]; amp: number; dur: number; phase?: number; kind?: 'rotate' | 'bounce' };
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
  /** Catalog section, e.g. "Bunk Beds". */
  group?: string;
  /** Design collection id from FURN_STYLES, e.g. "princess". */
  style?: string;
}

export const f = (n: number) => n.toFixed(1);
export const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
export const box = (x: number, y: number, w: number, h: number, r: number, c: string, pat = 'none', shade: 'x' | 'y' = 'x') => {
  const d = roundRectD(x, y, w, h, r);
  return cloth(d, c, pat, shade);
};
export function roundRectD(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)} H${f(x + w - r)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H${f(x + r)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}
export const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
export const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
export const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const Ln = (x1: number, y1: number, x2: number, y2: number, c: string, w = 3, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
export const leg = (x: number, y: number, h: number, c: string, w = 10) => R(x - w / 2, y, w, h, w / 2.5, c);
export const glow = (x: number, y: number, r: number) => E(x, y, r, r, 'url(#g-glow)');
export const WOOD = '#d9a477';
export const WOOD_D = '#b07a4f';
export const flicker = (dur = 0.5) => `<animateTransform attributeName="transform" type="scale" values="1 1;1.06 0.92;0.96 1.08;1 1" dur="${dur}s" repeatCount="indefinite" additive="sum"/>`;
export const flame = (x: number, y: number, s: number) =>
  `<g transform="translate(${f(x)} ${f(y)})"><g>${flicker(0.4 + Math.abs(x % 3) * 0.1)}${P(`M0 ${-26 * s} C${12 * s} ${-12 * s} ${10 * s} 0 0 0 C${-10 * s} 0 ${-12 * s} ${-12 * s} 0 ${-26 * s}Z`, '#ff8a3d')}${P(`M0 ${-16 * s} C${6 * s} ${-8 * s} ${6 * s} 0 0 0 C${-6 * s} 0 ${-6 * s} ${-8 * s} 0 ${-16 * s}Z`, '#ffd84a')}</g></g>`;


/** Design collections that run across every room, so a whole room can match. */
export interface FurnStyle {
  id: string;
  name: string;
  /** Main color (the one the paint button changes). */
  main: string;
  accent: string;
  /** Frame/wood color; can be white or gold-ish for fancy styles. */
  wood: string;
  /** Handles, legs and knobs: a color or a gradient url. */
  metal: string;
  /** Cushions, bedding and soft parts. */
  soft: string;
  trim: string;
  pattern: Pattern;
  /** A motif from ../motifs used for little decorations. */
  motif: string;
}
export const FURN_STYLES: FurnStyle[] = [
  { id: 'sweet', name: 'Sweet', main: '#ff9ec7', accent: '#ffffff', wood: '#f6e3d6', metal: 'url(#g-gold)', soft: '#ffd9e8', trim: '#ffffff', pattern: 'none', motif: 'heart' },
  { id: 'princess', name: 'Princess', main: '#ffc7dc', accent: '#ffffff', wood: '#ffffff', metal: 'url(#g-gold)', soft: '#fff3f8', trim: '#ffd24a', pattern: 'hearts', motif: 'crown' },
  { id: 'modern', name: 'Modern', main: '#e6e8f0', accent: '#4a4a5e', wood: '#c9a27e', metal: '#4a4a5e', soft: '#9aa3b5', trim: '#2d2a3a', pattern: 'none', motif: 'bolt' },
  { id: 'cottage', name: 'Cottage', main: '#a8e6cf', accent: '#ffffff', wood: '#c98a5a', metal: '#8a5a3c', soft: '#fff3d6', trim: '#ffffff', pattern: 'flowers', motif: 'daisy' },
  { id: 'rainbow', name: 'Rainbow', main: '#ffd36b', accent: '#7cc8ff', wood: '#ffffff', metal: '#ff7eb6', soft: '#ffb3c7', trim: '#c99bff', pattern: 'stripes', motif: 'rainbow' },
  { id: 'space', name: 'Space', main: '#3f4f9a', accent: '#ffe680', wood: '#2d2a3a', metal: '#c9cfdd', soft: '#7a6ad8', trim: '#ffe680', pattern: 'stars', motif: 'planet' },
  { id: 'beach', name: 'Beach', main: '#9fd6ff', accent: '#ffffff', wood: '#f4dca0', metal: '#c9cfdd', soft: '#fff3d6', trim: '#ffffff', pattern: 'stripes', motif: 'fish' },
  { id: 'candy', name: 'Candy', main: '#ffb3c7', accent: '#a8e6cf', wood: '#ffffff', metal: '#ff7eb6', soft: '#fff3b0', trim: '#ff4f8b', pattern: 'dots', motif: 'candy' },
  { id: 'woodland', name: 'Woodland', main: '#8fbf6a', accent: '#ffab5e', wood: '#a86b4a', metal: '#6b4a3a', soft: '#f4ead9', trim: '#f4ead9', pattern: 'check', motif: 'leaf' },
  { id: 'boho', name: 'Boho', main: '#f4dca0', accent: '#e8907a', wood: '#c98a5a', metal: '#c9a27e', soft: '#fff3e6', trim: '#e8907a', pattern: 'none', motif: 'sun' },
  { id: 'retro', name: 'Retro', main: '#ff7a6b', accent: '#5fd3b5', wood: '#e8b46a', metal: '#c9cfdd', soft: '#fff3d6', trim: '#ffd36b', pattern: 'check', motif: 'star' },
];
export const FURN_STYLE_BY_ID: Record<string, FurnStyle> = Object.fromEntries(FURN_STYLES.map((s) => [s.id, s]));

/** Price for the nth design of a furniture type: the first two are free, then it climbs. */
export const stylePrice = (i: number, base = 20, step = 8, cap = 180) => (i < 2 ? 0 : Math.min(cap, base + (i - 2) * step));
