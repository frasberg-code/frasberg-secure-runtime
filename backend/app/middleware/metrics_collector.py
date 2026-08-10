"""
Metrics Collector for Frasberg AI
Collects request metrics (meta-only, no content)
"""

import time
from datetime import datetime
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class MetricsCollector:
    """Singleton metrics collector"""
    
    def __init__(self):
        self.request_count = 0
        self.start_time = time.time()
        self.endpoint_stats = defaultdict(lambda: {"count": 0, "total_time": 0})
        self.status_codes = defaultdict(int)
    
    def record_request(self, method: str, path: str, status_code: int, duration: float):
        """Record a request metric"""
        self.request_count += 1
        endpoint = f"{method} {path}"
        self.endpoint_stats[endpoint]["count"] += 1
        self.endpoint_stats[endpoint]["total_time"] += duration
        self.status_codes[status_code] += 1
    
    def get_metrics(self) -> dict:
        """Get current metrics"""
        uptime = time.time() - self.start_time
        
        # Calculate endpoint averages
        endpoint_details = {}
        for endpoint, stats in self.endpoint_stats.items():
            avg_time = stats["total_time"] / stats["count"] if stats["count"] > 0 else 0
            endpoint_details[endpoint] = {
                "requests": stats["count"],
                "avg_response_time": round(avg_time, 3)
            }
        
        return {
            "total_requests": self.request_count,
            "uptime_seconds": round(uptime, 2),
            "uptime_hours": round(uptime / 3600, 2),
            "requests_per_minute": round(self.request_count / (uptime / 60), 2) if uptime > 0 else 0,
            "status_codes": dict(self.status_codes),
            "endpoints": endpoint_details,
            "timestamp": datetime.now().isoformat()
        }


# Global metrics instance
metrics = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics"""
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Record metrics
        duration = time.time() - start_time
        metrics.record_request(
            request.method,
            request.url.path,
            response.status_code,
            duration
        )
        
        return response
