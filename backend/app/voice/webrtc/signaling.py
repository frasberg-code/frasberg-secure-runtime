"""WebRTC Signaling for Frasberg AI."""
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class SignalingMessage:
    """WebRTC signaling message."""
    type: str  # offer, answer, ice-candidate
    session_id: str
    from_peer: str
    to_peer: Optional[str] = None
    payload: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class SignalingServer:
    """WebRTC signaling server for peer connection establishment."""
    
    def __init__(self):
        """Initialize signaling server."""
        self.sessions: Dict[str, List[SignalingMessage]] = {}
        self.peers: Dict[str, str] = {}  # peer_id -> session_id
    
    def create_session(self, peer_id: str) -> str:
        """
        Create new signaling session.
        
        Args:
            peer_id: Peer identifier
            
        Returns:
            Session ID
        """
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = []
        self.peers[peer_id] = session_id
        return session_id
    
    def send_offer(self, session_id: str, peer_id: str, sdp: Dict) -> None:
        """
        Send WebRTC offer.
        
        Args:
            session_id: Session ID
            peer_id: Peer sending offer
            sdp: Session Description Protocol
        """
        message = SignalingMessage(
            type="offer",
            session_id=session_id,
            from_peer=peer_id,
            payload={"sdp": sdp}
        )
        self.sessions[session_id].append(message)
    
    def send_answer(self, session_id: str, peer_id: str, sdp: Dict) -> None:
        """
        Send WebRTC answer.
        
        Args:
            session_id: Session ID
            peer_id: Peer sending answer
            sdp: Session Description Protocol
        """
        message = SignalingMessage(
            type="answer",
            session_id=session_id,
            from_peer=peer_id,
            payload={"sdp": sdp}
        )
        self.sessions[session_id].append(message)
    
    def send_ice_candidate(self, session_id: str, peer_id: str, 
                          candidate: Dict) -> None:
        """
        Send ICE candidate.
        
        Args:
            session_id: Session ID
            peer_id: Peer ID
            candidate: ICE candidate data
        """
        message = SignalingMessage(
            type="ice-candidate",
            session_id=session_id,
            from_peer=peer_id,
            payload={"candidate": candidate}
        )
        self.sessions[session_id].append(message)
    
    def get_messages(self, session_id: str, since: Optional[str] = None) -> List[Dict]:
        """
        Get signaling messages for session.
        
        Args:
            session_id: Session ID
            since: Optional timestamp to filter messages
            
        Returns:
            List of messages
        """
        if session_id not in self.sessions:
            return []
        
        messages = self.sessions[session_id]
        if since:
            messages = [m for m in messages if m.timestamp > since]
        
        return [vars(m) for m in messages]


# Global signaling server
signaling_server = SignalingServer()
