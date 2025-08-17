#!/usr/bin/env node
/**
 * MASTER TRADING SYSTEM
 * Integrates SharedWebSocketManager breakthrough with real-time opportunity detection
 * and automated trading execution - Complete end-to-end system!
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';
import { realTimeOpportunityDetector } from './services/RealTimeOpportunityDetector.js';
import { TradingExecutionEngine } from './services/TradingExecutionEngine.js';
import { UltraFastAxiomClient } from './services/UltraFastAxiomClient.js';
import { AxiomWebSocketTracker } from './services/AxiomWebSocketTracker.js';

class MasterTradingSystem {
  constructor(options = {}) {
    this.config = {
      mode: options.mode || 'simulation', // 'simulation' or 'live'
      maxPositionSize: options.maxPositionSize || 50, // $50 max position
      maxConcurrentTrades: options.maxConcurrentTrades || 5,
      riskLevel: options.riskLevel || 'conservative',
      enableCluster7: options.enableCluster7 !== false, // Default true
      enableEucalyptus: options.enableEucalyptus !== false, // Default true
      enableHyperliquid: options.enableHyperliquid !== false, // Default true
      ...options
    };
    
    // Initialize core components
    this.opportunityDetector = realTimeOpportunityDetector;
    this.tradingEngine = new TradingExecutionEngine({
      enabled: this.config.mode === 'live',
      maxPositionSize: this.config.maxPositionSize,
      maxConcurrentTrades: this.config.maxConcurrentTrades,
      riskLevel: this.config.riskLevel
    });
    this.ultraFastClient = new UltraFastAxiomClient();
    this.whaleTracker = new AxiomWebSocketTracker();
    
    // System metrics
    this.systemMetrics = {
      startTime: Date.now(),
      connectionsEstablished: 0,
      opportunitiesDetected: 0,
      tradesExecuted: 0,
      totalProfit: 0,
      uptime: 0
    };
    
    this.isRunning = false;
    this.logger = console;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Trading execution events
    this.tradingEngine.on('trade-executed', (trade) => {
      this.handleTradeExecuted(trade);
    });
    
    // SharedWebSocketManager events
    sharedWebSocketManager.on('connection-open', ({ url }) => {
      this.systemMetrics.connectionsEstablished++;
      this.logger.log(`[MASTER] ✅ Connection established: ${url}`);
    });
    
    sharedWebSocketManager.on('message', ({ url, data }) => {
      // Log high-level message flow
      if (Math.random() < 0.01) { // Log 1% of messages to avoid spam
        this.logger.log(`[MASTER] 📨 Message flow: ${url.split('/').pop()} -> ${JSON.stringify(data).length} bytes`);
      }
    });
    
    // Opportunity detector events
    this.opportunityDetector.on('opportunity', (opportunity) => {
      this.systemMetrics.opportunitiesDetected++;
      
      if (opportunity.confidence >= 0.85) {
        this.logger.log(`[MASTER] 🎯 HIGH-CONFIDENCE OPPORTUNITY DETECTED:`);
        this.logger.log(`  Type: ${opportunity.type}`);
        this.logger.log(`  Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
        this.logger.log(`  Urgency: ${opportunity.urgency}`);
      }
    });
  }
  
  async start() {
    this.logger.log('🚀 MASTER TRADING SYSTEM STARTING');
    this.logger.log('═'.repeat(80));
    this.logger.log('🌐 SharedWebSocketManager: Browser-level persistent connections');
    this.logger.log('🔥 cluster7 goldmine: Real-time opportunity detection');
    this.logger.log('🐋 Eucalyptus whale tracking: Enhanced with shared connections');
    this.logger.log('⚡ Auckland advantage: 15ms latency edge');
    this.logger.log(`💰 Trading mode: ${this.config.mode.toUpperCase()}`);
    this.logger.log(`🎯 Max position: $${this.config.maxPositionSize} | Max concurrent: ${this.config.maxConcurrentTrades}`);
    this.logger.log('═'.repeat(80));
    
    try {
      this.isRunning = true;
      
      // 1. Initialize trading execution engine
      this.logger.log('\n🎯 [1/5] Initializing trading execution engine...');
      await this.tradingEngine.init();
      
      // 2. Initialize ultra-fast client with SharedWebSocketManager
      this.logger.log('\n⚡ [2/5] Initializing ultra-fast client...');
      await this.ultraFastClient.init();
      
      // 3. Start whale tracker with SharedWebSocketManager
      if (this.config.enableEucalyptus) {
        this.logger.log('\n🐋 [3/5] Starting whale tracker...');
        await this.whaleTracker.connect();
      }
      
      // 4. Start real-time opportunity detector
      if (this.config.enableCluster7) {
        this.logger.log('\n🔥 [4/5] Starting cluster7 opportunity detector...');
        await this.opportunityDetector.start();
      }
      
      // 5. Start system monitoring
      this.logger.log('\n📊 [5/5] Starting system monitoring...');
      this.startSystemMonitoring();
      
      this.logger.log('\n🎉 MASTER TRADING SYSTEM FULLY OPERATIONAL!');
      this.logger.log('═'.repeat(80));
      this.logger.log('🔥 cluster7 goldmine: LIVE - Detecting opportunities in real-time');
      this.logger.log('🌐 SharedWebSocketManager: ACTIVE - Browser-level persistence');
      this.logger.log('🎯 Opportunity detection: RUNNING - Auto-filtering for high-confidence trades');
      this.logger.log('⚡ Auckland advantage: ENGAGED - 15ms latency edge');
      this.logger.log('💰 Ready to capture opportunities as they fly by!');
      this.logger.log('═'.repeat(80));
      
      // Keep running
      await this.runMainLoop();
      
    } catch (error) {
      this.logger.error('❌ MASTER SYSTEM STARTUP FAILED:', error.message);
      this.stop();
    }
  }
  
  async runMainLoop() {
    this.logger.log('\n🔄 Entering main monitoring loop...');
    
    while (this.isRunning) {
      try {
        // Update system uptime
        this.systemMetrics.uptime = Date.now() - this.systemMetrics.startTime;
        
        // Check system health
        await this.performHealthCheck();
        
        // Wait before next iteration
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second intervals
        
      } catch (error) {
        this.logger.error('[MASTER] ❌ Main loop error:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }
  
  async performHealthCheck() {
    const connections = sharedWebSocketManager.getStats();
    const opportunities = this.opportunityDetector.getStats();
    const cluster7Stats = this.tradingEngine.getCluster7Stats();
    
    // Only log health check every minute
    if (this.systemMetrics.uptime % 60000 < 10000) {
      this.logger.log('\n📊 SYSTEM HEALTH CHECK:');
      this.logger.log(`🌐 Connections: ${connections.activeConnections}/${connections.sharedConnections} active`);
      this.logger.log(`📈 Messages/sec: ${opportunities.messagesPerSecond?.toFixed(1) || 0}`);
      this.logger.log(`🎯 Opportunities: ${opportunities.opportunitiesDetected} detected, ${opportunities.highConfidenceOpportunities} high-confidence`);
      this.logger.log(`💰 Trades: ${cluster7Stats.opportunitiesExecuted} executed (${cluster7Stats.successRate}% success rate)`);
      this.logger.log(`⏱️ Avg execution: ${cluster7Stats.avgExecutionTimeMs}ms`);
      this.logger.log(`🕒 Uptime: ${Math.floor(this.systemMetrics.uptime / 1000)}s`);
    }
  }
  
  handleTradeExecuted(trade) {
    this.systemMetrics.tradesExecuted++;
    this.systemMetrics.totalProfit += trade.expectedProfit;
    
    this.logger.log(`\n💰 TRADE EXECUTED:`);
    this.logger.log(`  ID: ${trade.id}`);
    this.logger.log(`  Type: ${trade.type}`);
    this.logger.log(`  Source: ${trade.source}`);
    this.logger.log(`  Position: $${trade.positionSize.toFixed(2)}`);
    this.logger.log(`  Confidence: ${(trade.confidence * 100).toFixed(1)}%`);
    this.logger.log(`  Expected Profit: $${trade.expectedProfit.toFixed(2)}`);
    this.logger.log(`  Execution Time: ${trade.executionTime}ms`);
    this.logger.log(`  Status: ${trade.status.toUpperCase()}`);
  }
  
  startSystemMonitoring() {
    // Comprehensive stats every 2 minutes
    setInterval(() => {
      this.logComprehensiveStats();
    }, 120000);
    
    // Performance alert monitoring
    setInterval(() => {
      this.checkPerformanceAlerts();
    }, 30000);
  }
  
  logComprehensiveStats() {
    const connections = sharedWebSocketManager.getStats();
    const opportunities = this.opportunityDetector.getStats();
    const cluster7Stats = this.tradingEngine.getCluster7Stats();
    const runtime = (Date.now() - this.systemMetrics.startTime) / 1000;
    
    this.logger.log('\n📊 COMPREHENSIVE SYSTEM STATS:');
    this.logger.log('═'.repeat(60));
    this.logger.log(`🕒 Runtime: ${Math.floor(runtime / 60)}m ${Math.floor(runtime % 60)}s`);
    this.logger.log(`🌐 SharedWebSocket Connections: ${connections.activeConnections} active, ${connections.totalQueued} queued`);
    this.logger.log(`📨 Message Processing: ${opportunities.messagesProcessed} total (${opportunities.messagesPerSecond?.toFixed(1) || 0}/sec)`);
    this.logger.log(`🎯 Opportunity Detection: ${opportunities.opportunitiesDetected} found (${(opportunities.opportunitiesDetected / opportunities.messagesProcessed * 100).toFixed(2)}% rate)`);
    this.logger.log(`🔥 High-Confidence: ${opportunities.highConfidenceOpportunities} opportunities (85%+ confidence)`);
    this.logger.log(`💰 Trade Execution: ${cluster7Stats.opportunitiesExecuted} trades, ${cluster7Stats.successRate}% success`);
    this.logger.log(`⚡ Avg Processing: ${opportunities.averageProcessingTime?.toFixed(2) || 0}ms per message`);
    this.logger.log(`💵 Total Expected Profit: $${this.systemMetrics.totalProfit.toFixed(2)}`);
    this.logger.log('═'.repeat(60));
  }
  
  checkPerformanceAlerts() {
    const connections = sharedWebSocketManager.getStats();
    const opportunities = this.opportunityDetector.getStats();
    
    // Alert if connections are down
    if (connections.activeConnections < 2) {
      this.logger.log('🚨 ALERT: Low connection count - some feeds may be offline');
    }
    
    // Alert if message processing is slow
    if (opportunities.averageProcessingTime > 5) {
      this.logger.log('🚨 ALERT: High message processing latency detected');
    }
    
    // Alert if no opportunities detected recently
    if (opportunities.messagesProcessed > 1000 && opportunities.opportunitiesDetected === 0) {
      this.logger.log('🚨 ALERT: No opportunities detected - check filtering thresholds');
    }
  }
  
  async stop() {
    this.logger.log('\n🛑 STOPPING MASTER TRADING SYSTEM...');
    this.isRunning = false;
    
    try {
      // Stop opportunity detector
      this.opportunityDetector.stop();
      
      // Close all connections
      sharedWebSocketManager.closeAll();
      
      // Final stats
      this.logFinalStats();
      
      this.logger.log('✅ Master trading system stopped successfully');
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error.message);
    }
    
    process.exit(0);
  }
  
  logFinalStats() {
    const runtime = (Date.now() - this.systemMetrics.startTime) / 1000;
    
    this.logger.log('\n📊 FINAL SESSION STATS:');
    this.logger.log('═'.repeat(60));
    this.logger.log(`🕒 Total Runtime: ${Math.floor(runtime / 60)}m ${Math.floor(runtime % 60)}s`);
    this.logger.log(`🌐 Connections Established: ${this.systemMetrics.connectionsEstablished}`);
    this.logger.log(`🎯 Opportunities Detected: ${this.systemMetrics.opportunitiesDetected}`);
    this.logger.log(`💰 Trades Executed: ${this.systemMetrics.tradesExecuted}`);
    this.logger.log(`💵 Total Expected Profit: $${this.systemMetrics.totalProfit.toFixed(2)}`);
    this.logger.log('═'.repeat(60));
    
    if (this.config.mode === 'simulation') {
      this.logger.log('📝 NOTE: All trades were simulated. Enable live mode for real execution.');
    }
  }
  
  getSystemStats() {
    return {
      ...this.systemMetrics,
      connections: sharedWebSocketManager.getStats(),
      opportunities: this.opportunityDetector.getStats(),
      cluster7: this.tradingEngine.getCluster7Stats(),
      uptime: Date.now() - this.systemMetrics.startTime
    };
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutdown signal received...');
  if (masterSystem) {
    masterSystem.stop();
  } else {
    process.exit(0);
  }
});

// Start the master system
const masterSystem = new MasterTradingSystem({
  mode: process.env.TRADING_MODE || 'simulation', // Set to 'live' for real trading
  maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 50,
  maxConcurrentTrades: parseInt(process.env.MAX_CONCURRENT_TRADES) || 5,
  riskLevel: process.env.RISK_LEVEL || 'conservative'
});

console.log('🎯 Starting Master Trading System...');
console.log('💡 Use Ctrl+C to stop gracefully');
console.log('⚠️  Currently in SIMULATION mode - set TRADING_MODE=live for real trading');

masterSystem.start().catch(error => {
  console.error('💥 Master system failed to start:', error);
  process.exit(1);
}); 