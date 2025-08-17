#!/usr/bin/env bash
set -euo pipefail

# Nightly audit pipeline - keeps RiskJudge happy and prevents "no_audit"
AUDIT_TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
AUDIT_DIR="out/audit/$AUDIT_TS"
mkdir -p "$AUDIT_DIR"

echo "Starting nightly audit: $AUDIT_TS"

# Level-0 quick checks
echo "=== Level-0 Scan ===" | tee "$AUDIT_DIR/summary.txt"
find src -name "ClaudeRelayOrchestrator.mjs" -print | tee -a "$AUDIT_DIR/summary.txt"
grep -c '"anchor_hash"' vault-log.ndjson 2>/dev/null | tee -a "$AUDIT_DIR/summary.txt" || echo "0" | tee -a "$AUDIT_DIR/summary.txt"
find agent_memory -name "*.agent.md" | wc -l | tee -a "$AUDIT_DIR/summary.txt"

# Level-1 validation
echo "=== Level-1 Validation ===" | tee -a "$AUDIT_DIR/summary.txt"
node src/validators/ExecutionProofValidator.cjs --vault vault-log.ndjson --pmac .pmac.log --max-breaks 10 --search-all > "$AUDIT_DIR/validator.json" 2>&1 || true
node tools/audit/check-anchors.cjs > "$AUDIT_DIR/anchors.json" 2>/dev/null || true
node tools/audit/agent-placeholders.cjs > "$AUDIT_DIR/agent-placeholders.json" 2>/dev/null || true
node tools/audit/chatdrop-sig-scan.cjs > "$AUDIT_DIR/chatdrop-sigs.json" 2>/dev/null || true

# Reflection & Trust
echo "=== Reflection & Trust ===" | tee -a "$AUDIT_DIR/summary.txt"
cbsh/run-reflection.sh > "$AUDIT_DIR/reflection.json" 2>&1 || true
cbsh/run-trust.sh > "$AUDIT_DIR/trust.json" 2>&1 || true
cp trustmap.json "$AUDIT_DIR/" 2>/dev/null || true
cp memory/scores/summary.json "$AUDIT_DIR/agent-scores.json" 2>/dev/null || true

# Manifest integrity
echo "=== Manifest Integrity ===" | tee -a "$AUDIT_DIR/summary.txt"
cbsh/build-manifest.sh > "$AUDIT_DIR/manifest-build.json" 2>&1 || true
npm run manifest:verify > "$AUDIT_DIR/manifest-verify.json" 2>&1 || true
cp out/manifest-report.json "$AUDIT_DIR/" 2>/dev/null || true

# Log the audit completion
echo "{\"type\":\"nightly_audit_complete\",\"ts\":\"$(date -u --iso-8601=seconds)\",\"audit_dir\":\"$AUDIT_DIR\"}" >> .pmac.log

echo "Nightly audit complete: $AUDIT_DIR"
ls -la "$AUDIT_DIR" 