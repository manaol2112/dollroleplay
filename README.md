# Doll Role Play

A dress-up and pretend-play game with a whole town to explore. Make friends, style their outfits and
hair, decorate the house room by room, and visit the school, playground, theater, beauty salon,
boutique, library, cinema, restaurant, grocery shop, shopping mall, hospital, hotel, car shop and theme
park. Change the season any time: spring blossoms, summer sun, falling leaves or snow.

Everything is drawn in code as crisp vector art, and every sound is synthesized, so there are no image
or audio files to download.

**Play it:** https://manaol2112.github.io/dollroleplay/

On an iPad or iPhone, open that link in Safari, tap **Share**, then **Add to Home Screen**. It opens full
screen like an app, and progress is saved on the device. Every push to `main` runs the tests and, if they
pass, updates the live game.

## How to play

- **Drag friends** up from the tray at the bottom into any room. Drop them on a chair, sofa, bed, swing,
  seesaw, slide, salon chair or piano bench to use it. Drag them back down to the tray to send them home.
- **Tap a friend** to make them giggle, then tap **Dress up** to open the closet.
- **Closet:** over 1,500 clothes and accessories (at least 100 in every tab: tops, bottoms, dresses,
  coats, shoes, hats and bows, glasses and face, necklaces, things to hold, wings and bags), 33 hairstyles,
  eyes, mouths, makeup, stickers, and beards for grown-up men. Recolor clothes and add patterns. Girls and
  boys, in kid, teen and grown-up sizes. Anyone can wear anything.
- **Decorate:** six home rooms (bedroom, living room, kitchen, bathroom, playroom and backyard) and over
  700 pieces of furniture, appliances and decor in 11 design collections (Sweet, Princess, Modern, Cottage,
  Rainbow, Space, Beach, Candy, Woodland, Boho, Retro). Open **Decorate** for the full catalog or drag from
  the tray. Tap things to use them (lamps, TVs, ovens, showers, washing machines, doors, windows...), and
  use the paint, flip, size and put-away buttons. **Room style** has 106 wallpapers, 49 floors, and trim
  and curtain colors.
- **Around town:** scroll the map to 15 buildings. The library, cinema, restaurant, grocery shop, mall,
  hospital, hotel, car shop and theme park can each be decorated like the house, with about 500 extra
  pieces of their own (bookshelves, cinema seats, shelves of food, hospital beds, 63 cars, Ferris wheel,
  carousel, teacups and more), and each has its own activity:
  - **Library:** 14 illustrated picture books, each with a moral (honesty, patience, sharing, kindness,
    bravery...). Tap **Read to me** to hear them read aloud.
  - **Cinema:** 6 animated movies with curtains, subtitles read aloud, and popcorn.
  - **Restaurant:** cook burgers, pizza, sundaes, pancakes and salad for tips.
  - **Grocery shop:** fill the basket from a shopping list.
  - **Hospital:** be the doctor and help patients feel better.
  - **Car shop:** wash, rinse, shine and paint a car, then park it in the backyard.
  - **Hotel:** order room service. **Theme park:** sit friends on rides and watch them go.
- **Salon nails:** paint, decorate and dry nails; the manicure shows on the doll.
- **Sports:** basketball and soccer penalty kicks at the playground.
- **Music:** piano, xylophone, guitar, harp, violin, flute, trumpet and drums at the theater.
- **Snacks:** drop food on a friend to feed them.
- **School:** take a lesson for coins (pick 1st to 5th grade), or draw on the chalkboard.
- **Theater:** play the piano freely, or pick a song and follow the glowing keys. The audience cheers.
- **Salon:** sit a friend in a salon chair and tap **Makeover**.
- **Boutique:** spend coins on new clothes, hairstyles, furniture and wallpaper.
- **Challenges** (the star button) pay coins. There is always a new one, plus a daily gift and a special
  challenge for each season.

## Run it

```bash
npm install
npm run dev      # then open the URL it prints
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Play locally with hot reload |
| `npm run build` | Type-check and build a static site into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the tests: every item and place is drawn in every season, plus saving, shop, challenges, quiz and songs |

Open `/gallery.html?s=dolls` (or `wear`, `hair`, `furniture`, `facades`, `stories`) under `npm run dev` to see every piece of art at once.
For clothes, add `&slot=top`, `&group=Hoodies`, `&age=adult`, `&boy=1`, `&pose=sit` or `&size=300` to narrow it down.
Add `#bedroom`, `#school`, `#library`, `#themepark` and so on to the game's URL to jump straight to a place.

## Code map

| Path | What's there |
| --- | --- |
| `src/art/` | All drawing: dolls, hair and faces (`doll.ts`), body shapes (`body.ts`), furniture (`furniture.ts`, `furn/`), town places (`townplaces.ts`), story pictures (`storyart.ts`), places and seasons (`scenes.ts`), prints (`motifs.ts`) |
| `src/art/wear/` | One catalog file per closet tab. Each builds many items from a few cuts × prints × trims; `base.ts` holds the shared drawing kit and the original items |
| `src/data/` | Rules with no screen code: save format, shop and challenges (`state.ts`), places, quiz, songs, books and movies (`stories.ts`) |
| `src/engine/` | The interactive scene (drag, drop, sit, eat), sound, and weather/confetti effects |
| `src/ui/` | Screens and panels: town map, tray, closet, shop, challenges, lesson, instruments, and the town activities (`activities.ts`: reader, movie player, grocery, kitchen, doctor, car wash) |
