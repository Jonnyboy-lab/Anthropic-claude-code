// Run with: node test.js
const assert = require("assert");
const { FOODS } = require("./foods.js");
const { QUESTIONS, DIET_QUESTION, FEELING_QUESTIONS, mealForHour, rank, nextQuestion, leanings, results } = require("./decider.js");
const { buildOverpassQuery, distanceMiles, demoPlaces } = require("./places.js");

// Someone who'd love `target` picks whichever choice fits it best.
function honestChoice(q, target) {
  if (q === DIET_QUESTION) return 0;
  let best = 0, bestFit = -1;
  q.options.forEach((o, i) => {
    const fit = o.neutral ? 0.55 : o.fit(target);
    if (fit > bestFit) [best, bestFit] = [i, fit];
  });
  return best;
}

function play(target, rand) {
  const session = { meal: target.meals[0], history: [] };
  for (let q; (q = nextQuestion(FOODS, session, rand)); ) session.history.push({ id: q.id, choice: honestChoice(q, target) });
  return session;
}

// The dish that fits your mood best should be among your options, usually first.
let top1 = 0;
for (const target of FOODS) {
  const session = play(target, () => 0);
  assert(session.history.length <= FEELING_QUESTIONS + 1);
  assert.strictEqual(session.history.at(-1).id, "diet", "diet question comes last");
  const names = results(FOODS, session).map((r) => r.food.name);
  assert(names.includes(target.name), `${target.name} not in options: ${names.join(", ")}`);
  if (names[0] === target.name) top1++;
}
console.log(`Best fit was the #1 option for ${top1}/${FOODS.length} dishes, and in the top 4 for all.`);
assert(top1 / FOODS.length > 0.85);

// Random question order still lands the best fit in the top 4 nearly always.
let misses = 0;
for (let i = 0; i < 5; i++) for (const target of FOODS) {
  if (!results(FOODS, play(target, Math.random)).some((r) => r.food.name === target.name)) misses++;
}
assert(misses / (5 * FOODS.length) < 0.05, `random-order misses: ${misses}`);

// Skipping ahead goes straight to the diet question, then results.
const early = { meal: "dinner", history: [{ id: "day", choice: 0 }] };
assert.strictEqual(nextQuestion(FOODS, early, Math.random, { finish: true }), DIET_QUESTION);

// Diet rules are strict: "No animal products" leaves only vegan-friendly dishes.
const vegan = rank(FOODS, { history: [{ id: "diet", choice: 2 }] });
assert(vegan.length > 10);
for (const r of vegan) assert(r.food.diets.includes("vegan"), r.food.name);

// Results echo what you picked.
const s = { meal: "dinner", history: [{ id: "texture", choice: 0 }, { id: "good", choice: 0 }, { id: "carbs", choice: 1 }] };
assert.deepStrictEqual(leanings(s), ["Crispy", "Indulgent"]);
const r = results(FOODS, s);
assert(r[0].reasons.includes("Crispy"), r[0].reasons);
assert(r[0].match >= r[3].match);

// Questions are well-formed: every non-neutral choice has a tag and fits in [0, 1].
assert.strictEqual(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
for (const q of QUESTIONS) for (const o of q.options) {
  if (o.neutral) continue;
  assert(o.tag, `${q.id}: ${o.label}`);
  for (const f of FOODS) {
    const x = o.fit(f);
    assert(x >= 0 && x <= 1, `${q.id}/${o.label} on ${f.name} = ${x}`);
  }
}

// Every dish is reachable from some meal time and has map search info.
for (const f of FOODS) assert(f.meals.length && f.osm.length && f.search, f.name);

// Sample restaurants are stable, sorted and inside the distance.
const pho = FOODS.find((f) => f.name === "Pho");
const demo = demoPlaces(pho, 5);
assert.deepStrictEqual(demo, demoPlaces(pho, 5));
assert(demo.every((p, i) => p.miles <= 5 && (i === 0 || p.miles >= demo[i - 1].miles)));
assert.strictEqual(new Set(demo.map((p) => p.name)).size, demo.length);

assert.strictEqual(mealForHour(8), "breakfast");
assert.strictEqual(mealForHour(13), "lunch");
assert.strictEqual(mealForHour(19), "dinner");
assert.strictEqual(mealForHour(1), "late");

const d = distanceMiles({ lat: 40.7128, lon: -74.006 }, { lat: 39.9526, lon: -75.1652 });
assert(d > 75 && d < 85, d);
assert(buildOverpassQuery(FOODS[0], { lat: 1, lon: 2 }, 1).includes("around:1609,1,2"));

console.log("All tests passed.");
