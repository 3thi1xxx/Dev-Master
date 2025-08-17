#!/usr/bin/env node
/**
 * LEARNING MODE SYSTEM
 * Runs live opportunity detection + pattern learning WITHOUT trading
 * Builds AI dataset from real-time token flow for future advantage
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';
import { patternLearning } from './services/PatternLearningEngine.js';

class LearningModeSystem {
  constructor() {
    this.startTime = Date.now();
    this.stats = {
      tokensDetected: 0,
      tokensTracked: 0,
      highConfidenceOpportunities: 0,
      learningEvents: 0
    };
    
    console.log('🧠 LEARNING MODE SYSTEM - LIVE DATA, NO TRADING');
    console.log('=' .repeat(60));
    console.log('🎯 Goal: Build AI learning dataset from real token flow');
    console.log('💡 Zero risk - pure pattern learning');
    console.log('');
  }
  
  async start() {
    // Connect and subscribe to cluster7
    sharedWebSocketManager.on('connection-open', ({ url }) => {
      if (url.includes('cluster7')) {
        console.log('✅ cluster7 CONNECTED! Starting learning mode...');
        this.subscribeToDataRooms();
      }
    });
    
    // Listen for messages and learn
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        this.processForLearning(data);
      }
    });
    
    // Connect to cluster7
    console.log('🔌 Connecting to cluster7 goldmine...');
    await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
    
    // Regular stats and learning updates
    setInterval(() => {
      this.showLearningStats();
    }, 30000); // Every 30 seconds
    
    console.log('🚀 LEARNING MODE ACTIVE - Collecting data...');
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
    console.log('🎯 All learning data feeds active!');
    console.log('');
  }
  
  processForLearning(data) {
    const opportunities = this.parseForOpportunities(data);
    
    if (opportunities.length > 0) {
      this.stats.tokensDetected += opportunities.length;
      
      for (const opp of opportunities) {
        // Apply basic quality filters
        if (this.passesBasicFilters(opp)) {
          this.stats.highConfidenceOpportunities++;
          
          // START LEARNING - Record token birth
          const trackedToken = patternLearning.recordTokenBirth(opp);
          this.stats.tokensTracked++;
          this.stats.learningEvents++;
          
          console.log(`🎯 LEARNING: ${opp.symbol} | $${opp.liquidity?.toFixed(0)} | Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
        }
      }
    }
  }
  
  parseForOpportunities(data) {
    const opportunities = [];
    
    // Parse new_pairs (fresh token launches)
    if (data.room === 'new_pairs' && data.content) {
      const opportunity = {
        type: 'NEW_TOKEN_LAUNCH',
        token: data.content.pair_address,
        symbol: data.content.token_name || data.content.token_symbol || 'Unknown',
        age: 0, // Fresh token
        liquidity: this.estimateLiquidity(data.content),
        marketCap: data.content.market_cap,
        confidence: 0.7 // Base confidence for new launches
      };
      opportunities.push(opportunity);
    }
    
    // Parse surge-updates (trending tokens)
    if (data.room === 'surge-updates' && data.content?.updates) {
      for (const update of data.content.updates) {
        if (update.surgeData) {
          const surge = update.surgeData;
          const opportunity = {
            type: 'SURGE_OPPORTUNITY',
            token: surge.pairAddress,
            symbol: surge.tokenTicker || surge.tokenName || 'Unknown',
            age: 0, // Real-time
            liquidity: surge.liquiditySol * 142, // Convert SOL to USD
            marketCap: surge.marketCapSol * 142,
            confidence: this.calculateSurgeConfidence(surge)
          };
          opportunities.push(opportunity);
        }
      }
    }
    
    // Parse trending-search-crypto (social trending)
    if (data.room === 'trending-search-crypto' && data.content) {
      for (const item of data.content) {
        if (item.surgeData) {
          const surge = item.surgeData;
          const opportunity = {
            type: 'TRENDING_TOKEN',
            token: surge.tokenAddress,
            symbol: surge.tokenTicker || surge.tokenName || 'Unknown',
            age: 0,
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
  
  passesBasicFilters(opportunity) {
    // Only track tokens worth learning from
    return (
      opportunity.liquidity >= 5000 && // Min $5k liquidity
      opportunity.confidence >= 0.60 && // Min 60% confidence
      opportunity.marketCap <= 50000000 // Max $50M market cap
    );
  }
  
  estimateLiquidity(content) {
    return content.liquidity || content.liquidityUsd || 7000; // Default estimate
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
  
  showLearningStats() {
    const runtime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    const insights = patternLearning.getLearningInsights();
    
    console.log('\n🧠 LEARNING MODE STATS:');
    console.log('═'.repeat(50));
    console.log(`⏱️  Runtime: ${runtime} minutes`);
    console.log(`📊 Tokens Detected: ${this.stats.tokensDetected}`);
    console.log(`🎯 High-Confidence Tracked: ${this.stats.tokensTracked}`);
    console.log(`🧠 Learning Events: ${this.stats.learningEvents}`);
    console.log('');
    console.log('📈 AI LEARNING PROGRESS:');
    console.log(`🏆 Winners Classified: ${insights.winners}`);
    console.log(`💀 Duds Classified: ${insights.duds}`);
    console.log(`📊 Win Rate: ${insights.winRate?.toFixed(1) || 'N/A'}%`);
    console.log(`📋 Total Tracked: ${insights.totalTracked}`);
    
    if (insights.winners > 0) {
      console.log('\n🏆 WINNER PATTERNS EMERGING:');
      console.log(`💰 Avg Liquidity: $${insights.winnerPatterns.avgInitialLiquidity?.toFixed(0)}`);
      console.log(`🎯 Avg Confidence: ${(insights.winnerPatterns.avgConfidence * 100)?.toFixed(1)}%`);
      console.log(`😀 Emoji Rate: ${insights.winnerPatterns.emojiRate?.toFixed(1)}%`);
    }
    
    if (insights.duds > 0) {
      console.log('\n💀 DUD PATTERNS EMERGING:');
      console.log(`💰 Avg Liquidity: $${insights.dudPatterns.avgInitialLiquidity?.toFixed(0)}`);
      console.log(`🎯 Avg Confidence: ${(insights.dudPatterns.avgConfidence * 100)?.toFixed(1)}%`);
      console.log(`😀 Emoji Rate: ${insights.dudPatterns.emojiRate?.toFixed(1)}%`);
    }
    
    console.log('═'.repeat(50));
    console.log('');
  }
}

// Start learning mode
const learningSystem = new LearningModeSystem();
learningSystem.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping learning mode...');
  learningSystem.showLearningStats();
  console.log('💾 All learning data saved to token_learning_data.json');
  console.log('🎓 Ready to apply AI insights when you start trading!');
  process.exit(0);
}); 