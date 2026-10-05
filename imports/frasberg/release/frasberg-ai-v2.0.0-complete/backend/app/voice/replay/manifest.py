"""Replay Manifest for Frasberg AI."""
from typing import Dict, List
from datetime import datetime
import json
import hashlib


class ReplayManifest:
    """
    Manifest for voice replay sessions.
    Provides tamper-evident record of all voice interactions.
    """
    
    def __init__(self):
        """Initialize manifest."""
        self.manifests: Dict[str, Dict] = {}
    
    def create_manifest(self, session_id: str, metadata: Optional[Dict] = None) -> str:
        """
        Create replay manifest for session.
        
        Args:
            session_id: Session ID
            metadata: Session metadata
            
        Returns:
            Manifest ID
        """
        manifest_id = f"manifest_{session_id}"
        
        self.manifests[manifest_id] = {
            "manifest_id": manifest_id,
            "session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
            "recordings": [],
            "chain_hash": None
        }
        
        return manifest_id
    
    def add_recording(self, manifest_id: str, recording_id: str,
                     fingerprint: str, metadata: Dict) -> None:
        """
        Add recording to manifest.
        
        Args:
            manifest_id: Manifest ID
            recording_id: Recording ID
            fingerprint: Recording fingerprint
            metadata: Recording metadata
        """
        if manifest_id not in self.manifests:
            return
        
        manifest = self.manifests[manifest_id]
        
        entry = {
            "recording_id": recording_id,
            "fingerprint": fingerprint,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        manifest["recordings"].append(entry)
        # Update chain hash
        self._update_chain_hash(manifest_id)
    
    def _update_chain_hash(self, manifest_id: str) -> None:
        """Update manifest chain hash."""
        manifest = self.manifests[manifest_id]
        
        # Create hash chain from all recordings
        chain_data = ""
        for recording in manifest["recordings"]:
            chain_data += recording["fingerprint"]
        
        manifest["chain_hash"] = hashlib.sha256(chain_data.encode()).hexdigest()
    
    def get_manifest(self, manifest_id: str) -> Optional[Dict]:
        """Get manifest by ID."""
        return self.manifests.get(manifest_id)
    
    def export_manifest(self, manifest_id: str) -> Optional[str]:
        """
        Export manifest as JSON.
        
        Args:
            manifest_id: Manifest ID
            
        Returns:
            JSON string
        """
        manifest = self.get_manifest(manifest_id)
        if not manifest:
            return None
        
        return json.dumps(manifest, indent=2)
    
    def verify_manifest(self, manifest_id: str) -> Dict:
        """
        Verify manifest integrity.
        
        Args:
            manifest_id: Manifest ID
            
        Returns:
            Verification result
        """
        manifest = self.get_manifest(manifest_id)
        if not manifest:
            return {"valid": False, "error": "Manifest not found"}
        
        # Recalculate chain hash
        saved_hash = manifest["chain_hash"]
        self._update_chain_hash(manifest_id)
        calculated_hash = manifest["chain_hash"]
        
        # Restore original (in case of mismatch)
        manifest["chain_hash"] = saved_hash
        
        return {
            "valid": saved_hash == calculated_hash,
            "manifest_id": manifest_id,
            "recording_count": len(manifest["recordings"]),
            "chain_hash": saved_hash
        }


# Global manifest manager
replay_manifest = ReplayManifest()
