#!/usr/bin/env node
/**
 * Test Birdeye API Key
 * Verify the API key is working properly
 */

import { BirdeyeAnalytics } from './services/BirdeyeAnalytics.js';

console.log('🐦 TESTING BIRDEYE API KEY');
console.log('=' .repeat(35));

// Create Birdeye instance
const birdeye = new BirdeyeAnalytics();

console.log('🔑 API Key Status:');
console.log(`   Key: ${birdeye.config.apiKey ? 'SET' : 'NOT SET'}`);
console.log(`   Headers: ${JSON.stringify(birdeye.headers, null, 2)}`);

// Test with a known Solana token
const testToken = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

console.log(`\n🔍 Testing API with token: ${testToken}`);

try {
  const result = await birdeye.getTokenOverview(testToken);
  
  if (result.error) {
    console.log(`❌ API Error: ${result.error}`);
  } else {
    console.log('✅ API Success!');
    console.log(`📊 Token: ${result.symbol}`);
    console.log(`💰 Price: $${result.price}`);
    console.log(`📈 Market Cap: $${result.marketCap}`);
    console.log(`💧 Liquidity: $${result.liquidity}`);
  }
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
} 