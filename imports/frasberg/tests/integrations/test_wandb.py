"""Tests for Weights & Biases Integration"""

import pytest
from unittest.mock import Mock, patch
from backend.app.integrations.wandb_logger import WandBLogger


class TestWandBLogger:
    """Test suite for WandBLogger"""
    
    def test_init_basic(self):
        """Test basic initialization"""
        with patch.object(WandBLogger, '_initialize_wandb'):
            logger = WandBLogger(project="test-project")
            assert logger.project == "test-project"
    
    def test_init_with_entity(self):
        """Test initialization with entity"""
        with patch.object(WandBLogger, '_initialize_wandb'):
            logger = WandBLogger(
                project="test-project",
                entity="test-team"
            )
            assert logger.entity == "test-team"
            assert logger.project == "test-project"
    
    def test_init_with_config(self):
        """Test initialization with configuration"""
        with patch.object(WandBLogger, '_initialize_wandb'):
            config = {"learning_rate": 0.001, "batch_size": 32}
            logger = WandBLogger(project="test-project", config=config)
            assert logger.config == config


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
