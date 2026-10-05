#!/bin/bash

# Rewrite Copilot commits to Frasberg Selassie
# This script rewrites all commits authored by copilot-swe-agent[bot] 
# to be authored by Frasberg Selassie instead.

# Safety check: require --force flag to execute without dry-run
if [[ "$1" != "--force" ]]; then
    echo "Usage: $0 [--dry-run|--force]"
    echo ""
    echo "Default (no args): Run in dry-run mode (safe, shows what would change)"
    echo "--dry-run:         Explicitly run in dry-run mode"
    echo "--force:           Execute the rewrite (WARNING: modifies history)"
    echo ""
    echo "Running in DRY-RUN mode..."
    DRY_RUN=1
else
    DRY_RUN=0
fi

# Configuration
OLD_NAME="copilot-swe-agent[bot]"
OLD_EMAIL="198982749+Copilot@users.noreply.github.com"
NEW_NAME="Frasberg Selassie"
NEW_EMAIL="frasberg@frasberg.ai"

# Count commits to be rewritten
COMMIT_COUNT=$(git log --all --oneline --author="$OLD_NAME" | wc -l)
echo "Found $COMMIT_COUNT commits to rewrite"
echo "  From: $OLD_NAME <$OLD_EMAIL>"
echo "  To:   $NEW_NAME <$NEW_EMAIL>"
echo ""

if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY-RUN] Showing what would be changed:"
    echo ""
    git log --all --pretty=format:"%h %an %ae %s" --author="$OLD_NAME" | head -10
    echo "... (showing first 10 of $COMMIT_COUNT)"
    echo ""
    echo "To execute the rewrite, run: $0 --force"
    exit 0
fi

# Execute the rewrite
echo "[EXECUTING] Rewriting commit history..."
export GIT_COMMITTER_NAME="$NEW_NAME"
export GIT_COMMITTER_EMAIL="$NEW_EMAIL"

git filter-branch --env-filter '
    if [ "$GIT_COMMITTER_NAME" = "'"$OLD_NAME"'" ]; then
        export GIT_COMMITTER_NAME="'"$NEW_NAME"'"
        export GIT_COMMITTER_EMAIL="'"$NEW_EMAIL"'"
    fi
    if [ "$GIT_AUTHOR_NAME" = "'"$OLD_NAME"'" ]; then
        export GIT_AUTHOR_NAME="'"$NEW_NAME"'"
        export GIT_AUTHOR_EMAIL="'"$NEW_EMAIL"'"
    fi
' -f -- --all

echo ""
echo "✅ Rewrite complete!"
echo ""
echo "Verifying new history:"
git log --all --pretty=format:"%h %an %s" --author="$NEW_NAME" | head -10
echo ""
echo "Next steps:"
echo "1. Review the history: git log --all --oneline"
echo "2. Force-push to all branches: git push --force --all"
echo "3. Force-push tags: git push --force --tags"
