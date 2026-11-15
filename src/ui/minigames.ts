// Action mini-games: go-kart racing through town, a hotel pool swim race, ice skating on a frozen pond
// at night, and two theme-park booth games (ring toss and balloon pop) that end at a prize shelf.
// Everything is drawn in SVG and moved with requestAnimationFrame; nobody ever "loses": bumps only
// wobble, the slowest rival always lets you onto the podium and every booth game wins a prize.
import './minigames.css';
import { body } from '../art/body';
import {
  BALLOON_COLS, KARTS, KART_COLORS, PRIZES, PRIZE_NAME, RING_COLS, arrowIcon, balloonG, bottleG, canopy, checkers, cloudG, coinG, cone, dartG, f, flameIcon, gantry,
  handIcon, headG, hillStrip, hotelFacade, jumpIcon, kartArt, loungerG, palmG, podiumArt, prizeArt, puddle, ringG, ringHalf, rng, skatesG, snowPine, snowflakeG,
  spinIcon, starG, swimHead, ticketIcon, townStrip, umbrellaG, type PrizeId,
} from '../art/minigames';
import { dark } from '../art/color';
import { renderDoll } from '../art/doll';
import { sparkleD, starD } from '../art/wear';
import { starterLooks } from '../data/looks';
import { duckMusic, pianoNote, playNote, sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G } from '../game';
import type { Doll, Look } from '../types';
import { el, esc, headThumb } from './dom';
import { icon } from './icons';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

// =====================================================================================
// Shared shell: a full-screen layer, rounds that clean up after themselves, view fitting
// =====================================================================================

/** Everything one screen starts (frames, timers, window listeners) so it can all be stopped at once. */
class Round {
  private fns: (() => void)[] = [];
  dead = false;
  add(fn: () => void): void {
    this.fns.push(fn);
  }
  on(t: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void {
    t.addEventListener(type, fn, opts);
    this.add(() => t.removeEventListener(type, fn, opts));
  }
  later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => !this.dead && fn(), ms);
    this.add(() => clearTimeout(id));
  }
  /** Calls fn(dt, now) every frame until the round ends. dt is capped so a hiccup never teleports things. */
  loop(fn: (dt: number, now: number) => void): void {
    let last = performance.now();
    let id = 0;
    const step = (now: number) => {
      if (this.dead) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      fn(dt, now);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    this.add(() => cancelAnimationFrame(id));
  }
  end(): void {
    if (this.dead) return;
    this.dead = true;
    for (const fn of this.fns.splice(0)) fn();
  }
}

interface Shell {
  root: HTMLDivElement;
  /** Ends the current screen and clears the layer for a new one. */
  fresh(): Round;
  close(): void;
}

function shell(cls: string, onClose: () => void): Shell {
  const layer = document.getElementById('overlay')!;
  const root = el('div', `mg ${cls}`);
  layer.appendChild(root);
  document.getElementById('toast')?.classList.remove('show');
  requestAnimationFrame(() => root.classList.add('show'));
  let round = new Round();
  let closed = false;
  const sh: Shell = {
    root,
    fresh() {
      round.end();
      round = new Round();
      root.innerHTML = '';
      return round;
    },
    close() {
      if (closed) return;
      closed = true;
      round.end();
      sound.tap();
      root.classList.remove('show');
      window.setTimeout(() => root.remove(), 260);
      onClose();
    },
  };
  root.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-x]')) sh.close();
  });
  return sh;
}

interface View { x0: number; y0: number; w: number; h: number; s: number; }
/**
 * Sizes an SVG's viewBox to the screen: at least `minW` wide and `baseH` tall, the spare height split
 * between top and bottom by `top` (0..1), horizontally centred on `cx` (or starting at 0).
 */
function fit(svg: SVGSVGElement, root: HTMLElement, r: Round, minW: number, baseH: number, top: number, cx: number | null, onChange?: (v: View) => void): View {
  const v: View = { x0: 0, y0: 0, w: minW, h: baseH, s: 1 };
  const calc = () => {
    const W = Math.max(1, root.clientWidth);
    const H = Math.max(1, root.clientHeight);
    const a = W / H;
    v.w = Math.max(minW, baseH * a);
    v.h = v.w / a;
    v.y0 = -(v.h - baseH) * top;
    v.x0 = cx === null ? 0 : cx - v.w / 2;
    v.s = W / v.w;
    svg.setAttribute('viewBox', `${f(v.x0)} ${f(v.y0)} ${f(v.w)} ${f(v.h)}`);
    onChange?.(v);
  };
  calc();
  r.on(window, 'resize', calc);
  return v;
}

function makeSvg(root: HTMLElement, cls: string): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `mg-svg ${cls}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  root.prepend(svg);
  return svg;
}
function toWorld(svg: SVGSVGElement, cx: number, cy: number) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}
function toScreen(svg: SVGSVGElement, x: number, y: number) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(x, y).matrixTransform(m);
  return { x: p.x, y: p.y };
}
const q = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;

function banner(root: HTMLElement, r: Round, text: string, cls = '', ms = 1000): void {
  const b = q(root, '.mg-banner');
  if (!b) return;
  b.className = `mg-banner ${cls}`;
  b.textContent = text;
  void b.offsetWidth;
  b.classList.add('show');
  const tag = (b.dataset.n = String(Number(b.dataset.n ?? 0) + 1));
  r.later(() => b.dataset.n === tag && b.classList.remove('show'), ms);
}
/** A little "+10" that floats up from a point in the SVG and fades. */
function floatText(g: SVGGElement, x: number, y: number, text: string, col = '#fff', size = 44): void {
  const t = document.createElementNS(NS, 'g');
  t.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
  t.innerHTML = `<text class="mg-float" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${col}" stroke="#4a2546" stroke-opacity="0.35" stroke-width="${size * 0.16}" paint-order="stroke" text-anchor="middle">${esc(text)}</text>`;
  g.appendChild(t);
  window.setTimeout(() => t.remove(), 1100);
}

function choosePlayer(dollId: string | undefined, preferBoy = false): Doll {
  const d = G.s.dolls;
  return d.find((x) => x.id === dollId) ?? (preferBoy ? d.find((x) => x.look.boy) : undefined) ?? d.find((x) => x.look.age === 'kid') ?? d[0];
}
interface Racer { name: string; look: Look; }
/** Other friends to race against; starter friends fill in when the town is small. */
function rivalsFor(player: Doll, n: number): Racer[] {
  const others: Racer[] = shuffle(G.s.dolls.filter((d) => d.id !== player.id)).map((d) => ({ name: d.name, look: d.look }));
  const extra = shuffle(starterLooks()).filter((s) => !others.some((o) => o.name === s.name) && s.name !== player.name);
  return [...others, ...extra].slice(0, n);
}
function rosterHtml(player: Doll): string {
  return `<div class="mg-roster">${G.s.dolls.map((d) => `<button class="mg-ava${d.id === player.id ? ' on' : ''}" data-player="${d.id}" aria-label="${esc(d.name)}">${headThumb(d.look)}<span>${esc(d.name)}</span></button>`).join('')}</div>`;
}
/** Hooks up the "Who's playing?" roster; calls back with the new player. */
function wireRoster(root: HTMLElement, onPick: (d: Doll) => void): void {
  root.querySelectorAll<HTMLElement>('[data-player]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = G.s.dolls.find((x) => x.id === b.dataset.player);
      if (!d) return;
      sound.giggle();
      root.querySelectorAll('[data-player]').forEach((o) => o.classList.toggle('on', o === b));
      onPick(d);
    }),
  );
}
const hudHtml = (pills: string) => `<div class="mg-hud"><button class="round-btn" data-back aria-label="Back">${icon('back')}</button>${pills}<span class="mg-sp"></span><button class="round-btn" data-x aria-label="Close">${icon('close')}</button></div><div class="mg-banner"></div>`;
const pill = (cls: string, ic: string, v = '') => `<div class="pill mg-pill ${cls}">${ic}<span class="n">${v}</span></div>`;
const setPill = (root: HTMLElement, cls: string, v: string) => {
  const n = q(root, `.${cls} .n`);
  if (n && n.textContent !== v) n.textContent = v;
};
const flagIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 8 L14 58" stroke="#8f86a8" stroke-width="5" stroke-linecap="round"/>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${16 + c * 9}" y="${10 + r * 8}" width="9" height="8" fill="${(r + c) % 2 ? '#2d2a3a' : '#fff'}"/>`).join('')).join('')}<rect x="16" y="10" width="36" height="32" fill="none" stroke="#2d2a3a" stroke-width="2"/></svg>`;
const medal = (n: number) => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 4 L32 26 L44 4Z" fill="#ff7eb6"/><circle cx="32" cy="38" r="20" fill="${['url(#g-gold)', 'url(#g-silver)', '#ffb38a', '#c9cfdd'][n - 1] ?? '#c9cfdd'}" stroke="#fff" stroke-width="3"/><text x="32" y="47" font-family="Fredoka, sans-serif" font-weight="700" font-size="24" fill="#fff" text-anchor="middle" stroke="#b07a10" stroke-width="3" paint-order="stroke">${n}</text></svg>`;
const swimIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 44 Q12 38 20 44 T36 44 T52 44 T64 44 L64 64 L4 64Z" fill="#7cc8ff"/><circle cx="34" cy="30" r="12" fill="#ff7eb6"/><path d="M14 34 Q24 14 40 22" stroke="#ffd9c4" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;
const skateIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="14" width="26" height="30" rx="8" fill="#fff" stroke="#c99bff" stroke-width="3"/><path d="M10 52 L46 52 Q54 52 52 44" stroke="#9aa3b5" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M22 44 L22 52 M34 44 L34 52" stroke="#9aa3b5" stroke-width="4"/>${`<path d="${sparkleD(50, 16, 8)}" fill="#ffd36b"/>`}</svg>`;
const clockIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="24" fill="#fff" stroke="#9b6bff" stroke-width="5"/><path d="M32 20 L32 34 L42 40" stroke="#ff7eb6" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="26" y="4" width="12" height="8" rx="3" fill="#9b6bff"/></svg>`;
const ringIcon = (c: string) => `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="32" rx="24" ry="24" fill="none" stroke="${dark(c, 0.2)}" stroke-width="12"/><ellipse cx="32" cy="32" rx="24" ry="24" fill="none" stroke="${c}" stroke-width="8"/></svg>`;

interface ResultOpts { cls?: string; art: string; title: string; lines: string[]; coins: number; again: string; change?: string; }
/** The end card: art, a cheerful title, what was earned and Play again / Done. */
function showResult(sh: Shell, o: ResultOpts, onAgain: () => void, onChange?: () => void): void {
  const box = el('div', `mg-result ${o.cls ?? ''}`);
  box.innerHTML = `<div class="mg-card"><div class="mg-art">${o.art}</div><h2>${esc(o.title)}</h2>${o.lines.map((l) => `<p>${esc(l)}</p>`).join('')}${o.coins ? `<p class="mg-earned">${icon('coin')}<span>+${o.coins} coins</span></p>` : ''}<div class="mg-row">${o.change ? `<button class="btn" data-change>${icon('back')}<span>${esc(o.change)}</span></button>` : ''}<button class="btn primary" data-again>${icon('star')}<span>${esc(o.again)}</span></button><button class="btn" data-x>${icon('check')}<span>Done</span></button></div></div>`;
  sh.root.appendChild(box);
  requestAnimationFrame(() => box.classList.add('show'));
  q(box, '[data-again]').addEventListener('click', () => {
    sound.pop();
    onAgain();
  });
  box.querySelector('[data-change]')?.addEventListener('click', () => {
    sound.pop();
    onChange?.();
  });
}

/** 3-2-1-GO with traffic lights. */
function countdown(root: HTMLElement, r: Round, onGo: () => void, label = ''): void {
  const box = el('div', 'mg-lights');
  box.innerHTML = `${label ? `<div class="mg-lights-label">${esc(label)}</div>` : ''}<div class="mg-bulbs"><i></i><i></i><i></i></div><b class="mg-count"></b>`;
  root.appendChild(box);
  const bulbs = box.querySelectorAll('i');
  const num = q(box, '.mg-count');
  [3, 2, 1].forEach((n, i) =>
    r.later(() => {
      bulbs[i].className = 'red';
      num.textContent = String(n);
      num.classList.remove('pop');
      void num.offsetWidth;
      num.classList.add('pop');
      playNote('xylophone', 67);
    }, 500 + i * 800),
  );
  r.later(() => {
    bulbs.forEach((b) => (b.className = 'green'));
    num.textContent = 'GO!';
    num.classList.remove('pop');
    void num.offsetWidth;
    num.classList.add('pop', 'go');
    playNote('xylophone', 79);
    sound.whoosh();
    onGo();
  }, 500 + 3 * 800);
  r.later(() => box.classList.add('hide'), 500 + 3 * 800 + 700);
  r.later(() => box.remove(), 500 + 3 * 800 + 1100);
}

/** Podium art for a race result: the top three standing on 1st/2nd/3rd blocks. */
function podiumSvg(order: Racer[], youIdx: number): string {
  return `<svg class="mg-podium" viewBox="-460 -680 920 760">${podiumArt(order.slice(0, 3).map((o) => o.look), order.slice(0, 3).map((o) => o.name), youIdx)}</svg>`;
}

// =====================================================================================
// 1. Go-kart race
// =====================================================================================
let lastKart = { style: 'classic', color: KARTS[0].color };

const LANES = [570, 665, 760];
const ROAD = [508, 818];
const LAP = 12000;
const LAPS = 3;
const TOTAL = LAP * LAPS;
const KS = 0.82; // kart scale

interface Kart {
  x: number; y: number; lane: number; v: number; base: number; wob: number; spin: number; phase: number; laneT: number; off: number;
  g: SVGGElement; inner: SVGGElement; racer: Racer; you: boolean; done: number; hitIds: Set<number>;
}
interface Item { id: number; x: number; lane: number; kind: 'coin' | 'star' | 'cone' | 'puddle'; g: SVGGElement; done: boolean; vis: boolean; }

export function openKartRace(dollId: string | undefined, onClose: () => void): void {
  const sh = shell('mg-kart', onClose);
  let player = choosePlayer(dollId, true);

  const chooser = () => {
    const r = sh.fresh();
    void r;
    const preview = () => `<svg viewBox="-170 -190 340 210">${kartArt(lastKart.style, lastKart.color, player.look)}</svg>`;
    sh.root.innerHTML = `<div class="mg-pick">
      <button class="round-btn mg-x" data-x aria-label="Close">${icon('close')}</button>
      <h2>${flagIcon}Go-Kart Race</h2>
      <div class="mg-pick-grid">
        <div class="mg-preview mg-go-anim">${preview()}</div>
        <div class="mg-pick-side">
          <div class="mg-kcards">${KARTS.map((k) => `<button class="mg-kcard${k.id === lastKart.style ? ' on' : ''}" data-style="${k.id}"><svg viewBox="-140 -135 280 145">${kartArt(k.id, k.color, null)}</svg><b>${k.name}</b></button>`).join('')}</div>
          <div class="mg-swatches">${KART_COLORS.map((c) => `<button class="mg-sw${c === lastKart.color ? ' on' : ''}" data-color="${c}" style="--c:${c}" aria-label="color"></button>`).join('')}</div>
        </div>
      </div>
      <h3>Who's driving?</h3>
      ${rosterHtml(player)}
      <button class="btn primary mg-go" data-go>${flagIcon}<span>Race!</span></button>
    </div>`;
    const pv = q(sh.root, '.mg-preview');
    const redraw = () => (pv.innerHTML = preview());
    wireRoster(sh.root, (d) => {
      player = d;
      redraw();
    });
    sh.root.querySelectorAll<HTMLElement>('[data-style]').forEach((b) =>
      b.addEventListener('click', () => {
        const k = KARTS.find((x) => x.id === b.dataset.style)!;
        lastKart = { style: k.id, color: k.color };
        sound.pop();
        sh.root.querySelectorAll('[data-style]').forEach((o) => o.classList.toggle('on', o === b));
        sh.root.querySelectorAll<HTMLElement>('[data-color]').forEach((o) => o.classList.toggle('on', o.dataset.color === k.color));
        redraw();
      }),
    );
    sh.root.querySelectorAll<HTMLElement>('[data-color]').forEach((b) =>
      b.addEventListener('click', () => {
        lastKart = { ...lastKart, color: b.dataset.color! };
        sound.pick();
        sh.root.querySelectorAll('[data-color]').forEach((o) => o.classList.toggle('on', o === b));
        redraw();
      }),
    );
    q(sh.root, '[data-go]').addEventListener('click', () => {
      sound.pop();
      race();
    });
  };

  const race = () => {
    const r = sh.fresh();
    const root = sh.root;
    root.innerHTML = hudHtml(pill('k-lap', flagIcon, 'Lap 1/3') + pill('k-pos', medal(4), '4th') + pill('k-coins', icon('coin'), '0')) +
      `<div class="mg-steer"><button class="mg-btn up" data-up aria-label="Up">${arrowIcon(true)}</button><button class="mg-btn down" data-down aria-label="Down">${arrowIcon(false)}</button></div>` +
      `<button class="mg-boost" aria-label="Boost"><span class="mg-meter"></span>${flameIcon}<b>BOOST</b></button>`;
    q(root, '[data-back]').addEventListener('click', () => {
      sound.tap();
      chooser();
    });
    const svg = makeSvg(root, 'k-svg');
    const TW = 2400;
    const HW = 2000;
    const dashes = (() => {
      let s = '';
      for (let x = 0; x < 4400; x += 160) {
        s += `<rect x="${x}" y="${(LANES[0] + LANES[1]) / 2 - 15}" width="80" height="10" rx="5" fill="#fff" opacity="0.85"/><rect x="${x}" y="${(LANES[1] + LANES[2]) / 2 - 15}" width="80" height="10" rx="5" fill="#fff" opacity="0.85"/>`;
        s += `<rect x="${x}" y="${ROAD[0] - 12}" width="80" height="14" fill="#ff7eb6"/><rect x="${x + 80}" y="${ROAD[0] - 12}" width="80" height="14" fill="#fff"/>`;
        s += `<rect x="${x}" y="${ROAD[1] - 2}" width="80" height="14" fill="#fff"/><rect x="${x + 80}" y="${ROAD[1] - 2}" width="80" height="14" fill="#ff7eb6"/>`;
        s += `<rect x="${x + 10}" y="${ROAD[0] - 44}" width="140" height="30" rx="4" fill="#f7e9f1" stroke="#ead3e2" stroke-width="3"/>`;
        const fx = x + 40;
        s += `<circle cx="${fx}" cy="${ROAD[1] + 46}" r="24" fill="#7fd67a"/><circle cx="${fx + 22}" cy="${ROAD[1] + 54}" r="18" fill="#6cc46c"/>${[0, 1, 2].map((k) => `<circle cx="${fx - 10 + k * 16}" cy="${ROAD[1] + 36 + (k % 2) * 12}" r="5" fill="${['#ff9ec7', '#fff', '#ffd36b'][k]}"/>`).join('')}`;
        s += `<circle cx="${x + 120}" cy="${ROAD[1] + 120}" r="6" fill="#fff" opacity="0.8"/><circle cx="${x + 100}" cy="${ROAD[1] + 170}" r="5" fill="#ffd36b" opacity="0.8"/>`;
      }
      return s;
    })();
    svg.innerHTML = `<defs><linearGradient id="mgk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc4ff"/><stop offset="0.6" stop-color="#bfe3ff"/><stop offset="1" stop-color="#ffe3f1"/></linearGradient>
      <linearGradient id="mgk-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d86a0"/><stop offset="1" stop-color="#7a7390"/></linearGradient></defs>
      <rect x="-100" y="-2000" width="5000" height="4000" fill="url(#mgk-sky)"/>
      <circle cx="300" cy="-60" r="70" fill="#fff6c8"/><circle cx="300" cy="-60" r="110" fill="#fff6c8" opacity="0.3"/>
      <g class="k-hills"><g transform="translate(0 ${ROAD[0] - 150})">${hillStrip(HW)}</g><g transform="translate(${HW} ${ROAD[0] - 150})">${hillStrip(HW)}</g></g>
      <g class="k-town"><g transform="translate(0 ${ROAD[0] - 44})">${townStrip(TW, 3)}</g><g transform="translate(${TW} ${ROAD[0] - 44})">${townStrip(TW, 3)}</g></g>
      <rect x="-100" y="${ROAD[0] - 50}" width="5000" height="40" fill="#f3dfea"/>
      <rect x="-100" y="${ROAD[0]}" width="5000" height="${ROAD[1] - ROAD[0]}" fill="url(#mgk-road)"/>
      <rect x="-100" y="${ROAD[1] + 10}" width="5000" height="2000" fill="#8fdc84"/>
      <g class="k-marks">${dashes}</g>
      <g class="k-world"><g class="k-track"></g><g class="k-items"></g><g class="k-karts"></g><g class="k-fx"></g></g>
      <g class="k-lines"></g>`;
    const view = fit(svg, root, r, 1000, 900, 0.72, null);
    const hills = q<SVGGElement>(svg, '.k-hills');
    const town = q<SVGGElement>(svg, '.k-town');
    const marks = q<SVGGElement>(svg, '.k-marks');
    const world = q<SVGGElement>(svg, '.k-world');
    const trackG = q<SVGGElement>(svg, '.k-track');
    const itemsG = q<SVGGElement>(svg, '.k-items');
    const kartsG = q<SVGGElement>(svg, '.k-karts');
    const fxG = q<SVGGElement>(svg, '.k-fx');
    const linesG = q<SVGGElement>(svg, '.k-lines');

    // start line, lap gates and the finish
    let track = `<g transform="translate(60 0)">${checkers(ROAD[0], ROAD[1], 60)}</g><g transform="translate(90 ${ROAD[0] - 40})">${gantry('START', '#9b6bff')}</g>`;
    for (let l = 1; l < LAPS; l++) {
      const x = l * LAP;
      track += `<rect x="${x}" y="${ROAD[0]}" width="26" height="${ROAD[1] - ROAD[0]}" fill="#fff" opacity="0.8"/>` + ['#ff7eb6', '#ffd36b', '#5fd3b5', '#7cc8ff'].map((c, i) => `<rect x="${x + 26 + i * 12}" y="${ROAD[0]}" width="12" height="${ROAD[1] - ROAD[0]}" fill="${c}" opacity="0.7"/>`).join('');
      track += `<g transform="translate(${x + 40} ${ROAD[0] - 40})">${gantry(l === LAPS - 1 ? 'LAST LAP' : `LAP ${l + 1}`, '#ff7eb6')}</g>`;
    }
    track += `<g transform="translate(${TOTAL} 0)">${checkers(ROAD[0], ROAD[1], 90)}</g><g transform="translate(${TOTAL + 45} ${ROAD[0] - 40})">${gantry('FINISH', '#ff4f8b')}</g>`;
    for (let x = 1800; x < TOTAL + 2000; x += 2600) track += `<g transform="translate(${x} ${ROAD[0] - 40})"><rect x="-6" y="-200" width="12" height="200" rx="5" fill="#8f86a8"/><rect x="-60" y="-260" width="120" height="70" rx="16" fill="#fff" stroke="#5fd3b5" stroke-width="6"/><text x="0" y="-214" font-family="Fredoka, sans-serif" font-weight="700" font-size="34" fill="#5fd3b5" text-anchor="middle">GO!</text></g>`;
    trackG.innerHTML = track;

    // items: coin trails, stars, cones and puddles, never blocking all three lanes
    const items: Item[] = [];
    const rand = rng(Math.floor(Math.random() * 1e9));
    let nid = 0;
    const addItem = (x: number, lane: number, kind: Item['kind']) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${f(x)} ${LANES[lane]})`);
      g.innerHTML = `<g class="it">${kind === 'coin' ? `<g transform="translate(0 -40)"><g class="mg-coin">${coinG(22)}</g></g>` : kind === 'star' ? `<g transform="translate(0 -50)"><g class="mg-bob">${starG(30)}</g></g>` : kind === 'cone' ? cone() : puddle()}</g>`;
      g.style.display = 'none';
      itemsG.appendChild(g);
      items.push({ id: nid++, x, lane, kind, g, done: false, vis: false });
    };
    for (let x = 900; x < TOTAL - 500; ) {
      const roll = rand();
      if (roll < 0.38) {
        const lane = Math.floor(rand() * 3);
        const n = 4 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i++) addItem(x + i * 85, lane, 'coin');
        x += n * 85 + 260 + rand() * 260;
      } else if (roll < 0.52) {
        addItem(x, Math.floor(rand() * 3), 'star');
        x += 420 + rand() * 300;
      } else {
        const lane = Math.floor(rand() * 3);
        addItem(x, lane, rand() < 0.55 ? 'cone' : 'puddle');
        if (rand() < 0.3) {
          const other = (lane + 1 + Math.floor(rand() * 2)) % 3;
          addItem(x + 30, other, rand() < 0.5 ? 'cone' : 'puddle');
          const free = 3 - lane - other;
          addItem(x + 10, free, 'coin');
        }
        x += 520 + rand() * 380;
      }
    }

    // karts
    const rivals = rivalsFor(player, 3);
    const styles = shuffle(KARTS.filter((k) => k.id !== lastKart.style));
    const makeKart = (racer: Racer, style: string, color: string, lane: number, x: number, base: number, you: boolean): Kart => {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = `<ellipse cx="0" cy="2" rx="96" ry="14" fill="#3a1d3f" opacity="0.2"/><g class="k-inner">${kartArt(style, color, racer.look)}</g>${you ? `<g transform="translate(-10 -215)"><g class="k-you"><path d="M-34 -24 L34 -24 Q44 -24 44 -14 L44 4 Q44 14 34 14 L8 14 L0 26 L-8 14 L-34 14 Q-44 14 -44 4 L-44 -14 Q-44 -24 -34 -24Z" fill="#ff4f8b" stroke="#fff" stroke-width="4"/><text x="0" y="2" font-family="Fredoka, sans-serif" font-weight="700" font-size="24" fill="#fff" text-anchor="middle" dominant-baseline="middle">YOU</text></g></g>` : ''}`;
      kartsG.appendChild(g);
      return { x, y: LANES[lane], lane, v: 0, base, wob: 0, spin: 0, phase: Math.random() * 6, laneT: 0, off: base > 580 ? 220 : base > 520 ? -60 : -340, g, inner: q<SVGGElement>(g, '.k-inner'), racer, you, done: 0, hitIds: new Set() };
    };
    const ks: Kart[] = [
      makeKart(rivals[0], styles[0].id, styles[0].color, 0, -20, 600, false),
      makeKart(rivals[1], styles[1].id, styles[1].color, 2, -20, 560, false),
      makeKart(rivals[2], styles[2].id, styles[2].color, 1, 40, 500, false),
    ];
    const me = makeKart({ name: player.name, look: player.look }, lastKart.style, lastKart.color, 1, -230, 560, true);
    ks.push(me);
    const rivalsK = ks.filter((k) => !k.you);

    // speed lines
    const lines = Array.from({ length: 16 }, (_, i) => ({ x: Math.random() * 1600, y: -200 + ((i * 97) % 1100), len: 120 + Math.random() * 160 }));
    linesG.innerHTML = lines.map(() => `<rect height="9" rx="4.5" fill="#fff"/>`).join('');
    const lineEls = Array.from(linesG.children) as SVGRectElement[];

    let state: 'count' | 'race' | 'finish' = 'count';
    let boostHeld = false;
    let meter = 1;
    let drained = false;
    let coins = 0;
    let lapShown = 1;
    let time = 0;
    let finishOrder: Kart[] = [];
    let spinBucket = -1;
    let lastOrder = '';
    const meterEl = q(root, '.mg-meter');
    const boostBtn = q(root, '.mg-boost');

    const steer = (d: number) => {
      if (state === 'finish') return;
      const nl = clamp(me.lane + d, 0, 2);
      if (nl !== me.lane) {
        me.lane = nl;
        sound.pick();
      }
    };
    q(root, '[data-up]').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      steer(-1);
    });
    q(root, '[data-down]').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      steer(1);
    });
    // swipe up/down or tap a lane on the road
    const swipes = new Map<number, { y: number; moved: boolean }>();
    svg.addEventListener('pointerdown', (e) => {
      swipes.set(e.pointerId, { y: e.clientY, moved: false });
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      const s = swipes.get(e.pointerId);
      if (!s) return;
      const dy = (e.clientY - s.y) / view.s;
      if (Math.abs(dy) > 50) {
        steer(dy > 0 ? 1 : -1);
        s.y = e.clientY;
        s.moved = true;
      }
    });
    const up = (e: PointerEvent) => {
      const s = swipes.get(e.pointerId);
      swipes.delete(e.pointerId);
      if (!s || s.moved || e.type === 'pointercancel') return;
      const wy = toWorld(svg, e.clientX, e.clientY).y;
      if (wy < ROAD[0] - 20) steer(-1);
      else if (wy > ROAD[1] + 20) steer(1);
      else {
        let best = 0;
        LANES.forEach((ly, i) => Math.abs(ly - 40 - wy) < Math.abs(LANES[best] - 40 - wy) && (best = i));
        steer(best - me.lane);
      }
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    let boostId: number | null = null;
    boostBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      boostId = e.pointerId;
      boostBtn.setPointerCapture(e.pointerId);
      boostHeld = true;
    });
    const boostUp = (e: PointerEvent) => {
      if (e.pointerId !== boostId) return;
      boostId = null;
      boostHeld = false;
    };
    boostBtn.addEventListener('pointerup', boostUp);
    boostBtn.addEventListener('pointercancel', boostUp);
    boostBtn.addEventListener('lostpointercapture', boostUp);
    boostBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    r.on(window, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'ArrowUp') steer(-1);
      if (k === 'ArrowDown') steer(1);
      if (k === ' ') boostHeld = true;
    });
    r.on(window, 'keyup', (e) => (e as KeyboardEvent).key === ' ' && (boostHeld = false));

    const hit = (k: Kart, kind: 'cone' | 'puddle') => {
      k.wob = 0.9;
      k.spin = kind === 'cone' ? 1 : 0;
      if (k.you) {
        if (kind === 'cone') sound.boing();
        else sound.spray();
        banner(root, r, pick(['Whoops!', 'Wobble!', 'Oopsie!', 'Hold on!']), '', 700);
      }
    };
    const collect = (it: Item) => {
      it.done = true;
      const sp = toScreen(svg, it.x - camX, LANES[it.lane] - 40);
      if (it.kind === 'coin') {
        coins++;
        sound.coin();
        setPill(root, 'k-coins', String(coins));
        it.g.firstElementChild?.classList.add('mg-gone');
        burst('sparkle', sp.x, sp.y, 5);
      } else if (it.kind === 'star') {
        meter = Math.min(1, meter + 0.45);
        drained = false;
        sound.sparkle();
        it.g.firstElementChild?.classList.add('mg-gone');
        burst('sparkle', sp.x, sp.y, 16);
        banner(root, r, 'Boost power!', 'fire', 800);
      }
    };

    let camX = me.x - view.w * 0.3;
    countdown(root, r, () => {
      state = 'race';
      svg.classList.add('go');
    });

    const finishRace = () => {
      state = 'finish';
      const place = finishOrder.indexOf(me) + 1;
      sound.success();
      celebrate();
      banner(root, r, place === 1 ? 'You win!' : 'Finish!', 'fire', 2000);
      const sp = toScreen(svg, TOTAL - camX, 600);
      burst('confetti', sp.x, sp.y, 60);
      r.later(() => {
        const order: Kart[] = [...finishOrder, ...ks.filter((k) => !finishOrder.includes(k)).sort((a, b) => b.x - a.x)];
        const coinsFor = [30, 20, 12, 8][place - 1] ?? 8;
        G.bump('kartRace');
        if (place === 1) G.bump('kartWin');
        sound.applause();
        const total = coinsFor + coins;
        G.earn(total, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        showResult(sh, {
          cls: 'mg-podium-card',
          art: podiumSvg(order.map((k) => k.racer), order.indexOf(me)),
          title: place === 1 ? `${player.name} wins the race!` : `${player.name} came ${ordinal(place)}!`,
          lines: [place === 1 ? 'Super speedy driving!' : 'Great race! Hold BOOST to zoom even faster.', `${coins} coin${coins === 1 ? '' : 's'} picked up on the road.`],
          coins: total, again: 'Race again', change: 'Change kart',
        }, race, chooser);
      }, 2600);
    };

    r.loop((dt) => {
      time += dt;
      // player
      const boosting = state === 'race' && boostHeld && !drained && meter > 0;
      if (boosting) {
        meter = Math.max(0, meter - dt / 2.4);
        if (meter <= 0) drained = true;
      } else if (state !== 'count') {
        meter = Math.min(1, meter + dt / 6.5);
        if (meter > 0.3) drained = false;
      }
      boostBtn.classList.toggle('on', boosting);
      me.g.classList.toggle('boosting', boosting);
      boostBtn.classList.toggle('empty', drained);
      meterEl.style.setProperty('--m', meter.toFixed(2));
      const wobF = (k: Kart) => (k.wob > 0 ? 0.55 : 1);
      const meT = state === 'count' ? 0 : state === 'finish' ? 380 : (boosting ? 960 : 560) * wobF(me);
      me.v += (meT - me.v) * Math.min(1, dt * (boosting ? 3 : 1.7));
      me.x += me.v * dt;
      // rivals
      const nearEnd = me.x > TOTAL - 2600;
      for (const k of rivalsK) {
        let t = state === 'count' ? 0 : k.base * (1 + 0.05 * Math.sin(time * 0.6 + k.phase));
        if (state === 'race') {
          // Friends stay close for most of the race (a gentle rubber band); the last stretch is a
          // real sprint, so holding BOOST at the end wins it.
          const gap = k.x - me.x;
          const band = me.x < TOTAL - 1800 ? 1 : 0.15;
          t += clamp((k.off - gap) * 0.35, -260, 480) * band;
          // the last friend never blocks the podium
          if (nearEnd && !k.done) {
            const ahead = rivalsK.filter((o) => o.x > me.x).length;
            const slowest = rivalsK.reduce((a, b) => (a.x < b.x ? a : b));
            if (ahead >= 3 && k === slowest) t *= 0.6;
          }
        }
        t *= wobF(k);
        k.v += (t - k.v) * Math.min(1, dt * 1.5);
        k.x += k.v * dt;
        k.laneT -= dt;
        if (k.laneT <= 0 && state !== 'count') {
          k.laneT = 0.35;
          const danger = (lane: number) => items.some((it) => !it.done && (it.kind === 'cone' || it.kind === 'puddle') && it.lane === lane && it.x > k.x && it.x < k.x + 360);
          const crowded = (lane: number) => ks.some((o) => o !== k && o.lane === lane && Math.abs(o.x - k.x) < 240);
          const free = (lane: number) => !danger(lane) && !crowded(lane);
          if ((danger(k.lane) && Math.random() < 0.8) || crowded(k.lane)) {
            const opts = [k.lane - 1, k.lane + 1].filter((l) => l >= 0 && l <= 2 && free(l));
            if (opts.length) k.lane = pick(opts);
          } else if (Math.random() < 0.03) {
            const l = clamp(k.lane + (Math.random() < 0.5 ? -1 : 1), 0, 2);
            if (free(l)) k.lane = l;
          }
        }
      }
      // lanes, wobbles, items, finish line
      for (const k of ks) {
        k.y += (LANES[k.lane] - k.y) * Math.min(1, dt * 9);
        k.wob = Math.max(0, k.wob - dt);
        if (!k.done && k.x >= TOTAL) {
          k.done = time;
          finishOrder.push(k);
          if (k.you) finishRace();
        }
        for (const it of items) {
          if (it.done || Math.abs(it.x - k.x) > 70 || Math.abs(LANES[it.lane] - k.y) > 42) continue;
          if (k.you) {
            if (it.kind === 'coin' || it.kind === 'star') collect(it);
            else {
              it.done = true;
              if (it.kind === 'cone') it.g.firstElementChild?.classList.add('mg-knock');
              else {
                const sp = toScreen(svg, it.x - camX, LANES[it.lane]);
                burst('bubble', sp.x, sp.y, 10);
              }
              hit(k, it.kind);
            }
          } else if ((it.kind === 'cone' || it.kind === 'puddle') && !k.hitIds.has(it.id) && k.wob <= 0) {
            k.hitIds.add(it.id);
            hit(k, it.kind);
          }
        }
      }
      if (state === 'race') {
        const lap = Math.min(LAPS, Math.floor(me.x / LAP) + 1);
        if (lap !== lapShown) {
          lapShown = lap;
          banner(root, r, lap === LAPS ? 'Last lap!' : `Lap ${lap}!`, 'fire', 1100);
          sound.ding();
        }
        setPill(root, 'k-lap', `Lap ${lap}/${LAPS}`);
        const pos = finishOrder.length + rivalsK.filter((k) => !k.done && k.x > me.x).length + 1;
        const pp = q(root, '.k-pos');
        if (pp.dataset.p !== String(pos)) {
          pp.dataset.p = String(pos);
          pp.innerHTML = `${medal(pos)}<span class="n">${ordinal(pos)}</span>`;
          if (pos === 1 && time > 5) sound.squeak();
        }
      }
      // camera and drawing
      camX = me.x - view.w * 0.3;
      world.setAttribute('transform', `translate(${f(-camX)} 0)`);
      hills.setAttribute('transform', `translate(${f(-((camX * 0.12) % 2000) - 100)} 0)`);
      town.setAttribute('transform', `translate(${f(-((camX * 0.45) % 2400) - 100)} 0)`);
      marks.setAttribute('transform', `translate(${f(-(((camX % 160) + 160) % 160) - 160)} 0)`);
      for (const it of items) {
        const vis = it.x > camX - 300 && it.x < camX + view.w + 300;
        if (vis !== it.vis) {
          it.vis = vis;
          it.g.style.display = vis ? '' : 'none';
        }
      }
      for (const k of ks) {
        const w = k.wob > 0 ? (k.spin ? (1 - k.wob / 0.9) * 360 : Math.sin(time * 28) * 9 * k.wob) : 0;
        const tilt = (LANES[k.lane] - k.y) * -0.08;
        k.g.setAttribute('transform', `translate(${f(k.x)} ${f(k.y)}) scale(${KS})`);
        k.inner.setAttribute('transform', `rotate(${f(w + tilt)} 0 -60)${k.you && boosting ? ` translate(${f(Math.sin(time * 60) * 1.5)} 0)` : ''}`);
      }
      const order = [...ks].sort((a, b) => a.y - b.y);
      const key = order.map((k) => ks.indexOf(k)).join();
      if (key !== lastOrder) {
        lastOrder = key;
        order.forEach((k) => kartsG.appendChild(k.g));
      }
      const bucket = Math.round(me.v / 120);
      if (bucket !== spinBucket) {
        spinBucket = bucket;
        svg.style.setProperty('--spin', `${f(Math.max(0.12, 1.6 - me.v / 500))}s`);
      }
      // speed lines while boosting
      linesG.style.opacity = boosting ? '0.75' : '0';
      if (boosting) {
        lines.forEach((l, i) => {
          l.x -= me.v * 2.2 * dt;
          if (l.x < -l.len) {
            l.x = view.w + Math.random() * 300;
            l.y = view.y0 + Math.random() * view.h;
          }
          const e = lineEls[i];
          e.setAttribute('x', f(l.x));
          e.setAttribute('y', f(l.y));
          e.setAttribute('width', f(l.len));
        });
      }
      if (boosting && Math.random() < dt * 20) {
        const sp = document.createElementNS(NS, 'circle');
        sp.setAttribute('cx', f(me.x - 95 * KS));
        sp.setAttribute('cy', f(me.y - 30 + Math.random() * 20));
        sp.setAttribute('r', '10');
        sp.setAttribute('class', 'mg-puff');
        fxG.appendChild(sp);
        window.setTimeout(() => sp.remove(), 600);
      }
    });
  };

  chooser();
}

// =====================================================================================
// 2. Swim race at the hotel pool
// =====================================================================================
const POOL = { x0: 160, x1: 1440, top: 270, laneH: 132 };
const SWIM_IN = POOL.x0 + 70;
const SWIM_OUT = POOL.x1 - 70;
const CAPS = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5'];

interface Swimmer {
  x: number; dir: 1 | -1; v: number; lane: number; legs: number; done: number; racer: Racer; you: boolean;
  armA: [number, number]; armT: [number, number]; rate: number; tapT: number; side: 0 | 1;
  g: SVGGElement; flip: SVGGElement; arms: [SVGGElement, SVGGElement]; bob: SVGGElement; wake: SVGGElement;
}

export function openSwimRace(dollId: string | undefined, onClose: () => void): void {
  const sh = shell('mg-swim', onClose);
  let player = choosePlayer(dollId);

  const chooser = () => {
    sh.fresh();
    const preview = () => `<svg viewBox="-130 -130 260 200"><ellipse cx="0" cy="40" rx="120" ry="26" fill="#7cc8ff" opacity="0.6"/><g transform="scale(0.95)">${swimHead(player.look, CAPS[0], 'happy')}</g><ellipse cx="0" cy="58" rx="100" ry="14" fill="#fff" opacity="0.5"/></svg>`;
    sh.root.innerHTML = `<div class="mg-pick">
      <button class="round-btn mg-x" data-x aria-label="Close">${icon('close')}</button>
      <h2>${swimIcon}Swim Race</h2>
      <div class="mg-preview mg-bob-anim">${preview()}</div>
      <p class="mg-how">${handIcon(true)}<span>Tap <b>Left</b>, <b>Right</b>, <b>Left</b>, <b>Right</b> to swim fast!</span>${handIcon(false)}</p>
      <h3>Who's swimming?</h3>
      ${rosterHtml(player)}
      <button class="btn primary mg-go" data-go>${swimIcon}<span>Dive in!</span></button>
    </div>`;
    const pv = q(sh.root, '.mg-preview');
    wireRoster(sh.root, (d) => {
      player = d;
      pv.innerHTML = preview();
    });
    q(sh.root, '[data-go]').addEventListener('click', () => {
      sound.pop();
      race();
    });
  };

  const race = () => {
    const r = sh.fresh();
    const root = sh.root;
    root.innerHTML = hudHtml(pill('s-len', swimIcon, 'Length 1/2') + pill('s-pos', medal(1), '1st')) +
      `<button class="mg-stroke l" data-side="0" aria-label="Left">${handIcon(true)}<b>Left</b></button><button class="mg-stroke r" data-side="1" aria-label="Right">${handIcon(false)}<b>Right</b></button>`;
    q(root, '[data-back]').addEventListener('click', () => {
      sound.tap();
      chooser();
    });
    const svg = makeSvg(root, 's-svg');
    const laneY = (i: number) => POOL.top + POOL.laneH * (i + 0.5);
    const bottom = POOL.top + POOL.laneH * 4;
    let tiles = '';
    for (let x = POOL.x0; x < POOL.x1; x += 64) tiles += `<path d="M${x} ${POOL.top} L${x} ${bottom}" stroke="#ffffff" stroke-width="2" opacity="0.18"/>`;
    for (let y = POOL.top; y < bottom; y += 64) tiles += `<path d="M${POOL.x0} ${y} L${POOL.x1} ${y}" stroke="#ffffff" stroke-width="2" opacity="0.18"/>`;
    let ropes = '';
    for (let i = 1; i < 4; i++) {
      const y = POOL.top + POOL.laneH * i;
      for (let x = POOL.x0 + 14; x < POOL.x1; x += 28) {
        const end = x < POOL.x0 + 160 || x > POOL.x1 - 160;
        ropes += `<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="${end ? '#ff5c7a' : (x / 28) % 2 < 1 ? '#fff' : ['#ff9ec7', '#ffd36b', '#9b6bff'][i - 1]}"/>`;
      }
    }
    let lanesMark = '';
    for (let i = 0; i < 4; i++) {
      const y = laneY(i);
      lanesMark += `<rect x="${POOL.x0 + 90}" y="${y - 7}" width="${POOL.x1 - POOL.x0 - 180}" height="14" rx="7" fill="#2a6fb0" opacity="0.28"/><path d="M${POOL.x0 + 70} ${y - 26} L${POOL.x0 + 90} ${y - 26} L${POOL.x0 + 90} ${y + 26} L${POOL.x0 + 70} ${y + 26} M${POOL.x1 - 70} ${y - 26} L${POOL.x1 - 90} ${y - 26} L${POOL.x1 - 90} ${y + 26} L${POOL.x1 - 70} ${y + 26}" stroke="#2a6fb0" stroke-width="12" fill="none" opacity="0.28"/>`;
      lanesMark += `<g transform="translate(${POOL.x0 - 70} ${y})"><rect x="-44" y="-40" width="88" height="80" rx="12" fill="#fff" stroke="#d9dbe6" stroke-width="4"/><text x="0" y="16" font-family="Fredoka, sans-serif" font-weight="700" font-size="44" fill="${dark(CAPS[i], 0.15)}" text-anchor="middle">${i + 1}</text></g>`;
    }
    let bunting = `<path d="M${POOL.x0 - 100} 160 Q800 230 ${POOL.x1 + 100} 160" stroke="#8f86a8" stroke-width="3" fill="none"/>`;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = lerp(POOL.x0 - 100, POOL.x1 + 100, t);
      const y = 160 + 4 * t * (1 - t) * 70 * 0.98;
      bunting += `<path d="M${f(x - 18)} ${f(y)} L${f(x + 18)} ${f(y)} L${f(x)} ${f(y + 34)}Z" fill="${['#ff7eb6', '#ffd36b', '#7cc8ff', '#5fd3b5', '#c99bff'][i % 5]}"/>`;
    }
    svg.innerHTML = `<defs><linearGradient id="mgs-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0ff"/><stop offset="1" stop-color="#36b4ec"/></linearGradient>
      <pattern id="mgs-deck" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#fff4ea"/><path d="M0 0 L80 0 M0 0 L0 80" stroke="#f0dccb" stroke-width="3"/></pattern>
      <pattern id="mgs-caustic" width="220" height="120" patternUnits="userSpaceOnUse"><path d="M0 60 Q30 30 60 60 T120 60 T180 60 T240 60 M-30 0 Q0 -30 30 0 T90 0 T150 0 T210 0 M-30 120 Q0 90 30 120 T90 120 T150 120 T210 120" stroke="#fff" stroke-width="5" fill="none" opacity="0.22"/></pattern></defs>
      <rect x="-1000" y="-2000" width="3600" height="2200" fill="#bfe8ff"/>
      ${cloudG(200, -500, 1.2)}${cloudG(1300, -700, 1)}
      <g transform="translate(-500 200)">${hotelFacade(2600, -1400)}</g>
      <rect x="-1000" y="150" width="3600" height="2000" fill="url(#mgs-deck)"/>
      <g transform="translate(-140 225)">${palmG()}</g><g transform="translate(1740 225)">${palmG()}</g>
      <g transform="translate(-60 ${bottom + 230})">${umbrellaG('#ff7eb6', '#fff')}</g><g transform="translate(120 ${bottom + 250})">${loungerG('#7cc8ff')}</g>
      <g transform="translate(1660 ${bottom + 230})">${umbrellaG('#5fd3b5', '#fff')}</g><g transform="translate(1480 ${bottom + 250})">${loungerG('#ffd36b')}</g>
      <g transform="translate(560 ${bottom + 220}) scale(0.9)">${loungerG('#ff9ec7')}</g><g transform="translate(1040 ${bottom + 220}) scale(0.9)">${loungerG('#c99bff')}</g>
      ${bunting}
      <rect x="${POOL.x0 - 34}" y="${POOL.top - 34}" width="${POOL.x1 - POOL.x0 + 68}" height="${bottom - POOL.top + 68}" rx="26" fill="#ffffff" stroke="#e6d6e6" stroke-width="4"/>
      <rect x="${POOL.x0}" y="${POOL.top}" width="${POOL.x1 - POOL.x0}" height="${bottom - POOL.top}" rx="8" fill="url(#mgs-water)"/>
      ${tiles}${lanesMark}
      <rect class="mg-caustic" x="${POOL.x0}" y="${POOL.top}" width="${POOL.x1 - POOL.x0}" height="${bottom - POOL.top}" fill="url(#mgs-caustic)"/>
      ${ropes}
      <g class="s-swimmers"></g><g class="s-fx"></g>`;
    const view = fit(svg, root, r, 1050, 900, 0.62, 800);
    const swG = q<SVGGElement>(svg, '.s-swimmers');

    const rivals = rivalsFor(player, 3);
    const YOU_LANE = 2;
    const racers: Racer[] = [];
    let ri = 0;
    for (let i = 0; i < 4; i++) racers.push(i === YOU_LANE ? { name: player.name, look: player.look } : rivals[ri++]);
    const rates = shuffle([3.6, 3.1, 2.5]);
    let rr = 0;
    const sw: Swimmer[] = racers.map((racer, lane) => {
      const you = lane === YOU_LANE;
      const look = racer.look;
      const g = document.createElementNS(NS, 'g');
      const skin = look.skin;
      const arm = (back: boolean) => `<g class="s-arm"><rect x="-10" y="-6" width="112" height="24" rx="12" fill="${back ? dark(skin, 0.12) : skin}"/><circle cx="104" cy="6" r="15" fill="${back ? dark(skin, 0.12) : skin}"/></g>`;
      g.innerHTML = `<g transform="scale(1.12)"><g class="s-flip"><g class="s-wake"><ellipse cx="-120" cy="10" rx="40" ry="12" fill="#fff" opacity="0.7"/><ellipse cx="-170" cy="6" rx="26" ry="9" fill="#fff" opacity="0.5"/><ellipse cx="-210" cy="10" rx="16" ry="6" fill="#fff" opacity="0.35"/></g>
        <ellipse cx="-70" cy="16" rx="96" ry="22" fill="${dark(CAPS[lane], 0.2)}" opacity="0.35"/>
        <g transform="translate(-14 -10)">${arm(true)}</g>
        <g transform="translate(-4 -4)">${arm(false)}</g>
        <g class="s-bob"><g transform="translate(6 -34) scale(0.5)">${swimHead(look, CAPS[lane], you ? 'happy' : 'normal')}</g></g>
        <ellipse cx="0" cy="16" rx="70" ry="13" fill="#fff" opacity="0.55"/><ellipse cx="0" cy="16" rx="50" ry="8" fill="#bff0ff" opacity="0.7"/></g></g>` +
        (you ? `<g transform="translate(0 -122)"><g class="mg-bob"><path d="M-34 -22 L34 -22 Q44 -22 44 -12 L44 4 Q44 14 34 14 L8 14 L0 24 L-8 14 L-34 14 Q-44 14 -44 4 L-44 -12 Q-44 -22 -34 -22Z" fill="#ff4f8b" stroke="#fff" stroke-width="4"/><text x="0" y="0" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#fff" text-anchor="middle" dominant-baseline="middle">YOU</text></g></g>` : '');
      swG.appendChild(g);
      const armsEls = g.querySelectorAll<SVGGElement>('.s-arm');
      return {
        x: SWIM_IN, dir: 1, v: 0, lane, legs: 0, done: 0, racer, you, armA: [180, 0], armT: [180, 0], rate: you ? 0 : rates[rr++], tapT: Math.random() * 0.2, side: 0,
        g, flip: q<SVGGElement>(g, '.s-flip'), arms: [armsEls[0], armsEls[1]], bob: q<SVGGElement>(g, '.s-bob'), wake: q<SVGGElement>(g, '.s-wake'),
      };
    });
    const me = sw[YOU_LANE];
    const others = sw.filter((s) => !s.you);

    let state: 'count' | 'race' | 'finish' = 'count';
    let time = 0;
    let same = 0;
    let lastSide = -1;
    const finishOrder: Swimmer[] = [];
    let camX = view.x0;
    const btns = root.querySelectorAll<HTMLElement>('.mg-stroke');

    const stroke = (s: Swimmer, side: 0 | 1, good: boolean) => {
      s.armT[side] += 360;
      s.v = Math.min(260, s.v + (good ? 30 : 10));
      s.side = side;
      if (s.you) {
        const sp = toScreen(svg, s.x + s.dir * 80, laneY(s.lane));
        burst('bubble', sp.x, sp.y, good ? 5 : 2);
      }
    };
    const tap = (side: 0 | 1) => {
      if (state !== 'race') {
        if (state === 'count') btns[side].classList.add('nudge');
        return;
      }
      const good = side !== lastSide;
      if (good) {
        same = 0;
        playNote('xylophone', side ? 76 : 72);
      } else {
        same++;
        sound.click();
        if (same === 3) banner(root, r, 'Left, right, left, right!', '', 1200);
      }
      lastSide = side;
      stroke(me, side, good);
      btns.forEach((b, i) => b.classList.toggle('next', i !== side));
      const b = btns[side];
      b.classList.remove('hit');
      void b.offsetWidth;
      b.classList.add('hit');
    };
    btns.forEach((b) =>
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tap(Number(b.dataset.side) as 0 | 1);
      }),
    );
    r.on(window, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'ArrowLeft') tap(0);
      if (k === 'ArrowRight') tap(1);
    });

    banner(root, r, 'On your marks...', '', 1100);
    r.later(() => countdown(root, r, () => {
      state = 'race';
      btns.forEach((b, i) => b.classList.toggle('next', i === 0));
      for (const s of sw) {
        s.v = 60;
        const sp = toScreen(svg, s.x, laneY(s.lane));
        burst('bubble', sp.x, sp.y, 8);
      }
      sound.spray();
    }), 500);

    const finishRace = () => {
      state = 'finish';
      const place = finishOrder.indexOf(me) + 1;
      sound.success();
      celebrate();
      banner(root, r, place === 1 ? 'You win!' : 'Touch!', 'fire', 2000);
      r.later(() => {
        const order = [...finishOrder, ...sw.filter((s) => !finishOrder.includes(s)).sort((a, b) => b.legs - a.legs || (a.dir > 0 ? b.x - a.x : a.x - b.x))];
        const coins = [25, 18, 12, 8][place - 1] ?? 8;
        G.bump('swim');
        sound.applause();
        G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        showResult(sh, {
          cls: 'mg-podium-card',
          art: podiumSvg(order.map((s) => s.racer), order.indexOf(me)),
          title: place === 1 ? `${player.name} wins the swim race!` : `${player.name} came ${ordinal(place)}!`,
          lines: [place === 1 ? 'Splish, splash, super fast!' : 'Great swimming! Left, right, left, right goes fastest.'],
          coins, again: 'Swim again', change: 'Change swimmer',
        }, race, chooser);
      }, 2400);
    };

    r.loop((dt) => {
      time += dt;
      if (state === 'race') {
        for (const s of others) {
          let rate = s.rate;
          const gap = (s.legs - me.legs) * 2000 + (s.x - me.x) * s.dir;
          if (gap > 180) rate *= 0.8;
          else if (gap < -350) rate *= 1.15;
          if (me.legs === 1 && !s.done && Math.abs(me.x - SWIM_IN) < 400) {
            const ahead = others.filter((o) => o.legs > me.legs || (o.legs === me.legs && (o.x - me.x) * o.dir > 0)).length;
            const slowest = others.reduce((a, b) => (a.legs * 2000 + Math.abs(a.x - SWIM_IN) * (a.legs ? -1 : 1) < b.legs * 2000 + Math.abs(b.x - SWIM_IN) * (b.legs ? -1 : 1) ? a : b));
            if (ahead >= 3 && s === slowest) rate *= 0.5;
          }
          s.tapT -= dt;
          if (s.tapT <= 0 && !s.done) {
            s.tapT = 1 / rate;
            stroke(s, s.side ? 0 : 1, true);
          }
        }
      }
      for (const s of sw) {
        s.v *= Math.exp(-dt * (s.done ? 2.5 : 1.15));
        s.x += s.v * s.dir * dt;
        if (s.dir > 0 && s.x >= SWIM_OUT) {
          s.x = SWIM_OUT;
          s.dir = -1;
          s.legs = 1;
          s.v *= 1.15;
          if (s.you) {
            banner(root, r, 'Flip turn!', 'fire', 900);
            sound.boing();
            setPill(root, 's-len', 'Length 2/2');
          }
          const sp = toScreen(svg, s.x + 60, laneY(s.lane));
          burst('bubble', sp.x, sp.y, s.you ? 14 : 6);
        }
        if (s.dir < 0 && s.legs === 1 && s.x <= SWIM_IN && !s.done) {
          s.x = SWIM_IN;
          s.done = time;
          s.v = 0;
          finishOrder.push(s);
          if (s.you) finishRace();
        }
        for (const i of [0, 1] as const) {
          const d = s.armT[i] - s.armA[i];
          s.armA[i] += Math.sign(d) * Math.min(Math.abs(d), dt * 820);
          const a = s.armA[i] % 360;
          s.arms[i].setAttribute('transform', `rotate(${f(a)})`);
          s.arms[i].style.opacity = a > 20 && a < 160 ? '0.35' : '1';
        }
        s.g.setAttribute('transform', `translate(${f(s.x)} ${f(laneY(s.lane))})`);
        s.flip.setAttribute('transform', s.dir < 0 ? 'scale(-1 1)' : '');
        s.bob.setAttribute('transform', `translate(0 ${f(Math.sin(time * 6 + s.lane) * 3 + Math.sin((s.armA[0] * Math.PI) / 180) * 3)})`);
        s.wake.style.opacity = f(Math.min(1, s.v / 90));
      }
      if (state === 'race') {
        const pos = finishOrder.length + others.filter((o) => !o.done && (o.legs > me.legs || (o.legs === me.legs && (o.x - me.x) * o.dir > 0))).length + 1;
        const pp = q(root, '.s-pos');
        if (pp.dataset.p !== String(pos)) {
          pp.dataset.p = String(pos);
          pp.innerHTML = `${medal(pos)}<span class="n">${ordinal(pos)}</span>`;
        }
      }
      // the camera follows when the pool is wider than the screen
      const want = view.w >= 1600 ? 800 - view.w / 2 : clamp(me.x - view.w / 2 + me.dir * 120, -40, 1640 - view.w);
      camX += (want - camX) * Math.min(1, dt * 3);
      svg.setAttribute('viewBox', `${f(camX)} ${f(view.y0)} ${f(view.w)} ${f(view.h)}`);
    });
  };

  chooser();
}

// =====================================================================================
// 3. Ice skating on a frozen pond at night
// =====================================================================================
const BEAT = 0.5; // seconds per beat, three beats to a bar
// A soft original waltz in C: bass on beat 1, chord on beats 2 and 3, melody on top.
const WALTZ_CHORDS = [[48, 64, 67], [45, 64, 69], [41, 65, 69], [43, 62, 67], [48, 64, 67], [45, 60, 64], [41, 60, 65], [43, 62, 65]];
const WALTZ_TUNE = [
  [76, 0, 79], [81, 0, 79], [77, 76, 74], [74, 0, 0],
  [72, 0, 76], [76, 74, 72], [74, 0, 72], [71, 0, 0],
  [76, 0, 79], [84, 0, 81], [81, 79, 77], [79, 0, 0],
  [77, 76, 74], [72, 0, 76], [74, 0, 71], [72, 0, 0],
];
const SKATE_TIME = 60;

export function openIceSkate(dollId: string | undefined, onClose: () => void): void {
  const sh = shell('mg-skate', () => {
    duckMusic(false);
    onClose();
  });
  let player = choosePlayer(dollId);
  duckMusic(true);

  const chooser = () => {
    sh.fresh();
    const b = body(player.look.age, !!player.look.boy);
    const preview = () => `<svg viewBox="-150 -440 300 470"><ellipse cx="0" cy="12" rx="110" ry="18" fill="#bfe6ff"/>${renderDoll(player.look, { pose: 'wave', expr: 'happy' })}${skatesG(b.legX, '#fff')}</svg>`;
    sh.root.innerHTML = `<div class="mg-pick">
      <button class="round-btn mg-x" data-x aria-label="Close">${icon('close')}</button>
      <h2>${skateIcon}Ice Skating</h2>
      <div class="mg-preview mg-tall">${preview()}</div>
      <p class="mg-how">${icon('hand')}<span>Drag to glide. Tap <b>Spin</b> and <b>Jump</b> on the beat for big points!</span></p>
      <h3>Who's skating?</h3>
      ${rosterHtml(player)}
      <button class="btn primary mg-go" data-go>${skateIcon}<span>Skate!</span></button>
    </div>`;
    const pv = q(sh.root, '.mg-preview');
    wireRoster(sh.root, (d) => {
      player = d;
      const bb = body(d.look.age, !!d.look.boy);
      pv.innerHTML = `<svg viewBox="-150 -440 300 470"><ellipse cx="0" cy="12" rx="110" ry="18" fill="#bfe6ff"/>${renderDoll(d.look, { pose: 'wave', expr: 'happy' })}${skatesG(bb.legX, '#fff')}</svg>`;
    });
    q(sh.root, '[data-go]').addEventListener('click', () => {
      sound.pop();
      skate();
    });
  };

  const skate = () => {
    const r = sh.fresh();
    const root = sh.root;
    root.innerHTML = hudHtml(pill('i-time', clockIcon, `${SKATE_TIME}`) + pill('i-score', icon('star'), '0') + `<div class="pill mg-pill mg-beats"><i></i><i></i><i></i></div>`) +
      `<div class="mg-tricks"><button class="mg-trick spin" data-trick="spin">${spinIcon}<b>Spin</b></button><button class="mg-trick jump" data-trick="jump">${jumpIcon}<b>Jump</b></button></div>`;
    q(root, '[data-back]').addEventListener('click', () => {
      sound.tap();
      chooser();
    });
    const svg = makeSvg(root, 'i-svg');
    svg.innerHTML = `<g class="i-bg"></g><g class="i-trail"></g><g class="i-items"></g><g class="i-skater"><ellipse class="i-shadow" cx="0" cy="6" rx="70" ry="16" fill="#2a4a7a" opacity="0.25"/><g class="i-body"><g class="i-spin"></g></g></g><g class="i-fx"></g>`;
    const bgG = q<SVGGElement>(svg, '.i-bg');
    const trailG = q<SVGGElement>(svg, '.i-trail');
    const itemsG = q<SVGGElement>(svg, '.i-items');
    const skaterG = q<SVGGElement>(svg, '.i-skater');
    const shadowEl = q<SVGEllipseElement>(svg, '.i-shadow');
    const bodyG = q<SVGGElement>(svg, '.i-body');
    const spinG = q<SVGGElement>(svg, '.i-spin');
    const fxG = q<SVGGElement>(svg, '.i-fx');
    const lb = body(player.look.age, !!player.look.boy);
    const SC = 0.58;
    const drawSkater = (pose: 'stand' | 'wave' | 'held', expr: 'normal' | 'happy' = 'happy') => (spinG.innerHTML = `${renderDoll(player.look, { pose, expr })}${skatesG(lb.legX, '#fff')}`);
    drawSkater('stand');

    const pond = { cx: 0, cy: 0, rx: 500, ry: 300 };
    const drawBg = (v: View) => {
      pond.cx = 0;
      pond.cy = v.h * 0.12;
      pond.rx = v.w * 0.45;
      pond.ry = Math.min(v.h * 0.3, v.w * 0.34);
      const top = v.y0;
      const rnd = rng(11);
      let s = `<defs><linearGradient id="mgi-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a4a"/><stop offset="0.55" stop-color="#4a3a8a"/><stop offset="1" stop-color="#9b7ad6"/></linearGradient>
        <radialGradient id="mgi-ice" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#f4fbff"/><stop offset="0.6" stop-color="#cdeaff"/><stop offset="1" stop-color="#a9d4f5"/></radialGradient>
        <radialGradient id="mgi-glow"><stop offset="0" stop-color="#fff6c8" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>`;
      s += `<rect x="${f(v.x0 - 10)}" y="${f(top - 10)}" width="${f(v.w + 20)}" height="${f(v.h + 20)}" fill="url(#mgi-sky)"/>`;
      for (let i = 0; i < 46; i++) s += `<circle class="mg-twinkle" style="animation-delay:${f(rnd() * 3)}s" cx="${f(v.x0 + rnd() * v.w)}" cy="${f(top + rnd() * (pond.cy - pond.ry - top - 60))}" r="${f(1.5 + rnd() * 2.5)}" fill="#fff"/>`;
      const mx = v.x0 + v.w * 0.8;
      const my = top + Math.max(110, (pond.cy - pond.ry - top) * 0.3);
      s += `<circle cx="${f(mx)}" cy="${f(my)}" r="140" fill="url(#mgi-glow)"/><circle cx="${f(mx)}" cy="${f(my)}" r="56" fill="#fff6d8"/><circle cx="${f(mx + 26)}" cy="${f(my - 14)}" r="50" fill="#3a2f78" opacity="0.0"/><circle cx="${f(mx - 16)}" cy="${f(my + 12)}" r="9" fill="#f0e2b8"/><circle cx="${f(mx + 14)}" cy="${f(my - 18)}" r="6" fill="#f0e2b8"/>`;
      // snowy hills, trees and the snowbank around the pond
      const hy = pond.cy - pond.ry + 40;
      s += `<path d="M${f(v.x0 - 20)} ${f(hy)} Q${f(v.x0 + v.w * 0.25)} ${f(hy - 140)} ${f(v.x0 + v.w * 0.5)} ${f(hy - 40)} Q${f(v.x0 + v.w * 0.75)} ${f(hy - 160)} ${f(v.x0 + v.w + 20)} ${f(hy - 20)} L${f(v.x0 + v.w + 20)} ${f(top + v.h + 20)} L${f(v.x0 - 20)} ${f(top + v.h + 20)}Z" fill="#e6ecff"/>`;
      s += `<rect x="${f(v.x0 - 20)}" y="${f(pond.cy)}" width="${f(v.w + 40)}" height="${f(v.h)}" fill="#f2f5ff"/>`;
      const trees: [number, number, number][] = [];
      for (let i = 0; i < 9; i++) trees.push([v.x0 + (i + 0.5) * (v.w / 9) + (rnd() - 0.5) * 60, hy - 40 + rnd() * 50, 0.55 + rnd() * 0.35]);
      for (const [x, y, sc] of trees) s += `<g transform="translate(${f(x)} ${f(y)})">${snowPine(sc)}</g>`;
      // fairy lights strung between poles
      const poles = [v.x0 + v.w * 0.06, v.x0 + v.w * 0.36, v.x0 + v.w * 0.64, v.x0 + v.w * 0.94];
      const py = pond.cy - pond.ry - 30;
      const pTop = py - 230;
      let lights = '';
      const cols = ['#ff9ec7', '#ffe680', '#8ff0d0', '#c9a6ff', '#9fd8ff'];
      let li = 0;
      for (let i = 0; i < poles.length - 1; i++) {
        const a = poles[i];
        const b = poles[i + 1];
        const sag = 70;
        lights += `<path d="M${f(a)} ${f(pTop)} Q${f((a + b) / 2)} ${f(pTop + sag * 2)} ${f(b)} ${f(pTop)}" stroke="#2a2550" stroke-width="3" fill="none"/>`;
        for (let k = 1; k < 9; k++) {
          const t = k / 9;
          const x = lerp(a, b, t);
          const y = pTop + 4 * t * (1 - t) * sag + 8;
          const c = cols[li++ % cols.length];
          lights += `<g class="mg-bulb" style="animation-delay:${f((li % 3) * BEAT)}s"><circle cx="${f(x)}" cy="${f(y)}" r="20" fill="${c}" opacity="0.28"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="10" fill="${c}"/></g>`;
        }
      }
      for (const x of poles) s += `<rect x="${f(x - 6)}" y="${f(pTop - 10)}" width="12" height="${f(py - pTop + 40)}" rx="5" fill="#5a4a8a"/><circle cx="${f(x)}" cy="${f(pTop - 16)}" r="12" fill="#fff6c8"/><circle cx="${f(x)}" cy="${f(pTop - 16)}" r="34" fill="url(#mgi-glow)"/>`;
      s += `<g class="i-lights">${lights}</g>`;
      s += `<ellipse cx="0" cy="${f(pond.cy + 16)}" rx="${f(pond.rx + 50)}" ry="${f(pond.ry + 40)}" fill="#ffffff"/><ellipse cx="0" cy="${f(pond.cy + 8)}" rx="${f(pond.rx + 24)}" ry="${f(pond.ry + 20)}" fill="#dfe8fb"/>`;
      s += `<ellipse cx="0" cy="${f(pond.cy)}" rx="${f(pond.rx)}" ry="${f(pond.ry)}" fill="url(#mgi-ice)"/>`;
      for (let i = 0; i < 7; i++) {
        const x = (rnd() - 0.5) * pond.rx * 1.3;
        const y = pond.cy + (rnd() - 0.5) * pond.ry * 1.2;
        s += `<path d="M${f(x - 60)} ${f(y + 10)} L${f(x + 60)} ${f(y - 10)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`;
      }
      // snowmen and bushes on the bank
      const sm = (x: number, y: number, sc: number) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})"><circle cy="-40" r="44" fill="#fff" stroke="#dfe8fb" stroke-width="4"/><circle cy="-110" r="32" fill="#fff" stroke="#dfe8fb" stroke-width="4"/><circle cx="-10" cy="-116" r="4" fill="#2a2550"/><circle cx="10" cy="-116" r="4" fill="#2a2550"/><path d="M0 -106 L22 -102 L0 -100Z" fill="#ff8a3d"/><path d="M-30 -88 Q0 -76 30 -88 L32 -78 Q0 -64 -32 -78Z" fill="#ff7eb6"/><rect x="-26" y="-150" width="52" height="10" rx="4" fill="#5a4a8a"/><rect x="-16" y="-178" width="32" height="30" rx="5" fill="#5a4a8a"/></g>`;
      s += sm(pond.rx * 0.92, pond.cy + pond.ry * 0.7, 0.9) + sm(-pond.rx * 0.95, pond.cy + pond.ry * 0.62, 0.75);
      // gently falling snow
      for (let i = 0; i < 26; i++) {
        const x = v.x0 + rnd() * v.w;
        const d = 7 + rnd() * 7;
        s += `<g opacity="0.8"><g transform="translate(${f(x)} 0)">${`<circle r="${f(2 + rnd() * 3)}" fill="#fff"><animateTransform attributeName="transform" type="translate" values="0 ${f(top - 20)};${f((rnd() - 0.5) * 80)} ${f(top + v.h + 20)}" dur="${f(d)}s" begin="${f(-rnd() * d)}s" repeatCount="indefinite"/></circle>`}</g></g>`;
      }
      bgG.innerHTML = s;
    };
    fit(svg, root, r, 1100, 900, 0.5, 0, (v) => {
      v.y0 = -v.h / 2;
      svg.setAttribute('viewBox', `${f(v.x0)} ${f(v.y0)} ${f(v.w)} ${f(v.h)}`);
      drawBg(v);
    });
    const lightsG = () => bgG.querySelector('.i-lights');

    // state
    const p = { x: 0, y: pond.cy + pond.ry * 0.3, vx: 0, vy: 0 };
    let drag: { id: number; x: number; y: number } | null = null;
    let score = 0;
    let timeLeft = SKATE_TIME;
    let state: 'count' | 'skate' | 'end' = 'count';
    let spinT = -1;
    let jumpT = -1;
    let tricks = 0;
    let onBeats = 0;
    let collected = 0;
    let dist = 0;
    let musicT0 = 0;
    let beatN = -1;
    let spawnT = 1;
    const items: { x: number; y: number; kind: 'flake' | 'star'; g: SVGGElement; t: number }[] = [];
    const trail: { x: number; y: number }[] = [];
    const TRAIL = 34;
    trailG.innerHTML = Array.from({ length: TRAIL }, (_, i) => `<circle r="9" fill="${['#ffffff', '#ffd6ec', '#d9c8ff', '#c8f2ff'][i % 4]}" opacity="0"/>`).join('');
    const trailEls = Array.from(trailG.children) as SVGCircleElement[];
    let trailHead = 0;
    const beatEls = root.querySelectorAll<HTMLElement>('.mg-beats i');
    const trickBtns = root.querySelectorAll<HTMLElement>('.mg-trick');

    const inside = (x: number, y: number, m = 0) => ((x - pond.cx) / (pond.rx - 70 - m)) ** 2 + ((y - pond.cy) / (pond.ry - 40 - m)) ** 2;
    svg.addEventListener('pointerdown', (e) => {
      if (drag) return;
      const w = toWorld(svg, e.clientX, e.clientY);
      drag = { id: e.pointerId, ...w };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const w = toWorld(svg, e.clientX, e.clientY);
      drag.x = w.x;
      drag.y = w.y;
    });
    const release = (e: PointerEvent) => drag?.id === e.pointerId && (drag = null);
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    const beatTime = (n: number) => musicT0 + n * BEAT * 1000;
    const onBeat = (now: number) => {
      if (!musicT0) return false;
      const n = Math.round((now - musicT0) / (BEAT * 1000));
      return Math.abs(now - beatTime(n)) < 130;
    };
    const trick = (kind: 'spin' | 'jump') => {
      if (state !== 'skate') return;
      const now = performance.now();
      if (kind === 'spin' && spinT >= 0) return;
      if (kind === 'jump' && jumpT >= 0) return;
      const beat = onBeat(now);
      let pts = kind === 'spin' ? 30 : 40;
      let label = kind === 'spin' ? 'Spin!' : 'Jump!';
      if (kind === 'spin') {
        spinT = 0;
        drawSkater('held');
        sound.whoosh();
      } else {
        jumpT = 0;
        sound.boing();
      }
      if (spinT >= 0 && jumpT >= 0) {
        pts += 40;
        label = 'Spin jump!';
      }
      if (beat) {
        pts *= 2;
        onBeats++;
        label = `On the beat! +${pts}`;
        sound.sparkle();
      } else label += ` +${pts}`;
      tricks++;
      score += pts;
      floatText(fxG, p.x, p.y - 230 * SC - 40, label, beat ? '#ffe680' : '#fff', beat ? 46 : 38);
      const sp = toScreen(svg, p.x, p.y - 100 * SC);
      burst(beat ? 'heart' : 'sparkle', sp.x, sp.y, beat ? 14 : 8);
      const btn = q(root, `[data-trick="${kind}"]`);
      btn.classList.remove('hit');
      void btn.offsetWidth;
      btn.classList.add('hit');
    };
    trickBtns.forEach((b) =>
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        trick(b.dataset.trick as 'spin' | 'jump');
      }),
    );
    r.on(window, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 's') trick('spin');
      if (k === 'j' || k === ' ') trick('jump');
    });

    const spawn = () => {
      let x = 0;
      let y = 0;
      for (let k = 0; k < 20; k++) {
        x = pond.cx + (Math.random() * 2 - 1) * (pond.rx - 110);
        y = pond.cy + (Math.random() * 2 - 1) * (pond.ry - 70);
        if (inside(x, y, 40) < 1 && Math.hypot(x - p.x, y - p.y) > 220 && items.every((o) => Math.hypot(o.x - x, o.y - y) > 160)) break;
      }
      const kind = Math.random() < 0.3 ? 'star' : 'flake';
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${f(x)} ${f(y - 70)})`);
      g.innerHTML = `<g class="mg-pop-in"><g class="mg-bob"><circle r="40" fill="${kind === 'star' ? '#fff3b0' : '#dff4ff'}" opacity="0.35"/>${kind === 'star' ? starG(28) : snowflakeG(26, '#ffffff')}</g></g>`;
      itemsG.appendChild(g);
      items.push({ x, y, kind, g, t: 0 });
    };

    banner(root, r, 'Drag to glide!', '', 1400);
    r.later(() => {
      state = 'skate';
      musicT0 = performance.now() + 200;
      banner(root, r, 'Skate to the music!', 'fire', 1200);
    }, 1300);

    const end = () => {
      state = 'end';
      drag = null;
      drawSkater('wave');
      banner(root, r, 'Beautiful!', 'fire', 1600);
      sound.success();
      r.later(() => {
        const judges = rivalsFor(player, 3);
        const base = clamp(6.4 + score / 360, 6.5, 9.8);
        const cards = judges.map((_, i) => clamp(Math.round((base + [0.1, -0.1, 0.2][i] + Math.random() * 0.3) * 10) / 10, 6.5, 10));
        const total = cards.reduce((a, b) => a + b, 0);
        const coins = clamp(Math.round(15 + (score / 1500) * 20), 15, 35);
        const best = score > (G.s.stats.bestSkate ?? 0);
        if (best) G.s.stats.bestSkate = score;
        G.bump('skate');
        G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        celebrate();
        sound.applause();
        const art = `<svg class="mg-judges" viewBox="-460 -300 920 400">
          ${judges.map((j, i) => `<g transform="translate(${(i - 1) * 280} -70) scale(0.62)">${headG(j.look, 'happy')}</g>`).join('')}
          <rect x="-440" y="-20" width="880" height="110" rx="20" fill="#ffffff" stroke="#e6dcf2" stroke-width="5"/><rect x="-440" y="-20" width="880" height="28" rx="14" fill="#c99bff"/>
          ${judges.map((j, i) => {
            const x = (i - 1) * 280;
            return `<g class="mg-card-pop" style="animation-delay:${0.25 + i * 0.45}s"><g transform="translate(${x + 78} -150)"><rect x="-6" y="40" width="12" height="80" rx="5" fill="#a86b4a"/><rect x="-66" y="-50" width="132" height="96" rx="14" fill="#fff" stroke="${['#ff7eb6', '#7cc8ff', '#5fd3b5'][i]}" stroke-width="7"/><text y="20" font-family="Fredoka, sans-serif" font-weight="700" font-size="54" fill="#4a2546" text-anchor="middle">${cards[i].toFixed(1)}</text></g></g>
              <text x="${x}" y="68" font-family="Fredoka, sans-serif" font-weight="600" font-size="30" fill="#8a6488" text-anchor="middle">${esc(j.name)}</text>`;
          }).join('')}
        </svg>`;
        showResult(sh, {
          cls: 'mg-judge-card',
          art,
          title: `${total.toFixed(1)} points from the judges!`,
          lines: [`${player.name} scored ${score}: ${tricks} trick${tricks === 1 ? '' : 's'} (${onBeats} on the beat) and ${collected} sparkle${collected === 1 ? '' : 's'}.`, best && score > 0 ? 'New best routine!' : `Best: ${G.s.stats.bestSkate ?? score}`],
          coins, again: 'Skate again', change: 'Change skater',
        }, skate, chooser);
        [0, 1, 2].forEach((i) => r.later(() => playNote('xylophone', [79, 83, 86][i]), 250 + i * 450));
      }, 1800);
    };

    r.loop((dt, now) => {
      // waltz
      if (musicT0 && state !== 'end') {
        const n = Math.floor((now - musicT0) / (BEAT * 1000));
        if (n > beatN && n >= 0) {
          beatN = n;
          const bar = Math.floor(n / 3);
          const beat = n % 3;
          const ch = WALTZ_CHORDS[bar % WALTZ_CHORDS.length];
          if (beat === 0) pianoNote(ch[0], 0.2);
          else {
            pianoNote(ch[1], 0.08);
            pianoNote(ch[2], 0.08);
          }
          const m = WALTZ_TUNE[bar % WALTZ_TUNE.length][beat];
          if (m) playNote('harp', m);
          beatEls.forEach((b, i) => b.classList.toggle('on', i === beat));
          trickBtns.forEach((b) => {
            b.classList.remove('beat');
            void b.offsetWidth;
            b.classList.add('beat');
          });
          const lg = lightsG();
          if (lg && beat === 0) {
            lg.classList.remove('flash');
            void (lg as SVGGElement).getBoundingClientRect();
            lg.classList.add('flash');
          }
        }
      }
      if (state === 'skate') {
        timeLeft -= dt;
        setPill(root, 'i-time', String(Math.max(0, Math.ceil(timeLeft))));
        if (timeLeft <= 10 && timeLeft + dt > 10) banner(root, r, '10 seconds left!', '', 1000);
        if (timeLeft <= 0) end();
      }
      // gliding with momentum toward the finger
      if (drag && state === 'skate') {
        const dx = drag.x - p.x;
        const dy = drag.y + 60 - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 20) {
          const a = Math.min(1500, d * 5);
          p.vx += (dx / d) * a * dt;
          p.vy += (dy / d) * a * dt;
        }
        const fr = Math.exp(-1.3 * dt);
        p.vx *= fr;
        p.vy *= fr;
      } else {
        const fr = Math.exp(-(state === 'end' ? 2.5 : 0.45) * dt);
        p.vx *= fr;
        p.vy *= fr;
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 620) {
        p.vx *= 620 / sp;
        p.vy *= 620 / sp;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      dist += sp * dt;
      if (state === 'skate' && dist > 60) {
        score += Math.floor(dist / 60);
        dist %= 60;
      }
      const e = inside(p.x, p.y);
      if (e > 1) {
        // soft bounce off the snowbank
        const k = 1 / Math.sqrt(e);
        p.x = pond.cx + (p.x - pond.cx) * k;
        p.y = pond.cy + (p.y - pond.cy) * k;
        const nx = (p.x - pond.cx) / (pond.rx - 70) ** 2;
        const ny = (p.y - pond.cy) / (pond.ry - 40) ** 2;
        const nl = Math.hypot(nx, ny) || 1;
        const dot = (p.vx * nx + p.vy * ny) / nl;
        if (dot > 0) {
          p.vx -= 1.5 * dot * (nx / nl);
          p.vy -= 1.5 * dot * (ny / nl);
          if (dot > 200) sound.boing();
        }
      }
      // tricks
      let lift = 0;
      let sx = 1;
      if (jumpT >= 0) {
        jumpT += dt / 0.75;
        lift = Math.sin(Math.min(1, jumpT) * Math.PI) * 130;
        if (jumpT >= 1) {
          jumpT = -1;
          lift = 0;
          sound.thud();
          const s2 = toScreen(svg, p.x, p.y);
          burst('sparkle', s2.x, s2.y, 10);
        }
      }
      if (spinT >= 0) {
        spinT += dt / 0.9;
        sx = Math.cos(spinT * Math.PI * 4);
        if (spinT >= 1) {
          spinT = -1;
          sx = 1;
          drawSkater(state === 'end' ? 'wave' : 'stand');
        }
      }
      const lean = clamp(p.vx * 0.02, -12, 12);
      skaterG.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})`);
      shadowEl.setAttribute('rx', f(70 - lift * 0.25));
      bodyG.setAttribute('transform', `translate(0 ${f(-lift)}) rotate(${f(lean)}) scale(${SC})`);
      spinG.setAttribute('transform', `scale(${f(Math.abs(sx) < 0.08 ? 0.08 * Math.sign(sx || 1) : sx)} 1)`);
      // sparkly trail
      const lastP = trail[trail.length - 1];
      if (!lastP || Math.hypot(p.x - lastP.x, p.y - lastP.y) > 16) {
        trail.push({ x: p.x, y: p.y + 4 });
        if (trail.length > TRAIL) trail.shift();
        trailHead++;
        trail.forEach((t, i) => {
          const c = trailEls[(trailHead + i) % TRAIL];
          const k = (i + 1) / trail.length;
          c.setAttribute('cx', f(t.x + ((i * 37) % 11) - 5));
          c.setAttribute('cy', f(t.y + ((i * 53) % 9) - 4));
          c.setAttribute('r', f(3 + k * 8));
          c.setAttribute('opacity', f(k * 0.85));
        });
      }
      // snowflakes and stars to collect
      if (state === 'skate') {
        spawnT -= dt;
        if (spawnT <= 0 && items.length < 5) {
          spawnT = 1.4 + Math.random();
          spawn();
        }
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (state === 'skate' && Math.hypot(it.x - p.x, it.y - p.y) < 85 && lift < 90) {
          const pts = it.kind === 'star' ? 25 : 10;
          score += pts;
          collected++;
          const bar = Math.max(0, Math.floor(beatN / 3));
          const ch = WALTZ_CHORDS[bar % WALTZ_CHORDS.length];
          playNote('xylophone', ch[1 + (collected % 2)] + 12);
          if (it.kind === 'star') sound.sparkle();
          floatText(fxG, it.x, it.y - 100, `+${pts}`, it.kind === 'star' ? '#ffe680' : '#fff', 36);
          const s2 = toScreen(svg, it.x, it.y - 70);
          burst('sparkle', s2.x, s2.y, 10);
          it.g.remove();
          items.splice(i, 1);
        }
      }
      setPill(root, 'i-score', String(score));
    });
  };

  chooser();
}

// =====================================================================================
// 4 & 5. Theme-park booth games and the prize shelf
// =====================================================================================
const PRICES: Record<'rings' | 'balloons', Record<PrizeId, number>> = {
  rings: { parkBalloon: 0, prizeBunny: 4, prizeBear: 7, prizeUnicorn: 10 },
  balloons: { parkBalloon: 0, prizeBunny: 12, prizeBear: 20, prizeUnicorn: 30 },
};

/** Shows the prize shelf: tickets buy one prize (the balloon is always free), then Play again / Done. */
function prizeShelf(sh: Shell, game: 'rings' | 'balloons', tickets: number, onPrize: ((id: string) => void) | undefined, again: () => void): void {
  const prices = PRICES[game];
  const coins = clamp(game === 'rings' ? 5 + tickets : 5 + Math.round(tickets / 2), 5, 20);
  G.bump('boothGame');
  G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight * 0.3 });
  const box = el('div', 'mg-result mg-shelf-wrap');
  box.innerHTML = `<div class="mg-card mg-shelf-card"><h2>Pick a prize!</h2><p class="mg-tix">${ticketIcon}<b>${tickets}</b><span>ticket${tickets === 1 ? '' : 's'}</span></p>
    <div class="mg-shelf">${PRIZES.map((id) => {
      const need = prices[id] - tickets;
      return `<button class="mg-prize${need <= 0 ? ' ok' : ' need'}" data-prize="${id}" ${need > 0 ? 'aria-disabled="true"' : ''}><svg viewBox="-80 -200 160 210">${prizeArt(id)}</svg><b>${PRIZE_NAME[id]}</b><span class="mg-tag">${prices[id] ? `${ticketIcon}${prices[id]}` : 'Free!'}</span>${need > 0 ? `<small>${need} more</small>` : ''}</button>`;
    }).join('')}</div>
    <p class="mg-earned">${icon('coin')}<span>+${coins} coins</span></p></div>`;
  sh.root.appendChild(box);
  requestAnimationFrame(() => box.classList.add('show'));
  box.querySelectorAll<HTMLElement>('[data-prize]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.classList.contains('need')) {
        sound.wrong();
        b.classList.remove('nope');
        void b.offsetWidth;
        b.classList.add('nope');
        return;
      }
      const id = b.dataset.prize as PrizeId;
      sound.success();
      sound.giggle();
      const rc = b.getBoundingClientRect();
      burst('heart', rc.left + rc.width / 2, rc.top + rc.height / 3, 18);
      celebrate();
      onPrize?.(id);
      const card = q(box, '.mg-card');
      card.innerHTML = `<div class="mg-art mg-won"><svg viewBox="-110 -230 220 240">${prizeArt(id)}</svg></div><h2>You won the ${esc(PRIZE_NAME[id])}!</h2><p>${onPrize ? 'It’s waiting for you in the park.' : 'Yay!'}</p><div class="mg-row"><button class="btn primary" data-again>${icon('star')}<span>Play again</span></button><button class="btn" data-x>${icon('check')}<span>Done</span></button></div>`;
      q(card, '[data-again]').addEventListener('click', () => {
        sound.pop();
        again();
      });
    }),
  );
}

/** The booth's back: night carnival sky, posts, canopy and string lights. `wall` draws the back wall. */
function boothBg(wall: string, c1: string, c2: string): string {
  let lights = '';
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = lerp(-200, 1800, t);
    const y = -120 + 4 * t * (1 - t) * 90;
    lights += `<circle class="mg-twinkle" style="animation-delay:${f((i % 4) * 0.4)}s" cx="${f(x)}" cy="${f(y + 10)}" r="11" fill="${['#ffe680', '#ff9ec7', '#8ff0d0', '#c9a6ff'][i % 4]}"/>`;
  }
  return `<defs><linearGradient id="mgb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a9a"/><stop offset="1" stop-color="#ff9ec7"/></linearGradient></defs>
    <rect x="-1200" y="-2000" width="4000" height="3000" fill="url(#mgb-sky)"/>
    ${[[-150, -300], [1720, -380], [300, -600], [1300, -700]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" class="mg-twinkle"/>`).join('')}
    <path d="M-200 -120 Q800 60 1800 -120" stroke="#2a2550" stroke-width="3" fill="none"/>${lights}
    <rect x="-1200" y="760" width="4000" height="1600" fill="#c98a5a"/>
    <rect x="230" y="40" width="1140" height="740" fill="${dark(c1, 0.35)}"/>
    ${wall}
    <rect x="200" y="40" width="44" height="760" rx="12" fill="${c2}" stroke="#fff" stroke-width="5"/><rect x="1356" y="40" width="44" height="760" rx="12" fill="${c2}" stroke="#fff" stroke-width="5"/>
    <g transform="translate(180 20)">${canopy(1240, c1, '#fff')}</g>
    <path d="M800 -6 l26 -40 l26 40Z" fill="${c2}"/><circle cx="826" cy="-52" r="10" fill="#ffd36b"/>`;
}
/** Counter at the front of the booth (in front of everything); top edge at y = 760. */
function boothCounter(c: string, label: string): string {
  let s = `<rect x="-1200" y="760" width="4000" height="40" fill="#e9b88a"/><rect x="-1200" y="796" width="4000" height="1600" fill="${c}"/>`;
  for (let x = -1200; x < 2800; x += 120) s += `<rect x="${x}" y="796" width="60" height="1600" fill="#fff" opacity="0.35"/>`;
  s += `<rect x="560" y="820" width="480" height="64" rx="32" fill="#fff" stroke="${dark(c, 0.2)}" stroke-width="5"/><text x="800" y="866" font-family="Fredoka, sans-serif" font-weight="700" font-size="40" fill="${dark(c, 0.3)}" text-anchor="middle">${label}</text>`;
  return s;
}

interface Bottle { x: number; y: number; s: number; pts: number; golden: boolean; g: SVGGElement; back: SVGGElement; front: SVGGElement; rings: number; }

export function openRingToss(onClose: () => void, onPrize?: (prizeId: string) => void): void {
  const sh = shell('mg-booth mg-rings', onClose);
  const RINGS = 8;

  const play = () => {
    const r = sh.fresh();
    const root = sh.root;
    root.innerHTML = hudHtml(`<div class="pill mg-pill mg-ringsleft"></div>` + pill('b-tix', ticketIcon, '0'));
    q(root, '[data-back]').remove();
    const svg = makeSvg(root, 'b-svg');
    let wall = `<rect x="244" y="150" width="1112" height="630" fill="#fff3d6"/>`;
    for (let x = 244; x < 1356; x += 70) wall += `<rect x="${x}" y="150" width="35" height="630" fill="#ffe6b8"/>`;
    wall += `<g transform="translate(800 250)"><rect x="-230" y="-56" width="460" height="100" rx="50" fill="#ff7eb6" stroke="#fff" stroke-width="7"/><text y="14" font-family="Fredoka, sans-serif" font-weight="700" font-size="54" fill="#fff" text-anchor="middle">RING TOSS</text></g>`;
    // table in perspective
    const table = `<path d="M420 390 L1180 390 L1300 690 L300 690Z" fill="#7fe0c0"/><path d="M420 390 L1180 390 L1190 410 L410 410Z" fill="#a8f0d8"/>
      <path d="M300 690 L1300 690 L1300 760 L300 760Z" fill="#5fd3b5"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${300 + i * 91} 760 q45 34 91 0" fill="#5fd3b5"/>`).join('')}
      ${Array.from({ length: 10 }, (_, i) => `<circle cx="${345 + i * 101}" cy="724" r="10" fill="#fff" opacity="0.7"/>`).join('')}`;
    svg.innerHTML = `${boothBg(wall, '#ff7eb6', '#9b6bff')}${table}<g class="b-bottles"></g><g class="b-lying"></g><g class="b-fly"></g>${boothCounter('#ff9ec7', 'Land a ring!')}<g class="b-hand"></g><g class="b-fx"></g>`;
    fit(svg, root, r, 1040, 900, 0.5, 800);
    const bottlesG = q<SVGGElement>(svg, '.b-bottles');
    const lyingG = q<SVGGElement>(svg, '.b-lying');
    const flyG = q<SVGGElement>(svg, '.b-fly');
    const handG = q<SVGGElement>(svg, '.b-hand');
    const fxG = q<SVGGElement>(svg, '.b-fx');

    // bottles: back row worth the most, a golden one in the middle
    const bottles: Bottle[] = [];
    const rows = [
      { y: 450, s: 0.66, xs: [560, 680, 800, 920, 1040], pts: 3 },
      { y: 545, s: 0.8, xs: [520, 680, 920, 1080], pts: 2 },
      { y: 650, s: 0.95, xs: [600, 800, 1000], pts: 1 },
    ];
    const cols = ['#ff7eb6', '#7cc8ff', '#5fd3b5', '#c99bff', '#ffb347', '#ff5c7a'];
    rows.forEach((row, ri) =>
      row.xs.forEach((x, i) => {
        const golden = ri === 0 && i === 2;
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${x} ${row.y}) scale(${row.s})`);
        g.innerHTML = `<g class="b-back"></g><g class="b-glass">${bottleG(cols[(i + ri * 2) % cols.length], golden)}</g><g class="b-front"></g>`;
        bottlesG.appendChild(g);
        bottles.push({ x, y: row.y, s: row.s, pts: golden ? 5 : row.pts, golden, g, back: q<SVGGElement>(g, '.b-back'), front: q<SVGGElement>(g, '.b-front'), rings: 0 });
      }),
    );

    const HAND = { x: 800, y: 748 };
    let left = RINGS;
    let tickets = 0;
    let ringers = 0;
    let busy = 0;
    let ended = false;
    const ringCol = (n: number) => RING_COLS[n % RING_COLS.length];
    const drawLeft = () => {
      q(root, '.mg-ringsleft').innerHTML = Array.from({ length: RINGS }, (_, i) => `<span class="${i < left ? '' : 'used'}">${ringIcon(ringCol(RINGS - 1 - i))}</span>`).join('');
    };
    drawLeft();
    const idx = () => RINGS - left;
    const drawHand = (x = HAND.x, y = HAND.y, sc = 1.25) => {
      handG.innerHTML = left > 0 && !ended ? `<g transform="translate(${f(x)} ${f(y)}) scale(${sc})"><g class="${drag ? '' : 'mg-bob'}">${ringG(46, 18, ringCol(idx()), 11)}</g></g>${drag ? '' : `<g transform="translate(${HAND.x + 130} ${HAND.y - 10})"><g class="mg-hint">${`<path d="M0 30 L0 -40 M-16 -22 L0 -40 L16 -22" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}</g></g>`}` : '';
    };
    let drag: { id: number; pts: { t: number; x: number; y: number }[] } | null = null;
    drawHand();
    banner(root, r, 'Flick a ring onto a bottle!', '', 1800);

    const aimFrom = (sx: number, sy: number, vx: number, vy: number) => {
      const power = clamp((-vy - 300) / 2600, 0, 1.1);
      const ty = lerp(690, 420, power);
      const tx = sx + vx * 0.26;
      return { tx, ty, power };
    };
    const nearest = (tx: number, ty: number) => {
      let best: Bottle | null = null;
      let bd = Infinity;
      for (const b of bottles) {
        const d = Math.hypot((b.x - tx) / b.s, ((b.y - ty) * 1.4) / b.s);
        if (d < bd) {
          bd = d;
          best = b;
        }
      }
      return { b: best!, d: bd };
    };
    svg.addEventListener('pointerdown', (e) => {
      if (drag || left <= 0 || ended || busy > 1) return;
      const w = toWorld(svg, e.clientX, e.clientY);
      if (w.y < 560) return;
      drag = { id: e.pointerId, pts: [{ t: performance.now(), ...w }] };
      svg.setPointerCapture(e.pointerId);
      sound.pick();
      drawHand(w.x, w.y);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const w = toWorld(svg, e.clientX, e.clientY);
      drag.pts.push({ t: performance.now(), ...w });
      if (drag.pts.length > 12) drag.pts.shift();
      drawHand(w.x, Math.max(560, w.y));
    });
    const release = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const pts = drag.pts;
      drag = null;
      const lastP = pts[pts.length - 1];
      const now = performance.now();
      const recent = pts.filter((p) => now - p.t < 120);
      const first = recent.length > 1 ? recent[0] : pts[0];
      const dt = Math.max(0.016, (lastP.t - first.t) / 1000);
      const vx = (lastP.x - first.x) / dt;
      const vy = (lastP.y - first.y) / dt;
      if (vy > -250 || e.type === 'pointercancel') {
        sound.drop();
        drawHand();
        return;
      }
      throwRing(lastP.x, Math.max(560, lastP.y), vx, vy);
    };
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    const tweens: { t: number; dur: number; fn: (k: number) => void; done?: () => void }[] = [];
    const tween = (dur: number, fn: (k: number) => void, done?: () => void) => tweens.push({ t: 0, dur, fn, done });

    const throwRing = (sx: number, sy: number, vx: number, vy: number) => {
      const col = ringCol(idx());
      left--;
      busy++;
      drawLeft();
      drawHand();
      sound.whoosh();
      const { tx, ty, power } = aimFrom(sx, sy, vx, vy);
      const { b, d } = nearest(tx, ty);
      // forgiving: a near throw snaps onto the bottle
      const ringer = d < 95;
      const clink = !ringer && d < 150;
      let ex = tx;
      let ey = ty;
      let es = lerp(1.0, 0.6, clamp((700 - ty) / 300, 0, 1));
      if (ringer || clink) {
        ex = b.x;
        ey = b.y - 152 * b.s;
        es = b.s;
      } else if (ty < 400) ey = 400;
      const g = document.createElementNS(NS, 'g');
      flyG.appendChild(g);
      const peak = 180 + power * 220;
      const dur = 0.55 + power * 0.25;
      let spin = 0;
      tween(dur, (k) => {
        const x = lerp(sx, ex, k);
        const y = lerp(sy, ey, k) - Math.sin(k * Math.PI) * peak;
        const s = lerp(1.25, es, k);
        spin += 0.5;
        const ry = 46 * (0.25 + 0.75 * Math.abs(Math.cos(spin * 0.5 + k * 2)));
        g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
        g.innerHTML = ringG(46, k > 0.85 ? lerp(ry, 16, (k - 0.85) / 0.15) : ry, col, 11);
      }, () => {
        g.remove();
        if (ringer) {
          b.rings++;
          ringers++;
          tickets += b.pts;
          setPill(root, 'b-tix', String(tickets));
          const lift = (b.rings - 1) * 14;
          const back = document.createElementNS(NS, 'g');
          const front = document.createElementNS(NS, 'g');
          back.innerHTML = ringHalf(40, 15, col, 'back', 10);
          front.innerHTML = ringHalf(40, 15, col, 'front', 10);
          b.back.appendChild(back);
          b.front.appendChild(front);
          // drop down the neck and bounce
          tween(0.5, (k) => {
            const yy = lerp(-150, -112 - lift, Math.min(1, k * 1.6)) - (k > 0.62 ? Math.abs(Math.sin((k - 0.62) * Math.PI * 2.6)) * 16 * (1 - k) : 0);
            back.setAttribute('transform', `translate(0 ${f(yy)})`);
            front.setAttribute('transform', `translate(0 ${f(yy)})`);
          });
          playNote('xylophone', 84);
          r.later(() => playNote('xylophone', 88), 140);
          r.later(() => playNote('xylophone', 91), 300);
          const glass = q<SVGGElement>(b.g, '.b-glass');
          glass.classList.remove('mg-wiggle');
          void glass.getBoundingClientRect();
          glass.classList.add('mg-wiggle');
          const sp = toScreen(svg, b.x, b.y - 120 * b.s);
          burst(b.golden ? 'sparkle' : 'confetti', sp.x, sp.y, b.golden ? 30 : 24);
          if (b.golden) sound.sparkle();
          banner(root, r, b.golden ? `Golden ringer! +${b.pts}` : `Ringer! +${b.pts}`, 'fire', 1000);
          floatText(fxG, b.x, b.y - 190 * b.s, `+${b.pts}`, '#ffe680', 44);
        } else {
          // bounce off a bottle (clink!) or land on the table, lying flat
          let lx = ex;
          let ly = ey;
          let ls = es;
          if (clink) {
            playNote('xylophone', 89);
            sound.boing();
            const side = tx < b.x ? -1 : 1;
            lx = b.x + side * 70 * b.s;
            ly = b.y + 14;
            ls = b.s;
            banner(root, r, pick(['So close!', 'Clink!', 'Almost!']), '', 800);
          } else {
            sound.drop();
            if (lx < 330 || lx > 1270) {
              banner(root, r, 'Whoosh! Try again!', '', 800);
              lx = clamp(lx, 360, 1240);
            } else banner(root, r, pick(['Nice throw!', 'Try again!', 'Good try!']), '', 800);
            ly = clamp(ly, 405, 685);
          }
          const lying = document.createElementNS(NS, 'g');
          lyingG.appendChild(lying);
          const y0 = clink ? b.y - 120 * b.s : ey;
          tween(0.35, (k) => {
            const yy = lerp(y0, ly, k) - Math.sin(k * Math.PI) * 40;
            lying.setAttribute('transform', `translate(${f(lerp(ex, lx, k))} ${f(yy)}) scale(${f(ls)})`);
            lying.innerHTML = ringG(46, 15, col, 11);
          });
        }
        busy--;
        if (left <= 0 && busy <= 0) {
          ended = true;
          r.later(() => {
            banner(root, r, ringers ? `${ringers} ringer${ringers === 1 ? '' : 's'}!` : 'Great tossing!', 'fire', 1400);
            sound.applause();
          }, 600);
          r.later(() => prizeShelf(sh, 'rings', Math.max(1, tickets), onPrize, play), 1800);
        }
      });
    };

    r.loop((dt) => {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const t = tweens[i];
        t.t += dt / t.dur;
        t.fn(Math.min(1, t.t));
        if (t.t >= 1) {
          tweens.splice(i, 1);
          t.done?.();
        }
      }
    });
  };

  play();
}

export function openBalloonPop(onClose: () => void, onPrize?: (prizeId: string) => void): void {
  const sh = shell('mg-booth mg-balloons', onClose);
  const TIME = 45;

  const play = () => {
    const r = sh.fresh();
    const root = sh.root;
    root.innerHTML = hudHtml(pill('b-time', clockIcon, String(TIME)) + pill('b-tix', ticketIcon, '0'));
    q(root, '[data-back]').remove();
    const svg = makeSvg(root, 'b-svg');
    let wall = `<rect x="244" y="150" width="1112" height="630" fill="#e9f6ff"/>`;
    for (let y = 150; y < 780; y += 60) for (let x = 244 + ((y / 60) % 2) * 30; x < 1356; x += 60) wall += `<circle cx="${x}" cy="${y}" r="5" fill="#c8e6ff"/>`;
    wall += `<path d="M244 150 L1356 150 L1356 780 L244 780Z" fill="none" stroke="#ffd36b" stroke-width="10" stroke-dasharray="4 26" stroke-linecap="round"/>`;
    svg.innerHTML = `${boothBg(wall, '#7cc8ff', '#ff7eb6')}<g class="p-darts"></g><g class="p-balloons"></g><g class="p-pops"></g>${boothCounter('#7cc8ff', 'Pop the balloons!')}<g class="p-fly"></g><g class="p-fx"></g>`;
    fit(svg, root, r, 1040, 900, 0.5, 800);
    const dartsG = q<SVGGElement>(svg, '.p-darts');
    const balG = q<SVGGElement>(svg, '.p-balloons');
    const popsG = q<SVGGElement>(svg, '.p-pops');
    const flyG = q<SVGGElement>(svg, '.p-fly');
    const fxG = q<SVGGElement>(svg, '.p-fx');
    // a sign on the wall that stays behind the balloons
    dartsG.insertAdjacentHTML('beforebegin', `<g transform="translate(800 230)" opacity="0.9"><rect x="-250" y="-50" width="500" height="92" rx="46" fill="#ff7eb6" stroke="#fff" stroke-width="7"/><text y="14" font-family="Fredoka, sans-serif" font-weight="700" font-size="50" fill="#fff" text-anchor="middle">BALLOON POP</text></g>`);

    interface Bal { x: number; y: number; vy: number; ph: number; col: string; golden: boolean; g: SVGGElement; }
    interface Dart { x: number; y: number; vx: number; vy: number; tx?: number; ty?: number; life: number; g: SVGGElement; }
    const bals: Bal[] = [];
    const darts: Dart[] = [];
    let tickets = 0;
    let pops = 0;
    let combo = 0;
    let comboT = 0;
    let timeLeft = TIME;
    let spawnT = 0.2;
    let state: 'play' | 'end' = 'play';
    let time = 0;

    const spawn = () => {
      const golden = Math.random() < 0.1;
      const col = pick(BALLOON_COLS);
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = `<g class="mg-sway2" style="animation-delay:${f(-Math.random() * 2)}s">${balloonG(col, golden)}</g>`;
      balG.appendChild(g);
      const speed = (golden ? 150 : 75 + Math.random() * 45) * (1 + (TIME - timeLeft) / 90);
      bals.push({ x: 320 + Math.random() * 960, y: 860, vy: -speed, ph: Math.random() * 6, col, golden, g });
    };
    const pop = (b: Bal) => {
      bals.splice(bals.indexOf(b), 1);
      b.g.remove();
      pops++;
      combo = comboT > 0 ? combo + 1 : 1;
      comboT = 0.9;
      const add = b.golden ? 5 : 1;
      tickets += add;
      setPill(root, 'b-tix', String(tickets));
      const p = document.createElementNS(NS, 'g');
      p.setAttribute('transform', `translate(${f(b.x)} ${f(b.y)})`);
      p.innerHTML = `<g class="mg-popfx">${Array.from({ length: 8 }, (_, i) => `<path d="M0 -30 L6 -60 L-6 -60Z" fill="${b.golden ? '#ffd24a' : b.col}" transform="rotate(${i * 45})"/>`).join('')}<path d="${starD(0, 0, 34)}" fill="#fff"/></g>`;
      popsG.appendChild(p);
      window.setTimeout(() => p.remove(), 500);
      sound.pop();
      playNote('xylophone', [72, 74, 76, 79, 81, 84, 86, 88][Math.min(7, combo - 1)]);
      const sp = toScreen(svg, b.x, b.y);
      burst('confetti', sp.x, sp.y, b.golden ? 40 : 14);
      if (b.golden) {
        sound.sparkle();
        burst('sparkle', sp.x, sp.y, 20);
        banner(root, r, 'Golden balloon! +5', 'fire', 900);
      } else if (combo >= 3 && combo % 3 === 0) banner(root, r, `${combo} in a row!`, 'fire', 700);
      floatText(fxG, b.x, b.y - 70, `+${add}`, b.golden ? '#ffe680' : '#fff', b.golden ? 50 : 38);
    };
    const hitAt = (x: number, y: number, rad: number) => {
      let best: Bal | null = null;
      let bd = rad;
      for (const b of bals) {
        const d = Math.hypot(b.x - x, (b.y - y) * 0.9);
        if (d < bd) {
          bd = d;
          best = b;
        }
      }
      return best;
    };
    const stick = (d: Dart) => {
      darts.splice(darts.indexOf(d), 1);
      if (d.y > 160 && d.y < 760 && d.x > 250 && d.x < 1350) {
        dartsG.appendChild(d.g);
        d.g.classList.add('mg-stuck');
        sound.thud();
        window.setTimeout(() => d.g.remove(), 1600);
      } else d.g.remove();
    };
    const throwDart = (x0: number, y0: number, vx: number, vy: number, tx?: number, ty?: number) => {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = `<g transform="rotate(${f((Math.atan2(vy, vx) * 180) / Math.PI + 90)})">${dartG()}</g>`;
      flyG.appendChild(g);
      darts.push({ x: x0, y: y0, vx, vy, tx, ty, life: 0, g });
      sound.whoosh();
    };

    const downs = new Map<number, { x: number; y: number; t: number }>();
    svg.addEventListener('pointerdown', (e) => {
      if (state !== 'play') return;
      downs.set(e.pointerId, { ...toWorld(svg, e.clientX, e.clientY), t: performance.now() });
    });
    const upDart = (e: PointerEvent) => {
      const d0 = downs.get(e.pointerId);
      downs.delete(e.pointerId);
      if (!d0 || state !== 'play' || e.type === 'pointercancel') return;
      const w = toWorld(svg, e.clientX, e.clientY);
      const dx = w.x - d0.x;
      const dy = w.y - d0.y;
      if (Math.hypot(dx, dy) < 40 || dy > -30) {
        // tap: a dart zips up from the counter to where you tapped
        const sx = clamp(w.x, 300, 1300) * 0.5 + 800 * 0.5;
        const sy = 900;
        const len = Math.hypot(w.x - sx, w.y - sy) || 1;
        const sp = 3600;
        throwDart(sx, sy, ((w.x - sx) / len) * sp, ((w.y - sy) / len) * sp, w.x, w.y);
      } else {
        // flick: the dart flies along the swipe
        const len = Math.hypot(dx, dy);
        throwDart(d0.x, d0.y, (dx / len) * 2800, (dy / len) * 2800);
      }
    };
    svg.addEventListener('pointerup', upDart);
    svg.addEventListener('pointercancel', upDart);

    banner(root, r, 'Tap the balloons!', '', 1500);

    const end = () => {
      state = 'end';
      banner(root, r, "Time's up!", 'fire', 1400);
      sound.ding();
      for (const b of bals) b.vy = -420;
      r.later(() => {
        sound.applause();
        banner(root, r, `${pops} pops!`, 'fire', 1200);
      }, 900);
      r.later(() => prizeShelf(sh, 'balloons', Math.max(1, tickets), onPrize, play), 2000);
    };

    r.loop((dt) => {
      time += dt;
      if (state === 'play') {
        timeLeft -= dt;
        setPill(root, 'b-time', String(Math.max(0, Math.ceil(timeLeft))));
        if (timeLeft <= 0) end();
        spawnT -= dt;
        if (spawnT <= 0 && bals.length < 14) {
          spawnT = 0.5 + Math.random() * 0.35;
          spawn();
          if (Math.random() < 0.25) spawn();
        }
      }
      comboT -= dt;
      for (let i = bals.length - 1; i >= 0; i--) {
        const b = bals[i];
        b.y += b.vy * dt;
        const x = b.x + Math.sin(time * 1.4 + b.ph) * 14;
        b.g.setAttribute('transform', `translate(${f(x)} ${f(b.y)})`);
        if (b.y < -120) {
          b.g.remove();
          bals.splice(i, 1);
        }
      }
      for (let i = darts.length - 1; i >= 0; i--) {
        const d = darts[i];
        const steps = 3;
        let done = false;
        for (let s = 0; s < steps && !done; s++) {
          d.x += (d.vx * dt) / steps;
          d.y += (d.vy * dt) / steps;
          d.life += dt / steps;
          const reached = d.ty !== undefined && d.y <= d.ty;
          const b = hitAt(d.x, d.y, reached ? 80 : 52);
          if (b) {
            pop(b);
            d.g.remove();
            darts.splice(darts.indexOf(d), 1);
            done = true;
          } else if (reached || d.y < 120 || d.life > 0.6) {
            if (reached) {
              d.x = d.tx!;
              d.y = d.ty!;
            }
            stick(d);
            done = true;
          }
        }
        if (!done) d.g.setAttribute('transform', `translate(${f(d.x)} ${f(d.y)})`);
        else if (d.g.parentNode === dartsG) d.g.setAttribute('transform', `translate(${f(d.x)} ${f(d.y)})`);
      }
    });
  };

  play();
}
