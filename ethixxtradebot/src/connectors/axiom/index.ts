/**
 * Axiom Connector Index - Feature-flagged singleton export
 */
import { LegacyAxiomConnector } from './LegacyAxiomConnector';

interface NoOpConnector {
  init(): Promise<void>;
  getWalletNonce(pubkey: string): Promise<{ ok: false; reason: string }>;
  verifySignature(pubkey: string, signature: string): Promise<{ ok: false; error: string }>;
  refreshCsrf(): Promise<void>;
  ping(): Promise<{ ok: false; code: number; cookies: number; error: string }>;
}

class DisabledAxiomConnector implements NoOpConnector {
  async init(): Promise<void> {
    // No-op
  }

  async getWalletNonce(pubkey: string): Promise<{ ok: false; reason: string }> {
    return { ok: false, reason: 'DISABLED' };
  }

  async verifySignature(pubkey: string, signature: string): Promise<{ ok: false; error: string }> {
    return { ok: false, error: 'DISABLED' };
  }

  async refreshCsrf(): Promise<void> {
    // No-op
  }

  async ping(): Promise<{ ok: false; code: number; cookies: number; error: string }> {
    return { ok: false, code: 0, cookies: 0, error: 'DISABLED' };
  }
}

/**
 * Create the Axiom connector singleton based on feature flags
 */
function createAxiomConnector(): LegacyAxiomConnector | DisabledAxiomConnector {
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

// Export types and classes for direct usage
export { LegacyAxiomConnector } from './LegacyAxiomConnector';
export { signNonceDev, getPublicKeyDev, validateDevSignerEnv } from './devSigner'; 