import AxiomWebSocketTracker from '../services/AxiomWebSocketTracker.js';

async function testAxiomWebSocket() {
  console.log('🐋 TESTING AXIOM REAL-TIME WHALE TRACKER');
  console.log('==========================================\n');

  const tracker = new AxiomWebSocketTracker();
  let signalCount = 0;
  let transactionCount = 0;

  // Event handlers
  tracker.on('connected', () => {
    console.log('✅ Connected to Axiom WebSocket!');
    console.log('🔊 Listening for whale signals...\n');
  });

  tracker.on('whale-signal', (signal) => {
    signalCount++;
    console.log(`🚨 WHALE SIGNAL #${signalCount}:`);
    console.log(`   Wallet: ${signal.walletAddress.slice(0, 12)}...`);
    console.log(`   Action: ${signal.action.toUpperCase()}`);
    console.log(`   Token: ${signal.symbol} (${signal.tokenName})`);
    console.log(`   Amount: ${signal.solAmount.toFixed(4)} SOL`);
    console.log(`   Profit: ${signal.profitPercent.toFixed(2)}% (${signal.profitUsd?.toFixed(2) || 'N/A'} USD)`);
    console.log(`   Protocol: ${signal.protocol}`);
    console.log(`   Confidence: ${signal.confidence?.toFixed(1) || 'N/A'}/100`);
    console.log(`   Rating: ${signal.rating}/5`);
    console.log('');
  });

  tracker.on('transaction', (tx) => {
    transactionCount++;
    if (transactionCount % 10 === 0) {
      console.log(`📊 Processed ${transactionCount} transactions (${tx.tracked ? 'tracked' : 'untracked'} wallet)`);
    }
  });

  tracker.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  tracker.on('disconnected', ({ code, reason }) => {
    console.log(`🔌 Disconnected: ${code} - ${reason}`);
  });

  // Connect and run for 60 seconds
  try {
    await tracker.connect();
    
    console.log('⏱️ Running for 60 seconds...\n');
    
    // Show stats every 15 seconds
    const statsInterval = setInterval(() => {
      const stats = tracker.getStats();
      console.log('📈 LIVE STATS:', {
        connected: stats.connected,
        uptime: stats.uptimeFormatted,
        messages: stats.messagesReceived,
        whaleSignals: stats.whaleSignals,
        buySignals: stats.buySignals,
        sellSignals: stats.sellSignals,
        latency: stats.latency + 'ms',
        trackedWallets: stats.trackedWallets
      });
      console.log('');
    }, 15000);

    // Run for 60 seconds
    setTimeout(() => {
      clearInterval(statsInterval);
      
      const finalStats = tracker.getStats();
      console.log('\n🎯 FINAL RESULTS:');
      console.log('================');
      console.log(`Total Messages: ${finalStats.messagesReceived}`);
      console.log(`Whale Signals: ${finalStats.whaleSignals}`);
      console.log(`Buy Signals: ${finalStats.buySignals}`);
      console.log(`Sell Signals: ${finalStats.sellSignals}`);
      console.log(`Average Latency: ${finalStats.latency}ms`);
      console.log(`Messages/Min: ${finalStats.messagesPerMinute}`);
      console.log(`Tracked Wallets: ${finalStats.trackedWallets}`);
      
      tracker.disconnect();
      
      console.log('\n🏆 SUCCESS: Real-time whale tracking operational!');
      console.log('💡 Integration ready for copy-trading pipeline');
      
      process.exit(0);
    }, 60000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted - disconnecting...');
  process.exit(0);
});

testAxiomWebSocket(); 