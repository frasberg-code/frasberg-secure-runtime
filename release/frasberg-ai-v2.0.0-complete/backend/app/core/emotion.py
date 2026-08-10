"""Emotional State Modeling with Decay for Frasberg AI."""
from typing import Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import math


@dataclass
class EmotionalState:
    """Emotional state with decay over time."""
    joy: float = 0.0
    trust: float = 0.0
    fear: float = 0.0
    surprise: float = 0.0
    sadness: float = 0.0
    disgust: float = 0.0
    anger: float = 0.0
    anticipation: float = 0.0
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "joy": self.joy,
            "trust": self.trust,
            "fear": self.fear,
            "surprise": self.surprise,
            "sadness": self.sadness,
            "disgust": self.disgust,
            "anger": self.anger,
            "anticipation": self.anticipation,
            "last_updated": self.last_updated
        }


class EmotionEngine:
    """
    Emotion state modeling with natural decay.
    
    NOTE: This is NOT sentiment analysis or emotional AI.
    This tracks operational state parameters for conversational flow.
    """
    
    def __init__(self, decay_rate: float = 0.1):
        """
        Initialize emotion engine.
        
        Args:
            decay_rate: Rate of emotion decay (0-1)
        """
        self.decay_rate = decay_rate
        self.states: Dict[str, EmotionalState] = {}
    
    def get_state(self, user_id: str) -> EmotionalState:
        """
        Get current emotional state for user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Current emotional state with decay applied
        """
        if user_id not in self.states:
            self.states[user_id] = EmotionalState()
            return self.states[user_id]
        
        state = self.states[user_id]
        # Apply decay based on time elapsed
        self._apply_decay(state)
        return state
    
    def update_state(self, user_id: str, emotion: str, intensity: float) -> EmotionalState:
        """
        Update emotional state.
        
        Args:
            user_id: User identifier
            emotion: Emotion to update (joy, trust, fear, etc.)
            intensity: Intensity value (0-1)
            
        Returns:
            Updated state
        """
        state = self.get_state(user_id)
        
        # Update emotion
        if hasattr(state, emotion):
            current = getattr(state, emotion)
            # Blend new intensity with current
            new_value = min(1.0, max(0.0, current + intensity))
            setattr(state, emotion, new_value)
        
        state.last_updated = datetime.utcnow().isoformat()
        return state
    
    def _apply_decay(self, state: EmotionalState) -> None:
        """Apply time-based decay to emotional state."""
        last_update = datetime.fromisoformat(state.last_updated.replace('Z', '+00:00'))
        now = datetime.utcnow()
        elapsed = (now - last_update).total_seconds() / 3600  # hours
        
        # Apply exponential decay
        decay_factor = math.exp(-self.decay_rate * elapsed)
        
        for emotion in ['joy', 'trust', 'fear', 'surprise', 'sadness', 
                       'disgust', 'anger', 'anticipation']:
            current = getattr(state, emotion)
            setattr(state, emotion, current * decay_factor)
        
        state.last_updated = now.isoformat()
    
    def get_dominant_emotion(self, user_id: str) -> Dict:
        """
        Get dominant emotion for user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dominant emotion and intensity
        """
        state = self.get_state(user_id)
        emotions = {
            "joy": state.joy,
            "trust": state.trust,
            "fear": state.fear,
            "surprise": state.surprise,
            "sadness": state.sadness,
            "disgust": state.disgust,
            "anger": state.anger,
            "anticipation": state.anticipation
        }
        
        dominant = max(emotions.items(), key=lambda x: x[1])
        return {
            "emotion": dominant[0],
            "intensity": dominant[1]
        }


# Global emotion engine
emotion_engine = EmotionEngine()
