/**
 * Development-only wallet signer for Axiom handshake testing
 * WARNING: For development use only - do not use in production
 */
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * Signs a nonce using Ed25519 signature (development only)
 * @param nonce - The nonce string to sign
 * @param base58Secret - Base58 encoded private key
 * @returns Base58 encoded signature
 */
export function signNonceDev(nonce: string, base58Secret?: string): string {
  // Security check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEV_SIGNER_BLOCKED_IN_PRODUCTION');
  }

  if (process.env.AXIOM_DEV_SIGN !== 'true') {
    throw new Error('DEV_SIGNER_DISABLED - Set AXIOM_DEV_SIGN=true to enable');
  }

  if (!base58Secret) {
    throw new Error('No secret key provided - set SOLANA_SECRET_KEY_B58');
  }

  try {
    // Decode the base58 private key
    const secretKey = bs58.decode(base58Secret);
    
    // Create keypair from secret key
    const kp = Keypair.fromSecretKey(secretKey);
    
    // Sign the nonce bytes with Ed25519 (detached signature)
    const nonceBytes = new TextEncoder().encode(nonce);
    const signature = nacl.sign.detached(nonceBytes, kp.secretKey);
    
    // Return base58 encoded signature
    return bs58.encode(signature);
  } catch (error: any) {
    throw new Error(`DEV_SIGNER_ERROR: ${error.message}`);
  }
}

/**
 * Get the public key from a private key (development only)
 * @param base58Secret - Base58 encoded private key
 * @returns Base58 encoded public key
 */
export function getPublicKeyDev(base58Secret: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEV_SIGNER_BLOCKED_IN_PRODUCTION');
  }

  try {
    const secretKey = bs58.decode(base58Secret);
    const kp = Keypair.fromSecretKey(secretKey);
    return kp.publicKey.toBase58();
  } catch (error: any) {
    throw new Error(`DEV_PUBLIC_KEY_ERROR: ${error.message}`);
  }
}

/**
 * Validate development environment for signing
 * @returns true if development signing is properly configured
 */
export function validateDevSignerEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    errors.push('Cannot use dev signer in production environment');
  }

  if (process.env.AXIOM_DEV_SIGN !== 'true') {
    errors.push('AXIOM_DEV_SIGN must be set to "true"');
  }

  if (!process.env.SOLANA_SECRET_KEY_B58) {
    errors.push('SOLANA_SECRET_KEY_B58 environment variable required');
  }

  if (!process.env.SOLANA_PUBKEY) {
    errors.push('SOLANA_PUBKEY environment variable required');
  }

  // Validate key pair consistency if both are provided
  if (process.env.SOLANA_SECRET_KEY_B58 && process.env.SOLANA_PUBKEY) {
    try {
      const derivedPubkey = getPublicKeyDev(process.env.SOLANA_SECRET_KEY_B58);
      if (derivedPubkey !== process.env.SOLANA_PUBKEY) {
        errors.push('SOLANA_PUBKEY does not match derived public key from SOLANA_SECRET_KEY_B58');
      }
    } catch (error: any) {
      errors.push(`Key validation failed: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
} 