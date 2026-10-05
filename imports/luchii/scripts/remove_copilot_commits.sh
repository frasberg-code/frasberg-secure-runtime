#!/usr/bin/env bash
set -euo pipefail

# Rewrites only known Copilot-authored commits to a human author identity.
# Usage:
#   scripts/remove_copilot_commits.sh --force
# Optional env vars:
#   NEW_NAME="FrasbergAI"
#   NEW_EMAIL="engineering@frasberg.ai"
#   BRANCH_SCOPE="--all"  # default: current branch only

NEW_NAME="${NEW_NAME:-FrasbergAI}"
NEW_EMAIL="${NEW_EMAIL:-engineering@frasberg.ai}"
BRANCH_SCOPE="${BRANCH_SCOPE:---current}"

if [[ "${1:-}" != "--force" ]]; then
  echo "Usage: $0 --force"
  echo "This command rewrites git history. Re-run with --force to continue."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[ERROR] Must be run inside a git repository"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[ERROR] Working tree must be clean before rewriting history"
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
backup_branch="backup/${current_branch}/$(date +%Y%m%d-%H%M%S)"
git branch "${backup_branch}"

echo "[INFO] Backup branch created: ${backup_branch}"
echo "[INFO] Rewriting Copilot-authored commits to ${NEW_NAME} <${NEW_EMAIL}>"

# Scope selection for rev-list/log iteration.
if [[ "${BRANCH_SCOPE}" == "--all" ]]; then
  revision_range="--all"
else
  revision_range="HEAD"
fi

copilot_count="$(git log ${revision_range} --pretty=format:%H --author='Copilot|copilot-swe-agent\[bot\]|GitHub Copilot' --extended-regexp | wc -l | tr -d ' ')"
if [[ "${copilot_count}" == "0" ]]; then
  echo "[INFO] No Copilot-authored commits found in selected scope."
  exit 0
fi

echo "[INFO] Found ${copilot_count} Copilot-authored commits"

git filter-branch -f --env-filter '
case "$GIT_AUTHOR_NAME|$GIT_AUTHOR_EMAIL" in
  *Copilot*|*copilot-swe-agent[bot]*|*198982749+Copilot@users.noreply.github.com*)
    GIT_AUTHOR_NAME="'"${NEW_NAME}"'"
    GIT_AUTHOR_EMAIL="'"${NEW_EMAIL}"'"
    ;;
esac
case "$GIT_COMMITTER_NAME|$GIT_COMMITTER_EMAIL" in
  *Copilot*|*copilot-swe-agent[bot]*|*198982749+Copilot@users.noreply.github.com*)
    GIT_COMMITTER_NAME="'"${NEW_NAME}"'"
    GIT_COMMITTER_EMAIL="'"${NEW_EMAIL}"'"
    ;;
esac
export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
' ${revision_range}

echo "[OK] Rewrite complete"
echo "[NEXT] Push with: git push --force-with-lease"
if [[ "${BRANCH_SCOPE}" == "--all" ]]; then
  echo "[NEXT] If needed for all branches/tags:"
  echo "       git push --force --all"
  echo "       git push --force --tags"
fi
