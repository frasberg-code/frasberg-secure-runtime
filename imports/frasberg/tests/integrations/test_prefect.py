"""Tests for Prefect Integration"""

import pytest
from unittest.mock import Mock, patch
from backend.app.integrations.prefect_flow import PrefectFlow


class TestPrefectFlow:
    """Test suite for PrefectFlow"""
    
    def test_init_basic(self):
        """Test basic initialization"""
        with patch.object(PrefectFlow, '_initialize_prefect'):
            flow = PrefectFlow("test-flow")
            assert flow.flow_name == "test-flow"
    
    def test_flow_with_kwargs(self):
        """Test flow with additional kwargs"""
        with patch.object(PrefectFlow, '_initialize_prefect'):
            flow = PrefectFlow("test-flow", version="1.0", description="Test flow")
            assert flow.kwargs["version"] == "1.0"
            assert flow.kwargs["description"] == "Test flow"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
