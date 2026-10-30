// UI controller: runs the oracle's question/guess loop, then finds a place to eat.

const $ = (id) => document.getElementById(id);
const DISTANCES = [
  { miles: 1, label: "🚶 Walking distance (1 mi)" },
  { miles: 5, label: "🚗 Short drive (5 mi)" },
  { miles: 15, label: "🛣️ I'll drive a bit (15 mi)" },
  { miles: 30, label: "✈️ Anywhere for good food (30 mi)" },
];
const THINKING_FACES = ["🔮", "🤔", "🧐", "✨", "🔮", "👀"];

let session;
let currentGuess = null;
let chosen = { food: null, miles: 5 };

function show(screen) {
  for (const el of document.querySelectorAll(".screen")) el.classList.add("hidden");
  $(`screen-${screen}`).classList.remove("hidden");
}

function button(label, onClick, extraClass = "") {
  const btn = document.createElement("button");
  btn.className = `btn option ${extraClass}`;
  btn.textContent = label;
  btn.onclick = onClick;
  return btn;
}

function newGame() {
  session = { meal: mealForHour(new Date().getHours()), history: [], rejected: [], lastGuessAt: 0 };
  step();
}

// Ask the oracle what to do next and show it.
function step() {
  const move = nextMove(FOODS, session);
  if (move.type === "question") showQuestion(move.question);
  else if (move.type === "guess") showGuess(move.food);
  else showStumped(move.options);
}

function showQuestion(q) {
  const n = session.history.length;
  $("oracle-face").textContent = THINKING_FACES[n % THINKING_FACES.length];
  $("question-count").textContent = `Question ${n + 1}`;
  $("question-text").textContent = q.text;
  $("confidence-bar").style.width = `${Math.round(beliefs(FOODS, session)[0].p * 100)}%`;
  $("undo-btn").style.visibility = n ? "visible" : "hidden";

  const box = $("answers");
  box.innerHTML = "";
  for (const a of ANSWERS) {
    box.appendChild(button(a.label, () => {
      session.history.push({ id: q.id, answer: a.value });
      step();
    }));
  }
  show("question");
}

function showGuess(food) {
  currentGuess = food;
  const wrong = session.rejected.length;
  $("guess-intro").textContent = wrong ? "Hmm, let me try again… I think you're craving" : `After ${session.history.length} questions, I think you're craving`;
  $("guess-emoji").textContent = food.emoji;
  $("guess-name").textContent = `${food.name}?`;
  show("guess");
}

function showStumped(options) {
  const box = $("stumped-options");
  box.innerHTML = "";
  for (const food of options) box.appendChild(button(`${food.emoji} ${food.name}`, () => pickFood(food)));
  if (!options.length) box.textContent = "I've run out of ideas!";
  show("stumped");
}

function undo() {
  if (!session.history.length) return;
  session.history.pop();
  // Forget guesses made after the answer being undone.
  if (session.lastGuessAt > session.history.length) session.lastGuessAt = session.history.length;
  step();
}

function pickFood(food) {
  chosen.food = food;
  $("distance-emoji").textContent = food.emoji;
  const box = $("distance-options");
  box.innerHTML = "";
  for (const d of DISTANCES) {
    box.appendChild(button(d.label, () => {
      chosen.miles = d.miles;
      showResult();
    }));
  }
  show("distance");
}

function showResult() {
  const food = chosen.food;
  $("result-emoji").textContent = food.emoji;
  $("result-name").textContent = food.name;
  $("result-distance").textContent = `Within ${chosen.miles} mi`;
  show("result");
  searchFrom(getBrowserLocation);
}

function setPlacesMessage(text, cls = "status") {
  $("places").innerHTML = `<p class="${cls}"></p>`;
  $("places").firstChild.textContent = text;
}

async function searchFrom(getOrigin) {
  const { food, miles } = chosen;
  setPlacesMessage("📍 Finding where you are…");
  let origin = null;
  try {
    origin = await getOrigin();
    setPlacesMessage(`🔮 Searching for ${food.name.toLowerCase()} within ${miles} mi…`);
    const places = await findPlaces(food, origin, miles);
    renderPlaces(food, places, origin, miles);
  } catch (err) {
    setPlacesMessage(err.message, "error");
    appendMapsFallback(food, origin);
  }
}

function renderPlaces(food, places, origin, miles) {
  const box = $("places");
  box.innerHTML = "";
  if (!places.length) {
    setPlacesMessage(`No ${food.name.toLowerCase()} spots found within ${miles} mi.`);
    appendMapsFallback(food, origin);
    return;
  }

  const top = places[0];
  const winner = document.createElement("div");
  winner.className = "winner";
  winner.innerHTML = `<p class="muted small">Go to</p><h2></h2><p class="muted small meta"></p><a class="btn primary" target="_blank" rel="noopener">Get directions</a>`;
  winner.querySelector("h2").textContent = top.name;
  winner.querySelector(".meta").textContent = [`${top.miles.toFixed(1)} mi away`, top.address, top.hours].filter(Boolean).join(" · ");
  winner.querySelector("a").href = mapsLink(top);
  box.appendChild(winner);

  if (places.length > 1) {
    const details = document.createElement("details");
    details.className = "runners";
    details.innerHTML = `<summary>Other spots nearby (${Math.min(places.length - 1, 7)})</summary><ul class="place-list"></ul>`;
    for (const p of places.slice(1, 8)) details.querySelector("ul").appendChild(placeItem(p));
    box.appendChild(details);
  }
  appendMapsFallback(food, origin, "See more on Google Maps →");
}

function placeItem(p) {
  const li = document.createElement("li");
  li.className = "place";
  li.innerHTML = `
    <div class="place-head"><span class="name"></span><span class="dist"></span></div>
    <div class="place-meta"></div>
    <div class="place-meta links"><a target="_blank" rel="noopener">Directions</a></div>`;
  li.querySelector(".name").textContent = p.name;
  li.querySelector(".dist").textContent = `${p.miles.toFixed(1)} mi`;
  li.querySelector(".place-meta").textContent = [p.cuisine, p.address, p.hours].filter(Boolean).join(" · ");
  li.querySelector("a").href = mapsLink(p);
  if (p.website && /^https?:\/\//.test(p.website)) {
    const site = document.createElement("a");
    site.href = p.website;
    site.target = "_blank";
    site.rel = "noopener";
    site.textContent = "Website";
    li.querySelector(".links").append(" · ", site);
  }
  return li;
}

function appendMapsFallback(food, origin, label = `Search “${food.search}” on Google Maps →`) {
  const p = document.createElement("p");
  p.className = "status";
  const a = document.createElement("a");
  a.href = mapsSearchLink(food, origin);
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = label;
  p.appendChild(a);
  $("places").appendChild(p);
}

$("start-btn").onclick = newGame;
$("undo-btn").onclick = undo;
$("guess-undo").onclick = undo;
$("guess-yes").onclick = () => pickFood(currentGuess);
$("guess-no").onclick = () => {
  session.rejected.push(currentGuess.name);
  session.lastGuessAt = session.history.length;
  step();
};
$("stumped-restart").onclick = () => show("start");
$("restart-btn").onclick = () => show("start");
$("address-form").onsubmit = (e) => {
  e.preventDefault();
  const q = $("address-input").value.trim();
  if (q) searchFrom(() => geocode(q));
};
