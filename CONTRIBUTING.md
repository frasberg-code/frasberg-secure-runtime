# Contributing to Frasberg

Thank you for your interest in contributing to Frasberg v4.0.1!

## Development Setup

### Prerequisites
- Docker 20.10+
- Python 3.11+
- Git

### Quick Setup

```bash
# Clone repository
git clone https://github.com/FrasbergAI/frasberg.git
cd frasberg

# Install dependencies
pip install -r backend/requirements.txt
pip install -r requirements-test.txt

# Start development server
./quick-start.sh
Development Workflow
1. Create a Branch
bash

git checkout -b feature/your-feature-name
2. Make Changes
Follow code style guidelines
Add tests for new functionality
Update documentation
3. Run Tests
bash

./run_tests.sh
4. Commit Changes
bash

git add .
git commit -m "feat: description of your feature"
5. Push and Create PR
bash

git push origin feature/your-feature-name
Then create a Pull Request on GitHub.

Code Style
Python
Follow PEP 8
Use type hints
Maximum line length: 120 characters
Descriptive variable names
Example:
Python

from typing import List, Dict, Any

def process_data(items: List[Dict[str, Any]]) -> Dict[str, int]:
    """Process data items and return summary.
    
    Args:
        items: List of data items to process
        
    Returns:
        Dictionary with processing summary
    """
    result = {"processed": len(items)}
    return result
Testing
Unit Tests: pytest tests/unit/
Coverage Target: >70% for all new code
Test Utilities: ./run_tests.sh
Documentation
Update API docs for new endpoints
Add docstrings to all functions
Update README for new features
Pull Request Guidelines
PR Title Format:

feat: - New feature
fix: - Bug fix
docs: - Documentation
test: - Tests
PR Description:
Include:

What: What does this PR do?
Why: Why is this change needed?
How: How does it work?
Testing: How was it tested?
Code Review
All tests must pass
Coverage >70% maintained
Linting checks pass
Maintainer approval required
Thank you for contributing! 🎉
