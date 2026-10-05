# Frasberg Engine v2 — Developer Onboarding

Welcome to the Frasberg Engine team! This guide will help you get up and running.

---

## Prerequisites

- **Node.js 20+** — for API and scheduler
- **Python 3.11+** — for GPU worker
- **Docker + Docker Compose** — for local services
- **PostgreSQL client** — for database access
- **Git** — version control
- **Bash** — shell scripting

### Install

```bash
# macOS
brew install node@20 python@3.11 docker postgresql

# Ubuntu
sudo apt-get install -y nodejs python3.11 docker.io postgresql-client

# Windows
# Use WSL2 with Ubuntu, then follow Ubuntu instructions
```

---

## Clone the Repository

```bash
git clone https://github.com/frasberg/engine-v2.git
cd engine-v2
```

---

## Install Dependencies

### API + Scheduler (Node.js)

```bash
cd api
npm install
cd ../scheduler
npm install
cd ..
```

### GPU Worker (Python)

```bash
cd worker
pip install -r requirements.txt
cd ..
```

---

## Start Local Environment

### Option 1: Using Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (metadata DB)
- Redis (task queue)
- Minio (object storage)
- API server (port 3000)
- Scheduler
- GPU worker (CPU fallback)

### Option 2: Manual Start

Terminal 1 — API:
```bash
cd api
npm run dev
```

Terminal 2 — Scheduler:
```bash
cd scheduler
npm run dev
```

Terminal 3 — GPU Worker:
```bash
cd worker
python src/main.py --cpu
```

---

## Verify Setup

### Health Check

```bash
curl http://localhost:3000/v1/healthz
```

Expected response:
```json
{"status": "healthy", "services": {"database": "ok", "queue": "ok", "gpu": "ok"}}
```

### Create Test Task

```bash
curl -X POST http://localhost:3000/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A neon skyline at night",
    "duration": 1,
    "ratio": "16:9",
    "motion": "medium",
    "guidance_scale": 7,
    "seed": null,
    "output_format": "mp4"
  }'
```

Expected response:
```json
{"task_id": "task_20260901T090000Z_abc123", "status": "queued", "region": "us-west"}
```

### Poll Task Status

```bash
curl http://localhost:3000/v1/task/task_20260901T090000Z_abc123
```

---

## Project Structure

```
engine-v2/
├── api/                    # Next.js API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, rate limiting, etc
│   │   └── db.ts          # Database client
│   └── package.json
├── scheduler/              # Task scheduler (Node.js)
│   ├── src/
│   │   ├── scheduler.ts   # Main scheduler loop
│   │   ├── autoscaler.ts  # GPU autoscaling
│   │   └── dispatch.ts    # Worker dispatch
│   └── package.json
├── worker/                 # GPU worker (Python)
│   ├── src/
│   │   ├── main.py        # Worker entry point
│   │   ├── inference.py   # Model inference
│   │   ├── encoder.py     # Video encoding
│   │   └── storage.py     # Object storage client
│   └── requirements.txt
├── db/                     # Database
│   └── schema.sql          # SQL schema
├── config/
│   └── engine.yaml         # Engine configuration
├── docs/                   # Documentation
│   └── architecture/       # Architecture diagrams
├── ops/                    # Operations
│   ├── sre-handbook.md     # SRE guide
│   └── runbooks/           # Incident playbooks
└── docker-compose.yaml     # Local development
```

---

## Key Files to Review

1. **Architecture**: `docs/architecture/README.md`
2. **API Reference**: `api/README.md`
3. **Database Schema**: `db/schema.sql`
4. **SRE Handbook**: `ops/sre-handbook.md`
5. **Contributing Guide**: `CONTRIBUTING.md`

---

## Common Tasks

### Run Tests

```bash
npm test --prefix api
npm test --prefix scheduler
pytest worker/
```

### Build Docker Images

```bash
docker build -t frasberg/api -f docker/api.Dockerfile .
docker build -t frasberg/scheduler -f docker/scheduler.Dockerfile .
docker build -t frasberg/worker -f docker/worker.Dockerfile .
```

### View Logs

```bash
# API
docker logs frasberg-api

# Scheduler
docker logs frasberg-scheduler

# Worker
docker logs frasberg-worker
```

### Access Database

```bash
psql -h localhost -U frasberg -d frasberg
```

Password: `frasberg_dev` (development only)

---

## Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally

3. **Commit with clear message**:
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/my-feature
   ```

5. **Wait for reviews and CI to pass**

6. **Merge to dev branch** (not main)

---

## Getting Help

- **Questions?** Ask in `#frasberg-engine-dev` Slack channel
- **Stuck on setup?** Post in `#help` with error messages
- **Need code review?** Tag `@engine-reviewers` on your PR
- **Found a bug?** Open an issue in GitHub

---

## Next Steps

1. Read `/ARCHITECTURE.md` for system overview
2. Explore `/sdk/examples/` for API usage
3. Review `/ops/runbooks/` for operational procedures
4. Pick a `good-first-issue` from GitHub
5. Pair with senior engineer for first task

---

Welcome aboard! 🚀
