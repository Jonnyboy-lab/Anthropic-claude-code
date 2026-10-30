// The guide: asks a short series of questions about what you feel like,
// then ranks dishes by how well they fit your answers.
//
// Each answer re-weights every dish. The next question is whichever best
// separates the dishes still in the running, so you're never asked something
// that wouldn't change the result. After QUESTION_COUNT questions (or sooner,
// if you ask) you get your top options.
// Kept free of DOM code so it can be unit tested with Node.

const ANSWERS = [
  { value: 1, label: "Yes" },
  { value: 0.7, label: "Kind of" },
  { value: 0, label: "No" },
  { value: null, label: "Don't care" },
];

const QUESTION_COUNT = 10;
const MIN_BEFORE_SKIP = 4;

const tag = (t) => (f) => (f.tags.includes(t) ? 1 : 0);
const diet = (d) => (f) => (f.diets[0] === d ? 1 : f.diets.includes(d) ? 0.5 : 0);
const meal = (m) => (f) => (!f.meals.includes(m) ? 0 : f.meals.length <= 2 ? 1 : 0.6);

// match(food) is how well the food fits a "yes", from 0 to 1.
// yes/no are short labels for the summary of what you leaned toward.
// "filter" questions are requirements: answering no rules nothing out.
const QUESTIONS = [
  { id: "bread", text: "Do you want bread?", yes: "Bread", no: "No bread", match: (f) => f.bread / 2 },
  { id: "greasy", text: "Greasy food?", yes: "Greasy", no: "Not greasy", match: (f) => f.greasy / 2 },
  { id: "spicy", text: "Something spicy?", yes: "Spicy", no: "Not spicy", match: (f) => f.spicy / 2 },
  { id: "hungry", text: "Are you really hungry?", yes: "Filling", no: "Not too filling", match: (f) => f.heavy / 2 },
  { id: "light", text: "Do you want something light?", yes: "Light", no: "Not light", match: (f) => 1 - f.heavy / 2 },
  { id: "novel", text: "Up for something different from usual?", yes: "Something new", no: "Familiar", match: (f) => f.novelty / 2 },
  { id: "pricey", text: "Okay spending a bit more tonight?", yes: "Can splurge", no: "Keep it cheap", match: (f) => (f.price - 1) / 2 },
  { id: "cheap", text: "Does it need to be cheap?", yes: "Cheap", no: "Any price", match: (f) => (f.price === 1 ? 1 : 0), filter: true },
  { id: "hot", text: "Do you want a hot meal?", yes: "Hot", no: "Cold / fresh", match: (f) => (f.temp === "hot" ? 1 : 0) },
  { id: "sit", text: "Do you want to sit down at a restaurant?", yes: "Sit-down", no: "Grab and go", match: (f) => (f.speed === "sit" ? 1 : 0) },
  { id: "meat", text: "Craving meat?", yes: "Meat", no: "No meat", match: diet("meat") },
  { id: "seafood", text: "Craving seafood?", yes: "Seafood", no: "No seafood", match: diet("seafood") },
  { id: "vegetarian", text: "Does it need to be vegetarian?", yes: "Vegetarian", no: "Any diet", match: (f) => (f.diets.includes("vegetarian") || f.diets.includes("vegan") ? 1 : 0), filter: true },
  { id: "vegan", text: "Does it need to be vegan?", yes: "Vegan", no: "Any diet", match: (f) => (f.diets.includes("vegan") ? 1 : 0), filter: true },
  { id: "breakfast", text: "Do you want breakfast food?", yes: "Breakfast food", no: "No breakfast food", match: meal("breakfast") },
  { id: "late", text: "Is this a late-night craving?", yes: "Late night", no: "Not late night", match: meal("late") },
  { id: "asian", text: "In the mood for Asian food?", yes: "Asian", no: "Not Asian", match: tag("asian") },
  { id: "mexican", text: "In the mood for Mexican food?", yes: "Mexican", no: "Not Mexican", match: tag("mexican") },
  { id: "italian", text: "In the mood for Italian food?", yes: "Italian", no: "Not Italian", match: tag("italian") },
  { id: "american", text: "Classic American food?", yes: "American", no: "Not American", match: tag("american") },
  { id: "middle_eastern", text: "Middle Eastern or Mediterranean flavors?", yes: "Mediterranean", no: "Not Mediterranean", match: tag("middle_eastern") },
  { id: "noodles", text: "Do you want noodles?", yes: "Noodles", no: "No noodles", match: tag("noodles") },
  { id: "rice", text: "Do you want rice?", yes: "Rice", no: "No rice", match: tag("rice") },
  { id: "soup", text: "Soup or something brothy?", yes: "Soup", no: "No soup", match: tag("soup") },
  { id: "cheese", text: "Do you want cheese?", yes: "Cheese", no: "No cheese", match: tag("cheese") },
  { id: "fried", text: "Something fried?", yes: "Fried", no: "Not fried", match: tag("fried") },
  { id: "grilled", text: "Something grilled or barbecued?", yes: "Grilled", no: "Not grilled", match: tag("grilled") },
  { id: "handheld", text: "Something you can eat with your hands?", yes: "Handheld", no: "Fork and knife", match: tag("handheld") },
  { id: "healthy", text: "Trying to eat healthy?", yes: "Healthy", no: "Not worried about healthy", match: tag("healthy") },
  { id: "comfort", text: "Do you need comfort food?", yes: "Comfort food", no: "Not comfort food", match: tag("comfort") },
  { id: "sweet", text: "Craving something sweet?", yes: "Sweet", no: "Savory", match: tag("sweet") },
  { id: "share", text: "Are you sharing with a group?", yes: "For a group", no: "Just me", match: tag("shareable") },
];

const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

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
  return 1 - 0.9 * Math.abs(answer - question.match(food));
}

// Every food with p (its share of the probability) and match (0–1: the
// average of how closely it fits each of your answers), best first.
//   session = { meal, history: [{ id, answer }] }
function rank(foods, session) {
  const scored = foods.map((food) => {
    let w = !session.meal || food.meals.includes(session.meal) ? 1 : 0.15;
    let fit = 0, counted = 0;
    for (const { id, answer } of session.history) {
      const q = byId[id];
      w *= likelihood(q, answer, food);
      if (answer == null || (q.filter && answer < 0.5)) continue;
      fit += 1 - Math.abs(answer - q.match(food));
      counted++;
    }
    return { food, w, match: counted ? fit / counted : 1 };
  });
  const total = scored.reduce((s, r) => s + r.w, 0) || 1;
  return scored.map((r) => ({ food: r.food, p: r.w / total, match: r.match })).sort((a, b) => b.p - a.p);
}

// How much a question would separate the remaining foods: the
// probability-weighted variance of its match values. Requirement questions
// are usually answered "no", which tells us nothing, so they count for less.
function splitPower(question, ranked) {
  const mean = ranked.reduce((s, r) => s + r.p * question.match(r.food), 0);
  const variance = ranked.reduce((s, r) => s + r.p * (question.match(r.food) - mean) ** 2, 0);
  return question.filter ? variance * 0.4 : variance;
}

// The next question to ask, or null when it's time for results.
function nextQuestion(foods, session, rand = Math.random) {
  if (session.history.length >= QUESTION_COUNT) return null;
  const ranked = rank(foods, session);
  const asked = new Set(session.history.map((h) => h.id));
  const candidates = QUESTIONS.filter((q) => !asked.has(q.id))
    .map((q) => ({ q, power: splitPower(q, ranked) }))
    .filter((c) => c.power > 0.005)
    .sort((a, b) => b.power - a.power);
  if (!candidates.length) return null;
  // Pick among the best few so repeat sessions don't feel identical.
  const pool = candidates.slice(0, session.history.length === 0 ? 4 : 2);
  return pool[Math.floor(rand() * pool.length)].q;
}

// What you said yes / no to, as short labels: { yes: [...], no: [...] }.
function leanings(session) {
  const yes = [], no = [];
  for (const { id, answer } of session.history) {
    const q = byId[id];
    if (answer == null || (q.filter && answer < 0.5)) continue;
    (answer >= 0.5 ? yes : no).push(answer >= 0.5 ? q.yes : q.no);
  }
  return { yes, no };
}

// Which of your answers a food lines up with, as short labels.
function reasonsFor(food, session) {
  const reasons = [];
  for (const { id, answer } of session.history) {
    const q = byId[id];
    if (answer == null || (q.filter && answer < 0.5)) continue;
    if (Math.abs(answer - q.match(food)) <= 0.3) reasons.push({ label: answer >= 0.5 ? q.yes : q.no, yes: answer >= 0.5 });
  }
  // Things you said yes to first.
  return reasons.sort((a, b) => b.yes - a.yes).map((r) => r.label);
}

// Your top options: [{ food, match, reasons }].
function results(foods, session, count = 4) {
  return rank(foods, session)
    .slice(0, count)
    .map((r) => ({ food: r.food, match: r.match, reasons: reasonsFor(r.food, session) }));
}

if (typeof module !== "undefined") {
  module.exports = { ANSWERS, QUESTIONS, QUESTION_COUNT, MIN_BEFORE_SKIP, mealForHour, rank, nextQuestion, leanings, results };
}
