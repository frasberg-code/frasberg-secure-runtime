"""Baseline Calculation for Emotion Anomaly Detection."""
from typing import Dict, List
import statistics


class BaselineCalculator:
    """
    Calculates baseline emotional patterns.
    
    Establishes normal operating ranges for emotional states
    to enable anomaly detection.
    """
    
    def __init__(self):
        """Initialize baseline calculator."""
        self.baselines: Dict[str, Dict] = {}
    
    def calculate_baseline(self, user_id: str, emotion: str,
                          observations: List[float]) -> Dict:
        """
        Calculate baseline for emotion.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            observations: Historical observations
            
        Returns:
            Baseline statistics
        """
        if len(observations) < 2:
            return {
                "user_id": user_id,
                "emotion": emotion,
                "status": "insufficient_data",
                "min": None,
                "max": None,
                "mean": None,
                "median": None,
                "stdev": None
            }
        
        baseline = {
            "user_id": user_id,
            "emotion": emotion,
            "status": "calculated",
            "min": min(observations),
            "max": max(observations),
            "mean": statistics.mean(observations),
            "median": statistics.median(observations),
            "stdev": statistics.stdev(observations) if len(observations) > 1 else 0.0,
            "observation_count": len(observations)
        }
        
        key = f"{user_id}:{emotion}"
        self.baselines[key] = baseline
        
        return baseline
    
    def get_baseline(self, user_id: str, emotion: str) -> Dict:
        """
        Get baseline for user emotion.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            
        Returns:
            Baseline statistics or empty dict
        """
        key = f"{user_id}:{emotion}"
        return self.baselines.get(key, {})
    
    def is_within_baseline(self, user_id: str, emotion: str,
                          intensity: float, tolerance: float = 2.0) -> bool:
        """
        Check if intensity is within baseline range.
        
        Args:
            user_id: User identifier
            emotion: Emotion type
            intensity: Intensity to check
            tolerance: Tolerance in standard deviations
            
        Returns:
            True if within baseline
        """
        baseline = self.get_baseline(user_id, emotion)
        
        if not baseline or baseline.get("status") != "calculated":
            return True  # No baseline, assume normal
        
        mean = baseline["mean"]
        stdev = baseline["stdev"]
        
        if stdev == 0:
            return intensity == mean
        
        z_score = abs((intensity - mean) / stdev)
        return z_score <= tolerance


# Global baseline calculator
baseline_calculator = BaselineCalculator()
