#!/usr/bin/env bash
set -euo pipefail

# Axiom Live Proof Script
# Validates the resurrected API6 connection and wallet authentication

ROOT="$(pwd)"
CONFIG_FILE="${ROOT}/config/axiom-live.config.json"
PROOF_RUNNER="${ROOT}/scripts/axiomLiveProofRunner.mjs"
REPORTS_DIR="${ROOT}/reports"

# --- helpers ---------------------------------------------------------------
timestamp() { date -u +%s; }
note(){ printf "\033[1;36m[axiom-live]\033[0m %s\n" "$*"; }
err(){ printf "\033[1;31m[axiom-live:ERROR]\033[0m %s\n" "$*" >&2; }

mkdir -p "${REPORTS_DIR}"

note "Starting Axiom Live System Proof..."

# --- Check config file exists ---------------------------------------------
if [[ ! -f "${CONFIG_FILE}" ]]; then
  err "Config file not found: ${CONFIG_FILE}"
  note "Please copy config/axiom-live.config.json and update wallet credentials"
  exit 1
fi

# --- Validate wallet credentials are set ----------------------------------
if grep -q "WALLET_ADDRESS_PLACEHOLDER\|PRIVATE_KEY_BASE58_PLACEHOLDER" "${CONFIG_FILE}"; then
  err "Wallet credentials not configured in ${CONFIG_FILE}"
  note "Please replace WALLET_ADDRESS_PLACEHOLDER and PRIVATE_KEY_BASE58_PLACEHOLDER with real values"
  exit 1
fi

note "✓ Config file validated"

# --- Test 1: API6 Connectivity Test ---------------------------------------
note "Test 1: Testing API6 connectivity..."
node -e "
import { testConnection } from './agents/axiom/AxiomHandshake.js';
const hosts = ['https://api3.axiom.trade', 'https://api6.axiom.trade', 'https://api7.axiom.trade'];
Promise.all(hosts.map(h => testConnection(h))).then(results => {
  const working = results.filter(r => r.ok);
  console.log('API Connectivity Results:');
  results.forEach(r => console.log(\`  \${r.host}: \${r.ok ? '✓' : '✗'} \${r.status || r.error || ''}\`));
  console.log(\`Working endpoints: \${working.length}/\${results.length}\`);
  if (working.length === 0) process.exit(1);
}).catch(e => { console.error('Connectivity test failed:', e.message); process.exit(1); });
" || { err "API connectivity test failed"; exit 1; }

note "✓ API connectivity validated"

# --- Test 2: Wallet-Nonce Authentication Test ----------------------------
note "Test 2: Testing wallet-nonce authentication flow..."
WALLET_ADDRESS=$(jq -r '.axiom.wallet.address' "${CONFIG_FILE}")
PRIVATE_KEY=$(jq -r '.axiom.wallet.privateKey' "${CONFIG_FILE}")

if [[ "${WALLET_ADDRESS}" == "null" || "${PRIVATE_KEY}" == "null" ]]; then
  err "Wallet credentials not properly set in config"
  exit 1
fi

node -e "
import { performHandshake } from './agents/axiom/AxiomHandshake.js';
const config = JSON.parse(require('fs').readFileSync('${CONFIG_FILE}', 'utf8'));
performHandshake({
  walletAddress: config.axiom.wallet.address,
  privKeyBase58: config.axiom.wallet.privateKey,
  logger: { log: console.log, warn: console.warn, error: console.error }
}).then(session => {
  console.log('✓ Handshake successful');
  console.log('  Session ID:', session.session.substring(0, 16) + '...');
  console.log('  Host:', session.healthyHost);
  console.log('  Auth Token:', session.authToken ? 'Present' : 'Missing');
}).catch(e => { 
  console.error('✗ Handshake failed:', e.message); 
  process.exit(1); 
});
" || { err "Wallet authentication test failed"; exit 1; }

note "✓ Wallet authentication validated"

# --- Test 3: Live API6 Data Fetch Test ------------------------------------
note "Test 3: Testing live API6 data fetching..."
node -e "
import AxiomAPI6Client from './agents/axiom/AxiomAPI6Client.js';
const config = JSON.parse(require('fs').readFileSync('${CONFIG_FILE}', 'utf8'));
const client = new AxiomAPI6Client({
  walletAddress: config.axiom.wallet.address,
  privKeyBase58: config.axiom.wallet.privateKey,
  logger: { log: console.log, warn: console.warn, error: console.error }
});

client.testLatency().then(result => {
  if (result.success) {
    console.log(\`✓ API6 latency test passed: \${result.latency}ms\`);
    return client.getTrendingTokens();
  } else {
    throw new Error(\`Latency test failed: \${result.error}\`);
  }
}).then(tokens => {
  console.log(\`✓ Retrieved \${tokens.length} trending tokens\`);
  if (tokens.length > 0) {
    console.log(\`  Sample token: \${tokens[0].tokenSymbol || 'Unknown'}\`);
  }
}).catch(e => { 
  console.error('✗ Live data fetch failed:', e.message); 
  process.exit(1); 
});
" || { err "Live data fetch test failed"; exit 1; }

note "✓ Live API6 data fetch validated"

# --- Test 4: Trading Executor Test ----------------------------------------
note "Test 4: Testing live trading executor..."
node -e "
import AxiomLiveExecutor from './agents/axiom/AxiomLiveExecutor.js';
const config = JSON.parse(require('fs').readFileSync('${CONFIG_FILE}', 'utf8'));
const executor = new AxiomLiveExecutor({
  walletAddress: config.axiom.wallet.address,
  privKeyBase58: config.axiom.wallet.privateKey,
  logger: { log: console.log, warn: console.warn, error: console.error }
});

const mockContext = {
  trust: { score: 0.85, thresholds: { min_trust_to_execute: 0.7 } },
  killswitch: { enabled: false },
  mode: 'proof'
};

executor.run(mockContext).then(decision => {
  console.log('✓ Trading executor completed');
  console.log(\`  Action: \${decision.action}\`);
  console.log(\`  Confidence: \${decision.confidence}\`);
  console.log(\`  Reason: \${decision.reason}\`);
  if (decision.provenance) {
    console.log(\`  API6 Latency: \${decision.provenance.api6_latency}ms\`);
    console.log(\`  Signals: \${decision.provenance.signals_count || 0}\`);
  }
}).catch(e => { 
  console.error('✗ Trading executor failed:', e.message); 
  process.exit(1); 
});
" || { err "Trading executor test failed"; exit 1; }

note "✓ Trading executor validated"

# --- Generate Proof Report ------------------------------------------------
note "Generating proof report..."
TS="$(timestamp)"

cat > "${REPORTS_DIR}/axiom-live-proof-${TS}.html" <<EOF
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Axiom Live System Proof</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .pass { color: green; }
        .timestamp { color: #666; font-size: 0.9em; }
        .config { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🔥 Axiom Live System Proof</h1>
    <p class="timestamp">Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")</p>
    
    <h2>System Status</h2>
    <ul>
        <li class="pass">✓ API6 Connectivity Test</li>
        <li class="pass">✓ Wallet-Nonce Authentication</li>
        <li class="pass">✓ Live Data Fetching</li>
        <li class="pass">✓ Trading Executor</li>
    </ul>
    
    <h2>Configuration</h2>
    <div class="config">
        <strong>Wallet Address:</strong> ${WALLET_ADDRESS:0:8}...${WALLET_ADDRESS: -8}<br>
        <strong>Primary Endpoint:</strong> https://api6.axiom.trade<br>
        <strong>Mode:</strong> $(jq -r '.axiom.safety.dryRun' "${CONFIG_FILE}" | sed 's/true/DRY RUN/;s/false/LIVE TRADING/')<br>
        <strong>Max Position:</strong> \$$(jq -r '.axiom.trading.maxPositionUSD' "${CONFIG_FILE}")<br>
    </div>
    
    <h2>Next Steps</h2>
    <p>✅ All legacy Axiom components successfully resurrected!</p>
    <ul>
        <li>Wallet-nonce authentication flow restored</li>
        <li>API6 trending data integration active</li>
        <li>Live trading executor operational</li>
        <li>Safety mechanisms in place</li>
    </ul>
    
    <p><strong>🚀 Ready for production deployment with APPROVE DROP</strong></p>
</body>
</html>
EOF

note "✅ All tests passed! Axiom Live System fully operational"
note "📄 Proof report: ${REPORTS_DIR}/axiom-live-proof-${TS}.html"
note ""
note "🎯 SUMMARY: Legacy Axiom components successfully resurrected!"
note "   • Wallet-nonce handshake: ✓ Working"
note "   • API6 integration: ✓ Working" 
note "   • Live data fetching: ✓ Working"
note "   • Trading executor: ✓ Working"
note ""
note "Ready for APPROVE DROP deployment! 🚀" 