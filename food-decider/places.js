// Finds real restaurants near a location using free OpenStreetMap services
// (Overpass for places, Nominatim for turning a typed address into coordinates).

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const METERS_PER_MILE = 1609.34;

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location isn't available in this browser."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("Couldn't get your location. Try typing a city or zip code instead.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

async function geocode(query) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Address lookup failed. Please try again.");
  const data = await res.json();
  if (!data.length) throw new Error(`Couldn't find "${query}". Try a different city or zip.`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function distanceMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildOverpassQuery(food, origin, miles) {
  const radius = Math.round(miles * METERS_PER_MILE);
  const cuisines = food.osm.map((c) => c.replace(/[^a-z0-9_-]/gi, "")).join("|");
  const around = `(around:${radius},${origin.lat},${origin.lon})`;
  return `[out:json][timeout:25];
nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream)$"]["cuisine"~"(^|;) *(${cuisines}) *($|;)",i]${around};
out center 60;`;
}

async function findPlaces(food, origin, miles) {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: "data=" + encodeURIComponent(buildOverpassQuery(food, origin, miles)),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error("The restaurant search service is busy. Try again in a moment.");
  const data = await res.json();

  return data.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const t = el.tags || {};
      if (!t.name || lat == null) return null;
      const address = [[t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), t["addr:city"]]
        .filter(Boolean)
        .join(", ");
      return {
        name: t.name,
        cuisine: (t.cuisine || "").replace(/_/g, " ").replace(/;/g, ", "),
        address,
        hours: t.opening_hours || "",
        website: t.website || t["contact:website"] || "",
        lat,
        lon,
        miles: distanceMiles(origin, { lat, lon }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.miles - b.miles);
}

function mapsLink(place) {
  const q = encodeURIComponent(`${place.name} ${place.address || ""}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}&center=${place.lat},${place.lon}`;
}


// Made-up restaurants for test drives, so the app can be tried without
// sharing a location. Same food and distance always give the same places.
const DEMO_PREFIXES = ["Golden", "Little", "Corner", "Lucky", "Blue Door", "Night Owl", "Main Street", "Copper Pot",
  "Sunny Side", "Old Town", "Two Brothers", "Hometown", "Red Lantern", "Midtown", "Saltwater", "Backyard"];
const DEMO_SUFFIXES = ["Kitchen", "House", "& Co.", "Spot", "Joint", "Bar", "Cafe", "Eatery"];
const DEMO_STREETS = ["Maple Ave", "Main St", "Oak St", "Elm St", "Market St", "2nd Ave", "Park Blvd", "River Rd", "Cedar Ln", "Broadway"];

function seededRandom(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function demoPlaces(food, miles, count = 4) {
  const rand = seededRandom(food.name);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const dish = food.search.replace(/\b\w/g, (c) => c.toUpperCase());
  const closes = food.meals.includes("late") ? ["12 AM", "1 AM", "2 AM"] : ["9 PM", "10 PM", "11 PM"];
  const used = new Set();
  const places = [];
  while (places.length < count) {
    const name = `${pick(DEMO_PREFIXES)} ${dish} ${pick(DEMO_SUFFIXES)}`;
    if (used.has(name)) continue;
    used.add(name);
    places.push({
      name,
      address: `${100 + Math.floor(rand() * 9800)} ${pick(DEMO_STREETS)}`,
      hours: `Open until ${pick(closes)}`,
      rating: (3.9 + rand() * 1).toFixed(1),
      price: "$".repeat(food.price),
      miles: Math.max(0.1, Math.pow(rand(), 1.5) * miles),
      demo: true,
    });
  }
  return places.sort((a, b) => a.miles - b.miles);
}

if (typeof module !== "undefined") module.exports = { buildOverpassQuery, distanceMiles, demoPlaces };
