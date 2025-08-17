/**
 * Enhanced Pipeline Runner
 * Runs the copy-trading enabled pipeline with wallet signal integration
 */

import EnhancedResurrectionPipeline from '../pipelines/EnhancedResurrectionPipeline.js';

async function runEnhancedPipeline() {
  console.log('🚀 STARTING ENHANCED COPY-TRADING PIPELINE');
  console.log('='.repeat(60));
  
  // Show environment configuration
  console.log('📋 CONFIGURATION:');
  console.log(`   USE_AXIOM_SHADOW: ${process.env.USE_AXIOM_SHADOW || 'false'}`);
  console.log(`   USE_MOCK_DATA: ${process.env.USE_MOCK_DATA || 'false'}`);
  console.log(`   ALLOW_EXECUTE: ${process.env.ALLOW_EXECUTE || 'false'}`);
  console.log(`   USE_JUPITER_DRYRUN: ${process.env.USE_JUPITER_DRYRUN || 'false'}`);
  console.log(`   EXECUTOR: ${process.env.EXECUTOR || 'Dummy'}`);
  console.log('');
  
  const pipeline = new EnhancedResurrectionPipeline();
  
  // Set up graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down enhanced pipeline...');
    
    // Show copy trading stats before shutdown
    const stats = pipeline.getCopyTradingStats();
    console.log('\n📊 COPY TRADING STATS:');
    console.log(`   Enabled: ${stats.enabled ? '✅' : '❌'}`);
    console.log(`   Recent Signals: ${stats.recentSignals}`);
    console.log(`   Active Cooldowns: ${stats.activeCooldowns}`);
    console.log(`   Max Position: ${stats.maxPositionSol} SOL`);
    console.log(`   Copy Ratio: ${(stats.copyRatio * 100).toFixed(0)}%`);
    
    if (stats.signals && stats.signals.length > 0) {
      console.log('\n🔥 Recent Signals:');
      stats.signals.forEach((signal, index) => {
        console.log(`   ${index + 1}. ${signal.wallet} ${signal.side} ${signal.mint} (${signal.ageSeconds}s ago)`);
      });
    }
    
    await pipeline.stop();
    console.log('✅ Enhanced pipeline stopped');
    process.exit(0);
  };
  
  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  try {
    console.log('🔄 Initializing enhanced pipeline...');
    await pipeline.start();
    console.log('✅ Enhanced pipeline started successfully');
    
    // Log copy trading configuration
    setTimeout(() => {
      const stats = pipeline.getCopyTradingStats();
      console.log('\n📡 COPY TRADING STATUS:');
      console.log(`   🎯 Copy Trading: ${stats.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   💰 Max Position: ${stats.maxPositionSol} SOL (~$${(stats.maxPositionSol * 250).toFixed(2)})`);
      console.log(`   📊 Copy Ratio: ${(stats.copyRatio * 100).toFixed(0)}% of whale position`);
      console.log(`   ⏰ Cooldown: ${Math.floor(stats.cooldownMs / 1000)}s between copies`);
      console.log('');
      console.log('🎯 Watching for whale signals and trading opportunities...');
      console.log('');
    }, 2000);
    
    // Keep the process running
    console.log('⚡ Pipeline running... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Pipeline failed to start:', error.message);
    process.exit(1);
  }
}

runEnhancedPipeline(); 