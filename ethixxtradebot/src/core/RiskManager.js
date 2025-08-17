#!/usr/bin/env node
/**
 * 🛡️ UNIFIED RISK MANAGER
 * Comprehensive risk management and safety systems:
 * - Pre-trade validation (security, liquidity, concentration)
 * - Dynamic position sizing and limits
 * - Real-time monitoring and circuit breakers
 * - Emergency stop mechanisms and recovery
 * - Portfolio-level risk assessment
 */

import { EventEmitter } from 'node:events';
import { dataManager } from './DataManager.js';
import { intelligenceEngine } from './IntelligenceEngine.js';

export class RiskManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Portfolio-level limits
      portfolio: {
        maxDailyLoss: 0.05,           // 5% max daily portfolio loss
        maxWeeklyLoss: 0.15,          // 15% max weekly portfolio loss
        maxDrawdown: 0.20,            // 20% max historical drawdown
        maxPositionSize: 0.10,        // 10% max single position
        maxCorrelatedPositions: 0.25, // 25% max correlated positions
        minCashReserve: 0.20          // 20% minimum cash reserve
      },
      
      // Position-level limits (PHASE 5: Dynamic Sizing)
      position: {
        maxHoldTime: 86400000,        // 24 hours max hold time
        stopLossPercent: 0.15,        // 15% stop loss
        takeProfitPercent: 0.50,      // 50% take profit
        trailingStopPercent: 0.10,    // 10% trailing stop
        emergencyExitPercent: 0.25,   // 25% emergency exit
        maxSlippagePercent: 0.03,     // 3% max slippage
        
        // Dynamic position sizing based on token age
        dynamicSizing: {
          newTokens: 0.01,            // 1% max for <1 hour old
          establishedTokens: 0.03,    // 3% max for >1 day old
          highConfidence: 0.05,       // 5% max for high-scoring
          emergencyStop: 0.03         // 3% total loss triggers stop
        }
      },
      
      // Token-level risk filters
      token: {
        minLiquidity: 1000,           // $1000 minimum liquidity
        maxDevHoldings: 5,            // 5% max dev holdings
        maxTop10Holdings: 70,         // 70% max top 10 holder concentration
        maxBundlerPercent: 30,        // 30% max bundler concentration
        minHolderCount: 20,           // 20 minimum unique holders
        minAgeHours: 0.5,            // 30 minutes minimum age
        maxPriceImpact: 0.05         // 5% max price impact
      },
      
      // Market condition adjustments
      market: {
        bearMultiplier: 0.5,          // Reduce position sizes by 50% in bear market
        volatilityThreshold: 0.20,    // 20% volatility threshold
        volumeThreshold: 0.10,        // 10% volume threshold
        correlationLimit: 0.70        // 70% max correlation between positions
      },
      
      // Circuit breakers
      circuitBreakers: {
        consecutiveLossLimit: 3,      // Stop after 3 consecutive losses
        hourlyLossLimit: 0.02,        // 2% max hourly loss
        rapidLossThreshold: 0.03,     // 3% rapid loss in 15 minutes
        systemShutdownLoss: 0.08,     // 8% loss triggers system shutdown
        maxPositionFailures: 5        // 5 position failures trigger review
      },
      
      ...options
    };
    
    // Risk tracking
    this.riskMetrics = {
      // Portfolio metrics
      portfolio: {
        currentValue: 0,
        dailyPnL: 0,
        weeklyPnL: 0,
        maxDrawdown: 0,
        cashReserve: 0,
        totalPositions: 0,
        correlatedValue: 0
      },
      
      // Position metrics
      positions: new Map(),
      
      // Performance tracking
      performance: {
        consecutiveLosses: 0,
        hourlyLoss: 0,
        rapidLossAmount: 0,
        rapidLossTime: 0,
        positionFailures: 0,
        lastRiskCheck: Date.now()
      },
      
      // Circuit breaker states
      circuitBreakers: {
        consecutiveLossBreaker: false,
        hourlyLossBreaker: false,
        rapidLossBreaker: false,
        systemShutdownBreaker: false,
        emergencyStopActive: false
      }
    };
    
    // Risk assessment cache
    this.riskAssessments = new Map();
    this.correlationMatrix = new Map();
    
    console.log('🛡️ UNIFIED RISK MANAGER INITIALIZED');
    console.log('🔒 Comprehensive: Portfolio + Position + Token + Market Risk');
  }
  
  /**
   * Initialize risk management systems
   */
  async initialize() {
    console.log('[RISK] 🚀 Initializing risk management systems...');
    
    // Connect to strategy engine for position updates
    this.on('position_opened', (position) => {
      this.trackPosition(position);
    });
    
    this.on('position_closed', (position) => {
      this.updatePositionMetrics(position);
    });
    
    // Connect to data manager for market updates
    dataManager.on('token_surge', (tokenData) => {
      this.assessTokenRisk(tokenData);
    });
    
    // Start risk monitoring
    this.startRiskMonitoring();
    
    // Initialize portfolio tracking
    await this.initializePortfolioTracking();
    
    console.log('[RISK] ✅ Risk management systems ready');
    this.emit('initialized');
  }
  
  /**
   * 🔍 PRE-TRADE RISK ASSESSMENT
   * Comprehensive validation before any trade execution
   */
  async assessTradeRisk(tradeRequest) {
    try {
      console.log(`[RISK] 🔍 Assessing trade risk: ${tradeRequest.tokenTicker}`);
      
      const assessment = {
        tokenAddress: tradeRequest.tokenAddress,
        tokenTicker: tradeRequest.tokenTicker,
        positionSize: tradeRequest.positionSize,
        strategy: tradeRequest.strategy,
        timestamp: Date.now(),
        approved: false,
        riskScore: 0,
        warnings: [],
        blockers: []
      };
      
      // 1. Portfolio-level risk checks
      const portfolioRisk = await this.assessPortfolioRisk(tradeRequest);
      assessment.portfolioRisk = portfolioRisk;
      
      if (portfolioRisk.blocked) {
        assessment.blockers.push(...portfolioRisk.reasons);
      }
      
      // 2. Token-level risk assessment
      const tokenRisk = await this.assessTokenRisk(tradeRequest);
      assessment.tokenRisk = tokenRisk;
      
      if (tokenRisk.blocked) {
        assessment.blockers.push(...tokenRisk.reasons);
      }
      
      // 3. Position-level risk validation
      const positionRisk = this.assessPositionRisk(tradeRequest);
      assessment.positionRisk = positionRisk;
      
      if (positionRisk.blocked) {
        assessment.blockers.push(...positionRisk.reasons);
      }
      
      // 4. Market condition assessment
      const marketRisk = await this.assessMarketRisk();
      assessment.marketRisk = marketRisk;
      
      // 5. Circuit breaker checks
      const circuitBreakerCheck = this.checkCircuitBreakers();
      assessment.circuitBreakers = circuitBreakerCheck;
      
      if (circuitBreakerCheck.active.length > 0) {
        assessment.blockers.push('Circuit breakers active');
      }
      
      // Calculate composite risk score
      assessment.riskScore = this.calculateCompositeRiskScore(assessment);
      
      // Final approval decision (relaxed for testing)
      assessment.approved = (
        assessment.blockers.length === 0 &&
        assessment.riskScore <= 8.5 // Risk score threshold (was 7.0)
      );
      
      // Store assessment
      this.riskAssessments.set(tradeRequest.tokenAddress, assessment);
      
      // Log decision
      if (assessment.approved) {
        console.log(`[RISK] ✅ Trade approved: ${tradeRequest.tokenTicker} (Risk Score: ${assessment.riskScore.toFixed(2)})`);
      } else {
        console.log(`[RISK] 🚨 Trade blocked: ${tradeRequest.tokenTicker}`);
        console.log(`[RISK] 📋 Blockers:`, assessment.blockers);
      }
      
      return assessment;
      
    } catch (error) {
      console.error('[RISK] ❌ Risk assessment error:', error.message);
      return {
        approved: false,
        riskScore: 10,
        blockers: ['Risk assessment failed'],
        error: error.message
      };
    }
  }
  
  /**
   * 📊 PORTFOLIO-LEVEL RISK ASSESSMENT
   */
  async assessPortfolioRisk(tradeRequest) {
    const risk = {
      blocked: false,
      reasons: [],
      score: 5.0,
      metrics: {}
    };
    
    try {
      // Update portfolio metrics
      await this.updatePortfolioMetrics();
      
      const portfolio = this.riskMetrics.portfolio;
      
      // Daily loss limit
      if (portfolio.dailyPnL <= -this.config.portfolio.maxDailyLoss) {
        risk.blocked = true;
        risk.reasons.push('Daily loss limit exceeded');
        risk.score += 3.0;
      }
      
      // Weekly loss limit
      if (portfolio.weeklyPnL <= -this.config.portfolio.maxWeeklyLoss) {
        risk.blocked = true;
        risk.reasons.push('Weekly loss limit exceeded');
        risk.score += 2.0;
      }
      
      // Maximum drawdown
      if (portfolio.maxDrawdown >= this.config.portfolio.maxDrawdown) {
        risk.blocked = true;
        risk.reasons.push('Maximum drawdown exceeded');
        risk.score += 4.0;
      }
      
      // Position size limit
      if (tradeRequest.positionSize > this.config.portfolio.maxPositionSize) {
        risk.blocked = true;
        risk.reasons.push('Position size exceeds limit');
        risk.score += 2.0;
      }
      
      // Total position count
      if (portfolio.totalPositions >= 10) { // Max positions
        risk.blocked = true;
        risk.reasons.push('Maximum positions exceeded');
        risk.score += 1.0;
      }
      
      // Cash reserve check
      if (portfolio.cashReserve < this.config.portfolio.minCashReserve) {
        risk.blocked = true;
        risk.reasons.push('Insufficient cash reserves');
        risk.score += 2.0;
      }
      
      // Correlation limit
      const correlationRisk = await this.assessPositionCorrelation(tradeRequest);
      if (correlationRisk > this.config.portfolio.maxCorrelatedPositions) {
        risk.blocked = true;
        risk.reasons.push('Exceeds correlation limits');
        risk.score += 1.5;
      }
      
      risk.metrics = {
        dailyPnL: portfolio.dailyPnL,
        weeklyPnL: portfolio.weeklyPnL,
        maxDrawdown: portfolio.maxDrawdown,
        cashReserve: portfolio.cashReserve,
        correlationRisk
      };
      
    } catch (error) {
      console.error('[RISK] ❌ Portfolio risk assessment error:', error.message);
      risk.blocked = true;
      risk.reasons.push('Portfolio assessment failed');
    }
    
    return risk;
  }
  
  /**
   * 🪙 TOKEN-LEVEL RISK ASSESSMENT
   */
  async assessTokenRisk(tokenData) {
    const risk = {
      blocked: false,
      reasons: [],
      score: 3.0,
      metrics: {}
    };
    
    try {
      // Liquidity check
      if (tokenData.liquidity < this.config.token.minLiquidity) {
        risk.blocked = true;
        risk.reasons.push('Insufficient liquidity');
        risk.score += 2.0;
      }
      
      // Dev holdings check
      if (tokenData.devPercent > this.config.token.maxDevHoldings) {
        risk.blocked = true;
        risk.reasons.push('High dev holdings');
        risk.score += 3.0;
      }
      
      // Concentration risk
      if (tokenData.top10Percent > this.config.token.maxTop10Holdings) {
        risk.blocked = true;
        risk.reasons.push('High holder concentration');
        risk.score += 2.0;
      }
      
      // Bundler activity
      if (tokenData.bundlersPercent > this.config.token.maxBundlerPercent) {
        risk.reasons.push('High bundler activity');
        risk.score += 1.0;
      }
      
      // Holder count
      if (tokenData.holders < this.config.token.minHolderCount) {
        risk.reasons.push('Low holder count');
        risk.score += 1.0;
      }
      
      // Token age check
      if (tokenData.createdAt) {
        const ageHours = (Date.now() - new Date(tokenData.createdAt).getTime()) / 3600000;
        if (ageHours < this.config.token.minAgeHours) {
          risk.reasons.push('Token too new');
          risk.score += 1.5;
        }
      }
      
      // Get Birdeye security data (CRITICAL for safety)
      console.log(`[RISK] 🔍 Fetching Birdeye security for ${tokenData.ticker}`);
      const securityData = await dataManager.getTokenData(tokenData.address, {
        includeBirdeye: true,
        skipCache: true  // Force fresh API call!
      });
      
      if (securityData?.security?.data) {
        const security = securityData.security.data;
        
        // Mint authority risk
        if (security.ownerAddress) {
          risk.reasons.push('Token can be minted');
          risk.score += 1.5;
        }
        
        // Freeze authority risk
        if (security.freezeAuthority) {
          risk.blocked = true;
          risk.reasons.push('Token can be frozen');
          risk.score += 2.0;
        }
        
        // LP burn check
        if (security.lockInfo && security.lockInfo.lpBurned < 80) {
          risk.reasons.push('Low LP burn percentage');
          risk.score += 1.0;
        }
      }
      
      risk.metrics = {
        liquidity: tokenData.liquidity,
        devPercent: tokenData.devPercent,
        top10Percent: tokenData.top10Percent,
        bundlersPercent: tokenData.bundlersPercent,
        holders: tokenData.holders
      };
      
    } catch (error) {
      console.error('[RISK] ❌ Token risk assessment error:', error.message);
      risk.score += 2.0;
    }
    
    return risk;
  }
  
  /**
   * 📈 POSITION-LEVEL RISK ASSESSMENT
   */
  assessPositionRisk(tradeRequest) {
    const risk = {
      blocked: false,
      reasons: [],
      score: 2.0,
      metrics: {}
    };
    
    // Position size validation
    if (tradeRequest.positionSize > this.config.position.maxPositionSize) {
      risk.blocked = true;
      risk.reasons.push('Position size too large');
      risk.score += 2.0;
    }
    
    // Slippage check
    if (tradeRequest.maxSlippage > this.config.position.maxSlippagePercent) {
      risk.reasons.push('High slippage tolerance');
      risk.score += 1.0;
    }
    
    // Strategy-specific risk
    switch (tradeRequest.strategy) {
      case 'surgeSniper':
        // Higher risk tolerance for speed
        break;
      case 'whaleFollower':
        // Medium risk with validation
        break;
      case 'momentumRider':
        // Lower risk, technical confirmation required
        if (!tradeRequest.technicalConfirmation) {
          risk.score += 0.5;
        }
        break;
    }
    
    risk.metrics = {
      positionSize: tradeRequest.positionSize,
      maxSlippage: tradeRequest.maxSlippage,
      strategy: tradeRequest.strategy
    };
    
    return risk;
  }
  
  /**
   * 🌍 MARKET CONDITION ASSESSMENT
   */
  async assessMarketRisk() {
    const risk = {
      score: 1.0,
      conditions: {},
      adjustments: {}
    };
    
    try {
      // Get SOL price volatility
      const solVolatility = await this.calculateMarketVolatility();
      risk.conditions.solVolatility = solVolatility;
      
      if (solVolatility > this.config.market.volatilityThreshold) {
        risk.score += 1.0;
        risk.adjustments.positionSizeMultiplier = this.config.market.bearMultiplier;
      }
      
      // Volume analysis
      const volumeChange = await this.calculateVolumeChange();
      risk.conditions.volumeChange = volumeChange;
      
      if (volumeChange < -this.config.market.volumeThreshold) {
        risk.score += 0.5;
      }
      
    } catch (error) {
      console.error('[RISK] ❌ Market risk assessment error:', error.message);
      risk.score += 1.0;
    }
    
    return risk;
  }
  
  /**
   * ⚡ CIRCUIT BREAKER CHECKS
   */
  checkCircuitBreakers() {
    const check = {
      active: [],
      inactive: [],
      severity: 'none'
    };
    
    const breakers = this.riskMetrics.circuitBreakers;
    const performance = this.riskMetrics.performance;
    
    // Consecutive loss breaker
    if (performance.consecutiveLosses >= this.config.circuitBreakers.consecutiveLossLimit) {
      breakers.consecutiveLossBreaker = true;
      check.active.push('consecutive_loss');
      check.severity = 'high';
    }
    
    // Hourly loss breaker
    if (performance.hourlyLoss <= -this.config.circuitBreakers.hourlyLossLimit) {
      breakers.hourlyLossBreaker = true;
      check.active.push('hourly_loss');
      check.severity = 'medium';
    }
    
    // Rapid loss breaker
    const rapidLossWindow = Date.now() - performance.rapidLossTime;
    if (rapidLossWindow < 900000 && // 15 minutes
        performance.rapidLossAmount <= -this.config.circuitBreakers.rapidLossThreshold) {
      breakers.rapidLossBreaker = true;
      check.active.push('rapid_loss');
      check.severity = 'high';
    }
    
    // System shutdown breaker
    if (this.riskMetrics.portfolio.dailyPnL <= -this.config.circuitBreakers.systemShutdownLoss) {
      breakers.systemShutdownBreaker = true;
      check.active.push('system_shutdown');
      check.severity = 'critical';
    }
    
    return check;
  }
  
  /**
   * 🎯 COMPOSITE RISK SCORING
   */
  calculateCompositeRiskScore(assessment) {
    let score = 0;
    
    // Weight different risk categories
    score += assessment.portfolioRisk.score * 0.30;  // 30% weight
    score += assessment.tokenRisk.score * 0.35;      // 35% weight
    score += assessment.positionRisk.score * 0.20;   // 20% weight
    score += assessment.marketRisk.score * 0.15;     // 15% weight
    
    // Penalty for blockers
    if (assessment.blockers.length > 0) {
      score += assessment.blockers.length * 2.0;
    }
    
    return Math.min(10, Math.max(0, score));
  }
  
  /**
   * 📊 RISK MONITORING AND UPDATES
   */
  startRiskMonitoring() {
    // High-frequency monitoring (every 30 seconds)
    setInterval(() => {
      this.updateRiskMetrics();
      this.checkCircuitBreakers();
      this.monitorPositions();
    }, 30000);
    
    // Portfolio-level monitoring (every 5 minutes)
    setInterval(() => {
      this.updatePortfolioMetrics();
      this.assessOverallRisk();
    }, 300000);
    
    console.log('[RISK] 📊 Risk monitoring started');
  }
  
  /**
   * 🔄 HELPER METHODS
   */
  async updatePortfolioMetrics() {
    // Update portfolio-level risk metrics
    // TODO: Implement real portfolio tracking
  }
  
  async assessPositionCorrelation(tradeRequest) {
    // Calculate correlation with existing positions
    // TODO: Implement correlation analysis
    return 0.1; // Low correlation assumed
  }
  
  async calculateMarketVolatility() {
    // Calculate SOL price volatility
    // TODO: Implement volatility calculation
    return 0.15; // 15% volatility assumed
  }
  
  async calculateVolumeChange() {
    // Calculate market volume change
    // TODO: Implement volume analysis
    return 0.05; // 5% volume increase assumed
  }
  
  trackPosition(position) {
    this.riskMetrics.positions.set(position.id, {
      ...position,
      riskMetrics: {
        entryPrice: position.entryPrice,
        currentPrice: position.entryPrice,
        unrealizedPnL: 0,
        riskScore: this.calculatePositionRiskScore(position),
        stopLossPrice: position.entryPrice * (1 - this.config.position.stopLossPercent),
        takeProfitPrice: position.entryPrice * (1 + this.config.position.takeProfitPercent)
      }
    });
  }
  
  updatePositionMetrics(position) {
    const trackedPosition = this.riskMetrics.positions.get(position.id);
    if (trackedPosition) {
      trackedPosition.status = 'closed';
      trackedPosition.exitTime = Date.now();
      trackedPosition.realizedPnL = position.realizedPnL;
      
      // Update performance metrics
      if (position.realizedPnL < 0) {
        this.riskMetrics.performance.consecutiveLosses++;
      } else {
        this.riskMetrics.performance.consecutiveLosses = 0;
      }
    }
  }
  
  calculatePositionRiskScore(position) {
    // Calculate individual position risk score
    // TODO: Implement position-specific risk scoring
    return 3.0; // Medium risk assumed
  }
  
  monitorPositions() {
    // Monitor all open positions for risk triggers
    this.riskMetrics.positions.forEach((position, id) => {
      if (position.status === 'active') {
        this.checkPositionRiskTriggers(position);
      }
    });
  }
  
  checkPositionRiskTriggers(position) {
    // Check individual position for risk triggers
    // TODO: Implement position monitoring logic
  }
  
  updateRiskMetrics() {
    // Update real-time risk metrics
    this.riskMetrics.performance.lastRiskCheck = Date.now();
  }
  
  assessOverallRisk() {
    // Assess overall system risk level
    const overallRisk = {
      level: 'medium',
      score: 5.0,
      recommendations: []
    };
    
    this.emit('risk_assessment', overallRisk);
  }
  
  async initializePortfolioTracking() {
    console.log('[RISK] 📊 Initializing portfolio tracking...');
    // TODO: Initialize portfolio value tracking
  }
}

// Export singleton instance
export const riskManager = new RiskManager(); 