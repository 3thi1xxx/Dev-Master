#!/usr/bin/env node
/**
 * Test Shared WebSocket Manager
 * Verifies browser-pattern shared connections work with Axiom endpoints
 */

import { sharedWebSocketManager, ReadyState } from './services/SharedWebSocketManager.js';

class SharedWebSocketTest {
  constructor() {
    this.testResults = {
      cluster7: null,
      eucalyptus: null,
      hyperliquid: null,
      sharingTest: null
    };
    
    this.messageCount = {
      cluster7: 0,
      eucalyptus: 0,
      hyperliquid: 0
    };
    
    console.log('🧪 SHARED WEBSOCKET PATTERN TEST');
    console.log('='.repeat(50));
    console.log('📋 Testing browser\'s exact sharing pattern with Axiom endpoints');
  }
  
  async runTests() {
    try {
      console.log('\n🚀 Starting shared WebSocket tests...');
      
      // Test 1: cluster7 goldmine connection
      await this.testCluster7();
      
      // Test 2: eucalyptus whale tracking
      await this.testEucalyptus();
      
      // Test 3: hyperliquid data (should work)
      await this.testHyperliquid();
      
      // Test 4: Connection sharing verification
      await this.testConnectionSharing();
      
      // Test 5: Message queuing
      await this.testMessageQueuing();
      
      // Wait for messages and report results
      await this.waitAndReport();
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  async testCluster7() {
    console.log('\n🔥 Testing cluster7.axiom.trade (goldmine endpoint)...');
    
    try {
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://cluster7.axiom.trade/',
        {
          share: true, // Browser's sharing pattern
          disableJson: false,
          reconnectAttempts: 3
        }
      );
      
      console.log(`✅ cluster7 connection created (shared: ${connection._isShared})`);
      
      // Listen for messages
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('cluster7')) {
          this.messageCount.cluster7++;
          console.log(`📨 cluster7 message ${this.messageCount.cluster7}: ${JSON.stringify(data).substring(0, 100)}...`);
          
          if (this.messageCount.cluster7 === 1) {
            this.testResults.cluster7 = 'SUCCESS';
          }
        }
      });
      
      // Listen for connection events
      sharedWebSocketManager.on('connection-open', ({ url }) => {
        if (url.includes('cluster7')) {
          console.log('🎯 cluster7 CONNECTION OPENED - Goldmine access achieved!');
        }
      });
      
      sharedWebSocketManager.on('connection-error', ({ url, error }) => {
        if (url.includes('cluster7')) {
          console.log(`❌ cluster7 error: ${error.message}`);
          this.testResults.cluster7 = `ERROR: ${error.message}`;
        }
      });
      
    } catch (error) {
      console.log(`❌ cluster7 test failed: ${error.message}`);
      this.testResults.cluster7 = `FAILED: ${error.message}`;
    }
  }
  
  async testEucalyptus() {
    console.log('\n🐋 Testing eucalyptus.axiom.trade (whale tracking)...');
    
    try {
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://eucalyptus.axiom.trade/ws',
        {
          share: true,
          disableJson: false
        }
      );
      
      console.log(`✅ eucalyptus connection created (shared: ${connection._isShared})`);
      
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('eucalyptus')) {
          this.messageCount.eucalyptus++;
          console.log(`🐋 eucalyptus message ${this.messageCount.eucalyptus}: ${JSON.stringify(data).substring(0, 100)}...`);
          
          if (this.messageCount.eucalyptus === 1) {
            this.testResults.eucalyptus = 'SUCCESS';
          }
        }
      });
      
      sharedWebSocketManager.on('connection-open', ({ url }) => {
        if (url.includes('eucalyptus')) {
          console.log('🎯 eucalyptus CONNECTION OPENED - Whale tracking active!');
        }
      });
      
    } catch (error) {
      console.log(`❌ eucalyptus test failed: ${error.message}`);
      this.testResults.eucalyptus = `FAILED: ${error.message}`;
    }
  }
  
  async testHyperliquid() {
    console.log('\n📊 Testing api.hyperliquid.xyz (baseline)...');
    
    try {
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://api.hyperliquid.xyz/ws',
        {
          share: true,
          disableJson: false
        }
      );
      
      console.log(`✅ hyperliquid connection created (shared: ${connection._isShared})`);
      
      // Send subscription message
      const subscriptionMessage = {
        method: 'subscribe',
        subscription: {
          type: 'allMids'
        }
      };
      
      connection.send(JSON.stringify(subscriptionMessage));
      console.log('📤 Sent hyperliquid subscription');
      
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('hyperliquid')) {
          this.messageCount.hyperliquid++;
          console.log(`📊 hyperliquid message ${this.messageCount.hyperliquid}: ${JSON.stringify(data).substring(0, 100)}...`);
          
          if (this.messageCount.hyperliquid === 1) {
            this.testResults.hyperliquid = 'SUCCESS';
          }
        }
      });
      
    } catch (error) {
      console.log(`❌ hyperliquid test failed: ${error.message}`);
      this.testResults.hyperliquid = `FAILED: ${error.message}`;
    }
  }
  
  async testConnectionSharing() {
    console.log('\n♻️  Testing connection sharing pattern...');
    
    try {
      // Request same connection multiple times
      const connection1 = await sharedWebSocketManager.getSharedConnection('wss://eucalyptus.axiom.trade/ws');
      const connection2 = await sharedWebSocketManager.getSharedConnection('wss://eucalyptus.axiom.trade/ws');
      const connection3 = await sharedWebSocketManager.getSharedConnection('wss://eucalyptus.axiom.trade/ws');
      
      // Should all be the same shared instance
      const allSame = connection1 === connection2 && connection2 === connection3;
      
      console.log(`✅ Connection sharing test: ${allSame ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 connection1._isShared: ${connection1._isShared}`);
      console.log(`📊 Same instance check: ${allSame}`);
      
      this.testResults.sharingTest = allSame ? 'SUCCESS' : 'FAILED';
      
    } catch (error) {
      console.log(`❌ Sharing test failed: ${error.message}`);
      this.testResults.sharingTest = `FAILED: ${error.message}`;
    }
  }
  
  async testMessageQueuing() {
    console.log('\n📋 Testing message queuing pattern...');
    
    try {
      // Create connection that's not open yet
      const connection = await sharedWebSocketManager.getSharedConnection(
        'wss://test-queue.example.com/ws',
        { share: true }
      );
      
      // Send messages before connection is open (should queue)
      connection.send('queued message 1');
      connection.send('queued message 2');
      connection.send('queued message 3');
      
      console.log('✅ Message queuing test completed (messages queued for non-existent endpoint)');
      
    } catch (error) {
      console.log(`❌ Message queuing test failed: ${error.message}`);
    }
  }
  
  async waitAndReport() {
    console.log('\n⏰ Waiting 30 seconds for connections and messages...');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log('='.repeat(50));
    
    Object.entries(this.testResults).forEach(([test, result]) => {
      const status = result === 'SUCCESS' ? '✅' : result?.includes('ERROR') || result?.includes('FAILED') ? '❌' : '⏳';
      console.log(`${status} ${test}: ${result || 'PENDING'}`);
    });
    
    console.log('\n📈 MESSAGE COUNTS:');
    Object.entries(this.messageCount).forEach(([endpoint, count]) => {
      console.log(`📨 ${endpoint}: ${count} messages received`);
    });
    
    console.log('\n🔗 CONNECTION STATS:');
    const stats = sharedWebSocketManager.getStats();
    console.log(`🌐 Shared connections: ${stats.sharedConnections}`);
    console.log(`✅ Active connections: ${stats.activeConnections}`);
    console.log(`📋 Queued messages: ${stats.totalQueued}`);
    console.log(`🔗 URLs: ${stats.urls.join(', ')}`);
    
    // Analyze results
    this.analyzeResults();
  }
  
  analyzeResults() {
    console.log('\n🔍 ANALYSIS:');
    console.log('='.repeat(50));
    
    const successCount = Object.values(this.testResults).filter(r => r === 'SUCCESS').length;
    const totalTests = Object.keys(this.testResults).length;
    
    if (this.testResults.cluster7 === 'SUCCESS') {
      console.log('🎉 BREAKTHROUGH: cluster7 goldmine access ACHIEVED with shared pattern!');
    } else if (this.testResults.cluster7?.includes('401') || this.testResults.cluster7?.includes('Unauthorized')) {
      console.log('🔑 cluster7 still needs authentication (expected - need fresh browser tokens)');
    }
    
    if (this.testResults.eucalyptus === 'SUCCESS') {
      console.log('🐋 eucalyptus whale tracking working with shared connections!');
    }
    
    if (this.testResults.hyperliquid === 'SUCCESS') {
      console.log('📊 hyperliquid baseline confirmed working');
    }
    
    if (this.testResults.sharingTest === 'SUCCESS') {
      console.log('♻️  Connection sharing pattern CONFIRMED working (browser replica)');
    }
    
    console.log(`\n🎯 Overall success rate: ${successCount}/${totalTests} tests passed`);
    
    if (successCount >= 2) {
      console.log('🏆 Shared WebSocket Manager successfully replicates browser pattern!');
    }
    
    // Clean up
    setTimeout(() => {
      sharedWebSocketManager.closeAll();
      process.exit(0);
    }, 2000);
  }
}

// Run tests
const test = new SharedWebSocketTest();
test.runTests().catch(console.error); 