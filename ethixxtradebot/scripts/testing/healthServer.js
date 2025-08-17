/**
 * Standalone Health Server - Run health endpoints independently
 */
import { startHealthServer, stopHealthServer } from '../src/health/server.js';

async function main() {
  console.log('[HEALTH] Starting standalone health server...');
  
  let server;
  
  try {
    server = await startHealthServer();
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[HEALTH] Shutting down...');
      if (server) {
        await stopHealthServer(server);
      }
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    console.log('[HEALTH] Server ready - press Ctrl+C to stop');
    
  } catch (error) {
    console.error('[HEALTH] Failed to start:', error.message);
    process.exit(1);
  }
}

main(); 