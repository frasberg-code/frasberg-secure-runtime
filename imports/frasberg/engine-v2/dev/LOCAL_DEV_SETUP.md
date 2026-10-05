# Local Development Setup for Frasberg Engine v2

This guide helps you set up a complete local development environment for Frasberg Engine v2.

---

## Prerequisites

Install these on your machine:

### macOS
```bash
brew install node@20 python@3.11 docker postgresql redis
brew services start postgresql
brew services start redis
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm python3.11 docker.io docker-compose postgresql postgresql-contrib redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### Windows
Use WSL2 with Ubuntu, then follow Ubuntu instructions.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/frasberg/engine-v2.git
cd engine-v2
```

---

## Step 2: Install Dependencies

```bash
# API + Scheduler
npm install --prefix api
npm install --prefix scheduler

# GPU Worker
cd worker
pip3.11 install -r requirements.txt
cd ..
```

---

## Step 3: Initialize Database

```bash
# Create database
sudo -u postgres createdb frasberg

# Apply schema
sudo -u postgres psql frasberg < db/schema.sql

# Verify
sudo -u postgres psql frasberg -c "SELECT COUNT(*) FROM video_tasks;"
```

---

## Step 4: Start Local Services

### Option A: Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)
- MinIO (localhost:9000)
- LocalStack (AWS mock)

### Option B: Manual Start

Terminal 1 — Database:
```bash
sudo -u postgres psql frasberg
```

Terminal 2 — Redis:
```bash
redis-server
```

Terminal 3 — API Server:
```bash
cd api
npm run dev
# Listens on localhost:3000
```

Terminal 4 — Scheduler:
```bash
cd scheduler
npm run dev
# Connects to localhost:6379 (Redis) and localhost:5432 (Postgres)
```

Terminal 5 — GPU Worker (CPU fallback):
```bash
cd worker
python src/main.py --cpu
# Connects to localhost:5432 and localhost:6379
```

---

## Step 5: Verify Setup

### Health Check
```bash
curl http://localhost:3000/v1/healthz
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "ok",
    "queue": "ok",
    "gpu": "ok"
  },
  "timestamp": "2026-09-01T09:00:00Z"
}
```

### Database Check
```bash
psql -h localhost -U frasberg -d frasberg -c "SELECT COUNT(*) FROM video_tasks;"
```

Expected: `0` rows

### Redis Check
```bash
redis-cli ping
```

Expected: `PONG`

---

## Step 6: Test API

### Create a Task
```bash
curl -X POST http://localhost:3000/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A neon skyline at night, cinematic",
    "duration": 5,
    "ratio": "16:9",
    "motion": "medium",
    "guidance_scale": 7,
    "seed": null,
    "output_format": "mp4"
  }'
```

Expected response:
```json
{
  "task_id": "task_20260901T090000Z_abc123def456",
  "status": "queued",
  "region": "us-west"
}
```

Save the `task_id` for the next step.

### Poll Task Status
```bash
curl http://localhost:3000/v1/task/task_20260901T090000Z_abc123def456
```

Expected response:
```json
{
  "task_id": "task_20260901T090000Z_abc123def456",
  "status": "queued",
  "region": "us-west",
  "created_at": "2026-09-01T09:00:00Z",
  "updated_at": "2026-09-01T09:00:00Z"
}
```

Keep polling until `status` changes to `running` → `completed`.

### View Logs

API logs:
```bash
docker logs engine-api
```

Scheduler logs:
```bash
docker logs engine-scheduler
```

Worker logs:
```bash
docker logs engine-worker
```

---

## Development Workflow

### Make Changes

1. Edit source files in `api/src/`, `scheduler/src/`, or `worker/src/`

2. Tests run automatically on file changes (if `npm run watch` is enabled)

### Run Tests

```bash
# API tests
npm test --prefix api

# Scheduler tests
npm test --prefix scheduler

# Worker tests
pytest worker/
```

### Run Linting

```bash
# TypeScript
npm run lint --prefix api
npm run lint --prefix scheduler

# Python
pylint worker/src/
black worker/src/
isort worker/src/
```

### Build Docker Images

```bash
docker build -t frasberg/api -f docker/api.Dockerfile .
docker build -t frasberg/scheduler -f docker/scheduler.Dockerfile .
docker build -t frasberg/worker -f docker/worker.Dockerfile .
```

---

## Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://frasberg:password@localhost:5432/frasberg

# Redis
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=video-output

# API
API_PORT=3000
JWT_SECRET=dev_secret_key_do_not_use_in_production

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# GPU Worker
GPU_DEVICE=cpu  # Use 'cuda' if you have a GPU
```

---

## Troubleshooting

### Database connection refused
```bash
# Check if PostgreSQL is running
sudo -u postgres pg_isready

# Start PostgreSQL
sudo systemctl start postgresql  # Ubuntu
brew services start postgresql    # macOS
```

### Redis connection refused
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### GPU Worker not picking up tasks
1. Check Redis is running: `redis-cli KEYS '*'`
2. Check database has tasks: `psql -c "SELECT * FROM video_tasks"`
3. Check worker logs: `docker logs engine-worker`

### API not starting
```bash
# Check for syntax errors
node -c api/src/server.ts

# Check dependencies
npm install --prefix api

# Check logs
npm run dev --prefix api  # Run in foreground to see errors
```

---

## Useful Commands

### Database
```bash
# Connect to database
psql -h localhost -U frasberg -d frasberg

# List all tables
\dt

# Describe table
\d video_tasks

# Query tasks
SELECT id, status, created_at FROM video_tasks ORDER BY created_at DESC LIMIT 10;
```

### Redis
```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Check queue depth
LLEN video_tasks:queue

# Clear all data (careful!)
FLUSHALL
```

### Docker
```bash
# List running containers
docker ps

# View container logs
docker logs <container_name>

# Stop all containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

---

## Next Steps

1. Read `/docs/architecture/README.md` for system overview
2. Review API endpoints in `api/src/routes/`
3. Check database schema in `db/schema.sql`
4. Explore scheduler logic in `scheduler/src/`
5. Examine GPU worker in `worker/src/`
6. Pick a task from GitHub issues and start coding!

---

## Need Help?

- Check logs: `docker logs <service>`
- Ask in Slack: `#frasberg-engine-dev`
- Open an issue on GitHub
- Pair with a senior engineer

---

Happy coding! 🚀
