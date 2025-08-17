/**
 * Simple RPC Test Script
 * Tests the Helius RPC connection and performance
 */

import PremiumRPCManager from '../utils/PremiumRPC.js';

async function testRPC() {
  console.log('🚀 Testing Helius RPC Connection...');
  
  try {
    const rpcManager = new PremiumRPCManager();
    await rpcManager.init();
    
    console.log('✅ RPC Connection established');
    
    // Test speed 3 times
    const speeds = [];
    for (let i = 1; i <= 3; i++) {
      console.log(`⏱️ Speed Test ${i}/3...`);
      const result = await rpcManager.testRPCSpeed();
      speeds.push(result.responseTime);
      console.log(`   Response Time: ${result.responseTime}ms`);
    }
    
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    console.log(`\n📊 Average Speed: ${avgSpeed.toFixed(1)}ms`);
    console.log(`🏃 Performance: ${avgSpeed < 200 ? 'EXCELLENT' : avgSpeed < 500 ? 'GOOD' : 'NEEDS_IMPROVEMENT'}`);
    
    await rpcManager.disconnect();
    
    console.log('\n✅ RPC test completed successfully!');
    
  } catch (error) {
    console.error('❌ RPC test failed:', error.message);
    process.exit(1);
  }
}

testRPC(); 