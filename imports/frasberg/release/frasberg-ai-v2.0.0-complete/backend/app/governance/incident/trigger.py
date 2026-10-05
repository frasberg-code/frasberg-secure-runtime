"""Incident Trigger Detection"""

from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import uuid


class IncidentSeverity(Enum):
    """Incident severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentType(Enum):
    """Types of incidents"""
    SECURITY_BREACH = "security_breach"
    DATA_LOSS = "data_loss"
    POLICY_VIOLATION = "policy_violation"
    LEGAL_HOLD = "legal_hold"
    SYSTEM_FAILURE = "system_failure"
    UNAUTHORIZED_ACCESS = "unauthorized_access"


@dataclass
class Incident:
    """Incident record"""
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    description: str
    triggered_at: str
    triggered_by: str
    context: Dict[str, Any]
    status: str = "open"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "incident_type": self.incident_type.value,
            "severity": self.severity.value,
            "description": self.description,
            "triggered_at": self.triggered_at,
            "triggered_by": self.triggered_by,
            "context": self.context,
            "status": self.status,
        }


class IncidentTrigger:
    """Detect and trigger incident response"""
    
    def __init__(self):
        self._incidents: Dict[str, Incident] = {}
        self._triggers: Dict[str, Callable] = {}
        self._handlers: List[Callable] = []
    
    def trigger_incident(
        self,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        description: str,
        triggered_by: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Incident:
        """Trigger a new incident"""
        incident = Incident(
            incident_id=str(uuid.uuid4()),
            incident_type=incident_type,
            severity=severity,
            description=description,
            triggered_at=datetime.now(timezone.utc).isoformat(),
            triggered_by=triggered_by,
            context=context or {},
        )
        
        self._incidents[incident.incident_id] = incident
        
        # Call registered handlers
        for handler in self._handlers:
            handler(incident)
        
        return incident
    
    def register_handler(self, handler: Callable) -> None:
        """Register incident handler"""
        self._handlers.append(handler)
    
    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Get incident by ID"""
        return self._incidents.get(incident_id)
    
    def list_incidents(
        self,
        status: Optional[str] = None,
        severity: Optional[IncidentSeverity] = None,
    ) -> List[Incident]:
        """List incidents with filters"""
        incidents = list(self._incidents.values())
        
        if status:
            incidents = [i for i in incidents if i.status == status]
        
        if severity:
            incidents = [i for i in incidents if i.severity == severity]
        
        return incidents
    
    def resolve_incident(self, incident_id: str) -> bool:
        """Mark incident as resolved"""
        if incident_id in self._incidents:
            self._incidents[incident_id].status = "resolved"
            return True
        return False
