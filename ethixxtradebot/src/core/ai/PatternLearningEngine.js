#!/usr/bin/env node
/**
 * Pattern Learning Engine
 * Tracks tokens from creation to outcome to learn what makes winners vs duds
 * Perfect for $112 degen strategy with speed advantage
 */

import { EventEmitter } from 'node:events';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

export class PatternLearningEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.dataFile = options.dataFile || 'token_learning_data.json';
    this.trackedTokens = new Map();
    this.patterns = {
      winners: [],
      duds: [],
      unknown: []
    };
    
    // Load existing data
    this.loadData();
    
    console.log('🧠 PATTERN LEARNING ENGINE INITIALIZED');
    console.log(`📊 Tracking ${this.trackedTokens.size} tokens`);
  }
  
  /**
   * Record a new token when first detected
   */
  recordTokenBirth(tokenData) {
    const token = {
      // Initial detection data
      address: tokenData.token,
      symbol: tokenData.symbol,
      createdAt: Date.now(),
      
      // Launch characteristics  
      initialLiquidity: tokenData.liquidity,
      initialMarketCap: tokenData.marketCap,
      confidence: tokenData.confidence,
      source: tokenData.type, // NEW_TOKEN_LAUNCH, SURGE_OPPORTUNITY, etc
      
      // Pattern tracking
      priceHistory: [],
      volumeHistory: [],
      liquidityHistory: [{ time: Date.now(), value: tokenData.liquidity }],
      
      // Outcome tracking
      outcome: 'unknown', // unknown -> winner/dud
      maxPrice: null,
      finalPrice: null,
      roi: null,
      
      // Learning features
      nameLength: tokenData.symbol?.length || 0,
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(tokenData.symbol || ''),
      launchHour: new Date().getHours(),
      launchDay: new Date().getDay()
    };
    
    this.trackedTokens.set(tokenData.token, token);
    console.log(`🎯 TRACKING NEW TOKEN: ${token.symbol} | Liquidity: $${token.initialLiquidity?.toFixed(0)}`);
    
    this.saveData();
    return token;
  }
  
  /**
   * Update token with new market data
   */
  updateTokenData(address, updateData) {
    const token = this.trackedTokens.get(address);
    if (!token) return;
    
    const now = Date.now();
    
    // Track price if available
    if (updateData.price) {
      token.priceHistory.push({ time: now, price: updateData.price });
      if (!token.maxPrice || updateData.price > token.maxPrice) {
        token.maxPrice = updateData.price;
      }
    }
    
    // Track volume
    if (updateData.volume) {
      token.volumeHistory.push({ time: now, volume: updateData.volume });
    }
    
    // Track liquidity changes
    if (updateData.liquidity) {
      token.liquidityHistory.push({ time: now, value: updateData.liquidity });
    }
    
    // Auto-classify if enough time has passed
    this.autoClassifyToken(address);
  }
  
  /**
   * Automatically classify tokens as winners/duds based on performance
   */
  autoClassifyToken(address) {
    const token = this.trackedTokens.get(address);
    if (!token || token.outcome !== 'unknown') return;
    
    const ageHours = (Date.now() - token.createdAt) / (1000 * 60 * 60);
    
    // Only classify after 4+ hours
    if (ageHours < 4) return;
    
    // Calculate performance metrics
    const currentLiquidity = token.liquidityHistory[token.liquidityHistory.length - 1]?.value || 0;
    const liquidityChange = currentLiquidity / (token.initialLiquidity || 1);
    
    // Winner criteria: 4+ hours old, liquidity increased significantly
    if (ageHours >= 4 && liquidityChange > 1.5) {
      token.outcome = 'winner';
      this.patterns.winners.push(this.extractFeatures(token));
      console.log(`🏆 CLASSIFIED WINNER: ${token.symbol} | Age: ${ageHours.toFixed(1)}h | Liquidity: ${liquidityChange.toFixed(2)}x`);
    }
    // Dud criteria: 4+ hours old, liquidity decreased or stagnant
    else if (ageHours >= 4 && liquidityChange < 0.8) {
      token.outcome = 'dud';
      this.patterns.duds.push(this.extractFeatures(token));
      console.log(`💀 CLASSIFIED DUD: ${token.symbol} | Age: ${ageHours.toFixed(1)}h | Liquidity: ${liquidityChange.toFixed(2)}x`);
    }
    
    this.saveData();
  }
  
  /**
   * Extract features for pattern learning
   */
  extractFeatures(token) {
    const liquidityChange = (token.liquidityHistory[token.liquidityHistory.length - 1]?.value || 0) / (token.initialLiquidity || 1);
    
    return {
      // Launch characteristics
      initialLiquidity: token.initialLiquidity,
      initialMarketCap: token.initialMarketCap,
      confidence: token.confidence,
      source: token.source,
      
      // Name patterns
      nameLength: token.nameLength,
      hasEmoji: token.hasEmoji,
      
      // Timing
      launchHour: token.launchHour,
      launchDay: token.launchDay,
      
      // Performance
      liquidityChange: liquidityChange,
      outcome: token.outcome
    };
  }
  
  /**
   * Get current learning insights
   */
  getLearningInsights() {
    const insights = {
      totalTracked: this.trackedTokens.size,
      winners: this.patterns.winners.length,
      duds: this.patterns.duds.length,
      winRate: this.patterns.winners.length / (this.patterns.winners.length + this.patterns.duds.length) * 100,
      
      // Pattern insights
      winnerPatterns: this.analyzePatterns(this.patterns.winners),
      dudPatterns: this.analyzePatterns(this.patterns.duds)
    };
    
    return insights;
  }
  
  /**
   * Analyze patterns in winner/dud data
   */
  analyzePatterns(dataset) {
    if (dataset.length === 0) return {};
    
    const avgLiquidity = dataset.reduce((sum, t) => sum + (t.initialLiquidity || 0), 0) / dataset.length;
    const avgConfidence = dataset.reduce((sum, t) => sum + (t.confidence || 0), 0) / dataset.length;
    const emojiRate = dataset.filter(t => t.hasEmoji).length / dataset.length * 100;
    
    return {
      count: dataset.length,
      avgInitialLiquidity: avgLiquidity,
      avgConfidence: avgConfidence,
      emojiRate: emojiRate,
      commonHours: this.getMostCommon(dataset.map(t => t.launchHour)),
      commonSources: this.getMostCommon(dataset.map(t => t.source))
    };
  }
  
  getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }
  
  /**
   * Predict if a new token will be a winner based on learned patterns
   */
  predictOutcome(tokenData) {
    const insights = this.getLearningInsights();
    
    if (insights.winners < 5 || insights.duds < 5) {
      return { prediction: 'insufficient_data', confidence: 0, reason: 'Need more training data' };
    }
    
    const features = {
      initialLiquidity: tokenData.liquidity,
      confidence: tokenData.confidence,
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(tokenData.symbol || ''),
      launchHour: new Date().getHours()
    };
    
    // Simple pattern matching (can be enhanced with ML)
    let winnerScore = 0;
    let dudScore = 0;
    
    // Liquidity patterns
    if (features.initialLiquidity >= insights.winnerPatterns.avgInitialLiquidity * 0.8) winnerScore++;
    if (features.initialLiquidity <= insights.dudPatterns.avgInitialLiquidity * 1.2) dudScore++;
    
    // Confidence patterns
    if (features.confidence >= insights.winnerPatterns.avgConfidence * 0.9) winnerScore++;
    if (features.confidence <= insights.dudPatterns.avgConfidence * 1.1) dudScore++;
    
    const prediction = winnerScore > dudScore ? 'winner' : 'dud';
    const confidence = Math.abs(winnerScore - dudScore) / Math.max(winnerScore, dudScore, 1);
    
    return {
      prediction,
      confidence: confidence * 100,
      winnerScore,
      dudScore,
      insights: insights
    };
  }
  
  saveData() {
    const data = {
      trackedTokens: Array.from(this.trackedTokens.entries()),
      patterns: this.patterns,
      lastUpdated: Date.now()
    };
    
    writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }
  
  loadData() {
    if (!existsSync(this.dataFile)) return;
    
    try {
      const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
      this.trackedTokens = new Map(data.trackedTokens || []);
      this.patterns = data.patterns || { winners: [], duds: [], unknown: [] };
    } catch (error) {
      console.error('Error loading learning data:', error.message);
    }
  }
}

// Export singleton
export const patternLearning = new PatternLearningEngine(); 