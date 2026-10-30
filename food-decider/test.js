// Run with: node test.js
const assert = require("assert");
const { FOODS } = require("./foods.js");
const { QUESTIONS, mealForHour, beliefs, nextMove } = require("./decider.js");
const { buildOverpassQuery, distanceMiles } = require("./places.js");

// An honest player who is secretly thinking of `target`.
function honestAnswer(q, target) {
  if (q.filter) return 0; // a real person only says yes to a requirement they have
  const m = q.match(target);
  return [1, 0.75, 0.25, 0].reduce((best, v) => (Math.abs(v - m) < Math.abs(best - m) ? v : best));
}

function play(target, session, rand) {
  let wrongGuesses = 0;
  for (let turn = 0; turn < 60; turn++) {
    const move = nextMove(FOODS, session, rand);
    if (move.type === "guess") {
      if (move.food.name === target.name) return { found: true, questions: session.history.length, wrongGuesses };
      wrongGuesses++;
      session.rejected.push(move.food.name);
      session.lastGuessAt = session.history.length;
    } else if (move.type === "stumped") {
      return { found: move.options.some((f) => f.name === target.name), questions: session.history.length, wrongGuesses, stumped: true };
    } else {
      session.history.push({ id: move.question.id, answer: honestAnswer(move.question, target) });
    }
  }
  throw new Error("game never ended for " + target.name);
}

// The oracle should find every dish, mostly on the first or second guess.
let totalQ = 0, totalWrong = 0;
for (const target of FOODS) {
  const rand = () => 0; // deterministic question choice
  const result = play(target, { meal: target.meals[0], history: [], rejected: [] }, rand);
  assert(result.found, `never found ${target.name}: ${JSON.stringify(result)}`);
  totalQ += result.questions;
  totalWrong += result.wrongGuesses;
}
const avgQ = totalQ / FOODS.length, avgWrong = totalWrong / FOODS.length;
console.log(`Found all ${FOODS.length} dishes. Avg questions: ${avgQ.toFixed(1)}, avg wrong guesses: ${avgWrong.toFixed(2)}`);
assert(avgQ < 18, "too many questions on average");
assert(avgWrong < 1.5, "too many wrong guesses on average");

// Same with random question order, so variety doesn't break it.
for (const target of FOODS) {
  const result = play(target, { meal: target.meals[0], history: [], rejected: [] }, Math.random);
  assert(result.found, `random play never found ${target.name}`);
}

// Saying yes to "vegan" removes every non-vegan dish from contention.
const vegan = beliefs(FOODS, { history: [{ id: "vegan", answer: 1 }], rejected: [] });
for (const r of vegan) if (!r.food.diets.includes("vegan")) assert(r.p < 0.01, r.food.name);

// Rejected guesses are out for good.
const after = beliefs(FOODS, { history: [], rejected: ["Pizza"] });
assert.strictEqual(after.find((r) => r.food.name === "Pizza").p, 0);

// Every question has a unique id and returns values in [0, 1] for every food.
assert.strictEqual(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
for (const q of QUESTIONS) for (const f of FOODS) {
  const m = q.match(f);
  assert(m >= 0 && m <= 1, `${q.id} on ${f.name} = ${m}`);
}

assert.strictEqual(mealForHour(8), "breakfast");
assert.strictEqual(mealForHour(13), "lunch");
assert.strictEqual(mealForHour(19), "dinner");
assert.strictEqual(mealForHour(1), "late");

const d = distanceMiles({ lat: 40.7128, lon: -74.006 }, { lat: 39.9526, lon: -75.1652 });
assert(d > 75 && d < 85, d);
assert(buildOverpassQuery(FOODS[0], { lat: 1, lon: 2 }, 1).includes("around:1609,1,2"));

console.log("All tests passed.");
