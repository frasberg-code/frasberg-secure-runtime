"""Key Rotation Management"""

from typing import Dict, Any, List
from datetime import datetime, timezone


class KeyRotation:
    """Manages key rotation schedules and operations"""
    
    def __init__(self, keystore):
        self.keystore = keystore
        self._rotation_history: List[Dict[str, Any]] = []
    
    def rotate_key(self, reason: str = "scheduled") -> Dict[str, Any]:
        """Perform key rotation"""
        old_key = self.keystore.get_active_key()
        new_key = self.keystore.generate_key()
        
        if old_key:
            self.keystore.revoke_key(old_key.key_id)
        
        rotation = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "old_key_id": old_key.key_id if old_key else None,
            "new_key_id": new_key.key_id,
            "reason": reason,
        }
        
        self._rotation_history.append(rotation)
        return rotation
    
    def get_rotation_history(self) -> List[Dict[str, Any]]:
        """Get key rotation history"""
        return self._rotation_history.copy()
    
    def check_rotation_needed(self) -> bool:
        """Check if key rotation is needed"""
        active_key = self.keystore.get_active_key()
        if not active_key:
            return True
        
        if active_key.expires_at:
            expires = datetime.fromisoformat(active_key.expires_at.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_until_expiry = (expires - now).days
            return days_until_expiry < 30
        
        return False
