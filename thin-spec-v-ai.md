# Thin SPEC — V-App / V-AI (Cuối Day 05)

> **ARCHIVED — track đã đổi.** Dùng file mới: [`thin-spec-prescription.md`](thin-spec-prescription.md)

Bản cam kết đủ rõ để sáng Day 06 nhóm build ngay.

---

## 1. Track, product/app và user

**Track:** V-App — V-AI (VinGroup)  
**Product/app thật:** V-App (super-app VinGroup) · V-AI (trợ lý AI in-app, kiến trúc quan sát: RAG + safety filters)  
**User cụ thể:** Người dùng V-App **đã có giao dịch hoặc đăng ký dịch vụ** trong hệ sinh thái Vin, đang cần **hủy thanh toán tự động**, kiểm tra **khoản trừ bất thường**, hoặc **khiếu nại** — không phải user mới tra cứu thông tin chung.  
**Nhóm có phải user thật không? Nếu không, khác ở đâu?**  
Một phần nhóm đã self-use V-AI. Không phải user điển hình của flow "hủy TT tự động hàng ngày" — cần giả lập prompt và (nếu có) phỏng vấn nhanh 1 người từng gặp vấn đề trừ tiền/hủy gói trước M1 Day 06.

---

## 2. Evidence summary

| Evidence | Nguồn | User/pain nói lên điều gì? | SPEC phải đổi gì? |
|---|---|---|---|
| Hỏi hủy TT tự động → chỉ text `1900...` + email | Self-use V-AI | User cần **hành động**, không cần thêm paragraph | Bắt buộc CTA handoff trong prototype |
| *"Không đúng, tôi không hỏi chuyển tiền"* → re-intent đúng hướng hủy | Self-use | AI hiểu được sau correction; thiếu escalate | Auto-handoff sau fallback ≥ 2 |
| Tra cứu giao dịch → RAG + bullet OK | Self-use | Lookup path ổn — không rebuild RAG | Giữ lookup đơn giản; focus sensitive path |
| *"Lấy thông tin ở đâu?"* → hallucinate backtick | Self-use (~ảnh 505) | Trust gap — không ưu tiên Day 06 | Backlog source UX |
| Moni/NEO so sánh sáng | Self-use 3 app | V-AI tốt nhất lab nhưng thiếu handoff vs kỳ vọng super-app | Chọn V-AI track; học Grab/Shopee pattern CSKH |

---

## 3. Pain statement

```text
User V-App đang gặp khó ở bước hủy thanh toán tự động hoặc xử lý vấn đề trừ tiền / khiếu nại qua V-AI,
vì trợ lý chỉ trả lời dạng text hướng dẫn và hotline/email, không có deep-link in-app hay nút chuyển CSKH,
dẫn tới user phải thoát app, tự gọi hoặc viết mail — churn risk cao tại moment frustration.
Bằng chứng chính là self-use: prompt hủy dịch vụ / trừ tiền chỉ nhận text 1900 + info@v-app.vn;
correction "Không đúng..." cho thấy AI hiểu đúng intent nhưng vẫn không đưa actionable CTA.
```

---

## 4. Build slice

```text
Cho user V-App đang muốn hủy thanh toán tự động (hoặc hỏi về khoản trừ / khiếu nại),
prototype sẽ dùng AI để phân loại intent (tra cứu / làm rõ / nhạy cảm) và route response,
tạo ra deep-link CTA [Đến màn hình hủy dịch vụ] + handoff [Gọi CSKH] [Chat] trong chat,
và xử lý failure mode "chỉ text hotline" bằng bắt buộc CTA + auto-handoff sau 2 lần user nói "Không đúng".
```

**In scope Day 06:**
- Chat UI mock (web hoặc Figma clickable)
- Intent classifier (rule/keyword hoặc LLM prompt nhẹ)
- 3 response templates: lookup / clarify (chips) / sensitive_handoff
- Demo script 3–5 phút

**Out of scope Day 06:**
- Full RAG, training model, tích hợp API V-App thật
- Clickable source, webview fix, correction logging pipeline

---

## 5. Auto/Aug decision

- [ ] **Augmentation:** AI gợi ý/draft/phân loại, user quyết cuối.
- [x] **Conditional automation:** AI tự classify và route; intent nhạy cảm / fallback ≥ 2 → handoff ngay; lookup đơn giản AI trả lời + gợi ý CTA.
- [ ] **Automation:** AI tự quyết và tự hành động.

**Lý do chọn:** Task liên quan tiền và hủy dịch vụ — rủi ro cao. AI không được tự hủy dịch vụ; chỉ được route user đến đúng màn hình hoặc người. Tra cứu thông thường có thể auto-reply; nhạy cảm luôn có human path.

**Human role:** **rescuer** (CSKH khi sensitive / fallback) · **decider** (user bấm CTA xác nhận hủy trên màn hình thật — prototype mock)

---

## 6. Four paths

| Path | Prototype phải thể hiện gì? |
|---|---|
| **Happy** | User: *"Tôi muốn hủy thanh toán tự động gói X"* → AI classify `sensitive` → hiện bullet ngắn + **[Đến màn hình Hủy dịch vụ]** + **[Gọi 1900…]** + **[Chat CSKH]** (mock click được) |
| **Low-confidence** | User: *"Tôi bị trừ tiền"* (mơ hồ) → AI `clarify` → chips: [Kiểm tra giao dịch] [Hủy thanh toán tự động] [Khiếu nại] → user chọn → route đúng |
| **Failure** | Simulate as-is: AI response chỉ có đoạn text hotline/email **không nút** → demo đây là failure cần fix; hoặc jailbreak → canned block (1 slide) |
| **Correction** | User: *"Không đúng, tôi không hỏi chuyển tiền"* → AI re-route → sensitive_handoff + CTA; nếu user nói "Không đúng" lần 2 → **auto-handoff** full (highlight trong demo) |

---

## 7. Failure mode nguy hiểm nhất

```text
Nếu user hỏi hủy thanh toán tự động hoặc khiếu nại trừ tiền,
AI có thể chỉ trả lời text hướng dẫn + số hotline/email (không CTA),
hậu quả là user thoát app, tự gọi — mất niềm tin, có thể bỏ dịch vụ VinGroup.
Prototype sẽ xử lý bằng: intent `sensitive` → luôn kèm deep-link + [Gọi] [Chat];
fallback count >= 2 sau "Không đúng" → auto-handoff panel.
Owner kiểm thử path này là Nguyễn Hoàng Minh (điền thêm nếu nhóm chia).
```

---

## 8. Owner plan cho sáng Day 06

| Thành viên | Việc phụ trách | Bằng chứng cần có trong repo |
|---|---|---|
| Nguyễn Hoàng Minh | Research / evidence | `evidence-pack-v-ai.md` + screenshots trong folder `evidence/` |
| _(tên)_ | SPEC | `thin-spec-v-ai.md` (file này) |
| _(tên)_ | Prototype | Link repo / `prototype/` — chat mock + intent router |
| Nguyễn Hoàng Minh | Test / failure path | Script test: prompt hủy TT → phải có CTA; 2x "Không đúng" → handoff |
| _(tên)_ | Demo script / repo | `demo-script.md` — 3–5 phút, show 4 paths |

---

## Phụ lục — Liên kết artifact

| File | Mô tả |
|---|---|
| `01-invidual-workshop/v-ai-app-teardown.md` | Individual teardown (paths, as-is/to-be) |
| `02-group-spec/evidence-pack-v-ai.md` | Evidence pack nhóm |
| `02-group-spec/synthesis-decide-v-ai.md` | Synthesis & build slice decision |
| `02-group-spec/thin-spec-v-ai.md` | Thin SPEC (file này) |

---

*Thin SPEC · V-App V-AI · Batch 02 Day 05 · Ready for Day 06 build*
