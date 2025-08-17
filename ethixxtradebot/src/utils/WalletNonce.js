let _n = 0;

export function nextNonce(key = 'default') {
  // Simple process-wide nonce/counter (placeholder for per-wallet blockhashes)
  _n += 1;
  return `${key}:${Date.now()}:${_n}`;
}

export default { nextNonce }; 