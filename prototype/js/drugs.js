let drugDb = [];
const aiCache = new Map();
let apiReady = null;

function apiUrl(path) {
  return `${window.location.origin}${path}`;
}

export function resetDrugApiCheck() {
  apiReady = null;
}

export async function checkDrugApi() {
  if (apiReady !== null) return apiReady;
  try {
    const res = await fetch(apiUrl("/api/health"));
    if (!res.ok) {
      apiReady = false;
      return false;
    }
    const h = await res.json();
    apiReady = h.server === "medilich-node" && h.openai === true;
    return apiReady;
  } catch {
    apiReady = false;
    return false;
  }
}

export async function loadDrugDb() {
  const res = await fetch("./data/drugs.json");
  drugDb = await res.json();
  return drugDb;
}

function normalizeName(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function coreTokens(norm) {
  const stop = new Set(["mg", "ml", "g", "iu", "tab", "vien", "caps", "cap", "oral", "mgv"]);
  return norm
    .split(" ")
    .filter((t) => t.length > 2 && !stop.has(t) && !/^\d+$/.test(t));
}

export function matchDrug(drugName) {
  if (!drugName || !drugDb.length) return null;
  const norm = normalizeName(drugName);
  const tokens = coreTokens(norm);

  for (const drug of drugDb) {
    const displayNorm = normalizeName(drug.display);
    if (norm.includes(displayNorm) || displayNorm.includes(norm)) {
      return { ...drug, source: "local" };
    }
    for (const alias of drug.names) {
      const a = normalizeName(alias);
      if (norm.includes(a) || a.includes(norm)) {
        return { ...drug, source: "local" };
      }
      for (const t of tokens) {
        if (t.includes(a) || a.includes(t)) {
          return { ...drug, source: "local" };
        }
      }
    }
  }
  return null;
}

export async function fetchDrugFromAI(drugName) {
  const key = normalizeName(drugName);
  if (aiCache.has(key)) return aiCache.get(key);

  const hasApi = await checkDrugApi();
  if (!hasApi) {
    throw new Error(
      "API tra thuốc không chạy. Tắt server cũ, chạy: cd prototype/server → npm start → mở http://localhost:3000"
    );
  }

  const res = await fetch(apiUrl("/api/drug-info"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug_name: drugName }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server trả lỗi không phải JSON — dùng npm start trong server/");
  }

  if (!res.ok) {
    throw new Error(data.error || `Lỗi tra thuốc (${res.status})`);
  }

  if (!data.summary) {
    throw new Error("OpenAI không trả dữ liệu thuốc");
  }

  data.source = "openai";
  aiCache.set(key, data);
  return data;
}

export async function fetchDrugsBatchAI(drugNames) {
  const hasApi = await checkDrugApi();
  if (!hasApi) throw new Error("Cần chạy npm start trong prototype/server");

  const need = drugNames.filter((n) => !matchDrug(n) && !aiCache.has(normalizeName(n)));
  if (!need.length) return;

  const res = await fetch(apiUrl("/api/drugs-lookup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drugs: need }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Batch lookup failed");

  for (const [name, info] of Object.entries(data.results || {})) {
    if (info.error) continue;
    aiCache.set(normalizeName(name), { ...info, source: "openai" });
  }
}

export async function resolveDrug(drugName, { forceRetry = false } = {}) {
  const local = matchDrug(drugName);
  if (local) return local;

  const key = normalizeName(drugName);
  if (!forceRetry && aiCache.has(key)) {
    const c = aiCache.get(key);
    if (c.source !== "fallback") return c;
  }

  try {
    return await fetchDrugFromAI(drugName);
  } catch (e) {
    console.error("Drug lookup:", drugName, e);
    return {
      id: `unknown-${key}`,
      display: drugName,
      summary: e.message || "Không tra được. Thử nút Tra lại.",
      how_to_take: "Theo chỉ dẫn trên đơn.",
      warnings: ["Không thay thế tư vấn y tế"],
      source: "fallback",
      error: e.message,
    };
  }
}

export function getDrugById(id) {
  return drugDb.find((d) => d.id === id) || null;
}
