// UI controller: asks the mood questions, then shows the options you're
// leaning toward with places to get each one.
//
// Places come from OpenStreetMap near your location. In demo mode (add ?demo
// to the URL, or set window.DEMO_PLACES) they're made-up sample restaurants,
// so the app can be tried without sharing a location.

const $ = (id) => document.getElementById(id);
const DEMO = !!window.DEMO_PLACES || new URLSearchParams(location.search).has("demo");

let session;
let currentQuestion;
let origin = null; // { lat, lon } once we know where you are
let openSpots = []; // [{ food, box }] spot lists currently showing
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

// Questions

function start() {
  session = { meal: mealForHour(new Date().getHours()), history: [] };
  ask();
}

function ask(opts) {
  currentQuestion = nextQuestion(FOODS, session, Math.random, opts);
  if (!currentQuestion) return showResults();
  const n = session.history.length;
  const isLast = currentQuestion === DIET_QUESTION;
  const total = isLast ? n + 1 : FEELING_QUESTIONS + 1;
  $("progress").style.width = `${(n / total) * 100}%`;
  $("qcount").textContent = isLast ? "Last question" : `Question ${n + 1} of ${total}`;
  $("qtext").textContent = currentQuestion.text;
  $("back-btn").style.visibility = n ? "visible" : "hidden";
  $("skip-btn").style.visibility = !isLast && n >= MIN_BEFORE_SKIP ? "visible" : "hidden";
  $("answers").replaceChildren(...currentQuestion.options.map((opt, i) => {
    const b = el("button", "btn", opt.label);
    b.type = "button";
    b.onclick = () => {
      session.history.push({ id: currentQuestion.id, choice: i });
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

// Results

function showResults() {
  const tags = leanings(session);
  $("leanings").replaceChildren(...(tags.length ? tags : ["Anything goes"]).map((t) => el("span", "chip", t)));

  openSpots = [];
  linkUpdaters = [];
  const options = results(FOODS, session);
  $("top-option").replaceChildren(optionCard(options[0], true));
  $("other-options").replaceChildren(...options.slice(1).map((o) => optionCard(o, false)));
  show("result");
  if (!DEMO && !origin) locateIfAllowed();
}

// Use your location straight away if you've already allowed it; otherwise
// wait for you to tap "Use my location".
async function locateIfAllowed() {
  try {
    const perm = await navigator.permissions.query({ name: "geolocation" });
    if (perm.state === "granted") setOrigin(getBrowserLocation, "Finding you…");
  } catch {
    // Permissions API not available; the button still works.
  }
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
    const chips = el("div", "chips");
    chips.append(...reasons.slice(0, 4).map((r) => el("span", "chip", r)));
    card.append(chips);
  }

  const spots = el("div", "places");
  const actions = el("div", "option-actions");
  if (!isTop) {
    const toggle = el("button", "btn small", "Show places");
    toggle.type = "button";
    toggle.onclick = () => {
      toggle.remove();
      openSpot(food, spots);
    };
    actions.append(toggle);
  }
  const gmaps = link("Google Maps", "#");
  const yelp = link("Yelp", "#");
  actions.append(gmaps, yelp);
  card.append(spots, actions);
  if (isTop) openSpot(food, spots);

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

function openSpot(food, box) {
  openSpots.push({ food, box });
  renderSpots(food, box);
}

function refreshAllSpots() {
  for (const { food, box } of openSpots) renderSpots(food, box);
}

async function renderSpots(food, box) {
  const miles = Number($("distance").value);
  const status = (text, cls = "status") => box.replaceChildren(el("p", cls, text));

  if (DEMO) return box.replaceChildren(...demoPlaces(food, miles).map(placeRow), el("p", "status", "Sample restaurants for the test drive. Not real places."));
  if (!origin) return status("Tap “Use my location” or enter a city or zip to see places nearby.");

  status(`Searching within ${miles} mi…`);
  try {
    const found = await findPlaces(food, origin, miles);
    if (!found.length) return status(`Nothing found within ${miles} mi. Try a bigger distance, or the map links below.`);
    box.replaceChildren(...found.slice(0, 4).map(placeRow));
  } catch (err) {
    status(err.message, "status error");
  }
}

function placeRow(p) {
  const row = el("div", "place");
  const head = el("div", "place-head");
  head.append(el("span", null, p.name), el("span", null, `${p.miles.toFixed(1)} mi`));
  row.append(head);
  const meta = [p.rating && `★ ${p.rating}`, p.price, p.address, p.hours].filter(Boolean).join(" · ");
  if (meta) row.append(el("div", "place-meta", meta));
  if (!p.demo) {
    const links = el("div", "place-meta");
    links.append(link("Directions", mapsLink(p), ""));
    if (/^https?:\/\//.test(p.website)) links.append(" · ", link("Website", p.website, ""));
    row.append(links);
  }
  return row;
}

async function setOrigin(getOrigin, label) {
  $("where-status").textContent = label;
  $("where-status").className = "status";
  try {
    origin = await getOrigin();
    $("where-status").textContent = "";
    refreshAllSpots();
  } catch (err) {
    $("where-status").textContent = err.message;
    $("where-status").className = "status error";
  }
}

// Wiring

if (DEMO) {
  $("locate-btn").hidden = true;
  $("where-label").textContent = "Where are you? (for the Maps and Yelp links)";
}
$("start-btn").onclick = start;
$("back-btn").onclick = back;
$("skip-btn").onclick = () => ask({ finish: true });
$("edit-btn").onclick = back;
$("restart-btn").onclick = () => show("start");
$("distance").onchange = refreshAllSpots;
$("where").oninput = () => linkUpdaters.forEach((f) => f());
$("locate-btn").onclick = () => {
  $("where").value = "";
  linkUpdaters.forEach((f) => f());
  setOrigin(getBrowserLocation, "Finding you…");
};
// Look up a typed city or zip when you press enter or leave the box.
$("where").onchange = () => {
  const where = $("where").value.trim();
  if (where && !DEMO) setOrigin(() => geocode(where), `Looking up ${where}…`);
};
$("where-form").onsubmit = (e) => e.preventDefault();
