import { describe, expect, it } from 'vitest';
import { renderDoll, HAIR } from '../src/art/doll';
import { FURNITURE } from '../src/art/furniture';
import { WEAR } from '../src/art/wear';
import { townLayers } from '../src/art/town';
import { CHALLENGES } from '../src/data/challenges';
import { baseLook, randomLook, starterLooks } from '../src/data/looks';
import { rankVoices, sentences } from '../src/engine/voice';
import { NEED_KEYS, fill, fullNeeds, neediest, tickNeeds } from '../src/data/needs';
import { STORIES } from '../src/data/stories';
import { OLD_PARK_LAYOUT, PARK_LAYOUT, PLACES } from '../src/data/places';
import { orbitAngle, orbitAt, orbitOf, orbitOpen } from '../src/art/furn/kit';
import { makeQuestion } from '../src/data/quiz';
import { BLACK_KEYS, SONG_CATS, SONGS, WHITE_KEYS, songLevel } from '../src/data/songs';
import {
  ACTIVE_CHALLENGES, activeChallenges, bump, buy, claim, claimDaily, dailyReady, isDone, isOwned, newState, parseState, priceOf, progressOf, seasonFor, START_COINS,
} from '../src/data/state';
import { SEASONS, type Look } from '../src/types';

const bad = /NaN|undefined|Infinity|\[object/;

describe('art', () => {
  it('draws every clothing item on every age and pose', () => {
    for (const w of WEAR) {
      for (const age of ['kid', 'teen', 'adult'] as const) {
        for (const pose of ['stand', 'held', 'sit', 'sleep', 'wave'] as const) {
          const look: Look = { ...baseLook(), age, boy: pose === 'held' || pose === 'sit', wear: { ...baseLook().wear, [w.slot]: { id: w.id, color: w.color, pattern: 'stars' } } };
          const svg = renderDoll(look, { pose });
          expect(svg, `${w.id} ${age} ${pose}`).not.toMatch(bad);
          expect(svg.length).toBeGreaterThan(500);
        }
      }
    }
  });

  it('has at least 100 choices in every closet tab, with unique ids', () => {
    const ids = new Set<string>();
    for (const w of WEAR) {
      expect(ids.has(w.id), `duplicate ${w.id}`).toBe(false);
      ids.add(w.id);
      expect(w.name.length, w.id).toBeGreaterThan(0);
      expect(w.price, w.id).toBeGreaterThanOrEqual(0);
    }
    for (const slot of ['top', 'bottom', 'dress', 'outer', 'shoes', 'head', 'face', 'neck', 'hand', 'back'] as const) {
      expect(WEAR.filter((w) => w.slot === slot).length, slot).toBeGreaterThanOrEqual(100);
    }
  });

  it('draws every hairstyle, face and expression', () => {
    for (const h of HAIR) for (const e of ['normal', 'happy', 'surprised', 'sleep', 'yum'] as const) {
      const svg = renderDoll({ ...baseLook(), hair: h.id, lips: '#e0245e', blush: '#ff9db5', shadow: '#c99bff', freckles: true, sticker: 'star' }, { expr: e });
      expect(svg, h.id).not.toMatch(bad);
    }
    for (const s of starterLooks()) expect(renderDoll(s.look, { headOnly: true })).not.toMatch(bad);
  });

  it('draws every piece of furniture, on and off', () => {
    for (const d of FURNITURE) {
      for (const on of [false, true]) {
        const svg = d.art(d.color ?? '#ff9ec7', on) + (d.front ? d.front(d.color ?? '#ff9ec7', on) : '');
        expect(svg, d.id).not.toMatch(bad);
      }
      for (const s of d.seats ?? []) expect(Number.isFinite(s.x + s.y)).toBe(true);
    }
  });

  it('draws every place and the town in every season', () => {
    const s = newState();
    for (const season of SEASONS) {
      const t = townLayers(season, { home: [baseLook()], theater: [baseLook(), baseLook()] }, true);
      for (const layer of Object.values(t)) expect(layer).not.toMatch(bad);
      for (const p of Object.values(PLACES)) expect(p.bg(season, s.scenes[p.id], {}), `${p.id} ${season}`).not.toMatch(bad);
    }
  });

  it('has lots of wallpapers and floors, all drawable', async () => {
    const { WALLS, FLOORS, wallArt, floorArt, wallSwatch, floorSwatch } = await import('../src/art/roomstyle');
    expect(WALLS.length).toBeGreaterThanOrEqual(100);
    expect(FLOORS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(WALLS.map((w) => w.id)).size).toBe(WALLS.length);
    expect(new Set(FLOORS.map((w) => w.id)).size).toBe(FLOORS.length);
    for (const w of WALLS) expect(wallArt(w, -600, -500, 2200, 600) + wallSwatch(w), w.id).not.toMatch(bad);
    for (const fl of FLOORS) expect(floorArt(fl, 600) + floorSwatch(fl), fl.id).not.toMatch(bad);
    for (const id of ['pinkPlain', 'lilacDots', 'mintStripes', 'peach', 'skyStars', 'night']) expect(WALLS.some((w) => w.id === id), id).toBe(true);
    for (const id of ['woodLight', 'woodDark', 'tilesPink', 'marble', 'checker']) expect(FLOORS.some((w) => w.id === id), id).toBe(true);
  });

  it('has 500+ furniture pieces with unique ids, valid collections and prices', async () => {
    const { FURN_STYLE_BY_ID } = await import('../src/art/furn/kit');
    expect(FURNITURE.length).toBeGreaterThanOrEqual(500);
    expect(new Set(FURNITURE.map((d) => d.id)).size).toBe(FURNITURE.length);
    for (const d of FURNITURE) {
      expect(d.price, d.id).toBeGreaterThanOrEqual(0);
      if (d.style) expect(FURN_STYLE_BY_ID[d.style], `${d.id} style ${d.style}`).toBeTruthy();
      expect(['floor', 'wall', 'rug', 'prop']).toContain(d.mount);
      for (const s of d.seats ?? []) expect(Number.isFinite(s.x + s.y), d.id).toBe(true);
    }
    for (const cat of ['bedroom', 'kids', 'living', 'electronics', 'lighting', 'kitchen', 'bath', 'decor', 'plants', 'wall', 'rugs', 'yard'])
      expect(FURNITURE.filter((d) => d.cat === cat).length, cat).toBeGreaterThanOrEqual(20);
  });

  it('only places furniture that exists', () => {
    const ids = new Set(FURNITURE.map((f) => f.id));
    for (const p of Object.values(PLACES)) for (const it of p.initial) expect(ids.has(it.def), it.def).toBe(true);
    for (const f of FURNITURE) for (const sp of f.spawn ?? []) expect(ids.has(sp), sp).toBe(true);
  });
});

describe('theme park rides', () => {
  it('every ride runs on its own until tapped', () => {
    const rides = FURNITURE.filter((f) => /^f-(ferriswheel|carousel|teacups|bumpercars|coaster|droptower|swingride|pirateship|waterslide|kiddietrain|balloonride)-/.test(f.id));
    expect(rides.length).toBeGreaterThan(40);
    for (const r of rides) expect(r.toggle && r.defaultOn, r.id).toBe(true);
  });
  it('carousel horses go all the way round, and riders follow the same path', () => {
    const car = FURNITURE.find((f) => f.id === 'f-carousel-sweet')!;
    const seats = car.seats!;
    expect(seats).toHaveLength(6);
    for (const s of seats) {
      expect(s.anim?.kind).toBe('orbit');
      const o = orbitOf(s.anim!);
      // the seat sits where its horse is at time 0
      const p = orbitAt(o, orbitAngle(o, 0));
      expect(Math.abs(p.x - s.x)).toBeLessThan(1);
      expect(Math.abs(p.y - s.y)).toBeLessThan(1);
      // and a lap later it is back in the same place
      const q = orbitAt(o, orbitAngle(o, o.dur));
      expect(Math.abs(q.x - p.x)).toBeLessThan(1e-6);
    }
    // the horses really move: spread across the front and back, left and right
    const xs = seats.map((s) => s.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(300);
    // running art animates the orbit; stopped art doesn't
    expect(car.art('#ff9ec7', true)).toContain('animateTransform');
    expect(car.art('#ff9ec7', false)).not.toContain('type="translate" values');
    expect(orbitOpen(orbitOf(seats[0].anim!))).not.toMatch(bad);
  });
});

describe('story voice', () => {
  const v = (name: string, voiceURI: string, lang = 'en-US') => ({ name, voiceURI, lang, localService: true });
  // a typical iPad list: novelty and Eloquence voices next to the natural ones
  const ipad = [
    v('Albert', 'com.apple.speech.synthesis.voice.Albert'), v('Zarvox', 'com.apple.speech.synthesis.voice.Zarvox'), v('Fred', 'com.apple.speech.synthesis.voice.Fred'),
    v('Grandpa (English (US))', 'com.apple.eloquence.en-US.Grandpa'), v('Eddy (English (US))', 'com.apple.eloquence.en-US.Eddy'), v('Bad News', 'com.apple.speech.synthesis.voice.BadNews'),
    v('Samantha', 'com.apple.voice.compact.en-US.Samantha'), v('Daniel', 'com.apple.voice.compact.en-GB.Daniel', 'en-GB'),
    v('Ava (Premium)', 'com.apple.voice.premium.en-US.Ava'), v('Zoe (Enhanced)', 'com.apple.voice.enhanced.en-US.Zoe'),
    v('Thomas', 'com.apple.voice.compact.fr-FR.Thomas', 'fr-FR'), v('Whisper', 'com.apple.speech.synthesis.voice.Whisper'),
  ];
  it('picks a natural voice and never a robotic one', () => {
    const ranked = rankVoices(ipad).map((x) => x.name);
    expect(ranked[0]).toBe('Ava (Premium)');
    expect(ranked[1]).toBe('Zoe (Enhanced)');
    expect(ranked).toContain('Samantha');
    for (const bad of ['Albert', 'Zarvox', 'Fred', 'Grandpa (English (US))', 'Eddy (English (US))', 'Bad News', 'Whisper', 'Thomas']) expect(ranked).not.toContain(bad);
    // without premium voices, Samantha (a classic natural voice) comes first
    expect(rankVoices(ipad.filter((x) => !/premium|enhanced/.test(x.voiceURI)))[0].name).toBe('Samantha');
  });
  it('reads stories a sentence at a time', () => {
    expect(sentences('Pip hopped. "Wow!" said Peanut. And then... squish')).toEqual(['Pip hopped.', '"Wow!"', 'said Peanut.', 'And then...', 'squish']);
    for (const st of STORIES) for (const p of st.pages) expect(sentences(p.text).join(' ').replace(/\s+/g, ' ')).toBe(p.text.replace(/\s+/g, ' ').trim());
  });
});

describe('needs', () => {
  it('drain slowly, never below zero, and only up to 3 hours away counts', () => {
    const t0 = 1_000_000;
    const n = fullNeeds(t0);
    const ten = tickNeeds(n, t0 + 10 * 60 * 1000);
    expect(ten.food).toBe(75);
    expect(neediest(ten)).toBeNull();
    const half = tickNeeds(n, t0 + 30 * 60 * 1000);
    expect(neediest(half)).toBe('food');
    const week = tickNeeds(n, t0 + 7 * 24 * 3600 * 1000);
    const threeHours = tickNeeds(n, t0 + 3 * 3600 * 1000);
    expect(week).toEqual({ ...threeHours, t: week.t });
    for (const k of NEED_KEYS) expect(week[k]).toBe(0);
    expect(fill(week, 'food', 500).food).toBe(100);
    // a broken save just means everyone is happy
    expect(tickNeeds(undefined, 5)).toEqual(fullNeeds(5));
  });
});

describe('thumbnails', () => {
  it('strips animations from thumbnails', async () => {
    const { still } = await import('../src/ui/dom');
    const svg = '<g><animate attributeName="opacity" values="0;1" dur="1s"/><circle r="2"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s"></animateTransform></circle><animateMotion path="M0 0" dur="1s"/></g>';
    expect(still(svg)).toBe('<g><circle r="2"></circle></g>');
  });
});

describe('saving', () => {
  it('starts with friends, rooms and challenges', () => {
    const s = newState();
    expect(s.dolls.length).toBe(6);
    expect(s.dolls.filter((d) => d.look.boy).map((d) => d.name).sort()).toEqual(['Dad', 'Leo']);
    expect(s.coins).toBe(START_COINS);
    expect(Object.keys(s.scenes).sort()).toEqual(Object.keys(PLACES).sort());
    expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
  });

  it('round-trips a save', () => {
    const s = newState();
    s.coins = 777;
    s.dolls[0].name = 'Sparkle';
    s.dolls[0].seat = { uid: s.scenes.bedroom.items[0].uid, i: 0 };
    const back = parseState(JSON.stringify(s))!;
    expect(back.coins).toBe(777);
    expect(back.dolls[0].name).toBe('Sparkle');
    expect(back.dolls[0].seat).toEqual(s.dolls[0].seat);
    expect(back.scenes.kitchen.items.length).toBe(s.scenes.kitchen.items.length);
  });

  it('invites Leo and Dad into saves made before boys existed', () => {
    const old = JSON.parse(JSON.stringify(newState()));
    old.dolls = old.dolls.filter((d: { look: { boy?: boolean } }) => !d.look.boy);
    delete old.boysAdded;
    const s = parseState(JSON.stringify(old))!;
    expect(s.dolls.map((d) => d.name)).toEqual(expect.arrayContaining(['Lily', 'Mia', 'Rosie', 'Mom', 'Leo', 'Dad']));
    expect(new Set(s.dolls.map((d) => d.id)).size).toBe(s.dolls.length);
    const again = parseState(JSON.stringify(s))!;
    expect(again.dolls.length).toBe(s.dolls.length);
  });

  it('spreads out a theme park saved with the old one-screen layout', () => {
    const s = newState();
    s.scenes.themepark.items = OLD_PARK_LAYOUT.map((o, i) => ({ uid: 9000 + i, def: o.def, x: o.x, y: o.y }));
    s.dolls[0].place = 'themepark';
    s.dolls[0].seat = { uid: 9000, i: 0 };
    const raw = JSON.parse(JSON.stringify(s));
    delete raw.parkV;
    const fixed = parseState(JSON.stringify(raw))!;
    expect(fixed.scenes.themepark.items.map((i) => i.def)).toEqual(PARK_LAYOUT.map((o) => o.def));
    expect(Math.max(...fixed.scenes.themepark.items.map((i) => i.x))).toBeGreaterThan(3000);
    expect(fixed.dolls[0].seat).toBeNull();
    const uids = Object.values(fixed.scenes).flatMap((sc) => sc.items.map((i) => i.uid));
    expect(new Set(uids).size).toBe(uids.length);
    // a park the player rearranged keeps their things; untouched rides still move to the new spots
    const mine = JSON.parse(JSON.stringify(raw));
    mine.scenes.themepark.items.push({ uid: 9100, def: 'f-parkbench-sweet', x: 500, y: 860 });
    const kept = parseState(JSON.stringify(mine))!;
    expect(kept.scenes.themepark.items).toHaveLength(OLD_PARK_LAYOUT.length + 1);
    expect(kept.scenes.themepark.items.find((i) => i.def === 'f-coaster-sweet')!.x).toBe(PARK_LAYOUT.find((o) => o.def === 'f-coaster-sweet')!.x);
    // and it only happens once
    expect(parseState(JSON.stringify(fixed))!.scenes.themepark.items).toEqual(fixed.scenes.themepark.items);
  });

  it('rejects junk and repairs damaged saves', () => {
    expect(parseState('not json')).toBeNull();
    expect(parseState('{"v":2}')).toBeNull();
    expect(parseState(null)).toBeNull();
    const s = newState();
    const raw = JSON.parse(JSON.stringify(s));
    raw.dolls[0].look.wear.top = { id: 'gone-forever', color: '#fff', pattern: 'none' };
    raw.dolls[0].look.hair = 'nope';
    raw.scenes.bedroom.items.push({ uid: 9999, def: 'nope', x: 0, y: 0 });
    delete raw.scenes.salon;
    raw.coins = 'lots';
    const fixed = parseState(JSON.stringify(raw))!;
    expect(fixed.dolls[0].look.wear.top).toBeUndefined();
    expect(fixed.dolls[0].look.hair).toBe('long');
    expect(fixed.scenes.bedroom.items.some((i) => i.def === 'nope')).toBe(false);
    expect(fixed.scenes.salon.items.length).toBeGreaterThan(0);
    expect(fixed.coins).toBe(START_COINS);
    expect(fixed.nextUid).toBeGreaterThan(Math.max(...fixed.scenes.bedroom.items.map((i) => i.uid)));
  });
});

describe('shop', () => {
  it('free things are owned, paid things cost coins', () => {
    const s = newState();
    expect(isOwned(s, 'tee')).toBe(true);
    expect(isOwned(s, 'princess')).toBe(false);
    s.coins = 10;
    expect(buy(s, 'princess')).toBe(false);
    expect(s.coins).toBe(10);
    s.coins = 500;
    expect(buy(s, 'princess')).toBe(true);
    expect(s.coins).toBe(500 - priceOf('princess'));
    expect(isOwned(s, 'princess')).toBe(true);
    expect(buy(s, 'princess')).toBe(true);
    expect(s.coins).toBe(500 - priceOf('princess'));
    expect(priceOf('hair:princess')).toBeGreaterThan(0);
    expect(priceOf('wall:night')).toBeGreaterThan(0);
    expect(priceOf('floor:marble')).toBeGreaterThan(0);
  });

  it('random boys get boy hair and no dresses', () => {
    const s = newState();
    for (let i = 0; i < 200; i++) {
      const l = randomLook(() => true, 'kid', true);
      expect(l.boy).toBe(true);
      expect(l.wear.dress).toBeUndefined();
      expect(['short', 'buzz', 'spiky', 'sidepart', 'swoop', 'curlytop', 'mohawk', 'manbun', 'shaggy', 'flattop', 'afro', 'pixie']).toContain(l.hair);
    }
    void s;
  });

  it('random outfits only use owned things', () => {
    const s = newState();
    for (let i = 0; i < 200; i++) {
      const l = randomLook((k) => isOwned(s, k));
      for (const w of Object.values(l.wear)) expect(isOwned(s, w!.id), w!.id).toBe(true);
      expect(isOwned(s, 'hair:' + l.hair)).toBe(true);
    }
  });
});

describe('challenges', () => {
  it('pays once when finished, then refills the list', () => {
    const s = newState();
    const first = activeChallenges(s).find((c) => c.id === 'firstDress')!;
    expect(isDone(s, first)).toBe(false);
    expect(claim(s, 'firstDress')).toBe(0);
    bump(s, 'equip');
    expect(isDone(s, first)).toBe(true);
    const coins = s.coins;
    expect(claim(s, 'firstDress')).toBe(first.reward);
    expect(s.coins).toBe(coins + first.reward);
    expect(claim(s, 'firstDress')).toBe(0);
    expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
    expect(s.ch.list).not.toContain('firstDress');
  });

  it('counts progress from when a challenge appears', () => {
    const s = newState();
    bump(s, 'pianoNote', 100);
    s.ch.list = ['piano50'];
    s.ch.base.piano50 = s.stats.pianoNote;
    const c = activeChallenges(s).find((x) => x.id === 'piano50')!;
    expect(progressOf(s, c)).toBe(0);
    bump(s, 'pianoNote', 50);
    expect(isDone(s, c)).toBe(true);
  });

  it('never runs out', () => {
    const s = newState();
    // Meet the challenges that look at the town rather than counting things.
    s.visited = ['home', 'school', 'playground', 'theater', 'salon', 'boutique', 'library', 'cinema', 'hotel', 'grocery', 'restaurant', 'mall', 'hospital', 'carshop', 'themepark'];
    for (let k = 0; k < 4; k++) s.scenes.bedroom.items.push({ uid: 9000 + k, def: 'f-sofa-princess', x: 100 * k, y: 700 });
    s.seasonsSeen = [...SEASONS];
    s.songsDone = SONGS.map((x) => x.id);
    s.stickers = Array.from({ length: 10 }, (_, i) => `s${i}`);
    s.stats.petFeed = 10;
    while (s.dolls.length < 6) s.dolls.push({ ...s.dolls[0], id: 'x' + s.dolls.length });
    for (const d of s.dolls) d.place = 'bedroom';
    s.dolls[0].look = { ...s.dolls[0].look, lips: '#e0245e', blush: '#ff9db5' };
    for (let round = 0; round < 80; round++) {
      for (const c of activeChallenges(s)) if (c.stat) bump(s, c.stat, c.target);
      for (const c of [...activeChallenges(s)]) if (isDone(s, c)) claim(s, c.id);
      expect(s.ch.list.length).toBe(ACTIVE_CHALLENGES);
    }
    expect(CHALLENGES.every((c) => s.ch.claimed.includes(c.id))).toBe(true);
    expect(s.ch.list.every((id) => id.startsWith('rep-'))).toBe(true);
  });

  it('gives one daily gift per day', () => {
    const s = newState();
    const day = new Date(2026, 10, 7, 9);
    expect(dailyReady(s, day)).toBe(true);
    expect(claimDaily(s, day)).toBeGreaterThan(0);
    expect(claimDaily(s, new Date(2026, 10, 7, 20))).toBe(0);
    expect(dailyReady(s, new Date(2026, 10, 8, 8))).toBe(true);
  });
});

describe('school and music', () => {
  it('every question for every grade has its answer among the choices', () => {
    for (let grade = 1; grade <= 5; grade++) {
      const kinds = new Set<string>();
      for (let i = 0; i < 600; i++) {
        const q = makeQuestion(grade);
        kinds.add(q.kind);
        expect(q.options, `${grade} ${q.prompt}`).toContain(q.answer);
        expect(new Set(q.options).size, `${grade} ${q.prompt} ${q.options}`).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.prompt).not.toMatch(/NaN|undefined|Infinity/);
        for (const o of q.options) expect(o).not.toMatch(/NaN|undefined|Infinity/);
        if (/^\d+$/.test(q.answer)) expect(Number(q.answer)).toBeGreaterThanOrEqual(0);
      }
      expect(kinds.size, `grade ${grade} variety`).toBeGreaterThanOrEqual(6);
    }
  });

  it('harder grades ask harder questions', () => {
    const avg = (g: number) => {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const q = makeQuestion(g);
        const v = Number(q.answer);
        if (Number.isFinite(v)) {
          sum += Math.abs(v);
          n++;
        }
      }
      return sum / n;
    };
    expect(avg(4)).toBeGreaterThan(avg(1) * 5);
  });

  it('every song fits on the white keys, so every instrument can play it', () => {
    const keys = new Set(WHITE_KEYS);
    for (const s of SONGS) for (const n of s.notes) expect(keys.has(n), `${s.id} ${n}`).toBe(true);
    expect(BLACK_KEYS.length).toBe(10);
  });

  it('has a big song book: 56 songs in every group, with unique ids', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(56);
    expect(new Set(SONGS.map((x) => x.id)).size).toBe(SONGS.length);
    for (const c of SONG_CATS) expect(SONGS.filter((x) => x.cat === c.id).length, c.id).toBeGreaterThanOrEqual(8);
    for (const x of SONGS) {
      expect(x.notes.length, x.id).toBeGreaterThanOrEqual(8);
      expect([1, 2, 3]).toContain(songLevel(x));
    }
    // the first six keep their ids so saved stars stay
    for (const id of ['hotcross', 'mary', 'twinkle', 'ode', 'row', 'jingle']) expect(SONGS.some((x) => x.id === id)).toBe(true);
  });

  it('picks the season from the date', () => {
    expect(seasonFor(new Date(2026, 0, 5))).toBe('winter');
    expect(seasonFor(new Date(2026, 3, 5))).toBe('spring');
    expect(seasonFor(new Date(2026, 6, 5))).toBe('summer');
    expect(seasonFor(new Date(2026, 10, 7))).toBe('fall');
  });
});
