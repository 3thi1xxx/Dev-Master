#!/usr/bin/env node
/**
 * Test Birdeye Integration
 * Shows current capabilities with Birdeye REST API
 */

import { birdeyeAnalytics } from './services/BirdeyeAnalytics.js';
import { liveTokenAnalyzer } from './services/LiveTokenAnalyzer.js';

console.log('🐦 BIRDEYE INTEGRATION TEST');
console.log('=' .repeat(50));

// Test tokens
const testTokens = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' }
];

async function testBirdeyeREST() {
  console.log('\n📊 Testing Birdeye REST API...\n');
  
  for (const token of testTokens) {
    try {
      console.log(`\n🔍 Analyzing ${token.symbol}...`);
      
      // Get token overview
      const overview = await birdeyeAnalytics.getTokenOverview(token.address);
      if (overview) {
        console.log(`  Price: $${overview.price || 'N/A'}`);
        console.log(`  24h Change: ${overview.priceChange24h || 0}%`);
        console.log(`  Volume: $${overview.volume24h || 0}`);
        console.log(`  Liquidity: $${overview.liquidity || 0}`);
      }
      
      // Get security analysis
      const security = await birdeyeAnalytics.analyzeToken(token.address);
      if (security) {
        console.log(`  Security Score: ${security.securityScore || 'N/A'}/100`);
        console.log(`  Risk Level: ${security.riskLevel || 'UNKNOWN'}`);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`  ❌ Error analyzing ${token.symbol}: ${error.message}`);
    }
  }
}

async function testLiveIntegration() {
  console.log('\n\n🔥 Testing Live Token Analysis with Birdeye...\n');
  
  // Listen for opportunities
  liveTokenAnalyzer.on('opportunity', (opp) => {
    console.log(`\n🎯 OPPORTUNITY DETECTED!`);
    console.log(`  Token: ${opp.token?.symbol || 'Unknown'}`);
    console.log(`  Score: ${opp.analysis?.scores?.overall || 0}/100`);
    console.log(`  Action: ${opp.recommendation?.action}`);
    console.log(`  Using Birdeye: ${opp.analysis?.sources?.includes('birdeye') ? 'YES' : 'NO'}`);
  });
  
  // Listen for Birdeye-specific events
  liveTokenAnalyzer.on('birdeye_opportunity', (opp) => {
    console.log(`\n🐦 BIRDEYE OPPORTUNITY!`);
    console.log(`  Type: ${opp.type}`);
    console.log(`  Score: ${opp.score}/100`);
    console.log(`  Data:`, opp.data);
  });
  
  console.log('📡 Monitoring for opportunities (30 seconds)...\n');
  
  // Run for 30 seconds
  setTimeout(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  }, 30000);
}

// Main test function
async function runTests() {
  try {
    // Test REST API
    await testBirdeyeREST();
    
    // Test live integration
    await testLiveIntegration();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Show current capabilities
console.log('\n📋 CURRENT BIRDEYE CAPABILITIES:');
console.log('  ✅ REST API Integration (1000 req/min)');
console.log('  ✅ Token Overview & Metrics');
console.log('  ✅ Security Analysis');
console.log('  ✅ Price & Volume Data');
console.log('  ✅ Holder Analysis');
console.log('  ✅ Trade History');
console.log('  ⏳ WebSocket (Coming Soon)');

console.log('\n💡 ENHANCED FEATURES:');
console.log('  • Auto-tracks hot tokens ($5k+ liquidity)');
console.log('  • Prioritizes Birdeye data in analysis');
console.log('  • Real-time opportunity detection');
console.log('  • Smart rate limit management');

// Run tests
runTests(); 