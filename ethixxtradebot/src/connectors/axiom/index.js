/**
 * Axiom Connector Index - Feature-flagged singleton export (JavaScript version)
 */
import { LegacyAxiomConnector } from './LegacyAxiomConnector.js';

class DisabledAxiomConnector {
  async init() {
    // No-op
  }

  async getWalletNonce(pubkey) {
    return { ok: false, reason: 'DISABLED' };
  }

  async verifySignature(pubkey, signature) {
    return { ok: false, error: 'DISABLED' };
  }

  async refreshCsrf() {
    // No-op
  }

  async ping() {
    return { ok: false, code: 0, cookies: 0, error: 'DISABLED' };
  }
}

/**
 * Create the Axiom connector singleton based on feature flags
 */
function createAxiomConnector() {
  // Check feature flags
  const isEnabled = process.env.AXIOM_ENABLE === 'true';
  const isStealthEnabled = process.env.AXIOM_STEALTH === 'true';

  if (!isEnabled || !isStealthEnabled) {
    console.log('[AXIOM] Connector disabled by feature flags:', { 
      AXIOM_ENABLE: process.env.AXIOM_ENABLE, 
      AXIOM_STEALTH: process.env.AXIOM_STEALTH 
    });
    return new DisabledAxiomConnector();
  }

  console.log('[AXIOM] Connector enabled');
  return new LegacyAxiomConnector();
}

// Export singleton instance
export const axiom = createAxiomConnector();

// Export classes for direct usage
export { LegacyAxiomConnector } from './LegacyAxiomConnector.js';

// Safe read-only methods (proxy to singleton)
export async function safeGetPulse() {
  return axiom.safeGetPulse();
}

export async function safeGetTrending() {
  return axiom.safeGetTrending();
}

export function flags() {
  return axiom.flags();
}

export async function devSign(nonce) {
  // Import devSigner dynamically to avoid issues in production
  try {
    const { signNonceDev } = await import('./devSigner.js');
    return signNonceDev(nonce, process.env.SOLANA_SECRET_KEY_B58);
  } catch (error) {
    throw new Error(`DEV_SIGN_ERROR: ${error.message}`);
  }
} 