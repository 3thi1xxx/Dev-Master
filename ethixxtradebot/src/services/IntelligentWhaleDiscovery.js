import axios from 'axios';
import { ultraFastClient } from './UltraFastAxiomClient.js';
import { axiomTokenManager } from '../core/AxiomTokenManager.js';
import fs from 'fs';
import { EventEmitter } from 'events';

/**
 * Intelligent Whale Discovery System
 * Leverages Axiom's complete intelligence infrastructure to auto-discover profitable whales
 */
export class IntelligentWhaleDiscovery extends EventEmitter {
  constructor() {
    super();
    
    this.discoveredWhales = new Map();
    this.intelligenceSources = {
      // Axiom's confirmed data sources from CSP analysis
      social: {
        bubblemaps: 'https://api.bubblemaps.io/v1/tokens/trending',
        cabalspy: 'https://api.cabalspy.xyz/v1/whales/activity',
        insightx: 'https://api.insightx.network/v1/signals/crypto'
      },
      axiom: {
        whale_feed: 'wss://eucalyptus.axiom.trade/ws',
        trading_cluster: 'wss://cluster7.axiom.trade/',
        api: null // Will be set from axiomTokenManager's current working endpoint
      },
      blockchain: {
        helius: 'https://mainnet.helius-rpc.com',
        jito: 'https://mainnet.block-engine.jito.wtf'
      }
    };
    
    this.profitabilityMetrics = {
      minWinRate: 0.65,           // 65%+ win rate required
      minAvgProfit: 0.08,         // 8%+ average profit per trade
      minTradeVolume: 10000,      // $10k+ per trade minimum
      maxTimeToProfit: 300,       // 5 minutes max to profitability
      minFrequency: 2             // 2+ trades per day minimum
    };
    
    this.whaleScoring = {
      profitability: 0.4,         // 40% weight
      consistency: 0.25,          // 25% weight  
      speed: 0.15,                // 15% weight
      volume: 0.1,                // 10% weight
      socialSentiment: 0.1        // 10% weight
    };
    
    this.trackedTokens = new Set();
    this.whaleDatabase = new Map();
    this.logger = console;
  }

  async init() {
    this.logger.log('🧠 INTELLIGENT WHALE DISCOVERY INITIALIZING');
    
    // Set dynamic API endpoint from token manager's current working endpoint
    const { axiomTokenManager } = await import('./AxiomTokenManager.js');
    this.intelligenceSources.axiom.api = axiomTokenManager.getCurrentApiBaseUrl();
    this.logger.log(`📡 Using dynamic Axiom API: ${this.intelligenceSources.axiom.api}`);
    
    this.logger.log('═══════════════════════════════════════════');
    
    // Initialize ultra-fast client for Auckland advantage
    await ultraFastClient.init();
    
    // Load existing whale database
    await this.loadWhaleDatabase();
    
    // Start intelligence aggregation
    await this.startIntelligenceAggregation();
    
    this.logger.log('✅ Intelligent whale discovery ready!');
    
    // TEST: Simulate some whale transactions to verify the system works
    if (process.env.TEST_WHALE_DISCOVERY === 'true') {
      this.simulateWhaleActivity();
    }
  }

  // Simulate whale activity for testing
  simulateWhaleActivity() {
    this.logger.log('[TEST] 🧪 Simulating whale transactions for testing...');
    
    const testWhales = [
      {
        wallet: 'HVXwMgm5PZoTS7gyQKV9WXJzArGzsVHen2dgbTfFo7uB',
        token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 125000,
        volume: 125000,
        type: 'swap',
        price: 1.05
      },
      {
        wallet: 'ENi5uKnSAT7GKXGyv6PUadpSg3xtVUHyuqMiB38vsF49',
        token: 'So11111111111111111111111111111111111111112',
        amount: 85000,
        volume: 85000,
        type: 'swap',
        price: 142.50
      }
    ];
    
    // Simulate transactions every 30 seconds
    setInterval(() => {
      const whale = testWhales[Math.floor(Math.random() * testWhales.length)];
      const transaction = {
        ...whale,
        timestamp: Date.now(),
        txHash: 'TEST_' + Math.random().toString(36).substring(7)
      };
      
      this.logger.log('[TEST] 📨 Simulating whale transaction:', transaction.wallet.substring(0, 8) + '...', '$' + transaction.volume);
      this.processWhaleTransaction(transaction);
    }, 30000);
  }

  async startIntelligenceAggregation() {
    this.logger.log('🕵️ Starting multi-source intelligence aggregation...');
    
    // Real-time whale activity monitoring
    this.startWhaleActivityMonitoring();
    
    // Social intelligence gathering
    this.startSocialIntelligenceGathering();
    
    // Blockchain analysis
    this.startBlockchainAnalysis();
    
    // Profitability scoring
    this.startProfitabilityScoring();
  }

  async startWhaleActivityMonitoring() {
    this.logger.log('[INTEL] 🐋 Monitoring live whale activity via Auckland endpoints...');
    
    // Connect to Axiom's whale feed with our speed advantage
    ultraFastClient.on('message', (data) => {
      // Debug: Log all messages to see what's coming through
      this.logger.log(`[DEBUG] WebSocket message from ${data.source}:`, JSON.stringify(data.data).substring(0, 100));
      
      if (data.source === 'whale_feed') {
        // Handle array format: [timestamp, address, token, ...]
        if (Array.isArray(data.data)) {
          this.logger.log(`[DEBUG] Whale feed array:`, data.data);
          
          const [timestamp, whaleAddress, tokenAddress, ...rest] = data.data;
          
          // Based on the whale feed array structure, amount is at position 9 (index 9)
          // Array format: [timestamp, whale, txid, ?, token1, token2, ?, ?, ?, amount, ...]
          let amount = data.data[9] || 100000; // Position 9 has the transaction amount
          
          // Validate it's a reasonable amount
          if (typeof amount !== 'number' || amount < 1000) {
            // Fallback: try to find amount in the rest of the array
            for (const value of rest) {
              if (typeof value === 'number' && value > 1000) {
                amount = value;
                break;
              }
            }
          }
          
          const transaction = {
            timestamp,
            wallet: whaleAddress,
            address: whaleAddress,
            token: tokenAddress,
            mint: tokenAddress,
            amount: amount,
            volume: amount,
            type: 'whale_feed',
            raw: data.data
          };
          this.logger.log(`[INTEL] 🐋 Whale feed transaction: ${whaleAddress?.substring(0, 8)}... Amount: $${amount}`);
          this.processWhaleTransaction(transaction);
        } else {
          this.processWhaleTransaction(data.data);
        }
      } else if (data.source === 'cluster_ws') {
        // Also process cluster messages which might contain whale data
        this.processClusterMessage(data.data);
      }
    });
  }

  // New method to process cluster messages
  async processClusterMessage(message) {
    // Check if this is a whale-related transaction
    if (message.type === 'transaction' || message.type === 'swap' || message.volume > 10000) {
      this.logger.log('[INTEL] 🔍 Processing potential whale transaction from cluster');
      await this.processWhaleTransaction(message);
    }
  }

  async processWhaleTransaction(transaction) {
    try {
      const whaleAddress = transaction.wallet || transaction.address;
      const tokenAddress = transaction.token || transaction.mint;
      const amount = transaction.amount || transaction.value;
      const timestamp = transaction.timestamp || Date.now();
      
      if (!whaleAddress || !tokenAddress) return;
      
      this.logger.log(`[INTEL] 🔍 Processing whale transaction: ${whaleAddress.substring(0,8)}... Amount: $${amount}`);
      
      // Real-time whale profitability analysis
      const whaleStats = await this.analyzeWhalePerformance(whaleAddress);
      const tokenIntel = await this.gatherTokenIntelligence(tokenAddress);
      
      // Score this whale based on intelligence
      const whaleScore = this.calculateWhaleScore(whaleStats, tokenIntel, transaction);
      
      this.logger.log(`[INTEL] 📊 Whale scoring breakdown:`);
      this.logger.log(`   - Whale stats score: ${whaleStats?.score || 0}`);
      this.logger.log(`   - Token intel score: ${tokenIntel?.score || 0}`);
      this.logger.log(`   - Transaction amount: $${(amount || 0).toLocaleString()}`);
      this.logger.log(`   - FINAL SCORE: ${whaleScore}`);
      
      // Lower threshold to discover more whales
      const discoveryThreshold = process.env.TEST_WHALE_DISCOVERY === 'true' ? 0.1 : 0.25; // Lowered from 0.75 to 0.25
      
      if (whaleScore >= discoveryThreshold) { // High-confidence profitable whale
        this.logger.log(`[INTEL] ✅ Whale score ${whaleScore} meets/exceeds threshold ${discoveryThreshold}!`);
        await this.addDiscoveredWhale(whaleAddress, whaleScore, {
          transaction,
          stats: whaleStats,
          tokenIntel,
          discoveredAt: timestamp
        });
      } else {
        this.logger.log(`[INTEL] ❌ Whale score ${whaleScore} below threshold ${discoveryThreshold}`);
      }
      
    } catch (error) {
      this.logger.log('[INTEL] ❌ Error processing whale transaction:', error.message);
    }
  }

  async analyzeWhalePerformance(whaleAddress) {
    try {
      // Multi-source whale analysis
      const [axiomData, heliusData, socialData] = await Promise.allSettled([
        this.getAxiomWhaleData(whaleAddress),
        this.getHeliusWhaleData(whaleAddress),
        this.getSocialWhaleData(whaleAddress)
      ]);
      
      const performance = {
        trades: [],
        winRate: 0,
        avgProfit: 0,
        totalVolume: 0,
        frequency: 0,
        consistency: 0,
        socialMentions: 0,
        lastActive: 0
      };
      
      // Combine data from all sources
      if (axiomData.status === 'fulfilled' && axiomData.value) {
        performance.trades.push(...axiomData.value.trades || []);
      }
      
      if (heliusData.status === 'fulfilled' && heliusData.value) {
        performance.trades.push(...heliusData.value.transactions || []);
      }
      
      if (socialData.status === 'fulfilled' && socialData.value) {
        performance.socialMentions = socialData.value.mentions || 0;
      }
      
      // Calculate profitability metrics
      return this.calculateProfitabilityMetrics(performance);
      
    } catch (error) {
      this.logger.log('[INTEL] ⚠️ Error analyzing whale performance:', error.message);
      return null;
    }
  }

  async getAxiomWhaleData(whaleAddress) {
    // Use our ultra-fast Auckland connection
    const response = await ultraFastClient.ultraFastRequest(
      `api/v1/whale/${whaleAddress}/history`, 
      null, 
      { timeout: 200 }
    );
    
    return response.data;
  }

  async getHeliusWhaleData(whaleAddress) {
    // Use Helius API (same RPC Axiom uses)
    const response = await axios.get(
      `https://api.helius.xyz/v0/addresses/${whaleAddress}/transactions`,
      {
        params: {
          'api-key': '43464bb1-0df3-4c2e-9e7d-20542fcd0060',
          limit: 50,
          commitment: 'confirmed'
        },
        timeout: 5000
      }
    );
    
    return response.data;
  }

  async getSocialWhaleData(whaleAddress) {
    // Leverage Axiom's social intelligence feeds
    const promises = [
      this.getBubbleMapsData(whaleAddress),
      this.getCabalSpyData(whaleAddress),
      this.getInsightXData(whaleAddress)
    ];
    
    const results = await Promise.allSettled(promises);
    
    return {
      mentions: results.reduce((sum, r) => {
        return sum + (r.status === 'fulfilled' ? r.value.mentions || 0 : 0);
      }, 0)
    };
  }

  async getBubbleMapsData(whaleAddress) {
    try {
      // BubbleMaps API - token flow visualization
      const response = await axios.get(
        `https://api.bubblemaps.io/v1/wallets/${whaleAddress}/activity`,
        { timeout: 3000 }
      );
      return response.data;
    } catch (error) {
      return { mentions: 0 };
    }
  }

  async getCabalSpyData(whaleAddress) {
    try {
      // CabalSpy API - whale tracking
      const response = await axios.get(
        `https://api.cabalspy.xyz/v1/whales/${whaleAddress}/performance`,
        { timeout: 3000 }
      );
      return response.data;
    } catch (error) {
      return { mentions: 0 };
    }
  }

  async getInsightXData(whaleAddress) {
    try {
      // InsightX API - market intelligence
      const response = await axios.get(
        `https://api.insightx.network/v1/wallets/${whaleAddress}/signals`,
        { timeout: 3000 }
      );
      return response.data;
    } catch (error) {
      return { mentions: 0 };
    }
  }

  calculateProfitabilityMetrics(performance) {
    const trades = performance.trades || [];
    
    if (trades.length === 0) {
      return {
        winRate: 0,
        avgProfit: 0,
        totalVolume: 0,
        frequency: 0,
        consistency: 0,
        score: 0
      };
    }
    
    // Calculate win rate
    const profitableTrades = trades.filter(t => t.profit > 0);
    const winRate = profitableTrades.length / trades.length;
    
    // Calculate average profit
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgProfit = totalProfit / trades.length;
    
    // Calculate total volume
    const totalVolume = trades.reduce((sum, t) => sum + (t.volume || 0), 0);
    
    // Calculate frequency (trades per day)
    const timeSpan = Math.max(1, (Date.now() - Math.min(...trades.map(t => t.timestamp))) / (24 * 60 * 60 * 1000));
    const frequency = trades.length / timeSpan;
    
    // Calculate consistency (profit variance)
    const profitVariance = this.calculateVariance(trades.map(t => t.profit || 0));
    const consistency = Math.max(0, 1 - (profitVariance / 100)); // Normalize variance
    
    return {
      winRate,
      avgProfit,
      totalVolume,
      frequency,
      consistency,
      socialMentions: performance.socialMentions || 0,
      score: this.calculateOverallScore(winRate, avgProfit, totalVolume, frequency, consistency, performance.socialMentions)
    };
  }

  calculateOverallScore(winRate, avgProfit, totalVolume, frequency, consistency, socialMentions) {
    // Weighted scoring based on our profitability criteria
    const scores = {
      profitability: Math.min(1, (winRate * avgProfit) / 0.05), // Target: 65% win rate * 8% avg profit
      consistency: consistency,
      speed: Math.min(1, frequency / 2), // Target: 2+ trades per day
      volume: Math.min(1, totalVolume / 100000), // Target: $100k+ volume
      social: Math.min(1, socialMentions / 10) // Bonus for social mentions
    };
    
    return (
      scores.profitability * this.whaleScoring.profitability +
      scores.consistency * this.whaleScoring.consistency +
      scores.speed * this.whaleScoring.speed +
      scores.volume * this.whaleScoring.volume +
      scores.social * this.whaleScoring.socialSentiment
    );
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  async gatherTokenIntelligence(tokenAddress) {
    try {
      // Multi-source token analysis
      const [priceData, socialData, liquidityData] = await Promise.allSettled([
        this.getTokenPriceIntel(tokenAddress),
        this.getTokenSocialIntel(tokenAddress),
        this.getTokenLiquidityIntel(tokenAddress)
      ]);
      
      return {
        price: priceData.status === 'fulfilled' ? priceData.value : null,
        social: socialData.status === 'fulfilled' ? socialData.value : null,
        liquidity: liquidityData.status === 'fulfilled' ? liquidityData.value : null,
        score: this.calculateTokenScore(priceData.value, socialData.value, liquidityData.value)
      };
      
    } catch (error) {
      return { score: 0 };
    }
  }

  async getTokenPriceIntel(tokenAddress) {
    // Use Axiom's trading cluster for price data
    const response = await ultraFastClient.ultraFastRequest(
      `api/v1/tokens/${tokenAddress}/price`,
      null,
      { timeout: 100 }
    );
    
    return response.data;
  }

  async getTokenSocialIntel(tokenAddress) {
    // Aggregate social sentiment from multiple sources
    const promises = [
      axios.get(`https://api.bubblemaps.io/v1/tokens/${tokenAddress}/sentiment`, { timeout: 2000 }),
      axios.get(`https://api.insightx.network/v1/tokens/${tokenAddress}/social`, { timeout: 2000 })
    ];
    
    const results = await Promise.allSettled(promises);
    
    return {
      mentions: results.reduce((sum, r) => {
        return sum + (r.status === 'fulfilled' ? r.value.data?.mentions || 0 : 0);
      }, 0),
      sentiment: results.reduce((sum, r) => {
        return sum + (r.status === 'fulfilled' ? r.value.data?.sentiment || 0 : 0);
      }, 0) / results.length
    };
  }

  async getTokenLiquidityIntel(tokenAddress) {
    // Use Helius for liquidity analysis
    const response = await axios.get(
      `https://api.helius.xyz/v0/tokens/${tokenAddress}/metadata`,
      {
        params: { 'api-key': '43464bb1-0df3-4c2e-9e7d-20542fcd0060' },
        timeout: 3000
      }
    );
    
    return response.data;
  }

  calculateTokenScore(priceData, socialData, liquidityData) {
    let score = 0;
    
    // Price momentum (30% weight)
    if (priceData?.priceChange24h > 0) {
      score += 0.3 * Math.min(1, priceData.priceChange24h / 0.1); // 10% price increase = max score
    }
    
    // Social sentiment (40% weight)
    if (socialData?.sentiment > 0) {
      score += 0.4 * Math.min(1, socialData.sentiment);
    }
    
    // Liquidity health (30% weight)
    if (liquidityData?.liquidity > 0) {
      score += 0.3 * Math.min(1, liquidityData.liquidity / 100000); // $100k liquidity = max score
    }
    
    return score;
  }

  calculateWhaleScore(whaleStats, tokenIntel, transaction) {
    // For testing or when APIs fail, use transaction-based scoring
    // Adjust scoring for MASSIVE whales: $100k = 0.5, $1M = 0.8, $10M+ = 1.0
    const amount = transaction.amount || 0;
    let transactionScore;
    
    if (amount >= 10000000) { // $10M+
      transactionScore = 1.0;
    } else if (amount >= 1000000) { // $1M+
      transactionScore = 0.8 + (amount - 1000000) / 45000000; // Scale 0.8 to 1.0
    } else if (amount >= 100000) { // $100k+
      transactionScore = 0.5 + (amount - 100000) / 2250000; // Scale 0.5 to 0.8
    } else {
      transactionScore = amount / 200000; // Scale 0 to 0.5
    }
    
    // If we have no whale stats or token intel (API failures), use transaction size as primary indicator
    if (!whaleStats || !tokenIntel || (whaleStats?.score === 0 && tokenIntel?.score === 0)) {
      this.logger.log('[INTEL] ⚠️ Using transaction-based scoring due to missing data');
      // For massive whales, transaction size alone is enough
      // $1M+ = instant discovery, $500k+ = likely discovery
      if (amount >= 1000000) {
        return Math.min(1.0, 0.5 + transactionScore * 0.5); // 0.5-1.0 score for $1M+ whales
      }
      return Math.min(0.75, transactionScore); // Up to 0.75 for smaller whales
    }
    
    const transactionSize = transactionScore; // Use new scoring
    
    // Combine whale performance with token intelligence
    const whaleScore = whaleStats.score || 0;
    const tokenScore = tokenIntel.score || 0;
    
    return (whaleScore * 0.6) + (tokenScore * 0.3) + (transactionSize * 0.1);
  }

  async addDiscoveredWhale(whaleAddress, score, metadata) {
    if (this.discoveredWhales.has(whaleAddress)) {
      // Update existing whale score
      const existing = this.discoveredWhales.get(whaleAddress);
      existing.score = Math.max(existing.score, score);
      existing.lastSeen = Date.now();
      existing.transactionCount++;
    } else {
      // Add new discovered whale
      this.discoveredWhales.set(whaleAddress, {
        address: whaleAddress,
        score: score,
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        transactionCount: 1,
        metadata: metadata,
        addedToTracking: false
      });
      
      this.logger.log(`[DISCOVERY] 🎯 New profitable whale discovered: ${whaleAddress.substring(0, 8)}... (Score: ${(score * 100).toFixed(1)}%)`);
      
      // Emit whale discovered event
      this.emit('whale-discovered', {
        address: whaleAddress,
        score: score,
        metadata: metadata
      });
    }
    
    // Auto-add high-scoring whales to tracking (lowered threshold)
    if (score > 0.45 && !this.discoveredWhales.get(whaleAddress).addedToTracking) { // Lowered from 0.85 to 0.45
      await this.autoAddToTracking(whaleAddress, score);
    }
  }

  async autoAddToTracking(whaleAddress, score) {
    try {
      // Load current whale config
      const config = JSON.parse(fs.readFileSync('config/tracked-wallets.json', 'utf8'));
      
      // Add new high-scoring whale
      const newWhale = {
        address: whaleAddress,
        name: `auto-discovered-${Date.now()}`,
        groupId: null,
        enabled: true,
        priority: "high",
        notes: `Auto-discovered profitable whale (Score: ${(score * 100).toFixed(1)}%) - ${new Date().toISOString()}`,
        discoveryScore: score,
        autoDiscovered: true
      };
      
      config.wallets.push(newWhale);
      
      // Save updated config
      fs.writeFileSync('config/tracked-wallets.json', JSON.stringify(config, null, 2));
      
      // Mark as added
      this.discoveredWhales.get(whaleAddress).addedToTracking = true;
      
      this.logger.log(`[DISCOVERY] ✅ Auto-added whale ${whaleAddress.substring(0, 8)}... to tracking (Score: ${(score * 100).toFixed(1)}%)`);
      
    } catch (error) {
      this.logger.log('[DISCOVERY] ❌ Error auto-adding whale:', error.message);
    }
  }

  async startSocialIntelligenceGathering() {
    this.logger.log('[INTEL] 📱 Starting social intelligence gathering...');
    
    // Monitor social feeds for whale mentions
    setInterval(async () => {
      try {
        await this.gatherSocialIntelligence();
      } catch (error) {
        this.logger.log('[INTEL] ⚠️ Social intelligence error:', error.message);
      }
    }, 30000); // Every 30 seconds
  }

  async gatherSocialIntelligence() {
    // Gather trending tokens and whale mentions from social sources
    const socialData = await Promise.allSettled([
      this.getTrendingFromBubbleMaps(),
      this.getTrendingFromInsightX(),
      this.getWhaleActivityFromCabalSpy()
    ]);
    
    socialData.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.processSocialIntelligence(result.value, index);
      }
    });
  }

  async getTrendingFromBubbleMaps() {
    const response = await axios.get(
      'https://api.bubblemaps.io/v1/tokens/trending',
      { timeout: 5000 }
    );
    return response.data;
  }

  async getTrendingFromInsightX() {
    const response = await axios.get(
      'https://api.insightx.network/v1/signals/crypto',
      { timeout: 5000 }
    );
    return response.data;
  }

  async getWhaleActivityFromCabalSpy() {
    const response = await axios.get(
      'https://api.cabalspy.xyz/v1/whales/activity',
      { timeout: 5000 }
    );
    return response.data;
  }

  processSocialIntelligence(data, sourceIndex) {
    // Process social intelligence data to identify whale patterns
    if (data.whales) {
      data.whales.forEach(whale => {
        if (whale.address && whale.profitability > 0.6) {
          this.analyzeWhalePerformance(whale.address);
        }
      });
    }
    
    if (data.trending) {
      data.trending.forEach(token => {
        this.trackedTokens.add(token.address);
      });
    }
  }

  async startBlockchainAnalysis() {
    this.logger.log('[INTEL] ⛓️ Starting blockchain analysis...');
    
    // Monitor blockchain for whale patterns
    setInterval(async () => {
      try {
        await this.analyzeBlockchainPatterns();
      } catch (error) {
        this.logger.log('[INTEL] ⚠️ Blockchain analysis error:', error.message);
      }
    }, 60000); // Every minute
  }

  async analyzeBlockchainPatterns() {
    // Use Helius to analyze recent large transactions
    const response = await axios.get(
      'https://api.helius.xyz/v0/transactions',
      {
        params: {
          'api-key': '43464bb1-0df3-4c2e-9e7d-20542fcd0060',
          limit: 100,
          commitment: 'confirmed',
          'type': 'SWAP'
        },
        timeout: 5000
      }
    );
    
    response.data.forEach(tx => {
      if (tx.amount > 10000) { // $10k+ transactions
        this.processLargeTransaction(tx);
      }
    });
  }

  async processLargeTransaction(transaction) {
    const whaleAddress = transaction.feePayer || transaction.signer;
    if (whaleAddress && !this.discoveredWhales.has(whaleAddress)) {
      // Analyze this potential whale
      const performance = await this.analyzeWhalePerformance(whaleAddress);
      if (performance && performance.score > 0.7) {
        const tokenIntel = await this.gatherTokenIntelligence(transaction.tokenAddress);
        const whaleScore = this.calculateWhaleScore(performance, tokenIntel, transaction);
        
        if (whaleScore > 0.75) {
          await this.addDiscoveredWhale(whaleAddress, whaleScore, {
            discoveryMethod: 'blockchain_analysis',
            transaction: transaction
          });
        }
      }
    }
  }

  async startProfitabilityScoring() {
    this.logger.log('[INTEL] 📊 Starting profitability scoring engine...');
    
    // Continuous profitability scoring
    setInterval(async () => {
      await this.updateProfitabilityScores();
    }, 300000); // Every 5 minutes
  }

  async updateProfitabilityScores() {
    for (const [address, whale] of this.discoveredWhales) {
      try {
        const performance = await this.analyzeWhalePerformance(address);
        if (performance) {
          whale.score = performance.score;
          whale.lastUpdated = Date.now();
          
          // Auto-add if score improved significantly
          if (performance.score > 0.85 && !whale.addedToTracking) {
            await this.autoAddToTracking(address, performance.score);
          }
        }
      } catch (error) {
        this.logger.log(`[INTEL] ⚠️ Error updating score for ${address}:`, error.message);
      }
    }
  }

  getTopWhales(limit = 10) {
    return Array.from(this.discoveredWhales.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getWhaleIntelligenceReport() {
    const topWhales = this.getTopWhales(15);
    const totalDiscovered = this.discoveredWhales.size;
    const autoAdded = Array.from(this.discoveredWhales.values()).filter(w => w.addedToTracking).length;
    
    return {
      summary: {
        totalDiscovered,
        autoAdded,
        highScoring: topWhales.filter(w => w.score > 0.8).length,
        avgScore: topWhales.reduce((sum, w) => sum + w.score, 0) / topWhales.length
      },
      topWhales: topWhales.map(w => ({
        address: w.address,
        score: Math.round(w.score * 100),
        discoveredAt: new Date(w.discoveredAt).toISOString(),
        transactions: w.transactionCount,
        addedToTracking: w.addedToTracking
      }))
    };
  }

  async loadWhaleDatabase() {
    // Load any existing whale intelligence database
    try {
      if (fs.existsSync('data/whale-intelligence.json')) {
        const data = JSON.parse(fs.readFileSync('data/whale-intelligence.json', 'utf8'));
        data.forEach(whale => {
          this.discoveredWhales.set(whale.address, whale);
        });
        this.logger.log(`[INTEL] 📚 Loaded ${data.length} whales from database`);
      }
    } catch (error) {
      this.logger.log('[INTEL] ⚠️ Could not load whale database:', error.message);
    }
  }

  async saveWhaleDatabase() {
    // Save whale intelligence database
    try {
      if (!fs.existsSync('data')) {
        fs.mkdirSync('data', { recursive: true });
      }
      
      const data = Array.from(this.discoveredWhales.values());
      fs.writeFileSync('data/whale-intelligence.json', JSON.stringify(data, null, 2));
      
      this.logger.log(`[INTEL] 💾 Saved ${data.length} whales to database`);
    } catch (error) {
      this.logger.log('[INTEL] ❌ Error saving whale database:', error.message);
    }
  }
}

// Export singleton instance
export const whaleDiscovery = new IntelligentWhaleDiscovery(); 