import { EventEmitter } from 'node:events';
import fetch from 'node-fetch';

export class GeckoTerminalIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      baseUrl: 'https://api.geckoterminal.com/api/v2',
      enabled: options.enabled !== false,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: 3
    };
    this.cache = new Map();
    this.marketData = new Map();
    
    console.log('🦎 GECKOTERMINAL INTEGRATION INITIALIZED');
    console.log(`🔗 Base URL: ${this.config.baseUrl}`);
    console.log(`📊 Free market data: ENABLED`);
  }

  /**
   * Get token price data
   */
  async getTokenPrice(tokenAddress) {
    try {
      const cacheKey = `price_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for token price
      const response = await fetch(`${this.config.baseUrl}/networks/solana/tokens/${tokenAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AxiomTrade/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });

        console.log(`[GECKOTERMINAL] ✅ Price data for ${tokenAddress}: $${data.data?.attributes?.price_usd || 'N/A'}`);
        return data;
      } else {
        console.log(`[GECKOTERMINAL] ⚠️ No price data for ${tokenAddress} (${response.status})`);
        return { data: { attributes: { price_usd: 0, price_change_24h: 0 } } };
      }
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error getting price data: ${error.message}`);
      return { data: { attributes: { price_usd: 0, price_change_24h: 0 } }, error: error.message };
    }
  }

  /**
   * Get token market data
   */
  async getMarketData(tokenAddress) {
    try {
      const cacheKey = `market_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for market data
      const response = await fetch(`${this.config.baseUrl}/networks/solana/tokens/${tokenAddress}/pools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AxiomTrade/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });

        // Update market data
        this.marketData.set(tokenAddress, data);

        console.log(`[GECKOTERMINAL] ✅ Market data for ${tokenAddress}: ${data.data?.length || 0} pools`);
        return data;
      } else {
        console.log(`[GECKOTERMINAL] ⚠️ No market data for ${tokenAddress} (${response.status})`);
        return { data: [], included: [] };
      }
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error getting market data: ${error.message}`);
      return { data: [], included: [], error: error.message };
    }
  }

  /**
   * Get token volume data
   */
  async getVolumeData(tokenAddress) {
    try {
      const cacheKey = `volume_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for volume data
      const response = await fetch(`${this.config.baseUrl}/networks/solana/tokens/${tokenAddress}/volume_chart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AxiomTrade/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });

        console.log(`[GECKOTERMINAL] ✅ Volume data for ${tokenAddress}: ${data.data?.length || 0} data points`);
        return data;
      } else {
        console.log(`[GECKOTERMINAL] ⚠️ No volume data for ${tokenAddress} (${response.status})`);
        return { data: [] };
      }
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error getting volume data: ${error.message}`);
      return { data: [], error: error.message };
    }
  }

  /**
   * Analyze market momentum
   */
  analyzeMarketMomentum(tokenAddress) {
    try {
      const marketData = this.marketData.get(tokenAddress);
      if (!marketData || !marketData.data) {
        return { momentum: 'unknown', confidence: 0, signals: [] };
      }

      const pools = marketData.data;
      const analysis = {
        momentum: 'unknown',
        confidence: 0,
        signals: [],
        totalPools: pools.length,
        totalLiquidity: 0,
        totalVolume: 0,
        averagePriceChange: 0
      };

      // Analyze pool data
      if (pools.length > 0) {
        pools.forEach(pool => {
          const attributes = pool.attributes;
          analysis.totalLiquidity += parseFloat(attributes.reserve_in_usd || 0);
          analysis.totalVolume += parseFloat(attributes.volume_usd_24h || 0);
          analysis.averagePriceChange += parseFloat(attributes.price_change_percentage_24h || 0);
        });

        analysis.averagePriceChange /= pools.length;

        // Determine momentum
        if (analysis.averagePriceChange > 20 && analysis.totalVolume > 10000) {
          analysis.momentum = 'strong_bullish';
          analysis.confidence = Math.min(0.8, (analysis.averagePriceChange / 100) + 0.3);
          analysis.signals.push('Strong bullish momentum with high volume');
        } else if (analysis.averagePriceChange > 10 && analysis.totalVolume > 5000) {
          analysis.momentum = 'bullish';
          analysis.confidence = Math.min(0.6, (analysis.averagePriceChange / 100) + 0.2);
          analysis.signals.push('Bullish momentum detected');
        } else if (analysis.averagePriceChange < -20) {
          analysis.momentum = 'bearish';
          analysis.confidence = Math.min(0.7, Math.abs(analysis.averagePriceChange / 100) + 0.2);
          analysis.signals.push('Bearish momentum detected');
        } else if (analysis.averagePriceChange < -10) {
          analysis.momentum = 'weak_bearish';
          analysis.confidence = Math.min(0.5, Math.abs(analysis.averagePriceChange / 100) + 0.1);
          analysis.signals.push('Weak bearish momentum');
        } else {
          analysis.momentum = 'neutral';
          analysis.confidence = 0.4;
          analysis.signals.push('Neutral momentum');
        }
      }

      console.log(`[GECKOTERMINAL] 📈 Momentum analysis: ${analysis.momentum} (${(analysis.confidence * 100).toFixed(1)}% confidence)`);
      return analysis;
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error analyzing momentum: ${error.message}`);
      return { momentum: 'unknown', confidence: 0, signals: [], error: error.message };
    }
  }

  /**
   * Get comprehensive market analysis
   */
  async getMarketAnalysis(tokenAddress) {
    try {
      // Get all data in parallel
      const [priceData, marketData, volumeData] = await Promise.all([
        this.getTokenPrice(tokenAddress),
        this.getMarketData(tokenAddress),
        this.getVolumeData(tokenAddress)
      ]);

      // Analyze momentum
      const momentumAnalysis = this.analyzeMarketMomentum(tokenAddress);

      const analysis = {
        tokenAddress,
        priceData,
        marketData,
        volumeData,
        momentumAnalysis,
        timestamp: Date.now()
      };

      console.log(`[GECKOTERMINAL] 📊 Complete market analysis for ${tokenAddress}`);
      return analysis;
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error in market analysis: ${error.message}`);
      return {
        tokenAddress,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Generate trading signals based on market data
   */
  generateTradingSignals(tokenAddress) {
    try {
      const momentumAnalysis = this.analyzeMarketMomentum(tokenAddress);
      const marketData = this.marketData.get(tokenAddress);
      
      if (!marketData || momentumAnalysis.confidence < 0.3) {
        return null;
      }

      const signals = [];
      
      // Generate signals based on momentum
      if (momentumAnalysis.momentum === 'strong_bullish' && momentumAnalysis.confidence >= 0.6) {
        signals.push({
          type: 'STRONG_BUY',
          confidence: momentumAnalysis.confidence,
          reason: 'Strong bullish momentum with high volume',
          momentum: momentumAnalysis.momentum,
          priceChange: momentumAnalysis.averagePriceChange
        });
      } else if (momentumAnalysis.momentum === 'bullish' && momentumAnalysis.confidence >= 0.4) {
        signals.push({
          type: 'BUY',
          confidence: momentumAnalysis.confidence,
          reason: 'Bullish momentum detected',
          momentum: momentumAnalysis.momentum,
          priceChange: momentumAnalysis.averagePriceChange
        });
      } else if (momentumAnalysis.momentum === 'bearish' && momentumAnalysis.confidence >= 0.5) {
        signals.push({
          type: 'SELL',
          confidence: momentumAnalysis.confidence,
          reason: 'Bearish momentum detected',
          momentum: momentumAnalysis.momentum,
          priceChange: momentumAnalysis.averagePriceChange
        });
      }

      if (signals.length > 0) {
        console.log(`[GECKOTERMINAL] 🎯 Trading signals: ${signals.length} signals generated`);
        this.emit('tradingSignals', {
          tokenAddress,
          signals,
          momentumAnalysis,
          timestamp: Date.now()
        });
        return signals;
      }

      return null;
    } catch (error) {
      console.log(`[GECKOTERMINAL] ❌ Error generating signals: ${error.message}`);
      return null;
    }
  }
}

export const geckoTerminalIntegration = new GeckoTerminalIntegration(); 