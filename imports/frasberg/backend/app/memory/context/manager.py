from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import time

router = APIRouter(prefix="/api/v3/context", tags=["context-management"])

class ContextWindow(BaseModel):
    session_id: str
    user_id: str
    context_items: List[Dict[str, Any]]
    window_size: int
    created_at: str
    last_updated: str

# Active context windows
context_windows: Dict[str, ContextWindow] = {}

@router.post("/create")
def create_context_window(user_id: str, session_id: str, window_size: int = 10):
    """Create new context window for session"""
    
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    context = ContextWindow(
        session_id=session_id,
        user_id=user_id,
        context_items=[],
        window_size=window_size,
        created_at=timestamp,
        last_updated=timestamp
    )
    
    context_windows[session_id] = context
    return context

@router.post("/{session_id}/add")
def add_to_context(session_id: str, item: Dict[str, Any]):
    """Add item to context window"""
    
    if session_id not in context_windows:
        raise HTTPException(404, "Session not found")
    
    context = context_windows[session_id]
    context.context_items.append(item)
    
    # Maintain window size (keep most recent)
    if len(context.context_items) > context.window_size:
        context.context_items = context.context_items[-context.window_size:]
    
    context.last_updated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return {
        "session_id": session_id,
        "context_size": len(context.context_items),
        "window_size": context.window_size
    }

@router.get("/{session_id}")
def get_context(session_id: str):
    """Get current context for session"""
    
    if session_id not in context_windows:
        raise HTTPException(404, "Session not found")
    
    return context_windows[session_id]
