#!/usr/bin/env node
/**
 * Real-Time Opportunity Detector
 * Processes cluster7 goldmine messages at high speed to detect and rank trade opportunities
 * Built for SharedWebSocketManager persistent connections
 */

import { EventEmitter } from 'node:events';
import { sharedWebSocketManager } from './SharedWebSocketManager.js';

export class RealTimeOpportunityDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Opportunity filtering thresholds - UPDATED for real market conditions
      minLiquidity: options.minLiquidity || 5000, // $5k minimum liquidity (was 50k)
      maxAge: options.maxAge || 30000, // 30 seconds max age (was 10s)
      minConfidence: options.minConfidence || 0.60, // 60% minimum confidence (was 75%)
      maxMarketCap: options.maxMarketCap || 50000000, // $50M max market cap (was 10M)
      
      // Performance thresholds
      minVolumeSpike: 1.5, // 1.5x volume spike required (was 2.0x)
      minPriceMovement: 0.03, // 3% minimum price movement (was 5%)
      maxSlippage: 0.05, // 5% max acceptable slippage (was 3%)
      
      // Auckland advantage settings
      latencyEdge: 15, // 15ms advantage over competitors
      executionWindow: 2000, // 2 second execution window
      
      // Logging
      verbose: options.verbose || false
    };
    
    // WebSocket connection
    this.wsUrl = 'wss://cluster7.axiom.trade/';
    this.connection = null;
    this.isRunning = false;
    
    // Real-time opportunity tracking
    this.activeOpportunities = new Map();
    this.opportunityHistory = [];
    this.messageBuffer = [];
    
    // Performance metrics
    this.metrics = {
      messagesProcessed: 0,
      opportunitiesDetected: 0,
      highConfidenceOpportunities: 0,
      averageProcessingTime: 0,
      lastProcessingTime: 0,
      startTime: Date.now()
    };
    
    // Opportunity scoring weights
    this.scoringWeights = {
      liquidity: 0.25,      // 25% - Higher liquidity = lower risk
      volume: 0.20,         // 20% - Volume spike indicates momentum
      priceMovement: 0.20,  // 20% - Strong price movement
      marketCap: 0.15,      // 15% - Lower market cap = higher potential
      freshness: 0.10,      // 10% - Newer opportunities are better
      technical: 0.10       // 10% - Technical indicators
    };
    
    this.logger = console;
    this.isRunning = false;
    
    // Set up message processing
    this.setupMessageProcessing();
  }
  
  setupMessageProcessing() {
    // Listen for cluster7 messages via SharedWebSocketManager
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        this.processCluster7Message(data);
      }
    });
    
    sharedWebSocketManager.on('connection-open', ({ url }) => {
      if (url.includes('cluster7')) {
        this.logger.log('[OPPORTUNITY] 🎯 cluster7 connection opened - opportunity detection ACTIVE');
      }
    });
  }
  
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log('🚀 REAL-TIME OPPORTUNITY DETECTOR STARTING');
    console.log('=' .repeat(60));
    console.log('🔥 cluster7 goldmine monitoring: ACTIVE');
    console.log('⚡ Auckland latency advantage: 15ms edge');
    console.log('🎯 Auto-filtering for high-confidence opportunities');
    console.log('=' .repeat(60));
    
    try {
      // Connect to cluster7 goldmine
      this.connection = await sharedWebSocketManager.getSharedConnection(this.wsUrl);
      console.log('[OPPORTUNITY] ✅ Connected to cluster7 goldmine via SharedWebSocketManager');
      
      // CRITICAL FIX: Subscribe to data rooms immediately after connection
      sharedWebSocketManager.on('connection-open', ({ url }) => {
        if (url.includes('cluster7')) {
          console.log('[OPPORTUNITY] 🔥 cluster7 opened - sending subscription messages...');
          this.subscribeToDataRooms();
        }
      });
      
      // Listen for messages and opportunities
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('cluster7')) {
          this.handleCluster7Message(data);
        }
      });
      
      // Start stats reporting
      this.startStatsReporting();
      
    } catch (error) {
      console.error('[OPPORTUNITY] ❌ Failed to start opportunity detector:', error);
      this.isRunning = false;
    }
  }
  
  /**
   * Subscribe to cluster7 data rooms to unlock message flow
   */
  subscribeToDataRooms() {
    const subscriptions = [
      { action: 'join', room: 'trending-search-crypto' }, // New token launches
      { action: 'join', room: 'new_pairs' },              // Fresh pairs
      { action: 'join', room: 'surge-updates' },          // Surge data
      { action: 'join', room: 'twitter_feed_v2' }         // Social signals
    ];
    
    console.log('[OPPORTUNITY] 📤 Subscribing to data rooms...');
    
    for (const subscription of subscriptions) {
      try {
        this.connection.send(JSON.stringify(subscription));
        console.log(`[OPPORTUNITY] ✅ Subscribed to: ${subscription.room}`);
      } catch (error) {
        console.error(`[OPPORTUNITY] ❌ Failed to subscribe to ${subscription.room}:`, error);
      }
    }
    
    console.log('[OPPORTUNITY] 🚀 All subscriptions sent - data flow should start now!');
  }
  
  processCluster7Message(data) {
    const processingStart = performance.now();
    this.metrics.messagesProcessed++;
    
    try {
      // Buffer message for batch processing if needed
      this.messageBuffer.push({
        timestamp: Date.now(),
        data: data,
        processed: false
      });
      
      // Real-time opportunity detection
      const opportunity = this.detectOpportunity(data);
      
      if (opportunity) {
        this.handleOpportunityDetected(opportunity);
      }
      
      // Update processing metrics
      const processingTime = performance.now() - processingStart;
      this.metrics.lastProcessingTime = processingTime;
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (this.metrics.messagesProcessed - 1) + processingTime) / 
        this.metrics.messagesProcessed;
      
      // Log high-speed processing
      if (this.metrics.messagesProcessed % 100 === 0) {
        this.logger.log(`[OPPORTUNITY] ⚡ Processed ${this.metrics.messagesProcessed} messages (${processingTime.toFixed(2)}ms avg)`);
      }
      
    } catch (error) {
      this.logger.error('[OPPORTUNITY] ❌ Message processing error:', error.message);
    }
  }
  
  detectOpportunity(messageData) {
    try {
      // Parse different message types from cluster7
      const opportunity = this.parseMessageForOpportunity(messageData);
      
      if (!opportunity) return null;
      
      // Apply filtering thresholds
      if (!this.passesFilters(opportunity)) return null;
      
      // Calculate opportunity score
      const score = this.calculateOpportunityScore(opportunity);
      opportunity.score = score;
      opportunity.confidence = this.calculateConfidence(opportunity);
      
      // Only return high-confidence opportunities
      if (opportunity.confidence >= this.config.minConfidence) {
        this.metrics.opportunitiesDetected++;
        
        if (opportunity.confidence >= 0.85) {
          this.metrics.highConfidenceOpportunities++;
        }
        
        return opportunity;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('[OPPORTUNITY] ❌ Opportunity detection error:', error.message);
      return null;
    }
  }
  
  parseMessageForOpportunity(data) {
    // Parse cluster7 message types for trading opportunities
    if (!data || typeof data !== 'object') return null;
    
    // Handle cluster7 room-based message format
    if (data.room === 'trending-search-crypto' && data.content && Array.isArray(data.content)) {
      // Process each token in the trending crypto data
      const opportunities = [];
      
      for (const tokenData of data.content) {
        if (tokenData.surgeData) {
          const surge = tokenData.surgeData;
          const opportunity = {
            type: 'NEW_TOKEN_LAUNCH',
            token: surge.tokenAddress,
            symbol: surge.tokenTicker || surge.tokenName,
            marketCap: surge.marketCapSol * 142.50, // Convert SOL to USD
            liquidity: surge.liquiditySol * 142.50,
            age: Date.now() - new Date(surge.detectedAt).getTime(),
            protocol: surge.protocol || 'Unknown',
            volume24h: surge.volumeSol * 142.50,
            priceChange: ((surge.currentPriceSol || surge.priceSol) / (surge.surgedPrice || surge.priceSol) - 1) * 100,
            volumeSpike: surge.rankJump || 1,
            buyCount: surge.buyCount || 0,
            sellCount: surge.sellCount || 0,
            holders: surge.numHolders || 0,
            timestamp: Date.now(),
            raw: surge
          };
          
          // Return first valid opportunity (we process one at a time for now)
          if (this.passesFilters(opportunity)) {
            return opportunity;
          }
        }
      }
      
      return null;
    }
    
    // Handle other message types (block hash, priority fee, etc.)
    if (data.room === 'block_hash' || data.room === 'sol-priority-fee') {
      // These aren't trading opportunities, ignore them
      return null;
    }
    
    // Legacy format support (if any)
    // New token launch opportunity
    if (data.type === 'new_token' || data.event === 'token_launch') {
      return {
        type: 'NEW_TOKEN_LAUNCH',
        token: data.token || data.tokenAddress,
        symbol: data.symbol || data.tokenName,
        marketCap: data.marketCap || data.marketCapSol * 142.50, // Convert SOL to USD
        liquidity: data.liquidity || data.liquiditySol * 142.50,
        age: Date.now() - (data.timestamp || data.launchTime || Date.now()),
        protocol: data.protocol || 'Unknown',
        volume24h: data.volume24h || 0,
        priceChange: data.priceChange || 0,
        timestamp: Date.now(),
        raw: data
      };
    }
    
    // Large transaction opportunity
    if (data.type === 'large_transaction' || data.event === 'whale_move') {
      return {
        type: 'WHALE_TRANSACTION',
        token: data.token || data.tokenAddress,
        amount: data.amount || data.usdValue,
        direction: data.direction || (data.type === 'buy' ? 'BUY' : 'SELL'),
        whale: data.wallet || data.whaleAddress,
        impact: data.priceImpact || 0,
        timestamp: Date.now(),
        raw: data
      };
    }
    
    // Volume spike opportunity
    if (data.type === 'volume_spike' || data.event === 'volume_alert') {
      return {
        type: 'VOLUME_SPIKE',
        token: data.token || data.tokenAddress,
        volumeSpike: data.volumeSpike || data.multiplier,
        currentVolume: data.currentVolume,
        averageVolume: data.averageVolume,
        timeframe: data.timeframe || '1h',
        timestamp: Date.now(),
        raw: data
      };
    }
    
    // Price movement opportunity
    if (data.type === 'price_movement' || data.event === 'price_alert') {
      return {
        type: 'PRICE_MOVEMENT',
        token: data.token || data.tokenAddress,
        priceChange: data.priceChange || data.percentChange,
        timeframe: data.timeframe || '5m',
        volume: data.volume,
        momentum: data.momentum || 'UNKNOWN',
        timestamp: Date.now(),
        raw: data
      };
    }
    
    return null;
  }
  
  passesFilters(opportunity) {
    // Age filter - allow newer tokens
    if (opportunity.age > this.config.maxAge) {
      console.log(`[FILTER] Age too old: ${opportunity.age}ms > ${this.config.maxAge}ms`);
      return false;
    }
    
    // Market cap filter - more lenient
    if (opportunity.marketCap && opportunity.marketCap > this.config.maxMarketCap) {
      console.log(`[FILTER] Market cap too high: $${opportunity.marketCap} > $${this.config.maxMarketCap}`);
      return false;
    }
    
    // Liquidity filter - much lower threshold for new tokens
    if (opportunity.liquidity && opportunity.liquidity < this.config.minLiquidity) {
      console.log(`[FILTER] Liquidity too low: $${opportunity.liquidity} < $${this.config.minLiquidity}`);
      return false;
    }
    
    // Type-specific filters - more lenient
    switch (opportunity.type) {
      case 'NEW_TOKEN_LAUNCH':
        // Just need positive market cap and some liquidity
        const hasBasics = opportunity.marketCap > 0 && opportunity.liquidity > 1000; // $1k minimum
        if (!hasBasics) {
          console.log(`[FILTER] Missing basics: marketCap=${opportunity.marketCap}, liquidity=${opportunity.liquidity}`);
        }
        return hasBasics;
        
      case 'WHALE_TRANSACTION':
        return opportunity.amount > 5000; // $5k minimum whale transaction (was 10k)
        
      case 'VOLUME_SPIKE':
        return opportunity.volumeSpike >= this.config.minVolumeSpike;
        
      case 'PRICE_MOVEMENT':
        return Math.abs(opportunity.priceChange) >= this.config.minPriceMovement;
        
      default:
        return true;
    }
  }
  
  calculateOpportunityScore(opportunity) {
    let score = 0;
    
    // Liquidity score (higher is better, normalized)
    if (opportunity.liquidity) {
      score += this.scoringWeights.liquidity * Math.min(opportunity.liquidity / 1000000, 1); // Cap at $1M
    }
    
    // Volume score
    if (opportunity.volumeSpike) {
      score += this.scoringWeights.volume * Math.min(opportunity.volumeSpike / 5, 1); // Cap at 5x
    }
    
    // Price movement score
    if (opportunity.priceChange) {
      score += this.scoringWeights.priceMovement * Math.min(Math.abs(opportunity.priceChange) / 0.5, 1); // Cap at 50%
    }
    
    // Market cap score (lower is better for potential)
    if (opportunity.marketCap) {
      score += this.scoringWeights.marketCap * (1 - Math.min(opportunity.marketCap / 10000000, 1)); // Invert, cap at $10M
    }
    
    // Freshness score (newer is better)
    const ageScore = Math.max(0, 1 - (opportunity.age / this.config.maxAge));
    score += this.scoringWeights.freshness * ageScore;
    
    // Type-specific scoring
    switch (opportunity.type) {
      case 'NEW_TOKEN_LAUNCH':
        score += this.scoringWeights.technical * 0.8; // High potential for new tokens
        break;
      case 'WHALE_TRANSACTION':
        score += this.scoringWeights.technical * 0.9; // Very high confidence on whale moves
        break;
      case 'VOLUME_SPIKE':
        score += this.scoringWeights.technical * 0.7; // Good momentum indicator
        break;
      case 'PRICE_MOVEMENT':
        score += this.scoringWeights.technical * 0.6; // Moderate confidence
        break;
    }
    
    return Math.min(score, 1); // Cap at 1.0
  }
  
  calculateConfidence(opportunity) {
    let confidence = opportunity.score;
    
    // Boost confidence for certain patterns
    if (opportunity.type === 'WHALE_TRANSACTION' && opportunity.amount > 100000) {
      confidence *= 1.1; // 10% boost for large whale transactions
    }
    
    if (opportunity.type === 'NEW_TOKEN_LAUNCH' && opportunity.liquidity > 100000) {
      confidence *= 1.05; // 5% boost for well-funded launches
    }
    
    // Reduce confidence for risky patterns
    if (opportunity.marketCap && opportunity.marketCap < 50000) {
      confidence *= 0.9; // Reduce confidence for very small market caps
    }
    
    return Math.min(confidence, 1); // Cap at 1.0
  }
  
  handleOpportunityDetected(opportunity) {
    // Store opportunity
    this.activeOpportunities.set(opportunity.token || `${opportunity.type}_${Date.now()}`, opportunity);
    this.opportunityHistory.push(opportunity);
    
    // Log high-confidence opportunities
    if (opportunity.confidence >= 0.85) {
      this.logger.log(`[OPPORTUNITY] 🚀 HIGH CONFIDENCE: ${opportunity.type}`);
      this.logger.log(`  Token: ${opportunity.token || 'N/A'}`);
      this.logger.log(`  Score: ${(opportunity.score * 100).toFixed(1)}%`);
      this.logger.log(`  Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
      this.logger.log(`  Age: ${opportunity.age}ms`);
    }
    
    // Emit opportunity for trading systems
    this.emit('opportunity', {
      ...opportunity,
      urgency: this.calculateUrgency(opportunity),
      aucklandAdvantage: true,
      detectedAt: Date.now()
    });
    
    // Clean up old opportunities
    this.cleanupOldOpportunities();
  }
  
  calculateUrgency(opportunity) {
    if (opportunity.age < 2000) return 'IMMEDIATE'; // Less than 2 seconds
    if (opportunity.age < 5000) return 'HIGH';      // Less than 5 seconds
    if (opportunity.age < 10000) return 'MEDIUM';   // Less than 10 seconds
    return 'LOW';
  }
  
  cleanupOldOpportunities() {
    const now = Date.now();
    const maxAge = this.config.executionWindow;
    
    // Remove expired opportunities
    for (const [key, opportunity] of this.activeOpportunities) {
      if (now - opportunity.timestamp > maxAge) {
        this.activeOpportunities.delete(key);
      }
    }
    
    // Keep only recent history (last 1000 opportunities)
    if (this.opportunityHistory.length > 1000) {
      this.opportunityHistory = this.opportunityHistory.slice(-500);
    }
  }
  
  /**
   * Start regular stats reporting
   */
  startStatsReporting() {
    setInterval(() => {
      const rate = this.metrics.messagesProcessed / ((Date.now() - this.metrics.startTime) / 1000);
      const hitRate = this.metrics.messagesProcessed > 0 ? 
        ((this.metrics.opportunitiesDetected / this.metrics.messagesProcessed) * 100).toFixed(1) : 'NaN';
      
      this.logger.log(`[OPPORTUNITY] 📊 Stats: ${rate.toFixed(1)} msg/s, ${this.metrics.opportunitiesDetected} opportunities (${hitRate}%)`);
    }, 60000); // Every 60 seconds
  }
  
  getStats() {
    return {
      ...this.metrics,
      activeOpportunities: this.activeOpportunities.size,
      recentOpportunities: this.opportunityHistory.slice(-10),
      messagesPerSecond: this.metrics.messagesProcessed / ((Date.now() - this.metrics.startTime) / 1000)
    };
  }
  
  stop() {
    this.isRunning = false;
    this.logger.log('[OPPORTUNITY] 🛑 Real-time opportunity detector stopped');
  }

  /**
   * Handle incoming cluster7 messages and detect opportunities
   */
  handleCluster7Message(data) {
    this.metrics.messagesProcessed++;
    this.updateMessageRate();
    
    // Parse message for trading opportunities
    const opportunities = this.parseMessageForOpportunity(data);
    
    if (opportunities && opportunities.length > 0) {
      console.log(`[OPPORTUNITY] 🎯 Found ${opportunities.length} opportunities in ${data.room} message`);
      
      for (const opportunity of opportunities) {
        this.processOpportunity(opportunity);
      }
    }
  }
  
  /**
   * Update message rate calculation
   */
  updateMessageRate() {
    const now = Date.now();
    const runtime = (now - this.metrics.startTime) / 1000;
    this.metrics.messagesPerSecond = this.metrics.messagesProcessed / runtime;
  }
  
  /**
   * Process a detected opportunity
   */
  processOpportunity(opportunity) {
    // Apply filters
    if (!this.passesFilters(opportunity)) {
      return;
    }
    
    // Rank opportunity
    const confidence = this.calculateConfidence(opportunity);
    opportunity.confidence = confidence;
    
    // Store high-confidence opportunities
    if (confidence >= this.config.minConfidence) {
      this.activeOpportunities.set(opportunity.token, opportunity);
      
      console.log(`[OPPORTUNITY] 🚀 HIGH-CONFIDENCE OPPORTUNITY: ${opportunity.symbol} (${(confidence * 100).toFixed(1)}%)`);
      console.log(`[OPPORTUNITY] 💰 Liquidity: $${opportunity.liquidity?.toFixed(0)} | MC: $${opportunity.marketCap?.toFixed(0)}`);
      
      // Emit opportunity for trading execution
      this.emit('opportunity', opportunity);
    }
  }
}

export const realTimeOpportunityDetector = new RealTimeOpportunityDetector(); 