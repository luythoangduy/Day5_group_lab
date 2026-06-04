# Technical Design — MediLịch MVP
**Phiên bản:** 1.1  
**Ngày:** 2026-06-04  
**Dựa trên:** PRD-MediLich-MVP.md

---

## 1. Recommended Approach

**Giữ nguyên stack hiện tại — tập trung polish & risk mitigation.**

Prototype đã hoạt động với đầy đủ tính năng MVP. Thay vì refactor, ưu tiên:
1. Đảm bảo demo không crash
2. UX mượt hơn cho người cao tuổi
3. Fallback đầy đủ cho 3 rủi ro chính

---

## 2. System Architecture

### 2.1 Tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  app.js  │  │ drugs.js │  │nearby.js │  │calendar  │  │
│  │(orchestr)│  │(tra thuốc│  │(UI map)  │  │-ui.js    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘  │
│       │              │              │                        │
│  ┌────▼──────────────▼──────────────▼───────────────────┐  │
│  │                    api.js (HTTP client)               │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ HTTP / REST                    │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│              SERVER (Node.js + Express :3000)               │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐ │
│  │                    index.js (Router)                   │ │
│  │  GET  /api/health        POST /api/parse-rx            │ │
│  │  POST /api/drug-info     POST /api/drugs-lookup        │ │
│  │  GET  /api/nearby        POST /api/pharmacy-hint       │ │
│  └──┬───────────┬───────────┬──────────────┬─────────────┘ │
│     │           │           │              │               │
│  ┌──▼──┐  ┌────▼────┐  ┌───▼──────┐  ┌───▼──────────┐   │
│  │parse│  │drug.js  │  │nearby    │  │pharmacy-hint │   │
│  │.js  │  │+citations│  │-places.js│  │.js           │   │
│  └──┬──┘  └────┬────┘  └───┬──────┘  └──────────────┘   │
│     │           │           │                              │
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

### 2.2 Alternative Options (Đã loại)

| Option | Lý do loại |
|---|---|
| React / Next.js | Over-engineer cho hackathon, mất thời gian migrate |
| React Native | Cần build native, không kịp hackathon |
| Serverless (Vercel) | Prototype cần Node server riêng, deploy phức tạp hơn |
| gpt-4o full | Chi phí cao hơn, không cần thiết cho demo |

---

## 3. Project Setup

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
    ├── index.html              ← SPA entry point
    ├── css/styles.css          ← Material Design styles
    ├── js/
    │   ├── app.js              ← Orchestrator chính
    │   ├── api.js              ← HTTP client → backend
    │   ├── parse.js            ← Validate/normalize đơn thuốc
    │   ├── schedule.js         ← Tạo lịch nhắc từ đơn
    │   ├── drugs.js            ← Tra thuốc (local + AI)
    │   ├── nearby.js           ← UI tìm nhà thuốc
    │   ├── calendar-ui.js      ← Lịch tháng
    │   ├── reminders.js        ← Logic nhắc nhở
    │   ├── citations-ui.js     ← Render citations
    │   └── drug-citations.js   ← Xử lý citations data
    ├── data/drugs.json         ← Database thuốc local
    ├── fixtures/               ← Demo offline (3 preset)
    └── server/
        ├── index.js            ← Express server
        ├── openai-parse.js     ← Vision → JSON đơn thuốc
        ├── openai-drug.js      ← Tra thông tin thuốc AI
        ├── openai-pharmacy-hint.js
        ├── nearby-places.js    ← Overpass OSM
        ├── citations.js        ← Enrich citations
        ├── vietocr-client.js   ← VietOCR sidecar client
        ├── vietocr_service.py  ← Flask VietOCR (tùy chọn)
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

## 4. Data Flow Diagrams

### 4.1 Scan Đơn Thuốc (F1 — Core Feature)

```
USER                  CLIENT                    SERVER              OPENAI
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
 │                      │              [OCR_MODE=auto, VietOCR OFF]    │
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
 │  Hiển thị review     │                          │                   │
 │◀─────────────────────┤                          │                   │
```

### 4.2 Tra Thông Tin Thuốc (F4 — Drug Cards)

```
CLIENT                        SERVER                    OPENAI
  │                              │                         │
  │  POST /api/drugs-lookup      │                         │
  │  { drugs: ["Amoxicillin",    │                         │
  │    "Paracetamol"] }          │                         │
  ├─────────────────────────────▶│                         │
  │                              │                         │
  │                              │  Check cache (Map)      │
  │                              │  → cache miss           │
  │                              │                         │
  │                              │  Chat completion        │
  │                              ├────────────────────────▶│
  │                              │                         │
  │                              │  { display, summary,    │
  │                              │    warnings, citations} │
  │                              │◀────────────────────────┤
  │                              │                         │
  │                              │  enrichCitations()      │
  │                              │  → thêm URL thật        │
  │                              │                         │
  │                              │  cache.set(drugName)    │
  │                              │                         │
  │  { results: { ... } }        │                         │
  │◀─────────────────────────────┤                         │
  │                              │                         │
  │  [Lần 2 — cache hit]         │                         │
  │  POST /api/drug-info         │                         │
  ├─────────────────────────────▶│                         │
  │                              │  cache.get() → hit ✓   │
  │  { ...drug, cached: true }   │  Không gọi OpenAI      │
  │◀─────────────────────────────┤                         │
```

### 4.3 Tìm Nhà Thuốc Gần (F7)

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

### 4.4 State Machine — App Flow

```
                    ┌──────────────┐
                    │  SCAN FLOW   │◀──────────────────┐
                    │  (onboarding)│                   │
                    └──────┬───────┘                   │
                           │                     btn-scan-fab-nav
                    ┌──────▼───────┐                   │
                    │  Step 1:     │                   │
                    │  Upload/Demo │                   │
                    └──────┬───────┘                   │
                           │ onAnalyze()               │
                    ┌──────▼───────┐                   │
                    │  Step 2:     │                   │
                    │  Review      │                   │
                    └──────┬───────┘                   │
                           │ onSaveAndSync()            │
                    ┌──────▼───────────────────────────┤
                    │         MAIN APP                 │
                    │  ┌────────────────────────────┐  │
                    │  │  Tab: HOME (Nhắc)          │  │
                    │  │  Tab: CALENDAR (Lịch)      │  │
                    │  │  Tab: MEDS (Thuốc)         │  │
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

---

## 5. Feature Implementation

### F1 — Scan đơn thuốc
```
Upload ảnh
    → multer (memoryStorage, max 12MB)
    → pingVietOCR() [timeout 2s]
    → [auto] OpenAI Vision: parseFromImage()
           model: gpt-4o-mini
           detail: "high"
           response_format: json_object
    → normalizeLines() clamp validation
    → { lines[], ocr_engine, parse_model }
```

### F2 — Xác nhận & chỉnh sửa
```
renderReview()
    → HTML inputs cho mỗi rxLine
    → validateLines() real-time
    → badges danger/warn
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

Phân bổ giờ uống:
```
1 lần/ngày  → ["08:00"]
2 lần/ngày  → ["08:00", "20:00"]
3 lần/ngày  → ["08:00", "13:00", "20:00"]
4 lần/ngày  → ["08:00", "12:00", "17:00", "21:00"]
```

### F4 — Thẻ thuốc + Citations
```
fetchDrugsBatchAI(names)
    → POST /api/drugs-lookup
    → cache check → openai-drug.js
    → enrichCitations():
        drugbank  → drugbank.com/drugs/...
        pubmed    → pubmed.ncbi.nlm.nih.gov/...
        byt       → moh.gov.vn
        who       → who.int
        fda       → fda.gov
```

### F5 — Demo offline
```
fixtures/
    sample-rx-happy.json     → Đơn chuẩn 3 thuốc
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
    → findNearbyPlaces() Overpass query
    → render danh sách + link Google Maps
```

### F8 — Giả lập thông báo
```
showNotif(body, title)
    → toast.classList.add("show")
    → setTimeout remove after 4000ms
```

---

## 6. Database & Storage

### sessionStorage Schema

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

**Upgrade path (v2):**
```
sessionStorage → localStorage → IndexedDB → Supabase
```

### In-memory cache (Server)
```javascript
const cache = new Map()
// key: drug_name.toLowerCase()
// value: { display, summary, warnings, citations, source }
// TTL: sống theo process (restart = clear)
```

---

## 7. AI Assistance Strategy

### OCR Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    OCR DECISION TREE                     │
│                                                          │
│  Upload ảnh                                             │
│      │                                                  │
│      ▼                                                  │
│  OCR_MODE == "vietocr"? ─── Yes ──▶ VietOCR (bắt buộc)│
│      │ No                                               │
│      ▼                                                  │
│  OCR_MODE == "auto"?                                    │
│      │ Yes                                              │
│      ▼                                                  │
│  pingVietOCR() OK? ─── Yes ──▶ VietOCR + parseFromText │
│      │ No                                               │
│      ▼                                                  │
│  OpenAI Vision (parseFromImage)                         │
└──────────────────────────────────────────────────────────┘
```

### Prompt Strategy

| Feature | Temperature | Lý do |
|---|---|---|
| OCR parse | 0.1 | Cần deterministic, ít sáng tạo |
| Drug info | 0.2 | Cần chính xác, chút linh hoạt cho diễn đạt |
| Pharmacy hint | 0.3 | Gợi ý mang tính tự nhiên hơn |

### AI Safety Guardrails
```
System prompt bắt buộc:
✅ Không chẩn đoán bệnh
✅ Không thay thế bác sĩ / dược sĩ
✅ Citations chỉ dùng key cố định (không bịa URL)
✅ Disclaimer "Xác nhận với bác sĩ" trong warnings
```

---

## 8. Deployment Plan

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
[ ] .env có OPENAI_API_KEY hợp lệ
[ ] npm start thành công → status pill: "AI OK"
[ ] Test scan 1 ảnh đơn thật → kết quả < 30s
[ ] Demo mode (fixture "Đơn chuẩn") hoạt động offline
[ ] Không có lỗi console đỏ
[ ] Test màn hình 390px (mobile view)
[ ] Pin laptop > 50% hoặc cắm sạc
[ ] Có ảnh đơn thuốc thật để demo
```

---

## 9. Cost Breakdown

### API Costs (ước tính per demo session)

| Call | Model | Token ước tính | Chi phí |
|---|---|---|---|
| Parse đơn (vision) | gpt-4o-mini | ~800 tokens | ~$0.001 |
| Tra 3-5 thuốc | gpt-4o-mini | ~500 tokens/thuốc | ~$0.003 |
| Pharmacy hint | gpt-4o-mini | ~300 tokens | ~$0.0005 |
| **Tổng 1 demo** | | | **< $0.01** |
| **10 lần demo** | | | **< $0.10** |

### Infrastructure
```
Localhost:    $0
Overpass OSM: $0  (miễn phí, public good)
VietOCR:      $0  (self-hosted)
─────────────────
Tổng hạ tầng: $0/tháng
```

---

## 10. Risk Mitigation

### Rủi ro 1: API chậm / timeout

```
Vấn đề: OpenAI trả kết quả sau > 30 giây

Giải pháp:
┌────────────────────────────────────────────────────┐
│  Client-side:                                      │
│  → setLoading(true, "AI đang đọc đơn…")           │
│  → AbortController timeout 30s                    │
│  → Alert thân thiện: "Thử lại hoặc dùng Demo"     │
│                                                    │
│  Fallback:                                         │
│  → Tab "Demo mẫu" luôn hiển thị                   │
│  → prefetchDrugInfo() sau scan để warm cache       │
└────────────────────────────────────────────────────┘
```

### Rủi ro 2: UI vỡ layout

```
Vấn đề: Giao diện lỗi trên màn hình khác kích thước

Giải pháp:
┌────────────────────────────────────────────────────┐
│  → .phone-shell max-width: 430px (cố định)        │
│  → reflowShell() sau mỗi tab switch               │
│  → Google Fonts + system-ui fallback              │
│  → Test Chrome DevTools 390px trước demo          │
└────────────────────────────────────────────────────┘
```

### Rủi ro 3: Mất internet

```
Vấn đề: Không kết nối được trong lúc demo

Giải pháp:
┌────────────────────────────────────────────────────┐
│  → Demo mode: fixture không cần API               │
│  → data/drugs.json: local DB không cần server     │
│  → Banner "Chỉ demo" khi detect không có key      │
│  → Chuẩn bị demo trên fixture trước, scan sau    │
└────────────────────────────────────────────────────┘
```

---

## 11. Scaling Path (Post-hackathon)

```
┌─────────────────────────────────────────────────────┐
│  HACKATHON MVP (hiện tại)                          │
│  Vanilla JS + Node.js + sessionStorage             │
│  Localhost                                          │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V1 — PWA Installable                              │
│  localStorage + Service Worker offline cache       │
│  Deploy: Railway / Render (free tier)              │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V2 — Multi-device                                 │
│  Supabase (auth + Postgres) + React frontend       │
│  React Native app (iOS + Android)                  │
│  Push notification thật                            │
└──────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  V3 — Enterprise                                   │
│  Tích hợp HIS bệnh viện                           │
│  Quản lý gia đình (nhiều người dùng)               │
│  Teleconsult với dược sĩ                           │
└─────────────────────────────────────────────────────┘
```

### Limitations hiện tại
- Dữ liệu mất khi đóng tab (sessionStorage)
- Không có auth — không phân biệt người dùng
- Không push notification thật (chỉ giả lập)
- VietOCR cần chạy thủ công trên máy local
- Overpass OSM có thể chậm giờ cao điểm
- In-memory drug cache reset khi restart server
