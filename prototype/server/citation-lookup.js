/**
 * Trích dẫn từ API công khai — chỉ trả về nguồn khi có kết quả thật.
 * Không hardcode DrugBank/PubMed/BYT; không dùng AI bịa link.
 */

const cache = new Map();
const FETCH_MS = 12000;

const NCBI_TOOL = "MediLichRxPrototype";
const NCBI_EMAIL = process.env.NCBI_EMAIL || "medilich-lab@example.com";

function normalizeQuery(name) {
  return String(name)
    .replace(/\d+\s*(mg|ml|g|iu|mcg|%)/gi, " ")
    .replace(/\b(tab|tablet|vien|caps|cap|oral)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ưu tiên hoạt chất (token latin dài) */
function searchTerms(drugName) {
  const base = normalizeQuery(drugName);
  const tokens = base
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !/^\d+$/.test(t));
  const primary = tokens.sort((a, b) => b.length - a.length)[0] || base;
  return { primary, full: base };
}

async function fetchJson(url, headers = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "User-Agent": "MediLich-RxPrototype/1.0 (VinAI educational)",
        Accept: "application/json",
        ...headers,
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function searchPubMed(term) {
  const q = encodeURIComponent(term);
  const esearch = await fetchJson(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=2&sort=relevance&term=${q}&tool=${NCBI_TOOL}&email=${encodeURIComponent(NCBI_EMAIL)}`
  );
  const ids = esearch?.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const summary = await fetchJson(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}&tool=${NCBI_TOOL}&email=${encodeURIComponent(NCBI_EMAIL)}`
  );
  const result = summary?.result || {};

  return ids
    .map((id) => {
      const row = result[id];
      if (!row?.title) return null;
      const journal = row.source || row.fulljournalname || "";
      const year = row.pubdate?.slice(0, 4) || "";
      return {
        key: "pubmed",
        title: row.title.replace(/\.$/, ""),
        type: "research",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        excerpt: journal ? `${journal}${year ? ` (${year})` : ""}` : `PubMed ID ${id}`,
        source_id: id,
      };
    })
    .filter(Boolean);
}

async function searchOpenFda(term) {
  const esc = term.replace(/"/g, '\\"');
  const tries = [
    `openfda.generic_name:"${esc}"`,
    `openfda.brand_name:"${esc}"`,
    `openfda.substance_name:"${esc}"`,
  ];

  for (const search of tries) {
    const data = await fetchJson(
      `https://api.fda.gov/drug/label.json?limit=1&search=${encodeURIComponent(search)}`
    );
    const hit = data?.results?.[0];
    if (!hit) continue;

    const brand =
      hit.openfda?.brand_name?.[0] ||
      hit.openfda?.generic_name?.[0] ||
      term;
    const purpose =
      hit.indications_and_usage?.[0] ||
      hit.purpose?.[0] ||
      hit.description?.[0];
    const setId = hit.set_id;
    const url = setId
      ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`
      : `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}`;

    return [
      {
        key: "fda",
        title: `DailyMed — ${brand}`,
        type: "official",
        url,
        excerpt: String(purpose || "Nhãn thuốc FDA (OpenFDA)")
          .replace(/\s+/g, " ")
          .slice(0, 180),
        source_id: setId || null,
      },
    ];
  }
  return [];
}

async function searchRxNorm(term) {
  const data = await fetchJson(
    `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(term)}`
  );
  const termLow = term.toLowerCase();
  let concept = null;
  for (const group of data?.drugGroup?.conceptGroup || []) {
    for (const c of group.conceptProperties || []) {
      const n = (c.name || "").toLowerCase();
      if (n.includes(termLow) || termLow.includes(n.split(" ")[0])) {
        concept = c;
        break;
      }
    }
    if (concept) break;
  }
  if (!concept?.rxcui) return [];

  const name = concept.name || term;
  return [
    {
      key: "rxnorm",
      title: `RxNorm — ${name}`,
      type: "database",
      url: `https://rxnav.nlm.nih.gov/REST/rxcui/${concept.rxcui}/properties`,
      excerpt: concept.synonym || `RxCUI ${concept.rxcui}`,
      source_id: concept.rxcui,
    },
  ];
}

async function searchWikipedia(term, lang) {
  const data = await fetchJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(term)}`
  );
  const hit = data?.query?.search?.[0];
  if (!hit?.title) return [];

  const title = hit.title;
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const snippet = (hit.snippet || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return [
    {
      key: `wikipedia-${lang}`,
      title: `Wikipedia${lang === "vi" ? " (vi)" : ""} — ${title}`,
      type: "reference",
      url: `https://${lang}.wikipedia.org/wiki/${slug}`,
      excerpt: snippet.slice(0, 200) || hit.title,
      source_id: hit.pageid,
    },
  ];
}

/**
 * @returns {Promise<Array<{key,title,type,url,excerpt,source_id?}>>}
 */
export async function lookupCitations(drugName) {
  const key = normalizeQuery(drugName).toLowerCase();
  if (!key) return [];
  if (cache.has(key)) return cache.get(key);

  const { primary, full } = searchTerms(drugName);
  const terms = [...new Set([primary, full].filter(Boolean))];

  const citations = [];
  const seenUrl = new Set();

  const add = (items) => {
    for (const c of items) {
      if (!c?.url || seenUrl.has(c.url)) continue;
      seenUrl.add(c.url);
      citations.push(c);
    }
  };

  for (const term of terms) {
    if (citations.length >= 6) break;

    const [pubmed, fda, rxnorm, wikiVi, wikiEn] = await Promise.all([
      searchPubMed(term),
      searchOpenFda(term),
      searchRxNorm(term),
      searchWikipedia(term, "vi"),
      searchWikipedia(term, "en"),
    ]);

    add(pubmed);
    add(fda);
    add(rxnorm);
    add(wikiVi);
    add(wikiEn);
  }

  const out = citations.slice(0, 6);
  cache.set(key, out);
  return out;
}
