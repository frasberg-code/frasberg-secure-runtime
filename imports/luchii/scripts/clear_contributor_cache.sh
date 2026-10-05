#!/usr/bin/env bash
set -euo pipefail

echo "Refreshing contributor cache metadata..."

git fetch --all --prune --tags

echo "Contributor summary"
git log --all --pretty=format:"%an" | sort | uniq -c | sort -nr

echo "Contributor cache refresh complete."
