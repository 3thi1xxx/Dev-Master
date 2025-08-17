#!/usr/bin/env node
/**
 * Live Opportunity Viewer
 * Shows detailed breakdown of opportunities as they're detected from cluster7
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';

class LiveOpportunityViewer {
  constructor() {
    this.messageCount = 0;
    this.opportunityCount = 0;
    this.filteredCount = 0;
    this.startTime = Date.now();
    
    console.log('🔥 LIVE OPPORTUNITY VIEWER');
    console.log('=' .repeat(70));
    console.log('📡 Monitoring cluster7 for trading opportunities...');
    console.log('💡 Shows detailed parsing and filtering info');
    console.log('');
  }
  
  async start() {
    // Connect and subscribe to cluster7
    sharedWebSocketManager.on('connection-open', ({ url }) => {
      if (url.includes('cluster7')) {
        console.log('✅ cluster7 CONNECTED! Subscribing to data rooms...');
        this.subscribeToDataRooms();
      }
    });
    
    // Listen for messages
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        this.handleMessage(data);
      }
    });
    
    // Connect
    const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
    
    // Stats every 15 seconds
    setInterval(() => {
      this.showStats();
    }, 15000);
  }
  
  subscribeToDataRooms() {
    const connection = sharedWebSocketManager.sharedWebSockets.get('wss://cluster7.axiom.trade/');
    if (!connection) return;
    
    const subscriptions = [
      { action: 'join', room: 'trending-search-crypto' },
      { action: 'join', room: 'new_pairs' },
      { action: 'join', room: 'surge-updates' }
    ];
    
    for (const sub of subscriptions) {
      connection.send(JSON.stringify(sub));
      console.log(`📤 Subscribed to: ${sub.room}`);
    }
    console.log('');
  }
  
  handleMessage(data) {
    this.messageCount++;
    
    // Parse for opportunities
    const opportunities = this.parseForOpportunities(data);
    
    if (opportunities.length > 0) {
      this.opportunityCount += opportunities.length;
      
      console.log(`\n🎯 [${this.opportunityCount}] OPPORTUNITIES FOUND in ${data.room}:`);
      
      for (const opp of opportunities) {
        console.log(`📊 Token: ${opp.symbol || 'Unknown'} | Address: ${opp.token}`);
        console.log(`💰 Liquidity: $${opp.liquidity?.toFixed(0) || 'N/A'} | MC: $${opp.marketCap?.toFixed(0) || 'N/A'}`);
        
        // Check filters
        const filterResult = this.checkFilters(opp);
        if (filterResult.passed) {
          console.log(`✅ PASSES ALL FILTERS - HIGH CONFIDENCE OPPORTUNITY!`);
        } else {
          this.filteredCount++;
          console.log(`❌ FILTERED OUT: ${filterResult.reason}`);
        }
        console.log(`⚡ Age: ${opp.age}ms | Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
        console.log('─'.repeat(50));
      }
    }
  }
  
  parseForOpportunities(data) {
    const opportunities = [];
    
    // Parse new_pairs
    if (data.room === 'new_pairs' && data.content) {
      const opportunity = {
        type: 'NEW_TOKEN_LAUNCH',
        token: data.content.pair_address,
        symbol: data.content.token_name || data.content.token_symbol || 'Unknown',
        age: Date.now() - (data.content.timestamp || Date.now()),
        liquidity: this.calculateLiquidity(data.content),
        marketCap: data.content.market_cap,
        confidence: 0.7 // Base confidence for new pairs
      };
      opportunities.push(opportunity);
    }
    
    // Parse surge-updates
    if (data.room === 'surge-updates' && data.content?.updates) {
      for (const update of data.content.updates) {
        if (update.surgeData) {
          const surge = update.surgeData;
          const opportunity = {
            type: 'SURGE_OPPORTUNITY',
            token: surge.pairAddress,
            symbol: surge.tokenTicker || surge.tokenName || 'Unknown',
            age: Date.now() - (surge.timestamp || Date.now()),
            liquidity: surge.liquiditySol * 142, // Convert SOL to USD (approx)
            marketCap: surge.marketCapSol * 142,
            confidence: this.calculateSurgeConfidence(surge)
          };
          opportunities.push(opportunity);
        }
      }
    }
    
    // Parse trending-search-crypto  
    if (data.room === 'trending-search-crypto' && data.content) {
      for (const item of data.content) {
        if (item.surgeData) {
          const surge = item.surgeData;
          const opportunity = {
            type: 'TRENDING_TOKEN',
            token: surge.tokenAddress,
            symbol: surge.tokenTicker || surge.tokenName || 'Unknown',
            age: Date.now() - (surge.timestamp || Date.now()),
            liquidity: surge.liquiditySol * 142,
            marketCap: surge.marketCapSol * 142,
            confidence: this.calculateTrendingConfidence(surge)
          };
          opportunities.push(opportunity);
        }
      }
    }
    
    return opportunities;
  }
  
  calculateLiquidity(content) {
    // Estimate liquidity from available data
    return content.liquidity || content.liquidityUsd || content.liquiditySol * 142 || 5000;
  }
  
  calculateSurgeConfidence(surge) {
    let confidence = 0.5;
    if (surge.liquiditySol > 50) confidence += 0.2;
    if (surge.volumeChange > 2) confidence += 0.2;
    if (surge.priceChange > 0.1) confidence += 0.1;
    return Math.min(confidence, 0.95);
  }
  
  calculateTrendingConfidence(surge) {
    let confidence = 0.6; // Higher base for trending
    if (surge.liquiditySol > 100) confidence += 0.2;
    if (surge.volumeChange > 3) confidence += 0.15;
    return Math.min(confidence, 0.95);
  }
  
  checkFilters(opportunity) {
    // Apply the same filters as RealTimeOpportunityDetector
    
    // Age filter
    if (opportunity.age > 30000) {
      return { passed: false, reason: `Too old: ${opportunity.age}ms > 30s` };
    }
    
    // Liquidity filter
    if (opportunity.liquidity < 5000) {
      return { passed: false, reason: `Low liquidity: $${opportunity.liquidity} < $5k` };
    }
    
    // Market cap filter
    if (opportunity.marketCap > 50000000) {
      return { passed: false, reason: `Market cap too high: $${opportunity.marketCap} > $50M` };
    }
    
    // Confidence filter
    if (opportunity.confidence < 0.60) {
      return { passed: false, reason: `Low confidence: ${(opportunity.confidence * 100).toFixed(1)}% < 60%` };
    }
    
    return { passed: true, reason: 'All filters passed!' };
  }
  
  showStats() {
    const runtime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (this.messageCount / (Date.now() - this.startTime) * 1000).toFixed(1);
    
    console.log(`\n📊 STATS after ${runtime}s:`);
    console.log(`📨 Messages: ${this.messageCount} (${rate}/sec)`);
    console.log(`🎯 Opportunities Found: ${this.opportunityCount}`);
    console.log(`❌ Filtered Out: ${this.filteredCount}`);
    console.log(`✅ High-Confidence: ${this.opportunityCount - this.filteredCount}`);
    console.log('');
  }
}

// Start the viewer
const viewer = new LiveOpportunityViewer();
viewer.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  viewer.showStats();
  console.log('👋 Live opportunity viewer stopped');
  process.exit(0);
}); 