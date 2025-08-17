#!/usr/bin/env node
/**
 * Monitor Fast Meme Trading System
 * Shows live opportunities and momentum signals
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}⚡ FAST MEME TRADING MONITOR${colors.reset}`);
console.log(`${colors.cyan}Monitoring for ultra-fast opportunities...${colors.reset}\n`);

let lastTokenCount = 0;
let lastOpportunityCount = 0;

async function checkStatus() {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    const stats = response.data;
    
    // Check for new tokens analyzed
    if (stats.tokensAnalyzed > lastTokenCount) {
      const newTokens = stats.tokensAnalyzed - lastTokenCount;
      console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] 📊 Analyzed ${newTokens} new tokens${colors.reset}`);
      lastTokenCount = stats.tokensAnalyzed;
    }
    
    // Check for new opportunities
    if (stats.liveOpportunities > lastOpportunityCount) {
      console.log(`${colors.bright}${colors.green}🎯 NEW OPPORTUNITY DETECTED!${colors.reset}`);
      await getLatestOpportunities();
      lastOpportunityCount = stats.liveOpportunities;
    }
    
  } catch (error) {
    // Server might not be ready yet
  }
}

async function getLatestOpportunities() {
  try {
    const response = await axios.get(`${API_URL}/live-opportunities`);
    const opportunities = response.data;
    
    if (opportunities && opportunities.length > 0) {
      const latest = opportunities[0];
      
      console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.yellow}Token: ${latest.token.symbol}${colors.reset}`);
      console.log(`Score: ${latest.analysis.scores?.overall || 'N/A'}/100`);
      console.log(`Recommendation: ${colors.green}${latest.analysis.recommendation?.action}${colors.reset}`);
      console.log(`Confidence: ${Math.round((latest.analysis.confidence || 0) * 100)}%`);
      console.log(`Analysis Time: ${latest.analysisTime || 'N/A'}ms`);
      
      if (latest.analysis.recommendation?.strategy) {
        const strategy = latest.analysis.recommendation.strategy;
        console.log(`\n${colors.cyan}Trading Strategy:${colors.reset}`);
        console.log(`  Position Size: ${(strategy.positionSize * 100).toFixed(1)}%`);
        console.log(`  Stop Loss: -${((1 - strategy.stopLoss) * 100).toFixed(0)}%`);
        if (strategy.takeProfit) {
          console.log(`  Take Profit: ${strategy.takeProfit.map(tp => `+${((tp - 1) * 100).toFixed(0)}%`).join(', ')}`);
        }
      }
      
      console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`Error fetching opportunities: ${error.message}`);
  }
}

// Monitor every 2 seconds
setInterval(checkStatus, 2000);

// Initial status
console.log(`${colors.yellow}Waiting for live data...${colors.reset}\n`);

// Keep process running
process.stdin.resume(); 