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
- **Closet:** 70+ clothes and accessories, 14 hairstyles, eyes, mouths, makeup and stickers. Recolor
  clothes and add patterns (dots, stripes, hearts, stars, gingham, flowers). Kid, teen and grown-up sizes.
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
Add `#bedroom`, `#school`, `#theater` and so on to the game's URL to jump straight to a place.

## Code map

| Path | What's there |
| --- | --- |
| `src/art/` | All drawing: dolls, hair and faces (`doll.ts`), clothes (`wear.ts`), furniture (`furniture.ts`), places and seasons (`scenes.ts`) |
| `src/data/` | Rules with no screen code: save format, shop and challenges (`state.ts`), places, quiz, songs |
| `src/engine/` | The interactive scene (drag, drop, sit, eat), sound, and weather/confetti effects |
| `src/ui/` | Screens and panels: town map, tray, closet, shop, challenges, lesson, piano |
