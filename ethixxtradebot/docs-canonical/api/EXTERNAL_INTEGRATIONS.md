# 🔌 External API Integrations

**Status**: Active Integrations  
**Last Verified**: August 17, 2025

---

## 🎯 **AXIOM TRADE INTEGRATION**

### **Authentication** ✅ WORKING
- **Method**: Cookie-based JWT tokens (like browser)
- **Manager**: `src/core/AxiomTokenManager.js`
- **Endpoints**: api6-api15.axiom.trade (auto-failover)
- **Refresh**: Every 14 minutes (tokens expire in 15)

**Current Tokens** (Aug 17, 2025):
```env
AXIOM_ACCESS_TOKEN=eyJhbGci... (refreshed 22:00 UTC)
AXIOM_REFRESH_TOKEN=eyJhbGci... (long-lived)
AXIOM_API_PRIMARY=https://api6.axiom.trade
```

### **WebSocket Feeds** ✅ WORKING
- **Cluster7**: `wss://cluster7.axiom.trade/` - New token launches
- **Eucalyptus**: `wss://eucalyptus.axiom.trade/ws` - Whale data
- **Rooms**: `new_pairs`, `surge-updates`, `jito-bribe-fee`

### **REST API Endpoints** ⚠️ PARTIAL
- **Working**: Token refresh, health check
- **500 Errors**: `/token-info`, `/pair-info`, `/top-traders-v3`
- **Status**: Likely server-side issue, fallback data used

---

## 🐦 **BIRDEYE INTEGRATION**

### **API Configuration** ✅ WORKING  
- **Base URL**: `https://public-api.birdeye.so`
- **API Key**: `f31ad137262d4a57bbb85e0b35a75208`
- **Tier**: Premium Plus (1000 requests/min)
- **Chain**: Solana (x-chain header required)

### **WebSocket Tracking** ✅ WORKING
- **URL**: `wss://public-api.birdeye.so/socket/solana`
- **Concurrent**: Up to 500 tokens tracked simultaneously
- **Manager**: `src/services/BirdeyeWebSocketManager.js`
- **Features**: Real-time price, transactions, new pairs

### **Rate Limiting**
- **Target**: 1000 requests/minute (Premium Plus)
- **Current**: Sometimes hitting "Too many requests"
- **Mitigation**: 5-minute caching, request queuing
- **Status**: Non-critical, cached data used

### **Key Endpoints**
```javascript
// Security Analysis (Priority #1)
GET /defi/token_security?address={token}

// Market Overview  
GET /defi/token_overview?address={token}

// Trading Activity
GET /defi/txs/token?address={token}
```

---

## 🐋 **WHALE TRACKING**

### **Data Sources** ✅ WORKING
- **Whale Count**: 29 tracked wallets
- **Feed**: Eucalyptus WebSocket
- **Intelligence**: Pattern recognition for whale behavior
- **Manager**: `src/services/WhaleDataService.js` (primary)

### **Tracked Wallet Types**
- **High Priority**: `live-whale-1` through `live-whale-5`
- **Active**: `active-whale-1` through `active-whale-6`  
- **Auto-discovered**: Dynamic whale detection
- **Screenshot**: Manual additions from analysis

### **Whale Intelligence**
- **Service**: `src/services/WhaleIntelligence.js`
- **Scoring**: 15% weight in overall analysis
- **Confidence**: 60% minimum threshold
- **Features**: Copy trading signals, position sizing hints

---

## 🔥 **PUMP.FUN INTEGRATION** ⚠️ ISSUES

### **Current Status**
- **Client**: `src/clients/PumpClient.js` (placeholder)
- **Issue**: `getaddrinfo ENOTFOUND pumpfun-api.com`
- **Impact**: No pump.fun launch detection
- **Priority**: Low (Cluster7 provides similar data)

---

## 📊 **DEX INTEGRATIONS**

### **Jupiter** 🔧 PLACEHOLDER
- **Client**: `src/clients/JupiterClient.js`
- **Status**: Placeholder implementation
- **Purpose**: DEX aggregation for future live trading

### **Raydium** 🔧 PLACEHOLDER  
- **Client**: `src/clients/RaydiumClient.js`
- **Status**: Placeholder implementation
- **Purpose**: AMM pool data and execution

---

## 🔧 **INTEGRATION HEALTH MONITORING**

### **Connection Status Check**
```bash
# Check all WebSocket connections
grep -E "(Connected|✅.*cluster7|✅.*eucalyptus)" startup.log

# Verify API authentication
node -e "import('./src/core/AxiomTokenManager.js').then(({axiomTokenManager}) => axiomTokenManager.testTokens())"

# Monitor live data flow
tail -f startup.log | grep -E "(OPPORTUNITY|cluster7|BIRDEYE)"
```

### **Rate Limit Monitoring**
```bash
# Birdeye usage
grep -E "(Rate limit|Too many)" startup.log | tail -5

# Axiom usage  
grep -E "([0-9]+/[0-9]+ requests)" startup.log | tail -5
```

---

## 🚨 **KNOWN ISSUES**

### **Authentication Drift**
- **Problem**: Tokens expire every 15 minutes
- **Solution**: Auto-refresh via AxiomTokenManager
- **Monitor**: Watch for 401/500 errors

### **Rate Limit Confusion**
- **Problem**: Multiple rate limiters for same API
- **Impact**: Conservative limits vs actual capacity
- **Status**: Working but inefficient

### **Endpoint Instability**
- **Problem**: Some Axiom endpoints intermittently return 500
- **Workaround**: Multiple endpoint failover
- **Monitor**: Success rate per endpoint

---

## 📈 **PERFORMANCE BENCHMARKS**

### **Current Performance** (Aug 17, 2025)
- **Token Analysis**: 180-280ms average
- **WebSocket Latency**: <50ms to Cluster7
- **Paper Trading**: Real-time execution
- **Dashboard Updates**: <100ms via Socket.IO

### **Target Performance**
- **Analysis**: <200ms (mostly achieved)
- **Detection**: <2s from launch to analysis
- **Dashboard**: <500ms update latency
- **Uptime**: >99% (auto-reconnection)

---

**🔗 Related**: [System Overview](../architecture/SYSTEM_OVERVIEW.md) | [Troubleshooting](../troubleshooting/COMMON_ISSUES.md) 