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

export interface Doll {
  id: string;
  name: string;
  look: Look;
  place: string | null;
  x: number;
  y: number;
  seat: Seat | null;
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
}
