# Troubleshooting Guide

Common issues and solutions for Frasberg AI 6.5.0.

## Quick Diagnostics

Run the health check:

```bash
frasberg-cli test --health-check
```

## Common Issues

### Installation Issues

#### Package Not Found

**Problem:**
```bash
pip install frasberg-ai==6.5.0
ERROR: Could not find a version that satisfies the requirement frasberg-ai==6.5.0
```

**Solution:**
```bash
# Update pip
pip install --upgrade pip

# Try again
pip install frasberg-ai==6.5.0

# Or install from source
git clone https://github.com/emeraldorbit/frasberg-ai-backend.git
cd frasberg-ai-backend
pip install -e .
```

#### Dependency Conflicts

**Problem:**
```
ERROR: incompatible version of transformers
```

**Solution:**
```bash
# Create fresh environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install Frasberg AI
pip install frasberg-ai==6.5.0

# Install optional dependencies
pip install transformers torch wandb mlflow
```

### Configuration Issues

#### Invalid Configuration

**Problem:**
```
ConfigError: Invalid port number
```

**Solution:**
```bash
# Validate configuration
frasberg-cli config validate

# Fix automatically
frasberg-cli interactive --auto-migrate

# Or edit manually
frasberg-cli config edit
```

#### Missing API Keys

**Problem:**
```
WARNING: OpenAI API key not set
```

**Solution:**
```bash
# Set in environment
export OPENAI_API_KEY=sk-...

# Or in .env file
echo "OPENAI_API_KEY=sk-..." >> .env

# Or in config
frasberg-cli config edit
```

### Database Issues

#### Connection Failed

**Problem:**
```
DatabaseError: could not connect to server
```

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Verify connection string
psql "postgresql://localhost/frasberg"

# Update configuration
frasberg-cli config edit
# Change database.url to correct value
```

#### Migration Failed

**Problem:**
```
MigrationError: migration 001 failed
```

**Solution:**
```bash
# Reset database (WARNING: deletes data)
frasberg-cli db reset

# Or fix manually
frasberg-cli db migrate --fix

# Check migration status
frasberg-cli db status
```

#### Pool Exhausted

**Problem:**
```
DatabaseError: QueuePool limit exceeded
```

**Solution:**
```yaml
# Increase pool size in config.yaml
database:
  pool_size: 50       # Up from 20
  max_overflow: 30    # Up from 10
  pool_timeout: 60    # Up from 30
```

### Integration Issues

#### Hugging Face Model Not Found

**Problem:**
```
HuggingFaceError: model 'gpt2' not found
```

**Solution:**
```python
# Check internet connection
import requests
requests.get("https://huggingface.co")

# Try downloading manually
from transformers import AutoModel
AutoModel.from_pretrained("gpt2")

# Use local cache
model = HuggingFaceTransformer(
    "gpt2",
    local_files_only=True
)
```

#### W&B Login Failed

**Problem:**
```
WandBError: login required
```

**Solution:**
```bash
# Login to W&B
wandb login

# Or set API key
export WANDB_API_KEY=your_key

# Or disable W&B
export WANDB_MODE=disabled
```

#### MLflow Connection Failed

**Problem:**
```
MLflowError: could not connect to tracking server
```

**Solution:**
```bash
# Start MLflow server
mlflow server --port 5000

# Or use local storage
export MLFLOW_TRACKING_URI=file:///path/to/mlruns

# Or disable MLflow
tracker = MLflowTracker(tracking_uri=None)
```

### Performance Issues

#### Slow Startup

**Problem:**
Server takes >5 seconds to start

**Solution:**
```yaml
# Enable lazy loading
initialization:
  lazy_loading: true
  preload_modules:
    - "core"
    - "api"
    
# Reduce workers
server:
  workers: 2  # Down from 4
```

#### High Memory Usage

**Problem:**
Memory usage >2 GB

**Solution:**
```yaml
# Reduce cache size
caching:
  memory:
    size_mb: 128  # Down from 256

# Enable cleanup
resource_management:
  max_memory_mb: 1024
  auto_cleanup: true
  cleanup_interval: 60
```

#### Slow Queries

**Problem:**
Database queries take >1 second

**Solution:**
```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_requests_timestamp 
ON requests(created_at DESC);

-- Analyze tables
ANALYZE requests;
ANALYZE dna_sequences;
```

```yaml
# Enable query optimization
database:
  query_planning: true
  pool_size: 20
```

### API Issues

#### 500 Internal Server Error

**Problem:**
```
500 Internal Server Error
```

**Solution:**
```bash
# Check logs
tail -f logs/frasberg-ai.log

# Enable debug mode
frasberg-cli dev --debug

# Test endpoint
curl -v http://localhost:8000/api/health
```

#### Rate Limited

**Problem:**
```
429 Too Many Requests
```

**Solution:**
```yaml
# Increase rate limits
rate_limiting:
  enabled: true
  requests_per_minute: 1000  # Up from 100
  burst: 2000
```

#### CORS Errors

**Problem:**
```
Access-Control-Allow-Origin header missing
```

**Solution:**
```yaml
# Configure CORS
cors:
  enabled: true
  origins:
    - "http://localhost:3000"
    - "https://yourdomain.com"
  methods: ["GET", "POST", "PUT", "DELETE"]
```

### DNA Computing Issues

#### SIMD Not Available

**Problem:**
```
WARNING: SIMD optimizations not available
```

**Solution:**
```bash
# Install with SIMD support
pip install frasberg-ai[simd]

# Or compile from source
FRASBERG_ENABLE_SIMD=1 pip install -e .

# Check CPU support
lscpu | grep flags
```

#### GPU Not Detected

**Problem:**
```
WARNING: CUDA not available
```

**Solution:**
```bash
# Install CUDA toolkit
# Follow: https://developer.nvidia.com/cuda-downloads

# Install PyTorch with CUDA
pip install torch --index-url https://download.pytorch.org/whl/cu121

# Verify
python -c "import torch; print(torch.cuda.is_available())"
```

## Debugging Tools

### Enable Debug Logging

```bash
frasberg-cli dev --debug
```

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Profiling

```bash
# CPU profiling
py-spy record -o profile.svg -- python server.py

# Memory profiling
memory_profiler python server.py

# Built-in profiler
frasberg-cli dev --profile
```

### Health Checks

```bash
# Full health check
frasberg-cli test --health-check

# Test specific integration
frasberg-cli test --integration huggingface

# Test database
frasberg-cli db check

# Test Redis
redis-cli ping
```

## Error Messages

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 404 | Not Found | Check endpoint URL |
| 429 | Rate Limited | Reduce request rate |
| 500 | Server Error | Check logs |
| 503 | Service Unavailable | Wait and retry |

### Log Locations

```bash
# Default log location
logs/frasberg-ai.log

# System logs
journalctl -u frasberg-ai

# Docker logs
docker logs frasberg-ai
```

## Getting Help

### Check Documentation

- [API Reference](../api-reference.md)
- [Configuration Guide](../configuration.md)
- [Performance Tuning](../performance/tuning.md)

### Community Support

- **Discord:** https://discord.gg/frasberg-ai
- **GitHub Issues:** https://github.com/emeraldorbit/frasberg-ai-backend/issues
- **Email:** support@frasberg-ai.dev

### Report a Bug

```bash
# Generate diagnostic report
frasberg-cli diagnostics > report.txt

# Submit on GitHub with:
# 1. Error message
# 2. Steps to reproduce
# 3. Configuration (redact secrets)
# 4. Diagnostic report
```

## Best Practices

### 1. Always Validate Configuration

```bash
frasberg-cli config validate
```

### 2. Use Health Checks

```bash
# Before deployment
frasberg-cli test --health-check
```

### 3. Monitor Logs

```bash
# Watch logs in production
tail -f logs/frasberg-ai.log | grep ERROR
```

### 4. Regular Updates

```bash
# Check for updates
pip list --outdated | grep frasberg-ai

# Upgrade
pip install --upgrade frasberg-ai
```

### 5. Backup Configuration

```bash
# Backup config
cp config.yaml config.yaml.backup

# Export configuration
frasberg-cli config export > config-backup.yaml
```

## Emergency Recovery

### Reset to Defaults

```bash
# WARNING: This will delete all configuration
frasberg-cli config reset

# Re-run setup
frasberg-cli interactive
```

### Rollback Version

```bash
# Uninstall current version
pip uninstall frasberg-ai

# Install previous version
pip install frasberg-ai==6.0.0
```

### Database Recovery

```bash
# Backup database
pg_dump frasberg > backup.sql

# Restore from backup
psql frasberg < backup.sql
```

## Learn More

- [Configuration Reference](../configuration.md)
- [API Documentation](../api-reference.md)
- [Performance Guide](../performance/tuning.md)
- [Security Guide](../security.md)
