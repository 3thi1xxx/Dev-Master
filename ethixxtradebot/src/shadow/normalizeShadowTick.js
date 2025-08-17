/**
 * Shadow Tick Normalizer - Convert raw Axiom API data to TokenTick format
 */

/**
 * @typedef {Object} TokenTick
 * @property {number} ts - Timestamp
 * @property {'mock'|'shadow'|'other'} [source] - Data source
 * @property {string} mint - Token mint address
 * @property {string} [symbol] - Token symbol
 * @property {number} [mcap] - Market cap
 * @property {number} [vol24h] - 24h volume
 * @property {number} [age_minutes] - Age in minutes
 * @property {string} [protocol] - Protocol/DEX name
 * @property {number} [price] - Current price
 */

/**
 * Expand shadow payload from pulse and trending data
 * @param {any} pulse - Raw pulse data
 * @param {any} trending - Raw trending data
 * @param {number} [now] - Current timestamp
 * @returns {TokenTick[]} Normalized token ticks
 */
export function expandShadowPayload(pulse, trending, now = Date.now()) {
  const out = [];
  
  const push = (x) => {
    if (!x) return;
    const mint = x.mint || x.address || x.ca || x.tokenAddress || x.pairAddress || '';
    if (!mint) return;
    
    out.push({
      ts: now,
      source: 'shadow',
      mint,
      symbol: str(x.symbol ?? x.ticker ?? x.name ?? x.tokenName ?? x.tokenTicker),
      mcap: num(x.marketCap ?? x.mcap ?? x.market_cap ?? x.marketCapSol),
      vol24h: num(x.volume24h ?? x.vol24h ?? x.volume_24h ?? x.volumeSol),
      age_minutes: num(x.ageMinutes ?? x.age_min ?? x.age_minutes),
      protocol: str(x.protocol ?? x.dex ?? x.platform),
      price: num(x.price ?? x.last ?? x.close ?? x.priceUsd)
    });
  };
  
  // Extract token lists from API responses
  const listA = extractTokenList(pulse);
  const listB = extractTokenList(trending);
  
  listA.forEach(push);
  listB.forEach(push);
  
  return out;
}

/**
 * Extract token list from various response formats
 * @param {any} data - Raw API response
 * @returns {any[]} Array of token objects
 */
function extractTokenList(data) {
  if (!data) return [];
  
  // Direct array
  if (Array.isArray(data)) return data;
  
  // Has tokens property
  if (data.tokens && Array.isArray(data.tokens)) return data.tokens;
  
  // Has data property with tokens
  if (data.data) {
    if (Array.isArray(data.data)) return data.data;
    if (data.data.tokens && Array.isArray(data.data.tokens)) return data.data.tokens;
  }
  
  // Has items property (alternative format)
  if (data.items && Array.isArray(data.items)) return data.items;
  
  // Has results property
  if (data.results && Array.isArray(data.results)) return data.results;
  
  return [];
}

/**
 * Convert value to number or undefined
 * @param {any} v - Value to convert
 * @returns {number|undefined} Number or undefined
 */
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Convert value to string or undefined
 * @param {any} v - Value to convert
 * @returns {string|undefined} String or undefined
 */
function str(v) {
  return typeof v === 'string' && v.length ? v : undefined;
} 