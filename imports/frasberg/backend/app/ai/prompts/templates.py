from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/v3/ai/prompts", tags=["prompt-engineering"])

class PromptTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    template: str
    variables: List[str]
    domain: str
    scope_guardrails: List[str]

class PromptRequest(BaseModel):
    template_id: str
    variables: Dict[str, str]

# Predefined prompt templates
TEMPLATES = {
    "legal_analysis": PromptTemplate(
        template_id="legal_analysis",
        name="Legal Document Analysis",
        description="Analyze legal documents without providing legal advice",
        template=(
            "Analyze the following legal document for technical structure and content. "
            "Do not provide legal advice or conclusions. "
            "Document: {document}\n"
            "Focus areas: {focus_areas}\n"
            "Output: Technical analysis only, no legal opinions."
        ),
        variables=["document", "focus_areas"],
        domain="legal",
        scope_guardrails=[
            "No legal advice",
            "No legal conclusions",
            "Technical analysis only"
        ]
    ),
    "medical_admin": PromptTemplate(
        template_id="medical_admin",
        name="Healthcare Administrative Support",
        description="Administrative healthcare tasks (non-clinical)",
        template=(
            "Assist with administrative healthcare task: {task}\n"
            "Context: {context}\n"
            "Scope: Administrative only, no diagnosis, no treatment recommendations.\n"
            "Output: Administrative guidance only."
        ),
        variables=["task", "context"],
        domain="healthcare",
        scope_guardrails=[
            "No diagnosis",
            "No treatment recommendations",
            "Administrative only"
        ]
    ),
    "research_summary": PromptTemplate(
        template_id="research_summary",
        name="Research Summarization",
        description="Summarize research with citations",
        template=(
            "Summarize the following research: {research_text}\n"
            "Requirements:\n"
            "- Include key findings\n"
            "- Cite sources\n"
            "- Note limitations\n"
            "- No speculative conclusions\n"
            "Output: Factual summary with citations."
        ),
        variables=["research_text"],
        domain="research",
        scope_guardrails=[
            "Must cite sources",
            "No speculation",
            "Factual only"
        ]
    )
}

@router.get("/templates")
def get_templates():
    """Get all prompt templates"""
    return {
        "templates": list(TEMPLATES.values()),
        "count": len(TEMPLATES)
    }

@router.get("/templates/{template_id}")
def get_template(template_id: str):
    """Get specific prompt template"""
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    return template

@router.post("/render")
def render_prompt(request: PromptRequest):
    """Render prompt from template with variables"""
    template = TEMPLATES.get(request.template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    
    # Render template with variables
    try:
        rendered = template.template.format(**request.variables)
    except KeyError as e:
        raise HTTPException(400, f"Missing variable: {e}")
    
    return {
        "template_id": request.template_id,
        "rendered_prompt": rendered,
        "scope_guardrails": template.scope_guardrails,
        "domain": template.domain
    }

@router.post("/templates")
def create_template(template: PromptTemplate):
    """Create new prompt template"""
    TEMPLATES[template.template_id] = template
    return {"status": "created", "template_id": template.template_id}
