"""Tests for Dagster Integration"""

import pytest
from unittest.mock import Mock, patch
from backend.app.integrations.dagster_pipeline import DagsterPipeline


class TestDagsterPipeline:
    """Test suite for DagsterPipeline"""
    
    def test_init_basic(self):
        """Test basic initialization"""
        with patch.object(DagsterPipeline, '_initialize_dagster'):
            pipeline = DagsterPipeline("test-pipeline")
            assert pipeline.pipeline_name == "test-pipeline"
    
    def test_pipeline_with_kwargs(self):
        """Test pipeline with additional kwargs"""
        with patch.object(DagsterPipeline, '_initialize_dagster'):
            pipeline = DagsterPipeline(
                "test-pipeline",
                description="Test pipeline",
                tags={"env": "dev"}
            )
            assert pipeline.kwargs["description"] == "Test pipeline"
            assert pipeline.kwargs["tags"]["env"] == "dev"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
