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

// ---------------- instruments ----------------
export type Instrument = 'piano' | 'xylophone' | 'guitar' | 'harp' | 'violin' | 'flute' | 'trumpet' | 'drums';

/** Plucked string (Karplus-Strong): a burst of noise fed through a short, fading delay loop. */
const pluckCache = new Map<string, AudioBuffer>();
function pluckBuffer(c: AudioContext, freq: number, dur: number, bright: number): AudioBuffer {
  const key = `${freq.toFixed(1)}-${dur}-${bright}`;
  const hit = pluckCache.get(key);
  if (hit) return hit;
  const sr = c.sampleRate;
  const len = Math.floor(sr * dur);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx];
    const next = ring[(idx + 1) % period];
    const v = (cur * bright + next * (1 - bright)) * 0.996;
    ring[idx] = v;
    d[i] = cur * 0.6 + prev * 0.4;
    prev = cur;
    idx = (idx + 1) % period;
  }
  if (pluckCache.size > 200) pluckCache.clear();
  pluckCache.set(key, buf);
  return buf;
}

function pluck(midi: number, vol: number, dur: number, bright: number, at = 0): void {
  const c = ac();
  if (!c || !master) return;
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(c, noteFreq(midi), dur, bright);
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(g).connect(master);
  src.start(c.currentTime + at);
}

/** A held, singing note (violin, flute, trumpet) with a soft start, vibrato and filter. */
function voice(midi: number, kind: 'violin' | 'flute' | 'trumpet', vol: number): void {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime;
  const f = noteFreq(midi);
  const dur = kind === 'trumpet' ? 0.75 : 1.1;
  const o = c.createOscillator();
  o.type = kind === 'flute' ? 'sine' : 'sawtooth';
  o.frequency.setValueAtTime(f, t);
  const lfo = c.createOscillator();
  lfo.frequency.value = kind === 'violin' ? 5.5 : 4.5;
  const lfoGain = c.createGain();
  lfoGain.gain.setValueAtTime(0, t);
  lfoGain.gain.linearRampToValueAtTime(f * (kind === 'violin' ? 0.012 : 0.006), t + 0.25);
  lfo.connect(lfoGain).connect(o.frequency);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(kind === 'trumpet' ? f * 2 : f * 4, t);
  if (kind === 'trumpet') filt.frequency.linearRampToValueAtTime(f * 7, t + 0.06);
  filt.Q.value = kind === 'trumpet' ? 4 : 1;
  const g = c.createGain();
  const attack = kind === 'violin' ? 0.12 : kind === 'flute' ? 0.07 : 0.03;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol * 0.85, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(filt).connect(g).connect(master);
  if (kind === 'flute') {
    o.disconnect();
    o.connect(g);
    noise(0.12, 0.05, 0, f * 2);
    tone(f * 2, dur * 0.8, { type: 'sine', vol: vol * 0.18, attack });
  }
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

/** Drum kit pads. */
export const DRUMS = ['kick', 'snare', 'hihat', 'tom1', 'tom2', 'cymbal', 'clap', 'cowbell'] as const;
export type Drum = (typeof DRUMS)[number];
export function drum(d: Drum): void {
  if (!sfxOn) return;
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime;
  const thump = (f0: number, f1: number, dur: number, vol: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  const hiss = (dur: number, vol: number, freq: number, type: BiquadFilterType = 'highpass') => {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const dd = buf.getChannelData(0);
    for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl).connect(g).connect(master!);
    src.start(t);
  };
  switch (d) {
    case 'kick': thump(150, 45, 0.45, 0.9); break;
    case 'snare': thump(220, 120, 0.12, 0.35); hiss(0.22, 0.45, 1500); break;
    case 'hihat': hiss(0.07, 0.3, 7000); break;
    case 'tom1': thump(260, 150, 0.35, 0.6); break;
    case 'tom2': thump(170, 90, 0.45, 0.65); break;
    case 'cymbal': hiss(1.4, 0.25, 5000); hiss(0.6, 0.15, 9000); break;
    case 'clap': for (let i = 0; i < 3; i++) window.setTimeout(() => hiss(0.06, 0.35, 1200, 'bandpass'), i * 12); hiss(0.25, 0.2, 1200, 'bandpass'); break;
    case 'cowbell': tone(560, 0.35, { type: 'square', vol: 0.08 }); tone(845, 0.35, { type: 'square', vol: 0.06 }); break;
  }
}

/** Plays one note on a melodic instrument. */
export function playNote(inst: Instrument, midi: number): void {
  if (!sfxOn) return;
  const f = noteFreq(midi);
  switch (inst) {
    case 'piano': return pianoNote(midi);
    case 'xylophone':
      tone(f * 2, 0.7, { type: 'sine', vol: 0.32, attack: 0.002 });
      tone(f * 8, 0.12, { type: 'sine', vol: 0.06, attack: 0.002 });
      tone(f * 5.4, 0.25, { type: 'sine', vol: 0.05, attack: 0.002 });
      return;
    case 'guitar': return pluck(midi - 12, 0.5, 1.8, 0.5);
    case 'harp': return pluck(midi, 0.42, 2.4, 0.62);
    case 'violin': return voice(midi, 'violin', 0.16);
    case 'flute': return voice(midi + 12, 'flute', 0.22);
    case 'trumpet': return voice(midi, 'trumpet', 0.13);
    case 'drums': return;
  }
}

/** Strums a guitar chord, low string to high, like a thumb sweeping down. */
export const CHORDS: Record<string, number[]> = {
  C: [48, 52, 55, 60, 64], G: [43, 47, 50, 55, 59, 67], Am: [45, 52, 57, 60, 64], F: [41, 48, 53, 57, 60, 65],
  D: [50, 57, 62, 66], Em: [40, 47, 52, 55, 59, 64], A: [45, 52, 57, 61, 64], Dm: [50, 57, 62, 65],
};
export function strum(chord: string, up = false): void {
  if (!sfxOn) return;
  const notes = CHORDS[chord] ?? CHORDS.C;
  const list = up ? [...notes].reverse() : notes;
  list.forEach((m, i) => pluck(m, 0.32, 2.2, 0.5, i * 0.022));
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
