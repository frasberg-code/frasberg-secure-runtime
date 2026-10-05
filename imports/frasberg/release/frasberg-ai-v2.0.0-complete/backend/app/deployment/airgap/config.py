"""
Air-Gapped Deployment Configuration

Configuration for deploying Frasberg AI in air-gapped (network-isolated) environments.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import os


class IsolationLevel(Enum):
    """Levels of network isolation."""
    FULL_AIRGAP = "full_airgap"  # Complete network isolation
    RESTRICTED = "restricted"  # Limited network access
    STANDARD = "standard"  # Normal deployment


@dataclass
class AirGapConfig:
    """Configuration for air-gapped deployment."""
    
    isolation_level: IsolationLevel
    deployment_id: str
    
    # Network settings
    network_enabled: bool = False
    allowed_internal_ips: List[str] = field(default_factory=list)
    blocked_external_access: bool = True
    
    # Data transfer
    offline_mode: bool = True
    local_model_path: str = ""
    local_data_path: str = ""
    
    # Security
    require_physical_access: bool = True
    log_all_attempts: bool = True
    encryption_required: bool = True
    
    # Updates and maintenance
    manual_updates_only: bool = True
    update_package_verification: bool = True
    
    # Monitoring
    internal_monitoring_only: bool = True
    external_telemetry_disabled: bool = True
    
    def validate(self) -> tuple[bool, List[str]]:
        """
        Validate air-gap configuration.
        
        Returns:
            (is_valid, list_of_errors)
        """
        errors = []
        
        if self.isolation_level == IsolationLevel.FULL_AIRGAP:
            if self.network_enabled:
                errors.append("Full air-gap requires network to be disabled")
            if not self.offline_mode:
                errors.append("Full air-gap requires offline mode")
            if not self.blocked_external_access:
                errors.append("Full air-gap requires blocked external access")
            if not self.external_telemetry_disabled:
                errors.append("Full air-gap requires disabled telemetry")
        
        if self.offline_mode and not self.local_model_path:
            errors.append("Offline mode requires local model path")
        
        if not self.encryption_required and self.isolation_level == IsolationLevel.FULL_AIRGAP:
            errors.append("Full air-gap should have encryption enabled")
        
        return len(errors) == 0, errors


class AirGapDeploymentManager:
    """Manages air-gapped deployment configurations."""
    
    def __init__(self, config: AirGapConfig):
        self.config = config
        self._validate_config()
    
    def _validate_config(self):
        """Validate configuration on initialization."""
        is_valid, errors = self.config.validate()
        if not is_valid:
            raise ValueError(f"Invalid air-gap configuration: {', '.join(errors)}")
    
    def get_deployment_settings(self) -> Dict:
        """Get deployment settings for air-gapped environment."""
        return {
            'isolation_level': self.config.isolation_level.value,
            'network': {
                'enabled': self.config.network_enabled,
                'external_access': not self.config.blocked_external_access,
                'allowed_internal': self.config.allowed_internal_ips
            },
            'data': {
                'offline_mode': self.config.offline_mode,
                'model_path': self.config.local_model_path,
                'data_path': self.config.local_data_path
            },
            'security': {
                'physical_access_required': self.config.require_physical_access,
                'encryption': self.config.encryption_required,
                'audit_logging': self.config.log_all_attempts
            },
            'updates': {
                'manual_only': self.config.manual_updates_only,
                'verification_required': self.config.update_package_verification
            },
            'monitoring': {
                'internal_only': self.config.internal_monitoring_only,
                'telemetry_disabled': self.config.external_telemetry_disabled
            }
        }
    
    def check_network_compliance(self) -> bool:
        """Check if current network state complies with air-gap requirements."""
        if self.config.isolation_level == IsolationLevel.FULL_AIRGAP:
            # In full air-gap, network should not be accessible
            return not self._is_network_accessible()
        return True
    
    def _is_network_accessible(self) -> bool:
        """Check if network is accessible (placeholder - implement based on system)."""
        # This would check actual network state
        # For now, return based on config
        return self.config.network_enabled
    
    def get_required_offline_resources(self) -> Dict[str, List[str]]:
        """Get list of resources required for offline operation."""
        return {
            'models': [
                'Primary language model',
                'Embedding models',
                'Classification models'
            ],
            'data': [
                'Domain-specific knowledge bases',
                'Policy definitions',
                'Persona configurations'
            ],
            'dependencies': [
                'All Python packages',
                'System libraries',
                'Runtime dependencies'
            ],
            'documentation': [
                'User manuals',
                'Admin guides',
                'Troubleshooting documentation'
            ]
        }


def create_full_airgap_config(
    deployment_id: str,
    local_model_path: str,
    local_data_path: str,
    allowed_internal_ips: Optional[List[str]] = None
) -> AirGapConfig:
    """
    Create a full air-gap configuration.
    
    Args:
        deployment_id: Unique identifier for deployment
        local_model_path: Path to locally stored models
        local_data_path: Path to local data storage
        allowed_internal_ips: Optional list of internal IPs for monitoring
    
    Returns:
        AirGapConfig configured for full isolation
    """
    return AirGapConfig(
        isolation_level=IsolationLevel.FULL_AIRGAP,
        deployment_id=deployment_id,
        network_enabled=False,
        allowed_internal_ips=allowed_internal_ips or [],
        blocked_external_access=True,
        offline_mode=True,
        local_model_path=local_model_path,
        local_data_path=local_data_path,
        require_physical_access=True,
        log_all_attempts=True,
        encryption_required=True,
        manual_updates_only=True,
        update_package_verification=True,
        internal_monitoring_only=True,
        external_telemetry_disabled=True
    )


def create_restricted_config(
    deployment_id: str,
    local_model_path: str,
    allowed_internal_ips: List[str]
) -> AirGapConfig:
    """
    Create a restricted network configuration.
    
    Allows limited internal network access while blocking external access.
    """
    return AirGapConfig(
        isolation_level=IsolationLevel.RESTRICTED,
        deployment_id=deployment_id,
        network_enabled=True,
        allowed_internal_ips=allowed_internal_ips,
        blocked_external_access=True,
        offline_mode=False,
        local_model_path=local_model_path,
        local_data_path="",
        require_physical_access=False,
        log_all_attempts=True,
        encryption_required=True,
        manual_updates_only=True,
        update_package_verification=True,
        internal_monitoring_only=True,
        external_telemetry_disabled=True
    )


# Example configurations
EXAMPLE_CONFIGS = {
    'secure_facility': create_full_airgap_config(
        deployment_id='secure-facility-001',
        local_model_path='/opt/frasberg/models',
        local_data_path='/opt/frasberg/data',
        allowed_internal_ips=['10.0.0.0/8']
    ),
    'internal_network': create_restricted_config(
        deployment_id='internal-net-001',
        local_model_path='/opt/frasberg/models',
        allowed_internal_ips=['192.168.0.0/16', '10.0.0.0/8']
    )
}
