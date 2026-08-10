"""
Comprehensive test suite for Frasberg AI Governance System v1.0.0

Tests all governance modules to ensure proper functionality.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.governance.audit import AuditLogger, AuditEventType, AuditSeverity
from app.governance.policy import PolicyEngine, Policy, PolicyType, PolicyAction, JurisdictionType, PolicyCondition
from app.governance.export.pdf import PDFExporter
from app.governance.export.jsonl import JSONLExporter
from app.governance.export.chain import ChainVerifier
from app.governance.authentication.rule902 import Rule902Authenticator, RecordType
from app.governance.authentication.certificates import CertificateGenerator
from app.governance.authentication.verifier import CertificateVerifier
from app.governance.expert.explainer import ExpertExplainer, ExplanationTopic
from app.governance.expert.qa import ExpertQA, QuestionType
from app.governance.expert.scope import ExpertScope
from app.governance.federation.policy_map import PolicyMapper, Jurisdiction
from app.governance.federation.router import PolicyRouter
from app.governance.federation.retention import RetentionManager
from app.governance.exhibits.assembler import ExhibitAssembler
from app.governance.exhibits.indexer import ExhibitIndexer
from app.governance.exhibits.cover import CoverPageGenerator
from app.governance.keys.keystore import KeyStore
from app.governance.keys.rotation import KeyRotation
from app.governance.keys.manifest import KeyManifest
from app.governance.incident.trigger import IncidentTrigger, IncidentType, IncidentSeverity
from app.governance.incident.freeze import SystemFreeze
from app.governance.incident.report import IncidentReport
from app.governance.backup.snapshot import SnapshotManager
from app.governance.backup.restore import RestoreManager
from app.governance.backup.verification import BackupVerifier
from app.governance.lifecycle.versioning import VersionManager
from app.governance.lifecycle.deprecation import DeprecationTracker
from app.governance.lifecycle.notices import NoticeGenerator


def test_audit_system():
    """Test hash-chained audit logging"""
    print("Testing Audit System...")
    
    logger = AuditLogger()
    
    # Create audit entries
    entry1 = logger.log(
        event_type=AuditEventType.SYSTEM_START,
        action="System initialized",
        severity=AuditSeverity.INFO,
        user_id="system",
    )
    
    entry2 = logger.log(
        event_type=AuditEventType.USER_LOGIN,
        action="User logged in",
        severity=AuditSeverity.INFO,
        user_id="user123",
    )
    
    entry3 = logger.log(
        event_type=AuditEventType.DATA_ACCESS,
        action="Accessed sensitive data",
        severity=AuditSeverity.WARNING,
        user_id="user123",
        resource="customer_records",
    )
    
    # Verify chain
    result = logger.verify_chain()
    assert result.is_valid, "Chain verification failed"
    assert result.total_entries == 3
    assert result.verified_entries == 3
    
    # Export chain
    exported = logger.export_chain()
    assert len(exported) == 3
    
    print(f"✓ Created {result.total_entries} audit entries with valid hash chain")
    print(f"✓ Chain verified: {result.verified_entries}/{result.total_entries} entries valid")
    return logger


def test_policy_engine():
    """Test policy enforcement"""
    print("\nTesting Policy Engine...")
    
    engine = PolicyEngine()
    
    # Create a policy
    policy = Policy(
        policy_id="POL001",
        name="Data Access Control",
        description="Restrict access to sensitive data",
        policy_type=PolicyType.ACCESS_CONTROL,
        jurisdictions=[JurisdictionType.US_FEDERAL, JurisdictionType.EU_GDPR],
        conditions=[
            PolicyCondition("user_role", "eq", "admin"),
            PolicyCondition("data_classification", "eq", "sensitive"),
        ],
        action=PolicyAction.DENY,
        priority=100,
    )
    
    engine.add_policy(policy)
    
    # Test enforcement
    context = {
        "user_role": "admin",
        "data_classification": "sensitive",
    }
    
    result = engine.enforce(context)
    assert not result["allowed"], "Policy should deny access"
    
    print(f"✓ Policy engine working - denied access as expected")
    print(f"✓ Policies loaded: {len(engine.list_policies())}")
    return engine


def test_export_system(logger):
    """Test export functionality"""
    print("\nTesting Export System...")
    
    entries = logger.get_entries()
    
    # Test PDF export
    pdf_exporter = PDFExporter()
    pdf_bytes = pdf_exporter.export_entries(entries, title="Test Audit Export")
    assert len(pdf_bytes) > 0
    print(f"✓ PDF export generated ({len(pdf_bytes)} bytes)")
    
    # Test JSONL export
    jsonl_exporter = JSONLExporter()
    jsonl_bytes = jsonl_exporter.export_entries(entries)
    assert len(jsonl_bytes) > 0
    print(f"✓ JSONL export generated ({len(jsonl_bytes)} bytes)")
    
    # Test chain verification
    verifier = ChainVerifier()
    verification = verifier.verify_chain(entries)
    assert verification["valid"]
    print(f"✓ Chain verification passed")


def test_authentication_system(logger):
    """Test FRE Rule 902(13) authentication"""
    print("\nTesting Authentication System...")
    
    authenticator = Rule902Authenticator()
    entries = logger.get_entries()
    
    # Create authentication certificate
    cert = authenticator.create_certificate(
        records=entries,
        record_type=RecordType.AUDIT_LOG,
        custodian_name="John Doe",
        custodian_title="Chief Technology Officer",
        organization="Frasberg AI",
    )
    
    assert cert.created_by_system
    assert cert.record_count == len(entries)
    print(f"✓ FRE 902(13) certificate created for {cert.record_count} records")
    
    # Validate certificate
    validation = authenticator.validate_certificate(cert)
    assert validation["valid"]
    print(f"✓ Certificate validation passed")
    
    # Test certificate generator
    cert_gen = CertificateGenerator()
    signing_cert = cert_gen.generate_signing_certificate(
        signer_name="Jane Smith",
        document_type="Audit Report",
    )
    assert signing_cert.is_valid()
    print(f"✓ Signing certificate generated")
    
    # Test certificate verifier
    verifier = CertificateVerifier()
    verify_result = verifier.verify_certificate(signing_cert)
    print(f"✓ Certificate verified: {verify_result['valid']}")


def test_expert_witness_system():
    """Test expert witness functionality"""
    print("\nTesting Expert Witness System...")
    
    # Create expert scope
    qualifications = {
        "education": "PhD Computer Science",
        "experience": "15 years in cryptography and audit systems",
        "certifications": "CISSP, CISM",
    }
    
    scope = ExpertScope.create_default_scope(
        expert_name="Dr. Sarah Johnson",
        qualifications=qualifications,
    )
    
    # Test explainer
    explainer = ExpertExplainer(
        expert_name="Dr. Sarah Johnson",
        qualifications=qualifications,
    )
    
    explanation = explainer.explain(
        ExplanationTopic.HASH_CHAINING,
        technical_level=False,
    )
    assert len(explanation) > 0
    print(f"✓ Expert explanation generated")
    
    # Test Q&A system
    qa = ExpertQA(expert_name="Dr. Sarah Johnson", scope=scope)
    
    answer = qa.answer_question(
        question_text="How does hash chaining work?",
        question_type=QuestionType.TECHNICAL,
    )
    assert answer.in_scope
    print(f"✓ Expert Q&A system working")


def test_federation_system():
    """Test multi-jurisdiction policies"""
    print("\nTesting Federation System...")
    
    mapper = PolicyMapper()
    
    # Get applicable jurisdictions
    jurisdictions = mapper.get_applicable_jurisdictions(
        user_location="US-CA",
        data_type="personal_data",
    )
    assert Jurisdiction.US_CALIFORNIA in jurisdictions
    print(f"✓ Jurisdiction mapping: {len(jurisdictions)} jurisdictions apply")
    
    # Test policy router
    router = PolicyRouter(mapper)
    context = {
        "user_location": "US-CA",
        "data_type": "personal_data",
        "encrypted": True,
        "audited": True,
    }
    
    routing = router.route(context)
    print(f"✓ Policy routing: {len(routing['applicable_policies'])} policies apply")
    
    # Test retention manager
    retention = RetentionManager()
    record = retention.create_retention_record(
        record_id="REC001",
        data_type="audit_log",
        jurisdictions=["US_FEDERAL"],
    )
    assert record.retention_until
    retention_days = retention.get_retention_period('audit_log', ['US_FEDERAL'])
    print(f"✓ Retention period: {retention_days} days")


def test_exhibits_system():
    """Test court exhibits generation"""
    print("\nTesting Exhibits System...")
    
    case_info = {
        "case_number": "2024-CV-12345",
        "case_name": "Test v. Example",
        "court": "Superior Court",
    }
    
    assembler = ExhibitAssembler(case_info)
    
    # Create exhibit
    exhibit = assembler.create_audit_log_exhibit(
        exhibit_number="A",
        audit_entries=[{"entry": "test"}],
    )
    assert exhibit.exhibit_number == "A"
    print(f"✓ Exhibit {exhibit.exhibit_number} created")
    
    # Test cover page generator
    cover_gen = CoverPageGenerator(case_info)
    cover = cover_gen.generate_cover_page(
        exhibit_number="A",
        title="Audit Logs",
        page_count=10,
    )
    assert "EXHIBIT A" in cover
    print(f"✓ Cover page generated")


def test_keys_management():
    """Test key management system"""
    print("\nTesting Keys Management...")
    
    keystore = KeyStore()
    
    # Generate key
    key = keystore.generate_key(key_type="signing")
    assert key.status == "active"
    print(f"✓ Generated key: {key.key_id[:8]}...")
    
    # Test rotation
    rotation = KeyRotation(keystore)
    result = rotation.rotate_key(reason="testing")
    assert result["new_key_id"]
    print(f"✓ Key rotation completed")
    
    # Test manifest
    manifest_gen = KeyManifest(keystore)
    manifest = manifest_gen.generate_manifest()
    assert manifest["total_keys"] >= 2
    print(f"✓ Key manifest: {manifest['total_keys']} keys")


def test_incident_management():
    """Test incident response"""
    print("\nTesting Incident Management...")
    
    trigger = IncidentTrigger()
    
    # Trigger incident
    incident = trigger.trigger_incident(
        incident_type=IncidentType.SECURITY_BREACH,
        severity=IncidentSeverity.HIGH,
        description="Unauthorized access detected",
        triggered_by="security_system",
    )
    assert incident.status == "open"
    print(f"✓ Incident triggered: {incident.incident_id[:8]}...")
    
    # Test freeze
    freeze_sys = SystemFreeze()
    freeze = freeze_sys.initiate_freeze(
        reason="Litigation hold",
        scope=["audit_logs", "user_data"],
        initiated_by="legal_team",
    )
    assert freeze.status == "active"
    print(f"✓ System freeze initiated")
    
    # Test incident report
    reporter = IncidentReport(trigger)
    report = reporter.generate_report(incident.incident_id)
    assert "incident" in report
    print(f"✓ Incident report generated")


def test_backup_system():
    """Test backup and restore"""
    print("\nTesting Backup System...")
    
    snapshot_mgr = SnapshotManager()
    
    # Create snapshot
    snapshot = snapshot_mgr.create_snapshot(
        state_type="audit_logs",
        state_data={"entries": [1, 2, 3]},
    )
    assert snapshot.checksum
    print(f"✓ Snapshot created: {snapshot.snapshot_id[:8]}...")
    
    # Test restore
    restore_mgr = RestoreManager(snapshot_mgr)
    restore_result = restore_mgr.restore_from_snapshot(
        snapshot.snapshot_id,
        dry_run=True,
    )
    assert restore_result["success"]
    print(f"✓ Restore validated (dry run)")
    
    # Test verification
    verifier = BackupVerifier(snapshot_mgr)
    verify_result = verifier.verify_snapshot(snapshot.snapshot_id)
    assert verify_result["valid"]
    print(f"✓ Backup verification passed")


def test_lifecycle_management():
    """Test version and deprecation management"""
    print("\nTesting Lifecycle Management...")
    
    version_mgr = VersionManager(current_version="1.0.0")
    
    # Register version
    version = version_mgr.register_version(
        "1.0.0",
        changelog=["Initial release"],
    )
    assert version.major == 1
    print(f"✓ Version registered: {version.version_string}")
    
    # Test deprecation
    deprecation = DeprecationTracker()
    notice = deprecation.deprecate_feature(
        feature_name="old_api",
        deprecated_in="1.0.0",
        removal_in="2.0.0",
        reason="Replaced by new API",
        migration_guide="Use new_api instead",
    )
    assert notice.feature_name == "old_api"
    print(f"✓ Feature deprecated: {notice.feature_name}")
    
    # Test notice generator
    notice_gen = NoticeGenerator(deprecation)
    notice_text = notice_gen.generate_notice("old_api")
    assert "DEPRECATION NOTICE" in notice_text
    print(f"✓ Deprecation notice generated")


def run_all_tests():
    """Run all governance system tests"""
    print("="*80)
    print("Frasberg AI Governance System v1.0.0 - Comprehensive Test Suite")
    print("="*80)
    
    try:
        # Run all tests
        logger = test_audit_system()
        engine = test_policy_engine()
        test_export_system(logger)
        test_authentication_system(logger)
        test_expert_witness_system()
        test_federation_system()
        test_exhibits_system()
        test_keys_management()
        test_incident_management()
        test_backup_system()
        test_lifecycle_management()
        
        print("\n" + "="*80)
        print("✓ ALL TESTS PASSED SUCCESSFULLY")
        print("="*80)
        print("\nGovernance System v1.0.0 is fully operational with:")
        print("• Hash-chained audit logging (tamper-evident)")
        print("• FRE Rule 902(13) compliance")
        print("• Expert witness mode (scope-limited)")
        print("• Multi-jurisdiction policy support")
        print("• Incident response with litigation hold")
        print("• Key rotation and management")
        print("• Court-ready exhibit generation")
        print("="*80)
        
        return True
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
