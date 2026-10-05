import json
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[2]
RULESETS_DIR = ROOT / ".github" / "rulesets"

GITHUB_API = "https://api.github.com"


def read_json(path: pathlib.Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def github_request(token: str, method: str, url: str, body=None):
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url=url, method=method, data=data)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if body is not None:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return {}
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(
            f"[ERROR] GitHub API {method} {url} failed: {exc.code} {exc.reason}\n{detail}"
        ) from exc


def normalize_repo(repo: str):
    owner_repo = repo.strip()
    if "/" not in owner_repo:
        raise SystemExit("[ERROR] GITHUB_REPOSITORY must be in owner/repo format")
    owner, name = owner_repo.split("/", 1)
    owner = owner.strip()
    name = name.strip()
    if not owner or not name:
        raise SystemExit("[ERROR] GITHUB_REPOSITORY contains empty owner or repo")
    return owner, name


def get_repo_rulesets(token: str, owner: str, repo: str):
    owner_q = urllib.parse.quote(owner, safe="")
    repo_q = urllib.parse.quote(repo, safe="")
    url = f"{GITHUB_API}/repos/{owner_q}/{repo_q}/rulesets?includes_parents=false&per_page=100"
    data = github_request(token, "GET", url)
    if not isinstance(data, list):
        raise SystemExit("[ERROR] Expected list response from rulesets API")
    return data


def upsert_ruleset(token: str, owner: str, repo: str, desired: dict, existing_by_name: dict):
    name = desired.get("name")
    if not isinstance(name, str) or not name.strip():
        raise SystemExit("[ERROR] Ruleset payload missing non-empty name")

    owner_q = urllib.parse.quote(owner, safe="")
    repo_q = urllib.parse.quote(repo, safe="")

    existing = existing_by_name.get(name)
    if existing is None:
        url = f"{GITHUB_API}/repos/{owner_q}/{repo_q}/rulesets"
        created = github_request(token, "POST", url, desired)
        print(f"[OK] Created ruleset: {name} (id={created.get('id')})")
        return

    ruleset_id = existing.get("id")
    if not isinstance(ruleset_id, int):
        raise SystemExit(f"[ERROR] Existing ruleset '{name}' missing numeric id")
    url = f"{GITHUB_API}/repos/{owner_q}/{repo_q}/rulesets/{ruleset_id}"
    github_request(token, "PUT", url, desired)
    print(f"[OK] Updated ruleset: {name} (id={ruleset_id})")


def main():
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if not token:
        raise SystemExit("[ERROR] Missing GITHUB_TOKEN")

    repo = os.getenv("GITHUB_REPOSITORY", "").strip()
    if not repo:
        raise SystemExit("[ERROR] Missing GITHUB_REPOSITORY")
    owner, name = normalize_repo(repo)

    ruleset_files = [
        RULESETS_DIR / "protect-main.json",
        RULESETS_DIR / "protect-dev.json",
        RULESETS_DIR / "protect-feature-branches.json",
        RULESETS_DIR / "protect-docs-governance.json",
    ]
    for path in ruleset_files:
        if not path.exists():
            raise SystemExit(f"[ERROR] Missing ruleset file: {path}")

    desired_rulesets = [read_json(path) for path in ruleset_files]
    existing_rulesets = get_repo_rulesets(token, owner, name)
    existing_by_name = {
        rs.get("name"): rs for rs in existing_rulesets if isinstance(rs.get("name"), str)
    }

    for desired in desired_rulesets:
        upsert_ruleset(token, owner, name, desired, existing_by_name)

    print("[OK] Branch rulesets are applied.")


if __name__ == "__main__":
    main()
