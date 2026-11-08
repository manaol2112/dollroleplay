// Small DOM helpers shared by the screens and panels.
import { body } from '../art/body';
import { renderDoll } from '../art/doll';
import { FLOOR_BY_ID, WALL_BY_ID } from '../art/scenes';
import { sound } from '../engine/audio';
import type { Look, Slot } from '../types';
import { icon } from './icons';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export interface Modal {
  el: HTMLDivElement;
  box: HTMLDivElement;
  close: () => void;
}

/** A centered card over a dimmed screen. */
export function openModal(cls: string, html: string, onClose?: () => void): Modal {
  const layer = document.getElementById('overlay')!;
  const wrap = el('div', `modal ${cls}`);
  const box = el('div', 'modal-box', html);
  wrap.appendChild(box);
  layer.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove('show');
    window.setTimeout(() => wrap.remove(), 220);
    onClose?.();
  };
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target === wrap) close();
  });
  box.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => {
    sound.tap();
    close();
  }));
  return { el: wrap, box, close };
}

export function confirmBox(title: string, text: string, yes: string, art = '', onYes: () => void, no = 'Not now'): void {
  const m = openModal('confirm', `<div class="confirm-art">${art}</div><h2>${esc(title)}</h2><p>${text}</p><div class="row"><button class="btn ghost" data-close>${esc(no)}</button><button class="btn primary" data-yes>${yes}</button></div>`);
  m.box.querySelector('[data-yes]')!.addEventListener('click', () => {
    m.close();
    onYes();
  });
}

export function promptName(current: string, onDone: (name: string) => void): void {
  const m = openModal('confirm', `<h2>Name your friend</h2><input class="name-input" maxlength="14" value="${esc(current)}" autocomplete="off" spellcheck="false"/><div class="row"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-yes>${icon('check')}<span>Save</span></button></div>`);
  const input = m.box.querySelector('input')!;
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 60);
  const save = () => {
    const v = input.value.replace(/[<>]/g, '').trim().slice(0, 14);
    if (v) onDone(v);
    m.close();
  };
  m.box.querySelector('[data-yes]')!.addEventListener('click', save);
  input.addEventListener('keydown', (e) => e.key === 'Enter' && save());
}

// ---------------- thumbnails ----------------
export function headThumb(look: Look): string {
  const b = body(look.age);
  const R = b.R;
  return `<svg viewBox="${-R * 1.45} ${b.headY - R * 1.5} ${R * 2.9} ${R * 2.75}">${renderDoll(look, { headOnly: true })}</svg>`;
}

export function slotBox(look: Look, slot: Slot | 'hair' | 'face' | 'full'): string {
  const b = body(look.age);
  const R = b.R;
  switch (slot) {
    case 'top':
    case 'outer':
      return `-105 ${b.shY - 40} 210 ${b.hipY - b.shY + 110}`;
    case 'bottom':
      return `-100 ${b.waistY - 30} 200 ${-b.waistY + 40}`;
    case 'dress':
      return `-130 ${b.shY - 40} 260 ${-b.shY + 50}`;
    case 'shoes':
      return `-62 ${b.ankleY - 58} 124 78`;
    case 'neck':
      return `-75 ${b.shY - 35} 150 ${b.waistY - b.shY + 75}`;
    case 'head':
    case 'hair':
      return `${-R * 1.7} ${b.headY - R * 2.05} ${R * 3.4} ${R * 3.2}`;
    case 'face':
      return `${-R * 1.15} ${b.headY - R * 0.75} ${R * 2.3} ${R * 1.6}`;
    default:
      return `-200 ${b.headY - R * 2.1} 400 ${-b.headY + R * 2.1 + 20}`;
  }
}

export const lookThumb = (look: Look, box: string, opts: Parameters<typeof renderDoll>[1] = {}) =>
  `<svg viewBox="${box}" preserveAspectRatio="xMidYMid meet">${renderDoll(look, opts)}</svg>`;

export function wallThumb(id: string): string {
  const w = WALL_BY_ID[id];
  return `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="${w.color}"/>${w.pattern !== 'none' ? `<rect width="100" height="100" fill="url(#p-${w.pattern})" transform="scale(1.6)"/>` : ''}<rect width="100" height="100" fill="url(#g-wallDepth)"/></svg>`;
}

export function floorThumb(id: string): string {
  const fl = FLOOR_BY_ID[id];
  let s = `<rect width="100" height="100" fill="${fl.a}"/>`;
  if (fl.kind === 'wood') for (let y = 0; y < 100; y += 20) s += `<rect y="${y}" width="100" height="2" fill="${fl.b}"/><rect x="${(y * 3) % 70 + 10}" y="${y}" width="2" height="20" fill="${fl.b}"/>`;
  if (fl.kind === 'tiles') for (let y = 0; y < 100; y += 25) for (let x = 0; x < 100; x += 25) if ((x + y) / 25 % 2) s += `<rect x="${x}" y="${y}" width="25" height="25" fill="${fl.b}"/>`;
  if (fl.kind === 'carpet') for (let i = 0; i < 30; i++) s += `<circle cx="${(i * 37) % 100}" cy="${(i * 53) % 100}" r="3" fill="${fl.b}"/>`;
  if (fl.kind === 'marble') s += `<path d="M10 0 q20 30 0 60 t20 40 M60 0 q-15 40 10 70" stroke="${fl.b}" stroke-width="3" fill="none"/>`;
  return `<svg viewBox="0 0 100 100">${s}</svg>`;
}
