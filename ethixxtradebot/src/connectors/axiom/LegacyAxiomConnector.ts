/**
 * Legacy Axiom Connector - Modernized wallet-nonce authentication
 * Based on axiomtrade-archive/src/axiom-handshake.js
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

interface ConnectorOptions {
  baseURL?: string;
  timeoutMs?: number;
  apiHosts?: string[];
}

interface NonceResponse {
  nonce: string;
}

interface VerifyResponse {
  ok: boolean;
  session?: any;
  error?: string;
}

interface PingResponse {
  ok: boolean;
  code: number;
  cookies: number;
  csrf?: string;
  error?: string;
}

export class LegacyAxiomConnector {
  private baseURL: string;
  private jar: CookieJar;
  private http: AxiosInstance;
  private csrfToken?: string;
  private timeoutMs: number;
  private apiHosts: string[];
  private healthyHost?: string;
  private lastHandshakeTime = 0;
  private failedAttempts = 0;

  constructor(opts: ConnectorOptions = {}) {
    this.baseURL = opts.baseURL || process.env.AXIOM_BASE_URL || 'https://app.axiom.trade';
    this.timeoutMs = opts.timeoutMs || parseInt(process.env.AXIOM_TIMEOUT_MS || '12000');
    
    // Parse API hosts from environment or use defaults
    this.apiHosts = opts.apiHosts || this.parseApiHosts(process.env.AXIOM_API_HOSTS);
    
    this.jar = new CookieJar();
    this.http = this.createHttpClient();
  }

  private parseApiHosts(envVal?: string): string[] {
    if (!envVal) {
      // Default api1-api15 pattern from legacy code
      return Array.from({ length: 15 }, (_, i) => 
        `https://api${i + 1}.axiom.trade`
      );
    }
    
    return envVal.split(',')
      .map(h => h.trim())
      .filter(Boolean)
      .map(h => h.startsWith('http') ? h : `https://${h}`);
  }

  private createHttpClient(): AxiosInstance {
    const client = wrapper(axios.create({
      timeout: this.timeoutMs,
      withCredentials: true,
      jar: this.jar
    }));

    this.addInterceptors(client);
    return client;
  }

  private addInterceptors(client: AxiosInstance): void {
    // Request interceptor - add CSRF header if available
    client.interceptors.request.use((config) => {
      // Add standard headers from legacy implementation
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': this.randomUserAgent(),
        'Referrer': 'https://axiom.trade/'
      };

      // Add CSRF token if available (common pattern: X-CSRF-Token)
      if (this.csrfToken) {
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }

      return config;
    });

    // Response interceptor - handle 401/419 with CSRF refresh
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle CSRF/auth failures with stealth mode enabled
        if (
          error.response?.status === 401 || 
          error.response?.status === 419
        ) {
          if (process.env.AXIOM_STEALTH === 'true' && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              await this.refreshCsrf();
              return client(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private randomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async init(): Promise<void> {
    // Connector is ready after construction
    // Optional: Could do initial health check here
  }

  async getWalletNonce(pubkey: string): Promise<NonceResponse | { ok: false; reason: string }> {
    const now = Date.now();
    
    // Rate limiting from legacy implementation
    if (now - this.lastHandshakeTime < 5 * 60 * 1000) {
      return { ok: false, reason: 'RATE_LIMITED' };
    }

    for (const baseUrl of this.apiHosts) {
      try {
        const response = await this.http.post(`${baseUrl}/wallet-nonce`, {
          walletAddress: pubkey
        });

        if (response.status === 200 && typeof response.data === 'string' && response.data.length > 0) {
          this.healthyHost = baseUrl;
          this.lastHandshakeTime = now;
          this.failedAttempts = 0;
          
          return { nonce: response.data };
        }
      } catch (error: any) {
        console.warn(`[AXIOM] ${baseUrl}/wallet-nonce failed:`, error?.response?.status, error?.response?.data || error.message);
        continue;
      }
    }

    this.failedAttempts++;
    return { ok: false, reason: 'NO_HEALTHY_ENDPOINTS' };
  }

  async verifySignature(pubkey: string, signature: string): Promise<VerifyResponse> {
    if (!this.healthyHost) {
      return { ok: false, error: 'NO_HEALTHY_HOST' };
    }

    // Get nonce first (this should be called after getWalletNonce)
    const nonceResult = await this.getWalletNonce(pubkey);
    if ('ok' in nonceResult) {
      return { ok: false, error: nonceResult.reason };
    }

    const verifyPayload = {
      walletAddress: pubkey,
      allowRegistration: true,
      isVerify: false,
      nonce: nonceResult.nonce,
      referrer: null,
      signature
    };

    try {
      const response = await this.http.post(`${this.healthyHost}/verify-wallet-v2`, verifyPayload);

      if (response.status === 200 && response.data && response.data.session) {
        return { ok: true, session: response.data.session };
      } else if (response.data && response.data.error) {
        return { ok: false, error: response.data.error };
      } else {
        return { ok: false, error: 'VERIFY_FAILED' };
      }
    } catch (error: any) {
      this.failedAttempts++;
      return { 
        ok: false, 
        error: error?.response?.data?.error || error.message || 'VERIFY_ERROR' 
      };
    }
  }

  async refreshCsrf(): Promise<void> {
    try {
      // Try to extract CSRF from a safe GET endpoint
      // Using the main page or a known read-only endpoint
      const response = await this.http.get(this.baseURL);
      
      // Look for CSRF token in common locations
      const csrfMatch = response.data?.match(/csrf[_-]?token["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
      }

      // Also check meta tags
      const metaMatch = response.data?.match(/<meta\s+name=["']csrf[_-]?token["']\s+content=["']([^"']+)["']/i);
      if (metaMatch) {
        this.csrfToken = metaMatch[1];
      }

    } catch (error) {
      console.warn('[AXIOM] CSRF refresh failed:', error);
      // Don't throw, continue without CSRF token
    }
  }

  async ping(): Promise<PingResponse> {
    if (!process.env.AXIOM_ENABLE || process.env.AXIOM_ENABLE !== 'true') {
      return { ok: false, code: 0, cookies: 0, error: 'DISABLED' };
    }

    if (!process.env.AXIOM_STEALTH || process.env.AXIOM_STEALTH !== 'true') {
      return { ok: false, code: 0, cookies: 0, error: 'STEALTH_DISABLED' };
    }

    try {
      // Try a safe read-only endpoint - use api6 meme-trending as it's known to exist
      const healthyHost = this.healthyHost || 'https://api6.axiom.trade';
      const response = await this.http.get(`${healthyHost}/meme-trending?timePeriod=1h`);
      
      // Count cookies in jar
      const cookies = this.jar.getCookiesSync(healthyHost).length;
      
      return {
        ok: response.status === 200,
        code: response.status,
        cookies,
        csrf: this.csrfToken
      };
    } catch (error: any) {
      return {
        ok: false,
        code: error?.response?.status || 0,
        cookies: 0,
        error: error?.response?.data || error.message || 'PING_FAILED'
      };
    }
  }
} 