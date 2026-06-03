# Evidence Pack — Đơn Thuốc → Lịch Uống + Thẻ Thuốc


## 1. Nhóm và track

**Tên nhóm:** A@01  
**Track:** Healthcare / patient workflow (Vinmec · Long Châu ecosystem · V-app — optional anchor)  
**Product/app đã chọn:** Prototype **“Scan đơn → Lịch thuốc”** — không build lại app bệnh viện; slice gắn journey sau khám  
**Build slice đang nghĩ:** Quét ảnh/PDF đơn thuốc **in** → AI trích xuất thuốc + liều + tần suất → màn **xác nhận** → lịch nhắc trong app + thẻ mô tả thuốc (tiếng Việt dễ hiểu)

**Phạm vi cố ý thu hẹp (Day 06):**
- Đơn **in / digital** (screenshot app BV, PDF, ảnh chụp đơn máy in) — **không** handwritten v1
- 3–5 thuốc demo trong DB nội bộ; không full Danh mục thuốc Bộ Y tế
- Nhắc trong app (mock) — export Google/Apple Calendar = backlog

---

## 2. Self-use evidence

| Observation | Evidences | Path liên quan | Điều học được |
|---|---|---|---|
| Sau khám, user phải **đọc chữ viết tay / thuật ngữ** trên đơn và **tự gõ** giờ uống vào calendar hoặc app nhắc như app MyTherapy | <img src=".\evidences\MyTherapy.jpg" alt="Mô tả ảnh" width="100" /> | — (pain gốc) | Pain không phải “thiếu chatbot” mà **thiếu chuyển đơn → hành động** |
| User không biết thuốc mới kê **là gì, uống lúc nào, tránh gì** — phải Google từng tên | <img src=".\evidences\google_search.jpg" alt="Mô tả ảnh" width="100" /> | Happy (nếu có thẻ thuốc) | Cần **drug card** song song lịch, không chỉ OCR |
| V-App (sáng): hỏi nhắc uống thuốc → hướng dẫn app **ngoài** (Long Châu), không deep-link Vinmec/V-App | <img src=".\evidences\vapp_screenshot.jpg" alt="Mô tả ảnh" width="100" /> | Failure | Analog: super-app chưa đóng loop **đơn → lịch in-app** |
| OCR thử trên 1 ảnh đơn in: nhận diện tên thuốc ~OK, **tần suất** (`sau ăn`, `3 lần/ngày`) cần sửa tay | <img src=".\evidences\gpt.png" alt="Mô tả ảnh" width="100" /> | Low-confidence / Correction | **Review screen bắt buộc** trước lưu lịch |
| Thông tin caution cần được có nguồn trích dẫn rõ ràng | <img src=".\evidences\gpt.png" alt="Mô tả ảnh" width="100" /> | Thiếu reference đáng tin cậy | **Cần có reference link** khi đính kèm caution |

---

## 3. User / review / social evidence

| Quote / review / observation | Nguồn | User là ai? | Pain/failure mode |
|---|---|---|---|
| App nhắc thuốc: user phàn nàn phải **nhập tay từng thuốc**, không scan đơn | App Store — category “medication reminder” (Medisafe, MyTherapy, …) | Bệnh nhân mãn tính / sau khám | Nhập tay = friction |
| “Không hiểu đơn bác sĩ viết” | Pattern phổ biến BV công (analog) | Người cao tuổi / người nhà | Literacy + handwriting (out of scope v1) |
| Vinmec / app BV: có đơn điện tử nhưng **chưa thấy** 1 nút “tạo lịch uống từ đơn” trong self-use | Giả định từ teardown V-App + quan sát | User Vinmec | Opportunity in-ecosystem |

Nếu chưa có nguồn ngoài nhóm, ghi rõ:

```text
Nhóm sẽ lấy 3 review App Store (app nhắc thuốc) + 1 phỏng vấn nhanh người từng tự gõ lịch từ đơn
trước M1 Day 06. Evidence chính hiện tại: self-use + đơn mẫu + pain timing.
```

---

## 4. Competitor / analog evidence

| App / mô hình | Họ xử lý task này thế nào? | Pattern học được | 1 ngày? |
|---|---|---|---|
| **Medisafe / MyTherapy** | Nhắc lịch tốt, người dùng nhập tên thuốc và tần suất uống bằng tay| Lịch + push | ✅ Mock lịch, không build full |
| **Google Lens + manual** | OCR chữ, user tự copy | OCR ≠ schedule — thiếu parse tần suất | ✅ LLM parse JSON sau OCR |
| **V-App (VinGroup)** | không parse đơn → calendar | Không đáp ứng job “từ đơn đến lịch” | ❌ Đổi track |
| **Hospital PDF đơn** | Static PDF trong app | Nguồn input tốt cho v1 (digital) | ✅ Demo input chính |

---

## 5. Evidence → Insight

```text
Evidence nổi bật nhất:
- Tự gõ lịch từ đơn 3 thuốc mất ~10–15 phút, dễ sai liều/tần suất.
- User cần biết "thuốc này là gì" chứ không chỉ "mấy giờ uống".
- V-App / super-app chưa đóng loop đơn → hành động in-app.
- OCR một mình chưa đủ; tần suất tiếng Việt cần parse + xác nhận.

Insight:
Người bệnh (hoặc người nhà) sau khám không chỉ cần "đọc được đơn".
Họ cần lịch uống đúng và hiểu thuốc — without retyping và without guessing.

Opportunity:
AI trích xuất + chuẩn hóa dòng thuốc từ ảnh/PDF đơn in,
hiển thị màn xác nhận,
rồi tạo lịch nhắc + thẻ thuốc tiếng Việt — user bấm Lưu mới có hiệu lực.
```

---

## 6. Evidence đổi SPEC như thế nào?

- [x] Đổi user chính. _(từ user V-App CSKH → người bệnh sau khám)_
- [x] Đổi pain statement.
- [x] Đổi build slice.
- [x] Đổi Auto/Aug decision. _(→ Augmentation + confirm bắt buộc)_
- [x] Đổi 4 paths.
- [x] Đổi failure mode. _(OCR sai liều / sai tần suất)_
- [x] Đổi owner/test plan.

```text
Trước evidence, nhóm định...
...V-App: handoff + deep-link cho hủy dịch vụ / trừ tiền.

Sau khi thu hẹp scope & đổi ý tưởng, nhóm đổi thành...
...Scan đơn thuốc (in/digital) → parse → review → lịch uống + drug card.
Lý do: loop rõ hơn, demo 3–5 phút, AI decision cụ thể (extract + explain),
giảm phụ thuộc CSKH VinGroup; health use-case có review = trust path tự nhiên.
```

---

*Evidence pack · Prescription scan · Batch 02 Day 05*
