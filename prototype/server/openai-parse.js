import OpenAI from "openai";

const RX_SCHEMA = `{
  "document_quality": {
    "orientation": "upright|sideways|upside_down|skewed|unknown",
    "readable": true,
    "issues": ["short issue, e.g. text is sideways"]
  },
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
- Nếu ảnh đơn bị xoay ngang, xoay ngược, nghiêng nặng, bị crop mất cột thuốc, hoặc không đọc được an toàn: document_quality.readable=false, nêu issue, và lines: [].
- Nếu không đọc được, lines: [].`;

const DRUG_NAME_REVIEW_SCHEMA = `{
  "corrections": [
    {
      "index": 0,
      "original": "tên thuốc đã parse",
      "corrected": "tên thuốc đã sửa nếu chắc hơn",
      "confidence": 0-1,
      "reason": "ngắn gọn: ví dụ OCR thiếu chữ I trong ZINC"
    }
  ]
}`;

const DRUG_NAME_REVIEW_SYSTEM = `Bạn kiểm tra tên thuốc sau OCR đơn thuốc tiếng Việt.
- Chỉ sửa lỗi OCR rõ ràng: thiếu/dư ký tự, nhầm I/1/l, O/0, C/G, N/M, ZNC→ZINC, khoảng trắng/dấu gạch.
- Không tự đổi sang thuốc khác nếu không có căn cứ trong raw text hoặc tên thuốc phổ biến.
- Giữ nguyên hàm lượng/dạng dùng nếu có.
- Nếu không chắc, corrected = original và confidence <= 0.75.
- Chỉ trả JSON hợp lệ, không markdown.`;

export function resolveModel(modelName, type = "parse") {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  if (provider === "gemini") {
    if (!modelName || modelName === "gpt-4o-mini") {
      if (type === "vision") {
        return process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
      }
      return process.env.GEMINI_MODEL || "gemini-1.5-flash";
    }
    return modelName;
  }
  
  if (modelName) return modelName;
  return type === "vision"
    ? (process.env.OPENAI_VISION_MODEL || "gpt-4o-mini")
    : (process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini");
}

export function createOpenAIClient() {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!key) return null;
    return new OpenAI({
      apiKey: key,
      baseURL: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export async function parseFromText(client, rawText, model) {
  const completion = await client.chat.completions.create({
    model: resolveModel(model, "parse"),
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
    model: resolveModel(model, "vision"),
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
    ...(line.original_drug_name
      ? { original_drug_name: String(line.original_drug_name).trim() }
      : {}),
    ...(line.drug_name_review ? { drug_name_review: line.drug_name_review } : {}),
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
    document_quality: normalizeDocumentQuality(data.document_quality),
    raw_text_preview: data.raw_text_preview || "",
  };
}

export async function reviewDrugNames(client, parsed, rawText = "", model) {
  const lines = parsed?.lines || [];
  if (!client || !lines.length) return parsed;

  const payload = lines.map((line, index) => ({
    index,
    drug_name: line.drug_name,
    dose_per_time: line.dose_per_time,
  }));

  const completion = await client.chat.completions.create({
    model: resolveModel(model, "parse"),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DRUG_NAME_REVIEW_SYSTEM },
      {
        role: "user",
        content: `Raw OCR/preview:\n${String(rawText || parsed.raw_text_preview || "").slice(0, 2500)}\n\nTên thuốc đã parse:\n${JSON.stringify(payload)}\n\nSchema:\n${DRUG_NAME_REVIEW_SCHEMA}`,
      },
    ],
    temperature: 0,
  });

  const review = JSON.parse(completion.choices[0].message.content || "{}");
  const corrections = Array.isArray(review.corrections) ? review.corrections : [];
  const byIndex = new Map(corrections.map((item) => [Number(item.index), item]));

  return {
    ...parsed,
    lines: lines.map((line, index) => {
      const item = byIndex.get(index);
      const corrected = String(item?.corrected || line.drug_name || "").trim();
      const original = String(line.drug_name || "").trim();
      if (!corrected || normalizeLoose(corrected) === normalizeLoose(original)) {
        return line;
      }

      const confidence = clamp01(item?.confidence ?? line.confidence?.drug_name ?? 0.75);
      return {
        ...line,
        drug_name: corrected,
        original_drug_name: original,
        drug_name_review: {
          corrected: true,
          confidence,
          reason: String(item?.reason || "Tên thuốc được kiểm tra lại sau OCR").trim(),
        },
        confidence: {
          ...(line.confidence || {}),
          drug_name: confidence,
        },
      };
    }),
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function clamp01(n) {
  return clamp(Number(n), 0, 1);
}

function normalizeDocumentQuality(quality = {}) {
  const orientation = String(quality.orientation || "unknown").trim().toLowerCase();
  const allowed = new Set(["upright", "sideways", "upside_down", "skewed", "unknown"]);
  const issues = Array.isArray(quality.issues)
    ? quality.issues.map((x) => String(x).trim()).filter(Boolean).slice(0, 5)
    : [];
  return {
    orientation: allowed.has(orientation) ? orientation : "unknown",
    readable: quality.readable !== false,
    issues,
  };
}

function normalizeLoose(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}
