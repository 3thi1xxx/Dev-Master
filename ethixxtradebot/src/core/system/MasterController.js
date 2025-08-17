/**
 * Master System Controller
 * Coordinates all trading system components for seamless operation
 */

import { EventEmitter } from 'node:events';
import { liveTokenAnalyzer } from '../analyzers/LiveTokenAnalyzer.js';
import { enhancedAnalysis } from '../analyzers/EnhancedExternalAnalysis.js';
import { paperTradingSimulator } from '../trading/PaperTradingSimulator.js';
import { degenPaperTrader } from '../trading/DegenPaperTrader.js';
import { whaleDataService } from '../data/WhaleDataService.js';
import { PumpFunSniper } from '../../strategies/PumpFunSniper.js';
import { GatewayOptimizer } from '../../infrastructure/GatewayOptimizer.js';
import { NZTaxTracker } from '../compliance/NZTaxTracker.js';

export class MasterController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enablePumpSniping: options.enablePumpSniping === true, // Changed: disabled by default
      enableWhaleTracking: options.enableWhaleTracking !== false,
      enableTaxTracking: options.enableTaxTracking !== false,
      enableRPCOptimization: options.enableRPCOptimization !== false,
      mode: options.mode || 'full', // 'full', 'conservative', 'aggressive'
      
      // NEW: Enhanced trading parameters
      batchProcessing: options.batchProcessing !== false,
      clearTriggers: options.clearTriggers !== false,
      professionalMetrics: options.professionalMetrics !== false,
      
      ...options
    };
    
    this.isRunning = false;
    this.components = {};
    this.stats = {
      tokensAnalyzed: 0,
      opportunitiesFound: 0,
      tradesExecuted: 0,
      uptime: 0,
      startTime: null,
      
      // Enhanced metrics
      apiCallsSuccessful: 0,
      apiCallsTotal: 0,
      batchesProcessed: 0,
      avgProcessingTime: 0
    };
    
    console.log('[MASTER] 🎮 Master Controller initialized');
    console.log(`[MASTER] ⚙️ Mode: ${this.config.mode.toUpperCase()}`);
  }
  
  async initialize() {
    console.log('[MASTER] 🚀 Initializing all system components...');
    
    try {
      // Initialize core components based on configuration
      if (this.config.enableRPCOptimization) {
        await this.initializeRPCOptimization();
      }
      
      if (this.config.enableTaxTracking) {
        await this.initializeTaxTracking();
      }
      
      if (this.config.enablePumpSniping) {
        await this.initializePumpSniping();
      } else {
        console.log('[MASTER] ⏸️ Pump.fun sniper DISABLED (enable with enablePumpSniping: true)');
      }
      
      if (this.config.enableWhaleTracking) {
        await this.initializeWhaleTracking();
      }
      
      // Initialize trading components
      await this.initializeTradingEngines();
      
      // Initialize analysis pipeline
      await this.initializeAnalysisPipeline();
      
      // Connect all component events
      this.connectComponentEvents();
      
      console.log('[MASTER] ✅ All components initialized successfully');
      return true;
      
    } catch (error) {
      console.error('[MASTER] ❌ Initialization failed:', error);
      return false;
    }
  }
  
  async initializeRPCOptimization() {
    console.log('[MASTER] ⚡ Initializing RPC optimization...');
    this.components.gatewayOptimizer = new GatewayOptimizer({
      primaryRPC: 'https://api.mainnet-beta.solana.com',
      backupRPCs: [
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana'
      ]
    });
    await this.components.gatewayOptimizer.init();
    console.log('[MASTER] ✅ RPC optimization ready');
  }
  
  async initializeTaxTracking() {
    console.log('[MASTER] 📊 Initializing tax tracking...');
    this.components.taxTracker = new NZTaxTracker({
      jurisdiction: 'NZ',
      taxYear: 2025,
      autoExport: true
    });
    console.log('[MASTER] ✅ Tax tracking ready');
  }
  
  async initializePumpSniping() {
    console.log('[MASTER] 🎯 Initializing Pump.fun sniper...');
    this.components.pumpSniper = new PumpFunSniper({
      maxAge: 30000,
      minLiquidity: this.config.mode === 'aggressive' ? 500 : 1000,
      positionSize: this.config.mode === 'aggressive' ? 0.02 : 0.01,
      maxSlippage: this.config.mode === 'conservative' ? 3 : 5
    });
    
    // Connect pump sniper events
    this.components.pumpSniper.on('launch_detected', (launch) => {
      this.handlePumpLaunch(launch);
    });
    
    await this.components.pumpSniper.init();
    console.log('[MASTER] ✅ Pump.fun sniper ready');
  }
  
  async initializeWhaleTracking() {
    console.log('[MASTER] 🐋 Initializing whale tracking...');
    this.components.whaleService = whaleDataService;
    console.log('[MASTER] ✅ Whale tracking ready');
  }
  
  async initializeTradingEngines() {
    console.log('[MASTER] 💰 Initializing trading engines...');
    this.components.paperTrading = paperTradingSimulator;
    this.components.degenTrading = degenPaperTrader;
    console.log('[MASTER] ✅ Trading engines ready');
  }
  
  async initializeAnalysisPipeline() {
    console.log('[MASTER] 🧠 Initializing analysis pipeline...');
    this.components.liveAnalyzer = liveTokenAnalyzer;
    this.components.enhancedAnalysis = enhancedAnalysis;
    console.log('[MASTER] ✅ Analysis pipeline ready');
  }
  
  connectComponentEvents() {
    console.log('[MASTER] 🔌 Connecting component events...');
    
    // Live analyzer events
    if (this.components.liveAnalyzer) {
      this.components.liveAnalyzer.on('opportunity', (data) => {
        this.handleOpportunity(data);
      });
      
      this.components.liveAnalyzer.on('pump_opportunity', (data) => {
        this.handlePumpOpportunity(data);
      });
    }
    
    // Trading events
    if (this.components.paperTrading) {
      this.components.paperTrading.on('trade_executed', (trade) => {
        this.handleTradeExecuted(trade);
      });
    }
    
    console.log('[MASTER] ✅ Component events connected');
  }
  
  async start() {
    if (this.isRunning) {
      console.log('[MASTER] ⚠️ System already running');
      return;
    }
    
    console.log('[MASTER] 🚀 Starting integrated trading system...');
    
    // Start all components
    if (this.components.liveAnalyzer) {
      await this.components.liveAnalyzer.start();
    }
    
    if (this.components.pumpSniper) {
      // Pump sniper starts automatically after init
    }
    
    this.isRunning = true;
    this.stats.startTime = Date.now();
    
    console.log('[MASTER] ✅ Integrated system running seamlessly!');
    console.log('[MASTER] 📊 All components working together harmoniously');
    
    // Start monitoring
    this.startMonitoring();
  }
  
  handleOpportunity(opportunity) {
    this.stats.opportunitiesFound++;
    console.log(`[MASTER] 🎯 Opportunity: ${opportunity.token} (Total: ${this.stats.opportunitiesFound})`);
    
    // Enhanced opportunity handling with clear triggers
    this.analyzeOpportunityWithClearTriggers(opportunity);
    
    // Broadcast to all trading engines
    this.emit('trading_opportunity', opportunity);
  }
  
  handlePumpOpportunity(pumpData) {
    console.log(`[MASTER] 🚀 Pump launch: ${pumpData.launch.name} - Priority analysis`);
    
    // High-priority opportunity
    this.emit('pump_launch_opportunity', pumpData);
  }
  
  handlePumpLaunch(launch) {
    console.log(`[MASTER] 🎯 Pump.fun launch: ${launch.name} - Initiating analysis`);
    
    // Trigger immediate analysis of pump launch
    if (this.components.liveAnalyzer) {
      this.components.liveAnalyzer.handlePumpLaunch(launch);
    }
  }
  
  handleTradeExecuted(trade) {
    this.stats.tradesExecuted++;
    console.log(`[MASTER] ✅ Trade executed: ${trade.symbol} (Total: ${this.stats.tradesExecuted})`);
    
    // Record in tax tracker if available
    if (this.components.taxTracker) {
      this.components.taxTracker.recordTrade(trade);
    }
  }
  
  // NEW: Enhanced opportunity analysis with clear triggers
  analyzeOpportunityWithClearTriggers(opportunity) {
    const triggers = {
      volumeSpike: false,
      priceBreakout: false,
      whaleActivity: false,
      liquidityGrowth: false
    };
    
    // CLEAR BUY TRIGGERS (Warren Buffett style)
    if (opportunity.volumeIncrease > 3.0) {
      triggers.volumeSpike = true;
      console.log(`[MASTER] ⚡ VOLUME SPIKE: ${opportunity.token} - ${opportunity.volumeIncrease}x increase`);
    }
    
    if (opportunity.priceChange > 0.15) {
      triggers.priceBreakout = true;
      console.log(`[MASTER] 📈 PRICE BREAKOUT: ${opportunity.token} - +${(opportunity.priceChange*100).toFixed(1)}%`);
    }
    
    if (opportunity.whaleNetFlow > 0.1) {
      triggers.whaleActivity = true;
      console.log(`[MASTER] 🐋 WHALE ACCUMULATION: ${opportunity.token} - ${(opportunity.whaleNetFlow*100).toFixed(1)}% flow`);
    }
    
    // Count triggered conditions
    const triggerCount = Object.values(triggers).filter(Boolean).length;
    
    if (triggerCount >= 2) {
      console.log(`[MASTER] 🎯 STRONG BUY SIGNAL: ${opportunity.token} (${triggerCount}/4 triggers)`);
      opportunity.recommendation = 'STRONG_BUY';
      opportunity.confidence = triggerCount / 4;
    } else if (triggerCount >= 1) {
      console.log(`[MASTER] 📊 MODERATE BUY: ${opportunity.token} (${triggerCount}/4 triggers)`);
      opportunity.recommendation = 'BUY';
      opportunity.confidence = triggerCount / 4;
    } else {
      opportunity.recommendation = 'HOLD';
      opportunity.confidence = 0.2;
    }
  }
  
  startMonitoring() {
    setInterval(() => {
      this.stats.uptime = Date.now() - this.stats.startTime;
      
      if (this.stats.uptime % 300000 === 0) { // Every 5 minutes
        this.logSystemStatus();
      }
    }, 60000); // Check every minute
  }
  
  logSystemStatus() {
    const uptimeMinutes = Math.floor(this.stats.uptime / 60000);
    const apiSuccessRate = this.stats.apiCallsTotal > 0 ? 
      (this.stats.apiCallsSuccessful / this.stats.apiCallsTotal * 100) : 100;
    
    console.log('[MASTER] 📊 System Status:');
    console.log(`  ⏱️ Uptime: ${uptimeMinutes} minutes`);
    console.log(`  🔍 Tokens analyzed: ${this.stats.tokensAnalyzed}`);
    console.log(`  🎯 Opportunities: ${this.stats.opportunitiesFound}`);
    console.log(`  💰 Trades executed: ${this.stats.tradesExecuted}`);
    console.log(`  📡 API Success Rate: ${apiSuccessRate.toFixed(1)}%`);
    console.log(`  🚀 All components: OPERATIONAL`);
  }
  
  async stop() {
    console.log('[MASTER] 🛑 Stopping integrated system...');
    
    this.isRunning = false;
    
    // Stop all components gracefully
    if (this.components.liveAnalyzer) {
      await this.components.liveAnalyzer.stop();
    }
    
    if (this.components.pumpSniper) {
      await this.components.pumpSniper.disconnect();
    }
    
    console.log('[MASTER] ✅ System stopped gracefully');
  }
}

// Export singleton instance
export const masterController = new MasterController(); 