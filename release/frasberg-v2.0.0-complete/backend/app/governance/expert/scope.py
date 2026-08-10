"""
Expert Scope Definition

Defines and enforces the scope of expert witness testimony.
Ensures expert only testifies to matters within their qualified expertise.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class ScopeCategory(Enum):
    """Categories of expert scope"""
    SYSTEM_DESIGN = "system_design"
    SYSTEM_OPERATION = "system_operation"
    CRYPTOGRAPHY = "cryptography"
    DATA_INTEGRITY = "data_integrity"
    AUDIT_LOGGING = "audit_logging"
    SECURITY = "security"
    STANDARDS_COMPLIANCE = "standards_compliance"
    TECHNICAL_IMPLEMENTATION = "technical_implementation"


@dataclass
class ScopeDefinition:
    """
    Definition of expert's scope of testimony.
    
    Clearly defines what the expert is qualified to testify about
    and what falls outside their expertise.
    """
    scope_id: str
    expert_name: str
    scope_areas: List[str]
    qualifications: Dict[str, Any]
    limitations: List[str]
    explicitly_excluded: List[str] = field(default_factory=lambda: [
        "Legal interpretation",
        "Case-specific facts outside personal knowledge",
        "Ultimate legal conclusions",
        "Credibility of witnesses",
        "Questions of law",
    ])
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "scope_id": self.scope_id,
            "expert_name": self.expert_name,
            "scope_areas": self.scope_areas,
            "qualifications": self.qualifications,
            "limitations": self.limitations,
            "explicitly_excluded": self.explicitly_excluded,
        }


class ExpertScope:
    """
    Expert scope manager.
    
    Manages and enforces expert witness scope to ensure testimony
    stays within qualified areas of expertise.
    """
    
    def __init__(self, scope_definition: ScopeDefinition):
        """
        Initialize expert scope.
        
        Args:
            scope_definition: Definition of expert's scope
        """
        self.definition = scope_definition
        self.scope_areas = scope_definition.scope_areas
        
        # Keywords that indicate in-scope topics
        self._in_scope_keywords = self._build_scope_keywords()
        
        # Keywords that indicate out-of-scope topics
        self._out_of_scope_keywords = [
            "legal", "law", "statute", "regulation", "attorney",
            "credibility", "truthfulness", "intent", "motive",
            "should have", "could have", "negligence", "fault",
            "liability", "damages", "ultimate issue",
        ]
    
    def is_in_scope(self, topic: str) -> bool:
        """
        Check if topic is within expert's scope.
        
        Args:
            topic: Topic or question to check
            
        Returns:
            True if within scope
        """
        topic_lower = topic.lower()
        
        # Check for explicitly excluded topics
        for excluded in self.definition.explicitly_excluded:
            if excluded.lower() in topic_lower:
                return False
        
        # Check for out-of-scope keywords
        for keyword in self._out_of_scope_keywords:
            if keyword in topic_lower:
                return False
        
        # Check for in-scope keywords
        for keyword in self._in_scope_keywords:
            if keyword in topic_lower:
                return True
        
        # Default to cautious out-of-scope if unclear
        return False
    
    def get_scope_statement(self) -> str:
        """
        Generate formal scope statement for court filing.
        
        Returns:
            Formatted scope statement
        """
        statement = f"""
{'='*80}
EXPERT WITNESS SCOPE OF TESTIMONY
{'='*80}

Expert Name: {self.definition.expert_name}

AREAS OF EXPERTISE:
------------------
The expert is qualified to testify regarding the following areas:

"""
        
        for idx, area in enumerate(self.definition.scope_areas, 1):
            statement += f"{idx}. {area}\n"
        
        statement += """

QUALIFICATIONS:
--------------
"""
        
        for key, value in self.definition.qualifications.items():
            statement += f"{key}: {value}\n"
        
        statement += """

LIMITATIONS:
-----------
The expert's testimony is limited to:

"""
        
        for limitation in self.definition.limitations:
            statement += f"• {limitation}\n"
        
        statement += """

EXPLICITLY EXCLUDED:
-------------------
The expert will NOT testify regarding:

"""
        
        for excluded in self.definition.explicitly_excluded:
            statement += f"• {excluded}\n"
        
        statement += "\n" + "="*80 + "\n"
        
        return statement
    
    def validate_testimony_scope(
        self,
        testimony_text: str,
    ) -> Dict[str, Any]:
        """
        Validate that testimony stays within scope.
        
        Args:
            testimony_text: Text of testimony to validate
            
        Returns:
            Validation result
        """
        issues = []
        
        # Check for out-of-scope keywords
        text_lower = testimony_text.lower()
        for keyword in self._out_of_scope_keywords:
            if keyword in text_lower:
                issues.append({
                    "type": "out_of_scope_keyword",
                    "keyword": keyword,
                    "severity": "high",
                })
        
        # Check for excluded topics
        for excluded in self.definition.explicitly_excluded:
            if excluded.lower() in text_lower:
                issues.append({
                    "type": "explicitly_excluded",
                    "topic": excluded,
                    "severity": "critical",
                })
        
        return {
            "within_scope": len(issues) == 0,
            "issues": issues,
            "total_issues": len(issues),
        }
    
    def generate_scope_limitations_disclosure(self) -> str:
        """
        Generate disclosure of scope limitations for court.
        
        Returns:
            Formatted disclosure
        """
        from datetime import datetime, timezone
        
        disclosure = f"""
{'='*80}
DISCLOSURE OF EXPERT SCOPE LIMITATIONS
{'='*80}

Expert: {self.definition.expert_name}
Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

Pursuant to applicable rules of expert disclosure, the expert provides the
following statement regarding the scope and limitations of their testimony:

SCOPE OF TESTIMONY:
------------------
The expert's testimony is limited to technical and factual matters regarding
the design, implementation, and operation of the Frasberg Governance System.
Specifically, the expert is qualified to testify regarding:

"""
        
        for area in self.definition.scope_areas:
            disclosure += f"• {area}\n"
        
        disclosure += """

LIMITATIONS OF EXPERTISE:
------------------------
The expert acknowledges the following limitations:

"""
        
        for limitation in self.definition.limitations:
            disclosure += f"• {limitation}\n"
        
        disclosure += """

MATTERS OUTSIDE SCOPE:
---------------------
The expert will not offer opinions on:

"""
        
        for excluded in self.definition.explicitly_excluded:
            disclosure += f"• {excluded}\n"
        
        disclosure += f"""

The expert's testimony is based solely on their technical knowledge and
expertise in computer systems and cryptographic audit logging. The expert
does not purport to offer legal opinions, interpret statutes or regulations,
or testify to ultimate issues reserved for the trier of fact.

{'='*80}
"""
        
        return disclosure
    
    def _build_scope_keywords(self) -> List[str]:
        """Build list of keywords indicating in-scope topics"""
        keywords = [
            # System-related
            "system", "software", "application", "platform",
            "architecture", "design", "implementation",
            
            # Audit/logging
            "audit", "log", "logging", "record", "entry",
            
            # Cryptography
            "hash", "encryption", "cryptographic", "algorithm",
            "sha-256", "signature", "certificate",
            
            # Data integrity
            "integrity", "tamper", "verification", "validation",
            "chain", "timestamp",
            
            # Technical operations
            "process", "procedure", "operation", "function",
            "mechanism", "methodology",
            
            # Standards
            "standard", "protocol", "specification", "compliance",
        ]
        
        return keywords
    
    @classmethod
    def create_default_scope(
        cls,
        expert_name: str,
        qualifications: Dict[str, Any],
    ) -> 'ExpertScope':
        """
        Create default scope for Frasberg expert.
        
        Args:
            expert_name: Name of expert
            qualifications: Expert qualifications
            
        Returns:
            ExpertScope with default scope definition
        """
        import uuid
        
        scope_definition = ScopeDefinition(
            scope_id=str(uuid.uuid4()),
            expert_name=expert_name,
            scope_areas=[
                "Design and architecture of the Frasberg Governance System",
                "Implementation of cryptographic hash chaining",
                "Audit logging processes and procedures",
                "Tamper detection mechanisms",
                "Timestamp generation and accuracy",
                "Data integrity verification methods",
                "Chain verification algorithms",
                "System security measures",
                "Compliance with technical standards (e.g., NIST, ISO)",
            ],
            qualifications=qualifications,
            limitations=[
                "Testimony limited to technical matters regarding the Frasberg system",
                "No opinions on legal interpretation or application of law",
                "No testimony regarding case-specific facts outside personal knowledge",
                "No opinions on ultimate issues reserved for the trier of fact",
                "No testimony regarding other systems or implementations not personally reviewed",
            ],
        )
        
        return cls(scope_definition)
