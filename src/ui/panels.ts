// Pop-up panels: the boutique shop, challenges, settings, the season picker, school lessons and the piano.
import { HAIR } from '../art/doll';
import { FURNITURE, FURN_BY_ID, furnThumb } from '../art/furniture';
import { FLOORS, WALLS } from '../art/scenes';
import { WEAR, flowerG, heartD, starD } from '../art/wear';
import { wornOf } from '../data/looks';
import { makeQuestion, type Pic, type Question } from '../data/quiz';
import { BLACK_KEYS, SONGS, WHITE_KEYS, type Song } from '../data/songs';
import { activeChallenges, claim, claimDaily, dailyReady, DAILY_GIFT, isDone, progressOf } from '../data/state';
import { duckMusic, pianoNote, sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, coinFly, toast } from '../game';
import { SEASONS, type Look, type Season, type Slot } from '../types';
import { confirmBox, el, esc, floorThumb, lookThumb, openModal, slotBox, wallThumb } from './dom';
import { icon } from './icons';

export const SEASON_ICON: Record<Season, string> = { spring: 'flower', summer: 'sun', fall: 'leaf', winter: 'snow' };
export const SEASON_NAME: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };

// ---------------- shop ----------------
type ShopTab = 'clothes' | 'accessories' | 'hair' | 'furniture' | 'rooms';
interface ShopItem { key: string; name: string; price: number; thumb: () => string; season: boolean }

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
  const sets: Record<ShopTab, () => ShopItem[]> = {
    clothes: () => WEAR.filter((w) => ['top', 'bottom', 'dress', 'outer', 'shoes'].includes(w.slot) && w.price).map((w) => ({ key: w.id, name: w.name, price: w.price, thumb: wearThumb(w.id, w.slot), season: !!w.tags?.includes(season) })),
    accessories: () => WEAR.filter((w) => ['head', 'face', 'neck', 'hand', 'back'].includes(w.slot) && w.price).map((w) => ({ key: w.id, name: w.name, price: w.price, thumb: wearThumb(w.id, w.slot), season: !!w.tags?.includes(season) })),
    hair: () => HAIR.filter((h) => h.price).map((h) => ({ key: 'hair:' + h.id, name: h.name, price: h.price, thumb: () => lookThumb({ ...model, hair: h.id }, slotBox(model, 'hair'), { headOnly: true }), season: false })),
    furniture: () => FURNITURE.filter((f) => f.price).map((f) => ({ key: f.id, name: f.name, price: f.price, thumb: () => furnThumb(f), season: (season === 'winter' && (f.id === 'xmasTree' || f.id === 'fireplace' || f.id === 'snowman')) || (season === 'fall' && f.id === 'pumpkin') })),
    rooms: () => [
      ...WALLS.filter((w) => w.price).map((w) => ({ key: 'wall:' + w.id, name: w.name + ' wallpaper', price: w.price, thumb: () => wallThumb(w.id), season: false })),
      ...FLOORS.filter((f) => f.price).map((f) => ({ key: 'floor:' + f.id, name: f.name + ' floor', price: f.price, thumb: () => floorThumb(f.id), season: false })),
    ],
  };
  return sets[tab]().sort((a, b) => Number(b.season) - Number(a.season) || a.price - b.price);
}

export function openShop(): void {
  const tabs: { id: ShopTab; name: string; icon: string }[] = [
    { id: 'clothes', name: 'Clothes', icon: 'dress' },
    { id: 'accessories', name: 'Accessories', icon: 'crown' },
    { id: 'hair', name: 'Hairstyles', icon: 'hair' },
    { id: 'furniture', name: 'Furniture', icon: 'sofa' },
    { id: 'rooms', name: 'Rooms', icon: 'wallpaper' },
  ];
  let tab: ShopTab = 'clothes';
  const m = openModal('shop', `<div class="shop-head"><h2>${icon('bag')}Boutique</h2><div class="coins-big">${icon('coin')}<span></span></div><button class="round-btn" data-close>${icon('close')}</button></div>
    <div class="shop-tabs"></div><div class="shop-grid"></div>`);
  const model = G.s.dolls[0]?.look;
  const render = () => {
    m.box.querySelector('.coins-big span')!.textContent = String(G.s.coins);
    m.box.querySelector('.shop-tabs')!.innerHTML = tabs.map((t) => `<button class="tab${t.id === tab ? ' on' : ''}" data-tab="${t.id}">${icon(t.icon)}<span>${t.name}</span></button>`).join('');
    const items = shopItems(tab, model);
    m.box.querySelector('.shop-grid')!.innerHTML = items.map((it) => {
      const owned = G.owns(it.key);
      return `<div class="shop-card${owned ? ' owned' : ''}">${it.season ? `<span class="ribbon">${icon(SEASON_ICON[G.s.season])}${SEASON_NAME[G.s.season]}</span>` : ''}<div class="thumb">${it.thumb()}</div><div class="nm">${esc(it.name)}</div>` +
        (owned ? `<div class="owned-tag">${icon('check')}Yours</div>` : `<button class="btn buy${G.s.coins < it.price ? ' poor' : ''}" data-buy="${it.key}">${icon('coin')}${it.price}</button>`) + `</div>`;
    }).join('');
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
    const b = t.closest('[data-buy]') as HTMLElement | null;
    if (b && G.buy(b.dataset.buy!)) {
      const r = b.getBoundingClientRect();
      burst('confetti', r.left + r.width / 2, r.top, 36);
      sound.sparkle();
      const key = b.dataset.buy!;
      const name = WEAR.find((w) => w.id === key)?.name ?? FURN_BY_ID[key]?.name ?? 'It';
      toast(`${name} is yours!${FURN_BY_ID[key] ? ' Find it in your house tray.' : WEAR.find((w) => w.id === key) ? ' Try it on in the closet.' : ''}`, 'bag');
      render();
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

export function openLesson(): void {
  const total = 5;
  let n = 0;
  let firstTry = 0;
  let tries = 0;
  let q: Question;
  const level = Math.floor((G.s.stats.quizCorrect ?? 0) / 10);
  const m = openModal('lesson', `<div class="board"><div class="board-head"><h2>Lesson time!</h2><div class="dots"></div><button class="round-btn" data-close>${icon('close')}</button></div><div class="q"></div><div class="answers"></div></div>`);
  const next = () => {
    q = makeQuestion(level);
    tries = 0;
    m.box.querySelector('.dots')!.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : i === n ? 'now' : ''}"></i>`).join('');
    let pics = '';
    if (q.pics) pics = `<div class="pics">${q.pics.map((g, gi) => (gi ? '<b class="plus">+</b>' : '') + `<span class="pgroup">${Array.from({ length: g.n }, () => picSvg(g.pic)).join('')}</span>`).join('')}</div>`;
    if (q.sequence) pics = `<div class="pics seq">${q.sequence.map(picSvg).join('')}<span class="qmark">?</span></div>`;
    m.box.querySelector('.q')!.innerHTML = `<p>${esc(q.prompt)}</p>${pics}`;
    m.box.querySelector('.answers')!.innerHTML = q.options.map((o) => `<button class="ans" data-ans="${esc(o)}">${q.kind === 'pattern' ? picSvg(o as Pic) : esc(o)}</button>`).join('');
  };
  const finish = () => {
    const bonus = firstTry === total ? 15 : 5;
    m.box.querySelector('.dots')!.innerHTML = Array.from({ length: total }, () => '<i class="on"></i>').join('');
    m.box.querySelector('.q')!.innerHTML = `<div class="done-stars">${icon('star')}${icon('star')}${icon('star')}</div><p>Great job! ${firstTry === total ? 'Every answer right the first time!' : 'You finished the lesson!'}</p>`;
    m.box.querySelector('.answers')!.innerHTML = `<button class="btn primary" data-again>${icon('question')}<span>Another lesson</span></button>`;
    celebrate();
    sound.success();
    G.earn(bonus, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    toast(`Lesson bonus: +${bonus} coins!`, 'coin');
  };
  m.box.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-again]')) {
      n = 0;
      firstTry = 0;
      next();
      return;
    }
    const b = t.closest('[data-ans]') as HTMLElement | null;
    if (!b || b.classList.contains('wrong')) return;
    if (b.dataset.ans === q.answer) {
      b.classList.add('right');
      if (tries === 0) firstTry++;
      n++;
      sound.success();
      const r = b.getBoundingClientRect();
      G.s.stats.quizCorrect = (G.s.stats.quizCorrect ?? 0) + 1;
      G.earn(5, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      window.setTimeout(() => (n >= total ? finish() : next()), 700);
    } else {
      tries++;
      b.classList.add('wrong');
      sound.wrong();
    }
  });
  next();
}

// ---------------- piano ----------------
const NOTE_COLORS = ['#ff6f91', '#ffab5e', '#ffd84a', '#7fdc8a', '#5fd3c8', '#7cc8ff', '#c99bff'];
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const KEYS = 'asdfghjkl;\'zxcv';

export interface PianoHooks {
  onNote(): void;
  onSongDone(song: Song): void;
  onClose(): void;
}

export function openPiano(host: HTMLElement, hooks: PianoHooks): () => void {
  duckMusic(true);
  const panel = el('div', 'piano-panel');
  let song: Song | null = null;
  let pos = 0;
  let notes = 0;
  panel.innerHTML = `<div class="piano-top"><div class="songs"></div><button class="round-btn" data-pclose>${icon('close')}</button></div><div class="keys"></div>`;
  host.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('show'));
  const keysEl = panel.querySelector('.keys') as HTMLDivElement;
  const whiteW = 100 / WHITE_KEYS.length;
  keysEl.innerHTML = WHITE_KEYS.map((m, i) => `<div class="wk" data-midi="${m}" style="left:${i * whiteW}%;width:${whiteW}%"><span style="background:${NOTE_COLORS[i % 7]}">${NAMES[i % 7]}</span></div>`).join('') +
    BLACK_KEYS.map((m) => {
      const whiteIndex = WHITE_KEYS.findIndex((w) => w > m) - 1;
      return `<div class="bk" data-midi="${m}" style="left:${(whiteIndex + 1) * whiteW - whiteW * 0.3}%;width:${whiteW * 0.6}%"></div>`;
    }).join('');
  const renderSongs = () => {
    panel.querySelector('.songs')!.innerHTML = `<button class="chip${!song ? ' on' : ''}" data-song="">${icon('music')}Free play</button>` + SONGS.map((s) => `<button class="chip${song?.id === s.id ? ' on' : ''}" data-song="${s.id}">${G.s.songsDone.includes(s.id) ? icon('star') : icon('note')}${esc(s.name)}</button>`).join('');
  };
  const glow = () => {
    keysEl.querySelectorAll('.next').forEach((k) => k.classList.remove('next'));
    if (song) keysEl.querySelector(`[data-midi="${song.notes[pos]}"]`)?.classList.add('next');
    panel.style.setProperty('--prog', song ? `${(pos / song.notes.length) * 100}%` : '0%');
    panel.classList.toggle('song-mode', !!song);
  };
  const press = (midi: number, keyEl: Element | null) => {
    pianoNote(midi);
    notes++;
    hooks.onNote();
    keyEl?.classList.add('down');
    window.setTimeout(() => keyEl?.classList.remove('down'), 180);
    const r = keyEl?.getBoundingClientRect();
    if (r) burst('note', r.left + r.width / 2, r.top, 1);
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
  keysEl.addEventListener('pointerdown', (e) => {
    const k = (e.target as Element).closest('[data-midi]');
    if (!k) return;
    e.preventDefault();
    press(Number((k as HTMLElement).dataset.midi), k);
  });
  panel.addEventListener('click', (e) => {
    const t = e.target as Element;
    const s = t.closest('[data-song]') as HTMLElement | null;
    if (s) {
      song = SONGS.find((x) => x.id === s.dataset.song) ?? null;
      pos = 0;
      sound.tap();
      renderSongs();
      glow();
      if (song) toast(`Tap the glowing keys to play ${song.name}!`, 'note');
    }
    if (t.closest('[data-pclose]')) close();
  });
  const onKey = (e: KeyboardEvent) => {
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0 && i < WHITE_KEYS.length && !e.repeat) press(WHITE_KEYS[i], keysEl.querySelector(`[data-midi="${WHITE_KEYS[i]}"]`));
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
  renderSongs();
  glow();
  return close;
}
