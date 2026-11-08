// Cute little pictures that go on clothes and accessories: a strawberry on a tee, bunnies on a
// skirt, a unicorn patch on a jacket. Each is drawn in a 40x40 box centred on (0, 0) and placed with
// motif(id, x, y, size), where size is the radius in doll units.
import type { Season } from '../types';
import { dark, light } from './color';

export interface Motif {
  id: string;
  name: string;
  /** Garment colors this picture looks good on. */
  bg: string[];
  season?: Season;
  draw: () => string;
}

const C = (x: number, y: number, r: number, f: string, e = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${e}/>`;
const E = (x: number, y: number, rx: number, ry: number, f: string, e = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${e}/>`;
const P = (d: string, f: string, e = '') => `<path d="${d}" fill="${f}" ${e}/>`;
const S = (d: string, c: string, w = 2) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const eyes = (dx: number, y: number, r = 2) => C(-dx, y, r, '#2d2a3a') + C(dx, y, r, '#2d2a3a') + C(-dx + 0.7, y - 0.7, r * 0.35, '#fff') + C(dx + 0.7, y - 0.7, r * 0.35, '#fff');
const smile = (y: number, w = 3) => S(`M${-w} ${y} Q0 ${y + w * 0.9} ${w} ${y}`, '#2d2a3a', 1.6);
const cheeks = (dx: number, y: number) => E(-dx, y, 2.6, 1.6, '#ff8fb0', 'opacity="0.8"') + E(dx, y, 2.6, 1.6, '#ff8fb0', 'opacity="0.8"');
const heartPath = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.3} C${x - s * 0.5} ${y - s * 0.25} ${x - s * 1.05} ${y + s * 0.25} ${x} ${y + s} C${x + s * 1.05} ${y + s * 0.25} ${x + s * 0.5} ${y - s * 0.25} ${x} ${y + s * 0.3}Z`;
const star = (x: number, y: number, r: number, inner = 0.45) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + 'Z';
};
const petals = (n: number, r: number, pr: number, fill: string) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return C(+(Math.cos(a) * r).toFixed(1), +(Math.sin(a) * r).toFixed(1), pr, fill);
}).join('');

export const MOTIFS: Motif[] = [
  { id: 'heart', name: 'Heart', bg: ['#ffffff', '#ffb3c7', '#e6d4ff'], draw: () => P(heartPath(0, -14, 20), '#ff4f7b') + P(heartPath(-7, -9, 5), '#fff', 'opacity="0.55"') },
  { id: 'star', name: 'Star', bg: ['#3f4f9a', '#c99bff', '#ffb3c7'], draw: () => P(star(0, 2, 20), '#ffd24a', 'stroke="#f0a81e" stroke-width="1.5"') + C(-5, -3, 3, '#fff', 'opacity="0.6"') },
  { id: 'daisy', name: 'Daisy', bg: ['#ffb3c7', '#9fd6ff', '#a8e6cf'], season: 'spring', draw: () => petals(8, 12, 7.5, '#ffffff') + C(0, 0, 7, '#ffd24a') + C(-2, -2, 2.2, '#fff', 'opacity="0.6"') },
  { id: 'cherry', name: 'Cherry', bg: ['#ffffff', '#a8e6cf', '#fff3d6'], season: 'summer', draw: () => S('M-8 4 Q-6 -10 4 -18 M8 6 Q6 -8 4 -18', '#5f8f3a', 2.4) + P('M4 -18 Q14 -20 16 -12 Q8 -10 4 -18Z', '#6fc47c') + C(-9, 9, 9, '#e8384f') + C(9, 10, 9, '#e8384f') + C(-12, 6, 2.5, '#fff', 'opacity="0.6"') + C(6, 7, 2.5, '#fff', 'opacity="0.6"') },
  { id: 'strawberry', name: 'Strawberry', bg: ['#ffffff', '#ffb3c7', '#a8e6cf'], season: 'summer', draw: () => P('M-17 -8 Q0 -18 17 -8 Q16 12 0 20 Q-16 12 -17 -8Z', '#ff4f6d') + [[-8, -2], [6, -4], [-1, 6], [9, 7], [-9, 9], [0, -8]].map(([x, y]) => E(x, y, 1.5, 2.2, '#ffe680')).join('') + P('M-13 -10 L-5 -18 L0 -11 L5 -18 L13 -10Z', '#5fae6b') + smile(5, 2.5) },
  { id: 'rainbow', name: 'Rainbow', bg: ['#ffffff', '#9fd6ff', '#e6d4ff'], draw: () => ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff'].map((c, i) => S(`M${-18 + i * 3.4} 8 A${18 - i * 3.4} ${18 - i * 3.4} 0 0 1 ${18 - i * 3.4} 8`, c, 3.6)).join('') + C(-17, 9, 5.5, '#fff') + C(-12, 11, 4.5, '#fff') + C(17, 9, 5.5, '#fff') + C(12, 11, 4.5, '#fff') },
  { id: 'kitty', name: 'Kitty', bg: ['#ffe680', '#ffb3c7', '#a8e6cf'], draw: () => P('M-17 -4 L-14 -20 L-5 -12Z M17 -4 L14 -20 L5 -12Z', '#2d2a3a') + P('M-14 -6 L-13 -16 L-8 -11Z M14 -6 L13 -16 L8 -11Z', '#ff9ec7') + E(0, 3, 18, 15, '#2d2a3a') + C(-6, 0, 3.2, '#ffe680') + C(6, 0, 3.2, '#ffe680') + C(-6, 0, 1.4, '#2d2a3a') + C(6, 0, 1.4, '#2d2a3a') + P('M-2 6 L2 6 L0 8Z', '#ff9ec7') + S('M-4 10 Q-2 12 0 10 Q2 12 4 10', '#fff', 1.2) + S('M-10 7 L-20 5 M-10 9 L-20 10 M10 7 L20 5 M10 9 L20 10', '#fff', 1) },
  { id: 'bunny', name: 'Bunny', bg: ['#ffb3c7', '#e6d4ff', '#9fd6ff'], season: 'spring', draw: () => E(-7, -12, 4.5, 11, '#fff') + E(7, -12, 4.5, 11, '#fff') + E(-7, -11, 2, 7, '#ff9ec7') + E(7, -11, 2, 7, '#ff9ec7') + E(0, 6, 15, 13, '#fff') + eyes(5, 3) + cheeks(9, 9) + E(0, 8, 2, 1.5, '#ff7eb6') + smile(10, 2) },
  { id: 'bear', name: 'Teddy', bg: ['#fff3d6', '#9fd6ff', '#ffb3c7'], draw: () => C(-12, -11, 6.5, '#b07a4f') + C(12, -11, 6.5, '#b07a4f') + C(-12, -11, 3, '#e8c0a0') + C(12, -11, 3, '#e8c0a0') + C(0, 3, 16, '#c98a5a') + E(0, 8, 7, 5.5, '#e8c0a0') + eyes(6, 0) + E(0, 6, 2.4, 1.8, '#4a2e22') + smile(9, 2) },
  { id: 'unicorn', name: 'Unicorn', bg: ['#e6d4ff', '#ffb3c7', '#9fd6ff'], draw: () => P('M-2 -14 L4 -24 L4 -12Z', '#ffd24a') + P('M-14 -8 Q-20 6 -10 16 Q-16 2 -8 -6Z', '#ff9ec7') + P('M-12 -10 Q-18 0 -14 10 Q-12 0 -6 -8Z', '#9fd6ff') + E(2, 2, 14, 15, '#ffffff', 'stroke="#eadcf2" stroke-width="1"') + P('M6 -12 L10 -20 L11 -10Z', '#fff') + E(8, 12, 8, 6, '#ffd9e8') + C(2, 0, 2, '#2d2a3a') + E(10, 11, 1.2, 1, '#c98aa8') + E(-3, 7, 2.6, 1.6, '#ff8fb0', 'opacity="0.8"') },
  { id: 'butterfly', name: 'Butterfly', bg: ['#9fd6ff', '#a8e6cf', '#fff3b0'], season: 'spring', draw: () => P('M0 -2 C-8 -20 -22 -16 -18 -4 C-16 2 -6 2 0 -2Z', '#ff7eb6') + P('M0 -2 C8 -20 22 -16 18 -4 C16 2 6 2 0 -2Z', '#ff7eb6') + P('M0 0 C-6 4 -16 8 -12 16 C-8 20 -2 10 0 0Z', '#c99bff') + P('M0 0 C6 4 16 8 12 16 C8 20 2 10 0 0Z', '#c99bff') + C(-10, -8, 3, '#fff', 'opacity="0.8"') + C(10, -8, 3, '#fff', 'opacity="0.8"') + E(0, 2, 2, 9, '#4a3f5e') + S('M-1 -6 L-5 -14 M1 -6 L5 -14', '#4a3f5e', 1.2) },
  { id: 'crown', name: 'Crown', bg: ['#ffb3c7', '#9b6bff', '#ffffff'], draw: () => P('M-18 10 L-20 -12 L-9 -2 L0 -18 L9 -2 L20 -12 L18 10Z', '#ffd24a', 'stroke="#e0a11e" stroke-width="1.5"') + P('M-18 10 L18 10 L18 15 L-18 15Z', '#f0b232') + C(0, 3, 3.5, '#ff4f8b') + C(-10, 4, 2.5, '#7cc8ff') + C(10, 4, 2.5, '#5fd3b5') + C(0, -18, 2.5, '#fff') },
  { id: 'note', name: 'Music', bg: ['#9b6bff', '#2d2a3a', '#ffb3c7'], draw: () => S('M-6 10 L-6 -14 L14 -18 L14 6', '#ffffff', 3.2) + E(-10, 11, 6, 4.5, '#ffffff', 'transform="rotate(-20 -10 11)"') + E(10, 7, 6, 4.5, '#ffffff', 'transform="rotate(-20 10 7)"') + S('M-6 -8 L14 -12', '#ffffff', 3.2) },
  { id: 'moon', name: 'Moon', bg: ['#3f4f9a', '#c99bff', '#2d2a3a'], draw: () => P('M6 -18 A18 18 0 1 0 18 8 A13 13 0 1 1 6 -18Z', '#ffe680') + C(-3, 4, 1.6, '#2d2a3a') + S('M-8 9 Q-5 12 -2 9', '#2d2a3a', 1.4) + P(star(14, -12, 4), '#fff') + P(star(-14, -14, 3), '#fff') },
  { id: 'sun', name: 'Sunny', bg: ['#9fd6ff', '#fff3b0', '#ffab5e'], season: 'summer', draw: () => Array.from({ length: 10 }, (_, i) => `<rect x="-2" y="-20" width="4" height="8" rx="2" fill="#ffb83a" transform="rotate(${i * 36})"/>`).join('') + C(0, 0, 11, '#ffd84a') + eyes(4, -1, 1.5) + smile(3, 3) + cheeks(7, 3) },
  { id: 'smiley', name: 'Smiley', bg: ['#ffe680', '#ffb3c7', '#ffffff'], draw: () => C(0, 0, 18, '#ffd84a', 'stroke="#f0b232" stroke-width="1.5"') + E(-6, -4, 2.2, 3.4, '#2d2a3a') + E(6, -4, 2.2, 3.4, '#2d2a3a') + S('M-9 4 Q0 13 9 4', '#2d2a3a', 2.4) + cheeks(11, 3) },
  { id: 'icecream', name: 'Ice Cream', bg: ['#a8e6cf', '#ffb3c7', '#9fd6ff'], season: 'summer', draw: () => P('M-10 0 L10 0 L0 20Z', '#e8b46a') + S('M-6 4 L3 14 M4 2 L-2 10', '#c98a3e', 1.2) + C(-6, -6, 8, '#ffb3c7') + C(6, -6, 8, '#fff3d8') + C(0, -14, 8, '#a86b4a') + C(0, -22, 3, '#e8384f') },
  { id: 'cupcake', name: 'Cupcake', bg: ['#ffb3c7', '#ffffff', '#a8e6cf'], draw: () => P('M-13 2 L13 2 L9 18 L-9 18Z', '#7cc8ff') + S('M-6 4 L-5 17 M0 4 L0 17 M6 4 L5 17', '#5ab0ef', 1.2) + C(-8, -2, 7, '#fff3f8') + C(8, -2, 7, '#fff3f8') + C(0, -8, 9, '#fff3f8') + C(0, -17, 3.5, '#e8384f') + `<rect x="-6" y="-6" width="3" height="1.4" fill="#ff7eb6"/><rect x="3" y="-10" width="3" height="1.4" fill="#ffd36b"/>` },
  { id: 'paw', name: 'Paw', bg: ['#ffb3c7', '#9fd6ff', '#9aa3b5'], draw: () => E(0, 6, 9, 8, '#ffffff') + C(-10, -6, 4, '#ffffff') + C(-4, -12, 4, '#ffffff') + C(4, -12, 4, '#ffffff') + C(10, -6, 4, '#ffffff') },
  { id: 'bolt', name: 'Lightning', bg: ['#9b6bff', '#3f4f9a', '#ff7eb6'], draw: () => P('M4 -20 L-10 2 L0 2 L-4 20 L12 -4 L2 -4Z', '#ffe06b', 'stroke="#f0b232" stroke-width="1.5" stroke-linejoin="round"') },
  { id: 'cloud', name: 'Cloud', bg: ['#9fd6ff', '#e6d4ff', '#ffb3c7'], draw: () => C(-8, 2, 9, '#fff') + C(4, -4, 11, '#fff') + C(13, 4, 7, '#fff') + `<rect x="-17" y="2" width="36" height="10" rx="5" fill="#fff"/>` + eyes(4, 2, 1.5).replace(/cx="-4"/g, 'cx="-2"').replace(/cx="4"/g, 'cx="8"') + S('M1 6 Q3 8 5 6', '#2d2a3a', 1.2) },
  { id: 'apple', name: 'Apple', bg: ['#ffffff', '#a8e6cf', '#fff3d6'], season: 'fall', draw: () => C(-6, 3, 13, '#e8384f') + C(6, 3, 13, '#e8384f') + C(-8, -2, 3.5, '#fff', 'opacity="0.5"') + S('M0 -9 L2 -18', '#8a5a3c', 2.4) + E(8, -15, 6, 3, '#5fae6b', 'transform="rotate(-20 8 -15)"') },
  { id: 'fish', name: 'Fishy', bg: ['#9fd6ff', '#a8e6cf', '#ffffff'], season: 'summer', draw: () => E(-2, 0, 14, 10, '#ffab5e') + P('M10 0 L20 -9 L20 9Z', '#ff8a3d') + P('M-6 -10 Q0 -16 6 -9Z', '#ff8a3d') + C(-9, -2, 2.2, '#2d2a3a') + S('M-2 -6 Q1 0 -2 6 M4 -6 Q7 0 4 6', '#fff', 1.4) + C(-22, -8, 2, '#bfe8ff') + C(-18, -14, 1.5, '#bfe8ff') },
  { id: 'snowflake', name: 'Snowflake', bg: ['#9fd6ff', '#3f4f9a', '#c99bff'], season: 'winter', draw: () => Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60})">${S('M0 0 L0 -18 M0 -10 L-5 -15 M0 -10 L5 -15', '#ffffff', 2.4)}</g>`).join('') + C(0, 0, 3, '#ffffff') },
  { id: 'leaf', name: 'Autumn Leaf', bg: ['#ffab5e', '#fff3d6', '#8a5a3c'], season: 'fall', draw: () => P('M-16 16 C-20 -6 -2 -18 18 -18 C18 4 4 18 -16 16Z', '#e8573d') + S('M-14 14 Q2 2 12 -12 M-4 4 L-6 -6 M2 -2 L8 -2', '#a83a24', 1.6) },
  { id: 'pumpkin', name: 'Pumpkin', bg: ['#ffab5e', '#2d2a3a', '#9b6bff'], season: 'fall', draw: () => E(-8, 4, 9, 13, '#ff8a3d') + E(8, 4, 9, 13, '#ff8a3d') + E(0, 4, 10, 14, '#ffab3d') + `<rect x="-2" y="-14" width="4" height="6" rx="1.5" fill="#5f8f3a"/>` + P('M-8 0 L-4 -4 L-2 1Z M8 0 L4 -4 L2 1Z', '#7a3a10') + S('M-7 8 Q0 13 7 8', '#7a3a10', 2) },
  { id: 'ghost', name: 'Friendly Ghost', bg: ['#9b6bff', '#2d2a3a', '#ffab5e'], season: 'fall', draw: () => P('M-14 18 L-14 -2 A14 14 0 0 1 14 -2 L14 18 L9 13 L4 18 L0 13 L-4 18 L-9 13Z', '#ffffff') + E(-5, -1, 2.2, 3, '#2d2a3a') + E(5, -1, 2.2, 3, '#2d2a3a') + E(0, 7, 2.5, 3, '#2d2a3a') + cheeks(9, 4) },
  { id: 'candy', name: 'Candy', bg: ['#ffb3c7', '#a8e6cf', '#ffffff'], draw: () => P('M-10 0 L-20 -8 L-20 8Z M10 0 L20 -8 L20 8Z', '#ff9ec7') + C(0, 0, 11, '#ff4f8b') + S('M-6 -8 Q0 0 -6 8 M2 -10 Q8 0 2 10', '#fff', 2) },
  { id: 'ribbon', name: 'Bow', bg: ['#ffb3c7', '#ffffff', '#e8384f'], draw: () => P('M0 0 C-6 -12 -20 -14 -20 -2 C-20 10 -6 8 0 0Z M0 0 C6 -12 20 -14 20 -2 C20 10 6 8 0 0Z', '#ff4f8b') + P('M-2 2 L-8 18 L-3 16 L0 20Z M2 2 L8 18 L3 16 L0 20Z', '#e0245e') + E(0, 0, 4.5, 5.5, '#e0245e') + C(-12, -4, 2, '#fff', 'opacity="0.6"') },
  { id: 'gem', name: 'Gem', bg: ['#ffb3c7', '#9b6bff', '#2d2a3a'], draw: () => P('M-16 -6 L-8 -16 L8 -16 L16 -6 L0 18Z', '#7cc8ff') + P('M-16 -6 L16 -6 L0 18Z', '#4f9dff') + P('M-8 -16 L-4 -6 L4 -6 L8 -16Z', '#bfe8ff') + P('M-4 -6 L0 18 L4 -6Z', '#9fd6ff') },
  { id: 'planet', name: 'Planet', bg: ['#3f4f9a', '#9b6bff', '#9fd6ff'], draw: () => C(0, 0, 12, '#c99bff') + E(0, 0, 21, 6, 'none', 'stroke="#ffd24a" stroke-width="3" transform="rotate(-18)"') + P('M-10 -4 Q0 -8 10 -4', 'none', 'stroke="#b583ff" stroke-width="2"') + C(-4, -5, 3, '#fff', 'opacity="0.4"') + P(star(-16, -14, 3), '#fff') },
  { id: 'donut', name: 'Donut', bg: ['#ffb3c7', '#a8e6cf', '#ffffff'], draw: () => C(0, 0, 18, '#e8b46a') + P('M-16 -4 Q-14 -16 0 -16 Q14 -16 16 -4 Q12 4 8 0 Q4 6 0 2 Q-4 6 -8 0 Q-12 4 -16 -4Z', '#ff7eb6') + C(0, 0, 6, '#d9a066') + `<rect x="-10" y="-10" width="4" height="1.6" fill="#fff" transform="rotate(30 -8 -9)"/><rect x="6" y="-12" width="4" height="1.6" fill="#7cc8ff"/><rect x="9" y="-5" width="4" height="1.6" fill="#ffd36b" transform="rotate(-40 11 -4)"/>` },
  { id: 'panda', name: 'Panda', bg: ['#ffb3c7', '#a8e6cf', '#9fd6ff'], draw: () => C(-12, -11, 6, '#2d2a3a') + C(12, -11, 6, '#2d2a3a') + C(0, 2, 16, '#ffffff', 'stroke="#e6e0ee" stroke-width="1"') + E(-6, 0, 4.5, 5.5, '#2d2a3a', 'transform="rotate(-20 -6 0)"') + E(6, 0, 4.5, 5.5, '#2d2a3a', 'transform="rotate(20 6 0)"') + C(-6, -1, 1.5, '#fff') + C(6, -1, 1.5, '#fff') + E(0, 7, 2.4, 1.8, '#2d2a3a') + cheeks(11, 8) },
  { id: 'lemon', name: 'Lemon', bg: ['#a8e6cf', '#ffffff', '#9fd6ff'], season: 'summer', draw: () => E(0, 2, 18, 13, '#ffe06b', 'transform="rotate(-20 0 2)"') + P('M14 -8 L20 -14', 'none', 'stroke="#ffe06b" stroke-width="5" stroke-linecap="round"') + E(10, -14, 6, 3, '#5fae6b', 'transform="rotate(-30 10 -14)"') + eyes(5, 1, 1.6) + smile(5, 2.5) },
  { id: 'watermelon', name: 'Watermelon', bg: ['#a8e6cf', '#ffb3c7', '#ffffff'], season: 'summer', draw: () => P('M-20 -6 A20 20 0 0 0 20 -6Z', '#5fae6b') + P('M-17 -6 A17 17 0 0 0 17 -6Z', '#ffffff') + P('M-15 -6 A15 15 0 0 0 15 -6Z', '#ff5c7a') + [[-7, -1], [0, 3], [7, -1], [-3, 6], [4, 6]].map(([x, y]) => E(x, y, 1.3, 2, '#2d2a3a')).join('') },
  { id: 'dino', name: 'Dino', bg: ['#a8e6cf', '#9fd6ff', '#fff3b0'], draw: () => P('M-18 16 Q-20 0 -8 -4 L-6 -14 Q4 -22 12 -14 Q16 -8 10 -4 Q16 4 12 16Z', '#6fc47c') + [[-10, -8], [-4, -14], [4, -18]].map(([x, y]) => P(`M${x} ${y} l3 -6 l3 6Z`, '#ffab5e')).join('') + C(6, -12, 2, '#2d2a3a') + S('M6 -6 Q9 -4 12 -6', '#2d2a3a', 1.2) + E(-2, 8, 6, 5, '#b6e79a') },
  { id: 'avocado', name: 'Avocado', bg: ['#a8e6cf', '#fff3d6', '#ffb3c7'], draw: () => P('M0 -20 C10 -20 14 -4 16 6 C18 18 -18 18 -16 6 C-14 -4 -10 -20 0 -20Z', '#5f8f3a') + P('M0 -16 C8 -16 11 -4 12 5 C13 14 -13 14 -12 5 C-11 -4 -8 -16 0 -16Z', '#d9eb8a') + C(0, 6, 6, '#a86b4a') + eyes(5, -4, 1.5) + smile(-1, 2) },
  { id: 'sunflower', name: 'Sunflower', bg: ['#9fd6ff', '#fff3b0', '#a8e6cf'], season: 'summer', draw: () => petals(12, 13, 6, '#ffd24a') + C(0, 0, 9, '#8a5a3c') + [[-3, -3], [3, -3], [0, 2], [-4, 3], [4, 3]].map(([x, y]) => C(x, y, 1.1, '#5a3a24')).join('') },
  { id: 'tulip', name: 'Tulip', bg: ['#a8e6cf', '#ffffff', '#9fd6ff'], season: 'spring', draw: () => S('M0 4 L0 20', '#5fae6b', 3) + E(-6, 14, 6, 3, '#6fc47c', 'transform="rotate(-30 -6 14)"') + P('M-11 -12 L-6 -4 L0 -14 L6 -4 L11 -12 L11 0 Q0 12 -11 0Z', '#ff4f7b') },
  { id: 'xo', name: 'XOXO', bg: ['#ffffff', '#ffb3c7', '#2d2a3a'], draw: () => `<text x="0" y="7" font-family="Fredoka, sans-serif" font-weight="700" font-size="17" text-anchor="middle" fill="#ff4f7b" stroke="#fff" stroke-width="3" paint-order="stroke">XOXO</text>` },
  { id: 'cute', name: 'CUTE', bg: ['#ffffff', '#e6d4ff', '#9fd6ff'], draw: () => `<text x="0" y="7" font-family="Fredoka, sans-serif" font-weight="700" font-size="17" text-anchor="middle" fill="#9b6bff" stroke="#fff" stroke-width="3" paint-order="stroke">CUTE</text>` + P(star(17, -10, 4), '#ffd24a') },
  { id: 'hi', name: 'Hello', bg: ['#ffe680', '#a8e6cf', '#ffffff'], draw: () => `<text x="0" y="8" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#ff7eb6" stroke="#fff" stroke-width="3.5" paint-order="stroke">hi!</text>` },
  { id: 'rocket', name: 'Rocket', bg: ['#3f4f9a', '#9fd6ff', '#ffffff'], draw: () => P('M0 -20 C8 -12 9 4 6 12 L-6 12 C-9 4 -8 -12 0 -20Z', '#f4f4f8', 'stroke="#c9cfdd" stroke-width="1"') + C(0, -4, 4, '#7cc8ff', 'stroke="#4f9dff" stroke-width="1.5"') + P('M-6 4 L-13 14 L-6 12Z M6 4 L13 14 L6 12Z', '#e8384f') + P('M-4 12 Q0 22 4 12Z', '#ffb83a') + P(star(-15, -12, 3), '#ffe680') + P(star(14, -6, 2.5), '#ffe680') },
  { id: 'soccer', name: 'Soccer', bg: ['#6fc47c', '#4f9dff', '#ffffff'], draw: () => C(0, 0, 17, '#ffffff', 'stroke="#2d2a3a" stroke-width="1.6"') + P('M0 -7 L7 -2 L4 6 L-4 6 L-7 -2Z', '#2d2a3a') + S('M0 -7 L0 -16 M7 -2 L15 -6 M4 6 L9 13 M-4 6 L-9 13 M-7 -2 L-15 -6', '#2d2a3a', 1.6) },
  { id: 'racecar', name: 'Race Car', bg: ['#9fd6ff', '#ffe680', '#ffffff'], draw: () => P('M-20 6 L-18 -2 L-8 -4 L-2 -11 L10 -11 L14 -4 L20 -2 L20 6Z', '#e8384f') + P('M-1 -9 L8 -9 L11 -4 L-5 -4Z', '#d9efff') + C(-11, 7, 5, '#2d2a3a') + C(11, 7, 5, '#2d2a3a') + C(-11, 7, 2, '#c9cfdd') + C(11, 7, 2, '#c9cfdd') + `<text x="2" y="4" font-family="Fredoka, sans-serif" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">1</text>` },
  { id: 'robot', name: 'Robot', bg: ['#9fd6ff', '#a8e6cf', '#ffe680'], draw: () => S('M0 -18 L0 -12', '#4a4a5e', 2) + C(0, -19, 2.5, '#ff4f6d') + `<rect x="-13" y="-12" width="26" height="20" rx="5" fill="#c9cfdd"/><rect x="-9" y="-8" width="18" height="10" rx="3" fill="#4a4a5e"/>` + C(-4, -3, 2.2, '#7fe0b0') + C(4, -3, 2.2, '#7fe0b0') + `<rect x="-9" y="10" width="18" height="9" rx="2" fill="#9aa3b5"/>` + S('M-5 4 L5 4', '#4a4a5e', 1.4) },
  { id: 'shark', name: 'Shark', bg: ['#9fd6ff', '#3f4f9a', '#ffffff'], draw: () => P('M-20 4 Q-6 -12 14 -2 L20 -8 L18 4 L20 12 L14 6 Q-6 16 -20 4Z', '#7a8fb8') + P('M-4 -8 L2 -18 L4 -6Z', '#7a8fb8') + P('M-18 5 Q-4 12 12 5 Q-4 8 -18 5Z', '#ffffff') + C(-10, 0, 1.8, '#2d2a3a') + S('M-14 6 L-12 8 L-10 6 L-8 8', '#fff', 1) },
  { id: 'gamepad', name: 'Game', bg: ['#9b6bff', '#2d2a3a', '#9fd6ff'], draw: () => P('M-18 -6 Q-18 -12 -11 -12 L11 -12 Q18 -12 18 -6 L20 8 Q20 14 14 12 L8 6 L-8 6 L-14 12 Q-20 14 -20 8Z', '#4a4a5e') + `<rect x="-14" y="-5" width="8" height="3" fill="#fff"/><rect x="-11.5" y="-7.5" width="3" height="8" fill="#fff"/>` + C(9, -5, 2.4, '#ff4f6d') + C(13, -1, 2.4, '#7fe0b0') + C(5, -1, 2.4, '#7cc8ff') + C(9, 3, 2.4, '#ffd36b') },
];

export const MOTIF_BY_ID: Record<string, Motif> = Object.fromEntries(MOTIFS.map((m) => [m.id, m]));

/** Draws a motif centred at (x, y) with radius r. */
export function motif(id: string, x: number, y: number, r: number): string {
  const m = MOTIF_BY_ID[id];
  if (!m) return '';
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(r / 20).toFixed(3)})">${m.draw()}</g>`;
}

/** The same motif sprinkled over an area as a print (used on skirts, dresses and bags). */
export function scatter(id: string, x0: number, y0: number, w: number, h: number, r: number, clip?: string): string {
  let s = '';
  const cols = Math.max(1, Math.round(w / (r * 3.2)));
  const rows = Math.max(1, Math.round(h / (r * 3.2)));
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = x0 + ((i + (j % 2 ? 0.75 : 0.25)) / cols) * w;
    const y = y0 + ((j + 0.5) / rows) * h;
    s += motif(id, x, y, r);
  }
  return clip ? `<g clip-path="url(#${clip})">${s}</g>` : s;
}

/** A friendly color name for item labels, e.g. "Mint". */
export function colorName(c: string): string {
  const names: [string, string][] = [
    ['#ffffff', 'White'], ['#f4ead9', 'Cream'], ['#fff3d6', 'Vanilla'], ['#ffb3c7', 'Pink'], ['#ff7eb6', 'Bubblegum'], ['#ff4f8b', 'Hot Pink'], ['#e0457b', 'Raspberry'],
    ['#e8384f', 'Cherry'], ['#ff7a6b', 'Coral'], ['#ffab5e', 'Peach'], ['#ffd36b', 'Sunny'], ['#ffe680', 'Lemon'], ['#fff3b0', 'Butter'], ['#b6e36b', 'Lime'],
    ['#a8e6cf', 'Mint'], ['#5fd3b5', 'Seafoam'], ['#3fbf8f', 'Jade'], ['#9fd6ff', 'Sky'], ['#7cc8ff', 'Baby Blue'], ['#4f9dff', 'Ocean'], ['#3f4f9a', 'Navy'],
    ['#e6d4ff', 'Lavender'], ['#c99bff', 'Lilac'], ['#9b6bff', 'Grape'], ['#8a5a3c', 'Cocoa'], ['#c9a27e', 'Caramel'], ['#9aa3b5', 'Silver'], ['#4a4a5e', 'Charcoal'], ['#2d2a3a', 'Midnight'],
  ];
  let best = names[0][1];
  let bd = Infinity;
  const h = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [r, g, b] = h(c);
  for (const [hex, n] of names) {
    const [r2, g2, b2] = h(hex);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  return best;
}

/** A matching second color for trims: lighter on dark clothes, deeper on light ones. */
export const accentFor = (c: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return (r * 0.3 + g * 0.59 + b * 0.11) / 255 > 0.6 ? dark(c, 0.35) : light(c, 0.55);
};
