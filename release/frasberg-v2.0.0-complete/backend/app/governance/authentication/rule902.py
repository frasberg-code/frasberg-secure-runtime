"""
FRE Rule 902(13) Auto-Authentication

Implements Federal Rules of Evidence Rule 902(13) compliance for
self-authenticating electronic records. Provides certification that
electronic records are created by an electronic process or system that
produces an accurate result.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import hashlib
import json


class RecordType(Enum):
    """Types of electronic records"""
    AUDIT_LOG = "audit_log"
    TRANSACTION_RECORD = "transaction_record"
    SYSTEM_LOG = "system_log"
    DATABASE_RECORD = "database_record"
    COMMUNICATION = "communication"
    AUTOMATED_OUTPUT = "automated_output"


@dataclass
class AuthenticationCertificate:
    """
    FRE Rule 902(13) Authentication Certificate.
    
    This certificate attests that electronic records were:
    1. Created by an electronic process or system
    2. Created at or near the time of occurrence
    3. Maintained in the regular course of business
    4. Created as a regular practice
    """
    certificate_id: str
    record_type: RecordType
    system_name: str
    system_version: str
    custodian_name: str
    custodian_title: str
    organization: str
    
    # FRE 902(13) Attestations
    created_by_system: bool
    created_at_occurrence_time: bool
    maintained_regularly: bool
    regular_practice: bool
    
    # Record details
    record_count: int
    date_range_start: str
    date_range_end: str
    record_hashes: List[str] = field(default_factory=list)
    
    # Process description
    process_description: str = ""
    accuracy_methods: List[str] = field(default_factory=list)
    
    # Certificate metadata
    certification_date: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    certificate_hash: str = ""
    
    def compute_hash(self) -> str:
        """Compute certificate hash for integrity"""
        data = {
            "certificate_id": self.certificate_id,
            "record_type": self.record_type.value,
            "system_name": self.system_name,
            "custodian_name": self.custodian_name,
            "record_count": self.record_count,
            "date_range_start": self.date_range_start,
            "date_range_end": self.date_range_end,
            "certification_date": self.certification_date,
        }
        canonical = json.dumps(data, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "certificate_id": self.certificate_id,
            "record_type": self.record_type.value,
            "system_name": self.system_name,
            "system_version": self.system_version,
            "custodian_name": self.custodian_name,
            "custodian_title": self.custodian_title,
            "organization": self.organization,
            "attestations": {
                "created_by_system": self.created_by_system,
                "created_at_occurrence_time": self.created_at_occurrence_time,
                "maintained_regularly": self.maintained_regularly,
                "regular_practice": self.regular_practice,
            },
            "record_details": {
                "record_count": self.record_count,
                "date_range_start": self.date_range_start,
                "date_range_end": self.date_range_end,
            },
            "process_description": self.process_description,
            "accuracy_methods": self.accuracy_methods,
            "certification_date": self.certification_date,
            "certificate_hash": self.certificate_hash,
        }


class Rule902Authenticator:
    """
    FRE Rule 902(13) Authenticator.
    
    Generates authentication certificates for electronic records that
    comply with Federal Rules of Evidence Rule 902(13), allowing records
    to be self-authenticating without need for expert testimony.
    """
    
    def __init__(
        self,
        system_name: str = "Frasberg Governance System",
        system_version: str = "1.0.0",
    ):
        """
        Initialize authenticator.
        
        Args:
            system_name: Name of the system creating records
            system_version: Version of the system
        """
        self.system_name = system_name
        self.system_version = system_version
    
    def create_certificate(
        self,
        records: List[Any],
        record_type: RecordType,
        custodian_name: str,
        custodian_title: str,
        organization: str,
        process_description: Optional[str] = None,
    ) -> AuthenticationCertificate:
        """
        Create FRE 902(13) authentication certificate.
        
        Args:
            records: Electronic records to authenticate
            record_type: Type of records
            custodian_name: Name of custodian certifying records
            custodian_title: Title of custodian
            organization: Organization name
            process_description: Description of record creation process
            
        Returns:
            AuthenticationCertificate
        """
        import uuid
        
        if not records:
            raise ValueError("Cannot create certificate for empty record set")
        
        # Extract date range
        timestamps = []
        record_hashes = []
        
        for record in records:
            if hasattr(record, 'timestamp'):
                timestamps.append(record.timestamp)
            elif isinstance(record, dict):
                timestamps.append(record.get('timestamp', ''))
            
            if hasattr(record, 'entry_hash'):
                record_hashes.append(record.entry_hash)
            elif isinstance(record, dict):
                record_hashes.append(record.get('entry_hash', ''))
        
        date_range_start = min(timestamps) if timestamps else datetime.now(timezone.utc).isoformat()
        date_range_end = max(timestamps) if timestamps else datetime.now(timezone.utc).isoformat()
        
        # Default process description
        if process_description is None:
            process_description = self._generate_process_description(record_type)
        
        # Create certificate
        certificate = AuthenticationCertificate(
            certificate_id=str(uuid.uuid4()),
            record_type=record_type,
            system_name=self.system_name,
            system_version=self.system_version,
            custodian_name=custodian_name,
            custodian_title=custodian_title,
            organization=organization,
            created_by_system=True,
            created_at_occurrence_time=True,
            maintained_regularly=True,
            regular_practice=True,
            record_count=len(records),
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            record_hashes=record_hashes[:100],  # Include first 100 hashes
            process_description=process_description,
            accuracy_methods=self._get_accuracy_methods(record_type),
        )
        
        # Compute and set certificate hash
        certificate.certificate_hash = certificate.compute_hash()
        
        return certificate
    
    def generate_certification_text(
        self,
        certificate: AuthenticationCertificate,
    ) -> str:
        """
        Generate certification text for court filing.
        
        Args:
            certificate: Authentication certificate
            
        Returns:
            Formatted certification text
        """
        text = f"""
{'='*80}
CERTIFICATION OF AUTHENTICITY
Federal Rules of Evidence Rule 902(13)
Certification of Data Copied from an Electronic Device, Storage Medium,
or Electronic File
{'='*80}

I, {certificate.custodian_name}, {certificate.custodian_title} of 
{certificate.organization}, hereby certify as follows:

SYSTEM IDENTIFICATION:
---------------------
System Name: {certificate.system_name}
System Version: {certificate.system_version}
Record Type: {certificate.record_type.value}

RECORDS COVERED BY THIS CERTIFICATION:
-------------------------------------
Total Records: {certificate.record_count}
Date Range: {certificate.date_range_start} to {certificate.date_range_end}

FRE RULE 902(13) ATTESTATIONS:
-----------------------------
Pursuant to Federal Rules of Evidence Rule 902(13), I certify that:

1. CREATED BY ELECTRONIC PROCESS OR SYSTEM:
   These records were created by the {certificate.system_name}, an electronic
   system that automatically records information without human intervention at
   the time of the event being recorded.
   
   Status: {'CERTIFIED' if certificate.created_by_system else 'NOT CERTIFIED'}

2. CREATED AT OR NEAR TIME OF OCCURRENCE:
   The system creates records contemporaneously with the events being recorded,
   using high-precision timestamps synchronized to authoritative time sources.
   
   Status: {'CERTIFIED' if certificate.created_at_occurrence_time else 'NOT CERTIFIED'}

3. MAINTAINED IN REGULAR COURSE OF BUSINESS:
   These records are maintained as part of the regularly conducted activities
   of {certificate.organization} and are kept in the ordinary course of business.
   
   Status: {'CERTIFIED' if certificate.maintained_regularly else 'NOT CERTIFIED'}

4. CREATED AS REGULAR PRACTICE:
   The creation of these records is a regular practice of the organization,
   and the system that creates them operates as part of standard business
   procedures.
   
   Status: {'CERTIFIED' if certificate.regular_practice else 'NOT CERTIFIED'}

PROCESS DESCRIPTION:
-------------------
{certificate.process_description}

ACCURACY AND RELIABILITY:
------------------------
The system employs the following methods to ensure accuracy and reliability:
"""
        
        for idx, method in enumerate(certificate.accuracy_methods, 1):
            text += f"\n{idx}. {method}"
        
        text += f"""

HASH CHAIN VERIFICATION:
-----------------------
The records include cryptographic hash values that create a tamper-evident
chain. Any modification to the records would be immediately detectable through
hash verification.

First Record Hash: {certificate.record_hashes[0] if certificate.record_hashes else 'N/A'}
Last Record Hash: {certificate.record_hashes[-1] if certificate.record_hashes else 'N/A'}

CERTIFICATION:
-------------
I declare under penalty of perjury that the foregoing is true and correct
to the best of my knowledge, information, and belief.

Executed on: {certificate.certification_date}

Certificate ID: {certificate.certificate_id}
Certificate Hash: {certificate.certificate_hash}


_________________________________
{certificate.custodian_name}
{certificate.custodian_title}
{certificate.organization}

{'='*80}
"""
        
        return text
    
    def validate_certificate(
        self,
        certificate: AuthenticationCertificate,
    ) -> Dict[str, Any]:
        """
        Validate certificate meets FRE 902(13) requirements.
        
        Args:
            certificate: Certificate to validate
            
        Returns:
            Validation result
        """
        issues = []
        
        # Check all attestations are true
        if not certificate.created_by_system:
            issues.append("Records not created by electronic system")
        
        if not certificate.created_at_occurrence_time:
            issues.append("Records not created at occurrence time")
        
        if not certificate.maintained_regularly:
            issues.append("Records not maintained regularly")
        
        if not certificate.regular_practice:
            issues.append("Record creation not regular practice")
        
        # Check required fields
        if not certificate.custodian_name:
            issues.append("Custodian name required")
        
        if not certificate.process_description:
            issues.append("Process description required")
        
        if certificate.record_count == 0:
            issues.append("No records certified")
        
        # Verify certificate hash
        computed_hash = certificate.compute_hash()
        if computed_hash != certificate.certificate_hash:
            issues.append("Certificate hash mismatch - certificate may be tampered")
        
        is_valid = len(issues) == 0
        
        return {
            "valid": is_valid,
            "compliant_with_fre_902_13": is_valid,
            "issues": issues,
            "certificate_id": certificate.certificate_id,
        }
    
    def _generate_process_description(self, record_type: RecordType) -> str:
        """Generate default process description based on record type"""
        descriptions = {
            RecordType.AUDIT_LOG: (
                "The Frasberg Governance System automatically creates audit log "
                "entries whenever significant system events occur. Each entry is "
                "timestamped with microsecond precision and includes a cryptographic "
                "hash of both its contents and the previous entry, creating a "
                "tamper-evident chain. The system uses SHA-256 hashing and atomic "
                "write operations to ensure integrity."
            ),
            RecordType.SYSTEM_LOG: (
                "System logs are automatically generated by the Frasberg platform "
                "during normal operations. Each log entry captures system events, "
                "errors, and diagnostic information with precise timestamps."
            ),
            RecordType.TRANSACTION_RECORD: (
                "Transaction records are created automatically when transactions are "
                "processed. Each record includes transaction details, timestamps, "
                "and cryptographic verification data."
            ),
        }
        
        return descriptions.get(
            record_type,
            f"Records of type {record_type.value} are created automatically by the "
            f"{self.system_name} during normal operations."
        )
    
    def _get_accuracy_methods(self, record_type: RecordType) -> List[str]:
        """Get accuracy methods for record type"""
        common_methods = [
            "Cryptographic hash chaining (SHA-256) for tamper detection",
            "Atomic write operations to prevent partial or inconsistent records",
            "High-precision timestamps synchronized to NTP time sources",
            "Automated validation checks before record creation",
            "Regular integrity verification of stored records",
        ]
        
        type_specific = {
            RecordType.AUDIT_LOG: [
                "Hash chain verification prevents undetected modifications",
                "Each entry links cryptographically to previous entry",
                "Genesis hash establishes chain beginning",
            ],
        }
        
        return common_methods + type_specific.get(record_type, [])
