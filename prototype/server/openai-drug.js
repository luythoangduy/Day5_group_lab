import { lookupCitations } from "./citation-lookup.js";
import { parseModelJson } from "./parse-model-json.js";

const cache = new Map();

const SYSTEM = `Bạn là trợ lý giải thích thuốc cho bệnh nhân Việt Nam.
- CHỈ trả một object JSON thuần, không markdown, không HTML, không giải thích ngoài JSON.
- Tiếng Việt dễ hiểu.
- Không chẩn đoán bệnh, không thay bác sĩ.
- KHÔNG trả citations hay links.`;

const SCHEMA = `{
  "display": "tên hiển thị",
  "summary": "1-2 câu công dụng",
  "how_to_take": "cách uống chung",
  "warnings": ["lưu ý 1"]
}`;

/** "Rabeto - 40(Rabeprazol)" → Rabeprazol */
export function extractIngredientName(drugName) {
  const paren = String(drugName).match(/\(([^)]+)\)/);
  if (paren?.[1]) {
    return paren[1]
      .replace(/\d+\s*(mg|ml|g|iu|mcg)/gi, "")
      .trim();
  }
  return String(drugName)
    .replace(/\d+\s*(mg|ml|g|iu|mcg)/gi, "")
    .replace(/[^a-zA-ZÀ-ỹ0-9\s\-]/g, " ")
    .trim();
}

export async function lookupDrugInfo(client, drugName, { skipCitations = false } = {}) {
  const key = (drugName || "").trim().toLowerCase();
  if (!key) throw new Error("Thiếu tên thuốc");
  if (cache.has(key)) return { ...cache.get(key), cached: true };

  const model = process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini";
  const ingredient = extractIngredientName(drugName);
  const promptName =
    ingredient && ingredient.toLowerCase() !== key
      ? `${drugName} (hoạt chất: ${ingredient})`
      : drugName;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Giải thích thuốc trên đơn Việt Nam: "${promptName}"\nSchema:\n${SCHEMA}`,
      },
    ],
    temperature: 0.2,
  });

  const raw = parseModelJson(
    completion.choices[0]?.message?.content,
    "OpenAI thuốc"
  );
  const display = String(raw.display || drugName).trim();

  let resolvedCitations = [];
  if (!skipCitations) {
    try {
      resolvedCitations = await lookupCitations(ingredient || display);
      if (!resolvedCitations.length && display !== drugName) {
        resolvedCitations = await lookupCitations(display);
      }
    } catch (e) {
      console.warn("Citations skip:", drugName, e.message);
    }
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
