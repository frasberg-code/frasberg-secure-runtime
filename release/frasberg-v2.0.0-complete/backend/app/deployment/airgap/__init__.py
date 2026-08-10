"""
Air-Gapped Deployment Module

Provides configuration and validation for air-gapped deployments of Frasberg.
"""

from .config import (
    AirGapConfig,
    AirGapDeploymentManager,
    IsolationLevel,
    create_full_airgap_config,
    create_restricted_config,
    EXAMPLE_CONFIGS
)

from .validator import (
    NetworkIsolationValidator,
    ValidationResult,
    ValidationCheck,
    validate_airgap_deployment
)

__all__ = [
    'AirGapConfig',
    'AirGapDeploymentManager',
    'IsolationLevel',
    'create_full_airgap_config',
    'create_restricted_config',
    'EXAMPLE_CONFIGS',
    'NetworkIsolationValidator',
    'ValidationResult',
    'ValidationCheck',
    'validate_airgap_deployment'
]
