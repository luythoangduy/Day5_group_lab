"""Search, download, and parse Vietnamese MOH drug registry PDFs by batch.

Primary search phrase:
    "danh sách thuốc được lưu hành đợt x.x"

Outputs are saved under data/manual_registry as:
    dot_<batch>.pdf
    dot_<batch>.drugs.json
    dot_<batch>.drugs.csv
    dot_<batch>.source.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "tools"))

from check_moh_drug_registry import parse_pdf, save_records

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


DDG_URL = "https://html.duckduckgo.com/html/?q={query}"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0 Safari/537.36"
)


def batch_slug(batch: str) -> str:
    return re.sub(r"[^0-9A-Za-z._-]+", "_", batch.strip())


def build_queries(batch: str) -> list[str]:
    batch_variants = [batch]
    compact = batch.replace(".", "")
    if compact != batch:
        batch_variants.append(compact)
        batch_variants.append(batch.split(".", 1)[0])
    queries: list[str] = []
    for value in batch_variants:
        queries.extend(
            [
                f'site:dav.gov.vn "danh sách thuốc được lưu hành đợt {value}"',
                f'site:dav.gov.vn "danh sách thuốc được lưu hành" "đợt {value}"',
                f'site:dav.gov.vn "danh sách thuốc" "lưu hành" "đợt {value}"',
                f'site:dav.gov.vn "danh mục" "thuốc" "đợt {value}"',
                f'site:dav.gov.vn "cấp giấy đăng ký lưu hành" "đợt {value}"',
                f'site:dav.gov.vn "giấy đăng ký lưu hành" "đợt {value}"',
            ]
        )
    return [
        *dict.fromkeys(queries),
    ]


def ddg_extract_result_urls(html: str) -> list[str]:
    urls: list[str] = []
    for href in re.findall(r'href="([^"]+)"', html):
        href = href.replace("&amp;", "&")
        real_url = href
        if "uddg=" in href:
            parsed = urllib.parse.urlparse(href)
            params = urllib.parse.parse_qs(parsed.query)
            real_url = params.get("uddg", [""])[0]
        if not real_url:
            continue
        real_url = urllib.parse.unquote(real_url)
        if not real_url.startswith(("http://", "https://")):
            continue
        urls.append(real_url)
    return list(dict.fromkeys(urls))


def is_download_url(url: str) -> bool:
    lowered = url.lower()
    return ".pdf" in lowered


def extract_download_urls(page_url: str, html: str) -> list[str]:
    urls: list[str] = []
    for href in re.findall(r'(?:href|src)="([^"]+)"', html, flags=re.IGNORECASE):
        href = href.replace("&amp;", "&").strip()
        if not href:
            continue
        full_url = urllib.parse.urljoin(page_url, href)
        if is_download_url(full_url):
            urls.append(full_url)
    return list(dict.fromkeys(urls))


def fetch_text(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def result_score(url: str, batch: str) -> int:
    lowered = urllib.parse.unquote(url).lower()
    compact = batch.lower().replace(".", "")
    score = 0
    if is_download_url(lowered):
        score += 50
    if "dav.gov.vn" in lowered:
        score += 30
    if f"dot-{batch.lower()}" in lowered or f"dot_{batch.lower()}" in lowered:
        score += 20
    if f"dot-{compact}" in lowered or f"dot_{compact}" in lowered:
        score += 20
    if batch.lower() in lowered:
        score += 10
    if compact != batch.lower() and compact in lowered:
        score += 8
    if any(token in lowered for token in ["qd-qld", "qđ-qld", "quyet-dinh", "quyết-định"]):
        score += 10
    return score


def search_ddg_pdf(batch: str) -> tuple[list[str], list[dict[str, object]]]:
    seen: list[str] = []
    attempts: list[dict[str, object]] = []
    headers = {"User-Agent": USER_AGENT}

    for query in build_queries(batch):
        url = DDG_URL.format(query=urllib.parse.quote(query))
        print(f"Đang tìm kiếm: {query}")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as response:
                html = response.read().decode("utf-8", errors="replace")
            result_urls = ddg_extract_result_urls(html)
            download_urls: list[str] = []
            for result_url in result_urls[:10]:
                if is_download_url(result_url):
                    download_urls.append(result_url)
                    continue
                if "dav.gov.vn" not in result_url:
                    continue
                try:
                    page_html = fetch_text(result_url)
                    download_urls.extend(extract_download_urls(result_url, page_html))
                except Exception as exc:
                    attempts.append({"page": result_url, "error": str(exc)})

            download_urls = list(dict.fromkeys(download_urls))
            download_urls.sort(key=lambda item: result_score(item, batch), reverse=True)
            attempts.append(
                {
                    "query": query,
                    "result_count": len(result_urls),
                    "download_count": len(download_urls),
                    "results": result_urls[:10],
                    "downloads": download_urls[:10],
                }
            )
            for download_url in download_urls:
                if download_url not in seen:
                    seen.append(download_url)
            if seen:
                break
        except Exception as exc:
            attempts.append({"query": query, "error": str(exc)})
            print(f"Lỗi khi tìm kiếm: {exc}", file=sys.stderr)
        time.sleep(1)

    return seen, attempts


def download_pdf(url: str, output_path: Path) -> None:
    print(f"Đang tải PDF: {url}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=90) as response:
        output_path.write_bytes(response.read())
    print(f"Đã lưu PDF: {output_path}")


def write_source_metadata(
    path: Path,
    *,
    batch: str,
    chosen_url: str | None,
    attempts: list[dict[str, object]],
    record_count: int | None = None,
) -> None:
    payload = {
        "batch": batch,
        "search_phrase": f"danh sách thuốc được lưu hành đợt {batch}",
        "chosen_url": chosen_url,
        "attempts": attempts,
        "record_count": record_count,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Tìm PDF danh sách thuốc được lưu hành theo đợt, tải xuống, "
            "parse bảng thuốc và lưu vào data/manual_registry."
        )
    )
    parser.add_argument(
        "--batch",
        "-b",
        required=True,
        help='Số đợt cần tìm, hỗ trợ dạng "182", "182.1", "190.2"...',
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Tải lại và parse lại kể cả khi file đã tồn tại.",
    )
    parser.add_argument(
        "--url",
        help="PDF URL cụ thể nếu muốn bỏ qua bước search.",
    )
    args = parser.parse_args()

    batch = args.batch.strip()
    slug = batch_slug(batch)
    manual_dir = ROOT / "data" / "manual_registry"
    pdf_path = manual_dir / f"dot_{slug}.pdf"
    json_path = manual_dir / f"dot_{slug}.drugs.json"
    csv_path = manual_dir / f"dot_{slug}.drugs.csv"
    source_path = manual_dir / f"dot_{slug}.source.json"

    chosen_url = args.url
    attempts: list[dict[str, object]] = []

    if args.refresh or not pdf_path.exists():
        if not chosen_url:
            print(f"--- Bước 1: Tìm PDF cho đợt {batch} ---")
            urls, attempts = search_ddg_pdf(batch)
            if not urls:
                write_source_metadata(
                    source_path,
                    batch=batch,
                    chosen_url=None,
                    attempts=attempts,
                    record_count=None,
                )
                print(
                    f"Không tìm thấy PDF cho đợt {batch}. "
                    f"Metadata search đã lưu tại: {source_path}",
                    file=sys.stderr,
                )
                sys.exit(1)
            chosen_url = urls[0]
            print(f"Tìm thấy {len(urls)} PDF. Chọn link đầu tiên:")
            print(f" -> {chosen_url}")

        print("\n--- Bước 2: Tải PDF ---")
        download_pdf(chosen_url, pdf_path)
    else:
        print(f"Đã có PDF: {pdf_path}. Dùng --refresh để tải lại.")

    record_count: int | None = None
    if args.refresh or not json_path.exists():
        print("\n--- Bước 3: Parse PDF ---")
        records = parse_pdf(pdf_path)
        record_count = len(records)
        if not records:
            print(
                "Cảnh báo: parse được 0 bản ghi. PDF có thể không phải bảng thuốc "
                "hoặc parser chưa hỗ trợ cấu trúc bảng này.",
                file=sys.stderr,
            )
        save_records(records, json_path, csv_path)
    else:
        print(f"Đã có JSON: {json_path}. Dùng --refresh để parse lại.")

    write_source_metadata(
        source_path,
        batch=batch,
        chosen_url=chosen_url,
        attempts=attempts,
        record_count=record_count,
    )
    print(f"Đã lưu metadata nguồn: {source_path}")
    print("Hoàn thành. Restart server prototype để load dữ liệu mới.")


if __name__ == "__main__":
    main()
