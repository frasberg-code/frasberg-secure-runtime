"""
Policy Enforcement Engine

Implements institutional-grade policy management and enforcement.
Supports multi-jurisdiction policies, compliance rules, and automated
policy violation detection.
"""

from typing import Dict, Any, List, Optional, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timezone
import re


class PolicyType(Enum):
    """Types of policies"""
    ACCESS_CONTROL = "access_control"
    DATA_RETENTION = "data_retention"
    DATA_CLASSIFICATION = "data_classification"
    EXPORT_RESTRICTION = "export_restriction"
    USAGE_LIMIT = "usage_limit"
    JURISDICTION = "jurisdiction"
    COMPLIANCE = "compliance"
    SECURITY = "security"


class PolicyAction(Enum):
    """Actions to take on policy violations"""
    ALLOW = "allow"
    DENY = "deny"
    WARN = "warn"
    LOG = "log"
    ESCALATE = "escalate"
    FREEZE = "freeze"


class JurisdictionType(Enum):
    """Legal jurisdictions"""
    US_FEDERAL = "us_federal"
    US_STATE = "us_state"
    EU_GDPR = "eu_gdpr"
    UK_GDPR = "uk_gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOX = "sox"
    FINRA = "finra"
    CUSTOM = "custom"


@dataclass
class PolicyCondition:
    """
    Condition that must be met for policy to apply.
    """
    field: str
    operator: str  # eq, ne, gt, lt, gte, lte, in, not_in, regex, exists
    value: Any
    
    def evaluate(self, context: Dict[str, Any]) -> bool:
        """
        Evaluate condition against context.
        
        Args:
            context: Context dictionary to evaluate against
            
        Returns:
            True if condition is met
        """
        # Get field value from context (support nested paths)
        field_value = self._get_nested_value(context, self.field)
        
        # Apply operator
        if self.operator == "eq":
            return field_value == self.value
        elif self.operator == "ne":
            return field_value != self.value
        elif self.operator == "gt":
            return field_value > self.value
        elif self.operator == "lt":
            return field_value < self.value
        elif self.operator == "gte":
            return field_value >= self.value
        elif self.operator == "lte":
            return field_value <= self.value
        elif self.operator == "in":
            return field_value in self.value
        elif self.operator == "not_in":
            return field_value not in self.value
        elif self.operator == "regex":
            return bool(re.match(self.value, str(field_value)))
        elif self.operator == "exists":
            return field_value is not None
        else:
            return False
    
    def _get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """Get value from nested dictionary using dot notation"""
        parts = path.split('.')
        value = data
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return None
        return value


@dataclass
class Policy:
    """
    Policy definition with conditions and actions.
    """
    policy_id: str
    name: str
    description: str
    policy_type: PolicyType
    jurisdictions: List[JurisdictionType]
    conditions: List[PolicyCondition]
    action: PolicyAction
    priority: int = 100
    enabled: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def matches(self, context: Dict[str, Any]) -> bool:
        """
        Check if policy matches given context.
        
        Args:
            context: Context to evaluate
            
        Returns:
            True if all conditions match
        """
        if not self.enabled:
            return False
        
        # All conditions must match (AND logic)
        return all(condition.evaluate(context) for condition in self.conditions)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "policy_id": self.policy_id,
            "name": self.name,
            "description": self.description,
            "policy_type": self.policy_type.value,
            "jurisdictions": [j.value for j in self.jurisdictions],
            "conditions": [
                {"field": c.field, "operator": c.operator, "value": c.value}
                for c in self.conditions
            ],
            "action": self.action.value,
            "priority": self.priority,
            "enabled": self.enabled,
            "metadata": self.metadata,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass
class PolicyViolation:
    """Record of a policy violation"""
    violation_id: str
    policy_id: str
    policy_name: str
    timestamp: str
    context: Dict[str, Any]
    action_taken: PolicyAction
    severity: str = "medium"
    details: Dict[str, Any] = field(default_factory=dict)
    resolved: bool = False


class PolicyEngine:
    """
    Policy enforcement engine.
    
    Evaluates contexts against policies and enforces actions.
    Supports multi-jurisdiction policies and priority-based evaluation.
    """
    
    def __init__(self):
        """Initialize policy engine"""
        self._policies: Dict[str, Policy] = {}
        self._violations: List[PolicyViolation] = []
        self._custom_evaluators: Dict[str, Callable] = {}
    
    def add_policy(self, policy: Policy) -> None:
        """
        Add or update a policy.
        
        Args:
            policy: Policy to add
        """
        policy.updated_at = datetime.now(timezone.utc).isoformat()
        self._policies[policy.policy_id] = policy
    
    def remove_policy(self, policy_id: str) -> bool:
        """
        Remove a policy.
        
        Args:
            policy_id: ID of policy to remove
            
        Returns:
            True if policy was removed
        """
        if policy_id in self._policies:
            del self._policies[policy_id]
            return True
        return False
    
    def get_policy(self, policy_id: str) -> Optional[Policy]:
        """
        Get policy by ID.
        
        Args:
            policy_id: Policy ID
            
        Returns:
            Policy if found, None otherwise
        """
        return self._policies.get(policy_id)
    
    def list_policies(
        self,
        policy_type: Optional[PolicyType] = None,
        jurisdiction: Optional[JurisdictionType] = None,
        enabled_only: bool = True,
    ) -> List[Policy]:
        """
        List policies with optional filters.
        
        Args:
            policy_type: Filter by policy type
            jurisdiction: Filter by jurisdiction
            enabled_only: Only return enabled policies
            
        Returns:
            List of matching policies
        """
        policies = list(self._policies.values())
        
        if enabled_only:
            policies = [p for p in policies if p.enabled]
        
        if policy_type:
            policies = [p for p in policies if p.policy_type == policy_type]
        
        if jurisdiction:
            policies = [p for p in policies if jurisdiction in p.jurisdictions]
        
        # Sort by priority (higher priority first)
        policies.sort(key=lambda p: p.priority, reverse=True)
        
        return policies
    
    def evaluate(
        self,
        context: Dict[str, Any],
        policy_type: Optional[PolicyType] = None,
    ) -> List[Policy]:
        """
        Evaluate context against policies.
        
        Args:
            context: Context to evaluate
            policy_type: Optional filter for policy type
            
        Returns:
            List of matching policies, sorted by priority
        """
        policies = self.list_policies(policy_type=policy_type, enabled_only=True)
        matching = [p for p in policies if p.matches(context)]
        return matching
    
    def enforce(
        self,
        context: Dict[str, Any],
        policy_type: Optional[PolicyType] = None,
    ) -> Dict[str, Any]:
        """
        Enforce policies against context.
        
        Args:
            context: Context to enforce policies against
            policy_type: Optional filter for policy type
            
        Returns:
            Enforcement result with action and details
        """
        matching_policies = self.evaluate(context, policy_type)
        
        if not matching_policies:
            return {
                "allowed": True,
                "action": PolicyAction.ALLOW.value,
                "policies_matched": [],
                "violations": [],
            }
        
        # Get highest priority policy
        primary_policy = matching_policies[0]
        
        # Check for deny or freeze actions
        denied = any(p.action in [PolicyAction.DENY, PolicyAction.FREEZE] for p in matching_policies)
        
        # Record violations for non-allow actions
        violations = []
        for policy in matching_policies:
            if policy.action != PolicyAction.ALLOW:
                violation = self._record_violation(policy, context)
                violations.append(violation)
        
        return {
            "allowed": not denied,
            "action": primary_policy.action.value,
            "primary_policy": primary_policy.to_dict(),
            "policies_matched": [p.policy_id for p in matching_policies],
            "violations": [v.__dict__ for v in violations],
        }
    
    def check_compliance(
        self,
        context: Dict[str, Any],
        jurisdiction: JurisdictionType,
    ) -> Dict[str, Any]:
        """
        Check compliance for specific jurisdiction.
        
        Args:
            context: Context to check
            jurisdiction: Jurisdiction to check compliance for
            
        Returns:
            Compliance check result
        """
        policies = [
            p for p in self._policies.values()
            if jurisdiction in p.jurisdictions and p.enabled
        ]
        
        compliant = True
        violations = []
        
        for policy in policies:
            if policy.matches(context):
                if policy.action in [PolicyAction.DENY, PolicyAction.FREEZE]:
                    compliant = False
                    violation = self._record_violation(policy, context)
                    violations.append(violation)
        
        return {
            "compliant": compliant,
            "jurisdiction": jurisdiction.value,
            "policies_checked": len(policies),
            "violations": violations,
        }
    
    def get_violations(
        self,
        policy_id: Optional[str] = None,
        unresolved_only: bool = False,
    ) -> List[PolicyViolation]:
        """
        Get recorded policy violations.
        
        Args:
            policy_id: Filter by policy ID
            unresolved_only: Only return unresolved violations
            
        Returns:
            List of violations
        """
        violations = self._violations
        
        if policy_id:
            violations = [v for v in violations if v.policy_id == policy_id]
        
        if unresolved_only:
            violations = [v for v in violations if not v.resolved]
        
        return violations
    
    def resolve_violation(self, violation_id: str) -> bool:
        """
        Mark a violation as resolved.
        
        Args:
            violation_id: ID of violation to resolve
            
        Returns:
            True if violation was found and resolved
        """
        for violation in self._violations:
            if violation.violation_id == violation_id:
                violation.resolved = True
                return True
        return False
    
    def register_evaluator(self, name: str, evaluator: Callable) -> None:
        """
        Register custom policy evaluator.
        
        Args:
            name: Name of evaluator
            evaluator: Callable that takes context and returns bool
        """
        self._custom_evaluators[name] = evaluator
    
    def _record_violation(self, policy: Policy, context: Dict[str, Any]) -> PolicyViolation:
        """Record a policy violation"""
        import uuid
        
        violation = PolicyViolation(
            violation_id=str(uuid.uuid4()),
            policy_id=policy.policy_id,
            policy_name=policy.name,
            timestamp=datetime.now(timezone.utc).isoformat(),
            context=context,
            action_taken=policy.action,
            details={"policy_type": policy.policy_type.value},
        )
        
        self._violations.append(violation)
        return violation
    
    def export_policies(self) -> List[Dict[str, Any]]:
        """Export all policies as dictionaries"""
        return [p.to_dict() for p in self._policies.values()]
    
    def import_policies(self, policies_data: List[Dict[str, Any]]) -> int:
        """
        Import policies from dictionaries.
        
        Args:
            policies_data: List of policy dictionaries
            
        Returns:
            Number of policies imported
        """
        count = 0
        for data in policies_data:
            try:
                policy = Policy(
                    policy_id=data["policy_id"],
                    name=data["name"],
                    description=data["description"],
                    policy_type=PolicyType(data["policy_type"]),
                    jurisdictions=[JurisdictionType(j) for j in data["jurisdictions"]],
                    conditions=[
                        PolicyCondition(**c) for c in data["conditions"]
                    ],
                    action=PolicyAction(data["action"]),
                    priority=data.get("priority", 100),
                    enabled=data.get("enabled", True),
                    metadata=data.get("metadata", {}),
                    created_at=data.get("created_at"),
                    updated_at=data.get("updated_at"),
                )
                self.add_policy(policy)
                count += 1
            except (KeyError, ValueError) as e:
                # Skip invalid policies
                continue
        
        return count
