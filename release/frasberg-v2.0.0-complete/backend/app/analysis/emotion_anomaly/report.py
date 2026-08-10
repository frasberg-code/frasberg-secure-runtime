"""Anomaly Reporting for Frasberg."""
from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class AnomalyReport:
    """Anomaly report entry."""
    report_id: str
    user_id: str
    emotion: str
    intensity: float
    baseline_mean: float
    baseline_stdev: float
    z_score: float
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    severity: str = "low"  # low, medium, high
    metadata: Dict = field(default_factory=dict)


class AnomalyReporter:
    """
    Reports and tracks emotional anomalies.
    
    Provides audit trail of detected anomalies for review and analysis.
    """
    
    def __init__(self):
        """Initialize anomaly reporter."""
        self.reports: List[AnomalyReport] = []
    
    def create_report(self, user_id: str, emotion: str, intensity: float,
                     baseline_mean: float, baseline_stdev: float,
                     z_score: float, metadata: Optional[Dict] = None) -> str:
        """
        Create anomaly report.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            intensity: Observed intensity
            baseline_mean: Baseline mean
            baseline_stdev: Baseline standard deviation
            z_score: Z-score
            metadata: Additional metadata
            
        Returns:
            Report ID
        """
        report_id = f"anomaly_{datetime.utcnow().timestamp()}"
        
        # Determine severity based on z-score
        if z_score > 3.0:
            severity = "high"
        elif z_score > 2.5:
            severity = "medium"
        else:
            severity = "low"
        
        report = AnomalyReport(
            report_id=report_id,
            user_id=user_id,
            emotion=emotion,
            intensity=intensity,
            baseline_mean=baseline_mean,
            baseline_stdev=baseline_stdev,
            z_score=z_score,
            severity=severity,
            metadata=metadata or {}
        )
        
        self.reports.append(report)
        
        # Keep only recent reports (last 1000)
        if len(self.reports) > 1000:
            self.reports = self.reports[-1000:]
        
        return report_id
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """Get report by ID."""
        for report in self.reports:
            if report.report_id == report_id:
                return vars(report)
        return None
    
    def list_reports(self, user_id: Optional[str] = None,
                    severity: Optional[str] = None,
                    limit: int = 100) -> List[Dict]:
        """
        List anomaly reports.
        
        Args:
            user_id: Optional user filter
            severity: Optional severity filter
            limit: Maximum reports to return
            
        Returns:
            List of reports
        """
        filtered = self.reports
        
        if user_id:
            filtered = [r for r in filtered if r.user_id == user_id]
        
        if severity:
            filtered = [r for r in filtered if r.severity == severity]
        
        # Return most recent first
        filtered = list(reversed(filtered))
        
        return [vars(r) for r in filtered[:limit]]
    
    def get_summary(self) -> Dict:
        """
        Get anomaly summary statistics.
        
        Returns:
            Summary statistics
        """
        total = len(self.reports)
        
        by_severity = {
            "low": sum(1 for r in self.reports if r.severity == "low"),
            "medium": sum(1 for r in self.reports if r.severity == "medium"),
            "high": sum(1 for r in self.reports if r.severity == "high")
        }
        
        by_emotion = {}
        for report in self.reports:
            emotion = report.emotion
            by_emotion[emotion] = by_emotion.get(emotion, 0) + 1
        
        return {
            "total_anomalies": total,
            "by_severity": by_severity,
            "by_emotion": by_emotion,
            "recent_high_severity": sum(
                1 for r in self.reports[-100:]
                if r.severity == "high"
            )
        }


# Global anomaly reporter
anomaly_reporter = AnomalyReporter()
