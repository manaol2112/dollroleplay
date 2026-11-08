// The running game: holds the saved state, saves it, and tells the screen when coins or challenges change.
import { setMusic, setSound, sound } from './engine/audio';
import { burst } from './engine/particles';
import { activeChallenges, bump as bumpStat, buy as buyItem, isDone, isOwned, newState, parseState, priceOf, type GameState, type ItemKey } from './data/state';
import { challengeById } from './data/challenges';
import { icon } from './ui/icons';

const KEY = 'dollroleplay.save.v1';

function load(): GameState {
  try {
    const s = parseState(localStorage.getItem(KEY));
    if (s) return s;
  } catch {
    /* storage blocked: start fresh */
  }
  return newState();
}

type Listener = () => void;

class Game {
  s: GameState = load();
  private listeners = new Set<Listener>();
  private saveTimer: number | null = null;
  private announced = new Set<string>();

  constructor() {
    for (const c of activeChallenges(this.s)) if (isDone(this.s, c)) this.announced.add(c.id);
    setSound(this.s.settings.sound);
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && this.flush());
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Call after any change: saves soon and refreshes the coin and challenge counters. */
  changed(): void {
    this.checkChallenges();
    for (const fn of this.listeners) fn();
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.flush(), 400);
  }

  flush(): void {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch {
      /* storage full or blocked: keep playing */
    }
  }

  bump(stat: string, n = 1): void {
    bumpStat(this.s, stat, n);
    this.changed();
  }

  owns = (key: ItemKey) => isOwned(this.s, key);
  price = (key: ItemKey) => priceOf(key);

  buy(key: ItemKey): boolean {
    const ok = buyItem(this.s, key);
    if (ok) {
      sound.coin();
      this.changed();
    } else {
      sound.wrong();
      toast(`You need ${priceOf(key) - this.s.coins} more coins. Try a challenge!`, 'coin');
    }
    return ok;
  }

  earn(n: number, from?: { x: number; y: number }): void {
    this.s.coins += n;
    coinFly(n, from);
    this.changed();
  }

  visit(placeOrBuilding: string): void {
    if (!this.s.visited.includes(placeOrBuilding)) {
      this.s.visited.push(placeOrBuilding);
      this.changed();
    }
  }

  setSettings(k: 'sound' | 'music', v: boolean): void {
    this.s.settings[k] = v;
    if (k === 'sound') setSound(v);
    else setMusic(v);
    this.changed();
  }

  reset(): void {
    this.s = newState();
    this.announced.clear();
    this.flush();
  }

  private checkChallenges(): void {
    for (const c of activeChallenges(this.s)) {
      if (!this.announced.has(c.id) && isDone(this.s, c)) {
        this.announced.add(c.id);
        window.setTimeout(() => {
          sound.success();
          toast(`Challenge done: ${c.text}! Tap the star to collect ${c.reward} coins.`, 'star', true);
        }, 350);
      }
    }
  }

  challengeText = (id: string) => challengeById(id)?.text ?? '';
}

export const G = new Game();

// ---------------- little screen effects that many places use ----------------
let toastTimer: number | null = null;
export function toast(text: string, ic = 'heart', big = false): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = `<div class="toast-in${big ? ' big' : ''}"><span class="ic">${icon(ic)}</span><span>${text}</span></div>`;
  el.classList.add('show');
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), big ? 3600 : 2400);
}

export function coinFly(n: number, from?: { x: number; y: number }): void {
  const target = document.querySelector('#hud .coins');
  const tr = target?.getBoundingClientRect();
  const sx = from?.x ?? window.innerWidth / 2;
  const sy = from?.y ?? window.innerHeight / 2;
  burst('sparkle', sx, sy, 14);
  const count = Math.min(12, Math.max(4, Math.round(n / 5)));
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'fly-coin';
    c.innerHTML = icon('coin');
    c.style.left = sx + 'px';
    c.style.top = sy + 'px';
    document.body.appendChild(c);
    const dx = (tr ? tr.left + 20 : window.innerWidth - 120) - sx;
    const dy = (tr ? tr.top + 18 : 30) - sy;
    const mx = (Math.random() - 0.5) * 160;
    const my = -60 - Math.random() * 80;
    const anim = c.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px)) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 1 },
      ],
      { duration: 900 + i * 60, easing: 'cubic-bezier(.5,0,.3,1)' },
    );
    anim.onfinish = () => {
      c.remove();
      if (i % 3 === 0) sound.coin();
      document.querySelector('#hud .coins')?.classList.add('bump');
      window.setTimeout(() => document.querySelector('#hud .coins')?.classList.remove('bump'), 200);
    };
  }
}
