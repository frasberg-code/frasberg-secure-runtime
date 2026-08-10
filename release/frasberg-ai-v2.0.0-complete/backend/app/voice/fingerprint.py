"""Voice Fingerprinting (Non-Biometric) for Frasberg AI."""
import hashlib
from typing import Dict, Optional


class VoiceFingerprint:
    """
    Voice fingerprinting system for identity verification.
    
    NOTE: This is NOT biometric identification. This system creates
    technical fingerprints of voice OUTPUTS (not individuals) for
    audit trail purposes and replay verification.
    """
    
    @staticmethod
    def generate_fingerprint(audio_data: bytes, metadata: dict) -> str:
        """
        Generate fingerprint for audio output.
        
        Args:
            audio_data: Audio bytes
            metadata: Context metadata (voice_id, timestamp, session_id)
            
        Returns:
            Fingerprint hash
        """
        # Combine audio and metadata for fingerprint
        fingerprint_data = audio_data + str(metadata).encode()
        return hashlib.sha256(fingerprint_data).hexdigest()
    
    @staticmethod
    def verify_fingerprint(audio_data: bytes, metadata: dict, 
                          expected_fingerprint: str) -> bool:
        """
        Verify audio fingerprint.
        
        Args:
            audio_data: Audio to verify
            metadata: Context metadata
            expected_fingerprint: Expected fingerprint hash
            
        Returns:
            True if fingerprint matches
        """
        actual = VoiceFingerprint.generate_fingerprint(audio_data, metadata)
        return actual == expected_fingerprint
    
    @staticmethod
    def create_fingerprint_record(audio_data: bytes, voice_id: str,
                                 session_id: str, timestamp: str) -> Dict:
        """
        Create complete fingerprint record for audit trail.
        
        Args:
            audio_data: Audio bytes
            voice_id: Voice profile used
            session_id: Session identifier
            timestamp: ISO timestamp
            
        Returns:
            Fingerprint record
        """
        metadata = {
            "voice_id": voice_id,
            "session_id": session_id,
            "timestamp": timestamp
        }
        
        fingerprint = VoiceFingerprint.generate_fingerprint(audio_data, metadata)
        
        return {
            "fingerprint": fingerprint,
            "voice_id": voice_id,
            "session_id": session_id,
            "timestamp": timestamp,
            "audio_size_bytes": len(audio_data)
        }
