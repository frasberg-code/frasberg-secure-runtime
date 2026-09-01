# Frasberg Engine v2 Production Readiness Checklist

Use this checklist before deploying to production.

---

## API Layer (15 items)
- [ ] JWT auth enabled and tested
- [ ] API keys hashed with SHA-256
- [ ] Rate limiting configured (60 tasks/min, 10 concurrent)
- [ ] Request validation enabled (Zod schemas)
- [ ] CORS configured correctly
- [ ] Error responses standardized
- [ ] Logging enabled for all endpoints
- [ ] Metrics exported to Prometheus
- [ ] OpenTelemetry traces enabled
- [ ] Health check endpoint responding
- [ ] API Gateway (WAF) enabled
- [ ] SSL/TLS enforced (HTTPS only)
- [ ] API documentation (OpenAPI) generated
- [ ] Load tested (1k concurrent requests)
- [ ] Security audit passed

## Scheduler (12 items)
- [ ] Task dequeue logic implemented
- [ ] GPU selection algorithm tested
- [ ] Failover routing working
- [ ] Autoscaler thresholds validated
- [ ] Queue depth alerts configured
- [ ] Scheduler logs enabled
- [ ] Event emission working
- [ ] Worker dispatch timeout configured
- [ ] Retry logic implemented
- [ ] Metrics exported
- [ ] Load tested (10k queued tasks)
- [ ] Multi-region routing tested

## GPU Workers (15 items)
- [ ] CUDA 12+ installed and verified
- [ ] NVENC enabled
- [ ] FFmpeg with hardware encoding installed
- [ ] Model weights downloaded and verified (SHA-256)
- [ ] Inference latency benchmarked
- [ ] GPU memory usage monitored
- [ ] Encoder failure handling tested
- [ ] OOM recovery tested
- [ ] Worker heartbeat enabled
- [ ] Error handling complete
- [ ] Logging enabled (JSON format)
- [ ] Metrics exported
- [ ] Container image built and tested
- [ ] Autoscaling rollout procedures documented
- [ ] Graceful shutdown on termination

## Storage (12 items)
- [ ] Object storage initialized (R2/S3/MinIO)
- [ ] Cross-region replication enabled
- [ ] Bucket lifecycle policies configured
- [ ] CDN caching rules validated
- [ ] Signed URLs working
- [ ] Cache invalidation tested
- [ ] Storage metrics exported
- [ ] Backup procedures documented
- [ ] Recovery procedures tested
- [ ] Access logging enabled
- [ ] Encryption at rest enabled
- [ ] Replication lag < 5 minutes

## Database (15 items)
- [ ] PostgreSQL installed (multi-region)
- [ ] Schema initialized (schema.sql applied)
- [ ] Replication configured
- [ ] Backups scheduled (daily + WAL archiving)
- [ ] Restore procedures tested
- [ ] Connection pooling configured
- [ ] Query performance validated
- [ ] Indexes created for:
  - [ ] video_tasks (status, model, region)
  - [ ] video_task_events (task_id, created_at)
  - [ ] billing_events (user_id, created_at)
  - [ ] webhook_events (status, next_retry_at)
- [ ] Encryption at rest enabled
- [ ] Encryption in transit (TLS)
- [ ] Backups verified (test restore)
- [ ] Monitoring + alerting configured

## Networking (10 items)
- [ ] Global load balancer configured
- [ ] DNS configured (video.frasberg.com)
- [ ] Health check endpoints responding
- [ ] Regional failover tested
- [ ] BGP routing configured
- [ ] DDoS protection enabled
- [ ] WAF rules configured
- [ ] TLS certificates installed
- [ ] Network monitoring enabled
- [ ] Latency optimized (geo-routing)

## Observability (15 items)
- [ ] Prometheus scraping configured
- [ ] All metrics exported:
  - [ ] tasks_created
  - [ ] tasks_completed
  - [ ] tasks_failed
  - [ ] queue_depth
  - [ ] gpu_utilization
  - [ ] latency (p50, p95, p99)
- [ ] Grafana dashboards created:
  - [ ] Global overview
  - [ ] Region health
  - [ ] GPU cluster
  - [ ] Scheduler
  - [ ] Storage/CDN
  - [ ] Webhooks
  - [ ] Billing
- [ ] OpenTelemetry tracing configured
- [ ] Log aggregation enabled (ELK/Loki)
- [ ] Log retention configured (90 days min)
- [ ] Distributed tracing working

## Billing (10 items)
- [ ] Credits metering enabled
- [ ] Billing rates configured
- [ ] Credit calculation tested
- [ ] Refund logic implemented
- [ ] Billing ledger schema verified
- [ ] Billing events flowing
- [ ] Monthly invoice generation tested
- [ ] Billing alerts configured
- [ ] Audit logs enabled
- [ ] Rate limit enforcement working

## Security (15 items)
- [ ] JWT signing keys generated and stored in KMS
- [ ] API key hashing implemented
- [ ] Secrets rotation schedule enabled
- [ ] RBAC implemented:
  - [ ] user role
  - [ ] admin role
  - [ ] superadmin role
- [ ] Admin API requires IP allowlist
- [ ] mTLS enabled (enterprise)
- [ ] Audit logs for all mutations
- [ ] Input sanitization tested
- [ ] Prompt injection filtering
- [ ] Webhook signature verification
- [ ] Rate limiting anti-abuse
- [ ] Network segmentation (private subnets for GPUs)
- [ ] Security group rules validated
- [ ] Penetration test passed
- [ ] Security audit passed

## Compliance (12 items)
- [ ] SOC 2 Type II audit scheduled
- [ ] ISO 27001 controls implemented
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] Data residency enforced (EU → eu-west)
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Data processing addendum (DPA) signed
- [ ] Master services agreement (MSA) prepared
- [ ] Encryption at rest + transit
- [ ] Audit log retention (1 year min)
- [ ] Compliance audit scheduled

## Disaster Recovery (12 items)
- [ ] RPO/RTO targets defined
- [ ] Backup procedures documented
- [ ] Backup verification scheduled
- [ ] Recovery procedures tested
- [ ] Region failover drill completed
- [ ] Database failover drill completed
- [ ] Storage failover drill completed
- [ ] Runbooks documented for:
  - [ ] Region outage
  - [ ] GPU cluster failure
  - [ ] Storage outage
  - [ ] Database outage
- [ ] Incident response team identified
- [ ] On-call rotation scheduled
- [ ] Postmortem process defined

## Testing (15 items)
- [ ] Unit tests for API handlers
- [ ] Unit tests for scheduler logic
- [ ] Unit tests for GPU worker
- [ ] Integration tests for full flow
- [ ] Load test (1k concurrent requests)
- [ ] Stress test (GPU saturation)
- [ ] Failover test (region outage simulation)
- [ ] Storage replication test
- [ ] Webhook retry test
- [ ] Rate limiting test
- [ ] Security scan (SAST)
- [ ] Dependency scanning
- [ ] Container image scanning
- [ ] Performance benchmarks
- [ ] End-to-end test in staging

## Documentation (10 items)
- [ ] Architecture documented
- [ ] API reference (OpenAPI) generated
- [ ] Database schema documented
- [ ] Deployment procedures documented
- [ ] SRE handbook updated
- [ ] Runbooks written and tested
- [ ] Troubleshooting guide written
- [ ] Configuration documented
- [ ] Contributing guidelines updated
- [ ] Changelog updated

## Pre-Launch Review (8 items)
- [ ] CTO approval
- [ ] SRE lead approval
- [ ] Infra lead approval
- [ ] Security lead approval
- [ ] Finance approval (billing engine)
- [ ] Legal approval (compliance)
- [ ] All checklists above: 100% checked
- [ ] No known critical/high severity issues

---

## Sign-Off

Once all items are checked, get sign-offs from:

- [ ] **CTO**: Architecture and strategy
- [ ] **SRE Lead**: Operations and reliability
- [ ] **Infra Lead**: Infrastructure and deployment
- [ ] **Security Lead**: Security and compliance

**Signed by**: _________________________ **Date**: _____________

---

Ready to deploy! 🚀
