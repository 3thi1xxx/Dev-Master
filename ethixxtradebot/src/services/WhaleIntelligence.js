#!/usr/bin/env node
/**
 * Whale Intelligence Engine
 * Analyzes whale trading patterns and provides intelligence scoring
 * Integrates whale activity with AI trading decisions
 */

import { EventEmitter } from 'node:events';
import { whaleDataService } from './WhaleDataService.js';

export class WhaleIntelligence extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      whaleScoreWeight: options.whaleScoreWeight || 0.15, // 15% of total score
      minWhaleConfidence: options.minWhaleConfidence || 0.6,
      whaleActivityWindow: options.whaleActivityWindow || 300000, // 5 minutes
      copyTradingEnabled: options.copyTradingEnabled || false
    };
    
    // Pattern recognition
    this.whalePatterns = {
      // Whale momentum patterns
      momentumPatterns: {
        multipleWhales: { threshold: 2, weight: 0.8 },
        whaleVolume: { threshold: 0.5, weight: 0.7 }, // 0.5 SOL minimum
        whaleTiming: { window: 60000, weight: 0.6 }, // 1 minute window
        whaleSuccess: { threshold: 0.7, weight: 0.9 } // 70% success rate
      },
      
      // Whale sentiment patterns
      sentimentPatterns: {
        whaleBuying: { weight: 0.8 },
        whaleSelling: { weight: 0.2 },
        whaleHolding: { weight: 0.5 },
        whaleDumping: { weight: 0.1 }
      },
      
      // Whale timing patterns
      timingPatterns: {
        recentActivity: { window: 300000, weight: 0.7 }, // 5 minutes
        whaleFrequency: { threshold: 3, weight: 0.6 }, // 3+ trades
        whaleConsistency: { threshold: 0.8, weight: 0.8 } // 80% consistency
      }
    };
    
    // Connect to whale data service
    this.connectToWhaleData();
    
    console.log('🧠 WHALE INTELLIGENCE ENGINE INITIALIZED');
    console.log(`📊 Whale score weight: ${this.config.whaleScoreWeight * 100}%`);
    console.log(`🎯 Min whale confidence: ${this.config.minWhaleConfidence * 100}%`);
  }
  
  /**
   * Connect to whale data service
   */
  connectToWhaleData() {
    // Listen for whale activity
    whaleDataService.on('whaleActivity', (activity) => {
      this.processWhaleActivity(activity);
    });
    
    // Listen for copy trading opportunities
    whaleDataService.on('copyTradeOpportunity', (opportunity) => {
      this.processCopyTradeOpportunity(opportunity);
    });
    
    console.log('[WHALE-INTEL] 🔗 Connected to whale data service');
  }
  
  /**
   * Process whale activity for pattern recognition
   */
  processWhaleActivity(activity) {
    try {
      const patterns = this.analyzeWhalePatterns(activity);
      const intelligence = this.generateWhaleIntelligence(patterns);
      
      // Emit whale intelligence event
      this.emit('whaleIntelligence', {
        type: 'pattern',
        patterns: patterns,
        intelligence: intelligence,
        timestamp: Date.now()
      });
      
      console.log(`[WHALE-INTEL] 🧠 Pattern detected: ${patterns.type} (Score: ${intelligence.score})`);
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error processing whale activity: ${error.message}`);
    }
  }
  
  /**
   * Analyze whale trading patterns
   */
  analyzeWhalePatterns(activity) {
    const patterns = {
      type: 'unknown',
      confidence: 0,
      signals: [],
      reasoning: []
    };
    
    try {
      const { transaction, whale } = activity;
      const whaleStats = whaleDataService.getWhaleStats()[whale.address];
      const recentActivity = whaleDataService.getRecentWhaleActivity(10);
      
      // 1. Momentum Pattern Analysis
      const momentumScore = this.analyzeMomentumPattern(transaction, whaleStats, recentActivity);
      
      // 2. Sentiment Pattern Analysis
      const sentimentScore = this.analyzeSentimentPattern(transaction, whaleStats);
      
      // 3. Timing Pattern Analysis
      const timingScore = this.analyzeTimingPattern(transaction, whaleStats, recentActivity);
      
      // Combine pattern scores
      const totalScore = (momentumScore + sentimentScore + timingScore) / 3;
      
      // Determine pattern type
      if (totalScore >= 0.8) {
        patterns.type = 'strong_whale_momentum';
        patterns.confidence = totalScore;
        patterns.signals.push('STRONG_WHALE_BUY');
        patterns.reasoning.push(`Multiple whales showing strong momentum (${(totalScore * 100).toFixed(1)}%)`);
      } else if (totalScore >= 0.6) {
        patterns.type = 'whale_momentum';
        patterns.confidence = totalScore;
        patterns.signals.push('WHALE_BUY');
        patterns.reasoning.push(`Whale activity indicates positive momentum (${(totalScore * 100).toFixed(1)}%)`);
      } else if (totalScore >= 0.4) {
        patterns.type = 'neutral_whale';
        patterns.confidence = totalScore;
        patterns.signals.push('WHALE_NEUTRAL');
        patterns.reasoning.push(`Mixed whale signals (${(totalScore * 100).toFixed(1)}%)`);
      } else {
        patterns.type = 'whale_avoid';
        patterns.confidence = totalScore;
        patterns.signals.push('WHALE_AVOID');
        patterns.reasoning.push(`Whale activity suggests avoiding (${(totalScore * 100).toFixed(1)}%)`);
      }
      
      return patterns;
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error analyzing patterns: ${error.message}`);
      return patterns;
    }
  }
  
  /**
   * Analyze momentum patterns
   */
  analyzeMomentumPattern(transaction, whaleStats, recentActivity) {
    let score = 0;
    
    // Check for multiple whales on same token
    const tokenWhales = recentActivity.filter(activity => 
      activity.token === transaction.tokenAddress && 
      activity.timestamp > Date.now() - this.whalePatterns.momentumPatterns.whaleTiming.window
    );
    
    if (tokenWhales.length >= this.whalePatterns.momentumPatterns.multipleWhales.threshold) {
      score += this.whalePatterns.momentumPatterns.multipleWhales.weight;
    }
    
    // Check whale volume
    if (transaction.volume >= this.whalePatterns.momentumPatterns.whaleVolume.threshold) {
      score += this.whalePatterns.momentumPatterns.whaleVolume.weight;
    }
    
    // Check whale success rate
    if (whaleStats && whaleStats.successRate >= this.whalePatterns.momentumPatterns.whaleSuccess.threshold) {
      score += this.whalePatterns.momentumPatterns.whaleSuccess.weight;
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Analyze sentiment patterns
   */
  analyzeSentimentPattern(transaction, whaleStats) {
    let score = 0;
    
    if (transaction.action === 'buy') {
      score += this.whalePatterns.sentimentPatterns.whaleBuying.weight;
    } else if (transaction.action === 'sell') {
      score += this.whalePatterns.sentimentPatterns.whaleSelling.weight;
    }
    
    // Check if whale is profitable
    if (transaction.profitLoss > 0) {
      score += 0.2; // Bonus for profitable whales
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Analyze timing patterns
   */
  analyzeTimingPattern(transaction, whaleStats, recentActivity) {
    let score = 0;
    
    // Check for recent activity
    if (whaleStats && whaleStats.lastActivity && 
        Date.now() - whaleStats.lastActivity < this.whalePatterns.timingPatterns.recentActivity.window) {
      score += this.whalePatterns.timingPatterns.recentActivity.weight;
    }
    
    // Check whale frequency
    if (whaleStats && whaleStats.trades >= this.whalePatterns.timingPatterns.whaleFrequency.threshold) {
      score += this.whalePatterns.timingPatterns.whaleFrequency.weight;
    }
    
    // Check whale consistency
    if (whaleStats && whaleStats.successRate >= this.whalePatterns.timingPatterns.whaleConsistency.threshold) {
      score += this.whalePatterns.timingPatterns.whaleConsistency.weight;
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Generate whale intelligence for AI integration
   */
  generateWhaleIntelligence(patterns) {
    const intelligence = {
      score: 0,
      confidence: 0,
      recommendation: 'HOLD',
      signals: [],
      reasoning: []
    };
    
    try {
      // Calculate whale score (0-100)
      intelligence.score = Math.round(patterns.confidence * 100);
      intelligence.confidence = patterns.confidence;
      
      // Determine recommendation
      if (intelligence.score >= 80) {
        intelligence.recommendation = 'STRONG_BUY';
        intelligence.signals.push('WHALE_STRONG_BUY');
      } else if (intelligence.score >= 60) {
        intelligence.recommendation = 'BUY';
        intelligence.signals.push('WHALE_BUY');
      } else if (intelligence.score >= 40) {
        intelligence.recommendation = 'WATCH';
        intelligence.signals.push('WHALE_WATCH');
      } else {
        intelligence.recommendation = 'AVOID';
        intelligence.signals.push('WHALE_AVOID');
      }
      
      // Add reasoning
      intelligence.reasoning = patterns.reasoning;
      
      return intelligence;
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error generating intelligence: ${error.message}`);
      return intelligence;
    }
  }
  
  /**
   * Process copy trading opportunity
   */
  processCopyTradeOpportunity(opportunity) {
    try {
      const whaleStats = whaleDataService.getWhaleStats()[opportunity.whale];
      const confidence = opportunity.confidence;
      
      // Only copy trade if whale confidence is high enough
      if (confidence >= this.config.minWhaleConfidence) {
        const copyTrade = {
          type: 'copy_trade',
          whale: opportunity.whale,
          token: opportunity.token,
          symbol: opportunity.symbol,
          price: opportunity.price,
          volume: opportunity.volume,
          confidence: confidence,
          whaleName: whaleStats?.name || 'Unknown',
          timestamp: Date.now()
        };
        
        this.emit('copyTradeSignal', copyTrade);
        
        console.log(`[WHALE-INTEL] 🐋 Copy trade signal: ${copyTrade.symbol} (${(confidence * 100).toFixed(1)}% confidence)`);
      }
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error processing copy trade: ${error.message}`);
    }
  }
  
  /**
   * Get whale intelligence for a specific token
   */
  getWhaleIntelligenceForToken(tokenAddress) {
    try {
      const whaleActivity = whaleDataService.getWhaleActivityForToken(tokenAddress);
      
      if (whaleActivity.length === 0) {
        return {
          score: 50,
          confidence: 0.5,
          recommendation: 'HOLD',
          signals: ['NO_WHALE_ACTIVITY'],
          reasoning: ['No recent whale activity for this token']
        };
      }
      
      // Analyze recent whale activity
      const patterns = this.analyzeWhalePatterns({
        transaction: whaleActivity[0],
        whale: { address: whaleActivity[0].wallet }
      });
      
      return this.generateWhaleIntelligence(patterns);
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error getting token intelligence: ${error.message}`);
      return {
        score: 50,
        confidence: 0.5,
        recommendation: 'HOLD',
        signals: ['ERROR'],
        reasoning: ['Error analyzing whale intelligence']
      };
    }
  }
  
  /**
   * Get overall whale intelligence summary
   */
  getWhaleIntelligenceSummary() {
    try {
      const whaleStats = whaleDataService.getWhaleStats();
      const recentActivity = whaleDataService.getRecentWhaleActivity(20);
      
      const summary = {
        totalWhales: Object.keys(whaleStats).length,
        activeWhales: 0,
        totalTrades: 0,
        averageConfidence: 0,
        recentSignals: [],
        topWhales: []
      };
      
      // Calculate active whales and total trades
      for (const [address, stats] of Object.entries(whaleStats)) {
        summary.totalTrades += stats.trades;
        
        if (stats.lastActivity && Date.now() - stats.lastActivity < 300000) { // 5 minutes
          summary.activeWhales++;
        }
      }
      
      // Calculate average confidence
      const confidences = Object.values(whaleStats).map(stats => 
        whaleDataService.calculateWhaleConfidence(stats.address)
      );
      summary.averageConfidence = confidences.length > 0 ? 
        confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
      
      // Get top performing whales
      summary.topWhales = Object.entries(whaleStats)
        .sort(([,a], [,b]) => b.successRate - a.successRate)
        .slice(0, 5)
        .map(([address, stats]) => ({
          address: address.substring(0, 8) + '...',
          name: stats.name,
          successRate: stats.successRate,
          trades: stats.trades,
          confidence: whaleDataService.calculateWhaleConfidence(address)
        }));
      
      return summary;
      
    } catch (error) {
      console.log(`[WHALE-INTEL] ❌ Error getting summary: ${error.message}`);
      return {
        totalWhales: 0,
        activeWhales: 0,
        totalTrades: 0,
        averageConfidence: 0,
        recentSignals: [],
        topWhales: []
      };
    }
  }
}

// Export singleton instance
export const whaleIntelligence = new WhaleIntelligence(); 