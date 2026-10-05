"""
Persona Evolution System Routes
Phase 2: Deep persona settings, memory management, and user training
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone
import uuid

from db.database import db
from services.llm_service import llm_service, PersonaEvolutionEngine

router = APIRouter(prefix="/api/persona", tags=["Persona Evolution"])


# ==========================================
# Pydantic Models
# ==========================================

class EmotionalRangeConfig(BaseModel):
    """Configuration for a single emotion"""
    min: float = Field(ge=0, le=1, default=0.0)
    max: float = Field(ge=0, le=1, default=1.0)
    current: float = Field(ge=0, le=1, default=0.5)

class EmotionalRangeUpdate(BaseModel):
    """Update emotional range settings"""
    joy: Optional[EmotionalRangeConfig] = None
    love: Optional[EmotionalRangeConfig] = None
    curiosity: Optional[EmotionalRangeConfig] = None
    playfulness: Optional[EmotionalRangeConfig] = None
    empathy: Optional[EmotionalRangeConfig] = None
    assertiveness: Optional[EmotionalRangeConfig] = None
    vulnerability: Optional[EmotionalRangeConfig] = None
    passion: Optional[EmotionalRangeConfig] = None

class TriggerConfig(BaseModel):
    """Configuration for an emotional trigger"""
    emotion: str
    intensity: float = Field(ge=0, le=1)

class TriggersUpdate(BaseModel):
    """Update trigger configurations"""
    triggers: Dict[str, TriggerConfig]

class LearningStyleUpdate(BaseModel):
    """Update learning style preferences"""
    adaptation_speed: Optional[float] = Field(None, ge=0, le=1)
    memory_retention: Optional[float] = Field(None, ge=0, le=1)
    personality_flexibility: Optional[float] = Field(None, ge=0, le=1)
    emotional_mirroring: Optional[float] = Field(None, ge=0, le=1)
    conversation_depth: Optional[float] = Field(None, ge=0, le=1)

class PersonaSettingsResponse(BaseModel):
    """Full persona settings response"""
    user_id: str
    emotional_state: Dict[str, Any]
    triggers: Dict[str, Any]
    learning_style: Dict[str, float]
    relationship_bond: Dict[str, Any]
    updated_at: Optional[str] = None

class MemoryEntry(BaseModel):
    """A user memory entry"""
    memory_type: str  # fact, preference, experience, emotion, relationship
    content: str
    metadata: Optional[Dict[str, Any]] = None
    importance: Optional[float] = Field(0.5, ge=0, le=1)

class TrainingEntry(BaseModel):
    """User training data"""
    training_type: str  # correction, preference, style, topic
    data: Dict[str, Any]

class RelationshipBondUpdate(BaseModel):
    """Update relationship bond"""
    trust_level: Optional[float] = Field(None, ge=0, le=1)
    intimacy_level: Optional[float] = Field(None, ge=0, le=1)
    nickname: Optional[str] = None
    inside_joke: Optional[str] = None
    shared_memory: Optional[str] = None


# ==========================================
# API Routes - Persona Settings
# ==========================================

@router.get("/settings/{user_id}", response_model=PersonaSettingsResponse)
async def get_persona_settings(user_id: str):
    """Get persona settings for a user"""
    # Get from database
    settings = await db.get_persona_settings(user_id)
    
    if settings:
        return PersonaSettingsResponse(
            user_id=user_id,
            emotional_state=settings.get("emotional_state", PersonaEvolutionEngine.DEFAULT_EMOTIONAL_RANGE),
            triggers=settings.get("triggers", PersonaEvolutionEngine.DEFAULT_TRIGGERS),
            learning_style=settings.get("learning_style", PersonaEvolutionEngine.DEFAULT_LEARNING_STYLE),
            relationship_bond=settings.get("relationship_bond", {}),
            updated_at=settings.get("updated_at")
        )
    
    # Return defaults if no settings exist
    engine = llm_service.get_persona_engine(user_id)
    return PersonaSettingsResponse(
        user_id=user_id,
        emotional_state=engine.emotional_state,
        triggers=engine.triggers,
        learning_style=engine.learning_style,
        relationship_bond=engine.relationship_bond
    )

@router.post("/settings/{user_id}")
async def save_persona_settings(user_id: str):
    """Save current persona settings for a user"""
    engine = llm_service.get_persona_engine(user_id)
    settings = engine.to_dict()
    
    result = await db.save_persona_settings(user_id, settings)
    return {"status": "saved", "user_id": user_id, "updated_at": result.get("updated_at")}

@router.get("/defaults")
async def get_default_settings():
    """Get default persona settings"""
    return {
        "emotional_range": PersonaEvolutionEngine.DEFAULT_EMOTIONAL_RANGE,
        "triggers": PersonaEvolutionEngine.DEFAULT_TRIGGERS,
        "learning_style": PersonaEvolutionEngine.DEFAULT_LEARNING_STYLE
    }


# ==========================================
# API Routes - Emotional Range
# ==========================================

@router.get("/emotional-range/{user_id}")
async def get_emotional_range(user_id: str):
    """Get current emotional range configuration"""
    engine = llm_service.get_persona_engine(user_id)
    return {
        "user_id": user_id,
        "emotional_state": engine.emotional_state
    }

@router.put("/emotional-range/{user_id}")
async def update_emotional_range(user_id: str, update: EmotionalRangeUpdate):
    """Update emotional range configuration"""
    engine = llm_service.get_persona_engine(user_id)
    
    update_dict = update.model_dump(exclude_none=True)
    for emotion, config in update_dict.items():
        if emotion in engine.emotional_state:
            engine.emotional_state[emotion].update(config)
    
    # Persist to database
    await db.save_persona_settings(user_id, engine.to_dict())
    
    return {
        "status": "updated",
        "user_id": user_id,
        "emotional_state": engine.emotional_state
    }

@router.post("/emotional-range/{user_id}/reset")
async def reset_emotional_range(user_id: str):
    """Reset emotional range to defaults"""
    engine = llm_service.get_persona_engine(user_id)
    engine.emotional_state = PersonaEvolutionEngine.DEFAULT_EMOTIONAL_RANGE.copy()
    
    await db.save_persona_settings(user_id, engine.to_dict())
    
    return {
        "status": "reset",
        "user_id": user_id,
        "emotional_state": engine.emotional_state
    }


# ==========================================
# API Routes - Triggers
# ==========================================

@router.get("/triggers/{user_id}")
async def get_triggers(user_id: str):
    """Get emotional trigger configurations"""
    engine = llm_service.get_persona_engine(user_id)
    return {
        "user_id": user_id,
        "triggers": engine.triggers
    }

@router.put("/triggers/{user_id}")
async def update_triggers(user_id: str, update: TriggersUpdate):
    """Update emotional trigger configurations"""
    engine = llm_service.get_persona_engine(user_id)
    
    for trigger_name, config in update.triggers.items():
        engine.triggers[trigger_name] = config.model_dump()
    
    await db.save_persona_settings(user_id, engine.to_dict())
    
    return {
        "status": "updated",
        "user_id": user_id,
        "triggers": engine.triggers
    }

@router.post("/triggers/{user_id}/process")
async def process_trigger(user_id: str, trigger_type: str):
    """Manually process an emotional trigger"""
    engine = llm_service.get_persona_engine(user_id)
    
    if trigger_type not in engine.triggers:
        raise HTTPException(status_code=404, detail=f"Trigger '{trigger_type}' not found")
    
    engine.process_trigger(trigger_type)
    
    return {
        "status": "processed",
        "trigger": trigger_type,
        "emotional_state": engine.emotional_state
    }


# ==========================================
# API Routes - Learning Style
# ==========================================

@router.get("/learning-style/{user_id}")
async def get_learning_style(user_id: str):
    """Get learning style preferences"""
    engine = llm_service.get_persona_engine(user_id)
    return {
        "user_id": user_id,
        "learning_style": engine.learning_style
    }

@router.put("/learning-style/{user_id}")
async def update_learning_style(user_id: str, update: LearningStyleUpdate):
    """Update learning style preferences"""
    engine = llm_service.get_persona_engine(user_id)
    
    update_dict = update.model_dump(exclude_none=True)
    engine.learning_style.update(update_dict)
    
    await db.save_persona_settings(user_id, engine.to_dict())
    
    return {
        "status": "updated",
        "user_id": user_id,
        "learning_style": engine.learning_style
    }


# ==========================================
# API Routes - Memory Management
# ==========================================

@router.get("/memory/{user_id}")
async def get_user_memory(user_id: str, limit: int = 50):
    """Get user memory entries"""
    memories = await db.get_user_memory(user_id, limit)
    return {
        "user_id": user_id,
        "count": len(memories),
        "memories": memories
    }

@router.post("/memory/{user_id}")
async def add_user_memory(user_id: str, entry: MemoryEntry):
    """Add a new memory entry for a user"""
    result = await db.save_user_memory(
        user_id=user_id,
        memory_type=entry.memory_type,
        content=entry.content,
        metadata=entry.metadata
    )
    return {
        "status": "saved",
        "memory": result
    }

@router.get("/memory/{user_id}/search")
async def search_user_memory(user_id: str, query: str, memory_type: Optional[str] = None):
    """Search user memory entries"""
    memories = await db.get_user_memory(user_id, 100)
    
    # Simple text search (in production, use vector search)
    query_lower = query.lower()
    results = [
        m for m in memories
        if query_lower in m.get("content", "").lower()
        and (memory_type is None or m.get("memory_type") == memory_type)
    ]
    
    return {
        "user_id": user_id,
        "query": query,
        "count": len(results),
        "results": results
    }


# ==========================================
# API Routes - User Training
# ==========================================

@router.get("/training/{user_id}")
async def get_user_training(user_id: str):
    """Get user training data"""
    training = await db.get_user_training(user_id)
    return {
        "user_id": user_id,
        "count": len(training),
        "training": training
    }

@router.post("/training/{user_id}")
async def add_user_training(user_id: str, entry: TrainingEntry):
    """Add user training data"""
    result = await db.save_user_training(
        user_id=user_id,
        training_type=entry.training_type,
        data=entry.data
    )
    return {
        "status": "saved",
        "training": result
    }

@router.post("/training/{user_id}/correction")
async def add_correction(user_id: str, original_response: str, corrected_response: str, context: Optional[str] = None):
    """Add a correction to train Sofia's responses"""
    result = await db.save_user_training(
        user_id=user_id,
        training_type="correction",
        data={
            "original": original_response,
            "corrected": corrected_response,
            "context": context
        }
    )
    return {
        "status": "correction saved",
        "message": "Sofia will learn from this correction"
    }


# ==========================================
# API Routes - Relationship Bond
# ==========================================

@router.get("/relationship/{user_id}")
async def get_relationship_bond(user_id: str):
    """Get relationship bond data"""
    bond = await db.get_relationship_bond(user_id)
    
    if not bond:
        engine = llm_service.get_persona_engine(user_id)
        bond = engine.relationship_bond
    
    return {
        "user_id": user_id,
        "relationship_bond": bond
    }

@router.put("/relationship/{user_id}")
async def update_relationship_bond(user_id: str, update: RelationshipBondUpdate):
    """Update relationship bond"""
    engine = llm_service.get_persona_engine(user_id)
    
    update_dict = update.model_dump(exclude_none=True)
    
    # Handle special fields
    if "nickname" in update_dict:
        nickname = update_dict.pop("nickname")
        if nickname not in engine.relationship_bond.get("nicknames", []):
            engine.relationship_bond.setdefault("nicknames", []).append(nickname)
    
    if "inside_joke" in update_dict:
        joke = update_dict.pop("inside_joke")
        if joke not in engine.relationship_bond.get("inside_jokes", []):
            engine.relationship_bond.setdefault("inside_jokes", []).append(joke)
    
    if "shared_memory" in update_dict:
        memory = update_dict.pop("shared_memory")
        if memory not in engine.relationship_bond.get("shared_memories", []):
            engine.relationship_bond.setdefault("shared_memories", []).append(memory)
    
    # Update remaining fields
    engine.relationship_bond.update(update_dict)
    
    # Persist to database
    await db.update_relationship_bond(user_id, engine.relationship_bond)
    
    return {
        "status": "updated",
        "user_id": user_id,
        "relationship_bond": engine.relationship_bond
    }


# ==========================================
# API Routes - Emotional Context
# ==========================================

@router.get("/context/{user_id}")
async def get_emotional_context(user_id: str):
    """Get current emotional context for LLM prompting"""
    engine = llm_service.get_persona_engine(user_id)
    return {
        "user_id": user_id,
        "context": engine.get_emotional_context()
    }

@router.post("/analyze-message")
async def analyze_message(message: str):
    """Analyze a message for emotional triggers"""
    triggers = await llm_service.analyze_message_for_triggers(message)
    return {
        "message": message[:100] + "..." if len(message) > 100 else message,
        "detected_triggers": triggers
    }
