// The nail studio in the salon: a close-up hand to paint, decorate and dry. The finished manicure
// is saved on the doll and shows on its fingertips everywhere in the game.
import { dark, light } from '../art/color';
import { flowerG, heartD, sparkleD, starD } from '../art/wear';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, toast } from '../game';
import { type Doll, type Nails, NAIL_COUNT } from '../types';
import { el, esc, headThumb } from './dom';
import { icon } from './icons';

const f = (n: number) => n.toFixed(1);

export const POLISH: { id: string; name: string }[] = [
  ...[
    ['#ff4f8b', 'Hot Pink'], ['#ff9ec7', 'Bubblegum'], ['#ffc7dc', 'Ballet'], ['#e0245e', 'Cherry'], ['#c2244a', 'Ruby'], ['#ff7a6b', 'Coral'],
    ['#ffab5e', 'Peach'], ['#ffd84a', 'Sunshine'], ['#b6e36b', 'Lime'], ['#5fd3b5', 'Mint'], ['#3fbf8f', 'Jade'], ['#7cc8ff', 'Sky'],
    ['#4f9dff', 'Ocean'], ['#3f4f9a', 'Navy'], ['#c99bff', 'Lilac'], ['#9b6bff', 'Grape'], ['#e88ad6', 'Orchid'], ['#ffffff', 'White'],
    ['#f4ead9', 'Nude'], ['#c9a27e', 'Latte'], ['#9aa3b5', 'Silver Gray'], ['#2d2a3a', 'Midnight'], ['#5a2a4a', 'Plum'],
  ].map(([id, name]) => ({ id, name })),
  { id: 'sp:glitter', name: 'Pink Glitter' }, { id: 'sp:gold', name: 'Gold' }, { id: 'sp:chrome', name: 'Chrome' },
  { id: 'sp:holo', name: 'Holographic' }, { id: 'sp:galaxy', name: 'Galaxy' },
];
export const ARTS = ['none', 'french', 'dots', 'stripes', 'hearts', 'stars', 'ombre', 'half', 'sparkle', 'zigzag', 'flowers', 'rainbow', 'spots'];
const ART_NAME: Record<string, string> = { none: 'Plain', french: 'French Tip', dots: 'Polka Dots', stripes: 'Stripes', hearts: 'Hearts', stars: 'Stars', ombre: 'Ombré', half: 'Half Moon', sparkle: 'Sparkle', zigzag: 'Zigzag', flowers: 'Flowers', rainbow: 'Rainbow', spots: 'Spots' };
export const GEMS = ['heart', 'star', 'flower', 'pearl', 'diamond', 'butterfly', 'bow'];
export const SHAPES: { id: Nails['shape']; name: string }[] = [
  { id: 'round', name: 'Round' }, { id: 'square', name: 'Square' }, { id: 'oval', name: 'Oval' }, { id: 'almond', name: 'Almond' }, { id: 'coffin', name: 'Ballerina' },
];

/** A simple color that stands for each polish (used for the tiny fingertips on the doll). */
export const polishSwatch = (c: string) => ({ 'sp:glitter': '#ffb3d1', 'sp:gold': '#ffd24a', 'sp:chrome': '#d9dbe6', 'sp:holo': '#c99bff', 'sp:galaxy': '#3b2a6b' })[c] ?? c;

export const emptyNails = (): Nails => ({ shape: 'round', c: Array(NAIL_COUNT).fill(''), art: Array(NAIL_COUNT).fill('none'), gem: Array(NAIL_COUNT).fill(null) });

let uidN = 0;

/** Path of one nail, drawn with the fingertip pointing up: box centered on x=0, top at y. */
function nailPath(shape: Nails['shape'], w: number, top: number, h: number): string {
  const l = -w / 2;
  const r = w / 2;
  const base = top + h;
  const cut = `Q0 ${f(base + w * 0.12)} ${f(l)} ${f(base)}`;
  switch (shape) {
    case 'square':
      return `M${f(l)} ${f(base)} L${f(l)} ${f(top + 6)} Q${f(l)} ${f(top)} ${f(l + 6)} ${f(top)} L${f(r - 6)} ${f(top)} Q${f(r)} ${f(top)} ${f(r)} ${f(top + 6)} L${f(r)} ${f(base)} ${cut}Z`;
    case 'oval':
      return `M${f(l)} ${f(base)} L${f(l)} ${f(top + w * 0.55)} C${f(l)} ${f(top - w * 0.15)} ${f(r)} ${f(top - w * 0.15)} ${f(r)} ${f(top + w * 0.55)} L${f(r)} ${f(base)} ${cut}Z`;
    case 'almond':
      return `M${f(l)} ${f(base)} L${f(l)} ${f(top + w * 0.6)} C${f(l)} ${f(top + w * 0.1)} ${f(-w * 0.12)} ${f(top - w * 0.35)} 0 ${f(top - w * 0.42)} C${f(w * 0.12)} ${f(top - w * 0.35)} ${f(r)} ${f(top + w * 0.1)} ${f(r)} ${f(top + w * 0.6)} L${f(r)} ${f(base)} ${cut}Z`;
    case 'coffin':
      return `M${f(l)} ${f(base)} L${f(l + w * 0.04)} ${f(top + w * 0.3)} L${f(-w * 0.28)} ${f(top - w * 0.3)} L${f(w * 0.28)} ${f(top - w * 0.3)} L${f(r - w * 0.04)} ${f(top + w * 0.3)} L${f(r)} ${f(base)} ${cut}Z`;
    default:
      return `M${f(l)} ${f(base)} L${f(l)} ${f(top + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(r)} ${f(top + w / 2)} L${f(r)} ${f(base)} ${cut}Z`;
  }
}

function polishFill(c: string, id: string): { defs: string; fill: string; extra: string } {
  switch (c) {
    case 'sp:gold': return { defs: '', fill: 'url(#g-gold)', extra: '' };
    case 'sp:chrome': return { defs: '', fill: 'url(#g-silver)', extra: '' };
    case 'sp:holo': return { defs: `<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc7e8"/><stop offset="0.3" stop-color="#c9b8ff"/><stop offset="0.6" stop-color="#a8f0e6"/><stop offset="1" stop-color="#fff3b0"/></linearGradient>`, fill: `url(#${id}h)`, extra: '' };
    case 'sp:galaxy': return { defs: '', fill: '#3b2a6b', extra: 'galaxy' };
    case 'sp:glitter': return { defs: '', fill: '#ffb3d1', extra: 'glitter' };
    default: return { defs: '', fill: c, extra: '' };
  }
}

function artLayer(art: string, w: number, top: number, h: number, base: string): string {
  const ink = base === '#ffffff' || base === '#f4ead9' ? '#ff7eb6' : '#ffffff';
  const cx = 0;
  const cy = top + h * 0.45;
  switch (art) {
    case 'french': return `<path d="M${-w} ${top - w} L${w} ${top - w} L${w} ${top + h * 0.22} Q0 ${top + h * 0.4} ${-w} ${top + h * 0.22}Z" fill="#ffffff"/>`;
    case 'dots': return [[-0.22, 0.25], [0.2, 0.32], [-0.05, 0.55], [0.22, 0.7], [-0.2, 0.8]].map(([x, y]) => `<circle cx="${f(x * w)}" cy="${f(top + y * h)}" r="${f(w * 0.1)}" fill="${ink}"/>`).join('');
    case 'stripes': return [0, 1, 2, 3].map((i) => `<rect x="${f(-w)}" y="${f(top + i * h * 0.28)}" width="${f(w * 2)}" height="${f(h * 0.1)}" fill="${ink}" opacity="0.85" transform="rotate(-28 0 ${f(cy)})"/>`).join('');
    case 'hearts': return `<path d="${heartD(cx, cy - w * 0.25, w * 0.28)}" fill="${ink}"/><path d="${heartD(w * 0.22, top + h * 0.12, w * 0.12)}" fill="${ink}" opacity="0.8"/>`;
    case 'stars': return `<path d="${starD(cx, cy, w * 0.26)}" fill="#ffe680"/><path d="${starD(-w * 0.22, top + h * 0.15, w * 0.1)}" fill="#fff"/><path d="${starD(w * 0.22, top + h * 0.78, w * 0.1)}" fill="#fff"/>`;
    case 'ombre': return `<rect x="${f(-w)}" y="${f(top + h * 0.35)}" width="${f(w * 2)}" height="${f(h)}" fill="#ffffff" opacity="0.35"/><rect x="${f(-w)}" y="${f(top + h * 0.6)}" width="${f(w * 2)}" height="${f(h)}" fill="#ffffff" opacity="0.4"/>`;
    case 'half': return `<path d="M${-w} ${top + h} L${-w} ${top + h * 0.72} Q0 ${top + h * 0.5} ${w} ${top + h * 0.72} L${w} ${top + h}Z" fill="#ffffff" opacity="0.9"/>`;
    case 'sparkle': return [[0, 0.3, 0.2], [-0.2, 0.6, 0.12], [0.22, 0.72, 0.1]].map(([x, y, r]) => `<path d="${sparkleD(x * w, top + y * h, r * w)}" fill="#fff8c8"/>`).join('');
    case 'zigzag': return `<path d="M${-w} ${f(cy)} l${f(w * 0.25)} ${f(-w * 0.2)} l${f(w * 0.25)} ${f(w * 0.2)} l${f(w * 0.25)} ${f(-w * 0.2)} l${f(w * 0.25)} ${f(w * 0.2)} l${f(w * 0.25)} ${f(-w * 0.2)} l${f(w * 0.25)} ${f(w * 0.2)} l${f(w * 0.25)} ${f(-w * 0.2)} l${f(w * 0.25)} ${f(w * 0.2)}" stroke="${ink}" stroke-width="${f(w * 0.1)}" fill="none" stroke-linejoin="round"/>`;
    case 'flowers': return flowerG(cx, cy, w * 0.3, ink, '#ffd36b');
    case 'rainbow': return ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#c99bff'].map((c, i) => `<rect x="${f(-w)}" y="${f(top + (i * h) / 6)}" width="${f(w * 2)}" height="${f(h / 6 + 1)}" fill="${c}"/>`).join('');
    case 'spots': return [[-0.2, 0.2], [0.18, 0.38], [-0.12, 0.62], [0.2, 0.8]].map(([x, y]) => `<ellipse cx="${f(x * w)}" cy="${f(top + y * h)}" rx="${f(w * 0.13)}" ry="${f(w * 0.1)}" fill="none" stroke="${dark(base, 0.5)}" stroke-width="${f(w * 0.07)}"/><circle cx="${f(x * w)}" cy="${f(top + y * h)}" r="${f(w * 0.05)}" fill="${dark(base, 0.4)}"/>`).join('');
  }
  return '';
}

function gemArt(gem: string, x: number, y: number, s: number): string {
  switch (gem) {
    case 'heart': return `<path d="${heartD(x, y - s * 0.5, s * 0.55)}" fill="#ff4f8b" stroke="#fff" stroke-width="1.5"/><circle cx="${f(x - s * 0.18)}" cy="${f(y - s * 0.2)}" r="${f(s * 0.1)}" fill="#fff" opacity="0.8"/>`;
    case 'star': return `<path d="${starD(x, y, s * 0.6)}" fill="url(#g-gold)" stroke="#d99a1e" stroke-width="1"/>`;
    case 'flower': return flowerG(x, y, s * 0.55, '#ffffff', '#ff7eb6');
    case 'pearl': return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.38)}" fill="#fff8f0" stroke="#e6d8c8" stroke-width="1"/><circle cx="${f(x - s * 0.12)}" cy="${f(y - s * 0.12)}" r="${f(s * 0.12)}" fill="#fff"/>`;
    case 'diamond': return `<path d="M${f(x - s * 0.45)} ${f(y - s * 0.12)} L${f(x - s * 0.2)} ${f(y - s * 0.42)} L${f(x + s * 0.2)} ${f(y - s * 0.42)} L${f(x + s * 0.45)} ${f(y - s * 0.12)} L${f(x)} ${f(y + s * 0.48)}Z" fill="#9fe0ff" stroke="#fff" stroke-width="1.5"/><path d="M${f(x - s * 0.45)} ${f(y - s * 0.12)} L${f(x + s * 0.45)} ${f(y - s * 0.12)} L${f(x)} ${f(y + s * 0.48)}Z" fill="#6fc4f0"/>`;
    case 'butterfly': return `<path d="M${f(x)} ${f(y)} C${f(x - s * 0.5)} ${f(y - s * 0.6)} ${f(x - s * 0.7)} ${f(y + s * 0.1)} ${f(x)} ${f(y)} C${f(x + s * 0.5)} ${f(y - s * 0.6)} ${f(x + s * 0.7)} ${f(y + s * 0.1)} ${f(x)} ${f(y)}Z" fill="#c99bff"/><path d="M${f(x)} ${f(y)} C${f(x - s * 0.4)} ${f(y + s * 0.2)} ${f(x - s * 0.3)} ${f(y + s * 0.55)} ${f(x)} ${f(y)} C${f(x + s * 0.4)} ${f(y + s * 0.2)} ${f(x + s * 0.3)} ${f(y + s * 0.55)} ${f(x)} ${f(y)}Z" fill="#ff9ec7"/>`;
    case 'bow': return `<path d="M${f(x)} ${f(y)} C${f(x - s * 0.2)} ${f(y - s * 0.4)} ${f(x - s * 0.7)} ${f(y - s * 0.4)} ${f(x - s * 0.7)} ${f(y)} C${f(x - s * 0.7)} ${f(y + s * 0.35)} ${f(x - s * 0.2)} ${f(y + s * 0.3)} ${f(x)} ${f(y)}Z M${f(x)} ${f(y)} C${f(x + s * 0.2)} ${f(y - s * 0.4)} ${f(x + s * 0.7)} ${f(y - s * 0.4)} ${f(x + s * 0.7)} ${f(y)} C${f(x + s * 0.7)} ${f(y + s * 0.35)} ${f(x + s * 0.2)} ${f(y + s * 0.3)} ${f(x)} ${f(y)}Z" fill="#ff4f8b"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.16)}" fill="#e0245e"/>`;
  }
  return '';
}

/** One painted nail, in a finger's own coordinates (tip at the top). */
export function nailArt(n: Nails, i: number, w: number, top: number, h: number, wet = false): string {
  const id = `nl${++uidN}`;
  const d = nailPath(n.shape, w, top, h);
  const c = n.c[i];
  if (!c) return `<path d="${d}" fill="#ffe8ec" stroke="#f3c6cf" stroke-width="2"/><path d="M${f(-w * 0.25)} ${f(top + h * 0.2)} q${f(w * 0.1)} ${f(-h * 0.08)} ${f(w * 0.35)} ${f(-h * 0.05)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  const p = polishFill(c, id);
  let s = `<defs>${p.defs}<clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${p.fill}"/>`;
  s += `<g clip-path="url(#${id})">`;
  if (p.extra === 'galaxy') for (let k = 0; k < 7; k++) s += `<circle cx="${f(((k * 37) % 100) / 100 * w - w / 2)}" cy="${f(top + ((k * 53) % 100) / 100 * h)}" r="${f(1 + (k % 3))}" fill="${['#fff', '#ff9ec7', '#9fe0ff'][k % 3]}"/>` + (k === 2 ? `<path d="${starD(0, top + h * 0.4, w * 0.16)}" fill="#ffe680"/>` : '');
  if (p.extra === 'glitter') for (let k = 0; k < 14; k++) s += `<circle cx="${f(((k * 41) % 100) / 100 * w - w / 2)}" cy="${f(top + ((k * 67) % 100) / 100 * h)}" r="${f(1.2 + (k % 3) * 0.7)}" fill="${k % 2 ? '#fff' : '#ffd24a'}"/>`;
  s += artLayer(n.art[i], w, top, h, polishSwatch(c));
  s += `<path d="M${f(-w * 0.32)} ${f(top + h * 0.25)} Q${f(-w * 0.3)} ${f(top + h * 0.08)} ${f(-w * 0.1)} ${f(top + h * 0.06)}" stroke="#fff" stroke-width="${f(w * 0.12)}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  if (wet) s += `<rect x="${f(-w)}" y="${f(top - w)}" width="${f(w * 0.5)}" height="${f(h * 2)}" fill="#fff" opacity="0.45" transform="rotate(20 0 ${f(top)})"><animate attributeName="x" values="${f(-w * 1.5)};${f(w)}" dur="1.6s" repeatCount="indefinite"/></rect>`;
  s += '</g>';
  s += `<path d="${d}" fill="none" stroke="${dark(polishSwatch(c), 0.2)}" stroke-width="1.5" opacity="0.6"/>`;
  if (n.gem[i]) s += gemArt(n.gem[i]!, 0, top + h * 0.6, w * 0.6);
  return s;
}

// The hand, seen from the back so the nails face us. Fingers sit side by side along the top of the
// palm and fan out a little; the thumb comes off the left side. Thumb is nail 0.
const FINGERS: { x: number; y: number; len: number; w: number; a: number }[] = [
  { x: 232, y: 522, len: 156, w: 62, a: -50 }, // thumb (its base hides under the palm)
  { x: 226, y: 372, len: 178, w: 55, a: -9 }, // index
  { x: 283, y: 360, len: 204, w: 57, a: -2 }, // middle
  { x: 339, y: 368, len: 186, w: 54, a: 5 }, // ring
  { x: 390, y: 388, len: 144, w: 47, a: 13 }, // pinky
];

/** A finger pointing up from (0,0): slightly tapered, with a round tip. */
const fingerD = (w: number, len: number) => {
  const tw = w * 0.46;
  return `M${f(-w / 2)} 40 L${f(-w / 2)} 0 C${f(-w / 2)} ${f(-len * 0.5)} ${f(-tw)} ${f(-len + tw * 1.2)} ${f(-tw)} ${f(-len + tw)} A${f(tw)} ${f(tw)} 0 0 1 ${f(tw)} ${f(-len + tw)} C${f(tw)} ${f(-len + tw * 1.2)} ${f(w / 2)} ${f(-len * 0.5)} ${f(w / 2)} 0 L${f(w / 2)} 40Z`;
};

export function handSvg(skin: string, n: Nails, wet: boolean, pick?: number): string {
  const sd = dark(skin, 0.16);
  const hi = light(skin, 0.35);
  const finger = (i: number) => {
    const fg = FINGERS[i];
    const d = fingerD(fg.w, fg.len);
    const tw = fg.w * 0.46;
    let g = `<g transform="translate(${fg.x} ${fg.y}) rotate(${fg.a})" data-nail="${i}" class="finger${pick === i ? ' pick' : ''}">`;
    g += `<path d="${d}" fill="${skin}" stroke="${sd}" stroke-width="2.5"/><path d="${d}" fill="url(#g-shadeX)"/>`;
    g += `<path d="M${f(-fg.w * 0.3)} ${f(-fg.len * 0.5)} C${f(-fg.w * 0.3)} ${f(-fg.len * 0.75)} ${f(-tw * 0.6)} ${f(-fg.len * 0.85)} ${f(-tw * 0.55)} ${f(-fg.len * 0.9)}" stroke="${hi}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.6"/>`;
    // knuckle creases
    for (const k of [0.36, 0.62]) g += `<path d="M${f(-fg.w * 0.2)} ${f(-fg.len * k)} q${f(fg.w * 0.2)} ${f(-4)} ${f(fg.w * 0.4)} 0" stroke="${sd}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.55"/>`;
    const nw = fg.w * 0.66;
    const nh = fg.len * (i === 0 ? 0.36 : 0.3);
    g += nailArt(n, i, nw, -fg.len + tw * 0.32, nh, wet);
    return g + '</g>';
  };
  const palmD = 'M190 378 C200 340 380 336 412 382 C428 400 432 452 424 500 C416 552 398 590 380 640 L222 640 C206 600 188 560 180 520 C172 470 176 410 190 378Z';
  // Outline only the sides so the fingers flow into the palm without a seam.
  const sides = 'M192 380 C176 410 172 470 180 520 C188 560 206 600 222 640 M410 384 C428 400 432 452 424 500 C416 552 398 590 380 640';
  const palm = `<path d="${palmD}" fill="${skin}"/><path d="${palmD}" fill="url(#g-shadeX)"/><path d="${sides}" fill="none" stroke="${sd}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M218 420 C230 470 236 540 240 600" stroke="${hi}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.4"/>` +
    [[228, 392], [284, 382], [340, 388], [390, 404]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 20}" rx="13" ry="5" fill="${sd}" opacity="0.28"/>`).join('') +
    `<path d="M300 470 q22 30 14 70" stroke="${sd}" stroke-width="2" fill="none" opacity="0.25"/>`;
  const cushion = `<rect x="104" y="600" width="392" height="128" rx="60" fill="#ffc7dc"/><rect x="104" y="600" width="392" height="128" rx="60" fill="url(#g-shadeY)"/>` +
    `<rect x="116" y="610" width="368" height="108" rx="52" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="9 7" opacity="0.85"/>` +
    [170, 430].map((x) => `<circle cx="${x}" cy="664" r="7" fill="#ff9ec7"/><circle cx="${x - 2}" cy="662" r="2.5" fill="#fff" opacity="0.7"/>`).join('') +
    `<path d="M130 624 Q300 596 470 624" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  const sleeve = `<path d="M214 630 L388 630 L404 760 L198 760Z" fill="#ff9ec7"/><path d="M214 630 L388 630 L404 760 L198 760Z" fill="url(#g-shadeX)"/><path d="M208 622 Q301 646 394 622 L398 646 Q301 670 204 646Z" fill="#ffffff"/>` +
    `<path d="M220 660 L380 660" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 6" opacity="0.7"/>`;
  // A soft fold where the thumb meets the hand.
  const thumbJoin = `<path d="M196 470 C204 500 214 520 232 536" stroke="${sd}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  const shadow = `<ellipse cx="300" cy="650" rx="140" ry="20" fill="#7a2a55" opacity="0.12"/>`;
  return `<svg viewBox="60 150 480 600" preserveAspectRatio="xMidYMid meet">${cushion}${shadow}${finger(0)}${finger(1)}${finger(2)}${finger(3)}${finger(4)}${palm}${thumbJoin}${sleeve}</svg>`;
}

function bottle(c: string): string {
  const fill = polishFill(c, `bt${++uidN}`);
  return `<svg viewBox="0 0 40 56"><defs>${fill.defs}</defs><rect x="13" y="2" width="14" height="18" rx="4" fill="#4a3f5e"/><rect x="15" y="4" width="3" height="14" rx="1.5" fill="#fff" opacity="0.3"/>` +
    `<path d="M8 22 Q8 18 12 18 L28 18 Q32 18 32 22 L33 48 Q33 54 27 54 L13 54 Q7 54 7 48Z" fill="${fill.fill}"/>` +
    (fill.extra === 'glitter' ? [8, 14, 20, 26, 30].map((x, i) => `<circle cx="${x + 1}" cy="${26 + (i * 7) % 24}" r="1.6" fill="${i % 2 ? '#fff' : '#ffd24a'}"/>`).join('') : '') +
    (fill.extra === 'galaxy' ? `<path d="${starD(20, 36, 6)}" fill="#ffe680"/><circle cx="12" cy="28" r="1.5" fill="#fff"/><circle cx="27" cy="46" r="1.5" fill="#9fe0ff"/>` : '') +
    `<path d="M11 24 Q11 22 13 22 L14 22 L14 50 L12 50 Q11 50 11 48Z" fill="#fff" opacity="0.45"/><path d="M8 22 Q8 18 12 18 L28 18 Q32 18 32 22 L33 48 Q33 54 27 54 L13 54 Q7 54 7 48Z" fill="none" stroke="${dark(polishSwatch(c), 0.25)}" stroke-width="1.2" opacity="0.6"/></svg>`;
}

type Tool = { kind: 'polish'; v: string } | { kind: 'art'; v: string } | { kind: 'gem'; v: string } | { kind: 'remove' };
type Tab = 'polish' | 'art' | 'gem' | 'shape';

export function openNails(dollId: string | undefined, onClose: () => void): void {
  const layer = document.getElementById('overlay')!;
  const root = el('div', 'closet nails show-later');
  layer.appendChild(root);
  requestAnimationFrame(() => root.classList.add('show'));
  let doll: Doll = G.s.dolls.find((d) => d.id === dollId) ?? G.s.dolls[0];
  let nails: Nails = structuredClone(doll.look.nails ?? emptyNails());
  let tool: Tool = { kind: 'polish', v: '#ff4f8b' };
  let tab: Tab = 'polish';
  let all = false;
  let wet = false;
  let changed = false;

  root.innerHTML = `
    <div class="closet-stage nail-stage">
      <div class="roster"></div>
      <div class="hand-view"></div>
      <div class="stage-bar">
        <button class="chip ${'all-chip'}" data-act="all">${icon('hand')}<span>All nails</span></button>
        <button class="round-btn" data-act="remove" title="Remove polish">${icon('eraser')}</button>
        <button class="round-btn" data-act="dry" title="Dry nails"><span class="fan">${icon('sun')}</span></button>
      </div>
    </div>
    <div class="closet-panel">
      <div class="panel-head"><h2>Nail Studio</h2><button class="btn primary done" data-act="done">${icon('check')}<span>Done</span></button></div>
      <div class="tabs"></div>
      <div class="sections"></div>
    </div>`;
  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const view = q<HTMLDivElement>('.hand-view');

  const renderHand = (pick?: number) => {
    view.innerHTML = handSvg(doll.look.skin, nails, wet, pick);
  };
  const renderRoster = () => {
    q<HTMLDivElement>('.roster').innerHTML = G.s.dolls.map((d) => `<button class="ava${d === doll ? ' on' : ''}" data-doll="${d.id}" title="${esc(d.name)}">${headThumb(d.look)}</button>`).join('');
  };
  const renderTabs = () => {
    const tabs: [Tab, string, string][] = [['polish', 'Polish', 'makeup'], ['art', 'Designs', 'star'], ['gem', 'Gems', 'heart'], ['shape', 'Shape', 'hand']];
    q<HTMLDivElement>('.tabs').innerHTML = tabs.map(([id, name, ic]) => `<button class="tab${tab === id ? ' on' : ''}" data-tab="${id}">${icon(ic)}<span>${name}</span></button>`).join('');
  };
  const sample = (patch: Partial<{ c: string; art: string; gem: string | null; shape: Nails['shape'] }>) => {
    const n: Nails = { shape: patch.shape ?? nails.shape, c: [patch.c ?? (tool.kind === 'polish' ? tool.v : nails.c[2] || '#ff9ec7')], art: [patch.art ?? 'none'], gem: [patch.gem ?? null] };
    return `<svg viewBox="-34 -80 68 92">${nailArt(n, 0, 44, -70, 62)}</svg>`;
  };
  const renderGrid = () => {
    const sec = q<HTMLDivElement>('.sections');
    let html = '';
    if (tab === 'polish') html = `<div class="sec"><h3>Polish colors</h3><div class="grid polish-grid">${POLISH.map((p) => `<button class="card bottle-card${tool.kind === 'polish' && tool.v === p.id ? ' on' : ''}" data-polish="${p.id}" title="${esc(p.name)}">${bottle(p.id)}<span class="lbl">${esc(p.name)}</span></button>`).join('')}</div></div>`;
    if (tab === 'art') html = `<div class="sec"><h3>Nail art</h3><div class="grid nail-grid">${ARTS.map((a) => `<button class="card${tool.kind === 'art' && tool.v === a ? ' on' : ''}" data-art="${a}">${sample({ art: a })}<span class="lbl">${ART_NAME[a]}</span></button>`).join('')}</div></div>`;
    if (tab === 'gem') html = `<div class="sec"><h3>Gems & charms</h3><div class="grid nail-grid">${GEMS.map((g) => `<button class="card${tool.kind === 'gem' && tool.v === g ? ' on' : ''}" data-gem="${g}">${sample({ gem: g })}<span class="lbl">${g[0].toUpperCase() + g.slice(1)}</span></button>`).join('')}<button class="card${tool.kind === 'gem' && tool.v === 'none' ? ' on' : ''}" data-gem="none"><span class="none-x">${icon('close')}</span><span class="lbl">No gem</span></button></div></div>`;
    if (tab === 'shape') html = `<div class="sec"><h3>Nail shape</h3><div class="grid nail-grid">${SHAPES.map((s) => `<button class="card${nails.shape === s.id ? ' on' : ''}" data-shape="${s.id}">${sample({ shape: s.id })}<span class="lbl">${s.name}</span></button>`).join('')}</div></div>`;
    sec.innerHTML = html + `<p class="hint nail-hint">${tab === 'shape' ? 'Shapes change every nail.' : all ? 'Tap any nail to do all five!' : 'Tap a nail on the hand to use it.'}</p>`;
  };
  const renderAll = () => {
    renderHand();
    renderRoster();
    renderTabs();
    renderGrid();
    q<HTMLButtonElement>('[data-act="all"]').classList.toggle('on', all);
  };

  const apply = (i: number) => {
    const idx = all ? [0, 1, 2, 3, 4] : [i];
    for (const k of idx) {
      if (tool.kind === 'polish') nails.c[k] = tool.v;
      if (tool.kind === 'art') {
        if (!nails.c[k]) nails.c[k] = '#ff9ec7';
        nails.art[k] = tool.v;
      }
      if (tool.kind === 'gem') {
        if (!nails.c[k]) nails.c[k] = '#ffc7dc';
        nails.gem[k] = tool.v === 'none' ? null : tool.v;
      }
      if (tool.kind === 'remove') {
        nails.c[k] = '';
        nails.art[k] = 'none';
        nails.gem[k] = null;
      }
    }
    changed = true;
    wet = tool.kind !== 'remove' && tool.kind !== 'gem' ? true : wet;
    if (tool.kind === 'gem') sound.pop();
    else if (tool.kind === 'remove') sound.whoosh();
    else sound.spray();
    renderHand(all ? undefined : i);
    const fg = view.querySelector(`[data-nail="${i}"]`)?.getBoundingClientRect();
    if (fg) burst('sparkle', fg.left + fg.width / 2, fg.top + 10, all ? 12 : 6);
  };

  root.addEventListener('click', (e) => {
    const t = e.target as Element;
    const v = (sel: string) => (t.closest(`[${sel}]`) as HTMLElement | null)?.getAttribute(sel);
    const av = v('data-doll');
    if (av) {
      save();
      doll = G.s.dolls.find((d) => d.id === av) ?? doll;
      nails = structuredClone(doll.look.nails ?? emptyNails());
      wet = false;
      sound.giggle();
      return renderAll();
    }
    const tb = v('data-tab');
    if (tb) {
      tab = tb as Tab;
      sound.tap();
      renderTabs();
      return renderGrid();
    }
    const pol = v('data-polish');
    if (pol) {
      tool = { kind: 'polish', v: pol };
      sound.tap();
      return renderGrid();
    }
    const art = v('data-art');
    if (art) {
      tool = { kind: 'art', v: art };
      sound.tap();
      return renderGrid();
    }
    const gem = v('data-gem');
    if (gem) {
      tool = { kind: 'gem', v: gem };
      sound.tap();
      return renderGrid();
    }
    const sh = v('data-shape');
    if (sh) {
      nails.shape = sh as Nails['shape'];
      changed = true;
      sound.pop();
      renderHand();
      return renderGrid();
    }
    const nail = v('data-nail');
    if (nail !== null && nail !== undefined) return apply(Number(nail));
    const act = v('data-act');
    if (act === 'all') {
      all = !all;
      sound.tap();
      q<HTMLButtonElement>('[data-act="all"]').classList.toggle('on', all);
      return renderGrid();
    }
    if (act === 'remove') {
      tool = { kind: 'remove' };
      sound.tap();
      toast('Tap a nail to wipe it clean.', 'eraser');
      return renderGrid();
    }
    if (act === 'dry') {
      const fan = q<HTMLElement>('.fan');
      fan.classList.remove('spin');
      void fan.offsetWidth;
      fan.classList.add('spin');
      sound.whoosh();
      window.setTimeout(() => {
        wet = false;
        renderHand();
        const r = view.getBoundingClientRect();
        burst('sparkle', r.left + r.width / 2, r.top + r.height * 0.3, 24);
        sound.sparkle();
        toast('Nails are dry. So fabulous!', 'star');
      }, 900);
      return;
    }
    if (act === 'done') close();
  });

  function save(): void {
    if (!changed) return;
    doll.look.nails = structuredClone(nails);
    const painted = nails.c.filter(Boolean).length;
    if (painted) {
      G.bump('manicure');
      G.earn(4 + painted * 2, { x: window.innerWidth * 0.3, y: window.innerHeight * 0.4 });
      celebrate();
    } else G.changed();
    changed = false;
  }

  function close(): void {
    save();
    sound.tap();
    root.classList.remove('show');
    window.setTimeout(() => root.remove(), 260);
    onClose();
  }

  renderAll();
  if (!G.s.stats['hint-nails']) {
    G.s.stats['hint-nails'] = 1;
    window.setTimeout(() => toast('Pick a polish, then tap a nail to paint it!', 'makeup'), 500);
  }
}
