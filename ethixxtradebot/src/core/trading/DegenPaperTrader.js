import { EventEmitter } from 'node:events';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { degenIntelligence } from '../../intelligence/DegenIntelligence.js';

export class DegenPaperTrader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      startingBalance: options.startingBalance || 1000, // $1000 starting balance
      maxPositionSize: options.maxPositionSize || 200, // $200 max position (20% of balance)
      minPositionSize: options.minPositionSize || 25, // $25 min position
      maxPositions: options.maxPositions || 8, // Up to 8 concurrent positions
      degenThreshold: options.degenThreshold || 0.5, // 50% degen score to buy (MORE AGGRESSIVE!)
      yoloThreshold: options.yoloThreshold || 0.6, // 60% degen score for YOLO (MORE AGGRESSIVE!)
      fomoThreshold: options.fomoThreshold || 0.3, // 30% FOMO to trigger buy (MORE AGGRESSIVE!)
      stopLoss: options.stopLoss || 0.3, // 30% stop loss
      takeProfit: options.takeProfit || 2.0, // 200% take profit
      maxHoldTime: options.maxHoldTime || 3600000, // 1 hour max hold
      degenMode: options.degenMode !== false
    };
    
    this.balance = this.config.startingBalance;
    this.positions = new Map();
    this.tradeHistory = [];
    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    
    this.loadState();
    this.connectToDegenIntelligence();
    
    console.log('🔥 DEGEN PAPER TRADER INITIALIZED');
    console.log(`💰 Starting Balance: $${this.balance}`);
    console.log(`🎯 Degen Mode: ${this.config.degenMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`⚡ Degen Threshold: ${this.config.degenThreshold * 100}%`);
    console.log(`🚀 YOLO Threshold: ${this.config.yoloThreshold * 100}%`);
    console.log(`💎 Max Position Size: $${this.config.maxPositionSize}`);
    console.log(`🎲 Max Positions: ${this.config.maxPositions}`);
  }

  /**
   * Connect to degen intelligence
   */
  connectToDegenIntelligence() {
    degenIntelligence.on('degenSignals', (signalData) => {
      this.processDegenSignal(signalData);
    });
  }

  /**
   * Process degen signals
   */
  processDegenSignal(signalData) {
    try {
      const { tokenData, signals, analysis } = signalData;
      
      signals.forEach(signal => {
        console.log(`[DEGEN-TRADER] 🎯 Signal: ${signal.type} for ${tokenData.symbol}`);
        console.log(`[DEGEN-TRADER]    Reason: ${signal.reason}`);
        console.log(`[DEGEN-TRADER]    Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
        
        if (signal.type === 'DEGEN_YOLO') {
          this.executeYOLOTrade(tokenData, signal, analysis);
        } else if (signal.type === 'DEGEN_BUY') {
          this.executeDegenBuy(tokenData, signal, analysis);
        } else if (signal.type === 'DEGEN_WATCH') {
          this.addToWatchlist(tokenData, signal, analysis);
        }
      });
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ Error processing signal: ${error.message}`);
    }
  }

  /**
   * Execute YOLO trade (maximum degen)
   */
  executeYOLOTrade(tokenData, signal, analysis) {
    try {
      if (this.positions.size >= this.config.maxPositions) {
        console.log(`[DEGEN-TRADER] ⚠️ Max positions reached, skipping YOLO`);
        return;
      }

      const yoloAmount = Math.min(
        this.config.maxPositionSize * 1.5, // 150% of max position for YOLO
        this.balance * 0.25 // 25% of balance
      );

      if (yoloAmount < this.config.minPositionSize) {
        console.log(`[DEGEN-TRADER] ⚠️ Insufficient balance for YOLO`);
        return;
      }

      const position = {
        tokenAddress: tokenData.address,
        symbol: tokenData.symbol,
        amount: yoloAmount,
        entryPrice: tokenData.price || 0.000001,
        entryTime: Date.now(),
        type: 'DEGEN_YOLO',
        degenScore: analysis.degenScore,
        fomoLevel: analysis.fomoLevel,
        hypeLevel: analysis.hypeLevel,
        riskLevel: signal.risk
      };

      this.positions.set(tokenData.address, position);
      this.balance -= yoloAmount;

      console.log(`[DEGEN-TRADER] 🚀 YOLO TRADE: ${tokenData.symbol} for $${yoloAmount}`);
      console.log(`[DEGEN-TRADER]    Degen Score: ${(analysis.degenScore * 100).toFixed(1)}%`);
      console.log(`[DEGEN-TRADER]    FOMO Level: ${(analysis.fomoLevel * 100).toFixed(1)}%`);
      console.log(`[DEGEN-TRADER]    Balance: $${this.balance.toFixed(2)}`);

      this.emit('yoloTrade', {
        type: 'YOLO_BUY',
        position: position,
        signal: signal,
        analysis: analysis,
        timestamp: Date.now()
      });

      this.saveState();
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ YOLO trade error: ${error.message}`);
    }
  }

  /**
   * Execute degen buy
   */
  executeDegenBuy(tokenData, signal, analysis) {
    try {
      if (this.positions.size >= this.config.maxPositions) {
        console.log(`[DEGEN-TRADER] ⚠️ Max positions reached, skipping degen buy`);
        return;
      }

      const buyAmount = Math.min(
        this.config.maxPositionSize,
        this.balance * 0.15 // 15% of balance
      );

      if (buyAmount < this.config.minPositionSize) {
        console.log(`[DEGEN-TRADER] ⚠️ Insufficient balance for degen buy`);
        return;
      }

      const position = {
        tokenAddress: tokenData.address,
        symbol: tokenData.symbol,
        amount: buyAmount,
        entryPrice: tokenData.price || 0.000001,
        entryTime: Date.now(),
        type: 'DEGEN_BUY',
        degenScore: analysis.degenScore,
        momentumScore: analysis.momentumScore,
        riskLevel: signal.risk
      };

      this.positions.set(tokenData.address, position);
      this.balance -= buyAmount;

      console.log(`[DEGEN-TRADER] 🔥 DEGEN BUY: ${tokenData.symbol} for $${buyAmount}`);
      console.log(`[DEGEN-TRADER]    Degen Score: ${(analysis.degenScore * 100).toFixed(1)}%`);
      console.log(`[DEGEN-TRADER]    Momentum: ${(analysis.momentumScore * 100).toFixed(1)}%`);
      console.log(`[DEGEN-TRADER]    Balance: $${this.balance.toFixed(2)}`);

      this.emit('degenBuy', {
        type: 'DEGEN_BUY',
        position: position,
        signal: signal,
        analysis: analysis,
        timestamp: Date.now()
      });

      this.saveState();
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ Degen buy error: ${error.message}`);
    }
  }

  /**
   * Add to watchlist
   */
  addToWatchlist(tokenData, signal, analysis) {
    console.log(`[DEGEN-TRADER] 👀 WATCHING: ${tokenData.symbol}`);
    console.log(`[DEGEN-TRADER]    Hype Level: ${(analysis.hypeLevel * 100).toFixed(1)}%`);
    console.log(`[DEGEN-TRADER]    Degen Score: ${(analysis.degenScore * 100).toFixed(1)}%`);
  }

  /**
   * Update position prices and check exit conditions
   */
  updatePositions(tokenData) {
    try {
      const position = this.positions.get(tokenData.address);
      if (!position) return;

      const currentPrice = tokenData.price || position.entryPrice;
      const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
      const timeHeld = Date.now() - position.entryTime;

      // Check exit conditions
      let shouldExit = false;
      let exitReason = '';

      // Stop loss
      if (priceChange <= -this.config.stopLoss) {
        shouldExit = true;
        exitReason = 'STOP_LOSS';
      }
      // Take profit
      else if (priceChange >= this.config.takeProfit) {
        shouldExit = true;
        exitReason = 'TAKE_PROFIT';
      }
      // Max hold time
      else if (timeHeld >= this.config.maxHoldTime) {
        shouldExit = true;
        exitReason = 'MAX_HOLD_TIME';
      }
      // Degen exit (if momentum dies)
      else if (position.type === 'DEGEN_YOLO' && priceChange < -0.1 && timeHeld > 300000) {
        shouldExit = true;
        exitReason = 'DEGEN_EXIT';
      }

      if (shouldExit) {
        this.closePosition(tokenData.address, currentPrice, exitReason);
      }
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ Position update error: ${error.message}`);
    }
  }

  /**
   * Close position
   */
  closePosition(tokenAddress, currentPrice, reason) {
    try {
      const position = this.positions.get(tokenAddress);
      if (!position) return;

      const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
      const profitLoss = position.amount * priceChange;
      const exitValue = position.amount + profitLoss;

      this.balance += exitValue;
      this.positions.delete(tokenAddress);

      // Update stats
      this.stats.totalTrades++;
      if (profitLoss > 0) {
        this.stats.winningTrades++;
        this.stats.currentStreak = Math.max(0, this.stats.currentStreak) + 1;
        this.stats.biggestWin = Math.max(this.stats.biggestWin, profitLoss);
      } else {
        this.stats.losingTrades++;
        this.stats.currentStreak = Math.min(0, this.stats.currentStreak) - 1;
        this.stats.biggestLoss = Math.min(this.stats.biggestLoss, profitLoss);
      }
      this.stats.totalProfit += profitLoss;
      this.stats.bestStreak = Math.max(this.stats.bestStreak, Math.abs(this.stats.currentStreak));

      const emoji = profitLoss > 0 ? '🚀' : '💀';
      console.log(`[DEGEN-TRADER] ${emoji} CLOSED: ${position.symbol} - ${reason}`);
      console.log(`[DEGEN-TRADER]    P&L: $${profitLoss.toFixed(2)} (${(priceChange * 100).toFixed(1)}%)`);
      console.log(`[DEGEN-TRADER]    Balance: $${this.balance.toFixed(2)}`);
      console.log(`[DEGEN-TRADER]    Total P&L: $${this.stats.totalProfit.toFixed(2)}`);

      this.emit('positionClosed', {
        type: 'POSITION_CLOSED',
        position: position,
        profitLoss: profitLoss,
        priceChange: priceChange,
        reason: reason,
        timestamp: Date.now()
      });

      this.saveState();
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ Close position error: ${error.message}`);
    }
  }

  /**
   * Get portfolio status
   */
  getPortfolioStatus() {
    const totalValue = this.balance + Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.amount, 0);

    return {
      balance: this.balance,
      totalValue: totalValue,
      positions: Array.from(this.positions.values()),
      stats: this.stats,
      winRate: this.stats.totalTrades > 0 ? 
        (this.stats.winningTrades / this.stats.totalTrades * 100).toFixed(1) : 0,
      timestamp: Date.now()
    };
  }

  /**
   * Save state to file
   */
  saveState() {
    try {
      const state = {
        balance: this.balance,
        positions: Array.from(this.positions.entries()),
        stats: this.stats,
        timestamp: Date.now()
      };
      writeFileSync('degen_paper_trader_state.json', JSON.stringify(state, null, 2));
    } catch (error) {
      console.log(`[DEGEN-TRADER] ❌ Save state error: ${error.message}`);
    }
  }

  /**
   * Load state from file
   */
  loadState() {
    try {
      if (existsSync('degen_paper_trader_state.json')) {
        const state = JSON.parse(readFileSync('degen_paper_trader_state.json', 'utf8'));
        this.balance = state.balance || this.config.startingBalance;
        this.positions = new Map(state.positions || []);
        this.stats = state.stats || this.stats;
        console.log(`[DEGEN-TRADER] 📊 Loaded state: Balance $${this.balance}, ${this.positions.size} positions`);
      }
    } catch (error) {
      console.log(`[DEGEN-TRADER] ⚠️ Load state error: ${error.message}`);
    }
  }

  /**
   * Reset trader
   */
  reset() {
    this.balance = this.config.startingBalance;
    this.positions.clear();
    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    this.saveState();
    console.log(`[DEGEN-TRADER] 🔄 Reset complete: Balance $${this.balance}`);
  }
}

export const degenPaperTrader = new DegenPaperTrader(); 