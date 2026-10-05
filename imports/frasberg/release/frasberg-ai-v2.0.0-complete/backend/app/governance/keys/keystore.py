"""Key Storage and Management"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import hashlib
import uuid


@dataclass
class CryptoKey:
    """Cryptographic key"""
    key_id: str
    key_type: str
    created_at: str
    expires_at: Optional[str]
    status: str
    key_material: str
    metadata: Dict[str, Any]


class KeyStore:
    """Secure key storage and management"""
    
    def __init__(self):
        self._keys: Dict[str, CryptoKey] = {}
        self._active_key_id: Optional[str] = None
    
    def generate_key(
        self,
        key_type: str = "signing",
        validity_days: int = 365,
    ) -> CryptoKey:
        """Generate a new cryptographic key"""
        key_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=validity_days)
        
        # Simplified key generation
        key_material = hashlib.sha256(
            f"{key_id}{now.isoformat()}".encode()
        ).hexdigest()
        
        key = CryptoKey(
            key_id=key_id,
            key_type=key_type,
            created_at=now.isoformat(),
            expires_at=expires.isoformat(),
            status="active",
            key_material=key_material,
            metadata={"version": "1.0"},
        )
        
        self._keys[key_id] = key
        if self._active_key_id is None:
            self._active_key_id = key_id
        
        return key
    
    def get_active_key(self) -> Optional[CryptoKey]:
        """Get the currently active key"""
        if self._active_key_id:
            return self._keys.get(self._active_key_id)
        return None
    
    def revoke_key(self, key_id: str) -> bool:
        """Revoke a key"""
        if key_id in self._keys:
            self._keys[key_id].status = "revoked"
            if self._active_key_id == key_id:
                self._active_key_id = None
            return True
        return False
    
    def list_keys(self) -> list[CryptoKey]:
        """List all keys"""
        return list(self._keys.values())
