// Dev-only page for the action mini-games. Open /minigames-dev.html#kart (or #swim, #skate, #rings,
// #balloons) under `npx vite`. Each game reopens when it is closed so it can be played over and over.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { initParticles } from '../engine/particles';
import { toast } from '../game';
import { openBalloonPop, openIceSkate, openKartRace, openRingToss, openSwimRace } from '../ui/minigames';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.body.style.background = '#ffd9e8';

const games: Record<string, () => void> = {
  kart: () => openKartRace(undefined, menu),
  swim: () => openSwimRace(undefined, menu),
  skate: () => openIceSkate(undefined, menu),
  rings: () => openRingToss(menu, (id) => toast(`Prize: ${id}`, 'gift')),
  balloons: () => openBalloonPop(menu, (id) => toast(`Prize: ${id}`, 'gift')),
};
function menu(): void {
  history.replaceState(null, '', location.pathname + location.search);
  const stage = document.getElementById('stage')!;
  stage.innerHTML = `<div style="position:absolute;inset:0;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap">${Object.keys(games)
    .map((k) => `<a class="btn primary" href="#${k}">${k}</a>`)
    .join('')}</div>`;
}
const open = () => {
  const k = location.hash.slice(1);
  if (games[k]) games[k]();
};
window.addEventListener('hashchange', open);
const first = location.hash.slice(1);
menu();
if (games[first]) games[first]();
