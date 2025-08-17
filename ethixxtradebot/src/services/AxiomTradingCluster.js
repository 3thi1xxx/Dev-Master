import WebSocket from 'ws';
import { EventEmitter } from 'node:events';

export class AxiomTradingCluster extends EventEmitter {
  constructor(options = {}) {
    super();
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.pingInterval = null;
    this.subscriptions = new Set();
    this.logger = console;
    
    // Real-time trading cluster (discovered from DevTools)
    this.wsUrl = 'wss://cluster7.axiom.trade/';
    
    this.stats = {
      messagesReceived: 0,
      blockHashes: 0,
      priorityFeeUpdates: 0,
      tokenPriceUpdates: 0,
      jitoBribeFees: 0,
      twitterFeeds: 0,
      startTime: Date.now(),
      latency: 0,
      currentPriorityFee: 0,
      currentJitoBribe: 0,
      lastBlockHash: null
    };

    // Auto-subscribe to critical feeds
    this.autoSubscriptions = [
      'block_hash',
      'sol-priority-fee', 
      'jito-bribe-fee',
      'connection_monitor',
      'twitter_feed_v2'
    ];
  }

  async connect() {
    if (this.connected) return;

    this.logger.log('[CLUSTER] 🔌 Connecting to Axiom Trading Cluster...');
    this.logger.log(`[CLUSTER] 🌐 Endpoint: ${this.wsUrl}`);

    try {
      this.ws = new WebSocket(this.wsUrl, {
        headers: {
          'Origin': 'https://axiom.trade',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      this.ws.on('open', () => this.onOpen());
      this.ws.on('message', (data) => this.onMessage(data));
      this.ws.on('close', (code, reason) => this.onClose(code, reason));
      this.ws.on('error', (error) => this.onError(error));

    } catch (error) {
      this.logger.error(`[CLUSTER] ❌ Connection failed: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  onOpen() {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.stats.startTime = Date.now();
    this.logger.log('[CLUSTER] ✅ Connected to trading cluster!');
    this.logger.log('[CLUSTER] 📡 Starting real-time market monitoring...');
    
    this.emit('connected');
  }

  onMessage(data) {
    this.stats.messagesReceived++;
    
    try {
      const message = JSON.parse(data.toString());
      
      if (message.method === 'ping') {
        this.handlePing();
        return;
      }

      if (message.room && message.content !== undefined) {
        this.handleRoomMessage(message);
      }

    } catch (error) {
      this.logger.error(`[CLUSTER] 📨 Failed to parse message: ${error.message}`);
    }
  }

  handlePing() {
    // Keep connection alive
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.pong();
    }
  }

  handleRoomMessage(message) {
    const { room, content } = message;

    switch (room) {
      case 'block_hash':
        this.handleBlockHash(content);
        break;
        
      case 'sol-priority-fee':
        this.handlePriorityFee(content);
        break;
        
      case 'jito-bribe-fee':
        this.handleJitoBribe(content);
        break;
        
      case 'connection_monitor':
        this.handleConnectionMonitor(content);
        break;
        
      case 'twitter_feed_v2':
        this.handleTwitterFeed(content);
        break;
        
      default:
        // Handle token-specific rooms (b-{TOKEN_ADDRESS})
        if (room.startsWith('b-')) {
          this.handleTokenPrice(room, content);
        }
    }

    // Emit raw message for external processing
    this.emit('message', { room, content });
  }

  handleBlockHash(blockHash) {
    this.stats.blockHashes++;
    this.stats.lastBlockHash = blockHash;
    
    this.logger.log(`[CLUSTER] 🧱 New block: ${blockHash.slice(0, 12)}...`);
    
    this.emit('block-hash', {
      hash: blockHash,
      timestamp: Date.now(),
      sequence: this.stats.blockHashes
    });
  }

  handlePriorityFee(fee) {
    this.stats.priorityFeeUpdates++;
    this.stats.currentPriorityFee = parseFloat(fee);
    
    const feeUsd = (this.stats.currentPriorityFee * 250).toFixed(2);
    this.logger.log(`[CLUSTER] 💰 Priority fee: ${this.stats.currentPriorityFee.toFixed(6)} SOL (~$${feeUsd})`);
    
    this.emit('priority-fee', {
      fee: this.stats.currentPriorityFee,
      feeUsd: parseFloat(feeUsd),
      timestamp: Date.now()
    });
  }

  handleJitoBribe(bribe) {
    this.stats.jitoBribeFees++;
    this.stats.currentJitoBribe = parseFloat(bribe);
    
    const bribeUsd = (this.stats.currentJitoBribe * 250).toFixed(2);
    this.logger.log(`[CLUSTER] 🎯 Jito bribe: ${this.stats.currentJitoBribe.toFixed(6)} SOL (~$${bribeUsd})`);
    
    this.emit('jito-bribe', {
      bribe: this.stats.currentJitoBribe,
      bribeUsd: parseFloat(bribeUsd),
      timestamp: Date.now()
    });
  }

  handleTokenPrice(room, price) {
    this.stats.tokenPriceUpdates++;
    const tokenAddress = room.replace('b-', '');
    const tokenPrice = parseFloat(price);
    
    this.logger.log(`[CLUSTER] 📊 Token ${tokenAddress.slice(0, 8)}... price: ${tokenPrice.toExponential(4)}`);
    
    this.emit('token-price', {
      tokenAddress,
      price: tokenPrice,
      room,
      timestamp: Date.now()
    });
  }

  handleConnectionMonitor(timestamp) {
    const serverTime = parseInt(timestamp);
    const latency = Date.now() - serverTime;
    this.stats.latency = latency;
    
    this.emit('connection-monitor', {
      serverTime,
      clientTime: Date.now(),
      latency
    });
  }

  handleTwitterFeed(tweetData) {
    this.stats.twitterFeeds++;
    
    if (tweetData && tweetData.handle) {
      this.logger.log(`[CLUSTER] 🐦 Tweet from @${tweetData.handle}`);
      
      this.emit('twitter-feed', {
        ...tweetData,
        timestamp: Date.now()
      });
    }
  }

  // Subscribe to token-specific price feeds
  subscribeToToken(tokenAddress) {
    const room = `b-${tokenAddress}`;
    this.subscriptions.add(room);
    this.logger.log(`[CLUSTER] ➕ Subscribed to token: ${tokenAddress.slice(0, 8)}...`);
    
    this.emit('subscription-added', { room, tokenAddress });
  }

  unsubscribeFromToken(tokenAddress) {
    const room = `b-${tokenAddress}`;
    this.subscriptions.delete(room);
    this.logger.log(`[CLUSTER] ➖ Unsubscribed from token: ${tokenAddress.slice(0, 8)}...`);
    
    this.emit('subscription-removed', { room, tokenAddress });
  }

  // Get current market conditions for trading optimization
  getMarketConditions() {
    return {
      priorityFee: this.stats.currentPriorityFee,
      priorityFeeUsd: (this.stats.currentPriorityFee * 250),
      jitoBribe: this.stats.currentJitoBribe,
      jitoBribeUsd: (this.stats.currentJitoBribe * 250),
      lastBlockHash: this.stats.lastBlockHash,
      latency: this.stats.latency,
      timestamp: Date.now(),
      
      // Trading recommendations
      recommendations: {
        usePriorityFee: this.stats.currentPriorityFee > 0.001, // Use if > $0.25
        useJitoBribe: this.stats.currentJitoBribe < 0.05, // Use if < $12.50
        fastExecution: this.stats.latency < 100, // Good conditions
        marketActivity: this.stats.blockHashes > 10 // Active market
      }
    };
  }

  onClose(code, reason) {
    this.connected = false;
    this.logger.log(`[CLUSTER] 🔌 Connection closed: ${code} - ${reason}`);
    
    this.emit('disconnected', { code, reason });
    
    // Auto-reconnect unless explicitly closed
    if (code !== 1000) {
      this.scheduleReconnect();
    }
  }

  onError(error) {
    this.logger.error(`[CLUSTER] ❌ WebSocket error: ${error.message}`);
    this.emit('error', error);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[CLUSTER] 💀 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Gentle backoff
    
    this.logger.log(`[CLUSTER] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      connected: this.connected,
      uptime,
      uptimeFormatted: `${Math.floor(uptime / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`,
      subscriptions: this.subscriptions.size,
      messagesPerMinute: Math.round((this.stats.messagesReceived / (uptime / 60000)) || 0)
    };
  }

  disconnect() {
    this.logger.log('[CLUSTER] 🛑 Disconnecting from trading cluster...');
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connected = false;
  }
}

export default AxiomTradingCluster; 