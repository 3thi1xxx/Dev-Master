# 🔧 Common Issues & Solutions

**For**: Future LLM Troubleshooting  
**Last Updated**: August 17, 2025

---

## 🚨 **CRITICAL ISSUES (RECENTLY FIXED)**

### **❌ forEach undefined errors** ✅ FIXED
**Symptoms**:
```
[LIVE] ❌ Analysis error: TOKEN - Cannot read properties of undefined (reading 'forEach')
```

**Root Cause**: Socket.IO client handling in `src/gui/server.js`
```javascript
// ❌ BROKEN (Socket.IO doesn't have .clients property)
io.clients.forEach(client => { ... });

// ✅ FIXED 
if (io && io.sockets) {
  io.emit('trading_opportunity', opportunity);
}
```

**Fix Applied**: Lines 605 & 615 in `src/gui/server.js`

### **❌ Axiom API 500 errors** ✅ FIXED  
**Symptoms**:
```
[AXIOM-API] ❌ Error calling /token-info (219ms): Request failed with status code 500
❌ Token health check: FAIL
```

**Root Cause**: Expired JWT tokens
- Token expired at: `09:50:28`
- System ran at: `09:56:34` 
- Result: All API calls rejected

**Fix Applied**: Token refresh via `axiomTokenManager.refreshAccessToken()`

### **❌ Module import failures** ✅ FIXED
**Symptoms**:
```
Cannot find module '/Users/.../BirdeyeAnalytics.js' imported from EnhancedExternalAnalysis.js
```

**Root Cause**: Duplicate modules deleted without fixing imports
**Fix Applied**: Updated import paths to point to remaining canonical versions

---

## ⚠️ **CURRENT ONGOING ISSUES**

### **🔄 Axiom API intermittent 500s**
**Symptoms**: Some Axiom endpoints still return 500 errors
**Status**: Likely server-side issue, not authentication
**Workaround**: System continues working with cached/fallback data
**Monitoring**: Non-blocking, doesn't affect core functionality

### **📡 Birdeye rate limiting**
**Symptoms**: 
```
[DATA] ❌ Birdeye API FAILED: { success: false, message: 'Too many requests' }
```
**Root Cause**: Multiple rate limiters or API key tier confusion
**Status**: Non-critical, cached data used
**Solution**: Verify API key tier and consolidate rate limiters

---

## 🏗️ **ARCHITECTURAL CONFUSION (NON-BREAKING)**

### **32 Duplicate Files**
**Issue**: Most major classes exist in multiple directories
```
LiveTokenAnalyzer: services/ (1,179 lines) vs core/analyzers/ (1,030 lines)
PaperTradingSimulator: services/ (594 lines) vs core/trading/ (610 lines)
WhaleDataService: services/ vs core/data/ (different instances!)
```

**Impact**: Confusing for new LLMs, but system works
**Approach**: Document which versions are active, cleanup gradually

### **Mixed Import Patterns**
**Issue**: Core modules import from services (dependency inversion)
**Example**:
```javascript
// Main system
import { liveTokenAnalyzer } from '../core/analyzers/LiveTokenAnalyzer.js';

// But core/analyzers/ imports from services/
import { paperTradingSimulator } from '../../services/PaperTradingSimulator.js';
```

**Impact**: Complex dependency chains
**Status**: Stable but confusing

---

## 🔍 **DEBUGGING TECHNIQUES**

### **Token Analysis Issues**
1. **Check token expiry**: 
   ```bash
   node -e "console.log(new Date(JSON.parse(Buffer.from(process.env.AXIOM_ACCESS_TOKEN.split('.')[1], 'base64')).exp * 1000))"
   ```

2. **Test token refresh**:
   ```bash
   node -e "import('./src/core/AxiomTokenManager.js').then(({axiomTokenManager}) => axiomTokenManager.refreshAccessToken())"
   ```

### **WebSocket Connection Issues**
1. **Check connection status**:
   ```bash
   grep -E "(Connected|connection|WebSocket)" startup.log | tail -10
   ```

2. **Monitor live data flow**:
   ```bash
   tail -f startup.log | grep -E "(OPPORTUNITY|cluster7|LIVE)"
   ```

### **Import/Module Issues**
1. **Find broken imports**:
   ```bash
   node start.js 2>&1 | grep "Cannot find module" | head -5
   ```

2. **Check file existence**:
   ```bash
   find src -name "ModuleName.js" -type f
   ```

---

## 🔧 **QUICK FIXES**

### **System Won't Start**
1. Check token expiry (most common cause)
2. Verify all import paths are valid
3. Check for port conflicts (3000, WebSocket ports)
4. Review last 20 lines of startup log

### **No Live Data**
1. Verify Cluster7 WebSocket connection
2. Check SharedWebSocketManager status
3. Confirm subscription to correct rooms
4. Test with simple cluster7 monitor utility

### **Analysis Pipeline Stuck**
1. Check for undefined forEach errors
2. Verify all analysis dependencies available
3. Test with mock data to isolate issue
4. Check memory usage and cleanup

---

## 📚 **REFERENCE**

### **Log Patterns**
- `[LIVE] 🎯 OPPORTUNITY DETECTED` - Successful detection
- `[LIVE] ✅ Analysis complete` - Pipeline working
- `[PAPER] 🟢 BUY` - Trade executed
- `❌` - Error that needs attention

### **File Locations**
- **Main Entry**: `start.js`
- **Config**: `axiom_tokens.env`
- **Logs**: `startup.log`, `system_output.log`
- **Dashboard**: `http://localhost:3000`

---

**🎯 Remember**: System is currently WORKING - be careful with changes that could break the delicate dependency balance! 