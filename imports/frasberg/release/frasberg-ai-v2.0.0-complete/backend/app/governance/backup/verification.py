"""Backup Verification"""

from typing import Dict, Any, List
import hashlib
import json


class BackupVerifier:
    """Verify backup integrity"""
    
    def __init__(self, snapshot_manager):
        self.snapshot_manager = snapshot_manager
    
    def verify_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        """Verify a snapshot's integrity"""
        snapshot = self.snapshot_manager.get_snapshot(snapshot_id)
        
        if not snapshot:
            return {
                "valid": False,
                "error": "Snapshot not found",
            }
        
        # Recompute checksum
        data_str = json.dumps(snapshot.state_data, sort_keys=True)
        computed = hashlib.sha256(data_str.encode()).hexdigest()
        
        valid = computed == snapshot.checksum
        
        return {
            "valid": valid,
            "snapshot_id": snapshot_id,
            "stored_checksum": snapshot.checksum,
            "computed_checksum": computed,
            "match": valid,
        }
    
    def verify_all_snapshots(self) -> Dict[str, Any]:
        """Verify all snapshots"""
        snapshots = self.snapshot_manager.list_snapshots()
        results = []
        
        for snapshot in snapshots:
            result = self.verify_snapshot(snapshot.snapshot_id)
            results.append(result)
        
        valid_count = sum(1 for r in results if r["valid"])
        
        return {
            "total_snapshots": len(results),
            "valid_snapshots": valid_count,
            "invalid_snapshots": len(results) - valid_count,
            "all_valid": valid_count == len(results),
            "results": results,
        }
