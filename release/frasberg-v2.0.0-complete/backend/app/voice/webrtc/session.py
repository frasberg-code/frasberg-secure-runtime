"""WebRTC Session Management for Frasberg."""
from typing import Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class WebRTCSession:
    """WebRTC session state."""
    session_id: str
    peer_a: str
    peer_b: Optional[str] = None
    state: str = "initializing"  # initializing, connected, closed
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    connected_at: Optional[str] = None
    closed_at: Optional[str] = None
    metadata: Dict = field(default_factory=dict)


class WebRTCSessionManager:
    """Manages WebRTC session lifecycle."""
    
    def __init__(self):
        """Initialize session manager."""
        self.sessions: Dict[str, WebRTCSession] = {}
    
    def create_session(self, peer_a: str, metadata: Optional[Dict] = None) -> str:
        """
        Create new WebRTC session.
        
        Args:
            peer_a: First peer ID
            metadata: Optional session metadata
            
        Returns:
            Session ID
        """
        session_id = str(uuid.uuid4())
        session = WebRTCSession(
            session_id=session_id,
            peer_a=peer_a,
            metadata=metadata or {}
        )
        self.sessions[session_id] = session
        return session_id
    
    def join_session(self, session_id: str, peer_b: str) -> bool:
        """
        Join existing session.
        
        Args:
            session_id: Session to join
            peer_b: Second peer ID
            
        Returns:
            True if successful
        """
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        session.peer_b = peer_b
        return True
    
    def mark_connected(self, session_id: str) -> None:
        """Mark session as connected."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.state = "connected"
            session.connected_at = datetime.utcnow().isoformat()
    
    def close_session(self, session_id: str) -> None:
        """Close session."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.state = "closed"
            session.closed_at = datetime.utcnow().isoformat()
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session details."""
        session = self.sessions.get(session_id)
        return vars(session) if session else None
    
    def list_active_sessions(self) -> list:
        """List all active sessions."""
        return [
            vars(s) for s in self.sessions.values()
            if s.state == "connected"
        ]


# Global session manager
session_manager = WebRTCSessionManager()
