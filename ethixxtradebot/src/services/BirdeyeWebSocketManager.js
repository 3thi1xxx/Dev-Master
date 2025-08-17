#!/usr/bin/env node
/**
 * Birdeye WebSocket Manager - Real-time token tracking for up to 500 tokens
 * Leverages our Premium Plus subscription for maximum efficiency
 */

import WebSocket from 'ws';
import { EventEmitter } from 'node:events';

export class BirdeyeWebSocketManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      wsUrl: `wss://public-api.birdeye.so/socket/solana?x-api-key=${process.env.BIRDEYE_API_KEY || ''}`,
      apiKey: process.env.BIRDEYE_API_KEY || '',
      maxConnections: 500, // Premium Plus limit (Business package)
      reconnectDelay: 5000,
      pingInterval: 30000,
      chain: 'solana',
      ...options
    };
    
    // Connection management
    this.connections = new Map(); // tokenAddress -> WebSocket
    this.subscriptions = new Map(); // tokenAddress -> subscription data
    this.connectionPool = []; // Pre-warmed connections ready to use
    
    // Tracking metrics
    this.stats = {
      activeConnections: 0,
      totalTokensTracked: 0,
      messagesReceived: 0,
      opportunities: 0,
      lastOpportunity: null
    };
    
    // Opportunity detection thresholds
    this.thresholds = {
      volumeSpike: 3.0,        // 3x average volume
      priceChangeMin: 0.05,    // 5% price change
      buyPressure: 1.5,        // 1.5:1 buy/sell ratio
      holderGrowth: 0.1,       // 10% holder growth in 5 min
      liquidityIncrease: 0.2   // 20% liquidity increase
    };
    
    console.log('🐦 BIRDEYE WEBSOCKET MANAGER INITIALIZED');
    console.log(`📡 Max concurrent connections: ${this.config.maxConnections}`);
    console.log('🚀 Real-time token tracking ready!');
    
    this.initialize();
  }
  
  async initialize() {
    // Pre-warm connection pool for instant token tracking
    console.log('🔄 Pre-warming connection pool...');
    for (let i = 0; i < 10; i++) {
      const ws = await this.createConnection();
      if (ws) {
        this.connectionPool.push(ws);
      }
    }
    console.log(`✅ ${this.connectionPool.length} connections ready in pool`);
  }
  
  async createConnection(tokenAddress = null) {
    try {
      const ws = new WebSocket(this.config.wsUrl, 'echo-protocol', {
        headers: {
          'Origin': 'ws://public-api.birdeye.so',
          'Sec-WebSocket-Origin': 'ws://public-api.birdeye.so',
          'Sec-WebSocket-Protocol': 'echo-protocol'
        }
      });
      
      ws.on('open', () => {
        console.log(`[BIRDEYE-WS] ✅ Connection opened${tokenAddress ? ` for ${tokenAddress}` : ''}`);
        this.stats.activeConnections++;
        
        // No separate auth needed - API key is in URL
        
        // Setup ping to keep connection alive
        ws.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        }, this.config.pingInterval);
      });
      
      ws.on('message', (data) => {
        this.handleMessage(data, tokenAddress);
      });
      
      ws.on('error', (error) => {
        console.error(`[BIRDEYE-WS] ❌ Error${tokenAddress ? ` for ${tokenAddress}` : ''}:`, error.message);
      });
      
      ws.on('close', () => {
        console.log(`[BIRDEYE-WS] 🔌 Connection closed${tokenAddress ? ` for ${tokenAddress}` : ''}`);
        this.stats.activeConnections--;
        if (ws.pingInterval) clearInterval(ws.pingInterval);
        
        // Auto-reconnect for tracked tokens
        if (tokenAddress && this.subscriptions.has(tokenAddress)) {
          setTimeout(() => this.trackToken(tokenAddress), this.config.reconnectDelay);
        }
      });
      
      return ws;
    } catch (error) {
      console.error('[BIRDEYE-WS] Failed to create connection:', error);
      return null;
    }
  }
  
  handleMessage(data, tokenAddress) {
    try {
      const message = JSON.parse(data.toString());
      this.stats.messagesReceived++;
      
      // Enhanced message type detection
      const messageType = message.type || message.event || 'UNKNOWN';
      
      switch (messageType) {
        case 'price_update':
        case 'PRICE_DATA':
          this.handlePriceUpdate(message, tokenAddress);
          break;
          
        case 'volume_update':
        case 'VOLUME_DATA':
          this.handleVolumeUpdate(message, tokenAddress);
          break;
          
        case 'holder_update':
        case 'HOLDER_DATA':
          this.handleHolderUpdate(message, tokenAddress);
          break;
          
        case 'liquidity_update':
        case 'LIQUIDITY_DATA':
          this.handleLiquidityUpdate(message, tokenAddress);
          break;
          
        case 'trade':
        case 'TXS_DATA':
        case 'transaction':
          this.handleTrade(message, tokenAddress);
          break;
          
        case 'LARGE_TXS_DATA':
        case 'large_trade':
          this.handleLargeTrade(message, tokenAddress);
          break;
          
        case 'NEW_PAIR':
        case 'NEW_PAIR_DATA':
          this.handleNewPair(message, tokenAddress);
          break;
          
        case 'auth_success':
          console.log('[BIRDEYE-WS] ✅ Authenticated successfully');
          break;
          
        case 'pong':
          // Connection health check
          break;
          
        default:
          // Try to extract useful information from unknown messages
          this.extractUsefulData(message, tokenAddress);
      }
    } catch (error) {
      console.error('[BIRDEYE-WS] Error parsing message:', error);
    }
  }
  
  handlePriceUpdate(data, tokenAddress) {
    const sub = this.subscriptions.get(tokenAddress);
    if (!sub) return;
    
    const priceChange = (data.price - sub.lastPrice) / sub.lastPrice;
    sub.lastPrice = data.price;
    sub.priceHistory.push({ price: data.price, timestamp: Date.now() });
    
    // Keep only last 100 price points
    if (sub.priceHistory.length > 100) {
      sub.priceHistory.shift();
    }
    
    // Check for opportunity
    if (Math.abs(priceChange) >= this.thresholds.priceChangeMin) {
      this.detectOpportunity(tokenAddress, 'price_movement', {
        change: priceChange,
        price: data.price,
        direction: priceChange > 0 ? 'up' : 'down'
      });
    }
    
    this.emit('price_update', { tokenAddress, ...data, priceChange });
  }
  
  handleVolumeUpdate(data, tokenAddress) {
    const sub = this.subscriptions.get(tokenAddress);
    if (!sub) return;
    
    const volumeRatio = data.volume / (sub.avgVolume || data.volume);
    sub.volumeHistory.push({ volume: data.volume, timestamp: Date.now() });
    
    // Calculate rolling average
    if (sub.volumeHistory.length > 10) {
      sub.volumeHistory.shift();
      sub.avgVolume = sub.volumeHistory.reduce((sum, v) => sum + v.volume, 0) / sub.volumeHistory.length;
    }
    
    // Check for volume spike
    if (volumeRatio >= this.thresholds.volumeSpike) {
      this.detectOpportunity(tokenAddress, 'volume_spike', {
        ratio: volumeRatio,
        volume: data.volume,
        average: sub.avgVolume
      });
    }
    
    this.emit('volume_update', { tokenAddress, ...data, volumeRatio });
  }
  
  handleHolderUpdate(data, tokenAddress) {
    const sub = this.subscriptions.get(tokenAddress);
    if (!sub) return;
    
    const holderGrowth = sub.initialHolders ? 
      (data.holders - sub.initialHolders) / sub.initialHolders : 0;
    
    if (!sub.initialHolders) {
      sub.initialHolders = data.holders;
      sub.holderStartTime = Date.now();
    }
    
    // Check holder growth rate
    const timeDiff = (Date.now() - sub.holderStartTime) / 300000; // 5 minute periods
    if (timeDiff >= 1 && holderGrowth >= this.thresholds.holderGrowth) {
      this.detectOpportunity(tokenAddress, 'holder_growth', {
        growth: holderGrowth,
        holders: data.holders,
        initial: sub.initialHolders
      });
    }
    
    this.emit('holder_update', { tokenAddress, ...data, holderGrowth });
  }
  
  handleLiquidityUpdate(data, tokenAddress) {
    const sub = this.subscriptions.get(tokenAddress);
    if (!sub) return;
    
    const liquidityChange = sub.initialLiquidity ? 
      (data.liquidity - sub.initialLiquidity) / sub.initialLiquidity : 0;
    
    if (!sub.initialLiquidity) {
      sub.initialLiquidity = data.liquidity;
    }
    
    // Check for significant liquidity increase
    if (liquidityChange >= this.thresholds.liquidityIncrease) {
      this.detectOpportunity(tokenAddress, 'liquidity_increase', {
        change: liquidityChange,
        liquidity: data.liquidity,
        initial: sub.initialLiquidity
      });
    }
    
    this.emit('liquidity_update', { tokenAddress, ...data, liquidityChange });
  }
  
  handleTrade(data, tokenAddress) {
    const sub = this.subscriptions.get(tokenAddress);
    if (!sub) return;
    
    // Enhanced transaction parsing
    const side = data.side || data.type || 'unknown';
    const amount = parseFloat(data.amount || data.value || data.volume || 0);
    const price = parseFloat(data.price || 0);
    const owner = data.owner || data.trader || 'Unknown';
    
    // Only process meaningful transactions
    if (amount > 0) {
      // Track buy/sell pressure
      if (side.toLowerCase() === 'buy') {
        sub.buyVolume += amount;
      } else if (side.toLowerCase() === 'sell') {
        sub.sellVolume += amount;
      }
      
      // Calculate buy pressure over last 100 trades
      const tradeData = { ...data, side, amount, price, owner };
      sub.trades.push(tradeData);
      if (sub.trades.length > 100) {
        const removed = sub.trades.shift();
        if (removed.side === 'buy') {
          sub.buyVolume -= removed.amount;
        } else {
          sub.sellVolume -= removed.amount;
        }
      }
      
      const buyPressure = sub.buyVolume / (sub.sellVolume || 1);
      
      // Check for strong buy pressure
      if (buyPressure >= this.thresholds.buyPressure && sub.trades.length >= 20) {
        this.detectOpportunity(tokenAddress, 'buy_pressure', {
          ratio: buyPressure,
          buyVolume: sub.buyVolume,
          sellVolume: sub.sellVolume
        });
      }
      
      this.emit('trade', { tokenAddress, ...tradeData, buyPressure });
    }
  }
  
  detectOpportunity(tokenAddress, type, data) {
    const opportunity = {
      tokenAddress,
      type,
      data,
      timestamp: Date.now(),
      score: this.calculateOpportunityScore(type, data)
    };
    
    this.stats.opportunities++;
    this.stats.lastOpportunity = opportunity;
    
    console.log(`[BIRDEYE-WS] 🎯 OPPORTUNITY DETECTED!`);
    console.log(`  Token: ${tokenAddress}`);
    console.log(`  Type: ${type}`);
    console.log(`  Score: ${opportunity.score}/100`);
    
    this.emit('opportunity', opportunity);
  }
  
  calculateOpportunityScore(type, data) {
    let score = 50; // Base score
    
    switch (type) {
      case 'price_movement':
        score += Math.min(Math.abs(data.change) * 100, 30);
        break;
        
      case 'volume_spike':
        score += Math.min((data.ratio - 1) * 20, 40);
        break;
        
      case 'holder_growth':
        score += Math.min(data.growth * 100, 30);
        break;
        
      case 'liquidity_increase':
        score += Math.min(data.change * 50, 30);
        break;
        
      case 'buy_pressure':
        score += Math.min((data.ratio - 1) * 40, 35);
        break;
    }
    
    return Math.min(Math.round(score), 100);
  }
  
  async trackToken(tokenAddress, metadata = {}) {
    // Check if already tracking
    if (this.connections.has(tokenAddress)) {
      console.log(`[BIRDEYE-WS] Already tracking ${tokenAddress}`);
      return true;
    }
    
    // Check connection limit
    if (this.stats.activeConnections >= this.config.maxConnections) {
      console.warn(`[BIRDEYE-WS] ⚠️ Connection limit reached (${this.config.maxConnections})`);
      return false;
    }
    
    try {
      // Use pooled connection or create new one
      let ws = this.connectionPool.pop() || await this.createConnection(tokenAddress);
      if (!ws) return false;
      
      // Store connection
      this.connections.set(tokenAddress, ws);
      
      // Initialize subscription data
      this.subscriptions.set(tokenAddress, {
        metadata,
        startTime: Date.now(),
        lastPrice: 0,
        priceHistory: [],
        volumeHistory: [],
        avgVolume: 0,
        trades: [],
        buyVolume: 0,
        sellVolume: 0,
        initialHolders: null,
        holderStartTime: null,
        initialLiquidity: null
      });
      
      // Subscribe to price updates (OHLCV)
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE_PRICE',
        data: {
          chartType: '1m',
          currency: 'token',
          address: tokenAddress
        }
      }));
      
      // Subscribe to transactions
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE_TXS',
        data: {
          currency: 'token',
          address: tokenAddress
        }
      }));
      
      this.stats.totalTokensTracked++;
      console.log(`[BIRDEYE-WS] 📊 Now tracking: ${tokenAddress} (${this.stats.activeConnections}/${this.config.maxConnections})`);
      
      return true;
    } catch (error) {
      console.error(`[BIRDEYE-WS] Failed to track ${tokenAddress}:`, error);
      return false;
    }
  }
  
  async untrackToken(tokenAddress) {
    const ws = this.connections.get(tokenAddress);
    if (!ws) return;
    
    try {
      // Unsubscribe
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'UNSUBSCRIBE_PRICE'
        }));
        ws.send(JSON.stringify({
          type: 'UNSUBSCRIBE_TXS'
        }));
        
        // Return to pool if healthy
        if (this.connectionPool.length < 10) {
          this.connectionPool.push(ws);
        } else {
          ws.close();
        }
      }
      
      // Clean up
      this.connections.delete(tokenAddress);
      this.subscriptions.delete(tokenAddress);
      
      console.log(`[BIRDEYE-WS] 🛑 Stopped tracking: ${tokenAddress}`);
    } catch (error) {
      console.error(`[BIRDEYE-WS] Error untracking ${tokenAddress}:`, error);
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      trackedTokens: Array.from(this.subscriptions.keys()),
      poolSize: this.connectionPool.length
    };
  }
  
  handleLargeTrade(message, tokenAddress) {
    const data = message.data || message;
    const amount = parseFloat(data.amount || data.value || data.volume || 0);
    const side = data.side || data.type || 'unknown';
    const owner = data.owner || data.trader || 'Unknown';
    
    if (amount > 0) {
      console.log(`[BIRDEYE-WS] 🐋 Large trade detected: $${this.formatNumber(amount)} ${side.toUpperCase()}`);
      this.emit('large_trade', { tokenAddress, ...data, owner });
    }
  }
  
  handleNewPair(message, tokenAddress) {
    const data = message.data || message;
    console.log(`[BIRDEYE-WS] 🆕 New pair: ${data.symbol || data.name || 'Unknown'}`);
    this.emit('new_pair', { tokenAddress, ...data });
  }
  
  extractUsefulData(message, tokenAddress) {
    // Try to extract any useful information from unknown message types
    const data = message.data || message;
    
    // Look for common fields
    const usefulFields = {};
    
    if (data.symbol || data.name) usefulFields.symbol = data.symbol || data.name;
    if (data.address) usefulFields.address = data.address;
    if (data.price || data.value) usefulFields.price = data.price || data.value;
    if (data.volume || data.amount) usefulFields.volume = data.volume || data.amount;
    if (data.side || data.type) usefulFields.side = data.side || data.type;
    if (data.owner || data.trader) usefulFields.trader = data.owner || data.trader;
    
    if (Object.keys(usefulFields).length > 0) {
      console.log(`[BIRDEYE-WS] 📦 Unknown message type: ${message.type}`);
      console.log(`[BIRDEYE-WS]   Extracted data:`, usefulFields);
    }
    
    // Emit raw message for other handlers
    this.emit('message', { tokenAddress, data: message });
  }
  
  formatNumber(num, decimals = 2) {
    if (num === 0) return '0';
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(decimals);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
  }
  
  async shutdown() {
    console.log('[BIRDEYE-WS] 🛑 Shutting down...');
    
    // Close all connections
    for (const [tokenAddress, ws] of this.connections) {
      await this.untrackToken(tokenAddress);
    }
    
    // Close pooled connections
    for (const ws of this.connectionPool) {
      ws.close();
    }
    
    this.removeAllListeners();
    console.log('[BIRDEYE-WS] ✅ Shutdown complete');
  }
}

// Singleton instance
export const birdeyeWebSocketManager = new BirdeyeWebSocketManager(); 