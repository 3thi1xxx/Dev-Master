#!/usr/bin/env node
/**
 * Axiom Token Manager
 * Handles automatic token refresh for Axiom API authentication
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AxiomTokenManager {
  constructor() {
    // Load tokens from file directly if environment not yet loaded
    this.envPath = path.join(__dirname, '../../axiom_tokens.env');
    this.loadTokensFromFile();
    
    // Set from environment or loaded values
    this.refreshToken = process.env.AXIOM_REFRESH_TOKEN || this.loadedRefreshToken;
    this.accessToken = process.env.AXIOM_ACCESS_TOKEN || this.loadedAccessToken;
    
    // ENHANCED: Multiple refresh endpoints for resilience (like browser redundancy)
    this.refreshEndpoints = [
      'https://api9.axiom.trade/refresh-access-token',  // Browser current (prioritized)
      'https://api8.axiom.trade/refresh-access-token',  // Recent working
      'https://api10.axiom.trade/refresh-access-token', // Next in sequence
      'https://api7.axiom.trade/refresh-access-token',  // Our previous working
      'https://api11.axiom.trade/refresh-access-token'  // Extended coverage
    ];
    
    // Current active endpoint index
    this.currentEndpointIndex = 0;
    this.refreshEndpoint = this.refreshEndpoints[0]; // For backwards compatibility
    
    // Token refresh interval (14 minutes to be safe, tokens expire in 15)
    this.refreshInterval = 14 * 60 * 1000;
    this.refreshTimer = null;
    
    console.log('[TOKEN] 🔐 Axiom Token Manager initialized');
    console.log('[TOKEN] Refresh token:', this.refreshToken ? 'Found' : 'Missing');
    console.log('[TOKEN] Access token:', this.accessToken ? 'Found' : 'Missing');
    console.log(`[TOKEN] 🔄 ${this.refreshEndpoints.length} refresh endpoints configured`);
  }
  
  /**
   * Load tokens directly from file
   */
  loadTokensFromFile() {
    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      
      // Parse refresh token
      const refreshMatch = envContent.match(/AXIOM_REFRESH_TOKEN=(.+)/);
      if (refreshMatch) {
        this.loadedRefreshToken = refreshMatch[1].trim();
      }
      
      // Parse access token
      const accessMatch = envContent.match(/AXIOM_ACCESS_TOKEN=(.+)/);
      if (accessMatch) {
        this.loadedAccessToken = accessMatch[1].trim();
      }
      
      console.log('[TOKEN] 📄 Loaded tokens from axiom_tokens.env');
    } catch (error) {
      console.error('[TOKEN] ⚠️ Error loading tokens from file:', error.message);
    }
  }
  
  /**
   * Initialize token manager and start auto-refresh
   */
  async initialize() {
    // Check if current token is valid
    const isValid = await this.validateToken();
    
    if (!isValid) {
      console.log('[TOKEN] ⚠️ Access token expired, refreshing...');
      await this.refreshAccessToken();
    } else {
      console.log('[TOKEN] ✅ Access token is valid');
    }
    
    // Start auto-refresh cycle
    this.startAutoRefresh();
  }
  
  /**
   * Validate current access token
   */
  async validateToken() {
    if (!this.accessToken) return false;
    
    try {
      // Decode JWT to check expiration
      const parts = this.accessToken.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Check if token expires in next 2 minutes
      const isValid = exp > (now + 2 * 60 * 1000);
      
      if (!isValid) {
        console.log(`[TOKEN] Token expires in ${Math.round((exp - now) / 1000)}s`);
      }
      
      return isValid;
    } catch (error) {
      console.error('[TOKEN] Error validating token:', error.message);
      return false;
    }
  }
  
  /**
   * Refresh the access token using refresh token with automatic endpoint failover
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.error('[TOKEN] ❌ No refresh token available!');
      return false;
    }
    
    // Try each endpoint until one succeeds
    for (let i = 0; i < this.refreshEndpoints.length; i++) {
      const endpointIndex = (this.currentEndpointIndex + i) % this.refreshEndpoints.length;
      const endpoint = this.refreshEndpoints[endpointIndex];
      
      try {
        console.log(`[TOKEN] 🔄 Refreshing access token... (${endpoint.match(/api(\d+)/)[1]})`);
        
        const response = await axios.post(
          endpoint,
          {}, // Empty body like browser
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `auth-refresh-token=${this.refreshToken}; auth-access-token=${this.accessToken}`,
              'Origin': 'https://axiom.trade',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            },
            timeout: 5000 // 5 second timeout for faster failover
          }
        );
        
        // Extract new access token from Set-Cookie header (like browser does)
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          for (const cookie of setCookieHeader) {
            const match = cookie.match(/auth-access-token=([^;]+)/);
            if (match) {
              this.accessToken = match[1];
              process.env.AXIOM_ACCESS_TOKEN = this.accessToken;
              
              // Update successful endpoint as primary for next time
              this.currentEndpointIndex = endpointIndex;
              this.refreshEndpoint = endpoint; // Update for backwards compatibility
              
              // Update the env file
              await this.updateEnvFile();
              
              console.log(`[TOKEN] ✅ Access token refreshed successfully via ${endpoint.match(/api(\d+)/)[1]}`);
              return true;
            }
          }
        }
        
        console.log(`[TOKEN] ⚠️ No new access token in response from ${endpoint.match(/api(\d+)/)[1]}`);
        
      } catch (error) {
        console.log(`[TOKEN] ❌ ${endpoint.match(/api(\d+)/)[1]} failed: ${error.message}`);
        
        // Continue to next endpoint unless this is the last one
        if (i < this.refreshEndpoints.length - 1) {
          console.log(`[TOKEN] 🔄 Trying next endpoint...`);
          continue;
        }
      }
    }
    
    // All endpoints failed
    console.error('[TOKEN] ❌ All refresh endpoints failed - manual re-authentication required');
    console.error('[TOKEN] ⚠️ Server rotation may have occurred - check browser for current endpoint');
    return false;
  }
  
  /**
   * Update the .env file with new access token and working endpoint
   */
  async updateEnvFile() {
    try {
      let envContent = await fs.promises.readFile(this.envPath, 'utf8');
      
      // Replace the access token line
      envContent = envContent.replace(
        /AXIOM_ACCESS_TOKEN=.*/,
        `AXIOM_ACCESS_TOKEN=${this.accessToken}`
      );
      
      // Update the working refresh endpoint for persistence
      envContent = envContent.replace(
        /AXIOM_REFRESH_ENDPOINT=.*/,
        `AXIOM_REFRESH_ENDPOINT=${this.refreshEndpoint}`
      );
      
      await fs.promises.writeFile(this.envPath, envContent);
      console.log('[TOKEN] 📝 Updated env file with new token and endpoint');
      
    } catch (error) {
      console.error('[TOKEN] Error updating env file:', error.message);
    }
  }
  
  /**
   * Start automatic token refresh cycle
   */
  startAutoRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Set up refresh interval
    this.refreshTimer = setInterval(async () => {
      console.log('[TOKEN] ⏰ Auto-refresh cycle triggered');
      await this.refreshAccessToken();
    }, this.refreshInterval);
    
    console.log('[TOKEN] 🔄 Auto-refresh scheduled every 14 minutes');
  }
  
  /**
   * Get current valid access token
   */
  async getValidToken() {
    const isValid = await this.validateToken();
    
    if (!isValid) {
      await this.refreshAccessToken();
    }
    
    return this.accessToken;
  }
  
  /**
   * Get current working API base URL for other modules
   */
  getCurrentApiBaseUrl() {
    // Extract base URL from current working refresh endpoint
    const match = this.refreshEndpoint.match(/(https:\/\/api\d+\.axiom\.trade)/);
    return match ? match[1] : 'https://api9.axiom.trade';
  }
  
  /**
   * Shutdown token manager
   */
  shutdown() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      console.log('[TOKEN] 🛑 Token manager shutdown');
    }
  }

  /**
   * Get authorization headers for API requests (unified from archived version)
   */
  async getAuthHeaders() {
    const accessToken = await this.getValidToken();
    
    return {
      'Cookie': `auth-access-token=${accessToken}; auth-refresh-token=${this.refreshToken}`,
      'Authorization': `Bearer ${accessToken}`,
      'Origin': 'https://axiom.trade',
      'Referer': 'https://axiom.trade/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    };
  }

  /**
   * Test token validity (unified from archived version)
   */
  async testTokens() {
    try {
      console.log('[TOKEN] 🧪 Testing token validity...');
      
      const headers = await this.getAuthHeaders();
      
      // Test with current working API endpoint
      const testUrl = `${this.getCurrentApiBaseUrl()}/api/health`;
      const response = await axios.get(testUrl, {
        headers,
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('[TOKEN] ✅ Tokens are valid and working');
        return true;
      } else {
        console.log('[TOKEN] ⚠️ Token test returned:', response.status);
        return false;
      }
      
    } catch (error) {
      console.log('[TOKEN] ❌ Token test failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const axiomTokenManager = new AxiomTokenManager();
export default axiomTokenManager; 