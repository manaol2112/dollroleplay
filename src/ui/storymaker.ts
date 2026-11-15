// Story Maker: kids pick photos from their album, tell each scene with their own voice (or a
// caption), name the movie, and watch it in a little cinema with curtains and a slow zoom.
import './album.css';
import { duckMusic, movieScore, sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { getMovie, getPhoto, kenBurns, listPhotos, pickAudioType, saveMovie, sceneSeconds, storageTrouble, type MovieScene, type PhotoRec } from '../engine/photos';
import { G, toast } from '../game';
import { frame, hush, speak } from './activities';
import { el, esc } from './dom';
import { icon } from './icons';

// ---------------- icons drawn just for the album and the story maker ----------------
const S = (inner: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
export const PH_ICON = {
  film: S(
    `<rect x="6" y="24" width="52" height="32" rx="7" fill="#9b6bff"/><rect x="6" y="24" width="52" height="8" fill="#7d4fe0"/>` +
      `<g transform="rotate(-14 8 22)"><rect x="6" y="10" width="52" height="12" rx="4" fill="#4a2546"/><path d="M14 10 L22 22 M28 10 L36 22 M42 10 L50 22" stroke="#fff" stroke-width="5"/></g>` +
      `<path d="M27 37 L27 50 L39 43.5Z" fill="#fff"/>`,
  ),
  mic: S(`<rect x="22" y="6" width="20" height="34" rx="10" fill="#ff6f91"/><rect x="26" y="10" width="5" height="16" rx="2.5" fill="#fff" opacity="0.6"/><path d="M14 30 Q14 48 32 48 Q50 48 50 30" fill="none" stroke="#9b6bff" stroke-width="5" stroke-linecap="round"/><path d="M32 48 L32 56 M22 58 L42 58" stroke="#9b6bff" stroke-width="5" stroke-linecap="round"/>`),
  share: S(`<path d="M20 26 L12 26 Q8 26 8 30 L8 52 Q8 56 12 56 L52 56 Q56 56 56 52 L56 30 Q56 26 52 26 L44 26" fill="none" stroke="#9b6bff" stroke-width="5" stroke-linecap="round"/><path d="M32 40 L32 8 M22 18 L32 8 L42 18" fill="none" stroke="#ff6f9f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  play: S(`<circle cx="32" cy="32" r="27" fill="#5fd3b5"/><path d="M26 19 L26 45 L46 32Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`),
  stop: S(`<circle cx="32" cy="32" r="27" fill="#ff6f91"/><rect x="21" y="21" width="22" height="22" rx="5" fill="#fff"/>`),
  redo: S(`<path d="M50 34 A18 18 0 1 1 42 18" fill="none" stroke="#9b6bff" stroke-width="6" stroke-linecap="round"/><path d="M36 8 L46 18 L34 24" fill="none" stroke="#9b6bff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  photos: S(
    `<g transform="rotate(-10 32 32)"><rect x="8" y="12" width="36" height="40" rx="3" fill="#fff" stroke="#e8d6ee" stroke-width="2"/><rect x="12" y="16" width="28" height="24" rx="2" fill="#bfe8ff"/></g>` +
      `<g transform="rotate(8 32 32)"><rect x="20" y="10" width="36" height="42" rx="3" fill="#fff" stroke="#e8d6ee" stroke-width="2"/><rect x="24" y="14" width="28" height="26" rx="2" fill="#ffd9e8"/><circle cx="44" cy="22" r="4" fill="#ffd36b"/><path d="M24 40 L33 28 L40 35 L45 30 L52 40Z" fill="#5fc47c"/></g>`,
  ),
  next: S(`<circle cx="32" cy="32" r="26" fill="#fff"/><path d="M28 18 L42 32 L28 46" fill="none" stroke="#9b6bff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  words: S(`<path d="M8 14 Q8 8 14 8 L50 8 Q56 8 56 14 L56 38 Q56 44 50 44 L26 44 L14 56 L16 44 L14 44 Q8 44 8 38Z" fill="#ffd36b"/><path d="M18 20 L46 20 M18 30 L38 30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
};

// ---------------- one audio element, unlocked by a tap, plays every recording ----------------
// iPad only lets a sound element start inside a tap. Once one has played in a tap it may play
// again later (after a curtain opens, after a scene ends), so every recording goes through it.
let shared: HTMLAudioElement | null = null;
let silentUrl = '';
function audioEl(): HTMLAudioElement {
  if (!shared) {
    shared = new Audio();
    shared.preload = 'auto';
    shared.setAttribute('playsinline', '');
  }
  return shared;
}
function silence(): string {
  if (silentUrl) return silentUrl;
  const n = 400;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const str = (o: number, s: string) => [...s].forEach((ch, i) => (b[o + i] = ch.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  b.fill(128, 44);
  silentUrl = 'data:audio/wav;base64,' + btoa(String.fromCharCode(...b));
  return silentUrl;
}
/** Call inside a tap before a recording might play later. */
export function primeAudio(): void {
  const a = audioEl();
  if (!a.paused) return;
  try {
    a.src = silence();
    void a.play()?.catch(() => undefined);
  } catch {
    /* nothing to unlock */
  }
}
function playClip(url: string, onEnd: () => void, onFail: () => void): void {
  const a = audioEl();
  a.onended = null;
  a.onerror = null;
  a.pause();
  a.src = url;
  let done = false;
  const fin = (ok: boolean) => {
    if (done) return;
    done = true;
    a.onended = null;
    a.onerror = null;
    (ok ? onEnd : onFail)();
  };
  a.onended = () => fin(true);
  a.onerror = () => fin(false);
  try {
    const p = a.play();
    p?.catch(() => fin(false));
  } catch {
    fin(false);
  }
}
function stopClip(): void {
  if (!shared) return;
  shared.onended = null;
  shared.onerror = null;
  shared.pause();
}

const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

// ---------------- the story maker ----------------
const MAX_SCENES = 8;
const MAX_REC = 20;
const LINES = ['Once upon a time…', "Let's go!", 'Look at this!', 'Hooray!', 'Uh oh!', 'So much fun!', 'Best friends forever!', 'The end!'];
const TITLES = ['My Movie', 'Our Big Day', 'Best Friends', 'The Big Adventure', 'A Happy Day', 'Silly Time'];

interface Draft {
  photo: PhotoRec;
  full: string;
  audio?: Blob;
  audioUrl?: string;
  secs?: number;
  caption: string;
}

export function openStoryMaker(profile: string, onClose: () => void): void {
  let closed = false;
  const urls = new Set<string>();
  const url = (b: Blob) => {
    const u = URL.createObjectURL(b);
    urls.add(u);
    return u;
  };
  const fr = frame('ph-maker', 'Make a Movie', () => {
    closed = true;
    releaseMic();
    stopClip();
    hush();
    duckMusic(false);
    window.setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 400);
    onClose();
  });
  duckMusic(true);
  fr.body.innerHTML = `<div class="ph-wait">${PH_ICON.film}</div>`;

  let photos: PhotoRec[] = [];
  const thumbs = new Map<string, string>();
  let order: string[] = [];
  let drafts: Draft[] = [];
  let at = 0;
  let title = '';
  let mic: 'unknown' | 'ok' | 'no' = canRecord() ? 'unknown' : 'no';
  try {
    void navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((s) => {
        if (s.state === 'denied') mic = 'no';
      })
      .catch(() => undefined);
  } catch {
    /* unknown until we ask */
  }

  const steps = (n: number) =>
    `<div class="ph-steps">${[PH_ICON.photos, PH_ICON.mic, icon('star')].map((ic, i) => `<i class="${i < n ? 'done' : i === n ? 'on' : ''}">${ic}</i>`).join('<b></b>')}</div>`;

  // ----- step 1: pick photos in story order -----
  const pickStep = () => {
    releaseMic();
    stopClip();
    hush();
    fr.setTitle('Make a Movie');
    if (!photos.length) {
      fr.body.innerHTML = `<div class="ph-empty"><div class="ph-empty-art">${icon('camera')}</div><h3>No photos yet!</h3><p>Tap the camera in any room to take a photo. Then come back to make a movie.</p><button class="btn primary" data-done>${icon('check')}<span>OK</span></button></div>`;
      return;
    }
    fr.body.innerHTML = `<div class="ph-maker-wrap">${steps(0)}<p class="ph-tip">Tap photos in story order</p>
      <div class="ph-pick-grid">${photos.map((p) => `<button class="ph-pick" data-pid="${p.id}" aria-label="Photo"><img src="${thumbs.get(p.id)}" alt=""/><i class="ph-num"></i></button>`).join('')}</div>
      <div class="ph-foot"><span class="ph-count"></span><button class="btn primary ph-go" data-next><span>Next</span>${PH_ICON.next}</button></div></div>`;
    syncPicks();
  };
  const syncPicks = () => {
    fr.body.querySelectorAll<HTMLElement>('.ph-pick').forEach((b) => {
      const k = order.indexOf(b.dataset.pid!);
      b.classList.toggle('on', k >= 0);
      b.querySelector('.ph-num')!.textContent = k >= 0 ? String(k + 1) : '';
    });
    const c = fr.body.querySelector('.ph-count');
    if (c) c.innerHTML = order.length ? `${PH_ICON.film}<b>${order.length}</b> of ${MAX_SCENES}` : 'Pick 1 to 8 photos';
    fr.body.querySelector<HTMLButtonElement>('[data-next]')?.toggleAttribute('disabled', !order.length);
  };

  // ----- step 2: tell each scene -----
  const sceneStep = () => {
    stopClip();
    hush();
    const d = drafts[at];
    fr.setTitle(`Scene ${at + 1} of ${drafts.length}`);
    const recArea =
      mic === 'no'
        ? ''
        : `<div class="ph-rec-row">
            <button class="ph-rec" data-rec aria-label="Record"><svg viewBox="0 0 120 120" class="ph-ring"><circle cx="60" cy="60" r="54" class="bg"/><circle cx="60" cy="60" r="54" class="fg"/></svg><span class="ph-rec-dot"></span></button>
            <span class="ph-live">Listening… tap to stop</span>
            <div class="ph-rec-side">${
              d.audio
                ? `<button class="btn ph-listen" data-play>${PH_ICON.play}<span>Listen</span></button><button class="btn ghost" data-redo>${PH_ICON.redo}<span>Again</span></button>`
                : `<p class="ph-say">${PH_ICON.mic}<span>Tap the red button and tell this part!</span></p>`
            }</div>
          </div>`;
    fr.body.innerHTML = `<div class="ph-maker-wrap">${steps(1)}
      <div class="ph-scene">
        <div class="ph-scene-photo"><div class="ph-pol"><img src="${d.full}" alt=""/></div>
          <div class="ph-dots">${drafts.map((x, i) => `<i class="${i === at ? 'now' : x.audio || x.caption ? 'done' : ''}"></i>`).join('')}</div></div>
        <div class="ph-tools">${recArea}
          <div class="ph-cap">${PH_ICON.words}<input class="ph-cap-in" maxlength="60" placeholder="${mic === 'no' ? 'Type words for this scene' : 'Or type words'}" autocomplete="off" spellcheck="false"/></div>
          <div class="ph-chips">${LINES.map((l) => `<button class="chip ph-chip${d.caption === l ? ' on' : ''}" data-line="${esc(l)}">${esc(l)}</button>`).join('')}</div>
        </div>
      </div>
      <div class="ph-foot"><button class="btn" data-back>${icon('back')}<span>Back</span></button><span class="ph-count">${at + 1} / ${drafts.length}</span><button class="btn primary ph-go" data-next><span>Next</span>${PH_ICON.next}</button></div></div>`;
    const input = fr.body.querySelector<HTMLInputElement>('.ph-cap-in')!;
    input.value = d.caption;
    input.addEventListener('input', () => {
      d.caption = input.value.replace(/[<>]/g, '').slice(0, 60);
      fr.body.querySelectorAll('.ph-chip').forEach((c) => c.classList.toggle('on', (c as HTMLElement).dataset.line === d.caption));
    });
    input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
  };

  // ----- step 3: name it -----
  const titleStep = () => {
    releaseMic();
    stopClip();
    hush();
    fr.setTitle('Name your movie');
    if (!title) title = TITLES[0];
    fr.body.innerHTML = `<div class="ph-maker-wrap">${steps(2)}
      <div class="ph-title-step">
        <div class="ph-poster"><div class="ph-poster-pic"><img src="${drafts[0].full}" alt=""/></div><div class="ph-poster-name"></div><div class="ph-poster-stars">${icon('star')}${icon('star')}${icon('star')}</div></div>
        <div class="ph-title-tools">
          <input class="ph-title-in" maxlength="28" autocomplete="off" spellcheck="false" aria-label="Movie name"/>
          <div class="ph-chips">${TITLES.map((t) => `<button class="chip ph-chip" data-title="${esc(t)}">${esc(t)}</button>`).join('')}</div>
          <button class="btn primary ph-save" data-save>${PH_ICON.film}<span>Save &amp; watch</span></button>
        </div>
      </div>
      <div class="ph-foot"><button class="btn" data-back>${icon('back')}<span>Back</span></button><span></span><span></span></div></div>`;
    const input = fr.body.querySelector<HTMLInputElement>('.ph-title-in')!;
    const name = fr.body.querySelector('.ph-poster-name')!;
    const sync = () => {
      name.textContent = title || 'My Movie';
      fr.body.querySelectorAll('[data-title]').forEach((c) => c.classList.toggle('on', (c as HTMLElement).dataset.title === title));
    };
    input.value = title;
    input.addEventListener('input', () => {
      title = input.value.replace(/[<>]/g, '').slice(0, 28);
      sync();
    });
    input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
    sync();
  };

  let saving = false;
  const save = async () => {
    if (saving) return;
    saving = true;
    primeAudio();
    const scenes: MovieScene[] = drafts.map((d) => ({
      photoId: d.photo.id,
      audio: d.audio,
      audioType: d.audio?.type,
      secs: d.audio ? d.secs : undefined,
      caption: d.caption.trim() || undefined,
    }));
    try {
      const m = await saveMovie({ profile, title: title.trim() || 'My Movie', scenes });
      G.bump('makeMovie');
      G.earn(15, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      sound.success();
      if (closed) return;
      fr.close();
      playMovie(m.id);
    } catch (e) {
      storageTrouble(e, 'movie');
      saving = false;
    }
  };

  // ----- the microphone -----
  let stream: MediaStream | null = null;
  let rec: MediaRecorder | null = null;
  let recStart = 0;
  let recRaf = 0;
  let recTimer = 0;
  let asking = false;
  const ring = () => fr.body.querySelector<SVGCircleElement>('.ph-ring .fg');
  const tickRing = () => {
    const p = Math.min(1, (performance.now() - recStart) / (MAX_REC * 1000));
    const c = ring();
    if (c) c.style.strokeDashoffset = String(339.3 * (1 - p));
    if (rec) recRaf = requestAnimationFrame(tickRing);
  };
  const stopRec = () => {
    window.clearTimeout(recTimer);
    cancelAnimationFrame(recRaf);
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        rec = null;
      }
    }
  };
  function releaseMic(): void {
    stopRec();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  const noMic = () => {
    mic = 'no';
    releaseMic();
    if (!closed && drafts.length) {
      sceneStep();
      toast("Let's use words for this movie!", 'heart');
    }
  };
  const toggleRec = async () => {
    if (rec) {
      stopRec();
      return;
    }
    if (asking) return;
    asking = true;
    stopClip();
    hush();
    const d = drafts[at];
    try {
      stream ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      asking = false;
      noMic();
      return;
    }
    asking = false;
    if (closed || drafts[at] !== d) return releaseMic();
    mic = 'ok';
    const type = pickAudioType((t) => !!MediaRecorder.isTypeSupported?.(t));
    let r: MediaRecorder;
    try {
      r = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
    } catch {
      try {
        r = new MediaRecorder(stream);
      } catch {
        noMic();
        return;
      }
    }
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    r.onstop = () => {
      const secs = (performance.now() - recStart) / 1000;
      rec = null;
      fr.root.classList.remove('ph-recording');
      if (chunks.length && secs > 0.6) {
        if (d.audioUrl) {
          URL.revokeObjectURL(d.audioUrl);
          urls.delete(d.audioUrl);
        }
        d.audio = new Blob(chunks, { type: r.mimeType || type || 'audio/mp4' });
        d.audioUrl = url(d.audio);
        d.secs = Math.min(MAX_REC, Math.round(secs * 10) / 10);
        sound.pick();
      }
      if (!closed && drafts[at] === d) sceneStep();
    };
    try {
      r.start();
    } catch {
      noMic();
      return;
    }
    rec = r;
    recStart = performance.now();
    fr.root.classList.add('ph-recording');
    tickRing();
    recTimer = window.setTimeout(stopRec, MAX_REC * 1000);
  };

  // ----- taps -----
  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    const q = (sel: string) => t.closest(sel) as HTMLElement | null;
    if (q('[data-done]')) return fr.close();
    const pk = q('[data-pid]');
    if (pk) {
      const id = pk.dataset.pid!;
      const k = order.indexOf(id);
      if (k >= 0) {
        order.splice(k, 1);
        sound.drop();
      } else if (order.length >= MAX_SCENES) {
        sound.wrong();
        pk.classList.remove('nope');
        void pk.offsetWidth;
        pk.classList.add('nope');
        toast('8 photos is the most!', 'camera');
        return;
      } else {
        order.push(id);
        sound.pop();
        const r = pk.getBoundingClientRect();
        burst('sparkle', r.right - 24, r.top + 24, 6);
      }
      syncPicks();
      return;
    }
    if (q('[data-rec]')) {
      if (!rec) primeAudio();
      void toggleRec();
      return;
    }
    if (rec) return; // finish recording first
    if (q('[data-play]')) {
      const d = drafts[at];
      if (d?.audioUrl) {
        hush();
        const b = q('[data-play]')!;
        b.classList.add('playing');
        playClip(d.audioUrl, () => b.classList.remove('playing'), () => b.classList.remove('playing'));
      }
      return;
    }
    if (q('[data-redo]')) {
      primeAudio();
      void toggleRec();
      return;
    }
    const line = q('[data-line]');
    if (line) {
      const d = drafts[at];
      const v = line.dataset.line!;
      d.caption = d.caption === v ? '' : v;
      sound.tap();
      fr.body.querySelector<HTMLInputElement>('.ph-cap-in')!.value = d.caption;
      fr.body.querySelectorAll('.ph-chip').forEach((c) => c.classList.toggle('on', (c as HTMLElement).dataset.line === d.caption));
      if (d.caption) speak(d.caption, undefined, 0.9);
      return;
    }
    const tt = q('[data-title]');
    if (tt) {
      title = tt.dataset.title!;
      sound.tap();
      const input = fr.body.querySelector<HTMLInputElement>('.ph-title-in')!;
      input.value = title;
      input.dispatchEvent(new Event('input'));
      return;
    }
    if (q('[data-save]')) return void save();
    if (q('[data-next]')) {
      sound.whoosh();
      if (fr.body.querySelector('.ph-pick-grid')) {
        if (!order.length) return;
        const keep = new Map(drafts.map((d) => [d.photo.id, d]));
        drafts = order.map((id) => keep.get(id) ?? { photo: photos.find((p) => p.id === id)!, full: url(photos.find((p) => p.id === id)!.blob), caption: '' });
        at = 0;
        sceneStep();
      } else if (at < drafts.length - 1) {
        at++;
        sceneStep();
      } else titleStep();
      return;
    }
    if (q('[data-back]')) {
      sound.whoosh();
      if (fr.body.querySelector('.ph-title-step')) {
        at = drafts.length - 1;
        sceneStep();
      } else if (at > 0) {
        at--;
        sceneStep();
      } else pickStep();
    }
  });

  listPhotos(profile)
    .then((list) => {
      if (closed) return;
      photos = list;
      for (const p of list) thumbs.set(p.id, url(p.thumb));
      pickStep();
    })
    .catch(() => {
      if (closed) return;
      photos = [];
      pickStep();
    });
}

// ---------------- the movie player ----------------
/** Plays a saved movie full screen: curtains, a slow zoom over each photo, the kid's voice or the caption read aloud, The End. */
export function playMovie(movieId: string, onDone?: () => void): void {
  primeAudio();
  let stopped = false;
  const urls: string[] = [];
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (!stopped) fn();
    }, ms);
    timers.add(id);
  };
  const clearTimers = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
  };
  const fr = frame('cinema ph-player', 'Movie time', () => {
    stopped = true;
    clearTimers();
    hush();
    stopClip();
    movieScore(false);
    duckMusic(false);
    window.setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 400);
    onDone?.();
  });
  duckMusic(true);
  fr.body.innerHTML = `<div class="theater-view ph-theater"><div class="screen-frame"><div class="screen"></div><div class="ph-open-card"></div><div class="subs"></div><div class="curtain l"></div><div class="curtain r"></div></div>
    <div class="movie-bar"><button class="btn" data-leave>${icon('back')}<span>Leave</span></button><button class="round-btn ph-skip" data-skip aria-label="Next scene">${PH_ICON.next}</button></div></div>`;
  const frameEl = fr.body.querySelector('.screen-frame') as HTMLDivElement;
  const screen = fr.body.querySelector('.screen') as HTMLDivElement;
  const subs = fr.body.querySelector('.subs') as HTMLDivElement;
  const card = fr.body.querySelector('.ph-open-card') as HTMLDivElement;

  type Scene = MovieScene & { url: string; aspect: number };
  let scenes: Scene[] = [];
  let title = '';
  let i = -1;
  let advance: (() => void) | null = null;
  const audioUrls = new Map<Scene, string>();

  const showScene = () => {
    clearTimers();
    hush();
    stopClip();
    card.classList.remove('show');
    i++;
    if (i >= scenes.length) return theEnd();
    const sc = scenes[i];
    const secs = sceneSeconds(sc);
    const screenAspect = frameEl.clientWidth / Math.max(1, frameEl.clientHeight);
    const fits = sc.aspect / screenAspect > 0.8 && sc.aspect / screenAspect < 1.25;
    const layer = el('div', `ph-kb${fits ? '' : ' fit'}`, `${fits ? '' : `<img class="ph-kb-blur" src="${sc.url}" alt=""/>`}<img class="ph-kb-img" src="${sc.url}" alt=""/>`);
    screen.appendChild(layer);
    const old = Array.from(screen.children).slice(0, -1);
    later(() => old.forEach((o) => o.remove()), 1200);
    const [from, to] = kenBurns(i);
    try {
      layer.animate([{ transform: from }, { transform: to }], { duration: (secs + 1.5) * 1000, easing: 'ease-in-out', fill: 'forwards' });
    } catch {
      /* stays still */
    }
    subs.textContent = sc.caption ?? '';
    let moved = false;
    const go = (pause: number) => {
      if (moved) return;
      moved = true;
      later(showScene, pause);
    };
    advance = () => go(0);
    const readCaption = () => {
      if (sc.caption) speak(sc.caption, () => go(1100), 0.84);
      else go(2600);
    };
    later(() => {
      const au = audioUrls.get(sc);
      if (au) playClip(au, () => go(900), readCaption);
      else readCaption();
    }, 700);
    // never get stuck if a sound forgets to say it finished
    later(() => go(0), (secs + 6) * 1000);
  };

  const theEnd = () => {
    advance = null;
    subs.textContent = '';
    frameEl.classList.remove('open');
    sound.whoosh();
    const end = el('div', 'credits ph-credits', `<div class="ph-end-stars">${icon('star')}${icon('star')}${icon('star')}</div><h3>The End</h3><p>${esc(title)}</p>
      <div class="ph-end-btns"><button class="btn" data-again>${PH_ICON.redo}<span>Watch again</span></button><button class="btn primary" data-done>${icon('check')}<span>Done</span></button></div>`);
    frameEl.appendChild(end);
    fr.root.classList.add('ph-ended');
    const colors = ['#ff7eb6', '#ffd36b', '#7fe0b0', '#7cc8ff', '#c99bff', '#fff'];
    end.insertAdjacentHTML(
      'afterbegin',
      `<div class="ph-confetti">${Array.from({ length: 36 }, (_, k) => `<i style="left:${(k * 37) % 100}%;background:${colors[k % colors.length]};animation-delay:${0.9 + ((k * 7) % 20) / 10}s;--spin:${(k % 2 ? 1 : -1) * (300 + k * 20)}deg;--dx:${((k * 13) % 9) - 4}vw"></i>`).join('')}</div>`,
    );
    later(() => {
      celebrate();
      sound.applause();
      speak('The end!', undefined, 0.9);
    }, 900);
    later(() => movieScore(false), 5000);
    later(() => fr.close(), 12000);
  };

  const start = () => {
    clearTimers();
    i = -1;
    fr.body.querySelector('.ph-credits')?.remove();
    fr.root.classList.remove('ph-ended');
    screen.innerHTML = '';
    subs.textContent = '';
    card.innerHTML = `<small>${PH_ICON.film}</small><h3>${esc(title)}</h3><div class="ph-open-stars">${icon('star')}${icon('heart')}${icon('star')}</div>`;
    card.classList.add('show');
    movieScore(true);
    later(() => {
      frameEl.classList.add('open');
      sound.whoosh();
    }, 400);
    later(() => speak(title, undefined, 0.84), 1500);
    advance = () => showScene();
    later(showScene, 3600);
  };

  fr.body.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-leave]') || t.closest('[data-done]')) return fr.close();
    if (t.closest('[data-skip]')) {
      sound.tap();
      advance?.();
      return;
    }
    if (t.closest('[data-again]')) {
      primeAudio();
      sound.pop();
      start();
    }
  });

  (async () => {
    const m = await getMovie(movieId).catch(() => null);
    if (stopped) return;
    if (!m) {
      toast("This movie can't be found.", 'camera');
      return fr.close();
    }
    title = m.title;
    fr.setTitle(m.title);
    const list: Scene[] = [];
    for (const sc of m.scenes) {
      const p = await getPhoto(sc.photoId).catch(() => null);
      if (!p) continue;
      const u = URL.createObjectURL(p.blob);
      urls.push(u);
      const img = new Image();
      img.src = u;
      await img.decode?.().catch(() => undefined);
      const s: Scene = { ...sc, url: u, aspect: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.45 };
      if (sc.audio) {
        const au = URL.createObjectURL(sc.audio);
        urls.push(au);
        audioUrls.set(s, au);
      }
      list.push(s);
    }
    if (stopped) return;
    if (!list.length) {
      toast('The photos for this movie were deleted.', 'camera');
      return fr.close();
    }
    scenes = list;
    start();
  })();
}
