#!/usr/bin/env node

/**
 * Data Flow Monitor
 * Real-time monitoring of all data sources and analysis pipeline
 */

import { EventEmitter } from 'node:events';

export class DataFlowMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.stats = {
      startTime: Date.now(),
      totalTokens: 0,
      successfulAnalysis: 0,
      failedAnalysis: 0,
      apiCalls: {
        birdeye: { success: 0, failed: 0, rateLimited: 0 },
        dexScreener: { success: 0, failed: 0 },
        cabalspy: { success: 0, failed: 0 },
        bubblemaps: { success: 0, failed: 0 },
        geckoTerminal: { success: 0, failed: 0 }
      },
      opportunities: {
        detected: 0,
        highConfidence: 0,
        executed: 0
      },
      errors: {
        degenData: 0,
        apiKey: 0,
        rateLimit: 0,
        network: 0
      }
    };
    
    console.log('📊 DATA FLOW MONITOR INITIALIZED');
    console.log('🔍 Monitoring all data sources and analysis pipeline');
  }
  
  /**
   * Monitor Birdeye API calls
   */
  monitorBirdeyeCall(success, error = null) {
    if (success) {
      this.stats.apiCalls.birdeye.success++;
    } else {
      this.stats.apiCalls.birdeye.failed++;
      
      if (error && error.includes('Rate limit')) {
        this.stats.apiCalls.birdeye.rateLimited++;
        this.stats.errors.rateLimit++;
      } else if (error && error.includes('API key')) {
        this.stats.errors.apiKey++;
      }
    }
    
    this.emit('birdeyeCall', { success, error });
  }
  
  /**
   * Monitor analysis completion
   */
  monitorAnalysis(tokenAddress, success, error = null) {
    this.stats.totalTokens++;
    
    if (success) {
      this.stats.successfulAnalysis++;
    } else {
      this.stats.failedAnalysis++;
      
      if (error && error.includes('degenData')) {
        this.stats.errors.degenData++;
      }
    }
    
    this.emit('analysisComplete', { tokenAddress, success, error });
  }
  
  /**
   * Monitor opportunity detection
   */
  monitorOpportunity(opportunity) {
    this.stats.opportunities.detected++;
    
    if (opportunity.confidence >= 0.8) {
      this.stats.opportunities.highConfidence++;
    }
    
    this.emit('opportunityDetected', opportunity);
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    const runtimeMinutes = runtime / 60000;
    
    return {
      ...this.stats,
      runtime: {
        total: runtime,
        minutes: runtimeMinutes,
        formatted: `${Math.floor(runtimeMinutes)}m ${Math.floor((runtimeMinutes % 1) * 60)}s`
      },
      rates: {
        tokensPerMinute: this.stats.totalTokens / runtimeMinutes,
        successRate: this.stats.totalTokens > 0 ? (this.stats.successfulAnalysis / this.stats.totalTokens) * 100 : 0,
        opportunityRate: this.stats.totalTokens > 0 ? (this.stats.opportunities.detected / this.stats.totalTokens) * 100 : 0
      }
    };
  }
  
  /**
   * Generate detailed report
   */
  generateReport() {
    const stats = this.getStats();
    
    console.log('\n📊 DATA FLOW REPORT');
    console.log('===================');
    console.log(`⏱️  Runtime: ${stats.runtime.formatted}`);
    console.log(`🎯 Total Tokens: ${stats.totalTokens}`);
    console.log(`✅ Successful Analysis: ${stats.successfulAnalysis}`);
    console.log(`❌ Failed Analysis: ${stats.failedAnalysis}`);
    console.log(`📈 Success Rate: ${stats.rates.successRate.toFixed(1)}%`);
    console.log(`🎲 Opportunities Detected: ${stats.opportunities.detected}`);
    console.log(`🔥 High Confidence: ${stats.opportunities.highConfidence}`);
    console.log(`⚡ Tokens/Minute: ${stats.rates.tokensPerMinute.toFixed(1)}`);
    
    console.log('\n🔌 API CALLS:');
    console.log(`   Birdeye: ${stats.apiCalls.birdeye.success}✅ / ${stats.apiCalls.birdeye.failed}❌ (${stats.apiCalls.birdeye.rateLimited} rate limited)`);
    console.log(`   DexScreener: ${stats.apiCalls.dexScreener.success}✅ / ${stats.apiCalls.dexScreener.failed}❌`);
    console.log(`   Cabalspy: ${stats.apiCalls.cabalspy.success}✅ / ${stats.apiCalls.cabalspy.failed}❌`);
    console.log(`   Bubblemaps: ${stats.apiCalls.bubblemaps.success}✅ / ${stats.apiCalls.bubblemaps.failed}❌`);
    console.log(`   GeckoTerminal: ${stats.apiCalls.geckoTerminal.success}✅ / ${stats.apiCalls.geckoTerminal.failed}❌`);
    
    console.log('\n🚨 ERRORS:');
    console.log(`   Degen Data: ${stats.errors.degenData}`);
    console.log(`   API Key: ${stats.errors.apiKey}`);
    console.log(`   Rate Limit: ${stats.errors.rateLimit}`);
    console.log(`   Network: ${stats.errors.network}`);
    
    return stats;
  }
  
  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    console.log('🚀 Starting real-time data flow monitoring...');
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      const stats = this.getStats();
      
      console.log(`\n📊 LIVE STATS (${stats.runtime.formatted}):`);
      console.log(`   Tokens: ${stats.totalTokens} | Success: ${stats.rates.successRate.toFixed(1)}% | Opportunities: ${stats.opportunities.detected}`);
      console.log(`   Birdeye: ${stats.apiCalls.birdeye.success}✅/${stats.apiCalls.birdeye.failed}❌ | Rate Limited: ${stats.apiCalls.birdeye.rateLimited}`);
      
      // Alert on issues
      if (stats.errors.degenData > 0) {
        console.log(`   🚨 Degen Data Errors: ${stats.errors.degenData}`);
      }
      if (stats.errors.apiKey > 0) {
        console.log(`   🚨 API Key Errors: ${stats.errors.apiKey}`);
      }
      if (stats.apiCalls.birdeye.rateLimited > 0) {
        console.log(`   🚨 Rate Limited: ${stats.apiCalls.birdeye.rateLimited}`);
      }
    }, 30000);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Create global monitor instance
export const dataFlowMonitor = new DataFlowMonitor(); 