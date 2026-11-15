// Seasonal Fun: one make-and-play activity for each season. Winter builds a snowman, fall carves a
// happy pumpkin, spring hunts for eggs (and decorates one) and summer builds a sandcastle.
// Everything is drawn in one SVG per activity whose viewBox is the part that always shows; the
// scenery bleeds past it so wide and tall screens never see an edge.
import './seasonfun.css';
import { dark, light } from '../art/color';
import { cloud, ground, landscape, picketFence } from '../art/scenes';
import { bowG, flowerG, heartD, sparkleD, starD } from '../art/wear';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G } from '../game';
import type { Season } from '../types';
import { frame } from './activities';
import { icon } from './icons';

// ---------------- little drawing helpers ----------------
const f = (n: number) => n.toFixed(1);
const C = (x: number, y: number, r: number, fill: string, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const R = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const L = (d: string, color: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const at = (x: number, y: number, inner: string, extra = '') => `<g transform="translate(${f(x)} ${f(y)})${extra}">${inner}</g>`;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let uidN = 0;
const uid = (p: string) => `sf${p}${++uidN}`;
const thumb = (art: string, vb: string) => `<svg viewBox="${vb}">${art}</svg>`;
type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** A smooth path through finger points. */
function smoothD(pts: Pt[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${f(pts[0].x)} ${f(pts[0].y)} l0.1 0`;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${f(pts[i].x)} ${f(pts[i].y)} ${f(mx)} ${f(my)}`;
  }
  const z = pts[pts.length - 1];
  return d + ` L${f(z.x)} ${f(z.y)}`;
}

/** An egg shape: narrower at the top. */
const eggD = (x: number, y: number, rx: number, ry: number) =>
  `M${f(x)} ${f(y - ry)} C${f(x + rx * 0.78)} ${f(y - ry)} ${f(x + rx)} ${f(y - ry * 0.08)} ${f(x + rx)} ${f(y + ry * 0.28)} C${f(x + rx)} ${f(y + ry * 0.8)} ${f(x + rx * 0.56)} ${f(y + ry)} ${f(x)} ${f(y + ry)} C${f(x - rx * 0.56)} ${f(y + ry)} ${f(x - rx)} ${f(y + ry * 0.8)} ${f(x - rx)} ${f(y + ry * 0.28)} C${f(x - rx)} ${f(y - ry * 0.08)} ${f(x - rx * 0.78)} ${f(y - ry)} ${f(x)} ${f(y - ry)}Z`;
/** Half the width of the egg at height y (close enough for placing stripes and taps). */
const eggHalf = (cx: number, cy: number, rx: number, ry: number, y: number) => {
  const t = (y - (cy + ry * 0.2)) / (y < cy + ry * 0.2 ? ry * 1.2 : ry * 0.8);
  return Math.abs(t) >= 1 ? 0 : rx * Math.sqrt(1 - t * t);
};

const RESET_SVG = `<svg viewBox="0 0 64 64">${C(32, 32, 26, '#fff')}${L('M44 22 A15 15 0 1 0 47 34', '#9b6bff', 6)}${P('M38 14 L50 20 L42 30Z', '#9b6bff')}</svg>`;
const UNDO_SVG = `<svg viewBox="0 0 64 64">${C(32, 32, 26, '#fff3f8')}${L('M22 26 H38 A10 10 0 0 1 38 46 H28', '#ff7eb6', 6)}${P('M14 26 L26 16 L26 36Z', '#ff7eb6')}</svg>`;

// ---------------- the shared frame: stage, tip, tray and header buttons ----------------
interface Kit {
  root: HTMLDivElement;
  stage: HTMLDivElement;
  svg: SVGSVGElement;
  tray: HTMLDivElement;
  reset: HTMLButtonElement;
  done: HTMLButtonElement;
  tip(text: string, ic?: string): void;
  pt(e: { clientX: number; clientY: number }): Pt;
  scr(p: Pt): Pt;
  view(): { x0: number; y0: number; x1: number; y1: number };
  later(fn: () => void, ms: number): void;
  tween(ms: number, step: (t: number) => void, done?: () => void): void;
  on(t: EventTarget, type: string, fn: (e: PointerEvent) => void): void;
  stop(): void;
  alive(): boolean;
  overTray(e: { clientY: number }): boolean;
  layer(name: string): SVGGElement;
  close(): void;
  /** True when the stage is taller than it is wide-ish (iPad portrait): some scenes lay out differently. */
  tall: boolean;
}
type Box = [number, number, number, number];

/** Opens the frame and builds the stage. `focus` is the part of the scene (x0 y0 x1 y1) that must always
 * show; the view grows sideways on wide screens and upwards on tall ones, keeping the ground at the bottom. */
function makeKit(cls: string, title: string, focus: (tall: boolean) => Box, onClose: () => void): Kit {
  const timers = new Set<number>();
  const rafs = new Set<number>();
  const offs: (() => void)[] = [];
  let alive = true;
  const stop = () => {
    timers.forEach((t) => clearTimeout(t));
    rafs.forEach((r) => cancelAnimationFrame(r));
    timers.clear();
    rafs.clear();
  };
  const fr = frame(`sf-act ${cls}`, title, () => {
    alive = false;
    stop();
    offs.forEach((o) => o());
    ro.disconnect();
    document.querySelectorAll('.sf-fly').forEach((n) => n.remove());
    onClose();
  });
  fr.body.innerHTML = `<div class="sf-stage"><svg class="sf-svg" preserveAspectRatio="xMidYMax meet"></svg><div class="sf-tip"></div></div><div class="sf-tray"></div>`;
  const head = fr.root.querySelector('.act-head')!;
  const coins = head.querySelector('.coins-mini');
  const reset = document.createElement('button');
  reset.className = 'btn ghost sf-hbtn';
  reset.innerHTML = `${RESET_SVG}<span>Start over</span>`;
  const done = document.createElement('button');
  done.className = 'btn primary sf-hbtn';
  done.innerHTML = `${icon('check')}<span>Done!</span>`;
  head.insertBefore(reset, coins);
  head.insertBefore(done, coins);
  const svg = fr.body.querySelector('svg') as SVGSVGElement;
  const stage = fr.body.querySelector('.sf-stage') as HTMLDivElement;
  const tray = fr.body.querySelector('.sf-tray') as HTMLDivElement;
  const tipEl = fr.body.querySelector('.sf-tip') as HTMLDivElement;
  let tipText = '';
  let tipTimer = 0;
  const sr = stage.getBoundingClientRect();
  const tall = sr.width / Math.max(1, sr.height) < 1.2;
  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const [x0, y0, x1, y1] = focus(tall);
    const a = r.width / r.height;
    const h = Math.max(y1 - y0, (x1 - x0) / a);
    const w = h * a;
    svg.setAttribute('viewBox', `${f((x0 + x1) / 2 - w / 2)} ${f(y1 - h)} ${f(w)} ${f(h)}`);
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(stage);
  const kit: Kit = {
    tall,
    root: fr.root,
    stage,
    svg,
    tray,
    reset,
    done,
    tip(text, ic = '') {
      if (text === tipText) return;
      tipText = text;
      tipEl.innerHTML = text ? `${ic}<span>${text}</span>` : '';
      tipEl.classList.remove('pop', 'fade');
      void tipEl.offsetWidth;
      if (text) tipEl.classList.add('pop');
      // tips step out of the way after a while so they never hide the fun
      clearTimeout(tipTimer);
      tipTimer = window.setTimeout(() => tipEl.classList.add('fade'), 6000);
      timers.add(tipTimer);
    },
    pt(e) {
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    },
    scr(p) {
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const q = new DOMPoint(p.x, p.y).matrixTransform(m);
      return { x: q.x, y: q.y };
    },
    view() {
      const r = svg.getBoundingClientRect();
      const a = kit.pt({ clientX: r.left, clientY: r.top });
      const b = kit.pt({ clientX: r.right, clientY: r.bottom });
      return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    },
    later(fn, ms) {
      const t = window.setTimeout(() => {
        timers.delete(t);
        if (alive) fn();
      }, ms);
      timers.add(t);
    },
    tween(ms, step, fin) {
      const t0 = performance.now();
      let id = 0;
      const run = (now: number) => {
        rafs.delete(id);
        if (!alive) return;
        const t = Math.min(1, (now - t0) / ms);
        step(t);
        if (t < 1) {
          id = requestAnimationFrame(run);
          rafs.add(id);
        } else fin?.();
      };
      id = requestAnimationFrame(run);
      rafs.add(id);
    },
    on(t, type, fn) {
      t.addEventListener(type, fn as EventListener);
      offs.push(() => t.removeEventListener(type, fn as EventListener));
    },
    stop,
    alive: () => alive,
    overTray: (e) => e.clientY >= tray.getBoundingClientRect().top,
    layer: (name) => svg.querySelector(`.sf-l-${name}`) as SVGGElement,
    close: fr.close,
  };
  return kit;
}

/** Follows fingers that are dragging something around the stage (several at once is fine). */
function tracker(kit: Kit, h: { move(id: number, p: Pt, e: PointerEvent): void; end(id: number, p: Pt, e: PointerEvent, toTray: boolean): void }) {
  const drags = new Map<number, { id: number; dx: number; dy: number; tray: boolean }>();
  kit.on(window, 'pointermove', (e) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const p = kit.pt(e);
    h.move(d.id, { x: p.x + d.dx, y: p.y + d.dy }, e);
    if (d.tray) kit.tray.classList.toggle('drop', kit.overTray(e));
  });
  const up = (e: PointerEvent) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    kit.tray.classList.remove('drop');
    const p = kit.pt(e);
    h.end(d.id, { x: p.x + d.dx, y: p.y + d.dy }, e, d.tray && e.type === 'pointerup' && kit.overTray(e));
  };
  kit.on(window, 'pointerup', up);
  kit.on(window, 'pointercancel', up);
  return {
    begin(e: PointerEvent, id: number, from: Pt, trayDrop = true) {
      const p = kit.pt(e);
      drags.set(e.pointerId, { id, dx: from.x - p.x, dy: from.y - p.y, tray: trayDrop });
    },
    busy: (id: number) => [...drags.values()].some((d) => d.id === id),
    clear: () => drags.clear(),
  };
}

/** Tray buttons: a tap picks or places a thing, pulling it up out of the tray drags it into the scene. */
function trayGestures(kit: Kit, h: { tap(id: string): void; drag?(id: string, e: PointerEvent): void; tab?(id: string): void }) {
  let pend: { id: string; pid: number; x: number; y: number } | null = null;
  kit.on(kit.tray, 'pointerdown', (e) => {
    const b = (e.target as Element).closest('[data-id]') as HTMLElement | null;
    if (b) pend = { id: b.dataset.id!, pid: e.pointerId, x: e.clientX, y: e.clientY };
  });
  kit.on(window, 'pointermove', (e) => {
    if (!pend || pend.pid !== e.pointerId) return;
    const dx = e.clientX - pend.x;
    const dy = e.clientY - pend.y;
    if (h.drag && dy < -14 && Math.abs(dy) > Math.abs(dx) * 0.8) {
      const id = pend.id;
      pend = null;
      h.drag(id, e);
    } else if (Math.abs(dx) > 16 || Math.abs(dy) > 30) pend = null;
  });
  kit.on(window, 'pointerup', (e) => {
    if (pend && pend.pid === e.pointerId) {
      const id = pend.id;
      pend = null;
      h.tap(id);
    }
  });
  kit.on(window, 'pointercancel', () => (pend = null));
  kit.on(kit.tray, 'click', (e) => {
    const t = (e.target as Element).closest('[data-tab]') as HTMLElement | null;
    if (t && h.tab) {
      sound.tap();
      h.tab(t.dataset.tab!);
    }
  });
}

const tabsHTML = (tabs: { id: string; label: string; art: string }[], cur: string) =>
  `<div class="sf-tabs">${tabs.map((t) => `<button class="sf-tab${t.id === cur ? ' on' : ''}" data-tab="${t.id}">${t.art}<span>${t.label}</span></button>`).join('')}</div>`;
const itemBtn = (id: string, art: string, on = false, cls = '') => `<button class="sf-item ${cls}${on ? ' on' : ''}" data-id="${id}">${art}</button>`;
const colorBtn = (id: string, c: string, on = false) => `<button class="sf-item color${on ? ' on' : ''}" data-id="${id}" style="background:${c}"></button>`;
const undoBtn = () => `<span class="sf-sep"></span><button class="sf-item wide" data-id="undo">${UNDO_SVG}<span>Undo</span></button>`;

/** Bumps the stats, pays the coins, throws confetti and shows the "you made it" card in the tray. */
function win(kit: Kit, o: { stat: string; coins: number; title: string; text: string; again: string; onAgain: () => void; fun?: boolean }): void {
  G.bump(o.stat);
  if (o.fun !== false) G.bump('seasonFun');
  const r = kit.stage.getBoundingClientRect();
  if (o.coins) G.earn(o.coins, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  celebrate();
  sound.success();
  kit.done.disabled = true;
  card(kit, o.title, o.text, o.coins, [
    { label: o.again, art: RESET_SVG, on: o.onAgain },
    { label: 'All done', art: icon('check'), primary: true, on: () => kit.close() },
  ]);
}

function card(kit: Kit, title: string, text: string, coins: number, btns: { label: string; art: string; primary?: boolean; on: () => void }[]): void {
  kit.tray.innerHTML = `<div class="sf-card"><div class="sf-card-t"><h2>${title}</h2><p>${text}</p></div>${coins ? `<p class="earned">${icon('coin')} +${coins}</p>` : ''}<div class="row">${btns
    .map((b, i) => `<button class="btn${b.primary ? ' primary' : ''}" data-c="${i}">${b.art}<span>${b.label}</span></button>`)
    .join('')}</div></div>`;
  kit.tray.querySelectorAll<HTMLElement>('[data-c]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.tap();
      btns[Number(b.dataset.c)].on();
    }),
  );
}

/** Sparkles at a few points of the scene. */
function sparkleAt(kit: Kit, pts: Pt[], kind: 'sparkle' | 'heart' | 'confetti' | 'bubble' = 'sparkle', n = 14): void {
  for (const p of pts) {
    const s = kit.scr(p);
    burst(kind, s.x, s.y, n);
  }
}

/** A drifting layer of snow, leaves or petals drawn in the SVG itself. */
function fallingBits(kind: 'snow' | 'leaf' | 'petal', n: number, x0: number, x1: number, y0: number, y1: number): string {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i * 0.618 * (x1 - x0)) % (x1 - x0));
    const dur = (kind === 'snow' ? 7 : 10) + (i % 5) * 1.7;
    const r = kind === 'snow' ? 3 + (i % 4) * 1.6 : 9 + (i % 3) * 2;
    const sway = 20 + (i % 3) * 16;
    const art =
      kind === 'snow'
        ? C(0, 0, r, '#fff', 'opacity="0.92"')
        : kind === 'leaf'
          ? P(`M0 ${-r} Q${r} 0 0 ${r} Q${-r} 0 0 ${-r}Z`, ['#ff8a3d', '#ffc23d', '#e8573d', '#ff9a6b'][i % 4])
          : E(0, 0, r * 0.8, r * 0.5, ['#ffc2dc', '#ffd9e8', '#ffffff'][i % 3]);
    g += `<g><animateTransform attributeName="transform" type="translate" values="${f(x)} ${y0};${f(x + sway)} ${f((y0 + y1) / 2)};${f(x - sway * 0.4)} ${y1}" dur="${f(dur)}s" begin="-${f((i * 1.37) % dur)}s" repeatCount="indefinite"/>${
      kind === 'snow' ? art : `<g>${art}<animateTransform attributeName="transform" type="rotate" values="0;360" dur="${4 + (i % 3)}s" repeatCount="indefinite"/></g>`
    }</g>`;
  }
  return `<g pointer-events="none">${g}</g>`;
}

// ================================================================================================
// WINTER: build a snowman
// ================================================================================================
type SKind = 'nose' | 'eye' | 'mouth' | 'blush' | 'button' | 'hat' | 'scarf' | 'arm' | 'broom' | 'bird';
interface SDef { id: string; kind: SKind; tab: string; vb: string; art: (ids: string) => string; z: number; hatH?: number }

const coal = (x: number, y: number, r: number) => E(x, y, r, r * 0.9, '#3a3546') + E(x - r * 0.3, y - r * 0.35, r * 0.32, r * 0.26, '#fff', 'opacity="0.55"');
const snowScarf = (fill: string, edge: string) =>
  P('M-66 -12 Q0 16 66 -12 L68 12 Q0 44 -68 12Z', fill, `stroke="${edge}" stroke-width="3"`) +
  P('M22 18 L12 100 L42 102 L44 22Z', fill, `stroke="${edge}" stroke-width="3"`) +
  P('M36 16 L54 90 L78 82 L50 12Z', fill, `stroke="${edge}" stroke-width="3"`) +
  E(36, 16, 17, 14, fill, `stroke="${edge}" stroke-width="3"`) +
  L('M16 100 l-2 10 M24 101 l-1 10 M32 101 l0 10 M40 102 l1 10 M58 89 l3 9 M66 86 l3 9 M74 83 l3 9', edge, 3);
const mittenArm = (c: string) =>
  L('M0 0 Q36 -12 74 -40', '#7a4a2a', 9) + at(86, -50, P('M-15 12 L-15 -8 Q-15 -26 0 -26 Q15 -26 15 -8 L15 12Z', c) + E(-17, -2, 7, 10, c) + R(-17, 6, 34, 11, 5.5, '#fff') + C(2, -12, 3, '#fff', 'opacity="0.6"'), ' rotate(52)');
const birdArt = (c: string, belly: string) =>
  `<g>${P('M-16 -26 L-38 -36 L-32 -14Z', dark(c, 0.15))}${E(0, -22, 23, 20, c)}${E(5, -15, 14, 11, belly)}${P('M-14 -26 Q-2 -14 -18 -10 Q-24 -18 -14 -26Z', dark(c, 0.12))}${C(9, -29, 3.4, '#2d2a3a')}${C(10, -30, 1.1, '#fff')}${E(14, -21, 4, 2.6, '#ff9ec7', 'opacity="0.7"')}${P('M20 -27 L31 -23 L20 -19Z', '#ffab5e')}${L('M-4 -3 l-2 6 M5 -3 l2 6', '#ffab5e', 3)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0;0 0" dur="1.6s" repeatCount="indefinite"/></g>`;

const SNOW_DEFS: SDef[] = [
  { id: 'carrot', kind: 'nose', tab: 'face', z: 2, vb: '-12 -26 80 52', art: () => P('M-6 -11 Q24 -6 60 4 Q26 12 -6 11 Q-12 0 -6 -11Z', '#ff8a3d') + P('M-6 -11 Q24 -6 60 4 L-6 0Z', '#ffab5e') + L('M14 -6 l4 6 M30 -2 l3 5 M10 5 l5 -3', '#e06a20', 2.5) + L('M-6 -6 l-8 -6 M-6 0 l-10 0', '#5fbf6a', 4) },
  { id: 'coal-eye', kind: 'eye', tab: 'face', z: 2, vb: '-18 -18 36 36', art: () => coal(0, 0, 11) },
  { id: 'lash-eye', kind: 'eye', tab: 'face', z: 2, vb: '-20 -24 40 42', art: () => E(0, 0, 10, 13, '#3a3546') + C(-3, -4, 3.5, '#fff', 'opacity="0.9"') + C(3, 4, 1.6, '#fff', 'opacity="0.7"') + L('M6 -10 l6 -6 M9 -6 l7 -3 M2 -12 l2 -7', '#3a3546', 2.6) },
  { id: 'star-eye', kind: 'eye', tab: 'face', z: 2, vb: '-18 -18 36 36', art: () => P(starD(0, 0, 13, 0.5), '#3a3546') + C(-2, -3, 2.4, '#fff', 'opacity="0.7"') },
  { id: 'smile', kind: 'mouth', tab: 'face', z: 2, vb: '-40 -14 80 34', art: () => [-2, -1, 0, 1, 2].map((i) => coal(i * 14, 8 - i * i * 2.6, 5.4)).join('') },
  { id: 'grin', kind: 'mouth', tab: 'face', z: 2, vb: '-52 -20 104 44', art: () => [-3, -2, -1, 0, 1, 2, 3].map((i) => coal(i * 13, 10 - i * i * 1.9, 5)).join('') },
  { id: 'blush', kind: 'blush', tab: 'face', z: 2, vb: '-20 -14 40 28', art: () => E(0, 0, 13, 8, '#ff9ec7', 'opacity="0.8"') + E(-3, -2, 4, 2.4, '#fff', 'opacity="0.5"') },
  // hats sit with (0,0) at the very top of the head
  { id: 'tophat', kind: 'hat', tab: 'hats', z: 3, hatH: 100, vb: '-80 -110 160 130', art: () => P('M-46 4 L-42 -96 Q0 -102 42 -96 L46 4Z', '#3b3550') + E(0, -96, 42, 8, '#4f4868') + P('M-45 -16 L45 -16 L46 2 L-46 2Z', '#ff7eb6') + E(0, 4, 74, 13, '#3b3550') + R(-34, -86, 10, 64, 5, '#fff', 'opacity="0.12"') + flowerG(28, -8, 12, '#fff', '#ffd36b') },
  { id: 'beanie', kind: 'hat', tab: 'hats', z: 3, hatH: 76, vb: '-72 -90 144 144', art: () => P('M-58 30 Q-62 -54 0 -56 Q62 -54 58 30Z', '#ff9ec7') + P('M-61 2 Q0 -10 61 2 L60 14 Q0 2 -60 14Z', '#fff', 'opacity="0.85"') + P('M-60 -22 Q0 -34 58 -22 L56 -12 Q0 -24 -58 -12Z', '#c99bff', 'opacity="0.9"') + P('M-64 26 Q0 14 64 26 L62 48 Q0 36 -62 48Z', '#ff7eb6') + [-48, -32, -16, 0, 16, 32, 48].map((x) => L(`M${x} ${24 - Math.abs(x) * 0.05} l0 18`, '#e0457b', 2.5, 'opacity="0.5"')).join('') + C(0, -62, 20, '#fff') + C(-9, -70, 9, '#fff') + C(10, -68, 9, '#fff') + C(-5, -66, 5, '#ffe3ef') },
  { id: 'earmuffs', kind: 'hat', tab: 'hats', z: 3, hatH: 30, vb: '-90 -40 180 110', art: () => L('M-60 40 Q-64 -26 0 -26 Q64 -26 60 40', '#c99bff', 11) + [-1, 1].map((s) => C(s * 62, 46, 24, '#ffd9e8') + C(s * 62, 46, 15, '#ff9ec7') + C(s * 62 - 6, 40, 5, '#fff', 'opacity="0.6"')).join('') },
  { id: 'crown', kind: 'hat', tab: 'hats', z: 3, hatH: 48, vb: '-64 -64 128 92', art: () => P('M-44 18 L-50 -30 L-24 -6 L0 -44 L24 -6 L50 -30 L44 18 Q0 26 -44 18Z', 'url(#g-gold)', 'stroke="#e0a11e" stroke-width="3" stroke-linejoin="round"') + C(-50, -32, 5.5, '#ffe27a') + C(0, -46, 6, '#ffe27a') + C(50, -32, 5.5, '#ffe27a') + P(heartD(0, -2, 11), '#ff4f8b') + C(-27, 6, 5, '#7cc8ff') + C(27, 6, 5, '#5fd3b5') },
  { id: 'bow', kind: 'hat', tab: 'hats', z: 3, hatH: 22, vb: '-30 -50 110 80', art: () => at(30, -2, bowG(0, 0, 2.3, '#ff4f8b'), ' rotate(18)') },
  { id: 'flowers', kind: 'hat', tab: 'hats', z: 3, hatH: 28, vb: '-76 -30 152 70', art: () => {
    let g = L('M-60 22 Q0 -10 60 22', '#5fbf6a', 6);
    const cols = ['#ff9ec7', '#fff', '#c99bff', '#ffd36b', '#ff9ec7', '#fff', '#c99bff'];
    for (let i = 0; i < 7; i++) {
      const s = i / 6;
      const x = -60 * (1 - s) * (1 - s) + 60 * s * s;
      const y = 22 * (1 - s) * (1 - s) + 2 * s * (1 - s) * -10 + 22 * s * s;
      if (i % 2) g += E(x, y + 8, 9, 5, '#5fbf6a', `transform="rotate(${i * 30 - 90} ${f(x)} ${f(y + 8)})"`);
      g += flowerG(x, y, 15, cols[i]);
    }
    return g;
  } },
  { id: 'party', kind: 'hat', tab: 'hats', z: 3, hatH: 108, vb: '-56 -120 112 146', art: () => P('M-40 16 L0 -96 L40 16 Q0 26 -40 16Z', '#c99bff') + P('M-26 -22 L-14 -56 M-4 4 L10 -38 M18 -10 L26 -36', 'none', 'stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.7"') + C(-8, -64, 5, '#ffd36b') + C(14, -20, 5, '#ff7eb6') + C(-20, 0, 5, '#7cc8ff') + P('M-42 12 Q0 22 42 12 L42 20 Q0 32 -42 20Z', '#ff7eb6') + C(0, -98, 13, '#ffd36b') + C(-4, -102, 4, '#fff', 'opacity="0.6"') },
  { id: 'santa', kind: 'hat', tab: 'hats', z: 3, hatH: 70, vb: '-72 -80 160 120', art: () => P('M-52 22 C-50 -36 -12 -66 28 -62 C52 -58 70 -30 74 8 L60 12 C56 -14 46 -30 30 -32 C42 -8 50 6 54 22Z', '#ff5a7a') + P('M-30 -20 C-20 -40 0 -50 20 -50', 'none', 'stroke="#fff" stroke-width="5" opacity="0.25" stroke-linecap="round"') + R(-62, 12, 124, 24, 12, '#fff') + C(68, 12, 15, '#fff') + C(64, 8, 5, '#f0f4fb') },
  // scarves sit with (0,0) at the neck
  ...(
    [
      ['scarf-pink', '#ff7eb6'],
      ['scarf-mint', 'url(#IDS-mint)'],
      ['scarf-candy', 'url(#IDS-candy)'],
      ['scarf-dots', 'url(#IDS-dots)'],
      ['scarf-rainbow', 'url(#IDS-rainbow)'],
      ['scarf-sky', 'url(#IDS-flake)'],
    ] as [string, string][]
  ).map(([id, fill]): SDef => ({ id, kind: 'scarf', tab: 'scarves', z: 1, vb: '-78 -26 160 142', art: (ids: string) => snowScarf(fill.replace('IDS', ids), 'rgba(90,40,80,0.18)') })),
  // arms point right from the side of the middle ball; on the left they are mirrored
  { id: 'stick', kind: 'arm', tab: 'arms', z: 0, vb: '-8 -76 124 86', art: () => L('M0 0 Q50 -20 104 -60', '#7a4a2a', 9) + L('M62 -30 L72 -58 M84 -44 L108 -40', '#7a4a2a', 6) + L('M96 -56 l8 -2', '#fff', 6) },
  { id: 'mitten-pink', kind: 'arm', tab: 'arms', z: 0, vb: '-8 -82 124 92', art: () => mittenArm('#ff7eb6') },
  { id: 'mitten-mint', kind: 'arm', tab: 'arms', z: 0, vb: '-8 -82 124 92', art: () => mittenArm('#5fd3b5') },
  { id: 'mitten-lilac', kind: 'arm', tab: 'arms', z: 0, vb: '-8 -82 124 92', art: () => mittenArm('#c99bff') },
  // extras
  { id: 'btn-coal', kind: 'button', tab: 'extras', z: 2, vb: '-18 -18 36 36', art: () => coal(0, 0, 12) },
  { id: 'btn-pink', kind: 'button', tab: 'extras', z: 2, vb: '-18 -18 36 36', art: () => C(0, 0, 13, '#ff7eb6', 'stroke="#e0457b" stroke-width="2.5"') + [[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([x, y]) => C(x, y, 2.2, '#e0457b')).join('') },
  { id: 'btn-heart', kind: 'button', tab: 'extras', z: 2, vb: '-18 -18 36 36', art: () => P(heartD(0, -10, 16), '#ff4f8b') + C(-5, -5, 2.6, '#fff', 'opacity="0.6"') },
  { id: 'btn-star', kind: 'button', tab: 'extras', z: 2, vb: '-18 -18 36 36', art: () => P(starD(0, 1, 15, 0.5), 'url(#g-gold)', 'stroke="#e0a11e" stroke-width="2"') },
  { id: 'broom', kind: 'broom', tab: 'extras', z: 0, vb: '-60 -280 120 290', art: () => `<g transform="rotate(10)">${R(-5, -262, 10, 230, 5, '#a86b4a')}${R(-15, -46, 30, 13, 5, '#ff7eb6')}${P('M-14 -36 L-36 0 L36 0 L14 -36Z', '#f0c35a')}${L('M-6 -34 L-14 -2 M0 -34 L0 -2 M6 -34 L14 -2', '#c9962e', 3)}</g>` },
  { id: 'bird-blue', kind: 'bird', tab: 'extras', z: 4, vb: '-42 -48 80 56', art: () => birdArt('#7cc8ff', '#e8f6ff') },
  { id: 'bird-pink', kind: 'bird', tab: 'extras', z: 4, vb: '-42 -48 80 56', art: () => birdArt('#ff9ec7', '#fff3f8') },
];
const SNOW_BY_ID: Record<string, SDef> = Object.fromEntries(SNOW_DEFS.map((d) => [d.id, d]));
const SNOW_TABS = [
  { id: 'face', label: 'Face', icon: 'carrot' },
  { id: 'hats', label: 'Hats', icon: 'tophat' },
  { id: 'scarves', label: 'Scarves', icon: 'scarf-candy' },
  { id: 'arms', label: 'Arms', icon: 'mitten-pink' },
  { id: 'extras', label: 'Extras', icon: 'bird-blue' },
];

function stripePat(id: string, cols: string[], w: number, angle: number): string {
  const n = cols.length;
  return `<pattern id="${id}" width="${w * n}" height="${w * n}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">${cols.map((c, i) => R(i * w, 0, w, w * n, 0, c)).join('')}</pattern>`;
}

export function openSnowman(onClose: () => void): void {
  const kit = makeKit('sf-snow', 'Build a Snowman', () => [380, 130, 1220, 900], onClose);
  const ids = uid('snow');
  const CX = 800;
  const GY = 838;
  const SIZES = [122, 88, 62];
  const cyOf = (i: number) => {
    let cy = GY - SIZES[0];
    for (let k = 1; k <= i; k++) cy -= (SIZES[k - 1] + SIZES[k]) * 0.8;
    return cy;
  };
  const baseCy = cyOf(0);
  const midCy = cyOf(1);
  const headCy = cyOf(2);
  const headTop = headCy - SIZES[2];
  const neckY = headCy + 44;
  const armY = midCy - 20;
  const armX = SIZES[1] * 0.9;

  type Ball = { x: number; y: number; r: number; ang: number; ready: boolean };
  type Piece = { id: number; def: string; x: number; y: number };
  let stacked = 0;
  let ball: Ball | null = null;
  let tracks: { pts: Pt[]; w: number }[] = [];
  let pieces: Piece[] = [];
  let nextId = 1;
  let phase: 'roll' | 'decorate' | 'done' = 'roll';
  let tab = 'face';

  const defs = `<defs><radialGradient id="${ids}-ball" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f2f7fd"/><stop offset="1" stop-color="#c9d9ee"/></radialGradient>
    ${stripePat(`${ids}-mint`, ['#5fd3b5', '#e9fff8'], 12, 0)}${stripePat(`${ids}-candy`, ['#ff5a7a', '#ffffff'], 11, 35)}${stripePat(`${ids}-rainbow`, ['#ff7eb6', '#ffd36b', '#5fd3b5', '#7cc8ff', '#c99bff'], 9, 0)}
    <pattern id="${ids}-dots" width="22" height="22" patternUnits="userSpaceOnUse">${R(0, 0, 22, 22, 0, '#9b6bff')}${C(6, 6, 4, '#fff')}${C(17, 17, 4, '#ffd9e8')}</pattern>
    <pattern id="${ids}-flake" width="30" height="30" patternUnits="userSpaceOnUse">${R(0, 0, 30, 30, 0, '#7cc8ff')}${P(sparkleD(8, 8, 6), '#fff')}${C(22, 22, 3, '#fff')}</pattern></defs>`;
  const scenery =
    landscape('winter', 470, { trees: kit.tall ? [440, 1170] : [-120, 140, 1460, 1720], sunX: kit.tall ? 1080 : 1240 }) +
    ground('winter', 470) +
    picketFence(520, -600, 2200, '#ffffff') +
    // little snowy bushes and a sled for charm
    [[360, 560], [1250, 548], [-60, 600], [1680, 590]].map(([x, y]) => at(x, y, E(0, 0, 70, 34, '#e9f1fb') + E(-30, -10, 34, 26, '#f6f9ff') + E(26, -12, 38, 28, '#fff') + C(-10, -6, 5, '#ff5a7a') + C(14, -14, 5, '#ff5a7a'))).join('') +
    at(1220, 860, R(-70, -26, 140, 14, 7, '#ff7eb6') + L('M-76 -6 Q-70 4 -50 4 L64 4 Q84 4 86 -16', '#c99bff', 7) + L('M-40 -12 l0 14 M40 -12 l0 14', '#c99bff', 6));
  kit.svg.innerHTML = `${defs}<g>${scenery}</g><g class="sf-l-tracks"></g><g class="sf-l-spot"></g><g class="sf-l-man"><g class="sf-l-z0"></g><g class="sf-l-balls"></g><g class="sf-l-z1"></g><g class="sf-l-z2"></g><g class="sf-l-z3"></g><g class="sf-l-z4"></g></g><g class="sf-l-ball"></g>${fallingBits('snow', 46, -500, 2100, -80, 940)}`;

  const ballArt = (x: number, cy: number, r: number, ang: number, glow = false, shadow = true) => {
    let specks = '';
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39;
      const d = r * (0.25 + (i % 3) * 0.22);
      specks += E(Math.cos(a) * d, Math.sin(a) * d, r * 0.07, r * 0.045, '#c6d6ec', `transform="rotate(${f(a * 57)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" opacity="0.8"`);
    }
    return at(
      x,
      cy,
      (glow ? C(0, 0, r + 14, '#fff', 'class="sf-glow" opacity="0.8"') : '') +
        (shadow ? E(0, r * 0.9, r * 0.95, r * 0.17, '#a9bfde', 'opacity="0.5"') : '') +
        C(0, 0, r, `url(#${ids}-ball)`) +
        `<g transform="rotate(${f((ang * 180) / Math.PI)})">${specks}</g>` +
        E(-r * 0.36, -r * 0.42, r * 0.3, r * 0.17, '#fff', `opacity="0.9" transform="rotate(-30 ${f(-r * 0.36)} ${f(-r * 0.42)})"`),
    );
  };

  const drawTracks = () => {
    // all the wide strokes first, then the soft middles, so overlapping bits melt into one trail
    kit.layer('tracks').innerHTML = tracks.map((t) => L(smoothD(t.pts), '#d7e2f1', t.w)).join('') + tracks.map((t) => L(smoothD(t.pts), '#e3ebf6', t.w * 0.6)).join('');
  };
  const drawBall = () => {
    kit.layer('ball').innerHTML = ball ? `<g data-ball>${ballArt(ball.x, ball.y - ball.r, ball.r, ball.ang, ball.ready)}${C(ball.x, ball.y - ball.r, Math.max(ball.r, 60), 'transparent')}</g>` : '';
  };
  const drawSpot = () => {
    if (phase !== 'roll' || stacked >= 3) {
      kit.layer('spot').innerHTML = '';
      return;
    }
    const r = SIZES[stacked];
    const cy = cyOf(stacked);
    const hot = !!ball?.ready;
    kit.layer('spot').innerHTML =
      (stacked === 0 ? E(CX, GY, 150, 30, '#c9d9ee', 'opacity="0.6"') : '') +
      C(CX, cy, r, hot ? 'rgba(255,126,182,0.18)' : 'rgba(255,255,255,0.25)', `stroke="${hot ? '#ff7eb6' : '#ffffff'}" stroke-width="6" stroke-dasharray="18 14" ${hot ? 'class="sf-glow"' : 'opacity="0.8"'}`) +
      (hot ? P(heartD(CX, cy - 18, 30), '#ff7eb6', 'opacity="0.7" class="sf-glow"') : '');
  };
  const drawBalls = () => {
    let g = '';
    for (let i = 0; i < stacked; i++) g += ballArt(CX, cyOf(i), SIZES[i], i * 1.3, false, i === 0);
    kit.layer('balls').innerHTML = g;
  };
  const pieceArt = (p: Piece) => {
    const d = SNOW_BY_ID[p.def];
    const flip = (d.kind === 'arm' || d.kind === 'eye' || d.kind === 'bird' || d.kind === 'broom') && p.x < CX;
    const hit = d.kind === 'broom' ? R(-40, -270, 80, 280, 20, 'transparent') : C(d.kind === 'arm' ? 50 : d.kind === 'nose' ? 22 : 0, d.kind === 'arm' ? -26 : d.kind === 'hat' ? -30 : d.kind === 'scarf' ? 20 : d.kind === 'bird' ? -20 : 0, d.kind === 'hat' || d.kind === 'scarf' || d.kind === 'arm' ? 56 : 30, 'transparent');
    return `<g data-pid="${p.id}" transform="translate(${f(p.x)} ${f(p.y)})${flip ? ' scale(-1 1)' : ''}">${d.art(ids)}${hit}</g>`;
  };
  const drawPieces = () => {
    // birds sitting on top of the head hop onto whatever hat is there now
    const top = hatTop();
    for (const p of pieces) if (SNOW_BY_ID[p.def].kind === 'bird' && Math.abs(p.x - CX) < 50 && p.y < headTop + 12 && p.y > headTop - 130 && !drag.busy(p.id)) p.y = top + 2;
    const by: string[] = ['', '', '', '', ''];
    for (const p of pieces) by[SNOW_BY_ID[p.def].z] += pieceArt(p);
    by.forEach((g, z) => (kit.layer(`z${z}`).innerHTML = g));
  };
  const movePiece = (p: Piece) => {
    const node = kit.svg.querySelector(`[data-pid="${p.id}"]`);
    if (!node) return;
    const d = SNOW_BY_ID[p.def];
    const flip = (d.kind === 'arm' || d.kind === 'eye' || d.kind === 'bird' || d.kind === 'broom') && p.x < CX;
    node.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})${flip ? ' scale(-1 1)' : ''}`);
  };

  const ballSizes = () =>
    `<div class="sf-steps">${SIZES.map((r, i) => `<span class="sf-ball${i < stacked ? ' done' : i === stacked ? ' now' : ''}" style="width:${Math.round(r * 0.46)}px;height:${Math.round(r * 0.46)}px"></span>`).join('')}</div>`;
  const drawTray = () => {
    if (phase === 'roll') {
      const name = ['a BIG snowball for the bottom', 'a middle snowball', 'a little snowball for the head'][stacked];
      kit.tray.innerHTML = `<div class="sf-msg">${ballSizes()}<span>Roll ${name}!</span></div>`;
      return;
    }
    if (phase !== 'decorate') return;
    const tabs = SNOW_TABS.map((t) => ({ id: t.id, label: t.label, art: thumb(SNOW_BY_ID[t.icon].art(ids), SNOW_BY_ID[t.icon].vb) }));
    kit.tray.innerHTML = tabsHTML(tabs, tab) + `<div class="sf-items">${SNOW_DEFS.filter((d) => d.tab === tab).map((d) => itemBtn(d.id, thumb(d.art(ids), d.vb))).join('')}</div>`;
  };
  const rollTip = () => {
    if (phase !== 'roll') return;
    if (ball?.ready) kit.tip(stacked === 0 ? 'Big enough! Drag it onto the snowman spot.' : 'Great! Now drag it on top of the snowman.', icon('hand'));
    else kit.tip(stacked === 0 ? 'Roll the snowball around the yard to make it grow!' : 'Roll another snowball. It gets bigger as it rolls!', icon('snow'));
  };

  const newBall = () => {
    const left = stacked % 2 === 0;
    ball = { x: left ? 520 : 1080, y: 800, r: 32, ang: 0, ready: false };
    tracks = [];
    drawTracks();
    drawBall();
    drawSpot();
    drawTray();
    rollTip();
  };

  const startDecorate = () => {
    phase = 'decorate';
    ball = null;
    drawBall();
    drawSpot();
    kit.done.disabled = false;
    kit.tip('Now dress up your snowman! Tap or drag things from the tray.', icon('hat'));
    sound.success();
    sparkleAt(kit, [{ x: CX, y: headCy }, { x: CX, y: midCy }, { x: CX, y: baseCy }]);
    drawTray();
  };

  const start = () => {
    kit.stop();
    drag.clear();
    kit.root.querySelector('.sf-l-man')?.classList.remove('sf-wiggle');
    stacked = 0;
    pieces = [];
    phase = 'roll';
    tab = 'face';
    kit.done.disabled = true;
    drawBalls();
    drawPieces();
    newBall();
  };

  // where a thing goes when it is tapped in the tray
  const near = (kind: SKind, x: number, y: number, r = 16) => pieces.find((p) => SNOW_BY_ID[p.def].kind === kind && Math.hypot(p.x - x, p.y - y) < r);
  const hatTop = () => {
    const h = pieces.find((p) => SNOW_BY_ID[p.def].kind === 'hat' && Math.hypot(p.x - CX, p.y - headTop) < 4);
    return headTop - (h ? SNOW_BY_ID[h.def].hatH ?? 0 : 0);
  };
  const place = (def: SDef): Pt => {
    const replace = (kind: SKind, x: number, y: number) => {
      pieces = pieces.filter((p) => !(SNOW_BY_ID[p.def].kind === kind && Math.hypot(p.x - x, p.y - y) < 16));
      return { x, y };
    };
    const slots = (kind: SKind, list: Pt[]) => list.find((s) => !near(kind, s.x, s.y)) ?? { x: list[0].x + rnd(-30, 30), y: list[0].y + rnd(-20, 20) };
    switch (def.kind) {
      case 'nose': return replace('nose', CX + 2, headCy + 4);
      case 'mouth': return replace('mouth', CX, headCy + 24);
      case 'hat': return replace('hat', CX, headTop);
      case 'scarf': return replace('scarf', CX, neckY);
      case 'eye': return slots('eye', [{ x: CX - 24, y: headCy - 16 }, { x: CX + 24, y: headCy - 16 }]);
      case 'blush': return slots('blush', [{ x: CX - 38, y: headCy + 14 }, { x: CX + 38, y: headCy + 14 }]);
      case 'button': return slots('button', [{ x: CX, y: midCy - 36 }, { x: CX, y: midCy + 4 }, { x: CX, y: midCy + 44 }, { x: CX, y: baseCy - 40 }, { x: CX, y: baseCy + 6 }]);
      case 'arm': {
        const l = near('arm', CX - armX, armY);
        const r = near('arm', CX + armX, armY);
        if (!l) return { x: CX - armX, y: armY };
        if (!r) return { x: CX + armX, y: armY };
        return replace('arm', CX + armX, armY);
      }
      case 'broom': return slots('broom', [{ x: CX + 220, y: GY - 4 }, { x: CX - 220, y: GY - 4 }]);
      case 'bird': {
        const top = hatTop();
        return slots('bird', [{ x: CX + 12, y: top + 2 }, { x: CX - armX - 92, y: armY - 52 }, { x: CX + armX + 92, y: armY - 52 }]);
      }
    }
  };
  // a dropped hat, scarf or arm clicks into place when it is close
  const snap = (p: Piece) => {
    const d = SNOW_BY_ID[p.def];
    const to = (x: number, y: number, r: number) => {
      if (Math.hypot(p.x - x, p.y - y) > r) return false;
      pieces = pieces.filter((q) => q === p || !(SNOW_BY_ID[q.def].kind === d.kind && Math.hypot(q.x - x, q.y - y) < 16));
      p.x = x;
      p.y = y;
      return true;
    };
    if (d.kind === 'hat') return to(CX, headTop, 110);
    if (d.kind === 'scarf') return to(CX, neckY, 100);
    if (d.kind === 'arm') return to(CX - armX, armY, 80) || to(CX + armX, armY, 80);
    if (d.kind === 'nose') return to(CX + 2, headCy + 4, 26);
    return false;
  };

  const drag = tracker(kit, {
    move(id, p) {
      if (id === -1 && ball) {
        const v = kit.view();
        const nx = clamp(p.x, Math.max(v.x0, 200) + ball.r, Math.min(v.x1, 1400) - ball.r);
        const ny = clamp(p.y, 590, 884);
        const dx = nx - ball.x;
        const d = Math.hypot(dx, ny - ball.y);
        if (d < 0.5) return;
        ball.ang += dx / ball.r;
        ball.x = nx;
        ball.y = ny;
        if (!ball.ready) {
          ball.r = Math.min(SIZES[stacked], ball.r + d * 0.07);
          if (ball.r >= SIZES[stacked]) {
            ball.ready = true;
            sound.ding();
            sparkleAt(kit, [{ x: ball.x, y: ball.y - ball.r }]);
            drawSpot();
            rollTip();
          }
          const w = ball.r * 1.25;
          let t = tracks[tracks.length - 1];
          const pt = { x: ball.x, y: ball.y - ball.r * 0.12 };
          if (!t || Math.abs(t.w - w) > 8) {
            t = { pts: t ? [t.pts[t.pts.length - 1]] : [], w };
            tracks.push(t);
          }
          if (!t.pts.length || dist(t.pts[t.pts.length - 1], pt) > 8) t.pts.push(pt);
          drawTracks();
        }
        drawBall();
        return;
      }
      const pc = pieces.find((q) => q.id === id);
      if (pc) {
        pc.x = p.x;
        pc.y = p.y;
        movePiece(pc);
      }
    },
    end(id, _p, _e, toTray) {
      if (id === -1 && ball) {
        const target = { x: CX, y: cyOf(stacked) };
        const c = { x: ball.x, y: ball.y - ball.r };
        if (ball.ready && dist(c, target) < 170) {
          const b = ball;
          const from = { ...c };
          kit.tween(260, (t) => {
            const k = ease(t);
            b.x = from.x + (target.x - from.x) * k;
            b.y = from.y + (target.y - from.y) * k + b.r;
            drawBall();
          }, () => {
            stacked++;
            ball = null;
            drawBall();
            drawBalls();
            sound.thud();
            sparkleAt(kit, [target], 'sparkle', 10);
            if (stacked >= 3) startDecorate();
            else newBall();
          });
        } else if (!ball.ready && dist(c, target) < 120) kit.tip('Keep rolling to make it bigger!', icon('snow'));
        return;
      }
      const pc = pieces.find((q) => q.id === id);
      if (!pc) return;
      if (toTray) {
        pieces = pieces.filter((q) => q !== pc);
        sound.pop();
        drawPieces();
        return;
      }
      if (snap(pc)) sound.click();
      sound.drop();
      drawPieces();
    },
  });

  kit.on(kit.svg, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (phase === 'roll' && t.closest('[data-ball]') && ball) {
      drag.begin(e, -1, { x: ball.x, y: ball.y }, false);
      sound.pick();
      return;
    }
    const g = t.closest('[data-pid]') as SVGGElement | null;
    if (g && phase === 'decorate') {
      const pc = pieces.find((q) => q.id === Number(g.getAttribute('data-pid')));
      if (!pc) return;
      // bring to the front of its layer
      pieces = pieces.filter((q) => q !== pc).concat(pc);
      drawPieces();
      drag.begin(e, pc.id, { x: pc.x, y: pc.y });
      sound.pick();
    }
  });

  trayGestures(kit, {
    tab(id) {
      tab = id;
      drawTray();
    },
    tap(id) {
      const d = SNOW_BY_ID[id];
      if (!d || phase !== 'decorate') return;
      const p = place(d);
      const pc = { id: nextId++, def: id, ...p };
      pieces.push(pc);
      drawPieces();
      sound.pop();
      sparkleAt(kit, [p], 'sparkle', 6);
    },
    drag(id, e) {
      const d = SNOW_BY_ID[id];
      if (!d || phase !== 'decorate') return;
      const p = kit.pt(e);
      const pc = { id: nextId++, def: id, x: p.x, y: p.y - 20 };
      pieces.push(pc);
      drawPieces();
      drag.begin(e, pc.id, { x: pc.x, y: pc.y });
      sound.pick();
    },
  });

  kit.reset.onclick = () => {
    sound.whoosh();
    start();
  };
  kit.done.onclick = () => {
    if (phase !== 'decorate') return;
    phase = 'done';
    kit.tip('');
    const man = kit.layer('man');
    man.classList.remove('sf-wiggle');
    void man.getBoundingClientRect();
    man.classList.add('sf-wiggle');
    sound.giggle();
    sparkleAt(kit, [{ x: CX, y: headTop - 40 }, { x: CX - 150, y: midCy }, { x: CX + 150, y: midCy }, { x: CX, y: baseCy }], 'sparkle', 18);
    kit.later(() => {
      const dressed = pieces.length;
      win(kit, {
        stat: 'snowman',
        coins: 20,
        title: 'Super snowman!',
        text: dressed > 6 ? 'What a fancy friend. Brrr-illiant!' : 'Your snowman says hello!',
        again: 'Build another',
        onAgain: start,
      });
    }, 700);
  };
  start();
}

// ================================================================================================
// FALL: carve a happy pumpkin
// ================================================================================================
interface Stamp { id: string; tab: 'eyes' | 'noses' | 'mouths'; d: string; sw?: number; evenodd?: boolean; vb: string }
const circD = (x: number, y: number, r: number) => `M${f(x - r)} ${f(y)} A${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(y)} A${f(r)} ${f(r)} 0 1 0 ${f(x - r)} ${f(y)}Z`;
const ellD = (x: number, y: number, rx: number, ry: number) => `M${f(x - rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 1 0 ${f(x + rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 1 0 ${f(x - rx)} ${f(y)}Z`;
const STAMPS: Stamp[] = [
  { id: 'e-round', tab: 'eyes', d: circD(0, 0, 30), vb: '-44 -44 88 88' },
  { id: 'e-tri', tab: 'eyes', d: 'M-36 24 Q-30 18 0 -32 Q30 18 36 24 Q0 16 -36 24Z', vb: '-44 -44 88 88' },
  { id: 'e-heart', tab: 'eyes', d: heartD(0, -30, 44), vb: '-50 -44 100 88' },
  { id: 'e-star', tab: 'eyes', d: starD(0, 2, 38, 0.48), vb: '-44 -44 88 88' },
  { id: 'e-happy', tab: 'eyes', d: 'M-38 14 Q0 -46 38 14 Q0 -14 -38 14Z', vb: '-44 -44 88 88' },
  { id: 'e-cat', tab: 'eyes', d: 'M-38 8 Q-4 -32 38 -12 Q10 28 -38 8Z', vb: '-44 -44 88 88' },
  { id: 'e-sleepy', tab: 'eyes', d: 'M-38 -8 Q0 34 38 -8 Q0 8 -38 -8Z', vb: '-44 -44 88 88' },
  { id: 'e-moon', tab: 'eyes', d: 'M8 -32 A32 32 0 1 0 8 32 A24 26 0 1 1 8 -32Z', vb: '-44 -44 88 88' },
  { id: 'n-tri', tab: 'noses', d: 'M-22 16 L0 -20 L22 16 Q0 10 -22 16Z', vb: '-34 -34 68 68' },
  { id: 'n-heart', tab: 'noses', d: heartD(0, -18, 28), vb: '-34 -34 68 68' },
  { id: 'n-round', tab: 'noses', d: circD(0, 0, 16), vb: '-34 -34 68 68' },
  { id: 'n-cat', tab: 'noses', d: 'M-20 -12 Q0 -18 20 -12 Q6 14 0 14 Q-6 14 -20 -12Z', vb: '-34 -34 68 68' },
  { id: 'n-star', tab: 'noses', d: starD(0, 2, 22, 0.5), vb: '-34 -34 68 68' },
  { id: 'm-smile', tab: 'mouths', d: 'M-104 -22 Q0 96 104 -22 Q0 30 -104 -22Z', vb: '-120 -60 240 120' },
  { id: 'm-teeth', tab: 'mouths', d: 'M-108 -28 Q0 110 108 -28 Q0 22 -108 -28Z M-34 14 L-34 34 L-12 36 L-12 18Z M12 18 L12 36 L34 34 L34 14Z', evenodd: true, vb: '-120 -60 240 120' },
  { id: 'm-o', tab: 'mouths', d: ellD(0, 0, 38, 46), vb: '-120 -60 240 120' },
  { id: 'm-cat', tab: 'mouths', d: 'M-70 -14 Q-36 34 0 -6 Q36 34 70 -14', sw: 20, vb: '-120 -60 240 120' },
  { id: 'm-wavy', tab: 'mouths', d: 'M-96 -4 Q-72 26 -48 -4 Q-24 26 0 -4 Q24 26 48 -4 Q72 26 96 -4', sw: 18, vb: '-120 -60 240 120' },
  { id: 'm-kiss', tab: 'mouths', d: heartD(0, -22, 40), vb: '-120 -60 240 120' },
  { id: 'm-whisk', tab: 'mouths', d: 'M-80 -10 L-150 -26 M-80 8 L-152 8 M80 -10 L150 -26 M80 8 L152 8', sw: 11, vb: '-160 -60 320 120' },
];
const STAMP_BY_ID: Record<string, Stamp> = Object.fromEntries(STAMPS.map((s) => [s.id, s]));
const FACES: { id: string; eye: string; nose: string; mouth: string[] }[] = [
  { id: 'f-happy', eye: 'e-round', nose: 'n-tri', mouth: ['m-smile'] },
  { id: 'f-cat', eye: 'e-cat', nose: 'n-cat', mouth: ['m-cat', 'm-whisk'] },
  { id: 'f-love', eye: 'e-heart', nose: 'n-heart', mouth: ['m-smile'] },
  { id: 'f-star', eye: 'e-star', nose: 'n-round', mouth: ['m-teeth'] },
  { id: 'f-sleepy', eye: 'e-sleepy', nose: 'n-round', mouth: ['m-o'] },
  { id: 'f-silly', eye: 'e-happy', nose: 'n-star', mouth: ['m-wavy'] },
];

export function openPumpkin(onClose: () => void): void {
  const kit = makeKit('sf-pump', 'Carve a Pumpkin', (tall) => (tall ? [450, 240, 1150, 900] : [360, 250, 1240, 900]), onClose);
  const ids = uid('pk');
  const PX = 800;
  const PY = 566;
  const RX = 270;
  const RY = 212;
  const LID_Y = PY - RY * 0.74;
  const EYE_Y = PY - 34;
  const NOSE_Y = PY + 34;
  const MOUTH_Y = PY + 112;
  const BOWL = kit.tall ? { x: 1050, y: 866, s: 0.72 } : { x: 1196, y: 832, s: 1 };
  const LID_REST = kit.tall ? { x: 590, y: 850, s: 0.45 } : { x: 450, y: 730, s: 0.6 };

  type Placed = { id: number; s: string; x: number; y: number };
  type Cut = { pts: Pt[]; w: number };
  type Seed = { x: number; y: number; a: number; gone: boolean };
  let phase: 'lid' | 'seeds' | 'carve' | 'lit' = 'lid';
  let stamps: Placed[] = [];
  let cuts: Cut[] = [];
  let hist: string[] = [];
  let seeds: Seed[] = [];
  let goo: { x: number; y: number; d: string; gone: boolean }[] = [];
  let inBowl = 0;
  let lidOff = false;
  let tab = 'faces';
  let cutW = 16;
  let nextId = 1;
  let night = 0;

  const ribs: [number, number, number, number][] = [
    [PX - 168, PY + 14, 108, RY - 30],
    [PX + 168, PY + 14, 108, RY - 30],
    [PX - 92, PY + 4, 150, RY - 8],
    [PX + 92, PY + 4, 150, RY - 8],
    [PX, PY, 120, RY],
  ];
  const zig = () => {
    let d = `M${PX - 260} ${f(LID_Y)}`;
    for (let i = 0; i <= 20; i++) d += ` L${f(PX - 250 + i * 25)} ${f(LID_Y + (i % 2 ? -14 : 8))}`;
    return d;
  };
  const defs = `<defs>
    <radialGradient id="${ids}-body" cx="0.4" cy="0.32" r="0.8"><stop offset="0" stop-color="#ffb259"/><stop offset="0.6" stop-color="#ff8a2a"/><stop offset="1" stop-color="#e8641a"/></radialGradient>
    <radialGradient id="${ids}-in" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffe0a0"/><stop offset="0.7" stop-color="#ffc061"/><stop offset="1" stop-color="#e88a2e"/></radialGradient>
    <radialGradient id="${ids}-hole" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#8a3a12"/><stop offset="1" stop-color="#4a1c06"/></radialGradient>
    <radialGradient id="${ids}-glow" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.6" stop-color="#ffe680"/><stop offset="1" stop-color="#ffb52e"/></radialGradient>
    <radialGradient id="${ids}-halo"><stop offset="0" stop-color="#ffd36b" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
    <radialGradient id="${ids}-fly"><stop offset="0" stop-color="#fffbd0"/><stop offset="0.4" stop-color="#fff59a" stop-opacity="0.8"/><stop offset="1" stop-color="#fff59a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${ids}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b48aff"/><stop offset="0.35" stop-color="#ff9ec7"/><stop offset="0.7" stop-color="#ffb38a"/><stop offset="1" stop-color="#ffe0a6"/></linearGradient>
    <linearGradient id="${ids}-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f30"/><stop offset="0.6" stop-color="#2c2152"/><stop offset="1" stop-color="#4a2c63"/></linearGradient>
    <clipPath id="${ids}-sil">${ribs.map(([x, y, rx, ry]) => E(x, y, rx, ry, '#000')).join('')}</clipPath>
    <clipPath id="${ids}-top"><path d="${zig()} L${PX + 320} ${f(LID_Y)} L${PX + 320} 200 L${PX - 320} 200 L${PX - 320} ${f(LID_Y)}Z"/></clipPath>
    <clipPath id="${ids}-bot"><path d="${zig()} L${PX + 320} ${f(LID_Y)} L${PX + 320} 900 L${PX - 320} 900 L${PX - 320} ${f(LID_Y)}Z"/></clipPath>
    <filter id="${ids}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

  const sky = R(-600, -500, 2800, 1900, 0, `url(#${ids}-sky)`) + C(1230, 600, 230, '#ffd9a0', 'opacity="0.35"') + C(1230, 600, 140, '#ffe9b8', 'opacity="0.5"') + C(1230, 600, 96, '#fff2c6') +
    cloud(420, 170, 0.9, 60) + cloud(1500, 120, 0.7, -50) +
    P('M-600 640 Q-200 480 200 600 Q600 470 1000 590 Q1400 470 1800 590 Q2000 540 2200 580 L2200 700 L-600 700Z', '#d98bb5') +
    P('M-600 660 Q-100 560 400 650 Q900 560 1300 650 Q1700 580 2200 640 L2200 700 L-600 700Z', '#c27aa8');
  const patch = ground('fall', 650) + picketFence(690, -600, 2200, '#f6e2c4') +
    // hay bale and little pumpkins around the patch
    at(160, 770, R(-110, -96, 220, 100, 26, '#f0c35a') + L('M-90 -70 L90 -70 M-96 -40 L96 -40 M-96 -12 L96 -12', '#d9a23a', 5) + R(-110, -96, 220, 100, 26, 'none', 'stroke="#d9a23a" stroke-width="5"')) +
    [[300, 740, 0.32], [1380, 730, 0.36], [1560, 790, 0.28], [40, 860, 0.3], [1100, 900, 0.22]].map(([x, y, s]) => at(x, y, miniPumpkin(), ` scale(${s})`)).join('') +
    L('M-200 820 Q0 780 200 840 Q300 870 420 830', '#5fa84a', 6, 'opacity="0.8"') + L('M1300 860 Q1500 820 1700 870 Q1800 890 1900 860', '#5fa84a', 6, 'opacity="0.8"') +
    [[60, 812], [380, 834], [1420, 846], [1720, 868]].map(([x, y]) => E(x, y, 22, 12, '#6fbf5a', `transform="rotate(-20 ${x} ${y})"`)).join('');
  kit.svg.innerHTML = `${defs}<g>${sky}</g><g class="sf-l-night" style="opacity:0;transition:opacity 1.4s"></g><g>${patch}</g>${fallingBits('leaf', 12, -400, 2000, -60, 920)}<g class="sf-l-nightpatch" style="opacity:0;transition:opacity 1.4s">${R(-600, 600, 2800, 900, 0, '#1d1638', 'opacity="0.55"')}</g><g class="sf-l-halo"></g><g class="sf-l-body"></g><g class="sf-l-inside"></g><g class="sf-l-holes"></g><g class="sf-l-lid"></g><g class="sf-l-bowl"></g><g class="sf-l-fly"></g><g class="sf-l-fireflies"></g>`;
  kit.layer('night').innerHTML = R(-600, -500, 2800, 1900, 0, `url(#${ids}-night)`) +
    Array.from({ length: 40 }, (_, i) => P(sparkleD(((i * 397) % 2400) - 400, 20 + ((i * 211) % 520), 4 + (i % 3) * 2), '#fff', `opacity="${0.5 + (i % 3) * 0.2}"`)).join('') +
    C(1240, 200, 62, '#fff6d6') + C(1262, 186, 54, '#2c2152', 'opacity="0.0"') + C(1222, 186, 9, '#f0e2b8') + C(1256, 222, 12, '#f0e2b8');

  const body = (dim: number) => {
    let g = E(PX, PY + RY - 8, RX + 30, 30, '#5a3a2a', 'opacity="0.18"');
    ribs.forEach(([x, y, rx, ry], i) => (g += E(x, y, rx, ry, `url(#${ids}-body)`, `stroke="#d9561a" stroke-width="4" ${i < 2 ? 'opacity="0.98"' : ''}`)));
    g += E(PX - 70, PY - 120, 40, 70, '#fff', 'opacity="0.14" transform="rotate(20 730 446)"');
    if (dim) g += `<g clip-path="url(#${ids}-sil)">${R(PX - 300, PY - 260, 600, 520, 0, '#1d1638', `opacity="${f(dim * 0.42)}"`)}${phase === 'lit' ? E(PX, PY + 40, RX * 0.8, RY * 0.75, `url(#${ids}-halo)`, `opacity="${f(dim * 0.95)}"`) : ''}</g>`;
    return g;
  };
  const stem = () => P(`M${PX - 18} ${PY - RY + 12} Q${PX - 22} ${PY - RY - 40} ${PX - 4} ${PY - RY - 62} L${PX + 16} ${PY - RY - 56} Q${PX + 6} ${PY - RY - 30} ${PX + 18} ${PY - RY + 12}Z`, '#7a5a2a') +
    L(`M${PX + 10} ${PY - RY - 50} q30 -24 52 -4 q16 16 -6 22`, '#5fa84a', 6) + E(PX - 60, PY - RY - 10, 40, 18, '#6fbf5a', `transform="rotate(-24 ${PX - 60} ${PY - RY - 10})"`) + L(`M${PX - 96} ${PY - RY + 4} Q${PX - 60} ${PY - RY - 10} ${PX - 22} ${PY - RY - 20}`, '#4f9a3c', 3);
  const drawBody = () => {
    const dim = night;
    kit.layer('body').innerHTML = lidOff && phase !== 'lit' ? `<g clip-path="url(#${ids}-bot)">${body(dim)}</g><g clip-path="url(#${ids}-sil)">${E(PX, LID_Y, 200, 30, '#ffc061')}${E(PX, LID_Y + 4, 188, 24, '#5a2208')}</g>` : body(dim);
    kit.layer('halo').innerHTML = phase === 'lit' ? E(PX, PY, RX + 160, RY + 140, `url(#${ids}-halo)`, 'class="sf-glow"') : '';
  };
  const lidArt = () => `<g clip-path="url(#${ids}-top)">${body(night)}</g>${stem()}${lidOff ? '' : `<g clip-path="url(#${ids}-sil)">${L(zig(), '#c9561a', 3, 'opacity="0.6" stroke-dasharray="6 6"')}</g>`}`;
  let lidPos = { x: 0, y: 0, rot: 0, s: 1 };
  const drawLid = () => {
    const cx = PX;
    const cy = LID_Y - 40;
    kit.layer('lid').innerHTML = `<g data-lid transform="translate(${f(lidPos.x)} ${f(lidPos.y)}) translate(${cx} ${f(cy)}) rotate(${f(lidPos.rot)}) scale(${f(lidPos.s)}) translate(${-cx} ${f(-cy)})">${lidArt()}${phase === 'lid' ? E(PX, LID_Y - 60, 220, 110, 'transparent') : ''}</g>`;
  };

  const drawInside = () => {
    if (phase !== 'seeds') {
      kit.layer('inside').innerHTML = '';
      return;
    }
    let g = E(PX, PY + 20, 205, 150, `url(#${ids}-in)`, 'stroke="#ffd98a" stroke-width="12"');
    for (const s of goo) if (!s.gone) g += L(s.d, '#ffad42', 8, 'opacity="0.9"');
    for (const s of seeds) if (!s.gone) g += at(s.x, s.y, E(0, 0, 13, 8, '#fff6dc', 'stroke="#e8c48a" stroke-width="2"') + E(-3, -2, 5, 2.5, '#fff', 'opacity="0.8"'), ` rotate(${f(s.a)})`);
    kit.layer('inside').innerHTML = `<g data-inside>${g}</g>`;
  };
  const drawBowl = () => {
    let pile = '';
    for (let i = 0; i < Math.min(inBowl, 40); i++) {
      const row = Math.floor(i / 8);
      const x = -60 + ((i % 8) * 17) + (row % 2) * 8;
      const y = -6 - row * 7;
      pile += E(x, y, 9, 5.5, '#fff6dc', `stroke="#e8c48a" stroke-width="1.5" transform="rotate(${(i * 47) % 180} ${x} ${y})"`);
    }
    kit.layer('bowl').innerHTML = at(BOWL.x, BOWL.y, `<g transform="scale(${BOWL.s})">` + E(0, 34, 100, 14, '#000', 'opacity="0.12"') + P('M-92 -8 Q-86 40 0 44 Q86 40 92 -8Z', '#c99bff') + P('M-92 -8 Q-86 40 0 44 Q86 40 92 -8Z', 'none', 'stroke="#9b6bff" stroke-width="3"') + E(0, -8, 92, 18, '#9b6bff') + E(0, -6, 84, 13, '#7a4fd6') + pile + P(heartD(0, 8, 16), '#fff', 'opacity="0.7"') + '</g>');
  };

  const holesArt = (lit: boolean) => {
    const rim = lit ? '#ffb52e' : '#ffcf6e';
    const fill = lit ? `url(#${ids}-glow)` : `url(#${ids}-hole)`;
    const flat = lit ? '#fff1a0' : '#5a2208';
    let g = '';
    for (const c of cuts) g += L(smoothD(c.pts), rim, c.w + 10) + L(smoothD(c.pts), flat, c.w);
    for (const p of stamps) {
      const s = STAMP_BY_ID[p.s];
      const flip = s.tab === 'eyes' && p.x < PX ? ' scale(-1 1)' : '';
      const tr = `transform="translate(${f(p.x)} ${f(p.y)})${flip}"`;
      const hit = C(0, 0, s.tab === 'mouths' ? 70 : 40, 'transparent');
      if (s.sw) g += `<g data-st="${p.id}" ${tr}>${L(s.d, rim, s.sw + 10)}${L(s.d, flat, s.sw)}${hit}</g>`;
      else g += `<g data-st="${p.id}" ${tr}>${P(s.d, rim, `stroke="${rim}" stroke-width="12" stroke-linejoin="round" ${s.evenodd ? 'fill-rule="evenodd"' : ''}`)}${P(s.d, fill, s.evenodd ? 'fill-rule="evenodd"' : '')}${hit}</g>`;
    }
    return g;
  };
  const drawHoles = () => {
    const lit = phase === 'lit';
    kit.layer('holes').innerHTML = `<g clip-path="url(#${ids}-sil)"${lit ? ` filter="url(#${ids}-blur)"` : ''}>${holesArt(lit)}${lit ? `<animate attributeName="opacity" values="1;0.82;1;0.9;1" dur="1.3s" repeatCount="indefinite"/>` : ''}</g>`;
  };
  const moveStamp = (p: Placed) => {
    const node = kit.svg.querySelector(`[data-st="${p.id}"]`);
    const s = STAMP_BY_ID[p.s];
    node?.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})${s.tab === 'eyes' && p.x < PX ? ' scale(-1 1)' : ''}`);
  };

  const stampThumb = (s: Stamp) => thumb(`<g>${s.sw ? L(s.d, '#5a2208', s.sw) : P(s.d, '#5a2208', s.evenodd ? 'fill-rule="evenodd"' : '')}</g>`, s.vb);
  const faceThumb = (fc: (typeof FACES)[number]) => {
    const e = STAMP_BY_ID[fc.eye];
    const n = STAMP_BY_ID[fc.nose];
    const st = (s: Stamp, x: number, y: number, k: number, flip = false) => at(x, y, s.sw ? L(s.d, '#5a2208', s.sw) : P(s.d, '#5a2208', s.evenodd ? 'fill-rule="evenodd"' : ''), ` scale(${flip ? -k : k} ${k})`);
    return thumb(at(0, 4, miniPumpkin()) + st(e, -26, -6, 0.42, true) + st(e, 26, -6, 0.42) + st(n, 0, 12, 0.42) + fc.mouth.map((m) => st(STAMP_BY_ID[m], 0, 32, 0.36)).join(''), '-80 -70 160 140');
  };
  const PUMP_TABS = [
    { id: 'faces', label: 'Faces', art: faceThumb(FACES[0]) },
    { id: 'eyes', label: 'Eyes', art: stampThumb(STAMP_BY_ID['e-star']) },
    { id: 'noses', label: 'Noses', art: stampThumb(STAMP_BY_ID['n-heart']) },
    { id: 'mouths', label: 'Mouths', art: stampThumb(STAMP_BY_ID['m-smile']) },
    { id: 'cut', label: 'Finger cut', art: icon('hand') },
  ];
  const drawTray = () => {
    if (phase === 'lid') {
      kit.tray.innerHTML = `<div class="sf-msg">${thumb(at(0, 10, miniPumpkin()), '-80 -80 160 150')}<span>Tap the lid to pop it off!</span></div>`;
      return;
    }
    if (phase === 'seeds') {
      kit.tray.innerHTML = `<div class="sf-msg">${icon('hand')}<span>Scoop out the seeds with your finger! <b>${seeds.filter((s) => !s.gone).length}</b> left</span></div>`;
      return;
    }
    if (phase !== 'carve') return;
    let items = '';
    if (tab === 'faces') items = FACES.map((fc) => itemBtn(fc.id, faceThumb(fc))).join('');
    else if (tab === 'cut') items = [10, 16, 26].map((w) => itemBtn(`w${w}`, thumb(L('M-26 10 Q-8 -20 8 0 T26 -10', '#5a2208', w * 0.6), '-34 -34 68 68'), w === cutW)).join('');
    else items = STAMPS.filter((s) => s.tab === tab).map((s) => itemBtn(s.id, stampThumb(s))).join('');
    kit.tray.innerHTML = tabsHTML(PUMP_TABS, tab) + `<div class="sf-items">${items}${undoBtn()}</div>`;
  };
  const carveTip = () =>
    kit.tip(tab === 'cut' ? 'Draw on the pumpkin with your finger to carve!' : 'Tap a face to carve it! Drag parts to move them.', icon(tab === 'cut' ? 'pencil' : 'star'));

  const snapshot = () => JSON.stringify({ stamps, cuts });
  const remember = () => {
    hist.push(snapshot());
    if (hist.length > 40) hist.shift();
  };
  const inPumpkin = (p: Pt) => ((p.x - PX) / (RX + 6)) ** 2 + ((p.y - PY) / (RY + 4)) ** 2 < 1;

  const start = () => {
    kit.stop();
    drag.clear();
    phase = 'lid';
    stamps = [];
    cuts = [];
    hist = [];
    inBowl = 0;
    lidOff = false;
    lidPos = { x: 0, y: 0, rot: 0, s: 1 };
    night = 0;
    tab = 'faces';
    kit.root.classList.remove('sf-night');
    (kit.layer('night') as SVGGElement).style.opacity = '0';
    (kit.layer('nightpatch') as SVGGElement).style.opacity = '0';
    kit.layer('fireflies').innerHTML = '';
    seeds = Array.from({ length: 24 }, () => {
      const a = rnd(0, Math.PI * 2);
      const r = Math.sqrt(Math.random()) * 0.82;
      return { x: PX + Math.cos(a) * 190 * r, y: PY + 20 + Math.sin(a) * 135 * r, a: rnd(0, 180), gone: false };
    });
    goo = Array.from({ length: 9 }, (_, i) => {
      const x = PX - 150 + i * 38 + rnd(-10, 10);
      const y = PY - 70 + rnd(0, 150);
      return { x, y: y + 20, d: `M${f(x)} ${f(y)} q${f(rnd(-30, 30))} 20 ${f(rnd(-10, 10))} 40 t${f(rnd(-20, 20))} 40`, gone: false };
    });
    kit.done.disabled = true;
    kit.done.querySelector('span')!.textContent = 'Light it!';
    kit.tip('Tap the lid to pop it off!', icon('hand'));
    drawBody();
    drawLid();
    drawInside();
    drawHoles();
    drawBowl();
    drawTray();
  };

  const popLid = () => {
    phase = 'seeds';
    lidOff = true;
    sound.boing();
    drawBody();
    drawInside();
    drawTray();
    kit.tip('Yuck, goo! Scoop out the seeds with your finger.', icon('hand'));
    const to = { x: LID_REST.x - PX, y: LID_REST.y - (LID_Y - 40) };
    kit.tween(800, (t) => {
      const k = easeIO(t);
      lidPos = { x: to.x * k, y: to.y * k - Math.sin(t * Math.PI) * 220, rot: -14 * k + Math.sin(t * Math.PI) * -40, s: 1 - (1 - LID_REST.s) * k };
      drawLid();
    }, () => {
      sound.thud();
      sparkleAt(kit, [LID_REST], 'sparkle', 8);
    });
  };

  let lastScoop = 0;
  const scoop = (p: Pt) => {
    let any = false;
    for (const s of seeds) {
      if (s.gone || Math.hypot(s.x - p.x, s.y - p.y) > 52) continue;
      s.gone = true;
      any = true;
      flySeed(s);
    }
    for (const g of goo) if (!g.gone && Math.hypot(g.x - p.x, g.y - p.y) < 60) {
      g.gone = true;
      any = true;
    }
    if (!any) return;
    drawInside();
    drawTray();
    if (performance.now() - lastScoop > 110) {
      sound.squeak();
      lastScoop = performance.now();
    }
    if (seeds.every((s) => s.gone)) {
      goo.forEach((g) => (g.gone = true));
      kit.later(() => {
        phase = 'carve';
        drawInside();
        drawTray();
        carveTip();
        kit.done.disabled = false;
        sound.success();
        sparkleAt(kit, [{ x: PX, y: PY }], 'sparkle', 20);
      }, 700);
    }
  };
  const flySeed = (s: Seed) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.innerHTML = E(0, 0, 13, 8, '#fff6dc', 'stroke="#e8c48a" stroke-width="2"');
    kit.layer('fly').appendChild(node);
    const from = { x: s.x, y: s.y };
    const to = { x: BOWL.x + rnd(-50, 50) * BOWL.s, y: BOWL.y - 10 * BOWL.s };
    kit.tween(520 + rnd(0, 200), (t) => {
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 220;
      node.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(s.a + t * 540)})`);
    }, () => {
      node.remove();
      inBowl++;
      drawBowl();
      if (inBowl % 3 === 0) sound.click();
    });
  };

  // carving: stamps go where they belong, both eyes together
  const addStamp = (id: string) => {
    const s = STAMP_BY_ID[id];
    remember();
    if (s.tab === 'eyes') {
      stamps = stamps.filter((p) => !(STAMP_BY_ID[p.s].tab === 'eyes' && Math.abs(p.y - EYE_Y) < 30 && Math.abs(Math.abs(p.x - PX) - 96) < 30));
      stamps.push({ id: nextId++, s: id, x: PX - 96, y: EYE_Y }, { id: nextId++, s: id, x: PX + 96, y: EYE_Y });
    } else {
      const y = s.tab === 'noses' ? NOSE_Y : MOUTH_Y;
      const keep = id === 'm-whisk' ? (p: Placed) => p.s !== 'm-whisk' : (p: Placed) => !(STAMP_BY_ID[p.s].tab === s.tab && p.s !== 'm-whisk' && Math.abs(p.y - y) < 30 && Math.abs(p.x - PX) < 30);
      stamps = stamps.filter(keep);
      stamps.push({ id: nextId++, s: id, x: PX, y: id === 'm-whisk' ? NOSE_Y + 24 : y });
    }
    sound.pop();
    drawHoles();
    sparkleAt(kit, [{ x: PX, y: s.tab === 'eyes' ? EYE_Y : PY + 60 }], 'sparkle', 8);
  };
  const addFace = (id: string) => {
    const fc = FACES.find((x) => x.id === id)!;
    remember();
    stamps = [
      { id: nextId++, s: fc.eye, x: PX - 96, y: EYE_Y },
      { id: nextId++, s: fc.eye, x: PX + 96, y: EYE_Y },
      { id: nextId++, s: fc.nose, x: PX, y: NOSE_Y },
      ...fc.mouth.map((m) => ({ id: nextId++, s: m, x: PX, y: m === 'm-whisk' ? NOSE_Y + 24 : MOUTH_Y })),
    ];
    sound.pop();
    kit.later(() => sound.pop(), 120);
    drawHoles();
    sparkleAt(kit, [{ x: PX - 96, y: EYE_Y }, { x: PX + 96, y: EYE_Y }, { x: PX, y: MOUTH_Y }], 'sparkle', 8);
  };

  let cutting: { pid: number; cut: Cut } | null = null;
  const drag = tracker(kit, {
    move(id, p) {
      const st = stamps.find((q) => q.id === id);
      if (st) {
        st.x = p.x;
        st.y = p.y;
        moveStamp(st);
      }
    },
    end(id, p, _e, toTray) {
      const st = stamps.find((q) => q.id === id);
      if (!st) return;
      if (toTray || !inPumpkin(p) || p.y < LID_Y + 20) {
        stamps = stamps.filter((q) => q !== st);
        sound.pop();
        sparkleAt(kit, [p], 'sparkle', 6);
      } else sound.drop();
      drawHoles();
    },
  });

  kit.on(kit.svg, 'pointerdown', (e) => {
    const t = e.target as Element;
    const p = kit.pt(e);
    if (phase === 'lid') {
      if (t.closest('[data-lid]') || dist(p, { x: PX, y: PY }) < 300) popLid();
      return;
    }
    if (phase === 'seeds') {
      scoopPid = e.pointerId;
      scoop(p);
      return;
    }
    if (phase !== 'carve') return;
    const g = t.closest('[data-st]');
    if (g) {
      const st = stamps.find((q) => q.id === Number(g.getAttribute('data-st')));
      if (st) {
        remember();
        drag.begin(e, st.id, { x: st.x, y: st.y });
        sound.pick();
      }
      return;
    }
    if (tab === 'cut' && inPumpkin(p) && p.y > LID_Y + 10) {
      remember();
      cutting = { pid: e.pointerId, cut: { pts: [p], w: cutW } };
      cuts.push(cutting.cut);
      drawHoles();
      sound.squeak();
    } else if (inPumpkin(p)) kit.tip('Pick Finger cut to draw, or tap a face part below!', icon('hand'));
  });
  let scoopPid = -1;
  kit.on(window, 'pointermove', (e) => {
    if (phase === 'seeds' && e.pointerId === scoopPid) scoop(kit.pt(e));
    if (cutting && cutting.pid === e.pointerId) {
      const p = kit.pt(e);
      const last = cutting.cut.pts[cutting.cut.pts.length - 1];
      if (dist(p, last) > 5 && inPumpkin(p) && p.y > LID_Y + 10) {
        cutting.cut.pts.push(p);
        drawHoles();
        if (Math.random() < 0.08) sound.click();
      }
    }
  });
  const upAll = (e: PointerEvent) => {
    if (e.pointerId === scoopPid) scoopPid = -1;
    if (cutting && cutting.pid === e.pointerId) cutting = null;
  };
  kit.on(window, 'pointerup', upAll);
  kit.on(window, 'pointercancel', upAll);

  trayGestures(kit, {
    tab(id) {
      tab = id;
      drawTray();
      carveTip();
    },
    tap(id) {
      if (phase !== 'carve') return;
      if (id === 'undo') {
        const h = hist.pop();
        if (!h) return;
        ({ stamps, cuts } = JSON.parse(h) as { stamps: Placed[]; cuts: Cut[] });
        sound.whoosh();
        drawHoles();
        return;
      }
      if (id.startsWith('w')) {
        cutW = Number(id.slice(1));
        sound.tap();
        drawTray();
        return;
      }
      if (id.startsWith('f-')) addFace(id);
      else if (STAMP_BY_ID[id]) addStamp(id);
    },
    drag(id, e) {
      if (phase !== 'carve' || !STAMP_BY_ID[id]) return;
      remember();
      const p = kit.pt(e);
      const st = { id: nextId++, s: id, x: p.x, y: p.y - 30 };
      stamps.push(st);
      drawHoles();
      drag.begin(e, st.id, { x: st.x, y: st.y });
      sound.pick();
    },
  });

  const fireflies = () => {
    let g = '';
    for (let i = 0; i < 16; i++) {
      const x = ((i * 523) % 1400) + 100;
      const y = 380 + ((i * 197) % 460);
      const path = `M0 0 q${rnd(-90, 90)} ${rnd(-70, 70)} ${rnd(-120, 120)} ${rnd(-50, 50)} t${rnd(-80, 80)} ${rnd(-60, 60)} T0 0`;
      g += at(x, y, `<g>${C(0, 0, 14, `url(#${ids}-fly)`)}${C(0, 0, 3.4, '#fffbd0')}<animateMotion path="${path}" dur="${f(rnd(6, 11))}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0.2;1;0" dur="${f(rnd(2.5, 4.5))}s" begin="-${f(rnd(0, 3))}s" repeatCount="indefinite"/></g>`);
    }
    kit.layer('fireflies').innerHTML = `<g pointer-events="none">${g}</g>`;
  };

  kit.reset.onclick = () => {
    sound.whoosh();
    start();
  };
  kit.done.onclick = () => {
    if (phase !== 'carve') return;
    if (!stamps.length && !cuts.length) {
      kit.tip('Carve a face first! Try Faces in the tray.', icon('star'));
      sound.boing();
      return;
    }
    phase = 'lit';
    kit.tip('');
    kit.tray.innerHTML = `<div class="sf-msg">${icon('bulb')}<span>Lighting the candle...</span></div>`;
    sound.whoosh();
    // the lid hops back on, then night falls and the candle glows
    const from = { ...lidPos };
    kit.tween(700, (t) => {
      const k = easeIO(t);
      lidPos = { x: from.x * (1 - k), y: from.y * (1 - k) - Math.sin(t * Math.PI) * 180, rot: from.rot * (1 - k), s: from.s + (1 - from.s) * k };
      drawLid();
    }, () => {
      lidOff = false;
      drawLid();
      sound.thud();
      kit.root.classList.add('sf-night');
      (kit.layer('night') as SVGGElement).style.opacity = '1';
      (kit.layer('nightpatch') as SVGGElement).style.opacity = '1';
      kit.tween(1200, (t) => {
        night = t;
        if (Math.round(t * 20) % 4 === 0) {
          drawBody();
          drawLid();
        }
      }, () => {
        night = 1;
        drawBody();
        drawLid();
        drawHoles();
        fireflies();
        sound.sparkle();
        sparkleAt(kit, [{ x: PX - 96, y: EYE_Y }, { x: PX + 96, y: EYE_Y }, { x: PX, y: MOUTH_Y }], 'sparkle', 14);
        kit.later(() => win(kit, { stat: 'pumpkin', coins: 20, title: 'Glowing pumpkin!', text: 'It smiles all night long.', again: 'Carve another', onAgain: start }), 500);
      });
    });
  };
  start();
}

function miniPumpkin(): string {
  return E(-34, 0, 34, 46, '#f07a1c', 'stroke="#d9561a" stroke-width="3"') + E(34, 0, 34, 46, '#f07a1c', 'stroke="#d9561a" stroke-width="3"') + E(0, 0, 36, 52, '#ff8c2a', 'stroke="#d9561a" stroke-width="3"') +
    P('M-5 -48 Q-6 -66 4 -72 L10 -68 Q4 -60 6 -48Z', '#7a5a2a') + E(-16, -56, 14, 7, '#6fbf5a', 'transform="rotate(-20 -16 -56)"') + E(-14, -22, 8, 16, '#fff', 'opacity="0.18"');
}

// ================================================================================================
// SPRING: egg hunt, then decorate an egg
// ================================================================================================
const EGG_COLS = ['#ffb3d1', '#c9b3ff', '#9fe3c9', '#ffe08a', '#9fd6ff', '#ffc8a8', '#ff9ec7', '#b6e36b', '#e3b3ff', '#8fe0f0', '#ffd0e4', '#fff0a0'];
const EGG_PATS = ['stripes', 'dots', 'zig', 'band', 'hearts', 'stars'];
function eggArt(i: number, rx = 24, ry = 31, golden = false): string {
  const id = uid('egg');
  const c = golden ? 'url(#g-gold)' : EGG_COLS[i % EGG_COLS.length];
  const c2 = golden ? '#fff6c0' : i % 3 === 0 ? '#ffffff' : light(EGG_COLS[(i + 5) % EGG_COLS.length], 0.2);
  const pat = golden ? 'stars' : EGG_PATS[i % EGG_PATS.length];
  let deco = '';
  if (pat === 'stripes') deco = [-0.45, 0, 0.45].map((k) => R(-rx, ry * k - ry * 0.09, rx * 2, ry * 0.18, 0, c2)).join('');
  if (pat === 'dots') deco = [[-0.4, -0.4], [0.35, -0.3], [0, 0.05], [-0.45, 0.45], [0.45, 0.45], [0, -0.75]].map(([x, y]) => C(rx * x, ry * y, rx * 0.16, c2)).join('');
  if (pat === 'zig') deco = L(Array.from({ length: 7 }, (_, k) => `${k ? 'L' : 'M'}${f(-rx + (k * rx) / 3)} ${f(k % 2 ? -ry * 0.1 : ry * 0.12)}`).join(' '), c2, ry * 0.12);
  if (pat === 'band') deco = R(-rx, -ry * 0.12, rx * 2, ry * 0.3, 0, c2) + [-0.5, 0, 0.5].map((x) => C(rx * x, ry * 0.03, rx * 0.1, EGG_COLS[(i + 2) % EGG_COLS.length])).join('');
  if (pat === 'hearts') deco = [[-0.35, -0.3], [0.35, 0.1], [-0.3, 0.5]].map(([x, y]) => P(heartD(rx * x, ry * y - ry * 0.12, rx * 0.36), c2)).join('');
  if (pat === 'stars') deco = [[-0.35, -0.35], [0.35, 0.05], [-0.25, 0.5], [0.1, -0.75]].map(([x, y]) => P(starD(rx * x, ry * y, rx * 0.22), c2)).join('');
  return `<defs><clipPath id="${id}"><path d="${eggD(0, 0, rx, ry)}"/></clipPath></defs>${P(eggD(0, 0, rx, ry), c, `stroke="${golden ? '#e0a11e' : dark(EGG_COLS[i % EGG_COLS.length], 0.18)}" stroke-width="2.5"`)}<g clip-path="url(#${id})">${deco}${E(0, ry * 0.85, rx * 1.1, ry * 0.35, '#000', 'opacity="0.07"')}</g>${E(-rx * 0.38, -ry * 0.45, rx * 0.2, ry * 0.26, '#fff', 'opacity="0.6" transform="rotate(18)"')}${
    golden ? P(sparkleD(rx * 0.7, -ry * 0.8, rx * 0.5), '#fff', '><animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite"/></path') : ''
  }`;
}

type HType = 'bush' | 'tulips' | 'pot' | 'can' | 'log' | 'mushroom' | 'daisy' | 'grass';
function hiderArt(t: HType, v: number): string {
  switch (t) {
    case 'bush': {
      const g1 = ['#6fcf73', '#7dd67a', '#62c46e'][v % 3];
      const g2 = dark(g1, 0.12);
      const fl = ['#ff9ec7', '#fff', '#c99bff'][v % 3];
      return E(0, -6, 120, 22, '#000', 'opacity="0.08"') + C(-70, -50, 54, g2) + C(70, -48, 56, g2) + C(-30, -92, 62, g1) + C(36, -96, 60, g1) + C(0, -46, 70, g1) + C(-84, -30, 40, g1) + C(86, -30, 40, g1) +
        C(-40, -112, 22, '#fff', 'opacity="0.16"') + [[-60, -70], [-10, -120], [40, -70], [76, -100], [-90, -40], [10, -40], [60, -30]].map(([x, y]) => flowerG(x, y, 12, fl)).join('');
    }
    case 'tulips': {
      const cols = [['#ff7eb6', '#c99bff', '#ffd36b', '#ff9ec7', '#ff7eb6'], ['#c99bff', '#ff9ec7', '#ffffff', '#c99bff', '#ffab5e']][v % 2];
      let g = E(0, -4, 90, 16, '#000', 'opacity="0.08"');
      [-60, -30, 0, 30, 60].forEach((x, i) => {
        const h = 110 + ((i * 37) % 40);
        g += L(`M${x} 0 Q${x + (i % 2 ? 8 : -8)} ${-h / 2} ${x} ${-h}`, '#4fae5a', 6);
      });
      g += P('M-90 0 Q-70 -80 -40 -90 Q-56 -40 -40 0Z', '#5fbf6a') + P('M90 0 Q70 -86 40 -96 Q56 -40 40 0Z', '#5fbf6a') + P('M-30 0 Q-10 -70 10 -76 Q0 -30 14 0Z', '#74c766');
      [-60, -30, 0, 30, 60].forEach((x, i) => {
        const h = 110 + ((i * 37) % 40);
        const c = cols[i];
        g += P(`M${x - 18} ${-h + 4} Q${x - 22} ${-h - 34} ${x - 10} ${-h - 36} L${x} ${-h - 22} L${x + 10} ${-h - 36} Q${x + 22} ${-h - 34} ${x + 18} ${-h + 4} Q${x} ${-h + 14} ${x - 18} ${-h + 4}Z`, c, `stroke="${dark(c, 0.15)}" stroke-width="2"`) + E(x - 7, -h - 14, 4, 10, '#fff', 'opacity="0.45"');
      });
      return g;
    }
    case 'pot':
      return E(0, -2, 70, 12, '#000', 'opacity="0.1"') + C(-34, -120, 34, '#7dd67a') + C(30, -126, 36, '#6fcf73') + C(0, -150, 34, '#7dd67a') + flowerG(-30, -130, 18, '#ff9ec7') + flowerG(28, -140, 18, '#ffd36b') + flowerG(0, -168, 16, '#c99bff') +
        P('M-62 -96 L62 -96 L48 0 L-48 0Z', '#ff9ec7') + R(-70, -110, 140, 26, 10, '#ff7eb6') + P(heartD(0, -64, 22), '#fff', 'opacity="0.8"');
    case 'can':
      return E(0, -2, 80, 12, '#000', 'opacity="0.1"') + P('M44 -70 L110 -110 L118 -98 L54 -50Z', '#5fd3b5') + E(116, -106, 10, 16, '#3fbf9f', 'transform="rotate(-30 116 -106)"') + R(-56, -100, 112, 100, 22, '#7fe0c4') +
        L('M-40 -96 Q0 -150 40 -96', '#5fd3b5', 10) + R(-56, -40, 112, 14, 0, '#fff', 'opacity="0.5"') + C(-20, -66, 9, '#fff', 'opacity="0.6"') + flowerG(16, -66, 12, '#ff9ec7');
    case 'log':
      return E(0, -2, 120, 14, '#000', 'opacity="0.1"') + R(-110, -86, 200, 84, 40, '#b8845a') + L('M-80 -60 L40 -60 M-70 -30 L60 -30', '#a06c44', 4) + E(90, -44, 30, 42, '#d8a878') + E(90, -44, 20, 30, '#4a2c1c') + E(90, -44, 10, 16, '#2e1a10') +
        P('M-60 -86 Q-50 -120 -30 -100 Q-40 -86 -60 -86Z', '#6fcf73') + C(-20, -94, 10, '#ff9ec7') + C(-4, -90, 7, '#fff');
    case 'mushroom':
      return E(0, -2, 70, 12, '#000', 'opacity="0.1"') + R(-24, -80, 48, 80, 18, '#fff3e6') + P('M-90 -70 Q-90 -170 0 -170 Q90 -170 90 -70 Q0 -54 -90 -70Z', '#ff7eb6') +
        C(-44, -116, 14, '#fff') + C(20, -140, 12, '#fff') + C(52, -98, 10, '#fff') + C(-10, -96, 9, '#fff') + C(-14, -36, 4, '#e8c4a8') + C(10, -50, 3, '#e8c4a8');
    case 'daisy': {
      let g = E(0, -2, 70, 12, '#000', 'opacity="0.08"');
      [[-40, 150, -6], [10, 190, 4], [50, 140, 10]].forEach(([x, h, b]) => (g += L(`M${x} 0 Q${x + b} ${-h / 2} ${x} ${-h}`, '#4fae5a', 6)));
      g += P('M-70 0 Q-60 -70 -20 -80 Q-36 -30 -24 0Z', '#5fbf6a') + P('M70 0 Q60 -76 24 -84 Q36 -30 24 0Z', '#5fbf6a');
      [[-40, -150, 30], [10, -190, 34], [50, -140, 28]].forEach(([x, y, r]) => {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2;
          g += E(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.2, '#fff', `stroke="#f0e6f6" stroke-width="1.5" transform="rotate(${f((a * 180) / Math.PI)} ${f(x + Math.cos(a) * r * 0.62)} ${f(y + Math.sin(a) * r * 0.62)})"`);
        }
        g += C(x, y, r * 0.32, '#ffd36b');
      });
      return g;
    }
    case 'grass': {
      let g = E(0, -2, 90, 12, '#000', 'opacity="0.08"');
      for (let k = 0; k < 13; k++) {
        const x = -80 + k * 13;
        const h = 70 + ((k * 29) % 50);
        g += P(`M${x - 8} 0 Q${x - 4} ${-h * 0.6} ${x + (k % 2 ? 14 : -12)} ${-h} Q${x + 4} ${-h * 0.5} ${x + 8} 0Z`, k % 3 ? '#62c46e' : '#4fae5a');
      }
      return g + flowerG(-40, -70, 10, '#fff') + flowerG(36, -84, 10, '#ff9ec7');
    }
  }
}
const HIDERS: { t: HType; x: number; y: number; s: number; w: number; h: number }[] = [
  { t: 'bush', x: 320, y: 610, s: 0.95, w: 130, h: 160 },
  { t: 'bush', x: 790, y: 575, s: 0.8, w: 130, h: 160 },
  { t: 'bush', x: 1240, y: 612, s: 1.0, w: 130, h: 160 },
  { t: 'tulips', x: 560, y: 650, s: 0.95, w: 90, h: 160 },
  { t: 'daisy', x: 1030, y: 640, s: 0.9, w: 80, h: 210 },
  { t: 'can', x: 1320, y: 735, s: 0.95, w: 90, h: 120 },
  { t: 'pot', x: 880, y: 730, s: 0.95, w: 70, h: 180 },
  { t: 'log', x: 640, y: 770, s: 1.0, w: 120, h: 100 },
  { t: 'mushroom', x: 280, y: 800, s: 0.9, w: 90, h: 170 },
  { t: 'tulips', x: 1170, y: 790, s: 1.05, w: 90, h: 170 },
  { t: 'bush', x: 470, y: 900, s: 1.15, w: 130, h: 160 },
  { t: 'grass', x: 1330, y: 900, s: 1.1, w: 90, h: 110 },
  { t: 'bush', x: 1000, y: 905, s: 1.1, w: 130, h: 160 },
  { t: 'grass', x: 760, y: 905, s: 1.0, w: 90, h: 110 },
];

// the same garden laid out in more rows for tall (portrait) screens
const HIDERS_TALL: typeof HIDERS = [
  { t: 'bush', x: 480, y: 330, s: 0.8, w: 130, h: 160 },
  { t: 'daisy', x: 760, y: 320, s: 0.8, w: 80, h: 210 },
  { t: 'bush', x: 1090, y: 335, s: 0.8, w: 130, h: 160 },
  { t: 'tulips', x: 570, y: 480, s: 0.9, w: 90, h: 160 },
  { t: 'pot', x: 870, y: 470, s: 0.85, w: 70, h: 180 },
  { t: 'can', x: 1110, y: 490, s: 0.85, w: 90, h: 120 },
  { t: 'mushroom', x: 450, y: 630, s: 0.85, w: 90, h: 170 },
  { t: 'log', x: 760, y: 630, s: 0.95, w: 120, h: 100 },
  { t: 'tulips', x: 1080, y: 640, s: 1.0, w: 90, h: 170 },
  { t: 'bush', x: 560, y: 780, s: 1.0, w: 130, h: 160 },
  { t: 'grass', x: 900, y: 770, s: 1.0, w: 90, h: 110 },
  { t: 'grass', x: 430, y: 905, s: 0.9, w: 90, h: 110 },
  { t: 'bush', x: 1100, y: 905, s: 1.05, w: 130, h: 160 },
  { t: 'grass', x: 760, y: 905, s: 1.0, w: 90, h: 110 },
];

const EGG_STICKERS: { id: string; art: string }[] = [
  { id: 'heart', art: P(heartD(0, -26, 40), '#ff4f8b') + C(-12, -14, 5, '#fff', 'opacity="0.6"') },
  { id: 'star', art: P(starD(0, 2, 34, 0.48), 'url(#g-gold)', 'stroke="#e0a11e" stroke-width="2.5"') },
  { id: 'flower', art: flowerG(0, 0, 34, '#ff9ec7') },
  { id: 'chick', art: C(0, 4, 26, '#ffe066') + C(-14, -20, 16, '#ffe066') + C(-18, -24, 3, '#3a3546') + P('M-32 -20 L-42 -16 L-32 -12Z', '#ffab5e') + P('M2 0 Q16 -10 22 8 Q10 6 2 0Z', '#ffd02e') + E(-8, -14, 4, 2.6, '#ff9ec7', 'opacity="0.8"') },
  { id: 'bunny', art: E(-12, -34, 8, 22, '#fff', 'stroke="#f0d6e6" stroke-width="2"') + E(12, -34, 8, 22, '#fff', 'stroke="#f0d6e6" stroke-width="2"') + E(-12, -34, 4, 15, '#ffc2dc') + E(12, -34, 4, 15, '#ffc2dc') + C(0, 0, 26, '#fff', 'stroke="#f0d6e6" stroke-width="2"') + C(-9, -4, 3.2, '#3a3546') + C(9, -4, 3.2, '#3a3546') + P(heartD(0, 2, 6), '#ff7eb6') + E(-16, 6, 5, 3, '#ff9ec7', 'opacity="0.7"') + E(16, 6, 5, 3, '#ff9ec7', 'opacity="0.7"') },
  { id: 'butterfly', art: E(-16, -10, 16, 20, '#c99bff', 'transform="rotate(-20 -16 -10)"') + E(16, -10, 16, 20, '#c99bff', 'transform="rotate(20 16 -10)"') + E(-12, 14, 11, 13, '#ff9ec7') + E(12, 14, 11, 13, '#ff9ec7') + C(-16, -12, 5, '#fff', 'opacity="0.7"') + C(16, -12, 5, '#fff', 'opacity="0.7"') + R(-3, -22, 6, 44, 3, '#5a2a4a') + L('M-2 -22 l-6 -10 M2 -22 l6 -10', '#5a2a4a', 2.5) },
  { id: 'bow', art: bowG(0, -4, 1.6, '#7cc8ff') },
  { id: 'sparkle', art: P(sparkleD(0, 0, 32), '#fff', 'stroke="#ffd36b" stroke-width="3"') + P(sparkleD(22, -22, 10), '#ffe680') },
];
const PAINTS = ['#ff7eb6', '#ff4f8b', '#ffb3d1', '#c99bff', '#9b6bff', '#7cc8ff', '#5fd3b5', '#b6e36b', '#ffd36b', '#ffab5e', '#ffffff', '#5a2a4a'];

export function openEggHunt(onClose: () => void): void {
  const kit = makeKit('sf-egg', 'Egg Hunt', (tall) => (tall ? [370, 200, 1230, 910] : [170, 380, 1430, 910]), onClose);
  const ids = uid('eh');
  const HS = kit.tall ? HIDERS_TALL : HIDERS;
  const HOR = kit.tall ? 190 : 450;
  const HUNT_S = 90;
  const N = 12;
  type Spot = { egg: number; golden: boolean; peek: number; found: boolean };
  let spots: Spot[] = [];
  let found = 0;
  let goldFound = false;
  let left = HUNT_S;
  let lastFind = 0;
  let phase: 'hunt' | 'result' | 'decorate' | 'done' = 'hunt';

  const scenery = landscape('spring', HOR, { trees: kit.tall ? [260, 1340] : [-160, 60, 1560, 1800], sunX: kit.tall ? 1120 : 1300 }) + ground('spring', HOR) + picketFence(HOR + 70, -600, 2200, '#ffffff') +
    // a stepping-stone path
    (kit.tall ? [] : [[700, 560], [740, 610], [690, 680], [760, 740], [700, 820]]).map(([x, y], i) => E(x, y, 34 + i * 4, 12 + i * 2, '#f6efe6', 'stroke="#e6d8c8" stroke-width="3"')).join('');
  kit.svg.innerHTML = `<g>${scenery}</g><g class="sf-l-hiders"></g><g class="sf-l-deco"></g>${fallingBits('petal', 16, -400, 2000, -60, 920)}`;

  const bunny = () => `<g data-bunny transform="translate(${f(HS[2].x - 80 * HS[2].s)} ${f(HS[2].y - 142 * HS[2].s)}) scale(${HS[2].s})"><g><animateTransform attributeName="transform" type="translate" values="0 30;0 0;0 0;0 30;0 30" keyTimes="0;0.15;0.6;0.75;1" dur="5s" repeatCount="indefinite"/>
    <g><animateTransform attributeName="transform" type="rotate" values="0 0 -40;-8 0 -40;0 0 -40" dur="1.2s" repeatCount="indefinite"/>${E(-16, -64, 11, 34, '#fff', 'stroke="#efd9e8" stroke-width="2"')}${E(-16, -64, 5, 24, '#ffc2dc')}</g>${E(16, -66, 11, 34, '#fff', 'stroke="#efd9e8" stroke-width="2"')}${E(16, -66, 5, 24, '#ffc2dc')}
    ${C(0, -10, 36, '#fff', 'stroke="#efd9e8" stroke-width="2"')}${C(-12, -16, 4.5, '#3a3546')}${C(12, -16, 4.5, '#3a3546')}${C(-11, -18, 1.5, '#fff')}${C(13, -18, 1.5, '#fff')}${P(heartD(0, -8, 8), '#ff7eb6')}${E(-22, -2, 7, 4, '#ff9ec7', 'opacity="0.7"')}${E(22, -2, 7, 4, '#ff9ec7', 'opacity="0.7"')}</g>${C(0, -20, 60, 'transparent')}</g>`;

  const spotArt = (i: number) => {
    const h = HS[i];
    const s = spots[i];
    let egg = '';
    if (s && s.egg >= 0 && !s.found) {
      const side = i % 2 ? 1 : -1;
      const ex = s.peek ? side * (h.w * 0.92) : side * 20;
      const ey = s.peek ? -26 : -h.h * 0.32;
      egg = `<g data-egg="${i}" transform="translate(${f(ex)} ${f(ey)}) rotate(${side * (s.peek ? 14 : 6)})">${eggArt(s.egg, 24, 31, s.golden)}</g>`;
    }
    return `<g data-h="${i}" transform="translate(${h.x} ${h.y}) scale(${h.s})">${egg}<g class="sf-hart">${hiderArt(h.t, i)}</g>${R(-h.w - 10, -h.h - 20, (h.w + 10) * 2, h.h + 30, 30, 'transparent')}</g>`;
  };
  const drawHiders = () => {
    // the bunny peeks out from behind the third bush, so draw it just before that bush
    kit.layer('hiders').innerHTML = HS.map((_, i) => (i === 2 ? bunny() : '') + spotArt(i)).join('');
  };

  const basketSvg = () => {
    const eggs = [];
    for (let k = 0; k < Math.min(found + (goldFound ? 1 : 0), 13); k++) {
      const row = k < 6 ? 0 : k < 11 ? 1 : 2;
      const inRow = row === 0 ? k : row === 1 ? k - 6 : k - 11;
      const x = row === 0 ? -50 + inRow * 20 : row === 1 ? -40 + inRow * 20 : -10 + inRow * 20;
      eggs.push(at(x, -16 - row * 11, eggArt(k, 11, 14, goldFound && k === found + (goldFound ? 1 : 0) - 1), ` rotate(${(k % 3) * 8 - 8})`));
    }
    return `<svg viewBox="-80 -60 160 100" class="sf-basket">${L('M-56 -6 Q0 -84 56 -6', '#c98a5a', 8)}${eggs.join('')}${P('M-70 -10 L70 -10 L56 34 Q0 44 -56 34Z', '#e8b07a')}${L('M-66 4 L66 4 M-62 18 L62 18', '#c98a5a', 4)}${R(-74, -16, 148, 14, 7, '#d99a62')}${P(heartD(0, 6, 14), '#ff7eb6')}</svg>`;
  };
  const timerSvg = () => {
    const k = left / HUNT_S;
    const len = 2 * Math.PI * 30;
    return `<svg viewBox="-42 -42 84 84" class="sf-timer">${C(0, 0, 38, '#fff')}${C(0, 0, 30, 'none', 'stroke="#ffe9a8" stroke-width="10"')}${C(0, 0, 30, 'none', `stroke="#ffc531" stroke-width="10" stroke-linecap="round" stroke-dasharray="${f(len * k)} ${f(len)}" transform="rotate(-90)"`)}${flowerG(0, 0, 18, '#ff9ec7')}</svg>`;
  };
  const drawHuntTray = () => {
    kit.tray.innerHTML = `<div class="sf-hunt">${timerSvg()}${basketSvg()}<div class="sf-count">${found}<small>of ${N} eggs${goldFound ? ' + gold!' : ''}</small></div></div>`;
  };
  const updateTimer = () => {
    const t = kit.tray.querySelector('.sf-timer');
    if (t) t.outerHTML = timerSvg();
  };

  const tick = () => {
    if (phase !== 'hunt') return;
    left--;
    updateTimer();
    if (left === 10) kit.tip('Just a little more time!', icon('star'));
    if (HUNT_S - left - lastFind > 14) {
      hint();
      lastFind = HUNT_S - left;
    }
    if (left <= 0) endHunt();
    else kit.later(tick, 1000);
  };
  const hint = () => {
    const open = spots.map((s, i) => (s.egg >= 0 && !s.found ? i : -1)).filter((i) => i >= 0);
    if (!open.length) return;
    const i = pick(open);
    const g = kit.svg.querySelector(`[data-h="${i}"] .sf-hart`);
    g?.classList.remove('sf-hint');
    void (g as SVGGElement | null)?.getBoundingClientRect();
    g?.classList.add('sf-hint');
    const h = HS[i];
    sparkleAt(kit, [{ x: h.x, y: h.y - h.h * h.s * 0.6 }], 'sparkle', 10);
  };

  const start = () => {
    kit.stop();
    phase = 'hunt';
    found = 0;
    goldFound = false;
    left = HUNT_S;
    lastFind = 0;
    kit.layer('deco').innerHTML = '';
    // 12 eggs and a golden one in 13 of the 14 hiding spots; about a third of them peek out
    const order = HS.map((_, i) => i).sort(() => Math.random() - 0.5);
    spots = HS.map(() => ({ egg: -1, golden: false, peek: 0, found: false }));
    order.slice(0, N + 1).forEach((si, k) => (spots[si] = { egg: k, golden: k === N, peek: k < 5 && k !== N ? 1 : 0, found: false }));
    drawHiders();
    drawHuntTray();
    kit.done.disabled = false;
    kit.done.querySelector('span')!.textContent = 'Done!';
    kit.tip('Find the hidden eggs! Tap the bushes and flowers.', icon('flower'));
    kit.later(tick, 1000);
  };

  const flyEgg = (i: number) => {
    const s = spots[i];
    const node = kit.svg.querySelector(`[data-egg="${i}"]`) as SVGGElement | null;
    const r = node?.getBoundingClientRect();
    const basket = kit.tray.querySelector('.sf-basket')?.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'sf-fly';
    fly.innerHTML = `<svg viewBox="-30 -38 60 76">${eggArt(s.egg, 24, 31, s.golden)}</svg>`;
    const sx = r ? r.left + r.width / 2 : innerWidth / 2;
    const sy = r ? r.top + r.height / 2 : innerHeight / 2;
    fly.style.left = sx + 'px';
    fly.style.top = sy + 'px';
    document.body.appendChild(fly);
    s.found = true;
    node?.remove();
    burst('sparkle', sx, sy, s.golden ? 24 : 10);
    const tx = (basket ? basket.left + basket.width / 2 : innerWidth / 2) - sx;
    const ty = (basket ? basket.top + basket.height / 3 : innerHeight - 60) - sy;
    const anim = fly.animate(
      [
        { transform: 'translate(0,0) scale(0.8) rotate(0deg)' },
        { transform: `translate(${tx * 0.15}px, -90px) scale(1.4) rotate(-12deg)`, offset: 0.35 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.5) rotate(10deg)` },
      ],
      { duration: 900, easing: 'cubic-bezier(.4,0,.4,1)' },
    );
    anim.onfinish = () => {
      fly.remove();
      if (!kit.alive() || phase !== 'hunt') return;
      if (s.golden) goldFound = true;
      else found++;
      drawHuntTray();
      kit.tray.querySelector('.sf-basket')?.classList.add('bump');
      sound.coin();
      if (found >= N && goldFound) kit.later(endHunt, 400);
    };
    if (s.golden) {
      sound.sparkle();
      kit.tip('The GOLDEN egg! Bonus coins!', icon('star'));
    } else {
      sound.pop();
      const n = found + 1;
      kit.tip(n === 1 ? 'You found one! Keep looking.' : n === 6 ? 'Halfway! You are a great egg finder.' : n >= N - 1 ? 'Almost all of them!' : `${n} eggs!`, icon('heart'));
    }
    lastFind = HUNT_S - left;
  };

  const tapSpot = (i: number) => {
    const s = spots[i];
    const art = kit.svg.querySelector(`[data-h="${i}"] .sf-hart`);
    art?.classList.remove('sf-rustle', 'sf-hint');
    void (art as SVGGElement | null)?.getBoundingClientRect();
    art?.classList.add('sf-rustle');
    if (s.egg >= 0 && !s.found) {
      sound.whoosh();
      flyEgg(i);
    } else {
      sound.squeak();
      const h = HS[i];
      sparkleAt(kit, [{ x: h.x, y: h.y - h.h * h.s * 0.6 }], 'bubble', 5);
    }
  };

  const endHunt = () => {
    if (phase !== 'hunt') return;
    phase = 'result';
    kit.stop();
    kit.tip('');
    const coins = found + (goldFound ? 5 : 0);
    G.bump('eggHunt');
    G.bump('seasonFun');
    if (goldFound) G.bump('goldenEgg');
    if (coins) G.earn(coins, { x: innerWidth / 2, y: innerHeight - 120 });
    sound.applause();
    sparkleAt(kit, [{ x: 800, y: 500 }], 'confetti', 40);
    kit.done.disabled = true;
    const text = found === N ? 'You found every single egg!' : found === 0 ? 'The bunny hid them well! The eggs say hi.' : `You found ${found} egg${found === 1 ? '' : 's'}${found >= 8 ? '. Amazing!' : '. Great hunting!'}`;
    card(kit, goldFound ? 'Golden hunter!' : 'Hooray!', text + (goldFound ? ' And the golden egg!' : ''), coins, [
      { label: 'Hunt again', art: RESET_SVG, on: start },
      { label: 'Decorate an egg', art: icon('paint'), primary: true, on: decorate },
    ]);
  };

  // ---------------- decorating one big egg ----------------
  const EX = 800;
  const EY = 446;
  const ERX = 182;
  const ERY = 238;
  type Mark = { t: 'paint' | 'dots'; c: string; pts: Pt[] } | { t: 'stripe' | 'zig'; c: string; y: number };
  type Stk = { id: number; s: string; x: number; y: number; r: number };
  let base = '#ffd9e8';
  let marks: Mark[] = [];
  let stickers: Stk[] = [];
  let hist: string[] = [];
  let tool = 'paint';
  let color = PAINTS[0];
  let nextId = 1;
  const inEgg = (p: Pt) => p.y > EY - ERY && p.y < EY + ERY && Math.abs(p.x - EX) < eggHalf(EX, EY, ERX, ERY, p.y);
  const markArt = (m: Mark) => {
    if ('pts' in m) return m.t === 'paint' ? L(smoothD(m.pts), m.c, 20) : m.pts.map((p) => C(p.x, p.y, 12, m.c)).join('');
    if (m.t === 'stripe') return R(EX - ERX - 10, m.y - 16, ERX * 2 + 20, 32, 0, m.c);
    let d = '';
    for (let k = 0; k <= 14; k++) d += `${k ? 'L' : 'M'}${f(EX - ERX - 10 + k * ((ERX * 2 + 20) / 14))} ${f(m.y + (k % 2 ? -16 : 16))}`;
    return L(d, m.c, 13);
  };
  const drawEgg = () => {
    kit.layer('deco').innerHTML = `<defs><clipPath id="${ids}-egg"><path d="${eggD(EX, EY, ERX, ERY)}"/></clipPath></defs>
      ${E(EX, EY + ERY + 40, 270, 40, '#000', 'opacity="0.1"')}
      ${E(EX, EY + ERY - 34, 236, 46, '#b07848')}${E(EX, EY + ERY - 30, 214, 34, '#8a5a34')}
      ${P(eggD(EX, EY, ERX, ERY), base, `stroke="${dark(base, 0.15)}" stroke-width="5"`)}
      <g clip-path="url(#${ids}-egg)" class="sf-l-marks">${marks.map(markArt).join('')}${E(EX + 40, EY + ERY * 0.9, ERX * 1.2, ERY * 0.35, '#000', 'opacity="0.06"')}</g>
      ${E(EX - 70, EY - 110, 30, 46, '#fff', 'opacity="0.45" transform="rotate(20 730 360)"')}
      <g class="sf-l-stk">${stickers.map(stkArt).join('')}</g>
      ${nest()}`;
  };
  const stkArt = (s: Stk) => `<g data-stk="${s.id}" transform="translate(${f(s.x)} ${f(s.y)}) rotate(${f(s.r)})"><g transform="scale(1.35)">${EGG_STICKERS.find((x) => x.id === s.s)!.art}</g>${C(0, 0, 50, 'transparent')}</g>`;
  const nest = () => {
    const top = EY + ERY - 34;
    let g = P(`M${EX - 238} ${top} Q${EX - 236} ${top + 96} ${EX} ${top + 102} Q${EX + 236} ${top + 96} ${EX + 238} ${top} Q${EX} ${top + 52} ${EX - 238} ${top}Z`, '#e0b07a', 'stroke="#c98a5a" stroke-width="4"');
    for (let k = 0; k < 15; k++) {
      const x = EX - 220 + k * 31;
      const y = top + 26 + Math.abs(k - 7) * -2.2 + (k % 3) * 12;
      g += L(`M${x} ${y} q16 ${k % 2 ? 16 : -10} 34 ${k % 2 ? 2 : 12}`, k % 2 ? '#c98a5a' : '#f6d6a0', 5);
    }
    return g + [[-196, 14], [196, 14], [-90, 52], [90, 52], [0, 62]].map(([x, y], k) => flowerG(EX + x, top + y, 17, ['#ff9ec7', '#fff', '#c99bff', '#ffd36b', '#ff9ec7'][k])).join('');
  };
  const DEC_TABS = [
    { id: 'dip', label: 'Color', art: thumb(P(eggD(0, 0, 20, 26), '#ff9ec7', 'stroke="#e0457b" stroke-width="2"'), '-32 -32 64 64') },
    { id: 'paint', label: 'Brush', art: icon('paint') },
    { id: 'stripe', label: 'Stripes', art: thumb(`<g clip-path="none">${P(eggD(0, 0, 20, 26), '#c99bff')}${R(-20, -12, 40, 7, 0, '#fff')}${R(-20, 4, 40, 7, 0, '#fff')}</g>`, '-32 -32 64 64') },
    { id: 'zig', label: 'Zigzag', art: thumb(P(eggD(0, 0, 20, 26), '#9fe3c9') + L('M-19 0 L-12 -6 L-4 4 L4 -6 L12 4 L19 -4', '#fff', 4), '-32 -32 64 64') },
    { id: 'dots', label: 'Dots', art: thumb(P(eggD(0, 0, 20, 26), '#ffe08a') + C(-8, -8, 4, '#fff') + C(8, 2, 4, '#fff') + C(-6, 12, 4, '#fff') + C(6, -16, 3, '#fff'), '-32 -32 64 64') },
    { id: 'sticker', label: 'Stickers', art: thumb(EGG_STICKERS[4].art, '-40 -62 80 100') },
  ];
  const drawDecTray = () => {
    const items = tool === 'sticker'
      ? EGG_STICKERS.map((s) => itemBtn(`s:${s.id}`, thumb(s.art, '-44 -60 88 104'))).join('')
      : PAINTS.map((c) => colorBtn(`c:${c}`, c, tool === 'dip' ? c === base : c === color)).join('');
    kit.tray.innerHTML = tabsHTML(DEC_TABS, tool) + `<div class="sf-items">${items}${undoBtn()}</div>`;
  };
  const decTip = () => kit.tip(
    { dip: 'Tap a color to dip the whole egg!', paint: 'Paint on the egg with your finger!', stripe: 'Tap the egg to add a stripe.', zig: 'Tap the egg to add a zigzag.', dots: 'Draw with your finger to make polka dots!', sticker: 'Tap a sticker, then drag it around.' }[tool] ?? '',
    icon(tool === 'sticker' ? 'heart' : 'paint'),
  );
  const remember = () => {
    hist.push(JSON.stringify({ base, marks, stickers }));
    if (hist.length > 50) hist.shift();
  };
  const decorate = () => {
    phase = 'decorate';
    base = pick(['#ffd9e8', '#e9ddff', '#d9f6ec', '#fff3c4', '#dcefff']);
    marks = [];
    stickers = [];
    hist = [];
    tool = 'stripe';
    color = PAINTS[0];
    kit.layer('hiders').innerHTML = '';
    drawEgg();
    drawDecTray();
    decTip();
    kit.done.disabled = false;
    kit.done.querySelector('span')!.textContent = 'Done!';
    sound.sparkle();
  };

  let painting: { pid: number; m: Mark } | null = null;
  const drag = tracker(kit, {
    move(id, p) {
      const s = stickers.find((q) => q.id === id);
      if (s) {
        s.x = p.x;
        s.y = p.y;
        kit.svg.querySelector(`[data-stk="${id}"]`)?.setAttribute('transform', `translate(${f(s.x)} ${f(s.y)}) rotate(${f(s.r)})`);
      }
    },
    end(id, p, _e, toTray) {
      const s = stickers.find((q) => q.id === id);
      if (!s) return;
      if (toTray || !inEgg(p)) {
        stickers = stickers.filter((q) => q !== s);
        sound.pop();
        drawEgg();
      } else sound.drop();
    },
  });
  const redrawMarks = () => {
    const g = kit.svg.querySelector('.sf-l-marks');
    if (g) g.innerHTML = marks.map(markArt).join('') + E(EX + 40, EY + ERY * 0.9, ERX * 1.2, ERY * 0.35, '#000', 'opacity="0.06"');
  };

  kit.on(kit.svg, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (phase === 'hunt') {
      if (t.closest('[data-bunny]')) {
        sound.giggle();
        kit.tip('The bunny says: look over there!', icon('heart'));
        hint();
        return;
      }
      const eg = t.closest('[data-egg]');
      const g = t.closest('[data-h]');
      const i = eg ? Number(eg.getAttribute('data-egg')) : g ? Number(g.getAttribute('data-h')) : -1;
      if (i >= 0) tapSpot(i);
      return;
    }
    if (phase !== 'decorate') return;
    const st = t.closest('[data-stk]');
    if (st) {
      const s = stickers.find((q) => q.id === Number(st.getAttribute('data-stk')));
      if (s) {
        remember();
        drag.begin(e, s.id, { x: s.x, y: s.y });
        sound.pick();
      }
      return;
    }
    const p = kit.pt(e);
    if (!inEgg(p)) return;
    if (tool === 'paint' || tool === 'dots') {
      remember();
      painting = { pid: e.pointerId, m: { t: tool, c: color, pts: [p] } };
      marks.push(painting.m);
      redrawMarks();
      sound.spray();
    } else if (tool === 'stripe' || tool === 'zig') {
      remember();
      painting = { pid: e.pointerId, m: { t: tool, c: color, y: p.y } };
      marks.push(painting.m);
      redrawMarks();
      sound.pop();
    } else if (tool === 'dip') kit.tip('Tap a color below to dip the egg!', icon('paint'));
    else kit.tip('Tap a sticker below to add it!', icon('heart'));
  });
  kit.on(window, 'pointermove', (e) => {
    if (!painting || painting.pid !== e.pointerId) return;
    const p = kit.pt(e);
    const m = painting.m;
    if ('y' in m) m.y = clamp(p.y, EY - ERY, EY + ERY);
    else {
      const last = m.pts[m.pts.length - 1];
      if (dist(p, last) < (m.t === 'dots' ? 34 : 5)) return;
      m.pts.push(p);
      if (m.t === 'dots') sound.click();
    }
    redrawMarks();
  });
  const up = (e: PointerEvent) => {
    if (painting && painting.pid === e.pointerId) painting = null;
  };
  kit.on(window, 'pointerup', up);
  kit.on(window, 'pointercancel', up);

  trayGestures(kit, {
    tab(id) {
      tool = id;
      drawDecTray();
      decTip();
    },
    tap(id) {
      if (phase !== 'decorate') return;
      if (id === 'undo') {
        const h = hist.pop();
        if (!h) return;
        ({ base, marks, stickers } = JSON.parse(h) as { base: string; marks: Mark[]; stickers: Stk[] });
        sound.whoosh();
        drawEgg();
        drawDecTray();
        return;
      }
      if (id.startsWith('c:')) {
        const c = id.slice(2);
        if (tool === 'dip') {
          remember();
          base = c;
          sound.spray();
          drawEgg();
        } else {
          color = c;
          sound.tap();
          if (tool === 'sticker') tool = 'paint';
        }
        drawDecTray();
        return;
      }
      if (id.startsWith('s:')) {
        remember();
        const a = rnd(0, Math.PI * 2);
        const r = rnd(0, 0.55);
        stickers.push({ id: nextId++, s: id.slice(2), x: EX + Math.cos(a) * ERX * r, y: EY + 10 + Math.sin(a) * ERY * r, r: rnd(-15, 15) });
        sound.pop();
        drawEgg();
      }
    },
    drag(id, e) {
      if (phase !== 'decorate' || !id.startsWith('s:')) return;
      remember();
      const p = kit.pt(e);
      const s = { id: nextId++, s: id.slice(2), x: p.x, y: p.y - 30, r: rnd(-15, 15) };
      stickers.push(s);
      drawEgg();
      drag.begin(e, s.id, { x: s.x, y: s.y });
      sound.pick();
    },
  });

  kit.reset.onclick = () => {
    sound.whoosh();
    if (phase === 'decorate' || phase === 'done') {
      decorate();
      return;
    }
    start();
  };
  kit.done.onclick = () => {
    if (phase === 'hunt') {
      endHunt();
      return;
    }
    if (phase !== 'decorate') return;
    phase = 'done';
    kit.tip('');
    const g = kit.layer('deco');
    g.classList.remove('sf-wiggle');
    void g.getBoundingClientRect();
    g.classList.add('sf-wiggle');
    sparkleAt(kit, [{ x: EX, y: EY - ERY }, { x: EX - ERX, y: EY }, { x: EX + ERX, y: EY }], 'sparkle', 16);
    kit.later(() => win(kit, { stat: 'eggDecorated', fun: false, coins: 15, title: 'What a pretty egg!', text: 'The bunny loves it!', again: 'Hunt again', onAgain: start }), 600);
  };
  start();
}

// ================================================================================================
// SUMMER: build a sandcastle
// ================================================================================================
type Mold = 'round' | 'square' | 'tower' | 'cone';
const MOLDS: Record<Mold, { w: number; h: number; bucket: string }> = {
  round: { w: 132, h: 84, bucket: '#ff7eb6' },
  square: { w: 124, h: 96, bucket: '#5fd3b5' },
  tower: { w: 88, h: 150, bucket: '#c99bff' },
  cone: { w: 100, h: 124, bucket: '#ffd36b' },
};
const SAND = '#f4c77c';
const SAND_L = '#ffe2a8';
const SAND_D = '#d9a55b';
function moldArt(k: Mold, ghost = false): string {
  const { w, h } = MOLDS[k];
  const hw = w / 2;
  let body = '';
  let ridge = '';
  if (k === 'round') {
    body = `M${-hw} 0 L${-hw * 0.94} ${-h * 0.4} Q${-hw * 0.86} ${-h} 0 ${-h} Q${hw * 0.86} ${-h} ${hw * 0.94} ${-h * 0.4} L${hw} 0Z`;
    ridge = [-0.5, 0, 0.5].map((x) => L(`M${hw * x} -4 Q${hw * x * 1.05} ${-h * 0.6} ${hw * x * 0.7} ${-h * 0.92}`, SAND_D, 3, 'opacity="0.45"')).join('');
  } else if (k === 'square') {
    const t = hw * 0.9;
    body = `M${-hw} 0 L${-t} ${-h} L${-t} ${-h - 20} L${-t * 0.5} ${-h - 20} L${-t * 0.5} ${-h} L${t * -0.15} ${-h} L${t * -0.15} ${-h - 20} L${t * 0.15} ${-h - 20} L${t * 0.15} ${-h} L${t * 0.5} ${-h} L${t * 0.5} ${-h - 20} L${t} ${-h - 20} L${t} ${-h} L${hw} 0Z`;
    ridge = P(`M-14 -8 L-14 -40 Q0 -58 14 -40 L14 -8Z`, '#b9844a') + L(`M${-hw * 0.96} ${-h * 0.5} L${hw * 0.96} ${-h * 0.5}`, SAND_D, 3, 'opacity="0.4"');
  } else if (k === 'tower') {
    const t = hw * 0.92;
    body = `M${-hw} 0 L${-t} ${-h} L${-t - 6} ${-h - 4} L${-t - 6} ${-h - 24} L${-t * 0.35} ${-h - 24} L${-t * 0.35} ${-h - 10} L${t * 0.35} ${-h - 10} L${t * 0.35} ${-h - 24} L${t + 6} ${-h - 24} L${t + 6} ${-h - 4} L${t} ${-h} L${hw} 0Z`;
    ridge = P(`M-11 ${-h * 0.5} L-11 ${-h * 0.68} Q0 ${-h * 0.8} 11 ${-h * 0.68} L11 ${-h * 0.5}Z`, '#b9844a') + L(`M${-hw * 0.97} ${-h * 0.25} L${hw * 0.97} ${-h * 0.25} M${-t} ${-h * 0.92} L${t} ${-h * 0.92}`, SAND_D, 3, 'opacity="0.4"');
  } else {
    body = `M${-hw} 0 Q${-hw * 0.4} ${-h * 0.5} -6 ${-h + 4} Q0 ${-h - 4} 6 ${-h + 4} Q${hw * 0.4} ${-h * 0.5} ${hw} 0Z`;
    ridge = [0.3, 0.55, 0.78].map((y) => L(`M${-hw * (1 - y) * 0.95} ${-h * y} Q0 ${-h * y + 8} ${hw * (1 - y) * 0.95} ${-h * y}`, SAND_D, 3, 'opacity="0.45"')).join('');
  }
  if (ghost) return P(body, '#fff', 'opacity="0.45" stroke="#fff" stroke-width="4" stroke-dasharray="10 8"');
  const specks = Array.from({ length: 8 }, (_, i) => C(((i * 37) % w) - hw * 0.8, -((i * 53) % (h * 0.85)) - 6, 2.2, i % 2 ? SAND_D : SAND_L, 'opacity="0.7"')).join('');
  return E(0, 2, hw * 1.05, 10, '#000', 'opacity="0.1"') + P(body, SAND, `stroke="${SAND_D}" stroke-width="3" stroke-linejoin="round"`) + P(`M${hw * 0.35} -2 L${hw * 0.3} ${-h * 0.9} L${hw * 0.8} ${-h * 0.4} L${hw * 0.9} -2Z`, SAND_D, 'opacity="0.22"') + ridge + specks + E(-hw * 0.45, -h * 0.6, hw * 0.14, h * 0.18, '#fff', 'opacity="0.25"');
}
function bucketArt(k: Mold, upside = false): string {
  const { w, h, bucket } = MOLDS[k];
  const hw = w / 2 + 8;
  const top = -h - 14;
  const shape = k === 'cone' ? `M${-hw} 0 L-10 ${top} L10 ${top} L${hw} 0Z` : k === 'round' ? `M${-hw} 0 Q${-hw} ${top} 0 ${top} Q${hw} ${top} ${hw} 0Z` : `M${-hw} 0 L${-hw + 8} ${top} L${hw - 8} ${top} L${hw} 0Z`;
  const g = P(shape, bucket, `stroke="${dark(bucket, 0.2)}" stroke-width="4" stroke-linejoin="round"`) + R(-hw - 4, -12, hw * 2 + 8, 14, 6, light(bucket, 0.3)) + P(heartD(0, top * 0.6, 16), '#fff', 'opacity="0.75"') + (upside ? '' : L(`M${-hw + 4} -6 Q0 ${top - 60} ${hw - 4} -6`, dark(bucket, 0.25), 4));
  return upside ? g : `<g transform="scale(1 -1) translate(0 ${h + 14})">${g}</g>`;
}
interface BDef { id: string; vb: string; art: string; flag?: boolean }
const BEACH: BDef[] = [
  { id: 'scallop', vb: '-34 -34 68 60', art: P('M0 18 L-28 -6 Q-26 -30 0 -32 Q26 -30 28 -6Z', '#ffb3d1', 'stroke="#ff7eb6" stroke-width="2.5"') + L('M0 16 L-18 -22 M0 16 L-6 -30 M0 16 L6 -30 M0 16 L18 -22', '#ff7eb6', 2.5) + R(-8, 14, 16, 8, 3, '#ff9ec7') },
  { id: 'spiral', vb: '-34 -34 68 60', art: P('M-26 12 Q-30 -20 0 -28 Q30 -24 22 2 Q14 20 -26 12Z', '#ffe0c4', 'stroke="#e8a878" stroke-width="2.5"') + L('M-14 6 Q-16 -14 4 -14 Q16 -10 10 0 Q4 6 -2 0', '#e8a878', 3) },
  { id: 'clam', vb: '-34 -30 68 52', art: E(0, 0, 28, 18, '#c99bff', 'stroke="#9b6bff" stroke-width="2.5"') + L('M-20 -6 Q0 -16 20 -6 M-24 4 Q0 -8 24 4', '#9b6bff', 2) + C(0, 8, 7, '#fff', 'stroke="#e8e0f0" stroke-width="2"') },
  { id: 'star-o', vb: '-34 -34 68 68', art: P(starD(0, 2, 28, 0.5), '#ffab5e', 'stroke="#ff8a3d" stroke-width="3" stroke-linejoin="round"') + [0, 1, 2, 3, 4].map((i) => C(Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 5) * 14, 2 + Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 5) * 14, 2.5, '#fff', 'opacity="0.8"')).join('') },
  { id: 'star-p', vb: '-34 -34 68 68', art: P(starD(0, 2, 28, 0.5), '#ff9ec7', 'stroke="#ff7eb6" stroke-width="3" stroke-linejoin="round"') + C(0, 2, 5, '#fff', 'opacity="0.8"') },
  ...(['#ff7eb6', '#5fd3b5', '#9b6bff', '#ffc531'].map((c, i): BDef => ({ id: `flag${i}`, flag: true, vb: '-20 -100 70 104', art: R(-3, -96, 6, 96, 3, '#a86b4a') + P('M3 -94 L46 -80 L3 -64Z', c) + (i === 0 ? P(heartD(18, -86, 9), '#fff') : i === 1 ? P(starD(17, -79, 7), '#fff') : i === 2 ? C(17, -79, 5, '#fff') : P(sparkleD(17, -79, 8), '#fff')) + C(0, -97, 5, '#ffd36b') }))),
  { id: 'seaweed', vb: '-34 -94 68 98', art: P('M-4 0 Q-22 -30 -6 -54 Q8 -74 -6 -90 Q18 -74 6 -52 Q-6 -30 10 0Z', '#4fbf8a') + P('M8 0 Q24 -24 16 -46 Q30 -26 20 0Z', '#3fa878') + P('M-12 0 Q-30 -18 -22 -38 Q-14 -20 -2 0Z', '#5fd3a5') },
  { id: 'crab', vb: '-52 -50 104 64', art: `<g><animateTransform attributeName="transform" type="translate" values="-6 0;6 0;-6 0" dur="1.4s" repeatCount="indefinite"/>${L('M-20 -6 l-14 10 M-22 -12 l-16 4 M20 -6 l14 10 M22 -12 l16 4', '#ff5a7a', 4)}${E(0, -14, 30, 20, '#ff7a8a')}${E(-6, -20, 14, 6, '#fff', 'opacity="0.35"')}${L('M-10 -30 l-2 -10 M10 -30 l2 -10', '#ff5a7a', 3)}${C(-12, -42, 6, '#fff')}${C(12, -42, 6, '#fff')}${C(-11, -42, 3, '#3a3546')}${C(13, -42, 3, '#3a3546')}${P('M-8 -8 Q0 -2 8 -8', 'none', 'stroke="#3a3546" stroke-width="2.5" stroke-linecap="round"')}${E(-20, -12, 4, 2.6, '#ffb3d1')}${E(20, -12, 4, 2.6, '#ffb3d1')}<g><animateTransform attributeName="transform" type="rotate" values="0 -34 -20;-14 -34 -20;0 -34 -20" dur="0.7s" repeatCount="indefinite"/>${P('M-30 -16 Q-50 -16 -48 -32 Q-40 -40 -34 -30 L-40 -26 Q-38 -20 -30 -22Z', '#ff5a7a')}</g>${P('M30 -16 Q50 -16 48 -32 Q40 -40 34 -30 L40 -26 Q38 -20 30 -22Z', '#ff5a7a')}</g>` },
  { id: 'pearl', vb: '-30 -30 60 52', art: P('M-26 6 Q-24 -24 0 -26 Q24 -24 26 6Z', '#ffd9e8', 'stroke="#ff9ec7" stroke-width="2.5"') + E(0, 6, 28, 10, '#ffb3d1') + C(0, -2, 10, '#fff', 'stroke="#f0e6f6" stroke-width="2"') + C(-3, -5, 3, '#fff') },
];
const BEACH_BY_ID: Record<string, BDef> = Object.fromEntries(BEACH.map((b) => [b.id, b]));

export function openSandcastle(onClose: () => void): void {
  const kit = makeKit('sf-sand', 'Sandcastle', (tall) => (tall ? [380, 120, 1220, 900] : [300, 110, 1300, 900]), onClose);
  const ids = uid('sc');
  const SHORE = kit.tall ? 300 : 410;
  const SEA = SHORE - 180;
  const T = kit.tall;
  type Block = { id: number; k: Mold; x: number; gy: number; by: number };
  type Moat = { pts: Pt[]; water: number };
  type Deco = { id: number; d: string; x: number; y: number };
  let blocks: Block[] = [];
  let moats: Moat[] = [];
  let decos: Deco[] = [];
  let hist: string[] = [];
  let tab = 'buckets';
  let mold: Mold = 'square';
  let nextId = 1;
  let phase: 'build' | 'done' = 'build';

  const defs = `<defs><linearGradient id="${ids}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fb0ff"/><stop offset="1" stop-color="#c6ecff"/></linearGradient>
    <linearGradient id="${ids}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fa8e8"/><stop offset="0.6" stop-color="#5fd0ec"/><stop offset="1" stop-color="#8fe6e6"/></linearGradient>
    <linearGradient id="${ids}-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0cf94"/><stop offset="0.12" stop-color="#ffe7b6"/><stop offset="1" stop-color="#f6d394"/></linearGradient>
    <linearGradient id="${ids}-wave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ec" stop-opacity="0.9"/><stop offset="1" stop-color="#bff0f4" stop-opacity="0.85"/></linearGradient></defs>`;
  const sunArt = at(T ? 1110 : 1300, T ? SEA - 120 : 168, `<g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="40s" repeatCount="indefinite"/>${Array.from({ length: 12 }, (_, i) => `<path d="M-10 -80 L0 -112 L10 -80Z" fill="#ffd36b" transform="rotate(${i * 30})"/>`).join('')}</g>${C(0, 0, 74, '#ffe066')}${C(-24, -8, 6, '#6b4a3a')}${C(24, -8, 6, '#6b4a3a')}${L('M-22 16 Q0 34 22 16', '#6b4a3a', 5)}${E(-40, 12, 10, 6, '#ff9ec7', 'opacity="0.7"')}${E(40, 12, 10, 6, '#ff9ec7', 'opacity="0.7"')}`);
  const waves = Array.from({ length: 4 }, (_, i) => {
    const y = SEA + 40 + i * 34;
    let d = `M-700 ${y}`;
    for (let x = -700; x < 2300; x += 80) d += ` q20 -10 40 0 t40 0`;
    return `<g opacity="${0.35 + i * 0.12}">${L(d, '#ffffff', 4)}<animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 80 : -80} 0;0 0" dur="${5 + i}s" repeatCount="indefinite"/></g>`;
  }).join('');
  const foam = () => {
    let d = `M-700 ${SHORE}`;
    for (let x = -700; x < 2300; x += 60) d += ` q15 14 30 0 t30 0`;
    return `<g>${P(d + ` L2300 ${SHORE - 40} L-700 ${SHORE - 40}Z`, '#bff0f4')}${L(d, '#ffffff', 7)}<animateTransform attributeName="transform" type="translate" values="0 -6;-30 10;0 -6" dur="4s" repeatCount="indefinite"/></g>`;
  };
  const palm = at(T ? 400 : 130, SHORE + 190, L('M0 0 Q-10 -150 40 -300', '#b8845a', 26) + L('M0 0 Q-10 -150 40 -300', '#a06c44', 26, 'stroke-dasharray="4 22" opacity="0.6"') +
    [[-150, -250], [-120, -340], [40, -400], [190, -330], [200, -240]].map(([x, y]) => P(`M40 -300 Q${f((40 + x) / 2)} ${f(y - 60)} ${x} ${y} Q${f((40 + x) / 2)} ${f(y - 20)} 40 -300Z`, '#4fbf6a')).join('') + C(30, -290, 14, '#8a5a3c') + C(52, -284, 13, '#8a5a3c'));
  const umbrella = at(T ? 1260 : 1480, SHORE + 230, R(-5, -260, 10, 260, 5, '#fff') + P('M-170 -230 Q0 -380 170 -230 Q127 -250 85 -230 Q42 -250 0 -230 Q-42 -250 -85 -230 Q-127 -250 -170 -230Z', '#ff7eb6') + P('M-85 -230 Q-60 -340 0 -360 Q-30 -300 -42 -238Z M42 -238 Q30 -300 0 -360 Q60 -340 85 -230Z', '#fff', 'opacity="0.85"') );
  const ball = at(T ? 1150 : 1250, T ? SHORE + 110 : 640, E(0, 40, 50, 10, '#000', 'opacity="0.1"') + C(0, 0, 46, '#fff') + P('M0 -46 Q-30 0 0 46 Q-46 40 -46 0 Q-46 -40 0 -46Z', '#ff7eb6') + P('M0 -46 Q30 0 0 46 Q46 40 46 0 Q46 -40 0 -46Z', '#7cc8ff') + P('M-8 -45 Q0 0 -8 45 L8 45 Q0 0 8 -45Z', '#ffd36b') + C(0, 0, 8, '#fff') + E(-18, -22, 10, 6, '#fff', 'opacity="0.6" transform="rotate(-30 -18 -22)"'));
  const scenery = R(-600, -500, 2800, 1900, 0, `url(#${ids}-sky)`) + sunArt + cloud(T ? 560 : 420, T ? SEA - 150 : 140, 0.9, 70) + cloud(T ? 860 : 900, T ? SEA - 60 : 90, 0.6, -60) +
    R(-700, SEA, 3000, 220, 0, `url(#${ids}-sea)`) + at(T ? 640 : 560, SEA + 20, P('M-30 0 L30 0 L22 12 L-22 12Z', '#fff') + L('M0 0 L0 -40', '#a86b4a', 3) + P('M2 -38 L24 -6 L2 -6Z', '#ff7eb6'), '') + waves +
    R(-700, SHORE - 10, 3000, 1200, 0, `url(#${ids}-sand)`) + R(-700, SHORE - 10, 3000, 40, 0, '#e8c48a', 'opacity="0.6"') + foam() +
    Array.from({ length: 60 }, (_, i) => C(((i * 397) % 2600) - 500, SHORE + 50 + ((i * 211) % 520), 2 + (i % 3), i % 2 ? SAND_D : '#fff', 'opacity="0.5"')).join('') +
    (T ? [[440, 880, 'scallop'], [1170, 885, 'spiral'], [430, SHORE + 150, 'clam']] : [[300, 880, 'scallop'], [1330, 860, 'spiral'], [230, 700, 'clam']]).map(([x, y, b]) => at(Number(x), Number(y), BEACH_BY_ID[String(b)].art, ' scale(0.7)')).join('');
  kit.svg.innerHTML = `${defs}<g>${scenery}</g><g class="sf-l-wave"></g><g>${palm}${umbrella}${ball}</g><g class="sf-l-moat"></g><g class="sf-l-castle"></g><g class="sf-l-deco"></g><g class="sf-l-ghost"></g><g class="sf-l-fx"></g><g class="sf-l-gull"></g>`;

  const blockTop = (b: Block) => b.by - MOLDS[b.k].h - (b.k === 'square' ? 20 : b.k === 'tower' ? 24 : 0);
  const restTop = (b: Block) => b.by - MOLDS[b.k].h; // where the next block sits
  const drawCastle = () => {
    const sorted = [...blocks].sort((a, b) => a.gy - b.gy || b.by - a.by);
    kit.layer('castle').innerHTML = sorted.map((b) => `<g data-b="${b.id}" transform="translate(${f(b.x)} ${f(b.by)})"><g class="sf-popin">${moldArt(b.k)}</g></g>`).join('');
  };
  const drawMoats = () => {
    kit.layer('moat').innerHTML = moats.map((m, i) => {
      const d = smoothD(m.pts);
      return L(d, '#d9aa62', 54) + L(d, '#c99a58', 40) + L(d, '#b8864a', 26, 'opacity="0.6"') + (m.water > 0 ? `<path data-w="${i}" d="${d}" fill="none" stroke="#6fd0f0" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="${f(m.water)} 100"/><path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="${m.water >= 100 ? 0.7 : 0}" stroke-dasharray="8 26"><animate attributeName="stroke-dashoffset" values="0;-68" dur="2s" repeatCount="indefinite"/></path>` : '');
    }).join('');
  };
  const decoArt = (d: Deco) => `<g data-d="${d.id}" transform="translate(${f(d.x)} ${f(d.y)})">${BEACH_BY_ID[d.d].art}${C(0, BEACH_BY_ID[d.d].flag ? -50 : -12, BEACH_BY_ID[d.d].flag ? 50 : 38, 'transparent')}</g>`;
  const drawDecos = () => (kit.layer('deco').innerHTML = decos.map(decoArt).join(''));

  const TABS = [
    { id: 'buckets', label: 'Buckets', art: thumb(moldArt('square'), '-80 -130 160 150') },
    { id: 'dig', label: 'Dig a moat', art: thumb(shovel(), '-40 -70 80 90') },
    { id: 'decor', label: 'Decorate', art: thumb(BEACH_BY_ID['star-o'].art, BEACH_BY_ID['star-o'].vb) },
  ];
  const drawTray = () => {
    if (phase !== 'build') return;
    let items = '';
    if (tab === 'buckets') items = (Object.keys(MOLDS) as Mold[]).map((k) => itemBtn(`m:${k}`, thumb(moldArt(k), `-80 ${-MOLDS[k].h - 36} 160 ${MOLDS[k].h + 52}`), k === mold)).join('');
    else if (tab === 'dig') items = `<button class="sf-item wide on" data-id="dig">${thumb(shovel(), '-40 -70 80 90')}<span>Draw a moat in the sand</span></button>`;
    else items = BEACH.map((b) => itemBtn(`d:${b.id}`, thumb(b.art, b.vb))).join('');
    kit.tray.innerHTML = tabsHTML(TABS, tab) + `<div class="sf-items">${items}${undoBtn()}</div>`;
  };
  const tipFor = () => kit.tip(
    tab === 'buckets' ? 'Tap the sand to make a block. Tap on top of a block to stack it!' : tab === 'dig' ? 'Draw a moat with your finger. Water fills it up!' : 'Tap or drag shells, flags and friends onto your castle.',
    tab === 'dig' ? icon('hand') : icon('star'),
  );
  const remember = () => {
    hist.push(JSON.stringify({ blocks, moats, decos }));
    if (hist.length > 50) hist.shift();
  };

  // where a new block lands: on top of a block under the finger, or on the sand
  const landing = (p: Pt): { x: number; gy: number; by: number; ok: boolean } => {
    const { h } = MOLDS[mold];
    let best: Block | null = null;
    for (const b of blocks) {
      const hw = MOLDS[b.k].w / 2 + 14;
      if (Math.abs(p.x - b.x) < hw && p.y < b.gy + 24 && p.y > blockTop(b) - 120 && (!best || restTop(b) < restTop(best))) {
        // only the top block of that column counts
        if (!blocks.some((o) => o !== b && o.gy === b.gy && Math.abs(o.x - b.x) < 30 && o.by < b.by && Math.abs(p.x - o.x) < MOLDS[o.k].w / 2 + 14)) best = b;
      }
    }
    if (best && best.k !== 'cone') {
      const by = restTop(best);
      const x = Math.abs(p.x - best.x) < MOLDS[best.k].w / 3 ? best.x : p.x;
      return { x, gy: best.gy, by, ok: by - h > 90 };
    }
    const gy = clamp(p.y, SHORE + 70, 880);
    return { x: p.x, gy, by: gy, ok: true };
  };
  const showGhost = (p: Pt | null) => {
    if (!p) {
      kit.layer('ghost').innerHTML = '';
      return;
    }
    const l = landing(p);
    kit.layer('ghost').innerHTML = l.ok ? at(l.x, l.by, moldArt(mold, true)) + at(l.x, l.by - MOLDS[mold].h - 70, bucketArt(mold, true), ' scale(0.8)') : '';
  };
  const placeBlock = (p: Pt) => {
    const l = landing(p);
    if (!l.ok) {
      sound.boing();
      kit.tip('Wow, that is super tall! Try building next to it.', icon('star'));
      return;
    }
    remember();
    const b: Block = { id: nextId++, k: mold, x: l.x, gy: l.gy, by: l.by };
    // the bucket flips down, thumps, and lifts away to leave the sand shape
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    kit.layer('fx').appendChild(node);
    const h = MOLDS[mold].h;
    kit.tween(220, (t) => node.setAttribute('transform', `translate(${f(b.x)} ${f(b.by - (1 - ease(t)) * 120)})`), () => {
      sound.thud();
      blocks.push(b);
      kit.tween(380, (t) => {
        node.setAttribute('transform', `translate(${f(b.x)} ${f(b.by - ease(t) * 160)})`);
        node.setAttribute('opacity', f(1 - t));
      }, () => node.remove());
      drawCastle();
      drawDecos();
      sparkleAt(kit, [{ x: b.x, y: b.by - h / 2 }], 'sparkle', 6);
    });
    node.innerHTML = bucketArt(mold, true);
    node.setAttribute('transform', `translate(${f(b.x)} ${f(b.by - 120)})`);
    sound.whoosh();
  };

  let ghostPid = -1;
  let digging: { pid: number; m: Moat } | null = null;
  const fill = (m: Moat) => {
    sound.spray();
    kit.tween(Math.min(1800, 400 + m.pts.length * 18), (t) => {
      m.water = t * 100;
      const w = kit.svg.querySelector(`[data-w="${moats.indexOf(m)}"]`);
      if (w) w.setAttribute('stroke-dasharray', `${f(m.water)} 100`);
      else drawMoats();
    }, () => {
      m.water = 100;
      drawMoats();
      sound.ding();
    });
  };

  const drag = tracker(kit, {
    move(id, p) {
      const d = decos.find((q) => q.id === id);
      if (d) {
        d.x = p.x;
        d.y = p.y;
        kit.svg.querySelector(`[data-d="${id}"]`)?.setAttribute('transform', `translate(${f(d.x)} ${f(d.y)})`);
      }
    },
    end(id, p, _e, toTray) {
      const d = decos.find((q) => q.id === id);
      if (!d) return;
      if (toTray) {
        decos = decos.filter((q) => q !== d);
        sound.pop();
      } else {
        if (BEACH_BY_ID[d.d].flag) {
          const b = blocks.find((o) => Math.abs(o.x - p.x) < 50 && Math.abs(blockTop(o) - p.y) < 50);
          if (b) {
            d.x = b.x;
            d.y = blockTop(b) + 6;
            sound.click();
          }
        }
        sound.drop();
      }
      drawDecos();
    },
  });

  kit.on(kit.svg, 'pointerdown', (e) => {
    if (phase !== 'build') return;
    const t = e.target as Element;
    const dg = t.closest('[data-d]');
    if (dg) {
      const d = decos.find((q) => q.id === Number(dg.getAttribute('data-d')));
      if (d) {
        remember();
        decos = decos.filter((q) => q !== d).concat(d);
        drawDecos();
        drag.begin(e, d.id, { x: d.x, y: d.y });
        sound.pick();
      }
      return;
    }
    const p = kit.pt(e);
    if (tab === 'buckets') {
      ghostPid = e.pointerId;
      showGhost(p);
      sound.tap();
    } else if (tab === 'dig') {
      if (p.y < SHORE + 40) return;
      remember();
      digging = { pid: e.pointerId, m: { pts: [p], water: 0 } };
      moats.push(digging.m);
      drawMoats();
      sound.thud();
    } else kit.tip('Tap a shell or flag in the tray to add it!', icon('star'));
  });
  kit.on(window, 'pointermove', (e) => {
    if (e.pointerId === ghostPid) showGhost(kit.pt(e));
    if (digging && digging.pid === e.pointerId) {
      const p = kit.pt(e);
      p.y = Math.max(SHORE + 40, p.y);
      const last = digging.m.pts[digging.m.pts.length - 1];
      if (dist(p, last) > 10) {
        digging.m.pts.push(p);
        drawMoats();
        if (Math.random() < 0.12) sound.click();
      }
    }
  });
  const up = (e: PointerEvent) => {
    if (e.pointerId === ghostPid) {
      ghostPid = -1;
      showGhost(null);
      if (e.type === 'pointerup' && !kit.overTray(e)) placeBlock(kit.pt(e));
    }
    if (digging && digging.pid === e.pointerId) {
      const m = digging.m;
      digging = null;
      if (m.pts.length < 3) m.pts.push({ x: m.pts[0].x + 30, y: m.pts[0].y });
      fill(m);
    }
  };
  kit.on(window, 'pointerup', up);
  kit.on(window, 'pointercancel', up);

  const placeDeco = (id: string): Pt => {
    const b = BEACH_BY_ID[id];
    if (b.flag) {
      const covered = (o: Block) => blocks.some((u) => u !== o && u.gy === o.gy && Math.abs(u.by - restTop(o)) < 2 && Math.abs(u.x - o.x) < 40);
      const free = [...blocks].filter((o) => !covered(o)).sort((a, c) => blockTop(a) - blockTop(c)).find((o) => !decos.some((d) => BEACH_BY_ID[d.d].flag && Math.abs(d.x - o.x) < 10 && Math.abs(d.y - blockTop(o) - 6) < 10));
      if (free) return { x: free.x, y: blockTop(free) + 6 };
    }
    if (id === 'crab') return { x: rnd(560, 1040), y: rnd(820, 870) };
    if (blocks.length) {
      const o = pick(blocks);
      return { x: o.x + rnd(-30, 30), y: o.by - rnd(10, MOLDS[o.k].h * 0.6) };
    }
    return { x: rnd(500, 1100), y: rnd(560, 840) };
  };

  trayGestures(kit, {
    tab(id) {
      tab = id;
      drawTray();
      tipFor();
    },
    tap(id) {
      if (phase !== 'build') return;
      if (id === 'undo') {
        const h = hist.pop();
        if (!h) return;
        ({ blocks, moats, decos } = JSON.parse(h) as { blocks: Block[]; moats: Moat[]; decos: Deco[] });
        moats.forEach((m) => (m.water = 100));
        sound.whoosh();
        drawCastle();
        drawMoats();
        drawDecos();
        return;
      }
      if (id.startsWith('m:')) {
        mold = id.slice(2) as Mold;
        sound.pick();
        drawTray();
        kit.tip('Now tap the sand!', icon('hand'));
        return;
      }
      if (id.startsWith('d:')) {
        remember();
        const p = placeDeco(id.slice(2));
        decos.push({ id: nextId++, d: id.slice(2), ...p });
        drawDecos();
        sound.pop();
        sparkleAt(kit, [p], 'sparkle', 6);
      }
    },
    drag(id, e) {
      if (phase !== 'build' || !id.startsWith('d:')) return;
      remember();
      const p = kit.pt(e);
      const d = { id: nextId++, d: id.slice(2), x: p.x, y: p.y - 20 };
      decos.push(d);
      drawDecos();
      drag.begin(e, d.id, { x: d.x, y: d.y });
      sound.pick();
    },
  });

  const start = () => {
    kit.stop();
    drag.clear();
    blocks = [];
    moats = [];
    decos = [];
    hist = [];
    phase = 'build';
    tab = 'buckets';
    mold = 'square';
    kit.layer('wave').innerHTML = '';
    kit.layer('gull').innerHTML = '';
    kit.done.disabled = false;
    drawCastle();
    drawMoats();
    drawDecos();
    drawTray();
    tipFor();
  };

  kit.reset.onclick = () => {
    sound.whoosh();
    start();
  };
  kit.done.onclick = () => {
    if (phase !== 'build') return;
    if (!blocks.length) {
      kit.tip('Build something first! Pick a bucket and tap the sand.', icon('star'));
      sound.boing();
      return;
    }
    phase = 'done';
    kit.tip('');
    kit.tray.innerHTML = `<div class="sf-msg">${icon('sun')}<span>Here comes a little wave...</span></div>`;
    // a gentle wave rolls up to the moat (or just short of the castle) and slides back
    const front = Math.min(...blocks.map((b) => b.gy - 130), ...moats.flatMap((m) => m.pts.map((p) => p.y - 24)), 620);
    const reach = Math.max(SHORE + 60, front);
    const wave = (y: number) => {
      let d = `M-700 ${SHORE - 60} L2300 ${SHORE - 60} L2300 ${f(y)}`;
      for (let x = 2300; x > -700; x -= 70) d += ` q-17 ${f(18)} -35 0 t-35 0`;
      return P(d + 'Z', `url(#${ids}-wave)`) + L(d.slice(d.indexOf(`L2300 ${f(y)}`) + 1).replace(/^2300/, 'M2300'), '#ffffff', 8, 'opacity="0.9"');
    };
    sound.whoosh();
    kit.tween(2600, (t) => {
      const k = t < 0.55 ? ease(t / 0.55) : 1 - easeIO((t - 0.55) / 0.45);
      kit.layer('wave').innerHTML = `<g pointer-events="none">${wave(SHORE + (reach - SHORE) * k)}</g>`;
    }, () => (kit.layer('wave').innerHTML = ''));
    kit.later(() => {
      sound.squeak();
      const gull = kit.layer('gull');
      kit.tween(4200, (t) => {
        const x = -100 + t * 1900;
        const y = 200 - Math.sin(t * Math.PI) * 80;
        const flap = Math.sin(t * 40) * 14;
        gull.innerHTML = at(x, y, L(`M-34 ${f(-flap)} Q-16 -16 0 0 Q16 -16 34 ${f(-flap)}`, '#fff', 8) + E(0, 2, 12, 8, '#fff') + C(8, -2, 7, '#fff') + P('M14 -2 L24 0 L14 3Z', '#ffab5e') + C(10, -4, 1.8, '#3a3546'));
      }, () => (gull.innerHTML = ''));
    }, 900);
    kit.later(() => {
      sparkleAt(kit, blocks.slice(0, 4).map((b) => ({ x: b.x, y: blockTop(b) })), 'sparkle', 12);
      win(kit, { stat: 'sandcastle', coins: 20, title: 'Royal sandcastle!', text: blocks.length >= 6 ? 'A castle fit for a mermaid queen!' : 'The wave said wow. Your castle stayed!', again: 'Build another', onAgain: start });
    }, 2200);
  };
  start();
}
function shovel(): string {
  return R(-5, -62, 10, 48, 5, '#a86b4a') + R(-14, -66, 28, 10, 5, '#ff7eb6') + P('M-18 -16 L18 -16 L14 10 Q0 22 -14 10Z', '#7cc8ff', 'stroke="#4f9dff" stroke-width="3"');
}

// ================================================================================================
// entry points
// ================================================================================================
const SI = (inner: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
export const SEASON_FUN: Record<Season, { name: string; icon: string }> = {
  winter: {
    name: 'Build a Snowman',
    icon: SI(C(32, 46, 15, '#fff', 'stroke="#c9d9ee" stroke-width="2"') + C(32, 22, 11, '#fff', 'stroke="#c9d9ee" stroke-width="2"') + C(28, 20, 1.8, '#3a3546') + C(36, 20, 1.8, '#3a3546') + P('M32 23 L42 25 L32 26Z', '#ff8a3d') + P('M20 13 L44 13 L42 16 L22 16Z', '#3b3550') + R(24, 2, 16, 12, 2, '#3b3550') + R(24, 10, 16, 3, 0, '#ff7eb6') + P('M22 31 Q32 36 42 31 L42 35 Q32 40 22 35Z', '#ff7eb6')),
  },
  fall: {
    name: 'Carve a Pumpkin',
    icon: SI(E(22, 38, 14, 18, '#f07a1c') + E(42, 38, 14, 18, '#f07a1c') + E(32, 38, 15, 20, '#ff8c2a') + P('M30 18 Q29 10 34 7 L37 9 Q33 12 34 18Z', '#7a5a2a') + E(25, 10, 6, 3, '#6fbf5a', 'transform="rotate(-20 25 10)"') + P(heartD(25, 30, 6), '#7a3210') + P(heartD(39, 30, 6), '#7a3210') + P('M22 42 Q32 52 42 42 Q32 46 22 42Z', '#7a3210')),
  },
  spring: {
    name: 'Egg Hunt',
    icon: SI(P(eggD(32, 34, 17, 22), '#ffb3d1', 'stroke="#ff7eb6" stroke-width="2"') + R(15, 28, 34, 6, 0, '#fff', 'opacity="0.9"') + C(25, 20, 2.5, '#c99bff') + C(36, 18, 2.5, '#c99bff') + C(30, 44, 2.5, '#7cc8ff') + C(40, 46, 2.5, '#7cc8ff') + L('M16 54 Q24 48 32 54 Q40 48 48 54', '#5fbf6a', 3)),
  },
  summer: {
    name: 'Sandcastle',
    icon: SI(P('M12 54 L14 30 L12 30 L12 24 L18 24 L18 28 L22 28 L22 24 L26 24 L26 30 L24 30 L24 38 L40 38 L40 30 L38 30 L38 24 L42 24 L42 28 L46 28 L46 24 L52 24 L52 30 L50 30 L52 54Z', '#f4c77c', 'stroke="#d9a55b" stroke-width="2" stroke-linejoin="round"') + P('M28 54 L28 46 Q32 40 36 46 L36 54Z', '#b9844a') + L('M32 38 L32 20', '#a86b4a', 2) + P('M32 20 L42 24 L32 28Z', '#ff7eb6') + R(4, 54, 56, 6, 3, '#7cc8ff')),
  },
};

/** Opens the activity for a season: snowman in winter, pumpkin in fall, egg hunt in spring, sandcastle in summer. */
export function openSeasonFun(season: Season, onClose: () => void): void {
  if (season === 'winter') openSnowman(onClose);
  else if (season === 'fall') openPumpkin(onClose);
  else if (season === 'spring') openEggHunt(onClose);
  else openSandcastle(onClose);
}

