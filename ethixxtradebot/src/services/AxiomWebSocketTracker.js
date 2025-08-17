import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { axiom } from '../src/connectors/axiom/index.js';
import { sharedWebSocketManager } from './SharedWebSocketManager.js';

export class AxiomWebSocketTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    // Remove manual WebSocket management - using SharedWebSocketManager now
    this.sharedConnection = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.maxReconnectDelay = 60000;
    this.pingInterval = null;
    this.lastPingTime = 0;
    this.authenticated = false;
    this.stats = {
      messagesReceived: 0,
      whaleSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      startTime: Date.now(),
      latency: 0
    };
    this.trackedWallets = new Set();
    this.logger = console;
    
    // Using SharedWebSocketManager for eucalyptus connection
    this.wsUrl = 'wss://eucalyptus.axiom.trade/ws';
    
    this.loadTrackedWallets();
    
    // Set up SharedWebSocketManager event listeners
    this.setupSharedWebSocketListeners();
  }

  setupSharedWebSocketListeners() {
    // Listen for messages from our URL
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('eucalyptus')) {
        this.onMessage(JSON.stringify(data));
      }
    });

    // Listen for connection events
    sharedWebSocketManager.on('connection-open', ({ url }) => {
      if (url.includes('eucalyptus')) {
        this.onOpen();
      }
    });

    sharedWebSocketManager.on('connection-close', ({ url }) => {
      if (url.includes('eucalyptus')) {
        this.onClose();
      }
    });

    sharedWebSocketManager.on('connection-error', ({ url, error }) => {
      if (url.includes('eucalyptus')) {
        this.onError(error);
      }
    });
  }

  loadTrackedWallets() {
    try {
      const config = JSON.parse(readFileSync('config/tracked-wallets.json', 'utf8'));
      config.wallets.forEach(wallet => {
        this.trackedWallets.add(wallet.address);
      });
      this.logger.log(`[WS] 📋 Loaded ${this.trackedWallets.size} tracked wallets`);
    } catch (error) {
      this.logger.log('[WS] ⚠️ Could not load tracked wallets config');
    }
  }

  async connect() {
    if (this.connected) return;

    this.logger.log('[WS] 🔌 Connecting via SharedWebSocketManager...');
    this.logger.log(`[WS] 🌐 Endpoint: ${this.wsUrl}`);

    try {
      // Use SharedWebSocketManager for persistent browser-level connections
      this.sharedConnection = await sharedWebSocketManager.getSharedConnection(
        this.wsUrl,
        {
          share: true, // Enable browser-pattern sharing
          disableJson: false,
          reconnectAttempts: this.maxReconnectAttempts,
          reconnectInterval: this.reconnectDelay
        }
      );

      this.logger.log('[WS] ✅ SharedWebSocket connection established!');
      this.logger.log('[WS] 🌐 Using browser-pattern persistent connection');

    } catch (error) {
      this.logger.error(`[WS] ❌ SharedWebSocket connection failed: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  async ensureAuthentication() {
    try {
      this.logger.log('[WS] 🔐 Ensuring authentication...');
      
      // Check if we have tokens
      const hasTokens = process.env.AXIOM_ACCESS_TOKEN && process.env.AXIOM_REFRESH_TOKEN;
      
      if (hasTokens) {
        this.logger.log('[WS] ✅ JWT tokens available');
        this.authenticated = true;
        return;
      }

      // Try to authenticate via Axiom connector
      if (process.env.AXIOM_ENABLE === 'true' && process.env.AXIOM_DEV_SIGN === 'true') {
        this.logger.log('[WS] 🔑 Attempting wallet-nonce authentication...');
        
        await axiom.init();
        
        if (process.env.SOLANA_PUBKEY && process.env.SOLANA_SECRET_KEY_B58) {
          const nonceResult = await axiom.getWalletNonce(process.env.SOLANA_PUBKEY);
          
          if (nonceResult.ok) {
            const { devSign } = await import('../src/connectors/axiom/index.js');
            const signature = await devSign(nonceResult.nonce);
            const verifyResult = await axiom.verifySignature(process.env.SOLANA_PUBKEY, signature, nonceResult.nonce);
            
            if (verifyResult.ok) {
              this.logger.log('[WS] ✅ Wallet authentication successful');
              this.authenticated = true;
              return;
            }
          }
        }
      }

      this.logger.log('[WS] ⚠️ No authentication available - attempting anonymous connection');
      this.authenticated = false;
      
    } catch (error) {
      this.logger.error(`[WS] ❌ Authentication failed: ${error.message}`);
      this.authenticated = false;
    }
  }

  onOpen() {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.stats.startTime = Date.now();
    this.logger.log('[WS] ✅ Connected to Axiom WebSocket!');
    this.logger.log('[WS] 🏃‍♂️ Starting real-time whale tracking...');
    
    // Start ping monitoring (30-second intervals based on DevTools)
    this.startPingMonitoring();
    
    this.emit('connected');
  }

  onMessage(data) {
    this.stats.messagesReceived++;
    
    try {
      const message = JSON.parse(data.toString());
      
      // Handle ping messages
      if (message.method === 'ping') {
        this.handlePing();
        return;
      }
      
      // Handle whale transaction data (array format from DevTools)
      if (Array.isArray(message) && message.length >= 20) {
        this.handleWhaleTransaction(message);
      }
      
    } catch (error) {
      // Handle raw array messages (not JSON wrapped)
      const rawData = data.toString();
      if (rawData.startsWith('[') && rawData.includes(',')) {
        try {
          const transactionData = JSON.parse(rawData);
          if (Array.isArray(transactionData) && transactionData.length >= 20) {
            this.handleWhaleTransaction(transactionData);
          }
        } catch (parseError) {
          this.logger.error(`[WS] 📨 Failed to parse transaction: ${parseError.message}`);
        }
      }
    }
  }

  handlePing() {
    // Respond to server ping (keep connection alive)
    if (this.sharedConnection && this.sharedConnection.readyState === WebSocket.OPEN) {
      // Use underlying WebSocket for pong if available
      if (this.sharedConnection._underlying && this.sharedConnection._underlying.pong) {
        this.sharedConnection._underlying.pong();
      }
    }
  }

  handleWhaleTransaction(data) {
    // Parse the transaction array based on DevTools structure
    const [
      timestamp,        // 0: 1755074840761
      walletAddress,    // 1: "ENi5uKnSAT7GKXGyv6PUadpSg3xtVUHyuqMiB38vsF49"
      signature,        // 2: "QAUu4E1FG8CcwCkBaxfz98q..."
      sequence,         // 3: 4
      fromToken,        // 4: "FwxLwVv7pmuyjhNBBPCFxVsst2RysymtNuPJ1iQPZqML"
      toToken,          // 5: "CgvFmbR9WDzZjEz3LyMBYo9vzxXfPYGvtDbWrqHibonk"
      priceData,        // 6: "1755074829510:0.564928676"
      tokenAmount,      // 7: 3.652365856385844e-7
      solAmount,        // 8: 0.00007233327960279345
      marketCap,        // 9: 3127488.080097
      profitPercent,    // 10: 1.142273068
      profitSol,        // 11: 226.22146975206
      slippage,         // 12: 0.0131485015
      action,           // 13: "sell"
      tradeTime,        // 14: 1755074822998
      profitUsd,        // 15: 448.69333633286834
      unknown1,         // 16: null
      pnl,              // 17: -1.403283061
      tokenName,        // 18: "SMILEY"
      symbol,           // 19: "SMILEY"
      imageUrl,         // 20: "https://axiomtrading.sfo3.cdn.digitaloceanspaces.com/..."
      unknown2,         // 21: 6
      supply,           // 22: 1000000000
      protocol,         // 23: "Bonk"
      migrated,         // 24: true
      confidence,       // 25: 79.750025203
      unknown3,         // 26: null
      rating            // 27: 3
    ] = data;

    // Check if this is a tracked whale
    const isTrackedWhale = this.trackedWallets.has(walletAddress);
    
    if (isTrackedWhale) {
      this.stats.whaleSignals++;
      if (action === 'buy') this.stats.buySignals++;
      if (action === 'sell') this.stats.sellSignals++;

      const signal = {
        timestamp: Date.now(),
        walletAddress,
        signature,
        action,
        tokenName,
        symbol,
        toToken,
        fromToken,
        solAmount: parseFloat(solAmount) || 0,
        marketCap: parseFloat(marketCap) || 0,
        profitPercent: parseFloat(profitPercent) || 0,
        profitUsd: parseFloat(profitUsd) || 0,
        slippage: parseFloat(slippage) || 0,
        protocol,
        confidence: parseFloat(confidence) || 0,
        rating: parseInt(rating) || 0,
        fresh: true,
        source: 'axiom-ws'
      };

      this.logger.log(`[WS] 🐋 WHALE SIGNAL: ${walletAddress.slice(0, 8)}... ${action.toUpperCase()} ${symbol} - ${signal.solAmount.toFixed(4)} SOL - ${signal.profitPercent.toFixed(2)}%`);
      
      this.emit('whale-signal', signal);
    }

    // Emit all transactions for broader monitoring
    this.emit('transaction', {
      timestamp: Date.now(),
      walletAddress,
      action,
      tokenName,
      symbol,
      toToken,
      solAmount: parseFloat(solAmount) || 0,
      marketCap: parseFloat(marketCap) || 0,
      tracked: isTrackedWhale
    });
  }

  startPingMonitoring() {
    // Send ping every 30 seconds (matches Axiom's pattern)
    this.pingInterval = setInterval(() => {
      if (this.sharedConnection && this.sharedConnection.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        // SharedWebSocket may not have ping method, so check first
        if (this.sharedConnection._underlying && this.sharedConnection._underlying.ping) {
          this.sharedConnection._underlying.ping();
        }
      }
    }, 30000);
  }

  onPong() {
    const latency = Date.now() - this.lastPingTime;
    this.stats.latency = latency;
    this.logger.log(`[WS] 🏓 Pong received - latency: ${latency}ms`);
  }

  onClose() {
    this.connected = false;
    this.logger.log(`[WS] 🔌 Connection closed via SharedWebSocketManager`);
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.emit('disconnected', { code: 1000, reason: 'Client disconnect' }); // Assuming 1000 for client disconnect
    
    // Auto-reconnect unless explicitly closed
    this.scheduleReconnect();
  }

  onError(error) {
    this.logger.error(`[WS] ❌ WebSocket error: ${error.message}`);
    this.emit('error', error);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[WS] 💀 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    this.logger.log(`[WS] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  addTrackedWallet(walletAddress) {
    this.trackedWallets.add(walletAddress);
    this.logger.log(`[WS] ➕ Added whale: ${walletAddress.slice(0, 8)}...`);
  }

  removeTrackedWallet(walletAddress) {
    this.trackedWallets.delete(walletAddress);
    this.logger.log(`[WS] ➖ Removed whale: ${walletAddress.slice(0, 8)}...`);
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      connected: this.connected,
      authenticated: this.authenticated,
      uptime: uptime,
      uptimeFormatted: `${Math.floor(uptime / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`,
      trackedWallets: this.trackedWallets.size,
      messagesPerMinute: Math.round((this.stats.messagesReceived / (uptime / 60000)) || 0),
      latency: this.stats.latency
    };
  }

  disconnect() {
    this.logger.log('[WS] 🛑 Disconnecting WebSocket...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.sharedConnection) {
      this.sharedConnection.close(1000, 'Client disconnect');
      this.sharedConnection = null;
    }
    
    this.connected = false;
  }
}

export default AxiomWebSocketTracker; 