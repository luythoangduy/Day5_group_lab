/**
 * Vinmec-only citation lookup.
 * Uses Vinmec's public search suggestion API and only returns vinmec.com URLs.
 */

import { fetchJsonSafe } from "./fetch-json-safe.js";

const VINMEC_BASE = "https://www.vinmec.com";
const cache = new Map();

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
  const fromParen = paren?.[1] ? normalizeQuery(paren[1]) : null;
  const tokens = base
    .toLowerCase()
    .split(/[^a-z0-9à-ỹ]+/i)
    .filter((t) => t.length > 3 && !/^\d+$/.test(t));
  const primary = tokens.sort((a, b) => b.length - a.length)[0] || base;
  return [...new Set([fromParen, base, primary].filter(Boolean))];
}

async function searchVinmec(term) {
  const data = await fetchJsonSafe(
    `${VINMEC_BASE}/api/v3/search?term=${encodeURIComponent(term)}`
  );
  const value = data?.value || {};
  const out = [];

  for (const item of value.drug || []) {
    const title = cleanText(item.drug_name);
    const slug = String(item.drug_slug || "").trim();
    if (!title || !slug) continue;
    out.push({
      key: "vinmec",
      title: `Vinmec — ${title}`,
      type: "official",
      url: `${VINMEC_BASE}/vie/thuoc/${slug}`,
      excerpt: cleanText(stripHtml(item.drug_content)).slice(0, 220),
      source_id: slug,
    });
  }

  for (const item of value.post || []) {
    const title = cleanText(item.post_title);
    const slug = String(item.post_slug || "").trim();
    if (!title || !slug) continue;
    out.push({
      key: "vinmec",
      title: `Vinmec — ${title}`,
      type: "official",
      url: `${VINMEC_BASE}/vie/bai-viet/${slug}`,
      excerpt: cleanText(item.post_sapo).slice(0, 220),
      source_id: slug,
    });
  }

  return out;
}

export async function lookupCitations(drugName) {
  const key = normalizeQuery(drugName).toLowerCase();
  if (!key) return [];
  if (cache.has(key)) return cache.get(key);

  const citations = [];
  const seenUrl = new Set();

  const add = (items) => {
    for (const c of items || []) {
      if (!c?.url || !c.url.startsWith(VINMEC_BASE) || seenUrl.has(c.url)) continue;
      seenUrl.add(c.url);
      citations.push(c);
    }
  };

  for (const term of searchTerms(drugName)) {
    if (citations.length >= 5) break;
    add(await searchVinmec(term));
  }

  const out = citations.slice(0, 5);
  cache.set(key, out);
  return out;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}
