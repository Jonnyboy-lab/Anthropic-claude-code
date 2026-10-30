# What Should I Eat? 🍽️

A small web app that asks you questions and then decides what you should eat,
and where to get it nearby.

## Questions it asks

1. What meal is this? (breakfast, lunch, dinner, late night)
2. How hungry are you?
3. Do you want bread?
4. Greasy food?
5. How about spice?
6. Any diet preference? (meat, seafood, vegetarian, vegan)
7. Hot meal or something cold?
8. What's the budget?
9. Quick bite or sit-down?
10. Feeling adventurous?
11. How far are you willing to travel?

Each answer scores ~40 dishes (burgers, pho, sushi, tacos, BBQ, bagels…).
Diet and meal time are hard filters; everything else adds or subtracts points.
The best match is shown with the reasons it was picked, plus runner-ups and a
"next idea" button if you don't like the pick.

## Finding a restaurant

Tap **Find places near me** (uses your browser location) or type a city / zip code.
The app searches [OpenStreetMap](https://www.openstreetmap.org/) for restaurants
serving that food within the distance you picked, sorted by distance, with
directions links. There's always a Google Maps search link as a fallback.
No API keys are needed.

## Running it

It's plain HTML/CSS/JS with no build step. Open `index.html` in a browser, or serve
the folder (browser location needs `https://` or `localhost`):

```sh
cd food-decider
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

- `foods.js`: the dishes and their traits (bread, greasy, spicy, price, …)
- `decider.js`: the questions and the scoring logic
- `places.js`: location lookup and the OpenStreetMap restaurant search
- `app.js`: the UI
- `test.js`: tests for the scoring logic (`node test.js`)

To add a dish or a question, edit `foods.js` / `decider.js`.
