#!/usr/bin/env node
/**
 * Momentum Tracker - Real-time Price & Volume Momentum Detection
 * Tracks token momentum in real-time for quick entry/exit decisions
 */

import { EventEmitter } from 'node:events';

export class MomentumTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Tracking intervals
      intervals: {
        tick: 1000,     // 1 second
        short: 60000,   // 1 minute
        medium: 300000, // 5 minutes
        long: 900000    // 15 minutes
      },
      
      // Momentum thresholds
      thresholds: {
        strongBuy: 0.2,      // 20% gain
        buy: 0.1,            // 10% gain
        neutral: 0.02,       // 2% movement
        sell: -0.05,         // 5% loss
        strongSell: -0.1     // 10% loss
      },
      
      // Volume thresholds
      volumeMultipliers: {
        explosion: 5,        // 5x average volume
        high: 2,             // 2x average volume
        normal: 1,           // Average volume
        low: 0.5             // Half average volume
      }
    };
    
    // Token tracking data
    this.trackedTokens = new Map();
    
    // Real-time data storage
    this.priceHistory = new Map();
    this.volumeHistory = new Map();
    
    console.log('📈 MOMENTUM TRACKER INITIALIZED');
    console.log('⚡ Real-time price & volume momentum detection');
  }
  
  /**
   * Start tracking a token
   */
  startTracking(tokenAddress, initialData) {
    if (this.trackedTokens.has(tokenAddress)) {
      return;
    }
    
    const tokenData = {
      address: tokenAddress,
      symbol: initialData.symbol,
      startTime: Date.now(),
      initialPrice: initialData.price,
      currentPrice: initialData.price,
      highPrice: initialData.price,
      lowPrice: initialData.price,
      totalVolume: initialData.volume || 0,
      buyVolume: initialData.buyVolume || 0,
      sellVolume: initialData.sellVolume || 0,
      momentum: {
        price: {
          tick: 0,
          short: 0,
          medium: 0,
          long: 0
        },
        volume: {
          tick: 0,
          short: 0,
          medium: 0,
          long: 0
        },
        trend: 'NEUTRAL',
        strength: 0
      }
    };
    
    this.trackedTokens.set(tokenAddress, tokenData);
    
    // Initialize history
    this.priceHistory.set(tokenAddress, [{
      timestamp: Date.now(),
      price: initialData.price
    }]);
    
    this.volumeHistory.set(tokenAddress, [{
      timestamp: Date.now(),
      volume: initialData.volume || 0,
      buyVolume: initialData.buyVolume || 0,
      sellVolume: initialData.sellVolume || 0
    }]);
    
    console.log(`[MOMENTUM] 📊 Started tracking ${initialData.symbol}`);
  }
  
  /**
   * Update token data with new tick
   */
  updateToken(tokenAddress, tickData) {
    const token = this.trackedTokens.get(tokenAddress);
    if (!token) return null;
    
    const previousPrice = token.currentPrice;
    
    // Update current data
    token.currentPrice = tickData.price;
    token.highPrice = Math.max(token.highPrice, tickData.price);
    token.lowPrice = Math.min(token.lowPrice, tickData.price);
    
    // Update volume
    if (tickData.volume) {
      token.totalVolume += tickData.volume;
      token.buyVolume += tickData.buyVolume || 0;
      token.sellVolume += tickData.sellVolume || 0;
    }
    
    // Update price history
    const priceHistory = this.priceHistory.get(tokenAddress);
    priceHistory.push({
      timestamp: Date.now(),
      price: tickData.price
    });
    
    // Keep only last 15 minutes of data
    const cutoffTime = Date.now() - this.config.intervals.long;
    this.cleanHistory(priceHistory, cutoffTime);
    
    // Update volume history
    const volumeHistory = this.volumeHistory.get(tokenAddress);
    volumeHistory.push({
      timestamp: Date.now(),
      volume: tickData.volume || 0,
      buyVolume: tickData.buyVolume || 0,
      sellVolume: tickData.sellVolume || 0
    });
    this.cleanHistory(volumeHistory, cutoffTime);
    
    // Calculate momentum
    const momentum = this.calculateMomentum(tokenAddress);
    token.momentum = momentum;
    
    // Emit events for significant changes
    this.checkForSignals(tokenAddress, token, previousPrice);
    
    return momentum;
  }
  
  /**
   * Calculate comprehensive momentum
   */
  calculateMomentum(tokenAddress) {
    const priceHistory = this.priceHistory.get(tokenAddress);
    const volumeHistory = this.volumeHistory.get(tokenAddress);
    
    if (!priceHistory || priceHistory.length < 2) {
      return this.getDefaultMomentum();
    }
    
    const now = Date.now();
    const currentPrice = priceHistory[priceHistory.length - 1].price;
    
    // Calculate price momentum for different intervals
    const priceMomentum = {
      tick: this.calculateIntervalMomentum(priceHistory, now - this.config.intervals.tick),
      short: this.calculateIntervalMomentum(priceHistory, now - this.config.intervals.short),
      medium: this.calculateIntervalMomentum(priceHistory, now - this.config.intervals.medium),
      long: this.calculateIntervalMomentum(priceHistory, now - this.config.intervals.long)
    };
    
    // Calculate volume momentum
    const volumeMomentum = {
      tick: this.calculateVolumeMomentum(volumeHistory, now - this.config.intervals.tick),
      short: this.calculateVolumeMomentum(volumeHistory, now - this.config.intervals.short),
      medium: this.calculateVolumeMomentum(volumeHistory, now - this.config.intervals.medium),
      long: this.calculateVolumeMomentum(volumeHistory, now - this.config.intervals.long)
    };
    
    // Determine trend and strength
    const trend = this.determineTrend(priceMomentum, volumeMomentum);
    const strength = this.calculateStrength(priceMomentum, volumeMomentum);
    
    return {
      price: priceMomentum,
      volume: volumeMomentum,
      trend,
      strength,
      signal: this.generateSignal(trend, strength)
    };
  }
  
  /**
   * Calculate price momentum for a specific interval
   */
  calculateIntervalMomentum(priceHistory, startTime) {
    const relevantPrices = priceHistory.filter(p => p.timestamp >= startTime);
    
    if (relevantPrices.length < 2) {
      return 0;
    }
    
    const startPrice = relevantPrices[0].price;
    const endPrice = relevantPrices[relevantPrices.length - 1].price;
    
    return (endPrice - startPrice) / startPrice;
  }
  
  /**
   * Calculate volume momentum
   */
  calculateVolumeMomentum(volumeHistory, startTime) {
    const relevantVolumes = volumeHistory.filter(v => v.timestamp >= startTime);
    
    if (relevantVolumes.length < 2) {
      return 1;
    }
    
    // Calculate average volume
    const totalVolume = relevantVolumes.reduce((sum, v) => sum + v.volume, 0);
    const avgVolume = totalVolume / relevantVolumes.length;
    
    // Compare recent volume to average
    const recentVolumes = relevantVolumes.slice(-5);
    const recentAvg = recentVolumes.reduce((sum, v) => sum + v.volume, 0) / recentVolumes.length;
    
    return avgVolume > 0 ? recentAvg / avgVolume : 1;
  }
  
  /**
   * Determine overall trend
   */
  determineTrend(priceMomentum, volumeMomentum) {
    // Weight recent data more heavily
    const weightedPrice = 
      priceMomentum.tick * 0.4 +
      priceMomentum.short * 0.3 +
      priceMomentum.medium * 0.2 +
      priceMomentum.long * 0.1;
    
    // Consider volume confirmation
    const volumeConfirmation = volumeMomentum.short > 1.5;
    
    if (weightedPrice > this.config.thresholds.strongBuy && volumeConfirmation) {
      return 'STRONG_BUY';
    } else if (weightedPrice > this.config.thresholds.buy) {
      return 'BUY';
    } else if (weightedPrice < this.config.thresholds.strongSell) {
      return 'STRONG_SELL';
    } else if (weightedPrice < this.config.thresholds.sell) {
      return 'SELL';
    } else {
      return 'NEUTRAL';
    }
  }
  
  /**
   * Calculate momentum strength (0-100)
   */
  calculateStrength(priceMomentum, volumeMomentum) {
    // Price strength
    const priceStrength = Math.min(100, Math.abs(priceMomentum.short) * 200);
    
    // Volume strength
    const volumeStrength = Math.min(100, (volumeMomentum.short - 1) * 50);
    
    // Trend alignment (all intervals moving same direction)
    const priceValues = Object.values(priceMomentum);
    const allPositive = priceValues.every(v => v > 0);
    const allNegative = priceValues.every(v => v < 0);
    const alignmentBonus = (allPositive || allNegative) ? 20 : 0;
    
    return Math.min(100, (priceStrength * 0.6 + volumeStrength * 0.4 + alignmentBonus));
  }
  
  /**
   * Generate trading signal
   */
  generateSignal(trend, strength) {
    if (trend === 'STRONG_BUY' && strength > 70) {
      return { action: 'BUY', urgency: 'HIGH', confidence: strength };
    } else if (trend === 'BUY' && strength > 50) {
      return { action: 'BUY', urgency: 'MEDIUM', confidence: strength };
    } else if (trend === 'STRONG_SELL' && strength > 70) {
      return { action: 'SELL', urgency: 'HIGH', confidence: strength };
    } else if (trend === 'SELL' && strength > 50) {
      return { action: 'SELL', urgency: 'MEDIUM', confidence: strength };
    } else {
      return { action: 'HOLD', urgency: 'LOW', confidence: strength };
    }
  }
  
  /**
   * Check for and emit trading signals
   */
  checkForSignals(tokenAddress, token, previousPrice) {
    const momentum = token.momentum;
    
    // Price breakout detection
    if (momentum.price.tick > 0.05 && momentum.volume.tick > 2) {
      this.emit('breakout', {
        token: tokenAddress,
        symbol: token.symbol,
        type: 'BULLISH',
        priceChange: momentum.price.tick,
        volumeMultiple: momentum.volume.tick
      });
    }
    
    // Momentum reversal detection
    const priceReversal = (previousPrice > token.currentPrice && token.currentPrice < token.highPrice * 0.95);
    if (priceReversal && momentum.trend === 'SELL') {
      this.emit('reversal', {
        token: tokenAddress,
        symbol: token.symbol,
        type: 'BEARISH',
        fromPrice: token.highPrice,
        toPrice: token.currentPrice,
        drop: (token.highPrice - token.currentPrice) / token.highPrice
      });
    }
    
    // Volume spike detection
    if (momentum.volume.tick > this.config.volumeMultipliers.explosion) {
      this.emit('volumeSpike', {
        token: tokenAddress,
        symbol: token.symbol,
        volumeMultiple: momentum.volume.tick,
        trend: momentum.trend
      });
    }
  }
  
  /**
   * Get momentum report for a token
   */
  getMomentumReport(tokenAddress) {
    const token = this.trackedTokens.get(tokenAddress);
    if (!token) return null;
    
    const holdTime = Date.now() - token.startTime;
    const totalReturn = (token.currentPrice - token.initialPrice) / token.initialPrice;
    const maxReturn = (token.highPrice - token.initialPrice) / token.initialPrice;
    
    return {
      symbol: token.symbol,
      holdTime: Math.floor(holdTime / 1000), // seconds
      currentPrice: token.currentPrice,
      initialPrice: token.initialPrice,
      highPrice: token.highPrice,
      lowPrice: token.lowPrice,
      totalReturn: (totalReturn * 100).toFixed(2) + '%',
      maxReturn: (maxReturn * 100).toFixed(2) + '%',
      momentum: token.momentum,
      buyVolume: token.buyVolume,
      sellVolume: token.sellVolume,
      volumeRatio: token.buyVolume / (token.sellVolume || 1)
    };
  }
  
  /**
   * Stop tracking a token
   */
  stopTracking(tokenAddress) {
    this.trackedTokens.delete(tokenAddress);
    this.priceHistory.delete(tokenAddress);
    this.volumeHistory.delete(tokenAddress);
  }
  
  /**
   * Clean old history data
   */
  cleanHistory(history, cutoffTime) {
    while (history.length > 0 && history[0].timestamp < cutoffTime) {
      history.shift();
    }
  }
  
  /**
   * Get default momentum object
   */
  getDefaultMomentum() {
    return {
      price: { tick: 0, short: 0, medium: 0, long: 0 },
      volume: { tick: 1, short: 1, medium: 1, long: 1 },
      trend: 'NEUTRAL',
      strength: 0,
      signal: { action: 'HOLD', urgency: 'LOW', confidence: 0 }
    };
  }
  
  /**
   * Get all tracked tokens
   */
  getTrackedTokens() {
    return Array.from(this.trackedTokens.values()).map(token => ({
      address: token.address,
      symbol: token.symbol,
      momentum: token.momentum,
      currentPrice: token.currentPrice,
      priceChange: ((token.currentPrice - token.initialPrice) / token.initialPrice * 100).toFixed(2) + '%'
    }));
  }
}

// Singleton instance
export const momentumTracker = new MomentumTracker(); 