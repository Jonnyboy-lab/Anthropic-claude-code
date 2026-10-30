// UI controller: asks the questions, then shows the options you're leaning
// toward with links to find each one. If places.js is loaded and the browser
// allows it, each option can also list real restaurants nearby.

const $ = (id) => document.getElementById(id);
const NEARBY = typeof findPlaces === "function" && !window.NO_NEARBY_SEARCH;

let session;
let currentQuestion;
let linkUpdaters = [];

function show(name) {
  for (const el of document.querySelectorAll(".screen")) el.hidden = el.id !== `screen-${name}`;
  window.scrollTo(0, 0);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function link(label, href, cls = "btn small") {
  const a = el("a", cls, label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function start() {
  session = { meal: mealForHour(new Date().getHours()), history: [] };
  ask();
}

function ask() {
  currentQuestion = nextQuestion(FOODS, session);
  if (!currentQuestion) return showResults();
  const n = session.history.length;
  $("progress").style.width = `${(n / QUESTION_COUNT) * 100}%`;
  $("qcount").textContent = `Question ${n + 1} of ${QUESTION_COUNT}`;
  $("qtext").textContent = currentQuestion.text;
  $("back-btn").style.visibility = n ? "visible" : "hidden";
  $("skip-btn").style.visibility = n >= MIN_BEFORE_SKIP ? "visible" : "hidden";
  $("answers").replaceChildren(...ANSWERS.map((a) => {
    const b = el("button", "btn", a.label);
    b.type = "button";
    b.onclick = () => {
      session.history.push({ id: currentQuestion.id, answer: a.value });
      ask();
    };
    return b;
  }));
  show("question");
}

function back() {
  session.history.pop();
  ask();
}

function showResults() {
  const { yes, no } = leanings(session);
  const chips = [...yes.map((t) => el("span", "chip", t)), ...no.map((t) => el("span", "chip no", t))];
  $("leanings").replaceChildren(...(chips.length ? chips : [el("span", "chip no", "Anything goes")]));

  linkUpdaters = [];
  const options = results(FOODS, session);
  $("top-option").replaceChildren(optionCard(options[0], true));
  $("other-options").replaceChildren(...options.slice(1).map((o) => optionCard(o, false)));
  show("result");
}

function optionCard({ food, match, reasons }, isTop) {
  const card = el("article", isTop ? "option top" : "option");
  const head = el("div", "option-head");
  const title = el("div", "option-title");
  if (isTop) title.append(el("p", "eyebrow", "Your best match"));
  title.append(el("h3", null, food.name), el("p", "match", `${Math.round(match * 100)}% match`));
  head.append(el("span", "option-emoji", food.emoji), title);
  card.append(head);

  if (reasons.length) {
    card.append(el("div", "chips"));
    card.lastChild.append(...reasons.slice(0, 4).map((r) => el("span", "chip", r)));
  }

  const actions = el("div", "option-actions");
  const places = el("div", "places");
  if (NEARBY) {
    const find = el("button", isTop ? "btn small primary" : "btn small", "📍 Find restaurants");
    find.type = "button";
    find.onclick = () => searchNearby(food, places);
    actions.append(find);
  }
  const gmaps = link("Google Maps", "#", !NEARBY && isTop ? "btn small primary" : "btn small");
  const yelp = link("Yelp", "#");
  actions.append(gmaps, yelp);
  card.append(actions, places);

  // Keep the map links pointed at whatever location is typed in.
  const refresh = () => {
    const where = $("where").value.trim();
    gmaps.href = `https://www.google.com/maps/search/${encodeURIComponent(`${food.search} near ${where || "me"}`)}`;
    yelp.href = `https://www.yelp.com/search?find_desc=${encodeURIComponent(food.search)}` +
      (where ? `&find_loc=${encodeURIComponent(where)}` : "");
  };
  refresh();
  linkUpdaters.push(refresh);
  return card;
}

async function searchNearby(food, box) {
  const where = $("where").value.trim();
  const miles = Number($("distance").value);
  const status = (text, cls = "status") => box.replaceChildren(el("p", cls, text));
  status(where ? `Looking up ${where}…` : "Finding where you are…");
  try {
    const origin = where ? await geocode(where) : await getBrowserLocation();
    status(`Searching within ${miles} mi…`);
    const found = await findPlaces(food, origin, miles);
    if (!found.length) return status(`No ${food.name.toLowerCase()} spots found within ${miles} mi. Try a bigger distance or the map links.`);
    box.replaceChildren(...found.slice(0, 5).map(placeRow));
  } catch (err) {
    status(err.message, "status error");
  }
}

function placeRow(p) {
  const row = el("div", "place");
  const head = el("div", "place-head");
  head.append(el("span", null, p.name), el("span", null, `${p.miles.toFixed(1)} mi`));
  row.append(head);
  const meta = [p.address, p.hours].filter(Boolean).join(" · ");
  if (meta) row.append(el("div", "place-meta", meta));
  const links = el("div", "place-meta");
  links.append(link("Directions", mapsLink(p), ""));
  if (/^https?:\/\//.test(p.website)) links.append(" · ", link("Website", p.website, ""));
  row.append(links);
  return row;
}

$("distance").hidden = !NEARBY;
$("start-btn").onclick = start;
$("back-btn").onclick = back;
$("skip-btn").onclick = showResults;
$("edit-btn").onclick = () => { session.history.pop(); ask(); };
$("restart-btn").onclick = () => show("start");
$("where").oninput = () => linkUpdaters.forEach((f) => f());
$("where-form").onsubmit = (e) => e.preventDefault();
