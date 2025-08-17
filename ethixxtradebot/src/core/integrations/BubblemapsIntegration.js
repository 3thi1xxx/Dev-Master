import { EventEmitter } from 'node:events';
import fetch from 'node-fetch';

export class BubblemapsIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      baseUrl: 'https://api.bubblemaps.io',
      enabled: options.enabled !== false,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: 3
    };
    this.cache = new Map();
    this.flowData = new Map();
    
    console.log('🫧 BUBBLEMAPS INTEGRATION INITIALIZED');
    console.log(`🔗 Base URL: ${this.config.baseUrl}`);
    console.log(`📊 Free token flow analysis: ENABLED`);
  }

  /**
   * Get token holder visualization
   */
  async getTokenHolders(tokenAddress) {
    try {
      const cacheKey = `holders_${tokenAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }

      // Free API endpoint for token holders
      const response = await fetch(`${this.config.baseUrl}/v1/token/holders/${tokenAddress}`, {
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

        console.log(`[BUBBLEMAPS] ✅ Token holders for ${tokenAddress}: ${data.holders?.length || 0} holders`);
        return data;
      } else {
        console.log(`[BUBBLEMAPS] ⚠️ No holder data for ${tokenAddress} (${response.status})`);
        return { holders: [], distribution: {} };
      }
    } catch (error) {
      console.log(`[BUBBLEMAPS] ❌ Error getting token holders: ${error.message}`);
      return { holders: [], distribution: {}, error: error.message };
    }
  }

  /**
   * Get token flow analysis
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

        // Update flow data
        this.flowData.set(tokenAddress, data);

        console.log(`[BUBBLEMAPS] ✅ Token flow for ${tokenAddress}: ${data.flows?.length || 0} flows`);
        return data;
      } else {
        console.log(`[BUBBLEMAPS] ⚠️ No flow data for ${tokenAddress} (${response.status})`);
        return { flows: [], analysis: {} };
      }
    } catch (error) {
      console.log(`[BUBBLEMAPS] ❌ Error getting token flow: ${error.message}`);
      return { flows: [], analysis: {}, error: error.message };
    }
  }

  /**
   * Analyze token flow patterns
   */
  analyzeFlowPatterns(tokenAddress) {
    try {
      const flowData = this.flowData.get(tokenAddress);
      if (!flowData || !flowData.flows) {
        return { risk: 'unknown', confidence: 0, patterns: [] };
      }

      const flows = flowData.flows;
      const analysis = {
        risk: 'unknown',
        confidence: 0,
        patterns: [],
        totalFlows: flows.length,
        buyFlows: 0,
        sellFlows: 0,
        whaleFlows: 0
      };

      // Analyze flow patterns
      flows.forEach(flow => {
        if (flow.type === 'buy') analysis.buyFlows++;
        if (flow.type === 'sell') analysis.sellFlows++;
        if (flow.amount > 1) analysis.whaleFlows++; // Whale flow threshold
      });

      // Determine risk level
      const buyRatio = analysis.buyFlows / Math.max(analysis.totalFlows, 1);
      const whaleRatio = analysis.whaleFlows / Math.max(analysis.totalFlows, 1);

      if (buyRatio > 0.7 && whaleRatio > 0.3) {
        analysis.risk = 'low';
        analysis.confidence = Math.min(0.8, buyRatio + whaleRatio);
        analysis.patterns.push('Strong buying pressure with whale accumulation');
      } else if (buyRatio > 0.6) {
        analysis.risk = 'medium';
        analysis.confidence = Math.min(0.6, buyRatio);
        analysis.patterns.push('Moderate buying pressure');
      } else if (buyRatio < 0.4) {
        analysis.risk = 'high';
        analysis.confidence = Math.min(0.7, 1 - buyRatio);
        analysis.patterns.push('Selling pressure detected');
      } else {
        analysis.risk = 'medium';
        analysis.confidence = 0.5;
        analysis.patterns.push('Mixed flow patterns');
      }

      console.log(`[BUBBLEMAPS] 🧠 Flow analysis: ${analysis.risk} risk (${(analysis.confidence * 100).toFixed(1)}% confidence)`);
      return analysis;
    } catch (error) {
      console.log(`[BUBBLEMAPS] ❌ Error analyzing flow patterns: ${error.message}`);
      return { risk: 'unknown', confidence: 0, patterns: [], error: error.message };
    }
  }

  /**
   * Assess token risk based on holder distribution
   */
  async assessTokenRisk(tokenAddress) {
    try {
      const [holders, flowAnalysis] = await Promise.all([
        this.getTokenHolders(tokenAddress),
        this.analyzeFlowPatterns(tokenAddress)
      ]);

      const riskAssessment = {
        tokenAddress,
        overallRisk: 'unknown',
        confidence: 0,
        factors: [],
        holderDistribution: {},
        flowAnalysis: flowAnalysis
      };

      // Analyze holder distribution
      if (holders.holders && holders.holders.length > 0) {
        const totalHolders = holders.holders.length;
        const topHolders = holders.holders.slice(0, 10);
        const topHolderPercentage = topHolders.reduce((sum, holder) => sum + (holder.percentage || 0), 0);

        riskAssessment.holderDistribution = {
          totalHolders,
          topHolderPercentage,
          concentrationRisk: topHolderPercentage > 50 ? 'high' : topHolderPercentage > 30 ? 'medium' : 'low'
        };

        // Add risk factors
        if (topHolderPercentage > 70) {
          riskAssessment.factors.push('Extremely concentrated holder distribution');
        } else if (topHolderPercentage > 50) {
          riskAssessment.factors.push('Highly concentrated holder distribution');
        } else if (topHolderPercentage < 20) {
          riskAssessment.factors.push('Well-distributed holder base');
        }
      }

      // Combine flow and holder analysis
      const flowRisk = flowAnalysis.risk === 'high' ? 3 : flowAnalysis.risk === 'medium' ? 2 : 1;
      const holderRisk = riskAssessment.holderDistribution.concentrationRisk === 'high' ? 3 : 
                        riskAssessment.holderDistribution.concentrationRisk === 'medium' ? 2 : 1;
      
      const combinedRisk = (flowRisk + holderRisk) / 2;
      
      if (combinedRisk >= 2.5) {
        riskAssessment.overallRisk = 'high';
        riskAssessment.confidence = Math.max(flowAnalysis.confidence, 0.6);
      } else if (combinedRisk >= 1.5) {
        riskAssessment.overallRisk = 'medium';
        riskAssessment.confidence = Math.max(flowAnalysis.confidence, 0.5);
      } else {
        riskAssessment.overallRisk = 'low';
        riskAssessment.confidence = Math.max(flowAnalysis.confidence, 0.4);
      }

      console.log(`[BUBBLEMAPS] 🛡️ Risk assessment: ${riskAssessment.overallRisk} risk (${(riskAssessment.confidence * 100).toFixed(1)}% confidence)`);
      return riskAssessment;
    } catch (error) {
      console.log(`[BUBBLEMAPS] ❌ Error in risk assessment: ${error.message}`);
      return {
        tokenAddress,
        overallRisk: 'unknown',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive token analysis
   */
  async getTokenAnalysis(tokenAddress) {
    try {
      // Get all data in parallel
      const [holders, flowData, riskAssessment] = await Promise.all([
        this.getTokenHolders(tokenAddress),
        this.getTokenFlow(tokenAddress),
        this.assessTokenRisk(tokenAddress)
      ]);

      const analysis = {
        tokenAddress,
        holders,
        flowData,
        riskAssessment,
        timestamp: Date.now()
      };

      console.log(`[BUBBLEMAPS] 📊 Complete analysis for ${tokenAddress}`);
      return analysis;
    } catch (error) {
      console.log(`[BUBBLEMAPS] ❌ Error in token analysis: ${error.message}`);
      return {
        tokenAddress,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

export const bubblemapsIntegration = new BubblemapsIntegration(); 