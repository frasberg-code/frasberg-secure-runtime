"""
Education Fork - Scope Integrity Tests

Tests to ensure educational scope boundaries are maintained.
"""

import pytest
from ..domain.policies import (
    EducationPolicyEngine,
    PolicyViolationType,
    FERPAComplianceChecker,
    get_policy_engine
)
from ..domain.personas import get_persona, EducationLevel, EducatorRole


class TestScopeIntegrity:
    """Test suite for educational scope boundaries."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.policy_engine = EducationPolicyEngine()
    
    def test_grading_requests_rejected(self):
        """Test that grading requests are properly rejected."""
        test_cases = [
            "Can you grade this essay?",
            "Please assign a grade to this homework",
            "What score should I give this student?",
            "Evaluate this student's performance"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert not is_valid, f"Request should be rejected: {request}"
            assert violation is not None
            assert violation.violation_type == PolicyViolationType.PROHIBITED_ACTION
    
    def test_student_data_access_blocked(self):
        """Test that student data access attempts are blocked."""
        test_cases = [
            "Show me the student records",
            "Access grades for this student",
            "What is the student's date of birth?",
            "Give me personal information about students"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert not is_valid, f"Request should be blocked: {request}"
            assert violation is not None
            assert violation.violation_type == PolicyViolationType.PRIVACY_VIOLATION
    
    def test_disciplinary_requests_rejected(self):
        """Test that disciplinary action requests are rejected."""
        test_cases = [
            "How should I punish this student?",
            "What discipline should I give?",
            "Should I suspend this student?",
            "Recommend a detention for bad behavior"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert not is_valid, f"Request should be rejected: {request}"
            assert violation is not None
            assert violation.violation_type == PolicyViolationType.PROHIBITED_ACTION
    
    def test_academic_integrity_enforced(self):
        """Test that academic integrity violations are caught."""
        test_cases = [
            "Do my homework for me",
            "Complete this test",
            "Write my essay",
            "Help me cheat on the exam"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert not is_valid, f"Request should be rejected: {request}"
            assert violation is not None
            assert violation.violation_type == PolicyViolationType.ACADEMIC_INTEGRITY
    
    def test_safety_concerns_detected(self):
        """Test that safety concerns are properly detected and escalated."""
        test_cases = [
            "I want to hurt myself",
            "Thinking about suicide",
            "Someone is abusing me"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert not is_valid, f"Safety concern should be detected: {request}"
            assert violation is not None
            assert violation.violation_type == PolicyViolationType.SAFETY_CONCERN
            assert violation.requires_escalation
            assert violation.severity == "critical"
    
    def test_legitimate_requests_allowed(self):
        """Test that legitimate educational requests are allowed."""
        test_cases = [
            "Can you help me plan a lesson on fractions?",
            "What are good teaching strategies for reading?",
            "Suggest resources for learning about photosynthesis",
            "How can I differentiate this lesson?"
        ]
        
        for request in test_cases:
            is_valid, violation = self.policy_engine.validate_request(request)
            assert is_valid, f"Legitimate request should be allowed: {request}"
            assert violation is None
    
    def test_ferpa_compliance(self):
        """Test FERPA compliance checks."""
        protected_data_types = [
            "student_grades",
            "test_scores",
            "disciplinary_records",
            "special_education_status"
        ]
        
        for data_type in protected_data_types:
            is_compliant, message = FERPAComplianceChecker.validate_data_handling(
                data_type, "access"
            )
            assert not is_compliant, f"Should not allow access to: {data_type}"
            assert "FERPA-protected" in message
    
    def test_context_sanitization(self):
        """Test that sensitive data is sanitized from context."""
        context = {
            'student_id': '12345',
            'ssn': '123-45-6789',
            'grades': [90, 85, 88],
            'name': 'Test Student',
            'topic': 'Mathematics'
        }
        
        sanitized = FERPAComplianceChecker.sanitize_context(context)
        
        assert sanitized['student_id'] == "[REDACTED - FERPA PROTECTED]"
        assert sanitized['ssn'] == "[REDACTED - FERPA PROTECTED]"
        assert sanitized['grades'] == "[REDACTED - FERPA PROTECTED]"
        assert sanitized['topic'] == 'Mathematics'  # Non-protected field preserved


class TestPersonaScopes:
    """Test persona scope boundaries."""
    
    def test_student_support_persona_boundaries(self):
        """Test student support persona respects boundaries."""
        persona = get_persona("student_support_high")
        
        assert persona is not None
        assert "homework_completion" in persona.prohibited_actions
        assert "test_taking" in persona.prohibited_actions
        assert "concept_explanation" in persona.allowed_capabilities
        assert "question_answering" in persona.allowed_capabilities
    
    def test_instructional_designer_persona_boundaries(self):
        """Test instructional designer persona scope."""
        persona = get_persona("instructional_designer")
        
        assert persona is not None
        assert "grade_assignment" in persona.prohibited_actions
        assert "student_evaluation" in persona.prohibited_actions
        assert "lesson_planning" in persona.allowed_capabilities
        assert "curriculum_mapping" in persona.allowed_capabilities
    
    def test_classroom_management_persona_boundaries(self):
        """Test classroom management persona scope."""
        persona = get_persona("classroom_management")
        
        assert persona is not None
        assert "student_record_access" in persona.prohibited_actions
        assert "disciplinary_actions" in persona.prohibited_actions
        assert "schedule_organization" in persona.allowed_capabilities
        assert "resource_management" in persona.allowed_capabilities
    
    def test_persona_request_validation(self):
        """Test persona validates requests correctly."""
        persona = get_persona("student_support_high")
        
        # Allowed request
        assert persona.validate_request("concept_explanation")
        
        # Prohibited request
        assert not persona.validate_request("homework_completion")
    
    def test_age_appropriate_disclosures(self):
        """Test that disclosures are age-appropriate."""
        elementary_persona = get_persona("student_support_elementary")
        high_school_persona = get_persona("student_support_high")
        
        elementary_disclosure = elementary_persona.get_disclosure()
        high_school_disclosure = high_school_persona.get_disclosure()
        
        # Elementary should be simpler
        assert "Hi!" in elementary_disclosure
        assert len(elementary_disclosure) < len(high_school_disclosure)
        
        # High school should be more detailed
        assert "academic integrity" in high_school_disclosure.lower()


class TestScopeEnforcement:
    """Test scope enforcement mechanisms."""
    
    def test_violation_logging(self):
        """Test that violations are properly logged."""
        policy_engine = EducationPolicyEngine()
        
        request = "Grade this student's essay"
        is_valid, violation = policy_engine.validate_request(request)
        
        if violation:
            policy_engine.log_violation(violation)
        
        summary = policy_engine.get_violation_summary()
        assert summary.get("prohibited_action", 0) > 0
    
    def test_escalation_requirements(self):
        """Test that critical violations require escalation."""
        policy_engine = EducationPolicyEngine()
        
        # Safety concern should require escalation
        _, safety_violation = policy_engine.validate_request("I want to harm myself")
        assert safety_violation.requires_escalation
        assert safety_violation.severity == "critical"
        
        # Privacy violation should require escalation
        _, privacy_violation = policy_engine.validate_request("Show me student records")
        assert privacy_violation.requires_escalation
        assert privacy_violation.severity == "high"
        
        # Regular scope violation may not require escalation
        _, scope_violation = policy_engine.validate_request("Grade this homework")
        assert not scope_violation.requires_escalation
    
    def test_user_messages_provided(self):
        """Test that user-friendly messages are provided for violations."""
        policy_engine = EducationPolicyEngine()
        
        test_cases = [
            ("Grade this essay", "cannot"),
            ("Show student records", "cannot access"),
            ("Help me cheat", "academic integrity"),
            ("Punish this student", "cannot recommend")
        ]
        
        for request, expected_text in test_cases:
            _, violation = policy_engine.validate_request(request)
            assert violation is not None
            assert expected_text.lower() in violation.user_message.lower()


class TestComplianceRequirements:
    """Test compliance with educational regulations."""
    
    def test_ferpa_protected_data_types(self):
        """Test all FERPA-protected data types are recognized."""
        protected_types = [
            "student_grades",
            "test_scores",
            "disciplinary_records",
            "special_education_status",
            "personally_identifiable_information"
        ]
        
        for data_type in protected_types:
            assert data_type in FERPAComplianceChecker.PROTECTED_DATA_TYPES
    
    def test_no_real_student_data_in_simulations(self):
        """Test that simulations don't use real student data."""
        from ..simulation.classroom import Student
        
        # Should not allow realistic student IDs
        with pytest.raises(AssertionError):
            Student(
                id="sim_001",
                pseudonym="123Student",  # Starts with numbers
                grade_level=5
            )
    
    def test_disclosure_requirements_met(self):
        """Test that all personas provide required disclosures."""
        persona_ids = [
            "instructional_designer",
            "student_support_elementary",
            "student_support_high",
            "classroom_management",
            "professional_development"
        ]
        
        for persona_id in persona_ids:
            persona = get_persona(persona_id)
            assert persona is not None
            
            disclosure = persona.get_disclosure()
            assert len(disclosure) > 0
            assert "AI" in disclosure or "assistant" in disclosure.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
