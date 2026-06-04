"""Download and search a Vietnamese Ministry of Health drug registry PDF.

Default source:
https://i.baothanhhoa.vn/news/2622/205d4101943t06184l1-403-qd-qld-20261.pdf
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.request import Request, urlopen

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - user-facing dependency message
    print(
        "Missing dependency: pymupdf. Install it with: python -m pip install -r requirements.txt",
        file=sys.stderr,
    )
    raise


DEFAULT_URL = "https://i.baothanhhoa.vn/news/2622/205d4101943t06184l1-403-qd-qld-20261.pdf"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "moh_registry"
PDF_PATH = DATA_DIR / "403-qd-qld-2026.pdf"
JSON_PATH = DATA_DIR / "403-qd-qld-2026.drugs.json"
CSV_PATH = DATA_DIR / "403-qd-qld-2026.drugs.csv"


@dataclass
class DrugRecord:
    appendix: str
    decision: str
    page: int
    stt: str
    medicine_name: str
    active_ingredient: str
    dosage_form: str
    packaging: str
    standard: str
    shelf_life_months: str
    registration_number: str
    previous_registration_number: str = ""
    renewal_count: str = ""


def clean_cell(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ")).strip()


def normalize(value: str) -> str:
    value = value.lower().replace("đ", "d")
    decomposed = unicodedata.normalize("NFD", value)
    no_accents = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", no_accents).strip()


def download_pdf(url: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=60) as response:
        output_path.write_bytes(response.read())


def appendix_from_text(text: str, current: str) -> str:
    # Try to find a dynamic appendix title first (e.g., "Phụ lục I...", "Phụ lục kèm theo...")
    match = re.search(r"(Phụ lục\s+[IVXLCDM\d]+[^\n]*)", text, re.IGNORECASE)
    if match:
        return clean_cell(match.group(1))

    if "Phụ lục IV" in text:
        return "IV - 02 thuốc sản xuất trong nước được gia hạn GĐKLH hiệu lực 5 năm"
    if "Phụ lục III" in text:
        return "III - 06 thuốc nhập khẩu được gia hạn GĐKLH hiệu lực 5 năm"
    if "Phụ lục II" in text:
        return "II - 13 thuốc nhập khẩu được cấp GĐKLH hiệu lực 3 năm"
    if "Phụ lục I" in text:
        return "I - 347 thuốc nhập khẩu được cấp GĐKLH hiệu lực 5 năm"
    return current


def parse_registration(value: str) -> tuple[str, str]:
    value = clean_cell(value)
    previous = ""
    match = re.search(r"\(([^)]+)\)", value)
    if match:
        previous = match.group(1).strip()
        value = re.sub(r"\s*\([^)]+\)", "", value).strip()
    return value, previous


def is_data_row(row: list[object]) -> bool:
    return bool(row) and clean_cell(row[0]).isdigit()


def parse_pdf(pdf_path: Path) -> list[DrugRecord]:
    doc = fitz.open(pdf_path)
    records: list[DrugRecord] = []
    appendix = ""

    for page_index in range(doc.page_count):
        page = doc[page_index]
        page_text = page.get_text("text")
        appendix = appendix_from_text(page_text, appendix)

        tables = page.find_tables()
        for table in tables.tables:
            for raw_row in table.extract():
                if not is_data_row(raw_row):
                    continue

                row = [clean_cell(cell) for cell in raw_row]
                if len(row) == 8:
                    if not row[1] and not row[2]:
                        continue
                    reg_no, previous_reg_no = parse_registration(row[7])
                    records.append(
                        DrugRecord(
                            appendix=appendix,
                            decision="Cấp giấy đăng ký lưu hành",
                            page=page_index + 1,
                            stt=row[0],
                            medicine_name=row[1],
                            active_ingredient=row[2],
                            dosage_form=row[3],
                            packaging=row[4],
                            standard=row[5],
                            shelf_life_months=row[6],
                            registration_number=reg_no,
                            previous_registration_number=previous_reg_no,
                        )
                    )
                elif len(row) == 9:
                    if not row[1] and not row[2]:
                        continue
                    reg_no, previous_reg_no = parse_registration(row[7])
                    records.append(
                        DrugRecord(
                            appendix=appendix,
                            decision="Gia hạn giấy đăng ký lưu hành",
                            page=page_index + 1,
                            stt=row[0],
                            medicine_name=row[1],
                            active_ingredient=row[2],
                            dosage_form=row[3],
                            packaging=row[4],
                            standard=row[5],
                            shelf_life_months=row[6],
                            registration_number=reg_no,
                            previous_registration_number=previous_reg_no,
                            renewal_count=row[8],
                        )
                    )

    return records


def save_records(records: list[DrugRecord], json_path: Path = JSON_PATH, csv_path: Path | None = CSV_PATH) -> None:
    json_path.parent.mkdir(parents=True, exist_ok=True)
    rows = [asdict(record) for record in records]
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(records)} records to JSON: {json_path}")

    if csv_path and rows:
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with csv_path.open("w", newline="", encoding="utf-8-sig") as file:
            writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        print(f"Saved {len(records)} records to CSV : {csv_path}")


def load_records(json_path: Path = JSON_PATH) -> list[DrugRecord]:
    if not json_path.exists():
        return []
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        return [DrugRecord(**item) for item in data]
    except Exception:
        return []


def build_cache(
    url: str,
    refresh: bool,
    pdf_path: Path = PDF_PATH,
    json_path: Path = JSON_PATH,
    csv_path: Path | None = CSV_PATH,
    from_pdf_arg: bool = False,
) -> list[DrugRecord]:
    if from_pdf_arg:
        if not pdf_path.exists():
            print(f"Error: Local PDF file not found at {pdf_path}", file=sys.stderr)
            sys.exit(1)
    else:
        if refresh or not pdf_path.exists():
            print(f"Downloading PDF: {url}")
            download_pdf(url, pdf_path)

    if refresh or not json_path.exists() or (csv_path and not csv_path.exists()):
        print(f"Parsing PDF: {pdf_path}")
        records = parse_pdf(pdf_path)
        save_records(records, json_path, csv_path)
    else:
        records = load_records(json_path)

    return records


def search_records(records: list[DrugRecord], query: str, field: str) -> list[DrugRecord]:
    needle = normalize(query)

    def haystack(record: DrugRecord) -> str:
        if field == "name":
            return record.medicine_name
        if field == "active":
            return record.active_ingredient
        if field == "registration":
            return f"{record.registration_number} {record.previous_registration_number}"
        return " ".join(
            [
                record.medicine_name,
                record.active_ingredient,
                record.registration_number,
                record.previous_registration_number,
            ]
        )

    return [record for record in records if needle in normalize(haystack(record))]


def print_matches(matches: list[DrugRecord], limit: int) -> None:
    if not matches:
        print("NOT FOUND: Không thấy thuốc trong danh mục PDF đã crawl.")
        return

    print(f"FOUND: Tìm thấy {len(matches)} kết quả trong danh mục PDF đã crawl.")
    for record in matches[:limit]:
        print("-" * 80)
        print(f"Tên thuốc: {record.medicine_name}")
        print(f"Hoạt chất: {record.active_ingredient}")
        print(f"Số đăng ký: {record.registration_number}")
        if record.previous_registration_number:
            print(f"Số đăng ký cũ: {record.previous_registration_number}")
        print(f"Quyết định: {record.decision}")
        print(f"Phụ lục: {record.appendix}")
        print(f"Trang PDF: {record.page}")

    if len(matches) > limit:
        print(f"... còn {len(matches) - limit} kết quả khác. Tăng --limit để xem thêm.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawl PDF danh mục thuốc Bộ Y tế và kiểm tra thuốc có trong danh mục không."
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="PDF URL cần crawl.")
    parser.add_argument("--pdf", help="Đường dẫn đến file PDF cục bộ có sẵn (bỏ qua download).")
    parser.add_argument("--output-json", help="Đường dẫn file JSON đầu ra.")
    parser.add_argument("--output-csv", help="Đường dẫn file CSV đầu ra.")
    parser.add_argument("--refresh", action="store_true", help="Tải và parse lại PDF.")
    parser.add_argument("--query", "-q", help="Tên thuốc, hoạt chất, hoặc số đăng ký cần kiểm tra.")
    parser.add_argument(
        "--field",
        choices=["all", "name", "active", "registration"],
        default="all",
        help="Trường dữ liệu dùng để tìm kiếm.",
    )
    parser.add_argument("--limit", type=int, default=20, help="Số kết quả tối đa in ra.")
    args = parser.parse_args()

    # Determine input/output paths
    pdf_path = Path(args.pdf) if args.pdf else PDF_PATH
    json_path = Path(args.output_json) if args.output_json else JSON_PATH
    csv_path = Path(args.output_csv) if args.output_csv else (CSV_PATH if not args.output_json else None)

    if args.query and not args.pdf and not args.output_json:
        records = []
        for folder in [ROOT / "data" / "moh_registry", ROOT / "data" / "manual_registry"]:
            if folder.exists():
                for json_file in folder.glob("*.json"):
                    records.extend(load_records(json_file))
        print(f"Loaded {len(records)} total drug records from all registries in data/.")
    else:
        records = build_cache(
            url=args.url,
            refresh=args.refresh,
            pdf_path=pdf_path,
            json_path=json_path,
            csv_path=csv_path,
            from_pdf_arg=bool(args.pdf),
        )
        print(f"Loaded {len(records)} drug records.")

    if args.query:
        matches = search_records(records, args.query, args.field)
        print_matches(matches, args.limit)


if __name__ == "__main__":
    main()
