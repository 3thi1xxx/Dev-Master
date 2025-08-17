#!/bin/bash

echo "🚀 Starting ETHIXXTRADEBOT with TEST MODE"
echo "This will generate demo trades every 5 seconds"
echo ""
echo "Keep this terminal open to see trading activity"
echo "Dashboard: http://localhost:3000"
echo ""

cd /Users/DjEthixx/Desktop/Dev/ethixxtradebot
node run-live-paper-trading.js 2>&1 | grep -E "(TEST|PAPER|P&L|💰|🎯|BUY|SELL|Position)" | grep -v "Too many requests" 