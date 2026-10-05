"""Regression guard: canonical and v5.1 routing modules must not reference the
legacy OpenAI client module or its exported symbols.

If this test fails it means one of the target files has imported or referenced
`openai_client`, `get_openai_client`, or `OpenAIClient` — all of which belong
exclusively to the deprecated ``backend/app/integrations/llm/openai_client.py``
module and must not appear in routing code.
"""

import re
from pathlib import Path

import pytest

# Resolved relative to this file so the test works from any working directory.
_REPO_ROOT = Path(__file__).parents[3]
_LLM_DIR = _REPO_ROOT / "backend" / "app" / "integrations" / "llm"

_TARGET_FILES = [
    _LLM_DIR / "canonical.py",
    _LLM_DIR / "__init__.py",
]

_FORBIDDEN_TOKENS = [
    "openai_client",
    "get_openai_client",
    "OpenAIClient",
]


def _read_source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


@pytest.mark.parametrize("filepath", _TARGET_FILES, ids=lambda p: p.name)
@pytest.mark.parametrize("token", _FORBIDDEN_TOKENS)
def test_no_legacy_openai_token(filepath: Path, token: str) -> None:
    """Fail if a forbidden legacy OpenAI client token appears in *filepath*."""
    source = _read_source(filepath)
    pattern = re.compile(r"\b" + re.escape(token) + r"\b")
    assert not pattern.search(source), (
        f"Forbidden legacy token '{token}' found in {str(filepath)!r}. "
        "Routing modules must not reference the deprecated openai_client module."
    )
