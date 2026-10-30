# The Food Oracle 🔮

An Akinator-style "mind reader" for food. It keeps asking yes/no questions until
it can guess what you're craving, then sends you to a restaurant nearby that
serves it.

## How a game goes

1. The Oracle asks questions like *"Do you want bread?"*, *"Are you in the mood
   for something greasy?"* or *"Would you use chopsticks?"* You answer **Yes /
   Probably / Don't know / Probably not / No**.
2. Each answer re-weights the odds for ~40 dishes. The next question is always
   the one that best splits the dishes still in the running, so the questions
   change based on what you've said.
3. Once one dish clearly leads (after at least 7 questions), it guesses:
   *"I think you're craving… Ramen?"* Say no and it rules that dish out and keeps
   asking. After 30 questions it gives up and offers its top picks.
4. Once you confirm, it asks how far you'll travel, finds where you are (or you
   type a city / zip), and tells you where to go, with directions.

It also checks the time of day: at 8am it leans toward breakfast foods, at 1am
toward late-night food.

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
- `decider.js`: the questions and the guessing engine
- `places.js`: location lookup and the OpenStreetMap restaurant search
- `app.js`: the UI
- `test.js`: `node test.js` plays a simulated game for every dish and checks the Oracle finds it

## Adding to it

- **New dish:** add an entry to `foods.js` with its traits and tags.
- **New question:** add an entry to `QUESTIONS` in `decider.js` with a `match(food)`
  function returning 0–1 (how well the food fits a "yes"). Mark it `filter: true`
  if it's a requirement (for example "Does it need to be vegan?"), where "no"
  shouldn't rule anything out.

Run `node test.js` after changes to make sure every dish can still be guessed.
