#!/usr/bin/env node

/**
 * Test Birdeye WebSocket + API Trading Opportunities
 * Demonstrates real-time opportunity detection
 */

// Set the API key as environment variable
process.env.BIRDEYE_API_KEY = 'f31ad137262d4a57bbb85e0b35a75208';

import { tradingOpportunityDetector } from './services/TradingOpportunityDetector.js';

async function testBirdeyeWebSocketOpportunities() {
  console.log('🚀 TESTING BIRDEYE WEBSOCKET + API OPPORTUNITIES');
  console.log('================================================');
  
  // Setup opportunity detector
  const detector = tradingOpportunityDetector;
  
  // Listen for opportunities
  detector.on('opportunity', (opportunity) => {
    console.log('\n🎯 OPPORTUNITY DETECTED!');
    console.log('========================');
    console.log(`Type: ${opportunity.type}`);
    console.log(`Token: ${opportunity.tokenAddress}`);
    console.log(`Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
    console.log(`Position Size: $${opportunity.strategy.positionSize}`);
    console.log(`Entry: $${opportunity.strategy.entry}`);
    console.log(`Target: $${opportunity.strategy.target}`);
    console.log(`Stop Loss: $${opportunity.strategy.stopLoss}`);
    console.log(`Timeframe: ${opportunity.strategy.timeframe}`);
    
    if (opportunity.analysis) {
      console.log(`Security Score: ${opportunity.analysis.scores?.security || 'N/A'}/100`);
      console.log(`Risk Level: ${opportunity.analysis.riskAssessment?.risk || 'N/A'}`);
    }
  });
  
  // Listen for trade executions
  detector.on('tradeExecuted', (trade) => {
    console.log('\n🤖 TRADE EXECUTED!');
    console.log('=================');
    console.log(`Status: ${trade.status}`);
    console.log(`Opportunity: ${trade.opportunity.type}`);
    console.log(`Token: ${trade.opportunity.tokenAddress}`);
    console.log(`Amount: $${trade.opportunity.strategy.positionSize}`);
  });
  
  // Start opportunity detection
  console.log('\n🚀 Starting opportunity detection...');
  await detector.start();
  
  // Monitor for 5 minutes
  console.log('\n⏰ Monitoring for opportunities (5 minutes)...');
  console.log('Press Ctrl+C to stop');
  
  // Display current opportunities every 30 seconds
  const statusInterval = setInterval(() => {
    const opportunities = detector.getOpportunities();
    const highConfidence = detector.getHighConfidenceOpportunities(0.8);
    
    console.log(`\n📊 STATUS UPDATE:`);
    console.log(`   Total Opportunities: ${opportunities.length}`);
    console.log(`   High Confidence (>80%): ${highConfidence.length}`);
    
    if (opportunities.length > 0) {
      console.log('\n🎯 CURRENT OPPORTUNITIES:');
      opportunities.forEach((opp, index) => {
        console.log(`   ${index + 1}. ${opp.type} - ${opp.tokenAddress} (${(opp.confidence * 100).toFixed(1)}%)`);
      });
    }
  }, 30000);
  
  // Stop after 5 minutes
  setTimeout(async () => {
    console.log('\n⏰ Test completed after 5 minutes');
    clearInterval(statusInterval);
    
    // Get final statistics
    const finalOpportunities = detector.getOpportunities();
    const finalHighConfidence = detector.getHighConfidenceOpportunities(0.8);
    
    console.log('\n📊 FINAL STATISTICS:');
    console.log('====================');
    console.log(`Total Opportunities Detected: ${finalOpportunities.length}`);
    console.log(`High Confidence Opportunities: ${finalHighConfidence.length}`);
    
    if (finalOpportunities.length > 0) {
      console.log('\n🎯 OPPORTUNITY BREAKDOWN:');
      const typeCount = {};
      finalOpportunities.forEach(opp => {
        typeCount[opp.type] = (typeCount[opp.type] || 0) + 1;
      });
      
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      
      console.log('\n💰 POTENTIAL PROFIT ANALYSIS:');
      let totalPotentialProfit = 0;
      let totalInvestment = 0;
      
      finalOpportunities.forEach(opp => {
        const investment = opp.strategy.positionSize;
        const potentialProfit = investment * 0.15; // Assume 15% average profit
        
        totalInvestment += investment;
        totalPotentialProfit += potentialProfit;
      });
      
      console.log(`   Total Investment: $${totalInvestment.toFixed(2)}`);
      console.log(`   Potential Profit: $${totalPotentialProfit.toFixed(2)}`);
      console.log(`   ROI: ${((totalPotentialProfit / totalInvestment) * 100).toFixed(1)}%`);
    }
    
    // Stop the detector
    detector.stop();
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
    
  }, 300000); // 5 minutes
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  tradingOpportunityDetector.stop();
  process.exit(0);
});

// Run the test
testBirdeyeWebSocketOpportunities().catch(error => {
  console.log('❌ Test failed:', error.message);
  process.exit(1);
}); 