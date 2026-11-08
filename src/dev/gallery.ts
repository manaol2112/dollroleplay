// Dev-only page that draws every doll part and item so art changes can be checked at a glance.
// Open /gallery.html?s=dolls (or wear, hair, furniture, scenes) under `npm run dev`.
import { installDefs } from '../art/defs';
import { renderDoll } from '../art/doll';
import { HAIR } from '../art/doll';
import { WEAR } from '../art/wear';
import { baseLook, starterLooks } from '../data/looks';
import type { Look } from '../types';

installDefs();
const g = document.getElementById('g')!;
const q = new URLSearchParams(location.search).get('s') ?? 'dolls';
const cell = (svg: string, label: string, w = 180, h = 260, vb = '-130 -420 260 440') =>
  `<div class="cell"><svg width="${w}" height="${h}" viewBox="${vb}">${svg}</svg>${label}</div>`;
let html = '';
if (q === 'dolls') {
  for (const s of starterLooks()) for (const pose of ['stand', 'held', 'sit', 'wave'] as const)
    html += cell(`<g transform="translate(0 ${pose === 'sit' ? -120 : 0})">${renderDoll(s.look, { pose })}</g>`, `${s.name} ${pose}`);
  for (const age of ['kid', 'teen', 'adult'] as const) html += cell(renderDoll({ ...baseLook(), age }), age);
  html += cell(`<g transform="translate(0 -150)">${renderDoll(starterLooks()[0].look, { pose: 'sleep' })}</g>`, 'sleep', 260, 200, '-260 -260 400 300');
  for (const e of ['happy', 'surprised', 'yum'] as const) html += cell(renderDoll(starterLooks()[1].look, { expr: e }), e);
}
if (q === 'wear') {
  for (const w of WEAR) {
    const look: Look = { ...baseLook(), hair: 'bun', wear: { ...baseLook().wear } };
    if (w.slot === 'dress') { delete look.wear.top; delete look.wear.bottom; }
    look.wear[w.slot] = { id: w.id, color: w.color, pattern: 'none' };
    html += cell(renderDoll(look), w.id, 130, 190);
  }
}
if (q === 'hair') {
  for (const h of HAIR) for (const age of ['kid', 'adult'] as const)
    html += cell(renderDoll({ ...baseLook(), age, hair: h.id, hairColor: age === 'kid' ? '#8a5a34' : '#f2cf7a' }), h.id, 150, 220);
}
g.innerHTML = html;
import { FURNITURE, furnViewBox, FURN_BY_ID } from '../art/furniture';
if (q === 'furniture') {
  let h = '';
  for (const d of FURNITURE) h += `<div class="cell"><svg width="150" height="130" viewBox="${furnViewBox(d)}">${d.art(d.color ?? '#ff9ec7', true)}${d.front ? d.front(d.color ?? '#ff9ec7', true) : ''}</svg>${d.id}</div>`;
  const lk = starterLooks();
  const seatDemo = (id: string, li: number) => {
    const d = FURN_BY_ID[id];
    const s = d.seats![0];
    const c = d.color ?? '#ff9ec7';
    return `<div class="cell"><svg width="300" height="300" viewBox="-260 -480 520 520">${d.art(c, false)}<g transform="translate(${s.x} ${s.y})">${renderDoll(lk[li].look, { pose: s.pose === 'sleep' ? 'sleep' : 'sit' })}</g>${d.front ? d.front(c, false) : ''}</svg>${id}+doll</div>`;
  };
  h += seatDemo('sofa', 0) + seatDemo('bed', 1) + seatDemo('schoolDesk', 2) + seatDemo('swings', 0) + seatDemo('salonChair', 3) + seatDemo('dryer', 1) + seatDemo('grandPiano', 0) + seatDemo('canopyBed', 3);
  g.innerHTML = h;
}
