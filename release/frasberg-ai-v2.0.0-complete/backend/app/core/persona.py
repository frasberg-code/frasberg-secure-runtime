"""Persona Definitions for Frasberg AI."""
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class Persona:
    """Persona definition."""
    id: str
    name: str
    description: str
    voice_id: str
    personality_traits: List[str] = field(default_factory=list)
    response_style: str = "conversational"
    domain: str = "general"
    metadata: Dict = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "voice_id": self.voice_id,
            "personality_traits": self.personality_traits,
            "response_style": self.response_style,
            "domain": self.domain,
            "metadata": self.metadata
        }


class PersonaRegistry:
    """Registry for persona definitions."""
    
    def __init__(self):
        """Initialize persona registry."""
        self.personas: Dict[str, Persona] = {}
        self._initialize_default_personas()
    
    def _initialize_default_personas(self):
        """Initialize default personas."""
        # Core persona
        self.personas["frasberg_ai"] = Persona(
            id="frasberg_ai",
            name="Frasberg AI",
            description="General-purpose operational assistant",
            voice_id="bk_voice_en_conv",
            personality_traits=["helpful", "precise", "professional"],
            response_style="conversational",
            domain="general"
        )
        
        # Education persona
        self.personas["frasberg_educator"] = Persona(
            id="frasberg_educator",
            name="Frasberg Educator",
            description="Educational support assistant",
            voice_id="bk_voice_en_formal",
            personality_traits=["patient", "encouraging", "clear"],
            response_style="educational",
            domain="education"
        )
        
        # Healthcare persona (non-clinical)
        self.personas["frasberg_healthcare"] = Persona(
            id="frasberg_healthcare",
            name="Frasberg Healthcare Assistant",
            description="Non-clinical healthcare support (no diagnosis, no treatment)",
            voice_id="xtts_v2_en",
            personality_traits=["empathetic", "calm", "supportive"],
            response_style="supportive",
            domain="healthcare-nonclinical",
            metadata={
                "scope_limitations": [
                    "No diagnosis",
                    "No treatment recommendations",
                    "No medical decision-making"
                ]
            }
        )
    
    def register_persona(self, persona: Persona) -> None:
        """
        Register new persona.
        
        Args:
            persona: Persona to register
        """
        self.personas[persona.id] = persona
    
    def get_persona(self, persona_id: str) -> Optional[Persona]:
        """
        Get persona by ID.
        
        Args:
            persona_id: Persona identifier
            
        Returns:
            Persona or None
        """
        return self.personas.get(persona_id)
    
    def list_personas(self, domain: Optional[str] = None) -> List[Dict]:
        """
        List all personas.
        
        Args:
            domain: Optional domain filter
            
        Returns:
            List of personas
        """
        personas = self.personas.values()
        
        if domain:
            personas = [p for p in personas if p.domain == domain]
        
        return [p.to_dict() for p in personas]
    
    def get_persona_for_domain(self, domain: str) -> Optional[Persona]:
        """
        Get default persona for domain.
        
        Args:
            domain: Domain name
            
        Returns:
            Persona or None
        """
        for persona in self.personas.values():
            if persona.domain == domain:
                return persona
        return None


# Global persona registry
persona_registry = PersonaRegistry()
