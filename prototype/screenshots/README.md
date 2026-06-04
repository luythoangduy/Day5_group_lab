# Screenshots cho Presentation

Đặt ảnh chụp màn hình vào đây đúng tên file là ảnh tự hiện lên trên slide.
Ảnh có thể là `.png`, `.jpg`, hoặc `.webp` — chỉ cần đổi đuôi trong `presentation.html` nếu dùng định dạng khác.

---

## Danh sách 13 ảnh cần chụp

| File | Slide | Chụp màn hình gì |
|---|---|---|
| `sc-01-upload-demo-preset.png` | Slide 4 — Happy Path | Màn **Quét đơn thuốc** → tab Demo → preset "Đơn chuẩn" đã chọn |
| `sc-02-review-happy.png` | Slide 4 — Happy Path | Màn **Review** với 3 thuốc parse đúng, không badge cảnh báo |
| `sc-03-calendar-schedule.png` | Slide 4 — Happy Path | Màn **Lịch** / **Nhắc uống** — hiện 8h / 14h / 21h, nhãn "sau ăn" |
| `sc-04-review-lowconf-warning.png` | Slide 5 — Low-Confidence | Màn Review — field **Tần suất** có nền vàng ⚠️ |
| `sc-05-review-lowconf-fixed.png` | Slide 5 — Low-Confidence | Sau khi sửa tần suất thành 3 — badge vàng biến mất, nút Lưu sáng |
| `sc-06-review-failure-blocked.png` | Slide 6 — Failure Path | Review: Amoxicillin **1 lần/ngày** — nền đỏ, nút Lưu bị vô hiệu |
| `sc-07-review-failure-fixed.png` | Slide 6 — Failure Path | Sau khi sửa thành 3 lần/ngày → Lưu thành công, màn Lịch hiện |
| `sc-08-review-correction-edit.png` | Slide 7 — Correction | Màn Review — đang sửa tên thuốc (input đang focus) |
| `sc-09-drugcard-correction-updated.png` | Slide 7 — Correction | Thẻ thuốc sau khi tên đổi — nội dung mô tả cập nhật theo, badge "Đã sửa OCR" |
| `sc-10-drugcard-moh-badge.png` | Slide 8 — MOH Registry | Thẻ thuốc mở rộng — phần **"Đã tìm thấy trong danh mục Bộ Y tế"** màu xanh |
| `sc-11-drugcard-detail.png` | Slide 9 — Drug Cards | Thẻ thuốc đầy đủ — mô tả + lưu ý + citation Vinmec |
| `sc-12-home-reminders.png` | Slide 9 — Drug Cards | Màn **Nhắc uống** (Home) — danh sách hôm nay, nút đã uống |
| `sc-13-nearby-pharmacy.png` | Slide 9 — Drug Cards | Danh sách nhà thuốc gần nhất trong thẻ thuốc |

---

## Mẹo chụp

- Chụp trên desktop ở chế độ mobile (F12 → toggle device toolbar, chọn iPhone 14 Pro ~390px)
- Hoặc chụp trực tiếp trên điện thoại qua `http://[IP]:3000`
- Crop sát màn hình, không cần border thiết bị — slide tự thêm viền
- Chiều cao ảnh: tối thiểu 600px để không bị mờ khi scale lên 300px cao
