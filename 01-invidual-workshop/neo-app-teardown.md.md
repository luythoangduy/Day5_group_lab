# Workshop — Mổ App AI Thật

**Học viên:** Thang  
**Ngày:** Day 05 — Batch 02  
**Sản phẩm:** Vietnam Airlines — NEO  
**Thời gian:** ~40 phút (chiều)

---

## 1. Chọn sản phẩm để dùng thử

| Sản phẩm | Tính năng AI | Cách vào | Đã thử? |
|---|---|---|---|
| MoMo — Moni | Trợ lý tài chính, chatbot trong app | App MoMo | Có |
| **Vietnam Airlines — NEO** | **Chatbot hỗ trợ lịch bay, vé, hành lý, khiếu nại** | **Web Vietnam Airlines** | **Chọn để mổ sâu** |
| V-App — V-AI | Trợ lý ảo voice/text, gợi ý theo ngữ cảnh | App V-App | Có |

**Vì sao chọn NEO:** Mặc dù NEO có độ phủ quy trình nghiệp vụ khá rộng so với một chatbot hàng không, nhưng cách tiếp cận hiện tại lại quá cứng nhắc và thuần tính chất "định tuyến URL" thay vì xử lý hội thoại thông minh. Khi người dùng gặp các tình huống mơ hồ hoặc sự cố cần xử lý gấp, sản phẩm lộ rõ các điểm gãy UX nghiêm trọng làm đứt đoạn hành trình khách hàng.

---

## 2. Dùng thử: hứa hẹn vs thực tế

### App hứa điều gì?

**NEO** là chatbot hỗ trợ thông tin chuyến bay, vé, hành lý và tiếp nhận khiếu nại trực tuyến của hãng hàng không quốc gia **Vietnam Airlines**. Nó hứa hẹn giúp hành khách tự động tra cứu nhanh chóng các tiện ích và trạng thái bay để giảm tải cho tổng đài.

### Ai là người được hứa sẽ được giúp?

Hành khách của Vietnam Airlines: những người đang cần check lịch bay gấp, kiểm tra tình trạng delay, tìm hiểu quy định hành lý hoặc đang có bức xúc cần khiếu nại hoàn vé.

### Mình kỳ vọng AI làm được gì?

- Nhận diện tốt ngôn ngữ tự nhiên khi hành khách hỏi thông tin chặng bay chung chung (khi chưa nhớ mã chuyến bay).
- Trích xuất thông tin lõi (ví dụ: quy định hành lý đặc biệt dịp Tết) và đưa ra câu trả lời ngắn gọn, có tính toán chi phí cụ thể ngay trong khung chat thay vì quăng tài liệu thô.
- Cung cấp "lưới an toàn" (Safety Net) bằng các nút bấm chuyển đổi, hoàn tác (Undo) hoặc kết nối trực tiếp với nhân viên hỗ trợ khi AI không hiểu.

### Thực tế gãy ở đâu?

| Chỗ gãy | Chuyện gì xảy ra |
|---|---|
| **Xử lý Ngôn ngữ tự nhiên** | Nhờ tìm chuyến bay Hà Nội - TP.HCM sáng mai → AI không tự lookup lịch mà quăng link bắt ra web tự điền lại từ đầu. |
| **Quản trị sự bất định** | Hỏi trạng thái delay của chặng bay chiều nay → AI ép người dùng phải có Số hiệu chuyến bay hoặc Mã đặt chỗ mới chịu xử lý. |
| **Cập nhật dữ liệu chuyên sâu** | Hỏi quy định mang đào Tết lên khoang máy bay → AI bế tắc hoàn toàn, không trích xuất được chính sách mà đẩy thông tin Hotline chữ thô. |
| **UX Phục hồi (Recovery)** | Chưa giải quyết xong nhu cầu của khách hàng đã vội vã đưa ra form vote 5⭐ chèn hết màn hình chat, tạo cảm giác ép buộc. |

### Bằng chứng đã ghi (prompt & quan sát)

| Tình huống | Đã thử (Prompt) | Kết quả (Actual AI Behavior) |
|---|---|---|
| Tra cứu lịch bay | *"Tìm cho tôi chuyến bay từ Hà Nội đi TP.HCM sáng ngày mai, có chuyến nào bay trước 9h không?"* | Không lọc dữ liệu. Trả link `.../flightschedule` bắt user tự tra cứu lại + Đòi xin đánh giá 1⭐ - 5⭐ ngay lập tức. |
| Câu hỏi mơ hồ | *"Chuyến bay từ Hà Nội đi Sài Gòn chiều nay có bị delay không?"* | Nhận dạng chặng tốt nhưng xử lý kém. Trả link `.../flightstatus` kèm 2 nút tĩnh bắt tra cứu theo mã đặt chỗ/số hiệu. |
| Hỏi nghiệp vụ sâu | *"Mình muốn mang một cây đào Tết lên máy bay thì tính phí thế nào?"* | Không trích xuất được dữ liệu RAG. Trả văn bản chữ thô chứa số tổng đài/email + 1 nút "Gặp tư vấn viên". |
| Ngoài phạm vi (Boundary) | *"Viết hộ tao đoạn mã Python"* | Chặn an toàn xuất sắc: *"Thông tin này ngoài phạm vi hỗ trợ của NEO..."* và kéo user về dịch vụ của hãng. |

### So với Moni và V-AI (cùng ngày)

| | Moni | NEO | V-AI |
|---|---|---|---|
| Làm đúng việc hẹp | Cộng trừ tiền 1 câu | Khá ổn | Tốt nhất trong 3 |
| Nhớ hội thoại | Không | Cũng yếu | Khá hơn, chưa "xịn" |
| Ngoài phạm vi | Một câu refuse cho mọi thứ | Chặn tốt + dẫn về dịch vụ | Có lọc an toàn + giới hạn RAG |
| Điểm yếu rõ nhất | Ảo giác + không nhớ chat | Quăng link · ép định dạng · rating sớm | Không chuyển CSKH được · không deep-link |

---

## 3. Bốn path (+ chỗ chưa có "chuyển người")

**Cách mình hình dung NEO:** chủ yếu là chatbot **RAG** dựa trên từ khóa kết hợp cây hội thoại (Rule-based decision tree) — không phải chat tự do kiểu ChatGPT thuần.

| Path | Câu hỏi workshop | Thực tế với NEO |
|---|---|---|
| **Happy** | AI đúng, user thấy gì? | Hỏi đúng keyword chuẩn mực (vd: "Quy định hành lý xách tay") → Trả ra văn bản quy định sẵn. User tự đọc tự làm. |
| **Low-confidence** | Không chắc thì xử lý thế nào? | Khi user hỏi thiếu thông tin (thiếu mã bay) → Không có cơ chế dùng AI gợi ý danh sách chuyến bay tương ứng, chỉ hiển thị link điều hướng ra ngoài. |
| **Failure** | Sai/Gãy thì user recover ra sao? | AI rơi vào vòng lặp yêu cầu nhập lại định dạng chuẩn; hoặc tự động kết thúc bằng form xin đánh giá hài lòng dù chưa giải quyết xong việc. |
| **Correction** | Sửa xong hệ thống học thế nào? | Người dùng không có nút bấm tương tác nhanh để điều chỉnh sai lệch (như nút "Chọn lại chặng", "Đổi ngày"), phải tự gõ lại chuỗi chat mới. |
| **Handoff** _(app chưa có)_ | Cần người thật? | Chỉ có chữ hotline + email — **không có luồng chuyển trong app**. Việc nhạy cảm (hoàn vé, khiếu nại) kẹt ở dòng chữ. |

**Hai path yếu nhất:** (1) **Low-confidence** khi tra cứu lịch trình/trạng thái bay không có giải pháp Augmentation (gợi ý danh sách card lựa chọn); (2) **Failure** tự động đóng phiên chat để đòi vote 5⭐ gây đứt gãy trải nghiệm nghiêm trọng.

---

## 4. Finding → Quyết định product

### 1 — Tra cứu lịch trình bị đẩy ra ngoài Web

Khi người dùng hỏi lịch bay theo khung giờ bằng ngôn ngữ tự nhiên,  
AI quăng đường link bắt user tự click và nhập liệu lại từ đầu trên giao diện web ngoài,  
→ triệt tiêu hoàn toàn giá trị của trợ lý ảo, người dùng bỏ app.

**Lớp lỗi:** Data/Tool · UX Recovery  
**Nên làm:** Tích hợp API tra cứu lịch trình trực tiếp vào khung chat. Khi user đưa yêu cầu mơ hồ, AI tự động trích xuất cấu trúc (Hà Nội, TP.HCM, Trước 9h, Sáng mai) và hiển thị kết quả dưới dạng **Thẻ tương tác (Cards)** ngay trong màn hình chat để user lựa chọn.

---

### 2 — Ép buộc thông tin định dạng cứng khi check delay

Khi hỏi trạng thái hoãn chuyến của một chặng bay trong ngày,  
AI từ chối xử lý thông minh mà ép buộc người dùng phải chọn tra cứu thủ công theo "Mã đặt chỗ" hoặc "Số hiệu chuyến bay",  
→ người dùng không nhớ mã, không thể tiếp tục, thoát chat.

**Lớp lỗi:** Intent · UX Recovery  
**Nên làm:** Áp dụng mô hình **Augmentation (Trợ lực)**. Nếu không có mã chuyến bay, hệ thống gọi API trạng thái của chặng bay trong khung thời gian gần nhất, hiển thị danh sách các chuyến sắp khởi hành để user xác nhận qua 1 chạm.

---

### 3 — Đòi Rating khi chưa hoàn thành Task

Vừa quăng link tra cứu (chưa biết user tìm được thông tin hay không),  
AI lập tức kích hoạt bộ câu hỏi đánh giá sao (1⭐ - 5⭐) chiếm dụng không gian hiển thị,  
→ user cảm thấy bị ép buộc, ức chế, rời khỏi chat trước khi xong việc.

**Lớp lỗi:** UX Recovery · Trải nghiệm khách hàng  
**Nên làm:** Thay đổi trigger hiển thị form đánh giá. Chỉ hiển thị khi task được xác nhận hoàn thành (User bấm "Đã hiểu / Đã tìm thấy") hoặc sau khi kết thúc phiên hỗ trợ bởi tư vấn viên người thật.

---

### 4 — Cần CSKH mà chỉ có chữ

Khi hỏi hoàn vé, khiếu nại, hoặc sự cố thanh toán,  
AI chỉ đưa số điện thoại và email dạng văn bản thô,  
→ phải thoát app, tự gọi — đúng lúc đang bực nhất.

**Lớp lỗi:** UX Recovery · Vai trò con người  
**Nên làm:** Nút [Gọi ngay], [Chat CSKH], [Gửi ticket]; tự chuyển CSKH khi intent nhạy cảm hoặc sai ≥ 2 lần.

---

### 5 — Hỏi nghiệp vụ sâu mà AI bí

Khi hỏi chính sách đặc thù (vd: mang cây đào Tết lên khoang),  
AI không trích xuất được dữ liệu RAG mà đẩy hotline chữ thô,  
→ không biết kiểm chứng, không tin vào câu trả lời.

**Lớp lỗi:** Data/Tool · Trust · Generation  
**Nên làm:** Tag nguồn bấm được → xem trang chính sách gốc; AI chỉ nói theo metadata tài liệu nội bộ VNA.

---

## 5. Sketch As-Is / To-Be

### 5.1 Luồng hiện tại (As-Is) — Đứt gãy vì ép định dạng cứng

```
Hành khách : "Chuyến bay từ Hà Nội đi Sài Gòn chiều nay có bị delay không?"
               │
               ▼  AI nhận diện từ khóa chặng bay, nhưng không tự động lookup dữ liệu
    NEO: "Để kiểm tra tình trạng chuyến bay, quý khách vui lòng tra cứu trực tuyến..."
               │
               ├─► [Link thô]: .../flightstatus
               ├─► [Nút tĩnh 1]: Tra cứu theo Mã đặt chỗ / Số vé
               └─► [Nút tĩnh 2]: Tra cứu theo số hiệu chuyến bay
               │
               ▼  Hệ thống tự động kích hoạt khảo sát khi chưa giải quyết xong task
    NEO: "Quý khách vui lòng dành chút thời gian đánh giá..."
               │  [1⭐] [2⭐] [3⭐] [4⭐] [5⭐]
               │
               ▼
[Hậu quả]: Bị ép nhập định dạng cứng · ức chế vì chưa xong việc đã đòi vote → thoát chat.
```

### 5.2 Luồng cải tiến (To-Be) — Augmentation + handoff có nút

```
Hành khách : "Chuyến bay từ Hà Nội đi Sài Gòn chiều nay có bị delay không?"
               │
               ▼  AI trích xuất [HAN], [SGN], [Chiều nay] → Gọi API trạng thái bay thực tế
    NEO: "NEO tìm thấy 2 chuyến từ Hà Nội đi TP.HCM chiều nay. Chọn đúng chuyến của bạn:"
               │
               ├─► [Card 1]  VN 215 | 14:00 → 16:15 | Đúng giờ
               ├─► [Card 2]  VN 217 | 16:00 → 18:15 | Chậm ~20 phút (thời tiết)
               └─► [Nhập số hiệu chuyến bay khác]
               │
               ▼  User chạm Card 2
    NEO: "VN 217 đang cập nhật lịch trình mới. Bạn muốn nhận thông báo khi có thay đổi?"
               │  [Đăng ký nhận tin]  [Không, cảm ơn]  [Gặp nhân viên hỗ trợ]
               │
               ▼
[Kết quả]: Hoàn thành tác vụ với 1 chạm · không cần nhớ mã · không thoát app.
           Nút [Gặp nhân viên] sẵn sàng nếu vẫn chưa ổn.
```

---

## 6. Kết luận — Nên sửa gì trước?

**Ưu tiên:** **Xây dựng Card/Carousel UI thay thế quăng link thô** khi xử lý truy vấn "Lịch bay" và "Trạng thái chuyến bay".

| Vì sao | Giải thích ngắn |
|---|---|
| Đánh trúng Promise cốt lõi | Khách hàng tìm đến trợ lý ảo hàng không để tra cứu thông tin nhanh. Quăng link bắt ra web tự điền triệt tiêu hoàn toàn giá trị AI. |
| Giảm chi phí thao tác | Từ bắt ép nhập mã cứng (Automation lỗi) sang hiển thị danh sách trực quan lựa chọn (Augmentation an toàn) → tăng tỷ lệ giữ chân hành khách. |
| AI không cần ôm hết | Việc phức tạp + nhạy cảm (hoàn vé, khiếu nại) → cần "lưới an toàn" là người thật có nút bấm ngay trong app. |

---

## 7. Tự kiểm trước khi nộp

- [x] Có observation / prompt cụ thể (ảnh đính kèm khi nộp)
- [x] Đủ 4 path + nói rõ chưa có handoff in-app
- [x] Finding viết thành quyết định product (5 mục)
- [x] Sketch as-is / to-be tách rõ 2 luồng
- [x] Nói rõ finding ảnh hưởng hướng nhóm thế nào

---

*Individual workshop · Vietnam Airlines NEO · Batch 02 Day 05*
