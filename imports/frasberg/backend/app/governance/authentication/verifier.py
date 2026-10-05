"""
Certificate Verification

Verifies digital certificates for authenticity, validity, and integrity.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import hashlib
import json


class CertificateVerifier:
    """
    Verify digital certificates.
    
    Performs comprehensive verification including:
    - Signature verification
    - Validity period check
    - Revocation status
    - Chain of trust validation
    """
    
    def __init__(self):
        """Initialize certificate verifier"""
        self.trusted_issuers: List[str] = []
        self.revocation_list: List[str] = []
    
    def verify_certificate(
        self,
        certificate: Any,
        check_revocation: bool = True,
    ) -> Dict[str, Any]:
        """
        Comprehensive certificate verification.
        
        Args:
            certificate: Certificate to verify
            check_revocation: Check if certificate is revoked
            
        Returns:
            Verification result
        """
        issues = []
        
        # Check validity period
        if not self._check_validity_period(certificate):
            issues.append("Certificate is expired or not yet valid")
        
        # Check signature
        if not self._verify_signature(certificate):
            issues.append("Certificate signature is invalid")
        
        # Check revocation
        if check_revocation and self._is_revoked(certificate):
            issues.append("Certificate has been revoked")
        
        # Check issuer trust
        if not self._is_trusted_issuer(certificate):
            issues.append("Certificate issuer is not trusted")
        
        is_valid = len(issues) == 0
        
        return {
            "valid": is_valid,
            "certificate_id": getattr(certificate, 'certificate_id', 'unknown'),
            "issued_to": getattr(certificate, 'issued_to', 'unknown'),
            "issued_by": getattr(certificate, 'issued_by', 'unknown'),
            "issues": issues,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
    
    def verify_signature(self, certificate: Any) -> bool:
        """
        Verify certificate signature.
        
        Args:
            certificate: Certificate to verify
            
        Returns:
            True if signature is valid
        """
        return self._verify_signature(certificate)
    
    def verify_chain(self, certificates: List[Any]) -> Dict[str, Any]:
        """
        Verify certificate chain.
        
        Args:
            certificates: List of certificates in chain
            
        Returns:
            Chain verification result
        """
        if not certificates:
            return {
                "valid": False,
                "error": "Empty certificate chain",
            }
        
        issues = []
        
        # Verify each certificate
        for idx, cert in enumerate(certificates):
            result = self.verify_certificate(cert, check_revocation=True)
            if not result["valid"]:
                issues.append({
                    "index": idx,
                    "certificate_id": result["certificate_id"],
                    "issues": result["issues"],
                })
        
        # Verify chain links
        for idx in range(len(certificates) - 1):
            current = certificates[idx]
            issuer = certificates[idx + 1]
            
            if not self._verify_chain_link(current, issuer):
                issues.append({
                    "type": "chain_break",
                    "index": idx,
                    "message": "Certificate not issued by claimed issuer",
                })
        
        return {
            "valid": len(issues) == 0,
            "chain_length": len(certificates),
            "issues": issues,
        }
    
    def add_trusted_issuer(self, issuer_name: str) -> None:
        """
        Add trusted certificate issuer.
        
        Args:
            issuer_name: Name of trusted issuer
        """
        if issuer_name not in self.trusted_issuers:
            self.trusted_issuers.append(issuer_name)
    
    def revoke_certificate(self, certificate_id: str) -> None:
        """
        Add certificate to revocation list.
        
        Args:
            certificate_id: ID of certificate to revoke
        """
        if certificate_id not in self.revocation_list:
            self.revocation_list.append(certificate_id)
    
    def check_expiration(self, certificate: Any) -> Dict[str, Any]:
        """
        Check certificate expiration status.
        
        Args:
            certificate: Certificate to check
            
        Returns:
            Expiration status
        """
        now = datetime.now(timezone.utc)
        
        if hasattr(certificate, 'valid_until'):
            valid_until = datetime.fromisoformat(
                certificate.valid_until.replace('Z', '+00:00')
            )
        else:
            return {
                "error": "Certificate missing valid_until field",
            }
        
        is_expired = now > valid_until
        days_remaining = (valid_until - now).days if not is_expired else 0
        
        return {
            "expired": is_expired,
            "valid_until": certificate.valid_until,
            "days_remaining": days_remaining,
            "expires_soon": days_remaining < 30 and not is_expired,
        }
    
    def validate_certificate_data(self, certificate: Any) -> Dict[str, Any]:
        """
        Validate certificate data structure and content.
        
        Args:
            certificate: Certificate to validate
            
        Returns:
            Validation result
        """
        required_fields = [
            'certificate_id',
            'issued_to',
            'issued_by',
            'purpose',
            'valid_from',
            'valid_until',
            'signature',
        ]
        
        missing_fields = []
        for field in required_fields:
            if not hasattr(certificate, field):
                missing_fields.append(field)
        
        # Validate dates
        date_errors = []
        try:
            if hasattr(certificate, 'valid_from'):
                datetime.fromisoformat(certificate.valid_from.replace('Z', '+00:00'))
        except ValueError:
            date_errors.append("Invalid valid_from date format")
        
        try:
            if hasattr(certificate, 'valid_until'):
                datetime.fromisoformat(certificate.valid_until.replace('Z', '+00:00'))
        except ValueError:
            date_errors.append("Invalid valid_until date format")
        
        is_valid = len(missing_fields) == 0 and len(date_errors) == 0
        
        return {
            "valid": is_valid,
            "missing_fields": missing_fields,
            "date_errors": date_errors,
        }
    
    def _check_validity_period(self, certificate: Any) -> bool:
        """Check if certificate is within validity period"""
        try:
            now = datetime.now(timezone.utc)
            
            valid_from = datetime.fromisoformat(
                certificate.valid_from.replace('Z', '+00:00')
            )
            valid_until = datetime.fromisoformat(
                certificate.valid_until.replace('Z', '+00:00')
            )
            
            return valid_from <= now <= valid_until
        except (AttributeError, ValueError):
            return False
    
    def _verify_signature(self, certificate: Any) -> bool:
        """
        Verify certificate signature.
        
        In production, this would use proper cryptographic signature verification.
        This is a simplified version.
        """
        try:
            if not hasattr(certificate, 'signature'):
                return False
            
            # For now, just check signature format
            # In production, verify with issuer's public key
            return certificate.signature.startswith('SIG-')
        except AttributeError:
            return False
    
    def _is_revoked(self, certificate: Any) -> bool:
        """Check if certificate is revoked"""
        cert_id = getattr(certificate, 'certificate_id', None)
        return cert_id in self.revocation_list
    
    def _is_trusted_issuer(self, certificate: Any) -> bool:
        """Check if certificate issuer is trusted"""
        # If no trusted issuers configured, trust all
        if not self.trusted_issuers:
            return True
        
        issuer = getattr(certificate, 'issued_by', None)
        return issuer in self.trusted_issuers
    
    def _verify_chain_link(self, certificate: Any, issuer_cert: Any) -> bool:
        """Verify link between certificate and issuer"""
        try:
            cert_issuer = getattr(certificate, 'issued_by', '')
            issuer_name = getattr(issuer_cert, 'issued_to', '')
            return cert_issuer == issuer_name
        except AttributeError:
            return False
    
    def generate_verification_report(
        self,
        certificate: Any,
    ) -> str:
        """
        Generate human-readable verification report.
        
        Args:
            certificate: Certificate to report on
            
        Returns:
            Formatted report string
        """
        result = self.verify_certificate(certificate)
        expiration = self.check_expiration(certificate)
        
        report = f"""
{'='*80}
CERTIFICATE VERIFICATION REPORT
{'='*80}

Certificate ID: {result['certificate_id']}
Issued To: {result['issued_to']}
Issued By: {result['issued_by']}
Verified At: {result['verified_at']}

VERIFICATION STATUS: {'VALID' if result['valid'] else 'INVALID'}

"""
        
        if result['valid']:
            report += "✓ All verification checks passed\n"
        else:
            report += "✗ Verification issues found:\n"
            for issue in result['issues']:
                report += f"  - {issue}\n"
        
        report += f"""

EXPIRATION STATUS:
-----------------
Expired: {'YES' if expiration.get('expired') else 'NO'}
Valid Until: {expiration.get('valid_until', 'N/A')}
Days Remaining: {expiration.get('days_remaining', 0)}
"""
        
        if expiration.get('expires_soon'):
            report += "\n⚠ WARNING: Certificate expires soon!\n"
        
        report += "\n" + "="*80 + "\n"
        
        return report
