"""Per-User Emotional Memory for Frasberg."""
from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class EmotionalMemory:
    """Memory of emotional interactions."""
    user_id: str
    timestamp: str
    emotion: str
    intensity: float
    context: str
    metadata: Dict = field(default_factory=dict)


class MemoryEngine:
    """
    Per-user emotional memory system.
    
    Tracks history of emotional states for continuity and context.
    NOTE: This is operational memory, not user profiling.
    """
    
    def __init__(self, max_memories_per_user: int = 100):
        """
        Initialize memory engine.
        
        Args:
            max_memories_per_user: Maximum memories to retain per user
        """
        self.max_memories = max_memories_per_user
        self.memories: Dict[str, List[EmotionalMemory]] = {}
    
    def store_memory(self, user_id: str, emotion: str, intensity: float,
                    context: str, metadata: Optional[Dict] = None) -> None:
        """
        Store emotional memory.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            intensity: Intensity value
            context: Context description
            metadata: Additional metadata
        """
        if user_id not in self.memories:
            self.memories[user_id] = []
        
        memory = EmotionalMemory(
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat(),
            emotion=emotion,
            intensity=intensity,
            context=context,
            metadata=metadata or {}
        )
        
        self.memories[user_id].append(memory)
        
        # Limit memory size
        if len(self.memories[user_id]) > self.max_memories:
            self.memories[user_id] = self.memories[user_id][-self.max_memories:]
    
    def get_recent_memories(self, user_id: str, count: int = 10) -> List[Dict]:
        """
        Get recent memories for user.
        
        Args:
            user_id: User identifier
            count: Number of recent memories
            
        Returns:
            List of recent memories
        """
        if user_id not in self.memories:
            return []
        
        recent = self.memories[user_id][-count:]
        return [vars(m) for m in recent]
    
    def get_emotion_history(self, user_id: str, emotion: str) -> List[Dict]:
        """
        Get history of specific emotion.
        
        Args:
            user_id: User identifier
            emotion: Emotion to filter
            
        Returns:
            List of memories for emotion
        """
        if user_id not in self.memories:
            return []
        
        filtered = [m for m in self.memories[user_id] if m.emotion == emotion]
        return [vars(m) for m in filtered]
    
    def get_average_intensity(self, user_id: str, emotion: str) -> float:
        """
        Get average intensity for emotion.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            
        Returns:
            Average intensity
        """
        history = self.get_emotion_history(user_id, emotion)
        if not history:
            return 0.0
        
        total = sum(m["intensity"] for m in history)
        return total / len(history)
    
    def clear_memories(self, user_id: str) -> None:
        """Clear all memories for user."""
        if user_id in self.memories:
            self.memories[user_id] = []


# Global memory engine
memory_engine = MemoryEngine()
