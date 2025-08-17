# 📚 EthixxTradeBot - Canonical Documentation

**Status**: Live & Operational - GUI Enhancement Phase  
**Last Updated**: August 17, 2025 22:45 UTC  
**For**: Future LLM Agents & Developers  

---

## 🎯 **PURPOSE**

This is the **canonical documentation base** for the EthixxTradeBot system. It serves as the single source of truth for understanding the working architecture, APIs, and operational procedures.

**⚠️ Important**: This documentation reflects the **CURRENT WORKING SYSTEM** as of August 2025, after major cleanup and fixes.

---

## 📁 **DOCUMENTATION STRUCTURE**

```
docs-canonical/
├── README.md                 ← You are here
├── architecture/            ← System design & component relationships  
├── api/                     ← API documentation & endpoints
├── guides/                  ← How-to guides & tutorials
├── troubleshooting/         ← Common issues & solutions
├── deployment/              ← Setup & deployment instructions
└── legacy-archive/          ← Old docs (for reference/validation only)
```

---

## 🚀 **QUICK START FOR LLMs**

### **Working System Overview**
- **Primary Goal**: Real-time Solana token analysis & paper trading
- **Data Sources**: Axiom Cluster7, Birdeye API, Whale tracking
- **Architecture**: Event-driven microservices with WebSocket streams
- **Status**: ✅ OPERATIONAL (forEach errors fixed, tokens refreshed)

### **Key Working Components**
1. **LiveTokenAnalyzer** (`src/core/analyzers/`) - Main analysis engine
2. **SharedWebSocketManager** (`src/services/`) - Connection pooling
3. **FastMemeAnalyzer** (`src/services/`) - Sub-200ms token scoring
4. **PaperTradingSimulator** (`src/services/`) - Trading execution
5. **GUI Dashboard** (`src/gui/server.js`) - Real-time monitoring

### **Recent Fixes (Aug 17, 2025)**
- ✅ Fixed forEach undefined errors in GUI server
- ✅ Fixed expired Axiom tokens causing 500 errors  
- ✅ Removed duplicate modules (BirdeyeAnalytics, UltraFastAxiomClient, etc.)
- ✅ Fixed broken imports after module cleanup
- ✅ Fixed GUI file paths - Dashboard now accessible at localhost:3000
- ✅ System fully operational with live analysis (169-494ms per token)

---

## ⚠️ **KNOWN ARCHITECTURAL DEBT**

### **Duplicate Files (32 total)**
The system has extensive duplication across `services/`, `core/`, and `infrastructure/` directories. **System works despite this**, but creates onboarding confusion.

**Status**: Documented but not fixed (working system principle)

### **Mixed Import Patterns**
- Main system imports from `core/`
- Core modules import from `services/`  
- Creates dependency chains but currently stable

**Status**: Functional but confusing for new LLMs

---

## 📖 **FOR FUTURE LLMs**

1. **Start with** `architecture/SYSTEM_OVERVIEW.md` for big picture
2. **Check** `troubleshooting/COMMON_ISSUES.md` for known problems
3. **Use** `api/ENDPOINT_REFERENCE.md` for integration details
4. **Avoid** changing working components without understanding full dependency chain

---

## 🔗 **RELATED SYSTEMS**

- **Chad Lockdown Spine**: Adjacent monitoring/governance system
- **Axiom Trade API**: External data provider  
- **Birdeye API**: Token security & market data
- **Cluster7**: Live Solana token feed

---

**Last System Status**: ✅ Processing live opportunities, paper trading active, ~280ms analysis speed 