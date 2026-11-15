// Reading stories aloud with the device's own text-to-speech.
//
// iPads ship dozens of English voices, many of them novelty or old "Eloquence" voices that sound
// robotic (Albert, Zarvox, Fred, Grandpa, Eddy...). We rank what is installed and use the most
// natural one: Premium and Enhanced voices first (Ava, Zoe, Evan...), then the classic Apple,
// Google and Microsoft voices. The player can also pick a voice in Settings. Stories are read a
// sentence at a time, a little slower than normal and with a breath between sentences.

/** Robotic, joke or retro voices: never used for stories. */
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|\bfred\b|junior|ralph|kathy|princess|eddy|\bflo\b|grandma|grandpa|\breed\b|rocko|sandy|shelley|eloquence|espeak/i;
/** Voices that are known to sound warm and natural, best first. */
const FAVORITES = ['ava', 'zoe', 'evan', 'allison', 'samantha', 'susan', 'serena', 'karen', 'moira', 'tessa', 'kate', 'stephanie', 'joelle', 'nicky', 'aria', 'jenny', 'sonia', 'libby', 'natasha', 'tom', 'daniel'];

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

/** Higher is better; below zero means don't use it for stories. */
export function voiceScore(v: VoiceLike): number {
  if (!/^en([-_]|$)/i.test(v.lang)) return -1;
  const id = `${v.name} ${v.voiceURI}`;
  if (NOVELTY.test(id)) return -1;
  let s = 10;
  if (/premium/i.test(id)) s += 60;
  else if (/enhanced|neural|natural/i.test(id)) s += 45;
  else if (/online/i.test(id)) s += 40; // Edge's natural online voices
  else if (/google/i.test(id)) s += 25;
  const fav = FAVORITES.findIndex((n) => new RegExp(`\\b${n}\\b`, 'i').test(v.name));
  if (fav >= 0) s += 30 - fav;
  if (/^en[-_](us|gb|au|ie|ca|nz)/i.test(v.lang)) s += 4;
  if (/compact/i.test(v.voiceURI)) s -= 5;
  return s;
}

/** Usable story voices, best first. */
export function rankVoices<V extends VoiceLike>(all: V[]): V[] {
  return all.filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

/** Splits text into sentences so each can be read with a small pause after it. */
export function sentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]+["'”’)]*|[^.!?…]+$/g) ?? [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

let voices: SpeechSynthesisVoice[] = [];
const refresh = () => {
  voices = rankVoices(window.speechSynthesis?.getVoices() ?? []);
};
if (typeof window !== 'undefined' && window.speechSynthesis) {
  refresh();
  window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

/** The voice to read with: the one picked in Settings if it's still installed, else the best one. */
export function storyVoices(): SpeechSynthesisVoice[] {
  if (!voices.length) refresh();
  return voices;
}
export function chosenVoice(saved?: string): SpeechSynthesisVoice | null {
  const list = storyVoices();
  return list.find((v) => v.voiceURI === saved) ?? list[0] ?? null;
}
/** A short friendly name for Settings, e.g. "Ava (Premium)". */
export const voiceLabel = (v: SpeechSynthesisVoice | null) => (v ? v.name.replace(/\s*\(([^)]*)\)\s*/g, (_, q: string) => (/premium|enhanced|natural/i.test(q) ? ` (${q})` : '')).trim() : 'Device voice');

let run = 0;
/**
 * Reads text aloud calmly, a sentence at a time. onEnd fires once when it's done (or right away
 * if speech isn't available), and never waits forever if the browser forgets to say it finished.
 */
export function speakCalm(text: string, opts: { voice?: string; enabled: boolean; rate?: number; onEnd?: () => void }): void {
  const ss = window.speechSynthesis;
  const my = ++run;
  let done = false;
  const end = () => {
    if (done || my !== run) return;
    done = true;
    opts.onEnd?.();
  };
  if (!ss || !opts.enabled) {
    window.setTimeout(end, Math.max(2500, text.length * 60));
    return;
  }
  ss.cancel();
  const v = chosenVoice(opts.voice);
  const parts = sentences(text);
  let i = 0;
  const next = () => {
    if (my !== run) return;
    if (i >= parts.length) return end();
    const part = parts[i++];
    const u = new SpeechSynthesisUtterance(part);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.rate = opts.rate ?? 0.88;
    u.pitch = 1;
    u.volume = 1;
    let fired = false;
    const after = () => {
      if (fired) return;
      fired = true;
      window.clearTimeout(guard);
      // a calm breath between sentences
      window.setTimeout(next, /[!?]$/.test(part) ? 380 : 300);
    };
    u.onend = after;
    u.onerror = after;
    const guard = window.setTimeout(after, Math.max(3500, part.length * 120));
    ss.speak(u);
  };
  next();
}

export function hushVoice(): void {
  run++;
  window.speechSynthesis?.cancel();
}
