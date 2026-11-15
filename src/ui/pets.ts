// Pets: the adoption center (pick a kind, make it yours, name it) and pet care (dress up, bath,
// feed, play and nap).
import './pets.css';
import {
  PET_ACC, PET_ACC_BY_ID, PET_EYES, PET_FURS, PET_KINDS, PET_PATTERNS, PET_SLOTS, basePetLook, petBox, petHeadThumb, petHeight, petParts, randomPetLook, renderPet,
  type PetAcc, type PetExpr, type PetPose,
} from '../art/pets';
import { PALETTE, dark } from '../art/color';
import { heartD, sparkleD, starD } from '../art/wear';
import { PET_NAMES, fillPetNeed, newPet, petMood, petPrice, randomPetName, tickPetNeeds } from '../data/pets';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G, toast } from '../game';
import type { Pet, PetLook, PetSlot } from '../types';
import { frame } from './activities';
import { confirmBox, el, esc, promptName } from './dom';
import { icon } from './icons';

const f = (n: number) => n.toFixed(1);
const cloneLook = (l: PetLook): PetLook => ({ ...l, acc: Object.fromEntries(Object.entries(l.acc ?? {}).map(([k, v]) => [k, { ...v! }])) });
const SVG = (vb: string, inner: string, cls = '') => `<svg viewBox="${vb}"${cls ? ` class="${cls}"` : ''} preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
const centerOf = (e: Element) => {
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
function tween(ms: number, step: (t: number) => void, done?: () => void): () => void {
  const t0 = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    step(t);
    if (t < 1) raf = requestAnimationFrame(tick);
    else done?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
const ease = (t: number) => t * t * (3 - 2 * t);

// ---------------- little drawings ----------------
const ART = {
  bowl: (c = '#ff7eb6') => `<path d="M8 30 H56 Q54 50 32 50 Q10 50 8 30Z" fill="${c}"/><path d="M8 30 H56 Q54 50 32 50 Q10 50 8 30Z" fill="url(#g-shadeX)"/><rect x="4" y="27" width="56" height="7" rx="3.5" fill="${dark(c, 0.15)}"/><path d="${heartD(32, 36, 5)}" fill="#fff"/>`,
  ball: (c = '#ff7a6b') => `<circle cx="32" cy="32" r="24" fill="${c}"/><path d="M10 26 Q32 36 54 26 M10 38 Q32 48 54 38" stroke="#fff" stroke-width="5" fill="none"/><circle cx="32" cy="32" r="24" fill="url(#g-shadeX)"/><ellipse cx="24" cy="18" rx="7" ry="4" fill="#fff" opacity="0.5"/>`,
  moon: () => `<path d="M40 8 A24 24 0 1 0 56 44 A20 20 0 1 1 40 8Z" fill="#ffd36b"/><path d="${starD(50, 14, 5)}" fill="#fff3b0"/>`,
  bubbles: () => `<circle cx="24" cy="36" r="16" fill="#bfe8ff" stroke="#7cc8ff" stroke-width="3"/><circle cx="44" cy="22" r="11" fill="#e8f6ff" stroke="#7cc8ff" stroke-width="3"/><circle cx="46" cy="46" r="7" fill="#e8f6ff" stroke="#7cc8ff" stroke-width="3"/><circle cx="18" cy="30" r="4" fill="#fff"/>`,
  sponge: () => `<rect x="8" y="16" width="48" height="32" rx="10" fill="#ffd36b"/><rect x="8" y="16" width="48" height="32" rx="10" fill="url(#g-shadeY)"/>${[[18, 26], [30, 32], [44, 24], [22, 40], [46, 40], [36, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#e0a11e"/>`).join('')}<circle cx="50" cy="12" r="6" fill="#fff" stroke="#bfe8ff" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff" stroke="#bfe8ff" stroke-width="2"/>`,
  shower: () => `<path d="M10 8 Q10 4 14 4 L30 4 Q34 4 34 8 L34 18" stroke="#9aa3b5" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 18 H50 Q54 18 52 24 L48 32 H20 L16 24 Q14 18 18 18Z" fill="url(#g-silver)" stroke="#9aa3b5" stroke-width="2"/>${[22, 29, 36, 43].map((x, i) => `<line x1="${x}" y1="38" x2="${x - 2 + i}" y2="${50 + (i % 2) * 6}" stroke="#7cc8ff" stroke-width="3" stroke-linecap="round"/>`).join('')}`,
  towel: (c = '#ff9ec7') => `<path d="M10 12 Q32 6 54 12 L52 50 Q32 44 12 50Z" fill="${c}"/><path d="M10 12 Q32 6 54 12 L52 50 Q32 44 12 50Z" fill="url(#g-shadeX)"/><path d="M12 40 Q32 34 52 40" stroke="#fff" stroke-width="4" fill="none"/><path d="M12 45 Q32 39 52 45" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/>`,
  hand: () => `<path d="M24 54 Q12 46 12 34 L12 22 Q12 18 16 18 Q20 18 20 22 L20 30 L20 12 Q20 8 24 8 Q28 8 28 12 L28 28 L28 8 Q28 4 32 4 Q36 4 36 8 L36 28 L36 12 Q36 8 40 8 Q44 8 44 12 L44 36 Q44 50 36 54Z" fill="#ffe3d3" stroke="#e8a983" stroke-width="2.5"/>`,
  feather: () => `<path d="M14 54 Q30 30 52 8 Q56 26 40 40 Q30 48 14 54Z" fill="#c99bff"/><path d="M14 54 L48 14" stroke="#fff" stroke-width="2.5"/><path d="M30 36 l-6 -4 M36 30 l-6 -4 M42 22 l-6 -4" stroke="#fff" stroke-width="1.5" opacity="0.7"/>`,
};
const ic = (inner: string) => `<svg viewBox="0 0 64 64">${inner}</svg>`;

interface Food { id: string; name: string; art: string }
const FOODS: Food[] = [
  { id: 'kibble', name: 'Kibble', art: `<ellipse cx="32" cy="40" rx="24" ry="10" fill="#c98a5a"/>${[[20, 34], [30, 30], [40, 33], [26, 40], [38, 41], [46, 38], [18, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#a8714a" stroke="#8a5a3c" stroke-width="1.5"/>`).join('')}` },
  { id: 'bone', name: 'Bone Treat', art: `<g transform="rotate(-25 32 32)"><rect x="16" y="26" width="32" height="12" rx="5" fill="#fff3e0" stroke="#e0c49a" stroke-width="2"/>${[[16, 26], [16, 38], [48, 26], [48, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff3e0" stroke="#e0c49a" stroke-width="2"/>`).join('')}<rect x="17" y="27.5" width="30" height="9" rx="4" fill="#fff3e0"/></g>` },
  { id: 'fish', name: 'Fishy', art: `<path d="M10 32 Q24 14 42 26 L54 16 L52 32 L54 48 L42 38 Q24 50 10 32Z" fill="#7cc8ff" stroke="#4f9dff" stroke-width="2"/><circle cx="20" cy="29" r="3" fill="#2a1626"/><path d="M28 24 Q32 32 28 40" stroke="#4f9dff" stroke-width="2" fill="none"/>` },
  { id: 'carrot', name: 'Carrot', art: `<path d="M18 50 L42 18 Q50 16 50 24 Z" fill="#ff9a3c"/><path d="M28 38 l5 3 M34 30 l5 3 M24 44 l3 2" stroke="#e0761e" stroke-width="2.5" stroke-linecap="round"/><path d="M46 20 Q44 8 50 6 Q50 14 48 18 Q56 10 60 14 Q52 18 48 20Z" fill="#5fd38f"/>` },
  { id: 'cheese', name: 'Cheese', art: `<path d="M8 44 L52 20 L56 44Z" fill="#ffd24a" stroke="#e0a11e" stroke-width="2" stroke-linejoin="round"/><path d="M8 44 H56 V52 H8Z" fill="#ffc21e" stroke="#e0a11e" stroke-width="2"/><circle cx="36" cy="36" r="4" fill="#e0a11e"/><circle cx="24" cy="48" r="2.5" fill="#e0a11e"/><circle cx="48" cy="40" r="3" fill="#e0a11e"/>` },
  { id: 'berry', name: 'Strawberry', art: `<path d="M32 56 Q10 40 14 26 Q18 16 32 20 Q46 16 50 26 Q54 40 32 56Z" fill="#ff4f6d"/>${[[24, 30], [32, 36], [40, 30], [28, 44], [36, 44], [32, 26]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2" fill="#fff3b0"/>`).join('')}<path d="M20 20 Q32 10 44 20 Q38 22 32 18 Q26 22 20 20Z" fill="#5fd38f"/>` },
  { id: 'bamboo', name: 'Bamboo', art: `<g transform="rotate(20 32 32)"><rect x="26" y="4" width="12" height="56" rx="5" fill="#8fd36a" stroke="#5fae4a" stroke-width="2"/><path d="M26 22 H38 M26 40 H38" stroke="#5fae4a" stroke-width="3"/><path d="M38 20 Q50 12 56 16 Q48 22 38 22Z" fill="#5fd38f"/></g>` },
];
const FAVORITE: Record<string, string> = { puppy: 'bone', kitten: 'fish', bunny: 'carrot', hamster: 'cheese', pony: 'carrot', unicorn: 'berry', duckling: 'berry', panda: 'bamboo', fox: 'fish', piglet: 'berry' };

const KIND_BG = ['#ffe0ee', '#e8dcff', '#d9f2ff', '#dcf7ea', '#fff3cc', '#ffe3d6'];

// ================= adoption center =================
export function openPetShop(onAdopt: (pet: Pet) => void, onClose: () => void): void {
  const fr = frame('pt-shop', 'Pet Adoption Center', onClose);
  let look: PetLook = basePetLook('puppy');
  let name = randomPetName();
  let names: string[] = [];
  const priceFor = (kind: string) => petPrice(kind, G.s.pets.length);
  const priceTag = (kind: string) => {
    const p = priceFor(kind);
    return p === 0 ? `<span class="pt-price free">FREE</span>` : `<span class="pt-price">${icon('coin')}${p}</span>`;
  };

  const kinds = () => {
    fr.setTitle('Pet Adoption Center');
    fr.body.innerHTML = `<p class="act-tip">${icon('heart')} ${G.s.pets.length ? 'Who will be your next best friend?' : 'Pick your very first pet. It\'s free!'}</p>
      <div class="pt-kinds">${PET_KINDS.map((k, i) => {
        const lk = basePetLook(k.id);
        return `<button class="pt-kind" data-kind="${k.id}" style="--bg:${KIND_BG[i % KIND_BG.length]};--i:${i}"><div class="pt-kind-art">${SVG(petBox(lk, 'stand', 4), renderPet(lk, { shadow: true }))}</div><b>${esc(k.name)}</b>${priceTag(k.id)}</button>`;
      }).join('')}</div>`;
  };

  const preview = (happy = false) => {
    const box = fr.body.querySelector('.pt-big');
    if (box) box.innerHTML = SVG(petBox(look, 'stand', 6), renderPet(look, { expr: happy ? 'happy' : 'normal', shadow: true }));
    const nm = fr.body.querySelector('.pt-name span');
    if (nm) nm.textContent = name;
    const ad = fr.body.querySelector('[data-adopt] span');
    if (ad) ad.textContent = `Adopt ${name}`;
  };
  const options = () => {
    const opts = fr.body.querySelector('.pt-opts');
    if (!opts) return;
    const dot = (attr: string, c: string, on: boolean) => `<button class="pt-dot${on ? ' on' : ''}" data-${attr}="${c}" style="background:${c}"></button>`;
    opts.innerHTML = `
      <section><h3>Fur color</h3><div class="pt-dots">${[...new Set([PET_KINDS.find((k) => k.id === look.kind)!.fur, ...PET_FURS])].map((c) => dot('fur', c, c === look.fur)).join('')}</div></section>
      <section><h3>Markings color</h3><div class="pt-dots">${[...new Set([PET_KINDS.find((k) => k.id === look.kind)!.fur2, ...PET_FURS])].map((c) => dot('fur2', c, c === look.fur2)).join('')}</div></section>
      <section><h3>Markings</h3><div class="pt-cards">${PET_PATTERNS.map((p) => `<button class="pt-card${p.id === look.pattern ? ' on' : ''}" data-pat="${p.id}">${SVG(petBox(look, 'stand', 2), renderPet({ ...look, pattern: p.id }, { still: true }))}<span>${p.name}</span></button>`).join('')}</div></section>
      <section><h3>Eyes</h3><div class="pt-cards">${PET_EYES.map((e) => `<button class="pt-card face${e.id === look.eyes ? ' on' : ''}" data-eyes="${e.id}">${petHeadThumb({ ...look, eyes: e.id })}<span>${e.name}</span></button>`).join('')}</div></section>`;
  };
  const nameChips = () => {
    names = [...PET_NAMES].sort(() => Math.random() - 0.5).slice(0, 5);
    const row = fr.body.querySelector('.pt-namechips');
    if (row) row.innerHTML = names.map((n) => `<button class="chip${n === name ? ' on' : ''}" data-nm="${esc(n)}">${esc(n)}</button>`).join('') + `<button class="chip pt-dice" data-dice>${icon('dice')}<span>More</span></button>`;
  };
  const make = (kind: string) => {
    look = basePetLook(kind);
    name = randomPetName();
    const kn = PET_KINDS.find((k) => k.id === kind)!.name;
    fr.setTitle(`Make it yours: ${kn}`);
    fr.body.innerHTML = `<div class="pt-make">
      <div class="pt-preview">
        <div class="pt-big"></div>
        <div class="pt-namebar"><button class="pt-name" data-rename>${icon('pencil')}<span></span></button><button class="round-btn" data-surprise title="Surprise me">${icon('wand')}</button></div>
        <div class="pt-namechips"></div>
      </div>
      <div class="pt-opts"></div>
      <div class="pt-adopt-bar"><button class="btn ghost" data-back>${icon('back')}<span>Pets</span></button>${priceTag(kind)}<button class="btn primary" data-adopt>${icon('heart')}<span></span></button></div>
    </div>`;
    preview();
    options();
    nameChips();
  };

  const adopt = () => {
    const price = priceFor(look.kind);
    if (G.s.coins < price) {
      sound.wrong();
      toast(`You need ${price - G.s.coins} more coins. Try a challenge!`, 'coin');
      return;
    }
    G.s.coins -= price;
    const pet = newPet(look.kind, name, cloneLook(look));
    G.bump('adoptPet');
    sound.success();
    celebrate();
    onAdopt(pet);
    G.changed();
    fr.body.insertAdjacentHTML('beforeend', `<div class="act-result"><div class="sp-card pt-welcome"><div class="pt-welcome-art">${SVG(petBox(pet.look, 'stand', 4), renderPet(pet.look, { expr: 'happy', shadow: true }))}</div>
      <h2>Welcome home, ${esc(pet.name)}!</h2><p>${price ? `${icon('coin')} ${price} coins well spent. ` : ''}Take good care of your new friend.</p>
      <div class="row"><button class="btn" data-more>${icon('plus')}<span>Adopt another</span></button><button class="btn primary" data-done>${icon('home')}<span>Let's play!</span></button></div></div></div>`);
    const art = fr.body.querySelector('.pt-welcome-art');
    if (art) {
      const c = centerOf(art);
      window.setTimeout(() => burst('heart', c.x, c.y, 18), 250);
    }
  };

  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    const kb = t.closest('[data-kind]') as HTMLElement | null;
    if (kb) {
      sound.pop();
      return make(kb.dataset.kind!);
    }
    const set = (fn: () => void) => {
      fn();
      sound.pop();
      preview(true);
      const big = fr.body.querySelector('.pt-big');
      if (big) {
        const c = centerOf(big);
        burst('sparkle', c.x, c.y - 30, 8);
      }
    };
    const d = t.closest('[data-fur],[data-fur2],[data-pat],[data-eyes]') as HTMLElement | null;
    if (d) {
      set(() => {
        if (d.dataset.fur) look.fur = d.dataset.fur;
        if (d.dataset.fur2) look.fur2 = d.dataset.fur2;
        if (d.dataset.pat) look.pattern = d.dataset.pat;
        if (d.dataset.eyes) look.eyes = d.dataset.eyes;
      });
      const sc = fr.body.querySelector('.pt-opts')!.scrollTop;
      options();
      fr.body.querySelector('.pt-opts')!.scrollTop = sc;
      return;
    }
    if (t.closest('[data-surprise]')) {
      set(() => (look = randomPetLook(look.kind)));
      sound.sparkle();
      options();
      return;
    }
    const nm = t.closest('[data-nm]') as HTMLElement | null;
    if (nm) {
      name = nm.dataset.nm!;
      fr.body.querySelectorAll('[data-nm]').forEach((b) => b.classList.toggle('on', b === nm));
      sound.giggle();
      return preview(true);
    }
    if (t.closest('[data-dice]')) {
      sound.boing();
      name = randomPetName(name);
      nameChips();
      return preview(true);
    }
    if (t.closest('[data-rename]')) {
      sound.tap();
      return promptName(name, (v) => {
        name = v;
        nameChips();
        preview(true);
      });
    }
    if (t.closest('[data-back]')) {
      sound.tap();
      return kinds();
    }
    if (t.closest('[data-adopt]')) return adopt();
    if (t.closest('[data-more]')) {
      sound.pop();
      return kinds();
    }
    if (t.closest('[data-done]')) fr.close();
  });
  kinds();
}

// ================= pet care =================
type Tab = 'dress' | 'bath' | 'feed' | 'play' | 'nap';
const TABS: { id: Tab; name: string; art: () => string }[] = [
  { id: 'dress', name: 'Dress up', art: () => icon('hanger') },
  { id: 'bath', name: 'Bath', art: () => icon('bath') },
  { id: 'feed', name: 'Feed', art: () => ic(ART.bowl()) },
  { id: 'play', name: 'Play', art: () => ic(ART.ball()) },
  { id: 'nap', name: 'Nap', art: () => icon('moon') },
];
const NEED_UI: { id: 'food' | 'clean' | 'fun' | 'sleep'; name: string; art: string; c: string }[] = [
  { id: 'food', name: 'Tummy', art: ic(ART.bowl('#ff9a6b')), c: '#ff9a6b' },
  { id: 'clean', name: 'Clean', art: ic(ART.bubbles()), c: '#7cc8ff' },
  { id: 'fun', name: 'Fun', art: ic(ART.ball('#c99bff')), c: '#c99bff' },
  { id: 'sleep', name: 'Rest', art: ic(ART.moon()), c: '#ffc531' },
];

/** Stage drawings (the stage viewBox is -500..500 wide, ground at y = 0). */
const room = (wall: string, floor: string, extra = '') =>
  `<rect x="-3000" y="-3000" width="6000" height="3000" fill="${wall}"/><rect x="-3000" y="-3000" width="6000" height="3000" fill="url(#w-dots)" opacity="0.5"/><rect x="-3000" y="0" width="6000" height="3000" fill="${floor}"/><rect x="-3000" y="-12" width="6000" height="16" fill="#fff" opacity="0.7"/>${extra}`;
const tubFront = () =>
  `<path d="M-250 -150 H250 Q248 -20 180 6 L-180 6 Q-248 -20 -250 -150Z" fill="#fff"/><path d="M-250 -150 H250 Q248 -20 180 6 L-180 6 Q-248 -20 -250 -150Z" fill="url(#g-shadeX)"/><rect x="-268" y="-166" width="536" height="26" rx="13" fill="#bfe8ff" stroke="#fff" stroke-width="4"/>` +
  [-170, -90, 0, 90, 170].map((x, i) => `<path d="${heartD(x, -110 + (i % 2) * 18, 13)}" fill="#ffb3d1" opacity="0.8"/>`).join('') +
  `<rect x="-200" y="2" width="30" height="20" rx="8" fill="url(#g-gold)"/><rect x="170" y="2" width="30" height="20" rx="8" fill="url(#g-gold)"/>`;
const tubBack = () => `<path d="M-250 -150 Q0 -190 250 -150" stroke="#e6f5ff" stroke-width="10" fill="none"/><rect x="200" y="-260" width="14" height="110" rx="7" fill="url(#g-silver)"/><path d="M214 -258 Q250 -262 252 -230" stroke="#c9cfdd" stroke-width="12" fill="none" stroke-linecap="round"/>`;
const bedArt = (c: string, front: boolean) =>
  front
    ? `<path d="M-190 -70 Q-200 0 -150 8 L150 8 Q200 0 190 -70 Q170 -40 0 -36 Q-170 -40 -190 -70Z" fill="${c}"/><path d="M-190 -70 Q-200 0 -150 8 L150 8 Q200 0 190 -70 Q170 -40 0 -36 Q-170 -40 -190 -70Z" fill="url(#g-shadeY)"/>${[-110, 0, 110].map((x) => `<path d="${heartD(x, -26, 11)}" fill="#fff" opacity="0.7"/>`).join('')}`
    : `<ellipse cx="0" cy="-40" rx="200" ry="70" fill="${dark(c, 0.12)}"/><ellipse cx="0" cy="-48" rx="170" ry="48" fill="#fff3f8"/><ellipse cx="0" cy="-48" rx="170" ry="48" fill="url(#p-dots)" opacity="0.6"/>`;
const blanketArt = (c: string) =>
  `<path d="M-120 -120 Q-60 -150 0 -132 Q60 -150 130 -118 L150 -40 Q0 -20 -150 -40Z" fill="${c}"/><path d="M-120 -120 Q-60 -150 0 -132 Q60 -150 130 -118 L150 -40 Q0 -20 -150 -40Z" fill="url(#p-stars)"/><path d="M-120 -120 Q-60 -150 0 -132 Q60 -150 130 -118" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>`;

export function openPetCare(pet: Pet, onClose: () => void): void {
  tickPetNeeds(pet, Date.now());
  let stopFx: (() => void)[] = [];
  const cleanup = () => {
    stopFx.forEach((s) => s());
    stopFx = [];
  };
  const fr = frame('pt-care', pet.name, () => {
    cleanup();
    G.changed();
    onClose();
  });
  let tab: Tab = 'dress';
  let slot: PetSlot = 'head';
  const scale = () => Math.max(1.15, Math.min(1.85, 300 / petHeight(pet.look)));

  fr.body.innerHTML = `<div class="pt-care-wrap">
    <div class="pt-top"><div class="pt-needs"></div><button class="pt-rename" data-rename>${icon('pencil')}</button></div>
    <div class="pt-tabs">${TABS.map((t) => `<button class="pt-tab" data-tab="${t.id}">${t.art()}<span>${t.name}</span></button>`).join('')}</div>
    <div class="pt-main"></div></div>`;
  const main = fr.body.querySelector('.pt-main') as HTMLDivElement;

  const needsBar = () => {
    tickPetNeeds(pet, Date.now());
    const n = pet.needs!;
    fr.body.querySelector('.pt-needs')!.innerHTML = NEED_UI.map((u) => {
      const v = Math.round(n[u.id]);
      return `<div class="pt-need${v < 30 ? ' low' : ''}" title="${u.name}"><i>${u.art}</i><div class="pt-meter"><b style="width:${v}%;background:${u.c}"></b></div></div>`;
    }).join('');
  };
  const mood = (): PetExpr => {
    const n = pet.needs;
    return n && Math.min(n.food, n.clean, n.fun, n.sleep) < 20 ? 'sad' : 'normal';
  };
  const reward = (need: 'food' | 'clean' | 'fun' | 'sleep', before: number, coins: number, stat: string, msg: string) => {
    fillPetNeed(pet, need, 100);
    G.bump(stat);
    needsBar();
    sound.success();
    celebrate();
    if (before < 90) G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    toast(msg, 'heart', true);
    G.changed();
  };

  // ---- the stage: an svg with the pet in a group we can move and re-draw ----
  interface Stage { svg: SVGSVGElement; petG: SVGGElement; over: SVGGElement; x: number; y: number; face: 1 | -1; s: number; pose: PetPose; expr: PetExpr }
  const makeStage = (bg: string, front = '', vb = '-500 -520 1000 600'): Stage => {
    main.querySelector('.pt-stage')!.insertAdjacentHTML('afterbegin', `<svg class="pt-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><g class="bg">${bg}</g><g class="petg"></g><g class="front">${front}</g><g class="over"></g></svg>`);
    const svg = main.querySelector('.pt-svg') as SVGSVGElement;
    return { svg, petG: svg.querySelector('.petg') as SVGGElement, over: svg.querySelector('.over') as SVGGElement, x: 0, y: 0, face: 1, s: scale(), pose: 'stand', expr: mood() };
  };
  const drawPet = (st: Stage) => {
    if (!st.svg.isConnected) return;
    st.petG.setAttribute('transform', `translate(${f(st.x)} ${f(st.y)}) scale(${f(st.s * st.face)} ${f(st.s)})`);
    st.petG.innerHTML = renderPet(pet.look, { pose: st.pose, expr: st.expr, shadow: st.pose !== 'held' && st.y === 0 });
  };
  const toSvg = (st: Stage, e: { clientX: number; clientY: number }) => {
    const m = st.svg.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : new DOMPoint(0, 0);
  };
  const toScreen = (st: Stage, x: number, y: number) => {
    const m = st.svg.getScreenCTM();
    return m ? new DOMPoint(x, y).matrixTransform(m) : new DOMPoint(0, 0);
  };
  /** The pet's box in stage coordinates. */
  const petRect = (st: Stage) => {
    const b = st.petG.getBBox();
    const x1 = st.x + b.x * st.s * st.face;
    const x2 = st.x + (b.x + b.width) * st.s * st.face;
    return { x: Math.min(x1, x2), y: st.y + b.y * st.s, w: Math.abs(x2 - x1), h: b.height * st.s };
  };
  let exprTimer = 0;
  const flash = (st: Stage, expr: PetExpr, ms = 1200) => {
    st.expr = expr;
    drawPet(st);
    window.clearTimeout(exprTimer);
    exprTimer = window.setTimeout(() => {
      st.expr = mood();
      drawPet(st);
    }, ms);
  };
  /** A drag helper that follows one finger (pointerId) at a time. */
  const follow = (target: HTMLElement | SVGElement, h: { down?: (e: PointerEvent) => boolean | void; move?: (e: PointerEvent) => void; up?: (e: PointerEvent) => void }) => {
    let id: number | null = null;
    const down = (e: PointerEvent) => {
      if (id !== null) return;
      if (h.down && h.down(e) === false) return;
      id = e.pointerId;
      try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* old browsers */ }
      e.preventDefault();
    };
    const move = (e: PointerEvent) => e.pointerId === id && h.move?.(e);
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      h.up?.(e);
    };
    target.addEventListener('pointerdown', down as EventListener);
    target.addEventListener('pointermove', move as EventListener);
    target.addEventListener('pointerup', up as EventListener);
    target.addEventListener('pointercancel', up as EventListener);
  };

  // ---------------- dress up ----------------
  const accThumb = (a: PetAcc) => {
    const lk = cloneLook(pet.look);
    lk.acc[a.slot] = { id: a.id, color: pet.look.acc[a.slot]?.id === a.id ? pet.look.acc[a.slot]!.color : a.color };
    return a.slot === 'body' ? SVG(petBox(lk, 'stand', 0), renderPet(lk, { still: true })) : petHeadThumb(lk, a.slot === 'neck' ? 0.75 : 0, a.slot === 'head' ? 0.5 : 0);
  };
  const owned = (a: PetAcc) => a.price === 0 || G.s.owned.includes(`petacc:${a.id}`);
  const dress = () => {
    main.innerHTML = `<div class="pt-dress"><div class="pt-stage pt-dress-stage"></div><div class="pt-panel">
      <div class="pt-slots">${PET_SLOTS.map((s) => `<button class="chip${s.id === slot ? ' on' : ''}" data-slot="${s.id}">${esc(s.name)}</button>`).join('')}</div>
      <div class="pt-colors"></div><div class="pt-accs"></div></div></div>`;
    const st = makeStage(room('#ffe9f3', '#f6d5e6', `<circle cx="-330" cy="-380" r="70" fill="#fff" opacity="0.5"/><path d="${sparkleD(320, -400, 26)}" fill="#fff"/><path d="${sparkleD(380, -330, 14)}" fill="#fff"/><ellipse cx="0" cy="20" rx="260" ry="34" fill="#ffc7de"/><ellipse cx="0" cy="14" rx="240" ry="26" fill="#ffd9e8"/>`), '', '-360 -500 720 560');
    st.y = 4;
    st.s = Math.min(2.1, scale() * 1.12);
    drawPet(st);
    const grid = () => {
      const list = PET_ACC.filter((a) => a.slot === slot);
      const worn = pet.look.acc[slot];
      main.querySelector('.pt-accs')!.innerHTML = `<button class="pt-acc none${worn ? '' : ' on'}" data-acc="">${icon('close')}<span>None</span></button>` +
        list.map((a) => `<button class="pt-acc${worn?.id === a.id ? ' on' : ''}${owned(a) ? '' : ' locked'}" data-acc="${a.id}">${accThumb(a)}<span>${esc(a.name)}</span>${owned(a) ? '' : `<i class="pt-tag">${icon('coin')}${a.price}</i>`}</button>`).join('');
      const def = worn ? PET_ACC_BY_ID[worn.id] : undefined;
      main.querySelector('.pt-colors')!.innerHTML = def && !def.fixed ? PALETTE.map((c) => `<button class="pt-dot sm${c === worn!.color ? ' on' : ''}" data-color="${c}" style="background:${c}"></button>`).join('') : '';
      (main.querySelector('.pt-colors') as HTMLElement).classList.toggle('empty', !(def && !def.fixed));
    };
    const wear = (a: PetAcc | null) => {
      if (a) pet.look.acc[a.slot] = { id: a.id, color: a.color };
      else delete pet.look.acc[slot];
      G.changed();
      const c = centerOf(st.svg);
      if (a) {
        sound.sparkle();
        burst('sparkle', c.x, c.y - 40, 10);
        flash(st, 'happy');
      } else {
        sound.whoosh();
        drawPet(st);
      }
      grid();
    };
    main.querySelector('.pt-panel')!.addEventListener('click', (e) => {
      const t = e.target as Element;
      const sb = t.closest('[data-slot]') as HTMLElement | null;
      if (sb) {
        slot = sb.dataset.slot as PetSlot;
        sound.tap();
        main.querySelectorAll('[data-slot]').forEach((b) => b.classList.toggle('on', b === sb));
        grid();
        main.querySelector('.pt-accs')!.scrollTop = 0;
        return;
      }
      const cb = t.closest('[data-color]') as HTMLElement | null;
      if (cb && pet.look.acc[slot]) {
        pet.look.acc[slot]!.color = cb.dataset.color!;
        sound.spray();
        G.changed();
        drawPet(st);
        grid();
        return;
      }
      const ab = t.closest('[data-acc]') as HTMLElement | null;
      if (!ab) return;
      const a = ab.dataset.acc ? PET_ACC_BY_ID[ab.dataset.acc] : null;
      if (!a) return wear(null);
      if (pet.look.acc[slot]?.id === a.id) return wear(null);
      if (owned(a)) return wear(a);
      sound.tap();
      const lk = cloneLook(pet.look);
      lk.acc[a.slot] = { id: a.id, color: a.color };
      confirmBox(`Buy ${a.name}?`, `It costs <b class="coin-text">${icon('coin')}${a.price}</b>. You have ${G.s.coins}.`, `${icon('bag')}<span>Buy</span>`, SVG(petBox(lk, 'stand', 0), renderPet(lk, { still: true })), () => {
        if (G.s.coins < a.price) {
          sound.wrong();
          toast(`You need ${a.price - G.s.coins} more coins. Try a challenge!`, 'coin');
          return;
        }
        G.s.coins -= a.price;
        G.s.owned.push(`petacc:${a.id}`);
        sound.coin();
        G.bump('buy');
        wear(a);
      });
    });
    grid();
  };

  // ---------------- bath ----------------
  const bath = () => {
    main.innerHTML = `<div class="pt-play"><div class="pt-steps"><span data-ph="scrub">1. Scrub</span><span data-ph="rinse">2. Rinse</span><span data-ph="dry">3. Dry</span></div><div class="pt-stage pt-touch"><div class="pt-tool"></div></div><p class="pt-hint"></p></div>`;
    const tiles = `<rect x="-3000" y="-3000" width="6000" height="3000" fill="#dff3ff"/><rect x="-3000" y="-3000" width="6000" height="3000" fill="url(#w-check)" opacity="0.35"/><rect x="-3000" y="0" width="6000" height="3000" fill="#bfe3f5"/>`;
    const st = makeStage(tiles + `<g transform="translate(0 0) scale(0.9)">${tubBack()}</g>`, `<g transform="scale(0.9)">${tubFront()}</g>` + [-200, -150, -95, -40, 20, 80, 140, 195].map((x, i) => `<circle cx="${x}" cy="${-160 - (i % 3) * 6}" r="${18 + (i % 3) * 6}" fill="#fff" stroke="#d6efff" stroke-width="3"/>`).join(''), '-400 -470 800 500');
    st.pose = 'sit';
    st.y = -96;
    st.s = Math.min(2, scale() * 1.08);
    drawPet(st);
    const before = pet.needs!.clean;
    const r = petRect(st);
    type Blob = { x: number; y: number; r: number; el?: SVGElement; gone: boolean };
    // mud on the head (not over the eyes) and on the shoulders above the water
    const pp = petParts(pet.look, 'sit');
    const hx = st.x + pp.head.x * st.s;
    const hy = st.y + pp.head.y * st.s;
    const hr = pp.head.r * st.s;
    const eyeY = st.y + pp.head.eyeY * st.s;
    const mud: Blob[] = [];
    for (let tries = 0; mud.length < 8 && tries < 400; tries++) {
      const x = r.x + r.w * (0.1 + Math.random() * 0.8);
      const y = r.y + (Math.min(-170, r.y + r.h) - r.y) * (0.12 + Math.random() * 0.85);
      const inHead = Math.hypot((x - hx) / hr, (y - hy) / hr) < 0.95;
      const onBody = !inHead && x > r.x + 20 && x < r.x + r.w - 20 && y > hy + hr * 0.6;
      const nearEyes = Math.abs(y - eyeY) < hr * 0.42 && Math.abs(x - hx) < hr * 0.75;
      const nearMouth = Math.abs(x - hx) < hr * 0.35 && y > eyeY && y < hy + hr;
      if (!(inHead || onBody) || nearEyes || nearMouth || mud.some((m) => Math.hypot(m.x - x, m.y - y) < 38)) continue;
      mud.push({ x, y, r: 13 + Math.random() * 9, gone: false });
    }
    const suds: Blob[] = [];
    const NS = 'http://www.w3.org/2000/svg';
    for (const m of mud) {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(m.r)}" fill="#9a7452" opacity="0.88"/><circle cx="${f(m.x + m.r * 0.5)}" cy="${f(m.y - m.r * 0.4)}" r="${f(m.r * 0.5)}" fill="#9a7452" opacity="0.88"/><circle cx="${f(m.x - m.r * 0.3)}" cy="${f(m.y - m.r * 0.2)}" r="${f(m.r * 0.3)}" fill="#7a5a3c" opacity="0.7"/>`;
      g.setAttribute('class', 'pt-mud');
      st.over.appendChild(g);
      m.el = g;
    }
    st.expr = 'sad';
    drawPet(st);
    let phase: 'scrub' | 'rinse' | 'dry' | 'done' = 'scrub';
    let dry = 0;
    const tool = main.querySelector('.pt-tool') as HTMLDivElement;
    const stage = main.querySelector('.pt-stage') as HTMLDivElement;
    const steps = () => {
      main.querySelectorAll<HTMLElement>('[data-ph]').forEach((s) => s.classList.toggle('on', s.dataset.ph === phase));
      main.querySelector('.pt-hint')!.innerHTML = { scrub: `Rub ${esc(pet.name)} with the sponge to scrub off the mud!`, rinse: 'Now rinse off all the bubbles with the shower!', dry: 'Rub with the fluffy towel to dry off!', done: `${esc(pet.name)} is squeaky clean!` }[phase];
      tool.innerHTML = phase === 'scrub' ? ic(ART.sponge()) : phase === 'rinse' ? ic(ART.shower()) : phase === 'dry' ? ic(ART.towel()) : '';
      tool.classList.toggle('show', phase !== 'done');
    };
    const park = () => {
      const sr = stage.getBoundingClientRect();
      tool.style.transform = `translate(${f(sr.width - 120)}px, ${f(sr.height - 130)}px)`;
      tool.classList.remove('active');
    };
    steps();
    requestAnimationFrame(park);
    let lastSnd = 0;
    let lastPt: DOMPoint | null = null;
    const addSud = (x: number, y: number) => {
      if (suds.length > 70) return;
      const rr = 9 + Math.random() * 14;
      const c = document.createElementNS(NS, 'g');
      c.innerHTML = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="#fff" opacity="0.95" stroke="#bfe8ff" stroke-width="2"/><circle cx="${f(x - rr * 0.3)}" cy="${f(y - rr * 0.35)}" r="${f(rr * 0.25)}" fill="#e8f6ff"/>`;
      c.setAttribute('class', 'pt-sud');
      st.over.appendChild(c);
      suds.push({ x, y, r: rr, el: c, gone: false });
    };
    const drop = (sx: number, sy: number) => {
      for (let i = 0; i < 3; i++) {
        const d = el('i', 'pt-drop');
        d.style.left = `${sx - 30 + i * 20 + Math.random() * 10}px`;
        d.style.top = `${sy + 30}px`;
        stage.appendChild(d);
        d.addEventListener('animationend', () => d.remove());
      }
    };
    const rub = (e: PointerEvent) => {
      const sr = stage.getBoundingClientRect();
      tool.style.transform = `translate(${f(e.clientX - sr.left - 55)}px, ${f(e.clientY - sr.top - 70)}px)`;
      const p = toSvg(st, e);
      const moved = lastPt ? Math.hypot(p.x - lastPt.x, p.y - lastPt.y) : 0;
      lastPt = p;
      const onPet = p.x > r.x - 20 && p.x < r.x + r.w + 20 && p.y > r.y - 20 && p.y < 0;
      const now = performance.now();
      if (phase === 'scrub') {
        let hit = false;
        for (const m of mud) if (!m.gone && Math.hypot(m.x - p.x, m.y - p.y) < m.r + 34) {
          m.gone = true;
          hit = true;
          m.el?.classList.add('gone');
          addSud(m.x, m.y);
          addSud(m.x + 14, m.y - 10);
        }
        if (onPet && moved > 6 && Math.random() < 0.35) addSud(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30);
        if ((hit || (onPet && moved > 4)) && now - lastSnd > 160) {
          sound.squeak();
          lastSnd = now;
          burst('bubble', e.clientX, e.clientY - 20, 2);
        }
        if (mud.every((m) => m.gone) && suds.length >= 14) {
          phase = 'rinse';
          sound.ding();
          flash(st, 'happy', 1500);
          steps();
        }
      } else if (phase === 'rinse') {
        const sr2 = stage.getBoundingClientRect();
        if (now - lastSnd > 90) {
          drop(e.clientX - sr2.left, e.clientY - sr2.top);
        }
        if (now - lastSnd > 260) {
          sound.spray();
          lastSnd = now;
        }
        for (const b of suds) if (!b.gone && Math.abs(b.x - p.x) < 60 && b.y > p.y - 10 && b.y < p.y + 220) {
          b.gone = true;
          b.el?.classList.add('gone');
        }
        if (suds.every((b) => b.gone)) {
          phase = 'dry';
          sound.ding();
          steps();
        }
      } else if (phase === 'dry') {
        if (onPet) dry += moved;
        if (onPet && moved > 3 && now - lastSnd > 220) {
          sound.whoosh();
          lastSnd = now;
          burst('sparkle', e.clientX, e.clientY, 3);
        }
        if (dry > 2600) {
          phase = 'done';
          steps();
          park();
          st.over.innerHTML = [[-0.1, 0.25], [0.95, 0.4], [0.5, 0.05]].map(([u, v], i) => `<path d="${sparkleD(r.x + r.w * u, r.y + r.h * v, 26)}" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="${i * 0.35}s" repeatCount="indefinite"/></path>`).join('');
          flash(st, 'happy', 4000);
          reward('clean', before, 8, 'petBath', `${esc(pet.name)} is sparkly clean!`);
          main.querySelector('.pt-play')!.insertAdjacentHTML('beforeend', `<div class="pt-again"><button class="btn" data-again>${ic(ART.bubbles())}<span>Bath again</span></button></div>`);
        }
      }
    };
    follow(stage, {
      down: (e) => {
        if (phase === 'done' || (e.target as Element).closest('button')) return false;
        tool.classList.add('active');
        lastPt = null;
        rub(e);
      },
      move: rub,
      up: () => {
        lastPt = null;
        if (phase !== 'done') tool.classList.remove('active');
      },
    });
    main.querySelector('.pt-play')!.addEventListener('click', (e) => (e.target as Element).closest('[data-again]') && (sound.tap(), bath()));
  };

  // ---------------- feed ----------------
  const feed = () => {
    main.innerHTML = `<div class="pt-play"><div class="pt-stage pt-touch"></div><div class="pt-foods">${FOODS.map((fd) => `<button class="pt-food${FAVORITE[pet.look.kind] === fd.id ? ' fav' : ''}" data-food="${fd.id}">${ic(fd.art)}<span>${fd.name}</span>${FAVORITE[pet.look.kind] === fd.id ? `<i class="pt-fav">${icon('heart')}</i>` : ''}</button>`).join('')}</div><p class="pt-hint">Drag a snack into the bowl!</p></div>`;
    const st = makeStage(room('#fff1e0', '#f4dcc0', `<rect x="-300" y="-370" width="150" height="110" rx="12" fill="#fff" opacity="0.7"/><rect x="-290" y="-360" width="130" height="90" rx="8" fill="#bfe8ff"/><circle cx="-210" cy="-325" r="16" fill="#ffd36b"/><path d="M-290 -300 Q-250 -320 -210 -300 T-160 -300 V-270 H-290Z" fill="#9be08a"/>`), '', '-360 -400 720 460');
    st.x = -90;
    st.pose = 'sit';
    drawPet(st);
    const bowlX = 150;
    const bowlG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bowlG.setAttribute('transform', `translate(${bowlX - 96} -110) scale(3)`);
    bowlG.innerHTML = ART.bowl('#ff7eb6') + '<g class="pt-inbowl"></g>';
    st.svg.querySelector('.front')!.appendChild(bowlG);
    const inBowl = bowlG.querySelector('.pt-inbowl') as SVGGElement;
    const before = pet.needs!.food;
    let done = false;
    let busy = false;
    const eat = (fd: Food) => {
      busy = true;
      inBowl.innerHTML = `<g transform="translate(14 0) scale(0.56)">${fd.art}</g>`;
      sound.drop();
      st.face = 1;
      // the pet hops over to the bowl
      const sx = st.x;
      tween(380, (t) => { st.x = sx + (bowlX - 118 - sx) * ease(t); st.pose = 'walk'; drawPet(st); }, () => {
        st.pose = 'sit';
        st.expr = 'eat';
        drawPet(st);
        sound.yum();
        let bites = 0;
        const bite = window.setInterval(() => {
          if (!st.svg.isConnected) return window.clearInterval(bite);
          bites++;
          const g = inBowl.firstElementChild as SVGGElement | null;
          if (g) g.setAttribute('transform', `translate(${14 + bites * 3} ${bites * 4}) scale(${(0.56 * (1 - bites / 4)).toFixed(2)})`);
          if (bites % 2) sound.yum();
          if (bites >= 4) {
            window.clearInterval(bite);
            inBowl.innerHTML = '';
            const fav = FAVORITE[pet.look.kind] === fd.id;
            const c = toScreen(st, st.x + 40, -petHeight(pet.look) * st.s * 0.7);
            burst('heart', c.x, c.y, fav ? 16 : 6);
            if (fav) toast(`${esc(pet.name)} LOVES ${fd.name.toLowerCase()}!`, 'heart');
            fillPetNeed(pet, 'food', pet.needs!.food + (fav ? 60 : 40));
            needsBar();
            flash(st, 'happy', 1400);
            busy = false;
            if (!done && pet.needs!.food >= 100) {
              done = true;
              reward('food', before, 5, 'petFeed', `Yum! ${esc(pet.name)} has a full, happy tummy!`);
            }
          }
        }, 380);
      });
    };
    // drag food from the tray to the bowl
    const foods = main.querySelector('.pt-foods') as HTMLDivElement;
    let ghost: HTMLDivElement | null = null;
    let dragFood: Food | null = null;
    follow(foods, {
      down: (e) => {
        const b = (e.target as Element).closest('[data-food]') as HTMLElement | null;
        if (!b || busy) return false;
        dragFood = FOODS.find((x) => x.id === b.dataset.food) ?? null;
        if (!dragFood) return false;
        sound.pick();
        ghost = el('div', 'pt-ghost', ic(dragFood.art));
        document.body.appendChild(ghost);
        ghost.style.transform = `translate(${e.clientX - 50}px, ${e.clientY - 60}px)`;
      },
      move: (e) => ghost && (ghost.style.transform = `translate(${e.clientX - 50}px, ${e.clientY - 60}px) rotate(${Math.sin(e.clientX / 30) * 10}deg)`),
      up: (e) => {
        const g = ghost;
        ghost = null;
        if (!g || !dragFood) return;
        const p = toSvg(st, e);
        const near = Math.abs(p.x - bowlX) < 170 && p.y > -330 && p.y < 60;
        if (near && !busy) {
          g.remove();
          eat(dragFood);
        } else {
          g.classList.add('back');
          window.setTimeout(() => g.remove(), 250);
          if (!busy) toast('Drop it in the bowl!', 'heart');
        }
        dragFood = null;
      },
    });
  };

  // ---------------- play ----------------
  const play = () => {
    main.innerHTML = `<div class="pt-play"><div class="pt-stage pt-touch"></div><p class="pt-hint">Flick the ball to throw it, or tickle ${esc(pet.name)}'s tummy!</p></div>`;
    const sky = `<rect x="-3000" y="-3000" width="6000" height="3000" fill="#cdeeff"/><circle cx="330" cy="-400" r="50" fill="#ffe680"/><g fill="#fff" opacity="0.9"><ellipse cx="-280" cy="-380" rx="70" ry="24"/><ellipse cx="-240" cy="-396" rx="40" ry="24"/><ellipse cx="120" cy="-430" rx="60" ry="18"/></g><rect x="-3000" y="0" width="6000" height="3000" fill="#9be08a"/><rect x="-3000" y="-6" width="6000" height="14" fill="#7fcf6f"/>` +
      [-420, -300, 260, 400].map((x, i) => `<g transform="translate(${x} 30)">${[0, 1, 2].map((k) => `<circle cx="${k * 14 - 14}" cy="${(k % 2) * -6}" r="${6 + (i % 2) * 2}" fill="${['#ff9ec7', '#fff', '#ffd36b'][k]}"/>`).join('')}</g>`).join('');
    const st = makeStage(sky, '', '-440 -440 880 490');
    st.x = -140;
    drawPet(st);
    const before = pet.needs!.fun;
    let done = false;
    const NS = 'http://www.w3.org/2000/svg';
    const ballG = document.createElementNS(NS, 'g');
    ballG.innerHTML = `<g transform="translate(-32 -64) scale(1)">${ART.ball()}</g>`;
    st.over.appendChild(ballG);
    const ball = { x: 160, y: 0 };
    const placeBall = () => ballG.setAttribute('transform', `translate(${f(ball.x)} ${f(ball.y)})`);
    placeBall();
    let busy = false;
    const addFun = (n: number) => {
      fillPetNeed(pet, 'fun', pet.needs!.fun + n);
      needsBar();
      if (!done && pet.needs!.fun >= 100) {
        done = true;
        reward('fun', before, 5, 'petPlay', `${esc(pet.name)} had SO much fun!`);
      }
    };
    const fetchBall = () => {
      // the pet runs to the ball, picks it up and brings it back
      busy = true;
      const from = st.x;
      const to = ball.x - 70 * Math.sign(ball.x - from || 1);
      st.face = ball.x >= from ? 1 : -1;
      st.pose = 'walk';
      st.expr = 'happy';
      const d = Math.abs(to - from);
      tween(Math.max(300, d * 2.4), (t) => { st.x = from + (to - from) * t; drawPet(st); }, () => {
        sound.pop();
        ballG.style.display = 'none';
        st.face = st.face === 1 ? -1 : 1;
        const back = -120 + Math.random() * 60;
        tween(Math.max(300, Math.abs(back - st.x) * 2.4), (t) => { st.x = to + (back - to) * t; drawPet(st); }, () => {
          if (!st.svg.isConnected) return;
          st.pose = 'stand';
          st.face = 1;
          drawPet(st);
          ball.x = st.x + 150;
          ball.y = 0;
          placeBall();
          ballG.style.display = '';
          sound.boing();
          const c = toScreen(st, st.x, -petHeight(pet.look) * st.s);
          burst('heart', c.x, c.y, 8);
          addFun(25);
          flash(st, 'happy', 1200);
          busy = false;
        });
      });
    };
    const throwBall = (vx: number, vy: number) => {
      busy = true;
      sound.whoosh();
      const sx = ball.x;
      const tx = Math.max(-430, Math.min(430, sx + vx * 0.9));
      const h = Math.max(120, Math.min(380, Math.abs(vy) * 0.5 + 140));
      tween(800, (t) => {
        ball.x = sx + (tx - sx) * t;
        ball.y = -h * 4 * t * (1 - t);
        placeBall();
      }, () => {
        sound.boing();
        tween(260, (t) => { ball.y = -40 * 4 * t * (1 - t); placeBall(); }, fetchBall);
      });
    };
    const stage = main.querySelector('.pt-stage') as HTMLDivElement;
    let mode: 'ball' | 'tickle' | null = null;
    let last: { x: number; y: number; t: number } | null = null;
    let vel = { x: 0, y: 0 };
    let tick = 0;
    follow(stage, {
      down: (e) => {
        if (busy) return false;
        const p = toSvg(st, e);
        if (Math.hypot(p.x - ball.x, p.y - (ball.y - 32)) < 90) {
          mode = 'ball';
          sound.pick();
        } else {
          const r = petRect(st);
          if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < 0) {
            mode = 'tickle';
            tick = 0;
          } else return false;
        }
        last = { x: p.x, y: p.y, t: performance.now() };
        vel = { x: 0, y: 0 };
      },
      move: (e) => {
        const p = toSvg(st, e);
        const now = performance.now();
        if (last) {
          const dt = Math.max(8, now - last.t);
          vel = { x: ((p.x - last.x) / dt) * 1000 * 0.5 + vel.x * 0.5, y: ((p.y - last.y) / dt) * 1000 * 0.5 + vel.y * 0.5 };
        }
        if (mode === 'ball') {
          ball.x = Math.max(-440, Math.min(440, p.x));
          ball.y = Math.min(0, p.y + 32);
          placeBall();
        } else if (mode === 'tickle' && last) {
          tick += Math.hypot(p.x - last.x, p.y - last.y);
          if (tick > 160) {
            tick = 0;
            sound.giggle();
            burst('heart', e.clientX, e.clientY - 30, 3);
            if (st.expr !== 'happy') flash(st, 'happy', 900);
            else window.clearTimeout(exprTimer), (exprTimer = window.setTimeout(() => { st.expr = mood(); drawPet(st); }, 900));
            addFun(6);
          }
        }
        last = { x: p.x, y: p.y, t: now };
      },
      up: () => {
        if (mode === 'ball') {
          if (Math.hypot(vel.x, vel.y) > 250) throwBall(vel.x, vel.y);
          else {
            ball.y = 0;
            placeBall();
            sound.drop();
            toast('Flick the ball to throw it!', 'heart');
          }
        }
        mode = null;
        last = null;
      },
    });
  };

  // ---------------- nap ----------------
  const nap = () => {
    main.innerHTML = `<div class="pt-play"><div class="pt-stage pt-nap"></div><p class="pt-hint">Tap the cozy bed to tuck ${esc(pet.name)} in!</p></div>`;
    const night = `<rect x="-3000" y="-3000" width="6000" height="6000" fill="#2a1d55" fill-opacity="0.74" class="pt-night"/>` + [[-300, -400], [-150, -440], [200, -420], [340, -360], [60, -470], [-380, -300]].map(([x, y], i) => `<path d="${starD(x, y, 10 + (i % 3) * 3)}" fill="#ffe680"><animate attributeName="opacity" values="0.3;1;0.3" dur="${1.4 + i * 0.3}s" repeatCount="indefinite"/></path>`).join('') +
      `<path d="M300 -470 A50 50 0 1 0 350 -400 A40 40 0 1 1 300 -470Z" fill="#fff3b0"/>`;
    const st = makeStage(room('#e8dcff', '#d6c4f0', `<rect x="-170" y="-380" width="140" height="160" rx="70" fill="#bfe8ff" stroke="#fff" stroke-width="10"/><g class="pt-nightg" opacity="0">${night}</g>`), '', '-380 -420 760 470');
    const bedX = 120;
    const bedBack = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bedBack.innerHTML = `<g transform="translate(${bedX} 0)">${bedArt('#c99bff', false)}</g>`;
    bedBack.setAttribute('class', 'pt-bed');
    st.svg.querySelector('.bg')!.appendChild(bedBack);
    const bedFront = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bedFront.innerHTML = `<g transform="translate(${bedX} 0)">${bedArt('#c99bff', true)}</g>`;
    bedFront.setAttribute('class', 'pt-bed');
    st.svg.querySelector('.front')!.appendChild(bedFront);
    st.x = -220;
    drawPet(st);
    const before = pet.needs!.sleep;
    let state: 'awake' | 'asleep' | 'done' = 'awake';
    const nightG = st.svg.querySelector('.pt-nightg') as SVGGElement;
    const tuck = () => {
      if (state !== 'awake') return;
      state = 'asleep';
      sound.pop();
      st.pose = 'walk';
      const from = st.x;
      const to = bedX - 10;
      tween(900, (t) => { st.x = from + (to - from) * ease(t); drawPet(st); }, () => {
        if (!st.svg.isConnected) return;
        st.pose = 'sleep';
        st.expr = 'sleep';
        st.s = scale() * 0.9;
        st.y = -40;
        st.x = bedX - 30;
        drawPet(st);
        // the blanket covers the body and stops before the sleepy face
        const pp = petParts(pet.look, 'sleep');
        const headL = st.x + (pp.head.x - pp.head.r * 0.85) * st.s;
        const bodyL = st.x + (pp.body.x - pp.body.rx) * st.s;
        const k = Math.max(0.5, Math.min(1.1, (headL - bodyL + 30) / 300));
        const bl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bl.innerHTML = `<g transform="translate(${f(headL - 150 * k)} 14) scale(${f(k)} 0.9)"><g class="pt-blanket">${blanketArt('#ff9ec7')}</g></g>`;
        st.svg.querySelector('.front')!.prepend(bl);
        nightG.style.transition = 'opacity 1.2s';
        nightG.setAttribute('opacity', '1');
        sound.tune();
        window.setTimeout(() => sound.snore(), 1500);
        main.querySelector('.pt-hint')!.textContent = 'Shh... sweet dreams!';
        window.setTimeout(() => {
          if (!st.svg.isConnected) return;
          state = 'done';
          sound.snore();
          reward('sleep', before, 5, 'petNap', `${esc(pet.name)} had a lovely nap!`);
          main.querySelector('.pt-play')!.insertAdjacentHTML('beforeend', `<div class="pt-again"><button class="btn primary" data-wake>${ic(ART.moon())}<span>Wake up!</span></button></div>`);
        }, 4200);
      });
    };
    main.addEventListener('click', (e) => {
      const t = e.target as Element;
      if (t.closest('[data-wake]')) {
        sound.ding();
        nap();
        return;
      }
      if (state === 'awake' && (t.closest('.pt-bed') || t.closest('.petg'))) tuck();
    });
  };

  const show = (t: Tab) => {
    cleanup();
    tab = t;
    fr.body.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    ({ dress, bath, feed, play, nap })[t]();
  };
  fr.body.querySelector('.pt-care-wrap')!.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tb = t.closest('[data-tab]') as HTMLElement | null;
    if (tb && tb.dataset.tab !== tab) {
      sound.pop();
      show(tb.dataset.tab as Tab);
    }
    if (t.closest('[data-rename]')) {
      sound.tap();
      promptName(pet.name, (v) => {
        pet.name = v;
        fr.setTitle(v);
        G.changed();
      });
    }
  });
  needsBar();
  const m = petMood(pet);
  show(m === 'dirty' ? 'bath' : m === 'hungry' ? 'feed' : m === 'bored' ? 'play' : m === 'sleepy' ? 'nap' : 'dress');
}

// ================= dev =================
/** Dev page entry (pets-dev.html): opens a screen straight away. */
export function devOpen(view: string, arg?: string): void {
  if (view === 'shop') {
    if (arg === 'second') G.s.pets = [newPet('kitten', 'Mochi')];
    else if (arg !== 'keep') G.s.pets = [];
    openPetShop((p) => console.log('adopted', p.name), () => console.log('closed'));
    if (arg && PET_KINDS.some((k) => k.id === arg)) (document.querySelector(`[data-kind="${arg}"]`) as HTMLElement | null)?.click();
    return;
  }
  if (view === 'care') {
    let pet = G.s.pets[0];
    if (!pet) {
      pet = newPet('puppy', 'Biscuit');
      G.s.pets.push(pet);
    }
    if (new URLSearchParams(location.search).get('kind')) pet.look = { ...basePetLook(new URLSearchParams(location.search).get('kind')!), acc: pet.look.acc };
    pet.needs = { food: 30, clean: 20, fun: 50, sleep: 70, t: Date.now() };
    (window as unknown as { pet: Pet }).pet = pet;
    openPetCare(pet, () => console.log('closed'));
    if (arg) (document.querySelector(`[data-tab="${arg}"]`) as HTMLElement | null)?.click();
  }
}
