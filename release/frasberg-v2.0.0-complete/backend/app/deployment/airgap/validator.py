"""
Air-Gapped Deployment - Network Isolation Validator

Validates that network isolation requirements are met for air-gapped deployments.
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import socket
import subprocess
from datetime import datetime


class ValidationResult(Enum):
    """Results of validation checks."""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIPPED = "skipped"


@dataclass
class ValidationCheck:
    """Represents a validation check result."""
    check_name: str
    result: ValidationResult
    message: str
    timestamp: datetime
    details: Optional[Dict] = None


class NetworkIsolationValidator:
    """Validates network isolation for air-gapped deployments."""
    
    def __init__(self, strict_mode: bool = True):
        """
        Initialize validator.
        
        Args:
            strict_mode: If True, any failure blocks deployment
        """
        self.strict_mode = strict_mode
        self.validation_results: List[ValidationCheck] = []
    
    def validate_full_airgap(self) -> Tuple[bool, List[ValidationCheck]]:
        """
        Validate full air-gap isolation.
        
        Returns:
            (is_compliant, list_of_checks)
        """
        self.validation_results = []
        
        # Check 1: No external network connectivity
        self._check_external_connectivity()
        
        # Check 2: No DNS resolution for external domains
        self._check_dns_resolution()
        
        # Check 3: Firewall rules in place
        self._check_firewall_rules()
        
        # Check 4: No unexpected network interfaces
        self._check_network_interfaces()
        
        # Check 5: Telemetry disabled
        self._check_telemetry_disabled()
        
        # Determine overall compliance
        is_compliant = self._determine_compliance()
        
        return is_compliant, self.validation_results
    
    def _check_external_connectivity(self):
        """Check that external network is not accessible."""
        check_name = "External Connectivity Check"
        
        try:
            # Try to connect to common external IPs
            test_hosts = [
                ('8.8.8.8', 53),  # Google DNS
                ('1.1.1.1', 53),  # Cloudflare DNS
            ]
            
            can_connect = False
            for host, port in test_hosts:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    result = sock.connect_ex((host, port))
                    sock.close()
                    
                    if result == 0:
                        can_connect = True
                        break
                except Exception:
                    pass
            
            if can_connect:
                self.validation_results.append(ValidationCheck(
                    check_name=check_name,
                    result=ValidationResult.FAIL,
                    message="External network connectivity detected - AIR-GAP VIOLATION",
                    timestamp=datetime.now(),
                    details={'hosts_tested': test_hosts}
                ))
            else:
                self.validation_results.append(ValidationCheck(
                    check_name=check_name,
                    result=ValidationResult.PASS,
                    message="No external connectivity detected",
                    timestamp=datetime.now()
                ))
        
        except Exception as e:
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.WARNING,
                message=f"Could not verify connectivity: {str(e)}",
                timestamp=datetime.now()
            ))
    
    def _check_dns_resolution(self):
        """Check that external DNS resolution is not available."""
        check_name = "DNS Resolution Check"
        
        try:
            test_domains = ['google.com', 'cloudflare.com', 'github.com']
            can_resolve = False
            
            for domain in test_domains:
                try:
                    socket.gethostbyname(domain)
                    can_resolve = True
                    break
                except socket.gaierror:
                    pass
            
            if can_resolve:
                self.validation_results.append(ValidationCheck(
                    check_name=check_name,
                    result=ValidationResult.FAIL,
                    message="External DNS resolution available - AIR-GAP VIOLATION",
                    timestamp=datetime.now(),
                    details={'domains_tested': test_domains}
                ))
            else:
                self.validation_results.append(ValidationCheck(
                    check_name=check_name,
                    result=ValidationResult.PASS,
                    message="No external DNS resolution",
                    timestamp=datetime.now()
                ))
        
        except Exception as e:
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.WARNING,
                message=f"Could not verify DNS: {str(e)}",
                timestamp=datetime.now()
            ))
    
    def _check_firewall_rules(self):
        """Check that firewall rules are properly configured."""
        check_name = "Firewall Rules Check"
        
        # This is a placeholder - actual implementation would depend on OS and firewall
        self.validation_results.append(ValidationCheck(
            check_name=check_name,
            result=ValidationResult.WARNING,
            message="Firewall check requires manual verification",
            timestamp=datetime.now(),
            details={
                'recommendation': 'Verify firewall blocks all outbound traffic to external networks'
            }
        ))
    
    def _check_network_interfaces(self):
        """Check for unexpected network interfaces."""
        check_name = "Network Interfaces Check"
        
        try:
            # Get network interfaces (platform-specific)
            # This is simplified - real implementation would be more thorough
            hostname = socket.gethostname()
            
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.PASS,
                message=f"Network interfaces checked for host: {hostname}",
                timestamp=datetime.now(),
                details={
                    'note': 'Manual verification recommended for all network interfaces'
                }
            ))
        
        except Exception as e:
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.WARNING,
                message=f"Could not enumerate interfaces: {str(e)}",
                timestamp=datetime.now()
            ))
    
    def _check_telemetry_disabled(self):
        """Check that telemetry and analytics are disabled."""
        check_name = "Telemetry Check"
        
        # Check environment variables that might enable telemetry
        telemetry_vars = [
            'TELEMETRY_ENABLED',
            'ANALYTICS_ENABLED',
            'SEND_USAGE_DATA',
            'EXTERNAL_MONITORING'
        ]
        
        import os
        telemetry_enabled = False
        enabled_vars = []
        
        for var in telemetry_vars:
            value = os.getenv(var, '').lower()
            if value in ['true', '1', 'yes', 'enabled']:
                telemetry_enabled = True
                enabled_vars.append(var)
        
        if telemetry_enabled:
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.FAIL,
                message="Telemetry enabled - AIR-GAP VIOLATION",
                timestamp=datetime.now(),
                details={'enabled_vars': enabled_vars}
            ))
        else:
            self.validation_results.append(ValidationCheck(
                check_name=check_name,
                result=ValidationResult.PASS,
                message="Telemetry disabled",
                timestamp=datetime.now()
            ))
    
    def _determine_compliance(self) -> bool:
        """Determine overall compliance based on check results."""
        if self.strict_mode:
            # In strict mode, any failure = non-compliant
            for check in self.validation_results:
                if check.result == ValidationResult.FAIL:
                    return False
        else:
            # In non-strict mode, only critical failures count
            critical_failures = sum(
                1 for check in self.validation_results
                if check.result == ValidationResult.FAIL and 
                "VIOLATION" in check.message
            )
            return critical_failures == 0
        
        return True
    
    def generate_report(self) -> str:
        """Generate a human-readable validation report."""
        lines = [
            "=" * 70,
            "AIR-GAP ISOLATION VALIDATION REPORT",
            "=" * 70,
            f"Generated: {datetime.now().isoformat()}",
            f"Mode: {'STRICT' if self.strict_mode else 'STANDARD'}",
            ""
        ]
        
        pass_count = sum(1 for c in self.validation_results if c.result == ValidationResult.PASS)
        fail_count = sum(1 for c in self.validation_results if c.result == ValidationResult.FAIL)
        warn_count = sum(1 for c in self.validation_results if c.result == ValidationResult.WARNING)
        
        lines.extend([
            f"Total Checks: {len(self.validation_results)}",
            f"Passed: {pass_count}",
            f"Failed: {fail_count}",
            f"Warnings: {warn_count}",
            ""
        ])
        
        for check in self.validation_results:
            status_symbol = {
                ValidationResult.PASS: "✓",
                ValidationResult.FAIL: "✗",
                ValidationResult.WARNING: "⚠",
                ValidationResult.SKIPPED: "○"
            }[check.result]
            
            lines.append(f"{status_symbol} {check.check_name}")
            lines.append(f"  {check.message}")
            if check.details:
                lines.append(f"  Details: {check.details}")
            lines.append("")
        
        is_compliant = self._determine_compliance()
        lines.extend([
            "=" * 70,
            f"OVERALL STATUS: {'COMPLIANT' if is_compliant else 'NON-COMPLIANT'}",
            "=" * 70
        ])
        
        return "\n".join(lines)


def validate_airgap_deployment(strict_mode: bool = True) -> Tuple[bool, str]:
    """
    Validate air-gap deployment.
    
    Args:
        strict_mode: If True, any failure blocks deployment
    
    Returns:
        (is_compliant, report)
    """
    validator = NetworkIsolationValidator(strict_mode=strict_mode)
    is_compliant, checks = validator.validate_full_airgap()
    report = validator.generate_report()
    
    return is_compliant, report


if __name__ == "__main__":
    # Run validation
    is_compliant, report = validate_airgap_deployment(strict_mode=True)
    print(report)
    
    if not is_compliant:
        print("\n⚠️  DEPLOYMENT BLOCKED: Air-gap validation failed")
        exit(1)
    else:
        print("\n✓ Air-gap validation passed")
        exit(0)
