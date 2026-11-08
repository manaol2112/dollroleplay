// Pop-up panels: the boutique shop, challenges, settings, the season picker, school lessons and the piano.
import { HAIR } from '../art/doll';
import { FURNITURE, FURN_BY_ID, type FurnCat, furnThumb } from '../art/furniture';
import { FURN_STYLES } from '../art/furn/kit';
import { FLOORS, WALLS } from '../art/scenes';
import { WEAR_BY_ID, flowerG, heartD, starD, wearFor } from '../art/wear';
import { wornOf } from '../data/looks';
import { GRADES, GRADE_NAME, type Grade, type Question, type Visual, coinsFor, makeQuestion, type Pic } from '../data/quiz';
import { BLACK_KEYS, SONGS, WHITE_KEYS, type Song } from '../data/songs';
import { activeChallenges, claim, claimDaily, dailyReady, DAILY_GIFT, isDone, progressOf } from '../data/state';
import { CHORDS, type Drum, type Instrument, drum, duckMusic, playNote, sound, strum } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, coinFly, toast } from '../game';
import { SEASONS, type Look, type Season, type Slot } from '../types';
import { confirmBox, el, esc, floorThumb, lookThumb, openModal, slotBox, still, wallThumb } from './dom';
import { icon } from './icons';

export const SEASON_ICON: Record<Season, string> = { spring: 'flower', summer: 'sun', fall: 'leaf', winter: 'snow' };
export const SEASON_NAME: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };

// ---------------- shop ----------------
type ShopTab = Slot | 'hair' | 'furniture' | 'rooms';
interface ShopItem { key: string; name: string; price: number; thumb: () => string; season: boolean }

const SHOP_TABS: { id: ShopTab; name: string; icon: string }[] = [
  { id: 'dress', name: 'Dresses', icon: 'dress' },
  { id: 'top', name: 'Tops', icon: 'shirt' },
  { id: 'bottom', name: 'Bottoms', icon: 'pants' },
  { id: 'outer', name: 'Coats', icon: 'coat' },
  { id: 'shoes', name: 'Shoes', icon: 'shoe' },
  { id: 'head', name: 'Hats & Bows', icon: 'crown' },
  { id: 'face', name: 'Glasses', icon: 'glasses' },
  { id: 'neck', name: 'Necklaces', icon: 'necklace' },
  { id: 'hand', name: 'Hold', icon: 'wand' },
  { id: 'back', name: 'Wings & Bags', icon: 'wings' },
  { id: 'hair', name: 'Hairstyles', icon: 'hair' },
  { id: 'furniture', name: 'Furniture', icon: 'sofa' },
  { id: 'rooms', name: 'Rooms', icon: 'wallpaper' },
];

function shopItems(tab: ShopTab, model: Look): ShopItem[] {
  const season = G.s.season;
  const wearThumb = (id: string, slot: Slot) => () => {
    const l: Look = { ...model, wear: { ...model.wear, [slot]: wornOf(id) } };
    if (slot === 'dress') {
      delete l.wear.top;
      delete l.wear.bottom;
    }
    if (slot === 'top' || slot === 'bottom') delete l.wear.dress;
    const box = slot === 'hand' || slot === 'back' ? slotBox(l, 'full') : slotBox(l, slot === 'face' ? 'face' : slot);
    return lookThumb(l, box, { headOnly: slot === 'face' || slot === 'head' });
  };
  let list: ShopItem[];
  if (tab === 'hair') list = HAIR.filter((h) => h.price).map((h) => ({ key: 'hair:' + h.id, name: h.name, price: h.price, thumb: () => lookThumb({ ...model, hair: h.id }, slotBox(model, 'hair'), { headOnly: true }), season: false }));
  else if (tab === 'furniture') list = FURNITURE.filter((f) => f.price).map((f) => ({ key: f.id, name: f.name, price: f.price, thumb: () => furnThumb(f), season: (season === 'winter' && ['xmasTree', 'fireplace', 'snowman'].includes(f.id)) || (season === 'fall' && f.id === 'pumpkin') }));
  else if (tab === 'rooms') list = [
    ...WALLS.filter((w) => w.price).map((w) => ({ key: 'wall:' + w.id, name: w.name + ' wallpaper', price: w.price, thumb: () => wallThumb(w.id), season: false })),
    ...FLOORS.filter((f) => f.price).map((f) => ({ key: 'floor:' + f.id, name: f.name + ' floor', price: f.price, thumb: () => floorThumb(f.id), season: false })),
  ];
  else list = wearFor(tab).filter((w) => w.price).map((w) => ({ key: w.id, name: w.name, price: w.price, thumb: wearThumb(w.id, tab), season: !!w.tags?.includes(season) }));
  // This season's things first, keeping catalog order otherwise.
  return list.map((x, i) => ({ x, i })).sort((a, b) => Number(b.x.season) - Number(a.x.season) || a.i - b.i).map((v) => v.x);
}

export function openShop(): void {
  let tab: ShopTab = 'dress';
  let hideOwned = false;
  const m = openModal('shop', `<div class="shop-head"><h2>${icon('bag')}Boutique</h2><div class="coins-big">${icon('coin')}<span></span></div><button class="round-btn" data-close>${icon('close')}</button></div>
    <div class="shop-tabs"></div><div class="shop-bar"><span class="count"></span><button class="chip" data-hide>${icon('check')}<span>Hide what I have</span></button></div><div class="shop-grid"></div>`);
  const model = G.s.dolls[0]?.look;
  let lazy: IntersectionObserver | null = null;
  let thumbs = new Map<string, () => string>();
  const render = (keepScroll = false) => {
    const grid = m.box.querySelector('.shop-grid') as HTMLDivElement;
    const scroll = grid.scrollTop;
    m.box.querySelector('.coins-big span')!.textContent = String(G.s.coins);
    m.box.querySelector('.shop-tabs')!.innerHTML = SHOP_TABS.map((t) => `<button class="tab${t.id === tab ? ' on' : ''}" data-tab="${t.id}">${icon(t.icon)}<span>${t.name}</span></button>`).join('');
    m.box.querySelector('[data-hide]')!.classList.toggle('on', hideOwned);
    const all = shopItems(tab, model);
    const items = hideOwned ? all.filter((it) => !G.owns(it.key)) : all;
    const owned = all.filter((it) => G.owns(it.key)).length;
    m.box.querySelector('.count')!.textContent = `${all.length} to collect · you have ${owned}`;
    thumbs = new Map(items.map((it) => [it.key, it.thumb]));
    grid.innerHTML = items.map((it) => {
      const own = G.owns(it.key);
      return `<div class="shop-card${own ? ' owned' : ''}">${it.season ? `<span class="ribbon">${icon(SEASON_ICON[G.s.season])}${SEASON_NAME[G.s.season]}</span>` : ''}<div class="thumb" data-thumb="${esc(it.key)}"><i class="thumb-wait"></i></div><div class="nm">${esc(it.name)}</div>` +
        (own ? `<div class="owned-tag">${icon('check')}Yours</div>` : `<button class="btn buy${G.s.coins < it.price ? ' poor' : ''}" data-buy="${esc(it.key)}">${icon('coin')}${it.price}</button>`) + `</div>`;
    }).join('') || `<p class="hint">You have everything here! Wow!</p>`;
    lazy?.disconnect();
    lazy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        lazy!.unobserve(el);
        const fn = thumbs.get(el.dataset.thumb!);
        if (fn) el.innerHTML = fn();
      }
    }, { root: grid, rootMargin: '400px 0px' });
    grid.querySelectorAll('[data-thumb]').forEach((el) => lazy!.observe(el));
    if (keepScroll) grid.scrollTop = scroll;
  };
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tb = t.closest('[data-tab]') as HTMLElement | null;
    if (tb) {
      tab = tb.dataset.tab as ShopTab;
      sound.tap();
      render();
      m.box.querySelector('.shop-grid')!.scrollTop = 0;
      return;
    }
    if (t.closest('[data-hide]')) {
      hideOwned = !hideOwned;
      sound.tap();
      render();
      return;
    }
    const b = t.closest('[data-buy]') as HTMLElement | null;
    if (b && G.buy(b.dataset.buy!)) {
      const r = b.getBoundingClientRect();
      burst('confetti', r.left + r.width / 2, r.top, 36);
      sound.sparkle();
      const key = b.dataset.buy!;
      const name = WEAR_BY_ID[key]?.name ?? FURN_BY_ID[key]?.name ?? 'It';
      toast(`${name} is yours!${FURN_BY_ID[key] ? ' Find it in your house tray.' : WEAR_BY_ID[key] ? ' Try it on in the closet.' : ''}`, 'bag');
      render(true);
    }
  });
  render();
}

// ---------------- challenges ----------------
export function openChallenges(): void {
  const m = openModal('challenges', `<div class="shop-head"><h2>${icon('star')}Challenges</h2><div class="coins-big">${icon('coin')}<span></span></div><button class="round-btn" data-close>${icon('close')}</button></div><div class="ch-list"></div>`);
  const render = () => {
    m.box.querySelector('.coins-big span')!.textContent = String(G.s.coins);
    const gift = dailyReady(G.s)
      ? `<div class="ch-card gift"><div class="ch-ic">${icon('gift')}</div><div class="ch-body"><b>Daily gift!</b><span>A present is waiting for you today.</span></div><button class="btn primary" data-daily>${icon('coin')}+${DAILY_GIFT}</button></div>`
      : '';
    m.box.querySelector('.ch-list')!.innerHTML = gift + activeChallenges(G.s).map((c) => {
      const p = progressOf(G.s, c);
      const done = isDone(G.s, c);
      return `<div class="ch-card${done ? ' done' : ''}${c.season ? ' seasonal' : ''}"><div class="ch-ic">${icon(c.icon)}</div><div class="ch-body"><b>${esc(c.text)}</b>${c.season ? `<em>${SEASON_NAME[c.season]} special</em>` : ''}<div class="bar"><i style="width:${(p / c.target) * 100}%"></i></div><span>${p} / ${c.target}</span></div>` +
        (done ? `<button class="btn primary" data-claim="${c.id}">${icon('coin')}+${c.reward}</button>` : `<div class="reward">${icon('coin')}${c.reward}</div>`) + `</div>`;
    }).join('') + `<p class="hint">Finish challenges to earn coins, then spend them at the Boutique!</p>`;
  };
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    const b = t.closest('[data-claim]') as HTMLElement | null;
    const d = t.closest('[data-daily]') as HTMLElement | null;
    const r = (b ?? d)?.getBoundingClientRect();
    const from = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined;
    if (b) {
      const got = claim(G.s, b.dataset.claim!);
      if (got) {
        sound.success();
        celebrate();
        coinFly(got, from);
        G.changed();
        render();
      }
    }
    if (d) {
      const got = claimDaily(G.s);
      if (got) {
        sound.success();
        coinFly(got, from);
        G.changed();
        render();
      }
    }
  });
  render();
}

// ---------------- settings ----------------
export function openSettings(onReset: () => void): void {
  const m = openModal('settings', `<div class="shop-head"><h2>${icon('gear')}Settings</h2><button class="round-btn" data-close>${icon('close')}</button></div>
    <div class="set-list">
      <button class="set-row" data-set="sound">${icon('sound')}<span>Sounds</span><i class="tog"></i></button>
      <button class="set-row" data-set="music">${icon('music')}<span>Music</span><i class="tog"></i></button>
      <div class="tip">${icon('heart')}<span>To play like an app on iPad or iPhone, open this page in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</span></div>
      <button class="set-row danger" data-reset>${icon('trash')}<span>Start a brand new game</span></button>
    </div>`);
  const render = () => m.box.querySelectorAll<HTMLElement>('[data-set]').forEach((b) => b.classList.toggle('on', G.s.settings[b.dataset.set as 'sound' | 'music']));
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    const b = t.closest('[data-set]') as HTMLElement | null;
    if (b) {
      const k = b.dataset.set as 'sound' | 'music';
      G.setSettings(k, !G.s.settings[k]);
      sound.tap();
      render();
    }
    if (t.closest('[data-reset]')) {
      confirmBox('Start over?', 'All your friends, rooms and coins will go back to the beginning. This cannot be undone.', `${icon('trash')}<span>Start over</span>`, '', () => {
        m.close();
        onReset();
      }, 'Keep playing');
    }
  });
  render();
}

// ---------------- season picker ----------------
export function openSeasons(onPick: (s: Season) => void): void {
  const m = openModal('seasons', `<h2>Pick a season</h2><div class="season-grid">${SEASONS.map((s) => `<button class="season-btn s-${s}${s === G.s.season ? ' on' : ''}" data-season="${s}">${icon(SEASON_ICON[s])}<span>${SEASON_NAME[s]}</span></button>`).join('')}</div>`);
  m.box.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-season]') as HTMLElement | null;
    if (!b) return;
    m.close();
    onPick(b.dataset.season as Season);
  });
}

// ---------------- school lesson ----------------
const picSvg = (p: Pic) => {
  const art: Record<Pic, string> = {
    apple: FURN_BY_ID.apple.art('', false),
    cupcake: FURN_BY_ID.cupcake.art('', false),
    star: `<path d="${starD(0, -26, 24)}" fill="#ffd24a"/>`,
    heart: `<path d="${heartD(0, -48, 24)}" fill="#ff4f8b"/>`,
    flower: flowerG(0, -26, 22, '#ff9ec7'),
  };
  return `<svg viewBox="-32 -60 64 64" class="pic">${art[p]}</svg>`;
};

function visualSvg(v: Visual): string {
  const ink = '#ffffff';
  switch (v.type) {
    case 'clock': {
      const ha = ((v.h % 12) + v.m / 60) * 30 - 90;
      const ma = v.m * 6 - 90;
      const hand = (a: number, len: number, w: number, c: string) => `<line x1="0" y1="0" x2="${(Math.cos((a * Math.PI) / 180) * len).toFixed(1)}" y2="${(Math.sin((a * Math.PI) / 180) * len).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
      let s = '<circle r="92" fill="#fff" stroke="#ff9ec7" stroke-width="10"/>';
      for (let i = 1; i <= 12; i++) {
        const a = (i * 30 - 90) * (Math.PI / 180);
        s += `<text x="${(Math.cos(a) * 70).toFixed(1)}" y="${(Math.sin(a) * 70 + 8).toFixed(1)}" font-size="22" font-weight="700" text-anchor="middle" fill="#4a2546" font-family="Fredoka, sans-serif">${i}</text>`;
      }
      return `<svg viewBox="-100 -100 200 200" class="vis">${s}${hand(ha, 44, 9, '#4a2546')}${hand(ma, 66, 6, '#e0457b')}<circle r="7" fill="#4a2546"/></svg>`;
    }
    case 'pie': {
      let s = '';
      for (let i = 0; i < v.parts; i++) {
        const a0 = (i / v.parts) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((i + 1) / v.parts) * Math.PI * 2 - Math.PI / 2;
        const big = 1 / v.parts > 0.5 ? 1 : 0;
        s += `<path d="M0 0 L${(Math.cos(a0) * 80).toFixed(1)} ${(Math.sin(a0) * 80).toFixed(1)} A80 80 0 ${big} 1 ${(Math.cos(a1) * 80).toFixed(1)} ${(Math.sin(a1) * 80).toFixed(1)}Z" fill="${i < v.filled ? '#ff7eb6' : '#fff'}" stroke="#4a2546" stroke-width="3"/>`;
      }
      return `<svg viewBox="-90 -90 180 180" class="vis">${s}</svg>`;
    }
    case 'bar': {
      let s = '';
      for (let i = 0; i < v.parts; i++) s += `<rect x="${i * (200 / v.parts)}" y="0" width="${200 / v.parts}" height="50" fill="${i < v.filled ? '#7cc8ff' : '#fff'}" stroke="#4a2546" stroke-width="3"/>`;
      return `<svg viewBox="-4 -4 208 58" class="vis wide">${s}</svg>`;
    }
    case 'blocks': {
      let s = '';
      let x = 0;
      for (let i = 0; i < v.hundreds; i++, x += 74) {
        s += `<rect x="${x}" y="0" width="66" height="66" fill="#ffd36b" stroke="#c9a24a" stroke-width="2"/>`;
        for (let k = 1; k < 10; k++) s += `<line x1="${x + k * 6.6}" y1="0" x2="${x + k * 6.6}" y2="66" stroke="#c9a24a" stroke-width="0.8"/><line x1="${x}" y1="${k * 6.6}" x2="${x + 66}" y2="${k * 6.6}" stroke="#c9a24a" stroke-width="0.8"/>`;
      }
      x += 6;
      for (let i = 0; i < v.tens; i++, x += 11) {
        s += `<rect x="${x}" y="0" width="8" height="66" fill="#7cc8ff" stroke="#4f9dff" stroke-width="1.5"/>`;
        for (let k = 1; k < 10; k++) s += `<line x1="${x}" y1="${k * 6.6}" x2="${x + 8}" y2="${k * 6.6}" stroke="#4f9dff" stroke-width="0.8"/>`;
      }
      x += 6;
      for (let i = 0; i < v.ones; i++) s += `<rect x="${x + (i % 3) * 11}" y="${44 - Math.floor(i / 3) * 11}" width="8" height="8" fill="#ff9ec7" stroke="#e0457b" stroke-width="1.5"/>`;
      x += 36;
      return `<svg viewBox="-4 -4 ${x + 8} 76" class="vis wide">${s}</svg>`;
    }
    case 'rect': {
      const u = 28;
      let s = `<rect x="0" y="0" width="${v.w * u}" height="${v.h * u}" fill="#c9f2e3" stroke="#3fbf8f" stroke-width="4"/>`;
      if (v.show === 'area') for (let i = 1; i < v.w; i++) s += `<line x1="${i * u}" y1="0" x2="${i * u}" y2="${v.h * u}" stroke="#3fbf8f" stroke-width="1.5"/>`;
      if (v.show === 'area') for (let j = 1; j < v.h; j++) s += `<line x1="0" y1="${j * u}" x2="${v.w * u}" y2="${j * u}" stroke="#3fbf8f" stroke-width="1.5"/>`;
      if (v.show === 'perimeter') s += `<text x="${(v.w * u) / 2}" y="-10" font-size="20" font-weight="700" fill="${ink}" text-anchor="middle" font-family="Fredoka, sans-serif">${v.w} ${v.unit}</text><text x="${v.w * u + 10}" y="${(v.h * u) / 2 + 7}" font-size="20" font-weight="700" fill="${ink}" font-family="Fredoka, sans-serif">${v.h} ${v.unit}</text>`;
      return `<svg viewBox="-10 -34 ${v.w * u + 80} ${v.h * u + 44}" class="vis wide">${s}</svg>`;
    }
    case 'box': {
      // A clean 3D box: front face l x h, top face l x w, side face w x h, each with grid lines.
      const u = 26;
      const dx = u * 0.6;
      const dy = -u * 0.45;
      const L = v.l * u;
      const H = v.h * u;
      const ox = v.w * dx;
      const oy = v.w * dy;
      let s = `<path d="M0 0 L${L} 0 L${L} ${-H} L0 ${-H}Z" fill="#ffd36b" stroke="#b8891e" stroke-width="2.5"/>`;
      s += `<path d="M0 ${-H} L${L} ${-H} L${L + ox} ${-H + oy} L${ox} ${-H + oy}Z" fill="#ffe8a0" stroke="#b8891e" stroke-width="2.5"/>`;
      s += `<path d="M${L} 0 L${L + ox} ${oy} L${L + ox} ${-H + oy} L${L} ${-H}Z" fill="#e8b84a" stroke="#b8891e" stroke-width="2.5"/>`;
      const ln = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#b8891e" stroke-width="1.3"/>`;
      for (let i = 1; i < v.l; i++) s += ln(i * u, 0, i * u, -H) + ln(i * u, -H, i * u + ox, -H + oy);
      for (let j = 1; j < v.h; j++) s += ln(0, -j * u, L, -j * u) + ln(L, -j * u, L + ox, -j * u + oy);
      for (let k = 1; k < v.w; k++) s += ln(k * dx, -H + k * dy, L + k * dx, -H + k * dy) + ln(L + k * dx, k * dy, L + k * dx, -H + k * dy);
      const lab = (x: number, y: number, t: string) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="24" font-weight="700" fill="#fff" text-anchor="middle" font-family="Fredoka, sans-serif">${t}</text>`;
      s += lab(L / 2, 22, `${v.l}`) + lab(-14, -H / 2 + 6, `${v.h}`) + lab(L + ox / 2 + 14, oy / 2 + 14, `${v.w}`);
      return `<svg viewBox="-30 ${(-H + oy - 12).toFixed(1)} ${(L + ox + 60).toFixed(1)} ${(H - oy + 44).toFixed(1)}" class="vis">${s}</svg>`;
    }
  }
}

export function openLesson(): void {
  const total = 5;
  let n = 0;
  let firstTry = 0;
  let tries = 0;
  let q: Question;
  const grade = () => (GRADES.includes(G.s.grade as Grade) ? (G.s.grade as Grade) : null);
  const m = openModal('lesson', `<div class="board"><div class="board-head"><h2>Lesson time!</h2><button class="chip grade-chip" data-grade-pick></button><div class="dots"></div><button class="round-btn" data-close>${icon('close')}</button></div><div class="q"></div><div class="answers"></div></div>`);
  const showGrades = () => {
    m.box.querySelector('.dots')!.innerHTML = '';
    m.box.querySelector('.grade-chip')!.innerHTML = '';
    m.box.querySelector('.q')!.innerHTML = `<p>Which grade are you in?</p>`;
    m.box.querySelector('.answers')!.innerHTML = GRADES.map((g) => `<button class="ans grade${grade() === g ? ' right' : ''}" data-grade="${g}"><b>${g}</b><small>${GRADE_NAME[g].replace(/^\d+\w\w /, '')}</small></button>`).join('');
  };
  const next = () => {
    const g = grade()!;
    q = makeQuestion(g);
    tries = 0;
    m.box.querySelector('.grade-chip')!.innerHTML = `${icon('school')}<span>${GRADE_NAME[g]}</span>`;
    m.box.querySelector('.dots')!.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : i === n ? 'now' : ''}"></i>`).join('');
    let pics = '';
    if (q.pics) pics = `<div class="pics">${q.pics.map((gr, gi) => (gi ? '<b class="plus">+</b>' : '') + `<span class="pgroup">${Array.from({ length: gr.n }, () => picSvg(gr.pic)).join('')}</span>`).join('')}</div>`;
    if (q.sequence) pics = `<div class="pics seq">${q.sequence.map(picSvg).join('')}<span class="qmark">?</span></div>`;
    if (q.visual) pics = `<div class="pics">${visualSvg(q.visual)}</div>`;
    m.box.querySelector('.q')!.innerHTML = `<p class="${q.prompt.length > 40 ? 'long' : ''}">${esc(q.prompt)}</p>${pics}`;
    m.box.querySelector('.answers')!.innerHTML = q.options.map((o) => `<button class="ans${o.length > 4 ? ' small' : ''}" data-ans="${esc(o)}">${q.picAnswers ? picSvg(o as Pic) : esc(o)}</button>`).join('');
  };
  const finish = () => {
    const g = grade()!;
    const bonus = (firstTry === total ? 10 : 4) + g * 2;
    m.box.querySelector('.dots')!.innerHTML = Array.from({ length: total }, () => '<i class="on"></i>').join('');
    m.box.querySelector('.q')!.innerHTML = `<div class="done-stars">${icon('star')}${icon('star')}${icon('star')}</div><p>Great job! ${firstTry === total ? 'Every answer right the first time!' : 'You finished the lesson!'}</p>`;
    m.box.querySelector('.answers')!.innerHTML = `<button class="btn primary" data-again>${icon('question')}<span>Another lesson</span></button>` + (g < 5 ? `<button class="btn" data-up>${icon('star')}<span>Try ${GRADE_NAME[(g + 1) as Grade]}</span></button>` : '');
    celebrate();
    sound.success();
    G.earn(bonus, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    toast(`Lesson bonus: +${bonus} coins!`, 'coin');
  };
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-grade-pick]')) {
      sound.tap();
      showGrades();
      return;
    }
    const gb = t.closest('[data-grade]') as HTMLElement | null;
    if (gb) {
      G.s.grade = Number(gb.dataset.grade);
      G.changed();
      sound.pop();
      n = 0;
      firstTry = 0;
      next();
      return;
    }
    if (t.closest('[data-again]') || t.closest('[data-up]')) {
      if (t.closest('[data-up]')) {
        G.s.grade = Math.min(5, (grade() ?? 1) + 1);
        G.changed();
      }
      n = 0;
      firstTry = 0;
      next();
      return;
    }
    const b = t.closest('[data-ans]') as HTMLElement | null;
    if (!b || b.classList.contains('wrong') || b.classList.contains('right')) return;
    if (b.dataset.ans === q.answer) {
      b.classList.add('right');
      if (tries === 0) firstTry++;
      n++;
      sound.success();
      const r = b.getBoundingClientRect();
      G.s.stats.quizCorrect = (G.s.stats.quizCorrect ?? 0) + 1;
      G.earn(coinsFor(grade()!), { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      window.setTimeout(() => (n >= total ? finish() : next()), 700);
    } else {
      tries++;
      b.classList.add('wrong');
      sound.wrong();
      if (tries >= 2) {
        // Show the right answer after two misses, so nobody gets stuck.
        m.box.querySelectorAll<HTMLElement>('[data-ans]').forEach((x) => x.dataset.ans === q.answer && x.classList.add('hint'));
      }
    }
  });
  if (grade()) next();
  else showGrades();
}

// ---------------- piano ----------------
const NOTE_COLORS = ['#ff6f91', '#ffab5e', '#ffd84a', '#7fdc8a', '#5fd3c8', '#7cc8ff', '#c99bff'];
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export interface PianoHooks {
  onNote(): void;
  onSongDone(song: Song): void;
  onClose(): void;
}

const INSTRUMENTS: { id: Instrument; name: string; icon: string }[] = [
  { id: 'piano', name: 'Piano', icon: 'piano' }, { id: 'xylophone', name: 'Xylophone', icon: 'xylophone' }, { id: 'guitar', name: 'Guitar', icon: 'guitar' },
  { id: 'harp', name: 'Harp', icon: 'harp' }, { id: 'violin', name: 'Violin', icon: 'violin' }, { id: 'flute', name: 'Flute', icon: 'flute' },
  { id: 'trumpet', name: 'Trumpet', icon: 'trumpet' }, { id: 'drums', name: 'Drums', icon: 'drums' },
];
const RAINBOW = ['#ff6f91', '#ff8f6b', '#ffb35e', '#ffd84a', '#c3e06b', '#7fdc8a', '#5fd3c8', '#5fb8ee', '#7c9cff', '#9b7cff', '#c99bff', '#e88ad6', '#ff7eb6', '#ff6f91', '#ff8f6b'];
const DRUM_PADS: { id: Drum; name: string; color: string; size: number }[] = [
  { id: 'cymbal', name: 'Crash', color: '#ffd24a', size: 1 }, { id: 'hihat', name: 'Hi-Hat', color: '#ffe680', size: 0.8 }, { id: 'tom1', name: 'Tom', color: '#7cc8ff', size: 0.85 },
  { id: 'tom2', name: 'Big Tom', color: '#5fb8ee', size: 0.95 }, { id: 'snare', name: 'Snare', color: '#ffffff', size: 0.9 }, { id: 'kick', name: 'Boom', color: '#ff7eb6', size: 1.25 },
  { id: 'clap', name: 'Clap', color: '#c99bff', size: 0.8 }, { id: 'cowbell', name: 'Cowbell', color: '#ffab5e', size: 0.75 },
];
const NOTE_KEYS = 'asdfghjkl;\'zxcv';
const DRUM_KEYS = 'asdfghjk';
let lastInstrument: Instrument = 'piano';

export function openPiano(host: HTMLElement, hooks: PianoHooks): () => void {
  duckMusic(true);
  const panel = el('div', 'piano-panel');
  let inst: Instrument = lastInstrument;
  let song: Song | null = null;
  let pos = 0;
  let notes = 0;
  let chord = 'C';
  panel.innerHTML = `<div class="inst-tabs"></div><div class="piano-top"><div class="songs"></div><button class="round-btn" data-pclose>${icon('close')}</button></div><div class="keys"></div>`;
  host.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('show'));
  const keysEl = panel.querySelector('.keys') as HTMLDivElement;
  const melodic = () => inst !== 'guitar' && inst !== 'drums';

  const layout = () => {
    keysEl.className = `keys inst-${inst}`;
    panel.dataset.inst = inst;
    const n = WHITE_KEYS.length;
    const w = 100 / n;
    if (inst === 'piano') {
      keysEl.innerHTML = WHITE_KEYS.map((m, i) => `<div class="wk" data-midi="${m}" style="left:${i * w}%;width:${w}%"><span style="background:${NOTE_COLORS[i % 7]}">${NAMES[i % 7]}</span></div>`).join('') +
        BLACK_KEYS.map((m) => {
          const wi = WHITE_KEYS.findIndex((x) => x > m) - 1;
          return `<div class="bk" data-midi="${m}" style="left:${(wi + 1) * w - w * 0.3}%;width:${w * 0.6}%"></div>`;
        }).join('');
    } else if (inst === 'xylophone') {
      keysEl.innerHTML = '<i class="xy-rail top"></i><i class="xy-rail bot"></i>' + WHITE_KEYS.map((m, i) => `<div class="xbar" data-midi="${m}" style="left:${i * w + w * 0.08}%;width:${w * 0.84}%;height:${96 - i * 3.6}%;background:${RAINBOW[i]}"><i></i><i></i><span>${NAMES[i % 7]}</span></div>`).join('');
    } else if (inst === 'harp') {
      keysEl.innerHTML = '<i class="harp-frame"></i>' + WHITE_KEYS.map((m, i) => `<div class="hstring${i % 7 === 0 ? ' c' : i % 7 === 3 ? ' f' : ''}" data-midi="${m}" style="left:${i * w}%;width:${w}%"><i style="height:${100 - i * 3.2}%"></i><span>${NAMES[i % 7]}</span></div>`).join('');
    } else if (inst === 'violin' || inst === 'flute' || inst === 'trumpet') {
      keysEl.innerHTML = `<i class="inst-body"></i>` + WHITE_KEYS.map((m, i) => `<div class="mkey" data-midi="${m}" style="left:${i * w}%;width:${w}%"><b style="--c:${NOTE_COLORS[i % 7]}">${NAMES[i % 7]}</b></div>`).join('');
    } else if (inst === 'guitar') {
      keysEl.innerHTML = `<div class="chords">${Object.keys(CHORDS).map((c, i) => `<button class="chord${c === chord ? ' on' : ''}" data-chord="${c}" style="--c:${RAINBOW[i * 2]}">${c}</button>`).join('')}</div>` +
        `<div class="strum-area"><i class="sound-hole"></i>${[0, 1, 2, 3, 4, 5].map((i) => `<div class="gstring" data-string="${i}" style="top:${10 + i * 16}%"><i style="height:${1.5 + (5 - i) * 0.6}px"></i></div>`).join('')}<span class="strum-hint">Swipe the strings to strum!</span></div>`;
    } else {
      keysEl.innerHTML = DRUM_PADS.map((d, i) => `<div class="dpad" data-drum="${d.id}" style="--c:${d.color};--s:${d.size}"><b>${d.name}</b><small>${DRUM_KEYS[i].toUpperCase()}</small></div>`).join('');
    }
    panel.querySelector('.inst-tabs')!.innerHTML = INSTRUMENTS.map((x) => `<button class="itab${x.id === inst ? ' on' : ''}" data-inst="${x.id}">${icon(x.icon)}<span>${x.name}</span></button>`).join('');
    panel.querySelector('.songs')!.classList.toggle('hidden', !melodic());
    renderSongs();
    glow();
  };
  const renderSongs = () => {
    panel.querySelector('.songs')!.innerHTML = melodic()
      ? `<button class="chip${!song ? ' on' : ''}" data-song="">${icon('music')}Free play</button>` + SONGS.map((s) => `<button class="chip${song?.id === s.id ? ' on' : ''}" data-song="${s.id}">${G.s.songsDone.includes(s.id) ? icon('star') : icon('note')}${esc(s.name)}</button>`).join('')
      : `<span class="inst-tip">${inst === 'guitar' ? 'Pick a chord, then swipe the strings!' : 'Tap the drums to make a beat!'}</span>`;
  };
  const glow = () => {
    keysEl.querySelectorAll('.next').forEach((k) => k.classList.remove('next'));
    if (song && melodic()) keysEl.querySelector(`[data-midi="${song.notes[pos]}"]`)?.classList.add('next');
    panel.style.setProperty('--prog', song ? `${(pos / song.notes.length) * 100}%` : '0%');
    panel.classList.toggle('song-mode', !!song && melodic());
  };
  const flash = (keyEl: Element | null, burstIt = true) => {
    keyEl?.classList.remove('down');
    void (keyEl as HTMLElement | null)?.offsetWidth;
    keyEl?.classList.add('down');
    window.setTimeout(() => keyEl?.classList.remove('down'), 200);
    const r = keyEl?.getBoundingClientRect();
    if (r && burstIt) burst('note', r.left + r.width / 2, r.top, 1);
  };
  const counted = () => {
    notes++;
    hooks.onNote();
  };
  const press = (midi: number, keyEl: Element | null) => {
    playNote(inst, midi);
    counted();
    flash(keyEl);
    if (song) {
      if (midi === song.notes[pos]) {
        pos++;
        if (pos >= song.notes.length) {
          const done = song;
          song = null;
          pos = 0;
          window.setTimeout(() => hooks.onSongDone(done), 300);
          renderSongs();
        }
      }
      glow();
    }
  };
  const hitDrum = (id: Drum, padEl: Element | null) => {
    drum(id);
    counted();
    flash(padEl, id !== 'hihat');
  };
  // One finger can glide across notes or strings; each new one it touches plays.
  const touching = new Map<number, string>();
  const targetAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[data-midi],[data-string],[data-drum]') as HTMLElement | null;
  const fire = (t: HTMLElement, dir = 0) => {
    if (t.dataset.midi) press(Number(t.dataset.midi), t);
    else if (t.dataset.drum) hitDrum(t.dataset.drum as Drum, t);
    else if (t.dataset.string) {
      strum(chord, dir < 0);
      counted();
      keysEl.querySelectorAll('.gstring').forEach((g, i) => window.setTimeout(() => flash(g, false), i * 22));
    }
  };
  keysEl.addEventListener('pointerdown', (e) => {
    const ch = (e.target as Element).closest('[data-chord]') as HTMLElement | null;
    if (ch) {
      chord = ch.dataset.chord!;
      keysEl.querySelectorAll('.chord').forEach((c) => c.classList.toggle('on', c === ch));
      strum(chord);
      counted();
      flash(ch);
      return;
    }
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    e.preventDefault();
    try {
      keysEl.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    touching.set(e.pointerId, `${t.dataset.midi ?? t.dataset.string ?? t.dataset.drum}`);
    fire(t);
  });
  keysEl.addEventListener('pointermove', (e) => {
    if (!touching.has(e.pointerId) || inst === 'drums') return;
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    const key = `${t.dataset.midi ?? t.dataset.string ?? ''}`;
    const prev = touching.get(e.pointerId)!;
    if (key && key !== prev) {
      touching.set(e.pointerId, key);
      fire(t, Number(key) - Number(prev));
    }
  });
  const lift = (e: PointerEvent) => touching.delete(e.pointerId);
  keysEl.addEventListener('pointerup', lift);
  keysEl.addEventListener('pointercancel', lift);
  panel.addEventListener('click', (e) => {
    const t = e.target as Element;
    const it = t.closest('[data-inst]') as HTMLElement | null;
    if (it) {
      inst = it.dataset.inst as Instrument;
      lastInstrument = inst;
      if (!melodic()) song = null;
      sound.tap();
      layout();
      if (melodic()) playNote(inst, 67);
      else if (inst === 'guitar') strum(chord);
      else drum('snare');
      return;
    }
    const s = t.closest('[data-song]') as HTMLElement | null;
    if (s) {
      song = SONGS.find((x) => x.id === s.dataset.song) ?? null;
      pos = 0;
      sound.tap();
      renderSongs();
      glow();
      if (song) toast(`Tap the glowing ${inst === 'harp' ? 'strings' : inst === 'xylophone' ? 'bars' : 'keys'} to play ${song.name}!`, 'note');
    }
    if (t.closest('[data-pclose]')) close();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (inst === 'drums') {
      const i = DRUM_KEYS.indexOf(e.key.toLowerCase());
      if (i >= 0) hitDrum(DRUM_PADS[i].id, keysEl.querySelector(`[data-drum="${DRUM_PADS[i].id}"]`));
      return;
    }
    if (inst === 'guitar') {
      if (e.key === ' ') fire(keysEl.querySelector('[data-string]') as HTMLElement);
      return;
    }
    const i = NOTE_KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0 && i < WHITE_KEYS.length) press(WHITE_KEYS[i], keysEl.querySelector(`[data-midi="${WHITE_KEYS[i]}"]`));
  };
  window.addEventListener('keydown', onKey);
  let flushT = window.setInterval(() => {
    if (notes) {
      G.bump('pianoNote', notes);
      notes = 0;
    }
  }, 1500);
  function close(): void {
    if (notes) G.bump('pianoNote', notes);
    notes = 0;
    window.clearInterval(flushT);
    flushT = 0;
    window.removeEventListener('keydown', onKey);
    duckMusic(false);
    panel.classList.remove('show');
    window.setTimeout(() => panel.remove(), 250);
    hooks.onClose();
  }
  layout();
  return close;
}

// ---------------- decorate catalog ----------------
const CATALOG_TABS: { id: FurnCat; name: string; icon: string }[] = [
  { id: 'bedroom', name: 'Bedroom', icon: 'bed' }, { id: 'kids', name: 'Kids', icon: 'toy' }, { id: 'living', name: 'Living', icon: 'sofa' },
  { id: 'electronics', name: 'Gadgets', icon: 'tv' }, { id: 'lighting', name: 'Lights', icon: 'lamp' }, { id: 'kitchen', name: 'Kitchen', icon: 'fridge' },
  { id: 'bath', name: 'Bath', icon: 'bath' }, { id: 'decor', name: 'Decor', icon: 'decor' }, { id: 'plants', name: 'Plants', icon: 'plant' },
  { id: 'wall', name: 'Walls', icon: 'wall' }, { id: 'rugs', name: 'Rugs', icon: 'rug' }, { id: 'yard', name: 'Yard', icon: 'tree' },
  { id: 'outdoor', name: 'Park', icon: 'tree' }, { id: 'toys', name: 'Toys', icon: 'toy' }, { id: 'food', name: 'Food', icon: 'apple' },
];
const catalogMemo: { tab: FurnCat; style: string; scroll: number } = { tab: 'bedroom', style: '', scroll: 0 };

/** The big furniture catalog: browse by room or by design collection, tap to place. */
export function openCatalog(onPlace: (id: string) => void): void {
  const m = openModal('shop catalog', `<div class="shop-head"><h2>${icon('decorate')}Decorate</h2><div class="coins-big">${icon('coin')}<span></span></div><button class="round-btn" data-close>${icon('close')}</button></div>
    <div class="shop-tabs"></div><div class="style-chips"></div><div class="shop-grid cat-grid"></div>`);
  let lazy: IntersectionObserver | null = null;
  const grid = m.box.querySelector('.cat-grid') as HTMLDivElement;
  const render = (keep = false) => {
    m.box.querySelector('.coins-big span')!.textContent = String(G.s.coins);
    m.box.querySelector('.shop-tabs')!.innerHTML = CATALOG_TABS.map((t) => `<button class="tab${t.id === catalogMemo.tab ? ' on' : ''}" data-tab="${t.id}">${icon(t.icon)}<span>${t.name}</span></button>`).join('');
    const inTab = FURNITURE.filter((f) => f.cat === catalogMemo.tab);
    const styles = FURN_STYLES.filter((st) => inTab.some((f) => f.style === st.id));
    if (catalogMemo.style && !styles.some((st) => st.id === catalogMemo.style)) catalogMemo.style = '';
    m.box.querySelector('.style-chips')!.innerHTML = styles.length
      ? `<button class="chip${!catalogMemo.style ? ' on' : ''}" data-style="">All</button>` + styles.map((st) => `<button class="chip${catalogMemo.style === st.id ? ' on' : ''}" data-style="${st.id}"><i class="sdot" style="background:linear-gradient(135deg, ${st.main} 50%, ${st.accent} 50%)"></i>${esc(st.name)}</button>`).join('')
      : '';
    const list = inTab.filter((f) => !catalogMemo.style || f.style === catalogMemo.style);
    let html = '';
    let last = '';
    for (const f of list) {
      const g = f.group ?? 'More';
      if (g !== last && !catalogMemo.style) {
        last = g;
        html += `<h3 class="cat-sec">${esc(g)}</h3>`;
      }
      const own = G.owns(f.id);
      html += `<button class="shop-card cat-card${own ? '' : ' locked'}" data-place="${f.id}"><div class="thumb" data-thumb="${f.id}"><i class="thumb-wait"></i></div><div class="nm">${esc(f.name)}</div>${own ? '' : `<span class="price">${icon('coin')}${f.price}</span>`}</button>`;
    }
    grid.innerHTML = html || '<p class="hint">Nothing here yet.</p>';
    lazy?.disconnect();
    lazy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        lazy!.unobserve(el);
        const d = FURN_BY_ID[el.dataset.thumb!];
        if (d) el.innerHTML = still(furnThumb(d));
      }
    }, { root: grid, rootMargin: '400px 0px' });
    grid.querySelectorAll('[data-thumb]').forEach((el) => lazy!.observe(el));
    grid.scrollTop = keep ? catalogMemo.scroll : 0;
  };
  grid.addEventListener('scroll', () => (catalogMemo.scroll = grid.scrollTop));
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tb = t.closest('[data-tab]') as HTMLElement | null;
    if (tb) {
      catalogMemo.tab = tb.dataset.tab as FurnCat;
      catalogMemo.style = '';
      sound.tap();
      render();
      return;
    }
    const sb = t.closest('[data-style]') as HTMLElement | null;
    if (sb) {
      catalogMemo.style = sb.dataset.style!;
      sound.tap();
      render();
      return;
    }
    const card = t.closest('[data-place]') as HTMLElement | null;
    if (!card) return;
    const id = card.dataset.place!;
    const def = FURN_BY_ID[id];
    const place = () => {
      m.close();
      onPlace(id);
    };
    if (G.owns(id)) return place();
    confirmBox(`Buy ${def.name}?`, `It costs <b class="coin-text">${icon('coin')}${def.price}</b>. You have ${G.s.coins}.`, `${icon('bag')}<span>Buy</span>`, still(furnThumb(def)), () => {
      if (G.buy(id)) {
        celebrate();
        place();
      }
    });
  });
  render(true);
}
