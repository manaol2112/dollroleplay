// Dev-only page for the Seasonal Fun activities. Open /seasonfun-dev.html#snowman (or #pumpkin,
// #egghunt, #sandcastle) under the dev server; closing an activity shows buttons to open the others.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { initParticles } from '../engine/particles';
import { SEASON_FUN, openEggHunt, openPumpkin, openSandcastle, openSnowman } from '../ui/seasonfun';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);

const OPEN: Record<string, (onClose: () => void) => void> = { snowman: openSnowman, pumpkin: openPumpkin, egghunt: openEggHunt, sandcastle: openSandcastle };
const SEASON: Record<string, keyof typeof SEASON_FUN> = { snowman: 'winter', pumpkin: 'fall', egghunt: 'spring', sandcastle: 'summer' };

function menu(): void {
  const app = document.getElementById('app')!;
  app.style.cssText = 'display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap';
  app.innerHTML = Object.keys(OPEN)
    .map((k) => `<button class="btn" data-k="${k}" style="height:80px">${SEASON_FUN[SEASON[k]].icon}<span>${SEASON_FUN[SEASON[k]].name}</span></button>`)
    .join('');
  app.querySelectorAll<HTMLElement>('[data-k]').forEach((b) => b.addEventListener('click', () => (location.hash = b.dataset.k!)));
}

function route(): void {
  const k = location.hash.slice(1);
  document.getElementById('overlay')!.innerHTML = '';
  if (OPEN[k]) OPEN[k](() => (location.hash = ''));
}
menu();
window.addEventListener('hashchange', route);
route();
