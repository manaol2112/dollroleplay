import { describe, expect, it, vi } from 'vitest';

// The activities need the DOM and the running game; only their labels and icons are checked here.
vi.mock('../src/game', () => ({ G: {}, toast: () => {} }));
vi.mock('../src/ui/activities', () => ({ frame: () => ({}) }));
vi.mock('../src/engine/audio', () => ({ sound: {} }));
vi.mock('../src/engine/particles', () => ({ burst: () => {}, celebrate: () => {} }));

const bad = /NaN|undefined|Infinity|\[object/;

describe('seasonal fun', () => {
  it('has a named activity with an icon for every season', async () => {
    const { SEASON_FUN, openSeasonFun, openSnowman, openPumpkin, openEggHunt, openSandcastle } = await import('../src/ui/seasonfun');
    const { SEASONS } = await import('../src/types');
    for (const s of SEASONS) {
      expect(SEASON_FUN[s].name.length).toBeGreaterThan(3);
      expect(SEASON_FUN[s].icon).toMatch(/^<svg viewBox="0 0 64 64"/);
      expect(SEASON_FUN[s].icon).not.toMatch(bad);
    }
    expect(SEASON_FUN.winter.name).toBe('Build a Snowman');
    for (const fn of [openSeasonFun, openSnowman, openPumpkin, openEggHunt, openSandcastle]) expect(typeof fn).toBe('function');
  });
});
