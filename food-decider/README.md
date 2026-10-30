# What Sounds Good? 🍽️

A quick mood check for when you can't decide what to eat. Instead of asking
"Do you want Mexican food?", it asks how tonight *feels* and quietly steers
toward food that fits, then shows what you're leaning toward and where to get it.

## How it works

1. Up to 8 mood questions, picked from a pool of 15, like:
   - *If you could eat anywhere tonight, where would you be?* (a neon night
     market, a beach shack, a roadside diner, a spice market, …)
   - *How do you want to feel when you're done?* (stuffed and sleepy, light and
     energized, like I treated myself, …)
   - *Which word makes your mouth water?* (crispy, saucy, melty, slurpy, …)
   - *Be honest: are you trying to be good tonight?*
2. Each answer quietly re-weights ~90 dishes from around the world. The next
   question is whichever best separates the dishes still in the running. You
   can tap **Show my options now** after 4.
3. One practical last question: *anything off the table?* (no meat, vegan, no
   seafood). These are strict rules.
4. The results page shows what you leaned toward (Slurpy, Night market,
   Light, …), your best match with a % match score, and 3 more options, each
   with nearby places plus Google Maps and Yelp links.

It also checks the time of day, so at night it leans toward dinner and
late-night food.

## Finding a restaurant

Tap **Use my location** (or type a city / zip) and pick how far you'll go. Your
best match lists real nearby places from [OpenStreetMap](https://www.openstreetmap.org/),
sorted by distance, with directions; other options show theirs when you tap
**Show places**. If you've already allowed location for the page, it finds you
automatically. No API keys are needed.

**Demo mode:** open `index.html?demo` to use made-up sample restaurants instead,
so you can try it without sharing your location.

## Running it

Plain HTML/CSS/JS with no build step. Open `index.html`, or serve the folder
(browser location needs `https://` or `localhost`):

```sh
cd food-decider
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

- `foods.js`: ~90 dishes and their traits (region, bread, greasy, spicy, textures, …)
- `decider.js`: the mood questions, question ordering and ranking
- `places.js`: location lookup, the OpenStreetMap restaurant search, and demo restaurants
- `app.js`: the UI
- `test.js`: `node test.js` simulates someone in the mood for each dish answering honestly, and checks that dish comes out on top

## Adding to it

- **New dish:** add a `dish(...)` row to `foods.js`. The comment at the top
  explains each column.
- **New question:** add an entry to `QUESTIONS` in `decider.js`. Each answer
  choice has a `label`, a short `tag` for the results page, and a `fit(food)`
  returning 0–1 for how well a dish matches that feeling. Mark a choice
  `neutral: true` if it shouldn't change anything.

Run `node test.js` after changes to make sure every dish can still come out on top.
