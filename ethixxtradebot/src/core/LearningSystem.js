/**
 * Learning System - AI-Driven Strategy Optimization
 * Tracks patterns, analyzes outcomes, and evolves strategies
 */

import fs from 'fs';
import path from 'path';

class LearningSystem {
  constructor() {
    this.dataPath = './data/learning';
    this.patterns = {
      winning: new Map(),
      losing: new Map(),
      neutral: new Map()
    };
    
    // Phase 6: AI Learning Configuration
    this.config = {
      minSampleSize: 50,      // Minimum trades before adjusting strategy
      confidenceThreshold: 0.7, // 70% confidence required for pattern
      learningRate: 0.1,     // How quickly to adapt
      memoryWindow: 1000     // Number of recent trades to consider
    };
    
    // Pattern recognition from live data examples
    this.knownPatterns = {
      // MINECRAFT APPROVED pattern: 17-second surge, 43 buys vs 17 sells
      rapidMomentum: {
        timeWindow: [10, 30],  // 10-30 second detection
        buyRatio: [2.0, 5.0],  // 2-5x more buys than sells
        successRate: 0
      },
      
      // Dementia Don pattern: 29-second build, balanced buy/sell
      steadyBuild: {
        timeWindow: [25, 60],
        buyRatio: [1.0, 1.5],
        successRate: 0
      },
      
      // PUTinCoin pattern: 6-second rapid detection, extreme buy pressure
      flashSurge: {
        timeWindow: [0, 10],
        buyRatio: [3.0, 10.0],
        successRate: 0
      }
    };
    
    // Performance tracking
    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    
    // Market condition tracking
    this.marketConditions = {
      volatility: 'normal',
      trend: 'neutral',
      volume: 'average',
      timeOfDay: new Map() // Track performance by hour
    };
    
    // Strategy adjustments
    this.adjustments = {
      filters: {},
      scoring: {},
      timing: {}
    };
    
    this.tradeHistory = [];
  }
  
  /**
   * Initialize learning system
   */
  async initialize() {
    console.log('🧠 LEARNING SYSTEM: Initializing AI optimization');
    
    // Create data directory if not exists
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    // Load historical patterns if available
    await this.loadHistoricalData();
    
    // Start pattern analysis
    this.startPatternAnalysis();
    
    // Start performance optimization
    this.startOptimization();
    
    return true;
  }
  
  /**
   * Record trade for learning
   */
  recordTrade(trade) {
    const outcome = {
      timestamp: Date.now(),
      tokenAddress: trade.tokenAddress,
      ticker: trade.ticker,
      
      // Entry conditions
      entry: {
        price: trade.entryPrice,
        time: trade.entryTime,
        surgeTime: trade.surgeDetectionTime,
        buyCount: trade.buyCount,
        sellCount: trade.sellCount,
        volume: trade.volume,
        liquidity: trade.liquidity,
        devPercent: trade.devPercent,
        scores: trade.scores // All scoring components
      },
      
      // Exit conditions
      exit: {
        price: trade.exitPrice,
        time: trade.exitTime,
        reason: trade.exitReason // stop loss, take profit, manual
      },
      
      // Performance
      performance: {
        profitPercent: ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100,
        holdTime: trade.exitTime - trade.entryTime,
        maxGain: trade.maxPrice ? ((trade.maxPrice - trade.entryPrice) / trade.entryPrice) * 100 : 0,
        maxLoss: trade.minPrice ? ((trade.minPrice - trade.entryPrice) / trade.entryPrice) * 100 : 0
      },
      
      // Market context
      context: {
        hour: new Date(trade.entryTime).getHours(),
        dayOfWeek: new Date(trade.entryTime).getDay(),
        marketVolume: trade.marketVolume,
        volatility: this.calculateVolatility()
      }
    };
    
    // Classify outcome
    if (outcome.performance.profitPercent > 5) {
      outcome.result = 'win';
      this.patterns.winning.set(outcome.tokenAddress, outcome);
      this.performance.winningTrades++;
    } else if (outcome.performance.profitPercent < -5) {
      outcome.result = 'loss';
      this.patterns.losing.set(outcome.tokenAddress, outcome);
      this.performance.losingTrades++;
    } else {
      outcome.result = 'neutral';
      this.patterns.neutral.set(outcome.tokenAddress, outcome);
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(outcome);
    
    // Analyze pattern
    this.analyzePattern(outcome);
    
    // Store in history
    this.tradeHistory.push(outcome);
    if (this.tradeHistory.length > this.config.memoryWindow) {
      this.tradeHistory.shift();
    }
    
    // Persist to disk
    this.saveTradeData(outcome);
    
    // Check if we should adjust strategy
    if (this.performance.totalTrades % this.config.minSampleSize === 0) {
      this.optimizeStrategy();
    }
    
    return outcome;
  }
  
  /**
   * Analyze pattern for learning
   */
  analyzePattern(outcome) {
    // Identify which known pattern this matches
    let matchedPattern = null;
    
    const surgeTime = outcome.entry.surgeTime;
    const buyRatio = outcome.entry.buyCount / Math.max(outcome.entry.sellCount, 1);
    
    // Check rapid momentum pattern
    if (surgeTime >= 10 && surgeTime <= 30 && buyRatio >= 2.0 && buyRatio <= 5.0) {
      matchedPattern = 'rapidMomentum';
    }
    // Check steady build pattern
    else if (surgeTime >= 25 && surgeTime <= 60 && buyRatio >= 1.0 && buyRatio <= 1.5) {
      matchedPattern = 'steadyBuild';
    }
    // Check flash surge pattern
    else if (surgeTime <= 10 && buyRatio >= 3.0) {
      matchedPattern = 'flashSurge';
    }
    
    // Update pattern success rates
    if (matchedPattern) {
      const pattern = this.knownPatterns[matchedPattern];
      const samples = this.getPatternSamples(matchedPattern);
      
      if (outcome.result === 'win') {
        pattern.successRate = (pattern.successRate * samples + 1) / (samples + 1);
      } else if (outcome.result === 'loss') {
        pattern.successRate = (pattern.successRate * samples) / (samples + 1);
      }
      
      console.log(`[LEARN] Pattern: ${matchedPattern}, Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
    }
    
    // Identify new patterns if unknown
    if (!matchedPattern && outcome.result === 'win' && outcome.performance.profitPercent > 25) {
      this.discoverNewPattern(outcome);
    }
    
    // Track time-of-day performance
    const hour = outcome.context.hour;
    const hourPerf = this.marketConditions.timeOfDay.get(hour) || { wins: 0, losses: 0 };
    
    if (outcome.result === 'win') {
      hourPerf.wins++;
    } else if (outcome.result === 'loss') {
      hourPerf.losses++;
    }
    
    this.marketConditions.timeOfDay.set(hour, hourPerf);
  }
  
  /**
   * Discover new winning patterns
   */
  discoverNewPattern(outcome) {
    console.log(`[LEARN] 🎯 New winning pattern discovered!`);
    console.log(`  Surge Time: ${outcome.entry.surgeTime}s`);
    console.log(`  Buy Ratio: ${(outcome.entry.buyCount / outcome.entry.sellCount).toFixed(2)}x`);
    console.log(`  Profit: ${outcome.performance.profitPercent.toFixed(2)}%`);
    
    // Create new pattern profile
    const patternId = `pattern_${Date.now()}`;
    this.knownPatterns[patternId] = {
      timeWindow: [outcome.entry.surgeTime - 5, outcome.entry.surgeTime + 5],
      buyRatio: [
        (outcome.entry.buyCount / outcome.entry.sellCount) * 0.8,
        (outcome.entry.buyCount / outcome.entry.sellCount) * 1.2
      ],
      successRate: 1.0,
      discovered: new Date().toISOString(),
      sample: outcome
    };
    
    // Save new pattern
    this.savePattern(patternId, this.knownPatterns[patternId]);
  }
  
  /**
   * Optimize strategy based on learnings
   */
  optimizeStrategy() {
    console.log('[LEARN] 🔧 Optimizing strategy based on', this.performance.totalTrades, 'trades');
    
    // Calculate win rate
    const winRate = this.performance.winningTrades / this.performance.totalTrades;
    
    // Adjust filters based on performance
    if (winRate < 0.35) {
      // Too many losses, tighten filters
      console.log('[LEARN] Tightening filters (win rate: ' + (winRate * 100).toFixed(1) + '%)');
      
      this.adjustments.filters = {
        minLiquidity: 600,    // Was 500
        maxDevHolds: 8,       // Was 10
        minBuyPressure: 2.5,  // Was 2.0
        minVolumeRatio: 0.15  // Was 0.1
      };
    } else if (winRate > 0.65) {
      // Good performance, can be slightly more aggressive
      console.log('[LEARN] Relaxing filters (win rate: ' + (winRate * 100).toFixed(1) + '%)');
      
      this.adjustments.filters = {
        minLiquidity: 400,    // Was 500
        maxDevHolds: 12,      // Was 10
        minBuyPressure: 1.8,  // Was 2.0
        minVolumeRatio: 0.08  // Was 0.1
      };
    }
    
    // Identify best performing hours
    const bestHours = Array.from(this.marketConditions.timeOfDay.entries())
      .map(([hour, perf]) => ({
        hour,
        winRate: perf.wins / (perf.wins + perf.losses)
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 4);
    
    if (bestHours.length > 0) {
      console.log('[LEARN] Best trading hours:', bestHours.map(h => h.hour).join(', '));
      this.adjustments.timing = { preferredHours: bestHours.map(h => h.hour) };
    }
    
    // Adjust scoring weights based on correlation with wins
    this.optimizeScoringWeights();
    
    // Save adjustments
    this.saveAdjustments();
    
    return this.adjustments;
  }
  
  /**
   * Optimize scoring component weights
   */
  optimizeScoringWeights() {
    const winningScores = Array.from(this.patterns.winning.values())
      .map(t => t.entry.scores);
    
    const losingScores = Array.from(this.patterns.losing.values())
      .map(t => t.entry.scores);
    
    if (winningScores.length < 10 || losingScores.length < 10) return;
    
    // Calculate average scores for each component
    const components = ['technical', 'fundamental', 'risk', 'social'];
    const weights = {};
    
    components.forEach(component => {
      const avgWin = winningScores.reduce((sum, s) => sum + (s[component] || 0), 0) / winningScores.length;
      const avgLoss = losingScores.reduce((sum, s) => sum + (s[component] || 0), 0) / losingScores.length;
      
      // Higher weight for components that differ more between wins and losses
      const discrimination = Math.abs(avgWin - avgLoss);
      weights[component] = 0.25 + (discrimination * 0.1); // Base 25% + up to 10% bonus
    });
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(k => weights[k] /= totalWeight);
    
    this.adjustments.scoring = weights;
    
    console.log('[LEARN] Optimized scoring weights:', weights);
  }
  
  /**
   * Calculate current market volatility
   */
  calculateVolatility() {
    if (this.tradeHistory.length < 10) return 'normal';
    
    const recentPrices = this.tradeHistory.slice(-20).map(t => t.entry.price);
    const avg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / recentPrices.length;
    const stdDev = Math.sqrt(variance);
    const coeffVar = stdDev / avg;
    
    if (coeffVar > 0.3) return 'high';
    if (coeffVar < 0.1) return 'low';
    return 'normal';
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(outcome) {
    this.performance.totalTrades++;
    
    // Update averages
    if (outcome.result === 'win') {
      const oldAvg = this.performance.avgWinPercent;
      const count = this.performance.winningTrades;
      this.performance.avgWinPercent = (oldAvg * (count - 1) + outcome.performance.profitPercent) / count;
      
      this.performance.currentStreak = Math.max(0, this.performance.currentStreak) + 1;
      this.performance.bestStreak = Math.max(this.performance.bestStreak, this.performance.currentStreak);
    } else if (outcome.result === 'loss') {
      const oldAvg = this.performance.avgLossPercent;
      const count = this.performance.losingTrades;
      this.performance.avgLossPercent = (oldAvg * (count - 1) + outcome.performance.profitPercent) / count;
      
      this.performance.currentStreak = Math.min(0, this.performance.currentStreak) - 1;
    }
    
    // Calculate Sharpe ratio (simplified)
    if (this.tradeHistory.length > 30) {
      const returns = this.tradeHistory.map(t => t.performance.profitPercent);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
      this.performance.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    }
    
    // Track max drawdown
    if (outcome.performance.profitPercent < 0) {
      this.performance.maxDrawdown = Math.min(this.performance.maxDrawdown, outcome.performance.profitPercent);
    }
  }
  
  /**
   * Get current adjustments for strategy
   */
  getAdjustments() {
    return this.adjustments;
  }
  
  /**
   * Get performance report
   */
  getPerformanceReport() {
    const winRate = this.performance.totalTrades > 0 
      ? (this.performance.winningTrades / this.performance.totalTrades) * 100
      : 0;
    
    return {
      ...this.performance,
      winRate: winRate.toFixed(1) + '%',
      riskRewardRatio: Math.abs(this.performance.avgWinPercent / this.performance.avgLossPercent).toFixed(2),
      profitFactor: (this.performance.avgWinPercent * this.performance.winningTrades) / 
                    Math.abs(this.performance.avgLossPercent * this.performance.losingTrades),
      patterns: Object.entries(this.knownPatterns).map(([name, pattern]) => ({
        name,
        successRate: (pattern.successRate * 100).toFixed(1) + '%'
      }))
    };
  }
  
  /**
   * Helper methods for data persistence
   */
  async loadHistoricalData() {
    try {
      const historyFile = path.join(this.dataPath, 'trade_history.json');
      if (fs.existsSync(historyFile)) {
        const data = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.tradeHistory = data.trades || [];
        this.performance = data.performance || this.performance;
        console.log(`[LEARN] Loaded ${this.tradeHistory.length} historical trades`);
      }
    } catch (error) {
      console.error('[LEARN] Error loading historical data:', error.message);
    }
  }
  
  saveTradeData(outcome) {
    try {
      const historyFile = path.join(this.dataPath, 'trade_history.json');
      const data = {
        trades: this.tradeHistory,
        performance: this.performance,
        lastUpdate: new Date().toISOString()
      };
      fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[LEARN] Error saving trade data:', error.message);
    }
  }
  
  savePattern(id, pattern) {
    try {
      const patternFile = path.join(this.dataPath, `pattern_${id}.json`);
      fs.writeFileSync(patternFile, JSON.stringify(pattern, null, 2));
    } catch (error) {
      console.error('[LEARN] Error saving pattern:', error.message);
    }
  }
  
  saveAdjustments() {
    try {
      const adjustFile = path.join(this.dataPath, 'strategy_adjustments.json');
      fs.writeFileSync(adjustFile, JSON.stringify(this.adjustments, null, 2));
    } catch (error) {
      console.error('[LEARN] Error saving adjustments:', error.message);
    }
  }
  
  getPatternSamples(patternName) {
    return Array.from(this.tradeHistory).filter(t => {
      const surgeTime = t.entry.surgeTime;
      const buyRatio = t.entry.buyCount / Math.max(t.entry.sellCount, 1);
      const pattern = this.knownPatterns[patternName];
      
      return surgeTime >= pattern.timeWindow[0] && 
             surgeTime <= pattern.timeWindow[1] &&
             buyRatio >= pattern.buyRatio[0] &&
             buyRatio <= pattern.buyRatio[1];
    }).length;
  }
  
  /**
   * Start continuous pattern analysis
   */
  startPatternAnalysis() {
    setInterval(() => {
      if (this.tradeHistory.length < 10) return;
      
      // Log current learning status
      console.log('[LEARN] 📊 Performance Update:');
      console.log(`  Total Trades: ${this.performance.totalTrades}`);
      console.log(`  Win Rate: ${((this.performance.winningTrades / this.performance.totalTrades) * 100).toFixed(1)}%`);
      console.log(`  Avg Win: ${this.performance.avgWinPercent.toFixed(2)}%`);
      console.log(`  Avg Loss: ${this.performance.avgLossPercent.toFixed(2)}%`);
      console.log(`  Sharpe Ratio: ${this.performance.sharpeRatio.toFixed(2)}`);
      console.log(`  Current Streak: ${this.performance.currentStreak}`);
      
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Start strategy optimization loop
   */
  startOptimization() {
    setInterval(() => {
      if (this.performance.totalTrades >= this.config.minSampleSize) {
        this.optimizeStrategy();
      }
    }, 600000); // Every 10 minutes
  }
}

// Export singleton
export const learningSystem = new LearningSystem();
export default learningSystem; 