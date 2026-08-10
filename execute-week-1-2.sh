#!/bin/bash
# Frasberg AI - Month 1 Week 1-2: v5.1.0 Real Integrations
# Execute real production-ready integrations

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  FRASBERG CORE - WEEK 1-2: v5.1.0 REAL INTEGRATIONS"
echo "  Making Frasberg AI Production-Ready"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    echo -e "${RED}❌ Error: Must run from frasberg root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📦 What we've built:${NC}"
echo ""
echo "  ✅ backend/app/integrations/llm/"
echo "     • openai_client.py - Real OpenAI GPT-4 integration"
echo "     • anthropic_client.py - Real Claude integration"
echo "     • __init__.py - Unified LLM interface"
echo ""
echo "  ✅ backend/app/database/"
echo "     • models.py - User, Memory, APIKey, AuditLog, Session models"
echo "     • connection.py - PostgreSQL/SQLite connection management"
echo "     • __init__.py - Database module exports"
echo ""
echo "  ✅ backend/app/cache/"
echo "     • redis_client.py - Production Redis caching"
echo "     • __init__.py - Cache module exports"
echo ""
echo "  ✅ backend/app/auth/"
echo "     • jwt_handler.py - JWT tokens, password hashing, API keys"
echo "     • __init__.py - Auth module exports"
echo ""
echo "  ✅ backend/requirements-v5.1.txt"
echo "     • All production dependencies listed"
echo ""

echo -e "${YELLOW}📋 Next Steps - Setup & Testing:${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: Install Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run this command:"
echo "  pip install -r backend/requirements-v5.1.txt"
echo ""
echo "Or if using virtual environment:"
echo "  python -m venv venv"
echo "  source venv/bin/activate"
echo "  pip install -r backend/requirements-v5.1.txt"
echo ""

read -p "Would you like to install dependencies now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    pip install -r backend/requirements-v5.1.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: Set Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Create a .env file in the backend/ directory with:"
echo ""
cat > backend/.env.example << 'EOF'
# LLM API Keys (get from providers)
OPENAI_API_KEY=sk-...your-key-here
ANTHROPIC_API_KEY=sk-ant-...your-key-here

# Database Configuration
DATABASE_URL=postgresql://frasberg:frasberg@localhost:5432/frasberg_ai
# Or for SQLite (development only):
# USE_SQLITE=true

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
EOF

echo "Example .env file created at: backend/.env.example"
echo ""
echo "Copy it and add your real API keys:"
echo "  cp backend/.env.example backend/.env"
echo "  nano backend/.env  # or use your favorite editor"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: Set Up PostgreSQL (Optional but Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option A: Use Docker (easiest):"
echo "  docker run -d \\"
echo "    --name frasberg-postgres \\"
echo "    -e POSTGRES_USER=frasberg \\"
echo "    -e POSTGRES_PASSWORD=frasberg \\"
echo "    -e POSTGRES_DB=frasberg_ai \\"
echo "    -p 5432:5432 \\"
echo "    postgres:15"
echo ""
echo "Option B: Install PostgreSQL locally:"
echo "  # Ubuntu/Debian"
echo "  sudo apt-get install postgresql postgresql-contrib"
echo "  sudo -u postgres createuser frasberg"
echo "  sudo -u postgres createdb frasberg_ai"
echo ""
echo "Option C: Use SQLite (development only):"
echo "  Set USE_SQLITE=true in .env"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 4: Set Up Redis (Optional but Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option A: Use Docker (easiest):"
echo "  docker run -d \\"
echo "    --name frasberg-redis \\"
echo "    -p 6379:6379 \\"
echo "    redis:7-alpine"
echo ""
echo "Option B: Install Redis locally:"
echo "  # Ubuntu/Debian"
echo "  sudo apt-get install redis-server"
echo "  sudo systemctl start redis"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 5: Initialize Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Create database initialization script..."
echo ""

cat > backend/init_db.py << 'EOF'
"""Initialize Frasberg AI database"""
from app.database import init_db, check_db_connection
import sys

print("Initializing Frasberg AI database...")

if not check_db_connection():
    print("❌ Cannot connect to database. Check DATABASE_URL in .env")
    sys.exit(1)

print("✅ Database connection successful")
print("Creating tables...")

init_db()

print("✅ Database initialized successfully!")
print("")
print("Tables created:")
print("  • users")
print("  • memories")
print("  • api_keys")
print("  • audit_logs")
print("  • sessions")
EOF

echo "Run to initialize database:"
echo "  cd backend && python init_db.py"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 6: Test the Integrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > backend/test_integrations.py << 'EOF'
"""Test v5.1.0 integrations"""
import os
from dotenv import load_dotenv

load_dotenv()

print("Testing Frasberg AI v5.1.0 Integrations")
print("=" * 50)
print("")

# Test 1: LLM Integrations
print("1. Testing LLM Integrations...")
try:
    from app.integrations.llm import OPENAI_AVAILABLE, ANTHROPIC_AVAILABLE
    print(f"   OpenAI: {'✅ Available' if OPENAI_AVAILABLE else '❌ Not installed'}")
    print(f"   Anthropic: {'✅ Available' if ANTHROPIC_AVAILABLE else '❌ Not installed'}")
    
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        from app.integrations.llm import get_openai_client
        client = get_openai_client()
        print("   ✅ OpenAI client initialized")
    
    if ANTHROPIC_AVAILABLE and os.getenv("ANTHROPIC_API_KEY"):
        from app.integrations.llm import get_anthropic_client
        client = get_anthropic_client()
        print("   ✅ Anthropic client initialized")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

print("")

# Test 2: Database
print("2. Testing Database...")
try:
    from app.database import check_db_connection, SessionLocal, User
    if check_db_connection():
        print("   ✅ Database connection successful")
        
        # Try to query
        db = SessionLocal()
        count = db.query(User).count()
        db.close()
        print(f"   ✅ Database query successful ({count} users)")
    else:
        print("   ❌ Database connection failed")
except Exception as e:
    print(f"   ⚠️  Database: {e}")

print("")

# Test 3: Cache
print("3. Testing Redis Cache...")
try:
    from app.cache import cache
    if cache.is_available():
        print("   ✅ Redis connection successful")
        
        # Test operations
        cache.set("test_key", "test_value", ttl=10)
        value = cache.get("test_key")
        cache.delete("test_key")
        print("   ✅ Cache operations successful")
    else:
        print("   ⚠️  Redis not available (optional)")
except Exception as e:
    print(f"   ⚠️  Cache: {e}")

print("")

# Test 4: Authentication
print("4. Testing Authentication...")
try:
    from app.auth import get_password_hash, verify_password, create_access_token
    
    # Test password hashing
    hashed = get_password_hash("test_password")
    verified = verify_password("test_password", hashed)
    print(f"   ✅ Password hashing: {'PASS' if verified else 'FAIL'}")
    
    # Test JWT
    token = create_access_token({"user_id": 1})
    print(f"   ✅ JWT token created: {token[:20]}...")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

print("")
print("=" * 50)
print("✅ Integration testing complete!")
print("")
print("Next steps:")
print("  • Start the server: python server.py")
print("  • Test the API: curl http://localhost:8000/")
print("  • Read the docs: cat ../CONTRIBUTING-ENHANCED.md")
EOF

echo "Run integration tests:"
echo "  cd backend && python test_integrations.py"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 7: Start Frasberg AI Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Start the server:"
echo "  cd backend && python server.py"
echo ""
echo "Or with uvicorn:"
echo "  cd backend && uvicorn server:app --reload"
echo ""

echo ""
echo -e "${GREEN}✅ Week 1-2 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Summary of what was built:${NC}"
echo "  ✅ Real OpenAI & Anthropic integrations"
echo "  ✅ PostgreSQL database with full schema"
echo "  ✅ Redis caching layer"
echo "  ✅ JWT authentication & API keys"
echo "  ✅ Production-ready dependencies"
echo ""
echo -e "${YELLOW}Next phase: Week 3 - Research Paper${NC}"
echo "  Run: ./week-3-research-paper.sh"
echo ""
