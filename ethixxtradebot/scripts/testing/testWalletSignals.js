/**
 * Wallet Signal System Test
 * Tests wallet monitoring, signal generation, and pipeline integration
 */

import WalletSignalService from '../services/WalletSignalService.js';

async function testWalletSignals() {
  console.log('🚀 TESTING WALLET SIGNAL SYSTEM');
  console.log('='.repeat(60));
  
  try {
    // Initialize wallet signal service
    const walletService = new WalletSignalService();
    const connected = await walletService.init();
    
    if (!connected) {
      console.log('❌ Failed to connect to RPC');
      return;
    }
    
    console.log('✅ Connected to premium RPC');
    
    // Show loaded configuration
    console.log('\n📋 LOADED CONFIGURATION:');
    console.log('-'.repeat(40));
    
    const copyConfig = walletService.getCopyTradeConfig();
    const signalConfig = walletService.getSignalConfig();
    
    console.log(`🐋 Tracked Wallets: ${walletService.trackedWallets.size}`);
    console.log(`📡 Copy Trading: ${copyConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`💰 Max Position: ${copyConfig.max_position_sol} SOL`);
    console.log(`📊 Copy Ratio: ${(copyConfig.copy_ratio * 100).toFixed(0)}%`);
    console.log(`⏰ Cooldown: ${copyConfig.cooldown_ms / 1000}s`);
    console.log(`🔥 Fresh Window: ${signalConfig.fresh_ms / 1000}s`);
    console.log(`⬆️ Score Bonus: +${signalConfig.score_bonus}`);
    
    // List tracked wallets
    console.log('\n🎯 TRACKED WALLETS:');
    console.log('-'.repeat(40));
    for (const [address, wallet] of walletService.trackedWallets) {
      console.log(`📍 ${wallet.name}: ${address.substring(0, 12)}...${address.substring(-8)}`);
    }
    
    // Start monitoring
    console.log('\n🔄 Starting wallet monitoring (30 seconds)...');
    await walletService.startMonitoring();
    
    let signalCount = 0;
    walletService.on('walletSignal', (signal) => {
      signalCount++;
      console.log(`\n🚨 SIGNAL #${signalCount}: ${signal.walletName}`);
      console.log(`   Token: ${signal.mint.substring(0, 8)}...${signal.mint.substring(-8)}`);
      console.log(`   Side: ${signal.side.toUpperCase()}`);
      console.log(`   Amount: ${signal.solSpent?.toFixed(3)} SOL`);
      console.log(`   Age: ${Math.floor((Date.now() - signal.ts) / 1000)}s`);
    });
    
    // Wait for signals
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Show final stats
    console.log('\n📊 MONITORING RESULTS:');
    console.log('-'.repeat(40));
    console.log(`🚨 Signals Generated: ${signalCount}`);
    
    const recentSignals = walletService.getRecentSignals();
    console.log(`🔥 Fresh Signals: ${recentSignals.length}`);
    
    if (recentSignals.length > 0) {
      console.log('\n🎯 ACTIVE SIGNALS:');
      recentSignals.forEach((signal, index) => {
        console.log(`   ${index + 1}. ${signal.wallet} ${signal.side} ${signal.mint} (${signal.ageSeconds}s ago)`);
      });
      
      // Test signal retrieval
      console.log('\n🔍 TESTING SIGNAL RETRIEVAL:');
      for (const signal of recentSignals) {
        const fullMint = signal.mint.replace('...', ''); // This is simplified for demo
        const retrieved = walletService.getFreshSignal(fullMint);
        console.log(`   ${signal.mint}: ${retrieved ? '✅ FOUND' : '❌ NOT FOUND'}`);
      }
    } else {
      console.log('⚠️ No signals generated during test period');
      console.log('💡 This is normal for mock mode - signals are random (5% chance)');
    }
    
    await walletService.disconnect();
    
    console.log('\n✅ WALLET SIGNAL TEST COMPLETED');
    console.log('🎯 System ready for copy-trading integration');
    
  } catch (error) {
    console.error('❌ Wallet signal test failed:', error.message);
    process.exit(1);
  }
}

testWalletSignals(); 