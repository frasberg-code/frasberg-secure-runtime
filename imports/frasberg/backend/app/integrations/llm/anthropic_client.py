"""Real Anthropic Integration for Frasberg AI v5.1"""
import os
from typing import Optional, Dict, Any, AsyncIterator
import logging

logger = logging.getLogger(__name__)

class AnthropicClient:
    """Production-ready Anthropic integration"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            logger.warning("Anthropic API key not set. Will return mock responses.")
            self.mock_mode = True
        else:
            self.mock_mode = False
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=self.api_key)
            except ImportError:
                logger.warning("Anthropic library not installed. Using mock mode.")
                self.mock_mode = True
    
    def generate(
        self, 
        prompt: str, 
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 1000, 
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate completion using Anthropic"""
        
        if self.mock_mode:
            return self._mock_generate(prompt, model)
        
        try:
            kwargs = {
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}]
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            response = self.client.messages.create(**kwargs)
            
            return {
                "response": response.content[0].text,
                "model": model,
                "provider": "anthropic",
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                "stop_reason": response.stop_reason,
                "mock": False
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return {"error": str(e), "provider": "anthropic", "mock": False}
    
    async def generate_streaming(
        self,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> AsyncIterator[str]:
        """Stream completion from Anthropic"""
        if self.mock_mode:
            yield f"[MOCK STREAMING] {prompt[:50]}..."
            return
        
        try:
            with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            yield f"[ERROR] {str(e)}"
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text) // 4
    
    def _mock_generate(self, prompt: str, model: str) -> Dict[str, Any]:
        """Mock response when API key not available"""
        return {
            "response": f"[MOCK ANTHROPIC] Response to: {prompt[:50]}...\n\nThis is a simulated response. Set ANTHROPIC_API_KEY environment variable for real responses.",
            "model": model,
            "provider": "anthropic",
            "tokens_used": 200,
            "stop_reason": "end_turn",
            "mock": True
        }

# Global instance
def get_anthropic_client() -> AnthropicClient:
    """Get or create Anthropic client singleton"""
    if not hasattr(get_anthropic_client, "_instance"):
        get_anthropic_client._instance = AnthropicClient()
    return get_anthropic_client._instance
