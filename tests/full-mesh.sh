#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

bash "$script_dir/gateway-health.sh"
bash "$script_dir/router-health.sh"
bash "$script_dir/engine-health.sh"
bash "$script_dir/worldgraph-rpc.sh"

echo "All configured runtime mesh health checks passed."
