# 🕵️ Axiom Stealth Authentication System

## Problem Solved

**The Challenge**: Axiom API endpoints and cookies change every ~15 minutes. Brute-force discovery gets you banned quickly. Traditional systems are too aggressive and detectable.

**The Solution**: Intelligence-first authentication that acts exactly like a human user, discovers endpoints passively, and never triggers security systems.

## 🧠 Core Philosophy: "Shadow the Human User"

Instead of attacking the API, this system **mimics a real user** browsing axiom.trade:

1. **🔍 Reconnaissance First**: Analyze the frontend to discover active endpoints
2. **🎭 Perfect Human Mimicry**: Timing, headers, and behavior patterns identical to real users  
3. **🍪 Learn from Success**: Extract and reuse working auth tokens from browser sessions
4. **🛡️ Ban Prevention**: Detect warning signs and intelligently back off

---

## 🏗️ System Architecture

```
AxiomStealthSystem (Master Controller)
├── AxiomStealthScout (Intelligence Gathering)
├── AxiomStealthHandshake (Human-Like Authentication)  
├── AxiomCookieIntelligence (Session Learning)
└── Ban Prevention System
```

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **StealthScout** | Endpoint discovery | Frontend analysis, passive probing, confidence scoring |
| **StealthHandshake** | Authentication | Browser fingerprinting, timing simulation, realistic headers |
| **CookieIntelligence** | Session management | Pattern learning, token reuse, strength scoring |
| **BanPrevention** | Safety system | Signal detection, intelligent backoff, cooldown management |

---

## 🔄 How It Works

### Phase 1: Intelligence Gathering
```javascript
// Load axiom.trade like a real user
const frontend = await scout.analyzeFrontendBehavior();

// Extract API patterns from JavaScript
const endpoints = scout.extractAPIPatterns(frontend.html);

// Test endpoints passively (no brute force)
const active = await scout.discoverActiveEndpoints(endpoints);
```

### Phase 2: Human Behavior Simulation  
```javascript
// Perfect browser fingerprint
const headers = handshake.createAuthenticHeaders();

// Realistic reading time (1.5-4 seconds)
await handshake.simulateHumanReading();

// Typing speed simulation
await handshake.simulateTyping("wallet connection");
```

### Phase 3: Stealth Authentication
```javascript
// Only target the best endpoint (no spray-and-pray)
const nonce = await handshake.requestNonceStealthily(bestEndpoint);

// Simulate wallet approval time (3-7 seconds)
const signature = await handshake.signNonceStealthily(nonce);

// Complete authentication with perfect mimicry
const auth = await handshake.verifyWalletStealthily(endpoint, nonce, signature);
```

### Phase 4: Learning & Adaptation
```javascript
// Learn from successful patterns
cookieIntel.recordSuccessfulAuth(endpoint, cookies, authToken);

// Build intelligence database for future use
cookieIntel.updateIntelligence(newPatterns);
```

---

## 🚀 Quick Start

### 1. Initialize Stealth System
```javascript
import AxiomStealthSystem from './agents/axiom/AxiomStealthSystem.js';

const stealth = new AxiomStealthSystem({
  walletAddress: 'YOUR_SOLANA_WALLET_ADDRESS',
  privKeyBase58: 'YOUR_PRIVATE_KEY_BASE58'
});

// Initialize (optionally with browser session data)
await stealth.initialize(browserData);
```

### 2. Authenticate Stealthily
```javascript
try {
  const auth = await stealth.authenticateStealthily();
  
  console.log('Success!', {
    method: auth.method,        // 'cookie_reuse' or 'stealth_handshake'  
    authToken: auth.authToken,  // Ready to use
    endpoint: auth.endpoint,    // Active endpoint
    confidence: auth.confidence // Success probability
  });
  
} catch (err) {
  console.log('Authentication failed:', err.message);
  // System automatically handles backoff and cooldowns
}
```

### 3. Check System Status
```javascript
const status = stealth.getStatus();
console.log({
  inCooldown: status.inCooldown,
  consecutiveFailures: status.consecutiveFailures,
  knownEndpoints: status.knownEndpoints,
  learnedCookies: status.learnedCookies
});
```

---

## 🎭 Human Behavior Features

### Realistic Timing Patterns
- **Reading delays**: 1.5-4 seconds between actions
- **Typing simulation**: 80 chars/min with variance
- **Wallet approval**: 3-7 seconds (realistic user decision time)
- **Network delays**: Random jitter to mimic real connections

### Perfect Browser Fingerprinting
- **Chrome/Safari/Firefox**: Rotating user agents with correct headers
- **Platform detection**: macOS/Windows specific header combinations  
- **Security headers**: `sec-ch-ua`, `Sec-Fetch-*` headers perfectly matched
- **Referer chains**: Proper `Origin` and `Referer` headers from axiom.trade

### Anti-Detection Measures
- **No burst requests**: Always human-like delays between actions
- **Header consistency**: Every request looks exactly like a real browser
- **Session continuity**: Maintains realistic user session patterns
- **Error handling**: Graceful failures that don't trigger alarms

---

## 🍪 Cookie Intelligence System

### Learning from Browser Sessions

**Export your working browser session** and feed it to the system:

```javascript
// From Chrome DevTools > Application > Cookies
const browserCookies = [
  { name: 'auth-access-token', value: 'eyJ...', domain: 'api6.axiom.trade' },
  // ... more cookies
];

// From HAR file (DevTools > Network > Export HAR)  
const harData = { log: { entries: [...] } };

// Initialize with intelligence
await stealth.initialize({
  cookies: browserCookies,
  har: harData,
  successfulEndpoints: ['https://api6.axiom.trade']
});
```

### Smart Token Reuse
- **Strength scoring**: JWT tokens score higher than simple session IDs
- **Freshness tracking**: Newer tokens preferred over older ones
- **Success correlation**: Learns which tokens work with which endpoints
- **Expiration awareness**: Automatically detects and handles expired tokens

---

## 🛡️ Ban Prevention System

### Detection Signals
The system watches for these warning signs:
- `rate limit` / `too many requests`
- `blocked` / `forbidden` responses  
- `suspicious activity` messages
- Consecutive 429 status codes
- CloudFlare challenge pages

### Intelligent Response
```javascript
// Soft failure: Regular exponential backoff
1st failure → 1 second cooldown
2nd failure → 2 second cooldown  
3rd failure → 4 second cooldown
// ... up to 60 seconds max

// Ban signal detected: Aggressive cooldown
Ban signal → 5-10 minute cooldown
Multiple bans → Up to 30 minute cooldown
```

### Emergency Reset
```javascript
// Clear all state and start fresh
stealth.emergencyReset();
```

---

## 📊 Comparison: Legacy vs Stealth

| Aspect | Legacy System | Stealth System |
|--------|---------------|----------------|
| **Endpoint Discovery** | Brute force api1-api15 | Intelligent frontend analysis |
| **Request Timing** | Immediate/aggressive | Human-like delays (1.5-4s) |
| **Headers** | Basic/generic | Perfect browser fingerprinting |
| **Failure Handling** | Retry quickly | Exponential backoff + ban detection |
| **Learning** | Static | Adapts from browser sessions |
| **Ban Risk** | HIGH ⚠️ | MINIMAL ✅ |

---

## 🔧 Configuration

### Basic Configuration
```json
{
  "stealth": {
    "humanTiming": {
      "readingTime": { "min": 1500, "max": 4000 },
      "typingSpeed": 80,
      "walletApprovalTime": { "min": 3000, "max": 7000 }
    },
    "banPrevention": {
      "maxConsecutiveFailures": 3,
      "cooldownMultiplier": 2,
      "maxCooldownMs": 60000
    },
    "intelligence": {
      "endpointConfidenceThreshold": 0.5,
      "cookieStrengthThreshold": 0.3,
      "sessionValidityMs": 840000
    }
  }
}
```

### Browser Session Integration
```javascript
// Export cookies from DevTools
const exportCookies = () => {
  return document.cookie.split(';').map(c => {
    const [name, value] = c.trim().split('=');
    return { name, value, domain: location.hostname };
  });
};

// Use in stealth system
await stealth.initialize({ cookies: exportCookies() });
```

---

## 🧪 Testing & Validation

### Run Stealth System Proof
```bash
./cbsh/axiom-stealth-proof.sh
```

**Tests performed:**
- ✅ Stealth reconnaissance system
- ✅ Human behavior simulation  
- ✅ Cookie intelligence system
- ✅ Integrated stealth system
- ✅ Ban prevention mechanisms

### Manual Testing
```javascript
// Test reconnaissance only (no auth required)
const scout = new AxiomStealthScout();
const recon = await scout.performStealthRecon();
console.log('Active endpoints:', recon.activeEndpoints);

// Test human timing
const handshake = new AxiomStealthHandshake({...});
await handshake.simulateHumanReading(); // Should take 1.5-4 seconds
```

---

## 🚨 Best Practices

### DO ✅
- **Feed real browser data** to improve intelligence
- **Monitor cooldown status** before attempting auth
- **Use emergency reset** if multiple ban signals detected
- **Test reconnaissance** before full authentication
- **Respect cooldown periods** - let the system handle timing

### DON'T ❌  
- **Force authentication** during cooldown periods
- **Override human timing** - this defeats the purpose
- **Ignore ban signals** - the system detects them for a reason
- **Use multiple instances** simultaneously - this looks suspicious
- **Skip the learning phase** - browser data makes it much smarter

---

## 🎯 Integration Examples

### With Existing Trading Bot
```javascript
import AxiomStealthSystem from './agents/axiom/AxiomStealthSystem.js';

class MyTradingBot {
  async initialize() {
    this.stealth = new AxiomStealthSystem({
      walletAddress: this.config.wallet.address,
      privKeyBase58: this.config.wallet.privateKey
    });
    
    // Load any saved browser session data
    const sessionData = await this.loadBrowserSession();
    await this.stealth.initialize(sessionData);
  }
  
  async ensureAuthenticated() {
    const status = this.stealth.getStatus();
    
    if (status.inCooldown) {
      this.logger.log('Waiting for cooldown to expire...');
      return null;
    }
    
    try {
      return await this.stealth.authenticateStealthily();
    } catch (err) {
      this.logger.warn('Auth failed, system in cooldown:', err.message);
      return null;
    }
  }
}
```

### With API Client  
```javascript
import AxiomAPI6Client from './agents/axiom/AxiomAPI6Client.js';
import AxiomStealthSystem from './agents/axiom/AxiomStealthSystem.js';

class StealthAPI6Client extends AxiomAPI6Client {
  constructor(config) {
    super(config);
    this.stealth = new AxiomStealthSystem(config);
  }
  
  async ensureAuthenticated() {
    // Use stealth system instead of direct handshake
    const auth = await this.stealth.authenticateStealthily();
    this.session = auth;
    return auth;
  }
}
```

---

## 🔮 Advanced Features

### Session Learning
```javascript
// Save successful session data for future use
stealth.cookieIntel.recordSuccessfulAuth(endpoint, cookies, token);

// Get intelligence summary
const intel = stealth.cookieIntel.getIntelligenceSummary();
console.log('Learned patterns:', intel.authTokenPatterns);
```

### Custom Behavior Patterns
```javascript
// Override human timing for specific scenarios
stealth.scout.intelligence.humanTiming = {
  min: 2000,    // Minimum delay
  max: 6000,    // Maximum delay  
  avg: 3500     // Average from real user data
};
```

### Ban Signal Monitoring
```javascript
// Check for ban warning signs
const status = stealth.getStatus();
if (status.suspiciousActivityCount > 2) {
  console.log('Multiple ban signals detected - extended cooldown recommended');
  stealth.emergencyReset();
}
```

---

## 🎉 Summary

The **Axiom Stealth Authentication System** completely solves the ban problem by:

1. **🕵️ Intelligence-first discovery** - No more brute force endpoint testing
2. **🎭 Perfect human mimicry** - Indistinguishable from real browser behavior  
3. **🍪 Smart session reuse** - Learns from working browser sessions
4. **🛡️ Proactive ban prevention** - Detects and avoids problematic patterns

**Result**: Reliable, ban-free access to Axiom APIs that gets smarter over time.

Ready to deploy with `APPROVE DROP`! 🚀 