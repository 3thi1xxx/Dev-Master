#!/usr/bin/env node
/**
 * Shared WebSocket Manager
 * Replicates browser's exact connection sharing pattern for persistent Axiom connections
 * Based on the actual useWebSocket hook implementation from browser
 */

import { axiomTokenManager } from '../core/AxiomTokenManager.js';
import WebSocket from 'ws';
import { EventEmitter } from 'node:events';

const ReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  UNINSTANTIATED: -1
};

class SharedWebSocketManager extends EventEmitter {
  constructor() {
    super();
    
    // Shared WebSocket instances (like browser's S.current)
    this.sharedWebSockets = new Map();
    
    // Connection states per URL (like browser's x state)
    this.connectionStates = new Map();
    
    // Message queues per connection (like browser's C.current)
    this.messageQueues = new Map();
    
    // Token manager integration (use singleton)
    this.tokenManager = axiomTokenManager;
    
    // Connection options per URL
    this.connectionOptions = new Map();
    
    this.logger = console;
    
    this.logger.log('[SHARED-WS] 🌐 SharedWebSocketManager initialized');
    this.logger.log('[SHARED-WS] 📋 Replicating browser\'s exact sharing pattern');
    
    // Initialize token manager
    this.initializeTokenManager();
  }
  
  async initializeTokenManager() {
    await this.tokenManager.initialize();
    this.logger.log('[SHARED-WS] ✅ Token manager initialized');
  }
  
  /**
   * Get or create shared WebSocket connection (browser's exact pattern)
   */
  async getSharedConnection(url, options = {}) {
    const {
      share = true,
      skipAssert = false,
      disableJson = false,
      queryParams = null,
      reconnectAttempts = 5,
      reconnectInterval = 5000
    } = options;
    
    // Build full URL with query params (like browser)
    const fullUrl = this._buildUrl(url, queryParams);
    
    this.logger.log(`[SHARED-WS] 🔌 Getting connection for: ${fullUrl}`);
    this.logger.log(`[SHARED-WS] 🔄 Share enabled: ${share}`);
    
    // Store options for this URL
    this.connectionOptions.set(fullUrl, options);
    
    // Browser's exact logic: return shared or direct connection
    if (!share) {
      this.logger.log('[SHARED-WS] 📱 Creating direct connection (share=false)');
      return this._createDirectConnection(fullUrl, options);
    }
    
    // Check if shared instance exists (browser's S.current check)
    let sharedInstance = this.sharedWebSockets.get(fullUrl);
    
    if (!sharedInstance) {
      this.logger.log('[SHARED-WS] 🆕 Creating new shared connection');
      sharedInstance = await this._createSharedConnection(fullUrl, options);
      this.sharedWebSockets.set(fullUrl, sharedInstance);
    } else {
      this.logger.log('[SHARED-WS] ♻️  Reusing existing shared connection');
      this.logger.log(`[SHARED-WS] 📊 Current state: ${this._getReadyStateName(sharedInstance.readyState)}`);
    }
    
    return sharedInstance;
  }
  
  /**
   * Create shared WebSocket with browser's exact pattern
   */
  async _createSharedConnection(url, options) {
    this.logger.log('[SHARED-WS] 🔧 Creating shared WebSocket instance...');
    
    // Get authentication headers using existing token manager
    const headers = await this._getAuthHeaders();
    
    // Initialize connection state (like browser's x state)
    this.connectionStates.set(url, ReadyState.CONNECTING);
    this.messageQueues.set(url, []);
    
    // Create WebSocket with authentication
    const ws = new WebSocket(url, { headers });
    
    // Browser's shared wrapper pattern
    const sharedWrapper = {
      url,
      readyState: ReadyState.CONNECTING,
      send: (data) => this._sendMessage(url, data, ws),
      close: () => this._closeConnection(url, ws),
      addEventListener: (event, handler) => ws.addEventListener(event, handler),
      removeEventListener: (event, handler) => ws.removeEventListener(event, handler),
      _underlying: ws, // Reference to actual WebSocket
      _isShared: true
    };
    
    // Set up connection event handlers
    this._setupConnectionHandlers(url, ws, sharedWrapper);
    
    return sharedWrapper;
  }
  
  /**
   * Set up WebSocket event handlers (browser pattern)
   */
  _setupConnectionHandlers(url, ws, wrapper) {
    const queue = this.messageQueues.get(url);
    
    ws.on('open', () => {
      this.logger.log(`[SHARED-WS] ✅ Shared connection opened: ${url}`);
      
      // Update states (browser pattern)
      wrapper.readyState = ReadyState.OPEN;
      this.connectionStates.set(url, ReadyState.OPEN);
      
      // Send queued messages (browser's C.current pattern)
      if (queue && queue.length > 0) {
        this.logger.log(`[SHARED-WS] 📦 Sending ${queue.length} queued messages`);
        queue.forEach(message => {
          try {
            ws.send(message);
          } catch (error) {
            this.logger.error(`[SHARED-WS] ❌ Error sending queued message:`, error);
          }
        });
        queue.length = 0; // Clear queue
      }
      
      this.emit('connection-open', { url, wrapper });
    });
    
    ws.on('message', (data) => {
      // Parse JSON if not disabled (browser pattern)
      const options = this.connectionOptions.get(url) || {};
      let parsedData = data;
      
      if (!options.disableJson) {
        try {
          parsedData = JSON.parse(data.toString());
        } catch (error) {
          // Keep raw data if JSON parsing fails (browser pattern)
          parsedData = { __unparsable: true, raw: data.toString() };
        }
      }
      
      this.emit('message', { url, data: parsedData, wrapper });
    });
    
    ws.on('close', (code, reason) => {
      this.logger.log(`[SHARED-WS] 🔌 Connection closed: ${url} (${code})`);
      
      wrapper.readyState = ReadyState.CLOSED;
      this.connectionStates.set(url, ReadyState.CLOSED);
      
      // Remove from shared instances
      this.sharedWebSockets.delete(url);
      
      this.emit('connection-close', { url, code, reason, wrapper });
      
      // Auto-reconnect if configured
      const options = this.connectionOptions.get(url) || {};
      if (options.shouldReconnect !== false && code !== 1000) {
        this._scheduleReconnect(url, options);
      }
    });
    
    ws.on('error', (error) => {
      this.logger.error(`[SHARED-WS] ❌ WebSocket error for ${url}:`, error.message);
      
      wrapper.readyState = ReadyState.CLOSED;
      this.connectionStates.set(url, ReadyState.CLOSED);
      
      this.emit('connection-error', { url, error, wrapper });
    });
  }
  
  /**
   * Send message with browser's exact queuing pattern
   */
  _sendMessage(url, data, ws) {
    const currentState = this.connectionStates.get(url);
    
    if (currentState === ReadyState.OPEN) {
      try {
        ws.send(data);
        this.logger.log(`[SHARED-WS] 📤 Message sent to ${url}`);
      } catch (error) {
        this.logger.error(`[SHARED-WS] ❌ Send error:`, error);
      }
    } else {
      // Queue message if not connected (browser's C.current pattern)
      const queue = this.messageQueues.get(url) || [];
      queue.push(data);
      this.messageQueues.set(url, queue);
      this.logger.log(`[SHARED-WS] 📋 Message queued for ${url} (state: ${this._getReadyStateName(currentState)})`);
    }
  }
  
  /**
   * Get authentication headers using existing token manager
   */
  async _getAuthHeaders() {
    try {
      // Match browser's exact pattern - use cookies, not Authorization header
      const accessToken = process.env.AXIOM_ACCESS_TOKEN || this.tokenManager.accessToken;
      const refreshToken = process.env.AXIOM_REFRESH_TOKEN || this.tokenManager.refreshToken;
      
      if (accessToken && refreshToken) {
        this.logger.log('[SHARED-WS] 🍪 Using cookie-based auth (browser pattern)');
        
        // Replicate browser's exact headers - NO Authorization, use cookies instead
        return {
          'Cookie': `auth-access-token=${accessToken}; auth-refresh-token=${refreshToken}`,
          'Origin': 'https://axiom.trade',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        };
      } else {
        this.logger.warn('[SHARED-WS] ⚠️ No tokens available for cookies');
        return {
          'Origin': 'https://axiom.trade',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        };
      }
    } catch (error) {
      this.logger.error('[SHARED-WS] ❌ Failed to get auth headers:', error.message);
      return {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      };
    }
  }
  
  /**
   * Build URL with query parameters (browser pattern)
   */
  _buildUrl(baseUrl, queryParams) {
    if (!queryParams) return baseUrl;
    
    const url = new URL(baseUrl);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }
  
  /**
   * Schedule reconnection (browser pattern)
   */
  _scheduleReconnect(url, options) {
    const delay = options.reconnectInterval || 5000;
    
    this.logger.log(`[SHARED-WS] 🔄 Scheduling reconnect for ${url} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        this.logger.log(`[SHARED-WS] 🔄 Attempting reconnect to ${url}`);
        await this.getSharedConnection(url, options);
      } catch (error) {
        this.logger.error(`[SHARED-WS] ❌ Reconnect failed for ${url}:`, error.message);
      }
    }, delay);
  }
  
  /**
   * Close connection
   */
  _closeConnection(url, ws) {
    this.logger.log(`[SHARED-WS] 🛑 Closing connection: ${url}`);
    
    try {
      ws.close(1000, 'Client disconnect');
    } catch (error) {
      this.logger.error(`[SHARED-WS] ❌ Error closing connection:`, error);
    }
    
    // Clean up
    this.sharedWebSockets.delete(url);
    this.connectionStates.delete(url);
    this.messageQueues.delete(url);
  }
  
  /**
   * Get human-readable ready state name
   */
  _getReadyStateName(state) {
    const names = {
      [ReadyState.CONNECTING]: 'CONNECTING',
      [ReadyState.OPEN]: 'OPEN', 
      [ReadyState.CLOSING]: 'CLOSING',
      [ReadyState.CLOSED]: 'CLOSED',
      [ReadyState.UNINSTANTIATED]: 'UNINSTANTIATED'
    };
    return names[state] || 'UNKNOWN';
  }
  
  /**
   * Create direct (non-shared) connection
   */
  async _createDirectConnection(url, options) {
    this.logger.log('[SHARED-WS] 📱 Creating direct connection (no sharing)');
    
    const headers = await this._getAuthHeaders();
    const ws = new WebSocket(url, { headers });
    
    return {
      url,
      readyState: ws.readyState,
      send: ws.send.bind(ws),
      close: ws.close.bind(ws),
      addEventListener: ws.addEventListener.bind(ws),
      removeEventListener: ws.removeEventListener.bind(ws),
      _underlying: ws,
      _isShared: false
    };
  }
  
  /**
   * Get connection stats
   */
  getStats() {
    return {
      sharedConnections: this.sharedWebSockets.size,
      activeConnections: Array.from(this.connectionStates.values()).filter(state => state === ReadyState.OPEN).length,
      totalQueued: Array.from(this.messageQueues.values()).reduce((sum, queue) => sum + queue.length, 0),
      urls: Array.from(this.sharedWebSockets.keys())
    };
  }
  
  /**
   * Close all connections
   */
  closeAll() {
    this.logger.log('[SHARED-WS] 🛑 Closing all shared connections');
    
    for (const [url, wrapper] of this.sharedWebSockets) {
      wrapper.close();
    }
    
    this.sharedWebSockets.clear();
    this.connectionStates.clear();
    this.messageQueues.clear();
  }
}

// Create singleton instance (like browser pattern)
export const sharedWebSocketManager = new SharedWebSocketManager();
export { SharedWebSocketManager, ReadyState }; 