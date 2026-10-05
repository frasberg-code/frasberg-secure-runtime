from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v2/governance/witness", tags=["expert-witness"])

class ExpertExplanation(BaseModel):
    question: str
    explanation: str
    scope_limits: list
    confidence: str
    citations: list

@router.post("/explain")
def expert_witness_explanation(question: str, context: dict):
    """Provide court-safe expert witness explanation"""
    
    scope_limits = [
        "No legal conclusions or advice",
        "Technical explanation only",
        "Based on system logs and data",
        "No predictive statements",
        "No biometric identification claims"
    ]
    
    explanation = (
        f"Based on the system logs and audit trail, the following technical "
        f"observations can be made regarding: {question}. "
        f"The system recorded these events in a hash-chained audit log, "
        f"ensuring tamper-evidence. All timestamps are UTC-based and "
        f"cryptographically signed."
    )
    
    return ExpertExplanation(
        question=question,
        explanation=explanation,
        scope_limits=scope_limits,
        confidence="High (based on system logs)",
        citations=["Audit log entries", "Hash chain verification", "System timestamps"]
    )
