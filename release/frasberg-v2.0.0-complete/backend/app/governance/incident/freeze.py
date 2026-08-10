"""System Freeze for Litigation Hold"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
import uuid


@dataclass
class FreezeOrder:
    """Litigation hold freeze order"""
    freeze_id: str
    reason: str
    scope: List[str]
    initiated_by: str
    initiated_at: str
    status: str = "active"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "freeze_id": self.freeze_id,
            "reason": self.reason,
            "scope": self.scope,
            "initiated_by": self.initiated_by,
            "initiated_at": self.initiated_at,
            "status": self.status,
        }


class SystemFreeze:
    """Manage system freezes for litigation holds"""
    
    def __init__(self):
        self._freezes: Dict[str, FreezeOrder] = {}
        self._frozen_records: Dict[str, List[str]] = {}
    
    def initiate_freeze(
        self,
        reason: str,
        scope: List[str],
        initiated_by: str,
    ) -> FreezeOrder:
        """Initiate a system freeze"""
        freeze = FreezeOrder(
            freeze_id=str(uuid.uuid4()),
            reason=reason,
            scope=scope,
            initiated_by=initiated_by,
            initiated_at=datetime.now(timezone.utc).isoformat(),
        )
        
        self._freezes[freeze.freeze_id] = freeze
        return freeze
    
    def add_records_to_freeze(
        self,
        freeze_id: str,
        record_ids: List[str],
    ) -> bool:
        """Add records to freeze"""
        if freeze_id not in self._freezes:
            return False
        
        if freeze_id not in self._frozen_records:
            self._frozen_records[freeze_id] = []
        
        self._frozen_records[freeze_id].extend(record_ids)
        return True
    
    def is_frozen(self, record_id: str) -> bool:
        """Check if record is frozen"""
        for records in self._frozen_records.values():
            if record_id in records:
                return True
        return False
    
    def lift_freeze(self, freeze_id: str) -> bool:
        """Lift a freeze order"""
        if freeze_id in self._freezes:
            self._freezes[freeze_id].status = "lifted"
            return True
        return False
    
    def get_active_freezes(self) -> List[FreezeOrder]:
        """Get all active freezes"""
        return [f for f in self._freezes.values() if f.status == "active"]
