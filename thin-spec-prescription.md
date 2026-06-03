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
Người bệnh sau khám đang gặp khó ở bước chuyển đơn thuốc thành lịch uống hàng ngày,
vì phải đọc chữ trên đơn, tự gõ giờ/liều vào app hoặc calendar, dễ sai (vd. 3 lần/ngày → 1 lần),
dẫn tới quên uống, uống sai giờ, hoặc không hiểu thuốc để uống an toàn.
Bằng chứng chính: self-use gõ tay ~10–15 phút cho 3 thuốc; OCR thử cần sửa tần suất;
quan sát phải Google từng tên thuốc để hiểu công dụng.
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
Nếu user upload đơn và OCR/parse sai tần suất hoặc liều (vd. 3 lần → 1 lần),
AI có thể tạo lịch nhắc sai,
hậu quả là uống thiếu liều hoặc quá liều.
Prototype xử lý bằng: (1) review screen bắt buộc, (2) highlight low-confidence,
(3) rule cảnh báo nếu frequency không khớp pattern thường gặp, (4) không Lưu khi còn field đỏ.
Owner test: Nguyễn Hoàng Minh — case đơn mẫu cố ý sai tần suất.
```

---

## 8. Owner plan — Day 06

| Thành viên | Việc | Artifact trong repo |
|---|---|---|
| Nguyễn Hoàng Minh | Research / evidence / đơn mẫu | `evidence-pack-prescription.md`, `evidence/` |
| _(tên)_ | SPEC | `thin-spec-prescription.md` |
| _(tên)_ | Prototype | `prototype/` — upload, review, schedule, cards |
| _(tên)_ | OCR + parse pipeline | API key env example; fallback `fixtures/sample-rx.json` |
| _(tên)_ | Drug DB + cards | `prototype/data/drugs.json` (3–5 thuốc) |
| Nguyễn Hoàng Minh | Test failure path | Script: sai `3 lần` → phải warn/block |
| _(tên)_ | Demo | `demo-script.md` 3–5 phút |

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
