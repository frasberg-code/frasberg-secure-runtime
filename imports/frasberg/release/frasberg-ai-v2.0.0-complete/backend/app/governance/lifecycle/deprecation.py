"""Deprecation Tracking"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import uuid


@dataclass
class DeprecationNotice:
    """Deprecation notice"""
    notice_id: str
    feature_name: str
    deprecated_in: str
    removal_in: str
    announced_at: str
    reason: str
    migration_guide: str
    alternative: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "notice_id": self.notice_id,
            "feature_name": self.feature_name,
            "deprecated_in": self.deprecated_in,
            "removal_in": self.removal_in,
            "announced_at": self.announced_at,
            "reason": self.reason,
            "migration_guide": self.migration_guide,
            "alternative": self.alternative,
        }


class DeprecationTracker:
    """Track deprecated features"""
    
    def __init__(self):
        self._deprecations: Dict[str, DeprecationNotice] = {}
    
    def deprecate_feature(
        self,
        feature_name: str,
        deprecated_in: str,
        removal_in: str,
        reason: str,
        migration_guide: str,
        alternative: Optional[str] = None,
    ) -> DeprecationNotice:
        """Mark a feature as deprecated"""
        notice = DeprecationNotice(
            notice_id=str(uuid.uuid4()),
            feature_name=feature_name,
            deprecated_in=deprecated_in,
            removal_in=removal_in,
            announced_at=datetime.now(timezone.utc).isoformat(),
            reason=reason,
            migration_guide=migration_guide,
            alternative=alternative,
        )
        
        self._deprecations[feature_name] = notice
        return notice
    
    def get_deprecation_notice(
        self,
        feature_name: str,
    ) -> Optional[DeprecationNotice]:
        """Get deprecation notice for feature"""
        return self._deprecations.get(feature_name)
    
    def list_deprecations(self) -> List[DeprecationNotice]:
        """List all deprecations"""
        return list(self._deprecations.values())
    
    def is_deprecated(self, feature_name: str) -> bool:
        """Check if feature is deprecated"""
        return feature_name in self._deprecations
    
    def remove_feature(self, feature_name: str) -> bool:
        """Remove deprecated feature"""
        if feature_name in self._deprecations:
            del self._deprecations[feature_name]
            return True
        return False
