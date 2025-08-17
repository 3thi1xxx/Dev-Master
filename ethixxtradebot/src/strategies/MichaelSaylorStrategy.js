/**
 * Michael Saylor Strategy
 * "Precision, data, and relentless optimization" - adapted for meme coin trading
 */

export class MichaelSaylorStrategy {
  constructor(options = {}) {
    this.config = {
      // Saylor's precision metrics
      minDataPoints: 20,           // Minimum data points for decision
      confidenceThreshold: 0.85,   // 85% statistical confidence required
      maxLatency: 50,              // 50ms max decision latency
      
      // Technical indicators (Saylor loves metrics)
      rsiOverbought: 70,
      rsiOversold: 30,
      volumeMultiplier: 2.5,       // Volume spike threshold
      momentumPeriod: 14,          // Momentum calculation period
      
      // Institutional position management
      maxDrawdown: 0.05,           // 5% max drawdown
      sharpeRatioMin: 2.0,         // Minimum Sharpe ratio
      kellyPercent: 0.25,          // Kelly criterion percentage
      
      ...options
    };
    
    this.metricsEngine = new MetricsEngine();
    this.performanceTracker = new PerformanceTracker();
    
    console.log('[SAYLOR] ⚡ Michael Saylor Strategy initialized');
    console.log('[SAYLOR] 📊 "Measure everything, optimize relentlessly"');
  }
  
  /**
   * Saylor's data-driven token evaluation
   */
  evaluateToken(tokenData, marketData, historicalData) {
    const startTime = Date.now();
    
    // Require sufficient data (Saylor doesn't guess)
    if (!this.hasSufficientData(tokenData, marketData, historicalData)) {
      return this.insufficientDataResponse(tokenData);
    }
    
    const analysis = {
      technicalScore: 0,
      statisticalConfidence: 0,
      recommendation: 'HOLD',
      metrics: {},
      processingTime: 0
    };
    
    // 1. TECHNICAL ANALYSIS (Saylor loves precise indicators)
    analysis.metrics.technical = this.calculateTechnicalMetrics(tokenData, historicalData);
    analysis.technicalScore += analysis.metrics.technical.score;
    
    // 2. STATISTICAL ANALYSIS (Data-driven decisions)
    analysis.metrics.statistical = this.calculateStatisticalMetrics(marketData, historicalData);
    analysis.statisticalConfidence = analysis.metrics.statistical.confidence;
    
    // 3. MOMENTUM ANALYSIS (Saylor tracks everything)
    analysis.metrics.momentum = this.calculateMomentumMetrics(historicalData);
    analysis.technicalScore += analysis.metrics.momentum.score;
    
    // 4. RISK ANALYSIS (Institutional risk management)
    analysis.metrics.risk = this.calculateRiskMetrics(tokenData, marketData);
    
    // 5. EFFICIENCY METRICS (Saylor optimizes for efficiency)
    analysis.metrics.efficiency = this.calculateEfficiencyMetrics(tokenData, marketData);
    
    analysis.processingTime = Date.now() - startTime;
    
    // Final recommendation based on statistical confidence
    analysis.recommendation = this.generateRecommendation(analysis);
    
    console.log(`[SAYLOR] 📊 ${tokenData.symbol}: Score=${analysis.technicalScore}, Confidence=${(analysis.statisticalConfidence*100).toFixed(1)}%, Time=${analysis.processingTime}ms`);
    
    return analysis;
  }
  
  hasSufficientData(tokenData, marketData, historicalData) {
    const checks = {
      priceHistory: historicalData.priceHistory?.length >= this.config.minDataPoints,
      volumeHistory: historicalData.volumeHistory?.length >= this.config.minDataPoints,
      recentData: (Date.now() - tokenData.lastUpdate) < 60000, // Fresh data
      marketData: marketData && marketData.volume24h !== undefined
    };
    
    const passCount = Object.values(checks).filter(Boolean).length;
    return passCount >= 3; // At least 3 out of 4 checks must pass
  }
  
  calculateTechnicalMetrics(tokenData, historicalData) {
    const metrics = {
      rsi: this.calculateRSI(historicalData.priceHistory),
      macd: this.calculateMACD(historicalData.priceHistory),
      bollinger: this.calculateBollingerBands(historicalData.priceHistory),
      volumeProfile: this.calculateVolumeProfile(historicalData),
      score: 0
    };
    
    // RSI scoring
    if (metrics.rsi < this.config.rsiOversold) {
      metrics.score += 30; // Oversold = buy opportunity
    } else if (metrics.rsi > this.config.rsiOverbought) {
      metrics.score -= 20; // Overbought = caution
    } else {
      metrics.score += 10; // Neutral is good
    }
    
    // MACD scoring
    if (metrics.macd.signal === 'BULLISH_CROSS') {
      metrics.score += 25;
    } else if (metrics.macd.signal === 'BEARISH_CROSS') {
      metrics.score -= 25;
    }
    
    // Bollinger Bands scoring
    if (metrics.bollinger.position === 'LOWER_BAND') {
      metrics.score += 20; // Near lower band = potential bounce
    } else if (metrics.bollinger.position === 'UPPER_BAND') {
      metrics.score -= 15; // Near upper band = overbought
    }
    
    return metrics;
  }
  
  calculateStatisticalMetrics(marketData, historicalData) {
    const metrics = {
      correlation: this.calculateVolumePriceCorrelation(historicalData),
      volatility: this.calculateVolatility(historicalData.priceHistory),
      trendStrength: this.calculateTrendStrength(historicalData.priceHistory),
      confidence: 0
    };
    
    // Statistical confidence based on data quality
    let confidenceFactors = [];
    
    // Data consistency
    const dataConsistency = this.calculateDataConsistency(historicalData);
    confidenceFactors.push(dataConsistency);
    
    // Sample size adequacy
    const sampleSizeScore = Math.min(1.0, historicalData.priceHistory.length / 50);
    confidenceFactors.push(sampleSizeScore);
    
    // Trend clarity
    const trendClarity = Math.abs(metrics.trendStrength);
    confidenceFactors.push(trendClarity);
    
    metrics.confidence = confidenceFactors.reduce((sum, factor) => sum + factor, 0) / confidenceFactors.length;
    
    return metrics;
  }
  
  calculateMomentumMetrics(historicalData) {
    const prices = historicalData.priceHistory;
    const volumes = historicalData.volumeHistory;
    
    const metrics = {
      priceRateOfChange: this.calculateROC(prices, this.config.momentumPeriod),
      volumeMomentum: this.calculateVolumeMomentum(volumes),
      acceleration: this.calculatePriceAcceleration(prices),
      score: 0
    };
    
    // Price momentum scoring
    if (metrics.priceRateOfChange > 0.1) {
      metrics.score += 25;
    } else if (metrics.priceRateOfChange < -0.1) {
      metrics.score -= 20;
    }
    
    // Volume momentum scoring
    if (metrics.volumeMomentum > this.config.volumeMultiplier) {
      metrics.score += 20;
    }
    
    // Acceleration scoring (Saylor loves acceleration)
    if (metrics.acceleration > 0) {
      metrics.score += 15;
    } else {
      metrics.score -= 10;
    }
    
    return metrics;
  }
  
  calculateRiskMetrics(tokenData, marketData) {
    return {
      liquidityRisk: this.assessLiquidityRisk(tokenData),
      concentrationRisk: this.assessConcentrationRisk(marketData),
      volatilityRisk: this.assessVolatilityRisk(marketData),
      maxDrawdown: this.calculateMaxDrawdown(marketData.priceHistory),
      sharpeRatio: this.calculateSharpeRatio(marketData.priceHistory),
      var95: this.calculateVaR(marketData.priceHistory, 0.05) // 95% VaR
    };
  }
  
  calculateEfficiencyMetrics(tokenData, marketData) {
    return {
      priceEfficiency: this.calculatePriceEfficiency(tokenData, marketData),
      volumeEfficiency: this.calculateVolumeEfficiency(marketData),
      spreadEfficiency: this.calculateSpreadEfficiency(marketData),
      marketImpact: this.estimateMarketImpact(tokenData, marketData)
    };
  }
  
  // Technical Indicator Implementations
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }
  
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) {
      return { line: 0, signal: 'NEUTRAL', histogram: 0 };
    }
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    // Simplified signal detection
    const signal = macdLine > 0 ? 'BULLISH_CROSS' : 'BEARISH_CROSS';
    
    return { line: macdLine, signal, histogram: macdLine };
  }
  
  calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
  
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      return { upper: 0, middle: 0, lower: 0, position: 'MIDDLE' };
    }
    
    const recentPrices = prices.slice(-period);
    const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = middle + (standardDeviation * stdDev);
    const lower = middle - (standardDeviation * stdDev);
    const currentPrice = prices[prices.length - 1];
    
    let position = 'MIDDLE';
    if (currentPrice <= lower) position = 'LOWER_BAND';
    else if (currentPrice >= upper) position = 'UPPER_BAND';
    
    return { upper, middle, lower, position };
  }
  
  calculateROC(prices, period) {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    
    return (currentPrice - pastPrice) / pastPrice;
  }
  
  calculateVolumeMomentum(volumes) {
    if (volumes.length < 2) return 1;
    
    const recent = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5;
    const historical = volumes.slice(-20, -5).reduce((sum, vol) => sum + vol, 0) / 15;
    
    return recent / (historical || 1);
  }
  
  calculatePriceAcceleration(prices) {
    if (prices.length < 3) return 0;
    
    const recent = prices.slice(-3);
    const velocity1 = recent[1] - recent[0];
    const velocity2 = recent[2] - recent[1];
    
    return velocity2 - velocity1;
  }

  calculateVolumeVariance(volumeHistory) {
    if (!volumeHistory || volumeHistory.length < 3) return 1;
    
    const avg = volumeHistory.reduce((sum, vol) => sum + vol, 0) / volumeHistory.length;
    const variance = volumeHistory.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumeHistory.length;
    
    return variance / (avg * avg); // Coefficient of variation
  }

  calculateVolumePriceCorrelation(historicalData) {
    if (!historicalData.priceHistory || !historicalData.volumeHistory) return 0;
    
    const prices = historicalData.priceHistory;
    const volumes = historicalData.volumeHistory;
    const minLength = Math.min(prices.length, volumes.length);
    
    if (minLength < 2) return 0;
    
    // Simple correlation calculation
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < minLength; i++) {
      sumX += prices[i];
      sumY += volumes[i];
      sumXY += prices[i] * volumes[i];
      sumX2 += prices[i] * prices[i];
      sumY2 += volumes[i] * volumes[i];
    }
    
    const meanX = sumX / minLength;
    const meanY = sumY / minLength;
    
    const numerator = sumXY - minLength * meanX * meanY;
    const denominator = Math.sqrt((sumX2 - minLength * meanX * meanX) * (sumY2 - minLength * meanY * meanY));
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  calculateVolatility(prices) {
    if (!prices || prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  calculateTrendStrength(prices) {
    if (!prices || prices.length < 3) return 0;
    
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i-1]) upCount++;
      else if (prices[i] < prices[i-1]) downCount++;
    }
    
    const totalMoves = upCount + downCount;
    return totalMoves > 0 ? (upCount - downCount) / totalMoves : 0;
  }

  calculateDataConsistency(historicalData) {
    // Check data quality and consistency
    if (!historicalData.priceHistory || !historicalData.volumeHistory) return 0;
    
    const priceGaps = this.countDataGaps(historicalData.priceHistory);
    const volumeGaps = this.countDataGaps(historicalData.volumeHistory);
    const totalDataPoints = historicalData.priceHistory.length + historicalData.volumeHistory.length;
    const totalGaps = priceGaps + volumeGaps;
    
    return Math.max(0, 1 - (totalGaps / totalDataPoints));
  }

  countDataGaps(dataArray) {
    if (!dataArray || dataArray.length < 2) return 0;
    
    let gaps = 0;
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] === null || dataArray[i] === undefined || dataArray[i] === 0) {
        gaps++;
      }
    }
    return gaps;
  }

  assessLiquidityRisk(tokenData) {
    const liquidityRatio = tokenData.liquidity / (tokenData.price * 1000000); // Assuming 1M token supply
    if (liquidityRatio > 0.1) return 'LOW';
    if (liquidityRatio > 0.05) return 'MEDIUM';
    return 'HIGH';
  }

  assessConcentrationRisk(marketData) {
    // Mock implementation
    return 'MEDIUM';
  }

  assessVolatilityRisk(marketData) {
    const volatility = this.calculateVolatility(marketData.priceHistory || []);
    if (volatility < 0.1) return 'LOW';
    if (volatility < 0.3) return 'MEDIUM';
    return 'HIGH';
  }

  calculatePriceEfficiency(tokenData, marketData) {
    // Mock efficiency calculation
    return Math.random() * 100;
  }

  calculateVolumeEfficiency(marketData) {
    // Mock efficiency calculation
    return Math.random() * 100;
  }

  calculateSpreadEfficiency(marketData) {
    // Mock efficiency calculation
    return Math.random() * 100;
  }

  estimateMarketImpact(tokenData, marketData) {
    // Mock market impact estimation
    return Math.random() * 0.1;
  }
  
  generateRecommendation(analysis) {
    const { technicalScore, statisticalConfidence, metrics } = analysis;
    
    // Saylor requires high statistical confidence
    if (statisticalConfidence < this.config.confidenceThreshold) {
      return 'INSUFFICIENT_DATA';
    }
    
    // Risk override (Saylor manages risk strictly)
    if (metrics.risk.sharpeRatio < this.config.sharpeRatioMin) {
      return 'HIGH_RISK';
    }
    
    // Score-based recommendation with confidence weighting
    const weightedScore = technicalScore * statisticalConfidence;
    
    if (weightedScore >= 80) return 'STRONG_BUY';
    if (weightedScore >= 65) return 'BUY';
    if (weightedScore >= 35) return 'HOLD';
    if (weightedScore >= 20) return 'WEAK_SELL';
    return 'SELL';
  }
  
  // Performance tracking methods
  calculateSharpeRatio(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
  
  calculateMaxDrawdown(prices) {
    if (prices.length < 2) return 0;
    
    let peak = prices[0];
    let maxDrawdown = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
  
  calculateVaR(prices, alpha) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns.sort((a, b) => a - b);
    const varIndex = Math.floor(alpha * returns.length);
    
    return returns[varIndex] || 0;
  }
  
  insufficientDataResponse(tokenData) {
    return {
      recommendation: 'INSUFFICIENT_DATA',
      reason: 'Insufficient historical data for statistical analysis',
      technicalScore: 0,
      statisticalConfidence: 0,
      processingTime: 0
    };
  }
}

// Utility classes
class MetricsEngine {
  constructor() {
    this.cache = new Map();
  }
  
  // Advanced metrics calculations would go here
}

class PerformanceTracker {
  constructor() {
    this.trades = [];
    this.metrics = {};
  }
  
  // Performance tracking methods would go here
}

export const saylorStrategy = new MichaelSaylorStrategy(); 