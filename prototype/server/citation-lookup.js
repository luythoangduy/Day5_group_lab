/**
 * Trích dẫn từ API công khai — chỉ khi có kết quả thật.
 */

import { fetchJsonSafe } from "./fetch-json-safe.js";

const cache = new Map();
const NCBI_TOOL = "MediLichRxPrototype";
const NCBI_EMAIL = process.env.NCBI_EMAIL || "medilich-lab@example.com";

function normalizeQuery(name) {
  return String(name)
    .replace(/\d+\s*(mg|ml|g|iu|mcg|%)/gi, " ")
    .replace(/\b(tab|tablet|vien|caps|cap|oral)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTerms(drugName) {
  const base = normalizeQuery(drugName);
  const paren = String(drugName).match(/\(([^)]+)\)/);
  const fromParen = paren?.[1]
    ? normalizeQuery(paren[1])
    : null;

  const tokens = base
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !/^\d+$/.test(t));
  const primary = tokens.sort((a, b) => b.length - a.length)[0] || base;

  return [...new Set([fromParen, primary, base].filter(Boolean))];
}

async function searchPubMed(term) {
  const q = encodeURIComponent(term);
  const esearch = await fetchJsonSafe(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=2&sort=relevance&term=${q}&tool=${NCBI_TOOL}&email=${encodeURIComponent(NCBI_EMAIL)}`
  );
  const ids = esearch?.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const summary = await fetchJsonSafe(
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
  const esc = encodeURIComponent(term);
  const urls = [
    `https://api.fda.gov/drug/label.json?limit=1&search=openfda.generic_name:${esc}`,
    `https://api.fda.gov/drug/label.json?limit=1&search=openfda.brand_name:${esc}`,
  ];

  for (const url of urls) {
    const data = await fetchJsonSafe(url);
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
    const link = setId
      ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`
      : null;
    if (!link) continue;

    return [
      {
        key: "fda",
        title: `DailyMed — ${brand}`,
        type: "official",
        url: link,
        excerpt: String(purpose || "Nhãn thuốc FDA (OpenFDA)")
          .replace(/\s+/g, " ")
          .slice(0, 180),
        source_id: setId,
      },
    ];
  }
  return [];
}

async function searchRxNorm(term) {
  const data = await fetchJsonSafe(
    `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(term)}`
  );
  const termLow = term.toLowerCase();
  let concept = null;
  for (const group of data?.drugGroup?.conceptGroup || []) {
    for (const c of group.conceptProperties || []) {
      const n = (c.name || "").toLowerCase();
      if (n.includes(termLow)) {
        concept = c;
        break;
      }
    }
    if (concept) break;
  }
  if (!concept?.rxcui) return [];

  return [
    {
      key: "rxnorm",
      title: `RxNorm — ${concept.name || term}`,
      type: "database",
      url: `https://rxnav.nlm.nih.gov/REST/rxcui/${concept.rxcui}/properties`,
      excerpt: concept.synonym || `RxCUI ${concept.rxcui}`,
      source_id: concept.rxcui,
    },
  ];
}

async function searchWikipedia(term, lang) {
  const data = await fetchJsonSafe(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(term)}`
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
      source_id: String(hit.pageid),
    },
  ];
}

export async function lookupCitations(drugName) {
  const key = normalizeQuery(drugName).toLowerCase();
  if (!key) return [];
  if (cache.has(key)) return cache.get(key);

  const terms = searchTerms(drugName);
  const citations = [];
  const seenUrl = new Set();

  const add = (items) => {
    for (const c of items || []) {
      if (!c?.url || seenUrl.has(c.url)) continue;
      seenUrl.add(c.url);
      citations.push(c);
    }
  };

  try {
    for (const term of terms) {
      if (citations.length >= 5) break;

      add(await searchPubMed(term));
      if (citations.length < 3) add(await searchWikipedia(term, "vi"));
      if (citations.length < 3) add(await searchWikipedia(term, "en"));
      if (citations.length < 4) add(await searchOpenFda(term));
      if (citations.length < 5) add(await searchRxNorm(term));
    }
  } catch (e) {
    console.warn("lookupCitations:", drugName, e.message);
  }

  const out = citations.slice(0, 5);
  cache.set(key, out);
  return out;
}
