#!/usr/bin/env node
/**
 * Test Aggressive Paper Trading
 * Use more aggressive parameters to see trading action
 */

import { PaperTradingSimulator } from './services/PaperTradingSimulator.js';

console.log('🎯 TESTING AGGRESSIVE PAPER TRADING');
console.log('=' .repeat(45));

// Create a more aggressive simulator
const aggressiveSimulator = new PaperTradingSimulator({
  initialBalance: 1000,
  maxPositionSize: 100, // Larger positions
  minPositionSize: 10,  // Lower minimum
  maxPositions: 10      // More positions
});

console.log('💰 Aggressive Configuration:');
console.log(`   Max Position Size: $${aggressiveSimulator.config.maxPositionSize}`);
console.log(`   Min Position Size: $${aggressiveSimulator.config.minPositionSize}`);
console.log(`   Max Positions: ${aggressiveSimulator.config.maxPositions}`);

// Test with various analysis results
const testAnalyses = [
  {
    token: '0x1111111111111111111111111111111111111111',
    symbol: 'AGGRESSIVE1',
    scores: { overall: 65 }, // Lower threshold
    confidence: 0.6,
    recommendation: { action: 'BUY' },
    dexScreener: { price: 0.001 }
  },
  {
    token: '0x2222222222222222222222222222222222222222',
    symbol: 'AGGRESSIVE2',
    scores: { overall: 55 }, // Even lower
    confidence: 0.5,
    recommendation: { action: 'WATCH' },
    dexScreener: { price: 0.002 }
  },
  {
    token: '0x3333333333333333333333333333333333333333',
    symbol: 'AGGRESSIVE3',
    scores: { overall: 75 },
    confidence: 0.7,
    recommendation: { action: 'STRONG_BUY' },
    dexScreener: { price: 0.003 }
  }
];

async function testAggressiveTrading() {
  console.log('\n🎯 PROCESSING AGGRESSIVE TRADES...');
  
  for (let i = 0; i < testAnalyses.length; i++) {
    const analysis = testAnalyses[i];
    console.log(`\n📊 Processing ${analysis.symbol} (Analysis ${i + 1}):`);
    console.log(`Score: ${analysis.scores.overall}/100`);
    console.log(`Confidence: ${Math.round(analysis.confidence * 100)}%`);
    console.log(`Recommendation: ${analysis.recommendation.action}`);
    
    const result = await aggressiveSimulator.processAnalysis(analysis);
    console.log(`Action: ${result.action} - ${result.reason}`);
    
    if (result.action === 'BUY') {
      console.log(`🟢 Position opened: $${result.position.amount}`);
    } else if (result.action === 'SELL') {
      console.log(`🔴 Position closed: $${result.result.profit.toFixed(2)} profit (${result.result.returnPercent.toFixed(1)}%)`);
    }
    
    // Show current status
    const status = aggressiveSimulator.getPortfolioStatus();
    console.log(`Current Balance: $${status.balance.toFixed(2)}`);
    console.log(`Active Positions: ${status.positions}`);
    
    // Wait a bit between trades
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Show final performance
  console.log('\n📈 AGGRESSIVE PERFORMANCE REPORT:');
  const performance = aggressiveSimulator.getPerformanceReport();
  console.log(`Total Trades: ${performance.trades.total}`);
  console.log(`Win Rate: ${performance.trades.winRate.toFixed(1)}%`);
  console.log(`Total Profit: $${performance.summary.totalReturn.toFixed(2)}`);
  console.log(`Total Return: ${performance.summary.totalReturnPercent.toFixed(1)}%`);
  
  console.log('\n🎉 Aggressive trading test complete!');
  console.log('💡 This shows how the system would trade with more aggressive parameters!');
}

testAggressiveTrading(); 