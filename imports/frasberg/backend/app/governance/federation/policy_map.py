"""
Multi-Jurisdiction Policy Mapping

Maps policies across different legal jurisdictions (GDPR, CCPA, HIPAA, etc.)
and ensures compliance with jurisdiction-specific requirements.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum


class Jurisdiction(Enum):
    """Legal jurisdictions"""
    US_FEDERAL = "us_federal"
    US_CALIFORNIA = "us_california"  # CCPA
    US_NEW_YORK = "us_new_york"
    EU_GENERAL = "eu_general"  # GDPR
    UK = "uk"  # UK GDPR
    CANADA = "canada"  # PIPEDA
    HIPAA = "hipaa"  # Healthcare
    SOX = "sox"  # Financial
    FINRA = "finra"  # Financial services
    PCI_DSS = "pci_dss"  # Payment cards


@dataclass
class JurisdictionPolicy:
    """Policy specific to a jurisdiction"""
    jurisdiction: Jurisdiction
    policy_name: str
    requirements: List[str]
    retention_period_days: Optional[int]
    data_residency_required: bool
    encryption_required: bool
    audit_required: bool
    breach_notification_hours: Optional[int]
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "jurisdiction": self.jurisdiction.value,
            "policy_name": self.policy_name,
            "requirements": self.requirements,
            "retention_period_days": self.retention_period_days,
            "data_residency_required": self.data_residency_required,
            "encryption_required": self.encryption_required,
            "audit_required": self.audit_required,
            "breach_notification_hours": self.breach_notification_hours,
            "metadata": self.metadata,
        }


class PolicyMapper:
    """
    Multi-jurisdiction policy mapper.
    
    Maps business requirements to jurisdiction-specific policies
    and ensures compliance across multiple jurisdictions.
    """
    
    def __init__(self):
        """Initialize policy mapper"""
        self._jurisdiction_policies: Dict[Jurisdiction, List[JurisdictionPolicy]] = {}
        self._initialize_standard_policies()
    
    def add_jurisdiction_policy(self, policy: JurisdictionPolicy) -> None:
        """
        Add policy for a jurisdiction.
        
        Args:
            policy: Jurisdiction-specific policy
        """
        if policy.jurisdiction not in self._jurisdiction_policies:
            self._jurisdiction_policies[policy.jurisdiction] = []
        
        self._jurisdiction_policies[policy.jurisdiction].append(policy)
    
    def get_policies_for_jurisdiction(
        self,
        jurisdiction: Jurisdiction,
    ) -> List[JurisdictionPolicy]:
        """
        Get all policies for a jurisdiction.
        
        Args:
            jurisdiction: Jurisdiction to get policies for
            
        Returns:
            List of jurisdiction policies
        """
        return self._jurisdiction_policies.get(jurisdiction, [])
    
    def get_applicable_jurisdictions(
        self,
        user_location: Optional[str] = None,
        data_location: Optional[str] = None,
        data_type: Optional[str] = None,
    ) -> List[Jurisdiction]:
        """
        Determine applicable jurisdictions based on context.
        
        Args:
            user_location: User's location (country/state code)
            data_location: Where data is stored
            data_type: Type of data (e.g., "health", "financial")
            
        Returns:
            List of applicable jurisdictions
        """
        jurisdictions = []
        
        # Geographic jurisdictions
        if user_location:
            if user_location.startswith("US-CA"):
                jurisdictions.append(Jurisdiction.US_CALIFORNIA)
            elif user_location.startswith("US-NY"):
                jurisdictions.append(Jurisdiction.US_NEW_YORK)
            elif user_location.startswith("US"):
                jurisdictions.append(Jurisdiction.US_FEDERAL)
            elif user_location.startswith("EU") or user_location in ["DE", "FR", "ES", "IT"]:
                jurisdictions.append(Jurisdiction.EU_GENERAL)
            elif user_location == "GB":
                jurisdictions.append(Jurisdiction.UK)
            elif user_location == "CA":
                jurisdictions.append(Jurisdiction.CANADA)
        
        # Data type specific jurisdictions
        if data_type:
            if data_type == "health":
                jurisdictions.append(Jurisdiction.HIPAA)
            elif data_type == "financial":
                jurisdictions.append(Jurisdiction.SOX)
                jurisdictions.append(Jurisdiction.FINRA)
            elif data_type == "payment":
                jurisdictions.append(Jurisdiction.PCI_DSS)
        
        return list(set(jurisdictions))  # Remove duplicates
    
    def get_retention_requirements(
        self,
        jurisdictions: List[Jurisdiction],
    ) -> Dict[str, Any]:
        """
        Get retention requirements across jurisdictions.
        
        Args:
            jurisdictions: List of applicable jurisdictions
            
        Returns:
            Combined retention requirements
        """
        max_retention_days = 0
        requirements = []
        
        for jurisdiction in jurisdictions:
            policies = self.get_policies_for_jurisdiction(jurisdiction)
            for policy in policies:
                if policy.retention_period_days:
                    max_retention_days = max(
                        max_retention_days,
                        policy.retention_period_days
                    )
                requirements.extend(policy.requirements)
        
        return {
            "minimum_retention_days": max_retention_days,
            "requirements": list(set(requirements)),
            "jurisdictions": [j.value for j in jurisdictions],
        }
    
    def check_compliance(
        self,
        context: Dict[str, Any],
        jurisdictions: List[Jurisdiction],
    ) -> Dict[str, Any]:
        """
        Check compliance across multiple jurisdictions.
        
        Args:
            context: Context to check compliance for
            jurisdictions: Jurisdictions to check
            
        Returns:
            Compliance report
        """
        violations = []
        compliant_jurisdictions = []
        
        for jurisdiction in jurisdictions:
            policies = self.get_policies_for_jurisdiction(jurisdiction)
            
            jurisdiction_compliant = True
            for policy in policies:
                if not self._check_policy_compliance(policy, context):
                    jurisdiction_compliant = False
                    violations.append({
                        "jurisdiction": jurisdiction.value,
                        "policy": policy.policy_name,
                        "requirements": policy.requirements,
                    })
            
            if jurisdiction_compliant:
                compliant_jurisdictions.append(jurisdiction.value)
        
        return {
            "compliant": len(violations) == 0,
            "compliant_jurisdictions": compliant_jurisdictions,
            "violations": violations,
            "total_jurisdictions_checked": len(jurisdictions),
        }
    
    def _check_policy_compliance(
        self,
        policy: JurisdictionPolicy,
        context: Dict[str, Any],
    ) -> bool:
        """Check if context complies with policy"""
        # Check encryption requirement
        if policy.encryption_required and not context.get("encrypted", False):
            return False
        
        # Check audit requirement
        if policy.audit_required and not context.get("audited", False):
            return False
        
        # Check data residency
        if policy.data_residency_required:
            data_location = context.get("data_location", "")
            if not self._check_data_residency(policy.jurisdiction, data_location):
                return False
        
        return True
    
    def _check_data_residency(
        self,
        jurisdiction: Jurisdiction,
        data_location: str,
    ) -> bool:
        """Check if data location complies with residency requirements"""
        residency_rules = {
            Jurisdiction.EU_GENERAL: ["EU", "EEA"],
            Jurisdiction.UK: ["UK", "GB"],
            Jurisdiction.CANADA: ["CA"],
        }
        
        required_locations = residency_rules.get(jurisdiction, [])
        if not required_locations:
            return True  # No specific requirement
        
        return any(data_location.startswith(loc) for loc in required_locations)
    
    def _initialize_standard_policies(self) -> None:
        """Initialize standard jurisdiction policies"""
        # GDPR
        self.add_jurisdiction_policy(JurisdictionPolicy(
            jurisdiction=Jurisdiction.EU_GENERAL,
            policy_name="GDPR Data Protection",
            requirements=[
                "Lawful basis for processing",
                "Data subject rights (access, deletion, portability)",
                "Privacy by design and default",
                "Data protection impact assessments",
                "Records of processing activities",
            ],
            retention_period_days=None,  # Varies by purpose
            data_residency_required=True,
            encryption_required=True,
            audit_required=True,
            breach_notification_hours=72,
            metadata={"regulation": "GDPR", "article": "Various"},
        ))
        
        # CCPA
        self.add_jurisdiction_policy(JurisdictionPolicy(
            jurisdiction=Jurisdiction.US_CALIFORNIA,
            policy_name="CCPA Consumer Rights",
            requirements=[
                "Notice at collection",
                "Right to know",
                "Right to delete",
                "Right to opt-out of sale",
                "Non-discrimination",
            ],
            retention_period_days=None,
            data_residency_required=False,
            encryption_required=True,
            audit_required=True,
            breach_notification_hours=None,
            metadata={"regulation": "CCPA"},
        ))
        
        # HIPAA
        self.add_jurisdiction_policy(JurisdictionPolicy(
            jurisdiction=Jurisdiction.HIPAA,
            policy_name="HIPAA Security Rule",
            requirements=[
                "Access controls",
                "Audit controls",
                "Integrity controls",
                "Transmission security",
                "Business associate agreements",
            ],
            retention_period_days=2555,  # 7 years
            data_residency_required=False,
            encryption_required=True,
            audit_required=True,
            breach_notification_hours=None,
            metadata={"regulation": "HIPAA", "standard": "Security Rule"},
        ))
        
        # SOX
        self.add_jurisdiction_policy(JurisdictionPolicy(
            jurisdiction=Jurisdiction.SOX,
            policy_name="SOX Financial Records",
            requirements=[
                "Internal controls over financial reporting",
                "Audit trail requirements",
                "Records retention",
                "Management certification",
            ],
            retention_period_days=2555,  # 7 years
            data_residency_required=False,
            encryption_required=True,
            audit_required=True,
            breach_notification_hours=None,
            metadata={"regulation": "Sarbanes-Oxley Act"},
        ))
