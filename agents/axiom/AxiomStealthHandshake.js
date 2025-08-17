/**
 * Axiom Stealth Handshake
 * Intelligence-first authentication that uses reconnaissance to avoid bans
 * Only attempts authentication after confirming the target endpoint is active and safe
 */
import AxiomStealthScout from './AxiomStealthScout.js';
import crypto from 'crypto';

export class AxiomStealthHandshake {
  constructor({ walletAddress, privKeyBase58, logger = console } = {}) {
    this.walletAddress = walletAddress;
    this.privKeyBase58 = privKeyBase58;
    this.logger = logger;
    this.scout = new AxiomStealthScout({ logger });
    this.session = null;
    this.lastSuccessfulEndpoint = null;
    this.humanBehavior = {
      readingTime: { min: 1500, max: 4000 }, // Time to "read" before acting
      typingSpeed: 80, // chars per minute for realistic form filling
      mousePauses: { min: 200, max: 800 }
    };
  }

  /**
   * Simulate human-like reading/thinking time before taking action
   */
  async simulateHumanReading() {
    const { min, max } = this.humanBehavior.readingTime;
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simulate realistic typing speed for form inputs
   */
  async simulateTyping(text) {
    const { typingSpeed } = this.humanBehavior;
    const charDelay = (60 / typingSpeed) * 1000; // ms per character
    const totalTime = text.length * charDelay;
    const variance = totalTime * 0.3; // 30% variance
    const actualTime = totalTime + (Math.random() - 0.5) * variance;
    await new Promise(resolve => setTimeout(resolve, actualTime));
  }

  /**
   * Generate realistic browser fingerprint headers
   */
  generateBrowserFingerprint() {
    const fingerprints = [
      {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
      },
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'sec-ch-ua': undefined,
        'sec-ch-ua-mobile': undefined,
        'sec-ch-ua-platform': undefined
      }
    ];
    
    return fingerprints[Math.floor(Math.random() * fingerprints.length)];
  }

  /**
   * Create headers that perfectly mimic a real browser session
   */
  createAuthenticHeaders(isInitialRequest = true) {
    const fingerprint = this.generateBrowserFingerprint();
    
    const baseHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Referer': 'https://axiom.trade/',
      'Origin': 'https://axiom.trade',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      ...fingerprint
    };

    // Remove undefined values (for Safari fingerprint)
    Object.keys(baseHeaders).forEach(key => {
      if (baseHeaders[key] === undefined) {
        delete baseHeaders[key];
      }
    });

    if (!isInitialRequest) {
      baseHeaders['X-Requested-With'] = 'XMLHttpRequest';
    }

    return baseHeaders;
  }

  /**
   * Perform stealth authentication with full human mimicry
   */
  async performStealthAuth() {
    this.logger.log('[STEALTH-AUTH] 🕵️ Beginning stealth authentication sequence...');

    try {
      // Step 1: Reconnaissance - find active endpoint without triggering alarms
      this.logger.log('[STEALTH-AUTH] Phase 1: Intelligence gathering...');
      const recon = await this.scout.performStealthRecon();
      
      if (!recon.success) {
        throw new Error('Reconnaissance failed - no suitable endpoints discovered');
      }

      const targetEndpoint = recon.bestEndpoint;
      this.logger.log(`[STEALTH-AUTH] 🎯 Target selected: ${targetEndpoint}`);

      // Step 2: Human-like pause to "read and understand" the interface
      this.logger.log('[STEALTH-AUTH] Phase 2: Simulating user interaction...');
      await this.simulateHumanReading();

      // Step 3: Wallet nonce request (mimic real user connecting wallet)
      this.logger.log('[STEALTH-AUTH] Phase 3: Wallet connection simulation...');
      const nonce = await this.requestNonceStealthily(targetEndpoint);
      
      // Step 4: Simulate user "reading" the signature request
      await this.simulateHumanReading();
      
      // Step 5: Sign the nonce (simulate user approving in wallet)
      this.logger.log('[STEALTH-AUTH] Phase 4: Signature generation...');
      const signature = await this.signNonceStealthily(nonce);
      
      // Step 6: Human-like delay before submitting (user clicking confirm)
      await this.simulateTyping('confirming transaction...');
      
      // Step 7: Submit verification
      this.logger.log('[STEALTH-AUTH] Phase 5: Authentication completion...');
      const authResult = await this.verifyWalletStealthily(targetEndpoint, nonce, signature);
      
      this.session = authResult;
      this.lastSuccessfulEndpoint = targetEndpoint;
      
      this.logger.log('[STEALTH-AUTH] ✅ Stealth authentication successful!');
      return authResult;

    } catch (err) {
      this.logger.error('[STEALTH-AUTH] Authentication failed:', err.message);
      throw err;
    }
  }

  /**
   * Request nonce with perfect human mimicry
   */
  async requestNonceStealthily(endpoint) {
    const headers = this.createAuthenticHeaders(true);
    
    // Add subtle timing variation like a real user
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const response = await fetch(`${endpoint}/wallet-nonce`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        walletAddress: this.walletAddress,
        // Add fields that real frontend might send
        timestamp: Date.now(),
        userAgent: headers['User-Agent']
      })
    });

    if (!response.ok) {
      throw new Error(`Nonce request failed: ${response.status} - ${await response.text()}`);
    }

    const nonce = await response.text();
    this.logger.log(`[STEALTH-AUTH] 🎲 Nonce received: ${nonce.substring(0, 16)}...`);
    
    return nonce.trim().replace(/"/g, '');
  }

  /**
   * Sign nonce with realistic delay simulation
   */
  async signNonceStealthily(nonce) {
    // Simulate time for user to review and approve signature in wallet
    const walletApprovalTime = 3000 + Math.random() * 4000; // 3-7 seconds
    this.logger.log('[STEALTH-AUTH] ⏱️ Simulating wallet approval time...');
    await new Promise(resolve => setTimeout(resolve, walletApprovalTime));
    
    try {
      // Simplified signing - in production you'd use actual Solana signing
      const message = Buffer.from(nonce, 'utf8');
      const hash = crypto.createHash('sha256').update(message).digest();
      const signature = hash.toString('base64');
      
      this.logger.log('[STEALTH-AUTH] ✍️ Signature generated');
      return signature;
      
    } catch (err) {
      throw new Error('Signature generation failed: ' + err.message);
    }
  }

  /**
   * Verify wallet with final human-like touches
   */
  async verifyWalletStealthily(endpoint, nonce, signature) {
    const headers = this.createAuthenticHeaders(false);
    
    // Small delay to simulate network lag that user would experience
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
    
    const verifyPayload = {
      walletAddress: this.walletAddress,
      nonce,
      signature,
      allowRegistration: true,
      isVerify: false,
      referrer: 'https://axiom.trade',
      // Add realistic client metadata
      clientInfo: {
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en-US'
      }
    };

    const response = await fetch(`${endpoint}/verify-wallet-v2`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verifyPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Wallet verification failed: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    const cookies = response.headers.get('set-cookie') || '';
    const authToken = this.extractAuthToken(cookies);

    return {
      session: result.session,
      authToken,
      cookies,
      endpoint,
      timestamp: Date.now()
    };
  }

  /**
   * Extract auth token from cookies
   */
  extractAuthToken(cookieHeader) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/auth-access-token=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if current session is still valid
   */
  isSessionValid() {
    if (!this.session) return false;
    
    // Sessions typically expire after 15 minutes
    const sessionAge = Date.now() - this.session.timestamp;
    const maxAge = 14 * 60 * 1000; // 14 minutes to be safe
    
    return sessionAge < maxAge;
  }

  /**
   * Get current session or perform new stealth auth if needed
   */
  async ensureValidSession() {
    if (this.isSessionValid()) {
      this.logger.log('[STEALTH-AUTH] ♻️ Using existing valid session');
      return this.session;
    }

    this.logger.log('[STEALTH-AUTH] 🔄 Session expired, performing new stealth authentication...');
    return await this.performStealthAuth();
  }
}

export default AxiomStealthHandshake; 