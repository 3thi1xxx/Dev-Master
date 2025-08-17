#!/usr/bin/env node
/**
 * DEBUG: cluster7 Raw Message Logger
 * Shows EXACTLY what messages are coming through to identify blocking issues
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';

async function debugCluster7() {
  console.log('🔍 CLUSTER7 RAW MESSAGE DEBUG');
  console.log('=' .repeat(60));
  console.log('📡 Connecting to cluster7 to see RAW message flow...');
  console.log('💡 User reports constant messages in devtools - let\'s find the block!');
  console.log('');

  let messageCount = 0;
  let startTime = Date.now();

  // Listen for ALL messages from SharedWebSocketManager
  sharedWebSocketManager.on('message', ({ url, data, raw }) => {
    if (url.includes('cluster7')) {
      messageCount++;
      const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`\n🔥 [${messageCount}] cluster7 MESSAGE at ${runtime}s:`);
      console.log('📍 URL:', url);
      console.log('📦 Data Type:', typeof data);
      
      if (typeof data === 'string') {
        console.log('📝 Raw String:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
        try {
          const parsed = JSON.parse(data);
          console.log('🔍 Parsed JSON:', JSON.stringify(parsed, null, 2).substring(0, 500));
        } catch (e) {
          console.log('❌ Not valid JSON');
        }
      } else {
        console.log('🔍 Data Object:', JSON.stringify(data, null, 2).substring(0, 500));
      }
      
      console.log('─'.repeat(40));
    }
  });

  // Listen for connection events
  sharedWebSocketManager.on('connection-open', ({ url }) => {
    if (url.includes('cluster7')) {
      console.log(`✅ cluster7 CONNECTION OPENED: ${url}`);
    }
  });

  sharedWebSocketManager.on('connection-close', ({ url, code }) => {
    if (url.includes('cluster7')) {
      console.log(`❌ cluster7 CONNECTION CLOSED: ${url} (code: ${code})`);
    }
  });

  sharedWebSocketManager.on('connection-error', ({ url, error }) => {
    if (url.includes('cluster7')) {
      console.log(`💥 cluster7 CONNECTION ERROR: ${url}`, error.message);
    }
  });

  // Connect to cluster7
  console.log('🔌 Establishing cluster7 connection...');
  const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');

  // Stats every 10 seconds
  setInterval(() => {
    const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (messageCount / (Date.now() - startTime) * 1000).toFixed(2);
    console.log(`\n📊 STATS at ${runtime}s: ${messageCount} messages (${rate}/sec)`);
    
    if (messageCount === 0 && runtime > 30) {
      console.log('🚨 NO MESSAGES for 30+ seconds - there\'s definitely a blocking issue!');
    }
  }, 10000);

  // Keep alive
  process.on('SIGINT', () => {
    console.log(`\n🔚 Final stats: ${messageCount} messages in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    process.exit(0);
  });
}

// Run the debug function
debugCluster7().catch(console.error); 