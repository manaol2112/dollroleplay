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
  expr?: 'normal' | 'happy' | 'surprised' | 'sleep' | 'yum' | 'sad';
  flip?: boolean;
  size?: number;
  /** Where the feet are, 0..1 down the picture (default about 0.87, the ground). */
  y?: number;
  /** Little extras: crown, party, beanie, scarf, glasses, goggles, helmet, medal, collar, cape, chef, cap, bow, flower, sticks, pondweed, carrot. */
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
  cover: { bg: string; color: string; who: string[] };
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

export const STORIES: Story[] = [...BOOKS, ...MOVIES];
