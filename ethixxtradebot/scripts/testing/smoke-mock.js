/**
 * Smoke test for mock pipeline - runs for 5 seconds then exits
 */
import ResurrectionPipeline from '../pipelines/ResurrectionPipeline.js';

console.log('[SMOKE] Starting 5-second mock pipeline test...');

const pipeline = new ResurrectionPipeline();

// Start the pipeline
pipeline.start().catch(error => {
  console.error('[SMOKE] Pipeline failed to start:', error);
  process.exit(1);
});

// Stop after 5 seconds
setTimeout(() => {
  console.log('\n[SMOKE] 5 seconds elapsed, stopping pipeline...');
  pipeline.stop();
  console.log('[SMOKE] Smoke test completed successfully ✅');
  process.exit(0);
}, 5000); 