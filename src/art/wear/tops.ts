// Tops: 16 cuts, each in eight versions with its own print, color and trim.
import { sideX } from '../body';
import { dark, light } from '../color';
import type { Pattern } from '../defs';
import { MOTIFS, MOTIF_BY_ID, accentFor, motif } from '../motifs';
import type { Season } from '../../types';
import { type Hem, type Sleeve, type TopOpts, type WearCtx, type WearDef, buttons, chestY, hemY, hoodBack, line, P, sleeve, strap, topBody, bowG } from './base';
import { band, lace, patch, pocket, ruffle, sequins, stripes } from './trims';

type Trim = 'none' | 'band' | 'stripes' | 'lace' | 'ruffle' | 'sequins' | 'pocket' | 'bow';

interface Cut {
  key: string;
  name: string;
  hem: Hem;
  sleeve: Sleeve;
  neck?: TopOpts['neck'];
  strapless?: boolean;
  flare?: number;
  tags?: Season[];
  /** Extra cost for fancier cuts. */
  premium?: number;
  motifs: string[];
  trims: Trim[];
  /** The cut's own details (hoodie pocket, collar...). */
  deco?: (x: WearCtx, accent: string) => string;
  back?: (x: WearCtx) => string;
  motifY?: number;
  motifR?: number;
  /** Sleeve color, when the sleeves differ from the body (baseball tee, shirt under a vest). */
  armColor?: (c: string, accent: string) => string;
  /** Print on the chest pocket instead of the middle. */
  pocketMotif?: boolean;
  /** Pattern every version of this cut comes with (e.g. flannel checks). */
  basePattern?: Pattern;
  colors?: string[];
  group?: string;
}

const collar = (x: WearCtx, c = '#ffffff') => {
  const y = x.b.shY;
  const st = `stroke="${dark(x.c, 0.15)}" stroke-width="1"`;
  return P(`M-1 ${y + 1} Q-20 ${y - 2} -22 ${y + 8} Q-20 ${y + 20} -2 ${y + 14}Z`, c, st) + P(`M1 ${y + 1} Q20 ${y - 2} 22 ${y + 8} Q20 ${y + 20} 2 ${y + 14}Z`, c, st);
};

const shirtCollar = (x: WearCtx, c: string) => {
  const y = x.b.shY;
  return P(`M-2 ${y + 1} L-20 ${y - 3} L-13 ${y + 15}Z`, c, `stroke="${dark(c, 0.2)}" stroke-width="1"`) + P(`M2 ${y + 1} L20 ${y - 3} L13 ${y + 15}Z`, c, `stroke="${dark(c, 0.2)}" stroke-width="1"`);
};
const placket = (x: WearCtx, n = 4) => line(0, x.b.shY + 12, 0, hemY(x.b, 'hip') - 2, dark(x.c, 0.18), 1.4) + buttons(x, n, x.b.shY + 16, hemY(x.b, 'hip') - 10, '#ffffff');

const CUTS: Cut[] = [
  { key: 'tee', name: 'Tee', hem: 'hip', sleeve: 'short', motifs: ['strawberry', 'rainbow', 'kitty', 'bunny', 'smiley', 'unicorn', 'avocado', 'hi'], trims: ['none', 'band', 'none', 'stripes'] },
  { key: 'longtee', name: 'Long Sleeve Tee', hem: 'hip', sleeve: 'long', motifs: ['star', 'planet', 'moon', 'dino', 'panda', 'cloud', 'snowflake', 'cute'], trims: ['none', 'stripes', 'band'], tags: ['fall', 'spring'] },
  { key: 'tank', name: 'Tank Top', hem: 'hip', sleeve: 'none', strapless: true, tags: ['summer'], motifs: ['lemon', 'watermelon', 'sun', 'cherry', 'icecream', 'fish', 'sunflower', 'heart'], trims: ['none', 'ruffle', 'band'], deco: (x) => strap(x) },
  { key: 'crop', name: 'Crop Top', hem: 'crop', sleeve: 'short', tags: ['summer'], motifs: ['heart', 'star', 'bolt', 'gem', 'xo', 'cherry', 'butterfly', 'candy'], trims: ['none', 'ruffle', 'sequins'], motifR: 11, motifY: -4 },
  {
    key: 'puff', name: 'Puff Blouse', hem: 'hip', sleeve: 'puff', motifs: ['daisy', 'tulip', 'ribbon', 'strawberry', 'cherry', 'bunny', 'heart', 'butterfly'], trims: ['lace', 'none', 'bow'],
    deco: (x) => collar(x) + buttons(x, 3, x.b.shY + 24, x.b.hipY - 8, '#ffffff'), motifR: 9, motifY: 6,
  },
  {
    key: 'hoodie', name: 'Hoodie', hem: 'hip', sleeve: 'long', tags: ['fall', 'winter'], motifs: ['bear', 'unicorn', 'dino', 'kitty', 'panda', 'rainbow', 'ghost', 'cute'], trims: ['none', 'band'], back: hoodBack, motifY: -6, motifR: 14,
    deco: (x, a) => {
      const { b } = x;
      const py = b.waistY + 6;
      return P(`M-24 ${py} L24 ${py} L30 ${b.hipY + 2} L-30 ${b.hipY + 2}Z`, dark(x.c, 0.1)) + line(-7, b.shY + 6, -9, b.shY + 30, a, 2.5) + line(7, b.shY + 6, 9, b.shY + 30, a, 2.5) +
        `<rect x="${-b.hiW}" y="${b.hipY + 1}" width="${b.hiW * 2}" height="8" rx="3" fill="${dark(x.c, 0.15)}"/>`;
    },
  },
  {
    key: 'sweater', name: 'Sweater', hem: 'hip', sleeve: 'long', tags: ['fall', 'winter'], motifs: ['snowflake', 'heart', 'leaf', 'apple', 'star', 'pumpkin', 'bear', 'candy'], trims: ['band', 'band', 'stripes'],
    deco: (x) => {
      let s = '';
      const y = x.b.shY + 12;
      for (let i = -3; i <= 3; i++) s += P(`M${i * 11 - 4} ${y} l4 5 l4 -5`, 'none', `stroke="${light(x.c, 0.4)}" stroke-width="2" stroke-linejoin="round"`);
      return s;
    },
  },
  { key: 'polo', name: 'Polo', hem: 'hip', sleeve: 'short', neck: 'v', motifs: ['crown', 'star', 'heart', 'paw', 'apple', 'note', 'bolt', 'planet'], trims: ['stripes', 'none'], deco: (x) => collar(x, '#ffffff') + buttons(x, 2, x.b.shY + 28, x.b.shY + 40, '#eee'), motifR: 7, motifY: 0 },
  {
    key: 'offshoulder', name: 'Ruffle Top', hem: 'hip', sleeve: 'none', strapless: true, tags: ['summer'], motifs: ['daisy', 'sunflower', 'cherry', 'lemon', 'heart', 'butterfly', 'tulip', 'strawberry'], trims: ['none', 'band'], premium: 10, motifY: 8, motifR: 10,
    deco: (x) => ruffle(-x.b.shW - 7, x.b.shW + 7, x.b.shY + 20, light(x.c, 0.2), 10, 8),
  },
  {
    key: 'cami', name: 'Cami', hem: 'hip', sleeve: 'none', strapless: true, tags: ['summer'], motifs: ['heart', 'ribbon', 'star', 'gem', 'moon', 'butterfly', 'daisy', 'xo'], trims: ['lace', 'none'], motifR: 9, motifY: 4,
    deco: (x) => {
      const y = x.b.shY + 16;
      return [-1, 1].map((s) => line(s * 15, x.b.shY - 1, s * 16, y, dark(x.c, 0.1), 2.4)).join('') + lace(-sideX(x.b, y) - 1, sideX(x.b, y) + 1, y + 3, '#ffffff');
    },
  },
  { key: 'peplum', name: 'Peplum Top', hem: 'long', sleeve: 'cap', flare: 14, premium: 10, motifs: ['ribbon', 'gem', 'crown', 'heart', 'daisy', 'star', 'butterfly', 'tulip'], trims: ['ruffle', 'lace', 'none'], motifR: 10, motifY: -2, deco: (x) => band(-sideX(x.b, x.b.waistY) - 1, sideX(x.b, x.b.waistY) + 1, x.b.waistY - 1, 6, dark(x.c, 0.15)) },
  {
    key: 'turtle', name: 'Turtleneck', hem: 'hip', sleeve: 'long', neck: 'none', tags: ['winter', 'fall'], motifs: ['snowflake', 'star', 'moon', 'heart', 'leaf', 'cloud', 'note', 'planet'], trims: ['band', 'none'], motifR: 12,
    deco: (x) => `<rect x="-15" y="${x.b.shY - 12}" width="30" height="18" rx="6" fill="${dark(x.c, 0.08)}"/>` + [-8, 0, 8].map((dx) => line(dx, x.b.shY - 9, dx, x.b.shY + 3, dark(x.c, 0.2), 1.5)).join(''),
  },
  {
    key: 'jersey', name: 'Sports Jersey', hem: 'hip', sleeve: 'short', neck: 'v', motifs: ['star', 'bolt', 'heart', 'crown', 'paw', 'sun', 'moon', 'planet'], trims: ['stripes', 'stripes', 'band'], motifR: 7, motifY: -14,
    deco: (x, a) => {
      const n = 1 + (x.c.charCodeAt(2) % 9);
      return `<text x="0" y="${(chestY(x.b) + 18).toFixed(1)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="30" text-anchor="middle" fill="${a}" stroke="${dark(a, 0.3)}" stroke-width="1">${n}</text>`;
    },
  },
  {
    key: 'bell', name: 'Bell Sleeve Blouse', hem: 'hip', sleeve: 'flare', neck: 'scoop', premium: 10, motifs: ['daisy', 'butterfly', 'tulip', 'leaf', 'sunflower', 'heart', 'moon', 'star'], trims: ['none', 'lace', 'band'], motifR: 11,
    deco: (x, a) => `<g transform="translate(0 ${x.b.shY + 18}) scale(0.5)">${bowG(0, 0, 1, a)}</g>`,
  },
  {
    key: 'sailor', name: 'Sailor Top', hem: 'hip', sleeve: 'short', neck: 'v', motifs: ['star', 'fish', 'heart', 'moon', 'cloud', 'sun', 'ribbon', 'crown'], trims: ['none', 'stripes'], motifR: 8, motifY: 14,
    deco: (x, a) => {
      const y = x.b.shY;
      return P(`M-24 ${y} L-14 ${y} L0 ${y + 24} L14 ${y} L24 ${y} L30 ${y + 22} L0 ${y + 36} L-30 ${y + 22}Z`, a) + P(`M-26 ${y + 16} L0 ${y + 30} L26 ${y + 16}`, 'none', 'stroke="#fff" stroke-width="2"') +
        `<g transform="translate(0 ${y + 32}) scale(0.5)">${bowG(0, 0, 1, '#ff4f6d')}</g>`;
    },
  },
  {
    key: 'tunic', name: 'Tunic', hem: 'long', sleeve: 'long', flare: 6, tags: ['fall', 'spring'], motifs: ['leaf', 'daisy', 'tulip', 'sunflower', 'butterfly', 'apple', 'star', 'moon'], trims: ['band', 'lace', 'none'], motifR: 12,
    deco: (x, a) => `<rect x="${(-sideX(x.b, x.b.waistY + 6) - 1).toFixed(1)}" y="${(x.b.waistY + 2).toFixed(1)}" width="${(sideX(x.b, x.b.waistY + 6) * 2 + 2).toFixed(1)}" height="7" rx="3" fill="${a}"/>`,
  },
  {
    key: 'buttonup', name: 'Button-Up Shirt', hem: 'hip', sleeve: 'short', neck: 'v', motifs: ['shark', 'rocket', 'star', 'fish', 'racecar', 'dino', 'planet', 'bolt'], trims: ['pocket', 'none'], pocketMotif: true,
    colors: ['#9fd6ff', '#ffffff', '#a8e6cf', '#ffe680', '#f4ead9', '#c99bff'], deco: (x) => shirtCollar(x, light(x.c, 0.25)) + placket(x),
  },
  {
    key: 'flannel', name: 'Flannel Shirt', hem: 'hip', sleeve: 'long', neck: 'v', tags: ['fall', 'winter'], basePattern: 'check', motifs: ['leaf', 'star', 'bear', 'paw', 'moon', 'apple', 'dino', 'pumpkin'], trims: ['none', 'pocket'], pocketMotif: true,
    colors: ['#e8384f', '#3f4f9a', '#3fbf8f', '#8a5a3c', '#9b6bff', '#ffab5e'], deco: (x) => shirtCollar(x, dark(x.c, 0.1)) + placket(x),
  },
  {
    key: 'raglan', name: 'Baseball Tee', hem: 'hip', sleeve: 'long', motifs: ['soccer', 'star', 'bolt', 'racecar', 'robot', 'gamepad', 'rocket', 'paw'], trims: ['none'], motifR: 15,
    colors: ['#ffffff', '#f4ead9', '#e6e0ee'], armColor: (_c, a) => a,
  },
  {
    key: 'rugby', name: 'Rugby Shirt', hem: 'hip', sleeve: 'long', neck: 'v', motifs: ['star', 'crown', 'soccer', 'bolt', 'paw', 'heart', 'shark', 'planet'], trims: ['none'], motifR: 8, motifY: -18, pocketMotif: false,
    colors: ['#3f4f9a', '#e8384f', '#3fbf8f', '#ffd36b', '#9b6bff', '#ff7eb6'],
    deco: (x, a) => {
      let s = '';
      for (let y = x.b.shY + 30; y < hemY(x.b, 'hip') - 4; y += 18) s += `<rect x="${(-sideX(x.b, y + 5) - 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(sideX(x.b, y + 5) * 2 + 2).toFixed(1)}" height="8" fill="${a}"/>`;
      return s + shirtCollar(x, '#ffffff') + buttons(x, 2, x.b.shY + 14, x.b.shY + 22, '#ffffff');
    },
  },
  {
    key: 'vest', name: 'Shirt & Vest', group: 'Shirts & Vests', hem: 'hip', sleeve: 'long', neck: 'v', premium: 15, motifs: ['star', 'crown', 'heart', 'note', 'bolt', 'gem', 'moon', 'planet'], trims: ['none'], motifR: 6, motifY: -6, pocketMotif: true,
    colors: ['#3f4f9a', '#4a4a5e', '#8a5a3c', '#3fbf8f', '#9b6bff', '#e8384f'], armColor: () => '#ffffff',
    deco: (x) => {
      const { b } = x;
      const hem = hemY(b, 'hip');
      const vest = [-1, 1].map((s) => `<path d="M${s * 2} ${b.shY + 30} L${s * 15} ${b.shY + 2} L${s * (b.shW - 6)} ${b.shY + 6} L${s * (sideX(b, hem) + 1)} ${hem} Q${s * 10} ${hem + 10} ${s * 2} ${hem + 6}Z" fill="${x.c}"/>`).join('');
      return `<path d="${'M-12 ' + b.shY + ' L12 ' + b.shY + ' L4 ' + (b.shY + 40) + ' L-4 ' + (b.shY + 40) + 'Z'}" fill="#ffffff"/>` + vest + shirtCollar(x, '#ffffff') + buttons(x, 3, b.shY + 40, hem - 6, '#ffd24a', 6);
    },
  },
];

const PATTERNS: Pattern[] = ['dots', 'stripes', 'hearts', 'stars', 'check', 'flowers'];
const TRIM_NAMES: Partial<Record<Trim, string>> = { ruffle: 'Ruffle', lace: 'Lace', sequins: 'Sparkle', stripes: 'Sporty' };

function trimArt(x: WearCtx, t: Trim, hem: number, flare: number, a: string): string {
  const w = sideX(x.b, hem, flare) + 1;
  switch (t) {
    case 'band':
      return band(-w, w, hem - 8, 9, dark(x.c, 0.14));
    case 'stripes':
      return stripes(-w, w, hem - 16, a);
    case 'lace':
      return lace(-w - 1, w + 1, hem + 2);
    case 'ruffle':
      return ruffle(-w - 3, w + 3, hem + 6, light(x.c, 0.25), 8, 7);
    case 'sequins':
      return sequins(-w + 4, x.b.shY + 10, w * 2 - 8, hem - x.b.shY - 16);
    case 'pocket':
      return pocket(-w * 0.45, x.b.waistY, 16, 14, dark(x.c, 0.08));
    case 'bow':
      return `<g transform="translate(0 ${(x.b.shY + 6).toFixed(1)}) scale(0.5)">${bowG(0, 0, 1, a)}</g>`;
    default:
      return '';
  }
}

function makeTop(cut: Cut, i: number): WearDef {
  const m = MOTIF_BY_ID[cut.motifs[i % cut.motifs.length]] ?? MOTIFS[0];
  const color = cut.colors ? cut.colors[i % cut.colors.length] : m.bg[(i + cut.key.length) % m.bg.length];
  const accent = accentFor(color);
  const trim = cut.trims[i % cut.trims.length];
  const usePattern = !cut.basePattern && (i === 5 || i === 7);
  const pattern: Pattern = cut.basePattern ?? (usePattern ? PATTERNS[(i + cut.key.length) % PATTERNS.length] : 'none');
  const tags = [...new Set([...(cut.tags ?? []), ...(m.season ? [m.season] : [])])] as Season[];
  const opts: TopOpts = { hem: cut.hem, sleeve: cut.sleeve, neck: cut.neck, strapless: cut.strapless, flare: cut.flare, back: cut.back };
  const draw = (x: WearCtx) => {
    const hem = hemY(x.b, cut.hem);
    let s = topBody(x, opts);
    if (cut.deco) s += cut.deco(x, accent);
    s += trimArt(x, trim, hem, cut.flare ?? 0, accent);
    const my = chestY(x.b) + 6 + (cut.motifY ?? 0) + (x.b.age === 'adult' ? 6 : 0);
    const r = (cut.motifR ?? 16) * (x.b.age === 'kid' ? 1 : 1.12);
    if (cut.pocketMotif) s += pocket(-16, my - 8, 18, 16, dark(x.c, 0.08)) + motif(m.id, -16, my + 0.5, 6.5);
    else s += usePattern ? patch(m.id, -16, my - 4, r * 0.62, '#ffffff') : motif(m.id, 0, my, r);
    return s;
  };
  const free = i < 3;
  const label = trim !== 'none' && TRIM_NAMES[trim] && i % 2 === 1 ? `${TRIM_NAMES[trim]} ` : '';
  return {
    id: `top-${cut.key}-${m.id}`,
    name: `${m.name} ${label}${cut.name}`,
    slot: 'top',
    group: cut.group ?? cut.name + (cut.name.endsWith('s') ? '' : 's'),
    price: free ? 0 : 15 + (i - 3) * 6 + (cut.premium ?? 0),
    color,
    pattern,
    tags: tags.length ? tags : undefined,
    body: draw,
    arm: (x) => sleeve(cut.armColor ? { ...x, c: cut.armColor(x.c, accentFor(x.c)), p: 'none' } : x, cut.sleeve, 3),
    back: cut.back,
  };
}

export const TOPS_MORE: WearDef[] = CUTS.flatMap((c) => c.motifs.map((_, i) => makeTop(c, i)));
