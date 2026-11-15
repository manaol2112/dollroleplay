import type { Age } from './art/body';
import type { Pattern } from './art/defs';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export type Slot = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'head' | 'face' | 'neck' | 'hand' | 'back';
export const SLOTS: Slot[] = ['top', 'bottom', 'dress', 'outer', 'shoes', 'head', 'face', 'neck', 'hand', 'back'];

export interface Worn {
  id: string;
  color: string;
  pattern: Pattern;
}

export const NAIL_COUNT = 5;
/** A manicure: one polish, design and gem per finger (thumb first). '' means bare. */
export interface Nails {
  shape: 'round' | 'square' | 'oval' | 'almond' | 'coffin';
  c: string[];
  art: string[];
  gem: (string | null)[];
}

export interface Look {
  age: Age;
  /** Boy or girl body and face; any clothes fit either. */
  boy?: boolean;
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  eyeColor: string;
  mouth: string;
  blush: string | null;
  lips: string | null;
  shadow: string | null;
  freckles: boolean;
  sticker: string | null;
  wear: Partial<Record<Slot, Worn>>;
  nails?: Nails;
}

export interface Seat {
  uid: number;
  i: number;
}

/** How a friend (or pet) is feeling, 0 (needs it now) to 100 (all good). t is when it was last updated (ms). */
export interface Needs {
  food: number;
  sleep: number;
  clean: number;
  fun: number;
  t: number;
}

export interface Doll {
  id: string;
  name: string;
  look: Look;
  place: string | null;
  x: number;
  y: number;
  seat: Seat | null;
  needs?: Needs;
}

export type PetSlot = 'head' | 'neck' | 'body' | 'face';
/** A pet's look: what kind of animal, fur colors and markings, eyes, and what it wears. */
export interface PetLook {
  /** e.g. 'puppy', 'kitten', 'bunny' (see PET_KINDS in art/pets). */
  kind: string;
  fur: string;
  /** Second fur color for markings, ears, tail tip... */
  fur2: string;
  /** Markings id (see PET_PATTERNS in art/pets), e.g. 'plain', 'spots', 'patch'. */
  pattern: string;
  eyes: string;
  acc: Partial<Record<PetSlot, { id: string; color: string }>>;
}

export interface Pet {
  id: string;
  name: string;
  look: PetLook;
  place: string | null;
  x: number;
  y: number;
  /** Sitting in a pet bed or on furniture, like a friend's seat. */
  seat: Seat | null;
  needs?: Needs;
}

export interface PlacedItem {
  uid: number;
  def: string;
  x: number;
  y: number;
  flip?: boolean;
  /** Size: 0.8 small, 1 normal, 1.25 big. */
  scale?: number;
  color?: string;
  on?: boolean;
  /** For small items resting on furniture: the furniture they sit on. */
  rest?: number;
}

export interface Stroke {
  c: string;
  w: number;
  pts: number[];
}

export interface SceneState {
  items: PlacedItem[];
  wall?: string;
  floor?: string;
  /** Baseboard and ceiling trim color (the fence in the backyard). */
  trim?: string;
  curtain?: string;
  chalk?: Stroke[];
  /** Night time in this room: dark windows, stars, lamps glowing. */
  night?: boolean;
}
