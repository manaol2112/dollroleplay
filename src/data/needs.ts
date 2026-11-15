// How friends feel: hungry, sleepy, messy or bored. Needs drain slowly in real time and are
// topped up by playing: food, beds, baths and fun rides. A need shows as a thought bubble every
// 20-40 minutes of play; nothing bad ever happens when one runs out.
import type { Needs } from '../types';

export type NeedKey = 'food' | 'sleep' | 'clean' | 'fun';
export const NEED_KEYS: NeedKey[] = ['food', 'sleep', 'clean', 'fun'];

/** Minutes for one point to drain. */
const DRAIN_MIN: Record<NeedKey, number> = { food: 0.4, sleep: 0.7, clean: 0.6, fun: 0.45 };
/** Time away counts for at most this long (nothing bad ever happens when a need runs out). */
const MAX_AWAY_MS = 3 * 60 * 60 * 1000;
/** Below this a friend shows a thought bubble. */
export const NEED_LOW = 35;

export const fullNeeds = (now: number): Needs => ({ food: 100, sleep: 100, clean: 100, fun: 100, t: now });

/** Drains needs for the time since they were last updated. */
export function tickNeeds(n: Needs | undefined, now: number): Needs {
  if (!n || typeof n.t !== 'number' || !isFinite(n.t)) return fullNeeds(now);
  const dt = Math.max(0, Math.min(MAX_AWAY_MS, now - n.t));
  const out = { ...n, t: now };
  for (const k of NEED_KEYS) {
    const v = typeof n[k] === 'number' && isFinite(n[k]) ? n[k] : 100;
    out[k] = clamp(v - dt / 60000 / DRAIN_MIN[k]);
  }
  return out;
}

export function fill(n: Needs, k: NeedKey, amount: number): Needs {
  return { ...n, [k]: clamp(n[k] + amount) };
}

/** The need to show in a thought bubble, if any (the lowest one under NEED_LOW). */
export function neediest(n: Needs | undefined): NeedKey | null {
  if (!n) return null;
  let best: NeedKey | null = null;
  for (const k of NEED_KEYS) if (n[k] < NEED_LOW && (!best || n[k] < n[best])) best = k;
  return best;
}

export const NEED_TEXT: Record<NeedKey, string> = {
  food: 'is hungry! Drop a snack on them.',
  sleep: 'is sleepy! Tuck them into a bed.',
  clean: 'needs a bath! Try the bathtub or shower.',
  fun: 'is bored! Go somewhere fun together.',
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
