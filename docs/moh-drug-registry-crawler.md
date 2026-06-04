# MOH drug registry crawler

Script: `tools/check_moh_drug_registry.py`

Nguồn mặc định là PDF Quyết định 403/QĐ-QLD năm 2026:

```text
https://i.baothanhhoa.vn/news/2622/205d4101943t06184l1-403-qd-qld-20261.pdf
```

## Cài thư viện

Nếu `python` trên máy đang trỏ sai vào Microsoft Store, dùng Python thật đang có trên máy:

```powershell
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' -m pip install -r requirements.txt
```

## Crawl PDF và xuất dữ liệu

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --refresh
```

Output:

```text
data\moh_registry\403-qd-qld-2026.pdf
data\moh_registry\403-qd-qld-2026.drugs.json
data\moh_registry\403-qd-qld-2026.drugs.csv
```

Script parse được 368 thuốc từ PDF, gồm 360 thuốc cấp giấy đăng ký lưu hành và 8 thuốc gia hạn giấy đăng ký lưu hành.

## Kiểm tra thuốc có nằm trong danh mục không

Tìm theo tên thuốc, hoạt chất, hoặc số đăng ký:

```powershell
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --query Ceclor
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --query Diprospan
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --query 540110082526 --field registration
```

Tìm riêng theo tên thuốc:

```powershell
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --query "Siofor 850" --field name
```

Tìm riêng theo hoạt chất:

```powershell
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\check_moh_drug_registry.py --query metformin --field active
```

## Tự động tìm kiếm và crawl danh sách thuốc theo đợt (Mới)

Hệ thống hỗ trợ một công cụ tự động tìm kiếm quyết định PDF trên cổng thông tin điện tử Cục Quản lý Dược (`dav.gov.vn`) dựa theo số đợt đăng ký, tự động tải xuống và chuyển đổi thành JSON để tích hợp vào Prototype:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\search_and_crawl_moh.py --batch 179
```

### Cách thức hoạt động:
1. **Tìm kiếm:** Script tự động gửi truy vấn tìm kiếm PDF đợt tương ứng trên trang `dav.gov.vn` qua DuckDuckGo HTML Search.
2. **Tải xuống:** Tải file PDF đầu tiên tìm thấy và lưu vào thư mục [data/manual_registry/](file:///d:/aithucchien/Day5_group_lab/data/manual_registry) với tên `dot_[batch].pdf`.
3. **Phân tích:** Parse tự động nội dung PDF và xuất thành `dot_[batch].drugs.json` và `dot_[batch].drugs.csv`.
4. **Tích hợp:** Do server Prototype tự động quét và gộp tất cả các file JSON trong thư mục này, thuốc từ đợt mới sẽ ngay lập tức xuất hiện trong kết quả tìm kiếm của ứng dụng sau khi khởi động lại server.

## Crawl quyết định cấp phép trong 5 năm gần nhất (Mới)

Hệ thống hỗ trợ script tự động tìm kiếm, tải xuống và phân tích danh mục thuốc được lưu hành từ 5 năm gần đây nhất (từ 2022 đến 2026) trên trang `dav.gov.vn`:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\ADMIN\AppData\Local\Python\bin\python.exe' tools\crawl_recent_decisions.py --limit-per-year 2
```

### Các tùy chọn cấu hình:
- `--years`: Danh sách các năm cần crawl, phân tách bằng dấu phẩy (mặc định: `2022,2023,2024,2025,2026`).
- `--limit-per-year`: Giới hạn số lượng file PDF tối đa tải về cho mỗi năm (mặc định: `2`).
- `--refresh`: Tải và parse lại kể cả khi các file PDF/JSON đã có sẵn cục bộ.

Kết quả dữ liệu phân tích thành công sẽ được gộp tự động vào cơ sở dữ liệu tra cứu khi server Prototype được khởi động lại.


