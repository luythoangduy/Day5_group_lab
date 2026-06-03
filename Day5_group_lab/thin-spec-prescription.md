# Thin SPEC — Scan Đơn Thuốc → Lịch Uống + Thẻ Thuốc

Bản cam kết Day 06 — track đổi từ V-AI (archived: `thin-spec-v-ai.md`).

---

## 1. Track, product/app và user

**Track:** Healthcare — patient medication adherence (có thể anchor **Vinmec / V-App** ecosystem, prototype độc lập)  
**Product/app thật:** Journey sau khám — đơn thuốc giấy / PDF / screenshot từ app bệnh viện _(không clone app BV; build slice riêng)_  
**User cụ thể:** **Người bệnh** (hoặc **người nhà** đang chăm) vừa nhận đơn có **2–5 thuốc**, tự uống tại nhà, quen smartphone; đơn **in hoặc digital** (không viết tay v1).  
**Nhóm có phải user thật không?** Một phần đã trải nghiệm gõ lịch / app nhắc thuốc; không phải bệnh nhân mãn tính dài hạn — cần 1 phỏng vấn nhanh hoặc review store trước M1.

---

## 2. Evidence summary

| Evidence | Nguồn | User/pain | SPEC đổi gì? |
|---|---|---|---|
| Gõ lịch 3 thuốc ~10–15 phút, hay sai tần suất | Self-use | Friction + error | Parse + review bắt buộc |
| Không hiểu tên thuốc trên đơn | Self-use + Google | Cần drug card | DB demo + plain Vietnamese |
| OCR ảnh đơn in: tên OK, tần suất cần sửa | Self-use | Low-confidence | Review UI, không auto-save |
| V-AI không deep-link nhắc thuốc in-app | `v-ai-app-teardown.md` | Super-app gap | Prototype độc lập, Vinmec backlog |
| App nhắc thuốc: nhập tay | Store review _(bổ sung)_ | Competitor baseline | Scan-first differentiation |

---

## 3. Pain statement

```text
Người bệnh (hoặc người nhà) sau khi khám đang gặp khó ở bước chuyển tiếp từ đơn thuốc giấy/PDF sang lịch uống thực tế hàng ngày,
vì việc tự đọc chữ và gõ thủ công từng tên thuốc, liều lượng, giờ giấc vào điện thoại rất tốn thời gian (~10-15 phút cho đơn 3 thuốc) và dễ nhập sai tần suất/liều lượng, đồng thời các app nhắc thuốc hiện tại chưa hỗ trợ quét đơn tiếng Việt và không giải thích rõ công dụng thuốc,
dẫn tới hậu quả người bệnh dễ uống sai liều gây rủi ro sức khỏe, quên lịch, hoặc hoang mang không hiểu rõ công dụng của các loại thuốc được kê.
Bằng chứng chính: 
- Trải nghiệm tự gõ đơn 3 thuốc mất 10-15 phút;
- OCR thử nghiệm cho thấy tỉ lệ nhận diện tần suất tiếng Việt (như "sau ăn", "3 lần/ngày") bị sai lệch cần sửa tay;
- Đánh giá trên CH Play của Medisafe/MyTherapy phàn nàn việc bắt buộc nhập tay quá phức tạp;
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
| 1 | Upload ảnh / chọn file PDF đơn mẫu (2–3 test cases) |
| 2 | OCR (Vision API hoặc mock JSON cho demo fallback) |
| 3 | LLM/rule **parse → JSON** per line: `name`, `dose`, `frequency`, `meal`, `days` |
| 4 | **Review screen** — edit từng field, highlight low-confidence |
| 5 | **Schedule generator** — `N lần/ngày` → time slots (vd. 8h, 14h, 21h); `sau ăn` → label |
| 6 | **Drug cards** — match tên → 3–5 thuốc trong `drugs.json` (mô tả, cách uống, lưu ý) |
| 7 | Demo script 4 paths |

### Out of scope Day 06

- Đơn viết tay  
- Google/iOS Calendar sync  
- Full drug database / interaction checker  
- `cách ngày`, `khi cần`, refill  
- Tích hợp Vinmec API thật  

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
1. [UX Split-Screen]: Màn hình Review bắt buộc hiển thị song song ảnh chụp gốc (được crop và phóng to vùng chữ tương ứng) ngay bên cạnh form kết quả để user dễ đối chiếu bằng mắt.
2. [Confidence Guardrail]: Highlight đỏ các trường thông tin có độ tự tin (confidence score) thấp từ LLM, bắt buộc user phải chạm vào để xác nhận hoặc sửa thì mới kích hoạt nút "Lưu".
3. [Clinical Rule Validation]: Kiểm tra chéo dữ liệu đầu ra với danh mục thuốc an toàn (nếu tần suất > 4 lần/ngày hoặc liều lượng vượt ngưỡng bình thường của thuốc đó, hệ thống sẽ hiển thị cảnh báo popup: "Liều lượng thuốc này có vẻ bất thường, vui lòng kiểm tra kỹ đơn gốc").
4. [Hard Block]: Không cho phép lưu vào lịch nhắc nếu còn trường thông tin bị cảnh báo đỏ chưa được xác nhận hoặc sửa đổi.
Owner test: **Hoàng Khương Duy** — chuẩn bị 1 đơn mẫu cố ý làm mờ chữ tần suất uống để kiểm thử xem hệ thống có kích hoạt cảnh báo đỏ và chặn lưu hay không.
```

---

## 8. Owner plan — Day 06

**Nhóm:** _(điền tên nhóm nếu có)_  
**Thành viên:** Nguyễn Hoàng Minh · Lương Quốc Dũng · Hoàng Khương Duy · Cù Tiến Nam

Chia đều 4 phần — mỗi người ~25% scope, nộp artifact rõ trong repo.

| Thành viên | Phụ trách chính | Artifact / deliverable |
|---|---|---|
| **Nguyễn Hoàng Minh** | Backend · OCR + AI parse | `prototype/server/` (OpenAI Vision, VietOCR optional), `fixtures/`, `js/parse.js`, `js/api.js`, `.env.example` |
| **Lương Quốc Dũng** | Frontend · UX prototype | `prototype/index.html`, `css/styles.css`, `js/app.js` — upload, review, lịch, thẻ thuốc; mobile polish |
| **Hoàng Khương Duy** | Research · evidence · QA | `evidence-pack-prescription.md`, `evidence/` (ảnh đơn đã che PHI), phỏng vấn/review store, test failure path (preset risky + ảnh thật) |
| **Cù Tiến Nam** | SPEC · nội dung thuốc · demo | `thin-spec-prescription.md`, `synthesis-decide-prescription.md`, `data/drugs.json`, `demo-script.md`, README nộp bài |

**Phối hợp nhanh:**
- Dũng + Minh: wire upload ảnh → `/api/parse-rx` → review screen
- Nam + Duy: drug card copy khớp tên thuốc trên đơn mẫu thật
- Cả nhóm: chạy `demo-script.md` 1 lần trước khi nộp

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
  "drug_id": "amoxicillin-500",
  "times": ["08:00", "14:00", "21:00"],
  "label": "Sau ăn",
  "start_date": "2026-06-04",
  "end_date": "2026-06-10"
}
```

---

## 10. Tech gợi ý (không bắt buộc)

| Layer | Gợi ý |
|---|---|
| OCR | Google Cloud Vision / Azure Document Intelligence |
| Parse | LLM + JSON schema (Vietnamese Rx) |
| App | React/Next hoặc Flutter — 1 flow 4 màn: Upload → Review → Schedule → Cards |
| Demo fallback | `fixtures/sample-rx.json` nếu API fail live |

---

## Phụ lục — Artifacts

| File | Mô tả |
|---|---|
| `01-invidual-workshop/v-ai-app-teardown.md` | Individual (sáng) — analog, không phải build target |
| `02-group-spec/evidence-pack-prescription.md` | Evidence pack (track mới) |
| `02-group-spec/synthesis-decide-prescription.md` | Synthesis |
| `02-group-spec/thin-spec-prescription.md` | Thin SPEC (file này) |
| `02-group-spec/*-v-ai.md` | **Archived** — track cũ V-AI handoff |

---

*Thin SPEC · Prescription scan · Batch 02 · Ready for Day 06*
