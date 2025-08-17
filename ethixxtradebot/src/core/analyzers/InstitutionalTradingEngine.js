/**
 * Institutional Trading Engine
 * Professional-grade trading system with batch processing and clear metrics
 * Designed to Warren Buffett and Michael Saylor standards
 */

import { EventEmitter } from 'node:events';
import { birdeyeWebSocket } from '../integrations/BirdeyeWebSocket.js';

export class InstitutionalTradingEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxTrackedTokens: options.maxTrackedTokens || 500,
      batchSize: options.batchSize || 50,
      buyThreshold: options.buyThreshold || 75, // Score needed to buy
      sellThreshold: options.sellThreshold || 45, // Score to trigger sell
      maxPositionSize: options.maxPositionSize || 0.02, // 2% of portfolio
      stopLoss: options.stopLoss || 0.15, // 15% stop loss
      takeProfitTarget: options.takeProfitTarget || 0.25, // 25% take profit
      ...options
    };
    
    // Professional tracking structures
    this.trackedTokens = new Map(); // All tokens being monitored
    this.activePositions = new Map(); // Currently held positions
    this.orderBook = new Map(); // Pending orders
    this.performanceMetrics = this.initializeMetrics();
    
    // Batch processing queues
    this.analysisQueue = [];
    this.subscriptionQueue = [];
    
    // Timing and efficiency metrics
    this.timingMetrics = {
      lastBatchProcess: 0,
      avgProcessingTime: 0,
      apiCallEfficiency: 0,
      totalApiCalls: 0,
      successfulApiCalls: 0
    };
    
    console.log('[INSTITUTIONAL] 🏛️ Institutional Trading Engine initialized');
    console.log(`[INSTITUTIONAL] 📊 Max tracked tokens: ${this.config.maxTrackedTokens}`);
    console.log(`[INSTITUTIONAL] ⚡ Batch size: ${this.config.batchSize}`);
    console.log(`[INSTITUTIONAL] 🎯 Buy threshold: ${this.config.buyThreshold}%`);
  }
  
  initializeMetrics() {
    return {
      session: {
        startTime: Date.now(),
        tokensProcessed: 0,
        tradesExecuted: 0,
        currentBalance: 1000,
        peakBalance: 1000,
        drawdown: 0
      },
      performance: {
        winRate: 0,
        avgProfitPerTrade: 0,
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        profitFactor: 0
      },
      efficiency: {
        avgAnalysisTime: 0,
        tokensPerSecond: 0,
        apiCallsPerMinute: 0,
        batchEfficiency: 0
      }
    };
  }
  
  /**
   * WARREN BUFFETT STYLE: Process new tokens with institutional discipline
   */
  async processNewToken(tokenData) {
    const startTime = Date.now();
    
    // Quick sanity check - Buffett would skip obvious junk
    if (!this.passesInitialScreening(tokenData)) {
      return this.rejectToken(tokenData, 'Failed initial screening');
    }
    
    // Add to tracking with proper structure
    const trackingData = this.createTrackingRecord(tokenData);
    this.trackedTokens.set(tokenData.address, trackingData);
    
    // Queue for batch analysis instead of immediate processing
    this.analysisQueue.push(tokenData.address);
    
    // Process batch if queue is full or timeout reached
    if (this.analysisQueue.length >= this.config.batchSize || 
        (Date.now() - this.timingMetrics.lastBatchProcess) > 10000) {
      await this.processBatch();
    }
    
    const processingTime = Date.now() - startTime;
    this.updateEfficiencyMetrics('tokenProcessing', processingTime);
    
    console.log(`[INSTITUTIONAL] 📋 Token queued: ${tokenData.symbol} (Queue: ${this.analysisQueue.length})`);
  }
  
  /**
   * MICHAEL SAYLOR STYLE: Batch processing for maximum efficiency
   */
  async processBatch() {
    if (this.analysisQueue.length === 0) return;
    
    const batchStartTime = Date.now();
    const currentBatch = [...this.analysisQueue];
    this.analysisQueue = [];
    
    console.log(`[INSTITUTIONAL] ⚡ Processing batch of ${currentBatch.length} tokens`);
    
    try {
      // Batch API calls instead of individual requests
      const batchResults = await this.batchAnalyzeTokens(currentBatch);
      
      // Process results and make trading decisions
      for (const [address, analysis] of Object.entries(batchResults)) {
        await this.evaluateTokenForTrading(address, analysis);
      }
      
      // Batch WebSocket subscriptions
      await this.batchSubscribeToUpdates(currentBatch);
      
      this.timingMetrics.lastBatchProcess = Date.now();
      
      const batchTime = Date.now() - batchStartTime;
      const tokensPerSecond = currentBatch.length / (batchTime / 1000);
      
      console.log(`[INSTITUTIONAL] ✅ Batch completed in ${batchTime}ms (${tokensPerSecond.toFixed(1)} tokens/sec)`);
      
    } catch (error) {
      console.error(`[INSTITUTIONAL] ❌ Batch processing failed:`, error.message);
    }
  }
  
  /**
   * WARREN BUFFETT STYLE: Only invest in what you understand and can measure
   */
  passesInitialScreening(tokenData) {
    const checks = {
      hasLiquidity: tokenData.liquidity && tokenData.liquidity > 1000,
      hasValidAddress: tokenData.address && tokenData.address.length > 40,
      hasSymbol: tokenData.symbol && tokenData.symbol.length > 0,
      notTooYoung: !tokenData.age || tokenData.age > 300, // At least 5 minutes old
      liquidityNotTooHigh: !tokenData.liquidity || tokenData.liquidity < 1000000 // Avoid established tokens
    };
    
    const passCount = Object.values(checks).filter(Boolean).length;
    const passRate = passCount / Object.keys(checks).length;
    
    if (passRate < 0.8) {
      console.log(`[INSTITUTIONAL] ⚠️ ${tokenData.symbol} failed screening (${(passRate*100).toFixed(0)}%)`);
      return false;
    }
    
    return true;
  }
  
  createTrackingRecord(tokenData) {
    return {
      address: tokenData.address,
      symbol: tokenData.symbol,
      addedAt: Date.now(),
      initialLiquidity: tokenData.liquidity,
      currentPrice: tokenData.realtimePrice,
      priceHistory: [tokenData.realtimePrice].filter(Boolean),
      volumeHistory: [],
      analysis: null,
      lastUpdate: Date.now(),
      status: 'TRACKING', // TRACKING, BUYING, HOLDING, SELLING
      alerts: []
    };
  }
  
  /**
   * BATCH API CALLS - Stop the amateur individual request spam
   */
  async batchAnalyzeTokens(addresses) {
    this.timingMetrics.totalApiCalls++;
    
    try {
      // Use Birdeye batch endpoint instead of individual calls
      const batchData = await this.callBirdeyeBatchAPI(addresses);
      
      this.timingMetrics.successfulApiCalls++;
      this.updateApiEfficiency();
      
      return batchData;
      
    } catch (error) {
      console.error(`[INSTITUTIONAL] ❌ Batch API call failed:`, error.message);
      return {};
    }
  }
  
  async callBirdeyeBatchAPI(addresses) {
    // Mock implementation - replace with actual Birdeye batch API
    const results = {};
    
    // Simulate batch call efficiency
    const batchCall = {
      addresses: addresses.slice(0, 50), // Birdeye supports up to 50 at once
      metrics: ['price', 'volume', 'liquidity', 'trades']
    };
    
    for (const address of addresses) {
      results[address] = {
        price: Math.random() * 0.001,
        volume24h: Math.random() * 100000,
        liquidity: Math.random() * 50000,
        trades24h: Math.floor(Math.random() * 1000),
        priceChange24h: (Math.random() - 0.5) * 0.4 // -20% to +20%
      };
    }
    
    console.log(`[INSTITUTIONAL] 📊 Batch API call: ${addresses.length} tokens in single request`);
    return results;
  }
  
  /**
   * CLEAR BUY/SELL DECISIONS - No more vague "scores"
   */
  async evaluateTokenForTrading(address, analysis) {
    const token = this.trackedTokens.get(address);
    if (!token) return;
    
    // Update token with fresh analysis
    token.analysis = analysis;
    token.lastUpdate = Date.now();
    
    // BUFFETT STYLE: Clear, measurable criteria
    const buySignal = this.calculateBuySignal(token, analysis);
    const sellSignal = this.calculateSellSignal(token, analysis);
    
    if (buySignal.shouldBuy && !this.activePositions.has(address)) {
      await this.executeBuyOrder(address, buySignal);
    } else if (sellSignal.shouldSell && this.activePositions.has(address)) {
      await this.executeSellOrder(address, sellSignal);
    }
    
    // Log decision with clear reasoning
    console.log(`[INSTITUTIONAL] 🎯 ${token.symbol}: Buy=${buySignal.score}% Sell=${sellSignal.score}% | ${buySignal.shouldBuy ? 'BUY' : sellSignal.shouldSell ? 'SELL' : 'HOLD'}`);
  }
  
  calculateBuySignal(token, analysis) {
    let score = 0;
    let reasons = [];
    
    // Volume momentum (25 points)
    if (analysis.volume24h > 10000) {
      score += 25;
      reasons.push('Strong volume');
    }
    
    // Price momentum (20 points) 
    if (analysis.priceChange24h > 0.1) {
      score += 20;
      reasons.push('Price momentum');
    }
    
    // Liquidity health (20 points)
    if (analysis.liquidity > 5000 && analysis.liquidity < 100000) {
      score += 20;
      reasons.push('Healthy liquidity');
    }
    
    // Trading activity (15 points)
    if (analysis.trades24h > 50) {
      score += 15;
      reasons.push('Active trading');
    }
    
    // Age factor (10 points)
    const ageMinutes = (Date.now() - token.addedAt) / 60000;
    if (ageMinutes > 5 && ageMinutes < 60) {
      score += 10;
      reasons.push('Optimal age');
    }
    
    // Risk management (10 points)
    if (this.activePositions.size < 10) {
      score += 10;
      reasons.push('Portfolio capacity');
    }
    
    return {
      score,
      shouldBuy: score >= this.config.buyThreshold,
      reasons: reasons.join(', ')
    };
  }
  
  calculateSellSignal(token, analysis) {
    const position = this.activePositions.get(token.address);
    if (!position) return { score: 0, shouldSell: false, reasons: '' };
    
    let score = 0;
    let reasons = [];
    
    // Current P&L
    const currentPrice = analysis.price;
    const entryPrice = position.entryPrice;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    // Take profit trigger
    if (pnlPercent >= this.config.takeProfitTarget * 100) {
      score += 80;
      reasons.push(`Take profit: +${pnlPercent.toFixed(1)}%`);
    }
    
    // Stop loss trigger
    if (pnlPercent <= -this.config.stopLoss * 100) {
      score += 100;
      reasons.push(`Stop loss: ${pnlPercent.toFixed(1)}%`);
    }
    
    // Volume decline
    if (analysis.volume24h < token.initialLiquidity * 0.1) {
      score += 30;
      reasons.push('Volume decline');
    }
    
    // Price momentum reversal
    if (analysis.priceChange24h < -0.05) {
      score += 25;
      reasons.push('Price decline');
    }
    
    return {
      score,
      shouldSell: score >= this.config.sellThreshold,
      reasons: reasons.join(', '),
      pnl: pnlPercent
    };
  }
  
  async executeBuyOrder(address, signal) {
    const token = this.trackedTokens.get(address);
    
    // Position sizing based on signal strength
    const basePosition = this.config.maxPositionSize;
    const signalMultiplier = signal.score / 100;
    const positionSize = basePosition * signalMultiplier;
    
    const position = {
      address,
      symbol: token.symbol,
      entryTime: Date.now(),
      entryPrice: token.analysis.price,
      positionSize,
      reason: signal.reasons,
      stopLoss: token.analysis.price * (1 - this.config.stopLoss),
      takeProfit: token.analysis.price * (1 + this.config.takeProfitTarget)
    };
    
    this.activePositions.set(address, position);
    token.status = 'HOLDING';
    
    console.log(`[INSTITUTIONAL] 💰 BUY: ${token.symbol} at $${position.entryPrice.toFixed(6)} (${(positionSize*100).toFixed(1)}% position) - ${signal.reasons}`);
    
    this.performanceMetrics.session.tradesExecuted++;
    this.emit('trade_executed', { type: 'BUY', ...position });
  }
  
  async executeSellOrder(address, signal) {
    const position = this.activePositions.get(address);
    const token = this.trackedTokens.get(address);
    
    const currentPrice = token.analysis.price;
    const pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    const dollarPnl = (this.performanceMetrics.session.currentBalance * position.positionSize * pnl) / 100;
    
    // Update balance
    this.performanceMetrics.session.currentBalance += dollarPnl;
    
    console.log(`[INSTITUTIONAL] 💸 SELL: ${token.symbol} at $${currentPrice.toFixed(6)} | P&L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(1)}% ($${dollarPnl.toFixed(2)}) - ${signal.reasons}`);
    
    this.activePositions.delete(address);
    token.status = 'TRACKING';
    
    this.updatePerformanceMetrics(pnl, dollarPnl);
    this.emit('trade_executed', { type: 'SELL', address, pnl, dollarPnl, reason: signal.reasons });
  }
  
  async batchSubscribeToUpdates(addresses) {
    // Subscribe to price updates for all addresses in batch
    const chunks = this.chunkArray(addresses, 20); // WebSocket limits
    
    for (const chunk of chunks) {
      try {
        await birdeyeWebSocket.subscribeBatch(chunk, ['price', 'volume']);
        console.log(`[INSTITUTIONAL] 📡 Batch subscribed to ${chunk.length} tokens`);
      } catch (error) {
        console.error(`[INSTITUTIONAL] ❌ Batch subscription failed:`, error.message);
      }
    }
  }
  
  updateApiEfficiency() {
    this.timingMetrics.apiCallEfficiency = 
      (this.timingMetrics.successfulApiCalls / this.timingMetrics.totalApiCalls) * 100;
  }
  
  updateEfficiencyMetrics(operation, time) {
    if (operation === 'tokenProcessing') {
      this.performanceMetrics.efficiency.avgAnalysisTime = 
        (this.performanceMetrics.efficiency.avgAnalysisTime + time) / 2;
    }
  }
  
  updatePerformanceMetrics(pnlPercent, dollarPnl) {
    const metrics = this.performanceMetrics;
    
    // Update win rate
    const isWin = pnlPercent > 0;
    const totalTrades = metrics.session.tradesExecuted;
    
    if (isWin) {
      metrics.performance.winRate = ((metrics.performance.winRate * (totalTrades - 1)) + 100) / totalTrades;
    } else {
      metrics.performance.winRate = (metrics.performance.winRate * (totalTrades - 1)) / totalTrades;
    }
    
    // Update average profit per trade
    metrics.performance.avgProfitPerTrade = 
      ((metrics.performance.avgProfitPerTrade * (totalTrades - 1)) + pnlPercent) / totalTrades;
    
    // Update drawdown
    const currentBalance = metrics.session.currentBalance;
    if (currentBalance > metrics.session.peakBalance) {
      metrics.session.peakBalance = currentBalance;
    }
    
    const drawdown = ((metrics.session.peakBalance - currentBalance) / metrics.session.peakBalance) * 100;
    metrics.session.drawdown = Math.max(metrics.session.drawdown, drawdown);
  }
  
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  rejectToken(tokenData, reason) {
    console.log(`[INSTITUTIONAL] ❌ Rejected ${tokenData.symbol}: ${reason}`);
    return false;
  }
  
  generateInstitutionalReport() {
    const metrics = this.performanceMetrics;
    const runtime = (Date.now() - metrics.session.startTime) / 1000 / 60; // minutes
    
    console.log('\n📊 INSTITUTIONAL PERFORMANCE REPORT');
    console.log('=====================================');
    console.log(`⏱️ Runtime: ${runtime.toFixed(1)} minutes`);
    console.log(`🔍 Tokens Tracked: ${this.trackedTokens.size}/${this.config.maxTrackedTokens}`);
    console.log(`💰 Active Positions: ${this.activePositions.size}`);
    console.log(`💸 Trades Executed: ${metrics.session.tradesExecuted}`);
    console.log(`📈 Win Rate: ${metrics.performance.winRate.toFixed(1)}%`);
    console.log(`💵 Current Balance: $${metrics.session.currentBalance.toFixed(2)}`);
    console.log(`📊 Total Return: ${((metrics.session.currentBalance - 1000) / 1000 * 100).toFixed(2)}%`);
    console.log(`⚡ API Efficiency: ${this.timingMetrics.apiCallEfficiency.toFixed(1)}%`);
    console.log(`🚀 Processing Speed: ${(this.trackedTokens.size / runtime).toFixed(1)} tokens/min`);
  }
}

// Export singleton
export const institutionalEngine = new InstitutionalTradingEngine(); 