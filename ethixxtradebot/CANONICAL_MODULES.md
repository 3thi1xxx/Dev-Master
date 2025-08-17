# 🎯 CANONICAL MODULES REFERENCE
**Created**: August 17, 2025  
**Purpose**: Single source of truth for module locations after cleanup

## 📌 **CANONICAL MODULES** (Use These Only)

### **Core System Modules**
- ✅ `src/core/AxiomTokenManager.js` - **ACTIVE** - Token refresh & management
- ✅ `src/core/ConnectionManager.js` - **ACTIVE** - WebSocket & API connections
- ✅ `src/core/DataManager.js` - **ACTIVE** - Unified data layer
- ✅ `src/core/PaperTradingSystem.js` - **ACTIVE** - Trading simulation
- ✅ `gui/server.js` - **ACTIVE** - Dashboard server

### **Preferred WebSocket Strategy**
- ✅ `src/services/SharedWebSocketManager.js` - **AVAILABLE** - Browser-pattern connections (43+ min persistence)
- ✅ `src/core/ConnectionManager.js` - **CURRENT** - Cookie-based auth (active)

### **Import Paths** (Always Use These)
```javascript
// Core system
import { axiomTokenManager } from './src/core/AxiomTokenManager.js';
import { connectionManager } from './src/core/ConnectionManager.js';
import { dataManager } from './src/core/DataManager.js';

// Alternative WebSocket (if switching)
import { sharedWebSocketManager } from './src/services/SharedWebSocketManager.js';
```

---

## 🗂️ **ARCHIVED MODULES** (Do Not Use)

### **Archived on 2025-08-17**
- ❌ `src/infrastructure/AxiomTokenManager.js` → `archive/deprecated-modules/20250817/`
- ❌ `src/services/AxiomTokenManager.js` → `archive/deprecated-modules/20250817/`
- ❌ `src/core/data/SharedWebSocketManager.js` → `archive/deprecated-modules/20250817/`

### **Why Archived**
- **Multiple implementations** caused confusion during merges
- **Different authentication methods** conflicted
- **Import path inconsistencies** broke the system

---

## 🛡️ **PREVENTION RULES**

### **Before Creating New Modules:**
1. Check this file first
2. Extend existing modules instead of duplicating
3. Update this file when adding new canonical modules

### **Before Merging Systems:**
1. Use `CANONICAL_MODULES.md` as reference
2. Archive conflicting versions before merge
3. Update imports to use canonical paths only

### **Module Naming Convention:**
- **Core modules**: `src/core/ModuleName.js`
- **Services**: `src/services/ServiceName.js` 
- **Utilities**: `src/utils/UtilityName.js`

---

## 🔧 **QUICK RECOVERY COMMANDS**

```bash
# If system breaks after merge:
# 1. Check canonical modules are in place
ls -la src/core/AxiomTokenManager.js src/core/ConnectionManager.js

# 2. Verify imports point to canonical versions
grep -r "AxiomTokenManager" src/ gui/ | grep import

# 3. Archive conflicting duplicates
mv conflicting-file.js archive/deprecated-modules/$(date +%Y%m%d)/
```

---

## 📈 **SYSTEM HEALTH CHECK**

```bash
# Run this to verify canonical system health
node -e "
const modules = [
  './src/core/AxiomTokenManager.js',
  './src/core/ConnectionManager.js', 
  './src/core/DataManager.js'
];
modules.forEach(async (mod) => {
  try {
    await import(mod);
    console.log('✅', mod);
  } catch (e) {
    console.log('❌', mod, e.message);
  }
});
"
```

---

**Last Updated**: August 17, 2025  
**Next Review**: Before any major system merge 