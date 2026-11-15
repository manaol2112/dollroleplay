import { describe, expect, it } from 'vitest';
import { STORY_ANIMALS, STORY_BACKGROUNDS, STORY_KIDS, STORY_PROPS, storyCover, storyScene } from '../src/art/storyart';
import { STORIES } from '../src/data/stories';
import { sentences } from '../src/engine/voice';

const bad = /NaN|undefined|Infinity/;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('story library', () => {
  it('has unique ids and titles', () => {
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(STORIES.length);
    expect(new Set(STORIES.map((s) => s.title)).size).toBe(STORIES.length);
    expect(STORIES.filter((s) => s.kind === 'book').length).toBeGreaterThanOrEqual(24);
    expect(STORIES.filter((s) => s.kind === 'movie').length).toBeGreaterThanOrEqual(10);
  });

  it('gives every story a sensible length, a moral and a distinct cover', () => {
    for (const st of STORIES) {
      if (st.kind === 'book') expect(st.pages.length, st.id).toBeGreaterThanOrEqual(7);
      else expect(st.pages.length, st.id).toBeGreaterThanOrEqual(10);
      expect(st.pages.length, st.id).toBeLessThanOrEqual(12);
      expect(st.moral.length, st.id).toBeGreaterThan(20);
      expect(st.cover.who.length, st.id).toBeGreaterThan(0);
    }
    const looks = STORIES.map((s) => `${s.cover.bg}|${s.cover.color}`);
    expect(new Set(looks).size).toBe(STORIES.length);
  });

  it('only uses characters, props and places that exist', () => {
    const who = new Set([...STORY_ANIMALS, ...STORY_KIDS]);
    const props = new Set(STORY_PROPS);
    const bgs = new Set(STORY_BACKGROUNDS);
    for (const st of STORIES) {
      for (const w of st.cover.who) expect(who.has(w), `${st.id} cover ${w}`).toBe(true);
      st.pages.forEach((p, i) => {
        const at = `${st.id} page ${i + 1}`;
        expect(bgs.has(p.bg), `${at} bg ${p.bg}`).toBe(true);
        for (const m of p.cast) {
          expect(who.has(m.who), `${at} ${m.who}`).toBe(true);
          if (m.hold) expect(props.has(m.hold), `${at} hold ${m.hold}`).toBe(true);
          if (m.ride) expect(props.has(m.ride), `${at} ride ${m.ride}`).toBe(true);
        }
        for (const pr of p.props ?? []) expect(props.has(pr.id), `${at} prop ${pr.id}`).toBe(true);
      });
    }
  });

  it('draws every page (still and animated) and every cover cleanly', () => {
    for (const st of STORIES) {
      expect(storyCover(st), st.id).not.toMatch(bad);
      st.pages.forEach((p, i) => {
        for (const animate of [false, true]) {
          const svg = storyScene(p, { animate });
          expect(svg, `${st.id} page ${i + 1}`).not.toMatch(bad);
          expect(svg.length).toBeGreaterThan(1000);
        }
      });
    }
  });

  it('keeps the words easy to read aloud', () => {
    for (const st of STORIES) {
      for (const p of st.pages) {
        expect(p.text, st.id).not.toMatch(/[<>{}[\]|#*_~@&%$^=+\\]|\b(?:e\.g|i\.e|etc)\b/);
        expect(p.text, st.id).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
        for (const s of sentences(p.text)) expect(words(s), `${st.id}: ${s}`).toBeLessThanOrEqual(24);
      }
      for (const s of sentences(st.moral)) expect(words(s), `${st.id} moral: ${s}`).toBeLessThanOrEqual(24);
    }
  });

  it('keeps the newer pages short', () => {
    // the second shelf of books and movies keeps every page to about 25 words, and sentences to about 18
    const newer = STORIES.slice(STORIES.findIndex((s) => s.id === 'sam-and-the-fluffy-ducklings'));
    const fresh = newer.filter((s) => !['rocket-to-the-moon', 'treasure-of-coral-cove', 'biscuit-is-missing', 'the-snow-day-sled-race', 'the-great-talent-show', 'ember-and-the-dark'].includes(s.id));
    expect(fresh.length).toBe(14);
    for (const st of fresh)
      for (const p of st.pages) {
        expect(words(p.text), `${st.id}: ${p.text}`).toBeLessThanOrEqual(30);
        // the reader pauses after every period, so no Mr. or Mrs. here
        expect(p.text, st.id).not.toMatch(/\b(?:Mr|Mrs|Ms|Dr)\./);
        for (const s of sentences(p.text)) expect(words(s), `${st.id}: ${s}`).toBeLessThanOrEqual(18);
      }
  });
});
