"""Dagster Pipeline Integration for Frasberg"""

from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


class DagsterPipeline:
    """
    Dagster data pipeline integration
    
    Build type-safe data pipelines with Frasberg operations.
    """
    
    def __init__(self, pipeline_name: str, **kwargs):
        """
        Initialize Dagster pipeline
        
        Args:
            pipeline_name: Name of the Dagster pipeline
            **kwargs: Additional Dagster configuration
        
        Examples:
            >>> pipeline = DagsterPipeline("frasberg-data-pipeline")
            >>> 
            >>> @pipeline.op
            >>> def process_dna(context, sequence: str):
            >>>     return client.dna_compute(sequence=sequence)
        """
        self.pipeline_name = pipeline_name
        self.kwargs = kwargs
        
        self._initialize_dagster()
        
        logger.info(f"DagsterPipeline initialized: {pipeline_name}")
    
    def _initialize_dagster(self):
        """Initialize Dagster"""
        try:
            from dagster import op, job
            
            self.dagster_op = op
            self.dagster_job = job
            
        except ImportError:
            logger.error("dagster package not installed. Run: pip install dagster")
            raise
    
    def op(self, func):
        """Decorator to create a Dagster op"""
        return self.dagster_op(func)
    
    def job(self, func):
        """Decorator to create a Dagster job"""
        return self.dagster_job(name=self.pipeline_name, **self.kwargs)(func)
