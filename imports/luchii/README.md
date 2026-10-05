# Luchii — Frasberg AI Core Model

Luchii is the flagship text-generation engine powering the Frasberg AI ecosystem.

## Quick Start (Local Development)

Get up and running locally in 5 minutes:

```bash
# Backend (Python 3.11+)
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows
# or: source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
python server.py                       # Runs on http://localhost:8080

# UI (Node.js 18+) - in a new terminal
cd ui
npm install
npm run dev:judge                      # Judge: http://localhost:5173
npm run dev:lawyer                     # Lawyer: http://localhost:5174
npm run dev:clerk                      # Clerk: http://localhost:5175
```

All dashboards connect to the backend API on http://localhost:8080. See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## Features
- Multi-region inference
- Governed model behavior
- Tool-call orchestration
- Constitutional safety

## API
- `POST /luchii/v1/model/token` issues an opaque model token for a requested model name.
- `POST /luchii/v1/keys/api` issues a fresh API key for FrasbergAI integrations.

## Structure
/docs  
/blueprints  
/diagrams  
/governance  
/scripts  

## Documentation

- [Development Guide](./DEVELOPMENT.md) - Local development setup
- [API Reference](./docs/api-reference.md)
- [Architecture](./docs/architecture.md)
- [CI/CD Overview](./docs/CI_CD_OVERVIEW.md)

## License
See `/LICENSE-LUCHII.md`
