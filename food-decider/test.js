// Run with: node test.js
const assert = require("assert");
const { FOODS } = require("./foods.js");
const { QUESTIONS, rankFoods } = require("./decider.js");
const { buildOverpassQuery, distanceMiles } = require("./places.js");

const noRand = () => 0;
const top = (answers) => rankFoods(FOODS, answers, noRand)[0].food.name;

// Greasy, bread-heavy, cheap, fast dinner -> classic comfort food.
const greasy = top({ meal: "dinner", hunger: 2, bread: 2, greasy: 2, spicy: 0, diet: "any", temp: "hot", budget: 1, speed: "fast", novelty: 0 });
assert(["Burger & Fries", "Pizza", "Philly Cheesesteak"].includes(greasy), greasy);

// Vegan answers never return a non-vegan dish.
for (const r of rankFoods(FOODS, { diet: "vegan", meal: "lunch" }, noRand)) assert(r.food.diets.includes("vegan"), r.food.name);

// Breakfast only returns breakfast foods.
for (const r of rankFoods(FOODS, { meal: "breakfast" }, noRand)) assert(r.food.meals.includes("breakfast"), r.food.name);

// Light, no bread, cold, seafood -> sushi or poke.
const light = top({ meal: "lunch", bread: 0, greasy: 0, diet: "seafood", temp: "cold", budget: 3 });
assert(["Sushi", "Poke Bowl"].includes(light), light);

// Every answer combination for meal x diet yields at least one food.
const meals = QUESTIONS.find((q) => q.id === "meal").options;
const diets = QUESTIONS.find((q) => q.id === "diet").options;
for (const m of meals) for (const d of diets) {
  const n = rankFoods(FOODS, { meal: m.value, diet: d.value }, noRand).length;
  assert(n > 0, `no food for ${m.value}/${d.value}`);
}

// Distance helper: NYC -> Philly is ~80 miles.
const d = distanceMiles({ lat: 40.7128, lon: -74.006 }, { lat: 39.9526, lon: -75.1652 });
assert(d > 75 && d < 85, d);

assert(buildOverpassQuery(FOODS[0], { lat: 1, lon: 2 }, 1).includes("around:1609,1,2"));

console.log("All tests passed.");
