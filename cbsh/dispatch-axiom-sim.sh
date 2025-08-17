#!/usr/bin/env bash
set -euo pipefail
export RELAY_KEY="${RELAY_KEY:-chad-relay-2025}"

node -e 'import("./agents/trading/AxiomTraderAgent.js").then(m=>m.runAxiom())' 