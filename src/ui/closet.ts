// The closet: dress a friend, change hair, face and makeup, make new friends. The salon uses the
// same screen with only the hair and makeup tabs.
import { BLUSH_COLORS, EYE_COLORS, HAIR_COLORS, LIP_COLORS, PALETTE, SHADOW_COLORS, SKIN_TONES, dark, luma } from '../art/color';
import { PATTERNS, type Pattern } from '../art/defs';
import { EYE_STYLES, HAIR, MOUTHS, STICKERS, renderDoll } from '../art/doll';
import { WEAR_BY_ID, sparkleD, wearFor } from '../art/wear';
import { randomLook, wornOf } from '../data/looks';
import { MAX_DOLLS } from '../data/state';
import { sound } from '../engine/audio';
import { burst } from '../engine/particles';
import { G, toast } from '../game';
import type { Doll, Look, Slot } from '../types';
import { confirmBox, el, esc, headThumb, lookThumb, promptName, slotBox } from './dom';
import { icon } from './icons';

type TabId = 'body' | 'hair' | 'face' | 'makeup' | Slot;
const TABS: { id: TabId; name: string; icon: string }[] = [
  { id: 'body', name: 'Body', icon: 'body' },
  { id: 'hair', name: 'Hair', icon: 'hair' },
  { id: 'face', name: 'Face', icon: 'face' },
  { id: 'makeup', name: 'Makeup', icon: 'makeup' },
  { id: 'top', name: 'Tops', icon: 'shirt' },
  { id: 'bottom', name: 'Bottoms', icon: 'pants' },
  { id: 'dress', name: 'Dresses', icon: 'dress' },
  { id: 'outer', name: 'Coats', icon: 'coat' },
  { id: 'shoes', name: 'Shoes', icon: 'shoe' },
  { id: 'head', name: 'Hats & Bows', icon: 'crown' },
  { id: 'face2' as TabId, name: 'Glasses', icon: 'glasses' },
  { id: 'neck', name: 'Necklaces', icon: 'necklace' },
  { id: 'hand', name: 'Hold', icon: 'wand' },
  { id: 'back', name: 'Wings & Bags', icon: 'wings' },
];
const SALON_TABS: TabId[] = ['hair', 'makeup', 'face', 'head'];
const NAMES = ['Ava', 'Zoe', 'Coco', 'Bella', 'Luna', 'Sunny', 'Ruby', 'Daisy', 'Nina', 'Ellie', 'Kiki', 'Pearl', 'Dad', 'Grandma', 'Max', 'Leo', 'Ivy', 'Willow'];

interface Card {
  key: string;
  html: string;
  label?: string;
  selected: boolean;
  lockKey?: string;
  swatch?: boolean;
}
interface Section {
  title: string;
  cards: Card[];
  pick: (key: string) => void;
  small?: boolean;
}

export interface ClosetOpts {
  dollId?: string;
  mode?: 'closet' | 'salon';
  newFriend?: boolean;
  newPlace?: string | null;
  onClose?: (changed: boolean) => void;
  onDollChange?: (id: string) => void;
}

export function openCloset(opts: ClosetOpts = {}): void {
  const mode = opts.mode ?? 'closet';
  const layer = document.getElementById('overlay')!;
  const root = el('div', `closet ${mode}`);
  layer.appendChild(root);
  requestAnimationFrame(() => root.classList.add('show'));
  let doll: Doll = G.s.dolls.find((d) => d.id === opts.dollId) ?? G.s.dolls[0];
  let tab: TabId = mode === 'salon' ? 'hair' : 'top';
  let changed = false;
  let salonStart = JSON.stringify(pickSalon(doll.look));

  if (opts.newFriend) doll = addFriend(opts.newPlace ?? null) ?? doll;

  root.innerHTML = `
    <div class="closet-stage">
      <div class="roster"></div>
      <div class="stage-art">${stageBackdrop(mode)}</div>
      <div class="doll-view"></div>
      <div class="stage-bar">
        <button class="chip name-chip" data-act="rename">${icon('rename')}<span class="nm"></span></button>
        <div class="age-chips">${(['kid', 'teen', 'adult'] as const).map((a) => `<button class="chip age" data-age="${a}">${a === 'adult' ? 'Grown-up' : a === 'kid' ? 'Kid' : 'Teen'}</button>`).join('')}</div>
        <button class="round-btn" data-act="random" title="Surprise me">${icon('dice')}</button>
        <button class="round-btn" data-act="delete" title="Say goodbye">${icon('trash')}</button>
      </div>
    </div>
    <div class="closet-panel">
      <div class="panel-head"><h2>${mode === 'salon' ? 'Beauty Salon' : 'Closet'}</h2><button class="btn primary done" data-act="done">${icon('check')}<span>Done</span></button></div>
      <div class="tabs"></div>
      <div class="sections"></div>
      <div class="paint"></div>
    </div>`;

  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const view = q<HTMLDivElement>('.doll-view');
  const sectionsEl = q<HTMLDivElement>('.sections');
  const paintEl = q<HTMLDivElement>('.paint');

  const touch = () => {
    changed = true;
    G.changed();
    opts.onDollChange?.(doll.id);
  };

  function renderRoster(): void {
    const r = q<HTMLDivElement>('.roster');
    r.innerHTML = G.s.dolls.map((d) => `<button class="ava${d === doll ? ' on' : ''}" data-doll="${d.id}" title="${esc(d.name)}">${headThumb(d.look)}</button>`).join('') +
      (G.s.dolls.length < MAX_DOLLS && mode === 'closet' ? `<button class="ava add" data-act="add" title="New friend">${icon('plus')}</button>` : '');
  }

  function renderDollView(pop = false): void {
    view.innerHTML = `<svg viewBox="-210 -480 420 500" preserveAspectRatio="xMidYMax meet"><ellipse cx="0" cy="0" rx="110" ry="22" fill="url(#g-ground)"/><g class="bob"><g class="art">${renderDoll(doll.look, { expr: pop ? 'happy' : 'normal' })}</g></g></svg>`;
    if (pop) {
      view.classList.remove('pop');
      void view.offsetWidth;
      view.classList.add('pop');
      const r = view.getBoundingClientRect();
      burst('sparkle', r.left + r.width / 2, r.top + r.height * 0.45, 10);
      window.setTimeout(() => renderDollView(false), 900);
    }
    q<HTMLSpanElement>('.nm').textContent = doll.name;
    root.querySelectorAll<HTMLButtonElement>('.age').forEach((b) => b.classList.toggle('on', b.dataset.age === doll.look.age));
  }

  function renderTabs(): void {
    const t = q<HTMLDivElement>('.tabs');
    const list = mode === 'salon' ? TABS.filter((x) => SALON_TABS.includes(x.id)) : TABS;
    t.innerHTML = list.map((x) => `<button class="tab${x.id === tab ? ' on' : ''}" data-tab="${x.id}">${icon(x.icon)}<span>${x.name}</span></button>`).join('');
  }

  function wornSlot(t: TabId): Slot | null {
    if ((t as string) === 'face2') return 'face';
    return ['top', 'bottom', 'dress', 'outer', 'shoes', 'head', 'neck', 'hand', 'back'].includes(t) ? (t as Slot) : null;
  }

  function sectionsFor(t: TabId): Section[] {
    const L = doll.look;
    const sw = (colors: string[], cur: string | null, none = false): Card[] => [
      ...(none ? [{ key: 'none', html: `<span class="none-x">${icon('close')}</span>`, selected: cur === null, swatch: true }] : []),
      ...colors.map((c) => ({ key: c, html: `<span class="sw" style="background:${c}"></span>`, selected: c === cur, swatch: true })),
    ];
    const set = (fn: (l: Look) => void, pop = true) => {
      fn(doll.look);
      sound.pop();
      touch();
      renderAll(pop);
    };
    switch (t) {
      case 'body':
        return [
          { title: 'Skin', cards: sw(SKIN_TONES, L.skin), pick: (k) => set((l) => (l.skin = k)) },
          {
            title: 'Grow up',
            cards: (['kid', 'teen', 'adult'] as const).map((a) => ({ key: a, html: lookThumb({ ...L, age: a }, slotBox({ ...L, age: 'adult' }, 'full')), label: a === 'adult' ? 'Grown-up' : a === 'kid' ? 'Kid' : 'Teen', selected: L.age === a })),
            pick: (k) => set((l) => (l.age = k as Look['age'])),
          },
        ];
      case 'hair':
        return [
          {
            title: 'Hairstyle',
            cards: HAIR.map((h) => ({ key: h.id, html: lookThumb({ ...L, hair: h.id, wear: {} }, slotBox(L, 'hair'), { headOnly: true }), selected: L.hair === h.id, lockKey: h.price ? 'hair:' + h.id : undefined, label: h.name })),
            pick: (k) => set((l) => (l.hair = k)),
          },
          { title: 'Hair color', cards: sw(HAIR_COLORS, L.hairColor), pick: (k) => set((l) => (l.hairColor = k)) },
        ];
      case 'face':
        return [
          { title: 'Eyes', cards: EYE_STYLES.map((e) => ({ key: e.id, html: lookThumb({ ...L, eyes: e.id }, slotBox(L, 'face'), { headOnly: true }), selected: L.eyes === e.id, label: e.name })), pick: (k) => set((l) => (l.eyes = k)) },
          { title: 'Eye color', cards: sw(EYE_COLORS, L.eyeColor), pick: (k) => set((l) => (l.eyeColor = k)) },
          { title: 'Mouth', cards: MOUTHS.map((m) => ({ key: m.id, html: lookThumb({ ...L, mouth: m.id }, slotBox(L, 'face'), { headOnly: true }), selected: L.mouth === m.id, label: m.name })), pick: (k) => set((l) => (l.mouth = k)) },
        ];
      case 'makeup':
        return [
          { title: 'Blush', cards: sw(BLUSH_COLORS, L.blush, true), pick: (k) => set((l) => (l.blush = k === 'none' ? null : k)), small: true },
          { title: 'Lipstick', cards: sw(LIP_COLORS, L.lips, true), pick: (k) => set((l) => (l.lips = k === 'none' ? null : k)), small: true },
          { title: 'Eye shadow', cards: sw(SHADOW_COLORS, L.shadow, true), pick: (k) => set((l) => (l.shadow = k === 'none' ? null : k)), small: true },
          {
            title: 'Freckles & stickers',
            cards: [
              { key: 'freckles', html: lookThumb({ ...L, freckles: !L.freckles ? true : true }, slotBox(L, 'face'), { headOnly: true }), selected: L.freckles, label: 'Freckles' },
              ...STICKERS.map((s) => ({ key: 'st:' + s.id, html: lookThumb({ ...L, sticker: s.id }, slotBox(L, 'face'), { headOnly: true }), selected: L.sticker === s.id, label: s.name })),
            ],
            pick: (k) => set((l) => {
              if (k === 'freckles') l.freckles = !l.freckles;
              else l.sticker = l.sticker === k.slice(3) ? null : k.slice(3);
            }),
          },
        ];
      default: {
        const slot = wornSlot(t)!;
        const items = wearFor(slot);
        const cur = L.wear[slot]?.id ?? null;
        const optional = slot !== 'top' && slot !== 'bottom' ? true : true;
        const preview = (id: string | null): string => {
          const l: Look = { ...L, wear: { ...L.wear } };
          if (id) {
            const prevColor = l.wear[slot]?.id === id ? l.wear[slot]!.color : WEAR_BY_ID[id].color;
            l.wear[slot] = wornOf(id, prevColor, l.wear[slot]?.id === id ? l.wear[slot]!.pattern : 'none');
            if (slot === 'dress') {
              delete l.wear.top;
              delete l.wear.bottom;
            }
            if (slot === 'top' || slot === 'bottom') delete l.wear.dress;
          } else delete l.wear[slot];
          const box = slot === 'hand' || slot === 'back' ? slotBox(L, 'full') : slotBox(L, slot === 'face' ? 'face' : slot);
          return lookThumb(l, box, { headOnly: slot === 'face' || slot === 'head' });
        };
        const season = G.s.season;
        const cards: Card[] = [
          ...(optional ? [{ key: 'none', html: `<span class="none-x">${icon('close')}</span>`, selected: cur === null, label: 'None' }] : []),
          ...items.map((w) => ({ key: w.id, html: preview(w.id) + (w.tags?.includes(season) ? `<span class="season-tag">${icon(season === 'winter' ? 'snow' : season === 'fall' ? 'leaf' : season === 'summer' ? 'sun' : 'flower')}</span>` : ''), selected: cur === w.id, lockKey: w.price ? w.id : undefined, label: w.name })),
        ];
        return [{
          title: TABS.find((x) => x.id === t)?.name ?? '',
          cards,
          pick: (k) => {
            const l = doll.look;
            if (k === 'none') delete l.wear[slot];
            else {
              const keepColor = l.wear[slot]?.id === k;
              l.wear[slot] = keepColor ? l.wear[slot] : wornOf(k);
              if (slot === 'dress') {
                delete l.wear.top;
                delete l.wear.bottom;
              }
              if ((slot === 'top' || slot === 'bottom') && l.wear.dress) {
                delete l.wear.dress;
                if (!l.wear.top) l.wear.top = wornOf('tee');
                if (!l.wear.bottom) l.wear.bottom = wornOf('pleated');
              }
            }
            sound.pop();
            G.bump('equip');
            touch();
            renderAll(true);
          },
        }];
      }
    }
  }

  function renderSections(): void {
    const secs = sectionsFor(tab);
    sectionsEl.innerHTML = secs.map((s, si) => `<div class="sec"><h3>${esc(s.title)}</h3><div class="grid${s.cards[0]?.swatch ? ' swatches' : ''}">${s.cards.map((c) => {
      const locked = c.lockKey && !G.owns(c.lockKey);
      return `<button class="card${c.selected ? ' on' : ''}${locked ? ' locked' : ''}${c.swatch ? ' swatch' : ''}" data-sec="${si}" data-key="${esc(c.key)}" ${c.label ? `title="${esc(c.label)}"` : ''}>${c.html}${locked ? `<span class="price">${icon('coin')}${G.price(c.lockKey!)}</span>` : ''}</button>`;
    }).join('')}</div></div>`).join('');
    (sectionsEl as HTMLDivElement & { _secs?: Section[] })._secs = secs;
    renderPaint();
  }

  function renderPaint(): void {
    const slot = wornSlot(tab);
    const w = slot ? doll.look.wear[slot] : undefined;
    const def = w ? WEAR_BY_ID[w.id] : undefined;
    if (!slot || !w || !def || def.fixed) {
      paintEl.innerHTML = '';
      paintEl.classList.remove('show');
      return;
    }
    paintEl.classList.add('show');
    paintEl.innerHTML = `<div class="paint-row">${PALETTE.map((c) => `<button class="dot${c === w.color ? ' on' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>` +
      `<div class="paint-row pats">${PATTERNS.map((p) => `<button class="pat${p === w.pattern ? ' on' : ''}" data-pat="${p}"><svg viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${luma(w.color) > 0.82 ? dark(w.color, 0.35) : w.color}"/>${p === 'none' ? '' : `<rect width="40" height="40" rx="10" fill="url(#p-${p})"/>`}</svg></button>`).join('')}</div>`;
  }

  function renderAll(pop = false): void {
    renderDollView(pop);
    renderRoster();
    renderTabs();
    const scroll = sectionsEl.scrollTop;
    renderSections();
    sectionsEl.scrollTop = scroll;
  }

  function addFriend(place: string | null): Doll | null {
    if (G.s.dolls.length >= MAX_DOLLS) {
      toast('Your town is full of friends!', 'heart');
      return null;
    }
    const used = new Set(G.s.dolls.map((d) => d.name));
    const name = NAMES.find((n) => !used.has(n)) ?? `Friend ${G.s.dolls.length + 1}`;
    let n = G.s.dolls.length + 1;
    while (G.s.dolls.some((d) => d.id === `d${n}`)) n++;
    const d: Doll = { id: `d${n}`, name, look: randomLook(G.owns), place, x: 700 + Math.random() * 200, y: 760, seat: null };
    G.s.dolls.push(d);
    G.bump('createDoll');
    sound.sparkle();
    return d;
  }

  root.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tabB = t.closest('[data-tab]') as HTMLElement | null;
    if (tabB) {
      tab = tabB.dataset.tab as TabId;
      sound.tap();
      renderTabs();
      sectionsEl.scrollTop = 0;
      renderSections();
      return;
    }
    const av = t.closest('[data-doll]') as HTMLElement | null;
    if (av) {
      finishSalon();
      doll = G.s.dolls.find((d) => d.id === av.dataset.doll) ?? doll;
      salonStart = JSON.stringify(pickSalon(doll.look));
      sound.giggle();
      renderAll(true);
      return;
    }
    const card = t.closest('.card') as HTMLElement | null;
    if (card && sectionsEl.contains(card)) {
      const secs = (sectionsEl as HTMLDivElement & { _secs?: Section[] })._secs!;
      const sec = secs[Number(card.dataset.sec)];
      const c = sec.cards.find((x) => x.key === card.dataset.key);
      if (!c) return;
      if (c.lockKey && !G.owns(c.lockKey)) {
        const price = G.price(c.lockKey);
        confirmBox(`Buy ${c.label ?? 'this'}?`, `It costs <b class="coin-text">${icon('coin')}${price}</b>. You have ${G.s.coins}.`, `${icon('bag')}<span>Buy</span>`, c.html, () => {
          if (G.buy(c.lockKey!)) {
            const r = card.getBoundingClientRect();
            burst('confetti', r.left + r.width / 2, r.top + r.height / 2, 30);
            sec.pick(c.key);
          }
        });
        return;
      }
      sec.pick(c.key);
      return;
    }
    const dot = t.closest('[data-color]') as HTMLElement | null;
    const pat = t.closest('[data-pat]') as HTMLElement | null;
    const slot = wornSlot(tab);
    if ((dot || pat) && slot && doll.look.wear[slot]) {
      const w = doll.look.wear[slot]!;
      if (dot) w.color = dot.dataset.color!;
      if (pat) w.pattern = pat.dataset.pat as Pattern;
      sound.spray();
      touch();
      renderAll(false);
      return;
    }
    const act = (t.closest('[data-act]') as HTMLElement | null)?.dataset.act;
    const ageB = t.closest('[data-age]') as HTMLElement | null;
    if (ageB) {
      doll.look.age = ageB.dataset.age as Look['age'];
      sound.boing();
      touch();
      renderAll(true);
      return;
    }
    if (act === 'done') return close();
    if (act === 'rename') {
      promptName(doll.name, (n) => {
        doll.name = n;
        touch();
        renderAll(false);
      });
    }
    if (act === 'random') {
      const age = doll.look.age;
      doll.look = randomLook(G.owns, age);
      sound.sparkle();
      G.bump('equip');
      touch();
      renderAll(true);
    }
    if (act === 'add') {
      const d = addFriend(opts.newPlace ?? null);
      if (d) {
        doll = d;
        touch();
        renderAll(true);
        toast(`Say hi to ${d.name}! Find your new friend in the Friends tray.`, "heart");
      }
    }
    if (act === 'delete') {
      if (G.s.dolls.length <= 1) return toast('You need at least one friend!', 'heart');
      confirmBox(`Say goodbye to ${doll.name}?`, 'This friend will leave town.', `${icon('trash')}<span>Goodbye</span>`, headThumb(doll.look), () => {
        G.s.dolls = G.s.dolls.filter((d) => d !== doll);
        doll = G.s.dolls[0];
        touch();
        renderAll(false);
      });
    }
  });

  function finishSalon(): void {
    if (mode === 'salon' && JSON.stringify(pickSalon(doll.look)) !== salonStart) {
      G.bump('makeover');
      salonStart = JSON.stringify(pickSalon(doll.look));
    }
  }

  function close(): void {
    finishSalon();
    sound.tap();
    root.classList.remove('show');
    window.setTimeout(() => root.remove(), 260);
    opts.onClose?.(changed);
  }

  renderAll(false);
}

function pickSalon(l: Look) {
  return [l.hair, l.hairColor, l.blush, l.lips, l.shadow, l.freckles, l.sticker, l.eyes, l.eyeColor, l.mouth, l.wear.head?.id];
}

function stageBackdrop(mode: 'closet' | 'salon'): string {
  if (mode === 'salon') {
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><rect width="400" height="500" fill="#e9fbf4"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 36}" width="18" height="500" fill="#d4f5e8"/>`).join('')}
      <path d="M60 380 L60 150 A140 140 0 0 1 340 150 L340 380Z" fill="url(#g-gold)"/><path d="M76 380 L76 152 A124 124 0 0 1 324 152 L324 380Z" fill="#d9efff"/><path d="M76 380 L76 152 A124 124 0 0 1 324 152 L324 380Z" fill="url(#g-glass)"/>
      ${Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return `<circle cx="${200 + Math.cos(a) * 156}" cy="${150 + Math.sin(a) * 156}" r="8" fill="#fff6c8" stroke="#ffd24a" stroke-width="2"/>`; }).join('')}
      <rect y="400" width="400" height="100" fill="#ffd9e8"/></svg>`;
  }
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="cl-bg" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stop-color="#fff4fa"/><stop offset="1" stop-color="#ffc9e0"/></radialGradient></defs>
    <rect width="400" height="500" fill="url(#cl-bg)"/><rect width="400" height="500" fill="url(#p-dots)" opacity="0.5"/>
    <path d="M110 0 L80 420 L320 420 L290 0Z" fill="#fff" opacity="0.35"/>
    ${[[50, 70, 9], [350, 120, 7], [70, 300, 6], [330, 340, 10], [200, 40, 6]].map(([x, y, r]) => `<path d="${sparkleD(x, y, r)}" fill="#fff"/>`).join('')}
    <ellipse cx="200" cy="440" rx="170" ry="40" fill="#ffffff" opacity="0.7"/><ellipse cx="200" cy="436" rx="140" ry="30" fill="#ffd9e8"/></svg>`;
}
