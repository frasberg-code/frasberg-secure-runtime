# Contributing to Frasberg AI 🚀

Welcome! We're building the future of AI together.

## 🌟 Quick Start

1. **Fork** the repository
2. **Clone**: `git clone https://github.com/YOUR_USERNAME/frasberg`
3. **Branch**: `git checkout -b feature/amazing-feature`
4. **Commit**: `git commit -m "Add amazing feature"`
5. **Push**: `git push origin feature/amazing-feature`
6. **PR**: Open a Pull Request

## 💬 Community

- **Discord**: https://discord.gg/frasberg-ai
- **GitHub Discussions**: For long-form conversations  
- **Twitter**: @frasberg_ai_ai
- **Email**: hello@frasberg-ai.ai

## 🎯 Ways to Contribute

### 1. Code Contributions
- Fix bugs
- Add features
- Improve performance
- Write tests

### 2. Documentation
- Fix typos
- Add examples
- Write tutorials
- Translate docs

### 3. Community Support
- Answer questions on Discord
- Review pull requests
- Share your projects
- Write blog posts

### 4. Research
- Use Frasberg in research
- Share benchmarks
- Propose algorithms
- Write papers

## 🟢 Good First Issues

New to the project? Look for `good-first-issue` labels:

- 🟢 **Easy** (1-2 hours): Perfect for beginners
- 🟡 **Medium** (half day): Some experience needed
- 🔴 **Hard** (multiple days): Significant expertise

[View Good First Issues →](https://github.com/FrasbergAI/frasberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

## 📝 Pull Request Guidelines

### Before Submitting

- ✅ Tests pass locally: `./run_tests.sh`
- ✅ Code follows style guide (PEP 8)
- ✅ Documentation updated
- ✅ Commit messages are clear

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings
```

## 🎨 Code Style

**Python:**
- Style: PEP 8
- Type Hints: Required
- Max Line Length: 120 characters
- Docstrings: Google style

```python
def example_function(param: str, count: int = 10) -> dict:
    """Brief description.
    
    Args:
        param: Description
        count: Description
        
    Returns:
        Description of return value
    """
    return {"result": f"{param}_{count}"}
```

## 🧪 Testing

**Run Tests:**
```bash
# All tests
./run_tests.sh

# Specific test
pytest tests/unit/v5_1/test_llm_integration.py -v

# With coverage
pytest --cov=backend/app tests/
```

**Writing Tests:**
- Test files: `test_*.py`
- Clear names: `test_should_return_health_status()`
- Use fixtures for common setup

## 💰 Bounty Program

We reward significant contributions!

| Type | Reward |
|------|--------|
| Critical bug fix | $100-$500 |
| Major feature | $500-$2,000 |
| Research paper | $1,000-$5,000 |

Email bounties@frasberg-ai.ai for details.

## 🏆 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Monthly Discord spotlight
- Annual awards

## 📚 Development Setup

**Prerequisites:**
- Python 3.11+
- Docker & Docker Compose
- Git
- Node.js 18+ (for frontend)

**Local Setup:**
```bash
# Install dependencies
pip install -r backend/requirements-v5.1.txt
pip install -r requirements-test.txt

# Install pre-commit hooks
pre-commit install

# Start services
./quick-start.sh

# Verify
curl http://localhost:8000/health
```

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation harassment-free for everyone.

### Our Standards

**Positive behavior:**
- Welcoming and inclusive language
- Respectful of differing viewpoints
- Accepting constructive criticism
- Focusing on community best interests

**Unacceptable:**
- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

### Enforcement

Report violations to conduct@frasberg-ai.ai.

## 📞 Getting Help

- **Discord #help**: Real-time support
- **GitHub Discussions**: Longer conversations
- **Stack Overflow**: Tag with `frasberg-ai`

## 📄 License

By contributing, you agree contributions will be licensed under MIT License.

---

**Thank you for contributing to Frasberg AI!** 🙏

Every contribution helps build the future of AI. Let's build something amazing together! ✨
