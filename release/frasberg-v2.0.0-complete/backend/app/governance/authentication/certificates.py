"""
Certificate Generation

Generates digital certificates for authentication, signing, and verification
of governance system outputs.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import hashlib
import json
import uuid


@dataclass
class Certificate:
    """Digital certificate for governance authentication"""
    certificate_id: str
    issued_to: str
    issued_by: str
    purpose: str
    valid_from: str
    valid_until: str
    public_key: str
    certificate_data: Dict[str, Any]
    signature: str = ""
    
    def is_valid(self) -> bool:
        """Check if certificate is currently valid"""
        now = datetime.now(timezone.utc)
        valid_from = datetime.fromisoformat(self.valid_from.replace('Z', '+00:00'))
        valid_until = datetime.fromisoformat(self.valid_until.replace('Z', '+00:00'))
        return valid_from <= now <= valid_until
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "certificate_id": self.certificate_id,
            "issued_to": self.issued_to,
            "issued_by": self.issued_by,
            "purpose": self.purpose,
            "valid_from": self.valid_from,
            "valid_until": self.valid_until,
            "public_key": self.public_key,
            "certificate_data": self.certificate_data,
            "signature": self.signature,
        }


class CertificateGenerator:
    """
    Generate digital certificates for governance operations.
    
    Certificates are used for:
    - Authentication of audit exports
    - Signing of legal documents
    - Chain of custody verification
    - Expert witness certification
    """
    
    def __init__(
        self,
        issuer_name: str = "Frasberg Governance Authority",
        issuer_id: Optional[str] = None,
    ):
        """
        Initialize certificate generator.
        
        Args:
            issuer_name: Name of certificate issuer
            issuer_id: Unique identifier for issuer
        """
        self.issuer_name = issuer_name
        self.issuer_id = issuer_id or str(uuid.uuid4())
    
    def generate_certificate(
        self,
        subject_name: str,
        purpose: str,
        validity_days: int = 365,
        certificate_data: Optional[Dict[str, Any]] = None,
    ) -> Certificate:
        """
        Generate a new certificate.
        
        Args:
            subject_name: Name of certificate subject (who it's issued to)
            purpose: Purpose of certificate
            validity_days: Number of days certificate is valid
            certificate_data: Additional data to include in certificate
            
        Returns:
            Generated Certificate
        """
        now = datetime.now(timezone.utc)
        valid_until = now + timedelta(days=validity_days)
        
        # Generate key pair (simplified - in production use proper cryptography)
        public_key = self._generate_public_key()
        
        certificate = Certificate(
            certificate_id=str(uuid.uuid4()),
            issued_to=subject_name,
            issued_by=self.issuer_name,
            purpose=purpose,
            valid_from=now.isoformat(),
            valid_until=valid_until.isoformat(),
            public_key=public_key,
            certificate_data=certificate_data or {},
        )
        
        # Sign certificate
        certificate.signature = self._sign_certificate(certificate)
        
        return certificate
    
    def generate_audit_certificate(
        self,
        custodian_name: str,
        audit_summary: Dict[str, Any],
    ) -> Certificate:
        """
        Generate certificate for audit export.
        
        Args:
            custodian_name: Name of audit custodian
            audit_summary: Summary of audit data
            
        Returns:
            Audit certificate
        """
        cert_data = {
            "type": "audit_export",
            "total_entries": audit_summary.get("total_entries", 0),
            "date_range": audit_summary.get("date_range", {}),
            "chain_verified": audit_summary.get("chain_verified", False),
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        return self.generate_certificate(
            subject_name=custodian_name,
            purpose="Audit Log Export Authentication",
            validity_days=3650,  # 10 years for audit records
            certificate_data=cert_data,
        )
    
    def generate_expert_certificate(
        self,
        expert_name: str,
        qualifications: Dict[str, Any],
    ) -> Certificate:
        """
        Generate certificate for expert witness.
        
        Args:
            expert_name: Name of expert
            qualifications: Expert qualifications
            
        Returns:
            Expert certificate
        """
        cert_data = {
            "type": "expert_witness",
            "qualifications": qualifications,
            "scope": "Frasberg Governance System",
            "certification_date": datetime.now(timezone.utc).isoformat(),
        }
        
        return self.generate_certificate(
            subject_name=expert_name,
            purpose="Expert Witness Certification",
            validity_days=1825,  # 5 years
            certificate_data=cert_data,
        )
    
    def generate_signing_certificate(
        self,
        signer_name: str,
        document_type: str,
    ) -> Certificate:
        """
        Generate certificate for document signing.
        
        Args:
            signer_name: Name of person signing
            document_type: Type of document being signed
            
        Returns:
            Signing certificate
        """
        cert_data = {
            "type": "document_signing",
            "document_type": document_type,
            "signing_authority": signer_name,
        }
        
        return self.generate_certificate(
            subject_name=signer_name,
            purpose=f"Document Signing - {document_type}",
            validity_days=365,
            certificate_data=cert_data,
        )
    
    def generate_chain_certificate(
        self,
        chain_summary: Dict[str, Any],
    ) -> Certificate:
        """
        Generate certificate for hash chain verification.
        
        Args:
            chain_summary: Summary of chain verification
            
        Returns:
            Chain certificate
        """
        cert_data = {
            "type": "chain_verification",
            "total_entries": chain_summary.get("total_entries", 0),
            "verified_entries": chain_summary.get("verified_entries", 0),
            "integrity_score": chain_summary.get("integrity_score", 0.0),
            "verification_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        return self.generate_certificate(
            subject_name="Frasberg Hash Chain",
            purpose="Hash Chain Integrity Verification",
            validity_days=3650,
            certificate_data=cert_data,
        )
    
    def revoke_certificate(
        self,
        certificate_id: str,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Revoke a certificate.
        
        Args:
            certificate_id: ID of certificate to revoke
            reason: Reason for revocation
            
        Returns:
            Revocation record
        """
        return {
            "certificate_id": certificate_id,
            "revoked": True,
            "revocation_date": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "revoked_by": self.issuer_name,
        }
    
    def _generate_public_key(self) -> str:
        """
        Generate public key.
        
        In production, this would use proper cryptographic key generation
        (e.g., RSA, ECC). This is a simplified version.
        """
        random_data = f"{uuid.uuid4()}{datetime.now().isoformat()}".encode()
        key_hash = hashlib.sha256(random_data).hexdigest()
        return f"PUBLIC-KEY-{key_hash[:32]}"
    
    def _sign_certificate(self, certificate: Certificate) -> str:
        """
        Sign certificate with issuer's private key.
        
        In production, this would use proper digital signatures.
        This is a simplified version using hash-based signature.
        """
        cert_data = {
            "certificate_id": certificate.certificate_id,
            "issued_to": certificate.issued_to,
            "issued_by": certificate.issued_by,
            "purpose": certificate.purpose,
            "valid_from": certificate.valid_from,
            "valid_until": certificate.valid_until,
            "public_key": certificate.public_key,
        }
        
        canonical = json.dumps(cert_data, sort_keys=True)
        signature = hashlib.sha256(
            f"{canonical}{self.issuer_id}".encode()
        ).hexdigest()
        
        return f"SIG-{signature}"
    
    def export_certificate_pem(self, certificate: Certificate) -> str:
        """
        Export certificate in PEM-like format.
        
        Args:
            certificate: Certificate to export
            
        Returns:
            PEM-formatted certificate string
        """
        import base64
        
        cert_json = json.dumps(certificate.to_dict(), indent=2)
        cert_b64 = base64.b64encode(cert_json.encode()).decode()
        
        # Format as PEM
        pem = "-----BEGIN FRASBERG CERTIFICATE-----\n"
        
        # Wrap at 64 characters
        for i in range(0, len(cert_b64), 64):
            pem += cert_b64[i:i+64] + "\n"
        
        pem += "-----END FRASBERG CERTIFICATE-----\n"
        
        return pem
    
    def import_certificate_pem(self, pem_data: str) -> Certificate:
        """
        Import certificate from PEM format.
        
        Args:
            pem_data: PEM-formatted certificate
            
        Returns:
            Certificate object
        """
        import base64
        
        # Extract base64 data
        lines = pem_data.split('\n')
        b64_lines = [
            line for line in lines
            if not line.startswith('-----')
        ]
        b64_data = ''.join(b64_lines)
        
        # Decode
        cert_json = base64.b64decode(b64_data).decode()
        cert_dict = json.loads(cert_json)
        
        # Create certificate object
        return Certificate(**cert_dict)
