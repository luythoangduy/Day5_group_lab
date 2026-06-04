import { lookupCitations } from "./citation-lookup.js";

const cache = new Map();

const SYSTEM = `Bạn là trợ lý giải thích thuốc cho bệnh nhân Việt Nam.
- Trả JSON hợp lệ, tiếng Việt dễ hiểu, không markdown.
- Không chẩn đoán bệnh, không thay bác sĩ.
- KHÔNG trả citations, links, hoặc tên nguồn — nguồn do hệ thống tra riêng.`;

const SCHEMA = `{
  "display": "tên hiển thị",
  "summary": "1-2 câu công dụng",
  "how_to_take": "cách uống chung",
  "warnings": ["lưu ý 1"]
}`;

export async function lookupDrugInfo(client, drugName) {
  const key = (drugName || "").trim().toLowerCase();
  if (!key) throw new Error("Thiếu tên thuốc");
  if (cache.has(key)) return { ...cache.get(key), cached: true };

  const model = process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini";

  const [completion, citations] = await Promise.all([
    client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Giải thích thuốc trên đơn Việt Nam: "${drugName}"\nSchema:\n${SCHEMA}`,
        },
      ],
      temperature: 0.2,
    }),
    lookupCitations(drugName),
  ]);

  const raw = JSON.parse(completion.choices[0].message.content);
  const display = String(raw.display || drugName).trim();

  let resolvedCitations = citations;
  if (!resolvedCitations.length && display !== drugName) {
    resolvedCitations = await lookupCitations(display);
  }

  const result = {
    id: `ai-${key.slice(0, 40).replace(/\W+/g, "-")}`,
    display,
    summary: String(raw.summary || "").trim(),
    how_to_take: String(raw.how_to_take || "Theo chỉ dẫn trên đơn.").trim(),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.map(String)
      : ["Xác nhận với bác sĩ hoặc dược sĩ"],
    citations: resolvedCitations,
    source: "openai",
    names: [key],
  };

  cache.set(key, result);
  return result;
}
