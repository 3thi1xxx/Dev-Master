# 🔧 Component Reference

**For**: Future LLM Agents  
**Status**: Current Working System (Aug 17, 2025)

---

## 📋 **CANONICAL COMPONENT LOCATIONS**

> **Important**: Use these paths - they're the active/working versions

### **🔌 Connection Management**
- **SharedWebSocketManager** → `src/services/SharedWebSocketManager.js` (375 lines)
  - Purpose: Browser-level persistent WebSocket connections
  - Manages: Cluster7, Eucalyptus, Birdeye connections
  - Status: ✅ Working, no duplicates

### **🔐 Authentication**  
- **AxiomTokenManager** → `src/core/AxiomTokenManager.js` (317 lines)
  - Purpose: JWT token refresh & cookie-based auth
  - Manages: Access tokens, refresh tokens, endpoint failover
  - Status: ✅ Working (fixed expired tokens Aug 17)

---

## 🔍 **ANALYSIS ENGINES**

### **LiveTokenAnalyzer** ⚠️ DUPLICATE DETECTED
- **ACTIVE**: `src/core/analyzers/LiveTokenAnalyzer.js` (1,030 lines)
  - Used by: GUI Server, MasterController
- **UNUSED**: `src/services/LiveTokenAnalyzer.js` (1,179 lines) 
  - Has more features but not used by main system
- **Issue**: Core version imports FROM services (dependency inversion)

### **FastMemeAnalyzer** ⚠️ DUPLICATE DETECTED  
- **ACTIVE**: `src/services/FastMemeAnalyzer.js` 
  - Used by: LiveTokenAnalyzer for sub-200ms analysis
- **UNUSED**: `src/core/analyzers/FastMemeAnalyzer.js`
  - Status: Duplicate, should be removed

### **BirdeyeAnalytics** ✅ UNIFIED
- **ACTIVE**: `src/services/BirdeyeAnalytics.js` (852 lines)
- **REMOVED**: `src/core/data/BirdeyeAnalytics.js` (deleted Aug 17)

---

## 💰 **Trading Components**

### **PaperTradingSimulator** ⚠️ CONFLICTING VERSIONS
- **GUI/LiveTokenAnalyzer**: `src/services/PaperTradingSimulator.js` (594 lines)
- **MasterController**: `src/core/trading/PaperTradingSimulator.js` (610 lines)
- **Difference**: Core version has PositionSizing + NZTaxTracker integration
- **Issue**: Different trading logic in different parts!

### **MasterController** ✅ UNIQUE
- **Location**: `src/core/system/MasterController.js` (330 lines)
- **Purpose**: System orchestration & event routing
- **Status**: Working, no duplicates

---

## 🐦 **External API Services**

### **BirdeyeWebSocketManager** ✅ RECENTLY UNIFIED
- **ACTIVE**: `src/services/BirdeyeWebSocketManager.js` (544 lines)  
- **REMOVED**: `src/core/integrations/BirdeyeWebSocketManager.js` (deleted Aug 17)
- **Purpose**: Real-time token price tracking (500 concurrent connections)

### **AxiomAPIService** ✅ UNIFIED
- **ACTIVE**: `src/core/data/AxiomAPIService.js` (588 lines)
- **REMOVED**: `src/services/AxiomAPIService.js` (deleted Aug 17)
- **Purpose**: Token info, trader data, pair analysis

---

## 🌐 **Infrastructure**

### **WhaleDataService** ⚠️ SPLIT USAGE
- **ACTIVE**: `src/services/WhaleDataService.js` 
  - Used by: LiveTokenAnalyzer, FastMemeAnalyzer
- **ALSO ACTIVE**: `src/core/data/WhaleDataService.js`
  - Used by: GUI Server, MasterController
- **Issue**: Two different instances of whale tracking!

### **ThermalManager** ⚠️ DUPLICATE DETECTED
- **Location 1**: `src/services/ThermalManager.js`
- **Location 2**: `src/infrastructure/ThermalManager.js`
- **Status**: Need to check which is active

---

## 🚨 **HIGH-RISK DUPLICATES**

### **Immediate Attention Needed**
1. **WhaleDataService** - Split brain whale tracking
2. **PaperTradingSimulator** - Different trading logic  
3. **LiveTokenAnalyzer** - Core using older version

### **Lower Priority**
1. **ThermalManager** - Infrastructure vs services
2. **MemoryManager** - Multiple copies
3. **Various *Engine classes** - Many duplicates but isolated

---

## 🎯 **USAGE PATTERNS**

### **Main System Imports**
```javascript
// GUI Server (primary interface)
import { liveTokenAnalyzer } from '../core/analyzers/LiveTokenAnalyzer.js';
import { paperTradingSimulator } from '../services/PaperTradingSimulator.js';

// MasterController (orchestration) 
import { liveTokenAnalyzer } from '../analyzers/LiveTokenAnalyzer.js';
import { paperTradingSimulator } from '../trading/PaperTradingSimulator.js';
```

**Result**: GUI and Master using **different PaperTradingSimulator instances!**

---

## 📝 **RECOMMENDED ACTIONS**

### **For Future LLMs:**
1. **Always check** this reference before modifying components
2. **Use grep** to find all imports before changing/moving files
3. **Test thoroughly** - the dependency web is complex
4. **Document changes** here when you unify duplicates

### **For System Maintenance:**
1. Consider singleton pattern for core services
2. Implement dependency injection for better testing
3. Create clear import path conventions
4. Add automated tests for component isolation

---

## 📊 **GUI COMPONENTS**

### **Unified Dashboard (Active)**
- **Main**: `src/gui/fast-meme-dashboard.html` (45KB)
  - Enhanced from 24KB with integrated features
  - Serves at `http://localhost:3000`
  - Includes: whale discovery, filter controls, AI metrics, portfolio tracking
  - Fixed: All JavaScript chart reference errors
  - See: `GUI_UNIFICATION_STATUS.md` for complete details

### **Backup Dashboards (Preserved)**
- `src/gui/realtime-dashboard.html` (24KB) - Portfolio focused
- `src/gui/trading-dashboard.html` (33KB) - Advanced analysis  
- `src/gui/working-dashboard.html` (24KB) - Clean fallback
- `src/gui/AxiomOverlay.html` (11KB) - Whale tracking
- `gui/` directory contains all original untouched versions

### **GUI Server**
- **Location**: `src/gui/server.js`
- **Port**: 3000
- **Routes**: Main route serves unified dashboard
- **WebSocket**: Socket.IO for real-time updates

---

**⚠️ Critical**: Don't change working imports without full system test - the dependency chains are complex! 