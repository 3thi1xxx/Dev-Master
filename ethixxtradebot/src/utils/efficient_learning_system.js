#!/usr/bin/env node
/**
 * EFFICIENT LEARNING SYSTEM
 * Optimized for performance - won't slow down your computer
 * Smart data collection: Quality over quantity
 */

import { sharedWebSocketManager } from './services/SharedWebSocketManager.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

class EfficientLearningSystem {
  constructor() {
    this.startTime = Date.now();
    
    // PERFORMANCE OPTIMIZATIONS
    this.config = {
      maxMemoryTokens: 100,        // Only keep 100 tokens in memory
      highQualityOnly: true,       // Only track promising tokens
      saveInterval: 300000,        // Save every 5 minutes (not constantly)
      cleanupInterval: 600000,     // Cleanup old data every 10 minutes
      minLiquidity: 10000,         // Focus on $10k+ liquidity tokens
      maxTrackedAge: 14400000      // Drop tokens after 4 hours
    };
    
    // Lightweight tracking
    this.activeTokens = new Map();     // Current tracking (limited size)
    this.completedLearning = [];       // Finished learning examples
    this.stats = {
      processed: 0,
      tracked: 0,
      learned: 0,
      memoryUsage: 0
    };
    
    console.log('🧠 EFFICIENT LEARNING SYSTEM - OPTIMIZED PERFORMANCE');
    console.log('⚡ Memory-efficient: Max 100 tokens tracked simultaneously');
    console.log('🎯 High-quality focus: $10k+ liquidity tokens only');
    console.log('💾 Smart storage: Saves every 5 minutes, cleans every 10 minutes');
    console.log('=' .repeat(60));
  }
  
  async start() {
    // Load existing learning data
    this.loadCompletedLearning();
    
    // Connect to cluster7 with smart filtering
    const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
    console.log('[LEARNING] ✅ Connected to cluster7 goldmine');
    
    // Subscribe to only essential rooms (reduces message volume)
    const subscriptions = [
      { action: 'join', room: 'new_pairs' },           // New token launches
      { action: 'join', room: 'trending-search-crypto' } // Trending tokens
    ];
    
    for (const sub of subscriptions) {
      connection.send(JSON.stringify(sub));
      console.log(`[LEARNING] 📡 Subscribed to: ${sub.room}`);
    }
    
    // Listen for messages with smart filtering
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        this.processMessageEfficiently(data);
      }
    });
    
    // Start memory management
    this.startMemoryManagement();
    
    // Stats reporting (less frequent)
    setInterval(() => this.reportStats(), 120000); // Every 2 minutes
    
    console.log('[LEARNING] 🚀 Efficient learning started - monitoring high-quality opportunities');
  }
  
  processMessageEfficiently(data) {
    this.stats.processed++;
    
    // Quick filters to avoid processing junk
    if (!this.isWorthTracking(data)) return;
    
    const opportunities = this.parseHighQualityOpportunities(data);
    
    for (const opp of opportunities) {
      // Memory management: Only track if we have space or it's really good
      if (this.activeTokens.size >= this.config.maxMemoryTokens) {
        if (!this.isExceptionalOpportunity(opp)) continue;
        this.makeRoomInMemory();
      }
      
      this.trackTokenEfficiently(opp);
    }
  }
  
  isWorthTracking(data) {
    // Quick rejection filters to save CPU
    if (!data || !data.content) return false;
    if (data.room === 'twitter_feed_v2') return false; // Skip social for now
    return true;
  }
  
  parseHighQualityOpportunities(data) {
    const opportunities = [];
    
    if (data.room === 'new_pairs' && Array.isArray(data.content)) {
      for (const item of data.content) {
        if (item.tokenAddress && item.liquiditySol > 70) { // 70+ SOL = ~$10k+
          opportunities.push({
            token: item.tokenAddress,
            symbol: item.tokenSymbol || 'UNKNOWN',
            liquidity: item.liquiditySol * 142, // Convert to USD (~$142/SOL)
            marketCap: item.marketCapSol ? item.marketCapSol * 142 : null,
            timestamp: Date.now(),
            source: 'new_pairs',
            initialPrice: item.price || 0,
            volume24h: item.volume24h || 0
          });
        }
      }
    }
    
    return opportunities;
  }
  
  trackTokenEfficiently(opportunity) {
    this.stats.tracked++;
    
    // Lightweight tracking object
    this.activeTokens.set(opportunity.token, {
      ...opportunity,
      trackingStart: Date.now(),
      priceHistory: [opportunity.initialPrice],
      volumeHistory: [opportunity.volume24h],
      learningStatus: 'tracking'
    });
    
    console.log(`[LEARNING] 🎯 Tracking: ${opportunity.symbol} ($${Math.round(opportunity.liquidity)} liquidity)`);
  }
  
  isExceptionalOpportunity(opp) {
    // Only exceptional opportunities can bump others out of memory
    return opp.liquidity > 50000; // $50k+ liquidity
  }
  
  makeRoomInMemory() {
    // Remove oldest tracked token to make room
    const oldest = Array.from(this.activeTokens.entries())
      .sort((a, b) => a[1].trackingStart - b[1].trackingStart)[0];
    
    if (oldest) {
      this.moveToCompleted(oldest[0], oldest[1]);
      this.activeTokens.delete(oldest[0]);
    }
  }
  
  moveToCompleted(tokenAddress, tokenData) {
    // Determine outcome based on tracking period
    const trackingTime = Date.now() - tokenData.trackingStart;
    const outcome = this.determineOutcome(tokenData, trackingTime);
    
    this.completedLearning.push({
      token: tokenAddress,
      symbol: tokenData.symbol,
      initialLiquidity: tokenData.liquidity,
      initialPrice: tokenData.initialPrice,
      trackingDuration: trackingTime,
      outcome: outcome,
      completedAt: Date.now()
    });
    
    this.stats.learned++;
    console.log(`[LEARNING] 📚 Learned: ${tokenData.symbol} → ${outcome}`);
  }
  
  determineOutcome(tokenData, trackingTime) {
    // Simple outcome classification
    if (trackingTime < 1800000) return 'unknown'; // Less than 30 minutes
    if (trackingTime > 7200000) return 'survivor'; // Lasted 2+ hours
    return 'faded'; // Somewhere in between
  }
  
  startMemoryManagement() {
    // Cleanup old tokens every 10 minutes
    setInterval(() => {
      const cutoff = Date.now() - this.config.maxTrackedAge;
      let cleaned = 0;
      
      for (const [token, data] of this.activeTokens.entries()) {
        if (data.trackingStart < cutoff) {
          this.moveToCompleted(token, data);
          this.activeTokens.delete(token);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`[LEARNING] 🧹 Cleaned ${cleaned} old tokens from memory`);
      }
      
      // Save learning data periodically
      this.saveCompletedLearning();
      
    }, this.config.cleanupInterval);
  }
  
  loadCompletedLearning() {
    const filename = 'completed_learning.json';
    if (existsSync(filename)) {
      try {
        const data = readFileSync(filename, 'utf8');
        this.completedLearning = JSON.parse(data);
        console.log(`[LEARNING] 📖 Loaded ${this.completedLearning.length} previous learning examples`);
      } catch (e) {
        console.log('[LEARNING] ⚠️ Could not load previous learning data');
        this.completedLearning = [];
      }
    }
  }
  
  saveCompletedLearning() {
    try {
      writeFileSync('completed_learning.json', JSON.stringify(this.completedLearning, null, 2));
      console.log(`[LEARNING] 💾 Saved ${this.completedLearning.length} learning examples`);
    } catch (e) {
      console.log('[LEARNING] ⚠️ Could not save learning data');
    }
  }
  
  reportStats() {
    const runtime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    const memoryTokens = this.activeTokens.size;
    const processingRate = (this.stats.processed / (runtime * 60)).toFixed(1);
    
    console.log('');
    console.log('📊 EFFICIENT LEARNING STATS:');
    console.log(`⏱️  Runtime: ${runtime} minutes`);
    console.log(`📨 Messages processed: ${this.stats.processed} (${processingRate}/s)`);
    console.log(`🎯 High-quality tokens tracked: ${this.stats.tracked}`);
    console.log(`🧠 Learning examples completed: ${this.stats.learned}`);
    console.log(`💾 Memory usage: ${memoryTokens}/${this.config.maxMemoryTokens} tokens`);
    console.log(`📚 Total learning dataset: ${this.completedLearning.length} examples`);
    console.log('');
  }
}

// Start the efficient learning system
const learningSystem = new EfficientLearningSystem();
learningSystem.start().catch(console.error); 