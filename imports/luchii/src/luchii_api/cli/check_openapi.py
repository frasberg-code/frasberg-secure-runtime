from __future__ import annotations

import argparse
import json
from pathlib import Path

from openapi_spec_validator import validate_spec

from luchii_api.cli.generate_openapi import build_schema

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SPEC = ROOT / "docs" / "openapi" / "luchii.openapi.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate committed OpenAPI schema.")
    parser.add_argument(
        "--spec",
        type=Path,
        default=DEFAULT_SPEC,
        help=f"Path to OpenAPI JSON artifact (default: {DEFAULT_SPEC})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.spec.exists():
        print(f"OpenAPI spec not found: {args.spec}")
        print("Run luchii-openapi-generate first.")
        return 1

    current_text = args.spec.read_text(encoding="utf-8")
    current_spec = json.loads(current_text)

    validate_spec(current_spec)

    expected_text = json.dumps(build_schema(), indent=2, sort_keys=True) + "\n"
    if current_text != expected_text:
        print("OpenAPI spec is out of date.")
        print("Run: luchii-openapi-generate")
        return 1

    print(f"OpenAPI spec is valid and up to date: {args.spec}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
