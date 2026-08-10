"""State Snapshot Management"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
import hashlib
import json
import uuid


@dataclass
class Snapshot:
    """System state snapshot"""
    snapshot_id: str
    created_at: str
    state_type: str
    state_data: Dict[str, Any]
    checksum: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "snapshot_id": self.snapshot_id,
            "created_at": self.created_at,
            "state_type": self.state_type,
            "checksum": self.checksum,
            "metadata": self.metadata,
        }


class SnapshotManager:
    """Create and manage state snapshots"""
    
    def __init__(self):
        self._snapshots: Dict[str, Snapshot] = {}
    
    def create_snapshot(
        self,
        state_type: str,
        state_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Snapshot:
        """Create a state snapshot"""
        snapshot_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Calculate checksum
        data_str = json.dumps(state_data, sort_keys=True)
        checksum = hashlib.sha256(data_str.encode()).hexdigest()
        
        snapshot = Snapshot(
            snapshot_id=snapshot_id,
            created_at=now,
            state_type=state_type,
            state_data=state_data,
            checksum=checksum,
            metadata=metadata or {},
        )
        
        self._snapshots[snapshot_id] = snapshot
        return snapshot
    
    def get_snapshot(self, snapshot_id: str) -> Optional[Snapshot]:
        """Get snapshot by ID"""
        return self._snapshots.get(snapshot_id)
    
    def list_snapshots(
        self,
        state_type: Optional[str] = None,
    ) -> list[Snapshot]:
        """List all snapshots"""
        snapshots = list(self._snapshots.values())
        if state_type:
            snapshots = [s for s in snapshots if s.state_type == state_type]
        return sorted(snapshots, key=lambda s: s.created_at, reverse=True)
    
    def delete_snapshot(self, snapshot_id: str) -> bool:
        """Delete a snapshot"""
        if snapshot_id in self._snapshots:
            del self._snapshots[snapshot_id]
            return True
        return False
