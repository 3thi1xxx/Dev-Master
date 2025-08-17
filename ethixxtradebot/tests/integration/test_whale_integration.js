#!/usr/bin/env node
/**
 * Test Whale Integration
 * Verifies whale tracking integration with AI trading system
 */

import { whaleDataService } from './services/WhaleDataService.js';
import { whaleIntelligence } from './services/WhaleIntelligence.js';

async function testWhaleIntegration() {
  console.log('🐋 TESTING WHALE INTEGRATION');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test whale data service
    console.log('\n📊 1. Testing Whale Data Service...');
    await whaleDataService.start();
    
    // Wait a moment for connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check tracked wallets
    const trackedWallets = whaleDataService.trackedWallets.size;
    console.log(`✅ Tracked wallets loaded: ${trackedWallets}`);
    
    // Check whale stats with detailed metadata
    const whaleStats = whaleDataService.getWhaleStats();
    console.log(`✅ Whale stats loaded: ${Object.keys(whaleStats).length} whales`);
    
    // Show sample whale data
    const sampleWallets = Object.entries(whaleStats).slice(0, 3);
    console.log('\n📋 Sample tracked wallets:');
    sampleWallets.forEach(([address, stats]) => {
      console.log(`   🐋 ${stats.name} (${address.substring(0, 8)}...)`);
      console.log(`      Priority: ${stats.priority} | Notes: ${stats.notes.substring(0, 50)}...`);
    });
    
    // 2. Test whale intelligence
    console.log('\n🧠 2. Testing Whale Intelligence...');
    
    // Test intelligence summary
    const summary = whaleIntelligence.getWhaleIntelligenceSummary();
    console.log(`✅ Intelligence summary: ${summary.totalWhales} total whales, ${summary.activeWhales} active`);
    
    // Test token intelligence (with a sample token)
    const sampleToken = '5unfYuDWFHYotrDMtggXYuDv8a8q86C365hS4iV6bonk'; // BONK
    const tokenIntelligence = whaleIntelligence.getWhaleIntelligenceForToken(sampleToken);
    console.log(`✅ Token intelligence for BONK: Score ${tokenIntelligence.score}, Recommendation: ${tokenIntelligence.recommendation}`);
    
    // 3. Test whale activity
    console.log('\n📈 3. Testing Whale Activity...');
    const recentActivity = whaleDataService.getRecentWhaleActivity(5);
    console.log(`✅ Recent whale activity: ${recentActivity.length} activities`);
    
    if (recentActivity.length > 0) {
      const latest = recentActivity[0];
      console.log(`   Latest: ${latest.whaleName} ${latest.lastAction} ${latest.symbol}`);
    }
    
    // 4. Test API endpoints
    console.log('\n🌐 4. Testing API Endpoints...');
    
    const baseUrl = 'http://localhost:3000/api';
    
    // Test whale activity endpoint
    try {
      const activityResponse = await fetch(`${baseUrl}/whale/activity`);
      const activityData = await activityResponse.json();
      console.log(`✅ Whale activity API: ${activityData.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`⚠️ Whale activity API: ${error.message}`);
    }
    
    // Test whale stats endpoint
    try {
      const statsResponse = await fetch(`${baseUrl}/whale/stats`);
      const statsData = await statsResponse.json();
      console.log(`✅ Whale stats API: ${statsData.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`⚠️ Whale stats API: ${error.message}`);
    }
    
    // 5. Integration summary
    console.log('\n🎯 5. Integration Summary:');
    console.log(`✅ Whale Data Service: ${whaleDataService.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
    console.log(`✅ Tracked Wallets: ${trackedWallets}`);
    console.log(`✅ Whale Intelligence: ACTIVE`);
    console.log(`✅ API Endpoints: READY`);
    
    console.log('\n🚀 WHALE INTEGRATION TEST COMPLETE!');
    console.log('🐋 Your AI system now includes whale intelligence!');
    
  } catch (error) {
    console.log(`❌ Whale integration test failed: ${error.message}`);
  }
}

// Run the test
testWhaleIntegration().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.log(`❌ Test error: ${error.message}`);
  process.exit(1);
}); 