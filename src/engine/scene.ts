// A playable place: draws the background, furniture and dolls, and handles picking things up,
// dropping them, sitting on things, eating snacks and switching things on.
import { PALETTE } from '../art/color';
import { shadow } from '../art/defs';
import { type Expr, dollHeight, hipHeight, renderDoll } from '../art/doll';
import { FURN_BY_ID, artCtx, type FurnDef, type SeatDef } from '../art/furniture';
import { CHALK_BOX, audience, butterflies, roomLight, theaterCurtains } from '../art/scenes';
import type { PlaceDef } from '../data/places';
import { G, toast } from '../game';
import type { Doll, PlacedItem, SceneState, Stroke } from '../types';
import { icon } from '../ui/icons';
import { pianoNote, sound } from './audio';
import { burst } from './particles';

const NS = 'http://www.w3.org/2000/svg';
const k = (it: PlacedItem) => it.scale ?? 1;
const itemTransform = (it: PlacedItem) => `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)})${k(it) !== 1 ? ` scale(${k(it)})` : ''}`;
const SIZES = [1, 1.25, 0.8];
const MAX_ITEMS = 70;

export interface SceneHooks {
  openCloset(dollId: string): void;
  trayRect(): DOMRect | null;
  onDragState(dragging: boolean): void;
}

type Drag =
  | { kind: 'item'; it: PlacedItem; ox: number; oy: number; started: boolean; sx: number; sy: number; fromTray: boolean; deps: { it: PlacedItem; dx: number; dy: number }[] }
  | { kind: 'doll'; d: Doll; ox: number; oy: number; started: boolean; sx: number; sy: number; fromTray: boolean }
  | { kind: 'chalk'; stroke: Stroke; path: SVGPathElement };

function tween(ms: number, step: (t: number) => void, done?: () => void): void {
  const t0 = performance.now();
  const run = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    step(t);
    if (t < 1) requestAnimationFrame(run);
    else done?.();
  };
  requestAnimationFrame(run);
}

export class SceneView {
  readonly root: HTMLDivElement;
  readonly svg: SVGSVGElement;
  private bgG: SVGGElement;
  private chalkG: SVGGElement;
  private worldG: SVGGElement;
  private fgG: SVGGElement;
  private els = new Map<string, SVGGElement>();
  private expr = new Map<string, Expr>();
  private exprTimers = new Map<string, number>();
  private drag: Drag | null = null;
  /** The finger (or mouse) doing the current drag; other fingers are ignored. */
  private pid = -1;
  private vb = { x: 0, y: 0, w: 1600, h: 900 };
  private popup: HTMLDivElement;
  private popupTimer: number | null = null;
  private ro: ResizeObserver;
  private idleTimer = 0;
  private lookTimer = 0;
  drawMode = false;
  chalkColor = '#ffffff';
  curtainsOpen = true;
  lights = true;
  cheering = false;

  constructor(readonly place: PlaceDef, readonly hooks: SceneHooks) {
    this.root = document.createElement('div');
    this.root.className = 'scene';
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', 'scene-svg');
    this.svg.setAttribute('preserveAspectRatio', 'none');
    this.bgG = this.g('bg');
    this.chalkG = this.g('chalk');
    this.worldG = this.g('world');
    this.fgG = this.g('fg');
    this.svg.append(this.bgG, this.chalkG, this.worldG, this.fgG);
    this.popup = document.createElement('div');
    this.popup.className = 'scene-popup';
    this.root.append(this.svg, this.popup);
    this.svg.addEventListener('pointerdown', this.onDown);
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this.root);
    this.adoptRests();
    this.validateSeats();
    this.renderBg();
    this.renderAll();
    this.idleTimer = window.setInterval(() => this.idleMoment(), 2300);
  }

  /** Every few seconds a friend does something on her own: glances, waves, twirls or hops. */
  private idleMoment(): void {
    if (document.visibilityState !== 'visible') return;
    const busy = this.drag && 'started' in this.drag && this.drag.started;
    const pool = this.dolls().filter((d) => !(busy && this.drag && 'd' in this.drag && this.drag.d === d));
    if (!pool.length) return;
    const d = pool[Math.floor(Math.random() * pool.length)];
    const el = this.els.get('d' + d.id);
    if (!el || el.classList.contains('sleeping')) return;
    const r = Math.random();
    const flash = (cls: string, ms: number) => {
      el.classList.remove(cls);
      void el.getBoundingClientRect();
      el.classList.add(cls);
      window.setTimeout(() => el.classList.remove(cls), ms);
    };
    if (r < 0.45) {
      el.style.setProperty('--lx', `${(Math.random() * 2 - 1) * 4.5}px`);
      el.style.setProperty('--ly', `${(Math.random() * 2 - 1) * 2.5}px`);
      window.setTimeout(() => {
        el.style.removeProperty('--lx');
        el.style.removeProperty('--ly');
      }, 1400);
    } else if (r < 0.65) flash('idle-wave', 1800);
    else if (r < 0.8 && !d.seat) flash('idle-spin', 800);
    else flash('hop', 500);
  }

  /** Everyone's eyes follow the thing being dragged. */
  private lookAt(wx: number, wy: number, except?: Doll): void {
    for (const d of this.dolls()) {
      if (d === except) continue;
      const el = this.els.get('d' + d.id);
      if (!el) continue;
      const hy = d.seat ? d.y - (dollHeight(d.look) - hipHeight(d.look)) * 0.72 : d.y - dollHeight(d.look) * 0.72;
      const dx = wx - d.x;
      const dy = wy - hy;
      const n = Math.hypot(dx, dy) || 1;
      el.style.setProperty('--lx', `${((dx / n) * 5).toFixed(1)}px`);
      el.style.setProperty('--ly', `${((dy / n) * 3).toFixed(1)}px`);
    }
    window.clearTimeout(this.lookTimer);
    this.lookTimer = window.setTimeout(() => {
      for (const el of this.els.values()) if (el.dataset.doll) {
        el.style.removeProperty('--lx');
        el.style.removeProperty('--ly');
      }
    }, 1600);
  }

  get sc(): SceneState {
    return G.s.scenes[this.place.id];
  }

  private g(cls: string): SVGGElement {
    const e = document.createElementNS(NS, 'g');
    e.setAttribute('class', cls);
    return e;
  }

  destroy(): void {
    window.clearInterval(this.idleTimer);
    window.clearTimeout(this.lookTimer);
    this.ro.disconnect();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    for (const t of this.exprTimers.values()) clearTimeout(t);
    this.root.remove();
  }

  /** Fits the 1600x900 design area above the tray, letting the background fill the rest. */
  layout(): void {
    const r = this.root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const tray = this.hooks.trayRect();
    const trayH = tray ? Math.max(0, r.bottom - tray.top) : 0;
    const topH = r.height < 560 ? 14 : 64;
    const avail = Math.max(200, r.height - trayH - topH);
    const s = Math.min(r.width / 1600, avail / 900);
    const w = r.width / s;
    const h = r.height / s;
    const y = 450 - avail / s / 2 - topH / s;
    this.vb = { x: 800 - w / 2, y, w, h };
    this.svg.setAttribute('viewBox', `${this.vb.x.toFixed(1)} ${this.vb.y.toFixed(1)} ${this.vb.w.toFixed(1)} ${this.vb.h.toFixed(1)}`);
  }

  // ---------------- drawing ----------------
  renderBg(): void {
    this.bgG.innerHTML = this.place.bg(G.s.season, this.sc, { curtains: this.curtainsOpen, lights: this.lights });
    this.renderChalk();
    this.renderFg();
  }

  renderFg(): void {
    const se = G.s.season;
    this.fgG.innerHTML = this.place.id === 'theater' ? theaterCurtains(this.curtainsOpen) + audience(this.cheering)
      : this.place.outdoor ? butterflies(se) : roomLight(this.place.id, se);
  }

  private renderChalk(): void {
    const strokes = this.sc.chalk ?? [];
    this.chalkG.innerHTML = strokes.map((s) => `<path d="${strokeD(s.pts)}" stroke="${s.c}" stroke-width="${s.w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>`).join('');
  }

  clearChalk(): void {
    if (this.sc.chalk) this.sc.chalk = [];
    this.renderChalk();
    G.changed();
  }

  renderAll(): void {
    artCtx.season = G.s.season;
    this.worldG.innerHTML = '';
    this.els.clear();
    for (const it of this.sc.items) this.syncItem(it);
    for (const d of this.dolls()) this.syncDoll(d);
    this.sort();
  }

  dolls(): Doll[] {
    return G.s.dolls.filter((d) => d.place === this.place.id);
  }

  private seatOwner(it: PlacedItem, i: number): Doll | undefined {
    return this.dolls().find((d) => d.seat && d.seat.uid === it.uid && d.seat.i === i);
  }

  private inUse(it: PlacedItem): boolean {
    const def = FURN_BY_ID[it.def];
    return !!def.animWhenUsed && (def.seats ?? []).some((_, i) => this.seatOwner(it, i));
  }

  syncItem(it: PlacedItem): void {
    const def = FURN_BY_ID[it.def];
    if (!def) return;
    const color = it.color ?? def.color ?? '#ff9ec7';
    const on = def.animWhenUsed ? this.inUse(it) : !!it.on;
    const flip = it.flip ? ' transform="scale(-1 1)"' : '';
    let el = this.els.get('i' + it.uid);
    if (!el) {
      el = this.g('it');
      el.dataset.uid = String(it.uid);
      this.worldG.appendChild(el);
      this.els.set('i' + it.uid, el);
    }
    const sh = def.mount === 'floor' ? shadow(def.w * 0.85, 34) : def.mount === 'prop' ? shadow(def.w * 0.9, 14) : '';
    // Small things get an invisible pad around them so little fingers can grab them.
    const pad = def.mount === 'prop' ? `<rect x="${-Math.max(def.w, 90) / 2}" y="${-Math.max(def.h, 90) - 6}" width="${Math.max(def.w, 90)}" height="${Math.max(def.h, 90) + 12}" fill="transparent"/>` : '';
    el.innerHTML = `${sh}<g class="lift">${pad}<g${flip}>${def.art(color, on)}</g></g>`;
    el.setAttribute('transform', itemTransform(it));
    if (def.front) {
      let fe = this.els.get('f' + it.uid);
      if (!fe) {
        fe = this.g('it front');
        fe.dataset.uid = String(it.uid);
        this.worldG.appendChild(fe);
        this.els.set('f' + it.uid, fe);
      }
      fe.innerHTML = `<g class="lift"><g${flip}>${def.front(color, on)}</g></g>`;
      fe.setAttribute('transform', el.getAttribute('transform')!);
    }
  }

  private seatWorld(it: PlacedItem, s: SeatDef): { x: number; y: number } {
    return { x: it.x + (it.flip ? -s.x : s.x) * k(it), y: it.y + s.y * k(it) };
  }

  syncDoll(d: Doll): void {
    let el = this.els.get('d' + d.id);
    if (!el) {
      el = this.g('doll');
      el.dataset.doll = d.id;
      el.style.setProperty('--blink-delay', `${(parseInt(d.id.replace(/\D/g, '') || '1', 10) * 1.37) % 4}s`);
      this.worldG.appendChild(el);
      this.els.set('d' + d.id, el);
    }
    const dragging = this.drag && 'd' in this.drag && this.drag.d === d && this.drag.started;
    let pose: 'stand' | 'held' | 'sit' | 'sleep' = dragging ? 'held' : 'stand';
    let x = d.x;
    let y = d.y;
    let wrapOpen = '<g>';
    let wrapClose = '';
    let extra = '';
    const seatInfo = this.seatOf(d);
    if (seatInfo && !dragging) {
      const { it, s } = seatInfo;
      pose = s.pose === 'sleep' ? 'sleep' : 'sit';
      const w = this.seatWorld(it, s);
      x = w.x;
      y = w.y;
      d.x = x;
      d.y = y;
      if (s.anim) {
        const sg = it.flip ? -1 : 1;
        const spline = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
        const begin = `begin="${-(s.anim.phase ?? 0)}s"`;
        if (s.anim.kind === 'wheel') {
          // Ferris wheels and teacups: circle the pivot while staying upright.
          const px = sg * (s.anim.pivot[0] - s.x) * k(it);
          const py = (s.anim.pivot[1] - s.y) * k(it);
          const dir = (s.anim.amp >= 0 ? 1 : -1) * sg;
          wrapOpen = `<g><animateTransform attributeName="transform" type="rotate" values="0 ${px} ${py};${360 * dir} ${px} ${py}" dur="${s.anim.dur}s" ${begin} repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="rotate" values="0 0 0;${-360 * dir} 0 0" dur="${s.anim.dur}s" ${begin} repeatCount="indefinite"/>`;
          wrapClose = '</g>';
        } else if (s.anim.kind === 'sway') {
          const a = (s.anim.amp * k(it)).toFixed(1);
          wrapOpen = `<g><animateTransform attributeName="transform" type="translate" values="${-a} 0;${a} 0;${-a} 0" dur="${s.anim.dur}s" ${begin} repeatCount="indefinite" ${spline}/>`;
        } else if (s.anim.kind === 'bounce') {
          const up = (s.anim.amp * k(it)).toFixed(1);
          wrapOpen = `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 ${-up};0 0" dur="${s.anim.dur}s" ${begin} repeatCount="indefinite" ${spline}/>`;
        } else {
          const px = sg * (s.anim.pivot[0] - s.x) * k(it);
          const py = (s.anim.pivot[1] - s.y) * k(it);
          const a = s.anim.amp * sg;
          wrapOpen = `<g><animateTransform attributeName="transform" type="rotate" values="${-a} ${px} ${py};${a} ${px} ${py};${-a} ${px} ${py}" dur="${s.anim.dur}s" ${begin} repeatCount="indefinite" ${spline}/>`;
        }
      }
      if (pose === 'sleep') extra = `<g class="zzz" transform="translate(${-hipHeight(d.look) - 40} -90)"><text>z</text><text x="22" y="-26">z</text><text x="44" y="-56">Z</text></g>`;
    }
    const expr = this.expr.get(d.id) ?? (pose === 'sleep' ? 'sleep' : dragging ? 'surprised' : 'normal');
    const sh = pose === 'stand' || pose === 'held' ? shadow(dragging ? 70 : 96, dragging ? 16 : 22) : '';
    el.innerHTML = `${sh}<g class="bob">${wrapOpen}<g class="art${dragging ? ' wiggle' : ''}">${renderDoll(d.look, { pose, expr })}</g>${wrapClose}</g>${extra}</g>`;
    el.classList.toggle('sitting', pose === 'sit');
    el.classList.toggle('sleeping', pose === 'sleep');
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }

  private seatOf(d: Doll): { it: PlacedItem; s: SeatDef } | null {
    if (!d.seat) return null;
    const it = this.sc.items.find((i) => i.uid === d.seat!.uid);
    const s = it ? FURN_BY_ID[it.def]?.seats?.[d.seat.i] : undefined;
    return it && s ? { it, s } : null;
  }

  private validateSeats(): void {
    for (const d of this.dolls()) {
      if (d.seat && !this.seatOf(d)) {
        d.seat = null;
        d.y = Math.max(d.y, this.place.floorTop + 40);
      }
    }
  }

  /** Props saved sitting on a table remember which table they're on. */
  private adoptRests(): void {
    for (const it of this.sc.items) {
      const def = FURN_BY_ID[it.def];
      if (!def || def.mount !== 'prop' || it.rest) continue;
      const host = this.surfaceAt(it.x, it.y - 2, it, 6);
      if (host) it.rest = host.it.uid;
    }
  }

  private key(el: SVGGElement): number {
    if (this.drag && 'started' in this.drag && this.drag.started) {
      if ((this.drag.kind === 'item' && el.dataset.uid === String(this.drag.it.uid)) || (this.drag.kind === 'doll' && el.dataset.doll === this.drag.d.id)) return 1e7 + (el.classList.contains('front') ? 1 : 0);
      if (this.drag.kind === 'item' && this.drag.deps.some((x) => String(x.it.uid) === el.dataset.uid)) return 1e7 + 2;
    }
    if (el.dataset.doll) {
      const d = G.s.dolls.find((x) => x.id === el.dataset.doll);
      if (!d) return 0;
      const si = this.seatOf(d);
      if (si) return this.itemKey(si.it) + 0.3;
      return d.y + 0.1;
    }
    const it = this.sc.items.find((i) => String(i.uid) === el.dataset.uid);
    if (!it) return 0;
    return this.itemKey(it) + (el.classList.contains('front') ? 0.4 : 0);
  }

  private itemKey(it: PlacedItem, depth = 0): number {
    const def = FURN_BY_ID[it.def];
    if (def.mount === 'rug') return -1e5 + it.y;
    if (def.mount === 'wall') return -5e4 + it.y;
    if (it.rest && depth < 4) {
      const host = this.sc.items.find((x) => x.uid === it.rest);
      if (host) return this.itemKey(host, depth + 1) + 0.5 + it.x * 1e-5;
    }
    return it.y;
  }

  sort(): void {
    const kids = [...this.els.values()];
    kids.sort((a, b) => this.key(a) - this.key(b));
    for (const k of kids) this.worldG.appendChild(k);
  }

  // ---------------- coordinates ----------------
  toWorld(cx: number, cy: number): { x: number; y: number } {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  toScreen(x: number, y: number): { x: number; y: number } {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: p.x, y: p.y };
  }

  private clampX(x: number): number {
    const lo = Math.max(-280, this.vb.x + 50);
    const hi = Math.min(1880, this.vb.x + this.vb.w - 50);
    return Math.max(lo, Math.min(hi, x));
  }

  // ---------------- adding things ----------------
  addItem(defId: string, x: number, y: number): PlacedItem | null {
    if (this.sc.items.length >= MAX_ITEMS) {
      toast('This room is full! Put something away first.', 'home');
      return null;
    }
    const it: PlacedItem = { uid: G.s.nextUid++, def: defId, x, y };
    this.sc.items.push(it);
    this.syncItem(it);
    return it;
  }

  /** Called by the tray when a finger drags something out of it. */
  beginTrayDrag(kind: 'item' | 'doll', id: string, e: PointerEvent): void {
    this.hidePopup();
    const p = this.toWorld(e.clientX, e.clientY);
    this.pid = e.pointerId;
    if (kind === 'item') {
      const def = FURN_BY_ID[id];
      const it = this.addItem(id, p.x, p.y + (def.mount === 'floor' || def.mount === 'prop' ? def.h * 0.5 : 0));
      if (!it) return;
      this.drag = { kind: 'item', it, ox: it.x - p.x, oy: it.y - p.y, started: true, sx: e.clientX, sy: e.clientY, fromTray: true, deps: [] };
      sound.pick();
    } else {
      const d = G.s.dolls.find((x) => x.id === id);
      if (!d) return;
      d.place = this.place.id;
      d.seat = null;
      d.x = p.x;
      d.y = p.y + 140;
      this.drag = { kind: 'doll', d, ox: d.x - p.x, oy: d.y - p.y, started: true, sx: e.clientX, sy: e.clientY, fromTray: true };
      this.syncDoll(d);
      sound.giggle();
    }
    this.listen();
    this.hooks.onDragState(true);
    this.sort();
  }

  /** Drops something from the tray into the middle of the scene (for a plain tap). */
  dropIn(kind: 'item' | 'doll', id: string): void {
    const x = this.clampX(700 + Math.random() * 200);
    if (kind === 'item') {
      const def = FURN_BY_ID[id];
      const y = def.mount === 'wall' ? 200 : this.place.floorTop - 40;
      const it = this.addItem(id, x, def.mount === 'wall' ? 220 : -100);
      if (!it) return;
      if (def.mount === 'wall') {
        it.y = y;
        this.syncItem(it);
        this.sort();
        this.placed(it);
      } else this.settleItem(it, () => this.placed(it));
    } else {
      const d = G.s.dolls.find((v) => v.id === id);
      if (!d) return;
      d.place = this.place.id;
      d.seat = null;
      d.x = x;
      d.y = -150;
      this.syncDoll(d);
      // Land toward the front of the room so she isn't hidden behind furniture.
      this.settleDoll(d, this.place.floorTop + 130 + Math.random() * 60);
      sound.giggle();
      G.changed();
    }
  }

  private placed(it: PlacedItem): void {
    if ((this.place.room || this.place.yard || this.place.decor) && FURN_BY_ID[it.def].mount !== 'prop') G.bump('placeFurniture');
    else G.changed();
  }

  private listen(): void {
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  private unlisten(): void {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }

  // ---------------- pointer handling ----------------
  private onDown = (e: PointerEvent) => {
    if (this.drag) return;
    this.pid = e.pointerId;
    const t = e.target as Element;
    if (!t.closest('.scene-popup')) this.hidePopup();
    const p = this.toWorld(e.clientX, e.clientY);
    if (this.drawMode && this.place.id === 'school' && p.x > CHALK_BOX.x && p.x < CHALK_BOX.x + CHALK_BOX.w && p.y > CHALK_BOX.y && p.y < CHALK_BOX.y + CHALK_BOX.h) {
      e.preventDefault();
      const stroke: Stroke = { c: this.chalkColor, w: this.chalkColor === 'erase' ? 34 : 9, pts: [Math.round(p.x), Math.round(p.y)] };
      if (stroke.c === 'erase') stroke.c = '#2f6b55';
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('stroke', stroke.c);
      path.setAttribute('stroke-width', String(stroke.w));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', '0.92');
      this.chalkG.appendChild(path);
      this.drag = { kind: 'chalk', stroke, path };
      this.listen();
      return;
    }
    const dollEl = t.closest('.doll') as SVGGElement | null;
    const itemEl = t.closest('.it') as SVGGElement | null;
    if (dollEl) {
      const d = G.s.dolls.find((x) => x.id === dollEl.dataset.doll);
      if (!d) return;
      const fx = d.seat ? d.x : d.x;
      const fy = d.seat ? d.y + hipHeight(d.look) : d.y;
      this.drag = { kind: 'doll', d, ox: fx - p.x, oy: fy - p.y, started: false, sx: e.clientX, sy: e.clientY, fromTray: false };
    } else if (itemEl) {
      const it = this.sc.items.find((x) => String(x.uid) === itemEl.dataset.uid);
      if (!it) return;
      this.drag = { kind: 'item', it, ox: it.x - p.x, oy: it.y - p.y, started: false, sx: e.clientX, sy: e.clientY, fromTray: false, deps: [] };
    } else return;
    e.preventDefault();
    this.listen();
  };

  private onMove = (e: PointerEvent) => {
    const dr = this.drag;
    if (!dr || e.pointerId !== this.pid) return;
    const p = this.toWorld(e.clientX, e.clientY);
    if (dr.kind === 'chalk') {
      const pts = dr.stroke.pts;
      const lx = pts[pts.length - 2];
      const ly = pts[pts.length - 1];
      const x = Math.max(CHALK_BOX.x, Math.min(CHALK_BOX.x + CHALK_BOX.w, p.x));
      const y = Math.max(CHALK_BOX.y, Math.min(CHALK_BOX.y + CHALK_BOX.h, p.y));
      if (Math.hypot(x - lx, y - ly) > 4 && pts.length < 600) {
        pts.push(Math.round(x), Math.round(y));
        dr.path.setAttribute('d', strokeD(pts));
      }
      return;
    }
    if (!dr.started) {
      if (Math.hypot(e.clientX - dr.sx, e.clientY - dr.sy) < 8) return;
      dr.started = true;
      this.startDrag(dr);
    }
    const x = this.clampX(p.x + dr.ox);
    const y = Math.max(this.vb.y + 60, Math.min(this.vb.y + this.vb.h + 200, p.y + dr.oy));
    this.lookAt(x, y - 60, dr.kind === 'doll' ? dr.d : undefined);
    if (dr.kind === 'item') {
      dr.it.x = x;
      dr.it.y = y;
      this.moveItemEl(dr.it);
      for (const dep of dr.deps) {
        dep.it.x = x + dep.dx;
        dep.it.y = y + dep.dy;
        this.moveItemEl(dep.it);
      }
      for (const d of this.dollsOn(dr.it)) this.syncDoll(d);
    } else {
      dr.d.x = x;
      dr.d.y = y;
      this.els.get('d' + dr.d.id)?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    }
    const tray = this.hooks.trayRect();
    this.root.classList.toggle('over-tray', !!tray && e.clientY > tray.top + 10);
  };

  private startDrag(dr: Exclude<Drag, { kind: 'chalk' }>): void {
    this.hooks.onDragState(true);
    if (dr.kind === 'doll') {
      dr.d.seat = null;
      sound.pick();
      this.refreshUsers();
      this.syncDoll(dr.d);
    } else {
      dr.deps = this.dependents(dr.it).map((it) => ({ it, dx: it.x - dr.it.x, dy: it.y - dr.it.y }));
      this.els.get('i' + dr.it.uid)?.classList.add('lifted');
      sound.pick();
    }
    this.sort();
  }

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pid) return;
    const dr = this.drag;
    this.unlisten();
    this.drag = null;
    this.root.classList.remove('over-tray');
    if (!dr) return;
    if (dr.kind === 'chalk') {
      if (dr.stroke.pts.length >= 4) {
        const chalk = (this.sc.chalk ??= []);
        chalk.push(dr.stroke);
        if (chalk.length > 150) chalk.shift();
        G.bump('draw');
      } else dr.path.remove();
      return;
    }
    this.hooks.onDragState(false);
    if (!dr.started) {
      if (dr.kind === 'doll') this.tapDoll(dr.d, e);
      else this.tapItem(dr.it, e);
      return;
    }
    const tray = this.hooks.trayRect();
    const overTray = !!tray && e.clientY > tray.top + 10;
    if (dr.kind === 'doll') {
      if (overTray) return this.sendHome(dr.d);
      this.dropDoll(dr.d);
    } else {
      this.els.get('i' + dr.it.uid)?.classList.remove('lifted');
      if (overTray) return this.removeItem(dr.it);
      if (this.tryFeed(dr.it, e)) return;
      this.settleItem(dr.it, () => {
        if (dr.fromTray) this.placed(dr.it);
        else G.changed();
      });
      for (const dep of dr.deps) {
        const def = FURN_BY_ID[dep.it.def];
        if (def.mount === 'prop' && dep.it.rest !== dr.it.uid) this.settleItem(dep.it);
      }
      const def = FURN_BY_ID[dr.it.def];
      if (def.sfx === 'boing') sound.boing();
    }
  };

  private moveItemEl(it: PlacedItem): void {
    const tr = itemTransform(it);
    this.els.get('i' + it.uid)?.setAttribute('transform', tr);
    this.els.get('f' + it.uid)?.setAttribute('transform', tr);
  }

  private dollsOn(it: PlacedItem): Doll[] {
    return this.dolls().filter((d) => d.seat?.uid === it.uid);
  }

  private dependents(host: PlacedItem, depth = 0): PlacedItem[] {
    if (depth > 3) return [];
    const direct = this.sc.items.filter((i) => i.rest === host.uid);
    return direct.flatMap((d) => [d, ...this.dependents(d, depth + 1)]);
  }

  private refreshUsers(): void {
    for (const it of this.sc.items) if (FURN_BY_ID[it.def]?.animWhenUsed) this.syncItem(it);
  }

  // ---------------- dropping ----------------
  private floorY(y: number): number {
    return Math.max(this.place.floorTop + 30, Math.min(this.place.floorBottom, y));
  }

  private surfaceAt(x: number, y: number, self: PlacedItem, tol = 40): { it: PlacedItem; y: number } | null {
    let best: { it: PlacedItem; y: number } | null = null;
    const banned = new Set([self.uid, ...this.dependents(self).map((d) => d.uid)]);
    for (const it of this.sc.items) {
      if (banned.has(it.uid)) continue;
      const def = FURN_BY_ID[it.def];
      for (const s of def.surfaces ?? []) {
        const x1 = it.flip ? it.x - s.x2 * k(it) : it.x + s.x1 * k(it);
        const x2 = it.flip ? it.x - s.x1 * k(it) : it.x + s.x2 * k(it);
        const sy = it.y + s.y * k(it);
        if (x >= x1 + 6 && x <= x2 - 6 && sy >= y - tol && sy <= y + tol * 4 && (!best || sy < best.y)) best = { it, y: sy };
      }
    }
    return best;
  }

  /** Lets an item fall to the floor or onto a table, depending on what it is. */
  settleItem(it: PlacedItem, done?: () => void): void {
    const def = FURN_BY_ID[it.def];
    let target = it.y;
    it.rest = undefined;
    if (def.mount === 'wall') target = Math.max(-60, Math.min(this.place.floorTop - 30, it.y));
    else if (def.mount === 'rug') target = Math.max(this.place.floorTop + 20, Math.min(this.place.floorBottom + 10, it.y));
    else if (def.mount === 'prop') {
      const host = this.surfaceAt(it.x, it.y, it);
      if (host) {
        target = host.y;
        it.rest = host.it.uid;
      } else target = this.floorY(it.y < this.place.floorTop ? this.place.floorTop + 60 : it.y);
    } else target = this.floorY(it.y < this.place.floorTop ? this.place.floorTop + 70 : it.y);
    this.fall(it.y, target, (y) => {
      const dy = y - it.y;
      it.y = y;
      this.moveItemEl(it);
      for (const dep of this.dependents(it)) {
        dep.y += dy;
        this.moveItemEl(dep);
      }
      for (const d of this.dollsOn(it)) this.syncDoll(d);
    }, () => {
      this.sort();
      const el = this.els.get('i' + it.uid);
      el?.classList.remove('land');
      void el?.getBoundingClientRect();
      el?.classList.add('land');
      done?.();
    });
    this.sort();
  }

  private fall(from: number, to: number, step: (y: number) => void, done: () => void): void {
    const dist = to - from;
    if (Math.abs(dist) < 2) {
      step(to);
      done();
      return;
    }
    const ms = Math.max(120, Math.min(600, Math.sqrt(Math.abs(dist)) * 22));
    if (dist > 60) sound.drop();
    tween(ms, (t) => step(from + dist * (dist > 0 ? t * t : 1 - (1 - t) * (1 - t))), () => {
      if (dist > 120) sound.thud();
      done();
    });
  }

  private dropDoll(d: Doll): void {
    const hipY = d.y - hipHeight(d.look);
    let best: { it: PlacedItem; i: number; s: SeatDef; dist: number } | null = null;
    for (const it of this.sc.items) {
      const def = FURN_BY_ID[it.def];
      (def.seats ?? []).forEach((s, i) => {
        if (this.seatOwner(it, i)) return;
        const w = this.seatWorld(it, s);
        const dist = Math.hypot(w.x - d.x, w.y - hipY);
        const reach = s.pose === 'sleep' ? 170 : 130;
        if (dist < reach && (!best || dist < best.dist)) best = { it, i, s, dist };
      });
    }
    if (best) {
      const b = best as { it: PlacedItem; i: number; s: SeatDef };
      if (b.s.pose === 'slide') return this.slide(d, b.it, b.s);
      d.seat = { uid: b.it.uid, i: b.i };
      this.syncDoll(d);
      this.refreshUsers();
      this.sort();
      sound.pop();
      const id = b.it.def;
      if (FURN_BY_ID[b.it.def]?.cat === 'rides') G.bump('ride');
      if (b.s.pose === 'sleep') {
        G.bump('sleep');
        sound.snore();
      } else if (id === 'swings') G.bump('swing');
      else if (id === 'seesaw') G.bump('seesaw');
      else G.changed();
      if (b.s.pose !== 'sleep') this.setExpr(d, 'happy', 1400);
      return;
    }
    this.settleDoll(d);
  }

  private settleDoll(d: Doll, landY?: number): void {
    const target = this.floorY(landY ?? (d.y < this.place.floorTop ? this.place.floorTop + 50 : d.y));
    this.syncDoll(d);
    this.fall(d.y, target, (y) => {
      d.y = y;
      this.els.get('d' + d.id)?.setAttribute('transform', `translate(${d.x.toFixed(1)} ${y.toFixed(1)})`);
    }, () => {
      this.sort();
      const el = this.els.get('d' + d.id);
      el?.classList.remove('land');
      void el?.getBoundingClientRect();
      el?.classList.add('land');
      G.changed();
    });
    this.sort();
  }

  private slide(d: Doll, it: PlacedItem, s: SeatDef): void {
    const sg = it.flip ? -1 : 1;
    const pts = (s.path ?? []).map(([x, y]) => ({ x: it.x + sg * x, y: it.y + y }));
    if (pts.length < 2) return this.settleDoll(d);
    const lens: number[] = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = lens[lens.length - 1];
    const el = this.els.get('d' + d.id);
    if (!el) return;
    d.seat = null;
    el.querySelector('.art')!.innerHTML = renderDoll(d.look, { pose: 'sit', expr: 'happy' });
    el.querySelector('ellipse')?.setAttribute('opacity', '0');
    sound.whoosh();
    this.setExprSilently(d, 'happy');
    tween(1300, (t) => {
      const e = t * t * (1.4 - 0.4 * t);
      const L = e * total;
      let i = 1;
      while (i < lens.length - 1 && lens[i] < L) i++;
      const k = (L - lens[i - 1]) / Math.max(1, lens[i] - lens[i - 1]);
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k;
      const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k;
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      d.x = x;
      d.y = y + hipHeight(d.look);
    }, () => {
      d.x = this.clampX(pts[pts.length - 1].x + sg * 40);
      d.y = this.floorY(it.y + 20);
      this.syncDoll(d);
      this.sort();
      this.setExpr(d, 'happy', 1500);
      sound.giggle();
      const sp = this.toScreen(d.x, d.y - 200);
      burst('sparkle', sp.x, sp.y, 16);
      G.bump('slide');
    });
  }

  private tryFeed(it: PlacedItem, e: PointerEvent): boolean {
    const def = FURN_BY_ID[it.def];
    if (!def.food) return false;
    const hit = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest('.doll') as SVGGElement | null).find((el) => el && this.worldG.contains(el));
    const d = hit ? G.s.dolls.find((x) => x.id === hit.dataset.doll) : undefined;
    if (!d) return false;
    const el = this.els.get('i' + it.uid);
    const start = { x: it.x, y: it.y };
    const mouth = d.seat ? { x: d.x, y: d.y - (dollHeight(d.look) - hipHeight(d.look)) * 0.45 } : { x: d.x, y: d.y - dollHeight(d.look) * 0.55 };
    tween(280, (t) => {
      el?.setAttribute('transform', `translate(${(start.x + (mouth.x - start.x) * t).toFixed(1)} ${(start.y + (mouth.y - start.y) * t).toFixed(1)}) scale(${(1 - t * 0.9).toFixed(2)})`);
    }, () => {
      this.removeItem(it, true);
      this.setExpr(d, 'yum', 1600);
      sound.yum();
      const sp = this.toScreen(mouth.x, mouth.y);
      burst('heart', sp.x, sp.y, 10);
      G.bump('feed');
    });
    return true;
  }

  private sendHome(d: Doll): void {
    d.place = null;
    d.seat = null;
    const el = this.els.get('d' + d.id);
    el?.remove();
    this.els.delete('d' + d.id);
    sound.pop();
    this.refreshUsers();
    G.changed();
  }

  removeItem(it: PlacedItem, quiet = false): void {
    const deps = this.dependents(it).filter((x) => x.rest === it.uid);
    this.sc.items = this.sc.items.filter((x) => x.uid !== it.uid);
    for (const k of ['i', 'f']) {
      this.els.get(k + it.uid)?.remove();
      this.els.delete(k + it.uid);
    }
    for (const d of this.dollsOn(it)) {
      d.seat = null;
      d.y = this.floorY(it.y);
      this.syncDoll(d);
    }
    for (const dep of deps) this.settleItem(dep);
    if (!quiet) sound.pop();
    this.sort();
    G.changed();
  }

  // ---------------- taps ----------------
  private setExpr(d: Doll, e: Expr, ms: number): void {
    this.setExprSilently(d, e);
    this.syncDoll(d);
    const prev = this.exprTimers.get(d.id);
    if (prev) clearTimeout(prev);
    this.exprTimers.set(d.id, window.setTimeout(() => {
      this.expr.delete(d.id);
      if (d.place === this.place.id) this.syncDoll(d);
    }, ms));
  }

  private setExprSilently(d: Doll, e: Expr): void {
    this.expr.set(d.id, e);
  }

  private tapDoll(d: Doll, e: PointerEvent): void {
    sound.giggle();
    this.setExpr(d, Math.random() < 0.5 ? 'happy' : 'surprised', 1300);
    const el = this.els.get('d' + d.id);
    el?.classList.remove('hop');
    void el?.getBoundingClientRect();
    el?.classList.add('hop');
    const top = d.seat ? d.y - (dollHeight(d.look) - hipHeight(d.look)) : d.y - dollHeight(d.look);
    const sp = this.toScreen(d.x, top);
    burst('heart', sp.x, sp.y + 20, 5);
    void e;
    this.showPopup(sp.x, sp.y - 6, `<button class="pop-btn big" data-act="dress">${icon('hanger')}<span>Dress up ${esc(d.name)}</span></button>`, (act) => {
      if (act === 'dress') this.hooks.openCloset(d.id);
    });
  }

  private tapItem(it: PlacedItem, e: PointerEvent): void {
    const def = FURN_BY_ID[it.def];
    if (def.sfx === 'note') pianoNote(60 + [0, 2, 4, 5, 7, 9, 11, 12][Math.floor(Math.random() * 8)]);
    else if (def.sfx === 'boing') sound.boing();
    else if (def.sfx === 'squeak') sound.squeak();
    else if (def.sfx === 'ding' && !def.toggle) sound.ding();
    if (def.toggle) {
      it.on = !it.on;
      this.syncItem(it);
      if (it.on) {
        if (def.sfx === 'music') sound.tune();
        else if (def.sfx === 'ding') sound.ding();
        else sound.click();
        G.bump('toggle');
        if (def.spawn) this.spawnFrom(it, def);
      } else {
        sound.click();
        G.changed();
      }
    } else if (def.spawn) {
      this.spawnFrom(it, def);
    } else if (!def.sfx) sound.tap();
    const el = this.els.get('i' + it.uid);
    el?.classList.remove('wobble');
    void el?.getBoundingClientRect();
    el?.classList.add('wobble');
    void e;
    const topY = def.mount === 'floor' || def.mount === 'prop' ? it.y - def.h * k(it) : it.y - (def.h / 2) * k(it);
    const sp = this.toScreen(it.x, topY);
    const btns = [
      def.color ? `<button class="pop-btn" data-act="paint" title="Color">${icon('paint')}</button>` : '',
      `<button class="pop-btn" data-act="flip" title="Flip">${icon('flip')}</button>`,
      `<button class="pop-btn size" data-act="size" title="Size"><b>${k(it) > 1 ? 'L' : k(it) < 1 ? 'S' : 'M'}</b></button>`,
      `<button class="pop-btn" data-act="trash" title="Put away">${icon('trash')}</button>`,
    ].join('');
    this.showPopup(sp.x, sp.y, btns, (act) => {
      if (act === 'paint') {
        const cur = PALETTE.indexOf(it.color ?? def.color ?? '');
        it.color = PALETTE[(cur + 1) % PALETTE.length];
        this.syncItem(it);
        sound.spray();
        G.changed();
        return true;
      }
      if (act === 'flip') {
        it.flip = !it.flip;
        this.syncItem(it);
        for (const d of this.dollsOn(it)) this.syncDoll(d);
        sound.tap();
        G.changed();
        return true;
      }
      if (act === 'size') {
        it.scale = SIZES[(SIZES.indexOf(k(it)) + 1) % SIZES.length];
        if (it.scale === 1) delete it.scale;
        this.syncItem(it);
        for (const d of this.dollsOn(it)) this.syncDoll(d);
        for (const dep of this.dependents(it)) this.settleItem(dep);
        this.sort();
        sound.boing();
        const b = this.popup.querySelector('.pop-btn.size b');
        if (b) b.textContent = k(it) > 1 ? 'L' : k(it) < 1 ? 'S' : 'M';
        G.bump('resize');
        return true;
      }
      if (act === 'trash') this.removeItem(it);
      return false;
    });
  }

  private spawnFrom(it: PlacedItem, def: FurnDef): void {
    const list = def.spawn!;
    const id = list[Math.floor(Math.random() * list.length)];
    const dir = it.x > 800 ? -1 : 1;
    const p = this.addItem(id, this.clampX(it.x + dir * (def.w / 2 + 50)), it.y - def.h * 0.6);
    if (!p) return;
    sound.pop();
    const sp = this.toScreen(p.x, p.y);
    burst('sparkle', sp.x, sp.y, 10);
    this.settleItem(p, () => G.bump('spawn'));
  }

  // ---------------- small popups ----------------
  private showPopup(x: number, y: number, html: string, onAct: (act: string) => boolean | void): void {
    const pop = this.popup;
    const r = this.root.getBoundingClientRect();
    pop.innerHTML = `<div class="pop-in">${html}</div>`;
    pop.style.left = `${Math.max(70, Math.min(r.width - 70, x - r.left))}px`;
    pop.style.top = `${Math.max(90, y - r.top)}px`;
    pop.classList.add('show');
    pop.onpointerdown = (ev) => ev.stopPropagation();
    pop.onclick = (ev) => {
      const b = (ev.target as Element).closest('[data-act]') as HTMLElement | null;
      if (!b) return;
      const keep = onAct(b.dataset.act!);
      if (!keep) this.hidePopup();
      else this.armPopupTimer();
    };
    this.armPopupTimer();
  }

  private armPopupTimer(): void {
    if (this.popupTimer !== null) clearTimeout(this.popupTimer);
    this.popupTimer = window.setTimeout(() => this.hidePopup(), 3500);
  }

  hidePopup(): void {
    this.popup.classList.remove('show');
  }

  /** Called when the doll changed in the closet. */
  refreshDoll(id: string): void {
    const d = G.s.dolls.find((x) => x.id === id);
    if (d && d.place === this.place.id) this.syncDoll(d);
  }

  /** Lets a seated doll at the piano bob along while notes play. */
  pianoBounce(): void {
    for (const d of this.dolls()) {
      const si = this.seatOf(d);
      if (si && si.it.def === 'grandPiano') {
        const el = this.els.get('d' + d.id);
        el?.classList.remove('hop');
        void el?.getBoundingClientRect();
        el?.classList.add('hop');
      }
    }
  }

  /** Screen position above a doll's head, for effects. */
  dollTop(d: Doll): { x: number; y: number } {
    const top = d.seat ? d.y - (dollHeight(d.look) - hipHeight(d.look)) : d.y - dollHeight(d.look);
    return this.toScreen(d.x, top);
  }
}

function strokeD(pts: number[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0]} ${pts[1]}`;
  if (pts.length === 2) return d + ` l0.1 0.1`;
  for (let i = 2; i < pts.length; i += 2) d += ` L${pts[i]} ${pts[i + 1]}`;
  return d;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
