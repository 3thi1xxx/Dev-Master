#!/bin/bash

# ALWAYS work from the correct directory
cd /Users/DjEthixx/Desktop/Dev/ethixxtradebot

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 ETHIXXTRADEBOT - PREMIUM PLUS OPTIMIZED"
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Birdeye Limits: 50 RPS | 15M CUs/month | 500 WebSockets"
echo "💰 Starting capital: $10,000 (Paper Trading)"
echo "🧪 TEST MODE: ON (Demo trades every 5 seconds)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📌 Dashboard: http://localhost:3000"
echo "📌 Keep this terminal open!"
echo ""

# Check token health first (prevent future issues)
echo "🔍 Checking token health..."
if node scripts/check_tokens.js; then
  echo "✅ Token check passed - starting system..."
else
  echo "❌ Token check failed - please update tokens before starting"
  echo "   See instructions above for extracting fresh tokens"
  exit 1
fi

# Run the unified GUI + trading system
node gui/server-unified.js 