/**
 * Smart API Optimizer - Reduce API calls to stay within CU limits
 * Premium Plus: 50 RPS, 15M CUs/month
 */

export class SmartApiOptimizer {
  constructor() {
    // Cache configuration - longer TTLs to reduce API calls
    this.cacheConfig = {
      tokenSecurity: 3600000,    // 1 hour (rarely changes)
      tokenOverview: 600000,     // 10 minutes (price/volume data)
      trending: 300000,          // 5 minutes
      newListings: 60000,        // 1 minute
      walletActivity: 120000     // 2 minutes
    };
    
    // API call tracking
    this.apiStats = {
      callsThisMinute: 0,
      callsThisHour: 0,
      callsToday: 0,
      cusUsed: 0,
      resetTime: Date.now() + 60000
    };
    
    // Token quality filters - only analyze promising tokens
    this.qualityFilters = {
      minLiquidity: 50,          // Minimum 50 SOL liquidity
      minHolders: 50,            // Minimum 50 holders
      minVolume24h: 1000,        // Minimum $1000 24h volume
      maxAge: 604800000,         // Max 7 days old
      skipKnownScams: true       // Skip tokens flagged as scams
    };
    
    // Batch processing
    this.batchQueue = [];
    this.batchTimer = null;
    this.maxBatchSize = 10;
    this.batchDelay = 2000; // 2 seconds
    
    console.log('🎯 Smart API Optimizer initialized');
    console.log('💰 Monthly CU budget: 15M');
    console.log('⚡ Rate limit: 50 RPS');
  }
  
  /**
   * Should we make this API call?
   */
  shouldMakeCall(tokenAddress, callType) {
    // Check if we've already analyzed this recently
    const cacheKey = `${tokenAddress}:${callType}`;
    const lastCall = this.getFromCache(cacheKey);
    
    if (lastCall) {
      const age = Date.now() - lastCall.timestamp;
      const ttl = this.cacheConfig[callType] || 300000;
      
      if (age < ttl) {
        console.log(`[OPTIMIZER] ✅ Using cached data for ${tokenAddress} (${callType})`);
        return false;
      }
    }
    
    // Check rate limits
    if (this.apiStats.callsThisMinute >= 50) {
      console.log('[OPTIMIZER] ⚠️ Rate limit reached, waiting...');
      return false;
    }
    
    return true;
  }
  
  /**
   * Track API call
   */
  trackCall(cusUsed = 1) {
    this.apiStats.callsThisMinute++;
    this.apiStats.callsThisHour++;
    this.apiStats.callsToday++;
    this.apiStats.cusUsed += cusUsed;
    
    // Reset counters
    if (Date.now() > this.apiStats.resetTime) {
      this.apiStats.callsThisMinute = 0;
      this.apiStats.resetTime = Date.now() + 60000;
    }
    
    // Log daily usage
    if (this.apiStats.callsToday % 1000 === 0) {
      const dailyBudget = 500000; // ~15M / 30 days
      const percentUsed = (this.apiStats.cusUsed / dailyBudget * 100).toFixed(2);
      console.log(`[OPTIMIZER] 📊 Daily CU usage: ${this.apiStats.cusUsed}/${dailyBudget} (${percentUsed}%)`);
    }
  }
  
  /**
   * Pre-filter tokens before API calls
   */
  shouldAnalyzeToken(tokenData) {
    // Skip if no basic data
    if (!tokenData.liquiditySol || !tokenData.holders) {
      return false;
    }
    
    // Apply quality filters
    if (tokenData.liquiditySol < this.qualityFilters.minLiquidity) {
      console.log(`[OPTIMIZER] ⚠️ Skipping ${tokenData.ticker}: Low liquidity (${tokenData.liquiditySol} SOL)`);
      return false;
    }
    
    if (tokenData.holders < this.qualityFilters.minHolders) {
      console.log(`[OPTIMIZER] ⚠️ Skipping ${tokenData.ticker}: Too few holders (${tokenData.holders})`);
      return false;
    }
    
    // Skip if dev holds too much
    if (tokenData.devHoldsPercent > 30) {
      console.log(`[OPTIMIZER] ⚠️ Skipping ${tokenData.ticker}: High dev holdings (${tokenData.devHoldsPercent}%)`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Batch API calls for efficiency
   */
  addToBatch(tokenAddress, callback) {
    this.batchQueue.push({ tokenAddress, callback });
    
    if (this.batchQueue.length >= this.maxBatchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }
  
  processBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    console.log(`[OPTIMIZER] 📦 Processing batch of ${batch.length} tokens`);
    
    // Process batch with rate limiting
    batch.forEach((item, index) => {
      setTimeout(() => {
        item.callback(item.tokenAddress);
      }, index * 20); // 20ms between calls = 50 RPS max
    });
    
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
  }
  
  // Simple cache implementation
  cache = new Map();
  
  getFromCache(key) {
    return this.cache.get(key);
  }
  
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Cleanup old entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Get remaining CUs for the month
   */
  getRemainingBudget() {
    const monthlyLimit = 15000000; // 15M CUs
    const daysInMonth = 30;
    const dayOfMonth = new Date().getDate();
    const dailyBudget = monthlyLimit / daysInMonth;
    const expectedUsage = dailyBudget * dayOfMonth;
    const remaining = monthlyLimit - this.apiStats.cusUsed;
    
    return {
      remaining,
      dailyBudget,
      percentUsed: (this.apiStats.cusUsed / monthlyLimit * 100).toFixed(2),
      onTrack: this.apiStats.cusUsed <= expectedUsage
    };
  }
}

export const apiOptimizer = new SmartApiOptimizer();
export default apiOptimizer; 