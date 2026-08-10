# Frasberg AI Governance System v1.0.0

## Overview

The Frasberg AI Governance System is an institutional-grade compliance, audit, and governance framework designed for enterprise and legal use. It provides tamper-evident audit logging, FRE Rule 902(13) compliance, expert witness support, and multi-jurisdiction policy management.

## Architecture

The governance system consists of 11 major subsystems:

### 1. Core Audit System (`audit.py`)
- **Hash-Chained Audit Logging**: Cryptographically linked audit entries using SHA-256
- **Tamper Detection**: Automatic detection of any modifications to audit records
- **High-Precision Timestamps**: Microsecond-accurate timestamps in ISO 8601 format
- **Chain Verification**: Verify integrity of entire audit chain

### 2. Policy Engine (`policy.py`)
- **Multi-Jurisdiction Support**: Handle policies across different legal jurisdictions
- **Dynamic Policy Evaluation**: Real-time policy enforcement
- **Violation Tracking**: Automatic recording of policy violations
- **Priority-Based Resolution**: Higher priority policies take precedence

### 3. Export System (`export/`)
- **PDF Exports** (`pdf.py`): Court-ready PDF documents with certifications
- **JSONL Exports** (`jsonl.py`): Machine-readable JSON Lines format
- **Chain Verification** (`chain.py`): Cryptographic verification of exports

### 4. Authentication System (`authentication/`)
- **FRE Rule 902(13)** (`rule902.py`): Federal Rules of Evidence compliance
- **Certificate Generation** (`certificates.py`): Digital certificates for authentication
- **Certificate Verification** (`verifier.py`): Validate certificate integrity

### 5. Expert Witness Mode (`expert/`)
- **Technical Explanations** (`explainer.py`): Court-safe explanations of system operation
- **Q&A System** (`qa.py`): Scope-limited question answering
- **Scope Enforcement** (`scope.py`): Ensure testimony stays within expertise

### 6. Federation System (`federation/`)
- **Policy Mapping** (`policy_map.py`): Map policies across jurisdictions (GDPR, CCPA, HIPAA, etc.)
- **Policy Routing** (`router.py`): Route requests to appropriate policies
- **Retention Management** (`retention.py`): Jurisdiction-specific retention periods

### 7. Court Exhibits (`exhibits/`)
- **Exhibit Assembly** (`assembler.py`): Create court-ready exhibits
- **Indexing** (`indexer.py`): Searchable exhibit indexes
- **Cover Pages** (`cover.py`): Professional cover page generation

### 8. Key Management (`keys/`)
- **Key Storage** (`keystore.py`): Secure cryptographic key storage
- **Key Rotation** (`rotation.py`): Automated key rotation
- **Key Manifests** (`manifest.py`): Key inventory and tracking

### 9. Incident Response (`incident/`)
- **Incident Triggers** (`trigger.py`): Automated incident detection
- **System Freeze** (`freeze.py`): Litigation hold implementation
- **Incident Reporting** (`report.py`): Comprehensive incident reports

### 10. Backup System (`backup/`)
- **Snapshots** (`snapshot.py`): Point-in-time state snapshots
- **Restoration** (`restore.py`): Restore from snapshots
- **Verification** (`verification.py`): Verify backup integrity

### 11. Lifecycle Management (`lifecycle/`)
- **Version Management** (`versioning.py`): Track software versions
- **Deprecation Tracking** (`deprecation.py`): Manage deprecated features
- **Notice Generation** (`notices.py`): Generate deprecation notices

## Key Features

### Tamper-Evident Audit Logging

The audit system uses cryptographic hash chaining to create tamper-evident logs:

```python
from app.governance.audit import AuditLogger, AuditEventType, AuditSeverity

logger = AuditLogger()

# Create audit entry
entry = logger.log(
    event_type=AuditEventType.DATA_ACCESS,
    action="User accessed customer records",
    severity=AuditSeverity.INFO,
    user_id="user123",
    resource="customer_db",
)

# Verify chain integrity
result = logger.verify_chain()
print(f"Chain valid: {result.is_valid}")
```

### FRE Rule 902(13) Compliance

Generate authentication certificates for electronic records:

```python
from app.governance.authentication.rule902 import Rule902Authenticator, RecordType

authenticator = Rule902Authenticator()

certificate = authenticator.create_certificate(
    records=audit_entries,
    record_type=RecordType.AUDIT_LOG,
    custodian_name="John Doe",
    custodian_title="Chief Technology Officer",
    organization="Acme Corp",
)

# Generate certification text for court
cert_text = authenticator.generate_certification_text(certificate)
```

### Expert Witness Mode

Provide scope-limited technical explanations:

```python
from app.governance.expert.explainer import ExpertExplainer, ExplanationTopic

explainer = ExpertExplainer(
    expert_name="Dr. Jane Smith",
    qualifications={"education": "PhD Computer Science"}
)

# Get layperson explanation
explanation = explainer.explain(
    ExplanationTopic.HASH_CHAINING,
    technical_level=False
)
```

### Multi-Jurisdiction Policies

Handle compliance across multiple jurisdictions:

```python
from app.governance.federation.policy_map import PolicyMapper, Jurisdiction

mapper = PolicyMapper()

# Determine applicable jurisdictions
jurisdictions = mapper.get_applicable_jurisdictions(
    user_location="US-CA",
    data_type="personal_data"
)

# Check compliance
compliance = mapper.check_compliance(context, jurisdictions)
```

### Court Exhibits

Generate court-ready exhibits:

```python
from app.governance.exhibits.assembler import ExhibitAssembler

assembler = ExhibitAssembler(case_info={
    "case_number": "2024-CV-12345",
    "case_name": "Smith v. Jones"
})

exhibit = assembler.create_audit_log_exhibit(
    exhibit_number="A",
    audit_entries=entries,
    title="System Audit Logs"
)

# Generate exhibit package with cover and index
package = assembler.assemble_exhibit_package(
    exhibit_ids=[exhibit.exhibit_id],
    include_index=True,
    include_cover=True
)
```

## Standards Compliance

The governance system complies with:

- **FRE Rule 902(13)**: Self-authenticating electronic records
- **NIST FIPS 180-4**: SHA-256 cryptographic hashing
- **ISO 8601**: Date and time format
- **ISO 27001**: Information security management
- **GDPR**: EU data protection
- **CCPA**: California consumer privacy
- **HIPAA**: Healthcare data protection
- **SOX**: Financial records retention

## Security Features

1. **Cryptographic Hash Chaining**: Each audit entry links to previous entry via SHA-256 hash
2. **Tamper Detection**: Any modification breaks the hash chain
3. **Key Rotation**: Automated cryptographic key rotation
4. **Access Controls**: Policy-based access enforcement
5. **Audit Trail**: Complete audit trail of all operations
6. **Litigation Hold**: Freeze system state for legal proceedings

## Testing

Run the comprehensive test suite:

```bash
cd backend
python test_governance.py
```

This validates:
- Hash chain integrity
- Policy enforcement
- Export functionality
- Authentication certificates
- Expert witness mode
- Multi-jurisdiction policies
- Exhibit generation
- Key management
- Incident response
- Backup/restore
- Lifecycle management

## Usage Examples

### Complete Audit Workflow

```python
from app.governance.audit import AuditLogger, AuditEventType, AuditSeverity
from app.governance.export.pdf import PDFExporter
from app.governance.export.chain import ChainVerifier
from app.governance.authentication.rule902 import Rule902Authenticator, RecordType

# 1. Create audit logger
logger = AuditLogger()

# 2. Log events
logger.log(
    event_type=AuditEventType.SYSTEM_START,
    action="System initialized",
    severity=AuditSeverity.INFO
)

logger.log(
    event_type=AuditEventType.USER_LOGIN,
    action="User authenticated",
    user_id="user123",
    severity=AuditSeverity.INFO
)

# 3. Verify chain
verification = logger.verify_chain()
assert verification.is_valid

# 4. Export to PDF
entries = logger.get_entries()
pdf_exporter = PDFExporter()
pdf_bytes = pdf_exporter.export_entries(
    entries,
    title="Audit Log Export",
    include_certification=True
)

# 5. Generate FRE 902(13) certificate
authenticator = Rule902Authenticator()
certificate = authenticator.create_certificate(
    records=entries,
    record_type=RecordType.AUDIT_LOG,
    custodian_name="System Administrator",
    custodian_title="CTO",
    organization="Acme Corp"
)

# 6. Verify certificate
validation = authenticator.validate_certificate(certificate)
assert validation["valid"]
```

### Policy Enforcement Workflow

```python
from app.governance.policy import (
    PolicyEngine, Policy, PolicyType, PolicyAction,
    JurisdictionType, PolicyCondition
)

# 1. Create policy engine
engine = PolicyEngine()

# 2. Define policy
policy = Policy(
    policy_id="POL001",
    name="PII Access Control",
    description="Restrict access to PII",
    policy_type=PolicyType.ACCESS_CONTROL,
    jurisdictions=[JurisdictionType.EU_GDPR, JurisdictionType.CCPA],
    conditions=[
        PolicyCondition("data_type", "eq", "pii"),
        PolicyCondition("user_clearance", "lt", "high")
    ],
    action=PolicyAction.DENY,
    priority=100
)

engine.add_policy(policy)

# 3. Enforce policy
context = {
    "data_type": "pii",
    "user_clearance": "medium"
}

result = engine.enforce(context)
print(f"Access allowed: {result['allowed']}")
print(f"Action: {result['action']}")
```

## API Reference

See individual module docstrings for detailed API documentation:

- `app.governance.audit` - Audit logging
- `app.governance.policy` - Policy engine
- `app.governance.export` - Export functionality
- `app.governance.authentication` - Authentication & certificates
- `app.governance.expert` - Expert witness mode
- `app.governance.federation` - Multi-jurisdiction policies
- `app.governance.exhibits` - Court exhibits
- `app.governance.keys` - Key management
- `app.governance.incident` - Incident response
- `app.governance.backup` - Backup & restore
- `app.governance.lifecycle` - Version & deprecation management

## License

Part of Frasberg AI v1.0.0

## Support

For technical support or questions about the governance system, contact the Frasberg AI development team.
