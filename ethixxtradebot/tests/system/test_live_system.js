#!/usr/bin/env node
/**
 * Live System Test
 * Demonstrates the live token analysis system in action
 * Shows real-time stats and opportunities as they're detected
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testLiveSystem() {
  console.log('🔥 TESTING LIVE TOKEN ANALYSIS SYSTEM');
  console.log('=' .repeat(60));
  console.log('🎯 Monitoring cluster7 → AI Analysis → Dashboard');
  console.log('');

  let iteration = 0;
  const startTime = Date.now();
  let lastOpportunityCount = 0;

  // Monitor the system every 10 seconds
  const monitor = setInterval(async () => {
    iteration++;
    const runtime = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      // Get live stats
      const statsResponse = await axios.get(`${API_BASE}/live-stats`);
      const stats = statsResponse.data;
      
      // Get opportunities
      const oppsResponse = await axios.get(`${API_BASE}/opportunities`);
      const opportunities = oppsResponse.data;
      
      // Clear screen and show current status
      console.clear();
      console.log('🔥 LIVE TOKEN ANALYSIS SYSTEM - ACTIVE');
      console.log('=' .repeat(60));
      console.log(`⏱️  Runtime: ${runtime}s (Check #${iteration})`);
      console.log(`🌐 Dashboard: http://localhost:3000`);
      console.log('');
      
      // Live Analysis Stats
      console.log('📊 LIVE ANALYSIS STATS:');
      console.log(`🔄 Status: ${stats.active ? '✅ ACTIVE' : '❌ INACTIVE'}`);
      console.log(`📨 Messages processed: ${stats.messagesProcessed} (${stats.messageRate.toFixed(2)}/s)`);
      console.log(`🎯 Tokens detected: ${stats.tokensDetected}`);
      console.log(`🔬 Tokens analyzed: ${stats.tokensAnalyzed}`);
      console.log(`💰 Opportunities found: ${stats.opportunitiesFound}`);
      console.log(`📋 Analysis queue: ${stats.queueSize} waiting`);
      console.log(`⚡ Currently analyzing: ${stats.activeAnalyses}`);
      
      if (stats.tokensAnalyzed > 0) {
        console.log(`📈 Success rate: ${stats.analysisSuccessRate.toFixed(1)}%`);
      }
      console.log('');
      
      // Live Opportunities
      console.log('🎯 LIVE OPPORTUNITIES:');
      if (opportunities.count > 0) {
        console.log(`✅ ${opportunities.count} opportunities detected!`);
        
        // Show latest opportunities
        opportunities.opportunities.slice(0, 3).forEach((opp, index) => {
          const age = Math.floor((Date.now() - opp.timestamp) / 1000);
          console.log(`${index + 1}. ${opp.token.symbol} → ${opp.analysis.recommendation.action}`);
          console.log(`   💰 Position: ${opp.analysis.recommendation.positionSize}`);
          console.log(`   📊 Confidence: ${Math.round(opp.analysis.confidence * 100)}%`);
          console.log(`   ⏰ ${age}s ago`);
          console.log('');
        });
        
        if (opportunities.count > lastOpportunityCount) {
          const newOpps = opportunities.count - lastOpportunityCount;
          console.log(`🔥 ${newOpps} NEW OPPORTUNITIES detected since last check!`);
        }
        lastOpportunityCount = opportunities.count;
      } else {
        console.log('⏳ Waiting for opportunities... (This is normal)');
        console.log('💡 The system analyzes tokens as they appear on cluster7');
        console.log('🎯 Only high-quality opportunities meeting filters are shown');
      }
      console.log('');
      
      // Instructions
      console.log('💡 WHAT\'S HAPPENING:');
      console.log('1. 📡 cluster7 sends real-time new token data');
      console.log('2. 🔍 System filters tokens with $5k+ liquidity');
      console.log('3. 🧠 AI performs comprehensive analysis (Neural + Technical + Security)');
      console.log('4. 🎯 High-confidence opportunities are detected and displayed');
      console.log('5. 🖥️ Dashboard shows live results at http://localhost:3000');
      console.log('');
      console.log('🔄 Press Ctrl+C to stop monitoring');
      console.log('=' .repeat(60));
      
    } catch (error) {
      console.log(`❌ Error checking system: ${error.message}`);
      console.log('💡 Make sure the dashboard server is running: node gui/server.js');
    }
    
  }, 10000); // Check every 10 seconds
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(monitor);
    console.log('\n\n🛑 Live system monitoring stopped');
    console.log('✅ Your AI trading system continues running in the background');
    console.log('🌐 Dashboard available at: http://localhost:3000');
    process.exit(0);
  });
  
  // Initial status
  console.log('🚀 Starting live system monitoring...');
  console.log('📊 Checking system status every 10 seconds');
  console.log('🌐 Open http://localhost:3000 to see the dashboard');
  console.log('');
}

// Start monitoring
testLiveSystem().catch(console.error); 