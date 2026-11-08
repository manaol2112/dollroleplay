// School lesson questions: counting, adding, taking away, comparing and patterns. Answers are
// shown as big buttons, so no reading beyond numbers is needed for most questions.

export type Pic = 'apple' | 'star' | 'heart' | 'flower' | 'cupcake';
export interface Question {
  kind: 'count' | 'add' | 'sub' | 'bigger' | 'pattern';
  prompt: string;
  pics?: { pic: Pic; n: number }[];
  sequence?: Pic[];
  options: string[];
  answer: string;
}

const PICS: Pic[] = ['apple', 'star', 'heart', 'flower', 'cupcake'];
const PIC_NAME: Record<Pic, string> = { apple: 'apples', star: 'stars', heart: 'hearts', flower: 'flowers', cupcake: 'cupcakes' };

function rnd(n: number, rand: () => number): number {
  return Math.floor(rand() * n);
}

function numberOptions(answer: number, rand: () => number, lo = 0, hi = 20): string[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 3 && guard++ < 50) {
    const v = answer + (rnd(5, rand) - 2) || answer + 3;
    if (v >= lo && v <= hi) set.add(v);
  }
  for (let v = lo; set.size < 3; v++) set.add(v);
  return shuffle([...set].map(String), rand);
}

export function shuffle<T>(a: T[], rand: () => number = Math.random): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = rnd(i + 1, rand);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Makes a question; `level` 0 is easiest. */
export function makeQuestion(level: number, rand: () => number = Math.random): Question {
  const kinds: Question['kind'][] = level < 2 ? ['count', 'add', 'bigger', 'pattern'] : ['count', 'add', 'sub', 'bigger', 'pattern', 'add', 'sub'];
  const kind = kinds[rnd(kinds.length, rand)];
  const pic = PICS[rnd(PICS.length, rand)];
  const max = level < 2 ? 5 : level < 4 ? 8 : 10;
  switch (kind) {
    case 'count': {
      const n = 2 + rnd(max - 1, rand);
      return { kind, prompt: `How many ${PIC_NAME[pic]}?`, pics: [{ pic, n }], options: numberOptions(n, rand, 1, 12), answer: String(n) };
    }
    case 'add': {
      const a = 1 + rnd(max, rand);
      const b = 1 + rnd(max, rand);
      return { kind, prompt: `${a} + ${b} = ?`, pics: [{ pic, n: a }, { pic, n: b }], options: numberOptions(a + b, rand, 1, 20), answer: String(a + b) };
    }
    case 'sub': {
      const a = 3 + rnd(max, rand);
      const b = 1 + rnd(a - 1, rand);
      return { kind, prompt: `${a} - ${b} = ?`, options: numberOptions(a - b, rand, 0, 20), answer: String(a - b) };
    }
    case 'bigger': {
      const a = 1 + rnd(max + 4, rand);
      let b = 1 + rnd(max + 4, rand);
      if (b === a) b = a + 1 + rnd(3, rand);
      return { kind, prompt: 'Which number is bigger?', options: shuffle([String(a), String(b)], rand), answer: String(Math.max(a, b)) };
    }
    case 'pattern': {
      const other = PICS.filter((p) => p !== pic)[rnd(PICS.length - 1, rand)];
      const unit: Pic[] = rand() < 0.5 ? [pic, other] : [pic, pic, other];
      const seq: Pic[] = [];
      while (seq.length < 5) seq.push(unit[seq.length % unit.length]);
      const answer = unit[seq.length % unit.length];
      return { kind, prompt: 'What comes next?', sequence: seq, options: shuffle([pic, other], rand), answer };
    }
  }
}
