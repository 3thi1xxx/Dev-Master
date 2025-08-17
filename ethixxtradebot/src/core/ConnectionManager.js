/**
 * Connection Manager - REAL IMPLEMENTATION
 * Live WebSocket and API connections with Auckland optimization
 */

import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';
import { axiomTokenManager } from './AxiomTokenManager.js';

// Rate limiter for API calls
class RateLimiter {
  constructor(maxPerSecond = 16) {
    this.queue = [];
    this.processing = false;
    this.interval = 1000 / maxPerSecond;
  }
  
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || !this.queue.length) return;
    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    setTimeout(() => {
      this.processing = false;
      this.process();
    }, this.interval);
  }
}

class ConnectionManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.rateLimiter = new RateLimiter(50); // Premium Plus: 50 RPS
    this.metrics = {
      axiom: { connected: false, latency: 0, messages: 0 },
      birdeye: { connected: false, latency: 0, requests: 0 }
    };
    
    // Connection strategy from Phase 4
    this.strategy = {
      axiom: {
        primary: 'wss://cluster7.axiom.trade/',
        backup: 'wss://eucalyptus.axiom.trade/',
        pingInterval: 30000,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
        reconnectDecay: 1.5
      },
      birdeye: {
        maxWebsockets: 400,     // 80% of 500 limit for safety
        rateLimit: 16,          // Requests per second (1000 RPM / 60)
        priorityQueue: [],
        cacheStrategy: 'intelligent',
        cacheTTL: {
          security: 3600000,    // 1 hour for security data
          overview: 300000,     // 5 min for price data
          trending: 60000       // 1 min for trending
        }
      }
    };
    
    this.reconnectTimers = new Map();
    this.requestQueue = [];
    this.cache = new Map();
  }
  
  /**
   * Initialize all connections with Auckland latency optimization
   */
  async initialize() {
    console.log('🔌 CONNECTION MANAGER: Initializing with Auckland optimization');
    console.log('📍 Location advantage: 254ms (6.5x speed multiplier)');
    
    // Initialize token manager first
    await axiomTokenManager.initialize();
    
    // Start Axiom connections
    await this.connectAxiom();
    
    // Start Birdeye WebSockets
    await this.connectBirdeyeWS();
    
    // Initialize Birdeye rate limiter
    this.startRateLimiter();
    
    // Monitor connection health
    this.startHealthMonitoring();
    
    return true;
  }
  
  /**
   * Connect to Axiom with automatic failover
   */
  async connectAxiom() {
    const connect = async (url, isPrimary = true) => {
      try {
        const startTime = Date.now();
        
        // Get tokens for cookie-based auth (matching browser pattern)
        const accessToken = process.env.AXIOM_ACCESS_TOKEN;
        const refreshToken = process.env.AXIOM_REFRESH_TOKEN;
        
        // Use cookies like the browser does, not Authorization header
        const headers = {
          'Origin': 'https://axiom.trade',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        };
        
        if (accessToken && refreshToken) {
          headers['Cookie'] = `auth-access-token=${accessToken}; auth-refresh-token=${refreshToken}`;
          console.log(`[AXIOM] 🍪 Using cookie-based auth for ${isPrimary ? 'PRIMARY' : 'BACKUP'}`);
        } else {
          console.log(`[AXIOM] ⚠️ No tokens available for ${isPrimary ? 'PRIMARY' : 'BACKUP'}`);
        }
        
        const ws = new WebSocket(url, { headers });
        
        ws.on('open', () => {
          const latency = Date.now() - startTime;
          console.log(`✅ Axiom ${isPrimary ? 'PRIMARY' : 'BACKUP'} connected: ${latency}ms`);
          this.metrics.axiom.connected = true;
          this.metrics.axiom.latency = latency;
          
          // Subscribe to critical rooms (including new_pairs for token launches)
          ws.send(JSON.stringify({
            action: 'join',
            rooms: ['new_pairs', 'surge-updates', 'jito-bribe-fee', 'sol-priority-fee']
          }));
        });
        
        ws.on('message', (data) => {
          this.metrics.axiom.messages++;
          this.handleAxiomMessage(JSON.parse(data));
        });
        
        ws.on('error', (error) => {
          console.error(`❌ Axiom ${isPrimary ? 'PRIMARY' : 'BACKUP'} error:`, error.message);
          if (isPrimary) {
            console.log('🔄 Switching to backup Axiom server...');
            connect(this.strategy.axiom.backup, false);
          }
        });
        
        ws.on('close', () => {
          this.metrics.axiom.connected = false;
          this.scheduleReconnect(url, isPrimary);
        });
        
        // Ping to maintain connection
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        }, this.strategy.axiom.pingInterval);
        
        this.connections.set(`axiom-${isPrimary ? 'primary' : 'backup'}`, ws);
        
      } catch (error) {
        console.error(`❌ Failed to connect to ${url}:`, error.message);
        if (isPrimary) {
          connect(this.strategy.axiom.backup, false);
        }
      }
    };
    
    await connect(this.strategy.axiom.primary, true);
  }
  
  /**
   * Exponential backoff reconnection
   */
  scheduleReconnect(url, isPrimary) {
    const key = `axiom-${isPrimary ? 'primary' : 'backup'}`;
    
    if (this.reconnectTimers.has(key)) {
      clearTimeout(this.reconnectTimers.get(key));
    }
    
    let delay = this.strategy.axiom.reconnectDelay;
    const existingDelay = this.reconnectTimers.get(`${key}-delay`) || delay;
    delay = Math.min(existingDelay * this.strategy.axiom.reconnectDecay, this.strategy.axiom.maxReconnectDelay);
    
    console.log(`⏱️ Reconnecting to ${key} in ${delay}ms...`);
    
    const timer = setTimeout(() => {
      this.connectAxiom();
    }, delay);
    
    this.reconnectTimers.set(key, timer);
    this.reconnectTimers.set(`${key}-delay`, delay);
  }
  
  /**
   * Rate-limited Birdeye API requests
   */
  async birdeyeRequest(endpoint, params = {}, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const request = { endpoint, params, priority, resolve, reject, timestamp: Date.now() };
      
      // Add to priority queue
      if (priority === 'high') {
        this.requestQueue.unshift(request);
      } else {
        this.requestQueue.push(request);
      }
    });
  }
  
  /**
   * Process Birdeye queue with rate limiting
   */
  startRateLimiter() {
    setInterval(() => {
      const batchSize = Math.min(this.requestQueue.length, this.strategy.birdeye.rateLimit);
      
      for (let i = 0; i < batchSize; i++) {
        const request = this.requestQueue.shift();
        if (!request) break;
        
        // Check cache first
        const cacheKey = `${request.endpoint}-${JSON.stringify(request.params)}`;
        const cached = this.checkCache(cacheKey, request.endpoint);
        
        if (cached) {
          request.resolve(cached);
          continue;
        }
        
        // Make actual request
        this.executeBirdeyeRequest(request)
          .then(data => {
            this.updateCache(cacheKey, data, request.endpoint);
            request.resolve(data);
          })
          .catch(request.reject);
      }
      
      if (this.requestQueue.length > 100) {
        console.log(`⚠️ Birdeye queue depth: ${this.requestQueue.length}`);
      }
    }, 1000 / this.strategy.birdeye.rateLimit); // Distribute requests evenly
  }
  
  /**
   * Execute REAL Birdeye API request
   */
  async executeBirdeyeRequest(request) {
    const startTime = Date.now();
    
    console.log(`[BIRDEYE] 🔍 Making API request to: ${request.endpoint}`);
    
    const apiKey = process.env.BIRDEYE_API_KEY || process.env.BIRDEYE_TOKEN;
    if (!apiKey) {
      console.error('[BIRDEYE] ❌ No API key found!');
      return null;
    }
    
    try {
      const response = await axios({
        method: 'GET',
        url: `https://public-api.birdeye.so${request.endpoint}`,
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json'
        },
        params: request.params
      });
      
      this.metrics.birdeye.requests++;
      this.metrics.birdeye.latency = Date.now() - startTime;
      
      console.log(`[BIRDEYE] ✅ API request successful (${Date.now() - startTime}ms)`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Birdeye request failed:`, error.message);
      throw error;
    }
  }
  
  /**
   * Intelligent caching with TTL
   */
  checkCache(key, endpoint) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const ttl = this.strategy.birdeye.cacheTTL[this.getEndpointType(endpoint)];
    const age = Date.now() - cached.timestamp;
    
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  updateCache(key, data, endpoint) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      endpoint
    });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      
      oldest.forEach(([key]) => this.cache.delete(key));
    }
  }
  
  getEndpointType(endpoint) {
    if (endpoint.includes('security')) return 'security';
    if (endpoint.includes('trending')) return 'trending';
    return 'overview';
  }
  
  /**
   * Monitor connection health
   */
  startHealthMonitoring() {
    setInterval(() => {
      const axiomStatus = this.metrics.axiom.connected ? '✅' : '❌';
      const birdeyeStatus = this.metrics.birdeye.requests > 0 ? '✅' : '⏳';
      
      console.log(`[HEALTH] Axiom: ${axiomStatus} (${this.metrics.axiom.latency}ms) | Birdeye: ${birdeyeStatus} (${this.requestQueue.length} queued)`);
      
      // Alert if high latency
      if (this.metrics.axiom.latency > 1000) {
        console.warn('⚠️ HIGH LATENCY DETECTED - Auckland advantage compromised');
      }
    }, 60000); // Every minute
  }
  
  /**
   * Handle incoming Axiom messages
   */
  handleAxiomMessage(message) {
    // Emit to listeners
    this.emit('axiom-message', message);
    
    // Log important messages
    if (message.room === 'surge-updates') {
      console.log(`[AXIOM] 🚀 Surge detected: ${message.content?.ticker || 'Unknown'}`);
    }
  }
  
  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueDepth: this.requestQueue.length,
      cacheSize: this.cache.size,
      uptime: process.uptime()
    };
  }
  
  // Birdeye WebSocket methods
  async connectBirdeyeWS() {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) return;
    
    const ws = new WebSocket(`wss://public-api.birdeye.so/socket/solana?x-api-key=${apiKey}`, 'echo-protocol');
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'SUBSCRIBE_TOKEN_NEW_LISTING' }));
      ws.send(JSON.stringify({ type: 'SUBSCRIBE_NEW_PAIR' }));
      ws.send(JSON.stringify({ type: 'SUBSCRIBE_LARGE_TRADE_TXS', data: { min_volume: 50000 } }));
      console.log('[WS] Connected to Birdeye WebSocket');
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      this.emit('birdeye-update', msg);
    });
    this.connections.set('birdeye-ws', ws);
    setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.ping(); }, 30000);
  }
  
  async subscribePrices(tokens) {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey || !tokens.length) return;
    
    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);
      const ws = new WebSocket(`wss://public-api.birdeye.so/socket/solana?x-api-key=${apiKey}`, 'echo-protocol');
      ws.on('open', () => {
        batch.forEach(t => ws.send(JSON.stringify({
          type: 'SUBSCRIBE_PRICE',
          data: { chartType: '1s', currency: 'pair', address: t }
        })));
      });
      ws.on('message', (data) => this.emit('price', JSON.parse(data)));
      this.connections.set(`price-${i}`, ws);
    }
  }
  
  /**
   * Shutdown connection manager and cleanup resources
   */
  async shutdown() {
    console.log('[CONNECTION] 🛑 Shutting down connection manager...');
    
    // Close all WebSocket connections
    for (const [name, ws] of this.connections) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log(`[CONNECTION] Closed ${name}`);
      }
    }
    
    // Clear all timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    
    // Shutdown token manager
    axiomTokenManager.shutdown();
    
    // Clear caches
    this.cache.clear();
    this.connections.clear();
    this.reconnectTimers.clear();
    
    console.log('[CONNECTION] ✅ Connection manager shutdown complete');
  }
}

// Export singleton
export const connectionManager = new ConnectionManager();
export default connectionManager; 