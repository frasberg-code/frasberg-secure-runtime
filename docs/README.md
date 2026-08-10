# Frasberg AI v6.5.0 - Documentation Index

## 🚀 Quick Links
- **Quick Start**: Get running in 5 minutes
- **API Reference**: Complete endpoint documentation
- **System Architecture**: Understanding Frasberg AI's design

## 📖 Getting Started

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM (16GB recommended)
- 10GB free disk space

### Quick Start (5 Minutes)

```bash
# Download v6.5.0
wget https://github.com/frasberg/frasberg-ai/releases/download/v6.5.0/frasberg-ai-v6.5.0-stable.zip
unzip frasberg-ai-v6.5.0-stable.zip
cd frasberg-ai-v6.5.0-stable

# One-command setup
./quick-start.sh

# Access services
open http://localhost:8000/docs  # Interactive API docs
open http://localhost:3000       # Admin dashboard
API Documentation
Interactive Swagger UI
Complete endpoint reference (80+ endpoints)
Request/response examples
Error code documentation
Available at: http://localhost:8000/docs

Health & Monitoring Endpoints
Health
bash

GET /health - Basic health check
GET /health/live - Kubernetes liveness probe
GET /health/ready - Readiness probe with dependency checks
GET /health/detailed - Complete system metrics
Metrics
bash

GET /metrics - Request counts, errors, response times
System Architecture
45-Layer Sovereign Architecture
Layers 1-10: Internal formation (core engine, memory, context)
Layers 11-45: External manifestation (APIs, services, interfaces)
Service Topology
Code
┌─────────────────────────────────────┐
│    Canonical Core (Port 8000)      │
│  • AI Orchestration (5 LLMs)       │
│  • Voice System (11 languages)     │
│  • Quantum Cryptography            │
│  • Distributed Mesh                │
└─────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
 ┌────▼────┐      ┌────▼────┐
 │  Forks  │      │  Infra  │
 │ (7 svcs)│      │ (2 svcs)│
 └─────────┘      └─────────┘
Technology Stack
Backend: FastAPI (Python 3.11+)
Containerization: Docker & Docker Compose
Cryptography: Post-quantum (CRYSTALS-Kyber, Dilithium)
AI: Multi-provider LLM integration
Voice: TTS/STT (11 languages)
Testing: pytest with 70%+ coverage
Troubleshooting
Common Issues
Service Won't Start

Check logs: docker logs frasberg_canonical_core
Verify ports: lsof -i :8000
Check resources: docker system df
Health Check Failing

GET /health/detailed for full diagnostics
Verify dependencies are running
Check system resources (CPU, memory)
High Memory Usage

GET /metrics to see request patterns
Restart: docker-compose restart
Increase Docker memory limits
API Timeouts

Check circuit breaker status in logs
Verify mesh health: GET /api/v4/mesh/topology
Review /metrics for bottlenecks
Getting Help
Logs: docker logs <container_name>
Health: GET /health/detailed
Metrics: GET /metrics
GitHub Issues: Report bugs or request features
Contributing
We welcome contributions! See CONTRIBUTING.md for:

Development setup instructions
Code style guidelines
Testing requirements
Pull request process
Version History
v6.5.0 (2026-05-22) - Frasberg rebranding
v6.0.0 (2026-02-08) - Distributed quantum-ready
v5.0.0 (2026-02-08) - Autonomous intelligence
v4.0.0 (2026-02-08) - Voice & governance
v3.0.0 (2026-02-08) - Initial release
License
UNLICENSED - Proprietary. See LICENSE for details

Support
GitHub Issues: https://github.com/frasberg/frasberg-ai/issues
Discussions: https://github.com/frasberg/frasberg-ai/discussions
Frasberg AI v6.5.0 - Stable. Tested. Documented.

**Creator:** Frasberg Selassie — Mr. Clayton-M. Bernard-Ex.
