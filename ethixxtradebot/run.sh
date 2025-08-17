#!/bin/bash
# Axiom Trading System Launcher
# Optimized for profitable meme coin trading

echo "🚀 LAUNCHING AXIOM PROFITABLE MEME COIN TRADING SYSTEM"
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "start.js" ]; then
    echo "❌ Error: Must be run from ethixxtradebot directory"
    echo "💡 Run: cd /Users/DjEthixx/Desktop/Dev/ethixxtradebot && ./run.sh"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Error: Node.js 16+ required, found $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ Working directory: $(pwd)"

# Kill any existing processes
echo "🔧 Cleaning up any existing processes..."
pkill -f "node.*start.js" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

echo "🎯 Launching with Premium Plus Birdeye + Auckland advantage..."
echo "📊 Dashboard: http://localhost:3000"
echo "💰 Paper Trading: $1000 starting balance"
echo "⚡ Auckland Gateway: 10ms latency edge"
echo ""
echo "🏆 READY FOR PROFITABLE MEME COIN TRADING!"
echo ""

# Launch the system
exec node start.js 