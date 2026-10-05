from __future__ import annotations

import argparse
import json
from pathlib import Path

from luchii_api.main import app

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = ROOT / "docs" / "openapi" / "luchii.openapi.json"


def build_schema() -> dict:
    schema = app.openapi()
    schema.setdefault("servers", [{"url": "/luchii/v1"}])
    schema.setdefault(
        "tags",
        [
            {"name": "system"},
            {"name": "market"},
            {"name": "lead"},
            {"name": "coach"},
            {"name": "memory"},
            {"name": "assist"},
            {"name": "skin"},
        ],
    )
    return schema


def write_schema(output_path: Path) -> Path:
    schema = build_schema()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate OpenAPI schema from FastAPI app.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output path for generated OpenAPI JSON (default: {DEFAULT_OUTPUT})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_path = write_schema(args.output)
    print(f"OpenAPI schema generated at: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
