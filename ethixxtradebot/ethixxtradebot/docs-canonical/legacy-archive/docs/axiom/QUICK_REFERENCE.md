# ⚡ QUICK REFERENCE - AI TRADING SYSTEM

**For Immediate Use**  
**Critical Issues First**  

---

## 🚨 **EMERGENCY COMMANDS**

### **Kill & Restart System**
```bash
pkill -f "node gui/server.js"
sleep 3
BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js
```

### **Test System Health**
```bash
node test_data_flow_fixes.js
node emergency_fix.js
node quick_status_check.js
```

### **Monitor Performance**
```bash
./monitor_premium_plus_performance.sh
node monitor_live_data_flow.js
```

---

## 🔧 **CRITICAL FIXES NEEDED**

### **1. Birdeye API Key (File: src/services/BirdeyeAnalytics.js)**
```javascript
// CHANGE THIS:
maxRequests: this.config.apiKey ? 50 : 20

// TO THIS:
maxRequests: this.config.apiKey ? 1000 : 20
```

### **2. Degen Data (File: src/services/EnhancedExternalAnalysis.js)**
```javascript
// ADD degenData to destructuring:
const [
  dexScreenerData,
  birdeyeData,
  priceHistoryData,
  cabalspyData,
  bubblemapsData,
  geckoTerminalData,
  degenData  // ← ADD THIS
] = await Promise.allSettled([
  // ... existing promises
  degenIntelligence.analyzeToken(tokenAddress)  // ← ADD THIS
]);
```

---

## 📊 **CURRENT STATUS**

- **Analysis Success Rate**: 0% (CRITICAL)
- **API Rate Limits**: Multiple errors (CRITICAL)
- **Paper Trading Balance**: $421.875
- **Whale Tracking**: 29 wallets loaded
- **Dashboard**: http://localhost:3000

---

## 🎯 **SUCCESS INDICATORS**

### **✅ Good Logs**
```
[LIVE] ✅ Analysis complete: TOKEN → RECOMMENDATION
[ENHANCED] ✅ Comprehensive analysis complete: TOKEN
[BIRDEYE] ✅ Analysis complete - Security score: XX/100
```

### **❌ Bad Logs**
```
[ENHANCED] ❌ Comprehensive analysis failed: degenData is not defined
[BIRDEYE] ⚠️ Rate limit warning: XX/50 requests
```

---

## 📁 **KEY FILES**

- `src/services/EnhancedExternalAnalysis.js` - Main analysis (BROKEN)
- `src/services/BirdeyeAnalytics.js` - Birdeye integration (RATE LIMITED)
- `src/services/DegenIntelligence.js` - Degen analysis (BROKEN)
- `gui/server.js` - Dashboard server
- `config/tracked-wallets.json` - Whale wallets

---

## 🚀 **DEPLOYMENT STEPS**

1. **Fix the 2 critical issues above**
2. **Test with emergency_fix.js**
3. **Start system with correct API key**
4. **Monitor for success indicators**
5. **Check dashboard at http://localhost:3000**

---

## ⚠️ **WARNINGS**

- **DO NOT TRADE LIVE** until fixes are complete
- **System is 0% profitable** currently
- **API rate limits** are blocking functionality
- **Analysis failures** are preventing opportunities

---

**🎯 GOAL**: Get analysis success rate >90% and 0 API rate limit errors. 