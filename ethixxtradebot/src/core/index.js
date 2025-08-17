#!/usr/bin/env node
/**
 * ETHIXXTRADEBOT CORE - Unified Trading System
 * Consolidated architecture with 7 optimized modules
 */

import { config } from 'dotenv';
config({ path: './axiom_tokens.env' });

// Import core modules in dependency order
import { dataManager } from './DataManager.js';
import { intelligenceEngine } from './IntelligenceEngine.js';
import { strategyEngine } from './StrategyEngine.js';
import { riskManager } from './RiskManager.js';
import { executionManager } from './ExecutionManager.js';
import { systemMonitor } from './SystemMonitor.js';
// Disabled ApiServer - using gui/server.js instead
// import { apiServer } from './ApiServer.js';
import { connectionManager } from './ConnectionManager.js';
import { learningSystem } from './LearningSystem.js';
import { paperTradingSystem } from './PaperTradingSystem.js';

class EthixxTradeBot {
  constructor() {
    this.modules = {
      connectionManager,    // Phase 4: Connection optimization
      learningSystem,       // Phase 6: AI learning
      paperTradingSystem,   // Real paper trading with P&L tracking
      dataManager,
      intelligenceEngine,
      strategyEngine,
      riskManager,
      executionManager,
      systemMonitor
      // apiServer - disabled, using gui/server.js instead
    };
    
    this.initialized = false;
  }
  
  async initialize() {
    console.log('\n🚀 ETHIXXTRADEBOT CORE INITIALIZATION');
    console.log('🎯 PHASES 4-7 FULLY INTEGRATED');
    console.log('━'.repeat(50));
    
    try {
      // Initialize in dependency order with new advanced modules
      await connectionManager.initialize();   // Phase 4: Optimized connections
      await learningSystem.initialize();      // Phase 6: AI optimization
      await paperTradingSystem.initialize();  // Paper trading with real P&L
      await dataManager.initialize();
      await intelligenceEngine.initialize();
      await strategyEngine.initialize();
      await riskManager.initialize();
      await executionManager.initialize();
      await systemMonitor.initialize();
      // await apiServer.initialize(); // Disabled - using gui/server.js instead
      
      this.initialized = true;
      
      console.log('━'.repeat(50));
      console.log('✅ ALL SYSTEMS OPERATIONAL');
      console.log(`📍 Location: Auckland (254ms advantage)`);
      console.log(`📊 Dashboard: http://localhost:3000`);
      console.log('━'.repeat(50));
      
      // START TEST MODE FOR DEMONSTRATION
      if (process.env.TEST_MODE === 'true') { // Only if explicitly enabled
        const { startTestMode } = await import('./PaperTradingTestMode.js');
        startTestMode(paperTradingSystem, 5000); // Generate trades every 5 seconds
      }
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      console.error('❌ INITIALIZATION FAILED:', error.message);
      process.exit(1);
    }
  }
  
  async shutdown() {
    console.log('\n🛑 SHUTTING DOWN...');
    
    try {
      // Shutdown modules in reverse order
      // await apiServer.shutdown(); // Disabled - using gui/server.js instead
      await systemMonitor?.shutdown?.();
      await executionManager?.shutdown?.();
      await riskManager?.shutdown?.();
      await strategyEngine?.shutdown?.();
      await intelligenceEngine?.shutdown?.();
      await dataManager?.shutdown?.();
      await paperTradingSystem?.shutdown?.();
      await learningSystem?.shutdown?.();
      await connectionManager?.shutdown?.();
      
      console.log('✅ SHUTDOWN COMPLETE');
      process.exit(0);
    } catch (error) {
      console.error('❌ SHUTDOWN ERROR:', error.message);
      process.exit(1);
    }
  }
}

// Start the system
const bot = new EthixxTradeBot();
bot.initialize().catch(console.error); 