import { enrichCitations } from "./citations.js";

const cache = new Map();

const SYSTEM = `Bạn là trợ lý giải thích thuốc cho bệnh nhân Việt Nam.
- Trả JSON hợp lệ, tiếng Việt dễ hiểu, không markdown.
- Không chẩn đoán bệnh, không thay bác sĩ.
- Mỗi mô tả phải có căn cứ: trích dẫn nguồn qua mảng citations (key + excerpt ngắn).
- CHỈ dùng key nguồn sau: drugbank, pubmed, byt, who, fda (tối đa 4).
- excerpt: 1 câu nói nguồn đó hỗ trợ điều gì (không bịa số liệu).`;

const SCHEMA = `{
  "display": "tên hiển thị",
  "summary": "1-2 câu công dụng",
  "how_to_take": "cách uống chung",
  "warnings": ["lưu ý 1"],
  "citations": [
    { "key": "drugbank|pubmed|byt|who|fda", "excerpt": "câu căn cứ ngắn" }
  ]
}`;

export async function lookupDrugInfo(client, drugName) {
  const key = (drugName || "").trim().toLowerCase();
  if (!key) throw new Error("Thiếu tên thuốc");
  if (cache.has(key)) return { ...cache.get(key), cached: true };

  const model = process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini";
  const completion = await client.chat.completions.create({
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
  });

  const raw = JSON.parse(completion.choices[0].message.content);
  const display = String(raw.display || drugName).trim();

  const result = {
    id: `ai-${key.slice(0, 40).replace(/\W+/g, "-")}`,
    display,
    summary: String(raw.summary || "").trim(),
    how_to_take: String(raw.how_to_take || "Theo chỉ dẫn trên đơn.").trim(),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : ["Xác nhận với bác sĩ hoặc dược sĩ"],
    citations: enrichCitations(raw.citations, display),
    source: "openai",
    names: [key],
  };

  cache.set(key, result);
  return result;
}
