// Picture books for the library and short movies for the cinema. Every word is read aloud by the
// device's speech voice, so the text is written to sound good spoken.
//
// Cast keys: animals bunny (Pip), bear (Barnaby), fox (Fern), owl (Olive), turtle (Tully),
// puppy (Biscuit), kitty (Pepper), duck (Puddle), elephant (Peanut), mouse (Crumb), penguin (Pebble),
// dragon (Ember); kids zoe, sam, ruby, kai, nina, milo. Art lives in src/art/storyart.ts.

export interface CastMember {
  who: string;
  /** 0..1 across the picture. */
  x: number;
  pose?: 'stand' | 'wave' | 'held' | 'sit';
  expr?: 'normal' | 'happy' | 'surprised' | 'sleep' | 'yum' | 'sad' | 'mad';
  flip?: boolean;
  size?: number;
  /** Where the feet are, 0..1 down the picture (default about 0.87, the ground). */
  y?: number;
  /** Little extras: crown, party, beanie, scarf, glasses, goggles, helmet, medal, collar, cape, chef, cap, bow, flower, sticks, pondweed, carrot, stethoscope. */
  acc?: string[];
  /** A prop id held in the hand. */
  hold?: string;
  /** Kid outfits: swim, snow, rain, pjs, fancy. */
  outfit?: string;
  /** Recolors an animal's fur (for a grandma mouse, say). */
  tint?: string;
  /** A prop the character sits on, such as a sled (use with pose 'sit'). */
  ride?: string;
  /** In the water: only the top half shows, with ripples. */
  swim?: boolean;
}
export interface StoryProp {
  id: string;
  x: number;
  /** 0..1 down the picture; the prop's bottom sits here (default the ground). */
  y?: number;
  size?: number;
  color?: string;
  flip?: boolean;
  /** Draw behind the characters. */
  back?: boolean;
  /** Words for a sign. */
  text?: string;
}
export interface StoryPage {
  text: string;
  bg: string;
  cast: CastMember[];
  props?: StoryProp[];
  time?: 'day' | 'night';
}
export interface Story {
  id: string;
  title: string;
  kind: 'book' | 'movie';
  moral: string;
  /** tints: optional fur colors for the cover cast, by position (for a grandma fox, say). */
  cover: { bg: string; color: string; who: string[]; tints?: string[] };
  pages: StoryPage[];
}

const BOOKS: Story[] = [
  {
    id: 'pip-and-the-squashed-strawberry',
    title: 'Pip and the Squashed Strawberry',
    kind: 'book',
    moral: 'Telling the truth can feel scary, but it makes your heart feel light, and it helps your friends trust you.',
    cover: { bg: '#ffd6e0', color: '#d6336c', who: ['bunny', 'elephant'] },
    pages: [
      {
        text: "Pip the bunny loved visiting Peanut the elephant's garden. The strawberries there grew as big as tennis balls! The biggest one of all was going to the fair tomorrow.",
        bg: 'garden', cast: [{ who: 'elephant', x: 0.3, expr: 'happy' }, { who: 'bunny', x: 0.58, expr: 'happy' }], props: [{ id: 'strawberry', x: 0.8, size: 1.1 }],
      },
      {
        text: '"Please keep an eye on my prize strawberry," said Peanut. "I\'m going to fetch my wheelbarrow." Pip nodded so hard that his ears flapped.',
        bg: 'garden', cast: [{ who: 'elephant', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'bunny', x: 0.58, pose: 'held', expr: 'happy' }], props: [{ id: 'strawberry', x: 0.8, size: 1.1 }],
      },
      {
        text: 'Just then, a butterfly floated by. Pip hopped after it. One hop, two hops, three hops... squish!',
        bg: 'garden', cast: [{ who: 'bunny', x: 0.66, pose: 'held', expr: 'surprised' }], props: [{ id: 'squashed', x: 0.72 }, { id: 'butterfly', x: 0.36, y: 0.45 }],
      },
      {
        text: 'The prize strawberry was now a strawberry pancake. Pip\'s tummy felt wobbly. "Maybe I could say a bird did it," he whispered.',
        bg: 'garden', cast: [{ who: 'bunny', x: 0.45, expr: 'sad' }], props: [{ id: 'squashed', x: 0.7 }],
      },
      {
        text: 'A little bluebird hopped by, looking very innocent. A bird had not done it, and Pip knew it. A fib would sit in his tummy like a heavy, grumpy stone.',
        bg: 'garden', cast: [{ who: 'bunny', x: 0.42, pose: 'sit', expr: 'sad' }], props: [{ id: 'squashed', x: 0.66 }, { id: 'bird', x: 0.86 }],
      },
      {
        text: 'When Peanut came back, Pip took a big breath. "I squashed your strawberry," he said. "I\'m really sorry."',
        bg: 'garden', cast: [{ who: 'elephant', x: 0.28, expr: 'surprised' }, { who: 'bunny', x: 0.7, expr: 'sad' }], props: [{ id: 'squashed', x: 0.5 }],
      },
      {
        text: 'Peanut was quiet for a moment. Then she smiled. "Thank you for telling me the truth. And guess what squashed strawberries are perfect for? Jam!"',
        bg: 'kitchen', cast: [{ who: 'elephant', x: 0.45, pose: 'wave', expr: 'happy' }, { who: 'bunny', x: 0.7, expr: 'surprised' }], props: [{ id: 'basket', x: 0.18, y: 0.567 }],
      },
      {
        text: 'They stirred and bubbled the sweetest, stickiest jam in the whole valley. And at the fair, it won a shiny blue ribbon!',
        bg: 'kitchen', cast: [{ who: 'elephant', x: 0.45, pose: 'held', expr: 'happy', hold: 'jam' }, { who: 'bunny', x: 0.72, pose: 'held', expr: 'happy', hold: 'ribbon' }], props: [{ id: 'jam', x: 0.1, y: 0.567 }, { id: 'jam', x: 0.24, y: 0.567, color: '#c2185b' }],
      },
    ],
  },
  {
    id: 'barnaby-and-the-tiny-seed',
    title: 'Barnaby and the Tiny Seed',
    kind: 'book',
    moral: "Being patient helps good things grow. Some of the very best things just can't be rushed.",
    cover: { bg: '#fff1b8', color: '#c76b00', who: ['bear', 'owl'] },
    pages: [
      {
        text: 'One sunny morning, Barnaby the bear found a tiny seed. "What will it grow into?" he asked. "Plant it and see," said Olive the owl. "But you will need to be patient."',
        bg: 'meadow', cast: [{ who: 'bear', x: 0.36, expr: 'surprised', hold: 'seed' }, { who: 'owl', x: 0.66, expr: 'happy' }],
      },
      {
        text: 'Barnaby dug a little hole, dropped in the seed, and gave it a drink. Then he stared at the dirt. "Okay, grow now!" Nothing happened.',
        bg: 'garden', cast: [{ who: 'bear', x: 0.36, expr: 'normal' }], props: [{ id: 'mound', x: 0.6 }, { id: 'wateringcan', x: 0.76 }],
      },
      {
        text: 'He sang to it. He danced for it. He even tried tickling the soil. The dirt just sat there, being dirt.',
        bg: 'garden', cast: [{ who: 'bear', x: 0.4, pose: 'held', expr: 'happy' }], props: [{ id: 'mound', x: 0.66 }, { id: 'notes', x: 0.42, y: 0.25 }],
      },
      {
        text: 'Days went by. The rain went pitter-patter, and Barnaby watched from under his umbrella. "Are you growing yet, little seed?"',
        bg: 'rain', cast: [{ who: 'bear', x: 0.4, expr: 'normal', hold: 'umbrella' }], props: [{ id: 'mound', x: 0.66 }],
      },
      {
        text: "Then one morning, a tiny green sprout poked out, no bigger than a mouse's whisker. Barnaby gasped.",
        bg: 'garden', cast: [{ who: 'bear', x: 0.36, pose: 'held', expr: 'surprised' }], props: [{ id: 'sprout', x: 0.62 }],
      },
      {
        text: '"Let\'s pull it, to make it taller!" said Barnaby. "No pulling," laughed Olive. "Good things take time."',
        bg: 'garden', cast: [{ who: 'bear', x: 0.3, pose: 'wave', expr: 'happy' }, { who: 'owl', x: 0.74, expr: 'happy' }], props: [{ id: 'sprout', x: 0.52 }],
      },
      {
        text: 'All summer long, Barnaby watered and waited. The sprout grew, and grew, and grew.',
        bg: 'meadow', cast: [{ who: 'bear', x: 0.32, expr: 'happy', hold: 'wateringcan' }], props: [{ id: 'sunflower', x: 0.62, size: 0.7 }],
      },
      {
        text: 'It became a sunflower taller than Barnaby, with a face as bright as the sun. Its seeds fed every bird in the meadow. "It was worth the wait," Barnaby smiled.',
        bg: 'meadow', cast: [{ who: 'bear', x: 0.32, expr: 'happy' }, { who: 'owl', x: 0.82, expr: 'happy' }], props: [{ id: 'sunflower', x: 0.58, size: 1.25 }, { id: 'birds', x: 0.52, y: 0.14 }],
      },
    ],
  },
  {
    id: 'pepper-and-the-fish-kite',
    title: 'Pepper and the Fish Kite',
    kind: 'book',
    moral: "Sharing turns 'mine' into 'ours', and fun gets bigger when we share it.",
    cover: { bg: '#c9ecff', color: '#1f6fb2', who: ['kitty', 'puppy'] },
    pages: [
      {
        text: 'For her birthday, Pepper the kitty got a kite shaped like a fish. It had shiny scales and a long, wiggly tail. "It\'s the best kite in the whole world," she purred.',
        bg: 'bedroom', cast: [{ who: 'kitty', x: 0.36, pose: 'held', expr: 'happy' }], props: [{ id: 'kite', x: 0.6, y: 0.42, size: 0.7 }, { id: 'present', x: 0.62 }],
      },
      {
        text: 'At the windy hill, Biscuit the puppy wagged his tail. "Can I have a turn?" "No," said Pepper, hugging her kite. "It\'s mine."',
        bg: 'meadow', cast: [{ who: 'puppy', x: 0.3, pose: 'wave', expr: 'happy' }, { who: 'kitty', x: 0.64, expr: 'normal' }], props: [{ id: 'kite', x: 0.76, y: 0.66, size: 0.5 }],
      },
      {
        text: 'Pepper ran and ran with the kite. But it just bumped along the grass, like a sleepy fish.',
        bg: 'meadow', cast: [{ who: 'kitty', x: 0.66, pose: 'held', expr: 'surprised' }], props: [{ id: 'kite', x: 0.3, y: 0.9, size: 0.6 }],
      },
      {
        text: 'She tried again, faster this time. The kite flopped straight into a puddle. Splosh!',
        bg: 'meadow', cast: [{ who: 'kitty', x: 0.36, expr: 'sad' }], props: [{ id: 'puddle', x: 0.66 }, { id: 'kite', x: 0.66, y: 0.9, size: 0.55 }],
      },
      {
        text: '"Kites like teamwork," said Biscuit. "One friend holds the string, and the other throws the kite up into the wind."',
        bg: 'meadow', cast: [{ who: 'puppy', x: 0.34, pose: 'wave', expr: 'normal' }, { who: 'kitty', x: 0.66, expr: 'normal' }], props: [{ id: 'kite', x: 0.5, y: 0.92, size: 0.45 }],
      },
      {
        text: 'Pepper looked at her soggy fish. Then she held out the kite. "Would you like to be the thrower?" Biscuit\'s tail went wiggle, wiggle, wiggle.',
        bg: 'meadow', cast: [{ who: 'kitty', x: 0.38, pose: 'wave', expr: 'normal' }, { who: 'puppy', x: 0.66, pose: 'held', expr: 'happy' }], props: [{ id: 'kite', x: 0.52, y: 0.62, size: 0.45 }],
      },
      {
        text: 'Biscuit tossed, Pepper ran, and whoosh! The fish kite swam right up into the sky.',
        bg: 'meadow', cast: [{ who: 'kitty', x: 0.28, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.58, pose: 'held', expr: 'happy' }], props: [{ id: 'kite', x: 0.66, y: 0.2 }],
      },
      {
        text: "They took turns all afternoon, and soon the whole hill was laughing. Sharing made the kite fly higher, and Pepper's heart too.",
        bg: 'meadow', cast: [{ who: 'kitty', x: 0.22, expr: 'happy' }, { who: 'puppy', x: 0.42, expr: 'happy' }, { who: 'duck', x: 0.62, pose: 'held', expr: 'happy' }, { who: 'bunny', x: 0.82, pose: 'wave', expr: 'happy' }], props: [{ id: 'kite', x: 0.46, y: 0.18 }],
      },
    ],
  },
  {
    id: 'tully-and-the-tall-ladder',
    title: 'Tully and the Tall Ladder',
    kind: 'book',
    moral: 'Keep trying, one small step at a time. Practice makes hard things possible.',
    cover: { bg: '#d8f5c9', color: '#2f7d32', who: ['turtle', 'fox'] },
    pages: [
      {
        text: 'High up in the old oak tree, there was a treehouse. Everyone who climbed up could see all the way to the sea.',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.32, expr: 'happy' }, { who: 'fox', x: 0.72, y: 0.417, size: 0.7, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'Tully the turtle looked up at the ladder. It had twenty rungs, and his legs were very short. "I\'ll never get up there," he sighed.',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.5, expr: 'sad' }],
      },
      {
        text: 'He tried anyway. One rung, two rungs, wibble, wobble... plop! He landed softly on his shell in the moss.',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.52, pose: 'sit', expr: 'surprised' }], props: [{ id: 'stars', x: 0.52, y: 0.5, size: 0.5 }],
      },
      {
        text: '"Try one more rung each day," called Fern the fox from the treehouse. "Little steps still take you somewhere."',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.42, expr: 'normal' }, { who: 'fox', x: 0.72, y: 0.417, size: 0.7, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'So every day, Tully practiced. Three rungs on Monday. Five rungs on Tuesday. Eight rungs on Wednesday!',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.665, y: 0.7, size: 0.8, pose: 'held', expr: 'happy' }],
      },
      {
        text: 'Some days his legs ached, and he wanted to give up. But he always whispered to himself, "Just one more rung."',
        bg: 'rain', cast: [{ who: 'turtle', x: 0.5, expr: 'normal', hold: 'umbrella' }],
      },
      {
        text: 'Then one golden evening, Tully reached rung number twenty. He poked his head through the door, and... "Surprise!"',
        bg: 'treehouse', cast: [{ who: 'turtle', x: 0.6, y: 0.417, size: 0.62, expr: 'surprised' }, { who: 'fox', x: 0.76, y: 0.417, size: 0.62, pose: 'held', expr: 'happy' }], props: [{ id: 'balloons', x: 0.9, y: 0.417, size: 0.6 }],
      },
      {
        text: 'His friends had been waiting with a cake! From the top, the whole world looked like a picture book. "It was worth every wobble," said Tully.',
        bg: 'treetop', cast: [{ who: 'fox', x: 0.2, expr: 'happy' }, { who: 'turtle', x: 0.42, pose: 'held', expr: 'happy', acc: ['party'] }, { who: 'bunny', x: 0.82, pose: 'wave', expr: 'happy' }], props: [{ id: 'table', x: 0.62 }, { id: 'cake', x: 0.62, y: 0.66, size: 0.6 }],
      },
    ],
  },
  {
    id: 'olive-says-sorry',
    title: 'Olive Says Sorry',
    kind: 'book',
    moral: 'A real sorry means saying what you did wrong, and then trying to make it right.',
    cover: { bg: '#e3d9ff', color: '#5b3fb5', who: ['owl', 'mouse'] },
    pages: [
      {
        text: 'Olive the owl slept all day and flew all night. One sunny afternoon, she was dreaming about blueberry muffins.',
        bg: 'forest', cast: [{ who: 'owl', x: 0.38, pose: 'sit', expr: 'sleep' }],
      },
      {
        text: "Boom! Bang! Ba-da-boom! Crumb the mouse was practicing on his brand-new drum, right under Olive's tree.",
        bg: 'forest', cast: [{ who: 'owl', x: 0.3, pose: 'sit', expr: 'surprised' }, { who: 'mouse', x: 0.62, size: 1.2, pose: 'held', expr: 'happy' }], props: [{ id: 'drum', x: 0.74 }, { id: 'notes', x: 0.66, y: 0.42 }],
      },
      {
        text: 'Olive woke up with her feathers sticking out every which way. "Stop that racket!" she hooted. "Nobody wants to hear your silly drum!"',
        bg: 'forest', cast: [{ who: 'owl', x: 0.34, pose: 'held', expr: 'surprised' }, { who: 'mouse', x: 0.66, size: 1.2, expr: 'surprised' }], props: [{ id: 'drum', x: 0.78 }],
      },
      {
        text: "Crumb's whiskers drooped. He tucked his drum under his arm and tiptoed away without a sound.",
        bg: 'forest', cast: [{ who: 'owl', x: 0.24, expr: 'normal' }, { who: 'mouse', x: 0.66, size: 1.2, expr: 'sad', hold: 'drum' }],
      },
      {
        text: 'That night, Olive could not enjoy her flying. She kept thinking about Crumb\'s sad little face. "I was tired," she said, "but I was unkind, too."',
        bg: 'night', cast: [{ who: 'owl', x: 0.45, expr: 'sad' }],
      },
      {
        text: 'In the morning, Olive flew to Crumb\'s house with a basket of blueberry muffins. "I\'m sorry I called your drum silly," she said. "I was grumpy, and that wasn\'t fair to you."',
        bg: 'meadow', cast: [{ who: 'owl', x: 0.36, expr: 'normal', hold: 'muffins' }, { who: 'mouse', x: 0.66, size: 1.2, expr: 'surprised' }],
      },
      {
        text: 'Crumb sniffled, and then he smiled. "Thank you," he said. "And I\'m sorry I drummed so close to your tree."',
        bg: 'meadow', cast: [{ who: 'owl', x: 0.36, expr: 'happy' }, { who: 'mouse', x: 0.64, size: 1.2, pose: 'held', expr: 'happy' }], props: [{ id: 'muffins', x: 0.5 }],
      },
      {
        text: "Now Crumb drums in the sunny meadow, far from Olive's tree. And every evening when Olive wakes up, he plays her a gentle wake-up song. Tap, tap, tappity-tap.",
        bg: 'sunset', cast: [{ who: 'mouse', x: 0.42, size: 1.2, expr: 'happy' }, { who: 'owl', x: 0.68, expr: 'happy' }], props: [{ id: 'drum', x: 0.28 }, { id: 'notes', x: 0.36, y: 0.42 }],
      },
    ],
  },
  {
    id: 'pebble-joins-the-class',
    title: 'Pebble Joins the Class',
    kind: 'book',
    moral: 'When we include others, we get to discover how special they are.',
    cover: { bg: '#d6f0ff', color: '#215a9e', who: ['nina', 'penguin'] },
    pages: [
      {
        text: 'On Monday, a new student waddled into class. His name was Pebble, and he had come all the way from the frozen South.',
        bg: 'classroom', cast: [{ who: 'nina', x: 0.22, expr: 'happy' }, { who: 'penguin', x: 0.5, pose: 'wave', expr: 'normal' }, { who: 'owl', x: 0.76, expr: 'happy', acc: ['glasses'] }],
      },
      {
        text: 'At recess, everyone played tag. Pebble tried to join in, but his little legs went waddle, waddle, wobble. "You\'re too slow!" someone giggled.',
        bg: 'meadow', cast: [{ who: 'kai', x: 0.2, pose: 'held', expr: 'happy' }, { who: 'sam', x: 0.42, pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.74, expr: 'surprised' }],
      },
      {
        text: 'Pebble sat by himself and looked down at his flippers. He felt as small as a snowflake.',
        bg: 'meadow', cast: [{ who: 'penguin', x: 0.55, pose: 'sit', expr: 'sad' }],
      },
      {
        text: 'Nina noticed. She remembered how it felt to be new. So she sat down next to him and asked, "Would you like to play with me?"',
        bg: 'meadow', cast: [{ who: 'nina', x: 0.36, pose: 'sit', expr: 'normal' }, { who: 'penguin', x: 0.62, pose: 'sit', expr: 'surprised' }],
      },
      {
        text: '"I\'m not very good at running," said Pebble. "That\'s okay," said Nina. "What are you good at?" Pebble\'s eyes twinkled. "Sliding!"',
        bg: 'meadow', cast: [{ who: 'nina', x: 0.36, pose: 'sit', expr: 'happy' }, { who: 'penguin', x: 0.62, pose: 'sit', expr: 'happy' }],
      },
      {
        text: 'When the first snow fell, Pebble showed everyone how to slide down the hill on his tummy. Zoom! He was as fast as a rocket.',
        bg: 'snow', cast: [{ who: 'nina', x: 0.2, outfit: 'snow', expr: 'surprised' }, { who: 'penguin', x: 0.5, pose: 'held', expr: 'happy', acc: ['scarf'] }, { who: 'kai', x: 0.8, outfit: 'snow', pose: 'held', expr: 'happy' }], props: [{ id: 'wind', x: 0.36, y: 0.7, size: 0.6 }],
      },
      {
        text: 'Soon the whole class was sliding, spinning, and tumbling into one giant, snowy, giggly pile.',
        bg: 'snow', cast: [{ who: 'nina', x: 0.24, outfit: 'snow', pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.46, pose: 'held', expr: 'happy', acc: ['scarf'] }, { who: 'sam', x: 0.64, outfit: 'snow', pose: 'held', expr: 'happy' }, { who: 'kai', x: 0.84, outfit: 'snow', pose: 'wave', expr: 'happy' }], props: [{ id: 'drift', x: 0.5, size: 1.4 }],
      },
      {
        text: '"Thank you for asking me to play," Pebble told Nina. "And thank you for teaching us to slide," Nina laughed. Everyone has something special to share.',
        bg: 'classroom', cast: [{ who: 'nina', x: 0.36, expr: 'happy' }, { who: 'penguin', x: 0.6, pose: 'held', expr: 'happy' }], props: [{ id: 'hearts', x: 0.48, y: 0.3, size: 0.8 }],
      },
    ],
  },
  {
    id: 'the-chewed-up-library-book',
    title: 'The Chewed-Up Library Book',
    kind: 'book',
    moral: 'Taking responsibility means owning up to your mistakes and helping to fix them.',
    cover: { bg: '#ffe7c7', color: '#b5541a', who: ['milo', 'puppy'] },
    pages: [
      {
        text: 'Milo borrowed a library book all about dinosaurs. "Please take good care of it," said Mrs. Trumble, the elephant librarian.',
        bg: 'library', cast: [{ who: 'milo', x: 0.36, expr: 'happy', hold: 'book' }, { who: 'elephant', x: 0.66, expr: 'happy', acc: ['glasses'] }],
      },
      {
        text: 'Milo read it every single night. He roared like a T. rex and stomped like a Stegosaurus. Then one morning, he left the book on the floor.',
        bg: 'bedroom', cast: [{ who: 'milo', x: 0.4, pose: 'held', expr: 'happy' }], props: [{ id: 'book', x: 0.62, size: 0.8, color: '#7cc89f' }],
      },
      {
        text: 'Biscuit the puppy found it. Chomp, chomp, slobber! The T. rex lost its tail, and the book lost its cover.',
        bg: 'bedroom', cast: [{ who: 'puppy', x: 0.5, expr: 'happy' }], props: [{ id: 'chewedbook', x: 0.66, size: 0.8 }],
      },
      {
        text: 'Milo gasped. He could hide it under the bed. He could say that Biscuit did it. And Biscuit did do it... but Milo had left it on the floor.',
        bg: 'bedroom', cast: [{ who: 'milo', x: 0.32, expr: 'surprised' }, { who: 'puppy', x: 0.66, pose: 'sit', expr: 'normal' }], props: [{ id: 'chewedbook', x: 0.5, size: 0.8 }],
      },
      {
        text: '"Taking care of the book was my job," Milo decided. "So fixing this is my job, too."',
        bg: 'bedroom', cast: [{ who: 'milo', x: 0.45, expr: 'normal', hold: 'chewedbook' }, { who: 'puppy', x: 0.68, pose: 'sit', expr: 'normal' }],
      },
      {
        text: 'Milo carried the soggy book back to the library. "I didn\'t put it away, and my puppy chewed it," he said. "I\'m sorry. I want to make it right."',
        bg: 'library', cast: [{ who: 'milo', x: 0.36, expr: 'sad', hold: 'chewedbook' }, { who: 'elephant', x: 0.66, expr: 'surprised', acc: ['glasses'] }],
      },
      {
        text: '"Thank you for telling me," said Mrs. Trumble, and her trunk curled into a smile. "Would you like to help me fix books on Saturdays?"',
        bg: 'library', cast: [{ who: 'milo', x: 0.36, expr: 'surprised' }, { who: 'elephant', x: 0.66, pose: 'wave', expr: 'happy', acc: ['glasses'] }],
      },
      {
        text: "So Milo became a Book Doctor. He taped torn pages, glued loose covers, and even fixed the T. rex's tail. And Biscuit got a chew toy of his very own.",
        bg: 'library', cast: [{ who: 'milo', x: 0.38, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.6, expr: 'happy', hold: 'bone' }, { who: 'elephant', x: 0.82, expr: 'happy', acc: ['glasses'] }], props: [{ id: 'books', x: 0.16 }],
      },
    ],
  },
  {
    id: 'fern-is-just-fern',
    title: 'Fern Is Just Fern',
    kind: 'book',
    moral: "You don't have to be like anyone else. Being yourself is your very own superpower.",
    cover: { bg: '#ffe0cc', color: '#c4501c', who: ['fox'] },
    pages: [
      {
        text: 'Fern the fox wished she were someone else. Olive could fly, Pip had long floppy ears, and Puddle the duck could swim.',
        bg: 'forest', cast: [{ who: 'owl', x: 0.2, y: 0.6, pose: 'held', expr: 'happy' }, { who: 'fox', x: 0.5, expr: 'sad' }, { who: 'bunny', x: 0.8, expr: 'happy' }],
      },
      {
        text: 'So Fern tied leaves to her arms and flapped as hard as she could. She did not fly. She mostly fell into a bush.',
        bg: 'forest', cast: [{ who: 'fox', x: 0.5, pose: 'held', expr: 'surprised' }], props: [{ id: 'leaves', x: 0.5, y: 0.45, size: 1.6 }],
      },
      {
        text: 'Next, she stuck two long sticks on her head for bunny ears. They wobbled, and one poked her right on the nose. "Ouch," she giggled.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.42, expr: 'happy', acc: ['sticks'] }, { who: 'bunny', x: 0.72, expr: 'surprised' }],
      },
      {
        text: 'Then she jumped into the pond, just like Puddle. She came out soggy, sneezing, and wearing a hat made of pondweed.',
        bg: 'pond', cast: [{ who: 'fox', x: 0.3, expr: 'surprised', acc: ['pondweed'] }, { who: 'duck', x: 0.62, y: 0.75, swim: true, expr: 'happy' }],
      },
      {
        text: 'That winter, the friends had a snowy picnic. But the wind was so chilly that everyone\'s paws turned into ice cubes. "Brrr!"',
        bg: 'snow', cast: [{ who: 'bunny', x: 0.2, expr: 'sad', acc: ['scarf'] }, { who: 'duck', x: 0.4, expr: 'sad' }, { who: 'owl', x: 0.6, expr: 'sad' }, { who: 'fox', x: 0.82, expr: 'normal' }], props: [{ id: 'wind', x: 0.5, y: 0.3, size: 0.8 }],
      },
      {
        text: 'Fern had an idea. She curled her big, fluffy tail around all her friends, like a warm and cozy blanket.',
        bg: 'snow', cast: [{ who: 'bunny', x: 0.3, pose: 'sit', expr: 'happy' }, { who: 'fox', x: 0.5, pose: 'sit', expr: 'happy' }, { who: 'duck', x: 0.7, pose: 'sit', expr: 'happy' }], props: [{ id: 'foxtail', x: 0.52, y: 1.0, size: 1.05 }],
      },
      {
        text: '"Your tail is the coziest thing in the whole forest," said Pip. Then Fern sniffed the air. "And my nose smells hot cocoa, that way!"',
        bg: 'snow', cast: [{ who: 'bunny', x: 0.26, expr: 'happy' }, { who: 'fox', x: 0.5, pose: 'wave', expr: 'happy' }, { who: 'owl', x: 0.74, expr: 'surprised' }],
      },
      {
        text: "Fern's clever nose led them straight to Barnaby's kitchen, where the cocoa was warm and chocolatey. From then on, Fern never wished to be anyone else. Being Fern was just right.",
        bg: 'kitchen', cast: [{ who: 'bear', x: 0.22, expr: 'happy', hold: 'cocoa' }, { who: 'fox', x: 0.44, pose: 'held', expr: 'happy' }, { who: 'bunny', x: 0.64, expr: 'happy', hold: 'cocoa' }, { who: 'duck', x: 0.82, expr: 'happy' }],
      },
    ],
  },
  {
    id: 'kais-rainbow-plate',
    title: "Kai's Rainbow Plate",
    kind: 'book',
    moral: "Colorful food, water, and a good night's sleep give your body the energy to play.",
    cover: { bg: '#fff0c2', color: '#d14b1f', who: ['kai', 'bear'] },
    pages: [
      {
        text: 'Kai loved cookies. Cookies for breakfast, cookies for lunch, and if he could, cookies in his sleep.',
        bg: 'kitchen', cast: [{ who: 'kai', x: 0.5, expr: 'yum', hold: 'cookie' }], props: [{ id: 'cookiejar', x: 0.2, y: 0.567 }],
      },
      {
        text: 'But at the big soccer game, Kai\'s legs felt like jelly. His tummy grumbled like a grumpy bear. Grrrumble!',
        bg: 'meadow', cast: [{ who: 'kai', x: 0.42, expr: 'sad' }], props: [{ id: 'goal', x: 0.82 }, { id: 'soccer', x: 0.6 }],
      },
      {
        text: 'Coach Barnaby, who really was a bear, chuckled. "Champions eat a rainbow," he said with a wink.',
        bg: 'meadow', cast: [{ who: 'bear', x: 0.34, pose: 'wave', expr: 'happy', acc: ['cap'] }, { who: 'kai', x: 0.66, expr: 'surprised' }], props: [{ id: 'goal', x: 0.9, size: 0.8 }],
      },
      {
        text: 'Kai thought that sounded silly, but he tried it. Red strawberries, orange carrots, yellow corn, green peas, and purple grapes. Crunch, munch!',
        bg: 'kitchen', cast: [{ who: 'kai', x: 0.42, expr: 'happy' }], props: [{ id: 'rainbowplate', x: 0.66 }],
      },
      {
        text: 'He drank lots of water, too, and went to bed on time, after brushing his teeth until they sparkled.',
        bg: 'bedroom', time: 'night', cast: [{ who: 'kai', x: 0.44, outfit: 'pjs', expr: 'happy', hold: 'toothbrush' }], props: [{ id: 'sparkles', x: 0.5, y: 0.3, size: 0.6 }],
      },
      {
        text: 'At the next game, Kai zoomed down the field like a rocket. He kicked the ball, and... goal!',
        bg: 'meadow', cast: [{ who: 'kai', x: 0.4, pose: 'held', expr: 'happy' }], props: [{ id: 'goal', x: 0.82 }, { id: 'soccer', x: 0.76, y: 0.62 }],
      },
      {
        text: '"Wow!" cheered Coach Barnaby. Kai grinned from ear to ear. "I guess my tummy likes rainbows!"',
        bg: 'meadow', cast: [{ who: 'bear', x: 0.32, pose: 'held', expr: 'happy', acc: ['cap'] }, { who: 'kai', x: 0.62, pose: 'wave', expr: 'happy' }], props: [{ id: 'confetti', x: 0.5, y: 0.3, size: 0.8 }],
      },
      {
        text: 'Kai still loves cookies. Now he has one after dinner as a treat, and it tastes even better.',
        bg: 'kitchen', cast: [{ who: 'kai', x: 0.46, expr: 'yum', hold: 'cookie' }], props: [{ id: 'rainbowplate', x: 0.72 }, { id: 'cookiejar', x: 0.2, y: 0.567 }],
      },
    ],
  },
  {
    id: 'crumbs-thank-you-day',
    title: "Crumb's Thank-You Day",
    kind: 'book',
    moral: 'When we notice the good things and say thank you, our hearts feel full.',
    cover: { bg: '#ffe3ec', color: '#c2185b', who: ['mouse'] },
    pages: [
      {
        text: 'Crumb the mouse woke up on the grumpy side of the bed. "Nothing good ever happens to me," he grumbled.',
        bg: 'bedroom', cast: [{ who: 'mouse', x: 0.42, size: 1.3, expr: 'sad' }],
      },
      {
        text: 'Grandma Mouse gave him a piece of paper and a pencil. "Let\'s play a game," she said. "Every time something nice happens today, draw a star."',
        bg: 'kitchen', cast: [{ who: 'mouse', x: 0.42, size: 1.3, expr: 'normal', hold: 'starpaper' }, { who: 'mouse', x: 0.7, size: 1.45, tint: '#ece6ee', expr: 'happy', acc: ['glasses'] }],
      },
      {
        text: 'At breakfast, Grandma had made his favorite cheesy toast. Crumb drew one little star.',
        bg: 'kitchen', cast: [{ who: 'mouse', x: 0.44, size: 1.3, expr: 'yum', hold: 'starpaper' }, { who: 'mouse', x: 0.84, size: 1.45, tint: '#ece6ee', expr: 'happy', acc: ['glasses'] }], props: [{ id: 'toast', x: 0.64 }],
      },
      {
        text: 'On the way to school, Puddle the duck held the door open for him. Another star!',
        bg: 'town', cast: [{ who: 'mouse', x: 0.36, size: 1.3, expr: 'happy', hold: 'starpaper' }, { who: 'duck', x: 0.62, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'At school, Barnaby shared his crayons, and Teacher Owl helped him with a tricky sum. Star, star!',
        bg: 'classroom', cast: [{ who: 'bear', x: 0.26, expr: 'happy' }, { who: 'mouse', x: 0.5, size: 1.3, pose: 'held', expr: 'happy' }, { who: 'owl', x: 0.74, expr: 'happy', acc: ['glasses'] }],
      },
      {
        text: 'Then it rained on the way home, and Pebble shared his big umbrella. Crumb drew three stars, just to be sure.',
        bg: 'rain', cast: [{ who: 'mouse', x: 0.4, size: 1.3, expr: 'happy' }, { who: 'penguin', x: 0.56, expr: 'happy', hold: 'umbrella' }],
      },
      {
        text: 'By bedtime, Crumb\'s paper was covered in stars, like the night sky. "I just never noticed the good things before," he whispered.',
        bg: 'bedroom', time: 'night', cast: [{ who: 'mouse', x: 0.44, size: 1.3, pose: 'sit', expr: 'happy', hold: 'starpaper' }],
      },
      {
        text: 'The next day, Crumb made a thank-you card for every single star. And guess what? Saying thank you made him the happiest mouse in town.',
        bg: 'town', cast: [{ who: 'duck', x: 0.24, expr: 'happy', hold: 'card' }, { who: 'mouse', x: 0.5, size: 1.3, pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.76, expr: 'happy', hold: 'card' }], props: [{ id: 'hearts', x: 0.5, y: 0.3 }],
      },
    ],
  },
  {
    id: 'the-sandcastle-team',
    title: 'The Sandcastle Team',
    kind: 'book',
    moral: "When we work together, everyone's ideas add up to something bigger.",
    cover: { bg: '#ffeeb0', color: '#d9822b', who: ['zoe', 'sam', 'ruby'] },
    pages: [
      {
        text: 'At the beach, Zoe, Sam, and Ruby each wanted to build the best sandcastle ever.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.24, outfit: 'swim', pose: 'wave', expr: 'happy' }, { who: 'sam', x: 0.5, outfit: 'swim', expr: 'happy' }, { who: 'ruby', x: 0.76, outfit: 'swim', pose: 'held', expr: 'happy' }], props: [{ id: 'bucket', x: 0.62 }],
      },
      {
        text: 'Zoe built tall towers. Sam dug a deep moat. Ruby decorated hers with shiny shells. But each castle was small, and a little bit wobbly.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.14, outfit: 'swim', expr: 'happy' }, { who: 'sam', x: 0.44, outfit: 'swim', expr: 'happy' }, { who: 'ruby', x: 0.74, outfit: 'swim', expr: 'happy' }], props: [{ id: 'smallcastle', x: 0.27, y: 0.92 }, { id: 'smallcastle', x: 0.57, y: 0.92, color: '#7cc8ff' }, { id: 'smallcastle', x: 0.88, y: 0.92, color: '#ffd36b' }],
      },
      {
        text: "Then a wave rolled in. Swoosh! It gobbled up Zoe's towers, filled Sam's moat, and washed away Ruby's shells.",
        bg: 'beach', cast: [{ who: 'zoe', x: 0.2, outfit: 'swim', pose: 'held', expr: 'surprised' }, { who: 'sam', x: 0.5, outfit: 'swim', pose: 'held', expr: 'surprised' }, { who: 'ruby', x: 0.8, outfit: 'swim', pose: 'held', expr: 'surprised' }], props: [{ id: 'splash', x: 0.5, y: 1.02 }],
      },
      {
        text: 'Everyone frowned at the soggy sand. Then Tully the turtle poked his head out of the water. "What if you built one castle, together?"',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.16, outfit: 'swim', expr: 'sad' }, { who: 'sam', x: 0.38, outfit: 'swim', expr: 'sad' }, { who: 'ruby', x: 0.6, outfit: 'swim', expr: 'sad' }, { who: 'turtle', x: 0.84, y: 0.69, size: 0.7, swim: true, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'So Zoe built the towers, Sam dug a moat to catch the waves, and Ruby made it sparkle with shells.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.14, outfit: 'swim', expr: 'happy' }, { who: 'ruby', x: 0.34, outfit: 'swim', expr: 'happy' }, { who: 'sam', x: 0.86, outfit: 'swim', pose: 'wave', expr: 'happy' }], props: [{ id: 'sandcastle', x: 0.6, y: 0.92, size: 0.8 }, { id: 'shells', x: 0.42, y: 0.97 }],
      },
      {
        text: 'When the next wave came, the moat caught the water. Swish! The castle stood strong and tall.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.14, outfit: 'swim', pose: 'held', expr: 'surprised' }, { who: 'ruby', x: 0.3, outfit: 'swim', pose: 'held', expr: 'happy' }, { who: 'sam', x: 0.86, outfit: 'swim', pose: 'held', expr: 'happy' }], props: [{ id: 'sandcastle', x: 0.58, y: 0.92 }],
      },
      {
        text: 'It was the grandest castle the beach had ever seen, with plenty of room for a turtle king. "Hooray for King Tully!" they cheered.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.12, outfit: 'swim', pose: 'wave', expr: 'happy' }, { who: 'ruby', x: 0.28, outfit: 'swim', pose: 'held', expr: 'happy' }, { who: 'turtle', x: 0.58, y: 0.55, size: 0.55, pose: 'held', expr: 'happy', acc: ['crown'] }, { who: 'sam', x: 0.88, outfit: 'swim', pose: 'held', expr: 'happy' }], props: [{ id: 'sandcastle', x: 0.58, y: 0.92 }, { id: 'confetti', x: 0.5, y: 0.25, size: 0.8 }],
      },
    ],
  },
  {
    id: 'puddles-pond',
    title: "Puddle's Pond",
    kind: 'book',
    moral: 'Nature takes care of us, so we take care of nature. Even small hands can make a big difference.',
    cover: { bg: '#c8f0dc', color: '#1e7a55', who: ['sam', 'duck', 'ruby'] },
    pages: [
      {
        text: 'Puddle the duck lived in a little pond with lily pads, dragonflies, and frogs who sang every evening. Ribbit, ribbit!',
        bg: 'pond', cast: [{ who: 'duck', x: 0.5, y: 0.74, swim: true, expr: 'happy' }], props: [{ id: 'frog', x: 0.25, y: 0.75 }, { id: 'frog', x: 0.78, y: 0.77 }],
      },
      {
        text: 'But one spring morning, the pond was full of litter. There were bottles, wrappers, and one very confused sock.',
        bg: 'pond', cast: [{ who: 'duck', x: 0.62, expr: 'surprised' }], props: [{ id: 'litter', x: 0.35, y: 0.75, size: 1.4 }, { id: 'litter', x: 0.6, y: 0.7, flip: true, size: 1.4 }, { id: 'sock', x: 0.82, y: 0.74, size: 0.7 }],
      },
      {
        text: 'The frogs stopped singing. The fish hid under the lily pads. Puddle sat on the bank, and a tear rolled down her beak.',
        bg: 'pond', cast: [{ who: 'duck', x: 0.5, pose: 'sit', expr: 'sad' }], props: [{ id: 'litter', x: 0.3, y: 0.74, size: 1.4 }, { id: 'litter', x: 0.72, y: 0.72, flip: true, size: 1.4 }],
      },
      {
        text: 'Sam and Ruby came by with gloves and big bags. "Don\'t worry, Puddle," said Ruby. "We can help!"',
        bg: 'pond', cast: [{ who: 'sam', x: 0.22, pose: 'wave', expr: 'happy' }, { who: 'ruby', x: 0.44, expr: 'happy', hold: 'bag' }, { who: 'duck', x: 0.74, expr: 'surprised' }], props: [{ id: 'litter', x: 0.62, y: 0.73, size: 1.4 }],
      },
      {
        text: 'They picked up bottles and fished out wrappers. Sam even rescued the sock. "Not mine!" he giggled.',
        bg: 'pond', cast: [{ who: 'sam', x: 0.3, pose: 'held', expr: 'happy', hold: 'sock' }, { who: 'ruby', x: 0.58, expr: 'happy', hold: 'bag' }, { who: 'duck', x: 0.82, pose: 'held', expr: 'happy' }], props: [{ id: 'litter', x: 0.45, y: 0.73, size: 1.4 }],
      },
      {
        text: 'They sorted the bottles into the recycling bin, and planted bright flowers all around the pond.',
        bg: 'pond', cast: [{ who: 'sam', x: 0.24, expr: 'happy' }, { who: 'ruby', x: 0.52, pose: 'sit', expr: 'happy' }], props: [{ id: 'bin', x: 0.8 }, { id: 'flowers', x: 0.38, y: 0.95 }, { id: 'flowers', x: 0.66, y: 0.97, color: '#ff9a6b' }],
      },
      {
        text: 'A week later, the water sparkled. The frogs sang again, and Puddle did a happy, splashy dance.',
        bg: 'pond', cast: [{ who: 'duck', x: 0.5, y: 0.74, swim: true, pose: 'held', expr: 'happy' }], props: [{ id: 'frog', x: 0.24, y: 0.75 }, { id: 'frog', x: 0.78, y: 0.77 }, { id: 'sparkles', x: 0.5, y: 0.6 }, { id: 'notes', x: 0.3, y: 0.5 }],
      },
      {
        text: 'Ruby painted a sign that said, "Please keep our pond clean." And everybody did.',
        bg: 'pond', cast: [{ who: 'sam', x: 0.2, expr: 'happy' }, { who: 'ruby', x: 0.74, pose: 'wave', expr: 'happy' }, { who: 'duck', x: 0.9, expr: 'happy' }], props: [{ id: 'sign', x: 0.47, y: 0.93, text: 'Please keep our pond clean' }, { id: 'flowers', x: 0.36, y: 0.98 }],
      },
    ],
  },
  {
    id: 'nina-dips-her-toes',
    title: 'Nina Dips Her Toes',
    kind: 'book',
    moral: "Being brave doesn't mean you're never scared. It means trying anyway, one little step at a time.",
    cover: { bg: '#c4ecf7', color: '#126b8a', who: ['nina', 'turtle'] },
    pages: [
      {
        text: 'Nina loved the beach. She loved sandy toes and seashells. But she did not love putting her face in the water.',
        bg: 'beach', cast: [{ who: 'nina', x: 0.4, outfit: 'swim', expr: 'happy' }], props: [{ id: 'shells', x: 0.66, y: 0.95 }],
      },
      {
        text: 'Her friends splashed and swam and played. Nina stayed on her towel, hugging her knees.',
        bg: 'beach', cast: [{ who: 'zoe', x: 0.62, y: 0.6, size: 0.75, outfit: 'swim', swim: true, pose: 'held', expr: 'happy' }, { who: 'kai', x: 0.82, y: 0.62, size: 0.75, outfit: 'swim', swim: true, pose: 'wave', expr: 'happy' }, { who: 'nina', x: 0.3, outfit: 'swim', pose: 'sit', expr: 'sad' }], props: [{ id: 'towel', x: 0.3, y: 0.92 }],
      },
      {
        text: '"Are you scared?" asked Tully the turtle, crawling up beside her. Nina nodded. "I was scared my first time, too," said Tully. "Want to try just a tiny bit?"',
        bg: 'beach', cast: [{ who: 'nina', x: 0.34, outfit: 'swim', pose: 'sit', expr: 'normal' }, { who: 'turtle', x: 0.62, expr: 'happy' }], props: [{ id: 'towel', x: 0.34, y: 0.92 }],
      },
      {
        text: 'First, Nina dipped one toe. Brrr! Then two feet. Then she sat down in the shallow water. It felt like a warm, wiggly bath.',
        bg: 'beach', cast: [{ who: 'nina', x: 0.42, y: 0.7, outfit: 'swim', swim: true, expr: 'surprised' }, { who: 'turtle', x: 0.68, y: 0.71, size: 0.8, swim: true, expr: 'happy' }],
      },
      {
        text: '"Now blow bubbles," said Tully. Nina put her mouth in the water and blew. Blub, blub, blub! She giggled bubbles everywhere.',
        bg: 'beach', cast: [{ who: 'nina', x: 0.42, y: 0.7, outfit: 'swim', swim: true, expr: 'happy' }, { who: 'turtle', x: 0.7, y: 0.71, size: 0.8, swim: true, expr: 'happy' }], props: [{ id: 'bubbles', x: 0.5, y: 0.6 }],
      },
      {
        text: 'Her heart went thump, thump. She took a big breath, closed her eyes, and dipped her whole face in.',
        bg: 'beach', cast: [{ who: 'nina', x: 0.46, y: 0.7, outfit: 'swim', swim: true, expr: 'sleep', acc: ['goggles'] }, { who: 'turtle', x: 0.72, y: 0.71, size: 0.8, swim: true, expr: 'normal' }],
      },
      {
        text: 'When she opened her eyes, she saw a whole new world. Stripy fish, wiggly seaweed, and a little crab waving hello!',
        bg: 'ocean', cast: [{ who: 'nina', x: 0.38, outfit: 'swim', pose: 'held', expr: 'happy', acc: ['goggles'] }, { who: 'turtle', x: 0.64, y: 0.75, expr: 'happy' }], props: [{ id: 'crab', x: 0.84 }, { id: 'fish', x: 0.18, y: 0.3, color: '#ff9a6b' }, { id: 'fish', x: 0.66, y: 0.24, size: 0.7 }],
      },
      {
        text: '"I was scared, and I did it anyway!" Nina cheered. Tully grinned. "That\'s exactly what brave means."',
        bg: 'beach', cast: [{ who: 'nina', x: 0.38, outfit: 'swim', pose: 'held', expr: 'happy' }, { who: 'turtle', x: 0.64, pose: 'wave', expr: 'happy' }], props: [{ id: 'sparkles', x: 0.38, y: 0.24, size: 0.8 }],
      },
    ],
  },
  {
    id: 'the-kindest-knight',
    title: 'The Kindest Knight',
    kind: 'book',
    moral: 'Kindness is the greatest strength of all.',
    cover: { bg: '#e8dcff', color: '#6a3fc1', who: ['zoe', 'elephant', 'mouse'] },
    pages: [
      {
        text: 'Every year, the castle chose one new Junior Knight. This year, Zoe wanted it more than anything in the world.',
        bg: 'castle', cast: [{ who: 'zoe', x: 0.42, pose: 'held', expr: 'happy' }],
      },
      {
        text: '"The test is a race," said Queen Peony, the elephant. "Whoever brings me the golden flag from the hilltop will be my Junior Knight."',
        bg: 'castle', cast: [{ who: 'zoe', x: 0.2, expr: 'happy' }, { who: 'elephant', x: 0.5, expr: 'happy', acc: ['crown'], hold: 'scepter' }, { who: 'kai', x: 0.8, expr: 'happy' }],
      },
      {
        text: 'Ready, set, go! Zoe ran like the wind. But halfway up the hill, she heard a tiny sniffle.',
        bg: 'meadow', cast: [{ who: 'zoe', x: 0.34, pose: 'held', expr: 'surprised' }, { who: 'kai', x: 0.74, size: 0.8, pose: 'held', expr: 'happy' }], props: [{ id: 'wind', x: 0.18, y: 0.6, size: 0.6 }],
      },
      {
        text: 'Crumb the mouse had tripped, and his basket of apples had tumbled everywhere. "Oh no," he sniffled. "Grandma\'s apple pie!"',
        bg: 'meadow', cast: [{ who: 'zoe', x: 0.24, expr: 'surprised' }, { who: 'mouse', x: 0.6, size: 1.2, pose: 'sit', expr: 'sad' }], props: [{ id: 'apples', x: 0.5, y: 0.95 }, { id: 'basket', x: 0.76 }],
      },
      {
        text: 'Zoe stopped. The other runners zoomed right past. She helped pick up every apple, even the one that rolled under a bush.',
        bg: 'meadow', cast: [{ who: 'zoe', x: 0.38, expr: 'happy', hold: 'apple' }, { who: 'mouse', x: 0.64, size: 1.2, expr: 'happy', hold: 'basket' }, { who: 'kai', x: 0.9, y: 0.78, size: 0.6, pose: 'held', expr: 'happy' }],
      },
      {
        text: 'By the time Zoe reached the hilltop, the golden flag was gone. She walked back to the castle with her head hanging low.',
        bg: 'castle', cast: [{ who: 'zoe', x: 0.46, expr: 'sad' }],
      },
      {
        text: 'But the queen was smiling. "I watched from my tower," she said. "A knight isn\'t the fastest, or the strongest. A knight is the one who stops to help."',
        bg: 'castle', cast: [{ who: 'zoe', x: 0.34, expr: 'surprised' }, { who: 'elephant', x: 0.64, expr: 'happy', acc: ['crown'], hold: 'scepter' }],
      },
      {
        text: 'She tapped Zoe\'s shoulder with her golden scepter. "I name you Sir Zoe the Kind!" Everyone cheered, especially Crumb.',
        bg: 'castle', cast: [{ who: 'zoe', x: 0.38, pose: 'held', expr: 'happy', acc: ['cape'] }, { who: 'elephant', x: 0.62, expr: 'happy', acc: ['crown'], hold: 'scepter' }, { who: 'mouse', x: 0.86, size: 1.2, pose: 'held', expr: 'happy' }], props: [{ id: 'confetti', x: 0.5, y: 0.25 }],
      },
    ],
  },
];

const MOVIES: Story[] = [
  {
    id: 'rocket-to-the-moon',
    title: 'Rocket to the Moon',
    kind: 'movie',
    moral: 'When friends really listen to each other, they can find their way through anything.',
    cover: { bg: '#3a3487', color: '#ffb703', who: ['kai', 'bunny'] },
    pages: [
      {
        text: 'Kai and Pip the bunny found a giant cardboard box. "It\'s not a box," said Kai. "It\'s a rocket ship!"',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.24, pose: 'wave', expr: 'happy' }, { who: 'bunny', x: 0.78, pose: 'held', expr: 'happy' }], props: [{ id: 'rocket', x: 0.52, size: 0.95 }],
      },
      {
        text: 'They drew buttons with crayons, taped on paper wings, and put on their space helmets. "Three, two, one... blast off!"',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.24, pose: 'held', expr: 'happy', acc: ['helmet'] }, { who: 'bunny', x: 0.78, pose: 'held', expr: 'happy', acc: ['helmet'] }], props: [{ id: 'rocket', x: 0.52, size: 0.95 }],
      },
      {
        text: 'The rocket rumbled, and grumbled, and shook. Then whoosh! Up it zoomed, right through the fluffy clouds.',
        bg: 'meadow', cast: [], props: [{ id: 'rocket-fly', x: 0.5, y: 0.66, size: 0.8 }],
      },
      {
        text: "In space, everything floated. Pip's ears floated. Kai's sandwich floated. Even Pip's carrot did a slow, silly somersault.",
        bg: 'stars', cast: [{ who: 'kai', x: 0.34, y: 0.75, pose: 'held', expr: 'happy', acc: ['helmet'] }, { who: 'bunny', x: 0.66, y: 0.7, pose: 'held', expr: 'surprised', acc: ['helmet'] }], props: [{ id: 'carrot', x: 0.5, y: 0.3 }, { id: 'sandwich', x: 0.18, y: 0.25 }],
      },
      {
        text: 'They zoomed past a planet with rings like a hula hoop, and a comet waved its sparkly tail. "Hello, comet!" they called.',
        bg: 'stars', cast: [{ who: 'kai', x: 0.26, y: 0.78, pose: 'wave', expr: 'happy', acc: ['helmet'] }, { who: 'bunny', x: 0.52, y: 0.74, pose: 'wave', expr: 'happy', acc: ['helmet'] }], props: [{ id: 'shootingstar', x: 0.62, y: 0.18 }],
      },
      {
        text: 'Bump! They landed on the Moon. It was so bouncy that every step sent them boing, boing, boinging into the air.',
        bg: 'space', cast: [{ who: 'kai', x: 0.3, y: 0.72, pose: 'held', expr: 'happy', acc: ['helmet'] }, { who: 'bunny', x: 0.56, y: 0.66, pose: 'held', expr: 'happy', acc: ['helmet'] }], props: [{ id: 'rocket', x: 0.84, y: 0.85, size: 0.6 }],
      },
      {
        text: 'Behind a moon rock, they found a little star, crying silver tears. "I fell out of the sky," she sniffled, "and now I can\'t find my way home."',
        bg: 'space', cast: [{ who: 'kai', x: 0.24, expr: 'surprised', acc: ['helmet'] }, { who: 'bunny', x: 0.8, expr: 'surprised', acc: ['helmet'] }], props: [{ id: 'littlestar', x: 0.52, y: 0.7, color: 'sad' }],
      },
      {
        text: '"This way!" said Kai. "No, that way!" said Pip. They pulled and tugged and argued, and the little star got dimmer and dimmer.',
        bg: 'space', cast: [{ who: 'kai', x: 0.26, pose: 'wave', expr: 'normal', acc: ['helmet'] }, { who: 'bunny', x: 0.76, pose: 'wave', expr: 'normal', acc: ['helmet'], flip: true }], props: [{ id: 'littlestar', x: 0.51, y: 0.66, size: 0.75, color: 'sad' }],
      },
      {
        text: 'Then they stopped, and listened. Kai had a star map. And Pip\'s long ears could hear the other stars humming. "Let\'s do it together!"',
        bg: 'space', cast: [{ who: 'kai', x: 0.3, expr: 'happy', acc: ['helmet'], hold: 'map' }, { who: 'bunny', x: 0.72, expr: 'happy', acc: ['helmet'] }], props: [{ id: 'littlestar', x: 0.51, y: 0.6, size: 0.75 }, { id: 'notes', x: 0.76, y: 0.18 }],
      },
      {
        text: 'They followed the map and the humming, all the way to an empty spot in the sky. The little star popped into place, and shone brighter than ever.',
        bg: 'stars', cast: [{ who: 'kai', x: 0.28, y: 0.85, pose: 'held', expr: 'happy', acc: ['helmet'] }, { who: 'bunny', x: 0.72, y: 0.82, pose: 'held', expr: 'happy', acc: ['helmet'] }], props: [{ id: 'stars', x: 0.5, y: 0.3, size: 1.4 }, { id: 'littlestar', x: 0.5, y: 0.3, size: 0.9 }],
      },
      {
        text: 'Back home, Kai and Pip looked out the window. Way up high, one little star winked at them. Twinkle, twinkle!',
        bg: 'bedroom', time: 'night', cast: [{ who: 'kai', x: 0.42, outfit: 'pjs', pose: 'wave', expr: 'happy' }, { who: 'bunny', x: 0.62, expr: 'happy' }], props: [{ id: 'star', x: 0.22, y: 0.36, size: 0.5 }],
      },
    ],
  },
  {
    id: 'treasure-of-coral-cove',
    title: 'The Treasure of Coral Cove',
    kind: 'movie',
    moral: "Treasure is sweetest when it's shared with friends.",
    cover: { bg: '#8fdcec', color: '#0b5e7a', who: ['sam', 'penguin', 'turtle'] },
    pages: [
      {
        text: 'One sunny morning, Sam found a bottle on the beach. Inside was a crinkly old map with a big red X. "Treasure!" he shouted.',
        bg: 'beach', cast: [{ who: 'sam', x: 0.4, outfit: 'swim', pose: 'held', expr: 'surprised', hold: 'map' }], props: [{ id: 'bottle', x: 0.64, y: 0.93 }],
      },
      {
        text: 'Pebble the penguin waddled over, and Tully the turtle popped up out of the waves. "That X is in Coral Cove," said Tully. "Let\'s go!"',
        bg: 'beach', cast: [{ who: 'sam', x: 0.24, outfit: 'swim', expr: 'happy', hold: 'map' }, { who: 'penguin', x: 0.5, pose: 'wave', expr: 'happy' }, { who: 'turtle', x: 0.8, y: 0.69, size: 0.75, swim: true, pose: 'wave', expr: 'happy' }],
      },
      {
        text: "Down, down, down they swam, past wiggly seaweed and bubbles that tickled their noses. Sam's goggles fogged up, so Pebble gave them a polish.",
        bg: 'ocean', cast: [{ who: 'sam', x: 0.3, y: 0.75, outfit: 'swim', pose: 'held', expr: 'happy', acc: ['goggles'] }, { who: 'penguin', x: 0.56, y: 0.68, pose: 'held', expr: 'happy' }, { who: 'turtle', x: 0.8, y: 0.72, expr: 'happy' }], props: [{ id: 'bubbles', x: 0.42, y: 0.5 }],
      },
      {
        text: 'A pufferfish swam up to say hello. Then it got so excited that it puffed up like a spiky balloon. Pop!',
        bg: 'ocean', cast: [{ who: 'sam', x: 0.22, outfit: 'swim', expr: 'surprised', acc: ['goggles'] }, { who: 'penguin', x: 0.82, expr: 'happy' }], props: [{ id: 'puffer', x: 0.52, y: 0.42 }],
      },
      {
        text: "In the kelp forest, the seaweed tickled Tully's tummy. He laughed so hard that he did three backflips!",
        bg: 'ocean', cast: [{ who: 'sam', x: 0.2, outfit: 'swim', expr: 'happy', acc: ['goggles'] }, { who: 'turtle', x: 0.5, y: 0.66, pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.8, expr: 'happy' }], props: [{ id: 'bubbles', x: 0.5, y: 0.4 }],
      },
      {
        text: '"Look!" whispered Pebble. Half buried in the sand was a treasure chest, covered in barnacles and shining in the sunbeams.',
        bg: 'ocean', cast: [{ who: 'penguin', x: 0.26, expr: 'surprised' }, { who: 'sam', x: 0.8, outfit: 'swim', expr: 'surprised', acc: ['goggles'] }], props: [{ id: 'chest', x: 0.54, y: 0.9 }],
      },
      {
        text: 'They brushed off the sand. Sam turned the rusty old key, and creak... the lid slowly opened.',
        bg: 'ocean', cast: [{ who: 'sam', x: 0.28, outfit: 'swim', expr: 'normal', acc: ['goggles'], hold: 'key' }, { who: 'penguin', x: 0.74, expr: 'surprised' }, { who: 'turtle', x: 0.9, size: 0.8, expr: 'surprised' }], props: [{ id: 'chest', x: 0.52, y: 0.9 }],
      },
      {
        text: 'Inside were hundreds of golden coins, and a note that said, "Treasure is sweetest when it\'s shared." Pebble took a bite of a coin. "Hey, it\'s chocolate!"',
        bg: 'ocean', cast: [{ who: 'penguin', x: 0.26, expr: 'yum', hold: 'coin' }, { who: 'sam', x: 0.76, outfit: 'swim', pose: 'held', expr: 'happy', acc: ['goggles'] }], props: [{ id: 'chest-open', x: 0.52, y: 0.9 }],
      },
      {
        text: 'They swam back with the chest and threw a giant beach party. Everyone got a chocolate coin, even the crabs.',
        bg: 'beach', cast: [{ who: 'sam', x: 0.18, outfit: 'swim', pose: 'held', expr: 'happy', hold: 'coin' }, { who: 'penguin', x: 0.4, pose: 'held', expr: 'happy' }, { who: 'turtle', x: 0.62, expr: 'yum', hold: 'coin' }], props: [{ id: 'chest-open', x: 0.84, y: 0.92, size: 0.8 }, { id: 'crab', x: 0.72, y: 0.97, size: 0.7 }, { id: 'balloons', x: 0.06, y: 0.85 }, { id: 'ball', x: 0.5, y: 0.97 }],
      },
      {
        text: 'The friends laughed and munched until the sun went down. Sharing the treasure made it the best treasure of all.',
        bg: 'sunset', cast: [{ who: 'sam', x: 0.28, outfit: 'swim', pose: 'sit', expr: 'happy' }, { who: 'penguin', x: 0.5, pose: 'sit', expr: 'happy' }, { who: 'turtle', x: 0.72, pose: 'sit', expr: 'happy' }], props: [{ id: 'coins', x: 0.5, y: 0.98, size: 0.8 }, { id: 'hearts', x: 0.5, y: 0.28, size: 0.8 }],
      },
    ],
  },
  {
    id: 'biscuit-is-missing',
    title: 'Biscuit Is Missing!',
    kind: 'movie',
    moral: "When you need help, it's smart to ask. Good friends and neighbors help each other.",
    cover: { bg: '#ffe9b3', color: '#b8560f', who: ['milo', 'puppy'] },
    pages: [
      {
        text: "Every Saturday, Milo took Biscuit the puppy for a walk to the bakery. Biscuit's tail wagged the whole way there.",
        bg: 'town', cast: [{ who: 'milo', x: 0.36, expr: 'happy' }, { who: 'puppy', x: 0.6, expr: 'happy' }],
      },
      {
        text: 'Suddenly, a butterfly fluttered past Biscuit\'s nose. Biscuit wiggled, Biscuit jiggled, and off he zoomed! "Biscuit, come back!" called Milo.',
        bg: 'town', cast: [{ who: 'milo', x: 0.3, pose: 'wave', expr: 'surprised' }, { who: 'puppy', x: 0.78, size: 0.85, pose: 'held', expr: 'happy' }], props: [{ id: 'butterfly', x: 0.92, y: 0.45 }],
      },
      {
        text: 'Milo looked up the street, and down the street. There was no Biscuit anywhere. His lip began to wobble.',
        bg: 'town', cast: [{ who: 'milo', x: 0.5, expr: 'sad' }],
      },
      {
        text: 'Then Milo remembered what his mom always said. "When you need help, ask for it." So he ran to find his friends.',
        bg: 'town', cast: [{ who: 'milo', x: 0.36, pose: 'wave', expr: 'normal' }, { who: 'zoe', x: 0.64, expr: 'surprised' }, { who: 'ruby', x: 0.84, expr: 'surprised' }],
      },
      {
        text: 'Zoe and Ruby helped him make posters that said, "Lost Puppy." They stuck one on every lamppost on the street.',
        bg: 'town', cast: [{ who: 'zoe', x: 0.2, expr: 'happy' }, { who: 'milo', x: 0.42, expr: 'normal', hold: 'card' }, { who: 'ruby', x: 0.64, expr: 'happy' }], props: [{ id: 'poster', x: 0.86 }],
      },
      {
        text: 'At the bakery, Barnaby the baker scratched his head. "A puppy with a spotty ear? He sniffed my muffins, sneezed in my flour, and ran off toward the farm!"',
        bg: 'kitchen', cast: [{ who: 'milo', x: 0.4, expr: 'surprised' }, { who: 'bear', x: 0.68, expr: 'surprised', acc: ['chef'] }], props: [{ id: 'muffins', x: 0.16, y: 0.567 }],
      },
      {
        text: 'At the farm, Mrs. Duck pointed with her wing. "He splashed through my puddle and went that way!" Sure enough, there were muddy paw prints.',
        bg: 'farm', cast: [{ who: 'duck', x: 0.24, pose: 'wave', expr: 'happy', acc: ['bow'] }, { who: 'milo', x: 0.5, expr: 'surprised' }, { who: 'zoe', x: 0.72, expr: 'happy' }], props: [{ id: 'puddle', x: 0.3, y: 0.97 }, { id: 'pawprints', x: 0.6, y: 0.97 }],
      },
      {
        text: 'They followed the paw prints past the barn and around the haystack. The prints were getting fresher, and fresher.',
        bg: 'farm', cast: [{ who: 'milo', x: 0.24, expr: 'normal' }, { who: 'ruby', x: 0.44, expr: 'normal' }], props: [{ id: 'pawprints', x: 0.56, y: 0.97 }, { id: 'hay', x: 0.86 }],
      },
      {
        text: 'And there, snuggled in the soft hay, was Biscuit, fast asleep, with three fluffy ducklings tucked under his ears.',
        bg: 'farm', cast: [{ who: 'milo', x: 0.24, expr: 'surprised' }, { who: 'puppy', x: 0.6, pose: 'sit', expr: 'sleep' }], props: [{ id: 'hay', x: 0.6, back: true, size: 1.2 }, { id: 'ducklings', x: 0.76 }],
      },
      {
        text: 'Biscuit woke up and licked Milo\'s face. Slurp, slurp, slurp! "I\'m so happy you\'re safe," laughed Milo, hugging him tight.',
        bg: 'farm', cast: [{ who: 'milo', x: 0.4, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.6, pose: 'held', expr: 'happy' }], props: [{ id: 'hearts', x: 0.5, y: 0.25 }, { id: 'ducklings', x: 0.84 }],
      },
      {
        text: 'Milo threw a thank-you party for everyone who helped. And Biscuit got a shiny new name tag, just in case.',
        bg: 'town', cast: [{ who: 'zoe', x: 0.14, pose: 'held', expr: 'happy' }, { who: 'milo', x: 0.34, pose: 'wave', expr: 'happy' }, { who: 'puppy', x: 0.52, expr: 'happy', acc: ['collar'] }, { who: 'ruby', x: 0.7, expr: 'happy' }, { who: 'bear', x: 0.88, expr: 'happy', acc: ['chef'] }], props: [{ id: 'balloons', x: 0.52, y: 0.62, size: 0.8 }, { id: 'confetti', x: 0.5, y: 0.25 }],
      },
    ],
  },
  {
    id: 'the-snow-day-sled-race',
    title: 'The Snow-Day Sled Race',
    kind: 'movie',
    moral: 'Winning is fun, but being a good sport and helping your friends is what makes a true champion.',
    cover: { bg: '#dff1ff', color: '#2a5db0', who: ['sam', 'penguin', 'ruby'] },
    pages: [
      {
        text: 'Sam opened the front door and gasped. Snow! Everything was white and sparkly, and school was closed for the day.',
        bg: 'snow', cast: [{ who: 'sam', x: 0.45, outfit: 'snow', pose: 'held', expr: 'surprised' }],
      },
      {
        text: '"The big sled race is today!" shouted Ruby. "The first one down Marshmallow Hill wins a golden trophy!"',
        bg: 'snow', cast: [{ who: 'ruby', x: 0.3, outfit: 'snow', pose: 'wave', expr: 'happy' }, { who: 'sam', x: 0.6, outfit: 'snow', expr: 'happy' }], props: [{ id: 'trophy', x: 0.84, size: 0.9 }],
      },
      {
        text: 'Sam built the fanciest sled ever. It had rocket stickers, shiny fins, and a horn that went honk, honk!',
        bg: 'snow', cast: [{ who: 'sam', x: 0.32, outfit: 'snow', pose: 'held', expr: 'happy' }], props: [{ id: 'rocketsled', x: 0.66, size: 1.1 }],
      },
      {
        text: 'Ruby\'s sled was her mom\'s laundry basket. And Pebble the penguin didn\'t need a sled at all. "I\'ve got my tummy," he said.',
        bg: 'snow', cast: [{ who: 'ruby', x: 0.22, outfit: 'snow', expr: 'happy' }, { who: 'penguin', x: 0.76, pose: 'wave', expr: 'happy', acc: ['scarf'] }], props: [{ id: 'basket-sled', x: 0.44 }],
      },
      {
        text: "Ready, set, go! Down the hill they zoomed. Sam's fancy sled went faster, and faster, and much too fast!",
        bg: 'snow', cast: [{ who: 'ruby', x: 0.22, outfit: 'snow', pose: 'sit', expr: 'happy', ride: 'basket-sled' }, { who: 'sam', x: 0.62, outfit: 'snow', pose: 'sit', expr: 'surprised', ride: 'rocketsled' }, { who: 'penguin', x: 0.88, size: 0.8, pose: 'held', expr: 'happy', acc: ['scarf'] }], props: [{ id: 'wind', x: 0.42, y: 0.55, size: 0.7 }],
      },
      {
        text: 'Whoa! Sam zoomed straight through a snowman. Poof! When the snow settled, Sam had a carrot on his head, and the snowman was wearing his hat.',
        bg: 'snow', cast: [{ who: 'sam', x: 0.38, outfit: 'snow', pose: 'sit', expr: 'surprised', acc: ['carrot'] }], props: [{ id: 'snowman', x: 0.68, color: '#4f9dff' }, { id: 'rocketsled', x: 0.16, size: 0.9 }, { id: 'sparkles', x: 0.54, y: 0.4, color: '#ffffff' }],
      },
      {
        text: 'Meanwhile, Ruby\'s basket spun round and round like a teacup ride. "Wheee!" she giggled, dizzy and happy.',
        bg: 'snow', cast: [{ who: 'ruby', x: 0.5, outfit: 'snow', pose: 'sit', expr: 'happy', ride: 'basket-sled' }], props: [{ id: 'wind', x: 0.5, y: 0.4, size: 0.8 }, { id: 'stars', x: 0.5, y: 0.22, size: 0.5 }],
      },
      {
        text: 'Near the bottom, Ruby\'s basket got stuck in a big snowdrift. Sam could see the finish line. He could still win!',
        bg: 'snow', cast: [{ who: 'ruby', x: 0.3, outfit: 'snow', pose: 'sit', expr: 'sad', ride: 'basket-sled' }, { who: 'sam', x: 0.56, outfit: 'snow', expr: 'normal' }], props: [{ id: 'drift', x: 0.3, y: 0.95, size: 1.1 }, { id: 'finish', x: 0.84, size: 0.7 }],
      },
      {
        text: 'But Sam stopped. He grabbed Ruby\'s hands and pulled. One, two, three, pop! Out came Ruby, basket and all.',
        bg: 'snow', cast: [{ who: 'sam', x: 0.36, outfit: 'snow', pose: 'held', expr: 'happy' }, { who: 'ruby', x: 0.58, outfit: 'snow', pose: 'held', expr: 'happy' }], props: [{ id: 'basket-sled', x: 0.8, size: 0.9 }, { id: 'sparkles', x: 0.48, y: 0.3, color: '#ffffff' }],
      },
      {
        text: 'Just then, Pebble slid across the finish line on his tummy. Zoom! "Pebble wins!" everyone cheered.',
        bg: 'snow', cast: [{ who: 'penguin', x: 0.5, pose: 'held', expr: 'happy', acc: ['scarf'] }], props: [{ id: 'finish', x: 0.5 }, { id: 'confetti', x: 0.5, y: 0.3 }, { id: 'wind', x: 0.22, y: 0.7, size: 0.6 }],
      },
      {
        text: 'Sam and Ruby crossed the line together, laughing and covered in snow. Pebble held up his trophy and shouted, "Three cheers for Sam, the kindest racer!"',
        bg: 'snow', cast: [{ who: 'sam', x: 0.28, outfit: 'snow', pose: 'held', expr: 'happy' }, { who: 'ruby', x: 0.5, outfit: 'snow', pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.74, expr: 'happy', hold: 'trophy', acc: ['scarf'] }], props: [{ id: 'confetti', x: 0.5, y: 0.25 }],
      },
      {
        text: 'Then everyone warmed up with hot cocoa. Sam didn\'t win the trophy, but he won something even better: a friend who knew he would always stop to help.',
        bg: 'kitchen', cast: [{ who: 'sam', x: 0.42, expr: 'happy', hold: 'cocoa' }, { who: 'ruby', x: 0.62, expr: 'happy', hold: 'cocoa' }, { who: 'penguin', x: 0.82, expr: 'happy', acc: ['medal'] }], props: [{ id: 'cocoa', x: 0.2, y: 0.567 }],
      },
    ],
  },
  {
    id: 'the-great-talent-show',
    title: 'The Great Talent Show',
    kind: 'movie',
    moral: 'Everyone shines in their own special way. Cheer for your friends, and be brave enough to share your sparkle.',
    cover: { bg: '#ffd1e8', color: '#a3186b', who: ['bear', 'ruby', 'mouse'] },
    pages: [
      {
        text: 'Welcome to the Great Talent Show! Our host tonight is Ruby, and she has the sparkliest microphone in town.',
        bg: 'stage', cast: [{ who: 'ruby', x: 0.5, outfit: 'fancy', pose: 'wave', expr: 'happy', hold: 'mic' }], props: [{ id: 'stars', x: 0.5, y: 0.2, size: 0.8 }],
      },
      {
        text: 'First up is Barnaby the bear, juggling three shiny red apples. Up, up, up... crunch! Oops. He ate one.',
        bg: 'stage', cast: [{ who: 'bear', x: 0.5, pose: 'held', expr: 'yum' }], props: [{ id: 'juggle', x: 0.5, y: 0.38 }],
      },
      {
        text: 'Next, Pip the bunny did a magic trick. "Watch my carrot disappear!" Poof! It was gone. But Pip\'s cheeks looked very, very full.',
        bg: 'stage', cast: [{ who: 'bunny', x: 0.44, pose: 'wave', expr: 'yum' }], props: [{ id: 'magichat', x: 0.66 }, { id: 'sparkles', x: 0.6, y: 0.4 }],
      },
      {
        text: 'Then Peanut the elephant sang a song, and played the trumpet with her trunk. Toot, toot, tootle-oo!',
        bg: 'stage', cast: [{ who: 'elephant', x: 0.5, pose: 'held', expr: 'happy' }], props: [{ id: 'notes', x: 0.62, y: 0.3 }, { id: 'notes', x: 0.36, y: 0.24 }],
      },
      {
        text: 'Pepper the kitty and Biscuit the puppy did a twirly dance. They twirled so much that they twirled right off the stage!',
        bg: 'stage', cast: [{ who: 'kitty', x: 0.36, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.64, pose: 'held', expr: 'happy', flip: true }], props: [{ id: 'sparkles', x: 0.5, y: 0.36 }],
      },
      {
        text: 'Now it was Crumb the mouse\'s turn. But his knees were knocking, and his whiskers were shaking. "I can\'t," he whispered. "There are too many people."',
        bg: 'stage', cast: [{ who: 'mouse', x: 0.5, size: 1.35, expr: 'sad', hold: 'violin' }],
      },
      {
        text: 'Ruby knelt down beside him. "Just look at me, not the crowd," she said softly. "And remember, we are all cheering for you."',
        bg: 'stage', cast: [{ who: 'ruby', x: 0.36, outfit: 'fancy', pose: 'sit', expr: 'happy' }, { who: 'mouse', x: 0.62, size: 1.3, expr: 'normal', hold: 'violin' }],
      },
      {
        text: 'Crumb took a deep breath and lifted his tiny violin. Then he began to play.',
        bg: 'stage', cast: [{ who: 'mouse', x: 0.5, size: 1.35, pose: 'held', expr: 'normal', hold: 'violin' }], props: [{ id: 'notes', x: 0.62, y: 0.4 }],
      },
      {
        text: 'The music was soft and sweet, like moonlight on a pond. Even Barnaby stopped munching, just to listen.',
        bg: 'stage', cast: [{ who: 'bear', x: 0.18, expr: 'surprised' }, { who: 'mouse', x: 0.5, size: 1.35, expr: 'happy', hold: 'violin' }, { who: 'bunny', x: 0.82, expr: 'happy' }], props: [{ id: 'notes', x: 0.5, y: 0.3 }, { id: 'hearts', x: 0.2, y: 0.25, size: 0.5 }],
      },
      {
        text: 'When the song ended, everyone jumped up and cheered so loudly that Crumb\'s ears wiggled. "Hooray for Crumb!"',
        bg: 'stage', cast: [{ who: 'bear', x: 0.18, pose: 'held', expr: 'happy' }, { who: 'mouse', x: 0.5, size: 1.35, pose: 'held', expr: 'happy' }, { who: 'ruby', x: 0.82, outfit: 'fancy', pose: 'held', expr: 'happy' }], props: [{ id: 'confetti', x: 0.5, y: 0.25 }],
      },
      {
        text: 'That night, there wasn\'t just one winner. Every single act got a shiny gold medal, because everyone had shined in their own special way.',
        bg: 'stage', cast: [{ who: 'bear', x: 0.14, expr: 'happy', acc: ['medal'] }, { who: 'bunny', x: 0.32, expr: 'happy', acc: ['medal'] }, { who: 'mouse', x: 0.5, size: 1.3, pose: 'held', expr: 'happy', acc: ['medal'] }, { who: 'elephant', x: 0.68, expr: 'happy', acc: ['medal'] }, { who: 'ruby', x: 0.87, outfit: 'fancy', pose: 'wave', expr: 'happy', acc: ['medal'] }], props: [{ id: 'stars', x: 0.5, y: 0.18 }],
      },
    ],
  },
  {
    id: 'ember-and-the-dark',
    title: 'Ember and the Dark',
    kind: 'movie',
    moral: "The dark isn't so scary when you take a closer look, especially with a friend beside you.",
    cover: { bg: '#3b3478', color: '#ffcf5a', who: ['dragon', 'owl'] },
    pages: [
      {
        text: 'Ember the dragon lived in a cozy cave on top of a mountain. She was big, and strong, and brave, except for one tiny thing.',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.42, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'Ember was afraid of the dark. Every night, she slept with forty-seven lanterns glowing all around her.',
        bg: 'cave', time: 'night', cast: [{ who: 'dragon', x: 0.45, pose: 'sit', expr: 'sleep' }], props: [{ id: 'lanterns', x: 0.16 }, { id: 'lanterns', x: 0.76 }, { id: 'lantern', x: 0.46, y: 0.4, size: 0.8 }],
      },
      {
        text: 'One night, a big, breezy wind swept into the cave. Whoosh! Out went every single lantern.',
        bg: 'cave', time: 'night', cast: [{ who: 'dragon', x: 0.45, pose: 'sit', expr: 'surprised' }], props: [{ id: 'lanterns-off', x: 0.16 }, { id: 'lanterns-off', x: 0.76 }, { id: 'wind', x: 0.5, y: 0.3 }],
      },
      {
        text: 'Ember squeaked and hid her face behind her paws. "Who\'s there?" hooted a friendly voice. It was Olive the owl.',
        bg: 'cave', time: 'night', cast: [{ who: 'dragon', x: 0.4, pose: 'sit', expr: 'sad' }, { who: 'owl', x: 0.76, pose: 'wave', expr: 'happy' }], props: [{ id: 'lanterns-off', x: 0.14 }],
      },
      {
        text: '"The dark isn\'t empty," said Olive. "It\'s full of wonderful things. Come with me, and I\'ll show you."',
        bg: 'night', cast: [{ who: 'dragon', x: 0.36, expr: 'normal' }, { who: 'owl', x: 0.64, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'First, they saw fireflies, blinking like tiny flying flashlights. Blink, blink, blink!',
        bg: 'night', cast: [{ who: 'dragon', x: 0.36, expr: 'surprised' }, { who: 'owl', x: 0.68, expr: 'happy' }], props: [{ id: 'fireflies', x: 0.5, y: 0.45 }],
      },
      {
        text: 'Next, they heard the frogs by the pond, singing their night-time song. Ribbit, croak, ribbit!',
        bg: 'pond', time: 'night', cast: [{ who: 'dragon', x: 0.26, expr: 'happy' }, { who: 'owl', x: 0.8, expr: 'happy' }], props: [{ id: 'frog', x: 0.44, y: 0.75 }, { id: 'frog', x: 0.62, y: 0.78 }, { id: 'notes', x: 0.54, y: 0.5 }],
      },
      {
        text: 'Then Olive pointed up. The sky was sprinkled with stars, and a shooting star zipped across it. "Make a wish," Olive whispered.',
        bg: 'night', cast: [{ who: 'dragon', x: 0.38, pose: 'held', expr: 'happy' }, { who: 'owl', x: 0.66, pose: 'wave', expr: 'happy' }], props: [{ id: 'shootingstar', x: 0.4, y: 0.16 }],
      },
      {
        text: 'The big, round moon smiled down at them, like the biggest nightlight in the world. "Oh," said Ember softly. "The dark is beautiful."',
        bg: 'night', cast: [{ who: 'dragon', x: 0.42, pose: 'sit', expr: 'happy' }, { who: 'owl', x: 0.64, pose: 'sit', expr: 'happy' }], props: [{ id: 'sparkles', x: 0.8, y: 0.2, color: '#fff6c8', size: 0.7 }],
      },
      {
        text: 'Then Ember sneezed. Ah, ah, achoo! Out came a puff of warm, glowing sparkles that lit up the whole path.',
        bg: 'night', cast: [{ who: 'dragon', x: 0.36, expr: 'surprised' }, { who: 'owl', x: 0.82, expr: 'surprised' }], props: [{ id: 'sparks', x: 0.58, y: 0.5 }],
      },
      {
        text: '"Ember, you have your very own light!" laughed Olive. Ember twirled, and sparkles danced all around them.',
        bg: 'night', cast: [{ who: 'dragon', x: 0.44, pose: 'held', expr: 'happy' }, { who: 'owl', x: 0.74, pose: 'held', expr: 'happy' }], props: [{ id: 'sparks', x: 0.44, y: 0.45 }, { id: 'sparkles', x: 0.7, y: 0.3 }],
      },
      {
        text: 'From that night on, Ember only needed one little lantern. And she kept it by the door, just in case a friend ever felt scared of the dark.',
        bg: 'cave', time: 'night', cast: [{ who: 'dragon', x: 0.4, pose: 'sit', expr: 'sleep' }, { who: 'owl', x: 0.86, size: 0.8, pose: 'sit', expr: 'sleep' }], props: [{ id: 'lantern', x: 0.68 }],
      },
    ],
  },
];

// The second shelf. Grown-ups mom, dad, grandma and grandpa are drawn taller than the kids.
const MORE_BOOKS: Story[] = [
  {
    id: 'sam-and-the-fluffy-ducklings',
    title: 'Sam and the Fluffy Ducklings',
    kind: 'book',
    moral: 'Animals have feelings too. Soft hands, slow moves, and quiet voices help them feel safe.',
    cover: { bg: '#fdf3b5', color: '#b06a00', who: ['sam', 'duck'] },
    pages: [
      {
        text: 'Sam came to visit Mama Duck\'s farm. Three fluffy ducklings were waddling around the yard. Peep, peep, peep!',
        bg: 'farm', cast: [{ who: 'sam', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'duck', x: 0.82, expr: 'happy', acc: ['bow'] }], props: [{ id: 'ducklings', x: 0.56, size: 1.7 }],
      },
      {
        text: 'They looked as soft as clouds. Sam ran at them with his arms open wide. "I want to hug you!"',
        bg: 'farm', cast: [{ who: 'sam', x: 0.34, pose: 'held', expr: 'happy' }], props: [{ id: 'ducklings', x: 0.66, size: 1.7 }, { id: 'wind', x: 0.16, y: 0.7, size: 0.5 }],
      },
      {
        text: 'Peep! Peep! The ducklings scattered every which way. One hid by the fence, one hid in the hay, and one hid behind Mama Duck.',
        bg: 'farm', cast: [{ who: 'sam', x: 0.3, expr: 'surprised' }, { who: 'duck', x: 0.8, expr: 'surprised', acc: ['bow'] }], props: [{ id: 'duckling', x: 0.1, y: 0.8, size: 1.6 }, { id: 'duckling', x: 0.54, y: 0.745, size: 1.6 }, { id: 'hay', x: 0.54, size: 0.9 }, { id: 'duckling', x: 0.92, y: 0.9, flip: true, size: 1.6 }],
      },
      {
        text: '"Little animals get scared of big, fast hugs," said Mama Duck kindly. "Try soft hands, slow feet, and a quiet voice."',
        bg: 'farm', cast: [{ who: 'sam', x: 0.3, expr: 'normal' }, { who: 'duck', x: 0.62, pose: 'wave', expr: 'happy', acc: ['bow'] }], props: [{ id: 'ducklings', x: 0.84, size: 1.7 }],
      },
      {
        text: 'So Sam sat down in the soft grass. He kept very still, and he whispered, "Hello, little ducklings."',
        bg: 'farm', cast: [{ who: 'sam', x: 0.3, pose: 'sit', expr: 'happy' }, { who: 'duck', x: 0.88, size: 0.85, expr: 'happy', acc: ['bow'] }], props: [{ id: 'ducklings', x: 0.66, size: 1.7 }],
      },
      {
        text: 'One brave duckling waddled closer. Then another one came. Then the third one peeped and hopped right onto Sam\'s shoe!',
        bg: 'farm', cast: [{ who: 'sam', x: 0.36, pose: 'sit', expr: 'surprised' }], props: [{ id: 'duckling', x: 0.47, y: 0.93, size: 1.6 }, { id: 'duckling', x: 0.56, y: 0.9, size: 1.6 }, { id: 'duckling', x: 0.64, y: 0.92, size: 1.6 }],
      },
      {
        text: 'Sam held out his flat hand with a few seeds. Peck, peck, peck! It tickled, and Sam giggled very, very quietly.',
        bg: 'farm', cast: [{ who: 'sam', x: 0.36, pose: 'sit', expr: 'happy', hold: 'seeds' }], props: [{ id: 'duckling', x: 0.5, y: 0.82, size: 1.6 }, { id: 'duckling', x: 0.58, y: 0.9, size: 1.6 }, { id: 'duckling', x: 0.66, y: 0.88, size: 1.6 }, { id: 'hearts', x: 0.5, y: 0.3, size: 0.6 }],
      },
      {
        text: 'By the end of the day, the ducklings followed Sam everywhere, in a neat little line. Gentle hands make animal friends!',
        bg: 'farm', cast: [{ who: 'sam', x: 0.3, expr: 'happy' }, { who: 'duck', x: 0.84, expr: 'happy', acc: ['bow'] }], props: [{ id: 'ducklings', x: 0.52, size: 1.7 }, { id: 'hearts', x: 0.4, y: 0.25, size: 0.6 }],
      },
    ],
  },
  {
    id: 'milo-the-food-explorer',
    title: 'Milo the Food Explorer',
    kind: 'book',
    moral: 'Trying new foods is a brave little adventure. Take one small bite, and you might find a new favorite!',
    cover: { bg: '#d9f7e6', color: '#1f8a5a', who: ['milo', 'grandma'] },
    pages: [
      {
        text: 'Milo liked plain noodles. Just noodles. No sauce, no peas, and absolutely nothing green.',
        bg: 'kitchen', cast: [{ who: 'milo', x: 0.5, expr: 'yum', hold: 'noodles' }], props: [{ id: 'noodles', x: 0.16, y: 0.567 }],
      },
      {
        text: 'One night, Grandma made a big dinner. There were dumplings, broccoli trees, and a bright orange mango.',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'milo', x: 0.8, expr: 'surprised' }], props: [{ id: 'feast', x: 0.54, size: 1.5 }],
      },
      {
        text: 'Milo crossed his arms. "Yuck. I don\'t like those." "Have you ever tried them?" asked Grandma. "Well... no," said Milo.',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.28, expr: 'normal' }, { who: 'milo', x: 0.8, expr: 'mad' }], props: [{ id: 'feast', x: 0.54, size: 1.5 }],
      },
      {
        text: '"Then let\'s be food explorers," said Grandma. "Explorers try one tiny bite. You can always say no thank you after."',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'milo', x: 0.8, expr: 'surprised' }], props: [{ id: 'feast', x: 0.54, size: 1.5 }, { id: 'sparkles', x: 0.55, y: 0.42, size: 0.6 }],
      },
      {
        text: 'Milo nibbled a broccoli tree. Crunch! "It\'s like eating a tiny forest," he said. "It\'s a bit funny, but okay!"',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.26, expr: 'happy' }, { who: 'milo', x: 0.78, expr: 'yum', hold: 'broccoli' }], props: [{ id: 'feast', x: 0.52, size: 1.5 }],
      },
      {
        text: 'Next, he tried a dumpling. Squish! It was warm and soft inside. Milo\'s eyes went wide. "Mmm! I like this one!"',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.26, expr: 'happy' }, { who: 'milo', x: 0.78, pose: 'held', expr: 'happy', hold: 'dumpling' }], props: [{ id: 'feast', x: 0.52, size: 1.5 }, { id: 'hearts', x: 0.78, y: 0.2, size: 0.5 }],
      },
      {
        text: 'The mango was sweet and drippy, like sunshine juice. Some foods he loved, and some he only liked a little. That was okay too.',
        bg: 'kitchen', cast: [{ who: 'grandma', x: 0.26, expr: 'happy' }, { who: 'milo', x: 0.78, expr: 'yum', hold: 'mango' }], props: [{ id: 'feast', x: 0.52, size: 1.5 }],
      },
      {
        text: 'Now Milo keeps a food explorer map, with a star for every new food he tries. Tomorrow, he\'s trying purple carrots!',
        bg: 'kitchen', cast: [{ who: 'milo', x: 0.4, pose: 'held', expr: 'happy', hold: 'starpaper' }, { who: 'grandma', x: 0.7, expr: 'happy' }], props: [{ id: 'stars', x: 0.4, y: 0.2, size: 0.6 }],
      },
    ],
  },
  {
    id: 'zoes-oops-painting',
    title: "Zoe's Oops Painting",
    kind: 'book',
    moral: 'It\'s okay to make mistakes. Everybody makes them, and each one helps us learn and grow.',
    cover: { bg: '#ffe1e1', color: '#d62f3a', who: ['zoe', 'bear'] },
    pages: [
      {
        text: 'Zoe was painting a picture for the class art show. It had a big blue sky, green grass, and a bright yellow sun.',
        bg: 'classroom', cast: [{ who: 'zoe', x: 0.3, pose: 'held', expr: 'happy', hold: 'brush' }], props: [{ id: 'easel', x: 0.6 }, { id: 'paints', x: 0.84 }],
      },
      {
        text: 'Then her elbow bumped a paint pot. Splat! A big red blob landed right in the middle of her sky.',
        bg: 'classroom', cast: [{ who: 'zoe', x: 0.3, pose: 'held', expr: 'surprised' }], props: [{ id: 'easel', x: 0.6, color: 'blob' }, { id: 'paints', x: 0.86, color: 'spill' }],
      },
      {
        text: '"Oh no! I ruined it!" cried Zoe. She wanted to crumple it up and throw it away.',
        bg: 'classroom', cast: [{ who: 'zoe', x: 0.32, expr: 'sad' }], props: [{ id: 'easel', x: 0.62, color: 'blob' }],
      },
      {
        text: 'Barnaby the bear, the art teacher, came over. "Everybody makes mistakes," he said. "Even grown-ups. Even bears. Mistakes help us learn."',
        bg: 'classroom', cast: [{ who: 'bear', x: 0.22, pose: 'wave', expr: 'happy', acc: ['glasses'] }, { who: 'zoe', x: 0.5, expr: 'sad' }], props: [{ id: 'easel', x: 0.78, color: 'blob' }],
      },
      {
        text: '"Look again," said Barnaby. "What could that blob become?" Zoe tilted her head. The blob looked a little like... a ladybug!',
        bg: 'classroom', cast: [{ who: 'bear', x: 0.22, expr: 'happy', acc: ['glasses'] }, { who: 'zoe', x: 0.5, expr: 'surprised' }], props: [{ id: 'easel', x: 0.78, color: 'blob' }, { id: 'sparkles', x: 0.78, y: 0.28, size: 0.5 }],
      },
      {
        text: 'She painted black spots, six tiny legs, and two wiggly feelers. Then she gave it a big, happy smile.',
        bg: 'classroom', cast: [{ who: 'zoe', x: 0.3, pose: 'held', expr: 'happy', hold: 'brush' }], props: [{ id: 'easel', x: 0.6, color: 'ladybug' }, { id: 'paints', x: 0.84 }],
      },
      {
        text: 'At the art show, everyone crowded around Zoe\'s picture. "I love the ladybug!" said Kai. "It\'s my favorite part!"',
        bg: 'classroom', cast: [{ who: 'kai', x: 0.16, pose: 'wave', expr: 'happy' }, { who: 'nina', x: 0.36, expr: 'happy' }, { who: 'zoe', x: 0.86, pose: 'held', expr: 'happy' }], props: [{ id: 'easel', x: 0.6, color: 'ladybug' }, { id: 'hearts', x: 0.6, y: 0.22, size: 0.6 }],
      },
      {
        text: 'Zoe\'s oops had become the best part of all. Now, when she makes a mistake, she smiles and says, "Let\'s see what it can become!"',
        bg: 'classroom', cast: [{ who: 'zoe', x: 0.26, pose: 'wave', expr: 'happy' }, { who: 'bear', x: 0.8, expr: 'happy', acc: ['glasses'] }], props: [{ id: 'easel', x: 0.53, color: 'ladybug' }, { id: 'confetti', x: 0.5, y: 0.25, size: 0.8 }],
      },
    ],
  },
  {
    id: 'kai-and-the-toy-mountain',
    title: 'Kai and the Toy Mountain',
    kind: 'book',
    moral: 'When we clean up after we play, our things stay safe, and there is more room for fun.',
    cover: { bg: '#dfe9ff', color: '#3657b8', who: ['kai', 'bunny'] },
    pages: [
      {
        text: 'Kai loved his toys. He played with blocks, cars, dinosaurs, and his teddy bear, Mister Buttons. But he never, ever put them away.',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.26, pose: 'held', expr: 'happy', hold: 'toydino' }], props: [{ id: 'toys', x: 0.62, y: 0.95, color: 'scatter', size: 0.75 }],
      },
      {
        text: 'Soon his floor turned into a Toy Mountain. It was so big that Biscuit the puppy got lost inside it!',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.2, expr: 'surprised' }, { who: 'puppy', x: 0.56, y: 0.62, size: 0.6, expr: 'surprised' }], props: [{ id: 'toys', x: 0.56, size: 1.2 }],
      },
      {
        text: 'Ouch! Kai stepped on a block. Bonk! He tripped on a toy car. "Where is Mister Buttons?" he cried. Nobody could find him.',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.42, pose: 'held', expr: 'surprised' }], props: [{ id: 'toys', x: 0.5, y: 0.96, color: 'scatter', size: 0.85 }, { id: 'stars', x: 0.42, y: 0.26, size: 0.45 }],
      },
      {
        text: 'Pip the bunny hopped in. "Cleaning up can be a game," he said. "Let\'s see how fast we can do it. Ready, set, go!"',
        bg: 'bedroom', cast: [{ who: 'bunny', x: 0.26, pose: 'wave', expr: 'happy' }, { who: 'kai', x: 0.5, expr: 'normal' }], props: [{ id: 'toys', x: 0.8, size: 0.8 }],
      },
      {
        text: 'Cars zoomed into the toy box. Dinosaurs stomped in after them. Blocks hopped in, one by one. Plop, plop, plop!',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.26, pose: 'held', expr: 'happy', hold: 'toycar' }, { who: 'bunny', x: 0.78, pose: 'held', expr: 'happy', hold: 'toydino' }], props: [{ id: 'toybox', x: 0.52 }],
      },
      {
        text: 'At the very bottom of the Toy Mountain, they found Mister Buttons. He was a little bit squashed, but still smiling.',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.38, pose: 'held', expr: 'happy', hold: 'teddy' }, { who: 'bunny', x: 0.64, expr: 'happy' }], props: [{ id: 'toybox', x: 0.86, size: 0.8 }, { id: 'hearts', x: 0.38, y: 0.22, size: 0.5 }],
      },
      {
        text: 'Now there was so much room! Kai and Pip built a block tower almost as tall as Kai. And nobody stepped on anything.',
        bg: 'bedroom', cast: [{ who: 'kai', x: 0.28, expr: 'happy' }, { who: 'bunny', x: 0.72, pose: 'held', expr: 'happy' }], props: [{ id: 'blocks', x: 0.5 }, { id: 'toybox', x: 0.9, size: 0.7 }],
      },
      {
        text: 'Every night, Kai\'s toys go back home. "Goodnight, cars. Goodnight, dinosaurs," he says. "And goodnight, Mister Buttons."',
        bg: 'bedroom', time: 'night', cast: [{ who: 'kai', x: 0.46, outfit: 'pjs', expr: 'happy', hold: 'teddy' }], props: [{ id: 'toybox', x: 0.2, size: 0.8 }],
      },
    ],
  },
  {
    id: 'the-wobbly-step',
    title: 'The Wobbly Step',
    kind: 'book',
    moral: 'If something seems wrong or unsafe, tell a grown-up you trust. Telling helps keep everyone safe.',
    cover: { bg: '#ffeedd', color: '#e0592a', who: ['ruby', 'bear', 'mouse'] },
    pages: [
      {
        text: 'Ruby and Sam ran to the playground. The big red slide was their very favorite thing. Whee!',
        bg: 'playground', cast: [{ who: 'ruby', x: 0.38, pose: 'wave', expr: 'happy' }, { who: 'sam', x: 0.67, y: 0.535, size: 0.62, pose: 'sit', expr: 'happy', ride: 'sliding' }],
      },
      {
        text: 'But today, one of the ladder steps was loose. It went wibble, wobble, creak when Ruby touched it.',
        bg: 'playground', cast: [{ who: 'ruby', x: 0.72, pose: 'held', expr: 'surprised' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55 }],
      },
      {
        text: '"We can still climb," said Sam. "We\'ll just step over it." Ruby looked at the wobbly step. Her tummy felt funny.',
        bg: 'playground', cast: [{ who: 'sam', x: 0.44, pose: 'wave', expr: 'happy' }, { who: 'ruby', x: 0.68, expr: 'normal' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55 }],
      },
      {
        text: 'Just then, little Crumb the mouse came running to the slide. He was much too small to step over a wobbly step!',
        bg: 'playground', cast: [{ who: 'mouse', x: 0.22, size: 1.2, pose: 'held', expr: 'happy' }, { who: 'sam', x: 0.46, expr: 'normal' }, { who: 'ruby', x: 0.68, expr: 'surprised' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55 }],
      },
      {
        text: '"Wait, Crumb!" called Ruby. "That step isn\'t safe. We need to tell a grown-up, right away."',
        bg: 'playground', cast: [{ who: 'mouse', x: 0.22, size: 1.2, expr: 'surprised' }, { who: 'ruby', x: 0.5, pose: 'wave', expr: 'normal' }, { who: 'sam', x: 0.7, expr: 'surprised' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55 }],
      },
      {
        text: 'Ruby ran to Barnaby the bear, the park keeper. "One of the ladder steps is wobbly," she said. "Someone could get hurt."',
        bg: 'playground', cast: [{ who: 'bear', x: 0.3, expr: 'surprised', acc: ['cap'] }, { who: 'ruby', x: 0.56, pose: 'wave', expr: 'normal' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55 }],
      },
      {
        text: '"Thank you for telling me," said Barnaby. "That was the right thing to do." Out came his toolbox. Bang, bang, twist!',
        bg: 'playground', cast: [{ who: 'ruby', x: 0.12, expr: 'happy' }, { who: 'bear', x: 0.68, expr: 'happy', acc: ['cap'], hold: 'hammer' }], props: [{ id: 'sign', x: 0.32, size: 0.8, text: 'Fixing it! Please wait' }, { id: 'toolbox', x: 0.5 }, { id: 'loosestep', x: 0.855, y: 0.55, color: 'fixed' }],
      },
      {
        text: 'Soon the step was strong and safe again. Crumb went first. "Wheeee!" "Telling a grown-up was the best idea," said Sam.',
        bg: 'playground', cast: [{ who: 'ruby', x: 0.2, pose: 'held', expr: 'happy' }, { who: 'sam', x: 0.4, expr: 'happy' }, { who: 'mouse', x: 0.66, y: 0.555, size: 1.1, pose: 'sit', expr: 'happy', ride: 'sliding' }], props: [{ id: 'loosestep', x: 0.855, y: 0.55, color: 'fixed' }],
      },
    ],
  },
  {
    id: 'slow-walks-with-grandma-fox',
    title: 'Slow Walks with Grandma Fox',
    kind: 'book',
    moral: 'Grandparents and older friends have so much love and so many stories. Being patient and kind with them warms everyone\'s heart.',
    cover: { bg: '#f3e4d4', color: '#9a5a2a', who: ['fox', 'fox'], tints: ['', '#e6c3a3'] },
    pages: [
      {
        text: 'Every Sunday, Fern the fox went to the park with Grandma Fox. Fern liked to run. Grandma liked to stroll.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.3, tint: '#e6c3a3', expr: 'happy', acc: ['glasses'], hold: 'cane' }, { who: 'fox', x: 0.64, pose: 'held', expr: 'happy' }],
      },
      {
        text: '"Hurry up, Grandma!" Fern called. "We\'ll miss the duck pond!" But Grandma\'s knees were old, and they creaked like a squeaky door.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.26, tint: '#e6c3a3', expr: 'normal', acc: ['glasses'], hold: 'cane' }, { who: 'fox', x: 0.78, pose: 'wave', expr: 'normal' }],
      },
      {
        text: 'Grandma sat down on a bench to rest. "I\'m sorry, dear," she sighed. "I just can\'t go fast anymore."',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.38, y: 0.72, tint: '#e6c3a3', pose: 'sit', expr: 'sad', acc: ['glasses'] }, { who: 'fox', x: 0.76, expr: 'normal' }], props: [{ id: 'bench', x: 0.43, size: 1.4 }, { id: 'cane', x: 0.62 }],
      },
      {
        text: 'Fern sat down beside her. She remembered how Grandma always waited for her, back when she was tiny and slow.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.34, y: 0.72, tint: '#e6c3a3', pose: 'sit', expr: 'normal', acc: ['glasses'] }, { who: 'fox', x: 0.52, y: 0.72, pose: 'sit', expr: 'normal' }], props: [{ id: 'bench', x: 0.43, size: 1.4 }, { id: 'hearts', x: 0.42, y: 0.28, size: 0.5 }],
      },
      {
        text: '"Let\'s go slow, together," said Fern. She carried Grandma\'s basket and walked right by her side.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.34, tint: '#e6c3a3', expr: 'happy', acc: ['glasses'], hold: 'cane' }, { who: 'fox', x: 0.58, expr: 'happy', hold: 'basket' }],
      },
      {
        text: 'Going slowly, they saw so much more. A snail with a stripy shell. A butterfly, napping on a flower.',
        bg: 'meadow', cast: [{ who: 'fox', x: 0.18, tint: '#e6c3a3', expr: 'happy', acc: ['glasses'], hold: 'cane' }, { who: 'fox', x: 0.4, expr: 'surprised' }], props: [{ id: 'snail', x: 0.62, y: 0.93, size: 1.6 }, { id: 'flower', x: 0.82, size: 1.3 }, { id: 'butterfly', x: 0.82, y: 0.68 }],
      },
      {
        text: 'At the pond, Grandma told funny stories. "When I was little, I fell into this very pond!" she laughed. Fern laughed so hard she snorted.',
        bg: 'pond', cast: [{ who: 'fox', x: 0.2, tint: '#e6c3a3', pose: 'wave', expr: 'happy', acc: ['glasses'] }, { who: 'fox', x: 0.84, pose: 'held', expr: 'happy' }, { who: 'duck', x: 0.52, y: 0.74, swim: true, expr: 'happy' }],
      },
      {
        text: 'Now Sunday is Fern\'s favorite day of the week. Slow walks with Grandma are the very best walks of all.',
        bg: 'sunset', cast: [{ who: 'fox', x: 0.38, y: 0.9, tint: '#e6c3a3', pose: 'sit', expr: 'happy', acc: ['glasses'] }, { who: 'fox', x: 0.6, y: 0.9, pose: 'sit', expr: 'happy' }], props: [{ id: 'picnic', x: 0.5, y: 0.98, size: 1.5 }, { id: 'hearts', x: 0.5, y: 0.3, size: 0.7 }],
      },
    ],
  },
  {
    id: 'pips-listening-ears',
    title: "Pip's Listening Ears",
    kind: 'book',
    moral: 'Good listeners watch, hear, and wait quietly. When we really listen, we learn so much more.',
    cover: { bg: '#e6f4ff', color: '#2b6cb0', who: ['bunny', 'owl'] },
    pages: [
      {
        text: 'Pip the bunny had the longest ears in the whole class. But sometimes his ears were busy wiggling, instead of listening.',
        bg: 'classroom', cast: [{ who: 'owl', x: 0.2, expr: 'happy', acc: ['glasses'] }, { who: 'bunny', x: 0.52, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.8, expr: 'happy' }],
      },
      {
        text: '"Today we will make paper boats," said Teacher Olive. "First, fold the paper in half. Then..." But Pip was already folding. Flip, flap, fold!',
        bg: 'classroom', cast: [{ who: 'owl', x: 0.2, pose: 'wave', expr: 'happy', acc: ['glasses'] }, { who: 'bunny', x: 0.56, pose: 'held', expr: 'happy', hold: 'paperboat' }],
      },
      {
        text: 'Pip was so busy chatting with Biscuit that he missed the rest. "Fold the corners down," said Olive, "and press every edge tight."',
        bg: 'classroom', cast: [{ who: 'owl', x: 0.18, pose: 'wave', expr: 'normal', acc: ['glasses'] }, { who: 'bunny', x: 0.54, pose: 'wave', expr: 'happy', flip: true }, { who: 'puppy', x: 0.8, expr: 'happy' }],
      },
      {
        text: 'Outside, everyone put their boats in a big puddle. Kai\'s boat floated. Nina\'s boat floated. Pip\'s boat went glub, glub, glub.',
        bg: 'meadow', cast: [{ who: 'kai', x: 0.12, expr: 'happy' }, { who: 'nina', x: 0.3, expr: 'happy' }, { who: 'bunny', x: 0.88, expr: 'surprised' }], props: [{ id: 'puddle', x: 0.6, y: 0.97, size: 2.5 }, { id: 'paperboat', x: 0.48, y: 0.93, size: 1.5, color: '#ffd36b' }, { id: 'paperboat', x: 0.72, y: 0.94, size: 1.5, color: '#9fd6ff' }, { id: 'paperboat', x: 0.6, y: 0.97, size: 1.5, color: 'sunk' }],
      },
      {
        text: 'Pip\'s ears drooped. "Why did mine sink?" Teacher Olive smiled kindly. "Did you hear all of the steps?" Pip shook his head.',
        bg: 'meadow', cast: [{ who: 'bunny', x: 0.4, expr: 'sad' }, { who: 'owl', x: 0.7, expr: 'happy', acc: ['glasses'] }], props: [{ id: 'puddle', x: 0.16, y: 0.97, size: 1.4 }, { id: 'paperboat', x: 0.16, y: 0.97, size: 1.3, color: 'sunk' }],
      },
      {
        text: 'Olive smiled. "Good listeners use their eyes to watch, their ears to hear, and their mouths to stay quiet."',
        bg: 'classroom', cast: [{ who: 'owl', x: 0.3, pose: 'wave', expr: 'happy', acc: ['glasses'] }, { who: 'bunny', x: 0.64, expr: 'normal' }],
      },
      {
        text: 'So Pip tried again. His eyes watched, his ears listened, and his mouth stayed zipped. Fold, press, fold!',
        bg: 'classroom', cast: [{ who: 'owl', x: 0.2, expr: 'happy', acc: ['glasses'] }, { who: 'bunny', x: 0.52, pose: 'held', expr: 'happy', hold: 'paperboat' }], props: [{ id: 'sparkles', x: 0.52, y: 0.25, size: 0.6 }],
      },
      {
        text: 'Pip\'s new boat sailed all the way across the puddle. "Listening really works!" he cheered, and his ears did a happy wiggle.',
        bg: 'meadow', cast: [{ who: 'bunny', x: 0.22, pose: 'held', expr: 'happy' }, { who: 'owl', x: 0.84, expr: 'happy', acc: ['glasses'] }], props: [{ id: 'puddle', x: 0.54, y: 0.97, size: 2.4 }, { id: 'paperboat', x: 0.6, y: 0.94, size: 1.7, color: '#ff9ec7' }, { id: 'confetti', x: 0.5, y: 0.25, size: 0.7 }],
      },
    ],
  },
  {
    id: 'biscuit-waits-his-turn',
    title: 'Biscuit Waits His Turn',
    kind: 'book',
    moral: 'Waiting your turn is fair and kind. Your turn always comes, and waiting with friends can be fun too.',
    cover: { bg: '#e9ffd9', color: '#3a8a2a', who: ['puppy', 'penguin', 'kitty'] },
    pages: [
      {
        text: 'Biscuit the puppy loved the playground. He loved the swings and the sandbox. But most of all, he loved the big red slide.',
        bg: 'playground', cast: [{ who: 'puppy', x: 0.4, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'There was a long line for the slide. Pebble, Pepper, and Puddle were all waiting. Biscuit zoomed right to the front!',
        bg: 'playground', cast: [{ who: 'duck', x: 0.3, expr: 'surprised' }, { who: 'kitty', x: 0.46, expr: 'surprised' }, { who: 'penguin', x: 0.62, expr: 'surprised' }, { who: 'puppy', x: 0.76, pose: 'held', expr: 'happy' }],
      },
      {
        text: '"Hey, no fair!" said Pepper. "We were here first," said Puddle. Everyone grumbled, and the slide wasn\'t fun anymore.',
        bg: 'playground', cast: [{ who: 'duck', x: 0.3, expr: 'mad' }, { who: 'kitty', x: 0.46, expr: 'mad' }, { who: 'penguin', x: 0.62, expr: 'sad' }, { who: 'puppy', x: 0.76, expr: 'surprised' }],
      },
      {
        text: 'Biscuit\'s tail drooped. Then Pebble said, "Waiting is hard. But we can make it fun. Want to play I Spy while we wait?"',
        bg: 'playground', cast: [{ who: 'puppy', x: 0.4, expr: 'sad' }, { who: 'penguin', x: 0.62, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'So Biscuit went to the very back of the line. "I spy something yellow," said Pebble. "The sun!" guessed Biscuit.',
        bg: 'playground', cast: [{ who: 'puppy', x: 0.3, pose: 'wave', expr: 'happy' }, { who: 'penguin', x: 0.46, expr: 'happy' }, { who: 'duck', x: 0.6, expr: 'happy' }, { who: 'kitty', x: 0.74, expr: 'happy' }],
      },
      {
        text: 'While he waited, Biscuit cheered for his friends. "Go, Pepper! Wow, Puddle, what a zoom!"',
        bg: 'playground', cast: [{ who: 'puppy', x: 0.2, pose: 'held', expr: 'happy' }, { who: 'penguin', x: 0.36, expr: 'happy' }, { who: 'duck', x: 0.5, pose: 'held', expr: 'happy' }, { who: 'kitty', x: 0.66, y: 0.56, size: 0.8, pose: 'sit', expr: 'happy', ride: 'sliding' }],
      },
      {
        text: 'And then... it was Biscuit\'s turn! He climbed up high and zoomed down. Whee! It felt even better because he had waited.',
        bg: 'playground', cast: [{ who: 'penguin', x: 0.2, pose: 'wave', expr: 'happy' }, { who: 'duck', x: 0.34, expr: 'happy' }, { who: 'kitty', x: 0.48, pose: 'held', expr: 'happy' }, { who: 'puppy', x: 0.66, y: 0.56, size: 0.8, pose: 'sit', expr: 'happy', ride: 'sliding' }],
      },
      {
        text: 'After that, Biscuit always waited for his turn. And waiting with friends, he found, could be almost as fun as sliding.',
        bg: 'playground', cast: [{ who: 'puppy', x: 0.24, expr: 'happy' }, { who: 'penguin', x: 0.4, expr: 'happy' }, { who: 'kitty', x: 0.56, expr: 'happy' }, { who: 'duck', x: 0.72, expr: 'happy' }], props: [{ id: 'hearts', x: 0.48, y: 0.26, size: 0.6 }],
      },
    ],
  },
  {
    id: 'embers-big-mad-feeling',
    title: "Ember's Big Mad Feeling",
    kind: 'book',
    moral: 'Big feelings are okay. When you feel mad, take slow breaths, count to five, and use your words to say how you feel.',
    cover: { bg: '#ffd9cc', color: '#c2410c', who: ['dragon', 'owl'] },
    pages: [
      {
        text: 'Ember the dragon was building the tallest block tower ever. One block, two blocks, three blocks... nine blocks high!',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.3, pose: 'held', expr: 'happy' }], props: [{ id: 'blocks', x: 0.58 }],
      },
      {
        text: 'Then her tail gave a tiny swish. Crash! The tower tumbled down, and blocks bounced all over the floor.',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.28, expr: 'surprised' }], props: [{ id: 'blocks', x: 0.62, color: 'fallen', size: 0.9 }],
      },
      {
        text: 'Ember felt a hot, fizzy feeling. Her cheeks went red, and her nose went puff, puff, puff. Little clouds of steam came out!',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.42, expr: 'mad' }], props: [{ id: 'steam', x: 0.42, y: 0.4 }, { id: 'blocks', x: 0.62, color: 'fallen', size: 0.7 }],
      },
      {
        text: '"I\'m so mad!" Ember roared, and she stomped her feet. Stomp, stomp, stomp! Olive the owl poked her head into the cave.',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.36, pose: 'held', expr: 'mad' }, { who: 'owl', x: 0.84, expr: 'surprised' }], props: [{ id: 'steam', x: 0.36, y: 0.36 }, { id: 'blocks', x: 0.6, color: 'fallen', size: 0.6 }],
      },
      {
        text: '"Big feelings are okay," Olive said softly. "Let\'s help that mad feeling get smaller. First, pretend to smell a flower."',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.34, expr: 'mad' }, { who: 'owl', x: 0.68, expr: 'happy', hold: 'flower' }],
      },
      {
        text: 'Ember breathed in slowly, like smelling a flower. Then she breathed out slowly, like blowing out a candle. Whoooo.',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.38, pose: 'sit', expr: 'normal' }, { who: 'owl', x: 0.7, pose: 'sit', expr: 'happy' }], props: [{ id: 'wind', x: 0.56, y: 0.5, size: 0.4 }],
      },
      {
        text: 'She did it again, and counted to five. One, two, three, four, five. The hot, fizzy feeling began to melt away.',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.4, pose: 'sit', expr: 'happy' }, { who: 'owl', x: 0.7, pose: 'sit', expr: 'happy' }], props: [{ id: 'sparkles', x: 0.4, y: 0.25, size: 0.6 }],
      },
      {
        text: '"I felt mad because my tower fell," Ember said. "Thank you for telling me," said Olive. "Let\'s build it again, together!"',
        bg: 'cave', cast: [{ who: 'dragon', x: 0.28, pose: 'held', expr: 'happy' }, { who: 'owl', x: 0.8, pose: 'held', expr: 'happy' }], props: [{ id: 'blocks', x: 0.54 }, { id: 'hearts', x: 0.54, y: 0.18, size: 0.6 }],
      },
    ],
  },
  {
    id: 'ruby-the-super-helper',
    title: 'Ruby the Super Helper',
    kind: 'book',
    moral: 'When everyone helps at home, the work gets done faster, and there is more time for fun together.',
    cover: { bg: '#fde2f3', color: '#b0307a', who: ['mom', 'ruby', 'dad'] },
    pages: [
      {
        text: 'Saturday at Ruby\'s house was very busy. Mom was washing dishes. Dad was sweeping. And the laundry basket was piled to the top.',
        bg: 'kitchen', cast: [{ who: 'mom', x: 0.18, expr: 'normal' }, { who: 'dad', x: 0.44, expr: 'normal', hold: 'broom' }, { who: 'ruby', x: 0.86, expr: 'normal' }], props: [{ id: 'laundry', x: 0.66, size: 1.3 }],
      },
      {
        text: '"When can we play?" asked Ruby. "When the chores are done," said Dad. Ruby had an idea, and put on her cape. "Super Helper is here!"',
        bg: 'kitchen', cast: [{ who: 'dad', x: 0.26, expr: 'surprised', hold: 'broom' }, { who: 'ruby', x: 0.6, pose: 'held', expr: 'happy', acc: ['cape'] }], props: [{ id: 'sparkles', x: 0.6, y: 0.3, size: 0.7 }],
      },
      {
        text: 'First, she sorted the laundry. Stripy socks with stripy socks, and spotty socks with spotty socks. One sock was hiding in a sleeve. Sneaky sock!',
        bg: 'bedroom', cast: [{ who: 'ruby', x: 0.38, pose: 'held', expr: 'happy', acc: ['cape'], hold: 'socks' }], props: [{ id: 'laundry', x: 0.64, size: 1.5 }],
      },
      {
        text: 'Next, she watered the plants. Not too much, and not too little. The flowers looked like they were saying thank you.',
        bg: 'garden', cast: [{ who: 'ruby', x: 0.34, expr: 'happy', acc: ['cape'], hold: 'wateringcan' }], props: [{ id: 'flowers', x: 0.6, y: 0.95 }, { id: 'flowers', x: 0.78, y: 0.97, color: '#ff9a6b' }],
      },
      {
        text: 'Then she set the table. A plate, a fork, and a cup for everyone. She even folded the napkins into little hats.',
        bg: 'kitchen', cast: [{ who: 'ruby', x: 0.16, pose: 'held', expr: 'happy', acc: ['cape'] }], props: [{ id: 'settable', x: 0.6, size: 1.15 }],
      },
      {
        text: 'Mom and Dad stopped and stared. "Wow! Who did all this?" Ruby put her hands on her hips. "Super Helper did!"',
        bg: 'kitchen', cast: [{ who: 'mom', x: 0.18, expr: 'surprised' }, { who: 'ruby', x: 0.5, pose: 'wave', expr: 'happy', acc: ['cape'] }, { who: 'dad', x: 0.82, expr: 'surprised' }], props: [{ id: 'sparkles', x: 0.5, y: 0.28, size: 0.7 }],
      },
      {
        text: 'With everyone helping, the chores were done before lunch. "Now we have time to play," said Mom. "What should we do?"',
        bg: 'town', cast: [{ who: 'mom', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'ruby', x: 0.5, pose: 'held', expr: 'happy', acc: ['cape'] }, { who: 'dad', x: 0.72, expr: 'happy' }],
      },
      {
        text: 'They went to the park and flew a kite together. "Being a Super Helper is the best," said Ruby. "And the most fun!"',
        bg: 'meadow', cast: [{ who: 'mom', x: 0.2, pose: 'wave', expr: 'happy' }, { who: 'dad', x: 0.42, expr: 'happy' }, { who: 'ruby', x: 0.86, pose: 'held', expr: 'happy', acc: ['cape'] }], props: [{ id: 'kite', x: 0.66, y: 0.2, color: '#ff9ec7' }],
      },
    ],
  },
];

const MORE_MOVIES: Story[] = [
  {
    id: 'pebbles-brave-checkup',
    title: "Pebble's Brave Checkup",
    kind: 'movie',
    moral: 'Doctors help keep us healthy. It\'s okay to feel scared, and being brave means taking a deep breath and trying.',
    cover: { bg: '#d4f5ef', color: '#127a6a', who: ['penguin', 'elephant'] },
    pages: [
      {
        text: 'Today was Pebble the penguin\'s checkup at the doctor. His flippers felt all fluttery. "What if it\'s scary?" he whispered.',
        bg: 'town', cast: [{ who: 'penguin', x: 0.34, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }, { who: 'penguin', x: 0.56, expr: 'surprised' }],
      },
      {
        text: 'In the waiting room, there was a fish tank. A little orange fish swam up and blew a bubble at Pebble. Blub!',
        bg: 'clinic', cast: [{ who: 'penguin', x: 0.3, expr: 'surprised' }, { who: 'penguin', x: 0.52, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }], props: [{ id: 'bubbles', x: 0.2, y: 0.56, size: 0.6 }],
      },
      {
        text: '"Hello, Pebble!" said Doctor Peanut, the elephant. "Today I\'ll check that you\'re growing big and strong. I\'ll tell you everything before I do it."',
        bg: 'clinic', cast: [{ who: 'penguin', x: 0.16, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }, { who: 'penguin', x: 0.36, expr: 'normal' }, { who: 'elephant', x: 0.66, pose: 'wave', expr: 'happy', acc: ['stethoscope'] }],
      },
      {
        text: 'First, Pebble stood on the scale. "Look how much you\'ve grown!" said Doctor Peanut. Pebble stood up extra tall.',
        bg: 'clinic', cast: [{ who: 'elephant', x: 0.3, expr: 'happy', acc: ['stethoscope'] }, { who: 'penguin', x: 0.53, y: 0.83, pose: 'held', expr: 'happy' }], props: [{ id: 'scale', x: 0.53 }, { id: 'sparkles', x: 0.53, y: 0.2, size: 0.5 }],
      },
      {
        text: 'Next came the stethoscope. "It might feel a little cold," said the doctor. Thump, thump, thump! "That\'s your strong, happy heart."',
        bg: 'clinic', cast: [{ who: 'elephant', x: 0.58, pose: 'held', expr: 'happy', hold: 'stethoscope' }, { who: 'penguin', x: 0.86, y: 0.57, pose: 'sit', expr: 'surprised' }], props: [{ id: 'hearts', x: 0.86, y: 0.2, size: 0.5 }],
      },
      {
        text: '"Now open wide, and say ahh!" Pebble opened his beak as wide as a treasure chest. "Ahhhhh!"',
        bg: 'clinic', cast: [{ who: 'elephant', x: 0.6, expr: 'happy', acc: ['stethoscope'] }, { who: 'penguin', x: 0.86, y: 0.57, pose: 'sit', expr: 'surprised' }],
      },
      {
        text: 'Then it was time for a quick little poke, to help his body stay healthy. Pebble\'s tummy flipped. "I\'m scared," he whispered.',
        bg: 'clinic', cast: [{ who: 'penguin', x: 0.4, size: 1.2, tint: '#8f86c4', expr: 'normal', acc: ['bow'] }, { who: 'elephant', x: 0.62, expr: 'normal', acc: ['stethoscope'] }, { who: 'penguin', x: 0.86, y: 0.57, pose: 'sit', expr: 'sad' }],
      },
      {
        text: 'Mama gave him a big hug. "It\'s okay to feel scared," she said. "Squeeze my flipper, and let\'s count to three together."',
        bg: 'clinic', cast: [{ who: 'penguin', x: 0.4, size: 1.2, tint: '#8f86c4', pose: 'held', expr: 'happy', acc: ['bow'] }, { who: 'penguin', x: 0.58, pose: 'held', expr: 'normal' }], props: [{ id: 'hearts', x: 0.49, y: 0.28, size: 0.6 }],
      },
      {
        text: '"One, two, three!" Pinch! "Is that it?" asked Pebble. "All done!" said Doctor Peanut. It was quicker than a sneeze.',
        bg: 'clinic', cast: [{ who: 'elephant', x: 0.28, pose: 'wave', expr: 'happy', acc: ['stethoscope'] }, { who: 'penguin', x: 0.54, expr: 'surprised' }, { who: 'penguin', x: 0.84, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }],
      },
      {
        text: 'Pebble got a shiny star sticker for being so brave. "My tummy was fluttery, but I did it!" he said proudly.',
        bg: 'clinic', cast: [{ who: 'elephant', x: 0.24, expr: 'happy', acc: ['stethoscope'] }, { who: 'penguin', x: 0.5, pose: 'held', expr: 'happy', hold: 'sticker' }, { who: 'penguin', x: 0.8, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }], props: [{ id: 'confetti', x: 0.5, y: 0.25, size: 0.8 }],
      },
      {
        text: 'On the way home, Pebble waddled like a hero. "Next time," he said, "I\'ll help my little friends feel brave too!"',
        bg: 'town', cast: [{ who: 'penguin', x: 0.32, size: 1.2, tint: '#8f86c4', expr: 'happy', acc: ['bow'] }, { who: 'penguin', x: 0.56, pose: 'wave', expr: 'happy', acc: ['medal'] }], props: [{ id: 'stars', x: 0.56, y: 0.22, size: 0.5 }],
      },
    ],
  },
  {
    id: 'zoes-magic-crayons',
    title: "Zoe's Magic Crayons",
    kind: 'movie',
    moral: 'Your imagination is a kind of magic. With an idea and a crayon, you can make almost anything.',
    cover: { bg: '#fff3d6', color: '#7a3fc1', who: ['zoe', 'dragon'], tints: ['', '#ffb3d9'] },
    pages: [
      {
        text: 'It was a rainy day, so Zoe couldn\'t play outside. No swings, no slide, and no puddle jumping. "There\'s nothing to do," she sighed.',
        bg: 'bedroomrain', cast: [{ who: 'zoe', x: 0.46, expr: 'sad' }],
      },
      {
        text: 'Then she found a box of crayons under her bed. They were glowing! "Draw something," whispered a crayon. "Anything you can imagine."',
        bg: 'bedroomrain', cast: [{ who: 'zoe', x: 0.4, pose: 'held', expr: 'surprised' }], props: [{ id: 'crayons', x: 0.6, y: 0.95 }],
      },
      {
        text: 'Zoe drew a door on her wall, with a round purple doorknob. And then... creak! The door swung open.',
        bg: 'bedroomrain', cast: [{ who: 'zoe', x: 0.28, pose: 'held', expr: 'surprised', hold: 'crayons' }], props: [{ id: 'drawndoor', x: 0.53, y: 0.783, color: 'open' }],
      },
      {
        text: 'Behind the door was a world made of drawings. The trees were scribbly, the sun had a smiley face, and the grass was crayon green.',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.42, pose: 'wave', expr: 'happy' }],
      },
      {
        text: '"An adventure needs a friend," said Zoe. So she drew a pink dragon, and it blinked. "Hello! I\'m Doodle!" said the dragon.',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.3, pose: 'held', expr: 'happy', hold: 'crayons' }, { who: 'dragon', x: 0.66, tint: '#ffb3d9', pose: 'wave', expr: 'happy' }], props: [{ id: 'sparkles', x: 0.66, y: 0.3, size: 0.7 }],
      },
      {
        text: 'They came to a wide, wiggly river. "How will we cross?" asked Doodle. Zoe thought hard. Then she drew a rainbow bridge!',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.16, pose: 'held', expr: 'happy', hold: 'crayons' }, { who: 'dragon', x: 0.86, tint: '#ffb3d9', expr: 'surprised' }], props: [{ id: 'river', x: 0.5, y: 0.9 }, { id: 'rainbowbridge', x: 0.5, y: 0.9 }],
      },
      {
        text: 'Next came a hill so tall that it touched the clouds. Zoe drew a stripy hot air balloon, and up, up, up they floated!',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.47, y: 0.705, size: 0.43, pose: 'wave', expr: 'happy' }, { who: 'dragon', x: 0.538, y: 0.705, size: 0.42, tint: '#ffb3d9', expr: 'happy' }], props: [{ id: 'hotairballoon', x: 0.5, y: 0.72, size: 0.86 }],
      },
      {
        text: 'At the top, they met a little cloud with a frown. "I can\'t make rain," it sniffled, "and the flowers down below are so thirsty."',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.26, expr: 'surprised' }, { who: 'dragon', x: 0.8, tint: '#ffb3d9', expr: 'sad' }], props: [{ id: 'cloudface', x: 0.54, y: 0.3, size: 1.6, color: 'sad' }],
      },
      {
        text: 'Zoe drew a giant watering can, as big as a bathtub. Doodle helped her pour. Splish, splash! The flowers sprang up and danced.',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.2, pose: 'held', expr: 'happy' }, { who: 'dragon', x: 0.42, tint: '#ffb3d9', pose: 'held', expr: 'happy' }], props: [{ id: 'wateringcan', x: 0.62, y: 0.62, size: 2 }, { id: 'pour', x: 0.76, y: 0.42, size: 1.3 }, { id: 'flowers', x: 0.84, y: 0.95 }, { id: 'flowers', x: 0.96, y: 0.97, color: '#ffd36b' }, { id: 'sparkles', x: 0.88, y: 0.6, size: 0.6 }],
      },
      {
        text: 'Then the magic crayon twinkled. "Time to go home," it said. "But you can come back whenever you imagine."',
        bg: 'drawn', cast: [{ who: 'zoe', x: 0.36, expr: 'normal', hold: 'crayons' }, { who: 'dragon', x: 0.6, tint: '#ffb3d9', pose: 'wave', expr: 'happy' }], props: [{ id: 'drawndoor', x: 0.86, color: 'open' }],
      },
      {
        text: 'Zoe stepped back into her bedroom. The rain had stopped. And on her wall was a tiny drawing of a pink dragon, waving hello.',
        bg: 'bedroom', cast: [{ who: 'zoe', x: 0.3, pose: 'wave', expr: 'happy' }], props: [{ id: 'drawing', x: 0.53, y: 0.72 }, { id: 'sparkles', x: 0.53, y: 0.5, size: 0.5 }],
      },
    ],
  },
  {
    id: 'pips-little-rain-cloud',
    title: "Pip's Little Rain Cloud",
    kind: 'movie',
    moral: 'It\'s okay to feel sad. Telling someone you trust how you feel can make heavy feelings lighter.',
    cover: { bg: '#cfd8ea', color: '#4a5a8a', who: ['bunny', 'elephant'] },
    pages: [
      {
        text: 'Pip the bunny\'s best friend, Puddle the duck, moved away to a pond far across the hills. Pip waved until she was a tiny dot.',
        bg: 'meadow', cast: [{ who: 'bunny', x: 0.3, pose: 'wave', expr: 'sad' }, { who: 'duck', x: 0.7, y: 0.68, size: 0.3, pose: 'wave', expr: 'happy' }],
      },
      {
        text: 'The next morning, a little gray rain cloud appeared over Pip\'s head. Drip, drip, drip.',
        bg: 'meadow', cast: [{ who: 'bunny', x: 0.5, expr: 'sad' }], props: [{ id: 'raincloud', x: 0.5, y: 0.28, size: 1.3 }],
      },
      {
        text: 'Wherever Pip went, the cloud went too. To breakfast. To the playground. It even followed him into the bath!',
        bg: 'playground', cast: [{ who: 'bunny', x: 0.4, expr: 'sad' }], props: [{ id: 'raincloud', x: 0.4, y: 0.28, size: 1.3 }],
      },
      {
        text: '"Are you okay, Pip?" asked Peanut the elephant. "I\'m fine," said Pip. But his little cloud rained even harder.',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.3, expr: 'surprised' }, { who: 'bunny', x: 0.66, expr: 'sad' }], props: [{ id: 'raincloud', x: 0.66, y: 0.27, size: 1.5 }],
      },
      {
        text: 'Pip tried to hide from his cloud. He hid under an umbrella. He hid behind a tree. But the cloud always found him.',
        bg: 'meadow', cast: [{ who: 'bunny', x: 0.74, expr: 'sad', hold: 'umbrella' }], props: [{ id: 'raincloud', x: 0.7, y: 0.14 }],
      },
      {
        text: 'That night, Pip couldn\'t sleep. His cloud rumbled very softly. "I wish I could tell someone," he whispered.',
        bg: 'bedroom', time: 'night', cast: [{ who: 'bunny', x: 0.45, pose: 'sit', expr: 'sad' }], props: [{ id: 'raincloud', x: 0.45, y: 0.4, size: 1.2 }],
      },
      {
        text: 'In the morning, Peanut sat down next to him. "You can tell me anything," she said gently. "Even sad things."',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.34, pose: 'sit', expr: 'happy' }, { who: 'bunny', x: 0.62, pose: 'sit', expr: 'sad' }], props: [{ id: 'raincloud', x: 0.62, y: 0.4, size: 1.2 }],
      },
      {
        text: 'Pip took a big breath. "I miss Puddle," he said. "I feel sad and lonely, and I didn\'t want anyone to know."',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.34, pose: 'sit', expr: 'normal' }, { who: 'bunny', x: 0.62, pose: 'sit', expr: 'sad' }], props: [{ id: 'raincloud', x: 0.62, y: 0.4, size: 1.2 }],
      },
      {
        text: 'Peanut gave him a big, warm hug. "Thank you for telling me," she said. "Feelings get lighter when we share them."',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.4, pose: 'held', expr: 'happy' }, { who: 'bunny', x: 0.6, pose: 'held', expr: 'normal' }], props: [{ id: 'raincloud', x: 0.66, y: 0.3, size: 0.7, color: 'happy' }, { id: 'hearts', x: 0.46, y: 0.28, size: 0.6 }],
      },
      {
        text: 'And just like that, the cloud shrank smaller, and smaller. Then a tiny rainbow peeked out!',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.3, expr: 'happy' }, { who: 'bunny', x: 0.6, pose: 'held', expr: 'surprised' }], props: [{ id: 'rainbow', x: 0.6, y: 0.4, size: 0.55 }, { id: 'raincloud', x: 0.72, y: 0.3, size: 0.4, color: 'happy' }],
      },
      {
        text: 'Peanut had an idea. Together, they wrote a letter to Puddle, with a drawing of the two of them waving.',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.3, expr: 'happy' }, { who: 'bunny', x: 0.62, pose: 'held', expr: 'happy', hold: 'letter' }],
      },
      {
        text: 'A week later, a letter came back. "I miss you too!" it said. Pip\'s cloud was gone, and his heart felt sunny again.',
        bg: 'meadow', cast: [{ who: 'elephant', x: 0.26, expr: 'happy' }, { who: 'bunny', x: 0.54, pose: 'held', expr: 'happy', hold: 'letter' }], props: [{ id: 'hearts', x: 0.54, y: 0.24, size: 0.7 }, { id: 'sparkles', x: 0.8, y: 0.4, size: 0.6 }],
      },
    ],
  },
  {
    id: 'ruby-speaks-up',
    title: 'Ruby Speaks Up',
    kind: 'movie',
    moral: 'When someone is unkind to a friend, you can be brave and speak up. Friends help each other feel safe.',
    cover: { bg: '#d8eccf', color: '#2f6b3a', who: ['ruby', 'turtle'] },
    pages: [
      {
        text: 'Ruby\'s class went on a nature walk in the forest. Teacher Olive led the way, holding a map.',
        bg: 'forest', cast: [{ who: 'owl', x: 0.14, expr: 'happy', acc: ['glasses'], hold: 'map' }, { who: 'ruby', x: 0.34, expr: 'happy' }, { who: 'kai', x: 0.52, expr: 'happy' }, { who: 'sam', x: 0.7, expr: 'happy' }, { who: 'turtle', x: 0.88, expr: 'happy' }],
      },
      {
        text: 'Everyone hurried along the path. Everyone except Tully the turtle. He walked slowly, one careful step at a time.',
        bg: 'forest', cast: [{ who: 'ruby', x: 0.18, pose: 'held', expr: 'happy' }, { who: 'kai', x: 0.36, pose: 'held', expr: 'happy' }, { who: 'sam', x: 0.54, pose: 'held', expr: 'happy' }, { who: 'turtle', x: 0.86, expr: 'normal' }],
      },
      {
        text: '"Hurry up, Slowpoke!" giggled Kai. "Slowpoke, slowpoke!" laughed Sam. Tully tucked his head down low.',
        bg: 'forest', cast: [{ who: 'kai', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'sam', x: 0.48, expr: 'happy' }, { who: 'turtle', x: 0.8, size: 0.9, expr: 'sad' }],
      },
      {
        text: 'Ruby felt a funny, wiggly feeling in her tummy. The joke wasn\'t funny to Tully. It was hurting his feelings.',
        bg: 'forest', cast: [{ who: 'ruby', x: 0.38, expr: 'normal' }, { who: 'turtle', x: 0.74, size: 0.9, expr: 'sad' }],
      },
      {
        text: 'Ruby took a big breath and stepped forward. "Please stop," she said. "That\'s not kind. Tully is our friend."',
        bg: 'forest', cast: [{ who: 'kai', x: 0.18, expr: 'surprised' }, { who: 'sam', x: 0.36, expr: 'surprised' }, { who: 'ruby', x: 0.6, pose: 'wave', expr: 'normal' }, { who: 'turtle', x: 0.85, size: 0.9, expr: 'sad' }],
      },
      {
        text: 'Kai and Sam looked at Tully\'s sad face. "Oh," said Kai quietly. "We were just being silly. We didn\'t think."',
        bg: 'forest', cast: [{ who: 'kai', x: 0.28, expr: 'surprised' }, { who: 'sam', x: 0.48, expr: 'normal' }, { who: 'turtle', x: 0.78, size: 0.9, expr: 'sad' }],
      },
      {
        text: '"Sorry, Tully," said Sam. "Sorry," said Kai. Tully peeked up and smiled. "Thank you for saying sorry."',
        bg: 'forest', cast: [{ who: 'kai', x: 0.22, expr: 'normal' }, { who: 'sam', x: 0.42, expr: 'normal' }, { who: 'turtle', x: 0.66, expr: 'happy' }, { who: 'ruby', x: 0.88, expr: 'happy' }], props: [{ id: 'hearts', x: 0.66, y: 0.3, size: 0.5 }],
      },
      {
        text: 'Then Tully pointed at the ground. "Shh. Look!" Under a leaf sat a tiny shiny beetle, as green as an emerald.',
        bg: 'forest', cast: [{ who: 'turtle', x: 0.28, pose: 'wave', expr: 'happy' }, { who: 'ruby', x: 0.8, pose: 'held', expr: 'surprised', hold: 'magnifier' }], props: [{ id: 'beetle', x: 0.54, y: 0.92, size: 2.4 }],
      },
      {
        text: '"How did you see that?" asked Sam. Tully smiled. "When you go slowly, you notice all the tiny wonders."',
        bg: 'forest', cast: [{ who: 'sam', x: 0.26, expr: 'surprised' }, { who: 'turtle', x: 0.68, expr: 'happy' }], props: [{ id: 'beetle', x: 0.46, y: 0.93, size: 2 }],
      },
      {
        text: 'So everyone slowed down. They found a snail, a mushroom like a red umbrella, and a spider web sparkling with dew.',
        bg: 'forest', cast: [{ who: 'kai', x: 0.1, expr: 'happy' }, { who: 'sam', x: 0.4, expr: 'surprised' }, { who: 'ruby', x: 0.89, pose: 'held', expr: 'happy', hold: 'magnifier' }], props: [{ id: 'snail', x: 0.25, y: 0.95, size: 1.5 }, { id: 'mushroom', x: 0.56, y: 0.95, size: 1.4 }, { id: 'web', x: 0.7, y: 0.56 }],
      },
      {
        text: 'After the walk, Tully walked next to Ruby. "Thank you for speaking up for me," he said. "That\'s what friends do," said Ruby.',
        bg: 'forest', cast: [{ who: 'ruby', x: 0.38, expr: 'happy' }, { who: 'turtle', x: 0.6, expr: 'happy' }, { who: 'owl', x: 0.86, expr: 'happy', acc: ['glasses'] }], props: [{ id: 'hearts', x: 0.49, y: 0.26, size: 0.7 }],
      },
    ],
  },
];

export const STORIES: Story[] = [...BOOKS, ...MORE_BOOKS, ...MOVIES, ...MORE_MOVIES];
