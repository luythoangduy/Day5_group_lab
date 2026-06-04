/** Nguồn tin cậy — URL thật, không để AI tự bịa link */

export const TRUSTED_SOURCES = {
  drugbank: {
    title: "DrugBank",
    type: "database",
    url: (q) => `https://go.drugbank.com/unearth/q?searcher=drugs&query=${encodeURIComponent(q)}`,
  },
  pubmed: {
    title: "PubMed (NIH)",
    type: "research",
    url: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
  },
  byt: {
    title: "Cổng dữ liệu dược quốc gia (Bộ Y tế)",
    type: "official",
    url: () => "https://duocquocgia.com.vn/",
  },
  who: {
    title: "WHO — Essential Medicines",
    type: "official",
    url: () => "https://www.who.int/teams/health-product-and-policy-standards/essential-medicines",
  },
  fda: {
    title: "OpenFDA — Nhãn thuốc",
    type: "official",
    url: (q) =>
      `https://api.fda.gov/drug/label.json?limit=1&search=openfda.brand_name:"${encodeURIComponent(q)}"`,
  },
  nhathuoc: {
    title: "Tra cứu nhà thuốc (Google Maps)",
    type: "practical",
    url: (q, lat, lng) =>
      lat && lng
        ? `https://www.google.com/maps/search/nhà+thuốc+${encodeURIComponent(q)}/@${lat},${lng},14z`
        : `https://www.google.com/maps/search/nhà+thuốc+${encodeURIComponent(q)}`,
  },
};

const DEFAULT_KEYS = ["drugbank", "pubmed", "byt"];

/**
 * AI trả citations: [{ key, excerpt }] hoặc mảng string key
 * Gắn URL thật từ registry
 */
export function enrichCitations(aiCitations, drugName, coords = null) {
  const out = [];
  const seen = new Set();

  const items = Array.isArray(aiCitations) ? aiCitations : [];
  for (const item of items) {
    const key = typeof item === "string" ? item : item?.key;
    const excerpt = typeof item === "object" ? item?.excerpt : null;
    if (!key || !TRUSTED_SOURCES[key] || seen.has(key)) continue;
    seen.add(key);
    const src = TRUSTED_SOURCES[key];
    out.push({
      key,
      title: src.title,
      type: src.type,
      url:
        typeof src.url === "function"
          ? src.url(drugName, coords?.lat, coords?.lng)
          : src.url,
      excerpt: excerpt || null,
    });
  }

  for (const key of DEFAULT_KEYS) {
    if (seen.has(key)) continue;
    const src = TRUSTED_SOURCES[key];
    out.push({
      key,
      title: src.title,
      type: src.type,
      url: typeof src.url === "function" ? src.url(drugName) : src.url,
      excerpt: null,
    });
  }

  return out.slice(0, 5);
}
