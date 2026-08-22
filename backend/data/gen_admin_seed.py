#!/usr/bin/env python3
"""Generate goose seed migration for VN admin units from dmhc-old.json + dmhc-new.sql."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_JSON = ROOT / "data" / "dmhc-old.json"
NEW_SQL = ROOT / "data" / "dmhc-new.sql"
OUT = ROOT / "migrations" / "00020_reference_vn_admin_divisions_seed.sql"
PATCH_OUT = ROOT / "migrations" / "00021_reference_vn_former_name_en.sql"

VN_COUNTRY_ID = "01900000-0000-7000-8000-000000000001"
ADMIN_NS = uuid.UUID("01900000-0000-7000-8000-0000000000a0")
BATCH = 500

UNIT_PREFIXES: dict[str, tuple[str, ...]] = {
    "Thành phố Trung ương": ("Thành phố ",),
    "Thành phố": ("Thành phố ",),
    "Tỉnh": ("Tỉnh ",),
    "Quận": ("Quận ",),
    "Huyện": ("Huyện ",),
    "Thị xã": ("Thị xã ",),
    "Thị trấn": ("Thị trấn ",),
    "Phường": ("Phường ",),
    "Xã": ("Xã ",),
}

PROVINCE_TYPES = {"Thành phố Trung ương", "Thành phố", "Tỉnh"}


def uid(kind: str, *parts: str) -> str:
    return str(uuid.uuid5(ADMIN_NS, f"{kind}:{':'.join(parts)}"))


def esc(value: str) -> str:
    return value.replace("'", "''")


def strip_accents(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def strip_unit_prefix(name: str, unit_type: str) -> str:
    for prefix in UNIT_PREFIXES.get(unit_type, ()):
        if name.startswith(prefix):
            return name[len(prefix) :]
    for prefix in sorted(
        {p for prefixes in UNIT_PREFIXES.values() for p in prefixes},
        key=len,
        reverse=True,
    ):
        if name.startswith(prefix):
            return name[len(prefix) :]
    return name


def former_name_en(
    name_vi: str,
    unit_type: str,
    province_code: str | None = None,
    province_en_by_code: dict[str, str] | None = None,
) -> str:
    if (
        province_code
        and province_en_by_code
        and unit_type in PROVINCE_TYPES
        and province_code in province_en_by_code
    ):
        return province_en_by_code[province_code]
    short = strip_unit_prefix(name_vi, unit_type)
    return strip_accents(short)


def load_current_province_en() -> dict[str, str]:
    text = NEW_SQL.read_text(encoding="utf-8")
    prov_block = text.split("INSERT INTO provinces")[1].split("-- ----------------------------------")[0]
    mapping: dict[str, str] = {}
    for row in parse_sql_tuples(prov_block):
        code, _name, name_en = row[0], row[1], row[2]
        mapping[code] = name_en
    return mapping


def batched(rows: list[str], size: int):
    for i in range(0, len(rows), size):
        yield rows[i : i + size]


def parse_sql_tuples(block: str) -> list[tuple[str, ...]]:
    if "VALUES" in block.upper():
        block = block.split("VALUES", 1)[1]
    rows: list[tuple[str, ...]] = []
    for match in re.finditer(r"\(([^)]+)\)", block):
        inner = match.group(1)
        parts: list[str] = []
        current: list[str] = []
        in_str = False
        for ch in inner:
            if ch == "'" and (not current or current[-1] != "\\"):
                in_str = not in_str
                current.append(ch)
            elif ch == "," and not in_str:
                parts.append("".join(current).strip())
                current = []
            else:
                current.append(ch)
        if current:
            parts.append("".join(current).strip())
        cleaned = []
        for p in parts:
            if p.startswith("'") and p.endswith("'"):
                cleaned.append(p[1:-1].replace("''", "'"))
            else:
                cleaned.append(p)
        if cleaned and cleaned[0] and re.match(r"^[\d'A-Za-z_]", cleaned[0]):
            if cleaned[0] in {"code", "name", "name_en"}:
                continue
            rows.append(tuple(cleaned))
    return rows


def load_former(province_en_by_code: dict[str, str]) -> tuple[list[str], list[str], list[str]]:
    data = json.loads(OLD_JSON.read_text(encoding="utf-8"))
    provinces: list[str] = []
    districts: list[str] = []
    wards: list[str] = []
    for p in data["data"]:
        p_code = p["level1_id"]
        p_id = uid("province_former", p_code)
        p_name = p["name"]
        p_type = p.get("type", "")
        p_name_en = former_name_en(p_name, p_type, p_code, province_en_by_code)
        provinces.append(
            f"('{p_id}', '{VN_COUNTRY_ID}', '{esc(p_code)}', '{esc(p_name_en)}', '{esc(p_name)}', true, now(), now())"
        )
        for d in p.get("level2s", []):
            d_code = d["level2_id"]
            d_id = uid("district_former", p_code, d_code)
            d_name = d["name"]
            d_type = d.get("type", "")
            d_name_en = former_name_en(d_name, d_type)
            districts.append(
                f"('{d_id}', '{p_id}', '{esc(d_code)}', '{esc(d_name_en)}', '{esc(d_name)}', true, now(), now())"
            )
            for w in d.get("level3s", []):
                w_code = w["level3_id"]
                w_id = uid("ward_former", p_code, d_code, w_code)
                w_name = w["name"]
                w_type = w.get("type", "")
                w_name_en = former_name_en(w_name, w_type)
                wards.append(
                    f"('{w_id}', '{d_id}', '{esc(w_code)}', '{esc(w_name_en)}', '{esc(w_name)}', true, now(), now())"
                )
    return provinces, districts, wards


def load_current() -> tuple[list[str], list[str], dict[str, str]]:
    text = NEW_SQL.read_text(encoding="utf-8")
    prov_block = text.split("INSERT INTO provinces")[1].split("-- ----------------------------------")[0]
    province_rows = parse_sql_tuples(prov_block)

    ward_rows: list[tuple[str, ...]] = []
    for match in re.finditer(
        r"INSERT INTO wards\([^)]+\)\s+VALUES\s*(.*?);",
        text,
        flags=re.S,
    ):
        ward_rows.extend(parse_sql_tuples("VALUES " + match.group(1)))

    provinces: list[str] = []
    code_to_id: dict[str, str] = {}
    for row in province_rows:
        code, name, name_en = row[0], row[1], row[2]
        p_id = uid("province", code)
        code_to_id[code] = p_id
        provinces.append(
            f"('{p_id}', '{VN_COUNTRY_ID}', '{esc(code)}', '{esc(name_en)}', '{esc(name)}', true, now(), now())"
        )

    wards: list[str] = []
    for row in ward_rows:
        code, name, name_en, _full, _full_en, _code_name, province_code, _unit = row[:8]
        p_id = code_to_id.get(province_code)
        if not p_id:
            raise ValueError(f"unknown province_code {province_code} for ward {code}")
        w_id = uid("ward", province_code, code)
        wards.append(
            f"('{w_id}', '{p_id}', '{esc(code)}', '{esc(name_en)}', '{esc(name)}', true, now(), now())"
        )
    return provinces, wards, code_to_id


def emit_inserts(table: str, columns: str, rows: list[str]) -> list[str]:
    lines: list[str] = []
    for chunk in batched(rows, BATCH):
        lines.append(f"INSERT INTO {table} ({columns}) VALUES")
        lines.append(",\n".join(chunk))
        lines.append("ON CONFLICT DO NOTHING;")
        lines.append("")
    return lines


def emit_former_inserts(former_p: list[str], former_d: list[str], former_w: list[str]) -> list[str]:
    out: list[str] = []
    out.extend(
        emit_inserts(
            "reference.province_former",
            "id, country_id, code, name_en, name_vi, is_active, created_at, updated_at",
            former_p,
        )
    )
    out.extend(
        emit_inserts(
            "reference.district_former",
            "id, province_former_id, code, name_en, name_vi, is_active, created_at, updated_at",
            former_d,
        )
    )
    out.extend(
        emit_inserts(
            "reference.ward_former",
            "id, district_former_id, code, name_en, name_vi, is_active, created_at, updated_at",
            former_w,
        )
    )
    return out


def main() -> None:
    province_en_by_code = load_current_province_en()
    former_p, former_d, former_w = load_former(province_en_by_code)
    current_p, current_w, _ = load_current()

    out: list[str] = [
        "-- +goose Up",
        "-- Generated by backend/data/gen_admin_seed.py — do not edit by hand.",
        "",
    ]

    out.extend(emit_former_inserts(former_p, former_d, former_w))
    out.extend(
        emit_inserts(
            "reference.province",
            "id, country_id, code, name_en, name_vi, is_active, created_at, updated_at",
            current_p,
        )
    )
    out.extend(
        emit_inserts(
            "reference.ward",
            "id, province_id, code, name_en, name_vi, is_active, created_at, updated_at",
            current_w,
        )
    )

    out.extend(
        [
            "-- +goose Down",
            "TRUNCATE reference.ward_former_successors, reference.ward, reference.province,",
            "         reference.ward_former, reference.district_former, reference.province_former CASCADE;",
            "",
        ]
    )

    OUT.write_text("\n".join(out), encoding="utf-8")

    patch: list[str] = [
        "-- +goose Up",
        "-- Generated by backend/data/gen_admin_seed.py — refresh former name_en values.",
        "TRUNCATE reference.ward_former, reference.district_former, reference.province_former CASCADE;",
        "",
    ]
    patch.extend(emit_former_inserts(former_p, former_d, former_w))
    patch.extend(
        [
            "-- +goose Down",
            "-- Irreversible: former English names were incorrect before this migration.",
            "",
        ]
    )
    PATCH_OUT.write_text("\n".join(patch), encoding="utf-8")

    print(
        f"Wrote {OUT} and {PATCH_OUT} — former: {len(former_p)}/{len(former_d)}/{len(former_w)}, "
        f"current: {len(current_p)}/{len(current_w)}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
