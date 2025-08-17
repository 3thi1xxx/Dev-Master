/**
 * Paper Trading System - REAL IMPLEMENTATION
 * Simulates real trading with actual market data and P&L tracking
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

class PaperTradingSystem extends EventEmitter {
  constructor() {
    super();
    
    // Portfolio configuration
    this.portfolio = {
      startingCapital: 10000,  // $10,000 USD starting
      currentCapital: 10000,
      positions: new Map(),
      closedPositions: [],
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      fees: 0
    };
    
    // Position tracking
    this.activePositions = new Map();
    
    // Trade history
    this.tradeHistory = [];
    
    // Performance metrics
    this.metrics = {
      dailyPnL: 0,
      weeklyPnL: 0,
      monthlyPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      roi: 0,
      profitFactor: 0,
      bestTrade: null,
      worstTrade: null,
      avgHoldTime: 0,
      totalVolume: 0
    };
    
    // Daily tracking
    this.dailyStats = new Map();
    this.startOfDay = new Date().setHours(0, 0, 0, 0);
    
    // Paper trading configuration
    this.config = {
      tradingFee: 0.001,      // 0.1% per trade
      slippage: 0.002,        // 0.2% slippage
      maxPositions: 10,       // Max concurrent positions
      positionSizing: {
        default: 0.02,        // 2% of portfolio per trade
        highConfidence: 0.05, // 5% for high confidence
        lowConfidence: 0.01   // 1% for low confidence
      }
    };
    
    // Data persistence
    this.dataPath = './data/paper-trading';
    this.ensureDataDirectory();
    
    // Auto-save interval
    this.autoSaveInterval = null;
    
    // Price tracking
    this.priceCache = new Map();
  }
  
  /**
   * Initialize paper trading system
   */
  async initialize() {
    console.log('💼 PAPER TRADING SYSTEM: Initializing');
    console.log(`💵 Starting Capital: $${this.portfolio.startingCapital.toLocaleString()}`);
    
    // FIXED: Start fresh each run instead of loading old data
    console.log('[PAPER] 🔄 Starting with fresh portfolio (no cache)');
    // await this.loadPortfolio(); // Commented out to start fresh
    
    // Start auto-save
    this.startAutoSave();
    
    // Start metrics calculation
    this.startMetricsCalculation();
    
    // Log current status
    this.logPortfolioStatus();
    
    return true;
  }
  
  /**
   * Open a new position
   */
  async openPosition(params) {
    const {
      tokenAddress,
      ticker,
      price,
      confidence = 'default',
      signal,
      scores
    } = params;
    
    // Check if we can open more positions
    if (this.activePositions.size >= this.config.maxPositions) {
      console.log(`[PAPER] ❌ Max positions reached (${this.config.maxPositions})`);
      return null;
    }
    
    // Calculate position size
    const positionSizePercent = this.config.positionSizing[confidence] || this.config.positionSizing.default;
    const positionValue = this.portfolio.currentCapital * positionSizePercent;
    
    // Apply slippage to entry price
    const entryPrice = price * (1 + this.config.slippage);
    
    // Calculate quantity
    const quantity = positionValue / entryPrice;
    
    // Calculate trading fee
    const fee = positionValue * this.config.tradingFee;
    
    // Check if we have enough capital
    if (positionValue + fee > this.portfolio.currentCapital) {
      console.log(`[PAPER] ❌ Insufficient capital for position`);
      return null;
    }
    
    // Create position
    const position = {
      id: `PT_${Date.now()}_${ticker}`,
      tokenAddress,
      ticker,
      entryPrice,
      currentPrice: entryPrice,
      quantity,
      entryValue: positionValue,
      currentValue: positionValue,
      entryTime: Date.now(),
      entryFee: fee,
      exitFee: 0,
      pnl: 0,
      pnlPercent: 0,
      status: 'open',
      confidence,
      signal,
      scores,
      stopLoss: entryPrice * 0.85,     // 15% stop loss
      takeProfit: entryPrice * 1.50,   // 50% take profit
      highestPrice: entryPrice,
      lowestPrice: entryPrice
    };
    
    // Update portfolio
    this.portfolio.currentCapital -= (positionValue + fee);
    this.portfolio.fees += fee;
    this.activePositions.set(position.id, position);
    
    // Record trade
    this.recordTrade({
      ...position,
      type: 'open',
      timestamp: Date.now()
    });
    
    // Emit event
    this.emit('position-opened', position);
    
    console.log(`[PAPER] 📈 OPENED: ${ticker}`);
    console.log(`  Price: $${entryPrice.toFixed(6)}`);
    console.log(`  Value: $${positionValue.toFixed(2)}`);
    console.log(`  Quantity: ${quantity.toFixed(2)}`);
    console.log(`  Confidence: ${confidence}`);
    
    return position;
  }
  
  /**
   * Close a position
   */
  async closePosition(positionId, reason = 'manual', currentPrice = null) {
    const position = this.activePositions.get(positionId);
    
    if (!position) {
      console.log(`[PAPER] ❌ Position not found: ${positionId}`);
      return null;
    }
    
    // Get current price if not provided
    if (!currentPrice) {
      currentPrice = position.currentPrice; // Use last known price
    }
    
    // Apply slippage to exit price
    const exitPrice = currentPrice * (1 - this.config.slippage);
    
    // Calculate exit value and fee
    const exitValue = position.quantity * exitPrice;
    const exitFee = exitValue * this.config.tradingFee;
    
    // Calculate P&L
    const totalFees = position.entryFee + exitFee;
    const netPnL = exitValue - position.entryValue - totalFees;
    const pnlPercent = (netPnL / position.entryValue) * 100;
    
    // Update position
    position.exitPrice = exitPrice;
    position.exitValue = exitValue;
    position.exitTime = Date.now();
    position.exitFee = exitFee;
    position.pnl = netPnL;
    position.pnlPercent = pnlPercent;
    position.status = 'closed';
    position.exitReason = reason;
    position.holdTime = position.exitTime - position.entryTime;
    
    // Update portfolio
    this.portfolio.currentCapital += exitValue - exitFee;
    this.portfolio.fees += exitFee;
    this.portfolio.realizedPnL += netPnL;
    this.portfolio.totalPnL = this.portfolio.realizedPnL;
    this.portfolio.totalTrades++;
    
    if (netPnL > 0) {
      this.portfolio.winCount++;
    } else {
      this.portfolio.lossCount++;
    }
    
    // Move to closed positions
    this.activePositions.delete(positionId);
    this.portfolio.closedPositions.push(position);
    
    // Record trade
    this.recordTrade({
      ...position,
      type: 'close',
      timestamp: Date.now()
    });
    
    // Update metrics
    this.updateMetrics(position);
    
    // Emit event
    this.emit('position-closed', position);
    
    // Log result
    const emoji = netPnL > 0 ? '💰' : '💸';
    const color = netPnL > 0 ? '🟢' : '🔴';
    
    console.log(`[PAPER] ${emoji} CLOSED: ${position.ticker} ${color}`);
    console.log(`  Entry: $${position.entryPrice.toFixed(6)}`);
    console.log(`  Exit: $${exitPrice.toFixed(6)}`);
    console.log(`  P&L: $${netPnL.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    console.log(`  Hold Time: ${this.formatDuration(position.holdTime)}`);
    console.log(`  Reason: ${reason}`);
    
    return position;
  }
  
  /**
   * Update position prices
   */
  updatePositionPrice(tokenAddress, newPrice) {
    let updated = false;
    
    for (const [id, position] of this.activePositions) {
      if (position.tokenAddress === tokenAddress) {
        const oldPrice = position.currentPrice;
        position.currentPrice = newPrice;
        position.currentValue = position.quantity * newPrice;
        
        // Update unrealized P&L
        const totalFees = position.entryFee + (position.currentValue * this.config.tradingFee);
        position.pnl = position.currentValue - position.entryValue - totalFees;
        position.pnlPercent = (position.pnl / position.entryValue) * 100;
        
        // Track high/low
        position.highestPrice = Math.max(position.highestPrice, newPrice);
        position.lowestPrice = Math.min(position.lowestPrice, newPrice);
        
        // Check stop loss
        if (newPrice <= position.stopLoss) {
          console.log(`[PAPER] 🛑 Stop loss triggered for ${position.ticker}`);
          this.closePosition(id, 'stop_loss', newPrice);
        }
        // Check take profit
        else if (newPrice >= position.takeProfit) {
          console.log(`[PAPER] 🎯 Take profit triggered for ${position.ticker}`);
          this.closePosition(id, 'take_profit', newPrice);
        }
        
        updated = true;
      }
    }
    
    // Update cache
    this.priceCache.set(tokenAddress, {
      price: newPrice,
      timestamp: Date.now()
    });
    
    if (updated) {
      this.calculateUnrealizedPnL();
    }
  }
  
  /**
   * Calculate unrealized P&L
   */
  calculateUnrealizedPnL() {
    let totalUnrealized = 0;
    
    for (const position of this.activePositions.values()) {
      totalUnrealized += position.pnl;
    }
    
    this.portfolio.unrealizedPnL = totalUnrealized;
    this.portfolio.totalPnL = this.portfolio.realizedPnL + this.portfolio.unrealizedPnL;
    
    // Calculate ROI
    this.metrics.roi = (this.portfolio.totalPnL / this.portfolio.startingCapital) * 100;
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(closedPosition) {
    // Update win rate
    this.metrics.winRate = this.portfolio.totalTrades > 0 
      ? (this.portfolio.winCount / this.portfolio.totalTrades) * 100 
      : 0;
    
    // Update average win/loss
    const wins = this.portfolio.closedPositions.filter(p => p.pnl > 0);
    const losses = this.portfolio.closedPositions.filter(p => p.pnl < 0);
    
    this.metrics.avgWin = wins.length > 0
      ? wins.reduce((sum, p) => sum + p.pnl, 0) / wins.length
      : 0;
    
    this.metrics.avgLoss = losses.length > 0
      ? losses.reduce((sum, p) => sum + p.pnl, 0) / losses.length
      : 0;
    
    // Update profit factor
    const totalWins = wins.reduce((sum, p) => sum + p.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0));
    this.metrics.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;
    
    // Update best/worst trade
    if (!this.metrics.bestTrade || closedPosition.pnl > this.metrics.bestTrade.pnl) {
      this.metrics.bestTrade = closedPosition;
    }
    if (!this.metrics.worstTrade || closedPosition.pnl < this.metrics.worstTrade.pnl) {
      this.metrics.worstTrade = closedPosition;
    }
    
    // Update average hold time
    const totalHoldTime = this.portfolio.closedPositions.reduce((sum, p) => sum + (p.holdTime || 0), 0);
    this.metrics.avgHoldTime = this.portfolio.closedPositions.length > 0
      ? totalHoldTime / this.portfolio.closedPositions.length
      : 0;
    
    // Update total volume
    this.metrics.totalVolume += closedPosition.entryValue + closedPosition.exitValue;
    
    // Calculate Sharpe ratio (simplified)
    if (this.portfolio.closedPositions.length > 5) {
      const returns = this.portfolio.closedPositions.map(p => p.pnlPercent);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      this.metrics.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    }
    
    // Update drawdown
    const currentValue = this.portfolio.currentCapital + this.portfolio.unrealizedPnL;
    const highWaterMark = Math.max(this.portfolio.startingCapital, ...this.portfolio.closedPositions.map(p => 
      this.portfolio.startingCapital + this.portfolio.closedPositions
        .filter(cp => cp.exitTime <= p.exitTime)
        .reduce((sum, cp) => sum + cp.pnl, 0)
    ));
    
    this.metrics.currentDrawdown = ((highWaterMark - currentValue) / highWaterMark) * 100;
    this.metrics.maxDrawdown = Math.max(this.metrics.maxDrawdown, this.metrics.currentDrawdown);
  }
  
  /**
   * Get portfolio status
   */
  getPortfolioStatus() {
    const equity = this.portfolio.currentCapital + this.portfolio.unrealizedPnL;
    
    return {
      // Capital
      startingCapital: this.portfolio.startingCapital,
      currentCapital: this.portfolio.currentCapital,
      equity: equity,
      
      // P&L
      realizedPnL: this.portfolio.realizedPnL,
      unrealizedPnL: this.portfolio.unrealizedPnL,
      totalPnL: this.portfolio.totalPnL,
      roi: this.metrics.roi,
      
      // Positions
      openPositions: this.activePositions.size,
      totalTrades: this.portfolio.totalTrades,
      
      // Performance
      winRate: this.metrics.winRate,
      avgWin: this.metrics.avgWin,
      avgLoss: this.metrics.avgLoss,
      profitFactor: this.metrics.profitFactor,
      sharpeRatio: this.metrics.sharpeRatio,
      maxDrawdown: this.metrics.maxDrawdown,
      
      // Trades
      winCount: this.portfolio.winCount,
      lossCount: this.portfolio.lossCount,
      bestTrade: this.metrics.bestTrade,
      worstTrade: this.metrics.worstTrade,
      
      // Volume & Fees
      totalVolume: this.metrics.totalVolume,
      totalFees: this.portfolio.fees
    };
  }
  
  /**
   * Get active positions
   */
  getActivePositions() {
    return Array.from(this.activePositions.values()).map(p => ({
      ...p,
      duration: Date.now() - p.entryTime
    }));
  }
  
  /**
   * Get trade history
   */
  getTradeHistory(limit = 50) {
    return this.tradeHistory.slice(-limit);
  }
  
  /**
   * Get daily P&L
   */
  getDailyPnL() {
    const today = new Date().toDateString();
    const todayTrades = this.portfolio.closedPositions.filter(p => 
      new Date(p.exitTime).toDateString() === today
    );
    
    const dailyPnL = todayTrades.reduce((sum, p) => sum + p.pnl, 0);
    const dailyTrades = todayTrades.length;
    const dailyWins = todayTrades.filter(p => p.pnl > 0).length;
    
    return {
      date: today,
      pnl: dailyPnL,
      trades: dailyTrades,
      wins: dailyWins,
      losses: dailyTrades - dailyWins,
      winRate: dailyTrades > 0 ? (dailyWins / dailyTrades) * 100 : 0
    };
  }
  
  /**
   * Log portfolio status
   */
  logPortfolioStatus() {
    const status = this.getPortfolioStatus();
    const equity = status.equity;
    const pnlColor = status.totalPnL >= 0 ? '🟢' : '🔴';
    
    console.log('\n' + '═'.repeat(60));
    console.log('💼 PAPER TRADING PORTFOLIO STATUS');
    console.log('═'.repeat(60));
    console.log(`Equity: $${equity.toFixed(2)} ${pnlColor}`);
    console.log(`P&L: $${status.totalPnL.toFixed(2)} (${status.roi.toFixed(2)}%)`);
    console.log(`  Realized: $${status.realizedPnL.toFixed(2)}`);
    console.log(`  Unrealized: $${status.unrealizedPnL.toFixed(2)}`);
    console.log(`Open Positions: ${status.openPositions}`);
    console.log(`Total Trades: ${status.totalTrades}`);
    console.log(`Win Rate: ${status.winRate.toFixed(1)}% (${status.winCount}W/${status.lossCount}L)`);
    console.log(`Avg Win: $${status.avgWin.toFixed(2)}`);
    console.log(`Avg Loss: $${status.avgLoss.toFixed(2)}`);
    console.log(`Profit Factor: ${status.profitFactor.toFixed(2)}`);
    console.log(`Sharpe Ratio: ${status.sharpeRatio.toFixed(2)}`);
    console.log(`Max Drawdown: ${status.maxDrawdown.toFixed(2)}%`);
    console.log('═'.repeat(60));
  }
  
  /**
   * Record trade for history
   */
  recordTrade(trade) {
    this.tradeHistory.push({
      ...trade,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
  }
  
  /**
   * Format duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  /**
   * Save portfolio to disk
   */
  async savePortfolio() {
    try {
      const data = {
        portfolio: this.portfolio,
        metrics: this.metrics,
        activePositions: Array.from(this.activePositions.entries()),
        tradeHistory: this.tradeHistory.slice(-500),
        timestamp: Date.now()
      };
      
      const filePath = path.join(this.dataPath, 'portfolio.json');
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
      
      // Save daily snapshot
      const today = new Date().toISOString().split('T')[0];
      const snapshotPath = path.join(this.dataPath, `snapshot_${today}.json`);
      await fs.promises.writeFile(snapshotPath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('[PAPER] Error saving portfolio:', error.message);
    }
  }
  
  /**
   * Load portfolio from disk
   */
  async loadPortfolio() {
    try {
      const filePath = path.join(this.dataPath, 'portfolio.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
        
        // Safely merge saved data with defaults to prevent null values
        if (data.portfolio) {
          this.portfolio = {
            ...this.portfolio,
            ...data.portfolio,
            // Ensure critical values are never null
            totalPnL: data.portfolio.totalPnL || 0,
            realizedPnL: data.portfolio.realizedPnL || 0,
            unrealizedPnL: data.portfolio.unrealizedPnL || 0
          };
        }
        
        if (data.metrics) {
          this.metrics = {
            ...this.metrics,
            ...data.metrics,
            // Ensure critical metrics are never null
            roi: data.metrics.roi || 0,
            winRate: data.metrics.winRate || 0,
            sharpeRatio: data.metrics.sharpeRatio || 0,
            profitFactor: data.metrics.profitFactor || 0,
            maxDrawdown: data.metrics.maxDrawdown || 0
          };
        }
        
        this.tradeHistory = data.tradeHistory || [];
        
        // Restore active positions
        if (data.activePositions) {
          this.activePositions = new Map(data.activePositions);
        }
        
        const equity = this.portfolio.currentCapital + this.portfolio.unrealizedPnL;
        console.log(`[PAPER] 📂 Loaded portfolio from ${new Date(data.timestamp).toLocaleString()}`);
        console.log(`[PAPER] 💰 Current equity: $${equity.toFixed(2)}`);
      }
    } catch (error) {
      console.error('[PAPER] Error loading portfolio:', error.message);
    }
  }
  
  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }
  
  /**
   * Start auto-save
   */
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.savePortfolio();
    }, 60000); // Save every minute
  }
  
  /**
   * Start metrics calculation
   */
  startMetricsCalculation() {
    setInterval(() => {
      this.calculateUnrealizedPnL();
      
      // Log status every 5 minutes
      if (Date.now() % 300000 < 60000) {
        this.logPortfolioStatus();
      }
    }, 10000); // Calculate every 10 seconds
  }
  
  /**
   * Reset portfolio
   */
  resetPortfolio() {
    console.log('[PAPER] ⚠️ Resetting portfolio to initial state');
    
    // Close all positions
    for (const [id, position] of this.activePositions) {
      this.closePosition(id, 'reset', position.currentPrice);
    }
    
    // Reset portfolio
    this.portfolio = {
      startingCapital: 10000,
      currentCapital: 10000,
      positions: new Map(),
      closedPositions: [],
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      fees: 0
    };
    
    // Reset metrics
    this.metrics = {
      dailyPnL: 0,
      weeklyPnL: 0,
      monthlyPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      roi: 0,
      profitFactor: 0,
      bestTrade: null,
      worstTrade: null,
      avgHoldTime: 0,
      totalVolume: 0
    };
    
    // Clear history
    this.tradeHistory = [];
    
    // Save reset state
    this.savePortfolio();
    
    console.log('[PAPER] ✅ Portfolio reset complete');
  }
  
  /**
   * Shutdown
   */
  async shutdown() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    await this.savePortfolio();
    console.log('[PAPER] 💾 Portfolio saved and shutdown complete');
  }
}

// Export singleton
export const paperTradingSystem = new PaperTradingSystem();
export default paperTradingSystem; 