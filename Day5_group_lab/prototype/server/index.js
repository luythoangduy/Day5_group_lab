import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createOpenAIClient, parseFromImage, parseFromText, normalizeLines } from "./openai-parse.js";
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
    openai: Boolean(openai),
    vietocr: vietocrUp,
    ocr_mode: OCR_MODE,
  });
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
