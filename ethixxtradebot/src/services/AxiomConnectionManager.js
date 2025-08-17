import { sharedWebSocketManager } from './SharedWebSocketManager.js';
import { axiomTokenManager } from '../core/AxiomTokenManager.js';

/**
 * Axiom Connection Manager
 * Manages enhanced WebSocket connections and subscriptions for Cluster7 and Eucalyptus
 * Created: August 17, 2025
 */
export class AxiomConnectionManager {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
    this.pingIntervals = new Map();
    this.logger = console;
    
    // Track subscription status
    this.subscribedRooms = {
      cluster7: new Set(),
      eucalyptus: new Set()
    };
  }
  
  async initialize() {
    console.log('[AXIOM-CONN] 🔌 Initializing enhanced WebSocket connections...');
    
    try {
      // Connect to Cluster7 (existing connection, new subscriptions)
      await this.enhanceCluster7();
      
      // Enhance Eucalyptus subscriptions
      await this.enhanceEucalyptus();
      
      console.log('[AXIOM-CONN] ✅ Enhanced connections established');
      return true;
    } catch (error) {
      console.error('[AXIOM-CONN] ❌ Failed to initialize:', error.message);
      return false;
    }
  }
  
  async enhanceCluster7() {
    try {
      // Get existing connection
      const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
      
      if (!connection) {
        console.error('[AXIOM-CONN] Failed to get Cluster7 connection');
        return;
      }
      
      this.connections.set('cluster7', connection);
      
      // Subscribe to NEW rooms discovered
      const newRooms = [
        'lighthouse',      // Market statistics
        'sol_price',       // SOL/USD price
        'sol-priority-fee', // Network fees
        'block_hash',      // Latest block hash
        'twitter_feed_v2'  // Social signals
      ];
      
      for (const room of newRooms) {
        if (!this.subscribedRooms.cluster7.has(room)) {
          const subscription = {
            action: 'join',
            room: room
          };
          
          connection.send(JSON.stringify(subscription));
          this.subscribedRooms.cluster7.add(room);
          console.log(`[AXIOM-CONN] ✅ Subscribed to ${room}`);
        }
      }
      
      console.log(`[AXIOM-CONN] Cluster7 enhanced with ${newRooms.length} new room subscriptions`);
      
    } catch (error) {
      console.error('[AXIOM-CONN] Error enhancing Cluster7:', error.message);
    }
  }
  
  async enhanceEucalyptus() {
    try {
      // Get auth tokens from properties
      const accessToken = axiomTokenManager.accessToken;
      const refreshToken = axiomTokenManager.refreshToken;
      
      if (!accessToken) {
        console.error('[AXIOM-CONN] No valid access token for Eucalyptus connection');
        return;
      }
      
      // Get existing or create connection
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://eucalyptus.axiom.trade/ws',
        {
          headers: {
            'Cookie': `auth-access-token=${accessToken}; auth-refresh-token=${refreshToken}`,
            'Origin': 'https://axiom.trade',
            'Referer': 'https://axiom.trade/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        }
      );
      
      if (!connection) {
        console.error('[AXIOM-CONN] Failed to get Eucalyptus connection');
        return;
      }
      
      this.connections.set('eucalyptus', connection);
      
      // Ensure ping interval
      if (!this.pingIntervals.has('eucalyptus')) {
        this.startPing('eucalyptus', connection);
      }
      
      console.log('[AXIOM-CONN] ✅ Eucalyptus connection enhanced with auth');
      
    } catch (error) {
      console.error('[AXIOM-CONN] Error enhancing Eucalyptus:', error.message);
    }
  }
  
  startPing(name, connection) {
    // Clear existing interval if any
    if (this.pingIntervals.has(name)) {
      clearInterval(this.pingIntervals.get(name));
    }
    
    const interval = setInterval(() => {
      try {
        connection.send(JSON.stringify({ method: 'ping' }));
        console.log(`[AXIOM-CONN] 🏓 Ping sent to ${name}`);
      } catch (error) {
        console.error(`[AXIOM-CONN] Failed to ping ${name}:`, error.message);
      }
    }, 30000); // Every 30 seconds
    
    this.pingIntervals.set(name, interval);
    console.log(`[AXIOM-CONN] Started ping interval for ${name}`);
  }
  
  // Dynamic subscription methods for specific tokens
  subscribeToToken(tokenAddress, pairAddress) {
    const eucalyptus = this.connections.get('eucalyptus');
    if (!eucalyptus) {
      console.warn('[AXIOM-CONN] No Eucalyptus connection available');
      return;
    }
    
    try {
      // Analytics room (contains token address!)
      const analyticsRoom = `a:${tokenAddress}`;
      if (!this.subscribedRooms.eucalyptus.has(analyticsRoom)) {
        eucalyptus.send(JSON.stringify({
          action: 'join',
          room: analyticsRoom
        }));
        this.subscribedRooms.eucalyptus.add(analyticsRoom);
      }
      
      // Transaction feed rooms
      const feedRoom = `f:${pairAddress}`;
      if (!this.subscribedRooms.eucalyptus.has(feedRoom)) {
        eucalyptus.send(JSON.stringify({
          action: 'join',
          room: feedRoom
        }));
        this.subscribedRooms.eucalyptus.add(feedRoom);
      }
      
      // Alternative transaction room
      const altRoom = `t:${pairAddress}`;
      if (!this.subscribedRooms.eucalyptus.has(altRoom)) {
        eucalyptus.send(JSON.stringify({
          action: 'join',
          room: altRoom
        }));
        this.subscribedRooms.eucalyptus.add(altRoom);
      }
      
      console.log(`[AXIOM-CONN] 📡 Subscribed to token ${tokenAddress.slice(0,8)}... with pair ${pairAddress.slice(0,8)}...`);
      
    } catch (error) {
      console.error('[AXIOM-CONN] Error subscribing to token:', error.message);
    }
  }
  
  subscribeToWallet(walletAddress) {
    const eucalyptus = this.connections.get('eucalyptus');
    if (!eucalyptus) {
      console.warn('[AXIOM-CONN] No Eucalyptus connection available');
      return;
    }
    
    try {
      // Balance tracking room
      const balanceRoom = `b-${walletAddress}`;
      if (!this.subscribedRooms.eucalyptus.has(balanceRoom)) {
        eucalyptus.send(JSON.stringify({
          action: 'join',
          room: balanceRoom
        }));
        this.subscribedRooms.eucalyptus.add(balanceRoom);
        console.log(`[AXIOM-CONN] 👁️ Tracking wallet ${walletAddress.slice(0,8)}...`);
      }
      
    } catch (error) {
      console.error('[AXIOM-CONN] Error subscribing to wallet:', error.message);
    }
  }
  
  getStats() {
    return {
      connections: {
        cluster7: this.connections.has('cluster7'),
        eucalyptus: this.connections.has('eucalyptus')
      },
      subscriptions: {
        cluster7: this.subscribedRooms.cluster7.size,
        eucalyptus: this.subscribedRooms.eucalyptus.size
      },
      pingIntervals: Array.from(this.pingIntervals.keys())
    };
  }
  
  cleanup() {
    // Clear all ping intervals
    for (const [name, interval] of this.pingIntervals) {
      clearInterval(interval);
      console.log(`[AXIOM-CONN] Cleared ping interval for ${name}`);
    }
    this.pingIntervals.clear();
  }
}

// Export singleton
export const axiomConnectionManager = new AxiomConnectionManager(); 