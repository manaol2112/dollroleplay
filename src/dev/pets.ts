// Dev-only page for the pets feature. Open /pets-dev.html#gallery, #acc, #shop, #care or #care-bath etc.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { initParticles } from '../engine/particles';
import { PET_ACC, PET_KINDS, basePetLook, petBox, renderPet, type PetPose } from '../art/pets';
import { renderDoll } from '../art/doll';
import { starterLooks } from '../data/looks';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
const hash = location.hash.slice(1) || 'gallery';
const [view, arg] = hash.split('-');
const pg = document.getElementById('pg')!;
const qs = new URLSearchParams(location.search);
const still = qs.get('still') === '1';

const cell = (svg: string, vb: string, label: string, w = 170) =>
  `<div style="background:#fff;border-radius:12px;text-align:center;font:12px sans-serif;width:${w}px"><svg viewBox="${vb}" width="${w}" height="${w}" style="background:#fdf1f7;border-radius:12px">${svg}</svg>${label}</div>`;

if (view === 'gallery' || view === 'acc' || view === 'size') {
  document.documentElement.style.cssText = 'overflow:auto;height:auto';
  document.body.style.cssText = 'overflow:auto;height:auto';
  (document.getElementById('app') as HTMLElement).style.position = 'static';
  pg.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f6e8f0;min-height:100vh';
  let html = '';
  if (view === 'gallery') {
    const poses: PetPose[] = (qs.get('poses')?.split(',') as PetPose[]) ?? ['stand', 'walk', 'sit', 'sleep', 'held'];
    const kinds = qs.get('kinds')?.split(',') ?? PET_KINDS.map((k) => k.id);
    const expr = (qs.get('expr') ?? undefined) as 'happy' | undefined;
    const pat = qs.get('pat');
    for (const kind of kinds) for (const pose of poses) {
      const look = basePetLook(kind);
      if (pat) look.pattern = pat;
      html += cell(renderPet(look, { pose, expr, still, shadow: true }), petBox(look, pose === 'held' ? 'held' : 'stand', 30), `${kind} ${pose}`, Number(qs.get('w') ?? 170));
    }
  }
  if (view === 'acc') {
    const slot = qs.get('slot') ?? 'head';
    const kinds = qs.get('kinds')?.split(',') ?? ['puppy', 'bunny', 'pony', 'duckling'];
    const pose = (qs.get('pose') ?? 'stand') as PetPose;
    const ids = qs.get('ids')?.split(',');
    for (const a of PET_ACC.filter((x) => x.slot === slot && (!ids || ids.includes(x.id)))) for (const kind of kinds) {
      const look = basePetLook(kind);
      look.acc[a.slot] = { id: a.id, color: a.color };
      html += cell(renderPet(look, { pose, still, shadow: true }), petBox(look, pose, 16), `${a.name} ${kind}`, Number(qs.get('w') ?? 140));
    }
  }
  if (view === 'size') {
    const doll = starterLooks()[0].look;
    let svg = renderDoll(doll, {});
    let x = 180;
    for (const k of PET_KINDS) { svg += `<g transform="translate(${x} 0)">${renderPet(basePetLook(k.id), { still })}</g>`; x += 150; }
    html = `<svg viewBox="-150 -400 ${x + 100} 440" width="1600" style="background:#fff">${svg}</svg>`;
  }
  pg.innerHTML = html;
} else {
  void import('../ui/pets').then((m) => m.devOpen(view, arg));
}
