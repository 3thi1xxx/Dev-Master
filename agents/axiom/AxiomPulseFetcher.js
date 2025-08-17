/**
 * AxiomPulseFetcher - Fetches pulse data from Axiom APIs with mock mode support
 */
import env from '../../utils/env.js';

const MOCK_SEEDS = [
  { symbol: 'BONK', stage: 'migrated', mcap: 450000, insiders: 5, bundlers: 3, mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', ageMinutes: 12, protocol: 'Raydium' }, // Real BONK mint - FIRST for Jupiter testing (reduced mcap to pass filters)
  { symbol: 'CP_PIC', stage: 'final-stretch', mcap: 12000, insiders: 5, bundlers: 3 },
  { symbol: 'BOSS', stage: 'migrated', mcap: 130000, insiders: 7, bundlers: 8 },
  { symbol: 'MOON', stage: 'migrated', mcap: 250000, insiders: 12, bundlers: 15 },
  { symbol: 'DOGE2', stage: 'final-stretch', mcap: 15000, insiders: 6, bundlers: 4 },
  { symbol: 'PEPE3', stage: 'migrated', mcap: 180000, insiders: 9, bundlers: 11 },
  { symbol: 'SHIB_V2', stage: 'final-stretch', mcap: 22000, insiders: 8, bundlers: 6 },
  { symbol: 'FLOKI', stage: 'migrated', mcap: 320000, insiders: 15, bundlers: 18 }
];

export function startMockStream(onRow) {
  const tick = () => {
    const s = MOCK_SEEDS[mockIndex % MOCK_SEEDS.length];
    const row = {
      mint: s.mint || `MockMint${mockIndex.toString().padStart(6, '0')}`,
      symbol: s.symbol,
      stage: s.stage,
      marketCap: s.mcap + (mockIndex % 3) * 1000,
      insidersPercent: s.insiders,
      bundlersPercent: s.bundlers,
      ageMinutes: s.ageMinutes !== undefined ? s.ageMinutes : (mockIndex % 15),
      protocol: s.protocol || (mockIndex % 2 ? 'Pump' : 'Bonk'),
      timestamp: new Date().toISOString()
    };
    onRow(row);
    mockIndex += 1;
  };

  // Send initial batch
  for (let k = 0; k < 5; k++) tick();
  
  // Continue streaming every second
  return setInterval(tick, 1000);
}

let mockIndex = 0;

export class AxiomPulseFetcher {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.mockInterval = null;
  }

  async start(onRow) {
    if (env.USE_MOCK_DATA) {
      this.logger.log('[PULSE] Starting mock data stream...');
      this.mockInterval = startMockStream(onRow);
      return this.mockInterval;
    } else {
      this.logger.log('[PULSE] Starting live data stream...');
      // TODO: Implement live API calls using stealth handshake
      throw new Error('Live mode not implemented yet - use USE_MOCK_DATA=true');
    }
  }

  stop() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
      this.logger.log('[PULSE] Mock stream stopped');
    }
  }
}

export default AxiomPulseFetcher; 