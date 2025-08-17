#!/usr/bin/env node
/**
 * Advanced Technical Analysis Engine
 * Using real technical indicators library for proper calculations
 * RSI, MACD, Bollinger Bands, SMA, EMA, Stochastic, etc.
 */

import { 
  RSI, 
  MACD, 
  BollingerBands, 
  SMA, 
  EMA, 
  Stochastic, 
  OBV, 
  ADX,
  CCI,
  WilliamsR,
  MFI,
  VWAP
} from 'technicalindicators';

export class AdvancedTechnicalAnalysis {
  constructor(options = {}) {
    this.config = {
      rsiPeriod: options.rsiPeriod || 14,
      macdFast: options.macdFast || 12,
      macdSlow: options.macdSlow || 26,
      macdSignal: options.macdSignal || 9,
      bbPeriod: options.bbPeriod || 20,
      bbStdDev: options.bbStdDev || 2,
      smaPeriod: options.smaPeriod || 20,
      emaPeriod: options.emaPeriod || 12,
      stochKPeriod: options.stochKPeriod || 14,
      stochDPeriod: options.stochDPeriod || 3,
      adxPeriod: options.adxPeriod || 14,
      minDataPoints: options.minDataPoints || 30 // Minimum data points for analysis
    };
    
    console.log('📈 ADVANCED TECHNICAL ANALYSIS ENGINE INITIALIZED');
    console.log('🔧 Real indicators: RSI, MACD, Bollinger Bands, Stochastic, ADX, etc.');
  }
  
  /**
   * Comprehensive technical analysis of price data
   */
  async analyzeToken(priceData, volumeData = []) {
    if (!priceData || priceData.length < this.config.minDataPoints) {
      return {
        error: `Insufficient data: Need at least ${this.config.minDataPoints} price points, got ${priceData.length}`,
        hasEnoughData: false
      };
    }
    
    console.log(`[TA] 📊 Analyzing ${priceData.length} price points with ${volumeData.length} volume points`);
    
    const analysis = {
      momentum: await this.calculateMomentumIndicators(priceData, volumeData),
      trend: await this.calculateTrendIndicators(priceData),
      volatility: await this.calculateVolatilityIndicators(priceData),
      volume: await this.calculateVolumeIndicators(priceData, volumeData),
      oscillators: await this.calculateOscillators(priceData, volumeData),
      signals: {},
      scores: {},
      summary: {}
    };
    
    // Generate trading signals
    analysis.signals = this.generateTradingSignals(analysis);
    
    // Calculate component scores
    analysis.scores = this.calculateScores(analysis);
    
    // Generate summary
    analysis.summary = this.generateSummary(analysis);
    
    console.log(`[TA] ✅ Technical analysis complete - Overall score: ${analysis.scores.overall}/100`);
    
    return analysis;
  }
  
  /**
   * Calculate momentum indicators (RSI, Stochastic, Williams %R, etc.)
   */
  async calculateMomentumIndicators(priceData, volumeData = []) {
    const high = priceData.map(p => typeof p === 'object' ? p.high : p * 1.01);
    const low = priceData.map(p => typeof p === 'object' ? p.low : p * 0.99);
    const close = priceData.map(p => typeof p === 'object' ? p.close : p);
    const volume = volumeData.length > 0 ? volumeData : close.map(() => 1000000);
    
    try {
      const rsi = RSI.calculate({ values: close, period: this.config.rsiPeriod });
      const stochastic = Stochastic.calculate({
        high: high,
        low: low,
        close: close,
        kPeriod: this.config.stochKPeriod,
        dPeriod: this.config.stochDPeriod
      });
      
      const williamsR = WilliamsR.calculate({
        high: high,
        low: low,
        close: close,
        period: 14
      });
      
      const mfi = volume.length >= close.length ? MFI.calculate({
        high: high,
        low: low,
        close: close,
        volume: volume,
        period: 14
      }) : [];
      
      return {
        rsi: {
          current: rsi[rsi.length - 1] || 50,
          previous: rsi[rsi.length - 2] || 50,
          values: rsi.slice(-10), // Last 10 values
          overbought: rsi[rsi.length - 1] > 70,
          oversold: rsi[rsi.length - 1] < 30,
          signal: this.getRSISignal(rsi[rsi.length - 1])
        },
        stochastic: {
          current: stochastic.length > 0 ? stochastic[stochastic.length - 1] : { k: 50, d: 50 },
          signal: this.getStochasticSignal(stochastic),
          overbought: stochastic.length > 0 && stochastic[stochastic.length - 1].k > 80,
          oversold: stochastic.length > 0 && stochastic[stochastic.length - 1].k < 20
        },
        williamsR: {
          current: williamsR[williamsR.length - 1] || -50,
          signal: this.getWilliamsRSignal(williamsR[williamsR.length - 1]),
          overbought: williamsR[williamsR.length - 1] > -20,
          oversold: williamsR[williamsR.length - 1] < -80
        },
        mfi: {
          current: mfi.length > 0 ? mfi[mfi.length - 1] : 50,
          signal: mfi.length > 0 ? this.getMFISignal(mfi[mfi.length - 1]) : 'NEUTRAL',
          overbought: mfi.length > 0 && mfi[mfi.length - 1] > 80,
          oversold: mfi.length > 0 && mfi[mfi.length - 1] < 20
        }
      };
    } catch (error) {
      console.log(`[TA] ⚠️ Momentum calculation error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Calculate trend indicators (SMA, EMA, MACD, ADX)
   */
  async calculateTrendIndicators(priceData) {
    const close = priceData.map(p => typeof p === 'object' ? p.close : p);
    const high = priceData.map(p => typeof p === 'object' ? p.high : p * 1.01);
    const low = priceData.map(p => typeof p === 'object' ? p.low : p * 0.99);
    
    try {
      const sma20 = SMA.calculate({ period: this.config.smaPeriod, values: close });
      const ema12 = EMA.calculate({ period: this.config.emaPeriod, values: close });
      const ema26 = EMA.calculate({ period: 26, values: close });
      
      const macd = MACD.calculate({
        values: close,
        fastPeriod: this.config.macdFast,
        slowPeriod: this.config.macdSlow,
        signalPeriod: this.config.macdSignal,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      
      const adx = ADX.calculate({
        high: high,
        low: low,
        close: close,
        period: this.config.adxPeriod
      });
      
      const currentPrice = close[close.length - 1];
      const sma20Current = sma20[sma20.length - 1];
      const ema12Current = ema12[ema12.length - 1];
      
      return {
        sma20: {
          current: sma20Current,
          signal: currentPrice > sma20Current ? 'BULLISH' : 'BEARISH',
          values: sma20.slice(-10)
        },
        ema12: {
          current: ema12Current,
          signal: currentPrice > ema12Current ? 'BULLISH' : 'BEARISH',
          crossover: this.detectEMACrossover(ema12, ema26),
          values: ema12.slice(-10)
        },
        macd: {
          current: macd.length > 0 ? macd[macd.length - 1] : { MACD: 0, signal: 0, histogram: 0 },
          signal: this.getMACDSignal(macd),
          bullishDivergence: this.detectMACDDivergence(macd, close),
          values: macd.slice(-10)
        },
        adx: {
          current: adx[adx.length - 1] || 25,
          signal: this.getADXSignal(adx[adx.length - 1]),
          trending: adx[adx.length - 1] > 25,
          strongTrend: adx[adx.length - 1] > 50
        }
      };
    } catch (error) {
      console.log(`[TA] ⚠️ Trend calculation error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Calculate volatility indicators (Bollinger Bands, ATR)
   */
  async calculateVolatilityIndicators(priceData) {
    const close = priceData.map(p => typeof p === 'object' ? p.close : p);
    const high = priceData.map(p => typeof p === 'object' ? p.high : p * 1.01);
    const low = priceData.map(p => typeof p === 'object' ? p.low : p * 0.99);
    
    try {
      const bb = BollingerBands.calculate({
        period: this.config.bbPeriod,
        values: close,
        stdDev: this.config.bbStdDev
      });
      
      const currentPrice = close[close.length - 1];
      const currentBB = bb[bb.length - 1];
      
      return {
        bollingerBands: {
          current: currentBB,
          position: this.getBBPosition(currentPrice, currentBB),
          signal: this.getBBSignal(currentPrice, currentBB),
          squeeze: this.detectBBSqueeze(bb),
          expansion: this.detectBBExpansion(bb)
        },
        volatility: {
          current: this.calculateCurrentVolatility(close),
          signal: this.getVolatilitySignal(close),
          increasing: this.isVolatilityIncreasing(close)
        }
      };
    } catch (error) {
      console.log(`[TA] ⚠️ Volatility calculation error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Calculate volume indicators (OBV, VWAP, etc.)
   */
  async calculateVolumeIndicators(priceData, volumeData) {
    if (volumeData.length === 0) {
      return { 
        obv: { signal: 'NO_DATA' },
        vwap: { signal: 'NO_DATA' },
        volumeTrend: 'UNKNOWN'
      };
    }
    
    const close = priceData.map(p => typeof p === 'object' ? p.close : p);
    const volume = volumeData;
    
    try {
      const obv = OBV.calculate({ close: close, volume: volume });
      
      return {
        obv: {
          current: obv[obv.length - 1],
          signal: this.getOBVSignal(obv),
          trend: this.getOBVTrend(obv),
          values: obv.slice(-10)
        },
        volumeTrend: this.getVolumeTrend(volume),
        volumeSpike: this.detectVolumeSpike(volume),
        averageVolume: this.calculateAverageVolume(volume)
      };
    } catch (error) {
      console.log(`[TA] ⚠️ Volume calculation error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Calculate oscillator indicators
   */
  async calculateOscillators(priceData, volumeData) {
    const close = priceData.map(p => typeof p === 'object' ? p.close : p);
    const high = priceData.map(p => typeof p === 'object' ? p.high : p * 1.01);
    const low = priceData.map(p => typeof p === 'object' ? p.low : p * 0.99);
    
    try {
      const cci = CCI.calculate({
        high: high,
        low: low,
        close: close,
        period: 20
      });
      
      return {
        cci: {
          current: cci[cci.length - 1] || 0,
          signal: this.getCCISignal(cci[cci.length - 1]),
          overbought: cci[cci.length - 1] > 100,
          oversold: cci[cci.length - 1] < -100
        }
      };
    } catch (error) {
      console.log(`[TA] ⚠️ Oscillator calculation error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  // Signal generation methods
  getRSISignal(rsi) {
    if (rsi > 70) return 'SELL';
    if (rsi < 30) return 'BUY';
    if (rsi > 50) return 'BULLISH';
    return 'BEARISH';
  }
  
  getStochasticSignal(stochastic) {
    if (stochastic.length === 0) return 'NEUTRAL';
    const current = stochastic[stochastic.length - 1];
    if (current.k > 80 && current.d > 80) return 'SELL';
    if (current.k < 20 && current.d < 20) return 'BUY';
    return 'NEUTRAL';
  }
  
  getWilliamsRSignal(value) {
    if (value > -20) return 'SELL';
    if (value < -80) return 'BUY';
    return 'NEUTRAL';
  }
  
  getMFISignal(value) {
    if (value > 80) return 'SELL';
    if (value < 20) return 'BUY';
    return 'NEUTRAL';
  }
  
  getMACDSignal(macd) {
    if (macd.length === 0) return 'NEUTRAL';
    const current = macd[macd.length - 1];
    const previous = macd[macd.length - 2];
    
    if (current && previous) {
      if (current.MACD > current.signal && previous.MACD <= previous.signal) return 'BUY';
      if (current.MACD < current.signal && previous.MACD >= previous.signal) return 'SELL';
    }
    
    return current && current.MACD > current.signal ? 'BULLISH' : 'BEARISH';
  }
  
  getADXSignal(adx) {
    if (adx > 50) return 'STRONG_TREND';
    if (adx > 25) return 'TRENDING';
    return 'SIDEWAYS';
  }
  
  getBBSignal(price, bb) {
    if (!bb) return 'NEUTRAL';
    if (price <= bb.lower) return 'BUY';
    if (price >= bb.upper) return 'SELL';
    return 'NEUTRAL';
  }
  
  getBBPosition(price, bb) {
    if (!bb) return 'UNKNOWN';
    const position = (price - bb.lower) / (bb.upper - bb.lower);
    if (position <= 0.2) return 'OVERSOLD';
    if (position >= 0.8) return 'OVERBOUGHT';
    return 'NORMAL';
  }
  
  getCCISignal(cci) {
    if (cci > 100) return 'SELL';
    if (cci < -100) return 'BUY';
    return 'NEUTRAL';
  }
  
  getOBVSignal(obv) {
    if (obv.length < 2) return 'NEUTRAL';
    const current = obv[obv.length - 1];
    const previous = obv[obv.length - 2];
    return current > previous ? 'BULLISH' : 'BEARISH';
  }
  
  // Helper methods for trend detection
  detectEMACrossover(ema12, ema26) {
    if (ema12.length < 2 || ema26.length < 2) return 'NONE';
    const current12 = ema12[ema12.length - 1];
    const current26 = ema26[ema26.length - 1];
    const previous12 = ema12[ema12.length - 2];
    const previous26 = ema26[ema26.length - 2];
    
    if (current12 > current26 && previous12 <= previous26) return 'GOLDEN_CROSS';
    if (current12 < current26 && previous12 >= previous26) return 'DEATH_CROSS';
    return 'NONE';
  }
  
  detectMACDDivergence(macd, prices) {
    // Simplified divergence detection
    if (macd.length < 10 || prices.length < 10) return false;
    // Would implement proper divergence detection here
    return false;
  }
  
  detectBBSqueeze(bb) {
    if (bb.length < 5) return false;
    const recent = bb.slice(-5);
    const avgWidth = recent.reduce((sum, b) => sum + (b.upper - b.lower), 0) / recent.length;
    const currentWidth = bb[bb.length - 1].upper - bb[bb.length - 1].lower;
    return currentWidth < avgWidth * 0.8;
  }
  
  detectBBExpansion(bb) {
    if (bb.length < 5) return false;
    const recent = bb.slice(-5);
    const avgWidth = recent.reduce((sum, b) => sum + (b.upper - b.lower), 0) / recent.length;
    const currentWidth = bb[bb.length - 1].upper - bb[bb.length - 1].lower;
    return currentWidth > avgWidth * 1.2;
  }
  
  calculateCurrentVolatility(prices) {
    if (prices.length < 10) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }
  
  getVolatilitySignal(prices) {
    const volatility = this.calculateCurrentVolatility(prices);
    if (volatility > 1.0) return 'HIGH';
    if (volatility < 0.3) return 'LOW';
    return 'NORMAL';
  }
  
  isVolatilityIncreasing(prices) {
    if (prices.length < 20) return false;
    const recent = prices.slice(-10);
    const older = prices.slice(-20, -10);
    const recentVol = this.calculateCurrentVolatility(recent);
    const olderVol = this.calculateCurrentVolatility(older);
    return recentVol > olderVol;
  }
  
  getVolumeTrend(volume) {
    if (volume.length < 5) return 'UNKNOWN';
    const recent = volume.slice(-5);
    const older = volume.slice(-10, -5);
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.2) return 'INCREASING';
    if (recentAvg < olderAvg * 0.8) return 'DECREASING';
    return 'STABLE';
  }
  
  detectVolumeSpike(volume) {
    if (volume.length < 10) return false;
    const current = volume[volume.length - 1];
    const avg = volume.slice(-10, -1).reduce((sum, v) => sum + v, 0) / 9;
    return current > avg * 2;
  }
  
  calculateAverageVolume(volume) {
    if (volume.length === 0) return 0;
    return volume.reduce((sum, v) => sum + v, 0) / volume.length;
  }
  
  getOBVTrend(obv) {
    if (obv.length < 5) return 'UNKNOWN';
    const recent = obv.slice(-5);
    const increasing = recent.filter((val, i) => i === 0 || val > recent[i - 1]).length;
    return increasing >= 3 ? 'BULLISH' : 'BEARISH';
  }
  
  /**
   * Generate trading signals from all indicators
   */
  generateTradingSignals(analysis) {
    const signals = {
      momentum: [],
      trend: [],
      volatility: [],
      volume: [],
      overall: 'NEUTRAL'
    };
    
    // Collect momentum signals
    if (analysis.momentum && !analysis.momentum.error) {
      signals.momentum.push(analysis.momentum.rsi?.signal);
      signals.momentum.push(analysis.momentum.stochastic?.signal);
      signals.momentum.push(analysis.momentum.williamsR?.signal);
      signals.momentum.push(analysis.momentum.mfi?.signal);
    }
    
    // Collect trend signals
    if (analysis.trend && !analysis.trend.error) {
      signals.trend.push(analysis.trend.sma20?.signal);
      signals.trend.push(analysis.trend.ema12?.signal);
      signals.trend.push(analysis.trend.macd?.signal);
    }
    
    // Collect volatility signals
    if (analysis.volatility && !analysis.volatility.error) {
      signals.volatility.push(analysis.volatility.bollingerBands?.signal);
    }
    
    // Collect volume signals
    if (analysis.volume && !analysis.volume.error) {
      signals.volume.push(analysis.volume.obv?.signal);
    }
    
    // Generate overall signal
    const allSignals = [
      ...signals.momentum.filter(s => s),
      ...signals.trend.filter(s => s),
      ...signals.volatility.filter(s => s),
      ...signals.volume.filter(s => s)
    ];
    
    const buySignals = allSignals.filter(s => s === 'BUY' || s === 'BULLISH').length;
    const sellSignals = allSignals.filter(s => s === 'SELL' || s === 'BEARISH').length;
    
    if (buySignals > sellSignals + 2) signals.overall = 'BUY';
    else if (sellSignals > buySignals + 2) signals.overall = 'SELL';
    else if (buySignals > sellSignals) signals.overall = 'BULLISH';
    else if (sellSignals > buySignals) signals.overall = 'BEARISH';
    
    return signals;
  }
  
  /**
   * Calculate component scores (0-100)
   */
  calculateScores(analysis) {
    const scores = {
      momentum: 50,
      trend: 50,
      volatility: 50,
      volume: 50,
      overall: 50
    };
    
    // Momentum score
    if (analysis.momentum && !analysis.momentum.error) {
      let momentumScore = 50;
      const rsi = analysis.momentum.rsi?.current;
      if (rsi) {
        if (rsi > 30 && rsi < 70) momentumScore += 20;
        if (rsi < 30) momentumScore += 30; // Oversold = opportunity
        if (rsi > 70) momentumScore -= 20; // Overbought = risk
      }
      scores.momentum = Math.max(0, Math.min(100, momentumScore));
    }
    
    // Trend score
    if (analysis.trend && !analysis.trend.error) {
      let trendScore = 50;
      if (analysis.trend.sma20?.signal === 'BULLISH') trendScore += 15;
      if (analysis.trend.ema12?.signal === 'BULLISH') trendScore += 15;
      if (analysis.trend.macd?.signal === 'BUY' || analysis.trend.macd?.signal === 'BULLISH') trendScore += 20;
      if (analysis.trend.adx?.trending) trendScore += 10;
      scores.trend = Math.max(0, Math.min(100, trendScore));
    }
    
    // Volatility score
    if (analysis.volatility && !analysis.volatility.error) {
      let volScore = 50;
      const bbPos = analysis.volatility.bollingerBands?.position;
      if (bbPos === 'OVERSOLD') volScore += 30;
      if (bbPos === 'OVERBOUGHT') volScore -= 20;
      if (analysis.volatility.bollingerBands?.squeeze) volScore += 15;
      scores.volatility = Math.max(0, Math.min(100, volScore));
    }
    
    // Volume score
    if (analysis.volume && !analysis.volume.error) {
      let volumeScore = 50;
      if (analysis.volume.obv?.signal === 'BULLISH') volumeScore += 20;
      if (analysis.volume.volumeTrend === 'INCREASING') volumeScore += 15;
      if (analysis.volume.volumeSpike) volumeScore += 15;
      scores.volume = Math.max(0, Math.min(100, volumeScore));
    }
    
    // Overall score (weighted average)
    scores.overall = Math.round(
      (scores.momentum * 0.3) +
      (scores.trend * 0.3) +
      (scores.volatility * 0.2) +
      (scores.volume * 0.2)
    );
    
    return scores;
  }
  
  /**
   * Generate summary analysis
   */
  generateSummary(analysis) {
    const summary = {
      recommendation: 'NEUTRAL',
      confidence: 0.5,
      keyPoints: [],
      risks: [],
      opportunities: []
    };
    
    // Generate recommendation based on overall signal and scores
    if (analysis.signals?.overall === 'BUY' && analysis.scores?.overall > 70) {
      summary.recommendation = 'STRONG_BUY';
      summary.confidence = 0.8;
    } else if (analysis.signals?.overall === 'BUY' || analysis.scores?.overall > 60) {
      summary.recommendation = 'BUY';
      summary.confidence = 0.7;
    } else if (analysis.signals?.overall === 'SELL' && analysis.scores?.overall < 30) {
      summary.recommendation = 'STRONG_SELL';
      summary.confidence = 0.8;
    } else if (analysis.signals?.overall === 'SELL' || analysis.scores?.overall < 40) {
      summary.recommendation = 'SELL';
      summary.confidence = 0.7;
    }
    
    // Add key points
    if (analysis.momentum?.rsi?.oversold) summary.keyPoints.push('RSI shows oversold conditions');
    if (analysis.momentum?.rsi?.overbought) summary.keyPoints.push('RSI shows overbought conditions');
    if (analysis.trend?.macd?.signal === 'BUY') summary.keyPoints.push('MACD bullish crossover detected');
    if (analysis.volatility?.bollingerBands?.squeeze) summary.keyPoints.push('Bollinger Bands squeeze - breakout expected');
    if (analysis.volume?.volumeSpike) summary.keyPoints.push('Volume spike detected');
    
    // Add risks
    if (analysis.momentum?.rsi?.overbought) summary.risks.push('Overbought conditions');
    if (analysis.volatility?.volatility?.signal === 'HIGH') summary.risks.push('High volatility');
    if (analysis.trend?.adx?.signal === 'SIDEWAYS') summary.risks.push('Sideways market trend');
    
    // Add opportunities
    if (analysis.momentum?.rsi?.oversold) summary.opportunities.push('Potential bounce from oversold levels');
    if (analysis.volatility?.bollingerBands?.squeeze) summary.opportunities.push('Volatility expansion expected');
    if (analysis.volume?.volumeTrend === 'INCREASING') summary.opportunities.push('Increasing volume supports move');
    
    return summary;
  }
}

export const technicalAnalysis = new AdvancedTechnicalAnalysis(); 