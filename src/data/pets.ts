// Pet adoption and care rules: prices, names, and needs that slowly drift down in real time.
import { PET_KINDS, basePetLook } from '../art/pets';
import type { Needs, Pet, PetLook } from '../types';

const ADOPT_PRICE: Record<string, number> = {
  puppy: 60, kitten: 60, bunny: 50, hamster: 40, duckling: 40, piglet: 50, fox: 70, panda: 80, pony: 100, unicorn: 150,
};

/** Coins to adopt a pet of this kind. The player's first pet is free. */
export function petPrice(kind: string, petsOwned = 0): number {
  if (petsOwned === 0) return 0;
  return ADOPT_PRICE[kind] ?? 60;
}

export const PET_NAMES = [
  'Biscuit', 'Cupcake', 'Muffin', 'Peanut', 'Mochi', 'Bubbles', 'Sprinkles', 'Pudding', 'Waffles', 'Cookie',
  'Marshmallow', 'Pickles', 'Buttons', 'Snowball', 'Coco', 'Honey', 'Pebbles', 'Daisy', 'Clover', 'Poppy',
  'Sunny', 'Twinkle', 'Jellybean', 'Noodle', 'Ziggy', 'Pip', 'Lulu', 'Bean', 'Fluffy', 'Ollie',
  'Teddy', 'Rosie', 'Maple', 'Nugget', 'Sugar', 'Bonbon', 'Pumpkin', 'Star', 'Mango', 'Taffy',
  'Pixie', 'Gizmo', 'Tofu', 'Sparkle', 'Rocket', 'Tinker', 'Kiwi', 'Bluebell', 'Dottie', 'Fudge',
];

export function randomPetName(not?: string): string {
  const pool = PET_NAMES.filter((n) => n !== not);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const fullNeeds = (now = Date.now()): Needs => ({ food: 100, sleep: 100, clean: 100, fun: 100, t: now });

export function newPet(kind: string, name: string, look?: PetLook, now = Date.now()): Pet {
  const k = PET_KINDS.some((p) => p.id === kind) ? kind : PET_KINDS[0].id;
  const lk = look ? { ...look, kind: k, acc: Object.fromEntries(Object.entries(look.acc ?? {}).map(([slot, w]) => [slot, { ...w! }])) } : basePetLook(k);
  return {
    id: 'p' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim().slice(0, 14) || PET_NAMES[0],
    look: lk,
    place: null,
    x: 0,
    y: 0,
    seat: null,
    needs: fullNeeds(now),
  };
}

/** Points lost per minute. Food goes fastest (about 1 every 4 minutes); sleep is slowest. */
export const NEED_DECAY: Record<'food' | 'sleep' | 'clean' | 'fun', number> = { food: 1 / 4, fun: 1 / 5, clean: 1 / 7, sleep: 1 / 8 };
const clamp = (v: number) => Math.max(0, Math.min(100, v));

/**
 * Brings a pet's needs up to `now`: they drift down slowly in real time, and are created full if
 * the pet has none yet. Mutates and returns the pet.
 */
export function tickPetNeeds(pet: Pet, now = Date.now()): Pet {
  const n = pet.needs;
  if (!n || typeof n.t !== 'number' || !Number.isFinite(n.t)) {
    pet.needs = fullNeeds(now);
    return pet;
  }
  const mins = Math.max(0, now - n.t) / 60000;
  for (const k of Object.keys(NEED_DECAY) as (keyof typeof NEED_DECAY)[]) {
    const v = Number.isFinite(n[k]) ? n[k] : 100;
    n[k] = clamp(v - NEED_DECAY[k] * mins);
  }
  n.t = Math.max(n.t, now);
  return pet;
}

/** Fills one need (to 100 by default) and stamps the time. */
export function fillPetNeed(pet: Pet, need: 'food' | 'sleep' | 'clean' | 'fun', to = 100, now = Date.now()): void {
  tickPetNeeds(pet, now);
  pet.needs![need] = clamp(to);
}

export type PetMood = 'happy' | 'hungry' | 'sleepy' | 'dirty' | 'bored';
/** How the pet feels: its lowest need if that is getting low (under 40), otherwise happy. */
export function petMood(pet: Pet): PetMood {
  const n = pet.needs;
  if (!n) return 'happy';
  const list: [PetMood, number][] = [['hungry', n.food], ['sleepy', n.sleep], ['dirty', n.clean], ['bored', n.fun]];
  list.sort((a, b) => a[1] - b[1]);
  return list[0][1] < 40 ? list[0][0] : 'happy';
}

export const MOOD_TEXT: Record<PetMood, string> = {
  happy: 'is super happy!',
  hungry: 'is hungry. Yum time?',
  sleepy: 'is sleepy. Nap time?',
  dirty: 'needs a bath!',
  bored: 'wants to play!',
};
