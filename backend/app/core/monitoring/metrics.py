from fastapi import Request
import time
from typing import Dict, Any
import logging

logger = logging.getLogger("frasberg-ai.metrics")

class MetricsCollector:
    """Collect and expose system metrics"""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.requests_by_endpoint: Dict[str, int] = {}
        self.errors_by_type: Dict[str, int] = {}
    
    def record_request(self, endpoint: str, duration: float, status_code: int):
        """Record request metrics"""
        self.request_count += 1
        self.total_response_time += duration
        
        self.requests_by_endpoint[endpoint] = self.requests_by_endpoint.get(endpoint, 0) + 1
        
        if status_code >= 400:
            self.error_count += 1
            error_type = f"{status_code // 100}xx"
            self.errors_by_type[error_type] = self.errors_by_type.get(error_type, 0) + 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        avg_response_time = self.total_response_time / self.request_count if self.request_count > 0 else 0
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0
        
        return {
            "requests_total": self.request_count,
            "errors_total": self.error_count,
            "error_rate": round(error_rate, 4),
            "avg_response_time_ms": round(avg_response_time * 1000, 2),
            "requests_by_endpoint": self.requests_by_endpoint,
            "errors_by_type": self.errors_by_type
        }

# Global metrics collector
metrics_collector = MetricsCollector()

async def metrics_middleware(request: Request, call_next):
    """Middleware to collect request metrics"""
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        metrics_collector.record_request(
            endpoint=request.url.path,
            duration=duration,
            status_code=response.status_code
        )
        
        # Add metrics headers
        response.headers["X-Response-Time"] = str(round(duration * 1000, 2))
        
        return response
    
    except Exception as e:
        duration = time.time() - start_time
        metrics_collector.record_request(
            endpoint=request.url.path,
            duration=duration,
            status_code=500
        )
        raise e
