import { describe, expect, it, vi } from 'vitest';

// photos.ts pulls in the running game and the sound engine; neither is needed for the pure helpers.
vi.mock('../src/game', () => ({ G: { bump() {}, earn() {} }, toast() {} }));
vi.mock('../src/engine/audio', () => ({ sound: new Proxy({}, { get: () => () => undefined }) }));
vi.mock('../src/engine/particles', () => ({ burst() {} }));

const { AUDIO_TYPES, MAX_PHOTOS, kenBurns, newId, photoFilename, pickAudioType, pickTrim, sceneSeconds } = await import('../src/engine/photos');

describe('album trimming', () => {
  const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, time: 1000 + i }));
  it('keeps everything under the limit', () => {
    expect(pickTrim(photos(MAX_PHOTOS), MAX_PHOTOS)).toEqual([]);
  });
  it('drops the oldest first', () => {
    expect(pickTrim(photos(MAX_PHOTOS + 2), MAX_PHOTOS)).toEqual(['p0', 'p1']);
  });
  it('keeps photos used in movies when it can', () => {
    expect(pickTrim(photos(5), 3, new Set(['p0']))).toEqual(['p1', 'p2']);
  });
  it('still keeps the limit when every photo is in a movie', () => {
    const all = photos(4);
    expect(pickTrim(all, 3, new Set(all.map((p) => p.id)))).toEqual(['p0']);
  });
  it('does not care about input order', () => {
    expect(pickTrim([...photos(4)].reverse(), 2)).toEqual(['p0', 'p1']);
  });
});

describe('recording format', () => {
  it('prefers mp4 (iPad Safari)', () => {
    expect(pickAudioType(() => true)).toBe('audio/mp4');
  });
  it('falls back to webm (Chrome)', () => {
    expect(pickAudioType((t) => t.startsWith('audio/webm'))).toBe('audio/webm;codecs=opus');
  });
  it('returns empty when nothing is supported, and survives throwing checks', () => {
    expect(pickAudioType(() => false)).toBe('');
    expect(pickAudioType(() => {
      throw new Error('nope');
    })).toBe('');
    expect(AUDIO_TYPES.length).toBeGreaterThan(2);
  });
});

describe('movie timing', () => {
  it('a recording sets the scene length', () => {
    expect(sceneSeconds({ audio: {}, secs: 10 })).toBeCloseTo(11.6);
  });
  it('captions get time to be read aloud', () => {
    expect(sceneSeconds({ caption: 'Once upon a time there were three best friends' })).toBeGreaterThan(sceneSeconds({ caption: 'Hooray!' }));
  });
  it('scenes are never too short or too long', () => {
    expect(sceneSeconds({})).toBe(4);
    expect(sceneSeconds({ caption: 'x'.repeat(1000) })).toBe(24);
    expect(sceneSeconds({ audio: {} })).toBeGreaterThan(4);
  });
  it('the slow zoom alternates in and out', () => {
    const [a0, b0] = kenBurns(0);
    const [a1, b1] = kenBurns(1);
    expect(a0).toContain('1.03');
    expect(b0).toContain('1.2');
    expect(a1).toContain('1.2');
    expect(b1).toContain('1.03');
    expect(kenBurns(0)[1]).not.toBe(kenBurns(2)[1]);
  });
});

describe('names', () => {
  it('photo files are named after the place and time', () => {
    const t = new Date(2026, 10, 14, 9, 5, 7).getTime();
    expect(photoFilename('Theme Park', t)).toBe('doll-theme-park-20261114-090507.jpg');
    expect(photoFilename('!!!', t)).toBe('doll-photo-20261114-090507.jpg');
  });
  it('ids are unique', () => {
    const ids = new Set(Array.from({ length: 500 }, newId));
    expect(ids.size).toBe(500);
  });
});
