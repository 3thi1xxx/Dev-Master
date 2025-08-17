/**
 * Axiom Stealth System
 * Master controller that orchestrates intelligent reconnaissance, human behavior simulation,
 * and ban prevention to safely access Axiom APIs without detection
 */
import AxiomStealthScout from './AxiomStealthScout.js';
import AxiomStealthHandshake from './AxiomStealthHandshake.js';
import AxiomCookieIntelligence from './AxiomCookieIntelligence.js';

export class AxiomStealthSystem {
  constructor({ walletAddress, privKeyBase58, logger = console } = {}) {
    this.walletAddress = walletAddress;
    this.privKeyBase58 = privKeyBase58;
    this.logger = logger;
    
    // Core components
    this.scout = new AxiomStealthScout({ logger });
    this.handshake = new AxiomStealthHandshake({ walletAddress, privKeyBase58, logger });
    this.cookieIntel = new AxiomCookieIntelligence({ logger });
    
    // Ban prevention system
    this.banPrevention = {
      consecutiveFailures: 0,
      lastFailureTime: null,
      backoffMultiplier: 1,
      maxBackoff: 60000, // 1 minute max
      suspiciousActivityCount: 0,
      cooldownUntil: null
    };
    
    // Human behavior patterns
    this.userSession = {
      sessionStartTime: Date.now(),
      actionsThisSession: 0,
      lastActionTime: null,
      browserFingerprint: null,
      userAgentRotation: 0
    };
  }

  /**
   * Initialize stealth system with optional browser session data
   */
  async initialize(browserSessionData = null) {
    this.logger.log('[STEALTH-SYS] 🚀 Initializing stealth system...');
    
    try {
      // Learn from browser data if provided
      if (browserSessionData) {
        await this.learnFromBrowserSession(browserSessionData);
      }
      
      // Simulate realistic user session start
      await this.simulateUserSessionStart();
      
      this.logger.log('[STEALTH-SYS] ✅ Stealth system initialized');
      return { success: true, mode: 'stealth', capabilities: this.getCapabilities() };
      
    } catch (err) {
      this.logger.error('[STEALTH-SYS] Initialization failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Learn from real browser session data
   */
  async learnFromBrowserSession(sessionData) {
    this.logger.log('[STEALTH-SYS] 🧠 Learning from browser session...');
    
    try {
      // Analyze cookies for auth patterns
      if (sessionData.cookies) {
        const cookieIntel = await this.cookieIntel.analyzeBrowserCookies(sessionData.cookies);
        if (cookieIntel) {
          this.logger.log(`[STEALTH-SYS] 📚 Learned ${cookieIntel.authTokens.length} auth patterns`);
        }
      }
      
      // Extract timing patterns from HAR data
      if (sessionData.har) {
        await this.analyzeUserTimingPatterns(sessionData.har);
      }
      
      // Learn successful endpoint patterns
      if (sessionData.successfulEndpoints) {
        sessionData.successfulEndpoints.forEach(endpoint => {
          this.scout.intelligence.activeEndpoints.set(endpoint, {
            isActive: true,
            confidence: 0.9,
            responseTime: 500,
            lastSeen: Date.now()
          });
        });
      }
      
    } catch (err) {
      this.logger.warn('[STEALTH-SYS] Browser session learning failed:', err.message);
    }
  }

  /**
   * Analyze user timing patterns from HAR data
   */
  async analyzeUserTimingPatterns(harData) {
    try {
      const timings = [];
      let lastTime = null;
      
      harData.log.entries.forEach(entry => {
        if (entry.request.url.includes('axiom.trade')) {
          const currentTime = new Date(entry.startedDateTime).getTime();
          if (lastTime) {
            timings.push(currentTime - lastTime);
          }
          lastTime = currentTime;
        }
      });
      
      if (timings.length > 0) {
        const avgDelay = timings.reduce((a, b) => a + b, 0) / timings.length;
        const minDelay = Math.min(...timings);
        const maxDelay = Math.max(...timings);
        
        // Update human timing patterns based on real user data
        this.scout.intelligence.humanTiming = {
          min: Math.max(1000, minDelay * 0.8),
          max: Math.min(10000, maxDelay * 1.2),
          avg: avgDelay
        };
        
        this.logger.log(`[STEALTH-SYS] 📊 Learned timing: ${minDelay}ms - ${maxDelay}ms (avg: ${Math.round(avgDelay)}ms)`);
      }
    } catch (err) {
      this.logger.warn('[STEALTH-SYS] Timing analysis failed:', err.message);
    }
  }

  /**
   * Simulate realistic user session start
   */
  async simulateUserSessionStart() {
    // Simulate user opening browser and navigating to axiom.trade
    this.userSession.sessionStartTime = Date.now();
    this.userSession.actionsThisSession = 0;
    
    // Randomize user agent rotation
    this.userSession.userAgentRotation = Math.floor(Math.random() * 3);
    
    // Simulate initial page load delay
    const initialDelay = 2000 + Math.random() * 3000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, initialDelay));
  }

  /**
   * Check if we're in a cooldown period due to suspicious activity
   */
  isInCooldown() {
    if (!this.banPrevention.cooldownUntil) return false;
    
    const now = Date.now();
    if (now < this.banPrevention.cooldownUntil) {
      const remainingMs = this.banPrevention.cooldownUntil - now;
      this.logger.log(`[STEALTH-SYS] ⏸️ Still in cooldown for ${Math.round(remainingMs / 1000)}s`);
      return true;
    }
    
    // Cooldown expired
    this.banPrevention.cooldownUntil = null;
    this.banPrevention.consecutiveFailures = 0;
    this.banPrevention.backoffMultiplier = 1;
    return false;
  }

  /**
   * Handle authentication failure with intelligent backoff
   */
  handleAuthFailure(error, endpoint) {
    this.banPrevention.consecutiveFailures++;
    this.banPrevention.lastFailureTime = Date.now();
    
    // Detect ban signals
    const errorMsg = error.message.toLowerCase();
    const banSignals = ['rate limit', 'too many', 'blocked', 'forbidden', 'suspicious'];
    const isBanSignal = banSignals.some(signal => errorMsg.includes(signal));
    
    if (isBanSignal) {
      this.banPrevention.suspiciousActivityCount++;
      this.logger.warn(`[STEALTH-SYS] 🚨 Ban signal detected: ${error.message}`);
      
      // Aggressive cooldown for ban signals
      const cooldownMs = Math.min(
        this.banPrevention.maxBackoff * 10, // Up to 10 minutes
        5000 * Math.pow(2, this.banPrevention.suspiciousActivityCount)
      );
      
      this.banPrevention.cooldownUntil = Date.now() + cooldownMs;
      this.logger.warn(`[STEALTH-SYS] 😴 Entering ${Math.round(cooldownMs / 1000)}s cooldown`);
      
    } else {
      // Regular exponential backoff
      const backoffMs = Math.min(
        this.banPrevention.maxBackoff,
        1000 * Math.pow(2, this.banPrevention.consecutiveFailures - 1)
      );
      
      this.banPrevention.cooldownUntil = Date.now() + backoffMs;
      this.logger.log(`[STEALTH-SYS] ⏱️ Backing off for ${Math.round(backoffMs / 1000)}s`);
    }
  }

  /**
   * Perform complete stealth authentication cycle
   */
  async authenticateStealthily() {
    this.logger.log('[STEALTH-SYS] 🎭 Beginning stealth authentication cycle...');
    
    try {
      // Check cooldown status
      if (this.isInCooldown()) {
        throw new Error('System in cooldown - cannot authenticate');
      }
      
      // Simulate human session continuation
      await this.simulateUserActivity();
      
      // Phase 1: Reconnaissance
      this.logger.log('[STEALTH-SYS] Phase 1: Stealth reconnaissance...');
      const recon = await this.scout.performStealthRecon();
      
      if (!recon.success) {
        throw new Error('Reconnaissance failed - no suitable targets');
      }
      
      // Phase 2: Check for existing valid cookies
      this.logger.log('[STEALTH-SYS] Phase 2: Cookie intelligence check...');
      const existingCookie = this.cookieIntel.getBestCookieForEndpoint(recon.bestEndpoint);
      
      if (existingCookie && this.isCookieStillValid(existingCookie)) {
        this.logger.log('[STEALTH-SYS] 🍪 Using existing valid cookie');
        return {
          success: true,
          method: 'cookie_reuse',
          authToken: existingCookie.value,
          endpoint: recon.bestEndpoint,
          confidence: existingCookie.strength
        };
      }
      
      // Phase 3: Full stealth handshake
      this.logger.log('[STEALTH-SYS] Phase 3: Stealth handshake...');
      const authResult = await this.handshake.performStealthAuth();
      
      // Phase 4: Learn from success
      this.cookieIntel.recordSuccessfulAuth(
        authResult.endpoint,
        authResult.cookies,
        authResult.authToken
      );
      
      // Reset failure counters on success
      this.banPrevention.consecutiveFailures = 0;
      this.banPrevention.suspiciousActivityCount = Math.max(0, this.banPrevention.suspiciousActivityCount - 1);
      
      this.logger.log('[STEALTH-SYS] ✅ Stealth authentication successful!');
      
      return {
        success: true,
        method: 'stealth_handshake',
        authToken: authResult.authToken,
        endpoint: authResult.endpoint,
        session: authResult.session,
        confidence: 0.95
      };
      
    } catch (err) {
      this.handleAuthFailure(err, 'unknown');
      this.logger.error('[STEALTH-SYS] Authentication failed:', err.message);
      throw err;
    }
  }

  /**
   * Check if a cookie is still valid
   */
  isCookieStillValid(cookie) {
    if (!cookie.lastSeen) return false;
    
    const age = Date.now() - cookie.lastSeen;
    const maxAge = 14 * 60 * 1000; // 14 minutes
    
    return age < maxAge && cookie.strength > 0.5;
  }

  /**
   * Simulate realistic user activity between actions
   */
  async simulateUserActivity() {
    this.userSession.actionsThisSession++;
    
    // Simulate reading/thinking time based on session length
    const sessionAge = Date.now() - this.userSession.sessionStartTime;
    const baseDelay = sessionAge < 60000 ? 3000 : 1500; // Longer delays early in session
    
    const activityDelay = baseDelay + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, activityDelay));
    
    this.userSession.lastActionTime = Date.now();
  }

  /**
   * Get system capabilities and status
   */
  getCapabilities() {
    return {
      reconnaissance: true,
      humanBehaviorSimulation: true,
      cookieIntelligence: true,
      banPrevention: true,
      endpointRotation: true,
      intelligentBackoff: true,
      browserFingerprinting: true,
      sessionManagement: true
    };
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      initialized: this.userSession.sessionStartTime !== null,
      inCooldown: this.isInCooldown(),
      consecutiveFailures: this.banPrevention.consecutiveFailures,
      actionsThisSession: this.userSession.actionsThisSession,
      knownEndpoints: this.scout.intelligence.activeEndpoints.size,
      learnedCookies: this.cookieIntel.cookieDatabase.size,
      suspiciousActivityCount: this.banPrevention.suspiciousActivityCount,
      sessionAge: Date.now() - this.userSession.sessionStartTime
    };
  }

  /**
   * Emergency reset - clear all state and start fresh
   */
  emergencyReset() {
    this.logger.log('[STEALTH-SYS] 🚨 Emergency reset initiated');
    
    // Clear ban prevention state
    this.banPrevention = {
      consecutiveFailures: 0,
      lastFailureTime: null,
      backoffMultiplier: 1,
      maxBackoff: 60000,
      suspiciousActivityCount: 0,
      cooldownUntil: null
    };
    
    // Reset session
    this.userSession = {
      sessionStartTime: Date.now(),
      actionsThisSession: 0,
      lastActionTime: null,
      browserFingerprint: null,
      userAgentRotation: 0
    };
    
    // Clear intelligence (but keep learned patterns)
    this.scout.intelligence.activeEndpoints.clear();
    this.scout.intelligence.lastScan = null;
    
    this.logger.log('[STEALTH-SYS] ✅ Emergency reset complete');
  }
}

export default AxiomStealthSystem; 