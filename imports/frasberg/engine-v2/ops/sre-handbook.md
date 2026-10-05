# Frasberg Engine v2 — SRE Handbook

## Mission

Keep Frasberg Engine v2:
- **Available** — meet SLA targets
- **Reliable** — low error rates
- **Performant** — meet latency SLOs
- **Observable** — clear signals and alerting
- **Recoverable** — tested DR procedures

---

## Daily Checklist

- [ ] Check region health dashboard
- [ ] Check GPU cluster health
- [ ] Monitor queue depth per region
- [ ] Monitor error rate
- [ ] Check storage replication status
- [ ] Check CDN propagation latency
- [ ] Review webhook DLQ size
- [ ] Review billing events for anomalies

---

## Weekly Checklist

- [ ] Rotate API keys
- [ ] Review autoscaler logs
- [ ] Review scheduler logs
- [ ] Review GPU worker logs
- [ ] Validate backups (DB + storage)
- [ ] Review incidents from past week
- [ ] Update runbooks based on learnings

---

## Monthly Checklist

- [ ] Full disaster recovery (DR) drill
- [ ] Full region failover drill
- [ ] Full storage failover drill
- [ ] Full database failover drill
- [ ] Penetration test (if applicable)
- [ ] Compliance audit
- [ ] Capacity planning review
- [ ] Performance benchmarking

---

## Severity Levels

| Severity | Description | Response Time | Escalation |
|----------|-------------|----------------|------------|
| **SEV-0** | Global outage, multi-region failure | Immediate | CTO + SRE Lead |
| **SEV-1** | Region outage, GPU cluster down | < 5 min | SRE Lead |
| **SEV-2** | Partial degradation | < 15 min | On-call SRE |
| **SEV-3** | Elevated error rate | < 30 min | On-call SRE |
| **SEV-4** | Minor issues | < 1 hour | On-call SRE |
| **SEV-5** | Informational | < 2 hours | On-call SRE |

---

## Core Dashboards

### Global Overview
- Overall availability percentage
- Error rate (last 1 hour)
- p95 / p99 latency
- Queue depth across regions
- Active task count

### Region Health
- Per-region availability
- Per-region error rate
- Per-region latency p95/p99
- GPU utilization per region
- Storage replication lag

### GPU Cluster
- GPU utilization by node
- Active tasks per node
- Worker heartbeats
- GPU memory usage
- Encoder failures

### Scheduler
- Tasks dequeued per minute
- Dispatch failures
- Requeue rate
- Autoscaler events

### Storage / CDN
- Upload latency (p50, p95, p99)
- Replication lag (per region)
- CDN cache hit rate
- CDN error rate

### Webhooks
- Webhook success rate
- Webhook retry rate
- DLQ size
- Webhook latency

### Billing
- Credits consumed (daily trend)
- Top tenants by usage
- Refund events
- Billing anomalies

---

## Alert Catalog

### Critical (Wake on-call)

- **RegionUnhealthy**: Region health check failing
- **DBUnreachable**: Metadata DB connection failed
- **QueueUnreachable**: Task queue unavailable
- **GPUClusterDown**: GPU nodes unreachable
- **StorageUnavailable**: Object storage failing
- **CDNDown**: CDN not serving assets

### High

- **ErrorRateHigh**: Error rate > 2% for 5+ minutes
- **LatencySLOViolation**: p95 latency > SLO for 10+ minutes
- **GPUUtilizationHigh**: GPU utilization > 95% for 10+ minutes
- **QueueDepthHigh**: Queue depth > threshold
- **DLQGrowing**: Webhook DLQ size growing
- **AutoscalerFlapping**: Repeated scale up/down cycles

### Medium

- **ReplicationLagHigh**: Storage replication lag > threshold
- **WebhookFailureRate**: Webhook success rate < 99%
- **BillingAnomalies**: Unusual billing event patterns
- **SchedulerDispatchFailures**: Dispatch failure rate elevated

### Low

- **NodeUtilizationLow**: Node utilization < threshold (scale down candidate)
- **CDNCacheHitRateLow**: Cache hit rate declining
- **APILatencyElevated**: API latency trending up

---

## On-Call Responsibilities

1. **Monitor Dashboards**
   - Check critical dashboards every 5 minutes
   - Review alerts in real-time
   - Triage by severity

2. **Respond to Incidents**
   - Acknowledge incident in Slack
   - Activate incident bridge if needed (SEV-1+)
   - Follow relevant runbook

3. **Communicate Status**
   - Internal updates every 15 minutes (SEV-1)
   - Customer updates every 30 minutes (SEV-1)
   - Root cause summary within 4 hours

4. **Document and Learn**
   - Capture timeline
   - Root cause analysis
   - Action items for prevention
   - Post-incident review (24-48 hours)

---

## Incident Bridge Protocol

### Activation (SEV-1+)
1. Declare incident in Slack
2. Create bridge URL (Zoom/Hangouts)
3. Invite: SRE Lead, Infra Lead, Product Manager, Comms
4. Start recording

### During Incident
- SRE Lead: technical lead, decision maker
- Infra Lead: execute remediation
- Product Manager: customer communication
- Comms: internal/external status updates

### Post-Incident
- Schedule postmortem within 24 hours
- Document timeline, root cause, action items
- Share findings with team
- Follow up on action items

---

## Runbook Index

All runbooks live in `ops/runbooks/`:

- `region-outage.md` — SEV-1
- `gpu-cluster-degradation.md` — SEV-2
- `storage-outage.md` — SEV-2
- `db-outage.md` — SEV-2
- `queue-outage.md` — SEV-2
- `webhook-failure.md` — SEV-3
- `billing-anomalies.md` — SEV-3
- `autoscaler-flapping.md` — SEV-4
- `high-error-rate.md` — SEV-3
- `latency-degradation.md` — SEV-4

Each runbook includes:
- Symptoms
- Immediate actions
- Root cause checklist
- Recovery steps
- Validation
- Postmortem notes

---

## Tools

### Monitoring
- **Prometheus**: Metrics scraping
- **Grafana**: Dashboards and visualization
- **Jaeger/Tempo**: Distributed tracing
- **ELK/Loki**: Log aggregation

### Incident Management
- **Slack**: Notifications and coordination
- **Zoom/Hangouts**: Incident bridge
- **Jira**: Incident tracking

### Automation
- **Kubernetes**: Autoscaling, rolling restarts
- **Terraform**: Infrastructure provisioning
- **Helm**: Deployment management

---

## Escalation Path

```
On-Call SRE
    ↓
SRE Lead (for SEV-1)
    ↓
Infra Lead (for infrastructure issues)
    ↓
Engineering Manager
    ↓
CTO (for SEV-0)
```

---

## Key Contacts

- **SRE Lead**: @sre-lead (Slack)
- **Infra Lead**: @infra-lead (Slack)
- **On-Call Rotation**: PagerDuty
- **Escalation**: #frasberg-incident (Slack)

---

## Training

- **Onboarding**: Read this handbook + relevant runbooks
- **Shadowing**: Follow on-call for 1 week (read-only)
- **Lead**: 1 week as secondary, then primary
- **Quarterly Review**: Update runbooks based on learnings

---
