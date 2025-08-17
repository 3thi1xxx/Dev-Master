#!/usr/bin/env node
/**
 * Simple cluster7 Monitor - See exactly what messages come through
 */

import { sharedWebSocketManager } from '../services/SharedWebSocketManager.js';

console.log('🔍 CLUSTER7 REAL-TIME MONITOR');
console.log('=' .repeat(50));
console.log('📡 Connecting to cluster7 to see ALL messages...');

let messageCount = 0;
let startTime = Date.now();

// Listen for ALL cluster7 messages
sharedWebSocketManager.on('message', ({ url, data }) => {
  if (url.includes('cluster7')) {
    messageCount++;
    const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n📨 [${messageCount}] Message at ${runtime}s:`);
    console.log(`🏷️  Type: ${data.room || 'unknown'}`);
    
    if (data.room === 'trending-search-crypto') {
      console.log(`🔥 NEW TOKENS BATCH: ${data.content?.length || 0} tokens`);
      if (data.content && data.content.length > 0) {
        console.log(`📋 First token: ${data.content[0]?.surgeData?.tokenName || 'unknown'}`);
      }
    } else {
      console.log(`📄 Content: ${JSON.stringify(data).substring(0, 100)}...`);
    }
  }
});

// Connect to cluster7
sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/', {
  share: true,
  disableJson: false
}).then((connection) => {
  console.log('✅ Connected to cluster7 - monitoring all messages...');
  console.log('💡 Press Ctrl+C to stop');
  
  // CRITICAL: Send subscription messages (this was missing!)
  const subscriptions = [
    { action: 'join', room: 'new_pairs' },
    { action: 'join', room: 'trending-search-crypto' },
    { action: 'join', room: 'surge-updates' }
  ];
  
  for (const sub of subscriptions) {
    connection.send(JSON.stringify(sub));
    console.log(`📤 Subscribed to: ${sub.room}`);
  }
  
  // Show stats every 30 seconds
  setInterval(() => {
    const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
    const msgPerSec = (messageCount / (runtime || 1)).toFixed(2);
    console.log(`\n📊 Stats: ${messageCount} messages in ${runtime}s (${msgPerSec}/sec)`);
  }, 30000);
  
}).catch(error => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping monitor...');
  
  // Force close all connections with timeout
  const closePromise = sharedWebSocketManager.closeAll();
  
  const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📊 Final stats: ${messageCount} messages in ${runtime}s`);
  
  // Force exit after 2 seconds if connections don't close
  setTimeout(() => {
    console.log('🔧 Force shutdown');
    process.exit(0);
  }, 2000);
  
  closePromise.then(() => process.exit(0)).catch(() => process.exit(1));
}); 