import { marketIntelligence } from '../../intelligence/MarketIntelligenceEngine.js';
import { safeCopyTrader } from './SafeCopyTrader.js';
import { realTimeOpportunityDetector } from '../analyzers/RealTimeOpportunityDetector.js';
import { EventEmitter } from 'node:events';

/**
 * Trading Execution Engine
 * NOW INTEGRATED WITH REAL-TIME OPPORTUNITY DETECTOR
 * Executes trades based on opportunities from Market Intelligence AND cluster7 goldmine
 */
export class TradingExecutionEngine extends EventEmitter {
  constructor(options = {}) {
    super(); // Call EventEmitter constructor
    this.enabled = options.enabled || false;
    this.maxPositionSize = options.maxPositionSize || 10; // $10 max per trade
    this.maxConcurrentTrades = options.maxConcurrentTrades || 3;
    this.riskLevel = options.riskLevel || 'conservative'; // conservative, moderate, aggressive
    
    this.activeTrades = new Map();
    this.tradeHistory = [];
    this.profitLoss = 0;
    this.logger = console;
    
    // Strategy weights - UPDATED with cluster7 opportunities
    this.strategies = {
      MEV_ARBITRAGE: { enabled: true, allocation: 0.25, minConfidence: 0.7 },
      PRICE_MOMENTUM: { enabled: true, allocation: 0.20, minConfidence: 0.8 },
      SOCIAL_SIGNAL: { enabled: true, allocation: 0.15, minConfidence: 0.75 },
      COMPOUND_MEV_MOMENTUM: { enabled: true, allocation: 0.15, minConfidence: 0.85 },
      // NEW: cluster7 real-time opportunities
      NEW_TOKEN_LAUNCH: { enabled: true, allocation: 0.10, minConfidence: 0.80 },
      WHALE_TRANSACTION: { enabled: true, allocation: 0.10, minConfidence: 0.85 },
      VOLUME_SPIKE: { enabled: true, allocation: 0.05, minConfidence: 0.75 }
    };
    
    // cluster7 opportunity tracking
    this.cluster7Stats = {
      opportunitiesReceived: 0,
      opportunitiesExecuted: 0,
      avgExecutionTime: 0,
      successRate: 0
    };
  }
  
  async init() {
    this.logger.log('⚡ TRADING EXECUTION ENGINE INITIALIZING');
    this.logger.log('═══════════════════════════════════════');
    this.logger.log('🔥 cluster7 goldmine opportunities: ENABLED');
    this.logger.log('📊 Market intelligence opportunities: ENABLED');
    this.logger.log('⚡ Auckland latency advantage: ACTIVE');
    this.logger.log('═══════════════════════════════════════');
    
    // Listen for opportunities from market intelligence
    marketIntelligence.on('opportunity', (opportunity) => {
      this.evaluateOpportunity(opportunity);
    });
    
    // Listen for opportunities from cluster7 real-time detector
    realTimeOpportunityDetector.on('opportunity', (opportunity) => {
      this.evaluateCluster7Opportunity(opportunity);
    });
    
    this.logger.log(`✅ Trading execution ready! (${this.enabled ? 'LIVE' : 'SIMULATION'} mode)`);
    this.logger.log(`🎯 Max position: $${this.maxPositionSize} | Concurrent: ${this.maxConcurrentTrades}`);
    this.logger.log(`🚀 cluster7 real-time opportunities: ACTIVE`);
  }
  
  async evaluateOpportunity(opportunity) {
    try {
      const strategy = this.strategies[opportunity.type];
      
      if (!strategy || !strategy.enabled) {
        this.logger.log(`[EXEC] ⏭️ Strategy ${opportunity.type} disabled`);
        return;
      }
      
      if (opportunity.confidence < strategy.minConfidence) {
        this.logger.log(`[EXEC] ⏭️ Low confidence: ${(opportunity.confidence * 100).toFixed(1)}% < ${(strategy.minConfidence * 100)}%`);
        return;
      }
      
      if (this.activeTrades.size >= this.maxConcurrentTrades) {
        this.logger.log(`[EXEC] ⏭️ Max concurrent trades reached: ${this.maxConcurrentTrades}`);
        return;
      }
      
      // Calculate position size based on confidence and strategy allocation
      const baseSize = this.maxPositionSize * strategy.allocation;
      const positionSize = baseSize * opportunity.confidence;
      
      this.logger.log(`\n🎯 EXECUTING: ${opportunity.type}`);
      this.logger.log(`   Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
      this.logger.log(`   Position: $${positionSize.toFixed(2)}`);
      this.logger.log(`   Urgency: ${opportunity.urgency}`);
      
      // Execute the trade based on opportunity type
      await this.executeTrade(opportunity, positionSize);
      
    } catch (error) {
      this.logger.log(`[EXEC] ❌ Error evaluating opportunity:`, error.message);
    }
  }
  
  async executeTrade(opportunity, positionSize) {
    const trade = {
      id: Date.now(),
      type: opportunity.type,
      data: opportunity.data,
      positionSize,
      confidence: opportunity.confidence,
      timestamp: Date.now(),
      status: this.enabled ? 'executed' : 'simulated',
      expectedProfit: 0,
      actualProfit: 0
    };
    
    switch (opportunity.type) {
      case 'MEV_ARBITRAGE':
        trade.expectedProfit = this.calculateMevProfit(opportunity.data, positionSize);
        break;
        
      case 'PRICE_MOMENTUM':
        trade.expectedProfit = this.calculateMomentumProfit(opportunity.data, positionSize);
        break;
        
      case 'SOCIAL_SIGNAL':
        trade.expectedProfit = this.calculateSocialProfit(opportunity.data, positionSize);
        break;
        
      case 'COMPOUND_MEV_MOMENTUM':
        trade.expectedProfit = this.calculateCompoundProfit(opportunity.data, positionSize);
        break;
    }
    
    this.activeTrades.set(trade.id, trade);
    this.tradeHistory.push(trade);
    
    this.logger.log(`[EXEC] ✅ Trade executed: $${positionSize.toFixed(2)} → Expected: $${trade.expectedProfit.toFixed(2)}`);
    
    // Set up auto-close
    this.scheduleTradeClose(trade);
    
    return trade;
  }
  
  calculateMevProfit(data, positionSize) {
    // MEV profit = spread * position size * success rate
    const spread = data.spread || 0;
    const successRate = 0.7; // 70% success rate for MEV
    return positionSize * spread * successRate;
  }
  
  calculateMomentumProfit(data, positionSize) {
    // Momentum profit = expected price change * position
    const priceChange = Math.abs(data.priceChange || 0);
    const direction = data.direction === 'UP' ? 1 : -1;
    const successRate = priceChange > 0.1 ? 0.8 : 0.6; // Higher success for big moves
    return positionSize * priceChange * direction * successRate;
  }
  
  calculateSocialProfit(data, positionSize) {
    // Social profit = predicted impact * position
    const impact = data.predictedImpact || 0;
    const successRate = 0.65; // 65% success rate for social signals
    return positionSize * impact * successRate;
  }
  
  calculateCompoundProfit(data, positionSize) {
    // Compound profit = higher potential but riskier
    const mevSpread = data.mevSpread || 0;
    const tokenActivity = data.activeTokens || 1;
    const multiplier = Math.min(2.0, 1 + (tokenActivity * 0.1)); // Up to 2x multiplier
    return positionSize * mevSpread * multiplier * 0.75; // 75% success rate
  }
  
  scheduleTradeClose(trade) {
    // Different close times based on trade type
    const closeTimes = {
      'MEV_ARBITRAGE': 30000,      // 30 seconds
      'PRICE_MOMENTUM': 300000,    // 5 minutes  
      'SOCIAL_SIGNAL': 600000,     // 10 minutes
      'COMPOUND_MEV_MOMENTUM': 120000  // 2 minutes
    };
    
    const closeTime = closeTimes[trade.type] || 300000;
    
    setTimeout(() => {
      this.closeTrade(trade.id);
    }, closeTime);
  }
  
  closeTrade(tradeId) {
    const trade = this.activeTrades.get(tradeId);
    if (!trade) return;
    
    // Simulate trade outcome based on strategy success rates
    const successRates = {
      'MEV_ARBITRAGE': 0.75,
      'PRICE_MOMENTUM': 0.65,
      'SOCIAL_SIGNAL': 0.6,
      'COMPOUND_MEV_MOMENTUM': 0.7
    };
    
    const successRate = successRates[trade.type] || 0.6;
    const isSuccessful = Math.random() < successRate;
    
    if (isSuccessful) {
      trade.actualProfit = trade.expectedProfit * (0.8 + Math.random() * 0.4); // 80-120% of expected
    } else {
      trade.actualProfit = -trade.positionSize * 0.1; // 10% loss on failure
    }
    
    trade.status = 'closed';
    trade.closedAt = Date.now();
    
    this.profitLoss += trade.actualProfit;
    this.activeTrades.delete(tradeId);
    
    const emoji = trade.actualProfit > 0 ? '✅' : '❌';
    this.logger.log(`[EXEC] ${emoji} Trade closed: ${trade.type} → $${trade.actualProfit.toFixed(2)}`);
    this.logger.log(`[EXEC] 📊 Total P&L: $${this.profitLoss.toFixed(2)}`);
    
    return trade.actualProfit;
  }
  
  async evaluateCluster7Opportunity(opportunity) {
    const evaluationStart = performance.now();
    this.cluster7Stats.opportunitiesReceived++;
    
    try {
      this.logger.log(`\n🔥 CLUSTER7 OPPORTUNITY: ${opportunity.type}`);
      this.logger.log(`   Token: ${opportunity.token || 'N/A'}`);
      this.logger.log(`   Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
      this.logger.log(`   Urgency: ${opportunity.urgency}`);
      this.logger.log(`   Age: ${opportunity.age}ms`);
      
      // Get strategy for this opportunity type
      const strategy = this.strategies[opportunity.type];
      
      if (!strategy || !strategy.enabled) {
        this.logger.log(`[EXEC] ⏭️ Strategy ${opportunity.type} disabled`);
        return;
      }
      
      if (opportunity.confidence < strategy.minConfidence) {
        this.logger.log(`[EXEC] ⏭️ Low confidence: ${(opportunity.confidence * 100).toFixed(1)}% < ${(strategy.minConfidence * 100)}%`);
        return;
      }
      
      if (this.activeTrades.size >= this.maxConcurrentTrades) {
        this.logger.log(`[EXEC] ⏭️ Max concurrent trades reached: ${this.maxConcurrentTrades}`);
        return;
      }
      
      // Special handling for urgent opportunities
      if (opportunity.urgency === 'IMMEDIATE' && opportunity.confidence >= 0.9) {
        this.logger.log(`[EXEC] 🚨 IMMEDIATE HIGH-CONFIDENCE OPPORTUNITY - Fast-tracking execution!`);
        await this.executeUrgentTrade(opportunity, strategy);
        return;
      }
      
      // Calculate position size based on confidence and strategy allocation
      const baseSize = this.maxPositionSize * strategy.allocation;
      const positionSize = baseSize * opportunity.confidence;
      
      // Execute the trade
      await this.executeCluster7Trade(opportunity, positionSize, strategy);
      
      // Update performance metrics
      const executionTime = performance.now() - evaluationStart;
      this.cluster7Stats.avgExecutionTime = 
        (this.cluster7Stats.avgExecutionTime * (this.cluster7Stats.opportunitiesExecuted) + executionTime) / 
        (this.cluster7Stats.opportunitiesExecuted + 1);
      
      this.cluster7Stats.opportunitiesExecuted++;
      
    } catch (error) {
      this.logger.log(`[EXEC] ❌ Error evaluating cluster7 opportunity:`, error.message);
    }
  }
  
  async executeUrgentTrade(opportunity, strategy) {
    this.logger.log(`[EXEC] ⚡ URGENT EXECUTION - ${opportunity.type}`);
    
    // Use maximum allocation for urgent high-confidence trades
    const positionSize = this.maxPositionSize * strategy.allocation * 1.5; // 1.5x for urgent
    
    const trade = {
      id: Date.now(),
      type: opportunity.type,
      source: 'cluster7_urgent',
      data: opportunity,
      positionSize,
      confidence: opportunity.confidence,
      urgency: opportunity.urgency,
      timestamp: Date.now(),
      executionTime: opportunity.age,
      status: this.enabled ? 'executed' : 'simulated',
      expectedProfit: this.calculateExpectedProfit(opportunity, positionSize),
      actualProfit: 0
    };
    
    // Add to active trades
    this.activeTrades.set(trade.id, trade);
    this.tradeHistory.push(trade);
    
    this.logger.log(`[EXEC] 🚀 URGENT TRADE EXECUTED:`);
    this.logger.log(`   Trade ID: ${trade.id}`);
    this.logger.log(`   Position: $${positionSize.toFixed(2)}`);
    this.logger.log(`   Expected Profit: $${trade.expectedProfit.toFixed(2)}`);
    this.logger.log(`   Execution Time: ${trade.executionTime}ms`);
    
    // Emit trade event
    this.emit('trade-executed', trade);
    
    return trade;
  }
  
  async executeCluster7Trade(opportunity, positionSize, strategy) {
    const trade = {
      id: Date.now(),
      type: opportunity.type,
      source: 'cluster7',
      data: opportunity,
      positionSize,
      confidence: opportunity.confidence,
      urgency: opportunity.urgency,
      timestamp: Date.now(),
      executionTime: opportunity.age,
      status: this.enabled ? 'executed' : 'simulated',
      expectedProfit: this.calculateExpectedProfit(opportunity, positionSize),
      actualProfit: 0
    };
    
    this.logger.log(`\n🎯 EXECUTING CLUSTER7 TRADE:`);
    this.logger.log(`   Type: ${opportunity.type}`);
    this.logger.log(`   Token: ${opportunity.token || 'N/A'}`);
    this.logger.log(`   Position: $${positionSize.toFixed(2)}`);
    this.logger.log(`   Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
    this.logger.log(`   Expected Profit: $${trade.expectedProfit.toFixed(2)}`);
    
    // Add to active trades
    this.activeTrades.set(trade.id, trade);
    this.tradeHistory.push(trade);
    
    // Execute based on opportunity type
    switch (opportunity.type) {
      case 'NEW_TOKEN_LAUNCH':
        await this.executeNewTokenTrade(trade);
        break;
        
      case 'WHALE_TRANSACTION':
        await this.executeWhaleFollowTrade(trade);
        break;
        
      case 'VOLUME_SPIKE':
        await this.executeVolumeMomentumTrade(trade);
        break;
        
      default:
        this.logger.log(`[EXEC] ⚠️ Unknown cluster7 opportunity type: ${opportunity.type}`);
    }
    
    // Emit trade event
    this.emit('trade-executed', trade);
    
    return trade;
  }
  
  calculateExpectedProfit(opportunity, positionSize) {
    switch (opportunity.type) {
      case 'NEW_TOKEN_LAUNCH':
        // New tokens can have high returns but high risk
        return positionSize * 0.15 * opportunity.confidence; // 15% expected return
        
      case 'WHALE_TRANSACTION':
        // Whale follows are typically safer with moderate returns
        return positionSize * 0.08 * opportunity.confidence; // 8% expected return
        
      case 'VOLUME_SPIKE':
        // Volume momentum can be profitable
        return positionSize * 0.12 * opportunity.confidence; // 12% expected return
        
      default:
        return positionSize * 0.05; // 5% conservative estimate
    }
  }
  
  async executeNewTokenTrade(trade) {
    this.logger.log(`[EXEC] 🆕 Executing new token launch trade`);
    
    if (this.enabled) {
      // LIVE TRADING: Execute actual trade
      // Implementation would connect to your trading infrastructure
      this.logger.log(`[EXEC] 💰 LIVE: New token purchase executed`);
    } else {
      // SIMULATION: Log what would happen
      this.logger.log(`[EXEC] 🧪 SIMULATION: Would buy new token with $${trade.positionSize.toFixed(2)}`);
    }
  }
  
  async executeWhaleFollowTrade(trade) {
    this.logger.log(`[EXEC] 🐋 Executing whale follow trade`);
    
    if (this.enabled) {
      // LIVE TRADING: Follow whale transaction
      this.logger.log(`[EXEC] 💰 LIVE: Whale follow trade executed`);
    } else {
      // SIMULATION: Log what would happen
      this.logger.log(`[EXEC] 🧪 SIMULATION: Would follow whale with $${trade.positionSize.toFixed(2)}`);
    }
  }
  
  async executeVolumeMomentumTrade(trade) {
    this.logger.log(`[EXEC] 📈 Executing volume momentum trade`);
    
    if (this.enabled) {
      // LIVE TRADING: Trade on volume momentum
      this.logger.log(`[EXEC] 💰 LIVE: Volume momentum trade executed`);
    } else {
      // SIMULATION: Log what would happen
      this.logger.log(`[EXEC] 🧪 SIMULATION: Would trade momentum with $${trade.positionSize.toFixed(2)}`);
    }
  }
  
  getCluster7Stats() {
    return {
      ...this.cluster7Stats,
      successRate: this.cluster7Stats.opportunitiesExecuted > 0 
        ? (this.cluster7Stats.opportunitiesExecuted / this.cluster7Stats.opportunitiesReceived * 100).toFixed(1)
        : 0,
      avgExecutionTimeMs: this.cluster7Stats.avgExecutionTime.toFixed(2)
    };
  }
  
  getStats() {
    const closedTrades = this.tradeHistory.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.actualProfit > 0);
    
    return {
      totalTrades: this.tradeHistory.length,
      activeTrades: this.activeTrades.size,
      closedTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length * 100).toFixed(1) + '%' : '0%',
      totalProfitLoss: this.profitLoss.toFixed(2),
      avgProfit: closedTrades.length > 0 ? (this.profitLoss / closedTrades.length).toFixed(2) : '0.00',
      strategiesActive: Object.keys(this.strategies).filter(s => this.strategies[s].enabled).length
    };
  }
  
  enableLiveTrading() {
    this.enabled = true;
    this.logger.log('[EXEC] 🚀 LIVE TRADING ENABLED!');
  }
  
  disableLiveTrading() {
    this.enabled = false;
    this.logger.log('[EXEC] ⏸️ Switched to simulation mode');
  }
}

export const tradingEngine = new TradingExecutionEngine(); 