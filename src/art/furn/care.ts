// Hospital and car-shop catalog: friendly hospital furniture (beds with heart monitors, exam tables,
// waiting chairs, an ambulance, x-ray with a smiling skeleton) and lots of cars a doll can sit in,
// plus the car-shop fittings, in many design collections. Also the town-map fronts for both places.
import type { Season } from '../../types';
import {
  type FurnCat, type FurnDef, type FurnStyle, type Mount, FURN_STYLE_BY_ID,
  C, E, Ln, P, R, bowG, box, cloth, dark, f, flowerG, glow, heartD, light, motif, sparkleD, starD, stylePrice,
} from './kit';

// ---------------- local helpers ----------------
type Art = (c: string, on: boolean, s: FurnStyle) => string;
interface Design {
  st: string;
  name: string;
  art: Art;
  front?: Art;
  x?: Partial<FurnDef>;
}
type Base = Partial<Omit<FurnDef, 'art' | 'front'>> & { mount: Mount; w: number; h: number };

function fam(type: string, group: string, cat: FurnCat, base: Base, designs: Design[], price: (i: number) => number = (i) => stylePrice(i)): FurnDef[] {
  return designs.map((d, i) => {
    const s = FURN_STYLE_BY_ID[d.st];
    const def: FurnDef = {
      ...base, ...d.x, id: `f-${type}-${d.st}`, name: d.name, cat, group, style: d.st, price: d.x?.price ?? price(i), color: d.x?.color ?? s.main,
      art: (c, on) => d.art(c, on, s),
    };
    const fr = d.front;
    if (fr) def.front = (c, on) => fr(c, on, s);
    return def;
  });
}

const S = (d: string, c: string, w = 3, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const G = (inner: string, tr = '') => (tr ? `<g transform="${tr}">${inner}</g>` : `<g>${inner}</g>`);
const tr = (x: number, y: number, inner: string, s = 1) => `<g transform="translate(${f(x)} ${f(y)})${s !== 1 ? ` scale(${s.toFixed(3)})` : ''}">${inner}</g>`;
const op = (o: number) => `opacity="${o}"`;
const shine = (x: number, y: number, w: number, h: number, o = 0.35) => R(x, y, w, h, Math.min(w, h) / 2, '#fff', op(o));
const knob = (x: number, y: number, r: number, c: string) => C(x, y, r, c) + C(x - r * 0.3, y - r * 0.35, r * 0.4, '#fff', op(0.6));
const txt = (x: number, y: number, size: number, col: string, t: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${f(size)}" text-anchor="middle" fill="${col}" ${extra}>${t}</text>`;
const SPL = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"';
const swayG = (inner: string, px: number, py: number, amp: number, dur: number, begin = 0) =>
  `<g><animateTransform attributeName="transform" type="rotate" values="${f(-amp)} ${f(px)} ${f(py)};${f(amp)} ${f(px)} ${f(py)};${f(-amp)} ${f(px)} ${f(py)}" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" ${SPL}/>${inner}</g>`;
const spin = (inner: string, cx: number, cy: number, dur: number, rev = false) =>
  `<g><animateTransform attributeName="transform" type="rotate" values="${rev ? 360 : 0} ${f(cx)} ${f(cy)};${rev ? 0 : 360} ${f(cx)} ${f(cy)}" dur="${dur}s" repeatCount="indefinite"/>${inner}</g>`;
const twinkle = (x: number, y: number, r: number, c: string, dur = 2, begin = 0) =>
  `<path d="${sparkleD(x, y, r)}" fill="${c}"><animate attributeName="opacity" values="1;0.25;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/></path>`;
const blink = (inner: string, dur: number, begin = 0) => `<g><animate attributeName="opacity" values="1;0.2;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite"/>${inner}</g>`;
/** Two lights that flash in turn (a friendly pink and blue). */
const flash = (inner: string, dur: number, begin = 0) => `<g opacity="0"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="${dur}s" begin="${f(begin)}s" repeatCount="indefinite" calcMode="discrete"/>${inner}</g>`;
const sit = (x: number, y: number) => ({ x, y, pose: 'sit' as const });
const sleep = (x: number, y: number) => [{ x, y, pose: 'sleep' as const }];
const SIL = 'url(#g-silver)';
const GOLD = 'url(#g-gold)';
const GLASS = 'url(#g-glass)';
const INK = '#2d2a3a';
const TIRE = '#3a3546';
const RB = ['#ff6f91', '#ffb35e', '#ffe06b', '#6fdca0', '#7cc8ff', '#b48cff'];
const TOYC = ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b'];
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/** Rounded rectangle with different top and bottom corner radii. */
function rrD(x: number, y: number, w: number, h: number, rt: number, rb: number): string {
  rt = Math.min(rt, w / 2, h / 2); rb = Math.min(rb, w / 2, h / 2);
  return `M${f(x + rt)} ${f(y)} H${f(x + w - rt)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rt)} V${f(y + h - rb)} Q${f(x + w)} ${f(y + h)} ${f(x + w - rb)} ${f(y + h)} H${f(x + rb)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rb)} V${f(y + rt)} Q${f(x)} ${f(y)} ${f(x + rt)} ${f(y)}Z`;
}
const boxT = (x: number, y: number, w: number, h: number, rt: number, rb: number, c: string, pat = 'none') => cloth(rrD(x, y, w, h, rt, rb), c, pat);
const scallop = (x1: number, x2: number, y: number, n: number, dep: number) => {
  let d = '';
  const st = (x2 - x1) / n;
  for (let i = 0; i < n; i++) d += ` Q${f(x1 + st * (i + 0.5))} ${f(y + dep * 2)} ${f(x1 + st * (i + 1))} ${f(y)}`;
  return d;
};
const mattress = (x1: number, x2: number, y: number, c = '#ffffff', h = 50) =>
  box(x1, y, x2 - x1, h, 18, c, 'none', 'y') + R(x1 + 16, y + 6, x2 - x1 - 32, 5, 2.5, '#fff', op(0.55));
const pillow = (x: number, y: number, c = '#ffffff', rx = 46, ry = 24, pat = 'none') =>
  cloth(`M${f(x - rx)} ${f(y)} Q${f(x - rx)} ${f(y - ry)} ${f(x)} ${f(y - ry)} Q${f(x + rx)} ${f(y - ry)} ${f(x + rx)} ${f(y)} Q${f(x + rx)} ${f(y + ry)} ${f(x)} ${f(y + ry)} Q${f(x - rx)} ${f(y + ry)} ${f(x - rx)} ${f(y)}Z`, c, pat, 'y') +
  S(`M${f(x - rx * 0.75)} ${f(y - 4)} Q${f(x)} ${f(y + ry * 0.65)} ${f(x + rx * 0.75)} ${f(y - 4)}`, dark(c, 0.12), 2);
/** The blanket drawn in front of a sleeping doll whose hip is at (hip, mt). */
function blanket(hip: number, mt: number, c: string, pat = 'none', fold = '#ffffff', x2o?: number): string {
  const x1 = hip - 148;
  const x2 = x2o ?? hip + 72;
  const t = mt - 14;
  const b = mt + 62;
  const m = (x1 + x2) / 2;
  const top = `M${f(x1)} ${f(t)} Q${f(m)} ${f(t - 8)} ${f(x2)} ${f(t + 2)}`;
  return cloth(`${top} L${f(x2 + 4)} ${f(b)} Q${f(m)} ${f(b + 10)} ${f(x1 - 4)} ${f(b - 2)}Z`, c, pat, 'y') +
    S(`M${f(x1 + 6)} ${f(b - 10)} Q${f(m)} ${f(b)} ${f(x2 - 2)} ${f(b - 8)}`, '#fff', 2, 'stroke-dasharray="7 6" opacity="0.7"') +
    P(`${top} L${f(x2)} ${f(t + 20)} Q${f(m)} ${f(t + 12)} ${f(x1 - 2)} ${f(t + 20)}Z`, fold, op(0.92));
}
/** The friendly hospital sign: a heart with a plus. */
const heartPlus = (x: number, y: number, s: number, c = '#ff6f91', plus = '#ffffff') =>
  P(heartD(x, y - s * 0.55, s), c) + R(x - s * 0.1, y - s * 0.48, s * 0.2, s * 0.6, s * 0.05, plus) + R(x - s * 0.3, y - s * 0.28, s * 0.6, s * 0.2, s * 0.05, plus);
/** A tiny cute bandage strip. */
const plaster = (x: number, y: number, s: number, rot: number, c = '#ffd0b0') =>
  G(R(-20, -7, 40, 14, 7, c) + R(-7, -6, 14, 12, 3, light(c, 0.4)) + [-14, 14].map((xx) => C(xx, -2, 1, dark(c, 0.15)) + C(xx, 2, 1, dark(c, 0.15))).join(''), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);

// ---------------- car parts ----------------
/** A tyre and a hubcap that matches the collection. The wheel sits on the floor. */
function wheel(x: number, r: number, s: FurnStyle, kind = s.id, rimC?: string): string {
  const y = -r;
  const rim = rimC ?? s.main;
  let o = '';
  if (kind === 'woodland') for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; o += C(x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.97, r * 0.13, TIRE); }
  o += C(x, y, r, TIRE) + S(`M${f(x - r * 0.62)} ${f(y - r * 0.62)} A${f(r * 0.88)} ${f(r * 0.88)} 0 0 1 ${f(x + r * 0.62)} ${f(y - r * 0.62)}`, '#fff', r * 0.06, op(0.25));
  const ri = r * 0.6;
  switch (kind) {
    case 'retro':
      o += C(x, y, r * 0.74, '#ffffff') + C(x, y, ri * 0.85, SIL) + C(x, y, ri * 0.3, light(rim, 0.2)) + C(x - ri * 0.3, y - ri * 0.3, ri * 0.15, '#fff', op(0.8));
      break;
    case 'princess':
      o += C(x, y, ri, '#fff6e0', `stroke="${GOLD}" stroke-width="${f(r * 0.1)}"`);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; o += Ln(x, y, x + Math.cos(a) * ri, y + Math.sin(a) * ri, '#e0b040', r * 0.07); }
      o += C(x, y, ri * 0.3, GOLD);
      break;
    case 'modern':
      o += C(x, y, ri, '#4a4a5e') + C(x, y, ri * 0.92, 'none', `stroke="${SIL}" stroke-width="${f(r * 0.06)}"`);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; o += Ln(x, y, x + Math.cos(a) * ri * 0.85, y + Math.sin(a) * ri * 0.85, '#d9dde8', r * 0.12); }
      o += C(x, y, ri * 0.22, s.accent === '#4a4a5e' ? '#ff5d73' : s.accent);
      break;
    case 'candy':
      o += C(x, y, ri, '#ffffff');
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const b = a + Math.PI / 6; o += P(`M${f(x)} ${f(y)} L${f(x + Math.cos(a) * ri)} ${f(y + Math.sin(a) * ri)} A${f(ri)} ${f(ri)} 0 0 1 ${f(x + Math.cos(b) * ri)} ${f(y + Math.sin(b) * ri)}Z`, s.trim); }
      o += C(x, y, ri * 0.25, '#fff');
      break;
    case 'space':
      o += C(x, y, ri, '#2d2a50') + C(x, y, ri * 0.8, 'none', `stroke="#7fe8ff" stroke-width="${f(r * 0.08)}"`) + P(starD(x, y, ri * 0.5), s.accent);
      break;
    case 'rainbow':
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const b = a + Math.PI / 3; o += P(`M${f(x)} ${f(y)} L${f(x + Math.cos(a) * ri)} ${f(y + Math.sin(a) * ri)} A${f(ri)} ${f(ri)} 0 0 1 ${f(x + Math.cos(b) * ri)} ${f(y + Math.sin(b) * ri)}Z`, RB[i]); }
      o += C(x, y, ri * 0.3, '#fff');
      break;
    case 'woodland':
      o += C(x, y, ri, light(s.wood, 0.1)) + C(x, y, ri * 0.7, 'none', `stroke="${dark(s.wood, 0.2)}" stroke-width="2"`) + C(x, y, ri * 0.25, s.accent);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; o += C(x + Math.cos(a) * ri * 0.5, y + Math.sin(a) * ri * 0.5, r * 0.05, dark(s.wood, 0.3)); }
      break;
    case 'beach':
      o += C(x, y, ri, '#ffffff') + flowerG(x, y, ri * 0.55, s.main === '#9fd6ff' ? '#ffab5e' : light(rim, 0.1));
      break;
    case 'boho':
      o += C(x, y, ri, '#e8b46a') + motif('sun', x, y, ri * 0.6);
      break;
    case 'cottage':
      o += C(x, y, ri, '#fff3d6') + flowerG(x, y, ri * 0.6, '#ffffff');
      break;
    case 'spoke': // thin bicycle spokes
      o = C(x, y, r, 'none', `stroke="${TIRE}" stroke-width="${f(r * 0.16)}"`) + C(x, y, r * 0.86, 'none', `stroke="${SIL}" stroke-width="2"`);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; o += Ln(x, y, x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84, '#c9cfdd', 1.2); }
      o += C(x, y, r * 0.14, rim);
      break;
    default:
      o += C(x, y, ri, light(rim, 0.25)) + C(x, y, ri * 0.8, 'none', `stroke="#fff" stroke-width="2" ${op(0.6)}`) + P(heartD(x, y - ri * 0.4, ri * 0.75), '#ffffff');
  }
  return o;
}
/** A headlight facing right; a soft beam shines out when the lights are on. */
const headlight = (x: number, y: number, r: number, on: boolean, len = 80) =>
  (on ? P(`M${f(x)} ${f(y - r)} L${f(x + len)} ${f(y - r * 2.6)} L${f(x + len)} ${f(y + r * 2.6)} L${f(x)} ${f(y + r)}Z`, '#fff6c8', op(0.45)) + glow(x, y, r * 3.4) : '') +
  C(x, y, r, on ? '#fffbe0' : '#f4f6ff', `stroke="${on ? '#ffd24a' : '#c9cfdd'}" stroke-width="2"`) + C(x - r * 0.3, y - r * 0.32, r * 0.3, '#fff', op(0.9));
const tailLight = (x: number, y: number, w: number, h: number, on: boolean) => (on ? glow(x, y, w * 1.6) : '') + R(x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2.2, on ? '#ff5d73' : '#e8506a');
/** A glass window shape with a soft shine. */
const glass = (d: string, tint = '#d9efff') => P(d, tint) + P(d, GLASS) + P(d, 'none', 'stroke="#fff" stroke-width="2" opacity="0.5"');
/** A steering wheel seen from the side, drawn in front of the driver. */
const steer = (x: number, y: number, c = INK) => Ln(x + 22, y + 26, x + 2, y + 2, '#6b6680', 5) + E(x, y, 6, 19, 'none', `stroke="${c}" stroke-width="5" transform="rotate(-24 ${f(x)} ${f(y)})"`);
/** A padded seat back seen behind a seated doll. */
const seatBack = (x: number, top: number, bot: number, c: string, w = 92) => boxT(x - w / 2, top, w, bot - top, 26, 8, c) + shine(x - w / 2 + 12, top + 10, w - 24, 6, 0.35);
/** A car door outline with a handle. */
const door = (x1: number, x2: number, y1: number, y2: number, c: string, handle = true) =>
  S(`M${f(x1)} ${f(y1)} V${f(y2 - 10)} Q${f(x1)} ${f(y2)} ${f(x1 + 12)} ${f(y2)} H${f(x2 - 12)} Q${f(x2)} ${f(y2)} ${f(x2)} ${f(y2 - 12)} V${f(y1)}`, dark(c, 0.14), 2.5) +
  (handle ? R(x2 - 34, y1 + 14, 22, 7, 3.5, dark(c, 0.22)) + R(x2 - 32, y1 + 14, 18, 2.5, 1.2, '#fff', op(0.5)) : '');
/** Shape of a wheel arch cut into the body bottom: from x+r to x-r over the top. */
const arch = (x: number, r: number, y: number) => ` L${f(x + r)} ${f(y)} A${f(r)} ${f(r)} 0 0 0 ${f(x - r)} ${f(y)}`;
/** Body bottom from the front end going back, with two wheel arches. */
const under = (xL: number, wR: number, wL: number, r: number, y: number) => `${arch(wR, r, y)}${arch(wL, r, y)} L${f(xL)} ${f(y)}`;
const shadow = (w: number) => E(0, -2, w, 10, '#2d2a3a', op(0.12));

// ---------------- convertibles ----------------
const CV_SEATS = [sit(10, -96), sit(-140, -100)];
function convertible(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(220);
      // folded soft top at the back
      if (st === 'princess') o += P('M-226 -150 Q-236 -210 -190 -214 Q-200 -180 -170 -150Z', s.soft) + S('M-220 -160 Q-214 -196 -192 -206', GOLD, 3);
      else if (st === 'beach') o += R(-238, -268, 30, 130, 15, '#ffab5e', 'transform="rotate(-14 -223 -200)"') + R(-226, -262, 6, 118, 3, '#fff', 'transform="rotate(-14 -223 -200)"');
      else o += P('M-222 -150 Q-232 -186 -196 -190 L-168 -186 Q-160 -168 -170 -150Z', dark(c, 0.35)) + S('M-214 -162 Q-206 -180 -184 -182', light(c, 0.1), 3, op(0.6));
      o += seatBack(-140, -222, -146, s.soft) + seatBack(10, -218, -146, s.soft);
      if (st === 'sweet') o += P(heartD(-140, -212, 14), c) + P(heartD(10, -208, 14), c);
      if (st === 'princess') o += motif('crown', -140, -206, 12) + motif('crown', 10, -202, 12);
      if (st === 'retro') o += [-140, 10].map((x) => [-24, 0, 24].map((d) => Ln(x + d, -206, x + d, -156, dark(s.soft, 0.12), 3)).join('')).join('');
      // windshield
      o += glass('M82 -150 L58 -232 Q60 -240 68 -240 L76 -240 L110 -150Z') + S('M82 -150 L58 -232 Q60 -240 68 -240 L76 -240 L110 -150', st === 'princess' ? '#e0b040' : st === 'retro' ? '#c9cfdd' : dark(c, 0.2), 4);
      return o;
    },
    front: (c, on, s) => {
      const fin = st === 'retro';
      let d = `M-224 -78 Q-228 ${fin ? -176 : -150} ${fin ? -206 : -190} ${fin ? -176 : -156} L-120 -150 L80 -152 Q150 -150 202 -128 Q228 -116 226 -86 L224 -62 Q224 -40 206 -40`;
      d += under(-206, 136, -136, 52, -40) + ' Q-224 -40 -224 -62Z';
      let o = cloth(d, c, st === 'candy' ? 'dots' : 'none', 'y') + shine(-190, -146, 360, 6, 0.4);
      o += door(-62, 78, -146, -54, c);
      if (st === 'sweet') o += S('M-200 -118 Q0 -112 200 -112', '#ffffff', 5, op(0.9)) + P(heartD(-120, -100, 24), '#fff', op(0.95)) + P(heartD(-120, -97, 14), s.main);
      if (st === 'princess') o += S('M-200 -122 Q0 -116 210 -114', GOLD, 5) + motif('crown', -130, -96, 18) + P('M222 -134 Q236 -150 224 -160', 'none', `stroke="${GOLD}" stroke-width="4"`) + C(224, -162, 6, GOLD);
      if (st === 'retro') o += R(-224, -66, 448, 14, 7, SIL) + S('M-200 -110 L200 -110', '#fff', 6, op(0.8)) + S('M-200 -102 L200 -102', s.accent, 4) + motif('star', -132, -128, 12);
      if (st === 'beach') o += R(-210, -132, 130, 66, 10, '#e8b46a') + [-190, -160, -130, -100].map((x) => Ln(x, -128, x, -70, '#c98a5a', 2)).join('') + flowerG(-30, -100, 14, '#ff7eb6') + flowerG(10, -112, 9, '#ffd36b');
      o += headlight(214, -108, 11, on) + tailLight(-220, -116, 10, 22, on);
      o += steer(56, -168, st === 'princess' ? '#e0b040' : INK);
      o += wheel(-136, 40, s) + wheel(136, 40, s);
      return o;
    },
    x: { seats: CV_SEATS },
  };
}
const CONVERTIBLES = fam('car-convertible', 'Convertibles', 'cars', { mount: 'floor', w: 460, h: 250, toggle: true, sfx: 'boing' }, [
  convertible('sweet', 'Sweetheart Convertible'),
  convertible('princess', 'Royal Convertible'),
  convertible('retro', 'Retro Cruiser'),
  convertible('beach', 'Beach Convertible'),
], (i) => stylePrice(i, 60, 20, 200));


// ---------------- mini cars ----------------
function mini(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const roof = 'M-176 -150 Q-182 -270 -60 -278 L40 -278 Q150 -274 170 -150Z';
      const win = 'M-150 -156 Q-152 -250 -60 -256 L34 -256 Q128 -252 146 -156Z';
      let o = shadow(190);
      if (st === 'candy') {
        o += cloth(roof, '#fff3f8', 'none', 'x') + glass(win, '#e6f6ff');
        o += P(`M-178 -200 Q-178 -280 -60 -282 L40 -282 Q160 -278 172 -200${scallop(172, -178, -200, 7, 9)}Z`, c) + C(-6, -292, 16, '#e8384f') + S('M-6 -306 Q2 -326 16 -330', '#5fae6b', 3) + C(-11, -297, 5, '#fff', op(0.6));
        for (let i = 0; i < 12; i++) o += R(-150 + rnd(i) * 290, -270 + rnd(i + 9) * 50, 8, 3, 1.5, TOYC[i % 6], `transform="rotate(${Math.round(rnd(i + 3) * 180)} ${f(-146 + rnd(i) * 290)} ${f(-268 + rnd(i + 9) * 50)})"`);
      } else if (st === 'modern') {
        o += cloth(roof, s.accent) + glass(win, '#cfe3f0') + R(-120, -286, 220, 8, 4, s.metal) + R(-130, -292, 10, 14, 3, s.metal) + R(90, -292, 10, 14, 3, s.metal);
      } else {
        o += cloth(roof, c) + glass(win) + S(win, '#ffffff', 5) + tr(-10, -286, bowG(0, 0, 1.3, '#ff7eb6'));
      }
      o += seatBack(50, -214, -148, s.soft, 86) + seatBack(-90, -218, -148, s.soft, 86);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-186 -70 Q-190 -150 -150 -152 L130 -152 Q186 -150 188 -100 L188 -62 Q188 -40 170 -40' + under(-168, 110, -110, 46, -40) + ' Q-186 -40 -186 -62Z';
      let o = cloth(d, c, st === 'candy' ? 'dots' : 'none', 'y') + shine(-160, -146, 300, 6, 0.45) + door(-40, 90, -146, -56, c);
      if (st === 'candy') o += S('M-180 -116 Q0 -108 186 -116', '#ffffff', 7) + S('M-180 -116 Q0 -108 186 -116', s.trim, 7, 'stroke-dasharray="10 10"') + tr(-120, -96, motif('candy', 0, 0, 16));
      else if (st === 'modern') o += R(-186, -122, 374, 10, 5, s.accent) + R(-186, -106, 374, 4, 2, s.accent) + motif('bolt', -120, -82, 14) + R(176, -112, 16, 12, 4, on ? '#fffbe0' : '#f4f6ff');
      else o += P(heartD(-118, -104, 22), '#fff') + P(heartD(-118, -101, 12), light(c, 0.1)) + S('M-176 -64 Q0 -56 180 -64', '#fff', 4, op(0.7));
      o += R(-196, -72, 26, 14, 7, s.id === 'modern' ? s.metal : '#ffffff') + R(176, -70, 22, 14, 7, s.id === 'modern' ? s.metal : '#ffffff');
      o += (st === 'sweet' ? (on ? glow(180, -110, 34) + P(`M186 -118 L250 -140 L250 -80 L186 -102Z`, '#fff6c8', op(0.45)) : '') + P(heartD(180, -122, 18), on ? '#fffbe0' : '#ffffff', 'stroke="#ffb3c7" stroke-width="2"') : headlight(180, -112, 10, on, 60));
      o += tailLight(-184, -112, 8, 18, on) + steer(96, -170) + wheel(-110, 34, s) + wheel(110, 34, s);
      return o;
    },
    x: { seats: [sit(50, -96), sit(-90, -98)] },
  };
}
const MINIS = fam('car-mini', 'Mini Cars', 'cars', { mount: 'floor', w: 390, h: 300, toggle: true, sfx: 'boing' }, [
  mini('candy', 'Gumdrop Mini Car'), mini('sweet', 'Bow Bubble Mini'), mini('modern', 'City Zip Mini'),
], (i) => stylePrice(i, 50, 20, 200));

// ---------------- jeeps ----------------
function jeep(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const bar = st === 'rainbow' ? RB[4] : st === 'beach' ? '#ffffff' : '#4a4048';
      let o = shadow(230) + R(-238, -136, 20, 20, 4, '#4a4048') + G(wheel(-236, 40, s, st === 'woodland' ? 'woodland' : st), 'translate(0 -96)');
      if (st === 'beach') o += G(R(-210, -400, 40, 250, 20, '#ff7eb6') + R(-194, -396, 8, 242, 4, '#fff') + R(-150, -380, 40, 220, 20, '#ffe06b') + R(-134, -376, 8, 212, 4, '#ff9a6b'), 'rotate(-6 -170 -160)');
      if (st === 'woodland') o += R(-226, -300, 300, 12, 6, '#6b4a3a') + P('M-230 -312 Q-90 -340 70 -312 L60 -300 Q-90 -324 -220 -300Z', '#ffab5e') + R(-30, -330, 10, 20, 3, '#6b4a3a');
      o += S('M-206 -166 V-282 Q-206 -294 -194 -294 H-38 Q-26 -294 -26 -282 V-166', bar, 12) + S('M-206 -166 V-282 Q-206 -294 -194 -294 H-38 Q-26 -294 -26 -282 V-166', '#fff', 3, op(0.3));
      if (st === 'rainbow') o += [-150, -100, -50].map((x, i) => C(x, -294, 9, RB[i * 2])).join('');
      o += seatBack(-118, -224, -162, s.soft) + seatBack(40, -220, -162, s.soft);
      o += R(108, -264, 12, 100, 5, bar) + glass('M120 -260 L146 -260 L146 -166 L120 -166Z') + R(144, -264, 10, 100, 5, bar);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-228 -60 L-228 -158 Q-228 -168 -218 -168 L120 -168 L132 -152 L222 -148 Q234 -148 234 -136 L234 -60 Q234 -44 216 -44' + under(-212, 140, -140, 60, -44) + ' Q-228 -44 -228 -60Z';
      let o = cloth(d, c, 'none', 'y') + R(-224, -164, 454, 6, 3, '#fff', op(0.35));
      o += door(-60, 96, -160, -60, c, true);
      if (st === 'woodland') {
        for (let i = 0; i < 7; i++) o += E(-200 + rnd(i) * 400, -150 + rnd(i + 4) * 80, 22 + rnd(i + 2) * 12, 12, i % 2 ? dark(c, 0.18) : light(c, 0.2), `transform="rotate(${Math.round(rnd(i + 7) * 60 - 30)} ${f(-200 + rnd(i) * 400)} ${f(-150 + rnd(i + 4) * 80)})"`);
        o += motif('leaf', -150, -110, 16) + R(226, -120, 18, 70, 6, '#6b4a3a') + [-104, -88, -72].map((y) => R(232, y, 20, 6, 3, '#8a5a3c')).join('');
      } else if (st === 'beach') {
        o += S('M-224 -110 Q0 -96 232 -110', '#fff', 8) + motif('fish', -150, -116, 15) + motif('fish', -100, -86, 10) + tr(-190, -80, flowerG(0, 0, 12, '#ff7eb6'));
      } else {
        RB.forEach((col, i) => { o += R(-226, -140 + i * 9, 456, 8, 0, col, op(0.95)); });
        o += P(starD(-150, -86, 18), '#fff') + P(starD(-150, -86, 10), s.accent);
      }
      o += R(-236, -78, 30, 22, 6, '#4a4048') + R(226, -78, 30, 22, 6, '#4a4048') + headlight(226, -138, 12, on, 70) + tailLight(-226, -140, 10, 20, on);
      o += steer(90, -186) + wheel(-140, 48, s, st === 'woodland' ? 'woodland' : st) + wheel(140, 48, s, st === 'woodland' ? 'woodland' : st);
      return o;
    },
    x: { seats: [sit(40, -104), sit(-118, -108)] },
  };
}
const JEEPS = fam('car-jeep', 'Jeeps', 'cars', { mount: 'floor', w: 490, h: 300, toggle: true, sfx: 'boing' }, [
  jeep('woodland', 'Forest Trail Jeep'), jeep('beach', 'Surf Jeep'), jeep('rainbow', 'Rainbow Safari Jeep'),
], (i) => stylePrice(i, 70, 30, 200));

// ---------------- camper vans ----------------
function camper(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const top = st === 'retro' ? s.soft : '#ffffff';
      let o = shadow(240);
      if (st === 'beach') o += R(-200, -332, 300, 12, 5, SIL) + G(E(-80, -344, 150, 14, '#ff9ec7') + E(-80, -344, 150, 4, '#fff') + E(-60, -362, 130, 12, '#7cc8ff') + E(-60, -362, 130, 3.5, '#fff'), '');
      if (st === 'boho') o += R(-200, -332, 300, 12, 5, '#c98a5a') + box(-180, -362, 120, 32, 14, s.accent, 'stripes') + box(-50, -356, 100, 26, 12, '#5fd3b5', 'stripes');
      o += cloth('M-238 -150 L-238 -284 Q-238 -316 -206 -316 L150 -316 Q204 -314 224 -258 L242 -168 L242 -150Z', top, 'none', 'x');
      o += glass('M124 -160 L124 -292 L152 -292 Q190 -290 206 -250 L222 -160Z');
      for (const x of [-214, -94]) {
        o += glass(`M${x} -170 V-272 Q${x} -284 ${x + 12} -284 H${x + 92} Q${x + 104} -284 ${x + 104} -272 V-170Z`, '#fff1b8');
        o += P(`M${x} -284 H${x + 30} Q${x + 20} -240 ${x} -210Z`, st === 'boho' ? s.accent : st === 'beach' ? '#ff9ec7' : s.main) + P(`M${x + 104} -284 H${x + 74} Q${x + 84} -240 ${x + 104} -210Z`, st === 'boho' ? s.accent : st === 'beach' ? '#ff9ec7' : s.main);
      }
      if (st === 'boho') o += P(`M-214 -284 H-110${scallop(-110, -214, -284, 5, 4)}Z`, '#fff', op(0.8)) + motif('sun', -40, -298, 10);
      o += seatBack(160, -214, -152, s.soft, 70) + seatBack(-60, -220, -152, s.soft, 120);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-242 -60 L-242 -160 Q-242 -168 -232 -168 L234 -168 Q248 -166 250 -140 L252 -64 Q252 -44 232 -44' + under(-222, 150, -150, 54, -44) + ' Q-242 -44 -242 -60Z';
      let o = cloth(d, c, 'none', 'y') + shine(-226, -164, 460, 6, 0.4);
      if (st === 'retro') o += P('M200 -168 L250 -168 L250 -90 Q236 -110 200 -168Z', '#ffffff') + C(232, -132, 12, SIL) + motif('star', 232, -132, 7) + R(-250, -70, 504, 12, 6, SIL);
      else o += R(-250, -70, 504, 12, 6, '#4a4048');
      if (st === 'boho') { o += motif('sun', -150, -108, 22); for (let i = 0; i < 4; i++) o += tr(-60 + i * 50, -90 - (i % 2) * 22, flowerG(0, 0, 11, ['#ff7eb6', '#ffd36b', '#e8907a', '#5fd3b5'][i])); }
      if (st === 'beach') o += S('M-240 -112 Q-150 -132 -60 -112 T120 -112 T250 -112', '#fff', 6) + motif('fish', -170, -84, 12) + motif('fish', 40, -84, 10);
      if (st === 'retro') o += S('M-240 -122 H200', s.accent, 8) + S('M-240 -108 H190', s.trim, 6);
      o += S('M-30 -164 V-62', dark(c, 0.15), 2.5) + R(-60, -140, 22, 7, 3.5, dark(c, 0.22)) + door(100, 196, -164, -60, c);
      o += headlight(240, -112, 11, on, 50) + tailLight(-240, -130, 10, 24, on) + steer(196, -176) + wheel(-150, 42, s) + wheel(150, 42, s);
      return o;
    },
    x: { seats: [sit(160, -98), sit(-60, -102)] },
  };
}
const CAMPERS = fam('car-camper', 'Camper Vans', 'cars', { mount: 'floor', w: 510, h: 340, toggle: true, sfx: 'boing' }, [
  camper('boho', 'Sunny Boho Camper'), camper('beach', 'Surf Shack Camper'), camper('retro', 'Retro Road Trip Van'),
], (i) => stylePrice(i, 80, 30, 200));

// ---------------- pickups ----------------
function pickup(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(240);
      o += cloth('M-30 -150 L-30 -260 Q-30 -274 -16 -274 L74 -274 Q98 -272 142 -150Z', c) + glass('M-14 -160 L-14 -252 L70 -252 Q90 -250 120 -160Z');
      if (st === 'woodland') {
        o += [-232, -210].map((x, i) => R(x, -196 + i * 18, 150, 26, 13, s.wood) + E(x + 150, -183 + i * 18, 9, 13, light(s.wood, 0.4))).join('');
        o += R(-62, -200, 8, 40, 3, '#8a5a3c') + P('M-90 -196 L-58 -270 L-26 -196Z', dark(c, 0.15)) + P('M-84 -226 L-58 -290 L-32 -226Z', c) + P(starD(-58, -294, 8), s.accent);
      } else {
        o += box(-236, -196, 70, 46, 6, '#f4dca0') + [-226, -206, -186].map((x) => Ln(x, -194, x, -152, '#e8c070', 2)).join('');
        o += R(-80, -214, 34, 60, 8, '#c9cfdd') + R(-84, -218, 42, 10, 5, '#9aa3b5') + tr(-63, -230, flowerG(0, 0, 12, '#ff7eb6')) + tr(-48, -240, flowerG(0, 0, 9, '#ffd36b'));
      }
      o += seatBack(60, -214, -152, s.soft, 80);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-244 -60 L-244 -160 Q-244 -166 -238 -166 L-28 -166 L-24 -152 L130 -152 Q156 -150 204 -140 Q240 -134 242 -110 L242 -60 Q242 -44 226 -44' + under(-226, 150, -150, 56, -44) + ' Q-244 -44 -244 -60Z';
      let o = cloth(d, c, st === 'cottage' ? 'check' : 'none', 'y') + shine(-232, -162, 200, 5, 0.4) + S('M-24 -152 V-60', dark(c, 0.16), 3);
      o += door(0, 120, -148, -60, c);
      if (st === 'woodland') o += motif('leaf', -150, -110, 20) + motif('leaf', -110, -100, 12) + R(234, -90, 18, 40, 6, '#6b4a3a');
      else o += tr(-150, -108, flowerG(0, 0, 18, '#ffffff', '#ffd36b')) + tr(-104, -96, flowerG(0, 0, 11, '#ff9ec7'));
      o += R(-252, -74, 28, 18, 6, SIL) + R(226, -74, 26, 18, 6, SIL) + headlight(232, -118, 11, on, 60) + tailLight(-240, -138, 9, 22, on);
      o += steer(116, -172) + wheel(-150, 44, s) + wheel(150, 44, s);
      return o;
    },
    x: { seats: [sit(60, -96), sit(-140, -122)] },
  };
}
const PICKUPS = fam('car-pickup', 'Pickup Trucks', 'cars', { mount: 'floor', w: 500, h: 300, toggle: true, sfx: 'boing' }, [
  pickup('woodland', 'Lumberjack Pickup'), pickup('cottage', 'Flower Farm Pickup'),
], (i) => stylePrice(i, 70, 30, 200));

// ---------------- sports cars ----------------
function sports(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(240);
      if (st === 'space' && on) o += E(0, -8, 230, 16, '#7fe8ff', op(0.35));
      const wing = st === 'rainbow' ? RB[0] : st === 'space' ? s.accent : INK;
      o += R(-226, -188, 12, 50, 4, wing) + boxT(-250, -204, 90, 18, 9, 4, wing);
      if (st === 'rainbow') o += RB.slice(1).map((col, i) => R(-248 + i * 15, -200, 14, 10, 3, col)).join('');
      o += glass('M-130 -134 Q-104 -234 -6 -236 Q78 -232 128 -132Z', st === 'space' ? '#cfe0ff' : '#d9efff') + S('M-130 -134 Q-104 -234 -6 -236 Q78 -232 128 -132', st === 'space' ? s.metal : dark(c, 0.25), 6);
      o += seatBack(-20, -210, -136, st === 'modern' ? '#4a4a5e' : s.soft, 90);
      if (st === 'space' && on) o += G(`<g>${`<animateTransform attributeName="transform" type="scale" values="1 1;1.25 0.9;1 1" dur="0.3s" repeatCount="indefinite" additive="sum"/>`}${P('M-250 -100 L-310 -86 L-250 -72Z', '#ff8a3d')}${P('M-250 -94 L-284 -86 L-250 -78Z', '#ffd84a')}</g>`, 'translate(0 0)');
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-246 -70 Q-250 -128 -222 -136 L-90 -140 Q40 -150 124 -134 Q204 -118 246 -98 Q252 -78 242 -60 Q238 -40 220 -40' + under(-224, 150, -150, 52, -40) + ' Q-246 -40 -246 -70Z';
      let o = cloth(d, c, 'none', 'y') + S('M-220 -128 Q0 -140 220 -102', '#fff', 4, op(0.55)) + door(-80, 70, -136, -60, c, true);
      if (st === 'modern') o += P('M-246 -116 L246 -92 L246 -82 L-246 -104Z', INK) + C(-150, -92, 22, '#ffffff') + txt(-150, -83, 26, INK, '7');
      if (st === 'space') o += P('M-200 -132 L-250 -170 L-232 -128Z', s.accent) + P(starD(-150, -96, 18), s.accent) + C(-90, -80, 6, '#7fe8ff') + C(-60, -76, 4, '#fff') + S('M-240 -60 H230', '#7fe8ff', 3, op(0.8));
      if (st === 'rainbow') RB.forEach((col, i) => { o += S(`M-240 ${-112 + i * 7} Q0 ${-128 + i * 7} 240 ${-90 + i * 4}`, col, 6); });
      o += P('M210 -112 Q236 -106 240 -96 L226 -96 Q214 -100 210 -112Z', on ? '#fffbe0' : '#f4f6ff', 'stroke="#c9cfdd" stroke-width="1.5"') + (on ? P('M240 -104 L310 -124 L310 -70 L240 -92Z', '#fff6c8', op(0.45)) + glow(234, -102, 30) : '');
      o += tailLight(-238, -120, 14, 10, on) + steer(60, -150) + wheel(-150, 40, s) + wheel(150, 40, s);
      return o;
    },
    x: { seats: [sit(-20, -92)] },
  };
}
const SPORTS = fam('car-sports', 'Sports Cars', 'cars', { mount: 'floor', w: 510, h: 250, toggle: true, sfx: 'boing' }, [
  sports('modern', 'Speedy Racer'), sports('space', 'Comet Rocket Car'), sports('rainbow', 'Rainbow Zoomer'),
], (i) => stylePrice(i, 100, 30, 200));

// ---------------- limousines ----------------
function limo(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      const roofC = st === 'modern' ? '#4a4a5e' : c;
      let o = shadow(250) + cloth('M-236 -150 L-214 -262 Q-210 -274 -196 -274 L96 -274 Q120 -274 142 -248 L192 -150Z', roofC);
      for (const [x1, x2] of [[-206, -90], [-74, 46], [62, 160]]) o += glass(`M${x1} -160 L${x1 + (x1 === -206 ? 14 : 0)} -256 L${x2 === 160 ? 92 : x2} -256 ${x2 === 160 ? 'Q110 -254 124 -236 ' : ''}L${x2} -160Z`, st === 'modern' ? '#b8c4e8' : '#e6f4ff');
      if (st === 'princess') o += motif('crown', -40, -292, 22) + S('M-216 -266 H130', GOLD, 4);
      else o += R(-120, -282, 140, 10, 5, SIL) + (on ? [-100, -60, -20].map((x, i) => twinkle(x, -230, 8, TOYC[i], 1.2, i * 0.3)).join('') : '');
      o += seatBack(110, -212, -150, s.soft, 84) + seatBack(-20, -214, -150, s.soft, 84) + seatBack(-150, -216, -150, s.soft, 84);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-256 -62 Q-258 -150 -226 -152 L180 -152 Q238 -150 254 -112 L256 -62 Q256 -40 236 -40' + under(-236, 170, -170, 50, -40) + ' Q-256 -40 -256 -62Z';
      let o = cloth(d, c, 'none', 'y') + shine(-230, -148, 430, 6, 0.45);
      o += door(-90, 40, -146, -58, c) + door(56, 160, -146, -58, c);
      if (st === 'princess') o += S('M-250 -116 Q0 -108 254 -116', GOLD, 5) + motif('heart', -170, -96, 14) + P('M250 -130 Q266 -150 252 -166', 'none', `stroke="${GOLD}" stroke-width="4"`) + motif('crown', 252, -178, 10);
      else o += R(-256, -122, 512, 8, 4, SIL) + motif('star', -170, -92, 13);
      o += R(-264, -70, 32, 14, 7, SIL) + R(234, -70, 30, 14, 7, SIL) + headlight(244, -112, 10, on, 60) + tailLight(-248, -118, 10, 20, on) + steer(166, -170, st === 'princess' ? '#e0b040' : INK);
      o += wheel(-170, 38, s) + wheel(170, 38, s);
      return o;
    },
    x: { seats: [sit(110, -96), sit(-20, -98), sit(-150, -100)] },
  };
}
const LIMOS = fam('car-limo', 'Limousines', 'cars', { mount: 'floor', w: 520, h: 300, toggle: true, sfx: 'ding' }, [
  limo('princess', 'Royal Limo'), limo('modern', 'Party Star Limo'),
], (i) => stylePrice(i, 120, 30, 200));

// ---------------- bubble bugs (beetle-style) ----------------
function beetle(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(210);
      if (st === 'cottage') o += R(-120, -300, 200, 8, 4, '#8a5a3c') + box(-100, -334, 90, 36, 10, '#e8b46a') + S('M-92 -334 Q-55 -366 -18 -334', '#c98a5a', 4) + cloth('M-104 -318 H-6 V-300 H-104Z', '#ff9ec7', 'check') + tr(30, -310, flowerG(0, 0, 13, '#ff7eb6')) + tr(54, -306, flowerG(0, 0, 10, '#ffd36b'));
      if (st === 'candy') o += S('M-60 -286 Q-70 -320 -90 -334', INK, 3) + S('M30 -288 Q40 -322 60 -334', INK, 3) + C(-90, -338, 12, '#ff4f8b') + C(60, -338, 12, '#7cc8ff') + S('M-96 -338 Q-90 -330 -84 -338', '#fff', 2.5) + S('M54 -338 Q60 -330 66 -338', '#fff', 2.5);
      if (st === 'retro') o += R(-110, -296, 170, 8, 4, SIL) + box(-96, -322, 70, 28, 6, '#c98a5a') + box(-20, -316, 60, 22, 6, s.accent);
      o += cloth('M-176 -150 Q-168 -292 -14 -294 Q122 -292 156 -150Z', c, st === 'candy' ? 'dots' : 'none') + glass('M-146 -156 Q-136 -266 -14 -270 Q100 -268 128 -156Z');
      o += Ln(-24, -268, -24, -158, c, 8) + seatBack(40, -214, -152, s.soft, 82) + seatBack(-90, -218, -152, s.soft, 82);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-204 -60 Q-212 -150 -150 -156 L132 -156 Q204 -150 208 -90 L208 -60 Q208 -40 188 -40' + under(-186, 130, -130, 50, -40) + ' Q-204 -40 -204 -60Z';
      let o = cloth(d, c, st === 'candy' ? 'dots' : 'none', 'y') + shine(-170, -150, 320, 6, 0.4);
      for (const x of [-130, 130]) o += P(`M${x - 66} -42 Q${x - 66} -118 ${x} -120 Q${x + 66} -118 ${x + 66} -42 L${x + 52} -42 Q${x + 50} -102 ${x} -104 Q${x - 50} -102 ${x - 52} -42Z`, dark(c, 0.1));
      o += door(-60, 70, -150, -66, c);
      if (st === 'retro') o += R(-214, -72, 50, 14, 7, SIL) + R(170, -72, 50, 14, 7, SIL) + S('M-60 -100 H70', s.trim, 5);
      else if (st === 'cottage') o += tr(-10, -108, flowerG(0, 0, 18, '#ffffff', '#ffd36b')) + tr(30, -86, flowerG(0, 0, 11, '#ff9ec7')) + tr(-40, -82, flowerG(0, 0, 9, '#c99bff')) + R(-214, -72, 44, 14, 7, '#fff') + R(176, -72, 40, 14, 7, '#fff');
      else o += C(-10, -100, 14, INK, op(0.85)) + C(40, -120, 10, INK, op(0.85)) + C(30, -78, 9, INK, op(0.85)) + R(-214, -72, 44, 14, 7, '#ff4f8b') + R(176, -72, 40, 14, 7, '#ff4f8b');
      o += headlight(178, -118, 13, on, 60) + tailLight(-196, -114, 10, 18, on) + steer(94, -172);
      o += wheel(-130, 36, s, st === 'retro' ? 'retro' : st) + wheel(130, 36, s, st === 'retro' ? 'retro' : st);
      return o;
    },
    x: { seats: [sit(40, -98), sit(-90, -100)] },
  };
}
const BEETLES = fam('car-bug', 'Bubble Bugs', 'cars', { mount: 'floor', w: 430, h: 330, toggle: true, sfx: 'boing' }, [
  beetle('retro', 'Retro Bubble Bug'), beetle('cottage', 'Picnic Bug'), beetle('candy', 'Ladybug Gumdrop'),
], (i) => stylePrice(i, 60, 30, 200));

// ---------------- ice cream trucks ----------------
function iceTruck(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(240);
      // a giant cone on the roof
      o += tr(-180, -306, P('M-22 -30 L22 -30 L0 30Z', '#e8b46a') + S('M-14 -18 L8 18 M14 -18 L-8 18', '#c98a5a', 2) + C(0, -42, 22, st === 'candy' ? '#ffb3c7' : '#a8e6cf') + C(-8, -62, 16, '#fff3d8') + C(0, -80, 7, '#e8384f'), 0.9);
      o += cloth('M-240 -150 L-240 -296 Q-240 -312 -224 -312 L100 -312 Q116 -312 116 -296 L116 -150Z', st === 'candy' ? '#fff3f8' : '#ffffff');
      o += P(`M-240 -312 H116 V-292${scallop(116, -240, -292, 9, 8)}Z`, c);
      o += glass('M-190 -160 V-250 H70 V-160Z', on ? '#fff1b8' : '#e6f6ff');
      for (let i = 0; i < 6; i++) o += P(`M${-200 + i * 46} -262 H${-154 + i * 46} V-240 Q${-177 + i * 46} -226 ${-200 + i * 46} -240Z`, i % 2 ? '#ffffff' : st === 'candy' ? s.trim : '#ff9ec7');
      o += cloth('M110 -150 L110 -270 Q110 -282 124 -282 L196 -282 Q222 -280 236 -236 L250 -150Z', c) + glass('M126 -160 L126 -262 L190 -262 Q210 -260 222 -230 L232 -160Z');
      o += seatBack(170, -212, -150, s.soft, 70);
      if (on) o += [-160, -40, 40].map((x, i) => twinkle(x, -288, 7, '#fff', 1.4, i * 0.4)).join('');
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-246 -60 L-246 -160 Q-246 -166 -238 -166 L232 -166 Q252 -160 254 -120 L254 -62 Q254 -44 236 -44' + under(-226, 160, -150, 54, -44) + ' Q-246 -44 -246 -60Z';
      let o = cloth(d, c, st === 'candy' ? 'dots' : 'none', 'y') + R(-200, -174, 280, 14, 6, '#ffffff') + R(-200, -174, 280, 4, 2, dark(c, 0.1));
      if (st === 'candy') o += P(`M-246 -166 H254 V-148${scallop(254, -246, -148, 12, 6)}Z`, '#fff3f8') + tr(-120, -96, motif('icecream', 0, 0, 22)) + tr(-50, -96, motif('cupcake', 0, 0, 16));
      else o += R(-150, -132, 90, 70, 12, '#fff') + tr(-105, -88, R(-8, -28, 16, 36, 8, '#ff9ec7') + R(-8, -28, 16, 12, 6, '#ffffff', op(0.5)) + R(-2, 8, 4, 14, 2, '#e8c88a') + P(heartD(0, -10, 6), '#fff')) + tr(-40, -96, motif('icecream', 0, 0, 18));
      o += S('M100 -160 V-62', dark(c, 0.15), 2.5) + R(-254, -74, 30, 16, 6, '#ffffff') + R(232, -74, 28, 16, 6, '#ffffff');
      o += headlight(244, -116, 11, on, 50) + tailLight(-240, -130, 10, 22, on) + steer(210, -176) + wheel(-150, 42, s) + wheel(160, 42, s);
      return o;
    },
    x: { seats: [sit(170, -96), sit(-60, -114)] },
  };
}
const ICETRUCKS = fam('car-icecream', 'Ice Cream Trucks', 'cars', { mount: 'floor', w: 510, h: 380, toggle: true, sfx: 'ding', spawn: ['iceCone', 'popsicle'] }, [
  iceTruck('candy', 'Sprinkle Ice Cream Truck'), iceTruck('sweet', 'Popsicle Party Truck'),
], (i) => stylePrice(i, 90, 30, 200));

// ---------------- town sedans: taxis and helper patrol cars ----------------
type SedanKind = 'taxi' | 'patrol';
function sedan(kind: SedanKind, st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(220) + cloth('M-182 -148 L-142 -250 Q-136 -262 -120 -262 L42 -262 Q62 -262 78 -244 L142 -148Z', c);
      o += glass('M-160 -156 L-128 -240 L-48 -240 L-48 -156Z') + glass('M-34 -156 L-34 -240 L38 -240 Q52 -240 62 -228 L114 -156Z');
      if (kind === 'taxi') {
        o += boxT(-90, -294, 110, 32, 10, 4, st === 'modern' ? '#ffffff' : '#ffe680') + txt(-35, -270, 20, INK, 'TAXI') + (on ? glow(-35, -280, 60) : '');
      } else {
        const a = st === 'space' ? '#7fe8ff' : '#ff7eb6';
        const b = st === 'space' ? '#ffe680' : '#7cc8ff';
        o += R(-100, -270, 130, 10, 5, '#ffffff');
        o += on ? flash(boxT(-96, -292, 60, 24, 12, 4, a) + glow(-66, -280, 50), 0.6) + flash(boxT(-34, -292, 60, 24, 12, 4, b) + glow(-4, -280, 50), 0.6, 0.3) : boxT(-96, -292, 60, 24, 12, 4, light(a, 0.3)) + boxT(-34, -292, 60, 24, 12, 4, light(b, 0.3));
      }
      o += seatBack(30, -212, -150, s.soft, 84) + seatBack(-110, -216, -150, s.soft, 84);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-226 -62 Q-230 -140 -200 -146 L-150 -150 L90 -150 Q190 -146 220 -120 Q230 -110 228 -62 Q228 -40 208 -40' + under(-206, 135, -135, 50, -40) + ' Q-226 -40 -226 -62Z';
      let o = cloth(d, c, 'none', 'y') + shine(-190, -146, 320, 5, 0.4) + door(-150, -40, -146, -58, c) + door(-30, 96, -146, -58, c);
      if (kind === 'taxi') {
        for (let i = 0; i < 22; i++) o += R(-220 + i * 20, -118 + (i % 2) * 8, 10, 8, 0, st === 'modern' ? '#2d6a5a' : INK) + R(-210 + i * 20, -118 + ((i + 1) % 2) * 8, 10, 8, 0, '#ffffff');
        if (st === 'modern') o += motif('bolt', -96, -80, 13) + motif('leaf', 20, -80, 12);
      } else {
        o += P(starD(-96, -96, 22), GOLD) + P(starD(-96, -96, 12), '#fff') + S('M-224 -122 H226', st === 'space' ? s.accent : '#ff7eb6', 8) + txt(40, -80, 18, st === 'space' ? '#ffffff' : '#ff4f8b', st === 'space' ? 'PATROL' : 'HELPER');
        if (st === 'space') o += P(starD(150, -100, 8), s.accent) + C(-180, -84, 4, '#fff');
      }
      o += R(-234, -72, 30, 14, 7, SIL) + R(206, -72, 30, 14, 7, SIL) + headlight(214, -112, 11, on, 60) + tailLight(-220, -116, 9, 20, on) + steer(70, -170);
      o += wheel(-135, 38, s, kind === 'taxi' && st === 'retro' ? 'retro' : st) + wheel(135, 38, s, kind === 'taxi' && st === 'retro' ? 'retro' : st);
      return o;
    },
    x: { seats: [sit(30, -96), sit(-110, -98)], ...(kind === 'taxi' && st === 'retro' ? { color: '#ffd23a' } : kind === 'taxi' ? { color: '#7fe0c0' } : st === 'sweet' ? { color: '#ffffff' } : {}) },
  };
}
const TAXIS = fam('car-taxi', 'Taxis', 'cars', { mount: 'floor', w: 470, h: 310, toggle: true, sfx: 'boing' }, [
  sedan('taxi', 'retro', 'Checker Taxi'), sedan('taxi', 'modern', 'Eco Taxi'),
], (i) => stylePrice(i, 60, 30, 200));
const PATROLS = fam('car-patrol', 'Helper Cars', 'cars', { mount: 'floor', w: 470, h: 310, toggle: true, sfx: 'ding' }, [
  sedan('patrol', 'sweet', 'Friendly Helper Car'), sedan('patrol', 'space', 'Space Patrol Car'),
], (i) => stylePrice(i, 60, 30, 200));

// ---------------- fire trucks ----------------
function fireTruck(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(250);
      // ladder on top
      const rail = st === 'rainbow' ? '#ffffff' : SIL;
      o += R(-246, -214, 340, 8, 4, rail) + R(-246, -238, 340, 8, 4, rail);
      for (let i = 0; i < 12; i++) o += R(-240 + i * 28, -236, 6, 28, 3, st === 'rainbow' ? RB[i % 6] : '#c9cfdd');
      o += R(60, -216, 16, 50, 4, '#4a4048') + cloth('M90 -150 L90 -286 Q90 -298 104 -298 L196 -298 Q222 -296 236 -256 L252 -150Z', c) + glass('M108 -160 L108 -278 L190 -278 Q210 -276 222 -246 L234 -160Z');
      const a = st === 'rainbow' ? '#ff7eb6' : '#ff5d73';
      o += on ? flash(boxT(110, -318, 50, 22, 11, 4, a) + glow(135, -308, 46), 0.5) + flash(boxT(170, -318, 50, 22, 11, 4, '#7cc8ff') + glow(195, -308, 46), 0.5, 0.25) : boxT(110, -318, 50, 22, 11, 4, light(a, 0.3)) + boxT(170, -318, 50, 22, 11, 4, '#bfe3ff');
      o += seatBack(160, -212, -150, s.soft, 70) + seatBack(-150, -226, -170, '#4a4048', 90);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-252 -60 L-252 -176 Q-252 -184 -244 -184 L80 -184 L84 -160 L236 -160 Q256 -156 258 -120 L258 -62 Q258 -44 240 -44' + under(-232, 160, -160, 54, -44) + ' Q-252 -44 -252 -60Z';
      let o = cloth(d, c, 'none', 'y') + shine(-240, -180, 310, 6, 0.4);
      for (const x of [-236, -160, -84]) o += R(x, -170, 64, 60, 8, dark(c, 0.08)) + R(x + 6, -164, 52, 6, 3, '#fff', op(0.3)) + R(x + 24, -124, 16, 6, 3, SIL);
      o += C(30, -130, 30, SIL) + C(30, -130, 22, st === 'rainbow' ? '#ffd36b' : '#ffe680') + S('M30 -130 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', '#e8b83a', 4) + C(30, -130, 5, INK);
      o += R(-252, -96, 334, 10, 0, '#ffffff') + (st === 'rainbow' ? RB.map((col, i) => R(-252 + i * 56, -96, 56, 10, 0, col)).join('') : '');
      o += S('M96 -156 V-62', dark(c, 0.15), 2.5) + R(110, -140, 22, 7, 3.5, dark(c, 0.22)) + P(starD(180, -110, 16), GOLD) + P(starD(180, -110, 8), '#fff');
      o += R(-262, -74, 30, 16, 6, SIL) + R(236, -74, 30, 16, 6, SIL) + headlight(248, -120, 11, on, 50) + tailLight(-246, -150, 10, 22, on) + steer(214, -176);
      o += wheel(-160, 42, s, st === 'retro' ? 'retro' : st) + wheel(160, 42, s, st === 'retro' ? 'retro' : st);
      return o;
    },
    x: { seats: [sit(160, -96), sit(-150, -132)], ...(st === 'retro' ? { color: '#ff5d5d' } : {}) },
  };
}
const FIRETRUCKS = fam('car-firetruck', 'Fire Trucks', 'cars', { mount: 'floor', w: 520, h: 340, toggle: true, sfx: 'ding' }, [
  fireTruck('retro', 'Classic Fire Truck'), fireTruck('rainbow', 'Rainbow Rescue Truck'),
], (i) => stylePrice(i, 90, 30, 200));

// ---------------- school buses ----------------
function schoolBus(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(250) + cloth('M-250 -150 L-250 -286 Q-250 -306 -230 -306 L176 -306 Q204 -304 216 -276 L236 -150Z', c);
      for (const x of [-232, -150, -68, 14]) o += glass(`M${x} -170 V-282 H${x + 70} V-170Z`, '#e6f6ff') + R(x, -232, 70, 6, 3, dark(c, 0.15), op(0.5));
      o += glass('M110 -170 V-286 H170 Q190 -284 200 -262 L214 -170Z');
      o += R(-250, -306, 486, 12, 6, st === 'rainbow' ? '#ffffff' : dark(c, 0.12));
      if (st === 'rainbow') RB.forEach((col, i) => { o += R(-240 + i * 70, -304, 60, 8, 4, col); });
      o += seatBack(150, -214, -152, s.soft, 70) + seatBack(10, -216, -152, '#7a9adf', 90) + seatBack(-130, -218, -152, '#7a9adf', 90);
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-252 -60 L-252 -162 Q-252 -168 -244 -168 L240 -168 Q258 -164 260 -130 L260 -62 Q260 -44 242 -44' + under(-232, 162, -162, 52, -44) + ' Q-252 -44 -252 -60Z';
      let o = cloth(d, c, 'none', 'y') + R(-252, -150, 512, 6, 0, INK, op(0.75)) + R(-252, -100, 512, 6, 0, INK, op(0.75));
      if (st === 'rainbow') RB.forEach((col, i) => { o += R(-252 + i * 85, -144, 86, 44, 0, col, op(0.85)); });
      o += txt(-10, -110, 26, INK, 'SCHOOL BUS') + R(200, -160, 50, 96, 6, dark(c, 0.08)) + Ln(225, -158, 225, -66, dark(c, 0.2), 2);
      o += G(R(-276, -150, 8, 36, 3, '#4a4048') + C(-280, -150, 16, '#ff5d73') + txt(-280, -145, 9, '#fff', 'STOP'));
      o += R(-262, -74, 30, 16, 6, INK) + R(240, -74, 30, 16, 6, INK) + headlight(250, -120, 11, on, 50) + tailLight(-244, -130, 10, 22, on) + steer(196, -176);
      o += wheel(-162, 40, s) + wheel(162, 40, s);
      return o;
    },
    x: { seats: [sit(150, -96), sit(10, -98), sit(-130, -98)], ...(st === 'retro' ? { color: '#ffd23a' } : {}) },
  };
}
const BUSES = fam('car-schoolbus', 'School Buses', 'cars', { mount: 'floor', w: 530, h: 340, toggle: true, sfx: 'ding' }, [
  schoolBus('retro', 'Yellow School Bus'), schoolBus('rainbow', 'Rainbow School Bus'),
], (i) => stylePrice(i, 90, 30, 200));

// ---------------- golf carts ----------------
function golfCart(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(180);
      o += R(-156, -300, 8, 160, 4, '#ffffff') + R(116, -300, 8, 160, 4, '#ffffff') + boxT(-176, -318, 320, 26, 12, 6, c, st === 'cottage' ? 'stripes' : 'none');
      o += P(`M-176 -294 H144${scallop(144, -176, -294, 10, 6)}Z`, st === 'cottage' ? '#ffffff' : light(c, 0.3));
      if (st === 'sweet') o += [-120, -60, 0, 60].map((x) => P(heartD(x, -312, 10), '#fff')).join('');
      else o += tr(-150, -324, flowerG(0, 0, 10, '#ff9ec7')) + tr(120, -324, flowerG(0, 0, 10, '#ffd36b'));
      o += glass('M120 -150 L104 -280 L114 -284 L134 -150Z', '#e6f6ff');
      o += seatBack(20, -206, -146, s.soft, 96) + seatBack(-100, -208, -146, s.soft, 96);
      if (st === 'cottage') o += box(-200, -190, 50, 50, 8, '#e8b46a') + tr(-186, -194, flowerG(0, 0, 10, '#ff7eb6')) + tr(-166, -198, flowerG(0, 0, 9, '#ffffff'));
      else o += R(-190, -220, 14, 80, 6, '#ffffff') + C(-183, -222, 9, '#ffd36b');
      return o;
    },
    front: (c, on, s) => {
      let d = 'M-178 -56 L-178 -146 Q-178 -152 -170 -152 L70 -152 Q120 -150 150 -112 Q176 -88 178 -64 Q178 -40 160 -40' + under(-158, 120, -110, 40, -40) + ' Q-178 -40 -178 -56Z';
      let o = cloth(d, c, st === 'cottage' ? 'flowers' : 'none', 'y') + R(-178, -116, 260, 10, 5, '#ffffff', op(0.85));
      if (st === 'sweet') o += P(heartD(-60, -80, 20), '#fff') + P(heartD(-60, -77, 11), light(c, 0.1));
      o += headlight(166, -92, 9, on, 46) + tailLight(-174, -120, 8, 16, on) + steer(96, -168) + wheel(-110, 30, s) + wheel(120, 30, s);
      return o;
    },
    x: { seats: [sit(20, -100), sit(-100, -102)] },
  };
}
const GOLFCARTS = fam('car-golfcart', 'Golf Carts', 'cars', { mount: 'floor', w: 400, h: 340, toggle: true, sfx: 'ding' }, [
  golfCart('sweet', 'Sweetheart Golf Cart'), golfCart('cottage', 'Garden Golf Cart'),
], (i) => stylePrice(i, 50, 30, 200));

// ---------------- scooters ----------------
function scooter(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = shadow(150);
      o += Ln(96, -76, 74, -232, SIL, 8) + Ln(56, -236, 104, -236, INK, 7);
      if (st === 'modern') o += C(-150, -186, 22, s.accent) + R(-170, -190, 40, 10, 4, '#7fe8ff', op(0.6)) + Ln(-150, -164, -130, -150, s.accent, 3);
      return o;
    },
    front: (c, on, s) => {
      let o = cloth('M-160 -80 Q-170 -156 -90 -160 L-10 -160 Q30 -158 34 -120 L34 -84 Q30 -60 0 -58 L-160 -58Z', c, 'none', 'y') + shine(-140, -152, 140, 6, 0.45);
      o += boxT(-130, -176, 140, 24, 12, 6, st === 'modern' ? INK : s.soft) + R(-120, -172, 110, 4, 2, '#fff', op(0.4));
      o += R(0, -66, 100, 16, 8, dark(c, 0.15)) + cloth('M78 -66 Q70 -170 92 -222 L112 -222 Q114 -150 112 -66Z', c, 'none', 'x');
      o += P('M82 -60 Q100 -94 128 -70 L128 -58Z', c) + headlight(92, -238, 11, on, 50);
      if (st === 'sweet') o += P(heartD(-80, -110, 22), '#fff') + P(heartD(-80, -107, 12), light(c, 0.1)) + tr(124, -210, box(-24, -40, 48, 40, 8, '#e8b46a') + tr(-10, -44, flowerG(0, 0, 10, '#ff7eb6')) + tr(10, -48, flowerG(0, 0, 9, '#ffffff')));
      else o += R(-160, -112, 194, 8, 4, s.accent) + motif('bolt', -60, -88, 12);
      o += tailLight(-160, -118, 8, 16, on) + wheel(-110, 34, s) + wheel(110, 34, s);
      return o;
    },
    x: { seats: [sit(-60, -150)] },
  };
}
const SCOOTERS = fam('car-scooter', 'Scooters', 'cars', { mount: 'floor', w: 340, h: 270, toggle: true, sfx: 'ding' }, [
  scooter('sweet', 'Flower Basket Scooter'), scooter('modern', 'City Moped'),
], (i) => stylePrice(i, 40, 20, 200));

// ---------------- bikes ----------------
function bike(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const fr = st === 'rainbow' ? RB[5] : c;
      let o = shadow(150) + wheel(-100, 56, s, 'spoke', st === 'rainbow' ? RB[0] : s.accent);
      if (st === 'rainbow') o += C(-100, -56, 40, 'none', `stroke="${RB[2]}" stroke-width="4" ${op(0.6)}`);
      o += S('M-100 -56 L-40 -140 L60 -130 L-10 -56 Z M-10 -56 L-100 -56 M60 -130 L100 -56', fr, 8);
      if (st === 'rainbow') o += S('M-100 -56 L-40 -140', RB[0], 8) + S('M-40 -140 L60 -130', RB[2], 8) + S('M60 -130 L-10 -56', RB[3], 8) + S('M-10 -56 L-100 -56', RB[4], 8);
      o += Ln(-40, -140, -46, -160, SIL, 5) + C(-10, -56, 12, SIL) + Ln(-10, -56, -2, -36, SIL, 4);
      o += S('M-130 -100 Q-100 -114 -70 -100', fr, 6);
      return o;
    },
    front: (c, on, s) => {
      let o = boxT(-78, -170, 70, 20, 10, 6, st === 'woodland' ? '#6b4a3a' : s.soft);
      o += Ln(60, -130, 72, -190, SIL, 6) + S('M54 -194 Q72 -204 96 -190', INK, 6) + wheel(100, 56, s, 'spoke', st === 'rainbow' ? RB[4] : s.accent);
      if (st === 'rainbow') o += C(100, -56, 40, 'none', `stroke="${RB[1]}" stroke-width="4" ${op(0.6)}`);
      if (st === 'sweet') {
        o += P('M86 -186 L140 -186 L132 -144 L94 -144Z', '#f4dca0') + S('M90 -176 H136 M92 -164 H134 M94 -152 H132', '#e8c070', 2) + tr(102, -190, flowerG(0, 0, 10, '#ff7eb6')) + tr(124, -194, flowerG(0, 0, 9, '#fff'));
        o += swayG(S('M92 -192 Q80 -170 88 -150', '#ff7eb6', 3) + S('M96 -192 Q88 -168 98 -152', '#7cc8ff', 3), 94, -192, 8, 1.4);
      } else if (st === 'woodland') {
        o += box(84, -184, 60, 40, 4, '#c98a5a') + S('M84 -170 H144', '#a86b4a', 2) + C(100, -190, 10, '#e8384f') + C(120, -192, 10, '#ffab5e') + leafD(132, -196, 9, c);
      } else o += P(starD(76, -210, 12), s.accent);
      o += C(66, -196, 6, '#ffd36b') + headlight(78, -176, 7, on, 50);
      return o;
    },
    x: { seats: [sit(-44, -160)] },
  };
}
const leafD = (x: number, y: number, r: number, c: string) => P(`M${f(x)} ${f(y)} Q${f(x + r)} ${f(y - r)} ${f(x)} ${f(y - r * 2)} Q${f(x - r)} ${f(y - r)} ${f(x)} ${f(y)}Z`, c);
const BIKES = fam('car-bike', 'Bikes', 'cars', { mount: 'floor', w: 320, h: 250, toggle: true, sfx: 'ding' }, [
  bike('sweet', 'Basket Bike'), bike('rainbow', 'Rainbow Bike'), bike('woodland', 'Apple Picker Bike'),
], (i) => stylePrice(i, 30, 20, 200));

// ---------------- tractors ----------------
function tractor(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(210) + R(120, -300, 16, 130, 6, '#4a4048') + R(116, -306, 24, 12, 4, '#4a4048');
      if (on) o += `<g opacity="0.8">${[0, 1, 2].map((i) => `<circle cx="128" cy="-316" r="${10 + i * 3}" fill="#ffffff"><animate attributeName="cy" values="-316;-400" dur="2s" begin="${f(-i * 0.66)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="2s" begin="${f(-i * 0.66)}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      if (st === 'cottage') o += box(-226, -170, 60, 60, 6, '#f2d36b') + S('M-220 -150 H-172 M-220 -130 H-172', '#d9b04a', 2);
      o += seatBack(-110, -240, -166, s.soft, 80) + steer(-40, -196);
      return o;
    },
    front: (c, on, s) => {
      let o = cloth('M-50 -80 L-50 -170 Q-50 -184 -36 -184 L170 -184 Q204 -180 208 -140 L208 -80Z', c, 'none', 'y') + R(-40, -178, 240, 6, 3, '#fff', op(0.35));
      for (let i = 0; i < 6; i++) o += R(150, -170 + i * 14, 50, 6, 3, dark(c, 0.2));
      o += R(-196, -172, 170, 14, 7, dark(c, 0.1)) + headlight(200, -158, 10, on, 50);
      o += P('M-210 -96 Q-210 -196 -110 -196 Q-10 -196 -10 -96 L-26 -96 Q-26 -180 -110 -180 Q-194 -180 -194 -96Z', dark(c, 0.15));
      if (st === 'cottage') o += tr(60, -130, flowerG(0, 0, 18, '#fff')) + tr(100, -116, flowerG(0, 0, 11, '#ff9ec7'));
      else o += motif('leaf', 60, -130, 18) + motif('leaf', 96, -116, 11);
      o += wheel(-110, 80, s, 'woodland') + wheel(150, 44, s, 'woodland');
      return o;
    },
    x: { seats: [sit(-110, -164)] },
  };
}
const TRACTORS = fam('car-tractor', 'Tractors', 'cars', { mount: 'floor', w: 450, h: 330, toggle: true, sfx: 'boing' }, [
  tractor('cottage', 'Hay Day Tractor'), tractor('woodland', 'Forest Farm Tractor'),
], (i) => stylePrice(i, 60, 30, 200));

// ---------------- go-karts ----------------
function goKart(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(170) + seatBack(-40, -150, -70, st === 'space' ? s.soft : INK, 80) + Ln(-120, -80, -120, -220, '#9aa3b5', 3);
      o += st === 'rainbow' ? swayG(P('M-120 -220 L-60 -206 L-120 -190Z', RB[0]) + P('M-120 -206 L-80 -200 L-120 -194Z', RB[2]), -120, -206, 6, 1) : P(starD(-120, -224, 14), s.accent);
      if (st === 'space' && on) o += P('M-170 -70 L-220 -60 L-170 -50Z', '#ff8a3d') + P('M-170 -66 L-196 -60 L-170 -54Z', '#ffd84a');
      return o;
    },
    front: (c, on, s) => {
      let o = cloth('M-170 -40 L-170 -76 Q-170 -86 -160 -86 L-20 -86 Q20 -86 40 -100 L150 -90 Q180 -86 180 -60 L180 -40Z', c, 'none', 'y') + shine(-150, -82, 300, 5, 0.4);
      o += steer(30, -110) + R(160, -66, 30, 20, 8, INK);
      if (st === 'rainbow') { o += C(-80, -62, 18, '#fff') + txt(-80, -54, 22, INK, '1'); RB.forEach((col, i) => { o += R(20 + i * 22, -78, 20, 8, 3, col); }); }
      else o += P(starD(-80, -62, 16), s.accent) + C(60, -60, 5, '#7fe8ff') + C(90, -58, 4, '#fff');
      o += headlight(176, -76, 7, on, 40) + wheel(-120, 32, s) + wheel(120, 32, s);
      return o;
    },
    x: { seats: [sit(-40, -76)] },
  };
}
const KARTS = fam('car-gokart', 'Go-Karts', 'cars', { mount: 'floor', w: 380, h: 240, toggle: true, sfx: 'boing' }, [
  goKart('rainbow', 'Rainbow Racer Kart'), goKart('space', 'Rocket Kart'),
], (i) => stylePrice(i, 40, 30, 200));

// ---------------- carriages ----------------
function carriage(st: string, name: string): Design {
  const pumpkin = st === 'princess';
  return {
    st, name,
    art: (c, on, s) => {
      let o = shadow(220) + wheel(-130, 66, s, 'princess') + wheel(140, 50, s, 'princess');
      if (pumpkin) {
        o += cloth('M-170 -150 Q-180 -330 0 -336 Q180 -330 170 -150Z', c) + S('M-90 -150 Q-110 -260 -50 -326 M90 -150 Q110 -260 50 -326', dark(c, 0.12), 4);
        o += motif('crown', 0, -358, 26) + S('M0 -336 Q14 -352 30 -350', '#5fae6b', 4);
      } else {
        o += cloth(heartD(0, -356, 290), c) + S(heartD(0, -340, 256), '#ffffff', 4, 'stroke-dasharray="4 8"') + tr(0, -340, bowG(0, 0, 1.4, '#ff7eb6'));
      }
      o += glass(pumpkin ? 'M-110 -170 Q-114 -290 0 -294 Q114 -290 110 -170Z' : 'M-110 -170 Q-120 -270 -50 -280 Q-10 -284 0 -256 Q10 -284 50 -280 Q120 -270 110 -170Z', on ? '#fff1b8' : '#e6f6ff');
      o += P('M-110 -290 Q-90 -230 -112 -180 L-110 -290Z', s.soft) + P('M-112 -286 Q-60 -260 -84 -170 L-110 -170Z', s.soft, op(0.95)) + P('M112 -286 Q60 -260 84 -170 L110 -170Z', s.soft, op(0.95));
      for (const x of [-200, 200]) o += Ln(x * 0.92, -250, x, -200, GOLD, 4) + (on ? glow(x, -190, 40) : '') + R(x - 12, -212, 24, 30, 6, on ? '#fff6c8' : '#fff', `stroke="#e0b040" stroke-width="3"`) + P(`M${x - 14} -212 L${x} -226 L${x + 14} -212Z`, GOLD);
      if (on) o += [-140, 0, 150, 60].map((x, i) => twinkle(x, -360 + (i % 2) * 40, 10, '#fff6c8', 1.5, i * 0.35)).join('');
      return o;
    },
    front: (c, _on, s) => {
      let o = cloth(pumpkin ? 'M-172 -176 H172 Q176 -96 120 -84 Q0 -64 -120 -84 Q-176 -96 -172 -176Z' : 'M-150 -176 H150 Q140 -110 80 -92 Q0 -72 -80 -92 Q-140 -110 -150 -176Z', c, s.pattern, 'y');
      o += S(pumpkin ? 'M-172 -176 H172' : 'M-150 -176 H150', GOLD, 6) + S(`M-120 -150 Q-80 -110 -40 -140 Q0 -170 40 -140 Q80 -110 120 -150`, GOLD, 3);
      o += pumpkin ? motif('heart', 0, -120, 14) : P(heartD(0, -132, 26), '#fff') + P(heartD(0, -128, 16), s.main);
      o += S('M-210 -96 Q-230 -60 -200 -40 M210 -96 Q230 -60 200 -40', GOLD, 5);
      o += R(-60, -86, 120, 10, 5, GOLD) + wheel(-130, 66, s, 'princess') + wheel(140, 50, s, 'princess');
      return o;
    },
    x: { seats: [sit(0, -130)] },
  };
}
const CARRIAGES = fam('car-carriage', 'Carriages', 'cars', { mount: 'floor', w: 480, h: 380, toggle: true, sfx: 'ding' }, [
  carriage('princess', 'Pumpkin Princess Carriage'), carriage('sweet', 'Sweetheart Carriage'),
], (i) => stylePrice(i, 120, 40, 200));


// =====================================================================================
// HOSPITAL
// =====================================================================================
/** A bedside heart monitor screen. When on, a heartbeat line runs and the heart blinks. */
function monitor(x: number, y: number, w: number, h: number, on: boolean, frame: string, line = '#7fe0b0'): string {
  let o = box(x - w / 2 - 6, y - 6, w + 12, h + 12, 10, frame) + R(x - w / 2, y, w, h, 6, on ? '#1e3a4a' : '#3d3a52');
  const mid = y + h * 0.48;
  const x0 = x - w / 2 + 6;
  const beat = `M${f(x0)} ${f(mid)} H${f(x0 + w * 0.2)} L${f(x0 + w * 0.26)} ${f(mid - h * 0.12)} L${f(x0 + w * 0.32)} ${f(mid + h * 0.16)} L${f(x0 + w * 0.39)} ${f(mid - h * 0.34)} L${f(x0 + w * 0.45)} ${f(mid + h * 0.1)} L${f(x0 + w * 0.5)} ${f(mid)} H${f(x0 + w * 0.62)}`;
  if (on) {
    o += `<path d="${beat}" fill="none" stroke="${line}" stroke-width="3" stroke-linejoin="round" stroke-dasharray="${f(w * 1.6)}" stroke-dashoffset="${f(w * 1.6)}"><animate attributeName="stroke-dashoffset" values="${f(w * 1.6)};0;${f(-w * 1.6)}" dur="1.6s" repeatCount="indefinite"/></path>`;
    o += blink(P(heartD(x + w * 0.36, y + h * 0.16, h * 0.28), '#ff7eb6'), 0.8) + R(x + w * 0.22, y + h * 0.62, w * 0.22, h * 0.12, 2, '#ffe680', op(0.9));
  } else o += S(`M${f(x0)} ${f(mid)} H${f(x0 + w * 0.62)}`, '#6b6680', 2);
  o += R(x - w / 2 + 4, y + 3, w - 8, 4, 2, '#fff', op(0.18)) + C(x + w / 2 - 8, y + h + 2, 2.5, on ? '#7fe0b0' : '#9aa3b5');
  return o;
}
/** Caster wheel on a little stem. */
const caster = (x: number, top: number, c = '#9aa3b5') => R(x - 3, top, 6, -top - 16, 3, c) + C(x, -9, 9, '#4a4048') + C(x, -9, 3.5, '#c9cfdd');

// ---------------- hospital beds ----------------
const HB_MT = -132;
const HB_HIP = 108;
function hospBed(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      const rail = st === 'princess' ? GOLD : st === 'rainbow' ? RB[4] : st === 'cottage' ? s.wood : st === 'space' ? s.metal : '#c9cfdd';
      let o = '';
      // monitor on its pole at the head end
      o += R(-216, -300, 8, 284, 4, '#9aa3b5') + E(-212, -8, 26, 6, '#9aa3b5') + monitor(-212, -340, 70, 54, on, st === 'space' ? s.main : st === 'princess' ? '#ffffff' : light(c, 0.2));
      // headboard
      if (st === 'sweet') o += P(heartD(-150, -276, 110), dark(c, 0.1)) + cloth(heartD(-150, -270, 100), c) + heartPlus(-150, -206, 40, '#ffffff', c);
      else if (st === 'princess') o += cloth('M-196 -96 V-220 Q-196 -270 -150 -280 Q-104 -270 -104 -220 V-96Z', s.wood) + S('M-188 -222 Q-150 -262 -112 -222', GOLD, 4) + motif('crown', -150, -238, 18);
      else if (st === 'modern') o += box(-192, -236, 22, 140, 8, '#ffffff') + box(-192, -236, 90, 22, 8, '#ffffff') + R(-160, -230, 40, 10, 5, s.accent);
      else if (st === 'space') o += cloth('M-200 -96 V-230 Q-200 -300 -120 -300 L-90 -300 L-90 -96Z', c) + porthole(-145, -230, 22, s.metal) + twinkle(-120, -270, 8, s.accent, 1.6);
      else if (st === 'cottage') { o += box(-196, -250, 18, 154, 8, s.wood) + box(-112, -250, 18, 154, 8, s.wood) + R(-196, -250, 102, 14, 7, s.wood); for (let x = -170; x < -112; x += 14) o += R(x, -236, 6, 130, 3, light(s.wood, 0.15)); o += motif('daisy', -145, -262, 12); }
      else { RB.forEach((col, i) => { o += S(`M${-196 + i * 8} -96 V${-200 + i * 6} Q${-196 + i * 8} ${-266 + i * 8} -150 ${-266 + i * 8} Q${-104 - i * 8} ${-266 + i * 8} ${-104 - i * 8} ${-200 + i * 6} V-96`, col, 7); }); }
      // frame and backrest tilted up
      o += box(-180, -98, 370, 24, 10, st === 'space' ? s.main : st === 'cottage' ? s.wood : '#e6e8f0') + R(-170, -94, 350, 4, 2, '#fff', op(0.5));
      for (const x of [-160, 170]) o += caster(x, -74, st === 'princess' ? '#e0b040' : '#9aa3b5');
      o += R(-12, -74, 24, 30, 6, '#c9cfdd') + R(-26, -50, 52, 10, 5, '#9aa3b5');
      o += G(mattress(-176, -30, HB_MT, '#ffffff', 46), 'rotate(-12 -30 -110)') + mattress(-40, 182, HB_MT, '#ffffff', 46);
      o += G(pillow(-100, -156, st === 'rainbow' ? '#fff3b0' : s.soft, 48, 24), 'rotate(-12 -30 -110)');
      // footboard with a chart clipboard
      o += box(168, -200, 24, 110, 10, st === 'princess' ? s.wood : rail === GOLD ? '#ffd24a' : light(c, 0.1)) + R(172, -190, 40, 52, 4, '#c98a5a') + R(176, -184, 32, 42, 2, '#fff') + Ln(182, -174, 202, -174, '#9aa3b5', 2) + Ln(182, -164, 198, -164, '#9aa3b5', 2) + P(heartD(192, -158, 8), '#ff7eb6');
      return o;
    },
    front: (c, _on, s) => {
      const pat = st === 'sweet' ? 'hearts' : st === 'space' ? 'stars' : st === 'cottage' ? 'flowers' : st === 'rainbow' ? 'stripes' : st === 'princess' ? 'hearts' : 'none';
      let o = blanket(HB_HIP, HB_MT, st === 'modern' ? '#9fd6ff' : light(c, 0.3), pat, '#ffffff', 186);
      const rail = st === 'princess' ? '#e0b040' : st === 'rainbow' ? RB[4] : st === 'cottage' ? s.wood : st === 'space' ? s.accent : '#b8bfcc';
      o += R(-30, -114, 150, 8, 4, rail) + R(-30, -114, 8, 30, 4, rail) + R(112, -114, 8, 30, 4, rail) + R(-30, -90, 150, 6, 3, rail, op(0.8));
      return o;
    },
  };
}
const porthole = (x: number, y: number, r: number, rim: string, gl = '#9fd6ff') => C(x, y, r + 4, rim) + C(x, y, r, gl) + C(x, y, r, GLASS) + C(x - r * 0.35, y - r * 0.35, r * 0.25, '#fff', op(0.7));
const HOSPBEDS = fam('hospitalbed', 'Hospital Beds', 'hospital', { mount: 'floor', w: 470, h: 360, toggle: true, seats: sleep(HB_HIP, HB_MT + 6) }, [
  hospBed('sweet', 'Sweetheart Hospital Bed'), hospBed('princess', 'Royal Recovery Bed'), hospBed('modern', 'Modern Ward Bed'),
  hospBed('space', 'Space Care Pod Bed'), hospBed('cottage', 'Cottage Rest Bed'), hospBed('rainbow', 'Rainbow Get-Well Bed'),
], (i) => stylePrice(i, 60, 20));

// ---------------- exam tables ----------------
function examTable(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = '';
      if (st === 'candy') o += box(-120, -94, 240, 86, 16, '#ffffff') + [-80, 0, 80].map((x, i) => box(x - 34, -84, 68, 66, 12, TOYC[i]) + knob(x, -50, 6, '#fff')).join('');
      else if (st === 'beach') { o += box(-120, -94, 240, 86, 10, s.wood); for (let x = -110; x < 120; x += 22) o += Ln(x, -88, x, -14, dark(s.wood, 0.12), 2); o += motif('fish', -60, -50, 14) + motif('fish', 60, -50, 14); }
      else if (st === 'modern') o += R(-14, -94, 28, 86, 6, '#9aa3b5') + R(-90, -14, 180, 10, 5, '#4a4a5e') + R(-60, -94, 120, 12, 6, '#c9cfdd');
      else o += box(-120, -94, 240, 86, 14, '#ffffff') + box(-110, -84, 105, 66, 10, light(c, 0.3)) + box(5, -84, 105, 66, 10, light(c, 0.3)) + knob(-58, -50, 6, GOLD) + knob(58, -50, 6, GOLD) + P(heartD(-58, -80, 10), c) + P(heartD(58, -80, 10), c);
      if (st !== 'modern') o += R(-120, -12, 240, 12, 4, dark(st === 'beach' ? s.wood : '#e6e8f0', 0.1));
      // raised back
      o += G(boxT(-138, -132, 90, 34, 16, 8, c), 'rotate(-24 -60 -110)');
      o += boxT(-128, -122, 256, 30, 16, 10, c, st === 'candy' ? 'dots' : 'none') + R(-118, -118, 236, 5, 2.5, '#fff', op(0.45));
      // paper roll
      o += R(-70, -126, 180, 8, 2, '#ffffff', op(0.95)) + E(116, -110, 10, 14, '#ffffff', 'stroke="#e6e8f0" stroke-width="2"');
      // step
      o += box(130, -46, 50, 46, 8, st === 'beach' ? s.wood : '#e6e8f0') + R(130, -46, 50, 8, 4, s.accent === '#ffffff' ? c : s.accent);
      if (st === 'beach') o += tr(155, -20, P(starD(0, 0, 10), '#ff9a6b'));
      return o;
    },
  };
}
const EXAMTABLES = fam('examtable', 'Exam Tables', 'hospital', { mount: 'floor', w: 330, h: 170, seats: [sit(10, -118)] }, [
  examTable('sweet', 'Sweetheart Exam Table'), examTable('modern', 'Modern Exam Table'), examTable('beach', 'Seaside Exam Table'), examTable('candy', 'Lollipop Exam Table'),
], (i) => stylePrice(i, 30, 10));

// ---------------- waiting chairs ----------------
function waitChairs(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = '';
      const xs = [-120, 0, 120];
      if (st === 'woodland') {
        o += [-160, 160].map((x) => R(x - 8, -96, 16, 96, 6, s.wood)).join('') + box(-180, -96, 360, 22, 10, s.wood) + box(-180, -200, 360, 70, 16, light(s.wood, 0.1));
        for (let x = -160; x < 170; x += 40) o += Ln(x, -194, x, -136, dark(s.wood, 0.12), 2);
        o += motif('leaf', -120, -166, 12) + motif('leaf', 0, -166, 12) + motif('leaf', 120, -166, 12) + R(-180, -136, 360, 8, 4, dark(s.wood, 0.1));
        return o;
      }
      o += R(-178, -62, 356, 12, 6, '#9aa3b5') + [-150, 150].map((x) => R(x - 5, -60, 10, 60, 4, '#9aa3b5') + E(x, -2, 22, 5, '#9aa3b5')).join('');
      xs.forEach((x, i) => {
        const col = st === 'rainbow' ? RB[[0, 2, 4][i]] : c;
        if (st === 'sweet') o += P(heartD(x, -206, 96), dark(col, 0.1)) + cloth(heartD(x, -200, 88), col) + boxT(x - 52, -100, 104, 28, 14, 10, col);
        else if (st === 'modern') o += cloth(`M${x - 50} -100 Q${x - 54} -196 ${x} -198 Q${x + 54} -196 ${x + 50} -100Z`, col) + boxT(x - 52, -100, 104, 26, 12, 12, dark(col, 0.06)) + R(x - 30, -180, 60, 6, 3, '#fff', op(0.4));
        else o += boxT(x - 48, -196, 96, 92, 40, 10, col) + boxT(x - 52, -100, 104, 28, 14, 10, dark(col, 0.06)) + P(starD(x, -156, 16), '#ffffff', op(0.85));
      });
      if (st === 'sweet') o += [-60, 60].map((x) => R(x - 6, -116, 12, 30, 6, '#ffffff')).join('');
      return o;
    },
  };
}
const WAITCHAIRS = fam('waitingchairs', 'Waiting Chairs', 'hospital', { mount: 'floor', w: 380, h: 220, seats: [sit(-120, -100), sit(0, -100), sit(120, -100)] }, [
  waitChairs('sweet', 'Heart Waiting Chairs'), waitChairs('modern', 'Modern Waiting Row'), waitChairs('rainbow', 'Rainbow Waiting Chairs'), waitChairs('woodland', 'Woodland Waiting Bench'),
], (i) => stylePrice(i, 30, 10));

// ---------------- reception desks ----------------
function hospDesk(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = '';
      // computer and bell on the counter
      o += R(60, -232, 80, 56, 8, st === 'space' ? s.metal : '#4a4a5e') + R(66, -226, 68, 44, 5, on ? '#bfe9ff' : '#3d3a52') + R(94, -176, 12, 14, 3, '#9aa3b5') + R(80, -166, 40, 6, 3, '#9aa3b5');
      if (on) o += heartPlus(100, -204, 22, '#ff7eb6') + blink(R(72, -190, 30, 4, 2, '#7fe0b0'), 1);
      o += E(-110, -166, 20, 5, '#c9cfdd') + P('M-126 -168 Q-126 -190 -110 -190 Q-94 -190 -94 -168Z', 'url(#g-gold)') + C(-110, -193, 4, 'url(#g-gold)');
      o += R(-40, -186, 50, 20, 4, '#ffffff') + R(-36, -182, 42, 2, 1, '#9aa3b5') + R(-36, -176, 34, 2, 1, '#9aa3b5') + R(-4, -196, 4, 32, 2, '#ff7eb6', 'transform="rotate(30 -2 -180)"');
      if (st === 'sweet') {
        o += boxT(-170, -166, 340, 166, 20, 6, c) + boxT(-180, -172, 360, 18, 9, 9, '#ffffff') + R(-170, -40, 340, 40, 0, dark(c, 0.08));
        o += C(0, -100, 44, '#ffffff') + heartPlus(0, -98, 52, s.main === '#ff9ec7' ? '#ff6f91' : c) + S('M-150 -150 Q0 -136 150 -150', '#ffffff', 3, 'stroke-dasharray="3 9"');
      } else if (st === 'modern') {
        o += box(-170, -166, 340, 166, 6, '#ffffff') + R(-170, -120, 340, 20, 0, c) + R(-180, -172, 360, 14, 4, s.accent) + heartPlus(-110, -50, 34, '#ff5d73');
        o += txt(40, -40, 22, s.accent, 'WELCOME');
      } else if (st === 'cottage') {
        o += box(-170, -166, 340, 166, 10, s.wood) + boxT(-180, -174, 360, 18, 8, 8, dark(s.wood, 0.1));
        for (const x of [-150, -50, 50]) o += box(x, -150, 90, 120, 8, light(s.wood, 0.12)) + R(x + 8, -142, 74, 104, 6, 'none', `stroke="${dark(s.wood, 0.15)}" stroke-width="2"`);
        o += C(0, -96, 34, '#ffffff') + heartPlus(0, -94, 38, '#ff7eb6') + tr(-160, -180, flowerG(0, 0, 14, '#ff9ec7'));
      } else {
        o += cloth('M-170 0 V-130 Q-170 -166 -130 -166 H130 Q170 -166 170 -130 V0Z', c) + R(-180, -174, 360, 14, 7, s.metal);
        for (let i = 0; i < 6; i++) o += blink(C(-130 + i * 52, -36, 6, TOYC[i]), 1 + (i % 3) * 0.3, i * 0.2);
        o += porthole(0, -100, 34, s.metal, '#cfe0ff') + heartPlus(0, -96, 34, '#ff7eb6') + twinkle(-110, -120, 10, s.accent, 1.6) + twinkle(110, -110, 8, s.accent, 1.8, 0.5);
      }
      return o;
    },
  };
}
const HOSPDESKS = fam('hospdesk', 'Reception Desks', 'hospital', { mount: 'floor', w: 370, h: 240, toggle: true, sfx: 'ding', surfaces: [{ x1: -180, x2: -50, y: -170 }] }, [
  hospDesk('sweet', 'Sweetheart Reception Desk'), hospDesk('modern', 'Modern Front Desk'), hospDesk('cottage', 'Cottage Welcome Desk'), hospDesk('space', 'Space Station Desk'),
], (i) => stylePrice(i, 40, 15));

// ---------------- wheelchairs ----------------
function wheelchair(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = '';
      if (st === 'space') {
        o += E(0, -14, 70, 10, '#7fe8ff', op(on ? 0.7 : 0.3)) + (on ? glow(0, -20, 70) : '') + cloth('M-66 -96 Q-78 -240 -24 -244 Q16 -244 14 -206 L12 -116 H58 Q78 -112 72 -82 Q58 -40 0 -40 Q-58 -40 -66 -96Z', c) + P('M-50 -110 Q-58 -222 -24 -226 Q-2 -226 -2 -200 L-4 -112Z', s.soft) + C(-30, -236, 6, s.accent) + twinkle(40, -170, 8, s.accent, 1.6);
        return o;
      }
      o += R(-56, -212, 12, 120, 6, st === 'rainbow' ? RB[5] : '#9aa3b5') + S('M-50 -212 Q-66 -214 -70 -200', '#4a4048', 6);
      o += boxT(-54, -200, 24, 100, 10, 4, c);
      o += R(-56, -104, 116, 14, 7, '#9aa3b5') + Ln(50, -96, 70, -30, '#9aa3b5', 6) + R(56, -36, 34, 8, 4, '#4a4048') + C(64, -12, 12, '#4a4048') + C(64, -12, 4, '#c9cfdd');
      return o;
    },
    front: (c, on, s) => {
      if (st === 'space') return cloth('M-72 -70 Q-74 -100 -50 -104 H60 Q80 -96 70 -70 Q54 -46 0 -46 Q-54 -46 -72 -70Z', dark(c, 0.06)) + R(30, -130, 40, 10, 5, s.metal) + C(70, -125, 6, on ? '#7fe0b0' : s.accent) + P(starD(-20, -60, 12), s.accent);
      let o = boxT(-60, -110, 116, 22, 10, 8, c) + R(10, -146, 50, 10, 5, st === 'rainbow' ? RB[1] : '#9aa3b5') + R(50, -146, 8, 40, 4, st === 'rainbow' ? RB[1] : '#9aa3b5');
      const rim = st === 'rainbow' ? 'rainbow' : st === 'modern' ? 'modern' : 'sweet';
      o += wheel(-18, 64, s, rim) + C(-18, -64, 54, 'none', `stroke="${st === 'rainbow' ? RB[3] : '#c9cfdd'}" stroke-width="4"`);
      if (st === 'sweet') o += P(heartD(-18, -76, 18), '#fff', op(0.9));
      return o;
    },
  };
}
const WHEELCHAIRS = fam('wheelchair', 'Wheelchairs', 'hospital', { mount: 'floor', w: 200, h: 230, seats: [sit(0, -110)] }, [
  wheelchair('sweet', 'Sweetheart Wheelchair'), wheelchair('modern', 'Sporty Wheelchair'), wheelchair('rainbow', 'Rainbow Wheelchair'), wheelchair('space', 'Hover Chair'),
], (i) => stylePrice(i, 30, 15));

// ---------------- x-ray machines ----------------
/** A smiling cartoon skeleton for the x-ray screen. */
function skeleton(x: number, y: number, s: number): string {
  const W = '#ffffff';
  const bone = (x1: number, y1: number, x2: number, y2: number) => Ln(x1, y1, x2, y2, W, 5) + C(x1, y1, 4, W) + C(x2, y2, 4, W);
  let o = C(0, -120, 26, W) + R(-14, -100, 28, 12, 5, W) + C(-9, -122, 7, '#3a6aa8') + C(9, -122, 7, '#3a6aa8') + C(-7, -124, 2, W) + C(11, -124, 2, W) + S('M-8 -106 Q0 -100 8 -106', '#3a6aa8', 2.5) + E(-18, -112, 4, 2.5, '#ffb3c7', op(0.7)) + E(18, -112, 4, 2.5, '#ffb3c7', op(0.7));
  for (let i = 0; i < 6; i++) o += R(-4, -86 + i * 11, 8, 8, 3, W);
  for (let i = 0; i < 3; i++) o += S(`M-4 ${-80 + i * 11} Q-24 ${-82 + i * 11} -22 ${-70 + i * 11} M4 ${-80 + i * 11} Q24 ${-82 + i * 11} 22 ${-70 + i * 11}`, W, 4);
  o += P('M-20 -22 Q0 -34 20 -22 Q16 -8 0 -6 Q-16 -8 -20 -22Z', W);
  o += bone(-14, -84, -34, -44) + bone(-34, -44, -40, -6) + bone(14, -84, 38, -60) + bone(38, -60, 48, -96) + C(48, -104, 6, W);
  o += bone(-10, -12, -14, 30) + bone(-14, 30, -16, 66) + bone(10, -12, 14, 30) + bone(14, 30, 16, 66) + E(-20, 70, 9, 4, W) + E(20, 70, 9, 4, W);
  return tr(x, y, o, s);
}
function xray(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = '';
      const frame = st === 'space' ? s.main : st === 'modern' ? '#ffffff' : c;
      o += E(0, -6, 90, 10, '#9aa3b5') + R(-12, -100, 24, 96, 8, '#c9cfdd');
      if (st === 'sweet') o += P(heartD(0, -370, 230), dark(frame, 0.1)) + cloth(heartD(0, -362, 214), frame);
      else if (st === 'space') o += cloth('M-120 -110 V-300 Q-120 -340 -80 -340 H80 Q120 -340 120 -300 V-110Z', frame) + R(-30, -360, 60, 24, 10, s.metal) + blink(C(0, -362, 6, '#7fe8ff'), 1.2);
      else o += box(-120, -340, 240, 232, 14, frame) + R(-120, -128, 240, 20, 0, s.accent);
      const scr = st === 'sweet' ? 'M-84 -300 H84 V-150 Q0 -120 -84 -150Z' : 'M-96 -316 H96 V-144 H-96Z';
      o += P(scr, on ? '#5a9ad8' : '#2d3a5a') + P(scr, GLASS);
      if (on) o += glow(0, -230, 110) + skeleton(0, -194, st === 'sweet' ? 0.86 : 1) + `<path d="${scr}" fill="#bfe3ff" opacity="0.25"><animate attributeName="opacity" values="0.1;0.35;0.1" dur="2s" repeatCount="indefinite"/></path>`;
      else o += txt(0, -222, 26, '#5a6a8a', 'X-RAY');
      o += C(st === 'sweet' ? 70 : 100, -126, 7, on ? '#7fe0b0' : '#ff7eb6');
      return o;
    },
  };
}
const XRAYS = fam('xray', 'X-Ray Machines', 'hospital', { mount: 'floor', w: 280, h: 380, toggle: true }, [
  xray('sweet', 'Heart X-Ray Screen'), xray('modern', 'Modern X-Ray Machine'), xray('space', 'Space Scanner'),
], (i) => stylePrice(i, 50, 20));

// ---------------- eye charts (wall) ----------------
function eyeChart(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = box(-74, -112, 148, 224, 10, st === 'space' ? '#2d2a50' : '#ffffff') + R(-74, -112, 148, 22, 10, c) + R(-74, -96, 148, 6, 0, c);
      const ink = st === 'space' ? '#ffffff' : INK;
      if (st === 'retro') {
        const rows = [['E'], ['F', 'P'], ['T', 'O', 'Z'], ['L', 'P', 'E', 'D'], ['P', 'E', 'C', 'F', 'D']];
        rows.forEach((r, i) => { const size = 40 - i * 7; r.forEach((ch, j) => { o += txt((j - (r.length - 1) / 2) * size * 0.95, -50 + i * 34 + i * i * -1.5, size, ink, ch); }); });
      } else {
        const shapes = st === 'space' ? ['planet', 'star', 'moon', 'rocket'] : ['heart', 'star', 'cloud', 'apple'];
        for (let i = 0; i < 5; i++) {
          const n = i + 1;
          const r = 17 - i * 2.8;
          for (let j = 0; j < n; j++) o += motif(shapes[(i + j) % 4], (j - (n - 1) / 2) * r * 2.4, -56 + i * 34, r);
        }
      }
      o += R(-60, 96, 120, 4, 2, st === 'space' ? s.accent : '#ff7eb6') + txt(0, -97, 12, '#ffffff', 'LOOK!');
      return o;
    },
  };
}
const EYECHARTS = fam('eyechart', 'Eye Charts', 'hospital', { mount: 'wall', w: 160, h: 240 }, [
  eyeChart('sweet', 'Picture Eye Chart'), eyeChart('retro', 'Letter Eye Chart'), eyeChart('space', 'Starry Eye Chart'),
], (i) => stylePrice(i, 15, 10));

// ---------------- medicine cabinets ----------------
const MED_SPAWN = ['f-medbottle-sweet', 'f-bandagebox-sweet', 'f-medbottle-candy', 'f-thermometer-sweet'];
/** Friendly bottles and boxes standing on a shelf at y. */
function medShelf(x1: number, x2: number, y: number, seed: number): string {
  let o = '';
  let x = x1 + 6;
  for (let i = 0; x < x2 - 20; i++) {
    const k = (i + seed) % 4;
    const col = TOYC[(i * 2 + seed) % 6];
    if (k === 0) { o += box(x, y - 36, 22, 36, 6, col) + R(x + 4, y - 44, 14, 10, 3, '#ffffff') + P(heartD(x + 11, y - 26, 8), '#fff'); x += 28; }
    else if (k === 1) { o += box(x, y - 26, 34, 26, 4, '#ffffff') + R(x + 13, y - 22, 8, 18, 2, '#ff6f91') + R(x + 8, y - 17, 18, 8, 2, '#ff6f91'); x += 40; }
    else if (k === 2) { o += E(x + 12, y - 16, 12, 16, col, op(0.9)) + R(x + 6, y - 38, 12, 8, 3, '#ffffff') + C(x + 8, y - 20, 3, '#fff', op(0.6)); x += 28; }
    else { o += plaster(x + 18, y - 8, 0.7, -10); x += 36; }
  }
  return o;
}
function medCabinet(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = '';
      if (st === 'candy') o += boxT(-80, -290, 160, 290, 60, 10, c, 'dots') + P(`M-80 -250 Q-80 -294 0 -294 Q80 -294 80 -250${scallop(80, -80, -250, 6, 7)}Z`, '#ffffff');
      else if (st === 'cottage') o += box(-80, -290, 160, 290, 10, s.wood) + R(-90, -298, 180, 16, 8, dark(s.wood, 0.1)) + motif('daisy', 0, -278, 10);
      else if (st === 'modern') o += box(-80, -290, 160, 290, 4, '#ffffff') + R(-80, -290, 160, 14, 0, c);
      else o += boxT(-80, -290, 160, 290, 20, 8, c) + R(-80, -290, 160, 26, 13, '#ffffff', op(0.0));
      o += R(-66, -256, 132, 176, 8, '#f4faff') + R(-66, -256, 132, 176, 8, 'url(#g-shadeX)');
      for (const y of [-198, -140, -84]) o += R(-64, y, 128, 5, 2, '#cfe3f0');
      o += medShelf(-64, 64, -198, 0) + medShelf(-64, 64, -140, 1) + medShelf(-64, 64, -84, 2);
      o += R(-66, -256, 132, 176, 8, GLASS) + Ln(0, -256, 0, -80, st === 'cottage' ? s.wood : '#ffffff', 4) + knob(-8, -168, 4, GOLD) + knob(8, -168, 4, GOLD);
      o += box(-66, -70, 132, 56, 6, st === 'cottage' ? light(s.wood, 0.1) : light(c, 0.2)) + R(-14, -48, 28, 7, 3.5, st === 'modern' ? s.accent : '#ffffff');
      o += C(0, -272, 13, '#ffffff') + heartPlus(0, -271, 16, st === 'modern' ? '#ff5d73' : '#ff6f91');
      return o;
    },
  };
}
const MEDCABINETS = fam('medcabinet', 'Medicine Cabinets', 'hospital', { mount: 'floor', w: 180, h: 300, spawn: MED_SPAWN, surfaces: [{ x1: -78, x2: 78, y: -292 }] }, [
  medCabinet('sweet', 'Sweetheart Medicine Cabinet'), medCabinet('modern', 'Modern Supply Cabinet'), medCabinet('cottage', 'Cottage Remedy Cupboard'), medCabinet('candy', 'Gumdrop Medicine Cabinet'),
], (i) => stylePrice(i, 30, 10));

// ---------------- scales ----------------
function hospScale(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = boxT(-56, -34, 112, 34, 10, 6, st === 'retro' ? '#4a4a5e' : '#ffffff') + R(-46, -40, 92, 8, 4, '#c9cfdd');
      if (st === 'retro') {
        o += R(-6, -250, 12, 220, 5, '#9aa3b5') + R(-3, -248, 3, 214, 1.5, '#fff', op(0.5)) + R(-60, -244, 120, 14, 4, INK) + R(-60, -244, 120, 4, 2, '#fff', op(0.3));
        for (let i = 0; i < 10; i++) o += Ln(-54 + i * 12, -236, -54 + i * 12, -232, '#fff', 1.5);
        o += box(on ? 12 : -40, -250, 14, 26, 4, GOLD) + C(56, -236, 8, SIL) + box(-28, -290, 56, 44, 10, c) + C(0, -268, 14, '#fff') + Ln(0, -268, on ? 8 : -6, -278, INK, 2);
      } else if (st === 'modern') {
        o += R(-6, -270, 12, 236, 5, '#c9cfdd') + box(-40, -320, 80, 54, 8, c) + R(-32, -312, 64, 30, 5, on ? '#bfe9ff' : '#3d3a52') + (on ? txt(0, -290, 20, '#2d6a8a', '25') : '') + R(-40, -320, 80, 10, 5, s.accent);
      } else {
        o += R(-6, -250, 12, 216, 5, '#ffffff') + C(0, -284, 46, c) + C(0, -284, 36, '#ffffff') + P(heartD(0, -310, 18), c);
        for (let i = 0; i < 8; i++) { const a = -Math.PI + (i / 7) * Math.PI; o += Ln(Math.cos(a) * 30, -278 + Math.sin(a) * 30, Math.cos(a) * 25, -278 + Math.sin(a) * 25, '#9aa3b5', 2); }
        o += Ln(0, -278, on ? 18 : -18, on ? -296 : -290, '#ff6f91', 3) + C(0, -278, 4, '#ff6f91');
      }
      return o;
    },
  };
}
const SCALES = fam('hospscale', 'Scales', 'hospital', { mount: 'floor', w: 130, h: 340, toggle: true, sfx: 'ding' }, [
  hospScale('sweet', 'Heart Dial Scale'), hospScale('modern', 'Digital Scale'), hospScale('retro', 'Classic Doctor Scale'),
], (i) => stylePrice(i, 20, 10));

// ---------------- height charts (wall) ----------------
function heightChart(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = '';
      if (st === 'woodland') {
        // a friendly giraffe
        o += cloth('M-20 190 V-130 Q-20 -150 -4 -150 H20 V190Z', '#ffd36b') + E(10, -170, 32, 22, '#ffd36b') + E(36, -164, 14, 10, '#ffc25a');
        o += R(-10, -206, 5, 18, 2, '#c98a5a') + R(14, -206, 5, 18, 2, '#c98a5a') + C(-8, -208, 5, '#c98a5a') + C(16, -208, 5, '#c98a5a') + C(4, -174, 4, INK) + C(5, -175, 1.4, '#fff') + E(-8, -164, 5, 3, '#ff9ec7', op(0.7));
        for (let i = 0; i < 9; i++) o += E(-6 + (i % 2) * 14, -110 + i * 32, 6, 8, '#c98a5a', op(0.8));
        o += motif('leaf', -40, 150, 14) + motif('leaf', -50, 120, 10);
      } else if (st === 'rainbow') {
        RB.forEach((col, i) => { o += R(-30, -180 + i * 62, 60, 62, 0, col); });
        o += R(-30, -180, 60, 372, 10, 'none', 'stroke="#ffffff" stroke-width="4"') + cloud(0, 178, 1.2);
      } else {
        o += box(-30, -180, 60, 370, 14, c) + P(heartD(0, -176, 26), '#ffffff');
        for (let i = 0; i < 4; i++) o += P(heartD(-14 + (i % 2) * 28, -100 + i * 80, 10), '#ffffff', op(0.6));
      }
      for (let i = 0; i <= 12; i++) { const y = 180 - i * 28; o += Ln(st === 'woodland' ? 22 : 30, y, (i % 2 ? 40 : 52), y, '#4a4a5e', i % 2 ? 2 : 3); if (i % 2 === 0) o += txt(64, y + 4, 11, '#4a4a5e', String(i * 10)); }
      o += P(starD(52, -130, 9), s.accent === '#ffffff' ? '#ffd36b' : s.accent);
      return o;
    },
  };
}
const cloud = (x: number, y: number, s: number) => C(x - 18 * s, y, 13 * s, '#fff') + C(x, y - 8 * s, 16 * s, '#fff') + C(x + 18 * s, y, 13 * s, '#fff') + R(x - 30 * s, y, 60 * s, 12 * s, 6 * s, '#fff');
const HEIGHTCHARTS = fam('heightchart', 'Height Charts', 'hospital', { mount: 'wall', w: 150, h: 400 }, [
  heightChart('sweet', 'Heart Height Chart'), heightChart('woodland', 'Giraffe Height Chart'), heightChart('rainbow', 'Rainbow Height Chart'),
], (i) => stylePrice(i, 15, 10));

// ---------------- baby pods (incubator-style cribs) ----------------
const BP_MT = -150;
const BP_HIP = 100;
const BPK = 1.28;
function babyPod(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const leg = st === 'princess' ? '#e0b040' : st === 'space' ? '#9aa3b5' : '#c9cfdd';
      let o = R(-110, -110, 14, 100, 6, leg) + R(96, -110, 14, 100, 6, leg) + R(-120, -40, 240, 10, 5, leg);
      o += caster(-103, -16) + caster(103, -16);
      o += boxT(-150, -120, 300, 26, 8, 14, c) + R(-140, -116, 280, 4, 2, '#fff', op(0.45));
      o += mattress(-138, 138, BP_MT, '#ffffff', 32) + pillow(-70, -152, s.soft, 40, 18);
      if (st === 'space') o += R(-160, -140, 20, 40, 6, s.metal) + blink(C(-150, -128, 5, '#7fe8ff'), 1.4);
      else if (st === 'princess') o += motif('crown', 0, -102, 12);
      else o += P(heartD(0, -112, 14), '#fff');
      return G(o, `scale(${BPK} 1)`);
    },
    front: (c, on, s) => {
      let o = blanket(BP_HIP, BP_MT, light(c, 0.3), st === 'space' ? 'stars' : 'hearts', '#ffffff', 172);
      // the clear bubble cover
      let d = P('M-146 -150 Q-146 -300 0 -300 Q146 -300 146 -150Z', '#e6f6ff', op(0.28)) + P('M-146 -150 Q-146 -300 0 -300 Q146 -300 146 -150', 'none', `stroke="${st === 'princess' ? '#e0b040' : '#ffffff'}" stroke-width="4" ${op(0.9)}`);
      d += P('M-120 -180 Q-112 -270 -30 -282', 'none', 'stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.7"');
      d += C(-90, -170, 14, 'none', 'stroke="#ffffff" stroke-width="4" opacity="0.9"') + C(90, -170, 14, 'none', 'stroke="#ffffff" stroke-width="4" opacity="0.9"');
      o += G(d, `scale(${BPK} 1)`);
      if (st === 'princess') o += motif('crown', 0, -312, 18);
      else if (st === 'space') o += R(-6, -326, 12, 26, 4, s.metal) + (on ? blink(C(0, -330, 8, '#ff7eb6'), 0.8) : C(0, -330, 8, '#ffb3c7'));
      else o += tr(0, -306, bowG(0, 0, 1.1, '#ff7eb6'));
      if (on) o += twinkle(-60, -250, 8, '#fff6c8', 1.6) + twinkle(70, -230, 7, '#fff6c8', 1.9, 0.6);
      return o;
    },
  };
}
const BABYPODS = fam('babypod', 'Baby Pods', 'hospital', { mount: 'floor', w: 410, h: 340, toggle: true, seats: sleep(BP_HIP, BP_MT + 6) }, [
  babyPod('sweet', 'Snuggle Baby Pod'), babyPod('space', 'Starlight Baby Pod'), babyPod('princess', 'Little Royal Baby Pod'),
], (i) => stylePrice(i, 40, 20));

// ---------------- toy corners ----------------
function toyCorner(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = E(0, -6, 150, 14, st === 'woodland' ? '#c9e6a8' : light(c, 0.35));
      if (st === 'woodland') o += box(-140, -150, 150, 150, 10, s.wood) + R(-140, -80, 150, 8, 4, dark(s.wood, 0.15)) + motif('leaf', -60, -164, 12);
      else if (st === 'rainbow') o += RB.map((col, i) => R(-140 + i * 25, -150, 25, 150, i === 0 ? 8 : 0, col)).join('') + R(-140, -80, 150, 8, 4, '#ffffff');
      else o += boxT(-140, -150, 150, 150, 18, 6, c) + R(-140, -80, 150, 8, 4, '#ffffff') + P(heartD(-65, -170, 18), c);
      // toys on the shelves
      o += toyG.teddy(-110, -82, 0.9) + toyG.blocks(-50, -82, 0.8) + toyG.duck(-100, -8, 1) + toyG.car(-40, -8, 1, '#7cc8ff');
      // ball bin
      o += P('M30 -90 L140 -90 L128 0 L42 0Z', st === 'woodland' ? '#c98a5a' : '#ffffff') + P('M30 -90 L140 -90 L128 0 L42 0Z', 'url(#g-shadeX)');
      for (let i = 0; i < 7; i++) o += C(48 + (i % 4) * 26, -98 - Math.floor(i / 4) * 18, 13, TOYC[i % 6]) + C(44 + (i % 4) * 26, -102 - Math.floor(i / 4) * 18, 3.5, '#fff', op(0.5));
      o += R(30, -60, 110, 10, 0, st === 'rainbow' ? RB[4] : c, op(0.9));
      return o;
    },
  };
}
const toyG = {
  teddy: (x: number, y: number, s = 1, c = '#c98a5a') => G(C(-11, -36, 6, c) + C(11, -36, 6, c) + E(0, -12, 15, 13, c) + C(0, -30, 13, c) + E(0, -26, 6, 4.5, '#e8c0a0') + C(-4.5, -32, 1.8, INK) + C(4.5, -32, 1.8, INK) + C(0, -27.5, 1.6, '#4a2e22'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  blocks: (x: number, y: number, s = 1) => G(box(-20, -18, 18, 18, 3, '#7cc8ff') + box(2, -18, 18, 18, 3, '#ffd36b') + box(-9, -36, 18, 18, 3, '#ff7eb6') + P(starD(-11, -9, 5), '#fff', op(0.8)) + P(heartD(11, -13, 5), '#fff', op(0.8)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  duck: (x: number, y: number, s = 1) => G(E(0, -10, 15, 10, '#ffd84a') + C(7, -23, 8, '#ffd84a') + P('M13 -23 L21 -21 L13 -19Z', '#ff8a3d') + C(9, -25, 1.6, INK), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
  car: (x: number, y: number, s = 1, c = '#ff7a6b') => G(box(-22, -18, 44, 12, 5, c) + P('M-12 -18 Q-10 -28 0 -28 L6 -28 Q12 -28 14 -18Z', c) + P('M-8 -18 Q-7 -25 -1 -25 L4 -25 Q9 -25 10 -18Z', '#cfe9ff') + C(-12, -5, 5, '#4a4a5e') + C(12, -5, 5, '#4a4a5e'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`),
};
const TOYCORNERS = fam('hosptoys', 'Toy Corners', 'hospital', { mount: 'floor', w: 310, h: 200, sfx: 'squeak', surfaces: [{ x1: -140, x2: 10, y: -150 }] }, [
  toyCorner('sweet', 'Sweet Toy Corner'), toyCorner('rainbow', 'Rainbow Toy Corner'), toyCorner('woodland', 'Woodland Toy Corner'),
], (i) => stylePrice(i, 30, 15));

// ---------------- ambulances ----------------
function ambulance(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      const stripe = st === 'rainbow' ? RB[0] : st === 'modern' ? '#ff5d73' : '#ff7eb6';
      let o = shadow(260) + cloth('M-262 -150 L-262 -316 Q-262 -334 -244 -334 L120 -334 Q138 -334 138 -316 L138 -150Z', '#ffffff');
      o += glass('M-236 -170 V-300 H-150 V-170Z', '#e6f6ff') + glass('M-40 -180 V-290 H90 V-180Z', '#e6f6ff');
      o += cloth('M132 -150 L132 -282 Q132 -296 146 -296 L214 -296 Q240 -294 254 -248 L268 -150Z', '#ffffff') + glass('M148 -160 L148 -278 L210 -278 Q228 -276 240 -244 L250 -160Z');
      const a = '#ff7eb6';
      const b = '#7cc8ff';
      o += R(150, -306, 90, 10, 5, '#c9cfdd');
      o += on ? flash(boxT(150, -330, 44, 26, 13, 4, a) + glow(172, -318, 60), 0.5) + flash(boxT(196, -330, 44, 26, 13, 4, b) + glow(218, -318, 60), 0.5, 0.25) : boxT(150, -330, 44, 26, 13, 4, light(a, 0.3)) + boxT(196, -330, 44, 26, 13, 4, light(b, 0.3));
      o += R(-262, -248, 400, 14, 0, stripe, op(0.9));
      o += C(-100, -270, 40, '#ffffff') + heartPlus(-100, -268, 50, stripe);
      o += seatBack(190, -214, -150, s.soft, 70);
      return o;
    },
    front: (c, on, s) => {
      const stripe = st === 'rainbow' ? RB[0] : st === 'modern' ? '#ff5d73' : '#ff7eb6';
      let d = 'M-262 -60 L-262 -166 Q-262 -172 -254 -172 L248 -172 Q268 -166 270 -120 L270 -62 Q270 -44 252 -44' + under(-242, 170, -160, 56, -44) + ' Q-262 -44 -262 -60Z';
      let o = cloth(d, c, 'none', 'y');
      if (st === 'rainbow') RB.forEach((col, i) => { o += R(-262, -150 + i * 8, 532, 8, 0, col); });
      else o += R(-262, -140, 532, 18, 0, stripe) + R(-262, -114, 532, 6, 0, stripe, op(0.6));
      o += S('M-130 -168 V-62', dark(c, 0.15), 2.5) + S('M-262 -168 V-62', dark(c, 0.15), 2.5) + S('M140 -168 V-62', dark(c, 0.15), 2.5) + R(160, -158, 22, 7, 3.5, dark(c, 0.22));
      o += txt(10, -78, 26, stripe, st === 'modern' ? 'AMBULANCE' : 'CARE CAR') + P(heartD(-200, -100, 26), stripe);
      o += R(-272, -74, 30, 16, 6, SIL) + R(250, -74, 30, 16, 6, SIL) + headlight(260, -118, 11, on, 50) + tailLight(-256, -160, 10, 22, on) + steer(226, -176);
      o += wheel(-160, 44, s, st === 'rainbow' ? 'rainbow' : 'modern') + wheel(170, 44, s, st === 'rainbow' ? 'rainbow' : 'modern');
      return o;
    },
    x: { color: '#ffffff' },
  };
}
const AMBULANCES = fam('ambulance', 'Ambulances', 'hospital', { mount: 'floor', w: 550, h: 350, toggle: true, sfx: 'ding', seats: [sit(190, -96), sit(-60, -110)] }, [
  ambulance('sweet', 'Sweetheart Ambulance'), ambulance('modern', 'City Ambulance'), ambulance('rainbow', 'Rainbow Care Car'),
], (i) => stylePrice(i, 120, 40, 200));

// ---------------- vending machines ----------------
function vending(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = st === 'retro' ? boxT(-80, -320, 160, 320, 50, 8, c) + R(-80, -60, 160, 8, 0, SIL) : box(-80, -320, 160, 320, 12, c);
      o += R(-66, -280, 96, 190, 8, on ? '#fffbe8' : '#eef4fa') + (on ? glow(-18, -190, 90) : '');
      for (let r = 0; r < 4; r++) {
        o += R(-64, -232 + r * 46, 92, 4, 2, '#cfe3f0');
        for (let j = 0; j < 3; j++) {
          const x = -50 + j * 30;
          const y = -234 + r * 46;
          const k = (r + j) % 3;
          o += k === 0 ? box(x - 9, y - 30, 18, 30, 4, TOYC[(r * 3 + j) % 6]) + R(x - 5, y - 36, 10, 7, 3, '#fff') : k === 1 ? E(x, y - 12, 12, 12, '#e8b46a') + C(x - 4, y - 14, 2, '#6b4226') + C(x + 3, y - 10, 2, '#6b4226') : C(x, y - 12, 12, '#e8384f') + Ln(x, y - 24, x + 2, y - 30, '#8a5a3c', 2);
        }
      }
      o += R(-66, -280, 96, 190, 8, GLASS);
      o += R(38, -270, 30, 80, 6, '#4a4a5e') + [0, 1, 2, 3].map((i) => C(46 + (i % 2) * 14, -256 + Math.floor(i / 2) * 16, 4, TOYC[i])).join('') + R(42, -210, 22, 8, 3, '#ffd36b');
      o += R(-60, -80, 90, 26, 6, '#3d3a52') + txt(-18, -296, 18, '#ffffff', st === 'retro' ? 'SNACKS' : 'YUMMY');
      if (st === 'sweet') o += P(heartD(52, -306, 14), '#fff');
      else o += motif('star', 54, -300, 10);
      return o;
    },
  };
}
const VENDINGS = fam('hospvend', 'Vending Machines', 'hospital', { mount: 'floor', w: 170, h: 330, toggle: true, spawn: ['juice', 'cookie', 'apple', 'milk'] }, [
  vending('sweet', 'Sweet Snack Machine'), vending('retro', 'Retro Snack Machine'),
], (i) => stylePrice(i, 40, 15));

// ---------------- doctor kits (props) ----------------
const FIRSTAIDS = fam('firstaid', 'Doctor Kits', 'hospital', { mount: 'prop', w: 100, h: 80, spawn: ['f-bandagebox-sweet', 'f-thermometer-sweet'] }, [
  { st: 'sweet', name: 'Heart First-Aid Kit', art: (c) => boxT(-44, -60, 88, 60, 14, 8, c) + R(-14, -72, 28, 14, 7, 'none', 'stroke="#ffffff" stroke-width="5"') + C(0, -32, 18, '#ffffff') + heartPlus(0, -31, 22, '#ff6f91') + R(-44, -14, 88, 4, 2, dark(c, 0.12)) },
  { st: 'modern', name: 'Modern First-Aid Box', art: (c, _on, s) => box(-44, -62, 88, 62, 6, '#ffffff') + R(-44, -62, 88, 14, 6, c) + R(-8, -46, 16, 40, 3, '#ff5d73') + R(-20, -34, 40, 16, 3, '#ff5d73') + R(-6, -70, 12, 10, 4, s.accent) },
]);
const DOCBAGS = fam('doctorbag', 'Doctor Kits', 'hospital', { mount: 'prop', w: 110, h: 90, spawn: ['f-stethoscope-sweet', 'f-medbottle-sweet'] }, [
  { st: 'sweet', name: 'Pink Doctor Bag', art: (c) => P('M-48 -54 Q-50 -6 -44 0 H44 Q50 -6 48 -54 Q0 -66 -48 -54Z', c) + P('M-48 -54 Q-50 -6 -44 0 H44 Q50 -6 48 -54 Q0 -66 -48 -54Z', 'url(#g-shadeX)') + S('M-20 -60 Q-20 -84 0 -84 Q20 -84 20 -60', dark(c, 0.25), 6) + R(-48, -56, 96, 8, 4, dark(c, 0.15)) + heartPlus(0, -28, 26, '#ffffff', c) + C(-30, -50, 3, GOLD) + C(30, -50, 3, GOLD) },
  { st: 'retro', name: 'Classic Doctor Bag', art: (c, _on, s) => P('M-50 -50 Q-52 -6 -46 0 H46 Q52 -6 50 -50 Q0 -62 -50 -50Z', '#6b4a3a') + P('M-50 -50 Q-52 -6 -46 0 H46 Q52 -6 50 -50 Q0 -62 -50 -50Z', 'url(#g-shadeX)') + S('M-18 -56 Q-18 -80 0 -80 Q18 -80 18 -56', '#4a3328', 6) + R(-50, -52, 100, 8, 4, SIL) + R(-8, -54, 16, 12, 3, GOLD) + C(0, -24, 14, c) + R(-3, -32, 6, 16, 2, '#fff') + R(-8, -27, 16, 6, 2, '#fff') + S('M-40 -40 H40', s.accent, 1.5, op(0.6)), x: { color: '#ff7a6b' } },
], (i) => stylePrice(i, 15, 10));
const STETHOS = fam('stethoscope', 'Doctor Kits', 'hospital', { mount: 'prop', w: 90, h: 60, sfx: 'squeak' }, [
  { st: 'sweet', name: 'Heart Stethoscope', art: (c) => S('M-30 -50 Q-34 -10 0 -12 Q30 -12 28 -40', c, 6) + S('M-30 -50 Q-36 -56 -40 -50 M28 -40 Q34 -48 38 -42', '#9aa3b5', 4) + S('M0 -12 Q2 -4 18 -6', c, 5) + C(26, -12, 12, '#c9cfdd') + C(26, -12, 8, '#ffffff') + P(heartD(26, -16, 9), c) },
  { st: 'candy', name: 'Candy Stethoscope', art: (c, _on, s) => S('M-30 -50 Q-34 -10 0 -12 Q30 -12 28 -40', c, 7) + S('M-30 -50 Q-34 -10 0 -12 Q30 -12 28 -40', '#ffffff', 7, 'stroke-dasharray="6 8"') + C(-38, -50, 6, s.accent) + C(36, -42, 6, s.accent) + S('M0 -12 Q2 -4 18 -6', c, 5) + C(26, -12, 13, s.trim) + C(26, -12, 8, '#ffffff') + C(26, -12, 3, s.trim) },
], (i) => stylePrice(i, 10, 5));
const THERMOS = fam('thermometer', 'Doctor Kits', 'hospital', { mount: 'prop', w: 50, h: 90, toggle: true }, [
  { st: 'sweet', name: 'Smiley Thermometer', art: (c, on) => boxT(-14, -84, 28, 74, 14, 10, c) + R(-10, -70, 20, 26, 5, on ? '#bfe9ff' : '#3d3a52') + (on ? C(-4, -60, 1.8, INK) + C(4, -60, 1.8, INK) + S('M-4 -54 Q0 -50 4 -54', INK, 1.5) : '') + C(0, -26, 5, '#ffffff') + boxT(-6, -12, 12, 12, 4, 6, '#c9cfdd') },
  { st: 'rainbow', name: 'Rainbow Thermometer', art: (_c, on) => RB.map((col, i) => R(-14, -84 + i * 12, 28, 12, i === 0 ? 6 : 0, col)).join('') + R(-10, -70, 20, 22, 5, on ? '#ffffff' : '#ffffffaa') + (on ? P(heartD(0, -66, 12), '#ff6f91') : '') + boxT(-6, -12, 12, 12, 4, 6, '#c9cfdd') },
], (i) => stylePrice(i, 10, 5));
const BANDAGES = fam('bandagebox', 'Doctor Kits', 'hospital', { mount: 'prop', w: 80, h: 60 }, [
  { st: 'sweet', name: 'Heart Bandage Box', art: (c) => box(-34, -46, 68, 46, 6, c) + R(-34, -46, 68, 10, 5, dark(c, 0.1)) + plaster(-2, -24, 1, -12) + P(heartD(18, -40, 8), '#fff') + plaster(18, -54, 0.6, 20, '#ffd0e0') },
  { st: 'candy', name: 'Sticker Bandage Tin', art: (c, _on, s) => E(0, -22, 36, 22, c) + E(0, -28, 36, 18, light(c, 0.15)) + plaster(-10, -28, 0.8, -14, '#ffe680') + plaster(14, -26, 0.7, 24, '#a8e6cf') + C(0, -40, 4, s.trim) },
], (i) => stylePrice(i, 10, 5));
const MEDBOTTLES = fam('medbottle', 'Doctor Kits', 'hospital', { mount: 'prop', w: 50, h: 80 }, [
  { st: 'sweet', name: 'Strawberry Syrup', art: (c) => P('M-18 -50 Q-20 -4 -16 0 H16 Q20 -4 18 -50 Q10 -56 8 -60 H-8 Q-10 -56 -18 -50Z', c, op(0.92)) + R(-10, -72, 20, 14, 4, '#ffffff') + R(-14, -40, 28, 22, 4, '#ffffff') + P(heartD(0, -36, 12), '#ff6f91') + E(-8, -46, 3, 8, '#fff', op(0.5)) },
  { st: 'candy', name: 'Gummy Vitamin Jar', art: (c, _on, s) => box(-22, -54, 44, 54, 10, '#ffffff', 'none') + R(-22, -54, 44, 54, 10, GLASS) + [[-10, -12], [8, -14], [-2, -28], [10, -34], [-12, -38]].map(([x, y], i) => C(x, y, 7, TOYC[i])).join('') + boxT(-24, -66, 48, 14, 6, 4, c) + R(-24, -60, 48, 3, 1.5, s.trim) },
  { st: 'cottage', name: 'Honey Cough Syrup', art: (c) => P('M-20 -42 Q-24 -4 -18 0 H18 Q24 -4 20 -42 Q12 -48 10 -54 H-10 Q-12 -48 -20 -42Z', '#ffb84a', op(0.92)) + cloth('M-14 -54 H14 L18 -66 H-18Z', c, 'check') + R(-12, -30, 24, 16, 3, '#fff3d6') + motif('daisy', 0, -22, 6) + S('M22 -8 L40 -30', '#c9cfdd', 4) + E(42, -32, 6, 4, '#c9cfdd') },
], (i) => stylePrice(i, 10, 5));

// ---------------- get-well gifts ----------------
const balloonArt = (inner: string, c: string) =>
  E(0, -6, 18, 7, '#c9cfdd') + box(-12, -20, 24, 18, 6, c) + swayG(S('M0 -20 Q-10 -80 4 -130 Q12 -150 0 -164', '#9aa3b5', 2) + inner, 0, -20, 4, 3);
const BALLOONS = fam('getwell', 'Get Well Gifts', 'hospital', { mount: 'prop', w: 120, h: 270 }, [
  { st: 'sweet', name: 'Get Well Heart Balloon', art: (c) => balloonArt(P(heartD(0, -260, 110), c) + P(heartD(0, -260, 110), 'url(#g-shadeX)') + E(-30, -236, 10, 16, '#fff', op(0.4)) + txt(0, -208, 15, '#ffffff', 'GET WELL') + P('M-6 -164 L6 -164 L0 -172Z', dark(c, 0.15)), c) },
  { st: 'rainbow', name: 'Rainbow Star Balloon', art: (c) => balloonArt(P(starD(0, -214, 56, 0.55), c) + P(starD(0, -214, 56, 0.55), 'url(#g-shadeX)') + C(-12, -220, 3, INK) + C(12, -220, 3, INK) + S('M-10 -206 Q0 -198 10 -206', INK, 2.5) + E(-22, -208, 5, 3, '#ff9ec7') + E(22, -208, 5, 3, '#ff9ec7') + RB.map((col, i) => S(`M${-6 + i * 2} -164 Q${-20 + i * 6} -150 ${-12 + i * 5} -130`, col, 3)).join(''), c) },
  { st: 'space', name: 'Planet Balloon', art: (c, _on, s) => balloonArt(C(0, -214, 46, c) + C(0, -214, 46, 'url(#g-shadeX)') + E(0, -210, 72, 14, 'none', `stroke="${s.accent}" stroke-width="6"`) + C(-14, -228, 8, '#fff', op(0.35)) + C(16, -200, 6, dark(c, 0.15)) + twinkle(52, -260, 8, s.accent, 1.5), c) },
], (i) => stylePrice(i, 10, 10));
const FLOWERVASES = fam('getwellflowers', 'Get Well Gifts', 'hospital', { mount: 'prop', w: 90, h: 140 }, [
  {
    st: 'sweet', name: 'Tulip Vase',
    art: (c) => {
      let o = '';
      for (const [x, h, col] of [[-22, 96, '#ff6f91'], [0, 116, '#ffd36b'], [22, 100, '#c99bff']] as const) o += S(`M${x * 0.3} -40 Q${x * 0.7} ${-60 - h * 0.3} ${x} ${-h}`, '#5fae6b', 3) + P(`M${x - 10} ${-h} Q${x - 10} ${-h - 20} ${x - 4} ${-h - 22} L${x} ${-h - 14} L${x + 4} ${-h - 22} Q${x + 10} ${-h - 20} ${x + 10} ${-h} Q${x} ${-h + 8} ${x - 10} ${-h}Z`, col);
      o += P('M-18 -48 Q-30 -20 -20 0 H20 Q30 -20 18 -48Z', c) + P('M-18 -48 Q-30 -20 -20 0 H20 Q30 -20 18 -48Z', 'url(#g-shadeX)') + P(heartD(0, -32, 12), '#fff');
      return o;
    },
  },
  {
    st: 'cottage', name: 'Daisy Milk Jug',
    art: (c) => {
      let o = '';
      for (let i = 0; i < 6; i++) { const x = -28 + i * 11; const y = -80 - (i % 3) * 16; o += S(`M${x * 0.3} -50 Q${x * 0.6} ${y + 20} ${x} ${y}`, '#5fae6b', 2.5) + flowerG(x, y, 11, i % 2 ? '#ffffff' : '#fff3b0'); }
      o += P('M-20 -56 L20 -56 Q24 -20 22 0 H-22 Q-24 -20 -20 -56Z', '#ffffff') + P('M20 -50 Q36 -46 32 -26 Q30 -16 22 -16', 'none', 'stroke="#ffffff" stroke-width="5"') + R(-22, -40, 44, 12, 0, c);
      return o;
    },
  },
  {
    st: 'boho', name: 'Sunflower Pot',
    art: (c, _on, s) => {
      let o = '';
      for (const [x, y] of [[-20, -104], [16, -120], [2, -86]] as const) o += S(`M${x * 0.3} -44 Q${x * 0.5} ${y + 20} ${x} ${y}`, '#5fae6b', 3) + motif('sunflower', x, y, 15);
      o += P('M-28 -46 H28 L20 0 H-20Z', s.accent) + R(-32, -50, 64, 10, 5, dark(s.accent, 0.1)) + S('M-22 -26 Q0 -18 22 -26', '#fff3e6', 2, 'stroke-dasharray="3 4"');
      return o;
    },
  },
], (i) => stylePrice(i, 10, 10));

// =====================================================================================
// CAR SHOP
// =====================================================================================
function carLift(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      const post = st === 'modern' ? '#4a4a5e' : c;
      const up = on ? -150 : -60;
      let o = R(-250, -10, 500, 10, 4, '#9aa3b5');
      for (const x of [-230, 210]) o += box(x, -320, 26, 312, 6, post) + R(x + 6, -310, 4, 290, 2, '#fff', op(0.3)) + R(x - 6, -332, 38, 14, 5, dark(post, 0.15));
      o += '<g>' + R(-204, up, 408, 16, 6, st === 'modern' ? s.accent : '#ffd36b') + [-190, -110, -30, 50, 130].map((x) => R(x, up, 40, 16, 0, INK, op(0.25))).join('') + R(-216, up - 4, 30, 24, 6, dark(post, 0.1)) + R(186, up - 4, 30, 24, 6, dark(post, 0.1)) + '</g>';
      o += box(150, -220, 60, 46, 8, '#ffffff') + C(168, -197, 7, on ? '#7fe0b0' : '#c9cfdd') + C(192, -197, 7, on ? '#c9cfdd' : '#ff7eb6');
      if (st === 'sweet') o += P(heartD(-217, -360, 20), '#ff7eb6') + P(heartD(223, -360, 20), '#ff7eb6');
      else o += motif('bolt', -217, -350, 14) + motif('bolt', 223, -350, 14);
      return o;
    },
  };
}
const CARLIFTS = fam('carlift', 'Car Shop', 'cars', { mount: 'floor', w: 520, h: 380, toggle: true, sfx: 'ding', surfaces: [{ x1: -200, x2: 200, y: -60 }] }, [
  carLift('sweet', 'Sweet Car Lift'), carLift('modern', 'Modern Car Lift'),
], (i) => stylePrice(i, 50, 20));

const tyre = (x: number, y: number, r: number, hub = '#c9cfdd') => C(x, y, r, TIRE) + C(x, y, r * 0.6, hub) + C(x, y, r * 0.25, dark(hub, 0.2)) + S(`M${f(x - r * 0.6)} ${f(y - r * 0.6)} A${f(r * 0.85)} ${f(r * 0.85)} 0 0 1 ${f(x + r * 0.6)} ${f(y - r * 0.6)}`, '#fff', 2, op(0.25));
function tireRack(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      const fr = st === 'retro' ? '#9aa3b5' : c;
      let o = R(-130, -300, 14, 300, 6, fr) + R(116, -300, 14, 300, 6, fr);
      for (const y of [-200, -96]) o += R(-130, y, 260, 12, 6, fr);
      const hubs = st === 'retro' ? ['#ffffff', SIL, '#ffffff'] : ['#ff9ec7', '#ffffff', '#ffd36b'];
      for (let i = 0; i < 3; i++) o += tyre(-76 + i * 76, -238, 36, hubs[i]) + tyre(-76 + i * 76, -134, 36, hubs[(i + 1) % 3]) + tyre(-76 + i * 76, -38, 36, hubs[(i + 2) % 3]);
      o += box(-80, -340, 160, 34, 10, st === 'retro' ? s.main : '#ffffff') + txt(0, -316, 18, st === 'retro' ? '#ffffff' : c, 'TIRES');
      return o;
    },
  };
}
const TIRERACKS = fam('tirerack', 'Car Shop', 'cars', { mount: 'floor', w: 280, h: 350 }, [
  tireRack('sweet', 'Sweet Tire Rack'), tireRack('retro', 'Retro Tire Stack'),
], (i) => stylePrice(i, 30, 15));

function toolWall(st: string, name: string): Design {
  return {
    st, name,
    art: (c, _on, s) => {
      let o = box(-150, -100, 300, 200, 10, st === 'woodland' ? s.wood : c);
      for (let y = -84; y < 96; y += 16) for (let x = -134; x < 140; x += 16) o += C(x, y, 1.8, dark(st === 'woodland' ? s.wood : c, 0.2), op(0.6));
      const tool = st === 'woodland' ? '#6b4a3a' : '#4a4a5e';
      // wrench, hammer, screwdriver, saw outline, pliers
      o += G(R(-6, -40, 12, 80, 6, '#b8bfcc') + C(0, -44, 14, '#b8bfcc') + C(0, -48, 7, st === 'woodland' ? s.wood : c), 'translate(-110 0) rotate(-10)');
      o += R(-66, -50, 10, 90, 4, '#c98a5a') + R(-84, -62, 46, 20, 5, tool);
      o += R(-14, -60, 14, 40, 6, s.accent === '#ffffff' ? '#ff7eb6' : s.accent) + R(-9, -20, 4, 50, 2, '#9aa3b5');
      o += P('M30 -60 H110 L104 -20 H36Z', '#d9dde8', 'stroke="#9aa3b5" stroke-width="2"') + R(20, -66, 30, 20, 6, tool) + S('M40 -20 L44 -28 L48 -20 L52 -28 L56 -20 L60 -28 L64 -20 L68 -28 L72 -20 L76 -28 L80 -20 L84 -28 L88 -20 L92 -28 L96 -20 L100 -28', '#9aa3b5', 1.5);
      o += R(-140, 30, 280, 10, 4, dark(st === 'woodland' ? s.wood : c, 0.15)) + box(-120, 40, 70, 46, 6, '#ff5d73') + box(-30, 40, 70, 46, 6, '#7cc8ff') + box(60, 40, 70, 46, 6, '#ffd36b');
      o += [-85, 5, 95].map((x) => R(x - 12, 56, 24, 6, 3, '#fff', op(0.7))).join('');
      if (st === 'sweet') o += P(heartD(110, -86, 14), '#ffffff');
      else o += motif('leaf', 110, -80, 12);
      return o;
    },
  };
}
const TOOLWALLS = fam('toolwall', 'Car Shop', 'cars', { mount: 'wall', w: 310, h: 210 }, [
  toolWall('sweet', 'Sweet Tool Wall'), toolWall('woodland', 'Workshop Tool Wall'),
], (i) => stylePrice(i, 25, 15));

function gasPump(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      const charge = st === 'space';
      let o = R(-70, -12, 140, 12, 4, '#9aa3b5');
      o += st === 'retro' ? boxT(-50, -280, 100, 270, 44, 8, c) + C(0, -300, 34, '#ffffff', 'stroke="' + s.trim + '" stroke-width="6"') + txt(0, -292, 22, c, 'GAS') : box(-50, -270, 100, 260, 12, c);
      o += R(-36, -236, 72, 46, 6, on ? '#bfe9ff' : '#3d3a52');
      if (on) o += charge ? `<rect x="-28" y="-224" width="56" height="22" rx="3" fill="#7fe0b0"><animate attributeName="width" values="4;56;4" dur="2s" repeatCount="indefinite"/></rect>` : txt(0, -204, 22, '#2d6a8a', '8.88');
      o += box(-36, -176, 72, 120, 8, '#ffffff') + (charge ? motif('bolt', 0, -120, 26) : st === 'retro' ? motif('star', 0, -120, 22) : P(heartD(0, -138, 30), c));
      o += S('M50 -150 Q90 -150 90 -100 Q90 -40 60 -30', charge ? s.accent : INK, 6) + R(42, -180, 26, 40, 6, charge ? s.metal : '#4a4a5e');
      if (charge && on) o += blink(C(55, -186, 5, '#7fe0b0'), 0.8);
      return o;
    },
  };
}
const GASPUMPS = fam('gaspump', 'Car Shop', 'cars', { mount: 'floor', w: 180, h: 340, toggle: true, sfx: 'ding' }, [
  gasPump('sweet', 'Sweet Gas Pump'), gasPump('retro', 'Retro Gas Pump'), gasPump('space', 'Star Charging Station'),
], (i) => stylePrice(i, 30, 15));

function carWash(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on) => {
      const cols = st === 'rainbow' ? RB : ['#7cc8ff', '#ff9ec7', '#ffffff', '#7cc8ff', '#ff9ec7', '#ffffff'];
      let o = cloth('M-260 0 V-380 Q-260 -420 -220 -420 H220 Q260 -420 260 -380 V0 H210 V-350 Q210 -370 190 -370 H-190 Q-210 -370 -210 -350 V0Z', c);
      o += box(-120, -460, 240, 50, 18, '#ffffff') + txt(0, -426, 26, st === 'rainbow' ? RB[5] : '#4f9dff', 'CAR WASH');
      const brush = (x: number, y: number, r: number, rev: boolean) => {
        let br = '';
        for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; br += Ln(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * r, y + Math.sin(a) * r, cols[i % 6], r * 0.22); }
        br += C(x, y, r * 0.28, '#4a4a5e') + C(x, y, r * 0.1, '#c9cfdd');
        return on ? spin(br, x, y, 1.2, rev) : br;
      };
      for (const x of [-170, 170]) o += R(x - 4, -350, 8, 340, 4, '#9aa3b5') + brush(x, -200, 66, x > 0);
      o += R(-120, -336, 240, 6, 3, '#9aa3b5') + brush(0, -300, 40, false);
      if (on) for (let i = 0; i < 8; i++) o += `<circle cx="${f(-140 + i * 40)}" cy="-340" r="${f(8 + (i % 3) * 3)}" fill="#ffffff" opacity="0.8"><animate attributeName="cy" values="-340;-40" dur="${f(1.4 + (i % 3) * 0.4)}s" begin="${f(-i * 0.3)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="${f(1.4 + (i % 3) * 0.4)}s" begin="${f(-i * 0.3)}s" repeatCount="indefinite"/></circle>`;
      o += [-120, -40, 40, 120].map((x) => C(x, -360, 8, on ? '#7fe8ff' : '#bfe3ff')).join('');
      return o;
    },
  };
}
const CARWASHES = fam('carwash', 'Car Shop', 'cars', { mount: 'floor', w: 540, h: 470, toggle: true, sfx: 'squeak' }, [
  carWash('sweet', 'Bubble Car Wash'), carWash('rainbow', 'Rainbow Car Wash'),
], (i) => stylePrice(i, 60, 30));

function turntable(st: string, name: string): Design {
  return {
    st, name,
    art: (c, on, s) => {
      let o = E(0, 10, 260, 50, dark(c, 0.2)) + E(0, 0, 260, 50, c) + E(0, 0, 220, 40, light(c, 0.15));
      let ring = '';
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ring += C(Math.cos(a) * 240, Math.sin(a) * 45, 5, on ? (i % 2 ? '#fff6c8' : s.accent) : '#ffffff'); }
      o += on ? `<g>${ring}<animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite"/></g>` : ring;
      o += st === 'space' ? P(starD(0, 0, 60, 0.45, 5, -Math.PI / 2), s.accent, op(0.4)) : P(heartD(0, -30, 60), '#ffffff', op(0.35));
      return o;
    },
  };
}
const TURNTABLES = fam('turntable', 'Car Shop', 'cars', { mount: 'rug', w: 540, h: 130, toggle: true }, [
  turntable('sweet', 'Showroom Turntable'), turntable('space', 'Starlight Turntable'),
], (i) => stylePrice(i, 40, 20));

const OILCANS = fam('oilcan', 'Garage Props', 'cars', { mount: 'prop', w: 80, h: 80 }, [
  { st: 'sweet', name: 'Pink Oil Can', art: (c) => E(0, -8, 26, 8, dark(c, 0.15)) + P('M-26 -8 V-40 Q-26 -50 0 -50 Q26 -50 26 -40 V-8Z', c) + P('M20 -44 L56 -70 L58 -64 L26 -36Z', '#c9cfdd') + S('M-20 -50 Q-30 -70 -10 -72 Q10 -72 4 -50', '#9aa3b5', 4) + P(heartD(0, -38, 16), '#fff') },
  { st: 'retro', name: 'Retro Oil Can', art: (c, _on, s) => box(-24, -54, 48, 54, 6, c) + R(-24, -40, 48, 18, 0, s.trim) + txt(0, -26, 12, c, 'OIL') + R(-8, -64, 16, 12, 3, '#9aa3b5') + P('M14 -54 L44 -78 L48 -72 L22 -48Z', '#b8bfcc') },
], (i) => stylePrice(i, 10, 5));
const TOOLBOXES = fam('toolbox', 'Garage Props', 'cars', { mount: 'prop', w: 110, h: 80, sfx: 'squeak' }, [
  { st: 'sweet', name: 'Heart Toolbox', art: (c) => box(-48, -50, 96, 50, 8, c) + R(-48, -50, 96, 12, 6, dark(c, 0.12)) + S('M-20 -50 V-66 H20 V-50', '#9aa3b5', 6) + R(-10, -34, 20, 10, 3, GOLD) + R(10, -62, 8, 22, 2, '#9aa3b5', 'transform="rotate(20 14 -50)"') + P(heartD(-28, -32, 12), '#fff') },
  { st: 'modern', name: 'Modern Tool Chest', art: (c, _on, s) => box(-48, -64, 96, 64, 4, c) + [-50, -30, -10].map((y) => R(-42, y, 84, 16, 3, dark(c, 0.06)) + R(-12, y + 6, 24, 4, 2, s.accent)).join('') + S('M-30 -64 V-74 H30 V-64', '#4a4a5e', 5) },
], (i) => stylePrice(i, 10, 5));

// =====================================================================================
// TOWN FACADES (base centre at 0,0, drawn upward)
// =====================================================================================
const T = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;
const shadeR = (x: number, y: number, w: number, h: number, r = 0) => R(x, y, w, h, r, 'url(#g-shadeX)');
function windowBox(x: number, y: number, w: number, h: number, curtain: string, lit = false): string {
  let s = R(x - 6, y - 6, w + 12, h + 12, 8, '#ffffff') + R(x, y, w, h, 5, lit ? '#fff1b8' : '#bfe3ff') + R(x, y, w, h, 5, GLASS);
  s += P(`M${f(x)} ${f(y)} L${f(x + w * 0.3)} ${f(y)} Q${f(x + w * 0.22)} ${f(y + h * 0.5)} ${f(x)} ${f(y + h * 0.72)}Z`, curtain) + P(`M${f(x + w)} ${f(y)} L${f(x + w * 0.7)} ${f(y)} Q${f(x + w * 0.78)} ${f(y + h * 0.5)} ${f(x + w)} ${f(y + h * 0.72)}Z`, curtain);
  return s + R(x + w / 2 - 2, y, 4, h, 1, '#ffffff', op(0.9));
}
function flowerBox(x: number, y: number, w: number, s: Season): string {
  if (s === 'winter') return R(x - 8, y - 4, w + 16, 8, 4, '#ffffff');
  const cols = s === 'fall' ? ['#ff8a3d', '#ffc23d', '#e8573d'] : ['#ff7eb6', '#ffd36b', '#ffffff', '#c99bff'];
  let g = R(x - 8, y, w + 16, 12, 5, '#a86b4a');
  for (let i = 0; i < 4; i++) g += flowerG(x + (w * (i + 0.5)) / 4, y - 2, 7, cols[i % cols.length]);
  return g;
}
const roofSnow = (d: string, s: Season) => (s === 'winter' ? P(d, '#ffffff') + P(d, 'url(#g-shadeY)', op(0.4)) : '');
const bush = (x: number, y: number, sc: number, c: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})">${C(-26, -20, 26, dark(c, 0.06))}${C(22, -18, 24, dark(c, 0.06))}${C(0, -32, 30, c)}${C(-8, -42, 10, '#fff', op(0.18))}</g>`;
const bushC = (s: Season) => (s === 'winter' ? '#e8f0fa' : s === 'fall' ? '#d98a3d' : '#5fc47c');
const pumpkin = (x: number, y: number, sc: number) => tr(x, y, E(-12, -18, 13, 17, '#ff8a3d') + E(12, -18, 13, 17, '#ff8a3d') + E(0, -18, 14, 18, '#ffab5e') + R(-2, -42, 5, 9, 2, '#5fae6b'), sc);
function seasonal(s: Season, xs: number[]): string {
  let o = '';
  if (s === 'winter') {
    for (let i = 0; i < 14; i++) o += `<circle cx="${f(-260 + rnd(i) * 520)}" cy="${f(-480 + rnd(i + 7) * 300)}" r="${f(3 + rnd(i + 3) * 3)}" fill="#ffffff" opacity="0.9"><animate attributeName="cy" values="${f(-500 + rnd(i + 7) * 300)};${f(-200 + rnd(i + 7) * 200)}" dur="${f(5 + rnd(i) * 3)}s" begin="${f(-rnd(i + 2) * 5)}s" repeatCount="indefinite"/></circle>`;
    o += E(0, -2, 280, 10, '#ffffff', op(0.9));
  } else if (s === 'fall') {
    for (const x of xs) o += pumpkin(x, 0, 0.9);
    for (let i = 0; i < 9; i++) o += tr(-250 + rnd(i) * 500, -4 - rnd(i + 5) * 10, P('M0 0 Q6 -6 0 -14 Q-6 -6 0 0Z', ['#ff8a3d', '#e8573d', '#ffc23d'][i % 3], `transform="rotate(${Math.round(rnd(i + 9) * 180)})"`));
  } else {
    for (const x of xs) o += flowerG(x, -10, 10, s === 'spring' ? '#ff9ec7' : '#ffd36b') + flowerG(x + 20, -6, 8, '#ffffff') + R(x - 1, -6, 2, 6, 1, '#5fae6b');
  }
  return o;
}

function hospitalFront(s: Season): string {
  const wall = '#eaf6ff';
  const trim = '#8fdcc4';
  let g = E(0, 4, 280, 18, 'url(#g-ground)');
  // side wings and centre block
  g += R(-250, -330, 500, 330, 10, wall) + shadeR(-250, -330, 500, 330, 10) + R(-250, -40, 500, 40, 0, dark(wall, 0.05));
  g += R(-264, -344, 528, 22, 8, trim) + roofSnow('M-266 -344 H266 V-334 Q200 -326 140 -334 Q60 -324 0 -334 Q-60 -324 -140 -334 Q-200 -326 -266 -334Z', s);
  g += R(-100, -470, 200, 140, 10, '#fff3f8') + shadeR(-100, -470, 200, 140, 10) + R(-112, -484, 224, 20, 8, '#ff9ec7') + roofSnow('M-114 -484 H114 V-474 Q60 -466 0 -474 Q-60 -466 -114 -474Z', s);
  // the big heart-plus sign, gently beating
  g += C(0, -530, 52, '#ffffff', `stroke="#ff9ec7" stroke-width="6"`);
  g += `<g transform="translate(0 -528)"><g>${heartPlus(0, 0, 64, '#ff6f91')}<animateTransform attributeName="transform" type="scale" values="1;1.1;1;1.06;1" dur="1.6s" repeatCount="indefinite"/></g></g>`;
  g += T(0, -440, 'HOSPITAL', 30, '#ff6f91');
  for (const x of [-70, 14]) g += windowBox(x, -414, 56, 50, '#ffd9e8', true);
  // windows on both wings
  for (const row of [-300, -200]) for (const x of [-226, -150, 94, 170]) {
    if (row === -200 && x > 0) continue;
    const lit = (x + row) % 3 === 0 || (row === -200 && x < 0);
    g += windowBox(x, row, 56, 60, x < 0 ? '#ffd9e8' : '#c9f2e3', lit) + (row === -200 ? flowerBox(x, -132, 56, s) : '');
  }
  // entrance with glass doors and a canopy
  g += R(-70, -150, 140, 150, 8, '#ffffff') + R(-60, -140, 58, 140, 4, '#cfefff') + R(2, -140, 58, 140, 4, '#cfefff') + R(-60, -140, 120, 140, 4, GLASS) + Ln(0, -140, 0, 0, '#ffffff', 4);
  g += P('M-100 -170 H100 L86 -146 H-86Z', '#ff9ec7') + R(-100, -176, 200, 10, 5, '#ffffff') + roofSnow('M-102 -178 H102 V-170 H-102Z', s);
  g += E(-40, -96, 8, 10, '#fff6c8') + E(40, -96, 8, 10, '#fff6c8');
  // ambulance bay on the right
  g += P('M120 0 V-120 Q120 -160 160 -160 H210 Q250 -160 250 -120 V0Z', '#d9e9f5') + P('M128 0 V-118 Q128 -150 160 -150 H210 Q242 -150 242 -118 V0Z', '#4a5a7a', op(0.35));
  g += tr(185, 0, box(-50, -66, 100, 52, 10, '#ffffff') + R(-50, -40, 100, 8, 0, '#ff7eb6') + R(12, -86, 36, 24, 6, '#ffffff') + R(18, -80, 24, 14, 3, '#bfe3ff') + C(-26, -10, 11, TIRE) + C(26, -10, 11, TIRE) + heartPlus(-14, -50, 18, '#ff6f91') +
    `<circle cx="30" cy="-90" r="5" fill="#ff7eb6"><animate attributeName="fill" values="#ff7eb6;#7cc8ff;#ff7eb6" dur="0.8s" repeatCount="indefinite"/></circle>`);
  g += R(116, -176, 138, 20, 8, trim) + T(185, -161, 'AMBULANCE', 14, '#ffffff');
  // garden and benches
  g += bush(-232, 0, 0.8, bushC(s)) + bush(-140, 0, 0.6, bushC(s));
  g += swayG(S('M-196 -40 Q-204 -90 -214 -126', '#9aa3b5', 1.5) + P(heartD(-214, -160, 34), '#ff7eb6') + S('M-170 -40 Q-164 -100 -156 -136', '#9aa3b5', 1.5) + C(-156, -150, 15, '#7cc8ff') + C(-161, -155, 4, '#fff', op(0.5)), -183, -40, 3, 3);
  g += R(-206, -38, 70, 10, 4, '#a8e6cf') + R(-200, -28, 6, 28, 2, '#9aa3b5') + R(-148, -28, 6, 28, 2, '#9aa3b5');
  g += seasonal(s, [-120, 90]);
  if (s === 'winter') g += P('M-250 -40 Q-200 -52 -150 -40 Z', '#ffffff') + C(-180, -32, 16, '#ffffff') + C(-180, -56, 11, '#ffffff') + C(-183, -58, 1.5, INK) + C(-177, -58, 1.5, INK) + P('M-180 -55 L-172 -53 L-180 -51Z', '#ff8a3d');
  return g;
}

function carshopFront(s: Season): string {
  const wall = '#fff1d6';
  const roof = '#5ab0ef';
  let g = E(0, 4, 280, 18, 'url(#g-ground)');
  g += R(-240, -320, 480, 320, 10, wall) + shadeR(-240, -320, 480, 320, 10) + R(-240, -36, 480, 36, 0, dark(wall, 0.06));
  // wavy roof edge
  let rd = 'M-256 -312 H256 V-334';
  for (let i = 0; i < 8; i++) rd += ` Q${f(256 - 64 * (i + 0.5))} -362 ${f(256 - 64 * (i + 1))} -334`;
  g += P(rd + 'Z', roof) + P('M-256 -318 H256 V-312 H-256Z', dark(roof, 0.15)) + roofSnow('M-258 -334 Q-226 -366 -192 -336 Q-160 -366 -128 -336 Q-96 -366 -64 -336 Q-32 -366 0 -336 Q32 -366 64 -336 Q96 -366 128 -336 Q160 -366 192 -336 Q226 -366 258 -334 V-324 H-258Z', s);
  // spinning sign on a pole
  g += R(-6, -470, 12, 120, 5, '#9aa3b5');
  g += `<g transform="translate(0 -480)"><g><animateTransform attributeName="transform" type="scale" values="1 1;0.08 1;-1 1;0.08 1;1 1" dur="4s" repeatCount="indefinite"/>${C(0, 0, 58, TIRE)}${C(0, 0, 44, '#ffd36b')}${C(0, 0, 44, 'url(#g-shadeX)')}${T(0, 10, 'CARS', 28, '#e8384f')}${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => C(Math.cos((i * Math.PI) / 4) * 51, Math.sin((i * Math.PI) / 4) * 51, 3, '#c9cfdd')).join('')}</g></g>`;
  g += box(-150, -300, 300, 50, 16, '#ffffff') + T(0, -264, 'CAR SHOP', 34, roof) + P(starD(-128, -275, 10), '#ffd36b') + P(starD(128, -275, 10), '#ffd36b');
  // big showroom glass with a car on a turntable
  g += R(-222, -230, 250, 210, 8, '#ffffff') + R(-212, -220, 230, 196, 6, '#e6f6ff');
  g += E(-97, -40, 92, 14, '#c9cfdd') + `<g transform="translate(-97 -44)">${E(0, 0, 80, 10, '#ffd36b', op(0.5))}${R(-64, -46, 128, 34, 14, '#ff7eb6')}${P('M-36 -46 Q-28 -80 0 -80 L16 -80 Q42 -80 50 -46Z', '#ff7eb6')}${P('M-26 -48 Q-20 -72 0 -72 L14 -72 Q34 -72 40 -48Z', '#cfefff')}${C(-38, -12, 14, TIRE)}${C(-38, -12, 6, '#ffffff')}${C(38, -12, 14, TIRE)}${C(38, -12, 6, '#ffffff')}${C(60, -32, 5, '#fff6c8')}${P(heartD(-14, -38, 10), '#ffffff')}</g>`;
  g += twinkle(-180, -190, 9, '#ffe680', 1.6) + twinkle(-20, -170, 7, '#ffe680', 2, 0.6);
  g += R(-212, -220, 230, 196, 6, GLASS) + Ln(-97, -220, -97, -24, '#ffffff', 3, op(0.7));
  // garage door, half open, with a toolbox inside
  g += R(50, -230, 170, 230, 8, '#ffffff') + R(60, -220, 150, 220, 4, '#4a4a5e');
  for (let i = 0; i < 6; i++) g += R(60, -220 + i * 18, 150, 16, 3, i % 2 ? '#ffd36b' : '#ffe9a8');
  g += R(60, -112, 150, 6, 2, '#c9a24a') + box(96, -50, 70, 46, 6, '#e8384f') + R(116, -60, 30, 10, 4, '#9aa3b5') + R(60, -112, 150, 4, 2, '#000', op(0.2));
  // tire stack and gas pump
  for (let i = 0; i < 4; i++) g += E(-262, -16 - i * 26, 28, 13, TIRE) + E(-262, -18 - i * 26, 13, 6, '#6b6680');
  g += tr(262, 0, box(-24, -120, 48, 116, 10, '#ff7eb6') + R(-16, -108, 32, 22, 4, '#bfe9ff') + R(-16, -76, 32, 50, 4, '#ffffff') + P(heartD(0, -64, 16), '#ff7eb6') + S('M24 -70 Q42 -66 40 -34 Q38 -20 28 -18', INK, 5) + R(-30, -6, 60, 6, 3, '#9aa3b5'));
  g += bush(-200, 0, 0.55, bushC(s));
  g += seasonal(s, [-160, 30]);
  if (s === 'winter') g += P('M-222 -230 Q-97 -244 28 -230 V-224 H-222Z', '#ffffff') + P('M50 -230 Q135 -242 220 -230 V-224 H50Z', '#ffffff') + E(-262, -118, 30, 8, '#ffffff');
  return g;
}

export const CARE_FACADES: Record<string, { h: number; art: (s: Season) => string }> = {
  hospital: { h: 590, art: hospitalFront },
  carshop: { h: 545, art: carshopFront },
};

export const CARE_MORE: FurnDef[] = [
  ...HOSPBEDS, ...EXAMTABLES, ...WAITCHAIRS, ...HOSPDESKS, ...WHEELCHAIRS, ...XRAYS, ...EYECHARTS, ...MEDCABINETS, ...SCALES, ...HEIGHTCHARTS,
  ...BABYPODS, ...TOYCORNERS, ...AMBULANCES, ...VENDINGS, ...FIRSTAIDS, ...DOCBAGS, ...STETHOS, ...THERMOS, ...BANDAGES, ...MEDBOTTLES, ...BALLOONS, ...FLOWERVASES,
  ...CONVERTIBLES, ...MINIS, ...JEEPS, ...CAMPERS, ...PICKUPS, ...SPORTS, ...LIMOS, ...BEETLES, ...ICETRUCKS, ...TAXIS, ...PATROLS, ...FIRETRUCKS, ...BUSES,
  ...GOLFCARTS, ...SCOOTERS, ...BIKES, ...TRACTORS, ...KARTS, ...CARRIAGES,
  ...CARLIFTS, ...TIRERACKS, ...TOOLWALLS, ...GASPUMPS, ...CARWASHES, ...TURNTABLES, ...OILCANS, ...TOOLBOXES,
];
