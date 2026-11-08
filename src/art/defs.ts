// Gradients and patterns shared by every SVG on the page. They live in one hidden <svg> so each
// drawing can reference them by id instead of repeating them.

export const PATTERNS = ['none', 'dots', 'stripes', 'hearts', 'stars', 'check', 'flowers'] as const;
export type Pattern = (typeof PATTERNS)[number];

const W = 'rgba(255,255,255,0.55)';
const heart = (x: number, y: number, s: number, f: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 3 C-4 -1 -9 2 -6 6 L0 11 L6 6 C9 2 4 -1 0 3Z" fill="${f}"/>`;
const star = (x: number, y: number, s: number, f: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 L1.8 -1.9 6 -1.9 2.6 1 3.8 5.4 0 2.8 -3.8 5.4 -2.6 1 -6 -1.9 -1.8 -1.9Z" fill="${f}"/>`;
const flower = (x: number, y: number, s: number, f: string, c: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${f}"><circle cx="0" cy="-3.2" r="2.6"/><circle cx="3" cy="-1" r="2.6"/><circle cx="1.9" cy="2.6" r="2.6"/><circle cx="-1.9" cy="2.6" r="2.6"/><circle cx="-3" cy="-1" r="2.6"/><circle r="1.7" fill="${c}"/></g>`;

function patternSet(prefix: string, k: number, color: string, accent: string): string {
  const s = (v: number) => v * k;
  return `
  <pattern id="${prefix}-dots" width="${s(14)}" height="${s(14)}" patternUnits="userSpaceOnUse">
    <circle cx="${s(3.5)}" cy="${s(3.5)}" r="${s(2.3)}" fill="${color}"/><circle cx="${s(10.5)}" cy="${s(10.5)}" r="${s(2.3)}" fill="${color}"/>
  </pattern>
  <pattern id="${prefix}-stripes" width="${s(14)}" height="${s(14)}" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
    <rect width="${s(5)}" height="${s(14)}" fill="${color}"/>
  </pattern>
  <pattern id="${prefix}-hearts" width="${s(22)}" height="${s(22)}" patternUnits="userSpaceOnUse">
    ${heart(s(6), s(4), k * 0.75, color)}${heart(s(17), s(14), k * 0.75, color)}
  </pattern>
  <pattern id="${prefix}-stars" width="${s(22)}" height="${s(22)}" patternUnits="userSpaceOnUse">
    ${star(s(6), s(6), k * 0.8, color)}${star(s(17), s(16), k * 0.8, color)}
  </pattern>
  <pattern id="${prefix}-check" width="${s(16)}" height="${s(16)}" patternUnits="userSpaceOnUse">
    <rect width="${s(8)}" height="${s(16)}" fill="${color}" opacity="0.6"/><rect width="${s(16)}" height="${s(8)}" fill="${color}" opacity="0.6"/>
  </pattern>
  <pattern id="${prefix}-flowers" width="${s(24)}" height="${s(24)}" patternUnits="userSpaceOnUse">
    ${flower(s(6), s(6), k * 0.85, color, accent)}${flower(s(18), s(18), k * 0.85, color, accent)}
  </pattern>`;
}

export const DEFS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
  <linearGradient id="g-shadeX" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.42" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.7" stop-color="#3a1d3f" stop-opacity="0"/><stop offset="1" stop-color="#3a1d3f" stop-opacity="0.2"/>
  </linearGradient>
  <linearGradient id="g-shadeY" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#3a1d3f" stop-opacity="0.22"/>
  </linearGradient>
  <radialGradient id="g-face" cx="0.38" cy="0.32" r="0.75">
    <stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#7a2a55" stop-opacity="0.16"/>
  </radialGradient>
  <linearGradient id="g-shine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.0"/><stop offset="0.18" stop-color="#fff" stop-opacity="0.38"/>
    <stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a1d3f" stop-opacity="0.18"/>
  </linearGradient>
  <radialGradient id="g-ground" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#3a1d3f" stop-opacity="0.32"/><stop offset="0.6" stop-color="#3a1d3f" stop-opacity="0.14"/>
    <stop offset="1" stop-color="#3a1d3f" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="g-glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff6c8" stop-opacity="0.9"/><stop offset="0.4" stop-color="#ffe680" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#ffe680" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.08"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.62" stop-color="#fff" stop-opacity="0.05"/>
  </linearGradient>
  <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff3b0"/><stop offset="0.45" stop-color="#ffd24a"/><stop offset="1" stop-color="#d99a1e"/>
  </linearGradient>
  <linearGradient id="g-silver" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#d9dbe6"/><stop offset="1" stop-color="#a7abbd"/>
  </linearGradient>
  <linearGradient id="g-rainbow" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff7eb6"/><stop offset="0.25" stop-color="#ffd36b"/><stop offset="0.5" stop-color="#7fe0b0"/>
    <stop offset="0.75" stop-color="#7cc8ff"/><stop offset="1" stop-color="#c99bff"/>
  </linearGradient>
  <linearGradient id="g-floorDepth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a1d3f" stop-opacity="0.22"/><stop offset="0.35" stop-color="#3a1d3f" stop-opacity="0.04"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.08"/>
  </linearGradient>
  <linearGradient id="g-wallDepth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a1d3f" stop-opacity="0.12"/><stop offset="0.5" stop-color="#3a1d3f" stop-opacity="0"/>
    <stop offset="1" stop-color="#3a1d3f" stop-opacity="0.08"/>
  </linearGradient>
  <radialGradient id="g-vignette" cx="0.5" cy="0.45" r="0.75">
    <stop offset="0.6" stop-color="#3a1d3f" stop-opacity="0"/><stop offset="1" stop-color="#3a1d3f" stop-opacity="0.22"/>
  </radialGradient>
  <linearGradient id="g-spot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff8d8" stop-opacity="0.65"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0.04"/>
  </linearGradient>
  ${patternSet('p', 1, W, 'rgba(255,220,120,0.8)')}
  ${patternSet('w', 3.2, 'rgba(255,255,255,0.4)', 'rgba(255,215,130,0.6)')}
</defs></svg>`;

export function installDefs(): void {
  if (document.getElementById('shared-defs')) return;
  const holder = document.createElement('div');
  holder.id = 'shared-defs';
  holder.innerHTML = DEFS_SVG;
  document.body.prepend(holder);
}

/** Paints a path with a base color, soft volume shading and an optional pattern. */
export function cloth(d: string, color: string, pattern: Pattern | string = 'none', shade: 'x' | 'y' = 'x'): string {
  let s = `<path d="${d}" fill="${color}"/>`;
  if (pattern && pattern !== 'none') s += `<path d="${d}" fill="url(#p-${pattern})"/>`;
  s += `<path d="${d}" fill="url(#g-shade${shade === 'x' ? 'X' : 'Y'})"/>`;
  return s;
}

export const shadow = (w: number, h = w * 0.22, y = 0, x = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="url(#g-ground)"/>`;
