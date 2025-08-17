# 🚨 EMERGENCY FIX CHECKLIST

**For New Developer - Fix These Issues First**  
**Date**: August 15, 2025  

---

## ✅ **CHECKLIST FOR CRITICAL FIXES**

### **🔧 FIX 1: Birdeye API Key Recognition**

**File**: `src/services/BirdeyeAnalytics.js`

**Current Problem**: 
```
[BIRDEYE] ⚠️ Rate limit warning: 54/50 requests
[BIRDEYE] ⚠️ Token overview error: API key required
```

**Action Required**:
- [ ] Open `src/services/BirdeyeAnalytics.js`
- [ ] Find line with `maxRequests: this.config.apiKey ? 50 : 20`
- [ ] Change to `maxRequests: this.config.apiKey ? 1000 : 20`
- [ ] Save file

**Test**:
- [ ] Run `node test_data_flow_fixes.js`
- [ ] Check for "✅ API Key length correct (32 characters)"
- [ ] Verify no rate limit warnings

---

### **🔧 FIX 2: Degen Data Integration**

**File**: `src/services/EnhancedExternalAnalysis.js`

**Current Problem**:
```
[ENHANCED] ❌ Comprehensive analysis failed: degenData is not defined
```

**Action Required**:
- [ ] Open `src/services/EnhancedExternalAnalysis.js`
- [ ] Find Promise.allSettled array
- [ ] Add `degenData` to destructuring array
- [ ] Add `degenIntelligence.analyzeToken(tokenAddress)` to promises
- [ ] Save file

**Test**:
- [ ] Run `node test_data_flow_fixes.js`
- [ ] Check for "✅ Degen Analysis: Working perfectly"
- [ ] Verify no "degenData is not defined" errors

---

### **🔧 FIX 3: Server Port Conflicts**

**Current Problem**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Action Required**:
- [ ] Run `pkill -f "node gui/server.js"`
- [ ] Wait 3 seconds
- [ ] Start server with correct API key

**Test**:
- [ ] Run `node quick_status_check.js`
- [ ] Check for "✅ Server is running"
- [ ] Verify dashboard accessible at http://localhost:3000

---

## 🧪 **TESTING SEQUENCE**

### **Step 1: Test Individual Fixes**
```bash
# Test API key fix
node test_data_flow_fixes.js

# Test emergency fix
node emergency_fix.js

# Test system health
node quick_status_check.js
```

### **Step 2: Test System Integration**
```bash
# Start system
BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js

# Monitor in another terminal
./monitor_premium_plus_performance.sh
```

### **Step 3: Verify Success Indicators**
- [ ] No "degenData is not defined" errors
- [ ] No "Rate limit warning: XX/50 requests"
- [ ] Analysis success rate >90%
- [ ] Dashboard accessible at http://localhost:3000

---

## 📊 **SUCCESS METRICS**

### **Before Fixes**
- **Analysis Success Rate**: 0%
- **API Rate Limit Errors**: Multiple per minute
- **Degen Data Errors**: 100% failure rate
- **Server Status**: Port conflicts

### **After Fixes (Target)**
- **Analysis Success Rate**: >90%
- **API Rate Limit Errors**: 0
- **Degen Data Errors**: 0
- **Server Status**: Running smoothly

---

## 🚨 **EMERGENCY COMMANDS**

### **If System Crashes**
```bash
# Kill all processes
pkill -f "node gui/server.js"
sleep 5

# Restart with correct API key
BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js
```

### **If Fixes Don't Work**
```bash
# Run emergency fix script
node emergency_fix.js

# Check system status
node quick_status_check.js

# Monitor performance
./monitor_premium_plus_performance.sh
```

---

## 📞 **ESCALATION**

### **If Issues Persist**
1. **Check API Key**: Verify with Birdeye support
2. **Check File Permissions**: Ensure files are writable
3. **Check Node.js Version**: Ensure compatibility
4. **Check Dependencies**: Run `npm install` if needed

### **Contact Information**
- **Birdeye Support**: For API key issues
- **Previous Developer**: For system-specific questions
- **Documentation**: See `HANDOFF_GUIDE.md` for detailed instructions

---

## ⚠️ **CRITICAL WARNINGS**

1. **DO NOT TRADE LIVE** until all fixes are complete
2. **System is currently 0% profitable** due to analysis failures
3. **Test thoroughly** before considering live trading
4. **Monitor continuously** after fixes are applied

---

## 🎯 **COMPLETION CRITERIA**

**System is ready when**:
- [ ] All 3 critical fixes are applied
- [ ] Test scripts pass without errors
- [ ] Analysis success rate >90%
- [ ] 0 API rate limit errors
- [ ] Dashboard accessible and functional
- [ ] Paper trading operational

**Only then consider live trading**. 