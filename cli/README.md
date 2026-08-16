# Frasberg CLI

Command-line interface for Frasberg v5.0.0.

## Installation

```bash
pip install frasberg-cli
```

Or from source:

```bash
cd cli
pip install -e .
```

## Usage

```bash
# Check health
frasberg health

# Get system status
frasberg status

# List services
frasberg services

# Generate speech
frasberg speak "Hello world" --language en --emotion warm

# Generate AI response
frasberg generate "Explain quantum computing" --provider anthropic

# Get mesh topology
frasberg mesh

# Get metrics
frasberg metrics
```

## Commands

- **health** - Check system health
- **status** - Get detailed system status
- **services** - List all services
- **speak** - Text-to-speech synthesis
- **generate** - AI text generation
- **mesh** - Mesh network topology
- **metrics** - System metrics

## Configuration

Set base URL:

```bash
export FRASBERG_BASE_URL=http://localhost:8000
```

## Requirements

- Python 3.11+
- Frasberg v5.0.0 running

## License

MIT License
