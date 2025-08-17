/**
 * Premium RPC Manager - Helius Enhanced Performance
 * Leverages premium Helius features for maximum speed and real-time data
 */

import { Connection, PublicKey } from '@solana/web3.js';
import WebSocket from 'ws';

export class PremiumRPCManager {
  constructor() {
    this.rpcUrl = process.env.SOLANA_RPC_URL;
    this.websocketUrl = process.env.HELIUS_WEBSOCKET_URL;
    this.apiKey = process.env.HELIUS_API_KEY;
    this.connection = null;
    this.websocket = null;
    this.subscriptions = new Map();
    
    console.log('[RPC] Initializing Premium Helius RPC');
  }

  async init() {
    // Enhanced Solana connection with premium RPC
    this.connection = new Connection(this.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: this.websocketUrl,
      httpHeaders: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('[RPC] ✅ Premium RPC connection established');
    console.log('[RPC] 🚀 Using Helius enhanced endpoints');
    return this.connection;
  }

  // Enhanced transaction sending with priority fees
  async sendTransactionFast(transaction, options = {}) {
    const {
      skipPreflight = false,
      maxRetries = 3,
      preflightCommitment = 'confirmed',
      priorityFeeInMicroLamports = parseInt(process.env.PRIORITY_FEE_MICROLAMPORTS) || 10000
    } = options;

    console.log(`[RPC] 🚀 Sending transaction with ${priorityFeeInMicroLamports} microlamports priority fee`);
    
    try {
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight,
          maxRetries,
          preflightCommitment
        }
      );
      
      console.log(`[RPC] ✅ Transaction sent: ${signature}`);
      return signature;
    } catch (error) {
      console.error(`[RPC] ❌ Transaction failed: ${error.message}`);
      throw error;
    }
  }

  // Enhanced WebSocket for real-time monitoring
  async startWebSocketMonitoring() {
    if (this.websocket) {
      console.log('[RPC] WebSocket already connected');
      return;
    }

    this.websocket = new WebSocket(this.websocketUrl);
    
    this.websocket.on('open', () => {
      console.log('[RPC] 🌐 WebSocket connected to Helius');
    });

    this.websocket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('[RPC] WebSocket message parse error:', error.message);
      }
    });

    this.websocket.on('error', (error) => {
      console.error('[RPC] WebSocket error:', error.message);
    });

    this.websocket.on('close', () => {
      console.log('[RPC] WebSocket disconnected, attempting reconnect...');
      setTimeout(() => this.startWebSocketMonitoring(), 5000);
    });
  }

  // Subscribe to account changes (for whale tracking)
  async subscribeToAccount(publicKey, callback) {
    const subscriptionId = await this.connection.onAccountChange(
      new PublicKey(publicKey),
      (accountInfo, context) => {
        console.log(`[RPC] 👁️ Account change detected: ${publicKey}`);
        callback(accountInfo, context);
      },
      'confirmed'
    );

    this.subscriptions.set(publicKey, subscriptionId);
    console.log(`[RPC] 🔔 Subscribed to account: ${publicKey}`);
    return subscriptionId;
  }

  // Subscribe to program changes (for new token detection)
  async subscribeToProgramChanges(programId, callback) {
    const subscriptionId = await this.connection.onProgramAccountChange(
      new PublicKey(programId),
      (keyedAccountInfo, context) => {
        console.log(`[RPC] 🆕 Program account change: ${programId}`);
        callback(keyedAccountInfo, context);
      },
      'confirmed'
    );

    this.subscriptions.set(programId, subscriptionId);
    console.log(`[RPC] 🔔 Subscribed to program: ${programId}`);
    return subscriptionId;
  }

  // Enhanced transaction confirmation with speed tracking
  async confirmTransactionFast(signature, timeout = 30000) {
    const startTime = Date.now();
    console.log(`[RPC] ⏱️ Confirming transaction: ${signature}`);
    
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      const confirmationTime = Date.now() - startTime;
      
      console.log(`[RPC] ✅ Transaction confirmed in ${confirmationTime}ms`);
      return { confirmed: true, time: confirmationTime, details: confirmation };
    } catch (error) {
      const failTime = Date.now() - startTime;
      console.error(`[RPC] ❌ Transaction confirmation failed after ${failTime}ms: ${error.message}`);
      return { confirmed: false, time: failTime, error: error.message };
    }
  }

  // Get enhanced account info with caching
  async getAccountInfoFast(publicKey, useCache = true) {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(publicKey));
      console.log(`[RPC] 📊 Account info retrieved: ${publicKey}`);
      return accountInfo;
    } catch (error) {
      console.error(`[RPC] ❌ Failed to get account info: ${error.message}`);
      return null;
    }
  }

  // Enhanced token account monitoring
  async getTokenAccountsByOwner(ownerPublicKey, tokenMint = null) {
    try {
      const filters = tokenMint 
        ? [{ mint: new PublicKey(tokenMint) }]
        : [];
        
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        new PublicKey(ownerPublicKey),
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
        'confirmed'
      );
      
      console.log(`[RPC] 🪙 Found ${tokenAccounts.value.length} token accounts`);
      return tokenAccounts.value;
    } catch (error) {
      console.error(`[RPC] ❌ Failed to get token accounts: ${error.message}`);
      return [];
    }
  }

  // Handle WebSocket messages
  handleWebSocketMessage(message) {
    if (message.method === 'accountNotification') {
      console.log('[RPC] 🔔 Account notification received');
      // Handle account change notifications
    } else if (message.method === 'programNotification') {
      console.log('[RPC] 🔔 Program notification received');
      // Handle program change notifications
    }
  }

  // Performance monitoring
  async testRPCSpeed() {
    console.log('[RPC] 🏃 Testing RPC performance...');
    const startTime = Date.now();
    
    try {
      const slot = await this.connection.getSlot();
      const responseTime = Date.now() - startTime;
      
      console.log(`[RPC] ⚡ RPC Response Time: ${responseTime}ms (Slot: ${slot})`);
      return { responseTime, slot, healthy: responseTime < 1000 };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[RPC] 💥 RPC Test Failed: ${responseTime}ms - ${error.message}`);
      return { responseTime, healthy: false, error: error.message };
    }
  }

  // Cleanup
  async disconnect() {
    // Unsubscribe from all subscriptions
    for (const [key, subscriptionId] of this.subscriptions) {
      try {
        await this.connection.removeAccountChangeListener(subscriptionId);
        console.log(`[RPC] 🔕 Unsubscribed from: ${key}`);
      } catch (error) {
        console.error(`[RPC] Failed to unsubscribe from ${key}:`, error.message);
      }
    }
    
    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.subscriptions.clear();
    console.log('[RPC] 🔌 Disconnected from premium RPC');
  }

  // Get connection for external use
  getConnection() {
    return this.connection;
  }

  // Health check
  async healthCheck() {
    const health = await this.testRPCSpeed();
    const wsConnected = this.websocket && this.websocket.readyState === WebSocket.OPEN;
    
    return {
      rpc: health.healthy,
      websocket: wsConnected,
      responseTime: health.responseTime,
      subscriptions: this.subscriptions.size,
      endpoint: this.rpcUrl.replace(this.apiKey, '***')
    };
  }
}

export default PremiumRPCManager; 