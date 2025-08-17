#!/usr/bin/env node
/**
 * Live Token Analyzer
 * Bridges cluster7 feed → AI analysis → Dashboard
 */

import { EventEmitter } from 'node:events';
import { sharedWebSocketManager } from '../../services/SharedWebSocketManager.js';
import { enhancedAnalysis } from '../../services/EnhancedExternalAnalysis.js';
import { paperTradingSimulator } from '../../services/PaperTradingSimulator.js';
import { whaleDataService } from '../../services/WhaleDataService.js';
import { degenPaperTrader } from '../../services/DegenPaperTrader.js';
import { fastMemeAnalyzer } from '../../services/FastMemeAnalyzer.js';
import { momentumTracker } from '../../services/MomentumTracker.js';
import { birdeyeWebSocketManager } from '../../services/BirdeyeWebSocketManager.js';
import { PumpFunSniper } from '../../strategies/PumpFunSniper.js';
import { axiomAPIService } from '../data/AxiomAPIService.js';
import { axiomTokenResolver } from '../../services/AxiomTokenResolver.js';

export class LiveTokenAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      autoAnalyze: options.autoAnalyze !== false, // Default true
      minLiquidity: options.minLiquidity || 5000, // $5000 minimum - target quality tokens
      maxAnalysisAge: options.maxAnalysisAge || 300000, // 5 minutes cache
      analysisDelay: options.analysisDelay || 1000, // 1 second delay (faster processing)
      maxConcurrentAnalyses: options.maxConcurrentAnalyses || 5, // Increased from 3
      targetRooms: options.targetRooms || ['new_pairs', 'trending-search-crypto'],
      useFastMemeMode: true, // Re-enabled with relaxed filters
      fastModeTokenAge: 1800000, // 30 minutes - use fast mode for tokens younger than this
      momentumTrackingEnabled: true, // Track momentum for all analyzed tokens
      discoveryMode: options.discoveryMode || false, // Enable to explore new channels
      discoveryChannels: options.discoveryChannels || [
        // Price feeds
        'sol_price', 'btc_price', 'eth_price',
        // System channels
        'block_hash', 'jito-bribe-fee', 'sol-priority-fee',
        'connection_monitor', 'lighthouse', 'announcement',
        // Original channels we know work
        'new_pairs', 'trending-search-crypto',
        // Token-specific pattern examples (we'll dynamically subscribe to these)
        // 'b-{tokenAddress}' - buy/sell updates
        // 't:{tokenAddress}' - trade updates
      ]
    };
    
    // Cluster7 data cache for discovered data
    this.cluster7Cache = new Map();
    
    // Track discovered message types
    this.discoveredMessageTypes = new Set();
    
    // State tracking
    this.isRunning = false;
    this.analyzedTokens = new Map(); // Cache to avoid re-analyzing
    this.recentAnalysis = new Map(); // Recent analysis cache
    this.currentAnalyses = new Set(); // Track ongoing analyses
    this.queuedAnalyses = []; // Queue for rate limiting
    this.stats = {
      messagesProcessed: 0,
      tokensDetected: 0,
      tokensAnalyzed: 0,
      opportunitiesFound: 0,
      totalAnalysisTime: 0,
      startTime: Date.now()
    };
    
    // Initialize connection stats to prevent undefined errors
    this.connectionStats = {};
    
    console.log('⚡ LIVE TOKEN ANALYZER INITIALIZED');
    console.log('🔗 Bridging cluster7 feed → AI analysis → Dashboard');
    console.log('🐋 Whale tracking: ENABLED');
    console.log(`📊 Auto-analysis: ${this.config.autoAnalyze ? 'ENABLED' : 'DISABLED'}`);
    
    // Initialize PumpFun sniper for launch detection
    this.pumpSniper = new PumpFunSniper({
      maxAge: 30000,        // 30s max launch age
      minLiquidity: 5000,   // $5k min liquidity - quality threshold
      positionSize: 0.01,   // Starting position
      maxSlippage: 5        // 5% max slippage
    });
    
    // Connect sniper events
    this.pumpSniper.on('launch_detected', (launch) => {
      this.handlePumpLaunch(launch);
    });
  }
  
  /**
   * Start live token analysis
   */
  async start() {
    if (this.isRunning) {
      console.log('[LIVE] ⚠️ Already running');
      return;
    }
    
    this.isRunning = true;
    console.log('[LIVE] 🚀 Starting live token analysis...');
    console.log('[LIVE] 📡 Connecting to cluster7 goldmine feed');
    
    try {
      // Connect to cluster7 via SharedWebSocketManager
      const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
      console.log('[LIVE] ✅ Connected to cluster7');
      
      // Subscribe to relevant rooms
      for (const room of this.config.targetRooms) {
        const subscription = { action: 'join', room: room };
        connection.send(JSON.stringify(subscription));
        console.log(`[LIVE] 📡 Subscribed to: ${room}`);
      }
      
      // Discovery mode - subscribe to additional channels
      if (this.config.discoveryMode) {
        console.log('[LIVE] 🔍 DISCOVERY MODE ENABLED - Exploring additional channels...');
        for (const channel of this.config.discoveryChannels) {
          try {
            const subscription = { action: 'join', room: channel };
            connection.send(JSON.stringify(subscription));
            console.log(`[LIVE] 🔬 Discovery subscription: ${channel}`);
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.log(`[LIVE] ⚠️ Failed to subscribe to ${channel}: ${error.message}`);
          }
        }
      }
      
      // Listen for cluster7 messages
      sharedWebSocketManager.on('message', ({ url, data }) => {
        if (url.includes('cluster7')) {
          this.handleCluster7Message(data);
        }
      });
      
      // Start whale data monitoring
      await whaleDataService.start();
      
      // Setup Birdeye WebSocket for opportunity tracking
      this.setupBirdeyeTracking();
      
      // Start degen paper trader
      console.log('[LIVE] 🔥 Degen Paper Trader: ENABLED');
      
      // Start analysis queue processor
      this.startAnalysisProcessor();
      
      // Stats reporting
      this.startStatsReporting();
      
      console.log('[LIVE] ✅ Live token analysis ACTIVE');
      console.log('[LIVE] 🎯 Monitoring for new trading opportunities...');
      
      this.emit('started');
      
    } catch (error) {
      console.log(`[LIVE] ❌ Failed to start: ${error.message}`);
      this.isRunning = false;
      throw error;
    }
  }
  
  /**
   * Stop live analysis
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('[LIVE] 🛑 Stopping live token analysis');
    this.emit('stopped');
  }
  
  /**
   * Handle incoming cluster7 messages
   */
  handleCluster7Message(data) {
    this.stats.messagesProcessed++;
    
    // Discovery mode - log and cache all message types
    if (this.config.discoveryMode) {
      if (data.room && !this.discoveredMessageTypes.has(data.room)) {
        this.discoveredMessageTypes.add(data.room);
        console.log(`[CLUSTER7-DISCOVERY] 🆕 New message type discovered: ${data.room}`);
        console.log(`[CLUSTER7-DISCOVERY] 📋 Message structure:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
      
      // Cache discovered data by token if available
      if (data.content) {
        const tokenAddress = data.content.token_address || data.content.address || data.content.mint || data.content.token;
        if (tokenAddress) {
          this.updateCluster7Cache(tokenAddress, data.room, data.content);
        }
      }
    }
    
    // Handle specific message types
    if (data.room) {
      switch (data.room) {
        case 'new_pairs':
          // Extract and process new tokens
          const tokens = this.extractTokensFromMessage(data);
          for (const tokenData of tokens) {
            this.processDetectedToken(tokenData);
            // Subscribe to token-specific channels for real-time updates
            this.subscribeToTokenChannels(tokenData.address);
          }
          break;
          
        case 'sol_price':
        case 'btc_price':
        case 'eth_price':
          // Store price updates
          if (data.content && data.content.price) {
            this.priceFeeds = this.priceFeeds || {};
            this.priceFeeds[data.room] = {
              price: data.content.price,
              timestamp: Date.now()
            };
          }
          break;
          
        default:
          // Check if it's a token-specific channel
          if (data.room.startsWith('b-') || data.room.startsWith('t:')) {
            const tokenAddress = data.room.startsWith('b-') ? 
              data.room.substring(2) : data.room.substring(2);
            
            if (tokenAddress && data.content) {
              this.updateCluster7Cache(tokenAddress, data.room, data.content);
              
              // Emit trade updates for momentum tracking
              if (data.content.type === 'buy' || data.content.type === 'sell') {
                this.emit('trade_update', {
                  token: tokenAddress,
                  type: data.content.type,
                  amount: data.content.amount,
                  price: data.content.price,
                  timestamp: Date.now()
                });
              }
            }
          }
      }
    }
    
    // Original logic for target rooms (only process new_pairs and trending for token detection)
    if (data.room && (data.room === 'new_pairs' || data.room === 'trending-search-crypto')) {
      console.log(`[LIVE] 📨 Processing ${data.room} message`);
    }
  }
  
  /**
   * Update Cluster7 cache with discovered data
   */
  updateCluster7Cache(tokenAddress, dataType, content) {
    if (!this.cluster7Cache.has(tokenAddress)) {
      this.cluster7Cache.set(tokenAddress, {
        firstSeen: Date.now(),
        lastUpdate: Date.now(),
        data: {}
      });
    }
    
    const cacheEntry = this.cluster7Cache.get(tokenAddress);
    cacheEntry.lastUpdate = Date.now();
    
    // Store data by type
    switch (dataType) {
      case 'trades':
      case 'recent_trades':
      case 'token_trades':
        if (!cacheEntry.data.trades) cacheEntry.data.trades = [];
        cacheEntry.data.trades.push({
          timestamp: Date.now(),
          ...content
        });
        // Keep only last 100 trades
        if (cacheEntry.data.trades.length > 100) {
          cacheEntry.data.trades = cacheEntry.data.trades.slice(-100);
        }
        break;
        
      case 'price_updates':
      case 'price_movers':
        cacheEntry.data.lastPrice = content.price || content.current_price;
        cacheEntry.data.priceChange = content.price_change || content.change_percentage;
        break;
        
      case 'volume_movers':
      case 'volume_alerts':
        cacheEntry.data.volume24h = content.volume || content.volume_24h;
        cacheEntry.data.volumeChange = content.volume_change;
        break;
        
      case 'holder_updates':
      case 'holder_count':
        cacheEntry.data.holders = content.holders || content.holder_count;
        cacheEntry.data.holderChange = content.change || content.holder_change;
        break;
        
      case 'whale_trades':
      case 'large_trades':
        if (!cacheEntry.data.whaleActivity) cacheEntry.data.whaleActivity = [];
        cacheEntry.data.whaleActivity.push({
          timestamp: Date.now(),
          ...content
        });
        break;
        
      case 'liquidity_changes':
      case 'lp_updates':
        cacheEntry.data.liquidity = content.liquidity || content.total_liquidity;
        cacheEntry.data.liquidityChange = content.change || content.liquidity_change;
        break;
        
      default:
        // Handle token-specific channels
        if (dataType.startsWith('b-')) {
          // Buy/sell updates
          if (!cacheEntry.data.buySellUpdates) cacheEntry.data.buySellUpdates = [];
          cacheEntry.data.buySellUpdates.push({
            timestamp: Date.now(),
            type: content.type || 'unknown',
            ...content
          });
          // Keep only last 100 updates
          if (cacheEntry.data.buySellUpdates.length > 100) {
            cacheEntry.data.buySellUpdates = cacheEntry.data.buySellUpdates.slice(-100);
          }
          
          // Update buy/sell counts
          if (content.type === 'buy') {
            cacheEntry.data.buyCount = (cacheEntry.data.buyCount || 0) + 1;
          } else if (content.type === 'sell') {
            cacheEntry.data.sellCount = (cacheEntry.data.sellCount || 0) + 1;
          }
        } else if (dataType.startsWith('t:')) {
          // Trade updates
          if (!cacheEntry.data.trades) cacheEntry.data.trades = [];
          cacheEntry.data.trades.push({
            timestamp: Date.now(),
            ...content
          });
          // Keep only last 100 trades
          if (cacheEntry.data.trades.length > 100) {
            cacheEntry.data.trades = cacheEntry.data.trades.slice(-100);
          }
          
          // Update trade velocity
          const recentTrades = cacheEntry.data.trades.filter(t => 
            Date.now() - t.timestamp < 60000 // Last minute
          );
          cacheEntry.data.tradeVelocity = recentTrades.length;
        } else {
          // Store unknown data types as-is
          if (!cacheEntry.data.raw) cacheEntry.data.raw = {};
          cacheEntry.data.raw[dataType] = content;
        }
    }
    
    // Clean old cache entries (older than 1 hour)
    if (this.cluster7Cache.size > 1000) {
      const oneHourAgo = Date.now() - 3600000;
      for (const [token, data] of this.cluster7Cache.entries()) {
        if (data.lastUpdate < oneHourAgo) {
          this.cluster7Cache.delete(token);
        }
      }
    }
  }
  
  /**
   * Extract token information from cluster7 messages
   */
  extractTokensFromMessage(data) {
    const tokens = [];
    
    try {
      if (data.room === 'new_pairs' && data.content && typeof data.content === 'object') {
        // New token launches - content is individual object, not array
        const item = data.content;
        if (item.token_address && item.initial_liquidity_sol) {
          tokens.push({
            address: item.token_address,
            tokenAddress: item.token_address, // Add for compatibility
            pairAddress: item.pair_address, // Add pair address for Axiom API
            tokenTicker: item.token_ticker, // Add for Axiom resolver
            symbol: item.token_ticker || item.token_name || 'UNKNOWN',
            source: 'new_pairs',
            liquidity: item.initial_liquidity_sol * 142, // Convert SOL to USD (~$142/SOL)
            initialPrice: item.initial_liquidity_token || 0,
            volume24h: 0, // Not available in initial data
            marketCap: 0, // Calculate later if needed
            timestamp: Date.now(),
            raw: item
          });
        }
      } else if (data.room === 'trending-search-crypto' && data.content && typeof data.content === 'object') {
        // Trending tokens - content is individual object, not array
        const item = data.content;
        if (item.token_address) {
          tokens.push({
            address: item.token_address,
            tokenAddress: item.token_address, // Add for compatibility
            pairAddress: item.pair_address, // May be available
            tokenTicker: item.token_ticker, // Add for Axiom resolver
            symbol: item.token_ticker || item.token_name || 'TRENDING',
            source: 'trending',
            liquidity: item.initial_liquidity_sol ? item.initial_liquidity_sol * 142 : 0,
            initialPrice: item.initial_liquidity_token || 0,
            volume24h: 0, // Not available in initial data
            marketCap: 0, // Calculate later if needed
            priceChange24h: 0, // Not available in initial data
            timestamp: Date.now(),
            raw: item
          });
        }
      }
    } catch (error) {
      console.log(`[LIVE] ⚠️ Error extracting tokens: ${error.message}`);
    }
    
    return tokens;
  }
  
  /**
   * Process a detected token
   */
  async processDetectedToken(tokenData) {
    this.stats.tokensDetected++;
    
    // Debug log
    console.log(`[LIVE] 🔍 Token detected: ${tokenData.symbol} - Liquidity: $${tokenData.liquidity || 0}`);
    
    // Enrich token data with Axiom API if we have pairAddress
    if (tokenData.pairAddress || tokenData.tokenAddress) {
      try {
        console.log(`[LIVE] 🔄 Enriching token data for ${tokenData.symbol}...`);
        const enrichedData = await axiomTokenResolver.processNewPairMessage({
          tokenAddress: tokenData.tokenAddress || tokenData.address,
          pairAddress: tokenData.pairAddress,
          tokenTicker: tokenData.tokenTicker || tokenData.symbol
        });
        
        if (enrichedData) {
          // Merge enriched data with original
          tokenData = {
            ...tokenData,
            ...enrichedData,
            address: enrichedData.tokenAddress || tokenData.address,
            liquidity: enrichedData.initialLiquiditySol ? enrichedData.initialLiquiditySol * 142 : tokenData.liquidity,
            lpBurned: enrichedData.lpBurned,
            top10Holders: enrichedData.top10Holders,
            holders: enrichedData.holders,
            devHoldsPercent: enrichedData.devHoldsPercent,
            enriched: true
          };
          console.log(`[LIVE] ✅ Token enriched: ${tokenData.symbol} - LP Burned: ${tokenData.lpBurned}%, Top10: ${tokenData.top10Holders}%`);
        }
      } catch (error) {
        console.log(`[LIVE] ⚠️ Could not enrich token data: ${error.message}`);
      }
    }
    
    // Quick filters
    if (!(await this.shouldAnalyzeToken(tokenData))) {
      console.log(`[LIVE] ❌ Token filtered out: ${tokenData.symbol} - Liquidity: $${tokenData.liquidity || 0}`);
      return;
    }
    
    // Check if already analyzed recently
    const cacheKey = `${tokenData.address}_${tokenData.symbol}`;
    if (this.analyzedTokens.has(cacheKey)) {
      const cached = this.analyzedTokens.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.maxAnalysisAge) {
        console.log(`[LIVE] ⚡ Using cached analysis: ${tokenData.symbol}`);
        this.emitOpportunity(tokenData, cached.analysis);
        return;
      }
    }
    
    // Queue for analysis
    if (this.config.autoAnalyze) {
      this.queueTokenForAnalysis(tokenData);
    }
    
    console.log(`[LIVE] 🎯 Token detected: ${tokenData.symbol} ($${Math.round(tokenData.liquidity)} liquidity)`);
  }
  
  /**
   * Check if token should be analyzed
   */
  async shouldAnalyzeToken(tokenData) {
    // Basic validation
    if (!tokenData.address || tokenData.address.length < 40) {
      return false;
    }
    
    // Already analyzing
    if (this.currentAnalyses.has(tokenData.address)) {
      return false;
    }
    
    // Use fast meme analyzer for initial filtering if enabled
    if (this.config.useFastMemeMode) {
      const quickFilter = await fastMemeAnalyzer.quickFilter({
        liquidity: tokenData.liquidity || 0,
        volume: tokenData.volume || 0,
        priceHistory: tokenData.priceHistory || [],
        buyVolume: tokenData.buyVolume || 0,
        sellVolume: tokenData.sellVolume || 0
      });
      
      // Only process tokens that pass the fast filter
      return quickFilter.pass;
    }
    
    // Fallback to simple liquidity filter
    if (tokenData.liquidity < this.config.minLiquidity) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Queue token for analysis with rate limiting
   */
  queueTokenForAnalysis(tokenData) {
    this.queuedAnalyses.push({
      tokenData,
      timestamp: Date.now()
    });
    
    console.log(`[LIVE] 📋 Queued for analysis: ${tokenData.symbol} (Queue: ${this.queuedAnalyses.length})`);
  }
  
  /**
   * Start analysis queue processor
   */
  startAnalysisProcessor() {
    setInterval(async () => {
      if (!this.isRunning || this.queuedAnalyses.length === 0) {
        return;
      }
      
      // Respect concurrency limits
      if (this.currentAnalyses.size >= this.config.maxConcurrentAnalyses) {
        return;
      }
      
      // Get next queued analysis
      const queued = this.queuedAnalyses.shift();
      if (!queued) return;
      
      // Check if still relevant (not too old)
      if (Date.now() - queued.timestamp > 60000) { // 1 minute max queue time
        console.log(`[LIVE] ⏰ Dropping stale queued analysis: ${queued.tokenData.symbol}`);
        return;
      }
      
      // Start analysis
      this.analyzeTokenLive(queued.tokenData);
      
    }, this.config.analysisDelay);
  }
  
  /**
   * Perform live analysis on detected token
   */
  async analyzeTokenLive(tokenData) {
    const startTime = Date.now();
    const cacheKey = `${tokenData.address}_${tokenData.symbol}`;
    
    // Mark as analyzing
    this.currentAnalyses.add(tokenData.address);
    
    console.log(`[LIVE] 🔬 Starting live analysis: ${tokenData.symbol}`);
    
    try {
      let analysis;
      
      // Determine token age (use tokenData.age if available, otherwise assume new)
      const tokenAge = tokenData.age || 0;
      const isNewToken = tokenAge < this.config.fastModeTokenAge;
      
      // Use fast meme analyzer for new tokens
      if (this.config.useFastMemeMode && isNewToken) {
        console.log(`[LIVE] ⚡ Using fast meme analysis for ${tokenData.symbol}`);
        
        // Get Cluster7 cached data if available
        const cluster7Data = this.cluster7Cache.get(tokenData.address);
        
        // Prepare token data for fast analysis
        const fastTokenData = {
          address: tokenData.address,
          symbol: tokenData.symbol,
          pairAddress: tokenData.pairAddress || tokenData.pair_address,
          liquidity: tokenData.liquidity || 0,
          volume: tokenData.volume || 0,
          priceHistory: tokenData.priceHistory || [],
          volumeHistory: tokenData.volumeHistory || [],
          buyVolume: tokenData.buyVolume || 0,
          sellVolume: tokenData.sellVolume || 0,
          age: tokenAge
        };
        
        // Get Birdeye enhanced data
        const birdeyeData = this.getBirdeyeEnhancedData(tokenData.address);
        if (birdeyeData) {
          fastTokenData.birdeyeScore = birdeyeData.opportunity?.score;
          fastTokenData.birdeyeType = birdeyeData.opportunity?.type;
          fastTokenData.realtimePrice = birdeyeData.realtimePrice;
          fastTokenData.realtimePriceChange = birdeyeData.realtimePriceChange;
          fastTokenData.realtimeVolume = birdeyeData.realtimeVolume;
        }
        
        // Run fast analysis with Cluster7 data
        const fastResult = await fastMemeAnalyzer.analyzeToken(fastTokenData, cluster7Data);
        
        // Start momentum tracking if recommended
        if (this.config.momentumTrackingEnabled && 
            (fastResult.recommendation === 'BUY' || fastResult.recommendation === 'WATCH')) {
          momentumTracker.startTracking(tokenData.address, {
            symbol: tokenData.symbol,
            price: tokenData.currentPrice || tokenData.price || 0,
            volume: tokenData.volume || 0,
            buyVolume: tokenData.buyVolume || 0,
            sellVolume: tokenData.sellVolume || 0
          });
        }
        
        // Convert fast analysis to standard format
        analysis = this.convertFastAnalysisToStandard(fastResult);
        
      } else {
        // Use comprehensive analysis for older tokens
        console.log(`[LIVE] 🔍 Using comprehensive analysis for ${tokenData.symbol}`);
        analysis = await enhancedAnalysis.analyzeToken(tokenData.address, tokenData.symbol);
      }
      
      const analysisTime = Date.now() - startTime;
      this.stats.tokensAnalyzed++;
      this.stats.totalAnalysisTime += analysisTime; // Add analysis time to total
      
      if (analysis.error) {
        console.log(`[LIVE] ❌ Analysis failed: ${tokenData.symbol} - ${analysis.error}`);
        return;
      }
      
      // Cache the result
      this.analyzedTokens.set(cacheKey, {
        timestamp: Date.now(),
        analysis: analysis
      });
      
      // Emit ALL analyzed tokens for dashboard visibility
      this.stats.opportunitiesFound++;
      this.emitOpportunity(tokenData, analysis);
      
      // Log recommendation
      console.log(`[LIVE] 📊 Analysis result: ${tokenData.symbol} → ${analysis.recommendation?.action} (Score: ${analysis.scores?.overall || 0})`)
      
      // Process with paper trading simulator (NEW)
      try {
        const tradingResult = await paperTradingSimulator.processAnalysis(analysis);
        if (tradingResult.action === 'BUY') {
          console.log(`[LIVE] 🟢 PAPER TRADE: Bought ${tokenData.symbol} for $${tradingResult.position.amount}`);
        } else if (tradingResult.action === 'SELL') {
          console.log(`[LIVE] 🔴 PAPER TRADE: Sold ${tokenData.symbol} for $${tradingResult.result.profit.toFixed(2)} profit`);
        }
      } catch (error) {
        console.log(`[LIVE] ⚠️ Paper trading error: ${error.message}`);
      }
      
      console.log(`[LIVE] ✅ Analysis complete: ${tokenData.symbol} → ${analysis.recommendation?.action} (${analysisTime}ms)`);
      
    } catch (error) {
      console.log(`[LIVE] ❌ Analysis error: ${tokenData.symbol} - ${error.message}`);
    } finally {
      // Remove from analyzing set
      this.currentAnalyses.delete(tokenData.address);
    }
  }
  
  /**
   * Check if analysis represents a significant opportunity
   */
  isSignificantOpportunity(analysis) {
    // High confidence recommendations
    if (analysis.confidence > this.config.confidenceThreshold && 
        ['STRONG_BUY', 'BUY'].includes(analysis.recommendation?.action)) {
      return true;
    }
    
    // High overall score
    if (analysis.scores?.overall >= 70) {
      return true;
    }
    
    // Strong neural prediction
    if (analysis.neural?.prediction === 'WINNER' && analysis.neural?.confidence > 0.8) {
      return true;
    }
    
    // High security score with good fundamentals
    if (analysis.scores?.security >= 80 && analysis.scores?.market >= 60) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Emit opportunity to dashboard
   */
  emitOpportunity(tokenData, analysis) {
    const opportunity = {
      type: 'LIVE_OPPORTUNITY',
      timestamp: Date.now(),
      token: {
        address: tokenData.address,
        symbol: tokenData.symbol,
        source: tokenData.source,
        liquidity: tokenData.liquidity,
        price: tokenData.initialPrice
      },
      analysis: {
        scores: analysis.scores,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        neural: analysis.neural,
        risks: analysis.risks
      },
      priority: this.calculateOpportunityPriority(analysis)
    };
    
    // Emit to dashboard
    this.emit('opportunity', opportunity);
    
    console.log(`[LIVE] 🎯 OPPORTUNITY DETECTED: ${tokenData.symbol}`);
    console.log(`[LIVE] 📊 Score: ${analysis.scores?.overall}/100, Action: ${analysis.recommendation?.action}`);
    console.log(`[LIVE] 💰 Position: ${analysis.recommendation?.positionSize}, Confidence: ${Math.round(analysis.confidence * 100)}%`);
  }
  
  /**
   * Calculate opportunity priority for dashboard ordering
   */
  calculateOpportunityPriority(analysis) {
    let priority = 0;
    
    // Confidence weight
    priority += (analysis.confidence || 0) * 40;
    
    // Overall score weight
    priority += (analysis.scores?.overall || 0) * 0.3;
    
    // Neural prediction weight
    if (analysis.neural?.prediction === 'WINNER') priority += 20;
    else if (analysis.neural?.prediction === 'MODERATE') priority += 10;
    
    // Recommendation weight
    if (analysis.recommendation?.action === 'STRONG_BUY') priority += 30;
    else if (analysis.recommendation?.action === 'BUY') priority += 20;
    
    return Math.round(priority);
  }
  
  /**
   * Start stats reporting
   */
  startStatsReporting() {
    setInterval(() => {
      const runtime = (Date.now() - this.stats.startTime) / 1000;
      const rate = this.stats.messagesProcessed / runtime;
      
      console.log('');
      console.log('[LIVE] 📊 LIVE ANALYSIS STATS:');
      console.log(`⏱️  Runtime: ${Math.round(runtime)}s`);
      console.log(`📨 Messages: ${this.stats.messagesProcessed} (${rate.toFixed(1)}/s)`);
      console.log(`🎯 Tokens detected: ${this.stats.tokensDetected}`);
      console.log(`🔬 Tokens analyzed: ${this.stats.tokensAnalyzed}`);
      console.log(`💰 Opportunities found: ${this.stats.opportunitiesFound}`);
      console.log(`📋 Queue size: ${this.queuedAnalyses.length}`);
      console.log(`⚡ Analyzing: ${this.currentAnalyses.size}/${this.config.maxConcurrentAnalyses}`);
      console.log('');
      
    }, 120000); // Every 2 minutes
  }
  
  /**
   * Get cached Cluster7 data for a token
   */
  getCluster7Data(tokenAddress) {
    return this.cluster7Cache.get(tokenAddress) || null;
  }
  
  /**
   * Get discovery summary
   */
  getDiscoverySummary() {
    return {
      discoveredChannels: Array.from(this.discoveredMessageTypes),
      cacheSize: this.cluster7Cache.size,
      cachedTokens: Array.from(this.cluster7Cache.keys()).slice(0, 10), // First 10
      sampleData: this.cluster7Cache.size > 0 ? 
        this.cluster7Cache.values().next().value : null
    };
  }
  
  /**
   * Get stats including cache info
   */
  getStats() {
    const now = Date.now();
    const runtime = now - this.stats.startTime;
    
    return {
      runtime: Math.floor(runtime / 1000), // seconds
      messagesProcessed: this.stats.messagesProcessed,
      messagesPerSecond: this.stats.messagesProcessed / (runtime / 1000),
      tokensDetected: this.stats.tokensDetected,
      tokensAnalyzed: this.stats.tokensAnalyzed,
      opportunitiesFound: this.stats.opportunitiesFound,
      avgAnalysisTime: this.stats.totalAnalysisTime / Math.max(1, this.stats.tokensAnalyzed),
      currentQueue: this.queuedAnalyses.length,
      currentlyAnalyzing: this.currentAnalyses.size,
      recentAnalysisCache: this.recentAnalysis.size,
      cluster7CacheSize: this.cluster7Cache.size,
      discoveredChannels: this.discoveredMessageTypes.size
    };
  }
  
  /**
   * Convert fast analysis result to standard format
   */
  convertFastAnalysisToStandard(fastResult) {
    return {
      token: fastResult.token,
      symbol: fastResult.symbol,
      timestamp: fastResult.timestamp,
      analysisTime: fastResult.analysisTime,
      
      // Scores
      scores: {
        overall: fastResult.score,
        momentum: fastResult.momentum,
        whale: fastResult.whaleScore,
        market: fastResult.liquidity > 50000 ? 80 : 60,
        security: 70, // Default for fast mode
        technical: fastResult.momentum
      },
      
      // Recommendation
      recommendation: {
        action: fastResult.recommendation,
        confidence: (fastResult.confidence || 'MEDIUM'),
        strategy: fastResult.strategy,
        positionSize: fastResult.strategy?.positionSize || 0.01
      },
      
      // Confidence (convert string to number)
      confidence: fastResult.confidence === 'HIGH' ? 0.85 : 
                  fastResult.confidence === 'MEDIUM' ? 0.65 : 0.45,
      
      // Simplified data
      dexScreener: {
        liquidity: { usd: fastResult.liquidity },
        volume: { h24: fastResult.volume },
        priceChange: { h24: fastResult.priceChange * 100 }
      },
      
      // Risks (simplified for fast mode)
      risks: {
        rugPull: fastResult.liquidity < 20000 ? 0.7 : 0.3,
        volatility: fastResult.momentum > 50 ? 0.8 : 0.5,
        manipulation: fastResult.whaleCount > 5 ? 0.6 : 0.3
      }
    };
  }

  /**
   * Subscribe to token-specific channels for real-time updates
   */
  async subscribeToTokenChannels(tokenAddress) {
    try {
      const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
      
      // Subscribe to buy/sell updates
      const buySellRoom = `b-${tokenAddress}`;
      connection.send(JSON.stringify({ action: 'join', room: buySellRoom }));
      console.log(`[LIVE] 📊 Subscribed to buy/sell updates: ${buySellRoom}`);
      
      // Subscribe to trade updates
      const tradeRoom = `t:${tokenAddress}`;
      connection.send(JSON.stringify({ action: 'join', room: tradeRoom }));
      console.log(`[LIVE] 📈 Subscribed to trade updates: ${tradeRoom}`);
      
      // Track subscribed tokens
      if (!this.subscribedTokens) {
        this.subscribedTokens = new Set();
      }
      this.subscribedTokens.add(tokenAddress);
      
    } catch (error) {
      console.log(`[LIVE] ⚠️ Failed to subscribe to token channels: ${error.message}`);
    }
  }
  
  /**
   * Setup Birdeye WebSocket tracking for opportunities
   */
  setupBirdeyeTracking() {
    console.log('[LIVE] 🐦 Setting up Birdeye WebSocket tracking...');
    
    // Track top opportunities
    this.birdeyeTrackedTokens = new Set();
    this.birdeyeOpportunities = new Map();
    
    // Listen for Birdeye opportunities
    birdeyeWebSocketManager.on('opportunity', async (opportunity) => {
      console.log(`[BIRDEYE-OPP] 🎯 ${opportunity.type} for ${opportunity.tokenAddress} (Score: ${opportunity.score})`);
      
      // Store opportunity
      this.birdeyeOpportunities.set(opportunity.tokenAddress, opportunity);
      
      // If high score, trigger immediate analysis
      if (opportunity.score >= 70) {
        console.log(`[BIRDEYE-OPP] 🚨 HIGH SCORE OPPORTUNITY! Triggering immediate analysis...`);
        
        // Create token data for analysis
        const tokenData = {
          address: opportunity.tokenAddress,
          symbol: opportunity.data.symbol || 'UNKNOWN',
          source: 'birdeye_opportunity',
          liquidity: opportunity.data.liquidity || 0,
          volume: opportunity.data.volume || 0,
          priceHistory: [],
          birdeyeScore: opportunity.score,
          birdeyeType: opportunity.type
        };
        
        // Queue for immediate analysis
        this.queueAnalysis(tokenData);
      }
      
      // Emit for dashboard
      this.emit('birdeye_opportunity', opportunity);
    });
    
    // Listen for Birdeye updates to enhance our analysis
    birdeyeWebSocketManager.on('price_update', (data) => {
      // Store latest price data
      const cached = this.cluster7Cache.get(data.tokenAddress);
      if (cached) {
        cached.birdeyePrice = data.price;
        cached.birdeyePriceChange = data.priceChange;
      }
    });
    
    birdeyeWebSocketManager.on('volume_update', (data) => {
      // Store volume data
      const cached = this.cluster7Cache.get(data.tokenAddress);
      if (cached) {
        cached.birdeyeVolume = data.volume;
        cached.birdeyeVolumeRatio = data.volumeRatio;
      }
    });
    
    // Auto-track analyzed tokens
    this.on('analysis_complete', async (result) => {
      if (result.recommendation.action === 'BUY' || result.recommendation.action === 'WATCH') {
        if (!this.birdeyeTrackedTokens.has(result.token.address)) {
          console.log(`[BIRDEYE-TRACK] 📊 Auto-tracking ${result.token.symbol} on Birdeye WS`);
          const tracked = await birdeyeWebSocketManager.trackToken(result.token.address, {
            symbol: result.token.symbol,
            initialScore: result.analysis.scores?.overall || 0
          });
          
          if (tracked) {
            this.birdeyeTrackedTokens.add(result.token.address);
          }
        }
      }
    });
    
    // Track hot tokens from new_pairs
    this.on('token_detected', async (tokenData) => {
      // Track tokens with good initial liquidity
      if (tokenData.liquidity >= 5000 && this.birdeyeTrackedTokens.size < 100) {
        console.log(`[BIRDEYE-TRACK] 🔥 Auto-tracking hot token: ${tokenData.symbol}`);
        const tracked = await birdeyeWebSocketManager.trackToken(tokenData.address, {
          symbol: tokenData.symbol,
          source: 'new_pairs',
          initialLiquidity: tokenData.liquidity
        });
        
        if (tracked) {
          this.birdeyeTrackedTokens.add(tokenData.address);
        }
      }
    });
    
    console.log('[LIVE] ✅ Birdeye WebSocket tracking enabled');
  }
  
  /**
   * Get Birdeye-enhanced data for a token
   */
  getBirdeyeEnhancedData(tokenAddress) {
    const opportunity = this.birdeyeOpportunities.get(tokenAddress);
    const cached = this.cluster7Cache.get(tokenAddress);
    
    return {
      opportunity,
      realtimePrice: cached?.birdeyePrice,
      realtimePriceChange: cached?.birdeyePriceChange,
      realtimeVolume: cached?.birdeyeVolume,
      realtimeVolumeRatio: cached?.birdeyeVolumeRatio,
      isTracked: this.birdeyeTrackedTokens.has(tokenAddress)
    };
  }

  async handlePumpLaunch(launch) {
    this.logger.log(`[PUMP-SNIPER] 🎯 New launch detected: ${launch.name}`);
    
    // Analyze launch with our enhanced system
    const analysis = await this.analyzeToken(launch.address, {
      type: 'pump_launch',
      priority: 'HIGH',
      source: 'pump_sniper'
    });
    
    this.emit('pump_opportunity', {
      launch,
      analysis,
      timestamp: Date.now()
    });
  }
}

export const liveTokenAnalyzer = new LiveTokenAnalyzer();

// Set up momentum tracking listeners
momentumTracker.on('breakout', (data) => {
  console.log(`[MOMENTUM] 🚀 BREAKOUT DETECTED: ${data.symbol} +${(data.priceChange * 100).toFixed(1)}%`);
  liveTokenAnalyzer.emit('momentum_signal', {
    type: 'breakout',
    ...data
  });
});

momentumTracker.on('reversal', (data) => {
  console.log(`[MOMENTUM] ⚠️ REVERSAL DETECTED: ${data.symbol} -${(data.drop * 100).toFixed(1)}%`);
  liveTokenAnalyzer.emit('momentum_signal', {
    type: 'reversal',
    ...data
  });
});

momentumTracker.on('volumeSpike', (data) => {
  console.log(`[MOMENTUM] 📊 VOLUME SPIKE: ${data.symbol} ${data.volumeMultiple.toFixed(1)}x`);
}); 