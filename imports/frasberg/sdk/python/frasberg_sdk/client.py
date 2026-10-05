"""Frasberg AI Python Client"""

import requests
from typing import Dict, Any, Optional, List
from .exceptions import APIError, ValidationError

class FrasbergClient:
    """Main client for interacting with Frasberg AI"""
    
    def __init__(self, base_url: str = "http://localhost:8000", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 422:
                raise ValidationError(str(e))
            raise APIError(f"API request failed: {e}")
        except Exception as e:
            raise APIError(f"Request failed: {e}")
    
    # Health
    def health(self) -> Dict[str, Any]:
        """Check system health"""
        return self._request("GET", "/health")
    
    def detailed_health(self) -> Dict[str, Any]:
        """Get detailed health metrics"""
        return self._request("GET", "/health/detailed")
    
    # Voice
    def synthesize_speech(
        self, 
        text: str, 
        language: str = "en",
        emotion: str = "neutral",
        speaker_id: str = "default"
    ) -> Dict[str, Any]:
        """Synthesize speech from text"""
        return self._request("POST", "/api/v2/voice/tts/synthesize", json={
            "text": text,
            "language": language,
            "emotion": emotion,
            "speaker_id": speaker_id
        })
    
    def get_supported_languages(self) -> List[str]:
        """Get supported languages"""
        result = self._request("GET", "/api/v2/voice/tts/languages")
        return result.get("languages", [])
    
    # AI
    def generate(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate AI response"""
        payload = {
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        if provider:
            payload["provider"] = provider
        if model:
            payload["model"] = model
        
        return self._request("POST", "/api/v3/ai/llm/generate", json=payload)
    
    def validate_response(
        self,
        response_text: str,
        context: Dict[str, Any],
        domain: str
    ) -> Dict[str, Any]:
        """Validate AI response for hallucinations"""
        return self._request("POST", "/api/v3/ai/validation/validate", json={
            "response_text": response_text,
            "context": context,
            "domain": domain
        })
    
    # Memory
    def store_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str,
        importance: float,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Store memory"""
        return self._request("POST", "/api/v3/memory/store", params={
            "user_id": user_id,
            "content": content,
            "memory_type": memory_type,
            "importance": importance,
            "tags": tags or []
        })
    
    def recall_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        min_importance: float = 0.5
    ) -> Dict[str, Any]:
        """Recall memories"""
        return self._request("POST", "/api/v3/memory/recall", json={
            "user_id": user_id,
            "query": query,
            "limit": limit,
            "min_importance": min_importance
        })
    
    # Mesh
    def get_mesh_topology(self) -> Dict[str, Any]:
        """Get mesh network topology"""
        return self._request("GET", "/api/v4/mesh/topology")
    
    def join_mesh(
        self,
        hostname: str,
        port: int,
        region: str,
        capabilities: List[str]
    ) -> Dict[str, Any]:
        """Join mesh network"""
        return self._request("POST", "/api/v4/mesh/join", params={
            "hostname": hostname,
            "port": port,
            "region": region,
            "capabilities": capabilities
        })
    
    # Quantum
    def quantum_encrypt(
        self,
        plaintext: str,
        algorithm: str = "CRYSTALS-Kyber"
    ) -> Dict[str, Any]:
        """Encrypt with post-quantum algorithm"""
        return self._request("POST", "/api/v4/quantum/encryption/encrypt", json={
            "plaintext": plaintext,
            "algorithm": algorithm
        })
    
    def generate_zk_proof(
        self,
        statement: str,
        witness: str
    ) -> Dict[str, Any]:
        """Generate zero-knowledge proof"""
        return self._request("POST", "/api/v4/quantum/zkp/generate", json={
            "statement": statement,
            "witness": witness
        })
    
    # v5 Features
    def dna_compute(
        self,
        sequence: str,
        computation_type: str
    ) -> Dict[str, Any]:
        """DNA-based computation"""
        return self._request("POST", "/api/v5/biological/dna/compute", json={
            "sequence": sequence,
            "computation_type": computation_type
        })
    
    def create_swarm(
        self,
        num_agents: int,
        coordination_strategy: str,
        objective: str
    ) -> Dict[str, Any]:
        """Create agent swarm"""
        return self._request("POST", "/api/v5/swarm/create", json={
            "num_agents": num_agents,
            "coordination_strategy": coordination_strategy,
            "objective": objective
        })
    
    def temporal_reasoning(
        self,
        query: str,
        time_context: str,
        prediction_horizon: int
    ) -> Dict[str, Any]:
        """Perform temporal reasoning"""
        return self._request("POST", "/api/v5/temporal/reason", json={
            "query": query,
            "time_context": time_context,
            "prediction_horizon": prediction_horizon
        })
    
    # Metrics
    def get_metrics(self) -> Dict[str, Any]:
        """Get system metrics"""
        return self._request("GET", "/metrics")
