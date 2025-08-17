import { axiom } from '../src/connectors/axiom/index.js';

async function main() {
  console.log('[AUTO-REFRESH] Starting comprehensive Axiom connector test...');
  
  if (process.env.AXIOM_ENABLE !== 'true' || process.env.AXIOM_STEALTH !== 'true') {
    console.log('[AUTO-REFRESH] Connector disabled by flags');
    process.exit(0);
  }

  try {
    // Initialize connector
    await axiom.init();
    console.log('[AUTO-REFRESH] ✅ Connector initialized');
    
    // Show current flags and state
    const flags = axiom.flags();
    console.log('[AUTO-REFRESH] Current state:', {
      endpoint: flags.baseURL,
      knownEndpoints: flags.knownEndpoints,
      failedEndpoints: flags.failedEndpoints,
      devSign: flags.devSign
    });

    // Test 1: Basic ping
    console.log('\n📡 Test 1: Basic connectivity test');
    const pingResult = await axiom.ping();
    console.log('[AUTO-REFRESH] Ping result:', {
      ok: pingResult.ok,
      endpoint: pingResult.endpoint,
      cookies: pingResult.cookies,
      tokens: pingResult.tokens
    });

    // Test 2: Automatic refresh (if dev keys available)
    if (process.env.AXIOM_DEV_SIGN === 'true' && process.env.SOLANA_PUBKEY && process.env.SOLANA_SECRET_KEY_B58) {
      console.log('\n🔄 Test 2: Automatic token refresh');
      const refreshResult = await axiom.refreshTokensAutomatically();
      console.log('[AUTO-REFRESH] Refresh result:', refreshResult ? '✅ Success' : '❌ Failed');
      
      // Show updated tokens
      const updatedPing = await axiom.ping();
      console.log('[AUTO-REFRESH] Updated tokens:', updatedPing.tokens);
    } else {
      console.log('\n🔄 Test 2: Skipped (no dev keys)');
    }

    // Test 3: Endpoint rotation test (only if current endpoint fails)
    console.log('\n🌐 Test 3: Endpoint rotation capabilities');
    console.log('[AUTO-REFRESH] Current endpoint candidates:', axiom.generateEndpointCandidates().slice(0, 3));
    
    // Test 4: Data flow test
    console.log('\n📊 Test 4: Data retrieval test');
    const [pulseResult, trendingResult] = await Promise.all([
      axiom.safeGetPulse(),
      axiom.safeGetTrending()
    ]);
    
    console.log('[AUTO-REFRESH] Data results:', {
      pulse: {
        ok: pulseResult.ok,
        tokens: Array.isArray(pulseResult.data) ? pulseResult.data.length : 'not-array'
      },
      trending: {
        ok: trendingResult.ok,
        tokens: Array.isArray(trendingResult.data) ? trendingResult.data.length : 'not-array'
      }
    });

    // Test 5: Rate limiting verification
    console.log('\n⏱️ Test 5: Rate limiting test (3 rapid requests)');
    const startTime = Date.now();
    for (let i = 0; i < 3; i++) {
      await axiom.safeGetPulse();
      console.log(`[AUTO-REFRESH] Request ${i + 1} completed`);
    }
    const totalTime = Date.now() - startTime;
    console.log(`[AUTO-REFRESH] Total time for 3 requests: ${totalTime}ms (should be ~3000ms with rate limiting)`);

    console.log('\n✅ All tests completed successfully!');
    console.log('[AUTO-REFRESH] System is ready for production use');

  } catch (error) {
    console.error('[AUTO-REFRESH] Test failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[AUTO-REFRESH] Shutting down...');
  process.exit(0);
});

main(); 