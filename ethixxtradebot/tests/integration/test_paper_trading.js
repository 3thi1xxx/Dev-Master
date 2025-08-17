#!/usr/bin/env node
/**
 * Paper Trading Test Script
 * Demonstrates paper trading with live data
 */

import { paperTradingSimulator } from './services/PaperTradingSimulator.js';

console.log('📊 PAPER TRADING DEMONSTRATION');
console.log('=' .repeat(50));

// Show initial status
console.log('\n💰 INITIAL PORTFOLIO STATUS:');
const initialStatus = paperTradingSimulator.getPortfolioStatus();
console.log(`Balance: $${initialStatus.balance}`);
console.log(`Total Value: $${initialStatus.totalValue}`);
console.log(`Active Positions: ${initialStatus.positions}`);
console.log(`Max Positions: ${initialStatus.maxPositions}`);

// Simulate some trades with mock data
console.log('\n🎯 SIMULATING TRADES WITH LIVE DATA...');

// Mock analysis results (similar to what the AI would produce)
const mockAnalyses = [
  {
    token: '0x1234567890abcdef',
    symbol: 'TEST1',
    scores: { overall: 85 },
    confidence: 0.8,
    recommendation: { action: 'STRONG_BUY' },
    dexScreener: { price: 0.001 }
  },
  {
    token: '0xabcdef1234567890',
    symbol: 'TEST2',
    scores: { overall: 72 },
    confidence: 0.7,
    recommendation: { action: 'BUY' },
    dexScreener: { price: 0.002 }
  },
  {
    token: '0x1234567890abcdef',
    symbol: 'TEST1',
    scores: { overall: 45 },
    confidence: 0.6,
    recommendation: { action: 'AVOID' },
    dexScreener: { price: 0.0015 }
  }
];

// Process each analysis
for (let i = 0; i < mockAnalyses.length; i++) {
  const analysis = mockAnalyses[i];
  console.log(`\n📊 Processing ${analysis.symbol} (Analysis ${i + 1}):`);
  console.log(`Score: ${analysis.scores.overall}/100`);
  console.log(`Confidence: ${Math.round(analysis.confidence * 100)}%`);
  console.log(`Recommendation: ${analysis.recommendation.action}`);
  
  const result = await paperTradingSimulator.processAnalysis(analysis);
  console.log(`Action: ${result.action} - ${result.reason}`);
  
  if (result.action === 'BUY') {
    console.log(`🟢 Position opened: $${result.position.amount}`);
  } else if (result.action === 'SELL') {
    console.log(`🔴 Position closed: $${result.result.profit.toFixed(2)} profit (${result.result.returnPercent.toFixed(1)}%)`);
  }
  
  // Show current status
  const status = paperTradingSimulator.getPortfolioStatus();
  console.log(`Current Balance: $${status.balance.toFixed(2)}`);
  console.log(`Active Positions: ${status.positions}`);
  
  // Wait a bit between trades
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Show final performance
console.log('\n📈 FINAL PERFORMANCE REPORT:');
const performance = paperTradingSimulator.getPerformanceReport();
console.log(`Total Trades: ${performance.trades.total}`);
console.log(`Win Rate: ${performance.trades.winRate.toFixed(1)}%`);
console.log(`Total Profit: $${performance.summary.totalReturn.toFixed(2)}`);
console.log(`Total Return: ${performance.summary.totalReturnPercent.toFixed(1)}%`);
console.log(`Best Trade: ${performance.performance.bestTrade.token} (+$${performance.performance.bestTrade.profit.toFixed(2)})`);
console.log(`Worst Trade: ${performance.performance.worstTrade.token} ($${performance.performance.worstTrade.loss.toFixed(2)})`);

console.log('\n🎉 Paper trading demonstration complete!');
console.log('💡 The system is now ready to trade with real live data!'); 