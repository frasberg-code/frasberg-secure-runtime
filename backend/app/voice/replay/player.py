"""Voice Replay Player for Frasberg AI."""
from typing import Optional, Dict
from datetime import datetime
import json


class VoiceReplayPlayer:
    """
    Voice replay system for audit and verification.
    Plays back recorded voice interactions with full context.
    """
    
    def __init__(self):
        """Initialize replay player."""
        self.recordings: Dict[str, Dict] = {}
    
    def record_interaction(self, session_id: str, voice_id: str,
                          text: str, audio_data: bytes,
                          metadata: Optional[Dict] = None) -> str:
        """
        Record voice interaction.
        
        Args:
            session_id: Session identifier
            voice_id: Voice profile used
            text: Text that was synthesized
            audio_data: Audio output
            metadata: Additional metadata
            
        Returns:
            Recording ID
        """
        recording_id = f"{session_id}_{datetime.utcnow().timestamp()}"
        
        self.recordings[recording_id] = {
            "recording_id": recording_id,
            "session_id": session_id,
            "voice_id": voice_id,
            "text": text,
            "audio_data": audio_data,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return recording_id
    
    def get_recording(self, recording_id: str) -> Optional[Dict]:
        """
        Get recording by ID.
        
        Args:
            recording_id: Recording identifier
            
        Returns:
            Recording data or None
        """
        return self.recordings.get(recording_id)
    
    def list_recordings(self, session_id: Optional[str] = None) -> list:
        """
        List recordings.
        
        Args:
            session_id: Optional session filter
            
        Returns:
            List of recordings (without audio data)
        """
        recordings = self.recordings.values()
        
        if session_id:
            recordings = [r for r in recordings if r["session_id"] == session_id]
        
        # Return without audio data for listing
        return [
            {k: v for k, v in r.items() if k != "audio_data"}
            for r in recordings
        ]
    
    def export_recording(self, recording_id: str, format: str = "json") -> Optional[str]:
        """
        Export recording for audit.
        
        Args:
            recording_id: Recording ID
            format: Export format (json, wav)
            
        Returns:
            Exported data
        """
        recording = self.get_recording(recording_id)
        if not recording:
            return None
        
        if format == "json":
            # Export metadata without audio
            export_data = {k: v for k, v in recording.items() if k != "audio_data"}
            export_data["audio_size_bytes"] = len(recording["audio_data"])
            return json.dumps(export_data, indent=2)
        
        return None


# Global replay player
replay_player = VoiceReplayPlayer()
