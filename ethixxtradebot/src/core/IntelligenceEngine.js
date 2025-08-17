#!/usr/bin/env node
/**
 * 🧠 UNIFIED INTELLIGENCE ENGINE
 * Consolidates all analysis systems:
 * - Token scoring (technical + fundamental + social)
 * - Risk assessment (security + concentration + liquidity)
 * - Whale tracking (behavior patterns + performance)
 * - Signal generation (buy/sell/hold with confidence levels)
 */

import { EventEmitter } from 'node:events';
import { dataManager } from './DataManager.js';
import { riskManager } from './RiskManager.js';

export class IntelligenceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Scoring weights
      scoring: {
        technical: 0.25,      // Price action, volume, momentum
        fundamental: 0.30,    // Liquidity, holders, transactions
        risk: 0.25,          // Security, concentration, dev holdings
        social: 0.20         // Twitter, website, community activity
      },
      
      // Risk thresholds
      risk: {
        maxDevHoldings: 20,      // % max dev holdings (was 10)
        maxConcentration: 85,    // % max top 10 holders (was 80)
        minLiquidity: 100,       // SOL minimum (was 500)
        maxSniper: 20,           // % max sniper holdings
        maxBundler: 50           // % max bundler concentration
      },
      
      // Signal confidence levels (relaxed for testing)
      signals: {
        strongBuy: 7.0,     // Score threshold for strong buy (was 8.5)
        buy: 5.0,           // Score threshold for buy (was 7.0)
        hold: 3.5,          // Score threshold for hold (was 5.0)
        sell: 2.0,          // Score threshold for sell (was 3.0)
        strongSell: 1.0     // Score threshold for strong sell (was 1.5)
      },
      
      // Whale tracking
      whales: {
        minTradeValue: 50000,    // $50k minimum trade
        trackingPeriod: 7776000, // 90 days
        minWinRate: 0.6,         // 60% minimum win rate
        maxTracked: 100          // Top 100 whales
      },
      
      ...options
    };
    
    // Intelligence cache
    this.intelligence = {
      tokenScores: new Map(),      // Token address → score data
      whaleProfiles: new Map(),    // Whale address → performance data  
      riskAssessments: new Map(),  // Token address → risk analysis
      signalHistory: new Map()     // Token address → signal history
    };
    
    // Performance tracking
    this.performance = {
      tokensAnalyzed: 0,
      signalsGenerated: 0,
      correctPredictions: 0,
      falsePositives: 0,
      startTime: Date.now()
    };
    
    console.log('🧠 UNIFIED INTELLIGENCE ENGINE INITIALIZED');
    console.log('🎯 Consolidating: Analysis + Risk + Whales + Signals');
  }
  
  /**
   * Initialize intelligence systems
   */
  async initialize() {
    console.log('[INTEL] 🚀 Initializing intelligence systems...');
    
    // Connect to data manager
    dataManager.on('token_surge', (tokenData) => {
      this.analyzeToken(tokenData);
    });
    
    dataManager.on('whale_activity', (whaleData) => {
      this.trackWhaleActivity(whaleData);
    });
    
    // Load historical whale performance data
    await this.loadWhaleProfiles();
    
    // Start performance monitoring
    this.startPerformanceTracking();
    
    console.log('[INTEL] ✅ Intelligence systems ready');
    this.emit('initialized');
  }
  
  /**
   * 🎯 UNIFIED TOKEN ANALYSIS
   * Combines all analysis methods into single comprehensive score
   */
  async analyzeToken(tokenData) {
    try {
      console.log(`[INTEL] 🔍 Analyzing: ${tokenData.ticker} (${tokenData.name})`);
      
      const startTime = Date.now();
      
      // Parallel analysis execution WITH REAL BIRDEYE API CALLS
      const [technicalScore, fundamentalScore, riskAssessment, socialScore] = await Promise.all([
        this.calculateTechnicalScore(tokenData),
        this.calculateFundamentalScore(tokenData),
        riskManager.assessTokenRisk(tokenData), // REAL Birdeye security check!
        this.calculateSocialScore(tokenData)
      ]);
      
      // Convert risk assessment to score (lower risk = higher score)
      const riskScore = riskAssessment ? (10 - riskAssessment.riskScore) : 0;
      
      // Weighted composite score
      const compositeScore = (
        technicalScore * this.config.scoring.technical +
        fundamentalScore * this.config.scoring.fundamental + 
        riskScore * this.config.scoring.risk +
        socialScore * this.config.scoring.social
      );
      
      // Generate trading signal
      const signal = this.generateTradingSignal(compositeScore, tokenData);
      
      // Store intelligence
      const intelligence = {
        tokenData,
        scores: {
          technical: technicalScore,
          fundamental: fundamentalScore,
          risk: riskScore,
          social: socialScore,
          composite: compositeScore
        },
        signal,
        analysisTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.intelligence.tokenScores.set(tokenData.address, intelligence);
      this.performance.tokensAnalyzed++;
      
      // Emit for trading strategies
      if (signal.action !== 'hold') {
        console.log(`[INTEL] 📊 Signal: ${signal.action.toUpperCase()} ${tokenData.ticker} (Score: ${compositeScore.toFixed(2)}, Confidence: ${signal.confidence.toFixed(2)})`);
        this.emit('trading_signal', intelligence);
      }
      
      return intelligence;
      
    } catch (error) {
      console.error('[INTEL] ❌ Analysis error:', error.message);
      throw error;
    }
  }
  
  /**
   * 📈 TECHNICAL ANALYSIS SCORING
   */
  async calculateTechnicalScore(tokenData) {
    let score = 5.0; // Base score
    
    try {
      // Momentum scoring (enhanced per comprehensive plan)
      if (tokenData.rankChange > 0) {
        score += Math.min(tokenData.rankChange * 0.5, 2.0); // Max +2.0 for rank improvement
        
        // Velocity score: rankJump / timeTakenSeconds
        if (tokenData.timeToSurge > 0) {
          const velocityScore = tokenData.rankChange / tokenData.timeToSurge;
          score += Math.min(velocityScore * 10, 1.5); // Max +1.5 for velocity
        }
      }
      
      // Volume/Liquidity ratio (healthy trading activity)
      const volumeRatio = tokenData.volume / Math.max(tokenData.liquidity, 1);
      if (volumeRatio > 0.1) score += 1.0;      // Good activity
      if (volumeRatio > 0.3) score += 0.5;      // High activity
      if (volumeRatio > 0.5) score += 0.5;      // Extreme activity
      
      // Buy/Sell pressure (enhanced thresholds)
      const buyPressure = tokenData.buyCount / Math.max(tokenData.sellCount, 1);
      if (buyPressure > 1.5) score += 0.5;      // More buyers
      if (buyPressure > 2.0) score += 1.0;      // Strong buying (plan threshold)
      if (buyPressure > 3.0) score += 0.5;      // Extreme buying pressure
      
      // Time to surge (speed of momentum - enhanced scoring)
      if (tokenData.timeToSurge && tokenData.timeToSurge < 15) {
        score += 1.5; // Ultra-fast surge = strongest momentum
      } else if (tokenData.timeToSurge && tokenData.timeToSurge < 30) {
        score += 1.0; // Fast surge = strong momentum
      } else if (tokenData.timeToSurge && tokenData.timeToSurge < 60) {
        score += 0.5; // Quick surge = good momentum
      }
      
      // Price trend (if we have price history)
      const priceHistory = await this.getPriceHistory(tokenData.address);
      if (priceHistory && priceHistory.length > 1) {
        const trend = this.calculatePriceTrend(priceHistory);
        score += Math.max(-1.0, Math.min(1.0, trend)); // -1 to +1 based on trend
      }
      
    } catch (error) {
      console.error('[INTEL] ❌ Technical analysis error:', error.message);
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * 🏗️ FUNDAMENTAL ANALYSIS SCORING  
   */
  async calculateFundamentalScore(tokenData) {
    let score = 5.0; // Base score
    
    try {
      // Liquidity scoring
      if (tokenData.liquidity > 1000) score += 0.5;    // Good liquidity
      if (tokenData.liquidity > 10000) score += 0.5;   // Strong liquidity
      if (tokenData.liquidity > 100000) score += 1.0;  // Excellent liquidity
      
      // Holder distribution
      if (tokenData.holders > 50) score += 0.5;        // Decent distribution
      if (tokenData.holders > 200) score += 0.5;       // Good distribution
      if (tokenData.holders > 1000) score += 1.0;      // Wide distribution
      
      // Transaction activity
      if (tokenData.transactions > 100) score += 0.5;  // Active trading
      if (tokenData.transactions > 500) score += 0.5;  // High activity
      
      // Market cap reasonableness (avoid obvious pumps)
      const mcRatio = tokenData.marketCap / Math.max(tokenData.liquidity, 1);
      if (mcRatio < 10) score += 1.0;     // Reasonable valuation
      if (mcRatio > 100) score -= 1.0;    // Overvalued
      
      // Protocol scoring (Raydium > Pump.fun for stability)
      if (tokenData.protocol?.includes('Raydium')) score += 0.5;
      if (tokenData.protocol?.includes('Pump') && tokenData.dexPaid) score += 0.3;
      
    } catch (error) {
      console.error('[INTEL] ❌ Fundamental analysis error:', error.message);
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * 🛡️ RISK ANALYSIS SCORING (Higher score = Lower risk)
   */
  async calculateRiskScore(tokenData) {
    let score = 8.0; // Start with high score (low risk assumed)
    
    try {
      // Dev holdings risk
      if (tokenData.devPercent > this.config.risk.maxDevHoldings) {
        score -= 3.0; // Major risk
      } else if (tokenData.devPercent > 5) {
        score -= 1.0; // Moderate risk
      }
      
      // Concentration risk
      if (tokenData.top10Percent > this.config.risk.maxConcentration) {
        score -= 2.0; // High concentration
      } else if (tokenData.top10Percent > 60) {
        score -= 1.0; // Moderate concentration
      }
      
      // Sniper/Bot activity risk
      if (tokenData.snipersPercent > this.config.risk.maxSniper) {
        score -= 1.5; // Bot activity
      }
      
      // Bundler concentration risk
      if (tokenData.bundlersPercent > this.config.risk.maxBundler) {
        score -= 1.0; // High bundler activity
      }
      
      // Liquidity adequacy
      if (tokenData.liquidity < this.config.risk.minLiquidity) {
        score -= 2.0; // Insufficient liquidity
      }
      
      // Get Birdeye security analysis if available
      const securityData = await dataManager.getTokenData(tokenData.address, { 
        includeBirdeye: true, 
        cache: true 
      });
      
      if (securityData?.security?.data) {
        const security = securityData.security.data;
        
        // Mint authority check
        if (security.ownerAddress) score -= 1.0;        // Can mint more tokens
        
        // Freeze authority check  
        if (security.freezeAuthority) score -= 0.5;     // Can freeze trades
        
        // Metadata mutability
        if (security.mutableMetadata) score -= 0.3;     // Can change metadata
        
        // LP burn verification
        if (security.lockInfo?.lpBurned < 90) score -= 1.0; // Low LP burn
      }
      
    } catch (error) {
      console.error('[INTEL] ❌ Risk analysis error:', error.message);
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * 🌍 SOCIAL ANALYSIS SCORING
   */
  async calculateSocialScore(tokenData) {
    let score = 3.0; // Base score
    
    try {
      // Enhanced social signal analysis (from comprehensive plan)
      const hasSocials = {
        twitter: !!tokenData.twitter,
        website: !!tokenData.website,
        telegram: !!tokenData.telegram
      };
      
      // Social presence scoring with detailed logging
      if (hasSocials.twitter) {
        score += 2.5; // Twitter most important for meme coins
        console.log(`[INTEL] 🐦 ${tokenData.ticker}: Twitter detected`);
      }
      if (hasSocials.website) {
        score += 2.0; // Website shows legitimacy
        if (tokenData.website?.includes('http')) score += 0.5; // Proper URL
        console.log(`[INTEL] 🌐 ${tokenData.ticker}: Website detected`);
      }
      if (hasSocials.telegram) {
        score += 1.5; // Community channel
        console.log(`[INTEL] 💬 ${tokenData.ticker}: Telegram detected`);
      }
      
      // Network effect bonus for multiple channels
      const socialCount = Object.values(hasSocials).filter(v => v).length;
      if (socialCount >= 3) {
        score += 1.0; // Full social suite bonus
        console.log(`[INTEL] ✨ ${tokenData.ticker}: Complete social presence (${socialCount}/3)`);
      } else if (socialCount === 2) {
        score += 0.5; // Partial bonus
      } else if (socialCount === 0) {
        score = 3.0; // Reduced penalty for no socials (was 1.0)
        console.log(`[INTEL] ⚠️ ${tokenData.ticker}: No social signals - MEDIUM RISK`);
      }
      
      // TODO: Future enhancement - Twitter follower analysis
      // TODO: Future enhancement - Telegram member count validation
      
    } catch (error) {
      console.error('[INTEL] ❌ Social analysis error:', error.message);
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * 🎯 GENERATE TRADING SIGNAL
   */
  generateTradingSignal(score, tokenData) {
    let action = 'hold';
    let confidence = 0;
    let positionSize = 0;
    let reasoning = [];
    
    // Determine action based on score thresholds
    if (score >= this.config.signals.strongBuy) {
      action = 'strong_buy';
      confidence = Math.min(0.95, score / 10);
      positionSize = 0.05; // 5% max position
      reasoning.push('High composite score');
    } else if (score >= this.config.signals.buy) {
      action = 'buy';
      confidence = score / 10;
      positionSize = 0.03; // 3% position
      reasoning.push('Above buy threshold');
    } else if (score <= this.config.signals.strongSell) {
      action = 'strong_sell';
      confidence = Math.min(0.95, (10 - score) / 10);
      reasoning.push('High risk detected');
    } else if (score <= this.config.signals.sell) {
      action = 'sell';
      confidence = (10 - score) / 10;
      reasoning.push('Below sell threshold');
    }
    
    // Additional reasoning
    if (tokenData.rankChange > 0) reasoning.push('Positive momentum');
    if (tokenData.devPercent === 0) reasoning.push('No dev holdings');
    if (tokenData.liquidity > 10000) reasoning.push('High liquidity');
    
    const signal = {
      action,
      confidence,
      positionSize,
      reasoning,
      score,
      timestamp: Date.now(),
      tokenAddress: tokenData.address,
      tokenTicker: tokenData.ticker
    };
    
    // Store signal history
    const history = this.intelligence.signalHistory.get(tokenData.address) || [];
    history.push(signal);
    this.intelligence.signalHistory.set(tokenData.address, history.slice(-10)); // Keep last 10
    
    this.performance.signalsGenerated++;
    
    return signal;
  }
  
  /**
   * 🐋 WHALE ACTIVITY TRACKING
   */
  async trackWhaleActivity(whaleData) {
    // Implementation for whale tracking and performance analysis
    console.log('[INTEL] 🐋 Tracking whale activity:', whaleData.wallet);
    
    // TODO: Implement whale performance tracking
    // - Track whale trades and outcomes
    // - Calculate win rates and average returns
    // - Identify top-performing whales to follow
  }
  
  /**
   * 📊 PERFORMANCE TRACKING
   */
  startPerformanceTracking() {
    setInterval(() => {
      const uptime = Date.now() - this.performance.startTime;
      const performance = {
        ...this.performance,
        uptime,
        accuracy: this.performance.correctPredictions / Math.max(this.performance.signalsGenerated, 1),
        tokensPerHour: this.performance.tokensAnalyzed / (uptime / 3600000)
      };
      
      this.emit('performance_update', performance);
    }, 300000); // Every 5 minutes
  }
  
  /**
   * 🔍 GET INTELLIGENCE DATA
   */
  getTokenIntelligence(tokenAddress) {
    return this.intelligence.tokenScores.get(tokenAddress);
  }
  
  getWhaleProfile(whaleAddress) {
    return this.intelligence.whaleProfiles.get(whaleAddress);
  }
  
  /**
   * 📈 HELPER METHODS
   */
  async getPriceHistory(tokenAddress) {
    // Get price history from data manager cache
    const cached = dataManager.dataCache.get(tokenAddress);
    if (cached && cached.data && cached.data.priceHistory) {
      return cached.data.priceHistory;
    }
    // Return empty array if no price history available
    return [];
  }
  
  calculatePriceTrend(priceHistory) {
    if (priceHistory.length < 2) return 0;
    
    const recent = priceHistory.slice(-5); // Last 5 data points
    const slope = this.calculateLinearRegression(recent);
    return slope; // Positive = uptrend, negative = downtrend
  }
  
  calculateLinearRegression(data) {
    const n = data.length;
    if (n < 2) return 0;
    
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, point) => sum + point.price, 0);
    const sumXY = data.reduce((sum, point, i) => sum + (i * point.price), 0);
    const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  async loadWhaleProfiles() {
    // Load historical whale performance data
    console.log('[INTEL] 📊 Loading whale performance profiles...');
    // TODO: Implement whale profile loading from persistent storage
  }
}

// Export singleton instance  
export const intelligenceEngine = new IntelligenceEngine(); 