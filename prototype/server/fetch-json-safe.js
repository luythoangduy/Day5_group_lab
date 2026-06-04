/**
 * fetch + parse JSON an toàn — không để res.json() ném lỗi ra ngoài try/catch.
 * (return res.json() không await → SyntaxError <!DOCTYPE không bị bắt)
 */

export async function fetchJsonSafe(url, options = {}, timeoutMs = 12000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ac.signal,
      headers: {
        "User-Agent": "MediLich-RxPrototype/1.0 (VinAI educational)",
        Accept: "application/json",
        ...options.headers,
      },
    });

    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith("<") || trimmed.startsWith("<!")) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
