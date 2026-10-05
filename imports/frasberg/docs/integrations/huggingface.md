# Hugging Face Transformers Integration

Frasberg AI provides seamless integration with Hugging Face Transformers, enabling you to use any model from the Hugging Face Model Hub with Frasberg AI's infrastructure.

## Installation

```bash
pip install transformers torch
```

## Quick Start

### Text Generation

```python
from backend.app.integrations import HuggingFaceTransformer

# Initialize a text generation model
model = HuggingFaceTransformer("gpt2")

# Generate text
result = model.generate(
    prompt="Once upon a time",
    max_length=100,
    temperature=0.7
)
print(result)
```

### Text Classification

```python
from backend.app.integrations import HuggingFaceTransformer

# Initialize a sentiment analysis model
classifier = HuggingFaceTransformer(
    "distilbert-base-uncased-finetuned-sst-2-english"
)

# Classify text
result = classifier.classify("This product is amazing!")
print(result)
# Output: {'label': 'POSITIVE', 'score': 0.9998}
```

## Advanced Usage

### Custom Device Selection

```python
# Use GPU if available
model = HuggingFaceTransformer("gpt2", device="cuda")

# Force CPU
model = HuggingFaceTransformer("gpt2", device="cpu")

# Auto-detect best device (default)
model = HuggingFaceTransformer("gpt2", device="auto")
```

### Frasberg AI Caching

Frasberg AI can cache model outputs to improve performance:

```python
model = HuggingFaceTransformer(
    "gpt2",
    use_frasberg_cache=True  # Default
)
```

### Custom Model Configuration

```python
# Pass additional arguments to the model
model = HuggingFaceTransformer(
    "gpt2",
    torch_dtype="float16",
    low_cpu_mem_usage=True,
    device_map="auto"
)
```

## Supported Models

The integration supports all Hugging Face models including:

- **Text Generation**: GPT-2, GPT-Neo, OPT, BLOOM, LLaMA
- **Text Classification**: BERT, RoBERTa, DistilBERT
- **Question Answering**: BERT, RoBERTa, ALBERT
- **Named Entity Recognition**: BERT, RoBERTa
- **Translation**: MarianMT, T5, BART
- **Summarization**: BART, T5, Pegasus

## Performance Tips

1. **Use quantization** for faster inference:
   ```python
   model = HuggingFaceTransformer(
       "gpt2",
       load_in_8bit=True
   )
   ```

2. **Enable Frasberg AI caching** for repeated queries:
   ```python
   model = HuggingFaceTransformer("gpt2", use_frasberg_cache=True)
   ```

3. **Use smaller models** for production:
   - `distilgpt2` instead of `gpt2`
   - `distilbert` instead of `bert`

## Error Handling

```python
try:
    model = HuggingFaceTransformer("gpt2")
    result = model.generate("Hello world")
except ImportError:
    print("Please install transformers: pip install transformers")
except Exception as e:
    print(f"Error: {e}")
```

## Integration with Frasberg AI Features

### With DNA Computing

```python
from backend.app.integrations import HuggingFaceTransformer
from backend.app.v5.biological import DNACompute

model = HuggingFaceTransformer("gpt2")
dna_compute = DNACompute()

# Use LLM for text, DNA for computation
text = model.generate("Analyze this DNA sequence:")
dna_result = dna_compute.encode(text)
```

### With Swarm Intelligence

```python
from backend.app.integrations import HuggingFaceTransformer
from backend.app.v5.swarm import MultiAgent

# Deploy multiple models in a swarm
models = [
    HuggingFaceTransformer("gpt2"),
    HuggingFaceTransformer("distilgpt2")
]

swarm = MultiAgent(agents=models)
results = swarm.generate("Hello world")
```

## API Reference

### `HuggingFaceTransformer`

#### `__init__(model_name, device, use_frasberg_cache, **kwargs)`

Initialize the Hugging Face model.

**Parameters:**
- `model_name` (str): Model identifier from Hugging Face Hub
- `device` (str): Device to run on ("auto", "cpu", "cuda", "mps")
- `use_frasberg_cache` (bool): Enable Frasberg AI caching
- `**kwargs`: Additional arguments for model initialization

#### `generate(prompt, max_length, temperature, **kwargs)`

Generate text from a prompt.

**Parameters:**
- `prompt` (str): Input text prompt
- `max_length` (int): Maximum length of generated text
- `temperature` (float): Sampling temperature (0.0-2.0)
- `**kwargs`: Additional generation parameters

**Returns:**
- `str`: Generated text

#### `classify(text)`

Classify text using the model.

**Parameters:**
- `text` (str): Text to classify

**Returns:**
- `dict`: Classification results with labels and scores

## Troubleshooting

### Model Download Issues

If you encounter issues downloading models:

```python
# Use a specific revision
model = HuggingFaceTransformer(
    "gpt2",
    revision="main"
)

# Use offline mode
model = HuggingFaceTransformer(
    "gpt2",
    local_files_only=True
)
```

### Memory Issues

For large models:

```python
# Use 8-bit quantization
model = HuggingFaceTransformer(
    "gpt2",
    load_in_8bit=True,
    device_map="auto"
)
```

## Examples

### Complete Example

```python
from backend.app.integrations import HuggingFaceTransformer

# Initialize model
model = HuggingFaceTransformer(
    "gpt2",
    device="auto",
    use_frasberg_cache=True
)

# Generate text
prompts = [
    "The future of AI is",
    "In a world where",
    "Scientists discovered"
]

for prompt in prompts:
    result = model.generate(
        prompt=prompt,
        max_length=50,
        temperature=0.8
    )
    print(f"Prompt: {prompt}")
    print(f"Generated: {result}\n")
```

## Learn More

- [Hugging Face Transformers Documentation](https://huggingface.co/docs/transformers)
- [Frasberg AI Integration Guide](../README.md)
- [Performance Tuning](../performance/tuning.md)
