/**
 * Warren Buffett Strategy for Meme Coins
 * "Price is what you pay, value is what you get" - adapted for crypto
 */

export class WarrenBuffettStrategy {
  constructor(options = {}) {
    this.config = {
      // Buffett's key metrics adapted for meme coins
      minLiquidityToMcap: 0.05,    // 5% liquidity to market cap ratio
      maxAge: 24 * 60 * 60 * 1000,  // Max 24 hours old (early but not too early)
      minVolume: 10000,             // Minimum daily volume
      maxSlippage: 0.03,            // 3% max slippage - liquidity quality check
      
      // Position management - Buffett style
      maxPositionSize: 0.02,        // Never risk more than 2%
      portfolioConcentration: 0.20, // Max 20% in any single position
      
      // Value metrics
      minROI: 0.25,                 // 25% minimum expected return
      riskRewardRatio: 3,           // 3:1 reward to risk minimum
      
      ...options
    };
    
    console.log('[BUFFETT] 💼 Warren Buffett Strategy initialized');
    console.log('[BUFFETT] 📊 "Buy wonderful companies at fair prices"');
  }
  
  /**
   * Buffett's Circle of Competence applied to meme coins
   */
  evaluateToken(tokenData, marketData) {
    const analysis = {
      intrinsicValue: 0,
      safetyMargin: 0,
      qualityScore: 0,
      recommendation: 'AVOID',
      reasons: []
    };
    
    // 1. UNDERSTAND THE BUSINESS (liquidity = business fundamentals)
    const liquidityHealth = this.assessLiquidityHealth(tokenData, marketData);
    analysis.qualityScore += liquidityHealth.score;
    analysis.reasons.push(...liquidityHealth.reasons);
    
    // 2. LONG-TERM COMPETITIVE ADVANTAGE (volume trends)
    const moat = this.assessCompetitiveMoat(tokenData, marketData);
    analysis.qualityScore += moat.score;
    analysis.reasons.push(...moat.reasons);
    
    // 3. CAPABLE MANAGEMENT (whale activity patterns)
    const management = this.assessManagement(tokenData, marketData);
    analysis.qualityScore += management.score;
    analysis.reasons.push(...management.reasons);
    
    // 4. PREDICTABLE EARNINGS (volume consistency)
    const predictability = this.assessPredictability(tokenData, marketData);
    analysis.qualityScore += predictability.score;
    analysis.reasons.push(...predictability.reasons);
    
    // 5. MARGIN OF SAFETY
    analysis.safetyMargin = this.calculateMarginOfSafety(tokenData, marketData);
    
    // Final recommendation
    if (analysis.qualityScore >= 80 && analysis.safetyMargin > 0.3) {
      analysis.recommendation = 'STRONG_BUY';
    } else if (analysis.qualityScore >= 65 && analysis.safetyMargin > 0.2) {
      analysis.recommendation = 'BUY';
    } else if (analysis.qualityScore >= 50) {
      analysis.recommendation = 'HOLD';
    }
    
    return analysis;
  }
  
  assessLiquidityHealth(tokenData, marketData) {
    let score = 0;
    const reasons = [];
    
    // Liquidity to market cap ratio (Buffett loves strong balance sheets)
    const liquidityRatio = tokenData.liquidity / (tokenData.price * tokenData.totalSupply);
    if (liquidityRatio > this.config.minLiquidityToMcap) {
      score += 25;
      reasons.push(`Strong liquidity ratio: ${(liquidityRatio*100).toFixed(1)}%`);
    }
    
    // Liquidity growth trend
    if (marketData.liquidityGrowth24h > 0.1) {
      score += 15;
      reasons.push('Growing liquidity');
    }
    
    // Depth quality (low slippage = quality)
    if (marketData.estimatedSlippage < this.config.maxSlippage) {
      score += 10;
      reasons.push('Quality market depth');
    }
    
    return { score, reasons };
  }
  
  assessCompetitiveMoat(tokenData, marketData) {
    let score = 0;
    const reasons = [];
    
    // Volume consistency (sustainable advantage)
    const volumeConsistency = this.calculateVolumeConsistency(marketData.volumeHistory);
    if (volumeConsistency > 0.7) {
      score += 20;
      reasons.push('Consistent volume pattern');
    }
    
    // Unique value proposition (meme factor)
    const memeStrength = this.assessMemeStrength(tokenData);
    score += memeStrength.score;
    reasons.push(...memeStrength.reasons);
    
    return { score, reasons };
  }
  
  assessManagement(tokenData, marketData) {
    let score = 0;
    const reasons = [];
    
    // Whale behavior analysis (management quality proxy)
    if (marketData.whaleActivity && marketData.whaleActivity.netFlow > 0) {
      score += 15;
      reasons.push('Smart money accumulating');
    }
    
    // No suspicious activity
    if (!marketData.suspiciousActivity) {
      score += 10;
      reasons.push('Clean activity pattern');
    }
    
    return { score, reasons };
  }
  
  assessPredictability(tokenData, marketData) {
    let score = 0;
    const reasons = [];
    
    // Volume predictability
    const volumeVariance = this.calculateVolumeVariance(marketData.volumeHistory);
    if (volumeVariance < 0.5) {
      score += 15;
      reasons.push('Predictable volume pattern');
    }
    
    // Price stability during volume spikes
    const priceStability = this.assessPriceStability(marketData);
    if (priceStability > 0.6) {
      score += 10;
      reasons.push('Stable price action');
    }
    
    return { score, reasons };
  }
  
  calculateMarginOfSafety(tokenData, marketData) {
    // Intrinsic value based on liquidity and volume metrics
    const intrinsicValue = this.estimateIntrinsicValue(tokenData, marketData);
    const currentPrice = tokenData.price;
    
    const marginOfSafety = (intrinsicValue - currentPrice) / intrinsicValue;
    
    console.log(`[BUFFETT] 💎 ${tokenData.symbol}: Intrinsic Value: $${intrinsicValue.toFixed(8)}, Current: $${currentPrice.toFixed(8)}, Margin: ${(marginOfSafety*100).toFixed(1)}%`);
    
    return Math.max(0, marginOfSafety);
  }
  
  estimateIntrinsicValue(tokenData, marketData) {
    // Buffett-style DCF adapted for meme coins
    // Based on sustainable volume and liquidity metrics
    
    const sustainableVolume = this.calculateSustainableVolume(marketData);
    const liquidityPremium = tokenData.liquidity / 10000; // Liquidity value
    const memeMultiplier = this.getMemeMultiplier(tokenData);
    
    // Simple valuation: (Volume * 0.001) + Liquidity Premium * Meme Factor
    const baseValue = (sustainableVolume * 0.001) + liquidityPremium;
    return baseValue * memeMultiplier;
  }
  
  calculateSustainableVolume(marketData) {
    if (!marketData.volumeHistory || marketData.volumeHistory.length < 3) {
      return marketData.volume24h || 0;
    }
    
    // Take lower quartile as sustainable level
    const sortedVolumes = [...marketData.volumeHistory].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedVolumes.length * 0.25);
    return sortedVolumes[q1Index] || 0;
  }
  
  getMemeMultiplier(tokenData) {
    let multiplier = 1.0;
    
    // Name/symbol quality
    if (tokenData.symbol.length <= 5 && /^[A-Z]+$/.test(tokenData.symbol)) {
      multiplier += 0.2;
    }
    
    // Recognizable meme patterns
    const memeWords = ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF'];
    if (memeWords.some(word => tokenData.symbol.includes(word))) {
      multiplier += 0.5;
    }
    
    return Math.min(multiplier, 2.0); // Cap at 2x
  }
  
  calculateVolumeConsistency(volumeHistory) {
    if (!volumeHistory || volumeHistory.length < 5) return 0;
    
    const avg = volumeHistory.reduce((sum, vol) => sum + vol, 0) / volumeHistory.length;
    const variance = volumeHistory.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumeHistory.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - (stdDev / avg));
  }
  
  calculateVolumeVariance(volumeHistory) {
    if (!volumeHistory || volumeHistory.length < 3) return 1;
    
    const avg = volumeHistory.reduce((sum, vol) => sum + vol, 0) / volumeHistory.length;
    const variance = volumeHistory.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumeHistory.length;
    
    return variance / (avg * avg); // Coefficient of variation
  }
  
  assessPriceStability(marketData) {
    if (!marketData.priceHistory || !marketData.volumeHistory) return 0;
    
    // Measure price stability during volume spikes
    let stabilityScore = 0;
    for (let i = 1; i < marketData.volumeHistory.length; i++) {
      const volumeIncrease = marketData.volumeHistory[i] / marketData.volumeHistory[i-1];
      const priceChange = Math.abs(marketData.priceHistory[i] / marketData.priceHistory[i-1] - 1);
      
      if (volumeIncrease > 2 && priceChange < 0.1) { // High volume, stable price
        stabilityScore += 0.2;
      }
    }
    
    return Math.min(stabilityScore, 1.0);
  }
  
  assessMemeStrength(tokenData) {
    let score = 0;
    const reasons = [];
    
    // Symbol quality
    if (tokenData.symbol.length <= 6) {
      score += 5;
      reasons.push('Memorable symbol');
    }
    
    // Meme recognition
    const strongMemes = ['PEPE', 'DOGE', 'SHIB'];
    const moderateMemes = ['BONK', 'WIF', 'FLOKI'];
    
    if (strongMemes.some(meme => tokenData.symbol.includes(meme))) {
      score += 15;
      reasons.push('Strong meme brand');
    } else if (moderateMemes.some(meme => tokenData.symbol.includes(meme))) {
      score += 10;
      reasons.push('Moderate meme appeal');
    }
    
    return { score, reasons };
  }
  
  /**
   * Position sizing - Buffett's concentrated portfolio approach
   */
  calculatePositionSize(analysis, portfolioValue, existingPositions) {
    if (analysis.recommendation === 'AVOID') return 0;
    
    // Base position size on conviction (quality score)
    let baseSize = (analysis.qualityScore / 100) * this.config.maxPositionSize;
    
    // Adjust for margin of safety
    baseSize *= (1 + analysis.safetyMargin);
    
    // Portfolio concentration limits
    const currentConcentration = this.calculateConcentration(existingPositions);
    if (currentConcentration + baseSize > this.config.portfolioConcentration) {
      baseSize = Math.max(0, this.config.portfolioConcentration - currentConcentration);
    }
    
    return Math.min(baseSize, this.config.maxPositionSize);
  }
  
  calculateConcentration(existingPositions) {
    return existingPositions.reduce((sum, pos) => sum + pos.size, 0);
  }
  
  /**
   * Buffett's long-term holding criteria
   */
  shouldHold(position, currentAnalysis, marketConditions) {
    // Don't sell quality companies in temporary downturns
    if (currentAnalysis.qualityScore >= 70 && marketConditions.temporaryDecline) {
      return { hold: true, reason: 'Quality company, temporary decline' };
    }
    
    // Sell if fundamentals deteriorate
    if (currentAnalysis.qualityScore < 40) {
      return { hold: false, reason: 'Fundamental deterioration' };
    }
    
    // Sell if no margin of safety remains
    if (currentAnalysis.safetyMargin < 0.1) {
      return { hold: false, reason: 'No safety margin' };
    }
    
    return { hold: true, reason: 'Maintain quality holding' };
  }
}

export const buffettStrategy = new WarrenBuffettStrategy(); 