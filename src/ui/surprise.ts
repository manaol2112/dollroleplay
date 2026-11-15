// The daily surprise box: a wrapped present that wiggles, unties and pops open on the third tap, with coins,
// a sticker or a free outfit, hairstyle or piece of furniture inside. Once a day; then it sleeps till midnight.
import './stickers.css';
import { HAIR } from '../art/doll';
import { FURNITURE, FURN_BY_ID, furnThumb, type FurnCat } from '../art/furniture';
import { STICKER_BY_ID, stickerSvg } from '../art/stickers';
import { WEAR, WEAR_BY_ID } from '../art/wear';
import { baseLook, wornOf } from '../data/looks';
import { dayKey, priceOf } from '../data/state';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G } from '../game';
import type { Look } from '../types';
import { frame } from './activities';
import { esc, lookThumb, slotBox } from './dom';
import { icon } from './icons';
import { awardSticker } from './stickers';

export const surpriseReady = (now = new Date()): boolean => G.s.surpriseDay !== dayKey(now);

// ---------------- what is inside (no page access, so it can be tested) ----------------
export type Prize = { kind: 'coins'; n: number } | { kind: 'sticker' } | { kind: 'item'; key: string };

/** Gifts stay cheap to mid priced, and furniture comes from around the house, not the town shops. */
export const PRIZE_MIN = 15;
export const PRIZE_MAX = 60;
const HOME_CATS: FurnCat[] = ['bedroom', 'kids', 'living', 'electronics', 'lighting', 'kitchen', 'bath', 'decor', 'plants', 'wall', 'rugs', 'yard', 'toys', 'outdoor'];

/** Items the box may give: not owned yet, priced 15-60. Wear and hair keys as in the shop. */
export function prizeItems(owned: readonly string[]): { wear: string[]; furniture: string[]; hair: string[] } {
  const have = new Set(owned);
  const ok = (key: string) => {
    const p = priceOf(key);
    return p >= PRIZE_MIN && p <= PRIZE_MAX && !have.has(key);
  };
  return {
    wear: WEAR.map((w) => w.id).filter(ok),
    furniture: FURNITURE.filter((f) => HOME_CATS.includes(f.cat)).map((f) => f.id).filter(ok),
    hair: HAIR.map((h) => 'hair:' + h.id).filter(ok),
  };
}

/** Coins about a third of the time, a sticker a third, and a free item the rest (if any are left). */
export function pickPrize(owned: readonly string[], rnd: () => number = Math.random): Prize {
  const coins = (): Prize => ({ kind: 'coins', n: 25 + Math.round(rnd() * 7) * 5 });
  const roll = rnd();
  if (roll < 0.34) return coins();
  if (roll < 0.67) return { kind: 'sticker' };
  const items = prizeItems(owned);
  const r2 = rnd();
  const order = r2 < 0.5 ? [items.wear, items.furniture, items.hair] : r2 < 0.82 ? [items.furniture, items.wear, items.hair] : [items.hair, items.wear, items.furniture];
  const list = order.find((l) => l.length);
  if (!list) return coins();
  return { kind: 'item', key: list[Math.min(list.length - 1, Math.floor(rnd() * list.length))] };
}

export function msToMidnight(now = new Date()): number {
  const m = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, m.getTime() - now.getTime());
}
const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ---------------- drawing ----------------
const dots = [[86, 176], [214, 176], [100, 236], [200, 236], [72, 210], [228, 210]];
function boxSvg(sleeping: boolean): string {
  const heart = (x: number, y: number, s: number) => `M${x} ${y + s * 0.3} C${x - s * 0.5} ${y - s * 0.25} ${x - s * 1.05} ${y + s * 0.25} ${x} ${y + s} C${x + s * 1.05} ${y + s * 0.25} ${x + s * 0.5} ${y - s * 0.25} ${x} ${y + s * 0.3}Z`;
  const eyes = sleeping
    ? `<path d="M106 196 Q116 206 126 196 M174 196 Q184 206 194 196" fill="none" stroke="#4a2546" stroke-width="5" stroke-linecap="round"/>`
    : `<g class="sbx-eyes"><ellipse cx="116" cy="196" rx="8" ry="10" fill="#4a2546"/><ellipse cx="184" cy="196" rx="8" ry="10" fill="#4a2546"/><circle cx="119" cy="192" r="3.2" fill="#fff"/><circle cx="187" cy="192" r="3.2" fill="#fff"/></g>` +
      `<g class="sbx-squint"><path d="M106 199 Q116 186 126 199 M174 199 Q184 186 194 199" fill="none" stroke="#4a2546" stroke-width="5" stroke-linecap="round"/></g>`;
  const mouth = sleeping ? `<ellipse cx="150" cy="222" rx="6" ry="7" fill="#c93a72"/>` : `<path d="M138 214 Q150 230 162 214Z" fill="#c93a72" stroke="#4a2546" stroke-width="3" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 300 300" aria-hidden="true"><defs>
    <linearGradient id="sbx-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3d6"/><stop offset="1" stop-color="#ff86b8"/></linearGradient>
    <linearGradient id="sbx-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ec7"/><stop offset="1" stop-color="#f56aa4"/></linearGradient>
    <linearGradient id="sbx-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd36b"/><stop offset="0.5" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffc94a"/></linearGradient></defs>
    <ellipse cx="150" cy="282" rx="104" ry="12" fill="#7a2a55" opacity="0.14"/>
    <g class="sbx-base"><path d="M60 140 H240 V254 Q240 276 218 276 H82 Q60 276 60 254Z" fill="url(#sbx-body)"/>
      ${dots.map(([x, y]) => `<path d="${heart(x, y - 8, 14)}" fill="#fff" opacity="0.45"/>`).join('')}
      <rect class="sbx-band" x="134" y="140" width="32" height="136" fill="url(#sbx-gold)"/>
      <rect x="60" y="140" width="180" height="14" fill="#c93a72" opacity="0.15"/><path class="sbx-inside" d="M60 140 H240 L226 156 H74Z" fill="#b8336a" opacity="0.45"/>
      ${eyes}${mouth}<ellipse cx="96" cy="214" rx="12" ry="7" fill="#ff5f96" opacity="0.5"/><ellipse cx="204" cy="214" rx="12" ry="7" fill="#ff5f96" opacity="0.5"/>
      <path d="M72 160 Q70 200 76 250" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.45"/></g>
    <g class="sbx-lid"><rect x="46" y="106" width="208" height="44" rx="16" fill="url(#sbx-lid)"/><rect class="sbx-band" x="132" y="106" width="36" height="44" fill="url(#sbx-gold)"/>
      <path d="M62 116 L120 116" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.5"/></g>
    <g class="sbx-bow">
      <g class="loop l"><path d="M150 106 C120 64 76 74 88 100 C96 116 128 112 150 106Z" fill="url(#sbx-gold)" stroke="#f0b840" stroke-width="3"/><path d="M146 104 C124 84 104 86 104 96" fill="none" stroke="#e0a11e" stroke-width="3" stroke-linecap="round"/></g>
      <g class="loop r"><path d="M150 106 C180 64 224 74 212 100 C204 116 172 112 150 106Z" fill="url(#sbx-gold)" stroke="#f0b840" stroke-width="3"/><path d="M154 104 C176 84 196 86 196 96" fill="none" stroke="#e0a11e" stroke-width="3" stroke-linecap="round"/></g>
      <circle cx="150" cy="104" r="13" fill="#ffc94a" stroke="#f0b840" stroke-width="3"/><circle cx="146" cy="100" r="4" fill="#fff" opacity="0.7"/></g>
  </svg>`;
}

const raysSvg = `<svg viewBox="-100 -100 200 200" aria-hidden="true"><defs><radialGradient id="sbx-ray"><stop offset="0" stop-color="#fff6c8" stop-opacity="1"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>${Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-9 -100 L9 -100Z" fill="url(#sbx-ray)" transform="rotate(${i * 30})"/>`).join('')}<circle r="40" fill="url(#sbx-ray)"/></svg>`;

const sparkleSvg = (c: string) => `<svg viewBox="0 0 20 20"><path d="M10 0 Q11.5 8.5 20 10 Q11.5 11.5 10 20 Q8.5 11.5 0 10 Q8.5 8.5 10 0Z" fill="${c}"/></svg>`;
const SPARK_COLS = ['#fff', '#ffd36b', '#ff9ec7', '#c99bff', '#8fd3ff'];

function sparkles(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const size = 18 + ((i * 7) % 4) * 9;
    s += `<i class="sbx-spark" style="left:${(i * 37 + 7) % 96}%;top:${(i * 53 + 11) % 92}%;width:${size}px;height:${size}px;animation-delay:${((i * 0.37) % 2.4).toFixed(2)}s">${sparkleSvg(SPARK_COLS[i % SPARK_COLS.length])}</i>`;
  }
  return s;
}

function itemThumb(key: string): string {
  const model: Look = G.s.dolls[0]?.look ?? baseLook();
  if (key.startsWith('hair:')) return lookThumb({ ...model, hair: key.slice(5) }, slotBox(model, 'hair'), { headOnly: true });
  const f = FURN_BY_ID[key];
  if (f) return furnThumb(f);
  const w = WEAR_BY_ID[key];
  if (!w) return '';
  const slot = w.slot;
  const l: Look = { ...model, wear: { ...model.wear, [slot]: wornOf(key) } };
  if (slot === 'dress') {
    delete l.wear.top;
    delete l.wear.bottom;
  }
  if (slot === 'top' || slot === 'bottom') delete l.wear.dress;
  const box = slot === 'hand' || slot === 'back' ? slotBox(l, 'full') : slotBox(l, slot === 'face' ? 'face' : slot);
  return lookThumb(l, box, { headOnly: slot === 'face' || slot === 'head' });
}
const itemName = (key: string) =>
  key.startsWith('hair:') ? HAIR.find((h) => h.id === key.slice(5))?.name ?? 'New hairstyle' : FURN_BY_ID[key]?.name ?? WEAR_BY_ID[key]?.name ?? 'A present';

const coinPile = `<svg viewBox="0 0 120 100" aria-hidden="true">${[[34, 70], [60, 76], [86, 70], [46, 52], [74, 52], [60, 32]].map(([x, y]) =>
  `<g transform="translate(${x} ${y})"><circle r="22" fill="#e0a11e"/><circle r="20" fill="#ffd24a"/><circle r="14.5" fill="#ffe27a"/><path d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.8 7.6 L0 3.8 L-5.8 7.6 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8Z" fill="#ffc21e"/><ellipse cx="-8" cy="-10" rx="5" ry="2.6" fill="#fff" opacity="0.7" transform="rotate(-30 -8 -10)"/></g>`).join('')}</svg>`;

// ---------------- the screen ----------------
/** Opens today's surprise box (or the sleeping box with a countdown if it was opened today). `opts.prize` fixes what is inside (for previews). */
export function openSurpriseBox(onClose: () => void, opts: { prize?: Prize } = {}): void {
  let timer: number | null = null;
  const fr = frame('sbx', 'Surprise Box', () => {
    if (timer !== null) clearInterval(timer);
    onClose();
  });
  fr.body.innerHTML = `<div class="sbx-sky">${sparkles(24)}</div><div class="sbx-scene"></div>`;
  const scene = fr.body.querySelector('.sbx-scene') as HTMLDivElement;

  if (!surpriseReady()) {
    scene.innerHTML = `<div class="sbx-stagebox"><div class="sbx-box sleeping">${boxSvg(true)}<div class="sbx-z"><b>z</b><b>z</b><b>Z</b></div></div></div>
      <div class="sbx-msg"><h3>Shh... the box is sleeping!</h3><p>Come back tomorrow for another surprise!</p><div class="sbx-clock">${icon('star')}<span>New surprise in <b>${clock(msToMidnight())}</b></span></div>
      <button class="btn primary" data-ok>${icon('check')}<span>OK</span></button></div>`;
    const b = scene.querySelector('.sbx-clock b')!;
    timer = window.setInterval(() => {
      const ms = msToMidnight();
      b.textContent = clock(ms);
      if (ms <= 0 || surpriseReady()) {
        if (timer !== null) clearInterval(timer);
        timer = null;
        fr.close();
        window.setTimeout(() => openSurpriseBox(onClose, opts), 300);
      }
    }, 1000);
    const box = scene.querySelector('.sbx-box') as HTMLElement;
    box.addEventListener('click', () => {
      box.classList.remove('wake');
      void box.offsetWidth;
      box.classList.add('wake');
      sound.snore();
    });
    scene.querySelector('[data-ok]')!.addEventListener('click', () => fr.close());
    return;
  }

  scene.innerHTML = `<div class="sbx-stagebox"><div class="sbx-rays">${raysSvg}</div><div class="sbx-rise"><div class="sbx-prize"></div></div><button class="sbx-box idle" aria-label="Open the surprise box">${boxSvg(false)}</button></div>
    <div class="sbx-msg"><h3 class="sbx-tap">Tap to open!</h3><div class="sbx-dots"><i></i><i></i><i></i></div></div>`;
  const box = scene.querySelector('.sbx-box') as HTMLButtonElement;
  const tapText = scene.querySelector('.sbx-tap') as HTMLElement;
  const dotEls = scene.querySelectorAll('.sbx-dots i');
  let taps = 0;
  const center = () => {
    const r = box.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
  };
  box.addEventListener('click', () => {
    if (taps >= 3) return;
    taps++;
    dotEls[taps - 1]?.classList.add('on');
    box.classList.remove('idle', 'shake1', 'shake2');
    void box.offsetWidth;
    const c = center();
    if (taps === 1) {
      box.classList.add('shake1', 'excited');
      sound.boing();
      burst('sparkle', c.x, c.y, 10);
      tapText.textContent = 'Again!';
    } else if (taps === 2) {
      box.classList.add('shake2', 'untied');
      sound.whoosh();
      burst('sparkle', c.x, c.y, 18);
      tapText.textContent = 'One more time!';
    } else {
      open();
    }
  });

  const open = () => {
    G.s.surpriseDay = dayKey(new Date());
    G.bump('surprise');
    const prize = opts.prize ?? pickPrize(G.s.owned);
    box.classList.add('open');
    scene.classList.add('opened');
    tapText.textContent = 'Wow!';
    sound.success();
    const c = center();
    burst('confetti', c.x, c.y, 70);
    window.setTimeout(() => celebrate(), 200);
    const slot = scene.querySelector('.sbx-prize') as HTMLDivElement;
    let art = '';
    let title = '';
    let sub = '';
    if (prize.kind === 'coins') {
      art = `<div class="sbx-coins">${coinPile}</div>`;
      title = `${prize.n} coins!`;
      sub = 'Spend them at the Boutique!';
    } else if (prize.kind === 'sticker') {
      const id = awardSticker('Surprise box', { quiet: true });
      const def = STICKER_BY_ID[id];
      art = `<div class="sbx-sticker">${stickerSvg(id, 220)}</div>`;
      title = `${def.rarity === 'sparkle' ? 'A sparkle sticker' : 'A sticker'}: ${def.name}!`;
      sub = 'Find it in your Sticker Book!';
    } else {
      if (!G.s.owned.includes(prize.key)) G.s.owned.push(prize.key);
      G.changed();
      art = `<div class="sbx-item"><div class="thumb">${itemThumb(prize.key)}</div></div>`;
      title = `${itemName(prize.key)} is yours!`;
      sub = FURN_BY_ID[prize.key] ? 'Find it in your house tray!' : prize.key.startsWith('hair:') ? 'Try it on in the closet!' : 'Find it in the closet!';
    }
    slot.innerHTML = art;
    window.setTimeout(() => {
      slot.classList.add('up');
      sound.sparkle();
      if (prize.kind === 'coins') {
        const r = slot.getBoundingClientRect();
        window.setTimeout(() => G.earn(prize.n, { x: r.left + r.width / 2, y: r.top + r.height / 2 }), 650);
      }
    }, 450);
    window.setTimeout(() => {
      const msg = scene.querySelector('.sbx-msg') as HTMLDivElement;
      msg.innerHTML = `<h3 class="sbx-won">${esc(title)}</h3><p>${esc(sub)}</p><button class="btn primary" data-ok>${icon('heart')}<span>Yay!</span></button>`;
      msg.classList.add('pop');
      msg.querySelector('[data-ok]')!.addEventListener('click', () => fr.close());
    }, 1200);
  };
}
