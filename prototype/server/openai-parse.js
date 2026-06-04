import OpenAI from "openai";

const RX_SCHEMA = `{
  "lines": [
    {
      "drug_name": "string",
      "dose_per_time": "string e.g. 1 viên",
      "frequency_per_day": number 1-4,
      "meal_relation": "string e.g. sau ăn, trước ăn",
      "duration_days": number,
      "confidence": {
        "drug_name": 0-1,
        "frequency": 0-1,
        "dose": 0-1
      }
    }
  ],
  "raw_text_preview": "short summary"
}`;

const SYSTEM = `Bạn trích xuất đơn thuốc tiếng Việt thành JSON.
- Chỉ trả JSON hợp lệ, không markdown.
- frequency_per_day: suy từ "2 viên x 3 lần/ngày" → 3.
- confidence thấp (0.4-0.6) nếu chữ mờ hoặc không chắc.
- Bỏ qua thông tin bệnh nhân (tên, CMND) — chỉ thuốc.
- Nếu không đọc được, lines: [].`;

export function createOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export async function parseFromText(client, rawText, model) {
  const completion = await client.chat.completions.create({
    model: model || process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Văn bản OCR đơn thuốc:\n\n${rawText}\n\nSchema:\n${RX_SCHEMA}`,
      },
    ],
    temperature: 0.1,
  });
  return JSON.parse(completion.choices[0].message.content);
}

export async function parseFromImage(client, imageBuffer, mimeType, model) {
  const b64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${b64}`;

  const completion = await client.chat.completions.create({
    model: model || process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Đọc ảnh đơn thuốc (tiếng Việt). Trả JSON theo schema:\n${RX_SCHEMA}`,
          },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
    temperature: 0.1,
  });
  return JSON.parse(completion.choices[0].message.content);
}

export function normalizeLines(data) {
  const lines = (data.lines || []).map((line) => ({
    drug_name: String(line.drug_name || "").trim(),
    dose_per_time: String(line.dose_per_time || "1 liều").trim(),
    frequency_per_day: clamp(Number(line.frequency_per_day) || 1, 1, 4),
    meal_relation: String(line.meal_relation || "").trim(),
    duration_days: Math.max(1, Number(line.duration_days) || 7),
    confidence: {
      drug_name: clamp01(line.confidence?.drug_name ?? 0.85),
      frequency: clamp01(line.confidence?.frequency ?? 0.85),
      dose: clamp01(line.confidence?.dose ?? 0.85),
    },
  }));
  return {
    lines,
    raw_text_preview: data.raw_text_preview || "",
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function clamp01(n) {
  return clamp(Number(n), 0, 1);
}
