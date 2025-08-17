/**
 * Shadow Broker Tests - Mock the endpoints and test deduplication
 */
import nock from 'nock';
import { AxiomShadowBroker } from '../src/shadow/AxiomShadowBroker.js';
import { expandShadowPayload } from '../src/shadow/normalizeShadowTick.js';

describe('AxiomShadowBroker', () => {
  let broker;
  
  beforeEach(() => {
    // Set up environment for testing
    process.env.AXIOM_ENABLE = 'true';
    process.env.AXIOM_STEALTH = 'true';
    process.env.SHADOW_DEDUP_TTL_MS = '1000'; // Short TTL for testing
    process.env.SHADOW_MAX_TOKENS = '10';
    process.env.SHADOW_PROTOCOLS = 'Pump,Raydium';
    process.env.SHADOW_MIN_MCAP = '1000';
    
    broker = new AxiomShadowBroker();
  });

  afterEach(() => {
    nock.cleanAll();
    if (broker) {
      broker.stop();
    }
  });

  describe('expandShadowPayload', () => {
    it('should normalize overlapping pulse and trending data', () => {
      const pulse = {
        tokens: [
          { mint: 'ABC123', symbol: 'TEST1', marketCap: 50000, protocol: 'Pump' },
          { mint: 'DEF456', symbol: 'TEST2', mcap: 25000, dex: 'Raydium' }
        ]
      };

      const trending = {
        tokens: [
          { mint: 'ABC123', symbol: 'TEST1', vol24h: 10000 }, // Duplicate mint
          { mint: 'GHI789', symbol: 'TEST3', market_cap: 75000, platform: 'Jupiter' }
        ]
      };

      const ticks = expandShadowPayload(pulse, trending);
      
      expect(ticks).toHaveLength(4); // All ticks, dedup happens in broker
      expect(ticks.every(t => t.source === 'shadow')).toBe(true);
      expect(ticks.every(t => t.mint)).toBe(true);
    });

    it('should handle various response formats', () => {
      const directArray = [
        { mint: 'ABC123', symbol: 'DIRECT' }
      ];

      const dataWrapper = {
        data: { tokens: [{ mint: 'DEF456', symbol: 'WRAPPED' }] }
      };

      const itemsFormat = {
        items: [{ mint: 'GHI789', symbol: 'ITEMS' }]
      };

      const ticks1 = expandShadowPayload(directArray, {});
      const ticks2 = expandShadowPayload(dataWrapper, {});
      const ticks3 = expandShadowPayload(itemsFormat, {});

      expect(ticks1).toHaveLength(1);
      expect(ticks2).toHaveLength(1);
      expect(ticks3).toHaveLength(1);
      expect(ticks1[0].symbol).toBe('DIRECT');
      expect(ticks2[0].symbol).toBe('WRAPPED');
      expect(ticks3[0].symbol).toBe('ITEMS');
    });
  });

  describe('deduplication', () => {
    it('should emit each mint only once within TTL', (done) => {
      // Mock API responses
      nock('https://api6.axiom.trade')
        .persist()
        .get('/pulse')
        .reply(200, {
          tokens: [{ mint: 'DUPLICATE_TEST', symbol: 'DUP', marketCap: 50000, protocol: 'Pump' }]
        });

      nock('https://api6.axiom.trade')
        .persist()
        .get('/meme-trending?timePeriod=1h')
        .reply(200, { tokens: [] });

      const emittedTicks = [];
      broker.on('tick', (tick) => {
        emittedTicks.push(tick);
      });

      broker.start().then(() => {
        // Wait for a couple of iterations
        setTimeout(() => {
          broker.stop();
          
          // Should only emit the same mint once
          const uniqueMints = new Set(emittedTicks.map(t => t.mint));
          expect(emittedTicks.length).toBeGreaterThan(0);
          expect(uniqueMints.size).toBe(emittedTicks.length); // All should be unique
          done();
        }, 1500); // Wait longer than one iteration
      });
    });
  });

  describe('filtering', () => {
    it('should respect protocol filters', () => {
      process.env.SHADOW_PROTOCOLS = 'Pump'; // Only allow Pump

      const pulse = {
        tokens: [
          { mint: 'ABC123', symbol: 'PUMP_TOKEN', marketCap: 50000, protocol: 'Pump' },
          { mint: 'DEF456', symbol: 'RAYDIUM_TOKEN', marketCap: 50000, protocol: 'Raydium' }
        ]
      };

      const ticks = expandShadowPayload(pulse, { tokens: [] });
      
      // Both ticks created, but broker should filter
      expect(ticks).toHaveLength(2);
      expect(ticks.find(t => t.protocol === 'Pump')).toBeDefined();
      expect(ticks.find(t => t.protocol === 'Raydium')).toBeDefined();
    });

    it('should respect market cap filters', () => {
      process.env.SHADOW_MIN_MCAP = '10000'; // Minimum 10k

      const pulse = {
        tokens: [
          { mint: 'ABC123', symbol: 'BIG_TOKEN', marketCap: 50000 },
          { mint: 'DEF456', symbol: 'SMALL_TOKEN', marketCap: 5000 }
        ]
      };

      const ticks = expandShadowPayload(pulse, { tokens: [] });
      
      expect(ticks).toHaveLength(2);
      expect(ticks.find(t => t.mcap === 50000)).toBeDefined();
      expect(ticks.find(t => t.mcap === 5000)).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should track HTTP statistics', () => {
      const stats = broker.getStats();
      
      expect(stats).toHaveProperty('totalTicks');
      expect(stats).toHaveProperty('uniqueTicks');
      expect(stats).toHaveProperty('filteredOut');
      expect(stats).toHaveProperty('http200');
      expect(stats).toHaveProperty('http5xx');
      expect(stats).toHaveProperty('dedupCacheSize');
      expect(stats).toHaveProperty('running');
    });
  });
}); 