/**
 * Tìm nhà thuốc / bệnh viện gần — OpenStreetMap Overpass (miễn phí)
 * overpass-api.de trả 406 nếu thiếu User-Agent mô tả rõ (không dùng UA mặc định Node/fetch).
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

/** Bắt buộc — OSM/Overpass chặn script không tự nhận diện */
const OVERPASS_HEADERS = {
  "User-Agent": "MediLich-RxPrototype/1.0 (VinAI-Batch02; educational; contact: lab@local)",
  Accept: "application/json",
  "Content-Type": "application/x-www-form-urlencoded",
};

function buildQuery(lat, lng, radiusM = 2500) {
  const r = Math.round(radiusM);
  const la = Number(lat).toFixed(6);
  const lo = Number(lng).toFixed(6);
  return `[out:json][timeout:25];
(
  node["amenity"="pharmacy"](around:${r},${la},${lo});
  node["amenity"="hospital"](around:${r},${la},${lo});
  node["healthcare"="pharmacy"](around:${r},${la},${lo});
);
out body 20;`;
}

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapsLink(lat, lng, name) {
  const q = encodeURIComponent(name || "nhà thuốc");
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${q}`;
}

async function queryOverpass(url, query) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 28000);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: OVERPASS_HEADERS,
      body: `data=${encodeURIComponent(query)}`,
      signal: ac.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  const trimmed = text.trim();
  if (!res.ok) {
    const hint =
      res.status === 406
        ? " — server từ chối request (thường do thiếu User-Agent hợp lệ)"
        : "";
    throw new Error(`HTTP ${res.status}${hint}: ${trimmed.slice(0, 120)}`);
  }

  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error("Overpass trả HTML thay vì JSON");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("Overpass trả dữ liệu không phải JSON");
  }
}

export async function findNearbyPlaces(lat, lng, radiusM = 2500) {
  const query = buildQuery(lat, lng, radiusM);
  let lastErr = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await queryOverpass(endpoint, query);
      return parseElements(data, lat, lng);
    } catch (e) {
      lastErr = e;
      console.warn(`Overpass ${endpoint}:`, e.message);
    }
  }

  throw new Error(
    lastErr?.message ||
      "Không kết nối được Overpass — thử lại sau hoặc dùng Google Maps"
  );
}

function parseElements(data, lat, lng) {
  const places = [];

  for (const el of data.elements || []) {
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;

    const tags = el.tags || {};
    const name = tags.name || tags["name:vi"] || "Nhà thuốc / Y tế";
    const type =
      tags.amenity === "hospital" || tags.healthcare === "hospital"
        ? "hospital"
        : "pharmacy";

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      type,
      type_label: type === "hospital" ? "Bệnh viện / phòng khám" : "Nhà thuốc",
      lat: plat,
      lng: plng,
      distance_m: Math.round(haversineM(lat, lng, plat, plng)),
      address: [tags["addr:street"], tags["addr:city"], tags["addr:district"]]
        .filter(Boolean)
        .join(", "),
      phone: tags.phone || tags["contact:phone"] || null,
      maps_url: mapsLink(plat, plng, name),
    });
  }

  places.sort((a, b) => a.distance_m - b.distance_m);
  return places.slice(0, 12);
}
