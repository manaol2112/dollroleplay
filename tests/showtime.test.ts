import { beforeAll, describe, expect, it } from 'vitest';
import { baseLook, wornOf } from '../src/data/looks';
import type { Look } from '../src/types';
import type * as ShowTime from '../src/ui/showtime';

// The show screens import the game, which listens to the page; a tiny stand-in page is enough here.
const noop = () => undefined;
const g = globalThis as Record<string, unknown>;
g.window ??= { addEventListener: noop, removeEventListener: noop, setTimeout, clearTimeout, setInterval, clearInterval, innerWidth: 1024, innerHeight: 768 };
g.document ??= { addEventListener: noop, removeEventListener: noop, visibilityState: 'visible', getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {}, classList: { add: noop, remove: noop } }) };

let SONGS: typeof ShowTime.SONGS;
let THEMES: typeof ShowTime.THEMES;
let bodyBarsFor: typeof ShowTime.bodyBarsFor;
let buildChart: typeof ShowTime.buildChart;
let midiOf: typeof ShowTime.midiOf;
let scoreOutfit: typeof ShowTime.scoreOutfit;
let showAwards: typeof ShowTime.showAwards;
let showCoins: typeof ShowTime.showCoins;
type ThemeId = ShowTime.ThemeId;
beforeAll(async () => {
  ({ SONGS, THEMES, bodyBarsFor, buildChart, midiOf, scoreOutfit, showAwards, showCoins } = await import('../src/ui/showtime'));
});

const naked = (): Look => ({ ...baseLook(), wear: {} });
const ids = (): ThemeId[] => THEMES.map((t) => t.id);

describe('fashion show scoring', () => {
  it('is always kind: every card is 7 to 10, even with nothing on', () => {
    for (const th of ids()) {
      for (const look of [naked(), baseLook()]) {
        const s = scoreOutfit(look, th);
        for (const c of s.cards) {
          expect(c).toBeGreaterThanOrEqual(7);
          expect(c).toBeLessThanOrEqual(10);
        }
        expect(s.total).toBe(s.cards[0] + s.cards[1] + s.cards[2]);
      }
    }
  });

  it('rewards a complete outfit with shoes and accessories', () => {
    const plain = scoreOutfit(naked(), 'free');
    const full: Look = { ...baseLook(), wear: { ...baseLook().wear, head: wornOf('bow', '#ff4f8b'), neck: wornOf('pearls') } };
    const dressed = scoreOutfit(full, 'free');
    expect(dressed.cards[0]).toBe(10);
    expect(dressed.total).toBeGreaterThan(plain.total);
  });

  it('matches themes from item names and groups', () => {
    const beach: Look = { ...baseLook(), wear: { dress: wornOf('swim'), shoes: wornOf('sandals'), face: wornOf('shades') } };
    const winter: Look = { ...baseLook(), wear: { top: wornOf('sweater'), bottom: wornOf('jeans'), shoes: wornOf('rainboots') } };
    const b = scoreOutfit(beach, 'beach');
    expect(b.theme).toBeGreaterThan(scoreOutfit(beach, 'winter').theme);
    expect(scoreOutfit(winter, 'winter').theme).toBeGreaterThan(0);
  });

  it('gives a gentle tip unless the look is perfect', () => {
    const s = scoreOutfit(naked(), 'princess');
    expect(s.tip.length).toBeGreaterThan(0);
    expect(s.tip).not.toMatch(/undefined|NaN/);
  });

  it('pays 15 to 40 coins and gives everyone a ribbon', () => {
    const scores = [scoreOutfit(naked(), 'party'), scoreOutfit(baseLook(), 'party'), scoreOutfit(baseLook(), 'party')];
    const c = showCoins(scores);
    expect(c).toBeGreaterThanOrEqual(15);
    expect(c).toBeLessThanOrEqual(40);
    expect(showCoins([])).toBe(15);
    const { winner, awards } = showAwards(scores, 'party');
    expect(winner).toBe(1);
    expect(awards[winner]).toBe('Star of the Show');
    expect(new Set(awards).size).toBe(3);
    for (const th of ids()) expect(showAwards([scoreOutfit(baseLook(), th)], th).awards).toEqual(['Star of the Show']);
  });
});

describe('dance party', () => {
  it('reads note names', () => {
    expect(midiOf('C4')).toBe(60);
    expect(midiOf('F#5')).toBe(78);
    expect(midiOf('Bb4')).toBe(70);
  });

  it('has at least four songs between 90 and 128 bpm, about a minute long', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(4);
    for (const g of SONGS) {
      expect(g.bpm).toBeGreaterThanOrEqual(90);
      expect(g.bpm).toBeLessThanOrEqual(128);
      expect(g.mel.length % 8).toBe(0);
      expect(g.mel.every((m) => m === 0 || (m > 40 && m < 100))).toBe(true);
      for (const p of Object.values(g.drums)) expect(p).toHaveLength(16);
      expect(g.bass).toHaveLength(16);
      const secs = ((bodyBarsFor(g) + 2) * 4 * 60) / g.bpm;
      expect(secs).toBeGreaterThan(50);
      expect(secs).toBeLessThan(70);
    }
  });

  it('charts notes on the beat, in order, in the four lanes, never too close together', () => {
    for (const g of SONGS) {
      const ch = buildChart(g);
      expect(ch.length).toBeGreaterThan(30);
      const stepMs = 60000 / g.bpm / 4;
      for (let i = 0; i < ch.length; i++) {
        expect(ch[i].step % 4).toBe(0);
        expect(ch[i].lane).toBeGreaterThanOrEqual(0);
        expect(ch[i].lane).toBeLessThanOrEqual(3);
        if (i) expect((ch[i].step - ch[i - 1].step) * stepMs).toBeGreaterThanOrEqual(440);
      }
      expect(new Set(ch.map((n) => n.lane)).size).toBeGreaterThanOrEqual(3);
    }
  });
});
