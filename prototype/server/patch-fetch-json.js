/**
 * Node fetch + OpenAI SDK gọi response.json() — nếu body là HTML (proxy/firewall)
 * sẽ ném SyntaxError <!DOCTYPE ra console. Patch đọc text trước khi parse.
 */
const originalJson = Response.prototype.json;

Response.prototype.json = async function jsonSafe() {
  const text = await this.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SyntaxError("Empty response body (expected JSON)");
  }
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    const url = this.url || "unknown URL";
    throw new SyntaxError(
      `Expected JSON but received HTML from ${url} — check network/proxy/API key`
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    throw new SyntaxError(`Invalid JSON: ${e.message}`);
  }
};

Response.prototype.json._medilichPatched = true;

export function isFetchJsonPatched() {
  return Response.prototype.json._medilichPatched === true;
}
