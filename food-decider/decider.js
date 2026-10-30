// The oracle: an Akinator-style guessing engine.
//
// Every food has a probability of being "the one". Each answer re-weights
// those probabilities, the next question is whichever best splits what's
// left, and the oracle guesses once one food clearly leads. A wrong guess
// rules that food out and the questioning continues.
// Kept free of DOM code so it can be unit tested with Node.

const ANSWERS = [
  { value: 1, label: "Yes" },
  { value: 0.75, label: "Probably" },
  { value: null, label: "Don't know" },
  { value: 0.25, label: "Probably not" },
  { value: 0, label: "No" },
];

const tag = (t) => (f) => (f.tags.includes(t) ? 1 : 0);
const diet = (d) => (f) => (f.diets[0] === d ? 1 : f.diets.includes(d) ? 0.5 : 0);
const meal = (m) => (f) => (!f.meals.includes(m) ? 0 : f.meals.length <= 2 ? 1 : 0.6);

// match(food) is how well the food fits a "yes" answer, from 0 to 1.
// "filter" questions are requirements: saying no to them rules nothing out.
const QUESTIONS = [
  { id: "bread", text: "Do you want bread?", match: (f) => f.bread / 2 },
  { id: "greasy", text: "Are you in the mood for something greasy?", match: (f) => f.greasy / 2 },
  { id: "spicy", text: "Do you want it spicy?", match: (f) => f.spicy / 2 },
  { id: "hungry", text: "Are you really, really hungry?", match: (f) => f.heavy / 2 },
  { id: "light", text: "Do you want something light?", match: (f) => 1 - f.heavy / 2 },
  { id: "novel", text: "Do you want to try something you don't eat often?", match: (f) => f.novelty / 2 },
  { id: "pricey", text: "Are you willing to spend a bit more than usual?", match: (f) => (f.price - 1) / 2 },
  { id: "cheap", text: "Does it need to be cheap?", match: (f) => (f.price === 1 ? 1 : 0), filter: true },
  { id: "hot", text: "Do you want a hot meal?", match: (f) => (f.temp === "hot" ? 1 : 0) },
  { id: "sit", text: "Do you want to sit down at a restaurant?", match: (f) => (f.speed === "sit" ? 1 : 0) },
  { id: "meat", text: "Are you craving meat?", match: diet("meat") },
  { id: "seafood", text: "Are you craving seafood?", match: diet("seafood") },
  { id: "vegetarian", text: "Does it need to be vegetarian?", match: (f) => (f.diets.includes("vegetarian") || f.diets.includes("vegan") ? 1 : 0), filter: true },
  { id: "vegan", text: "Does it need to be vegan?", match: (f) => (f.diets.includes("vegan") ? 1 : 0), filter: true },
  { id: "breakfast", text: "Is this for breakfast?", match: meal("breakfast") },
  { id: "late", text: "Is this a late-night craving?", match: meal("late") },
  { id: "asian", text: "Are you thinking Asian food?", match: tag("asian") },
  { id: "mexican", text: "Are you thinking Mexican food?", match: tag("mexican") },
  { id: "italian", text: "Are you thinking Italian food?", match: tag("italian") },
  { id: "american", text: "Do you want classic American food?", match: tag("american") },
  { id: "middle_eastern", text: "Middle Eastern or Mediterranean flavors?", match: tag("middle_eastern") },
  { id: "noodles", text: "Do you want noodles?", match: tag("noodles") },
  { id: "rice", text: "Do you want rice with it?", match: tag("rice") },
  { id: "soup", text: "Are you in the mood for soup or broth?", match: tag("soup") },
  { id: "cheese", text: "Does it need cheese?", match: tag("cheese") },
  { id: "fried", text: "Do you want something fried?", match: tag("fried") },
  { id: "grilled", text: "Something grilled or off the barbecue?", match: tag("grilled") },
  { id: "handheld", text: "Do you want to eat it with your hands?", match: tag("handheld") },
  { id: "chopsticks", text: "Would you use chopsticks?", match: tag("chopsticks") },
  { id: "healthy", text: "Are you trying to eat healthy?", match: tag("healthy") },
  { id: "comfort", text: "Do you need comfort food?", match: tag("comfort") },
  { id: "sweet", text: "Are you craving something sweet?", match: tag("sweet") },
  { id: "coffee", text: "Do you want coffee with it?", match: tag("coffee") },
  { id: "share", text: "Are you sharing with a group?", match: tag("shareable") },
];

const MIN_QUESTIONS = 7;
const GUESS_CONFIDENCE = 0.5;
const MAX_QUESTIONS = 30;

// The meal you're probably having, from the time of day.
function mealForHour(hour) {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "late";
}

function likelihood(question, answer, food) {
  if (answer == null) return 1;
  if (question.filter && answer < 0.5) return 1;
  const m = question.match(food);
  return 1 - 0.9 * Math.abs(answer - m);
}

// Probability of each food given the session so far:
//   session = { meal, history: [{ id, answer }], rejected: [food names] }
function beliefs(foods, session) {
  const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const weights = foods.map((food) => {
    if (session.rejected.includes(food.name)) return 0;
    let w = !session.meal || food.meals.includes(session.meal) ? 1 : 0.15;
    for (const { id, answer } of session.history) w *= likelihood(byId[id], answer, food);
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return foods.map((food, i) => ({ food, p: weights[i] / total })).sort((a, b) => b.p - a.p);
}

// How much a question would split the remaining foods: the
// probability-weighted variance of its match values. Requirement questions
// are usually answered "no", which tells us nothing, so they count for less.
function splitPower(question, ranked) {
  const mean = ranked.reduce((s, r) => s + r.p * question.match(r.food), 0);
  const variance = ranked.reduce((s, r) => s + r.p * (question.match(r.food) - mean) ** 2, 0);
  return question.filter ? variance * 0.4 : variance;
}

// Decide what the oracle does next:
//   { type: "question", question } | { type: "guess", food, p } | { type: "stumped", options }
function nextMove(foods, session, rand = Math.random) {
  const ranked = beliefs(foods, session);
  const alive = ranked.filter((r) => r.p > 0);
  const asked = new Set(session.history.map((h) => h.id));
  const sinceGuess = session.history.length - (session.lastGuessAt ?? 0);

  if (!alive.length || session.history.length >= MAX_QUESTIONS) {
    return { type: "stumped", options: alive.slice(0, 5).map((r) => r.food) };
  }

  const top = alive[0];
  const confident = top.p >= GUESS_CONFIDENCE && session.history.length >= MIN_QUESTIONS && sinceGuess >= 2;
  const candidates = QUESTIONS.filter((q) => !asked.has(q.id))
    .map((q) => ({ q, power: splitPower(q, alive) }))
    .filter((c) => c.power > 0.005)
    .sort((a, b) => b.power - a.power);

  if (confident || !candidates.length || alive.length === 1) {
    return { type: "guess", food: top.food, p: top.p };
  }
  // Pick among the best few so repeat sessions don't feel identical.
  const pool = candidates.slice(0, session.history.length === 0 ? 4 : 2);
  return { type: "question", question: pool[Math.floor(rand() * pool.length)].q };
}

if (typeof module !== "undefined") {
  module.exports = { ANSWERS, QUESTIONS, mealForHour, beliefs, nextMove, splitPower, MAX_QUESTIONS };
}
