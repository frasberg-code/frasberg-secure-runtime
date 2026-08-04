# Luchii Mesh — Multi-Region Failover

A standalone watchdog that health-checks every region hitting `GET /api/health`
and flips the Cloudflare DNS A record to a healthy standby when the active
region fails `FAIL_THRESHOLD` consecutive checks. Automatic fail-back when the
primary recovers.

Run it on a neutral host (NOT on either app server):

```bash
export CF_API_TOKEN=...            # Cloudflare API token with DNS edit rights
export CF_ZONE_ID=...              # Zone ID for frasberg.com
export CF_RECORD_NAME=frasberg.com
export PRIMARY_IP=203.0.113.10
export PRIMARY_HEALTH_URL=https://primary.frasberg.com/api/health
export SECONDARY_IP=203.0.113.20
export SECONDARY_HEALTH_URL=https://secondary.frasberg.com/api/health

python3 failover.py
```

Or as a systemd unit:

```ini
[Unit]
Description=Luchii Mesh Failover Watchdog
After=network-online.target

[Service]
EnvironmentFile=/etc/luchii/failover.env
ExecStart=/usr/bin/python3 /opt/luchii/selfhost/failover/failover.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Notes:
- DNS TTL is forced to 60s on failover for fast propagation.
- Set the record to DNS-only (grey cloud) OR keep Cloudflare SSL mode
  "Full (strict)" with valid origin certs on BOTH regions, otherwise
  the standby will 520 the same way.
