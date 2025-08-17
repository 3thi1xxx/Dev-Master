import GatewayOptimizer from '../utils/GatewayOptimizer.js';

async function testGatewayOptimizer() {
  console.log('🌐 TESTING GATEWAY OPTIMIZER SYSTEM');
  console.log('=====================================\n');

  try {
    const optimizer = new GatewayOptimizer();
    
    console.log('🔍 Phase 1: Gateway Discovery');
    await optimizer.init();
    
    console.log('\n📊 Phase 2: Performance Analysis');
    const stats = optimizer.getGatewayStats();
    console.log('Gateway Statistics:', {
      total: stats.total,
      available: stats.available,
      healthy: stats.healthy,
      avgLatency: Math.round(stats.avgLatency) + 'ms',
      best: stats.best,
      bestLatency: stats.bestLatency + 'ms'
    });

    console.log('\n🎯 Phase 3: Optimal Configuration');
    const config = optimizer.getOptimalAxiomConfig();
    if (config) {
      console.log('Optimal Config:', {
        baseURL: config.baseURL,
        region: config.region,
        latency: config.latency + 'ms',
        health: config.health,
        timeout: config.timeout + 'ms'
      });
    } else {
      console.log('❌ No optimal gateway found');
    }

    console.log('\n🔄 Phase 4: Re-optimization Test');
    await optimizer.forceReoptimize();
    
    console.log('\n✅ GATEWAY OPTIMIZER TEST COMPLETED');
    
    // Integration guidance
    console.log('\n💡 INTEGRATION INSTRUCTIONS:');
    console.log('1. Import: import GatewayOptimizer from "./utils/GatewayOptimizer.js"');
    console.log('2. Initialize: const optimizer = new GatewayOptimizer(); await optimizer.init();');
    console.log('3. Use optimal URL: const baseURL = optimizer.getOptimalBaseURL();');
    console.log('4. Get full config: const config = optimizer.getOptimalAxiomConfig();');

  } catch (error) {
    console.error('❌ Gateway optimizer test failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Gateway optimizer test interrupted');
  process.exit(0);
});

testGatewayOptimizer(); 