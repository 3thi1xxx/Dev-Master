import { EventEmitter } from 'node:events';

export class DegenIntelligence extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      degenMode: options.degenMode !== false,
      fomoThreshold: options.fomoThreshold || 0.15, // 15% price increase triggers FOMO (MORE AGGRESSIVE!)
      hypeMultiplier: options.hypeMultiplier || 3.0, // Hype tokens get 3x score boost (MORE AGGRESSIVE!)
      memePatterns: options.memePatterns || true,
      socialSentiment: options.socialSentiment || true,
      momentumBias: options.momentumBias || 0.9, // 90% weight on momentum (MORE AGGRESSIVE!)
      riskTolerance: options.riskTolerance || 'EXTREME' // EXTREME, HIGH, MEDIUM
    };
    
    this.memePatterns = {
      animal: ['dog', 'cat', 'pepe', 'shib', 'inu', 'wojak', 'doge', 'kitty', 'puppy'],
      food: ['moon', 'cake', 'bread', 'pizza', 'burger', 'taco', 'sushi', 'ramen'],
      tech: ['ai', 'gpt', 'chat', 'bot', 'robot', 'cyber', 'meta', 'web3'],
      meme: ['moon', 'rocket', 'lambo', 'diamond', 'hands', 'hodl', 'ape', 'chad'],
      viral: ['viral', 'trend', 'hot', 'fire', 'lit', 'based', 'alpha', 'sigma']
    };
    
    this.hypeKeywords = [
      'moon', 'rocket', 'lambo', 'diamond', 'hands', 'hodl', 'ape', 'chad',
      'based', 'alpha', 'sigma', 'gigachad', 'degen', 'wagmi', 'ngmi',
      'fomo', 'fud', 'shill', 'pump', 'dump', 'hodl', 'diamond', 'paper'
    ];
    
    console.log('🔥 DEGEN INTELLIGENCE INITIALIZED');
    console.log(`🎯 Degen Mode: ${this.config.degenMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`⚡ Risk Tolerance: ${this.config.riskTolerance}`);
    console.log(`🚀 FOMO Threshold: ${this.config.fomoThreshold * 100}%`);
    console.log(`💎 Hype Multiplier: ${this.config.hypeMultiplier}x`);
  }

  /**
   * Analyze token for DEGEN patterns
   */
  analyzeDegenPatterns(tokenData) {
    try {
      const analysis = {
        degenScore: 0,
        fomoLevel: 0,
        hypeLevel: 0,
        memeFactor: 0,
        socialBuzz: 0,
        momentumScore: 0,
        riskLevel: 'UNKNOWN',
        signals: [],
        reasoning: []
      };

      const { symbol, name, priceChange1h, volume24h, liquidity } = tokenData;
      const tokenText = `${symbol} ${name}`.toLowerCase();

      // 1. MEME PATTERN DETECTION
      analysis.memeFactor = this.detectMemePatterns(tokenText);
      if (analysis.memeFactor > 0.5) {
        analysis.signals.push('MEME_PATTERN_DETECTED');
        analysis.reasoning.push(`Strong meme pattern: ${analysis.memeFactor * 100}% match`);
      }

      // 2. HYPE KEYWORD ANALYSIS
      analysis.hypeLevel = this.analyzeHypeKeywords(tokenText);
      if (analysis.hypeLevel > 0.3) {
        analysis.signals.push('HYPE_KEYWORDS_FOUND');
        analysis.reasoning.push(`Hype keywords detected: ${analysis.hypeLevel * 100}% hype`);
      }

      // 3. FOMO MOMENTUM ANALYSIS
      analysis.fomoLevel = this.analyzeFOMO(priceChange1h, volume24h, liquidity);
      if (analysis.fomoLevel > this.config.fomoThreshold) {
        analysis.signals.push('FOMO_DETECTED');
        analysis.reasoning.push(`FOMO momentum: ${(analysis.fomoLevel * 100).toFixed(1)}%`);
      }

      // 4. MOMENTUM SCORING (DEGEN STYLE)
      analysis.momentumScore = this.calculateDegenMomentum(tokenData);
      if (analysis.momentumScore > 0.7) {
        analysis.signals.push('STRONG_MOMENTUM');
        analysis.reasoning.push(`Strong momentum: ${(analysis.momentumScore * 100).toFixed(1)}%`);
      }

      // 5. SOCIAL BUZZ ESTIMATION
      analysis.socialBuzz = this.estimateSocialBuzz(tokenData);
      if (analysis.socialBuzz > 0.5) {
        analysis.signals.push('SOCIAL_BUZZ');
        analysis.reasoning.push(`Social buzz detected: ${(analysis.socialBuzz * 100).toFixed(1)}%`);
      }

      // 6. CALCULATE DEGEN SCORE
      analysis.degenScore = this.calculateDegenScore(analysis);
      
      // 7. RISK ASSESSMENT (DEGEN STYLE)
      analysis.riskLevel = this.assessDegenRisk(analysis);

      console.log(`[DEGEN] 🎯 ${symbol}: Score=${(analysis.degenScore * 100).toFixed(1)}%, FOMO=${(analysis.fomoLevel * 100).toFixed(1)}%, Hype=${(analysis.hypeLevel * 100).toFixed(1)}%`);
      
      return analysis;
    } catch (error) {
      console.log(`[DEGEN] ❌ Error analyzing degen patterns: ${error.message}`);
      return { degenScore: 0, riskLevel: 'UNKNOWN', signals: [], reasoning: [] };
    }
  }

  /**
   * Detect meme patterns in token name/symbol
   */
  detectMemePatterns(tokenText) {
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(this.memePatterns).forEach(([category, keywords]) => {
      let categoryScore = 0;
      keywords.forEach(keyword => {
        if (tokenText.includes(keyword)) {
          categoryScore += 1;
        }
      });
      
      if (categoryScore > 0) {
        totalScore += categoryScore;
        maxScore = Math.max(maxScore, categoryScore);
      }
    });

    // Bonus for multiple categories
    const categoryCount = Object.entries(this.memePatterns).filter(([category, keywords]) => 
      keywords.some(keyword => tokenText.includes(keyword))
    ).length;

    if (categoryCount > 1) {
      totalScore *= 1.5; // Multi-category bonus
    }

    return Math.min(1.0, totalScore / 10); // Normalize to 0-1
  }

  /**
   * Analyze hype keywords
   */
  analyzeHypeKeywords(tokenText) {
    let hypeCount = 0;
    this.hypeKeywords.forEach(keyword => {
      if (tokenText.includes(keyword)) {
        hypeCount += 1;
      }
    });

    return Math.min(1.0, hypeCount / 5); // Normalize to 0-1
  }

  /**
   * Analyze FOMO potential
   */
  analyzeFOMO(priceChange1h, volume24h, liquidity) {
    let fomoScore = 0;

    // Price momentum (MORE AGGRESSIVE!)
    if (priceChange1h > 15) fomoScore += 0.5;
    else if (priceChange1h > 10) fomoScore += 0.4;
    else if (priceChange1h > 5) fomoScore += 0.3;

    // Volume to liquidity ratio (high volume = FOMO)
    const volumeLiquidityRatio = volume24h / Math.max(liquidity, 1000);
    if (volumeLiquidityRatio > 5) fomoScore += 0.4;
    else if (volumeLiquidityRatio > 2) fomoScore += 0.3;
    else if (volumeLiquidityRatio > 1) fomoScore += 0.2;

    // Recent price action
    if (priceChange1h > 0) fomoScore += 0.2;

    return Math.min(1.0, fomoScore);
  }

  /**
   * Calculate degen momentum (different from technical momentum)
   */
  calculateDegenMomentum(tokenData) {
    const { priceChange1h, volume24h, liquidity, marketCap } = tokenData;
    let momentum = 0;

    // Price momentum (MORE AGGRESSIVE!)
    if (priceChange1h > 30) momentum += 0.5;
    else if (priceChange1h > 20) momentum += 0.4;
    else if (priceChange1h > 10) momentum += 0.3;
    else if (priceChange1h > 5) momentum += 0.2;

    // Volume explosion
    const volumeLiquidityRatio = volume24h / Math.max(liquidity, 1000);
    if (volumeLiquidityRatio > 10) momentum += 0.3;
    else if (volumeLiquidityRatio > 5) momentum += 0.2;
    else if (volumeLiquidityRatio > 2) momentum += 0.1;

    // Market cap growth potential (smaller = more potential)
    if (marketCap < 100000) momentum += 0.2;
    else if (marketCap < 500000) momentum += 0.1;

    // Liquidity growth (increasing liquidity = good)
    if (liquidity > 50000) momentum += 0.1;

    return Math.min(1.0, momentum);
  }

  /**
   * Estimate social buzz (based on token characteristics)
   */
  estimateSocialBuzz(tokenData) {
    const { symbol, name, priceChange1h, volume24h } = tokenData;
    let buzz = 0;

    // Meme factor
    const tokenText = `${symbol} ${name}`.toLowerCase();
    const memeScore = this.detectMemePatterns(tokenText);
    buzz += memeScore * 0.3;

    // Price action buzz (MORE AGGRESSIVE!)
    if (priceChange1h > 15) buzz += 0.4;
    else if (priceChange1h > 10) buzz += 0.3;
    else if (priceChange1h > 5) buzz += 0.2;

    // Volume buzz
    if (volume24h > 100000) buzz += 0.2;
    else if (volume24h > 50000) buzz += 0.1;

    // Hype keywords
    const hypeScore = this.analyzeHypeKeywords(tokenText);
    buzz += hypeScore * 0.2;

    return Math.min(1.0, buzz);
  }

  /**
   * Calculate overall degen score
   */
  calculateDegenScore(analysis) {
    let score = 0;

    // Base momentum (heavily weighted)
    score += analysis.momentumScore * this.config.momentumBias;

    // FOMO factor
    score += analysis.fomoLevel * 0.2;

    // Hype factor (with multiplier)
    score += analysis.hypeLevel * 0.15 * this.config.hypeMultiplier;

    // Meme factor
    score += analysis.memeFactor * 0.15;

    // Social buzz
    score += analysis.socialBuzz * 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Assess risk (DEGEN STYLE - risk is opportunity!)
   */
  assessDegenRisk(analysis) {
    const { degenScore, fomoLevel, momentumScore } = analysis;

    // In degen mode, "high risk" often means "high reward"
    if (degenScore > 0.8 && fomoLevel > 0.5) {
      return 'EXTREME_OPPORTUNITY';
    } else if (degenScore > 0.6 && momentumScore > 0.5) {
      return 'HIGH_OPPORTUNITY';
    } else if (degenScore > 0.4) {
      return 'MEDIUM_OPPORTUNITY';
    } else {
      return 'LOW_OPPORTUNITY';
    }
  }

  /**
   * Generate degen trading signals
   */
  generateDegenSignals(tokenData) {
    try {
      const analysis = this.analyzeDegenPatterns(tokenData);
      const signals = [];

      // DEGEN SIGNAL GENERATION (MORE AGGRESSIVE!)
      if (analysis.degenScore > 0.6 && analysis.fomoLevel > 0.4) {
        signals.push({
          type: 'DEGEN_YOLO',
          confidence: analysis.degenScore,
          reason: 'EXTREME DEGEN OPPORTUNITY - YOLO TIME!',
          risk: 'EXTREME_OPPORTUNITY',
          degenScore: analysis.degenScore,
          fomoLevel: analysis.fomoLevel
        });
      } else if (analysis.degenScore > 0.5 && analysis.momentumScore > 0.4) {
        signals.push({
          type: 'DEGEN_BUY',
          confidence: analysis.degenScore,
          reason: 'Strong degen momentum - BUY NOW!',
          risk: 'HIGH_OPPORTUNITY',
          degenScore: analysis.degenScore,
          momentumScore: analysis.momentumScore
        });
      } else if (analysis.degenScore > 0.3 && analysis.hypeLevel > 0.2) {
        signals.push({
          type: 'DEGEN_WATCH',
          confidence: analysis.degenScore,
          reason: 'Hype building - WATCH CLOSELY!',
          risk: 'MEDIUM_OPPORTUNITY',
          degenScore: analysis.degenScore,
          hypeLevel: analysis.hypeLevel
        });
      }

      if (signals.length > 0) {
        console.log(`[DEGEN] 🎯 Signals generated: ${signals.length}`);
        this.emit('degenSignals', {
          tokenData,
          signals,
          analysis,
          timestamp: Date.now()
        });
        return signals;
      }

      return null;
    } catch (error) {
      console.log(`[DEGEN] ❌ Error generating signals: ${error.message}`);
      return null;
    }
  }

  /**
   * Get comprehensive degen analysis
   */
  getDegenAnalysis(tokenData) {
    try {
      const analysis = this.analyzeDegenPatterns(tokenData);
      const signals = this.generateDegenSignals(tokenData);

      const degenAnalysis = {
        tokenData,
        analysis,
        signals,
        timestamp: Date.now()
      };

      console.log(`[DEGEN] 📊 Complete degen analysis for ${tokenData.symbol}`);
      return degenAnalysis;
    } catch (error) {
      console.log(`[DEGEN] ❌ Error in degen analysis: ${error.message}`);
      return {
        tokenData,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

export const degenIntelligence = new DegenIntelligence(); 