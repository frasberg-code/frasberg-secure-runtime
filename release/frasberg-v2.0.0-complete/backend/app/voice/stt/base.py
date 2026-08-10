"""Base STT Adapter for Frasberg."""
from abc import ABC, abstractmethod
from typing import Dict, Any


class STTAdapter(ABC):
    """Base class for Speech-to-Text adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize STT adapter with configuration."""
        self.config = config
    
    @abstractmethod
    def transcribe(self, audio_data: bytes, language: str = "en") -> str:
        """
        Transcribe speech to text.
        
        Args:
            audio_data: Audio bytes to transcribe
            language: Language code (default: "en")
            
        Returns:
            Transcribed text
        """
        pass
    
    @abstractmethod
    def get_supported_languages(self) -> list:
        """Get list of supported languages."""
        pass
