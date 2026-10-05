from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import re

router = APIRouter(prefix="/api/v3/ai/validation", tags=["ai-validation"])

class ValidationRequest(BaseModel):
    response_text: str
    context: Dict[str, Any]
    domain: str

class ValidationResult(BaseModel):
    is_valid: bool
    confidence: float
    hallucination_indicators: List[str]
    scope_violations: List[str]
    factual_consistency_score: float
    recommendations: List[str]

@router.post("/validate", response_model=ValidationResult)
def validate_response(request: ValidationRequest):
    """Validate AI response for hallucinations and scope violations"""
    
    text = request.response_text.lower()
    domain = request.domain.lower()
    
    # Check for hallucination indicators
    hallucination_indicators = []
    
    # Vague language patterns
    vague_patterns = ["maybe", "possibly", "i think", "probably", "might be"]
    for pattern in vague_patterns:
        if pattern in text:
            hallucination_indicators.append(f"Vague language: '{pattern}'")
    
    # Unsupported claims
    if "studies show" in text or "research indicates" in text:
        if "citation" not in text and "source" not in text:
            hallucination_indicators.append("Unsupported claim without citation")
    
    # Check for scope violations
    scope_violations = []
    
    # Domain-specific scope checks
    if domain == "legal":
        legal_violations = ["you should", "i recommend", "the law says", "legal advice"]
        for violation in legal_violations:
            if violation in text:
                scope_violations.append(f"Legal scope violation: '{violation}'")
    
    elif domain == "healthcare":
        medical_violations = ["diagnosis", "treatment", "medication", "prescribe"]
        for violation in medical_violations:
            if violation in text:
                scope_violations.append(f"Medical scope violation: '{violation}'")
    
    # Calculate scores
    hallucination_score = min(1.0, len(hallucination_indicators) * 0.2)
    factual_consistency = max(0.0, 1.0 - hallucination_score)
    is_valid = len(scope_violations) == 0 and hallucination_score < 0.5
    
    # Generate recommendations
    recommendations = []
    if hallucination_indicators:
        recommendations.append("Remove vague language and add citations")
    if scope_violations:
        recommendations.append("Rewrite to stay within scope limits")
    if is_valid:
        recommendations.append("Response passes validation")
    
    return ValidationResult(
        is_valid=is_valid,
        confidence=factual_consistency,
        hallucination_indicators=hallucination_indicators,
        scope_violations=scope_violations,
        factual_consistency_score=factual_consistency,
        recommendations=recommendations
    )

@router.post("/batch-validate")
def batch_validate(requests: List[ValidationRequest]):
    """Validate multiple responses"""
    results = [validate_response(req) for req in requests]
    
    return {
        "total_validated": len(results),
        "passed": sum(1 for r in results if r.is_valid),
        "failed": sum(1 for r in results if not r.is_valid),
        "results": results
    }
