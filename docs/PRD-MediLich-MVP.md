# PRD — MediLịch MVP
**Phiên bản:** 1.2  
**Ngày:** 2026-06-04  
**Mục tiêu:** Demo Hackathon

---

## 1. Tổng quan sản phẩm

**MediLịch** là ứng dụng web dạng Android PWA giúp người cao tuổi nhắc uống thuốc đúng giờ, đúng liều — bằng cách **scan ảnh đơn thuốc** thay vì nhập tay. AI tự đọc đơn, tạo lịch nhắc và cung cấp thông tin công dụng từng loại thuốc.

```
┌─────────────────────────────────────────────────────────┐
│                    MEDILỊCH                             │
│         Scan Đơn → Lịch Nhắc → Thẻ Thuốc              │
│                                                         │
│  📷 Chụp ảnh  →  🤖 AI đọc  →  🔔 Nhắc đúng giờ      │
│                                     ↓                   │
│                              💊 Biết công dụng          │
│                                     ↓                   │
│                              🏪 Tìm nhà thuốc gần       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Người dùng mục tiêu

### Chân dung người dùng — Bà Lan, 68 tuổi

```
┌──────────────────────────────────────────────────────────┐
│  👵 BÀ LAN — Người dùng chính                           │
│  68 tuổi · Hưu trí · Sống một mình tại TP.HCM          │
├──────────────────────────────────────────────────────────┤
│  MỤC TIÊU                  │  NỖI ĐAU                  │
│  • Uống thuốc đúng giờ     │  • Hay quên liều buổi trưa│
│  • Hiểu mình đang uống gì  │  • Chữ đơn khó đọc        │
│  • Tự chăm sóc sức khỏe    │  • App khác quá phức tạp  │
├──────────────────────────────────────────────────────────┤
│  THIẾT BỊ          │  KỸ NĂNG CÔNG NGHỆ                 │
│  Android cũ (2019) │  ⭐⭐☆☆☆ Cơ bản                   │
│  4G internet       │  Dùng được Zalo, chụp ảnh          │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm người dùng:**
- Hay quên uống thuốc hoặc uống sai liều
- Không quen dùng app phức tạp
- Có đơn thuốc giấy hoặc ảnh chụp từ app bệnh viện
- Không hiểu rõ công dụng của từng loại thuốc đang uống
- Cần giao diện đơn giản, chữ rõ, thao tác ít bước

---

## 3. Phát biểu vấn đề

### 3.1 Bối cảnh & Quy mô vấn đề

> Tại Việt Nam, hơn 11 triệu người trên 65 tuổi (2024). Tuân thủ dùng thuốc kém là nguyên nhân hàng đầu khiến bệnh mãn tính trở nặng và tái nhập viện.

### 3.2 Hành trình đau đớn hiện tại (Trước khi có MediLịch)

```
BÁC SĨ KÊ ĐƠN
      │
      ▼
┌─────────────────┐     ┌─────────────────────────────────┐
│  Nhận đơn giấy  │────▶│  ĐỌC TỪNG DÒNG (khó, chữ nhỏ) │
└─────────────────┘     └──────────────┬──────────────────┘
                                        │ ❌ Mệt mỏi, sai sót
                                        ▼
                         ┌─────────────────────────────────┐
                         │  NHẬP TAY vào app nhắc nhở     │
                         │  • Tên thuốc (hay viết tắt)    │
                         │  • Liều lượng                  │
                         │  • Tần suất                    │
                         │  • Số ngày                     │
                         └──────────────┬──────────────────┘
                                        │ ❌ Tốn 15-30 phút
                                        │ ❌ Dễ nhập sai
                                        ▼
                         ┌─────────────────────────────────┐
                         │  KHÔNG BIẾT thuốc uống để làm  │
                         │  gì, tác dụng phụ ra sao       │
                         └──────────────┬──────────────────┘
                                        │ ❌ Lo lắng, không yên tâm
                                        ▼
                         ┌─────────────────────────────────┐
                         │  QUÊN hoặc BỎ CUỘC             │
                         │  → Không uống thuốc đúng phác  │
                         │    đồ → Bệnh trở nặng          │
                         └─────────────────────────────────┘
```

### 3.3 Hành trình với MediLịch (Sau khi có MediLịch)

```
BÁC SĨ KÊ ĐƠN
      │
      ▼
┌─────────────────┐     ┌─────────────────────────────────┐
│  Nhận đơn giấy  │────▶│  CHỤP ẢNH bằng MediLịch        │
└─────────────────┘     └──────────────┬──────────────────┘
                                        │ ✅ 3 giây
                                        ▼
                         ┌─────────────────────────────────┐
                         │  AI ĐỌC ĐƠN tự động            │
                         │  → Danh sách thuốc + liều đầy  │
                         │    đủ, chính xác                │
                         └──────────────┬──────────────────┘
                                        │ ✅ < 30 giây
                                        ▼
                         ┌─────────────────────────────────┐
                         │  XÁC NHẬN & LƯU                │
                         │  → Lịch nhắc tự động tạo       │
                         └──────────────┬──────────────────┘
                                        │ ✅ 1 chạm
                                        ▼
                         ┌─────────────────────────────────┐
                         │  NHẮC ĐÚNG GIỜ mỗi ngày        │
                         │  + Biết công dụng từng thuốc   │
                         │  + Tìm nhà thuốc gần khi cần   │
                         └─────────────────────────────────┘
```

### 3.4 So sánh trước và sau

| | App hiện tại (nhập tay) | MediLịch |
|---|---|---|
| Thời gian nhập đơn | 15-30 phút | < 30 giây |
| Khả năng sai sót | Cao (nhập tay) | Thấp (AI + xác nhận) |
| Biết công dụng thuốc | Không | Có (AI + nguồn uy tín) |
| Tìm nhà thuốc | Tự tìm Google | Tích hợp sẵn |
| Ngưỡng sử dụng | Cao (nhiều bước) | Thấp (chụp ảnh là xong) |

### 3.5 Hậu quả nếu không giải quyết
- Uống thuốc sai giờ, bỏ liều
- Không tuân thủ phác đồ điều trị
- Ảnh hưởng trực tiếp đến sức khỏe người cao tuổi

---

## 4. Hành trình người dùng

### 4.1 Đường đi chính (Đơn chuẩn)

```
                    ┌─────────────┐
                    │   NHẬN ĐƠN  │
                    │   THUỐC MỚI │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Mở app     │
                    │  MediLịch   │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │     CHỤP / TẢI ẢNH     │
              │     đơn thuốc          │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   AI PHÂN TÍCH < 30s   │
              │   ✓ Tên thuốc          │
              │   ✓ Liều lượng         │
              │   ✓ Tần suất           │
              │   ✓ Số ngày            │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   XÁC NHẬN đơn         │
              │   (chỉnh nếu cần)      │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  LƯU & ĐỒNG BỘ LỊCH   │
              └────┬──────────────┬─────┘
                   │              │
         ┌─────────▼──┐    ┌──────▼────────┐
         │  🔔 NHẮC   │    │  💊 THẺ THUỐC │
         │  đúng giờ  │    │  công dụng    │
         │  mỗi ngày  │    │  + citations  │
         └─────────┬──┘    └──────┬────────┘
                   │              │
                   └──────┬───────┘
                          │
              ┌───────────▼───────────┐
              │  🏪 TÌM NHÀ THUỐC GẦN│
              │  khi cần mua thêm    │
              └───────────────────────┘
```

### 4.2 Các nhánh phụ

```
Scan thất bại ──────▶ Dùng Tab Demo (fixture)
                       hoặc nhập tay thủ công

Thiếu internet ──────▶ Dùng fixture offline
                       + local drug DB (data/drugs.json)

Thuốc không rõ ──────▶ Banner "Xác nhận với
                        bác sĩ / dược sĩ"

Ảnh xoay/nghiêng ───▶ Lỗi 422 + hướng dẫn xoay
                       ảnh rồi thử lại
```

---

## 5. Tính năng MVP

### P0 — Bắt buộc (demo không thiếu)

| # | Tính năng | Mô tả | File |
|---|---|---|---|
| F1 | **Scan đơn thuốc** | Upload ảnh → VietOCR (tùy chọn) hoặc OpenAI Vision → JSON tự động; kiểm tra hướng ảnh trả lỗi 422 nếu cần | `openai-parse.js` |
| F2 | **Xác nhận & chỉnh sửa** | Hiển thị danh sách thuốc, badge confidence, cho phép sửa trước khi lưu | `app.js renderReview()` |
| F3 | **Lịch nhắc tự động** | Tạo lịch từ đơn, hiển thị nhắc tiếp theo, nút "Đã uống" và "Nhắc lại 10p" | `schedule.js`, `reminders.js` |
| F4 | **Thẻ thuốc** | Tra công dụng AI/local DB + citations thật từ Vinmec khi lookup khớp | `openai-drug.js`, `citation-lookup.js`, `drug-citations.js` |
| F5 | **Demo offline** | 3 preset fixture để demo không cần API key | `fixtures/` |

### P1 — Nên có (tăng điểm ấn tượng)

| # | Tính năng | Mô tả | File |
|---|---|---|---|
| F6 | **Lịch tháng** | Xem lịch uống theo tháng, chấm xanh đánh dấu ngày có nhắc, đồng bộ đơn ↔ lịch nhắc | `calendar-ui.js` |
| F7 | **Tìm nhà thuốc gần** | Dùng OpenStreetMap Overpass, không cần API trả phí, bán kính 2.5km | `nearby-places.js`, `nearby.js` |
| F8 | **Giả lập thông báo** | Mô phỏng push notification toast trong demo | `app.js showNotif()` |

### Sơ đồ tính năng

```
┌────────────────────────────────────────────────────────┐
│                    MEDILỊCH FEATURES                   │
├───────────────────┬────────────────────────────────────┤
│   LUỒNG SCAN      │         ỨNG DỤNG CHÍNH             │
│                   │  ┌──────┬──────────┬──────────┐   │
│  📷 Upload ảnh   │  │ 🔔   │    📅    │    💊    │   │
│       ↓           │  │NHẮC  │   LỊCH   │  THUỐC   │   │
│  🤖 AI Vision    │  │      │          │          │   │
│       ↓           │  │Nhắc  │Lịch tháng│Thẻ thuốc │   │
│  ✏️ Xác nhận     │  │tiếp  │Sync đơn  │Citations │   │
│       ↓           │  │Hôm   │↔ lịch   │Nhà thuốc │   │
│  💾 Lưu & sync   │  │nay   │          │gần       │   │
│                   │  │      │          │          │   │
│  📋 Demo mode    │  └──────┴──────────┴──────────┘   │
└───────────────────┴────────────────────────────────────┘
```

### Ngoài phạm vi MVP
- Tài khoản người dùng / đăng nhập
- Lưu trữ đám mây / đồng bộ thiết bị
- Nhắc nhở thực sự qua push notification hệ thống
- Quản lý nhiều người dùng (gia đình)
- Tích hợp bệnh viện / HIS

---

## 6. Tiêu chí thành công

| Tiêu chí | Mục tiêu | Cách đo |
|---|---|---|
| Tốc độ scan | ≤ 30 giây từ ảnh → lịch nhắc | Bấm giờ khi demo |
| Trải nghiệm lần đầu | Dùng được không cần hướng dẫn | Quan sát người thử |
| Phản ứng ban giám khảo | "Wow" khi xem scan | Phản hồi trực tiếp |
| Độ ổn định | 0 crash trong demo | Quan sát trong demo |

---

## 7. Định hướng thiết kế

**Vibe:** Ấm áp · Đáng tin · Đơn giản · Chuyên nghiệp

### Bảng màu
```
Primary:    #1B6B5A  ██  Xanh y tế — tin cậy, sức khỏe
On-Primary: #FFFFFF  ██  Chữ trên nền xanh
Surface:    #F5FAF8  ██  Nền card — sáng, sạch
Error:      #B00020  ██  Cảnh báo liều sai
```

### Nguyên tắc thiết kế
```
✅ Chữ lớn (≥16px body) — thân thiện người cao tuổi
✅ Contrast cao (WCAG AA)
✅ Tối đa 2 thao tác đến tính năng chính
✅ Material Design 3 — quen với Android
✅ Mobile-first, phone shell 390px
✅ Loading state rõ ràng — không để trống màn hình
```

---

## 8. Cân nhắc kỹ thuật

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Frontend | Vanilla JS ES Modules | Không cần build step, deploy đơn giản |
| Backend | Node.js + Express (ESM) | Nhẹ, đủ dùng cho hackathon |
| AI OCR | GPT-4o-mini Vision | Đọc tiếng Việt tốt, chi phí thấp |
| AI Tra thuốc | GPT-4o-mini Chat | Cache in-memory, nhanh từ lần 2 |
| OCR tùy chọn | VietOCR (Python Flask :5001) | Tốt hơn cho đơn in sẵn |
| Bản đồ | OpenStreetMap Overpass | Miễn phí, không cần API key |
| Lưu trữ | `sessionStorage` | Đủ cho demo, không cần DB |
| Upload ảnh | multer (memoryStorage, max 12MB) | Tích hợp sẵn Express |

---

## 9. Ràng buộc

| Ràng buộc | Chi tiết | Giải pháp |
|---|---|---|
| **Internet** | Cần để gọi OpenAI + Overpass | Demo mode offline sẵn sàng |
| **API Key** | `OPENAI_API_KEY` trong `server/.env` | `.env.example` có hướng dẫn |
| **Thời gian demo** | < 5 phút trình bày | Demo script 3 bước rõ ràng |
| **Ngôn ngữ** | Toàn bộ tiếng Việt | System prompt + UI đều VI |
| **Platform** | Web Chrome tốt nhất | PWA-ready, không cần install |
| **Ảnh** | Chỉ nhận file ảnh (image/*), tối đa 12MB | Kiểm tra mimetype qua multer |

---

## 10. Định nghĩa hoàn thành

Demo được coi là hoàn thành khi:

- [ ] `npm start` trong `prototype/server/` → mở `localhost:3000` thành công
- [ ] Status pill hiện **"AI OK"** — OpenAI đã kết nối
- [ ] Upload ảnh đơn → AI trả danh sách thuốc trong **≤ 30 giây**
- [ ] Lưu & đồng bộ → lịch nhắc hiển thị đúng tab Nhắc
- [ ] Tab Thuốc → thẻ thuốc hiển thị công dụng + citations
- [ ] Demo mode (fixture "Đơn chuẩn") hoạt động **không cần internet**
- [ ] Giao diện không lỗi layout trên màn hình **390px width**
- [ ] Ban giám khảo tự thử được **không cần hướng dẫn**
