# Environment Configuration Guide

This document outlines the different environment configurations for Luchii development.

## Environment Types

### Local Development (.env.local)
Used for development on your local machine with all services running locally.

**Key characteristics:**
- Backend on `http://localhost:8080`
- UI dashboards on ports 5173-5175
- PostgreSQL on `localhost:5432`
- Full debug output enabled
- Hot reload enabled for code changes
- No authentication required
- Optional: Services in Docker containers

**Setup:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
# Or use docker-compose.local.yml
```

### Development (dev branch)
Used for testing features in a development environment before staging.

**Key characteristics:**
- Backend deployed to dev server
- Full testing enabled
- Staging database (separate from production)
- Debug output enabled
- Used by CI/CD pipeline

**Triggered by:**
Push to `dev` or `develop` branch

**Workflow:** `.github/workflows/dev-deploy.yml`

### Staging (staging branch)
Pre-production environment for testing with production-like setup.

**Key characteristics:**
- Near-production configuration
- Production database (read-only copy)
- Full security enabled
- Performance testing
- Load testing possible

**Triggered by:**
Push to `staging` branch

**Workflow:** `.github/workflows/staging-deploy.yml`

### Production (main branch)
Live production environment serving real traffic.

**Key characteristics:**
- Production database
- Full security and encryption enabled
- High availability setup
- Monitoring and alerting enabled
- No debug output
- Strict access controls

**Triggered by:**
Push to `main` branch (with approval)

**Workflow:** `.github/workflows/prod-deploy.yml`

## Configuration Matrix

| Setting | Local | Dev | Staging | Production |
|---------|-------|-----|---------|------------|
| Debug Mode | ✓ | ✓ | ✗ | ✗ |
| Database | localhost | dev-db | staging-db | prod-db |
| API Endpoint | localhost:8080 | dev.api | staging.api | api.frasberg.ai |
| Log Level | DEBUG | DEBUG | INFO | ERROR |
| CORS | localhost:* | dev.* | staging.* | *.frasberg.ai |
| API Auth | None | Required | Required | Required |
| SSL/TLS | ✗ | ✓ | ✓ | ✓ |
| Rate Limiting | ✗ | Lenient | Standard | Strict |

## Local Development Setup

### Using Environment File

1. **Copy template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit for your setup:**
   ```bash
   # For local PostgreSQL
   FRASBERGAI_DB_URL=postgresql://user:password@localhost:5432/luchii_dev
   
   # For local Redis
   REDIS_URL=redis://localhost:6379
   
   # For API keys (dummy values okay locally)
   FRASBERGAI_API_KEY=local-dev-key
   ```

3. **Load environment:**
   ```bash
   # macOS/Linux (in .venv activation)
   export $(cat .env.local | xargs)
   
   # Windows PowerShell
   Get-Content .env.local | ForEach-Object {
     $name, $value = $_ -split '=', 2
     [Environment]::SetEnvironmentVariable($name, $value)
   }
   ```

### Using Docker Compose

```bash
# Automatically loads environment from .env.local
docker-compose -f docker-compose.local.yml up

# Override specific values
ENVIRONMENT=testing docker-compose -f docker-compose.local.yml up
```

## Environment Variables Reference

### Backend Configuration

```bash
# Environment
ENVIRONMENT=local|dev|staging|production
DEBUG=0|1
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR

# Server
HOST=0.0.0.0
PORT=8080
API_PREFIX=/api

# Database
FRASBERGAI_DB_URL=postgresql://user:password@host:port/database

# Caching
REDIS_URL=redis://host:port

# API Keys & Secrets (use dummy values for local dev)
FRASBERGAI_API_KEY=xxx
FRASBERGAI_MODEL_TOKEN=xxx
FRASBERGAI_DEPLOY_KEY=xxx

# Model Configuration
MODEL_NAME=LUCHII
FRASBERGAI_VERSION=v1

# Features
ENABLE_DOCS=true|false
ENABLE_CORS=true|false
```

### UI Configuration

```bash
# API Endpoint
VITE_API_URL=http://localhost:8080

# Port Configuration
VITE_JUDGE_PORT=5173
VITE_LAWYER_PORT=5174
VITE_CLERK_PORT=5175

# Feature Flags
VITE_ENABLE_EXPERIMENTAL=false
VITE_ENABLE_ANALYTICS=false
```

## Database Initialization

### PostgreSQL Setup (Local)

```bash
# Create database
createdb luchii_dev -U postgres

# Initialize schema
psql -U postgres -d luchii_dev -f scripts/init-db.sql

# Seed test data (optional)
psql -U postgres -d luchii_dev -f scripts/seed-test-data.sql
```

### Using Docker

```bash
# PostgreSQL container is automatically initialized
docker-compose -f docker-compose.local.yml up postgres

# Connect to database
docker-compose -f docker-compose.local.yml exec postgres psql -U luchii_dev -d luchii_dev

# View logs
docker-compose -f docker-compose.local.yml logs postgres
```

## Switching Environments

### Local → Docker

```bash
# Stop local services
# Kill Python server and npm dev servers

# Start Docker stack
docker-compose -f docker-compose.local.yml up

# Access services
# Backend: http://localhost:8080
# Judge: http://localhost:5173
# etc.
```

### Testing Different Scenarios

```bash
# Test with different log levels
LOG_LEVEL=DEBUG python server.py
LOG_LEVEL=ERROR python server.py

# Test with different databases
FRASBERGAI_DB_URL=postgresql://user:password@staging:5432/luchii_test python server.py

# Test CORS settings
CORS_ORIGINS=http://example.com:5173 python server.py
```

## Secrets Management

### Local Development

**DO NOT store secrets in .env.local or commit them!**

For local development with dummy values:
```bash
FRASBERGAI_API_KEY=local-dev-key
FRASBERGAI_MODEL_TOKEN=local-dev-token
FRASBERGAI_DEPLOY_KEY=local-dev-deploy-key
```

### Production/Staging

Use GitHub Secrets:
1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets (not visible in repo):
   - `FRASBERGAI_API_KEY`
   - `FRASBERGAI_MODEL_TOKEN`
   - `FRASBERGAI_DEPLOY_KEY`
   - `FRASBERGAI_DB_URL`

Reference in workflows:
```yaml
env:
  FRASBERGAI_API_KEY: ${{ secrets.FRASBERGAI_API_KEY }}
```

## Validation

### Verify Environment Setup

```bash
# Check backend
curl http://localhost:8080/health
curl http://localhost:8080/docs  # Swagger UI

# Check UI servers
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5175

# Check database
psql -U postgres -d luchii_dev -c "SELECT version();"

# Check Redis (if used)
redis-cli ping
```

### Running Tests with Different Environments

```bash
# Test with local environment
ENV=local pytest tests/

# Test with Docker environment
docker-compose -f docker-compose.local.yml exec backend pytest tests/

# Test with specific database
FRASBERGAI_DB_URL=postgresql://user:pass@host/testdb pytest tests/
```

## Troubleshooting

### Environment Variables Not Loading

```bash
# Verify .env.local exists
ls -la .env.local

# Check syntax
cat .env.local | grep "^[^#]" | wc -l

# Debug environment
python -c "import os; print(os.environ.get('FRASBERGAI_DB_URL', 'NOT SET'))"
```

### Database Connection Issues

```bash
# Test connection string
psql postgresql://user:password@localhost:5432/luchii_dev

# Check if database exists
psql -U postgres -l | grep luchii

# View PostgreSQL logs
docker-compose -f docker-compose.local.yml logs postgres
```

### Port Conflicts

```bash
# Check what's using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use different port
PORT=9000 python server.py
```

## See Also

- DEVELOPMENT.md - Development workflow guide
- [CI/CD Overview](./CI_CD_OVERVIEW.md) - Deployment pipelines
- [Architecture](./architecture.md) - System design
