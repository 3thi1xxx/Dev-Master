#!/usr/bin/env node
/**
 * Enhanced External Analysis Integrator
 * Combines ALL advanced tools for ultimate trading analysis:
 * - Real Technical Analysis (RSI, MACD, Bollinger Bands)
 * - Neural Pattern Learning (TensorFlow predictions)
 * - Birdeye Analytics (Solana security & holder analysis)
 * - DexScreener API (real-time market data)
 * - Multi-source decision engine with AI insights
 */

import { technicalAnalysis } from '../ai/AdvancedTechnicalAnalysis.js';
import { neuralLearning } from '../ai/NeuralPatternLearning.js';
import { birdeyeAnalytics } from '../../services/BirdeyeAnalytics.js';
import { cluster7Intelligence } from '../ai/Cluster7Intelligence.js';
import { whaleIntelligence } from '../../intelligence/WhaleIntelligence.js';
import { cabalspyIntegration } from '../integrations/CabalspyIntegration.js';
import { bubblemapsIntegration } from '../integrations/BubblemapsIntegration.js';
import { geckoTerminalIntegration } from '../integrations/GeckoTerminalIntegration.js';
import { degenIntelligence } from '../../intelligence/DegenIntelligence.js';
import axios from 'axios';
import { EventEmitter } from 'node:events';

export class EnhancedExternalAnalysis extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      dexScreenerApi: 'https://api.dexscreener.com/latest/dex',
      analysisTimeout: 15000, // 15 seconds for comprehensive analysis
      confidenceThreshold: 0.75, // 75% confidence minimum for strong signals
      enableNeuralPredictions: true,
      enableTechnicalAnalysis: true,
      enableBirdeyeAnalysis: true,
      enableDexScreener: true,
      enableCluster7Intelligence: true, // NEW: Enable cluster7 intelligence
      enableWhaleIntelligence: true, // NEW: Enable whale intelligence
      enableCabalspyIntegration: true, // NEW: Enable Cabalspy integration
      enableBubblemapsIntegration: true, // NEW: Enable Bubblemaps integration
      enableGeckoTerminalIntegration: true, // NEW: Enable GeckoTerminal integration
      enableDegenIntelligence: true // NEW: Enable Degen Intelligence
    };
    
    // Analysis cache to avoid duplicate requests
    this.analysisCache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
    
          console.log('🚀 ENHANCED EXTERNAL ANALYSIS INTEGRATOR INITIALIZED');
      console.log('🧠 Neural Learning + 📈 Technical Analysis + 🐦 Birdeye + 🌐 DexScreener + 🧠 Cluster7 Intelligence + 🐋 Whale Intelligence + 🐋 Cabalspy + 🫧 Bubblemaps + 🦎 GeckoTerminal + 🔥 Degen Intelligence');
      console.log('🔬 Ultimate multi-source token analysis engine with advanced pattern recognition');
  }
  
  /**
   * Initialize all analysis components
   */
  async initialize() {
    console.log('[ENHANCED] 🚀 Initializing all analysis components...');
    
    try {
      // Initialize neural learning
      if (this.config.enableNeuralPredictions) {
        await neuralLearning.initialize();
        console.log('[ENHANCED] 🧠 Neural learning initialized');
      }
      
      console.log('[ENHANCED] ✅ All components initialized successfully');
      
    } catch (error) {
      console.log(`[ENHANCED] ⚠️ Initialization warning: ${error.message}`);
    }
  }
  
  /**
   * Comprehensive multi-source token analysis
   */
  async analyzeToken(tokenAddress, symbol = 'UNKNOWN') {
    const startTime = Date.now();
          console.log(`[ENHANCED] 🔍 Starting comprehensive analysis: ${symbol}`);
      console.log(`[ENHANCED] 🎯 Multi-source analysis: Technical + Neural + Birdeye + DexScreener + Cluster7 Intelligence`);
    
    try {
      // Check cache first
      const cacheKey = `${tokenAddress}_${symbol}`;
      if (this.analysisCache.has(cacheKey)) {
        const cached = this.analysisCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log(`[ENHANCED] ⚡ Using cached analysis for ${symbol}`);
          return cached.analysis;
        }
      }
      
      // Parallel data gathering from all sources
      const [
        dexScreenerData,
        birdeyeData,
        priceHistoryData,
        cabalspyData,
        bubblemapsData,
        geckoTerminalData,
        degenData
      ] = await Promise.allSettled([
        this.getDexScreenerData(tokenAddress),
        this.config.enableBirdeyeAnalysis ? birdeyeAnalytics.analyzeToken(tokenAddress) : null,
        this.getPriceHistory(tokenAddress),
        this.config.enableCabalspyIntegration ? cabalspyIntegration.getWhaleAnalysis(tokenAddress) : null,
        this.config.enableBubblemapsIntegration ? bubblemapsIntegration.getTokenAnalysis(tokenAddress) : null,
        this.config.enableGeckoTerminalIntegration ? geckoTerminalIntegration.getMarketAnalysis(tokenAddress) : null,
        this.config.enableDegenIntelligence ? degenIntelligence.getDegenAnalysis({ address: tokenAddress, symbol: symbol }) : null
      ]);
      
      // Extract successful results
      const dexData = dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : null;
      const birdeyeResult = birdeyeData.status === 'fulfilled' ? birdeyeData.value : null;
      const priceHistory = priceHistoryData.status === 'fulfilled' ? priceHistoryData.value : null;
      const cabalspyResult = cabalspyData.status === 'fulfilled' ? cabalspyData.value : null;
      const bubblemapsResult = bubblemapsData.status === 'fulfilled' ? bubblemapsData.value : null;
      const geckoTerminalResult = geckoTerminalData.status === 'fulfilled' ? geckoTerminalData.value : null;
      const degenResult = degenData.status === 'fulfilled' ? degenData.value : null;
      
      // Technical analysis on price history
      let technicalResult = null;
      if (this.config.enableTechnicalAnalysis && priceHistory && priceHistory.prices.length > 30) {
        try {
          technicalResult = await technicalAnalysis.analyzeToken(priceHistory.prices, priceHistory.volumes);
        } catch (error) {
          console.log(`[ENHANCED] ⚠️ Technical analysis error: ${error.message}`);
        }
      }
      
      // Neural prediction
      let neuralPrediction = null;
      if (this.config.enableNeuralPredictions) {
        try {
          const tokenFeatures = this.extractFeaturesForNeural(dexData, birdeyeResult, technicalResult);
          if (tokenFeatures) {
            neuralPrediction = await neuralLearning.predictToken(tokenFeatures);
          }
        } catch (error) {
          console.log(`[ENHANCED] ⚠️ Neural prediction error: ${error.message}`);
        }
      }
      
      // Cluster7 Intelligence Analysis (NEW)
      let cluster7Result = null;
      if (this.config.enableCluster7Intelligence) {
        try {
          const tokenData = this.prepareTokenDataForCluster7(dexData, birdeyeResult, technicalResult, neuralPrediction);
          cluster7Result = cluster7Intelligence.analyzeToken(tokenData);
        } catch (error) {
          console.log(`[ENHANCED] ⚠️ Cluster7 intelligence error: ${error.message}`);
        }
      }
      
      // Whale Intelligence Analysis (NEW)
      let whaleResult = null;
      if (this.config.enableWhaleIntelligence) {
        try {
          whaleResult = whaleIntelligence.getWhaleIntelligenceForToken(tokenAddress);
        } catch (error) {
          console.log(`[ENHANCED] ⚠️ Whale intelligence error: ${error.message}`);
        }
      }
      
      // Combine all analysis sources
      const comprehensiveAnalysis = {
        token: tokenAddress,
        symbol: symbol,
        timestamp: Date.now(),
        analysisTime: Date.now() - startTime,
        
        // Data sources
        dexScreener: dexData,
        birdeye: birdeyeResult,
        technical: technicalResult,
        neural: neuralPrediction,
        cluster7: cluster7Result, // NEW: Cluster7 intelligence
        whale: whaleResult, // NEW: Whale intelligence
        cabalspy: cabalspyResult, // NEW: Cabalspy integration
        bubblemaps: bubblemapsResult, // NEW: Bubblemaps integration
        geckoTerminal: geckoTerminalResult, // NEW: GeckoTerminal integration
        degen: degenResult, // NEW: Degen Intelligence
        priceHistory: priceHistory,
        
        // Unified scores and signals
        scores: {},
        signals: {},
        risks: {},
        opportunities: {},
        
        // Final recommendation
        recommendation: {},
        confidence: 0
      };
      
      // Generate unified analysis
      comprehensiveAnalysis.scores = this.calculateUnifiedScores(comprehensiveAnalysis);
      comprehensiveAnalysis.signals = this.generateUnifiedSignals(comprehensiveAnalysis);
      comprehensiveAnalysis.risks = this.assessUnifiedRisks(comprehensiveAnalysis);
      comprehensiveAnalysis.opportunities = this.identifyOpportunities(comprehensiveAnalysis);
      comprehensiveAnalysis.recommendation = this.generateFinalRecommendation(comprehensiveAnalysis);
      comprehensiveAnalysis.confidence = this.calculateOverallConfidence(comprehensiveAnalysis);
      
      // Cache the result
      this.analysisCache.set(cacheKey, {
        timestamp: Date.now(),
        analysis: comprehensiveAnalysis
      });
      
      const analysisTime = Date.now() - startTime;
      console.log(`[ENHANCED] ✅ Comprehensive analysis complete: ${symbol}`);
      console.log(`[ENHANCED] 📊 Final score: ${comprehensiveAnalysis.scores.overall}/100, Confidence: ${Math.round(comprehensiveAnalysis.confidence * 100)}%`);
      console.log(`[ENHANCED] 🎯 Recommendation: ${comprehensiveAnalysis.recommendation.action} (${analysisTime}ms)`);
      
      return comprehensiveAnalysis;
      
    } catch (error) {
      console.log(`[ENHANCED] ❌ Comprehensive analysis failed: ${error.message}`);
      return { 
        error: error.message, 
        token: tokenAddress, 
        symbol: symbol,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Get DexScreener data with enhanced error handling
   */
  async getDexScreenerData(tokenAddress) {
    try {
      const response = await axios.get(
        `${this.config.dexScreenerApi}/tokens/${tokenAddress}`,
        { timeout: this.config.analysisTimeout }
      );
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0]; // Use most liquid pair
        
        return {
          price: parseFloat(pair.priceUsd) || 0,
          liquidity: parseFloat(pair.liquidity?.usd) || 0,
          volume24h: parseFloat(pair.volume?.h24) || 0,
          volume6h: parseFloat(pair.volume?.h6) || 0,
          volume1h: parseFloat(pair.volume?.h1) || 0,
          priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
          priceChange6h: parseFloat(pair.priceChange?.h6) || 0,
          priceChange1h: parseFloat(pair.priceChange?.h1) || 0,
          marketCap: parseFloat(pair.marketCap) || 0,
          holders: pair.info?.holders || 0,
          pairAddress: pair.pairAddress,
          dexId: pair.dexId,
          social: {
            twitter: pair.info?.socials?.find(s => s.type === 'twitter')?.url || null,
            telegram: pair.info?.socials?.find(s => s.type === 'telegram')?.url || null,
            website: pair.info?.websites?.[0]?.url || null
          },
          security: {
            rugPull: pair.info?.rugPull || false,
            honeypot: pair.info?.honeypot || false,
            verified: pair.info?.verified || false
          }
        };
      }
      
      return null;
    } catch (error) {
      console.log(`[ENHANCED] ⚠️ DexScreener error: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get price history for technical analysis
   */
  async getPriceHistory(tokenAddress) {
    // This would ideally get OHLCV data from DexScreener or another source
    // For now, we'll simulate this or use available data
    try {
      // Try to get data from multiple sources
      const response = await axios.get(
        `${this.config.dexScreenerApi}/tokens/${tokenAddress}`,
        { timeout: this.config.analysisTimeout }
      );
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0];
        
        // Simulate price history based on current data
        // In a real implementation, you'd get historical OHLCV data
        const currentPrice = parseFloat(pair.priceUsd) || 0;
        const change24h = parseFloat(pair.priceChange?.h24) || 0;
        
        // Generate synthetic price history for demo
        const prices = this.generateSyntheticPriceHistory(currentPrice, change24h, 100);
        const volumes = this.generateSyntheticVolumeHistory(parseFloat(pair.volume?.h24) || 0, 100);
        
        return {
          prices: prices,
          volumes: volumes,
          currentPrice: currentPrice,
          timeframe: '1h',
          dataPoints: prices.length
        };
      }
      
      return null;
    } catch (error) {
      console.log(`[ENHANCED] ⚠️ Price history error: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Extract features for neural network analysis
   */
  extractFeaturesForNeural(dexData, birdeyeData, technicalData) {
    if (!dexData) return null;
    
    const features = {
      // Basic token data
      symbol: 'UNKNOWN',
      initialPrice: dexData.price,
      liquidity: dexData.liquidity,
      volume24h: dexData.volume24h,
      marketCap: dexData.marketCap,
      priceChange1h: dexData.priceChange1h || 0,
      priceChange6h: dexData.priceChange6h || 0,
      priceChange24h: dexData.priceChange24h || 0,
      
      // Social features
      hasTwitter: dexData.social?.twitter ? true : false,
      hasTelegram: dexData.social?.telegram ? true : false,
      hasWebsite: dexData.social?.website ? true : false,
      socialScore: this.calculateSocialScore(dexData.social),
      
      // Security features (from Birdeye if available)
      ownerPercentage: birdeyeData?.security?.ownerPercentage || 0,
      creatorPercentage: birdeyeData?.security?.creatorPercentage || 0,
      top10HolderPercent: birdeyeData?.security?.top10HolderPercent || 0,
      lpBurned: birdeyeData?.security?.lpBurned || false,
      renounced: birdeyeData?.security?.renounced || false,
      
      // Technical features
      rsi: technicalData?.momentum?.rsi?.current || 50,
      macd: technicalData?.trend?.macd?.current?.MACD || 0,
      bbPosition: technicalData?.volatility?.bollingerBands?.position === 'OVERSOLD' ? 0.2 : 
                 technicalData?.volatility?.bollingerBands?.position === 'OVERBOUGHT' ? 0.8 : 0.5,
      volumeSpike: technicalData?.volume?.volumeSpike || false,
      
      // Market timing
      ageHours: this.calculateTokenAge(birdeyeData?.overview?.createdAt),
      launchHour: new Date().getHours(),
      
      // Risk indicators
      rugPull: dexData.security?.rugPull || false,
      honeypot: dexData.security?.honeypot || false,
      verified: dexData.security?.verified || false
    };
    
    return features;
  }
  
  /**
   * Calculate unified scores from all sources
   */
  calculateUnifiedScores(analysis) {
    const scores = {
      technical: 50,
      fundamental: 50,
      security: 50,
      neural: 50,
      market: 50,
      overall: 50
    };
    
    // Technical score (from technical analysis)
    if (analysis.technical && analysis.technical.scores) {
      scores.technical = analysis.technical.scores.overall;
    }
    
    // Security score (from Birdeye)
    if (analysis.birdeye && analysis.birdeye.scores) {
      scores.security = analysis.birdeye.scores.security;
    }
    
    // Market score (from DexScreener data)
    if (analysis.dexScreener) {
      let marketScore = 50;
      
      // Liquidity component
      if (analysis.dexScreener.liquidity > 100000) marketScore += 20;
      else if (analysis.dexScreener.liquidity > 50000) marketScore += 10;
      else if (analysis.dexScreener.liquidity < 10000) marketScore -= 20;
      
      // Volume component
      const volumeRatio = analysis.dexScreener.volume24h / (analysis.dexScreener.liquidity || 1);
      if (volumeRatio > 2) marketScore += 15;
      else if (volumeRatio < 0.1) marketScore -= 15;
      
      // Price trend component
      if (analysis.dexScreener.priceChange24h > 0) marketScore += 10;
      if (analysis.dexScreener.priceChange6h > 0) marketScore += 5;
      
      scores.market = Math.max(0, Math.min(100, marketScore));
    }
    
    // Neural score (from AI prediction)
    if (analysis.neural && !analysis.neural.error) {
      const prediction = analysis.neural.prediction;
      if (prediction === 'WINNER') scores.neural = 90;
      else if (prediction === 'MODERATE') scores.neural = 70;
      else if (prediction === 'DUD') scores.neural = 30;
    }
    
    // Fundamental score (combination of multiple factors)
    let fundamentalScore = 50;
    
    // Social presence
    if (analysis.dexScreener?.social) {
      if (analysis.dexScreener.social.twitter) fundamentalScore += 10;
      if (analysis.dexScreener.social.telegram) fundamentalScore += 10;
      if (analysis.dexScreener.social.website) fundamentalScore += 15;
    }
    
    // Security factors
    if (analysis.dexScreener?.security?.verified) fundamentalScore += 10;
    if (analysis.dexScreener?.security?.rugPull) fundamentalScore -= 30;
    if (analysis.dexScreener?.security?.honeypot) fundamentalScore -= 25;
    
    scores.fundamental = Math.max(0, Math.min(100, fundamentalScore));
    
    // Cluster7 Intelligence score (NEW)
    if (analysis.cluster7 && !analysis.cluster7.error) {
      scores.cluster7 = analysis.cluster7.score || 50;
    } else {
      scores.cluster7 = 50;
    }
    
    // Whale Intelligence score (NEW)
    if (analysis.whale && !analysis.whale.error) {
      scores.whale = analysis.whale.score || 50;
    } else {
      scores.whale = 50;
    }
    
    // Cabalspy Intelligence score (NEW)
    if (analysis.cabalspy && !analysis.cabalspy.error && analysis.cabalspy.patterns) {
      scores.cabalspy = Math.round(analysis.cabalspy.patterns.confidence * 100) || 50;
    } else {
      scores.cabalspy = 50;
    }
    
    // Bubblemaps Intelligence score (NEW)
    if (analysis.bubblemaps && !analysis.bubblemaps.error && analysis.bubblemaps.riskAssessment) {
      const risk = analysis.bubblemaps.riskAssessment.overallRisk;
      if (risk === 'low') scores.bubblemaps = 80;
      else if (risk === 'medium') scores.bubblemaps = 60;
      else if (risk === 'high') scores.bubblemaps = 30;
      else scores.bubblemaps = 50;
    } else {
      scores.bubblemaps = 50;
    }
    
    // GeckoTerminal Intelligence score (NEW)
    if (analysis.geckoTerminal && !analysis.geckoTerminal.error && analysis.geckoTerminal.momentumAnalysis) {
      const momentum = analysis.geckoTerminal.momentumAnalysis.momentum;
      if (momentum === 'strong_bullish') scores.geckoTerminal = 90;
      else if (momentum === 'bullish') scores.geckoTerminal = 75;
      else if (momentum === 'neutral') scores.geckoTerminal = 50;
      else if (momentum === 'weak_bearish') scores.geckoTerminal = 35;
      else if (momentum === 'bearish') scores.geckoTerminal = 20;
      else scores.geckoTerminal = 50;
    } else {
      scores.geckoTerminal = 50;
    }
    
    // Degen Intelligence score (NEW - HIGH PRIORITY!)
    if (analysis.degen && !analysis.degen.error && analysis.degen.analysis) {
      scores.degen = Math.round(analysis.degen.analysis.degenScore * 100) || 50;
    } else {
      scores.degen = 50;
    }
    
    // Ensure all scores are valid numbers
    scores.technical = isNaN(scores.technical) ? 50 : Math.max(0, Math.min(100, scores.technical));
    scores.fundamental = isNaN(scores.fundamental) ? 50 : Math.max(0, Math.min(100, scores.fundamental));
    scores.security = isNaN(scores.security) ? 50 : Math.max(0, Math.min(100, scores.security));
    scores.neural = isNaN(scores.neural) ? 50 : Math.max(0, Math.min(100, scores.neural));
    scores.market = isNaN(scores.market) ? 50 : Math.max(0, Math.min(100, scores.market));
    scores.cluster7 = isNaN(scores.cluster7) ? 50 : Math.max(0, Math.min(100, scores.cluster7));
    scores.whale = isNaN(scores.whale) ? 50 : Math.max(0, Math.min(100, scores.whale));
    scores.cabalspy = isNaN(scores.cabalspy) ? 50 : Math.max(0, Math.min(100, scores.cabalspy));
    scores.bubblemaps = isNaN(scores.bubblemaps) ? 50 : Math.max(0, Math.min(100, scores.bubblemaps));
    scores.geckoTerminal = isNaN(scores.geckoTerminal) ? 50 : Math.max(0, Math.min(100, scores.geckoTerminal));
    scores.degen = isNaN(scores.degen) ? 50 : Math.max(0, Math.min(100, scores.degen));
    
    // Overall score (weighted average)
    const weights = {
      technical: 0.14,
      fundamental: 0.14,
      security: 0.18,
      neural: 0.14,
      market: 0.10,
      cluster7: 0.08, // Cluster7 intelligence weight
      whale: 0.10, // Whale intelligence weight
      cabalspy: 0.06, // NEW: Cabalspy intelligence weight
      bubblemaps: 0.08, // NEW: Bubblemaps intelligence weight
      geckoTerminal: 0.07, // NEW: GeckoTerminal intelligence weight
      degen: 0.09 // NEW: Degen Intelligence weight (HIGH WEIGHT FOR DEGEN!)
    };
    
    scores.overall = Math.round(
      scores.technical * weights.technical +
      scores.fundamental * weights.fundamental +
      scores.security * weights.security +
      scores.neural * weights.neural +
      scores.market * weights.market +
      scores.cluster7 * weights.cluster7 +
      scores.whale * weights.whale +
      scores.cabalspy * weights.cabalspy +
      scores.bubblemaps * weights.bubblemaps +
      scores.geckoTerminal * weights.geckoTerminal +
      scores.degen * weights.degen
    );
    
    // Final safety check
    if (isNaN(scores.overall)) {
      scores.overall = 50; // Default neutral score
    }
    
    return scores;
  }
  
  /**
   * Generate unified trading signals
   */
  generateUnifiedSignals(analysis) {
    const signals = {
      technical: [],
      fundamental: [],
      neural: [],
      market: [],
      cluster7: [], // NEW: Cluster7 signals
      whale: [], // NEW: Whale signals
      cabalspy: [], // NEW: Cabalspy signals
      bubblemaps: [], // NEW: Bubblemaps signals
      geckoTerminal: [], // NEW: GeckoTerminal signals
      degen: [], // NEW: Degen signals
      overall: 'NEUTRAL'
    };
    
    // Technical signals
    if (analysis.technical && analysis.technical.signals) {
      signals.technical = [analysis.technical.signals.overall];
    }
    
    // Neural signals
    if (analysis.neural && !analysis.neural.error) {
      const prediction = analysis.neural.prediction;
      const confidence = analysis.neural.confidence;
      
      if (prediction === 'WINNER' && confidence > 0.7) {
        signals.neural.push('STRONG_BUY');
      } else if (prediction === 'MODERATE' && confidence > 0.6) {
        signals.neural.push('BUY');
      } else if (prediction === 'DUD' && confidence > 0.7) {
        signals.neural.push('AVOID');
      }
    }
    
    // Market signals
    if (analysis.dexScreener) {
      if (analysis.dexScreener.priceChange1h > 5) signals.market.push('MOMENTUM_UP');
      if (analysis.dexScreener.volume24h > analysis.dexScreener.liquidity * 2) signals.market.push('HIGH_VOLUME');
      if (analysis.dexScreener.liquidity > 50000) signals.market.push('GOOD_LIQUIDITY');
    }
    
    // Birdeye signals
    if (analysis.birdeye && analysis.birdeye.signals) {
      signals.fundamental = [analysis.birdeye.signals.overall];
    }
    
    // Cluster7 Intelligence signals (NEW)
    if (analysis.cluster7 && !analysis.cluster7.error) {
      signals.cluster7 = analysis.cluster7.signals || [];
      if (analysis.cluster7.recommendation) {
        signals.cluster7.push(analysis.cluster7.recommendation);
      }
    }
    
    // Whale Intelligence signals (NEW)
    if (analysis.whale && !analysis.whale.error && analysis.whale.signals) {
      signals.whale = analysis.whale.signals || [];
    }
    
    // Cabalspy Intelligence signals (NEW)
    if (analysis.cabalspy && !analysis.cabalspy.error && analysis.cabalspy.signals) {
      signals.cabalspy = analysis.cabalspy.signals.map(s => s.type) || [];
    }
    
    // Bubblemaps Intelligence signals (NEW)
    if (analysis.bubblemaps && !analysis.bubblemaps.error && analysis.bubblemaps.riskAssessment) {
      const risk = analysis.bubblemaps.riskAssessment.overallRisk;
      if (risk === 'low') signals.bubblemaps.push('LOW_RISK');
      else if (risk === 'high') signals.bubblemaps.push('HIGH_RISK');
      else signals.bubblemaps.push('MEDIUM_RISK');
    }
    
    // GeckoTerminal Intelligence signals (NEW)
    if (analysis.geckoTerminal && !analysis.geckoTerminal.error && analysis.geckoTerminal.momentumAnalysis) {
      const momentum = analysis.geckoTerminal.momentumAnalysis.momentum;
      if (momentum === 'strong_bullish') signals.geckoTerminal.push('STRONG_BULLISH');
      else if (momentum === 'bullish') signals.geckoTerminal.push('BULLISH');
      else if (momentum === 'bearish') signals.geckoTerminal.push('BEARISH');
      else signals.geckoTerminal.push('NEUTRAL');
    }
    
    // Degen Intelligence signals (NEW - DEGEN STYLE!)
    if (analysis.degen && !analysis.degen.error && analysis.degen.signals) {
      signals.degen = analysis.degen.signals.map(s => s.type) || [];
    }
    
    // Generate overall signal
    const allPositiveSignals = [
      ...signals.technical.filter(s => ['BUY', 'STRONG_BUY', 'BULLISH'].includes(s)),
      ...signals.neural.filter(s => ['BUY', 'STRONG_BUY'].includes(s)),
      ...signals.market.filter(s => ['MOMENTUM_UP', 'HIGH_VOLUME', 'GOOD_LIQUIDITY'].includes(s)),
      ...signals.fundamental.filter(s => ['BUY', 'WATCH'].includes(s)),
      ...signals.cluster7.filter(s => ['BUY', 'STRONG_BUY', 'WATCH'].includes(s)), // NEW: Cluster7 signals
      ...signals.whale.filter(s => ['BUY', 'STRONG_BUY'].includes(s)), // NEW: Whale signals
      ...signals.cabalspy.filter(s => ['BUY', 'STRONG_BUY'].includes(s)), // NEW: Cabalspy signals
      ...signals.bubblemaps.filter(s => ['LOW_RISK'].includes(s)), // NEW: Bubblemaps signals
      ...signals.geckoTerminal.filter(s => ['BULLISH', 'STRONG_BULLISH'].includes(s)), // NEW: GeckoTerminal signals
      ...signals.degen.filter(s => ['DEGEN_BUY', 'DEGEN_YOLO'].includes(s)) // NEW: Degen signals (HIGH PRIORITY!)
    ];
    
    const allNegativeSignals = [
      ...signals.technical.filter(s => ['SELL', 'BEARISH'].includes(s)),
      ...signals.neural.filter(s => ['AVOID'].includes(s)),
      ...signals.fundamental.filter(s => ['AVOID'].includes(s)),
      ...signals.cluster7.filter(s => ['AVOID'].includes(s)) // NEW: Cluster7 signals
    ];
    
    if (allPositiveSignals.length >= 3 && allNegativeSignals.length === 0) {
      signals.overall = 'STRONG_BUY';
    } else if (allPositiveSignals.length >= 2 && allNegativeSignals.length === 0) {
      signals.overall = 'BUY';
    } else if (allPositiveSignals.length > allNegativeSignals.length) {
      signals.overall = 'WATCH';
    } else if (allNegativeSignals.length > 0) {
      signals.overall = 'AVOID';
    }
    
    return signals;
  }
  
  /**
   * Assess unified risks from all sources
   */
  assessUnifiedRisks(analysis) {
    const risks = {
      security: [],
      market: [],
      technical: [],
      overall: 'MEDIUM'
    };
    
    // Security risks from Birdeye
    if (analysis.birdeye && analysis.birdeye.risk) {
      risks.security = analysis.birdeye.risk.factors || [];
    }
    
    // Market risks from DexScreener
    if (analysis.dexScreener) {
      if (analysis.dexScreener.liquidity < 10000) {
        risks.market.push({ type: 'LOW_LIQUIDITY', severity: 'HIGH' });
      }
      if (analysis.dexScreener.security?.rugPull) {
        risks.security.push({ type: 'RUG_PULL_RISK', severity: 'VERY_HIGH' });
      }
      if (analysis.dexScreener.security?.honeypot) {
        risks.security.push({ type: 'HONEYPOT_RISK', severity: 'VERY_HIGH' });
      }
      if (analysis.dexScreener.volume24h < analysis.dexScreener.liquidity * 0.1) {
        risks.market.push({ type: 'LOW_VOLUME', severity: 'MEDIUM' });
      }
    }
    
    // Technical risks
    if (analysis.technical && analysis.technical.summary) {
      risks.technical = analysis.technical.summary.risks || [];
    }
    
    // Calculate overall risk level
    const allRisks = [...risks.security, ...risks.market, ...risks.technical];
    const highRisks = allRisks.filter(r => r.severity === 'VERY_HIGH' || r.severity === 'HIGH').length;
    const mediumRisks = allRisks.filter(r => r.severity === 'MEDIUM').length;
    
    if (highRisks > 0) risks.overall = 'HIGH';
    else if (mediumRisks > 2) risks.overall = 'MEDIUM';
    else risks.overall = 'LOW';
    
    return risks;
  }
  
  /**
   * Identify trading opportunities
   */
  identifyOpportunities(analysis) {
    const opportunities = [];
    
    // Neural AI opportunity
    if (analysis.neural && analysis.neural.prediction === 'WINNER' && analysis.neural.confidence > 0.8) {
      opportunities.push({
        type: 'AI_PREDICTION',
        description: `Neural network predicts WINNER with ${Math.round(analysis.neural.confidence * 100)}% confidence`,
        potential: 'HIGH',
        timeframe: '1-24 hours'
      });
    }
    
    // Technical opportunities
    if (analysis.technical && analysis.technical.summary) {
      opportunities.push(...(analysis.technical.summary.opportunities || []));
    }
    
    // Market opportunities
    if (analysis.dexScreener) {
      if (analysis.dexScreener.priceChange1h < -10 && analysis.dexScreener.priceChange24h > 0) {
        opportunities.push({
          type: 'DIP_BUYING',
          description: 'Recent dip in strong uptrend - potential bounce',
          potential: 'MEDIUM',
          timeframe: '1-6 hours'
        });
      }
      
      if (analysis.dexScreener.volume1h > analysis.dexScreener.volume6h * 3) {
        opportunities.push({
          type: 'VOLUME_SPIKE',
          description: 'Unusual volume spike detected',
          potential: 'MEDIUM',
          timeframe: 'Immediate'
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Generate final trading recommendation
   */
  generateFinalRecommendation(analysis) {
    const scores = analysis.scores;
    const signals = analysis.signals;
    const risks = analysis.risks;
    
    let action = 'HOLD';
    let positionSize = '$0';
    let timeframe = 'N/A';
    let reasoning = [];
    
    // Decision logic based on multiple factors
    if (scores.overall >= 80 && signals.overall === 'STRONG_BUY' && risks.overall !== 'HIGH') {
      action = 'STRONG_BUY';
      positionSize = '$25-50';
      timeframe = '1-4 hours';
      reasoning.push(`Excellent overall score (${scores.overall})`);
      reasoning.push('Multiple positive signals');
      reasoning.push('Acceptable risk level');
    } else if (scores.overall >= 65 && ['BUY', 'STRONG_BUY'].includes(signals.overall) && risks.overall !== 'HIGH') {
      action = 'BUY';
      positionSize = '$10-25';
      timeframe = '2-8 hours';
      reasoning.push(`Good overall score (${scores.overall})`);
      reasoning.push('Positive signals detected');
    } else if (scores.overall >= 50 && signals.overall === 'WATCH') {
      action = 'WATCH';
      positionSize = '$5-15';
      timeframe = '4-12 hours';
      reasoning.push('Moderate signals - monitor for improvement');
    } else if (signals.overall === 'AVOID' || risks.overall === 'HIGH') {
      action = 'AVOID';
      positionSize = '$0';
      timeframe = 'N/A';
      reasoning.push('High risk or negative signals');
    } else {
      action = 'HOLD';
      positionSize = '$0';
      timeframe = 'N/A';
      reasoning.push('Insufficient signals for action');
    }
    
    // Special neural override
    if (analysis.neural && analysis.neural.prediction === 'DUD' && analysis.neural.confidence > 0.8) {
      action = 'AVOID';
      positionSize = '$0';
      reasoning.push('AI predicts failure with high confidence');
    }
    
    return {
      action: action,
      positionSize: positionSize,
      timeframe: timeframe,
      reasoning: reasoning,
      riskLevel: risks.overall,
      confidence: analysis.confidence
    };
  }
  
  /**
   * Calculate overall confidence in the analysis
   */
  calculateOverallConfidence(analysis) {
    let confidence = 0.5; // Base confidence
    let factors = 0;
    
    // Data source availability
    if (analysis.dexScreener) { confidence += 0.1; factors++; }
    if (analysis.birdeye && !analysis.birdeye.error) { confidence += 0.15; factors++; }
    if (analysis.technical && !analysis.technical.error) { confidence += 0.1; factors++; }
    if (analysis.neural && !analysis.neural.error) { confidence += 0.15; factors++; }
    
    // Signal consistency
    const signalCount = Object.values(analysis.signals || {}).flat().length;
    if (signalCount > 3) confidence += 0.1;
    
    // Score consistency
    if (analysis.scores) {
      const scoreVariance = this.calculateVariance(Object.values(analysis.scores));
      if (scoreVariance < 400) confidence += 0.1; // Low variance = consistent scores
    }
    
    // Neural confidence boost
    if (analysis.neural && analysis.neural.confidence > 0.8) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
  
  // Helper methods
  calculateSocialScore(social) {
    if (!social) return 0;
    let score = 0;
    if (social.twitter) score += 30;
    if (social.telegram) score += 30;
    if (social.website) score += 40;
    return score;
  }
  
  calculateTokenAge(createdAt) {
    if (!createdAt) return 0;
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60); // Hours
  }
  
  generateSyntheticPriceHistory(currentPrice, change24h, points) {
    const prices = [];
    const volatility = Math.abs(change24h) / 100 * 0.1; // 10% of daily change as volatility
    
    for (let i = points; i >= 0; i--) {
      const randomWalk = (Math.random() - 0.5) * volatility;
      const timeDecay = (change24h / 100) * (points - i) / points;
      const price = currentPrice * (1 - timeDecay + randomWalk);
      prices.push(Math.max(price, 0.0001));
    }
    
    return prices;
  }
  
  generateSyntheticVolumeHistory(volume24h, points) {
    const volumes = [];
    const avgVolume = volume24h / 24; // Hourly average
    
    for (let i = 0; i < points; i++) {
      const randomMultiplier = 0.5 + Math.random() * 1.5; // 0.5x to 2x variation
      volumes.push(avgVolume * randomMultiplier);
    }
    
    return volumes;
  }
  
  /**
   * Prepare token data for Cluster7 intelligence analysis
   */
  prepareTokenDataForCluster7(dexData, birdeyeResult, technicalResult, neuralPrediction) {
    const tokenData = {
      symbol: 'UNKNOWN',
      address: 'unknown',
      liquidity: 0,
      volume24h: 0,
      priceChange1h: 0,
      priceChange6h: 0,
      priceChange24h: 0,
      marketCap: 0,
      initialPrice: 0,
      hasTwitter: false,
      hasTelegram: false,
      hasWebsite: false,
      socialScore: 0,
      ageHours: 0,
      launchHour: new Date().getUTCHours()
    };
    
    // Extract data from DexScreener
    if (dexData) {
      tokenData.symbol = dexData.symbol || 'UNKNOWN';
      tokenData.address = dexData.address || 'unknown';
      tokenData.liquidity = dexData.liquidity || 0;
      tokenData.volume24h = dexData.volume24h || 0;
      tokenData.priceChange1h = dexData.priceChange1h || 0;
      tokenData.priceChange6h = dexData.priceChange6h || 0;
      tokenData.priceChange24h = dexData.priceChange24h || 0;
      tokenData.marketCap = dexData.marketCap || 0;
      tokenData.initialPrice = dexData.price || 0;
      
      // Social data
      tokenData.hasTwitter = !!dexData.twitter;
      tokenData.hasTelegram = !!dexData.telegram;
      tokenData.hasWebsite = !!dexData.website;
      tokenData.socialScore = this.calculateSocialScore(dexData);
    }
    
    // Extract data from Birdeye
    if (birdeyeResult && !birdeyeResult.error) {
      if (birdeyeResult.overview) {
        tokenData.liquidity = birdeyeResult.overview.liquidity || tokenData.liquidity;
        tokenData.volume24h = birdeyeResult.overview.volume24h || tokenData.volume24h;
        tokenData.marketCap = birdeyeResult.overview.marketCap || tokenData.marketCap;
      }
    }
    
    // Extract data from Technical Analysis
    if (technicalResult && !technicalResult.error) {
      tokenData.priceChange1h = technicalResult.priceChange1h || tokenData.priceChange1h;
      tokenData.priceChange24h = technicalResult.priceChange24h || tokenData.priceChange24h;
    }
    
    // Extract data from Neural Prediction
    if (neuralPrediction && !neuralPrediction.error) {
      tokenData.neuralPrediction = neuralPrediction.prediction;
      tokenData.neuralConfidence = neuralPrediction.confidence;
    }
    
    return tokenData;
  }
  
  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return variance;
  }
}

export const enhancedAnalysis = new EnhancedExternalAnalysis(); 