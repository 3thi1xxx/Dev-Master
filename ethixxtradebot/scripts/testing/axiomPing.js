/**
 * Axiom Ping - Healthcheck script for legacy Axiom connector (JavaScript version)
 */
import { axiom } from '../src/connectors/axiom/index.js';

async function main() {
  console.log('[AXIOM] Starting healthcheck...');
  
  if (process.env.AXIOM_ENABLE !== 'true' || process.env.AXIOM_STEALTH !== 'true') {
    console.log('[AXIOM] disabled by flags');
    process.exit(0);
  }

  try {
    await axiom.init();
    console.log('[AXIOM] Connector initialized');
    
    // Check if we have JWT tokens from environment
    const hasTokens = process.env.AXIOM_ACCESS_TOKEN && process.env.AXIOM_REFRESH_TOKEN;
    
    if (hasTokens) {
      console.log('[AXIOM] ✅ Using JWT tokens from environment, skipping wallet-nonce');
    } else if (process.env.AXIOM_DEV_SIGN === 'true' && process.env.SOLANA_PUBKEY && process.env.SOLANA_SECRET_KEY_B58) {
      console.log('[AXIOM] Testing wallet-nonce handshake...');
      console.log('[AXIOM] Step 1: Requesting nonce...');
      
      const nonceResult = await axiom.getWalletNonce(process.env.SOLANA_PUBKEY);
      if (!nonceResult.ok) {
        console.log('[AXIOM] ❌ Nonce failed:', nonceResult);
        console.log('[AXIOM] Testing basic ping instead...');
      } else {
        console.log('[AXIOM] ✅ Nonce received:', nonceResult.nonce);
        console.log('[AXIOM] Step 2: Signing nonce...');
        
        const { devSign } = await import('../src/connectors/axiom/index.js');
        const signature = await devSign(nonceResult.nonce);
        console.log('[AXIOM] ✅ Signature generated');
        
        console.log('[AXIOM] Step 3: Verifying signature...');
        const verifyResult = await axiom.verifySignature(process.env.SOLANA_PUBKEY, signature, nonceResult.nonce);
        
        if (verifyResult.ok) {
          console.log('[AXIOM] ✅ Wallet verification successful!');
          console.log('[AXIOM] User data:', {
            userId: verifyResult.user?.userId,
            sol: verifyResult.user?.sol,
            isNewUser: verifyResult.user?.isNewUser
          });
          console.log('[AXIOM] Tokens:', verifyResult.tokens);
        } else {
          console.log('[AXIOM] ❌ Verification failed:', verifyResult);
        }
      }
    }
    
    console.log('[AXIOM] Testing ping...');
    const pingResult = await axiom.ping();
    
    if (pingResult.ok) {
      console.log('[AXIOM] ✅ Ping successful!');
      console.log('[AXIOM] ping:', pingResult);
    } else {
      console.log('[AXIOM] ❌ Ping failed:');
      console.log('[AXIOM] ping:', pingResult);
    }
    
    console.log('[AXIOM] Testing individual endpoints...');
    
    const pulseResult = await axiom.safeGetPulse();
    console.log('[AXIOM] Pulse result:', {
      ok: pulseResult.ok,
      dataType: typeof pulseResult.data,
      dataLength: Array.isArray(pulseResult.data) ? pulseResult.data.length : 'not-array',
      sampleKeys: pulseResult.data && typeof pulseResult.data === 'object' ? Object.keys(pulseResult.data).slice(0, 3) : 'n/a'
    });
    
    const trendingResult = await axiom.safeGetTrending();
    console.log('[AXIOM] Trending result:', {
      ok: trendingResult.ok,
      dataType: typeof trendingResult.data,
      dataLength: Array.isArray(trendingResult.data) ? trendingResult.data.length : 'not-array',
      sampleKeys: trendingResult.data && typeof trendingResult.data === 'object' ? Object.keys(trendingResult.data).slice(0, 3) : 'n/a'
    });
    
    process.exit(pingResult.ok ? 0 : 1);
    
  } catch (error) {
    console.error('[AXIOM] Fatal error:', error.message);
    process.exit(1);
  }
}

main(); 