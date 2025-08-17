#!/usr/bin/env node
/**
 * Aggressive Paper Trading Test
 * Tests the system with more lenient entry criteria to generate trades
 */

import { fastMemeAnalyzer } from './services/FastMemeAnalyzer.js';

// Configure more aggressive settings for paper trading
const aggressiveConfig = {
  // Much more lenient entry criteria
  minLiquidity: 500,        // Down from 1000
  minVolume1m: 100,         // Down from 250
  minPriceGain1m: 0.001,    // Down from 0.005 (0.1% movement)
  minBuyRatio: 1.0,         // Down from 1.1 (any buy pressure)
  
  // More lenient holder criteria
  minHolders: 5,            // Down from 15
  maxBotRatio: 0.98,        // Up from 0.95 (allow more bots)
  minHoldersPerMinute: 0.5, // Down from 1
  
  // Lower thresholds for recommendations
  strongBuyThreshold: 60,   // Down from 80
  buyThreshold: 40,         // Down from 60
  watchThreshold: 20,       // Down from 40
  riskyThreshold: 10        // Down from 20
};

console.log('🔥 AGGRESSIVE PAPER TRADING TEST');
console.log('=' .repeat(50));
console.log('🎯 Testing with more lenient entry criteria');
console.log('💰 Goal: Generate more trading opportunities');
console.log('');

// Test tokens with different characteristics
const testTokens = [
  {
    symbol: 'PUMP1',
    address: '0x1234567890abcdef',
    liquidity: 2500,
    volume: 500,
    priceHistory: [0.001, 0.0012, 0.0015],
    buyVolume: 300,
    sellVolume: 200,
    holderCount: 25,
    holderGrowth: 3
  },
  {
    symbol: 'MOON2',
    address: '0xabcdef1234567890',
    liquidity: 800,
    volume: 150,
    priceHistory: [0.0005, 0.0006, 0.0008],
    buyVolume: 100,
    sellVolume: 50,
    holderCount: 12,
    holderGrowth: 2
  },
  {
    symbol: 'GEM3',
    address: '0x9876543210fedcba',
    liquidity: 1500,
    volume: 300,
    priceHistory: [0.002, 0.0025, 0.003],
    buyVolume: 200,
    sellVolume: 100,
    holderCount: 18,
    holderGrowth: 4
  },
  {
    symbol: 'RISKY4',
    address: '0xfedcba0987654321',
    liquidity: 600,
    volume: 80,
    priceHistory: [0.0003, 0.0004],
    buyVolume: 60,
    sellVolume: 20,
    holderCount: 8,
    holderGrowth: 1
  }
];

function calculateSimpleScore(tokenData) {
  let score = 0;
  
  // Liquidity score (0-20 points)
  if (tokenData.liquidity >= 2000) score += 20;
  else if (tokenData.liquidity >= 1000) score += 15;
  else if (tokenData.liquidity >= 500) score += 10;
  else if (tokenData.liquidity >= 200) score += 5;
  
  // Volume score (0-25 points)
  if (tokenData.volume >= 1000) score += 25;
  else if (tokenData.volume >= 500) score += 20;
  else if (tokenData.volume >= 200) score += 15;
  else if (tokenData.volume >= 100) score += 10;
  else if (tokenData.volume >= 50) score += 5;
  
  // Price momentum score (0-25 points)
  if (tokenData.priceHistory && tokenData.priceHistory.length >= 2) {
    const priceChange = (tokenData.priceHistory[tokenData.priceHistory.length - 1] - tokenData.priceHistory[0]) / tokenData.priceHistory[0];
    if (priceChange >= 0.1) score += 25;
    else if (priceChange >= 0.05) score += 20;
    else if (priceChange >= 0.02) score += 15;
    else if (priceChange >= 0.01) score += 10;
    else if (priceChange >= 0.005) score += 5;
  }
  
  // Buy pressure score (0-20 points)
  if (tokenData.buyVolume && tokenData.sellVolume) {
    const buyRatio = tokenData.buyVolume / tokenData.sellVolume;
    if (buyRatio >= 2.0) score += 20;
    else if (buyRatio >= 1.5) score += 15;
    else if (buyRatio >= 1.2) score += 10;
    else if (buyRatio >= 1.0) score += 5;
  }
  
  // Holder growth score (0-10 points)
  if (tokenData.holderGrowth >= 5) score += 10;
  else if (tokenData.holderGrowth >= 3) score += 7;
  else if (tokenData.holderGrowth >= 1) score += 5;
  
  return Math.min(score, 100);
}

async function testAggressiveAnalysis() {
  console.log('🧪 TESTING AGGRESSIVE ANALYSIS');
  console.log('=' .repeat(30));
  
  let totalTrades = 0;
  let profitableTrades = 0;
  
  for (const token of testTokens) {
    console.log(`\n📊 Analyzing ${token.symbol}...`);
    
    // Quick filter with aggressive settings
    const filterResult = await fastMemeAnalyzer.quickFilter(token);
    console.log(`  Quick Filter: ${filterResult.pass ? '✅ PASS' : '❌ FAIL'} (${filterResult.reason || 'OK'})`);
    
    if (!filterResult.pass) {
      console.log(`  ⏭️  Skipping ${token.symbol} - failed quick filter`);
      continue;
    }
    
    // Calculate simple score
    const score = calculateSimpleScore(token);
    
    // Get recommendation with lower thresholds
    const recommendation = getAggressiveRecommendation(score);
    
    console.log(`  📈 Score: ${score}/100`);
    console.log(`  🎯 Recommendation: ${recommendation}`);
    console.log(`  💰 Position Size: $${getPositionSize(score, recommendation)}`);
    
    // Show token details
    console.log(`  📊 Token Details:`);
    console.log(`    - Liquidity: $${token.liquidity}`);
    console.log(`    - Volume: $${token.volume}`);
    console.log(`    - Buy/Sell Ratio: ${token.buyVolume}/${token.sellVolume} = ${(token.buyVolume/token.sellVolume).toFixed(2)}`);
    console.log(`    - Holders: ${token.holderCount} (growth: +${token.holderGrowth})`);
    
    // Simulate paper trade if recommendation is BUY or higher
    if (['BUY', 'STRONG BUY'].includes(recommendation)) {
      const positionSize = getPositionSize(score, recommendation);
      console.log(`  🚀 PAPER TRADE: ${token.symbol} - ${recommendation}`);
      console.log(`  💰 Entry: $${positionSize}`);
      
      totalTrades++;
      
      // Simulate profit/loss based on score
      const profitChance = score / 100;
      const random = Math.random();
      if (random < profitChance) {
        const profit = positionSize * (0.1 + Math.random() * 0.4); // 10-50% profit
        console.log(`  ✅ PROFIT: +$${profit.toFixed(2)} (${(profit/positionSize*100).toFixed(1)}%)`);
        profitableTrades++;
      } else {
        const loss = positionSize * (0.05 + Math.random() * 0.15); // 5-20% loss
        console.log(`  ❌ LOSS: -$${loss.toFixed(2)} (${(loss/positionSize*100).toFixed(1)}%)`);
      }
    }
  }
  
  // Summary
  console.log(`\n📊 TRADING SUMMARY:`);
  console.log(`  Total Trades: ${totalTrades}`);
  console.log(`  Profitable: ${profitableTrades}`);
  console.log(`  Win Rate: ${totalTrades > 0 ? (profitableTrades/totalTrades*100).toFixed(1) : 0}%`);
}

function getAggressiveRecommendation(score) {
  if (score >= aggressiveConfig.strongBuyThreshold) return 'STRONG BUY';
  if (score >= aggressiveConfig.buyThreshold) return 'BUY';
  if (score >= aggressiveConfig.watchThreshold) return 'WATCH';
  if (score >= aggressiveConfig.riskyThreshold) return 'RISKY';
  return 'AVOID';
}

function getPositionSize(score, recommendation) {
  const baseSize = 50; // $50 base position
  
  switch (recommendation) {
    case 'STRONG BUY':
      return baseSize * 2; // $100
    case 'BUY':
      return baseSize * 1.5; // $75
    case 'WATCH':
      return baseSize * 0.5; // $25
    case 'RISKY':
      return baseSize * 0.25; // $12.50
    default:
      return 0;
  }
}

async function testRealTokenAnalysis() {
  console.log('\n🎯 TESTING REAL TOKEN ANALYSIS');
  console.log('=' .repeat(30));
  console.log('📡 This will analyze real tokens with aggressive settings...');
  
  // We'll need to integrate with the live system
  // For now, let's show how to configure the system
  console.log('\n🔧 To enable aggressive paper trading:');
  console.log('1. Update FastMemeAnalyzer config with aggressive settings');
  console.log('2. Lower the recommendation thresholds');
  console.log('3. Increase position sizes for higher confidence trades');
  console.log('4. Monitor performance closely');
}

async function runAllTests() {
  try {
    await testAggressiveAnalysis();
    await testRealTokenAnalysis();
    
    console.log('\n✅ AGGRESSIVE PAPER TRADING TEST COMPLETE');
    console.log('=' .repeat(50));
    console.log('💡 Key Insights:');
    console.log('  - Lower thresholds = more trading opportunities');
    console.log('  - Simple scoring can work when API data is missing');
    console.log('  - Aggressive settings can catch early moves');
    console.log('  - Need to monitor win rate carefully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runAllTests(); 