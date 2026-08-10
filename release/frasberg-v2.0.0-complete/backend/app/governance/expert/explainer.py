"""
Expert Witness Explainer

Provides court-safe, scope-limited explanations of the Frasberg Governance
System for expert witness testimony. Explanations are factual, technical, and
limited to the system's design and operation.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class ExplanationTopic(Enum):
    """Topics that can be explained"""
    HASH_CHAINING = "hash_chaining"
    AUDIT_LOGGING = "audit_logging"
    TIMESTAMP_PRECISION = "timestamp_precision"
    TAMPER_DETECTION = "tamper_detection"
    CHAIN_VERIFICATION = "chain_verification"
    DATA_INTEGRITY = "data_integrity"
    AUTHENTICATION_PROCESS = "authentication_process"
    SYSTEM_ARCHITECTURE = "system_architecture"
    SECURITY_MEASURES = "security_measures"
    RECORD_CREATION = "record_creation"


@dataclass
class Explanation:
    """Expert explanation of a technical concept"""
    topic: ExplanationTopic
    summary: str
    technical_description: str
    layperson_description: str
    key_points: List[str]
    relevant_standards: List[str]
    limitations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic.value,
            "summary": self.summary,
            "technical_description": self.technical_description,
            "layperson_description": self.layperson_description,
            "key_points": self.key_points,
            "relevant_standards": self.relevant_standards,
            "limitations": self.limitations,
        }


class ExpertExplainer:
    """
    Expert witness explanation generator.
    
    Provides factual, scope-limited explanations of the Frasberg Governance
    System suitable for expert witness testimony. All explanations:
    
    - Are strictly factual and technical
    - Stay within expert's scope of knowledge
    - Avoid opinions on legal matters
    - Use clear, understandable language
    - Include both technical and layperson versions
    - Acknowledge limitations
    """
    
    def __init__(self, expert_name: str, qualifications: Dict[str, Any]):
        """
        Initialize expert explainer.
        
        Args:
            expert_name: Name of expert witness
            qualifications: Expert's qualifications
        """
        self.expert_name = expert_name
        self.qualifications = qualifications
        self._explanations = self._initialize_explanations()
    
    def explain(
        self,
        topic: ExplanationTopic,
        technical_level: bool = True,
    ) -> str:
        """
        Generate explanation for a topic.
        
        Args:
            topic: Topic to explain
            technical_level: If True, use technical description; if False, use layperson
            
        Returns:
            Explanation text
        """
        if topic not in self._explanations:
            return f"Topic '{topic.value}' is outside my area of expertise."
        
        explanation = self._explanations[topic]
        
        if technical_level:
            return explanation.technical_description
        else:
            return explanation.layperson_description
    
    def get_explanation(self, topic: ExplanationTopic) -> Optional[Explanation]:
        """
        Get full explanation object.
        
        Args:
            topic: Topic to get explanation for
            
        Returns:
            Explanation object or None
        """
        return self._explanations.get(topic)
    
    def list_topics(self) -> List[ExplanationTopic]:
        """
        List all topics this expert can explain.
        
        Returns:
            List of explanation topics
        """
        return list(self._explanations.keys())
    
    def generate_expert_report(
        self,
        topics: List[ExplanationTopic],
        include_technical: bool = True,
        include_layperson: bool = True,
    ) -> str:
        """
        Generate comprehensive expert report.
        
        Args:
            topics: Topics to include in report
            include_technical: Include technical descriptions
            include_layperson: Include layperson descriptions
            
        Returns:
            Formatted expert report
        """
        from datetime import datetime, timezone
        
        report = f"""
{'='*80}
EXPERT WITNESS REPORT
Frasberg Governance System
{'='*80}

Expert: {self.expert_name}
Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

QUALIFICATIONS:
--------------
"""
        
        for key, value in self.qualifications.items():
            report += f"{key}: {value}\n"
        
        report += f"""
SCOPE OF EXPERTISE:
------------------
This report provides technical explanations of the Frasberg Governance System's
design, architecture, and operation. Explanations are limited to factual,
technical matters within my area of expertise. I do not opine on legal matters,
case-specific facts, or matters outside my expertise.

TOPICS COVERED:
--------------
"""
        
        for idx, topic in enumerate(topics, 1):
            report += f"{idx}. {topic.value.replace('_', ' ').title()}\n"
        
        report += "\n" + "="*80 + "\n\n"
        
        # Add explanations
        for topic in topics:
            explanation = self._explanations.get(topic)
            if not explanation:
                continue
            
            report += f"""
{'='*80}
TOPIC: {topic.value.replace('_', ' ').upper()}
{'='*80}

SUMMARY:
--------
{explanation.summary}

"""
            
            if include_technical:
                report += f"""
TECHNICAL DESCRIPTION:
---------------------
{explanation.technical_description}

"""
            
            if include_layperson:
                report += f"""
LAYPERSON EXPLANATION:
---------------------
{explanation.layperson_description}

"""
            
            report += """
KEY POINTS:
----------
"""
            for point in explanation.key_points:
                report += f"• {point}\n"
            
            if explanation.relevant_standards:
                report += "\nRELEVANT STANDARDS:\n"
                for standard in explanation.relevant_standards:
                    report += f"• {standard}\n"
            
            if explanation.limitations:
                report += "\nLIMITATIONS:\n"
                for limitation in explanation.limitations:
                    report += f"• {limitation}\n"
            
            report += "\n"
        
        report += "="*80 + "\n"
        
        return report
    
    def _initialize_explanations(self) -> Dict[ExplanationTopic, Explanation]:
        """Initialize standard explanations"""
        return {
            ExplanationTopic.HASH_CHAINING: Explanation(
                topic=ExplanationTopic.HASH_CHAINING,
                summary="Hash chaining creates tamper-evident audit logs using cryptographic hashing.",
                technical_description=(
                    "Hash chaining is a cryptographic technique where each record contains a "
                    "hash (cryptographic fingerprint) of the previous record. The Frasberg system "
                    "uses SHA-256, a cryptographically secure hash function, to create a chain where "
                    "each entry is mathematically linked to all previous entries. Any modification to "
                    "any entry in the chain will break the chain, making tampering immediately detectable."
                ),
                layperson_description=(
                    "Think of hash chaining like a sealed envelope system. Each envelope (record) "
                    "contains information about the previous envelope's unique seal. If someone tries "
                    "to tamper with any envelope, the seals won't match up anymore, and you'll know "
                    "something was changed. The Frasberg system uses advanced mathematics to create "
                    "these 'seals' in a way that makes it virtually impossible to forge them."
                ),
                key_points=[
                    "Each audit entry contains a cryptographic hash of its contents",
                    "Each entry also contains the hash of the previous entry",
                    "This creates an unbreakable chain linking all entries",
                    "Any tampering breaks the chain and is immediately detectable",
                    "SHA-256 hashing is cryptographically secure and industry-standard",
                ],
                relevant_standards=[
                    "NIST FIPS 180-4 (SHA-256 Standard)",
                    "ISO/IEC 10118-3 (Hash Functions)",
                    "FRE Rule 902(13) (Self-Authenticating Electronic Records)",
                ],
                limitations=[
                    "Cannot prevent tampering, only detect it",
                    "Requires complete chain to verify integrity",
                    "Depends on secure storage of the chain",
                ],
            ),
            
            ExplanationTopic.AUDIT_LOGGING: Explanation(
                topic=ExplanationTopic.AUDIT_LOGGING,
                summary="Automated system that records all significant events with timestamps and context.",
                technical_description=(
                    "The Frasberg audit logging system automatically captures significant system "
                    "events as they occur. Each audit entry includes: (1) a unique identifier, "
                    "(2) high-precision timestamp with microsecond accuracy, (3) event type and details, "
                    "(4) user and session context, (5) cryptographic hash of the entry, and "
                    "(6) hash of the previous entry for chain integrity. Logging is atomic and "
                    "occurs synchronously with the event being logged, ensuring temporal accuracy."
                ),
                layperson_description=(
                    "The audit log is like an automatic security camera that records everything "
                    "important that happens in the system. Instead of video, it records detailed "
                    "information about each event: what happened, when it happened (to the millionth "
                    "of a second), who did it, and what was affected. This recording happens "
                    "automatically as events occur, without human intervention."
                ),
                key_points=[
                    "Logging is fully automated - no human intervention",
                    "Events are logged at the time they occur",
                    "Each entry has microsecond-precision timestamp",
                    "Complete context is captured for each event",
                    "Entries are tamper-evident through hash chaining",
                ],
                relevant_standards=[
                    "ISO 27001 (Information Security Management)",
                    "NIST SP 800-92 (Guide to Computer Security Log Management)",
                    "SOC 2 Type II (Audit Logging Controls)",
                ],
                limitations=[
                    "Only logs events the system is configured to log",
                    "Cannot log events that occur outside the system",
                    "Requires proper system time synchronization",
                ],
            ),
            
            ExplanationTopic.TAMPER_DETECTION: Explanation(
                topic=ExplanationTopic.TAMPER_DETECTION,
                summary="Mathematical techniques that detect any unauthorized modification to records.",
                technical_description=(
                    "Tamper detection in Frasberg relies on cryptographic hash verification. "
                    "Each audit entry's hash is computed from its complete contents using SHA-256. "
                    "Any modification to the entry, no matter how small, will produce a different "
                    "hash value. By recomputing the hash and comparing it to the stored value, "
                    "we can detect tampering with mathematical certainty. The hash chain provides "
                    "additional tamper detection by verifying that each entry correctly links to "
                    "the previous entry."
                ),
                layperson_description=(
                    "Tamper detection works like a sophisticated fingerprint system. Every record "
                    "has a unique 'fingerprint' (hash) that's calculated from its contents. If "
                    "someone changes even a single character in the record, the fingerprint would "
                    "be completely different. By recalculating the fingerprint and comparing it to "
                    "the original, we can tell with certainty whether the record has been altered. "
                    "It's mathematically impossible to change a record and keep the same fingerprint."
                ),
                key_points=[
                    "Uses SHA-256 cryptographic hashing",
                    "Any modification changes the hash value",
                    "Tampering is detectable with mathematical certainty",
                    "Both individual entries and the chain can be verified",
                    "No way to modify records without detection",
                ],
                relevant_standards=[
                    "NIST FIPS 180-4 (SHA-256)",
                    "NIST SP 800-175B (Cryptographic Algorithm Validation)",
                ],
                limitations=[
                    "Only detects tampering, doesn't prevent it",
                    "Requires access to original hash values",
                    "Depends on proper implementation",
                ],
            ),
            
            ExplanationTopic.TIMESTAMP_PRECISION: Explanation(
                topic=ExplanationTopic.TIMESTAMP_PRECISION,
                summary="Microsecond-precision timestamps synchronized to authoritative time sources.",
                technical_description=(
                    "Frasberg generates timestamps with microsecond precision (millionths of a second) "
                    "in ISO 8601 format with UTC timezone. Timestamps are generated using system clocks "
                    "that are synchronized to authoritative time sources via NTP (Network Time Protocol). "
                    "This precision allows for accurate ordering of events and detection of temporal "
                    "anomalies. All timestamps are stored in UTC to avoid timezone-related ambiguities."
                ),
                layperson_description=(
                    "The system records the exact time of each event down to millionths of a second. "
                    "This is like having a stopwatch that can measure not just seconds, but the tiniest "
                    "fractions of seconds. The system clock is regularly synchronized with official time "
                    "servers (like the atomic clocks maintained by government institutions) to ensure "
                    "accuracy. This level of precision ensures we can tell exactly when things happened "
                    "and in what order."
                ),
                key_points=[
                    "Microsecond precision (0.000001 second accuracy)",
                    "ISO 8601 format for international compatibility",
                    "UTC timezone to avoid ambiguity",
                    "Synchronized to authoritative time sources via NTP",
                    "Enables precise event ordering",
                ],
                relevant_standards=[
                    "ISO 8601 (Date and Time Format)",
                    "RFC 3161 (Time-Stamp Protocol)",
                    "NIST SP 1800-16 (Securing Time Synchronization)",
                ],
                limitations=[
                    "Depends on system clock accuracy",
                    "Subject to network time synchronization delays",
                    "Cannot be more accurate than underlying hardware",
                ],
            ),
        }
