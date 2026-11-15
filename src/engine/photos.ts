// The camera: turns the live scene into a JPEG photo, and keeps photos and home-made movies in
// IndexedDB so they survive closing the app. Drawing goes SVG -> <img> -> <canvas> (no
// foreignObject), which Safari allows without tainting the canvas.
import '../ui/album.css';
import { G, toast } from '../game';
import { sound } from './audio';
import { burst } from './particles';

const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

// ---------------- capture ----------------

/** CSS properties that only matter for interaction or motion, never for how a still frame looks. */
const SKIP_PROPS = /^(pointer-events|cursor|touch-action|user-select|-webkit-user-select|-webkit-touch-callout|-webkit-tap-highlight-color|will-change|transition.*|animation.*|content-visibility)$/;
/** Layout properties that would resize the photo itself if copied onto the root <svg>. */
const ROOT_SKIP = /^(position|inset|top|left|right|bottom|width|height|z-index|margin.*|overflow.*|display|transform.*|translate|scale|rotate)$/;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** Every style rule of the page, including the ones inside @media and @supports blocks. */
function styleRules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const r of Array.from(list)) {
      if (r instanceof CSSStyleRule) out.push(r);
      else if ('cssRules' in r && !(r instanceof CSSKeyframesRule)) {
        try {
          walk((r as CSSGroupingRule).cssRules);
        } catch {
          /* unreadable group */
        }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin sheet: nothing of ours */
    }
  }
  return out;
}

/** url("http://host/page#id") -> url(#id), so references still point inside the photo. */
const localUrls = (v: string) => v.replace(/url\(\s*["']?[^"')#]*#([^"')\s]+)["']?\s*\)/g, 'url(#$1)');

const REF_RE = /url\(\s*["']?#([^"')\s]+)["']?\s*\)/g;

/** Ids an element points at through url(#..) paint/clip/filter values or href="#..". */
function refsOf(e: Element, out: Set<string>): void {
  for (const a of Array.from(e.attributes)) {
    const v = a.value;
    if ((a.localName === 'href') && v.startsWith('#')) out.add(v.slice(1));
    else if (v.includes('url(')) for (const m of v.matchAll(REF_RE)) out.add(m[1]);
  }
}

/** A frozen, self-contained copy of the scene: styles inlined, defs copied in, motion stopped where it is. */
function freezeClone(svg: SVGSVGElement, width: number, height: number): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const orig = [svg as Element, ...Array.from(svg.querySelectorAll('*'))];
  const copy = [clone as Element, ...Array.from(clone.querySelectorAll('*'))];
  const index = new Map<Element, number>();
  orig.forEach((e, i) => index.set(e, i));

  // 1. Which CSS properties does the page's stylesheet (or a running animation) set on each element?
  const props = new Map<number, Set<string>>();
  const add = (e: Element, p: string) => {
    const i = index.get(e);
    if (i === undefined || SKIP_PROPS.test(p) || p.startsWith('--')) return;
    if (i === 0 && ROOT_SKIP.test(p)) return;
    let s = props.get(i);
    if (!s) props.set(i, (s = new Set()));
    s.add(p);
  };
  for (const rule of styleRules()) {
    let hits: Element[];
    try {
      hits = Array.from(svg.querySelectorAll(rule.selectorText));
      if (svg.matches(rule.selectorText)) hits.push(svg);
    } catch {
      continue;
    }
    if (!hits.length) continue;
    const names: string[] = [];
    for (let k = 0; k < rule.style.length; k++) names.push(rule.style[k]);
    for (const e of hits) for (const p of names) add(e, p);
  }
  try {
    for (const a of document.getAnimations?.() ?? []) {
      const eff = a.effect as KeyframeEffect | null;
      const t = eff?.target;
      if (!t || !index.has(t)) continue;
      const keys = new Set<string>();
      for (const kf of eff!.getKeyframes()) for (const k of Object.keys(kf)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(k)) keys.add(kebab(k));
      if ('transitionProperty' in a) keys.add(String((a as CSSTransition).transitionProperty));
      for (const k of keys) add(t, k);
      if ([...keys].some((k) => /transform|translate|scale|rotate/.test(k))) {
        add(t, 'transform-origin');
        add(t, 'transform-box');
      }
    }
  } catch {
    /* no Web Animations API: still frames use the resting pose */
  }
  // 2. Write their current (computed, mid-animation) values inline.
  for (const [i, set] of props) {
    const cs = getComputedStyle(orig[i]);
    let css = '';
    for (const p of set) {
      const v = cs.getPropertyValue(p);
      if (v) css += `${p}:${localUrls(v)};`;
    }
    if (!css) continue;
    const c = copy[i];
    const prev = c.getAttribute('style');
    c.setAttribute('style', (prev ? prev.replace(/;?\s*$/, ';') : '') + css);
  }
  // The text font and color are inherited from the page, which the photo doesn't have.
  const rcs = getComputedStyle(svg);
  clone.setAttribute(
    'style',
    `font-family:${rcs.fontFamily};font-weight:${rcs.fontWeight};font-size:${rcs.fontSize};color:${rcs.color};` +
      (clone.getAttribute('style') ?? '').replace(/(^|;)\s*(position|inset|width|height|top|left|right|bottom)\s*:[^;]*/g, ''),
  );

  // 3. Stop CSS motion inside the photo (the computed pose is already inline) and pin SMIL motion
  //    to where it is right now: the photo's clock starts at 0, so shift every begin back.
  const now = (() => {
    try {
      return svg.getCurrentTime();
    } catch {
      return 0;
    }
  })();
  for (const a of Array.from(clone.querySelectorAll('animate, animateTransform, animateMotion, set'))) {
    const b = (a.getAttribute('begin') ?? '0s').split(';')[0].trim();
    const m = /^(-?\d*\.?\d+)(ms|s)?$/.exec(b);
    if (!m) {
      a.remove();
      continue;
    }
    const sec = parseFloat(m[1]) * (m[2] === 'ms' ? 0.001 : 1);
    a.setAttribute('begin', `${(sec - now).toFixed(3)}s`);
  }

  // 4. Copy in every gradient, pattern, clip and filter the drawing points at, following chains
  //    (patterns that use gradients, gradients that inherit from others).
  const have = new Set<string>();
  for (const e of copy) if (e.id) have.add(e.id);
  const defs = document.createElementNS(NS, 'defs');
  const queue = new Set<string>();
  for (const e of copy) refsOf(e, queue);
  const seen = new Set<string>();
  while (queue.size) {
    const id = queue.values().next().value as string;
    queue.delete(id);
    if (seen.has(id) || have.has(id)) continue;
    seen.add(id);
    const src = document.getElementById(id);
    if (!src || svg.contains(src)) continue;
    const c = src.cloneNode(true) as Element;
    defs.appendChild(c);
    have.add(id);
    for (const e of [c, ...Array.from(c.querySelectorAll('*'))]) {
      if (e.id) have.add(e.id);
      refsOf(e, queue);
    }
  }
  const style = document.createElementNS(NS, 'style');
  style.textContent = '*{animation:none!important;transition:none!important}';
  defs.prepend(style);
  clone.insertBefore(defs, clone.firstChild);

  clone.setAttribute('xmlns', NS);
  clone.setAttribute('xmlns:xlink', XLINK);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('class');
  return clone;
}

// ---------------- the Fredoka font, embedded so photo text looks like the game ----------------
let fontCss: Promise<string> | null = null;

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

async function fetchWithTimeout(url: string, ms: number): Promise<Blob> {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = window.setTimeout(() => ctl?.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl?.signal });
    if (!r.ok) throw new Error(String(r.status));
    return await r.blob();
  } finally {
    window.clearTimeout(t);
  }
}

/** @font-face rules for the Latin Fredoka weights, with the font files inlined as data URIs. */
function embeddedFonts(): Promise<string> {
  if (fontCss) return fontCss;
  fontCss = (async () => {
    const faces: { weight: string; url: string }[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const r of Array.from(rules)) {
        if (!(r instanceof CSSFontFaceRule)) continue;
        const fam = r.style.getPropertyValue('font-family');
        if (!/fredoka/i.test(fam)) continue;
        const src = r.style.getPropertyValue('src');
        const range = r.style.getPropertyValue('unicode-range');
        const m = /url\(\s*["']?([^"')]+\.woff2[^"')]*)["']?\s*\)/.exec(src) ?? /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(src);
        if (!m) continue;
        const latin = /-latin-\d/.test(m[1]) || (!/-latin-ext-|-hebrew-/.test(m[1]) && (!range || /U\+0+-0*FF\b/i.test(range)));
        if (!latin) continue;
        faces.push({ weight: r.style.getPropertyValue('font-weight') || '400', url: new URL(m[1], sheet.href ?? document.baseURI).href });
      }
    }
    const parts = await Promise.all(
      faces.map(async (f) => {
        try {
          const data = await blobToDataUrl(await fetchWithTimeout(f.url, 4000));
          return `@font-face{font-family:'Fredoka';font-style:normal;font-weight:${f.weight};src:url(${data}) format('woff2');}`;
        } catch {
          return '';
        }
      }),
    );
    return parts.join('');
  })();
  fontCss.then((css) => {
    if (!css) fontCss = null; // try again next time
  });
  return fontCss;
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image'));
    img.src = src;
  });
}

function canvasBlob(c: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((res, rej) => {
    if (c.toBlob) {
      c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', quality);
      return;
    }
    fetch(c.toDataURL('image/jpeg', quality)).then((r) => r.blob()).then(res, rej);
  });
}

/** The color showing behind the svg (where the drawing leaves gaps), so the photo matches the screen. */
function backdropColor(svg: SVGSVGElement): string {
  for (let e: Element | null = svg; e; e = e.parentElement) {
    const c = getComputedStyle(e).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
  }
  return '#ffd9e8';
}

/** Size of the visible part of an svg (falls back to its viewBox when it isn't on screen). */
function visibleBox(svg: SVGSVGElement): { w: number; h: number } {
  const r = svg.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) return { w: r.width, h: r.height };
  const vb = svg.viewBox?.baseVal;
  return vb && vb.width ? { w: vb.width, h: vb.height } : { w: 1600, h: 900 };
}

/**
 * A JPEG of exactly what the svg shows right now (its current viewBox and on-screen shape).
 * The scene is copied synchronously, so the photo is of the moment you call this.
 */
export async function captureSvg(svg: SVGSVGElement, opts: { width?: number; quality?: number; background?: string } = {}): Promise<Blob> {
  const box = visibleBox(svg);
  const bg = opts.background ?? backdropColor(svg);
  const W = Math.round(opts.width ?? 1200);
  const H = Math.max(1, Math.round((W * box.h) / box.w));
  const clone = freezeClone(svg, W, H);
  const fonts = await embeddedFonts().catch(() => '');
  if (fonts) {
    const st = document.createElementNS(NS, 'style');
    st.textContent = fonts;
    clone.querySelector('defs')!.prepend(st);
  }
  const text = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    let img: HTMLImageElement;
    try {
      img = await loadImage(url);
    } catch {
      img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text));
    }
    try {
      await img.decode?.();
    } catch {
      /* drawn anyway */
    }
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const paint = () => {
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      g.drawImage(img, 0, 0, W, H);
    };
    paint();
    // Safari sometimes paints an svg image before its embedded fonts and patterns are ready: draw once more.
    await wait(fonts ? 120 : 40);
    paint();
    return await canvasBlob(c, opts.quality ?? 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A smaller JPEG copy (for album pages and pickers). */
export async function makeThumb(blob: Blob, width = 320): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const W = Math.min(width, img.naturalWidth || width);
    const H = Math.max(1, Math.round((W * (img.naturalHeight || 1)) / (img.naturalWidth || 1)));
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, W, H);
    return await canvasBlob(c, 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------- storage ----------------
export interface PhotoRec {
  id: string;
  profile: string;
  place: string;
  time: number;
  blob: Blob;
  thumb: Blob;
}
export interface MovieScene {
  photoId: string;
  audio?: Blob;
  audioType?: string;
  /** How long the recording is, in seconds (webm recordings don't say). */
  secs?: number;
  caption?: string;
}
export interface MovieRec {
  id: string;
  profile: string;
  title: string;
  time: number;
  scenes: MovieScene[];
}

export const MAX_PHOTOS = 80;
const DB_NAME = 'dollroleplay-media';

// Blobs are stored as ArrayBuffers: some Safari versions refuse Blobs inside IndexedDB.
interface Bin {
  buf: ArrayBuffer;
  type: string;
}
interface PhotoRow {
  id: string;
  profile: string;
  place: string;
  time: number;
  img: Bin;
  th: Bin;
}
interface MovieRow {
  id: string;
  profile: string;
  title: string;
  time: number;
  scenes: { photoId: string; audio?: Bin; audioType?: string; secs?: number; caption?: string }[];
}

const toBin = async (b: Blob): Promise<Bin> => ({ buf: await b.arrayBuffer(), type: b.type });
const fromBin = (b: Bin): Blob => new Blob([b.buf], { type: b.type });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

let dbP: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (dbP) return dbP;
  dbP = new Promise<IDBDatabase>((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('no-idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' }).createIndex('profile', 'profile');
      if (!d.objectStoreNames.contains('movies')) d.createObjectStore('movies', { keyPath: 'id' }).createIndex('profile', 'profile');
    };
    req.onsuccess = () => {
      const d = req.result;
      d.onversionchange = () => {
        d.close();
        dbP = null;
      };
      d.onclose = () => (dbP = null);
      res(d);
    };
    req.onerror = () => rej(req.error);
    req.onblocked = () => rej(new Error('blocked'));
  });
  dbP.catch(() => (dbP = null));
  return dbP;
}

const reqP = <T,>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

async function tx<T>(store: 'photos' | 'movies', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const d = await db();
  const t = d.transaction(store, mode);
  const done = new Promise<void>((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error ?? new Error('abort'));
  });
  const out = await fn(t.objectStore(store));
  await done;
  return out;
}

/** Friendly words for a storage problem. */
export function storageTrouble(e: unknown, what = 'photo'): void {
  const name = (e as { name?: string })?.name ?? '';
  if (name === 'QuotaExceededError') toast(`The album is full! Delete a few to save a new ${what}.`, 'camera');
  else toast(`Oops, the ${what} couldn't be saved this time.`, 'camera');
}

const byProfile = <R,>(s: IDBObjectStore, profile: string) => reqP(s.index('profile').getAll(IDBKeyRange.only(profile)) as IDBRequest<R[]>);

/** Blobs are made on first use, so listing 80 photos doesn't copy every full-size image. */
function rowToPhoto(r: PhotoRow): PhotoRec {
  let blob: Blob | null = null;
  let thumb: Blob | null = null;
  return {
    id: r.id,
    profile: r.profile,
    place: r.place,
    time: r.time,
    get blob() {
      return (blob ??= fromBin(r.img));
    },
    get thumb() {
      return (thumb ??= fromBin(r.th));
    },
  };
}

export async function savePhoto(profile: string, place: string, blob: Blob): Promise<PhotoRec> {
  const thumb = await makeThumb(blob, 320).catch(() => blob);
  const row: PhotoRow = { id: newId(), profile, place, time: Date.now(), img: await toBin(blob), th: await toBin(thumb) };
  await tx('photos', 'readwrite', (s) => reqP(s.put(row)));
  await trimPhotos(profile).catch(() => undefined);
  return rowToPhoto(row);
}

/** Keeps the newest MAX_PHOTOS; photos used in a movie are kept longest. */
async function trimPhotos(profile: string): Promise<void> {
  const metas = await tx('photos', 'readonly', async (s) => {
    const keys: { id: string; time: number }[] = [];
    await new Promise<void>((res, rej) => {
      const c = s.index('profile').openCursor(IDBKeyRange.only(profile));
      c.onsuccess = () => {
        const cur = c.result;
        if (!cur) return res();
        const v = cur.value as PhotoRow;
        keys.push({ id: v.id, time: v.time });
        cur.continue();
      };
      c.onerror = () => rej(c.error);
    });
    return keys;
  });
  if (metas.length <= MAX_PHOTOS) return;
  const used = new Set((await listMovies(profile).catch(() => [])).flatMap((m) => m.scenes.map((sc) => sc.photoId)));
  const drop = pickTrim(metas, MAX_PHOTOS, used);
  await tx('photos', 'readwrite', (s) => Promise.all(drop.map((id) => reqP(s.delete(id)))));
}

/** Which photo ids to delete to keep `max`: oldest first, but photos in movies only if there's no other way. */
export function pickTrim(photos: { id: string; time: number }[], max: number, used: Set<string> = new Set()): string[] {
  const extra = photos.length - max;
  if (extra <= 0) return [];
  const oldest = [...photos].sort((a, b) => a.time - b.time);
  const free = oldest.filter((p) => !used.has(p.id));
  const kept = oldest.filter((p) => used.has(p.id));
  return [...free, ...kept].slice(0, extra).map((p) => p.id);
}

export async function listPhotos(profile: string): Promise<PhotoRec[]> {
  const rows = await tx('photos', 'readonly', (s) => byProfile<PhotoRow>(s, profile));
  return rows.sort((a, b) => b.time - a.time).map(rowToPhoto);
}

export async function getPhoto(id: string): Promise<PhotoRec | null> {
  const r = await tx('photos', 'readonly', (s) => reqP(s.get(id) as IDBRequest<PhotoRow | undefined>));
  return r ? rowToPhoto(r) : null;
}

export async function deletePhoto(id: string): Promise<void> {
  await tx('photos', 'readwrite', (s) => reqP(s.delete(id)));
}

export async function photoCount(profile: string): Promise<number> {
  return tx('photos', 'readonly', (s) => reqP(s.index('profile').count(IDBKeyRange.only(profile))));
}

export async function saveMovie(m: Omit<MovieRec, 'id' | 'time'> & { id?: string; time?: number }): Promise<MovieRec> {
  const rec: MovieRec = { ...m, id: m.id ?? newId(), time: m.time ?? Date.now() };
  const row: MovieRow = {
    id: rec.id,
    profile: rec.profile,
    title: rec.title,
    time: rec.time,
    scenes: await Promise.all(
      rec.scenes.map(async (sc) => ({ photoId: sc.photoId, caption: sc.caption, secs: sc.secs, audioType: sc.audioType ?? sc.audio?.type, audio: sc.audio ? await toBin(sc.audio) : undefined })),
    ),
  };
  await tx('movies', 'readwrite', (s) => reqP(s.put(row)));
  return rec;
}

const rowToMovie = (r: MovieRow): MovieRec => ({
  id: r.id,
  profile: r.profile,
  title: r.title,
  time: r.time,
  scenes: r.scenes.map((sc) => ({ photoId: sc.photoId, caption: sc.caption, secs: sc.secs, audioType: sc.audioType, audio: sc.audio ? new Blob([sc.audio.buf], { type: sc.audioType || sc.audio.type }) : undefined })),
});

export async function listMovies(profile: string): Promise<MovieRec[]> {
  const rows = await tx('movies', 'readonly', (s) => byProfile<MovieRow>(s, profile));
  return rows.sort((a, b) => b.time - a.time).map(rowToMovie);
}

export async function getMovie(id: string): Promise<MovieRec | null> {
  const r = await tx('movies', 'readonly', (s) => reqP(s.get(id) as IDBRequest<MovieRow | undefined>));
  return r ? rowToMovie(r) : null;
}

export async function deleteMovie(id: string): Promise<void> {
  await tx('movies', 'readwrite', (s) => reqP(s.delete(id)));
}

// ---------------- little pure helpers for the story maker ----------------
/** Recording formats to try, best first. iPad Safari records audio/mp4; Chrome and Firefox record webm/ogg. */
export const AUDIO_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac'];
export function pickAudioType(supported: (t: string) => boolean): string {
  for (const t of AUDIO_TYPES) {
    try {
      if (supported(t)) return t;
    } catch {
      /* keep looking */
    }
  }
  return '';
}

/** Seconds a scene stays on screen: the recording (or the caption read aloud) plus a breath. */
export function sceneSeconds(sc: { secs?: number; audio?: unknown; caption?: string }): number {
  const words = (sc.caption ?? '').trim();
  const said = sc.audio ? (sc.secs ?? 8) : words ? 1.2 + words.length * 0.075 : 0;
  return Math.max(4, Math.min(24, said + 1.6));
}

/** Slow zoom-and-pan for scene i: alternates zooming in and out, drifting a different way each time. */
export function kenBurns(i: number): [string, string] {
  const drift = [[-3, -2], [3, -1.5], [-2.5, 2], [2.5, 2]][i % 4];
  const near = `scale(1.2) translate(${drift[0]}%, ${drift[1]}%)`;
  const far = 'scale(1.03) translate(0%, 0%)';
  return i % 2 === 0 ? [far, near] : [near, far];
}

// ---------------- sharing ----------------
/** iPad: opens the share sheet (Save Image puts it in Photos). Elsewhere: downloads the file. */
export async function sharePhoto(blob: Blob, filename: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const type = blob.type || 'image/jpeg';
  try {
    const file = new File([blob], filename, { type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
      }
    }
  } catch {
    /* no File constructor or share: download instead */
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'saved';
}

export function photoFilename(place: string, time: number): string {
  const d = new Date(time);
  const p = (n: number) => String(n).padStart(2, '0');
  const slug = place.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
  return `doll-${slug}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
}

// ---------------- the camera button ----------------
let snapping = false;

/** Camera button: flash, click, save to the album, and a little polaroid drops into the corner. */
export async function snapScene(svg: SVGSVGElement, profile: string, placeName: string): Promise<void> {
  if (snapping) return;
  snapping = true;
  const flash = document.createElement('div');
  flash.className = 'ph-flash';
  document.body.appendChild(flash);
  sound.click();
  window.setTimeout(() => sound.whoosh(), 60);
  window.setTimeout(() => flash.remove(), 700);
  // Let the flash paint first so the shutter feels instant; the flash isn't part of the scene svg.
  await new Promise<void>((r) => requestAnimationFrame(() => window.setTimeout(r, 0)));
  try {
    const blob = await captureSvg(svg);
    let saved: PhotoRec;
    try {
      saved = await savePhoto(profile, placeName, blob);
    } catch (e) {
      storageTrouble(e);
      return;
    }
    G.bump('photo');
    sound.pick();
    polaroid(saved.thumb, placeName);
  } catch {
    toast('Oops, the camera blinked! Try again.', 'camera');
  } finally {
    window.setTimeout(() => (snapping = false), 500);
  }
}

function polaroid(img: Blob, place: string): void {
  document.querySelector('.ph-drop')?.remove();
  const url = URL.createObjectURL(img);
  const d = document.createElement('div');
  d.className = 'ph-drop';
  d.innerHTML = `<div class="ph-drop-card"><img alt=""/><b></b></div><span class="ph-drop-msg">Saved to your album!</span>`;
  d.querySelector('img')!.src = url;
  d.querySelector('b')!.textContent = place;
  document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add('in'));
  window.setTimeout(() => {
    const r = d.getBoundingClientRect();
    burst('sparkle', r.left + r.width / 2, r.top + 40, 10);
  }, 450);
  window.setTimeout(() => d.classList.add('out'), 2300);
  window.setTimeout(() => {
    d.remove();
    URL.revokeObjectURL(url);
  }, 2900);
}
