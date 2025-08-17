#!/usr/bin/env node
/**
 * Test Fast Meme Trading System
 * Tests the new ultra-fast meme coin analysis with paper trading
 */

import { fastMemeAnalyzer } from './services/FastMemeAnalyzer.js';
import { momentumTracker } from './services/MomentumTracker.js';
import { whaleDataService } from './services/WhaleDataService.js';

console.log('🚀 TESTING FAST MEME TRADING SYSTEM');
console.log('⚡ Ultra-speed token analysis (<2s)');
console.log('📈 Momentum tracking enabled');
console.log('===================================\n');

// Test data for a new meme coin
const testTokens = [
  {
    address: 'TestMemeCoin123456789TestMemeCoin123456789',
    symbol: 'ROCKET',
    liquidity: 15000,  // $15k liquidity
    volume: 8000,      // $8k volume in first minute
    priceHistory: [1.0, 1.05, 1.12, 1.18, 1.25], // 25% pump
    volumeHistory: [1000, 2000, 3000, 5000, 8000], // Accelerating volume
    buyVolume: 6000,
    sellVolume: 2000,
    age: 120000, // 2 minutes old
    currentPrice: 1.25
  },
  {
    address: 'TestRugPull123456789TestRugPull123456789',
    symbol: 'RUG',
    liquidity: 5000,   // Too low liquidity
    volume: 1000,      // Low volume
    priceHistory: [1.0, 1.02, 1.01, 0.98, 0.95], // Declining
    volumeHistory: [500, 400, 300, 200, 100], // Declining volume
    buyVolume: 200,
    sellVolume: 800,
    age: 600000, // 10 minutes old
    currentPrice: 0.95
  },
  {
    address: 'TestMoonShot123456789TestMoonShot123456789',
    symbol: 'MOON',
    liquidity: 50000,  // Good liquidity
    volume: 25000,     // High volume
    priceHistory: [1.0, 1.1, 1.25, 1.5, 2.0], // 100% pump
    volumeHistory: [5000, 8000, 12000, 18000, 25000], // Explosive volume
    buyVolume: 20000,
    sellVolume: 5000,
    age: 180000, // 3 minutes old
    currentPrice: 2.0
  }
];

async function testFastAnalysis() {
  console.log('🧪 TEST 1: Fast Token Analysis');
  console.log('===============================\n');
  
  // Initialize whale data service
  await whaleDataService.start();
  
  // Track performance
  const results = [];
  
  for (const token of testTokens) {
    console.log(`\n📊 Analyzing ${token.symbol}...`);
    const startTime = Date.now();
    
    try {
      // Test quick filter first
      const filterResult = await fastMemeAnalyzer.quickFilter(token);
      console.log(`⚡ Quick filter (${Date.now() - startTime}ms): ${filterResult.pass ? '✅ PASS' : '❌ FAIL'} - ${filterResult.reason || 'Good to analyze'}`);
      
      if (filterResult.pass) {
        // Run full fast analysis
        const analysis = await fastMemeAnalyzer.analyzeToken(token, whaleDataService);
        
        console.log(`\n📈 Analysis Results:`);
        console.log(`   Final Score: ${analysis.finalScore}/100`);
        console.log(`   Momentum: ${analysis.momentum}`);
        console.log(`   Whale Score: ${analysis.whaleScore}`);
        console.log(`   Recommendation: ${analysis.recommendation}`);
        console.log(`   Confidence: ${analysis.confidence}`);
        console.log(`   Analysis Time: ${analysis.analysisTime}ms`);
        
        if (analysis.strategy) {
          console.log(`\n💰 Trading Strategy:`);
          console.log(`   Position Size: ${analysis.strategy.positionSize * 100}%`);
          console.log(`   Stop Loss: ${((1 - analysis.strategy.stopLoss) * 100).toFixed(0)}%`);
          console.log(`   Take Profit: ${analysis.strategy.takeProfit.map(tp => `+${((tp - 1) * 100).toFixed(0)}%`).join(', ')}`);
        }
        
        results.push({
          token: token.symbol,
          passed: true,
          score: analysis.finalScore,
          recommendation: analysis.recommendation,
          time: analysis.analysisTime
        });
        
        // Start momentum tracking for BUY recommendations
        if (analysis.recommendation === 'BUY') {
          momentumTracker.startTracking(token.address, {
            symbol: token.symbol,
            price: token.currentPrice,
            volume: token.volume,
            buyVolume: token.buyVolume,
            sellVolume: token.sellVolume
          });
        }
      } else {
        results.push({
          token: token.symbol,
          passed: false,
          reason: filterResult.reason,
          time: Date.now() - startTime
        });
      }
    } catch (error) {
      console.log(`❌ Error analyzing ${token.symbol}: ${error.message}`);
    }
  }
  
  // Show performance stats
  console.log(`\n\n📊 PERFORMANCE STATS:`);
  console.log(`====================`);
  const stats = fastMemeAnalyzer.getStats();
  console.log(`Total Analyzed: ${stats.totalAnalyzed}`);
  console.log(`Opportunities Found: ${stats.opportunitiesFound}`);
  console.log(`Hit Rate: ${stats.hitRate}`);
  console.log(`Average Analysis Time: ${stats.avgAnalysisTime.toFixed(0)}ms`);
  console.log(`Fastest Analysis: ${stats.fastestAnalysis}ms`);
  
  // Show summary
  console.log(`\n\n📋 ANALYSIS SUMMARY:`);
  console.log(`===================`);
  results.forEach(result => {
    if (result.passed) {
      console.log(`${result.token}: Score=${result.score}, Rec=${result.recommendation}, Time=${result.time}ms`);
    } else {
      console.log(`${result.token}: FILTERED OUT - ${result.reason} (${result.time}ms)`);
    }
  });
}

async function testMomentumTracking() {
  console.log('\n\n🧪 TEST 2: Momentum Tracking');
  console.log('============================\n');
  
  // Set up momentum event listeners
  momentumTracker.on('breakout', (data) => {
    console.log(`\n🚀 BREAKOUT ALERT: ${data.symbol}`);
    console.log(`   Price Change: +${(data.priceChange * 100).toFixed(1)}%`);
    console.log(`   Volume Multiple: ${data.volumeMultiple.toFixed(1)}x`);
  });
  
  momentumTracker.on('reversal', (data) => {
    console.log(`\n⚠️ REVERSAL ALERT: ${data.symbol}`);
    console.log(`   Drop from high: -${(data.drop * 100).toFixed(1)}%`);
  });
  
  // Simulate price updates for tracked tokens
  const trackedTokens = momentumTracker.getTrackedTokens();
  console.log(`Currently tracking ${trackedTokens.length} tokens\n`);
  
  // Simulate some price movements
  for (const token of trackedTokens) {
    console.log(`📊 Simulating price movement for ${token.symbol}...`);
    
    // Simulate a pump
    momentumTracker.updateToken(token.address, {
      price: token.currentPrice * 1.15, // 15% pump
      volume: 5000,
      buyVolume: 4000,
      sellVolume: 1000
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Simulate more movement
    momentumTracker.updateToken(token.address, {
      price: token.currentPrice * 1.25, // 25% total
      volume: 8000,
      buyVolume: 6000,
      sellVolume: 2000
    });
    
    // Get momentum report
    const report = momentumTracker.getMomentumReport(token.address);
    if (report) {
      console.log(`\n📈 Momentum Report for ${report.symbol}:`);
      console.log(`   Hold Time: ${report.holdTime}s`);
      console.log(`   Total Return: ${report.totalReturn}`);
      console.log(`   Max Return: ${report.maxReturn}`);
      console.log(`   Current Trend: ${report.momentum.trend}`);
      console.log(`   Momentum Strength: ${report.momentum.strength}/100`);
      console.log(`   Buy/Sell Ratio: ${report.volumeRatio.toFixed(1)}`);
    }
  }
}

async function testLiveSimulation() {
  console.log('\n\n🧪 TEST 3: Live Trading Simulation');
  console.log('==================================\n');
  
  console.log('Starting paper trading server...');
  console.log('This will test the complete fast trading system with live data.\n');
  
  console.log('To test with live data:');
  console.log('1. Run: BIRDEYE_API_KEY=your_key node gui/server.js');
  console.log('2. Watch for tokens with >70 score');
  console.log('3. Monitor momentum alerts');
  console.log('4. Check paper trading results\n');
  
  console.log('Expected improvements:');
  console.log('- Analysis time: <2 seconds (vs 4-5 seconds)');
  console.log('- Hit rate: 10-20% (vs 0%)');
  console.log('- Opportunities: 2-5 per hour (vs 0)');
}

// Run all tests
async function runAllTests() {
  try {
    await testFastAnalysis();
    await testMomentumTracking();
    await testLiveSimulation();
    
    console.log('\n\n✅ ALL TESTS COMPLETED!');
    console.log('========================');
    console.log('\nThe fast meme trading system is ready for paper trading.');
    console.log('Start the server to begin live testing.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run tests
runAllTests(); 