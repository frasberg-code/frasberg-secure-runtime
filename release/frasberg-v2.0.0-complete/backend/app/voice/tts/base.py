"""Base TTS Adapter for Frasberg."""
from abc import ABC, abstractmethod
from typing import Dict, Any


class TTSAdapter(ABC):
    """Base class for Text-to-Speech adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize TTS adapter with configuration."""
        self.config = config
    
    @abstractmethod
    def synthesize(self, text: str, voice_id: str) -> bytes:
        """
        Synthesize speech from text.
        
        Args:
            text: Input text to synthesize
            voice_id: Voice profile ID to use
            
        Returns:
            Audio data as bytes (WAV format)
        """
        pass
    
    @abstractmethod
    def get_available_voices(self) -> list:
        """Get list of available voices for this adapter."""
        pass
    
    def validate_voice(self, voice_id: str) -> bool:
        """Validate that a voice ID is available."""
        available = self.get_available_voices()
        return voice_id in [v["id"] for v in available]
