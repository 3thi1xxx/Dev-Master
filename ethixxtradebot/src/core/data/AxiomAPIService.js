#!/usr/bin/env node
/**
 * Axiom API Service - Integration for discovered api3.axiom.trade endpoints
 * Provides token analysis, holder metrics, trader info, and more
 */

import axios from 'axios';
import { EventEmitter } from 'node:events';

export class AxiomAPIService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      baseURL: 'https://api9.axiom.trade', // Will be auto-detected
      timeout: options.timeout || 5000,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Origin': 'https://axiom.trade',
        'Referer': 'https://axiom.trade/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      // Rate limiting (increased after testing showed we were hitting limits)
      maxRequests: options.maxRequests || 100, // Increased from 30 - still conservative
      windowMs: options.windowMs || 60000, // 1 minute
      // API endpoint detection
      apiEndpoints: ['api9', 'api10', 'api11', 'api12', 'api13', 'api14', 'api15', 'api8', 'api7', 'api6', 'api5', 'api4', 'api3', 'api2', 'api1']
    };
    
    // Create axios instance
    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers
    });
    
    // Request tracking for rate limiting
    this.requestTimes = [];
    
    // Cache for recent requests
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    this.globalTimeout = 3000; // 3 second timeout for all requests
    
    console.log('🚀 AXIOM API SERVICE INITIALIZED');
    console.log(`📡 Base URL: ${this.config.baseURL}`);
    console.log(`⏱️ Rate limit: ${this.config.maxRequests} requests per minute`);
  }
  
  /**
   * Rate limit check
   */
  async checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove old requests
    this.requestTimes = this.requestTimes.filter(time => time > windowStart);
    
    if (this.requestTimes.length >= this.config.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = oldestRequest + this.config.windowMs - now;
      console.log(`[AXIOM-API] ⏳ Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestTimes.push(now);
  }
  
  /**
   * Make API request with caching and rate limiting
   */
  async makeRequest(endpoint, params = {}) {
    // Check cache first
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Rate limit check
    await this.checkRateLimit();
    
    const startTime = Date.now();
    try {
      // Add timeout to prevent hanging requests
      const response = await Promise.race([
        this.axios.get(endpoint, { params }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.globalTimeout)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) {
        console.log(`[AXIOM-API] ⚠️ Slow response: ${endpoint} took ${responseTime}ms`);
      }
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      if (this.cache.size > 100) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        this.cache.delete(entries[0][0]);
      }
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[AXIOM-API] ❌ Error calling ${endpoint} (${responseTime}ms):`, error.message);
      throw error;
    }
  }
  
  /**
   * Get comprehensive analysis with better error handling
   */
  async getComprehensiveAnalysis(tokenAddress, pairAddress = null) {
    console.log(`[AXIOM-API] 🔍 Starting comprehensive analysis for ${tokenAddress}`);
    
    const results = {
      tokenInfo: null,
      pairInfo: null,
      topTraders: null,
      holderAnalysis: null,
      errors: []
    };
    
    // Use Promise.allSettled to continue even if some calls fail
    const promises = [
      this.getTokenInfo(tokenAddress).catch(e => ({ error: e.message, type: 'tokenInfo' })),
      pairAddress ? this.getPairInfo(pairAddress).catch(e => ({ error: e.message, type: 'pairInfo' })) : null,
      this.getTopTraders(tokenAddress).catch(e => ({ error: e.message, type: 'topTraders' })),
      this.getHolderAnalysis(tokenAddress).catch(e => ({ error: e.message, type: 'holderAnalysis' }))
    ].filter(Boolean);
    
    const promiseResults = await Promise.allSettled(promises);
    
    // Process results and collect errors
    promiseResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data && data.error) {
          results.errors.push(`${data.type}: ${data.error}`);
        } else {
          // Map results based on index
          if (index === 0) results.tokenInfo = data;
          else if (index === 1 && pairAddress) results.pairInfo = data;
          else if (index === (pairAddress ? 2 : 1)) results.topTraders = data;
          else if (index === (pairAddress ? 3 : 2)) results.holderAnalysis = data;
        }
      } else {
        results.errors.push(`Promise ${index} rejected: ${result.reason.message}`);
      }
    });
    
    // Log results summary
    const successCount = [results.tokenInfo, results.pairInfo, results.topTraders, results.holderAnalysis]
      .filter(r => r && !r.error).length;
    
    console.log(`[AXIOM-API] ✅ Comprehensive analysis complete: ${successCount}/4 successful`);
    if (results.errors.length > 0) {
      console.log(`[AXIOM-API] ⚠️ Errors encountered:`, results.errors);
    }
    
    return results;
  }

  /**
   * Get token info with better error handling and retries
   */
  async getTokenInfo(tokenAddress) {
    const endpoints = [
      `/token-info/${tokenAddress}`,
      `/v2/token-info/${tokenAddress}`,
      `/api/token/${tokenAddress}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const data = await this.makeRequestWithRetry(endpoint);
        const responseTime = Date.now() - startTime;
        
        console.log(`[AXIOM-API] ✅ Token info retrieved (${responseTime}ms)`);
        return data;
        
      } catch (error) {
        console.log(`[AXIOM-API] ⚠️ ${endpoint} failed: ${error.message}`);
        continue; // Try next endpoint
      }
    }
    
    throw new Error('All token info endpoints failed');
  }

  /**
   * Get pair info with fallbacks
   */
  async getPairInfo(pairAddress) {
    const endpoints = [
      `/pair-info/${pairAddress}`,
      `/v2/pair-info/${pairAddress}`,
      `/api/pair/${pairAddress}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const data = await this.makeRequestWithRetry(endpoint);
        const responseTime = Date.now() - startTime;
        
        console.log(`[AXIOM-API] ✅ Pair info retrieved (${responseTime}ms)`);
        return data;
        
      } catch (error) {
        console.log(`[AXIOM-API] ⚠️ ${endpoint} failed: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('All pair info endpoints failed');
  }

  /**
   * Get top traders with fallbacks
   */
  async getTopTraders(tokenAddress) {
    const endpoints = [
      `/top-traders-v3/${tokenAddress}`,
      `/top-traders/${tokenAddress}`,
      `/api/traders/${tokenAddress}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const data = await this.makeRequestWithRetry(endpoint);
        const responseTime = Date.now() - startTime;
        
        console.log(`[AXIOM-API] ✅ Top traders retrieved (${responseTime}ms)`);
        return data;
        
      } catch (error) {
        console.log(`[AXIOM-API] ⚠️ ${endpoint} failed: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('All top traders endpoints failed');
  }

  /**
   * Make request with retry logic
   */
  async makeRequestWithRetry(endpoint, params = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add exponential backoff for retries
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const data = await this.makeRequest(endpoint, params);
        
        // If we get here, the request succeeded
        this.stats.apiCallsSuccessful++;
        return data;
        
      } catch (error) {
        lastError = error;
        console.log(`[AXIOM-API] ⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        // Don't retry on certain errors
        if (error.message.includes('404') || error.message.includes('401')) {
          break;
        }
      }
    }
    
    this.stats.apiCallsTotal++;
    throw lastError;
  }
  
  /**
   * Get token holder information
   * Provides holder count, bot detection, concentration metrics
   */
  async getTokenInfo(pairAddress) {
    try {
      const data = await this.makeRequest('/token-info', { pairAddress });
      
      // Calculate additional metrics
      const botRatio = data.numBotUsers / data.numHolders;
      const organicHolders = data.numHolders - data.numBotUsers;
      
      return {
        ...data,
        // Enhanced metrics
        botRatio: botRatio,
        organicHolders: organicHolders,
        isHighlyBotted: botRatio > 0.7,
        concentrationRisk: data.top10HoldersPercent > 50 ? 'HIGH' : 
                          data.top10HoldersPercent > 30 ? 'MEDIUM' : 'LOW',
        devRisk: data.devHoldsPercent > 10 ? 'HIGH' :
                 data.devHoldsPercent > 5 ? 'MEDIUM' : 'LOW'
      };
    } catch (error) {
      console.error('[AXIOM-API] Failed to get token info:', error.message);
      return null;
    }
  }
  
  /**
   * Get active traders for a token
   * Returns list of wallet addresses trading the token
   */
  async getActiveTraders(pairAddress, tokenAddress) {
    try {
      // This endpoint requires POST
      await this.checkRateLimit();
      
      const response = await this.axios.post('/transactions-feed-trader-info-v2', {
        pairAddress,
        tokenAddress,
        traders: []
      });
      
      const data = response.data;
      
      return {
        traders: data.traders || [],
        traderCount: (data.traders || []).length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[AXIOM-API] Failed to get active traders:', error.message);
      return { traders: [], traderCount: 0 };
    }
  }
  
  /**
   * Get top traders analysis
   * Provides detailed info on traders including snipers, insiders, profit/loss
   */
  async getTopTraders(pairAddress, onlyTrackedWallets = false) {
    try {
      const data = await this.makeRequest('/top-traders-v3', {
        pairAddress,
        onlyTrackedWallets
      });
      
      // Analyze trader composition
      const traders = data || [];
      const snipers = traders.filter(t => t.isSniper);
      const insiders = traders.filter(t => t.isInsider);
      const profitable = traders.filter(t => (t.usdSold - t.usdInvested) > 0);
      const whales = traders.filter(t => t.usdInvested > 10000);
      
      return {
        traders: traders,
        totalTraders: traders.length,
        sniperCount: snipers.length,
        insiderCount: insiders.length,
        profitableCount: profitable.length,
        whaleCount: whales.length,
        // Calculate average metrics
        avgProfit: traders.length > 0 ? 
          traders.reduce((sum, t) => sum + (t.usdSold - t.usdInvested), 0) / traders.length : 0,
        totalVolume: traders.reduce((sum, t) => sum + t.usdInvested + t.usdSold, 0)
      };
    } catch (error) {
      console.error('[AXIOM-API] Failed to get top traders:', error.message);
      return null;
    }
  }
  
  /**
   * Get creator/developer analysis
   * Provides rug count, risk level, and similar tokens
   */
  async getCreatorAnalysis(devAddress, tokenTicker) {
    try {
      const data = await this.makeRequest('/token-analysis', {
        devAddress,
        tokenTicker
      });
      
      return {
        ...data,
        isHighRisk: data.creatorRugCount > 0 || data.creatorRiskLevel === 'HIGH',
        hasExperience: data.creatorTokenCount > 0,
        similarTokens: {
          byMarketCap: data.topMarketCapCoins || [],
          original: data.topOgCoins || []
        }
      };
    } catch (error) {
      console.error('[AXIOM-API] Failed to get creator analysis:', error.message);
      return null;
    }
  }
  
  /**
   * Get complete pair information
   * Provides token metadata, liquidity, social links, etc.
   */
  async getPairInfo(pairAddress) {
    try {
      const data = await this.makeRequest('/pair-info', { pairAddress });
      
      return {
        ...data,
        // Calculate age
        ageMinutes: data.openTrading ? 
          Math.floor((Date.now() - new Date(data.openTrading).getTime()) / 60000) : 0,
        // Social presence
        hasSocials: !!(data.twitter || data.website || data.discord || data.telegram),
        // Liquidity status
        liquidityUSD: data.initialLiquiditySol * 193.93, // Approximate SOL price
        isRugged: data.lpBurned === 0,
        // Trading status
        isGraduated: data.dexPaid === true
      };
    } catch (error) {
      console.error('[AXIOM-API] Failed to get pair info:', error.message);
      return null;
    }
  }
  
  /**
   * Comprehensive token analysis using all endpoints
   */
  async getComprehensiveAnalysis(tokenAddress, pairAddress, devAddress = null, tokenTicker = null) {
    console.log(`[AXIOM-API] 🔍 Starting comprehensive analysis for ${tokenAddress}`);
    
    try {
      // Parallel API calls for efficiency
      const [tokenInfo, pairInfo, topTraders] = await Promise.all([
        this.getTokenInfo(pairAddress),
        this.getPairInfo(pairAddress),
        this.getTopTraders(pairAddress)
      ]);
      
      // Get creator analysis if we have dev address
      let creatorAnalysis = null;
      if (devAddress && tokenTicker) {
        creatorAnalysis = await this.getCreatorAnalysis(devAddress, tokenTicker);
      } else if (pairInfo?.deployerAddress && pairInfo?.tokenTicker) {
        creatorAnalysis = await this.getCreatorAnalysis(
          pairInfo.deployerAddress, 
          pairInfo.tokenTicker
        );
      }
      
      // Calculate gem score based on realistic criteria
      const gemScore = this.calculateGemScore({
        tokenInfo,
        pairInfo,
        topTraders,
        creatorAnalysis
      });
      
      return {
        tokenAddress,
        pairAddress,
        tokenInfo,
        pairInfo,
        topTraders,
        creatorAnalysis,
        gemScore,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[AXIOM-API] Comprehensive analysis failed:', error.message);
      return null;
    }
  }
  
  /**
   * Calculate gem score based on realistic meme coin criteria
   */
  calculateGemScore(data) {
    const { tokenInfo, pairInfo, topTraders, creatorAnalysis } = data;
    let score = 0;
    const factors = [];
    
    // 1. Holder Growth (most important for memes)
    if (tokenInfo) {
      // Good organic holder ratio (not all bots)
      if (tokenInfo.organicHolders > 10 && tokenInfo.botRatio < 0.9) {
        score += 20;
        factors.push('Good organic holders');
      }
      
      // Rapid holder growth (check age vs holders)
      if (pairInfo?.ageMinutes > 0) {
        const holdersPerMinute = tokenInfo.numHolders / pairInfo.ageMinutes;
        if (holdersPerMinute > 2) {
          score += 15;
          factors.push('Rapid holder growth');
        }
      }
      
      // Not too concentrated
      if (tokenInfo.concentrationRisk !== 'HIGH') {
        score += 10;
        factors.push('Good distribution');
      }
    }
    
    // 2. Trading Activity
    if (topTraders) {
      // Many active traders
      if (topTraders.totalTraders > 20) {
        score += 15;
        factors.push('High trading activity');
      }
      
      // Profitable traders (smart money)
      if (topTraders.profitableCount > topTraders.totalTraders * 0.3) {
        score += 10;
        factors.push('Smart money profitable');
      }
      
      // Some whale interest
      if (topTraders.whaleCount > 0 && topTraders.whaleCount < 5) {
        score += 10;
        factors.push('Whale interest');
      }
    }
    
    // 3. Token Safety
    if (creatorAnalysis) {
      // No previous rugs
      if (creatorAnalysis.creatorRugCount === 0) {
        score += 10;
        factors.push('Clean developer');
      }
      
      // Not first token (some experience)
      if (creatorAnalysis.hasExperience && creatorAnalysis.creatorTokenCount < 10) {
        score += 5;
        factors.push('Experienced dev');
      }
    }
    
    // 4. Liquidity & Setup
    if (pairInfo) {
      // LP burned
      if (pairInfo.lpBurned === 100) {
        score += 5;
        factors.push('LP burned');
      }
      
      // Has socials (community building)
      if (pairInfo.hasSocials) {
        score += 5;
        factors.push('Active socials');
      }
      
      // Not graduated yet (early stage)
      if (!pairInfo.isGraduated && pairInfo.ageMinutes < 60) {
        score += 5;
        factors.push('Early stage opportunity');
      }
    }
    
    return {
      score: Math.min(score, 100),
      factors: factors,
      recommendation: score >= 70 ? 'STRONG BUY' :
                     score >= 50 ? 'BUY' :
                     score >= 30 ? 'WATCH' : 'AVOID'
    };
  }
}

// Export singleton instance
export const axiomAPIService = new AxiomAPIService(); 