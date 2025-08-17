#!/usr/bin/env node
/**
 * Debug cluster7 messages
 * Examine actual message structure to understand token detection
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';

async function debugCluster7Messages() {
  console.log('🔍 DEBUGGING CLUSTER7 MESSAGES');
  console.log('=' .repeat(50));
  
  try {
    // Connect to cluster7
    const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
    console.log('✅ Connected to cluster7');
    
    // Subscribe to rooms
    const rooms = ['new_pairs', 'trending-search-crypto'];
    for (const room of rooms) {
      const subscription = { action: 'join', room: room };
      connection.send(JSON.stringify(subscription));
      console.log(`📡 Subscribed to: ${room}`);
    }
    
    let messageCount = 0;
    const maxMessages = 10;
    
    // Listen for messages
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        messageCount++;
        console.log(`\n📨 MESSAGE #${messageCount}:`);
        console.log('Room:', data.room);
        console.log('Type:', typeof data.content);
        
        if (Array.isArray(data.content)) {
          console.log('Content length:', data.content.length);
          if (data.content.length > 0) {
            console.log('First item keys:', Object.keys(data.content[0]));
            console.log('Sample item:', JSON.stringify(data.content[0], null, 2));
          }
        } else {
          console.log('Content:', JSON.stringify(data.content, null, 2));
        }
        
        if (messageCount >= maxMessages) {
          console.log('\n✅ Debug complete - stopping');
          process.exit(0);
        }
      }
    });
    
    // Keep running for 30 seconds
    setTimeout(() => {
      console.log('\n⏰ Debug timeout - stopping');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

debugCluster7Messages(); 