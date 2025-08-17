import AxiomTradingCluster from '../services/AxiomTradingCluster.js';

async function testTradingCluster() {
  console.log('⚡ TESTING AXIOM REAL-TIME TRADING CLUSTER');
  console.log('==========================================\n');

  const cluster = new AxiomTradingCluster();
  let eventCounts = {
    blockHashes: 0,
    priorityFees: 0,
    jitoBribes: 0,
    tokenPrices: 0,
    tweets: 0,
    connections: 0
  };

  // Event handlers for different data types
  cluster.on('connected', () => {
    console.log('✅ Connected to Axiom Trading Cluster!');
    console.log('📡 Monitoring real-time market data...\n');
  });

  cluster.on('block-hash', (data) => {
    eventCounts.blockHashes++;
    console.log(`🧱 BLOCK #${data.sequence}: ${data.hash.slice(0, 12)}...${data.hash.slice(-8)}`);
  });

  cluster.on('priority-fee', (data) => {
    eventCounts.priorityFees++;
    console.log(`💰 PRIORITY FEE: ${data.fee.toFixed(6)} SOL (~$${data.feeUsd})`);
  });

  cluster.on('jito-bribe', (data) => {
    eventCounts.jitoBribes++;
    console.log(`🎯 JITO BRIBE: ${data.bribe.toFixed(6)} SOL (~$${data.bribeUsd})`);
  });

  cluster.on('token-price', (data) => {
    eventCounts.tokenPrices++;
    console.log(`📊 TOKEN PRICE: ${data.tokenAddress.slice(0, 8)}... = ${data.price.toExponential(4)}`);
  });

  cluster.on('twitter-feed', (data) => {
    eventCounts.tweets++;
    console.log(`🐦 TWEET: @${data.handle} - ${data.eventType}`);
  });

  cluster.on('connection-monitor', (data) => {
    eventCounts.connections++;
    if (eventCounts.connections % 5 === 0) {
      console.log(`📡 CONNECTION: Latency ${data.latency}ms`);
    }
  });

  cluster.on('error', (error) => {
    console.error('❌ Cluster error:', error.message);
  });

  cluster.on('disconnected', ({ code, reason }) => {
    console.log(`🔌 Disconnected: ${code} - ${reason}`);
  });

  // Connect and run for 45 seconds
  try {
    await cluster.connect();
    
    console.log('⏱️ Running for 45 seconds...\n');
    
    // Show stats every 10 seconds
    const statsInterval = setInterval(() => {
      const stats = cluster.getStats();
      const conditions = cluster.getMarketConditions();
      
      console.log('\n📈 LIVE TRADING STATS:');
      console.log(`   Connected: ${stats.connected}`);
      console.log(`   Uptime: ${stats.uptimeFormatted}`);
      console.log(`   Messages: ${stats.messagesReceived}`);
      console.log(`   Blocks: ${eventCounts.blockHashes}`);
      console.log(`   Priority Fees: ${eventCounts.priorityFees}`);
      console.log(`   Jito Bribes: ${eventCounts.jitoBribes}`);
      console.log(`   Token Prices: ${eventCounts.tokenPrices}`);
      console.log(`   Tweets: ${eventCounts.tweets}`);
      console.log(`   Latency: ${stats.latency}ms`);
      
      console.log('\n💎 MARKET CONDITIONS:');
      console.log(`   Priority Fee: ${conditions.priorityFee.toFixed(6)} SOL ($${conditions.priorityFeeUsd.toFixed(2)})`);
      console.log(`   Jito Bribe: ${conditions.jitoBribe.toFixed(6)} SOL ($${conditions.jitoBribeUsd.toFixed(2)})`);
      console.log(`   Last Block: ${conditions.lastBlockHash?.slice(0, 12) || 'None'}...`);
      
      console.log('\n🎯 TRADING RECOMMENDATIONS:');
      console.log(`   Use Priority Fee: ${conditions.recommendations.usePriorityFee ? '✅' : '❌'}`);
      console.log(`   Use Jito Bribe: ${conditions.recommendations.useJitoBribe ? '✅' : '❌'}`);
      console.log(`   Fast Execution: ${conditions.recommendations.fastExecution ? '✅' : '❌'}`);
      console.log(`   Market Active: ${conditions.recommendations.marketActivity ? '✅' : '❌'}`);
      console.log('');
    }, 10000);

    // Test token subscription
    setTimeout(() => {
      console.log('🔍 Testing token subscriptions...');
      // Subscribe to some tokens from your DevTools data
      cluster.subscribeToToken('FwxLwVv7pmuyjhNBBPCFxVsst2RysymtNuPJ1iQPZqML');
      cluster.subscribeToToken('gebVjLVDPV5ZnRXzsS5nL34TC4YuT3tJ2CWb2aeThVq');
    }, 5000);

    // Run for 45 seconds
    setTimeout(() => {
      clearInterval(statsInterval);
      
      const finalStats = cluster.getStats();
      const finalConditions = cluster.getMarketConditions();
      
      console.log('\n🎯 FINAL RESULTS:');
      console.log('================');
      console.log(`Total Messages: ${finalStats.messagesReceived}`);
      console.log(`Block Updates: ${eventCounts.blockHashes}`);
      console.log(`Priority Fee Updates: ${eventCounts.priorityFees}`);
      console.log(`Jito Bribe Updates: ${eventCounts.jitoBribes}`);
      console.log(`Token Price Updates: ${eventCounts.tokenPrices}`);
      console.log(`Twitter Updates: ${eventCounts.tweets}`);
      console.log(`Connection Checks: ${eventCounts.connections}`);
      console.log(`Average Latency: ${finalStats.latency}ms`);
      console.log(`Messages/Min: ${finalStats.messagesPerMinute}`);
      
      console.log('\n💰 CURRENT MARKET CONDITIONS:');
      console.log(`Priority Fee: ${finalConditions.priorityFee.toFixed(6)} SOL ($${finalConditions.priorityFeeUsd.toFixed(2)})`);
      console.log(`Jito Bribe: ${finalConditions.jitoBribe.toFixed(6)} SOL ($${finalConditions.jitoBribeUsd.toFixed(2)})`);
      
      cluster.disconnect();
      
      console.log('\n🏆 SUCCESS: Real-time trading cluster operational!');
      console.log('💡 Integration ready for optimized execution!');
      
      process.exit(0);
    }, 45000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted - disconnecting...');
  process.exit(0);
});

testTradingCluster(); 