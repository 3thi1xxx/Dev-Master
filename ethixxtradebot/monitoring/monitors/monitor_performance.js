#!/usr/bin/env node
/**
 * Performance Monitor - Tracks system performance and API usage
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000';

console.log('📊 PERFORMANCE MONITOR');
console.log('=' .repeat(50));

// Performance metrics
const metrics = {
  startTime: Date.now(),
  apiCalls: 0,
  avgResponseTime: 0,
  responseTimes: [],
  errors: 0,
  tokensAnalyzed: 0,
  opportunities: 0
};

// Check system stats every 5 seconds
setInterval(async () => {
  try {
    const start = Date.now();
    const response = await axios.get(`${API_URL}/api/stats`);
    const responseTime = Date.now() - start;
    
    metrics.apiCalls++;
    metrics.responseTimes.push(responseTime);
    if (metrics.responseTimes.length > 20) {
      metrics.responseTimes.shift();
    }
    metrics.avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    
    const stats = response.data;
    const runtime = Math.floor((Date.now() - metrics.startTime) / 1000);
    
    console.clear();
    console.log('📊 PERFORMANCE MONITOR');
    console.log('=' .repeat(50));
    console.log(`⏱️  Runtime: ${runtime}s`);
    console.log();
    console.log('🚀 SYSTEM PERFORMANCE:');
    console.log(`  API Response Time: ${responseTime}ms (avg: ${Math.round(metrics.avgResponseTime)}ms)`);
    console.log(`  Analysis Speed: ${stats.analysisSpeed}ms`);
    console.log(`  Tokens/Hour: ${stats.tokensPerHour}`);
    console.log(`  Hit Rate: ${stats.hitRate}%`);
    console.log();
    console.log('📈 THROUGHPUT:');
    console.log(`  Tokens Analyzed: ${stats.tokensAnalyzed}`);
    console.log(`  Opportunities Found: ${stats.opportunities}`);
    console.log(`  Live Opportunities: ${stats.liveOpportunities}`);
    console.log();
    console.log('💰 TRADING:');
    console.log(`  Balance: $${stats.walletBalance}`);
    console.log(`  Win Rate: ${stats.winRate}%`);
    console.log(`  P&L: $${stats.profitLoss}`);
    console.log();
    console.log('🎯 OPTIMIZATIONS APPLIED:');
    console.log('  ✅ Axiom rate limit: 30 → 100/min');
    console.log('  ✅ Min liquidity: $1000 → $500');
    console.log('  ✅ Concurrent analyses: 3 → 5');
    console.log('  ✅ Analysis delay: 2s → 1s');
    console.log('  ✅ Request timeout: 3s max');
    console.log('  ✅ Ultra-aggressive filters');
    
    // Calculate improvements
    if (runtime > 60) {
      const tokensPerMinute = (stats.tokensAnalyzed / runtime) * 60;
      console.log();
      console.log('📊 RATE CALCULATIONS:');
      console.log(`  Tokens/minute: ${tokensPerMinute.toFixed(1)}`);
      console.log(`  Birdeye usage: ~${Math.round(tokensPerMinute * 0.1)}/1000 rpm (${(tokensPerMinute * 0.01).toFixed(1)}%)`);
      console.log(`  Axiom usage: ~${Math.round(tokensPerMinute * 0.8)}/100 rpm (${(tokensPerMinute * 0.8).toFixed(1)}%)`);
    }
    
  } catch (error) {
    metrics.errors++;
    console.error('❌ Failed to get stats:', error.message);
  }
}, 5000);

console.log('\nMonitoring performance... Press Ctrl+C to stop\n');

// Keep process running
process.stdin.resume(); 