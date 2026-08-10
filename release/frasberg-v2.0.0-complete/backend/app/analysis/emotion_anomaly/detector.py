"""Emotion Anomaly Detection for Frasberg."""
from typing import Dict, List, Optional
from datetime import datetime
import statistics


class EmotionAnomalyDetector:
    """
    Detects anomalous emotional patterns.
    
    Uses statistical analysis to identify unusual emotional states
    that may indicate system issues or unexpected behavior.
    """
    
    def __init__(self, threshold_stdev: float = 2.0):
        """
        Initialize anomaly detector.
        
        Args:
            threshold_stdev: Standard deviation threshold for anomalies
        """
        self.threshold = threshold_stdev
        self.history: Dict[str, List[float]] = {}
    
    def add_observation(self, user_id: str, emotion: str, intensity: float) -> None:
        """
        Add emotion observation.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            intensity: Intensity value
        """
        key = f"{user_id}:{emotion}"
        if key not in self.history:
            self.history[key] = []
        
        self.history[key].append(intensity)
        
        # Keep only recent history (last 100 observations)
        if len(self.history[key]) > 100:
            self.history[key] = self.history[key][-100:]
    
    def detect_anomaly(self, user_id: str, emotion: str, intensity: float) -> Dict:
        """
        Detect if intensity is anomalous.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            intensity: Current intensity
            
        Returns:
            Anomaly detection result
        """
        key = f"{user_id}:{emotion}"
        
        if key not in self.history or len(self.history[key]) < 10:
            # Not enough data
            return {
                "is_anomaly": False,
                "reason": "insufficient_data",
                "intensity": intensity
            }
        
        history = self.history[key]
        mean = statistics.mean(history)
        stdev = statistics.stdev(history)
        
        # Check if current value is beyond threshold
        z_score = abs((intensity - mean) / stdev) if stdev > 0 else 0
        is_anomaly = z_score > self.threshold
        
        return {
            "is_anomaly": is_anomaly,
            "intensity": intensity,
            "mean": mean,
            "stdev": stdev,
            "z_score": z_score,
            "threshold": self.threshold,
            "reason": "statistical_outlier" if is_anomaly else "normal"
        }
    
    def get_anomalies(self, user_id: Optional[str] = None) -> List[Dict]:
        """
        Get all detected anomalies.
        
        Args:
            user_id: Optional user filter
            
        Returns:
            List of anomalies
        """
        # This would be connected to a persistence layer in production
        return []


# Global anomaly detector
anomaly_detector = EmotionAnomalyDetector()
