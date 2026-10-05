# Luchii API Reference

## Overview
The Luchii API provides access to the Genesis-Prime cognitive model, including
runtime execution, pipelines, and engine modules.

## 1. LuchiiModel

### Load a model
```python
from luchii import LuchiiModel
model = LuchiiModel.load("genesis-prime")
```

### Generate text
```python
output = model.generate("Initialize Omni-Prime synthesis.")
```

### Parameters
| Parameter | Type | Description |
| --- | --- | --- |
| `max_length` | `int` | Maximum output length |
| `temperature` | `float` | Creativity control |
| `top_p` | `float` | Nucleus sampling |

## 2. Runtime

```python
from runtime.core import LuchiiRuntime
runtime = LuchiiRuntime(config)
runtime.run(prompt)
```

## 3. Context

```python
from runtime.context import LuchiiContext
ctx = LuchiiContext()
ctx.update("mode", "prime")
```

## 4. Pipelines

```python
from pipelines.preprocess import preprocess
from pipelines.generate import generate
from pipelines.postprocess import postprocess
```

## 5. Utilities

```python
from utils.logger import log
from utils.config import LuchiiConfig
from utils.helpers import load_json
```

## 6. FastAPI Server

### Health
`GET /health`

### Generate
`POST /generate`

```json
{
  "prompt": "Initialize Omni-Prime synthesis.",
  "model_name": "genesis-prime",
  "max_tokens": 256,
  "temperature": 0.7
}
```