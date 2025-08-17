/**
 * Axiom Cookie Intelligence System
 * Learns from real browser sessions to extract working authentication tokens
 * Monitors and mimics legitimate user cookie patterns
 */

export class AxiomCookieIntelligence {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.cookieDatabase = new Map();
    this.patterns = {
      authTokens: new Set(),
      sessionFormats: new Set(),
      validEndpoints: new Set()
    };
    this.lastUpdate = null;
  }

  /**
   * Analyze browser cookie data (from DevTools export or HAR file)
   */
  analyzeBrowserCookies(cookieData) {
    this.logger.log('[COOKIE-INTEL] 🍪 Analyzing browser cookie patterns...');
    
    try {
      // Handle different input formats
      let cookies = [];
      if (typeof cookieData === 'string') {
        cookies = this.parseCookieString(cookieData);
      } else if (Array.isArray(cookieData)) {
        cookies = cookieData;
      } else if (cookieData.cookies) {
        cookies = cookieData.cookies; // HAR file format
      }

      const intelligence = {
        authTokens: [],
        sessionPatterns: [],
        domainMappings: new Map(),
        timePatterns: []
      };

      cookies.forEach(cookie => {
        if (this.isAxiomRelated(cookie)) {
          this.analyzeCookiePattern(cookie, intelligence);
        }
      });

      this.updateIntelligence(intelligence);
      this.logger.log(`[COOKIE-INTEL] 📊 Analyzed ${cookies.length} cookies, found ${intelligence.authTokens.length} auth tokens`);
      
      return intelligence;
      
    } catch (err) {
      this.logger.error('[COOKIE-INTEL] Cookie analysis failed:', err.message);
      return null;
    }
  }

  /**
   * Parse cookie string from browser export
   */
  parseCookieString(cookieString) {
    const cookies = [];
    const lines = cookieString.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const parts = line.split('\t');
        if (parts.length >= 7) {
          cookies.push({
            domain: parts[0],
            path: parts[2],
            secure: parts[3] === 'TRUE',
            expiry: parseInt(parts[4]),
            name: parts[5],
            value: parts[6]
          });
        }
      }
    });
    
    return cookies;
  }

  /**
   * Check if cookie is related to Axiom
   */
  isAxiomRelated(cookie) {
    const domain = cookie.domain || '';
    const name = cookie.name || '';
    
    return domain.includes('axiom.trade') || 
           name.includes('auth') || 
           name.includes('session') ||
           name.includes('axiom');
  }

  /**
   * Analyze individual cookie pattern
   */
  analyzeCookiePattern(cookie, intelligence) {
    const { name, value, domain, expiry } = cookie;
    
    // Identify auth tokens
    if (name.includes('auth') || name.includes('token')) {
      intelligence.authTokens.push({
        name,
        value,
        domain,
        length: value.length,
        format: this.detectTokenFormat(value),
        expiry: expiry,
        strength: this.calculateTokenStrength(value)
      });
      
      this.patterns.authTokens.add(name);
    }

    // Track session patterns
    if (name.includes('session')) {
      intelligence.sessionPatterns.push({
        name,
        valueLength: value.length,
        domain,
        lifetime: expiry ? (expiry * 1000) - Date.now() : null
      });
    }

    // Map domains to cookie types
    if (!intelligence.domainMappings.has(domain)) {
      intelligence.domainMappings.set(domain, []);
    }
    intelligence.domainMappings.get(domain).push({ name, valueLength: value.length });
  }

  /**
   * Detect token format (JWT, UUID, etc.)
   */
  detectTokenFormat(value) {
    if (value.match(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+$/)) {
      return 'JWT';
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return 'UUID';
    } else if (value.match(/^[A-Za-z0-9+/=]+$/)) {
      return 'Base64';
    } else if (value.match(/^[a-f0-9]+$/i)) {
      return 'Hex';
    }
    return 'Unknown';
  }

  /**
   * Calculate token strength/validity score
   */
  calculateTokenStrength(value) {
    let strength = 0;
    
    // Length scoring
    if (value.length > 100) strength += 0.3;
    else if (value.length > 50) strength += 0.2;
    else if (value.length > 20) strength += 0.1;
    
    // Format scoring
    const format = this.detectTokenFormat(value);
    if (format === 'JWT') strength += 0.4;
    else if (format === 'UUID') strength += 0.3;
    else if (format === 'Base64') strength += 0.2;
    
    // Character diversity
    const charTypes = [
      /[a-z]/.test(value) ? 1 : 0,
      /[A-Z]/.test(value) ? 1 : 0,
      /[0-9]/.test(value) ? 1 : 0,
      /[^a-zA-Z0-9]/.test(value) ? 1 : 0
    ].reduce((a, b) => a + b, 0);
    strength += charTypes * 0.075;
    
    return Math.min(1.0, strength);
  }

  /**
   * Update internal intelligence database
   */
  updateIntelligence(newIntelligence) {
    // Store patterns for future use
    newIntelligence.authTokens.forEach(token => {
      this.cookieDatabase.set(`${token.domain}:${token.name}`, {
        ...token,
        lastSeen: Date.now(),
        useCount: 0
      });
    });

    this.lastUpdate = Date.now();
  }

  /**
   * Extract working cookies from browser session data
   */
  extractWorkingCookies(sessionData) {
    this.logger.log('[COOKIE-INTEL] 🔍 Extracting working cookies from session data...');
    
    const workingCookies = [];
    
    // Process different types of session data
    if (sessionData.har) {
      workingCookies.push(...this.extractFromHAR(sessionData.har));
    }
    
    if (sessionData.devtools) {
      workingCookies.push(...this.extractFromDevTools(sessionData.devtools));
    }
    
    if (sessionData.manual) {
      workingCookies.push(...this.extractFromManualExport(sessionData.manual));
    }

    // Rank by strength and recency
    const rankedCookies = workingCookies
      .sort((a, b) => (b.strength * b.recency) - (a.strength * a.recency))
      .slice(0, 5); // Top 5 candidates

    this.logger.log(`[COOKIE-INTEL] 📈 Found ${rankedCookies.length} high-quality cookie candidates`);
    return rankedCookies;
  }

  /**
   * Extract cookies from HAR file data
   */
  extractFromHAR(harData) {
    const cookies = [];
    
    try {
      harData.log.entries.forEach(entry => {
        if (entry.request.url.includes('axiom.trade')) {
          entry.request.cookies.forEach(cookie => {
            if (this.isAuthCookie(cookie)) {
              cookies.push({
                ...cookie,
                source: 'HAR',
                url: entry.request.url,
                timestamp: new Date(entry.startedDateTime).getTime(),
                strength: this.calculateTokenStrength(cookie.value),
                recency: this.calculateRecency(new Date(entry.startedDateTime).getTime())
              });
            }
          });
        }
      });
    } catch (err) {
      this.logger.warn('[COOKIE-INTEL] HAR parsing failed:', err.message);
    }
    
    return cookies;
  }

  /**
   * Extract cookies from DevTools export
   */
  extractFromDevTools(devtoolsData) {
    const cookies = [];
    
    try {
      devtoolsData.forEach(cookie => {
        if (this.isAxiomRelated(cookie) && this.isAuthCookie(cookie)) {
          cookies.push({
            ...cookie,
            source: 'DevTools',
            strength: this.calculateTokenStrength(cookie.value),
            recency: this.calculateRecency(cookie.expires * 1000)
          });
        }
      });
    } catch (err) {
      this.logger.warn('[COOKIE-INTEL] DevTools parsing failed:', err.message);
    }
    
    return cookies;
  }

  /**
   * Extract cookies from manual browser export
   */
  extractFromManualExport(manualData) {
    const cookies = [];
    
    try {
      // Handle various manual export formats
      if (typeof manualData === 'string') {
        const parsed = this.parseCookieString(manualData);
        parsed.forEach(cookie => {
          if (this.isAuthCookie(cookie)) {
            cookies.push({
              ...cookie,
              source: 'Manual',
              strength: this.calculateTokenStrength(cookie.value),
              recency: this.calculateRecency(cookie.expiry * 1000)
            });
          }
        });
      }
    } catch (err) {
      this.logger.warn('[COOKIE-INTEL] Manual parsing failed:', err.message);
    }
    
    return cookies;
  }

  /**
   * Check if cookie is likely an auth cookie
   */
  isAuthCookie(cookie) {
    const name = (cookie.name || '').toLowerCase();
    const value = cookie.value || '';
    
    return (name.includes('auth') || 
            name.includes('token') || 
            name.includes('session')) &&
           value.length > 20 &&
           this.calculateTokenStrength(value) > 0.3;
  }

  /**
   * Calculate recency score (newer = better)
   */
  calculateRecency(timestamp) {
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return Math.max(0, 1 - (age / maxAge));
  }

  /**
   * Get best cookie for specific endpoint
   */
  getBestCookieForEndpoint(endpoint) {
    const candidates = [];
    
    this.cookieDatabase.forEach((cookie, key) => {
      if (key.includes(endpoint) || endpoint.includes(cookie.domain)) {
        candidates.push({
          ...cookie,
          score: cookie.strength * this.calculateRecency(cookie.lastSeen)
        });
      }
    });
    
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }

  /**
   * Learn from successful authentication
   */
  recordSuccessfulAuth(endpoint, cookies, authToken) {
    this.logger.log(`[COOKIE-INTEL] 📚 Learning from successful auth at ${endpoint}`);
    
    // Store successful pattern
    this.patterns.validEndpoints.add(endpoint);
    
    if (authToken) {
      this.cookieDatabase.set(`${endpoint}:auth-access-token`, {
        name: 'auth-access-token',
        value: authToken,
        domain: new URL(endpoint).hostname,
        strength: this.calculateTokenStrength(authToken),
        lastSeen: Date.now(),
        useCount: 1,
        successRate: 1.0
      });
    }
  }

  /**
   * Get intelligence summary
   */
  getIntelligenceSummary() {
    return {
      totalCookies: this.cookieDatabase.size,
      authTokenPatterns: Array.from(this.patterns.authTokens),
      validEndpoints: Array.from(this.patterns.validEndpoints),
      lastUpdate: this.lastUpdate,
      topCookies: Array.from(this.cookieDatabase.entries())
        .sort(([,a], [,b]) => b.strength - a.strength)
        .slice(0, 3)
        .map(([key, cookie]) => ({ key, strength: cookie.strength, lastSeen: cookie.lastSeen }))
    };
  }
}

export default AxiomCookieIntelligence; 