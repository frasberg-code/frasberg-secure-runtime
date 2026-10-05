from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time
import hashlib

router = APIRouter(prefix="/api/v3/memory", tags=["memory-storage"])

class Memory(BaseModel):
    memory_id: str
    user_id: str
    content: str
    memory_type: str  # "interaction", "preference", "context"
    importance: float  # 0.0 to 1.0
    created_at: str
    last_accessed: Optional[str] = None
    access_count: int = 0
    tags: List[str] = []

class MemoryQuery(BaseModel):
    user_id: str
    query: str
    limit: int = 10
    min_importance: float = 0.5

# In-memory storage (in production: use vector database)
memory_store: Dict[str, List[Memory]] = {}

@router.post("/store", response_model=Memory)
def store_memory(user_id: str, content: str, memory_type: str, importance: float, tags: List[str] = []):
    """Store new memory"""
    
    memory_id = hashlib.sha256(f"{user_id}:{content}:{time.time()}".encode()).hexdigest()[:16]
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    memory = Memory(
        memory_id=memory_id,
        user_id=user_id,
        content=content,
        memory_type=memory_type,
        importance=importance,
        created_at=timestamp,
        tags=tags
    )
    
    if user_id not in memory_store:
        memory_store[user_id] = []
    memory_store[user_id].append(memory)
    
    return memory

@router.post("/recall")
def recall_memories(query: MemoryQuery):
    """Recall relevant memories"""
    
    user_memories = memory_store.get(query.user_id, [])
    
    # Filter by importance
    relevant = [m for m in user_memories if m.importance >= query.min_importance]
    
    # Sort by importance and recency
    relevant.sort(key=lambda m: (m.importance, m.created_at), reverse=True)
    
    # Update access count
    for memory in relevant[:query.limit]:
        memory.last_accessed = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        memory.access_count += 1
    
    return {
        "query": query.query,
        "memories_found": len(relevant),
        "memories": relevant[:query.limit]
    }

@router.get("/user/{user_id}/summary")
def get_user_memory_summary(user_id: str):
    """Get summary of user's memory profile"""
    
    user_memories = memory_store.get(user_id, [])
    
    if not user_memories:
        return {"user_id": user_id, "total_memories": 0}
    
    return {
        "user_id": user_id,
        "total_memories": len(user_memories),
        "by_type": {
            "interaction": len([m for m in user_memories if m.memory_type == "interaction"]),
            "preference": len([m for m in user_memories if m.memory_type == "preference"]),
            "context": len([m for m in user_memories if m.memory_type == "context"])
        },
        "average_importance": sum(m.importance for m in user_memories) / len(user_memories),
        "oldest_memory": min(user_memories, key=lambda m: m.created_at).created_at,
        "most_recent": max(user_memories, key=lambda m: m.created_at).created_at
    }
