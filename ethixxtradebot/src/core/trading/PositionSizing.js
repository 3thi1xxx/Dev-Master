/**
 * Position Sizing Calculator
 * Optimizes trade sizes for fee efficiency and profit maximization
 */

export class PositionSizing {
  constructor(options = {}) {
    this.walletBalance = options.walletBalance || 100; // USD
    this.solPrice = options.solPrice || 250; // USD per SOL
    this.jupiterFeeSOL = options.jupiterFeeSOL || 0.001; // ~$0.25 in SOL (platform fee)
    this.priorityFeeSOL = options.priorityFeeSOL || 0.001; // ~$0.25 in SOL (compute units)
    this.minProfitPercent = options.minProfitPercent || 8; // 8% minimum profit target
    
    this.config = {
      basePositionSize: options.basePositionSize || (this.walletBalance * 0.05), // 5% default
      ...options
    };
    
    this.logger = console;
  }

  /**
   * Calculate optimal position size for copy trading
   */
  calculateCopySize(whalePositionSOL, copyRatio = 0.25) {
    const baseCopySize = whalePositionSOL * copyRatio;
    
    // Apply wallet-based constraints
    const result = this.optimizeForWallet(baseCopySize, 'copy');
    
    this.logger.log(`[POSITION] Copy sizing: whale=${whalePositionSOL.toFixed(3)} SOL → base=${baseCopySize.toFixed(3)} SOL → optimal=${result.sizeSOL.toFixed(3)} SOL`);
    
    // Add reasoning for comprehensive analysis
    result.reasoning = `Whale copy trade: ${copyRatio*100}% of ${whalePositionSOL.toFixed(3)} SOL position`;
    
    return result;
  }

  /**
   * Calculate optimal position size based on confidence and risk level
   */
  calculateOptimalSize(options = {}) {
    const { confidence = 0.5, riskLevel = 'moderate', marketCondition = 'normal' } = options;
    
    let baseSize = this.config.basePositionSize || (this.walletBalance * 0.05); // 5% default
    
    // Adjust based on confidence
    const confidenceMultiplier = Math.max(0.3, Math.min(2.0, confidence * 1.5));
    
    // Adjust based on risk level
    const riskMultipliers = {
      conservative: 0.5,
      moderate: 1.0,
      aggressive: 1.8
    };
    
    const riskMultiplier = riskMultipliers[riskLevel] || 1.0;
    
    // Market condition adjustment
    const marketMultipliers = {
      bearish: 0.7,
      normal: 1.0,
      volatile: 0.8,
      bullish: 1.2
    };
    
    const marketMultiplier = marketMultipliers[marketCondition] || 1.0;
    
    let positionSize = baseSize * confidenceMultiplier * riskMultiplier * marketMultiplier;
    
    // Apply wallet constraints
    const result = this.optimizeForWallet(positionSize / this.solPrice, 'optimal');
    
    result.reasoning = `${riskLevel} strategy: ${(confidence*100).toFixed(1)}% confidence in ${marketCondition} market`;
    
    return result;
  }

  /**
   * Calculate optimal position size for normal trades
   */
  calculateNormalSize(preset = 'medium') {
    const presetSizes = {
      small: 0.02,   // $5 - conservative
      medium: 0.03,  // $7.50 - sweet spot
      large: 0.06    // $15 - aggressive
    };
    
    const baseSize = presetSizes[preset] || presetSizes.medium;
    const result = this.optimizeForWallet(baseSize, 'normal');
    
    this.logger.log(`[POSITION] Normal sizing: preset=${preset} → base=${baseSize.toFixed(3)} SOL → optimal=${result.sizeSOL.toFixed(3)} SOL`);
    
    return result;
  }

  /**
   * Core optimization logic for wallet constraints
   */
  optimizeForWallet(baseSizeSOL, tradeType) {
    const totalFees = this.jupiterFeeSOL + this.priorityFeeSOL;
    const walletBalanceSOL = this.walletBalance / this.solPrice;
    
    // Constraints for $100 wallet
    const minSizeSOL = Math.max(0.02, totalFees * 2); // Must be 2x fees minimum
    const maxSizeSOL = Math.min(0.08, walletBalanceSOL * 0.08); // Max 8% of wallet
    
    // Apply constraints
    let optimalSize = Math.max(baseSizeSOL, minSizeSOL);
    optimalSize = Math.min(optimalSize, maxSizeSOL);
    
    // Fee efficiency check
    const netAfterFees = optimalSize - totalFees;
    const feeRatio = totalFees / optimalSize;
    
    // Calculate profit requirements
    const minProfitSOL = (optimalSize * this.minProfitPercent) / 100;
    const breakEvenPrice = optimalSize + totalFees + minProfitSOL;
    
    const analysis = {
      sizeSOL: optimalSize,
      sizeUSD: optimalSize * this.solPrice,
      totalFeesSOL: totalFees,
      totalFeesUSD: totalFees * this.solPrice,
      netAfterFeesSOL: netAfterFees,
      netAfterFeesUSD: netAfterFees * this.solPrice,
      feeRatio: feeRatio,
      minProfitSOL: minProfitSOL,
      breakEvenSOL: breakEvenPrice,
      walletPercentage: (optimalSize / walletBalanceSOL) * 100,
      efficient: feeRatio < 0.15, // Fees should be <15% of trade
      viable: netAfterFees > 0.008, // Need at least $2 net after fees
      tradeType
    };
    
    return analysis;
  }

  /**
   * Validate if a trade size is profitable after fees
   */
  validateTradeSize(sizeSOL) {
    const analysis = this.optimizeForWallet(sizeSOL, 'validation');
    
    const warnings = [];
    
    if (!analysis.efficient) {
      warnings.push(`High fee ratio: ${(analysis.feeRatio * 100).toFixed(1)}% (should be <15%)`);
    }
    
    if (!analysis.viable) {
      warnings.push(`Insufficient net value: $${analysis.netAfterFeesUSD.toFixed(2)} (should be >$2)`);
    }
    
    if (analysis.walletPercentage > 10) {
      warnings.push(`Large position: ${analysis.walletPercentage.toFixed(1)}% of wallet (should be <10%)`);
    }
    
    return {
      valid: analysis.efficient && analysis.viable && analysis.walletPercentage <= 10,
      warnings,
      analysis
    };
  }

  /**
   * Get recommended trade sizes for different scenarios
   */
  getRecommendedSizes() {
    return {
      micro: this.calculateNormalSize('small'),
      sweet_spot: this.calculateNormalSize('medium'),
      aggressive: this.calculateNormalSize('large'),
      copy_conservative: this.calculateCopySize(0.2), // Copying 0.2 SOL whale trade
      copy_large: this.calculateCopySize(1.0), // Copying 1.0 SOL whale trade
    };
  }

  /**
   * Log optimization summary
   */
  logSummary() {
    const sizes = this.getRecommendedSizes();
    
    this.logger.log('\n💰 POSITION SIZING SUMMARY FOR $100 WALLET:');
    this.logger.log('='.repeat(50));
    this.logger.log(`💵 Wallet Balance: $${this.walletBalance}`);
    this.logger.log(`📊 SOL Price: $${this.solPrice}`);
    this.logger.log(`💸 Jupiter Fees: ${this.jupiterFeeSOL.toFixed(3)} SOL (~$${(this.jupiterFeeSOL * this.solPrice).toFixed(2)})`);
    this.logger.log('');
    
    Object.entries(sizes).forEach(([type, analysis]) => {
      this.logger.log(`🎯 ${type.toUpperCase()}:`);
      this.logger.log(`   Size: ${analysis.sizeSOL.toFixed(3)} SOL ($${analysis.sizeUSD.toFixed(2)})`);
      this.logger.log(`   Net after fees: $${analysis.netAfterFeesUSD.toFixed(2)}`);
      this.logger.log(`   Fee ratio: ${(analysis.feeRatio * 100).toFixed(1)}%`);
      this.logger.log(`   Wallet %: ${analysis.walletPercentage.toFixed(1)}%`);
      this.logger.log(`   Status: ${analysis.efficient && analysis.viable ? '✅ GOOD' : '❌ POOR'}`);
      this.logger.log('');
    });
  }
}

export default PositionSizing; 