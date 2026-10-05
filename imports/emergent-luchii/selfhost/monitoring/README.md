# Luchii Mesh — Monitoring Stack

Prometheus + Grafana + Alertmanager + node-exporter + cAdvisor, all
self-hosted. Scrapes the live backend at `GET /api/metrics` (Prometheus
text format, zero external dependencies).

## Boot it
```bash
cd selfhost/monitoring
GRAFANA_USER=frasberg GRAFANA_PASSWORD=<strong-pass> \
docker compose -f docker-compose.monitoring.yml up -d
```

- Grafana: `http://<host>:3001` — the "Luchii Mesh — Sovereign Overview"
  dashboard is auto-provisioned.
- Prometheus retention: 30 days.
- Alerts: BackendDown, MeshWebSocketDown, UpstreamEngineOffline,
  HighCPU/Memory/Disk → routed to `ALERT_WEBHOOK_URL` via Alertmanager.

## Exposed app metrics (from /api/metrics)
| Metric | Meaning |
|---|---|
| `luchii_users_total` | registered accounts |
| `luchii_messages_total` | chat messages stored |
| `luchii_sessions_total` | distinct chat sessions |
| `luchii_builds_total` | builder projects |
| `luchii_memories_total` | memory vault entries |
| `luchii_paid_users_total` | users on a paid plan |
| `luchii_upstream_active` | 1 = frasberg upstream live, 0 = fallback |
| `luchii_uptime_seconds` | process uptime |
