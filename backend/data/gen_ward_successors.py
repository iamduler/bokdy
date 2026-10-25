#!/usr/bin/env python3
"""Generate goose seed for reference.ward_former_successors from ward_mappings.sql.

Resolves GSO-style ward codes against the same UUID5 scheme as gen_admin_seed.py.
"""

from __future__ import annotations

import json
import re
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_JSON = ROOT / "data" / "dmhc-old.json"
NEW_SQL = ROOT / "data" / "dmhc-new.sql"
MAPPINGS = ROOT / "data" / "ward_mappings.sql"
OUT = ROOT / "migrations" / "00027_ward_former_successors_seed.sql"

ADMIN_NS = uuid.UUID("01900000-0000-7000-8000-0000000000a0")
BATCH = 500

# MySQL dump VALUES: (id, old_ward_code, old_ward_name, old_district_name,
#   old_province_name, new_ward_code, new_ward_name, new_province_name, created_at, updated_at)
ROW_RE = re.compile(
    r"VALUES\s*\(\s*\d+\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,"
    r"\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'",
    re.I,
)


def uid(kind: str, *parts: str) -> str:
    return str(uuid.uuid5(ADMIN_NS, f"{kind}:{':'.join(parts)}"))


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


def load_former_ward_by_code() -> dict[str, str]:
    data = json.loads(OLD_JSON.read_text(encoding="utf-8"))
    by_code: dict[str, str] = {}
    for p in data["data"]:
        p_code = p["level1_id"]
        for d in p.get("level2s", []):
            d_code = d["level2_id"]
            for w in d.get("level3s", []):
                w_code = w["level3_id"]
                by_code[w_code] = uid("ward_former", p_code, d_code, w_code)
    return by_code


def load_current_ward_by_code() -> dict[str, str]:
    text = NEW_SQL.read_text(encoding="utf-8")
    prov_block = text.split("INSERT INTO provinces")[1].split("-- ----------------------------------")[0]
    province_codes = {row[0] for row in parse_sql_tuples(prov_block)}

    ward_rows: list[tuple[str, ...]] = []
    for match in re.finditer(
        r"INSERT INTO wards\([^)]+\)\s+VALUES\s*(.*?);",
        text,
        flags=re.S,
    ):
        ward_rows.extend(parse_sql_tuples("VALUES " + match.group(1)))

    by_code: dict[str, str] = {}
    for row in ward_rows:
        code, _name, _name_en, _full, _full_en, _code_name, province_code, _unit = row[:8]
        if province_code not in province_codes:
            raise ValueError(f"unknown province_code {province_code} for ward {code}")
        by_code[code] = uid("ward", province_code, code)
    return by_code


def parse_mappings() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for line in MAPPINGS.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.search(line)
        if not m:
            continue
        old_code, new_code = m.group(1).strip(), m.group(5).strip()
        if not old_code or not new_code:
            continue
        pairs.append((old_code, new_code))
    return pairs


def batched(rows: list[str], size: int):
    for i in range(0, len(rows), size):
        yield rows[i : i + size]


def main() -> None:
    if not MAPPINGS.is_file():
        print(f"missing {MAPPINGS}", file=sys.stderr)
        sys.exit(1)

    former = load_former_ward_by_code()
    current = load_current_ward_by_code()
    pairs = parse_mappings()

    inserts: list[str] = []
    seen: set[tuple[str, str]] = set()
    skip_old: list[str] = []
    skip_new: list[str] = []
    for old_code, new_code in pairs:
        wf_id = former.get(old_code)
        w_id = current.get(new_code)
        if wf_id is None:
            skip_old.append(old_code)
            continue
        if w_id is None:
            skip_new.append(new_code)
            continue
        key = (wf_id, w_id)
        if key in seen:
            continue
        seen.add(key)
        sid = uid("ward_former_successor", old_code, new_code)
        inserts.append(f"('{sid}', '{wf_id}', '{w_id}', NULL, now())")

    out: list[str] = [
        "-- +goose Up",
        "-- Generated by backend/data/gen_ward_successors.py — do not edit by hand.",
        "-- Source: backend/data/ward_mappings.sql (former ward → current ward).",
        "TRUNCATE reference.ward_former_successors;",
        "",
    ]
    cols = "id, ward_former_id, ward_id, effective_on, created_at"
    for chunk in batched(inserts, BATCH):
        out.append(f"INSERT INTO reference.ward_former_successors ({cols}) VALUES")
        out.append(",\n".join(chunk) + ";")
        out.append("")

    out.extend(
        [
            "-- +goose Down",
            "TRUNCATE reference.ward_former_successors;",
            "",
        ]
    )
    OUT.write_text("\n".join(out), encoding="utf-8")

    skip_old_u = sorted(set(skip_old))
    skip_new_u = sorted(set(skip_new))
    print(
        f"Wrote {OUT.name}: {len(inserts)} successors from {len(pairs)} mapping rows; "
        f"skip_old={len(skip_old_u)} skip_new={len(skip_new_u)}",
        file=sys.stderr,
    )
    if skip_old_u:
        print(f"  unmatched old codes: {skip_old_u[:20]}", file=sys.stderr)
    if skip_new_u:
        print(f"  unmatched new codes: {skip_new_u}", file=sys.stderr)
    if len(skip_old_u) > 0 or len(skip_new_u) > 1:
        print("ERROR: unexpected unmatched codes (expect at most 1 new: 06970)", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
