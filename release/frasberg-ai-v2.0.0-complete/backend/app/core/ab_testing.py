"""A/B Testing Variant Assignment for Frasberg AI."""
from typing import Dict, Optional
import hashlib


class ABTestingEngine:
    """
    A/B testing system for experimentation.
    
    Deterministic variant assignment based on user ID.
    """
    
    def __init__(self):
        """Initialize A/B testing engine."""
        self.experiments: Dict[str, Dict] = {}
        self.assignments: Dict[str, Dict[str, str]] = {}
    
    def create_experiment(self, experiment_id: str, variants: list,
                         weights: Optional[list] = None) -> None:
        """
        Create A/B test experiment.
        
        Args:
            experiment_id: Experiment identifier
            variants: List of variant names
            weights: Optional weights for variants (must sum to 1.0)
        """
        if weights is None:
            # Equal weights
            weights = [1.0 / len(variants)] * len(variants)
        
        if len(variants) != len(weights):
            raise ValueError("Variants and weights must have same length")
        
        if abs(sum(weights) - 1.0) > 0.001:
            raise ValueError("Weights must sum to 1.0")
        
        self.experiments[experiment_id] = {
            "variants": variants,
            "weights": weights
        }
    
    def assign_variant(self, experiment_id: str, user_id: str) -> str:
        """
        Assign user to experiment variant.
        
        Args:
            experiment_id: Experiment ID
            user_id: User identifier
            
        Returns:
            Variant name
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment not found: {experiment_id}")
        
        # Check if already assigned
        if user_id in self.assignments.get(experiment_id, {}):
            return self.assignments[experiment_id][user_id]
        
        # Deterministic assignment using hash
        experiment = self.experiments[experiment_id]
        hash_input = f"{experiment_id}:{user_id}"
        hash_value = int(hashlib.sha256(hash_input.encode()).hexdigest(), 16)
        normalized = (hash_value % 10000) / 10000.0  # 0-1 range
        
        # Select variant based on weights
        cumulative = 0.0
        for variant, weight in zip(experiment["variants"], experiment["weights"]):
            cumulative += weight
            if normalized <= cumulative:
                # Store assignment
                if experiment_id not in self.assignments:
                    self.assignments[experiment_id] = {}
                self.assignments[experiment_id][user_id] = variant
                return variant
        
        # Fallback to last variant
        return experiment["variants"][-1]
    
    def get_assignment(self, experiment_id: str, user_id: str) -> Optional[str]:
        """Get existing variant assignment."""
        return self.assignments.get(experiment_id, {}).get(user_id)
    
    def get_experiment_stats(self, experiment_id: str) -> Dict:
        """
        Get experiment statistics.
        
        Args:
            experiment_id: Experiment ID
            
        Returns:
            Statistics dictionary
        """
        if experiment_id not in self.experiments:
            return {}
        
        experiment = self.experiments[experiment_id]
        assignments = self.assignments.get(experiment_id, {})
        
        # Count assignments per variant
        variant_counts = {v: 0 for v in experiment["variants"]}
        for variant in assignments.values():
            if variant in variant_counts:
                variant_counts[variant] += 1
        
        total = len(assignments)
        
        return {
            "experiment_id": experiment_id,
            "total_assignments": total,
            "variants": experiment["variants"],
            "variant_counts": variant_counts,
            "variant_percentages": {
                v: (count / total * 100 if total > 0 else 0)
                for v, count in variant_counts.items()
            }
        }


# Global A/B testing engine
ab_testing_engine = ABTestingEngine()
