// The guide: a short run of mood questions that quietly steer toward food.
//
// Questions never ask about food directly. Each answer choice has a fit(food)
// from 0 to 1 for how well a dish matches that feeling, plus a short tag for
// the results page. Choices marked neutral tell us nothing and change nothing.
//
// Every answer re-weights all dishes. The next question is whichever best
// separates the dishes still in the running. After FEELING_QUESTIONS mood
// questions (or sooner, if you ask), a final practical question about diet
// rules, then your top options.
// Kept free of DOM code so it can be unit tested with Node.

const FEELING_QUESTIONS = 8;
const MIN_BEFORE_SKIP = 4;

const has = (t) => (f) => (f.tags.includes(t) ? 1 : 0);
const level = (key, scores) => (f) => scores[f[key]];
const regions = (map) => (f) => map[f.region] ?? 0;
const mainIs = (d) => (f) => f.diets[0] === d;

const QUESTIONS = [
  {
    id: "day",
    text: "How has today treated you?",
    options: [
      { label: "It wore me out", tag: "Comfort", fit: (f) => (has("comfort")(f) + f.heavy / 2) / 2 },
      { label: "Pretty normal", neutral: true },
      { label: "Honestly, pretty great", tag: "Celebrating", fit: (f) => ((f.price - 1) / 2 + f.novelty / 2) / 2 },
      { label: "I need a pick-me-up", tag: "Pick-me-up", fit: (f) => Math.max(has("sweet")(f), f.spicy / 2, f.greasy / 2) },
    ],
  },
  {
    id: "vibe",
    text: "Picture tonight. What's the vibe?",
    options: [
      { label: "Couch, blanket, a show", tag: "Cozy night in", fit: (f) => (f.speed === "fast" ? 0.6 : 0) + 0.4 * has("comfort")(f) },
      { label: "Out with people, loud and fun", tag: "Lively", fit: (f) => 0.6 * has("shareable")(f) + (f.speed === "sit" ? 0.4 : 0) },
      { label: "Somewhere nice, taking my time", tag: "Unhurried", fit: (f) => (f.speed === "sit" ? 0.5 : 0) + 0.25 * (f.price - 1) },
      { label: "On the move, eat and go", tag: "On the go", fit: (f) => (f.speed === "fast" ? 0.5 : 0) + 0.5 * has("hands")(f) },
    ],
  },
  {
    id: "after",
    text: "How do you want to feel when you're done?",
    options: [
      { label: "Stuffed and sleepy", tag: "Filling", fit: (f) => f.heavy / 2 },
      { label: "Light and energized", tag: "Light", fit: (f) => Math.max(has("healthy")(f), 1 - f.heavy / 2) * (f.greasy === 2 ? 0.3 : 1) },
      { label: "Like I treated myself", tag: "Treat yourself", fit: (f) => Math.max(f.greasy / 2, has("sweet")(f), (f.price - 1) / 2) },
      { label: "Just right, nothing extra", tag: "Balanced", fit: (f) => (f.heavy === 1 ? 1 : 0.3) },
    ],
  },
  {
    id: "texture",
    text: "Which word makes your mouth water?",
    options: [
      { label: "Crispy", tag: "Crispy", fit: has("crispy") },
      { label: "Saucy", tag: "Saucy", fit: has("saucy") },
      { label: "Melty", tag: "Melty", fit: has("melty") },
      { label: "Slurpy", tag: "Slurpy", fit: (f) => Math.max(has("slurpy")(f), 0.6 * has("soup")(f)) },
      { label: "Fresh", tag: "Fresh", fit: has("fresh") },
      { label: "Smoky", tag: "Smoky", fit: (f) => Math.max(has("smoky")(f), 0.7 * has("grilled")(f)) },
    ],
  },
  {
    id: "place",
    text: "If you could eat anywhere tonight, where would you be?",
    options: [
      { label: "A neon night market", tag: "Night market", fit: regions({ east_asian: 1, southeast_asian: 1, south_asian: 0.4, cafe: 0.3 }) },
      { label: "A beach shack, feet in the sand", tag: "Beachy", fit: (f) => Math.max(regions({ caribbean: 1, islands: 1, latin: 0.5 })(f), mainIs("seafood")(f) ? 0.8 : 0) },
      { label: "A cozy corner of an old European town", tag: "Old-world", fit: regions({ italian: 1, european: 1, cafe: 0.5 }) },
      { label: "A spice market full of color", tag: "Spice market", fit: regions({ mediterranean: 1, south_asian: 1, african: 1 }) },
      { label: "A roadside diner off the highway", tag: "Roadside diner", fit: regions({ american: 1, southern: 1, cafe: 0.4 }) },
      { label: "A street party with music", tag: "Street party", fit: regions({ mexican: 1, latin: 1, caribbean: 0.6 }) },
    ],
  },
  {
    id: "carbs",
    text: "How do you feel about carbs right now?",
    options: [
      { label: "Carbs are my love language", tag: "Carbs", fit: (f) => Math.max(f.bread / 2, has("slurpy")(f), 0.6 * (f.heavy / 2)) },
      { label: "Some carbs, I'm only human", neutral: true },
      { label: "Keep it light on carbs", tag: "Low-carb", fit: (f) => (f.bread === 0 && !f.tags.includes("slurpy") ? 1 : f.bread === 1 ? 0.3 : 0) },
    ],
  },
  {
    id: "good",
    text: "Be honest: are you trying to be good tonight?",
    options: [
      { label: "Nope, I want something a little bad", tag: "Indulgent", fit: (f) => f.greasy / 2 },
      { label: "Somewhere in the middle", tag: "Middle ground", fit: level("greasy", [0.5, 1, 0.3]) },
      { label: "Yes, I'm being good", tag: "Wholesome", fit: (f) => Math.max(has("healthy")(f), 1 - f.greasy / 2) },
    ],
  },
  {
    id: "heat",
    text: "How much heat can you handle tonight?",
    options: [
      { label: "Set my mouth on fire", tag: "Spicy", fit: level("spicy", [0, 0.4, 1]) },
      { label: "A little warmth is nice", tag: "A little kick", fit: level("spicy", [0.5, 1, 0.5]) },
      { label: "Nothing that bites back", tag: "Mild", fit: level("spicy", [1, 0.4, 0]) },
    ],
  },
  {
    id: "hands",
    text: "What's in your hands while you eat?",
    options: [
      { label: "Just my hands", tag: "Handheld", fit: has("hands") },
      { label: "A fork and knife", tag: "Knife and fork", fit: has("fork") },
      { label: "Chopsticks", tag: "Chopsticks", fit: has("chopsticks") },
      { label: "A big spoon", tag: "Spoon food", fit: (f) => Math.max(has("spoon")(f), 0.7 * has("soup")(f)) },
    ],
  },
  {
    id: "star",
    text: "Pick tonight's main character.",
    options: [
      { label: "Something off the grill or smoker", tag: "Meaty", fit: (f) => (mainIs("meat")(f) ? (f.tags.includes("grilled") || f.tags.includes("smoky") ? 1 : 0.7) : 0) },
      { label: "Something from the sea", tag: "From the sea", fit: (f) => (mainIs("seafood")(f) ? 1 : f.diets.includes("seafood") ? 0.5 : 0) },
      { label: "Something from the garden", tag: "Veggie-forward", fit: (f) => (mainIs("vegetarian")(f) || mainIs("vegan")(f) ? 1 : f.diets.includes("vegetarian") ? 0.5 : 0) },
      { label: "Whatever's good", neutral: true },
    ],
  },
  {
    id: "wallet",
    text: "Wallet check.",
    options: [
      { label: "Running on fumes", tag: "Budget", fit: level("price", [null, 1, 0.3, 0]) },
      { label: "A normal night", tag: "Mid-range", fit: level("price", [null, 0.7, 1, 0.3]) },
      { label: "Payday energy", tag: "Splurge", fit: level("price", [null, 0.3, 0.6, 1]) },
    ],
  },
  {
    id: "crew",
    text: "Who's eating?",
    options: [
      { label: "Just me", tag: "Solo", fit: (f) => (f.tags.includes("shareable") ? 0.4 : 0.8) },
      { label: "Me and one other person", neutral: true },
      { label: "The whole crew", tag: "Group", fit: (f) => (f.tags.includes("shareable") ? 1 : 0.3) },
    ],
  },
  {
    id: "weather",
    text: "What's the weather like, outside or in your head?",
    options: [
      { label: "Cold and gloomy", tag: "Warming", fit: (f) => (f.temp === "hot" ? (f.tags.includes("soup") || f.tags.includes("comfort") ? 1 : 0.6) : 0) },
      { label: "Hot and sticky", tag: "Cooling", fit: (f) => (f.temp === "cold" ? 1 : f.tags.includes("fresh") ? 0.7 : 0.15) },
      { label: "Mild, nothing special", neutral: true },
      { label: "Stormy, I need something bold", tag: "Bold", fit: (f) => 0.6 * (f.spicy / 2) + 0.4 * (f.novelty / 2) },
    ],
  },
  {
    id: "adventure",
    text: "How adventurous are your taste buds tonight?",
    options: [
      { label: "Dare me", tag: "Adventurous", fit: level("novelty", [0.1, 0.5, 1]) },
      { label: "A little curious", tag: "Curious", fit: level("novelty", [0.5, 1, 0.5]) },
      { label: "Keep it familiar", tag: "Familiar", fit: level("novelty", [1, 0.4, 0]) },
    ],
  },
  {
    id: "sweet",
    text: "Sweet tooth or savory soul?",
    options: [
      { label: "Savory, all the way", tag: "Savory", fit: (f) => (f.tags.includes("sweet") ? 0 : 1) },
      { label: "Something sweet would hit", tag: "Sweet", fit: (f) => (f.tags.includes("sweet") ? 1 : 0.1) },
      { label: "A bit of both", neutral: true },
    ],
  },
];

// Asked last, every time. These are hard rules, not leanings.
const DIET_QUESTION = {
  id: "diet",
  text: "Last one: anything off the table?",
  options: [
    { label: "Nope, I eat it all", neutral: true },
    { label: "No meat", tag: "Vegetarian", rule: (f) => f.diets.includes("vegetarian") || f.diets.includes("vegan") },
    { label: "No animal products", tag: "Vegan", rule: (f) => f.diets.includes("vegan") },
    { label: "No seafood", tag: "No seafood", rule: (f) => f.diets.some((d) => d !== "seafood") },
  ],
};

const byId = Object.fromEntries([...QUESTIONS, DIET_QUESTION].map((q) => [q.id, q]));

// The meal you're probably having, from the time of day.
function mealForHour(hour) {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "late";
}

// The option picked for an answer in the session history.
function picked({ id, choice }) {
  return byId[id].options[choice];
}

// Every food with p (its share of the probability) and match (0–1: the
// average fit across your answers), best first.
//   session = { meal, history: [{ id, choice }] }
function rank(foods, session) {
  const scored = foods.map((food) => {
    let w = !session.meal || food.meals.includes(session.meal) ? 1 : 0.15;
    let fit = 0, counted = 0;
    for (const h of session.history) {
      const opt = picked(h);
      if (opt.rule) w *= opt.rule(food) ? 1 : 0;
      if (opt.neutral || !opt.fit) continue;
      const x = opt.fit(food);
      w *= 0.1 + 0.9 * x;
      fit += x;
      counted++;
    }
    return { food, w, match: counted ? fit / counted : 1 };
  });
  const total = scored.reduce((s, r) => s + r.w, 0) || 1;
  return scored
    .filter((r) => r.w > 0)
    .map((r) => ({ food: r.food, p: r.w / total, match: r.match }))
    .sort((a, b) => b.p - a.p);
}

// How much a question would separate the remaining foods: the average, over
// its choices, of the probability-weighted variance of that choice's fit.
function splitPower(question, ranked) {
  const informative = question.options.filter((o) => o.fit);
  let total = 0;
  for (const opt of informative) {
    const mean = ranked.reduce((s, r) => s + r.p * opt.fit(r.food), 0);
    total += ranked.reduce((s, r) => s + r.p * (opt.fit(r.food) - mean) ** 2, 0);
  }
  return total / informative.length;
}

function feelingCount(session) {
  return session.history.filter((h) => h.id !== DIET_QUESTION.id).length;
}

// The next question to ask, or null when it's time for results.
// Pass { finish: true } to skip straight to the last (diet) question.
function nextQuestion(foods, session, rand = Math.random, { finish = false } = {}) {
  const asked = new Set(session.history.map((h) => h.id));
  if (asked.has(DIET_QUESTION.id)) return null;
  if (finish || feelingCount(session) >= FEELING_QUESTIONS) return DIET_QUESTION;
  const ranked = rank(foods, session);
  const candidates = QUESTIONS.filter((q) => !asked.has(q.id))
    .map((q) => ({ q, power: splitPower(q, ranked) }))
    .filter((c) => c.power > 0.002)
    .sort((a, b) => b.power - a.power);
  if (!candidates.length) return DIET_QUESTION;
  // Pick among the best few so repeat sessions don't feel identical.
  const pool = candidates.slice(0, session.history.length === 0 ? 5 : 3);
  return pool[Math.floor(rand() * pool.length)].q;
}

// The tags of everything you picked: what you're leaning toward.
function leanings(session) {
  return session.history.map(picked).filter((o) => o.tag).map((o) => o.tag);
}

// Which of your leanings a food lines up with.
function reasonsFor(food, session) {
  return session.history
    .map(picked)
    .filter((o) => o.tag && (o.rule ? o.rule(food) : o.fit && o.fit(food) >= 0.7))
    .map((o) => o.tag);
}

// Your top options: [{ food, match, reasons }].
function results(foods, session, count = 4) {
  return rank(foods, session)
    .slice(0, count)
    .map((r) => ({ food: r.food, match: r.match, reasons: reasonsFor(r.food, session) }));
}

if (typeof module !== "undefined") {
  module.exports = { QUESTIONS, DIET_QUESTION, FEELING_QUESTIONS, MIN_BEFORE_SKIP, mealForHour, rank, nextQuestion, leanings, results, feelingCount };
}
