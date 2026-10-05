"""Tests for MLflow Integration"""

import pytest
from unittest.mock import Mock, patch
from backend.app.integrations.mlflow_tracker import MLflowTracker


class TestMLflowTracker:
    """Test suite for MLflowTracker"""
    
    def test_init_basic(self):
        """Test basic initialization"""
        with patch.object(MLflowTracker, '_initialize_mlflow'):
            tracker = MLflowTracker()
            assert tracker.tracking_uri is None
            assert tracker.experiment_name is None
    
    def test_init_with_tracking_uri(self):
        """Test initialization with tracking URI"""
        with patch.object(MLflowTracker, '_initialize_mlflow'):
            tracker = MLflowTracker(tracking_uri="http://localhost:5000")
            assert tracker.tracking_uri == "http://localhost:5000"
    
    def test_init_with_experiment(self):
        """Test initialization with experiment name"""
        with patch.object(MLflowTracker, '_initialize_mlflow'):
            tracker = MLflowTracker(experiment_name="test-experiment")
            assert tracker.experiment_name == "test-experiment"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
