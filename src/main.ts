import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './styles.css';
import { installDefs } from './art/defs';
import { initParticles } from './engine/particles';
import { App } from './ui/app';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
// Stops iOS from zooming on double tap and from rubber-banding the page.
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
new App().start();
