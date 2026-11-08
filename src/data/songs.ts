// Simple public-domain tunes for the theater piano. Notes are MIDI numbers (60 = middle C).

export interface Song {
  id: string;
  name: string;
  notes: number[];
}

const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69, B = 71, C2 = 72, D2 = 74, E2 = 76;

export const SONGS: Song[] = [
  { id: 'hotcross', name: 'Hot Cross Buns', notes: [E, D, C, E, D, C, C, C, C, C, D, D, D, D, E, D, C] },
  { id: 'mary', name: 'Mary Had a Little Lamb', notes: [E, D, C, D, E, E, E, D, D, D, E, G, G, E, D, C, D, E, E, E, E, D, D, E, D, C] },
  { id: 'twinkle', name: 'Twinkle Twinkle Little Star', notes: [C, C, G, G, A, A, G, F, F, E, E, D, D, C, G, G, F, F, E, E, D, G, G, F, F, E, E, D] },
  { id: 'ode', name: 'Ode to Joy', notes: [E, E, F, G, G, F, E, D, C, C, D, E, E, D, D, E, E, F, G, G, F, E, D, C, C, D, E, D, C, C] },
  { id: 'row', name: 'Row, Row, Row Your Boat', notes: [C, C, C, D, E, E, D, E, F, G, C2, C2, C2, G, G, G, E, E, E, C, C, C, G, F, E, D, C] },
  { id: 'jingle', name: 'Jingle Bells', notes: [E, E, E, E, E, E, E, G, C, D, E, F, F, F, F, F, E, E, E, E, D, D, E, D, G] },
];

/** Keys on the on-screen piano: two octaves of white keys from middle C. */
export const WHITE_KEYS = [C, D, E, F, G, A, B, C2, D2, E2, 77, 79, 81, 83, 84];
export const BLACK_KEYS = [61, 63, 66, 68, 70, 73, 75, 78, 80, 82];
