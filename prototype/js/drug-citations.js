/** Trích dẫn thật từ server (chỉ Vinmec) */

function apiUrl(path) {
  return `${window.location.origin}${path}`;
}

const citeCache = new Map();

export async function fetchCitations(drugName) {
  const key = String(drugName || "").trim().toLowerCase();
  if (!key) return [];
  if (citeCache.has(key)) return citeCache.get(key);

  try {
    const res = await fetch(
      apiUrl(`/api/citations?name=${encodeURIComponent(drugName)}`)
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.status);
    const list = data.citations || [];
    citeCache.set(key, list);
    return list;
  } catch (e) {
    console.warn("Citations:", drugName, e);
    citeCache.set(key, []);
    return [];
  }
}

export async function attachCitations(drug) {
  if (!drug || drug.source === "fallback") return drug;
  const name = drug.display || drug.names?.[0];
  if (!name) return drug;

  const citations = await fetchCitations(name);
  return { ...drug, citations };
}
