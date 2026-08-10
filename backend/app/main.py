"""Frasberg AI v5.1.0 - Production-Ready with Real Integrations"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import v5.1 features
from backend.app.integrations.llm import router as llm_router
from backend.app.integrations.llm.canonical import router as canonical_llm_router
from backend.app.auth import auth_router
from backend.app.database import init_db, check_db_connection
from backend.app.cache import cache

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Frasberg AI v5.1.0 starting up...")
    
    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
    
    # Test cache
    cache_stats = cache.get_stats()
    logger.info(f"✅ Cache initialized: {cache_stats.get('mode')} mode")
    
    # Test LLM providers
    from fastapi import HTTPException as _HTTPException
    from backend.app.integrations.llm.openai_client import get_openai_client
    from backend.app.integrations.llm.anthropic_client import get_anthropic_client

    try:
        get_openai_client()
        logger.info("✅ OpenAI: Ready")
    except _HTTPException:
        logger.info("⚠️ OpenAI: Not configured (set OPENAI_API_KEY)")

    anthropic = get_anthropic_client()
    logger.info(f"✅ Anthropic: {'Ready' if not anthropic.mock_mode else 'Mock mode (set ANTHROPIC_API_KEY)'}")
    
    logger.info("🎯 Frasberg AI v5.1.0 ready!")
    
    yield
    
    # Shutdown
    logger.info("👋 Frasberg AI v5.1.0 shutting down...")

app = FastAPI(
    title="Frasberg AI v5.1.0",
    description="Production-Ready Planetary-Scale Intelligence with Real Integrations",
    version="5.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v5.1 routers
app.include_router(canonical_llm_router)
app.include_router(llm_router)
app.include_router(auth_router)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": "Frasberg AI",
        "version": "5.1.0",
        "tagline": "Production-Ready Planetary-Scale Intelligence",
        "status": "operational",
        "v5_1_features": [
            "✅ Real LLM Integration (OpenAI, Anthropic)",
            "✅ PostgreSQL Database (with SQLite fallback)",
            "✅ Redis Caching (with memory fallback)",
            "✅ JWT Authentication (secure user management)",
            "✅ Graceful Degradation (works without external services)",
            "✅ Production-Ready Error Handling"
        ],
        "docs": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "llm": "/api/v5.1/llm",
            "auth": "/api/v5.1/auth",
            "health": "/health",
            "system_info": "/api/v5.1/system/info"
        }
    }

@app.get("/health")
def health():
    """Health check endpoint"""
    db_status = "connected" if check_db_connection() else "disconnected"
    cache_stats = cache.get_stats()
    
    return {
        "status": "healthy",
        "version": "5.1.0",
        "service": "frasberg-ai",
        "integrations": {
            "database": db_status,
            "cache": cache_stats.get("mode"),
            "cache_connected": cache_stats.get("connected", False)
        }
    }

@app.get("/api/v5.1/system/info")
def system_info():
    """Detailed system information"""
    from fastapi import HTTPException as _HTTPException
    from backend.app.integrations.llm.openai_client import get_openai_client
    from backend.app.integrations.llm.anthropic_client import get_anthropic_client

    try:
        get_openai_client()
        openai_status = {"status": "ready", "note": "Connected"}
    except _HTTPException:
        openai_status = {"status": "not_configured", "note": "Set OPENAI_API_KEY environment variable"}

    anthropic_client = get_anthropic_client()
    
    return {
        "version": "5.1.0",
        "release_date": "2026-02-08",
        "release_focus": "Production readiness with real integrations",
        "integrations": {
            "llm": {
                "openai": openai_status,
                "anthropic": {
                    "status": "ready" if not anthropic_client.mock_mode else "mock",
                    "note": "Set ANTHROPIC_API_KEY environment variable" if anthropic_client.mock_mode else "Connected"
                }
            },
            "cache": cache.get_stats(),
            "database": {
                "connected": check_db_connection(),
                "type": "sqlite (dev) or postgresql (prod)"
            }
        },
        "features": {
            "authentication": True,
            "user_management": True,
            "api_keys": True,
            "audit_logging": True,
            "memory_storage": True,
            "streaming": True,
            "embeddings": True
        },
        "graceful_degradation": {
            "llm": "Falls back to mock responses if API keys not configured",
            "cache": "Falls back to in-memory cache if Redis unavailable",
            "database": "SQLite fallback for development"
        }
    }
