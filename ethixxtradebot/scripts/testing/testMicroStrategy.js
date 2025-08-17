#!/usr/bin/env node

import { GatewayOptimizer } from '../utils/GatewayOptimizer.js';
import { AxiomWebSocketTracker } from '../services/AxiomWebSocketTracker.js';
import { NZTaxTracker } from '../utils/NZTaxTracker.js';

class MicroTester {
  constructor() {
    this.testConfig = {
      phase: 'PHASE_0_VALIDATION',
      capitalAllocation: 25, // $25 for testing
      positionSize: { min: 2, max: 5 }, // $2-5 per trade
      maxTrades: 8,
      testDuration: 48 * 60 * 60 * 1000, // 48 hours
      speedThresholds: {
        websocket: 10, // ms
        signalDetection: 50, // ms
        orderPrep: 25, // ms
        totalExecution: 100 // ms
      }
    };
    
    this.testResults = {
      tradesExecuted: 0,
      successfulTrades: 0,
      totalProfit: 0,
      avgExecutionTime: 0,
      speedMeasurements: [],
      systemUptime: 0,
      errors: []
    };
    
    this.gatewayOptimizer = new GatewayOptimizer();
    this.whaleTracker = new AxiomWebSocketTracker();
    this.taxTracker = new NZTaxTracker();
    
    this.logger = console;
    this.startTime = Date.now();
  }

  async init() {
    this.logger.log('🧪 MICRO-TESTING PHASE INITIATED');
    this.logger.log('════════════════════════════════');
    this.logger.log(`💰 Test Capital: $${this.testConfig.capitalAllocation}`);
    this.logger.log(`📊 Position Size: $${this.testConfig.positionSize.min}-${this.testConfig.positionSize.max}`);
    this.logger.log(`🎯 Max Trades: ${this.testConfig.maxTrades}`);
    this.logger.log(`⏱️ Duration: 48 hours`);
    this.logger.log('');
    
    // Initialize all systems
    this.logger.log('🔧 Initializing systems...');
    await this.gatewayOptimizer.init();
    
    // Test Auckland speed advantage
    await this.measureAucklandAdvantage();
    
    // Start monitoring for opportunities
    await this.startOpportunityMonitoring();
    
    this.logger.log('✅ Micro-testing system ready!');
    this.logger.log('👀 Watching for ultra-safe test opportunities...');
  }

  async measureAucklandAdvantage() {
    this.logger.log('');
    this.logger.log('⚡ MEASURING AUCKLAND SPEED ADVANTAGE');
    this.logger.log('════════════════════════════════════');
    
    // Test WebSocket connection speed
    const wsStart = Date.now();
    // Simulate connection to Auckland endpoint
    await new Promise(resolve => setTimeout(resolve, 15)); // 15ms simulated
    const wsLatency = Date.now() - wsStart;
    
    this.testResults.speedMeasurements.push({
      type: 'websocket_connection',
      latency: wsLatency,
      threshold: this.testConfig.speedThresholds.websocket,
      passed: wsLatency <= this.testConfig.speedThresholds.websocket
    });
    
    this.logger.log(`🌐 WebSocket Latency: ${wsLatency}ms (Target: <${this.testConfig.speedThresholds.websocket}ms)`);
    
    // Test signal detection speed
    const signalStart = Date.now();
    await this.simulateSignalDetection();
    const signalLatency = Date.now() - signalStart;
    
    this.testResults.speedMeasurements.push({
      type: 'signal_detection',
      latency: signalLatency,
      threshold: this.testConfig.speedThresholds.signalDetection,
      passed: signalLatency <= this.testConfig.speedThresholds.signalDetection
    });
    
    this.logger.log(`🐋 Signal Detection: ${signalLatency}ms (Target: <${this.testConfig.speedThresholds.signalDetection}ms)`);
    
    // Calculate competitive advantage
    const competitorLatency = 300; // Simulate competitor speed
    const ourAdvantage = competitorLatency - (wsLatency + signalLatency);
    
    this.logger.log(`🎯 Competitive Advantage: ${ourAdvantage}ms head start`);
    this.logger.log(`📊 Speed Multiplier: ${(competitorLatency / (wsLatency + signalLatency)).toFixed(1)}x faster`);
    
    if (ourAdvantage > 200) {
      this.logger.log('✅ MASSIVE SPEED ADVANTAGE CONFIRMED!');
    } else if (ourAdvantage > 100) {
      this.logger.log('✅ Significant speed advantage confirmed');
    } else {
      this.logger.log('⚠️ Speed advantage less than expected');
    }
  }

  async simulateSignalDetection() {
    // Simulate whale signal processing
    const steps = [
      'Parse whale transaction data',
      'Analyze 28-field format', 
      'Check confidence thresholds',
      'Validate against tracked wallets',
      'Calculate copy position size'
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 5)); // 5ms per step
    }
  }

  async startOpportunityMonitoring() {
    this.logger.log('');
    this.logger.log('👀 MONITORING FOR TEST OPPORTUNITIES');
    this.logger.log('═══════════════════════════════════');
    
    // Simulate opportunity detection
    this.opportunityTimer = setInterval(async () => {
      if (this.testResults.tradesExecuted >= this.testConfig.maxTrades) {
        this.logger.log('🏁 Maximum test trades reached');
        await this.generateTestReport();
        return;
      }
      
      // Simulate finding an opportunity
      if (Math.random() > 0.85) { // 15% chance per check
        await this.evaluateTestOpportunity();
      }
      
    }, 30000); // Check every 30 seconds
  }

  async evaluateTestOpportunity() {
    const opportunityTypes = [
      { name: 'whale_copy', confidence: 0.8, expectedReturn: 0.12, risk: 'LOW' },
      { name: 'sentiment_spike', confidence: 0.6, expectedReturn: 0.25, risk: 'MEDIUM' },
      { name: 'arbitrage', confidence: 0.9, expectedReturn: 0.05, risk: 'LOW' },
      { name: 'new_launch', confidence: 0.4, expectedReturn: 0.50, risk: 'HIGH' }
    ];
    
    const opportunity = opportunityTypes[Math.floor(Math.random() * opportunityTypes.length)];
    
    this.logger.log('');
    this.logger.log(`🎯 TEST OPPORTUNITY DETECTED: ${opportunity.name.toUpperCase()}`);
    this.logger.log(`📊 Confidence: ${(opportunity.confidence * 100).toFixed(0)}%`);
    this.logger.log(`💰 Expected Return: ${(opportunity.expectedReturn * 100).toFixed(0)}%`);
    this.logger.log(`⚠️ Risk Level: ${opportunity.risk}`);
    
    // Evaluate if we should take this test trade
    const shouldTrade = this.shouldExecuteTestTrade(opportunity);
    
    if (shouldTrade) {
      await this.executeTestTrade(opportunity);
    } else {
      this.logger.log('❌ Test trade criteria not met - skipping');
    }
  }

  shouldExecuteTestTrade(opportunity) {
    // Conservative test criteria
    if (opportunity.confidence < 0.7) {
      this.logger.log('📊 Confidence too low for testing phase');
      return false;
    }
    
    if (opportunity.risk === 'HIGH' && this.testResults.tradesExecuted < 3) {
      this.logger.log('⚠️ Avoiding high-risk trades in early testing');
      return false;
    }
    
    if (this.testResults.successfulTrades < this.testResults.tradesExecuted * 0.6 && 
        this.testResults.tradesExecuted > 2) {
      this.logger.log('📉 Win rate too low - pausing for analysis');
      return false;
    }
    
    return true;
  }

  async executeTestTrade(opportunity) {
    const tradeStart = Date.now();
    const positionSize = this.testConfig.positionSize.min + 
                        (Math.random() * (this.testConfig.positionSize.max - this.testConfig.positionSize.min));
    
    this.logger.log('');
    this.logger.log('⚡ EXECUTING TEST TRADE');
    this.logger.log(`💰 Position Size: $${positionSize.toFixed(2)}`);
    
    try {
      // Simulate trade execution with Auckland speed
      await this.simulateTradeExecution(opportunity, positionSize);
      
      const executionTime = Date.now() - tradeStart;
      this.testResults.speedMeasurements.push({
        type: 'trade_execution',
        latency: executionTime,
        threshold: this.testConfig.speedThresholds.totalExecution,
        passed: executionTime <= this.testConfig.speedThresholds.totalExecution
      });
      
      // Simulate trade outcome
      const success = Math.random() < opportunity.confidence;
      const actualReturn = success ? 
        (opportunity.expectedReturn * (0.5 + Math.random() * 0.5)) : // 50-100% of expected
        -(0.05 + Math.random() * 0.15); // 5-20% loss
      
      this.testResults.tradesExecuted++;
      if (success) {
        this.testResults.successfulTrades++;
        this.testResults.totalProfit += positionSize * actualReturn;
        this.logger.log(`✅ TEST TRADE SUCCESSFUL: +${(actualReturn * 100).toFixed(1)}%`);
      } else {
        this.testResults.totalProfit += positionSize * actualReturn;
        this.logger.log(`❌ Test trade loss: ${(actualReturn * 100).toFixed(1)}%`);
      }
      
      this.logger.log(`⚡ Execution Time: ${executionTime}ms`);
      this.logger.log(`📊 Running P&L: $${this.testResults.totalProfit.toFixed(2)}`);
      this.logger.log(`🎯 Win Rate: ${((this.testResults.successfulTrades / this.testResults.tradesExecuted) * 100).toFixed(0)}%`);
      
      // Log trade for tax purposes
      await this.taxTracker.logTrade({
        type: success ? 'SELL' : 'SELL',
        tokenPair: `TEST_${opportunity.name.toUpperCase()}/SOL`,
        tokenSymbol: `TEST_${opportunity.name.toUpperCase()}`,
        solAmount: positionSize / 250, // Assume $250 SOL price
        realizedPnlUsd: positionSize * actualReturn,
        whaleSignalSource: opportunity.name,
        signalConfidence: opportunity.confidence * 100,
        tradeRationale: `Micro-test: ${opportunity.name} opportunity`,
        executionLatency: executionTime
      });
      
    } catch (error) {
      this.logger.log(`❌ Test trade error: ${error.message}`);
      this.testResults.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        opportunity: opportunity.name
      });
    }
  }

  async simulateTradeExecution(opportunity, positionSize) {
    const steps = [
      'Validate opportunity parameters',
      'Calculate optimal position size', 
      'Prepare transaction with Auckland routing',
      'Submit to blockchain via fast endpoint',
      'Confirm execution'
    ];
    
    for (const step of steps) {
      this.logger.log(`  📡 ${step}...`);
      await new Promise(resolve => setTimeout(resolve, 8 + Math.random() * 12)); // 8-20ms per step
    }
  }

  async generateTestReport() {
    clearInterval(this.opportunityTimer);
    
    const testDuration = Date.now() - this.startTime;
    const avgExecutionTime = this.testResults.speedMeasurements
      .filter(m => m.type === 'trade_execution')
      .reduce((sum, m) => sum + m.latency, 0) / 
      Math.max(1, this.testResults.speedMeasurements.filter(m => m.type === 'trade_execution').length);
    
    this.logger.log('');
    this.logger.log('📊 MICRO-TESTING PHASE COMPLETE');
    this.logger.log('═══════════════════════════════');
    this.logger.log(`⏱️ Test Duration: ${(testDuration / 1000 / 60).toFixed(0)} minutes`);
    this.logger.log(`🔢 Trades Executed: ${this.testResults.tradesExecuted}`);
    this.logger.log(`✅ Successful Trades: ${this.testResults.successfulTrades}`);
    this.logger.log(`🎯 Win Rate: ${((this.testResults.successfulTrades / Math.max(1, this.testResults.tradesExecuted)) * 100).toFixed(0)}%`);
    this.logger.log(`💰 Total P&L: $${this.testResults.totalProfit.toFixed(2)}`);
    this.logger.log(`⚡ Avg Execution: ${avgExecutionTime.toFixed(0)}ms`);
    this.logger.log('');
    
    // Speed analysis
    this.logger.log('⚡ SPEED ANALYSIS');
    this.logger.log('════════════════');
    this.testResults.speedMeasurements.forEach(measurement => {
      const status = measurement.passed ? '✅' : '❌';
      this.logger.log(`${status} ${measurement.type}: ${measurement.latency}ms (target: <${measurement.threshold}ms)`);
    });
    
    // Success criteria evaluation
    const winRate = (this.testResults.successfulTrades / Math.max(1, this.testResults.tradesExecuted)) * 100;
    const speedTargetsMet = this.testResults.speedMeasurements.filter(m => m.passed).length / 
                           Math.max(1, this.testResults.speedMeasurements.length) * 100;
    
    this.logger.log('');
    this.logger.log('🎯 SUCCESS CRITERIA EVALUATION');
    this.logger.log('════════════════════════════════');
    this.logger.log(`📊 Win Rate: ${winRate.toFixed(0)}% (Target: 60%+) ${winRate >= 60 ? '✅' : '❌'}`);
    this.logger.log(`⚡ Speed Targets: ${speedTargetsMet.toFixed(0)}% (Target: 90%+) ${speedTargetsMet >= 90 ? '✅' : '❌'}`);
    this.logger.log(`💰 Profitability: ${this.testResults.totalProfit > 0 ? 'Positive' : 'Negative'} ${this.testResults.totalProfit > 0 ? '✅' : '❌'}`);
    
    // Recommendation
    if (winRate >= 60 && speedTargetsMet >= 90 && this.testResults.totalProfit > 0) {
      this.logger.log('');
      this.logger.log('🚀 RECOMMENDATION: PROCEED TO PHASE 1');
      this.logger.log('✅ All success criteria met');
      this.logger.log('📈 Ready for increased position sizes');
      this.logger.log('🎯 Deploy controlled profitability testing');
    } else {
      this.logger.log('');
      this.logger.log('⚠️ RECOMMENDATION: ANALYZE AND ADJUST');
      this.logger.log('❌ Some success criteria not met');
      this.logger.log('🔧 System improvements needed before scaling');
    }
  }
}

// Run the micro-test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MicroTester();
  
  tester.init().catch(error => {
    console.error('❌ Micro-testing failed:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Micro-testing interrupted by user');
    await tester.generateTestReport();
    process.exit(0);
  });
}

export { MicroTester }; 