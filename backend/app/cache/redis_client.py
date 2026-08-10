"""Real Redis Cache Implementation for Frasberg AI v5.1"""
import json
import os
from typing import Any, Optional, List, Dict
import logging

logger = logging.getLogger(__name__)

class RedisCache:
    """Production-ready Redis cache with graceful fallback"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.mock_mode = False
        self.memory_cache = {}  # Fallback in-memory cache
        
        try:
            import redis
            self.client = redis.from_url(
                self.redis_url, 
                decode_responses=True,
                max_connections=50
            )
            # Test connection
            self.client.ping()
            logger.info(f"Redis connected successfully: {self.redis_url}")
        except ImportError:
            logger.warning("Redis library not installed. Using memory cache.")
            self.mock_mode = True
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using memory cache.")
            self.mock_mode = True
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.mock_mode:
                return self.memory_cache.get(key)
            
            value = self.client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (seconds)"""
        try:
            if self.mock_mode:
                self.memory_cache[key] = value
                return True
            
            self.client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self.mock_mode:
                self.memory_cache.pop(key, None)
                return True
            
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            if self.mock_mode:
                return key in self.memory_cache
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    def expire(self, key: str, ttl: int) -> bool:
        """Set expiration on existing key"""
        try:
            if self.mock_mode:
                return True  # Memory cache doesn't support TTL
            return bool(self.client.expire(key, ttl))
        except Exception as e:
            logger.error(f"Cache expire error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> bool:
        """Clear all keys matching pattern"""
        try:
            if self.mock_mode:
                keys_to_delete = [k for k in self.memory_cache.keys() if pattern in k]
                for key in keys_to_delete:
                    del self.memory_cache[key]
                return True
            
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter"""
        try:
            if self.mock_mode:
                current = self.memory_cache.get(key, 0)
                self.memory_cache[key] = current + amount
                return self.memory_cache[key]
            return self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return None
    
    def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrement counter"""
        try:
            if self.mock_mode:
                current = self.memory_cache.get(key, 0)
                self.memory_cache[key] = current - amount
                return self.memory_cache[key]
            return self.client.decrby(key, amount)
        except Exception as e:
            logger.error(f"Cache decrement error: {e}")
            return None
    
    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple keys at once"""
        try:
            if self.mock_mode:
                return {k: self.memory_cache.get(k) for k in keys}
            
            values = self.client.mget(keys)
            return {
                k: json.loads(v) if v else None 
                for k, v in zip(keys, values)
            }
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    def set_many(self, mapping: Dict[str, Any], ttl: int = 300) -> bool:
        """Set multiple keys at once"""
        try:
            if self.mock_mode:
                self.memory_cache.update(mapping)
                return True
            
            pipe = self.client.pipeline()
            for key, value in mapping.items():
                pipe.setex(key, ttl, json.dumps(value))
            pipe.execute()
            return True
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        try:
            if self.mock_mode:
                return {
                    "mode": "memory",
                    "keys": len(self.memory_cache),
                    "connected": False,
                    "type": "in-memory-fallback"
                }
            
            info = self.client.info()
            return {
                "mode": "redis",
                "connected": True,
                "type": "redis",
                "used_memory": info.get('used_memory_human'),
                "total_keys": self.client.dbsize(),
                "connected_clients": info.get('connected_clients'),
                "uptime_seconds": info.get('uptime_in_seconds'),
                "hit_rate": round(
                    info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1),
                    3
                )
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"mode": "error", "error": str(e)}

# Global cache instance
cache = RedisCache()
