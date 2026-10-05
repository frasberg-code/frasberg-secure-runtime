# Region Outage Runbook — SEV-1

## Definition

A region is completely or partially unavailable:
- `/v1/healthz` failing
- GPU nodes unreachable
- Storage errors
- Database replication lag > 5 minutes

---

## Immediate Actions (< 1 minute)

1. **Declare incident**: Post in `#frasberg-incident` Slack channel
   ```
   SEV-1: Region <region> outage detected
   Affected region: <us-west|us-east|eu-west|ap-southeast>
   Initial symptoms: <specific error>
   ```

2. **Activate incident bridge**: Create Zoom link and invite:
   - SRE Lead
   - Infra Lead
   - Product Manager
   - On-call SRE

3. **Check dashboards**:
   - Open Grafana: `grafana.frasberg.com/d/region-health`
   - Verify region health status
   - Check GPU cluster status
   - Check storage status

---

## Triage (< 5 minutes)

### Check region health
```bash
curl https://video-<region>.frasberg.com/v1/healthz
```

Expected response: `{"status": "healthy"}`

If failing, check:
- Network connectivity
- API service status
- Database connectivity
- GPU cluster status

### Check GPU cluster
```bash
kubectl get nodes -n frasberg-<region>
kubectl get pods -n frasberg-<region>
```

Look for:
- Node status (should be `Ready`)
- Pod restarts
- CPU/memory pressure

### Check storage
```bash
aws s3 ls s3://video-output-<region>/
```

If failing:
- Check AWS console for bucket status
- Check IAM permissions
- Check S3 service health

### Check database
```bash
psql -h db-<region>.frasberg.com -U admin -d frasberg
SELECT COUNT(*) FROM video_tasks;
```

If failing:
- Check database status
- Check replication lag: `SELECT NOW() - pg_last_wal_receive_lsn() > '5 minutes'::INTERVAL;`

---

## Failover Actions (< 5 minutes)

### 1. Mark Region Degraded
```bash
kubectl annotate region <region> status=degraded --overwrite
```

### 2. Update Router Configuration
```bash
# Update region router to secondary
kubectl set env deployment/api-gateway REGION_<region>=DEGRADED
```

Router will now:
- Route new tasks to secondary region
- Stop accepting tasks for primary region

### 3. Requeue Queued Tasks
```bash
# Find queued tasks in failed region
psql -h db-global.frasberg.com -U admin -d frasberg -c "
  SELECT id FROM video_tasks 
  WHERE region = '<region>' AND status = 'queued'
  LIMIT 1000;
"

# Requeue to secondary region
# (handled automatically by router)
```

### 4. Handle Running Tasks
```bash
# Check running tasks
psql -h db-global.frasberg.com -U admin -d frasberg -c "
  SELECT id FROM video_tasks 
  WHERE region = '<region>' AND status = 'running'
  LIMIT 1000;
"

# Option A: Wait for timeout (5 minutes)
# Option B: Mark as failed manually
psql -h db-global.frasberg.com -U admin -d frasberg -c "
  UPDATE video_tasks 
  SET status = 'failed', 
      error = 'Region outage' 
  WHERE region = '<region>' AND status = 'running';
"
```

### 5. Notify Customers
- Send status page update via `status.frasberg.com`
- Notify affected tenants via webhook
- Post in Slack customer channel

---

## Recovery (Variable)

### Phase 1: Restore Region Services

1. **Check infrastructure**:
   ```bash
   # AWS
   aws ec2 describe-instances --region <region>
   aws elbv2 describe-load-balancers --region <region>
   ```

2. **Restart services** (if issue is service-level):
   ```bash
   kubectl rollout restart deployment/api -n frasberg-<region>
   kubectl rollout restart deployment/scheduler -n frasberg-<region>
   kubectl rollout restart daemonset/worker -n frasberg-<region>
   ```

3. **Validate services are up**:
   ```bash
   kubectl get pods -n frasberg-<region>
   # Wait for all pods to be Running
   ```

### Phase 2: Validate Region Health

```bash
# Health check
curl https://video-<region>.frasberg.com/v1/healthz

# Check GPU nodes
kubectl get nodes -n frasberg-<region>

# Check database replication
psql -h db-<region>.frasberg.com -U admin -d frasberg -c "
  SELECT NOW() - pg_last_wal_receive_lsn() as replication_lag;
"
# Should be < 1 second

# Check storage
aws s3 ls s3://video-output-<region>/
```

### Phase 3: Resume Traffic

1. **Update router to restore region**:
   ```bash
   kubectl set env deployment/api-gateway REGION_<region>=HEALTHY
   ```

2. **Monitor for errors**:
   - Watch error rate dashboard
   - Monitor queue depth
   - Monitor latency
   - Check GPU utilization

3. **Gradual traffic restoration** (optional, if partial outage):
   ```bash
   # Increase traffic to region over 10 minutes
   # 10% → 25% → 50% → 75% → 100%
   kubectl set env deployment/api-gateway REGION_<region>_TRAFFIC=10
   kubectl set env deployment/api-gateway REGION_<region>_TRAFFIC=25
   # ... etc
   ```

---

## Validation

- [ ] Region health check returns 200
- [ ] All GPU nodes Running
- [ ] Database replication lag < 1 second
- [ ] Storage responding to requests
- [ ] New tasks accepted in region
- [ ] Error rate normal (< 1%)
- [ ] Latency normal (p95 < 12s)
- [ ] Queue depth normal
- [ ] All alerts cleared

---

## Postmortem Notes

**Timeline**:
- T+0:00 — Region became unhealthy
- T+0:03 — Incident detected and declared
- T+0:05 — Failover to secondary region complete
- T+xx:xx — Recovery initiated
- T+xx:xx — Region healthy, traffic restored

**Root Cause**:
- [ ] Infrastructure failure (network, compute, storage)
- [ ] Service failure (API, scheduler, worker)
- [ ] Database failure (primary down, replication lag)
- [ ] External dependency (AWS service, CDN)
- [ ] Configuration error
- [ ] Unknown

**Contributing Factors**:
- List any factors that made recovery harder

**Action Items**:
1. [ ] <Action item 1>
2. [ ] <Action item 2>
3. [ ] <Action item 3>

**Lessons Learned**:
- What went well?
- What could be improved?
- Should we update runbooks?

---
