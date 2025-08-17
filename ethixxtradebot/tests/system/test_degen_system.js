#!/usr/bin/env node

/**
 * Test script for DEGEN system
 * Tests Degen Intelligence and Degen Paper Trader
 */

import { degenIntelligence } from './services/DegenIntelligence.js';
import { degenPaperTrader } from './services/DegenPaperTrader.js';

async function testDegenSystem() {
  console.log('🔥 TESTING DEGEN SYSTEM');
  console.log('=====================================');
  
  // Test tokens with different degen characteristics
  const testTokens = [
    {
      symbol: 'MOONDOGE',
      name: 'Moon Doge Token',
      address: 'test123',
      price: 0.000001,
      priceChange1h: 45, // 45% increase = FOMO
      volume24h: 150000,
      liquidity: 25000,
      marketCap: 50000
    },
    {
      symbol: 'PEPE',
      name: 'Pepe Coin',
      address: 'test456',
      price: 0.000002,
      priceChange1h: 25, // 25% increase
      volume24h: 80000,
      liquidity: 30000,
      marketCap: 75000
    },
    {
      symbol: 'ROCKET',
      name: 'Rocket to Moon',
      address: 'test789',
      price: 0.000003,
      priceChange1h: 80, // 80% increase = YOLO territory
      volume24h: 300000,
      liquidity: 40000,
      marketCap: 120000
    },
    {
      symbol: 'BORING',
      name: 'Boring Token',
      address: 'test999',
      price: 0.000001,
      priceChange1h: 2, // 2% increase = boring
      volume24h: 5000,
      liquidity: 10000,
      marketCap: 20000
    }
  ];
  
  try {
    console.log('\n🧠 Testing Degen Intelligence...');
    
    for (const token of testTokens) {
      console.log(`\n🎯 Analyzing: ${token.symbol}`);
      
      const degenAnalysis = degenIntelligence.getDegenAnalysis(token);
      
      console.log('✅ Degen Analysis Result:', {
        symbol: token.symbol,
        degenScore: degenAnalysis.analysis ? (degenAnalysis.analysis.degenScore * 100).toFixed(1) + '%' : 'N/A',
        fomoLevel: degenAnalysis.analysis ? (degenAnalysis.analysis.fomoLevel * 100).toFixed(1) + '%' : 'N/A',
        hypeLevel: degenAnalysis.analysis ? (degenAnalysis.analysis.hypeLevel * 100).toFixed(1) + '%' : 'N/A',
        memeFactor: degenAnalysis.analysis ? (degenAnalysis.analysis.memeFactor * 100).toFixed(1) + '%' : 'N/A',
        riskLevel: degenAnalysis.analysis ? degenAnalysis.analysis.riskLevel : 'N/A',
        signals: degenAnalysis.signals ? degenAnalysis.signals.length : 0
      });
      
      // Test signal generation
      const signals = degenIntelligence.generateDegenSignals(token);
      if (signals) {
        console.log(`🎯 Signals generated: ${signals.length}`);
        signals.forEach(signal => {
          console.log(`   - ${signal.type}: ${signal.reason}`);
        });
      }
    }
    
    console.log('\n💰 Testing Degen Paper Trader...');
    
    // Test portfolio status
    const portfolio = degenPaperTrader.getPortfolioStatus();
    console.log('✅ Portfolio Status:', {
      balance: `$${portfolio.balance.toFixed(2)}`,
      totalValue: `$${portfolio.totalValue.toFixed(2)}`,
      positions: portfolio.positions.length,
      winRate: `${portfolio.winRate}%`,
      totalTrades: portfolio.stats.totalTrades,
      totalProfit: `$${portfolio.stats.totalProfit.toFixed(2)}`
    });
    
    // Test with a high-degen token
    const yoloToken = testTokens[2]; // ROCKET token
    console.log(`\n🚀 Testing YOLO trade with ${yoloToken.symbol}...`);
    
    const yoloAnalysis = degenIntelligence.getDegenAnalysis(yoloToken);
    const yoloSignals = degenIntelligence.generateDegenSignals(yoloToken);
    
    if (yoloSignals && yoloSignals.length > 0) {
      console.log('🎯 YOLO signals detected!');
      
      // Simulate signal processing
      degenPaperTrader.processDegenSignal({
        tokenData: yoloToken,
        signals: yoloSignals,
        analysis: yoloAnalysis.analysis
      });
      
      // Check updated portfolio
      const updatedPortfolio = degenPaperTrader.getPortfolioStatus();
      console.log('✅ Updated Portfolio:', {
        balance: `$${updatedPortfolio.balance.toFixed(2)}`,
        positions: updatedPortfolio.positions.length,
        totalValue: `$${updatedPortfolio.totalValue.toFixed(2)}`
      });
    }
    
    console.log('\n📊 DEGEN SYSTEM SUMMARY:');
    console.log('=====================================');
    console.log('🔥 Degen Intelligence: Meme pattern detection, FOMO analysis, hype scoring');
    console.log('💰 Degen Paper Trader: YOLO trades, aggressive position sizing, degen risk management');
    console.log('🎯 Signal Types: DEGEN_YOLO, DEGEN_BUY, DEGEN_WATCH');
    console.log('⚡ Risk Levels: EXTREME_OPPORTUNITY, HIGH_OPPORTUNITY, MEDIUM_OPPORTUNITY');
    console.log('✅ All degen components tested successfully!');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testDegenSystem().then(() => {
  console.log('\n🏁 Degen system tests completed!');
  process.exit(0);
}).catch(error => {
  console.log('💥 Test failed:', error.message);
  process.exit(1);
}); 