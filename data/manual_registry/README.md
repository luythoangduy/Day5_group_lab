# Thư mục bổ sung tài liệu thuốc thủ công (Manual Drug Registry)

Thư mục này được dùng để chứa các tài liệu PDF đăng ký thuốc bổ sung hoặc các file dữ liệu JSON được cấu trúc thủ công.

## Hướng dẫn sử dụng

### 1. Bổ sung trực tiếp bằng file JSON
Bạn có thể tạo các file `.json` trong thư mục này (ví dụ: `manual_drugs.json`) với cấu trúc mảng các bản ghi thuốc như sau:

```json
[
  {
    "appendix": "Phụ lục bổ sung thủ công",
    "decision": "Cấp giấy đăng ký lưu hành",
    "page": 1,
    "stt": "1",
    "medicine_name": "Tên thuốc bổ sung",
    "active_ingredient": "Hoạt chất chính",
    "dosage_form": "Dạng bào chế",
    "packaging": "Hộp/Vỉ...",
    "standard": "NSX",
    "shelf_life_months": "36",
    "registration_number": "SỐ-ĐĂNG-KÝ-01",
    "previous_registration_number": "",
    "renewal_count": ""
  }
]
```
Server của Prototype sẽ tự động quét qua thư mục này và gộp toàn bộ các file `.json` vào cơ sở dữ liệu tra cứu khi khởi động.

---

### 2. Crawl/Parse file PDF thủ công sang JSON
Nếu bạn có một file PDF quyết định cấp phép thuốc mới (ví dụ: `quyet-dinh-xyz.pdf`):
1. Copy file PDF đó vào thư mục này.
2. Chạy lệnh sau để script phân tích PDF và xuất ra file JSON tương ứng ngay tại thư mục này:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --pdf data\manual_registry\quyet-dinh-xyz.pdf --output-json data\manual_registry\quyet-dinh-xyz.drugs.json
```

Sau khi chạy xong, server sẽ tự động nhận diện file JSON mới sinh ra.
