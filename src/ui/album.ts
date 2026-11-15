// The photo album: a scrapbook of the photos taken with the camera button, a big photo viewer
// with Save to Photos, and the shelf of home-made movies from the Story Maker.
import './album.css';
import { sound } from '../engine/audio';
import { deleteMovie, deletePhoto, listMovies, listPhotos, photoFilename, sharePhoto, type MovieRec, type PhotoRec } from '../engine/photos';
import { toast } from '../game';
import { frame } from './activities';
import { confirmBox, el, esc } from './dom';
import { icon } from './icons';
import { PH_ICON, openStoryMaker, playMovie } from './storymaker';

const STICKERS = ['heart', 'star', 'flower', 'crown'];
const TAPES = ['#ffb3d1', '#c9b3ff', '#a8e6cf', '#ffe08a', '#a8d8ff', '#ffc4a8'];
/** A steady little number from an id, so each polaroid keeps its tilt and tape color. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const dateText = (t: number) => {
  try {
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export function openAlbum(profile: string, onClose: () => void): void {
  let closed = false;
  let urls: string[] = [];
  const url = (b: Blob) => {
    const u = URL.createObjectURL(b);
    urls.push(u);
    return u;
  };
  const freeUrls = () => {
    const old = urls;
    urls = [];
    window.setTimeout(() => old.forEach((u) => URL.revokeObjectURL(u)), 400);
  };
  let viewer: HTMLDivElement | null = null;
  const fr = frame('ph-album', 'My Album', () => {
    closed = true;
    viewer?.remove();
    window.removeEventListener('keydown', onKey);
    freeUrls();
    onClose();
  });
  let tab: 'photos' | 'movies' = 'photos';
  let photos: PhotoRec[] = [];
  let movies: MovieRec[] = [];
  const thumbUrl = new Map<string, string>();

  const load = async () => {
    try {
      [photos, movies] = await Promise.all([listPhotos(profile), listMovies(profile)]);
    } catch {
      photos = [];
      movies = [];
    }
    if (closed) return;
    freeUrls();
    thumbUrl.clear();
    for (const p of photos) thumbUrl.set(p.id, url(p.thumb));
    draw();
  };

  const draw = () => {
    const bar = `<div class="ph-bar">
      <div class="ph-tabs"><button class="ph-tab${tab === 'photos' ? ' on' : ''}" data-tab="photos">${PH_ICON.photos}<span>Photos</span><b>${photos.length}</b></button>
      <button class="ph-tab${tab === 'movies' ? ' on' : ''}" data-tab="movies">${PH_ICON.film}<span>Movies</span><b>${movies.length}</b></button></div>
      <button class="btn primary ph-make" data-make>${PH_ICON.film}<span>Make a movie</span></button></div>`;
    let page = '';
    if (tab === 'photos') {
      page = photos.length
        ? `<div class="ph-page">${photos
            .map((p, k) => {
              const h = hash(p.id);
              return `<button class="ph-pol" data-open="${k}" style="--r:${((h % 9) - 4) * 0.9}deg;--tape:${TAPES[h % TAPES.length]};--tr:${((h >> 4) % 13) - 6}deg"><img src="${thumbUrl.get(p.id)}" alt="" loading="lazy"/><span class="ph-cap-line"><b>${esc(p.place)}</b><small>${dateText(p.time)}</small></span>${h % 4 === 1 ? `<i class="ph-sticker" style="--sr:${(h % 30) - 15}deg">${icon(STICKERS[(h >> 3) % STICKERS.length])}</i>` : ''}</button>`;
            })
            .join('')}</div>`
        : `<div class="ph-empty"><div class="ph-empty-art">${icon('camera')}</div><h3>Your album is empty</h3><p>Tap the camera in any room to take a photo!</p></div>`;
    } else {
      page = movies.length
        ? `<div class="ph-movies">${movies
            .map((m, k) => {
              const first = m.scenes.map((s) => thumbUrl.get(s.photoId)).find(Boolean);
              return `<div class="ph-movie"><button class="ph-movie-cover" data-play="${k}" aria-label="Play">${first ? `<img src="${first}" alt=""/>` : `<span class="ph-movie-blank">${PH_ICON.film}</span>`}<i class="ph-movie-play">${PH_ICON.play}</i></button>
                <div class="ph-movie-info"><b>${esc(m.title)}</b><small>${PH_ICON.photos}${m.scenes.length} ${m.scenes.length === 1 ? 'scene' : 'scenes'} · ${dateText(m.time)}</small></div>
                <button class="round-btn ph-del" data-delmovie="${k}" aria-label="Delete">${icon('trash')}</button></div>`;
            })
            .join('')}</div>`
        : `<div class="ph-empty"><div class="ph-empty-art film">${PH_ICON.film}</div><h3>No movies yet</h3><p>${photos.length ? 'Turn your photos into a movie with your own voice!' : 'Take some photos first, then make a movie!'}</p>${photos.length ? `<button class="btn primary ph-make" data-make>${PH_ICON.film}<span>Make a movie</span></button>` : ''}</div>`;
    }
    fr.body.innerHTML = `<div class="ph-book">${bar}${page}</div>`;
  };

  // ----- the big photo viewer -----
  let at = 0;
  let bigUrl = '';
  const showViewer = (k: number, dir = 0) => {
    if (!photos.length) return closeViewer();
    at = (k + photos.length) % photos.length;
    const p = photos[at];
    if (bigUrl) URL.revokeObjectURL(bigUrl);
    bigUrl = URL.createObjectURL(p.blob);
    if (!viewer) {
      viewer = el('div', 'ph-view');
      viewer.innerHTML = `<div class="ph-view-top"><span class="ph-view-count"></span><button class="round-btn" data-vclose aria-label="Close">${icon('close')}</button></div>
        <div class="ph-view-stage"><button class="ph-arrow l" data-prev aria-label="Previous">${icon('back')}</button><div class="ph-view-photo"></div><button class="ph-arrow r" data-nextp aria-label="Next">${PH_ICON.next}</button></div>
        <div class="ph-view-bar"><button class="btn primary ph-share" data-share>${PH_ICON.share}<span>Save to Photos</span></button><button class="btn ph-trash" data-del>${icon('trash')}<span>Delete</span></button></div>`;
      fr.root.appendChild(viewer);
      requestAnimationFrame(() => viewer?.classList.add('show'));
      wireSwipe(viewer.querySelector('.ph-view-stage') as HTMLElement);
    }
    viewer.querySelector('.ph-view-photo')!.innerHTML = `<div class="ph-big ${dir > 0 ? 'from-r' : dir < 0 ? 'from-l' : 'pop'}"><img src="${bigUrl}" alt="" draggable="false"/><span class="ph-cap-line"><b>${esc(p.place)}</b><small>${dateText(p.time)}</small></span></div>`;
    viewer.querySelector('.ph-view-count')!.textContent = `${at + 1} / ${photos.length}`;
    viewer.classList.toggle('single', photos.length < 2);
  };
  const closeViewer = () => {
    if (!viewer) return;
    const v = viewer;
    viewer = null;
    v.classList.remove('show');
    window.setTimeout(() => v.remove(), 250);
    if (bigUrl) {
      const u = bigUrl;
      bigUrl = '';
      window.setTimeout(() => URL.revokeObjectURL(u), 300);
    }
  };
  const step = (d: number) => {
    if (photos.length < 2) return;
    sound.whoosh();
    showViewer(at + d, d);
  };
  const wireSwipe = (stage: HTMLElement) => {
    let sx = 0;
    let sy = 0;
    let id = -1;
    stage.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('button')) return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - sy)) step(dx < 0 ? 1 : -1);
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', () => (id = -1));
  };
  const onKey = (e: KeyboardEvent) => {
    if (!viewer) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Escape') closeViewer();
  };
  window.addEventListener('keydown', onKey);

  fr.root.addEventListener('click', (e) => {
    const t = e.target as Element;
    const q = (s: string) => t.closest(s) as HTMLElement | null;
    if (q('[data-vclose]')) {
      sound.tap();
      return closeViewer();
    }
    if (q('[data-prev]')) return step(-1);
    if (q('[data-nextp]')) return step(1);
    if (q('[data-share]')) {
      const p = photos[at];
      if (!p) return;
      sound.pop();
      // straight from the tap: the iPad share sheet needs it
      void sharePhoto(p.blob, photoFilename(p.place, p.time)).then((r) => {
        if (r === 'saved') toast('Saved!', 'check');
      });
      return;
    }
    if (q('[data-del]')) {
      const p = photos[at];
      if (!p) return;
      sound.tap();
      confirmBox('Delete this photo?', 'It will be gone for good.', `${icon('trash')}<span>Delete</span>`, `<img class="ph-confirm-img" src="${bigUrl}" alt=""/>`, () => {
        void deletePhoto(p.id)
          .then(() => {
            sound.drop();
            photos = photos.filter((x) => x.id !== p.id);
            draw();
            if (photos.length) showViewer(Math.min(at, photos.length - 1));
            else closeViewer();
          })
          .catch(() => toast("Oops, that photo couldn't be deleted.", 'camera'));
      });
      return;
    }
    const open = q('[data-open]');
    if (open) {
      sound.pop();
      return showViewer(Number(open.dataset.open));
    }
    const tb = q('[data-tab]');
    if (tb) {
      const next = tb.dataset.tab as typeof tab;
      if (next !== tab) {
        tab = next;
        sound.tap();
        draw();
      }
      return;
    }
    if (q('[data-make]')) {
      sound.pop();
      openStoryMaker(profile, () => {
        if (closed) return;
        tab = 'movies';
        void load();
      });
      return;
    }
    const pl = q('[data-play]');
    if (pl) {
      const m = movies[Number(pl.dataset.play)];
      if (m) {
        sound.pop();
        playMovie(m.id);
      }
      return;
    }
    const dm = q('[data-delmovie]');
    if (dm) {
      const m = movies[Number(dm.dataset.delmovie)];
      if (!m) return;
      sound.tap();
      confirmBox('Delete this movie?', `"${esc(m.title)}" will be gone for good. Your photos stay.`, `${icon('trash')}<span>Delete</span>`, `<div class="ph-confirm-film">${PH_ICON.film}</div>`, () => {
        void deleteMovie(m.id)
          .then(() => {
            sound.drop();
            movies = movies.filter((x) => x.id !== m.id);
            draw();
          })
          .catch(() => toast("Oops, that movie couldn't be deleted.", 'camera'));
      });
    }
  });

  fr.body.innerHTML = `<div class="ph-wait">${PH_ICON.photos}</div>`;
  void load();
}
