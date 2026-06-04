import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createOpenAIClient, parseFromImage, parseFromText, normalizeLines } from "./openai-parse.js";
import { lookupDrugInfo } from "./openai-drug.js";
import { lookupCitations } from "./citation-lookup.js";
import { pharmacyHint } from "./openai-pharmacy-hint.js";
import { findNearbyPlaces } from "./nearby-places.js";
import { ocrWithVietOCR, pingVietOCR } from "./vietocr-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const OCR_MODE = (process.env.OCR_MODE || "auto").toLowerCase();
const VIETOCR_URL = process.env.VIETOCR_URL || "http://127.0.0.1:5001";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Chỉ chấp nhận file ảnh"));
      return;
    }
    cb(null, true);
  },
});

const app = express();
app.use(cors());
app.use(express.json());

const openai = createOpenAIClient();

app.get("/api/health", async (_req, res) => {
  const vietocrUp = await pingVietOCR(VIETOCR_URL);
  res.json({
    ok: true,
    server: "medilich-node",
    openai: Boolean(openai),
    vietocr: vietocrUp,
    ocr_mode: OCR_MODE,
    drug_lookup: true,
    nearby_places: true,
    pharmacy_hint: Boolean(openai),
  });
});

app.get("/api/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Math.min(Number(req.query.radius) || 2500, 8000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Thiếu lat, lng hợp lệ" });
    }

    const places = await findNearbyPlaces(lat, lng, radius);
    res.json({
      places,
      disclaimer:
        "Dữ liệu OpenStreetMap. Không xác nhận nhà thuốc đang bán thuốc cụ thể — gọi hỏi trước.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Nearby search failed" });
  }
});

app.get("/api/citations", async (req, res) => {
  try {
    const name = String(req.query.name || req.query.drug_name || "").trim();
    if (!name) return res.status(400).json({ error: "Thiếu name" });

    const citations = await lookupCitations(name);
    res.json({
      drug_name: name,
      citations,
      verified: true,
      note:
        citations.length === 0
          ? "Không tìm thấy bài viết/nhãn thuốc khớp trên PubMed, FDA, RxNorm, Wikipedia."
          : "Chỉ hiển thị nguồn có kết quả tra cứu thật.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Citation lookup failed" });
  }
});

app.post("/api/pharmacy-hint", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "Thiếu OPENAI_API_KEY" });
    }
    const drug_name = String(req.body?.drug_name || "").trim();
    const display = String(req.body?.display || drug_name).trim();
    if (!drug_name) return res.status(400).json({ error: "Thiếu drug_name" });

    const hint = await pharmacyHint(openai, drug_name, display);
    res.json(hint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Pharmacy hint failed" });
  }
});

app.post("/api/drugs-lookup", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "Thiếu OPENAI_API_KEY" });
    }
    const names = Array.isArray(req.body?.drugs) ? req.body.drugs : [];
    if (!names.length) return res.status(400).json({ error: "Thiếu mảng drugs" });

    const results = {};
    for (const name of names) {
      const trimmed = String(name).trim();
      if (!trimmed) continue;
      try {
        results[trimmed] = await lookupDrugInfo(openai, trimmed);
      } catch (e) {
        results[trimmed] = { error: e.message };
      }
    }
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Batch lookup failed" });
  }
});

app.post("/api/drug-info", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "Thiếu OPENAI_API_KEY" });
    }
    const name = req.body?.drug_name?.trim();
    if (!name) return res.status(400).json({ error: "Thiếu drug_name" });
    const info = await lookupDrugInfo(openai, name);
    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Drug lookup failed" });
  }
});

app.post("/api/parse-rx", upload.single("image"), async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "Thiếu OPENAI_API_KEY. Tạo file server/.env từ .env.example",
      });
    }

    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: "Thiếu ảnh đơn thuốc (field: image)" });
    }

    const { buffer, mimetype } = req.file;
    let rawText = "";
    let ocrEngine = "openai-vision";

    const useVietOCR =
      OCR_MODE === "vietocr" ||
      (OCR_MODE === "auto" && (await pingVietOCR(VIETOCR_URL)));

    if (useVietOCR) {
      rawText = await ocrWithVietOCR(buffer, mimetype, VIETOCR_URL);
      ocrEngine = "vietocr";
      const parsed = await parseFromText(openai, rawText);
      const norm = normalizeLines(parsed);
      return res.json({
        ...norm,
        raw_text: rawText,
        ocr_engine: ocrEngine,
        parse_model: process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini",
      });
    }

    const parsed = await parseFromImage(openai, buffer, mimetype);
    const norm = normalizeLines(parsed);
    return res.json({
      ...norm,
      raw_text: norm.raw_text_preview || parsed.raw_text_preview || "",
      ocr_engine: ocrEngine,
      parse_model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Parse failed",
    });
  }
});

app.use(express.static(ROOT));

app.get("*", (_req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Rx Scan → http://localhost:${PORT}`);
  console.log(`  OpenAI: ${openai ? "yes" : "NO — add OPENAI_API_KEY to server/.env"}`);
  console.log(`  OCR mode: ${OCR_MODE} (VietOCR @ ${VIETOCR_URL})\n`);
});
