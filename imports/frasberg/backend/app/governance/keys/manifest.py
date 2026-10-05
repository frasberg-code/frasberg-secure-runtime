"""Key Manifest Generation"""

from typing import Dict, Any, List
from datetime import datetime, timezone


class KeyManifest:
    """Generate manifests of cryptographic keys"""
    
    def __init__(self, keystore):
        self.keystore = keystore
    
    def generate_manifest(self) -> Dict[str, Any]:
        """Generate current key manifest"""
        keys = self.keystore.list_keys()
        active_key = self.keystore.get_active_key()
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_keys": len(keys),
            "active_key_id": active_key.key_id if active_key else None,
            "keys": [
                {
                    "key_id": k.key_id,
                    "key_type": k.key_type,
                    "created_at": k.created_at,
                    "status": k.status,
                    "expires_at": k.expires_at,
                }
                for k in keys
            ],
        }
    
    def export_public_manifest(self) -> Dict[str, Any]:
        """Export public key manifest (no secrets)"""
        manifest = self.generate_manifest()
        # Remove sensitive key material
        for key in manifest["keys"]:
            key.pop("key_material", None)
        return manifest
