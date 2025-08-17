# 🚀 Axiom WebSocket Complete Implementation Plan

**Created**: August 17, 2025, 14:00 UTC
**Updated**: August 17, 2025, 14:15 UTC  
**Purpose**: Integrate all discovered WebSocket features into the existing EthixxTradeBot system
**Status**: Ready for Implementation - Aligned with Current Architecture

---

## 📋 **Executive Summary**

This plan integrates the newly discovered WebSocket data streams with our existing verified system:
- **Cluster7** (`wss://cluster7.axiom.trade/`) - Market data, new pairs, analytics
- **Eucalyptus** (`wss://eucalyptus.axiom.trade/ws`) - Tracked wallet transactions, whale movements

Both WebSockets will feed into our existing GUI through the `WebSocketDataBridge` and display real-time data on our unified dashboard at `http://localhost:3000`.

---

## ⚠️ **CRITICAL ARCHITECTURE NOTES**

Based on the canonical documentation review:

1. **Component Locations** (from COMPONENT_REFERENCE.md):
   - SharedWebSocketManager → `src/services/SharedWebSocketManager.js` ✅
   - AxiomTokenManager → `src/core/AxiomTokenManager.js` ✅
   - LiveTokenAnalyzer → `src/core/analyzers/LiveTokenAnalyzer.js` (active)
   - FastMemeAnalyzer → `src/services/FastMemeAnalyzer.js` (active)
   - WebSocketDataBridge → `src/gui/websocket-data-bridge.js` ✅

2. **Import Pattern** (from SYSTEM_OVERVIEW.md):
   - Core components import FROM services (unusual but working)
   - Don't change this pattern without full system test

3. **Active Dashboard** (from GUI_ENHANCEMENT_MASTER_PLAN.md):
   - Main: `src/gui/fast-meme-dashboard.html` (serves at port 3000)
   - GUI Server: `src/gui/server.js`

4. **Duplicate Warnings** (from LLM_ONBOARDING.md):
   - 32 duplicate files exist - always verify which version is active
   - Use `grep -r` to find all imports before making changes

---

## 🏗️ **Architecture Overview (Updated)**

```
┌─────────────────────────────────────────────────────────────┐
│         SharedWebSocketManager (src/services/)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────────┐      │
│  │   Cluster7 WS    │        │   Eucalyptus WS      │      │
│  │  (existing)      │        │  (existing)           │      │
│  │ - new_pairs      │        │ - Wallet txs (f:,t:) │      │
│  │ - lighthouse(NEW)│        │ - Analytics (a:)(NEW) │      │
│  │ - sol_price(NEW) │        │ - Balance (b-)(NEW)   │      │
│  │ - priority_fee   │        │ - Twitter feed        │      │
│  └──────────────────┘        └──────────────────────┘      │
│           │                            │                     │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
    ┌──────────────────────────────────────────┐
    │    EnhancedDataProcessor (NEW)            │
    │    Location: src/services/                │
    │  - Token Address Extraction (a: rooms)   │
    │  - Transaction Classification (2=buy,4=sell)│
    │  - Market Stats Aggregation              │
    │  - Whale Detection & Tracking            │
    └──────────────────────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │   WebSocketDataBridge (EXISTING)          │
    │   Location: src/gui/websocket-data-bridge.js│
    │  - Add new event listeners               │
    │  - Integrate EnhancedDataProcessor        │
    │  - Emit to existing Socket.IO             │
    └──────────────────────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │   fast-meme-dashboard.html (EXISTING)     │
    │   Location: src/gui/                      │
    │  - Add new data display sections         │
    │  - Integrate market stats                │
    │  - Show token addresses                  │
    └──────────────────────────────────────────┘
```

---

## 📝 **Implementation Steps (Aligned with Architecture)**

### **Phase 1: Enhanced Data Processor** 

**File**: `src/services/EnhancedDataProcessor.js` (NEW)
**Location Rationale**: Services directory for business logic (per architecture docs)

```javascript
import { EventEmitter } from 'node:events';
import { sharedWebSocketManager } from './SharedWebSocketManager.js';
import { axiomTokenManager } from '../core/AxiomTokenManager.js'; // Core->Services pattern

export class EnhancedDataProcessor extends EventEmitter {
  constructor() {
    super();
    
    // Token mapping: address -> enriched data
    this.tokenMap = new Map();
    
    // Pair mapping: pair -> token address
    this.pairToTokenMap = new Map();
    
    // Market statistics
    this.marketStats = {
      lighthouse: null,
      solPrice: 0,
      priorityFee: 0,
      lastUpdate: Date.now()
    };
    
    // Transaction types (CORRECTED from discoveries)
    this.TX_TYPES = {
      BUY: 2,  // Not 0 as previously thought
      SELL: 4  // Not 1 as previously thought
    };
    
    this.logger = console; // Match existing pattern
  }
  
  initialize() {
    console.log('[ENHANCED] 🚀 Initializing Enhanced Data Processor...');
    this.setupCluster7Handlers();
    this.setupEucalyptusHandlers();
  }
  
  setupCluster7Handlers() {
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (!url.includes('cluster7')) return;
      
      // Handle different room types
      if (data.room === 'lighthouse') {
        this.processLighthouseStats(data.content);
      } else if (data.room === 'sol_price') {
        this.marketStats.solPrice = data.content;
        this.emit('sol-price-update', data.content);
      } else if (data.room === 'sol-priority-fee') {
        this.marketStats.priorityFee = data.content;
        this.emit('priority-fee-update', data.content);
      }
    });
  }
  
  setupEucalyptusHandlers() {
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (!url.includes('eucalyptus')) return;
      
      // Process transaction arrays (28 fields discovered)
      if (Array.isArray(data) && data.length === 28) {
        this.processTransactionArray(data);
      }
      
      // Handle room-based messages
      if (data.room) {
        this.processRoomMessage(data);
      }
    });
  }
  
  processTransactionArray(tx) {
    const [
      timestamp, signature, hash, type,
      wallet, tokenAddress, orderId,
      solAmount, tokenAmount, balance,
      mcapSol, mcapUsd, price, direction,
      poolCreated, liquidity, unknown,
      priceChange, name, symbol, image,
      decimals, supply, protocol, flag,
      liquidityAfter, metric1, metric2
    ] = tx;
    
    // Extract token data
    const tokenData = {
      address: tokenAddress,
      name: name !== '____________' ? name : null,
      symbol: symbol !== '__________' ? symbol : null,
      price: price,
      priceUsd: price * this.marketStats.solPrice,
      marketCapSol: mcapSol,
      marketCapUsd: mcapUsd,
      liquidity: liquidity,
      liquidityAfter: liquidityAfter,
      priceChange: priceChange,
      supply: supply,
      decimals: decimals,
      protocol: protocol,
      image: image,
      lastUpdate: timestamp
    };
    
    // Store token data
    this.tokenMap.set(tokenAddress, tokenData);
    
    // Emit transaction event
    this.emit('transaction', {
      type: type === this.TX_TYPES.BUY ? 'buy' : 'sell',
      wallet: wallet,
      token: tokenData,
      solAmount: solAmount,
      tokenAmount: tokenAmount,
      timestamp: timestamp,
      signature: signature
    });
    
    // Log for debugging
    console.log(`[ENHANCED] ${type === this.TX_TYPES.BUY ? '🟢 BUY' : '🔴 SELL'}: ${tokenData.symbol || tokenAddress.slice(0,8)} @ ${price} SOL`);
    
    // Check for opportunities
    this.checkForOpportunity(tokenData, type);
  }
  
  processRoomMessage(data) {
    const room = data.room;
    
    // Analytics room - CRITICAL: Contains token address!
    if (room.startsWith('a:')) {
      const tokenAddress = room.split(':')[1];
      const [pairAddress, ...metrics] = data.content;
      
      // Map pair to token - THIS SOLVES THE ADDRESS PROBLEM!
      this.pairToTokenMap.set(pairAddress, tokenAddress);
      
      console.log(`[ENHANCED] 🎯 TOKEN DISCOVERED: ${tokenAddress} -> ${pairAddress}`);
      
      // Emit token discovery
      this.emit('token-discovered', {
        tokenAddress: tokenAddress,
        pairAddress: pairAddress,
        metrics: metrics
      });
    }
    
    // Transaction feed rooms
    else if (room.startsWith('f:') || room.startsWith('t:')) {
      const pairAddress = room.split(':')[1];
      // Process transaction feed
      this.processTransactionFeed(pairAddress, data.content);
    }
    
    // Balance tracking
    else if (room.startsWith('b-')) {
      const wallet = room.substring(2);
      this.emit('wallet-balance', {
        wallet: wallet,
        balance: data.content
      });
    }
  }
  
  processTransactionFeed(pairAddress, content) {
    // Get token address from mapping
    const tokenAddress = this.pairToTokenMap.get(pairAddress);
    if (tokenAddress) {
      console.log(`[ENHANCED] Transaction for ${tokenAddress} via ${pairAddress}`);
    }
  }
  
  checkForOpportunity(tokenData, transactionType) {
    // Hot opportunity detection (matching existing FastMemeAnalyzer logic)
    const isHot = 
      tokenData.liquidity > 50 && // Good liquidity
      tokenData.priceChange > 10 && // Rising price
      transactionType === this.TX_TYPES.BUY; // Buy pressure
    
    if (isHot) {
      this.emit('hot-opportunity', tokenData);
      console.log(`[ENHANCED] 🔥 HOT OPPORTUNITY: ${tokenData.symbol || tokenData.address}`);
    }
  }
  
  processLighthouseStats(stats) {
    this.marketStats.lighthouse = stats;
    
    // Find hottest protocol
    const protocols = Object.keys(stats['1h']).filter(k => k !== 'All');
    const hottest = protocols.reduce((best, protocol) => {
      const volumePct = stats['1h'][protocol].totalVolumePct || 0;
      return volumePct > (best.volumePct || 0) ? 
        { protocol, volumePct } : best;
    }, {});
    
    this.emit('market-stats', {
      overall: stats['1h'].All,
      hottestProtocol: hottest,
      timestamp: Date.now()
    });
    
    console.log(`[ENHANCED] 📊 Market Update - Hot Protocol: ${hottest.protocol} (+${hottest.volumePct}%)`);
  }
}

// Export singleton instance (matching existing pattern)
export const enhancedDataProcessor = new EnhancedDataProcessor();
```

---

### **Phase 2: Update WebSocketDataBridge**

**File**: `src/gui/websocket-data-bridge.js` (MODIFY EXISTING)

```javascript
// Add to existing imports (line ~10)
import { enhancedDataProcessor } from '../services/EnhancedDataProcessor.js';

// In constructor, add enhanced processor (line ~25)
constructor() {
  super();
  
  // ... existing code ...
  
  // Add enhanced processor
  this.enhancedProcessor = enhancedDataProcessor;
  
  // Enhanced stats
  this.stats = {
    ...this.stats, // Keep existing stats
    solPrice: 0,
    priorityFee: 0,
    marketStats: null,
    tokenAddressesDiscovered: new Set()
  };
}

// In initialize method (line ~35)
async initialize(io) {
  this.io = io;
  
  // ... existing initialization ...
  
  // Initialize enhanced processor
  this.enhancedProcessor.initialize();
  this.setupEnhancedListeners();
  
  console.log('✅ WebSocket Data Bridge initialized with enhancements');
}

// Add new method for enhanced listeners
setupEnhancedListeners() {
  // Token discovery with address - THE KEY FEATURE!
  this.enhancedProcessor.on('token-discovered', (data) => {
    console.log(`🎯 TOKEN ADDRESS EXTRACTED: ${data.tokenAddress}`);
    
    this.stats.tokenAddressesDiscovered.add(data.tokenAddress);
    
    // Now we can enrich with external APIs!
    this.enrichTokenData(data.tokenAddress, data.pairAddress);
    
    // Emit to GUI
    this.io.emit('token-discovered', data);
  });
  
  // Transaction feed
  this.enhancedProcessor.on('transaction', (tx) => {
    // Update stats
    if (tx.type === 'buy') {
      this.stats.buyTransactions = (this.stats.buyTransactions || 0) + 1;
    } else {
      this.stats.sellTransactions = (this.stats.sellTransactions || 0) + 1;
    }
    
    // Emit to GUI with full context
    this.io.emit('live-transaction', {
      ...tx,
      solPrice: this.stats.solPrice,
      usdValue: tx.solAmount * this.stats.solPrice
    });
  });
  
  // Hot opportunities
  this.enhancedProcessor.on('hot-opportunity', (token) => {
    this.stats.opportunitiesDetected++;
    
    // Emit to GUI with urgency
    this.io.emit('hot-opportunity', {
      token: token,
      urgency: 'high',
      timestamp: Date.now()
    });
  });
  
  // Market stats
  this.enhancedProcessor.on('market-stats', (stats) => {
    this.stats.marketStats = stats;
    this.io.emit('market-update', stats);
  });
  
  // SOL price updates
  this.enhancedProcessor.on('sol-price-update', (price) => {
    this.stats.solPrice = price;
    this.io.emit('sol-price', price);
  });
  
  // Priority fee updates
  this.enhancedProcessor.on('priority-fee-update', (fee) => {
    this.stats.priorityFee = fee;
    this.io.emit('priority-fee', fee);
  });
  
  // Whale balance updates
  this.enhancedProcessor.on('wallet-balance', (data) => {
    if (data.balance > 100) { // 100+ SOL = whale
      this.stats.whalesTracking.add(data.wallet);
      this.io.emit('whale-update', data);
    }
  });
}

// Add enrichment method (if not exists)
async enrichTokenData(tokenAddress, pairAddress) {
  try {
    // Use existing services
    const birdeyeData = await this.queryBirdeyeAPI(tokenAddress);
    const axiomData = await this.queryAxiomAPI(pairAddress);
    
    const enriched = {
      ...axiomData,
      ...birdeyeData,
      tokenAddress,
      pairAddress,
      enrichedAt: Date.now()
    };
    
    this.io.emit('token-enriched', enriched);
    
  } catch (error) {
    console.error('[BRIDGE] Failed to enrich token:', error.message);
  }
}
```

---

### **Phase 3: GUI Dashboard Updates**

**File**: `src/gui/fast-meme-dashboard.html` (MODIFY EXISTING)

Add to the existing dashboard (around line 500-600 in script section):

```javascript
// Add new socket listeners for enhanced data
socket.on('token-discovered', (data) => {
  // Add to discovered tokens list
  const tokenElement = document.createElement('div');
  tokenElement.className = 'token-discovered';
  tokenElement.innerHTML = `
    <span class="token-address">${data.tokenAddress}</span>
    <span class="pair-address">${data.pairAddress}</span>
    <a href="https://birdeye.so/token/${data.tokenAddress}" target="_blank">Birdeye</a>
    <a href="https://dexscreener.com/solana/${data.tokenAddress}" target="_blank">DexScreener</a>
  `;
  document.getElementById('discovered-tokens').appendChild(tokenElement);
});

socket.on('live-transaction', (tx) => {
  // Update transaction feed
  const txElement = document.createElement('div');
  txElement.className = tx.type === 'buy' ? 'tx-buy' : 'tx-sell';
  txElement.innerHTML = `
    <span class="tx-type">${tx.type.toUpperCase()}</span>
    <span class="tx-token">${tx.token.symbol || tx.token.address.slice(0, 8)}</span>
    <span class="tx-price">$${tx.token.priceUsd.toFixed(6)}</span>
    <span class="tx-value">$${tx.usdValue.toFixed(2)}</span>
    <span class="tx-time">${new Date(tx.timestamp).toLocaleTimeString()}</span>
  `;
  
  const feed = document.getElementById('transaction-feed');
  feed.insertBefore(txElement, feed.firstChild);
  
  // Keep only last 50 transactions
  while (feed.children.length > 50) {
    feed.removeChild(feed.lastChild);
  }
});

socket.on('market-update', (stats) => {
  // Update market stats display
  document.getElementById('market-volume').textContent = `$${(stats.overall.totalVolume / 1000000).toFixed(2)}M`;
  document.getElementById('market-change').textContent = `${stats.overall.totalVolumePct > 0 ? '+' : ''}${stats.overall.totalVolumePct.toFixed(2)}%`;
  document.getElementById('hot-protocol').textContent = stats.hottestProtocol.protocol;
});

socket.on('sol-price', (price) => {
  document.getElementById('sol-price').textContent = `$${price.toFixed(2)}`;
});

socket.on('priority-fee', (fee) => {
  document.getElementById('priority-fee').textContent = `${fee} SOL`;
});
```

Add new HTML sections (around line 200-300):

```html
<!-- Add to existing dashboard structure -->
<div class="enhanced-data-section">
  <h3>🔍 Token Discovery</h3>
  <div id="discovered-tokens" class="token-list"></div>
</div>

<div class="market-stats-section">
  <h3>📊 Market Statistics</h3>
  <div class="stats-grid">
    <div>Volume 24h: <span id="market-volume">-</span></div>
    <div>Change: <span id="market-change">-</span></div>
    <div>Hot Protocol: <span id="hot-protocol">-</span></div>
    <div>SOL Price: <span id="sol-price">-</span></div>
    <div>Priority Fee: <span id="priority-fee">-</span></div>
  </div>
</div>

<div class="transaction-feed-section">
  <h3>💱 Live Transactions</h3>
  <div id="transaction-feed" class="tx-feed"></div>
</div>
```

---

### **Phase 4: Connection Management**

**File**: `src/services/AxiomConnectionManager.js` (NEW)

```javascript
import { sharedWebSocketManager } from './SharedWebSocketManager.js';
import { axiomTokenManager } from '../core/AxiomTokenManager.js';

export class AxiomConnectionManager {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
    this.pingIntervals = new Map();
    this.logger = console;
  }
  
  async initialize() {
    console.log('[AXIOM-CONN] 🔌 Initializing enhanced WebSocket connections...');
    
    // Connect to Cluster7 (existing connection, new subscriptions)
    await this.enhanceCluster7();
    
    // Enhance Eucalyptus subscriptions
    await this.enhanceEucalyptus();
    
    console.log('[AXIOM-CONN] ✅ Enhanced connections established');
  }
  
  async enhanceCluster7() {
    // Get existing connection
    const connection = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
    
    this.connections.set('cluster7', connection);
    
    // Subscribe to NEW rooms discovered
    const newRooms = [
      'lighthouse',      // Market statistics
      'sol_price',       // SOL/USD price
      'sol-priority-fee' // Network fees
    ];
    
    for (const room of newRooms) {
      connection.send(JSON.stringify({
        action: 'join',
        room: room
      }));
      console.log(`[AXIOM-CONN] Subscribed to ${room}`);
    }
  }
  
  async enhanceEucalyptus() {
    // Get auth tokens
    const tokens = await axiomTokenManager.getTokens();
    
    // Get existing or create connection
    const connection = await sharedWebSocketManager.getSharedConnection(
      'wss://eucalyptus.axiom.trade/ws',
      {
        headers: {
          'Cookie': `auth-access-token=${tokens.accessToken}; auth-refresh-token=${tokens.refreshToken}`,
          'Origin': 'https://axiom.trade',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );
    
    this.connections.set('eucalyptus', connection);
    
    // Ensure ping interval
    if (!this.pingIntervals.has('eucalyptus')) {
      this.startPing('eucalyptus', connection);
    }
  }
  
  startPing(name, connection) {
    const interval = setInterval(() => {
      connection.send(JSON.stringify({ method: 'ping' }));
    }, 30000);
    
    this.pingIntervals.set(name, interval);
    console.log(`[AXIOM-CONN] Started ping for ${name}`);
  }
  
  // Dynamic subscription methods for specific tokens
  subscribeToToken(tokenAddress, pairAddress) {
    const eucalyptus = this.connections.get('eucalyptus');
    if (!eucalyptus) return;
    
    // Analytics room (contains token address!)
    eucalyptus.send(JSON.stringify({
      action: 'join',
      room: `a:${tokenAddress}`
    }));
    
    // Transaction feeds
    eucalyptus.send(JSON.stringify({
      action: 'join',
      room: `f:${pairAddress}`
    }));
    
    console.log(`[AXIOM-CONN] 📡 Subscribed to token ${tokenAddress.slice(0,8)}...`);
  }
}

// Export singleton
export const axiomConnectionManager = new AxiomConnectionManager();
```

---

## 🚀 **Integration with Existing System**

### **Modify start.js or MasterController initialization**

```javascript
// Add to existing initialization sequence
import { axiomConnectionManager } from './src/services/AxiomConnectionManager.js';
import { enhancedDataProcessor } from './src/services/EnhancedDataProcessor.js';

// In startup sequence (after token manager init)
await axiomTokenManager.initialize();
await axiomConnectionManager.initialize();
enhancedDataProcessor.initialize();
```

---

## ✅ **Testing Plan (Aligned with QUICK_START.md)**

### **1. System Health Check**
```bash
# Start system with enhancements
node start.js > enhanced.log 2>&1 &

# Check for new components
grep -E "(ENHANCED|AXIOM-CONN)" enhanced.log | tail -10

# Verify token discovery
grep -E "TOKEN DISCOVERED|TOKEN ADDRESS EXTRACTED" enhanced.log | tail -5

# Check market stats
grep -E "Market Update|Hot Protocol" enhanced.log | tail -3
```

### **2. WebSocket Verification**
```bash
# Check new room subscriptions
grep -E "Subscribed to (lighthouse|sol_price|priority-fee)" enhanced.log

# Verify transaction processing
grep -E "(BUY|SELL):.*SOL" enhanced.log | tail -5
```

### **3. Dashboard Testing**
```bash
# Verify dashboard enhancements
curl -s http://localhost:3000 | grep -E "(discovered-tokens|market-stats|transaction-feed)" && echo "✅ Enhanced GUI" || echo "❌ GUI not updated"
```

---

## 🎯 **Success Metrics**

- ✅ Token addresses automatically extracted from `a:` rooms
- ✅ Transaction types correctly identified (2=buy, 4=sell)
- ✅ Market statistics updating from lighthouse room
- ✅ SOL price and priority fees displayed
- ✅ Live transactions shown with USD values
- ✅ No disruption to existing analysis pipeline
- ✅ < 100ms latency from WebSocket to GUI

---

## 🚨 **Important Notes (Per Architecture Docs)**

1. **Component Placement**: 
   - New services in `src/services/` (business logic)
   - GUI modifications to existing `fast-meme-dashboard.html`
   - No changes to core import patterns

2. **Duplicate Awareness**:
   - EnhancedDataProcessor is NEW (no duplicates)
   - AxiomConnectionManager is NEW (no duplicates)
   - WebSocketDataBridge modifications to EXISTING file

3. **Testing Protocol**:
   - Follow QUICK_START.md testing patterns
   - Use timeout commands for safety
   - Monitor logs for errors

4. **Documentation Updates Required**:
   - Update COMPONENT_REFERENCE.md with new components
   - Add to SYSTEM_OVERVIEW.md data flow section
   - Document in EXTERNAL_INTEGRATIONS.md

---

## 📝 **Next Steps**

1. Implement `EnhancedDataProcessor.js` in `src/services/`
2. Modify `WebSocketDataBridge` carefully (backup first)
3. Create `AxiomConnectionManager.js` in `src/services/`
4. Update `fast-meme-dashboard.html` with new sections
5. Test with live data using commands from testing plan
6. Update canonical documentation

**This implementation provides complete real-time visibility while respecting the existing architecture and avoiding disruption to the working system!** 🚀

---

**Last Updated**: August 17, 2025, 14:15 UTC
**Validated Against**: All canonical documentation files
**Architecture Alignment**: ✅ Confirmed 