/**
 * Whale Signal Parser for Axiom WebSocket Array Format
 * Discovered format: [timestamp, wallet, token/txid, action, amount, price, ...]
 */
export class WhaleSignalParser {
  constructor() {
    this.logger = console;
  }
  
  parseWhaleSignal(rawData) {
    try {
      // Handle array format from WebSocket
      if (Array.isArray(rawData) && rawData.length >= 6) {
        return {
          timestamp: rawData[0],
          wallet: rawData[1], 
          token: rawData[2],
          action: rawData[3],
          amount: rawData[4],
          price: rawData[5],
          raw: rawData,
          parsedAt: Date.now()
        };
      }
      
      // Handle object format (fallback)
      if (typeof rawData === 'object' && rawData.wallet) {
        return rawData;
      }
      
      return null;
    } catch (error) {
      this.logger.log('[PARSER] ❌ Error parsing whale signal:', error.message);
      return null;
    }
  }
  
  isTrackedWhale(walletAddress, trackedWallets) {
    return trackedWallets.has(walletAddress);
  }
  
  isProfitableSignal(signal) {
    // Basic profitability heuristics
    if (!signal || !signal.amount) return false;
    
    // Check for significant trade size (adjust as needed)
    const amount = parseFloat(signal.amount);
    if (amount < 1000) return false; // Less than $1000 might not be worth copying
    
    return true;
  }
}

export const whaleSignalParser = new WhaleSignalParser(); 