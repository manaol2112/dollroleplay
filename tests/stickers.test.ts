import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RARITY_WEIGHT, SET_BY_ID, STICKERS, STICKER_SETS, pickSticker, setComplete, setProgress, stickerSvg, stickersInSet } from '../src/art/stickers';
import { bump, isOwned, newState, priceOf, type GameState } from '../src/data/state';

// The screens need the running game; give them a plain saved state instead of the browser one.
const fake = vi.hoisted(() => ({ s: null as unknown as GameState }));
vi.mock('../src/game', () => ({
  G: {
    get s() { return fake.s; },
    bump: (stat: string, n = 1) => bump(fake.s, stat, n),
    changed: () => {},
    earn: (n: number) => { fake.s.coins += n; },
    on: () => () => {},
  },
  toast: () => {},
  coinFly: () => {},
}));
vi.mock('../src/ui/activities', () => ({ frame: () => { throw new Error('no screens in tests'); } }));
vi.mock('../src/engine/audio', () => ({ sound: new Proxy({}, { get: () => () => {} }) }));
vi.mock('../src/engine/particles', () => ({ burst: () => {}, celebrate: () => {} }));

const { awardSticker, SET_BONUS, stickerCount, uniqueStickers } = await import('../src/ui/stickers');
const { PRIZE_MAX, PRIZE_MIN, msToMidnight, pickPrize, prizeItems } = await import('../src/ui/surprise');

const bad = /NaN|undefined|Infinity|\[object/;
/** A repeatable random number sequence. */
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('sticker art', () => {
  it('has at least 96 stickers in at least 10 sets of 8-12', () => {
    expect(STICKERS.length).toBeGreaterThanOrEqual(96);
    expect(STICKER_SETS.length).toBeGreaterThanOrEqual(10);
    for (const set of STICKER_SETS) {
      const n = stickersInSet(set.id).length;
      expect(n, set.id).toBeGreaterThanOrEqual(8);
      expect(n, set.id).toBeLessThanOrEqual(12);
      expect(stickersInSet(set.id).some((s) => s.rarity === 'sparkle'), `${set.id} has a sparkle sticker`).toBe(true);
    }
    for (const s of STICKERS) expect(SET_BY_ID[s.set], s.id).toBeTruthy();
  });

  it('gives every sticker a unique id and name', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    expect(new Set(STICKERS.map((s) => s.name)).size).toBe(STICKERS.length);
  });

  it('draws every sticker, its silhouette and a still copy as clean svg', () => {
    for (const s of STICKERS) {
      for (const opts of [{}, { silhouette: true }, { still: true }]) {
        const svg = stickerSvg(s.id, 96, opts);
        expect(svg, s.id).toMatch(/^<svg [^>]*viewBox="0 0 100 100"[^>]*>.*<\/svg>$/s);
        expect(svg, `${s.id} ${JSON.stringify(opts)}`).not.toMatch(bad);
      }
      const color = stickerSvg(s.id);
      expect(color.length, s.id).toBeGreaterThan(1500);
      expect(color.includes('<animate'), s.id).toBe(s.rarity === 'sparkle');
      expect(stickerSvg(s.id, 96, { still: true }).includes('<animate')).toBe(false);
      expect(stickerSvg(s.id, 96, { silhouette: true })).toContain('>?</text>');
    }
    expect(stickerSvg('nope')).toBe('');
  });

  it('keeps ids unique between copies so masks never mix up', () => {
    const a = stickerSvg('bunny').match(/id="([^"]+)"/g)!;
    const b = stickerSvg('bunny').match(/id="([^"]+)"/g)!;
    expect(a.some((x) => b.includes(x))).toBe(false);
  });
});

describe('collecting', () => {
  it('weights rarity about 70 / 25 / 5', () => {
    expect(RARITY_WEIGHT.common + RARITY_WEIGHT.rare + RARITY_WEIGHT.sparkle).toBe(100);
    const rnd = seeded(7);
    const tally = { common: 0, rare: 0, sparkle: 0 };
    for (let i = 0; i < 4000; i++) {
      const id = pickSticker([], rnd);
      tally[STICKERS.find((s) => s.id === id)!.rarity]++;
    }
    expect(tally.common / 4000).toBeGreaterThan(0.64);
    expect(tally.common / 4000).toBeLessThan(0.76);
    expect(tally.rare / 4000).toBeGreaterThan(0.2);
    expect(tally.rare / 4000).toBeLessThan(0.3);
    expect(tally.sparkle / 4000).toBeGreaterThan(0.025);
    expect(tally.sparkle / 4000).toBeLessThan(0.08);
  });

  it('strongly prefers stickers not found yet', () => {
    const rnd = seeded(3);
    const have: string[] = [];
    for (let i = 0; i < 60; i++) have.push(pickSticker(have, rnd));
    expect(new Set(have).size).toBeGreaterThanOrEqual(52);
  });

  it('finishes the whole collection and then gives doubles', () => {
    const rnd = seeded(11);
    const have: string[] = [];
    for (let i = 0; i < 400 && new Set(have).size < STICKERS.length; i++) have.push(pickSticker(have, rnd));
    expect(new Set(have).size).toBe(STICKERS.length);
    const extra = pickSticker(have, rnd);
    expect(STICKERS.some((s) => s.id === extra)).toBe(true);
  });

  it('counts set progress', () => {
    const animals = stickersInSet('animals').map((s) => s.id);
    expect(setProgress([], 'animals')).toEqual({ found: 0, total: animals.length });
    expect(setProgress([animals[0], animals[0], animals[1]], 'animals').found).toBe(2);
    expect(setComplete(animals.slice(1), 'animals')).toBe(false);
    expect(setComplete(animals, 'animals')).toBe(true);
  });
});

describe('awardSticker', () => {
  beforeEach(() => {
    fake.s = newState(new Date(2026, 10, 14));
  });

  it('adds a sticker, counts it and tells which one', () => {
    const id = awardSticker('Test', { quiet: true });
    expect(fake.s.stickers).toEqual([id]);
    expect(fake.s.stats.sticker).toBe(1);
    expect(stickerCount()).toBe(1);
    expect(uniqueStickers()).toEqual([id]);
  });

  it('pays the set bonus once when a set fills up', () => {
    const coins = fake.s.coins;
    // Everything except one fairy sticker: the next new sticker must be that one.
    const last = stickersInSet('fairy')[0].id;
    fake.s.stickers = STICKERS.filter((s) => s.id !== last).map((s) => s.id);
    for (const set of STICKER_SETS) if (set.id !== 'fairy') fake.s.stats[`stickerSet:${set.id}`] = 1; // those bonuses were paid long ago
    let got = '';
    for (let i = 0; i < 20 && got !== last; i++) got = awardSticker('', { quiet: true });
    expect(got).toBe(last);
    expect(fake.s.coins).toBe(coins + SET_BONUS);
    expect(fake.s.stats['stickerSet:fairy']).toBe(1);
    awardSticker('', { quiet: true });
    expect(fake.s.coins).toBe(coins + SET_BONUS);
  });
});

describe('surprise box', () => {
  it('offers only cheap-to-mid items the player does not own', () => {
    const s = newState();
    const items = prizeItems(s.owned);
    const all = [...items.wear, ...items.furniture, ...items.hair];
    expect(items.wear.length).toBeGreaterThan(20);
    expect(items.furniture.length).toBeGreaterThan(20);
    expect(items.hair.length).toBeGreaterThan(0);
    for (const k of all) {
      expect(priceOf(k), k).toBeGreaterThanOrEqual(PRIZE_MIN);
      expect(priceOf(k), k).toBeLessThanOrEqual(PRIZE_MAX);
      expect(isOwned(s, k), k).toBe(false);
    }
    expect(prizeItems([items.wear[0]]).wear).not.toContain(items.wear[0]);
  });

  it('gives coins, stickers and items, and never an item already owned', () => {
    const rnd = seeded(5);
    const owned: string[] = [];
    const kinds = { coins: 0, sticker: 0, item: 0 };
    for (let i = 0; i < 300; i++) {
      const p = pickPrize(owned, rnd);
      kinds[p.kind]++;
      if (p.kind === 'coins') {
        expect(p.n).toBeGreaterThanOrEqual(25);
        expect(p.n).toBeLessThanOrEqual(60);
      }
      if (p.kind === 'item') {
        expect(owned).not.toContain(p.key);
        owned.push(p.key);
      }
    }
    for (const k of Object.values(kinds)) expect(k).toBeGreaterThan(60);
  });

  it('falls back to coins when every gift is owned', () => {
    const items = prizeItems([]);
    const owned = [...items.wear, ...items.furniture, ...items.hair];
    const rnd = seeded(9);
    for (let i = 0; i < 50; i++) expect(pickPrize(owned, rnd).kind).not.toBe('item');
  });

  it('counts down to local midnight', () => {
    expect(msToMidnight(new Date(2026, 10, 14, 23, 59, 30))).toBe(30_000);
    expect(msToMidnight(new Date(2026, 10, 14, 0, 0, 0))).toBe(24 * 3600_000);
  });
});
