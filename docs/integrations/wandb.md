# Weights & Biases (W&B) Integration

Frasberg AI integrates with Weights & Biases for comprehensive experiment tracking, model monitoring, and collaboration.

## Installation

```bash
pip install wandb
wandb login
```

## Quick Start

### Basic Experiment Tracking

```python
from backend.app.integrations import WandBLogger

# Initialize W&B logger
logger = WandBLogger(
    project="frasberg-experiments",
    name="dna-compute-experiment-1"
)

# Log metrics
logger.log_metrics({
    "accuracy": 0.95,
    "loss": 0.05,
    "epoch": 1
})

# Finish run
logger.finish()
```

### Track Frasberg AI Operations

```python
from backend.app.integrations import WandBLogger
from backend.app.v5.biological import DNACompute

# Initialize
logger = WandBLogger(project="frasberg-dna-experiments")
dna_compute = DNACompute()

# Run experiments
for sequence in sequences:
    result = dna_compute.encode(sequence)
    
    logger.log_metrics({
        "sequence_length": len(sequence),
        "encoding_time": result.time,
        "accuracy": result.accuracy
    })

logger.finish()
```

## Advanced Usage

### Configuration Tracking

```python
logger = WandBLogger(
    project="frasberg-ai",
    name="experiment-1",
    config={
        "model": "neural-dna-v1",
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 100
    }
)
```

### Team Collaboration

```python
logger = WandBLogger(
    project="frasberg-experiments",
    entity="my-team",  # Team name
    name="shared-experiment"
)
```

### Model Artifact Logging

```python
# Log model
logger.log_model(
    model=model,
    name="neural-dna-v1.0",
    metadata={
        "architecture": "transformer",
        "parameters": "175M",
        "training_data": "frasberg-dataset-v2"
    }
)
```

## Integration with Frasberg AI Features

### DNA Computing Experiments

```python
from backend.app.integrations import WandBLogger
from backend.app.v5.biological import DNACompute

logger = WandBLogger(project="dna-experiments")
dna_compute = DNACompute()

# Track DNA computation performance
sequences = generate_test_sequences(1000)

for i, seq in enumerate(sequences):
    result = dna_compute.encode(seq)
    
    logger.log_metrics({
        "sequence_id": i,
        "length": len(seq),
        "compute_time_ms": result.time * 1000,
        "accuracy": result.accuracy,
        "memory_usage_mb": result.memory / 1024 / 1024
    }, step=i)

logger.finish()
```

### Swarm Intelligence Monitoring

```python
from backend.app.integrations import WandBLogger
from backend.app.v5.swarm import MultiAgent

logger = WandBLogger(project="swarm-coordination")
swarm = MultiAgent(num_agents=10)

# Monitor swarm metrics
for iteration in range(100):
    swarm.step()
    
    logger.log_metrics({
        "consensus": swarm.get_consensus(),
        "active_agents": swarm.count_active(),
        "avg_response_time": swarm.avg_response_time(),
        "coordination_score": swarm.coordination_score()
    }, step=iteration)

logger.finish()
```

### Hyperparameter Sweeps

```python
import wandb

# Define sweep configuration
sweep_config = {
    "method": "bayes",
    "metric": {
        "name": "accuracy",
        "goal": "maximize"
    },
    "parameters": {
        "learning_rate": {
            "min": 0.0001,
            "max": 0.1
        },
        "batch_size": {
            "values": [16, 32, 64, 128]
        }
    }
}

# Create sweep
sweep_id = wandb.sweep(sweep_config, project="frasberg-optimization")

# Run sweep
def train():
    logger = WandBLogger(project="frasberg-optimization")
    config = logger.run.config
    
    # Train with config
    accuracy = train_model(config)
    
    logger.log_metrics({"accuracy": accuracy})
    logger.finish()

wandb.agent(sweep_id, function=train, count=50)
```

## API Reference

### `WandBLogger`

#### `__init__(project, entity, name, config, **kwargs)`

Initialize W&B logger.

**Parameters:**
- `project` (str): W&B project name
- `entity` (str, optional): Team/user name
- `name` (str, optional): Run name
- `config` (dict, optional): Configuration to track
- `**kwargs`: Additional wandb.init() arguments

#### `log_metrics(metrics, step)`

Log metrics to W&B.

**Parameters:**
- `metrics` (dict): Metric name -> value mapping
- `step` (int, optional): Step/iteration number

#### `log_model(model, name, metadata)`

Log model artifact.

**Parameters:**
- `model`: Model object
- `name` (str): Artifact name
- `metadata` (dict, optional): Model metadata

#### `finish()`

Finish the W&B run.

## Best Practices

### 1. Organize Experiments

```python
# Use descriptive project names
logger = WandBLogger(
    project="frasberg-dna-compute-optimization",
    name=f"experiment-{timestamp}"
)
```

### 2. Log Comprehensive Metrics

```python
logger.log_metrics({
    # Performance metrics
    "accuracy": 0.95,
    "loss": 0.05,
    
    # System metrics
    "memory_mb": memory_usage,
    "cpu_percent": cpu_usage,
    
    # Custom metrics
    "dna_compute_efficiency": efficiency
})
```

### 3. Track Hyperparameters

```python
logger = WandBLogger(
    project="frasberg-experiments",
    config={
        "model_version": "6.5.0",
        "learning_rate": 0.001,
        "optimizer": "adam",
        "dataset": "frasberg-v2"
    }
)
```

## Visualization

W&B automatically creates visualizations for:

- Metric trends over time
- Hyperparameter importance
- Model performance comparisons
- System resource usage
- Custom charts and reports

Access your results at: https://wandb.ai/your-team/your-project

## Troubleshooting

### Authentication Issues

```bash
# Re-login to W&B
wandb login

# Or set API key
export WANDB_API_KEY=your_key_here
```

### Offline Mode

```python
import os
os.environ["WANDB_MODE"] = "offline"

logger = WandBLogger(project="frasberg-experiments")
```

### Disable Logging

```python
import os
os.environ["WANDB_MODE"] = "disabled"
```

## Examples

### Complete Training Loop

```python
from backend.app.integrations import WandBLogger

# Initialize
config = {
    "learning_rate": 0.001,
    "batch_size": 32,
    "epochs": 10
}

logger = WandBLogger(
    project="frasberg-training",
    name="neural-dna-v1",
    config=config
)

# Training loop
for epoch in range(config["epochs"]):
    train_loss = train_epoch()
    val_loss = validate()
    
    logger.log_metrics({
        "train_loss": train_loss,
        "val_loss": val_loss,
        "epoch": epoch
    }, step=epoch)

# Save model
logger.log_model(model, "final-model")
logger.finish()
```

## Learn More

- [Weights & Biases Documentation](https://docs.wandb.ai/)
- [Frasberg AI Integration Guide](../README.md)
- [Experiment Tracking Best Practices](https://docs.wandb.ai/guides/track)
