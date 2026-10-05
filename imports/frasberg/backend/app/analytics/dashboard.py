"""Analytics Dashboard Generation for Frasberg AI."""
from typing import Dict, List
from datetime import datetime
import json


class AnalyticsDashboard:
    """
    Generates analytics dashboards for multi-fork system.
    
    Provides high-level operational insights without exposing
    any user content or personal information.
    """
    
    def __init__(self):
        """Initialize analytics dashboard."""
        pass
    
    def generate_dashboard(self, metrics: Dict) -> Dict:
        """
        Generate dashboard data.
        
        Args:
            metrics: Metrics data
            
        Returns:
            Dashboard structure
        """
        dashboard = {
            "generated_at": datetime.utcnow().isoformat(),
            "type": "frasberg_ai_analytics",
            "version": "1.0.0",
            "overview": self._generate_overview(metrics),
            "forks": self._generate_fork_panels(metrics),
            "voice_analytics": self._generate_voice_analytics(metrics),
            "recommendations": self._generate_recommendations(metrics)
        }
        
        return dashboard
    
    def _generate_overview(self, metrics: Dict) -> Dict:
        """Generate overview panel."""
        return {
            "total_events": metrics.get("total_events", 0),
            "active_forks": len(metrics.get("forks", {})),
            "status": "operational"
        }
    
    def _generate_fork_panels(self, metrics: Dict) -> List[Dict]:
        """Generate fork panels."""
        panels = []
        
        for fork_id, fork_metrics in metrics.get("forks", {}).items():
            panel = {
                "fork_id": fork_id,
                "total_events": fork_metrics.get("total_events", 0),
                "voice_usage": fork_metrics.get("voice_usage", {}),
                "language_distribution": fork_metrics.get("language_distribution", {}),
                "event_types": fork_metrics.get("event_types", {})
            }
            panels.append(panel)
        
        return panels
    
    def _generate_voice_analytics(self, metrics: Dict) -> Dict:
        """Generate voice analytics."""
        # Aggregate voice usage across forks
        voice_totals = {}
        
        for fork_metrics in metrics.get("forks", {}).values():
            for voice_id, count in fork_metrics.get("voice_usage", {}).items():
                voice_totals[voice_id] = voice_totals.get(voice_id, 0) + count
        
        sorted_voices = sorted(voice_totals.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "total_voice_outputs": sum(voice_totals.values()),
            "unique_voices": len(voice_totals),
            "most_used": sorted_voices[0] if sorted_voices else None,
            "usage_by_voice": dict(sorted_voices)
        }
    
    def _generate_recommendations(self, metrics: Dict) -> List[str]:
        """Generate operational recommendations."""
        recommendations = []
        
        total_events = metrics.get("total_events", 0)
        
        if total_events < 100:
            recommendations.append("System is in early operational phase")
        
        # Check fork balance
        fork_counts = [
            f.get("total_events", 0)
            for f in metrics.get("forks", {}).values()
        ]
        
        if len(fork_counts) > 1:
            max_count = max(fork_counts)
            min_count = min(fork_counts)
            
            if max_count > min_count * 10:
                recommendations.append("Consider load balancing across forks")
        
        return recommendations
    
    def export_dashboard(self, dashboard: Dict, format: str = "json") -> str:
        """
        Export dashboard.
        
        Args:
            dashboard: Dashboard data
            format: Export format
            
        Returns:
            Exported dashboard
        """
        if format == "json":
            return json.dumps(dashboard, indent=2)
        
        return ""


# Global analytics dashboard
analytics_dashboard = AnalyticsDashboard()
