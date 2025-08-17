/**
 * Simple Pipeline Runner - Minimal working build
 */
import ResurrectionPipeline from '../pipelines/ResurrectionPipeline.js';

async function main() {
  console.log('[RUNNER] Starting minimal pipeline...');
  
  const pipeline = new ResurrectionPipeline();
  
  try {
    await pipeline.start();
  } catch (error) {
    console.error('[RUNNER] Pipeline failed to start:', error.message);
    process.exit(1);
  }
}

main(); 