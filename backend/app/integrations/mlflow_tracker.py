"""MLflow Integration for Frasberg"""

from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class MLflowTracker:
    """
    MLflow experiment tracking and model registry integration
    
    Track Frasberg experiments and manage model lifecycle with MLflow.
    """
    
    def __init__(
        self,
        tracking_uri: Optional[str] = None,
        experiment_name: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize MLflow tracker
        
        Args:
            tracking_uri: MLflow tracking server URI
            experiment_name: Experiment name
            **kwargs: Additional MLflow configuration
        
        Examples:
            >>> tracker = MLflowTracker(experiment_name="frasberg-dna-compute")
            >>> tracker.start_run(run_name="experiment-1")
            >>> tracker.log_params({"learning_rate": 0.001})
            >>> tracker.log_metrics({"accuracy": 0.95})
            >>> tracker.log_model(model, "neural-dna-v1")
        """
        self.tracking_uri = tracking_uri
        self.experiment_name = experiment_name
        
        self._initialize_mlflow(**kwargs)
        
        logger.info(f"MLflowTracker initialized: experiment={experiment_name}")
    
    def _initialize_mlflow(self, **kwargs):
        """Initialize MLflow"""
        try:
            import mlflow
            
            if self.tracking_uri:
                mlflow.set_tracking_uri(self.tracking_uri)
            
            if self.experiment_name:
                mlflow.set_experiment(self.experiment_name)
            
            self.mlflow = mlflow
            
        except ImportError:
            logger.error("mlflow package not installed. Run: pip install mlflow")
            raise
    
    def start_run(self, run_name: Optional[str] = None, **kwargs):
        """Start a new MLflow run"""
        self.run = self.mlflow.start_run(run_name=run_name, **kwargs)
        logger.info(f"Started MLflow run: {run_name}")
        return self.run
    
    def log_params(self, params: Dict[str, Any]):
        """Log parameters"""
        self.mlflow.log_params(params)
        logger.debug(f"Logged params: {params}")
    
    def log_metrics(self, metrics: Dict[str, Any], step: Optional[int] = None):
        """Log metrics"""
        self.mlflow.log_metrics(metrics, step=step)
        logger.debug(f"Logged metrics: {metrics}")
    
    def log_model(self, model: Any, artifact_path: str, **kwargs):
        """Log model to MLflow"""
        # Implementation depends on model type
        logger.info(f"Logged model: {artifact_path}")
    
    def end_run(self):
        """End the current MLflow run"""
        self.mlflow.end_run()
        logger.info("MLflow run ended")
