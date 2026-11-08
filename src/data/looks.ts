import { BLUSH_COLORS, EYE_COLORS, HAIR_COLORS, LIP_COLORS, PALETTE, SKIN_TONES } from '../art/color';
import type { Pattern } from '../art/defs';
import { HAIR } from '../art/doll';
import { WEAR_BY_ID, wearFor } from '../art/wear';
import type { Look, Slot, Worn } from '../types';

export const wornOf = (id: string, color?: string, pattern?: Pattern): Worn => ({ id, color: color ?? WEAR_BY_ID[id]?.color ?? '#ff7eb6', pattern: pattern ?? WEAR_BY_ID[id]?.pattern ?? 'none' });

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
      name: 'Leo',
      look: {
        ...baseLook(), boy: true, skin: SKIN_TONES[4], hair: 'spiky', hairColor: '#2b1d1a', eyes: 'round', eyeColor: '#3b2418', mouth: 'grin',
        wear: { top: wornOf('top-longtee-dino'), bottom: wornOf('jeans', '#4f6fb8'), shoes: wornOf('sneakers', '#4f9dff') },
      },
    },
    {
      name: 'Mom',
      look: {
        ...baseLook(), age: 'adult', skin: SKIN_TONES[3], hair: 'wavy', hairColor: '#8a5a34', eyes: 'almond', eyeColor: '#6b4226', lips: '#e0245e', blush: '#ff9db5',
        wear: { dress: wornOf('floral', '#7cc8ff', 'flowers'), shoes: wornOf('heels', '#ff4f8b'), neck: wornOf('pearls') },
      },
    },
    {
      name: 'Dad',
      look: {
        ...baseLook(), boy: true, age: 'adult', skin: SKIN_TONES[2], hair: 'sidepart', hairColor: '#5a3825', eyes: 'almond', eyeColor: '#3f7fbf', mouth: 'smile',
        wear: { top: wornOf('top-buttonup-star', '#9fd6ff'), bottom: wornOf('jeans', '#3f4f9a'), shoes: wornOf('sneakers', '#4a4a5e') },
      },
    },
  ];
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export const BOY_HAIR = ['short', 'buzz', 'spiky', 'sidepart', 'swoop', 'curlytop', 'mohawk', 'manbun', 'shaggy', 'flattop', 'afro', 'pixie'];
/** Things a random boy outfit skips (anyone can still pick them in the closet). */
const GIRLY = /skirt|tutu|dress|gown|bow|tiara|ribbon|heel|flat|mary|lace|ruffle|purse|princess|ballet|bunny ?ear|cami|puff|peplum|crop|pearl|flower ?crown|lipstick|clutch|bell sleeve|mermaid|fairy|tulle|leggings|tights/i;
export const GIRL_NAMES = ['Ava', 'Zoe', 'Coco', 'Bella', 'Luna', 'Sunny', 'Ruby', 'Daisy', 'Nina', 'Ellie', 'Kiki', 'Pearl', 'Ivy', 'Willow', 'Grandma', 'Auntie'];
export const BOY_NAMES = ['Max', 'Sam', 'Noah', 'Theo', 'Finn', 'Milo', 'Ollie', 'Jake', 'Benny', 'Kai', 'Grandpa', 'Uncle'];

/** A random outfit made only from things the player owns. */
export function randomLook(owned: (id: string) => boolean, age = pick(['kid', 'kid', 'teen', 'adult'] as const), boy = Math.random() < 0.5): Look {
  const items = (slot: Slot) => wearFor(slot).filter((w) => owned(w.id) && !(boy && GIRLY.test(`${w.id} ${w.name} ${w.group ?? ''}`)));
  const take = (slot: Slot, chance = 1): Worn | undefined => {
    const list = items(slot);
    if (!list.length || Math.random() > chance) return undefined;
    const w = pick(list);
    return wornOf(w.id, Math.random() < 0.5 ? w.color : pick(PALETTE), Math.random() < 0.25 ? pick(['dots', 'stripes', 'hearts', 'stars', 'check', 'flowers'] as Pattern[]) : 'none');
  };
  const wear: Look['wear'] = {};
  if (!boy && Math.random() < 0.4 && items('dress').length) wear.dress = take('dress');
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
  const hairs = HAIR.filter((h) => owned('hair:' + h.id) && (boy ? BOY_HAIR.includes(h.id) : !['buzz', 'flattop', 'mohawk', 'manbun'].includes(h.id)));
  return {
    age,
    boy,
    skin: pick(SKIN_TONES),
    hair: pick(hairs.length ? hairs : HAIR).id,
    hairColor: Math.random() < 0.75 ? pick(HAIR_COLORS.slice(0, 8)) : pick(HAIR_COLORS),
    eyes: boy ? pick(['round', 'almond', 'round', 'sparkle']) : pick(['round', 'lashes', 'sparkle', 'almond', 'round']),
    eyeColor: pick(EYE_COLORS),
    mouth: pick(['smile', 'smile', 'grin', 'cat', 'teeth']),
    blush: Math.random() < (boy ? 0.3 : 0.6) ? pick(BLUSH_COLORS) : null,
    lips: !boy && age !== 'kid' && Math.random() < 0.5 ? pick(LIP_COLORS) : null,
    shadow: null,
    freckles: Math.random() < 0.2,
    sticker: null,
    wear,
  };
}
