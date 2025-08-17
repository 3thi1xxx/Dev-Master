#!/usr/bin/env node
/**
 * Paper Trading Simulator
 * Tests AI predictions using live data without risking real money
 * Tracks performance and validates trading intelligence
 */

import { EventEmitter } from 'node:events';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { whaleIntelligence } from '../../intelligence/WhaleIntelligence.js';
import { birdeyeWebSocketManager } from '../../services/BirdeyeWebSocketManager.js';
import { PositionSizing } from './PositionSizing.js';
import { NZTaxTracker } from '../compliance/NZTaxTracker.js';

export class PaperTradingSimulator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      initialBalance: options.initialBalance || 1000, // $1000 starting balance
      maxPositionSize: options.maxPositionSize || 75, // LOOSENED: Max $75 per trade
      minPositionSize: options.minPositionSize || 15, // LOOSENED: Min $15 per trade
      maxPositions: options.maxPositions || 6,        // LOOSENED: Max 6 concurrent positions
      trackingDuration: options.trackingDuration || 24 * 60 * 60 * 1000, // 24 hours
      performanceFile: './paper_trading_performance.json',
      tradesFile: './paper_trading_trades.json'
    };
    
    // Trading state
    this.balance = this.config.initialBalance;
    this.positions = new Map(); // tokenAddress -> position
    this.tradeHistory = [];
    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      averageReturn: 0,
      bestTrade: { profit: 0, token: '', time: 0 },
      worstTrade: { loss: 0, token: '', time: 0 },
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    
    // Initialize professional position sizing
    this.positionSizing = new PositionSizing({
      walletBalance: this.balance,
      solPrice: 250, // Will be updated dynamically
      minProfitPercent: 8
    });
    
    // Initialize tax tracking
    this.taxTracker = new NZTaxTracker({
      jurisdiction: 'NZ',
      taxYear: 2025,
      autoExport: true
    });
    
    // Load existing data
    this.loadTradingData();
    
    console.log('📊 PAPER TRADING SIMULATOR INITIALIZED');
    console.log(`💰 Starting Balance: $${this.balance}`);
    console.log(`📈 Max Position Size: $${this.config.maxPositionSize}`);
    console.log(`🎯 Max Concurrent Positions: ${this.config.maxPositions}`);
    console.log('🔬 Testing AI predictions with live data');
    console.log('🐋 Whale copy trading: ENABLED');
    
    // Listen for whale copy trading signals
    whaleIntelligence.on('copyTradeSignal', (signal) => {
      this.processWhaleCopyTrade(signal);
    });
    
    // Listen for Birdeye price updates on tracked tokens
    birdeyeWebSocketManager.on('price_update', (data) => {
      this.handlePriceUpdate(data);
    });
    
    console.log('🐦 Connected to Birdeye WebSocket for real-time price tracking');
  }
  
  /**
   * Process whale copy trading signal
   */
  processWhaleCopyTrade(signal) {
    try {
      console.log(`[PAPER] 🐋 WHALE COPY TRADE SIGNAL: ${signal.symbol}`);
      console.log(`[PAPER]    Whale: ${signal.whaleName} (${signal.whale.substring(0, 8)}...)`);
      console.log(`[PAPER]    Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`[PAPER]    Price: $${signal.price.toFixed(6)}`);
      console.log(`[PAPER]    Volume: ${signal.volume.toFixed(4)} SOL`);
      
      // Check if we should copy this trade
      if (signal.confidence >= 0.7 && this.balance >= this.config.minPositionSize) {
        const copyAmount = Math.min(
          this.config.maxPositionSize * 0.8, // 80% of max position
          this.balance * 0.08 // 8% of balance
        );
        
        // Open copy trade position
        const position = {
          tokenAddress: signal.token,
          symbol: signal.symbol,
          amount: copyAmount,
          entryPrice: signal.price,
          entryTime: Date.now(),
          type: 'WHALE_COPY',
          whaleAddress: signal.whale,
          whaleName: signal.whaleName,
          whaleConfidence: signal.confidence
        };
        
        this.positions.set(signal.token, position);
        this.balance -= copyAmount;
        
        console.log(`[PAPER] 🟢 WHALE COPY TRADE: Bought ${signal.symbol} for $${copyAmount}`);
        console.log(`[PAPER]    Following ${signal.whaleName} (${(signal.confidence * 100).toFixed(1)}% confidence)`);
        
        // Emit copy trade event
        this.emit('whaleCopyTrade', {
          type: 'WHALE_COPY_BUY',
          position: position,
          signal: signal,
          timestamp: Date.now()
        });
      } else {
        console.log(`[PAPER] ⚠️ Skipping whale copy trade: Low confidence (${(signal.confidence * 100).toFixed(1)}%) or insufficient balance`);
      }
      
    } catch (error) {
      console.log(`[PAPER] ❌ Whale copy trade error: ${error.message}`);
    }
  }
  
  /**
   * Handle real-time price updates from Birdeye WebSocket
   */
  async handlePriceUpdate(data) {
    try {
      const tokenAddress = data.tokenAddress || data.address;
      const currentPrice = data.price || data.value;
      
      if (!tokenAddress || !currentPrice) {
        return; // Invalid price data
      }
      
      // Check if we have an active position for this token
      const position = this.positions.get(tokenAddress);
      if (!position) {
        return; // No position for this token
      }
      
      // Update position with current price
      position.currentPrice = currentPrice;
      position.lastUpdate = Date.now();
      
      // Calculate current profit/loss
      const priceChange = currentPrice - position.openPrice;
      const returnPercent = (priceChange / position.openPrice) * 100;
      const unrealizedProfit = position.amount * (returnPercent / 100);
      
      position.unrealizedProfit = unrealizedProfit;
      position.returnPercent = returnPercent;
      
      // Log significant price movements
      if (Math.abs(returnPercent) >= 5) {
        const direction = returnPercent > 0 ? '🟢' : '🔴';
        console.log(`[PAPER] ${direction} ${position.symbol}: ${returnPercent.toFixed(1)}% (${unrealizedProfit > 0 ? '+' : ''}$${unrealizedProfit.toFixed(2)})`);
      }
      
      // Check if we should close the position based on current price
      await this.evaluatePositionClose(position, { 
        dexScreener: { price: currentPrice },
        scores: { overall: position.openScore }
      });
      
    } catch (error) {
      console.log(`[PAPER] ❌ Error handling price update: ${error.message}`);
    }
  }
  
  /**
   * Process AI analysis and make trading decisions
   */
  async processAnalysis(analysis) {
    if (!analysis || analysis.error) {
      return { action: 'SKIP', reason: 'Invalid analysis' };
    }
    
    const tokenAddress = analysis.token;
    const symbol = analysis.symbol;
    const score = analysis.scores?.overall || 50;
    const confidence = analysis.confidence || 0.5;
    const recommendation = analysis.recommendation?.action || 'HOLD';
    
    console.log(`[PAPER] 📊 Processing ${symbol}: Score=${score}, Confidence=${Math.round(confidence*100)}%, Rec=${recommendation}`);
    console.log(`[PAPER] 🔧 Debug analysis object:`, {
      token: analysis.token,
      symbol: analysis.symbol,
      hasScores: !!analysis.scores,
      hasRecommendation: !!analysis.recommendation,
      keys: Object.keys(analysis)
    });
    
    try {
      // Check if we already have a position
      const existingPosition = this.positions.get(tokenAddress);
      console.log(`[PAPER] 🔧 Existing position check: ${symbol} -> ${existingPosition ? 'HAS POSITION' : 'NO POSITION'}`);
      
      if (existingPosition) {
        // Check if we should close the position
        console.log(`[PAPER] 🔧 Evaluating position close for ${symbol}`);
        return await this.evaluatePositionClose(existingPosition, analysis);
      } else {
        // Check if we should open a new position
        console.log(`[PAPER] 🔧 Evaluating position open for ${symbol}`);
        return await this.evaluatePositionOpen(tokenAddress, symbol, score, confidence, recommendation, analysis);
      }
      
    } catch (error) {
      console.log(`[PAPER] ❌ Error processing ${symbol}: ${error.message}`);
      return { action: 'ERROR', reason: error.message };
    }
  }
  
  /**
   * Evaluate opening a new position
   */
  async evaluatePositionOpen(tokenAddress, symbol, score, confidence, recommendation, analysis) {
    // Check if we have enough balance and positions
    if (this.positions.size >= this.config.maxPositions) {
      return { action: 'SKIP', reason: 'Max positions reached' };
    }
    
    // Determine position size based on score and confidence
    let positionSize = 0;
    let action = 'HOLD';
    let reason = '';
    
    // LOOSENED THRESHOLDS - More aggressive trading
    if (recommendation === 'STRONG_BUY' && score >= 55 && confidence >= 0.5) {
      positionSize = Math.min(this.config.maxPositionSize, this.balance * 0.12);
      action = 'BUY';
      reason = 'Strong buy signal with good confidence';
    } else if (recommendation === 'BUY' && score >= 45 && confidence >= 0.4) {
      positionSize = Math.min(this.config.maxPositionSize * 0.8, this.balance * 0.08);
      action = 'BUY';
      reason = 'Buy signal with moderate confidence';
    } else if (recommendation === 'WATCH' && score >= 40 && confidence >= 0.3) {
      positionSize = Math.min(this.config.maxPositionSize * 0.6, this.balance * 0.06);
      action = 'BUY';
      reason = 'Watch signal - moderate position';
    } else if (recommendation === 'RISKY' && score >= 5 && confidence >= 0.2) {
      positionSize = Math.min(this.config.maxPositionSize * 0.4, this.balance * 0.04);
      action = 'BUY';
      reason = 'Risky signal - small position for high potential';
      console.log(`[PAPER] 🎯 RISKY trade triggered for ${symbol}: score=${score}, confidence=${confidence}`);
    } else if (recommendation === 'AVOID' || score < 5) {
      action = 'AVOID';
      reason = 'Avoid signal or very low score';
    } else {
      action = 'HOLD';
      reason = 'Insufficient signals for action';
    }
    
    console.log(`[PAPER] 🔧 Position evaluation: ${symbol} -> action=${action}, score=${score}, confidence=${confidence}, rec=${recommendation}`);
    
    // Ensure minimum position size
    if (positionSize < this.config.minPositionSize && action === 'BUY') {
      action = 'HOLD';
      reason = 'Position size too small';
    }
    
    // Execute buy if conditions met
    console.log(`[PAPER] 🔧 Buy conditions check: action=${action}, positionSize=${positionSize}, balance=${this.balance}`);
    if (action === 'BUY' && positionSize > 0 && this.balance >= positionSize) {
      console.log(`[PAPER] 🔧 Opening position for ${symbol}`);
      const position = await this.openPosition(tokenAddress, symbol, positionSize, analysis);
      console.log(`[PAPER] 🟢 BUY ${symbol}: $${positionSize} (Score: ${score}, Confidence: ${Math.round(confidence*100)}%)`);
      return { action: 'BUY', position, reason };
    } else {
      console.log(`[PAPER] 🔧 Buy conditions not met for ${symbol}: action=${action}, positionSize=${positionSize}, balance=${this.balance}, sufficient=${this.balance >= positionSize}`);
    }
    
    return { action, reason };
  }
  
  /**
   * Evaluate closing an existing position
   */
  async evaluatePositionClose(position, analysis) {
    const currentScore = analysis.scores?.overall || 50;
    const currentRecommendation = analysis.recommendation?.action || 'HOLD';
    const timeHeld = Date.now() - position.openTime;
    const maxHoldTime = 8 * 60 * 60 * 1000; // 8 hours max
    
    // Calculate current profit if we have real-time price data
    const currentPrice = analysis.dexScreener?.price || position.currentPrice || position.openPrice;
    const returnPercent = position.returnPercent || ((currentPrice - position.openPrice) / position.openPrice) * 100;
    
    let action = 'HOLD';
    let reason = '';
    
    // PROFIT TAKING - Sell when we have good profits
    if (returnPercent >= 50) {
      action = 'SELL';
      reason = 'Profit taking - 50%+ gain';
    } else if (returnPercent >= 25 && timeHeld > 2 * 60 * 60 * 1000) {
      action = 'SELL';
      reason = 'Profit taking - 25%+ gain after 2+ hours';
    } else if (returnPercent <= -20) {
      action = 'SELL';
      reason = 'Stop loss - 20% loss limit';
    } else if (currentRecommendation === 'AVOID' || currentScore < 25) {
      action = 'SELL';
      reason = 'Strong avoid signal or very low score';
    } else if (timeHeld > maxHoldTime) {
      action = 'SELL';
      reason = 'Maximum hold time reached';
    } else if (currentScore < 35 && timeHeld > 4 * 60 * 60 * 1000) {
      action = 'SELL';
      reason = 'Low score after 4+ hours';
    }
    
    // Execute sell if conditions met
    if (action === 'SELL') {
      const result = await this.closePosition(position, analysis);
      if (result.error) {
        console.log(`[PAPER] ❌ Error closing position: ${result.error}`);
        return { action: 'ERROR', reason: result.error };
      }
      console.log(`[PAPER] 🔴 SELL ${position.symbol}: $${result.profit.toFixed(2)} profit (${result.returnPercent.toFixed(1)}%)`);
      return { action: 'SELL', result, reason };
    }
    
    return { action: 'HOLD', reason: 'Position performing well' };
  }
  
  /**
   * Open a new position
   */
  async openPosition(tokenAddress, symbol, amount, analysis) {
    const position = {
      tokenAddress,
      symbol,
      amount,
      openTime: Date.now(),
      openPrice: analysis.dexScreener?.price || 0,
      openScore: analysis.scores?.overall || 50,
      openRecommendation: analysis.recommendation?.action || 'HOLD',
      analysis: analysis
    };
    
    this.positions.set(tokenAddress, position);
    this.balance -= amount;
    
    console.log(`[PAPER] 📈 Position opened: ${symbol} @ $${amount}`);
    
    // Start tracking token with Birdeye WebSocket for real-time price updates
    try {
      console.log(`[PAPER] 🔧 Attempting to start Birdeye tracking for ${symbol} (${tokenAddress})`);
      const tracked = await birdeyeWebSocketManager.trackToken(tokenAddress, {
        symbol: symbol,
        openTime: Date.now(),
        openPrice: position.openPrice,
        paperTrade: true,
        recommendation: analysis.recommendation?.action
      });
      
      if (tracked) {
        console.log(`[PAPER] 🐦 Successfully started Birdeye tracking for ${symbol}`);
      } else {
        console.log(`[PAPER] ⚠️ Failed to start Birdeye tracking for ${symbol} - trackToken returned false`);
      }
    } catch (error) {
      console.log(`[PAPER] ❌ Error starting Birdeye tracking for ${symbol}: ${error.message}`);
      console.log(`[PAPER] 🔧 Error stack:`, error.stack);
    }
    
    return position;
  }
  
  /**
   * Close an existing position
   */
  async closePosition(position, currentAnalysis) {
    // Defensive check
    if (!position || !position.amount || !position.openPrice) {
      console.log(`[PAPER] ❌ Invalid position data:`, position);
      return { profit: 0, returnPercent: 0, error: 'Invalid position data' };
    }
    
    const currentPrice = currentAnalysis.dexScreener?.price || position.openPrice;
    const priceChange = currentPrice - position.openPrice;
    const returnPercent = (priceChange / position.openPrice) * 100;
    const profit = position.amount * (returnPercent / 100);
    
    // Update balance
    this.balance += position.amount + profit;
    
    // Record trade
    const trade = {
      tokenAddress: position.tokenAddress,
      symbol: position.symbol,
      amount: position.amount,
      openTime: position.openTime,
      closeTime: Date.now(),
      openPrice: position.openPrice,
      closePrice: currentPrice,
      profit: profit,
      returnPercent: returnPercent,
      duration: Date.now() - position.openTime,
      openScore: position.openScore,
      closeScore: currentAnalysis.scores?.overall || 50,
      openRecommendation: position.openRecommendation,
      closeRecommendation: currentAnalysis.recommendation?.action || 'HOLD'
    };
    
    this.tradeHistory.push(trade);
    this.positions.delete(position.tokenAddress);
    
    // Stop tracking token with Birdeye WebSocket
    try {
      await birdeyeWebSocketManager.untrackToken(position.tokenAddress);
      console.log(`[PAPER] 🐦 Stopped Birdeye tracking for ${position.symbol}`);
    } catch (error) {
      console.log(`[PAPER] ⚠️ Error stopping Birdeye tracking for ${position.symbol}: ${error.message}`);
    }
    
    // Update performance
    this.updatePerformance(trade);
    
    return trade;
  }
  
  /**
   * Update performance statistics
   */
  updatePerformance(trade) {
    this.performance.totalTrades++;
    
    if (trade.profit > 0) {
      this.performance.winningTrades++;
      this.performance.totalProfit += trade.profit;
    } else {
      this.performance.losingTrades++;
      this.performance.totalLoss += Math.abs(trade.profit);
    }
    
    // Update win rate
    this.performance.winRate = (this.performance.winningTrades / this.performance.totalTrades) * 100;
    
    // Update average return
    const totalReturn = this.performance.totalProfit - this.performance.totalLoss;
    this.performance.averageReturn = totalReturn / this.performance.totalTrades;
    
    // Update best/worst trades
    if (trade.profit > this.performance.bestTrade.profit) {
      this.performance.bestTrade = {
        profit: trade.profit,
        token: trade.symbol,
        time: trade.closeTime
      };
    }
    
    if (trade.profit < this.performance.worstTrade.loss) {
      this.performance.worstTrade = {
        loss: trade.profit,
        token: trade.symbol,
        time: trade.closeTime
      };
    }
    
    this.performance.lastUpdate = Date.now();
    
    // Save data
    this.saveTradingData();
  }
  
  /**
   * Get current portfolio status
   */
  getPortfolioStatus() {
    const totalInvested = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.amount, 0);
    
    const availableBalance = this.balance;
    const totalValue = availableBalance + totalInvested;
    
    return {
      balance: availableBalance,
      totalInvested: totalInvested,
      totalValue: totalValue,
      positions: this.positions.size,
      maxPositions: this.config.maxPositions,
      performance: this.performance,
      activePositions: Array.from(this.positions.values()).map(pos => ({
        symbol: pos.symbol,
        amount: pos.amount,
        openTime: pos.openTime,
        duration: Date.now() - pos.openTime,
        openScore: pos.openScore
      }))
    };
  }
  
  /**
   * Get detailed performance report
   */
  getPerformanceReport() {
    const totalReturn = this.performance.totalProfit - this.performance.totalLoss;
    const totalReturnPercent = ((totalReturn / this.config.initialBalance) * 100);
    const currentValue = this.balance + Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.amount, 0);
    const currentReturn = ((currentValue - this.config.initialBalance) / this.config.initialBalance) * 100;
    
    return {
      summary: {
        initialBalance: this.config.initialBalance,
        currentBalance: this.balance,
        currentValue: currentValue,
        totalReturn: totalReturn,
        totalReturnPercent: totalReturnPercent,
        currentReturn: currentReturn
      },
      trades: {
        total: this.performance.totalTrades,
        winning: this.performance.winningTrades,
        losing: this.performance.losingTrades,
        winRate: this.performance.winRate,
        averageReturn: this.performance.averageReturn
      },
      performance: {
        totalProfit: this.performance.totalProfit,
        totalLoss: this.performance.totalLoss,
        bestTrade: this.performance.bestTrade,
        worstTrade: this.performance.worstTrade
      },
      recentTrades: this.tradeHistory.slice(-10).map(trade => ({
        symbol: trade.symbol,
        profit: trade.profit,
        returnPercent: trade.returnPercent,
        duration: trade.duration,
        openScore: trade.openScore,
        closeScore: trade.closeScore
      }))
    };
  }
  
  /**
   * Load trading data from files
   */
  loadTradingData() {
    try {
      if (existsSync(this.config.performanceFile)) {
        const performanceData = JSON.parse(readFileSync(this.config.performanceFile, 'utf8'));
        this.performance = { ...this.performance, ...performanceData };
        console.log(`[PAPER] 📊 Loaded performance data: ${this.performance.totalTrades} trades`);
      }
      
      if (existsSync(this.config.tradesFile)) {
        const tradesData = JSON.parse(readFileSync(this.config.tradesFile, 'utf8'));
        this.tradeHistory = tradesData;
        console.log(`[PAPER] 📈 Loaded ${this.tradeHistory.length} historical trades`);
      }
    } catch (error) {
      console.log(`[PAPER] ⚠️ Error loading trading data: ${error.message}`);
    }
  }
  
  /**
   * Save trading data to files
   */
  saveTradingData() {
    try {
      writeFileSync(this.config.performanceFile, JSON.stringify(this.performance, null, 2));
      writeFileSync(this.config.tradesFile, JSON.stringify(this.tradeHistory, null, 2));
    } catch (error) {
      console.log(`[PAPER] ⚠️ Error saving trading data: ${error.message}`);
    }
  }
  
  /**
   * Reset simulator (for testing)
   */
  reset() {
    this.balance = this.config.initialBalance;
    this.positions.clear();
    this.tradeHistory = [];
    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      averageReturn: 0,
      bestTrade: { profit: 0, token: '', time: 0 },
      worstTrade: { loss: 0, token: '', time: 0 },
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    
    this.saveTradingData();
    console.log(`[PAPER] 🔄 Simulator reset to $${this.balance} balance`);
  }
}

export const paperTradingSimulator = new PaperTradingSimulator(); 