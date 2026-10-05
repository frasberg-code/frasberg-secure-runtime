"""Voice Profile Registry for Frasberg AI."""
from typing import Optional, Dict
from dataclasses import dataclass


@dataclass
class VoiceProfile:
    """Voice profile definition (non-biometric)."""
    id: str
    label: str
    version: str
    language: str = "en"
    fingerprint: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "label": self.label,
            "version": self.version,
            "language": self.language,
            "fingerprint": self.fingerprint
        }


class VoiceProfileRegistry:
    """Registry for voice profiles."""
    
    def __init__(self):
        self._profiles: Dict[str, VoiceProfile] = {}
        self._initialize_default_profiles()
    
    def _initialize_default_profiles(self):
        """Initialize default voice profiles."""
        # Bark voices
        self._profiles["bk_voice_en_conv"] = VoiceProfile(
            id="bk_voice_en_conv",
            label="Bark English Conversational",
            version="1.0",
            language="en"
        )
        
        # XTTS voices
        self._profiles["xtts_v2_en"] = VoiceProfile(
            id="xtts_v2_en",
            label="XTTS v2 English",
            version="2.0",
            language="en"
        )
    
    def register(self, profile: VoiceProfile) -> None:
        """Register a voice profile."""
        self._profiles[profile.id] = profile
    
    def get(self, profile_id: str) -> Optional[VoiceProfile]:
        """Get a voice profile by ID."""
        return self._profiles.get(profile_id)
    
    def list_profiles(self) -> list:
        """List all voice profiles."""
        return [p.to_dict() for p in self._profiles.values()]


# Global registry instance
voice_registry = VoiceProfileRegistry()
