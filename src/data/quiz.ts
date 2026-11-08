// School lesson questions for 1st to 5th grade. Every question is made fresh from random numbers,
// so lessons never repeat exactly. Some questions come with a picture (a clock, a fraction pie,
// base-ten blocks or a shape to measure).

export type Pic = 'apple' | 'star' | 'heart' | 'flower' | 'cupcake';
export type Grade = 1 | 2 | 3 | 4 | 5;
export const GRADES: Grade[] = [1, 2, 3, 4, 5];
export const GRADE_NAME: Record<Grade, string> = { 1: '1st Grade', 2: '2nd Grade', 3: '3rd Grade', 4: '4th Grade', 5: '5th Grade' };

export type Visual =
  | { type: 'clock'; h: number; m: number }
  | { type: 'pie'; parts: number; filled: number }
  | { type: 'blocks'; hundreds: number; tens: number; ones: number }
  | { type: 'rect'; w: number; h: number; unit: string; show: 'area' | 'perimeter' }
  | { type: 'box'; l: number; w: number; h: number }
  | { type: 'bar'; parts: number; filled: number };

export interface Question {
  kind: string;
  prompt: string;
  pics?: { pic: Pic; n: number }[];
  sequence?: Pic[];
  visual?: Visual;
  options: string[];
  answer: string;
  /** Pictures as answer buttons (pattern questions). */
  picAnswers?: boolean;
}

const PICS: Pic[] = ['apple', 'star', 'heart', 'flower', 'cupcake'];
const PIC_NAME: Record<Pic, string> = { apple: 'apples', star: 'stars', heart: 'hearts', flower: 'flowers', cupcake: 'cupcakes' };
const NAMES = ['Lily', 'Mia', 'Leo', 'Rosie', 'Max', 'Zoe', 'Sam', 'Ava'];
const THINGS = ['stickers', 'cupcakes', 'marbles', 'crayons', 'shells', 'cookies', 'balloons', 'stamps'];

type Rand = () => number;
const int = (lo: number, hi: number, r: Rand) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(a: T[], r: Rand): T => a[Math.floor(r() * a.length)];

export function shuffle<T>(a: T[], rand: Rand = Math.random): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Answer choices around a number: close misses that look believable. */
function numOptions(ans: number, r: Rand, count: number, spread = 3, lo = 0): string[] {
  const set = new Set<number>([ans]);
  const tries = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + spread, ans - spread, ans * 2, Math.round(ans / 2)];
  for (const t of shuffle(tries, r)) {
    if (set.size >= count) break;
    if (t >= lo && t !== ans && Number.isInteger(t)) set.add(t);
  }
  for (let v = ans + 3; set.size < count; v++) set.add(v);
  return shuffle([...set].map(String), r);
}
const fmtDec = (n: number) => String(Math.round(n * 100) / 100);
function decOptions(ans: number, r: Rand, count: number, step: number): string[] {
  const set = new Set<string>([fmtDec(ans)]);
  for (const d of shuffle([step, -step, step * 10, -step * 2, step * 2, 1, -1], r)) {
    if (set.size >= count) break;
    const v = Math.round((ans + d) * 100) / 100;
    if (v >= 0) set.add(fmtDec(v));
  }
  for (let k = 3; set.size < count; k++) set.add(fmtDec(ans + step * k));
  return shuffle([...set], r);
}
const timeStr = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}
const frac = (n: number, d: number) => `${n}/${d}`;
function simplify(n: number, d: number): string {
  const g = gcd(n, d);
  const a = n / g;
  const b = d / g;
  if (b === 1) return String(a);
  if (a > b) return `${Math.floor(a / b)} ${a % b}/${b}`;
  return `${a}/${b}`;
}

type Maker = (r: Rand, choices: number) => Question;

const G1: Maker[] = [
  (r, c) => {
    const pic = pick(PICS, r);
    const n = int(3, 12, r);
    return { kind: 'count', prompt: `How many ${PIC_NAME[pic]}?`, pics: [{ pic, n }], options: numOptions(n, r, c, 2, 1), answer: String(n) };
  },
  (r, c) => {
    const pic = pick(PICS, r);
    const a = int(1, 9, r);
    const b = int(1, 9, r);
    return { kind: 'add', prompt: `${a} + ${b} = ?`, pics: [{ pic, n: a }, { pic, n: b }], options: numOptions(a + b, r, c, 2), answer: String(a + b) };
  },
  (r, c) => {
    const a = int(5, 20, r);
    const b = int(1, Math.min(9, a), r);
    return { kind: 'sub', prompt: `${a} − ${b} = ?`, options: numOptions(a - b, r, c, 2), answer: String(a - b) };
  },
  (r, c) => {
    const a = int(2, 9, r);
    const b = int(1, 9, r);
    const sum = a + b;
    return { kind: 'missing', prompt: `${a} + ? = ${sum}`, options: numOptions(b, r, c, 2), answer: String(b) };
  },
  (r) => {
    const a = int(1, 50, r);
    let b = int(1, 50, r);
    if (b === a) b = a + int(1, 9, r);
    return { kind: 'bigger', prompt: 'Which number is bigger?', options: shuffle([String(a), String(b)], r), answer: String(Math.max(a, b)) };
  },
  (r) => {
    const pic = pick(PICS, r);
    const other = pick(PICS.filter((p) => p !== pic), r);
    const unit: Pic[] = r() < 0.5 ? [pic, other] : [pic, pic, other];
    const seq: Pic[] = [];
    while (seq.length < 6) seq.push(unit[seq.length % unit.length]);
    return { kind: 'pattern', prompt: 'What comes next?', sequence: seq, options: shuffle([pic, other], r), answer: unit[seq.length % unit.length], picAnswers: true };
  },
  (r, c) => {
    const h = int(1, 12, r);
    const opts = new Set([timeStr(h, 0)]);
    while (opts.size < c) opts.add(timeStr(int(1, 12, r), 0));
    return { kind: 'clock', prompt: 'What time is it?', visual: { type: 'clock', h, m: 0 }, options: shuffle([...opts], r), answer: timeStr(h, 0) };
  },
];

const G2: Maker[] = [
  (r, c) => {
    const a = int(12, 79, r);
    const b = int(11, 99 - a, r);
    return { kind: 'add', prompt: `${a} + ${b} = ?`, options: numOptions(a + b, r, c, 10), answer: String(a + b) };
  },
  (r, c) => {
    const a = int(30, 99, r);
    const b = int(11, a - 5, r);
    return { kind: 'sub', prompt: `${a} − ${b} = ?`, options: numOptions(a - b, r, c, 10), answer: String(a - b) };
  },
  (r, c) => {
    const hundreds = int(1, 5, r);
    const tens = int(0, 9, r);
    const ones = int(0, 9, r);
    const v = hundreds * 100 + tens * 10 + ones;
    return { kind: 'place', prompt: 'What number do the blocks show?', visual: { type: 'blocks', hundreds, tens, ones }, options: numOptions(v, r, c, 100), answer: String(v) };
  },
  (r, c) => {
    const step = pick([2, 5, 10], r);
    const start = step * int(1, 8, r);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    return { kind: 'skip', prompt: `Count by ${step}s: ${seq.join(', ')}, ?`, options: numOptions(start + step * 4, r, c, step), answer: String(start + step * 4) };
  },
  (r, c) => {
    const h = int(1, 12, r);
    const m = pick([0, 30, 15, 45], r);
    const ans = timeStr(h, m);
    const opts = new Set([ans, timeStr(h, (m + 30) % 60), timeStr(h === 12 ? 1 : h + 1, m)]);
    while (opts.size < c) opts.add(timeStr(int(1, 12, r), pick([0, 15, 30, 45], r)));
    return { kind: 'clock', prompt: 'What time is it?', visual: { type: 'clock', h, m }, options: shuffle([...opts].slice(0, c), r), answer: ans };
  },
  (r, c) => {
    const n = pick(NAMES, r);
    const t = pick(THINGS, r);
    const a = int(12, 45, r);
    const b = int(5, 30, r);
    return { kind: 'word', prompt: `${n} has ${a} ${t} and gets ${b} more. How many now?`, options: numOptions(a + b, r, c, 10), answer: String(a + b) };
  },
  (r) => {
    const a = int(100, 999, r);
    let b = int(100, 999, r);
    if (a === b) b += 7;
    const sym = a > b ? '>' : '<';
    return { kind: 'compare', prompt: `${a}  ?  ${b}`, options: ['<', '>', '='], answer: sym };
  },
];

const G3: Maker[] = [
  (r, c) => {
    const a = int(2, 10, r);
    const b = int(2, 10, r);
    return { kind: 'mult', prompt: `${a} × ${b} = ?`, options: numOptions(a * b, r, c, a), answer: String(a * b) };
  },
  (r, c) => {
    const b = int(2, 10, r);
    const q = int(2, 10, r);
    return { kind: 'div', prompt: `${b * q} ÷ ${b} = ?`, options: numOptions(q, r, c, 2, 1), answer: String(q) };
  },
  (r, c) => {
    const d = pick([2, 3, 4, 6, 8], r);
    const n = int(1, d - 1, r);
    const ans = frac(n, d);
    const opts = new Set([ans, frac(d - n, d), frac(n, d + 1 + (d % 2))]);
    while (opts.size < c) opts.add(frac(int(1, 7, r), int(2, 8, r)));
    return { kind: 'fraction', prompt: 'What part of the pie is colored?', visual: { type: 'pie', parts: d, filled: n }, options: shuffle([...opts].slice(0, c), r), answer: ans };
  },
  (r, c) => {
    const v = int(11, 989, r);
    const to = v > 100 && r() < 0.5 ? 100 : 10;
    const ans = Math.round(v / to) * to;
    return { kind: 'round', prompt: `Round ${v} to the nearest ${to}.`, options: numOptions(ans, r, c, to), answer: String(ans) };
  },
  (r, c) => {
    const n = pick(NAMES, r);
    const t = pick(THINGS, r);
    const bags = int(3, 9, r);
    const each = int(3, 9, r);
    return { kind: 'word', prompt: `${n} has ${bags} bags with ${each} ${t} in each. How many ${t} in all?`, options: numOptions(bags * each, r, c, each), answer: String(bags * each) };
  },
  (r, c) => {
    const a = int(120, 699, r);
    const b = int(105, 299, r);
    return { kind: 'add', prompt: `${a} + ${b} = ?`, options: numOptions(a + b, r, c, 100), answer: String(a + b) };
  },
  (r, c) => {
    const w = int(2, 9, r);
    const h = int(2, 7, r);
    const per = r() < 0.5;
    const ans = per ? 2 * (w + h) : w * h;
    return { kind: per ? 'perimeter' : 'area', prompt: per ? 'What is the perimeter (all the way around)?' : 'How many squares cover the rectangle (area)?', visual: { type: 'rect', w, h, unit: 'cm', show: per ? 'perimeter' : 'area' }, options: numOptions(ans, r, c, 2, 1), answer: String(ans) };
  },
  (r, c) => {
    const a = int(3, 9, r);
    const b = int(3, 9, r);
    return { kind: 'missing', prompt: `${a} × ? = ${a * b}`, options: numOptions(b, r, c, 2, 1), answer: String(b) };
  },
];

const G4: Maker[] = [
  (r, c) => {
    const a = int(12, 98, r);
    const b = int(3, 9, r);
    return { kind: 'mult', prompt: `${a} × ${b} = ?`, options: numOptions(a * b, r, c, b * 10), answer: String(a * b) };
  },
  (r, c) => {
    const a = int(11, 49, r);
    const b = int(11, 29, r);
    return { kind: 'mult', prompt: `${a} × ${b} = ?`, options: numOptions(a * b, r, c, 10), answer: String(a * b) };
  },
  (r, c) => {
    const b = int(3, 9, r);
    const q = int(12, 99, r);
    return { kind: 'div', prompt: `${b * q} ÷ ${b} = ?`, options: numOptions(q, r, c, 10, 1), answer: String(q) };
  },
  (r, c) => {
    const d = pick([2, 3, 4, 5], r);
    const n = int(1, d - 1, r);
    const k = int(2, 4, r);
    const ans = String(n * k);
    return { kind: 'equiv', prompt: `${n}/${d} = ?/${d * k}`, options: numOptions(n * k, r, c, k, 1), answer: ans };
  },
  (r) => {
    const d1 = pick([3, 4, 5, 6, 8], r);
    const d2 = pick([3, 4, 5, 6, 8].filter((x) => x !== d1), r);
    const n1 = int(1, d1 - 1, r);
    const n2 = int(1, d2 - 1, r);
    const v1 = n1 / d1;
    const v2 = n2 / d2;
    if (v1 === v2) return { kind: 'compare', prompt: `${n1}/${d1}  ?  ${n2}/${d2}`, options: ['<', '>', '='], answer: '=' };
    return { kind: 'compare', prompt: `${n1}/${d1}  ?  ${n2}/${d2}`, options: ['<', '>', '='], answer: v1 > v2 ? '>' : '<' };
  },
  (r, c) => {
    const n = int(1, 99, r);
    const ans = fmtDec(n / 100);
    return { kind: 'decimal', prompt: `Write ${n} hundredths as a decimal.`, options: decOptions(n / 100, r, c, 0.1), answer: ans };
  },
  (r, c) => {
    const v = int(1000, 9999, r);
    const digits = String(v).split('');
    const pos = int(0, 3, r);
    const place = ['thousands', 'hundreds', 'tens', 'ones'][pos];
    const ans = Number(digits[pos]) * [1000, 100, 10, 1][pos];
    return { kind: 'place', prompt: `What is the value of the ${place} digit in ${v.toLocaleString('en-US')}?`, options: numOptions(ans, r, c, ans || 1), answer: String(ans) };
  },
  (r, c) => {
    const n = pick(NAMES, r);
    const t = pick(THINGS, r);
    const total = int(4, 9, r) * int(12, 25, r);
    const groups = [2, 3, 4, 5, 6].find((g) => total % g === 0) ?? 2;
    return { kind: 'word', prompt: `${n} shares ${total} ${t} equally with ${groups} friends. How many does each friend get?`, options: numOptions(total / groups, r, c, 5, 1), answer: String(total / groups) };
  },
];

const G5: Maker[] = [
  (r, c) => {
    const d = pick([4, 5, 6, 8, 10, 12], r);
    const a = int(1, d - 1, r);
    const b = int(1, d - 1, r);
    const ans = simplify(a + b, d);
    const opts = new Set([ans, frac(a + b, d * 2), simplify(a + b + 1, d), frac(a + b, d + d)]);
    while (opts.size < c) opts.add(simplify(int(1, d * 2, r), d));
    return { kind: 'fracadd', prompt: `${a}/${d} + ${b}/${d} = ?`, options: shuffle([...opts].slice(0, c), r), answer: ans };
  },
  (r, c) => {
    const a = int(11, 99, r) / 10;
    const b = int(11, 99, r) / 10;
    return { kind: 'decadd', prompt: `${fmtDec(a)} + ${fmtDec(b)} = ?`, options: decOptions(a + b, r, c, 0.1), answer: fmtDec(a + b) };
  },
  (r, c) => {
    const a = int(2, 9, r) / 10;
    const b = int(2, 9, r);
    return { kind: 'decmult', prompt: `${fmtDec(a)} × ${b} = ?`, options: decOptions(a * b, r, c, 0.1), answer: fmtDec(a * b) };
  },
  (r, c) => {
    const a = int(2, 9, r);
    const b = int(2, 9, r);
    const k = int(2, 9, r);
    const form = int(0, 2, r);
    if (form === 0) return { kind: 'order', prompt: `${a} + ${b} × ${k} = ?`, options: numOptions(a + b * k, r, c, a), answer: String(a + b * k) };
    if (form === 1) return { kind: 'order', prompt: `(${a} + ${b}) × ${k} = ?`, options: numOptions((a + b) * k, r, c, k), answer: String((a + b) * k) };
    return { kind: 'order', prompt: `${a * k} ÷ ${k} + ${b} = ?`, options: numOptions(a + b, r, c, 2), answer: String(a + b) };
  },
  (r, c) => {
    const l = int(2, 6, r);
    const w = int(2, 5, r);
    const h = int(2, 4, r);
    return { kind: 'volume', prompt: 'How many cubes fit in the box (volume)?', visual: { type: 'box', l, w, h }, options: numOptions(l * w * h, r, c, l, 1), answer: String(l * w * h) };
  },
  (r, c) => {
    const a = int(120, 480, r);
    const b = int(12, 39, r);
    return { kind: 'mult', prompt: `${a} × ${b} = ?`, options: numOptions(a * b, r, c, 100), answer: String(a * b) };
  },
  (r, c) => {
    const d = pick([3, 4, 5, 8, 10], r);
    const n = int(1, d - 1, r);
    const whole = d * int(2, 6, r);
    return { kind: 'fracof', prompt: `What is ${n}/${d} of ${whole}?`, options: numOptions((whole / d) * n, r, c, whole / d, 1), answer: String((whole / d) * n) };
  },
  (r, c) => {
    const b = int(12, 25, r);
    const q = int(21, 99, r);
    return { kind: 'div', prompt: `${b * q} ÷ ${b} = ?`, options: numOptions(q, r, c, 10, 1), answer: String(q) };
  },
  (r, c) => {
    const n = int(2, 9, r);
    const p = pick([2, 3], r);
    const ans = n ** p;
    return { kind: 'power', prompt: `${n}${p === 2 ? '²' : '³'} = ?`, options: numOptions(ans, r, c, n, 1), answer: String(ans) };
  },
];

const BY_GRADE: Record<Grade, Maker[]> = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5 };

/** How many answer buttons a grade gets. */
export const choicesFor = (g: Grade) => (g <= 1 ? 3 : 4);

/** Makes a question for a grade. `level` (0-4) still works for older callers and maps to grades 1-3. */
export function makeQuestion(gradeOrLevel: number, rand: Rand = Math.random): Question {
  const g = (Math.max(1, Math.min(5, Math.round(gradeOrLevel))) || 1) as Grade;
  const makers = BY_GRADE[g];
  const q = pick(makers, rand)(rand, choicesFor(g));
  if (!q.options.includes(q.answer)) q.options[0] = q.answer;
  q.options = [...new Set(q.options)];
  return q;
}

/** Coins for a right answer: harder grades pay more. */
export const coinsFor = (g: Grade) => 3 + g * 2;
