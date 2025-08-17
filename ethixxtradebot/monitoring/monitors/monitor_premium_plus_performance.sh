#!/bin/bash

echo "🚀 MONITORING PREMIUM PLUS PERFORMANCE"
echo "====================================="
echo "Watching for Premium Plus transformation..."
echo ""

# Monitor system performance
while true; do
    echo "$(date '+%H:%M:%S') - Checking Premium Plus performance..."
    
    # Check if server is running
    if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        echo "✅ Server: RUNNING"
        
        # Get paper trading status
        PORTFOLIO=$(curl -s http://localhost:3000/api/paper-trading/status 2>/dev/null | jq -r '.status' 2>/dev/null)
        
        if [ "$PORTFOLIO" != "null" ] && [ "$PORTFOLIO" != "" ]; then
            BALANCE=$(echo "$PORTFOLIO" | jq -r '.balance' 2>/dev/null)
            POSITIONS=$(echo "$PORTFOLIO" | jq -r '.positions' 2>/dev/null)
            TOTAL_VALUE=$(echo "$PORTFOLIO" | jq -r '.totalValue' 2>/dev/null)
            TOTAL_TRADES=$(echo "$PORTFOLIO" | jq -r '.performance.totalTrades' 2>/dev/null)
            TOTAL_PROFIT=$(echo "$PORTFOLIO" | jq -r '.performance.totalProfit' 2>/dev/null)
            WIN_RATE=$(echo "$PORTFOLIO" | jq -r '.performance.winRate' 2>/dev/null)
            
            echo "💰 Balance: \$${BALANCE:-0}"
            echo "📈 Total Value: \$${TOTAL_VALUE:-0}"
            echo "🎯 Positions: ${POSITIONS:-0}"
            echo "📊 Total Trades: ${TOTAL_TRADES:-0}"
            echo "💵 Total Profit: \$${TOTAL_PROFIT:-0}"
            echo "🏆 Win Rate: ${WIN_RATE:-0}%"
        else
            echo "📊 Portfolio: Initializing..."
        fi
        
        # Check for recent activity
        echo ""
        echo "🔍 Recent Activity:"
        echo "=================="
        
        # Look for log files or recent activity
        if [ -f "logs/live_analysis.log" ]; then
            echo "📝 Recent Analysis:"
            tail -n 5 logs/live_analysis.log 2>/dev/null | grep -E "(ANALYSIS|TRADE|OPPORTUNITY)" || echo "   No recent analysis data"
        fi
        
    else
        echo "❌ Server: NOT RUNNING"
        echo "🔄 Attempting to start server..."
        BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js &
        sleep 10
    fi
    
    echo ""
    echo "⏰ Next check in 30 seconds..."
    echo "====================================="
    sleep 30
done 