# Local Development Quick Reference

## 🚀 Quick Start (5 minutes)

### Backend
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1              # Windows
# or: source .venv/bin/activate          # macOS/Linux
pip install -r requirements.txt
python server.py                           # http://localhost:8080
```

### UI (new terminal)
```bash
cd ui
npm install
npm run dev:judge                          # http://localhost:5173
npm run dev:lawyer                         # http://localhost:5174
npm run dev:clerk                          # http://localhost:5175
```

## 📁 Files & Directories

| File | Purpose |
|------|---------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Complete development setup guide |
| [.env.local.example](./.env.local.example) | Environment template (copy to .env.local) |
| [docker-compose.local.yml](./docker-compose.local.yml) | Docker stack for local development |
| [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | Setup scripts & IDE configuration |
| [docs/ENVIRONMENT_CONFIG.md](./docs/ENVIRONMENT_CONFIG.md) | Environment variables reference |
| [.github/workflows/local-dev-test.yml](./.github/workflows/local-dev-test.yml) | CI/CD testing pipeline |

## 🔧 Services & Ports

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8080 | Core API server |
| Judge Dashboard | http://localhost:5173 | Judge UI |
| Lawyer Dashboard | http://localhost:5174 | Lawyer UI |
| Clerk Dashboard | http://localhost:5175 | Clerk UI |
| API Docs | http://localhost:8080/docs | Swagger UI documentation |
| API ReDoc | http://localhost:8080/redoc | ReDoc documentation |
| PostgreSQL | localhost:5432 | Database (Docker) |
| Redis | localhost:6379 | Cache (Docker) |

## 🐳 Docker Compose

Start everything:
```bash
docker-compose -f docker-compose.local.yml up --build
```

Stop everything:
```bash
docker-compose -f docker-compose.local.yml down
```

Reset database:
```bash
docker-compose -f docker-compose.local.yml down -v
```

## 🧪 Testing

### Backend Tests
```bash
pytest                                    # Run all tests
pytest tests/test_api.py                  # Specific test file
pytest --cov=src tests/                   # With coverage
```

### UI Tests
```bash
cd ui
npm run test                              # Run all tests
npm run test -- --watch                   # Watch mode
```

### Linting
```bash
# Backend
flake8 .
mypy .

# UI
npm run lint
npm run format  # Auto-fix format issues
```

## 📊 Code Quality

Pre-commit hooks (optional):
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

## 🔍 Debugging

### Backend
```bash
DEBUG=1 python server.py                  # Enable debug output
python -m pdb -m pytest tests/            # Debug tests
```

### UI
- Open DevTools: F12
- Install React DevTools extension
- Check Console for errors

## 📚 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Full development guide
- **[docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Setup scripts & configuration
- **[docs/ENVIRONMENT_CONFIG.md](./docs/ENVIRONMENT_CONFIG.md)** - Environment variables
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **[docs/api-reference.md](./docs/api-reference.md)** - API endpoints
- **[docs/CI_CD_OVERVIEW.md](./docs/CI_CD_OVERVIEW.md)** - Deployment pipelines

## ⚠️ Common Issues

### Port already in use
```bash
# Find process
lsof -i :8080                             # macOS/Linux
netstat -ano | findstr :8080              # Windows

# Kill process
kill -9 <PID>                             # macOS/Linux
taskkill /PID <PID> /F                    # Windows
```

### Module not found (UI)
```bash
cd ui && rm -rf node_modules && npm install
```

### Database connection error
1. Check `.env.local` has correct `FRASBERGAI_DB_URL`
2. Ensure database is running
3. Verify database exists: `psql -U postgres -l`

### Backend won't start
```bash
deactivate
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python server.py
```

## 🔐 Environment Setup

Copy template:
```bash
cp .env.local.example .env.local
```

For local development, dummy values are fine:
```
FRASBERGAI_API_KEY=local-dev-key
FRASBERGAI_MODEL_TOKEN=local-dev-token
FRASBERGAI_DEPLOY_KEY=local-dev-deploy-key
```

For production, secrets are in GitHub Secrets (Settings → Secrets and variables → Actions)

## 📤 Before Committing

```bash
# Backend
flake8 .
mypy .
pytest

# UI
npm run lint
npm run format
npm run test

# Pre-commit hooks (if installed)
pre-commit run --all-files
```

## 🎯 Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Start backend: `python server.py`
3. Start UI: `npm run dev:judge` (in ui/)
4. Make changes with hot reload
5. Run tests locally
6. Commit & push
7. GitHub Actions runs tests automatically
8. Create Pull Request
9. Get approval & merge

## 📖 Learn More

- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Need help?** See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed instructions or open an issue on GitHub.
