#!/usr/bin/env node
/**
 * 🎯 UNIFIED STRATEGY ENGINE
 * Consolidates all trading strategies and execution logic:
 * - Surge-based new token sniping
 * - Whale copy trading with performance tracking  
 * - Momentum/technical analysis strategies
 * - Multi-DEX arbitrage opportunities
 * - Dynamic position sizing and risk management
 */

import { EventEmitter } from 'node:events';
import { dataManager } from './DataManager.js';
import { intelligenceEngine } from './IntelligenceEngine.js';
import { connectionManager } from './ConnectionManager.js';

export class StrategyEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Strategy weights and allocations
      strategies: {
        surgeSniper: {
          enabled: true,
          allocation: 0.40,        // 40% of available capital
          maxPositionSize: 0.02,   // 2% per trade
          minScore: 7.0,           // Intelligence score threshold
          maxConcurrent: 5         // Max simultaneous positions
        },
        whaleFollower: {
          enabled: true,
          allocation: 0.35,        // 35% of available capital
          maxPositionSize: 0.05,   // 5% per trade (higher confidence)
          minWinRate: 0.65,        // 65% whale win rate minimum
          followDelay: 2000,       // 2 second validation delay
          maxConcurrent: 3
        },
        momentumRider: {
          enabled: true,
          allocation: 0.25,        // 25% of available capital
          maxPositionSize: 0.03,   // 3% per trade
          minConfidence: 0.75,     // 75% confidence minimum
          maxConcurrent: 4
        }
      },
      
      // Global risk controls
      globalLimits: {
        maxDailyLoss: 0.05,        // 5% daily loss limit
        maxTotalPositions: 10,     // Max total open positions
        maxConcurrentNew: 3,       // Max new positions simultaneously
        emergencyStopLoss: 0.03,   // 3% emergency stop all trades
        cooldownPeriod: 300000     // 5 min cooldown after losses
      },
      
      // Execution parameters
      execution: {
        maxSlippage: 0.02,         // 2% max slippage
        priorityFeeMultiplier: 1.5, // 1.5x standard priority fee
        confirmationTimeout: 30000,  // 30 second timeout
        retryAttempts: 3,          // 3 retry attempts
        mevProtection: true        // Enable MEV protection
      },
      
      ...options
    };
    
    // Active strategies and positions
    this.activeStrategies = new Map();
    this.openPositions = new Map();
    this.strategyMetrics = new Map();
    
    // Risk monitoring
    this.riskLimits = {
      dailyPnL: 0,
      activeTrades: 0,
      lastTradeTime: 0,
      consecutiveLosses: 0,
      inCooldown: false
    };
    
    // Performance tracking per strategy
    this.performance = {
      surgeSniper: { trades: 0, wins: 0, totalPnL: 0, avgHoldTime: 0 },
      whaleFollower: { trades: 0, wins: 0, totalPnL: 0, avgHoldTime: 0 },
      momentumRider: { trades: 0, wins: 0, totalPnL: 0, avgHoldTime: 0 }
    };
    
    // Cross-DEX arbitrage tracking
    this.arbitrageOpportunities = new Map();
    
    console.log('🎯 UNIFIED STRATEGY ENGINE INITIALIZED');
    console.log('⚡ Consolidating: Surge Sniper + Whale Follower + Momentum Rider');
  }
  
  /**
   * Initialize strategy engine and connect to intelligence systems
   */
  async initialize() {
    console.log('[STRATEGY] 🚀 Initializing trading strategies...');
    
    // Connect to intelligence engine signals
    intelligenceEngine.on('trading_signal', (intelligence) => {
      this.processIntelligenceSignal(intelligence);
    });
    
    // Connect to data manager for real-time updates
    dataManager.on('token_surge', (tokenData) => {
      this.evaluateSurgeOpportunity(tokenData);
    });
    
    dataManager.on('whale_activity', (whaleData) => {
      this.evaluateWhaleFollowing(whaleData);
    });
    
    dataManager.on('fee_update', (feeData) => {
      this.updateFeeParameters(feeData);
    });
    
    // Connect to Birdeye WebSocket events
    connectionManager.on('birdeye-update', (data) => {
      if (data.type === 'NEW_TOKEN') {
        console.log('[STRATEGY] 🆕 New token detected via WebSocket');
        this.evaluateSurgeOpportunity(data);
      }
      if (data.type === 'LARGE_TRADE') {
        console.log('[STRATEGY] 🐋 Whale trade detected:', data.valueUsd);
        this.evaluateWhaleFollowing(data);
      }
    });
    
    connectionManager.on('price', (priceData) => {
      // 1-second price updates for ultra-fast scalping
      if (this.strategies.scalping?.enabled) {
        this.processScalpingSignal(priceData);
      }
    });
    
    // Initialize individual strategies
    await this.initializeStrategies();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start risk monitoring
    this.startRiskMonitoring();
    
    console.log('[STRATEGY] ✅ All strategies initialized and ready');
    this.emit('initialized');
  }
  
  /**
   * Process intelligence signals and route to appropriate strategies
   */
  async processIntelligenceSignal(intelligence) {
    try {
      const { signal, scores, tokenData } = intelligence;
      
      if (signal.action === 'hold') return; // No action needed
      
      console.log(`[STRATEGY] 📊 Processing ${signal.action} signal: ${tokenData.ticker} (Score: ${scores.composite.toFixed(2)})`);
      
      // Check global risk limits
      if (!this.checkGlobalRiskLimits()) {
        console.log('[STRATEGY] 🚨 Global risk limits exceeded, ignoring signal');
        return;
      }
      
      // Route to appropriate strategy based on signal characteristics
      if (signal.action === 'buy' || signal.action === 'strong_buy') {
        
        // Determine best strategy for this opportunity
        const strategy = this.selectOptimalStrategy(intelligence);
        
        if (strategy) {
          await this.executeStrategy(strategy, intelligence);
        }
        
      } else if (signal.action === 'sell' || signal.action === 'strong_sell') {
        
        // Handle exit signals for existing positions
        await this.handleExitSignal(intelligence);
      }
      
    } catch (error) {
      console.error('[STRATEGY] ❌ Error processing intelligence signal:', error.message);
    }
  }
  
  /**
   * 🚀 SURGE SNIPER STRATEGY
   * Fast execution on new token surges with high intelligence scores
   */
  async evaluateSurgeOpportunity(tokenData) {
    try {
      if (!this.config.strategies.surgeSniper.enabled) return;
      
      // Quick validation - must meet minimum criteria
      if (!this.validateSurgeCandidate(tokenData)) return;
      
      console.log(`[SURGE] ⚡ Evaluating surge: ${tokenData.ticker} (Rank: ${tokenData.rank}, Jump: ${tokenData.rankChange})`);
      
      // Fetch full token data from Birdeye API
      if (tokenData.address) {
        console.log(`[SURGE] 🔍 Fetching detailed data for ${tokenData.ticker}...`);
        const fullTokenData = await dataManager.getTokenData(tokenData.address);
        if (fullTokenData) {
          // Merge full data with surge event data
          Object.assign(tokenData, fullTokenData);
        }
      }
      
      // Check for cross-DEX arbitrage opportunities
      this.detectArbitrageOpportunity(tokenData);
      
      // Get intelligence analysis
      const intelligence = intelligenceEngine.getTokenIntelligence(tokenData.address);
      
      if (!intelligence || intelligence.scores.composite < this.config.strategies.surgeSniper.minScore) {
        return; // Doesn't meet intelligence threshold
      }
      
      // Check strategy-specific limits
      const activeSurgePositions = this.getActivePositionsByStrategy('surgeSniper');
      if (activeSurgePositions.length >= this.config.strategies.surgeSniper.maxConcurrent) {
        console.log('[SURGE] 📊 Max concurrent positions reached, skipping');
        return;
      }
      
      // Calculate position size based on confidence
      const positionSize = this.calculatePositionSize('surgeSniper', intelligence);
      
      // Track latency for Auckland advantage
      const latencyStart = Date.now();
      
      // Execute surge snipe with performance tracking
      await this.executeStrategy('surgeSniper', intelligence);
      
      // Log Auckland advantage metrics
      const totalLatency = Date.now() - latencyStart;
      console.log(`[SURGE] ⚡ Auckland Advantage: ${totalLatency}ms reaction time`);
      
    } catch (error) {
      console.error('[SURGE] ❌ Surge evaluation error:', error.message);
    }
  }
  
  /**
   * 🐋 WHALE FOLLOWER STRATEGY  
   * Copy high-performing whale trades with validation delay
   */
  async evaluateWhaleFollowing(whaleData) {
    try {
      if (!this.config.strategies.whaleFollower.enabled) return;
      
      console.log(`[WHALE] 🐋 Evaluating whale activity: ${whaleData.wallet}`);
      
      // Fetch detailed token data for whale's trade
      if (whaleData.token || whaleData.tokenAddress) {
        const address = whaleData.tokenAddress || whaleData.token;
        console.log(`[WHALE] 🔍 Fetching token data for whale trade...`);
        const tokenData = await dataManager.getTokenData(address);
        if (tokenData) {
          Object.assign(whaleData, { tokenData });
        }
      }
      
      // Get whale performance profile
      const whaleProfile = intelligenceEngine.getWhaleProfile(whaleData.wallet);
      
      if (!whaleProfile || whaleProfile.winRate < this.config.strategies.whaleFollower.minWinRate) {
        console.log('[WHALE] 📊 Whale does not meet performance criteria');
        return;
      }
      
      // Validation delay (avoid front-running ourselves)
      await this.sleep(this.config.strategies.whaleFollower.followDelay);
      
      // Re-validate trade is still viable
      const currentIntelligence = await intelligenceEngine.analyzeToken({
        address: whaleData.tokenAddress,
        ticker: whaleData.tokenTicker || 'UNKNOWN'
      });
      
      if (currentIntelligence.scores.risk < 6.0) {
        console.log('[WHALE] 🚨 Risk assessment changed, aborting whale follow');
        return;
      }
      
      // Check strategy-specific limits
      const activeWhalePositions = this.getActivePositionsByStrategy('whaleFollower');
      if (activeWhalePositions.length >= this.config.strategies.whaleFollower.maxConcurrent) {
        return;
      }
      
      // Calculate position size based on whale confidence
      const positionSize = this.calculatePositionSize('whaleFollower', currentIntelligence, whaleProfile);
      
      // Execute whale follow
      await this.executeStrategy('whaleFollower', currentIntelligence);
      
    } catch (error) {
      console.error('[WHALE] ❌ Whale following error:', error.message);
    }
  }
  
  /**
   * 📈 MOMENTUM RIDER STRATEGY
   * Technical analysis based momentum trading
   */
  async evaluateMomentumOpportunity(tokenData, technicalSignals) {
    try {
      if (!this.config.strategies.momentumRider.enabled) return;
      
      console.log(`[MOMENTUM] 📈 Evaluating momentum: ${tokenData.ticker}`);
      
      // Analyze technical indicators
      const momentumScore = this.calculateMomentumScore(technicalSignals);
      
      if (momentumScore < this.config.strategies.momentumRider.minConfidence) {
        return;
      }
      
      // Get intelligence confirmation
      const intelligence = intelligenceEngine.getTokenIntelligence(tokenData.address);
      
      if (!intelligence || intelligence.scores.technical < 7.0) {
        return; // Technical score not strong enough
      }
      
      // Check strategy limits
      const activeMomentumPositions = this.getActivePositionsByStrategy('momentumRider');
      if (activeMomentumPositions.length >= this.config.strategies.momentumRider.maxConcurrent) {
        return;
      }
      
      // Calculate position size
      const positionSize = this.calculatePositionSize('momentumRider', intelligence);
      
      // Execute momentum trade
      await this.executeStrategy('momentumRider', intelligence);
      
    } catch (error) {
      console.error('[MOMENTUM] ❌ Momentum evaluation error:', error.message);
    }
  }
  
  /**
   * 🎯 SELECT OPTIMAL STRATEGY
   * Choose the best strategy based on signal characteristics
   */
  selectOptimalStrategy(intelligence) {
    const { signal, scores, tokenData } = intelligence;
    
    // Priority logic for strategy selection
    
    // 1. High urgency surge signals -> Surge Sniper
    if (tokenData.timeToSurge < 30 && tokenData.rankChange > 0 && scores.composite > 7.5) {
      if (this.config.strategies.surgeSniper.enabled) {
        return 'surgeSniper';
      }
    }
    
    // 2. High confidence + whale correlation -> Whale Follower  
    if (scores.composite > 8.0 && signal.confidence > 0.8) {
      if (this.config.strategies.whaleFollower.enabled) {
        return 'whaleFollower';
      }
    }
    
    // 3. Strong technical signals -> Momentum Rider
    if (scores.technical > 7.0 && scores.risk > 6.0) {
      if (this.config.strategies.momentumRider.enabled) {
        return 'momentumRider';
      }
    }
    
    // 4. Default to surge sniper if enabled and meets threshold
    if (this.config.strategies.surgeSniper.enabled && scores.composite > this.config.strategies.surgeSniper.minScore) {
      return 'surgeSniper';
    }
    
    return null; // No suitable strategy
  }
  
  /**
   * ⚡ UNIFIED STRATEGY EXECUTION
   */
  async executeStrategy(strategyName, intelligence) {
    try {
      console.log(`[STRATEGY] ⚡ Executing ${strategyName} for ${intelligence.tokenData.ticker}`);
      
      const executionPlan = {
        strategy: strategyName,
        tokenAddress: intelligence.tokenData.address,
        tokenTicker: intelligence.tokenData.ticker,
        intelligence,
        positionSize: this.calculatePositionSize(strategyName, intelligence),
        timestamp: Date.now(),
        id: `${strategyName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      };
      
      // Strategy-specific execution parameters
      switch (strategyName) {
        case 'surgeSniper':
          executionPlan.urgency = 'high';
          executionPlan.maxSlippage = 0.03;
          executionPlan.timeout = 15000;
          break;
          
        case 'whaleFollower':
          executionPlan.urgency = 'medium';
          executionPlan.maxSlippage = 0.02;
          executionPlan.timeout = 30000;
          break;
          
        case 'momentumRider':
          executionPlan.urgency = 'low';
          executionPlan.maxSlippage = 0.015;
          executionPlan.timeout = 45000;
          break;
      }
      
      // Execute the trade
      this.emit('execute_trade', executionPlan);
      
      // Track the position
      this.openPositions.set(executionPlan.id, {
        ...executionPlan,
        entryTime: Date.now(),
        status: 'pending'
      });
      
      // Update strategy metrics
      this.updateStrategyMetrics(strategyName, 'trade_initiated');
      
    } catch (error) {
      console.error(`[STRATEGY] ❌ ${strategyName} execution error:`, error.message);
    }
  }
  
  /**
   * 📊 DYNAMIC POSITION SIZING
   */
  calculatePositionSize(strategyName, intelligence, whaleProfile = null) {
    const strategyConfig = this.config.strategies[strategyName];
    const baseSize = strategyConfig.maxPositionSize;
    
    // Confidence multiplier (0.5 to 1.0)
    const confidenceMultiplier = Math.max(0.5, intelligence.signal.confidence);
    
    // Risk adjustment (higher risk = smaller position)
    const riskMultiplier = Math.max(0.3, intelligence.scores.risk / 10);
    
    // Whale performance multiplier (if applicable)
    const whaleMultiplier = whaleProfile ? Math.min(1.2, whaleProfile.winRate * 1.5) : 1.0;
    
    // Calculate final position size
    const positionSize = baseSize * confidenceMultiplier * riskMultiplier * whaleMultiplier;
    
    return Math.max(0.005, Math.min(baseSize, positionSize)); // Min 0.5%, max strategy limit
  }
  
  /**
   * 🛡️ RISK MANAGEMENT & VALIDATION
   */
  checkGlobalRiskLimits() {
    // Daily loss limit
    if (this.riskLimits.dailyPnL <= -this.config.globalLimits.maxDailyLoss) {
      console.log('[RISK] 🚨 Daily loss limit exceeded');
      return false;
    }
    
    // Max total positions
    if (this.openPositions.size >= this.config.globalLimits.maxTotalPositions) {
      console.log('[RISK] 📊 Max total positions reached');
      return false;
    }
    
    // Cooldown period after losses
    if (this.riskLimits.inCooldown) {
      console.log('[RISK] ⏳ In cooldown period');
      return false;
    }
    
    return true;
  }
  
  validateSurgeCandidate(tokenData) {
    // Enhanced validation matching comprehensive plan
    const buyPressureRatio = tokenData.sellCount > 0 ? 
      tokenData.buyCount / tokenData.sellCount : tokenData.buyCount;
    const volumeRatio = tokenData.liquidity > 0 ? 
      tokenData.volume / tokenData.liquidity : 0;
    
    return (
              tokenData.liquidity > 50 &&            // Min liquidity: 50 SOL (realistic for launches)
      tokenData.devPercent <= 10 &&          // Max dev holdings: 10%
      tokenData.top10Percent <= 80 &&        // Max concentration: 80%
      tokenData.rankChange > 0 &&            // Positive momentum
      buyPressureRatio >= 2.0 &&             // Min buy pressure: 2.0x
      volumeRatio >= 0.1                     // Min volume ratio: 0.1
    );
  }
  
  /**
   * 📊 PERFORMANCE MONITORING
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      const metrics = this.calculatePerformanceMetrics();
      this.emit('performance_update', metrics);
    }, 300000); // Every 5 minutes
  }
  
  startRiskMonitoring() {
    setInterval(() => {
      this.updateRiskMetrics();
      this.checkEmergencyConditions();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * 🔧 HELPER METHODS
   */
  getActivePositionsByStrategy(strategyName) {
    return Array.from(this.openPositions.values()).filter(
      position => position.strategy === strategyName && position.status === 'active'
    );
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  updateStrategyMetrics(strategyName, action) {
    if (!this.strategyMetrics.has(strategyName)) {
      this.strategyMetrics.set(strategyName, {
        tradesInitiated: 0,
        tradesCompleted: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        lastActivity: Date.now()
      });
    }
    
    const metrics = this.strategyMetrics.get(strategyName);
    
    switch (action) {
      case 'trade_initiated':
        metrics.tradesInitiated++;
        break;
      case 'trade_completed':
        metrics.tradesCompleted++;
        break;
      case 'trade_win':
        metrics.wins++;
        break;
      case 'trade_loss':
        metrics.losses++;
        break;
    }
    
    metrics.lastActivity = Date.now();
    this.strategyMetrics.set(strategyName, metrics);
  }
  
  /**
   * Initialize individual strategies
   */
  async initializeStrategies() {
    // Strategy-specific initialization
    console.log('[STRATEGY] 📋 Initializing individual strategies...');
    
    Object.keys(this.config.strategies).forEach(strategyName => {
      if (this.config.strategies[strategyName].enabled) {
        console.log(`[STRATEGY] ✅ ${strategyName} strategy enabled`);
        this.activeStrategies.set(strategyName, {
          name: strategyName,
          status: 'active',
          lastActivity: Date.now()
        });
      }
    });
  }
  
  /**
   * Handle exit signals for existing positions
   */
  async handleExitSignal(intelligence) {
    const tokenAddress = intelligence.tokenData.address;
    
    // Find any open positions for this token
    const positionsToExit = Array.from(this.openPositions.values()).filter(
      position => position.tokenAddress === tokenAddress
    );
    
    if (positionsToExit.length > 0) {
      console.log(`[STRATEGY] 🔄 Exit signal for ${intelligence.tokenData.ticker}, closing ${positionsToExit.length} positions`);
      
      positionsToExit.forEach(position => {
        this.emit('close_position', {
          positionId: position.id,
          reason: 'intelligence_exit_signal',
          urgency: intelligence.signal.action === 'strong_sell' ? 'high' : 'medium'
        });
      });
    }
  }
  
  calculateMomentumScore(technicalSignals) {
    // Implementation for momentum scoring based on technical indicators
    // TODO: Implement RSI, MACD, volume analysis, etc.
    return 0.75; // Placeholder
  }
  
  calculatePerformanceMetrics() {
    // Calculate comprehensive performance metrics across all strategies
    // TODO: Implement detailed performance calculations
    return {
      totalTrades: this.openPositions.size,
      strategiesActive: this.activeStrategies.size,
      dailyPnL: this.riskLimits.dailyPnL,
      timestamp: Date.now()
    };
  }
  
  updateRiskMetrics() {
    // Update risk tracking metrics
    // TODO: Implement real-time risk calculations
  }
  
  checkEmergencyConditions() {
    // Check for emergency stop conditions
    // TODO: Implement emergency stop logic
  }
  
  updateFeeParameters(feeData) {
    // Update execution parameters based on current network fees
    if (feeData.type === 'jito-bribe-fee') {
      this.config.execution.jitoFee = feeData.fee;
    } else if (feeData.type === 'sol-priority-fee') {
      this.config.execution.basePriorityFee = feeData.fee;
    }
    console.log(`[STRATEGY] 📊 Updated ${feeData.type}: ${feeData.fee}`);
  }
  
  /**
   * 🔄 CROSS-DEX ARBITRAGE DETECTION
   * Monitor price differences between Pump.fun and Raydium
   */
  processScalpingSignal(priceData) {
    if (!priceData.address || !priceData.price) return;
    
    if (!this.priceHistory) this.priceHistory = new Map();
    const prevPrice = this.priceHistory.get(priceData.address);
    
    if (prevPrice) {
      const change = (priceData.price - prevPrice) / prevPrice;
      if (change > 0.005) { // 0.5% micro-pump
        this.emit('scalp-signal', { address: priceData.address, price: priceData.price, change });
      }
    }
    
    this.priceHistory.set(priceData.address, priceData.price);
  }
  
  detectArbitrageOpportunity(tokenData) {
    try {
      // Check if token has dexPaid flag (indicates Pump.fun graduation)
      if (!tokenData.dexPaid) return;
      
      const arbitrage = {
        tokenAddress: tokenData.address,
        ticker: tokenData.ticker,
        pumpPrice: tokenData.price, // Current Pump.fun price
        raydiumPrice: null,
        spread: 0,
        opportunity: false,
        timestamp: Date.now()
      };
      
      // TODO: Get Raydium price for comparison
      // For now, simulate detection based on volume spikes
      if (tokenData.volume > tokenData.liquidity * 0.5) {
        arbitrage.opportunity = true;
        arbitrage.spread = 0.03; // Simulated 3% spread
        
        console.log(`[ARBITRAGE] 💎 Opportunity detected: ${tokenData.ticker}`);
        console.log(`[ARBITRAGE] 📊 Spread: ${(arbitrage.spread * 100).toFixed(2)}%`);
        
        this.arbitrageOpportunities.set(tokenData.address, arbitrage);
        this.emit('arbitrage_opportunity', arbitrage);
      }
      
    } catch (error) {
      console.error('[ARBITRAGE] ❌ Detection error:', error.message);
    }
  }
}

// Export singleton instance
export const strategyEngine = new StrategyEngine(); 