// Small color helpers. Shadows mix toward a deep plum instead of black so shading stays soft and warm.

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export const dark = (c: string, t = 0.25) => mix(c, '#3a1d3f', t);
export const light = (c: string, t = 0.3) => mix(c, '#ffffff', t);

/** Perceived brightness, 0..1. */
export function luma(c: string): number {
  const [r, g, b] = hexToRgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The palette offered for recoloring clothes and furniture. */
export const PALETTE = [
  '#ff7eb6', '#ff4f8b', '#e0457b', '#ffb3c7', '#c99bff', '#9b6bff', '#7a5cff',
  '#7cc8ff', '#4f9dff', '#5fd3b5', '#3fbf8f', '#b6e36b', '#ffd36b', '#ffab5e',
  '#ff7a6b', '#e85d5d', '#ffffff', '#f4ead9', '#c9a27e', '#8a5a3c', '#9aa3b5', '#4a4a5e', '#2d2a3a',
];

export const SKIN_TONES = [
  '#ffe3d3', '#fcd2bb', '#f5c09f', '#e8a983', '#d69068', '#b9744f', '#965a3c', '#74432c', '#55301f',
];

export const HAIR_COLORS = [
  '#2b1d1a', '#5a3825', '#8a5a34', '#c98a4b', '#f2cf7a', '#fbe7b0', '#b5432f', '#e86a3a',
  '#ff8fc5', '#c995ff', '#7fb8ff', '#6fe0c0', '#f4f4f8', '#9aa0b0',
];

export const EYE_COLORS = ['#3b2418', '#6b4226', '#3f7fbf', '#3c9a6b', '#7a6a5a', '#8a5ad6', '#d6589a', '#2d2a3a'];
export const BLUSH_COLORS = ['#ff9db5', '#ff7a8a', '#ffb38a', '#e88ad6', '#ff6f91'];
export const LIP_COLORS = ['#ff5c8a', '#e0245e', '#ff8a7a', '#c4458f', '#a3304a', '#ff9ec7', '#9b6bff'];
export const SHADOW_COLORS = ['#c99bff', '#7cc8ff', '#ff9ec7', '#5fd3b5', '#ffd36b', '#ff9a6b'];
