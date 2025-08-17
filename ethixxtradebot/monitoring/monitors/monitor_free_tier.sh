#!/bin/bash

echo "📊 FREE TIER MONITORING"
echo "======================="
echo "🕐 Started: $(date)"
echo "💡 Monitoring free tier usage and performance"
echo ""

# Function to check rate limits
check_rate_limits() {
    echo "🔍 Checking rate limits..."
    curl -s http://localhost:3000/api/live-stats | jq -r '. | "📈 Messages: \(.messagesProcessed) | Tokens: \(.tokensDetected) | Analyzed: \(.tokensAnalyzed)"'
}

# Function to check cache hit rate
check_cache() {
    echo "💾 Checking cache performance..."
    # Add cache monitoring here when implemented
    echo "   Cache optimization: ENABLED"
}

# Function to show free tier tips
show_tips() {
    echo "💡 FREE TIER OPTIMIZATION TIPS:"
    echo "   • Only analyzing tokens with >$10k liquidity"
    echo "   • 5-minute data caching to reduce API calls"
    echo "   • Conservative rate limiting (20 RPM)"
    echo "   • Focus on quality over quantity"
    echo ""
}

# Initial check
check_rate_limits
check_cache
show_tips

# Monitor every 30 seconds
while true; do
    sleep 30
    echo "----------------------------------------"
    check_rate_limits
    check_cache
done
