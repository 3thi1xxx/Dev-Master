/**
 * Axiom Shadow Broker - Deduplication and filtered emission of shadow ticks
 */
import { EventEmitter } from 'node:events';
import { expandShadowPayload } from './normalizeShadowTick.js';
import { axiom } from '../connectors/axiom/index.js'; // Use the working singleton

export class AxiomShadowBroker extends EventEmitter {
  constructor() {
    super();
    this.seen = new Map(); // mint -> timestamp
    this.running = false;
    this.loopTimer = null;
    this.stats = {
      totalTicks: 0,
      filteredTicks: 0,
      emittedTicks: 0,
      httpRequests: 0,
      httpErrors: 0,
      httpSuccesses: 0
    };
  }

  async start() {
    if (this.running) return;
    this.running = true;
    
    // Initialize the working connector
    await axiom.init();
    console.log('[SHADOW:BROKER] Using working connector instance');
    
    this.loop().catch(err => {
      console.error('[SHADOW:BROKER] Loop error:', err.message);
    });
    
    this.startHealthLogging();
  }

  stop() {
    this.running = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    console.log('[SHADOW:BROKER] stopped');
  }

  async loop() {
    const dedupTTL = parseInt(process.env.SHADOW_DEDUP_TTL_MS) || 30000;
    const allowedProtocols = (process.env.SHADOW_PROTOCOLS || '').split(',').map(s => s.trim()).filter(Boolean);
    const minMcap = parseInt(process.env.SHADOW_MIN_MCAP) || 0;
    const maxTokens = parseInt(process.env.SHADOW_MAX_TOKENS) || 50;
    const pullInterval = parseInt(process.env.SHADOW_PULL_INTERVAL_MS) || 1200; // SPEED OPTIMIZED: 1.2s default

    while (this.running) {
      try {
        // Use the working connector directly (not the wrapper functions)
        const [pulseResult, trendingResult] = await Promise.all([
          axiom.safeGetPulse(),
          axiom.safeGetTrending()
        ]);

        // Update HTTP stats
        this.updateHttpStats(pulseResult);
        this.updateHttpStats(trendingResult);

        // Normalize to token ticks
        const ticks = expandShadowPayload(pulseResult, trendingResult);
        const now = Date.now();

        // Expire old entries from dedup map
        this.expireSeenEntries(now, dedupTTL);

        // Process ticks with filtering and deduplication
        let processed = 0;
        for (const tick of ticks.slice(0, maxTokens)) {
          this.stats.totalTicks++;

          // Deduplication
          if (this.seen.has(tick.mint)) {
            continue;
          }
          this.seen.set(tick.mint, now);

          // Protocol filtering
          if (allowedProtocols.length > 0 && !allowedProtocols.includes(tick.protocol)) {
            this.stats.filteredTicks++;
            continue;
          }

          // Market cap filtering
          if (tick.mcap && (tick.mcap < minMcap)) {
            this.stats.filteredTicks++;
            continue;
          }

          // Emit valid tick
          this.emit('tick', tick);
          this.stats.emittedTicks++;
          processed++;
        }

        if (processed > 0) {
          console.log(`[SHADOW:BROKER] Processed ${processed} new ticks`);
        }

      } catch (error) {
        this.stats.httpErrors++;
        console.error('[SHADOW:BROKER] Loop iteration error:', error.message);
      }

      // SPEED OPTIMIZED: Faster rate limiting for quicker detection
      if (this.running) {
        await sleep(Math.max(pullInterval, 800)); // Minimum 800ms, max based on env
      }
    }
  }

  updateHttpStats(result) {
    if (result?.code) {
      this.stats.httpRequests++;
      if (result.code === 200) {
        this.stats.httpSuccesses++;
      } else {
        this.stats.httpErrors++;
      }
    }
  }

  expireSeenEntries(now, ttl) {
    for (const [key, timestamp] of [...this.seen.entries()]) {
      if (now - timestamp > ttl) {
        this.seen.delete(key);
      }
    }
  }

  startHealthLogging() {
    const healthInterval = 30000; // 30 seconds
    
    const logHealth = () => {
      if (!this.running) return;
      
      const uniqueCount = this.seen.size;
      console.log(
        `[HEALTH] shadow:on ticks=${this.stats.totalTicks} uniq=${uniqueCount} filtered=${this.stats.filteredTicks} ` +
        `emitted=${this.stats.emittedTicks} http-req=${this.stats.httpRequests} err=${this.stats.httpErrors}`
      );
      
      if (this.running) {
        setTimeout(logHealth, healthInterval);
      }
    };

    setTimeout(logHealth, healthInterval);
  }

  async initCache() {
    if (process.env.USE_SHADOW_CACHE === 'true') {
      try {
        const { initCache } = await import('./ShadowCache.js');
        // This part of the code was removed from the new_code, so it's removed here.
        // If cache functionality is needed, it should be re-added based on the new_code.
        // For now, the cache initialization is removed as per the new_code.
      } catch (error) {
        console.warn('[SHADOW:BROKER] Cache initialization failed:', error.message);
      }
    }
  }

  async closeCache() {
    // This part of the code was removed from the new_code, so it's removed here.
    // If cache functionality is needed, it should be re-added based on the new_code.
    // For now, the cache close is removed as per the new_code.
  }

  getStats() {
    return {
      ...this.stats,
      dedupCacheSize: this.seen.size,
      cacheEnabled: false, // Cache is removed, so it's always false
      running: this.running
    };
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 