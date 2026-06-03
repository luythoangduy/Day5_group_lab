# Prototype — Scan Đơn → Lịch Uống + Thẻ Thuốc

Hackathon Day 06 · có **upload ảnh**, **OpenAI Vision**, **VietOCR** (tùy chọn).

## Chạy (bắt buộc có backend — giữ API key an toàn)

### 1. Cấu hình API key

```powershell
cd prototype\server
copy .env.example .env
# Mở .env và dán OPENAI_API_KEY=sk-...
```

**Không commit file `.env`.** Không dán key vào chat công khai — chỉ đặt trong `.env` trên máy bạn.

### 2. Cài & chạy server

```powershell
cd prototype\server
npm install
npm start
```

Mở **http://localhost:3000**

### 3. (Tùy chọn) VietOCR — tiếng Việt tốt hơn cho đơn in

Terminal khác:

```powershell
pip install vietocr pillow flask werkzeug
cd prototype\server
python vietocr_service.py
```

Trong `server/.env`:

```env
OCR_MODE=auto
VIETOCR_URL=http://127.0.0.1:5001
```

- `auto`: dùng VietOCR nếu service đang chạy, không thì **OpenAI Vision** trực tiếp trên ảnh.
- `openai`: luôn Vision.
- `vietocr`: bắt buộc VietOCR (lỗi nếu service tắt).

## Luồng app

| Bước | Màn hình |
|------|----------|
| 1 | Upload ảnh **hoặc** tab Demo mẫu |
| 2 | Review (sửa + chặn lỗi đỏ) |
| 3 | Lịch nhắc |
| 4 | Thẻ thuốc |

## API

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/health` | `openai`, `vietocr` có sẵn không |
| POST | `/api/parse-rx` | `multipart/form-data` field `image` |

## Cấu trúc

```text
prototype/
├── index.html, css/, js/
├── data/drugs.json
├── fixtures/          ← demo offline
└── server/            ← Node + OpenAI + VietOCR client
    ├── index.js
    ├── openai-parse.js
    ├── vietocr_service.py
    └── .env           ← KEY Ở ĐÂY
```

## Demo không có mạng / không key

Tab **Demo mẫu** — vẫn chạy fixtures, không gọi OpenAI.

## Demo script

Xem [`demo-script.md`](demo-script.md)

---

*Thin SPEC: `../02-group-spec/thin-spec-prescription.md`*
