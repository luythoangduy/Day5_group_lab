import { parseModelJson } from "./parse-model-json.js";
import { lookupCitations } from "./citation-lookup.js";
import { resolveModel } from "./openai-parse.js";

const cache = new Map();

const SYSTEM = `Bạn là trợ lý giải thích thuốc cho bệnh nhân Việt Nam.
- CHỈ trả một object JSON thuần, không markdown, không HTML, không giải thích ngoài JSON.
- Tiếng Việt dễ hiểu.
- Không chẩn đoán bệnh, không thay bác sĩ.
- KHÔNG trả citations hay links.
- Chỉ dùng thông tin trong nguồn Vinmec được cung cấp. Nếu không có nguồn Vinmec khớp, nói rõ chưa tìm thấy nguồn Vinmec khớp và khuyên hỏi bác sĩ/dược sĩ.`;

const SCHEMA = `{
  "display": "tên hiển thị",
  "summary": "1-2 câu công dụng",
  "how_to_take": "cách uống chung",
  "warnings": ["lưu ý 1"]
}`;

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

export async function lookupDrugInfo(client, drugName) {
  const key = (drugName || "").trim().toLowerCase();
  if (!key) throw new Error("Thiếu tên thuốc");
  if (cache.has(key)) return { ...cache.get(key), cached: true };

  const model = resolveModel(undefined, "parse");
  const ingredient = extractIngredientName(drugName);
  const vinmecCitations = await lookupCitations(drugName);
  if (!vinmecCitations.length) {
    const result = {
      id: `unverified-${key.slice(0, 40).replace(/\W+/g, "-")}`,
      display: drugName,
      summary: "Chưa tìm thấy bài viết Vinmec khớp tên thuốc này nên chưa thể tóm tắt công dụng.",
      how_to_take: "Theo đúng chỉ định trên đơn. Hỏi bác sĩ hoặc dược sĩ nếu chưa chắc.",
      warnings: ["Không tự suy luận công dụng thuốc khi chưa có nguồn Vinmec khớp."],
      citations: [],
      source: "fallback",
      names: [key],
      unverified: true,
    };
    cache.set(key, result);
    return result;
  }
  const promptName =
    ingredient && ingredient.toLowerCase() !== key
      ? `${drugName} (hoạt chất: ${ingredient})`
      : drugName;

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Giải thích thuốc trên đơn Việt Nam: "${promptName}"\n\nNguồn Vinmec tìm được:\n${JSON.stringify(vinmecCitations.map((c) => ({ title: c.title, excerpt: c.excerpt })))}\n\nSchema:\n${SCHEMA}`,
        },
      ],
      temperature: 0.2,
    });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("HTML") || msg.includes("<!DOCTYPE") || msg.includes("Unexpected token")) {
      throw new Error(
        "Không kết nối được OpenAI (mạng/VPN/proxy trả trang HTML). Kiểm tra OPENAI_API_KEY và thử tắt proxy."
      );
    }
    throw e;
  }

  const raw = parseModelJson(
    completion.choices[0]?.message?.content,
    "OpenAI thuốc"
  );
  const display = String(raw.display || drugName).trim();

  const result = {
    id: `ai-${key.slice(0, 40).replace(/\W+/g, "-")}`,
    display,
    summary: String(raw.summary || "").trim(),
    how_to_take: String(raw.how_to_take || "Theo chỉ dẫn trên đơn.").trim(),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.map(String)
      : ["Xác nhận với bác sĩ hoặc dược sĩ"],
    citations: vinmecCitations,
    source: "openai",
    names: [key],
  };

  cache.set(key, result);
  return result;
}
