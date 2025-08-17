#!/bin/bash

echo "📊 PAPER TRADING MONITOR - LIVE DATA"
echo "======================================"
echo "🕐 Started: $(date)"
echo "💡 Press Ctrl+C to stop monitoring"
echo ""

# Function to display current status
show_status() {
    echo "🕐 $(date '+%H:%M:%S')"
    echo "📈 LIVE STATS:"
    
    # Get live stats
    LIVE_STATS=$(curl -s http://localhost:3000/api/live-stats)
    MESSAGES=$(echo $LIVE_STATS | jq -r '.messagesProcessed')
    TOKENS=$(echo $LIVE_STATS | jq -r '.tokensDetected')
    ANALYZED=$(echo $LIVE_STATS | jq -r '.tokensAnalyzed')
    OPPORTUNITIES=$(echo $LIVE_STATS | jq -r '.opportunitiesFound')
    
    echo "   Messages: $MESSAGES | Tokens: $TOKENS | Analyzed: $ANALYZED | Opportunities: $OPPORTUNITIES"
    
    # Get paper trading status
    PAPER_STATUS=$(curl -s http://localhost:3000/api/paper-trading/status)
    BALANCE=$(echo $PAPER_STATUS | jq -r '.status.balance')
    POSITIONS=$(echo $PAPER_STATUS | jq -r '.status.positions')
    MAX_POSITIONS=$(echo $PAPER_STATUS | jq -r '.status.maxPositions')
    TOTAL_VALUE=$(echo $PAPER_STATUS | jq -r '.status.totalValue')
    
    echo "💰 PAPER TRADING:"
    echo "   Balance: \$$BALANCE | Positions: $POSITIONS/$MAX_POSITIONS | Total Value: \$$TOTAL_VALUE"
    
    # Get performance
    TOTAL_TRADES=$(echo $PAPER_STATUS | jq -r '.status.performance.totalTrades')
    WIN_RATE=$(echo $PAPER_STATUS | jq -r '.status.performance.winRate')
    TOTAL_PROFIT=$(echo $PAPER_STATUS | jq -r '.status.performance.totalProfit')
    TOTAL_LOSS=$(echo $PAPER_STATUS | jq -r '.status.performance.totalLoss')
    
    echo "📊 PERFORMANCE:"
    echo "   Trades: $TOTAL_TRADES | Win Rate: ${WIN_RATE}% | Profit: \$$TOTAL_PROFIT | Loss: \$$TOTAL_LOSS"
    
    # Show active positions if any
    ACTIVE_POSITIONS=$(echo $PAPER_STATUS | jq -r '.status.activePositions | length')
    if [ "$ACTIVE_POSITIONS" -gt 0 ]; then
        echo "🎯 ACTIVE POSITIONS:"
        echo $PAPER_STATUS | jq -r '.status.activePositions[] | "   \(.symbol): $\(.amount) (Score: \(.openScore))"'
    fi
    
    echo "----------------------------------------"
}

# Initial status
show_status

# Monitor every 10 seconds
while true; do
    sleep 10
    show_status
done 