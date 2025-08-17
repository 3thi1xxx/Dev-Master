# 🏗️ System Architecture Overview

**Status**: ✅ OPERATIONAL  
**Last Updated**: August 17, 2025  
**Version**: 2.1 (Post-Cleanup)

---

## 🎯 **SYSTEM PURPOSE**

EthixxTradeBot is an AI-powered autonomous trading system that:
1. **Monitors** real-time Solana token launches via Axiom Cluster7
2. **Analyzes** tokens with multi-source intelligence (sub-200ms speed)
3. **Executes** paper trades with smart position sizing
4. **Displays** everything in a real-time dashboard
5. **Learns** from patterns to improve decision making

---

## 🏛️ **CORE ARCHITECTURE**

### **Event-Driven Pipeline**
```
Cluster7 Feed → LiveTokenAnalyzer → FastMemeAnalyzer → PaperTradingSimulator → Dashboard
      ↓              ↓                    ↓                    ↓              ↓
  WebSocket     AI Analysis         Scoring Logic        Trade Execution   Real-time UI
```

### **Key Design Principles**
- **Event-driven**: Everything uses EventEmitter pattern
- **Non-blocking**: Async/await throughout
- **Resilient**: Auto-reconnection and error recovery
- **Fast**: Sub-200ms token analysis target
- **Scalable**: Connection pooling and rate limiting

---

## 🔧 **WORKING COMPONENTS**

### **1. Data Ingestion Layer**
- **SharedWebSocketManager** (`src/services/`) - Connection pooling
- **AxiomTokenManager** (`src/core/`) - Authentication & token refresh
- **WhaleDataService** (`src/services/`) - Whale wallet tracking

### **2. Analysis Layer** 
- **LiveTokenAnalyzer** (`src/core/analyzers/`) - Main orchestration
- **FastMemeAnalyzer** (`src/services/`) - Ultra-fast scoring
- **BirdeyeAnalytics** (`src/services/`) - Security analysis
- **AxiomAPIService** (`src/core/data/`) - Axiom API integration

### **3. Trading Layer**
- **PaperTradingSimulator** (`src/services/`) - Execution engine
- **MasterController** (`src/core/system/`) - Orchestration
- **RiskManager** (`src/core/`) - Position sizing & safety

### **4. Interface Layer**
- **GUI Server** (`src/gui/server.js`) - Dashboard & API
- **Socket.IO** - Real-time updates to frontend

---

## 🌊 **DATA FLOW**

### **Live Token Detection**
1. **Cluster7** sends `new_pairs` message via WebSocket
2. **SharedWebSocketManager** pools connections & distributes messages
3. **LiveTokenAnalyzer** receives token data via event system
4. **FastMemeAnalyzer** performs sub-200ms analysis
5. **PaperTradingSimulator** executes trading decisions
6. **GUI Server** broadcasts results to dashboard

### **Analysis Pipeline**
```
Token Data → Quick Filter → Multi-source Analysis → Scoring → Recommendation
     ↓            ↓              ↓                  ↓           ↓
  Liquidity   Momentum    Birdeye+Axiom+Whale   0-100 Score  BUY/SELL/HOLD
   Check      Indicators      Intelligence      Algorithm    + Confidence
```

---

## 🔌 **EXTERNAL INTEGRATIONS**

### **✅ Working Integrations**
- **Axiom Cluster7**: `wss://cluster7.axiom.trade/` - Live token feed
- **Birdeye API**: Token security & market data (500 concurrent WS)
- **Whale Tracking**: 29 high-value wallets monitored
- **Paper Trading**: $1000 simulated portfolio

### **⚠️ Partially Working**
- **Axiom API**: Some endpoints return 500 errors (server-side issue)
- **Pump.fun**: DNS resolution issues with some endpoints

---

## 📊 **CURRENT PERFORMANCE**

- **Analysis Speed**: ~180-280ms per token
- **Connection Uptime**: >95% (auto-reconnection)
- **Opportunities Detected**: Live stream active
- **Paper Trading**: $30 positions, 45% confidence threshold
- **Dashboard**: Socket.IO real-time updates

---

## ⚠️ **ARCHITECTURAL DEBT**

### **Duplicate Modules (32 files)**
Many components exist in multiple directories:
- `services/` vs `core/` vs `infrastructure/`
- **Impact**: Confusing for new developers/LLMs
- **Status**: Working system, cleanup deferred

### **Mixed Import Patterns**
- Main system uses `core/analyzers/LiveTokenAnalyzer` 
- But core imports from `services/` components
- **Impact**: Circular dependency risk
- **Status**: Stable but needs documentation

---

## 🎯 **NEXT STEPS FOR LLMs**

1. **Read** `architecture/COMPONENT_REFERENCE.md` for detailed component docs
2. **Check** `api/AXIOM_INTEGRATION.md` for API details
3. **Review** `troubleshooting/` for known issues before making changes
4. **Test** changes in isolated environment before touching production pipeline

---

**🔗 Quick Links**: [Component Reference](architecture/COMPONENT_REFERENCE.md) | [API Docs](api/) | [Troubleshooting](troubleshooting/) 