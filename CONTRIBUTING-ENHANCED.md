# Contributing to Frasberg 🚀

Welcome to Frasberg! We're building the future of distributed AI systems together, and we're thrilled you're here.

## Quick Links

- 💬 **[Discord Community](https://discord.gg/frasberg-ai)** - Join the conversation
- 🐛 **[Report a Bug](https://github.com/FrasbergAI/frasberg/issues/new?template=bug_report.md)**
- ✨ **[Request a Feature](https://github.com/FrasbergAI/frasberg/issues/new?template=feature_request.md)**
- 📖 **[Documentation](https://github.com/FrasbergAI/frasberg/blob/main/README.md)**
- 🎯 **[Good First Issues](https://github.com/FrasbergAI/frasberg/labels/good-first-issue)**

---

## Ways to Contribute

### 1. 💻 Code Contributions
- Fix bugs and issues
- Add new features
- Improve performance
- Write tests
- Refactor code

### 2. 📝 Documentation
- Fix typos and clarify docs
- Add code examples
- Write tutorials
- Translate documentation
- Create diagrams

### 3. 🤝 Community Support
- Answer questions on Discord
- Help other contributors
- Review pull requests
- Share your projects
- Write blog posts

### 4. 🔬 Research
- Publish papers using Frasberg
- Share benchmarks
- Propose new algorithms
- Conduct experiments

### 5. 🎨 Design & UX
- Improve CLI interface
- Design SDK examples
- Create visualization tools
- Enhance error messages

---

## Getting Started (5 Minutes)

### Prerequisites
- Python 3.9+ or Node.js 18+
- Git
- Basic terminal/command line knowledge

### Setup

```bash
# 1. Fork the repository on GitHub
# Click "Fork" at https://github.com/FrasbergAI/frasberg

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/frasberg
cd frasberg

# 3. Install dependencies
pip install -r backend/requirements.txt
pip install -r requirements-test.txt

# 4. Run tests to verify setup
./run_tests.sh

# 5. Create a branch for your changes
git checkout -b feature/your-feature-name
```

### Make Your Changes

```bash
# Edit files...
# Add tests for your changes...

# Run tests
./run_tests.sh

# Commit your changes
git add .
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Submit Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Fill out the template
4. Wait for review (we'll respond within 48 hours!)

---

## 🟢 Good First Issues

New to the project? Look for issues labeled **[good-first-issue](https://github.com/FrasbergAI/frasberg/labels/good-first-issue)**:

- **🟢 Easy**: 1-2 hours, clear scope, great for first-timers
- **🟡 Medium**: Half day, some complexity, requires understanding of system
- **🔴 Hard**: Multiple days, significant design decisions

### Example Good First Issues

1. **Add test coverage** - Write unit tests for existing features
2. **Documentation improvements** - Add examples, fix typos, clarify explanations
3. **Error message improvements** - Make errors more helpful and actionable
4. **Add CLI commands** - Extend the frasberg-cli tool with new commands
5. **Performance benchmarks** - Create benchmarks for various features

---

## Development Guidelines

### Code Style

**Python:**
- Follow PEP 8
- Use type hints (`def function(arg: str) -> int:`)
- Max line length: 120 characters
- Use meaningful variable names
- Add docstrings to functions and classes

```python
def calculate_importance(memory: Memory, context: dict) -> float:
    """Calculate importance score for a memory
    
    Args:
        memory: Memory object to evaluate
        context: Current context dictionary
    
    Returns:
        Importance score between 0.0 and 1.0
    """
    # Implementation...
```

**JavaScript/TypeScript:**
- ESLint + Prettier
- Use TypeScript for type safety
- Max line length: 120 characters
- Prefer `const` over `let`

### Testing

- **Write tests for all new code**
- Maintain 70%+ code coverage
- Run `./run_tests.sh` before submitting PR
- Include both unit and integration tests

```python
def test_memory_storage():
    """Test memory can be stored and retrieved"""
    memory = Memory(content="Test memory", importance=0.8)
    saved = store_memory(memory)
    retrieved = get_memory(saved.id)
    assert retrieved.content == "Test memory"
    assert retrieved.importance == 0.8
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add DNA computing endpoint
fix: resolve memory leak in mesh network
docs: update API reference for v5
test: add swarm intelligence tests
refactor: simplify quantum interface
perf: optimize cache lookups
chore: update dependencies
```

### Pull Request Process

1. **Create PR with descriptive title**
   - ✅ "feat: add parallel DNA search algorithm"
   - ❌ "Updates"

2. **Fill out PR template completely**
   - Description of changes
   - Related issues
   - Testing performed
   - Breaking changes

3. **Ensure CI passes**
   - All tests passing
   - Linting clean
   - Code coverage maintained

4. **Respond to feedback within 48 hours**
   - Address review comments
   - Explain design decisions
   - Make requested changes

5. **Squash commits before merge**
   - Keep history clean
   - One commit per PR (usually)

---

## 💰 Bounty Program

We offer bounties for significant contributions!

### Bounty Tiers

| Type | Bounty | Requirements |
|------|--------|--------------|
| **Critical Bug Fix** | $100-$500 | Security issue, data loss, system crash |
| **Major Feature** | $500-$2000 | New capability, significant enhancement |
| **Research Contribution** | $1000-$5000 | Published paper, novel algorithm |
| **Integration** | $200-$1000 | New platform integration (AWS, Azure, GCP) |
| **Documentation** | $50-$500 | Comprehensive guides, video tutorials |

### How to Claim Bounty

1. Check if issue has `bounty` label
2. Comment expressing interest
3. Get assigned to issue
4. Submit PR with solution
5. After merge, contact: bounties@frasberg.com

*Bounties paid via GitHub Sponsors, PayPal, or cryptocurrency*

---

## Recognition

Contributors are recognized in multiple ways:

### 🏆 CONTRIBUTORS.md
All contributors listed in [CONTRIBUTORS.md](CONTRIBUTORS.md) with:
- Name/Handle
- Contributions summary
- Links to PRs

### 📢 Release Notes
Significant contributions highlighted in release notes:
```markdown
## v5.1.0 - Real Integrations

Thanks to @awesome-contributor for:
- OpenAI integration (#123)
- PostgreSQL models (#124)
```

### ⭐ Monthly Spotlight
Featured on Discord each month:
- Contributor of the Month
- Most Helpful Reviewer
- Best Documentation

### 🎖️ Annual Awards
End-of-year recognition:
- MVP Contributor
- Best New Feature
- Most Impactful Bug Fix
- Community Champion

---

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. See our [Code of Conduct](CODE_OF_CONDUCT.md).

**In brief:**
- **Be kind and respectful** - Treat everyone with dignity
- **Be inclusive** - Welcome people of all backgrounds
- **Be patient** - Help newcomers learn
- **Be constructive** - Provide helpful feedback
- **Be professional** - Keep interactions professional

### Reporting Issues

If you experience harassment or violations, contact:
- Email: conduct@frasberg.com
- All reports confidential

---

## Project Structure

Understanding the codebase:

```
frasberg/
├── backend/              # Python backend (FastAPI)
│   ├── app/              # Application code
│   │   ├── v5/           # v5 API endpoints
│   │   ├── database/     # Database models
│   │   ├── cache/        # Redis caching
│   │   ├── auth/         # Authentication
│   │   └── integrations/ # LLM integrations
│   ├── requirements.txt  # Python dependencies
│   └── server.py         # Main server
├── cli/                  # Command-line interface
├── sdk/                  # SDKs (Python, Node, etc.)
├── tests/                # Test suites
├── docs/                 # Documentation
└── research/             # Research papers
```

### Key Files
- `backend/server.py` - Main API server
- `backend/app/v5/` - v5.0 endpoints
- `cli/frasberg/` - CLI commands
- `tests/` - Test files

---

## FAQ

### Q: I'm new to open source. Where should I start?
A: Start with **[good-first-issue](https://github.com/FrasbergAI/frasberg/labels/good-first-issue)** labels! These are specifically chosen to be beginner-friendly.

### Q: How long does PR review take?
A: We aim to provide initial feedback within 48 hours. Complete review may take 3-7 days depending on complexity.

### Q: Can I work on an issue that's assigned to someone?
A: If there's been no activity for 7+ days, comment asking if you can take over.

### Q: My PR was rejected. What now?
A: Don't be discouraged! Review feedback, make improvements, and resubmit. All contributors started somewhere.

### Q: Can I contribute if I'm not a developer?
A: Absolutely! Documentation, design, community support, and research are all valuable contributions.

### Q: How do I get help?
A: Ask in Discord `#contributors` channel or comment on the GitHub issue. We're here to help!

### Q: Can I use Frasberg in my commercial product?
A: Yes! It's MIT licensed - use freely in commercial projects.

---

## Resources

### Learning Materials
- [Python Tutorial](https://docs.python.org/3/tutorial/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Git Guide](https://github.com/git-guides)
- [Open Source Guide](https://opensource.guide/)

### Frasberg Specific
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Development Setup](docs/DEVELOPMENT.md)

---

## Contact

- 💬 **Discord**: https://discord.gg/frasbergai
- 📧 **Email**: hello@frasberg.com
- 🐦 **Twitter**: [@frasbergai] (https://twitter.com/frasbergai)
- 💼 **LinkedIn**: [Frasberg](https://linkedin.com/company/frasberg)

---

## Thank You! 🙏

Every contribution, no matter how small, makes Frasberg better. We appreciate your time and effort in helping build the future of distributed AI systems.

**Together, we're building something amazing.** ✨

---

*Last updated: February 2026*
*For questions about this guide: docs@frasberg.com*
