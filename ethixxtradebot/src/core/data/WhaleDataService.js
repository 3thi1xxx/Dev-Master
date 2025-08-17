#!/usr/bin/env node
/**
 * Whale Data Service
 * Connects to Eucalyptus WebSocket to track whale transactions
 * Integrates whale activity with AI trading system
 */

import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { sharedWebSocketManager } from '../../services/SharedWebSocketManager.js';

export class WhaleDataService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      autoConnect: options.autoConnect !== false,
      whaleFeedUrl: 'wss://eucalyptus.axiom.trade/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      whaleActivityCache: 300000, // 5 minutes
      minWhaleTradeSize: options.minWhaleTradeSize || 0.1, // SOL
      copyTradingEnabled: options.copyTradingEnabled !== false // ENABLE copy trading by default
    };
    
    // State tracking
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.trackedWallets = new Set();
    this.whaleActivity = new Map(); // wallet -> recent activity
    this.whaleStats = new Map(); // wallet -> performance stats
    
    // Load tracked wallets
    this.loadTrackedWallets();
    
    console.log('🐋 WHALE DATA SERVICE INITIALIZED');
    console.log(`📋 Tracking ${this.trackedWallets.size} whale wallets`);
    console.log(`🔗 WebSocket: ${this.config.whaleFeedUrl}`);
  }
  
  /**
   * Load tracked wallets from config
   */
  loadTrackedWallets() {
    try {
      const config = JSON.parse(readFileSync('config/tracked-wallets.json', 'utf8'));

      for (const wallet of config.wallets) {
        if (wallet.enabled) {
          this.trackedWallets.add(wallet.address);
          this.whaleStats.set(wallet.address, {
            name: wallet.name,
            trades: 0,
            buys: 0,
            sells: 0,
            totalProfit: 0,
            successRate: 0,
            lastActivity: null,
            recentTrades: [],
            priority: wallet.priority || 'normal',
            notes: wallet.notes || 'No notes available'
          });
          console.log(`[WHALE] 🐋 Wallet Loaded: ${wallet.name} (${wallet.address}) - Priority: ${wallet.priority || 'normal'}`);
        }
      }

      console.log(`[WHALE] ✅ Loaded ${this.trackedWallets.size} tracked wallets`);
    } catch (error) {
      console.log(`[WHALE] ⚠️ Could not load tracked wallets: ${error.message}`);
    }
  }
  
  /**
   * Start whale data monitoring
   */
  async start() {
    if (this.isConnected) {
      console.log('[WHALE] ⚠️ Already connected');
      return;
    }
    
    console.log('[WHALE] 🚀 Starting whale data monitoring...');
    
    try {
      // Connect to Eucalyptus WebSocket
      const connection = await sharedWebSocketManager.getSharedConnection(this.config.whaleFeedUrl);
      console.log('[WHALE] ✅ Connected to Eucalyptus whale feed');
      
      // Subscribe to whale feed
      const subscription = { action: 'join', room: 'whale_feed' };
      connection.send(JSON.stringify(subscription));
      console.log('[WHALE] 📡 Subscribed to whale_feed room');
      
      // Listen for whale messages
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('eucalyptus')) {
          this.handleWhaleMessage(data);
        }
      });
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('[WHALE] 🎯 Whale monitoring ACTIVE');
      this.emit('started');
      
    } catch (error) {
      console.log(`[WHALE] ❌ Failed to start: ${error.message}`);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handle incoming whale transaction messages
   */
  handleWhaleMessage(data) {
    try {
      // Check if it's a whale transaction (array format)
      if (Array.isArray(data) && data.length >= 25) {
        const [
          timestamp,
          walletAddress,
          txHash,
          actionType,
          platform,
          tokenAddress,
          poolId,
          price,
          volume,
          marketCap,
          liquidity,
          change24h,
          action,
          buyTime,
          buyPrice,
          sellPrice,
          profitLoss,
          tokenName,
          tokenSymbol,
          imageUrl,
          decimals,
          totalSupply,
          platformType,
          verified,
          currentPrice,
          profitPercent,
          riskLevel
        ] = data;
        
        // Check if this is a tracked whale
        if (this.trackedWallets.has(walletAddress)) {
          this.processWhaleTransaction({
            timestamp,
            walletAddress,
            txHash,
            actionType,
            platform,
            tokenAddress,
            poolId,
            price,
            volume,
            marketCap,
            liquidity,
            change24h,
            action,
            buyTime,
            buyPrice,
            sellPrice,
            profitLoss,
            tokenName,
            tokenSymbol,
            imageUrl,
            decimals,
            totalSupply,
            platformType,
            verified,
            currentPrice,
            profitPercent,
            riskLevel
          });
        }
      }
    } catch (error) {
      console.log(`[WHALE] ❌ Error processing whale message: ${error.message}`);
    }
  }
  
  /**
   * Process whale transaction data
   */
  processWhaleTransaction(tx) {
    const whaleKey = tx.walletAddress.substring(0, 8);
    const whaleData = this.whaleStats.get(tx.walletAddress);
    const whaleName = whaleData?.name || 'Unknown';
    const whalePriority = whaleData?.priority || 'normal';
    const whaleNotes = whaleData?.notes || 'No notes available';

    console.log(`[WHALE] 🐋 ${whaleName} (${whaleKey}...) ${String(tx.action).toUpperCase()} ${tx.tokenSymbol}`);
    console.log(`[WHALE]    💰 Amount: ${tx.volume.toFixed(4)} SOL | Price: $${tx.price.toFixed(6)}`);
    console.log(`[WHALE]    📊 P&L: ${tx.profitLoss > 0 ? '+' : ''}${tx.profitLoss.toFixed(4)} SOL (${tx.profitPercent}%)`);
    console.log(`[WHALE]    📝 Priority: ${whalePriority} | Notes: ${whaleNotes}`);

    // Update whale stats
    this.updateWhaleStats(tx);

    // Store recent activity
    this.storeWhaleActivity(tx);

    // Emit whale activity event
    this.emit('whaleActivity', {
      type: 'transaction',
      whale: {
        address: tx.walletAddress,
        name: whaleName,
        priority: whalePriority,
        notes: whaleNotes
      },
      transaction: tx,
      timestamp: Date.now()
    });

    // Check for copy trading opportunity
    if (this.config.copyTradingEnabled && tx.action === 'buy') {
      this.emit('copyTradeOpportunity', {
        whale: tx.walletAddress,
        token: tx.tokenAddress,
        symbol: tx.tokenSymbol,
        price: tx.price,
        volume: tx.volume,
        confidence: this.calculateWhaleConfidence(tx.walletAddress)
      });
    }
  }
  
  /**
   * Update whale performance statistics
   */
  updateWhaleStats(tx) {
    const stats = this.whaleStats.get(tx.walletAddress);
    if (!stats) return;
    
    stats.trades++;
    stats.lastActivity = Date.now();
    
    if (tx.action === 'buy') {
      stats.buys++;
    } else if (tx.action === 'sell') {
      stats.sells++;
      
      // Calculate success rate
      if (tx.profitLoss > 0) {
        stats.totalProfit += tx.profitLoss;
      }
      
      const completedTrades = stats.buys + stats.sells;
      if (completedTrades > 0) {
        stats.successRate = (stats.totalProfit > 0 ? 1 : 0) / completedTrades;
      }
    }
    
    // Store recent trade
    stats.recentTrades.unshift({
      token: tx.tokenSymbol,
      action: tx.action,
      profit: tx.profitLoss,
      timestamp: tx.timestamp
    });
    
    // Keep only last 10 trades
    if (stats.recentTrades.length > 10) {
      stats.recentTrades = stats.recentTrades.slice(0, 10);
    }
  }
  
  /**
   * Store whale activity for analysis
   */
  storeWhaleActivity(tx) {
    const key = `${tx.walletAddress}_${tx.tokenAddress}`;
    const now = Date.now();
    
    this.whaleActivity.set(key, {
      wallet: tx.walletAddress,
      token: tx.tokenAddress,
      symbol: tx.tokenSymbol,
      lastAction: tx.action,
      lastPrice: tx.price,
      lastVolume: tx.volume,
      profitLoss: tx.profitLoss,
      timestamp: now,
      whaleName: this.whaleStats.get(tx.walletAddress)?.name || 'Unknown'
    });
    
    // Clean old activity
    for (const [activityKey, activity] of this.whaleActivity.entries()) {
      if (now - activity.timestamp > this.config.whaleActivityCache) {
        this.whaleActivity.delete(activityKey);
      }
    }
  }
  
  /**
   * Check if whales are active in a specific token
   */
  async checkTokenActivity(tokenAddress) {
    const activeWhales = [];
    let totalVolume = 0;
    
    // Check recent whale activity for this token
    for (const [key, activity] of this.whaleActivity.entries()) {
      if (activity.token === tokenAddress && 
          Date.now() - activity.timestamp < 300000) { // Last 5 minutes
        activeWhales.push({
          whale: activity.wallet,
          name: activity.whaleName,
          action: activity.lastAction,
          volume: activity.lastVolume,
          timestamp: activity.timestamp
        });
        totalVolume += activity.lastVolume;
      }
    }
    
    return {
      whaleCount: activeWhales.length,
      totalVolume: totalVolume,
      entries: activeWhales
    };
  }
  
  /**
   * Calculate whale confidence score
   */
  calculateWhaleConfidence(walletAddress) {
    const stats = this.whaleStats.get(walletAddress);
    if (!stats) return 0.5;
    
    // Base confidence on success rate and recent activity
    let confidence = stats.successRate;
    
    // Boost for recent activity
    if (stats.lastActivity && Date.now() - stats.lastActivity < 300000) { // 5 minutes
      confidence += 0.2;
    }
    
    // Boost for high trade volume
    if (stats.trades > 10) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }
  
  /**
   * Get whale activity for a specific token
   */
  getWhaleActivityForToken(tokenAddress) {
    const activities = [];
    
    for (const [key, activity] of this.whaleActivity.entries()) {
      if (activity.token === tokenAddress) {
        activities.push(activity);
      }
    }
    
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get all recent whale activity
   */
  getRecentWhaleActivity(limit = 20) {
    const activities = Array.from(this.whaleActivity.values());
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Get whale statistics
   */
  getWhaleStats() {
    const stats = {};
    
    for (const [address, whaleStats] of this.whaleStats.entries()) {
      stats[address] = {
        ...whaleStats,
        confidence: this.calculateWhaleConfidence(address)
      };
    }
    
    return stats;
  }
  
  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('[WHALE] ❌ Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[WHALE] 🔄 Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.start();
    }, this.config.reconnectInterval);
  }
  
  /**
   * Stop whale monitoring
   */
  stop() {
    this.isConnected = false;
    console.log('[WHALE] 🛑 Whale monitoring stopped');
    this.emit('stopped');
  }
}

// Export singleton instance
export const whaleDataService = new WhaleDataService();