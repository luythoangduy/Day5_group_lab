"""Search DuckDuckGo for the Vietnamese MOH drug registry PDF of a specific batch,
download it, parse it, and save the output to data/manual_registry.
"""

from __future__ import annotations

import argparse
import sys
import urllib.parse
import urllib.request
import re
from pathlib import Path

# Add the tools directory to the path so we can import from check_moh_drug_registry
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "tools"))

from check_moh_drug_registry import parse_pdf, save_records, DrugRecord

def search_ddg_pdf(batch: str) -> list[str]:
    # Construct a search query targeting dav.gov.vn with the decision/batch keywords
    query = f'site:dav.gov.vn "cấp giấy đăng ký lưu hành" "đợt {batch}" filetype:pdf'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    print(f"Đang tìm kiếm trên DuckDuckGo: {url}")
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8')
            
            # Find URLs
            urls = re.findall(r'href="([^"]+)"', html)
            pdf_urls = []
            for u in urls:
                # DuckDuckGo HTML format redirects through /l/?uddg=...
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
            
            return list(dict.fromkeys(pdf_urls)) # deduplicate
    except Exception as e:
        print(f"Lỗi khi tìm kiếm: {e}", file=sys.stderr)
        return []

def download_pdf(url: str, output_path: Path) -> None:
    print(f"Đang tải PDF: {url}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        output_path.write_bytes(response.read())
    print(f"Đã tải thành công và lưu tại: {output_path}")

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tìm kiếm PDF đợt thuốc lưu hành trên Cục Quản lý Dược, tải xuống và phân tích thành JSON."
    )
    parser.add_argument(
        "--batch",
        "-b",
        required=True,
        help="Số đợt cấp phép thuốc cần tìm kiếm (ví dụ: 182, 179, 403, ...)",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Ghi đè và tải lại/parse lại ngay cả khi file đã tồn tại.",
    )
    args = parser.parse_args()

    batch_str = args.batch.strip()
    
    # Define outputs in the manual registry directory
    manual_dir = ROOT / "data" / "manual_registry"
    pdf_path = manual_dir / f"dot_{batch_str}.pdf"
    json_path = manual_dir / f"dot_{batch_str}.drugs.json"
    csv_path = manual_dir / f"dot_{batch_str}.drugs.csv"

    # Step 1: Search for PDF URL if not already downloaded
    if args.refresh or not pdf_path.exists():
        print(f"--- Bước 1: Tìm kiếm tài liệu PDF cho Đợt {batch_str} ---")
        pdf_urls = search_ddg_pdf(batch_str)
        if not pdf_urls:
            # Fallback query with less restrictive keywords
            print("Không tìm thấy kết quả với truy vấn chính thức. Đang thử truy vấn mở rộng...")
            query_fallback = f'site:dav.gov.vn "giấy đăng ký lưu hành" "đợt {batch_str}" filetype:pdf'
            # Try searching again
            url_fallback = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query_fallback)}"
            headers = {'User-Agent': 'Mozilla/5.0'}
            try:
                with urllib.request.urlopen(urllib.request.Request(url_fallback, headers=headers), timeout=15) as resp:
                    html = resp.read().decode('utf-8')
                    urls = re.findall(r'href="([^"]+)"', html)
                    for u in urls:
                        if 'uddg=' in u:
                            parsed = urllib.parse.urlparse(u)
                            query_params = urllib.parse.parse_qs(parsed.query)
                            if 'uddg' in query_params:
                                real_url = query_params['uddg'][0]
                                if real_url.endswith('.pdf') or '.pdf' in real_url:
                                    pdf_urls.append(real_url)
            except Exception:
                pass

        if not pdf_urls:
            print(f"Lỗi: Không tìm thấy link PDF nào cho Đợt {batch_str} trên trang dav.gov.vn.", file=sys.stderr)
            print("Bạn có thể tải PDF thủ công, lưu vào: " + str(pdf_path) + " rồi chạy lại.", file=sys.stderr)
            sys.exit(1)
        
        # Pick the first URL
        chosen_url = pdf_urls[0]
        print(f"Tìm thấy {len(pdf_urls)} link. Chọn link đầu tiên:")
        print(f" -> {chosen_url}")
        
        # Step 2: Download the PDF
        print(f"\n--- Bước 2: Tải PDF ---")
        try:
            download_pdf(chosen_url, pdf_path)
        except Exception as e:
            print(f"Lỗi khi tải PDF: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"File PDF đã tồn tại cục bộ: {pdf_path}. Bỏ qua bước tải xuống (dùng --refresh để tải lại).")

    # Step 3: Parse PDF and Save
    if args.refresh or not json_path.exists():
        print(f"\n--- Bước 3: Phân tích PDF & Lưu dữ liệu ---")
        try:
            print(f"Đang phân tích PDF: {pdf_path}")
            records = parse_pdf(pdf_path)
            if not records:
                print("Cảnh báo: Không parse được bản ghi thuốc nào từ PDF. Vui lòng kiểm tra lại cấu trúc bảng của file PDF này.", file=sys.stderr)
            save_records(records, json_path, csv_path)
            print("Hoàn thành!")
        except Exception as e:
            print(f"Lỗi khi phân tích PDF: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"Dữ liệu JSON đã tồn tại: {json_path}. Bỏ qua bước phân tích (dùng --refresh để parse lại).")

if __name__ == "__main__":
    main()
