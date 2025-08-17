#!/usr/bin/env node
/**
 * Test External Analysis on Real Token
 * Demonstrates decision-making with real external data
 */

import { externalAnalysis } from './services/ExternalAnalysisIntegrator.js';

async function testAnalysis() {
  console.log('🧪 TESTING EXTERNAL ANALYSIS ON REAL TOKEN');
  console.log('=' .repeat(60));
  
  // Test with a known Solana token (example: a popular meme coin)
  const testToken = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'; // Example token address
  const testSymbol = 'RAY'; // Raydium token for testing
  
  console.log(`🔍 Analyzing: ${testSymbol} (${testToken})`);
  console.log('📊 Gathering data from multiple sources...');
  console.log('');
  
  try {
    const result = await externalAnalysis.analyzeToken(testToken, testSymbol);
    
    if (result.analysis) {
      console.log('📈 ANALYSIS RESULTS:');
      console.log(`Token: ${result.analysis.symbol}`);
      console.log(`Overall Score: ${result.analysis.scores.overall}/100`);
      console.log(`Liquidity Score: ${result.analysis.scores.liquidity}/100`);
      console.log(`Volume Score: ${result.analysis.scores.volume}/100`);
      console.log(`Momentum Score: ${result.analysis.scores.momentum}/100`);
      console.log(`Social Score: ${result.analysis.scores.social}/100`);
      console.log(`Risk Score: ${result.analysis.scores.risk}/100`);
      
      if (result.analysis.flags.length > 0) {
        console.log(`⚠️ Flags: ${result.analysis.flags.join(', ')}`);
      }
      
      console.log('');
      console.log('🎯 TRADING DECISION:');
      console.log(`Recommendation: ${result.decision.recommendation}`);
      console.log(`Confidence: ${Math.round(result.decision.confidence * 100)}%`);
      console.log(`Reason: ${result.decision.reason}`);
      console.log(`Suggested Position: ${result.decision.suggestedPosition}`);
      console.log(`Timeframe: ${result.decision.timeframe}`);
      
      if (result.analysis.data.dexScreener) {
        console.log('');
        console.log('📊 DEXSCREENER DATA:');
        const dex = result.analysis.data.dexScreener;
        console.log(`Price: $${dex.price}`);
        console.log(`Liquidity: $${dex.liquidity?.toLocaleString()}`);
        console.log(`24h Volume: $${dex.volume24h?.toLocaleString()}`);
        console.log(`24h Change: ${dex.priceChange24h?.toFixed(2)}%`);
        console.log(`Market Cap: $${dex.marketCap?.toLocaleString()}`);
      }
      
    } else {
      console.log('❌ Analysis failed or no data available');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testAnalysis(); 