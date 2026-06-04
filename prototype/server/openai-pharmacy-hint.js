/**
 * AI hỗ trợ tìm mua thuốc — KHÔNG khẳng định nhà thuốc nào còn hàng.
 * Chỉ: câu hỏi nên hỏi dược sĩ, từ khóa tìm Maps, lưu ý thuốc kê đơn.
 */

import { parseModelJson } from "./parse-model-json.js";
import { resolveModel } from "./openai-parse.js";

const cache = new Map();

export async function pharmacyHint(client, drugName, displayName) {
  const key = `${drugName}|${displayName}`.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const model = resolveModel(undefined, "parse");
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Trợ lý dược Việt Nam. JSON tiếng Việt.
KHÔNG khẳng định nhà thuốc cụ thể có bán thuốc.
Chỉ gợi ý cách hỏi và tìm.`,
      },
      {
        role: "user",
        content: `Thuốc: "${displayName || drugName}"
Schema:
{
  "maps_search_query": "từ khóa tìm Google Maps",
  "ask_pharmacist": ["3 câu nên hỏi dược sĩ"],
  "buying_tips": "1 câu lưu ý (kê đơn, bảo quản...)",
  "hospital_note": "khi nào nên đến BV thay vì nhà thuốc"
}`,
      },
    ],
    temperature: 0.3,
  });

  const raw = parseModelJson(completion.choices[0].message.content, "Pharmacy hint");
  const result = {
    maps_search_query: String(raw.maps_search_query || `nhà thuốc ${drugName}`).trim(),
    ask_pharmacist: Array.isArray(raw.ask_pharmacist) ? raw.ask_pharmacist.map(String) : [],
    buying_tips: String(raw.buying_tips || "").trim(),
    hospital_note: String(raw.hospital_note || "").trim(),
    disclaimer:
      "Danh sách địa điểm từ bản đồ công cộng. Không xác nhận còn thuốc — vui lòng gọi trước khi đi.",
  };

  cache.set(key, result);
  return result;
}
