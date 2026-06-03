# Template — Thin SPEC Cuối Day 05

Thin SPEC không phải PRD đầy đủ. Đây là bản cam kết đủ rõ để sáng Day 06 nhóm build ngay.

## 1. Track, product/app và user

**Track:**  
**Product/app thật:**  
**User cụ thể:**  
**Nhóm có phải user thật không? Nếu không, khác ở đâu?**  

## 2. Evidence summary

| Evidence | Nguồn | User/pain nói lên điều gì? | SPEC phải đổi gì? |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## 3. Pain statement

```text
User [ai] đang gặp khó ở [bước/workflow],
vì [nguyên nhân hoặc điểm gãy],
dẫn tới [hậu quả].
Bằng chứng chính là [quote/screenshot/review/observation].
```

## 4. Build slice

```text
Cho [user] đang [task/workflow],
prototype sẽ dùng AI để [augment/automate hành động hẹp],
tạo ra [output],
và xử lý [failure mode] bằng [mitigation].
```

## 5. Auto/Aug decision

Chọn một:

- [ ] **Augmentation:** AI gợi ý/draft/phân loại, user quyết cuối.
- [ ] **Conditional automation:** AI tự làm trong case hẹp; case mơ hồ/rủi ro chuyển người.
- [ ] **Automation:** AI tự quyết và tự hành động.

**Lý do chọn:**  
**Human role:** reviewer / decider / trainer / rescuer / none  

## 6. Four paths

| Path | Prototype phải thể hiện gì? |
|---|---|
| Happy |  |
| Low-confidence |  |
| Failure |  |
| Correction |  |

## 7. Failure mode nguy hiểm nhất

```text
Nếu user [trigger],
AI có thể [failure],
hậu quả là [impact].
Prototype sẽ xử lý bằng [ask again / show source / human review / undo / fallback].
Owner kiểm thử path này là [tên thành viên].
```

## 8. Owner plan cho sáng Day 06

| Thành viên | Việc phụ trách | Bằng chứng cần có trong repo |
|---|---|---|
|  | Research / evidence |  |
|  | SPEC |  |
|  | Prototype |  |
|  | Test / failure path |  |
|  | Demo script / repo |  |
