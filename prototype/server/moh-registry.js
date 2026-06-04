import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "moh_registry",
  "403-qd-qld-2026.drugs.json"
);

let registryCache = null;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  const stop = new Set([
    "mg",
    "ml",
    "g",
    "mcg",
    "iu",
    "vien",
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "inj",
    "injection",
    "oral",
    "film",
    "coated",
  ]);
  return normalize(value)
    .split(" ")
    .filter((t) => t.length > 2 && !stop.has(t) && !/^\d+$/.test(t));
}

function loadRegistry() {
  if (registryCache) return registryCache;

  const registryFiles = [];

  // Check data/moh_registry
  const dir1 = path.join(__dirname, "..", "..", "data", "moh_registry");
  if (fs.existsSync(dir1)) {
    try {
      const files = fs.readdirSync(dir1).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        registryFiles.push(path.join(dir1, f));
      }
    } catch (e) {
      console.error(`Error reading registry directory ${dir1}:`, e);
    }
  }

  // Check data/manual_registry
  const dir2 = path.join(__dirname, "..", "..", "data", "manual_registry");
  if (fs.existsSync(dir2)) {
    try {
      const files = fs.readdirSync(dir2).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        registryFiles.push(path.join(dir2, f));
      }
    } catch (e) {
      console.error(`Error reading registry directory ${dir2}:`, e);
    }
  }

  let allRows = [];
  for (const filePath of registryFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const rows = JSON.parse(fileContent);
      if (Array.isArray(rows)) {
        allRows = allRows.concat(rows);
      }
    } catch (e) {
      console.error(`Error loading registry file ${filePath}:`, e);
    }
  }

  // Fallback to single REGISTRY_PATH if everything was empty
  if (allRows.length === 0 && fs.existsSync(REGISTRY_PATH)) {
    try {
      allRows = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    } catch (e) {
      console.error(`Error reading fallback registry file:`, e);
    }
  }

  registryCache = allRows.map((row) => ({
    ...row,
    _name: normalize(row.medicine_name),
    _active: normalize(row.active_ingredient),
    _registration: normalize(
      `${row.registration_number || ""} ${row.previous_registration_number || ""}`
    ),
    _combined: normalize(
      `${row.medicine_name || ""} ${row.active_ingredient || ""} ${row.registration_number || ""} ${row.previous_registration_number || ""}`
    ),
  }));
  return registryCache;
}

function scoreRecord(record, query) {
  const q = normalize(query);
  if (!q) return 0;

  if (record._registration && record._registration.includes(q)) return 100;
  if (record._name === q) return 98;
  if (record._name.includes(q) || q.includes(record._name)) return 92;
  if (record._active.includes(q)) return 82;

  const queryTokens = tokens(query);
  if (!queryTokens.length) return 0;

  const combined = new Set(record._combined.split(" "));
  const matched = queryTokens.filter((token) => combined.has(token));
  const ratio = matched.length / queryTokens.length;
  if (ratio >= 0.8) return 76;
  if (ratio >= 0.6) return 66;
  if (matched.length >= 1 && queryTokens.length <= 2) return 58;
  return 0;
}

export function registryStats() {
  const rows = loadRegistry();
  return {
    available: rows.length > 0,
    count: rows.length,
    source: "QĐ 403/QĐ-QLD ngày 29/05/2026",
  };
}

export function lookupMohRegistry(query, limit = 5) {
  const rows = loadRegistry();
  const matches = rows
    .map((record) => ({ record, score: scoreRecord(record, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record, score }) => ({
      score,
      medicine_name: record.medicine_name,
      active_ingredient: record.active_ingredient,
      registration_number: record.registration_number,
      previous_registration_number: record.previous_registration_number,
      decision: record.decision,
      appendix: record.appendix,
      page: record.page,
    }));

  return {
    query,
    licensed: matches.length > 0,
    source: "QĐ 403/QĐ-QLD ngày 29/05/2026",
    matches,
  };
}

export function lookupMohRegistryBatch(names, limit = 3) {
  const results = {};
  for (const name of names) {
    const key = String(name || "").trim();
    if (!key) continue;
    results[key] = lookupMohRegistry(key, limit);
  }
  return results;
}
