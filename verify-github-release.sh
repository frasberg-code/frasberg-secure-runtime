#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  VERIFYING FRASBERG CORE v1.0.0 GITHUB RELEASE"
echo "════════════════════════════════════════════════"
echo ""

REPO="emeraldorbit/frasberg-backend"
TAG="v1.0.0"

echo "Step 1: Checking if tag exists on GitHub..."
if gh release view $TAG --repo $REPO &>/dev/null; then
    echo "✅ Release v1.0.0 exists on GitHub"
else
    echo "❌ Release not found - may still be processing"
    exit 1
fi

echo ""
echo "Step 2: Fetching release details..."
gh release view $TAG --repo $REPO

echo ""
echo "Step 3: Listing release assets..."
gh release view $TAG --repo $REPO --json assets --jq '.assets[] | "\(.name) (\(.size) bytes) - Downloads: \(.downloadCount)"'

echo ""
echo "Step 4: Getting download URLs..."
echo "ZIP URL:"
gh release view $TAG --repo $REPO --json assets --jq '.assets[] | select(.name | endswith(".zip")) | .url'

echo ""
echo "SHA256 URL:"
gh release view $TAG --repo $REPO --json assets --jq '.assets[] | select(.name | endswith(".sha256")) | .url'

echo ""
echo "Step 5: Verifying release is public..."
VISIBILITY=$(gh release view $TAG --repo $REPO --json isDraft,isPrerelease --jq 'if .isDraft then "DRAFT" elif .isPrerelease then "PRERELEASE" else "PUBLIC" end')
echo "Release visibility: $VISIBILITY"

if [ "$VISIBILITY" = "PUBLIC" ]; then
    echo "✅ Release is publicly accessible"
else
    echo "⚠️  Release is $VISIBILITY"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ GITHUB RELEASE VERIFICATION COMPLETE"
echo "════════════════════════════════════════════════"
echo ""
echo "Public URL: https://github.com/$REPO/releases/tag/$TAG"
echo ""
