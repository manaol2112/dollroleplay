// Playground sports: basketball (swipe to shoot, with real ball physics) and soccer penalty kicks
// against a diving goalkeeper. Any friend can be the player.
import { dark } from '../art/color';
import { renderDoll } from '../art/doll';
import { landscape } from '../art/scenes';
import { starD } from '../art/wear';
import { sound } from '../engine/audio';
import { burst, celebrate } from '../engine/particles';
import { G } from '../game';
import type { Doll } from '../types';
import { el, esc, headThumb } from './dom';
import { icon } from './icons';

const NS = 'http://www.w3.org/2000/svg';
const f = (n: number) => n.toFixed(1);
type Game = 'basketball' | 'soccer';

let lastGame: Game = 'basketball';

export function openSports(dollId: string | undefined, onClose: () => void): void {
  const layer = document.getElementById('overlay')!;
  const root = el('div', 'sports');
  layer.appendChild(root);
  requestAnimationFrame(() => root.classList.add('show'));
  const boys = G.s.dolls.filter((d) => d.look.boy);
  let player: Doll = G.s.dolls.find((d) => d.id === dollId) ?? boys[0] ?? G.s.dolls[0];
  let stop: (() => void) | null = null;

  const close = () => {
    stop?.();
    sound.tap();
    root.classList.remove('show');
    window.setTimeout(() => root.remove(), 260);
    onClose();
  };

  const chooser = () => {
    stop?.();
    stop = null;
    root.innerHTML = `<div class="sport-pick">
      <button class="round-btn sp-close" data-x>${icon('close')}</button>
      <h2>Let's play!</h2>
      <div class="sport-cards">
        <button class="sport-card bb${lastGame === 'basketball' ? ' on' : ''}" data-game="basketball">${ballArt('basketball', 70)}<b>Basketball</b><small>Swipe up to shoot hoops</small></button>
        <button class="sport-card sc${lastGame === 'soccer' ? ' on' : ''}" data-game="soccer">${ballArt('soccer', 70)}<b>Soccer</b><small>Kick past the goalie</small></button>
      </div>
      <h3>Who's playing?</h3>
      <div class="roster sp-roster">${G.s.dolls.map((d) => `<button class="ava${d === player ? ' on' : ''}" data-player="${d.id}" title="${esc(d.name)}">${headThumb(d.look)}</button>`).join('')}</div>
    </div>`;
  };
  root.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-x]')) return close();
    const p = t.closest('[data-player]') as HTMLElement | null;
    if (p) {
      player = G.s.dolls.find((d) => d.id === p.dataset.player) ?? player;
      sound.giggle();
      root.querySelectorAll('[data-player]').forEach((b) => b.classList.toggle('on', b === p));
      return;
    }
    const g = t.closest('[data-game]') as HTMLElement | null;
    if (g) {
      lastGame = g.dataset.game as Game;
      sound.pop();
      start(lastGame);
    }
    if (t.closest('[data-back]')) chooser();
    if (t.closest('[data-again]')) start(lastGame);
  });

  const start = (game: Game) => {
    stop?.();
    root.innerHTML = `<div class="sp-hud"><button class="round-btn" data-back>${icon('back')}</button><div class="pill sp-score">${icon('star')}<span class="n">0</span></div><div class="pill sp-time"><span class="n"></span></div><button class="round-btn" data-x>${icon('close')}</button></div><div class="sp-banner"></div><div class="sp-result"></div>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sp-svg');
    svg.setAttribute('viewBox', '0 0 1600 900');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    root.prepend(svg);
    stop = game === 'basketball' ? basketball(svg, root, player) : soccer(svg, root, player);
  };

  chooser();
}

// ---------------- shared bits ----------------
function ballArt(kind: Game, r: number, rot = 0): string {
  if (kind === 'basketball') {
    return `<svg viewBox="${-r} ${-r} ${r * 2} ${r * 2}" class="ball-ic"><g transform="rotate(${rot})"><circle r="${r}" fill="#ff8a3d"/><circle r="${r}" fill="url(#g-shadeX)"/>` +
      `<path d="M${-r} 0 L${r} 0 M0 ${-r} L0 ${r} M${-r * 0.7} ${-r * 0.7} Q0 0 ${-r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} Q0 0 ${r * 0.7} ${r * 0.7}" stroke="#7a3a10" stroke-width="${r * 0.07}" fill="none"/></g></svg>`;
  }
  return `<svg viewBox="${-r} ${-r} ${r * 2} ${r * 2}" class="ball-ic"><g transform="rotate(${rot})">${soccerBall(r)}</g></svg>`;
}
function bball(r: number): string {
  return `<circle r="${r}" fill="#ff8a3d"/><circle r="${r}" fill="url(#g-shadeX)"/><path d="M${-r} 0 L${r} 0 M0 ${-r} L0 ${r} M${-r * 0.7} ${-r * 0.7} Q0 0 ${-r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} Q0 0 ${r * 0.7} ${r * 0.7}" stroke="#7a3a10" stroke-width="${r * 0.08}" fill="none"/><circle cx="${-r * 0.35}" cy="${-r * 0.4}" r="${r * 0.22}" fill="#fff" opacity="0.25"/>`;
}
function soccerBall(r: number): string {
  let s = `<circle r="${r}" fill="#ffffff" stroke="#2d2a3a" stroke-width="${r * 0.06}"/>`;
  s += `<path d="${pent(0, 0, r * 0.32)}" fill="#2d2a3a"/>`;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    s += `<path d="${pent(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.22)}" fill="#2d2a3a"/><line x1="${f(Math.cos(a) * r * 0.32)}" y1="${f(Math.sin(a) * r * 0.32)}" x2="${f(Math.cos(a) * r * 0.62)}" y2="${f(Math.sin(a) * r * 0.62)}" stroke="#2d2a3a" stroke-width="${f(r * 0.05)}"/>`;
  }
  return s + `<circle cx="${-r * 0.35}" cy="${-r * 0.4}" r="${r * 0.2}" fill="#fff" opacity="0.5"/><circle r="${r}" fill="url(#g-shadeX)"/>`;
}
const pent = (x: number, y: number, r: number) => Array.from({ length: 5 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
  return `${i ? 'L' : 'M'}${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`;
}).join('') + 'Z';

function toWorld(svg: SVGSVGElement, cx: number, cy: number) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}
function toScreen(svg: SVGSVGElement, x: number, y: number) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(x, y).matrixTransform(m);
  return { x: p.x, y: p.y };
}
function banner(root: HTMLElement, text: string, cls = '') {
  const b = root.querySelector('.sp-banner') as HTMLElement;
  b.className = `sp-banner show ${cls}`;
  b.textContent = text;
  window.setTimeout(() => b.classList.remove('show'), 900);
}
function finish(root: HTMLElement, title: string, lines: string[], coins: number, best: boolean) {
  const r = root.querySelector('.sp-result') as HTMLElement;
  r.innerHTML = `<div class="sp-card"><div class="done-stars">${icon('star')}${icon('star')}${icon('star')}</div><h2>${esc(title)}</h2>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}${best ? '<p class="best">New best score!</p>' : ''}<div class="row"><button class="btn" data-back>${icon('toy')}<span>Other game</span></button><button class="btn primary" data-again>${icon('star')}<span>Play again</span></button></div></div>`;
  r.classList.add('show');
  celebrate();
  sound.applause();
  if (coins) G.earn(coins, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
}
const dollG = (d: Doll, pose: 'stand' | 'wave' | 'held', expr: 'normal' | 'happy' | 'surprised' = 'normal') => renderDoll(d.look, { pose, expr });

// ---------------- basketball ----------------
function basketball(svg: SVGSVGElement, root: HTMLElement, player: Doll): () => void {
  const GR = 2300;
  const BR = 34;
  const FLOOR = 830;
  const START = { x: 505, y: 572 };
  const TIME = 45;
  let hoop = { x: 1240, y: 360 };
  let hoopDir = 0;
  let level = 0;
  let score = 0;
  let baskets = 0;
  let streak = 0;
  let timeLeft = TIME;
  let running = true;
  let ended = false;
  let ball = { x: START.x, y: START.y, vx: 0, vy: 0, rot: 0, live: false, touched: false, scored: false, bounces: 0, age: 0 };

  svg.innerHTML = `${landscape(G.s.season, 520, { trees: [-200, 160, 1700] })}
    <rect x="-600" y="560" width="2800" height="900" fill="#e8a46a"/><rect x="-600" y="560" width="2800" height="900" fill="url(#g-floorDepth)"/>
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${-600 + i * 100}" y="560" width="4" height="400" fill="#d48e56" opacity="0.6"/>`).join('')}
    <path d="M-600 760 L2200 760" stroke="#fff" stroke-width="6" opacity="0.8"/><ellipse cx="1240" cy="760" rx="360" ry="70" fill="none" stroke="#fff" stroke-width="6" opacity="0.8"/>
    <g class="bb-hoop"></g><g class="bb-trail"></g><g class="bb-player"></g><g class="bb-ball"></g><g class="bb-aim"></g>`;
  const hoopG = svg.querySelector('.bb-hoop') as SVGGElement;
  const ballG = svg.querySelector('.bb-ball') as SVGGElement;
  const playerG = svg.querySelector('.bb-player') as SVGGElement;
  const aimG = svg.querySelector('.bb-aim') as SVGGElement;
  const trailG = svg.querySelector('.bb-trail') as SVGGElement;
  ballG.innerHTML = `<g class="spin">${bball(BR)}</g>`;
  const spinG = ballG.querySelector('.spin') as SVGGElement;

  const drawHoop = (swish = false) => {
    const { x, y } = hoop;
    hoopG.innerHTML = `<rect x="${x + 90}" y="${y - 10}" width="16" height="${FLOOR - y + 20}" rx="6" fill="#9aa3b5"/><rect x="${x + 40}" y="${y - 160}" width="120" height="170" rx="10" fill="#ffffff" stroke="#ff7eb6" stroke-width="7"/><rect x="${x + 70}" y="${y - 90}" width="60" height="50" rx="4" fill="none" stroke="#ff7eb6" stroke-width="5"/>` +
      `<rect x="${x + 40}" y="${y - 6}" width="70" height="10" rx="4" fill="#9aa3b5"/>` +
      `<g class="net${swish ? ' swish' : ''}"><path d="M${x - 60} ${y} L${x - 42} ${y + 90} L${x + 42} ${y + 90} L${x + 60} ${y}" fill="none" stroke="#fff" stroke-width="3"/>${[-40, -14, 14, 40].map((dx) => `<path d="M${x + dx * 1.4} ${y} L${x + dx} ${y + 90}" stroke="#fff" stroke-width="2.5"/>`).join('')}${[30, 60].map((dy) => `<path d="M${x - 60 + dy * 0.2} ${y + dy} L${x + 60 - dy * 0.2} ${y + dy}" stroke="#fff" stroke-width="2"/>`).join('')}</g>` +
      `<ellipse cx="${x}" cy="${y}" rx="64" ry="12" fill="none" stroke="#ff4f2b" stroke-width="8"/>`;
  };
  const rimPts = () => [{ x: hoop.x - 62, y: hoop.y }, { x: hoop.x + 62, y: hoop.y }];
  const drawPlayer = (pose: 'stand' | 'wave', expr: 'normal' | 'happy' = 'normal') => {
    playerG.innerHTML = `<ellipse cx="0" cy="0" rx="70" ry="16" fill="url(#g-ground)"/><g class="art">${dollG(player, pose, expr)}</g>`;
    playerG.setAttribute('transform', `translate(380 ${FLOOR}) scale(1.05)`);
  };
  const placeBall = () => {
    ballG.setAttribute('transform', `translate(${f(ball.x)} ${f(ball.y)})`);
    spinG.setAttribute('transform', `rotate(${f(ball.rot)})`);
  };
  const resetBall = () => {
    ball = { x: START.x, y: START.y, vx: 0, vy: 0, rot: 0, live: false, touched: false, scored: false, bounces: 0, age: 0 };
    placeBall();
    drawPlayer('wave');
    trailG.innerHTML = '';
  };
  drawHoop();
  resetBall();
  const hud = (sel: string, v: string) => ((root.querySelector(sel + ' .n') as HTMLElement).textContent = v);
  hud('.sp-score', '0');
  hud('.sp-time', `${TIME}s`);
  banner(root, 'Swipe up to shoot!');

  // Launch speed that would land the ball in the hoop at this angle.
  const idealV = (ang: number) => {
    const dx = hoop.x - START.x;
    const dyUp = START.y - hoop.y;
    const denom = 2 * Math.cos(ang) ** 2 * (dx * Math.tan(ang) - dyUp);
    return denom > 0 ? Math.sqrt((GR * dx * dx) / denom) : 0;
  };
  const shotFrom = (dx: number, dy: number) => {
    // Swipe direction sets the angle; swipe length sets the power. A close-enough swipe snaps in.
    const len = Math.hypot(dx, dy);
    let ang = Math.atan2(-dy, Math.max(20, dx));
    ang = Math.max((32 * Math.PI) / 180, Math.min((74 * Math.PI) / 180, ang));
    let factor = 0.68 + 0.32 * Math.min(2, len / 300);
    if (Math.abs(factor - 1) < 0.1 + Math.max(0, 0.04 - level * 0.01)) factor = 1;
    const v = idealV(ang) * factor;
    return { vx: Math.cos(ang) * v, vy: -Math.sin(ang) * v };
  };
  let drag: { x: number; y: number; id: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (!running || ball.live) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    drag = { x: p.x, y: p.y, id: e.pointerId };
    svg.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    if (dy > -20) return void (aimG.innerHTML = '');
    const { vx, vy } = shotFrom(dx, dy);
    let dots = '';
    for (let i = 1; i <= 10; i++) {
      const t = i * 0.06;
      dots += `<circle cx="${f(START.x + vx * t)}" cy="${f(START.y + vy * t + 0.5 * GR * t * t)}" r="${f(9 - i * 0.6)}" fill="#fff" opacity="${(1 - i / 12).toFixed(2)}"/>`;
    }
    aimG.innerHTML = dots;
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    drag = null;
    aimG.innerHTML = '';
    if (dy > -30) return;
    const v = shotFrom(dx, dy);
    ball.vx = v.vx;
    ball.vy = v.vy;
    ball.live = true;
    sound.whoosh();
    drawPlayer('stand', 'happy');
    playerG.classList.remove('jump');
    void playerG.getBoundingClientRect();
    playerG.classList.add('jump');
  };
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);

  const scoreIt = () => {
    ball.scored = true;
    baskets++;
    streak++;
    const swish = !ball.touched;
    const pts = 2 + (swish ? 1 : 0) + (streak >= 3 ? 1 : 0);
    score += pts;
    hud('.sp-score', String(score));
    drawHoop(true);
    sound.success();
    const sp = toScreen(svg, hoop.x, hoop.y + 40);
    burst(streak >= 3 ? 'confetti' : 'sparkle', sp.x, sp.y, streak >= 3 ? 30 : 16);
    banner(root, swish ? `Swish! +${pts}` : `Basket! +${pts}`, streak >= 3 ? 'fire' : '');
    if (streak === 3) window.setTimeout(() => banner(root, 'On fire!', 'fire'), 700);
    drawPlayer('stand', 'happy');
    if (baskets % 3 === 0) {
      level++;
      window.setTimeout(() => {
        hoop = { x: 1000 + Math.random() * 330, y: 300 + Math.random() * 130 };
        hoopDir = level >= 3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
        drawHoop();
        banner(root, level >= 3 ? 'The hoop is moving!' : 'New spot!');
      }, 900);
    }
  };

  let last = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (running) {
      timeLeft -= dt;
      hud('.sp-time', `${Math.max(0, Math.ceil(timeLeft))}s`);
      if (hoopDir) {
        hoop.x += hoopDir * 90 * dt;
        if (hoop.x > 1360 || hoop.x < 980) hoopDir *= -1;
        drawHoop();
      }
      if (timeLeft <= 0 && !ball.live) {
        running = false;
        end();
      }
    }
    if (ball.live) {
      const steps = 4;
      for (let k = 0; k < steps; k++) {
        const h = dt / steps;
        const py = ball.y;
        ball.vy += GR * h;
        ball.x += ball.vx * h;
        ball.y += ball.vy * h;
        for (const r of rimPts()) {
          const ddx = ball.x - r.x;
          const ddy = ball.y - r.y;
          const d = Math.hypot(ddx, ddy);
          if (d < BR + 6 && d > 0) {
            const nx = ddx / d;
            const ny = ddy / d;
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              ball.vx -= 1.55 * dot * nx;
              ball.vy -= 1.55 * dot * ny;
              ball.touched = true;
              sound.boing();
            }
            ball.x = r.x + nx * (BR + 6);
            ball.y = r.y + ny * (BR + 6);
          }
        }
        const boardX = hoop.x + 40;
        if (ball.vx > 0 && ball.x + BR > boardX && ball.x < boardX + 30 && ball.y > hoop.y - 160 && ball.y < hoop.y + 10) {
          ball.x = boardX - BR;
          ball.vx = -ball.vx * 0.5;
          ball.touched = true;
          sound.thud();
        }
        if (!ball.scored && py < hoop.y && ball.y >= hoop.y && ball.vy > 0 && ball.x > hoop.x - 48 && ball.x < hoop.x + 48) scoreIt();
        if (ball.y + BR > FLOOR) {
          ball.y = FLOOR - BR;
          ball.vy = -ball.vy * 0.55;
          ball.vx *= 0.78;
          ball.bounces++;
          if (ball.bounces <= 2) sound.drop();
        }
      }
      ball.rot += ball.vx * dt * 0.8;
      ball.age += dt;
      placeBall();
      if (streak >= 3) trailG.innerHTML += `<circle cx="${f(ball.x)}" cy="${f(ball.y)}" r="22" fill="#ffab3d" opacity="0.35"><animate attributeName="r" values="22;2" dur="0.4s" fill="freeze"/><animate attributeName="opacity" values="0.4;0" dur="0.4s" fill="freeze"/></circle>`;
      if (ball.bounces >= 3 || ball.x < -200 || ball.x > 1900 || ball.age > 3.2) {
        if (!ball.scored) {
          streak = 0;
          if (ball.age > 0.4) banner(root, ['So close!', 'Try again!', 'Almost!'][Math.floor(Math.random() * 3)]);
        }
        window.setTimeout(() => drawHoop(), 200);
        resetBall();
      }
    }
    if (!ended) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const end = () => {
    ended = true;
    const best = score > (G.s.stats.bestBasketball ?? 0);
    if (best) G.s.stats.bestBasketball = score;
    G.bump('basket', baskets);
    finish(root, `${baskets} baskets!`, [`${player.name} scored ${score} points.`, `Best: ${G.s.stats.bestBasketball ?? score}`], baskets * 3, best && score > 0);
  };

  return () => {
    ended = true;
    cancelAnimationFrame(raf);
  };
}

// ---------------- soccer ----------------
function soccer(svg: SVGSVGElement, root: HTMLElement, player: Doll): () => void {
  const KICKS = 10;
  const GOAL = { l: 500, r: 1100, top: 250, line: 520 };
  const BALL0 = { x: 800, y: 790 };
  const keeperDoll = G.s.dolls.find((d) => d !== player && !d.seat) ?? player;
  let kicks = 0;
  let goals = 0;
  let score = 0;
  let level = 0;
  let streak = 0;
  let busy = false;
  let ended = false;
  let kx = 800;
  let kdir = 1;
  let diveX = 0;
  let diveRot = 0;

  const stripes = Array.from({ length: 10 }, (_, i) => `<rect x="${-600 + i * 280}" y="520" width="140" height="500" fill="#ffffff" opacity="0.07"/>`).join('');
  let net = '';
  for (let x = GOAL.l; x <= GOAL.r; x += 30) net += `<line x1="${x}" y1="${GOAL.top}" x2="${x + (x - 800) * 0.06}" y2="${GOAL.line - 10}" stroke="#fff" stroke-width="2" opacity="0.6"/>`;
  for (let y = GOAL.top; y <= GOAL.line; y += 28) net += `<line x1="${GOAL.l}" y1="${y}" x2="${GOAL.r}" y2="${y}" stroke="#fff" stroke-width="2" opacity="0.6"/>`;
  svg.innerHTML = `${landscape(G.s.season, 470, { trees: [-200, 200, 1400, 1800] })}
    <rect x="-600" y="470" width="2800" height="900" fill="#6fc766"/>${stripes}<rect x="-600" y="470" width="2800" height="900" fill="url(#g-floorDepth)"/>
    <path d="M300 520 L1300 520 L1400 700 L200 700Z" fill="none" stroke="#fff" stroke-width="6" opacity="0.85"/><circle cx="800" cy="790" r="8" fill="#fff"/>
    <rect x="${GOAL.l - 20}" y="${GOAL.top - 40}" width="${GOAL.r - GOAL.l + 40}" height="${GOAL.line - GOAL.top + 50}" fill="#3a4a3a" opacity="0.18"/>
    <g class="sc-net">${net}</g><g class="sc-keeper"></g>
    <rect x="${GOAL.l - 14}" y="${GOAL.top - 14}" width="14" height="${GOAL.line - GOAL.top + 14}" fill="#fff"/><rect x="${GOAL.r}" y="${GOAL.top - 14}" width="14" height="${GOAL.line - GOAL.top + 14}" fill="#fff"/><rect x="${GOAL.l - 14}" y="${GOAL.top - 14}" width="${GOAL.r - GOAL.l + 28}" height="14" fill="#fff"/>
    <g class="sc-player"></g><g class="sc-ball"></g><g class="sc-aim"></g>`;
  const keeperG = svg.querySelector('.sc-keeper') as SVGGElement;
  const ballG = svg.querySelector('.sc-ball') as SVGGElement;
  const playerG = svg.querySelector('.sc-player') as SVGGElement;
  const aimG = svg.querySelector('.sc-aim') as SVGGElement;
  const netG = svg.querySelector('.sc-net') as SVGGElement;
  ballG.innerHTML = `<g class="spin">${soccerBall(44)}</g>`;
  const spinG = ballG.querySelector('.spin') as SVGGElement;
  const hud = (sel: string, v: string) => ((root.querySelector(sel + ' .n') as HTMLElement).textContent = v);
  hud('.sp-score', '0');
  hud('.sp-time', `${KICKS} kicks`);
  playerG.innerHTML = `<ellipse cx="0" cy="0" rx="70" ry="16" fill="url(#g-ground)"/><g class="art">${dollG(player, 'stand')}</g>`;
  playerG.setAttribute('transform', 'translate(610 880) scale(1.1)');
  const drawKeeper = (expr: 'normal' | 'happy' | 'surprised' = 'normal', arms: 'held' | 'stand' = 'held') => {
    keeperG.innerHTML = `<ellipse cx="0" cy="0" rx="60" ry="12" fill="url(#g-ground)"/><g transform="translate(${f(diveX)} 0) rotate(${f(diveRot)} 0 -150)">${dollG(keeperDoll, arms, expr)}<g transform="translate(0 ${-110 - (keeperDoll.look.age === 'adult' ? 50 : 0)})"><rect x="-44" y="-12" width="88" height="0" fill="none"/></g></g>`;
    keeperG.setAttribute('transform', `translate(${f(kx)} ${GOAL.line}) scale(0.72)`);
  };
  const placeBall = (x: number, y: number, sc: number, rot: number) => {
    ballG.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
    spinG.setAttribute('transform', `rotate(${f(rot)})`);
  };
  placeBall(BALL0.x, BALL0.y, 1, 0);
  drawKeeper();
  banner(root, 'Swipe the ball to kick!');

  const targetFrom = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy);
    const tx = 800 + (dx / Math.max(60, -dy)) * 420;
    const ty = GOAL.line - 10 - Math.max(0, Math.min(1.25, (len - 120) / 420)) * 300;
    return { tx, ty };
  };
  let drag: { x: number; y: number; id: number } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    if (busy || ended) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    drag = { x: p.x, y: p.y, id: e.pointerId };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    const dy = p.y - drag.y;
    if (dy > -20) return void (aimG.innerHTML = '');
    const { tx, ty } = targetFrom(p.x - drag.x, dy);
    aimG.innerHTML = `<g opacity="0.85"><circle cx="${f(tx)}" cy="${f(ty)}" r="30" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="10 8"/><circle cx="${f(tx)}" cy="${f(ty)}" r="6" fill="#fff"/></g>`;
  });
  svg.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toWorld(svg, e.clientX, e.clientY);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    drag = null;
    aimG.innerHTML = '';
    if (dy > -30) return;
    kick(targetFrom(dx, dy));
  });

  const kick = ({ tx, ty }: { tx: number; ty: number }) => {
    busy = true;
    kicks++;
    hud('.sp-time', `${KICKS - kicks} kicks`);
    sound.thud();
    playerG.classList.remove('jump');
    void playerG.getBoundingClientRect();
    playerG.classList.add('jump');
    // The keeper guesses: smarter as the player scores more.
    const smart = Math.min(0.72, 0.32 + level * 0.08);
    const guessX = Math.random() < smart ? tx : 800 + (Math.random() * 2 - 1) * 260;
    const dive = Math.max(-230, Math.min(230, guessX - kx));
    const t0 = performance.now();
    const dur = 620;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - t) ** 2;
      const x = BALL0.x + (tx - BALL0.x) * e;
      const y = BALL0.y + (ty - BALL0.y) * e - Math.sin(t * Math.PI) * 70;
      placeBall(x, y, 1 - 0.48 * e, t * 720);
      const kt = Math.max(0, Math.min(1, (t - 0.18) / 0.55));
      diveX = (dive / 0.72) * kt;
      diveRot = Math.sign(dive) * Math.min(1, Math.abs(dive) / 150) * 70 * kt;
      drawKeeper('surprised', 'held');
      if (t < 1) return void requestAnimationFrame(step);
      resolve(tx, ty, kx + dive * kt);
    };
    requestAnimationFrame(step);
  };

  const resolve = (tx: number, ty: number, keeperAt: number) => {
    const inside = tx > GOAL.l + 10 && tx < GOAL.r - 10 && ty > GOAL.top + 10;
    const saved = inside && Math.abs(tx - keeperAt) < 95 && ty > GOAL.top + 40;
    let msg = '';
    if (!inside) {
      msg = ty <= GOAL.top + 10 ? 'Over the bar!' : 'Wide!';
      streak = 0;
      sound.wrong();
      drawKeeper('happy', 'held');
    } else if (saved) {
      msg = 'Saved!';
      streak = 0;
      sound.boing();
      drawKeeper('happy', 'held');
    } else {
      goals++;
      streak++;
      const corner = ty < GOAL.top + 90 && Math.abs(tx - 800) > 200;
      const pts = 1 + (corner ? 2 : 0) + (streak >= 3 ? 1 : 0);
      score += pts;
      msg = corner ? `Top corner! +${pts}` : `GOAL! +${pts}`;
      hud('.sp-score', String(score));
      sound.success();
      sound.applause();
      netG.classList.remove('ripple');
      void netG.getBoundingClientRect();
      netG.classList.add('ripple');
      const sp = toScreen(svg, tx, ty);
      burst('confetti', sp.x, sp.y, 36);
      drawKeeper('surprised', 'stand');
      playerG.innerHTML = `<ellipse cx="0" cy="0" rx="70" ry="16" fill="url(#g-ground)"/><g class="art">${dollG(player, 'held', 'happy')}</g>`;
      if (goals % 2 === 0) level++;
    }
    banner(root, msg, inside && !saved ? 'fire' : '');
    window.setTimeout(() => {
      diveX = 0;
      diveRot = 0;
      placeBall(BALL0.x, BALL0.y, 1, 0);
      playerG.innerHTML = `<ellipse cx="0" cy="0" rx="70" ry="16" fill="url(#g-ground)"/><g class="art">${dollG(player, 'stand')}</g>`;
      drawKeeper();
      busy = false;
      if (kicks >= KICKS) end();
    }, 1300);
  };

  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!busy && !ended) {
      const speed = 50 + level * 35;
      kx += kdir * speed * dt;
      if (kx > 920 || kx < 680) kdir *= -1;
      keeperG.setAttribute('transform', `translate(${f(kx)} ${GOAL.line}) scale(0.72)`);
    }
    if (!ended) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const end = () => {
    ended = true;
    const best = score > (G.s.stats.bestSoccer ?? 0);
    if (best) G.s.stats.bestSoccer = score;
    G.bump('goal', goals);
    finish(root, `${goals} goals!`, [`${player.name} scored ${score} points in ${KICKS} kicks.`, `Best: ${G.s.stats.bestSoccer ?? score}`], goals * 4, best && score > 0);
  };

  return () => {
    ended = true;
    cancelAnimationFrame(raf);
  };
}

void dark;
void starD;
