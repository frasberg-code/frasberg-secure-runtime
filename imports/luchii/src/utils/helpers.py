from __future__ import annotations

import json
import secrets


def load_json(path: str):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def generate_api_key(prefix: str = "sk_live_") -> str:
    return f"{prefix}{secrets.token_urlsafe(48)}"
