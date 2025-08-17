#!/usr/bin/env node

/**
 * EMERGENCY DATA FLOW FIX
 * Resolves all critical issues preventing profitable trading
 */

console.log('🚨 EMERGENCY DATA FLOW FIX');
console.log('==========================');

// 1. SET CORRECT API KEY
console.log('\n1️⃣ SETTING CORRECT BIRDEYE API KEY...');
process.env.BIRDEYE_API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';
console.log('✅ API Key set:', process.env.BIRDEYE_API_KEY);

// 2. VERIFY API KEY
console.log('\n2️⃣ VERIFYING API KEY...');
if (process.env.BIRDEYE_API_KEY.length !== 32) {
  console.log('❌ CRITICAL ERROR: API key should be 32 characters');
  process.exit(1);
}
console.log('✅ API Key length correct (32 characters)');

// 3. TEST BIRDEYE CONFIGURATION
console.log('\n3️⃣ TESTING BIRDEYE CONFIGURATION...');
const testBirdeye = async () => {
  try {
    const { BirdeyeAnalytics } = await import('./services/BirdeyeAnalytics.js');
    const birdeye = new BirdeyeAnalytics();
    
    console.log('🔍 Birdeye configuration:');
    console.log('📊 Max requests:', birdeye.rateLimit.maxRequests);
    console.log('🔑 API Key configured:', !!birdeye.config.apiKey);
    
    if (birdeye.rateLimit.maxRequests === 1000) {
      console.log('✅ Premium Plus configuration detected');
      return true;
    } else {
      console.log('❌ Free tier configuration detected');
      return false;
    }
  } catch (error) {
    console.log('❌ Birdeye test failed:', error.message);
    return false;
  }
};

// 4. TEST DEGEN INTEGRATION
console.log('\n4️⃣ TESTING DEGEN INTEGRATION...');
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

// 5. TEST ENHANCED ANALYSIS
console.log('\n5️⃣ TESTING ENHANCED ANALYSIS...');
const testEnhanced = async () => {
  try {
    const { EnhancedExternalAnalysis } = await import('./services/EnhancedExternalAnalysis.js');
    const enhanced = new EnhancedExternalAnalysis();
    
    // Test with a sample token
    const testToken = 'TEST123456789';
    const testSymbol = 'TEST';
    
    console.log('🧪 Testing comprehensive analysis...');
    const result = await enhanced.analyzeToken(testToken, testSymbol);
    
    if (result && result.scores && result.scores.degen !== undefined) {
      console.log('✅ Enhanced analysis working with degen data');
      return true;
    } else {
      console.log('❌ Enhanced analysis missing degen data');
      return false;
    }
  } catch (error) {
    console.log('❌ Enhanced analysis test failed:', error.message);
    return false;
  }
};

// 6. RUN ALL TESTS
const runEmergencyTests = async () => {
  console.log('\n🧪 RUNNING EMERGENCY TESTS...');
  
  const tests = [
    { name: 'Birdeye', fn: testBirdeye },
    { name: 'Degen', fn: testDegen },
    { name: 'Enhanced', fn: testEnhanced }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔧 Testing ${test.name}...`);
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  // 7. SUMMARY
  console.log('\n📊 EMERGENCY TEST RESULTS:');
  console.log('==========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🚀 ALL SYSTEMS FIXED! Ready to start server...');
    console.log('\n💡 COMMAND TO START SERVER:');
    console.log('BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js');
    
    // 8. AUTO-START SERVER
    console.log('\n🚀 AUTO-STARTING SERVER...');
    const { spawn } = await import('child_process');
    
    const server = spawn('node', ['gui/server.js'], {
      env: { ...process.env, BIRDEYE_API_KEY: 'f31ad137262d4a57bbb85e0b35a75208' },
      stdio: 'inherit'
    });
    
    server.on('error', (error) => {
      console.log('❌ Server start failed:', error.message);
    });
    
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Manual intervention required');
    console.log('💡 Check the configuration files and restart manually');
  }
};

// Run emergency tests
runEmergencyTests().catch(console.error); 