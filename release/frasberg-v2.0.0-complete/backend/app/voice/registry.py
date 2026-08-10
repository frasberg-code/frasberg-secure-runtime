"""Voice Resolution Registry for Frasberg."""
from typing import Optional, Dict
from .profiles import VoiceProfile, voice_registry
from .tts.bark import BarkAdapter
from .tts.xtts import XTTSAdapter


class VoiceRegistry:
    """Voice resolution and adapter management."""
    
    def __init__(self):
        """Initialize voice registry."""
        self.adapters: Dict[str, any] = {}
        self._initialize_adapters()
    
    def _initialize_adapters(self):
        """Initialize TTS adapters."""
        self.adapters["bark"] = BarkAdapter({})
        self.adapters["xtts"] = XTTSAdapter({})
    
    def resolve_voice(self, voice_id: str) -> Optional[VoiceProfile]:
        """
        Resolve voice ID to voice profile.
        
        Args:
            voice_id: Voice profile ID
            
        Returns:
            VoiceProfile if found, None otherwise
        """
        return voice_registry.get(voice_id)
    
    def get_adapter_for_voice(self, voice_id: str) -> Optional[any]:
        """
        Get TTS adapter for voice ID.
        
        Args:
            voice_id: Voice profile ID
            
        Returns:
            TTS adapter instance
        """
        if voice_id.startswith("bk_"):
            return self.adapters.get("bark")
        elif voice_id.startswith("xtts_"):
            return self.adapters.get("xtts")
        return None
    
    def synthesize(self, text: str, voice_id: str) -> bytes:
        """
        Synthesize speech with specified voice.
        
        Args:
            text: Text to synthesize
            voice_id: Voice profile ID
            
        Returns:
            Audio bytes
        """
        adapter = self.get_adapter_for_voice(voice_id)
        if not adapter:
            raise ValueError(f"No adapter found for voice: {voice_id}")
        
        return adapter.synthesize(text, voice_id)


# Global registry
voice_resolution_registry = VoiceRegistry()
