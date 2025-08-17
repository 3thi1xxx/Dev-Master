#!/usr/bin/env node
/**
 * Test Birdeye Price Data
 * Test the price endpoint that works with the API key
 */

import { BirdeyeAnalytics } from './services/BirdeyeAnalytics.js';

console.log('🐦 TESTING BIRDEYE PRICE DATA');
console.log('=' .repeat(35));

// Create Birdeye instance
const birdeye = new BirdeyeAnalytics();

// Test with a known Solana token
const testToken = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

console.log(`🔍 Testing price data for: ${testToken}`);

try {
  const result = await birdeye.getPriceData(testToken);
  
  if (result.error) {
    console.log(`❌ Price Error: ${result.error}`);
  } else {
    console.log('✅ Price Data Success!');
    console.log(`💰 Current Price: $${result.currentPrice}`);
    console.log(`📈 24h Change: ${result.priceChange24h}%`);
    console.log(`📊 Volume 24h: $${result.volume24h}`);
    console.log(`💧 Liquidity: $${result.liquidity}`);
  }
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
} 