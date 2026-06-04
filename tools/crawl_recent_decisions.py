"""Search, download, and parse Vietnamese Ministry of Health drug registration decisions
for the 5 most recent years (2022 - 2026).
"""

from __future__ import annotations

import argparse
import sys
import time
import urllib.parse
import urllib.request
import re
from pathlib import Path

# Add the tools directory to path to import check_moh_drug_registry
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "tools"))

from check_moh_drug_registry import parse_pdf, save_records, DrugRecord

def search_ddg_pdf_by_year(year: int) -> list[str]:
    # Query for decisions containing drug registration for the specific year
    query = f'site:dav.gov.vn "cấp giấy đăng ký lưu hành" "{year}" filetype:pdf'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    print(f"[{year}] Đang tìm kiếm trên DuckDuckGo...")
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8')
            
            # Find URLs
            urls = re.findall(r'href="([^"]+)"', html)
            pdf_urls = []
            for u in urls:
                if 'uddg=' in u:
                    parsed = urllib.parse.urlparse(u)
                    query_params = urllib.parse.parse_qs(parsed.query)
                    if 'uddg' in query_params:
                        real_url = query_params['uddg'][0]
                        if real_url.endswith('.pdf') or '.pdf' in real_url:
                            pdf_urls.append(real_url)
                elif u.endswith('.pdf') or '.pdf' in u:
                    if u.startswith('http'):
                        pdf_urls.append(u)
            
            # Filter URLs containing actual decision PDFs on DAV
            filtered_urls = [u for u in pdf_urls if "upload_images" in u or "files" in u]
            # Fallback to general pdfs on dav if none found
            if not filtered_urls:
                filtered_urls = pdf_urls
                
            return list(dict.fromkeys(filtered_urls)) # deduplicate
    except Exception as e:
        print(f"[{year}] Lỗi tìm kiếm: {e}", file=sys.stderr)
        return []

def download_pdf(url: str, output_path: Path) -> bool:
    print(f" -> Đang tải: {url}")
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as response:
            output_path.write_bytes(response.read())
        print(f" -> Tải thành công: {output_path.name}")
        return True
    except Exception as e:
        print(f" -> Lỗi khi tải PDF: {e}", file=sys.stderr)
        return False

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawl danh mục quyết định cấp phép thuốc trong 5 năm gần đây (2022 - 2026)."
    )
    parser.add_argument(
        "--years",
        default="2022,2023,2024,2025,2026",
        help="Danh sách các năm cần crawl, phân tách bởi dấu phẩy.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Tải và parse lại kể cả khi các file đã tồn tại cục bộ.",
    )
    parser.add_argument(
        "--limit-per-year",
        type=int,
        default=2,
        help="Số lượng PDF tối đa tải và parse cho mỗi năm.",
    )
    args = parser.parse_args()

    years_to_crawl = [int(y.strip()) for y in args.years.split(",") if y.strip().isdigit()]
    manual_dir = ROOT / "data" / "manual_registry"
    manual_dir.mkdir(parents=True, exist_ok=True)

    print(f"=== Bắt đầu crawl danh mục thuốc từ các năm: {years_to_crawl} ===")
    
    total_new_drugs = 0
    crawled_files = []

    for index, year in enumerate(years_to_crawl):
        if index > 0:
            # Sleep to avoid DDG rate limiting
            print("Đang chờ 5 giây trước khi thực hiện năm tiếp theo để tránh bị chặn...")
            time.sleep(5)

        pdf_urls = search_ddg_pdf_by_year(year)
        if not pdf_urls:
            print(f"[{year}] Không tìm thấy link PDF nào.")
            continue

        print(f"[{year}] Tìm thấy {len(pdf_urls)} link PDF.")
        downloaded_count = 0

        for url in pdf_urls:
            if downloaded_count >= args.limit_per_year:
                break

            # Deduce filename from URL path
            parsed_url = urllib.parse.urlparse(url)
            filename = Path(parsed_url.path).name
            # If filename is empty or weird, sanitize it
            filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
            if not filename or not filename.endswith('.pdf'):
                filename = f"decision_{year}_{downloaded_count}.pdf"
            
            # Format file paths
            pdf_path = manual_dir / f"{year}_{filename}"
            json_path = manual_dir / f"{year}_{filename.replace('.pdf', '')}.drugs.json"
            csv_path = manual_dir / f"{year}_{filename.replace('.pdf', '')}.drugs.csv"

            # Download if refresh or file not exists
            should_download = args.refresh or not pdf_path.exists()
            download_success = True
            
            if should_download:
                download_success = download_pdf(url, pdf_path)
                # Sleep between downloads to be polite
                time.sleep(2)
            else:
                print(f" -> Đã có sẵn PDF: {pdf_path.name}")

            if not download_success:
                continue

            # Parse and save
            if args.refresh or not json_path.exists():
                print(f" -> Đang phân tích PDF: {pdf_path.name}")
                try:
                    records = parse_pdf(pdf_path)
                    save_records(records, json_path, csv_path)
                    
                    if records:
                        total_new_drugs += len(records)
                        crawled_files.append((year, pdf_path.name, len(records)))
                        print(f" -> Thành công: Parse được {len(records)} thuốc.")
                    else:
                        print(" -> Cảnh báo: Parse được 0 bản ghi. Bảng PDF có thể không đúng cấu trúc 8/9 cột.")
                except Exception as e:
                    print(f" -> Lỗi phân tích: {e}", file=sys.stderr)
            else:
                try:
                    # Count existing records
                    from check_moh_drug_registry import load_records
                    records = load_records(json_path)
                    total_new_drugs += len(records)
                    crawled_files.append((year, pdf_path.name, len(records)))
                    print(f" -> Sử dụng dữ liệu JSON sẵn có ({len(records)} thuốc).")
                except Exception:
                    pass
            
            downloaded_count += 1

    print("\n" + "=" * 60)
    print("=== TỔNG KẾT QUÁ TRÌNH CRAWL ===")
    print(f"Tổng số thuốc mới được tích hợp vào Database: {total_new_drugs}")
    print("Chi tiết các file đã crawl:")
    for year, fname, count in crawled_files:
        print(f" - [{year}] {fname}: {count} thuốc.")
    print("=" * 60)
    print("Hoàn thành! Bạn chỉ cần restart server Prototype để tra cứu dữ liệu mới.")

if __name__ == "__main__":
    main()
