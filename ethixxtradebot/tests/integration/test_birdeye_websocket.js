#!/usr/bin/env node
/**
 * Test Birdeye WebSocket Manager
 * Demonstrates tracking up to 500 tokens with real-time opportunities
 */

import { birdeyeWebSocketManager } from './services/BirdeyeWebSocketManager.js';

console.log('🐦 BIRDEYE WEBSOCKET TEST');
console.log('=' .repeat(50));

// Popular tokens to track for testing
const testTokens = [
  // Major tokens
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', symbol: 'RAY' },
  { address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', symbol: 'USDC' },
  
  // Meme coins
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' },
  { address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', symbol: 'HELP' },
  
  // Add more as needed...
];

// Track opportunity statistics
const stats = {
  totalOpportunities: 0,
  byType: {},
  highScoreOpps: 0,
  tokens: {}
};

// Listen for opportunities
birdeyeWebSocketManager.on('opportunity', (opportunity) => {
  stats.totalOpportunities++;
  stats.byType[opportunity.type] = (stats.byType[opportunity.type] || 0) + 1;
  
  if (opportunity.score >= 70) {
    stats.highScoreOpps++;
    console.log('\n🚨 HIGH SCORE OPPORTUNITY!');
  }
  
  console.log(`\n🎯 OPPORTUNITY DETECTED!`);
  console.log(`  Token: ${opportunity.tokenAddress}`);
  console.log(`  Type: ${opportunity.type}`);
  console.log(`  Score: ${opportunity.score}/100`);
  console.log(`  Data:`, JSON.stringify(opportunity.data, null, 2));
  
  // Track per-token opportunities
  if (!stats.tokens[opportunity.tokenAddress]) {
    stats.tokens[opportunity.tokenAddress] = {
      opportunities: 0,
      highestScore: 0,
      types: []
    };
  }
  stats.tokens[opportunity.tokenAddress].opportunities++;
  stats.tokens[opportunity.tokenAddress].highestScore = Math.max(
    stats.tokens[opportunity.tokenAddress].highestScore,
    opportunity.score
  );
  if (!stats.tokens[opportunity.tokenAddress].types.includes(opportunity.type)) {
    stats.tokens[opportunity.tokenAddress].types.push(opportunity.type);
  }
});

// Listen for real-time updates
birdeyeWebSocketManager.on('price_update', (data) => {
  if (Math.abs(data.priceChange) > 0.02) { // 2% change
    console.log(`📈 Price ${data.priceChange > 0 ? 'UP' : 'DOWN'} ${(data.priceChange * 100).toFixed(2)}% for ${data.tokenAddress}`);
  }
});

birdeyeWebSocketManager.on('volume_update', (data) => {
  if (data.volumeRatio > 2) { // 2x normal volume
    console.log(`📊 Volume spike ${data.volumeRatio.toFixed(1)}x for ${data.tokenAddress}`);
  }
});

// Start tracking test tokens
async function startTracking() {
  console.log('\n🚀 Starting to track tokens...\n');
  
  for (const token of testTokens) {
    const success = await birdeyeWebSocketManager.trackToken(token.address, {
      symbol: token.symbol
    });
    
    if (success) {
      console.log(`✅ Tracking ${token.symbol}`);
    } else {
      console.log(`❌ Failed to track ${token.symbol}`);
    }
    
    // Small delay between subscriptions
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Now tracking ${birdeyeWebSocketManager.stats.activeConnections} tokens`);
  console.log('🎯 Watching for opportunities...\n');
}

// Periodic stats report
setInterval(() => {
  const bsStats = birdeyeWebSocketManager.getStats();
  console.log('\n📊 BIRDEYE WEBSOCKET STATS:');
  console.log(`  Active connections: ${bsStats.activeConnections}/${500}`);
  console.log(`  Messages received: ${bsStats.messagesReceived}`);
  console.log(`  Total opportunities: ${stats.totalOpportunities}`);
  console.log(`  High score opportunities: ${stats.highScoreOpps}`);
  console.log(`  Opportunity types:`, stats.byType);
  
  // Show top tokens by opportunities
  const topTokens = Object.entries(stats.tokens)
    .sort((a, b) => b[1].opportunities - a[1].opportunities)
    .slice(0, 5);
  
  if (topTokens.length > 0) {
    console.log('\n🔥 TOP TOKENS BY OPPORTUNITIES:');
    topTokens.forEach(([address, data]) => {
      console.log(`  ${address.substring(0, 8)}... - ${data.opportunities} opps, highest score: ${data.highestScore}`);
    });
  }
}, 30000); // Every 30 seconds

// Start tracking
startTracking().catch(console.error);

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await birdeyeWebSocketManager.shutdown();
  process.exit(0);
});

console.log('\nPress Ctrl+C to stop\n'); 