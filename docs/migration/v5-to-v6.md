# Migration Guide: Frasberg v5 to v6

## Overview

This guide helps you migrate from Frasberg 5.x to 6.0.0. The new version includes breaking changes, new features, and performance improvements.

## Breaking Changes

### 1. Python Version Requirement

**v5.x:** Python 3.9, 3.10, 3.11
**v6.0.0:** Python 3.11+ only

**Action Required:**
```bash
# Check your Python version
python --version

# Upgrade if necessary (Ubuntu/Debian)
sudo apt update
sudo apt install python3.11

# Or use pyenv
pyenv install 3.11
pyenv global 3.11
```

### 2. API Endpoint Restructuring

**v5.x:** `/v1/` endpoints
**v6.0.0:** `/v2/` endpoints

**Changes:**
```python
# OLD (v5.x)
client = FrasbergClient(base_url="https://api.frasberg.io/v1")
client.dna_compute(...)

# NEW (v6.0.0)
client = FrasbergClient(base_url="https://api.frasberg.io/v2")
client.dna_compute(...)  # Same method, different endpoint
```

The client automatically uses v2 endpoints in 6.0.0. If you explicitly set URLs, update them:

```python
# Update explicit URLs
OLD: "https://api.frasberg.io/v1/dna/compute"
NEW: "https://api.frasberg.io/v2/dna/compute"
```

### 3. Authentication System

**v5.x:** Simple API key authentication
**v6.0.0:** RBAC-based authentication with JWT

**Migration:**

```python
# OLD (v5.x)
client = FrasbergClient(api_key="your-api-key")

# NEW (v6.0.0) - API keys still work for backwards compatibility
client = FrasbergClient(api_key="your-api-key")

# NEW (v6.0.0) - Recommended: JWT authentication
from frasberg.auth import JWTManager

jwt_manager = JWTManager()
access_token = jwt_manager.create_access_token(user_id="your-user-id")

client = FrasbergClient(access_token=access_token)
```

**Setup RBAC:**

```bash
# Create roles
frasberg-cli rbac create-role data_scientist \
  --permissions "dna.compute.*" "swarm.*" "temporal.*"

# Assign role to user
frasberg-cli rbac assign-role user@company.com data_scientist
```

### 4. Configuration File Format

**v5.x:** YAML/JSON format
**v6.0.0:** Enhanced format with additional fields

**Old config (v5.x):**
```yaml
# config_v5.yaml
api:
  host: localhost
  port: 8000
database:
  url: postgresql://localhost/frasberg
redis:
  url: redis://localhost:6379
```

**New config (v6.0.0):**
```yaml
# config_v6.yaml
api:
  host: localhost
  port: 8000
  version: v2  # NEW

security:  # NEW
  rbac_enabled: true
  rate_limiting: true
  audit_logging: true

observability:  # NEW
  telemetry_enabled: true
  telemetry_exporter: jaeger
  metrics_port: 9090

database:
  url: postgresql://localhost/frasberg
  sharding: false  # NEW
  connection_pool_size: 100  # NEW

redis:
  url: redis://localhost:6379
  cluster: false  # NEW
```

**Auto-migration:**
```bash
# Migrate config automatically
frasberg-cli config migrate --from config_v5.yaml --to config_v6.yaml
```

## Automated Migration

The easiest way to migrate is using the CLI tool:

```bash
# Install Frasberg 6.0.0
pip install --upgrade frasberg==6.0.0

# Run migration tool
frasberg-cli migrate --from=5.x --to=6.0.0

# Follow the interactive prompts
```

The migration tool will:
1. Check your Python version
2. Update configuration files
3. Migrate database schema
4. Update API endpoints
5. Setup RBAC (optional)
6. Configure observability (optional)

## Manual Migration Steps

### Step 1: Update Dependencies

```bash
# Update Frasberg
pip install --upgrade frasberg==6.0.0

# Update related packages
pip install --upgrade frasberg-cli==6.0.0
pip install --upgrade frasberg-sdk==6.0.0

# Install enterprise features (optional)
pip install frasberg[enterprise]==6.0.0
```

### Step 2: Update Configuration

```bash
# Backup old config
cp frasberg_config.yaml frasberg_config_v5_backup.yaml

# Generate new config
frasberg-cli config generate --version 6.0.0 > frasberg_config.yaml

# Edit and customize as needed
nano frasberg_config.yaml
```

### Step 3: Database Migration

```bash
# Backup database
pg_dump frasberg > frasberg_backup.sql

# Run migrations
frasberg-cli db migrate --from 5.x --to 6.0.0

# Verify migration
frasberg-cli db verify
```

### Step 4: Update Application Code

**Import changes:**
```python
# OLD (v5.x)
from frasberg import FrasbergClient

# NEW (v6.0.0) - Same, but with new features available
from frasberg import FrasbergClient
from frasberg.security import RBACManager  # NEW
from frasberg.observability import Telemetry  # NEW
from frasberg.hybrid import NeuralDNAHybrid  # NEW
```

**Client initialization:**
```python
# OLD (v5.x)
client = FrasbergClient(api_key="your-key")

# NEW (v6.0.0) - Backwards compatible
client = FrasbergClient(api_key="your-key")

# NEW (v6.0.0) - With new features
client = FrasbergClient(
    api_key="your-key",
    enable_telemetry=True,
    enable_rate_limiting=True
)
```

### Step 5: Update Tests

```python
# Update test imports
from frasberg.testing import TestClient  # NEW in v6

# Update test client
class TestFrasbergCore:
    def setup_method(self):
        self.client = TestClient()  # Uses v2 API
    
    def test_dna_compute(self):
        result = self.client.dna_compute(sequence="ATCG")
        assert result is not None
```

### Step 6: Update Deployment

**Docker:**
```dockerfile
# OLD (v5.x)
FROM emeraldorbit/frasberg:5.0.0

# NEW (v6.0.0)
FROM emeraldorbit/frasberg:6.0.0
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  frasberg:
    image: emeraldorbit/frasberg:6.0.0  # Updated
    environment:
      - FRASBERG_VERSION=6.0.0  # NEW
      - RBAC_ENABLED=true  # NEW
      - TELEMETRY_ENABLED=true  # NEW
    ports:
      - "8000:8000"
      - "9090:9090"  # NEW: Prometheus metrics
```

**Kubernetes:**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frasberg
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: frasberg
        image: emeraldorbit/frasberg:6.0.0  # Updated
        env:
        - name: FRASBERG_VERSION
          value: "6.0.0"
        - name: RBAC_ENABLED
          value: "true"
```

## Feature Adoption Guide

### Adopting Enterprise Features

```python
# Enable RBAC
from frasberg.security import RBACManager

rbac = RBACManager()
rbac.create_role("data_scientist", permissions=["dna.compute.*", "swarm.*"])
rbac.assign_role("user@company.com", "data_scientist")

# Enable observability
from frasberg.observability import Telemetry

telemetry = Telemetry()
telemetry.configure(exporter="jaeger", endpoint="http://jaeger:14268")

# Enable rate limiting
from frasberg.middleware import RateLimiter

limiter = RateLimiter(requests_per_minute=100)
```

### Adopting Advanced AI Features

```python
# Try Neural-DNA Hybrid
from frasberg.hybrid import NeuralDNAHybrid

hybrid = NeuralDNAHybrid(neural_layers=[256, 512, 256])
hybrid.train(dataset=training_data, epochs=100)

# Try federated learning
from frasberg.federated import FederatedLearning

federated = FederatedLearning(nodes=["node1", "node2", "node3"])
federated.train(model=base_model)
```

### Adopting Ecosystem Integrations

```python
# LangChain integration
from langchain.agents import FrasbergCoreAgent

agent = FrasbergCoreAgent(frasberg_client=client)

# LlamaIndex integration
from llama_index.retrievers import FrasbergCoreRetriever

retriever = FrasbergCoreRetriever(frasberg_client=client)
```

## Rollback Plan

If you encounter issues, you can roll back:

```bash
# Rollback Frasberg
pip install frasberg==5.0.0

# Restore database
psql frasberg < frasberg_backup.sql

# Restore config
cp frasberg_config_v5_backup.yaml frasberg_config.yaml

# Restart services
sudo systemctl restart frasberg
```

## Common Issues

### Issue 1: Python Version Mismatch

**Error:** `RuntimeError: Frasberg 6.0.0 requires Python 3.11+`

**Solution:**
```bash
# Upgrade Python
sudo apt install python3.11
# Or use pyenv
pyenv install 3.11
```

### Issue 2: API Endpoint Not Found

**Error:** `404 Not Found: /v1/dna/compute`

**Solution:**
```python
# Update client to use v2 endpoints
client = FrasbergClient(base_url="https://api.frasberg.io/v2")
```

### Issue 3: Authentication Failed

**Error:** `401 Unauthorized: Invalid API key`

**Solution:**
```bash
# Regenerate API key
frasberg-cli auth regenerate-key

# Or use JWT
frasberg-cli auth generate-jwt --user-id your-user-id
```

### Issue 4: Database Migration Failed

**Error:** `Database schema mismatch`

**Solution:**
```bash
# Run migration manually
frasberg-cli db migrate --from 5.x --to 6.0.0 --force

# Or restore and retry
psql frasberg < frasberg_backup.sql
frasberg-cli db migrate --from 5.x --to 6.0.0
```

## Testing Checklist

After migration, verify:

- [ ] Application starts successfully
- [ ] API endpoints respond correctly
- [ ] Database queries work as expected
- [ ] Authentication/authorization functions properly
- [ ] Telemetry data is being collected (if enabled)
- [ ] Metrics are being exported (if enabled)
- [ ] All tests pass
- [ ] Performance is acceptable
- [ ] No errors in logs

## Performance Improvements

You should see these improvements after migration:

- **DNA Compute:** 10× faster
- **Memory Usage:** 50% reduction
- **API Response Time:** 30% faster
- **Database Queries:** 5× faster with sharding
- **Swarm Coordination:** 3× improvement

Run benchmarks to verify:

```bash
frasberg-cli benchmark --compare-with 5.0.0
```

## Support

If you need help with migration:

- **Documentation:** https://docs.frasberg.io/migration/v5-to-v6
- **Discord:** https://discord.gg/frasberg
- **GitHub Issues:** https://github.com/emeraldorbit/frasberg-backend/issues
- **Email:** support@frasberg.io
- **Enterprise Support:** enterprise@frasberg.io

## Next Steps

After successful migration:

1. [Explore Enterprise Features](../enterprise/README.md)
2. [Try Advanced AI Features](../advanced-ai/README.md)
3. [Setup Integrations](../integrations/README.md)
4. [Optimize Performance](../guides/performance-tuning.md)
5. [Join the Community](https://discord.gg/frasberg)

---

**Migration completed?** Share your experience in our [Discord community](https://discord.gg/frasberg)!
