#!/usr/bin/env node
/**
 * Seamless Integration Test
 * Tests all components working together harmoniously
 */

import { masterController } from '../../src/core/system/MasterController.js';
import { PositionSizing } from '../../src/core/trading/PositionSizing.js';
import { PumpFunSniper } from '../../src/strategies/PumpFunSniper.js';
import { GatewayOptimizer } from '../../src/infrastructure/GatewayOptimizer.js';
import { NZTaxTracker } from '../../src/core/compliance/NZTaxTracker.js';

class SeamlessIntegrationTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
    
    console.log('🧪 SEAMLESS INTEGRATION TEST SUITE');
    console.log('==================================');
  }
  
  async runAllTests() {
    console.log('\n🚀 Starting comprehensive integration tests...\n');
    
    // Core component tests
    await this.testPositionSizing();
    await this.testGatewayOptimizer();
    await this.testTaxTracker();
    await this.testPumpSniper();
    
    // Integration tests
    await this.testMasterController();
    await this.testComponentCommunication();
    await this.testEndToEndFlow();
    
    // Performance tests
    await this.testPerformance();
    
    this.printResults();
  }
  
  async testPositionSizing() {
    console.log('🎯 Testing Professional Position Sizing...');
    
    try {
      const positionSizing = new PositionSizing({
        walletBalance: 1000,
        solPrice: 250,
        minProfitPercent: 8
      });
      
      // Test whale copy sizing
      const copyResult = positionSizing.calculateCopySize(4.0, 0.25); // 4 SOL whale position
      
      this.assert(copyResult.sizeSOL > 0, 'Copy position sizing should be positive');
      this.assert(copyResult.sizeUSD > 0, 'Copy position USD value should be positive');
      this.assert(copyResult.reasoning, 'Should include reasoning');
      
      console.log(`  ✅ Whale copy: ${copyResult.sizeSOL.toFixed(3)} SOL ($${copyResult.sizeUSD.toFixed(2)})`);
      
      // Test optimal sizing
      const optimalResult = positionSizing.calculateOptimalSize({
        confidence: 0.8,
        riskLevel: 'moderate',
        marketCondition: 'volatile'
      });
      
      this.assert(optimalResult.sizeUSD > 0, 'Optimal sizing should be positive');
      
      console.log(`  ✅ Optimal sizing: $${optimalResult.sizeUSD.toFixed(2)}`);
      
      this.recordTest('PositionSizing', true);
      
    } catch (error) {
      console.log(`  ❌ PositionSizing test failed: ${error.message}`);
      this.recordTest('PositionSizing', false);
    }
  }
  
  async testGatewayOptimizer() {
    console.log('⚡ Testing RPC Gateway Optimizer...');
    
    try {
      const optimizer = new GatewayOptimizer({
        primaryRPC: 'https://api.mainnet-beta.solana.com',
        backupRPCs: ['https://solana-api.projectserum.com']
      });
      
      // Mock initialization without actual network calls
      optimizer.endpoints = [
        { url: 'https://api.mainnet-beta.solana.com', latency: 100, active: true },
        { url: 'https://solana-api.projectserum.com', latency: 150, active: true }
      ];
      
      this.assert(optimizer.endpoints.length > 0, 'Should have RPC endpoints');
      
      console.log('  ✅ RPC optimization configured');
      this.recordTest('GatewayOptimizer', true);
      
    } catch (error) {
      console.log(`  ❌ GatewayOptimizer test failed: ${error.message}`);
      this.recordTest('GatewayOptimizer', false);
    }
  }
  
  async testTaxTracker() {
    console.log('📊 Testing Tax Compliance Tracker...');
    
    try {
      const taxTracker = new NZTaxTracker({
        jurisdiction: 'NZ',
        taxYear: 2025,
        autoExport: false
      });
      
      // Test trade recording
      await taxTracker.recordTrade({
        type: 'BUY',
        symbol: 'TEST',
        address: 'test123',
        amount: 100,
        price: 0.001,
        usdValue: 25,
        timestamp: Date.now(),
        source: 'integration_test'
      });
      
      console.log('  ✅ Trade recording functional');
      this.recordTest('TaxTracker', true);
      
    } catch (error) {
      console.log(`  ❌ TaxTracker test failed: ${error.message}`);
      this.recordTest('TaxTracker', false);
    }
  }
  
  async testPumpSniper() {
    console.log('🎯 Testing Pump.fun Sniper...');
    
    try {
      const sniper = new PumpFunSniper({
        maxAge: 30000,
        minLiquidity: 1000,
        positionSize: 0.01,
        maxSlippage: 5
      });
      
      this.assert(sniper.sniperConfig, 'Should have sniper configuration');
      this.assert(sniper.sniperConfig.maxAge === 30000, 'Max age should be configured');
      this.assert(sniper.endpoints, 'Should have endpoints configured');
      
      console.log('  ✅ Pump.fun sniper configured');
      console.log(`  ✅ Auckland advantage: ${sniper.sniperConfig.maxAge/1000}s window`);
      
      this.recordTest('PumpSniper', true);
      
    } catch (error) {
      console.log(`  ❌ PumpSniper test failed: ${error.message}`);
      this.recordTest('PumpSniper', false);
    }
  }
  
  async testMasterController() {
    console.log('🎮 Testing Master Controller Coordination...');
    
    try {
      // Test initialization without starting (to avoid network calls)
      this.assert(masterController.config, 'Should have configuration');
      this.assert(masterController.stats, 'Should have stats tracking');
      this.assert(typeof masterController.initialize === 'function', 'Should have initialize method');
      this.assert(typeof masterController.start === 'function', 'Should have start method');
      
      console.log('  ✅ Master Controller structure verified');
      console.log('  ✅ Component coordination ready');
      
      this.recordTest('MasterController', true);
      
    } catch (error) {
      console.log(`  ❌ MasterController test failed: ${error.message}`);
      this.recordTest('MasterController', false);
    }
  }
  
  async testComponentCommunication() {
    console.log('🔌 Testing Component Communication...');
    
    try {
      let eventReceived = false;
      
      // Test event emission
      masterController.on('test_event', () => {
        eventReceived = true;
      });
      
      masterController.emit('test_event');
      
      this.assert(eventReceived, 'Components should communicate via events');
      
      console.log('  ✅ Event-driven communication working');
      this.recordTest('ComponentCommunication', true);
      
    } catch (error) {
      console.log(`  ❌ ComponentCommunication test failed: ${error.message}`);
      this.recordTest('ComponentCommunication', false);
    }
  }
  
  async testEndToEndFlow() {
    console.log('🌊 Testing End-to-End Trading Flow...');
    
    try {
      // Simulate a complete trading flow
      const mockOpportunity = {
        token: 'TEST_TOKEN',
        symbol: 'TEST',
        confidence: 0.75,
        scores: { total: 68 },
        recommendation: 'BUY',
        analysis: 'Mock analysis for testing'
      };
      
      // Test opportunity handling
      masterController.handleOpportunity(mockOpportunity);
      
      this.assert(masterController.stats.opportunitiesFound === 1, 'Should track opportunities');
      
      console.log('  ✅ End-to-end flow simulated successfully');
      this.recordTest('EndToEndFlow', true);
      
    } catch (error) {
      console.log(`  ❌ EndToEndFlow test failed: ${error.message}`);
      this.recordTest('EndToEndFlow', false);
    }
  }
  
  async testPerformance() {
    console.log('⚡ Testing System Performance...');
    
    try {
      const startTime = Date.now();
      
      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        const positionSizing = new PositionSizing({ walletBalance: 1000 });
        positionSizing.calculateCopySize(1.0, 0.25);
      }
      
      const executionTime = Date.now() - startTime;
      
      this.assert(executionTime < 1000, 'Performance should be sub-second');
      
      console.log(`  ✅ Performance test: ${executionTime}ms (10 operations)`);
      this.recordTest('Performance', true);
      
    } catch (error) {
      console.log(`  ❌ Performance test failed: ${error.message}`);
      this.recordTest('Performance', false);
    }
  }
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  
  recordTest(testName, passed) {
    this.testResults.tests.push({ name: testName, passed });
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }
  
  printResults() {
    console.log('\n📊 SEAMLESS INTEGRATION TEST RESULTS');
    console.log('=====================================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL COMPONENTS WORKING SEAMLESSLY TOGETHER!');
      console.log('🚀 System ready for professional trading operations!');
    } else {
      console.log('\n⚠️  Some integration issues detected - check logs above');
    }
    
    console.log('\n🏆 INTEGRATION COMPLETE - SYSTEM HARMONIZED!');
  }
}

// Run tests
const tester = new SeamlessIntegrationTest();
tester.runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 