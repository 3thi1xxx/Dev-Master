import axios from 'axios';

export class GatewayOptimizer {
  constructor() {
    this.gateways = new Map();
    this.bestGateway = null;
    this.lastOptimization = 0;
    this.optimizationInterval = 300000; // 5 minutes
    this.logger = console;
    
    // Known gateways from DevTools intel
    this.knownGateways = [
      {
        name: 'frankfurt',
        url: 'axiom-fra.gateway.astralane.io',
        region: 'EU',
        apiKey: 'AxiomozyNSTbBlP88VY35BvSdDVS3du1be8Q1VMmconPgpWFVWnpmfnpUrhRj97F'
      }
    ];
    
    // CONFIRMED from Axiom CSP headers - Astralane is their CDN provider!
    this.predictedGateways = [
      { name: 'auckland', url: 'axiom-akl.gateway.astralane.io', region: 'OCEANIA', priority: 1 },
      { name: 'singapore', url: 'axiom-sin.gateway.astralane.io', region: 'ASIA', priority: 2 },
      { name: 'us-east', url: 'axiom-use.gateway.astralane.io', region: 'US-EAST', priority: 3 },
      { name: 'us-west', url: 'axiom-usw.gateway.astralane.io', region: 'US-WEST', priority: 4 },
      { name: 'london', url: 'axiom-lon.gateway.astralane.io', region: 'EUROPE', priority: 5 },
      { name: 'frankfurt-alt', url: 'axiom-fra.gateway.astralane.io', region: 'EUROPE', priority: 6 }
    ];
    
    // Additional Axiom infrastructure from CSP analysis
    this.axiomInfrastructure = {
      coreEndpoints: [
        'axiom.trade',
        'api6.axiom.trade',
        'eucalyptus.axiom.trade', 
        'cluster7.axiom.trade'
      ],
      websocketEndpoints: [
        'wss://eucalyptus.axiom.trade/ws',
        'wss://cluster7.axiom.trade/'
      ],
      rpcProviders: [
        'https://mainnet.helius-rpc.com',
        'wss://mainnet.helius-rpc.com'
      ],
      mevProviders: [
        'https://*.jito.wtf'
      ],
      socialIntel: [
        'https://www.tiktok.com',
        'https://*.instagram.com', 
        'https://*.twitch.tv',
        'https://*.truthsocial.com'
      ],
      tradingIntel: [
        'https://*.cabalspy.xyz',
        'https://*.bubblemaps.io',
        'https://*.insightx.network',
        'https://faster100x.com'
      ]
    };
  }

  async init() {
    this.logger.log('[GATEWAY] 🌐 Initializing gateway optimizer...');
    await this.discoverGateways();
    await this.optimizeGatewaySelection();
    this.logger.log(`[GATEWAY] ✅ Best gateway: ${this.bestGateway?.name} (${this.bestGateway?.latency}ms)`);
  }

  async discoverGateways() {
    this.logger.log('[GATEWAY] 🔍 Discovering available gateways...');
    
    const allGateways = [...this.knownGateways, ...this.predictedGateways];
    const discoveries = await Promise.allSettled(
      allGateways.map(gateway => this.testGateway(gateway))
    );

    let discovered = 0;
    discoveries.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const gateway = allGateways[index];
        this.gateways.set(gateway.name, result.value);
        discovered++;
        this.logger.log(`[GATEWAY] ✅ ${gateway.name}: ${result.value.latency}ms`);
      }
    });

    this.logger.log(`[GATEWAY] 📊 Discovered ${discovered}/${allGateways.length} gateways`);
  }

  async testGateway(gateway) {
    try {
      const startTime = Date.now();
      
      const response = await axios.get(`https://${gateway.url}/gethealth`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://axiom.trade',
          'Referer': 'https://axiom.trade/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        params: gateway.apiKey ? { 'api-key': gateway.apiKey } : {},
        validateStatus: () => true // Accept any status for testing
      });

      const latency = Date.now() - startTime;
      
      return {
        ...gateway,
        latency,
        status: response.status,
        available: response.status < 500,
        tested: Date.now(),
        health: response.status === 200 ? 'healthy' : 'degraded'
      };
    } catch (error) {
      return null;
    }
  }

  async optimizeGatewaySelection() {
    if (this.gateways.size === 0) {
      this.logger.log('[GATEWAY] ⚠️ No gateways available');
      return;
    }

    // Find best gateway by latency and health
    let best = null;
    let bestScore = Infinity;

    for (const [name, gateway] of this.gateways) {
      if (!gateway.available) continue;
      
      // Score = latency + health penalty
      const healthPenalty = gateway.health === 'healthy' ? 0 : 100;
      const score = gateway.latency + healthPenalty;
      
      if (score < bestScore) {
        bestScore = score;
        best = gateway;
      }
    }

    this.bestGateway = best;
    this.lastOptimization = Date.now();
  }

  getBestGateway() {
    // Re-optimize if needed
    if (Date.now() - this.lastOptimization > this.optimizationInterval) {
      this.optimizeGatewaySelection().catch(console.error);
    }
    
    return this.bestGateway;
  }

  getOptimalBaseURL() {
    const gateway = this.getBestGateway();
    return gateway ? `https://${gateway.url}` : 'https://api9.axiom.trade';
  }

  async forceReoptimize() {
    this.logger.log('[GATEWAY] 🔄 Force re-optimizing gateways...');
    await this.discoverGateways();
    await this.optimizeGatewaySelection();
    
    if (this.bestGateway) {
      this.logger.log(`[GATEWAY] 🎯 New optimal gateway: ${this.bestGateway.name} (${this.bestGateway.latency}ms)`);
    }
    
    return this.bestGateway;
  }

  getGatewayStats() {
    const gateways = Array.from(this.gateways.values());
    return {
      total: gateways.length,
      available: gateways.filter(g => g.available).length,
      healthy: gateways.filter(g => g.health === 'healthy').length,
      avgLatency: gateways.reduce((sum, g) => sum + g.latency, 0) / gateways.length || 0,
      best: this.bestGateway?.name || 'none',
      bestLatency: this.bestGateway?.latency || 0
    };
  }

  // Method to integrate with existing Axiom connector
  getOptimalAxiomConfig() {
    const gateway = this.getBestGateway();
    if (!gateway) return null;

    return {
      baseURL: `https://${gateway.url}`,
      timeout: Math.max(5000, gateway.latency * 10), // Dynamic timeout
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://axiom.trade',
        'Referer': 'https://axiom.trade/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      params: gateway.apiKey ? { 'api-key': gateway.apiKey } : {},
      region: gateway.region,
      latency: gateway.latency,
      health: gateway.health
    };
  }
}

export default GatewayOptimizer; 