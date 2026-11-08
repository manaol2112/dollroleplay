// Every piece of clothing and every accessory, gathered from the catalog files in ./wear.
import type { Slot } from '../types';
import { FAVORITES, type WearDef } from './wear/base';
import { BACK_MORE } from './wear/back';
import { BOTTOMS_MORE } from './wear/bottoms';
import { COATS_MORE } from './wear/coats';
import { DRESSES_MORE } from './wear/dresses';
import { FACE_MORE } from './wear/face';
import { HAND_MORE } from './wear/hand';
import { HEAD_MORE } from './wear/head';
import { NECK_MORE } from './wear/neck';
import { SHOES_MORE } from './wear/shoes';
import { TOPS_MORE } from './wear/tops';

export type { WearCtx, WearDef } from './wear/base';
export { bowG, flowerG, heartD, sparkleD, starD } from './wear/base';

export const WEAR: WearDef[] = [
  ...FAVORITES, ...TOPS_MORE, ...BOTTOMS_MORE, ...DRESSES_MORE, ...COATS_MORE, ...SHOES_MORE,
  ...HEAD_MORE, ...FACE_MORE, ...NECK_MORE, ...HAND_MORE, ...BACK_MORE,
];

export const WEAR_BY_ID: Record<string, WearDef> = {};
for (const w of WEAR) {
  if (WEAR_BY_ID[w.id]) console.warn(`Duplicate clothing id: ${w.id}`);
  WEAR_BY_ID[w.id] = w;
}

const bySlot = new Map<Slot, WearDef[]>();
export const wearFor = (slot: Slot): WearDef[] => {
  let list = bySlot.get(slot);
  if (!list) bySlot.set(slot, (list = WEAR.filter((w) => w.slot === slot)));
  return list;
};

/** Closet sections for a slot, in catalog order: [section name, items]. */
export function wearGroups(slot: Slot): [string, WearDef[]][] {
  const m = new Map<string, WearDef[]>();
  for (const w of wearFor(slot)) {
    const g = w.group ?? 'More';
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(w);
  }
  return [...m.entries()];
}
