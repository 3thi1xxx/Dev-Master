/**
 * Axiom Shadow Feed - Read-only data pulls without touching trading loop
 */
import { axiom, safeGetPulse, safeGetTrending, flags, devSign } from '../connectors/axiom/index.js';

export class AxiomShadowFeed {
  constructor() {
    this.started = false;
    this.loopTimer = null;
  }

  async start() {
    if (this.started) return;
    this.started = true;

    console.log('[AXIOM:SHADOW] Initializing...');
    await axiom.init();

    // Optional: sign-in flow if flags + keys are present
    const authOk = await this.tryHandshake();
    console.log(`[AXIOM:SHADOW] auth=${authOk}`);

    // main loop (read-only endpoints only; match legacy path names)
    this.loop().catch(err => console.error('[AXIOM:SHADOW] loop error', err));
  }

  stop() {
    this.started = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    console.log('[AXIOM:SHADOW] stopped');
  }

  async tryHandshake() {
    try {
      const currentFlags = flags();
      if (!currentFlags.devSign) {
        console.log('[AXIOM:SHADOW] dev signing disabled, continuing read-only');
        return true; // allow anonymous read if legacy supported it
      }

      const pub = process.env.SOLANA_PUBKEY;
      if (!pub) {
        console.warn('[AXIOM:SHADOW] no SOLANA_PUBKEY, skipping handshake');
        return false;
      }

      console.log('[AXIOM:AUTH] requesting nonce...');
      const nonceResult = await axiom.getWalletNonce(pub);
      
      if ('ok' in nonceResult && !nonceResult.ok) {
        console.warn(`[AXIOM:AUTH] nonce failed: ${nonceResult.reason}`);
        return false;
      }

      const nonce = nonceResult.nonce;
      console.log(`[AXIOM:AUTH] nonce ok`);

      console.log('[AXIOM:AUTH] signing nonce...');
      const signature = await devSign(nonce);
      
      console.log('[AXIOM:AUTH] verifying signature...');
      const verifyResult = await axiom.verifySignature(pub, signature);
      
      if (verifyResult.ok) {
        console.log('[AXIOM:AUTH] verify ok');
        return true;
      } else {
        console.warn(`[AXIOM:AUTH] verify failed: ${verifyResult.error}`);
        return false;
      }
    } catch (error) {
      console.warn('[AXIOM:SHADOW] handshake failed (continuing read-only)', error?.message);
      return false;
    }
  }

  async loop() {
    while (this.started) {
      try {
        // Pick safe GETs we used before (e.g., /api6/pulse or /api6/trending)
        const [pulseResult, trendingResult] = await Promise.all([
          safeGetPulse(),
          safeGetTrending()
        ]);

        // Normalize and emit logs only (no trading)
        const ticks = this.normalize(pulseResult, trendingResult);
        
        for (const t of ticks.slice(0, 10)) {
          console.log(`[AXIOM:SHADOW] ${t.mint} mcap=${t.mcap ?? '-'} vol24h=${t.vol24h ?? '-'} age=${t.age_minutes ?? '-'} prot=${t.protocol ?? '-'}`);
        }

        if (ticks.length === 0) {
          console.log('[AXIOM:SHADOW] no ticks extracted from pulse/trending data');
        }

      } catch (error) {
        console.error('[AXIOM:SHADOW] loop iteration error:', error.message);
      }

      // Schedule next iteration
      if (this.started) {
        this.loopTimer = setTimeout(() => this.loop(), 3000); // 3s cadence
        break; // Exit this iteration, next one scheduled
      }
    }
  }

  normalize(pulseResult, trendingResult) {
    // map legacy response -> ShadowTick[]
    // keep null-safe; do not throw
    const out = [];
    const now = Date.now();

    const push = (x) => {
      if (!x) return;
      const tick = {
        ts: now,
        mint: x.mint || x.address || x.ca || '',
        symbol: x.symbol || x.name,
        mcap: x.marketCap || x.mcap || x.market_cap,
        vol24h: x.volume24h || x.vol24h || x.volume_24h,
        age_minutes: x.ageMinutes ?? x.age_min ?? x.age_minutes,
        protocol: x.protocol || x.dex || x.platform
      };
      
      // Only push if we have a mint address
      if (tick.mint) {
        out.push(tick);
      }
    };

    // Handle pulse data
    if (pulseResult?.ok && pulseResult.tokens) {
      pulseResult.tokens.forEach(push);
    } else if (pulseResult?.data) {
      // Handle different response formats
      const pulseTokens = Array.isArray(pulseResult.data) ? pulseResult.data : 
                         pulseResult.data.tokens || [];
      pulseTokens.forEach(push);
    }

    // Handle trending data  
    if (trendingResult?.ok && trendingResult.tokens) {
      trendingResult.tokens.forEach(push);
    } else if (trendingResult?.data) {
      // Handle different response formats
      const trendingTokens = Array.isArray(trendingResult.data) ? trendingResult.data :
                            trendingResult.data.tokens || [];
      trendingTokens.forEach(push);
    }

    return out;
  }
} 