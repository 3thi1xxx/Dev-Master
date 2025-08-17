#!/usr/bin/env node
/**
 * Rate Limit Monitor - Tracks API usage and system performance
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

console.log('📊 RATE LIMIT MONITOR');
console.log('=' .repeat(50));

// Track API calls
const apiCalls = {
  birdeye: { count: 0, errors: 0, lastMinute: [] },
  axiom: { count: 0, errors: 0, lastMinute: [] },
  cluster7: { messages: 0, subscriptions: 0 },
  whaleWS: { reconnects: 0 },
  free: { cabalspy: 0, bubblemaps: 0, geckoterminal: 0 }
};

// Connect to WebSocket
const socket = io(API_URL);

socket.on('connect', () => {
  console.log('✅ Connected to dashboard\n');
  socket.emit('subscribe', 'live-feed');
});

// Monitor log patterns
socket.on('feed-update', (update) => {
  const message = update.content || update.message || '';
  const now = Date.now();
  
  // Track Birdeye calls
  if (message.includes('[BIRDEYE]')) {
    apiCalls.birdeye.count++;
    apiCalls.birdeye.lastMinute.push(now);
    if (message.includes('error') || message.includes('404')) {
      apiCalls.birdeye.errors++;
    }
  }
  
  // Track Axiom API calls
  if (message.includes('[AXIOM-API]')) {
    apiCalls.axiom.count++;
    apiCalls.axiom.lastMinute.push(now);
    if (message.includes('Rate limit')) {
      console.log('⚠️  AXIOM RATE LIMIT HIT!');
    }
  }
  
  // Track Cluster7 messages
  if (message.includes('[LIVE] 📨 Processing')) {
    apiCalls.cluster7.messages++;
  }
  if (message.includes('Subscribed to')) {
    apiCalls.cluster7.subscriptions++;
  }
  
  // Track WebSocket reconnects
  if (message.includes('[SHARED-WS]') && message.includes('reconnect')) {
    apiCalls.whaleWS.reconnects++;
  }
  
  // Track free API calls
  if (message.includes('[CABALSPY]')) apiCalls.free.cabalspy++;
  if (message.includes('[BUBBLEMAPS]')) apiCalls.free.bubblemaps++;
  if (message.includes('[GECKOTERMINAL]')) apiCalls.free.geckoterminal++;
});

// Calculate rates every 10 seconds
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Clean old entries and calculate rates
  apiCalls.birdeye.lastMinute = apiCalls.birdeye.lastMinute.filter(t => t > oneMinuteAgo);
  apiCalls.axiom.lastMinute = apiCalls.axiom.lastMinute.filter(t => t > oneMinuteAgo);
  
  console.log('\n📊 CURRENT RATES (per minute):');
  console.log('================================');
  console.log(`🐦 Birdeye: ${apiCalls.birdeye.lastMinute.length}/1000 (${(apiCalls.birdeye.lastMinute.length/10).toFixed(1)}%)`);
  console.log(`   Total calls: ${apiCalls.birdeye.count}, Errors: ${apiCalls.birdeye.errors}`);
  console.log(`🚀 Axiom: ${apiCalls.axiom.lastMinute.length}/30 (${(apiCalls.axiom.lastMinute.length/0.3).toFixed(1)}%)`);
  console.log(`   Total calls: ${apiCalls.axiom.count}`);
  console.log(`📡 Cluster7: ${apiCalls.cluster7.messages} messages, ${apiCalls.cluster7.subscriptions} channels`);
  console.log(`🐋 Whale WS: ${apiCalls.whaleWS.reconnects} reconnects`);
  console.log(`🆓 Free APIs: Cabal=${apiCalls.free.cabalspy}, Bubble=${apiCalls.free.bubblemaps}, Gecko=${apiCalls.free.geckoterminal}`);
  
  // Get system stats
  axios.get(`${API_URL}/api/stats`)
    .then(response => {
      const stats = response.data;
      console.log('\n⚡ SYSTEM PERFORMANCE:');
      console.log(`Tokens/hour: ${stats.tokensPerHour}`);
      console.log(`Analysis speed: ${stats.analysisSpeed}ms`);
      console.log(`Hit rate: ${stats.hitRate}%`);
      console.log(`Opportunities: ${stats.opportunities}`);
      
      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      if (apiCalls.birdeye.lastMinute.length < 10) {
        console.log('✅ Birdeye: VERY LOW usage (<1%), can increase analysis rate significantly');
      }
      if (apiCalls.axiom.lastMinute.length < 5) {
        console.log('✅ Axiom: LOW usage (<17%), safe to increase rate limit to 100/min');
      }
      if (stats.analysisSpeed > 3000) {
        console.log('⚠️  Analysis taking >3s, consider optimizing parallel calls');
      }
    })
    .catch(err => console.error('Failed to get stats'));
    
}, 10000); // Every 10 seconds

console.log('\nMonitoring rate limits... Press Ctrl+C to stop\n');

// Keep process running
process.stdin.resume(); 