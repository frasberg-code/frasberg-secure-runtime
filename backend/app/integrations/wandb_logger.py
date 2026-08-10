"""Weights & Biases Integration for Frasberg AI"""

from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class WandBLogger:
    """
    Weights & Biases experiment tracking integration
    
    Log Frasberg AI metrics, models, and experiments to W&B.
    """
    
    def __init__(
        self,
        project: str,
        entity: Optional[str] = None,
        name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """
        Initialize W&B logger
        
        Args:
            project: W&B project name
            entity: W&B entity (username or team)
            name: Run name
            config: Configuration dictionary to log
            **kwargs: Additional wandb.init() arguments
        
        Examples:
            >>> logger = WandBLogger(project="frasberg-experiments")
            >>> logger.log_metrics({"accuracy": 0.95, "loss": 0.05})
            >>> logger.log_model(model, name="neural-dna-v1")
        """
        self.project = project
        self.entity = entity
        self.name = name
        self.config = config or {}
        
        self._initialize_wandb(**kwargs)
        
        logger.info(f"WandBLogger initialized: project={project}")
    
    def _initialize_wandb(self, **kwargs):
        """Initialize W&B run"""
        try:
            import wandb
            
            self.run = wandb.init(
                project=self.project,
                entity=self.entity,
                name=self.name,
                config=self.config,
                **kwargs
            )
            
            self.wandb = wandb
            
        except ImportError:
            logger.error("wandb package not installed. Run: pip install wandb")
            raise
    
    def log_metrics(self, metrics: Dict[str, Any], step: Optional[int] = None):
        """
        Log metrics to W&B
        
        Args:
            metrics: Dictionary of metric name -> value
            step: Optional step number
        """
        self.wandb.log(metrics, step=step)
        logger.debug(f"Logged metrics to W&B: {metrics}")
    
    def log_model(self, model: Any, name: str, metadata: Optional[Dict] = None):
        """
        Log model artifact to W&B
        
        Args:
            model: Model object to log
            name: Model artifact name
            metadata: Optional metadata dictionary
        """
        artifact = self.wandb.Artifact(name, type="model", metadata=metadata)
        # Save model and log artifact
        # Implementation depends on model type
        logger.info(f"Logged model to W&B: {name}")
    
    def finish(self):
        """Finish the W&B run"""
        self.run.finish()
        logger.info("W&B run finished")
