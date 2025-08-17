/**
 * Axiom Shadow Feed Tests - Mock the legacy endpoints
 */
import nock from 'nock';
import { AxiomShadowFeed } from '../src/shadow/AxiomShadowFeed.js';
import { LegacyAxiomConnector } from '../src/connectors/axiom/LegacyAxiomConnector.js';

describe('Axiom Shadow Feed', () => {
  let feed;
  
  beforeEach(() => {
    // Set up environment for testing
    process.env.AXIOM_ENABLE = 'true';
    process.env.AXIOM_STEALTH = 'true';
    process.env.AXIOM_DEV_SIGN = 'false'; // Disable dev signing for basic tests
    
    feed = new AxiomShadowFeed();
  });

  afterEach(() => {
    nock.cleanAll();
    if (feed) {
      feed.stop();
    }
  });

  describe('initialization', () => {
    it('should start and stop gracefully', async () => {
      // Mock the trending endpoint for ping
      nock('https://api6.axiom.trade')
        .get('/meme-trending?timePeriod=1h')
        .reply(200, []);

      // Mock pulse and trending for the loop
      nock('https://api6.axiom.trade')
        .get('/pulse')
        .reply(200, { tokens: [] });

      nock('https://api6.axiom.trade')
        .get('/meme-trending?timePeriod=1h')
        .reply(200, { tokens: [] });

      // Start feed (should not hang)
      await feed.start();
      expect(feed.started).toBe(true);

      // Stop feed
      feed.stop();
      expect(feed.started).toBe(false);
    });
  });

  describe('data normalization', () => {
    it('should normalize pulse and trending data correctly', () => {
      const pulseResult = {
        ok: true,
        tokens: [
          {
            mint: 'ABC123',
            symbol: 'TEST1',
            marketCap: 100000,
            volume24h: 50000,
            ageMinutes: 10,
            protocol: 'Pump'
          }
        ]
      };

      const trendingResult = {
        ok: true,
        tokens: [
          {
            mint: 'DEF456',
            symbol: 'TEST2',
            mcap: 200000,
            vol24h: 75000,
            age_minutes: 15,
            dex: 'Raydium'
          }
        ]
      };

      const ticks = feed.normalize(pulseResult, trendingResult);
      
      expect(ticks).toHaveLength(2);
      expect(ticks[0]).toMatchObject({
        mint: 'ABC123',
        symbol: 'TEST1',
        mcap: 100000,
        vol24h: 50000,
        age_minutes: 10,
        protocol: 'Pump'
      });
      expect(ticks[1]).toMatchObject({
        mint: 'DEF456',
        symbol: 'TEST2',
        mcap: 200000,
        vol24h: 75000,
        age_minutes: 15,
        protocol: 'Raydium'
      });
    });

    it('should handle empty or malformed data gracefully', () => {
      const emptyResult = { ok: false };
      const malformedResult = { ok: true, tokens: null };
      
      const ticks = feed.normalize(emptyResult, malformedResult);
      expect(ticks).toHaveLength(0);
    });

    it('should filter out entries without mint addresses', () => {
      const result = {
        ok: true,
        tokens: [
          { mint: 'ABC123', symbol: 'VALID' },
          { symbol: 'INVALID' }, // No mint
          { mint: '', symbol: 'EMPTY_MINT' }, // Empty mint
          { mint: 'DEF456', symbol: 'VALID2' }
        ]
      };

      const ticks = feed.normalize(result, { ok: true, tokens: [] });
      expect(ticks).toHaveLength(2);
      expect(ticks[0].mint).toBe('ABC123');
      expect(ticks[1].mint).toBe('DEF456');
    });
  });

  describe('API endpoints', () => {
    it('should handle pulse endpoint responses', async () => {
      const mockPulseData = {
        tokens: [
          {
            mint: 'PULSE123',
            symbol: 'PULSE',
            marketCap: 500000,
            protocol: 'Test'
          }
        ]
      };

      nock('https://api6.axiom.trade')
        .get('/pulse')
        .reply(200, mockPulseData, {
          'Set-Cookie': ['pulse_session=abc123; Path=/']
        });

      const connector = new LegacyAxiomConnector();
      const result = await connector.safeGetPulse();
      
      expect(result.ok).toBe(true);
      expect(result.code).toBe(200);
      expect(result.tokens).toEqual(mockPulseData.tokens);
    });

    it('should handle trending endpoint responses', async () => {
      const mockTrendingData = {
        tokens: [
          {
            mint: 'TREND123',
            symbol: 'TREND',
            mcap: 750000,
            dex: 'Jupiter'
          }
        ]
      };

      nock('https://api6.axiom.trade')
        .get('/meme-trending?timePeriod=1h')
        .reply(200, mockTrendingData, {
          'Set-Cookie': ['trending_session=xyz789; Path=/']
        });

      const connector = new LegacyAxiomConnector();
      const result = await connector.safeGetTrending();
      
      expect(result.ok).toBe(true);
      expect(result.code).toBe(200);
      expect(result.tokens).toEqual(mockTrendingData.tokens);
    });

    it('should handle API errors gracefully', async () => {
      nock('https://api6.axiom.trade')
        .get('/pulse')
        .reply(500, 'Internal Server Error');

      const connector = new LegacyAxiomConnector();
      const result = await connector.safeGetPulse();
      
      expect(result.ok).toBe(false);
      expect(result.code).toBe(500);
    });
  });

  describe('feature flags', () => {
    it('should respect AXIOM_ENABLE flag', async () => {
      process.env.AXIOM_ENABLE = 'false';
      
      const connector = new LegacyAxiomConnector();
      const result = await connector.safeGetPulse();
      
      expect(result).toEqual({ ok: false, reason: 'DISABLED' });
    });

    it('should respect AXIOM_STEALTH flag', async () => {
      process.env.AXIOM_STEALTH = 'false';
      
      const connector = new LegacyAxiomConnector();
      const result = await connector.safeGetTrending();
      
      expect(result).toEqual({ ok: false, reason: 'DISABLED' });
    });
  });
}); 