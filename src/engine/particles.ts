// A canvas laid over the whole screen for weather and celebration effects.
import type { Season } from '../types';

type Kind = 'petal' | 'leaf' | 'snow' | 'sparkle' | 'confetti' | 'heart' | 'bubble' | 'note';
interface Pt {
  k: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  life: number;
  max: number;
  color: string;
  g: number;
  sway: number;
}

const COLORS: Record<string, string[]> = {
  petal: ['#ffc2dc', '#ffd9e8', '#ff9ec7', '#ffffff'],
  leaf: ['#ff8a3d', '#e8573d', '#ffc23d', '#d9672e'],
  snow: ['#ffffff'],
  sparkle: ['#ffe680', '#ffffff', '#fff3b0'],
  confetti: ['#ff7eb6', '#7cc8ff', '#ffd36b', '#5fd3b5', '#c99bff', '#ff9a6b'],
  heart: ['#ff4f8b', '#ff7eb6', '#ff9ec7'],
  bubble: ['#bfe8ff'],
  note: ['#9b6bff', '#ff4f8b', '#4f9dff'],
};

let canvas: HTMLCanvasElement;
let g: CanvasRenderingContext2D;
let pts: Pt[] = [];
let weather: Season | null = null;
let running = false;
let last = 0;
let dpr = 1;
let w = 0;
let h = 0;

export function initParticles(el: HTMLCanvasElement): void {
  canvas = el;
  g = el.getContext('2d')!;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  };
  resize();
  window.addEventListener('resize', resize);
}

export function setWeather(s: Season | null): void {
  weather = s;
  pts = pts.filter((p) => !['petal', 'leaf', 'snow'].includes(p.k) || p.k === weatherKind(s));
  start();
}

const weatherKind = (s: Season | null): Kind | null => (s === 'spring' ? 'petal' : s === 'fall' ? 'leaf' : s === 'winter' ? 'snow' : s === 'summer' ? 'sparkle' : null);

function spawn(k: Kind, x: number, y: number, o: Partial<Pt> = {}): void {
  const cols = COLORS[k];
  pts.push({
    k, x, y, vx: 0, vy: 0, r: 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4, life: 0, max: 6, color: cols[Math.floor(Math.random() * cols.length)], g: 0, sway: Math.random() * 6, ...o,
  });
}

export function burst(kind: 'confetti' | 'sparkle' | 'heart' | 'note' | 'bubble', x: number, y: number, n = 24): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = kind === 'confetti' ? 200 + Math.random() * 500 : 60 + Math.random() * 200;
    spawn(kind, x, y, {
      vx: Math.cos(a) * sp * (kind === 'confetti' ? 0.7 : 1),
      vy: Math.sin(a) * sp - (kind === 'confetti' ? 350 : kind === 'heart' || kind === 'note' || kind === 'bubble' ? 120 : 0),
      g: kind === 'confetti' ? 700 : kind === 'heart' || kind === 'note' || kind === 'bubble' ? -40 : 0,
      r: kind === 'confetti' ? 5 + Math.random() * 4 : kind === 'heart' || kind === 'note' ? 9 + Math.random() * 6 : 4 + Math.random() * 6,
      max: kind === 'confetti' ? 2.6 : 1.2 + Math.random() * 0.6,
      vr: (Math.random() - 0.5) * 12,
    });
  }
  start();
}

/** Confetti raining from the top of the screen. */
export function celebrate(): void {
  for (let i = 0; i < 120; i++) spawn('confetti', Math.random() * w, -20 - Math.random() * 300, { vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 160, g: 80, r: 5 + Math.random() * 4, max: 5, vr: (Math.random() - 0.5) * 10 });
  start();
}

function start(): void {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

function drawShape(p: Pt): void {
  const fade = Math.min(1, (p.max - p.life) / 0.5, p.life / 0.15);
  g.globalAlpha = Math.max(0, fade) * (p.k === 'snow' ? 0.9 : 1);
  g.fillStyle = p.color;
  g.save();
  g.translate(p.x, p.y);
  g.rotate(p.rot);
  const r = p.r;
  switch (p.k) {
    case 'petal':
      g.beginPath();
      g.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case 'leaf':
      g.beginPath();
      g.moveTo(0, -r);
      g.quadraticCurveTo(r, 0, 0, r);
      g.quadraticCurveTo(-r, 0, 0, -r);
      g.fill();
      break;
    case 'snow':
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fill();
      break;
    case 'sparkle':
      g.beginPath();
      g.moveTo(0, -r);
      g.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0);
      g.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
      g.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0);
      g.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r);
      g.fill();
      break;
    case 'confetti':
      g.fillRect(-r, -r * 0.5, r * 2, r);
      break;
    case 'heart':
      g.rotate(-p.rot);
      g.beginPath();
      g.moveTo(0, r * 0.3);
      g.bezierCurveTo(-r * 0.5, -r * 0.25, -r * 1.05, r * 0.25, 0, r);
      g.bezierCurveTo(r * 1.05, r * 0.25, r * 0.5, -r * 0.25, 0, r * 0.3);
      g.fill();
      break;
    case 'bubble':
      g.globalAlpha *= 0.6;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
      g.fill();
      break;
    case 'note':
      g.rotate(-p.rot * 0.8);
      g.beginPath();
      g.ellipse(0, r * 0.6, r * 0.55, r * 0.42, -0.4, 0, Math.PI * 2);
      g.fill();
      g.fillRect(r * 0.35, -r, r * 0.22, r * 1.6);
      break;
  }
  g.restore();
}

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const wk = weatherKind(weather);
  if (wk && document.visibilityState === 'visible') {
    const rate = wk === 'snow' ? 26 : wk === 'sparkle' ? 5 : 9;
    let n = rate * dt + Math.random() * 0.2;
    while (n-- > 0 && Math.random() < 1) {
      if (wk === 'sparkle') spawn('sparkle', Math.random() * w, Math.random() * h * 0.6, { r: 3 + Math.random() * 5, max: 1.6, vr: 0 });
      else spawn(wk, Math.random() * (w + 200) - 100, -20, { vy: wk === 'snow' ? 40 + Math.random() * 50 : 50 + Math.random() * 40, vx: wk === 'snow' ? -10 : 30, r: wk === 'snow' ? 2 + Math.random() * 3.5 : 5 + Math.random() * 5, max: 30 });
    }
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  pts = pts.filter((p) => {
    p.life += dt;
    p.vy += p.g * dt;
    if (p.k === 'confetti') {
      p.vx *= 0.99;
      if (p.vy > 220) p.vy = 220;
    }
    const sway = p.k === 'petal' || p.k === 'leaf' || p.k === 'snow' ? Math.sin(p.life * 1.6 + p.sway) * 30 : 0;
    p.x += (p.vx + sway) * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.k === 'sparkle' && wk === 'sparkle' && p.max === 1.6) p.r = (3 + p.sway) * Math.sin((p.life / p.max) * Math.PI);
    drawShape(p);
    return p.life < p.max && p.y < h + 40 && p.x > -150 && p.x < w + 150;
  });
  g.globalAlpha = 1;
  if (pts.length || wk) requestAnimationFrame(frame);
  else {
    running = false;
    g.clearRect(0, 0, w, h);
  }
}
