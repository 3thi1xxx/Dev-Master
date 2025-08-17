import { EventEmitter } from 'node:events';
import { sharedWebSocketManager } from './SharedWebSocketManager.js';
import { axiomTokenManager } from '../core/AxiomTokenManager.js'; // Core->Services pattern

/**
 * Enhanced Data Processor for Axiom WebSocket Streams
 * Processes data from both Cluster7 and Eucalyptus WebSockets
 * Extracts token addresses from a: rooms (THE KEY DISCOVERY!)
 * Created: August 17, 2025
 */
export class EnhancedDataProcessor extends EventEmitter {
  constructor() {
    super();
    
    // Token mapping: address -> enriched data
    this.tokenMap = new Map();
    
    // Pair mapping: pair -> token address
    this.pairToTokenMap = new Map();
    
    // Market statistics
    this.marketStats = {
      lighthouse: null,
      solPrice: 0,
      priorityFee: 0,
      lastUpdate: Date.now()
    };
    
    // Transaction types (CORRECTED from discoveries)
    this.TX_TYPES = {
      BUY: 2,  // Not 0 as previously thought
      SELL: 4  // Not 1 as previously thought
    };
    
    // Performance tracking
    this.stats = {
      tokensDiscovered: 0,
      transactionsProcessed: 0,
      hotOpportunities: 0,
      startTime: Date.now()
    };
    
    this.logger = console; // Match existing pattern
  }
  
  initialize() {
    console.log('[ENHANCED] 🚀 Initializing Enhanced Data Processor...');
    this.setupCluster7Handlers();
    this.setupEucalyptusHandlers();
    console.log('[ENHANCED] ✅ Data processor ready for token address extraction!');
  }
  
  setupCluster7Handlers() {
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (!url.includes('cluster7')) return;
      
      try {
        // Handle different room types
        if (data.room === 'lighthouse') {
          this.processLighthouseStats(data.content);
        } else if (data.room === 'sol_price') {
          this.marketStats.solPrice = data.content;
          this.emit('sol-price-update', data.content);
          console.log(`[ENHANCED] 💵 SOL Price: $${data.content}`);
        } else if (data.room === 'sol-priority-fee') {
          this.marketStats.priorityFee = data.content;
          this.emit('priority-fee-update', data.content);
          console.log(`[ENHANCED] ⛽ Priority Fee: ${data.content} SOL`);
        } else if (data.room === 'block_hash') {
          this.emit('block-hash', data.content);
        }
      } catch (error) {
        console.error('[ENHANCED] Error processing Cluster7 message:', error.message);
      }
    });
  }
  
  setupEucalyptusHandlers() {
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (!url.includes('eucalyptus')) return;
      
      try {
        // Process transaction arrays (28 fields discovered)
        if (Array.isArray(data) && data.length === 28) {
          this.processTransactionArray(data);
        }
        
        // Handle room-based messages
        if (data.room) {
          this.processRoomMessage(data);
        }
      } catch (error) {
        console.error('[ENHANCED] Error processing Eucalyptus message:', error.message);
      }
    });
  }
  
  processTransactionArray(tx) {
    const [
      timestamp, signature, hash, type,
      wallet, tokenAddress, orderId,
      solAmount, tokenAmount, balance,
      mcapSol, mcapUsd, price, direction,
      poolCreated, liquidity, unknown,
      priceChange, name, symbol, image,
      decimals, supply, protocol, flag,
      liquidityAfter, metric1, metric2
    ] = tx;
    
    // Extract token data
    const tokenData = {
      address: tokenAddress,
      name: name !== '____________' ? name : null,
      symbol: symbol !== '__________' ? symbol : null,
      price: price,
      priceUsd: price * this.marketStats.solPrice,
      marketCapSol: mcapSol,
      marketCapUsd: mcapUsd,
      liquidity: liquidity,
      liquidityAfter: liquidityAfter,
      priceChange: priceChange,
      supply: supply,
      decimals: decimals,
      protocol: protocol,
      image: image,
      lastUpdate: timestamp
    };
    
    // Store token data
    this.tokenMap.set(tokenAddress, tokenData);
    this.stats.transactionsProcessed++;
    
    // Emit transaction event
    this.emit('transaction', {
      type: type === this.TX_TYPES.BUY ? 'buy' : 'sell',
      wallet: wallet,
      token: tokenData,
      solAmount: solAmount,
      tokenAmount: tokenAmount,
      timestamp: timestamp,
      signature: signature
    });
    
    // Log significant transactions
    if (solAmount > 0.1) { // Only log transactions > 0.1 SOL
      console.log(`[ENHANCED] ${type === this.TX_TYPES.BUY ? '🟢 BUY' : '🔴 SELL'}: ${tokenData.symbol || tokenAddress.slice(0,8)} @ ${price.toFixed(6)} SOL (${solAmount.toFixed(3)} SOL)`);
    }
    
    // Check for opportunities
    this.checkForOpportunity(tokenData, type);
  }
  
  processRoomMessage(data) {
    const room = data.room;
    
    // Analytics room - CRITICAL: Contains token address!
    if (room && room.startsWith('a:')) {
      const tokenAddress = room.split(':')[1];
      if (!data.content || !Array.isArray(data.content)) return;
      
      const [pairAddress, ...metrics] = data.content;
      
      // Map pair to token - THIS SOLVES THE ADDRESS PROBLEM!
      this.pairToTokenMap.set(pairAddress, tokenAddress);
      this.stats.tokensDiscovered++;
      
      console.log(`[ENHANCED] 🎯 TOKEN DISCOVERED #${this.stats.tokensDiscovered}: ${tokenAddress} -> ${pairAddress}`);
      
      // Emit token discovery
      this.emit('token-discovered', {
        tokenAddress: tokenAddress,
        pairAddress: pairAddress,
        metrics: metrics
      });
    }
    
    // Transaction feed rooms (f: and t:)
    else if (room && (room.startsWith('f:') || room.startsWith('t:'))) {
      const pairAddress = room.split(':')[1];
      
      // Process as transaction if it's an array
      if (Array.isArray(data.content)) {
        // Get token address from mapping
        const tokenAddress = this.pairToTokenMap.get(pairAddress);
        
        // Process the transaction data
        if (data.content.length >= 17) {
          const [
            txSig, wallet, timestamp, txType,
            solAmount, tokenAmount, price, mcapSol,
            mcapUsd, liquidity, supply
          ] = data.content;
          
          this.emit('transaction-feed', {
            room: room.charAt(0), // 'f' or 't'
            pairAddress,
            tokenAddress,
            type: txType === 0 || txType === 2 ? 'buy' : 'sell',
            wallet,
            solAmount,
            price,
            liquidity,
            timestamp
          });
        }
      }
    }
    
    // Balance tracking (b- rooms)
    else if (room && room.startsWith('b-')) {
      const wallet = room.substring(2);
      const balance = data.content;
      
      this.emit('wallet-balance', {
        wallet: wallet,
        balance: balance
      });
      
      if (balance > 100) {
        console.log(`[ENHANCED] 🐋 Whale balance update: ${wallet.slice(0,8)}... = ${balance.toFixed(2)} SOL`);
      }
    }
    
    // Twitter feed
    else if (room === 'twitter_feed_v2') {
      this.emit('twitter-update', data.content);
    }
  }
  
  checkForOpportunity(tokenData, transactionType) {
    // Hot opportunity detection (matching existing FastMemeAnalyzer logic)
    const isHot = 
      tokenData.liquidity > 50 && // Good liquidity (50+ SOL)
      tokenData.priceChange > 10 && // Rising price (>10%)
      transactionType === this.TX_TYPES.BUY && // Buy pressure
      tokenData.marketCapUsd < 1000000; // Under $1M market cap
    
    if (isHot) {
      this.stats.hotOpportunities++;
      this.emit('hot-opportunity', tokenData);
      console.log(`[ENHANCED] 🔥 HOT OPPORTUNITY #${this.stats.hotOpportunities}: ${tokenData.symbol || tokenData.address} - Liq: ${tokenData.liquidity.toFixed(1)} SOL, +${tokenData.priceChange.toFixed(1)}%`);
    }
  }
  
  processLighthouseStats(stats) {
    if (!stats || !stats['1h']) return;
    
    this.marketStats.lighthouse = stats;
    
    // Find hottest protocol
    const protocols = Object.keys(stats['1h']).filter(k => k !== 'All');
    const hottest = protocols.reduce((best, protocol) => {
      const data = stats['1h'][protocol];
      const volumePct = data?.totalVolumePct || 0;
      return volumePct > (best.volumePct || 0) ? 
        { protocol, volumePct, volume: data?.totalVolume || 0 } : best;
    }, {});
    
    // Calculate overall market metrics
    const overall = stats['1h'].All || {};
    const marketHealth = {
      overall: {
        totalVolume: overall.totalVolume || 0,
        totalVolumePct: overall.totalVolumePct || 0,
        totalTraders: overall.totalTraders || 0,
        totalTransactions: overall.totalTransactions || 0,
        tokensCreated: overall.totalTokensCreated || 0
      },
      hottestProtocol: hottest,
      timestamp: Date.now()
    };
    
    this.emit('market-stats', marketHealth);
    
    console.log(`[ENHANCED] 📊 Market Update - Volume: $${(marketHealth.overall.totalVolume / 1000000).toFixed(1)}M (${marketHealth.overall.totalVolumePct > 0 ? '+' : ''}${marketHealth.overall.totalVolumePct.toFixed(1)}%) | Hot: ${hottest.protocol} (+${hottest.volumePct?.toFixed(1)}%)`);
  }
  
  getStats() {
    const uptime = (Date.now() - this.stats.startTime) / 1000;
    return {
      ...this.stats,
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      tokensInMemory: this.tokenMap.size,
      pairMappings: this.pairToTokenMap.size,
      solPrice: this.marketStats.solPrice,
      priorityFee: this.marketStats.priorityFee
    };
  }
}

// Export singleton instance (matching existing pattern)
export const enhancedDataProcessor = new EnhancedDataProcessor(); 