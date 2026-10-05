import json
import pathlib
import re
import subprocess

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]
WF_DIR = ROOT / ".github" / "workflows"
RULESETS_DIR = ROOT / ".github" / "rulesets"

REQUIRED_WORKFLOWS = {
    "dev-deploy.yml": {
        "branch": "dev",
        "environment": "development",
    },
    "staging-deploy.yml": {
        "branch": "staging",
        "environment": "staging",
    },
    "prod-deploy.yml": {
        "branch": "main",
        "environment": "production",
    },
}

REQUIRED_PYTHON_VERSION = "3.11"
REQUIRED_DEPLOY_PERMISSIONS = {
    "contents": "write",
    "deployments": "write",
}
FORBIDDEN_AUTHORS = [
    "Copilot",
    "copilot-swe-agent[bot]",
    "github-actions",
    "dependabot",
    "GitHub Actions",
    "GitHub Copilot",
]
FORBIDDEN_AUTHOR_PATTERNS = [
    re.compile(r"\bcopilot\b", re.IGNORECASE),
    re.compile(r"\bgithub-actions(?:\[bot\])?\b", re.IGNORECASE),
    re.compile(r"\bdependabot(?:\[bot\])?\b", re.IGNORECASE),
]
FORBIDDEN_WORKFLOW_TEXT_PATTERNS = [
    re.compile(r"automatically\s+request\s+copilot\s+code\s+review", re.IGNORECASE),
]
CONTRIBUTOR_MAINTENANCE_WORKFLOWS = {
    "clear-contributor-cache.yml",
    "enforce-author.yml",
}
REQUIRED_RULESET_FILES = {
    "protect-main.json": "Protect main",
    "protect-dev.json": "Protect dev",
    "protect-feature-branches.json": "Protect feature branches",
}


def load_yaml(path: pathlib.Path):
    with path.open(encoding="utf-8") as f:
        loaded = yaml.safe_load(f)
    if not isinstance(loaded, dict):
        raise SystemExit(f"[ERROR] {path.name}: workflow must be a YAML mapping")
    return loaded


def load_json(path: pathlib.Path):
    with path.open(encoding="utf-8") as f:
        loaded = json.load(f)
    if not isinstance(loaded, dict):
        raise SystemExit(f"[ERROR] {path.name}: ruleset must be a JSON object")
    return loaded


def get_on_block(wf):
    # PyYAML 1.1 can coerce the key "on" to bool True.
    return wf.get("on") if "on" in wf else wf.get(True, {})


def normalize_to_list(value):
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    if isinstance(value, str):
        return [value]
    return []


def get_event_config(on_block, event_name):
    if isinstance(on_block, dict):
        event_cfg = on_block.get(event_name)
        if event_cfg is None:
            return {}
        if isinstance(event_cfg, dict):
            return event_cfg
        # event can be defined as a scalar/list shorthand.
        return {}
    return {}


def normalize_environment(environment):
    if isinstance(environment, str):
        return environment.strip()
    if isinstance(environment, dict):
        name = environment.get("name")
        if isinstance(name, str):
            return name.strip()
    return None


def normalize_permissions(permissions):
    if not isinstance(permissions, dict):
        return {}
    normalized = {}
    for key, value in permissions.items():
        if isinstance(key, str) and isinstance(value, str):
            normalized[key] = value.strip().lower()
    return normalized


def is_python_311(version):
    if not isinstance(version, str):
        return False
    return bool(re.fullmatch(r"3\.11(?:\.x|(?:\.\d+)?)?", version.strip()))


def get_deploy_job(wf_name, wf):
    jobs = wf.get("jobs", {})
    if not isinstance(jobs, dict) or "deploy" not in jobs:
        raise SystemExit(f"[ERROR] {wf_name}: missing 'deploy' job")
    deploy = jobs["deploy"]
    if not isinstance(deploy, dict):
        raise SystemExit(f"[ERROR] {wf_name}: 'deploy' job must be a mapping")
    return deploy


def assert_branch_trigger(wf_name, wf, expected_branch):
    on_block = get_on_block(wf)
    push = get_event_config(on_block, "push")
    branches = normalize_to_list(push.get("branches", []))
    if not branches:
        raise SystemExit(
            f"[ERROR] {wf_name}: expected push trigger on branch '{expected_branch}', found none"
        )
    if expected_branch not in branches:
        raise SystemExit(
            f"[ERROR] {wf_name}: expected push trigger on branch "
            f"'{expected_branch}', found {branches}"
        )
    if len(branches) != 1:
        raise SystemExit(
            f"[ERROR] {wf_name}: deploy workflow push branches must only contain "
            f"'{expected_branch}', found {branches}"
        )


def assert_environment(wf_name, wf, expected_env):
    deploy = get_deploy_job(wf_name, wf)
    env_name = normalize_environment(deploy.get("environment"))
    if env_name != expected_env:
        raise SystemExit(
            f"[ERROR] {wf_name}: expected environment '{expected_env}', found '{env_name}'"
        )


def assert_permissions(wf_name, wf):
    deploy = get_deploy_job(wf_name, wf)
    workflow_perms = normalize_permissions(wf.get("permissions", {}))
    deploy_perms = normalize_permissions(deploy.get("permissions", {}))
    merged = {**workflow_perms, **deploy_perms}
    if any(merged.get(k) != v for k, v in REQUIRED_DEPLOY_PERMISSIONS.items()):
        raise SystemExit(
            f"[ERROR] {wf_name}: permissions must include contents: write, deployments: write"
        )


def assert_python_setup(wf_name, wf):
    deploy = get_deploy_job(wf_name, wf)
    steps = deploy.get("steps", [])
    if not isinstance(steps, list):
        raise SystemExit(f"[ERROR] {wf_name}: deploy.steps must be a list")
    for step in steps:
        if not isinstance(step, dict):
            continue
        uses = step.get("uses", "")
        if isinstance(uses, str) and uses.startswith("actions/setup-python@v5"):
            version = step.get("with", {}).get("python-version")
            if not is_python_311(version):
                raise SystemExit(
                    f"[ERROR] {wf_name}: expected python-version "
                    f"{REQUIRED_PYTHON_VERSION}, found {version}"
                )
            return
    raise SystemExit(f"[ERROR] {wf_name}: missing actions/setup-python@v5 step")


def assert_quality_gates(wf_name, wf):
    deploy = get_deploy_job(wf_name, wf)
    steps = deploy.get("steps", [])
    if not isinstance(steps, list):
        raise SystemExit(f"[ERROR] {wf_name}: deploy.steps must be a list")
    required_runs = {
        "pytest": False,
        "flake8 .": False,
        "mypy .": False,
        "pytest tests/test_api.py -k model_name": False,
    }
    for step in steps:
        if not isinstance(step, dict):
            continue
        run = step.get("run", "")
        if not isinstance(run, str):
            continue
        if re.search(r"(^|\s)pytest(\s|$)", run):
            required_runs["pytest"] = True
        if "flake8 ." in run:
            required_runs["flake8 ."] = True
        if "mypy ." in run:
            required_runs["mypy ."] = True
        if (
            "pytest tests/test_api.py -k model_name" in run
            or "pytest test_api.py -k model_name" in run
        ):
            required_runs["pytest tests/test_api.py -k model_name"] = True

    missing = [gate for gate, present in required_runs.items() if not present]
    if missing:
        raise SystemExit(
            f"[ERROR] {wf_name}: missing required quality gate steps: {', '.join(missing)}"
        )


def assert_deploy_guard(wf_name, wf):
    deploy = get_deploy_job(wf_name, wf)
    steps = deploy.get("steps", [])
    if not isinstance(steps, list):
        raise SystemExit(f"[ERROR] {wf_name}: deploy.steps must be a list")
    deploy_step_found = False
    for step in steps:
        if not isinstance(step, dict):
            continue
        name = step.get("name", "")
        run = step.get("run", "")
        looks_like_deploy = (
            isinstance(name, str)
            and name.strip().lower() == "deploy"
        ) or (isinstance(run, str) and "./deploy.sh" in run)
        if looks_like_deploy:
            deploy_step_found = True
            cond = step.get("if")
            if not isinstance(cond, str) or cond.strip() != "success()":
                raise SystemExit(
                    f"[ERROR] {wf_name}: deploy step must be guarded with "
                    f"if: success(), found '{cond}'"
                )
    if not deploy_step_found:
        raise SystemExit(
            f"[ERROR] {wf_name}: missing Deploy step (or ./deploy.sh run step)"
        )


def assert_no_copilot_env():
    for wf_path in WF_DIR.glob("*.yml"):
        wf = load_yaml(wf_path)
        jobs = wf.get("jobs", {})
        if not isinstance(jobs, dict):
            continue
        for _, job in jobs.items():
            if not isinstance(job, dict):
                continue
            env = job.get("environment")
            env_name = normalize_environment(env)
            if isinstance(env_name, str) and env_name.lower() == "copilot":
                raise SystemExit(
                    f"[ERROR] {wf_path.name}: references forbidden environment 'copilot'"
                )


def assert_no_forbidden_authors():
    """Reject history that includes known automated commit authors."""
    output = subprocess.check_output(
        ["git", "log", "--pretty=format:%an|%ae"],
        cwd=ROOT,
    ).decode("utf-8", errors="ignore")
    seen_forbidden = set()

    for line in output.splitlines():
        parts = line.split("|", maxsplit=1)
        author_name = parts[0].strip() if parts else ""
        author_email = parts[1].strip() if len(parts) > 1 else ""
        author_blob = f"{author_name} <{author_email}>"

        if author_name in FORBIDDEN_AUTHORS:
            seen_forbidden.add(author_name)
            continue

        for pattern in FORBIDDEN_AUTHOR_PATTERNS:
            if pattern.search(author_blob):
                seen_forbidden.add(author_blob)
                break

    if seen_forbidden:
        offenders = ", ".join(sorted(seen_forbidden))
        raise SystemExit(
            f"[ERROR] Forbidden commit author detected in history: {offenders}"
        )


def assert_no_forbidden_workflow_references():
    """Block automation settings text that enables Copilot participation."""
    for wf_path in WF_DIR.glob("*.yml"):
        text = wf_path.read_text(encoding="utf-8")
        for pattern in FORBIDDEN_WORKFLOW_TEXT_PATTERNS:
            if pattern.search(text):
                raise SystemExit(
                    f"[ERROR] {wf_path.name}: forbidden reference matching '{pattern.pattern}'"
                )


def assert_forbidden_main_push_for_non_prod():
    for wf_path in WF_DIR.glob("*.yml"):
        if wf_path.name == "prod-deploy.yml":
            continue
        wf = load_yaml(wf_path)
        on_block = get_on_block(wf)
        push = get_event_config(on_block, "push")
        branches = normalize_to_list(push.get("branches", []))
        if "main" in branches:
            raise SystemExit(
                "[ERROR] "
                f"{wf_path.name}: non-production workflow cannot trigger on push to 'main'"
            )


def assert_contributor_workflow_branch_restrictions():
    for wf_name in CONTRIBUTOR_MAINTENANCE_WORKFLOWS:
        wf_path = WF_DIR / wf_name
        if not wf_path.exists():
            continue
        wf = load_yaml(wf_path)
        on_block = get_on_block(wf)
        push = get_event_config(on_block, "push")
        branches = normalize_to_list(push.get("branches", []))
        forbidden = [branch for branch in ("main", "staging") if branch in branches]
        if forbidden:
            raise SystemExit(
                "[ERROR] "
                f"{wf_name}: contributor maintenance workflow cannot push-trigger on {forbidden}"
            )


def assert_rulesets_present_and_targeted():
    for filename, expected_name in REQUIRED_RULESET_FILES.items():
        path = RULESETS_DIR / filename
        if not path.exists():
            raise SystemExit(f"[ERROR] Missing ruleset file: {filename}")

        ruleset = load_json(path)
        name = ruleset.get("name")
        if name != expected_name:
            raise SystemExit(
                f"[ERROR] {filename}: expected ruleset name '{expected_name}', found '{name}'"
            )

        if ruleset.get("target") != "branch":
            raise SystemExit(
                f"[ERROR] {filename}: ruleset target must be 'branch', "
                f"found '{ruleset.get('target')}'"
            )
        if ruleset.get("enforcement") != "active":
            raise SystemExit(
                f"[ERROR] {filename}: enforcement must be 'active', "
                f"found '{ruleset.get('enforcement')}'"
            )

        include = (
            ruleset.get("conditions", {})
            .get("ref_name", {})
            .get("include", [])
        )
        if not isinstance(include, list) or len(include) != 1:
            raise SystemExit(
                f"[ERROR] {filename}: conditions.ref_name.include must contain exactly one pattern"
            )

    main_include = (
        load_json(RULESETS_DIR / "protect-main.json")
        .get("conditions", {})
        .get("ref_name", {})
        .get("include", [])
    )
    dev_include = (
        load_json(RULESETS_DIR / "protect-dev.json")
        .get("conditions", {})
        .get("ref_name", {})
        .get("include", [])
    )
    feature_include = (
        load_json(RULESETS_DIR / "protect-feature-branches.json")
        .get("conditions", {})
        .get("ref_name", {})
        .get("include", [])
    )

    if main_include != ["~DEFAULT_BRANCH"]:
        raise SystemExit(
            "[ERROR] protect-main.json: include pattern must be ['~DEFAULT_BRANCH']"
        )
    if dev_include != ["dev"]:
        raise SystemExit("[ERROR] protect-dev.json: include pattern must be ['dev']")
    if feature_include != ["feature/*"]:
        raise SystemExit(
            "[ERROR] protect-feature-branches.json: include pattern must be "
            "['feature/*']"
        )


def main():
    assert_rulesets_present_and_targeted()

    # Check required deploy workflows
    for wf_name, cfg in REQUIRED_WORKFLOWS.items():
        path = WF_DIR / wf_name
        if not path.exists():
            raise SystemExit(f"[ERROR] Missing workflow: {wf_name}")

        wf = load_yaml(path)
        assert_branch_trigger(wf_name, wf, cfg["branch"])
        assert_environment(wf_name, wf, cfg["environment"])
        assert_permissions(wf_name, wf)
        assert_python_setup(wf_name, wf)
        assert_quality_gates(wf_name, wf)
        assert_deploy_guard(wf_name, wf)

    # Global forbidden references
    assert_no_copilot_env()
    assert_no_forbidden_authors()
    assert_no_forbidden_workflow_references()
    assert_forbidden_main_push_for_non_prod()
    assert_contributor_workflow_branch_restrictions()

    print("[OK] Governance policy checks passed.")


if __name__ == "__main__":
    main()
