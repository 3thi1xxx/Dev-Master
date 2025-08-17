/**
 * Axiom API6 Client
 * Modernized client for api6.axiom.trade with wallet-nonce authentication
 * Resurrects functionality from axiom-sniper/fetchTrending.js and axiom-latency-check.js
 */
import { performHandshake } from './AxiomHandshake.js';

export class AxiomAPI6Client {
  constructor({ walletAddress, privKeyBase58, logger = console }) {
    this.walletAddress = walletAddress;
    this.privKeyBase58 = privKeyBase58;
    this.logger = logger;
    this.session = null;
    this.baseUrl = 'https://api6.axiom.trade';
  }

  /**
   * Ensure we have a valid session
   */
  async ensureAuthenticated() {
    if (!this.session) {
      this.logger.log('[API6] Performing handshake...');
      this.session = await performHandshake({
        walletAddress: this.walletAddress,
        privKeyBase58: this.privKeyBase58,
        logger: this.logger
      });
      this.logger.log('[API6] Authenticated successfully');
    }
    return this.session;
  }

  /**
   * Make authenticated request to API6
   */
  async request(path, options = {}) {
    await this.ensureAuthenticated();
    
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Cookie': `auth-access-token=${this.session.authToken}`,
      ...options.headers
    };

    const resp = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      ...options
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`API6 request failed: ${resp.status} - ${errorText}`);
    }

    return resp.json();
  }

  /**
   * Get trending meme tokens (resurrects fetchTrending.js functionality)
   */
  async getTrendingTokens(timePeriod = '1h') {
    this.logger.log(`[API6] Fetching trending tokens for ${timePeriod}`);
    const data = await this.request(`/meme-trending?timePeriod=${timePeriod}`);
    this.logger.log(`[API6] Got ${data.length} trending tokens`);
    return data;
  }

  /**
   * Test API latency (resurrects axiom-latency-check.js functionality)
   */
  async testLatency() {
    const start = Date.now();
    try {
      await this.getTrendingTokens();
      const ms = Date.now() - start;
      this.logger.log(`[API6] Latency: ${ms}ms`);
      return { success: true, latency: ms };
    } catch (err) {
      const ms = Date.now() - start;
      this.logger.error(`[API6] Latency test failed after ${ms}ms:`, err.message);
      return { success: false, latency: ms, error: err.message };
    }
  }

  /**
   * Get account value
   */
  async getTotalAccountValue() {
    this.logger.log('[API6] Fetching total account value');
    return this.request('/total-account-value-v2');
  }

  /**
   * Get wallet token accounts  
   */
  async getWalletTokenAccounts() {
    this.logger.log('[API6] Fetching wallet token accounts');
    return this.request('/api/batched-wallet-token-accounts');
  }

  /**
   * Filter trending tokens using legacy criteria (from fetchTrending.js)
   */
  filterTrendingTokens(tokens) {
    const now = Date.now();
    
    return tokens.filter(token => {
      const createdAt = new Date(token.createdAt).getTime();
      const ageMinutes = (now - createdAt) / (1000 * 60);
      
      const liquidity = token.liquiditySol ?? 0;
      const volume = token.volumeSol ?? 0;
      const marketCap = token.marketCapSol ?? 0;
      const top10Holders = token.top10Holders ?? 100;
      const protocol = token.protocol || '';
      const pairData = token.pairRecentData || [];

      this.logger.log(
        `[API6] ${token.tokenSymbol || 'Unnamed'} | Age: ${Math.round(ageMinutes)}min | ` +
        `Liq: ${liquidity} | Vol: ${volume} | MC: ${marketCap} | Top10: ${top10Holders}% | ` +
        `Pairs: ${pairData.length} | Protocol: ${protocol}`
      );

      return (
        ageMinutes <= 20 &&
        liquidity >= 100 &&
        volume >= 150 &&
        (volume / liquidity) >= 0.25 &&
        marketCap >= 1000 &&
        marketCap <= 300000 &&
        top10Holders <= 30 &&
        protocol === 'Raydium CPMM' &&
        pairData.length > 0
      );
    });
  }

  /**
   * Rank filtered tokens by score (from fetchTrending.js)
   */
  rankTokens(tokens) {
    return tokens.map(t => {
      const ageMin = (Date.now() - new Date(t.createdAt)) / 60000;
      const ageFactor = Math.max(0.5, 15 - ageMin) / 15;
      const score = (((t.volumeSol ?? 0) / (t.liquiditySol ?? 1)) * 100) * ageFactor;
      return { ...t, score: Math.round(score * 100) / 100 };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Get filtered and ranked trending tokens (complete flow)
   */
  async getFilteredTrendingTokens(timePeriod = '1h') {
    const tokens = await this.getTrendingTokens(timePeriod);
    const filtered = this.filterTrendingTokens(tokens);
    const ranked = this.rankTokens(filtered);
    
    this.logger.log(`[API6] Filtered ${tokens.length} → ${filtered.length} → ${ranked.length} ranked tokens`);
    return ranked;
  }
}

export default AxiomAPI6Client; 