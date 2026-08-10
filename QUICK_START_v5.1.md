# 🚀 FRASBERG CORE v5.1.0 - QUICK START GUIDE

**Version**: v5.1.0  
**Phase**: Month 1 Foundation Complete  
**Time to Setup**: 15-30 minutes

---

## ⚡ One-Command Execution

```bash
# Execute entire Month 1 setup
./execute-month-1-now.sh
```

**Or execute phases individually:**

```bash
# Week 1-2: Real Integrations
./execute-week-1-2.sh

# Week 3: Research Paper
./week-3-research-paper.sh

# Week 4: Community Launch
./week-4-community.sh
```

---

## 🎯 Immediate Actions (Pick Your Path)

### Path A: Developer (Want to Use Frasberg AI)

```bash
# 1. Install dependencies
pip install -r backend/requirements-v5.1.txt

# 2. Configure
cp backend/.env.example backend/.env
# Add your API keys to .env

# 3. Start services
docker run -d --name frasberg-postgres \
  -e POSTGRES_USER=frasberg -e POSTGRES_PASSWORD=frasberg \
  -e POSTGRES_DB=frasberg_ai -p 5432:5432 postgres:15

docker run -d --name frasberg-redis \
  -p 6379:6379 redis:7-alpine

# 4. Initialize
cd backend && python init_db.py

# 5. Test
python test_integrations.py

# 6. Run
python server.py
```

**Access**: http://localhost:8000

---

### Path B: Contributor (Want to Help Build)

```bash
# 1. Fork on GitHub
# https://github.com/FrasbergAI/frasberg

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/frasberg
cd frasberg

# 3. Install
pip install -r backend/requirements.txt
pip install -r requirements-test.txt

# 4. Find an issue
# https://github.com/FrasbergAI/frasberg/labels/good-first-issue

# 5. Create branch
git checkout -b feature/your-feature

# 6. Make changes, test, commit, push, PR!
./run_tests.sh
```

**Read**: [CONTRIBUTING-ENHANCED.md](CONTRIBUTING-ENHANCED.md)

---

### Path C: Researcher (Want to Cite/Extend)

```bash
# 1. Read the paper
cat research/papers/dna-computing/paper.md

# 2. Try the system
./execute-week-1-2.sh

# 3. Run experiments
cd backend && python server.py
# Use API to test claims

# 4. Cite or collaborate
# See: research/papers/README.md
```

**Paper**: [research/papers/dna-computing/paper.md](research/papers/dna-computing/paper.md)

---

### Path D: Community Builder (Want to Help Grow)

```bash
# 1. Join/create Discord
cat community/DISCORD_SETUP.md

# 2. Share Frasberg AI
cat community/launch-announcement.md

# 3. Create good first issues
cat community/good-first-issues.txt
# Use GitHub to create issues

# 4. Help newcomers
# Answer questions, review PRs, welcome new members
```

**Discord Guide**: [community/DISCORD_SETUP.md](community/DISCORD_SETUP.md)

---

## 📦 What You Get

### Integrations
- ✅ OpenAI GPT-4
- ✅ Anthropic Claude
- ✅ PostgreSQL
- ✅ Redis
- ✅ JWT Auth

### Features
- 🧠 Memory management
- 🔐 Authentication
- 💾 Caching
- 📊 Monitoring ready
- 🌐 REST API

### Documentation
- 📘 Contributing guide
- 📄 Research paper
- 🏗️ Architecture docs
- 🤝 Community guides

---

## 🆘 Common Issues

### "Module not found"
```bash
pip install -r backend/requirements-v5.1.txt
```

### "Cannot connect to database"
```bash
# Check DATABASE_URL in .env
# Or use SQLite: set USE_SQLITE=true in .env
```

### "Redis connection failed"
```bash
# Redis is optional, system will work without it
# Or install: docker run -d --name frasberg-redis -p 6379:6379 redis:7-alpine
```

### "No API key"
```bash
# Get keys:
# OpenAI: https://platform.openai.com/api-keys
# Anthropic: https://console.anthropic.com/
# Add to backend/.env
```

---

## 📊 File Structure (Key Files)

```
frasberg/
├── execute-month-1-now.sh          # 👈 START HERE
├── MONTH_1_COMPLETE.md             # 👈 READ THIS
├── CONTRIBUTING-ENHANCED.md        # 👈 CONTRIBUTORS READ
│
├── backend/
│   ├── server.py                   # Main server
│   ├── requirements-v5.1.txt       # Dependencies
│   ├── .env.example                # Configuration template
│   ├── init_db.py                  # Database setup
│   ├── test_integrations.py        # Test script
│   └── app/
│       ├── integrations/llm/       # OpenAI, Anthropic
│       ├── database/               # SQLAlchemy models
│       ├── cache/                  # Redis client
│       └── auth/                   # JWT auth
│
├── research/papers/dna-computing/
│   ├── paper.md                    # 👈 RESEARCHERS READ
│   └── submit.sh                   # Submission helper
│
└── community/
    ├── DISCORD_SETUP.md            # 👈 COMMUNITY READ
    ├── good-first-issues.txt       # Issue ideas
    └── launch-announcement.md      # Announcement template
```

---

## 🎓 Learn More

| Topic | Resource |
|-------|----------|
| **Overview** | [README.md](README.md) |
| **Month 1 Summary** | [MONTH_1_COMPLETE.md](MONTH_1_COMPLETE.md) |
| **How to Contribute** | [CONTRIBUTING-ENHANCED.md](CONTRIBUTING-ENHANCED.md) |
| **Research Paper** | [research/papers/dna-computing/paper.md](research/papers/dna-computing/paper.md) |
| **Discord Setup** | [community/DISCORD_SETUP.md](community/DISCORD_SETUP.md) |
| **API Documentation** | [docs/API.md](docs/API.md) (if exists) |

---

## 💰 Bounty Program

Earn money for contributions!

| Type | Amount | Examples |
|------|--------|----------|
| Critical Bug | $100-$500 | Security issues, data loss |
| Major Feature | $500-$2000 | New capabilities |
| Research | $1000-$5000 | Published papers |
| Integration | $200-$1000 | AWS/Azure/GCP integrations |

**Contact**: bounties@frasberg-ai.ai

---

## 📞 Get Help

- **Documentation**: Start with [MONTH_1_COMPLETE.md](MONTH_1_COMPLETE.md)
- **GitHub Issues**: https://github.com/FrasbergAI/frasberg/issues
- **Email**: hello@frasberg-ai.ai
- **Discord**: Coming soon (see community/DISCORD_SETUP.md)

---

## ✅ Quick Checklist

**For Developers:**
- [ ] Run `./execute-month-1-now.sh`
- [ ] Install dependencies
- [ ] Configure `.env`
- [ ] Start services (PostgreSQL, Redis)
- [ ] Initialize database
- [ ] Test integrations
- [ ] Start server

**For Contributors:**
- [ ] Read CONTRIBUTING-ENHANCED.md
- [ ] Fork repository
- [ ] Find good first issue
- [ ] Make changes
- [ ] Submit PR

**For Community:**
- [ ] Read community/DISCORD_SETUP.md
- [ ] Create Discord server
- [ ] Create good first issues
- [ ] Share announcement

**For Researchers:**
- [ ] Read research paper
- [ ] Test claims
- [ ] Submit to arXiv
- [ ] Cite or collaborate

---

## 🎉 You're Ready!

Pick your path above and start building with Frasberg AI v5.1.0!

**Questions?** See [MONTH_1_COMPLETE.md](MONTH_1_COMPLETE.md) for full details.

---

**Last Updated**: February 2026  
**Version**: v5.1.0  
**Status**: Production Ready ✅
