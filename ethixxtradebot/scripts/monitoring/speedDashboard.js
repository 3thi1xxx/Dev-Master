#!/usr/bin/env node

import { UltraFastAxiomClient } from '../services/UltraFastAxiomClient.js';
import { GatewayOptimizer } from '../utils/GatewayOptimizer.js';

/**
 * Real-time Speed Monitoring Dashboard
 * Target: Sub-30ms end-to-end execution monitoring
 */
class SpeedDashboard {
  constructor() {
    this.ultraFastClient = new UltraFastAxiomClient();
    this.gatewayOptimizer = new GatewayOptimizer();
    
    this.speedTargets = {
      astralane_gateway: 10, // ms
      websocket_streams: 5,  // ms per message
      solana_rpc: 5,         // ms per call
      mev_submission: 15,    // ms
      total_execution: 30    // ms end-to-end
    };
    
    this.currentMetrics = {
      apiLatency: 0,
      wsLatency: 0,
      successRate: 0,
      activeConnections: 0,
      totalRequests: 0,
      speedAdvantage: 0
    };
    
    this.isRunning = false;
    this.logger = console;
  }

  async init() {
    this.logger.log('⚡ ULTRA-SPEED MONITORING DASHBOARD');
    this.logger.log('═══════════════════════════════════');
    
    try {
      // Initialize ultra-fast client
      await this.ultraFastClient.init();
      
      // Initialize gateway optimizer
      await this.gatewayOptimizer.init();
      
      this.logger.log('✅ Speed monitoring systems ready!');
      
    } catch (error) {
      this.logger.log('❌ Dashboard initialization failed:', error.message);
      throw error;
    }
  }

  startMonitoring() {
    this.isRunning = true;
    this.logger.log('');
    this.logger.log('🚀 STARTING REAL-TIME SPEED MONITORING');
    this.logger.log('Target: Sub-30ms end-to-end execution');
    this.logger.log('');
    
    // Real-time dashboard updates every 5 seconds
    this.dashboardTimer = setInterval(() => {
      this.updateDashboard();
    }, 5000);
    
    // Speed tests every 10 seconds
    this.speedTestTimer = setInterval(() => {
      this.runSpeedTests();
    }, 10000);
    
    // Performance baseline every 30 seconds
    this.baselineTimer = setInterval(() => {
      this.runPerformanceBaseline();
    }, 30000);
    
    // Start with immediate tests
    setTimeout(() => this.runSpeedTests(), 1000);
    setTimeout(() => this.runPerformanceBaseline(), 5000);
  }

  async updateDashboard() {
    // Clear screen for real-time updates
    console.clear();
    
    const stats = this.ultraFastClient.getPerformanceStats();
    // const gatewayStats = this.gatewayOptimizer.getPerformanceStats();
    
    this.currentMetrics = {
      apiLatency: stats.averageLatency || 0,
      wsLatency: this.calculateWSLatency(),
      successRate: stats.successRate || 0,
      activeConnections: stats.activeWebSockets || 0,
      totalRequests: stats.totalRequests || 0,
      speedAdvantage: this.calculateSpeedAdvantage()
    };
    
    this.renderDashboard();
  }

  calculateWSLatency() {
    const wsStats = this.ultraFastClient.latencyStats?.websockets || [];
    if (wsStats.length === 0) return 0;
    
    const recent = wsStats.slice(-10); // Last 10 messages
    return recent.reduce((sum, ws) => sum + ws.processingTime, 0) / recent.length;
  }

  calculateSpeedAdvantage() {
    const ourLatency = this.currentMetrics.apiLatency;
    const competitorLatency = 300; // Typical competitor latency
    
    if (ourLatency > 0) {
      return Math.round(competitorLatency / ourLatency * 10) / 10;
    }
    return 0;
  }

  renderDashboard() {
    const now = new Date().toLocaleTimeString();
    
    this.logger.log('⚡ AXIOM ULTRA-SPEED DASHBOARD');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`🕐 ${now} | 🎯 Target: <30ms execution | 🚀 Mode: ${this.ultraFastClient.routing.primary_confirmed ? 'Astralane Direct' : 'API Fallback'}`);
    this.logger.log('');
    
    // Speed Metrics
    this.logger.log('⚡ SPEED METRICS:');
    this.renderSpeedMetric('API Latency', this.currentMetrics.apiLatency, this.speedTargets.astralane_gateway, 'ms');
    this.renderSpeedMetric('WebSocket Latency', this.currentMetrics.wsLatency, this.speedTargets.websocket_streams, 'ms');
    this.renderSpeedMetric('Success Rate', this.currentMetrics.successRate * 100, 95, '%');
    this.logger.log('');
    
    // Connection Status
    this.logger.log('📡 CONNECTION STATUS:');
    this.logger.log(`  🔗 Active WebSockets: ${this.currentMetrics.activeConnections}/3`);
    this.logger.log(`  📊 Total Requests: ${this.currentMetrics.totalRequests}`);
    this.logger.log(`  🎯 Speed Advantage: ${this.currentMetrics.speedAdvantage}x faster`);
    this.logger.log('');
    
    // Speed Targets Status
    this.logger.log('🎯 SPEED TARGETS:');
    this.renderTargetStatus('Astralane Gateway', this.currentMetrics.apiLatency, this.speedTargets.astralane_gateway);
    this.renderTargetStatus('WebSocket Streams', this.currentMetrics.wsLatency, this.speedTargets.websocket_streams);
    this.renderTargetStatus('Total Execution', this.getTotalExecutionTime(), this.speedTargets.total_execution);
    this.logger.log('');
    
    // Performance Summary
    this.renderPerformanceSummary();
  }

  renderSpeedMetric(name, value, target, unit) {
    const status = value <= target ? '✅' : value <= target * 2 ? '⚠️' : '❌';
    const valueStr = value.toFixed(1);
    const targetStr = target.toString();
    
    this.logger.log(`  ${status} ${name}: ${valueStr}${unit} (target: <${targetStr}${unit})`);
  }

  renderTargetStatus(name, value, target) {
    const percentage = target > 0 ? Math.min(100, (target / Math.max(value, 0.1)) * 100) : 0;
    const status = percentage >= 100 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
    
    this.logger.log(`  ${status} ${name}: ${percentage.toFixed(0)}% of target`);
  }

  getTotalExecutionTime() {
    return this.currentMetrics.apiLatency + this.currentMetrics.wsLatency;
  }

  renderPerformanceSummary() {
    const totalExecution = this.getTotalExecutionTime();
    const overallStatus = totalExecution <= this.speedTargets.total_execution ? '🚀 OPTIMAL' : 
                         totalExecution <= this.speedTargets.total_execution * 2 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT';
    
    this.logger.log('📊 PERFORMANCE SUMMARY:');
    this.logger.log(`  Overall Status: ${overallStatus}`);
    this.logger.log(`  Total Execution: ${totalExecution.toFixed(1)}ms`);
    this.logger.log(`  vs Competitors: ${this.currentMetrics.speedAdvantage}x advantage`);
    this.logger.log(`  Uptime: ${this.isRunning ? 'ACTIVE' : 'STOPPED'}`);
  }

  async runSpeedTests() {
    if (!this.isRunning) return;
    
    try {
      // Test API speed
      const start = performance.now();
      await this.ultraFastClient.ultraFastRequest('api/health', null, { timeout: 50 });
      const apiLatency = performance.now() - start;
      
      // Test parallel data collection
      const parallelStart = performance.now();
      await this.ultraFastClient.getMarketDataParallel();
      const parallelLatency = performance.now() - parallelStart;
      
      // Update internal metrics
      this.recordSpeedTest('api_request', apiLatency);
      this.recordSpeedTest('parallel_collection', parallelLatency);
      
    } catch (error) {
      this.recordSpeedTest('api_request', 999, false);
    }
  }

  async runPerformanceBaseline() {
    if (!this.isRunning) return;
    
    try {
      // Test gateway optimizer performance
      const gatewayStart = performance.now();
      await this.gatewayOptimizer.optimizeGatewaySelection();
      const gatewayLatency = performance.now() - gatewayStart;
      
      this.recordSpeedTest('gateway_optimization', gatewayLatency);
      
    } catch (error) {
      this.recordSpeedTest('gateway_optimization', 999, false);
    }
  }

  recordSpeedTest(testType, latency, success = true) {
    // This could be expanded to store historical data
    if (latency < 10) {
      // Log exceptional performance
      this.logger.log(`🔥 Exceptional speed: ${testType} in ${latency.toFixed(1)}ms`);
    }
  }

  async runContinuousSpeedTest() {
    this.logger.log('');
    this.logger.log('🧪 RUNNING CONTINUOUS SPEED VALIDATION...');
    
    const testDuration = 60000; // 1 minute
    const testInterval = 1000;  // Every second
    const startTime = Date.now();
    
    const speedResults = [];
    
    while (Date.now() - startTime < testDuration && this.isRunning) {
      try {
        const testStart = performance.now();
        
        // Rapid-fire API tests
        const promises = [
          this.ultraFastClient.ultraFastRequest('api/health'),
          this.ultraFastClient.ultraFastRequest('api/status'),
          this.ultraFastClient.ultraFastRequest('api/ping')
        ];
        
        await Promise.allSettled(promises);
        const testLatency = performance.now() - testStart;
        
        speedResults.push(testLatency);
        
        // Show real-time results
        const avgLatency = speedResults.reduce((a, b) => a + b, 0) / speedResults.length;
        process.stdout.write(`\r  ⚡ Speed test: ${testLatency.toFixed(1)}ms | Avg: ${avgLatency.toFixed(1)}ms | Tests: ${speedResults.length}`);
        
        await new Promise(resolve => setTimeout(resolve, testInterval));
        
      } catch (error) {
        process.stdout.write(`\r  ❌ Speed test failed: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, testInterval));
      }
    }
    
    // Final results
    const avgLatency = speedResults.reduce((a, b) => a + b, 0) / speedResults.length;
    const minLatency = Math.min(...speedResults);
    const maxLatency = Math.max(...speedResults);
    
    this.logger.log('\n');
    this.logger.log('📊 SPEED TEST RESULTS:');
    this.logger.log(`  Tests Completed: ${speedResults.length}`);
    this.logger.log(`  Average Latency: ${avgLatency.toFixed(1)}ms`);
    this.logger.log(`  Best Time: ${minLatency.toFixed(1)}ms`);
    this.logger.log(`  Worst Time: ${maxLatency.toFixed(1)}ms`);
    this.logger.log(`  Target Achievement: ${avgLatency <= this.speedTargets.total_execution ? '✅ SUCCESS' : '❌ NEEDS IMPROVEMENT'}`);
  }

  stop() {
    this.isRunning = false;
    
    if (this.dashboardTimer) clearInterval(this.dashboardTimer);
    if (this.speedTestTimer) clearInterval(this.speedTestTimer);
    if (this.baselineTimer) clearInterval(this.baselineTimer);
    
    this.logger.log('');
    this.logger.log('🛑 Speed monitoring stopped');
    
    // Final performance summary
    const finalStats = this.ultraFastClient.getPerformanceStats();
    this.logger.log('');
    this.logger.log('📊 FINAL PERFORMANCE SUMMARY:');
    this.logger.log(`  Average Latency: ${finalStats.averageLatency?.toFixed(1) || 0}ms`);
    this.logger.log(`  Success Rate: ${((finalStats.successRate || 0) * 100).toFixed(1)}%`);
    this.logger.log(`  Total Requests: ${finalStats.totalRequests || 0}`);
    this.logger.log(`  Speed Advantage: ${this.calculateSpeedAdvantage()}x`);
  }

  async cleanup() {
    this.stop();
    await this.ultraFastClient.close();
    this.logger.log('✅ Speed dashboard cleanup complete');
  }
}

// Run the dashboard if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new SpeedDashboard();
  
  dashboard.init().then(() => {
    dashboard.startMonitoring();
    
    // Show menu options
    console.log('');
    console.log('🎮 DASHBOARD CONTROLS:');
    console.log('  [SPACE] - Run continuous speed test');
    console.log('  [CTRL+C] - Stop monitoring');
    console.log('');
    
    // Handle keyboard input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      if (key.toString() === ' ') {
        await dashboard.runContinuousSpeedTest();
      }
    });
    
  }).catch(error => {
    console.error('❌ Dashboard failed to start:', error.message);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down speed dashboard...');
    await dashboard.cleanup();
    process.exit(0);
  });
}

export { SpeedDashboard }; 