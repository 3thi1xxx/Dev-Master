#!/usr/bin/env node
/**
 * Fast Meme Analyzer - Ultra-speed meme coin detection
 * Uses tiered analysis: Quick Filter → Fast Analysis → Decision
 */

import { EventEmitter } from 'node:events';
import { whaleDataService } from './WhaleDataService.js';
import { axiomAPIService } from '../core/data/AxiomAPIService.js';

export class FastMemeAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Analysis timeouts
      quickCheckTime: 500,   // 0.5 seconds for initial filter
      
      // Entry criteria (AGGRESSIVE for paper trading)
      minLiquidity: 500,     // $500 minimum (down from 1000)
      minVolume1m: 100,      // $100 in first minute (down from 250)
      minPriceGain1m: 0.001, // 0.1% minimum pump (down from 0.5%)
      minBuyRatio: 1.0,      // 1.0:1 buy/sell ratio (down from 1.1)
      
      // Holder criteria (more lenient)
      minHolders: 5,         // At least 5 holders (down from 15)
      maxBotRatio: 0.98,     // Allow up to 98% bots (up from 95%)
      minHoldersPerMinute: 0.5, // At least 0.5 new holder per minute (down from 1)
      
      // Whale criteria
      minWhaleCount: 0,      // Even 0 whales is OK initially
      whaleEntrySize: 200,   // $200+ whale entry (down from 300)
      
      // Scoring weights (more aggressive)
      momentumWeight: 0.40,  // Up from 0.35
      whaleWeight: 0.10,     // Down from 0.15
      volumeWeight: 0.30,    // Up from 0.25
      communityWeight: 0.10, // Down from 0.15
      safetyWeight: 0.10,    // Same
      
      // Use Axiom API
      useAxiomAPI: true,
      axiomAPITimeout: 2000  // 2 second timeout for API calls
    };
    
    // Merge with provided options
    Object.assign(this.config, options);
    
    console.log('⚡ FAST MEME ANALYZER INITIALIZED');
    console.log('🚀 Ultra-speed token detection (<2s analysis)');
    console.log('🎯 Focus: Momentum + Whale Activity + Holder Growth');
  }
  
  /**
   * Quick filter - Phase 1 (under 500ms)
   */
  async quickFilter(tokenData) {
    const startTime = Date.now();
    
    // Basic checks
    if (!tokenData.liquidity || tokenData.liquidity < this.config.minLiquidity) {
      return { pass: false, reason: 'Low liquidity' };
    }
    
    // For brand new tokens, we might not have volume/price data yet
    // So we're more lenient in the quick filter and let the full analysis decide
    
    // If volume data exists and is too low, reject
    if (tokenData.volume !== undefined && tokenData.volume > 0 && tokenData.volume < this.config.minVolume1m) {
      return { pass: false, reason: 'Low volume' };
    }
    
    // If we have enough price history, check momentum
    if (tokenData.priceHistory && tokenData.priceHistory.length > 2) {
      const priceChange = this.calculatePriceChange(tokenData);
      if (priceChange < this.config.minPriceGain1m) {
        return { pass: false, reason: 'No momentum' };
      }
    }
    
    // If we have buy/sell data, check ratio
    if (tokenData.buyVolume > 0 && tokenData.sellVolume > 0) {
      const buyRatio = this.calculateBuyRatio(tokenData);
      if (buyRatio < this.config.minBuyRatio) {
        return { pass: false, reason: 'Too many sellers' };
      }
    }
    
    const filterTime = Date.now() - startTime;
    console.log(`[FAST-MEME] ✅ Quick filter passed (${filterTime}ms)`);
    
    return { pass: true, filterTime };
  }

  /**
   * Analyze token with ultra-fast methods
   */
  async analyzeToken(tokenData, cluster7Data = null) {
    const startTime = Date.now();
    console.log(`[FAST-MEME] 🚀 Starting ultra-fast analysis: ${tokenData.symbol}`);
    
    try {
      // If we have Cluster7 cached data, enhance tokenData
      if (cluster7Data && cluster7Data.data) {
        // Use real trade data if available
        if (cluster7Data.data.trades && cluster7Data.data.trades.length > 0) {
          const recentTrades = cluster7Data.data.trades.slice(-50); // Last 50 trades
          const buyCount = recentTrades.filter(t => t.side === 'buy' || t.type === 'buy').length;
          const sellCount = recentTrades.filter(t => t.side === 'sell' || t.type === 'sell').length;
          
          tokenData.buyVolume = recentTrades
            .filter(t => t.side === 'buy' || t.type === 'buy')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
          tokenData.sellVolume = recentTrades
            .filter(t => t.side === 'sell' || t.type === 'sell')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
          tokenData.tradeVelocity = this.calculateTradeVelocity(recentTrades);
          tokenData.buyPressure = this.calculateBuyPressure(recentTrades);
        }
        
        // Use holder updates if available
        if (cluster7Data.data.holders) {
          tokenData.holderCount = cluster7Data.data.holders.count || cluster7Data.data.holders.length;
          tokenData.holderGrowth = cluster7Data.data.holders.growth || 0;
        }
      }
      
      // Phase 1: Quick momentum check
      const momentum = await this.analyzeMomentum(tokenData);
      
      // Phase 2: Get Axiom API data for holder analysis (if enabled)
      let axiomData = null;
      if (this.config.useAxiomAPI && tokenData.pairAddress) {
        try {
          axiomData = await Promise.race([
            axiomAPIService.getComprehensiveAnalysis(tokenData.address, tokenData.pairAddress),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Axiom API timeout')), this.config.axiomAPITimeout);
            })
          ]);
          console.log(`[FAST-MEME] ✅ Axiom API data received for ${tokenData.symbol}`);
        } catch (error) {
          console.log(`[FAST-MEME] ⚠️ Axiom API error: ${error.message}`);
          // Fallback scoring will be used in calculateMemeScore
        }
      }
      
      // Phase 3: Quick whale check
      const whaleActivity = await this.detectWhaleActivity(tokenData);
      
      // Phase 4: Calculate score with all data
      console.log(`[FAST-MEME] 🔧 About to call calculateMemeScore for ${tokenData.symbol}`);
      console.log(`[FAST-MEME] 🔧 Input data:`, {
        momentum: momentum ? 'present' : 'missing',
        whaleActivity: whaleActivity ? 'present' : 'missing', 
        tokenData: tokenData ? 'present' : 'missing',
        axiomData: axiomData ? 'present' : 'missing',
        cluster7Data: cluster7Data ? 'present' : 'missing'
      });
      
      const score = this.calculateMemeScore({
        momentum,
        whaleActivity,
        tokenData,
        axiomData,
        cluster7Data
      });
      
      console.log(`[FAST-MEME] 🔧 calculateMemeScore returned:`, score);
      
      const analysisTime = Date.now() - startTime;
      console.log(`[FAST-MEME] ✅ Analysis complete: ${tokenData.symbol} (${analysisTime}ms)`);
      
      return {
        token: tokenData.symbol,
        symbol: tokenData.symbol,
        address: tokenData.address,
        liquidity: tokenData.liquidity,
        score: score.total,
        components: score.components,
        recommendation: this.getRecommendation(score.total),
        momentum: momentum,
        whaleActivity: whaleActivity,
        axiomData: axiomData ? {
          holders: axiomData.tokenInfo?.numHolders || 0,
          organicHolders: axiomData.tokenInfo?.organicHolders || 0,
          botRatio: axiomData.tokenInfo?.botRatio || 0,
          gemScore: axiomData.gemScore?.score || 0,
          gemFactors: axiomData.gemScore?.factors || []
        } : null,
        analysisTime: analysisTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`[FAST-MEME] ❌ Analysis error: ${error.message}`);
      return {
        token: tokenData.symbol,
        address: tokenData.address,
        error: error.message,
        recommendation: 'ERROR',
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Analyze momentum indicators
   */
  async analyzeMomentum(tokenData) {
    const priceChange = this.calculatePriceChange(tokenData);
    const volumeGrowth = this.calculateVolumeGrowth(tokenData);
    const buyPressure = tokenData.buyPressure || this.calculateBuyRatio(tokenData);
    
    return {
      priceChange1m: priceChange,
      volumeGrowth: volumeGrowth,
      buyPressure: buyPressure,
      trending: priceChange > 0.05 && volumeGrowth > 1.5,
      strength: this.calculateMomentumStrength(priceChange, volumeGrowth, buyPressure)
    };
  }
  
  /**
   * Enhanced whale activity detection with priority tracking
   */
  async detectWhaleActivity(tokenData) {
    try {
      // Check whale data service for recent activity
      const whaleData = await whaleDataService.checkTokenActivity(tokenData.address);
      
      // Enhanced whale analysis with priority levels
      let highPriorityWhales = 0;
      let totalWhaleValue = 0;
      let whaleConfidenceSum = 0;
      let bestWhaleInfo = null;
      
      if (whaleData.entries && whaleData.entries.length > 0) {
        for (const entry of whaleData.entries) {
          // Get whale stats for confidence and priority
          const whaleStats = whaleDataService.getWhaleStats()[entry.whale];
          if (whaleStats) {
            console.log(`[FAST-MEME] 🐋 Found whale: ${whaleStats.name} (${whaleStats.priority}) - ${entry.action} ${entry.volume} SOL`);
            
            // Count high priority whales
            if (whaleStats.priority === 'high' || whaleStats.priority === 'highest') {
              highPriorityWhales++;
            }
            
            // Calculate whale value
            totalWhaleValue += entry.volume;
            whaleConfidenceSum += whaleDataService.calculateWhaleConfidence(entry.whale);
            
            // Track best whale
            if (!bestWhaleInfo || whaleStats.priority === 'highest') {
              bestWhaleInfo = {
                name: whaleStats.name,
                priority: whaleStats.priority,
                action: entry.action,
                volume: entry.volume,
                confidence: whaleDataService.calculateWhaleConfidence(entry.whale)
              };
            }
          }
        }
      }
      
      const avgConfidence = whaleData.entries.length > 0 ? whaleConfidenceSum / whaleData.entries.length : 0;
      
      return {
        whaleCount: whaleData.whaleCount,
        highPriorityWhales,
        totalVolume: whaleData.totalVolume,
        totalWhaleValue,
        avgConfidence,
        bestWhale: bestWhaleInfo,
        entries: whaleData.entries,
        hasSignificantWhales: whaleData.whaleCount >= this.config.minWhaleCount &&
                             whaleData.totalVolume >= this.config.whaleEntrySize,
        hasHighPriorityWhales: highPriorityWhales > 0
      };
    } catch (error) {
      console.log(`[FAST-MEME] ⚠️ Whale detection error: ${error.message}`);
      return {
        whaleCount: 0,
        highPriorityWhales: 0,
        totalVolume: 0,
        totalWhaleValue: 0,
        avgConfidence: 0,
        bestWhale: null,
        entries: [],
        hasSignificantWhales: false,
        hasHighPriorityWhales: false
      };
    }
  }
  
  /**
   * Calculate meme score with enhanced Axiom data
   */
  calculateMemeScore({ momentum, whaleActivity, tokenData, axiomData, cluster7Data }) {
    const components = {
      momentum: 0,
      whale: 0,
      volume: 0,
      community: 0,
      safety: 0
    };
    
    // For pump.fun tokens, adjust scoring to be more generous
    const isPumpToken = tokenData.address?.endsWith('pump') || tokenData.pairAddress?.endsWith('pump');
    
    // 1. Momentum score (35%) - Enhanced for pump tokens
    if (momentum.strength > 0) {
      components.momentum = Math.min(100, 
        momentum.strength * 100
      ) * this.config.momentumWeight;
    } else if (isPumpToken && tokenData.liquidity > 1000) {
      // Give base momentum score for new pump tokens with liquidity
      components.momentum = 30 * this.config.momentumWeight;
    } else {
      components.momentum = Math.min(100, 
        momentum.strength * 100
      ) * this.config.momentumWeight;
    }
    
    // 2. Whale score (15%) - Enhanced for pump tokens
    if (whaleActivity.hasSignificantWhales) {
      components.whale = Math.min(100,
        (whaleActivity.whaleCount / 3) * 100
      ) * this.config.whaleWeight;
    } else if (isPumpToken && tokenData.liquidity > 10000) {
      // High liquidity suggests whale interest
      components.whale = 40 * this.config.whaleWeight;
    } else if (tokenData.liquidity > 5000) {
      // Even without whales, give some points if volume is good
      components.whale = tokenData.volume > 5000 ? 30 * this.config.whaleWeight : 20 * this.config.whaleWeight;
    }
    
    // 3. Volume score (25%) - Use multiple volume sources
    let actualVolume = tokenData.volume || tokenData.realtimeVolume || tokenData.volume24h || 0;
    
    // If main volume is 0, try to calculate from buy/sell volumes
    if (actualVolume === 0 && tokenData.buyVolume && tokenData.sellVolume) {
      actualVolume = (tokenData.buyVolume + tokenData.sellVolume);
      console.log(`[FAST-MEME] 🔧 Calculated volume from buy/sell: ${actualVolume} (buy: ${tokenData.buyVolume}, sell: ${tokenData.sellVolume})`);
    }
    
    // For pump tokens with no volume data, use liquidity as proxy
    if (isPumpToken && actualVolume === 0 && tokenData.liquidity > 0) {
      actualVolume = tokenData.liquidity * 2; // Estimate volume from liquidity
      console.log(`[FAST-MEME] 🔧 Estimated volume from liquidity for pump token: ${actualVolume}`);
    }
    
    const volumeScore = Math.min(100,
      (actualVolume / 10000) * 100
    );
    components.volume = volumeScore * this.config.volumeWeight;
    console.log(`[FAST-MEME] 🔧 Volume calculation: actual=${actualVolume}, score=${volumeScore}, weighted=${components.volume}`);
    
    // 4. Community score (15%) - Enhanced with Axiom data
    if (axiomData?.tokenInfo) {
      const holderScore = Math.min(100,
        (axiomData.tokenInfo.numHolders / 50) * 100
      );
      const organicScore = axiomData.tokenInfo.organicHolders > 10 ? 50 : 0;
      const growthScore = axiomData.pairInfo?.ageMinutes > 0 ?
        Math.min(50, (axiomData.tokenInfo.numHolders / axiomData.pairInfo.ageMinutes) * 25) : 0;
      
      components.community = ((holderScore + organicScore + growthScore) / 3) * this.config.communityWeight;
    } else {
      // Fallback to basic scoring
      components.community = tokenData.holderCount > 20 ? 50 * this.config.communityWeight : 
                           tokenData.holderCount > 10 ? 25 * this.config.communityWeight : 0;
    }
    
    // 5. Safety score (10%) - Enhanced with Axiom data
    if (axiomData?.creatorAnalysis) {
      const rugSafety = axiomData.creatorAnalysis.creatorRugCount === 0 ? 50 : 0;
      const lpSafety = axiomData.pairInfo?.lpBurned === 100 ? 30 : 0;
      const devHoldSafety = axiomData.tokenInfo?.devHoldsPercent < 5 ? 20 : 0;
      
      components.safety = (rugSafety + lpSafety + devHoldSafety) * this.config.safetyWeight;
    } else {
      // Basic safety score
      components.safety = tokenData.liquidity > 5000 ? 50 * this.config.safetyWeight : 
                         tokenData.liquidity > 2000 ? 25 * this.config.safetyWeight : 0;
    }
    
    // If we have Axiom gem score, factor it in as a bonus
    let total = Object.values(components).reduce((sum, val) => sum + val, 0);
    if (axiomData?.gemScore?.score) {
      total = (total * 0.7) + (axiomData.gemScore.score * 0.3);
    }
    
    // Debug logging
    console.log(`[FAST-MEME] 📊 Score calculation for ${tokenData?.symbol || 'unknown'}:`);
    console.log(`  - Components total: ${total}`);
    console.log(`  - Axiom data available: ${!!axiomData}`);
    console.log(`  - Token liquidity: ${tokenData?.liquidity || 'N/A'}`);
    console.log(`  - Token volume: ${tokenData?.volume || 'N/A'}`);
    console.log(`  - Token data keys: ${tokenData ? Object.keys(tokenData).join(', ') : 'none'}`);
    console.log(`  - Volume from different fields:`, {
      volume: tokenData?.volume,
      volume24h: tokenData?.volume24h,
      realtimeVolume: tokenData?.realtimeVolume,
      volumeUsd: tokenData?.volumeUsd,
      buyVolume: tokenData?.buyVolume,
      sellVolume: tokenData?.sellVolume
    });
    
    // Fallback: If Axiom data is missing or total is undefined, use simple scoring
    if (!total || isNaN(total) || total === 0) {
      console.log(`[FAST-MEME] 🔄 Triggering fallback scoring for ${tokenData?.symbol || 'unknown'}`);
      console.log(`[FAST-MEME] 🛠️ Input data for fallback:`, {
        liquidity: tokenData.liquidity,
        volume: tokenData.volume,
        priceHistory: tokenData.priceHistory,
        buyVolume: tokenData.buyVolume,
        sellVolume: tokenData.sellVolume,
        holderGrowth: tokenData.holderGrowth
      });

      total = this.calculateSimpleScore(tokenData);
      console.log(`[FAST-MEME] 📈 Fallback score calculated: ${total}`);
    }
    
    return {
      total: Math.round(total),
      components: components
    };
  }
  
  /**
   * Get recommendation based on score (AGGRESSIVE thresholds)
   */
  getRecommendation(score) {
    // ULTRA-AGGRESSIVE thresholds for paper trading
    if (score >= 30) return 'STRONG BUY';  // Down from 60
    if (score >= 15) return 'BUY';         // Down from 40  
    if (score >= 8) return 'WATCH';        // Down from 20
    if (score >= 5) return 'RISKY';        // Down from 10
    return 'AVOID';
  }
  
  // Helper methods
  calculatePriceChange(tokenData) {
    if (!tokenData.priceHistory || tokenData.priceHistory.length < 2) return 0;
    
    const oldPrice = tokenData.priceHistory[0];
    const newPrice = tokenData.priceHistory[tokenData.priceHistory.length - 1];
    
    return (newPrice - oldPrice) / oldPrice;
  }
  
  calculateVolumeGrowth(tokenData) {
    if (!tokenData.volumeHistory || tokenData.volumeHistory.length < 2) return 1;
    
    const oldVolume = tokenData.volumeHistory[0] || 1;
    const newVolume = tokenData.volumeHistory[tokenData.volumeHistory.length - 1];
    
    return newVolume / oldVolume;
  }
  
  calculateBuyRatio(tokenData) {
    const buyVol = tokenData.buyVolume || 0;
    const sellVol = tokenData.sellVolume || 1;
    
    return buyVol / sellVol;
  }
  
  calculateMomentumStrength(priceChange, volumeGrowth, buyPressure) {
    // Weighted momentum calculation
    const priceScore = Math.min(1, Math.max(0, priceChange * 10));
    const volumeScore = Math.min(1, volumeGrowth / 3);
    const pressureScore = Math.min(1, buyPressure / 3);
    
    return (priceScore * 0.4 + volumeScore * 0.3 + pressureScore * 0.3);
  }
  
  /**
   * Calculate buy pressure from real trades
   */
  calculateBuyPressure(trades) {
    if (!trades || trades.length === 0) return 0;
    
    const recentTrades = trades.slice(-20); // Last 20 trades
    const buyCount = recentTrades.filter(t => t.side === 'buy' || t.type === 'buy').length;
    const totalCount = recentTrades.length;
    
    return totalCount > 0 ? buyCount / totalCount : 0.5;
  }
  
  /**
   * Calculate trade velocity (trades per minute)
   */
  calculateTradeVelocity(trades) {
    if (!trades || trades.length < 2) return 0;
    
    const firstTrade = trades[0];
    const lastTrade = trades[trades.length - 1];
    const timeSpan = (lastTrade.timestamp - firstTrade.timestamp) / 60000; // minutes
    
    return timeSpan > 0 ? trades.length / timeSpan : trades.length;
  }
  
  /**
   * Detect early momentum patterns
   */
  detectEarlyMomentum(tokenData, cluster7Data) {
    const signals = [];
    
    // 1. Rapid holder growth
    if (tokenData.holderGrowth > 5) {
      signals.push('RAPID_HOLDER_GROWTH');
    }
    
    // 2. High trade velocity
    if (tokenData.tradeVelocity > 10) {
      signals.push('HIGH_TRADE_VELOCITY');
    }
    
    // 3. Strong buy pressure
    if (tokenData.buyPressure > 0.7) {
      signals.push('STRONG_BUY_PRESSURE');
    }
    
    // 4. Volume explosion
    if (tokenData.volume > tokenData.liquidity * 0.1) {
      signals.push('VOLUME_EXPLOSION');
    }
    
    return {
      hasEarlyMomentum: signals.length >= 2,
      signals: signals
    };
  }
  
  /**
   * Simple scoring fallback when Axiom API fails
   */
  calculateSimpleScore(tokenData) {
    let score = 0;
    
    // Liquidity score (0-20 points)
    if (tokenData.liquidity >= 2000) score += 20;
    else if (tokenData.liquidity >= 1000) score += 15;
    else if (tokenData.liquidity >= 500) score += 10;
    else if (tokenData.liquidity >= 200) score += 5;
    
    // Volume score (0-25 points) - Use multiple volume sources
    let actualVolume = tokenData.volume || tokenData.realtimeVolume || tokenData.volume24h || 0;
    if (actualVolume === 0 && tokenData.buyVolume && tokenData.sellVolume) {
      actualVolume = (tokenData.buyVolume + tokenData.sellVolume);
    }
    
    if (actualVolume >= 1000) score += 25;
    else if (actualVolume >= 500) score += 20;
    else if (actualVolume >= 200) score += 15;
    else if (actualVolume >= 100) score += 10;
    else if (actualVolume >= 50) score += 5;
    
    // Price momentum score (0-25 points)
    if (tokenData.priceHistory && tokenData.priceHistory.length >= 2) {
      const priceChange = (tokenData.priceHistory[tokenData.priceHistory.length - 1] - tokenData.priceHistory[0]) / tokenData.priceHistory[0];
      if (priceChange >= 0.1) score += 25;
      else if (priceChange >= 0.05) score += 20;
      else if (priceChange >= 0.02) score += 15;
      else if (priceChange >= 0.01) score += 10;
      else if (priceChange >= 0.005) score += 5;
    }
    
    // Buy pressure score (0-20 points)
    if (tokenData.buyVolume && tokenData.sellVolume) {
      const buyRatio = tokenData.buyVolume / tokenData.sellVolume;
      if (buyRatio >= 2.0) score += 20;
      else if (buyRatio >= 1.5) score += 15;
      else if (buyRatio >= 1.2) score += 10;
      else if (buyRatio >= 1.0) score += 5;
    }
    
    // Holder growth score (0-10 points)
    if (tokenData.holderGrowth >= 5) score += 10;
    else if (tokenData.holderGrowth >= 3) score += 7;
    else if (tokenData.holderGrowth >= 1) score += 5;
    
    return Math.min(score, 100);
  }
}

// Singleton instance
export const fastMemeAnalyzer = new FastMemeAnalyzer();