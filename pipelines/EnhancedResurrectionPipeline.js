/**
 * Enhanced Resurrection Pipeline with Wallet Signal Integration
 * Extends the basic pipeline with copy-trading and signal boosting
 */

import ResurrectionPipeline from './ResurrectionPipeline.js';
import WalletSignalService from '../services/WalletSignalService.js';

export class EnhancedResurrectionPipeline extends ResurrectionPipeline {
  constructor() {
    super();
    this.walletSignalService = null;
    this.copyCooldowns = new Map(); // wallet:mint -> timestamp
    this.logger = console;
    
    this.logger.log('[ENHANCED-PIPELINE] 🚀 Enhanced Pipeline initialized');
  }

  async start() {
    // Start the base pipeline
    await super.start();
    
    // Initialize wallet signal service
    this.walletSignalService = new WalletSignalService();
    const connected = await this.walletSignalService.init();
    
    if (connected) {
      await this.walletSignalService.startMonitoring();
      this.logger.log('[ENHANCED-PIPELINE] 📡 Wallet signal monitoring active');
      
      // Listen for wallet signals
      this.walletSignalService.on('walletSignal', (signal) => {
        this.handleWalletSignal(signal);
      });
    } else {
      this.logger.error('[ENHANCED-PIPELINE] ❌ Failed to start wallet signal service');
    }
  }

  async processTickMinimal(tick) {
    // Extract token info
    const row = this.tickToRow(tick);
    
    // 1) Check for fresh wallet signal boost
    const signal = this.walletSignalService?.getFreshSignal(row.mint);
    let boosted = false;
    
    if (signal && signal.side === 'buy') {
      const signalConfig = this.walletSignalService.getSignalConfig();
      
      this.logger.log(`[ENHANCED-PIPELINE] 🚨 WALLET SIGNAL BOOST: ${signal.walletName}`);
      this.logger.log(`[ENHANCED-PIPELINE] 💰 Token: ${row.symbol} | Signal Age: ${Math.floor((Date.now() - signal.ts) / 1000)}s`);
      
      // Apply signal boost to scoring
      if (row.analysis) {
        row.analysis.score = (row.analysis.score || 0) + (signalConfig.score_bonus || 0.25);
        row.analysis.reasons = row.analysis.reasons || [];
        row.analysis.reasons.push(`wallet:${signal.walletName}`);
      }
      
      // Force preset to hot
      row.preset = signalConfig.force_preset || 'hot';
      boosted = true;
    }
    
    // 2) Run normal scout -> filter -> score pipeline
    const { passed, analysis } = this.scoutFilterScore(row);
    
    if (!passed) {
      if (boosted) {
        this.logger.log(`[ENHANCED-PIPELINE] ❌ Signal boost not enough: ${row.symbol} failed filters`);
      }
      return;
    }
    
    this.logger.log(`[ENHANCED-PIPELINE] ✅ ${boosted ? 'BOOSTED ' : ''}OPPORTUNITY: ${row.symbol} (score: ${analysis.score.toFixed(2)})`);
    
    // 3) Try Jupiter quote
    const quoteResult = await this.tryJupiterDryRun(row);
    
    if (!quoteResult.success) {
      this.logger.log(`[ENHANCED-PIPELINE] ❌ No route: ${row.symbol} - ${quoteResult.reason}`);
      return;
    }
    
    this.logger.log(`[ENHANCED-PIPELINE] 💹 Quote OK: ${row.symbol} - ${quoteResult.route} slip=${quoteResult.slippageBps}bps`);
    
    // 4) Check for copy-trade opportunity
    if (signal && signal.side === 'buy' && this.walletSignalService?.isCopyTradingEnabled()) {
      const copyResult = await this.attemptCopyTrade(signal, row, quoteResult);
      if (copyResult.executed) {
        this.logger.log(`[ENHANCED-PIPELINE] 🎯 COPY TRADE: ${row.symbol} - ${copyResult.amount.toFixed(3)} SOL`);
        return; // Copy trade executed, skip normal execution
      }
    }
    
    // 5) Normal execution path
    if (process.env.ALLOW_EXECUTE === 'true') {
      await this.executeNormalTrade(row, quoteResult);
    } else {
      this.logger.log(`[ENHANCED-PIPELINE] 💤 SIMULATION: ${row.symbol} would be traded (ALLOW_EXECUTE=false)`);
    }
  }

  async attemptCopyTrade(signal, row, quoteResult) {
    const copyConfig = this.walletSignalService.getCopyTradeConfig();
    const { wallet, mint, solSpent = 0.05 } = signal;
    
    // Check cooldown
    const cooldownKey = `${wallet}:${mint}`;
    const lastCopy = this.copyCooldowns.get(cooldownKey);
    const now = Date.now();
    
    if (lastCopy && (now - lastCopy) < copyConfig.cooldown_ms) {
      const remainingMs = copyConfig.cooldown_ms - (now - lastCopy);
      this.logger.log(`[ENHANCED-PIPELINE] ⏰ Copy cooldown: ${Math.floor(remainingMs / 1000)}s remaining`);
      return { executed: false, reason: 'COOLDOWN' };
    }
    
    // Check price impact
    if (quoteResult.slippageBps > copyConfig.max_price_impact_bps) {
      this.logger.log(`[ENHANCED-PIPELINE] ❌ Copy blocked: price impact ${quoteResult.slippageBps}bps > ${copyConfig.max_price_impact_bps}bps`);
      return { executed: false, reason: 'PRICE_IMPACT' };
    }
    
    // Calculate copy size with smart sizing for $100 wallet
    let copyAmount = solSpent * copyConfig.copy_ratio;
    
    // Apply min/max bounds
    copyAmount = Math.max(copyAmount, copyConfig.min_position_sol || 0.02);
    copyAmount = Math.min(copyAmount, copyConfig.max_position_sol || 0.08);
    
    // Sweet spot calculation: 2-8% of $100 wallet = $5-20 per trade
    // At $250/SOL: 0.02-0.08 SOL per trade
    if (copyAmount < (copyConfig.min_position_sol || 0.02)) {
      this.logger.log(`[ENHANCED-PIPELINE] ❌ Copy size too small: ${copyAmount.toFixed(3)} SOL (min: ${copyConfig.min_position_sol || 0.02} SOL)`);
      return { executed: false, reason: 'SIZE_TOO_SMALL' };
    }
    
         // Fee efficiency check: ensure trade is large enough to overcome Jupiter fees (~0.002 SOL)
     const estimatedFees = 0.002; // ~$0.50 in fees  
     const netTradeValue = copyAmount - estimatedFees;
     if (netTradeValue < 0.015) { // Need at least $3.75 net after fees
       this.logger.log(`[ENHANCED-PIPELINE] ❌ Trade too small after fees: ${copyAmount.toFixed(3)} SOL - ${estimatedFees} fees = ${netTradeValue.toFixed(3)} SOL net`);
       return { executed: false, reason: 'INSUFFICIENT_AFTER_FEES' };
     }
    
    this.logger.log(`[ENHANCED-PIPELINE] 🏃 Executing copy trade: ${row.symbol}`);
    this.logger.log(`[ENHANCED-PIPELINE] 👥 Following: ${signal.walletName}`);
    this.logger.log(`[ENHANCED-PIPELINE] 💰 Size: ${copyAmount.toFixed(3)} SOL (${(copyConfig.copy_ratio * 100).toFixed(0)}% of ${solSpent.toFixed(3)} SOL)`);
    
    try {
      const buyResult = await this.executor.executeBuy({
        symbol: row.symbol,
        mint: row.mint,
        preset: 'small',
        amountSol: copyAmount,
        dryRun: process.env.USE_JUPITER_DRYRUN === 'true'
      });
      
      if (buyResult.success) {
        // Set cooldown
        this.copyCooldowns.set(cooldownKey, now);
        
        // Clean up cooldown after timeout
        setTimeout(() => {
          this.copyCooldowns.delete(cooldownKey);
        }, copyConfig.cooldown_ms);
        
        this.logger.log(`[ENHANCED-PIPELINE] ✅ COPY SUCCESS: ${row.symbol} - txid: ${buyResult.txid || 'simulated'}`);
        this.logger.log(`[ENHANCED-PIPELINE] 💎 Following ${signal.walletName} with ${copyAmount.toFixed(3)} SOL`);
        
        return { executed: true, amount: copyAmount, txid: buyResult.txid };
      } else {
        this.logger.log(`[ENHANCED-PIPELINE] ❌ Copy failed: ${buyResult.reason}`);
        return { executed: false, reason: buyResult.reason };
      }
    } catch (error) {
      this.logger.error(`[ENHANCED-PIPELINE] 💥 Copy error: ${error.message}`);
      return { executed: false, reason: 'EXECUTION_ERROR' };
    }
  }

  async executeNormalTrade(row, quoteResult) {
    // Sweet spot for $100 wallet: 3% per trade = $7.50 with only 6.7% fees
    const tradeSizeSol = 0.03; // ~$7.50 at $250/SOL - optimal fee efficiency
    
    this.logger.log(`[ENHANCED-PIPELINE] 🚀 NORMAL TRADE: ${row.symbol} (${row.mint})`);
    
    try {
      const buyResult = await this.executor.executeBuy({
        symbol: row.symbol,
        mint: row.mint,
        preset: 'small',
        amountSol: tradeSizeSol,
        dryRun: process.env.USE_JUPITER_DRYRUN === 'true'
      });
      
      if (buyResult.success) {
        if (buyResult.realTrade) {
          this.logger.log(`[ENHANCED-PIPELINE] ✅ REAL TRADE SUCCESS: ${row.symbol} - ${tradeSizeSol} SOL - txid: ${buyResult.txid}`);
          this.logger.log(`[ENHANCED-PIPELINE] 💰 LIVE MONEY: Spent $${(tradeSizeSol * 250).toFixed(2)} for ${row.symbol} tokens`);
        } else {
          this.logger.log(`[ENHANCED-PIPELINE] ✅ TRADE SUCCESS: ${row.symbol} - ${tradeSizeSol} SOL - txid: ${buyResult.txid || 'simulated'}`);
          this.logger.log(`[ENHANCED-PIPELINE] 💰 SIMULATED: Would have bought $${(tradeSizeSol * 250).toFixed(2)} worth of ${row.symbol}`);
        }
        
        // Set up sell target
        const profitTarget = process.env.PROFIT_TARGET_PERCENT || '8';
        this.logger.log(`[ENHANCED-PIPELINE] 🎯 Target: +${profitTarget}% profit on ${row.symbol}`);
        
      } else {
        this.logger.log(`[ENHANCED-PIPELINE] ❌ TRADE FAILED: ${row.symbol} - reason: ${buyResult.reason || 'unknown'}`);
      }
      
    } catch (error) {
      this.logger.error(`[ENHANCED-PIPELINE] 💥 TRADE ERROR: ${row.symbol} - ${error.message}`);
    }
  }

  handleWalletSignal(signal) {
    // Log signal for monitoring
    this.logger.log(`[ENHANCED-PIPELINE] 📡 Wallet Signal: ${signal.walletName} ${signal.side} ${signal.mint.substring(0, 8)}...`);
    
    // Signals are automatically picked up in processTickMinimal via getFreshSignal()
    // No additional action needed here - just for logging/monitoring
  }

  // Get copy trading stats
  getCopyTradingStats() {
    const recentSignals = this.walletSignalService?.getRecentSignals() || [];
    const activeCooldowns = this.copyCooldowns.size;
    const config = this.walletSignalService?.getCopyTradeConfig() || {};
    
    return {
      enabled: config.enabled || false,
      recentSignals: recentSignals.length,
      activeCooldowns,
      maxPositionSol: config.max_position_sol || 0,
      copyRatio: config.copy_ratio || 0,
      cooldownMs: config.cooldown_ms || 0,
      signals: recentSignals
    };
  }

  async stop() {
    // Stop wallet signal service
    if (this.walletSignalService) {
      await this.walletSignalService.disconnect();
    }
    
    // Clear cooldowns
    this.copyCooldowns.clear();
    
    // Stop base pipeline
    await super.stop();
    
    this.logger.log('[ENHANCED-PIPELINE] 🛑 Enhanced pipeline stopped');
  }
}

export default EnhancedResurrectionPipeline; 