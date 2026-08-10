"""Incident Reporting"""

from typing import Dict, Any, List
from datetime import datetime, timezone


class IncidentReport:
    """Generate incident reports"""
    
    def __init__(self, incident_trigger):
        self.incident_trigger = incident_trigger
    
    def generate_report(
        self,
        incident_id: str,
    ) -> Dict[str, Any]:
        """Generate incident report"""
        incident = self.incident_trigger.get_incident(incident_id)
        
        if not incident:
            return {"error": "Incident not found"}
        
        return {
            "report_generated_at": datetime.now(timezone.utc).isoformat(),
            "incident": incident.to_dict(),
            "timeline": self._generate_timeline(incident),
            "impact_assessment": self._assess_impact(incident),
            "recommendations": self._generate_recommendations(incident),
        }
    
    def generate_summary_report(self) -> Dict[str, Any]:
        """Generate summary of all incidents"""
        incidents = self.incident_trigger.list_incidents()
        
        return {
            "report_generated_at": datetime.now(timezone.utc).isoformat(),
            "total_incidents": len(incidents),
            "by_severity": self._group_by_severity(incidents),
            "by_type": self._group_by_type(incidents),
            "by_status": self._group_by_status(incidents),
        }
    
    def _generate_timeline(self, incident) -> List[Dict[str, Any]]:
        """Generate incident timeline"""
        return [
            {
                "timestamp": incident.triggered_at,
                "event": "Incident triggered",
                "details": incident.description,
            }
        ]
    
    def _assess_impact(self, incident) -> Dict[str, Any]:
        """Assess incident impact"""
        return {
            "severity": incident.severity.value,
            "affected_systems": incident.context.get("affected_systems", []),
            "estimated_impact": "To be determined",
        }
    
    def _generate_recommendations(self, incident) -> List[str]:
        """Generate recommendations"""
        return [
            "Investigate root cause",
            "Implement corrective actions",
            "Update policies as needed",
        ]
    
    def _group_by_severity(self, incidents) -> Dict[str, int]:
        """Group incidents by severity"""
        groups = {}
        for incident in incidents:
            severity = incident.severity.value
            groups[severity] = groups.get(severity, 0) + 1
        return groups
    
    def _group_by_type(self, incidents) -> Dict[str, int]:
        """Group incidents by type"""
        groups = {}
        for incident in incidents:
            itype = incident.incident_type.value
            groups[itype] = groups.get(itype, 0) + 1
        return groups
    
    def _group_by_status(self, incidents) -> Dict[str, int]:
        """Group incidents by status"""
        groups = {}
        for incident in incidents:
            status = incident.status
            groups[status] = groups.get(status, 0) + 1
        return groups
