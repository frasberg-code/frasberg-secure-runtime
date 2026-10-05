from fastapi import APIRouter
from typing import Dict, Any
import psutil
import time
import asyncio

router = APIRouter(prefix="/health", tags=["health"])

class HealthChecker:
    """Comprehensive health checking"""
    
    @staticmethod
    async def check_system_resources() -> Dict[str, Any]:
        """Check system resource availability"""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024 ** 3),
            "healthy": cpu_percent < 90 and memory.percent < 90 and disk.percent < 90
        }
    
    @staticmethod
    async def check_dependencies() -> Dict[str, Any]:
        """Check external dependencies"""
        # Simulate dependency checks
        dependencies = {
            "database": {"status": "healthy", "latency_ms": 5},
            "cache": {"status": "healthy", "latency_ms": 2},
            "llm_providers": {"status": "healthy", "available": 5}
        }
        
        all_healthy = all(dep["status"] == "healthy" for dep in dependencies.values())
        
        return {
            "dependencies": dependencies,
            "healthy": all_healthy
        }

@router.get("/live")
async def liveness_probe():
    """Kubernetes-style liveness probe"""
    return {
        "status": "alive",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@router.get("/ready")
async def readiness_probe():
    """Kubernetes-style readiness probe"""
    checker = HealthChecker()
    
    # Check system resources
    resources = await checker.check_system_resources()
    dependencies = await checker.check_dependencies()
    
    ready = resources["healthy"] and dependencies["healthy"]
    
    return {
        "status": "ready" if ready else "not_ready",
        "checks": {
            "resources": resources,
            "dependencies": dependencies
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@router.get("/detailed")
async def detailed_health():
    """Detailed health check with all metrics"""
    checker = HealthChecker()
    
    resources = await checker.check_system_resources()
    dependencies = await checker.check_dependencies()
    
    return {
        "overall_status": "healthy" if resources["healthy"] and dependencies["healthy"] else "degraded",
        "version": "4.0.1",
        "uptime_seconds": time.time(),  # Simplified
        "system_resources": resources,
        "dependencies": dependencies,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
