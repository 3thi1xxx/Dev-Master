#!/usr/bin/env node

/**
 * Birdeye WebSocket Integration
 * Real-time trading opportunity detection using Premium Plus
 */

import WebSocket from 'ws';
import { EventEmitter } from 'node:events';

export class BirdeyeWebSocket extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      apiKey: process.env.BIRDEYE_API_KEY || 'f31ad137262d4a57bbb85e0b35a75208',
      baseUrl: 'wss://public-api.birdeye.so/socket/solana',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000, // 30 seconds
      pongTimeout: 10000   // 10 seconds
    };
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.subscriptions = new Map();
    this.lastPong = Date.now();
    
    console.log('🔌 BIRDEYE WEBSOCKET INTEGRATION INITIALIZED');
    console.log(`🔑 API Key: ${this.config.apiKey ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`🔗 WebSocket: ${this.config.baseUrl}`);
  }
  
  /**
   * Connect to Birdeye WebSocket
   */
  async connect() {
    try {
      const wsUrl = `${this.config.baseUrl}?x-api-key=${this.config.apiKey}`;
      
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'Origin': 'ws://public-api.birdeye.so',
          'Sec-WebSocket-Origin': 'ws://public-api.birdeye.so',
          'Sec-WebSocket-Protocol': 'echo-protocol'
        }
      });
      
      this.ws.on('open', () => {
        console.log('✅ Birdeye WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.resubscribeAll();
        this.emit('connected');
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });
      
      this.ws.on('close', () => {
        console.log('🔌 Birdeye WebSocket disconnected');
        this.isConnected = false;
        this.stopPingInterval();
        this.scheduleReconnect();
        this.emit('disconnected');
      });
      
      this.ws.on('error', (error) => {
        console.log(`❌ Birdeye WebSocket error: ${error.message}`);
        this.emit('error', error);
      });
      
      this.ws.on('pong', () => {
        this.lastPong = Date.now();
        console.log('🏓 Received pong from Birdeye');
      });
      
    } catch (error) {
      console.log(`❌ WebSocket connection failed: ${error.message}`);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Subscribe to large trade transactions
   */
  subscribeLargeTrades(volumeThreshold = 5000) {
    const subscription = {
      type: "SUBSCRIBE_LARGE_TRADE_TXS",
      data: {
        min_volume: volumeThreshold
      }
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set('large_trades', subscription);
    
    console.log(`🐋 Subscribed to large trades >$${volumeThreshold}`);
  }
  
  /**
   * Subscribe to new pairs
   */
  subscribeNewPairs() {
    const subscription = {
      type: "SUBSCRIBE_NEW_PAIR"
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set('new_pairs', subscription);
    
    console.log('🚀 Subscribed to new pairs');
  }
  
  /**
   * Subscribe to new token listings
   */
  subscribeNewListings() {
    const subscription = {
      type: "SUBSCRIBE_TOKEN_NEW_LISTING"
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set('new_listings', subscription);
    
    console.log('📈 Subscribed to new token listings');
  }
  
  /**
   * Subscribe to price data for specific token
   */
  subscribePrice(tokenAddress, chartType = "1m") {
    const subscription = {
      type: "SUBSCRIBE_PRICE",
      data: {
        chartType: chartType,
        currency: "pair",
        address: tokenAddress
      }
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set(`price_${tokenAddress}`, subscription);
    
    console.log(`📊 Subscribed to price data for ${tokenAddress} (${chartType})`);
  }
  
  /**
   * Subscribe to wallet transactions
   */
  subscribeWalletTransactions(walletAddress) {
    const subscription = {
      type: "SUBSCRIBE_WALLET_TXS",
      data: {
        address: walletAddress
      }
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set(`wallet_${walletAddress}`, subscription);
    
    console.log(`👛 Subscribed to wallet transactions: ${walletAddress}`);
  }
  
  /**
   * Subscribe to token statistics
   */
  subscribeTokenStats(tokenAddress) {
    const subscription = {
      type: "SUBSCRIBE_TOKEN_STATS",
      data: {
        address: tokenAddress
      }
    };
    
    this.sendSubscription(subscription);
    this.subscriptions.set(`stats_${tokenAddress}`, subscription);
    
    console.log(`📈 Subscribed to token stats: ${tokenAddress}`);
  }
  
  /**
   * Send subscription message
   */
  sendSubscription(subscription) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(subscription));
    } else {
      console.log('⚠️ WebSocket not connected, queuing subscription');
      // Queue for when connection is established
    }
  }
  
  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Emit specific events based on message type
      if (message.type === 'LARGE_TRADE_TXS') {
        this.emit('largeTrade', message.data);
        this.analyzeLargeTrade(message.data);
      } else if (message.type === 'NEW_PAIR') {
        this.emit('newPair', message.data);
        this.analyzeNewPair(message.data);
      } else if (message.type === 'TOKEN_NEW_LISTING') {
        this.emit('newListing', message.data);
        this.analyzeNewListing(message.data);
      } else if (message.type === 'PRICE_DATA') {
        this.emit('priceUpdate', message.data);
        this.analyzePriceUpdate(message.data);
      } else if (message.type === 'WALLET_TXS') {
        this.emit('walletTransaction', message.data);
        this.analyzeWalletTransaction(message.data);
      } else if (message.type === 'TOKEN_STATS_DATA') {
        this.emit('tokenStats', message.data);
        this.analyzeTokenStats(message.data);
      }
      
      // Emit raw message for debugging
      this.emit('message', message);
      
    } catch (error) {
      console.log(`❌ Error parsing message: ${error.message}`);
    }
  }
  
  /**
   * Analyze large trade for opportunity
   */
  analyzeLargeTrade(data) {
    const { tokenAddress, volume, price, action } = data;
    
    // Whale buy detection
    if (action === 'buy' && volume > 5000) {
      console.log(`🐋 WHALE BUY DETECTED: ${tokenAddress}`);
      console.log(`   Volume: $${volume.toFixed(2)}`);
      console.log(`   Price: $${price.toFixed(6)}`);
      
      this.emit('whaleBuyOpportunity', {
        tokenAddress,
        volume,
        price,
        timestamp: Date.now(),
        confidence: this.calculateWhaleConfidence(volume, price)
      });
    }
  }
  
  /**
   * Analyze new pair for opportunity
   */
  analyzeNewPair(data) {
    const { tokenAddress, tokenName, tokenSymbol, liquidity } = data;
    
    console.log(`🚀 NEW PAIR DETECTED: ${tokenSymbol} (${tokenName})`);
    console.log(`   Address: ${tokenAddress}`);
    console.log(`   Liquidity: $${liquidity.toFixed(2)}`);
    
    // Check if it's a good opportunity
    if (liquidity > 10000) { // $10k+ liquidity
      this.emit('newPairOpportunity', {
        tokenAddress,
        tokenName,
        tokenSymbol,
        liquidity,
        timestamp: Date.now(),
        confidence: this.calculateNewPairConfidence(liquidity)
      });
    }
  }
  
  /**
   * Analyze new listing for opportunity
   */
  analyzeNewListing(data) {
    const { tokenAddress, tokenName, tokenSymbol } = data;
    
    console.log(`📈 NEW LISTING DETECTED: ${tokenSymbol} (${tokenName})`);
    console.log(`   Address: ${tokenAddress}`);
    
    this.emit('newListingOpportunity', {
      tokenAddress,
      tokenName,
      tokenSymbol,
      timestamp: Date.now(),
      confidence: 0.7 // High confidence for new listings
    });
  }
  
  /**
   * Analyze price update for opportunity
   */
  analyzePriceUpdate(data) {
    const { tokenAddress, price, change24h, volume24h } = data;
    
    // Momentum detection
    if (change24h > 20 && volume24h > 50000) {
      console.log(`📈 MOMENTUM DETECTED: ${tokenAddress}`);
      console.log(`   24h Change: ${change24h.toFixed(2)}%`);
      console.log(`   24h Volume: $${volume24h.toFixed(2)}`);
      
      this.emit('momentumOpportunity', {
        tokenAddress,
        price,
        change24h,
        volume24h,
        timestamp: Date.now(),
        confidence: this.calculateMomentumConfidence(change24h, volume24h)
      });
    }
  }
  
  /**
   * Analyze wallet transaction for opportunity
   */
  analyzeWalletTransaction(data) {
    const { walletAddress, tokenAddress, action, volume, price } = data;
    
    // Whale copy trading
    if (volume > 1000) { // $1k+ transaction
      console.log(`👛 WHALE TRANSACTION: ${walletAddress}`);
      console.log(`   Action: ${action}`);
      console.log(`   Volume: $${volume.toFixed(2)}`);
      console.log(`   Token: ${tokenAddress}`);
      
      this.emit('whaleTransactionOpportunity', {
        walletAddress,
        tokenAddress,
        action,
        volume,
        price,
        timestamp: Date.now(),
        confidence: this.calculateWhaleTransactionConfidence(volume, action)
      });
    }
  }
  
  /**
   * Analyze token stats for opportunity
   */
  analyzeTokenStats(data) {
    const { tokenAddress, marketCap, volume24h, holders } = data;
    
    // Security and momentum analysis
    const securityScore = this.calculateSecurityScore(data);
    const momentumScore = this.calculateMomentumScore(data);
    
    if (securityScore > 70 && momentumScore > 60) {
      console.log(`🛡️ SECURE MOMENTUM: ${tokenAddress}`);
      console.log(`   Security Score: ${securityScore.toFixed(1)}/100`);
      console.log(`   Momentum Score: ${momentumScore.toFixed(1)}/100`);
      
      this.emit('secureMomentumOpportunity', {
        tokenAddress,
        securityScore,
        momentumScore,
        marketCap,
        volume24h,
        holders,
        timestamp: Date.now(),
        confidence: (securityScore + momentumScore) / 200
      });
    }
  }
  
  /**
   * Calculate confidence scores
   */
  calculateWhaleConfidence(volume, price) {
    // Higher volume = higher confidence
    return Math.min(0.95, volume / 10000);
  }
  
  calculateNewPairConfidence(liquidity) {
    // Higher liquidity = higher confidence
    return Math.min(0.9, liquidity / 50000);
  }
  
  calculateMomentumConfidence(change24h, volume24h) {
    // Higher change and volume = higher confidence
    const changeScore = Math.min(1, change24h / 50);
    const volumeScore = Math.min(1, volume24h / 100000);
    return (changeScore + volumeScore) / 2;
  }
  
  calculateWhaleTransactionConfidence(volume, action) {
    // Buy actions are more confident than sells
    const volumeScore = Math.min(1, volume / 5000);
    const actionScore = action === 'buy' ? 1 : 0.5;
    return volumeScore * actionScore;
  }
  
  calculateSecurityScore(data) {
    // Implement security scoring logic
    let score = 50;
    
    if (data.holders > 1000) score += 20;
    if (data.liquidity > 50000) score += 15;
    if (data.marketCap > 100000) score += 15;
    
    return Math.min(100, score);
  }
  
  calculateMomentumScore(data) {
    // Implement momentum scoring logic
    let score = 50;
    
    if (data.change24h > 20) score += 25;
    if (data.volume24h > 50000) score += 25;
    
    return Math.min(100, score);
  }
  
  /**
   * Start ping interval
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.ping();
        console.log('🏓 Sending ping to Birdeye');
      }
    }, this.config.pingInterval);
  }
  
  /**
   * Stop ping interval
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Resubscribe to all active subscriptions
   */
  resubscribeAll() {
    console.log('🔄 Resubscribing to all active subscriptions...');
    for (const [key, subscription] of this.subscriptions) {
      this.sendSubscription(subscription);
    }
  }
  
  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.config.reconnectInterval);
    } else {
      console.log('❌ Max reconnection attempts reached');
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.stopPingInterval();
  }
}

export const birdeyeWebSocket = new BirdeyeWebSocket(); 