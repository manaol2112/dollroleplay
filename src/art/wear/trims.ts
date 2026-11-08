// Decorations shared by the clothing catalogs: hems, bands, pockets, patches and sparkles.
import { dark, light } from '../color';
import { motif } from '../motifs';
import { bowG, sparkleD } from './base';

const f = (n: number) => n.toFixed(1);

/** Wavy ruffle along a hem from x0 to x1 at height y. */
export function ruffle(x0: number, x1: number, y: number, c: string, depth = 9, n = 8): string {
  const w = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(y - depth)}`;
  for (let i = 0; i < n; i++) d += ` Q${f(x0 + w * (i + 0.5))} ${f(y + depth * 0.9)} ${f(x0 + w * (i + 1))} ${f(y - depth * 0.1)}`;
  d += ` L${f(x1)} ${f(y - depth)}Z`;
  return `<path d="${d}" fill="${c}"/><path d="${d}" fill="url(#g-shadeY)"/>`;
}

/** White scalloped lace with little holes. */
export function lace(x0: number, x1: number, y: number, c = '#ffffff'): string {
  const n = Math.max(4, Math.round((x1 - x0) / 9));
  const w = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(y - 3)}`;
  let holes = '';
  for (let i = 0; i < n; i++) {
    d += ` Q${f(x0 + w * (i + 0.5))} ${f(y + 9)} ${f(x0 + w * (i + 1))} ${f(y - 3)}`;
    holes += `<circle cx="${f(x0 + w * (i + 0.5))}" cy="${f(y + 1.5)}" r="1.4" fill="${dark(c, 0.2)}" opacity="0.5"/>`;
  }
  return `<path d="${d} L${f(x1)} ${f(y - 6)} L${f(x0)} ${f(y - 6)}Z" fill="${c}"/>${holes}`;
}

/** A solid band, e.g. a contrast hem or cuff. */
export const band = (x0: number, x1: number, y: number, h: number, c: string) => `<rect x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="${f(h)}" rx="${f(Math.min(h / 2, 4))}" fill="${c}"/>`;

/** Two thin stripes, like sporty trim. */
export const stripes = (x0: number, x1: number, y: number, c: string) => band(x0, x1, y, 3.5, c) + band(x0, x1, y + 6, 3.5, c);

export function pocket(x: number, y: number, w: number, h: number, c: string): string {
  return `<path d="M${f(x - w / 2)} ${f(y)} L${f(x + w / 2)} ${f(y)} L${f(x + w / 2)} ${f(y + h - 4)} Q${f(x + w / 2)} ${f(y + h)} ${f(x + w / 2 - 4)} ${f(y + h)} L${f(x - w / 2 + 4)} ${f(y + h)} Q${f(x - w / 2)} ${f(y + h)} ${f(x - w / 2)} ${f(y + h - 4)}Z" fill="${c}"/>` +
    `<path d="M${f(x - w / 2 + 2)} ${f(y + 2)} L${f(x + w / 2 - 2)} ${f(y + 2)}" stroke="${light(c, 0.4)}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
}

export const bow = (x: number, y: number, s: number, c: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${bowG(0, 0, 1, c)}</g>`;

/** A round sew-on patch with a motif in it. */
export function patch(id: string, x: number, y: number, r: number, bg: string): string {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${bg}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r - 2)}" fill="none" stroke="${dark(bg, 0.25)}" stroke-width="1.2" stroke-dasharray="2.5 2"/>${motif(id, x, y, r * 0.72)}`;
}

/** A sprinkle of sparkles inside a box. */
export function sparkles(x0: number, y0: number, w: number, h: number, n = 6, c = '#fff8c8'): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i * 0.618 + 0.3) % 1) * w;
    const y = y0 + ((i * 0.381 + 0.2) % 1) * h;
    s += `<path d="${sparkleD(x, y, 2.6 + (i % 3) * 1.2)}" fill="${c}"/>`;
  }
  return s;
}

/** Tiny dots like sewn-on sequins. */
export function sequins(x0: number, y0: number, w: number, h: number, c = '#fff8c8', n = 14): string {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(x0 + ((i * 0.618) % 1) * w)}" cy="${f(y0 + ((i * 0.7548) % 1) * h)}" r="1.6" fill="${c}" opacity="0.9"/>`;
  return s;
}

export const belt = (x0: number, x1: number, y: number, c: string, buckle = '#ffd24a') =>
  band(x0, x1, y, 7, c) + `<rect x="-6" y="${f(y - 1)}" width="12" height="9" rx="2" fill="none" stroke="${buckle}" stroke-width="2.4"/>`;

export const zip = (y0: number, y1: number, c = '#cfd3e0') => `<path d="M0 ${f(y0)} L0 ${f(y1)}" stroke="${c}" stroke-width="2.6"/><path d="M0 ${f(y0)} L0 ${f(y1)}" stroke="${dark(c, 0.3)}" stroke-width="2.6" stroke-dasharray="1.4 2"/><rect x="-2.5" y="${f(y0 + 2)}" width="5" height="8" rx="1.5" fill="${c}"/>`;
