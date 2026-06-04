/** Parse JSON từ OpenAI — bỏ markdown, cắt object, báo lỗi rõ */

export function parseModelJson(content, label = "OpenAI") {
  if (!content || typeof content !== "string") {
    throw new Error(`${label} trả nội dung rỗng`);
  }

  let text = content.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const preview = content.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(
      `${label} trả JSON không hợp lệ (${e.message}). Bản đầu: "${preview}…"`
    );
  }
}
