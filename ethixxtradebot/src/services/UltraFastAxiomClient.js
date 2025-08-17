import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'node:events';
import { axiomTokenManager } from '../core/AxiomTokenManager.js';
import { sharedWebSocketManager } from './SharedWebSocketManager.js';

/**
 * Ultra-Fast Axiom Client - Direct Astralane Gateway Routing
 * NOW WITH SHARED WEBSOCKET MANAGER - Browser-level persistent connections!
 * Target: 2-8ms execution vs 300ms+ competitors = 37-150x SPEED ADVANTAGE
 */
export class UltraFastAxiomClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // ULTRA-FAST ROUTING: Direct Astralane Auckland Gateway
    this.routing = {
      primary: 'https://axiom-akl.gateway.astralane.io',
      cluster_ws: 'wss://cluster7.axiom.trade/',
      whale_feed: 'wss://eucalyptus.axiom.trade/ws',
      api_fallback: null // Will be set from axiomTokenManager's current working endpoint
    };
    
    // Pre-warmed HTTP client for instant requests
    this.httpClient = axios.create({
      timeout: 1000, // 1 second max total
      maxRedirects: 0, // No redirects for speed
      validateStatus: () => true, // Accept all status codes
      headers: {
        'User-Agent': 'UltraFastAxiomClient/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });
    
    // BREAKTHROUGH: Using SharedWebSocketManager instead of manual Map
    this.sharedConnections = new Map(); // Track which shared connections we're using
    this.wsReconnectAttempts = new Map();
    this.maxReconnectAttempts = 3; // Quick fail for speed
    
    // Performance monitoring
    this.latencyStats = {
      requests: [],
      websockets: [],
      averageLatency: 0,
      successRate: 0
    };
    
    this.logger = console;
    this.isInitialized = false;
    
    // Set up SharedWebSocketManager listeners
    this.setupSharedWebSocketListeners();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.logger.log('[ULTRA-FAST] 🚀 Initializing Ultra-Fast Axiom Client...');
      
      // Set dynamic API fallback from token manager's current working endpoint
      const { axiomTokenManager } = await import('./AxiomTokenManager.js');
      this.routing.api_fallback = axiomTokenManager.getCurrentApiBaseUrl();
      this.logger.log(`📡 Using dynamic API fallback: ${this.routing.api_fallback}`);
      
      // Pre-warm HTTP connections
      await this.preWarmConnections();
      
      // Test direct Astralane routing
      await this.testDirectRouting();
      
      // Establish priority WebSocket connections
      await this.establishWebSocketConnections();
      
      this.isInitialized = true;
      this.logger.log('[ULTRA-FAST] ✅ Ultra-speed client ready!');
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
    } catch (error) {
      this.logger.log('[ULTRA-FAST] ❌ Initialization failed:', error.message);
      throw error;
    }
  }

  setupSharedWebSocketListeners() {
    // Listen for messages from all our endpoints
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7') || url.includes('eucalyptus')) {
        this.handleSharedWebSocketMessage(url, data);
      }
    });

    sharedWebSocketManager.on('connection-open', ({ url }) => {
      if (url.includes('cluster7') || url.includes('eucalyptus')) {
        this.handleSharedWebSocketOpen(url);
        
        // CRITICAL FIX: Subscribe to cluster7 data rooms
        if (url.includes('cluster7')) {
          this.subscribeToCluster7Rooms(url);
        }
      }
    });
  }

  handleSharedWebSocketMessage(url, data) {
    const connectionName = this.getConnectionNameFromUrl(url);
    
    // Record performance
    this.latencyStats.websockets.push({
      timestamp: Date.now(),
      connectionName,
      dataSize: JSON.stringify(data).length,
      url
    });
    
    // Emit to listeners
    this.emit('websocket-message', { connectionName, url, data });
    
    this.logger.log(`[ULTRA-FAST] 📨 SharedWebSocket message from ${connectionName}: ${JSON.stringify(data).substring(0, 100)}...`);
  }

  handleSharedWebSocketOpen(url) {
    const connectionName = this.getConnectionNameFromUrl(url);
    this.logger.log(`[ULTRA-FAST] ✅ SharedWebSocket ${connectionName} opened: ${url}`);
    this.emit('websocket-connected', { connectionName, url });
  }

  getConnectionNameFromUrl(url) {
    if (url.includes('cluster7')) return 'cluster7';
    if (url.includes('eucalyptus')) return 'eucalyptus';
    return 'unknown';
  }

  async preWarmConnections() {
    this.logger.log('[ULTRA-FAST] 🔥 Pre-warming connections...');
    
    const preWarmTargets = [
      this.routing.primary,
      this.routing.api_fallback
    ];
    
    const preWarmPromises = preWarmTargets.map(async (url) => {
      try {
        const start = performance.now();
        await this.httpClient.get(`${url}/health`, { timeout: 100 });
        const latency = performance.now() - start;
        this.logger.log(`[ULTRA-FAST] ✅ Pre-warmed ${url}: ${latency.toFixed(1)}ms`);
        return { url, latency, success: true };
      } catch (error) {
        this.logger.log(`[ULTRA-FAST] ⚠️ Pre-warm failed ${url}: ${error.message}`);
        return { url, latency: 999, success: false };
      }
    });
    
    const results = await Promise.allSettled(preWarmPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    
    this.logger.log(`[ULTRA-FAST] 🎯 Pre-warmed ${successful.length}/${preWarmTargets.length} connections`);
  }

  async testDirectRouting() {
    this.logger.log('[ULTRA-FAST] 🧪 Testing direct Astralane routing...');
    
    try {
      const start = performance.now();
      
      // Test direct gateway access
      const response = await this.httpClient.get(`${this.routing.primary}/api/health`, {
        timeout: 50 // 50ms timeout for ultra-fast test
      });
      
      const latency = performance.now() - start;
      
      if (response.status === 200 || response.status === 404) {
        this.logger.log(`[ULTRA-FAST] ✅ Direct Astralane routing: ${latency.toFixed(1)}ms`);
        this.routing.primary_confirmed = true;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      this.logger.log('[ULTRA-FAST] ⚠️ Direct routing failed, using fallback');
      this.routing.primary = this.routing.api_fallback;
      this.routing.primary_confirmed = false;
    }
  }

  async establishWebSocketConnections() {
    this.logger.log('[ULTRA-FAST] 📡 Establishing SharedWebSocket connections...');
    
    const wsTargets = [
      { name: 'cluster7', url: this.routing.cluster_ws, priority: 1 },
      { name: 'eucalyptus', url: this.routing.whale_feed, priority: 2 }
    ];
    
    const connectionPromises = wsTargets.map(target => 
      this.connectSharedWebSocket(target.name, target.url, target.priority)
    );
    
    const results = await Promise.allSettled(connectionPromises);
    
    const activeConnections = this.sharedConnections.size;
    this.logger.log(`[ULTRA-FAST] 📊 Active SharedWebSocket connections: ${activeConnections}/${wsTargets.length}`);
    this.logger.log('[ULTRA-FAST] 🌐 Using browser-pattern persistent connections!');
  }

  async connectSharedWebSocket(name, url, priority) {
    const startTime = performance.now();
    
    try {
      this.logger.log(`[ULTRA-FAST] 🔌 Connecting SharedWebSocket ${name}...`);
      
      // Use SharedWebSocketManager for browser-level persistence
      const sharedConnection = await sharedWebSocketManager.getSharedConnection(url, {
        share: true, // Enable browser sharing pattern
        disableJson: false,
        reconnectAttempts: this.maxReconnectAttempts,
        reconnectInterval: 5000
      });
      
      const latency = performance.now() - startTime;
      
      // Track the shared connection
      this.sharedConnections.set(name, { 
        connection: sharedConnection, 
        url, 
        priority, 
        latency, 
        connected: true,
        isShared: true
      });
      
      this.logger.log(`[ULTRA-FAST] ✅ SharedWebSocket ${name}: ${latency.toFixed(1)}ms (SHARED)`);
      
      return { name, latency, connected: true, isShared: true };
      
    } catch (error) {
      this.logger.log(`[ULTRA-FAST] ❌ SharedWebSocket ${name} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ultra-fast API request with sub-10ms target
   */
  async ultraFastRequest(endpoint, data = null, options = {}) {
    const start = performance.now();
    
    try {
      // Get fresh auth headers
      const headers = await axiomTokenManager.getAuthHeaders();
      
      // Direct gateway hit - no redirects
      const url = `${this.routing.primary}/${endpoint.replace(/^\//, '')}`;
      
      const requestConfig = {
        ...headers,
        timeout: options.timeout || 100, // 100ms default timeout
        validateStatus: () => true
      };
      
      const response = data
        ? await this.httpClient.post(url, data, { headers: requestConfig })
        : await this.httpClient.get(url, { headers: requestConfig });
      
      const latency = performance.now() - start;
      
      // Record performance metrics
      this.recordRequestLatency(latency, response.status >= 200 && response.status < 400);
      
      if (latency > 50) {
        this.logger.log(`[ULTRA-FAST] ⚠️ Slow request: ${latency.toFixed(1)}ms for ${endpoint}`);
      }
      
      return {
        data: response.data,
        status: response.status,
        latency: latency,
        headers: response.headers
      };
      
    } catch (error) {
      const latency = performance.now() - start;
      this.recordRequestLatency(latency, false);
      
      // Try fallback if primary fails
      if (this.routing.primary !== this.routing.api_fallback) {
        this.logger.log(`[ULTRA-FAST] 🔄 Trying fallback for ${endpoint}`);
        return await this.fallbackRequest(endpoint, data, options);
      }
      
      throw new Error(`Ultra-fast request failed: ${error.message}`);
    }
  }

  async fallbackRequest(endpoint, data, options) {
    const start = performance.now();
    
    try {
      const headers = await tokenManager.getAuthHeaders();
      const url = `${this.routing.api_fallback}/${endpoint.replace(/^\//, '')}`;
      
      const response = data
        ? await this.httpClient.post(url, data, { headers })
        : await this.httpClient.get(url, { headers });
      
      const latency = performance.now() - start;
      this.logger.log(`[ULTRA-FAST] 🔄 Fallback request: ${latency.toFixed(1)}ms`);
      
      return {
        data: response.data,
        status: response.status,
        latency: latency,
        headers: response.headers
      };
      
    } catch (error) {
      throw new Error(`Fallback request failed: ${error.message}`);
    }
  }

  /**
   * Parallel multi-endpoint data collection
   */
  async getMarketDataParallel() {
    const start = performance.now();
    
    const dataRequests = [
      this.ultraFastRequest('api/v1/tokens/trending'),
      this.ultraFastRequest('api/v1/whale/activity'),
      this.ultraFastRequest('api/v1/market/pulse')
    ];
    
    try {
      const results = await Promise.allSettled(dataRequests);
      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      
      const totalLatency = performance.now() - start;
      
      this.logger.log(`[ULTRA-FAST] 📊 Parallel data collection: ${totalLatency.toFixed(1)}ms`);
      
      return {
        success: true,
        data: successful,
        latency: totalLatency,
        successRate: successful.length / dataRequests.length
      };
      
    } catch (error) {
      this.logger.log(`[ULTRA-FAST] ❌ Parallel data collection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  recordRequestLatency(latency, success) {
    this.latencyStats.requests.push({
      timestamp: Date.now(),
      latency: latency,
      success: success
    });
    
    // Keep only recent 1000 requests
    if (this.latencyStats.requests.length > 1000) {
      this.latencyStats.requests = this.latencyStats.requests.slice(-500);
    }
    
    // Update rolling averages
    this.updateLatencyStats();
  }

  updateLatencyStats() {
    const recentRequests = this.latencyStats.requests.slice(-100); // Last 100 requests
    
    if (recentRequests.length > 0) {
      this.latencyStats.averageLatency = recentRequests.reduce((sum, req) => sum + req.latency, 0) / recentRequests.length;
      this.latencyStats.successRate = recentRequests.filter(req => req.success).length / recentRequests.length;
    }
  }

  startPerformanceMonitoring() {
    // Log performance stats every 30 seconds
    setInterval(() => {
      if (this.latencyStats.requests.length > 0) {
        const avgLatency = this.latencyStats.averageLatency.toFixed(1);
        const successRate = (this.latencyStats.successRate * 100).toFixed(1);
        const wsConnections = Array.from(this.sharedConnections.values()).filter(ws => ws.connected).length;
        
        this.logger.log(`[ULTRA-FAST] 📊 Performance: ${avgLatency}ms avg, ${successRate}% success, ${wsConnections} WS active`);
      }
    }, 30000);
  }

  getPerformanceStats() {
    return {
      averageLatency: this.latencyStats.averageLatency,
      successRate: this.latencyStats.successRate,
      totalRequests: this.latencyStats.requests.length,
      activeWebSockets: Array.from(this.sharedConnections.values()).filter(ws => ws.connected).length,
      routingMode: this.routing.primary_confirmed ? 'Direct Astralane' : 'API Fallback'
    };
  }

  async close() {
    this.logger.log('[ULTRA-FAST] 🛑 Shutting down ultra-fast client...');
    
    // Close all WebSocket connections
    for (const [name, wsInfo] of this.sharedConnections) {
      if (wsInfo.connection && wsInfo.connected) {
        await sharedWebSocketManager.closeSharedConnection(wsInfo.connection);
      }
    }
    
    this.sharedConnections.clear();
    this.wsReconnectAttempts.clear();
    
    this.logger.log('[ULTRA-FAST] ✅ Ultra-fast client shutdown complete');
  }

  /**
   * Subscribe to cluster7 data rooms to unlock message flow
   */
  subscribeToCluster7Rooms(url) {
    console.log('[ULTRA-FAST] 📤 Subscribing to cluster7 data rooms...');
    
    const connection = sharedWebSocketManager.sharedWebSockets.get(url);
    if (!connection) {
      console.log('[ULTRA-FAST] ❌ No connection found for cluster7 subscriptions');
      return;
    }
    
    const subscriptions = [
      { action: 'join', room: 'trending-search-crypto' },
      { action: 'join', room: 'new_pairs' },
      { action: 'join', room: 'surge-updates' }
    ];
    
    for (const subscription of subscriptions) {
      try {
        connection.send(JSON.stringify(subscription));
        console.log(`[ULTRA-FAST] ✅ Subscribed to: ${subscription.room}`);
      } catch (error) {
        console.error(`[ULTRA-FAST] ❌ Failed to subscribe to ${subscription.room}:`, error);
      }
    }
  }
}

// For immediate use
export const ultraFastClient = new UltraFastAxiomClient(); 