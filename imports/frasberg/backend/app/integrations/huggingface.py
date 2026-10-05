"""Hugging Face Transformers Integration for Frasberg AI"""

from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class HuggingFaceTransformer:
    """
    Integration with Hugging Face Transformers
    
    Enables using any Hugging Face model with Frasberg AI infrastructure.
    """
    
    def __init__(
        self,
        model_name: str,
        device: str = "auto",
        use_frasberg_cache: bool = True,
        **kwargs
    ):
        """
        Initialize Hugging Face model with Frasberg AI
        
        Args:
            model_name: HuggingFace model identifier (e.g., "gpt2", "bert-base-uncased")
            device: Device to run on ("auto", "cpu", "cuda", "mps")
            use_frasberg_cache: Use Frasberg AI caching for model outputs
            **kwargs: Additional arguments passed to transformers.AutoModel
        
        Examples:
            >>> # Text generation
            >>> model = HuggingFaceTransformer("gpt2")
            >>> result = model.generate("Hello world")
            
            >>> # Text classification
            >>> classifier = HuggingFaceTransformer("distilbert-base-uncased-finetuned-sst-2-english")
            >>> sentiment = classifier.classify("This is amazing!")
        """
        self.model_name = model_name
        self.device = device
        self.use_frasberg_cache = use_frasberg_cache
        self.kwargs = kwargs
        
        self._initialize_model()
        
        logger.info(f"HuggingFaceTransformer initialized: {model_name} on {device}")
    
    def _initialize_model(self):
        """Initialize the Hugging Face model"""
        try:
            from transformers import AutoModel, AutoTokenizer
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(
                self.model_name,
                **self.kwargs
            )
            
            # Move to device
            if self.device == "auto":
                # Auto-detect best device
                import torch
                if torch.cuda.is_available():
                    self.model = self.model.to("cuda")
                elif torch.backends.mps.is_available():
                    self.model = self.model.to("mps")
            else:
                self.model = self.model.to(self.device)
                
        except ImportError:
            logger.error("transformers package not installed. Run: pip install transformers")
            raise
    
    def generate(
        self,
        prompt: str,
        max_length: int = 100,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Generate text using the model
        
        Args:
            prompt: Input text prompt
            max_length: Maximum length of generated text
            temperature: Sampling temperature
            **kwargs: Additional generation parameters
        
        Returns:
            Generated text string
        """
        try:
            from transformers import pipeline
            
            generator = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
            
            result = generator(
                prompt,
                max_length=max_length,
                temperature=temperature,
                **kwargs
            )
            
            return result[0]["generated_text"]
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise
    
    def classify(self, text: str) -> Dict[str, Any]:
        """
        Classify text using the model
        
        Args:
            text: Input text to classify
        
        Returns:
            Classification results with labels and scores
        """
        try:
            from transformers import pipeline
            
            classifier = pipeline("text-classification", model=self.model, tokenizer=self.tokenizer)
            result = classifier(text)
            
            return result[0]
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            raise
