#!/usr/bin/env python3
"""Luchii Mesh multi-region failover daemon. Runs on a neutral watchdog host."""
import os
import sys
import time
import json
import logging
import urllib.request

logging.basicConfig(level=logging.INFO, format="%(asctime)s [failover] %(message)s")
log = logging.getLogger("luchii-failover")

CHECK_INTERVAL = int(os.environ.get("CHECK_INTERVAL", "30"))
FAIL_THRESHOLD = int(os.environ.get("FAIL_THRESHOLD", "3"))
CF_API_TOKEN = os.environ.get("CF_API_TOKEN")
CF_ZONE_ID = os.environ.get("CF_ZONE_ID")
CF_RECORD_NAME = os.environ.get("CF_RECORD_NAME", "frasberg.com")

REGIONS = [
    {"name": "primary", "ip": os.environ.get("PRIMARY_IP"), "health": os.environ.get("PRIMARY_HEALTH_URL")},
    {"name": "secondary", "ip": os.environ.get("SECONDARY_IP"), "health": os.environ.get("SECONDARY_HEALTH_URL")},
]


def check_health(url: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "luchii-failover/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            body = json.loads(r.read().decode())
            return r.status == 200 and body.get("ok") is True
    except Exception as e:
        log.warning("health check failed for %s: %s", url, e)
        return False


def _cf_request(path: str, method: str = "GET", payload: dict | None = None) -> dict:
    url = f"https://api.cloudflare.com/client/v4{path}"
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def get_dns_record() -> dict | None:
    res = _cf_request(f"/zones/{CF_ZONE_ID}/dns_records?type=A&name={CF_RECORD_NAME}")
    records = res.get("result", [])
    return records[0] if records else None


def point_dns_to(ip: str) -> bool:
    record = get_dns_record()
    if not record:
        log.error("DNS A record for %s not found", CF_RECORD_NAME)
        return False
    if record["content"] == ip:
        log.info("DNS already points to %s", ip)
        return True
    res = _cf_request(f"/zones/{CF_ZONE_ID}/dns_records/{record['id']}", "PUT", {
        "type": "A", "name": CF_RECORD_NAME, "content": ip,
        "ttl": 60, "proxied": record.get("proxied", False),
    })
    ok = res.get("success", False)
    log.info("DNS %s -> %s: %s", CF_RECORD_NAME, ip, "OK" if ok else res.get("errors"))
    return ok


def main():
    for r in REGIONS:
        if not r["ip"] or not r["health"]:
            log.error("Missing env config for region %s (need *_IP and *_HEALTH_URL)", r["name"])
            sys.exit(1)
    if not CF_API_TOKEN or not CF_ZONE_ID:
        log.error("Missing CF_API_TOKEN / CF_ZONE_ID")
        sys.exit(1)

    fails = {r["name"]: 0 for r in REGIONS}
    active = REGIONS[0]["name"]
    log.info("Failover watchdog started. Active region: %s", active)

    while True:
        for region in REGIONS:
            if check_health(region["health"]):
                fails[region["name"]] = 0
            else:
                fails[region["name"]] += 1
                log.warning("%s failing (%d/%d)", region["name"], fails[region["name"]], FAIL_THRESHOLD)

        active_region = next(r for r in REGIONS if r["name"] == active)
        if fails[active] >= FAIL_THRESHOLD:
            standby = next((r for r in REGIONS if r["name"] != active and fails[r["name"]] == 0), None)
            if standby:
                log.error("ACTIVE REGION %s IS DOWN — failing over to %s", active, standby["name"])
                if point_dns_to(standby["ip"]):
                    active = standby["name"]
                    fails[active] = 0
            else:
                log.critical("All regions failing — no healthy standby available")
        elif active != REGIONS[0]["name"] and fails[REGIONS[0]["name"]] == 0:
            log.info("Primary healthy again — failing back")
            if point_dns_to(REGIONS[0]["ip"]):
                active = REGIONS[0]["name"]

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
