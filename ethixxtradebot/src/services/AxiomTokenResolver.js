/**
 * Axiom Token Resolver - Resolves token addresses from Axiom WebSocket data
 * Extracts the actual mint address from new_pairs messages
 */

import axios from 'axios';
import { EventEmitter } from 'node:events';
import { axiomTokenManager } from '../core/AxiomTokenManager.js';

class AxiomTokenResolver extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      axiomAPI: 'https://api3.axiom.trade',
      cache: new Map(),
      cacheTimeout: 60000 // 1 minute
    };
    
    console.log('🔍 Axiom Token Resolver initialized');
  }
  
  /**
   * Process new_pairs message from Cluster7 WebSocket
   * Extract token address and enrich with full data
   */
  async processNewPairMessage(message) {
    try {
      // Handle different message formats
      let pairData = null;
      
      // Format 1: Direct object with tokenAddress field
      if (message.tokenAddress) {
        pairData = {
          tokenAddress: message.tokenAddress,
          pairAddress: message.pairAddress,
          tokenTicker: message.tokenTicker || message.symbol,
          ...message
        };
      }
      // Format 2: Nested in data field
      else if (message.data && message.data.tokenAddress) {
        pairData = {
          tokenAddress: message.data.tokenAddress,
          pairAddress: message.data.pairAddress,
          tokenTicker: message.data.tokenTicker || message.data.symbol,
          ...message.data
        };
      }
      // Format 3: Array of pairs
      else if (Array.isArray(message)) {
        for (const pair of message) {
          if (pair.tokenAddress) {
            await this.processNewPairMessage(pair);
          }
        }
        return;
      }
      // Format 4: Text message that needs parsing
      else if (typeof message === 'string') {
        // Try to extract token address from string
        const match = message.match(/([A-Za-z0-9]{32,44})/);
        if (match) {
          pairData = {
            tokenAddress: match[1],
            tokenTicker: message.match(/\b[A-Z]{2,10}\b/)?.[0] || 'UNKNOWN'
          };
        }
      }
      
      if (!pairData || !pairData.tokenAddress) {
        console.log('[RESOLVER] ⚠️ No token address found in message:', JSON.stringify(message).substring(0, 100));
        return null;
      }
      
      console.log(`[RESOLVER] 🎯 Processing new token: ${pairData.tokenTicker} (${pairData.tokenAddress})`);
      
      // Enrich with full data from Axiom API
      const enrichedData = await this.fetchTokenData(pairData);
      
      // Emit the enriched token for analysis
      this.emit('token-resolved', enrichedData);
      
      return enrichedData;
      
    } catch (error) {
      console.error('[RESOLVER] ❌ Error processing new pair:', error.message);
      return null;
    }
  }
  
  /**
   * Fetch full token data from Axiom API
   */
  async fetchTokenData(pairData) {
    try {
      // Check cache first
      const cached = this.cache.get(pairData.tokenAddress);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
      
      // Get access token
      const accessToken = await axiomTokenManager.getValidAccessToken();
      
      // Fetch pair info if we have pairAddress
      let fullData = { ...pairData };
      
      if (pairData.pairAddress) {
        try {
          const response = await axios.get(
            `${this.config.axiomAPI}/pair-info`,
            {
              params: { pairAddress: pairData.pairAddress },
              headers: {
                'Cookie': `auth-access-token=${accessToken}`,
                'Origin': 'https://axiom.trade'
              },
              timeout: 5000
            }
          );
          
          if (response.data) {
            fullData = {
              ...fullData,
              ...response.data,
              // Ensure critical fields are present
              address: response.data.tokenAddress || pairData.tokenAddress,
              mint: response.data.tokenAddress || pairData.tokenAddress,
              symbol: response.data.tokenTicker || pairData.tokenTicker,
              liquidity: response.data.initialLiquiditySol,
              deployerAddress: response.data.deployerAddress,
              supply: response.data.supply,
              createdAt: response.data.createdAt,
              top10Holders: response.data.top10Holders
            };
            
            console.log(`[RESOLVER] ✅ Enriched ${fullData.symbol}: Liquidity=${fullData.liquidity} SOL`);
          }
        } catch (error) {
          console.log(`[RESOLVER] ⚠️ Could not fetch pair info: ${error.message}`);
        }
      }
      
      // Fetch token info using tokenAddress
      try {
        const tokenResponse = await axios.get(
          `${this.config.axiomAPI}/token-info`,
          {
            params: { tokenAddress: pairData.tokenAddress },
            headers: {
              'Cookie': `auth-access-token=${accessToken}`,
              'Origin': 'https://axiom.trade'
            },
            timeout: 5000
          }
        );
        
        if (tokenResponse.data) {
          fullData = {
            ...fullData,
            ...tokenResponse.data,
            holders: tokenResponse.data.numHolders,
            organicHolders: tokenResponse.data.organicHolders,
            devHoldsPercent: tokenResponse.data.devHoldsPercent
          };
        }
      } catch (error) {
        console.log(`[RESOLVER] ⚠️ Could not fetch token info: ${error.message}`);
      }
      
      // Cache the enriched data
      this.cache.set(pairData.tokenAddress, {
        data: fullData,
        timestamp: Date.now()
      });
      
      return fullData;
      
    } catch (error) {
      console.error('[RESOLVER] ❌ Error fetching token data:', error.message);
      // Return at least the basic data we have
      return pairData;
    }
  }
  
  /**
   * Resolve a token by symbol (for testing)
   */
  async resolveBySymbol(symbol) {
    // This would need a token list or API endpoint that maps symbols to addresses
    // For now, return null
    console.log(`[RESOLVER] Symbol resolution not yet implemented for: ${symbol}`);
    return null;
  }
}

export const axiomTokenResolver = new AxiomTokenResolver(); 