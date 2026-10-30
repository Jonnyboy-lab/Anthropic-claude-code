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
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
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

function mapsSearchLink(food, origin) {
  const q = encodeURIComponent(food.search);
  return origin
    ? `https://www.google.com/maps/search/${q}/@${origin.lat},${origin.lon},13z`
    : `https://www.google.com/maps/search/${q}+near+me`;
}

if (typeof module !== "undefined") module.exports = { buildOverpassQuery, distanceMiles };
