import { ultraFastClient } from './UltraFastAxiomClient.js';
import { EventEmitter } from 'events';

/**
 * Market Intelligence Engine
 * Monitors ALL Axiom data streams for trading opportunities
 */
export class MarketIntelligenceEngine extends EventEmitter {
  constructor() {
    super();
    this.opportunities = new Map();
    this.tokenPrices = new Map();
    this.mevData = {
      jitoBribeFee: 0,
      solPriorityFee: 0,
      lastUpdate: 0
    };
    this.socialSignals = [];
    this.blockData = [];
    this.logger = console;
    
    // Opportunity thresholds
    this.thresholds = {
      mevSpread: 0.001,        // 0.1% fee spread = MEV opportunity
      priceChange: 0.05,       // 5% price change = momentum
      socialVolume: 10,        // 10+ social mentions = pump potential
      blockTimeAnomaly: 1000   // 1s block time difference = congestion
    };
  }
  
  async init() {
    this.logger.log('🧠 MARKET INTELLIGENCE ENGINE INITIALIZING');
    this.logger.log('═══════════════════════════════════════════');
    
    await ultraFastClient.init();
    this.startDataProcessing();
    
    this.logger.log('✅ Market intelligence engine ready!');
    this.logger.log('👀 Monitoring: MEV, Prices, Social, Blocks');
  }
  
  startDataProcessing() {
    ultraFastClient.on('message', (data) => {
      this.processRawData(data);
    });
    
    // Opportunity detection every second
    setInterval(() => {
      this.detectOpportunities();
    }, 1000);
    
    // Cleanup old data every minute
    setInterval(() => {
      this.cleanupOldData();
    }, 60000);
  }
  
  processRawData(data) {
    if (!data.source || !data.data) return;
    
    try {
      // Handle different data formats
      let message;
      
      if (data.source === 'cluster') {
        // Cluster data is already JSON string
        message = JSON.parse(data.data);
      } else if (data.source === 'whale_feed') {
        // Whale feed might be array format
        if (Array.isArray(data.data)) {
          // This is whale transaction data
          this.processWhaleTransaction(data.data);
          return;
        } else {
          message = JSON.parse(data.data);
        }
      } else {
        // Try to parse as JSON
        message = JSON.parse(data.data);
      }
      
      if (!message || !message.room) return;
      
      switch (true) {
        case message.room === 'jito-bribe-fee':
          this.processMevData('jito', message.content);
          break;
          
        case message.room === 'sol-priority-fee':
          this.processMevData('priority', message.content);
          break;
          
        case message.room.startsWith('b-'):
          this.processTokenPrice(message.room, message.content);
          break;
          
        case message.room === 'twitter_feed_v2':
          this.processSocialSignal(message.content);
          break;
          
        case message.room === 'block_hash':
          this.processBlockData(message.content);
          break;
          
        case message.room === 'connection_monitor':
          this.processHealthData(message.content);
          break;
          
        default:
          // Log unknown room types for debugging
          console.log(`[INTEL] 🔍 Unknown room: ${message.room}`);
      }
    } catch (error) {
      // Log parsing errors for debugging
      console.log(`[INTEL] ⚠️ Parse error for ${data.source}:`, error.message);
      console.log(`[INTEL] Raw data:`, data.data?.toString().substring(0, 100));
    }
  }
  
  processWhaleTransaction(transactionArray) {
    // Handle whale transaction format: [timestamp, wallet, token, action, amount, ...]
    if (Array.isArray(transactionArray) && transactionArray.length >= 5) {
      const timestamp = transactionArray[0];
      const wallet = transactionArray[1];
      const token = transactionArray[2];
      const action = transactionArray[3];
      const amount = transactionArray[4];
      
      this.emit('opportunity', {
        type: 'WHALE_SIGNAL',
        data: {
          wallet,
          token,
          action,
          amount,
          timestamp,
          source: 'whale_feed'
        },
        confidence: 0.8,
        urgency: 'high'
      });
    }
  }
  
  processMevData(type, fee) {
    const timestamp = Date.now();
    
    if (type === 'jito') {
      this.mevData.jitoBribeFee = fee;
    } else if (type === 'priority') {
      this.mevData.solPriorityFee = fee;
    }
    
    this.mevData.lastUpdate = timestamp;
    
    // Detect MEV opportunity
    const spread = Math.abs(this.mevData.jitoBribeFee - this.mevData.solPriorityFee);
    if (spread > this.thresholds.mevSpread) {
      this.emit('opportunity', {
        type: 'MEV_ARBITRAGE',
        data: {
          spread,
          jitoBribe: this.mevData.jitoBribeFee,
          priorityFee: this.mevData.solPriorityFee,
          timestamp,
          aucklandAdvantage: true
        },
        confidence: Math.min(0.9, spread * 100), // Higher spread = higher confidence
        urgency: 'immediate'
      });
    }
  }
  
  processTokenPrice(room, price) {
    const tokenAddress = room.replace('b-', '');
    const timestamp = Date.now();
    
    const priceHistory = this.tokenPrices.get(tokenAddress) || [];
    priceHistory.push({ price, timestamp });
    
    // Keep only last 10 prices
    if (priceHistory.length > 10) {
      priceHistory.shift();
    }
    
    this.tokenPrices.set(tokenAddress, priceHistory);
    
    // Detect price momentum
    if (priceHistory.length >= 2) {
      const currentPrice = priceHistory[priceHistory.length - 1].price;
      const previousPrice = priceHistory[priceHistory.length - 2].price;
      const change = (currentPrice - previousPrice) / previousPrice;
      
      if (Math.abs(change) > this.thresholds.priceChange) {
        this.emit('opportunity', {
          type: 'PRICE_MOMENTUM',
          data: {
            tokenAddress,
            priceChange: change,
            currentPrice,
            previousPrice,
            timestamp,
            direction: change > 0 ? 'UP' : 'DOWN'
          },
          confidence: Math.min(0.95, Math.abs(change) * 10),
          urgency: change > 0.1 ? 'immediate' : 'high'
        });
      }
    }
  }
  
  processSocialSignal(content) {
    const timestamp = Date.now();
    
    if (content.handle && content.eventType === 'tweet.update') {
      this.socialSignals.push({
        handle: content.handle,
        timestamp,
        encrypted: true,
        influence: this.getInfluenceScore(content.handle)
      });
      
      // Major influencer tweet = potential pump
      const influence = this.getInfluenceScore(content.handle);
      if (influence > 0.7) {
        this.emit('opportunity', {
          type: 'SOCIAL_SIGNAL',
          data: {
            handle: content.handle,
            influence,
            timestamp,
            predictedImpact: influence * 0.15 // Up to 15% impact for top influencers
          },
          confidence: influence,
          urgency: 'high'
        });
      }
    }
  }
  
  getInfluenceScore(handle) {
    const influencers = {
      'cryptokaleo': 0.9,
      'elonmusk': 1.0,
      'cz_binance': 0.95,
      'VitalikButerin': 0.85,
      'aantonop': 0.8
    };
    
    return influencers[handle] || 0.3; // Default medium influence
  }
  
  processBlockData(blockHash) {
    const timestamp = Date.now();
    
    this.blockData.push({ blockHash, timestamp });
    
    // Keep only last 50 blocks
    if (this.blockData.length > 50) {
      this.blockData.shift();
    }
    
    // Detect block time anomalies
    if (this.blockData.length >= 2) {
      const timeDiff = timestamp - this.blockData[this.blockData.length - 2].timestamp;
      
      if (timeDiff > this.thresholds.blockTimeAnomaly) {
        this.emit('opportunity', {
          type: 'NETWORK_CONGESTION',
          data: {
            blockTime: timeDiff,
            normalTime: 400, // ~400ms normal
            congestionLevel: timeDiff / 400,
            timestamp
          },
          confidence: 0.8,
          urgency: 'medium'
        });
      }
    }
  }
  
  processHealthData(timestamp) {
    // Monitor connection health for trading reliability
    const now = Date.now();
    const latency = now - timestamp;
    
    if (latency > 1000) { // 1s+ latency = problem
      this.emit('opportunity', {
        type: 'SYSTEM_ALERT',
        data: {
          latency,
          timestamp: now,
          severity: latency > 5000 ? 'critical' : 'warning'
        },
        confidence: 1.0,
        urgency: 'immediate'
      });
    }
  }
  
  detectOpportunities() {
    // Cross-reference different data streams for compound opportunities
    const now = Date.now();
    
    // MEV + Price Movement correlation
    const recentPriceMovements = Array.from(this.tokenPrices.values())
      .filter(history => history.length > 0 && (now - history[history.length - 1].timestamp) < 5000);
    
    if (recentPriceMovements.length > 3 && this.mevData.jitoBribeFee > this.mevData.solPriorityFee * 1.5) {
      this.emit('opportunity', {
        type: 'COMPOUND_MEV_MOMENTUM',
        data: {
          activeTokens: recentPriceMovements.length,
          mevSpread: this.mevData.jitoBribeFee - this.mevData.solPriorityFee,
          timestamp: now
        },
        confidence: 0.85,
        urgency: 'immediate'
      });
    }
  }
  
  cleanupOldData() {
    const cutoff = Date.now() - 300000; // 5 minutes
    
    // Clean social signals
    this.socialSignals = this.socialSignals.filter(s => s.timestamp > cutoff);
    
    // Clean block data
    this.blockData = this.blockData.filter(b => b.timestamp > cutoff);
    
    // Clean token price history
    for (const [token, history] of this.tokenPrices.entries()) {
      const filtered = history.filter(h => h.timestamp > cutoff);
      if (filtered.length === 0) {
        this.tokenPrices.delete(token);
      } else {
        this.tokenPrices.set(token, filtered);
      }
    }
  }
  
  getMarketState() {
    return {
      mev: this.mevData,
      activeTokens: this.tokenPrices.size,
      socialActivity: this.socialSignals.length,
      networkHealth: this.blockData.length > 0 ? 'healthy' : 'unknown',
      lastUpdate: Date.now()
    };
  }
}

export const marketIntelligence = new MarketIntelligenceEngine(); 