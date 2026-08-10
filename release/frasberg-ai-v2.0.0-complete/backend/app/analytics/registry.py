"""Fork Registry for Frasberg AI Analytics."""
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class ForkDefinition:
    """Fork definition."""
    fork_id: str
    name: str
    domain: str
    port: int
    description: str
    scope_limitations: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)


class ForkRegistry:
    """
    Registry for Frasberg AI forks.
    
    Tracks all fork instances for multi-fork analytics and management.
    """
    
    def __init__(self):
        """Initialize fork registry."""
        self.forks: Dict[str, ForkDefinition] = {}
        self._initialize_default_forks()
    
    def _initialize_default_forks(self):
        """Initialize default forks."""
        # Canonical core
        self.forks["canonical-core"] = ForkDefinition(
            fork_id="canonical-core",
            name="Frasberg AI (Canonical)",
            domain="general",
            port=8000,
            description="General-purpose operational intelligence system"
        )
        
        # Education fork
        self.forks["education"] = ForkDefinition(
            fork_id="education",
            name="Frasberg AI (Education)",
            domain="education",
            port=8001,
            description="Educational support fork",
            scope_limitations=[
                "Educational context only",
                "No medical advice",
                "No legal advice"
            ]
        )
        
        # Healthcare fork (non-clinical)
        self.forks["healthcare-nonclinical"] = ForkDefinition(
            fork_id="healthcare-nonclinical",
            name="Frasberg AI (Healthcare Non-Clinical)",
            domain="healthcare",
            port=8002,
            description="Healthcare support fork (non-clinical operations only)",
            scope_limitations=[
                "NO diagnosis",
                "NO treatment recommendations",
                "NO medical decision-making",
                "Administrative and operational support only"
            ]
        )
    
    def register_fork(self, fork: ForkDefinition) -> None:
        """
        Register new fork.
        
        Args:
            fork: Fork definition
        """
        self.forks[fork.fork_id] = fork
    
    def get_fork(self, fork_id: str) -> Optional[ForkDefinition]:
        """Get fork by ID."""
        return self.forks.get(fork_id)
    
    def list_forks(self) -> List[Dict]:
        """List all forks."""
        return [vars(f) for f in self.forks.values()]
    
    def get_fork_by_port(self, port: int) -> Optional[ForkDefinition]:
        """Get fork by port number."""
        for fork in self.forks.values():
            if fork.port == port:
                return fork
        return None


# Global fork registry
fork_registry = ForkRegistry()
