"""Usage Metrics (Meta-Only) for Frasberg Analytics."""
from typing import Dict, Optional
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class MetricEvent:
    """Metric event (content-free)."""
    fork: str
    voice_id: str
    language: str
    event: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict = field(default_factory=dict)


class MetricsCollector:
    """
    Collects usage metrics across forks (meta-only, no content).
    
    NOTE: This system NEVER collects:
    - User content
    - Conversation text
    - Personal information
    - Biometric data
    
    Only meta-level operational metrics like:
    - Voice profile usage counts
    - Language distribution
    - Event types and frequencies
    """
    
    def __init__(self):
        """Initialize metrics collector."""
        self.events: list = []
        self.aggregates: Dict[str, int] = {}
    
    def record_event(self, fork: str, voice_id: str, language: str,
                    event: str, metadata: Optional[Dict] = None) -> None:
        """
        Record metric event.
        
        Args:
            fork: Fork identifier
            voice_id: Voice profile used
            language: Language code
            event: Event type (voice_output, voice_input, etc.)
            metadata: Additional meta-only metadata
        """
        metric = MetricEvent(
            fork=fork,
            voice_id=voice_id,
            language=language,
            event=event,
            metadata=metadata or {}
        )
        
        self.events.append(metric)
        
        # Update aggregates
        key = f"{fork}:{voice_id}:{language}:{event}"
        self.aggregates[key] = self.aggregates.get(key, 0) + 1
        
        # Keep only recent events (last 10000)
        if len(self.events) > 10000:
            self.events = self.events[-10000:]
    
    def get_fork_metrics(self, fork: str) -> Dict:
        """
        Get metrics for specific fork.
        
        Args:
            fork: Fork identifier
            
        Returns:
            Aggregated metrics
        """
        fork_events = [e for e in self.events if e.fork == fork]
        
        voice_counts = {}
        language_counts = {}
        event_counts = {}
        
        for event in fork_events:
            voice_counts[event.voice_id] = voice_counts.get(event.voice_id, 0) + 1
            language_counts[event.language] = language_counts.get(event.language, 0) + 1
            event_counts[event.event] = event_counts.get(event.event, 0) + 1
        
        return {
            "fork": fork,
            "total_events": len(fork_events),
            "voice_usage": voice_counts,
            "language_distribution": language_counts,
            "event_types": event_counts
        }
    
    def get_cross_fork_metrics(self) -> Dict:
        """
        Get metrics across all forks.
        
        Returns:
            Cross-fork metrics
        """
        forks = set(e.fork for e in self.events)
        
        metrics = {
            "total_events": len(self.events),
            "forks": {}
        }
        
        for fork in forks:
            metrics["forks"][fork] = self.get_fork_metrics(fork)
        
        return metrics
    
    def get_voice_popularity(self) -> Dict:
        """Get voice profile popularity across forks."""
        voice_counts = {}
        
        for event in self.events:
            voice_counts[event.voice_id] = voice_counts.get(event.voice_id, 0) + 1
        
        # Sort by usage
        sorted_voices = sorted(voice_counts.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "voice_usage": dict(sorted_voices),
            "most_popular": sorted_voices[0] if sorted_voices else None
        }


# Global metrics collector
metrics_collector = MetricsCollector()
