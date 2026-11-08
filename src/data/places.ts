// Every place in town: its background, where the floor is, what's there to start with, and which
// furniture the tray offers.
import type { FurnCat } from '../art/furniture';
import { FLOOR_BY_ID, WALL_BY_ID, boutiqueArt, playgroundArt, roomArt, salonArt, schoolArt, theaterArt } from '../art/scenes';
import type { SceneState, Season } from '../types';

export interface PlaceDef {
  id: string;
  name: string;
  /** Map building this place belongs to. */
  building: string;
  floorTop: number;
  floorBottom: number;
  room?: 'bedroom' | 'kitchen' | 'living';
  wall?: string;
  floor?: string;
  outdoor?: boolean;
  tray: FurnCat[];
  initial: { def: string; x: number; y: number; flip?: boolean; on?: boolean }[];
  bg: (season: Season, sc: SceneState, extra: { curtains?: boolean; lights?: boolean }) => string;
}

const room = (r: 'bedroom' | 'kitchen' | 'living') => (season: Season, sc: SceneState) =>
  roomArt(r, season, WALL_BY_ID[sc.wall ?? 'pinkPlain'] ?? WALL_BY_ID.pinkPlain, FLOOR_BY_ID[sc.floor ?? 'woodLight'] ?? FLOOR_BY_ID.woodLight, 600);
const HOME_TRAY: FurnCat[] = ['bedroom', 'kitchen', 'living', 'decor', 'wall', 'toys', 'food'];

export const PLACES: Record<string, PlaceDef> = {
  bedroom: {
    id: 'bedroom', name: 'Bedroom', building: 'home', floorTop: 600, floorBottom: 890, room: 'bedroom', wall: 'lilacDots', floor: 'woodLight', tray: HOME_TRAY,
    initial: [
      { def: 'rugRound', x: 760, y: 790 }, { def: 'frameHeart', x: 480, y: 250 }, { def: 'stringLights', x: 760, y: 80, on: true },
      { def: 'wardrobe', x: 150, y: 700 }, { def: 'bed', x: 470, y: 720 }, { def: 'nightstand', x: 760, y: 690, on: true },
      { def: 'desk', x: 1250, y: 720 }, { def: 'chair', x: 1200, y: 760 }, { def: 'plant', x: 1500, y: 740 }, { def: 'teddyToy', x: 1290, y: 580 },
    ],
    bg: room('bedroom'),
  },
  kitchen: {
    id: 'kitchen', name: 'Kitchen', building: 'home', floorTop: 600, floorBottom: 890, room: 'kitchen', wall: 'mintStripes', floor: 'tilesPink', tray: HOME_TRAY,
    initial: [
      { def: 'fridge', x: 150, y: 700 }, { def: 'stove', x: 360, y: 700 }, { def: 'sink', x: 590, y: 700 }, { def: 'counter', x: 810, y: 700 },
      { def: 'microwave', x: 810, y: 520 }, { def: 'pendantLamp', x: 1240, y: 60, on: true }, { def: 'diningTable', x: 1240, y: 800 },
      { def: 'stool', x: 1060, y: 820 }, { def: 'stool', x: 1420, y: 820 }, { def: 'apples3', x: 1240, y: 650 }, { def: 'clock', x: 1250, y: 300 },
    ],
    bg: room('kitchen'),
  },
  living: {
    id: 'living', name: 'Living Room', building: 'home', floorTop: 600, floorBottom: 890, room: 'living', wall: 'peach', floor: 'woodDark', tray: HOME_TRAY,
    initial: [
      { def: 'rugStripe', x: 800, y: 830 }, { def: 'clock', x: 1300, y: 200 }, { def: 'frameSun', x: 260, y: 230 },
      { def: 'tv', x: 250, y: 700 }, { def: 'floorLamp', x: 1500, y: 720, on: true }, { def: 'sofa', x: 800, y: 760 },
      { def: 'armchair', x: 1290, y: 790 }, { def: 'coffeeTable', x: 780, y: 880 }, { def: 'plant', x: 470, y: 690 },
    ],
    bg: room('living'),
  },
  school: {
    id: 'school', name: 'School', building: 'school', floorTop: 600, floorBottom: 890, tray: ['school', 'decor', 'toys', 'food'],
    initial: [
      { def: 'teacherDesk', x: 1330, y: 720 }, { def: 'globe', x: 1250, y: 570 }, { def: 'apple2', x: 1400, y: 570 }, { def: 'cubbies', x: 150, y: 700 },
      { def: 'schoolDesk', x: 450, y: 840 }, { def: 'schoolDesk', x: 800, y: 840 }, { def: 'schoolDesk', x: 1150, y: 840 }, { def: 'booksStack', x: 120, y: 530 },
    ],
    bg: (s) => schoolArt(s, 600),
  },
  playground: {
    id: 'playground', name: 'Playground', building: 'playground', floorTop: 600, floorBottom: 890, outdoor: true, tray: ['outdoor', 'toys', 'food'],
    initial: [
      { def: 'tree', x: 90, y: 660 }, { def: 'sandbox', x: 760, y: 830 }, { def: 'swings', x: 330, y: 740 }, { def: 'slide', x: 1150, y: 700 },
      { def: 'seesaw', x: 780, y: 672 }, { def: 'bench', x: 1440, y: 820 }, { def: 'iceCart', x: 1480, y: 650 }, { def: 'ball', x: 900, y: 870 },
    ],
    bg: (s) => playgroundArt(s),
  },
  theater: {
    id: 'theater', name: 'Piano Theater', building: 'theater', floorTop: 600, floorBottom: 770, tray: ['stage', 'toys', 'food'],
    initial: [{ def: 'grandPiano', x: 1080, y: 700 }, { def: 'micStand', x: 560, y: 720 }, { def: 'roses', x: 300, y: 760 }],
    bg: (s, _sc, x) => theaterArt(s, x.curtains ?? true, x.lights ?? true),
  },
  salon: {
    id: 'salon', name: 'Beauty Salon', building: 'salon', floorTop: 600, floorBottom: 890, tray: ['salon', 'decor', 'toys', 'food'],
    initial: [
      { def: 'salonChair', x: 380, y: 740 }, { def: 'salonChair', x: 1220, y: 740 }, { def: 'dryer', x: 800, y: 800 }, { def: 'productCart', x: 1500, y: 760 },
      { def: 'plant', x: 90, y: 730 }, { def: 'perfume', x: 300, y: 470 }, { def: 'nailPolish', x: 1300, y: 470 },
    ],
    bg: (s) => salonArt(s, 600),
  },
  boutique: {
    id: 'boutique', name: 'Boutique', building: 'boutique', floorTop: 600, floorBottom: 890, tray: ['shop', 'decor', 'toys', 'food'],
    initial: [
      { def: 'rack', x: 230, y: 720 }, { def: 'shoeShelf', x: 560, y: 700 }, { def: 'mannequin', x: 1060, y: 720 }, { def: 'counterShop', x: 1380, y: 760 },
      { def: 'gift', x: 1320, y: 598 }, { def: 'vase', x: 1250, y: 598 },
    ],
    bg: (s) => boutiqueArt(s, 600),
  },
};

export const HOME_ROOMS = ['bedroom', 'living', 'kitchen'];
export const BUILDING_FIRST_PLACE: Record<string, string> = { home: 'bedroom', school: 'school', playground: 'playground', theater: 'theater', salon: 'salon', boutique: 'boutique' };
