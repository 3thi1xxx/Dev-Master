export const env = {
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true',
  EXECUTOR: process.env.EXECUTOR || 'Dummy',
  AXIOM_ENDPOINT_BASE: process.env.AXIOM_ENDPOINT_BASE || 'https://axiom.trade',
  REDIS_URL: process.env.REDIS_URL || '',
  SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY || process.env.SOLANA_SECRET_KEY_B58 || '',
  SOLANA_CLUSTER: process.env.SOLANA_CLUSTER || 'mainnet-beta',
  JUPITER_DRY_RUN: process.env.JUPITER_DRY_RUN === 'true'
};

export function requireIfLive(name) {
  if (!env.USE_MOCK_DATA && !process.env[name]) {
    throw new Error(`Missing required env ${name} for LIVE mode`);
  }
}

export default env; 