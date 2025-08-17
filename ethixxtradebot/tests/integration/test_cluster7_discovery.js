#!/usr/bin/env node
/**
 * Test Cluster7 Discovery Mode
 * Explores available channels and data types
 */

import { liveTokenAnalyzer } from './services/LiveTokenAnalyzer.js';

console.log('🔍 CLUSTER7 DISCOVERY MODE TEST');
console.log('================================\n');

// Enable discovery mode
liveTokenAnalyzer.config.discoveryMode = true;
liveTokenAnalyzer.config.minLiquidity = 100; // Lower threshold to see more tokens

// Track discovery progress
let lastSummary = null;
let updateCount = 0;

// Monitor discovery
const discoveryInterval = setInterval(() => {
  const summary = liveTokenAnalyzer.getDiscoverySummary();
  const stats = liveTokenAnalyzer.getStats();
  
  // Only log if something changed
  if (JSON.stringify(summary) !== JSON.stringify(lastSummary)) {
    updateCount++;
    console.log(`\n📊 Discovery Update #${updateCount} (${new Date().toLocaleTimeString()})`);
    console.log('======================');
    console.log(`Messages processed: ${stats.messagesProcessed}`);
    console.log(`Discovered channels: ${summary.discoveredChannels.length}`);
    console.log(`Cached tokens: ${summary.cacheSize}`);
    
    if (summary.discoveredChannels.length > 0) {
      console.log('\n🆕 Discovered Channels:');
      summary.discoveredChannels.forEach(channel => {
        console.log(`  - ${channel}`);
      });
    }
    
    if (summary.sampleData) {
      console.log('\n📋 Sample Cached Data:');
      console.log(JSON.stringify(summary.sampleData, null, 2).substring(0, 500) + '...');
    }
    
    lastSummary = summary;
  }
}, 5000); // Check every 5 seconds

// Start the analyzer
console.log('🚀 Starting Live Token Analyzer in Discovery Mode...\n');

liveTokenAnalyzer.start().then(() => {
  console.log('✅ Discovery mode active - monitoring for new channels...');
  console.log('⏳ Let it run for a few minutes to discover channels\n');
}).catch(error => {
  console.error('❌ Failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  
  const finalSummary = liveTokenAnalyzer.getDiscoverySummary();
  const finalStats = liveTokenAnalyzer.getStats();
  
  console.log('\n📊 FINAL DISCOVERY REPORT');
  console.log('========================');
  console.log(`Total runtime: ${finalStats.runtime}s`);
  console.log(`Messages processed: ${finalStats.messagesProcessed}`);
  console.log(`Discovered channels: ${finalSummary.discoveredChannels.length}`);
  console.log(`Cached tokens: ${finalSummary.cacheSize}`);
  
  if (finalSummary.discoveredChannels.length > 0) {
    console.log('\n🎯 All Discovered Channels:');
    finalSummary.discoveredChannels.forEach((channel, i) => {
      console.log(`  ${i + 1}. ${channel}`);
    });
  }
  
  console.log('\n✅ Discovery complete!');
  
  clearInterval(discoveryInterval);
  liveTokenAnalyzer.stop();
  process.exit(0);
});

console.log('Press Ctrl+C to stop and see final report\n'); 