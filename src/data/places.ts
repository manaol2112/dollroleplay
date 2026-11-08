// Every place in town: its background, where the floor is, what's there to start with, and which
// furniture the tray offers.
import type { FurnCat } from '../art/furniture';
import { TOWN_PLACE_LOOK, themeParkArt, townInteriorArt } from '../art/townplaces';
import { FLOOR_BY_ID, WALL_BY_ID, type HomeRoom, backyardArt, boutiqueArt, playgroundArt, roomArt, salonArt, schoolArt, theaterArt } from '../art/scenes';
import type { SceneState, Season } from '../types';

export interface PlaceDef {
  id: string;
  name: string;
  /** Map building this place belongs to. */
  building: string;
  floorTop: number;
  floorBottom: number;
  room?: HomeRoom;
  /** The backyard: an outdoor home room with a restyleable ground and fence. */
  yard?: boolean;
  /** A town place the player can restyle and furnish like the house. */
  decor?: 'indoor' | 'outdoor';
  wall?: string;
  floor?: string;
  outdoor?: boolean;
  tray: FurnCat[];
  initial: { def: string; x: number; y: number; flip?: boolean; on?: boolean }[];
  bg: (season: Season, sc: SceneState, extra: { curtains?: boolean; lights?: boolean }) => string;
}

const room = (r: HomeRoom) => (season: Season, sc: SceneState) =>
  roomArt(r, season, WALL_BY_ID[sc.wall ?? 'pinkPlain'] ?? WALL_BY_ID.pinkPlain, FLOOR_BY_ID[sc.floor ?? 'woodLight'] ?? FLOOR_BY_ID.woodLight, 600, { trim: sc.trim, curtain: sc.curtain });
/** Everything can go anywhere in the house; the tray just orders the tabs. */
export const HOME_TRAY: FurnCat[] = ['bedroom', 'kids', 'living', 'electronics', 'lighting', 'kitchen', 'bath', 'decor', 'plants', 'wall', 'rugs', 'yard', 'outdoor', 'toys', 'food'];

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
  bathroom: {
    id: 'bathroom', name: 'Bathroom', building: 'home', floorTop: 600, floorBottom: 890, room: 'bathroom', wall: 'wall-tiles-0', floor: 'floor-hex-0', tray: HOME_TRAY,
    initial: [
      { def: 'f-bathmat-sweet', x: 430, y: 850 }, { def: 'f-bathmirror-sweet', x: 760, y: 250 }, { def: 'f-towelrack-sweet', x: 540, y: 330 },
      { def: 'f-shower-sweet', x: 160, y: 700 }, { def: 'f-bathtub-sweet', x: 430, y: 760 }, { def: 'f-bathsink-sweet', x: 760, y: 700 },
      { def: 'f-toilet-sweet', x: 1000, y: 720 }, { def: 'f-washer-sweet', x: 1450, y: 720 }, { def: 'duck', x: 520, y: 700 },
    ],
    bg: room('bathroom'),
  },
  playroom: {
    id: 'playroom', name: 'Playroom', building: 'home', floorTop: 600, floorBottom: 890, room: 'playroom', wall: 'wall-confetti-0', floor: 'floor-carpet-0', tray: HOME_TRAY,
    initial: [
      { def: 'rugHeart', x: 760, y: 830 }, { def: 'window2', x: 300, y: 90 }, { def: 'f-toyshelf-sweet', x: 130, y: 700 }, { def: 'f-playtent-sweet', x: 360, y: 740 },
      { def: 'f-easel-sweet', x: 1080, y: 720 }, { def: 'f-dollhouse-sweet', x: 1400, y: 720 }, { def: 'f-rockinghorse-sweet', x: 880, y: 760 },
      { def: 'f-ballpit-sweet', x: 640, y: 860 }, { def: 'blocks', x: 1180, y: 860 }, { def: 'teddyToy', x: 560, y: 690 },
    ],
    bg: room('playroom'),
  },
  backyard: {
    id: 'backyard', name: 'Backyard', building: 'home', floorTop: 600, floorBottom: 890, yard: true, outdoor: true, floor: 'floor-grass-0', tray: HOME_TRAY,
    initial: [
      { def: 'f-gardenbed-sweet', x: 760, y: 630 }, { def: 'f-playhouse-sweet', x: 1450, y: 650 }, { def: 'f-hammock-sweet', x: 180, y: 790 },
      { def: 'f-picnic-sweet', x: 1000, y: 700 }, { def: 'f-bbq-sweet', x: 1260, y: 720 }, { def: 'f-trampoline-sweet', x: 1250, y: 860 },
      { def: 'f-pool-sweet', x: 620, y: 840 },
    ],
    bg: (s, sc) => backyardArt(s, FLOOR_BY_ID[sc.floor ?? 'floor-grass-0'] ?? FLOOR_BY_ID['floor-grass-0'], sc.trim ?? '#ffffff'),
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

type Start = { def: string; x: number; y: number; flip?: boolean; on?: boolean };
const townPlace = (id: string, name: string, cat: FurnCat, initial: Start[]): PlaceDef => ({
  id, name, building: id, floorTop: 600, floorBottom: 890, decor: 'indoor', wall: TOWN_PLACE_LOOK[id].wall, floor: TOWN_PLACE_LOOK[id].floor,
  tray: [cat, ...HOME_TRAY], initial, bg: (s, sc) => townInteriorArt(id, s, sc),
});

const TOWN_PLACES: Record<string, PlaceDef> = {
  library: townPlace('library', 'Library', 'library', [
    { def: 'f-storyrug-sweet', x: 800, y: 830 }, { def: 'f-bookshelf-tall-sweet', x: 140, y: 700 }, { def: 'f-bookshelf-tall-sweet', x: 360, y: 700 },
    { def: 'f-librarydesk-sweet', x: 1050, y: 720 }, { def: 'f-readingnook-sweet', x: 650, y: 760 }, { def: 'f-bookcart-sweet', x: 1420, y: 760 }, { def: 'plant', x: 1530, y: 700 },
  ]),
  cinema: townPlace('cinema', 'Cinema', 'cinema', [
    { def: 'f-moviescreen-sweet', x: 800, y: 260 }, { def: 'f-cinemaseats-sweet', x: 560, y: 780 }, { def: 'f-cinemaseats-sweet', x: 1040, y: 780 },
    { def: 'f-popcorn-sweet', x: 150, y: 700 }, { def: 'f-snackbar-sweet', x: 1240, y: 720 }, { def: 'f-ticketbooth-sweet', x: 1510, y: 760, on: false },
  ]),
  hotel: townPlace('hotel', 'Grand Hotel', 'hotel', [
    { def: 'f-chandelier-hotel-sweet', x: 800, y: 120 }, { def: 'f-reception-sweet', x: 760, y: 710 }, { def: 'f-luggagecart-sweet', x: 1060, y: 820 },
    { def: 'f-lobbysofa-sweet', x: 330, y: 790 }, { def: 'f-hotelbed-sweet', x: 1400, y: 730 }, { def: 'f-roomservice-sweet', x: 620, y: 875 }, { def: 'plant', x: 70, y: 700 },
  ]),
  grocery: townPlace('grocery', 'Grocery Shop', 'grocery', [
    { def: 'f-grocshelf-sweet', x: 160, y: 690 }, { def: 'f-produce-sweet', x: 470, y: 720 }, { def: 'f-bakerycase-sweet', x: 780, y: 710 },
    { def: 'f-freezer-sweet', x: 1060, y: 690 }, { def: 'f-checkout-sweet', x: 1380, y: 800 }, { def: 'f-cart-sweet', x: 620, y: 860 },
  ]),
  restaurant: townPlace('restaurant', 'Restaurant', 'restaurant', [
    { def: 'f-menuboard-sweet', x: 800, y: 300 }, { def: 'f-chefgrill-sweet', x: 800, y: 680 }, { def: 'f-hoststand-sweet', x: 120, y: 760 },
    { def: 'f-diningset-sweet', x: 420, y: 820 }, { def: 'f-booth-sweet', x: 1200, y: 800 }, { def: 'f-dessertcase-sweet', x: 1520, y: 700 },
  ]),
  mall: townPlace('mall', 'Sunshine Mall', 'mall', [
    { def: 'f-storefront-toys-sweet', x: 260, y: 440 }, { def: 'f-escalator-sweet', x: 1320, y: 690 }, { def: 'f-mallfountain-sweet', x: 760, y: 790, on: true },
    { def: 'f-kiosk-sweet', x: 330, y: 840 }, { def: 'f-clawmachine-sweet', x: 1040, y: 700 }, { def: 'f-mallbench-sweet', x: 1000, y: 880 },
  ]),
  hospital: townPlace('hospital', 'Happy Hospital', 'hospital', [
    { def: 'f-eyechart-sweet', x: 1000, y: 300 }, { def: 'f-hospdesk-sweet', x: 220, y: 720 }, { def: 'f-hospitalbed-sweet', x: 700, y: 740 },
    { def: 'f-examtable-sweet', x: 1060, y: 750 }, { def: 'f-medcabinet-sweet', x: 1480, y: 690 }, { def: 'f-wheelchair-sweet', x: 470, y: 885 }, { def: 'f-waitingchairs-sweet', x: 1340, y: 880 },
  ]),
  carshop: townPlace('carshop', 'Car Shop', 'cars', [
    { def: 'f-toolwall-sweet', x: 800, y: 260 }, { def: 'f-turntable-sweet', x: 760, y: 830 }, { def: 'f-car-convertible-sweet', x: 760, y: 820 },
    { def: 'f-tirerack-sweet', x: 160, y: 700 }, { def: 'f-carlift-sweet', x: 1350, y: 720 }, { def: 'f-gaspump-sweet', x: 1560, y: 760 },
  ]),
  themepark: {
    id: 'themepark', name: 'Theme Park', building: 'themepark', floorTop: 600, floorBottom: 890, decor: 'outdoor', outdoor: true, floor: 'floor-stone-1',
    tray: ['rides', 'outdoor', ...HOME_TRAY], bg: (s, sc) => themeParkArt(s, sc),
    initial: [
      { def: 'f-ferriswheel-sweet', x: 300, y: 690 }, { def: 'f-coaster-sweet', x: 1240, y: 700 }, { def: 'f-carousel-sweet', x: 760, y: 760 },
      { def: 'f-teacups-sweet', x: 300, y: 870 }, { def: 'f-cottoncandy-sweet', x: 1500, y: 840 }, { def: 'f-balloonstand-sweet', x: 1050, y: 870 },
    ],
  },
};

export const HOME_ROOMS = ['bedroom', 'living', 'kitchen', 'bathroom', 'playroom', 'backyard'];
Object.assign(PLACES, TOWN_PLACES);
export const TOWN_PLACE_IDS = Object.keys(TOWN_PLACES);
export const BUILDING_FIRST_PLACE: Record<string, string> = {
  home: 'bedroom', school: 'school', playground: 'playground', theater: 'theater', salon: 'salon', boutique: 'boutique',
  ...Object.fromEntries(TOWN_PLACE_IDS.map((id) => [id, id])),
};
/** Places the player can restyle and furnish. */
export const designable = (p: PlaceDef) => !!(p.room || p.yard || p.decor);
export const indoorStyle = (p: PlaceDef) => !!(p.room || p.decor === 'indoor');
