#!/usr/bin/env node
/**
 * cluster7 Subscription Pattern Test
 * Find the correct subscription to get goldmine new_pairs messages
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';

class Cluster7SubscriptionTest {
  constructor() {
    this.messageCount = 0;
    this.subscriptionsSent = [];
    console.log('🔥 CLUSTER7 SUBSCRIPTION PATTERN TEST');
    console.log('=' .repeat(50));
  }
  
  async run() {
    try {
      console.log('\n🚀 Connecting to cluster7...');
      
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://cluster7.axiom.trade/',
        { share: true }
      );
      
      console.log('✅ cluster7 connection obtained');
      
      // Listen for all messages
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('cluster7')) {
          this.messageCount++;
          console.log(`📨 cluster7 message ${this.messageCount}:`);
          console.log(JSON.stringify(data, null, 2));
          console.log('-'.repeat(80));
        }
      });
      
      sharedWebSocketManager.on('connection-open', ({ url }) => {
        if (url.includes('cluster7')) {
          console.log('🎯 cluster7 CONNECTED! Trying subscription patterns...');
          this.trySubscriptions(connection);
        }
      });
      
      // Wait for results
      console.log('\n⏰ Waiting 60 seconds for subscription responses...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  async trySubscriptions(connection) {
    const subscriptions = [
      // Room-based subscriptions (from browser screenshots)
      { action: 'join', room: 'new_pairs' },
      { action: 'join', room: 'sol-priority-fee' },
      { action: 'join', room: 'twitter_feed_v2' },
      { action: 'join', room: 'surge-updates' },
      { action: 'join', room: 'block_hash' },
      { action: 'join', room: 'connection_monitor' },
      { action: 'join', room: 'jito-bribe-fee' },
      
      // Standard WebSocket subscription patterns
      { method: 'subscribe', params: ['new_pairs'] },
      { method: 'subscribe', params: ['all'] },
      { type: 'subscribe', channel: 'new_pairs' },
      { subscribe: 'new_pairs' },
      
      // Raw string subscriptions
      'subscribe:new_pairs',
      'join:new_pairs',
      'new_pairs',
      
      // Empty/ping to see server response
      {},
      { ping: Date.now() }
    ];
    
    console.log(`\n📤 Trying ${subscriptions.length} subscription patterns...`);
    
    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      
      try {
        const message = typeof sub === 'string' ? sub : JSON.stringify(sub);
        connection.send(message);
        this.subscriptionsSent.push(sub);
        
        console.log(`📤 ${i + 1}. Sent: ${message}`);
        
        // Wait 2 seconds between subscriptions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Failed to send subscription ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Sent ${this.subscriptionsSent.length} subscription attempts`);
    console.log('⏰ Waiting for responses...');
  }
  
  reportResults() {
    console.log('\n📊 SUBSCRIPTION TEST RESULTS:');
    console.log('=' .repeat(50));
    console.log(`📨 Total messages received: ${this.messageCount}`);
    console.log(`📤 Subscriptions sent: ${this.subscriptionsSent.length}`);
    
    if (this.messageCount > 0) {
      console.log('🎉 SUCCESS: cluster7 responded to subscriptions!');
      console.log('🔥 Goldmine subscription pattern discovered!');
    } else {
      console.log('⚠️  No messages received - trying alternative patterns...');
      console.log('💡 Suggestions:');
      console.log('   - Check if cluster7 requires specific authentication headers');
      console.log('   - Try different subscription formats');
      console.log('   - Monitor browser network for exact subscription pattern');
    }
    
    // Clean up
    setTimeout(() => {
      sharedWebSocketManager.closeAll();
      process.exit(0);
    }, 2000);
  }
}

// Run test
const test = new Cluster7SubscriptionTest();
test.run().catch(console.error); 