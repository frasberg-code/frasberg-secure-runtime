# Frasberg AI SDK

**Python SDK for Frasberg AI v6.0.0**

## Installation

```bash
pip install frasberg-sdk
```

## Quick Start

```python
from frasberg_sdk import FrasbergClient

# Initialize client
client = FrasbergClient(
    api_key="your-api-key",
    base_url="http://localhost:8000"
)

# Generate text
response = client.generate(
    prompt="Explain quantum computing",
    model="frasberg-core"
)

print(response.text)
```

## Features

- ✅ Text generation
- ✅ Voice synthesis
- ✅ Emotion detection
- ✅ Async support
- ✅ Type hints

## API Reference

### `FrasbergClient`

```python
client = FrasbergClient(
    api_key: str,
    base_url: str = "http://localhost:8000",
    timeout: int = 30
)
```

### `generate()`

```python
response = client.generate(
    prompt: str,
    model: str = "frasberg-core",
    temperature: float = 0.2,
    max_tokens: int = 4096
)
```

## Requirements

- Python 3.11+
- Frasberg AI v6.0.0+

## License

MIT License
