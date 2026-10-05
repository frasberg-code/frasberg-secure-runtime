# Local Development Setup

This guide walks you through setting up the Luchii development environment locally.

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for UI dashboards)
- **Docker & Docker Compose** (optional, for containerized backend)
- **pip** (Python package manager)

## Quick Start

### 1. Backend Setup (Python)

```bash
# Create and activate virtual environment
python -m venv .venv

# On Windows
.\.venv\Scripts\Activate.ps1

# On macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env.local file with local configuration
cp .env.local.example .env.local

# Start the backend server
python server.py
```

The backend API will run on **http://localhost:8080** by default.

### 2. UI Setup (Node.js)

```bash
cd ui

# Install dependencies
npm install

# Start all three dashboards in parallel
npm run dev:judge    # Judge Dashboard on http://localhost:5173
npm run dev:lawyer   # Lawyer Dashboard on http://localhost:5174
npm run dev:clerk    # Clerk Dashboard on http://localhost:5175
```

Or start them individually in separate terminals:

```bash
npm run dev:judge
npm run dev:lawyer
npm run dev:clerk
```

## Development Servers

| Dashboard | URL | Port |
|-----------|-----|------|
| Judge | http://localhost:5173 | 5173 |
| Lawyer | http://localhost:5174 | 5174 |
| Clerk | http://localhost:5175 | 5175 |
| Backend API | http://localhost:8080 | 8080 |

## Environment Configuration

Create a `.env.local` file in the project root for local development settings:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your local configuration. See [.env.local.example](.env.local.example) for all available options.

## Using Docker Compose (Optional)

To run the entire stack with Docker:

```bash
docker-compose -f docker-compose.local.yml up --build
```

This will start:
- Backend API on http://localhost:8080
- Judge Dashboard on http://localhost:5173
- Lawyer Dashboard on http://localhost:5174
- Clerk Dashboard on http://localhost:5175

## Backend Development

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_api.py

# Run with coverage
pytest --cov=src tests/
```

### Code Quality

```bash
# Lint code
flake8 .

# Type checking
mypy .

# Format code
black .
```

### API Documentation

OpenAPI/Swagger documentation is available at:
- **http://localhost:8080/docs** (Swagger UI)
- **http://localhost:8080/redoc** (ReDoc)

## UI Development

### Available Scripts

```bash
# Development servers (with hot reload)
npm run dev:judge
npm run dev:lawyer
npm run dev:clerk

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Component Structure

Each dashboard is located in:
- `ui/judge-dashboard/` - Judge Dashboard components
- `ui/lawyer-dashboard/` - Lawyer Dashboard components
- `ui/clerk-dashboard/` - Clerk Dashboard components
- `ui/lib/` - Shared UI components and utilities

### Making API Calls

Dashboards connect to the backend via the `/api` proxy (configured in `ui/vite.config.ts`):

```typescript
// API endpoint will be proxied to http://localhost:8080
const response = await axios.get('/api/luchii/v1/keys/api');
```

## Debugging

### Backend Debugging

Set `DEBUG=1` environment variable for verbose output:

```bash
DEBUG=1 python server.py
```

### UI Debugging

Use browser DevTools to debug React components:
- Open DevTools with F12
- Use React DevTools browser extension
- Check Console for error messages

### Checking Logs

Backend logs are printed to console. For UI, check:
- Browser console (F12)
- Terminal where `npm run dev:*` is running

## Troubleshooting

### Port Already in Use

If ports 5173, 5174, 5175, or 8080 are already in use:

```bash
# Find process using the port (macOS/Linux)
lsof -i :8080
lsof -i :5173

# Kill process
kill -9 <PID>

# On Windows, use:
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Backend Connection Issues

If dashboards can't reach the backend:
1. Ensure backend is running on http://localhost:8080
2. Check network requests in browser DevTools Network tab
3. Verify proxy configuration in `ui/vite.config.ts`
4. Check firewall settings

### Module Not Found Errors (UI)

```bash
cd ui
rm -rf node_modules
npm install
npm run dev:judge
```

### Database Issues

If backend shows database errors:
1. Check `.env.local` for correct `FRASBERGAI_DB_URL`
2. Ensure database service is running (if using Docker)
3. Verify database credentials

## Git Workflow

Before committing, ensure code quality:

```bash
# Backend
flake8 .
mypy .
pytest

# UI
npm run lint
npm run format
npm run test
```

See [CONTRIBUTING.md](./docs/CONTRIBUTOR_POLICY.md) for contribution guidelines.

## Additional Resources

- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [Deployment Guide](./docs/CI_CD_OVERVIEW.md)
- [Governance](./governance/commit-author-policy.md)
