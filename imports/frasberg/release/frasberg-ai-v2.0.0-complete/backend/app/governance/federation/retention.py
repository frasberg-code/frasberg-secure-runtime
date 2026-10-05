"""
Retention Compliance Manager

Manages data retention policies across jurisdictions, ensuring compliance
with varying retention requirements (GDPR, CCPA, SOX, HIPAA, etc.).
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum


class RetentionAction(Enum):
    """Actions for retention management"""
    RETAIN = "retain"
    DELETE = "delete"
    ARCHIVE = "archive"
    REVIEW = "review"


@dataclass
class RetentionRule:
    """Retention rule for data"""
    rule_id: str
    data_type: str
    retention_days: int
    jurisdiction: str
    action_after_retention: RetentionAction
    legal_hold_exempt: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "data_type": self.data_type,
            "retention_days": self.retention_days,
            "jurisdiction": self.jurisdiction,
            "action_after_retention": self.action_after_retention.value,
            "legal_hold_exempt": self.legal_hold_exempt,
        }


@dataclass
class RetentionRecord:
    """Record of data retention status"""
    record_id: str
    data_type: str
    created_at: str
    retention_until: str
    action_due: RetentionAction
    under_legal_hold: bool = False
    
    def is_expired(self) -> bool:
        """Check if retention period has expired"""
        now = datetime.now(timezone.utc)
        retention_date = datetime.fromisoformat(self.retention_until.replace('Z', '+00:00'))
        return now > retention_date and not self.under_legal_hold


class RetentionManager:
    """
    Manages data retention across jurisdictions.
    
    Ensures compliance with retention requirements from multiple
    jurisdictions while respecting legal holds.
    """
    
    def __init__(self):
        """Initialize retention manager"""
        self._retention_rules: Dict[str, RetentionRule] = {}
        self._retention_records: Dict[str, RetentionRecord] = {}
        self._legal_holds: Dict[str, List[str]] = {}  # hold_id -> record_ids
        self._initialize_default_rules()
    
    def add_retention_rule(self, rule: RetentionRule) -> None:
        """
        Add retention rule.
        
        Args:
            rule: Retention rule to add
        """
        self._retention_rules[rule.rule_id] = rule
    
    def get_retention_period(
        self,
        data_type: str,
        jurisdictions: List[str],
    ) -> int:
        """
        Get maximum retention period across jurisdictions.
        
        Args:
            data_type: Type of data
            jurisdictions: Applicable jurisdictions
            
        Returns:
            Retention period in days
        """
        max_retention = 0
        
        for rule in self._retention_rules.values():
            if rule.data_type == data_type and rule.jurisdiction in jurisdictions:
                max_retention = max(max_retention, rule.retention_days)
        
        return max_retention
    
    def create_retention_record(
        self,
        record_id: str,
        data_type: str,
        jurisdictions: List[str],
    ) -> RetentionRecord:
        """
        Create retention record for data.
        
        Args:
            record_id: Unique record identifier
            data_type: Type of data
            jurisdictions: Applicable jurisdictions
            
        Returns:
            Created retention record
        """
        # Get retention period
        retention_days = self.get_retention_period(data_type, jurisdictions)
        
        # Calculate retention date
        now = datetime.now(timezone.utc)
        retention_until = now + timedelta(days=retention_days)
        
        # Determine action
        action = RetentionAction.DELETE
        for rule in self._retention_rules.values():
            if rule.data_type == data_type and rule.jurisdiction in jurisdictions:
                action = rule.action_after_retention
                break
        
        record = RetentionRecord(
            record_id=record_id,
            data_type=data_type,
            created_at=now.isoformat(),
            retention_until=retention_until.isoformat(),
            action_due=action,
        )
        
        self._retention_records[record_id] = record
        return record
    
    def check_retention_status(
        self,
        record_id: str,
    ) -> Dict[str, Any]:
        """
        Check retention status of record.
        
        Args:
            record_id: Record to check
            
        Returns:
            Retention status
        """
        record = self._retention_records.get(record_id)
        
        if not record:
            return {
                "found": False,
                "error": "Record not found in retention system",
            }
        
        is_expired = record.is_expired()
        
        return {
            "found": True,
            "record_id": record_id,
            "retention_until": record.retention_until,
            "expired": is_expired,
            "action_due": record.action_due.value,
            "under_legal_hold": record.under_legal_hold,
            "can_delete": is_expired and not record.under_legal_hold,
        }
    
    def get_expired_records(self) -> List[RetentionRecord]:
        """
        Get all expired records ready for action.
        
        Returns:
            List of expired records
        """
        expired = []
        
        for record in self._retention_records.values():
            if record.is_expired():
                expired.append(record)
        
        return expired
    
    def apply_legal_hold(
        self,
        hold_id: str,
        record_ids: List[str],
    ) -> Dict[str, Any]:
        """
        Apply legal hold to records.
        
        Args:
            hold_id: Unique identifier for legal hold
            record_ids: Records to place under hold
            
        Returns:
            Result of hold application
        """
        held_records = []
        not_found = []
        
        for record_id in record_ids:
            if record_id in self._retention_records:
                record = self._retention_records[record_id]
                record.under_legal_hold = True
                held_records.append(record_id)
            else:
                not_found.append(record_id)
        
        self._legal_holds[hold_id] = held_records
        
        return {
            "hold_id": hold_id,
            "records_held": len(held_records),
            "records_not_found": not_found,
            "success": len(not_found) == 0,
        }
    
    def release_legal_hold(
        self,
        hold_id: str,
    ) -> Dict[str, Any]:
        """
        Release legal hold.
        
        Args:
            hold_id: Legal hold to release
            
        Returns:
            Result of hold release
        """
        if hold_id not in self._legal_holds:
            return {
                "success": False,
                "error": "Legal hold not found",
            }
        
        record_ids = self._legal_holds[hold_id]
        released = []
        
        for record_id in record_ids:
            if record_id in self._retention_records:
                record = self._retention_records[record_id]
                record.under_legal_hold = False
                released.append(record_id)
        
        del self._legal_holds[hold_id]
        
        return {
            "success": True,
            "hold_id": hold_id,
            "records_released": len(released),
        }
    
    def extend_retention(
        self,
        record_id: str,
        additional_days: int,
    ) -> Dict[str, Any]:
        """
        Extend retention period for a record.
        
        Args:
            record_id: Record to extend retention for
            additional_days: Days to add to retention period
            
        Returns:
            Result of extension
        """
        if record_id not in self._retention_records:
            return {
                "success": False,
                "error": "Record not found",
            }
        
        record = self._retention_records[record_id]
        
        # Parse current retention date
        current_date = datetime.fromisoformat(record.retention_until.replace('Z', '+00:00'))
        
        # Add additional days
        new_date = current_date + timedelta(days=additional_days)
        record.retention_until = new_date.isoformat()
        
        return {
            "success": True,
            "record_id": record_id,
            "new_retention_date": record.retention_until,
        }
    
    def generate_retention_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive retention report.
        
        Returns:
            Retention status report
        """
        total_records = len(self._retention_records)
        expired_records = len(self.get_expired_records())
        under_hold = sum(
            1 for r in self._retention_records.values()
            if r.under_legal_hold
        )
        
        # Group by data type
        by_data_type: Dict[str, int] = {}
        for record in self._retention_records.values():
            by_data_type[record.data_type] = by_data_type.get(record.data_type, 0) + 1
        
        return {
            "total_records": total_records,
            "expired_records": expired_records,
            "under_legal_hold": under_hold,
            "active_legal_holds": len(self._legal_holds),
            "by_data_type": by_data_type,
            "compliance_status": "COMPLIANT" if expired_records == 0 or under_hold > 0 else "ACTION_REQUIRED",
        }
    
    def _initialize_default_rules(self) -> None:
        """Initialize default retention rules"""
        import uuid
        
        # Financial records (SOX)
        self.add_retention_rule(RetentionRule(
            rule_id=str(uuid.uuid4()),
            data_type="financial",
            retention_days=2555,  # 7 years
            jurisdiction="SOX",
            action_after_retention=RetentionAction.ARCHIVE,
        ))
        
        # Healthcare records (HIPAA)
        self.add_retention_rule(RetentionRule(
            rule_id=str(uuid.uuid4()),
            data_type="health",
            retention_days=2555,  # 7 years
            jurisdiction="HIPAA",
            action_after_retention=RetentionAction.ARCHIVE,
        ))
        
        # Audit logs (general)
        self.add_retention_rule(RetentionRule(
            rule_id=str(uuid.uuid4()),
            data_type="audit_log",
            retention_days=2555,  # 7 years
            jurisdiction="US_FEDERAL",
            action_after_retention=RetentionAction.ARCHIVE,
        ))
        
        # GDPR - minimal retention
        self.add_retention_rule(RetentionRule(
            rule_id=str(uuid.uuid4()),
            data_type="personal_data",
            retention_days=365,  # 1 year unless longer needed
            jurisdiction="EU_GENERAL",
            action_after_retention=RetentionAction.DELETE,
        ))
