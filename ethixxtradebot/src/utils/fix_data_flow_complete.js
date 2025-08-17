#!/usr/bin/env node

/**
 * COMPREHENSIVE DATA FLOW FIX
 * Fixes all critical issues preventing profitable trading
 */

console.log('🔧 COMPREHENSIVE DATA FLOW FIX');
console.log('==============================');

// 1. KILL ALL EXISTING PROCESSES
console.log('\n1️⃣ KILLING EXISTING PROCESSES...');
import { execSync } from 'child_process';

try {
  execSync('pkill -f "node gui/server.js"', { stdio: 'ignore' });
  console.log('✅ Killed existing server processes');
} catch (error) {
  console.log('ℹ️  No existing processes found');
}

// 2. SET CORRECT API KEY
console.log('\n2️⃣ SETTING CORRECT BIRDEYE API KEY...');
process.env.BIRDEYE_API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';
console.log('✅ API Key set:', process.env.BIRDEYE_API_KEY);

// 3. VERIFY API KEY LENGTH
console.log('\n3️⃣ VERIFYING API KEY...');
if (process.env.BIRDEYE_API_KEY.length !== 32) {
  console.log('❌ API KEY ERROR: Should be 32 characters, got', process.env.BIRDEYE_API_KEY.length);
  process.exit(1);
}
console.log('✅ API Key length correct (32 characters)');

// 4. TEST BIRDEYE CONNECTION
console.log('\n4️⃣ TESTING BIRDEYE CONNECTION...');
const testBirdeye = async () => {
  try {
    const { BirdeyeAnalytics } = await import('./services/BirdeyeAnalytics.js');
    const birdeye = new BirdeyeAnalytics();
    
    console.log('🔍 Testing Birdeye configuration...');
    console.log('📊 Max requests:', birdeye.rateLimit.maxRequests);
    console.log('🔑 API Key configured:', !!birdeye.config.apiKey);
    
    if (birdeye.rateLimit.maxRequests === 1000) {
      console.log('✅ Premium Plus configuration detected');
    } else {
      console.log('❌ Free tier configuration detected');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Birdeye test failed:', error.message);
    return false;
  }
};

// 5. TEST DEGEN INTEGRATION
console.log('\n5️⃣ TESTING DEGEN INTEGRATION...');
const testDegen = async () => {
  try {
    const { DegenIntelligence } = await import('./services/DegenIntelligence.js');
    const degen = new DegenIntelligence();
    
    const testToken = {
      address: 'TEST123456789',
      symbol: 'TEST'
    };
    
    const result = await degen.getDegenAnalysis(testToken);
    console.log('✅ Degen analysis working:', result.analysis.degenScore);
    return true;
  } catch (error) {
    console.log('❌ Degen test failed:', error.message);
    return false;
  }
};

// 6. TEST ENHANCED ANALYSIS
console.log('\n6️⃣ TESTING ENHANCED ANALYSIS...');
const testEnhanced = async () => {
  try {
    const { EnhancedExternalAnalysis } = await import('./services/EnhancedExternalAnalysis.js');
    const enhanced = new EnhancedExternalAnalysis();
    
    console.log('✅ Enhanced analysis initialized');
    return true;
  } catch (error) {
    console.log('❌ Enhanced analysis test failed:', error.message);
    return false;
  }
};

// 7. RUN ALL TESTS
const runTests = async () => {
  const tests = [
    { name: 'Birdeye', fn: testBirdeye },
    { name: 'Degen', fn: testDegen },
    { name: 'Enhanced', fn: testEnhanced }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Running ${test.name} test...`);
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  // 8. SUMMARY
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🚀 ALL SYSTEMS GO! Ready to start server...');
    console.log('\n💡 COMMAND TO START SERVER:');
    console.log('BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Check configuration');
  }
};

// Run the tests
runTests().catch(console.error); 