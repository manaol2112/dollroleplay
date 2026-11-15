// Dev-only page for the Show Time screens. Open /showtime-dev.html#fashion or #dance under `npx vite`.
// Add ?mute to keep it silent (used by automated screenshots).
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { setMusic, setSound } from '../engine/audio';
import { initParticles } from '../engine/particles';
import { openDanceParty, openFashionShow } from '../ui/showtime';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
if (location.search.includes('mute')) {
  setSound(false);
  setMusic(false);
}
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

const stage = document.getElementById('stage')!;
stage.innerHTML = `<div style="position:absolute;inset:0;display:flex;gap:16px;align-items:center;justify-content:center;font:600 22px Fredoka">
  <a href="#fashion">Fashion Show</a><a href="#dance">Dance Party</a></div>`;

const open = () => {
  document.getElementById('overlay')!.innerHTML = '';
  const back = () => (location.hash = '');
  if (location.hash === '#fashion') openFashionShow(back, (id) => {
    console.log('dress', id);
    window.setTimeout(() => openFashionShow(back, () => undefined), 400);
  });
  if (location.hash === '#dance') openDanceParty(back);
};
window.addEventListener('hashchange', open);
open();
