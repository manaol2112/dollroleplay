// Every sound is synthesized: no audio files to download. The audio context starts on the first tap.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxOn = true;
let musicOn = true;
let musicTimer: number | null = null;
let duck = 1;

function ac(): AudioContext | null {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

let primed = false;
export function unlockAudio(): void {
  const c = ac();
  if (!c || primed) return;
  // iOS only lets sound start inside a tap; playing a silent sample there unlocks it for good.
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
  primed = true;
}

/** iPad suspends audio when the app is hidden or after a call; the next tap wakes it. */
export function keepAudioAwake(): void {
  const wake = () => {
    if (!ctx) unlockAudio();
    else if (ctx.state !== 'running') void ctx.resume();
  };
  for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) window.addEventListener(ev, wake, { passive: true });
}

export function setSound(on: boolean): void {
  sfxOn = on;
}

export function setMusic(on: boolean): void {
  musicOn = on;
  if (on) startMusic();
  else stopMusic();
}

/** Turns the music down while the piano is open, so notes are easy to hear. */
export function duckMusic(on: boolean): void {
  duck = on ? 0.15 : 1;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(0.16 * duck, ctx.currentTime, 0.2);
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; at?: number; slide?: number; attack?: number; dest?: AudioNode } = {}): void {
  const c = ac();
  if (!c || !master) return;
  const t = (opts.at ?? 0) + c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * opts.slide), t + dur);
  const v = opts.vol ?? 0.25;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + (opts.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(opts.dest ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.2, at = 0, filter = 2000): void {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

const sfx = (fn: () => void) => () => {
  if (sfxOn) fn();
};

export const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const noteFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** A soft piano voice: a few harmonics with a quick decay. */
export function pianoNote(midi: number, vol = 0.3): void {
  if (!sfxOn) return;
  const f = noteFreq(midi);
  tone(f, 1.6, { type: 'triangle', vol: vol, attack: 0.005 });
  tone(f * 2, 0.9, { type: 'sine', vol: vol * 0.35, attack: 0.005 });
  tone(f * 3, 0.4, { type: 'sine', vol: vol * 0.12, attack: 0.005 });
}

export const sound = {
  tap: sfx(() => tone(880, 0.08, { type: 'sine', vol: 0.12, slide: 1.4 })),
  pop: sfx(() => tone(520, 0.12, { type: 'sine', vol: 0.22, slide: 2.2 })),
  pick: sfx(() => tone(420, 0.12, { type: 'triangle', vol: 0.16, slide: 1.8 })),
  drop: sfx(() => tone(300, 0.14, { type: 'sine', vol: 0.2, slide: 0.5 })),
  thud: sfx(() => {
    tone(140, 0.15, { type: 'sine', vol: 0.3, slide: 0.6 });
    noise(0.08, 0.08, 0, 600);
  }),
  whoosh: sfx(() => noise(0.5, 0.25, 0, 1200)),
  boing: sfx(() => tone(220, 0.35, { type: 'sine', vol: 0.25, slide: 2.5 })),
  squeak: sfx(() => {
    tone(1200, 0.08, { type: 'square', vol: 0.05, slide: 1.5 });
    tone(1500, 0.1, { type: 'square', vol: 0.05, slide: 0.8, at: 0.09 });
  }),
  ding: sfx(() => {
    tone(1568, 0.6, { type: 'sine', vol: 0.2 });
    tone(2093, 0.5, { type: 'sine', vol: 0.12, at: 0.08 });
  }),
  coin: sfx(() => {
    tone(988, 0.1, { type: 'square', vol: 0.08 });
    tone(1319, 0.3, { type: 'square', vol: 0.08, at: 0.08 });
  }),
  sparkle: sfx(() => [0, 1, 2, 3, 4].forEach((i) => tone(1200 + i * 260, 0.25, { type: 'sine', vol: 0.08, at: i * 0.05 }))),
  success: sfx(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.18, at: i * 0.1 }))),
  giggle: sfx(() => {
    const base = 600 + Math.random() * 300;
    for (let i = 0; i < 4; i++) tone(base * (1 + (i % 2) * 0.25), 0.09, { type: 'sine', vol: 0.12, at: i * 0.09, slide: 1.3 });
  }),
  yum: sfx(() => {
    tone(400, 0.12, { type: 'sine', vol: 0.2, slide: 1.5 });
    tone(500, 0.18, { type: 'sine', vol: 0.2, slide: 1.6, at: 0.15 });
  }),
  click: sfx(() => tone(1400, 0.04, { type: 'square', vol: 0.05 })),
  wrong: sfx(() => tone(300, 0.25, { type: 'triangle', vol: 0.15, slide: 0.7 })),
  applause: sfx(() => {
    for (let i = 0; i < 40; i++) noise(0.05, 0.12, Math.random() * 1.6, 2500 + Math.random() * 2000);
  }),
  snore: sfx(() => noise(0.8, 0.1, 0, 300)),
  spray: sfx(() => noise(0.35, 0.18, 0, 5000)),
  tune: sfx(() => [72, 76, 79, 84, 79, 84].forEach((m, i) => tone(noteFreq(m), 0.3, { type: 'triangle', vol: 0.12, at: i * 0.14 }))),
};

// ---------------- background music: a little music-box loop ----------------
const PROG = [
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 65], // G7
];
const MELODY = [76, 79, 81, 79, 76, 74, 72, 74, 72, 69, 72, 76, 74, 72, 71, 74];

export function startMusic(): void {
  if (!musicOn || musicTimer !== null) return;
  const c = ac();
  if (!c) return;
  let step = 0;
  const beat = 0.34;
  let next = c.currentTime + 0.1;
  const tick = () => {
    if (!ctx || !musicGain) return;
    while (next < ctx.currentTime + 0.6) {
      const bar = Math.floor(step / 8) % 4;
      const ch = PROG[bar];
      const at = next - ctx.currentTime;
      // arpeggio
      const n = ch[step % 4] + (step % 8 >= 4 ? 12 : 0);
      tone(noteFreq(n + 12), 0.5, { type: 'sine', vol: 0.12, at, dest: musicGain });
      if (step % 8 === 0) tone(noteFreq(ch[0] - 12), beat * 7, { type: 'triangle', vol: 0.12, at, attack: 0.05, dest: musicGain });
      if (step % 2 === 0) {
        const m = MELODY[(step / 2) % MELODY.length];
        if ((step / 2) % 4 !== 3) tone(noteFreq(m + 12), 0.9, { type: 'sine', vol: 0.1, at, dest: musicGain });
      }
      step++;
      next += beat;
    }
  };
  musicTimer = window.setInterval(tick, 150);
  tick();
}

export function stopMusic(): void {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
}
