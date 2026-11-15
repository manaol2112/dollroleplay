import { describe, expect, it } from 'vitest';
import { PET_ACC, PET_EYES, PET_FURS, PET_KINDS, PET_PATTERNS, basePetLook, petBox, petHeadThumb, petHeight, petParts, petThumb, randomPetLook, renderPet } from '../src/art/pets';
import { NEED_DECAY, PET_NAMES, fillPetNeed, newPet, petMood, petPrice, tickPetNeeds } from '../src/data/pets';
import type { PetLook } from '../src/types';

const bad = /NaN|undefined|Infinity|\[object/;
const POSES = ['stand', 'sit', 'sleep', 'held', 'walk'] as const;

describe('pet art', () => {
  it('has enough kinds, colors, patterns, eyes and accessories', () => {
    expect(PET_KINDS.length).toBeGreaterThanOrEqual(8);
    expect(PET_FURS.length).toBeGreaterThanOrEqual(16);
    expect(PET_PATTERNS.length).toBeGreaterThanOrEqual(6);
    expect(PET_EYES.length).toBeGreaterThanOrEqual(4);
    expect(PET_ACC.length).toBeGreaterThanOrEqual(60);
    expect(new Set(PET_ACC.map((a) => a.id)).size).toBe(PET_ACC.length);
    for (const slot of ['head', 'neck', 'body', 'face']) expect(PET_ACC.filter((a) => a.slot === slot).length).toBeGreaterThanOrEqual(8);
    for (const a of PET_ACC) {
      expect(a.price).toBeGreaterThanOrEqual(0);
      expect(a.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('renders every kind in every pose and expression cleanly', () => {
    for (const k of PET_KINDS) {
      for (const pose of POSES) {
        for (const expr of ['normal', 'happy', 'eat', 'sleep', 'sad'] as const) {
          const svg = renderPet(basePetLook(k.id), { pose, expr });
          expect(svg, `${k.id} ${pose} ${expr}`).not.toMatch(bad);
          expect(svg.length).toBeGreaterThan(500);
        }
        expect(renderPet(basePetLook(k.id), { pose, still: true })).not.toMatch(/<animate/);
      }
    }
  });

  it('renders every pattern and eye style', () => {
    for (const k of PET_KINDS) for (const p of PET_PATTERNS) for (const e of PET_EYES) {
      const look: PetLook = { ...basePetLook(k.id), pattern: p.id, eyes: e.id, fur: PET_FURS[(p.id.length + e.id.length) % PET_FURS.length] };
      expect(renderPet(look, { pose: 'stand' }), `${k.id} ${p.id} ${e.id}`).not.toMatch(bad);
    }
  });

  it('fits every accessory on every kind and pose', () => {
    for (const k of PET_KINDS) {
      PET_ACC.forEach((a, i) => {
        const look = basePetLook(k.id);
        look.acc[a.slot] = { id: a.id, color: a.color };
        const pose = POSES[i % POSES.length];
        const svg = renderPet(look, { pose });
        expect(svg, `${k.id} ${a.id} ${pose}`).not.toMatch(bad);
      });
      // a full outfit at once
      const all = basePetLook(k.id);
      all.acc = { head: { id: 'crown', color: '#ff4f8b' }, neck: { id: 'bellcollar', color: '#4f9dff' }, body: { id: 'fairywings', color: '#ff9ec7' }, face: { id: 'heartshades', color: '#ff4f8b' } };
      for (const pose of POSES) expect(renderPet(all, { pose })).not.toMatch(bad);
    }
  });

  it('ignores unknown kinds, patterns and accessories', () => {
    const look: PetLook = { kind: 'dragon?', fur: '#ffffff', fur2: '#000000', pattern: 'zigzag', eyes: 'laser', acc: { head: { id: 'nope', color: '#fff' } } };
    expect(renderPet(look)).not.toMatch(bad);
  });

  it('gives sizes and boxes that make sense', () => {
    for (const k of PET_KINDS) {
      const look = basePetLook(k.id);
      const h = petHeight(look);
      expect(h, k.id).toBeGreaterThanOrEqual(110);
      expect(h, k.id).toBeLessThanOrEqual(260);
      for (const pose of POSES) expect(petBox(look, pose)).not.toMatch(bad);
      expect(petThumb(look, 80)).toMatch(/^<svg[^>]*width="80"/);
      expect(petThumb(look)).not.toMatch(bad);
      expect(petHeadThumb(look, 0.5, 0.5)).not.toMatch(bad);
      const p = petParts(look, 'sit');
      expect(Number.isFinite(p.head.x + p.head.y + p.head.r + p.body.rx)).toBe(true);
    }
  });

  it('makes random looks of the asked kind', () => {
    for (let i = 0; i < 30; i++) {
      const l = randomPetLook('bunny');
      expect(l.kind).toBe('bunny');
      expect(renderPet(l)).not.toMatch(bad);
    }
    expect(PET_KINDS.map((k) => k.id)).toContain(randomPetLook().kind);
  });
});

describe('pet rules', () => {
  it('makes the first pet free and later pets cost coins', () => {
    for (const k of PET_KINDS) {
      expect(petPrice(k.id, 0)).toBe(0);
      expect(petPrice(k.id, 1)).toBeGreaterThan(0);
    }
  });

  it('has plenty of unique names', () => {
    expect(PET_NAMES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PET_NAMES).size).toBe(PET_NAMES.length);
  });

  it('creates pets with full needs and a unique id', () => {
    const a = newPet('kitten', 'Mochi', undefined, 1000);
    const b = newPet('kitten', 'Mochi', undefined, 1000);
    expect(a.id).toMatch(/^p/);
    expect(a.id).not.toBe(b.id);
    expect(a.look.kind).toBe('kitten');
    expect(a.needs).toEqual({ food: 100, sleep: 100, clean: 100, fun: 100, t: 1000 });
    expect(a.place).toBeNull();
    expect(newPet('nope', '  ').look.kind).toBe(PET_KINDS[0].id);
  });

  it('copies the look it is given', () => {
    const look = basePetLook('fox');
    look.acc.head = { id: 'bow', color: '#ff7eb6' };
    const p = newPet('fox', 'Kit', look);
    look.acc.head.color = '#000000';
    expect(p.look.acc.head?.color).toBe('#ff7eb6');
  });

  it('decays needs slowly in real time, food fastest, and clamps', () => {
    const p = newPet('puppy', 'Rex', undefined, 0);
    tickPetNeeds(p, 4 * 60000);
    expect(p.needs!.food).toBeCloseTo(99, 5);
    expect(p.needs!.sleep).toBeGreaterThan(p.needs!.food);
    expect(p.needs!.clean).toBeGreaterThan(p.needs!.fun);
    expect(NEED_DECAY.food).toBeGreaterThan(NEED_DECAY.fun);
    expect(NEED_DECAY.sleep).toBeLessThan(NEED_DECAY.clean);
    tickPetNeeds(p, 1000 * 60000);
    for (const k of ['food', 'sleep', 'clean', 'fun'] as const) {
      expect(p.needs![k]).toBeGreaterThanOrEqual(0);
      expect(p.needs![k]).toBeLessThanOrEqual(100);
    }
    expect(p.needs!.food).toBe(0);
    // time going backwards never raises needs
    const before = { ...p.needs! };
    tickPetNeeds(p, 0);
    expect(p.needs!.food).toBe(before.food);
  });

  it('fills missing needs and fixes broken numbers', () => {
    const p = newPet('bunny', 'Hop');
    delete p.needs;
    tickPetNeeds(p, 5000);
    expect(p.needs).toEqual({ food: 100, sleep: 100, clean: 100, fun: 100, t: 5000 });
    p.needs!.fun = Number.NaN;
    tickPetNeeds(p, 5000);
    expect(p.needs!.fun).toBe(100);
    fillPetNeed(p, 'food', 250, 5000);
    expect(p.needs!.food).toBe(100);
  });

  it('reads the mood from the lowest need', () => {
    const p = newPet('panda', 'Bao', undefined, 0);
    expect(petMood(p)).toBe('happy');
    p.needs = { food: 80, sleep: 30, clean: 50, fun: 90, t: 0 };
    expect(petMood(p)).toBe('sleepy');
    p.needs = { food: 10, sleep: 30, clean: 50, fun: 90, t: 0 };
    expect(petMood(p)).toBe('hungry');
    p.needs = { food: 90, sleep: 90, clean: 5, fun: 90, t: 0 };
    expect(petMood(p)).toBe('dirty');
    p.needs = { food: 90, sleep: 90, clean: 90, fun: 1, t: 0 };
    expect(petMood(p)).toBe('bored');
  });
});
