/**
 * WebSocket Data Bridge - Connects all real-time data sources to the GUI
 * Integrates Cluster7, Birdeye, and internal analyzers
 */

import { EventEmitter } from 'node:events';
import { sharedWebSocketManager } from '../services/SharedWebSocketManager.js';
import { birdeyeWebSocketManager } from '../services/BirdeyeWebSocketManager.js';
import { whaleDataService } from '../services/WhaleDataService.js';
import { enhancedDataProcessor } from '../services/EnhancedDataProcessor.js'; // NEW IMPORT

class WebSocketDataBridge extends EventEmitter {
  constructor() {
    super();
    
    // Add enhanced processor
    this.enhancedProcessor = enhancedDataProcessor; // NEW
    
    this.stats = {
      cluster7Messages: 0,
      birdeyeMessages: 0,
      eucalyptusMessages: 0,
      opportunitiesDetected: 0,
      tokensTracking: new Set(),
      whalesTracking: new Set(),
      solPrice: 0, // NEW
      priorityFee: 0, // NEW
      marketStats: null, // NEW
      tokenAddressesDiscovered: new Set(), // NEW
      lastUpdate: Date.now()
    };
    
    // Track momentum for top tokens
    this.momentumTracker = new Map(); // symbol -> momentum data
    this.hotTokens = new Map(); // symbol -> hot token data
    this.surgeOpportunities = [];
    
    console.log('🌉 WebSocket Data Bridge initializing...');
  }
  
  async initialize(io) {
    this.io = io;
    
    // Initialize enhanced processor - NEW
    this.enhancedProcessor.initialize();
    this.setupEnhancedListeners();
    
    // Connect to Cluster7 for new token discovery
    this.setupCluster7Connection();
    
    // Connect to Birdeye for detailed token data
    this.setupBirdeyeConnection();
    
    // Setup whale tracking (simplified for now)
    this.setupWhaleTracking();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('✅ WebSocket Data Bridge initialized with enhancements');
  }
  
  setupCluster7Connection() {
    // Listen for new pairs from Cluster7 via SharedWebSocketManager
    sharedWebSocketManager.on('cluster7:new_pair', (data) => {
      this.stats.cluster7Messages++;
      
      const tokenData = {
        symbol: data.symbol || data.baseSymbol,
        address: data.baseToken || data.address,
        liquidity: data.liquidityUSD || data.liquidity || 0,
        volume: data.volumeUSD || 0,
        priceChange: data.priceChange24h || 0,
        source: 'cluster7',
        timestamp: Date.now()
      };
      
      // Track this token
      this.stats.tokensTracking.add(tokenData.symbol);
      
      // Update momentum tracker
      this.updateMomentumTracker(tokenData);
      
      // Check if it's a surge opportunity
      if (this.isSurgeOpportunity(tokenData)) {
        this.addSurgeOpportunity(tokenData);
      }
      
      // Emit to frontend
      this.io.emit('new-token-detected', tokenData);
      this.io.emit('momentum-update', {
        tokens: this.getTopMomentumTokens(),
        timestamp: Date.now()
      });
      
      console.log(`[CLUSTER7] New token: ${tokenData.symbol} - $${tokenData.liquidity} liquidity`);
    });
    
    // Listen for price updates
    sharedWebSocketManager.on('cluster7:price_update', (data) => {
      this.handlePriceUpdate(data, 'cluster7');
    });
  }
  
  setupEnhancedListeners() {
    // Token discovery with address - THE KEY FEATURE!
    this.enhancedProcessor.on('token-discovered', (data) => {
      console.log(`🎯 TOKEN ADDRESS EXTRACTED: ${data.tokenAddress}`);
      
      this.stats.tokenAddressesDiscovered.add(data.tokenAddress);
      
      // Now we can enrich with external APIs!
      this.enrichTokenData(data.tokenAddress, data.pairAddress);
      
      // Emit to GUI
      this.io.emit('token-discovered', data);
    });
    
    // Transaction feed
    this.enhancedProcessor.on('transaction', (tx) => {
      // Update stats
      if (tx.type === 'buy') {
        this.stats.buyTransactions = (this.stats.buyTransactions || 0) + 1;
      } else {
        this.stats.sellTransactions = (this.stats.sellTransactions || 0) + 1;
      }
      
      // Emit to GUI with full context
      this.io.emit('live-transaction', {
        ...tx,
        solPrice: this.stats.solPrice,
        usdValue: tx.solAmount * this.stats.solPrice
      });
    });
    
    // Hot opportunities
    this.enhancedProcessor.on('hot-opportunity', (token) => {
      this.stats.opportunitiesDetected++;
      
      // Emit to GUI with urgency
      this.io.emit('hot-opportunity', {
        token: token,
        urgency: 'high',
        timestamp: Date.now()
      });
    });
    
    // Market stats
    this.enhancedProcessor.on('market-stats', (stats) => {
      this.stats.marketStats = stats;
      this.io.emit('market-update', stats);
    });
    
    // SOL price updates
    this.enhancedProcessor.on('sol-price-update', (price) => {
      this.stats.solPrice = price;
      this.io.emit('sol-price', price);
    });
    
    // Priority fee updates
    this.enhancedProcessor.on('priority-fee-update', (fee) => {
      this.stats.priorityFee = fee;
      this.io.emit('priority-fee', fee);
    });
    
    // Whale balance updates
    this.enhancedProcessor.on('wallet-balance', (data) => {
      if (data.balance > 100) { // 100+ SOL = whale
        this.stats.whalesTracking.add(data.wallet);
        this.io.emit('whale-update', data);
      }
    });
    
    console.log('✅ Enhanced listeners configured');
  }
  
  async enrichTokenData(tokenAddress, pairAddress) {
    try {
      // Use existing Birdeye service if available
      if (this.birdeyeWebSocketManager) {
        // Subscribe to token for real-time updates
        await birdeyeWebSocketManager.subscribeToToken(tokenAddress);
      }
      
      const enriched = {
        tokenAddress,
        pairAddress,
        enrichedAt: Date.now()
      };
      
      this.io.emit('token-enriched', enriched);
      
    } catch (error) {
      console.error('[BRIDGE] Failed to enrich token:', error.message);
    }
  }
  
  setupBirdeyeConnection() {
    // Listen for detailed token data from Birdeye
    birdeyeWebSocketManager.on('token_update', (data) => {
      this.stats.birdeyeMessages++;
      
      const enrichedData = {
        symbol: data.symbol,
        address: data.address,
        price: data.price,
        priceChange24h: data.priceChange24h,
        volume24h: data.volume24h,
        liquidity: data.liquidity,
        holders: data.holders,
        buyTxns: data.buyTxns24h,
        sellTxns: data.sellTxns24h,
        buyVolume: data.buyVolume24h,
        sellVolume: data.sellVolume24h,
        source: 'birdeye',
        timestamp: Date.now()
      };
      
      // Calculate buy/sell ratio
      enrichedData.buySellRatio = enrichedData.buyVolume / (enrichedData.sellVolume || 1);
      
      // Update hot tokens if momentum is high
      if (Math.abs(enrichedData.priceChange24h) > 10) {
        this.updateHotTokens(enrichedData);
      }
      
      // Emit enriched data
      this.io.emit('token-enriched-data', enrichedData);
      
      // Update price chart
      this.io.emit('price-update', {
        symbol: enrichedData.symbol,
        price: enrichedData.price,
        momentum: enrichedData.priceChange24h,
        timestamp: Date.now()
      });
    });
    
    // Listen for whale transactions
    birdeyeWebSocketManager.on('whale_transaction', (data) => {
      this.handleWhaleTransaction(data);
    });
  }
  
  setupWhaleTracking() {
    // Simplified whale tracking - uses existing whale data service
    if (whaleDataService) {
      whaleDataService.on('whale_activity', (data) => {
      this.stats.eucalyptusMessages++;
      this.stats.whalesTracking.add(data.wallet);
      
      const whaleData = {
        wallet: data.wallet,
        action: data.type, // 'buy' or 'sell'
        token: data.token,
        amount: data.amount,
        value: data.valueUSD,
        timestamp: Date.now()
      };
      
      // Emit whale activity
      this.io.emit('whale-activity', whaleData);
      
      // If it's a significant buy, mark as opportunity
      if (whaleData.action === 'buy' && whaleData.value > 1000) {
        this.io.emit('whale-buy-signal', {
          token: whaleData.token,
          whaleWallet: whaleData.wallet,
          amount: whaleData.value,
          confidence: this.calculateWhaleConfidence(whaleData)
        });
      }
      
        console.log(`[WHALE] Whale ${whaleData.action}: ${whaleData.token} - $${whaleData.value}`);
      });
      
      // Listen for profitable wallet discoveries (if available)
      whaleDataService.on('profitable_wallet', (data) => {
        const discovery = {
          wallet: data.address,
          winRate: data.winRate,
          pnl24h: data.pnl24h,
          totalVolume: data.totalVolume,
          timestamp: Date.now()
        };
        
        // Auto-add if win rate > 70%
        if (discovery.winRate > 0.7) {
          whaleDataService.addTrackedWallet(discovery.wallet);
          console.log(`[WHALE] Auto-added profitable wallet: ${discovery.wallet} (${discovery.winRate * 100}% win rate)`);
        }
        
        this.io.emit('whale-discovered', discovery);
      });
    }
  }
  
  updateMomentumTracker(tokenData) {
    const momentum = {
      symbol: tokenData.symbol,
      priceChange: tokenData.priceChange || 0,
      volume: tokenData.volume || 0,
      liquidity: tokenData.liquidity || 0,
      score: this.calculateMomentumScore(tokenData),
      timestamp: Date.now()
    };
    
    this.momentumTracker.set(tokenData.symbol, momentum);
    
    // Keep only top 100 tokens
    if (this.momentumTracker.size > 100) {
      const sorted = Array.from(this.momentumTracker.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 100);
      
      this.momentumTracker = new Map(sorted);
    }
  }
  
  updateHotTokens(tokenData) {
    this.hotTokens.set(tokenData.symbol, {
      symbol: tokenData.symbol,
      priceChange: tokenData.priceChange24h,
      volume: tokenData.volume24h,
      holders: tokenData.holders,
      buySellRatio: tokenData.buySellRatio,
      timestamp: Date.now()
    });
    
    // Keep only top 20 hot tokens
    if (this.hotTokens.size > 20) {
      const sorted = Array.from(this.hotTokens.entries())
        .sort((a, b) => Math.abs(b[1].priceChange) - Math.abs(a[1].priceChange))
        .slice(0, 20);
      
      this.hotTokens = new Map(sorted);
    }
    
    // Emit hot tokens update
    this.io.emit('hot-tokens-update', Array.from(this.hotTokens.values()));
  }
  
  isSurgeOpportunity(tokenData) {
    return (
      tokenData.liquidity > 10000 && // Min $10k liquidity
      tokenData.volume > 5000 && // Min $5k volume
      tokenData.priceChange > 5 // Min 5% gain
    );
  }
  
  addSurgeOpportunity(tokenData) {
    const opportunity = {
      symbol: tokenData.symbol,
      address: tokenData.address,
      liquidity: tokenData.liquidity,
      volume: tokenData.volume,
      priceChange: tokenData.priceChange,
      confidence: this.calculateConfidence(tokenData),
      timestamp: Date.now()
    };
    
    this.surgeOpportunities.unshift(opportunity);
    
    // Keep only last 10 surge opportunities
    if (this.surgeOpportunities.length > 10) {
      this.surgeOpportunities = this.surgeOpportunities.slice(0, 10);
    }
    
    this.stats.opportunitiesDetected++;
    
    // Emit surge opportunity
    this.io.emit('surge-opportunity', opportunity);
    
    console.log(`[SURGE] Opportunity detected: ${opportunity.symbol} +${opportunity.priceChange}%`);
  }
  
  calculateMomentumScore(tokenData) {
    let score = 0;
    
    // Price change contribution (max 40 points)
    score += Math.min(40, Math.abs(tokenData.priceChange) * 2);
    
    // Volume contribution (max 30 points)
    if (tokenData.volume > 100000) score += 30;
    else if (tokenData.volume > 50000) score += 20;
    else if (tokenData.volume > 10000) score += 10;
    
    // Liquidity contribution (max 30 points)
    if (tokenData.liquidity > 100000) score += 30;
    else if (tokenData.liquidity > 50000) score += 20;
    else if (tokenData.liquidity > 10000) score += 10;
    
    return Math.min(100, score);
  }
  
  calculateConfidence(tokenData) {
    let confidence = 0.5; // Base confidence
    
    if (tokenData.liquidity > 50000) confidence += 0.2;
    if (tokenData.volume > 25000) confidence += 0.15;
    if (tokenData.priceChange > 10) confidence += 0.15;
    
    return Math.min(1, confidence);
  }
  
  calculateWhaleConfidence(whaleData) {
    let confidence = 0.6; // Base confidence for whale activity
    
    if (whaleData.value > 10000) confidence += 0.2;
    if (whaleData.value > 50000) confidence += 0.1;
    if (whaleData.value > 100000) confidence += 0.1;
    
    return Math.min(1, confidence);
  }
  
  getTopMomentumTokens(limit = 5) {
    return Array.from(this.momentumTracker.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(token => ({
        symbol: token.symbol,
        momentum: token.score,
        priceChange: token.priceChange,
        volume: token.volume
      }));
  }
  
  handlePriceUpdate(data, source) {
    const update = {
      symbol: data.symbol,
      price: data.price,
      priceChange: data.priceChange || 0,
      source,
      timestamp: Date.now()
    };
    
    // Emit price update for charts
    this.io.emit('price-update', update);
  }
  
  handleWhaleTransaction(data) {
    const transaction = {
      wallet: data.wallet,
      token: data.token,
      type: data.type,
      amount: data.amount,
      value: data.valueUSD,
      timestamp: Date.now()
    };
    
    // Emit whale transaction
    this.io.emit('whale-transaction', transaction);
    
    // Update feed
    this.io.emit('feed-update', {
      type: 'whale',
      message: `🐋 Whale ${transaction.type}: ${transaction.token} - $${transaction.value}`,
      timestamp: Date.now()
    });
  }
  
  startPeriodicUpdates() {
    // Send stats every 5 seconds
    setInterval(() => {
      this.io.emit('stats-update', {
        tokensTracking: this.stats.tokensTracking.size,
        whalesTracking: this.stats.whalesTracking.size,
        opportunities: this.stats.opportunitiesDetected,
        cluster7Messages: this.stats.cluster7Messages,
        birdeyeMessages: this.stats.birdeyeMessages,
        eucalyptusMessages: this.stats.eucalyptusMessages,
        momentum: this.getTopMomentumTokens(),
        hotTokens: Array.from(this.hotTokens.values()),
        surgeOpportunities: this.surgeOpportunities.slice(0, 5)
      });
    }, 5000);
    
    // Send momentum updates every 3 seconds
    setInterval(() => {
      this.io.emit('momentum-update', {
        tokens: this.getTopMomentumTokens(),
        timestamp: Date.now()
      });
    }, 3000);
    
    console.log('📊 Periodic updates started');
  }
  
  getStatus() {
    return {
      connected: true,
      stats: this.stats,
      momentum: this.getTopMomentumTokens(10),
      hotTokens: Array.from(this.hotTokens.values()),
      surgeOpportunities: this.surgeOpportunities,
      lastUpdate: this.stats.lastUpdate
    };
  }
}

export const webSocketDataBridge = new WebSocketDataBridge(); 