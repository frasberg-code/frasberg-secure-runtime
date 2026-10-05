"""
Policy Router

Routes requests to appropriate jurisdiction-specific policies based on
context, user location, data classification, and regulatory requirements.
"""

from typing import Dict, Any, List, Optional
from .policy_map import PolicyMapper, Jurisdiction, JurisdictionPolicy


class PolicyRouter:
    """
    Routes policy enforcement based on jurisdiction.
    
    Determines which policies apply to a given request based on:
    - User location
    - Data location
    - Data classification
    - Applicable regulations
    """
    
    def __init__(self, policy_mapper: Optional[PolicyMapper] = None):
        """
        Initialize policy router.
        
        Args:
            policy_mapper: Policy mapper instance (creates default if None)
        """
        self.policy_mapper = policy_mapper or PolicyMapper()
    
    def route(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route request to applicable policies.
        
        Args:
            context: Request context including location, data type, etc.
            
        Returns:
            Routing result with applicable policies
        """
        # Determine applicable jurisdictions
        jurisdictions = self.policy_mapper.get_applicable_jurisdictions(
            user_location=context.get("user_location"),
            data_location=context.get("data_location"),
            data_type=context.get("data_type"),
        )
        
        # Get policies for each jurisdiction
        applicable_policies = []
        for jurisdiction in jurisdictions:
            policies = self.policy_mapper.get_policies_for_jurisdiction(jurisdiction)
            applicable_policies.extend([p.to_dict() for p in policies])
        
        # Get retention requirements
        retention = self.policy_mapper.get_retention_requirements(jurisdictions)
        
        # Check compliance
        compliance = self.policy_mapper.check_compliance(context, jurisdictions)
        
        return {
            "applicable_jurisdictions": [j.value for j in jurisdictions],
            "applicable_policies": applicable_policies,
            "retention_requirements": retention,
            "compliance_check": compliance,
            "routing_decision": self._make_routing_decision(compliance),
        }
    
    def get_strictest_policy(
        self,
        context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Get the strictest applicable policy.
        
        Args:
            context: Request context
            
        Returns:
            Strictest policy requirements
        """
        routing = self.route(context)
        
        if not routing["applicable_policies"]:
            return None
        
        # Find strictest requirements
        strictest = {
            "encryption_required": False,
            "audit_required": False,
            "data_residency_required": False,
            "max_retention_days": 0,
            "min_breach_notification_hours": float('inf'),
        }
        
        for policy in routing["applicable_policies"]:
            if policy.get("encryption_required"):
                strictest["encryption_required"] = True
            if policy.get("audit_required"):
                strictest["audit_required"] = True
            if policy.get("data_residency_required"):
                strictest["data_residency_required"] = True
            
            retention = policy.get("retention_period_days")
            if retention:
                strictest["max_retention_days"] = max(
                    strictest["max_retention_days"],
                    retention
                )
            
            notification = policy.get("breach_notification_hours")
            if notification:
                strictest["min_breach_notification_hours"] = min(
                    strictest["min_breach_notification_hours"],
                    notification
                )
        
        if strictest["min_breach_notification_hours"] == float('inf'):
            strictest["min_breach_notification_hours"] = None
        
        return strictest
    
    def validate_data_flow(
        self,
        source_location: str,
        destination_location: str,
        data_type: str,
    ) -> Dict[str, Any]:
        """
        Validate data transfer between locations.
        
        Args:
            source_location: Source location code
            destination_location: Destination location code
            data_type: Type of data being transferred
            
        Returns:
            Validation result
        """
        # Check source jurisdiction policies
        source_jurisdictions = self.policy_mapper.get_applicable_jurisdictions(
            data_location=source_location,
            data_type=data_type,
        )
        
        # Check if transfer is allowed
        allowed = True
        restrictions = []
        
        for jurisdiction in source_jurisdictions:
            policies = self.policy_mapper.get_policies_for_jurisdiction(jurisdiction)
            for policy in policies:
                if policy.data_residency_required:
                    # Check if destination complies
                    if not self._check_transfer_allowed(
                        jurisdiction,
                        destination_location
                    ):
                        allowed = False
                        restrictions.append({
                            "jurisdiction": jurisdiction.value,
                            "policy": policy.policy_name,
                            "reason": "Data residency requirement",
                        })
        
        return {
            "allowed": allowed,
            "source_location": source_location,
            "destination_location": destination_location,
            "data_type": data_type,
            "restrictions": restrictions,
        }
    
    def _make_routing_decision(self, compliance: Dict[str, Any]) -> str:
        """Make routing decision based on compliance"""
        if compliance["compliant"]:
            return "ALLOW"
        else:
            return "DENY"
    
    def _check_transfer_allowed(
        self,
        jurisdiction: Jurisdiction,
        destination: str,
    ) -> bool:
        """Check if data transfer is allowed"""
        # EU GDPR restrictions
        if jurisdiction == Jurisdiction.EU_GENERAL:
            # Allow transfers within EU/EEA
            eu_countries = ["EU", "EEA", "DE", "FR", "ES", "IT", "NL", "BE"]
            return any(destination.startswith(c) for c in eu_countries)
        
        # UK GDPR restrictions
        if jurisdiction == Jurisdiction.UK:
            uk_allowed = ["UK", "GB", "EU", "EEA"]
            return any(destination.startswith(c) for c in uk_allowed)
        
        # Default allow for other jurisdictions
        return True
