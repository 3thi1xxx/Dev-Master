#!/bin/bash

# ALWAYS run from the correct directory
cd /Users/DjEthixx/Desktop/Dev/ethixxtradebot

echo "✅ Working directory: $(pwd)"
echo "🚀 Starting ETHIXXTRADEBOT system..."

# Start paper trading system
echo "📊 Starting paper trading system..."
node run-live-paper-trading.js &
PAPER_PID=$!

echo "✅ Paper trading started (PID: $PAPER_PID)"
echo ""
echo "📌 System is running!"
echo "📌 Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"

# Wait for interrupt
wait $PAPER_PID 