"""
Sofia Voice Intelligence Layer
Full implementation of voice cognition + identity + governance
"""

from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Literal
from datetime import datetime
import hashlib


# ============================================
# Voice Capability Codes (SYSTEM-LEVEL)
# ============================================

VOICE_CAPABILITIES = {
    "VOICE_TTS": True,
    "VOICE_STT": True,
    "VOICE_STREAMING": True,
    "VOICE_INTERRUPT": True,
    "VOICE_CONTEXT_AWARE": True,
    "VOICE_EMOTIONAL_CARRYOVER": True,
    "VOICE_MULTI_PERSONA": True,
}


# ============================================
# Frontend Voice Codes
# ============================================

class VoiceProfiles:
    CONVERSATIONAL = "v_conv_neutral"
    PROFESSIONAL = "v_professional"
    INSTRUCTIONAL = "v_instructional"
    EXPRESSIVE = "v_expressive"
    MINIMAL = "v_minimal"


# ============================================
# Frontend → Backend Mapping
# ============================================

VOICE_MAP = {
    "v_conv_neutral": "bk_voice_conv_v1",
    "v_professional": "bk_voice_professional_v1",
    "v_instructional": "bk_voice_instructional_v1",
    "v_expressive": "bk_voice_expressive_v1",
    "v_minimal": "bk_voice_minimal_v1",
}


# ============================================
# Pydantic Models
# ============================================

class Prosody(BaseModel):
    rate: float = 1.0
    pitch_variance: float = 0.4
    pause_ms: int = 250


class EmotionBias(BaseModel):
    warmth: float = 0.6
    formality: float = 0.3
    assertiveness: float = 0.4


class VoiceProfile(BaseModel):
    id: str
    label: str
    version: str
    prosody: Prosody
    emotion_bias: EmotionBias


class STTResult(BaseModel):
    text: str
    rms_energy: float = 0.5
    pitch_mean: float = 200.0
    pitch_variance: float = 0.4
    speech_rate: float = 1.0


class EmotionalState(BaseModel):
    warmth: float = 0.6
    formality: float = 0.3
    assertiveness: float = 0.4
    
    def decay(self):
        """Decay emotional state towards neutral"""
        self.warmth *= 0.95
        self.formality *= 0.95
        self.assertiveness *= 0.95
    
    def apply_baseline(self, baseline: Dict):
        """Apply user baseline"""
        self.warmth = baseline.get("warmth", self.warmth)
        self.formality = baseline.get("formality", self.formality)
        self.assertiveness = baseline.get("assertiveness", self.assertiveness)


class VoiceEvent(BaseModel):
    type: Literal["TTS", "STT", "TUNE", "SWITCH"]
    voice_profile: str
    authorized: bool = True
    caller: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    text_hash: Optional[str] = None


# ============================================
# Backend Voice Profiles (CORE)
# ============================================

VOICE_PROFILES = {
    "bk_voice_conv_v1": VoiceProfile(
        id="bk_voice_conv_v1",
        label="Conversational Neutral",
        version="v1",
        prosody=Prosody(rate=0.98, pitch_variance=0.45, pause_ms=280),
        emotion_bias=EmotionBias(warmth=0.7, formality=0.25, assertiveness=0.35)
    ),
    "bk_voice_professional_v1": VoiceProfile(
        id="bk_voice_professional_v1",
        label="Professional",
        version="v1",
        prosody=Prosody(rate=1.0, pitch_variance=0.3, pause_ms=300),
        emotion_bias=EmotionBias(warmth=0.3, formality=0.8, assertiveness=0.5)
    ),
    "bk_voice_instructional_v1": VoiceProfile(
        id="bk_voice_instructional_v1",
        label="Instructional",
        version="v1",
        prosody=Prosody(rate=0.95, pitch_variance=0.35, pause_ms=320),
        emotion_bias=EmotionBias(warmth=0.5, formality=0.6, assertiveness=0.4)
    ),
    "bk_voice_expressive_v1": VoiceProfile(
        id="bk_voice_expressive_v1",
        label="Expressive",
        version="v1",
        prosody=Prosody(rate=1.02, pitch_variance=0.55, pause_ms=250),
        emotion_bias=EmotionBias(warmth=0.85, formality=0.2, assertiveness=0.6)
    ),
    "bk_voice_minimal_v1": VoiceProfile(
        id="bk_voice_minimal_v1",
        label="Minimal/Accessibility",
        version="v1",
        prosody=Prosody(rate=0.92, pitch_variance=0.2, pause_ms=350),
        emotion_bias=EmotionBias(warmth=0.4, formality=0.5, assertiveness=0.3)
    ),
}


# ============================================
# Persona Registry
# ============================================

PERSONAS = {
    "default": {
        "voice": "bk_voice_conv_v1",
        "emotion_bias": {"warmth": 0.7, "formality": 0.25}
    },
    "legal": {
        "voice": "bk_voice_professional_v1",
        "emotion_bias": {"warmth": 0.3, "formality": 0.8}
    },
    "coach": {
        "voice": "bk_voice_expressive_v1",
        "emotion_bias": {"warmth": 0.85, "assertiveness": 0.6}
    },
    "teacher": {
        "voice": "bk_voice_instructional_v1",
        "emotion_bias": {"warmth": 0.5, "formality": 0.6}
    }
}


# ============================================
# A/B Testing Voice Variants
# ============================================

VOICE_VARIANTS = {
    "A": "bk_voice_conv_v1",
    "B": "bk_voice_expressive_v1"
}


def assign_variant(user_id: str) -> str:
    """Sticky A/B variant assignment based on user ID hash"""
    return "A" if hash(user_id) % 2 == 0 else "B"


# ============================================
# Voice Helper Functions
# ============================================

def load_voice_profile(voice_id: str) -> VoiceProfile:
    """Load a voice profile by ID"""
    if voice_id in VOICE_MAP:
        voice_id = VOICE_MAP[voice_id]
    return VOICE_PROFILES.get(voice_id, VOICE_PROFILES["bk_voice_conv_v1"]).model_copy(deep=True)


def resolve_voice(persona_id: str) -> VoiceProfile:
    """Resolve voice profile from persona"""
    persona = PERSONAS.get(persona_id, PERSONAS["default"])
    voice = load_voice_profile(persona["voice"])
    
    # Apply persona emotion bias
    for key, value in persona["emotion_bias"].items():
        if hasattr(voice.emotion_bias, key):
            setattr(voice.emotion_bias, key, value)
    
    return voice


def infer_emotion_from_stt(stt: STTResult) -> Dict:
    """Infer emotional state from speech-to-text acoustic features"""
    emotion = {}
    
    # Agitation detection
    if stt.rms_energy > 0.7 and stt.pitch_variance > 0.5:
        emotion["user_agitated"] = True
    
    # Uncertainty detection
    if stt.speech_rate < 0.8:
        emotion["user_uncertain"] = True
    
    # Seriousness detection
    if stt.pitch_mean < 160:
        emotion["user_serious"] = True
    
    # Excitement detection
    if stt.rms_energy > 0.6 and stt.speech_rate > 1.1:
        emotion["user_excited"] = True
    
    return emotion


def update_emotion_state(state: EmotionalState, context: str):
    """Update emotional state based on context"""
    context_modifiers = {
        "user_frustrated": {"warmth": 0.15},
        "user_agitated": {"warmth": 0.1, "assertiveness": -0.1},
        "user_uncertain": {"warmth": 0.1, "formality": -0.05},
        "user_serious": {"formality": 0.1},
        "user_excited": {"warmth": 0.05, "assertiveness": 0.05},
        "instruction": {"formality": 0.1},
        "challenge": {"assertiveness": 0.1},
        "reflection": {"warmth": 0.05, "formality": -0.05},
    }
    
    modifiers = context_modifiers.get(context, {})
    for key, delta in modifiers.items():
        current = getattr(state, key)
        setattr(state, key, min(1.0, max(0.0, current + delta)))


def apply_emotional_state(voice: VoiceProfile, state: EmotionalState):
    """Apply emotional state to voice profile"""
    voice.emotion_bias.warmth = min(1.0, voice.emotion_bias.warmth + (state.warmth - 0.5) * 0.3)
    voice.emotion_bias.formality = min(1.0, voice.emotion_bias.formality + (state.formality - 0.5) * 0.3)
    voice.emotion_bias.assertiveness = min(1.0, voice.emotion_bias.assertiveness + (state.assertiveness - 0.5) * 0.3)


def apply_context_modifiers(context: str, voice: VoiceProfile):
    """Apply context-specific modifiers to voice"""
    if context == "reflection":
        voice.prosody.rate *= 0.9
    elif context == "instruction":
        voice.emotion_bias.formality += 0.2
    elif context == "excitement":
        voice.prosody.rate *= 1.05
        voice.prosody.pitch_variance += 0.1


def compute_text_hash(text: str) -> str:
    """Compute SHA256 hash of text for audit"""
    return hashlib.sha256(text.encode()).hexdigest()


# ============================================
# Voice Session Manager
# ============================================

class VoiceSession:
    """Manages voice session state with interrupt support"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.speaking = False
        self.emotion_state = EmotionalState()
        self.variant = assign_variant(user_id)
        self.current_voice_id = VOICE_VARIANTS[self.variant]
    
    def interrupt(self):
        """Interrupt current speech"""
        self.speaking = False
    
    def start_speaking(self):
        """Mark session as speaking"""
        self.speaking = True
    
    def stop_speaking(self):
        """Mark session as not speaking"""
        self.speaking = False
    
    def get_voice(self, persona: str = "default") -> VoiceProfile:
        """Get voice profile for current session"""
        voice = resolve_voice(persona)
        apply_emotional_state(voice, self.emotion_state)
        return voice
    
    def process_stt_result(self, stt: STTResult):
        """Process STT result and update emotional state"""
        emotions = infer_emotion_from_stt(stt)
        for emotion_key in emotions:
            update_emotion_state(self.emotion_state, emotion_key)


# ============================================
# Voice Metrics Tracking
# ============================================

class VoiceMetrics(BaseModel):
    user_id: str
    variant: str
    interrupt_rate: float = 0.0
    avg_response_length: float = 0.0
    conversation_duration: float = 0.0
    total_interactions: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
