import { EventEmitter } from 'node:events';
import fetch from 'node-fetch';

export class CabalspyIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      baseUrl: 'https://api.cabalspy.xyz',
      enabled: options.enabled !== false,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: 3
    };
    this.cache = new Map();
    this.whaleData = new Map();
    
    console.log('🐋 CABALSPY INTEGRATION INITIALIZED');
    console.log(`🔗 Base URL: ${this.config.baseUrl}`);
    console.log(`📊 Free whale tracking: ENABLED`);
  }

  /**
   * Get whale activity for a token
   */
  async getWhaleActivity(tokenAddress) {
    try {
      const cacheKey = `whale_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for whale activity
      const response = await fetch(`${this.config.baseUrl}/v1/whale/activity/${tokenAddress}`, {
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

        // Update whale data
        this.whaleData.set(tokenAddress, data);
        
        console.log(`[CABALSPY] ✅ Whale activity for ${tokenAddress}: ${data.whales?.length || 0} whales`);
        return data;
      } else {
        console.log(`[CABALSPY] ⚠️ No whale data for ${tokenAddress} (${response.status})`);
        return { whales: [], activity: [] };
      }
    } catch (error) {
      console.log(`[CABALSPY] ❌ Error getting whale activity: ${error.message}`);
      return { whales: [], activity: [], error: error.message };
    }
  }

  /**
   * Get token flow visualization
   */
  async getTokenFlow(tokenAddress) {
    try {
      const cacheKey = `flow_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for token flow
      const response = await fetch(`${this.config.baseUrl}/v1/token/flow/${tokenAddress}`, {
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

        console.log(`[CABALSPY] ✅ Token flow for ${tokenAddress}: ${data.flows?.length || 0} flows`);
        return data;
      } else {
        console.log(`[CABALSPY] ⚠️ No flow data for ${tokenAddress} (${response.status})`);
        return { flows: [], holders: [] };
      }
    } catch (error) {
      console.log(`[CABALSPY] ❌ Error getting token flow: ${error.message}`);
      return { flows: [], holders: [], error: error.message };
    }
  }

  /**
   * Analyze whale behavior patterns
   */
  analyzeWhalePatterns(tokenAddress) {
    try {
      const whaleData = this.whaleData.get(tokenAddress);
      if (!whaleData || !whaleData.whales) {
        return { confidence: 0, pattern: 'unknown', signals: [] };
      }

      const whales = whaleData.whales;
      const patterns = {
        confidence: 0,
        pattern: 'unknown',
        signals: [],
        whaleCount: whales.length,
        totalVolume: 0,
        averageTradeSize: 0
      };

      // Calculate patterns
      if (whales.length > 0) {
        patterns.totalVolume = whales.reduce((sum, whale) => sum + (whale.volume || 0), 0);
        patterns.averageTradeSize = patterns.totalVolume / whales.length;
        
        // Determine pattern based on whale activity
        if (whales.length >= 3 && patterns.averageTradeSize > 1) {
          patterns.pattern = 'whale_accumulation';
          patterns.confidence = Math.min(0.8, whales.length * 0.15);
          patterns.signals.push('Multiple whales accumulating');
        } else if (whales.length >= 2 && patterns.averageTradeSize > 0.5) {
          patterns.pattern = 'whale_interest';
          patterns.confidence = Math.min(0.6, whales.length * 0.2);
          patterns.signals.push('Whale interest detected');
        } else if (whales.length >= 1) {
          patterns.pattern = 'whale_watching';
          patterns.confidence = 0.3;
          patterns.signals.push('Whale activity detected');
        }
      }

      console.log(`[CABALSPY] 🧠 Pattern analysis: ${patterns.pattern} (${(patterns.confidence * 100).toFixed(1)}% confidence)`);
      return patterns;
    } catch (error) {
      console.log(`[CABALSPY] ❌ Error analyzing patterns: ${error.message}`);
      return { confidence: 0, pattern: 'unknown', signals: [], error: error.message };
    }
  }

  /**
   * Generate copy trading signals
   */
  generateCopyTradeSignals(tokenAddress) {
    try {
      const patterns = this.analyzeWhalePatterns(tokenAddress);
      const whaleData = this.whaleData.get(tokenAddress);
      
      if (!whaleData || patterns.confidence < 0.3) {
        return null;
      }

      const signals = [];
      
      // Generate signals based on patterns
      if (patterns.pattern === 'whale_accumulation' && patterns.confidence >= 0.6) {
        signals.push({
          type: 'STRONG_BUY',
          confidence: patterns.confidence,
          reason: 'Multiple whales accumulating',
          whaleCount: patterns.whaleCount,
          averageTradeSize: patterns.averageTradeSize
        });
      } else if (patterns.pattern === 'whale_interest' && patterns.confidence >= 0.4) {
        signals.push({
          type: 'BUY',
          confidence: patterns.confidence,
          reason: 'Whale interest detected',
          whaleCount: patterns.whaleCount,
          averageTradeSize: patterns.averageTradeSize
        });
      }

      if (signals.length > 0) {
        console.log(`[CABALSPY] 🎯 Copy trade signals: ${signals.length} signals generated`);
        this.emit('copyTradeSignals', {
          tokenAddress,
          signals,
          patterns,
          timestamp: Date.now()
        });
        return signals;
      }

      return null;
    } catch (error) {
      console.log(`[CABALSPY] ❌ Error generating signals: ${error.message}`);
      return null;
    }
  }

  /**
   * Get comprehensive whale analysis
   */
  async getWhaleAnalysis(tokenAddress) {
    try {
      // Get whale activity and token flow in parallel
      const [whaleActivity, tokenFlow] = await Promise.all([
        this.getWhaleActivity(tokenAddress),
        this.getTokenFlow(tokenAddress)
      ]);

      // Analyze patterns
      const patterns = this.analyzeWhalePatterns(tokenAddress);
      
      // Generate copy trade signals
      const signals = this.generateCopyTradeSignals(tokenAddress);

      const analysis = {
        tokenAddress,
        whaleActivity,
        tokenFlow,
        patterns,
        signals,
        timestamp: Date.now()
      };

      console.log(`[CABALSPY] 📊 Complete analysis for ${tokenAddress}`);
      return analysis;
    } catch (error) {
      console.log(`[CABALSPY] ❌ Error in whale analysis: ${error.message}`);
      return {
        tokenAddress,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

export const cabalspyIntegration = new CabalspyIntegration(); 