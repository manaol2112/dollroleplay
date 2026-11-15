// The mini-game drawings are plain SVG strings: check every kart, prize and podium draws cleanly.
import { describe, expect, it } from 'vitest';
import { KARTS, PRIZES, balloonG, bottleG, kartArt, podiumArt, prizeArt, rng, swimHead, townStrip } from '../src/art/minigames';
import { starterLooks } from '../src/data/looks';

const clean = (s: string) => {
  expect(s).not.toMatch(/NaN|undefined|Infinity/);
  expect(s.length).toBeGreaterThan(50);
};

describe('mini-game art', () => {
  const looks = starterLooks().map((s) => s.look);
  it('draws every kart with and without a driver', () => {
    expect(KARTS.length).toBeGreaterThanOrEqual(6);
    for (const k of KARTS) {
      clean(kartArt(k.id, k.color, looks[0]));
      clean(kartArt(k.id, '#ff7eb6', null));
    }
  });
  it('draws the four booth prizes', () => {
    expect([...PRIZES].sort()).toEqual(['parkBalloon', 'prizeBear', 'prizeBunny', 'prizeUnicorn']);
    for (const p of PRIZES) clean(prizeArt(p));
  });
  it('draws swimmers, bottles, balloons, the street and the podium', () => {
    for (const l of looks) clean(swimHead(l, '#7cc8ff'));
    clean(bottleG('#ff7eb6') + bottleG('#ffd36b', true) + balloonG('#9b6bff') + balloonG('#ffd36b', true));
    clean(townStrip(2400, 3));
    clean(podiumArt(looks.slice(0, 3), ['A', 'B', 'C'], 1));
  });
  it('seeded random numbers repeat', () => {
    const a = rng(5);
    const b = rng(5);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
});
