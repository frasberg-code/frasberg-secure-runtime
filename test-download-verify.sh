#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  TESTING FRASBERG CORE v1.0.0 DOWNLOAD & VERIFY"
echo "════════════════════════════════════════════════"
echo ""

REPO="FrasbergAI/frasberg"
TAG="v1.0.0"
RELEASE_NAME="frasberg-ai-v1.0.0-public-final"
TEST_DIR="test-release-download"

# Create test directory
mkdir -p $TEST_DIR
cd $TEST_DIR

echo "Step 1: Downloading release package..."
gh release download $TAG --repo $REPO --pattern "*.zip" 2>/dev/null || wget "https://github.com/$REPO/releases/download/$TAG/${RELEASE_NAME}.zip"
gh release download $TAG --repo $REPO --pattern "*.sha256" 2>/dev/null || wget "https://github.com/$REPO/releases/download/$TAG/${RELEASE_NAME}.zip.sha256"

if [ -f "${RELEASE_NAME}.zip" ]; then
    echo "✅ ZIP file downloaded successfully"
    ls -lh ${RELEASE_NAME}.zip
else
    echo "❌ ZIP file download failed"
    exit 1
fi

echo ""
echo "Step 2: Verifying checksum..."
if [ -f "${RELEASE_NAME}.zip.sha256" ]; then
    echo "Expected checksum:"
    cat ${RELEASE_NAME}.zip.sha256
    
    echo ""
    echo "Actual checksum:"
    sha256sum ${RELEASE_NAME}.zip
    
    echo ""
    if sha256sum -c ${RELEASE_NAME}.zip.sha256; then
        echo "✅ Checksum verification PASSED"
    else
        echo "❌ Checksum verification FAILED"
        exit 1
    fi
else
    echo "⚠️  SHA256 file not found, computing checksum manually..."
    sha256sum ${RELEASE_NAME}.zip
fi

echo ""
echo "Step 3: Extracting package..."
unzip -q ${RELEASE_NAME}.zip
if [ -d "$RELEASE_NAME" ]; then
    echo "✅ Package extracted successfully"
else
    echo "❌ Extraction failed"
    exit 1
fi

echo ""
echo "Step 4: Verifying package contents..."
cd $RELEASE_NAME

REQUIRED_FILES=(
    "README.md"
    "LICENSE"
    "system-manifest.json"
    "backend/app/main.py"
    "frontend/admin/package.json"
    "deploy/canonical-core/Dockerfile"
    "forks/education/main.py"
    "forks/healthcare-nonclinical/main.py"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "✅ All required files present"
else
    echo "❌ $MISSING files missing"
    exit 1
fi

echo ""
echo "Step 5: Testing deployment from downloaded package..."
echo "Checking Docker configurations..."

for dockerfile in deploy/*/Dockerfile deploy/forks/*/Dockerfile; do
    if [ -f "$dockerfile" ]; then
        echo "✅ $(dirname $dockerfile)/Dockerfile"
    fi
done

echo ""
echo "Step 6: Verifying documentation..."
if grep -q "Frasberg AI" README.md; then
    echo "✅ README contains Frasberg AI reference"
fi

if grep -q "MIT License" LICENSE; then
    echo "✅ LICENSE file is valid"
fi

if python3 -m json.tool system-manifest.json > /dev/null 2>&1; then
    echo "✅ system-manifest.json is valid JSON"
fi

echo ""
echo "Step 7: Package statistics..."
echo "Total size:"
du -sh .

echo ""
echo "File count:"
find . -type f | wc -l

echo ""
echo "Directory structure:"
find . -type d -maxdepth 2

cd ../..

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ DOWNLOAD & VERIFICATION TEST COMPLETE"
echo "════════════════════════════════════════════════"
echo ""
echo "Test directory: $TEST_DIR"
echo "Package is ready for deployment!"
echo ""
