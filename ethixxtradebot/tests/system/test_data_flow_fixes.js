#!/usr/bin/env node

/**
 * Test Data Flow Fixes
 * Verify Birdeye API key and degen data fixes
 */

// Set the API key as environment variable
process.env.BIRDEYE_API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';

import { BirdeyeAnalytics } from './services/BirdeyeAnalytics.js';
import { EnhancedExternalAnalysis } from './services/EnhancedExternalAnalysis.js';
import { dataFlowMonitor } from './monitor_data_flow.js';

async function testDataFlowFixes() {
  console.log('🔧 TESTING DATA FLOW FIXES');
  console.log('==========================');
  
  // Start monitoring
  dataFlowMonitor.startMonitoring();
  
  // Test 1: Birdeye API Key
  console.log('\n🧪 TEST 1: Birdeye API Key Configuration');
  console.log('==========================================');
  
  const birdeye = new BirdeyeAnalytics();
  console.log(`API Key: ${birdeye.config.apiKey ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`Max Requests: ${birdeye.rateLimit.maxRequests}/min`);
  console.log(`Headers:`, birdeye.headers);
  
  // Test 2: Birdeye API Call
  console.log('\n🧪 TEST 2: Birdeye API Call');
  console.log('============================');
  
  const testToken = 'So11111111111111111111111111111111111111112'; // SOL token
  try {
    const result = await birdeye.analyzeToken(testToken);
    console.log('✅ Birdeye API call successful');
    console.log(`   Security Score: ${result.scores?.security || 'N/A'}/100`);
    console.log(`   Risk Level: ${result.risk?.level || 'N/A'}`);
    dataFlowMonitor.monitorBirdeyeCall(true);
  } catch (error) {
    console.log('❌ Birdeye API call failed:', error.message);
    dataFlowMonitor.monitorBirdeyeCall(false, error.message);
  }
  
  // Test 3: Enhanced Analysis (Degen Data Fix)
  console.log('\n🧪 TEST 3: Enhanced Analysis (Degen Data Fix)');
  console.log('==============================================');
  
  const enhanced = new EnhancedExternalAnalysis();
  try {
    const analysis = await enhanced.analyzeToken(testToken, 'SOL');
    console.log('✅ Enhanced analysis successful');
    console.log(`   Final Score: ${analysis.scores?.overall || 'N/A'}/100`);
    console.log(`   Confidence: ${analysis.confidence || 'N/A'}%`);
    console.log(`   Recommendation: ${analysis.recommendation?.action || 'N/A'}`);
    dataFlowMonitor.monitorAnalysis(testToken, true);
  } catch (error) {
    console.log('❌ Enhanced analysis failed:', error.message);
    dataFlowMonitor.monitorAnalysis(testToken, false, error.message);
  }
  
  // Test 4: Multiple Tokens
  console.log('\n🧪 TEST 4: Multiple Token Analysis');
  console.log('===================================');
  
  const testTokens = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
  ];
  
  for (const token of testTokens) {
    try {
      const result = await birdeye.analyzeToken(token);
      console.log(`✅ ${token}: ${result.scores?.security || 'N/A'}/100`);
      dataFlowMonitor.monitorBirdeyeCall(true);
    } catch (error) {
      console.log(`❌ ${token}: ${error.message}`);
      dataFlowMonitor.monitorBirdeyeCall(false, error.message);
    }
  }
  
  // Generate final report
  console.log('\n📊 FINAL REPORT');
  console.log('===============');
  dataFlowMonitor.generateReport();
  
  // Stop monitoring
  dataFlowMonitor.stopMonitoring();
  
  console.log('\n✅ Data flow fixes test completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.log('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run the test
testDataFlowFixes().catch(error => {
  console.log('❌ Test failed:', error.message);
  process.exit(1);
}); 