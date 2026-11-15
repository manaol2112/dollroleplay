// Show Time at the mall: a runway fashion show scored by three friendly animal judges, and a dance
// party rhythm game on a disco floor. Everything is kind: every model and dancer gets a prize.
import './showtime.css';
import { body } from '../art/body';
import { hexToRgb } from '../art/color';
import { renderDoll } from '../art/doll';
import { WEAR_BY_ID, bowG, flowerG, heartD, sparkleD, starD } from '../art/wear';
import { drum, duckMusic, pianoNote, playNote, sound, type Drum, type Instrument } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G } from '../game';
import type { Doll, Look, Slot } from '../types';
import { frame } from './activities';
import { esc, headThumb, still } from './dom';
import { icon } from './icons';

const NS = 'http://www.w3.org/2000/svg';
const f = (n: number) => n.toFixed(1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Timers and animations for one run of a screen; kill() stops them all at once. */
function life() {
  let alive = true;
  const timers = new Set<number>();
  const offs: (() => void)[] = [];
  const wait = (ms: number) => new Promise<void>((res) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (alive) res();
    }, ms);
    timers.add(id);
  });
  const tween = (ms: number, fn: (t: number) => void) => new Promise<void>((res) => {
    const t0 = performance.now();
    const step = (now: number) => {
      if (!alive) return;
      const t = clamp((now - t0) / ms, 0, 1);
      fn(t);
      if (t < 1) requestAnimationFrame(step);
      else res();
    };
    requestAnimationFrame(step);
  });
  return {
    wait,
    tween,
    get alive() {
      return alive;
    },
    onKill: (fn: () => void) => offs.push(fn),
    kill: () => {
      if (!alive) return;
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      offs.splice(0).forEach((fn) => fn());
    },
  };
}
type Life = ReturnType<typeof life>;

// ---------------- music: little synth grooves played step by step ----------------
const NOTE_OF: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "C4" is 60, "F#5" is 78. */
export function midiOf(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 0;
  return 12 * (Number(m[3]) + 1) + NOTE_OF[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/** A melody written as eighth notes, eight per bar; "." is a rest. */
const mel = (s: string) => s.split(/[\s|]+/).filter(Boolean).map((t) => (t === '.' ? 0 : midiOf(t)));

const CHORD: Record<string, number[]> = {
  C: [60, 64, 67], G: [55, 59, 62], Am: [57, 60, 64], F: [53, 57, 60], Dm: [50, 53, 57], Em: [52, 55, 59],
  Bb: [58, 62, 65], D: [50, 54, 57], E: [52, 56, 59], A: [57, 61, 64],
};

export interface Groove {
  id: string;
  name: string;
  bpm: number;
  /** Shown on the song card. */
  tag: string;
  c1: string;
  c2: string;
  lead: Instrument;
  /** Semitones added to the melody for this lead (some voices sound an octave up). */
  shift: number;
  /** Piano chords on the beat, or a harp/xylophone arpeggio. */
  comp: 'stab' | 'arp';
  compInst: Instrument;
  chords: string[];
  mel: number[];
  /** 16 steps per bar; "x" plays. */
  drums: Partial<Record<Drum, string>>;
  /** 16 steps: r root, o octave up, f fifth, "." nothing. */
  bass: string;
  intro: Drum[];
}

export const SONGS: Groove[] = [
  {
    id: 'pop', name: 'Pop Party', bpm: 112, tag: 'Bouncy', c1: '#ff9ec7', c2: '#ff5c9a', lead: 'xylophone', shift: -12, comp: 'stab', compInst: 'piano',
    chords: ['C', 'G', 'Am', 'F'],
    mel: mel(`E5 . G5 . G5 . E5 G5 | D5 . G5 . B4 . D5 . | C5 . E5 . A5 . G5 E5 | F5 . E5 . D5 . C5 . |
              E5 E5 G5 . C6 . G5 . | B5 . A5 . G5 . D5 . | C5 . E5 . A5 . C6 . | A5 . G5 . F5 E5 D5 .`),
    drums: { kick: 'x...x...x...x...', clap: '....x.......x...', hihat: '..x...x...x...x.' },
    bass: 'r.....r.o.....r.', intro: ['kick', 'hihat'],
  },
  {
    id: 'disco', name: 'Disco Star', bpm: 120, tag: 'Groovy', c1: '#c99bff', c2: '#7b4dff', lead: 'violin', shift: 0, comp: 'stab', compInst: 'piano',
    chords: ['Am', 'Dm', 'G', 'C'],
    mel: mel(`A4 . C5 . E5 . D5 C5 | D5 . F5 . A5 . F5 . | G5 . F5 . E5 . D5 . | E5 . . . C5 . . . |
              A5 . G5 . E5 . C5 . | D5 . F5 . A5 . G5 F5 | G5 . B5 . D6 . B5 . | C6 . . . G5 . E5 .`),
    drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hihat: 'x.x.x.x.x.x.x.x.', cowbell: '..........x.....' },
    bass: 'r.o.r.o.r.o.r.o.', intro: ['kick', 'hihat'],
  },
  {
    id: 'kpop', name: 'K-pop Sparkle', bpm: 128, tag: 'Fast!', c1: '#7cc8ff', c2: '#4f7dff', lead: 'xylophone', shift: -12, comp: 'stab', compInst: 'piano',
    chords: ['Dm', 'Bb', 'C', 'F'],
    mel: mel(`D5 . F5 A5 . A5 G5 F5 | F5 . D5 . . . C5 D5 | E5 . G5 . C6 . A5 G5 | A5 . . . F5 . . . |
              D6 . C6 A5 . A5 C6 D6 | D6 . A5 . F5 . G5 A5 | G5 . E5 . C5 . E5 G5 | F5 . . . A5 . . .`),
    drums: { kick: 'x.....x...x.....', clap: '....x.......x...', hihat: 'x.xxx.xxx.xxx.xx', tom1: '..............x.' },
    bass: 'r..r..r.o..r..r.', intro: ['kick', 'hihat'],
  },
  {
    id: 'ballet', name: 'Slow Ballet', bpm: 90, tag: 'Slow & dreamy', c1: '#ffd9ef', c2: '#ff9ec7', lead: 'violin', shift: 0, comp: 'arp', compInst: 'harp',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'],
    mel: mel(`E5 . . . G5 . . . | A5 . . . E5 . . . | F5 . A5 . C6 . A5 . | G5 . . . D5 . . . |
              E5 . G5 . C6 . . . | B5 . . . G5 . E5 . | F5 . A5 . G5 . F5 . | D5 . . . G5 . . .`),
    drums: { kick: 'x...............', hihat: '....x...x...x...' },
    bass: 'r.......f.......', intro: ['hihat'],
  },
  {
    id: 'bubble', name: 'Bubble Gum Bop', bpm: 104, tag: 'Happy', c1: '#7fe0b0', c2: '#2fbf8f', lead: 'piano', shift: 0, comp: 'arp', compInst: 'xylophone',
    chords: ['G', 'Em', 'C', 'D'],
    mel: mel(`B4 . D5 . G5 . D5 . | E5 . G5 . B5 . G5 . | C5 . E5 . G5 A5 G5 . | F#5 . A5 . D5 . . . |
              G5 . B5 . D6 . B5 . | B5 . G5 . E5 . G5 . | E5 . G5 . C6 . E5 . | D5 . F#5 . A5 . . .`),
    drums: { kick: 'x......xx.......', clap: '....x.......x...', hihat: '..x...x...x...x.', cowbell: 'x.......x.......' },
    bass: 'r...o...r...o.r.', intro: ['kick', 'cowbell'],
  },
];

/** Plays step i (sixteenth notes) of a groove: intro bars are drums only, then the song, then one final chord. */
function playStep(g: Groove, i: number, introBars: number, bodyBars: number): void {
  const bar = Math.floor(i / 16);
  const p = i % 16;
  if (bar < introBars) {
    for (const d of g.intro) if (g.drums[d]?.[p] === 'x') drum(d);
    return;
  }
  const b = bar - introBars;
  if (b >= bodyBars) {
    if (p === 0) {
      drum('cymbal');
      drum('kick');
      const ch = CHORD[g.chords[0]];
      ch.forEach((m) => pianoNote(m + 12, 0.12));
      playNote(g.lead, ch[0] + 12 + g.shift);
    }
    return;
  }
  for (const [d, pat] of Object.entries(g.drums)) if (pat?.[p] === 'x') drum(d as Drum);
  const ch = CHORD[g.chords[b % g.chords.length]] ?? CHORD.C;
  const bc = g.bass[p];
  if (bc === 'r') playNote('guitar', ch[0]);
  else if (bc === 'o') playNote('guitar', ch[0] + 12);
  else if (bc === 'f') playNote('guitar', ch[2]);
  if (g.comp === 'stab' && (p === 0 || p === 10)) ch.forEach((m) => pianoNote(m + 12, 0.06));
  if (g.comp === 'arp' && p % 2 === 0) {
    const ext = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12, ch[0] + 12, ch[2], ch[1]];
    playNote(g.compInst, ext[p / 2]);
  }
  if (p % 2 === 0) {
    const m = g.mel[(b * 8 + p / 2) % g.mel.length];
    if (m) playNote(g.lead, m + g.shift);
  }
}

/** Fires a callback on every sixteenth note, on a steady clock. */
class Seq {
  private timer = 0;
  private i = 0;
  t0 = 0;
  readonly dt: number;
  constructor(bpm: number, private total: number, private onStep: (i: number) => void, private onEnd?: () => void) {
    this.dt = 60000 / bpm / 4;
  }
  start(at = performance.now() + 120): this {
    this.t0 = at;
    this.i = 0;
    this.timer = window.setInterval(() => this.tick(), 8);
    return this;
  }
  private tick(): void {
    const now = performance.now();
    while (this.i < this.total && this.t0 + this.i * this.dt <= now + 4) {
      // After the tab was hidden, skip the missed steps quietly instead of playing them all at once.
      if (now - (this.t0 + this.i * this.dt) < 150) this.onStep(this.i);
      this.i++;
    }
    if (this.i >= this.total) {
      this.stop();
      this.onEnd?.();
    }
  }
  stop(): void {
    window.clearInterval(this.timer);
    this.timer = 0;
  }
  timeOf(i: number): number {
    return this.t0 + i * this.dt;
  }
}

// ---------------- fashion show scoring ----------------
export type ThemeId = 'free' | 'party' | 'beach' | 'winter' | 'princess' | 'sporty' | 'pajama' | 'rainbow';
export interface Theme {
  id: ThemeId;
  name: string;
  ideas: string;
  c1: string;
  c2: string;
  kw: RegExp | null;
  tag?: 'summer' | 'winter';
  cheer: string;
  award: string;
  lead: Instrument;
  shift: number;
  bpm: number;
}
const kw = (words: string) => new RegExp(`\\b(${words})`, 'i');
export const THEMES: Theme[] = [
  { id: 'free', name: 'Free Style', ideas: 'Wear anything you love!', c1: '#fff0f7', c2: '#ffb3d6', kw: null, cheer: 'So creative!', award: 'Most Creative', lead: 'xylophone', shift: -12, bpm: 116 },
  { id: 'party', name: 'Party', ideas: 'Ideas: sparkles, a tutu, party shoes, a balloon', c1: '#ffe0f0', c2: '#ff7eb6', kw: kw('party|sparkl|glitter|sequin|tutu|heel|balloon|boa|gem|disco|bolero|glam|pearl|bow tie|cake|cupcake|confetti|tiara|crown'), cheer: 'Party star!', award: 'Party Star', lead: 'xylophone', shift: -12, bpm: 118 },
  { id: 'beach', name: 'Beach Day', ideas: 'Ideas: a swimsuit, sun hat, sandals, sunglasses', c1: '#fff6cc', c2: '#7cd6ff', kw: kw('swim|sun|sand|flip|slide|board short|lei|shell|sunglass|bucket|beach|surf|ocean|mermaid|jelly|straw|aviator|cutoff|ice cream|popsicle|fish|sea|tropic|hawai|palm|watermelon|lemon|tank'), tag: 'summer', cheer: 'Beach ready!', award: 'Beach Star', lead: 'guitar', shift: 12, bpm: 108 },
  { id: 'winter', name: 'Winter Wonderland', ideas: 'Ideas: a coat, scarf, boots, a beanie', c1: '#eef8ff', c2: '#9fd0ff', kw: kw('coat|scarf|boot|beanie|mitten|snow|puffer|parka|fleece|sherpa|sweater|ear warm|earmuff|ski|fluff|fuzzy|turtleneck|duffle|knit|ice skate|cocoa|holiday|winter|penguin|reindeer|santa|frost'), tag: 'winter', cheer: 'Snow cute!', award: 'Snow Star', lead: 'xylophone', shift: 0, bpm: 104 },
  { id: 'princess', name: 'Princess Ball', ideas: 'Ideas: a ball gown, tiara, magic wand', c1: '#fff0fb', c2: '#d9a6ff', kw: kw('gown|tiara|crown|princess|fairy|wand|cape|pearl|royal|slipper|mary jane|wing|locket|gem|glitter|ballet|jewel|velvet'), cheer: 'Royal look!', award: 'Royal Star', lead: 'harp', shift: 0, bpm: 100 },
  { id: 'sporty', name: 'Sporty', ideas: 'Ideas: a jersey, sneakers, shorts, a cap', c1: '#e9fff4', c2: '#5fd3b5', kw: kw('jersey|sneaker|shorts|sport|track|cleat|jogger|legging|cap\\b|tennis|baseball|soccer|basket|varsity|windbreaker|sweatband|high top|skate|ball\\b|whistle|medal|racer|bike|goggle|helmet|duffel|rugby|polo'), cheer: 'Game on!', award: 'Sporty Star', lead: 'trumpet', shift: 0, bpm: 124 },
  { id: 'pajama', name: 'Pajama Party', ideas: 'Ideas: pajamas, slippers, a nightgown, a plushie', c1: '#f1ecff', c2: '#a99bff', kw: kw('pajama|pj|slipper|nightgown|night|robe|sleep|teddy|plush|moon|cozy|sweatpant|pillow|blanket|cloud'), cheer: 'Cozy cute!', award: 'Cozy Star', lead: 'piano', shift: 0, bpm: 96 },
  { id: 'rainbow', name: 'Rainbow', ideas: 'Ideas: lots and lots of different colors!', c1: '#fff7e0', c2: '#ff9a6b', kw: kw('rainbow|unicorn|colorful|tie-dye|prism'), cheer: 'Rainbow magic!', award: 'Rainbow Star', lead: 'xylophone', shift: -12, bpm: 116 },
];
const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;

const ACCESSORY: Slot[] = ['head', 'face', 'neck', 'hand', 'back'];

function hsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export interface OutfitScore {
  /** 0..1: clothes on (a dress, or a top with a bottom) and shoes. Kiki Kitty's card. */
  style: number;
  /** 0..1: accessories and how nicely the colors go together. Bonbon Bunny's card. */
  sparkle: number;
  /** 0..1: how well it fits the theme (or how creative, in free style). Mocha Bear's card. */
  theme: number;
  /** The three judges' cards, always 7 to 10. */
  cards: [number, number, number];
  total: number;
  /** A gentle idea for next time, or '' when the look is already a full score. */
  tip: string;
}

/** Scores a look for the runway. Kind by design: an empty look still gets 7s. */
export function scoreOutfit(look: Look, themeId: ThemeId): OutfitScore {
  const th = THEME_BY_ID[themeId] ?? THEMES[0];
  const items = (Object.keys(look.wear) as Slot[]).flatMap((slot) => {
    const w = look.wear[slot];
    const def = w ? WEAR_BY_ID[w.id] : undefined;
    return w && def ? [{ slot, def, w, color: def.fixed ? def.color : w.color }] : [];
  });
  const has = (s: Slot) => items.some((i) => i.slot === s);
  const core = has('dress') || (has('top') && has('bottom')) ? 1 : has('top') || has('bottom') ? 0.5 : 0;
  const shoes = has('shoes') ? 1 : 0;
  const accN = items.filter((i) => ACCESSORY.includes(i.slot)).length;
  const acc = Math.min(1, accN / 3);
  // Colors: a few color families look put together; matching pieces earn a bonus.
  const fams = new Set<number>();
  const cols: [number, number, number][] = [];
  for (const i of items) {
    const c = hsl(i.color);
    cols.push(c);
    if (c[1] > 0.22 && c[2] < 0.94 && c[2] > 0.12) fams.add(Math.round(c[0] / 40) % 9);
  }
  let harmony = fams.size <= 2 ? 1 : fams.size === 3 ? 0.85 : fams.size === 4 ? 0.7 : 0.55;
  const match = cols.some((a, i) => cols.some((b, j) => j > i && Math.abs(a[0] - b[0]) < 12 && Math.abs(a[2] - b[2]) < 0.12 && a[1] > 0.2 && b[1] > 0.2));
  if (match) harmony = Math.min(1, harmony + 0.15);
  let theme: number;
  if (th.id === 'free') {
    const patterns = items.filter((i) => i.w.pattern && i.w.pattern !== 'none').length;
    theme = clamp(0.3 + items.length * 0.1 + (patterns ? 0.15 : 0), 0, 1);
  } else {
    const hits = items.filter((i) => (th.kw?.test(`${i.def.id} ${i.def.name} ${i.def.group ?? ''}`) ?? false) || (!!th.tag && !!i.def.tags?.includes(th.tag))).length;
    theme = Math.min(1, hits / 3);
    if (th.id === 'rainbow') {
      theme = clamp((fams.size - 1) / 4 + hits * 0.25, 0, 1);
      harmony = Math.max(harmony, theme);
    }
  }
  const style = core * 0.65 + shoes * 0.35;
  const sparkle = acc * 0.6 + harmony * 0.4;
  const cards = [style, sparkle, theme].map((v) => 7 + Math.round(clamp(v, 0, 1) * 3)) as [number, number, number];
  // A gentle idea for the lowest card (theme first, then clothes, then accessories).
  const low = [2, 0, 1].reduce((a, b) => (cards[b] < cards[a] ? b : a), 2);
  let tip = '';
  if (cards[low] < 10) {
    if (low === 0) tip = core < 1 ? 'a dress, or a top and a bottom' : 'some shoes';
    else if (low === 1) tip = accN < 3 ? 'a hat, glasses or a necklace' : 'colors that go together';
    else tip = th.id === 'free' ? 'a fun pattern' : th.id === 'rainbow' ? 'even more colors' : th.ideas.replace(/^Ideas: /, '').split(',')[0];
  }
  return { style, sparkle, theme, cards, total: cards[0] + cards[1] + cards[2], tip };
}

/** Coins for a show: 15 to 40, more for bigger shows and higher scores. */
export function showCoins(scores: OutfitScore[]): number {
  if (!scores.length) return 15;
  const avg = scores.reduce((a, s) => a + s.total, 0) / scores.length;
  return clamp(Math.round(15 + ((avg - 21) / 9) * 20 + (scores.length - 1) * 2.5), 15, 40);
}

/** Everyone gets a ribbon: the top score is Star of the Show, the others get what they did best. */
export function showAwards(scores: OutfitScore[], themeId: ThemeId): { winner: number; awards: string[] } {
  const th = THEME_BY_ID[themeId] ?? THEMES[0];
  let winner = 0;
  scores.forEach((s, i) => {
    if (s.total > scores[winner].total) winner = i;
  });
  const used = new Set<string>();
  const awards = scores.map((s, i) => {
    if (i === winner) return 'Star of the Show';
    const opts = [[s.style, 'Super Stylish'], [s.sparkle, 'Most Sparkly'], [s.theme, th.award]] as [number, string][];
    opts.sort((a, b) => b[0] - a[0]);
    const a = [...opts.map((o) => o[1]), 'Best Smile', 'Coolest Walk'].find((n) => !used.has(n))!;
    used.add(a);
    return a;
  });
  return { winner, awards };
}

// ---------------- art: icons for the cards ----------------
const S64 = (inner: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
function themeIcon(id: ThemeId): string {
  switch (id) {
    case 'free': return icon('hanger');
    case 'party': return S64(`<path d="M22 44 Q20 54 26 60" stroke="#9b6bff" stroke-width="2" fill="none"/><path d="M42 40 Q44 52 38 60" stroke="#9b6bff" stroke-width="2" fill="none"/>
      <ellipse cx="22" cy="28" rx="13" ry="16" fill="#ff5c9a"/><ellipse cx="42" cy="24" rx="13" ry="16" fill="#7cc8ff"/><ellipse cx="18" cy="22" rx="3" ry="5" fill="#fff" opacity="0.6"/><ellipse cx="38" cy="18" rx="3" ry="5" fill="#fff" opacity="0.6"/>
      <path d="M20 44 l4 0 l-2 -3z M40 40 l4 0 l-2 -3z" fill="#9b6bff"/><path d="${sparkleD(54, 46, 6)}" fill="#ffd36b"/><path d="${sparkleD(8, 48, 4)}" fill="#ffd36b"/>`);
    case 'beach': return S64(`<circle cx="44" cy="18" r="11" fill="#ffd36b"/><g stroke="#ffb63d" stroke-width="3" stroke-linecap="round"><path d="M44 2 v3 M58 18 h3 M54 7 l2 -2 M54 29 l2 2"/></g>
      <path d="M6 44 Q14 38 22 44 T38 44 T54 44 T62 44 V62 H6Z" fill="#7cc8ff"/><path d="M6 52 Q14 46 22 52 T38 52 T54 52 T62 52 V62 H6Z" fill="#4fb0ff"/>
      <path d="M10 36 Q22 14 34 36Z" fill="#ff7eb6"/><path d="M22 36 L22 48" stroke="#8a6488" stroke-width="3"/><path d="M16 36 Q22 22 28 36" fill="#fff" opacity="0.5"/>`);
    case 'winter': return icon('snow');
    case 'princess': return icon('crown');
    case 'sporty': return S64(`<circle cx="32" cy="32" r="24" fill="#fff" stroke="#3a3a4a" stroke-width="3"/><path d="M32 20 L42 27 L38 39 L26 39 L22 27Z" fill="#3a3a4a"/>
      <path d="M32 20 V9 M42 27 L53 23 M38 39 L45 50 M26 39 L19 50 M22 27 L11 23" stroke="#3a3a4a" stroke-width="3"/><path d="${sparkleD(54, 10, 6)}" fill="#5fd3b5"/>`);
    case 'pajama': return S64(`<path d="M40 8 A24 24 0 1 0 56 44 A18 18 0 1 1 40 8Z" fill="#ffd36b"/><path d="${starD(16, 16, 6)}" fill="#c99bff"/><path d="${starD(50, 14, 4)}" fill="#c99bff"/><circle cx="30" cy="38" r="2" fill="#e0a11e"/>`);
    case 'rainbow': return S64(['#ff5c7a', '#ffa64d', '#ffd84a', '#5fd3b5', '#7cc8ff', '#9b6bff'].map((c, i) => `<path d="M${6 + i * 4} 50 A${26 - i * 4} ${26 - i * 4} 0 0 1 ${58 - i * 4} 50" stroke="${c}" stroke-width="4.5" fill="none"/>`).join('') +
      `<ellipse cx="12" cy="52" rx="9" ry="6" fill="#fff"/><ellipse cx="52" cy="52" rx="9" ry="6" fill="#fff"/>`);
  }
}
function songIcon(id: string): string {
  switch (id) {
    case 'pop': return icon('music');
    case 'disco': return S64(`<path d="M32 2 V12" stroke="#c9cfdd" stroke-width="2"/><circle cx="32" cy="34" r="22" fill="#d9dbe6"/>
      ${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3, 4, 5].map((c) => ((r + c) % 3 === 0 ? `<rect x="${12 + c * 7}" y="${14 + r * 7}" width="6" height="6" fill="${pick(['#fff', '#c99bff', '#7cc8ff', '#ff9ec7'])}"/>` : '')).join('')).join('')}
      <circle cx="32" cy="34" r="22" fill="none" stroke="#9aa3b5" stroke-width="2"/><path d="${sparkleD(50, 18, 7)}" fill="#fff"/>`);
    case 'kpop': return S64(`<path d="${starD(32, 34, 26, 0.48)}" fill="url(#g-gold)" stroke="#e0a11e" stroke-width="2"/><path d="${heartD(32, 28, 9)}" fill="#ff5c9a"/><path d="${sparkleD(52, 10, 7)}" fill="#7cc8ff"/><path d="${sparkleD(10, 14, 5)}" fill="#ff9ec7"/>`);
    case 'ballet': return S64(`<g transform="translate(32 30) scale(1.1)">${bowG(0, 0, 1, '#ff9ec7')}</g><path d="${sparkleD(52, 50, 6)}" fill="#c99bff"/><path d="${sparkleD(12, 50, 4)}" fill="#ffd36b"/>`);
    default: return S64(`<circle cx="26" cy="36" r="18" fill="#7fe0b0" opacity="0.85"/><circle cx="44" cy="22" r="12" fill="#ff9ec7" opacity="0.9"/><circle cx="46" cy="46" r="8" fill="#7cc8ff"/>
      <circle cx="20" cy="30" r="5" fill="#fff" opacity="0.7"/><circle cx="40" cy="18" r="3.5" fill="#fff" opacity="0.7"/>`);
  }
}

// ---------------- the runway ----------------
/** Little seeded random numbers, so the audience looks the same every show. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const RW_TOP = 410;
const RW_FRONT = 950;
const halfRunway = (y: number) => 80 + ((y - RW_TOP) / 590) * 250;

function runwayScene(): { svg: string; phones: [number, number][] } {
  const r = rng(7);
  const phones: [number, number][] = [];
  let s = `<defs>
    <linearGradient id="sh-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1450"/><stop offset="0.42" stop-color="#5b2478"/><stop offset="1" stop-color="#2a1240"/></linearGradient>
    <linearGradient id="sh-fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e65c9c"/><stop offset="0.5" stop-color="#ffb8d9"/><stop offset="1" stop-color="#e65c9c"/></linearGradient>
    <pattern id="sh-folds" width="70" height="20" patternUnits="userSpaceOnUse"><rect width="70" height="20" fill="url(#sh-fold)"/></pattern>
    <linearGradient id="sh-rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c6e2"/><stop offset="1" stop-color="#fff4fa"/></linearGradient>
    <linearGradient id="sh-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="sh-door" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#fff8fc"/><stop offset="0.6" stop-color="#ffd0e8"/><stop offset="1" stop-color="#ff8fc4"/></radialGradient>
    <radialGradient id="sh-spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#ffe6f3" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sh-flashg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.35" stop-color="#fff6d6" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>`;
  s += `<rect x="-1800" y="-50" width="3600" height="1100" fill="url(#sh-bg)"/>`;
  // light garlands swinging across the dark walls
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
    const x0 = side * (600 + k * 380);
    const x1 = side * (980 + k * 380);
    const y0 = 40 + k * 18;
    s += `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${y0 + 90} ${x1} ${y0}" stroke="#7a4c9a" stroke-width="2" fill="none"/>`;
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + 180 * t * (1 - t);
      s += `<circle class="sh-bulb b${i % 3}" cx="${f(x)}" cy="${f(y + 6)}" r="7" fill="${['#ffe680', '#ff9ec7', '#9fe8ff'][i % 3]}"/>`;
    }
  }
  // neon signs
  for (const side of [-1, 1]) {
    const x = side * 860;
    const d = side < 0 ? heartD(x, 150, 70) : starD(x, 210, 70, 0.48);
    const c = side < 0 ? '#ff6fb5' : '#7ff0d0';
    s += `<g class="sh-neon"><path d="${d}" fill="none" stroke="${c}" stroke-width="22" opacity="0.25"/><path d="${d}" fill="none" stroke="${c}" stroke-width="8"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.8"/></g>`;
  }
  // the curtain backdrop inside a marquee arch
  const arch = 'M-560 410 L-560 140 Q-560 40 -460 40 L460 40 Q560 40 560 140 L560 410';
  s += `<path d="${arch}Z" fill="url(#sh-folds)"/><path d="${arch}Z" fill="#7a1f58" opacity="0.18"/>`;
  s += `<path d="M-560 60 Q-280 150 0 70 Q280 150 560 60 L560 40 L-560 40Z" fill="#ff5c9a"/><path d="M-560 60 Q-280 150 0 70 Q280 150 560 60" stroke="#ffd36b" stroke-width="6" fill="none"/>`;
  s += `<path d="${arch}" fill="none" stroke="#ffd36b" stroke-width="26" stroke-linejoin="round"/><path d="${arch}" fill="none" stroke="#e0a11e" stroke-width="4"/>`;
  const bulbAt: [number, number][] = [];
  for (let y = 400; y >= 150; y -= 36) bulbAt.push([-560, y], [560, y]);
  for (let x = -440; x <= 440; x += 40) bulbAt.push([x, 40]);
  for (const a of [0.3, 0.6, 0.9]) bulbAt.push([-560 + 100 - Math.cos(a) * 100, 140 - Math.sin(a) * 100], [560 - 100 + Math.cos(a) * 100, 140 - Math.sin(a) * 100]);
  bulbAt.forEach(([x, y], i) => (s += `<circle class="sh-bulb b${i % 3}" cx="${f(x)}" cy="${f(y)}" r="8" fill="#fff6c8"/>`));
  // the doorway the models step out of, with sparkly tinsel
  s += `<path d="M-108 410 L-108 250 Q-108 196 0 196 Q108 196 108 250 L108 410Z" fill="url(#sh-door)" stroke="#fff" stroke-width="6"/>`;
  for (let x = -96; x <= 96; x += 12) s += `<line class="sh-tinsel" x1="${x}" y1="${x * x < 6000 ? 206 : 226}" x2="${x}" y2="404" stroke="${x % 24 === 0 ? '#ffffff' : '#ffd6ec'}" stroke-width="3" stroke-dasharray="2 7" opacity="0.85" style="animation-delay:${f(-r() * 2)}s"/>`;
  s += `<text x="0" y="168" text-anchor="middle" class="sh-logo">SHOW TIME</text>`;
  for (const [x, y, rr] of [[-330, 120, 16], [330, 118, 16], [-260, 190, 10], [270, 186, 10]] as const) s += `<path class="sh-twinkle" d="${sparkleD(x, y, rr)}" fill="#fff" style="animation-delay:${f(r() * 2)}s"/>`;
  // venue floor behind the crowd
  s += `<rect x="-1800" y="405" width="3600" height="600" fill="#24103a"/>`;
  // the runway, lined with little lights
  s += `<path d="M-80 ${RW_TOP} L80 ${RW_TOP} L330 1000 L-330 1000Z" fill="url(#sh-rw)"/>`;
  s += `<path d="M-14 ${RW_TOP} L14 ${RW_TOP} L60 1000 L-60 1000Z" fill="#fff" opacity="0.55"/>`;
  s += `<path d="M-80 ${RW_TOP} L-330 1000 M80 ${RW_TOP} L330 1000" stroke="#ff7eb6" stroke-width="8"/>`;
  s += `<ellipse class="sh-endspot" cx="0" cy="${RW_FRONT}" rx="250" ry="48" fill="url(#sh-spot)"/>`;
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const y = RW_TOP + 590 * t;
    for (const side of [-1, 1]) s += `<circle class="sh-rbulb" cx="${f(side * halfRunway(y))}" cy="${f(y)}" r="${f(3 + t * 7)}" fill="#fff6c8" style="animation-delay:${f(t * 1.4)}s"/>`;
  }
  // the crowd: rows of happy fans, the far ones lighter
  const ROWS = [500, 575, 660, 755, 860, 975];
  const tones = ['#6a4090', '#5a3480', '#4a2a6e', '#3c205d', '#2f184d', '#24113e'];
  const hairs = ['none', 'bun', 'pig', 'bow', 'pony', 'none'];
  ROWS.forEach((y, row) => {
    const sc = 0.4 + ((y - RW_TOP) / 590) * 0.85;
    const dx = 76 * sc;
    for (const side of [-1, 1]) {
      for (let x = halfRunway(y) + 30 * sc + r() * dx * 0.5; x < 1250; x += dx * (0.9 + r() * 0.25)) {
        const px = side * x;
        const py = y + (r() - 0.5) * 8 * sc;
        const c = tones[row];
        const hair = pick(hairs);
        const hop = r() < 0.2;
        let p = `<path d="M-30 4 Q-32 -44 0 -46 Q32 -44 30 4Z" fill="${c}"/><circle cx="0" cy="-64" r="21" fill="${c}"/>`;
        if (hair === 'bun') p += `<circle cx="0" cy="-88" r="10" fill="${c}"/>`;
        if (hair === 'pig') p += `<circle cx="-22" cy="-70" r="9" fill="${c}"/><circle cx="22" cy="-70" r="9" fill="${c}"/>`;
        if (hair === 'bow') p += `<path d="M0 -84 L-14 -94 L-14 -76Z M0 -84 L14 -94 L14 -76Z" fill="${c}"/>`;
        if (hair === 'pony') p += `<path d="M14 -76 Q34 -70 26 -44" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
        p += `<path d="M-15 -78 Q0 -88 15 -78" stroke="#ff9ed2" stroke-width="3" fill="none" opacity="${f(0.25 + row * 0.06)}"/>`;
        const roll = r();
        if (roll < 0.16) {
          p += `<path d="M20 -24 L30 -86" stroke="${c}" stroke-width="10" stroke-linecap="round"/><rect x="22" y="-110" width="18" height="28" rx="4" fill="#1a0b2b" stroke="#8a6ab0" stroke-width="2"/>`;
          phones.push([px + 31 * sc, py - 100 * sc]);
          p += `<path class="sh-fl" d="${sparkleD(31, -100, 24)}" fill="#fff" style="animation-delay:${f(-r() * 4)}s;animation-duration:${f(2.6 + r() * 2.4)}s"/>`;
        } else if (roll < 0.26) {
          const lc = pick(['#ff6fb5', '#7ff0d0', '#ffe680', '#9fd0ff']);
          p += `<g class="sh-stick" style="animation-delay:${f(-r() * 2)}s"><path d="M-22 -24 L-30 -100" stroke="${lc}" stroke-width="12" stroke-linecap="round" opacity="0.35"/><path d="M-22 -24 L-30 -100" stroke="${lc}" stroke-width="5" stroke-linecap="round"/></g>`;
        } else if (roll < 0.31) {
          p += `<path d="M0 -36 L0 -96" stroke="${c}" stroke-width="7"/><path class="sh-sign" d="${heartD(0, -146, 34)}" fill="#ff5c9a" stroke="#fff" stroke-width="4"/>`;
        }
        s += `<g transform="translate(${f(px)} ${f(py)}) scale(${sc.toFixed(3)})"><g class="${hop ? 'sh-fan' : ''}" style="animation-delay:${f(-r() * 1.2)}s">${p}</g></g>`;
      }
    }
  });
  // sweeping spotlights
  const beam = (x: number, c: string, cls: string, w: number) => `<g transform="translate(${x} -40)"><g class="${cls}"><path d="M-14 0 L14 0 L${w} 1080 L${-w} 1080Z" fill="url(#sh-beam)" opacity="0.5"/><path d="M-14 0 L14 0 L${w} 1080 L${-w} 1080Z" fill="${c}" opacity="0.07"/></g></g>`;
  s += beam(-760, '#ff7eb6', 'sh-beam-l', 210) + beam(760, '#b58cff', 'sh-beam-r', 210);
  s += `<g class="sh-topbeam"><path d="M-30 -40 L30 -40 L260 ${RW_FRONT + 30} L-260 ${RW_FRONT + 30}Z" fill="url(#sh-beam)" opacity="0.55"/></g>`;
  return { svg: s, phones };
}

// ---------------- judges ----------------
interface Judge { id: 'cat' | 'bunny' | 'bear'; name: string; hi: string[]; mid: string[]; lo: string[] }
const JUDGES: Judge[] = [
  { id: 'cat', name: 'Kiki', hi: ['Purr-fect!', 'Fabulous!', 'Meow-velous!'], mid: ['So stylish!', 'Love it!', 'Gorgeous!'], lo: ['So cute!', 'Nice look!', 'Sweet style!'] },
  { id: 'bunny', name: 'Bonbon', hi: ['So sparkly!', 'Dazzling!', 'Hop-tastic!'], mid: ['Pretty colors!', 'Sparkly!', 'Lovely!'], lo: ['Adorable!', 'So sweet!', 'Pretty!'] },
  { id: 'bear', name: 'Mocha', hi: ['Beary perfect!'], mid: ['Great idea!', 'Love the theme!', 'So fun!'], lo: ['Fun look!', 'Bear hugs!', 'Cute!'] },
];

function judgeArt(id: Judge['id']): string {
  const fur = id === 'cat' ? '#d9c8ff' : id === 'bunny' ? '#fff4f8' : '#e6b487';
  const fur2 = id === 'cat' ? '#b8a0f0' : id === 'bunny' ? '#f3d9e6' : '#c98f5e';
  const inner = id === 'bear' ? '#ffd9c0' : '#ffb3d1';
  let s = '';
  if (id === 'bunny') s += `<g class="sh-ears"><ellipse cx="60" cy="22" rx="13" ry="34" fill="${fur}" stroke="${fur2}" stroke-width="2" transform="rotate(-10 60 50)"/><ellipse cx="60" cy="24" rx="6" ry="24" fill="${inner}" transform="rotate(-10 60 50)"/>
    <ellipse cx="100" cy="22" rx="13" ry="34" fill="${fur}" stroke="${fur2}" stroke-width="2" transform="rotate(12 100 50)"/><ellipse cx="100" cy="24" rx="6" ry="24" fill="${inner}" transform="rotate(12 100 50)"/></g>`;
  if (id === 'cat') s += `<path d="M42 54 L44 14 L72 34Z" fill="${fur}" stroke="${fur2}" stroke-width="2"/><path d="M48 46 L49 24 L64 36Z" fill="${inner}"/><path d="M118 54 L116 14 L88 34Z" fill="${fur}" stroke="${fur2}" stroke-width="2"/><path d="M112 46 L111 24 L96 36Z" fill="${inner}"/>`;
  if (id === 'bear') s += `<circle cx="46" cy="34" r="16" fill="${fur}"/><circle cx="46" cy="34" r="8" fill="${inner}"/><circle cx="114" cy="34" r="16" fill="${fur}"/><circle cx="114" cy="34" r="8" fill="${inner}"/>`;
  s += `<path d="M24 160 Q24 112 80 108 Q136 112 136 160Z" fill="${fur}" stroke="${fur2}" stroke-width="2"/>`;
  s += `<circle cx="80" cy="68" r="44" fill="${fur}" stroke="${fur2}" stroke-width="2"/>`;
  if (id === 'bear') s += `<ellipse cx="80" cy="84" rx="20" ry="15" fill="#fff0dd"/><ellipse cx="80" cy="78" rx="7" ry="5" fill="#5a3426"/><path d="M73 88 Q80 94 87 88" stroke="#5a3426" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  else s += `<path d="M76 78 L84 78 L80 83Z" fill="#ff7eb6"/><path d="M72 86 Q76 91 80 86 Q84 91 88 86" stroke="#7a4a6a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (id === 'cat') s += `<g stroke="${fur2}" stroke-width="2" stroke-linecap="round"><path d="M40 78 L60 80 M40 86 L60 84 M120 78 L100 80 M120 86 L100 84"/></g>`;
  if (id === 'bunny') s += `<rect x="76" y="88" width="8" height="7" rx="2" fill="#fff" stroke="#e6d0dc" stroke-width="1.5"/>`;
  s += `<ellipse cx="54" cy="80" rx="9" ry="6" fill="#ff9ec7" opacity="0.6"/><ellipse cx="106" cy="80" rx="9" ry="6" fill="#ff9ec7" opacity="0.6"/>`;
  s += `<g class="e-n"><ellipse cx="64" cy="64" rx="6" ry="7.5" fill="#3a1d3f"/><ellipse cx="96" cy="64" rx="6" ry="7.5" fill="#3a1d3f"/><circle cx="66" cy="61" r="2.4" fill="#fff"/><circle cx="98" cy="61" r="2.4" fill="#fff"/></g>`;
  s += `<g class="e-h" stroke="#3a1d3f" stroke-width="4" fill="none" stroke-linecap="round"><path d="M57 67 Q64 57 71 67"/><path d="M89 67 Q96 57 103 67"/></g>`;
  s += `<g class="e-l"><path d="${heartD(64, 56, 10)}" fill="#ff4f8b"/><path d="${heartD(96, 56, 10)}" fill="#ff4f8b"/></g>`;
  if (id === 'cat') s += `<g transform="translate(110 30) rotate(20) scale(0.55)">${bowG(0, 0, 1, '#9b6bff')}</g>`;
  if (id === 'bunny') s += flowerG(52, 36, 10, '#ffd36b', '#ff7eb6') + flowerG(68, 28, 7, '#ff9ec7');
  if (id === 'bear') s += `<g transform="translate(80 112) scale(0.75)">${bowG(0, 0, 1, '#ff5c9a')}</g>`;
  return `<svg class="sh-jart" viewBox="0 0 160 150" aria-hidden="true">${s}</svg>`;
}

// ---------------- dolls on stage ----------------
const K = 1.45; // models are drawn a bit bigger than in rooms
interface Model {
  d: Doll;
  g: SVGGElement;
  art: SVGGElement;
  at: (x: number, y: number, s: number, lift?: number, sway?: number) => void;
  pose: (p: 'stand' | 'wave') => void;
}
function makeModel(layer: SVGGElement, d: Doll): Model {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'sh-model walking');
  g.innerHTML = `<ellipse cx="0" cy="2" rx="88" ry="15" fill="#1a0a2a" opacity="0.32"/><g class="sh-mbob"><g class="sh-mart">${renderDoll(d.look, { expr: 'happy' })}</g></g>`;
  layer.appendChild(g);
  const bob = g.querySelector('.sh-mbob') as SVGGElement;
  const art = g.querySelector('.sh-mart') as SVGGElement;
  return {
    d,
    g,
    art,
    at: (x, y, s, lift = 0, sway = 0) => {
      g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${(s * K).toFixed(3)})`);
      bob.setAttribute('transform', `translate(0 ${f(-lift)}) rotate(${f(sway)})`);
    },
    pose: (p) => (art.innerHTML = renderDoll(d.look, { pose: p, expr: 'happy' })),
  };
}
const depth = (y: number) => 0.3 + (0.7 * (y - (RW_TOP - 5))) / (RW_FRONT - RW_TOP + 5);

function crownArt(look: Look): string {
  const b = body(look.age, !!look.boy);
  const y = b.headY - b.R * 1.02;
  return `<g class="sh-crown" transform="translate(0 ${f(y)})"><g class="sh-crown-in"><path d="M-46 0 L-52 -46 L-26 -22 L0 -58 L26 -22 L52 -46 L46 0Z" fill="url(#g-gold)" stroke="#e0a11e" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-48" y="-6" width="96" height="14" rx="6" fill="#ffd24a" stroke="#e0a11e" stroke-width="3"/><circle cx="0" cy="-30" r="8" fill="#ff4f8b"/><circle cx="-26" cy="-14" r="5" fill="#7cc8ff"/><circle cx="26" cy="-14" r="5" fill="#5fd3b5"/>
    <path d="${sparkleD(40, -60, 12)}" fill="#fff"/></g></g>`;
}
function sashArt(look: Look): string {
  const b = body(look.age, !!look.boy);
  const x1 = b.shW - 8;
  const y1 = b.shY + 2;
  const x2 = -b.hiW + 2;
  const y2 = b.hipY - 4;
  return `<path d="M${x1 - 14} ${y1 - 4} L${x1 + 4} ${y1 + 10} L${x2 + 10} ${y2 + 8} L${x2 - 8} ${y2 - 6}Z" fill="#ff5c9a" stroke="#ffd24a" stroke-width="3" opacity="0.95"/>`;
}
function rosetteArt(look: Look, c: string): string {
  const b = body(look.age, !!look.boy);
  const x = -b.shW * 0.42;
  const y = b.shY + 34;
  return `<g class="sh-rosette" transform="translate(${f(x)} ${f(y)})"><path d="M-8 6 L-16 40 L-6 34 L0 44 L2 8Z M8 6 L16 40 L6 34 L0 44 L-2 8Z" fill="${c}" stroke="#fff" stroke-width="2"/>
    ${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<circle cx="${f(Math.cos(a) * 13)}" cy="${f(Math.sin(a) * 13)}" r="8" fill="${c}" stroke="#fff" stroke-width="1.5"/>`; }).join('')}
    <circle r="10" fill="#fff6c8" stroke="${c}" stroke-width="3"/><path d="${starD(0, 0, 7)}" fill="#ffb63d"/></g>`;
}

// ---------------- setup helpers ----------------
/** A full-length doll picture standing on the bottom edge of its box. */
function fullThumb(look: Look): string {
  const b = body(look.age, !!look.boy);
  const top = b.headY - b.R * 1.5;
  return `<svg viewBox="-135 ${f(top)} 270 ${f(-top + 16)}" preserveAspectRatio="xMidYMax meet">${still(renderDoll(look, { expr: 'happy' }))}</svg>`;
}
function rosterHtml(dolls: Doll[]): string {
  return dolls.map((d) => `<button class="sh-ava" data-doll="${d.id}"><span class="sh-face">${headThumb(d.look)}</span><span class="sh-name">${esc(d.name)}</span><i class="sh-num"></i></button>`).join('');
}
function toggleRoster(ids: string[], id: string, max: number): string[] {
  if (ids.includes(id)) return ids.length > 1 ? ids.filter((x) => x !== id) : ids;
  const next = [...ids, id];
  return next.length > max ? next.slice(next.length - max) : next;
}
function markRoster(root: HTMLElement, ids: string[]): void {
  root.querySelectorAll<HTMLElement>('[data-doll]').forEach((b) => {
    const k = ids.indexOf(b.dataset.doll!);
    b.classList.toggle('on', k >= 0);
    b.querySelector('.sh-num')!.textContent = k >= 0 ? String(k + 1) : '';
  });
}

// =====================================================================================
// Fashion show
// =====================================================================================
let lastShow: { ids: string[]; theme: ThemeId } | null = null;

/**
 * The runway fashion show. onDress(dollId) is called after this screen closes itself so the caller can
 * open the closet; open the show again afterwards and it remembers the chosen models and theme.
 */
export function openFashionShow(onClose: () => void, onDress?: (dollId: string) => void): void {
  let dressing = false;
  let run: Life | null = null;
  let music: Seq | null = null;
  const stop = () => {
    run?.kill();
    run = null;
    music?.stop();
    music = null;
  };
  const fr = frame('sh-fashion', 'Fashion Show', () => {
    stop();
    duckMusic(false);
    if (!dressing) onClose();
  });
  duckMusic(true);
  const dolls = G.s.dolls;
  let ids = (lastShow?.ids ?? []).filter((id) => dolls.some((d) => d.id === id));
  if (!ids.length && dolls[0]) ids = [dolls[0].id];
  let theme: ThemeId = lastShow?.theme ?? 'free';
  const remember = () => (lastShow = { ids: [...ids], theme });

  // ---------- setup ----------
  const setup = () => {
    stop();
    fr.root.classList.remove('sh-staged');
    fr.setTitle('Fashion Show');
    if (!dolls.length) {
      fr.body.innerHTML = `<p class="act-tip">Make a friend first, then put on a show!</p>`;
      return;
    }
    fr.body.innerHTML = `<div class="sh-setup">
      <section class="sh-sec"><h3><b>1</b>Pick your models <small>up to 3</small></h3>
        <div class="sh-roster">${rosterHtml(dolls)}</div><div class="sh-picked"></div></section>
      <section class="sh-sec"><h3><b>2</b>Pick a theme</h3>
        <div class="sh-themes">${THEMES.map((t) => `<button class="sh-theme" data-theme="${t.id}" style="--c1:${t.c1};--c2:${t.c2}">${themeIcon(t.id)}<span>${t.name}</span><i>${icon('check')}</i></button>`).join('')}</div>
        <p class="sh-ideas"></p></section>
      <div class="sh-go-row"><button class="btn primary sh-go" data-go>${icon('star')}<span>Start the show!</span></button></div>
    </div>`;
    refresh();
  };
  const refresh = () => {
    markRoster(fr.body, ids);
    const picked = fr.body.querySelector('.sh-picked');
    if (picked) picked.innerHTML = ids.map((id, k) => {
      const d = dolls.find((x) => x.id === id)!;
      return `<div class="sh-mcard" style="--i:${k}"><div class="sh-mthumb">${fullThumb(d.look)}</div><b>${esc(d.name)}</b>
        ${onDress ? `<button class="sh-dress" data-dress="${d.id}">${icon('hanger')}<span>Change outfit</span></button>` : ''}</div>`;
    }).join('');
    fr.body.querySelectorAll<HTMLElement>('[data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === theme));
    const ideas = fr.body.querySelector('.sh-ideas');
    if (ideas) ideas.innerHTML = `${themeIcon(theme)}<span><b>${esc(THEME_BY_ID[theme].name)}.</b> ${esc(THEME_BY_ID[theme].ideas)}</span>`;
  };

  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    const dollB = t.closest('[data-doll]') as HTMLElement | null;
    if (dollB) {
      const before = ids.length;
      ids = toggleRoster(ids, dollB.dataset.doll!, 3);
      if (ids.length >= before) sound.giggle();
      else sound.pop();
      remember();
      return refresh();
    }
    const th = t.closest('[data-theme]') as HTMLElement | null;
    if (th) {
      theme = th.dataset.theme as ThemeId;
      sound.pick();
      remember();
      return refresh();
    }
    const dr = t.closest('[data-dress]') as HTMLElement | null;
    if (dr && onDress) {
      remember();
      dressing = true;
      fr.close();
      onDress(dr.dataset.dress!);
      return;
    }
    if (t.closest('[data-go]') || t.closest('[data-again]')) {
      remember();
      sound.pop();
      return startShow();
    }
    if (t.closest('[data-setup]')) {
      sound.tap();
      return setup();
    }
    if (t.closest('[data-cheer]')) cheer(t.closest('[data-cheer]') as HTMLElement);
    const model = t.closest('.sh-model');
    if (model) {
      // A tap on a model: a little twirl and sparkles.
      const art = model.querySelector('.sh-mart');
      art?.classList.remove('twirl');
      void (fr.body as HTMLElement).offsetWidth;
      art?.classList.add('twirl');
      sound.giggle();
      const me = e as MouseEvent;
      burst('sparkle', me.clientX, me.clientY, 12);
    }
  });

  // ---------- the show ----------
  let W = 1600;
  let phones: [number, number][] = [];
  let lastCheer = 0;
  const cheer = (b: HTMLElement) => {
    const r = b.getBoundingClientRect();
    burst('heart', r.left + r.width / 2, r.top, 10);
    drum('clap');
    b.classList.remove('pump');
    void b.offsetWidth;
    b.classList.add('pump');
    const now = performance.now();
    if (now - lastCheer > 1800) {
      lastCheer = now;
      sound.applause();
      flashes(8);
    }
  };
  const flashes = (n: number) => {
    const layer = fr.body.querySelector('.sh-flashes');
    if (!layer || !phones.length) return;
    for (let i = 0; i < n; i++) {
      window.setTimeout(() => {
        const vis = phones.filter(([x]) => Math.abs(x) < W / 2);
        const [x, y] = pick(vis.length ? vis : phones);
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
        g.innerHTML = `<g class="sh-pop"><circle r="70" fill="url(#sh-flashg)"/><path d="${sparkleD(0, 0, 34)}" fill="#fff"/></g>`;
        layer.appendChild(g);
        window.setTimeout(() => g.remove(), 500);
      }, i * 90 + Math.random() * 60);
    }
  };

  const startShow = () => {
    stop();
    const R = (run = life());
    const th = THEME_BY_ID[theme];
    const models = ids.map((id) => dolls.find((d) => d.id === id)).filter((d): d is Doll => !!d);
    fr.root.classList.add('sh-staged');
    fr.setTitle(theme === 'free' ? 'Fashion Show' : `Fashion Show: ${th.name}`);
    const scene = runwayScene();
    phones = scene.phones;
    fr.body.innerHTML = `<div class="sh-show">
      <div class="sh-stage"><svg class="sh-runway" preserveAspectRatio="xMidYMid slice" viewBox="-800 0 1600 1000">${scene.svg}<g class="sh-models"></g><g class="sh-flashes"></g></svg>
        <div class="sh-banner"></div><button class="sh-cheer" data-cheer>${icon('heart')}<span>Cheer!</span></button><div class="sh-final"></div></div>
      <div class="sh-judges"><div class="sh-jrow">${JUDGES.map((j, k) => `<div class="sh-judge j-${j.id}" data-j="${k}"><div class="sh-bub"></div><div class="sh-card"><b></b></div>${judgeArt(j.id)}</div>`).join('')}</div>
        <div class="sh-desk">${JUDGES.map((j) => `<span>${j.name}</span>`).join('')}</div></div>
    </div>`;
    const stage = fr.body.querySelector('.sh-stage') as HTMLDivElement;
    const svg = fr.body.querySelector('.sh-runway') as SVGSVGElement;
    const layer = fr.body.querySelector('.sh-models') as SVGGElement;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      W = clamp((1000 * r.width) / r.height, 700, 3200);
      svg.setAttribute('viewBox', `${f(-W / 2)} 0 ${f(W)} 1000`);
    };
    fit();
    window.addEventListener('resize', fit);
    R.onKill(() => window.removeEventListener('resize', fit));
    const groove: Groove = { ...SONGS[0], bpm: th.bpm, lead: th.lead, shift: th.shift, drums: { kick: 'x...x...x...x...', clap: '....x.......x...', hihat: '..x...x...x...x.' } };
    const spb = 60000 / groove.bpm;
    stage.style.setProperty('--spb', `${spb.toFixed(0)}ms`);
    music = new Seq(groove.bpm, Infinity, (i) => playStep(groove, i, 1, Infinity)).start();
    void showFlow(R, models, th, svg, layer, spb);
  };

  const banner = (html: string) => {
    const b = fr.body.querySelector('.sh-banner');
    if (!b) return;
    b.classList.remove('show');
    void (b as HTMLElement).offsetWidth;
    b.innerHTML = html;
    if (html) b.classList.add('show');
    fr.body.querySelector('.sh-stage')?.classList.toggle('bannered', !!html);
  };
  const judgeEls = () => [...fr.body.querySelectorAll<HTMLElement>('.sh-judge')];
  const resetJudges = () => judgeEls().forEach((j) => {
    j.classList.remove('card-up', 'happy', 'love', 'talk');
  });

  async function showFlow(R: Life, models: Doll[], th: Theme, svg: SVGSVGElement, layer: SVGGElement, spb: number) {
    const scores = models.map((m) => scoreOutfit(m.look, th.id));
    const screenAt = (x: number, y: number) => {
      const m = svg.getScreenCTM();
      if (!m) return { x: innerWidth / 2, y: innerHeight / 2 };
      const p = new DOMPoint(x, y).matrixTransform(m);
      return { x: p.x, y: p.y };
    };
    const endspot = svg.querySelector('.sh-endspot')!;
    const topbeam = svg.querySelector('.sh-topbeam')!;
    banner(`<small>Welcome to the</small>${esc(th.id === 'free' ? 'Fashion Show' : `${th.name} Show`)}!`);
    sound.applause();
    await R.wait(2200);

    // Walk from the curtain to the end of the runway (or back), bobbing on the beat.
    const walk = (m: Model, from: number, to: number, ms: number, fadeOut = false, x0 = 0, x1 = 0, sFin = 1) => {
      const t0 = performance.now();
      return R.tween(ms, (t) => {
        const e = 0.45 * Math.pow(t, 1.35) + 0.55 * smooth(t);
        const y = from + (to - from) * e;
        const x = x0 + (x1 - x0) * e;
        const s = depth(y) * (to > from ? 1 + (sFin - 1) * e : 1 + (sFin - 1) * (1 - e));
        const ph = (performance.now() - t0) / spb;
        m.at(x, y, s, Math.abs(Math.sin(Math.PI * ph)) * 9, Math.sin(Math.PI * ph) * 2.2);
        if (fadeOut) m.g.style.opacity = String(clamp((1 - t) * 6, 0, 1));
        else m.g.style.opacity = String(clamp(t * 8, 0, 1));
      });
    };

    for (let k = 0; k < models.length; k++) {
      const d = models[k];
      const sc = scores[k];
      const m = makeModel(layer, d);
      m.at(0, RW_TOP, depth(RW_TOP));
      m.g.style.opacity = '0';
      banner(`<small>Here comes</small>${esc(d.name)}!`);
      sound.whoosh();
      await walk(m, RW_TOP, RW_FRONT, 3600);
      // strike a pose
      m.g.classList.remove('walking');
      m.g.classList.add('posing');
      m.pose('wave');
      m.art.classList.add('twirl');
      endspot.classList.add('on');
      topbeam.classList.add('on');
      sound.sparkle();
      flashes(14);
      const head = screenAt(0, RW_FRONT - 330 * K);
      burst('sparkle', head.x, head.y, 18);
      banner(`${esc(d.name)} strikes a pose!`);
      await R.wait(1400);
      m.art.classList.remove('twirl');
      // the judges hold up their cards
      const js = judgeEls();
      for (let j = 0; j < 3; j++) {
        await R.wait(520);
        const el = js[j];
        const n = sc.cards[j];
        const J = JUDGES[j];
        const words = n >= 10 ? (j === 2 ? [...J.hi, th.cheer] : J.hi) : n >= 9 ? J.mid : n >= 8 ? [...J.mid, ...J.lo] : J.lo;
        el.querySelector('.sh-card b')!.textContent = String(n);
        el.querySelector('.sh-bub')!.textContent = pick(words);
        el.classList.add('card-up', 'talk', n >= 10 ? 'love' : 'happy');
        if (n >= 10) sound.ding();
        else sound.pop();
        const r = el.getBoundingClientRect();
        burst('heart', r.left + r.width / 2, r.top + r.height * 0.3, n >= 10 ? 10 : 5);
      }
      await R.wait(700);
      sound.applause();
      banner(`<b class="sh-pts">${sc.total} points!</b>${sc.tip ? `<small>Idea for next time: ${esc(sc.tip)}</small>` : '<small>A perfect score!</small>'}`);
      await R.wait(2600);
      resetJudges();
      endspot.classList.remove('on');
      topbeam.classList.remove('on');
      banner('');
      // wave goodbye and walk back up the runway
      m.g.classList.remove('posing');
      m.g.classList.add('walking', 'bye');
      await walk(m, RW_FRONT, RW_TOP, 2700, true);
      m.g.remove();
    }

    // ---------- finale ----------
    const { winner, awards } = showAwards(scores, th.id);
    banner(models.length > 1 ? '<small>Everyone out for the</small>Grand Finale!' : '<small>One more time for the</small>Grand Finale!');
    const n = models.length;
    const gap = Math.min((W * 0.86) / n, 420);
    const sFin = Math.min(1, (gap * 0.94) / (300 * K));
    const yFin = 905;
    const xs = models.map((_, i) => (i - (n - 1) / 2) * gap);
    const ms = models.map((d) => makeModel(layer, d));
    ms.forEach((m) => {
      m.at(0, RW_TOP, depth(RW_TOP));
      m.g.style.opacity = '0';
    });
    await Promise.all(ms.map(async (m, i) => {
      await R.wait(i * 650);
      await walk(m, RW_TOP, yFin, 3200, false, 0, xs[i], sFin);
    }));
    ms.forEach((m) => {
      m.g.classList.remove('walking');
      m.g.classList.add('posing');
      m.pose('wave');
      m.art.classList.add('twirl');
    });
    endspot.classList.add('on');
    sound.sparkle();
    flashes(20);
    await R.wait(900);
    // a crown and sash for the star of the show, and a ribbon for everyone
    ms.forEach((m, i) => {
      const extra = document.createElementNS(NS, 'g');
      extra.innerHTML = (i === winner ? sashArt(m.d.look) + crownArt(m.d.look) : '') + rosetteArt(m.d.look, i === winner ? '#ff5c9a' : ['#9b6bff', '#4fb0ff', '#3fcf9f'][i % 3]);
      m.art.appendChild(extra);
      const lab = document.createElementNS(NS, 'g');
      const ls = Math.min(1.2, gap / 260);
      lab.setAttribute('transform', `translate(${f(xs[i])} 962) scale(${ls.toFixed(2)})`);
      const w = awards[i].length * 15 + 40;
      lab.innerHTML = `<g class="sh-award${i === winner ? ' win' : ''}"><rect x="${-w / 2}" y="-24" width="${w}" height="46" rx="23"/><text y="9" text-anchor="middle">${esc(awards[i])}</text></g>`;
      layer.appendChild(lab);
    });
    const wp = screenAt(xs[winner], yFin - 330 * K * sFin);
    burst('sparkle', wp.x, wp.y, 30);
    celebrate();
    sound.success();
    window.setTimeout(() => R.alive && sound.applause(), 400);
    judgeEls().forEach((el, j) => {
      el.querySelector('.sh-bub')!.textContent = ['Bravo!', 'Encore!', 'Wow, wow!'][j];
      el.classList.add('talk', 'love');
    });
    const coins = showCoins(scores);
    G.bump('fashionShow');
    G.earn(coins, { x: innerWidth / 2, y: innerHeight * 0.35 });
    banner('');
    const fin = fr.body.querySelector('.sh-final') as HTMLDivElement;
    fin.innerHTML = `<div class="sh-fcard"><h3>What a show!</h3><p>${n > 1 ? `Everyone won a ribbon. ${esc(models[winner].name)} is the Star of the Show!` : `${esc(models[0].name)} is the Star of the Show!`}</p>
      <p class="earned">${icon('coin')} +${coins}</p><div class="row"><button class="btn" data-setup>${icon('hanger')}<span>New show</span></button><button class="btn primary" data-again>${icon('star')}<span>Encore!</span></button></div></div>`;
    await R.wait(1400);
    fin.classList.add('show');
    await R.wait(600);
    judgeEls().forEach((el) => el.classList.remove('talk'));
  }

  setup();
}

// =====================================================================================
// Dance party
// =====================================================================================
export interface ChartNote { step: number; lane: number }
export const INTRO_BARS = 1;
/** Bars of dancing for a song, so a song lasts about a minute. */
export const bodyBarsFor = (g: Groove) => Math.max(8, Math.round((60 * g.bpm) / 240) - 2);

/** Notes to tap: the melody's notes on the beat, higher notes further right. The first loop is gentler. */
export function buildChart(g: Groove, bodyBars = bodyBarsFor(g)): ChartNote[] {
  const notes = g.mel.filter(Boolean);
  const lo = Math.min(...notes);
  const hi = Math.max(...notes);
  const out: ChartNote[] = [];
  for (let b = 0; b < bodyBars; b++) for (let q = 0; q < 4; q++) {
    const m = g.mel[(b * 8 + q * 2) % g.mel.length];
    if (!m) continue;
    if (b < 8 && q % 2 === 1) continue;
    out.push({ step: (INTRO_BARS + b) * 16 + q * 4, lane: Math.min(3, Math.floor(((m - lo) / (hi - lo + 1)) * 4)) });
  }
  return out;
}

const LANES = [
  { c: '#ff5c9a', c2: '#ffc2dc', shape: (s: number) => `<path d="${heartD(0, -s * 0.62, s * 1.05)}" fill="currentColor"/>` },
  { c: '#9b6bff', c2: '#dccbff', shape: (s: number) => `<path d="${starD(0, 0, s, 0.5)}" fill="currentColor" stroke-linejoin="round"/>` },
  { c: '#3fa8ff', c2: '#c4e6ff', shape: (s: number) => `<path d="M${-s * 0.1} ${s * 0.55} L${-s * 0.1} ${-s * 0.75} L${s * 0.62} ${-s * 0.92} L${s * 0.62} ${s * 0.35}" fill="none" stroke="currentColor" stroke-width="${s * 0.2}" stroke-linejoin="round"/><circle cx="${-s * 0.38}" cy="${s * 0.58}" r="${s * 0.34}" fill="currentColor"/><circle cx="${s * 0.34}" cy="${s * 0.38}" r="${s * 0.34}" fill="currentColor"/>` },
  { c: '#22c493', c2: '#c2f5e2', shape: (s: number) => flowerG(0, 0, s * 0.95, 'currentColor', '#fff3b0') },
];
const laneSvg = (l: number, cls: string) => `<svg class="${cls}" viewBox="-50 -50 100 100" style="color:${LANES[l].c}">${LANES[l].shape(40)}</svg>`;

type Move = 'hop' | 'spin' | 'sway' | 'wave' | 'slide' | 'star';
const LANE_MOVES: Move[][] = [['hop', 'star'], ['spin', 'hop'], ['sway', 'slide'], ['wave', 'sway']];

let lastDance: { ids: string[]; song: string } | null = null;

function dancerSvg(look: Look, pose: 'stand' | 'wave' = 'stand'): string {
  const b = body(look.age, !!look.boy);
  const top = b.headY - b.R * 1.55;
  return `<svg viewBox="-190 ${f(top)} 380 ${f(-top + 24)}" preserveAspectRatio="xMidYMax meet"><ellipse cx="0" cy="4" rx="110" ry="18" fill="#12061f" opacity="0.35"/><g class="sh-mv"><g class="sh-bt">${renderDoll(look, { pose, expr: 'happy' })}</g></g></svg>`;
}

/** The disco room, drawn in screen pixels so the floor sits under the dancers in any layout. */
function clubSvg(w: number, h: number, hz: number, bx: number, ballX: number): string {
  const r = rng(3);
  let s = `<defs><linearGradient id="sh-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1450"/><stop offset="1" stop-color="#5a2a80"/></linearGradient>
    <radialGradient id="sh-ball" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#d9dbe6"/><stop offset="1" stop-color="#8a8fb0"/></radialGradient>
    <radialGradient id="sh-floorglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="sh-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#sh-wall)"/>`;
  // soft wall panels with neon trim
  const pw = Math.max(90, w / 9);
  for (let x = (bx % pw) - pw; x < w + pw; x += pw) s += `<rect x="${f(x + 6)}" y="${f(hz * 0.18)}" width="${f(pw - 12)}" height="${f(hz * 0.78)}" rx="14" fill="#ffffff" opacity="0.04"/>`;
  s += `<rect x="0" y="${f(hz - 10)}" width="${w}" height="10" fill="#ff6fb5" opacity="0.8"/><rect x="0" y="${f(hz - 14)}" width="${w}" height="4" fill="#fff" opacity="0.5"/>`;
  // twinkly wall stars
  for (let i = 0; i < 26; i++) s += `<path class="sh-twinkle" d="${sparkleD(r() * w, r() * hz * 0.9, 4 + r() * 7)}" fill="#fff" style="animation-delay:${f(r() * 2.4)}s"/>`;
  // perspective dance floor
  const vpY = hz - (h - hz) * 1.3;
  const X = (xb: number, y: number) => bx + ((xb - bx) * (y - vpY)) / (h - vpY);
  const rows = 6;
  const cols = 9;
  const tw = (w * 1.9) / cols;
  s += `<rect x="0" y="${f(hz)}" width="${w}" height="${f(h - hz)}" fill="#1a0b2e"/>`;
  let ti = 0;
  for (let rI = 0; rI < rows; rI++) {
    const y0 = hz + (h - hz) * Math.pow(rI / rows, 1.35);
    const y1 = hz + (h - hz) * Math.pow((rI + 1) / rows, 1.35);
    for (let c = 0; c < cols; c++) {
      const xa = bx + (c - cols / 2) * tw;
      const xb2 = xa + tw;
      const d = `M${f(X(xa, y0))} ${f(y0)} L${f(X(xb2, y0))} ${f(y0)} L${f(X(xb2, y1))} ${f(y1)} L${f(X(xa, y1))} ${f(y1)}Z`;
      s += `<path class="sh-tile" data-t="${ti++}" d="${d}"/>`;
    }
  }
  s += `<ellipse cx="${f(bx)}" cy="${f(hz + (h - hz) * 0.55)}" rx="${f(Math.min(w, 700) * 0.42)}" ry="${f((h - hz) * 0.22)}" fill="url(#sh-floorglow)" opacity="0.5"/>`;
  // mirror ball with turning light rays and spots
  const by = Math.max(54, hz * 0.26);
  const br = clamp(Math.min(w, h) * 0.055, 28, 56);
  let rays = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 360;
    rays += `<path d="M-6 0 L6 0 L${f(br * 2.2)} ${f(h * 1.2)} L${f(-br * 2.2)} ${f(h * 1.2)}Z" fill="url(#sh-ray)" opacity="0.16" transform="rotate(${a})"/>`;
  }
  let spots = '';
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2;
    const d = br * 3 + r() * Math.max(w, h) * 0.8;
    spots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(3 + r() * 6)}" fill="${pick(['#fff', '#ffd6ec', '#d6f4ff', '#fff3b0'])}" opacity="0.7"/>`;
  }
  s += `<g transform="translate(${f(ballX)} ${f(by)})"><g class="sh-spin">${rays}${spots}</g></g>`;
  s += `<line x1="${f(ballX)}" y1="0" x2="${f(ballX)}" y2="${f(by - br)}" stroke="#c9cfdd" stroke-width="3"/>`;
  let facets = '';
  const fs = br / 3.2;
  for (let y = -br; y < br; y += fs) for (let x = -br; x < br; x += fs) if (r() < 0.45) facets += `<rect x="${f(x + 1)}" y="${f(y + 1)}" width="${f(fs - 2)}" height="${f(fs - 2)}" fill="${pick(['#ffffff', '#ffd6ec', '#cfe8ff', '#e8dcff'])}" opacity="0.8"/>`;
  s += `<g transform="translate(${f(ballX)} ${f(by)})"><clipPath id="sh-ballclip"><circle r="${f(br)}"/></clipPath><circle r="${f(br)}" fill="url(#sh-ball)"/><g clip-path="url(#sh-ballclip)" class="sh-facets">${facets}</g>
    <circle r="${f(br)}" fill="none" stroke="#9aa3b5" stroke-width="2"/><path class="sh-twinkle" d="${sparkleD(-br * 0.4, -br * 0.4, br * 0.45)}" fill="#fff"/><path class="sh-twinkle" d="${sparkleD(br * 0.5, br * 0.2, br * 0.3)}" fill="#fff" style="animation-delay:0.7s"/></g>`;
  return s;
}

export function openDanceParty(onClose: () => void): void {
  let run: Life | null = null;
  let seq: Seq | null = null;
  let preview: Seq | null = null;
  const stop = () => {
    run?.kill();
    run = null;
    seq?.stop();
    seq = null;
    preview?.stop();
    preview = null;
  };
  const fr = frame('sh-dance', 'Dance Party', () => {
    stop();
    duckMusic(false);
    onClose();
  });
  duckMusic(true);
  const dolls = G.s.dolls;
  let ids = (lastDance?.ids ?? []).filter((id) => dolls.some((d) => d.id === id));
  if (!ids.length && dolls[0]) ids = [dolls[0].id];
  let songId = lastDance?.song ?? SONGS[0].id;
  const remember = () => (lastDance = { ids: [...ids], song: songId });

  const setup = () => {
    stop();
    fr.root.classList.remove('sh-staged');
    fr.setTitle('Dance Party');
    if (!dolls.length) {
      fr.body.innerHTML = `<p class="act-tip">Make a friend first, then let's dance!</p>`;
      return;
    }
    fr.body.innerHTML = `<div class="sh-setup sh-dsetup">
      <section class="sh-sec"><h3><b>1</b>Who's dancing? <small>1 or 2</small></h3>
        <div class="sh-roster">${rosterHtml(dolls)}</div><div class="sh-dpreview"></div></section>
      <section class="sh-sec"><h3><b>2</b>Pick a song <small>tap to listen</small></h3>
        <div class="sh-songs">${SONGS.map((g) => `<button class="sh-song" data-song="${g.id}" style="--c1:${g.c1};--c2:${g.c2}"><span class="sh-sic">${songIcon(g.id)}</span><span class="sh-st"><b>${esc(g.name)}</b><small>${esc(g.tag)}</small></span><span class="sh-eq"><i></i><i></i><i></i></span></button>`).join('')}</div></section>
      <div class="sh-go-row"><button class="btn primary sh-go" data-go>${icon('music')}<span>Let's dance!</span></button></div>
    </div>`;
    refresh();
  };
  const refresh = () => {
    markRoster(fr.body, ids);
    const pv = fr.body.querySelector('.sh-dpreview');
    if (pv) pv.innerHTML = ids.map((id) => {
      const d = dolls.find((x) => x.id === id)!;
      return `<div class="sh-pvd">${fullThumb(d.look)}<b>${esc(d.name)}</b></div>`;
    }).join('');
    fr.body.querySelectorAll<HTMLElement>('[data-song]').forEach((b) => b.classList.toggle('on', b.dataset.song === songId));
  };
  const listen = (g: Groove) => {
    preview?.stop();
    fr.body.querySelectorAll('.sh-song').forEach((b) => b.classList.remove('playing'));
    const card = fr.body.querySelector(`[data-song="${g.id}"]`);
    card?.classList.add('playing');
    card?.setAttribute('style', `--c1:${g.c1};--c2:${g.c2};--spb:${(60000 / g.bpm).toFixed(0)}ms`);
    const p = (preview = new Seq(g.bpm, 32, (i) => playStep(g, i + 16, 1, 99), () => {
      if (preview === p) card?.classList.remove('playing');
    }).start(performance.now() + 30));
  };

  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    const dollB = t.closest('[data-doll]') as HTMLElement | null;
    if (dollB) {
      const before = ids.length;
      ids = toggleRoster(ids, dollB.dataset.doll!, 2);
      if (ids.length >= before) sound.giggle();
      else sound.pop();
      remember();
      return refresh();
    }
    const sb = t.closest('[data-song]') as HTMLElement | null;
    if (sb) {
      songId = sb.dataset.song!;
      remember();
      refresh();
      return listen(SONGS.find((g) => g.id === songId)!);
    }
    if (t.closest('[data-go]') || t.closest('[data-again]')) {
      sound.pop();
      return play();
    }
    if (t.closest('[data-setup]')) {
      sound.tap();
      return setup();
    }
  });

  const play = () => {
    stop();
    const R = (run = life());
    const song = SONGS.find((g) => g.id === songId) ?? SONGS[0];
    const dancers = ids.map((id) => dolls.find((d) => d.id === id)).filter((d): d is Doll => !!d);
    const bodyBars = bodyBarsFor(song);
    const totalSteps = (INTRO_BARS + bodyBars + 1) * 16;
    const spb = 60000 / song.bpm;
    const notes = buildChart(song, bodyBars).map((n) => ({ ...n, t: 0, el: null as HTMLDivElement | null, done: false, gone: 0 }));
    fr.root.classList.add('sh-staged');
    fr.setTitle(song.name);
    fr.body.innerHTML = `<div class="sh-dplay" style="--spb:${spb.toFixed(0)}ms">
      <svg class="sh-club"></svg>
      <div class="sh-dzone"><div class="sh-dancers">${dancers.map((d, i) => `<div class="sh-dancer" data-i="${i}">${dancerSvg(d.look)}</div>`).join('')}</div>
        <div class="sh-dhud"><div class="pill sh-score">${icon('star')}<b>0</b></div><div class="pill sh-combo"><b>0</b><span>combo</span></div>
        <div class="sh-meter"><span>Party</span><div><i></i></div></div></div></div>
      <div class="sh-lanes"><div class="sh-prog"><i></i></div>${LANES.map((_, l) => `<div class="sh-lane" data-lane="${l}" style="--lc:${LANES[l].c};--lc2:${LANES[l].c2}"><div class="sh-pad">${laneSvg(l, 'sh-padic')}</div><div class="sh-fb"></div></div>`).join('')}<div class="sh-notes"></div></div>
      <div class="sh-count"></div><div class="sh-party-banner">Party time!</div><div class="sh-dresult"></div>
    </div>`;
    const playEl = fr.body.querySelector('.sh-dplay') as HTMLDivElement;
    const club = fr.body.querySelector('.sh-club') as SVGSVGElement;
    const lanesEl = fr.body.querySelector('.sh-lanes') as HTMLDivElement;
    const notesEl = fr.body.querySelector('.sh-notes') as HTMLDivElement;
    const laneEls = [...fr.body.querySelectorAll<HTMLDivElement>('.sh-lane')];
    const dancerEls = [...fr.body.querySelectorAll<HTMLDivElement>('.sh-dancer')];
    const scoreEl = fr.body.querySelector('.sh-score b')!;
    const comboEl = fr.body.querySelector('.sh-combo') as HTMLDivElement;
    const meterEl = fr.body.querySelector('.sh-meter i') as HTMLElement;
    const progEl = fr.body.querySelector('.sh-prog i') as HTMLElement;
    const countEl = fr.body.querySelector('.sh-count') as HTMLDivElement;
    let tiles: SVGPathElement[] = [];
    let laneX: number[] = [0, 0, 0, 0];
    let padY = 0;
    let noteSize = 80;
    const layout = () => {
      const r = playEl.getBoundingClientRect();
      if (r.width < 10) return;
      const lr = lanesEl.getBoundingClientRect();
      const portrait = r.height > r.width * 1.05;
      const hz = portrait ? r.height * 0.2 : r.height * 0.5;
      const bx = portrait ? r.width / 2 : (lr.left - r.left) / 2;
      club.setAttribute('viewBox', `0 0 ${f(r.width)} ${f(r.height)}`);
      const zoneW = portrait ? r.width : lr.left - r.left;
      club.innerHTML = clubSvg(r.width, r.height, hz, bx, Math.max(zoneW * 0.78, Math.min(zoneW - 60, 560)));
      tiles = [...club.querySelectorAll<SVGPathElement>('.sh-tile')];
      const nr = notesEl.getBoundingClientRect();
      laneX = laneEls.map((l) => {
        const b = l.getBoundingClientRect();
        return b.left + b.width / 2 - nr.left;
      });
      const pad = laneEls[0].querySelector('.sh-pad')!.getBoundingClientRect();
      padY = pad.top + pad.height / 2 - nr.top;
      noteSize = Math.min(pad.width * 0.78, 96);
      notesEl.style.setProperty('--ns', `${noteSize.toFixed(0)}px`);
    };
    layout();
    window.addEventListener('resize', layout);
    R.onKill(() => window.removeEventListener('resize', layout));

    // ---------- scoring state ----------
    let score = 0;
    let combo = 0;
    let best = 0;
    let perfects = 0;
    let weight = 0;
    let meter = 0;
    let partyUntil = 0;
    let moveN = 0;
    const setCombo = () => {
      comboEl.querySelector('b')!.textContent = String(combo);
      comboEl.classList.toggle('hot', combo >= 5);
      comboEl.classList.remove('sh-bump');
      void comboEl.offsetWidth;
      if (combo > 0) comboEl.classList.add('sh-bump');
    };
    const dance = (lane: number, grade: number) => {
      const now = performance.now();
      const party = now < partyUntil;
      dancerEls.forEach((el, i) => {
        const opts = LANE_MOVES[(lane + i) % 4];
        let mv: Move = opts[(moveN + i) % opts.length];
        if (party || (grade === 3 && combo > 0 && combo % 8 === 0)) mv = 'star';
        const set = () => {
          el.classList.remove('mv-hop', 'mv-spin', 'mv-sway', 'mv-wave', 'mv-slide', 'mv-star');
          void el.offsetWidth;
          el.classList.add(`mv-${mv}`);
        };
        if (i === 0) set();
        else window.setTimeout(() => R.alive && set(), 70);
      });
      moveN++;
    };
    const feedback = (lane: number, text: string, cls: string) => {
      const fb = laneEls[lane].querySelector('.sh-fb') as HTMLDivElement;
      fb.className = `sh-fb ${cls}`;
      fb.textContent = text;
      void fb.offsetWidth;
      fb.classList.add('show');
    };
    const hit = (lane: number) => {
      const now = performance.now();
      const pad = laneEls[lane];
      pad.classList.remove('press');
      void pad.offsetWidth;
      pad.classList.add('press');
      let bestN: (typeof notes)[number] | null = null;
      for (const n of notes) {
        if (n.done || n.lane !== lane) continue;
        const d = Math.abs(n.t - now);
        if (d <= 240 && (!bestN || d < Math.abs(bestN.t - now))) bestN = n;
        if (n.t - now > 240) break;
      }
      if (!bestN) {
        sound.tap();
        return;
      }
      const dt = Math.abs(bestN.t - now);
      const grade = dt <= 90 ? 3 : dt <= 160 ? 2 : 1;
      bestN.done = true;
      bestN.gone = now;
      bestN.el?.classList.add('hit');
      combo++;
      best = Math.max(best, combo);
      if (grade === 3) perfects++;
      weight += grade === 3 ? 1 : grade === 2 ? 0.8 : 0.6;
      const party = now < partyUntil;
      score += ((grade === 3 ? 100 : grade === 2 ? 70 : 40) + Math.min(combo, 20) * 5) * (party ? 2 : 1);
      scoreEl.textContent = String(score);
      setCombo();
      feedback(lane, grade === 3 ? 'Perfect!' : grade === 2 ? 'Great!' : 'Good!', `g${grade}`);
      const pr = pad.querySelector('.sh-pad')!.getBoundingClientRect();
      burst(grade === 3 ? 'sparkle' : 'heart', pr.left + pr.width / 2, pr.top + pr.height / 2, grade === 3 ? 10 : 5);
      dance(lane, grade);
      if (!party) {
        meter = Math.min(100, meter + (grade === 3 ? 7 : grade === 2 ? 5 : 3.5));
        if (meter >= 100) {
          partyUntil = now + spb * 8;
          playEl.classList.add('party');
          sound.sparkle();
          drum('cymbal');
          celebrate();
          window.setTimeout(() => {
            if (!R.alive) return;
            playEl.classList.remove('party');
            meter = 0;
            meterEl.style.width = '0%';
          }, spb * 8);
        }
        meterEl.style.width = `${meter}%`;
      }
    };
    const onPress = (e: PointerEvent) => {
      const l = (e.target as Element).closest('[data-lane]') as HTMLElement | null;
      if (!l) return;
      e.preventDefault();
      hit(Number(l.dataset.lane));
    };
    lanesEl.addEventListener('pointerdown', onPress);
    const KEYS: Record<string, number> = { d: 0, f: 1, j: 2, k: 3, '1': 0, '2': 1, '3': 2, '4': 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    const onKey = (e: KeyboardEvent) => {
      const l = KEYS[e.key];
      if (l === undefined || e.repeat) return;
      e.preventDefault();
      hit(l);
    };
    window.addEventListener('keydown', onKey);
    R.onKill(() => window.removeEventListener('keydown', onKey));

    // ---------- the beat ----------
    const tileCols = ['c0', 'c1', 'c2', 'c3', 'c4'];
    const onBeat = (beat: number) => {
      const party = performance.now() < partyUntil;
      tiles.forEach((t, i) => {
        const on = party ? true : Math.random() < 0.38;
        t.setAttribute('class', on ? `sh-tile ${tileCols[party ? (i + beat) % 5 : Math.floor(Math.random() * 5)]}` : 'sh-tile');
      });
      dancerEls.forEach((el) => {
        el.classList.toggle('b1', beat % 2 === 0);
        el.classList.toggle('b2', beat % 2 === 1);
      });
      if (beat < 4) {
        countEl.textContent = ['3', '2', '1', 'Dance!'][beat];
        countEl.classList.remove('show');
        void countEl.offsetWidth;
        countEl.classList.add('show');
      }
    };
    seq = new Seq(song.bpm, totalSteps, (i) => {
      playStep(song, i, INTRO_BARS, bodyBars);
      if (i % 4 === 0) onBeat(i / 4);
    }, () => {
      void R.wait(spb * 3).then(finish);
    }).start(performance.now() + 400);
    const s0 = seq;
    notes.forEach((n) => (n.t = s0.timeOf(n.step)));
    const songStart = s0.timeOf(0);
    const songEnd = s0.timeOf(totalSteps);
    const TRAVEL = 1700;

    const frameLoop = (now: number) => {
      if (!R.alive) return;
      for (const n of notes) {
        const dt = n.t - now;
        if (dt > TRAVEL) break;
        if (!n.el && !n.done) {
          const el = document.createElement('div');
          el.className = 'sh-note';
          el.dataset.lane = String(n.lane);
          el.innerHTML = laneSvg(n.lane, 'sh-nic');
          notesEl.appendChild(el);
          n.el = el;
        }
        if (n.el) {
          if (n.done && now - n.gone > 380) {
            n.el.remove();
            n.el = null;
            continue;
          }
          const y = n.done && n.gone && n.el.classList.contains('hit') ? padY : padY - (dt / TRAVEL) * (padY + noteSize);
          n.el.style.transform = `translate3d(${f(laneX[n.lane])}px, ${f(y)}px, 0)`;
        }
        if (!n.done && dt < -240) {
          n.done = true;
          n.gone = now;
          n.el?.classList.add('miss');
          if (combo > 0) {
            combo = 0;
            setCombo();
          }
        }
      }
      progEl.style.width = `${clamp(((now - songStart) / (songEnd - songStart)) * 100, 0, 100).toFixed(1)}%`;
      requestAnimationFrame(frameLoop);
    };
    requestAnimationFrame(frameLoop);

    const finish = () => {
      if (!R.alive) return;
      const acc = notes.length ? weight / notes.length : 1;
      const stars = acc >= 0.7 ? 3 : acc >= 0.4 ? 2 : 1;
      const coins = clamp(10 + Math.round(25 * Math.min(1, acc / 0.85)), 10, 35);
      G.bump('dance');
      G.earn(coins, { x: innerWidth / 2, y: innerHeight * 0.4 });
      celebrate();
      sound.success();
      sound.applause();
      dancerEls.forEach((el, i) => {
        el.className = 'sh-dancer done';
        el.innerHTML = dancerSvg(dancers[i].look, 'wave');
      });
      const title = stars === 3 ? 'Superstar dancer!' : stars === 2 ? 'Great dancing!' : 'What a fun dance!';
      const res = fr.body.querySelector('.sh-dresult') as HTMLDivElement;
      res.innerHTML = `<div class="sp-card sh-rcard"><div class="done-stars">${[0, 1, 2].map((k) => `<span class="${k < stars ? '' : 'dim'}">${icon('star')}</span>`).join('')}</div><h2>${title}</h2>
        <div class="sh-stats"><span><b>${score}</b>points</span><span><b>${perfects}</b>perfect</span><span><b>${best}</b>best combo</span></div>
        <p class="earned">${icon('coin')} +${coins}</p><div class="row"><button class="btn" data-setup>${icon('music')}<span>New song</span></button><button class="btn primary" data-again>${icon('star')}<span>Dance again</span></button></div></div>`;
      res.classList.add('show');
    };
  };

  setup();
}
