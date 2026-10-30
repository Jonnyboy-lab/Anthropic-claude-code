// Run with: node test.js
const assert = require("assert");
const { FOODS } = require("./foods.js");
const { QUESTIONS, QUESTION_COUNT, mealForHour, rank, nextQuestion, leanings, results } = require("./decider.js");
const { buildOverpassQuery, distanceMiles } = require("./places.js");

// Someone who'd be happiest with `target` answering honestly.
function honestAnswer(q, target) {
  if (q.filter) return 0; // a real person only says yes to a requirement they have
  const m = q.match(target);
  return m >= 0.85 ? 1 : m >= 0.5 ? 0.7 : 0;
}

function play(target, rand) {
  const session = { meal: target.meals[0], history: [] };
  for (let q; (q = nextQuestion(FOODS, session, rand)); ) session.history.push({ id: q.id, answer: honestAnswer(q, target) });
  return session;
}

// After the questions, the dish that fits you best should be in the top 4 options.
let inTop1 = 0;
for (const target of FOODS) {
  const session = play(target, () => 0);
  assert(session.history.length <= QUESTION_COUNT);
  const names = results(FOODS, session).map((r) => r.food.name);
  assert(names.includes(target.name), `${target.name} not in options: ${names.join(", ")}`);
  if (names[0] === target.name) inTop1++;
}
console.log(`Best fit was the #1 option for ${inTop1}/${FOODS.length} dishes, and in the top 4 for all.`);
assert(inTop1 / FOODS.length > 0.6);

// Random question order still lands the best fit in the top 4 almost always.
let misses = 0;
for (let i = 0; i < 5; i++) for (const target of FOODS) {
  if (!results(FOODS, play(target, Math.random)).some((r) => r.food.name === target.name)) misses++;
}
assert(misses / (5 * FOODS.length) < 0.05, `random-order misses: ${misses}`);

// Results carry a 0–1 match score, best first, and reasons that echo your answers.
const s = { meal: "dinner", history: [{ id: "bread", answer: 1 }, { id: "greasy", answer: 1 }, { id: "spicy", answer: 0 }] };
const r = results(FOODS, s);
assert(r[0].match <= 1 && r[0].match > r[3].match - 1e-9);
assert(r[0].reasons.includes("Bread") && r[0].reasons.includes("Greasy"), r[0].reasons);
assert.deepStrictEqual(leanings(s), { yes: ["Bread", "Greasy"], no: ["Not spicy"] });

// Saying yes to "vegan" pushes every non-vegan dish out of the running.
const vegan = rank(FOODS, { history: [{ id: "vegan", answer: 1 }] });
for (const x of vegan) if (!x.food.diets.includes("vegan")) assert(x.p < 0.01, x.food.name);

// Questions are well-formed.
assert.strictEqual(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
for (const q of QUESTIONS) {
  assert(q.yes && q.no, q.id);
  for (const f of FOODS) assert(q.match(f) >= 0 && q.match(f) <= 1, `${q.id} on ${f.name}`);
}

assert.strictEqual(mealForHour(8), "breakfast");
assert.strictEqual(mealForHour(13), "lunch");
assert.strictEqual(mealForHour(19), "dinner");
assert.strictEqual(mealForHour(1), "late");

const d = distanceMiles({ lat: 40.7128, lon: -74.006 }, { lat: 39.9526, lon: -75.1652 });
assert(d > 75 && d < 85, d);
assert(buildOverpassQuery(FOODS[0], { lat: 1, lon: 2 }, 1).includes("around:1609,1,2"));

console.log("All tests passed.");
