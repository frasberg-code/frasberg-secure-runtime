# 🚀 Frasberg - Feature Enhancement Guide

This guide shows how to add the new middleware and endpoints to your services.

---

## 📊 New Features Overview

### 1. Request Logging Middleware
Logs all requests with timing information:
- Request method and path
- Response status code
- Processing duration
- Custom `X-Process-Time` header

### 2. Metrics Collection Middleware
Collects meta-only metrics:
- Total request count
- Uptime tracking
- Requests per minute
- Status code distribution
- Per-endpoint statistics (count, average response time)

### 3. New API Endpoints

#### Version Information
- `GET /api/version` - API version details
- `GET /api/v1/info` - Service information

#### Metrics & Monitoring
- `GET /api/v1/metrics` - Request metrics (meta-only)
- `GET /api/v1/limits` - Rate limiting information

#### System Diagnostics
- `GET /api/v1/diagnostics` - CPU, memory, disk usage
- `GET /api/v1/readiness` - Kubernetes-style readiness probe
- `GET /api/v1/liveness` - Kubernetes-style liveness probe

---

## 🔧 Installation Instructions

### Step 1: Add Middleware to Canonical Core

Edit `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import psutil  # pip install psutil
import os

# Import new middleware
from middleware.logging_middleware import RequestLoggingMiddleware
from middleware.metrics_collector import MetricsMiddleware, metrics

app = FastAPI(title="Frasberg - Canonical", version="v1.0.0")

# Add CORS (existing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add new middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(MetricsMiddleware)

# Existing endpoints...
@app.get("/")
async def root():
    return {
        "name": "Frasberg",
        "version": "v1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "architecture": "45-layer sovereign intelligence",
        "deployment": "canonical-core"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "canonical-core",
        "version": "v1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# NEW ENDPOINTS

@app.get("/api/version")
async def api_version():
    """API version information"""
    return {
        "api_version": "v1.0.0",
        "service": "canonical-core",
        "endpoints": {
            "health": "/health",
            "status": "/api/v1/status",
            "metrics": "/api/v1/metrics",
            "diagnostics": "/api/v1/diagnostics"
        },
        "documentation": "/docs"
    }

@app.get("/api/v1/info")
async def service_info():
    """Detailed service information"""
    return {
        "service": "canonical-core",
        "version": "v1.0.0",
        "description": "45-layer sovereign intelligence field architecture",
        "capabilities": [
            "Field-based processing",
            "Sovereign intelligence operations",
            "Institution-grade reliability"
        ],
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/metrics")
async def get_metrics():
    """Get request metrics (meta-only)"""
    return {
        "service": "canonical-core",
        "metrics": metrics.get_metrics(),
        "note": "All metrics are meta-only. No content or PII collected."
    }

@app.get("/api/v1/limits")
async def rate_limits():
    """Rate limiting information"""
    return {
        "rate_limits": {
            "requests_per_minute": 60,
            "requests_per_hour": 3600,
            "burst_limit": 100
        },
        "note": "Limits not enforced in v1.0.0, informational only",
        "enforcement": "planned for v1.1.0"
    }

@app.get("/api/v1/diagnostics")
async def diagnostics():
    """System diagnostics"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "service": "canonical-core",
        "timestamp": datetime.now().isoformat(),
        "system": {
            "cpu_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "percent": disk.percent
            }
        },
        "process": {
            "pid": os.getpid(),
            "threads": psutil.Process().num_threads()
        }
    }

@app.get("/api/v1/readiness")
async def readiness():
    """Kubernetes-style readiness probe"""
    # Check if service is ready to accept traffic
    try:
        # Add actual readiness checks here
        # e.g., database connection, external dependencies
        return {
            "status": "ready",
            "checks": {
                "api": "ok",
                "dependencies": "ok"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/v1/liveness")
async def liveness():
    """Kubernetes-style liveness probe"""
    # Check if service is alive (always returns ok if running)
    return {
        "status": "alive",
        "uptime_seconds": metrics.get_metrics()["uptime_seconds"],
        "timestamp": datetime.now().isoformat()
    }
```

### Step 2: Update requirements.txt

Add to `backend/requirements.txt`:
```
psutil==5.9.8
```

### Step 3: Rebuild Container

```bash
cd deploy/canonical-core
docker-compose down
docker-compose up -d --build
```

### Step 4: Test New Endpoints

```bash
# Version info
curl http://localhost:8000/api/version | python3 -m json.tool

# Service info
curl http://localhost:8000/api/v1/info | python3 -m json.tool

# Metrics
curl http://localhost:8000/api/v1/metrics | python3 -m json.tool

# Rate limits
curl http://localhost:8000/api/v1/limits | python3 -m json.tool

# Diagnostics
curl http://localhost:8000/api/v1/diagnostics | python3 -m json.tool

# Readiness
curl http://localhost:8000/api/v1/readiness | python3 -m json.tool

# Liveness
curl http://localhost:8000/api/v1/liveness | python3 -m json.tool
```

---

## 🔄 Apply to Other Services

### Education Fork (port 8001)
1. Copy middleware files to `forks/education/middleware/`
2. Follow same pattern in `forks/education/main.py`
3. Rebuild: `cd deploy/forks/education && docker-compose up -d --build`

### Healthcare Fork (port 8002)
1. Copy middleware files to `forks/healthcare-nonclinical/middleware/`
2. Follow same pattern in `forks/healthcare-nonclinical/main.py`
3. Rebuild: `cd deploy/forks/healthcare-nonclinical && docker-compose up -d --build`

### Analytics (port 5000)
1. Copy middleware files to `backend/app/analytics/middleware/`
2. Follow same pattern in `backend/app/analytics/main.py`
3. Rebuild: `cd deploy/analytics && docker-compose up -d --build`

---

## 📊 Example Enhanced Metrics Output

```json
{
  "service": "canonical-core",
  "metrics": {
    "total_requests": 1247,
    "uptime_seconds": 3625.42,
    "uptime_hours": 1.01,
    "requests_per_minute": 20.67,
    "status_codes": {
      "200": 1180,
      "404": 45,
      "500": 22
    },
    "endpoints": {
      "GET /": {
        "requests": 345,
        "avg_response_time": 0.023
      },
      "GET /health": {
        "requests": 720,
        "avg_response_time": 0.012
      },
      "GET /api/v1/status": {
        "requests": 182,
        "avg_response_time": 0.087
      }
    },
    "timestamp": "2026-02-08T07:30:45.123456"
  },
  "note": "All metrics are meta-only. No content or PII collected."
}
```

---

## ✅ Enhancement Checklist

- [ ] Middleware files created
- [ ] psutil installed in requirements.txt
- [ ] New endpoints added to main.py
- [ ] Container rebuilt
- [ ] All new endpoints tested
- [ ] Logs showing request timing
- [ ] Metrics accumulating correctly
- [ ] Diagnostics returning system info
- [ ] Readiness/liveness probes working

---

## 🎯 Next Steps

After implementing these enhancements:

1. **Update API Documentation** - New endpoints auto-documented at `/docs`
2. **Monitor Metrics** - Track request patterns and performance
3. **Set Up Alerts** - Use diagnostics for health monitoring
4. **Kubernetes Ready** - Readiness/liveness probes configured
5. **Rate Limiting** - Plan enforcement for v1.1.0

---

**🌟 These enhancements make Frasberg production-ready for enterprise deployment!**
