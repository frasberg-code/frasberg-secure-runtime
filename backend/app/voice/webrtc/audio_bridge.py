"""Audio Bridge for WebRTC in Frasberg AI."""
from typing import Optional, Dict
import asyncio
from datetime import datetime


class AudioBridge:
    """
    Audio bridge for WebRTC sessions.
    Handles audio routing between peers and Frasberg voice system.
    """
    
    def __init__(self):
        """Initialize audio bridge."""
        self.bridges: Dict[str, Dict] = {}
    
    def create_bridge(self, session_id: str) -> None:
        """
        Create audio bridge for session.
        
        Args:
            session_id: WebRTC session ID
        """
        self.bridges[session_id] = {
            "session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
            "audio_queue": asyncio.Queue(),
            "is_active": True
        }
    
    async def push_audio(self, session_id: str, audio_data: bytes, 
                        source: str) -> None:
        """
        Push audio to bridge.
        
        Args:
            session_id: Session ID
            audio_data: Audio bytes
            source: Audio source identifier
        """
        if session_id not in self.bridges:
            return
        
        bridge = self.bridges[session_id]
        await bridge["audio_queue"].put({
            "source": source,
            "data": audio_data,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def pull_audio(self, session_id: str, timeout: float = 1.0) -> Optional[Dict]:
        """
        Pull audio from bridge.
        
        Args:
            session_id: Session ID
            timeout: Timeout in seconds
            
        Returns:
            Audio packet or None
        """
        if session_id not in self.bridges:
            return None
        
        bridge = self.bridges[session_id]
        try:
            return await asyncio.wait_for(
                bridge["audio_queue"].get(),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            return None
    
    def close_bridge(self, session_id: str) -> None:
        """Close audio bridge."""
        if session_id in self.bridges:
            self.bridges[session_id]["is_active"] = False
    
    def get_bridge_status(self, session_id: str) -> Optional[Dict]:
        """Get bridge status."""
        bridge = self.bridges.get(session_id)
        if not bridge:
            return None
        
        return {
            "session_id": bridge["session_id"],
            "created_at": bridge["created_at"],
            "is_active": bridge["is_active"],
            "queue_size": bridge["audio_queue"].qsize()
        }


# Global audio bridge
audio_bridge = AudioBridge()
