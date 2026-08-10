"""
Healthcare Non-Clinical Fork - Policy Enforcement

Implements STRICT scope boundaries and compliance for healthcare non-clinical operations.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import re


class HealthcarePolicyViolationType(Enum):
    """Types of healthcare policy violations."""
    CLINICAL_QUERY = "clinical_query"
    DIAGNOSIS_ATTEMPT = "diagnosis_attempt"
    TREATMENT_ADVICE = "treatment_advice"
    MEDICATION_GUIDANCE = "medication_guidance"
    EMERGENCY_SITUATION = "emergency_situation"
    PHI_ACCESS = "phi_access"
    SYMPTOM_ASSESSMENT = "symptom_assessment"
    TEST_INTERPRETATION = "test_interpretation"


@dataclass
class HealthcarePolicyViolation:
    """Represents a healthcare policy violation."""
    violation_type: HealthcarePolicyViolationType
    description: str
    severity: str  # "low", "medium", "high", "critical"
    requires_immediate_escalation: bool
    user_message: str
    emergency_resources: List[str] = None


class HealthcareNonClinicalPolicyEngine:
    """Enforces healthcare non-clinical fork policies with STRICT boundaries."""
    
    # CRITICAL: Clinical keywords that trigger immediate rejection
    DIAGNOSIS_KEYWORDS = [
        r'\bdiagnos(e|is)\b',
        r'\bwhat\s+(is|do)\s+i\s+have\b',
        r'\bdo\s+i\s+have\b',
        r'\bcould\s+this\s+be\b',
        r'\bis\s+this\b.*\b(disease|condition|illness)\b',
        r'\bidentify.*condition\b'
    ]
    
    TREATMENT_KEYWORDS = [
        r'\btreat(ment)?\b',
        r'\bshould\s+i\s+take\b',
        r'\bhow\s+to\s+(cure|fix|heal)\b',
        r'\bwhat\s+should\s+i\s+do\s+for\b',
        r'\brecommend.*treatment\b',
        r'\btherapy\s+for\b'
    ]
    
    SYMPTOM_KEYWORDS = [
        r'\bmy\s+symptoms?\b',
        r'\bi\s+(have|feel|am)\s+(pain|sick|ill)\b',
        r'\bexperiencing\b',
        r'\bhurts?\b',
        r'\baching\b',
        r'\bsore\b',
        r'\bnausea\b',
        r'\bdizzy\b',
        r'\bfever\b',
        r'\bcough\b',
        r'\bbleed(ing)?\b'
    ]
    
    MEDICATION_KEYWORDS = [
        r'\bmedication\b',
        r'\bmedicine\b',
        r'\bprescription\b',
        r'\bdrug\b',
        r'\bpill\b',
        r'\bdosage\b',
        r'\bshould\s+i\s+take\b',
        r'\bhow\s+much\b.*\b(medication|medicine|drug)\b'
    ]
    
    EMERGENCY_KEYWORDS = [
        r'\bemergency\b',
        r'\bchest\s+pain\b',
        r'\bcan\'?t\s+breathe\b',
        r'\bunconsciou?s\b',
        r'\bsevere\s+(pain|bleeding)\b',
        r'\bstroke\b',
        r'\bheart\s+attack\b',
        r'\bseizure\b',
        r'\boverdose\b',
        r'\bsuicid(e|al)\b',
        r'\bkill\s+myself\b'
    ]
    
    TEST_RESULT_KEYWORDS = [
        r'\btest\s+results?\b',
        r'\blab\s+results?\b',
        r'\bblood\s+work\b',
        r'\bx-?ray\b',
        r'\bMRI\b',
        r'\bCT\s+scan\b',
        r'\binterpret.*results?\b'
    ]
    
    PHI_KEYWORDS = [
        r'\bmedical\s+record\b',
        r'\bhealth\s+record\b',
        r'\bpatient\s+record\b',
        r'\bPHI\b',
        r'\bmy\s+chart\b',
        r'\baccess.*records?\b'
    ]
    
    def __init__(self):
        self.violation_log: List[HealthcarePolicyViolation] = []
    
    def validate_request(self, request: str, context: Optional[Dict] = None) -> Tuple[bool, Optional[HealthcarePolicyViolation]]:
        """
        Validate request against healthcare non-clinical policies.
        
        Returns:
            (is_valid, violation_or_none)
        """
        request_lower = request.lower()
        
        # Priority 1: Emergency situations (HIGHEST)
        emergency_violation = self._check_emergency(request_lower)
        if emergency_violation:
            return False, emergency_violation
        
        # Priority 2: Clinical queries
        clinical_violations = [
            self._check_diagnosis(request_lower),
            self._check_symptoms(request_lower),
            self._check_treatment(request_lower),
            self._check_medication(request_lower),
            self._check_test_results(request_lower)
        ]
        
        for violation in clinical_violations:
            if violation:
                return False, violation
        
        # Priority 3: PHI access
        phi_violation = self._check_phi_access(request_lower)
        if phi_violation:
            return False, phi_violation
        
        return True, None
    
    def _check_emergency(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for emergency situations."""
        for pattern in self.EMERGENCY_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.EMERGENCY_SITUATION,
                    description="Medical emergency detected",
                    severity="critical",
                    requires_immediate_escalation=True,
                    user_message=(
                        "🚨 EMERGENCY SITUATION DETECTED 🚨\n\n"
                        "If this is a medical emergency:\n"
                        "→ CALL 911 IMMEDIATELY\n"
                        "→ Do not wait for assistance\n"
                        "→ Go to nearest emergency department\n\n"
                        "I cannot assess emergencies or provide emergency care.\n\n"
                        "Emergency Resources:\n"
                        "• Emergency Services: 911\n"
                        "• Poison Control: 1-800-222-1222\n"
                        "• Suicide & Crisis Lifeline: 988\n\n"
                        "Do you need help contacting emergency services?"
                    ),
                    emergency_resources=["911", "1-800-222-1222", "988"]
                )
        return None
    
    def _check_diagnosis(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for diagnosis requests."""
        for pattern in self.DIAGNOSIS_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.DIAGNOSIS_ATTEMPT,
                    description="Diagnosis request",
                    severity="critical",
                    requires_immediate_escalation=False,
                    user_message=(
                        "⚠️  I CANNOT DIAGNOSE MEDICAL CONDITIONS\n\n"
                        "I am NOT a doctor or healthcare professional.\n\n"
                        "For diagnosis:\n"
                        "✓ Contact your healthcare provider\n"
                        "✓ Call your doctor's office\n"
                        "✓ Visit urgent care if needed\n"
                        "✓ Call 911 for emergencies\n\n"
                        "I can help with:\n"
                        "• Administrative questions\n"
                        "• Appointment scheduling\n"
                        "• General facility information\n\n"
                        "Would you like help with non-clinical support?"
                    )
                )
        return None
    
    def _check_symptoms(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for symptom assessment requests."""
        for pattern in self.SYMPTOM_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.SYMPTOM_ASSESSMENT,
                    description="Symptom assessment request",
                    severity="high",
                    requires_immediate_escalation=False,
                    user_message=(
                        "⚠️ SYMPTOM ASSESSMENT REQUIRED\n\n"
                        "I cannot assess symptoms or medical conditions.\n\n"
                        "For your symptoms, please:\n\n"
                        "IMMEDIATELY:\n"
                        "→ Contact your healthcare provider\n"
                        "→ Call your doctor's office\n"
                        "→ Use your health system's nurse line\n\n"
                        "IF URGENT:\n"
                        "→ Visit urgent care\n"
                        "→ Go to emergency department\n"
                        "→ Call 911 if severe\n\n"
                        "I can help you find contact information for your provider if needed."
                    )
                )
        return None
    
    def _check_treatment(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for treatment advice requests."""
        for pattern in self.TREATMENT_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.TREATMENT_ADVICE,
                    description="Treatment advice request",
                    severity="critical",
                    requires_immediate_escalation=False,
                    user_message=(
                        "⚠️  I CANNOT PROVIDE TREATMENT ADVICE\n\n"
                        "Treatment recommendations require:\n"
                        "• Licensed healthcare professional\n"
                        "• Complete medical history review\n"
                        "• Physical examination\n"
                        "• Professional clinical judgment\n\n"
                        "Contact:\n"
                        "✓ Your healthcare provider\n"
                        "✓ Your doctor's office\n"
                        "✓ Urgent care if needed\n"
                        "✓ 911 for emergencies\n\n"
                        "I can help with administrative support only."
                    )
                )
        return None
    
    def _check_medication(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for medication guidance requests."""
        for pattern in self.MEDICATION_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.MEDICATION_GUIDANCE,
                    description="Medication guidance request",
                    severity="critical",
                    requires_immediate_escalation=False,
                    user_message=(
                        "⚠️ MEDICATION INFORMATION\n\n"
                        "I cannot provide medication advice or instructions.\n\n"
                        "For medication questions:\n"
                        "✓ Contact your prescribing provider\n"
                        "✓ Call your pharmacy\n"
                        "✓ Use your medication guide\n"
                        "✓ Call poison control: 1-800-222-1222 (if emergency)\n\n"
                        "NEVER:\n"
                        "❌ Change doses without provider approval\n"
                        "❌ Stop medications without consulting provider\n"
                        "❌ Start new medications without prescription\n\n"
                        "I can provide general medication education (non-specific), but\n"
                        "ALL specific medication questions require professional guidance."
                    )
                )
        return None
    
    def _check_test_results(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for test result interpretation requests."""
        for pattern in self.TEST_RESULT_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.TEST_INTERPRETATION,
                    description="Test result interpretation request",
                    severity="high",
                    requires_immediate_escalation=False,
                    user_message=(
                        "⚠️ MEDICAL TEST RESULTS\n\n"
                        "I cannot interpret medical test results.\n\n"
                        "For your test results:\n"
                        "✓ Contact the ordering healthcare provider\n"
                        "✓ Schedule a results review appointment\n"
                        "✓ Call your doctor's office\n"
                        "✓ Use your patient portal to message provider\n\n"
                        "Your healthcare provider is the only appropriate person to:\n"
                        "• Interpret your results\n"
                        "• Explain what results mean\n"
                        "• Recommend next steps\n"
                        "• Provide medical guidance\n\n"
                        "Would you like help scheduling an appointment to discuss results?"
                    )
                )
        return None
    
    def _check_phi_access(self, request: str) -> Optional[HealthcarePolicyViolation]:
        """Check for PHI access attempts."""
        for pattern in self.PHI_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return HealthcarePolicyViolation(
                    violation_type=HealthcarePolicyViolationType.PHI_ACCESS,
                    description="PHI access attempt",
                    severity="critical",
                    requires_immediate_escalation=True,
                    user_message=(
                        "⚠️ PROTECTED HEALTH INFORMATION\n\n"
                        "I do NOT have access to:\n"
                        "❌ Your medical records\n"
                        "❌ Your test results\n"
                        "❌ Your health history\n"
                        "❌ Protected health information (PHI)\n\n"
                        "To access your medical information:\n"
                        "✓ Use your patient portal\n"
                        "✓ Contact medical records department\n"
                        "✓ Call your healthcare provider's office\n\n"
                        "This protects your privacy and complies with HIPAA."
                    )
                )
        return None
    
    def log_violation(self, violation: HealthcarePolicyViolation) -> None:
        """Log a policy violation for audit purposes."""
        self.violation_log.append(violation)
    
    def get_violation_summary(self) -> Dict[str, int]:
        """Get summary of violations by type."""
        summary = {}
        for violation in self.violation_log:
            vtype = violation.violation_type.value
            summary[vtype] = summary.get(vtype, 0) + 1
        return summary


class HIPAAComplianceChecker:
    """Ensures HIPAA compliance in healthcare fork operations."""
    
    @staticmethod
    def validate_data_handling(data_type: str, operation: str) -> Tuple[bool, str]:
        """
        Validate if data handling complies with HIPAA.
        
        Returns:
            (is_compliant, message)
        """
        phi_data_types = [
            "medical_records",
            "test_results",
            "diagnoses",
            "treatment_history",
            "patient_identifiers",
            "health_information"
        ]
        
        if data_type in phi_data_types:
            return False, (
                f"Cannot perform '{operation}' on '{data_type}'. "
                "This is HIPAA-protected health information (PHI). "
                "Use authorized, HIPAA-compliant systems only."
            )
        return True, "Operation compliant"
    
    @staticmethod
    def sanitize_context(context: Dict) -> Dict:
        """Remove any PHI from context."""
        sanitized = context.copy()
        
        phi_fields = [
            'patient_id',
            'mrn',
            'ssn',
            'date_of_birth',
            'medical_history',
            'diagnoses',
            'test_results',
            'medications',
            'treatment_plan',
            'provider_notes'
        ]
        
        for field in phi_fields:
            if field in sanitized:
                sanitized[field] = "[REDACTED - PHI/HIPAA PROTECTED]"
        
        return sanitized


# Singleton policy engine
_healthcare_policy_engine: Optional[HealthcareNonClinicalPolicyEngine] = None


def get_healthcare_policy_engine() -> HealthcareNonClinicalPolicyEngine:
    """Get or create the healthcare policy engine singleton."""
    global _healthcare_policy_engine
    if _healthcare_policy_engine is None:
        _healthcare_policy_engine = HealthcareNonClinicalPolicyEngine()
    return _healthcare_policy_engine
