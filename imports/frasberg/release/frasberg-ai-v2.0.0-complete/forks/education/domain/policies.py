"""
Education Fork - Policy Enforcement

Implements scope boundaries and compliance policies for educational contexts.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import re


class PolicyViolationType(Enum):
    """Types of policy violations."""
    PROHIBITED_ACTION = "prohibited_action"
    SCOPE_BOUNDARY = "scope_boundary"
    PRIVACY_VIOLATION = "privacy_violation"
    ACADEMIC_INTEGRITY = "academic_integrity"
    SAFETY_CONCERN = "safety_concern"


@dataclass
class PolicyViolation:
    """Represents a policy violation."""
    violation_type: PolicyViolationType
    description: str
    severity: str  # "low", "medium", "high", "critical"
    requires_escalation: bool
    user_message: str


class EducationPolicyEngine:
    """Enforces education fork policies and scope boundaries."""
    
    # Prohibited keywords and patterns
    GRADING_KEYWORDS = [
        r'\bgrade\s+this\b',
        r'\bassign\s+grade\b',
        r'\bgive\s+.*\s+grade\b',
        r'\bscore\s+this\b',
        r'\bevaluate\s+student\b',
        r'\brank\s+student'
    ]
    
    STUDENT_DATA_KEYWORDS = [
        r'\bstudent\s+record\b',
        r'\baccess\s+grades\b',
        r'\bpersonal\s+information\b',
        r'\bSSN\b',
        r'\bdate\s+of\s+birth\b'
    ]
    
    DISCIPLINARY_KEYWORDS = [
        r'\bpunish\b',
        r'\bdisciplin(e|ary)\b',
        r'\bsuspend\b',
        r'\bexpel\b',
        r'\bdetention\b'
    ]
    
    CHEATING_KEYWORDS = [
        r'\bdo\s+my\s+homework\b',
        r'\bcomplete\s+my\s+test\b',
        r'\bwrite\s+my\s+essay\b',
        r'\bcheat\b',
        r'\bplagiari[sz]e\b'
    ]
    
    SAFETY_KEYWORDS = [
        r'\bsuicid(e|al)\b',
        r'\bself[- ]harm\b',
        r'\babuse\b',
        r'\bhurt\s+(myself|others)\b',
        r'\bkill\b'
    ]
    
    def __init__(self):
        self.violation_log: List[PolicyViolation] = []
    
    def validate_request(self, request: str, context: Optional[Dict] = None) -> Tuple[bool, Optional[PolicyViolation]]:
        """
        Validate a request against education policies.
        
        Returns:
            (is_valid, violation_or_none)
        """
        request_lower = request.lower()
        
        # Check for safety concerns first (highest priority)
        safety_violation = self._check_safety(request_lower)
        if safety_violation:
            return False, safety_violation
        
        # Check for grading/evaluation requests
        grading_violation = self._check_grading(request_lower)
        if grading_violation:
            return False, grading_violation
        
        # Check for student data access
        privacy_violation = self._check_privacy(request_lower)
        if privacy_violation:
            return False, privacy_violation
        
        # Check for disciplinary action requests
        disciplinary_violation = self._check_disciplinary(request_lower)
        if disciplinary_violation:
            return False, disciplinary_violation
        
        # Check for academic integrity concerns
        integrity_violation = self._check_academic_integrity(request_lower)
        if integrity_violation:
            return False, integrity_violation
        
        return True, None
    
    def _check_safety(self, request: str) -> Optional[PolicyViolation]:
        """Check for safety-related concerns."""
        for pattern in self.SAFETY_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return PolicyViolation(
                    violation_type=PolicyViolationType.SAFETY_CONCERN,
                    description="Student safety concern detected",
                    severity="critical",
                    requires_escalation=True,
                    user_message=(
                        "I'm concerned about what you've shared. Please speak with:\n"
                        "• A trusted adult, teacher, or school counselor\n"
                        "• National Suicide Prevention Lifeline: 988\n"
                        "• Crisis Text Line: Text HOME to 741741\n\n"
                        "Your safety is important. Professional help is available."
                    )
                )
        return None
    
    def _check_grading(self, request: str) -> Optional[PolicyViolation]:
        """Check for grading and evaluation requests."""
        for pattern in self.GRADING_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return PolicyViolation(
                    violation_type=PolicyViolationType.PROHIBITED_ACTION,
                    description="Grading/evaluation request",
                    severity="medium",
                    requires_escalation=False,
                    user_message=(
                        "I cannot assign grades or evaluate student performance. This requires:\n\n"
                        "✓ Professional educator judgment\n"
                        "✓ Complete context of student work\n"
                        "✓ Institutional policies\n\n"
                        "I CAN help with:\n"
                        "• Creating grading rubrics\n"
                        "• Designing evaluation criteria\n"
                        "• Organizing assessment workflows\n\n"
                        "Would you like help with assessment design instead?"
                    )
                )
        return None
    
    def _check_privacy(self, request: str) -> Optional[PolicyViolation]:
        """Check for student privacy violations."""
        for pattern in self.STUDENT_DATA_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return PolicyViolation(
                    violation_type=PolicyViolationType.PRIVACY_VIOLATION,
                    description="Student data access attempt",
                    severity="high",
                    requires_escalation=True,
                    user_message=(
                        "I cannot access student records or personal information.\n\n"
                        "This protects:\n"
                        "• FERPA compliance\n"
                        "• Student privacy rights\n"
                        "• Data security\n\n"
                        "For student records, please use your institution's "
                        "authorized systems and procedures."
                    )
                )
        return None
    
    def _check_disciplinary(self, request: str) -> Optional[PolicyViolation]:
        """Check for disciplinary action requests."""
        for pattern in self.DISCIPLINARY_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return PolicyViolation(
                    violation_type=PolicyViolationType.PROHIBITED_ACTION,
                    description="Disciplinary action request",
                    severity="high",
                    requires_escalation=False,
                    user_message=(
                        "I cannot recommend or implement disciplinary actions.\n\n"
                        "Disciplinary decisions require:\n"
                        "• Professional educator judgment\n"
                        "• Institutional due process\n"
                        "• Policy compliance\n"
                        "• Student rights protection\n\n"
                        "I CAN help with:\n"
                        "• Positive behavior strategies\n"
                        "• Classroom management techniques\n"
                        "• Conflict resolution approaches\n\n"
                        "Would you like support with proactive classroom management?"
                    )
                )
        return None
    
    def _check_academic_integrity(self, request: str) -> Optional[PolicyViolation]:
        """Check for academic integrity concerns."""
        for pattern in self.CHEATING_KEYWORDS:
            if re.search(pattern, request, re.IGNORECASE):
                return PolicyViolation(
                    violation_type=PolicyViolationType.ACADEMIC_INTEGRITY,
                    description="Academic integrity concern",
                    severity="high",
                    requires_escalation=False,
                    user_message=(
                        "I'm designed to support learning, not complete work for you.\n\n"
                        "Academic integrity means:\n"
                        "• Doing your own work\n"
                        "• Learning through practice\n"
                        "• Asking for help, not answers\n"
                        "• Building real understanding\n\n"
                        "I CAN help you:\n"
                        "• Understand concepts\n"
                        "• Learn problem-solving approaches\n"
                        "• Develop study strategies\n"
                        "• Find learning resources\n\n"
                        "What concept would you like help understanding?"
                    )
                )
        return None
    
    def log_violation(self, violation: PolicyViolation) -> None:
        """Log a policy violation for audit purposes."""
        self.violation_log.append(violation)
    
    def get_violation_summary(self) -> Dict[str, int]:
        """Get summary of violations by type."""
        summary = {}
        for violation in self.violation_log:
            vtype = violation.violation_type.value
            summary[vtype] = summary.get(vtype, 0) + 1
        return summary


class FERPAComplianceChecker:
    """Ensures FERPA compliance in education fork operations."""
    
    PROTECTED_DATA_TYPES = [
        "student_grades",
        "test_scores",
        "disciplinary_records",
        "special_education_status",
        "personally_identifiable_information"
    ]
    
    @staticmethod
    def validate_data_handling(data_type: str, operation: str) -> Tuple[bool, str]:
        """
        Validate if data handling complies with FERPA.
        
        Returns:
            (is_compliant, message)
        """
        if data_type in FERPAComplianceChecker.PROTECTED_DATA_TYPES:
            return False, (
                f"Cannot perform '{operation}' on '{data_type}'. "
                "This is FERPA-protected educational data. "
                "Use authorized institutional systems only."
            )
        return True, "Operation compliant"
    
    @staticmethod
    def sanitize_context(context: Dict) -> Dict:
        """Remove any FERPA-protected data from context."""
        sanitized = context.copy()
        
        # Remove protected fields
        protected_fields = [
            'student_id',
            'ssn',
            'grades',
            'test_scores',
            'date_of_birth',
            'address',
            'parent_contact'
        ]
        
        for field in protected_fields:
            if field in sanitized:
                sanitized[field] = "[REDACTED - FERPA PROTECTED]"
        
        return sanitized


# Singleton policy engine instance
_policy_engine: Optional[EducationPolicyEngine] = None


def get_policy_engine() -> EducationPolicyEngine:
    """Get or create the policy engine singleton."""
    global _policy_engine
    if _policy_engine is None:
        _policy_engine = EducationPolicyEngine()
    return _policy_engine
