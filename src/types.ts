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
  chalk?: Stroke[];
}
