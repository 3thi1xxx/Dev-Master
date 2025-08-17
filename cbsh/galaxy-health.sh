#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e "import('./agents/galaxy/GalaxyBrainAdapter.js').then(m=>m.heartbeat())" 