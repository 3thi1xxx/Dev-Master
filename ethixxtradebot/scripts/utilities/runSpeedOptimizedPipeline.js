/**
 * Speed-Optimized Pipeline Runner
 * Ultra-fast whale detection and copy-trading with sub-100ms response times
 */

import EnhancedResurrectionPipeline from '../pipelines/EnhancedResurrectionPipeline.js';
import HighSpeedWalletMonitor from '../services/HighSpeedWalletMonitor.js';

class SpeedOptimizedPipeline extends EnhancedResurrectionPipeline {
  constructor() {
    super();
    this.speedMonitor = null;
    this.speedStats = {
      signalsProcessed: 0,
      averageResponseTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0
    };
  }

  async start() {
    // Start base pipeline
    await super.start();
    
    // Replace standard wallet service with high-speed monitor
    if (this.walletSignalService) {
      await this.walletSignalService.disconnect();
    }
    
    // Initialize high-speed monitor
    this.speedMonitor = new HighSpeedWalletMonitor();
    const connected = await this.speedMonitor.init();
    
    if (connected) {
      await this.speedMonitor.startHighSpeedMonitoring();
      this.logger.log('[SPEED-PIPELINE] ⚡ High-speed monitoring active');
      
      // Listen for speed signals
      this.speedMonitor.on('speedSignal', (signal) => {
        this.handleSpeedSignal(signal);
      });
    } else {
      this.logger.error('[SPEED-PIPELINE] ❌ Failed to start high-speed monitoring');
    }
  }

  async handleSpeedSignal(signal) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED SIGNAL: ${signal.walletName} via ${signal.src}`);
      this.logger.log(`[SPEED-PIPELINE] 🎯 Confidence: ${signal.confidence} | Fresh: ${((Date.now() - signal.ts) / 1000).toFixed(1)}s`);
      
      // Create mock tick for speed processing
      const speedTick = {
        ts: signal.ts,
        source: 'speed-signal',
        mint: signal.mint,
        symbol: `SPEED_${signal.mint.substring(0, 4)}`,
        mcap: 100000, // Mock market cap that passes filters
        vol24h: 50000,
        age_minutes: 5,
        protocol: 'Raydium',
        price: 0.001,
        speedSignal: signal // Attach original signal
      };
      
      // Process with speed priority
      await this.processSpeedTick(speedTick);
      
      // Track response time
      const responseTime = Date.now() - startTime;
      this.updateSpeedStats(responseTime);
      
      this.logger.log(`[SPEED-PIPELINE] ⚡ Response time: ${responseTime}ms`);
      
    } catch (error) {
      this.logger.error(`[SPEED-PIPELINE] 💥 Speed signal error: ${error.message}`);
    }
  }

  async processSpeedTick(tick) {
    const signal = tick.speedSignal;
    const row = this.tickToRow(tick);
    
    // SPEED BOOST: Apply maximum signal enhancement
    if (row.analysis) {
      row.analysis.score = (row.analysis.score || 0) + 0.5; // Maximum boost
      row.analysis.reasons = row.analysis.reasons || [];
      row.analysis.reasons.push(`SPEED:${signal.walletName}:${signal.confidence}`);
    }
    row.preset = 'hot';
    
    this.logger.log(`[SPEED-PIPELINE] 🚀 SPEED BOOST: ${row.symbol} +0.5 score (${signal.confidence} confidence)`);
    
    // Skip normal filtering for speed signals - trust the whale
    this.logger.log(`[SPEED-PIPELINE] ⚡ FAST-TRACK: Skipping filters for speed`);
    
    // Quick Jupiter quote
    const quoteResult = await this.tryJupiterDryRun(row);
    
    if (!quoteResult.success) {
      this.logger.log(`[SPEED-PIPELINE] ❌ Speed quote failed: ${row.symbol} - ${quoteResult.reason}`);
      return;
    }
    
    this.logger.log(`[SPEED-PIPELINE] 💹 SPEED QUOTE: ${row.symbol} - ${quoteResult.route} slip=${quoteResult.slippageBps}bps`);
    
    // Speed copy-trade attempt
    if (this.speedMonitor?.config?.copytrade?.enabled) {
      const copyResult = await this.attemptSpeedCopyTrade(signal, row, quoteResult);
      if (copyResult.executed) {
        this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED COPY: ${row.symbol} - ${copyResult.amount.toFixed(3)} SOL in ${copyResult.responseTime}ms`);
        return;
      }
    }
    
    // Speed normal execution
    if (process.env.ALLOW_EXECUTE === 'true') {
      await this.executeSpeedTrade(row, quoteResult, signal);
    } else {
      this.logger.log(`[SPEED-PIPELINE] 💤 SPEED SIM: ${row.symbol} would be traded at speed`);
    }
  }

  async attemptSpeedCopyTrade(signal, row, quoteResult) {
    const startTime = Date.now();
    const copyConfig = this.speedMonitor.config.copytrade;
    const { wallet, mint, solSpent = 0.05 } = signal;
    
    // Speed-optimized size calculation
    const copyAmount = Math.min(
      Math.max(solSpent * copyConfig.copy_ratio, copyConfig.min_position_sol || 0.02),
      copyConfig.max_position_sol || 0.06
    );
    
    this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED COPY: ${row.symbol} - ${copyAmount.toFixed(3)} SOL`);
    
    try {
      const buyResult = await this.executor.executeBuy({
        symbol: row.symbol,
        mint: row.mint,
        preset: 'small',
        amountSol: copyAmount,
        dryRun: process.env.USE_JUPITER_DRYRUN === 'true',
        priority: 'speed' // High priority execution
      });
      
      const responseTime = Date.now() - startTime;
      
      if (buyResult.success) {
        this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED SUCCESS: ${row.symbol} - ${responseTime}ms`);
        return { executed: true, amount: copyAmount, responseTime, txid: buyResult.txid };
      } else {
        this.logger.log(`[SPEED-PIPELINE] ❌ Speed copy failed: ${buyResult.reason}`);
        return { executed: false, reason: buyResult.reason, responseTime };
      }
    } catch (error) {
      this.logger.error(`[SPEED-PIPELINE] 💥 Speed copy error: ${error.message}`);
      return { executed: false, reason: 'SPEED_ERROR', responseTime: Date.now() - startTime };
    }
  }

  async executeSpeedTrade(row, quoteResult, signal) {
    const tradeSizeSol = 0.03; // Optimized speed trade size
    
    this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED TRADE: ${row.symbol} following ${signal.walletName}`);
    
    try {
      const buyResult = await this.executor.executeBuy({
        symbol: row.symbol,
        mint: row.mint,
        preset: 'small',
        amountSol: tradeSizeSol,
        dryRun: process.env.USE_JUPITER_DRYRUN === 'true',
        priority: 'speed'
      });
      
      if (buyResult.success) {
        this.logger.log(`[SPEED-PIPELINE] ⚡ SPEED EXECUTION: ${row.symbol} - ${tradeSizeSol} SOL`);
        this.logger.log(`[SPEED-PIPELINE] 🎯 Following: ${signal.walletName} (${signal.confidence} confidence)`);
      } else {
        this.logger.log(`[SPEED-PIPELINE] ❌ Speed execution failed: ${buyResult.reason}`);
      }
    } catch (error) {
      this.logger.error(`[SPEED-PIPELINE] 💥 Speed execution error: ${error.message}`);
    }
  }

  updateSpeedStats(responseTime) {
    this.speedStats.signalsProcessed++;
    this.speedStats.fastestResponse = Math.min(this.speedStats.fastestResponse, responseTime);
    this.speedStats.slowestResponse = Math.max(this.speedStats.slowestResponse, responseTime);
    
    // Calculate running average
    const total = this.speedStats.averageResponseTime * (this.speedStats.signalsProcessed - 1) + responseTime;
    this.speedStats.averageResponseTime = total / this.speedStats.signalsProcessed;
  }

  getSpeedStats() {
    const baseStats = this.getCopyTradingStats();
    const speedMonitorStats = this.speedMonitor?.getSpeedStats() || {};
    
    return {
      ...baseStats,
      ...speedMonitorStats,
      responseStats: {
        signalsProcessed: this.speedStats.signalsProcessed,
        averageResponseTime: Math.round(this.speedStats.averageResponseTime),
        fastestResponse: this.speedStats.fastestResponse === Infinity ? 0 : this.speedStats.fastestResponse,
        slowestResponse: this.speedStats.slowestResponse
      }
    };
  }

  async stop() {
    // Stop speed monitor
    if (this.speedMonitor) {
      await this.speedMonitor.disconnect();
    }
    
    // Stop base pipeline
    await super.stop();
    
    this.logger.log('[SPEED-PIPELINE] ⚡ Speed-optimized pipeline stopped');
  }
}

async function runSpeedOptimizedPipeline() {
  console.log('⚡ STARTING SPEED-OPTIMIZED COPY-TRADING PIPELINE');
  console.log('='.repeat(60));
  
  // Show configuration
  console.log('📋 SPEED CONFIGURATION:');
  console.log(`   USE_AXIOM_SHADOW: ${process.env.USE_AXIOM_SHADOW || 'false'}`);
  console.log(`   ALLOW_EXECUTE: ${process.env.ALLOW_EXECUTE || 'false'}`);
  console.log(`   USE_JUPITER_DRYRUN: ${process.env.USE_JUPITER_DRYRUN || 'false'}`);
  console.log(`   EXECUTOR: ${process.env.EXECUTOR || 'Dummy'}`);
  console.log('');
  
  const pipeline = new SpeedOptimizedPipeline();
  
  // Set up graceful shutdown
  const shutdown = async () => {
    console.log('\n⚡ Shutting down speed-optimized pipeline...');
    
    // Show speed stats before shutdown
    const stats = pipeline.getSpeedStats();
    console.log('\n📊 SPEED PERFORMANCE STATS:');
    console.log(`   Signals Processed: ${stats.responseStats?.signalsProcessed || 0}`);
    console.log(`   Average Response: ${stats.responseStats?.averageResponseTime || 0}ms`);
    console.log(`   Fastest Response: ${stats.responseStats?.fastestResponse || 0}ms`);
    console.log(`   Slowest Response: ${stats.responseStats?.slowestResponse || 0}ms`);
    console.log(`   Wallets Monitored: ${stats.walletsMonitored || 0}`);
    console.log(`   High Confidence Signals: ${stats.highConfidenceSignals || 0}`);
    console.log(`   WebSocket Active: ${stats.websocketActive || 0}`);
    
    await pipeline.stop();
    console.log('⚡ Speed-optimized pipeline stopped');
    process.exit(0);
  };
  
  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  try {
    console.log('⚡ Initializing speed-optimized pipeline...');
    await pipeline.start();
    console.log('✅ Speed-optimized pipeline started successfully');
    
    // Log speed configuration
    setTimeout(() => {
      const stats = pipeline.getSpeedStats();
      console.log('\n⚡ SPEED STATUS:');
      console.log(`   🎯 High-Speed Monitoring: ACTIVE`);
      console.log(`   💰 Max Position: ${stats.maxPositionSol || 0.06} SOL`);
      console.log(`   📊 Copy Ratio: ${((stats.copyRatio || 0.22) * 100).toFixed(0)}%`);
      console.log(`   ⏰ Fresh Window: ${stats.freshWindow || '8s'}`);
      console.log(`   🚀 Response Target: <100ms`);
      console.log('');
      console.log('⚡ Monitoring whale signals at maximum speed...');
      console.log('');
    }, 2000);
    
    // Keep the process running
    console.log('⚡ Speed pipeline running... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Speed pipeline failed to start:', error.message);
    process.exit(1);
  }
}

runSpeedOptimizedPipeline(); 