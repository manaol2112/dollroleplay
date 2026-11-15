// Public-domain tunes to play with the glowing keys. Notes are MIDI numbers (60 = middle C).
//
// Every song uses white keys only, between middle C and the C two octaves up, so it can be played
// on every melodic instrument (the xylophone, harp and flute have no black keys). Most tunes are
// written as major-scale steps with `tune` ("1" = do, "5," = sol an octave down, "1'" = do an
// octave up) on a starting do that keeps them on the keyboard; minor and modal ones use note names.

export type SongCat = 'kids' | 'holiday' | 'classical' | 'world';

export interface Song {
  id: string;
  name: string;
  notes: number[];
  cat: SongCat;
}

export const SONG_CATS: { id: SongCat; name: string; icon: string }[] = [
  { id: 'kids', name: 'Kids Songs', icon: 'toy' },
  { id: 'holiday', name: 'Holidays', icon: 'gift' },
  { id: 'classical', name: 'Classical', icon: 'note' },
  { id: 'world', name: 'Folk & World', icon: 'star' },
];

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** Do on middle C, or an octave up for tunes that dip below do. */
const LOW = 60;
const HIGH = 72;

/** Major-scale steps from `doNote`: "1 2 3", low octave "5,", high octave "1'". Bars "|" are ignored. */
export function tune(doNote: number, steps: string): number[] {
  return steps.split(/\s+/).filter((t) => t && t !== '|').map((t) => {
    const deg = parseInt(t, 10);
    const oct = (t.match(/'/g)?.length ?? 0) - (t.match(/,/g)?.length ?? 0);
    if (!(deg >= 1 && deg <= 7)) throw new Error(`bad step ${t}`);
    return doNote + MAJOR[deg - 1] + 12 * oct;
  });
}

const NAME: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Note names with octaves, e.g. "A4 C5 D5". */
export function named(s: string): number[] {
  return s.split(/\s+/).filter((t) => t && t !== '|').map((t) => {
    const m = t.match(/^([A-G])(\d)$/);
    if (!m) throw new Error(`bad note ${t}`);
    return 12 * (Number(m[2]) + 1) + NAME[m[1]];
  });
}

const S = (id: string, name: string, cat: SongCat, notes: number[]): Song => ({ id, name, cat, notes });

export const SONGS: Song[] = [
  // ---------------- kids songs ----------------
  S('hotcross', 'Hot Cross Buns', 'kids', tune(LOW, '3 2 1 | 3 2 1 | 1 1 1 1 2 2 2 2 | 3 2 1')),
  S('mary', 'Mary Had a Little Lamb', 'kids', tune(LOW, '3 2 1 2 3 3 3 | 2 2 2 | 3 5 5 | 3 2 1 2 3 3 3 3 2 2 3 2 1')),
  S('twinkle', 'Twinkle Twinkle Little Star', 'kids', tune(LOW, '1 1 5 5 6 6 5 | 4 4 3 3 2 2 1 | 5 5 4 4 3 3 2 | 5 5 4 4 3 3 2')),
  S('row', 'Row, Row, Row Your Boat', 'kids', tune(LOW, "1 1 1 2 3 | 3 2 3 4 5 | 1' 1' 1' 5 5 5 3 3 3 1 1 1 | 5 4 3 2 1")),
  S('birthday', 'Happy Birthday', 'kids', tune(HIGH, '5, 5, 6, 5, 1 7, | 5, 5, 6, 5, 2 1 | 5, 5, 5 3 1 7, 6, | 4 4 3 1 2 1')),
  S('macdonald', 'Old MacDonald Had a Farm', 'kids', tune(HIGH, '1 1 1 5, 6, 6, 5, | 3 3 2 2 1 | 5, 1 1 1 5, 6, 6, 5, | 3 3 2 2 1 | 5, 5, 1 1 1 | 5, 5, 1 1 1 | 1 1 1 1 1 1 1 1 | 1 1 1 5, 6, 6, 5, | 3 3 2 2 1')),
  S('london', 'London Bridge', 'kids', tune(LOW, '5 6 5 4 3 4 5 | 2 3 4 | 3 4 5 | 5 6 5 4 3 4 5 | 2 5 3 1')),
  S('itsy', 'Itsy Bitsy Spider', 'kids', tune(HIGH, '5, 1 1 1 2 3 3 | 3 2 1 2 3 1 | 3 3 4 5 | 5 4 3 4 5 3 | 1 1 2 3 | 3 2 1 2 3 1 | 5, 5, 1 1 1 2 3 3 | 3 2 1 2 3 1')),
  S('jacques', 'Frère Jacques', 'kids', tune(HIGH, '1 2 3 1 | 1 2 3 1 | 3 4 5 | 3 4 5 | 5 6 5 4 3 1 | 5 6 5 4 3 1 | 1 5, 1 | 1 5, 1')),
  S('bus', 'The Wheels on the Bus', 'kids', tune(HIGH, '5, 1 1 1 1 3 5 3 1 | 2 7, 5, | 5 3 1 | 5, 1 1 1 1 3 5 3 1 | 2 5, 5, 1')),
  S('yankee', 'Yankee Doodle', 'kids', tune(HIGH, '1 1 2 3 1 3 2 5, | 1 1 2 3 1 7, | 1 1 2 3 4 3 2 1 | 7, 5, 6, 7, 1 1')),
  S('weasel', 'Pop Goes the Weasel', 'kids', tune(HIGH, '1 1 2 2 3 5 3 1 | 5, 1 1 2 2 3 1 | 1 1 2 2 3 5 3 1 | 6 2 4 3 1')),
  S('muffin', 'The Muffin Man', 'kids', tune(HIGH, '5, 1 1 2 3 1 1 | 7, 6, 2 2 1 7, 5, | 5, 1 1 2 3 1 1 1 | 2 2 5, 5, 1')),
  S('rain', 'Rain, Rain, Go Away', 'kids', tune(LOW, '5 3 5 5 3 | 5 5 3 6 5 5 3 | 5 3 5 5 3 | 5 5 3 6 5 5 3')),
  S('rosie', 'Ring Around the Rosie', 'kids', tune(LOW, '5 5 3 6 5 3 | 4 5 5 3 6 5 3 | 5 3 5 3 | 5 5 1')),
  S('bingo', 'Bingo', 'kids', tune(HIGH, '5, 1 1 5, 5, 6, 6, 5, | 5, 1 1 2 2 3 1 | 3 3 4 4 4 | 2 2 3 3 3 | 1 1 2 2 2 | 1 7, 5, 6, 7, 1 1')),
  S('dell', 'The Farmer in the Dell', 'kids', tune(HIGH, '5, 1 1 1 1 1 | 2 3 3 3 3 3 | 5 5 6 5 3 1 | 2 3 3 2 2 1')),
  S('oldman', 'This Old Man', 'kids', tune(LOW, '5 3 5 | 5 3 5 | 6 5 4 3 2 3 4 | 3 4 5 1 1 1 1 | 1 2 3 4 5 | 5 2 2 4 3 2 1')),
  S('teapot', "I'm a Little Teapot", 'kids', tune(LOW, "1 2 3 4 5 1' 6 1' 5 | 4 4 4 3 3 2 2 2 1 | 1 2 3 4 5 1' 6 1' 5 | 1' 6 5 5 4 3 2 1")),
  S('mice', 'Three Blind Mice', 'kids', tune(LOW, "3 2 1 | 3 2 1 | 5 4 4 3 | 5 4 4 3 | 5 1' 1' 7 6 7 1' 5 5 | 5 1' 1' 1' 7 6 7 1' 5 5 | 5 1' 1' 7 6 7 1' 5 5 4 | 3 2 1")),
  S('mulberry', 'The Mulberry Bush', 'kids', tune(HIGH, '1 1 1 3 5 5 3 1 | 2 2 7, 5, 5, 7, 5, | 1 1 1 3 5 5 3 1 | 2 5, 5, 1')),
  S('lightly', 'Lightly Row', 'kids', tune(LOW, '5 3 3 | 4 2 2 | 1 2 3 4 5 5 5 | 5 3 3 | 4 2 2 | 1 3 5 5 1 | 2 2 2 2 2 3 4 | 3 3 3 3 3 4 5 | 5 3 3 | 4 2 2 | 1 3 5 5 1')),
  S('rhody', 'Go Tell Aunt Rhody', 'kids', tune(LOW, '3 3 2 1 1 | 2 2 4 3 2 1 | 5 5 4 3 3 | 2 1 2 3 1')),
  S('clair', 'Au Clair de la Lune', 'kids', tune(HIGH, '1 1 1 2 3 2 | 1 3 2 2 1 | 1 1 1 2 3 2 | 1 3 2 2 1 | 2 2 2 2 6, 6, | 2 1 7, 6, 5, | 1 1 1 2 3 2 | 1 3 2 2 1')),

  // ---------------- holidays ----------------
  S('jingle', 'Jingle Bells', 'holiday', tune(LOW, '3 3 3 | 3 3 3 | 3 5 1 2 3 | 4 4 4 4 4 3 3 3 3 2 2 3 2 5')),
  S('deck', 'Deck the Halls', 'holiday', tune(HIGH, "5 4 3 2 1 2 3 1 | 2 3 4 2 3 2 1 7, 1 | 5 4 3 2 1 2 3 1 | 2 3 4 2 3 2 1 7, 1 | 2 3 4 2 3 4 5 2 | 3 4 5 6 7 1' 7 6 5 | 5 4 3 2 1 2 3 1 | 6 6 6 6 5 4 3 2 1")),
  S('wewish', 'We Wish You a Merry Christmas', 'holiday', tune(HIGH, '5, 1 1 2 1 7, 6, 6, | 6, 2 2 3 2 1 7, 5, | 5, 3 3 4 3 2 1 6, | 5, 5, 6, 2 7, 1')),
  S('silent', 'Silent Night', 'holiday', tune(LOW, "5 6 5 3 | 5 6 5 3 | 2' 2' 7 | 1' 1' 5 | 6 6 1' 7 6 5 6 5 3 | 6 6 1' 7 6 5 6 5 3 | 2' 2' 4' 2' 7 1' 3' | 1' 5 3 5 4 2 1")),
  S('joy', 'Joy to the World', 'holiday', tune(LOW, "1' 7 6 5 4 3 2 1 | 5 6 6 7 7 1' | 1' 1' 7 6 5 5 4 3 | 1' 1' 7 6 5 5 4 3 | 3 3 3 3 3 4 5 | 4 3 2 2 2 2 3 4 | 3 2 1 1' 6 5 4 3 4 3 2 1")),
  S('noel', 'The First Noel', 'holiday', tune(LOW, "3 2 1 2 3 4 5 | 6 7 1' 7 6 5 | 6 7 1' 7 6 5 6 7 1' 5 4 3 | 3 2 1 2 3 4 5 1' 7 6 6 5 | 1' 7 6 5 6 7 1' 5 4 3")),
  S('tannenbaum', 'O Christmas Tree', 'holiday', tune(HIGH, '5, 1 1 1 2 3 3 3 | 3 2 3 4 7, 2 1 | 5 5 3 6 5 5 4 4 | 4 2 5 4 4 3 3 | 5, 1 1 1 2 3 3 3 | 3 2 3 4 7, 2 1')),
  S('auld', 'Auld Lang Syne', 'holiday', tune(HIGH, '5, 1 1 1 3 2 1 2 | 3 1 1 3 5 6 | 6 5 3 3 1 2 1 2 | 3 1 6, 6, 5, 1')),

  // ---------------- classical ----------------
  S('ode', 'Ode to Joy (Beethoven)', 'classical', tune(LOW, '3 3 4 5 5 4 3 2 1 1 2 3 3 2 2 | 3 3 4 5 5 4 3 2 1 1 2 3 2 1 1')),
  S('brahms', "Brahms' Lullaby", 'classical', tune(LOW, "3 3 5 | 3 3 5 | 3 5 1' 7 6 6 5 | 2 3 4 2 2 3 4 | 2 4 7 6 5 7 1' | 1 1 1' 6 4 5 | 3 1 4 5 6 5 | 1 1 1' 6 4 5 | 3 1 4 3 2 1")),
  S('minuet', 'Minuet in G (Bach)', 'classical', tune(HIGH, "5 1 2 3 4 5 1 1 | 6 4 5 6 7 1' 1 1 | 4 5 4 3 2 3 4 3 2 1 | 7, 1 2 3 1 3 2")),
  S('canon', 'Canon (Pachelbel)', 'classical', tune(LOW, "3' 2' 1' 7 6 5 6 7 | 1' 7 6 5 4 3 4 2 | 1 3 5 4 3 1 3 2")),
  S('nachtmusik', 'Eine kleine Nachtmusik (Mozart)', 'classical', tune(HIGH, '1 5, 1 5, 1 5, 1 3 5 | 4 2 4 2 4 2 7, 2 5,')),
  S('sonata', 'Sonata in C (Mozart)', 'classical', tune(HIGH, "1 3 5 7, 1 2 1 | 6 5 1' 5 4 3 4 3")),
  S('spring', 'Spring (Vivaldi)', 'classical', tune(LOW, "1 3 3 3 2 1 5 | 5 4 3 3 3 2 1 5 | 5 4 3 4 5 4 3 | 1 3 3 3 2 1 5")),
  S('morning', 'Morning Mood (Grieg)', 'classical', tune(LOW, '5 3 2 1 2 3 | 5 3 2 1 2 3 2 3 | 5 3 5 6 3 6 5 3 2 1')),
  S('cancan', 'Can-Can (Offenbach)', 'classical', tune(LOW, "1 1 2 4 3 2 5 5 | 5 6 3 4 2 2 | 2 4 3 2 1 1' 7 6 5 4 3 2 1")),
  S('bridal', 'Bridal Chorus (Wagner)', 'classical', tune(HIGH, '5, 1 1 1 | 5, 2 7, 1 | 5, 1 4 4 3 2 1 7, 1 2')),
  S('goinghome', 'Going Home (Dvořák)', 'classical', tune(LOW, '3 5 5 | 3 2 1 2 3 5 3 2 | 3 5 5 | 3 2 1 2 3 2 1 1')),
  S('danube', 'The Blue Danube (Strauss)', 'classical', tune(LOW, "1 1 3 5 5 | 5' 5' 3' 3' | 1 1 3 5 5 | 6' 6' 4' 4'")),
  S('surprise', 'Surprise Symphony (Haydn)', 'classical', tune(HIGH, "1 1 3 3 5 5 3 | 4 4 2 2 7, 7, 5, | 1 1 3 3 5 5 3 | 1'")),
  S('fifth', "Beethoven's Fifth", 'classical', named('E5 E5 E5 C5 | D5 D5 D5 B4 | F5 F5 F5 E5 | C6 C6 C6 A5')),

  // ---------------- folk and world ----------------
  S('greensleeves', 'Greensleeves', 'world', named('A4 C5 D5 E5 F5 E5 D5 B4 G4 A4 B4 C5 A4 A4 G4 A4 B4 G4 E4 | A4 C5 D5 E5 F5 E5 D5 B4 G4 A4 B4 C5 B4 A4 G4 A4 A4')),
  S('scarborough', 'Scarborough Fair', 'world', named('D4 D4 A4 A4 E4 F4 E4 D4 | A4 C5 D5 C5 A4 B4 G4 A4 | D5 D5 D5 C5 A4 A4 G4 F4 E4 C4 | D4 A4 G4 F4 E4 D4 C4 D4')),
  S('grace', 'Amazing Grace', 'world', tune(HIGH, '5, 1 3 1 3 2 1 6, 5, | 5, 1 3 1 3 2 5 | 3 5 3 5 3 1 5, 6, 1 1 6, 5, | 5, 1 3 1 3 2 1')),
  S('kumbaya', 'Kumbaya', 'world', tune(LOW, '1 3 5 5 5 6 6 5 | 1 3 5 5 5 4 3 2 | 1 3 5 5 5 6 6 5 | 4 3 2 2 1')),
  S('susanna', 'Oh! Susanna', 'world', tune(LOW, '1 2 3 5 5 6 5 3 1 2 3 3 2 1 2 | 1 2 3 5 5 6 5 3 1 2 3 3 2 2 1 | 4 4 6 6 5 5 3 1 2 | 1 2 3 5 5 6 5 3 1 2 3 3 2 2 1')),
  S('clementine', 'Clementine', 'world', tune(HIGH, '1 1 1 5, | 3 3 3 1 | 1 3 5 5 4 3 2 | 2 3 4 4 3 2 3 1 | 1 3 2 5, 7, 2 1')),
  S('saints', 'When the Saints Go Marching In', 'world', tune(LOW, '1 3 4 5 | 1 3 4 5 | 1 3 4 5 3 1 3 2 | 3 3 2 1 1 3 5 5 4 | 3 4 5 3 1 2 1')),
  S('michael', 'Michael, Row the Boat Ashore', 'world', tune(LOW, '1 3 5 3 5 6 5 | 3 5 6 5 | 3 5 5 3 4 3 2 | 1 2 3 2 1')),
  S('camptown', 'Camptown Races', 'world', tune(LOW, '5 5 3 5 6 5 3 | 3 2 3 2 | 5 5 3 5 6 5 3 | 2 3 2 2 1')),
  S('sakura', 'Sakura (Japan)', 'world', named('A5 A5 B5 | A5 A5 B5 | A5 B5 C6 B5 | A5 B5 A5 F5 | E5 C5 E5 F5 | E5 E5 C5 B4 | A5 B5 C6 B5 | A5 B5 A5 F5')),
  S('cucaracha', 'La Cucaracha (Mexico)', 'world', tune(HIGH, '5, 5, 5, 1 3 | 5, 5, 5, 1 3 | 1 1 7, 7, 6, 6, 5, | 5, 5, 5, 7, 2 | 5, 5, 5, 7, 2 | 5 6 5 4 3 2 1')),
  S('jasmine', 'Jasmine Flower (China)', 'world', tune(LOW, "3 3 5 6 1' 1' 6 5 5 6 5 | 3 3 5 6 1' 1' 6 5 5 6 5 | 5 5 5 3 5 6 6 5 | 3 2 3 5 3 2 1 1 2 1")),
];

export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));

/** 1 to 3 stars: short, small-range songs are easiest. */
export function songLevel(s: Song): 1 | 2 | 3 {
  const span = Math.max(...s.notes) - Math.min(...s.notes);
  const score = s.notes.length + span * 1.5;
  return score < 40 ? 1 : score < 65 ? 2 : 3;
}

/** Keys on the on-screen piano: two octaves of white keys from middle C. */
export const WHITE_KEYS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
export const BLACK_KEYS = [61, 63, 66, 68, 70, 73, 75, 78, 80, 82];
