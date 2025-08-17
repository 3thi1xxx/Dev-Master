import { EventEmitter } from 'events';
import { ultraFastProcessor } from './UltraFastDataProcessor.js';
import { marketIntelligence } from './MarketIntelligenceEngine.js';
import { tradingEngine } from './TradingExecutionEngine.js';

/**
 * Trading Empire Engine
 * The supreme orchestrator of all trading systems
 * Built to leverage Auckland speed advantage for maximum profits
 */
export class TradingEmpireEngine extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.stats = {
      startTime: 0,
      totalOpportunities: 0,
      opportunitiesExecuted: 0,
      totalProfit: 0,
      successRate: 0,
      avgResponseTime: 0
    };
    this.logger = console;
    
    // Empire configuration
    this.config = {
      maxConcurrentTrades: 10,
      minOpportunityScore: 0.7,
      riskPerTrade: 0.02, // 2% of portfolio per trade
      portfolioSize: 1000, // $1000 starting portfolio
      aucklandAdvantage: true,
      ultraFastMode: true
    };
    
    // Track active opportunities
    this.activeOpportunities = new Map();
    this.recentPrices = new Map();
    this.mevFees = new Map();
    this.responseTime = [];
  }

  async init() {
    this.logger.log('🏰 TRADING EMPIRE ENGINE INITIALIZING');
    this.logger.log('═══════════════════════════════════════');
    this.logger.log('👑 Supreme orchestrator of all trading systems');
    this.logger.log('⚡ Auckland speed advantage: ACTIVE');
    this.logger.log('🚀 Ultra-fast data processing: ENABLED');
    
    // Initialize all subsystems
    await this.initializeSubsystems();
    
    // Connect to ultra-fast data streams
    await this.connectDataStreams();
    
    // Start opportunity detection
    this.startOpportunityDetection();
    
    this.stats.startTime = Date.now();
    this.isActive = true;
    
    this.logger.log('✅ TRADING EMPIRE READY FOR CONQUEST! 🏆');
  }

  async initializeSubsystems() {
    this.logger.log('[EMPIRE] 🔧 Initializing subsystems...');
    
    // Initialize ultra-fast processor
    await ultraFastProcessor.init();
    
    // Initialize market intelligence
    await marketIntelligence.init();
    
    // Initialize trading engine
    await tradingEngine.init();
    
    // Connect subsystem events
    this.connectSubsystemEvents();
    
    this.logger.log('[EMPIRE] ✅ All subsystems ready!');
  }

  connectSubsystemEvents() {
    // Connect market intelligence opportunities
    marketIntelligence.on('opportunity', (opportunity) => {
      this.handleOpportunity(opportunity);
    });
    
    // Connect trading engine events
    tradingEngine.on('trade_executed', (trade) => {
      this.handleTradeExecution(trade);
    });
    
    tradingEngine.on('trade_closed', (trade) => {
      this.handleTradeClosure(trade);
    });
  }

  async connectDataStreams() {
    this.logger.log('[EMPIRE] 📡 Connecting to ultra-fast data streams...');
    
    // Connect to cluster7 for maximum speed
    await ultraFastProcessor.connectToCluster();
    
    // Set up ultra-fast data routing
    this.setupDataRouting();
    
    this.logger.log('[EMPIRE] ✅ Connected to high-speed data streams!');
  }

  setupDataRouting() {
    // Route price updates for momentum detection
    ultraFastProcessor.on('price_update', (data) => {
      this.processPriceUpdate(data);
    });
    
    // Route MEV fee data for arbitrage opportunities
    ultraFastProcessor.on('mev_fee', (data) => {
      this.processMevFee(data);
    });
    
    ultraFastProcessor.on('priority_fee', (data) => {
      this.processPriorityFee(data);
    });
    
    // Route token price updates for individual token opportunities
    ultraFastProcessor.on('token_price', (data) => {
      this.processTokenPrice(data);
    });
    
    // Route token updates for mass analysis
    ultraFastProcessor.on('token_update', (data) => {
      this.processTokenUpdate(data);
    });
    
    // Route block data for timing opportunities
    ultraFastProcessor.on('new_block', (data) => {
      this.processNewBlock(data);
    });
    
    // Monitor connection health
    ultraFastProcessor.on('connection_error', (data) => {
      this.logger.log('[EMPIRE] ⚠️ Data connection error:', data.error);
    });
  }

  processPriceUpdate(data) {
    const { token, price, timestamp } = data;
    const previousPrice = this.recentPrices.get(token);
    
    // Store current price
    this.recentPrices.set(token, { price, timestamp });
    
    if (previousPrice) {
      const priceChange = (price - previousPrice.price) / previousPrice.price;
      const timeElapsed = timestamp - previousPrice.timestamp;
      
      // Detect rapid price movements (momentum opportunities)
      if (Math.abs(priceChange) > 0.02 && timeElapsed < 5000) { // 2% change in <5 seconds
        this.detectMomentumOpportunity(token, price, priceChange, timeElapsed);
      }
    }
    
    // Feed to market intelligence
    marketIntelligence.processRawData({
      source: 'cluster',
      data: JSON.stringify({
        room: `${token.toLowerCase()}_price`,
        content: price
      })
    });
  }

  processMevFee(data) {
    const { type, fee, timestamp } = data;
    
    // Store MEV fee data
    this.mevFees.set(type, { fee, timestamp });
    
    // Detect MEV arbitrage opportunities
    if (type === 'jito_bribe' && fee > 0.003) { // High MEV fees indicate profitable opportunities
      this.detectMevOpportunity(fee, timestamp);
    }
    
    // Feed to market intelligence
    marketIntelligence.processRawData({
      source: 'cluster',
      data: JSON.stringify({
        room: 'jito-bribe-fee',
        content: fee
      })
    });
  }

  processPriorityFee(data) {
    const { fee, timestamp } = data;
    
    // Detect network congestion opportunities
    if (fee > 0.004) { // High priority fees = network congestion = arbitrage opportunities
      this.detectCongestionOpportunity(fee, timestamp);
    }
    
    // Feed to market intelligence
    marketIntelligence.processRawData({
      source: 'cluster',
      data: JSON.stringify({
        room: 'sol-priority-fee',
        content: fee
      })
    });
  }

  processTokenPrice(data) {
    const { token, price, timestamp } = data;
    
    // Track individual token price movements
    const key = `token_${token}`;
    const previousPrice = this.recentPrices.get(key);
    
    this.recentPrices.set(key, { price, timestamp });
    
    if (previousPrice) {
      const priceChange = (price - previousPrice.price) / previousPrice.price;
      
      // Detect micro opportunities on individual tokens
      if (Math.abs(priceChange) > 0.01) { // 1% change
        this.detectTokenOpportunity(token, price, priceChange, timestamp);
      }
    }
  }

  processTokenUpdate(data) {
    const { token, data: updateData, timestamp } = data;
    
    // Process massive token update arrays for patterns
    // These contain bulk market data that can reveal systematic opportunities
    
    // Feed to market intelligence for pattern analysis
    marketIntelligence.processRawData({
      source: 'cluster',
      data: JSON.stringify({
        room: 'token_bulk_update',
        content: { token, data: updateData }
      })
    });
  }

  processNewBlock(data) {
    const { blockHash, timestamp } = data;
    
    // New blocks can signal opportunities for MEV extraction
    // Check if we have pending opportunities that need to be executed before next block
    
    this.checkPendingOpportunities(timestamp);
    
    // Feed to market intelligence
    marketIntelligence.processRawData({
      source: 'cluster',
      data: JSON.stringify({
        room: 'block_hash',
        content: blockHash
      })
    });
  }

  detectMomentumOpportunity(token, price, priceChange, timeElapsed) {
    const startTime = Date.now();
    
    const opportunity = {
      id: `momentum_${Date.now()}_${token}`,
      type: 'PRICE_MOMENTUM',
      token,
      price,
      priceChange,
      timeElapsed,
      confidence: Math.min(0.95, Math.abs(priceChange) * 10), // Higher confidence for larger moves
      urgency: 'high',
      expectedProfit: Math.abs(priceChange) * 0.5, // Capture 50% of the move
      aucklandAdvantage: true,
      timestamp: Date.now()
    };
    
    this.stats.totalOpportunities++;
    this.logOpportunity('MOMENTUM', opportunity);
    
    // Track response time
    this.responseTime.push(Date.now() - startTime);
    
    this.emit('opportunity_detected', opportunity);
    this.handleOpportunity(opportunity);
  }

  detectMevOpportunity(fee, timestamp) {
    const startTime = Date.now();
    
    const opportunity = {
      id: `mev_${Date.now()}`,
      type: 'MEV_ARBITRAGE',
      fee,
      confidence: Math.min(0.9, fee * 200), // Higher fees = higher confidence
      urgency: 'urgent',
      expectedProfit: fee * 5, // MEV opportunities can be 5x the fee
      aucklandAdvantage: true,
      timestamp
    };
    
    this.stats.totalOpportunities++;
    this.logOpportunity('MEV', opportunity);
    
    this.responseTime.push(Date.now() - startTime);
    
    this.emit('opportunity_detected', opportunity);
    this.handleOpportunity(opportunity);
  }

  detectCongestionOpportunity(fee, timestamp) {
    const startTime = Date.now();
    
    const opportunity = {
      id: `congestion_${Date.now()}`,
      type: 'NETWORK_CONGESTION',
      fee,
      confidence: Math.min(0.85, fee * 150),
      urgency: 'high',
      expectedProfit: fee * 3, // Network congestion arbitrage
      aucklandAdvantage: true,
      timestamp
    };
    
    this.stats.totalOpportunities++;
    this.logOpportunity('CONGESTION', opportunity);
    
    this.responseTime.push(Date.now() - startTime);
    
    this.emit('opportunity_detected', opportunity);
    this.handleOpportunity(opportunity);
  }

  detectTokenOpportunity(token, price, priceChange, timestamp) {
    const startTime = Date.now();
    
    const opportunity = {
      id: `token_${Date.now()}_${token.substring(0, 8)}`,
      type: 'TOKEN_ARBITRAGE',
      token,
      price,
      priceChange,
      confidence: Math.min(0.8, Math.abs(priceChange) * 50),
      urgency: 'medium',
      expectedProfit: Math.abs(priceChange) * 0.3, // Capture 30% of token moves
      aucklandAdvantage: true,
      timestamp
    };
    
    this.stats.totalOpportunities++;
    this.logOpportunity('TOKEN', opportunity);
    
    this.responseTime.push(Date.now() - startTime);
    
    this.emit('opportunity_detected', opportunity);
    this.handleOpportunity(opportunity);
  }

  startOpportunityDetection() {
    this.logger.log('[EMPIRE] 🎯 Starting opportunity detection engine...');
    
    // Ultra-fast opportunity scanning
    setInterval(() => {
      this.scanForCompoundOpportunities();
    }, 1000); // Scan every second
    
    // Statistics reporting
    setInterval(() => {
      this.logEmpireStats();
    }, 30000); // Report every 30 seconds
  }

  scanForCompoundOpportunities() {
    // Look for opportunities that combine multiple signals
    const recentOpportunities = Array.from(this.activeOpportunities.values())
      .filter(op => Date.now() - op.timestamp < 10000); // Within last 10 seconds
    
    if (recentOpportunities.length >= 2) {
      this.detectCompoundOpportunity(recentOpportunities);
    }
  }

  detectCompoundOpportunity(opportunities) {
    const compound = {
      id: `compound_${Date.now()}`,
      type: 'COMPOUND_ARBITRAGE',
      opportunities,
      confidence: 0.95,
      urgency: 'urgent',
      expectedProfit: opportunities.reduce((sum, op) => sum + op.expectedProfit, 0) * 1.5,
      aucklandAdvantage: true,
      timestamp: Date.now()
    };
    
    this.stats.totalOpportunities++;
    this.logOpportunity('COMPOUND', compound);
    
    this.emit('opportunity_detected', compound);
    this.handleOpportunity(compound);
  }

  async handleOpportunity(opportunity) {
    try {
      // Check if we should execute this opportunity
      if (opportunity.confidence < this.config.minOpportunityScore) {
        return; // Skip low-confidence opportunities
      }
      
      if (this.activeOpportunities.size >= this.config.maxConcurrentTrades) {
        return; // Too many active trades
      }
      
      // Store active opportunity
      this.activeOpportunities.set(opportunity.id, opportunity);
      
      // Send to trading engine for execution
      const executed = await tradingEngine.evaluateOpportunity(opportunity);
      
      if (executed) {
        this.stats.opportunitiesExecuted++;
        this.logger.log(`[EMPIRE] ✅ Opportunity executed: ${opportunity.type} (${(opportunity.confidence * 100).toFixed(1)}%)`);
      }
      
    } catch (error) {
      this.logger.log('[EMPIRE] ❌ Error handling opportunity:', error.message);
    }
  }

  handleTradeExecution(trade) {
    this.logger.log(`[EMPIRE] 🚀 Trade executed: ${trade.type} - $${trade.size} (${(trade.confidence * 100).toFixed(1)}%)`);
  }

  handleTradeClosure(trade) {
    // Remove from active opportunities
    this.activeOpportunities.delete(trade.opportunityId);
    
    // Update stats
    if (trade.profit > 0) {
      this.stats.totalProfit += trade.profit;
    }
    
    this.logger.log(`[EMPIRE] 💰 Trade closed: ${trade.profit > 0 ? 'PROFIT' : 'LOSS'} $${trade.profit.toFixed(2)}`);
  }

  checkPendingOpportunities(blockTimestamp) {
    // Check if any opportunities need urgent execution before next block
    for (const [id, opportunity] of this.activeOpportunities) {
      if (opportunity.urgency === 'urgent' && Date.now() - opportunity.timestamp > 3000) {
        // Urgent opportunity is getting stale - force execution
        this.logger.log(`[EMPIRE] ⚡ Force executing urgent opportunity: ${opportunity.type}`);
        tradingEngine.evaluateOpportunity(opportunity);
      }
    }
  }

  logOpportunity(type, opportunity) {
    const confidence = (opportunity.confidence * 100).toFixed(1);
    const profit = opportunity.expectedProfit.toFixed(4);
    this.logger.log(`[EMPIRE] 🎯 ${type} OPPORTUNITY: ${confidence}% confidence, $${profit} expected profit`);
  }

  logEmpireStats() {
    const runtime = Math.round((Date.now() - this.stats.startTime) / 1000);
    const processorStats = ultraFastProcessor.getStats();
    const avgResponseTime = this.responseTime.length > 0 ? 
      this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length : 0;
    
    this.logger.log(`[EMPIRE] 📊 EMPIRE STATS (${runtime}s runtime):`);
    this.logger.log(`[EMPIRE]    💰 Total Profit: $${this.stats.totalProfit.toFixed(2)}`);
    this.logger.log(`[EMPIRE]    🎯 Opportunities: ${this.stats.totalOpportunities} found, ${this.stats.opportunitiesExecuted} executed`);
    this.logger.log(`[EMPIRE]    ⚡ Response Time: ${avgResponseTime.toFixed(1)}ms avg`);
    this.logger.log(`[EMPIRE]    📡 Data Flow: ${processorStats.messagesPerSecond} msgs/sec, ${(processorStats.bytesPerSecond/1024).toFixed(1)} KB/sec`);
    this.logger.log(`[EMPIRE]    🏃 Active Trades: ${this.activeOpportunities.size}/${this.config.maxConcurrentTrades}`);
    
    // Clear response time array to prevent memory buildup
    if (this.responseTime.length > 1000) {
      this.responseTime = this.responseTime.slice(-100);
    }
  }

  getEmpireStatus() {
    const processorStats = ultraFastProcessor.getStats();
    const tradingStats = tradingEngine.getStats();
    
    return {
      isActive: this.isActive,
      runtime: Math.round((Date.now() - this.stats.startTime) / 1000),
      totalProfit: this.stats.totalProfit,
      opportunities: {
        total: this.stats.totalOpportunities,
        executed: this.stats.opportunitiesExecuted,
        active: this.activeOpportunities.size
      },
      dataFlow: {
        messagesPerSecond: processorStats.messagesPerSecond,
        bytesPerSecond: processorStats.bytesPerSecond,
        queueSize: processorStats.queueSize
      },
      trading: tradingStats,
      aucklandAdvantage: this.config.aucklandAdvantage
    };
  }
}

export const tradingEmpire = new TradingEmpireEngine(); 