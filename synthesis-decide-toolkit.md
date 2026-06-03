# Synthesis & Decide — Scan Đơn Thuốc → Lịch Uống

Dùng **sau** khi nhóm hoàn thành [evidence-pack-prescription.md](evidence-pack-prescription.md). Mục tiêu: chốt một build slice đủ nhỏ để viết [thin-spec-prescription.md](thin-spec-prescription.md) và build Day 06.

**Track:** Healthcare — patient medication adherence (anchor Vinmec / V-App, prototype độc lập)

---

## 1. Gom evidence thành cụm

Gom theo **workflow/pain**, không gom theo tên feature.

| Cụm pain | Evidence hỗ trợ |
|---|---|
| **Đơn → hành động:** phải tự gõ lịch từ đơn, mất ~10–15 phút, dễ sai tần suất | Self-use gõ 3 thuốc; review app nhắc thuốc (nhập tay) |
| **Hiểu thuốc:** không biết tên trên đơn nghĩa gì, phải Google từng món | Self-use search; thiếu drug card in-app |
| **OCR ≠ lịch:** nhận chữ được nhưng chưa parse `3 lần/ngày`, `sau ăn` | Self-use OCR thử; Google Lens analog |

| **Trust / rủi ro:** sai liều hoặc tần suất → uống sai | Failure path; Auto/Aug → augmentation + confirm |

**Không gom theo:** “OCR”, “LLM”, “push notification” — đó là giải pháp, chưa phải pain.

---

## 2. Insight


```text
Người bệnh (hoặc người nhà) sau khám không chỉ cần "đọc được đơn".
Họ cần lịch uống đúng và hiểu thuốc — without retyping và without guessing,
vì tự gõ 3 thuốc mất ~10–15 phút và hay sai tần suất; OCR một mình chưa đủ;
user còn phải Google từng tên để hiểu cách uống an toàn.
```

---

## 3. Opportunity

```text
Cơ hội là dùng AI để trích xuất + chuẩn hóa dòng thuốc từ ảnh/PDF đơn in/digital,
giúp user có bản nháp lịch nhắc + thẻ thuốc tiếng Việt,
trong khi vẫn kiểm soát rủi ro sai liều/tần suất bằng màn xác nhận bắt buộc trước Lưu.
```

---

## 4. Chọn build slice — 5 câu hỏi

| Câu hỏi | Đạt khi | Prescription track |
|---|---|---|
| User cụ thể chưa? | Nói được ai, bối cảnh nào | Người bệnh / người nhà vừa có đơn **in hoặc digital** 2–5 thuốc, tự uống tại nhà |
| Task đủ hẹp chưa? | Demo 3–5 phút | Upload đơn → parse → **review** → Lưu → lịch + drug cards (3 thuốc demo) |
| AI decision rõ chưa? | AI làm một việc cụ thể | OCR + parse JSON (tên, liều, tần suất, ăn trước/sau) + gợi ý slot giờ |
| Failure path rõ chưa? | Có case test được | OCR đọc `1 lần/ngày` thay vì `3` → warn/block nếu không sửa |
| Có evidence không? | Self-use / review / analog | Gõ tay timing, OCR thử, MyTherapy Google Play crawl, V-App teardown |

**Build slice chốt:**

```text
Cho người bệnh vừa có đơn in hoặc ảnh/PDF từ app BV,
prototype dùng AI OCR + parse → màn xác nhận (sửa từng dòng) → lịch nhắc in-app + thẻ thuốc tiếng Việt;
không Lưu calendar nếu chưa confirm.
```

---

## 5. Quyết định: giữ, giảm scope, hay đổi hướng?

| Tình huống | Quyết định nhóm | Ghi chú |
|---|---|---|
| Track cũ V-App (handoff CSKH) evidence yếu cho Day 06 | **Đổi hướng** → prescription scan | Loop rõ hơn, demo được trong 1 ngày |
| Ý tưởng quá rộng (full Danh mục thuốc, calendar sync, đơn viết tay) | **Giảm scope** |  Bỏ đơn viết tay  |
| AI có cần không? | **Giữ AI — Augmentation** | Parse + explain; user là decider; không auto-save |
| Rủi ro cao (sai liều) | **Augmentation + review bắt buộc** | Highlight low-confidence; rule cảnh báo frequency bất thường |
| Không demo được trong 1 ngày | **Backlog** (mục 7) | Giữ 1 happy path + 1 failure path trong repo |

**Auto/Aug:** Augmentation — AI draft; human **decider** trên review screen.

---

## 6. Câu chốt cuối (trước khi rời lớp / trước Day 06)

```text
Dựa trên [self-use gõ lịch ~10–15 phút + OCR thử cần sửa tần suất + gap V-App + MyTherapy Google Play crawl],
nhóm sẽ build [upload đơn → OCR/parse → review → lịch uống + drug card],
cho [người bệnh hoặc người nhà sau khám, đơn in/digital 2–5 thuốc],
để giải quyết [chuyển đơn thành lịch uống đúng mà không gõ tay và không đoán liều],
bằng cách AI [trích xuất + gợi ý lịch và mô tả thuốc — user xác nhận trước Lưu],
và sẽ test failure path [OCR/parse sai tần suất 3→1 lần/ngày — warn hoặc block nếu không sửa].
```

---

## 7. Backlog (không build Day 06)

- Đơn **viết tay** (OCR chất lượng thấp; literacy cao tuổi)
- Sync **Google Calendar / Apple Health**
- Parse `cách ngày`, `khi cần`, refill
- Track cũ **V-App handoff CSKH** → archived (`thin-spec-V-App.md` nếu có)

---

## 8. Liên kết artifacts

| Bước | File |
|---|---|
| Evidence | [evidence-pack-prescription.md](evidence-pack-prescription.md) |
| Synthesis (file này) | `synthesis-decide-toolkit.md` |
| Cam kết Day 06 | [thin-spec-prescription.md](thin-spec-prescription.md) |
| Template trống (nhóm khác) | [evidence-pack-template.md](evidence-pack-template.md), [thin-spec-template.md](thin-spec-template.md) |

---

*Synthesis & Decide · Prescription scan · Batch 02 Day 05 → Day 06*
