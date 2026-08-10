import asyncio
import time
from functools import wraps
from typing import Callable, Any
import logging

logger = logging.getLogger("frasberg.resilience")

class CircuitBreaker:
    """Circuit breaker pattern for service calls"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker transitioning to HALF_OPEN")
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker transitioning to CLOSED")
            
            return result
        
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"Circuit breaker OPEN after {self.failure_count} failures")
            
            raise e

def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """Retry decorator with exponential backoff"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries ({max_retries}) reached for {func.__name__}")
                        raise e
                    
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Retry {attempt + 1}/{max_retries} for {func.__name__} after {delay}s")
                    await asyncio.sleep(delay)
        
        return wrapper
    return decorator

def timeout(seconds: int):
    """Timeout decorator for async functions"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                logger.error(f"Function {func.__name__} timed out after {seconds}s")
                raise Exception(f"Operation timed out after {seconds} seconds")
        
        return wrapper
    return decorator

class ResourcePool:
    """Generic resource pool with connection management"""
    
    def __init__(self, max_size: int = 10):
        self.max_size = max_size
        self.pool = []
        self.in_use = set()
    
    async def acquire(self):
        """Acquire resource from pool"""
        if self.pool:
            resource = self.pool.pop()
        elif len(self.in_use) < self.max_size:
            resource = self._create_resource()
        else:
            # Wait for available resource
            await asyncio.sleep(0.1)
            return await self.acquire()
        
        self.in_use.add(resource)
        return resource
    
    async def release(self, resource):
        """Release resource back to pool"""
        if resource in self.in_use:
            self.in_use.remove(resource)
            self.pool.append(resource)
    
    def _create_resource(self):
        """Create new resource (override in subclass)"""
        return object()
