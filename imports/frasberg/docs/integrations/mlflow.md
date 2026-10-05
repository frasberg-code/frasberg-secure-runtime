# MLflow Integration

Frasberg AI integrates with MLflow for complete model lifecycle management, experiment tracking, and model registry.

## Installation

```bash
pip install mlflow
```

## Quick Start

### Basic Experiment Tracking

```python
from backend.app.integrations import MLflowTracker

# Initialize tracker
tracker = MLflowTracker(
    experiment_name="frasberg-dna-compute"
)

# Start run
tracker.start_run(run_name="experiment-1")

# Log parameters
tracker.log_params({
    "learning_rate": 0.001,
    "batch_size": 32
})

# Log metrics
tracker.log_metrics({
    "accuracy": 0.95,
    "loss": 0.05
})

# End run
tracker.end_run()
```

### Model Management

```python
from backend.app.integrations import MLflowTracker

tracker = MLflowTracker(experiment_name="frasberg-models")
tracker.start_run()

# Train model
model = train_neural_dna_model()

# Log model
tracker.log_model(
    model=model,
    artifact_path="neural-dna-v1"
)

tracker.end_run()
```

## Advanced Usage

### Custom Tracking Server

```python
tracker = MLflowTracker(
    tracking_uri="http://mlflow-server:5000",
    experiment_name="frasberg-experiments"
)
```

### Nested Runs

```python
tracker = MLflowTracker(experiment_name="frasberg-pipeline")

# Parent run
with tracker.start_run(run_name="pipeline-run"):
    tracker.log_params({"pipeline_version": "1.0"})
    
    # Nested run 1
    with tracker.start_run(run_name="data-preprocessing", nested=True):
        tracker.log_metrics({"records_processed": 10000})
    
    # Nested run 2
    with tracker.start_run(run_name="model-training", nested=True):
        tracker.log_metrics({"training_accuracy": 0.95})
```

## Integration with Frasberg AI

### DNA Computing Experiments

```python
from backend.app.integrations import MLflowTracker
from backend.app.v5.biological import DNACompute

tracker = MLflowTracker(experiment_name="dna-optimization")
dna_compute = DNACompute()

tracker.start_run(run_name="dna-sequence-encoding")

# Log DNA compute parameters
tracker.log_params({
    "algorithm": "simd-optimized",
    "sequence_length": 1000,
    "encoding_type": "base4"
})

# Run computation
result = dna_compute.encode(sequence)

# Log metrics
tracker.log_metrics({
    "compute_time_ms": result.time * 1000,
    "accuracy": result.accuracy,
    "throughput": result.throughput
})

tracker.end_run()
```

### Model Versioning

```python
from backend.app.integrations import MLflowTracker

tracker = MLflowTracker()
tracker.start_run()

# Train model
model = train_model()

# Log with versioning
tracker.log_model(
    model=model,
    artifact_path="neural-dna",
    registered_model_name="neural-dna-production"
)

tracker.end_run()
```

## API Reference

### `MLflowTracker`

#### `__init__(tracking_uri, experiment_name, **kwargs)`

Initialize MLflow tracker.

**Parameters:**
- `tracking_uri` (str, optional): MLflow server URI
- `experiment_name` (str, optional): Experiment name
- `**kwargs`: Additional MLflow configuration

#### `start_run(run_name, **kwargs)`

Start a new MLflow run.

**Parameters:**
- `run_name` (str, optional): Run name
- `**kwargs`: Additional run parameters

**Returns:**
- Run object

#### `log_params(params)`

Log parameters.

**Parameters:**
- `params` (dict): Parameter name -> value mapping

#### `log_metrics(metrics, step)`

Log metrics.

**Parameters:**
- `metrics` (dict): Metric name -> value mapping
- `step` (int, optional): Step number

#### `log_model(model, artifact_path, **kwargs)`

Log model artifact.

**Parameters:**
- `model`: Model object
- `artifact_path` (str): Path in artifact store
- `**kwargs`: Additional logging parameters

#### `end_run()`

End the current run.

## MLflow UI

Start the MLflow UI to visualize experiments:

```bash
mlflow ui --port 5000
```

Access at: http://localhost:5000

## Best Practices

### 1. Organize Experiments

```python
# Use hierarchical experiment names
tracker = MLflowTracker(
    experiment_name="frasberg-ai/dna-compute/optimization"
)
```

### 2. Tag Runs

```python
tracker.start_run(run_name="experiment-1")
tracker.mlflow.set_tags({
    "model_type": "neural-dna",
    "version": "6.5.0",
    "environment": "production"
})
```

### 3. Log Artifacts

```python
# Log additional files
tracker.mlflow.log_artifact("config.yaml")
tracker.mlflow.log_artifact("results.csv")
```

### 4. Track System Metrics

```python
import psutil

tracker.log_metrics({
    "cpu_percent": psutil.cpu_percent(),
    "memory_mb": psutil.virtual_memory().used / 1024 / 1024,
    "disk_usage_percent": psutil.disk_usage('/').percent
})
```

## Model Registry

### Register Model

```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register model
result = client.create_registered_model("neural-dna-prod")

# Create version
client.create_model_version(
    name="neural-dna-prod",
    source="runs:/run-id/model",
    run_id="run-id"
)
```

### Promote Model to Production

```python
client.transition_model_version_stage(
    name="neural-dna-prod",
    version=1,
    stage="Production"
)
```

## Examples

### Complete Training Pipeline

```python
from backend.app.integrations import MLflowTracker
import time

# Initialize
tracker = MLflowTracker(experiment_name="frasberg-training")
tracker.start_run(run_name="neural-dna-training")

# Log configuration
config = {
    "model": "neural-dna",
    "learning_rate": 0.001,
    "batch_size": 32,
    "epochs": 10
}
tracker.log_params(config)

# Training loop
for epoch in range(config["epochs"]):
    start_time = time.time()
    
    # Train
    train_loss = train_epoch(model, train_data)
    val_loss = validate(model, val_data)
    
    # Log metrics
    tracker.log_metrics({
        "train_loss": train_loss,
        "val_loss": val_loss,
        "epoch_time": time.time() - start_time
    }, step=epoch)

# Log final model
tracker.log_model(model, "final-model")
tracker.end_run()
```

### Hyperparameter Tuning

```python
from backend.app.integrations import MLflowTracker

tracker = MLflowTracker(experiment_name="hyperparameter-tuning")

# Grid search
learning_rates = [0.001, 0.01, 0.1]
batch_sizes = [16, 32, 64]

for lr in learning_rates:
    for bs in batch_sizes:
        tracker.start_run(
            run_name=f"lr-{lr}-bs-{bs}"
        )
        
        tracker.log_params({
            "learning_rate": lr,
            "batch_size": bs
        })
        
        # Train and evaluate
        accuracy = train_and_evaluate(lr, bs)
        
        tracker.log_metrics({
            "accuracy": accuracy
        })
        
        tracker.end_run()
```

## Comparison with W&B

| Feature | MLflow | W&B |
|---------|--------|-----|
| Open Source | ✅ Yes | ❌ No |
| Self-Hosted | ✅ Yes | Limited |
| Model Registry | ✅ Built-in | ✅ Available |
| UI | ✅ Basic | ✅ Advanced |
| Collaboration | ⚠️ Basic | ✅ Advanced |

## Troubleshooting

### Connection Issues

```python
# Test connection
try:
    tracker = MLflowTracker(
        tracking_uri="http://mlflow-server:5000"
    )
except Exception as e:
    print(f"Connection failed: {e}")
```

### Storage Issues

```bash
# Set artifact storage
export MLFLOW_ARTIFACT_ROOT=/path/to/artifacts
```

## Learn More

- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [Frasberg AI Integration Guide](../README.md)
- [Model Registry Guide](https://mlflow.org/docs/latest/model-registry.html)
