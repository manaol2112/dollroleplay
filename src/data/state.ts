// The saved game and the rules that change it. Nothing here touches the page, so it can be tested.
import { HAIR_BY_ID } from '../art/doll';
import { FURN_BY_ID } from '../art/furniture';
import { FLOOR_BY_ID, WALL_BY_ID } from '../art/scenes';
import { WEAR_BY_ID } from '../art/wear';
import { SEASONS, type Doll, type SceneState, type Season } from '../types';
import { CHALLENGES, SEASON_CHALLENGES, challengeById, repeatChallenge, type ChallengeDef } from './challenges';
import { starterLooks } from './looks';
import { PLACES } from './places';

export interface GameState {
  v: 1;
  coins: number;
  owned: string[];
  dolls: Doll[];
  scenes: Record<string, SceneState>;
  season: Season;
  stats: Record<string, number>;
  visited: string[];
  seasonsSeen: Season[];
  songsDone: string[];
  ch: { list: string[]; base: Record<string, number>; claimed: string[]; next: number; rep: number };
  daily: string;
  settings: { sound: boolean; music: boolean };
  nextUid: number;
  seenIntro: boolean;
  /** Leo and Dad joined saves made before boys existed. */
  boysAdded: boolean;
  /** School grade for lessons (1-5); unset until chosen. */
  grade?: number;
}

export const START_COINS = 120;
export const DAILY_GIFT = 30;
export const ACTIVE_CHALLENGES = 4;
export const MAX_DOLLS = 12;

export function seasonFor(d: Date): Season {
  const m = d.getMonth();
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'fall' : 'winter';
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function freshScene(s: GameState, placeId: string): SceneState {
  const p = PLACES[placeId];
  return {
    items: p.initial.map((it) => ({ uid: s.nextUid++, def: it.def, x: it.x, y: it.y, flip: it.flip, on: it.on })),
    wall: p.room ? p.wall : undefined,
    floor: p.room ? p.floor : undefined,
    chalk: placeId === 'school' ? [] : undefined,
  };
}

export function newState(now = new Date()): GameState {
  const s: GameState = {
    v: 1, coins: START_COINS, owned: [], dolls: [], scenes: {}, season: seasonFor(now), stats: {}, visited: [], seasonsSeen: [seasonFor(now)], songsDone: [],
    ch: { list: [], base: {}, claimed: [], next: 0, rep: 0 }, daily: '', settings: { sound: true, music: true }, nextUid: 1, seenIntro: false, boysAdded: true,
  };
  // Lily, Mia, Rosie and Mom keep ids d1-d4 from before boys existed; Leo and Dad are d5 and d6.
  const spots: Record<string, [string, number, number, string]> = {
    Lily: ['bedroom', 620, 780, 'd1'], Leo: ['bedroom', 1000, 830, 'd5'], Mia: ['bedroom', 900, 800, 'd2'],
    Rosie: ['living', 560, 820, 'd3'], Mom: ['living', 1040, 830, 'd4'], Dad: ['living', 1180, 850, 'd6'],
  };
  for (const st of starterLooks()) {
    const [place, x, y, id] = spots[st.name];
    s.dolls.push({ id, name: st.name, look: st.look, place, x, y, seat: null });
  }
  for (const id of Object.keys(PLACES)) s.scenes[id] = freshScene(s, id);
  refreshChallenges(s);
  return s;
}

/** Reads a save, repairing anything missing or unknown so an old or damaged save still loads. */
export function parseState(json: string | null): GameState | null {
  if (!json) return null;
  let raw: Partial<GameState>;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
  const base = newState();
  const s: GameState = { ...base, ...raw, ch: { ...base.ch, ...(raw.ch ?? {}) }, settings: { ...base.settings, ...(raw.settings ?? {}) } } as GameState;
  if (typeof s.coins !== 'number' || !isFinite(s.coins)) s.coins = START_COINS;
  if (!Array.isArray(s.owned)) s.owned = [];
  if (!SEASONS.includes(s.season)) s.season = base.season;
  if (!Array.isArray(s.dolls) || !s.dolls.length) s.dolls = base.dolls;
  s.dolls = s.dolls.filter((d) => d && d.look).map((d) => {
    const look = { ...starterLooks()[0].look, ...d.look, wear: { ...(d.look.wear ?? {}) } };
    for (const [slot, w] of Object.entries(look.wear)) if (!w || !WEAR_BY_ID[w.id]) delete look.wear[slot as keyof typeof look.wear];
    if (!HAIR_BY_ID[look.hair]) look.hair = 'long';
    if (look.nails && !(Array.isArray(look.nails.c) && look.nails.c.length === 5)) delete look.nails;
    return { ...d, look, place: d.place && PLACES[d.place] ? d.place : null, seat: d.seat ?? null };
  });
  if (!raw.boysAdded) {
    // Saves from before boys existed: invite Leo and Dad to the living room.
    for (const st of starterLooks().filter((x) => x.look.boy)) {
      if (s.dolls.length >= MAX_DOLLS || s.dolls.some((d) => d.name === st.name)) continue;
      let n = s.dolls.length + 1;
      while (s.dolls.some((d) => d.id === `d${n}`)) n++;
      s.dolls.push({ id: `d${n}`, name: st.name, look: st.look, place: 'living', x: 700 + s.dolls.length * 60, y: 840, seat: null });
    }
    s.boysAdded = true;
  }
  s.scenes = { ...(raw.scenes ?? {}) };
  for (const id of Object.keys(PLACES)) {
    const sc = s.scenes[id];
    if (!sc || !Array.isArray(sc.items)) s.scenes[id] = freshScene(s, id);
    else sc.items = sc.items.filter((it) => FURN_BY_ID[it.def]);
  }
  for (const k of ['visited', 'seasonsSeen', 'songsDone'] as const) if (!Array.isArray(s[k])) (s as unknown as Record<string, unknown>)[k] = [];
  if (!s.stats || typeof s.stats !== 'object') s.stats = {};
  const maxUid = Math.max(0, ...Object.values(s.scenes).flatMap((sc) => sc.items.map((i) => i.uid)));
  s.nextUid = Math.max(s.nextUid || 1, maxUid + 1);
  s.ch.list = (s.ch.list ?? []).filter((id) => challengeById(id));
  refreshChallenges(s);
  return s;
}

// ---------------- shop ----------------
export type ItemKey = string; // wear id, furniture id, hair:<id>, wall:<id>, floor:<id>

export function priceOf(key: ItemKey): number {
  if (key.startsWith('hair:')) return HAIR_BY_ID[key.slice(5)]?.price ?? 0;
  if (key.startsWith('wall:')) return WALL_BY_ID[key.slice(5)]?.price ?? 0;
  if (key.startsWith('floor:')) return FLOOR_BY_ID[key.slice(6)]?.price ?? 0;
  return WEAR_BY_ID[key]?.price ?? FURN_BY_ID[key]?.price ?? 0;
}

export const isOwned = (s: GameState, key: ItemKey) => priceOf(key) === 0 || s.owned.includes(key);

export function buy(s: GameState, key: ItemKey): boolean {
  if (isOwned(s, key)) return true;
  const p = priceOf(key);
  if (s.coins < p) return false;
  s.coins -= p;
  s.owned.push(key);
  bump(s, 'buy');
  return true;
}

// ---------------- stats & challenges ----------------
export function bump(s: GameState, stat: string, n = 1): void {
  s.stats[stat] = (s.stats[stat] ?? 0) + n;
}

export function progressOf(s: GameState, c: ChallengeDef): number {
  const v = c.check ? c.check(s) : (s.stats[c.stat ?? ''] ?? 0) - (s.ch.base[c.id] ?? 0);
  return Math.max(0, Math.min(c.target, v));
}

export const isDone = (s: GameState, c: ChallengeDef) => progressOf(s, c) >= c.target;

export function seasonChallenge(s: GameState): ChallengeDef | null {
  const c = SEASON_CHALLENGES.find((x) => x.season === s.season);
  return c && !s.ch.claimed.includes(c.id) ? c : null;
}

/** Tops the active list back up to four. */
export function refreshChallenges(s: GameState): void {
  const ch = s.ch;
  while (ch.list.length < ACTIVE_CHALLENGES) {
    let def: ChallengeDef | undefined;
    while (ch.next < CHALLENGES.length && !def) {
      const c = CHALLENGES[ch.next++];
      if (!ch.claimed.includes(c.id) && !ch.list.includes(c.id)) def = c;
    }
    if (!def) def = repeatChallenge(ch.rep++);
    ch.list.push(def.id);
    if (def.stat) ch.base[def.id] = s.stats[def.stat] ?? 0;
  }
}

export function activeChallenges(s: GameState): ChallengeDef[] {
  const list = s.ch.list.map((id) => challengeById(id)).filter((c): c is ChallengeDef => !!c);
  const sc = seasonChallenge(s);
  return sc ? [sc, ...list] : list;
}

export const claimableCount = (s: GameState) => activeChallenges(s).filter((c) => isDone(s, c)).length;

export function claim(s: GameState, id: string): number {
  const c = challengeById(id);
  if (!c || !isDone(s, c) || s.ch.claimed.includes(id)) return 0;
  s.ch.claimed.push(id);
  s.ch.list = s.ch.list.filter((x) => x !== id);
  delete s.ch.base[id];
  s.coins += c.reward;
  refreshChallenges(s);
  return c.reward;
}

export const dailyReady = (s: GameState, now = new Date()) => s.daily !== dayKey(now);
export function claimDaily(s: GameState, now = new Date()): number {
  if (!dailyReady(s, now)) return 0;
  s.daily = dayKey(now);
  s.coins += DAILY_GIFT;
  return DAILY_GIFT;
}
