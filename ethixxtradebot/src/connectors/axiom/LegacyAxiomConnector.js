/**
 * Legacy Axiom Connector - Modernized wallet-nonce authentication
 * Based on axiomtrade-archive/src/axiom-handshake.js
 */
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

export class LegacyAxiomConnector {
  constructor(opts = {}) {
    this.baseURL = opts.baseURL || process.env.AXIOM_BASE_URL || 'https://api9.axiom.trade';
    this.timeoutMs = opts.timeoutMs || parseInt(process.env.AXIOM_TIMEOUT_MS) || 12000;
    this.jar = new CookieJar();
    this.http = null;
    
    // Use JWT tokens from environment if available
    this.accessToken = process.env.AXIOM_ACCESS_TOKEN || null;
    this.refreshToken = process.env.AXIOM_REFRESH_TOKEN || null;
    
    this.lastRequestTime = 0;
    this.minInterval = 1000; // 1s minimum between requests
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Endpoint rotation state
    this.currentApiIndex = 9; // Start with api9 (known working)
    this.knownWorkingEndpoints = ['api9.axiom.trade']; // Cache working endpoints
    this.failedEndpoints = new Set(); // Track failed endpoints
    this.lastRotationTime = 0;
    this.rotationCooldown = 300000; // 5 min cooldown between rotations
    
    // If we have tokens from env, log success
    if (this.accessToken && this.refreshToken) {
      console.log('[AXIOM] Using JWT tokens from environment');
    }
  }

  async init() {
    if (!this.http) {
      this.http = this.createHttpClient();
      this.addInterceptors();
      console.log('[AXIOM] HTTP client initialized');
    }
  }

  createHttpClient() {
    const client = wrapper(axios.create({
      baseURL: this.baseURL,
      timeout: this.timeoutMs,
      jar: this.jar,
      withCredentials: true,
      validateStatus: () => true // Handle all status codes ourselves
    }));
    return client;
  }

  // 🔄 INTELLIGENT ENDPOINT ROTATION
  async rotateEndpointSafely() {
    const now = Date.now();
    
    // Respect cooldown to avoid rapid rotation
    if (now - this.lastRotationTime < this.rotationCooldown) {
      console.log('[AXIOM] Rotation on cooldown, skipping');
      return false;
    }

    // Try known working endpoints first
    for (const endpoint of this.knownWorkingEndpoints) {
      if (!this.failedEndpoints.has(endpoint) && !this.baseURL.includes(endpoint)) {
        const newBaseURL = `https://${endpoint}`;
        console.log(`[AXIOM] Trying known working endpoint: ${newBaseURL}`);
        const success = await this.testEndpoint(newBaseURL);
        if (success) {
          this.switchEndpoint(newBaseURL);
          return true;
        }
      }
    }

    // Intelligent discovery of new endpoints
    const candidates = this.generateEndpointCandidates();
    
    for (const candidate of candidates) {
      if (this.failedEndpoints.has(candidate)) continue;
      
      const newBaseURL = `https://${candidate}`;
      console.log(`[AXIOM] Testing candidate endpoint: ${newBaseURL}`);
      
      // Respectful testing with delay
      await this.sleep(2000);
      
      const success = await this.testEndpoint(newBaseURL);
      if (success) {
        this.knownWorkingEndpoints.unshift(candidate); // Add to front of list
        this.switchEndpoint(newBaseURL);
        return true;
      } else {
        this.failedEndpoints.add(candidate);
      }
    }

    this.lastRotationTime = now;
    console.log('[AXIOM] No working endpoints found in rotation');
    return false;
  }

  generateEndpointCandidates() {
    const candidates = [];
    
    // Smart sequence based on current known working endpoint
    const currentNum = this.extractApiNumber(this.baseURL);
    
    // Try adjacent numbers first (api8, api10, api7, api11, etc.)
    const offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
    for (const offset of offsets) {
      const num = currentNum + offset;
      if (num >= 1 && num <= 16) {
        candidates.push(`api${num}.axiom.trade`);
      }
    }
    
    // Add some common patterns
    candidates.push('app.axiom.trade', 'www.axiom.trade', 'axiom.trade');
    
    return candidates;
  }

  extractApiNumber(url) {
    const match = url.match(/api(\d+)\.axiom\.trade/);
    return match ? parseInt(match[1]) : 9;
  }

  async testEndpoint(baseURL) {
    try {
      console.log(`[AXIOM] Testing endpoint: ${baseURL}`);
      
      // Create a temporary client for testing
      const testClient = axios.create({
        baseURL,
        timeout: 5000,
        validateStatus: () => true
      });

      // Test with a light, non-intrusive request
      const response = await testClient.get('/');
      
      // Consider it working if we get any response (not connection refused)
      const isWorking = response.status < 500 && response.status !== 0;
      
      console.log(`[AXIOM] Endpoint ${baseURL} test result: ${response.status} ${isWorking ? '✅' : '❌'}`);
      
      return isWorking;
      
    } catch (error) {
      console.log(`[AXIOM] Endpoint ${baseURL} failed: ${error.message}`);
      return false;
    }
  }

  switchEndpoint(newBaseURL) {
    this.baseURL = newBaseURL;
    console.log(`[AXIOM] 🔄 Switched to endpoint: ${newBaseURL}`);
    
    // Recreate HTTP client with new base URL
    this.http = this.createHttpClient();
    this.addInterceptors();
    
    // Reset failure states
    this.retryCount = 0;
    this.lastRotationTime = Date.now();
  }

  // 🔄 AUTOMATIC TOKEN REFRESH
  async refreshTokensAutomatically() {
    try {
      console.log('[AXIOM] Attempting automatic token refresh...');
      
      if (!process.env.SOLANA_SECRET_KEY_B58 || !process.env.SOLANA_PUBKEY) {
        console.log('[AXIOM] No dev signing keys available for refresh');
        return false;
      }

      // Use the same flow as the legacy script
      const nonceResult = await this.getWalletNonce(process.env.SOLANA_PUBKEY);
      if (!nonceResult.ok) {
        console.log('[AXIOM] Failed to get nonce for refresh');
        return false;
      }

      // Dynamic import of devSigner to avoid issues if not available
      const { signNonceDev } = await import('./devSigner.js');
      const signature = signNonceDev(nonceResult.nonce, process.env.SOLANA_SECRET_KEY_B58);

      const verifyResult = await this.verifySignature(
        process.env.SOLANA_PUBKEY,
        signature,
        nonceResult.nonce
      );

      if (verifyResult.ok) {
        console.log('[AXIOM] ✅ Automatic token refresh successful');
        return true;
      } else {
        console.log('[AXIOM] Token refresh verification failed');
        return false;
      }

    } catch (error) {
      console.log('[AXIOM] Automatic refresh error:', error.message);
      return false;
    }
  }

  addInterceptors() {
    // Request interceptor - add auth headers and timing
    this.http.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        
        // Add browser-like headers for stealth
        config.headers = {
          ...config.headers,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"'
        };

        // Add JWT tokens as cookies (the way browsers send them)
        if (this.accessToken && this.refreshToken) {
          config.headers['Cookie'] = `auth-access-token=${this.accessToken}; auth-refresh-token=${this.refreshToken}`;
          console.log('[AXIOM] Using JWT tokens in Cookie header');
        }

        // Add referer for certain endpoints
        if (config.url?.includes('wallet-nonce') || config.url?.includes('verify-wallet')) {
          config.headers['Referer'] = this.baseURL + '/';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle auth failures and extract tokens
    this.http.interceptors.response.use(
      (response) => {
        // Extract JWT tokens from Set-Cookie headers
        const setCookieHeaders = response.headers['set-cookie'] || [];
        for (const cookie of setCookieHeaders) {
          if (cookie.includes('auth-access-token=')) {
            this.accessToken = cookie.split('auth-access-token=')[1]?.split(';')[0];
            console.log('[AXIOM] ✅ Access token updated');
          }
          if (cookie.includes('auth-refresh-token=')) {
            this.refreshToken = cookie.split('auth-refresh-token=')[1]?.split(';')[0];
            console.log('[AXIOM] ✅ Refresh token updated');
          }
        }
        return response;
      },
      async (error) => {
        const response = error.response;
        
        // Handle auth failures (401, 419)
        if (response && (response.status === 401 || response.status === 419)) {
          console.log(`[AXIOM] Auth failure ${response.status}, attempting recovery...`);
          
          // Try automatic token refresh first
          const refreshed = await this.refreshTokensAutomatically();
          if (refreshed) {
            // Retry the original request
            return this.http.request(error.config);
          }
          
          // If refresh fails, try endpoint rotation
          const rotated = await this.rotateEndpointSafely();
          if (rotated) {
            // Retry with new endpoint
            return this.http.request(error.config);
          }
        }
        
        // Handle server errors that might indicate endpoint issues
        if (response && response.status >= 500) {
          console.log(`[AXIOM] Server error ${response.status}, marking endpoint as problematic`);
          this.failedEndpoints.add(this.extractApiNumber(this.baseURL));
          
          // Consider endpoint rotation after multiple 5xx errors
          this.retryCount++;
          if (this.retryCount >= 3) {
            await this.rotateEndpointSafely();
            this.retryCount = 0;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Rest of the existing methods remain the same...
  async enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await this.sleep(this.minInterval - elapsed);
    }
  }

  async withBackoff(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 5000);
      console.log(`[AXIOM] Retry ${attempt}/${this.maxRetries} after ${delay}ms`);
      await this.sleep(delay);
      
      return this.withBackoff(fn, attempt + 1);
    }
  }

  logHttp(method, path, status, startTime) {
    const duration = startTime ? Date.now() - startTime : 0;
    const cookies = this.jar.getCookiesSync(this.baseURL).length;
    console.log(`[AXIOM:HTTP] ${method} ${path} ${status} in=${duration}ms cookies=${cookies}`);
  }

  // Existing methods (getWalletNonce, verifySignature, etc.) remain unchanged...
  async getWalletNonce(pubkey) {
    return this.withBackoff(async () => {
      await this.enforceRateLimit();
      const payload = { walletAddress: pubkey };
      const response = await this.http.post('/wallet-nonce', payload);
      this.lastRequestTime = Date.now();

      if (response.status === 200 && response.data) {
        const nonce = typeof response.data === 'string' ? response.data : response.data.nonce;
        this.logHttp('POST', '/wallet-nonce', response.status, response.config?.metadata?.startTime);
        return { ok: true, nonce };
      }

      return { ok: false, code: response.status, reason: 'NO_NONCE' };
    });
  }

  async verifySignature(pubkey, signature, nonce) {
    return this.withBackoff(async () => {
      await this.enforceRateLimit();
      const payload = {
        walletAddress: pubkey,
        signature: signature,
        nonce: nonce,
        allowLinking: false,
        allowRegistration: true,
        forAddCredential: false,
        isVerify: false,
        referrer: null
      };
      
      const response = await this.http.post('/verify-wallet-v2', payload);
      this.lastRequestTime = Date.now();

      if (response.status === 200) {
        this.logHttp('POST', '/verify-wallet-v2', response.status, response.config?.metadata?.startTime);
        const userData = response.data;
        return {
          ok: true,
          code: response.status,
          user: userData,
          tokens: {
            access: this.accessToken ? 'set' : 'missing',
            refresh: this.refreshToken ? 'set' : 'missing'
          }
        };
      }

      return { ok: false, code: response.status, reason: 'VERIFY_FAILED' };
    });
  }

  async safeGetPulse() {
    return this.withBackoff(async () => {
      await this.enforceRateLimit();
      const response = await this.http.get('/pump-live-stream-tokens');
      this.lastRequestTime = Date.now();
      
      if (response.status === 200) {
        this.logHttp('GET', '/pump-live-stream-tokens', response.status, response.config?.metadata?.startTime);
        return { ok: true, data: response.data, code: response.status };
      }
      
      return { ok: false, code: response.status, error: response.data };
    });
  }

  async safeGetTrending() {
    return this.withBackoff(async () => {
      await this.enforceRateLimit();
      const response = await this.http.get('/meme-trending?timePeriod=1h');
      this.lastRequestTime = Date.now();
      
      if (response.status === 200) {
        this.logHttp('GET', '/meme-trending?timePeriod=1h', response.status, response.config?.metadata?.startTime);
        return { ok: true, data: response.data, code: response.status };
      }
      
      return { ok: false, code: response.status, error: response.data };
    });
  }

  async ping() {
    try {
      const result = await this.safeGetPulse();
      const cookies = this.jar.getCookiesSync(this.baseURL).length;
      return {
        ok: result.ok,
        code: result.code,
        cookies,
        tokens: {
          access: this.accessToken ? 'present' : 'missing',
          refresh: this.refreshToken ? 'present' : 'missing'
        },
        endpoint: this.baseURL,
        error: result.error
      };
    } catch (error) {
      return {
        ok: false,
        code: 0,
        cookies: 0,
        error: error.message,
        endpoint: this.baseURL
      };
    }
  }

  flags() {
    return {
      enabled: process.env.AXIOM_ENABLE === 'true',
      stealth: process.env.AXIOM_STEALTH === 'true',
      devSign: process.env.AXIOM_DEV_SIGN === 'true',
      baseURL: this.baseURL,
      knownEndpoints: this.knownWorkingEndpoints.length,
      failedEndpoints: this.failedEndpoints.size
    };
  }
} 