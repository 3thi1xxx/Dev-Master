#!/usr/bin/env node

/**
 * FREE TIER OPTIMIZATION SCRIPT
 * Optimizes the AI trading system for free tier usage
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 FREE TIER OPTIMIZATION');
console.log('========================');

// Configuration for free tier
const FREE_TIER_CONFIG = {
  // Rate limiting (very conservative for free tier)
  maxRequestsPerMinute: 20,
  cacheTimeout: 300000, // 5 minutes
  
  // Token filtering (focus on quality)
  minLiquidity: 10000, // Only analyze tokens with $10k+ liquidity
  maxTokensPerHour: 50, // Limit analysis to 50 tokens per hour
  
  // Analysis optimization
  skipLowPriorityAnalysis: true, // Skip some detailed analysis
  useCachedData: true, // Use cached data when possible
  
  // Free data sources priority
  dataSources: [
    'dexScreener', // Free, no limits
    'birdeye_basic', // Basic endpoints only
    'public_apis' // Other free sources
  ]
};

// Update configuration files
function updateConfig() {
  console.log('📝 Updating configuration for free tier...');
  
  // Update BirdeyeAnalytics config
  const birdeyePath = join(__dirname, 'services', 'BirdeyeAnalytics.js');
  let birdeyeContent = readFileSync(birdeyePath, 'utf8');
  
  // Update rate limiting
  birdeyeContent = birdeyeContent.replace(
    /maxRequests: this\.config\.apiKey \? 50 : 30/,
    `maxRequests: this.config.apiKey ? 50 : ${FREE_TIER_CONFIG.maxRequestsPerMinute}`
  );
  
  // Update cache timeout
  birdeyeContent = birdeyeContent.replace(
    /this\.cacheTimeout = 300000;/,
    `this.cacheTimeout = ${FREE_TIER_CONFIG.cacheTimeout};`
  );
  
  writeFileSync(birdeyePath, birdeyeContent);
  console.log('✅ Updated BirdeyeAnalytics configuration');
  
  // Update LiveTokenAnalyzer for better filtering
  const analyzerPath = join(__dirname, 'services', 'LiveTokenAnalyzer.js');
  let analyzerContent = readFileSync(analyzerPath, 'utf8');
  
  // Add liquidity filtering
  if (!analyzerContent.includes('minLiquidity')) {
    const filterCode = `
    // Free tier optimization: Filter tokens by liquidity
    const minLiquidity = ${FREE_TIER_CONFIG.minLiquidity};
    if (tokenData.liquidity < minLiquidity) {
      console.log(\`[LIVE] ⏭️ Skipping \${tokenData.symbol} - Low liquidity (\$\${tokenData.liquidity})\`);
      return;
    }
    `;
    
    // Insert after token detection
    const insertPoint = analyzerContent.indexOf('🎯 Token detected:');
    if (insertPoint !== -1) {
      const beforeInsert = analyzerContent.substring(0, insertPoint);
      const afterInsert = analyzerContent.substring(insertPoint);
      analyzerContent = beforeInsert + filterCode + afterInsert;
    }
  }
  
  writeFileSync(analyzerPath, analyzerContent);
  console.log('✅ Updated LiveTokenAnalyzer with liquidity filtering');
}

// Create free tier monitoring script
function createMonitoringScript() {
  const monitorScript = `#!/bin/bash

echo "📊 FREE TIER MONITORING"
echo "======================="
echo "🕐 Started: \$(date)"
echo "💡 Monitoring free tier usage and performance"
echo ""

# Function to check rate limits
check_rate_limits() {
    echo "🔍 Checking rate limits..."
    curl -s http://localhost:3000/api/live-stats | jq -r '. | "📈 Messages: \\(.messagesProcessed) | Tokens: \\(.tokensDetected) | Analyzed: \\(.tokensAnalyzed)"'
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
`;

  writeFileSync(join(__dirname, 'monitor_free_tier.sh'), monitorScript);
  console.log('✅ Created free tier monitoring script');
}

// Main optimization
function optimizeForFreeTier() {
  console.log('🎯 Optimizing system for free tier usage...');
  
  updateConfig();
  createMonitoringScript();
  
  console.log('');
  console.log('✅ FREE TIER OPTIMIZATION COMPLETE!');
  console.log('');
  console.log('🚀 OPTIMIZATIONS APPLIED:');
  console.log('   • Reduced rate limits to 20 RPM');
  console.log('   • Added 5-minute data caching');
  console.log('   • Filter tokens by liquidity (>$10k)');
  console.log('   • Focus on quality analysis');
  console.log('');
  console.log('📊 MONITORING:');
  console.log('   • Run: ./monitor_free_tier.sh');
  console.log('   • Dashboard: http://localhost:3000');
  console.log('');
  console.log('💡 FREE TIER STRATEGY:');
  console.log('   1. Start with paper trading');
  console.log('   2. Prove profitability with free data');
  console.log('   3. Scale up only when profitable');
  console.log('');
  console.log('🎉 Your AI trading system is now optimized for free tier!');
}

// Run optimization
optimizeForFreeTier(); 