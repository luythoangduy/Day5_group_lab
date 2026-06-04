# Thiết kế kỹ thuật — MediLịch MVP
**Phiên bản:** 1.2  
**Ngày:** 2026-06-04  
**Dựa trên:** PRD-MediLich-MVP.md

---

## 1. Phương án đề xuất

**Giữ nguyên stack hiện tại — tập trung polish & xử lý rủi ro.**

Prototype đã hoạt động với đầy đủ tính năng MVP. Thay vì refactor, ưu tiên:
1. Đảm bảo demo không crash
2. UX mượt hơn cho người cao tuổi
3. Fallback đầy đủ cho 3 rủi ro chính

---

## 2. Kiến trúc hệ thống

### 2.1 Tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  app.js  │  │ drugs.js │  │nearby.js │  │calendar  │  │
│  │(điều phối│  │(tra thuốc│  │(UI bản đồ│  │-ui.js    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘  │
│       │              │              │                        │
│  ┌────▼──────────────▼──────────────▼───────────────────┐  │
│  │                    api.js (HTTP client)               │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ HTTP / REST                    │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│              SERVER (Node.js + Express :3000, ESM)          │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐ │
│  │                    index.js (Router)                   │ │
│  │  GET  /api/health        POST /api/parse-rx            │ │
│  │  POST /api/drug-info     POST /api/drugs-lookup        │ │
│  │  GET  /api/nearby        GET  /api/citations           │ │
│  │  POST /api/pharmacy-hint                              │ │
│  └──┬───────────┬───────────┬──────────────┬─────────────┘ │
│     │           │           │              │               │
│  ┌──▼──────┐ ┌──▼──────┐ ┌──▼──────────┐ ┌▼─────────────┐│
│  │openai   │ │openai   │ │nearby-      │ │citation-     ││
│  │-parse.js│ │-drug.js │ │places.js    │ │lookup.js     ││
│  └──┬──────┘ └──┬──────┘ └──┬──────────┘ │+ pharmacy-   ││
│     │           │           │             │hint.js       ││
│     │           │           │             └──────────────┘│
└─────┼───────────┼───────────┼──────────────────────────────┘
      │           │           │
      ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────────────┐
│ OpenAI   │ │ OpenAI  │ │ Overpass OSM API │
│ Vision   │ │ Chat    │ │ (miễn phí)       │
│ API      │ │ API     │ └──────────────────┘
└──────────┘ └─────────┘
             ┌─────────────────┐
             │ VietOCR sidecar │  ← Tùy chọn
             │ (Python Flask   │
             │  :5001)         │
             └─────────────────┘
```

### 2.2 Phương án khác (Đã loại bỏ)

| Phương án | Lý do loại |
|---|---|
| React / Next.js | Over-engineer cho hackathon, mất thời gian migrate |
| React Native | Cần build native, không kịp hackathon |
| Serverless (Vercel) | Prototype cần Node server riêng, deploy phức tạp hơn |
| gpt-4o full | Chi phí cao hơn, không cần thiết cho demo |

---

## 3. Thiết lập dự án

### Yêu cầu môi trường

```
Node.js >= 18
npm >= 9
Python 3.8+ (tùy chọn — VietOCR)
```

### Cấu trúc thư mục

```
Day5_group_lab/
├── docs/
│   ├── PRD-MediLich-MVP.md
│   └── TechDesign-MediLich-MVP.md
└── prototype/
    ├── index.html              ← SPA entry point (Android shell)
    ├── css/styles.css          ← Material Design 3 styles
    ├── js/
    │   ├── app.js              ← Điều phối toàn bộ ứng dụng
    │   ├── api.js              ← HTTP client gọi backend
    │   ├── parse.js            ← Validate/normalize đơn thuốc
    │   ├── schedule.js         ← Tạo lịch nhắc từ đơn
    │   ├── reminders.js        ← Logic nhắc nhở (hôm nay, tiếp theo)
    │   ├── drugs.js            ← Tra thuốc (local DB + AI cache)
    │   ├── nearby.js           ← UI tìm nhà thuốc (Overpass)
    │   ├── calendar-ui.js      ← Lịch tháng + đồng bộ đơn↔nhắc
    │   ├── citations-ui.js     ← Render citations HTML
    │   └── drug-citations.js   ← Gắn citations vào thẻ thuốc
    ├── data/drugs.json         ← Database thuốc local (offline)
    ├── fixtures/               ← 3 preset demo offline
    └── server/
        ├── index.js            ← Express server (ESM)
        ├── openai-parse.js     ← Vision / Text → JSON đơn thuốc
        ├── openai-drug.js      ← Tra thông tin thuốc qua AI
        ├── openai-pharmacy-hint.js ← Gợi ý mua thuốc
        ├── nearby-places.js    ← Query Overpass OSM
        ├── citation-lookup.js  ← Tra cứu citation Vinmec thật
        ├── fetch-json-safe.js  ← Fetch JSON có kiểm tra HTML/proxy
        ├── patch-fetch-json.js ← Patch fetch JSON an toàn cho OpenAI SDK
        ├── parse-model-json.js ← Parse JSON từ model response
        ├── vietocr-client.js   ← VietOCR sidecar client
        ├── vietocr_service.py  ← Flask VietOCR (tùy chọn)
        ├── package.json        ← "type": "module", openai ^4.77.0
        └── .env                ← API keys (không commit)
```

### Khởi động nhanh

```powershell
# 1. Cài dependencies
cd prototype/server
npm install

# 2. Cấu hình API key
copy .env.example .env
# Mở .env, thêm: OPENAI_API_KEY=sk-...

# 3. Chạy server
npm start
# → http://localhost:3000
```

---

## 4. Sơ đồ luồng dữ liệu

### 4.1 Scan đơn thuốc (F1 — Tính năng cốt lõi)

```
NGƯỜI DÙNG            CLIENT                    SERVER              OPENAI
 │                      │                          │                   │
 │  Chọn / chụp ảnh     │                          │                   │
 ├─────────────────────▶│                          │                   │
 │                      │  POST /api/parse-rx      │                   │
 │                      │  multipart/form-data     │                   │
 │                      ├─────────────────────────▶│                   │
 │                      │                          │  pingVietOCR()    │
 │                      │                          │──────────────────▶│
 │                      │                          │  (timeout 2s)     │
 │                      │                          │                   │
 │                      │         [OCR_MODE=auto, VietOCR tắt]        │
 │                      │                          │                   │
 │                      │                          │  Vision API call  │
 │                      │                          │  image_url:base64 │
 │                      │                          ├──────────────────▶│
 │                      │                          │                   │
 │                      │                          │  JSON response    │
 │                      │                          │◀──────────────────┤
 │                      │                          │  { lines[], ... } │
 │                      │                          │                   │
 │                      │  { lines, ocr_engine,    │                   │
 │                      │    parse_model, raw_text}│                   │
 │                      │◀─────────────────────────┤                   │
 │                      │                          │                   │
 │  Hiển thị xác nhận   │                          │                   │
 │◀─────────────────────┤                          │                   │
```

### 4.2 Tra thông tin thuốc (F4 — Thẻ thuốc)

```
CLIENT                        SERVER                    OPENAI
  │                              │                         │
  │  POST /api/drugs-lookup      │                         │
  │  { drugs: ["Amoxicillin",    │                         │
  │    "Paracetamol"] }          │                         │
  ├─────────────────────────────▶│                         │
  │                              │                         │
  │                              │  lookupDrugInfo()       │
  │                              │  (local DB trước, AI   │
  │                              │   cho thuốc chưa có)   │
  │                              │                         │
  │                              │  Chat completion        │
  │                              ├────────────────────────▶│
  │                              │                         │
  │                              │  { display, summary,    │
  │                              │    warnings, citations} │
  │                              │◀────────────────────────┤
  │                              │                         │
  │                              │  lookupCitations()      │
  │                              │  → nguồn Vinmec thật    │
  │                              │                         │
  │  { results: { ... } }        │                         │
  │◀─────────────────────────────┤                         │
  │                              │                         │
  │  [Lần 2 — client aiCache]    │                         │
  │  không gọi API lại           │                         │
  ├─────────────────────────────▶│                         │
  │                              │  nếu gọi lại: parse mới│
  │  drugs.js ưu tiên aiCache    │  không gọi lại OpenAI  │
  │◀─────────────────────────────┤                         │
```

### 4.3 Tìm nhà thuốc gần (F7)

```
CLIENT                    SERVER                OVERPASS OSM
  │                          │                       │
  │  GET /api/nearby         │                       │
  │  ?lat=10.77&lng=106.69   │                       │
  ├─────────────────────────▶│                       │
  │                          │  buildQuery()         │
  │                          │  amenity=pharmacy     │
  │                          │  around:2500m         │
  │                          │                       │
  │                          │  POST (endpoint 1)    │
  │                          ├──────────────────────▶│
  │                          │                       │
  │                          │  [Nếu fail → endpoint 2]
  │                          │                       │
  │                          │  JSON elements[]      │
  │                          │◀──────────────────────┤
  │                          │                       │
  │                          │  parseElements()      │
  │                          │  haversineM() sort    │
  │                          │  → top 12 gần nhất    │
  │                          │                       │
  │  { places[], disclaimer }│                       │
  │◀─────────────────────────┤                       │
```

### 4.4 Máy trạng thái — Luồng ứng dụng

```
                    ┌──────────────┐
                    │  LUỒNG SCAN  │◀──────────────────┐
                    │  (onboarding)│                   │
                    └──────┬───────┘                   │
                           │                     btn-scan-fab-nav
                    ┌──────▼───────┐                   │
                    │  Bước 1:     │                   │
                    │  Upload/Demo │                   │
                    └──────┬───────┘                   │
                           │ onAnalyze()               │
                    ┌──────▼───────┐                   │
                    │  Bước 2:     │                   │
                    │  Xác nhận    │                   │
                    └──────┬───────┘                   │
                           │ onSaveAndSync()            │
                    ┌──────▼───────────────────────────┤
                    │         ỨNG DỤNG CHÍNH           │
                    │  ┌────────────────────────────┐  │
                    │  │  Tab: HOME (Nhắc)          │  │
                    │  │  Tab: CALENDAR (Lịch)      │  │
                    │  │  Tab: MEDS (Thuốc)         │  │
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

---

## 5. Chi tiết tính năng

### F1 — Scan đơn thuốc
```
Upload ảnh (image/*, max 12MB)
    → multer memoryStorage
    → pingVietOCR() [timeout 2s]
    → nếu OCR_MODE=auto và VietOCR bật: ocrWithVietOCR() → parseFromText()
    → nếu không: OpenAI Vision parseFromImage()
           model: OPENAI_VISION_MODEL || gpt-4o-mini
           detail: "high"
    → normalizeLines() clamp validation
    → reviewDrugNames() sửa lỗi OCR tên thuốc (so sánh token)
    → orientationError() trả 422 nếu ảnh xoay/nghiêng/khó đọc
    → { lines[], ocr_engine, parse_model, raw_text }
```

### F2 — Xác nhận & chỉnh sửa
```
renderReview()
    → HTML inputs cho mỗi rxLine
    → validateLines() real-time
    → badge danger/warn theo confidence
    → btn-save disabled nếu hasBlockingIssues()
```

### F3 — Lịch nhắc tự động
```
buildSchedule(rxLines)
    → forEach line:
        times = distributeTimes(frequency_per_day)
        forEach day in [0..duration_days):
            events.push({ date, time, drug_name, dose, meal })
    → sessionStorage.setItem()
```

Phân bổ giờ uống mặc định:
```
1 lần/ngày  → ["08:00"]
2 lần/ngày  → ["08:00", "20:00"]
3 lần/ngày  → ["08:00", "14:00", "21:00"]
4 lần/ngày  → ["07:00", "12:00", "17:00", "22:00"]
```

Nhắc nhở trên màn hình Home:
```
getNextReminder()   → nhắc gần nhất chưa uống
getTodayEvents()    → danh sách hôm nay
btn "Đã uống"       → thêm vào takenIds
btn "Nhắc lại 10p"  → editingReminderId + countdown
```

### F4 — Thẻ thuốc + Citations
```
fetchDrugsBatchAI(names)
    → POST /api/drugs-lookup
    → drugs.js kiểm tra aiCache trước (key: normalizeName)
    → local DB (data/drugs.json) match trước
    → thuốc chưa có mới gọi openai-drug.js
    → citation-lookup.js chỉ trả nguồn Vinmec có kết quả lookup thật
    → UI attachCitations() tải citation bổ sung khi mở thẻ thuốc
```

### F5 — Demo offline
```
fixtures/
    sample-rx-happy.json     → Đơn chuẩn 3 thuốc (happy path)
    sample-rx-low-conf.json  → Tần suất mờ (confidence thấp)
    sample-rx-risky.json     → Sai liều (trigger danger badge)
```

### F6 — Lịch tháng
```
renderCalendarGrid(grid, year, month, schedule, selected, onSelect)
    → tạo 7×6 grid
    → đánh dấu ngày có nhắc (chấm xanh)
    → click → openSyncSheet(dateIso)
        → buildSyncView(): prescription vs reminders side-by-side
```

### F7 — Tìm nhà thuốc gần
```
navigator.geolocation.getCurrentPosition()
    → GET /api/nearby?lat=&lng=&radius=2500
    → findNearbyPlaces() Overpass query (bán kính max 8000m)
    → sắp xếp theo khoảng cách haversine
    → render danh sách + link Google Maps
```

### F8 — Giả lập thông báo
```
showNotif(body, title)
    → notif-toast.classList.add("show")
    → setTimeout remove after 4000ms
```

---

## 6. Cơ sở dữ liệu & Lưu trữ

### Schema sessionStorage

```json
{
  "medilich_state": {
    "rxLines": [
      {
        "drug_name": "Amoxicillin 500mg",
        "dose_per_time": "1 viên",
        "frequency_per_day": 3,
        "meal_relation": "sau ăn",
        "duration_days": 7,
        "confidence": {
          "drug_name": 0.95,
          "frequency": 0.9,
          "dose": 0.92
        }
      }
    ],
    "schedule": [
      {
        "date": "2026-06-04",
        "time": "08:00",
        "drug_name": "Amoxicillin 500mg",
        "dose": "1 viên",
        "meal": "sau ăn"
      }
    ],
    "meta": {
      "ocr_engine": "openai-vision",
      "parse_model": "gpt-4o-mini",
      "raw_text": "..."
    },
    "takenIds": ["2026-06-04|08:00|Amoxicillin 500mg"]
  }
}
```

**Lý do giữ sessionStorage:**
- Đủ cho demo hackathon
- Không cần setup database
- Reset sạch sau mỗi tab mới — tiện khi demo nhiều lần

**Lộ trình nâng cấp (v2):**
```
sessionStorage → localStorage → IndexedDB → Supabase
```

### Cache in-memory (Client)
```javascript
const aiCache = new Map()
// key: normalizeName(drug_name)
// value: { display, summary, warnings, citations, source }
// TTL: sống theo tab/session JS (refresh = clear)
```

---

## 7. Chiến lược AI

### Pipeline OCR

```
┌──────────────────────────────────────────────────────────┐
│                    SƠ ĐỒ QUYẾT ĐỊNH OCR                 │
│                                                          │
│  Upload ảnh                                             │
│      │                                                  │
│      ▼                                                  │
│  OCR_MODE == "vietocr"? ─── Có ──▶ VietOCR (bắt buộc)  │
│      │ Không                                            │
│      ▼                                                  │
│  OCR_MODE == "auto"?                                    │
│      │ Có                                               │
│      ▼                                                  │
│  pingVietOCR() OK? ─── Có ──▶ VietOCR + parseFromText  │
│      │ Không                                            │
│      ▼                                                  │
│  OpenAI Vision (parseFromImage)                         │
└──────────────────────────────────────────────────────────┘
```

### Chiến lược prompt

| Tính năng | Temperature | Lý do |
|---|---|---|
| OCR parse | 0.1 | Cần deterministic, ít sáng tạo |
| Thông tin thuốc | 0.2 | Cần chính xác, chút linh hoạt cho diễn đạt |
| Gợi ý nhà thuốc | 0.3 | Gợi ý mang tính tự nhiên hơn |

### Kiểm soát an toàn AI
```
System prompt bắt buộc:
✅ Không chẩn đoán bệnh
✅ Không thay thế bác sĩ / dược sĩ
✅ Citations chỉ dùng key cố định (không bịa URL)
✅ Disclaimer "Xác nhận với bác sĩ" trong warnings
✅ reviewDrugNames() chỉ sửa lỗi OCR rõ ràng, không đổi thuốc
```

---

## 8. Kế hoạch triển khai

### Demo Hackathon (Localhost)

```
┌────────────────────────────────────────────────┐
│  Terminal 1                                    │
│  cd prototype/server && npm start              │
│  → http://localhost:3000 ✓                    │
├────────────────────────────────────────────────┤
│  Terminal 2 (tùy chọn — VietOCR)              │
│  python vietocr_service.py                     │
│  → http://127.0.0.1:5001 ✓                   │
└────────────────────────────────────────────────┘
```

### Checklist trước demo

```
[ ] server/.env có OPENAI_API_KEY hợp lệ
[ ] npm start thành công → status pill: "AI OK"
[ ] Test scan 1 ảnh đơn thật → kết quả < 30s
[ ] Demo mode (fixture "Đơn chuẩn") hoạt động offline
[ ] Không có lỗi console đỏ
[ ] Test màn hình 390px (mobile view Chrome DevTools)
[ ] Pin laptop > 50% hoặc cắm sạc
[ ] Có ảnh đơn thuốc thật để demo
```

---

## 9. Chi phí ước tính

### Chi phí API (ước tính mỗi phiên demo)

| Lần gọi | Model | Token ước tính | Chi phí |
|---|---|---|---|
| Parse đơn (vision) | gpt-4o-mini | ~800 tokens | ~$0.001 |
| Tra 3-5 thuốc | gpt-4o-mini | ~500 tokens/thuốc | ~$0.003 |
| Gợi ý nhà thuốc | gpt-4o-mini | ~300 tokens | ~$0.0005 |
| **Tổng 1 demo** | | | **< $0.01** |
| **10 lần demo** | | | **< $0.10** |

### Hạ tầng
```
Localhost:    $0
Overpass OSM: $0  (miễn phí, public good)
VietOCR:      $0  (tự host)
─────────────────
Tổng hạ tầng: $0/tháng
```

---

## 10. Xử lý rủi ro

### Rủi ro 1: API chậm / timeout

```
Vấn đề: OpenAI trả kết quả sau > 30 giây

Giải pháp:
┌────────────────────────────────────────────────────┐
│  Client-side:                                      │
│  → setLoading(true, "AI đang đọc đơn…")           │
│  → Loading overlay + spinner trong lúc chờ        │
│  → Alert thân thiện: "Thử lại hoặc dùng Demo"     │
│                                                    │
│  Fallback:                                         │
│  → Tab "Demo mẫu" luôn hiển thị                   │
│  → prefetchDrugInfo() sau scan để warm cache       │
└────────────────────────────────────────────────────┘
```

### Rủi ro 2: Giao diện vỡ layout

```
Vấn đề: Giao diện lỗi trên màn hình khác kích thước

Giải pháp:
┌────────────────────────────────────────────────────┐
│  → .phone-shell max-width: 430px (cố định)        │
│  → reflowShell() sau mỗi tab switch               │
│  → Google Fonts (Roboto + Be Vietnam Pro)         │
│     + system-ui fallback                          │
│  → Test Chrome DevTools 390px trước demo          │
└────────────────────────────────────────────────────┘
```

### Rủi ro 3: Mất internet

```
Vấn đề: Không kết nối được trong lúc demo

Giải pháp:
┌────────────────────────────────────────────────────┐
│  → Demo mode: 3 fixture không cần API              │
│  → data/drugs.json: local DB không cần server     │
│  → Banner "Chỉ demo" khi detect không có key      │
│  → Chuẩn bị demo trên fixture trước, scan sau    │
└────────────────────────────────────────────────────┘
```

### Rủi ro 4: Ảnh xoay / nghiêng

```
Vấn đề: Ảnh đơn thuốc bị xoay, AI không đọc được

Giải pháp:
┌────────────────────────────────────────────────────┐
│  → orientationError() kiểm tra document_quality  │
│  → Trả HTTP 422 + message hướng dẫn cụ thể       │
│  → Client hiển thị alert: xoay ảnh rồi thử lại   │
└────────────────────────────────────────────────────┘
```

---

## 11. Lộ trình mở rộng (Sau hackathon)

```
┌─────────────────────────────────────────────────────┐
│  HACKATHON MVP (hiện tại)                          │
│  Vanilla JS + Node.js + sessionStorage             │
│  Localhost                                          │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V1 — PWA Cài được                                 │
│  localStorage + Service Worker offline cache       │
│  Deploy: Railway / Render (free tier)              │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V2 — Đa thiết bị                                  │
│  Supabase (auth + Postgres) + React frontend       │
│  React Native app (iOS + Android)                  │
│  Push notification thật                            │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V3 — Doanh nghiệp                                 │
│  Tích hợp HIS bệnh viện                           │
│  Quản lý gia đình (nhiều người dùng)               │
│  Teleconsult với dược sĩ                           │
└─────────────────────────────────────────────────────┘
```

### Giới hạn hiện tại
- Dữ liệu mất khi đóng tab (sessionStorage)
- Không có auth — không phân biệt người dùng
- Không push notification thật (chỉ giả lập toast)
- VietOCR cần chạy thủ công trên máy local
- Overpass OSM có thể chậm giờ cao điểm
- In-memory drug cache reset khi restart server
