# Day 05 Lab — Khởi Động Dự Án AI Product

> Tìm vấn đề thật → gom bằng chứng → chốt một lát cắt nhỏ → viết thin SPEC → sẵn sàng build prototype trong Day 06.

Day 05 không phải một buổi học đầy đủ về AI Product Management. Đây là ngày **khởi động mini-hackathon Day 06**. Cuối ngày, nhóm chưa cần có prototype hoàn chỉnh, nhưng phải đủ rõ để sáng mai build ngay.

## Tài liệu trong folder này

Folder này được chia theo đúng việc cần làm:

| Folder / File | Dùng để làm gì |
|---|---|
| `01-invidual-workshop/app-teardown.md` | Bài mổ app AI thật: dùng thử, vẽ flow, tìm path yếu, viết finding thành quyết định product. |
| `02-group-spec/` | Bộ template cho phần nhóm: gom bằng chứng, chuyển evidence thành insight/opportunity/build slice, và viết thin SPEC cuối Day 05. |

## Cấu trúc repo nộp bài Day 06

Mỗi học viên nộp **một repo cá nhân**:

```text
Day06-MãHọcViên-HọVàTên
├── 01-invidual-workshop/
└── 02-group-spec/
```

Trong đó:

- `01-invidual-workshop/`: phần reflection cá nhân, nêu rõ vai trò, việc đã làm, phần AI hỗ trợ, và bài học sau demo.
- `02-group-spec/`: bản làm chung của nhóm. Mỗi học viên copy bản cuối vào repo cá nhân của mình.

## Đọc file nào để làm gì?

1. Làm `01-invidual-workshop/app-teardown.md` khi lớp mổ Moni / NEO / V-AI hoặc app theo track.
2. Dùng các template trong `02-group-spec/` để gom evidence, chốt insight/opportunity/build slice, và viết thin SPEC trước khi rời lớp.

## Cuối Day 05 cần có gì?

| Artifact | Cần thể hiện rõ |
|---|---|
| Evidence pack | User/pain có bằng chứng, không tự bịa. Có self-use và ít nhất một nguồn ngoài nhóm hoặc kế hoạch lấy nguồn rõ. |
| Opportunity statement | Bằng chứng nói gì sâu hơn về user; vì sao đây là việc đáng sửa. |
| Build slice | Một user, một task, một AI decision, một output. Không build cả app. |
| Auto/Aug decision | AI gợi ý hay tự làm? Human giữ quyền ở đâu? |
| Four paths | Happy, low-confidence, failure, correction. |
| Failure mode | Một lỗi nguy hiểm nhất và cách prototype xử lý. |
| Owner plan | Ai phụ trách research, SPEC, prototype, test, demo, repo. |

## Flow cuối Day 05

```text
16:00  Chọn track/app
16:15  Self-use + tìm evidence nhanh
16:45  Gom evidence -> insight
17:00  Chốt build slice + owner plan
Tối    Hoàn thiện evidence pack + thin SPEC draft
```

## Điều quan trọng nhất

- Track chỉ là **miền app thật**, không phải scope.
- Nhóm không được nộp ý tưởng kiểu "AI assistant cho healthcare" hoặc "chatbot cho travel".
- Một build slice tốt có dạng:

```text
Cho [user cụ thể] đang [task/workflow],
prototype dùng AI để [augment/automate hành động hẹp],
tạo ra [output],
và xử lý [failure mode] bằng [mitigation].
```

Ví dụ:

```text
Cho bệnh nhân lần đầu không biết chọn chuyên khoa,
prototype dùng AI để hỏi 3 câu và gợi ý 2-3 chuyên khoa phù hợp,
đồng thời chuyển sang hướng dẫn khẩn cấp/người thật nếu có red flag.
```

---

*Day 05 Lab — Batch 02 · AI Product Kickoff Sprint*
