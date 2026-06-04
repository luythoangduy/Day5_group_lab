/**
 * Gọi VietOCR sidecar (Python). Chạy: python vietocr_service.py
 */
export async function ocrWithVietOCR(imageBuffer, mimeType, baseUrl) {
  const url = `${baseUrl.replace(/\/$/, "")}/ocr`;
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType || "image/jpeg" });
  form.append("image", blob, "prescription.jpg");

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`VietOCR failed (${res.status}): ${err}`);
  }
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) {
    throw new Error("VietOCR trả dữ liệu không phải JSON");
  }
  const data = JSON.parse(trimmed);
  return data.text || "";
}
export async function pingVietOCR(baseUrl) {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
