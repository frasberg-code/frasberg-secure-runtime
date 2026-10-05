from fastapi import APIRouter
from functools import lru_cache
import redis
import pickle

router = APIRouter(prefix="/api/v4.1/cache", tags=["caching"])

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=False)

class CacheManager:
    """Advanced caching with Redis and LRU"""
    
    @staticmethod
    def get(key: str):
        """Get from cache"""
        try:
            value = redis_client.get(key)
            return pickle.loads(value) if value else None
        except:
            return None
    
    @staticmethod
    def set(key: str, value, ttl: int = 300):
        """Set in cache with TTL"""
        try:
            redis_client.setex(key, ttl, pickle.dumps(value))
            return True
        except:
            return False
    
    @staticmethod
    def invalidate(pattern: str):
        """Invalidate cache by pattern"""
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)

@router.get("/stats")
def cache_stats():
    """Get cache statistics"""
    info = redis_client.info()
    return {
        "connected": True,
        "used_memory": info.get('used_memory_human'),
        "hit_rate": info.get('keyspace_hits', 0) / max(info.get('keyspace_misses', 1), 1),
        "keys": redis_client.dbsize()
    }
