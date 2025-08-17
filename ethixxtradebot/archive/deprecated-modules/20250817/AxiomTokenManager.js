import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class AxiomTokenManager {
  constructor() {
    // FRESH tokens from browser (iat: 1755144421) - CLUSTER7 WORKING!
    this.tokens = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ0NDIxLCJleHAiOjE3NTUxNDUzODF9.njjzMD2NL6_CWGPbU8a8ziYN0j2ptAysrhiBQhHzKd8',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
      userId: '64958bb1-3016-4780-8b09-f687062cfa20'
    };
    this.refreshEndpoint = 'https://api6.axiom.trade/refresh-access-token';
    this.tokenFile = '.env.dev';
    this.lastRefresh = 0;
    this.refreshInterval = 14 * 60 * 1000; // 14 minutes (tokens expire in 15)
    this.autoRefreshTimer = null;
    this.logger = console;
    
    // Load initial tokens
    this.loadTokensFromEnv();
  }

  loadTokensFromEnv() {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const envContent = fs.readFileSync(this.tokenFile, 'utf8');
        
        // Parse refresh token
        const refreshMatch = envContent.match(/AXIOM_REFRESH_TOKEN=(.+)/);
        if (refreshMatch) {
          this.tokens.refreshToken = refreshMatch[1].trim();
        }
        
        // Parse access token
        const accessMatch = envContent.match(/AXIOM_ACCESS_TOKEN=(.+)/);
        if (accessMatch) {
          this.tokens.accessToken = accessMatch[1].trim();
        }
        
        this.logger.log('[TOKEN-MANAGER] 🔑 Loaded tokens from .env.dev');
      }
    } catch (error) {
      this.logger.log('[TOKEN-MANAGER] ⚠️ Error loading tokens:', error.message);
    }
  }

  /**
   * Update tokens with fresh values from browser session
   */
  updateTokens(refreshToken, accessToken) {
    this.tokens.refreshToken = refreshToken;
    this.tokens.accessToken = accessToken;
    this.lastRefresh = Date.now();
    
    this.logger.log('[TOKEN-MANAGER] ✅ Updated with fresh tokens');
    this.logger.log(`[TOKEN-MANAGER] 🔄 Refresh Token: ${refreshToken.substring(0, 20)}...`);
    this.logger.log(`[TOKEN-MANAGER] 🎫 Access Token: ${accessToken.substring(0, 20)}...`);
    
    // Update .env.dev file
    this.saveTokensToEnv();
    
    // Start auto-refresh
    this.startAutoRefresh();
  }

  saveTokensToEnv() {
    try {
      let envContent = '';
      
      if (fs.existsSync(this.tokenFile)) {
        envContent = fs.readFileSync(this.tokenFile, 'utf8');
      }
      
      // Update or add refresh token
      if (envContent.includes('AXIOM_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/AXIOM_REFRESH_TOKEN=.+/, `AXIOM_REFRESH_TOKEN=${this.tokens.refreshToken}`);
      } else {
        envContent += `\nAXIOM_REFRESH_TOKEN=${this.tokens.refreshToken}`;
      }
      
      // Update or add access token  
      if (envContent.includes('AXIOM_ACCESS_TOKEN=')) {
        envContent = envContent.replace(/AXIOM_ACCESS_TOKEN=.+/, `AXIOM_ACCESS_TOKEN=${this.tokens.accessToken}`);
      } else {
        envContent += `\nAXIOM_ACCESS_TOKEN=${this.tokens.accessToken}`;
      }
      
      fs.writeFileSync(this.tokenFile, envContent);
      this.logger.log('[TOKEN-MANAGER] 💾 Saved tokens to .env.dev');
      
    } catch (error) {
      this.logger.log('[TOKEN-MANAGER] ❌ Error saving tokens:', error.message);
    }
  }

  /**
   * Refresh access token using the discovered API endpoint
   */
  async refreshAccessToken() {
    if (!this.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      this.logger.log('[TOKEN-MANAGER] 🔄 Refreshing access token...');
      
      const response = await axios.post(this.refreshEndpoint, {}, {
        headers: {
          'Cookie': `auth-refresh-token=${this.tokens.refreshToken}`,
          'Origin': 'https://axiom.trade',
          'Referer': 'https://axiom.trade/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        // Parse new tokens from Set-Cookie headers
        const setCookieHeader = response.headers['set-cookie'];
        
        if (setCookieHeader) {
          for (const cookie of setCookieHeader) {
            if (cookie.includes('auth-access-token=')) {
              const tokenMatch = cookie.match(/auth-access-token=([^;]+)/);
              if (tokenMatch) {
                this.tokens.accessToken = tokenMatch[1];
                this.lastRefresh = Date.now();
                this.logger.log('[TOKEN-MANAGER] ✅ Access token refreshed successfully');
                
                // Update .env.dev
                this.saveTokensToEnv();
                return this.tokens.accessToken;
              }
            }
            
            if (cookie.includes('auth-refresh-token=')) {
              const tokenMatch = cookie.match(/auth-refresh-token=([^;]+)/);
              if (tokenMatch) {
                this.tokens.refreshToken = tokenMatch[1];
                this.logger.log('[TOKEN-MANAGER] 🔄 Refresh token updated');
              }
            }
          }
        }
        
        return this.tokens.accessToken;
      } else {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
      
    } catch (error) {
      this.logger.log('[TOKEN-MANAGER] ❌ Token refresh failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current valid access token (refresh if needed)
   */
  async getValidAccessToken() {
    const now = Date.now();
    const timeSinceRefresh = now - this.lastRefresh;
    
    // Refresh if token is older than 14 minutes
    if (!this.tokens.accessToken || timeSinceRefresh > this.refreshInterval) {
      this.logger.log('[TOKEN-MANAGER] ⏰ Token expired, refreshing...');
      await this.refreshAccessToken();
    }
    
    return this.tokens.accessToken;
  }

  /**
   * Start automatic token refresh
   */
  startAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
    
    this.autoRefreshTimer = setInterval(async () => {
      try {
        await this.refreshAccessToken();
        this.logger.log('[TOKEN-MANAGER] 🔄 Auto-refresh completed');
      } catch (error) {
        this.logger.log('[TOKEN-MANAGER] ❌ Auto-refresh failed:', error.message);
      }
    }, this.refreshInterval);
    
    this.logger.log('[TOKEN-MANAGER] ⚡ Auto-refresh started (14min intervals)');
  }

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      this.logger.log('[TOKEN-MANAGER] 🛑 Auto-refresh stopped');
    }
  }

  /**
   * Get authorization headers for API requests
   */
  async getAuthHeaders() {
    const accessToken = await this.getValidAccessToken();
    
    return {
      'Cookie': `auth-access-token=${accessToken}; auth-refresh-token=${this.tokens.refreshToken}`,
      'Authorization': `Bearer ${accessToken}`,
      'Origin': 'https://axiom.trade',
      'Referer': 'https://axiom.trade/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    };
  }

  /**
   * Test token validity
   */
  async testTokens() {
    try {
      this.logger.log('[TOKEN-MANAGER] 🧪 Testing token validity...');
      
      const headers = await this.getAuthHeaders();
      
      // Test with a simple API call (you can adjust endpoint as needed)
      const response = await axios.get('https://eucalyptus.axiom.trade/api/health', {
        headers,
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.logger.log('[TOKEN-MANAGER] ✅ Tokens are valid and working');
        return true;
      } else {
        this.logger.log('[TOKEN-MANAGER] ⚠️ Token test returned:', response.status);
        return false;
      }
      
    } catch (error) {
      this.logger.log('[TOKEN-MANAGER] ❌ Token test failed:', error.message);
      return false;
    }
  }

  /**
   * Get current token status
   */
  getStatus() {
    const now = Date.now();
    const timeSinceRefresh = now - this.lastRefresh;
    const minutesSinceRefresh = Math.floor(timeSinceRefresh / 1000 / 60);
    
    return {
      hasRefreshToken: !!this.tokens.refreshToken,
      hasAccessToken: !!this.tokens.accessToken,
      lastRefreshMinutesAgo: minutesSinceRefresh,
      autoRefreshActive: !!this.autoRefreshTimer,
      needsRefresh: timeSinceRefresh > this.refreshInterval
    };
  }
}

// For immediate use - create singleton instance
export const tokenManager = new AxiomTokenManager(); 