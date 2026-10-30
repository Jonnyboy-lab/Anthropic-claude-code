# What Sounds Good? 🍽️

A quick guide for when you can't decide what to eat. It asks up to 10 simple
questions about what you feel like, then shows what you're leaning toward
tonight: a best match plus a few other options that fit, each with links to
find it nearby.

## How it works

1. You answer questions like *"Do you want bread?"*, *"Greasy food?"* or
   *"Something spicy?"* with **Yes / Kind of / No / Don't care**.
2. Each answer re-weights ~40 dishes. The next question is always the one that
   best separates the dishes still in the running, so every question counts.
   It stops early when more questions wouldn't change the result, and you can
   tap **Show my options now** after 4 questions.
3. The results page shows what you leaned toward (Bread, Greasy, Not spicy, …),
   your best match with a % match score, and 3 other options, each with the
   answers it fits.
4. Each option has Google Maps and Yelp links for your city / zip (or "near me"),
   and a **Find restaurants** button that lists real places nearby within the
   distance you pick.

It also checks the time of day, so at night it leans toward dinner and
late-night food.

## Finding a restaurant

Restaurants come from [OpenStreetMap](https://www.openstreetmap.org/) (Overpass
for places, Nominatim for typed addresses), filtered to the dish's cuisine
within your chosen distance and sorted by distance. A Google Maps search link is
always offered as a fallback. No API keys are needed.

## Running it

Plain HTML/CSS/JS with no build step. Open `index.html`, or serve the folder
(browser location needs `https://` or `localhost`):

```sh
cd food-decider
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

- `foods.js`: the dishes and their traits (bread, greasy, spicy, tags like noodles/cheese, …)
- `decider.js`: the questions, question ordering and ranking
- `places.js`: location lookup and the OpenStreetMap restaurant search
- `app.js`: the UI
- `test.js`: `node test.js` simulates someone who'd love each dish answering honestly, and checks that dish comes out on top

## Adding to it

- **New dish:** add an entry to `foods.js` with its traits and tags.
- **New question:** add an entry to `QUESTIONS` in `decider.js` with a `match(food)`
  function returning 0–1 (how well the food fits a "yes"). Mark it `filter: true`
  if it's a requirement (for example "Does it need to be vegan?"), where "no"
  shouldn't rule anything out. Give it short `yes` / `no` labels for the results page.

Run `node test.js` after changes to make sure every dish can still come out on top.
