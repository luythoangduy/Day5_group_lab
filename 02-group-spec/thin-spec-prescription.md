# Thin SPEC — Scan Đơn Thuốc → Lịch Uống + Thẻ Thuốc

Bản cam kết Day 06 — track đổi từ V-App (archived: `thin-spec-V-App.md`).

---

## 1. Track, product/app và user

**Track:** Healthcare — patient medication adherence (có thể anchor **Vinmec / V-App** ecosystem, prototype độc lập)  
**Product/app thật:** Journey sau khám — đơn thuốc giấy / PDF / screenshot từ app bệnh viện _(không clone app BV; build slice riêng)_  
**User cụ thể:** **Người bệnh** (hoặc **người nhà** đang chăm) vừa nhận đơn có **2–5 thuốc**, tự uống tại nhà, quen smartphone; đơn **in hoặc digital** (không viết tay v1).  
**Nhóm có phải user thật không?** Một phần đã trải nghiệm gõ lịch / app nhắc thuốc; không phải bệnh nhân mãn tính dài hạn — đã bổ sung Google Play crawl MyTherapy làm nguồn ngoài nhóm.

---

## 2. Evidence summary

| Evidence | Nguồn | User/pain | SPEC đổi gì? |
|---|---|---|---|
| Gõ lịch 3 thuốc ~10–15 phút, hay sai tần suất | Self-use | Friction + error | Parse + review bắt buộc |
| Không hiểu tên thuốc trên đơn | Self-use + Google | Cần drug card | DB demo + plain Vietnamese |
| OCR ảnh đơn in: tên OK, tần suất cần sửa | Self-use | Low-confidence | Review UI, không auto-save |
| V-App không deep-link nhắc thuốc in-app | `../01-invidual-workshop/app-teardown.md` | Super-app gap | Prototype độc lập, Vinmec backlog |
| MyTherapy Google Play crawl: reminder/tracker có 5M+ installs, rating ~4.55; review sample nhắc add/enter meds, dose/dosage, reminders, alarms, refill | `google-play-scraper` crawl — [../evidences/mytherapy_google_play_evidence.xlsx](../evidences/mytherapy_google_play_evidence.xlsx) | Competitor baseline: reminder hữu ích sau khi lịch đã có | Scan-first differentiation |

---

## 3. Pain statement

```text
Người bệnh (hoặc người nhà) sau khi khám đang gặp khó ở bước chuyển tiếp từ đơn thuốc giấy/PDF sang lịch uống thực tế hàng ngày,
vì việc tự đọc chữ và gõ thủ công từng tên thuốc, liều lượng, giờ giấc vào điện thoại rất tốn thời gian (~10-15 phút cho đơn 3 thuốc) và dễ nhập sai tần suất/liều lượng, đồng thời các app nhắc thuốc hiện tại chưa hỗ trợ quét đơn tiếng Việt và không giải thích rõ công dụng thuốc,
dẫn tới hậu quả người bệnh dễ uống sai liều gây rủi ro sức khỏe, quên lịch, hoặc hoang mang không hiểu rõ công dụng của các loại thuốc được kê.
Bằng chứng chính: 
- Trải nghiệm tự gõ đơn 3 thuốc mất 10-15 phút;
- OCR thử nghiệm cho thấy tỉ lệ nhận diện tần suất tiếng Việt (như "sau ăn", "3 lần/ngày") bị sai lệch cần sửa tay;
- Google Play crawl MyTherapy cho thấy reminder hữu ích sau khi user đã khai báo thuốc; review sample nhắc nhiều tới add/enter meds, dose/dosage, reminders, alarms, refill;
- Quan sát người dùng phải Google từng tên biệt dược khó nhớ để tự tìm hiểu công dụng.

```

---

## 4. Build slice

```text
Cho người bệnh vừa có đơn thuốc in hoặc ảnh/PDF từ app BV,
prototype sẽ dùng AI để OCR + trích xuất (tên thuốc, liều, số lần/ngày, ăn trước/sau, số ngày),
tạo ra (1) màn xác nhận có thể sửa từng dòng, (2) lịch nhắc uống trong app, (3) thẻ mô tả thuốc tiếng Việt,
và xử lý OCR/parse sai bằng bắt buộc user xác nhận trước khi Lưu — không ghi calendar nếu chưa confirm.
```

### In scope Day 06

| # | Feature |
|---|---|
| 1 | Upload/chụp ảnh đơn hoặc screenshot đơn mẫu (3 test cases fixture) |
| 2 | OCR (OpenAI Vision; VietOCR tùy chọn; fixture JSON cho demo fallback) |
| 3 | LLM/rule **parse → JSON** per line: `drug_name`, `dose_per_time`, `frequency_per_day`, `meal_relation`, `duration_days` |
| 4 | **Review screen** — edit từng field, highlight low-confidence |
| 5 | **Schedule generator** — `N lần/ngày` → time slots (vd. 8h, 14h, 21h); `sau ăn` → label |
| 6 | **Drug cards** — match tên → 3–5 thuốc trong `drugs.json` (mô tả, cách uống, lưu ý) |
| 7 | **MOH registry check** — đối chiếu tên/hoạt chất/số đăng ký với danh mục QĐ 403/QĐ-QLD 2026 (Bộ Y tế); hiển thị badge trạng thái lưu hành trên thẻ thuốc |
| 8 | Demo script 4 paths |

### Out of scope Day 06

- Đơn viết tay  
- Google/iOS Calendar sync  
- Full drug database / interaction checker  
- `cách ngày`, `khi cần`, refill  
- Tích hợp HIS/Vinmec API thật (hiện chỉ lookup citation Vinmec công khai khi có kết quả khớp)  

---

## 5. Auto/Aug decision

- [x] **Augmentation:** AI extract + suggest schedule + drug text; **user quyết** trên review → bấm **Lưu lịch**  
- [ ] Conditional automation  
- [ ] Full automation  

**Lý do:** Sai liều / sai tần suất = rủi ro sức khỏe. Không auto-lưu. AI là bản nháp; user là decider.

**Human role:** **decider** (confirm) · **reviewer** (sửa field) · **trainer** _(optional: “Gửi sửa để cải thiện” backlog)_

---

## 6. Four paths

| Path | Prototype thể hiện |
|---|---|
| **Happy** | Upload đơn mẫu rõ → parse đúng 3 thuốc → review (không sửa) → Lưu → lịch 7 ngày + 3 drug cards |
| **Low-confidence** | Field `frequency` highlight vàng (OCR không chắc) → user tap sửa `3 lần/ngày` → rồi Lưu |
| **Failure** | OCR đọc `1 lần/ngày` thay vì `3 lần/ngày` → nếu user **không** sửa và bấm Lưu → **block** hoặc warning: *"Liều có vẻ bất thường — xác nhận?"* |
| **Correction** | User sửa tên thuốc trên review → match lại drug card khác; log diff _(console/mock)_ cho demo |

---

## 7. Failure mode nguy hiểm nhất

```text
Nếu user upload ảnh đơn thuốc có chất lượng kém (mờ, nghiêng, thiếu sáng) dẫn đến AI OCR/parse sai tần suất uống hoặc liều dùng (ví dụ: "uống 3 lần/ngày" thành "1 lần/ngày", hoặc "2 viên" thành "1 viên"),
AI có thể tự động tạo lịch nhắc uống thuốc sai lệch,
hậu quả là người bệnh uống thiếu liều (giảm hiệu quả điều trị) hoặc quá liều (rủi ro ngộ độc hoặc tác dụng phụ nguy hiểm).
Prototype sẽ xử lý bằng cơ chế phòng hộ nhiều lớp:
1. [Review bắt buộc]: Màn hình Review hiển thị từng dòng thuốc dưới dạng input để user sửa trước khi lưu; nếu có `raw_text` thì hiện preview OCR.
2. [Confidence Guardrail]: Field `frequency` có confidence thấp được gắn badge cảnh báo vàng để user kiểm tra lại.
3. [Rule Validation]: Chặn tần suất ngoài khoảng 1–4 lần/ngày; riêng demo risky có rule Amoxicillin 1 lần/ngày trong nhiều ngày → cảnh báo đỏ.
4. [Hard Block]: Nút "Lưu & đồng bộ lịch" bị disable nếu còn cảnh báo đỏ.
5. [MOH Registry Trust]: Thẻ thuốc hiển thị badge đối chiếu danh mục Bộ Y tế (QĐ 403/QĐ-QLD 2026); thuốc không khớp hoặc chưa kiểm tra được hiển thị badge cảnh báo vàng để người dùng biết mức độ xác thực.
Owner test: **Hoàng Khương Duy** — chuẩn bị 1 đơn mẫu cố ý làm mờ chữ tần suất uống để kiểm thử xem hệ thống có kích hoạt cảnh báo đỏ và chặn lưu hay không.
```

---

## 8. Owner plan — Day 06

**Nhóm:** A@01  
**Thành viên:** Nguyễn Hoàng Minh · Lương Quốc Dũng · Hoàng Khương Duy · Cù Tiến Nam

Chia đều 4 phần — mỗi người ~25% scope, nộp artifact rõ trong repo.

| Thành viên | Phụ trách chính | Artifact / deliverable |
|---|---|---|
| **Nguyễn Hoàng Minh** | Backend · OCR + AI parse | `../prototype/server/` (OpenAI Vision, VietOCR optional), `../prototype/fixtures/`, `../prototype/js/parse.js`, `../prototype/js/api.js`, `../prototype/server/.env.example` |
| **Lương Quốc Dũng** | Frontend · UX prototype | `../prototype/index.html`, `../prototype/css/styles.css`, `../prototype/js/app.js` — upload, review, lịch, thẻ thuốc; mobile polish |
| **Hoàng Khương Duy** | Research · evidence · QA | `evidence-pack-prescription.md`, `evidence/` (ảnh đơn đã che PHI), phỏng vấn/review store, test failure path (preset risky + ảnh thật) |
| **Cù Tiến Nam** | SPEC · nội dung thuốc · demo | `thin-spec-prescription.md`, `synthesis-decide-toolkit.md`, `../prototype/data/drugs.json`, `../prototype/demo-script.md`, README nộp bài |

**Phối hợp nhanh:**
- Dũng + Minh: wire upload ảnh → `/api/parse-rx` → review screen
- Nam + Duy: drug card copy khớp tên thuốc trên đơn mẫu thật
- Cả nhóm: chạy `../prototype/demo-script.md` 1 lần trước khi nộp

---

## 9. Data model (tối thiểu)

**Per Rx line (sau parse):**
```json
{
  "drug_name": "Amoxicillin 500mg",
  "dose_per_time": "1 viên",
  "frequency_per_day": 3,
  "meal_relation": "sau ăn",
  "duration_days": 7,
  "confidence": { "frequency": 0.6 }
}
```

**Per schedule event:**
```json
{
  "date": "2026-06-04",
  "time": "08:00",
  "drug_name": "Amoxicillin 500mg",
  "drug_id": "amoxicillin-500",
  "dose": "1 viên",
  "meal": "sau ăn",
  "label": "Amoxicillin 500mg — 1 viên"
}
```

---

## 10. Tech gợi ý (không bắt buộc)

| Layer | Gợi ý |
|---|---|
| OCR | OpenAI Vision; VietOCR sidecar tùy chọn |
| Parse | OpenAI parse JSON + normalize/review tên thuốc |
| App | Vanilla JS ES Modules + Node/Express backend |
| Demo fallback | `fixtures/sample-rx-happy.json`, `sample-rx-low-conf.json`, `sample-rx-risky.json` nếu API fail live |

---

## Phụ lục — Artifacts

| File | Mô tả |
|---|---|
| `../01-invidual-workshop/app-teardown.md` | Individual workshop template / analog note |
| `evidence-pack-prescription.md` | Evidence pack (track mới) |
| `synthesis-decide-toolkit.md` | Synthesis |
| `thin-spec-prescription.md` | Thin SPEC (file này) |
| `../prototype/` | Prototype Day 06 |

---

*Thin SPEC · Prescription scan · Batch 02 · Ready for Day 06*
