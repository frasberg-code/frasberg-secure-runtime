#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  Running Frasberg AI v4.0.1 Test Suite"
echo "════════════════════════════════════════════════"
echo ""

# Check if in correct directory
if [ ! -f "pytest.ini" ]; then
    echo "Error: Must run from project root"
    exit 1
fi

# Install test dependencies
echo "Installing test dependencies..."
pip install -q -r requirements-test.txt

echo ""
echo "Running tests with coverage..."
echo ""

# Run tests with coverage
pytest tests/ \
    --cov=backend/app \
    --cov-report=html \
    --cov-report=term-missing \
    --cov-report=json \
    -v

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
fi

echo ""
echo "Coverage reports generated:"
echo "  • HTML: htmlcov/index.html"
echo "  • JSON: coverage.json"
echo ""

exit $EXIT_CODE
