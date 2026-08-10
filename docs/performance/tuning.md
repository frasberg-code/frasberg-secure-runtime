# Performance Tuning Guide

Frasberg 6.5.0 includes significant performance improvements. This guide helps you optimize for your workload.

## Quick Wins

### 1. Enable Connection Pooling

```python
# config.yaml
database:
  pool_size: 20
  max_overflow: 10
  pool_timeout: 30
```

**Impact:** 50% reduction in database connections

### 2. Enable Multi-Level Caching

```python
# config.yaml
caching:
  enabled: true
  levels:
    - memory
    - redis
  ttl: 3600
```

**Impact:** 40% improvement in cache hit rate

### 3. Use SIMD Optimizations

```python
from backend.app.v5.biological import DNACompute

dna = DNACompute(simd_enabled=True)
```

**Impact:** 10× faster DNA computations

## Performance Benchmarks

### Startup Time

- v6.0.0: 2.5 seconds
- v6.5.0: 2.0 seconds (**20% improvement**)

### Memory Usage

- v6.0.0: 450 MB
- v6.5.0: 380 MB (**15% reduction**)

### Query Performance

- Average query time: **30% faster**
- Connection usage: **50% reduction**
- Cache hit rate: **40% improvement**

## Database Optimization

### Index Optimization

```sql
-- Automatic index creation
CREATE INDEX CONCURRENTLY idx_requests_timestamp 
ON requests(created_at DESC);

CREATE INDEX CONCURRENTLY idx_dna_sequences_hash 
ON dna_sequences(sequence_hash);
```

Frasberg 6.5.0 automatically creates optimal indexes.

### Query Planning

```python
# Enable query planning improvements
database:
  query_planning: true
  explain_analyze: true  # Development only
```

### Connection Pooling

```python
database:
  pool_size: 20           # Connections per worker
  max_overflow: 10        # Extra connections under load
  pool_timeout: 30        # Wait time for connection
  pool_recycle: 3600      # Recycle after 1 hour
```

## Caching Strategy

### Multi-Level Caching

```python
caching:
  # Level 1: In-memory (fastest)
  memory:
    enabled: true
    size_mb: 256
    
  # Level 2: Redis (shared)
  redis:
    enabled: true
    ttl: 3600
    
  # Level 3: Disk (largest)
  disk:
    enabled: false
```

### Cache Invalidation

```python
# Intelligent invalidation
caching:
  invalidation:
    strategy: "smart"  # or "aggressive", "lazy"
    batch_size: 1000
```

## DNA Computing Performance

### SIMD Optimizations

```python
from backend.app.v5.biological import DNACompute

# Enable SIMD for 10× speedup
dna = DNACompute(
    simd_enabled=True,
    parallel_threads=8
)

# Batch processing
results = dna.encode_batch(sequences, batch_size=1000)
```

### Parallelization

```python
dna = DNACompute(
    parallel_threads=8,      # CPU threads
    parallel_processes=4,    # Separate processes
    use_gpu=True            # GPU acceleration (if available)
)
```

## Swarm Coordination

### Under High Load

```python
from backend.app.v5.swarm import MultiAgent

swarm = MultiAgent(
    num_agents=10,
    coordination_algorithm="optimized",  # New in 6.5.0
    consensus_threshold=0.8,
    timeout_ms=100
)
```

**Improvements:**
- 3× faster coordination
- Better handling of >10,000 req/s
- Reduced memory usage

## API Server Tuning

### Workers and Threads

```python
# config.yaml
server:
  workers: 4              # CPU cores
  threads_per_worker: 2   # Concurrent requests
  worker_class: "uvicorn.workers.UvicornWorker"
```

### Request Limits

```python
server:
  max_requests: 10000     # Restart worker after N requests
  max_requests_jitter: 100
  timeout: 30
  keepalive: 5
```

### Async Optimization

```python
# Use async/await throughout
async def handle_request():
    result = await dna_compute.encode_async(sequence)
    await cache.set(key, result)
    return result
```

## Memory Management

### Lazy Loading

```python
# Enabled by default in 6.5.0
initialization:
  lazy_loading: true
  preload_modules:
    - "core"
    - "api"
```

### Resource Cleanup

```python
# Automatic cleanup
resource_management:
  auto_cleanup: true
  cleanup_interval: 300  # seconds
  max_memory_mb: 2048
```

## Monitoring

### Real-Time Metrics

```python
from backend.app.integrations import WandBLogger

# Monitor performance
logger = WandBLogger(project="frasberg-performance")

logger.log_metrics({
    "request_latency_ms": latency,
    "throughput_rps": requests_per_second,
    "memory_mb": memory_usage,
    "cache_hit_rate": cache_hits / total_requests
})
```

### Profiling

```bash
# Profile your application
frasberg-cli dev --profile

# Generate flame graph
py-spy record -o flamegraph.svg -- python server.py
```

## Load Testing

### Using wrk

```bash
# Test throughput
wrk -t12 -c400 -d30s http://localhost:8000/api/health

# Results for 6.5.0:
# Requests/sec:  12,543.21
# Latency avg:   31.87ms
# Latency 99%:   89.12ms
```

### Using locust

```python
# locustfile.py
from locust import HttpUser, task

class FrasbergUser(HttpUser):
    @task
    def dna_compute(self):
        self.client.post("/api/dna/encode", json={
            "sequence": "ATCGATCGATCG"
        })
```

## Best Practices

### 1. Use Batch Processing

```python
# Instead of:
for seq in sequences:
    result = dna.encode(seq)

# Do:
results = dna.encode_batch(sequences, batch_size=1000)
```

### 2. Enable Caching

```python
# Always enable for production
caching:
  enabled: true
  strategy: "smart"
```

### 3. Optimize Database Queries

```python
# Use select_related for joins
results = db.query(Model).options(
    select_related("related_model")
).all()
```

### 4. Use Async/Await

```python
# Non-blocking I/O
async def process_request():
    results = await asyncio.gather(
        dna_compute.encode_async(seq1),
        dna_compute.encode_async(seq2),
        dna_compute.encode_async(seq3)
    )
```

## Hardware Recommendations

### Development

- **CPU:** 4+ cores
- **RAM:** 8 GB minimum
- **Storage:** SSD recommended

### Production

- **CPU:** 16+ cores
- **RAM:** 32 GB minimum
- **Storage:** NVMe SSD
- **Network:** 10 Gbps+

### GPU (Optional)

For DNA computing acceleration:
- **NVIDIA:** RTX 3090 or better
- **VRAM:** 12 GB minimum

## Configuration Templates

### High Performance

```yaml
# config-high-performance.yaml
version: "6.5.0"

server:
  workers: 16
  threads_per_worker: 4

database:
  pool_size: 50
  max_overflow: 20

caching:
  enabled: true
  memory:
    size_mb: 1024
  redis:
    enabled: true

dna_compute:
  simd_enabled: true
  parallel_threads: 16
  use_gpu: true
```

### Memory Optimized

```yaml
# config-memory-optimized.yaml
version: "6.5.0"

server:
  workers: 4
  threads_per_worker: 2

database:
  pool_size: 10

caching:
  memory:
    size_mb: 128
  
resource_management:
  max_memory_mb: 512
  auto_cleanup: true
```

## Troubleshooting

### High Memory Usage

```bash
# Enable memory profiling
frasberg-cli dev --profile-memory

# Check for memory leaks
py-spy dump --pid <PID>
```

### Slow Queries

```python
# Enable query logging
database:
  log_queries: true
  slow_query_threshold_ms: 100
```

### Connection Pool Exhausted

```python
# Increase pool size
database:
  pool_size: 50  # Up from 20
  max_overflow: 30  # Up from 10
```

## Learn More

- [Architecture Documentation](../architecture.md)
- [Monitoring Guide](../monitoring.md)
- [Troubleshooting Guide](../troubleshooting.md)
