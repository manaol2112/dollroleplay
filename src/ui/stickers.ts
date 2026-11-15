// The sticker collection: winning a sticker (a little pop-up that peels in), the sticker book with a page per
// set, and "My Page", a free scrapbook page to stick, move, turn and resize stickers on.
import './stickers.css';
import { SET_BY_ID, STICKER_BY_ID, STICKER_SETS, pickSticker, setComplete, setProgress, stickerSvg, stickersInSet } from '../art/stickers';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, toast } from '../game';
import { frame } from './activities';
import { el, esc } from './dom';
import { icon } from './icons';

/** Coins for finishing a whole set, paid once per set. */
export const SET_BONUS = 50;
const MAX_ON_PAGE = 60;
const setFlag = (set: string) => `stickerSet:${set}`;

export const stickerCount = (): number => G.s.stickers.length;
/** Every different sticker found so far, in the order they were found. */
export const uniqueStickers = (): string[] => [...new Set(G.s.stickers)].filter((id) => STICKER_BY_ID[id]);
const countOf = (id: string) => G.s.stickers.reduce((n, x) => n + (x === id ? 1 : 0), 0);

/** Pays the set bonus the first time a set is full. Returns true if it just paid. */
function payBonus(set: string, from?: { x: number; y: number }): boolean {
  if (!setComplete(G.s.stickers, set) || G.s.stats[setFlag(set)]) return false;
  G.s.stats[setFlag(set)] = 1;
  G.earn(SET_BONUS, from);
  return true;
}

// ---------------- winning a sticker ----------------
let popQueue: (() => void)[] = [];
let popBusy = false;

/**
 * Gives the player a sticker (new ones strongly preferred) and shows it peeling in at the top of the screen.
 * `reason` is shown under it, e.g. "Read a book". Returns the sticker id.
 */
export function awardSticker(reason = '', opts: { quiet?: boolean } = {}): string {
  const id = pickSticker(G.s.stickers);
  const fresh = !G.s.stickers.includes(id);
  G.s.stickers.push(id);
  G.bump('sticker');
  const set = STICKER_BY_ID[id].set;
  const done = setComplete(G.s.stickers, set) && !G.s.stats[setFlag(set)];
  if (!opts.quiet) showPop(id, fresh, reason, done);
  else if (done) payBonus(set);
  return id;
}

function showPop(id: string, fresh: boolean, reason: string, setDone: boolean): void {
  const run = () => {
    popBusy = true;
    const def = STICKER_BY_ID[id];
    const title = !fresh ? 'Another one!' : def.rarity === 'sparkle' ? 'Sparkle sticker!!' : def.rarity === 'rare' ? 'Rare sticker!' : 'New sticker!';
    const wrap = el('div', `sk-pop ${def.rarity}`);
    wrap.innerHTML = `<div class="sk-pop-card"><div class="sk-pop-art">${stickerSvg(id, 120)}</div><div class="sk-pop-txt"><b>${title}</b><span>${esc(def.name)}${fresh ? '' : ` <em>×${countOf(id)}</em>`}</span>` +
      (setDone ? `<small class="gold">${icon('star')}${esc(SET_BY_ID[def.set].name)} set complete! +${SET_BONUS}</small>` : reason ? `<small>${esc(reason)}</small>` : '') + `</div></div>`;
    document.body.appendChild(wrap);
    const card = wrap.firstElementChild as HTMLElement;
    requestAnimationFrame(() => wrap.classList.add('show'));
    window.setTimeout(() => {
      const r = card.querySelector('.sk-pop-art')!.getBoundingClientRect();
      const at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      if (def.rarity === 'sparkle') {
        sound.success();
        burst('sparkle', at.x, at.y, 30);
      } else sound.sparkle();
      if (setDone) {
        payBonus(def.set, at);
        celebrate();
      }
    }, 380);
    let gone = false;
    const hide = () => {
      if (gone) return;
      gone = true;
      wrap.classList.remove('show');
      wrap.classList.add('hide');
      window.setTimeout(() => {
        wrap.remove();
        popBusy = false;
        popQueue.shift()?.();
      }, 320);
    };
    card.addEventListener('pointerdown', hide);
    window.setTimeout(hide, def.rarity === 'sparkle' || setDone ? 3300 : 2600);
  };
  if (popBusy) popQueue.push(run);
  else run();
}

// ---------------- the sticker book ----------------
const MINE = 'mine';
const RAR_SPARKLE = '<svg viewBox="0 0 20 20"><path d="M10 1 Q11.4 8.6 19 10 Q11.4 11.4 10 19 Q8.6 11.4 1 10 Q8.6 8.6 10 1Z" fill="#ffd36b" stroke="#e0a11e" stroke-width="1"/></svg>';
const RAR_RARE = '<svg viewBox="0 0 20 20"><path d="M5 3 L15 3 L19 8 L10 18 L1 8Z" fill="#9fd4ff" stroke="#5aa8e0" stroke-width="1" stroke-linejoin="round"/></svg>';
const pageIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="8" width="44" height="50" rx="8" fill="#fff" stroke="#ffb3d1" stroke-width="3"/><rect x="24" y="4" width="16" height="9" rx="2" fill="#c99bff" opacity=".8" transform="rotate(-8 32 8)"/><path d="M20 38 l6 -6 l6 6 l8 -10 l6 14Z" fill="#9de8cf"/><path d="${'M24 22 C24 17 31 17 31 22 C31 26 24 30 24 30 C24 30 17 26 17 22 C17 17 24 17 24 22Z'}" fill="#ff7eb6" transform="translate(16 -2)"/></svg>`;

/** The sticker album: a page per set with every sticker's slot, plus "My Page" to decorate. */
export function openStickerBook(onClose: () => void): void {
  let cleanup: (() => void) | null = null;
  const fr = frame('sk-book', 'Sticker Book', () => {
    cleanup?.();
    onClose();
  });
  const firstSet = STICKER_SETS.find((s) => setProgress(G.s.stickers, s.id).found > 0)?.id ?? STICKER_SETS[0].id;
  let tab = firstSet;
  fr.body.innerHTML = `<div class="sk-wrap"><div class="sk-tabs"></div><div class="sk-stage"></div></div>`;
  const tabsEl = fr.body.querySelector('.sk-tabs') as HTMLDivElement;
  const stage = fr.body.querySelector('.sk-stage') as HTMLDivElement;
  const order = [...STICKER_SETS.map((s) => s.id), MINE];

  const drawTabs = () => {
    tabsEl.innerHTML = order.map((id) => {
      if (id === MINE) return `<button class="sk-tab mine${tab === id ? ' on' : ''}" data-tab="${MINE}" style="--c:#ffb3d1"><span class="ic">${pageIcon}</span><span class="nm">My Page</span></button>`;
      const set = SET_BY_ID[id];
      const p = setProgress(G.s.stickers, id);
      const cover = stickersInSet(id).find((s) => G.s.stickers.includes(s.id)) ?? stickersInSet(id)[0];
      return `<button class="sk-tab${tab === id ? ' on' : ''}${p.found === p.total ? ' full' : ''}" data-tab="${id}" style="--c:${set.color}"><span class="ic">${stickerSvg(cover.id, 50, { still: true, silhouette: p.found === 0 })}</span>` +
        `<span class="nm">${p.found === p.total ? icon('star') : `${p.found}/${p.total}`}</span></button>`;
    }).join('');
  };

  const show = (id: string, dir = 0) => {
    cleanup?.();
    cleanup = null;
    tab = id;
    drawTabs();
    tabsEl.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (id === MINE) {
      fr.setTitle('My Sticker Page');
      cleanup = myPage(stage);
    } else {
      fr.setTitle('Sticker Book');
      setPage(stage, id, dir);
    }
  };

  const step = (d: number) => {
    const i = order.indexOf(tab);
    const j = (i + d + order.length) % order.length;
    sound.whoosh();
    show(order[j], d);
  };

  tabsEl.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-tab]') as HTMLElement | null;
    if (!b || b.dataset.tab === tab) return;
    sound.tap();
    const d = order.indexOf(b.dataset.tab!) - order.indexOf(tab);
    show(b.dataset.tab!, Math.sign(d));
  });

  // Album pages: arrows, swipes and taps on the stickers.
  let swipe: { id: number; x: number; y: number; moved: boolean } | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (tab === MINE) return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  stage.addEventListener('pointermove', (e) => {
    if (swipe && e.pointerId === swipe.id && Math.hypot(e.clientX - swipe.x, e.clientY - swipe.y) > 14) swipe.moved = true;
  });
  stage.addEventListener('pointerup', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => (swipe = null));
  stage.addEventListener('click', (e) => {
    if (tab === MINE || swipe?.moved) return;
    const t = e.target as Element;
    if (t.closest('[data-prev]')) return step(-1);
    if (t.closest('[data-next]')) return step(1);
    const slot = t.closest('[data-slot]') as HTMLElement | null;
    if (!slot || !slot.isConnected) return;
    slot.classList.remove('wiggle', 'nope');
    void slot.offsetWidth;
    if (slot.classList.contains('found')) {
      slot.classList.add('wiggle');
      const r = slot.getBoundingClientRect();
      burst('heart', r.left + r.width / 2, r.top + r.height * 0.4, 6);
      sound.giggle();
    } else {
      slot.classList.add('nope');
      sound.squeak();
      toast('Keep playing to find this sticker!', 'question');
    }
  });

  show(tab);
}

function setPage(stage: HTMLElement, id: string, dir: number): void {
  const set = SET_BY_ID[id];
  const list = stickersInSet(id);
  const p = setProgress(G.s.stickers, id);
  const full = p.found === p.total;
  const counts = new Map<string, number>();
  for (const s of G.s.stickers) counts.set(s, (counts.get(s) ?? 0) + 1);
  stage.innerHTML = `<div class="sk-album ${dir > 0 ? 'turn-next' : dir < 0 ? 'turn-prev' : ''}${full ? ' full' : ''}" style="--c:${set.color}">
    <div class="sk-page-head"><button class="round-btn" data-prev aria-label="Previous page">${icon('back')}</button>
      <div class="sk-title"><h3>${esc(set.name)}</h3>${full ? `<div class="sk-ribbon">${icon('star')}<span>Set complete!</span>${icon('star')}</div>` : `<div class="sk-prog"><div class="bar"><i style="width:${(p.found / p.total) * 100}%"></i></div><span>${p.found} / ${p.total}</span></div>`}</div>
      <button class="round-btn next" data-next aria-label="Next page">${icon('back')}</button></div>
    <div class="sk-grid n${list.length}">${list.map((s) => {
      const n = counts.get(s.id) ?? 0;
      return `<button class="sk-slot ${n ? 'found' : 'missing'} ${s.rarity}" data-slot="${s.id}"><span class="art"><span class="sq">${stickerSvg(s.id, 120, { silhouette: !n })}${n > 1 ? `<i class="sk-count">×${n}</i>` : ''}</span></span>` +
        `<span class="nm">${s.rarity !== 'common' ? `<i class="sk-rar">${s.rarity === 'sparkle' ? RAR_SPARKLE : RAR_RARE}</i>` : ''}${n ? esc(s.name) : '? ? ?'}</span></button>`;
    }).join('')}</div></div>`;
  if (full && !G.s.stats[setFlag(id)]) {
    // Finished some other way (or before bonuses existed): pay it now, with a party.
    window.setTimeout(() => {
      const r = stage.querySelector('.sk-ribbon')?.getBoundingClientRect();
      if (payBonus(id, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)) {
        celebrate();
        sound.success();
        toast(`You finished the ${set.name} set! +${SET_BONUS} coins`, 'star', true);
      }
    }, 450);
  }
}

// ---------------- My Page: the free scrapbook ----------------
type Placed = NonNullable<typeof G.s.stickerPage>[number];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function myPage(stage: HTMLElement): () => void {
  const page: Placed[] = (G.s.stickerPage ??= []).filter((p) => STICKER_BY_ID[p.id]);
  G.s.stickerPage = page;
  const mine = uniqueStickers();
  stage.innerHTML = `<div class="sk-mine">
    <div class="sk-paper-area"><div class="sk-paper"><div class="sk-paper-hint">${mine.length ? 'Drag stickers up here!' : 'Your page is waiting for stickers!'}</div><div class="sk-layer"></div>
      <div class="sk-trash" aria-label="Drag here to remove">${icon('trash')}</div></div></div>
    <div class="sk-tools"><span class="sk-tools-hint">${mine.length ? `${icon('heart')}Tap a sticker to make it bigger, smaller or turn it` : ''}</span><button class="sk-tool" data-tool="smaller" aria-label="Smaller"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#fff"/><circle cx="32" cy="32" r="9" fill="#c99bff"/><path d="M14 32 L22 32 M42 32 L50 32" stroke="#ff7eb6" stroke-width="5" stroke-linecap="round"/></svg></button>
      <button class="sk-tool" data-tool="bigger" aria-label="Bigger"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#fff"/><circle cx="32" cy="32" r="17" fill="#c99bff"/><path d="M32 24 L32 40 M24 32 L40 32" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg></button>
      <button class="sk-tool" data-tool="left" aria-label="Turn left"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#fff"/><path d="M44 40 A14 14 0 1 0 22 22" fill="none" stroke="#5fd3b5" stroke-width="6" stroke-linecap="round"/><path d="M14 16 L24 28 L28 14Z" fill="#5fd3b5" stroke="#5fd3b5" stroke-width="3" stroke-linejoin="round"/></svg></button>
      <button class="sk-tool" data-tool="right" aria-label="Turn right"><svg viewBox="0 0 64 64"><g transform="translate(64 0) scale(-1 1)"><circle cx="32" cy="32" r="26" fill="#fff"/><path d="M44 40 A14 14 0 1 0 22 22" fill="none" stroke="#5fd3b5" stroke-width="6" stroke-linecap="round"/><path d="M14 16 L24 28 L28 14Z" fill="#5fd3b5" stroke="#5fd3b5" stroke-width="3" stroke-linejoin="round"/></g></svg></button>
      <button class="sk-tool del" data-tool="delete" aria-label="Remove">${icon('trash')}</button></div>
    <div class="sk-tray">${mine.length ? mine.map((id) => `<button class="sk-chip" data-add="${id}">${stickerSvg(id, 76, { still: true })}</button>`).join('') : `<p class="sk-empty">${icon('star')}Win stickers by reading books, finishing challenges and opening the surprise box!</p>`}</div></div>`;

  const area = stage.querySelector('.sk-paper-area') as HTMLDivElement;
  const paper = stage.querySelector('.sk-paper') as HTMLDivElement;
  const layer = stage.querySelector('.sk-layer') as HTMLDivElement;
  const trash = stage.querySelector('.sk-trash') as HTMLDivElement;
  const tools = stage.querySelector('.sk-tools') as HTMLDivElement;
  const tray = stage.querySelector('.sk-tray') as HTMLDivElement;
  let sel = -1;

  // The page keeps a 4:3 shape so stickers stay where they were put on any screen.
  const fit = () => {
    const w = area.clientWidth;
    const h = area.clientHeight;
    const pw = Math.max(0, Math.min(w, (h * 4) / 3));
    paper.style.width = `${pw}px`;
    paper.style.height = `${(pw * 3) / 4}px`;
    paper.style.setProperty('--base', `${pw * 0.16}px`);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(area);
  fit();

  const save = () => {
    G.s.stickerPage = page;
    G.changed();
  };
  const styleOf = (p: Placed) => `left:${p.x * 100}%;top:${p.y * 100}%;transform:translate(-50%,-50%) rotate(${p.r}deg) scale(${p.s})`;
  const draw = () => {
    layer.innerHTML = page.map((p, i) => `<div class="sk-placed${i === sel ? ' sel' : ''}" data-i="${i}" style="${styleOf(p)}">${stickerSvg(p.id, 100, { still: true })}</div>`).join('');
    paper.classList.toggle('empty', page.length === 0);
    tools.classList.toggle('show', sel >= 0);
  };
  const restyle = (i: number) => {
    const n = layer.querySelector(`[data-i="${i}"]`) as HTMLElement | null;
    if (n) n.setAttribute('style', styleOf(page[i]));
  };
  /** Moves a sticker to the top of the pile and selects it. */
  const lift = (i: number) => {
    const [p] = page.splice(i, 1);
    page.push(p);
    sel = page.length - 1;
    draw();
    return sel;
  };
  const inTrash = (x: number, y: number) => {
    const r = trash.getBoundingClientRect();
    return x > r.left - 16 && x < r.right + 16 && y > r.top - 16 && y < r.bottom + 16;
  };
  const toPage = (x: number, y: number) => {
    const r = paper.getBoundingClientRect();
    return { x: (x - r.left) / r.width, y: (y - r.top) / r.height, inside: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom };
  };
  const remove = (i: number) => {
    const n = layer.querySelector(`[data-i="${i}"]`) as HTMLElement | null;
    const r = n?.getBoundingClientRect();
    if (r) burst('sparkle', r.left + r.width / 2, r.top + r.height / 2, 12);
    page.splice(i, 1);
    sel = -1;
    sound.whoosh();
    draw();
    save();
  };
  const add = (id: string, x: number, y: number) => {
    if (page.length >= MAX_ON_PAGE) {
      sound.wrong();
      toast('Your page is full! Remove a sticker first.', 'trash');
      return;
    }
    page.push({ id, x: clamp(x, 0.04, 0.96), y: clamp(y, 0.05, 0.95), r: Math.round(Math.random() * 24 - 12), s: 1 });
    sel = page.length - 1;
    sound.drop();
    draw();
    layer.lastElementChild?.classList.add('stuck');
    save();
  };

  // Moving, pinching and trashing stickers on the page.
  const ptrs = new Map<number, { x: number; y: number }>();
  let drag: { i: number; id: number; dx: number; dy: number; moved: boolean } | null = null;
  let pinch: { i: number; d: number; a: number; s: number; r: number } | null = null;
  const pair = () => {
    const [a, b] = [...ptrs.values()];
    return { d: Math.hypot(b.x - a.x, b.y - a.y), a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
  };
  paper.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const hit = (e.target as Element).closest('.sk-placed') as HTMLElement | null;
    if (ptrs.size === 2 && sel >= 0) {
      // Two fingers: pinch to resize and twist to turn the chosen sticker.
      drag = null;
      const { d, a } = pair();
      pinch = { i: sel, d, a, s: page[sel].s, r: page[sel].r };
      return;
    }
    if (ptrs.size > 1) return;
    if (!hit) {
      if (sel >= 0) {
        sel = -1;
        draw();
      }
      return;
    }
    paper.setPointerCapture(e.pointerId);
    const i = lift(Number(hit.dataset.i));
    const pos = toPage(e.clientX, e.clientY);
    drag = { i, id: e.pointerId, dx: page[i].x - pos.x, dy: page[i].y - pos.y, moved: false };
    sound.pick();
  });
  paper.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const { d, a } = pair();
      const p = page[pinch.i];
      p.s = clamp((pinch.s * d) / Math.max(1, pinch.d), 0.45, 2.6);
      p.r = Math.round(pinch.r + a - pinch.a);
      restyle(pinch.i);
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    const pos = toPage(e.clientX, e.clientY);
    const p = page[drag.i];
    p.x = clamp(pos.x + drag.dx, 0, 1);
    p.y = clamp(pos.y + drag.dy, 0, 1);
    drag.moved = true;
    restyle(drag.i);
    const over = inTrash(e.clientX, e.clientY);
    trash.classList.toggle('hot', over);
    layer.querySelector(`[data-i="${drag.i}"]`)?.classList.toggle('doomed', over);
  });
  const up = (e: PointerEvent) => {
    ptrs.delete(e.pointerId);
    if (pinch) {
      if (ptrs.size < 2) {
        pinch = null;
        save();
      }
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    trash.classList.remove('hot');
    if (d.moved && inTrash(e.clientX, e.clientY)) return remove(d.i);
    if (d.moved) {
      sound.drop();
      save();
    }
  };
  paper.addEventListener('pointerup', up);
  paper.addEventListener('pointercancel', up);

  tools.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-tool]') as HTMLElement | null;
    if (!b || sel < 0 || !page[sel]) return;
    const p = page[sel];
    const t = b.dataset.tool;
    if (t === 'delete') return remove(sel);
    if (t === 'bigger') p.s = clamp(Math.round((p.s + 0.25) * 100) / 100, 0.45, 2.6);
    if (t === 'smaller') p.s = clamp(Math.round((p.s - 0.25) * 100) / 100, 0.45, 2.6);
    if (t === 'left') p.r -= 15;
    if (t === 'right') p.r += 15;
    sound.click();
    restyle(sel);
    save();
  });

  // Dragging new stickers up from the tray (sideways swipes still scroll the tray). A tap sticks one in the middle.
  let ghost: { el: HTMLDivElement; id: string; pid: number } | null = null;
  let press: { id: string; pid: number; x: number; y: number; chip: HTMLElement } | null = null;
  tray.addEventListener('pointerdown', (e) => {
    const chip = (e.target as Element).closest('[data-add]') as HTMLElement | null;
    if (!chip || ghost) return;
    press = { id: chip.dataset.add!, pid: e.pointerId, x: e.clientX, y: e.clientY, chip };
  });
  const startGhost = (e: PointerEvent) => {
    if (!press) return;
    const g = el('div', 'sk-ghost', stickerSvg(press.id, 100, { still: true }));
    const size = paper.getBoundingClientRect().width * 0.16;
    g.style.width = g.style.height = `${size}px`;
    document.body.appendChild(g);
    ghost = { el: g, id: press.id, pid: press.pid };
    try {
      press.chip.setPointerCapture(press.pid);
    } catch {
      /* the browser already captured it */
    }
    moveGhost(e);
    sound.pick();
    if (sel >= 0) {
      sel = -1;
      draw();
    }
  };
  const moveGhost = (e: PointerEvent) => {
    if (!ghost) return;
    ghost.el.style.left = `${e.clientX}px`;
    ghost.el.style.top = `${e.clientY}px`;
  };
  tray.addEventListener('pointermove', (e) => {
    if (ghost && e.pointerId === ghost.pid) {
      e.preventDefault();
      return moveGhost(e);
    }
    if (!press || e.pointerId !== press.pid) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (dy < -12 && Math.abs(dy) > Math.abs(dx)) startGhost(e);
    else if (Math.abs(dx) > 14) press = null; // scrolling the tray
  });
  const trayUp = (e: PointerEvent) => {
    if (ghost && e.pointerId === ghost.pid) {
      const g = ghost;
      ghost = null;
      press = null;
      g.el.remove();
      const pos = toPage(e.clientX, e.clientY);
      if (pos.inside && e.type === 'pointerup') add(g.id, pos.x, pos.y);
      return;
    }
    if (press && e.pointerId === press.pid && e.type === 'pointerup') {
      const id = press.id;
      press = null;
      add(id, 0.5 + (Math.random() - 0.5) * 0.3, 0.45 + (Math.random() - 0.5) * 0.3);
    }
    press = null;
  };
  tray.addEventListener('pointerup', trayUp);
  tray.addEventListener('pointercancel', trayUp);

  draw();
  return () => {
    ro.disconnect();
    ghost?.el.remove();
  };
}
