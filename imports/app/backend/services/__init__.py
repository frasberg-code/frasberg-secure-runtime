"""
Services module for Sofia AI Platform
"""
from services.llm_service import llm_service, LLMService, SOFIA_SYSTEM_PROMPT, ADMIN_EMAILS

__all__ = ['llm_service', 'LLMService', 'SOFIA_SYSTEM_PROMPT', 'ADMIN_EMAILS']
