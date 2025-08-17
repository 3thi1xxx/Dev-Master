/**
 * Axiom Ping - Healthcheck script for legacy Axiom connector
 */
import { axiom } from '../src/connectors/axiom';
import { signNonceDev, validateDevSignerEnv } from '../src/connectors/axiom/devSigner';
import env from '../src/utils/env';

async function main() {
  console.log('[AXIOM] Starting healthcheck...');

  // Check feature flags
  if (process.env.AXIOM_ENABLE !== 'true' || process.env.AXIOM_STEALTH !== 'true') {
    console.log('[AXIOM] disabled by flags');
    process.exit(0);
  }

  try {
    // Initialize connector
    await axiom.init();
    console.log('[AXIOM] Connector initialized');

    // Optional: Full wallet-nonce handshake test
    if (process.env.AXIOM_DEV_SIGN === 'true' && 
        process.env.SOLANA_PUBKEY && 
        process.env.SOLANA_SECRET_KEY_B58) {
      
      console.log('[AXIOM] Testing full handshake flow...');
      
      // Validate development environment first
      const validation = validateDevSignerEnv();
      if (!validation.valid) {
        console.error('[AXIOM] Dev signer validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      try {
        // Step 1: Get nonce
        console.log('[AXIOM] 1. Requesting wallet nonce...');
        const nonceResult = await axiom.getWalletNonce(process.env.SOLANA_PUBKEY);
        
        if ('ok' in nonceResult && !nonceResult.ok) {
          console.error('[AXIOM] Nonce request failed:', nonceResult.reason);
        } else {
          const nonce = (nonceResult as any).nonce;
          console.log('[AXIOM] ✅ Nonce received:', nonce.substring(0, 8) + '...');

          // Step 2: Sign nonce
          console.log('[AXIOM] 2. Signing nonce...');
          const signature = signNonceDev(nonce, process.env.SOLANA_SECRET_KEY_B58);
          console.log('[AXIOM] ✅ Signature created:', signature.substring(0, 8) + '...');

          // Step 3: Verify signature
          console.log('[AXIOM] 3. Verifying signature...');
          const verifyResult = await axiom.verifySignature(process.env.SOLANA_PUBKEY, signature);
          
          if (verifyResult.ok) {
            console.log('[AXIOM] ✅ Handshake successful!');
            console.log('[AXIOM] Session:', verifyResult.session ? 'received' : 'missing');
          } else {
            console.error('[AXIOM] ❌ Verification failed:', verifyResult.error);
          }
        }
      } catch (handshakeError: any) {
        console.error('[AXIOM] ❌ Handshake error:', handshakeError.message);
      }
    } else {
      console.log('[AXIOM] Skipping handshake test (AXIOM_DEV_SIGN not enabled or keys missing)');
    }

    // Always do the ping test
    console.log('[AXIOM] 4. Testing ping...');
    const pingResult = await axiom.ping();
    
    if (pingResult.ok) {
      console.log('[AXIOM] ✅ Ping successful!');
      console.log(`[AXIOM] ping: { ok: true, code: ${pingResult.code}, cookies: ${pingResult.cookies}${pingResult.csrf ? ', csrf: "' + pingResult.csrf.substring(0, 8) + '..."' : ''} }`);
    } else {
      console.error('[AXIOM] ❌ Ping failed:');
      console.error(`[AXIOM] ping: { ok: false, code: ${pingResult.code}, cookies: ${pingResult.cookies}, error: "${pingResult.error}" }`);
    }

    console.log('[AXIOM] Healthcheck complete');
    process.exit(pingResult.ok ? 0 : 1);

  } catch (error: any) {
    console.error('[AXIOM] ❌ Healthcheck failed:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error: any) => {
  console.error('[AXIOM] ❌ Unhandled error:', error.message || error);
  process.exit(1);
});

// Run the healthcheck
main(); 