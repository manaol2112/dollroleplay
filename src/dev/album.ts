// Dev-only page for the camera, album and story maker: /album-dev.html?p=bedroom
// Buttons: take a photo of the scene, open the album, make a movie, or show the raw capture.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { PLACES } from '../data/places';
import { keepAudioAwake } from '../engine/audio';
import { initParticles } from '../engine/particles';
import { G } from '../game';
import { captureSvg, listMovies, listPhotos, savePhoto, snapScene } from '../engine/photos';
import { SceneView } from '../engine/scene';
import { openAlbum } from '../ui/album';
import { icon } from '../ui/icons';
import { openStoryMaker, playMovie } from '../ui/storymaker';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
keepAudioAwake();
const qs = new URLSearchParams(location.search);
const placeId = qs.get('p') ?? 'bedroom';
const profile = qs.get('who') ?? 'dev';
const place = PLACES[placeId] ?? PLACES.bedroom;
const stage = document.getElementById('stage')!;
const scene = new SceneView(place, { openCloset() {}, trayRect: () => null, onDragState() {} });
stage.appendChild(scene.root);
requestAnimationFrame(() => scene.layout());

const bar = document.createElement('div');
bar.className = 'actions';
bar.innerHTML = `<button class="act-btn" data-a="snap">${icon('camera')}<span>Photo</span></button>
  <button class="act-btn" data-a="album">${icon('star')}<span>Album</span></button>
  <button class="act-btn" data-a="movie">${icon('curtain')}<span>Movie</span></button>
  <button class="act-btn" data-a="raw">${icon('flip')}<span>Raw</span></button>`;
stage.appendChild(bar);
bar.addEventListener('click', async (e) => {
  const a = (e.target as Element).closest<HTMLElement>('[data-a]')?.dataset.a;
  if (a === 'snap') void snapScene(scene.svg, profile, place.name);
  if (a === 'album') openAlbum(profile, () => undefined);
  if (a === 'movie') openStoryMaker(profile, () => undefined);
  if (a === 'raw') {
    const b = await captureSvg(scene.svg);
    const img = document.createElement('img');
    img.src = URL.createObjectURL(b);
    img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:contain;z-index:200;background:#333';
    img.onclick = () => img.remove();
    document.body.appendChild(img);
  }
});

// hooks for automated checks
Object.assign(window as unknown as Record<string, unknown>, {
  __ph: { G, scene, captureSvg, savePhoto, listPhotos, listMovies, snapScene, openAlbum, openStoryMaker, playMovie, profile, place },
});
