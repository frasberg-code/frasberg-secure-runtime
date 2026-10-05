"""Prefect Workflow Integration for Frasberg AI"""

from typing import Any, Callable, Optional
import logging

logger = logging.getLogger(__name__)


class PrefectFlow:
    """
    Prefect workflow orchestration integration
    
    Orchestrate Frasberg AI operations with Prefect workflows.
    """
    
    def __init__(self, flow_name: str, **kwargs):
        """
        Initialize Prefect flow
        
        Args:
            flow_name: Name of the Prefect flow
            **kwargs: Additional Prefect flow configuration
        
        Examples:
            >>> flow = PrefectFlow("frasberg-dna-pipeline")
            >>> 
            >>> @flow.task
            >>> def compute_dna(sequence):
            >>>     return client.dna_compute(sequence=sequence)
            >>> 
            >>> flow.run()
        """
        self.flow_name = flow_name
        self.kwargs = kwargs
        
        self._initialize_prefect()
        
        logger.info(f"PrefectFlow initialized: {flow_name}")
    
    def _initialize_prefect(self):
        """Initialize Prefect"""
        try:
            from prefect import flow, task
            
            self.prefect_flow = flow
            self.prefect_task = task
            
        except ImportError:
            logger.error("prefect package not installed. Run: pip install prefect")
            raise
    
    def task(self, func: Callable) -> Callable:
        """Decorator to create a Prefect task"""
        return self.prefect_task(func)
    
    def flow(self, func: Callable) -> Callable:
        """Decorator to create a Prefect flow"""
        return self.prefect_flow(name=self.flow_name, **self.kwargs)(func)
