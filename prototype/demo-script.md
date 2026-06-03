# Demo script — 3–5 phút

**Tên prototype:** Scan Đơn → Lịch Uống  
**Người demo:** _  
**Auto/Aug:** AI gợi ý — người bệnh **xác nhận** trước khi lưu

---

## 0. Mở đầu (30 giây)

> "Sau khám, nhiều người phải tự gõ lịch uống thuốc từ đơn — dễ sai, mất 10–15 phút.  
> Prototype quét đơn in, AI trích xuất, **bắt buộc xác nhận**, rồi tạo lịch nhắc và thẻ giải thích thuốc."

---

## 1. Happy path (~1 phút)

1. Màn **Upload** → chọn **"Đơn mẫu — chuẩn"** → **Phân tích đơn**
2. Màn **Review** — 3 thuốc, không sửa → **Lưu lịch uống**
3. Màn **Lịch** — chỉ 8h / 14h / 21h, "sau ăn"
4. Màn **Thẻ thuốc** — chạm từng thuốc, đọc 1 câu mô tả

**Nói:** "AI chỉ là bản nháp; lịch chỉ có sau khi bấm Lưu."

---

## 2. Low-confidence (~45 giây)

1. Quay **Upload** → **"Đơn — tần suất mờ"**
2. Review: field **Tần suất** màu vàng
3. Sửa thành `3` lần/ngày → **Lưu**

**Nói:** "Khi OCR không chắc, hệ thống bắt người dùng kiểm tra — không tự lưu."

---

## 3. Failure path (~1 phút)

1. **"Đơn — sai liều (demo lỗi)"**
2. Review: `1 lần/ngày` — cảnh báo đỏ
3. Bấm **Lưu** → **bị chặn**
4. Sửa thành `3` → Lưu thành công

**Nói:** "Đây là failure mode nguy hiểm nhất: sai tần suất → uống thiếu liều. Prototype chặn trước khi lưu."

---

## 4. Correction (~30 giây)

1. Trên Review, đổi tên thuốc gần giống thuốc khác trong DB
2. Sang **Thẻ thuốc** — nội dung thẻ đổi theo

**Nói:** "Sửa trên màn xác nhận → drug card match lại — không cần Google từng tên."

---

## 5. Chốt (15 giây)

> "In scope: đơn in/digital, review bắt buộc, lịch + thẻ.  
> Backlog: đơn viết tay, sync Google Calendar, full drug DB."

---

## Checklist trước khi lên sóng

- [ ] `npx serve .` chạy ổn
- [ ] 3 preset đều load được
- [ ] Ảnh đơn thật (đã che thông tin) trong `evidence/` (repo gốc)
