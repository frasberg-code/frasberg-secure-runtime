"""
Frasberg Governance System v2.0.0

Institutional-grade governance, compliance, and audit system for Frasberg.
Provides hash-chained audit logs, FRE Rule 902(13) compliance, expert witness
mode, multi-jurisdiction policy support, and court-ready exhibit generation.
"""

# v1.0.0 imports (maintained for compatibility)
from .audit import AuditLogger, AuditEntry, ChainVerificationResult
from .policy import PolicyEngine, Policy, PolicyViolation

# v2.0.0 FastAPI routers
from fastapi import APIRouter
from .audit.chain import router as audit_router
from .rule902.authenticator import router as rule902_router
from .witness.expert import router as witness_router

governance_router = APIRouter()
governance_router.include_router(audit_router)
governance_router.include_router(rule902_router)
governance_router.include_router(witness_router)

@governance_router.get("/api/v2/governance/status")
def governance_system_status():
    return {
        "governance_system": "operational",
        "version": "2.0.0",
        "capabilities": {
            "audit_logging": True,
            "hash_chained": True,
            "rule_902": True,
            "expert_witness": True,
            "digital_signatures": True
        }
    }

__all__ = [
    "AuditLogger",
    "AuditEntry", 
    "ChainVerificationResult",
    "PolicyEngine",
    "Policy",
    "PolicyViolation",
    "governance_router",
]

__version__ = "2.0.0"
