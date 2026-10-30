// UI controller: walks through the questions, shows the pick, finds places.

const $ = (id) => document.getElementById(id);
const state = { step: 0, answers: {}, ranked: [], pickIndex: 0 };

function show(screen) {
  for (const el of document.querySelectorAll(".screen")) el.classList.add("hidden");
  $(`screen-${screen}`).classList.remove("hidden");
}

function renderQuestion() {
  const q = QUESTIONS[state.step];
  $("progress-bar").style.width = `${(state.step / QUESTIONS.length) * 100}%`;
  $("question-count").textContent = `Question ${state.step + 1} of ${QUESTIONS.length}`;
  $("question-text").textContent = q.text;

  const box = $("options");
  box.innerHTML = "";
  for (const opt of q.options) {
    const btn = document.createElement("button");
    btn.className = "btn option";
    if (q.id in state.answers && state.answers[q.id] === opt.value) btn.classList.add("selected");
    btn.innerHTML = `<span class="emoji">${opt.emoji}</span><span></span>`;
    btn.lastChild.textContent = opt.label;
    btn.onclick = () => answer(q.id, opt.value);
    box.appendChild(btn);
  }
  show("question");
}

function answer(id, value) {
  state.answers[id] = value;
  state.step++;
  if (state.step < QUESTIONS.length) renderQuestion();
  else decide();
}

function decide() {
  state.ranked = rankFoods(FOODS, state.answers);
  state.pickIndex = 0;
  renderResult();
}

function reasonsFor(food, a) {
  const r = [];
  if (a.bread === 2 && food.bread === 2) r.push("🍞 Plenty of bread");
  if (a.bread === 0 && food.bread === 0) r.push("🚫 No bread");
  if (a.greasy === 2 && food.greasy === 2) r.push("🍟 Nice and greasy");
  if (a.greasy === 0 && food.greasy === 0) r.push("🥬 Light");
  if (a.spicy === 2 && food.spicy === 2) r.push("🔥 Spicy");
  if (a.spicy === 0 && food.spicy === 0) r.push("🧊 Mild");
  if (a.diet && a.diet !== "any") r.push(`✅ ${a.diet[0].toUpperCase() + a.diet.slice(1)} options`);
  if (a.budget != null && food.price <= a.budget) r.push(`💵 Fits a ${"$".repeat(a.budget)} budget`);
  if (a.speed && a.speed === food.speed) r.push(food.speed === "fast" ? "🏃 Quick" : "🪑 Sit-down");
  if (a.hunger === 2 && food.heavy === 2) r.push("😋 Filling");
  if (a.novelty === 2 && food.novelty === 2) r.push("🚀 Something new");
  return r;
}

function renderResult() {
  $("places").innerHTML = "";
  if (!state.ranked.length) {
    $("result-emoji").textContent = "🤔";
    $("result-name").textContent = "Nothing matched — try loosening your answers";
    $("result-reasons").innerHTML = "";
    $("runner-ups").innerHTML = "";
    show("result");
    return;
  }

  const food = state.ranked[state.pickIndex].food;
  $("result-emoji").textContent = food.emoji;
  $("result-name").textContent = food.name;

  const reasons = $("result-reasons");
  reasons.innerHTML = "";
  for (const text of reasonsFor(food, state.answers)) {
    const li = document.createElement("li");
    li.textContent = text;
    reasons.appendChild(li);
  }

  const runners = $("runner-ups");
  runners.innerHTML = "";
  state.ranked.forEach((r, i) => {
    if (i === state.pickIndex || runners.children.length >= 5) return;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = `${r.food.emoji} ${r.food.name}`;
    a.onclick = (e) => {
      e.preventDefault();
      state.pickIndex = i;
      renderResult();
    };
    li.appendChild(a);
    runners.appendChild(li);
  });

  $("next-btn").disabled = state.ranked.length < 2;
  show("result");
}

function setPlacesMessage(text, cls = "status") {
  $("places").innerHTML = `<p class="${cls}"></p>`;
  $("places").firstChild.textContent = text;
}

async function searchFrom(getOrigin) {
  const food = state.ranked[state.pickIndex].food;
  const miles = state.answers.distance ?? 5;
  setPlacesMessage("Finding a spot…");
  let origin = null;
  try {
    origin = await getOrigin();
    setPlacesMessage(`Searching for ${food.name.toLowerCase()} within ${miles} mi…`);
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
  const heading = document.createElement("h3");
  heading.textContent = `Go to: ${top.name}`;
  box.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "place-list";
  for (const p of places.slice(0, 8)) {
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
    list.appendChild(li);
  }
  box.appendChild(list);
  appendMapsFallback(food, origin, "See more on Google Maps →");
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

$("start-btn").onclick = () => {
  state.step = 0;
  state.answers = {};
  renderQuestion();
};
$("back-btn").onclick = () => {
  if (state.step === 0) return show("start");
  state.step--;
  renderQuestion();
};
$("next-btn").onclick = () => {
  state.pickIndex = (state.pickIndex + 1) % state.ranked.length;
  renderResult();
};
$("restart-btn").onclick = () => show("start");
$("locate-btn").onclick = () => searchFrom(getBrowserLocation);
$("address-form").onsubmit = (e) => {
  e.preventDefault();
  const q = $("address-input").value.trim();
  if (q) searchFrom(() => geocode(q));
};
