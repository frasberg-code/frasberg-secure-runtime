# Contributing to Frasberg Carjack Game

Thank you for your interest in contributing.
This project is owned and operated by **FRASBERG INC.**
All contributions require approval from **Frasberg Selassie — MR. CLAYTON-M. BERNARD-EX.**

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Redis 7+
- Git

### Setup
```bash
git clone https://github.com/frasberg/carjack-game.git
cd frasberg-carjack
npm install
cp .env.example .env
docker-compose up redis -d
npm run dev
```

---

## 🌿 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — protected, auto-deploys |
| `dev` | Integration — merge PRs here first |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |
| `chore/*` | Maintenance |

---

## ✍️ Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description
```

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `perf:` | Performance improvement |
| `refactor:` | Code refactor, no feature change |
| `docs:` | Documentation only |
| `test:` | Tests only |
| `chore:` | Build process, tooling |

**Examples:**
```
feat(police): add helicopter chase logic
fix(hud): correct minimap player dot alignment
perf(physics): optimise collision detection loop
docs(readme): update deployment instructions
```

---

## 📐 Code Standards

- **ES2022+** syntax — no `var`, use `const` and `let`
- Arrow functions preferred; async/await over raw Promises
- 2-space indentation, semicolons required
- JSDoc comments on all public methods
- No console.log in production code (use logger)
- Max line length: **100 characters**
- Classes: `PascalCase` · Functions/variables: `camelCase` · Constants: `UPPER_SNAKE_CASE`

---

## 🏗️ Adding a Game System

1. Create `src/YourSystem.js`
2. Export a class with `init()`, `update(dt)`, and `destroy()` methods
3. Register it in `src/GameEngine.js`
4. Add metrics to `server/multiplayer.js` if server-side
5. Document it in `README.md` under Game Systems

---

## 🔀 Pull Request Process

1. Fork the repository
2. Branch off `dev`: `git checkout -b feature/your-feature`
3. Write clean, focused commits
4. Run `npm run lint` and `npm test` before pushing
5. Open a PR against `dev` with a clear description
6. At least one review required before merge
7. Squash commits on merge

---

## 🐛 Reporting Bugs

Open a GitHub Issue with:
- **What happened**
- **What you expected**
- **Steps to reproduce**
- **Environment** (OS, Node version, browser)

---

## 🛡️ Security

- Never commit `.env`, secrets, keys, or tokens
- Never bypass the auth middleware
- Never disable encryption
- All player input must be validated server-side
- Encryption must use the existing libsodium wrapper
- Do **not** open public issues for security vulnerabilities — report directly to FRASBERG INC. via private channel

---

## 📜 License

All contributions become property of **FRASBERG INC.**
© FRASBERG INC. All rights reserved.
