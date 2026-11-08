// Things to do in the town places: read books (library), watch movies (cinema), shop from a list
// (grocery), cook orders (restaurant), play doctor (hospital) and wash cars (car shop).
import { body } from '../art/body';
import { PALETTE, dark, light } from '../art/color';
import { renderDoll } from '../art/doll';
import { FURNITURE, FURN_BY_ID, furnViewBox, type FurnDef } from '../art/furniture';
import { storyCover, storyScene } from '../art/storyart';
import { heartD, sparkleD, starD } from '../art/wear';
import { STORIES, type Story } from '../data/stories';
import { duckMusic, sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, toast } from '../game';
import type { Doll } from '../types';
import { el, esc, headThumb, still } from './dom';
import { icon } from './icons';

const f = (n: number) => n.toFixed(1);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Full-screen activity frame with a back button, a title and a close button. */
function frame(cls: string, title: string, onClose: () => void): { root: HTMLDivElement; body: HTMLDivElement; close: () => void; setTitle: (t: string) => void } {
  const layer = document.getElementById('overlay')!;
  const root = el('div', `act ${cls}`);
  root.innerHTML = `<div class="act-head"><button class="round-btn" data-xclose>${icon('close')}</button><h2></h2><div class="pill coins-mini">${icon('coin')}<span></span></div></div><div class="act-body"></div>`;
  layer.appendChild(root);
  document.getElementById('toast')?.classList.remove('show'); // town hints belong to the room, not the activity
  requestAnimationFrame(() => root.classList.add('show'));
  const h2 = root.querySelector('h2')!;
  h2.textContent = title;
  const coins = root.querySelector('.coins-mini span')!;
  const off = G.on(() => (coins.textContent = String(G.s.coins)));
  coins.textContent = String(G.s.coins);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    off();
    sound.tap();
    root.classList.remove('show');
    window.setTimeout(() => root.remove(), 260);
    onClose();
  };
  root.querySelector('[data-xclose]')!.addEventListener('click', close);
  return { root, body: root.querySelector('.act-body') as HTMLDivElement, close, setTitle: (t) => (h2.textContent = t) };
}

// ---------------- reading aloud ----------------
let voice: SpeechSynthesisVoice | null = null;
function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis?.getVoices() ?? [];
  const en = all.filter((v) => /^en/i.test(v.lang));
  return en.find((v) => /samantha|karen|moira|tessa|female|zira|aria|jenny/i.test(v.name)) ?? en.find((v) => v.localService) ?? en[0] ?? null;
}
export function speak(text: string, onEnd?: () => void): void {
  const ss = window.speechSynthesis;
  if (!ss || !G.s.settings.sound) {
    if (onEnd) window.setTimeout(onEnd, Math.max(2500, text.length * 55));
    return;
  }
  ss.cancel();
  voice ??= pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 0.92;
  u.pitch = 1.1;
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };
  u.onend = end;
  u.onerror = end;
  // Some browsers never fire onend; never get stuck waiting.
  window.setTimeout(end, Math.max(4000, text.length * 95));
  ss.speak(u);
}
export const hush = () => window.speechSynthesis?.cancel();

// ---------------- library & cinema ----------------
export function openStories(kind: 'book' | 'movie', onClose: () => void): void {
  const fr = frame(kind === 'book' ? 'library' : 'cinema', kind === 'book' ? 'Library Books' : 'Now Showing', () => {
    hush();
    duckMusic(false);
    onClose();
  });
  const list = STORIES.filter((s) => s.kind === kind);
  const seen = (id: string) => (G.s.storiesDone ?? []).includes(`${kind}:${id}`);
  const shelf = () => {
    hush();
    fr.setTitle(kind === 'book' ? 'Library Books' : 'Now Showing');
    fr.body.innerHTML = list.length
      ? `<p class="act-tip">${kind === 'book' ? 'Pick a book to read. Tap "Read to me" to listen!' : 'Pick a movie. Grab some popcorn!'}</p><div class="shelf">${list.map((s) => `<button class="book${kind === 'movie' ? ' poster' : ''}" data-story="${s.id}"><div class="cover">${storyCover(s)}</div>${seen(s.id) ? `<i class="read-badge">${icon('star')}</i>` : ''}<span>${esc(s.title)}</span></button>`).join('')}</div>`
      : `<p class="act-tip">New ${kind === 'book' ? 'books' : 'movies'} are coming soon!</p>`;
  };
  fr.body.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-story]') as HTMLElement | null;
    if (!b) return;
    const st = list.find((s) => s.id === b.dataset.story);
    if (!st) return;
    sound.pop();
    if (kind === 'book') readBook(st);
    else playMovie(st);
  });

  const finishStory = (st: Story) => {
    const key = `${kind}:${st.id}`;
    const first = !(G.s.storiesDone ?? []).includes(key);
    if (first) (G.s.storiesDone ??= []).push(key);
    G.bump(kind === 'book' ? 'read' : 'movie');
    const coins = first ? 15 : 3;
    G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    celebrate();
    sound.success();
    return coins;
  };

  const readBook = (st: Story) => {
    let i = 0;
    let aloud = !!G.s.settings.sound;
    fr.setTitle(st.title);
    const draw = (dir = 0) => {
      const end = i >= st.pages.length;
      if (end) {
        hush();
        const coins = finishStory(st);
        fr.body.innerHTML = `<div class="reader"><div class="page end-page"><div class="moral-card"><div class="done-stars">${icon('star')}${icon('star')}${icon('star')}</div><h3>The End</h3><p class="moral-label">What we learned</p><p class="moral">${esc(st.moral)}</p><p class="earned">${icon('coin')} +${coins}</p></div></div>
          <div class="reader-bar"><button class="btn" data-again>${icon('back')}<span>Read again</span></button><button class="btn primary" data-shelf>${icon('book')}<span>More books</span></button></div></div>`;
        if (aloud) speak(`The end. ${st.moral}`);
        return;
      }
      const p = st.pages[i];
      fr.body.innerHTML = `<div class="reader"><div class="page ${dir > 0 ? 'turn-next' : dir < 0 ? 'turn-prev' : ''}"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">${storyScene(p)}</svg><p class="page-text">${esc(p.text)}</p></div>
        <div class="reader-bar"><button class="round-btn big" data-prev ${i === 0 ? 'disabled' : ''}>${icon('back')}</button><div class="dots">${st.pages.map((_, k) => `<i class="${k < i ? 'on' : k === i ? 'now' : ''}"></i>`).join('')}</div>
        <button class="chip aloud${aloud ? ' on' : ''}" data-aloud>${icon('sound')}<span>Read to me</span></button><button class="round-btn big next" data-next>${icon('back')}</button></div></div>`;
      if (aloud) speak(p.text);
    };
    fr.body.onclick = (e) => {
      const t = e.target as Element;
      if (t.closest('[data-next]')) {
        i++;
        sound.whoosh();
        draw(1);
      } else if (t.closest('[data-prev]') && i > 0) {
        i--;
        sound.whoosh();
        draw(-1);
      } else if (t.closest('[data-aloud]')) {
        aloud = !aloud;
        if (aloud) speak(st.pages[i]?.text ?? '');
        else hush();
        t.closest('[data-aloud]')!.classList.toggle('on', aloud);
      } else if (t.closest('[data-again]')) {
        i = 0;
        draw();
      } else if (t.closest('[data-shelf]')) {
        fr.body.onclick = null;
        shelf();
      }
    };
    draw();
  };

  const playMovie = (st: Story) => {
    duckMusic(true);
    fr.setTitle(st.title);
    let i = -1;
    let popcorn = 0;
    let timer = 0;
    let stopped = false;
    fr.body.innerHTML = `<div class="theater-view"><div class="screen-frame"><div class="screen"></div><div class="subs"></div><div class="curtain l"></div><div class="curtain r"></div></div>
      <div class="movie-bar"><button class="btn" data-shelf>${icon('back')}<span>Leave</span></button><button class="btn popcorn" data-pop>${icon('cake')}<span>Popcorn <b>0</b></span></button><button class="round-btn" data-skip>${icon('back')}</button></div></div>`;
    const screen = fr.body.querySelector('.screen') as HTMLDivElement;
    const subs = fr.body.querySelector('.subs') as HTMLDivElement;
    const frameEl = fr.body.querySelector('.screen-frame') as HTMLDivElement;
    const next = () => {
      if (stopped) return;
      window.clearTimeout(timer);
      i++;
      if (i >= st.pages.length) {
        const coins = finishStory(st);
        screen.innerHTML = `<div class="credits"><h3>The End</h3><p>${esc(st.moral)}</p><p class="earned">${icon('coin')} +${coins}</p><p class="small">Popcorn eaten: ${popcorn}</p></div>`;
        subs.textContent = '';
        frameEl.classList.remove('open');
        speak(`The end. ${st.moral}`);
        return;
      }
      const p = st.pages[i];
      screen.innerHTML = `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" class="scene-in">${storyScene(p, { animate: true })}</svg>`;
      subs.textContent = p.text;
      speak(p.text, () => (timer = window.setTimeout(next, 900)));
    };
    window.setTimeout(() => {
      frameEl.classList.add('open');
      sound.whoosh();
      window.setTimeout(next, 900);
    }, 300);
    fr.body.onclick = (e) => {
      const t = e.target as Element;
      if (t.closest('[data-pop]')) {
        popcorn++;
        sound.pop();
        const r = (t.closest('[data-pop]') as HTMLElement).getBoundingClientRect();
        burst('confetti', r.left + r.width / 2, r.top, 6);
        fr.body.querySelector('.popcorn b')!.textContent = String(popcorn);
      } else if (t.closest('[data-skip]')) {
        hush();
        next();
      } else if (t.closest('[data-shelf]')) {
        stopped = true;
        window.clearTimeout(timer);
        hush();
        duckMusic(false);
        fr.body.onclick = null;
        shelf();
      }
    };
  };

  shelf();
}

// ---------------- grocery ----------------
const foods = () => FURNITURE.filter((d) => d.food && d.mount === 'prop');
const thumb = (d: FurnDef) => still(`<svg viewBox="${furnViewBox(d)}">${d.art(d.color ?? '#ff9ec7', false)}</svg>`);

export function openGrocery(onClose: () => void): void {
  const fr = frame('grocery-game', 'Shopping List', onClose);
  const pool = foods();
  let list: FurnDef[] = [];
  let got = new Set<string>();
  let wrong = 0;
  const round = () => {
    list = shuffle(pool).slice(0, Math.min(5, pool.length));
    const shelf = shuffle([...list, ...shuffle(pool.filter((d) => !list.includes(d))).slice(0, 11)]);
    got = new Set();
    wrong = 0;
    fr.body.innerHTML = `<div class="grocery"><div class="list-paper"><h3>${icon('cart')} My list</h3><ul>${list.map((d) => `<li data-li="${d.id}"><span class="mini">${thumb(d)}</span>${esc(d.name)}</li>`).join('')}</ul></div>
      <div class="aisle">${shelf.map((d) => `<button class="food-btn" data-food="${d.id}">${thumb(d)}<span>${esc(d.name)}</span></button>`).join('')}</div>
      <div class="basket"><div class="basket-items"></div>${icon('bag')}</div></div>`;
  };
  fr.body.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-food]') as HTMLElement | null;
    if (b && !b.classList.contains('taken')) {
      const id = b.dataset.food!;
      if (list.some((d) => d.id === id) && !got.has(id)) {
        got.add(id);
        b.classList.add('taken');
        sound.pop();
        fr.body.querySelector(`[data-li="${id}"]`)?.classList.add('done');
        fr.body.querySelector('.basket-items')!.insertAdjacentHTML('beforeend', `<span class="in-basket">${thumb(FURN_BY_ID[id])}</span>`);
        const r = b.getBoundingClientRect();
        burst('sparkle', r.left + r.width / 2, r.top + r.height / 2, 8);
        if (got.size === list.length) checkout();
      } else {
        wrong++;
        sound.wrong();
        b.classList.remove('nope');
        void b.offsetWidth;
        b.classList.add('nope');
        toast("That's not on the list!", 'cart');
      }
    }
    if ((e.target as Element).closest('[data-again]')) round();
  });
  const checkout = () => {
    window.setTimeout(() => {
      list.forEach((_, k) => window.setTimeout(() => sound.click(), k * 180));
      const coins = 12 + Math.max(0, 6 - wrong * 2);
      G.bump('groceries');
      G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      celebrate();
      sound.success();
      fr.body.insertAdjacentHTML('beforeend', `<div class="act-result"><div class="sp-card"><h2>All shopping done!</h2><p>Beep, beep! Everything is in the basket.</p><p class="earned">${icon('coin')} +${coins}</p><div class="row"><button class="btn primary" data-again>${icon('cart')}<span>New list</span></button></div></div></div>`);
    }, 400);
  };
  round();
}

// ---------------- restaurant ----------------
interface Ingredient { id: string; name: string; art: (y: number) => string; h: number }
const ING: Record<string, Ingredient> = {
  plate: { id: 'plate', name: 'Plate', h: 0, art: () => '' },
  bunB: { id: 'bunB', name: 'Bottom Bun', h: 26, art: (y) => `<path d="M-110 ${y} Q-110 ${y - 26} -60 ${y - 26} L60 ${y - 26} Q110 ${y - 26} 110 ${y}Z" fill="#e8a65a"/>` },
  patty: { id: 'patty', name: 'Veggie Patty', h: 26, art: (y) => `<rect x="-118" y="${y - 26}" width="236" height="26" rx="13" fill="#8a5a3c"/><path d="M-100 ${y - 18} l20 0 M-40 ${y - 12} l24 0 M30 ${y - 18} l22 0" stroke="#6b4226" stroke-width="4" stroke-linecap="round"/>` },
  cheese: { id: 'cheese', name: 'Cheese', h: 10, art: (y) => `<path d="M-115 ${y - 10} L115 ${y - 10} L115 ${y} L60 ${y} L40 ${y + 18} L20 ${y} L-115 ${y}Z" fill="#ffd84a"/>` },
  lettuce: { id: 'lettuce', name: 'Lettuce', h: 12, art: (y) => `<path d="M-125 ${y} q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 30 0 q15 -16 20 0Z" fill="#7fd36b"/>` },
  tomato: { id: 'tomato', name: 'Tomato', h: 12, art: (y) => [-70, 0, 70].map((x) => `<ellipse cx="${x}" cy="${y - 6}" rx="34" ry="8" fill="#e8384f"/>`).join('') },
  bunT: { id: 'bunT', name: 'Top Bun', h: 56, art: (y) => `<path d="M-115 ${y} Q-115 ${y - 70} 0 ${y - 70} Q115 ${y - 70} 115 ${y}Z" fill="#f0b46a"/>` + [[-50, 34], [0, 50], [46, 38], [-20, 20], [70, 18]].map(([x, d]) => `<ellipse cx="${x}" cy="${y - d}" rx="6" ry="3" fill="#fff3d6"/>`).join('') },
  dough: { id: 'dough', name: 'Dough', h: 18, art: (y) => `<ellipse cx="0" cy="${y - 9}" rx="150" ry="22" fill="#f4dca0"/><ellipse cx="0" cy="${y - 12}" rx="132" ry="16" fill="#f8e6b8"/>` },
  sauce: { id: 'sauce', name: 'Tomato Sauce', h: 4, art: (y) => `<ellipse cx="0" cy="${y - 4}" rx="125" ry="14" fill="#e8384f"/>` },
  mozz: { id: 'mozz', name: 'Mozzarella', h: 4, art: (y) => [-80, -30, 20, 70, -55, 45, -5].map((x, i) => `<ellipse cx="${x}" cy="${y - 4 - (i % 2) * 4}" rx="30" ry="8" fill="#fff3b0"/>`).join('') },
  pepperoni: { id: 'pepperoni', name: 'Pepperoni', h: 4, art: (y) => [-80, -20, 40, 90, -50, 10, 70].map((x, i) => `<ellipse cx="${x}" cy="${y - 4 - (i % 3) * 3}" rx="14" ry="6" fill="#c2244a"/>`).join('') },
  cup: { id: 'cup', name: 'Sundae Cup', h: 60, art: (y) => `<path d="M-90 ${y - 60} L90 ${y - 60} L60 ${y} L-60 ${y}Z" fill="#bfe8ff" opacity="0.85"/><rect x="-96" y="${y - 66}" width="192" height="10" rx="5" fill="#ffffff"/>` },
  vanilla: { id: 'vanilla', name: 'Vanilla Scoop', h: 50, art: (y) => `<circle cx="-30" cy="${y - 25}" r="40" fill="#fff6dc"/>` },
  choco: { id: 'choco', name: 'Chocolate Scoop', h: 40, art: (y) => `<circle cx="30" cy="${y - 5}" r="40" fill="#8a5a3c"/>` },
  strawberryS: { id: 'strawberryS', name: 'Strawberry Scoop', h: 44, art: (y) => `<circle cx="0" cy="${y - 22}" r="38" fill="#ff9ec7"/>` },
  sprinkles: { id: 'sprinkles', name: 'Sprinkles', h: 0, art: (y) => ['#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff4f8b'].flatMap((c, i) => [[-40 + i * 18, y - 20 - (i % 2) * 14], [-20 + i * 14, y + 4 - (i % 3) * 8]].map(([x, yy]) => `<rect x="${x}" y="${yy}" width="12" height="4" rx="2" fill="${c}" transform="rotate(${i * 37} ${x} ${yy})"/>`)).join('') },
  cherry: { id: 'cherry', name: 'Cherry', h: 0, art: (y) => `<path d="M0 ${y - 30} q8 -20 16 -30" stroke="#5f8f3a" stroke-width="3" fill="none"/><circle cx="0" cy="${y - 22}" r="14" fill="#e8384f"/><circle cx="-4" cy="${y - 26}" r="4" fill="#fff" opacity="0.6"/>` },
  pancake: { id: 'pancake', name: 'Pancake', h: 24, art: (y) => `<ellipse cx="0" cy="${y - 12}" rx="120" ry="16" fill="#e8a65a"/><ellipse cx="0" cy="${y - 16}" rx="116" ry="12" fill="#f0c27a"/>` },
  butter: { id: 'butter', name: 'Butter', h: 14, art: (y) => `<rect x="-24" y="${y - 16}" width="48" height="16" rx="4" fill="#fff3b0"/>` },
  syrup: { id: 'syrup', name: 'Syrup', h: 0, art: (y) => `<path d="M-90 ${y + 10} Q-60 ${y - 10} 0 ${y - 6} Q60 ${y - 10} 90 ${y + 10} L80 ${y + 40} Q70 ${y + 20} 60 ${y + 38} Q40 ${y + 14} 20 ${y + 30} Q-20 ${y + 10} -50 ${y + 34} Q-70 ${y + 16} -90 ${y + 10}Z" fill="#c98a3e" opacity="0.85"/>` },
  berries: { id: 'berries', name: 'Strawberries', h: 0, art: (y) => [-40, 0, 40].map((x) => `<path d="M${x - 14} ${y - 16} Q${x} ${y - 24} ${x + 14} ${y - 16} Q${x + 12} ${y} ${x} ${y + 6} Q${x - 12} ${y} ${x - 14} ${y - 16}Z" fill="#ff4f6d"/>`).join('') },
  bowl: { id: 'bowl', name: 'Bowl', h: 0, art: (y) => `<path d="M-140 ${y - 50} Q-140 ${y + 10} 0 ${y + 10} Q140 ${y + 10} 140 ${y - 50}Z" fill="#ffffff" stroke="#e6e0ee" stroke-width="3"/>` },
  greens: { id: 'greens', name: 'Lettuce', h: 0, art: (y) => [-90, -50, -10, 30, 70, -70, 50, 10].map((x, i) => `<ellipse cx="${x}" cy="${y - 54 - (i % 3) * 8}" rx="34" ry="18" fill="${i % 2 ? '#7fd36b' : '#5fc47c'}"/>`).join('') },
  cucumber: { id: 'cucumber', name: 'Cucumber', h: 0, art: (y) => [-60, 0, 60].map((x) => `<circle cx="${x}" cy="${y - 70}" r="16" fill="#b6e79a" stroke="#3fbf8f" stroke-width="4"/>`).join('') },
  tomatoS: { id: 'tomatoS', name: 'Tomatoes', h: 0, art: (y) => [-30, 40, 90].map((x) => `<circle cx="${x}" cy="${y - 78}" r="14" fill="#e8384f"/>`).join('') },
  dressing: { id: 'dressing', name: 'Dressing', h: 0, art: (y) => `<path d="M-80 ${y - 80} q20 -14 40 0 t40 0 t40 0 t40 0" stroke="#fff3d6" stroke-width="7" fill="none" stroke-linecap="round"/>` },
};
const DISHES: { id: string; name: string; steps: string[] }[] = [
  { id: 'burger', name: 'Burger', steps: ['bunB', 'patty', 'cheese', 'lettuce', 'tomato', 'bunT'] },
  { id: 'pizza', name: 'Pizza', steps: ['dough', 'sauce', 'mozz', 'pepperoni'] },
  { id: 'sundae', name: 'Ice Cream Sundae', steps: ['cup', 'vanilla', 'choco', 'strawberryS', 'sprinkles', 'cherry'] },
  { id: 'pancakes', name: 'Pancakes', steps: ['pancake', 'pancake', 'pancake', 'butter', 'syrup', 'berries'] },
  { id: 'salad', name: 'Salad', steps: ['bowl', 'greens', 'cucumber', 'tomatoS', 'dressing'] },
];

function dishSvg(steps: string[], upto: number): string {
  let y = 230;
  let s = `<ellipse cx="0" cy="${y + 6}" rx="190" ry="34" fill="#ffffff" stroke="#e6e0ee" stroke-width="4"/><ellipse cx="0" cy="${y + 4}" rx="150" ry="22" fill="#f6f1fa"/>`;
  for (let i = 0; i < upto; i++) {
    const g = ING[steps[i]];
    s += `<g class="${i === upto - 1 ? 'drop-in' : ''}">${g.art(y)}</g>`;
    y -= g.h;
  }
  return `<svg viewBox="-220 -120 440 400">${s}</svg>`;
}
const ingBtn = (id: string) => {
  const g = ING[id];
  const y = g.id === 'bowl' ? 20 : g.id === 'cup' ? 40 : g.id === 'greens' || g.id === 'cucumber' || g.id === 'tomatoS' || g.id === 'dressing' ? 80 : 10 + g.h / 2;
  return `<svg viewBox="-150 -60 300 110">${g.art(y)}</svg>`;
};

export function openRestaurant(onClose: () => void): void {
  const fr = frame('kitchen-game', 'Chef Time!', onClose);
  let served = 0;
  const order = () => {
    const dish = pick(DISHES);
    const guest = pick(G.s.dolls);
    let step = 0;
    let oops = 0;
    const extras = shuffle(Object.keys(ING).filter((k) => k !== 'plate' && !dish.steps.includes(k))).slice(0, 3);
    const choices = shuffle([...new Set([...dish.steps, ...extras])]);
    fr.body.innerHTML = `<div class="kitchen"><div class="guest"><div class="guest-doll">${dollSvg(guest, 'normal')}</div><div class="bubble"><b>${esc(guest.name)} wants</b><span>${esc(dish.name)}</span><small>Served today: ${served}</small></div></div>
      <div class="plate-area"><div class="recipe">${dish.steps.map((s, k) => `<span class="rstep" data-k="${k}">${esc(ING[s].name)}</span>`).join('<i>›</i>')}</div><div class="plate">${dishSvg(dish.steps, 0)}</div></div>
      <div class="ingredients">${choices.map((c) => `<button class="ing" data-ing="${c}">${ingBtn(c)}<span>${esc(ING[c].name)}</span></button>`).join('')}</div></div>`;
    const mark = () => fr.body.querySelectorAll<HTMLElement>('.rstep').forEach((r) => {
      const k = Number(r.dataset.k);
      r.classList.toggle('done', k < step);
      r.classList.toggle('now', k === step);
    });
    mark();
    fr.body.onclick = (e) => {
      const b = (e.target as Element).closest('[data-ing]') as HTMLElement | null;
      if (b) {
        if (b.dataset.ing === dish.steps[step]) {
          step++;
          sound.pop();
          fr.body.querySelector('.plate')!.innerHTML = dishSvg(dish.steps, step);
          mark();
          if (step >= dish.steps.length) serve();
        } else {
          oops++;
          sound.wrong();
          b.classList.remove('nope');
          void b.offsetWidth;
          b.classList.add('nope');
          toast(`Not yet! Next is ${ING[dish.steps[step]].name}.`, 'cake');
        }
      }
      if ((e.target as Element).closest('[data-next]')) order();
    };
    const serve = () => {
      served++;
      const stars = oops === 0 ? 3 : oops < 3 ? 2 : 1;
      const tip = 6 + stars * 3;
      window.setTimeout(() => {
        fr.body.querySelector('.guest-doll')!.innerHTML = dollSvg(guest, 'yum');
        sound.yum();
        const r = fr.body.querySelector('.plate')!.getBoundingClientRect();
        burst('heart', r.left + r.width / 2, r.top + 40, 14);
        G.bump('cooked');
        G.earn(tip, { x: r.left + r.width / 2, y: r.top });
        fr.body.insertAdjacentHTML('beforeend', `<div class="act-result"><div class="sp-card"><div class="done-stars">${icon('star').repeat(stars)}</div><h2>Yummy!</h2><p>${esc(guest.name)} loved the ${esc(dish.name.toLowerCase())}!</p><p class="earned">${icon('coin')} +${tip} tip</p><div class="row"><button class="btn primary" data-next>${icon('cake')}<span>Next order</span></button></div></div></div>`);
      }, 450);
    };
  };
  order();
}
const dollSvg = (d: Doll, expr: 'normal' | 'happy' | 'yum' | 'sleep' | 'surprised', pose: 'stand' | 'sit' = 'stand') => {
  const b = body(d.look.age, !!d.look.boy);
  const top = b.headY - b.R * 1.4;
  return still(`<svg viewBox="-170 ${f(top)} 340 ${f(-top + 20)}">${renderDoll(d.look, { expr, pose })}</svg>`);
};

// ---------------- hospital ----------------
type Ailment = 'fever' | 'scrape' | 'cough' | 'bump' | 'heart';
const TOOLS: { id: Ailment; tool: string; name: string; tip: string }[] = [
  { id: 'fever', tool: 'thermometer', name: 'Thermometer', tip: 'Check the temperature' },
  { id: 'scrape', tool: 'bandage', name: 'Bandage', tip: 'Cover the scrape' },
  { id: 'cough', tool: 'medicine', name: 'Medicine', tip: 'A spoon of cherry medicine' },
  { id: 'bump', tool: 'icepack', name: 'Ice Pack', tip: 'Cool the bump' },
  { id: 'heart', tool: 'stethoscope', name: 'Stethoscope', tip: 'Listen to the heart' },
];
function toolArt(t: string): string {
  switch (t) {
    case 'thermometer': return `<svg viewBox="-40 -40 80 80"><rect x="-6" y="-34" width="12" height="52" rx="6" fill="#fff" stroke="#c9cfdd" stroke-width="2"/><rect x="-2.5" y="-10" width="5" height="26" rx="2.5" fill="#ff4f6d"/><circle cx="0" cy="22" r="10" fill="#ff4f6d"/></svg>`;
    case 'bandage': return `<svg viewBox="-40 -40 80 80"><g transform="rotate(-30)"><rect x="-34" y="-12" width="68" height="24" rx="12" fill="#ffd9b8"/><rect x="-12" y="-12" width="24" height="24" fill="#fff3e6"/>${[[-24, -4], [-24, 4], [20, -4], [20, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#e8b48a"/>`).join('')}<path d="${heartD(0, -6, 7)}" fill="#ff9ec7"/></g></svg>`;
    case 'medicine': return `<svg viewBox="-40 -40 80 80"><rect x="-14" y="-20" width="28" height="44" rx="6" fill="#ff7eb6"/><rect x="-10" y="-30" width="20" height="12" rx="3" fill="#fff"/><rect x="-10" y="-6" width="20" height="14" rx="3" fill="#fff"/><path d="M-4 1 h8 M0 -3 v8" stroke="#ff4f6d" stroke-width="3"/></svg>`;
    case 'icepack': return `<svg viewBox="-40 -40 80 80"><rect x="-28" y="-20" width="56" height="40" rx="14" fill="#9fd6ff"/><rect x="-20" y="-12" width="12" height="12" rx="3" fill="#ffffff" opacity="0.8"/><rect x="2" y="-4" width="14" height="14" rx="3" fill="#ffffff" opacity="0.8"/></svg>`;
    case 'stethoscope': return `<svg viewBox="-40 -40 80 80"><path d="M-16 -30 Q-20 0 0 10 Q20 0 16 -30" fill="none" stroke="#4a4a5e" stroke-width="5"/><path d="M0 10 Q2 26 18 26" fill="none" stroke="#4a4a5e" stroke-width="5"/><circle cx="22" cy="24" r="10" fill="url(#g-silver)" stroke="#9aa3b5" stroke-width="2"/><circle cx="-16" cy="-32" r="4" fill="#ff9ec7"/><circle cx="16" cy="-32" r="4" fill="#ff9ec7"/></svg>`;
  }
  return '';
}

export function openDoctor(dollId: string | undefined, onClose: () => void): void {
  const fr = frame('doctor-game', 'Doctor Time', onClose);
  let patient: Doll = G.s.dolls.find((d) => d.id === dollId) ?? G.s.dolls[0];
  let ail: Ailment[] = [];
  let fixed = new Set<string>();
  let tool: Ailment | null = null;
  const spots = () => {
    const b = body(patient.look.age, !!patient.look.boy);
    return {
      fever: [0, b.headY - b.R * 0.45], bump: [b.R * 0.55, b.headY - b.R * 0.62], cough: [0, b.headY + b.R * 0.7], heart: [-10, b.shY + 32],
      scrape: [b.armX + 10, b.armY + b.armLen * 0.7], scrape2: [-b.legX, b.hipY - b.legLen * 0.45],
    } as Record<string, [number, number]>;
  };
  const drawPatient = (happy = false) => {
    const b = body(patient.look.age, !!patient.look.boy);
    const sp = spots();
    let over = '';
    for (const a of ail) {
      const done = fixed.has(a);
      const [x, y] = sp[a];
      if (a === 'fever') over += done ? '' : `<ellipse cx="0" cy="${f(b.headY - b.R * 0.3)}" rx="${f(b.R * 0.8)}" ry="${f(b.R * 0.35)}" fill="#ff4f6d" opacity="0.25"/><g class="pulse"><path d="M${f(b.R * 0.75)} ${f(b.headY - b.R * 0.9)} q8 10 0 20 q-8 10 0 20" stroke="#7cc8ff" stroke-width="5" fill="none"/></g>`;
      if (a === 'scrape') for (const [sx, sy] of [sp.scrape, sp.scrape2]) over += done ? `<g transform="translate(${f(sx)} ${f(sy)}) rotate(-25)"><rect x="-22" y="-8" width="44" height="16" rx="8" fill="#ffd9b8"/><rect x="-7" y="-8" width="14" height="16" fill="#fff3e6"/><path d="${heartD(0, -4, 4.5)}" fill="#ff9ec7"/></g>` : `<g class="pulse"><ellipse cx="${f(sx)}" cy="${f(sy)}" rx="12" ry="8" fill="#ff7a8a"/><ellipse cx="${f(sx)}" cy="${f(sy)}" rx="6" ry="3" fill="#ffb3c0"/></g>`;
      if (a === 'bump') over += done ? '' : `<g class="pulse"><circle cx="${f(x)}" cy="${f(y)}" r="${f(b.R * 0.15)}" fill="#ff9ab0" opacity="0.8"/>${[0, 1, 2].map((k) => `<path d="${starD(x + 24 + k * 12, y - 30 - k * 10, 6)}" fill="#ffe680"/>`).join('')}</g>`;
      if (a === 'cough') over += done ? '' : `<g class="cough"><circle cx="${f(x + 40)}" cy="${f(y)}" r="12" fill="#e6e8f0"/><circle cx="${f(x + 62)}" cy="${f(y - 10)}" r="9" fill="#e6e8f0"/><circle cx="${f(x + 78)}" cy="${f(y - 22)}" r="6" fill="#e6e8f0"/></g>`;
      if (a === 'heart') over += `<g class="${done ? 'beat' : 'pulse'}"><path d="${heartD(x, y - 14, done ? 18 : 12)}" fill="${done ? '#ff4f8b' : '#ff9ec7'}" opacity="${done ? 0.95 : 0.6}"/></g>`;
    }
    const top = b.headY - b.R * 1.5;
    fr.body.querySelector('.patient')!.innerHTML = `<svg viewBox="-200 ${f(top)} 400 ${f(-top + 30)}"><ellipse cx="0" cy="0" rx="120" ry="22" fill="url(#g-ground)"/>${still(renderDoll(patient.look, { expr: happy ? 'happy' : ail.length - fixed.size > 1 ? 'surprised' : 'normal' }))}${over}</svg>`;
  };
  const start = () => {
    ail = shuffle(TOOLS.map((t) => t.id)).slice(0, 3);
    fixed = new Set();
    tool = null;
    fr.body.innerHTML = `<div class="clinic"><div class="patients">${G.s.dolls.map((d) => `<button class="ava${d === patient ? ' on' : ''}" data-patient="${d.id}">${headThumb(d.look)}</button>`).join('')}</div>
      <div class="patient"></div><div class="chart"><h3>${esc(patient.name)}'s check-up</h3><ul>${ail.map((a) => `<li data-ail="${a}">${toolArt(TOOLS.find((t) => t.id === a)!.tool)}<span>${esc(TOOLS.find((t) => t.id === a)!.tip)}</span></li>`).join('')}</ul></div>
      <div class="tools">${TOOLS.map((t) => `<button class="tool" data-tool="${t.id}">${toolArt(t.tool)}<span>${t.name}</span></button>`).join('')}</div></div>`;
    drawPatient();
  };
  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    const pb = t.closest('[data-patient]') as HTMLElement | null;
    if (pb) {
      patient = G.s.dolls.find((d) => d.id === pb.dataset.patient) ?? patient;
      sound.giggle();
      return start();
    }
    const tb = t.closest('[data-tool]') as HTMLElement | null;
    if (tb) {
      tool = tb.dataset.tool as Ailment;
      fr.body.querySelectorAll('.tool').forEach((x) => x.classList.toggle('on', x === tb));
      if (!ail.includes(tool) || fixed.has(tool)) {
        sound.tap();
        toast(fixed.has(tool) ? 'Already done! Try another tool.' : `${patient.name} doesn't need that today.`, 'heart');
        return;
      }
      fixed.add(tool);
      if (tool === 'heart') {
        sound.thud();
        window.setTimeout(() => sound.thud(), 320);
        toast('Thump-thump! A strong, happy heart.', 'heart');
      } else if (tool === 'fever') toast('Just a little warm. A good rest will help!', 'heart');
      else sound.sparkle();
      sound.pop();
      fr.body.querySelector(`[data-ail="${tool}"]`)?.classList.add('done');
      const r = fr.body.querySelector('.patient')!.getBoundingClientRect();
      burst('sparkle', r.left + r.width / 2, r.top + r.height * 0.35, 12);
      drawPatient();
      if (fixed.size === ail.length) window.setTimeout(allBetter, 500);
    }
    if (t.closest('[data-again]')) start();
  });
  const allBetter = () => {
    drawPatient(true);
    sound.success();
    celebrate();
    G.bump('patients');
    G.earn(15, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    fr.body.insertAdjacentHTML('beforeend', `<div class="act-result"><div class="sp-card"><div class="done-stars">${icon('heart')}${icon('star')}${icon('heart')}</div><h2>All better!</h2><p>${esc(patient.name)} feels great. Thank you, Doctor!</p><p class="earned">${icon('coin')} +15</p><div class="row"><button class="btn primary" data-again>${icon('heart')}<span>Next patient</span></button></div></div></div>`);
    const others = G.s.dolls.filter((d) => d !== patient);
    if (others.length) patient = pick(others);
  };
  start();
}

// ---------------- car wash ----------------
export function openCarWash(onClose: () => void, onGarage: (id: string, color: string) => void): void {
  const fr = frame('carwash-game', 'Car Wash', onClose);
  const cars = FURNITURE.filter((d) => d.cat === 'cars' && (d.seats?.length ?? 0) > 0 && d.w > 250);
  const owned = cars.filter((d) => G.owns(d.id));
  let car: FurnDef | undefined;
  let color = '';
  type Blob = { x: number; y: number; r: number; gone: boolean };
  let mud: Blob[] = [];
  let suds: Blob[] = [];
  let phase: 'scrub' | 'rinse' | 'shine' | 'paint' = 'scrub';
  const start = () => {
    car = pick(owned.length ? owned : cars);
    if (!car) {
      fr.body.innerHTML = `<p class="act-tip">No cars yet! Look for cars in the Car Shop catalog.</p>`;
      return;
    }
    color = car.color ?? '#ff7eb6';
    phase = 'scrub';
    const vb = furnViewBox(car).split(' ').map(Number);
    mud = Array.from({ length: 22 }, () => ({ x: vb[0] + vb[2] * (0.15 + Math.random() * 0.7), y: vb[1] + vb[3] * (0.3 + Math.random() * 0.55), r: 16 + Math.random() * 22, gone: false }));
    suds = [];
    fr.body.innerHTML = `<div class="wash"><div class="wash-steps"><span data-ph="scrub">1. Scrub</span><span data-ph="rinse">2. Rinse</span><span data-ph="shine">3. Shine</span><span data-ph="paint">4. Paint</span></div>
      <div class="wash-car"></div><div class="wash-tools"></div></div>`;
    draw();
    tools();
  };
  const draw = () => {
    if (!car) return;
    const vb = furnViewBox(car);
    const art = car.art(color, phase === 'shine' || phase === 'paint') + (car.front ? car.front(color, false) : '');
    const mudArt = mud.filter((m) => !m.gone).map((m) => `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(m.r)}" fill="#8a6a4a" opacity="0.85"/><circle cx="${f(m.x - m.r * 0.3)}" cy="${f(m.y - m.r * 0.3)}" r="${f(m.r * 0.35)}" fill="#6b4a3a" opacity="0.7"/>`).join('');
    const sudArt = suds.filter((m) => !m.gone).map((m) => `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(m.r)}" fill="#ffffff" opacity="0.92" stroke="#bfe8ff" stroke-width="2"/>`).join('');
    const shine = phase === 'shine' || phase === 'paint' ? [0.2, 0.5, 0.8].map((k, i) => `<path d="${sparkleD(Number(vb.split(' ')[0]) + Number(vb.split(' ')[2]) * k, Number(vb.split(' ')[1]) + Number(vb.split(' ')[3]) * (0.3 + i * 0.15), 22)}" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="${i * 0.3}s" repeatCount="indefinite"/></path>`).join('') : '';
    fr.body.querySelector('.wash-car')!.innerHTML = `<svg viewBox="${vb}" class="wash-svg">${still(art)}${mudArt}${sudArt}${shine}</svg>`;
    fr.body.querySelectorAll<HTMLElement>('[data-ph]').forEach((s) => s.classList.toggle('on', s.dataset.ph === phase));
  };
  const tools = () => {
    const t = fr.body.querySelector('.wash-tools')!;
    if (phase === 'scrub') t.innerHTML = `<p class="act-tip">${icon('hand')} Rub the mud with your finger to scrub it off!</p>`;
    if (phase === 'rinse') t.innerHTML = `<p class="act-tip">${icon('sound')} Now rub again to rinse off the bubbles!</p>`;
    if (phase === 'shine') t.innerHTML = `<p class="act-tip">Sparkly clean!</p><button class="btn primary" data-paint>${icon('paint')}<span>Paint it</span></button>`;
    if (phase === 'paint') t.innerHTML = `<div class="paint-row">${PALETTE.map((c) => `<button class="dot${c === color ? ' on' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
      <div class="row"><button class="btn" data-again>${icon('car')}<span>Wash another</span></button><button class="btn primary" data-garage>${icon('home')}<span>Park at home</span></button></div>`;
  };
  let lastSnd = 0;
  const rub = (e: PointerEvent) => {
    const svg = fr.body.querySelector('.wash-svg') as SVGSVGElement | null;
    if (!svg || (phase !== 'scrub' && phase !== 'rinse')) return;
    const m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    let changed = false;
    if (phase === 'scrub') {
      for (const b of mud) if (!b.gone && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 30) {
        b.gone = true;
        changed = true;
        suds.push({ x: b.x, y: b.y, r: b.r * 0.9, gone: false }, { x: b.x + 12, y: b.y - 10, r: b.r * 0.6, gone: false });
      }
      if (changed && performance.now() - lastSnd > 120) {
        sound.squeak();
        lastSnd = performance.now();
      }
      if (mud.every((b) => b.gone)) {
        phase = 'rinse';
        sound.success();
        toast('Bubbly! Now rinse.', 'star');
        tools();
      }
    } else {
      for (const b of suds) if (!b.gone && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 34) {
        b.gone = true;
        changed = true;
      }
      if (changed && performance.now() - lastSnd > 150) {
        sound.spray();
        lastSnd = performance.now();
      }
      if (suds.every((b) => b.gone)) {
        phase = 'shine';
        sound.sparkle();
        celebrate();
        G.bump('carwash');
        G.earn(12, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        tools();
      }
    }
    if (changed || phase === 'shine') draw();
  };
  let down = false;
  fr.body.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('.wash-car')) {
      down = true;
      rub(e);
    }
  });
  fr.body.addEventListener('pointermove', (e) => down && rub(e));
  window.addEventListener('pointerup', () => (down = false));
  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-paint]')) {
      phase = 'paint';
      tools();
      draw();
    }
    const c = t.closest('[data-color]') as HTMLElement | null;
    if (c) {
      color = c.dataset.color!;
      sound.spray();
      tools();
      draw();
    }
    if (t.closest('[data-again]')) start();
    if (t.closest('[data-garage]') && car) {
      onGarage(car.id, color);
      sound.success();
      toast(`Your shiny ${car.name} is parked in your backyard!`, 'car');
      fr.close();
    }
  });
  start();
}

void dark;
void light;
