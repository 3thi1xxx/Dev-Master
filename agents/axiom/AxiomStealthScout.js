/**
 * Axiom Stealth Scout
 * Intelligence-first reconnaissance system to discover active endpoints and cookies
 * Mimics human behavior to avoid detection and bans
 */

export class AxiomStealthScout {
  constructor({ logger = console, userAgent = null } = {}) {
    this.logger = logger;
    this.userAgent = userAgent || this.generateRealisticUserAgent();
    this.intelligence = {
      activeEndpoints: new Map(),
      cookiePatterns: new Map(),
      lastScan: null,
      banSignals: new Set(),
      humanTiming: { min: 2000, max: 8000 } // Human-like delays
    };
  }

  /**
   * Generate realistic, rotating user agent
   */
  generateRealisticUserAgent() {
    const browsers = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return browsers[Math.floor(Math.random() * browsers.length)];
  }

  /**
   * Human-like delay between requests
   */
  async humanDelay(multiplier = 1) {
    const { min, max } = this.intelligence.humanTiming;
    const delay = (min + Math.random() * (max - min)) * multiplier;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Passive frontend analysis - check what the real axiom.trade website is using
   */
  async analyzeFrontendBehavior() {
    this.logger.log('[SCOUT] 🕵️ Analyzing frontend behavior...');
    
    try {
      // Step 1: Load the main axiom.trade page like a real user
      const response = await fetch('https://axiom.trade', {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        }
      });

      if (!response.ok) {
        throw new Error(`Frontend analysis failed: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract API endpoint patterns from frontend JavaScript
      const apiPatterns = this.extractAPIPatterns(html);
      const configPatterns = this.extractConfigPatterns(html);
      
      this.logger.log(`[SCOUT] 📊 Found ${apiPatterns.length} API patterns, ${configPatterns.length} config patterns`);
      
      return { apiPatterns, configPatterns, html };
      
    } catch (err) {
      this.logger.error('[SCOUT] Frontend analysis failed:', err.message);
      return { apiPatterns: [], configPatterns: [], html: null };
    }
  }

  /**
   * Extract API endpoint patterns from frontend code
   */
  extractAPIPatterns(html) {
    const patterns = [];
    
    // Look for API endpoint references in the HTML/JS
    const apiRegexes = [
      /https?:\/\/api\d*\.axiom\.trade/g,
      /api\d*\.axiom\.trade/g,
      /"baseURL":\s*"([^"]+)"/g,
      /"apiBase":\s*"([^"]+)"/g,
      /REACT_APP_API_URL[^"]*"([^"]+)"/g
    ];

    apiRegexes.forEach(regex => {
      const matches = html.match(regex) || [];
      matches.forEach(match => {
        const clean = match.replace(/['"]/g, '');
        if (clean.includes('axiom.trade') && !patterns.includes(clean)) {
          patterns.push(clean);
        }
      });
    });

    return patterns;
  }

  /**
   * Extract configuration patterns that might reveal active endpoints
   */
  extractConfigPatterns(html) {
    const patterns = [];
    
    // Look for configuration objects or environment variables
    const configRegexes = [
      /window\.__ENV__\s*=\s*({[^}]+})/g,
      /process\.env\.[A-Z_]+\s*=\s*"([^"]+)"/g,
      /"environment":\s*"([^"]+)"/g
    ];

    configRegexes.forEach(regex => {
      const matches = html.match(regex) || [];
      patterns.push(...matches);
    });

    return patterns;
  }

  /**
   * Intelligent endpoint discovery - test endpoints like a real user would
   */
  async discoverActiveEndpoints(suspectedEndpoints = []) {
    this.logger.log('[SCOUT] 🔍 Beginning intelligent endpoint discovery...');
    
    const baseEndpoints = suspectedEndpoints.length > 0 ? suspectedEndpoints : [
      'https://api3.axiom.trade',
      'https://api6.axiom.trade', 
      'https://api7.axiom.trade',
      'https://api8.axiom.trade'
    ];

    const activeEndpoints = [];

    for (const endpoint of baseEndpoints) {
      await this.humanDelay(); // Human-like delay between checks
      
      try {
        this.logger.log(`[SCOUT] 🔍 Quietly checking ${endpoint}...`);
        
        // Use a very lightweight, passive check that looks like normal browsing
        const healthCheck = await this.passiveEndpointCheck(endpoint);
        
        if (healthCheck.isActive) {
          activeEndpoints.push({
            endpoint,
            responseTime: healthCheck.responseTime,
            confidence: healthCheck.confidence,
            cookieHints: healthCheck.cookieHints,
            timestamp: Date.now()
          });
          
          this.intelligence.activeEndpoints.set(endpoint, healthCheck);
          this.logger.log(`[SCOUT] ✅ ${endpoint} appears active (${healthCheck.responseTime}ms)`);
        } else {
          this.logger.log(`[SCOUT] ❌ ${endpoint} seems inactive or protected`);
        }
        
      } catch (err) {
        this.logger.warn(`[SCOUT] ⚠️ ${endpoint} check failed:`, err.message);
      }
    }

    this.intelligence.lastScan = Date.now();
    return activeEndpoints;
  }

  /**
   * Passive endpoint check that doesn't trigger security systems
   */
  async passiveEndpointCheck(endpoint) {
    const start = Date.now();
    
    try {
      // Try a very innocent request that real browsers would make
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://axiom.trade/',
          'Origin': 'https://axiom.trade'
        },
        signal: AbortSignal.timeout(5000) // Quick timeout
      });

      const responseTime = Date.now() - start;
      const cookieHints = this.extractCookieHints(response.headers);
      
      // Analyze response to determine if endpoint is active and healthy
      const isActive = response.status < 500; // Even 401/403 means it's active
      const confidence = this.calculateEndpointConfidence(response, responseTime);
      
      return { isActive, responseTime, confidence, cookieHints };
      
    } catch (err) {
      // Network errors might mean inactive endpoint or blocking
      return { 
        isActive: false, 
        responseTime: Date.now() - start, 
        confidence: 0,
        error: err.message 
      };
    }
  }

  /**
   * Extract cookie patterns from response headers
   */
  extractCookieHints(headers) {
    const cookieHints = [];
    const setCookie = headers.get('set-cookie');
    
    if (setCookie) {
      // Look for patterns that might indicate session cookies
      const patterns = setCookie.match(/[a-zA-Z-]+=[^;]+/g) || [];
      patterns.forEach(pattern => {
        if (pattern.includes('session') || pattern.includes('auth') || pattern.includes('token')) {
          cookieHints.push(pattern);
        }
      });
    }
    
    return cookieHints;
  }

  /**
   * Calculate confidence score for endpoint health
   */
  calculateEndpointConfidence(response, responseTime) {
    let confidence = 0;
    
    // Response time scoring
    if (responseTime < 1000) confidence += 0.3;
    else if (responseTime < 3000) confidence += 0.2;
    else if (responseTime < 5000) confidence += 0.1;
    
    // Status code scoring
    if (response.status === 200) confidence += 0.4;
    else if (response.status === 401 || response.status === 403) confidence += 0.3; // Protected but active
    else if (response.status < 500) confidence += 0.2;
    
    // Header analysis
    if (response.headers.get('server')?.includes('nginx')) confidence += 0.1;
    if (response.headers.get('set-cookie')) confidence += 0.2;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Get the best endpoint to use for authentication
   */
  getBestEndpoint() {
    let bestEndpoint = null;
    let bestScore = 0;
    
    this.intelligence.activeEndpoints.forEach((data, endpoint) => {
      const score = data.confidence * (1 - (Date.now() - data.timestamp) / 900000); // Decay over 15 mins
      if (score > bestScore) {
        bestScore = score;
        bestEndpoint = endpoint;
      }
    });
    
    return bestEndpoint;
  }

  /**
   * Full stealth reconnaissance cycle
   */
  async performStealthRecon() {
    this.logger.log('[SCOUT] 🕵️ Starting stealth reconnaissance cycle...');
    
    try {
      // Step 1: Analyze what the real frontend is doing
      const frontendIntel = await this.analyzeFrontendBehavior();
      await this.humanDelay(0.5);
      
      // Step 2: Discover active endpoints intelligently
      const activeEndpoints = await this.discoverActiveEndpoints(frontendIntel.apiPatterns);
      
      // Step 3: Wait a bit more to seem human
      await this.humanDelay(0.8);
      
      const bestEndpoint = this.getBestEndpoint();
      
      this.logger.log(`[SCOUT] 🎯 Reconnaissance complete. Best endpoint: ${bestEndpoint || 'none found'}`);
      
      return {
        success: bestEndpoint !== null,
        bestEndpoint,
        activeEndpoints,
        intelligence: this.intelligence,
        recommendation: bestEndpoint ? 'Ready for stealth authentication' : 'No suitable endpoints found'
      };
      
    } catch (err) {
      this.logger.error('[SCOUT] Reconnaissance failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if we might be getting banned/blocked
   */
  detectBanSignals(response, endpoint) {
    const banIndicators = [
      'rate limit',
      'too many requests', 
      'blocked',
      'forbidden',
      'suspicious activity',
      'cloudflare'
    ];
    
    const responseText = response.statusText.toLowerCase();
    const hasWarningSignal = banIndicators.some(indicator => responseText.includes(indicator));
    
    if (hasWarningSignal || response.status === 429) {
      this.intelligence.banSignals.add(`${endpoint}:${Date.now()}`);
      this.logger.warn(`[SCOUT] ⚠️ Potential ban signal detected at ${endpoint}`);
      return true;
    }
    
    return false;
  }
}

export default AxiomStealthScout; 