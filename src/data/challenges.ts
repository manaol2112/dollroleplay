// Challenges that pay coins. Four are active at a time, in order; when the list runs out, endless
// repeatable ones take over so there is always something to earn.
import { WEAR_BY_ID } from '../art/wear';
import type { Season } from '../types';
import type { GameState } from './state';

export interface ChallengeDef {
  id: string;
  text: string;
  icon: string;
  reward: number;
  target: number;
  /** Counter it measures, counted from when the challenge appeared. */
  stat?: string;
  /** Or a live measurement of the game. */
  check?: (s: GameState) => number;
  season?: Season;
}

const dressedFor = (season: Season) => (s: GameState) =>
  Math.max(0, ...s.dolls.map((d) => Object.values(d.look.wear).filter((w) => w && WEAR_BY_ID[w.id]?.tags?.includes(season)).length));

export const CHALLENGES: ChallengeDef[] = [
  { id: 'firstDress', text: 'Change an outfit in the closet', icon: 'hanger', reward: 20, target: 1, stat: 'equip' },
  { id: 'firstFurniture', text: 'Put 3 things in your house', icon: 'home', reward: 25, target: 3, stat: 'placeFurniture' },
  { id: 'firstSwing', text: 'Go on the swings at the playground', icon: 'swing', reward: 20, target: 1, stat: 'swing' },
  { id: 'piano10', text: 'Play 10 notes at the Theater', icon: 'note', reward: 25, target: 10, stat: 'pianoNote' },
  { id: 'feed1', text: 'Give a friend a yummy snack', icon: 'cake', reward: 20, target: 1, stat: 'feed' },
  { id: 'makeover1', text: 'Get a makeover at the Salon', icon: 'scissors', reward: 30, target: 1, stat: 'makeover' },
  { id: 'newFriend', text: 'Make a new friend', icon: 'plus', reward: 30, target: 1, stat: 'createDoll' },
  { id: 'quiz5', text: 'Answer 5 questions at School', icon: 'question', reward: 35, target: 5, stat: 'quizCorrect' },
  { id: 'slide3', text: 'Go down the slide 3 times', icon: 'slide', reward: 30, target: 3, stat: 'slide' },
  { id: 'sleep1', text: 'Tuck a friend into bed', icon: 'moon', reward: 20, target: 1, stat: 'sleep' },
  { id: 'buy1', text: 'Buy something new', icon: 'bag', reward: 25, target: 1, stat: 'buy' },
  { id: 'song1', text: 'Perform a song at the Theater', icon: 'star', reward: 50, target: 1, stat: 'songComplete' },
  { id: 'wall1', text: 'Change the wallpaper at home', icon: 'paint', reward: 25, target: 1, stat: 'wallpaper' },
  { id: 'draw1', text: 'Draw on the chalkboard', icon: 'pencil', reward: 20, target: 1, stat: 'draw' },
  { id: 'toggle5', text: 'Switch on 5 lamps, TVs or ovens', icon: 'bulb', reward: 25, target: 5, stat: 'toggle' },
  { id: 'visitAll', text: 'Visit every place in town', icon: 'map', reward: 60, target: 6, check: (s) => s.visited.filter((v) => ['home', 'school', 'playground', 'theater', 'salon', 'boutique'].includes(v)).length },
  { id: 'crowd', text: 'Have 3 friends in one room', icon: 'heart', reward: 40, target: 3, check: (s) => Math.max(0, ...Object.values(groupBy(s.dolls.filter((d) => d.place).map((d) => d.place!)))) },
  { id: 'seasons4', text: 'Try all four seasons', icon: 'leaf', reward: 40, target: 4, stat: undefined, check: (s) => s.seasonsSeen.length },
  { id: 'seesaw1', text: 'Ride the seesaw with a friend', icon: 'swing', reward: 25, target: 1, stat: 'seesaw' },
  { id: 'equip10', text: 'Try on 10 different things', icon: 'hanger', reward: 40, target: 10, stat: 'equip' },
  { id: 'glam', text: 'Wear lipstick and blush together', icon: 'lips', reward: 35, target: 1, check: (s) => (s.dolls.some((d) => d.look.lips && d.look.blush) ? 1 : 0) },
  { id: 'furniture10', text: 'Put 10 things in your house', icon: 'home', reward: 60, target: 10, stat: 'placeFurniture' },
  { id: 'piano50', text: 'Play 50 music notes', icon: 'note', reward: 50, target: 50, stat: 'pianoNote' },
  { id: 'quiz20', text: 'Answer 20 School questions', icon: 'question', reward: 90, target: 20, stat: 'quizCorrect' },
  { id: 'song3', text: 'Perform 3 songs', icon: 'star', reward: 100, target: 3, stat: 'songComplete' },
  { id: 'friends4', text: 'Have 6 friends in your town', icon: 'plus', reward: 80, target: 6, check: (s) => s.dolls.length },
  { id: 'buy5', text: 'Buy 5 new things', icon: 'bag', reward: 80, target: 5, stat: 'buy' },
  { id: 'feed10', text: 'Feed friends 10 snacks', icon: 'cake', reward: 50, target: 10, stat: 'feed' },
  { id: 'allSongs', text: 'Perform every song', icon: 'star', reward: 150, target: 6, check: (s) => s.songsDone.length },
  { id: 'manicure1', text: 'Get a manicure at the Salon', icon: 'makeup', reward: 30, target: 1, stat: 'manicure' },
  { id: 'basket5', text: 'Score 5 baskets at the Playground', icon: 'toy', reward: 40, target: 5, stat: 'basket' },
  { id: 'goal5', text: 'Kick 5 soccer goals', icon: 'star', reward: 40, target: 5, stat: 'goal' },
  { id: 'basket30', text: 'Score 30 baskets', icon: 'toy', reward: 90, target: 30, stat: 'basket' },
  { id: 'goal20', text: 'Kick 20 soccer goals', icon: 'star', reward: 90, target: 20, stat: 'goal' },
];

export const SEASON_CHALLENGES: ChallengeDef[] = [
  { id: 'dress-spring', text: 'Spring style: wear 2 spring things', icon: 'flower', reward: 40, target: 2, season: 'spring', check: dressedFor('spring') },
  { id: 'dress-summer', text: 'Summer fun: wear 2 summer things', icon: 'sun', reward: 40, target: 2, season: 'summer', check: dressedFor('summer') },
  { id: 'dress-fall', text: 'Cozy fall: wear 2 fall things', icon: 'leaf', reward: 40, target: 2, season: 'fall', check: dressedFor('fall') },
  { id: 'dress-winter', text: 'Bundle up: wear 2 winter things', icon: 'snow', reward: 40, target: 2, season: 'winter', check: dressedFor('winter') },
];

const REPEATS: { stat: string; text: (n: number) => string; icon: string; step: number; reward: number }[] = [
  { stat: 'quizCorrect', text: (n) => `Answer ${n} School questions`, icon: 'question', step: 10, reward: 40 },
  { stat: 'pianoNote', text: (n) => `Play ${n} music notes`, icon: 'note', step: 40, reward: 35 },
  { stat: 'songComplete', text: (n) => `Perform ${n} songs`, icon: 'star', step: 2, reward: 50 },
  { stat: 'equip', text: (n) => `Try on ${n} things`, icon: 'hanger', step: 15, reward: 35 },
  { stat: 'feed', text: (n) => `Feed friends ${n} snacks`, icon: 'cake', step: 5, reward: 30 },
  { stat: 'slide', text: (n) => `Go down the slide ${n} times`, icon: 'slide', step: 5, reward: 30 },
  { stat: 'makeover', text: (n) => `Give ${n} makeovers`, icon: 'scissors', step: 3, reward: 35 },
  { stat: 'placeFurniture', text: (n) => `Decorate with ${n} things`, icon: 'home', step: 8, reward: 35 },
  { stat: 'basket', text: (n) => `Score ${n} baskets`, icon: 'toy', step: 10, reward: 35 },
  { stat: 'goal', text: (n) => `Kick ${n} soccer goals`, icon: 'star', step: 8, reward: 35 },
  { stat: 'manicure', text: (n) => `Give ${n} manicures`, icon: 'makeup', step: 3, reward: 35 },
];

/** Builds the nth endless challenge. */
export function repeatChallenge(n: number): ChallengeDef {
  const r = REPEATS[n % REPEATS.length];
  const round = Math.floor(n / REPEATS.length) + 1;
  const target = r.step * Math.min(3, round);
  return { id: `rep-${n}`, text: r.text(target), icon: r.icon, reward: r.reward + Math.min(3, round - 1) * 15, target, stat: r.stat };
}

export function challengeById(id: string): ChallengeDef | undefined {
  if (id.startsWith('rep-')) return repeatChallenge(Number(id.slice(4)));
  return CHALLENGES.find((c) => c.id === id) ?? SEASON_CHALLENGES.find((c) => c.id === id);
}

function groupBy(xs: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const x of xs) m[x] = (m[x] ?? 0) + 1;
  return m;
}
