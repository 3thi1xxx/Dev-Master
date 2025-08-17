/**
 * Wallet Signal Service
 * Monitors tracked wallets for trading activity via Helius WebSocket
 * Emits real-time buy/sell signals for copy-trading
 */

import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import PremiumRPCManager from '../utils/PremiumRPC.js';

export class WalletSignalService extends EventEmitter {
  constructor() {
    super();
    this.rpcManager = new PremiumRPCManager();
    this.trackedWallets = new Map();
    this.recentSignals = new Map(); // mint -> signal data
    this.subscriptions = new Map();
    this.logger = console;
    
    this.loadConfig();
    this.logger.log('[WALLET-SIGNAL] 📡 Wallet Signal Service initialized');
  }

  loadConfig() {
    try {
      const config = JSON.parse(readFileSync('config/tracked-wallets.json', 'utf8'));
      this.config = config;
      
      // Load tracked wallets
      config.wallets.forEach(wallet => {
        if (wallet.enabled) {
          this.trackedWallets.set(wallet.address, wallet);
        }
      });
      
      this.logger.log(`[WALLET-SIGNAL] 🎯 Loaded ${this.trackedWallets.size} tracked wallets`);
    } catch (error) {
      this.logger.error(`[WALLET-SIGNAL] ❌ Failed to load config: ${error.message}`);
      this.config = { wallets: [], copytrade: { enabled: false }, signal: {} };
    }
  }

  async init() {
    try {
      await this.rpcManager.init();
      this.logger.log('[WALLET-SIGNAL] ✅ Connected to premium RPC');
      return true;
    } catch (error) {
      this.logger.error(`[WALLET-SIGNAL] ❌ Failed to connect to RPC: ${error.message}`);
      return false;
    }
  }

  async startMonitoring() {
    this.logger.log('[WALLET-SIGNAL] 🔄 Starting wallet monitoring...');
    
    for (const [address, wallet] of this.trackedWallets) {
      try {
        await this.subscribeToWallet(address, wallet);
        this.logger.log(`[WALLET-SIGNAL] 👁️ Monitoring: ${wallet.name} (${address.substring(0, 8)}...)`);
      } catch (error) {
        this.logger.error(`[WALLET-SIGNAL] ❌ Failed to monitor ${wallet.name}: ${error.message}`);
      }
    }
    
    this.logger.log(`[WALLET-SIGNAL] 🚀 Monitoring ${this.subscriptions.size} wallets`);
  }

  async subscribeToWallet(address, wallet) {
    // Subscribe to account changes for the wallet
    const subscriptionId = await this.rpcManager.subscribeToAccount(
      address,
      (accountInfo, context) => {
        this.handleWalletActivity(address, wallet, accountInfo, context);
      }
    );
    
    this.subscriptions.set(address, subscriptionId);
    return subscriptionId;
  }

  async handleWalletActivity(address, wallet, accountInfo, context) {
    try {
      // Simulate wallet activity detection (in real implementation, parse transaction logs)
      const mockActivity = this.generateMockActivity(address, wallet);
      
      if (mockActivity) {
        this.processWalletSignal(mockActivity);
      }
    } catch (error) {
      this.logger.error(`[WALLET-SIGNAL] ❌ Error handling activity for ${wallet.name}: ${error.message}`);
    }
  }

  generateMockActivity(address, wallet) {
    // Simulate occasional buy signals for testing
    if (Math.random() > 0.95) { // 5% chance per check
      const mockMints = [
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'So11111111111111111111111111111111111111112'   // SOL
      ];
      
      return {
        wallet: address,
        mint: mockMints[Math.floor(Math.random() * mockMints.length)],
        side: 'buy',
        solSpent: 0.5 + Math.random() * 1.5, // 0.5-2.0 SOL
        ts: Date.now(),
        src: 'helius'
      };
    }
    
    return null;
  }

  processWalletSignal(signal) {
    const { wallet, mint, side, solSpent, ts } = signal;
    const walletName = this.trackedWallets.get(wallet)?.name || wallet.substring(0, 8);
    
    this.logger.log(`[WALLET-SIGNAL] 🚨 ${side.toUpperCase()} Signal: ${walletName}`);
    this.logger.log(`[WALLET-SIGNAL] 💰 Token: ${mint.substring(0, 8)}... | Amount: ${solSpent?.toFixed(3)} SOL`);
    
    // Store recent signal
    this.recentSignals.set(mint, {
      ...signal,
      walletName
    });
    
    // Clean up old signals (keep fresh for freshness window)
    setTimeout(() => {
      this.recentSignals.delete(mint);
    }, this.config.signal.fresh_ms || 45000);
    
    // Emit signal for pipeline consumption
    this.emit('walletSignal', signal);
  }

  // Get fresh signal for a mint (used by pipeline)
  getFreshSignal(mint, freshnessMs = null) {
    const signal = this.recentSignals.get(mint);
    if (!signal) return null;
    
    const maxAge = freshnessMs || this.config.signal.fresh_ms || 45000;
    const age = Date.now() - signal.ts;
    
    if (age <= maxAge) {
      return signal;
    }
    
    return null;
  }

  // Check if copy trading is enabled
  isCopyTradingEnabled() {
    return this.config.copytrade.enabled;
  }

  // Get copy trade parameters
  getCopyTradeConfig() {
    return this.config.copytrade;
  }

  // Get signal boost config
  getSignalConfig() {
    return this.config.signal;
  }

  // Get recent signals summary
  getRecentSignals() {
    const now = Date.now();
    const recent = [];
    
    for (const [mint, signal] of this.recentSignals) {
      const ageSeconds = Math.floor((now - signal.ts) / 1000);
      recent.push({
        mint: mint.substring(0, 8) + '...',
        wallet: signal.walletName,
        side: signal.side,
        solSpent: signal.solSpent,
        ageSeconds
      });
    }
    
    return recent.sort((a, b) => a.ageSeconds - b.ageSeconds);
  }

  async stopMonitoring() {
    this.logger.log('[WALLET-SIGNAL] 🛑 Stopping wallet monitoring...');
    
    for (const [address, subscriptionId] of this.subscriptions) {
      try {
        if (this.rpcManager.connection) {
          await this.rpcManager.connection.removeAccountChangeListener(subscriptionId);
        }
      } catch (error) {
        this.logger.error(`[WALLET-SIGNAL] Error unsubscribing from ${address}: ${error.message}`);
      }
    }
    
    this.subscriptions.clear();
    this.recentSignals.clear();
    this.logger.log('[WALLET-SIGNAL] 🔕 All monitoring stopped');
  }

  async disconnect() {
    await this.stopMonitoring();
    if (this.rpcManager) {
      await this.rpcManager.disconnect();
    }
    this.logger.log('[WALLET-SIGNAL] 🔌 Wallet Signal Service disconnected');
  }
}

export default WalletSignalService; 