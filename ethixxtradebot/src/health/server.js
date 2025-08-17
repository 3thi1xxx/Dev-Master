/**
 * Health Server - Fastify-based health and metrics endpoints
 */
import Fastify from 'fastify';
import { getCache } from '../shadow/ShadowCache.js';

/**
 * Start health server with metrics endpoints
 * @returns {Promise<Object>} Fastify app instance
 */
export async function startHealthServer() {
  const app = Fastify({ 
    logger: false,
    disableRequestLogging: true 
  });
  
  const port = Number(process.env.HEALTH_PORT || 8787);

  // Health check endpoint
  app.get('/healthz', async (request, reply) => {
    const shadowEnabled = process.env.USE_AXIOM_SHADOW === 'true';
    const cacheEnabled = process.env.USE_SHADOW_CACHE === 'true';
    
    return {
      ok: true,
      mode: shadowEnabled ? 'shadow' : 'mock',
      features: {
        shadow: shadowEnabled,
        cache: cacheEnabled,
        redis: cacheEnabled ? await testRedisConnection() : false
      },
      ts: Date.now()
    };
  });

  // Metrics endpoint with Redis stream data
  app.get('/metrics', async (request, reply) => {
    try {
      const cache = getCache();
      if (!cache) {
        return {
          enabled: false,
          ticks: null,
          quotes: null,
          error: 'Cache disabled',
          ts: Date.now()
        };
      }

      const metrics = await cache.getMetrics();
      const isConnected = cache.isOperational();
      
      return {
        enabled: true,
        connected: isConnected,
        streams: {
          ticks: metrics.ticks,
          quotes: metrics.quotes,
          ticksStream: cache.ticksStream,
          quotesStream: cache.quotesStream
        },
        ts: Date.now()
      };
    } catch (error) {
      return {
        enabled: true,
        connected: false,
        error: error.message,
        ts: Date.now()
      };
    }
  });

  // Recent data endpoint for debugging
  app.get('/recent', async (request, reply) => {
    try {
      const cache = getCache();
      if (!cache) {
        return { error: 'Cache disabled', ts: Date.now() };
      }

      const count = Number(request.query.count || 5);
      const recent = await cache.getRecent(count);
      
      return {
        ticks: recent.ticks.map(formatStreamEntry),
        quotes: recent.quotes.map(formatStreamEntry),
        count: count,
        ts: Date.now()
      };
    } catch (error) {
      return {
        error: error.message,
        ts: Date.now()
      };
    }
  });

  // Root endpoint with links
  app.get('/', async (request, reply) => {
    const baseUrl = `http://localhost:${port}`;
    return {
      service: 'Axiom Shadow Health Server',
      endpoints: [
        `${baseUrl}/healthz`,
        `${baseUrl}/metrics`,
        `${baseUrl}/recent`,
        `${baseUrl}/recent?count=10`
      ],
      ts: Date.now()
    };
  });

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`[HEALTH] Server running on http://localhost:${port}`);
    console.log(`[HEALTH] Endpoints: /healthz | /metrics | /recent`);
    return app;
  } catch (error) {
    console.error('[HEALTH] Failed to start server:', error.message);
    throw error;
  }
}

/**
 * Test Redis connection
 * @returns {Promise<boolean>} Connection status
 */
async function testRedisConnection() {
  try {
    const cache = getCache();
    return cache ? cache.isOperational() : false;
  } catch (error) {
    return false;
  }
}

/**
 * Format Redis stream entry for JSON response
 * @param {Array} entry - Redis stream entry [id, fields]
 * @returns {Object} Formatted entry
 */
function formatStreamEntry(entry) {
  if (!entry || !Array.isArray(entry) || entry.length < 2) {
    return null;
  }
  
  const [id, fields] = entry;
  const data = {};
  
  // Convert field array to object
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    data[key] = value;
  }
  
  return { id, ...data };
}

/**
 * Graceful shutdown for health server
 * @param {Object} app - Fastify app instance
 */
export async function stopHealthServer(app) {
  if (app) {
    try {
      await app.close();
      console.log('[HEALTH] Server stopped');
    } catch (error) {
      console.error('[HEALTH] Error stopping server:', error.message);
    }
  }
} 