// Pets: cute companion animals drawn in code. Each pet stands with its feet centred at (0, 0) and
// faces right. The body is seen from the side and the big round head looks at the player, like the
// dolls. The head is drawn in a "standard" frame (radius 46) and scaled per kind, so every head
// accessory, pair of glasses and collar fits every kind.
import { dark, light } from './color';
import { bowG, flowerG, heartD, sparkleD, starD } from './wear';
import type { PetLook, PetSlot } from '../types';

export type PetPose = 'stand' | 'sit' | 'sleep' | 'held' | 'walk';
export type PetExpr = 'normal' | 'happy' | 'eat' | 'sleep' | 'sad';

const f = (n: number) => n.toFixed(1);
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const S = (d: string, c: string, w: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const G = (t: string, inner: string) => `<g transform="${t}">${inner}</g>`;
const edge = (c: string, w = 1.8) => `stroke="${dark(c, 0.24)}" stroke-width="${w}"`;
const INK = '#2a1626';
const INNER = '#ffb3c7';
const NOSE = '#ff8aa5';
const GOLD = 'url(#g-gold)';

// Render-time switches (rendering is synchronous, so plain module state is fine).
let STILL = false;
let PH = 0;
let SEQ = 0;
const anim = (s: string) => (STILL ? '' : s);
const rot = (vals: number[], cx: number, cy: number, dur: number, extra = '') =>
  anim(`<animateTransform attributeName="transform" type="rotate" values="${vals.map((v) => `${v} ${f(cx)} ${f(cy)}`).join(';')}" dur="${dur}s" begin="${f(-PH * dur)}s" repeatCount="indefinite" ${extra}/>`);
const move = (vals: string, dur: number, extra = '') =>
  anim(`<animateTransform attributeName="transform" type="translate" values="${vals}" dur="${dur}s" begin="${f(-PH * dur)}s" repeatCount="indefinite" ${extra}/>`);
/** A gentle scale around a point: wrap() puts content in a group that scales about (cx, cy). */
const scaleAbout = (cx: number, cy: number, vals: string, dur: number, inner: string, extra = '') =>
  STILL ? inner : `<g transform="translate(${f(cx)} ${f(cy)})"><g><animateTransform attributeName="transform" type="scale" values="${vals}" dur="${dur}s" begin="${f(-PH * dur)}s" repeatCount="indefinite" ${extra}/><g transform="translate(${f(-cx)} ${f(-cy)})">${inner}</g></g></g>`;

// ---------------- catalogs ----------------
export interface PetKind {
  id: string;
  name: string;
  fur: string;
  fur2: string;
  pattern: string;
  eyes: string;
}

type Ears = 'flop' | 'cat' | 'bunny' | 'round' | 'pony' | 'tuft' | 'fox' | 'pig' | 'panda';
type Tail = 'wag' | 'cat' | 'puff' | 'none' | 'hair' | 'duck' | 'stub' | 'bushy' | 'curl';
type Face = 'dog' | 'cat' | 'bunny' | 'hamster' | 'horse' | 'beak' | 'panda' | 'fox' | 'pig';

interface KindArt extends PetKind {
  /** Head scale (standard head radius is 46). */
  u: number;
  hw: number;
  hh: number;
  rx: number;
  ry: number;
  legH: number;
  legW: number;
  /** Head position: forward (x rx) and how far it rises above the body top (x head height). */
  ax: number;
  ay: number;
  ears: Ears;
  tail: Tail;
  face: Face;
  /** Eye height in the standard head frame. */
  ey: number;
  /** How far ears / horn reach above the head top, standard units (for height and thumbnails). */
  earTop: number;
  /** Collar width scale. */
  nw: number;
  biped?: boolean;
  hoof?: boolean;
  neck?: boolean;
  horn?: boolean;
  earsFur2?: boolean;
}

const KINDS: KindArt[] = [
  { id: 'puppy', name: 'Puppy', fur: '#e8b47a', fur2: '#8a5a3c', pattern: 'plain', eyes: 'round', u: 1.08, hw: 1.06, hh: 0.95, rx: 46, ry: 31, legH: 32, legW: 17, ax: 0.66, ay: 0.25, ears: 'flop', tail: 'wag', face: 'dog', ey: 0, earTop: 2, nw: 1, earsFur2: true },
  { id: 'kitten', name: 'Kitten', fur: '#f6a65a', fur2: '#fff3e0', pattern: 'stripes', eyes: 'mint', u: 1.02, hw: 1.1, hh: 0.92, rx: 42, ry: 27, legH: 28, legW: 14, ax: 0.66, ay: 0.25, ears: 'cat', tail: 'cat', face: 'cat', ey: 0, earTop: 24, nw: 0.92 },
  { id: 'bunny', name: 'Bunny', fur: '#fff6f8', fur2: '#ffb3d1', pattern: 'tips', eyes: 'lashes', u: 1.0, hw: 1.02, hh: 0.96, rx: 42, ry: 32, legH: 18, legW: 16, ax: 0.6, ay: 0.25, ears: 'bunny', tail: 'puff', face: 'bunny', ey: 0, earTop: 66, nw: 0.95 },
  { id: 'hamster', name: 'Hamster', fur: '#f2bf7a', fur2: '#fff8ee', pattern: 'tummy', eyes: 'button', u: 1.06, hw: 1.12, hh: 0.92, rx: 50, ry: 38, legH: 12, legW: 13, ax: 0.56, ay: -0.16, ears: 'round', tail: 'none', face: 'hamster', ey: -2, earTop: 6, nw: 1.05 },
  { id: 'pony', name: 'Pony', fur: '#c9a27e', fur2: '#6b4a3a', pattern: 'socks', eyes: 'round', u: 1.1, hw: 0.94, hh: 1.1, rx: 58, ry: 34, legH: 54, legW: 17, ax: 0.78, ay: 0.85, ears: 'pony', tail: 'hair', face: 'horse', ey: -12, earTop: 22, nw: 0.92, hoof: true, neck: true },
  { id: 'unicorn', name: 'Unicorn', fur: '#ffffff', fur2: '#ff9ec7', pattern: 'plain', eyes: 'sparkle', u: 1.1, hw: 0.94, hh: 1.1, rx: 58, ry: 34, legH: 54, legW: 17, ax: 0.78, ay: 0.85, ears: 'pony', tail: 'hair', face: 'horse', ey: -12, earTop: 40, nw: 0.92, hoof: true, neck: true, horn: true },
  { id: 'duckling', name: 'Duckling', fur: '#ffe680', fur2: '#ffb347', pattern: 'plain', eyes: 'button', u: 0.98, hw: 1.02, hh: 0.96, rx: 42, ry: 33, legH: 22, legW: 6, ax: 0.42, ay: 0.12, ears: 'tuft', tail: 'duck', face: 'beak', ey: -2, earTop: 14, nw: 0.95, biped: true },
  { id: 'panda', name: 'Panda', fur: '#fbf7f4', fur2: '#3f3a48', pattern: 'plain', eyes: 'round', u: 1.1, hw: 1.08, hh: 0.95, rx: 48, ry: 36, legH: 26, legW: 19, ax: 0.6, ay: 0.22, ears: 'panda', tail: 'stub', face: 'panda', ey: 0, earTop: 8, nw: 1.05, earsFur2: true },
  { id: 'fox', name: 'Fox', fur: '#f58a4a', fur2: '#fff6ee', pattern: 'plain', eyes: 'sparkle', u: 1.0, hw: 1.06, hh: 0.92, rx: 44, ry: 28, legH: 30, legW: 14, ax: 0.66, ay: 0.25, ears: 'fox', tail: 'bushy', face: 'fox', ey: -1, earTop: 30, nw: 0.92 },
  { id: 'piglet', name: 'Piglet', fur: '#ffc4d2', fur2: '#ff9eb5', pattern: 'plain', eyes: 'lashes', u: 1.02, hw: 1.1, hh: 0.95, rx: 46, ry: 34, legH: 22, legW: 15, ax: 0.62, ay: 0.2, ears: 'pig', tail: 'curl', face: 'pig', ey: -2, earTop: 6, nw: 1, hoof: true },
];
const KIND_BY_ID: Record<string, KindArt> = Object.fromEntries(KINDS.map((k) => [k.id, k]));
export const PET_KINDS: PetKind[] = KINDS.map(({ id, name, fur, fur2, pattern, eyes }) => ({ id, name, fur, fur2, pattern, eyes }));
const kindOf = (id: string) => KIND_BY_ID[id] ?? KINDS[0];

/** Fur colors: natural first, then pastel fantasy. */
export const PET_FURS = [
  '#fbf7f4', '#fff1dc', '#f2bf7a', '#e8b47a', '#c9a27e', '#a8714a', '#6e4a36', '#f58a4a',
  '#b9b4c2', '#6f6a7a', '#3f3a48', '#ffe680',
  '#ffc4d2', '#ff9ec7', '#e6ccff', '#c9b6ff', '#bfe3ff', '#9fe8e4', '#bff0dc', '#fff1a8', '#ffd2b8',
];

export const PET_PATTERNS = [
  { id: 'plain', name: 'Plain' },
  { id: 'spots', name: 'Spots' },
  { id: 'patch', name: 'Patch' },
  { id: 'stripes', name: 'Stripes' },
  { id: 'socks', name: 'Socks' },
  { id: 'tummy', name: 'Tummy' },
  { id: 'tips', name: 'Tips' },
  { id: 'hearts', name: 'Hearts' },
];

export const PET_EYES = [
  { id: 'round', name: 'Shiny', color: '#7a4a2c', style: 'round' },
  { id: 'sky', name: 'Sky', color: '#4f9dff', style: 'round' },
  { id: 'mint', name: 'Mint', color: '#3fbf8f', style: 'round' },
  { id: 'sparkle', name: 'Sparkly', color: '#9b6bff', style: 'sparkle' },
  { id: 'lashes', name: 'Lashes', color: '#c4458f', style: 'lashes' },
  { id: 'button', name: 'Button', color: '#2a1626', style: 'button' },
  { id: 'heart', name: 'Hearts', color: '#ff4f8b', style: 'heart' },
  { id: 'happy', name: 'Smiley', color: '#2a1626', style: 'happy' },
];
const EYE_BY_ID: Record<string, (typeof PET_EYES)[number]> = Object.fromEntries(PET_EYES.map((e) => [e.id, e]));

// ---------------- layout ----------------
interface BodyFrame { cx: number; cy: number; rx: number; ry: number; rot: number }
interface Leg { x: number; y: number; len: number; rot: number; far: boolean; swing: number; /** Drawn over the body (paws held up). */ over?: boolean }
interface Layout {
  b: BodyFrame;
  hx: number;
  hy: number;
  tilt: number;
  legs: Leg[];
  haunch?: { x: number; y: number; rx: number; ry: number };
  feet: { x: number; y: number; far: boolean }[];
  tail: { x: number; y: number; rot: number };
  /** Duckling wing, in body-frame coords. */
  wing?: { x: number; y: number; rot: number };
}

const rad = (d: number) => (d * Math.PI) / 180;
function bpt(b: BodyFrame, lx: number, ly: number): [number, number] {
  const c = Math.cos(rad(b.rot));
  const s = Math.sin(rad(b.rot));
  return [b.cx + lx * c - ly * s, b.cy + lx * s + ly * c];
}
const halfH = (rx: number, ry: number, deg: number) => Math.hypot(rx * Math.sin(rad(deg)), ry * Math.cos(rad(deg)));

function layout(k: KindArt, pose: PetPose): Layout {
  const { rx, ry, legH } = k;
  const Hy = 46 * k.hh * k.u;
  const Hx = 46 * k.hw * k.u;
  if (k.biped) {
    if (pose === 'sit' || pose === 'sleep') {
      const sl = pose === 'sleep';
      const b: BodyFrame = { cx: sl ? -6 : 0, cy: -ry * (sl ? 0.82 : 0.96), rx: rx * (sl ? 1.05 : 1), ry: ry * (sl ? 0.84 : 1), rot: sl ? 0 : -8 };
      return {
        b, hx: sl ? rx * 0.6 : rx * 0.5, hy: sl ? -Hy * 0.98 : b.cy - ry * 0.7 - Hy * 0.3, tilt: sl ? 12 : 0, legs: [],
        feet: sl ? [] : [{ x: rx * 0.3, y: -3, far: true }, { x: rx * 0.48, y: -2, far: false }],
        tail: { x: bpt(b, -b.rx * 0.95, -b.ry * 0.05)[0], y: bpt(b, -b.rx * 0.95, -b.ry * 0.05)[1], rot: sl ? 10 : 0 },
        wing: { x: -b.rx * 0.12, y: -b.ry * 0.02, rot: 0 },
      };
    }
    const held = pose === 'held';
    const b: BodyFrame = { cx: 0, cy: -(legH * (held ? 0.85 : 1) + ry * 0.8), rx, ry, rot: held ? -34 : -12 };
    const [tx, ty] = bpt(b, -rx * 0.95, -ry * 0.08);
    const walk = pose === 'walk';
    const top = b.cy + ry * 0.6;
    return {
      b, hx: rx * 0.58 + (held ? 4 : 0), hy: b.cy - ry * 0.72 - Hy * 0.28, tilt: 0,
      legs: [
        { x: -2, y: top, len: -top, rot: walk ? 18 : held ? 10 : 0, far: true, swing: walk ? 1 : held ? 0.4 : 0 },
        { x: 9, y: top, len: -top, rot: walk ? -18 : held ? -8 : 0, far: false, swing: walk ? -1 : held ? -0.4 : 0 },
      ],
      feet: [], tail: { x: tx, y: ty, rot: 0 }, wing: { x: -rx * 0.12, y: -ry * 0.02, rot: held ? 10 : 0 },
    };
  }
  if (pose === 'sit') {
    const th = -56;
    const rxs = rx * 0.8;
    const rys = ry * 1.02;
    const hh = halfH(rxs, rys, th);
    const b: BodyFrame = { cx: -rx * 0.12, cy: -hh - 1, rx: rxs, ry: rys, rot: th };
    const [hxp] = bpt(b, -rxs * 0.4, rys * 0.3);
    const haunch = { x: hxp, y: -ry * 0.7, rx: ry * 0.82, ry: ry * 0.72 };
    const [chx, chy] = bpt(b, rxs * 0.78, -rys * 0.12);
    const legX = b.cx + rxs * 0.34;
    const [tx, ty] = bpt(b, -rxs * 0.9, rys * 0.35);
    const hx = chx + 2 + (k.neck ? 6 : 0);
    return {
      b, hx, hy: chy - Hy * (k.neck ? 0.95 : 0.5), tilt: 0,
      legs: [
        { x: legX + 7, y: b.cy, len: -b.cy, rot: 0, far: true, swing: 0 },
        { x: legX, y: b.cy, len: -b.cy, rot: 0, far: false, swing: 0 },
      ],
      haunch, feet: [{ x: haunch.x + ry * 0.55, y: 0, far: false }], tail: { x: tx, y: ty, rot: -62 },
    };
  }
  if (pose === 'sleep') {
    const b: BodyFrame = { cx: -rx * 0.14, cy: -ry * 0.7, rx: rx * 1.04, ry: ry * 0.72, rot: 0 };
    const [tx, ty] = bpt(b, -b.rx * 0.9, b.ry * 0.25);
    return {
      b, hx: rx * 0.7 + Hx * 0.12, hy: -Hy * 0.94 - (k.neck ? 6 : 0), tilt: 7, legs: [],
      haunch: { x: b.cx - rx * 0.42, y: -ry * 0.55, rx: ry * 0.72, ry: ry * 0.56 },
      feet: [{ x: rx * 0.42, y: 0, far: true }, { x: rx * 0.62, y: 0, far: false }],
      tail: { x: tx, y: ty, rot: -96 },
    };
  }
  if (pose === 'held') {
    const th = -78;
    const rxh = rx * 0.82;
    const b: BodyFrame = { cx: 0, cy: -(legH * 0.72 + rxh * 0.72), rx: rxh, ry, rot: th };
    const [bx, byy] = bpt(b, -rxh * 0.5, 0);
    const [fx, fy] = bpt(b, rxh * 0.42, ry * 0.5);
    const [topx, topy] = bpt(b, rxh * 0.9, 0);
    const [tx, ty] = bpt(b, -rxh * 0.92, -ry * 0.3);
    return {
      b, hx: topx + Hx * 0.12, hy: topy - Hy * (k.neck ? 0.75 : 0.42), tilt: 0,
      legs: [
        { x: bx + 7, y: byy, len: -byy, rot: 5, far: true, swing: 0.5 },
        { x: fx + 6, y: fy, len: legH * 0.62 + 4, rot: -14, far: true, swing: -0.4 },
        { x: bx - 4, y: byy, len: -byy, rot: -4, far: false, swing: -0.5 },
        { x: fx, y: fy, len: legH * 0.62 + 4, rot: -18, far: false, swing: 0.4, over: true },
      ],
      feet: [], tail: { x: tx, y: ty, rot: 150 },
    };
  }
  // stand & walk
  const by = -(legH + ry * 0.7);
  const b: BodyFrame = { cx: 0, cy: by, rx, ry, rot: 0 };
  const w = pose === 'walk' ? 1 : 0;
  const A = 17;
  const [tx, ty] = bpt(b, -rx * 0.9, -ry * 0.3);
  return {
    b, hx: rx * k.ax, hy: by - ry * 0.9 - Hy * k.ay, tilt: 0,
    legs: [
      { x: -rx * 0.55 + 7, y: by, len: -by, rot: A * w, far: true, swing: w },
      { x: rx * 0.5 + 7, y: by, len: -by, rot: -A * w, far: true, swing: -w },
      { x: -rx * 0.55, y: by, len: -by, rot: -A * w, far: false, swing: -w },
      { x: rx * 0.5, y: by, len: -by, rot: A * w, far: false, swing: w },
    ],
    feet: [], tail: { x: tx, y: ty, rot: 0 },
  };
}

// ---------------- parts ----------------
interface Ctx {
  k: KindArt;
  look: PetLook;
  fur: string;
  fur2: string;
  pat: string;
  pose: PetPose;
  expr: PetExpr;
  id: string;
}

/** A leg from its top (0, 0) down to a rounded paw at len, with the paw pointing forward. */
function legD(w: number, len: number, from = 0): string {
  const h = w / 2;
  const toe = w * 0.32;
  return `M${f(-h)} ${f(from)} V${f(len - h * 0.9)} Q${f(-h)} ${f(len)} ${f(-h + w * 0.45)} ${f(len)} H${f(h + toe * 0.5)} Q${f(h + toe * 1.6)} ${f(len)} ${f(h + toe)} ${f(len - w * 0.42)} Q${f(h + toe * 0.4)} ${f(len - w * 0.6)} ${f(h)} ${f(len - w * 0.7)} V${f(from)}Z`;
}
function hoofD(w: number, len: number, from: number): string {
  const h = w / 2;
  return `M${f(-h)} ${f(from)} V${f(len - 2)} Q${f(-h)} ${f(len)} ${f(-h + 3)} ${f(len)} H${f(h + 1)} Q${f(h + 3)} ${f(len)} ${f(h + 2)} ${f(len - 3)} L${f(h)} ${f(from)}Z`;
}

function legArt(x: Ctx, L: Leg): string {
  const { k, fur, fur2, pat } = x;
  const w = k.legW;
  const base = L.far ? dark(fur, 0.12) : fur;
  let g = '';
  if (k.biped) {
    const c = L.far ? dark(fur2, 0.1) : fur2;
    g += S(`M0 0 V${f(L.len - 3)}`, c, 4.5);
    g += P(`M-3 ${f(L.len - 2)} Q4 ${f(L.len - 7)} 15 ${f(L.len - 3)} Q17 ${f(L.len)} 13 ${f(L.len)} L-4 ${f(L.len)} Q-6 ${f(L.len - 1)} -3 ${f(L.len - 2)}Z`, c, edge(c, 1.4));
  } else {
    const legC = k.id === 'panda' ? (L.far ? dark(fur2, 0.1) : fur2) : base;
    g += P(k.hoof ? hoofD(w, L.len, 0) : legD(w, L.len), legC, edge(legC));
    const sock = pat === 'socks' || k.id === 'fox';
    if (sock && k.id !== 'panda') {
      const sc = k.id === 'fox' && pat !== 'socks' ? dark(fur, 0.5) : L.far ? dark(fur2, 0.1) : fur2;
      g += P(k.hoof ? hoofD(w, L.len, L.len * 0.6) : legD(w, L.len, L.len * 0.62), sc, edge(sc, 1.4));
    }
    if (k.hoof) {
      const hc = k.horn ? GOLD : dark(k.id === 'piglet' ? fur : fur2, k.id === 'piglet' ? 0.25 : 0.2);
      g += P(hoofD(w, L.len, L.len - 8), hc, edge(k.horn ? '#d99a1e' : dark(fur2), 1.2));
    } else {
      const tc = dark(legC, 0.3);
      g += S(`M${f(w * 0.25)} ${f(L.len - 1)} v-4 M${f(w * 0.62)} ${f(L.len - 1.5)} v-3.5`, tc, 1.4, 'opacity="0.7"');
    }
    g += P(`M${f(-w / 2 + 2)} 0 V${f(L.len - 6)}`, 'none', `stroke="#fff" stroke-opacity="0.25" stroke-width="2.5" stroke-linecap="round"`);
  }
  let inner = g;
  if (L.swing && !STILL) {
    const a = L.swing * (x.pose === 'walk' ? 17 : 6);
    const dur = x.pose === 'walk' ? 0.62 : 2.2;
    inner = `<g>${anim(`<animateTransform attributeName="transform" type="rotate" values="0;${-2 * a};0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1" keyTimes="0;0.5;1"/>`)}${g}</g>`;
  }
  return G(`translate(${f(L.x)} ${f(L.y)}) rotate(${f(L.rot)})`, inner);
}

function footArt(x: Ctx, ft: { x: number; y: number; far: boolean }): string {
  const { k, fur, fur2 } = x;
  if (k.biped) {
    const c = ft.far ? dark(fur2, 0.1) : fur2;
    return G(`translate(${f(ft.x)} ${f(ft.y)})`, P(`M-6 0 Q2 -8 14 -2 Q16 1 12 1 L-6 1Z`, c, edge(c, 1.4)));
  }
  const w = k.legW;
  const c0 = k.id === 'panda' ? fur2 : ft.far ? dark(fur, 0.1) : fur;
  const c = x.pat === 'socks' && k.id !== 'panda' ? fur2 : c0;
  const hoof = k.hoof ? E(ft.x + w * 0.62, -w * 0.38, w * 0.3, w * 0.38, k.horn ? GOLD : dark(fur2, 0.2)) : '';
  return E(ft.x, -w * 0.4, w * 0.92, w * 0.44, c, edge(c)) + hoof +
    (k.hoof ? '' : S(`M${f(ft.x + w * 0.35)} ${f(-w * 0.15)} v-4 M${f(ft.x + w * 0.62)} ${f(-w * 0.2)} v-3.5`, dark(c, 0.3), 1.3, 'opacity="0.7"'));
}

/** Tails are drawn with their base at (0, 0), reaching up and back (negative x). */
function tailArt(x: Ctx): string {
  const { k, fur, fur2, pat } = x;
  const tip = pat === 'tips' || pat === 'socks';
  switch (k.tail) {
    case 'wag':
      return P('M4 0 C-10 -2 -22 -14 -22 -36 C-22 -42 -15 -42 -14 -36 C-12 -22 -4 -14 6 -10Z', fur, edge(fur)) + (tip ? P('M-22 -36 C-22 -42 -15 -42 -14 -36 C-14 -31 -13 -28 -12 -26 L-21 -27 C-22 -30 -22 -33 -22 -36Z', fur2) : '');
    case 'cat':
      return S('M2 -2 C-18 -4 -30 -20 -24 -42 C-21 -52 -12 -56 -8 -50', dark(fur, 0.24), 13) + S('M2 -2 C-18 -4 -30 -20 -24 -42 C-21 -52 -12 -56 -8 -50', fur, 10) +
        (tip ? S('M-23 -45 C-20 -52 -12 -56 -8 -50', fur2, 10) : '');
    case 'puff': {
      const c = pat === 'tips' || pat === 'tummy' ? fur2 : light(fur, 0.55);
      return C(-6, -4, 12, c, edge(fur, 1.4)) + C(-9, -8, 4, '#fff', 'opacity="0.6"');
    }
    case 'hair': {
      const m = fur2;
      return P('M6 -4 C-12 -6 -26 6 -30 30 C-32 46 -24 62 -18 70 C-20 56 -14 46 -10 40 C-14 56 -6 66 2 70 C-2 54 -2 36 2 22 C4 14 8 6 6 -4Z', m, edge(m)) +
        S('M-4 4 C-16 14 -22 30 -20 48', light(m, 0.35), 2.5, 'opacity="0.8"');
    }
    case 'duck':
      return P('M4 2 L-14 -12 L-8 -2 L-17 -3 L-4 8Z', fur, edge(fur));
    case 'stub':
      return C(-4, -4, 9, fur, edge(fur));
    case 'bushy': {
      const d = 'M6 -4 C-6 10 -42 8 -52 -18 C-58 -34 -50 -50 -40 -46 C-34 -32 -20 -18 6 -14Z';
      return P(d, fur, edge(fur)) + P('M-44 -10 C-52 -18 -56 -34 -50 -44 C-46 -50 -40 -48 -40 -46 C-37 -38 -36 -30 -30 -22 C-34 -18 -38 -14 -44 -10Z', fur2, edge(fur2, 1.2)) +
        S('M-6 -4 C-20 -4 -32 -12 -38 -24', light(fur, 0.3), 2.5, 'opacity="0.7"');
    }
    case 'curl':
      return S('M3 -1 C-8 -2 -14 -10 -9 -16 C-4 -21 2 -14 -3 -11 C-6 -9 -9 -11 -9 -13', dark(fur, 0.12), 4.5);
    default:
      return '';
  }
}

// head-frame parts (standard frame: head centre at 0,0, radius 46)
const FX = 4;
function earsBack(x: Ctx): string {
  const { k, fur, fur2, pat } = x;
  const top = -46 * k.hh;
  const ec = k.earsFur2 ? fur2 : fur;
  const tip = pat === 'tips';
  let s = '';
  for (const sd of [-1, 1]) {
    let e = '';
    let px = 0;
    let py = 0;
    switch (k.ears) {
      case 'cat':
        px = sd * 26; py = top + 12;
        e = P(`M${sd * 10} ${f(top + 14)} L${sd * 34} ${f(top - 22)} L${sd * 44} ${f(top + 24)}Z`, ec, `${edge(ec)} stroke-linejoin="round"`) +
          P(`M${sd * 18} ${f(top + 14)} L${sd * 33} ${f(top - 12)} L${sd * 38} ${f(top + 18)}Z`, tip ? fur2 : INNER, 'opacity="0.9"');
        break;
      case 'fox':
        px = sd * 26; py = top + 12;
        e = P(`M${sd * 6} ${f(top + 16)} L${sd * 34} ${f(top - 30)} L${sd * 48} ${f(top + 26)}Z`, ec, `${edge(ec)} stroke-linejoin="round"`) +
          P(`M${sd * 16} ${f(top + 14)} L${sd * 33} ${f(top - 18)} L${sd * 40} ${f(top + 20)}Z`, fur2, 'opacity="0.95"') +
          P(`M${sd * 26.5} ${f(top - 14)} L${sd * 34} ${f(top - 30)} L${sd * 39.5} ${f(top - 10)}Z`, tip ? fur2 : dark(fur, 0.55));
        break;
      case 'bunny': {
        px = sd * 16; py = top + 6;
        const lean = sd * 9;
        e = G(`rotate(${lean} ${sd * 16} ${f(top + 6)})`, E(sd * 16, top - 30, 12, 38, ec, edge(ec)) + E(sd * 16, top - 27, 6.5, 30, tip ? fur2 : INNER, 'opacity="0.9"'));
        break;
      }
      case 'round':
        px = sd * 32; py = top + 12;
        e = C(sd * 32, top + 10, 14, ec, edge(ec)) + C(sd * 32, top + 11, 8, tip ? fur2 : INNER, 'opacity="0.85"');
        break;
      case 'panda':
        px = sd * 32; py = top + 12;
        e = C(sd * 33, top + 10, 15, ec, edge(ec));
        break;
      case 'pony':
        px = sd * 20; py = top + 8;
        e = P(`M${sd * 10} ${f(top + 10)} Q${sd * 14} ${f(top - 26)} ${sd * 26} ${f(top - 22)} Q${sd * 32} ${f(top - 4)} ${sd * 30} ${f(top + 12)}Z`, ec, edge(ec)) +
          P(`M${sd * 15} ${f(top + 6)} Q${sd * 18} ${f(top - 16)} ${sd * 25} ${f(top - 14)} Q${sd * 28} ${f(top - 2)} ${sd * 26} ${f(top + 8)}Z`, tip ? fur2 : INNER, 'opacity="0.85"');
        break;
      default:
        continue;
    }
    // ear twitch: the right ear flicks now and then
    const tw = sd === 1 ? rot([0, 0, -9, 3, 0, 0], px, py, 5.2, 'keyTimes="0;0.7;0.75;0.8;0.85;1"') : rot([0, 0, 6, 0, 0], px, py, 7, 'keyTimes="0;0.4;0.45;0.5;1"');
    s += tw ? `<g>${tw}${e}</g>` : e;
  }
  return s;
}

function earsFront(x: Ctx): string {
  const { k, fur, fur2 } = x;
  const top = -46 * k.hh;
  const ec = k.earsFur2 ? fur2 : fur;
  let s = '';
  if (k.ears === 'flop') {
    for (const sd of [-1, 1]) {
      const e = P(`M${sd * 22} ${f(top + 6)} C${sd * 46} ${f(top)} ${sd * 60} ${f(top + 26)} ${sd * 56} ${f(top + 56)} C${sd * 54} ${f(top + 66)} ${sd * 42} ${f(top + 66)} ${sd * 40} ${f(top + 54)} C${sd * 38} ${f(top + 36)} ${sd * 34} ${f(top + 22)} ${sd * 20} ${f(top + 18)}Z`, ec, edge(ec)) +
        S(`M${sd * 30} ${f(top + 12)} C${sd * 44} ${f(top + 18)} ${sd * 50} ${f(top + 34)} ${sd * 49} ${f(top + 52)}`, light(ec, 0.25), 2.5, 'opacity="0.6"');
      const tw = rot([0, 0, sd * 7, 0, 0], sd * 26, top + 10, sd === 1 ? 4.6 : 6.3, 'keyTimes="0;0.6;0.66;0.72;1"');
      s += tw ? `<g>${tw}${e}</g>` : e;
    }
  }
  if (k.ears === 'pig') {
    for (const sd of [-1, 1]) {
      const e = P(`M${sd * 14} ${f(top + 10)} L${sd * 40} ${f(top - 6)} Q${sd * 48} ${f(top + 4)} ${sd * 42} ${f(top + 24)} Q${sd * 30} ${f(top + 22)} ${sd * 14} ${f(top + 10)}Z`, ec, edge(ec)) +
        P(`M${sd * 22} ${f(top + 10)} L${sd * 38} ${f(top + 1)} Q${sd * 42} ${f(top + 8)} ${sd * 39} ${f(top + 18)}Z`, dark(fur, 0.12), 'opacity="0.6"');
      const tw = rot([0, 0, sd * -8, 0, 0], sd * 18, top + 10, sd === 1 ? 4.8 : 6.1, 'keyTimes="0;0.6;0.66;0.72;1"');
      s += tw ? `<g>${tw}${e}</g>` : e;
    }
  }
  if (k.ears === 'tuft') {
    const c = dark(fur, 0.08);
    s += P(`M-4 ${f(top + 4)} C-8 ${f(top - 10)} 0 ${f(top - 16)} 2 ${f(top - 8)} C6 ${f(top - 18)} 16 ${f(top - 14)} 10 ${f(top - 4)} C16 ${f(top - 8)} 20 ${f(top - 2)} 12 ${f(top + 6)}Z`, c, edge(fur, 1.2));
  }
  return s;
}

function headMarks(x: Ctx): string {
  const { k, fur2, pat } = x;
  const top = -46 * k.hh;
  let s = '';
  if (pat === 'spots') s += C(-26, top + 20, 9, fur2) + C(30, top + 14, 6, fur2);
  if (pat === 'patch') s += E(FX - 19, k.ey - 1, 15, 16, fur2);
  if (pat === 'stripes') s += [-12, 0, 12].map((dx) => P(`M${FX + dx - 4} ${f(top - 2)} Q${FX + dx} ${f(top + 16)} ${FX + dx + 4} ${f(top - 2)}Z`, dark(x.fur, 0.3), 'opacity="0.55"')).join('') +
    P(`M-46 ${f(k.ey + 6)} q12 -2 16 4 M-46 ${f(k.ey + 14)} q12 0 14 6`, 'none', `stroke="${dark(x.fur, 0.3)}" stroke-width="4" stroke-linecap="round" opacity="0.5"`);
  if (pat === 'hearts') s += `<path d="${heartD(-28, top + 14, 8)}" fill="${fur2}"/>`;
  return s;
}

function eyesArt(x: Ctx): string {
  const { k, look, expr } = x;
  const ed = EYE_BY_ID[look.eyes] ?? PET_EYES[0];
  const ey = k.ey;
  let s = '';
  const arcs = (up: boolean) => {
    let a = '';
    for (const sd of [-1, 1]) {
      const cx = FX + sd * 17.5;
      a += up
        ? S(`M${f(cx - 7)} ${f(ey + 2)} Q${f(cx)} ${f(ey - 7)} ${f(cx + 7)} ${f(ey + 2)}`, INK, 3.2)
        : S(`M${f(cx - 7)} ${f(ey)} Q${f(cx)} ${f(ey + 6)} ${f(cx + 7)} ${f(ey)}`, INK, 2.8) + S(`M${f(cx + sd * 6)} ${f(ey + 1)} l${f(sd * 3)} 2.5`, INK, 2);
    }
    return a;
  };
  if (expr === 'sleep') return arcs(false);
  if (expr === 'happy' || expr === 'eat' || ed.style === 'happy') return arcs(true);
  let open = '';
  for (const sd of [-1, 1]) {
    const cx = FX + sd * 17.5;
    if (ed.style === 'button') {
      open += E(cx, ey, 6.5, 7.2, INK) + C(cx - 2, ey - 2.6, 2.4, '#fff') + C(cx + 2.2, ey + 2.6, 1, '#fff');
      continue;
    }
    open += E(cx, ey, 8.4, 10.2, INK);
    if (ed.style === 'heart') open += `<path d="${heartD(cx, ey - 4.6, 6.4)}" fill="${ed.color}"/>`;
    else open += E(cx, ey + 2.6, 6.4, 6.6, ed.color, 'opacity="0.95"') + E(cx, ey + 0.6, 4.2, 5.4, '#120810');
    open += E(cx, ey + 5.6, 4, 1.8, light(ed.color, 0.55), 'opacity="0.7"');
    open += C(cx - 3, ey - 4, 3.4, '#fff') + C(cx + 2.8, ey + 3.4, 1.5, '#fff');
    if (ed.style === 'sparkle') open += `<path d="${sparkleD(cx + 3, ey - 3.5, 3.2)}" fill="#fff"/>`;
    if (ed.style === 'lashes') open += S(`M${f(cx + sd * 6.5)} ${f(ey - 7)} l${f(sd * 4)} -3.5 M${f(cx + sd * 8)} ${f(ey - 3)} l${f(sd * 4.5)} -1.5`, INK, 2);
    if (expr === 'sad') open += S(`M${f(cx - sd * 7)} ${f(ey - 16)} L${f(cx + sd * 5)} ${f(ey - 13)}`, dark(x.fur, 0.45), 2.6);
  }
  if (expr === 'sad') open += P(`M${f(FX - 23)} ${f(ey + 10)} q-3 6 0 8 q3 -2 0 -8Z`, '#7cc8ff', 'opacity="0.9"');
  // blink now and then
  s += STILL || expr === 'sad'
    ? open
    : `<g transform="translate(0 ${f(ey)})"><g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.08;1 1" keyTimes="0;0.92;0.96;1" dur="${f(3.4 + PH * 2)}s" repeatCount="indefinite"/><g transform="translate(0 ${f(-ey)})">${open}</g></g></g>`;
  return s;
}

function mouthArt(x: Ctx): string {
  const { k, fur, fur2, pat, expr } = x;
  const tum = pat === 'tummy';
  const open = expr === 'happy';
  const eat = expr === 'eat';
  const sad = expr === 'sad';
  let s = '';
  const mouthLine = (y: number, w = 7) => {
    if (sad) return S(`M${FX - w * 0.8} ${f(y + 4)} Q${FX} ${f(y - 1)} ${FX + w * 0.8} ${f(y + 4)}`, INK, 2.2);
    if (eat) {
      const m = E(FX, y + 3, 6, 4.5, '#a8324f') + E(FX, y + 5, 3.5, 2, NOSE);
      return STILL ? m : `<g transform="translate(${FX} ${f(y + 1)})"><g><animateTransform attributeName="transform" type="scale" values="1 0.35;1 1.1;1 0.35" dur="0.38s" repeatCount="indefinite"/><g transform="translate(${-FX} ${f(-y - 1)})">${m}</g></g></g>`;
    }
    if (open) return P(`M${FX - w} ${f(y)} Q${FX} ${f(y + 2)} ${FX + w} ${f(y)} Q${FX + w * 0.8} ${f(y + 11)} ${FX} ${f(y + 11)} Q${FX - w * 0.8} ${f(y + 11)} ${FX - w} ${f(y)}Z`, '#a8324f') +
      E(FX, y + 8, w * 0.5, 2.6, NOSE);
    return S(`M${FX - w} ${f(y)} Q${FX - w / 2} ${f(y + 5)} ${FX} ${f(y)} Q${FX + w / 2} ${f(y + 5)} ${FX + w} ${f(y)}`, INK, 2.2);
  };
  const whiskers = (y: number, c = dark(fur, 0.35)) =>
    [-1, 1].map((sd) => S(`M${f(FX + sd * 22)} ${f(y)} l${sd * 16} -4 M${f(FX + sd * 22)} ${f(y + 5)} l${sd * 17} 1`, c, 1.4, 'opacity="0.65"')).join('');
  const dogNose = (y: number) => P(`M${FX - 7} ${f(y - 3)} Q${FX} ${f(y - 6)} ${FX + 7} ${f(y - 3)} Q${FX + 6} ${f(y + 3)} ${FX} ${f(y + 4)} Q${FX - 6} ${f(y + 3)} ${FX - 7} ${f(y - 3)}Z`, '#3a2430') +
    E(FX - 2, y - 2.6, 2.2, 1.2, '#fff', 'opacity="0.6"');
  switch (k.face) {
    case 'dog': {
      const mc = tum ? fur2 : light(fur, 0.4);
      s += E(FX, 20, 18, 13, mc) + dogNose(14) + S(`M${FX} 18 v3`, INK, 2) + mouthLine(21, 7);
      break;
    }
    case 'fox':
      s += P(`M${FX - 44} 2 Q${FX - 22} 8 ${FX} 4 Q${FX + 22} 8 ${FX + 44} 2 Q${FX + 34} 38 ${FX} 40 Q${FX - 34} 38 ${FX - 44} 2Z`, fur2) + dogNose(15) + S(`M${FX} 19 v2`, INK, 2) + mouthLine(21, 6);
      break;
    case 'panda':
      s += E(FX, 20, 16, 11.5, light(fur, 0.6)) + dogNose(15) + S(`M${FX} 19 v2`, INK, 2) + mouthLine(21, 6);
      break;
    case 'cat':
      s += (tum ? E(FX, 19, 16, 11, fur2) : '') + P(`M${FX - 5} 12 L${FX + 5} 12 L${FX} 17Z`, NOSE, 'stroke-linejoin="round" stroke="#e86a8a" stroke-width="1.5"') + mouthLine(17, 6) + whiskers(15);
      break;
    case 'bunny':
      s += (tum ? E(FX, 19, 15, 10, fur2) : '') + E(FX, 13, 4.5, 3.4, NOSE) + S(`M${FX} 16 v3`, INK, 2) +
        (open || eat ? '' : R(FX - 3.6, 21, 3.4, 5, 1.2, '#fff', `stroke="${dark(fur, 0.3)}" stroke-width="0.8"`) + R(FX + 0.2, 21, 3.4, 5, 1.2, '#fff', `stroke="${dark(fur, 0.3)}" stroke-width="0.8"`)) +
        mouthLine(19, 6) + whiskers(15);
      break;
    case 'hamster': {
      const cc = tum ? fur2 : light(fur, 0.5);
      s += E(FX - 25, 16, 13, 11, cc) + E(FX + 25, 16, 13, 11, cc) + E(FX, 18, 11, 8, cc) + E(FX, 12, 3.6, 2.6, NOSE) + mouthLine(16, 5) + whiskers(13);
      break;
    }
    case 'horse': {
      const mc = tum ? fur2 : light(fur, 0.35);
      s += E(FX, 24, 27, 18, mc, edge(mc, 1.2)) + E(FX - 9, 21, 3, 4, dark(mc, 0.35)) + E(FX + 9, 21, 3, 4, dark(mc, 0.35)) + mouthLine(31, 9);
      break;
    }
    case 'pig': {
      const sc = dark(fur, 0.06);
      s += E(FX, 16, 14, 10, sc, edge(fur, 1.4)) + E(FX - 4.5, 16, 2.4, 3.6, dark(fur, 0.4)) + E(FX + 4.5, 16, 2.4, 3.6, dark(fur, 0.4)) + E(FX - 4, 11, 6, 2, '#fff', 'opacity="0.35"') + mouthLine(28, 6);
      break;
    }
    case 'beak': {
      const bc = fur2;
      const gape = open || eat;
      const lower = E(FX, gape ? 22 : 18, 11, gape ? 6 : 4.5, dark(bc, 0.15), edge(bc, 1.2));
      const lowerA = eat && !STILL ? `<g>${anim('<animateTransform attributeName="transform" type="translate" values="0 -3;0 1;0 -3" dur="0.38s" repeatCount="indefinite"/>')}${lower}</g>` : lower;
      s += (gape ? E(FX, 19, 9, 5, '#a8324f') : '') + lowerA + E(FX, 13, 15, 6.5, bc, edge(bc, 1.2)) + E(FX - 4, 11, 5, 1.8, '#fff', 'opacity="0.45"') + C(FX - 4, 12, 1, dark(bc, 0.4)) + C(FX + 4, 12, 1, dark(bc, 0.4));
      if (sad) s += S(`M${FX - 6} 24 Q${FX} 21 ${FX + 6} 24`, INK, 1.6);
      break;
    }
  }
  return s;
}

function headArt(x: Ctx): string {
  const { k, fur, fur2, id } = x;
  const hx = 46 * k.hw;
  const hy = 46 * k.hh;
  let s = earsBack(x);
  // cheek fluff for kittens and foxes
  let fluff = '';
  if (k.face === 'cat' || k.face === 'fox') {
    const big = k.face === 'fox' ? 1 : 0.55;
    for (const sd of [-1, 1]) fluff += P(`M${f(sd * hx * 0.8)} ${f(hy * 0.12)} Q${f(sd * (hx + 4))} ${f(hy * 0.22)} ${f(sd * (hx + 10 * big))} ${f(hy * 0.42)} Q${f(sd * (hx - 2))} ${f(hy * 0.44)} ${f(sd * (hx + 2 * big))} ${f(hy * 0.6)} Q${f(sd * hx * 0.8)} ${f(hy * 0.66)} ${f(sd * hx * 0.6)} ${f(hy * 0.72)}Z`, k.face === 'fox' ? fur2 : fur, edge(fur, 1.4));
  }
  s += fluff;
  s += `<clipPath id="${id}h"><ellipse cx="0" cy="0" rx="${f(hx)}" ry="${f(hy)}"/></clipPath>`;
  s += E(0, 0, hx, hy, fur, edge(fur, 2));
  let marks = headMarks(x);
  if (k.face === 'panda') marks += [-1, 1].map((sd) => G(`rotate(${sd * -24} ${f(FX + sd * 18)} ${f(k.ey + 2)})`, E(FX + sd * 18, k.ey + 2, 12.5, 15.5, fur2))).join('');
  s += `<g clip-path="url(#${id}h)">${marks}</g>`;
  s += E(0, 0, hx, hy, 'url(#g-face)');
  // blush
  for (const sd of [-1, 1]) s += E(FX + sd * 28, k.ey + 15, 7.5, 4.6, '#ff8fb0', 'opacity="0.5"');
  s += `<g clip-path="url(#${id}h)">${k.face === 'fox' ? mouthArt(x) : ''}</g>`;
  if (k.face !== 'fox') s += mouthArt(x);
  s += eyesArt(x);
  s += earsFront(x);
  if (k.neck) {
    // forelock
    const top = -hy;
    s += P(`M-18 ${f(top + 6)} C-14 ${f(top - 12)} 6 ${f(top - 14)} 14 ${f(top + 2)} C20 ${f(top + 14)} 14 ${f(top + 24)} 6 ${f(top + 26)} C8 ${f(top + 16)} 2 ${f(top + 8)} -6 ${f(top + 14)} C-4 ${f(top + 8)} -10 ${f(top + 4)} -18 ${f(top + 6)}Z`, fur2, edge(fur2, 1.4)) +
      S(`M-8 ${f(top - 2)} C0 ${f(top - 6)} 8 ${f(top)} 10 ${f(top + 8)}`, light(fur2, 0.4), 2, 'opacity="0.8"');
  }
  if (k.horn) {
    const top = -hy;
    s += P(`M-7 ${f(top + 6)} L1 ${f(top - 38)} L9 ${f(top + 6)}Z`, GOLD, 'stroke="#d99a1e" stroke-width="1.4" stroke-linejoin="round"') +
      S(`M-5 ${f(top - 2)} L7 ${f(top - 6)} M-3 ${f(top - 12)} L5 ${f(top - 16)} M-1 ${f(top - 22)} L4 ${f(top - 25)}`, '#fff3b0', 2) +
      anim(`<path d="${sparkleD(12, top - 34, 5)}" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="${f(-PH * 2)}s" repeatCount="indefinite"/></path>`);
  }
  return s;
}

function bodyMarks(x: Ctx, b: BodyFrame): string {
  const { fur, fur2, pat, k } = x;
  const { rx, ry } = b;
  let s = '';
  if (pat === 'tummy' || k.id === 'fox') s += E(rx * 0.12, ry * 0.75, rx * 0.8, ry * 0.5, fur2);
  if (pat === 'spots') s += [[-0.5, -0.4, 0.3], [0.05, -0.62, 0.22], [0.3, 0.1, 0.18], [-0.2, 0.25, 0.2], [-0.78, 0.1, 0.16]].map(([u, v, r]) => C(rx * u, ry * v, ry * r, fur2)).join('');
  if (pat === 'patch') s += E(-rx * 0.25, -ry * 0.7, rx * 0.48, ry * 0.6, fur2);
  if (pat === 'stripes') s += [-0.62, -0.3, 0.02].map((u) => P(`M${f(rx * u - 6)} ${f(-ry - 2)} Q${f(rx * u + 2)} ${f(-ry * 0.2)} ${f(rx * u - 2)} ${f(ry * 0.1)} Q${f(rx * u + 8)} ${f(-ry * 0.3)} ${f(rx * u + 6)} ${f(-ry - 2)}Z`, dark(fur, 0.3), 'opacity="0.5"')).join('');
  if (pat === 'hearts') s += [[-0.5, -0.45, 9], [0.05, -0.1, 7], [-0.15, 0.35, 6]].map(([u, v, r]) => `<path d="${heartD(rx * u, ry * v - r * 0.5, r)}" fill="${fur2}"/>`).join('');
  if (k.id === 'panda') s += E(rx * 0.38, -ry * 0.1, rx * 0.3, ry * 1.2, fur2);
  return s;
}

function bodyArt(x: Ctx, b: BodyFrame): string {
  const { fur, id } = x;
  const { rx, ry } = b;
  let s = `<clipPath id="${id}b"><ellipse cx="0" cy="0" rx="${f(rx)}" ry="${f(ry)}"/></clipPath>`;
  s += `<clipPath id="${id}c"><ellipse cx="0" cy="0" rx="${f(rx + 2.6)}" ry="${f(ry + 2.6)}"/></clipPath>`;
  s += E(0, 0, rx, ry, fur, edge(fur, 2));
  s += `<g clip-path="url(#${id}b)">${bodyMarks(x, b)}</g>`;
  s += E(0, 0, rx, ry, 'url(#g-shadeY)');
  s += E(-rx * 0.15, -ry * 0.55, rx * 0.45, ry * 0.18, '#fff', 'opacity="0.22"');
  return s;
}

function duckWing(x: Ctx, w: { x: number; y: number; rot: number }): string {
  const c = dark(x.fur, 0.07);
  const g = P('M14 -12 C-4 -16 -22 -8 -24 6 C-18 4 -16 10 -10 8 C-8 14 0 12 4 8 C12 4 18 -4 14 -12Z', c, edge(x.fur, 1.4)) + S('M8 -8 C-4 -8 -12 -4 -16 2', light(c, 0.4), 2, 'opacity="0.7"');
  const flap = rot([0, 0, -16, 0, 0], 12, -10, 4.5, 'keyTimes="0;0.6;0.66;0.72;1"');
  return G(`translate(${f(w.x)} ${f(w.y)}) rotate(${w.rot})`, flap ? `<g>${flap}${g}</g>` : g);
}

function neckArt(x: Ctx, L: Layout): string {
  const { k, fur, fur2 } = x;
  if (!k.neck) return '';
  const { b } = L;
  const Hx = 46 * k.hw * k.u;
  const Hy = 46 * k.hh * k.u;
  const [ax, ay] = bpt(b, b.rx * 0.3, -b.ry * 0.86);
  const [bx, by] = bpt(b, b.rx * 0.9, -b.ry * 0.15);
  const hbx = L.hx - Hx * 0.42;
  const hby = L.hy - Hy * 0.05;
  const hcx = L.hx + Hx * 0.3;
  const hcy = L.hy + Hy * 0.55;
  const d = `M${f(ax)} ${f(ay)} Q${f((ax + hbx) / 2 - 4)} ${f((ay + hby) / 2)} ${f(hbx)} ${f(hby)} L${f(hcx)} ${f(hcy)} Q${f((bx + hcx) / 2 + 6)} ${f((by + hcy) / 2)} ${f(bx)} ${f(by)}Z`;
  let s = P(d, fur, edge(fur, 2)) + P(d, 'url(#g-shadeX)');
  // mane along the back of the neck
  const mx = (ax + hbx) / 2 - 4;
  const my = (ay + hby) / 2;
  const m = `M${f(hbx + 10)} ${f(hby - Hy * 0.6)} Q${f(mx - 14)} ${f(my - 12)} ${f(ax - 12)} ${f(ay + 4)} Q${f(ax - 4)} ${f(ay - 2)} ${f(ax + 2)} ${f(ay + 6)} Q${f(mx - 2)} ${f(my + 6)} ${f(mx + 2)} ${f(my + 10)} Q${f(mx + 4)} ${f(my - 2)} ${f(hbx + 6)} ${f(hby + 8)} Q${f(hbx + 14)} ${f(hby - 10)} ${f(hbx + 10)} ${f(hby - Hy * 0.6)}Z`;
  s += P(m, fur2, edge(fur2, 1.6)) + S(`M${f(hbx + 6)} ${f(hby - Hy * 0.4)} Q${f(mx - 6)} ${f(my - 6)} ${f(ax - 4)} ${f(ay + 2)}`, light(fur2, 0.35), 2.2, 'opacity="0.8"');
  return s;
}

// ---------------- accessories ----------------
export interface AccCtx {
  /** Accessory color. */
  c: string;
  /** Body size (body slot only, body frame: centre 0,0, front is +x). */
  rx: number;
  ry: number;
  /** Clip id for the body (body slot). */
  clip: string;
  /** Collar width scale (neck slot). */
  nw: number;
  kind: string;
}
export interface PetAcc {
  id: string;
  name: string;
  slot: PetSlot;
  price: number;
  color: string;
  /** Colors are part of the design: no recoloring. */
  fixed?: boolean;
  /** Head & face: standard head frame (head top / eye line at 0). Neck: under the chin. Body: body frame. */
  draw: (x: AccCtx) => string;
  /** Drawn behind the body (wings). */
  back?: (x: AccCtx) => string;
}

// head-top helpers: standard head of radius 46 whose top is at (0, 0) and centre at (0, 46)
const arcPts = (n: number, a0: number, a1: number, r = 47) =>
  Array.from({ length: n }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / (n - 1));
    return [Math.cos(a) * r, 46 + Math.sin(a) * r] as [number, number];
  });
const band = (c: string, w = 6, a0 = -158, a1 = -22) => {
  const p = arcPts(2, a0, a1);
  return S(`M${f(p[0][0])} ${f(p[0][1])} A47 47 0 0 1 ${f(p[1][0])} ${f(p[1][1])}`, dark(c, 0.2), w + 2) + S(`M${f(p[0][0])} ${f(p[0][1])} A47 47 0 0 1 ${f(p[1][0])} ${f(p[1][1])}`, c, w);
};
const dots = (pts: [number, number][], r: number, c: string) => pts.map(([x, y]) => C(x, y, r, c)).join('');

const HEAD: Omit<PetAcc, 'slot'>[] = [
  { id: 'bow', name: 'Sweet Bow', price: 0, color: '#ff7eb6', draw: (x) => G('rotate(22 26 10)', bowG(26, 10, 0.72, x.c)) },
  { id: 'polkabow', name: 'Polka Bow', price: 15, color: '#9b6bff', draw: (x) => G('rotate(22 26 10)', bowG(26, 10, 0.72, x.c) + dots([[14, 6], [18, 13], [36, 6], [33, 13]], 1.8, '#fff')) },
  { id: 'bigbow', name: 'Big Bow', price: 25, color: '#ff4f8b', draw: (x) => bowG(0, -4, 1.12, x.c) },
  { id: 'twinbows', name: 'Twin Bows', price: 20, color: '#7cc8ff', draw: (x) => G('rotate(-24 -30 16)', bowG(-30, 16, 0.5, x.c)) + G('rotate(24 30 16)', bowG(30, 16, 0.5, x.c)) },
  {
    id: 'crown', name: 'Royal Crown', price: 60, color: '#ff4f8b', draw: (x) =>
      P('M-21 8 L-23 -18 L-11 -6 L0 -24 L11 -6 L23 -18 L21 8 Q0 12 -21 8Z', GOLD, 'stroke="#d99a1e" stroke-width="1.6" stroke-linejoin="round"') +
      C(-23, -19, 3.2, x.c) + C(0, -25, 3.6, x.c) + C(23, -19, 3.2, x.c) + E(0, 1, 4.5, 5, x.c, 'stroke="#fff" stroke-width="1"') + C(-12, 3, 2.5, '#7cc8ff') + C(12, 3, 2.5, '#5fd3b5') + E(-1.4, -0.8, 1.4, 1.8, '#fff', 'opacity="0.7"'),
  },
  {
    id: 'tiara', name: 'Sparkle Tiara', price: 45, color: '#c99bff', draw: (x) =>
      band('#e6e8f0', 4, -150, -30) + P('M-14 6 L-8 -6 L0 -16 L8 -6 L14 6Z', 'url(#g-silver)', 'stroke="#a7abbd" stroke-width="1.2" stroke-linejoin="round"') +
      `<path d="M0 -12 L3.5 -4 L0 3 L-3.5 -4Z" fill="${x.c}" stroke="#fff" stroke-width="1"/>` + C(-9, 0, 2, x.c) + C(9, 0, 2, x.c) + anim(`<path d="${sparkleD(10, -14, 4.5)}" fill="#fff"><animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite"/></path>`),
  },
  {
    id: 'flowercrown', name: 'Flower Crown', price: 30, color: '#ff9ec7', draw: (x) =>
      band('#7fcf8f', 3.5, -165, -15) + arcPts(7, -160, -20).map(([px, py], i) => (i % 2 ? E(px, py + 1, 5, 3, '#7fcf8f') : '') + flowerG(px, py, i % 2 ? 6.5 : 8, i % 2 ? '#fff' : x.c)).join(''),
  },
  { id: 'daisies', name: 'Daisy Chain', price: 25, color: '#ffffff', draw: (x) => band('#7fcf8f', 3, -165, -15) + arcPts(6, -160, -20).map(([px, py]) => flowerG(px, py, 7.5, x.c, '#ffd36b')).join('') },
  { id: 'rainbowblooms', name: 'Rainbow Blooms', price: 40, color: '#ff7eb6', fixed: true, draw: () => band('#7fcf8f', 3, -165, -15) + arcPts(7, -160, -20).map(([px, py], i) => flowerG(px, py, 7.5, ['#ff7eb6', '#ffab5e', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff', '#ff9ec7'][i])).join('') },
  { id: 'heartband', name: 'Heart Headband', price: 15, color: '#ff4f8b', draw: (x) => band(x.c, 5) + G('rotate(18 22 6)', `<path d="${heartD(22, -6, 11)}" fill="${x.c}" stroke="${dark(x.c, 0.2)}" stroke-width="1.4"/>`) + E(19, -1, 3, 2, '#fff', 'opacity="0.6"') },
  {
    id: 'bunnyband', name: 'Bunny Ears', price: 20, color: '#ffffff', draw: (x) =>
      band('#ffb3d1', 4.5) + [-1, 1].map((sd) => G(`rotate(${sd * 14} ${sd * 14} 4)`, E(sd * 14, -20, 8, 24, x.c, edge(x.c, 1.4)) + E(sd * 14, -18, 4, 17, INNER))).join(''),
  },
  { id: 'catband', name: 'Kitty Ears', price: 20, color: '#2d2a3a', draw: (x) => band(x.c, 4.5) + [-1, 1].map((sd) => P(`M${sd * 8} 6 L${sd * 18} -18 L${sd * 30} 9Z`, x.c, `${edge(x.c, 1.4)} stroke-linejoin="round"`) + P(`M${sd * 13} 4 L${sd * 18} -9 L${sd * 25} 6Z`, INNER)).join('') },
  {
    id: 'partyhat', name: 'Party Hat', price: 15, color: '#7cc8ff', draw: (x) =>
      G('rotate(14 4 6)', P('M-14 6 L4 -40 L20 6 Q4 10 -14 6Z', x.c, edge(x.c, 1.4)) + dots([[-3, -4], [9, -12], [2, -24], [11, 0]], 2.6, '#fff') + S('M-12 4 Q4 8 18 4', '#ffd36b', 3) + C(4, -41, 5.5, '#ffd36b') + C(2.5, -43, 1.8, '#fff', 'opacity="0.7"')),
  },
  {
    id: 'tophat', name: 'Top Hat', price: 35, color: '#ff4f8b', draw: (x) =>
      G('rotate(-6 0 4)', E(0, 5, 27, 6, '#2d2a3a') + R(-16, -32, 32, 37, 4, '#2d2a3a') + R(-16, -6, 32, 8, 0, x.c) + R(-12, -28, 5, 28, 2.5, '#fff', 'opacity="0.18"') + E(0, -32, 16, 3.5, '#4a4a5e')),
  },
  {
    id: 'beanie', name: 'Cozy Beanie', price: 20, color: '#ff9a6b', draw: (x) =>
      P('M-42 22 C-46 -26 46 -26 42 22Z', x.c, edge(x.c, 1.4)) + [-24, -12, 0, 12, 24].map((dx) => S(`M${dx} ${dx === 0 ? -14 : -10 + Math.abs(dx) * 0.2} Q${dx * 1.15} 4 ${dx * 1.2} 14`, dark(x.c, 0.12), 2)).join('') +
      R(-44, 12, 88, 13, 6.5, light(x.c, 0.2), edge(x.c, 1.2)) + [-36, -26, -16, -6, 4, 14, 24, 34].map((dx) => S(`M${dx} 15 v7`, dark(x.c, 0.1), 2)).join('') + C(0, -20, 10, '#fff', edge('#fff', 1.2)) + C(-3, -23, 3.5, '#fff', 'opacity="0.6"'),
  },
  {
    id: 'sunhat', name: 'Sun Hat', price: 30, color: '#ffd36b', draw: (x) =>
      E(0, 8, 56, 11, x.c, edge(x.c, 1.4)) + P('M-26 8 C-26 -24 26 -24 26 8Z', x.c, edge(x.c, 1.4)) + R(-26, -2, 52, 8, 3, '#ff7eb6') + flowerG(22, 0, 8, '#fff') + E(-30, 6, 18, 3, '#fff', 'opacity="0.25"'),
  },
  { id: 'beret', name: 'Artist Beret', price: 20, color: '#e85d5d', draw: (x) => G('rotate(-12 0 4)', E(4, 2, 36, 12, x.c, edge(x.c, 1.4)) + E(0, -2, 26, 6, light(x.c, 0.2), 'opacity="0.5"') + R(1, -14, 5, 6, 2, dark(x.c, 0.2))) },
  {
    id: 'witchhat', name: 'Witch Hat', price: 35, color: '#7a5cff', draw: (x) =>
      E(0, 6, 44, 9, x.c, edge(x.c, 1.4)) + P('M-22 6 L-4 -30 Q4 -44 20 -42 Q8 -36 6 -24 L22 6Z', x.c, edge(x.c, 1.4)) + R(-19, -4, 38, 8, 2, '#ffd36b') + R(-5, -5, 10, 10, 2, 'none', 'stroke="#c98a00" stroke-width="2"') +
      `<path d="${starD(8, -24, 4.5)}" fill="#ffe680"/>`,
  },
  {
    id: 'cowboy', name: 'Cowboy Hat', price: 30, color: '#c98a5a', draw: (x) =>
      P('M-50 2 Q-44 12 0 10 Q44 12 50 2 Q52 -6 44 -4 Q24 4 0 3 Q-24 4 -44 -4 Q-52 -6 -50 2Z', x.c, edge(x.c, 1.4)) + P('M-22 4 C-24 -16 -18 -28 -8 -26 Q0 -20 8 -26 C18 -28 24 -16 22 4Z', x.c, edge(x.c, 1.4)) + R(-22, -4, 44, 7, 2, dark(x.c, 0.35)) + `<path d="${starD(0, -0.5, 3)}" fill="#ffd36b"/>`,
  },
  {
    id: 'chefhat', name: 'Chef Hat', price: 25, color: '#ffffff', draw: (x) =>
      R(-20, -8, 40, 16, 3, x.c, edge('#d8d4e0', 1.4)) + C(-14, -18, 13, x.c, edge('#d8d4e0', 1.4)) + C(14, -18, 13, x.c, edge('#d8d4e0', 1.4)) + C(0, -26, 15, x.c, edge('#d8d4e0', 1.4)) + R(-19, -9, 38, 6, 0, x.c) + S('M-8 -6 v12 M8 -6 v12', '#e6e2ec', 1.6),
  },
  {
    id: 'santahat', name: 'Santa Hat', price: 30, color: '#e8484f', draw: (x) =>
      P('M-34 8 C-30 -26 10 -34 30 -18 C40 -10 46 2 44 12 C36 0 28 -6 26 -4 C30 2 32 6 34 8Z', x.c, edge(x.c, 1.4)) + R(-38, 2, 76, 13, 6.5, '#fff', edge('#fff', 1.2)) + C(44, 14, 8, '#fff', edge('#fff', 1.2)),
  },
  {
    id: 'halo', name: 'Angel Halo', price: 35, color: '#ffd24a', draw: (x) =>
      `<g>${move('0 0;0 -4;0 0', 2.4)}${E(0, -16, 24, 7, 'none', `stroke="${x.c}" stroke-width="5" opacity="0.35"`)}${E(0, -16, 22, 6, 'none', `stroke="${x.c}" stroke-width="3.5"`)}${E(-6, -21, 6, 1.4, '#fff', 'opacity="0.8"')}</g>`,
  },
  { id: 'starclip', name: 'Star Clip', price: 10, color: '#ffd36b', draw: (x) => `<path d="${starD(28, 12, 11)}" fill="${x.c}" stroke="${dark(x.c, 0.25)}" stroke-width="1.5" stroke-linejoin="round"/>` + `<path d="${sparkleD(40, -2, 5)}" fill="#fff"/>` + C(25, 9, 2, '#fff', 'opacity="0.6"') },
  {
    id: 'cap', name: 'Ball Cap', price: 20, color: '#4f9dff', draw: (x) =>
      P('M-38 18 C-40 -18 36 -22 38 14Z', x.c, edge(x.c, 1.4)) + P('M24 10 Q50 4 62 14 Q50 20 30 18Z', dark(x.c, 0.15), edge(x.c, 1.4)) + C(0, -8, 3.5, dark(x.c, 0.2)) + S('M0 -6 Q-2 6 -4 16 M0 -6 Q16 2 22 14', dark(x.c, 0.15), 1.6) + `<path d="${starD(-14, 4, 6)}" fill="#fff"/>`,
  },
  {
    id: 'propeller', name: 'Propeller Cap', price: 30, color: '#ffd36b', draw: (x) =>
      P('M-38 18 C-40 -20 38 -20 38 18Z', '#ff7a6b', edge('#ff7a6b', 1.4)) + P('M-14 -10 C-10 -14 -4 -15 0 -15 L0 18 L-24 18Z', '#7cc8ff') + P('M14 -10 C10 -14 4 -15 0 -15 L0 18 L24 18Z', '#5fd3b5') + R(-1.5, -24, 3, 10, 1.5, '#9aa3b5') +
      `<g transform="translate(0 -24)"><g>${anim('<animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="0.5s" repeatCount="indefinite"/>')}${E(-12, 0, 12, 3.5, x.c, edge(x.c, 1))}${E(12, 0, 12, 3.5, dark(x.c, 0.1), edge(x.c, 1))}</g></g>` + C(0, -24, 3, '#e85d5d'),
  },
  {
    id: 'unihorn', name: 'Unicorn Horn', price: 30, color: '#ff9ec7', draw: (x) =>
      band(x.c, 5) + P('M-7 2 L1 -36 L9 2Z', 'url(#g-rainbow)', 'stroke="#fff" stroke-width="1.6" stroke-linejoin="round"') + S('M-4 -6 L6 -10 M-2 -16 L4 -19 M-0.5 -26 L3 -28', '#fff', 1.8) + flowerG(-16, 4, 6, x.c) + flowerG(17, 4, 6, '#c99bff'),
  },
  { id: 'flowerclip', name: 'Flower Clip', price: 10, color: '#ff7eb6', draw: (x) => E(20, 16, 7, 4, '#7fcf8f', 'transform="rotate(-30 20 16)"') + flowerG(28, 10, 12, x.c) },
  {
    id: 'pirate', name: 'Pirate Hat', price: 30, color: '#2d2a3a', draw: (x) =>
      P('M-46 8 Q-30 -30 0 -26 Q30 -30 46 8 Q24 0 0 2 Q-24 0 -46 8Z', x.c, edge(x.c, 1.4)) + S('M-44 6 Q-24 -2 0 0 Q24 -2 44 6', '#ffd36b', 2.5) + `<path d="${heartD(0, -16, 9)}" fill="#fff"/>` + S('M-6 -2 L6 -12 M6 -2 L-6 -12', '#fff', 2) + `<path d="${heartD(0, -16, 9)}" fill="#ff4f8b" opacity="0.0"/>`,
  },
  {
    id: 'antennae', name: 'Bee Antennae', price: 15, color: '#2d2a3a', draw: (x) =>
      band(x.c, 4.5) + [-1, 1].map((sd) => `<g>${rot([0, sd * 8, 0], sd * 12, 4, 1.4)}${S(`M${sd * 12} 4 Q${sd * 14} -14 ${sd * 22} -24`, x.c, 2.8)}${C(sd * 22, -26, 6, '#ffd36b', edge('#ffd36b', 1.2))}${C(sd * 22 - 2, -28, 2, '#fff', 'opacity="0.7"')}</g>`).join(''),
  },
  {
    id: 'cupcake', name: 'Cupcake Hat', price: 35, color: '#7cc8ff', draw: (x) =>
      P('M-20 10 L-16 -6 L16 -6 L20 10Z', x.c, edge(x.c, 1.4)) + [-10, -3, 4, 11].map((dx) => S(`M${dx} -5 L${dx * 1.2} 9`, dark(x.c, 0.15), 1.6)).join('') +
      P('M-22 -4 C-26 -14 -14 -18 -10 -16 C-8 -26 8 -26 10 -16 C14 -18 26 -14 22 -4Z', '#ffb3d1', edge('#ffb3d1', 1.4)) + dots([[-12, -9], [-2, -14], [8, -10], [14, -6]], 1.6, '#ffd36b') + C(0, -24, 5, '#e8484f') + S('M0 -28 Q3 -34 7 -34', '#3fbf8f', 1.8),
  },
];

// neck: (0, 0) is just under the chin; half width about 24 (scaled by nw)
const collarD = (w: number) => `M${-w} -4 Q0 9 ${w} -4 L${w} 3 Q0 16 ${-w} 3Z`;
const collar = (x: AccCtx, studs = '') => {
  const w = 24;
  return P(collarD(w), x.c, edge(x.c, 1.4)) + P(collarD(w), 'url(#g-shadeY)') + studs;
};
const swing = (inner: string, dur = 1.6) => {
  const r = rot([-8, 8, -8], 0, 9, dur);
  return r ? `<g>${r}${inner}</g>` : inner;
};
const NECK: Omit<PetAcc, 'slot'>[] = [
  { id: 'collar', name: 'Comfy Collar', price: 0, color: '#e85d5d', draw: (x) => collar(x) + swing(C(0, 11, 2, 'none', 'stroke="#c9a227" stroke-width="1.6"') + C(0, 17, 5, GOLD, 'stroke="#d99a1e" stroke-width="1"')) },
  { id: 'heartcollar', name: 'Heart Tag Collar', price: 15, color: '#ff7eb6', draw: (x) => collar(x) + swing(C(0, 11, 2, 'none', 'stroke="#c9a227" stroke-width="1.6"') + `<path d="${heartD(0, 12, 7)}" fill="${GOLD}" stroke="#d99a1e" stroke-width="1"/>`) },
  {
    id: 'bellcollar', name: 'Jingle Bell', price: 15, color: '#4f9dff', draw: (x) =>
      collar(x) + swing(P('M-6 18 Q-7 8 0 8 Q7 8 6 18Z', GOLD, 'stroke="#d99a1e" stroke-width="1"') + C(0, 18.5, 1.8, '#8a5a00') + C(-2, 11, 1.6, '#fff', 'opacity="0.7"'), 0.9),
  },
  { id: 'gemcollar', name: 'Gem Collar', price: 30, color: '#9b6bff', draw: (x) => collar(x, dots([[-16, 2], [-8, 6], [0, 7.5], [8, 6], [16, 2]], 2.4, '#fff') + `<path d="M0 10 L5 15 L0 22 L-5 15Z" fill="#7cc8ff" stroke="#fff" stroke-width="1"/>`) },
  {
    id: 'bandana', name: 'Polka Bandana', price: 15, color: '#e8484f', draw: (x) =>
      P('M-26 -4 Q0 8 26 -4 L4 30 Q0 34 -4 30Z', x.c, edge(x.c, 1.4)) + dots([[-12, 4], [0, 10], [12, 4], [-4, 20], [5, 18], [0, 27]], 1.9, '#fff') + E(-22, 0, 5, 4, dark(x.c, 0.1)),
  },
  { id: 'starbandana', name: 'Star Bandana', price: 15, color: '#4f9dff', draw: (x) => P('M-26 -4 Q0 8 26 -4 L4 30 Q0 34 -4 30Z', x.c, edge(x.c, 1.4)) + [[-10, 5], [8, 8], [0, 19]].map(([px, py]) => `<path d="${starD(px, py, 4.5)}" fill="#ffe680"/>`).join('') },
  {
    id: 'bowtie', name: 'Bow Tie', price: 10, color: '#2d2a3a', draw: (x) =>
      P('M0 7 L-15 -1 Q-17 7 -15 15Z', x.c, edge(x.c, 1.2)) + P('M0 7 L15 -1 Q17 7 15 15Z', x.c, edge(x.c, 1.2)) + R(-3.5, 3, 7, 8, 2.5, dark(x.c, 0.2)) + E(-9, 3.5, 3, 1.4, '#fff', 'opacity="0.35"'),
  },
  { id: 'neckbow', name: 'Ribbon Bow', price: 15, color: '#ff9ec7', draw: (x) => S('M-24 -2 Q0 10 24 -2', x.c, 4) + bowG(0, 8, 0.62, x.c) },
  {
    id: 'pearls', name: 'Pearl Necklace', price: 25, color: '#fff8f0', fixed: true, draw: () =>
      Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        const px = -24 + 48 * t;
        const py = -3 + 16 * t * (1 - t) * 2 * 0.9;
        return C(px, py, 3.4, '#fff8f0', 'stroke="#e6d8cc" stroke-width="0.8"') + C(px - 1, py - 1.1, 1.1, '#fff');
      }).join('') + C(0, 13, 5, '#fff8f0', 'stroke="#e6d8cc" stroke-width="0.8"') + C(-1.5, 11.5, 1.6, '#fff'),
  },
  {
    id: 'scarf', name: 'Winter Scarf', price: 20, color: '#5fd3b5', draw: (x) =>
      P('M-27 -6 Q0 10 27 -6 L27 5 Q0 20 -27 5Z', x.c, edge(x.c, 1.4)) + [-16, -4, 8, 20].map((dx) => S(`M${dx} ${dx === -4 || dx === 8 ? 4 : 0} v8`, '#fff', 3, 'opacity="0.8"')).join('') +
      P('M12 6 L22 6 L24 32 L13 32Z', x.c, edge(x.c, 1.4)) + S('M13 16 L23 16 M13 24 L24 24', '#fff', 3, 'opacity="0.8"') + S('M14 33 v4 M17 33 v4 M20 33 v4 M23 33 v4', dark(x.c, 0.1), 1.8),
  },
  { id: 'lei', name: 'Flower Lei', price: 20, color: '#ff7eb6', draw: (x) => Array.from({ length: 7 }, (_, i) => { const t = i / 6; return flowerG(-24 + 48 * t, -2 + 30 * t * (1 - t), 6, i % 2 ? '#ffd36b' : x.c, i % 2 ? '#ff7a6b' : '#fff3b0'); }).join('') },
  {
    id: 'medal', name: 'Gold Medal', price: 25, color: '#4f9dff', draw: (x) =>
      P('M-14 -4 L-4 14 L4 14 L14 -4 L8 -4 L0 9 L-8 -4Z', x.c, edge(x.c, 1)) + C(0, 20, 8, GOLD, 'stroke="#d99a1e" stroke-width="1.4"') + `<path d="${starD(0, 20, 4.5)}" fill="#fff3b0"/>`,
  },
  {
    id: 'ruffle', name: 'Ruffle Collar', price: 20, color: '#ffffff', draw: (x) =>
      Array.from({ length: 8 }, (_, i) => { const t = i / 7; return C(-24 + 48 * t, -1 + 18 * t * (1 - t), 7, x.c, edge(x.c === '#ffffff' ? '#e6e2ec' : x.c, 1.2)); }).join('') +
      Array.from({ length: 7 }, (_, i) => { const t = (i + 0.5) / 7; return C(-24 + 48 * t, 5 + 18 * t * (1 - t), 5.5, '#ff9ec7', 'opacity="0.85"'); }).join(''),
  },
  { id: 'locket', name: 'Heart Locket', price: 25, color: '#ff4f8b', draw: (x) => S('M-22 -3 Q0 16 22 -3', GOLD, 1.8) + swing(`<path d="${heartD(0, 9, 8)}" fill="${x.c}" stroke="#d99a1e" stroke-width="1.5"/>` + E(-2.5, 12, 1.8, 1.2, '#fff', 'opacity="0.7"')) },
  { id: 'necktie', name: 'Necktie', price: 15, color: '#4f9dff', draw: (x) => S('M-22 -3 Q0 9 22 -3', '#fff', 4) + P('M-4 4 L4 4 L3 9 L-3 9Z', dark(x.c, 0.15)) + P('M-3 9 L3 9 L6 30 L0 36 L-6 30Z', x.c, edge(x.c, 1.2)) + S('M-4 16 L4 13 M-5 24 L5 20', '#fff', 2, 'opacity="0.5"') },
];

// face: eyes at (-17.5, 0) and (17.5, 0)
const lensPair = (one: (cx: number) => string) => one(-17.5) + one(17.5);
const FACE: Omit<PetAcc, 'slot'>[] = [
  { id: 'roundspecs', name: 'Round Glasses', price: 0, color: '#9b6bff', draw: (x) => lensPair((cx) => C(cx, 0, 12.5, '#fff', `fill-opacity="0.18" stroke="${x.c}" stroke-width="3"`)) + S('M-5 -2 Q0 -6 5 -2', x.c, 3) + S('M-30 -3 L-40 -6 M30 -3 L40 -6', x.c, 3) + lensPair((cx) => S(`M${cx - 7} -4 Q${cx - 5} -8 ${cx - 1} -9`, '#fff', 2, 'opacity="0.8"')) },
  { id: 'heartshades', name: 'Heart Shades', price: 20, color: '#ff4f8b', draw: (x) => lensPair((cx) => `<path d="${heartD(cx, -9, 14)}" fill="${x.c}" fill-opacity="0.8" stroke="${dark(x.c, 0.25)}" stroke-width="2"/>` + E(cx - 5, -3, 3, 2, '#fff', 'opacity="0.7"')) + S('M-5 -1 Q0 -4 5 -1', dark(x.c, 0.25), 2.5) },
  { id: 'starshades', name: 'Star Shades', price: 20, color: '#ffd36b', draw: (x) => lensPair((cx) => `<path d="${starD(cx, 1, 15, 0.52)}" fill="${x.c}" fill-opacity="0.85" stroke="${dark(x.c, 0.3)}" stroke-width="2" stroke-linejoin="round"/>` + C(cx - 4, -3, 2.2, '#fff', 'opacity="0.8"')) + S('M-4 -1 L4 -1', dark(x.c, 0.3), 2.5) },
  {
    id: 'sunnies', name: 'Cool Sunnies', price: 15, color: '#2d2a3a', draw: (x) =>
      lensPair((cx) => P(`M${cx - 12} -7 H${cx + 12} Q${cx + 12} 9 ${cx} 9 Q${cx - 12} 9 ${cx - 12} -7Z`, x.c, `stroke="${dark(x.c, 0.2)}" stroke-width="2"`) + P(`M${cx - 8} -4 L${cx - 3} -4 L${cx - 8} 3Z`, '#fff', 'opacity="0.35"')) + S('M-31 -6 H31', x.c, 3),
  },
  { id: 'nerdspecs', name: 'Smart Specs', price: 15, color: '#2d2a3a', draw: (x) => lensPair((cx) => R(cx - 12, -9, 24, 19, 6, '#fff', `fill-opacity="0.2" stroke="${x.c}" stroke-width="4"`)) + S('M-5 -2 H5', x.c, 4) + lensPair((cx) => S(`M${cx - 6} -4 L${cx - 2} -6`, '#fff', 2)) },
  { id: 'cateye', name: 'Cat-Eye Glasses', price: 25, color: '#ff7eb6', draw: (x) => lensPair((cx) => P(`M${cx - 12} -5 Q${cx} -9 ${cx + 12} -5 L${cx + (cx > 0 ? 17 : -17) * 1} -11 Q${cx + 13} 10 ${cx} 9 Q${cx - 13} 10 ${cx - 12} -5Z`.replace(`L${cx + (cx > 0 ? 17 : -17)} -11`, cx > 0 ? `L${cx + 17} -11` : `L${cx + 12} -5`), '#fff', `fill-opacity="0.2" stroke="${x.c}" stroke-width="3" stroke-linejoin="round"`) + C(cx + (cx > 0 ? 13 : -13), -6, 1.8, '#fff')) + S('M-6 -3 Q0 -6 6 -3', x.c, 3) },
  {
    id: 'mask', name: 'Party Mask', price: 30, color: '#c99bff', draw: (x) =>
      `<path d="M-34 -6 Q-30 -16 -17 -12 Q-6 -9 0 -4 Q6 -9 17 -12 Q30 -16 34 -6 Q36 8 22 10 Q10 10 0 4 Q-10 10 -22 10 Q-36 8 -34 -6Z M-24 0 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0Z M10 0 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0Z" fill="${x.c}" fill-rule="evenodd" stroke="${dark(x.c, 0.25)}" stroke-width="1.6"/>` +
      dots([[-28, -6], [28, -6], [0, -1]], 1.6, '#fff') + `<path d="${sparkleD(32, -14, 5)}" fill="#ffe680"/>` + S('M34 -8 Q44 -22 40 -30', '#ff7eb6', 3),
  },
  { id: 'goggles', name: 'Swim Goggles', price: 15, color: '#5fd3b5', draw: (x) => S('M-44 -2 H44', x.c, 5) + lensPair((cx) => C(cx, 0, 12, '#bfe8ff', `fill-opacity="0.55" stroke="${x.c}" stroke-width="4"`) + S(`M${cx - 6} -4 Q${cx - 3} -7 ${cx + 1} -7`, '#fff', 2.2)) + S('M-6 -1 H6', x.c, 3.5) },
  { id: 'monocle', name: 'Fancy Monocle', price: 20, color: '#ffd24a', draw: (x) => C(17.5, 0, 12, '#fff', `fill-opacity="0.2" stroke="${x.c}" stroke-width="3"`) + S('M24 10 Q30 26 22 40', x.c, 1.6) + S('M11 -5 Q13 -8 17 -9', '#fff', 2) },
  { id: 'rainbowshades', name: 'Rainbow Shades', price: 30, color: '#ff7eb6', fixed: true, draw: () => lensPair((cx) => R(cx - 13, -8, 26, 17, 8, 'url(#g-rainbow)', 'stroke="#fff" stroke-width="2.5"') + S(`M${cx - 7} -4 L${cx - 2} -5`, '#fff', 2)) + S('M-5 -2 H5', '#fff', 3) },
  { id: 'pixelshades', name: 'Pixel Shades', price: 20, color: '#2d2a3a', draw: (x) => P('M-32 -8 H32 V-3 H28 V1 H24 V5 H8 V1 H4 V-3 H-4 V1 H-8 V5 H-24 V1 H-28 V-3 H-32Z', x.c) + R(-24, -5, 4, 4, 0, '#fff', 'opacity="0.8"') + R(10, -5, 4, 4, 0, '#fff', 'opacity="0.8"') },
];

// body frame: centre (0, 0), ellipse rx x ry, front +x, up -y
const clipG = (x: AccCtx, inner: string) => `<g clip-path="url(#${x.clip})">${inner}</g>`;
const outline = (x: AccCtx) => E(0, 0, x.rx, x.ry, 'none', edge(x.c, 2));
function sweater(x: AccCtx, kind: 'plain' | 'hearts' | 'stripes' | 'stars'): string {
  const { rx, ry, c } = x;
  const x0 = -rx * 0.5;
  let s = R(x0, -ry - 4, rx * 1.6, ry * 2 + 8, 0, c);
  if (kind === 'hearts') s += [[-0.25, -0.45], [0.2, 0.05], [-0.3, 0.4], [0.1, -0.7]].map(([u, v]) => `<path d="${heartD(rx * u, ry * v - 3, 6.5)}" fill="#fff" opacity="0.85"/>`).join('');
  if (kind === 'stars') s += [[-0.25, -0.45], [0.2, 0.05], [-0.3, 0.4], [0.1, -0.7]].map(([u, v]) => `<path d="${starD(rx * u, ry * v, 6)}" fill="#ffe680"/>`).join('');
  if (kind === 'stripes') s += [-0.3, 0.0, 0.3, 0.6].map((u) => R(rx * u - 4, -ry - 4, 9, ry * 2 + 8, 0, '#fff', 'opacity="0.75"')).join('');
  s += R(x0 - 1, -ry - 4, 10, ry * 2 + 8, 0, dark(c, 0.12)) + Array.from({ length: 6 }, (_, i) => S(`M${f(x0 + 1)} ${f(-ry + (i * ry * 2) / 5)} h6`, dark(c, 0.25), 1.4, 'opacity="0.6"')).join('');
  s += E(0, 0, rx, ry, 'url(#g-shadeY)');
  return clipG(x, s) + frontEdge(x, x0);
}
/** The body outline from x0 round the front, so a sweater keeps a crisp edge. */
function frontEdge(x: AccCtx, x0: number): string {
  const yy = x.ry * Math.sqrt(Math.max(0, 1 - (x0 / x.rx) ** 2));
  return S(`M${f(x0)} ${f(-yy)} A${f(x.rx)} ${f(x.ry)} 0 1 1 ${f(x0)} ${f(yy)}`, dark(x.c, 0.24), 2);
}

function capeD(x: AccCtx, flap: number, hero: boolean): string {
  const { rx, ry } = x;
  const bx = -rx * (hero ? 1.28 : 1.08) - flap;
  const by = ry * (hero ? 0.2 : 0.5) - flap * 0.6;
  return `M${f(rx * 0.62)} ${f(-ry * 0.84)} Q${f(0)} ${f(-ry * 1.3)} ${f(-rx * 0.92)} ${f(-ry * 0.62)} Q${f(bx + 4)} ${f(by * 0.3)} ${f(bx)} ${f(by)} Q${f(bx * 0.6)} ${f(by + 8)} ${f(-rx * 0.3)} ${f(ry * 0.3)} Q${f(-rx * 0.05)} ${f(ry * 0.42)} ${f(rx * 0.28)} ${f(ry * 0.18)} Q${f(rx * 0.5)} ${f(-ry * 0.3)} ${f(rx * 0.62)} ${f(-ry * 0.84)}Z`;
}
function cape(x: AccCtx, hero: boolean, royal = false): string {
  const d0 = capeD(x, 0, hero);
  const d1 = capeD(x, hero ? 10 : 6, hero);
  const flutter = anim(`<animate attributeName="d" values="${d0};${d1};${d0}" dur="${hero ? 0.9 : 2.2}s" repeatCount="indefinite"/>`);
  const c = x.c;
  let s = `<path d="${d0}" fill="${c}" ${edge(c, 1.6)}>${flutter}</path><path d="${d0}" fill="url(#g-shadeY)">${flutter}</path>`;
  if (royal) s += `<path d="${d0}" fill="none" stroke="#ffd24a" stroke-width="4" stroke-dasharray="1 0">${flutter}</path>` + dots([[-x.rx * 0.5, -x.ry * 0.5], [-x.rx * 0.2, -x.ry * 0.82], [-x.rx * 0.75, -x.ry * 0.15]], 2.6, '#fff');
  if (hero) s += C(-x.rx * 0.35, -x.ry * 0.38, 11, '#ffd36b', edge('#ffd36b', 1.4)) + `<path d="${starD(-x.rx * 0.35, -x.ry * 0.36, 8)}" fill="${c}"/>`;
  s += C(x.rx * 0.6, -x.ry * 0.82, 5, GOLD, 'stroke="#d99a1e" stroke-width="1"');
  return s;
}
function tutu(x: AccCtx, rainbow: boolean, satin = false): string {
  const { rx, ry } = x;
  const xa = -rx * 0.66;
  const xb = rx * 0.14;
  const yt = (px: number) => -ry * Math.sqrt(Math.max(0, 1 - (px / rx) ** 2)) + 4;
  const yb = ry * 0.82;
  const n = 6;
  const L = xa - rx * 0.24;
  const Rr = xb + rx * 0.22;
  const layer = (dy: number, c: string, sc: number) => {
    let d = `M${f(xa)} ${f(yt(xa) + dy)} Q${f((xa + xb) / 2)} ${f(yt((xa + xb) / 2) - 3 + dy)} ${f(xb)} ${f(yt(xb) + dy)} L${f(Rr)} ${f(yb * sc)}`;
    for (let i = n; i > 0; i--) {
      const x1 = L + ((Rr - L) * (i - 1)) / n;
      const xm = (x1 + L + ((Rr - L) * i) / n) / 2;
      d += satin ? ` Q${f(xm)} ${f(yb * sc + 5)} ${f(x1)} ${f(yb * sc)}` : ` Q${f(xm)} ${f(yb * sc + 10)} ${f(x1)} ${f(yb * sc)}`;
    }
    return P(d + 'Z', c, `${edge(c, 1.3)} stroke-linejoin="round"`);
  };
  const cs = rainbow ? ['#c99bff', '#7cc8ff', '#ff9ec7'] : [light(x.c, 0.35), x.c, light(x.c, 0.2)];
  let s = layer(0, cs[0], 1.05) + layer(2, cs[1], 0.9) + (satin ? '' : layer(4, cs[2], 0.72));
  s += S(`M${f(xa)} ${f(yt(xa) + 2)} Q${f((xa + xb) / 2)} ${f(yt((xa + xb) / 2) - 1)} ${f(xb)} ${f(yt(xb) + 2)}`, dark(cs[1], 0.18), 4);
  if (satin) s += bowG((xa + xb) / 2, yt((xa + xb) / 2) + 2, 0.45, dark(x.c, 0.12));
  else s += dots([[xa + 6, ry * 0.3], [xb, ry * 0.45], [(xa + xb) / 2, ry * 0.6]], 1.8, '#fff');
  return s;
}
function wingPair(x: AccCtx, art: (far: boolean) => string, dur: number, amp: number): string {
  const { rx, ry } = x;
  const wx = -rx * 0.12;
  const wy = -ry * 0.82;
  const k = Math.max(0.75, ry / 32);
  const one = (far: boolean) => {
    const r = rot([0, -amp, 0], 0, 0, dur);
    const g = G(`translate(${f(wx + (far ? 9 : 0))} ${f(wy - (far ? 3 : 0))}) scale(${f(k)}) rotate(${far ? 14 : 0})`, r ? `<g>${r}${art(far)}</g>` : art(far));
    return g;
  };
  return one(true) + one(false);
}
const fairyWing = (c: string) => (far: boolean) =>
  `<g opacity="${far ? 0.6 : 0.85}">` + P('M0 0 C-6 -30 -40 -56 -54 -42 C-62 -30 -34 -8 0 0Z', light(c, 0.35), 'stroke="#fff" stroke-width="2"') + P('M0 0 C-24 -4 -46 6 -42 20 C-36 32 -12 14 0 0Z', light(c, 0.15), 'stroke="#fff" stroke-width="2"') +
  S('M-4 -4 C-16 -18 -30 -32 -44 -40', '#fff', 1.4, 'opacity="0.7"') + C(-34, -34, 2.2, '#fff') + C(-26, 14, 1.8, '#fff') + `</g>`;
const butterflyWing = (c: string) => (far: boolean) =>
  `<g opacity="${far ? 0.75 : 1}">` + P('M0 0 C-4 -34 -44 -58 -58 -40 C-66 -26 -38 -6 0 0Z', c, edge(c, 1.6)) + P('M0 0 C-26 -2 -50 10 -44 26 C-36 38 -10 18 0 0Z', light(c, 0.25), edge(c, 1.6)) +
  C(-40, -36, 7, '#fff', 'opacity="0.85"') + C(-26, -26, 4.5, '#ffe680') + C(-30, 16, 5, '#fff', 'opacity="0.8"') + C(-46, -44, 2.4, dark(c, 0.3)) + `</g>`;
const angelWing = (c: string) => (far: boolean) => {
  const sc = '#d8d4e0';
  let s = `<g opacity="${far ? 0.8 : 1}">`;
  s += P('M0 0 C-8 -28 -36 -48 -58 -44 C-56 -34 -52 -30 -58 -24 C-50 -18 -50 -14 -54 -6 C-44 -2 -40 4 -40 8 C-26 6 -12 6 0 0Z', c, `stroke="${sc}" stroke-width="1.6" stroke-linejoin="round"`);
  s += S('M-10 -6 C-22 -10 -34 -16 -44 -26 M-12 0 C-24 0 -34 -4 -44 -10', sc, 1.4);
  return s + '</g>';
};
const dragonWing = (c: string) => (far: boolean) =>
  `<g opacity="${far ? 0.75 : 1}">` + P('M0 0 L-8 -40 L-52 -46 Q-44 -34 -50 -26 Q-38 -26 -36 -14 Q-24 -18 -20 -6 Q-10 -8 0 0Z', c, `${edge(c, 1.6)} stroke-linejoin="round"`) + S('M-8 -40 L-34 -14 M-8 -40 L-44 -30 M-8 -40 L-20 -6', dark(c, 0.25), 1.6) + C(-8, -40, 3, dark(c, 0.3)) + `</g>`;

const BODY: Omit<PetAcc, 'slot'>[] = [
  { id: 'sweater', name: 'Cozy Sweater', price: 0, color: '#ff9ec7', draw: (x) => sweater(x, 'plain') },
  { id: 'heartsweater', name: 'Heart Sweater', price: 20, color: '#ff4f8b', draw: (x) => sweater(x, 'hearts') },
  { id: 'stripesweater', name: 'Stripy Sweater', price: 20, color: '#7cc8ff', draw: (x) => sweater(x, 'stripes') },
  { id: 'starsweater', name: 'Star Sweater', price: 20, color: '#7a5cff', draw: (x) => sweater(x, 'stars') },
  {
    id: 'raincoat', name: 'Raincoat', price: 25, color: '#ffd24a', draw: (x) =>
      sweater({ ...x }, 'plain') + clipG(x, E(x.rx * 0.2, -x.ry * 0.45, x.rx * 0.5, x.ry * 0.16, '#fff', 'opacity="0.35"') + [-0.3, 0.1, 0.5].map((v) => C(x.rx * 0.48, x.ry * v, 3.2, dark(x.c, 0.3)) + C(x.rx * 0.47, x.ry * v - 1, 1, '#fff', 'opacity="0.6"')).join('')) +
      P(`M${f(x.rx * 0.36)} ${f(-x.ry * 1.06)} Q${f(x.rx * 0.6)} ${f(-x.ry * 1.5)} ${f(x.rx * 0.95)} ${f(-x.ry * 0.9)} Q${f(x.rx * 0.6)} ${f(-x.ry * 0.95)} ${f(x.rx * 0.36)} ${f(-x.ry * 1.06)}Z`, dark(x.c, 0.08), edge(x.c, 1.4)),
  },
  {
    id: 'puffer', name: 'Puffy Jacket', price: 30, color: '#5fd3b5', draw: (x) =>
      sweater(x, 'plain') + clipG(x, [-0.05, 0.25, 0.55, 0.85].map((u) => S(`M${f(x.rx * u)} ${f(-x.ry - 4)} Q${f(x.rx * u + 8)} 0 ${f(x.rx * u)} ${f(x.ry + 4)}`, dark(x.c, 0.18), 2)).join('') + [0.1, 0.4, 0.7].map((u) => E(x.rx * u, -x.ry * 0.4, 5, x.ry * 0.4, '#fff', 'opacity="0.2"')).join('')),
  },
  { id: 'cape', name: 'Magic Cape', price: 25, color: '#9b6bff', draw: (x) => cape(x, false) },
  { id: 'herocape', name: 'Super Cape', price: 30, color: '#e8484f', draw: (x) => cape(x, true) },
  { id: 'royalcape', name: 'Royal Cape', price: 45, color: '#c4458f', draw: (x) => cape(x, false, true) },
  { id: 'tutu', name: 'Ballet Tutu', price: 25, color: '#ff9ec7', draw: (x) => tutu(x, false) },
  { id: 'rainbowtutu', name: 'Rainbow Tutu', price: 35, color: '#c99bff', fixed: true, draw: (x) => tutu(x, true) },
  { id: 'partyskirt', name: 'Party Skirt', price: 25, color: '#7cc8ff', draw: (x) => tutu(x, false, true) },
  { id: 'fairywings', name: 'Fairy Wings', price: 40, color: '#ff9ec7', draw: () => '', back: (x) => wingPair(x, fairyWing(x.c), 0.5, 12) },
  { id: 'butterfly', name: 'Butterfly Wings', price: 40, color: '#ffab5e', draw: () => '', back: (x) => wingPair(x, butterflyWing(x.c), 0.7, 14) },
  { id: 'angelwings', name: 'Angel Wings', price: 45, color: '#ffffff', draw: () => '', back: (x) => wingPair(x, angelWing(x.c), 1.6, 8) },
  { id: 'dragonwings', name: 'Dragon Wings', price: 40, color: '#5fd3b5', draw: () => '', back: (x) => wingPair(x, dragonWing(x.c), 1.2, 10) },
  {
    id: 'beesuit', name: 'Bumble Suit', price: 35, color: '#ffd24a', draw: (x) => clipG(x, R(-x.rx * 1.1, -x.ry - 4, x.rx * 2.2, x.ry * 2 + 8, 0, x.c) + [-0.6, -0.15, 0.3].map((u) => R(x.rx * u, -x.ry - 4, x.rx * 0.2, x.ry * 2 + 8, 0, '#2d2a3a')).join('') + E(0, 0, x.rx, x.ry, 'url(#g-shadeY)')) + outline(x),
    back: (x) => wingPair(x, (far) => `<g opacity="${far ? 0.5 : 0.8}">${E(-14, -14, 16, 10, '#e8f6ff', 'stroke="#fff" stroke-width="2" transform="rotate(35 -14 -14)"')}</g>`, 0.25, 16),
  },
  {
    id: 'blanket', name: 'Pony Blanket', price: 25, color: '#7a5cff', draw: (x) =>
      clipG(x, P(`M${f(-x.rx * 0.72)} ${f(-x.ry - 4)} H${f(x.rx * 0.14)} V${f(x.ry * 0.3)} Q${f(-x.rx * 0.29)} ${f(x.ry * 0.42)} ${f(-x.rx * 0.72)} ${f(x.ry * 0.3)}Z`, x.c) +
        S(`M${f(-x.rx * 0.72 + 3)} ${f(-x.ry - 4)} V${f(x.ry * 0.26)} Q${f(-x.rx * 0.29)} ${f(x.ry * 0.38)} ${f(x.rx * 0.14 - 3)} ${f(x.ry * 0.26)} V${f(-x.ry - 4)}`, '#ffd24a', 3) +
        `<path d="${heartD(-x.rx * 0.32, -x.ry * 0.3, 8)}" fill="#ffd24a"/>` + E(0, 0, x.rx, x.ry, 'url(#g-shadeY)')),
  },
  {
    id: 'backpack', name: 'Tiny Backpack', price: 25, color: '#ff7a6b', draw: (x) =>
      clipG(x, R(-x.rx * 0.2, -x.ry - 4, 7, x.ry * 2 + 8, 0, dark(x.c, 0.2))) + R(-x.rx * 0.78, -x.ry * 1.3, x.rx * 0.52, x.ry * 0.8, 9, x.c, edge(x.c, 1.6)) +
      R(-x.rx * 0.72, -x.ry * 0.9, x.rx * 0.4, x.ry * 0.32, 6, light(x.c, 0.2), edge(x.c, 1.2)) + S(`M${f(-x.rx * 0.66)} ${f(-x.ry * 1.3)} Q${f(-x.rx * 0.52)} ${f(-x.ry * 1.55)} ${f(-x.rx * 0.38)} ${f(-x.ry * 1.3)}`, dark(x.c, 0.2), 3) + C(-x.rx * 0.52, -x.ry * 0.8, 2.4, '#ffd36b'),
  },
];

export const PET_ACC: PetAcc[] = [
  ...HEAD.map((a) => ({ ...a, slot: 'head' as const })),
  ...NECK.map((a) => ({ ...a, slot: 'neck' as const })),
  ...BODY.map((a) => ({ ...a, slot: 'body' as const })),
  ...FACE.map((a) => ({ ...a, slot: 'face' as const })),
];
export const PET_ACC_BY_ID: Record<string, PetAcc> = Object.fromEntries(PET_ACC.map((a) => [a.id, a]));
export const PET_SLOTS: { id: PetSlot; name: string }[] = [
  { id: 'head', name: 'Hats & Bows' },
  { id: 'neck', name: 'Collars' },
  { id: 'body', name: 'Outfits' },
  { id: 'face', name: 'Glasses' },
];

// ---------------- composition ----------------
function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface PetOpts {
  pose?: PetPose;
  expr?: PetExpr;
  still?: boolean;
  /** Adds a soft ground shadow (scenes draw their own). */
  shadow?: boolean;
}

export function renderPet(look: PetLook, opts: PetOpts = {}): string {
  const k = kindOf(look.kind);
  const pose = opts.pose ?? 'stand';
  const expr = opts.expr ?? (pose === 'sleep' ? 'sleep' : 'normal');
  STILL = !!opts.still;
  PH = (hash(look.fur + look.kind + look.pattern) % 1000) / 1000;
  const id = `pt${(++SEQ).toString(36)}`;
  const fur = look.fur || k.fur;
  const fur2 = look.fur2 || k.fur2;
  const pat = PET_PATTERNS.some((p) => p.id === look.pattern) ? look.pattern : 'plain';
  const x: Ctx = { k, look, fur, fur2, pat, pose, expr, id };
  const L = layout(k, pose);
  const { b } = L;
  const acc = (slot: PetSlot) => {
    const w = look.acc?.[slot];
    const def = w ? PET_ACC_BY_ID[w.id] : undefined;
    if (!def || !w) return null;
    return { def, ctx: { c: def.fixed ? def.color : w.color || def.color, rx: b.rx, ry: b.ry, clip: `${id}c`, nw: k.nw, kind: k.id } as AccCtx };
  };
  const bodyAcc = acc('body');
  const bodyT = `translate(${f(b.cx)} ${f(b.cy)}) rotate(${f(b.rot)})`;

  const s = opts.shadow ? E(pose === 'sleep' ? 0 : 4, 0, k.rx * (pose === 'sleep' ? 1.35 : 1.15), 9, 'url(#g-ground)') : '';
  let pet = '';
  // wings and such behind everything
  if (bodyAcc?.def.back) pet += G(bodyT, bodyAcc.def.back(bodyAcc.ctx));
  // tail
  const tail = tailArt(x);
  if (tail) {
    const wag = pose === 'sleep' ? rot([0, -6, 0], 0, 0, 3.2) : k.tail === 'hair' ? rot([0, 6, 0], 0, 0, 2.6) : rot([-10, 14, -10], 0, 0, k.tail === 'cat' ? 2.4 : 0.9);
    const hang = k.tail === 'hair' ? ({ stand: 0, walk: 0, sit: 78, sleep: 72, held: 6 } as const)[pose] : null;
    const tr = hang ?? L.tail.rot + b.rot * (k.biped ? 1 : 0.5);
    pet += G(`translate(${f(L.tail.x)} ${f(L.tail.y)}) rotate(${f(tr)})`, wag ? `<g>${wag}${tail}</g>` : tail);
  }
  for (const leg of L.legs) if (leg.far) pet += legArt(x, leg);
  for (const ft of L.feet) if (ft.far) pet += footArt(x, ft);
  for (const leg of L.legs) if (!leg.far && !leg.over && !k.biped) pet += legArt(x, leg);
  pet += G(bodyT, bodyArt(x, b));
  if (L.haunch) {
    const h = L.haunch;
    const hc = x.fur;
    pet += E(h.x, h.y, h.rx, h.ry, hc, edge(hc, 2)) + E(h.x, h.y, h.rx, h.ry, 'url(#g-shadeY)');
    if (pat === 'spots') pet += C(h.x - h.rx * 0.2, h.y - h.ry * 0.2, h.ry * 0.3, fur2);
  }
  for (const leg of L.legs) if (!leg.far && (leg.over || k.biped)) pet += legArt(x, leg);
  for (const ft of L.feet) if (!ft.far) pet += footArt(x, ft);
  if (L.wing) pet += G(bodyT, duckWing(x, L.wing));
  if (bodyAcc) pet += G(bodyT, bodyAcc.def.draw(bodyAcc.ctx));
  pet += neckArt(x, L);

  // head (with collar under the chin and glasses/hats on top)
  const headT = `translate(${f(L.hx)} ${f(L.hy)}) rotate(${f(L.tilt)}) scale(${k.u})`;
  let head = '';
  head += headArt(x);
  const neck = acc('neck');
  if (neck) head += G(`translate(${f(FX * 0.5)} ${f(46 * k.hh * 0.93)}) scale(${f(k.nw * 1.12)} 1.12)`, neck.def.draw(neck.ctx));
  const face = acc('face');
  if (face) head += G(`translate(${FX} ${f(k.ey)})`, face.def.draw(face.ctx));
  const hat = acc('head');
  if (hat) head += G(`translate(0 ${f(-46 * k.hh)})`, hat.def.draw(hat.ctx));
  const bob = pose === 'sleep' ? '' : move('0 0;0 -1.6;0 0', 2.6 + PH);
  pet += G(headT, bob ? `<g>${bob}${head}</g>` : head);

  if (pose === 'walk') pet = `<g>${move('0 0;0 -3;0 0', 0.31)}${pet}</g>`;
  let zzz = '';
  if (pose === 'sleep') {
    pet = scaleAbout(0, 0, '1 1;1.01 1.035;1 1', 3.2, pet);
    if (!STILL) {
      const zx = L.hx + 30;
      const zy = L.hy - 50;
      for (let i = 0; i < 3; i++)
        zzz += `<text x="${f(zx)}" y="${f(zy)}" font-size="${18 + i * 4}" font-weight="700" fill="#9b6bff" opacity="0" style="font-family:Fredoka,sans-serif">z<animateTransform attributeName="transform" type="translate" values="0 0;${16 + i * 4} -40" dur="3s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="3s" begin="${i}s" repeatCount="indefinite"/></text>`;
    }
  }
  STILL = false;
  return s + pet + zzz;
}

/** Standing height (feet to the tips of the ears). */
export function petHeight(look: PetLook): number {
  const k = kindOf(look.kind);
  const L = layout(k, 'stand');
  return Math.round(-(L.hy - (46 * k.hh + k.earTop) * k.u));
}

/** A box around the pet in a pose, as an SVG viewBox string. */
export function petBox(look: PetLook, pose: PetPose = 'stand', pad = 10): string {
  const k = kindOf(look.kind);
  const L = layout(k, pose);
  const Hx = 46 * k.hw * k.u;
  const top = L.hy - (46 * k.hh + k.earTop + 6) * k.u;
  const tailW = k.tail === 'bushy' ? 56 : k.tail === 'hair' || k.tail === 'cat' ? 34 : 24;
  const left = Math.min(L.b.cx - L.b.rx - tailW, L.hx - Hx - 14);
  const right = Math.max(L.hx + Hx + 16, L.b.cx + L.b.rx + 10);
  const bottom = 10;
  const w = right - left;
  const h = bottom - top;
  const size = Math.max(w, h) + pad * 2;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  return `${f(cx - size / 2)} ${f(cy - size / 2)} ${f(size)} ${f(size)}`;
}

/** A full <svg> of the pet, standing still, for buttons and cards. */
export function petThumb(look: PetLook, size?: number, pose: PetPose = 'stand'): string {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  return `<svg viewBox="${petBox(look, pose)}"${dims} preserveAspectRatio="xMidYMid meet">${renderPet(look, { pose, still: true, shadow: pose !== 'held' })}</svg>`;
}

/** Where the head (centre and radius) and body (centre and radii) are in a pose, in pet units. */
export function petParts(look: PetLook, pose: PetPose = 'stand'): { head: { x: number; y: number; r: number; eyeY: number }; body: { x: number; y: number; rx: number; ry: number } } {
  const k = kindOf(look.kind);
  const L = layout(k, pose);
  return { head: { x: L.hx + FX * k.u, y: L.hy, r: 46 * k.u, eyeY: L.hy + k.ey * k.u }, body: { x: L.b.cx, y: L.b.cy, rx: L.b.rx, ry: L.b.ry } };
}

/** Just the head, for small round avatars. low / high (in head radii) show more below the chin / above the head. */
export function petHeadThumb(look: PetLook, low = 0, high = 0): string {
  const k = kindOf(look.kind);
  const L = layout(k, 'stand');
  const r = 46 * k.u;
  const top = L.hy - (46 * k.hh + Math.min(k.earTop, 30)) * k.u - 4 - high * r;
  const size = Math.max(r * 2.6, L.hy + r * (1.05 + low) - top);
  return `<svg viewBox="${f(L.hx - size / 2)} ${f(top)} ${f(size)} ${f(size)}">${renderPet(look, { still: true })}</svg>`;
}

export function randomPetLook(kind?: string): PetLook {
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
  const k = kind ? kindOf(kind) : pick(KINDS);
  const natural = Math.random() < 0.5;
  const fur = natural ? k.fur : pick(PET_FURS);
  let fur2 = natural ? k.fur2 : pick(PET_FURS.filter((c) => c !== fur));
  if (k.id === 'duckling') fur2 = pick(['#ffb347', '#ff9a6b', '#ffab5e']);
  return {
    kind: k.id,
    fur,
    fur2,
    pattern: Math.random() < 0.5 ? k.pattern : pick(PET_PATTERNS).id,
    eyes: Math.random() < 0.5 ? k.eyes : pick(PET_EYES).id,
    acc: {},
  };
}

/** The kind's own look (its natural colors), no accessories. */
export function basePetLook(kind: string): PetLook {
  const k = kindOf(kind);
  return { kind: k.id, fur: k.fur, fur2: k.fur2, pattern: k.pattern, eyes: k.eyes, acc: {} };
}
