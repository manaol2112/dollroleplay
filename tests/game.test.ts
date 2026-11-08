import { describe, expect, it } from 'vitest';
import { renderDoll, HAIR } from '../src/art/doll';
import { FURNITURE } from '../src/art/furniture';
import { WEAR } from '../src/art/wear';
import { townLayers } from '../src/art/town';
import { CHALLENGES } from '../src/data/challenges';
import { baseLook, randomLook, starterLooks } from '../src/data/looks';
import { PLACES } from '../src/data/places';
import { makeQuestion } from '../src/data/quiz';
import { BLACK_KEYS, SONGS, WHITE_KEYS } from '../src/data/songs';
import {
  ACTIVE_CHALLENGES, activeChallenges, bump, buy, claim, claimDaily, dailyReady, isDone, isOwned, newState, parseState, priceOf, progressOf, seasonFor, START_COINS,
} from '../src/data/state';
import { SEASONS, type Look } from '../src/types';

const bad = /NaN|undefined|Infinity|\[object/;

describe('art', () => {
  it('draws every clothing item on every age and pose', () => {
    for (const w of WEAR) {
      for (const age of ['kid', 'teen', 'adult'] as const) {
        for (const pose of ['stand', 'held', 'sit', 'sleep', 'wave'] as const) {
          const look: Look = { ...baseLook(), age, boy: pose === 'held' || pose === 'sit', wear: { ...baseLook().wear, [w.slot]: { id: w.id, color: w.color, pattern: 'stars' } } };
          const svg = renderDoll(look, { pose });
          expect(svg, `${w.id} ${age} ${pose}`).not.toMatch(bad);
          expect(svg.length).toBeGreaterThan(500);
        }
      }
    }
  });

  it('has at least 100 choices in every closet tab, with unique ids', () => {
    const ids = new Set<string>();
    for (const w of WEAR) {
      expect(ids.has(w.id), `duplicate ${w.id}`).toBe(false);
      ids.add(w.id);
      expect(w.name.length, w.id).toBeGreaterThan(0);
      expect(w.price, w.id).toBeGreaterThanOrEqual(0);
    }
    for (const slot of ['top', 'bottom', 'dress', 'outer', 'shoes', 'head', 'face', 'neck', 'hand', 'back'] as const) {
      expect(WEAR.filter((w) => w.slot === slot).length, slot).toBeGreaterThanOrEqual(100);
    }
  });

  it('draws every hairstyle, face and expression', () => {
    for (const h of HAIR) for (const e of ['normal', 'happy', 'surprised', 'sleep', 'yum'] as const) {
      const svg = renderDoll({ ...baseLook(), hair: h.id, lips: '#e0245e', blush: '#ff9db5', shadow: '#c99bff', freckles: true, sticker: 'star' }, { expr: e });
      expect(svg, h.id).not.toMatch(bad);
    }
    for (const s of starterLooks()) expect(renderDoll(s.look, { headOnly: true })).not.toMatch(bad);
  });

  it('draws every piece of furniture, on and off', () => {
    for (const d of FURNITURE) {
      for (const on of [false, true]) {
        const svg = d.art(d.color ?? '#ff9ec7', on) + (d.front ? d.front(d.color ?? '#ff9ec7', on) : '');
        expect(svg, d.id).not.toMatch(bad);
      }
      for (const s of d.seats ?? []) expect(Number.isFinite(s.x + s.y)).toBe(true);
    }
  });

  it('draws every place and the town in every season', () => {
    const s = newState();
    for (const season of SEASONS) {
      const t = townLayers(season, { home: [baseLook()], theater: [baseLook(), baseLook()] }, true);
      for (const layer of Object.values(t)) expect(layer).not.toMatch(bad);
      for (const p of Object.values(PLACES)) expect(p.bg(season, s.scenes[p.id], {}), `${p.id} ${season}`).not.toMatch(bad);
    }
  });

  it('only places furniture that exists', () => {
    const ids = new Set(FURNITURE.map((f) => f.id));
    for (const p of Object.values(PLACES)) for (const it of p.initial) expect(ids.has(it.def), it.def).toBe(true);
    for (const f of FURNITURE) for (const sp of f.spawn ?? []) expect(ids.has(sp), sp).toBe(true);
  });
});

describe('thumbnails', () => {
  it('strips animations from thumbnails', async () => {
    const { still } = await import('../src/ui/dom');
    const svg = '<g><animate attributeName="opacity" values="0;1" dur="1s"/><circle r="2"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s"></animateTransform></circle><animateMotion path="M0 0" dur="1s"/></g>';
    expect(still(svg)).toBe('<g><circle r="2"></circle></g>');
  });
});

describe('saving', () => {
  it('starts with friends, rooms and challenges', () => {
    const s = newState();
    expect(s.dolls.length).toBe(6);
    expect(s.dolls.filter((d) => d.look.boy).map((d) => d.name).sort()).toEqual(['Dad', 'Leo']);
    expect(s.coins).toBe(START_COINS);
    expect(Object.keys(s.scenes).sort()).toEqual(Object.keys(PLACES).sort());
    expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
  });

  it('round-trips a save', () => {
    const s = newState();
    s.coins = 777;
    s.dolls[0].name = 'Sparkle';
    s.dolls[0].seat = { uid: s.scenes.bedroom.items[0].uid, i: 0 };
    const back = parseState(JSON.stringify(s))!;
    expect(back.coins).toBe(777);
    expect(back.dolls[0].name).toBe('Sparkle');
    expect(back.dolls[0].seat).toEqual(s.dolls[0].seat);
    expect(back.scenes.kitchen.items.length).toBe(s.scenes.kitchen.items.length);
  });

  it('invites Leo and Dad into saves made before boys existed', () => {
    const old = JSON.parse(JSON.stringify(newState()));
    old.dolls = old.dolls.filter((d: { look: { boy?: boolean } }) => !d.look.boy);
    delete old.boysAdded;
    const s = parseState(JSON.stringify(old))!;
    expect(s.dolls.map((d) => d.name)).toEqual(expect.arrayContaining(['Lily', 'Mia', 'Rosie', 'Mom', 'Leo', 'Dad']));
    expect(new Set(s.dolls.map((d) => d.id)).size).toBe(s.dolls.length);
    const again = parseState(JSON.stringify(s))!;
    expect(again.dolls.length).toBe(s.dolls.length);
  });

  it('rejects junk and repairs damaged saves', () => {
    expect(parseState('not json')).toBeNull();
    expect(parseState('{"v":2}')).toBeNull();
    expect(parseState(null)).toBeNull();
    const s = newState();
    const raw = JSON.parse(JSON.stringify(s));
    raw.dolls[0].look.wear.top = { id: 'gone-forever', color: '#fff', pattern: 'none' };
    raw.dolls[0].look.hair = 'nope';
    raw.scenes.bedroom.items.push({ uid: 9999, def: 'nope', x: 0, y: 0 });
    delete raw.scenes.salon;
    raw.coins = 'lots';
    const fixed = parseState(JSON.stringify(raw))!;
    expect(fixed.dolls[0].look.wear.top).toBeUndefined();
    expect(fixed.dolls[0].look.hair).toBe('long');
    expect(fixed.scenes.bedroom.items.some((i) => i.def === 'nope')).toBe(false);
    expect(fixed.scenes.salon.items.length).toBeGreaterThan(0);
    expect(fixed.coins).toBe(START_COINS);
    expect(fixed.nextUid).toBeGreaterThan(Math.max(...fixed.scenes.bedroom.items.map((i) => i.uid)));
  });
});

describe('shop', () => {
  it('free things are owned, paid things cost coins', () => {
    const s = newState();
    expect(isOwned(s, 'tee')).toBe(true);
    expect(isOwned(s, 'princess')).toBe(false);
    s.coins = 10;
    expect(buy(s, 'princess')).toBe(false);
    expect(s.coins).toBe(10);
    s.coins = 500;
    expect(buy(s, 'princess')).toBe(true);
    expect(s.coins).toBe(500 - priceOf('princess'));
    expect(isOwned(s, 'princess')).toBe(true);
    expect(buy(s, 'princess')).toBe(true);
    expect(s.coins).toBe(500 - priceOf('princess'));
    expect(priceOf('hair:princess')).toBeGreaterThan(0);
    expect(priceOf('wall:night')).toBeGreaterThan(0);
    expect(priceOf('floor:marble')).toBeGreaterThan(0);
  });

  it('random boys get boy hair and no dresses', () => {
    const s = newState();
    for (let i = 0; i < 200; i++) {
      const l = randomLook(() => true, 'kid', true);
      expect(l.boy).toBe(true);
      expect(l.wear.dress).toBeUndefined();
      expect(['short', 'buzz', 'spiky', 'sidepart', 'swoop', 'curlytop', 'mohawk', 'manbun', 'shaggy', 'flattop', 'afro', 'pixie']).toContain(l.hair);
    }
    void s;
  });

  it('random outfits only use owned things', () => {
    const s = newState();
    for (let i = 0; i < 200; i++) {
      const l = randomLook((k) => isOwned(s, k));
      for (const w of Object.values(l.wear)) expect(isOwned(s, w!.id), w!.id).toBe(true);
      expect(isOwned(s, 'hair:' + l.hair)).toBe(true);
    }
  });
});

describe('challenges', () => {
  it('pays once when finished, then refills the list', () => {
    const s = newState();
    const first = activeChallenges(s).find((c) => c.id === 'firstDress')!;
    expect(isDone(s, first)).toBe(false);
    expect(claim(s, 'firstDress')).toBe(0);
    bump(s, 'equip');
    expect(isDone(s, first)).toBe(true);
    const coins = s.coins;
    expect(claim(s, 'firstDress')).toBe(first.reward);
    expect(s.coins).toBe(coins + first.reward);
    expect(claim(s, 'firstDress')).toBe(0);
    expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
    expect(s.ch.list).not.toContain('firstDress');
  });

  it('counts progress from when a challenge appears', () => {
    const s = newState();
    bump(s, 'pianoNote', 100);
    s.ch.list = ['piano50'];
    s.ch.base.piano50 = s.stats.pianoNote;
    const c = activeChallenges(s).find((x) => x.id === 'piano50')!;
    expect(progressOf(s, c)).toBe(0);
    bump(s, 'pianoNote', 50);
    expect(isDone(s, c)).toBe(true);
  });

  it('never runs out', () => {
    const s = newState();
    // Meet the challenges that look at the town rather than counting things.
    s.visited = ['home', 'school', 'playground', 'theater', 'salon', 'boutique'];
    s.seasonsSeen = [...SEASONS];
    s.songsDone = SONGS.map((x) => x.id);
    while (s.dolls.length < 6) s.dolls.push({ ...s.dolls[0], id: 'x' + s.dolls.length });
    for (const d of s.dolls) d.place = 'bedroom';
    s.dolls[0].look = { ...s.dolls[0].look, lips: '#e0245e', blush: '#ff9db5' };
    for (let round = 0; round < 80; round++) {
      for (const c of activeChallenges(s)) if (c.stat) bump(s, c.stat, c.target);
      for (const c of [...activeChallenges(s)]) if (isDone(s, c)) claim(s, c.id);
      expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
    }
    expect(CHALLENGES.every((c) => s.ch.claimed.includes(c.id))).toBe(true);
    expect(s.ch.list.every((id) => id.startsWith('rep-'))).toBe(true);
  });

  it('gives one daily gift per day', () => {
    const s = newState();
    const day = new Date(2026, 10, 7, 9);
    expect(dailyReady(s, day)).toBe(true);
    expect(claimDaily(s, day)).toBeGreaterThan(0);
    expect(claimDaily(s, new Date(2026, 10, 7, 20))).toBe(0);
    expect(dailyReady(s, new Date(2026, 10, 8, 8))).toBe(true);
  });
});

describe('school and music', () => {
  it('every question has its answer among the choices', () => {
    for (let level = 0; level < 6; level++) for (let i = 0; i < 400; i++) {
      const q = makeQuestion(level);
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(q.options.length);
      if (q.kind === 'sub') expect(Number(q.answer)).toBeGreaterThanOrEqual(0);
    }
  });

  it('every song fits on the keyboard', () => {
    const keys = new Set([...WHITE_KEYS, ...BLACK_KEYS]);
    for (const s of SONGS) for (const n of s.notes) expect(keys.has(n), `${s.id} ${n}`).toBe(true);
  });

  it('picks the season from the date', () => {
    expect(seasonFor(new Date(2026, 0, 5))).toBe('winter');
    expect(seasonFor(new Date(2026, 3, 5))).toBe('spring');
    expect(seasonFor(new Date(2026, 6, 5))).toBe('summer');
    expect(seasonFor(new Date(2026, 10, 7))).toBe('fall');
  });
});
