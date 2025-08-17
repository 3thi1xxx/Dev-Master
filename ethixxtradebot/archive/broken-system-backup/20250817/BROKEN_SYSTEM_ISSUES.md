# 🚨 BROKEN SYSTEM ISSUES ARCHIVE - August 17, 2025

## 📋 **Issues That Were Breaking The System**

### **1. CRITICAL: Expired Authentication Tokens**
- **Problem**: Access tokens 77+ hours old (-1458 seconds expired)
- **Symptom**: 401 Unauthorized errors, WebSocket disconnections
- **Root Cause**: Token refresh using wrong API format
- **Fix Applied**: ✅ Updated refresh format to use `refresh_token` in body instead of Authorization header

### **2. CRITICAL: Forced Test Mode**
- **Problem**: `if (process.env.TEST_MODE === 'true' || true)` always activated test mode
- **Symptom**: Only demo trades showing, no live data
- **Root Cause**: Debug code `|| true` left in production
- **Fix Applied**: ✅ Removed `|| true` condition

### **3. CRITICAL: Duplicate Module Confusion**
- **Problem**: 3x AxiomTokenManager, 2x SharedWebSocketManager implementations
- **Symptom**: Import conflicts, different auth methods
- **Root Cause**: System merges created multiple versions
- **Fix Applied**: ✅ Archived duplicates, created canonical module reference

### **4. CRITICAL: Birdeye WebSocket Subscription Error**
- **Problem**: `SUBSCRIBE_LARGE_TRADE_TXS` using `volumeThreshold` instead of `min_volume`
- **Symptom**: 100% failure rate for large trade subscriptions
- **Root Cause**: Wrong parameter name for Birdeye API
- **Fix Applied**: ✅ Changed `volumeThreshold` to `min_volume`

### **5. MODERATE: Portfolio Display Issues**
- **Problem**: API returning null values for portfolio
- **Symptom**: $0.00 showing instead of real values
- **Root Cause**: Module initialization timing, test mode masking real data
- **Fix Applied**: ✅ Fixed via authentication and test mode fixes

## 🔧 **What Was Fixed**

### **Token Management:**
```javascript
// BROKEN (Before):
headers: { 'Authorization': `Bearer ${this.refreshToken}` }

// FIXED (After):
body: { refresh_token: this.refreshToken }
```

### **Test Mode:**
```javascript
// BROKEN (Before):
if (process.env.TEST_MODE === 'true' || true) // Always true!

// FIXED (After):
if (process.env.TEST_MODE === 'true') // Only if explicitly enabled
```

### **Birdeye WebSocket:**
```javascript
// BROKEN (Before):
data: { volumeThreshold: volumeThreshold }

// FIXED (After):
data: { min_volume: volumeThreshold }
```

## 📊 **Results After Fix**

### **BEFORE (Broken):**
- ❌ 401 Unauthorized errors
- ❌ WebSocket disconnections every 15 minutes
- ❌ Portfolio showing $0.00
- ❌ Only test data visible
- ❌ Birdeye subscriptions failing
- ❌ Module import conflicts

### **AFTER (Fixed):**
- ✅ Authentication working (fresh tokens)
- ✅ Stable WebSocket connections
- ✅ Real portfolio: $9,259.47
- ✅ Live trading data flowing
- ✅ Birdeye subscriptions successful
- ✅ Clean module hierarchy

## 🛡️ **Prevention Measures Added**

1. **Token Health Checks**: `scripts/check_tokens.js` validates before startup
2. **Canonical Modules**: `CANONICAL_MODULES.md` defines single source of truth
3. **Archive System**: Dated storage for conflicting implementations
4. **Auto-Validation**: `START_SYSTEM.sh` includes token check

## 📈 **System Status After Fixes**

```bash
# System Health: ✅ HEALTHY
curl http://localhost:3000/api/health

# Portfolio: ✅ WORKING
curl http://localhost:3000/api/portfolio  

# Birdeye API: ✅ WORKING  
curl http://localhost:3000/api/test-birdeye

# Token Status: ✅ VALID
node scripts/check_tokens.js
```

## 🚨 **NEVER RESTORE THESE PATTERNS**

- ❌ Multiple AxiomTokenManager implementations
- ❌ Authorization header token refresh (use body instead)
- ❌ Hardcoded test mode enablement (`|| true`)
- ❌ Wrong Birdeye API parameter names
- ❌ Expired token usage without validation

## 📝 **Lessons Learned**

1. **Authentication**: Always match API specification exactly
2. **Test Mode**: Remove debug conditions from production code
3. **Module Management**: One canonical implementation per module
4. **Prevention**: Validate tokens before system startup
5. **Documentation**: Archive broken states for future reference

---

**Archived**: August 17, 2025  
**Status**: Issues resolved, prevention measures active  
**Next**: Maintain clean canonical architecture 