# 🚀 Quick Start Guide

**For**: Getting EthixxTradeBot operational  
**Time**: ~5 minutes  
**Prerequisites**: Node.js 18+, basic terminal skills

---

## ⚡ **FASTEST PATH TO RUNNING SYSTEM**

### **1. Verify Environment** (30 seconds)
```bash
cd /Users/DjEthixx/Desktop/Dev/ethixxtradebot

# Check tokens are fresh
node -e "
const token = process.env.AXIOM_ACCESS_TOKEN || require('fs').readFileSync('axiom_tokens.env', 'utf8').match(/AXIOM_ACCESS_TOKEN=(.+)/)[1];
const exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64')).exp * 1000;
console.log('Token expires:', new Date(exp).toISOString());
console.log('Status:', Date.now() < exp ? '✅ Valid' : '❌ EXPIRED');
"
```

### **2. Start System** (10 seconds)
```bash
# Start in background with logging
node start.js > system.log 2>&1 &

# Check startup (wait 10 seconds)
sleep 10 && tail -20 system.log | grep -E "(✅|❌|OPPORTUNITY)"
```

### **3. Verify Operation** (30 seconds)
```bash
# Check live analysis is working
grep -E "(Analysis complete|OPPORTUNITY DETECTED)" system.log | tail -3

# Verify WebSocket connections
grep -E "(Connected|cluster7|✅)" system.log | tail -5

# Test dashboard (if port 3000 available)
curl -s http://localhost:3000 >/dev/null && echo "✅ Dashboard" || echo "❌ Dashboard"
```

---

## 🔧 **TROUBLESHOOTING STARTUP**

### **Token Expired** (Most Common)
**Symptoms**: 
```
❌ Token health check: FAIL
[AXIOM-API] ❌ Error calling /token-info: Request failed with status code 500
```

**Fix**:
```bash
node -e "import('./src/core/AxiomTokenManager.js').then(({axiomTokenManager}) => axiomTokenManager.refreshAccessToken())"
```

### **Port Conflict** 
**Symptoms**: `EADDRINUSE` error on port 3000

**Fix**:
```bash
# Kill existing process
pkill -f "node start.js"
# Or use different port
PORT=3001 node start.js
```

### **Module Import Issues**
**Symptoms**: `Cannot find module '/path/to/Component.js'`

**Fix**: Check `troubleshooting/COMMON_ISSUES.md` - we recently fixed several of these

### **No Live Data**
**Symptoms**: System starts but no `OPPORTUNITY DETECTED` messages

**Check**:
```bash
# Verify cluster7 connection
grep -E "cluster7.*Connected" system.log

# Check subscription status  
grep -E "Subscribed to.*new_pairs" system.log

# Test with minimal monitor
node src/utils/simple_cluster7_monitor.js
```

---

## 🎯 **SUCCESS INDICATORS**

### **System Working Properly**
Look for these patterns in logs:
```
✅ AXIOM_ACCESS_TOKEN: eyJhbGci...
[LIVE] 🚀 Starting live token analysis...
[LIVE] ✅ Connected to cluster7
[LIVE] 🎯 OPPORTUNITY DETECTED: [TOKEN]
[LIVE] ✅ Analysis complete: [TOKEN] → [ACTION] ([TIME]ms)
[PAPER] 🟢 BUY [TOKEN]: $[AMOUNT]
```

### **Performance Targets**
- **Startup**: <30 seconds to first opportunity
- **Analysis**: <300ms per token  
- **Detection**: <2 seconds from launch to analysis
- **Dashboard**: Real-time updates (<100ms)

---

## 📊 **MONITORING COMMANDS**

### **Live System Health**
```bash
# Real-time opportunity stream
tail -f system.log | grep -E "(OPPORTUNITY|Analysis complete)"

# Connection status
grep -E "(Connected|❌.*connection)" system.log | tail -5

# Performance metrics
grep -E "([0-9]+ms)" system.log | tail -10

# Error monitoring  
tail -f system.log | grep -E "(❌|ERROR|failed)"
```

### **Trading Activity**
```bash
# Paper trading results
grep -E "(🟢.*BUY|🔴.*SELL)" system.log | tail -10

# Position tracking
grep -E "(Position.*opened|Position.*closed)" system.log | tail -5

# Balance monitoring
grep -E "Balance.*\$" system.log | tail -3
```

---

## 🔗 **INTEGRATION TESTING**

### **Axiom Connection Test**
```bash
node -e "
import('./src/services/SharedWebSocketManager.js').then(async ({sharedWebSocketManager}) => {
  const conn = await sharedWebSocketManager.getSharedConnection('wss://cluster7.axiom.trade/');
  console.log('✅ Cluster7 connection test passed');
  process.exit(0);
}).catch(e => { console.log('❌ Connection test failed:', e.message); process.exit(1); });
"
```

### **Token Analysis Test**  
```bash
node -e "
import('./src/services/FastMemeAnalyzer.js').then(async ({FastMemeAnalyzer}) => {
  const analyzer = new FastMemeAnalyzer();
  const result = await analyzer.analyzeToken({
    address: 'test', symbol: 'TEST', liquidity: 1000, volume: 500
  });
  console.log('✅ Analysis test passed:', result.recommendation);
  process.exit(0);
}).catch(e => { console.log('❌ Analysis test failed:', e.message); process.exit(1); });
"
```

---

## 🎯 **DEVELOPMENT BEST PRACTICES**

### **For LLMs Working on This Codebase**

#### **DO:**
- ✅ Always test in isolated environment first
- ✅ Use `grep -r` to find ALL usages before changing imports
- ✅ Check both `services/` and `core/` for duplicate components
- ✅ Monitor logs for 10+ seconds after changes
- ✅ Update canonical docs when you fix duplicates

#### **DON'T:**
- ❌ Delete files without checking ALL imports
- ❌ Assume single version of components
- ❌ Change working imports without full system test
- ❌ Trust old docs without verification
- ❌ Make multiple changes simultaneously

---

## 🔄 **COMMON MODIFICATION PATTERNS**

### **Adding New Feature**
1. Check if similar feature exists in duplicates
2. Choose canonical location (`services/` for business logic)
3. Add tests before integration
4. Update this documentation

### **Fixing Bugs**  
1. Identify which component version is actually active
2. Check for same bug in duplicate versions
3. Fix active version only initially
4. Document the fix pattern here

### **Unifying Duplicates**
1. Map ALL imports to both versions
2. Choose canonical version (usually most complete)
3. Update imports incrementally
4. Test after each import change
5. Remove unused version last

---

## 📝 **DOCUMENTATION MAINTENANCE**

### **When You Make Changes**
Update these files:
- `COMPONENT_REFERENCE.md` - If you move/unify components
- `COMMON_ISSUES.md` - If you fix bugs or find new issues  
- `EXTERNAL_INTEGRATIONS.md` - If you change API integrations
- This file - If you discover new patterns or issues

### **Validation Process**
- Test any changes with real system before documenting
- Include exact commands that work
- Note performance impact of changes
- Update architectural debt status

---

**🎯 Remember**: The goal is to make this codebase approachable for future LLMs while preserving the working system we have! 