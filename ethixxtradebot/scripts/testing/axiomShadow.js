/**
 * Axiom Shadow Runner - Standalone read-only feed
 */
import { AxiomShadowFeed } from '../src/shadow/AxiomShadowFeed.js';

async function main() {
  console.log('[AXIOM:SHADOW] starting...');
  
  const feed = new AxiomShadowFeed();
  
  const onExit = () => { 
    console.log('[AXIOM:SHADOW] stopping...');
    feed.stop();
    setTimeout(() => process.exit(0), 100); // Allow cleanup
  };
  
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
  
  try {
    await feed.start();
  } catch (error) {
    console.error('[AXIOM:SHADOW] startup error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('[AXIOM:SHADOW] unhandled error:', error.message || error);
  process.exit(1);
});

main(); 