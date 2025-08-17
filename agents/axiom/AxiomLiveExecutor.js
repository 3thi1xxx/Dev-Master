/**
 * Axiom Live Executor
 * Modernized trading executor that uses live API6 data instead of static fixtures
 * Integrates AxiomAPI6Client with trading decision logic
 */
import AxiomAPI6Client from './AxiomAPI6Client.js';

function nowISO() { return new Date().toISOString(); }

export class AxiomLiveExecutor {
  constructor({ walletAddress, privKeyBase58, logger = console }) {
    this.api6 = new AxiomAPI6Client({ walletAddress, privKeyBase58, logger });
    this.logger = logger;
  }

  /**
   * Generate trading signals from live API6 data
   */
  async generateSignals() {
    try {
      // Get live trending tokens from API6
      const trendingTokens = await this.api6.getFilteredTrendingTokens('1h');
      
      const signals = trendingTokens.slice(0, 5).map(token => ({
        symbol: token.tokenSymbol || token.mint || token.token,
        mint: token.mint || token.dexPairAddress,
        score: Math.min(0.85, (token.score || 50) / 100), // Normalize to 0-0.85 range
        sizeUSD: Math.min(25, Math.max(5, token.score || 10)), // Dynamic sizing based on score
        reason: 'live_trending_api6',
        metadata: {
          liquidity: token.liquiditySol,
          volume: token.volumeSol,
          marketCap: token.marketCapSol,
          age: token.createdAt,
          protocol: token.protocol,
          apiSource: 'api6.axiom.trade'
        }
      })).filter(s => s.symbol && s.score > 0.5);

      this.logger.log(`[AXIOM-LIVE] Generated ${signals.length} signals from trending data`);
      return signals;

    } catch (err) {
      this.logger.error('[AXIOM-LIVE] Failed to generate signals:', err.message);
      return [];
    }
  }

  /**
   * Run live trading analysis (compatible with existing executor interface)
   */
  async run(ctx) {
    const { trust, killswitch, mode = 'live' } = ctx || {};
    
    // Safety checks (same as legacy executor)
    if (killswitch?.enabled) {
      return { action: 'HOLD', confidence: 0.0, reason: 'killswitch_enabled' };
    }
    
    const minTrust = (trust?.thresholds?.min_trust_to_execute ?? 0.7);
    const score = trust?.score ?? 0.85;
    if (score < minTrust) {
      return { action: 'HOLD', confidence: 0.0, reason: 'trust_too_low' };
    }

    try {
      // Test API6 latency first
      const latencyTest = await this.api6.testLatency();
      if (!latencyTest.success) {
        this.logger.warn('[AXIOM-LIVE] API6 latency test failed, falling back to HOLD');
        return { 
          action: 'HOLD', 
          confidence: 0.0, 
          reason: 'api6_unavailable',
          latency: latencyTest.latency,
          error: latencyTest.error
        };
      }

      // Generate live signals
      const signals = await this.generateSignals();
      
      if (signals.length === 0) {
        return {
          action: 'HOLD',
          confidence: 0.4,
          reason: 'no_signals_found',
          latency: latencyTest.latency
        };
      }

      // Analyze signals for trading decision
      const topSignal = signals[0];
      const avgScore = signals.reduce((sum, s) => sum + s.score, 0) / signals.length;
      const hasHighVolumeSignals = signals.some(s => s.metadata.volume > 500);
      const hasLowMarketCapSignals = signals.some(s => s.metadata.marketCap < 100000);

      let action = 'HOLD';
      let confidence = 0.55;
      let reason = 'neutral_signals';

      // Decision logic based on live data
      if (topSignal.score >= 0.75 && hasHighVolumeSignals) {
        action = 'BUY';
        confidence = Math.min(0.85, topSignal.score + 0.1);
        reason = 'strong_signal_high_volume';
      } else if (avgScore >= 0.65 && hasLowMarketCapSignals) {
        action = 'BUY';
        confidence = Math.min(0.75, avgScore + 0.05);
        reason = 'good_avg_score_low_mcap';
      } else if (topSignal.score >= 0.60) {
        action = 'BUY';
        confidence = Math.min(0.70, topSignal.score);
        reason = 'moderate_signal';
      }

      // Provide comprehensive provenance
      const provenance = {
        mode,
        ts: nowISO(),
        api6_latency: latencyTest.latency,
        signals_count: signals.length,
        top_signal: {
          symbol: topSignal.symbol,
          score: topSignal.score,
          volume: topSignal.metadata.volume,
          marketCap: topSignal.metadata.marketCap
        },
        analysis: {
          avg_score: Math.round(avgScore * 100) / 100,
          has_high_volume: hasHighVolumeSignals,
          has_low_mcap: hasLowMarketCapSignals
        },
        source: 'live_api6_axiom_trade'
      };

      this.logger.log(`[AXIOM-LIVE] Decision: ${action} (${confidence}) - ${reason}`);
      
      return { action, confidence, reason, provenance, signals };

    } catch (err) {
      this.logger.error('[AXIOM-LIVE] Execution failed:', err.message);
      return {
        action: 'HOLD',
        confidence: 0.0,
        reason: 'execution_error',
        error: err.message
      };
    }
  }

  /**
   * Get current portfolio data from API6
   */
  async getPortfolioData() {
    try {
      const [accountValue, tokenAccounts] = await Promise.all([
        this.api6.getTotalAccountValue(),
        this.api6.getWalletTokenAccounts()
      ]);

      return {
        totalValue: accountValue,
        tokenAccounts,
        timestamp: nowISO()
      };
    } catch (err) {
      this.logger.error('[AXIOM-LIVE] Failed to get portfolio data:', err.message);
      return null;
    }
  }
}

export default AxiomLiveExecutor; 