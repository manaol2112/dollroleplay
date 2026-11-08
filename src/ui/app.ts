// The app shell: title screen, town map, places, the top bar and the tray of friends and things.
import { renderDoll } from '../art/doll';
import { FURNITURE, FURN_BY_ID, furnThumb, type FurnCat } from '../art/furniture';
import { FLOORS, WALLS, ground, landscape } from '../art/scenes';
import { CURTAINS, TRIMS, floorSwatch, wallSwatch } from '../art/roomstyle';
import { TOWN_H, TOWN_LAYER, TOWN_SPOTS, TOWN_TOP, TOWN_W, townLayers } from '../art/town';
import { BUILDING_FIRST_PLACE, HOME_ROOMS, PLACES } from '../data/places';
import { claimableCount, dailyReady } from '../data/state';
import { keepAudioAwake, sound, startMusic, unlockAudio } from '../engine/audio';
import { burst, celebrate, setWeather } from '../engine/particles';
import { SceneView } from '../engine/scene';
import { G, toast } from '../game';
import type { Look, Season } from '../types';
import { openCloset } from './closet';
import { openNails } from './nails';
import { openSports } from './sports';
import { confirmBox, el, esc, headThumb, still } from './dom';
import { icon } from './icons';
import { SEASON_ICON, SEASON_NAME, openCatalog, openChallenges, openLesson, openPiano, openSeasons, openSettings, openShop } from './panels';

const ROOM_SHORT: Record<string, string> = { bedroom: 'Bedroom', living: 'Living', kitchen: 'Kitchen', bathroom: 'Bath', playroom: 'Playroom', backyard: 'Yard' };

type Screen = { kind: 'title' } | { kind: 'map' } | { kind: 'place'; id: string };
type TrayTab = 'friends' | 'style' | FurnCat;

const CAT_INFO: Record<string, { name: string; icon: string }> = {
  friends: { name: 'Friends', icon: 'person' },
  style: { name: 'Room style', icon: 'wallpaper' },
  bedroom: { name: 'Bedroom', icon: 'bed' },
  kids: { name: 'Kids', icon: 'toy' },
  kitchen: { name: 'Kitchen', icon: 'fridge' },
  bath: { name: 'Bath', icon: 'bath' },
  living: { name: 'Living', icon: 'sofa' },
  electronics: { name: 'Gadgets', icon: 'tv' },
  lighting: { name: 'Lights', icon: 'lamp' },
  decor: { name: 'Decor', icon: 'decor' },
  plants: { name: 'Plants', icon: 'plant' },
  wall: { name: 'Walls', icon: 'wall' },
  rugs: { name: 'Rugs', icon: 'rug' },
  yard: { name: 'Yard', icon: 'tree' },
  toys: { name: 'Toys', icon: 'toy' },
  food: { name: 'Food', icon: 'apple' },
  outdoor: { name: 'Park', icon: 'tree' },
  school: { name: 'School', icon: 'school' },
  stage: { name: 'Stage', icon: 'stage' },
  salon: { name: 'Salon', icon: 'salon' },
  shop: { name: 'Shop', icon: 'shop' },
};

export class App {
  private stage = document.getElementById('stage')!;
  private hud = document.getElementById('hud')!;
  private screen: Screen = { kind: 'title' };
  private scene: SceneView | null = null;
  private tray: HTMLDivElement | null = null;
  private trayTab: TrayTab = 'friends';
  private closePiano: (() => void) | null = null;
  private mapRO: ResizeObserver | null = null;
  private fadeT = 0;
  private shownCoins = -1;

  constructor() {
    G.on(() => this.refreshHud());
    keepAudioAwake();
    window.addEventListener('hashchange', () => this.start());
  }

  start(): void {
    const hash = location.hash.replace('#', '');
    if (hash === 'map') this.go({ kind: 'map' });
    else if (PLACES[hash]) this.go({ kind: 'place', id: hash });
    else this.go({ kind: 'title' });
  }

  go(s: Screen): void {
    this.closePiano?.();
    this.closePiano = null;
    this.scene?.destroy();
    this.scene = null;
    this.mapRO?.disconnect();
    this.mapRO = null;
    this.tray = null;
    this.screen = s;
    document.getElementById('overlay')!.innerHTML = '';
    this.stage.innerHTML = '';
    this.stage.className = `screen-${s.kind}`;
    if (s.kind === 'title') this.showTitle();
    if (s.kind === 'map') this.showMap();
    if (s.kind === 'place') this.showPlace(s.id);
    this.renderHud();
    const fade = document.getElementById('fade')!;
    if (!fade.firstChild) fade.innerHTML = '<i class="hole"></i>';
    fade.classList.remove('in');
    void fade.offsetWidth;
    fade.classList.add('in');
    window.clearTimeout(this.fadeT);
    this.fadeT = window.setTimeout(() => fade.classList.remove('in'), 680);
  }

  // ---------------- title ----------------
  private showTitle(): void {
    setWeather(G.s.season);
    // A mix of girls and boys on the title screen.
    const girls = G.s.dolls.filter((d) => !d.look.boy);
    const boys = G.s.dolls.filter((d) => d.look.boy);
    const dolls = [girls[0], boys[0], girls[1], boys[1] ?? girls[2]].filter(Boolean).slice(0, 4);
    const lineup = dolls.map((d, i) => {
      const x = 800 + (i - (dolls.length - 1) / 2) * 230;
      return `<g transform="translate(${x} ${830 + (i % 2) * 20}) scale(1.05)"><g class="bob" style="animation-delay:${i * 0.4}s">${renderDoll(d.look, { pose: i === 1 ? 'wave' : 'stand', expr: i % 2 ? 'happy' : 'normal' })}</g></g>`;
    }).join('');
    const root = el('div', 'title-screen', `
      <svg class="title-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${landscape(G.s.season, 600)}${ground(G.s.season, 600)}${lineup}</svg>
      <div class="title-ui">
        <div class="logo"><span class="l1">Doll</span><span class="l2">Role Play</span><i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i></div>
        <button class="btn play">${icon('heart')}<span>Play</span></button>
      </div>`);
    this.stage.appendChild(root);
    root.querySelector('.play')!.addEventListener('click', () => {
      unlockAudio();
      sound.sparkle();
      if (G.s.settings.music) startMusic();
      this.go({ kind: 'map' });
      if (!G.s.seenIntro) {
        G.s.seenIntro = true;
        G.changed();
        window.setTimeout(() => toast('Welcome to town! Tap a building to visit. Finish challenges to earn coins.', 'heart', true), 700);
      }
    });
  }

  // ---------------- map ----------------
  /** Where the town map was scrolled to, in town units (kept while the app is open). */
  private mapX = -1;

  private showMap(): void {
    setWeather(G.s.season);
    const root = el('div', 'map-screen');
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (cls: string) => {
      const e = document.createElementNS(NS, 'svg');
      e.setAttribute('class', cls);
      return e;
    };
    const sky = mk('map-sky');
    sky.setAttribute('viewBox', '0 0 1600 900');
    sky.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const names = ['far', 'mid', 'main', 'front'] as const;
    const layers = Object.fromEntries(names.map((n) => [n, mk(`map-layer ${n}`)])) as Record<(typeof names)[number], SVGSVGElement>;
    root.append(sky, ...names.map((n) => layers[n]));
    root.insertAdjacentHTML('beforeend', `<button class="map-arrow left" aria-label="Scroll left">${icon('back')}</button><button class="map-arrow right" aria-label="Scroll right">${icon('back')}</button>`);
    this.stage.appendChild(root);

    const draw = () => {
      const friends: Record<string, Look[]> = {};
      for (const d of G.s.dolls) if (d.place) (friends[PLACES[d.place].building] ??= []).push(d.look);
      const art = townLayers(G.s.season, friends, dailyReady(G.s));
      sky.innerHTML = art.sky;
      for (const n of names) {
        layers[n].setAttribute('viewBox', `0 ${TOWN_TOP} ${TOWN_LAYER[n].w} ${TOWN_H}`);
        layers[n].setAttribute('preserveAspectRatio', 'none');
        layers[n].innerHTML = art[n];
      }
    };
    draw();

    let scale = 1;
    let viewW = 1600;
    let x = this.mapX;
    const maxX = () => Math.max(0, TOWN_W - viewW);
    const apply = () => {
      x = Math.max(0, Math.min(maxX(), x));
      this.mapX = x;
      for (const n of names) layers[n].style.transform = `translate3d(${(-x * TOWN_LAYER[n].k * scale).toFixed(1)}px,0,0)`;
      root.classList.toggle('at-start', x <= 40);
      root.classList.toggle('at-end', x >= maxX() - 2);
    };
    const fit = () => {
      const r = root.getBoundingClientRect();
      if (!r.height) return;
      scale = r.height / TOWN_H;
      viewW = r.width / scale;
      for (const n of names) {
        layers[n].style.width = `${(TOWN_LAYER[n].w * scale).toFixed(0)}px`;
        layers[n].style.height = `${r.height}px`;
      }
      if (x < 0) x = Math.max(0, TOWN_SPOTS[0].x - viewW * 0.3);
      apply();
    };
    this.mapRO = new ResizeObserver(fit);
    this.mapRO.observe(root);
    fit();

    // Swipe with momentum; a touch that barely moves is a tap on a building.
    let glide = 0;
    let press: { id: number; sx: number; x0: number; lx: number; lt: number; v: number; moved: boolean } | null = null;
    const glideTo = (target: number) => {
      cancelAnimationFrame(glide);
      const from = x;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 450);
        x = from + (target - from) * (1 - (1 - t) ** 3);
        apply();
        if (t < 1) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };
    root.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('.map-arrow')) return;
      cancelAnimationFrame(glide);
      press = { id: e.pointerId, sx: e.clientX, x0: x, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', (e) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.sx;
      if (!press.moved && Math.abs(dx) < 8) return;
      press.moved = true;
      root.classList.add('dragging');
      x = press.x0 - dx / scale;
      const dt = Math.max(1, e.timeStamp - press.lt);
      press.v = 0.75 * (-(e.clientX - press.lx) / scale / dt) + 0.25 * press.v;
      press.lx = e.clientX;
      press.lt = e.timeStamp;
      apply();
    });
    const release = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      const p = press;
      press = null;
      root.classList.remove('dragging');
      if (!p.moved) {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).map((h) => h.closest('[data-place],[data-gift]')).find(Boolean) as SVGGElement | undefined;
        if (!hit) return;
        if (hit.dataset.gift) return openChallenges();
        const id = hit.dataset.place!;
        sound.pop();
        hit.classList.add('tapped');
        window.setTimeout(() => this.go({ kind: 'place', id: BUILDING_FIRST_PLACE[id] }), 250);
        return;
      }
      // Cap the fling so one flick moves about a screen, not the whole town.
      let v = Math.max(-2.2, Math.min(2.2, p.v)) * 16;
      const step = () => {
        if (Math.abs(v) < 0.4) return;
        x += v;
        v *= 0.94;
        apply();
        if (x > 0 && x < maxX()) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', () => {
      press = null;
      root.classList.remove('dragging');
    });
    root.addEventListener('wheel', (e) => {
      e.preventDefault();
      cancelAnimationFrame(glide);
      x += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / scale;
      apply();
    }, { passive: false });
    root.querySelector('.map-arrow.left')!.addEventListener('click', () => {
      sound.tap();
      glideTo(Math.max(0, x - viewW * 0.7));
    });
    root.querySelector('.map-arrow.right')!.addEventListener('click', () => {
      sound.tap();
      glideTo(Math.min(maxX(), x + viewW * 0.7));
    });
    if (G.s.stats['hint-townswipe'] === undefined) {
      G.s.stats['hint-townswipe'] = 1;
      window.setTimeout(() => toast('Swipe sideways to explore the whole town!', 'map'), 900);
    }
    (root as HTMLDivElement & { redraw?: () => void }).redraw = draw;
  }

  // ---------------- places ----------------
  private showPlace(id: string): void {
    const place = PLACES[id];
    G.visit(place.building);
    setWeather(place.outdoor ? G.s.season : null);
    const tray = el('div', 'tray');
    this.tray = tray;
    const scene = new SceneView(place, {
      openCloset: (dollId) => this.openClosetFor(dollId),
      trayRect: () => tray.getBoundingClientRect(),
      onDragState: (on) => {
        tray.classList.toggle('dragging', on);
        // Redraw only after the finger lifts: removing the touched card mid-drag stops touch events on iPad.
        if (!on) this.renderTray();
      },
    });
    this.scene = scene;
    this.stage.append(scene.root, tray);
    const actions = el('div', 'actions');
    this.stage.appendChild(actions);
    this.renderActions(actions);
    if (!place.room && this.trayTab !== 'friends' && !place.tray.includes(this.trayTab as FurnCat)) this.trayTab = 'friends';
    if ((place.room || place.yard) && this.trayTab !== 'friends' && this.trayTab !== 'style' && !place.tray.includes(this.trayTab as FurnCat)) this.trayTab = 'friends';
    this.renderTray();
    requestAnimationFrame(() => scene.layout());
    if (!G.s.dolls.some((d) => d.place === id) && G.s.stats[`hint-${id}`] === undefined) {
      G.s.stats[`hint-${id}`] = 1;
      window.setTimeout(() => toast('Drag your friends up from the tray at the bottom!', 'person'), 600);
    }
  }

  private renderActions(box: HTMLElement): void {
    const id = this.screen.kind === 'place' ? this.screen.id : '';
    const b = (act: string, ic: string, label: string, on = false) => `<button class="act-btn${on ? ' on' : ''}" data-act="${act}">${icon(ic)}<span>${label}</span></button>`;
    let html = '';
    const sc = this.scene;
    if (id === 'school') {
      html += b('lesson', 'question', 'Lesson') + b('draw', 'pencil', 'Draw', sc?.drawMode);
      if (sc?.drawMode) html += `<div class="chalks">${['#ffffff', '#ffb3d1', '#ffe680', '#a8e6ff', '#c3f5b0'].map((c) => `<button class="chalk${sc.chalkColor === c ? ' on' : ''}" data-chalk="${c}" style="background:${c}"></button>`).join('')}<button class="chalk eraser${sc.chalkColor === 'erase' ? ' on' : ''}" data-chalk="erase">${icon('eraser')}</button><button class="chalk" data-act="clearboard">${icon('trash')}</button></div>`;
    }
    if (id === 'theater') html += b('piano', 'note', 'Music') + b('curtains', 'curtain', 'Curtains') + b('lights', 'bulb', 'Lights', sc?.lights);
    if (id === 'salon') html += b('makeover', 'scissors', 'Makeover') + b('nails', 'makeup', 'Nails');
    if (id === 'playground') html += b('sports', 'toy', 'Sports');
    if (id === 'boutique') html += b('shop', 'bag', 'Shop');
    if (PLACES[id]?.room || PLACES[id]?.yard) html += b('decorate', 'decorate', 'Decorate');
    box.innerHTML = html;
    box.onclick = (e) => {
      const t = e.target as Element;
      const ch = t.closest('[data-chalk]') as HTMLElement | null;
      if (ch && sc) {
        sc.chalkColor = ch.dataset.chalk!;
        sound.tap();
        this.renderActions(box);
        return;
      }
      const act = (t.closest('[data-act]') as HTMLElement | null)?.dataset.act;
      if (!act || !sc) return;
      sound.tap();
      if (act === 'lesson') openLesson();
      if (act === 'draw') {
        sc.drawMode = !sc.drawMode;
        if (sc.drawMode) toast('Draw on the chalkboard with your finger!', 'pencil');
      }
      if (act === 'clearboard') sc.clearChalk();
      if (act === 'curtains') {
        sc.curtainsOpen = !sc.curtainsOpen;
        sound.whoosh();
        sc.renderBg();
      }
      if (act === 'lights') {
        sc.lights = !sc.lights;
        sc.renderBg();
      }
      if (act === 'piano') this.togglePiano();
      if (act === 'nails') {
        const inChair = sc.dolls().find((d) => d.seat && ['salonChair', 'dryer'].includes(sc.sc.items.find((i) => i.uid === d.seat!.uid)?.def ?? ''));
        const target = inChair ?? sc.dolls()[0] ?? G.s.dolls[0];
        openNails(target.id, () => {
          sc.renderAll();
          this.refreshHud();
        });
      }
      if (act === 'sports') {
        this.tray?.classList.add('hidden');
        openSports(sc.dolls()[0]?.id, () => {
          this.tray?.classList.remove('hidden');
          this.refreshHud();
        });
      }
      if (act === 'makeover') {
        const inChair = sc.dolls().find((d) => d.seat && ['salonChair', 'dryer'].includes(sc.sc.items.find((i) => i.uid === d.seat!.uid)?.def ?? ''));
        const target = inChair ?? sc.dolls()[0] ?? G.s.dolls[0];
        this.openClosetFor(target.id, 'salon');
      }
      if (act === 'shop') openShop();
      if (act === 'decorate') openCatalog((fid) => this.scene?.dropIn('item', fid));
      this.renderActions(box);
    };
  }

  private togglePiano(): void {
    if (this.closePiano) {
      this.closePiano();
      return;
    }
    const sc = this.scene!;
    if (!sc.curtainsOpen) {
      sc.curtainsOpen = true;
      sc.renderBg();
    }
    this.tray?.classList.add('hidden');
    this.closePiano = openPiano(this.stage, {
      onNote: () => sc.pianoBounce(),
      onSongDone: (song) => {
        const first = !G.s.songsDone.includes(song.id);
        if (first) G.s.songsDone.push(song.id);
        sc.cheering = true;
        sc.renderFg();
        sound.applause();
        celebrate();
        G.bump('songComplete');
        G.earn(first ? 40 : 15, { x: window.innerWidth / 2, y: window.innerHeight * 0.4 });
        toast(`Bravo! You played ${song.name}! +${first ? 40 : 15} coins`, 'star', true);
        window.setTimeout(() => {
          sc.cheering = false;
          sc.renderFg();
        }, 3500);
      },
      onClose: () => {
        this.closePiano = null;
        this.tray?.classList.remove('hidden');
      },
    });
  }

  private openClosetFor(dollId?: string, mode: 'closet' | 'salon' = 'closet', newFriend = false): void {
    this.scene?.hidePopup();
    openCloset({
      dollId, mode, newFriend,
      newPlace: this.screen.kind === 'place' ? this.screen.id : null,
      onDollChange: (id) => this.scene?.refreshDoll(id),
      onClose: () => {
        if (this.scene) {
          this.scene.renderAll();
          this.renderTray();
        }
        this.refreshHud();
      },
    });
  }

  // ---------------- tray ----------------
  private trayTabs(): TrayTab[] {
    if (this.screen.kind !== 'place') return [];
    const p = PLACES[this.screen.id];
    return ['friends', ...(p.room || p.yard ? (['style'] as TrayTab[]) : []), ...p.tray];
  }

  private trayLazy: IntersectionObserver | null = null;
  private trayThumbs = new Map<string, () => string>();

  private renderTray(animate = false): void {
    const tray = this.tray;
    if (!tray || this.screen.kind !== 'place') return;
    this.trayThumbs.clear();
    const scroll = tray.querySelector('.tray-list')?.scrollLeft ?? 0;
    const tabs = this.trayTabs();
    const place = PLACES[this.screen.id];
    let cards = '';
    if (this.trayTab === 'friends') {
      cards = G.s.dolls.map((d) => `<div class="tcard friend${d.place === place.id ? ' here' : ''}" data-kind="doll" data-id="${d.id}">${headThumb(d.look)}<span class="lbl">${esc(d.name)}</span>${d.place === place.id ? `<i class="here-dot">${icon('check')}</i>` : ''}</div>`).join('') +
        `<div class="tcard add" data-kind="newfriend">${icon('plus')}<span class="lbl">New friend</span></div>`;
    } else if (this.trayTab === 'style') {
      const sc = G.s.scenes[place.id];
      const sec = (label: string) => `<div class="tsec"><span>${esc(label)}</span></div>`;
      const bygroup = <T extends { group?: string }>(xs: T[]) => {
        const m = new Map<string, T[]>();
        for (const x of xs) {
          const g = x.group ?? 'More';
          if (!m.has(g)) m.set(g, []);
          m.get(g)!.push(x);
        }
        return [...m.entries()];
      };
      if (place.room) {
        for (const [grp, ws] of bygroup(WALLS)) cards += sec(`Wallpaper · ${grp}`) + ws.map((w) => this.styleCard('wall', w.id, w.name, sc.wall === w.id, () => wallSwatch(w))).join('');
        for (const [grp, fs] of bygroup(FLOORS.filter((x) => !x.outdoor))) cards += sec(`Floor · ${grp}`) + fs.map((x) => this.styleCard('floor', x.id, x.name, sc.floor === x.id, () => floorSwatch(x))).join('');
      } else for (const [grp, fs] of bygroup(FLOORS.filter((x) => x.outdoor))) cards += sec(`Ground · ${grp}`) + fs.map((x) => this.styleCard('floor', x.id, x.name, sc.floor === x.id, () => floorSwatch(x))).join('');
      cards += sec(place.room ? 'Trim' : 'Fence') + TRIMS.map(([nm, c]) => `<div class="tcard dotcard${(sc.trim ?? '#ffffff') === c ? ' on' : ''}" data-kind="trim" data-id="${c}"><i class="bigdot" style="background:${c}"></i><span class="lbl">${esc(nm)}</span></div>`).join('');
      if (place.room) cards += sec('Curtains') + CURTAINS.map(([nm, c]) => `<div class="tcard dotcard${sc.curtain === c ? ' on' : ''}" data-kind="curtain" data-id="${c}"><i class="bigdot" style="background:${c}"></i><span class="lbl">${esc(nm)}</span></div>`).join('');
    } else {
      const list = FURNITURE.filter((f) => f.cat === this.trayTab);
      let last = '';
      for (const f of list) {
        if (f.group && f.group !== last) {
          last = f.group;
          cards += `<div class="tsec"><span>${esc(f.group)}</span></div>`;
        }
        const locked = !G.owns(f.id);
        this.trayThumbs.set('item:' + f.id, () => furnThumb(f));
        cards += `<div class="tcard${locked ? ' locked' : ''}" data-kind="item" data-id="${f.id}" data-thumb="item:${f.id}"><i class="thumb-wait"></i><span class="lbl">${esc(f.name)}</span>${locked ? `<span class="price">${icon('coin')}${f.price}</span>` : ''}</div>`;
      }
    }
    tray.innerHTML = `<div class="tray-tabs">${tabs.map((t) => `<button class="ttab${t === this.trayTab ? ' on' : ''}" data-ttab="${t}" title="${CAT_INFO[t].name}">${icon(CAT_INFO[t].icon)}<span>${CAT_INFO[t].name}</span></button>`).join('')}</div>
      <div class="tray-list">${cards}</div><div class="putaway">${icon('trash')}<span>Drop here to put away</span></div>`;
    const listEl = tray.querySelector('.tray-list') as HTMLDivElement;
    listEl.scrollLeft = scroll;
    // Draw thumbnails only as they scroll into view: some tabs hold over a hundred things.
    this.trayLazy?.disconnect();
    this.trayLazy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const card = e.target as HTMLElement;
        this.trayLazy!.unobserve(card);
        const fn = this.trayThumbs.get(card.dataset.thumb!);
        const wait = card.querySelector('.thumb-wait');
        if (fn && wait) wait.outerHTML = still(fn());
      }
    }, { root: listEl, rootMargin: '0px 500px' });
    listEl.querySelectorAll('[data-thumb]').forEach((c) => this.trayLazy!.observe(c));
    if (animate) {
      listEl.classList.add('anim');
      listEl.querySelectorAll<HTMLElement>('.tcard').forEach((c, i) => c.style.setProperty('--i', String(Math.min(i, 12))));
    }
    tray.onclick = (e) => {
      const t = (e.target as Element).closest('[data-ttab]') as HTMLElement | null;
      if (t) {
        this.trayTab = t.dataset.ttab as TrayTab;
        sound.tap();
        this.renderTray(true);
        listEl.scrollLeft = 0;
        tray.querySelector('.tray-list')!.scrollLeft = 0;
      }
    };
    this.bindTrayCards(listEl);
  }

  private styleCard(kind: 'wall' | 'floor', id: string, name: string, on: boolean, thumb: () => string): string {
    const key = `${kind}:${id}`;
    const locked = !G.owns(key);
    this.trayThumbs.set(key, thumb);
    return `<div class="tcard style${on ? ' on' : ''}${locked ? ' locked' : ''}" data-kind="${kind}" data-id="${id}" data-thumb="${key}"><i class="thumb-wait"></i><span class="lbl">${esc(name)}</span>${locked ? `<span class="price">${icon('coin')}${G.price(key)}</span>` : ''}</div>`;
  }

  /**
   * The tray handles its own swipes so a finger can go either way: mostly upward pulls a card out
   * into the room, sideways scrolls the tray. (Letting the browser scroll it means a slightly
   * diagonal drag on an iPad is taken as a scroll and the card never comes out.)
   */
  private bindTrayCards(list: HTMLDivElement): void {
    type Press = { card: HTMLElement | null; x: number; y: number; id: number; mode: 'wait' | 'scroll'; sl: number; lx: number; lt: number; v: number };
    let press: Press | null = null;
    let glide = 0;
    const pullOut = (card: HTMLElement, e: PointerEvent) => {
      if (!this.scene) return;
      const kind = card.dataset.kind!;
      const id = card.dataset.id!;
      if (kind === 'item' && G.owns(id)) this.scene.beginTrayDrag('item', id, e);
      else if (kind === 'doll') this.scene.beginTrayDrag('doll', id, e);
      else this.tapCard(card);
    };
    list.onpointerdown = (e) => {
      if (press) return;
      cancelAnimationFrame(glide);
      const card = (e.target as Element).closest('.tcard') as HTMLElement | null;
      press = { card, x: e.clientX, y: e.clientY, id: e.pointerId, mode: 'wait', sl: list.scrollLeft, lx: e.clientX, lt: e.timeStamp, v: 0 };
      try {
        list.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    };
    list.onpointermove = (e) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (press.mode === 'wait') {
        if (Math.hypot(dx, dy) < 10) return;
        if (press.card && -dy > Math.abs(dx) * 0.6) {
          const card = press.card;
          press = null;
          return pullOut(card, e);
        }
        press.mode = 'scroll';
      }
      list.scrollLeft = press.sl - dx;
      const dt = Math.max(1, e.timeStamp - press.lt);
      press.v = 0.8 * ((press.lx - e.clientX) / dt) + 0.2 * press.v;
      press.lx = e.clientX;
      press.lt = e.timeStamp;
      // Scrolled sideways first, then went up into the room: still grab the card.
      const top = this.tray?.getBoundingClientRect().top ?? 0;
      if (press.card && e.clientY < top - 12) {
        const card = press.card;
        press = null;
        pullOut(card, e);
      }
    };
    list.onpointerup = (e) => {
      if (!press || e.pointerId !== press.id) return;
      const p = press;
      press = null;
      if (p.mode === 'wait') {
        if (p.card) this.tapCard(p.card);
        return;
      }
      let v = p.v * 16;
      const step = () => {
        if (Math.abs(v) < 0.5) return;
        list.scrollLeft += v;
        v *= 0.94;
        glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };
    list.onpointercancel = () => (press = null);
  }

  private tapCard(card: HTMLElement): void {
    if (!this.scene || this.screen.kind !== 'place') return;
    const kind = card.dataset.kind!;
    const id = card.dataset.id!;
    const placeId = this.screen.id;
    if (kind === 'newfriend') return this.openClosetFor(undefined, 'closet', true);
    if (kind === 'doll') {
      const d = G.s.dolls.find((x) => x.id === id);
      if (!d) return;
      if (d.place === placeId) {
        const sp = this.scene.dollTop(d);
        burst('heart', sp.x, sp.y + 30, 6);
        sound.giggle();
        return;
      }
      this.scene.dropIn('doll', id);
      this.renderTray();
      return;
    }
    if (kind === 'wall' || kind === 'floor') {
      const key = `${kind}:${id}`;
      const apply = () => {
        const sc = G.s.scenes[placeId];
        if (kind === 'wall') sc.wall = id;
        else sc.floor = id;
        sound.spray();
        this.scene!.renderBg();
        G.bump(kind === 'wall' ? 'wallpaper' : 'floor');
        this.renderTray();
      };
      if (G.owns(key)) apply();
      else this.askBuy(key, this.trayThumbs.get(key)?.() ?? '', card.querySelector('.lbl')?.textContent ?? '', apply);
      return;
    }
    if (kind === 'trim' || kind === 'curtain') {
      const sc = G.s.scenes[placeId];
      if (kind === 'trim') sc.trim = id;
      else sc.curtain = id;
      sound.spray();
      this.scene.renderBg();
      G.changed();
      this.renderTray();
      return;
    }
    if (kind === 'item') {
      const def = FURN_BY_ID[id];
      if (G.owns(id)) this.scene.dropIn('item', id);
      else this.askBuy(id, furnThumb(def), def.name, () => this.scene?.dropIn('item', id));
    }
  }

  private askBuy(key: string, art: string, name: string, then: () => void): void {
    const price = G.price(key);
    confirmBox(`Buy ${name}?`, `It costs <b class="coin-text">${icon('coin')}${price}</b>. You have ${G.s.coins}.`, `${icon('bag')}<span>Buy</span>`, art, () => {
      if (G.buy(key)) {
        celebrate();
        this.renderTray();
        then();
      }
    });
  }

  // ---------------- top bar ----------------
  private renderHud(): void {
    const s = this.screen;
    if (s.kind === 'title') {
      this.hud.innerHTML = '';
      return;
    }
    let left = '';
    if (s.kind === 'map') left = `<div class="pill title-pill">${icon('map')}<span>Town</span></div>`;
    else {
      const p = PLACES[s.id];
      left = `<button class="round-btn" data-hud="map" title="Town map">${icon('map')}</button>`;
      if (p.room || p.yard) left += `<div class="room-tabs">${HOME_ROOMS.map((r) => `<button class="pill room${r === s.id ? ' on' : ''}" data-room="${r}">${esc(ROOM_SHORT[r] ?? PLACES[r].name)}</button>`).join('')}</div>`;
      else left += `<div class="pill title-pill"><span>${esc(p.name)}</span></div>`;
    }
    this.hud.innerHTML = `<div class="hud-left">${left}</div><div class="hud-right">
      <button class="pill season" data-hud="season">${icon(SEASON_ICON[G.s.season])}<span>${SEASON_NAME[G.s.season]}</span></button>
      <div class="pill coins">${icon('coin')}<span class="n">${G.s.coins}</span></div>
      <button class="round-btn star-btn" data-hud="challenges" title="Challenges">${icon('star')}<i class="badge"></i></button>
      <button class="round-btn" data-hud="closet" title="Closet">${icon('hanger')}</button>
      <button class="round-btn" data-hud="settings" title="Settings">${icon('gear')}</button></div>`;
    this.hud.onclick = (e) => {
      const t = e.target as Element;
      const room = (t.closest('[data-room]') as HTMLElement | null)?.dataset.room;
      if (room) {
        sound.tap();
        if (this.screen.kind !== 'place' || this.screen.id !== room) this.go({ kind: 'place', id: room });
        return;
      }
      const act = (t.closest('[data-hud]') as HTMLElement | null)?.dataset.hud;
      if (!act) return;
      sound.tap();
      if (act === 'map') this.go({ kind: 'map' });
      if (act === 'season') openSeasons((se) => this.setSeason(se));
      if (act === 'challenges') openChallenges();
      if (act === 'closet') {
        const here = this.screen.kind === 'place' ? G.s.dolls.find((d) => d.place === (this.screen as { id: string }).id) : undefined;
        this.openClosetFor(here?.id ?? G.s.dolls[0]?.id);
      }
      if (act === 'settings') openSettings(() => {
        G.reset();
        location.hash = '';
        this.go({ kind: 'title' });
      });
    };
    this.refreshHud();
  }

  private refreshHud(): void {
    const n = this.hud.querySelector('.coins .n');
    if (n) {
      // Roll the number up or down instead of jumping.
      const from = this.shownCoins < 0 ? G.s.coins : this.shownCoins;
      const to = G.s.coins;
      this.shownCoins = to;
      if (from === to) n.textContent = String(to);
      else {
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / 700);
          n.textContent = String(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }
    const badge = this.hud.querySelector('.star-btn .badge') as HTMLElement | null;
    if (badge) {
      const c = claimableCount(G.s) + (dailyReady(G.s) ? 1 : 0);
      badge.textContent = c ? String(c) : '';
      badge.classList.toggle('show', c > 0);
    }
  }

  private setSeason(se: Season): void {
    if (se === G.s.season) return;
    G.s.season = se;
    if (!G.s.seasonsSeen.includes(se)) G.s.seasonsSeen.push(se);
    sound.sparkle();
    G.changed();
    toast(`Hello, ${SEASON_NAME[se]}!`, SEASON_ICON[se]);
    if (this.scene) {
      this.scene.renderBg();
      this.scene.renderAll();
      setWeather(this.scene.place.outdoor ? se : null);
      this.renderTray();
    } else if (this.screen.kind === 'map') {
      (this.stage.querySelector('.map-screen') as HTMLDivElement & { redraw?: () => void })?.redraw?.();
      setWeather(se);
    }
    this.renderHud();
  }
}

