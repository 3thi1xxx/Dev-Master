#!/usr/bin/env node
/**
 * System Activity Monitor - Shows what's happening in real-time
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

console.log('🔍 SYSTEM ACTIVITY MONITOR');
console.log('=' .repeat(50));

// Connect to WebSocket
const socket = io(API_URL);

socket.on('connect', () => {
  console.log('✅ Connected to dashboard WebSocket\n');
  
  // Subscribe to all events
  socket.emit('subscribe', 'live-feed');
  socket.emit('subscribe', 'momentum-updates');
});

socket.on('live-opportunity', (opportunity) => {
  console.log(`\n🎯 OPPORTUNITY DETECTED!`);
  console.log(`Token: ${opportunity.token.symbol}`);
  console.log(`Score: ${opportunity.analysis.scores?.overall || 0}/100`);
  console.log(`Recommendation: ${opportunity.analysis.recommendation?.action}`);
  console.log(`Confidence: ${Math.round((opportunity.analysis.confidence || 0) * 100)}%`);
  console.log(`Liquidity: $${opportunity.token.liquidity}`);
  console.log('-'.repeat(50));
});

socket.on('feed-update', (update) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${update.content || update.message}`);
});

socket.on('momentum-update', (data) => {
  if (data.type === 'periodic' && data.tokens && data.tokens.length > 0) {
    console.log(`\n📈 MOMENTUM UPDATE:`);
    data.tokens.forEach(token => {
      console.log(`  ${token.symbol}: ${token.momentum}% ${token.trend || ''}`);
    });
  }
});

socket.on('stats-update', (stats) => {
  console.log(`\n📊 STATS: Tokens/hr: ${stats.tokensPerHour} | Hit Rate: ${stats.hitRate}% | Opportunities: ${stats.opportunities}`);
});

// Periodic status check
setInterval(async () => {
  try {
    const response = await axios.get(`${API_URL}/api/stats`);
    const stats = response.data;
    
    console.log(`\n⏱️  SYSTEM STATUS at ${new Date().toLocaleTimeString()}`);
    console.log(`Uptime: ${stats.systemUptime}s | Active: ${stats.liveAnalysisActive}`);
    console.log(`Tokens/Hour: ${stats.tokensPerHour}`);
    console.log(`Analysis Speed: ${stats.analysisSpeed}ms`);
    console.log(`Live Opportunities: ${stats.liveOpportunities}`);
  } catch (error) {
    console.error('❌ Failed to fetch stats:', error.message);
  }
}, 30000); // Every 30 seconds

console.log('\nMonitoring system activity...\n');

// Keep process running
process.stdin.resume(); 