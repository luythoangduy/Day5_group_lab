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

## Luồng app (giao diện Android — web)

1. **Quét đơn** → AI / demo → **Xác nhận** → **Lưu & đồng bộ lịch**
2. **App chính** (bottom nav):
   - **Nhắc** — nhắc tiếp theo, danh sách hôm nay, Đã uống, giả lập notification
   - **Lịch** — lịch tháng, chạm ngày hoặc **Đồng bộ đơn ↔ lịch** (sheet 2 cột)
   - **Thuốc** — thẻ thuốc
3. Nút camera trên app bar → quét đơn mới

## API

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/health` | Trạng thái `openai`, `vietocr`, `ocr_mode`, `drug_lookup`, `nearby_places`, `pharmacy_hint`, `citations_safe` |
| POST | `/api/parse-rx` | `multipart/form-data` field `image` |
| POST | `/api/drug-info` | Tra thuốc AI + citations thật từ Vinmec |
| GET | `/api/citations?name=` | Chỉ nguồn Vinmec có kết quả tra cứu thật |
| POST | `/api/drugs-lookup` | Batch tra thuốc |
| GET | `/api/nearby?lat=&lng=` | Nhà thuốc / BV gần (Overpass + User-Agent bắt buộc) |
| POST | `/api/pharmacy-hint` | AI gợi ý câu hỏi dược sĩ (không khẳng định còn hàng) |

### Thuốc — nguồn & mua gần đây

- **Nguồn tham khảo** chỉ tra Vinmec — chỉ hiện khi API Vinmec trả kết quả khớp.
- Tab **Thuốc** → chọn thẻ → **Tìm nhà thuốc & bệnh viện gần** (cần quyền vị trí + `npm start`). Không có API tồn kho — user gọi hỏi trước khi đi.

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

Chạy `npm start` trong `prototype/server`, mở app rồi vào tab **Demo** — fixtures vẫn chạy khi thiếu `OPENAI_API_KEY` và không gọi OpenAI.

## Demo script

Xem [`demo-script.md`](demo-script.md)

---

*Thin SPEC: `../02-group-spec/thin-spec-prescription.md`*
