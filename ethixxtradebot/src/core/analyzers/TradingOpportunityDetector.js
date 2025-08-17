#!/usr/bin/env node

/**
 * Trading Opportunity Detector
 * Combines Birdeye WebSocket + API data for maximum profit potential
 */

import { EventEmitter } from 'node:events';
import { birdeyeWebSocket } from '../integrations/BirdeyeWebSocket.js';
import { BirdeyeAnalytics } from '../../services/BirdeyeAnalytics.js';

export class TradingOpportunityDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      minConfidence: options.minConfidence || 0.7,
      maxOpportunities: options.maxOpportunities || 10,
      opportunityTimeout: options.opportunityTimeout || 300000, // 5 minutes
      enableAutoTrading: options.enableAutoTrading || false
    };
    
    this.birdeye = new BirdeyeAnalytics();
    this.opportunities = new Map();
    this.activeSubscriptions = new Set();
    
    console.log('🎯 TRADING OPPORTUNITY DETECTOR INITIALIZED');
    console.log(`📊 Min Confidence: ${this.config.minConfidence * 100}%`);
    console.log(`🎲 Max Opportunities: ${this.config.maxOpportunities}`);
    console.log(`⏰ Opportunity Timeout: ${this.config.opportunityTimeout / 1000}s`);
    console.log(`🤖 Auto Trading: ${this.config.enableAutoTrading ? 'ENABLED' : 'DISABLED'}`);
    
    this.setupWebSocketListeners();
  }
  
  /**
   * Setup WebSocket event listeners
   */
  setupWebSocketListeners() {
    // Whale buy opportunities
    birdeyeWebSocket.on('whaleBuyOpportunity', (data) => {
      this.processWhaleBuyOpportunity(data);
    });
    
    // New pair opportunities
    birdeyeWebSocket.on('newPairOpportunity', (data) => {
      this.processNewPairOpportunity(data);
    });
    
    // New listing opportunities
    birdeyeWebSocket.on('newListingOpportunity', (data) => {
      this.processNewListingOpportunity(data);
    });
    
    // Momentum opportunities
    birdeyeWebSocket.on('momentumOpportunity', (data) => {
      this.processMomentumOpportunity(data);
    });
    
    // Whale transaction opportunities
    birdeyeWebSocket.on('whaleTransactionOpportunity', (data) => {
      this.processWhaleTransactionOpportunity(data);
    });
    
    // Secure momentum opportunities
    birdeyeWebSocket.on('secureMomentumOpportunity', (data) => {
      this.processSecureMomentumOpportunity(data);
    });
  }
  
  /**
   * Start opportunity detection
   */
  async start() {
    console.log('🚀 Starting trading opportunity detection...');
    
    // Connect to Birdeye WebSocket
    await birdeyeWebSocket.connect();
    
    // Subscribe to all opportunity types
    this.subscribeToAllOpportunities();
    
    // Start opportunity cleanup
    this.startOpportunityCleanup();
    
    console.log('✅ Trading opportunity detection ACTIVE');
  }
  
  /**
   * Subscribe to all opportunity types
   */
  subscribeToAllOpportunities() {
    // Large trades (whale activity)
    birdeyeWebSocket.subscribeLargeTrades(5000); // $5k+ trades
    
    // New pairs
    birdeyeWebSocket.subscribeNewPairs();
    
    // New listings
    birdeyeWebSocket.subscribeNewListings();
    
    // Subscribe to tracked whale wallets
    this.subscribeToTrackedWhales();
    
    console.log('📡 Subscribed to all opportunity types');
  }
  
  /**
   * Subscribe to tracked whale wallets
   */
  subscribeToTrackedWhales() {
    // Load tracked wallets from config
    const trackedWallets = [
      // Add your tracked whale addresses here
      'YOUR_WHALE_WALLET_1',
      'YOUR_WHALE_WALLET_2'
    ];
    
    trackedWallets.forEach(wallet => {
      if (wallet && wallet !== 'YOUR_WHALE_WALLET_1') {
        birdeyeWebSocket.subscribeWalletTransactions(wallet);
        this.activeSubscriptions.add(`wallet_${wallet}`);
      }
    });
  }
  
  /**
   * Process whale buy opportunity
   */
  async processWhaleBuyOpportunity(data) {
    const { tokenAddress, volume, price, confidence } = data;
    
    if (confidence >= this.config.minConfidence) {
      console.log(`🐋 PROCESSING WHALE BUY: ${tokenAddress}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `whale_buy_${tokenAddress}_${Date.now()}`,
        type: 'WHALE_BUY',
        tokenAddress,
        price,
        volume,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: price,
          target: price * 1.15, // 15% profit target
          stopLoss: price * 0.95, // 5% stop loss
          positionSize: this.calculatePositionSize(confidence, volume),
          timeframe: 'SHORT_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Process new pair opportunity
   */
  async processNewPairOpportunity(data) {
    const { tokenAddress, tokenName, tokenSymbol, liquidity, confidence } = data;
    
    if (confidence >= this.config.minConfidence) {
      console.log(`🚀 PROCESSING NEW PAIR: ${tokenSymbol}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `new_pair_${tokenAddress}_${Date.now()}`,
        type: 'NEW_PAIR',
        tokenAddress,
        tokenName,
        tokenSymbol,
        liquidity,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: 'MARKET_PRICE',
          target: 'DYNAMIC', // Based on momentum
          stopLoss: 'DYNAMIC', // Based on volatility
          positionSize: this.calculatePositionSize(confidence, liquidity),
          timeframe: 'MEDIUM_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Process new listing opportunity
   */
  async processNewListingOpportunity(data) {
    const { tokenAddress, tokenName, tokenSymbol, confidence } = data;
    
    if (confidence >= this.config.minConfidence) {
      console.log(`📈 PROCESSING NEW LISTING: ${tokenSymbol}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `new_listing_${tokenAddress}_${Date.now()}`,
        type: 'NEW_LISTING',
        tokenAddress,
        tokenName,
        tokenSymbol,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: 'MARKET_PRICE',
          target: 'DYNAMIC', // Based on initial momentum
          stopLoss: 'TIGHT', // Tight stop for new listings
          positionSize: this.calculatePositionSize(confidence, 10000), // Conservative
          timeframe: 'SHORT_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Process momentum opportunity
   */
  async processMomentumOpportunity(data) {
    const { tokenAddress, price, change24h, volume24h, confidence } = data;
    
    if (confidence >= this.config.minConfidence) {
      console.log(`📈 PROCESSING MOMENTUM: ${tokenAddress}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `momentum_${tokenAddress}_${Date.now()}`,
        type: 'MOMENTUM',
        tokenAddress,
        price,
        change24h,
        volume24h,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: price,
          target: price * (1 + (change24h / 100) * 0.5), // 50% of current momentum
          stopLoss: price * 0.90, // 10% stop loss
          positionSize: this.calculatePositionSize(confidence, volume24h),
          timeframe: 'MEDIUM_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Process whale transaction opportunity
   */
  async processWhaleTransactionOpportunity(data) {
    const { walletAddress, tokenAddress, action, volume, price, confidence } = data;
    
    if (confidence >= this.config.minConfidence && action === 'buy') {
      console.log(`👛 PROCESSING WHALE TRANSACTION: ${tokenAddress}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `whale_tx_${tokenAddress}_${Date.now()}`,
        type: 'WHALE_TRANSACTION',
        tokenAddress,
        walletAddress,
        action,
        volume,
        price,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: price,
          target: price * 1.20, // 20% profit target
          stopLoss: price * 0.93, // 7% stop loss
          positionSize: this.calculatePositionSize(confidence, volume),
          timeframe: 'SHORT_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Process secure momentum opportunity
   */
  async processSecureMomentumOpportunity(data) {
    const { tokenAddress, securityScore, momentumScore, marketCap, volume24h, confidence } = data;
    
    if (confidence >= this.config.minConfidence) {
      console.log(`🛡️ PROCESSING SECURE MOMENTUM: ${tokenAddress}`);
      
      // Get additional analysis
      const analysis = await this.getComprehensiveAnalysis(tokenAddress);
      
      const opportunity = {
        id: `secure_momentum_${tokenAddress}_${Date.now()}`,
        type: 'SECURE_MOMENTUM',
        tokenAddress,
        securityScore,
        momentumScore,
        marketCap,
        volume24h,
        confidence,
        analysis,
        timestamp: Date.now(),
        strategy: {
          entry: 'MARKET_PRICE',
          target: 'DYNAMIC', // Based on momentum
          stopLoss: 'DYNAMIC', // Based on security score
          positionSize: this.calculatePositionSize(confidence, marketCap),
          timeframe: 'LONG_TERM'
        }
      };
      
      this.addOpportunity(opportunity);
    }
  }
  
  /**
   * Get comprehensive analysis for token
   */
  async getComprehensiveAnalysis(tokenAddress) {
    try {
      const analysis = await this.birdeye.analyzeToken(tokenAddress);
      return analysis;
    } catch (error) {
      console.log(`❌ Analysis error for ${tokenAddress}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Calculate position size based on confidence and volume
   */
  calculatePositionSize(confidence, volume) {
    const baseSize = 100; // $100 base position
    const confidenceMultiplier = confidence * 2; // 0-2x multiplier
    const volumeMultiplier = Math.min(volume / 10000, 3); // 0-3x multiplier
    
    return Math.round(baseSize * confidenceMultiplier * volumeMultiplier);
  }
  
  /**
   * Add opportunity to tracking
   */
  addOpportunity(opportunity) {
    // Check if we have too many opportunities
    if (this.opportunities.size >= this.config.maxOpportunities) {
      const oldestKey = this.opportunities.keys().next().value;
      this.opportunities.delete(oldestKey);
    }
    
    this.opportunities.set(opportunity.id, opportunity);
    
    console.log(`🎯 NEW OPPORTUNITY: ${opportunity.type}`);
    console.log(`   Token: ${opportunity.tokenAddress}`);
    console.log(`   Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
    console.log(`   Position Size: $${opportunity.strategy.positionSize}`);
    
    // Emit opportunity event
    this.emit('opportunity', opportunity);
    
    // Auto-trade if enabled
    if (this.config.enableAutoTrading) {
      this.executeTrade(opportunity);
    }
  }
  
  /**
   * Execute trade for opportunity
   */
  async executeTrade(opportunity) {
    try {
      console.log(`🤖 EXECUTING AUTO TRADE: ${opportunity.type}`);
      console.log(`   Token: ${opportunity.tokenAddress}`);
      console.log(`   Amount: $${opportunity.strategy.positionSize}`);
      
      // Emit trade execution event
      this.emit('tradeExecuted', {
        opportunity,
        timestamp: Date.now(),
        status: 'PENDING'
      });
      
      // Here you would integrate with your trading execution system
      // For now, we'll just log the trade
      
    } catch (error) {
      console.log(`❌ Trade execution error: ${error.message}`);
    }
  }
  
  /**
   * Start opportunity cleanup
   */
  startOpportunityCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredOpportunities = [];
      
      for (const [id, opportunity] of this.opportunities) {
        if (now - opportunity.timestamp > this.config.opportunityTimeout) {
          expiredOpportunities.push(id);
        }
      }
      
      expiredOpportunities.forEach(id => {
        this.opportunities.delete(id);
        console.log(`⏰ Removed expired opportunity: ${id}`);
      });
    }, 60000); // Check every minute
  }
  
  /**
   * Get all current opportunities
   */
  getOpportunities() {
    return Array.from(this.opportunities.values());
  }
  
  /**
   * Get opportunity by ID
   */
  getOpportunity(id) {
    return this.opportunities.get(id);
  }
  
  /**
   * Get opportunities by type
   */
  getOpportunitiesByType(type) {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.type === type);
  }
  
  /**
   * Get high-confidence opportunities
   */
  getHighConfidenceOpportunities(minConfidence = 0.8) {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.confidence >= minConfidence);
  }
  
  /**
   * Stop opportunity detection
   */
  stop() {
    birdeyeWebSocket.disconnect();
    this.opportunities.clear();
    console.log('🛑 Trading opportunity detection stopped');
  }
}

export const tradingOpportunityDetector = new TradingOpportunityDetector(); 