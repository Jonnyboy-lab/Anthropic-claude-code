// Questions and the scoring logic that turns answers into a food pick.
// Kept free of DOM code so it can be unit tested with Node.

const QUESTIONS = [
  {
    id: "meal",
    text: "What meal is this?",
    options: [
      { value: "breakfast", label: "Breakfast / brunch", emoji: "🌅" },
      { value: "lunch", label: "Lunch", emoji: "☀️" },
      { value: "dinner", label: "Dinner", emoji: "🌙" },
      { value: "late", label: "Late-night munchies", emoji: "🦉" },
    ],
  },
  {
    id: "hunger",
    text: "How hungry are you?",
    options: [
      { value: 0, label: "Just a snack", emoji: "🤏" },
      { value: 1, label: "Normal hungry", emoji: "🙂" },
      { value: 2, label: "Starving", emoji: "😩" },
    ],
  },
  {
    id: "bread",
    text: "Do you want bread?",
    options: [
      { value: 2, label: "Yes — bring on the carbs", emoji: "🍞" },
      { value: 0, label: "No bread for me", emoji: "🚫" },
      { value: null, label: "Don't care", emoji: "🤷" },
    ],
  },
  {
    id: "greasy",
    text: "Greasy food?",
    options: [
      { value: 2, label: "Yes, the greasier the better", emoji: "🍟" },
      { value: 1, label: "A little is fine", emoji: "👌" },
      { value: 0, label: "No — keep it light", emoji: "🥬" },
    ],
  },
  {
    id: "spicy",
    text: "How about spice?",
    options: [
      { value: 2, label: "Make me sweat", emoji: "🔥" },
      { value: 1, label: "A little kick", emoji: "🌶️" },
      { value: 0, label: "Keep it mild", emoji: "🧊" },
    ],
  },
  {
    id: "diet",
    text: "Any diet preference?",
    options: [
      { value: "any", label: "I eat everything", emoji: "🍽️" },
      { value: "meat", label: "I want meat", emoji: "🥩" },
      { value: "seafood", label: "Seafood", emoji: "🐟" },
      { value: "vegetarian", label: "Vegetarian", emoji: "🥕" },
      { value: "vegan", label: "Vegan", emoji: "🌱" },
    ],
  },
  {
    id: "temp",
    text: "Hot meal or something cold?",
    options: [
      { value: "hot", label: "Hot", emoji: "♨️" },
      { value: "cold", label: "Cold / fresh", emoji: "❄️" },
      { value: null, label: "Either", emoji: "🤷" },
    ],
  },
  {
    id: "budget",
    text: "What's the budget?",
    options: [
      { value: 1, label: "Cheap ($)", emoji: "💵" },
      { value: 2, label: "Moderate ($$)", emoji: "💳" },
      { value: 3, label: "Treat yourself ($$$)", emoji: "💎" },
    ],
  },
  {
    id: "speed",
    text: "Quick bite or sit-down?",
    options: [
      { value: "fast", label: "Quick — grab and go", emoji: "🏃" },
      { value: "sit", label: "Sit down and relax", emoji: "🪑" },
      { value: null, label: "Either works", emoji: "🤷" },
    ],
  },
  {
    id: "novelty",
    text: "Feeling adventurous?",
    options: [
      { value: 0, label: "Stick to what I know", emoji: "🏠" },
      { value: 1, label: "Somewhere in between", emoji: "🧭" },
      { value: 2, label: "Surprise me with something new", emoji: "🚀" },
    ],
  },
  {
    id: "distance",
    text: "How far are you willing to travel?",
    options: [
      { value: 1, label: "Walking distance (1 mi)", emoji: "🚶" },
      { value: 5, label: "Short drive (5 mi)", emoji: "🚗" },
      { value: 15, label: "I'll drive a bit (15 mi)", emoji: "🛣️" },
      { value: 30, label: "Anywhere for good food (30 mi)", emoji: "✈️" },
    ],
  },
];

// Points for how close a food's trait is to the wanted level (0–2 scales).
function closeness(wanted, actual, weight) {
  return weight * (2 - Math.abs(wanted - actual));
}

// Returns a score, or -Infinity if the food is ruled out entirely.
function scoreFood(food, answers) {
  const a = answers;

  // Hard filters: diet and meal time can't be compromised on.
  if (a.diet && a.diet !== "any" && !food.diets.includes(a.diet)) return -Infinity;
  if (a.meal && !food.meals.includes(a.meal)) return -Infinity;

  let score = 0;
  if (a.bread != null) score += closeness(a.bread, food.bread, 3);
  if (a.greasy != null) score += closeness(a.greasy, food.greasy, 3);
  if (a.spicy != null) score += closeness(a.spicy, food.spicy, 2);
  if (a.hunger != null) score += closeness(a.hunger, food.heavy, 2);
  if (a.novelty != null) score += closeness(a.novelty, food.novelty, 1.5);

  if (a.temp != null) score += food.temp === a.temp ? 3 : -2;
  if (a.speed != null) score += food.speed === a.speed ? 3 : -1;

  // Going over budget hurts; going under is fine.
  if (a.budget != null) score -= Math.max(0, food.price - a.budget) * 4;

  // Specifically asked for meat/seafood: favour dishes built around it.
  if (a.diet === "meat" || a.diet === "seafood") {
    if (food.diets[0] === a.diet) score += 2;
  }

  return score;
}

// Ranks all foods, best first. A little randomness breaks ties so the
// app doesn't always say the same thing for the same answers.
function rankFoods(foods, answers, rand = Math.random) {
  return foods
    .map((food) => ({ food, score: scoreFood(food, answers) }))
    .filter((r) => r.score > -Infinity)
    .map((r) => ({ ...r, score: r.score + rand() * 0.5 }))
    .sort((x, y) => y.score - x.score);
}

if (typeof module !== "undefined") module.exports = { QUESTIONS, scoreFood, rankFoods };
