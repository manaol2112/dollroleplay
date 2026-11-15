// Dev-only page for the sticker book and the surprise box. Open /stickers-dev.html#<screen> under the dev server:
// #all (every sticker), #book, #page, #award, #surprise, #surprise-done. Add ?fill=40 to start with 40 stickers.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../styles.css';
import { installDefs } from '../art/defs';
import { STICKERS, STICKER_SETS, stickerSvg } from '../art/stickers';
import { initParticles } from '../engine/particles';

installDefs();
initParticles(document.getElementById('fx') as HTMLCanvasElement);
const screen = location.hash.slice(1) || 'all';
const stage = document.getElementById('stage')!;

if (screen === 'all' || screen === 'sil' || screen === 'big') {
  const size = screen === 'big' ? 180 : 110;
  stage.style.cssText = 'overflow:auto;padding:12px;background:#fff3f8';
  stage.innerHTML = STICKER_SETS.map((s) => `<h3 style="margin:8px 0 2px;color:${s.color};-webkit-text-stroke:0.5px #4a2546">${s.name}</h3><div style="display:flex;flex-wrap:wrap;gap:6px">` +
    STICKERS.filter((x) => x.set === s.id).map((x) => `<div style="text-align:center;font-size:12px;width:${size}px">${stickerSvg(x.id, size, { silhouette: screen === 'sil' })}${x.name}<br><small>${x.rarity}</small></div>`).join('') + '</div>').join('');
}

// ---------------- the real screens ----------------
const q = new URLSearchParams(location.search);
void (async () => {
  if (['all', 'sil', 'big'].includes(screen)) return;
  const { G } = await import('../game');
  const { pickSticker } = await import('../art/stickers');
  const { dayKey } = await import('../data/state');
  const { awardSticker, openStickerBook } = await import('../ui/stickers');
  const { openSurpriseBox } = await import('../ui/surprise');
  const coins = document.querySelector('#hud .coins') as HTMLElement;
  coins.innerHTML = `<span></span>`;
  const show = () => (coins.querySelector('span')!.textContent = String(G.s.coins));
  G.on(show);
  show();
  G.s.settings.sound = false;
  if (q.has('reset')) {
    G.s.stickers = [];
    G.s.stickerPage = [];
    for (const k of Object.keys(G.s.stats)) if (k.startsWith('stickerSet:')) delete G.s.stats[k];
  }
  const fill = Number(q.get('fill') ?? (screen === 'book' || screen === 'page' ? 40 : 0));
  if (fill && G.s.stickers.length < fill) {
    while (G.s.stickers.length < fill) G.s.stickers.push(pickSticker(G.s.stickers));
    G.s.stickers.push(G.s.stickers[0], G.s.stickers[0], G.s.stickers[1]);
  }
  if (q.has('fullset')) for (const s of STICKERS.filter((x) => x.set === q.get('fullset'))) if (!G.s.stickers.includes(s.id)) G.s.stickers.push(s.id);
  if (q.has('almost')) G.s.stickers = STICKERS.filter((x) => x.id !== q.get('almost')).map((x) => x.id);
  G.changed();
  const again = () => window.setTimeout(() => location.reload(), 400);
  if (screen === 'book') {
    openStickerBook(again);
    if (q.get('tab')) (document.querySelector(`[data-tab="${q.get('tab')}"]`) as HTMLElement).click();
  }
  if (screen === 'page') {
    if (!G.s.stickerPage?.length) {
      const u = [...new Set(G.s.stickers)];
      G.s.stickerPage = u.slice(0, 7).map((id, i) => ({ id, x: 0.15 + i * 0.12, y: 0.3 + (i % 3) * 0.2, r: (i % 2 ? 1 : -1) * i * 4, s: 0.8 + (i % 3) * 0.3 }));
    }
    openStickerBook(again);
    (document.querySelector('[data-tab="mine"]') as HTMLElement).click();
  }
  if (screen === 'award') {
    window.setTimeout(() => awardSticker(q.get('reason') ?? 'Read a book'), 300);
    if (q.has('twice')) window.setTimeout(() => awardSticker('Finished a challenge'), 500);
  }
  if (screen === 'surprise') {
    G.s.surpriseDay = '';
    const kind = q.get('prize');
    const prize = kind === 'coins' ? { kind: 'coins' as const, n: 40 } : kind === 'sticker' ? { kind: 'sticker' as const } : kind ? { kind: 'item' as const, key: kind } : undefined;
    openSurpriseBox(again, { prize });
  }
  if (screen === 'surprise-done') {
    G.s.surpriseDay = dayKey(new Date());
    openSurpriseBox(again);
  }
})();
