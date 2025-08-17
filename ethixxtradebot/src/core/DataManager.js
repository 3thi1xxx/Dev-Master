/**
 * DataManager - Unified data layer with smart caching
 * Manages all data operations, WebSocket feeds, and API responses
 */

import { EventEmitter } from 'node:events';
import { connectionManager } from './ConnectionManager.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataManager extends EventEmitter {
  constructor() {
    super();
    
    // Data storage
    this.dataCache = new Map();
    this.priceHistory = new Map();
    this.surgeHistory = [];
    this.whaleActivity = new Map();
    
    // Cache configuration with intelligent TTLs
    this.config = {
      cache: {
        ttl: {
          security: 3600000,    // 1 hour for security data
          overview: 600000,     // 10 minutes for overview
          trending: 300000,     // 5 minutes for trending
          newListings: 60000,   // 1 minute for new listings
          default: 60000        // 1 minute default
        },
        maxSize: 1000,
        cleanupInterval: 60000
      },
      
      surge: {
        maxHistory: 10000,
        retentionTime: 86400000  // 24 hours
      }
    };
    
    // Statistics
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      wsMessages: 0
    };
    
    console.log('🔄 DATA MANAGER INITIALIZED');
    console.log('📊 Cache TTLs: Security=1hr, Overview=10min, Trending=5min');
  }
  
  /**
   * Initialize data manager
   */
  async initialize() {
    // Set up WebSocket listeners
    this.setupWebSocketListeners();
    
    // Start cache cleanup
    this.startCacheCleanup();
    
    // Log cache statistics periodically
    setInterval(() => {
      const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100 || 0;
      console.log(`[DATA] 📊 Cache hit rate: ${hitRate.toFixed(1)}% (${this.stats.cacheHits} hits, ${this.stats.cacheMisses} misses)`);
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Setup WebSocket listeners for real-time data
   */
  setupWebSocketListeners() {
    // Listen for Axiom surge updates
    connectionManager.on('surge-update', (data) => {
      this.processSurgeUpdate(data);
      this.stats.wsMessages++;
    });
    
    // Listen for whale activity
    connectionManager.on('whale-activity', (data) => {
      this.processWhaleActivity(data);
      this.stats.wsMessages++;
    });
    
    // Listen for price updates
    connectionManager.on('price-update', (data) => {
      this.processPriceUpdate(data);
      this.stats.wsMessages++;
    });
    
    // Listen for Birdeye updates
    connectionManager.on('birdeye-update', (data) => {
      this.processBirdeyeUpdate(data);
      this.stats.wsMessages++;
    });
  }
  
  /**
   * Process surge update from Axiom
   */
  processSurgeUpdate(data) {
    const enhanced = {
      ...data,
      timestamp: Date.now(),
      processed: true
    };
    
    // Add to history
    this.surgeHistory.push(enhanced);
    
    // Trim old history
    if (this.surgeHistory.length > this.config.surge.maxHistory) {
      this.surgeHistory.shift();
    }
    
    // Cache the token data
    if (data.tokenAddress) {
      this.setCache(`surge:${data.tokenAddress}`, enhanced, 60000); // 1 min TTL
    }
    
    // Emit for other modules
    this.emit('surge-processed', enhanced);
    
    console.log(`[DATA] 🌊 Surge update: ${data.ticker} | Rank: ${data.rank} | Jump: ${data.rankJump}`);
  }
  
  /**
   * Process whale activity
   */
  processWhaleActivity(data) {
    const { wallet, action, tokenAddress, amount } = data;
    
    // Store whale activity
    if (!this.whaleActivity.has(wallet)) {
      this.whaleActivity.set(wallet, []);
    }
    
    const activity = {
      ...data,
      timestamp: Date.now()
    };
    
    this.whaleActivity.get(wallet).push(activity);
    
    // Emit for strategies
    this.emit('whale-signal', activity);
    
    console.log(`[DATA] 🐋 Whale ${action}: ${wallet.slice(0, 8)}... | ${amount}`);
  }
  
  /**
   * Process price update
   */
  processPriceUpdate(data) {
    const { tokenAddress, price, volume, change } = data;
    
    // Update price history
    if (!this.priceHistory.has(tokenAddress)) {
      this.priceHistory.set(tokenAddress, []);
    }
    
    const priceData = {
      price,
      volume,
      change,
      timestamp: Date.now()
    };
    
    const history = this.priceHistory.get(tokenAddress);
    history.push(priceData);
    
    // Keep only last 100 prices
    if (history.length > 100) {
      history.shift();
    }
    
    // Cache current price
    this.setCache(`price:${tokenAddress}`, priceData, 10000); // 10 sec TTL
    
    // Emit for scalping
    this.emit('price-tick', { tokenAddress, ...priceData });
  }
  
  /**
   * Process Birdeye WebSocket update
   */
  processBirdeyeUpdate(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'NEW_TOKEN':
        this.emit('new-token-detected', payload);
        break;
      case 'LARGE_TRADE':
        this.emit('large-trade-detected', payload);
        break;
      case 'TOKEN_STATS':
        this.setCache(`stats:${payload.address}`, payload, 300000); // 5 min TTL
        break;
    }
  }
  
  /**
   * Get token data with caching
   */
  async getTokenData(tokenAddress, options = {}) {
    const { forceRefresh = false, includeHistory = false } = options;
    
    console.log(`[DATA] 📊 getTokenData called for ${tokenAddress}`);
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCache(`token:${tokenAddress}`);
      if (cached) {
        this.stats.cacheHits++;
        console.log(`[DATA] ✅ Cache hit for ${tokenAddress}`);
        return cached;
      }
    }
    
    this.stats.cacheMisses++;
    console.log(`[DATA] ❌ Cache miss for ${tokenAddress}, fetching...`);
    
    // Fetch from multiple sources
    const [overview, security] = await Promise.all([
      this.fetchBirdeyeData(tokenAddress, 'overview'),
      this.fetchBirdeyeData(tokenAddress, 'security')
    ]);
    
    const tokenData = {
      address: tokenAddress,
      overview,
      security,
      timestamp: Date.now()
    };
    
    // Add price history if requested
    if (includeHistory) {
      tokenData.priceHistory = this.priceHistory.get(tokenAddress) || [];
    }
    
    // Cache with appropriate TTL
    this.setCache(`token:${tokenAddress}`, tokenData, this.config.cache.ttl.overview);
    
    return tokenData;
  }
  
  /**
   * Fetch data from Birdeye API
   */
  async fetchBirdeyeData(tokenAddress, endpoint) {
    // Check cache first
    const cacheKey = `birdeye:${endpoint}:${tokenAddress}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log(`[DATA] ✅ Using cached ${endpoint} data for ${tokenAddress.slice(0, 8)}...`);
      return cached;
    }
    
    try {
      // Validate Solana address format
      if (!tokenAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        console.log(`[DATA] ⚠️ Invalid token address format: ${tokenAddress}`);
        return null;
      }
      
      console.log(`[DATA] 🔍 Fetching ${endpoint} for ${tokenAddress.slice(0, 8)}...`);
      
      let response;
      if (endpoint === 'overview') {
        response = await connectionManager.birdeyeRequest(`/defi/token_overview?address=${tokenAddress}`);
      } else if (endpoint === 'security') {
        response = await connectionManager.birdeyeRequest(`/defi/token_security?address=${tokenAddress}`);
      }
      
      if (response?.success && response?.data) {
        // Cache with endpoint-specific TTL
        const ttl = endpoint === 'security' 
          ? this.config.cache.ttl.security 
          : this.config.cache.ttl.overview;
          
        this.setCache(cacheKey, response.data, ttl);
        this.stats.apiCalls++;
        
        return response.data;
      }
      
      console.log(`[DATA] ❌ Failed to fetch ${endpoint} for ${tokenAddress.slice(0, 8)}...`);
      return null;
      
    } catch (error) {
      console.log(`[DATA] ❌ Error fetching ${endpoint}:`, error.message);
      return null;
    }
  }
  
  /**
   * Set cache with TTL
   */
  setCache(key, data, ttl = null) {
    const expiry = Date.now() + (ttl || this.config.cache.ttl.default);
    
    this.dataCache.set(key, {
      data,
      expiry,
      timestamp: Date.now()
    });
    
    // Cleanup if cache is too large
    if (this.dataCache.size > this.config.cache.maxSize) {
      const oldestKey = this.dataCache.keys().next().value;
      this.dataCache.delete(oldestKey);
    }
  }
  
  /**
   * Get from cache
   */
  getCache(key) {
    const cached = this.dataCache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      this.dataCache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Start cache cleanup interval
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, value] of this.dataCache.entries()) {
        if (value.expiry < now) {
          this.dataCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`[DATA] 🧹 Cleaned ${cleaned} expired cache entries`);
      }
      
      // Clean old surge history
      this.surgeHistory = this.surgeHistory.filter(
        s => s.timestamp > now - this.config.surge.retentionTime
      );
      
    }, this.config.cache.cleanupInterval);
  }
  
  /**
   * Get surge history
   */
  getSurgeHistory(limit = 100) {
    return this.surgeHistory.slice(-limit);
  }
  
  /**
   * Get whale activity for a wallet
   */
  getWhaleActivity(wallet = null) {
    if (wallet) {
      return this.whaleActivity.get(wallet) || [];
    }
    return Array.from(this.whaleActivity.entries());
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100 || 0;
    
    return {
      cacheSize: this.dataCache.size,
      cacheHitRate: hitRate,
      totalApiCalls: this.stats.apiCalls,
      totalWsMessages: this.stats.wsMessages,
      surgeHistorySize: this.surgeHistory.length,
      whaleWallets: this.whaleActivity.size
    };
  }
  
  /**
   * Clear all caches
   */
  clearCache() {
    this.dataCache.clear();
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    console.log('[DATA] 🗑️ Cache cleared');
  }
  
  /**
   * Shutdown cleanup
   */
  async shutdown() {
    this.removeAllListeners();
    this.clearCache();
    console.log('[DATA] ✅ Data Manager shutdown complete');
  }
}

// Export singleton instance
export const dataManager = new DataManager();
export default dataManager; 