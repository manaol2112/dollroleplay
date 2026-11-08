// Neck accessories: pendants, pearls, lockets, beads, chokers, collars, ties, scarves, bandanas,
// boas, medals, leis and fun gear. Each style comes in a few versions with their own colors and
// details, listed in its own closet section. Everything is drawn around the top of the shoulders
// (0, b.shY), in front of the arms and behind the head.
import { dark, light } from '../color';
import { cloth, type Pattern } from '../defs';
import { motif } from '../motifs';
import type { Season } from '../../types';
import { type WearCtx, type WearDef, P, bowG, circ, f, flowerG, heartD, line, sparkleD, starD } from './base';

interface V {
  k: string;
  n: string;
  c: string;
  /** Second color baked into the design. */
  a?: string;
  /** Style option: metal, charm, print... */
  o?: string;
  t?: Season[];
  p?: Pattern;
  fixed?: boolean;
}
interface Style {
  group: string;
  key: string;
  vs: V[];
  draw: (x: WearCtx, v: V) => string;
  tags?: Season[];
  premium?: number;
}

// ---------- helpers ----------
interface Metal { fill: string; base: string; dk: string; hi: string }
const GOLD: Metal = { fill: 'url(#g-gold)', base: '#f2c14e', dk: '#c98a1e', hi: '#fff3b0' };
const SILVER: Metal = { fill: 'url(#g-silver)', base: '#d4d7e2', dk: '#9a9eb2', hi: '#ffffff' };
const ROSE: Metal = { fill: '#f4bfae', base: '#efb09e', dk: '#c47f6c', hi: '#ffe6dc' };
const BRONZE: Metal = { fill: '#e3a26c', base: '#d9925a', dk: '#a8632e', hi: '#ffdcb6' };
const metal = (o?: string) => (o === 'silver' ? SILVER : o === 'rose' ? ROSE : o === 'bronze' ? BRONZE : GOLD);
const edge = (c: string, w = 1) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
const stroke = (d: string, c: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shine = (x: number, y: number, r: number, op = 0.75) => circ(x, y, r, '#fff', `opacity="${op}"`);
/** A shiny round bead or pearl. */
const ball = (x: number, y: number, r: number, c: string) => circ(x, y, r, c) + circ(x, y, r, 'url(#g-face)') + shine(x - r * 0.35, y - r * 0.38, r * 0.3, 0.8);
const sparkle = (x: number, y: number, r: number, c = '#fff') => P(sparkleD(x, y, r), c);
/** A twinkling sparkle (gentle SMIL pulse). */
const twinkle = (x: number, y: number, r: number, delay = 0, c = '#fff') =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.25;1" dur="1.8s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></path>`;
const arcD = (rx: number, ry: number, y0: number) => `M${f(-rx)} ${f(y0)} A${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} ${f(y0)}`;
/** Points along the front of a necklace (an ellipse arc hanging from y0), with the tangent angle in degrees. */
const along = (n: number, rx: number, ry: number, y0: number, a0 = 0.1, a1 = 0.9) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.PI * (a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1)));
    return { x: Math.cos(a) * rx, y: y0 + Math.sin(a) * ry, r: (Math.atan2(-Math.cos(a) * ry, Math.sin(a) * rx) * 180) / Math.PI, i };
  });
const chain = (rx: number, ry: number, y0: number, m: Metal, w = 1.6) => {
  const d = arcD(rx, ry, y0);
  return stroke(d, m.dk, w + 0.9) + stroke(d, m.base, w) + stroke(d, m.hi, w * 0.5, 'stroke-dasharray="1.4 2.4"');
};
const cord = (rx: number, ry: number, y0: number, c: string, w = 2.4) => {
  const d = arcD(rx, ry, y0);
  return stroke(d, dark(c, 0.25), w + 0.8) + stroke(d, c, w) + stroke(d, light(c, 0.4), w * 0.35, 'opacity="0.7"');
};
/** A V-shaped strap from both shoulders down to (0, yb). */
const lanyard = (y: number, yb: number, c: string, w = 3) => {
  const d = `M-15 ${f(y)} Q-12 ${f((y + yb) / 2 + 4)} -2 ${f(yb)} M15 ${f(y)} Q12 ${f((y + yb) / 2 + 4)} 2 ${f(yb)}`;
  return stroke(d, dark(c, 0.25), w + 1) + stroke(d, c, w) + stroke(d, light(c, 0.45), w * 0.3, 'opacity="0.8"');
};
const RAINBOW = ['#ff6f91', '#ffab5e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'];
const tx = (x: number, y: number, s: string) => `transform="translate(${f(x)} ${f(y)}) ${s}"`;

// ---------- charms ----------
function charm(kind: string, cx: number, cy: number, s: number, c: string, m: Metal): string {
  const e = edge(m.dk, 1.1);
  switch (kind) {
    case 'heart':
      return P(heartD(cx, cy - s * 0.62, s * 1.2), c, e) + P(heartD(cx - s * 0.32, cy - s * 0.38, s * 0.32), '#fff', 'opacity="0.6"');
    case 'star':
      return P(starD(cx, cy, s * 1.15, 0.5), c, e) + shine(cx - s * 0.25, cy - s * 0.25, s * 0.16);
    case 'moon': {
      const k = s / 17;
      return P(`M${f(cx + 6 * k)} ${f(cy - 18 * k)} A${f(18 * k)} ${f(18 * k)} 0 1 0 ${f(cx + 18 * k)} ${f(cy + 8 * k)} A${f(13 * k)} ${f(13 * k)} 0 1 1 ${f(cx + 6 * k)} ${f(cy - 18 * k)}Z`, c, e) +
        sparkle(cx + s * 0.75, cy - s * 0.55, s * 0.32, m.hi);
    }
    case 'gem':
      return P(`M${f(cx)} ${f(cy - s)} L${f(cx + s * 0.75)} ${f(cy - s * 0.2)} L${f(cx)} ${f(cy + s)} L${f(cx - s * 0.75)} ${f(cy - s * 0.2)}Z`, c, edge(m.dk, 1.3)) +
        P(`M${f(cx)} ${f(cy - s)} L${f(cx + s * 0.75)} ${f(cy - s * 0.2)} L${f(cx)} ${f(cy)} L${f(cx - s * 0.75)} ${f(cy - s * 0.2)}Z`, light(c, 0.35)) +
        P(`M${f(cx + s * 0.75)} ${f(cy - s * 0.2)} L${f(cx)} ${f(cy + s)} L${f(cx)} ${f(cy)}Z`, dark(c, 0.15)) + sparkle(cx - s * 0.3, cy - s * 0.35, s * 0.3);
    case 'flower':
      return flowerG(cx, cy, s * 1.05, c);
    case 'butterfly':
      return `<ellipse cx="${f(cx - s * 0.5)}" cy="${f(cy - s * 0.3)}" rx="${f(s * 0.55)}" ry="${f(s * 0.45)}" fill="${c}" ${e}/>` +
        `<ellipse cx="${f(cx + s * 0.5)}" cy="${f(cy - s * 0.3)}" rx="${f(s * 0.55)}" ry="${f(s * 0.45)}" fill="${c}" ${e}/>` +
        `<ellipse cx="${f(cx - s * 0.38)}" cy="${f(cy + s * 0.42)}" rx="${f(s * 0.38)}" ry="${f(s * 0.32)}" fill="${light(c, 0.3)}" ${e}/>` +
        `<ellipse cx="${f(cx + s * 0.38)}" cy="${f(cy + s * 0.42)}" rx="${f(s * 0.38)}" ry="${f(s * 0.32)}" fill="${light(c, 0.3)}" ${e}/>` +
        `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(s * 0.14)}" ry="${f(s * 0.7)}" fill="${m.dk}"/>` + shine(cx - s * 0.55, cy - s * 0.4, s * 0.15);
    case 'rainbow': {
      let r = '';
      ['#ff6f91', '#ffd36b', '#7cc8ff'].forEach((col, i) => {
        const rr = s * (1 - i * 0.26);
        r += stroke(`M${f(cx - rr)} ${f(cy + s * 0.35)} A${f(rr)} ${f(rr)} 0 0 1 ${f(cx + rr)} ${f(cy + s * 0.35)}`, col, s * 0.26);
      });
      return r + circ(cx - s * 0.85, cy + s * 0.45, s * 0.3, '#fff') + circ(cx + s * 0.85, cy + s * 0.45, s * 0.3, '#fff');
    }
    case 'crown':
      return P(`M${f(cx - s)} ${f(cy + s * 0.6)} L${f(cx - s * 1.05)} ${f(cy - s * 0.6)} L${f(cx - s * 0.5)} ${f(cy - s * 0.05)} L${f(cx)} ${f(cy - s * 0.85)} L${f(cx + s * 0.5)} ${f(cy - s * 0.05)} L${f(cx + s * 1.05)} ${f(cy - s * 0.6)} L${f(cx + s)} ${f(cy + s * 0.6)}Z`, m.fill, e) +
        circ(cx, cy + s * 0.2, s * 0.25, c) + shine(cx - s * 0.08, cy + s * 0.12, s * 0.08);
    case 'cherry':
      return stroke(`M${f(cx - s * 0.45)} ${f(cy + s * 0.2)} Q${f(cx - s * 0.3)} ${f(cy - s * 0.4)} ${f(cx + s * 0.1)} ${f(cy - s)} M${f(cx + s * 0.45)} ${f(cy + s * 0.25)} Q${f(cx + s * 0.4)} ${f(cy - s * 0.4)} ${f(cx + s * 0.1)} ${f(cy - s)}`, '#5f8f3a', 1.3) +
        `<ellipse cx="${f(cx + s * 0.4)}" cy="${f(cy - s * 0.9)}" rx="${f(s * 0.35)}" ry="${f(s * 0.16)}" fill="#6fc47c" transform="rotate(-20 ${f(cx + s * 0.4)} ${f(cy - s * 0.9)})"/>` +
        ball(cx - s * 0.45, cy + s * 0.45, s * 0.45, c) + ball(cx + s * 0.45, cy + s * 0.5, s * 0.45, c);
    case 'shell': {
      let r = P(`M${f(cx)} ${f(cy + s * 0.85)} L${f(cx - s)} ${f(cy - s * 0.05)} Q${f(cx - s * 0.9)} ${f(cy - s)} ${f(cx)} ${f(cy - s)} Q${f(cx + s * 0.9)} ${f(cy - s)} ${f(cx + s)} ${f(cy - s * 0.05)}Z`, c, e);
      for (let i = -2; i <= 2; i++) r += line(cx, cy + s * 0.8, cx + i * s * 0.38, cy - s * 0.75 + Math.abs(i) * s * 0.18, dark(c, 0.18), 0.9);
      return r + `<ellipse cx="${f(cx)}" cy="${f(cy + s * 0.78)}" rx="${f(s * 0.3)}" ry="${f(s * 0.16)}" fill="${dark(c, 0.1)}"/>` + ball(cx, cy + s * 0.2, s * 0.2, '#fffaf2');
    }
    case 'clover': {
      let r = stroke(`M${f(cx)} ${f(cy)} Q${f(cx + s * 0.2)} ${f(cy + s * 0.7)} ${f(cx + s * 0.5)} ${f(cy + s * 1.0)}`, dark(c, 0.2), 1.4);
      for (let i = 0; i < 4; i++) r += P(heartD(0, -s * 0.78, s * 0.78), c, `transform="translate(${f(cx)} ${f(cy)}) rotate(${i * 90 + 45})" ${edge(dark(c, 0.25), 0.7)}`);
      return r + circ(cx, cy, s * 0.14, light(c, 0.4)) + shine(cx - s * 0.4, cy - s * 0.45, s * 0.12);
    }
    case 'snowflake': {
      let r = '';
      for (let i = 0; i < 3; i++) r += `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${i * 60})">${[m.dk, c].map((col, j) => stroke(`M0 ${f(-s)} L0 ${f(s)} M${f(-s * 0.3)} ${f(-s * 0.75)} L0 ${f(-s * 0.5)} L${f(s * 0.3)} ${f(-s * 0.75)} M${f(-s * 0.3)} ${f(s * 0.75)} L0 ${f(s * 0.5)} L${f(s * 0.3)} ${f(s * 0.75)}`, col, s * (j ? 0.2 : 0.34))).join('')}</g>`;
      return r + circ(cx, cy, s * 0.22, '#fff');
    }
    case 'note':
      return stroke(`M${f(cx + s * 0.2)} ${f(cy + s * 0.55)} L${f(cx + s * 0.2)} ${f(cy - s * 0.9)} Q${f(cx + s * 0.6)} ${f(cy - s * 0.5)} ${f(cx + s * 0.8)} ${f(cy - s * 0.2)}`, c, s * 0.22) +
        `<ellipse cx="${f(cx - s * 0.18)}" cy="${f(cy + s * 0.6)}" rx="${f(s * 0.42)}" ry="${f(s * 0.32)}" fill="${c}" transform="rotate(-20 ${f(cx - s * 0.18)} ${f(cy + s * 0.6)})"/>`;
    default:
      return circ(cx, cy, s * 0.8, c, e);
  }
}
const bail = (cx: number, cy: number, m: Metal) => circ(cx, cy, 1.9, 'none', edge(m.dk, 1.3));

// ---------- pendants ----------
const pendant = (x: WearCtx, v: V) => {
  const y = x.b.shY;
  const m = metal(v.a);
  const s = 9;
  const by = y + 15;
  return chain(17, 16, y - 1, m) + bail(0, by + 1.5, m) + charm(v.o ?? 'heart', 0, by + 3.5 + s, s, x.c, m);
};

// ---------- pearls ----------
function pearls(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const kind = v.o ?? 'long';
  const col = (i: number) => (kind === 'rainbow' ? RAINBOW[i % RAINBOW.length] : x.c);
  const strand = (n: number, rx: number, ry: number, r: number, y0 = y - 1, a0 = 0.08, a1 = 0.92) =>
    stroke(arcD(rx, ry, y0), '#d8cfc4', 0.8) + along(n, rx, ry, y0, a0, a1).map((p) => ball(p.x, p.y, r, col(p.i))).join('');
  switch (kind) {
    case 'double':
      return strand(15, 23, 27, 3.2) + strand(12, 18, 16, 3.1);
    case 'bow':
      return strand(13, 20, 20, 3.3) + `<g ${tx(0, y + 20, 'scale(0.42)')}>${bowG(0, 0, 1, v.a ?? '#ff7eb6')}</g>`;
    case 'drop': {
      const m = metal('gold');
      return strand(13, 19, 17, 3.2) + P(`M-2.5 ${f(y + 18)} L2.5 ${f(y + 18)} L2 ${f(y + 21)} L-2 ${f(y + 21)}Z`, m.fill, edge(m.dk, 0.8)) +
        `<ellipse cx="0" cy="${f(y + 26.5)}" rx="4.4" ry="5.8" fill="${x.c}"/><ellipse cx="0" cy="${f(y + 26.5)}" rx="4.4" ry="5.8" fill="url(#g-face)"/>` + shine(-1.5, y + 24.5, 1.4);
    }
    case 'big':
      return strand(9, 20, 19, 4.7);
    case 'gold': {
      let s = stroke(arcD(21, 24, y - 1), '#d8b46a', 0.8);
      for (const p of along(19, 21, 24, y - 1, 0.08, 0.92)) s += p.i % 2 ? ball(p.x, p.y, 1.8, '#f2c14e') : ball(p.x, p.y, 3.3, x.c);
      return s;
    }
    case 'opera': {
      return strand(17, 24, 36, 3.2) + `<g ${tx(0, y + 34, '')}>${charm('heart', 0, 6, 5, v.a ?? '#ff4f8b', GOLD)}</g>`;
    }
    default:
      return strand(17, 22, 30, 3.3);
  }
}

// ---------- lockets ----------
function locketShape(kind: string, cx: number, cy: number, s: number, fill: string, extra = ''): string {
  switch (kind) {
    case 'heart':
      return P(heartD(cx, cy - s * 0.62, s * 1.28), fill, extra);
    case 'oval':
      return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(s * 0.78)}" ry="${f(s)}" fill="${fill}" ${extra}/>`;
    case 'star':
      return P(starD(cx, cy, s * 1.2, 0.55), fill, extra + ' stroke-linejoin="round"');
    default:
      return circ(cx, cy, s * 0.92, fill, extra);
  }
}
const locket = (x: WearCtx, v: V) => {
  const y = x.b.shY;
  const m = metal(v.a);
  const kind = v.o ?? 'heart';
  const s = 10;
  const cy = y + 19 + s;
  const deco = kind === 'oval' ? flowerG(0, cy, s * 0.42, light(x.c, 0.5), m.base) : kind === 'star' ? P(heartD(0, cy - 3, 5), m.hi, 'opacity="0.9"') : P(starD(0, cy + (kind === 'heart' ? 1 : 0), s * 0.32), m.hi);
  return chain(17, 18, y - 1, m) + bail(0, y + 18, m) +
    locketShape(kind, 0, cy, s, m.fill, edge(m.dk, 1.3)) + locketShape(kind, 0, cy + 0.3, s * 0.68, x.c) +
    locketShape(kind, 0, cy + 0.3, s * 0.68, 'url(#g-face)') + deco + sparkle(-s * 0.55, cy - s * 0.55, 2.6) +
    `<rect x="-2" y="${f(y + 19.5)}" width="4" height="2.4" rx="1" fill="${m.dk}"/>`;
};

// ---------- beads ----------
function beads(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const kind = v.o ?? 'rainbow';
  const thread = stroke(arcD(21, 24, y - 1), '#e8dff0', 0.9);
  const pts = (n: number) => along(n, 21, 24, y - 1, 0.07, 0.93);
  let s = thread;
  switch (kind) {
    case 'candy':
      for (const p of pts(17)) s += `<g ${tx(p.x, p.y, `rotate(${f(p.r + 90)})`)}><ellipse rx="2.2" ry="4" fill="${['#ffb3c7', '#fff3b0', '#a8e6cf', '#c99bff', '#9fd6ff'][p.i % 5]}"/><ellipse rx="0.9" ry="2" fill="#fff" opacity="0.7"/></g>`;
      return s;
    case 'gumball':
      return s + along(9, 21, 23, y - 1, 0.07, 0.93).map((p) => ball(p.x, p.y, 4.6, ['#ff4f8b', '#ffd36b', '#5fd3b5', '#7cc8ff', '#c99bff', '#ff9a6b'][p.i % 6])).join('');
    case 'letters': {
      const word = v.a ?? 'LOVE';
      const n = 15;
      const mid = Math.floor(n / 2);
      const start = mid - Math.floor(word.length / 2);
      for (const p of pts(n)) {
        const li = n - 1 - p.i - start;
        if (li >= 0 && li < word.length) {
          s += `<g ${tx(p.x, p.y, `rotate(${f(p.r * 0.5)})`)}><rect x="-3.6" y="-3.6" width="7.2" height="7.2" rx="1.6" fill="#fff" stroke="${dark(x.c, 0.2)}" stroke-width="0.8"/>` +
            `<text y="2.4" font-family="Fredoka, sans-serif" font-weight="700" font-size="6.4" text-anchor="middle" fill="${dark(x.c, 0.2)}">${word[li]}</text></g>`;
        } else s += ball(p.x, p.y, 2.6, p.i % 2 ? x.c : light(x.c, 0.45));
      }
      return s;
    }
    case 'fruit':
      for (const p of pts(13)) {
        const k = p.i % 3;
        if (k === 0) s += P(`M${f(p.x - 3.4)} ${f(p.y - 2)} Q${f(p.x)} ${f(p.y - 4)} ${f(p.x + 3.4)} ${f(p.y - 2)} Q${f(p.x + 3)} ${f(p.y + 3)} ${f(p.x)} ${f(p.y + 4)} Q${f(p.x - 3)} ${f(p.y + 3)} ${f(p.x - 3.4)} ${f(p.y - 2)}Z`, '#ff4f6d') + P(`M${f(p.x - 2.6)} ${f(p.y - 2.4)} L${f(p.x)} ${f(p.y - 4.4)} L${f(p.x + 2.6)} ${f(p.y - 2.4)}Z`, '#5fae6b') + circ(p.x - 1, p.y, 0.5, '#ffe680') + circ(p.x + 1.2, p.y + 1.2, 0.5, '#ffe680');
        else if (k === 1) s += ball(p.x, p.y, 3.2, '#ffab3d') + circ(p.x + 0.5, p.y - 3.2, 0.9, '#5fae6b');
        else s += `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="3.8" ry="2.9" fill="#ffe06b" transform="rotate(${f(p.r)} ${f(p.x)} ${f(p.y)})"/>` + shine(p.x - 1.2, p.y - 1, 0.9);
      }
      return s;
    case 'stars':
      for (const p of pts(15)) s += p.i % 2 ? ball(p.x, p.y, 1.7, '#f2c14e') : P(starD(p.x, p.y, 4.2, 0.5), x.c, edge(dark(x.c, 0.2), 0.7)) + shine(p.x - 1, p.y - 1, 0.8);
      return s;
    case 'pasta':
      for (const p of pts(12)) s += `<g ${tx(p.x, p.y, `rotate(${f(p.r)})`)}><rect x="-4.4" y="-2.4" width="8.8" height="4.8" rx="2.4" fill="${RAINBOW[p.i % 6]}"/><line x1="-2" y1="-2" x2="-2" y2="2" stroke="#fff" stroke-width="0.7" opacity="0.6"/><line x1="1.5" y1="-2" x2="1.5" y2="2" stroke="#fff" stroke-width="0.7" opacity="0.6"/></g>`;
      return s;
    case 'hearts':
      for (const p of pts(13)) s += p.i % 2 ? ball(p.x, p.y, 1.8, '#fff') : P(heartD(p.x, p.y - 3, 6), x.c, edge(dark(x.c, 0.2), 0.6)) + shine(p.x - 1.4, p.y - 1.2, 0.8);
      return s;
    case 'daisy':
      for (const p of pts(11)) s += flowerG(p.x, p.y, 4.2, p.i % 2 ? x.c : '#ffffff', '#ffd36b');
      return s;
    default:
      return s + pts(15).map((p) => ball(p.x, p.y, 3.2, RAINBOW[p.i % 6])).join('');
  }
}

// ---------- chokers ----------
const chokerD = (y: number) => `M-17 ${f(y + 2)} Q0 ${f(y + 15)} 17 ${f(y + 2)}`;
const qpt = (y: number, t: number) => ({ x: 17 * (2 * t - 1), y: y + 2 + 26 * t * (1 - t) });
function choker(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const d = chokerD(y);
  const kind = v.o ?? 'heart';
  const band = (w = 5.5) => stroke(d, dark(x.c, 0.2), w + 1) + stroke(d, x.c, w) + `<path d="${d}" fill="none" stroke="${light(x.c, 0.4)}" stroke-width="1.1" opacity="0.7" transform="translate(0 -1.4)"/>`;
  const hang = y + 10.5;
  switch (kind) {
    case 'lace': {
      let s = '';
      for (let i = 0; i <= 8; i++) {
        const p = qpt(y, 0.06 + (0.88 * i) / 8);
        s += circ(p.x, p.y + 3, 2.8, '#ffffff', 'stroke="#e6dcef" stroke-width="0.6"') + circ(p.x, p.y + 3.4, 0.8, '#e6dcef');
      }
      return s + band(4.5) + `<ellipse cx="0" cy="${f(hang + 4)}" rx="4.6" ry="5.6" fill="${GOLD.fill}" ${edge(GOLD.dk, 0.8)}/><ellipse cx="0" cy="${f(hang + 4)}" rx="3.2" ry="4.2" fill="${v.a ?? '#ffd6e3'}"/>` +
        circ(0, hang + 3, 1.4, '#fff', 'opacity="0.9"') + `<ellipse cx="0" cy="${f(hang + 5.6)}" rx="1.8" ry="1.3" fill="#fff" opacity="0.9"/>`;
    }
    case 'bow':
      return band(5) + `<g ${tx(0, hang - 1, 'scale(0.36)')}>${bowG(0, 0, 1, v.a ?? x.c)}</g>`;
    case 'daisy': {
      let s = stroke(d, '#6fc47c', 1.6);
      for (let i = 0; i <= 6; i++) {
        const p = qpt(y, 0.08 + (0.84 * i) / 6);
        s += flowerG(p.x, p.y, 3.8, i % 2 ? x.c : '#fff', '#ffd36b');
      }
      return s;
    }
    case 'rhinestone': {
      let s = stroke(d, SILVER.dk, 4.4) + stroke(d, SILVER.base, 3.4);
      for (let i = 0; i <= 10; i++) {
        const p = qpt(y, 0.05 + (0.9 * i) / 10);
        s += circ(p.x, p.y, 1.7, i % 2 ? '#fff' : x.c) + shine(p.x - 0.5, p.y - 0.5, 0.6, 0.9);
      }
      return s + charm('gem', 0, hang + 5, 5, x.c, SILVER) + twinkle(8, hang + 2, 2.6, 0.4);
    }
    case 'pearl':
      return band() + ball(0, hang + 4, 3.8, '#fffaf2') + circ(0, hang - 0.5, 1.4, GOLD.base);
    default: {
      const m = metal(v.a);
      return band() + bail(0, hang + 0.5, m) + charm(kind, 0, hang + 7.5, 5.5, kind === 'gem' ? '#e8384f' : m.fill, m);
    }
  }
}

// ---------- collars ----------
const flapD = (y: number) => `M-1 ${f(y + 1)} Q-25 ${f(y - 3)} -27 ${f(y + 9)} Q-26 ${f(y + 24)} -2 ${f(y + 17)}Z`;
/** Points along the lower outer edge of the left collar flap. */
const flapEdge = (y: number, n: number) => Array.from({ length: n }, (_, i) => {
  const t = (i + 0.5) / n;
  const u = 1 - t;
  return { x: u * u * -27 + 2 * u * t * -26 + t * t * -2, y: u * u * (y + 9) + 2 * u * t * (y + 24) + t * t * (y + 17), i };
});
function collar(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const kind = v.o ?? 'plain';
  const c = x.c;
  let flap = '';
  if (kind === 'lace' || kind === 'scallop') flap += flapEdge(y, 7).map((p) => circ(p.x, p.y, kind === 'lace' ? 3.4 : 3.8, kind === 'lace' ? '#fff' : c, `stroke="${dark(c, 0.15)}" stroke-width="0.7"`) + (kind === 'lace' ? circ(p.x, p.y + 0.8, 1, '#e6dcef') : '')).join('');
  if (kind === 'pearl') flap += flapEdge(y, 8).map((p) => ball(p.x, p.y, 1.9, '#fffaf2')).join('');
  flap += cloth(flapD(y), c, x.p) + `<path d="${flapD(y)}" fill="none" stroke="${dark(c, 0.18)}" stroke-width="1"/>`;
  flap += stroke(`M-4 ${f(y + 4)} Q-21 ${f(y + 1)} -23 ${f(y + 10)} Q-22 ${f(y + 20)} -4 ${f(y + 14)}`, dark(c, 0.15), 0.8, 'stroke-dasharray="1.6 1.6" opacity="0.7"');
  if (kind === 'cherry') flap += motif('cherry', -15, y + 11, 4.6);
  if (kind === 'daisy') flap += flowerG(-18, y + 10, 3.4, '#fff') + flowerG(-10, y + 14, 2.6, '#fff8c8', '#ff9ec7');
  if (kind === 'heart') flap += P(heartD(-14, y + 7.5, 6), v.a ?? '#ff4f7b');
  let s = flap + `<g transform="scale(-1 1)">${flap}</g>`;
  if (kind === 'bow') s += `<g ${tx(0, y + 14, 'scale(0.34)')}>${bowG(0, 0, 1, v.a ?? '#e8384f')}</g>`;
  else if (kind === 'pearl') s += ball(0, y + 15, 2.6, '#fffaf2');
  else if (kind !== 'plain') s += circ(0, y + 15, 2.4, v.a ?? dark(c, 0.2)) + shine(-0.7, y + 14.3, 0.8);
  return s;
}

// ---------- bow ties ----------
function bowtie(x: WearCtx, v: V): string {
  const Y = x.b.shY + 10;
  const c = x.c;
  const wing = `M-2 ${f(Y)} C-6 ${f(Y - 8)} -15 ${f(Y - 10)} -18 ${f(Y - 6)} C-20 ${f(Y - 2)} -20 ${f(Y + 2)} -18 ${f(Y + 6)} C-15 ${f(Y + 10)} -6 ${f(Y + 8)} -2 ${f(Y)}Z`;
  const cols = v.o === 'rainbow' ? RAINBOW : null;
  let side = cloth(wing, c, x.p) + `<path d="${wing}" fill="none" stroke="${dark(c, 0.22)}" stroke-width="0.9"/>`;
  if (cols) side = P(wing, cols[0]) + [1, 2, 3].map((i) => P(`M${-5 - i * 3.6} ${f(Y - 9 + i * 0.6)} L${-8.6 - i * 3.6} ${f(Y - 8.6 + i * 0.6)} L${-8.6 - i * 3.6} ${f(Y + 8.6 - i * 0.6)} L${-5 - i * 3.6} ${f(Y + 9 - i * 0.6)}Z`, cols[i])).join('') + P(wing, 'url(#g-shadeX)');
  if (v.o === 'glitter') side += [[-8, -3], [-13, 2], [-15, -4], [-10, 4], [-6, -1], [-16, 1]].map(([px, py], i) => circ(px, Y + py, i % 2 ? 0.9 : 1.2, i % 3 ? '#fff' : '#fff3b0')).join('');
  if (v.o === 'velvet') side += stroke(`M-6 ${f(Y - 4)} Q-11 ${f(Y - 7)} -16 ${f(Y - 4)}`, light(c, 0.45), 1.4, 'opacity="0.7"');
  side += stroke(`M-5 ${f(Y - 1.5)} L-12 ${f(Y - 4)} M-5 ${f(Y + 1.5)} L-12 ${f(Y + 4)}`, dark(c, 0.25), 0.9, 'opacity="0.6"');
  let s = side + `<g transform="scale(-1 1)">${side}</g>`;
  s += `<rect x="-4" y="${f(Y - 5)}" width="8" height="10" rx="3" fill="${cols ? '#ffe06b' : dark(c, 0.12)}"/><rect x="-4" y="${f(Y - 5)}" width="8" height="10" rx="3" fill="url(#g-shadeX)"/>` + shine(-1.5, Y - 2.5, 1, 0.5);
  if (v.o === 'glitter') s += twinkle(13, Y - 7, 2.4, 0.2) + twinkle(-12, Y + 6, 2, 1);
  return s;
}

// ---------- neckties ----------
function necktie(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const c = x.c;
  const T = x.b.waistY + 8;
  const thin = v.o === 'skinny';
  const k = thin ? 0.62 : 1;
  const blade = `M${f(-4 * k)} ${f(y + 13)} L${f(4 * k)} ${f(y + 13)} L${f(9 * k)} ${f(T - 7)} L0 ${f(T)} L${f(-9 * k)} ${f(T - 7)}Z`;
  const knot = `M${f(-5.5 * k)} ${f(y + 5)} L${f(5.5 * k)} ${f(y + 5)} L${f(4 * k)} ${f(y + 13.5)} L${f(-4 * k)} ${f(y + 13.5)}Z`;
  const wings = [-1, 1].map((sd) => P(`M${sd * 4} ${f(y + 3)} L${sd * 16} ${f(y + 3)} L${sd * 8} ${f(y + 13)}Z`, '#ffffff', `stroke="#dcd6e6" stroke-width="0.8" stroke-linejoin="round"`)).join('');
  let s = wings + cloth(blade, c, x.p) + `<path d="${blade}" fill="none" stroke="${dark(c, 0.2)}" stroke-width="0.8"/>`;
  const a = v.o === 'motif' ? '#fff' : v.a ?? accentFor2(c);
  if (v.o === 'stripes') for (let i = 0; i < 5; i++) {
    const yy = y + 18 + i * ((T - y - 26) / 4);
    const w = 4 * k + (9 * k - 4 * k) * ((yy - y - 13) / (T - 7 - y - 13));
    s += P(`M${f(-w)} ${f(yy + 2)} L${f(w)} ${f(yy - 3)} L${f(w)} ${f(yy)} L${f(-w)} ${f(yy + 5)}Z`, a);
  }
  if (v.o === 'stars') for (let i = 0; i < 3; i++) s += P(starD(0, y + 22 + i * ((T - y - 32) / 2), 2.8), a);
  if (v.o === 'heart') s += P(heartD(0, T - 18, 7), a) + shine(-2, T - 15, 0.9);
  if (v.o === 'motif') s += motif(v.a ?? 'star', 0, T - 14, 6.5) + motif(v.a ?? 'star', 0, y + 24, 4);
  if (v.o === 'dots') for (let i = 0; i < 4; i++) s += circ((i % 2 ? 2 : -2) * k, y + 19 + i * ((T - y - 28) / 3), 1.5, a);
  s += P(blade, 'url(#g-shadeX)') + cloth(knot, dark(c, 0.06), x.p) + `<path d="${knot}" fill="none" stroke="${dark(c, 0.22)}" stroke-width="0.8"/>`;
  return s;
}
function accentFor2(c: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return (r * 0.3 + g * 0.59 + b * 0.11) / 255 > 0.6 ? dark(c, 0.35) : light(c, 0.55);
}

// ---------- scarves ----------
function scarf(x: WearCtx, v: V): string {
  const { b } = x;
  const y = b.shY;
  const c = x.c;
  const a = v.a ?? light(c, 0.55);
  const kind = v.o ?? 'knit';
  const L = -b.shW + 5;
  const R = b.shW - 5;
  const wrapD = `M${f(L + 1)} ${f(y - 2)} Q0 ${f(y - 14)} ${f(R - 1)} ${f(y - 2)} L${f(R + 1)} ${f(y + 10)} Q0 ${f(y + 23)} ${f(L - 1)} ${f(y + 10)}Z`;
  // A slice of the wrap between t0 and t1 (0 = left, 1 = right), for stripes going around.
  const wrapBand = (t0: number, t1: number) => {
    const top = (t: number) => { const u = 1 - t; return [u * u * (L + 1) + t * t * (R - 1), u * u * (y - 2) + 2 * u * t * (y - 14) + t * t * (y - 2)]; };
    const bot = (t: number) => { const u = 1 - t; return [u * u * (L - 1) + t * t * (R + 1), u * u * (y + 10) + 2 * u * t * (y + 23) + t * t * (y + 10)]; };
    const pts = [top(t0), top((t0 + t1) / 2), top(t1), bot(t1), bot((t0 + t1) / 2), bot(t0)];
    return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') + 'Z';
  };
  const tailTop = y + 9;
  const tailBot = b.waistY + 18;
  const tailD = (x0: number, lean = 4, w = 16) => `M${f(x0)} ${f(tailTop + 1)} L${f(x0 + w)} ${f(tailTop - 1)} L${f(x0 + w + lean)} ${f(tailBot - 2)} L${f(x0 + lean)} ${f(tailBot)}Z`;
  const tailEdge = (x0: number, yy: number, lean = 4, w = 16) => {
    const t = (yy - tailTop) / (tailBot - tailTop);
    return [x0 + lean * t, x0 + w + lean * t];
  };
  const fringe = (x0: number, lean = 4, w = 16, col = dark(c, 0.08)) => {
    let s = '';
    for (let i = 0; i < 5; i++) s += line(x0 + lean + 1.5 + i * (w - 3) / 4, tailBot - 1 - i * 0.4, x0 + lean + 2 + i * (w - 3) / 4, tailBot + 7 - i * 0.4, col, 2.2);
    return s;
  };
  const pom = (px: number, py: number, col: string) => {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * Math.PI * 2;
      s += circ(px + Math.cos(an) * 5, py + Math.sin(an) * 5, 3.6, i % 2 ? col : light(col, 0.2));
    }
    return s + circ(px, py, 5.5, light(col, 0.15)) + circ(px, py, 7.5, 'url(#g-face)') + shine(px - 2.4, py - 2.6, 1.6, 0.5);
  };
  const stripesTail = (x0: number, cols: string[], lean = 4, w = 16) => {
    let s = '';
    const n = 6;
    const h = (tailBot - tailTop - 6) / n;
    for (let i = 1; i < n; i += 2) {
      const y0 = tailTop + 3 + i * h;
      const [l0, r0] = tailEdge(x0, y0, lean, w);
      const [l1, r1] = tailEdge(x0, y0 + h, lean, w);
      s += P(`M${f(l0)} ${f(y0)} L${f(r0)} ${f(y0 - 0.2)} L${f(r1)} ${f(y0 + h - 0.2)} L${f(l1)} ${f(y0 + h)}Z`, cols[((i - 1) / 2) % cols.length]);
    }
    return s;
  };
  let s = '';
  switch (kind) {
    case 'fluffy': {
      s += cloth(wrapD, c, x.p, 'y');
      for (let row = 0; row < 2; row++) for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        const u = 1 - t;
        const px = u * u * (L - 2) + t * t * (R + 2);
        const py = row ? u * u * (y + 9) + 2 * u * t * (y + 22) + t * t * (y + 9) : u * u * (y + 1) + 2 * u * t * (y + 8) + t * t * (y + 1);
        s += circ(px, py, 6.5 - row, row ? dark(c, 0.04) : light(c, 0.18));
      }
      for (let i = 0; i < 7; i++) s += circ(-24 + i * 8, y + 12 + (i % 2) * 3, 1.2, '#fff', 'opacity="0.55"');
      return s + P(wrapD, 'url(#g-shadeY)', 'opacity="0.6"');
    }
    case 'infinity': {
      const loop = `M${f(L + 3)} ${f(y + 6)} Q${f(L - 2)} ${f(y + 48)} 0 ${f(y + 50)} Q${f(R + 2)} ${f(y + 48)} ${f(R - 3)} ${f(y + 6)} L${f(R - 14)} ${f(y + 12)} Q${f(R - 12)} ${f(y + 36)} 0 ${f(y + 38)} Q${f(L + 12)} ${f(y + 36)} ${f(L + 14)} ${f(y + 12)}Z`;
      s += cloth(loop, dark(c, 0.05), x.p, 'y');
      for (let i = -3; i <= 3; i++) s += line(i * 6.5, y + 38 - Math.abs(i) * 1.6, i * 7.4, y + 49 - Math.abs(i) * 2.6, light(c, 0.3), 1.6, 0.55);
      s += cloth(wrapD, c, x.p, 'y');
      for (let i = -3; i <= 3; i++) s += line(i * 10, y - 1, i * 10 + 1, y + 15 - Math.abs(i) * 1.5, light(c, 0.3), 2, 0.5);
      return s;
    }
    case 'pompom': {
      s += cloth(tailD(-20, -4, 14), dark(c, 0.08), x.p) + cloth(tailD(6, 5, 14), dark(c, 0.04), x.p);
      s += stripesTail(-20, [a], -4, 14) + stripesTail(6, [a], 5, 14);
      s += cloth(wrapD, c, x.p, 'y');
      for (const t of [0.12, 0.3, 0.7, 0.88]) s += P(wrapBand(t, t + 0.07), a);
      return s + pom(-17, tailBot + 3, a) + pom(18, tailBot + 1, a);
    }
    case 'stripe': case 'rainbow': {
      const cols = kind === 'rainbow' ? RAINBOW : [a];
      s += cloth(tailD(8), dark(c, 0.06), x.p) + stripesTail(8, kind === 'rainbow' ? RAINBOW.slice(1) : cols) + P(tailD(8), 'url(#g-shadeX)') + fringe(8);
      s += cloth(wrapD, c, x.p, 'y');
      const n = kind === 'rainbow' ? 6 : 5;
      for (let i = 0; i < n; i++) s += P(wrapBand(i / n + 0.03, i / n + 0.5 / n + 0.03), cols[i % cols.length]);
      return s + P(wrapD, 'url(#g-shadeY)', 'opacity="0.7"');
    }
    case 'snow': {
      s += cloth(tailD(8), dark(c, 0.06), x.p) + motif('snowflake', 16, y + 30, 4.5) + motif('snowflake', 18, y + 46, 4.5) + fringe(8, 4, 16, '#ffffff');
      s += cloth(wrapD, c, x.p, 'y');
      for (let i = 0; i < 6; i++) {
        const t = 0.1 + i * 0.16;
        const u = 1 - t;
        const px = u * u * L + t * t * R;
        const py = u * u * (y + 4) + 2 * u * t * (y + 17) + t * t * (y + 4);
        s += motif('snowflake', px, py, 3.6);
      }
      return s;
    }
    case 'cable': {
      s += cloth(tailD(8, 4, 17), dark(c, 0.06), x.p);
      for (let i = 0; i < 4; i++) {
        const yy = tailTop + 6 + i * ((tailBot - tailTop - 10) / 4);
        const [l, r] = tailEdge(8, yy, 4, 17);
        const mx = (l + r) / 2;
        s += stroke(`M${f(mx - 4)} ${f(yy)} Q${f(mx)} ${f(yy + 4)} ${f(mx + 4)} ${f(yy + 8)} M${f(mx + 4)} ${f(yy)} Q${f(mx)} ${f(yy + 4)} ${f(mx - 4)} ${f(yy + 8)}`, light(c, 0.35), 1.8);
      }
      s += fringe(8, 4, 17) + cloth(wrapD, c, x.p, 'y');
      for (let i = -3; i <= 3; i++) s += stroke(`M${i * 9 - 3} ${f(y + 1)} Q${i * 9 + 3} ${f(y + 7)} ${i * 9 - 2} ${f(y + 14 - Math.abs(i))}`, light(c, 0.35), 1.8, 'opacity="0.8"');
      return s;
    }
    default: {
      // knit: V stitches all over, a long tail with fringe
      s += cloth(tailD(8), dark(c, 0.06), x.p);
      for (let r = 0; r < 6; r++) {
        const yy = tailTop + 5 + r * ((tailBot - tailTop - 8) / 6);
        const [l, rr] = tailEdge(8, yy);
        for (let i = 0; i < 3; i++) {
          const cx = l + 3 + i * ((rr - l - 6) / 2);
          s += stroke(`M${f(cx - 2)} ${f(yy)} L${f(cx)} ${f(yy + 2.4)} L${f(cx + 2)} ${f(yy)}`, light(c, 0.3), 1.1);
        }
      }
      s += fringe(8) + cloth(wrapD, c, x.p, 'y');
      for (let r = 0; r < 2; r++) for (let i = -4; i <= 4; i++) {
        const cx = i * 7;
        const yy = y + 3 + r * 6 + (1 - (i * i) / 16) * 5;
        s += stroke(`M${f(cx - 2.4)} ${f(yy)} L${f(cx)} ${f(yy + 2.6)} L${f(cx + 2.4)} ${f(yy)}`, light(c, 0.3), 1.1);
      }
      if (v.a) s += P(wrapBand(0.62, 0.7), v.a) + motif('heart', 17, b.waistY + 4, 4.2);
      return s;
    }
  }
}

// ---------- bandanas ----------
function bandana(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const c = x.c;
  const d = `M-24 ${f(y + 1)} Q0 ${f(y + 11)} 24 ${f(y + 1)} Q13 ${f(y + 20)} 3 ${f(y + 35)} Q0 ${f(y + 38)} -3 ${f(y + 35)} Q-13 ${f(y + 20)} -24 ${f(y + 1)}Z`;
  let s = cloth(d, c, x.p, 'y');
  if (v.o === 'paisley') {
    for (const [px, py, r] of [[-11, 9, 0], [8, 10, 140], [0, 20, 60], [-4, 28, 200]] as const) {
      s += `<g ${tx(px, y + py, `rotate(${r})`)}><path d="M0 -4 C4 -4 4 3 0 4 C-3 4 -4 0 -2 -1 C-1 -2 -3 -3 0 -4Z" fill="${v.a ?? '#fff'}"/>${circ(0.5, 0.8, 1, c)}</g>`;
    }
  }
  if (v.o === 'cherry') s += motif('cherry', -8, y + 12, 4.4) + motif('cherry', 9, y + 13, 4.4) + motif('cherry', 0, y + 25, 4.4);
  s += stroke(`M-18 ${f(y + 6)} Q-8 ${f(y + 18)} 0 ${f(y + 31)} Q8 ${f(y + 18)} 18 ${f(y + 6)}`, v.a ?? '#fff', 1, 'stroke-dasharray="2 2" opacity="0.8"');
  s += stroke(`M-25 ${f(y)} Q0 ${f(y + 11)} 25 ${f(y)}`, dark(c, 0.12), 5) + stroke(`M-22 ${f(y - 1)} Q0 ${f(y + 9)} 22 ${f(y - 1)}`, light(c, 0.25), 1.2, 'opacity="0.6"');
  return s;
}

// ---------- boas ----------
function boa(x: WearCtx, v: V): string {
  const { b } = x;
  const y = b.shY;
  const rb = v.o === 'rainbow';
  const col = (i: number) => (rb ? RAINBOW[i % 6] : x.c);
  const puff = (px: number, py: number, i: number) => {
    const c = col(i);
    let s = '';
    for (let k = 0; k < 4; k++) {
      const an = ((i * 67 + k * 97) % 360) * (Math.PI / 180);
      s += `<ellipse cx="${f(px + Math.cos(an) * 2.6)}" cy="${f(py + Math.sin(an) * 2.2)}" rx="6.6" ry="4.4" fill="${k % 2 ? light(c, 0.22) : c}" transform="rotate(${(i * 53 + k * 45) % 180} ${f(px)} ${f(py)})"/>`;
    }
    for (let k = 0; k < 3; k++) {
      const an = ((i * 41 + k * 120) % 360) * (Math.PI / 180);
      s += line(px, py, px + Math.cos(an) * 8, py + Math.sin(an) * 6, light(c, 0.45), 0.9, 0.8);
    }
    return s + (v.o === 'sparkle' && i % 2 ? sparkle(px + 2, py - 2, 2.2, '#fff8c8') : '');
  };
  let s = '';
  const ends: [number, number][] = [];
  const yb = b.waistY + 14;
  for (let i = 0; i < 5; i++) ends.push([-24 - i * 1.5, y + 6 + (i * (yb - y - 6)) / 4], [24 + i * 1.5, y + 6 + (i * (yb - y - 6)) / 4]);
  ends.forEach(([px, py], i) => (s += puff(px, py, i)));
  along(7, 22, 15, y + 2, 0.1, 0.9).forEach((p) => (s += puff(p.x, p.y, p.i + 3)));
  return s;
}

// ---------- medals ----------
function medal(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const c = x.c;
  const m = metal(v.a);
  const kind = v.o ?? 'round';
  const ribbon = P(`M-14 ${f(y)} L-4 ${f(y + 30)} L4 ${f(y + 30)} L14 ${f(y)} L8 ${f(y)} L0 ${f(y + 22)} L-8 ${f(y)}Z`, c) +
    stroke(`M-11 ${f(y)} L-1.5 ${f(y + 26)} M11 ${f(y)} L1.5 ${f(y + 26)}`, light(c, 0.55), 1.4, 'opacity="0.8"');
  const cy = y + 39;
  if (kind === 'rosette') {
    let s = lanyard(y, y + 22, c, 2) + P(`M-6 ${f(cy + 4)} L-10 ${f(cy + 24)} L-5 ${f(cy + 21)} L-2 ${f(cy + 25)} L0 ${f(cy + 6)}Z`, dark(c, 0.1)) + P(`M6 ${f(cy + 4)} L10 ${f(cy + 24)} L5 ${f(cy + 21)} L2 ${f(cy + 25)} L0 ${f(cy + 6)}Z`, dark(c, 0.1));
    for (let i = 0; i < 14; i++) {
      const an = (i / 14) * Math.PI * 2;
      s += circ(Math.cos(an) * 10, cy - 6 + Math.sin(an) * 10, 4.2, i % 2 ? c : light(c, 0.2));
    }
    return s + circ(0, cy - 6, 8, m.fill, edge(m.dk, 1)) + `<text x="0" y="${f(cy - 3.6)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="7" text-anchor="middle" fill="${dark(c, 0.3)}">1st</text>`;
  }
  let disk = '';
  if (kind === 'star') disk = P(starD(0, cy, 13, 0.55), m.fill, edge(m.dk, 1.4)) + P(starD(0, cy, 7.5, 0.55), m.hi, 'opacity="0.6"') + shine(-3, cy - 3, 1.6);
  else if (kind === 'heart') disk = P(heartD(0, cy - 8, 16), m.fill, edge(m.dk, 1.4)) + P(heartD(0, cy - 3.6, 8), v.a === 'gold' ? '#ff7eb6' : m.hi, 'opacity="0.9"') + shine(-5, cy - 3, 1.6);
  else {
    disk = circ(0, cy, 11.5, m.fill, edge(m.dk, 1.5)) + circ(0, cy, 8, 'none', edge(m.hi, 1.1));
    disk += kind === 'laurel'
      ? [-1, 1].map((sd) => [0, 1, 2].map((i) => `<ellipse cx="${f(sd * (6 - i * 0.6))}" cy="${f(cy + 3 - i * 3.4)}" rx="1.4" ry="2.6" fill="${m.dk}" transform="rotate(${sd * (30 + i * 15)} ${f(sd * (6 - i * 0.6))} ${f(cy + 3 - i * 3.4)})"/>`).join('')).join('') + P(starD(0, cy - 0.5, 3), m.dk)
      : `<text x="0" y="${f(cy + 4)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="11" text-anchor="middle" fill="${m.dk}">${v.o === 'two' ? 2 : 3}</text>`;
    disk += shine(-4.5, cy - 5, 1.8, 0.6);
  }
  return ribbon + `<rect x="-5" y="${f(y + 26)}" width="10" height="5" rx="2" fill="${m.fill}" ${edge(m.dk, 0.8)}/>` + disk + (kind === 'laurel' ? twinkle(10, cy - 9, 3, 0.3) : '');
}

// ---------- leis ----------
function lei(x: WearCtx, v: V): string {
  const y = x.b.shY;
  const kind = v.o ?? 'hibiscus';
  const pts = along(11, 26, 27, y - 1, 0.03, 0.97);
  let s = '';
  for (const p of pts) {
    const c = kind === 'rainbow' ? RAINBOW[p.i % 6] : p.i % 2 ? x.c : v.a ?? light(x.c, 0.5);
    if (kind === 'plumeria') {
      for (let k = 0; k < 5; k++) s += `<ellipse cx="${f(p.x)}" cy="${f(p.y - 4)}" rx="2.8" ry="4.6" fill="${k % 2 ? '#fff' : '#fffaf0'}" transform="rotate(${k * 72 + p.i * 20} ${f(p.x)} ${f(p.y)})"/>`;
      s += circ(p.x, p.y, 2.6, '#ffd36b') + circ(p.x, p.y, 1.2, '#ffab5e');
    } else if (kind === 'rose') {
      s += circ(p.x, p.y, 6.2, c) + stroke(`M${f(p.x - 3)} ${f(p.y)} A3 3 0 1 1 ${f(p.x)} ${f(p.y + 3)} A1.6 1.6 0 1 1 ${f(p.x + 1)} ${f(p.y - 0.4)}`, dark(c, 0.22), 1.1) + circ(p.x - 2, p.y - 2.6, 1.2, '#fff', 'opacity="0.5"');
      if (p.i % 2) s += `<ellipse cx="${f(p.x + 6)}" cy="${f(p.y + 3)}" rx="3" ry="1.6" fill="#6fc47c" transform="rotate(30 ${f(p.x + 6)} ${f(p.y + 3)})"/>`;
    } else if (kind === 'daisy') {
      if (p.i % 2) s += `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="4.4" ry="2.2" fill="#6fc47c" transform="rotate(${f(p.r)} ${f(p.x)} ${f(p.y)})"/>`;
      else s += flowerG(p.x, p.y, 6.8, '#ffffff', x.c);
    } else {
      for (let k = 0; k < 5; k++) {
        const an = ((k * 72 + p.i * 23) * Math.PI) / 180;
        s += circ(p.x + Math.cos(an) * 3.6, p.y + Math.sin(an) * 3.6, 3.8, c);
      }
      s += circ(p.x, p.y, 2, dark(c, 0.25)) + line(p.x, p.y, p.x + 3, p.y - 3, '#ffe06b', 1) + circ(p.x + 3, p.y - 3, 0.9, '#ffe06b') + circ(p.x - 2.6, p.y - 2.6, 1.3, '#fff', 'opacity="0.5"');
    }
  }
  return s;
}

// ---------- fun gear ----------
function gear(x: WearCtx, v: V): string {
  const { b } = x;
  const y = b.shY;
  const c = x.c;
  const kind = v.o ?? 'whistle';
  switch (kind) {
    case 'whistle': {
      const wy = y + 30;
      return lanyard(y, wy - 3, c, 2.6) + circ(0, wy - 2.5, 2.4, 'none', edge(SILVER.dk, 1.2)) +
        P(`M-7 ${f(wy)} L7 ${f(wy)} Q10 ${f(wy)} 10 ${f(wy + 3)} L10 ${f(wy + 5)} L1 ${f(wy + 5)} A6 6 0 1 1 -7 ${f(wy + 1)}Z`, SILVER.fill, edge(SILVER.dk, 1)) +
        `<rect x="2" y="${f(wy + 0.6)}" width="4" height="2" rx="0.8" fill="${SILVER.dk}"/>` + circ(-4, wy + 6, 2, dark(SILVER.base, 0.2)) + shine(-6, wy + 2, 1.2);
    }
    case 'camera': {
      const cy = y + 34;
      return lanyard(y, cy - 8, v.a ?? dark(c, 0.3), 2.6) +
        `<rect x="-14" y="${f(cy - 9)}" width="28" height="19" rx="5" fill="${c}"/><rect x="-14" y="${f(cy - 9)}" width="28" height="19" rx="5" fill="url(#g-shadeX)"/>` +
        `<rect x="-14" y="${f(cy - 3)}" width="28" height="7" fill="${dark(c, 0.15)}" opacity="0.5"/><rect x="5" y="${f(cy - 12)}" width="7" height="4" rx="1.5" fill="${dark(c, 0.2)}"/>` +
        circ(0, cy + 0.5, 7, '#4a4a5e') + circ(0, cy + 0.5, 5, SILVER.fill) + circ(0, cy + 0.5, 3.2, '#2d2a3a') + shine(-1.3, cy - 0.8, 1.2, 0.9) +
        `<rect x="-11" y="${f(cy - 7)}" width="5" height="3" rx="1" fill="#fff8c8"/>` + circ(10, cy - 5, 1.4, '#ff4f6d');
    }
    case 'headphones': {
      const hy = y + 10;
      let s = stroke(`M-21 ${f(hy - 4)} Q-24 ${f(y - 8)} -12 ${f(y - 6)} M21 ${f(hy - 4)} Q24 ${f(y - 8)} 12 ${f(y - 6)}`, dark(c, 0.15), 4);
      for (const sd of [-1, 1]) {
        s += `<ellipse cx="${sd * 21}" cy="${f(hy)}" rx="8.5" ry="10" fill="${dark(c, 0.15)}"/><ellipse cx="${sd * 20}" cy="${f(hy)}" rx="7.2" ry="8.6" fill="${c}"/><ellipse cx="${sd * 20}" cy="${f(hy)}" rx="7.2" ry="8.6" fill="url(#g-face)"/>`;
        if (v.a === 'kitty') s += P(`M${sd * 14} ${f(hy - 6)} L${sd * 15} ${f(hy - 15)} L${sd * 20} ${f(hy - 8.4)}Z`, c) + P(`M${sd * 26} ${f(hy - 6)} L${sd * 25} ${f(hy - 15)} L${sd * 20} ${f(hy - 8.4)}Z`, c) + motif('paw', sd * 20, hy + 0.5, 3.6);
        else if (v.a === 'star') s += P(starD(sd * 20, hy, 4.2), '#ffe06b');
        else s += circ(sd * 20, hy, 3.4, light(c, 0.45)) + shine(sd * 20 - 1.5, hy - 1.5, 1);
      }
      return s;
    }
    case 'bff': {
      const m = GOLD;
      const cy = y + 28;
      return chain(17, 18, y - 1, m) + bail(1, y + 19, m) +
        P(`M1 ${f(cy - 5)} C-4 ${f(cy - 12)} -14 ${f(cy - 8)} -13 ${f(cy)} C-12 ${f(cy + 5)} -6 ${f(cy + 9)} 1 ${f(cy + 14)} L-2 ${f(cy + 10)} L3 ${f(cy + 6)} L-1 ${f(cy + 2)} L3 ${f(cy - 2)}Z`, c, edge(m.dk, 1.2)) +
        `<text x="-5.4" y="${f(cy + 2)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="5.4" text-anchor="middle" fill="#fff">BE</text>` +
        `<text x="-4" y="${f(cy + 7.6)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="4.6" text-anchor="middle" fill="#fff">FRI</text>` + shine(-8, cy - 4, 1.4);
    }
    case 'badge': {
      const cy = y + 40;
      return lanyard(y, cy - 12, c, 3.4) + `<rect x="-3" y="${f(cy - 14)}" width="6" height="5" rx="1" fill="${SILVER.fill}"/>` +
        `<rect x="-11" y="${f(cy - 10)}" width="22" height="26" rx="3.5" fill="#fff" stroke="${dark(c, 0.2)}" stroke-width="1"/><rect x="-11" y="${f(cy - 10)}" width="22" height="8" rx="3.5" fill="${c}"/>` +
        `<rect x="-11" y="${f(cy - 5)}" width="22" height="3" fill="${c}"/><text x="0" y="${f(cy - 4)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="5" text-anchor="middle" fill="#fff">HELLO</text>` +
        P(heartD(0, cy + 0.5, 7), v.a ?? '#ff4f7b') + `<rect x="-7" y="${f(cy + 10)}" width="14" height="2" rx="1" fill="#e2dcef"/>`;
    }
    case 'key': {
      const m = GOLD;
      const ky = y + 26;
      return cord(18, 19, y - 1, c, 2.2) + `<g ${tx(0, ky, '')}>${circ(0, 4, 5.4, m.fill, edge(m.dk, 1.2))}${circ(0, 4, 2.2, c)}` +
        `<rect x="-1.6" y="8.6" width="3.2" height="13" rx="1.4" fill="${m.fill}" ${edge(m.dk, 0.9)}/><rect x="1" y="15" width="4" height="2.6" rx="0.8" fill="${m.base}"/><rect x="1" y="19" width="3" height="2.4" rx="0.8" fill="${m.base}"/>` +
        P(heartD(0, -1.4, 3), m.hi) + '</g>' + twinkle(8, ky + 6, 2.4, 0.6);
    }
    case 'compass': {
      const m = metal(v.a);
      const cy = y + 32;
      return cord(18, 21, y - 1, '#c9a27e', 2) + circ(0, cy - 10, 2.2, 'none', edge(m.dk, 1.3)) + circ(0, cy, 10, m.fill, edge(m.dk, 1.4)) + circ(0, cy, 7.6, '#fffaf0') +
        P(`M0 ${f(cy - 6.4)} L2 ${f(cy)} L0 ${f(cy + 6.4)} L-2 ${f(cy)}Z`, '#e8384f') + P(`M0 ${f(cy)} L2 ${f(cy)} L0 ${f(cy + 6.4)} L-2 ${f(cy)}Z`, c) + circ(0, cy, 1.2, m.dk) + `<ellipse cx="-3" cy="${f(cy - 3.6)}" rx="3" ry="1.6" fill="#fff" opacity="0.7"/>`;
    }
    default:
      return '';
  }
}


// ---------- sporty ----------
function sporty(x: WearCtx, v: V): string {
  const { b } = x;
  const y = b.shY;
  const c = x.c;
  const kind = v.o ?? 'tags';
  if (kind === 'tags') {
    const m = metal(v.a);
    const d = `M-15 ${f(y - 1)} Q-12 ${f(y + 20)} 0 ${f(y + 24)} Q12 ${f(y + 20)} 15 ${f(y - 1)}`;
    const tag = (rot: number, dx: number, dy: number, top: boolean) => `<g ${tx(dx, y + 28 + dy, `rotate(${rot})`)}>${rect2(-6.5, -8, 13, 18, 4, m.fill, edge(m.dk, 1))}${circ(0, -5.4, 1.2, 'none', edge(m.dk, 0.8))}` +
      (top ? (v.p === undefined && c !== '#ffffff' ? P(starD(0, 2, 3.6), c) : '') + line(-3.6, 6.4, 3.6, 6.4, m.dk, 0.8, 0.7) : line(-3.6, -1, 3.6, -1, m.dk, 0.8, 0.6) + line(-3.6, 2, 3.6, 2, m.dk, 0.8, 0.6)) + shine(-3.4, -4.4, 1.1, 0.7) + '</g>';
    return stroke(d, m.dk, 1.8, 'stroke-dasharray="0.1 2.4"') + stroke(d, m.base, 1.2, 'stroke-dasharray="0.1 2.4"') + tag(14, 3, 1, false) + tag(-8, -2, 0, true);
  }
  if (kind === 'whistle') {
    const wy = y + 30;
    return lanyard(y, wy - 3, c, 3.6) + stroke(`M-15 ${f(y)} Q-12 ${f((y + wy - 3) / 2 + 4)} -2 ${f(wy - 3)} M15 ${f(y)} Q12 ${f((y + wy - 3) / 2 + 4)} 2 ${f(wy - 3)}`, v.a === '#ffd24a' ? '#ffd24a' : '#ffffff', 1, 'stroke-dasharray="3 2"') +
      circ(0, wy - 2.5, 2.4, 'none', edge(SILVER.dk, 1.2)) + P(`M-7 ${f(wy)} L7 ${f(wy)} Q10 ${f(wy)} 10 ${f(wy + 3)} L10 ${f(wy + 5)} L1 ${f(wy + 5)} A6 6 0 1 1 -7 ${f(wy + 1)}Z`, v.a === '#ffd24a' ? GOLD.fill : SILVER.fill, edge(SILVER.dk, 1)) + shine(-6, wy + 2, 1.2);
  }
  // sports medals on a striped ribbon
  const ribbon = P(`M-14 ${f(y)} L-4 ${f(y + 30)} L4 ${f(y + 30)} L14 ${f(y)} L8 ${f(y)} L0 ${f(y + 22)} L-8 ${f(y)}Z`, c) +
    stroke(`M-11 ${f(y)} L-1.5 ${f(y + 26)} M11 ${f(y)} L1.5 ${f(y + 26)}`, v.a ?? '#ffffff', 1.6, 'opacity="0.9"');
  const cy = y + 40;
  let disk = circ(0, cy, 12, GOLD.fill, edge(GOLD.dk, 1.5));
  if (kind === 'soccer') {
    disk += circ(0, cy, 8.4, '#ffffff', edge('#d9d4e2', 0.6)) + P(`M0 ${f(cy - 3)} L3 ${f(cy - 1)} L2 ${f(cy + 2.6)} L-2 ${f(cy + 2.6)} L-3 ${f(cy - 1)}Z`, '#2d2a3a');
    for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i * 2 * Math.PI) / 5; disk += circ(Math.cos(an) * 7, cy + Math.sin(an) * 7, 1.8, '#2d2a3a'); }
  } else if (kind === 'basket') {
    disk += circ(0, cy, 8.4, '#ff8a3d') + stroke(`M-8.4 ${f(cy)} L8.4 ${f(cy)} M0 ${f(cy - 8.4)} L0 ${f(cy + 8.4)} M-6 ${f(cy - 6)} Q-2 ${f(cy)} -6 ${f(cy + 6)} M6 ${f(cy - 6)} Q2 ${f(cy)} 6 ${f(cy + 6)}`, '#5a2e1a', 0.8);
  } else {
    disk = P(`M-9 ${f(cy - 10)} L9 ${f(cy - 10)} Q9 ${f(cy + 2)} 0 ${f(cy + 4)} Q-9 ${f(cy + 2)} -9 ${f(cy - 10)}Z`, GOLD.fill, edge(GOLD.dk, 1.2)) +
      stroke(`M-9 ${f(cy - 7)} Q-14 ${f(cy - 6)} -9 ${f(cy - 1)} M9 ${f(cy - 7)} Q14 ${f(cy - 6)} 9 ${f(cy - 1)}`, GOLD.dk, 1.6) + rect2(-2, cy + 3, 4, 5, 1, GOLD.base) + rect2(-7, cy + 7, 14, 5, 1.5, GOLD.fill, edge(GOLD.dk, 0.8)) + P(starD(0, cy - 4, 3.4), '#fff3b0');
  }
  return ribbon + rect2(-5, y + 26, 10, 5, 2, GOLD.fill, edge(GOLD.dk, 0.8)) + disk + shine(-5, cy - 6, 1.6, 0.6) + twinkle(11, cy - 9, 2.6, 0.5);
}
const rect2 = (x: number, y: number, w: number, h: number, rx: number, c: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${c}" ${extra}/>`;

// ---------- the catalog ----------
const STYLES: Style[] = [
  {
    group: 'Pendants', key: 'pendant', draw: pendant, vs: [
      { k: 'heart', n: 'Sweetheart Pendant', c: '#ff4f8b', o: 'heart' },
      { k: 'star', n: 'Twinkle Star Pendant', c: '#ffd24a', o: 'star', a: 'silver' },
      { k: 'moon', n: 'Moonbeam Pendant', c: '#ffe680', o: 'moon' },
      { k: 'gem', n: 'Ocean Gem Pendant', c: '#4f9dff', o: 'gem', a: 'silver' },
      { k: 'flower', n: 'Blossom Pendant', c: '#ff9ec7', o: 'flower', t: ['spring'] },
      { k: 'butterfly', n: 'Butterfly Pendant', c: '#c99bff', o: 'butterfly', a: 'silver', t: ['spring'] },
      { k: 'rainbow', n: 'Rainbow Pendant', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'crown', n: 'Little Crown Pendant', c: '#ff4f8b', o: 'crown' },
      { k: 'cherry', n: 'Cherry Pendant', c: '#e8384f', o: 'cherry', t: ['summer'] },
      { k: 'shell', n: 'Seashell Pendant', c: '#ffd6e3', o: 'shell', a: 'rose', t: ['summer'] },
      { k: 'clover', n: 'Lucky Clover', c: '#3fbf8f', o: 'clover', t: ['spring'] },
      { k: 'snowflake', n: 'Snowflake Pendant', c: '#9fd6ff', o: 'snowflake', a: 'silver', t: ['winter'] },
      { k: 'note', n: 'Music Note Pendant', c: '#9b6bff', o: 'note', a: 'silver' },
    ],
  },
  {
    group: 'Pearls', key: 'pearl', draw: pearls, vs: [
      { k: 'long', n: 'Long Pearls', c: '#fffaf2', o: 'long' },
      { k: 'pink', n: 'Pink Pearls', c: '#ffd6e3', o: 'long' },
      { k: 'bow', n: 'Pearls & Bow', c: '#fffaf2', o: 'bow', a: '#ff7eb6' },
      { k: 'double', n: 'Double Pearls', c: '#fff3e6', o: 'double' },
      { k: 'drop', n: 'Pearl Drop', c: '#f6efff', o: 'drop' },
      { k: 'rainbow', n: 'Rainbow Pearls', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'bubble', n: 'Bubble Pearls', c: '#e6d4ff', o: 'big' },
      { k: 'golden', n: 'Golden Pearls', c: '#f6e2b5', o: 'gold' },
      { k: 'opera', n: 'Heart Opera Pearls', c: '#fffaf2', o: 'opera', a: '#ff4f8b' },
    ],
  },
  {
    group: 'Lockets', key: 'locket', draw: locket, vs: [
      { k: 'heart-gold', n: 'Golden Heart Locket', c: '#ff7eb6', o: 'heart' },
      { k: 'round-silver', n: 'Starry Locket', c: '#7cc8ff', o: 'round', a: 'silver' },
      { k: 'oval-rose', n: 'Rosy Oval Locket', c: '#c99bff', o: 'oval', a: 'rose' },
      { k: 'star-gold', n: 'Star Locket', c: '#ff4f8b', o: 'star' },
      { k: 'heart-silver', n: 'Mint Heart Locket', c: '#5fd3b5', o: 'heart', a: 'silver' },
      { k: 'oval-gold', n: 'Rosebud Locket', c: '#e8384f', o: 'oval' },
    ],
  },
  {
    group: 'Bead Necklaces', key: 'beads', draw: beads, vs: [
      { k: 'rainbow', n: 'Rainbow Beads', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'candy', n: 'Candy Necklace', c: '#ffb3c7', o: 'candy', fixed: true },
      { k: 'love', n: 'LOVE Letter Beads', c: '#ff7eb6', o: 'letters', a: 'LOVE' },
      { k: 'gumball', n: 'Gumball Necklace', c: '#ff4f8b', o: 'gumball', fixed: true },
      { k: 'bff', n: 'BFF Letter Beads', c: '#7cc8ff', o: 'letters', a: 'BFF' },
      { k: 'fruit', n: 'Fruity Beads', c: '#ff4f6d', o: 'fruit', fixed: true, t: ['summer'] },
      { k: 'stars', n: 'Star Beads', c: '#c99bff', o: 'stars' },
      { k: 'pasta', n: 'Pasta Necklace', c: '#ffab5e', o: 'pasta', fixed: true },
      { k: 'hearts', n: 'Heart Beads', c: '#ff4f7b', o: 'hearts' },
      { k: 'daisy', n: 'Daisy Beads', c: '#ffd36b', o: 'daisy', t: ['spring'] },
    ],
  },
  {
    group: 'Chokers', key: 'choker', draw: choker, vs: [
      { k: 'velvet-heart', n: 'Velvet Heart Choker', c: '#2d2a3a', o: 'heart' },
      { k: 'pink-star', n: 'Pink Star Choker', c: '#ff7eb6', o: 'star', a: 'silver' },
      { k: 'lilac-moon', n: 'Moon Choker', c: '#9b6bff', o: 'moon' },
      { k: 'ribbon-bow', n: 'Ribbon Bow Choker', c: '#ffb3c7', o: 'bow', a: '#ff4f8b' },
      { k: 'lace', n: 'Lace Cameo Choker', c: '#ffffff', o: 'lace' },
      { k: 'pearl', n: 'Pearl Drop Choker', c: '#3f4f9a', o: 'pearl' },
      { k: 'ruby', n: 'Ruby Choker', c: '#e0457b', o: 'gem' },
      { k: 'daisy', n: 'Daisy Chain', c: '#ffd36b', o: 'daisy', t: ['spring', 'summer'] },
      { k: 'sparkle', n: 'Sparkle Choker', c: '#c99bff', o: 'rhinestone' },
    ],
  },
  {
    group: 'Collars', key: 'collar', draw: collar, vs: [
      { k: 'white', n: 'Peter Pan Collar', c: '#ffffff', o: 'plain' },
      { k: 'lace', n: 'Lace Collar', c: '#fff6fa', o: 'lace' },
      { k: 'polka', n: 'Polka Dot Collar', c: '#ff9ec7', o: 'button', p: 'dots' },
      { k: 'scallop', n: 'Scallop Collar', c: '#a8e6cf', o: 'scallop' },
      { k: 'bow', n: 'Bow Collar', c: '#ffffff', o: 'bow', a: '#e8384f' },
      { k: 'cherry', n: 'Cherry Collar', c: '#fff3d6', o: 'cherry', a: '#e8384f', t: ['summer'] },
      { k: 'daisy', n: 'Daisy Collar', c: '#c99bff', o: 'daisy', t: ['spring'] },
      { k: 'pearl', n: 'Pearl Trim Collar', c: '#2d2a3a', o: 'pearl' },
    ],
  },
  {
    group: 'Bow Ties', key: 'bowtie', draw: bowtie, vs: [
      { k: 'cherry', n: 'Cherry Bow Tie', c: '#e8384f' },
      { k: 'polka', n: 'Polka Bow Tie', c: '#3f4f9a', p: 'dots' },
      { k: 'gingham', n: 'Picnic Bow Tie', c: '#ff7eb6', p: 'check' },
      { k: 'stripe', n: 'Striped Bow Tie', c: '#5fd3b5', p: 'stripes' },
      { k: 'velvet', n: 'Velvet Bow Tie', c: '#7a3a9a', o: 'velvet' },
      { k: 'glitter', n: 'Glitter Bow Tie', c: '#ffc94a', o: 'glitter' },
      { k: 'hearts', n: 'Heart Bow Tie', c: '#ffb3c7', p: 'hearts' },
      { k: 'rainbow', n: 'Rainbow Bow Tie', c: '#ff6f91', o: 'rainbow', fixed: true },
    ],
  },
  {
    group: 'Neckties', key: 'tie', draw: necktie, vs: [
      { k: 'red', n: 'Classic Tie', c: '#e8384f' },
      { k: 'school', n: 'School Tie', c: '#3f4f9a', o: 'stripes', a: '#ffd24a', t: ['fall'] },
      { k: 'skinny', n: 'Skinny Tie', c: '#2d2a3a', o: 'skinny' },
      { k: 'polka', n: 'Polka Dot Tie', c: '#9b6bff', o: 'dots', a: '#ffffff' },
      { k: 'star', n: 'Star Tie', c: '#4f9dff', o: 'stars', a: '#ffe06b' },
      { k: 'heart', n: 'Heart Tie', c: '#ff7eb6', o: 'heart', a: '#ffffff' },
      { k: 'plaid', n: 'Plaid Tie', c: '#3fbf8f', p: 'check', t: ['fall'] },
      { k: 'dino', n: 'Dino Tie', c: '#6fc47c', o: 'motif', a: 'dino' },
      { k: 'bolt', n: 'Lightning Tie', c: '#3f4f9a', o: 'motif', a: 'bolt' },
      { k: 'rocket', n: 'Planet Tie', c: '#9b6bff', o: 'motif', a: 'planet' },
    ],
  },
  {
    group: 'Scarves', key: 'scarf', tags: ['winter', 'fall'], draw: scarf, vs: [
      { k: 'knit-sunny', n: 'Sunny Knit Scarf', c: '#ffd36b', o: 'knit' },
      { k: 'stripe-pink', n: 'Pink Striped Scarf', c: '#ff7eb6', o: 'stripe', a: '#ffffff' },
      { k: 'fluffy-white', n: 'Fluffy Snow Scarf', c: '#fff6fa', o: 'fluffy' },
      { k: 'infinity-teal', n: 'Infinity Scarf', c: '#5fd3b5', o: 'infinity' },
      { k: 'pompom-red', n: 'Pom-Pom Scarf', c: '#e8384f', o: 'pompom', a: '#ffffff' },
      { k: 'rainbow', n: 'Rainbow Scarf', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'snow', n: 'Snowflake Scarf', c: '#3f4f9a', o: 'snow', t: ['winter'] },
      { k: 'cable', n: 'Cable Knit Scarf', c: '#c9a27e', o: 'cable', t: ['fall'] },
      { k: 'stripe-navy', n: 'Sailor Stripe Scarf', c: '#3f4f9a', o: 'stripe', a: '#ffffff' },
      { k: 'fluffy-pink', n: 'Fluffy Pink Scarf', c: '#ffb3c7', o: 'fluffy' },
      { k: 'heart', n: 'Heart Knit Scarf', c: '#c99bff', o: 'knit', a: '#ff7eb6' },
    ],
  },
  {
    group: 'Bandanas', key: 'bandana', tags: ['summer'], draw: bandana, vs: [
      { k: 'red', n: 'Red Dot Bandana', c: '#e8384f', p: 'dots' },
      { k: 'paisley', n: 'Paisley Bandana', c: '#4f9dff', o: 'paisley' },
      { k: 'hearts', n: 'Heart Bandana', c: '#ff7eb6', p: 'hearts' },
      { k: 'picnic', n: 'Picnic Bandana', c: '#ff7a6b', p: 'check' },
      { k: 'daisy', n: 'Daisy Bandana', c: '#5fd3b5', p: 'flowers', t: ['spring'] },
      { k: 'cherry', n: 'Cherry Bandana', c: '#fff3d6', o: 'cherry', a: '#e8384f' },
    ],
  },
  {
    group: 'Feather Boas', key: 'boa', premium: 10, draw: boa, vs: [
      { k: 'pink', n: 'Pink Feather Boa', c: '#ff9ec7' },
      { k: 'white', n: 'Snowy Feather Boa', c: '#ffffff' },
      { k: 'lilac', n: 'Lilac Feather Boa', c: '#c99bff' },
      { k: 'rainbow', n: 'Rainbow Feather Boa', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'sparkle', n: 'Starlet Boa', c: '#ffd36b', o: 'sparkle' },
      { k: 'mint', n: 'Mint Feather Boa', c: '#a8e6cf' },
    ],
  },
  {
    group: 'Medals', key: 'medal', draw: medal, vs: [
      { k: 'silver', n: 'Silver Medal', c: '#4f9dff', a: 'silver', o: 'two' },
      { k: 'bronze', n: 'Bronze Medal', c: '#3fbf8f', a: 'bronze', o: 'three' },
      { k: 'rosette', n: 'First Prize Ribbon', c: '#4f9dff', o: 'rosette' },
      { k: 'star', n: 'Star Medal', c: '#ff7eb6', o: 'star' },
      { k: 'heart', n: 'Kindness Medal', c: '#c99bff', o: 'heart' },
      { k: 'champion', n: 'Champion Medal', c: '#9b6bff', o: 'laurel' },
    ],
  },
  {
    group: 'Leis', key: 'lei', tags: ['summer'], draw: lei, vs: [
      { k: 'hibiscus', n: 'Hibiscus Lei', c: '#ff4f6d', a: '#ffab5e', o: 'hibiscus' },
      { k: 'rainbow', n: 'Rainbow Lei', c: '#ff6f91', o: 'rainbow', fixed: true },
      { k: 'plumeria', n: 'Plumeria Lei', c: '#ffffff', o: 'plumeria' },
      { k: 'rose', n: 'Rosy Lei', c: '#ff7eb6', a: '#ffd6e3', o: 'rose', t: ['spring'] },
      { k: 'daisy', n: 'Daisy Lei', c: '#ffd36b', o: 'daisy', t: ['spring'] },
    ],
  },
  {
    group: 'Fun Gear', key: 'gear', draw: gear, vs: [
      { k: 'whistle', n: 'Coach Whistle', c: '#e8384f', o: 'whistle' },
      { k: 'headphones-pink', n: 'Pink Headphones', c: '#ff7eb6', o: 'headphones' },
      { k: 'camera-mint', n: 'Mint Camera', c: '#a8e6cf', o: 'camera', a: '#c9a27e' },
      { k: 'bff', n: 'Best Friend Heart', c: '#ff4f8b', o: 'bff' },
      { k: 'headphones-kitty', n: 'Kitty Headphones', c: '#c99bff', o: 'headphones', a: 'kitty' },
      { k: 'camera-pink', n: 'Pink Camera', c: '#ffb3c7', o: 'camera', a: '#ff4f8b' },
      { k: 'badge', n: 'Hello Name Badge', c: '#4f9dff', o: 'badge', a: '#ff7eb6' },
      { k: 'key', n: 'Secret Key Necklace', c: '#9b6bff', o: 'key' },
      { k: 'compass', n: 'Explorer Compass', c: '#3f4f9a', o: 'compass' },
    ],
  },
  {
    group: 'Sporty', key: 'sport', draw: sporty, vs: [
      { k: 'dogtags', n: 'Dog Tags', c: '#ffffff', o: 'tags', a: 'silver' },
      { k: 'soccer', n: 'Soccer Medal', c: '#3fbf8f', o: 'soccer' },
      { k: 'whistle', n: 'Team Whistle', c: '#3f4f9a', o: 'whistle', a: '#ffffff' },
      { k: 'dogtags-star', n: 'Star Dog Tags', c: '#4f9dff', o: 'tags', a: 'silver' },
      { k: 'trophy', n: 'Trophy Medal', c: '#e8384f', o: 'trophy' },
      { k: 'basketball', n: 'Hoops Medal', c: '#ff8a3d', o: 'basket', a: '#2d2a3a' },
      { k: 'dogtags-gold', n: 'Golden Dog Tags', c: '#e8384f', o: 'tags' },
      { k: 'whistle-gold', n: 'Golden Whistle', c: '#e8384f', o: 'whistle', a: '#ffd24a' },
    ],
  },
];

function build(styles: Style[]): WearDef[] {
  const count = new Map<string, number>();
  const out: WearDef[] = [];
  for (const st of styles) for (const v of st.vs) {
    const i = count.get(st.group) ?? 0;
    count.set(st.group, i + 1);
    const tags = [...new Set([...(st.tags ?? []), ...(v.t ?? [])])] as Season[];
    out.push({
      id: `neck-${st.key}-${v.k}`,
      name: v.n,
      slot: 'neck',
      group: st.group,
      price: i < 3 ? 0 : Math.min(120, 15 + (i - 3) * 6 + (st.premium ?? 0)),
      color: v.c,
      pattern: v.p,
      fixed: v.fixed,
      tags: tags.length ? tags : undefined,
      over: (x) => st.draw(x, v),
    });
  }
  return out;
}

export const NECK_MORE: WearDef[] = build(STYLES);
