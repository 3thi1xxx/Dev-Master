#!/usr/bin/env bash
set -euo pipefail

# Simple Axiom Stealth System Build Manifest
ROOT="$(pwd)"
BUILD_DIR="${ROOT}/build"

note(){ printf "\033[1;36m[build]\033[0m %s\n" "$*"; }

mkdir -p "${BUILD_DIR}"

note "🏗️ Generating Axiom Stealth System Build Manifest..."

# Check core files
CORE_FILES=(
  "agents/axiom/AxiomStealthSystem.js"
  "agents/axiom/AxiomStealthScout.js" 
  "agents/axiom/AxiomStealthHandshake.js"
  "agents/axiom/AxiomCookieIntelligence.js"
  "agents/axiom/AxiomAPI6Client.js"
  "agents/axiom/AxiomLiveExecutor.js"
  "agents/axiom/AxiomHandshake.js"
)

total_size=0
file_count=0

note "Validating core files..."
for file in "${CORE_FILES[@]}"; do
  if [[ -f "${file}" ]]; then
    size=$(wc -c < "${file}" | tr -d ' ')
    total_size=$((total_size + size))
    file_count=$((file_count + 1))
    note "✅ ${file} ($(( size / 1024 )) KB)"
  else
    note "❌ Missing: ${file}"
  fi
done

# Test module loading
note "Testing module imports..."
if node -e "import('./agents/axiom/AxiomStealthSystem.js').then(() => console.log('✅ Modules load successfully')).catch(e => {console.error('❌ Import failed:', e.message); process.exit(1);})"; then
  note "✅ Module loading test passed"
else
  note "❌ Module loading test failed"
fi

note ""
note "🎯 BUILD SUMMARY:"
note "   📁 Files: ${file_count}/${#CORE_FILES[@]} components"
note "   📏 Total Size: $(( total_size / 1024 )) KB"
note "   📋 manifest.json: $([ -f manifest.json ] && echo "✅ Present" || echo "❌ Missing")"
note "   📦 package.json: $([ -f package.json ] && echo "✅ Present" || echo "❌ Missing")"
note ""
note "🚀 Axiom Stealth System build validation complete!" 