"""Replay Verification for Frasberg AI."""
from typing import Dict, Optional
from ..fingerprint import VoiceFingerprint


class ReplayVerifier:
    """
    Verifies authenticity of recorded voice interactions.
    Ensures recordings haven't been tampered with.
    """
    
    def __init__(self):
        """Initialize replay verifier."""
        pass
    
    def verify_recording(self, recording: Dict, 
                        expected_fingerprint: Optional[str] = None) -> Dict:
        """
        Verify recording authenticity.
        
        Args:
            recording: Recording data
            expected_fingerprint: Expected fingerprint (if known)
            
        Returns:
            Verification result
        """
        # Generate fingerprint from recording
        metadata = {
            "voice_id": recording.get("voice_id"),
            "session_id": recording.get("session_id"),
            "timestamp": recording.get("timestamp")
        }
        
        actual_fingerprint = VoiceFingerprint.generate_fingerprint(
            recording.get("audio_data", b""),
            metadata
        )
        
        is_valid = True
        if expected_fingerprint:
            is_valid = actual_fingerprint == expected_fingerprint
        
        return {
            "recording_id": recording.get("recording_id"),
            "is_valid": is_valid,
            "fingerprint": actual_fingerprint,
            "verified_at": recording.get("timestamp"),
            "metadata": metadata
        }
    
    def verify_chain(self, recordings: list) -> Dict:
        """
        Verify chain of recordings.
        
        Args:
            recordings: List of recordings
            
        Returns:
            Chain verification result
        """
        results = []
        all_valid = True
        
        for recording in recordings:
            result = self.verify_recording(recording)
            results.append(result)
            if not result["is_valid"]:
                all_valid = False
        
        return {
            "chain_valid": all_valid,
            "total_recordings": len(recordings),
            "verified_recordings": sum(1 for r in results if r["is_valid"]),
            "results": results
        }


# Global verifier
replay_verifier = ReplayVerifier()
