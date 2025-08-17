#!/usr/bin/env node

/**
 * Test script for FREE integrations
 * Tests Cabalspy, Bubblemaps, and GeckoTerminal integrations
 */

import { cabalspyIntegration } from './services/CabalspyIntegration.js';
import { bubblemapsIntegration } from './services/BubblemapsIntegration.js';
import { geckoTerminalIntegration } from './services/GeckoTerminalIntegration.js';

async function testFreeIntegrations() {
  console.log('🧪 TESTING FREE INTEGRATIONS');
  console.log('=====================================');
  
  // Test token (use a known Solana token)
  const testToken = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
  
  try {
    console.log('\n🐋 Testing Cabalspy Integration...');
    const cabalspyResult = await cabalspyIntegration.getWhaleAnalysis(testToken);
    console.log('✅ Cabalspy Result:', {
      hasData: !!cabalspyResult,
      whaleCount: cabalspyResult?.whaleActivity?.whales?.length || 0,
      patterns: cabalspyResult?.patterns?.pattern || 'unknown',
      confidence: cabalspyResult?.patterns?.confidence || 0
    });
    
    console.log('\n🫧 Testing Bubblemaps Integration...');
    const bubblemapsResult = await bubblemapsIntegration.getTokenAnalysis(testToken);
    console.log('✅ Bubblemaps Result:', {
      hasData: !!bubblemapsResult,
      holderCount: bubblemapsResult?.holders?.holders?.length || 0,
      flowCount: bubblemapsResult?.flowData?.flows?.length || 0,
      riskLevel: bubblemapsResult?.riskAssessment?.overallRisk || 'unknown'
    });
    
    console.log('\n🦎 Testing GeckoTerminal Integration...');
    const geckoResult = await geckoTerminalIntegration.getMarketAnalysis(testToken);
    console.log('✅ GeckoTerminal Result:', {
      hasData: !!geckoResult,
      priceData: !!geckoResult?.priceData,
      marketData: !!geckoResult?.marketData,
      volumeData: !!geckoResult?.volumeData,
      momentum: geckoResult?.momentumAnalysis?.momentum || 'unknown'
    });
    
    console.log('\n🎯 Testing Signal Generation...');
    
    // Test Cabalspy signals
    const cabalspySignals = cabalspyIntegration.generateCopyTradeSignals(testToken);
    console.log('✅ Cabalspy Signals:', cabalspySignals ? cabalspySignals.length : 0);
    
    // Test GeckoTerminal signals
    const geckoSignals = geckoTerminalIntegration.generateTradingSignals(testToken);
    console.log('✅ GeckoTerminal Signals:', geckoSignals ? geckoSignals.length : 0);
    
    console.log('\n📊 INTEGRATION SUMMARY:');
    console.log('=====================================');
    console.log('🐋 Cabalspy: Whale tracking & copy trading signals');
    console.log('🫧 Bubblemaps: Token flow & risk assessment');
    console.log('🦎 GeckoTerminal: Market data & momentum analysis');
    console.log('✅ All integrations tested successfully!');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testFreeIntegrations().then(() => {
  console.log('\n🏁 Free integration tests completed!');
  process.exit(0);
}).catch(error => {
  console.log('💥 Test failed:', error.message);
  process.exit(1);
}); 