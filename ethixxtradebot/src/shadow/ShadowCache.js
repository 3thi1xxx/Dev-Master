/**
 * Shadow Cache - Redis-based caching for shadow ticks and quotes
 */
import Redis from 'ioredis';

export class ShadowCache {
  constructor(url = process.env.REDIS_URL) {
    this.r = new Redis(url || 'redis://127.0.0.1:6379', { 
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    this.ticksStream = process.env.CACHE_STREAM_TICKS || 'shadow:ticks';
    this.quotesStream = process.env.CACHE_STREAM_QUOTES || 'shadow:quotes';
    this.connected = false;
  }

  async connect() {
    if (this.r.status !== 'ready') {
      try {
        await this.r.connect();
        this.connected = true;
        console.log('[CACHE] Connected to Redis');
      } catch (error) {
        console.warn('[CACHE] Redis connection failed:', error.message);
        this.connected = false;
      }
    }
  }

  async close() {
    try {
      if (this.connected) {
        await this.r.quit();
        this.connected = false;
        console.log('[CACHE] Redis connection closed');
      }
    } catch (error) {
      // Silent fail on close
    }
  }

  /**
   * Publish a tick to Redis stream
   * @param {Object} tick - Token tick data
   */
  async publishTick(tick) {
    if (!this.connected) return;
    
    try {
      // Keep fields flat & compact for XADD
      const row = {
        ts: String(tick.ts || Date.now()),
        src: String(tick.source || 'shadow'),
        mint: String(tick.mint || ''),
        sym: String(tick.symbol || ''),
        mcap: String(tick.mcap || ''),
        vol24h: String(tick.vol24h || ''),
        prot: String(tick.protocol || ''),
        price: String(tick.price || ''),
      };
      
      await this.r.xadd(this.ticksStream, '*', ...this.flatten(row));
    } catch (error) {
      // Silent fail - cache issues shouldn't break the pipeline
      console.warn('[CACHE] Failed to publish tick:', error.message);
    }
  }

  /**
   * Publish a quote to Redis stream
   * @param {Object} q - Quote data
   */
  async publishQuote(q) {
    if (!this.connected) return;
    
    try {
      const row = {
        ts: String(q.ts || Date.now()),
        mint: String(q.mint || ''),
        sym: String(q.symbol || ''),
        route: String(q.route || ''),
        in: String(q.inSol || ''),
        out: String(q.outAmt || ''),
        slip: String(q.slipBps || ''),
        cu: String(q.cu || ''),
        ok: String(q.ok),
        why: String(q.reason || ''),
      };
      
      await this.r.xadd(this.quotesStream, '*', ...this.flatten(row));
    } catch (error) {
      // Silent fail - cache issues shouldn't break the pipeline
      console.warn('[CACHE] Failed to publish quote:', error.message);
    }
  }

  /**
   * Get stream lengths for metrics
   * @returns {Object} Stream lengths
   */
  async getMetrics() {
    if (!this.connected) return { ticks: null, quotes: null };
    
    try {
      const [ticks, quotes] = await Promise.all([
        this.r.xlen(this.ticksStream),
        this.r.xlen(this.quotesStream),
      ]);
      return { ticks, quotes };
    } catch (error) {
      console.warn('[CACHE] Failed to get metrics:', error.message);
      return { ticks: null, quotes: null };
    }
  }

  /**
   * Get recent entries from streams
   * @param {number} count - Number of entries to fetch
   * @returns {Object} Recent ticks and quotes
   */
  async getRecent(count = 5) {
    if (!this.connected) return { ticks: [], quotes: [] };
    
    try {
      const [ticks, quotes] = await Promise.all([
        this.r.xrevrange(this.ticksStream, '+', '-', 'COUNT', count),
        this.r.xrevrange(this.quotesStream, '+', '-', 'COUNT', count),
      ]);
      return { ticks, quotes };
    } catch (error) {
      console.warn('[CACHE] Failed to get recent entries:', error.message);
      return { ticks: [], quotes: [] };
    }
  }

  /**
   * Flatten object to array for Redis XADD
   * @param {Object} obj - Object to flatten
   * @returns {string[]} Flattened key-value array
   */
  flatten(obj) {
    const out = [];
    for (const [k, v] of Object.entries(obj)) {
      out.push(k, v);
    }
    return out;
  }

  /**
   * Check if cache is enabled and connected
   * @returns {boolean} Whether cache is operational
   */
  isOperational() {
    return this.connected && this.r.status === 'ready';
  }
}

// Singleton instance for shared use
let _instance = null;

/**
 * Get or create singleton cache instance
 * @returns {ShadowCache|null} Cache instance or null if disabled
 */
export function getCache() {
  if (process.env.USE_SHADOW_CACHE !== 'true') return null;
  
  if (!_instance) {
    _instance = new ShadowCache();
  }
  return _instance;
}

/**
 * Initialize cache if enabled
 * @returns {Promise<ShadowCache|null>} Initialized cache or null
 */
export async function initCache() {
  const cache = getCache();
  if (cache) {
    await cache.connect();
  }
  return cache;
}

/**
 * Close cache if operational
 * @returns {Promise<void>}
 */
export async function closeCache() {
  if (_instance) {
    await _instance.close();
    _instance = null;
  }
} 