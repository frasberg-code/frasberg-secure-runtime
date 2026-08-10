"""Repository-wide branding guard for legacy pre-rebrand tokens."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path


_REPO_ROOT = Path(__file__).parents[3]
_LEGACY_BRAND_TOKEN = "".join(chr(code_point) for code_point in (115, 111, 102, 105, 97))
_LEGACY_BRAND_PATTERN = re.compile(rf"\b{re.escape(_LEGACY_BRAND_TOKEN)}\b", re.IGNORECASE)


def _tracked_files() -> list[Path]:
    """Return repository-tracked file paths resolved from git ls-files."""
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=_REPO_ROOT,
        check=True,
        capture_output=True,
        text=False,
    )
    entries = [entry for entry in result.stdout.split(b"\x00") if entry]
    return [(_REPO_ROOT / entry.decode("utf-8")) for entry in entries]


def _read_text(path: Path) -> str:
    """Best-effort text read for mixed file types tracked by git."""
    if not path.exists():
        return ""
    data = path.read_bytes()
    if b"\x00" in data:
        return ""
    return data.decode("utf-8", errors="ignore")


def test_repository_contains_no_legacy_brand_references() -> None:
    """Fail if any tracked file still contains legacy pre-rebrand branding."""
    offenders: list[str] = []

    for file_path in _tracked_files():
        content = _read_text(file_path)
        if content and _LEGACY_BRAND_PATTERN.search(content):
            offenders.append(str(file_path.relative_to(_REPO_ROOT)))

    assert not offenders, (
        "Found forbidden legacy brand references in tracked files:\n"
        + "\n".join(sorted(offenders))
    )
