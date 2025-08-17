#!/usr/bin/env node
/**
 * TEST: cluster7 Subscription Fix
 * Proves that sending subscription messages unlocks the message flow
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';

async function testSubscriptionFix() {
  console.log('🔥 TESTING CLUSTER7 SUBSCRIPTION FIX');
  console.log('=' .repeat(60));
  console.log('💡 Hypothesis: cluster7 needs subscription messages to send data');
  console.log('');

  let messageCount = 0;
  let startTime = Date.now();

  // Listen for messages
  sharedWebSocketManager.on('message', ({ url, data }) => {
    if (url.includes('cluster7')) {
      messageCount++;
      const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`\n🔥 [${messageCount}] MESSAGE at ${runtime}s:`);
      
      if (data.room === 'trending-search-crypto') {
        console.log('✅ TRENDING CRYPTO DATA FOUND!');
        console.log(`📊 Content items: ${data.content?.length || 0}`);
        if (data.content?.[0]?.surgeData) {
          const surge = data.content[0].surgeData;
          console.log(`🚀 Token: ${surge.tokenTicker} (${surge.tokenAddress})`);
          console.log(`💰 Liquidity: ${surge.liquiditySol} SOL`);
        }
      } else {
        console.log(`📋 Room: ${data.room || 'unknown'}`);
        console.log(`📦 Data: ${JSON.stringify(data).substring(0, 200)}...`);
      }
      
      console.log('─'.repeat(40));
    }
  });

  // Connect and immediately subscribe
  sharedWebSocketManager.on('connection-open', async ({ url }) => {
    if (url.includes('cluster7')) {
      console.log('✅ cluster7 CONNECTED! Sending subscription messages...');
      
      const connection = sharedWebSocketManager.sharedWebSockets.get('wss://cluster7.axiom.trade/');
      
      if (connection) {
        console.log('📤 Subscribing to trending-search-crypto...');
        connection.send(JSON.stringify({ action: 'join', room: 'trending-search-crypto' }));
        
        console.log('📤 Subscribing to new_pairs...');
        connection.send(JSON.stringify({ action: 'join', room: 'new_pairs' }));
        
        console.log('✅ Subscriptions sent! Waiting for data...');
      }
    }
  });

  // Connect to cluster7
  console.log('🔌 Connecting to cluster7...');
  await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');

  // Monitor for 30 seconds
  setTimeout(() => {
    const runtime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎯 FINAL RESULT after ${runtime}s:`);
    console.log(`📊 Messages received: ${messageCount}`);
    
    if (messageCount > 0) {
      console.log('🎉 SUCCESS! Subscription messages unlocked the data flow!');
    } else {
      console.log('❌ Still no messages - there may be another issue');
    }
    
    process.exit(0);
  }, 30000);
}

testSubscriptionFix().catch(console.error); 