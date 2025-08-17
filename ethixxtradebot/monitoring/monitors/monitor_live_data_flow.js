#!/usr/bin/env node

/**
 * LIVE DATA FLOW MONITOR
 * Verifies Premium Plus integration and data flow
 */

import { EventEmitter } from 'node:events';

class LiveDataFlowMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.stats = {
      startTime: Date.now(),
      tokensProcessed: 0,
      successfulAnalysis: 0,
      failedAnalysis: 0,
      birdeyeCalls: 0,
      birdeyeErrors: 0,
      degenAnalysis: 0,
      opportunities: 0,
      avgAnalysisTime: 0
    };
    
    this.isMonitoring = false;
  }
  
  startMonitoring() {
    this.isMonitoring = true;
    console.log('🔍 LIVE DATA FLOW MONITOR STARTED');
    console.log('==================================');
    
    // Monitor for 30 seconds
    setTimeout(() => {
      this.stopMonitoring();
    }, 30000);
  }
  
  stopMonitoring() {
    this.isMonitoring = false;
    this.printSummary();
  }
  
  logTokenAnalysis(token, success, analysisTime, birdeyeErrors = 0) {
    if (!this.isMonitoring) return;
    
    this.stats.tokensProcessed++;
    if (success) {
      this.stats.successfulAnalysis++;
    } else {
      this.stats.failedAnalysis++;
    }
    
    this.stats.birdeyeCalls++;
    this.stats.birdeyeErrors += birdeyeErrors;
    
    // Calculate running average
    this.stats.avgAnalysisTime = (
      (this.stats.avgAnalysisTime * (this.stats.tokensProcessed - 1) + analysisTime) / 
      this.stats.tokensProcessed
    );
    
    console.log(`📊 Token ${token}: ${success ? '✅' : '❌'} (${analysisTime}ms)${birdeyeErrors > 0 ? ` [${birdeyeErrors} Birdeye errors]` : ''}`);
  }
  
  logOpportunity(token, score, confidence) {
    if (!this.isMonitoring) return;
    
    this.stats.opportunities++;
    console.log(`🎯 OPPORTUNITY: ${token} - Score: ${score}/100, Confidence: ${confidence}%`);
  }
  
  printSummary() {
    console.log('\n📊 DATA FLOW MONITOR SUMMARY');
    console.log('=============================');
    console.log(`⏱️  Monitoring Duration: ${Math.round((Date.now() - this.stats.startTime) / 1000)}s`);
    console.log(`🎯 Tokens Processed: ${this.stats.tokensProcessed}`);
    console.log(`✅ Successful Analysis: ${this.stats.successfulAnalysis}`);
    console.log(`❌ Failed Analysis: ${this.stats.failedAnalysis}`);
    console.log(`📈 Success Rate: ${this.stats.tokensProcessed > 0 ? Math.round((this.stats.successfulAnalysis / this.stats.tokensProcessed) * 100) : 0}%`);
    console.log(`🐦 Birdeye Calls: ${this.stats.birdeyeCalls}`);
    console.log(`⚠️  Birdeye Errors: ${this.stats.birdeyeErrors}`);
    console.log(`🔥 Degen Analysis: ${this.stats.degenAnalysis}`);
    console.log(`💰 Opportunities Found: ${this.stats.opportunities}`);
    console.log(`⚡ Avg Analysis Time: ${Math.round(this.stats.avgAnalysisTime)}ms`);
    
    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    if (this.stats.successfulAnalysis > 0 && this.stats.birdeyeErrors === 0) {
      console.log('✅ EXCELLENT: Premium Plus working perfectly');
    } else if (this.stats.birdeyeErrors > 0) {
      console.log('⚠️  WARNING: Birdeye API issues detected');
    } else if (this.stats.successfulAnalysis === 0) {
      console.log('❌ CRITICAL: No successful analysis');
    }
  }
}

// Create global monitor instance
export const liveDataFlowMonitor = new LiveDataFlowMonitor();

// Test the monitor
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 TESTING DATA FLOW MONITOR...');
  
  liveDataFlowMonitor.startMonitoring();
  
  // Simulate some token analysis
  setTimeout(() => liveDataFlowMonitor.logTokenAnalysis('TEST1', true, 2500, 0), 1000);
  setTimeout(() => liveDataFlowMonitor.logTokenAnalysis('TEST2', true, 1800, 0), 2000);
  setTimeout(() => liveDataFlowMonitor.logTokenAnalysis('TEST3', false, 5000, 2), 3000);
  setTimeout(() => liveDataFlowMonitor.logOpportunity('OPP1', 75, 85), 4000);
} 