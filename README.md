# Doll Role Play

A dress-up and pretend-play game with a whole town to explore. Make friends, style their outfits and
hair, decorate the house room by room, and visit the school, playground, piano theater, beauty salon and
boutique. Change the season any time: spring blossoms, summer sun, falling leaves or snow.

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
- **Decorate:** drag furniture, appliances and decorations into the bedroom, living room and kitchen. Tap
  things to use them: lamps, TV, fireplace, stove, sink, fridge (out pops a snack!), toy chest and more.
  Tap again for paint, flip and put-away buttons. **Room style** changes wallpaper and floors.
- **Snacks:** drop food on a friend to feed them.
- **School:** take a lesson (counting, adding, patterns) for coins, or draw on the chalkboard.
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

Open `/gallery.html?s=dolls` (or `wear`, `hair`, `furniture`) under `npm run dev` to see every piece of art at once.
For clothes, add `&slot=top`, `&group=Hoodies`, `&age=adult`, `&boy=1`, `&pose=sit` or `&size=300` to narrow it down.
Add `#bedroom`, `#school`, `#theater` and so on to the game's URL to jump straight to a place.

## Code map

| Path | What's there |
| --- | --- |
| `src/art/` | All drawing: dolls, hair and faces (`doll.ts`), body shapes (`body.ts`), furniture (`furniture.ts`), places and seasons (`scenes.ts`), prints (`motifs.ts`) |
| `src/art/wear/` | One catalog file per closet tab. Each builds many items from a few cuts × prints × trims; `base.ts` holds the shared drawing kit and the original items |
| `src/data/` | Rules with no screen code: save format, shop and challenges (`state.ts`), places, quiz, songs |
| `src/engine/` | The interactive scene (drag, drop, sit, eat), sound, and weather/confetti effects |
| `src/ui/` | Screens and panels: town map, tray, closet, shop, challenges, lesson, piano |
