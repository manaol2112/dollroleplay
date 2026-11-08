import { BLUSH_COLORS, EYE_COLORS, HAIR_COLORS, LIP_COLORS, PALETTE, SKIN_TONES } from '../art/color';
import type { Pattern } from '../art/defs';
import { HAIR } from '../art/doll';
import { WEAR_BY_ID, wearFor } from '../art/wear';
import type { Look, Slot, Worn } from '../types';

export const wornOf = (id: string, color?: string, pattern: Pattern = 'none'): Worn => ({ id, color: color ?? WEAR_BY_ID[id]?.color ?? '#ff7eb6', pattern });

export function baseLook(): Look {
  return {
    age: 'kid', skin: SKIN_TONES[1], hair: 'long', hairColor: HAIR_COLORS[1], eyes: 'round', eyeColor: EYE_COLORS[1], mouth: 'smile',
    blush: null, lips: null, shadow: null, freckles: false, sticker: null,
    wear: { top: wornOf('tee'), bottom: wornOf('pleated'), shoes: wornOf('sneakers') },
  };
}

/** The friends the game starts with. */
export function starterLooks(): { name: string; look: Look }[] {
  return [
    {
      name: 'Lily',
      look: {
        ...baseLook(), skin: SKIN_TONES[1], hair: 'pigtails', hairColor: '#5a3825', eyes: 'lashes', eyeColor: '#6b4226', blush: '#ff9db5',
        wear: { top: wornOf('heartTee'), bottom: wornOf('pleated', '#ff7eb6'), shoes: wornOf('maryjanes'), head: wornOf('bow', '#ff4f8b') },
      },
    },
    {
      name: 'Mia',
      look: {
        ...baseLook(), skin: SKIN_TONES[5], hair: 'curly', hairColor: '#2b1d1a', eyes: 'sparkle', eyeColor: '#3b2418', mouth: 'grin', blush: '#ff7a8a',
        wear: { dress: wornOf('party', '#c99bff'), shoes: wornOf('flats', '#c99bff'), head: wornOf('headband', '#ffd36b') },
      },
    },
    {
      name: 'Rosie',
      look: {
        ...baseLook(), skin: SKIN_TONES[2], hair: 'bob', hairColor: '#e86a3a', eyes: 'round', eyeColor: '#3c9a6b', freckles: true,
        wear: { top: wornOf('blouse'), bottom: wornOf('jeans'), shoes: wornOf('sneakers', '#5fd3b5'), face: wornOf('glasses', '#9b6bff') },
      },
    },
    {
      name: 'Mom',
      look: {
        ...baseLook(), age: 'adult', skin: SKIN_TONES[3], hair: 'wavy', hairColor: '#8a5a34', eyes: 'almond', eyeColor: '#6b4226', lips: '#e0245e', blush: '#ff9db5',
        wear: { dress: wornOf('floral', '#7cc8ff', 'flowers'), shoes: wornOf('heels', '#ff4f8b'), neck: wornOf('pearls') },
      },
    },
  ];
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** A random outfit made only from things the player owns. */
export function randomLook(owned: (id: string) => boolean, age = pick(['kid', 'kid', 'teen', 'adult'] as const)): Look {
  const items = (slot: Slot) => wearFor(slot).filter((w) => owned(w.id));
  const take = (slot: Slot, chance = 1): Worn | undefined => {
    const list = items(slot);
    if (!list.length || Math.random() > chance) return undefined;
    const w = pick(list);
    return wornOf(w.id, Math.random() < 0.5 ? w.color : pick(PALETTE), Math.random() < 0.25 ? pick(['dots', 'stripes', 'hearts', 'stars', 'check', 'flowers'] as Pattern[]) : 'none');
  };
  const wear: Look['wear'] = {};
  if (Math.random() < 0.4 && items('dress').length) wear.dress = take('dress');
  else {
    wear.top = take('top');
    wear.bottom = take('bottom');
  }
  wear.shoes = take('shoes');
  wear.outer = take('outer', 0.25);
  wear.head = take('head', 0.5);
  wear.face = take('face', 0.2);
  wear.neck = take('neck', 0.3);
  wear.hand = take('hand', 0.25);
  wear.back = take('back', 0.15);
  for (const k of Object.keys(wear) as Slot[]) if (!wear[k]) delete wear[k];
  const hairs = HAIR.filter((h) => owned('hair:' + h.id));
  return {
    age,
    skin: pick(SKIN_TONES),
    hair: pick(hairs.length ? hairs : HAIR).id,
    hairColor: Math.random() < 0.75 ? pick(HAIR_COLORS.slice(0, 8)) : pick(HAIR_COLORS),
    eyes: pick(['round', 'lashes', 'sparkle', 'almond', 'round']),
    eyeColor: pick(EYE_COLORS),
    mouth: pick(['smile', 'smile', 'grin', 'cat', 'teeth']),
    blush: Math.random() < 0.6 ? pick(BLUSH_COLORS) : null,
    lips: age !== 'kid' && Math.random() < 0.5 ? pick(LIP_COLORS) : null,
    shadow: null,
    freckles: Math.random() < 0.2,
    sticker: null,
    wear,
  };
}
