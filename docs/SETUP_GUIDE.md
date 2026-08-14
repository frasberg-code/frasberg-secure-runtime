# Setup Scripts for Luchii Development

## macOS/Linux Setup

```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Setting up Luchii development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Python
echo -e "${BLUE}Checking Python installation...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
echo -e "${BLUE}Creating virtual environment...${NC}"
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
pip install -r requirements.txt
pip install flake8 mypy pytest pytest-cov

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${BLUE}Creating .env.local from template...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ Created .env.local - update with your local values${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Setup UI
echo -e "${BLUE}Setting up UI dependencies...${NC}"
cd ui
node_version=$(node --version)
npm_version=$(npm --version)
echo "Node version: $node_version"
echo "npm version: $npm_version"

npm install

echo -e "${GREEN}✓ Backend setup complete!${NC}"
echo -e "${GREEN}✓ UI setup complete!${NC}"
echo ""
echo -e "${GREEN}Setup complete! Next steps:${NC}"
echo ""
echo "1. Terminal 1 - Start backend:"
echo "   source .venv/bin/activate"
echo "   python server.py"
echo ""
echo "2. Terminal 2 - Start UI (from ui/ directory):"
echo "   npm run dev:judge"
echo ""
echo "3. Access dashboards:"
echo "   Judge:  http://localhost:5173"
echo "   Lawyer: http://localhost:5174"
echo "   Clerk:  http://localhost:5175"
echo ""
echo "See DEVELOPMENT.md for detailed instructions"
```

Save as: `scripts/setup-dev.sh`
Run with: `bash scripts/setup-dev.sh`

## Windows Setup

```powershell
# setup-dev.ps1
# Requires PowerShell 5.0+

Write-Host "🚀 Setting up Luchii development environment..." -ForegroundColor Green

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
Write-Host "Python version: $pythonVersion"

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Cyan
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
pip install flake8 mypy pytest pytest-cov

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local from template..." -ForegroundColor Cyan
    Copy-Item .env.local.example .env.local
    Write-Host "✓ Created .env.local - update with your local values" -ForegroundColor Green
}
else {
    Write-Host "✓ .env.local already exists" -ForegroundColor Green
}

# Setup UI
Write-Host "Setting up UI dependencies..." -ForegroundColor Cyan
Set-Location ui
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "Node version: $nodeVersion"
Write-Host "npm version: $npmVersion"

npm install

Write-Host "✓ Backend setup complete!" -ForegroundColor Green
Write-Host "✓ UI setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Setup complete! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Terminal 1 - Start backend:"
Write-Host "   .\.venv\Scripts\Activate.ps1"
Write-Host "   python server.py"
Write-Host ""
Write-Host "2. Terminal 2 - Start UI (from ui/ directory):"
Write-Host "   npm run dev:judge"
Write-Host ""
Write-Host "3. Access dashboards:"
Write-Host "   Judge:  http://localhost:5173"
Write-Host "   Lawyer: http://localhost:5174"
Write-Host "   Clerk:  http://localhost:5175"
Write-Host ""
Write-Host "See DEVELOPMENT.md for detailed instructions"
```

Save as: `scripts/setup-dev.ps1`
Run with: `.\scripts\setup-dev.ps1`

## Docker Compose Quick Start

```bash
# Build and start all services
docker-compose -f docker-compose.local.yml up --build

# In another terminal, verify services
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop all services
docker-compose -f docker-compose.local.yml down

# Clean up volumes (resets database)
docker-compose -f docker-compose.local.yml down -v
```

## Environment Setup

### Quick Environment Check

```bash
# macOS/Linux
bash scripts/check-env.sh

# Windows PowerShell
.\scripts\check-env.ps1
```

### Reset Local Environment

```bash
# Remove virtual environment and reinstall
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt

# Clear npm cache and reinstall UI dependencies
cd ui
rm -rf node_modules
npm ci  # Use 'ci' instead of 'install' for consistency
```

## Database Setup

### PostgreSQL (if not using Docker)

```bash
# Create local database
createdb luchii_dev -U postgres

# Initialize schema
psql -U postgres -d luchii_dev -f scripts/init-db.sql

# Update .env.local with:
FRASBERGAI_DB_URL=postgresql://postgres:password@localhost:5432/luchii_dev
```

### Reset Database

```bash
# Using Docker Compose
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up postgres

# Or manually (PostgreSQL)
dropdb luchii_dev -U postgres --if-exists
createdb luchii_dev -U postgres
psql -U postgres -d luchii_dev -f scripts/init-db.sql
```

## Pre-commit Hooks

Setup automatic linting and testing before commits:

```bash
# Install pre-commit framework
pip install pre-commit

# Setup git hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

See `.pre-commit-config.yaml` for configuration.

## IDE Setup

### Visual Studio Code

1. **Extensions to install:**
   - Python
   - Pylance
   - ESLint
   - Prettier
   - Thunder Client (for API testing)

2. **Workspace Settings** (.vscode/settings.json):
   ```json
   {
     "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
     "python.linting.enabled": true,
     "python.linting.flake8Enabled": true,
     "python.formatting.provider": "black",
     "[python]": {
       "editor.formatOnSave": true,
       "editor.defaultFormatter": "ms-python.python"
     },
     "[typescript]": {
       "editor.formatOnSave": true,
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     }
   }
   ```

### PyCharm

1. Configure Python interpreter:
   - File → Settings → Project → Python Interpreter
   - Select `.venv/bin/python`

2. Enable linting:
   - Settings → Editor → Inspections → Enable Code Inspection

### WebStorm/IntelliJ

1. Configure Node.js:
   - Settings → Languages & Frameworks → Node.js
   - Set Node.js version to 18+

2. Enable ESLint:
   - Settings → Languages & Frameworks → TypeScript → ESLint

## Troubleshooting

### Port Conflicts

```bash
# Find process using port
# macOS/Linux
lsof -i :8080

# Windows
netstat -ano | findstr :8080

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Virtual Environment Issues

```bash
# Clear and recreate
deactivate  # or exit terminal on Windows
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### npm Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd ui
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- DEVELOPMENT.md - Full development guide
- [Architecture](architecture.md) - System architecture
- [API Reference](api-reference.md) - API documentation
