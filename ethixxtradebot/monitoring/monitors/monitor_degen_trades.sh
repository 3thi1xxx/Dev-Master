#!/bin/bash

echo "🔥 MONITORING DEGEN YOLO TRADES"
echo "====================================="
echo "Watching for live degen signals and YOLO trades..."
echo ""

# Monitor paper trading status
while true; do
    echo "$(date '+%H:%M:%S') - Checking degen trades..."
    
    # Get current portfolio status
    PORTFOLIO=$(curl -s http://localhost:3000/api/paper-trading/status | jq -r '.status')
    
    if [ "$PORTFOLIO" != "null" ]; then
        BALANCE=$(echo "$PORTFOLIO" | jq -r '.balance')
        POSITIONS=$(echo "$PORTFOLIO" | jq -r '.positions')
        TOTAL_VALUE=$(echo "$PORTFOLIO" | jq -r '.totalValue')
        TOTAL_TRADES=$(echo "$PORTFOLIO" | jq -r '.performance.totalTrades')
        TOTAL_PROFIT=$(echo "$PORTFOLIO" | jq -r '.performance.totalProfit')
        WIN_RATE=$(echo "$PORTFOLIO" | jq -r '.performance.winRate')
        
        echo "💰 Balance: \$$BALANCE"
        echo "📊 Positions: $POSITIONS"
        echo "💎 Total Value: \$$TOTAL_VALUE"
        echo "🎯 Total Trades: $TOTAL_TRADES"
        echo "🚀 Total Profit: \$$TOTAL_PROFIT"
        echo "🏆 Win Rate: ${WIN_RATE}%"
        
        # Check for active positions
        ACTIVE_POSITIONS=$(echo "$PORTFOLIO" | jq -r '.activePositions | length')
        if [ "$ACTIVE_POSITIONS" -gt 0 ]; then
            echo ""
            echo "🎯 ACTIVE DEGEN POSITIONS:"
            echo "$PORTFOLIO" | jq -r '.activePositions[] | "   - \(.symbol): $\(.amount) (\(.type))"'
        fi
        
        # Check if we're making money
        if (( $(echo "$TOTAL_PROFIT > 0" | bc -l) )); then
            echo ""
            echo "🚀 PROFIT DETECTED! DEGEN SYSTEM IS WORKING!"
        fi
        
        # Check if we have multiple positions (degen mode)
        if [ "$POSITIONS" -gt 3 ]; then
            echo ""
            echo "🔥 DEGEN MODE ACTIVATED! Multiple positions detected!"
        fi
    else
        echo "⚠️  Could not fetch portfolio status"
    fi
    
    echo ""
    echo "====================================="
    sleep 30  # Check every 30 seconds
done 