# 🤖 LLM Agent Onboarding Guide

**For**: Future AI Agents working on EthixxTradeBot  
**Updated**: August 17, 2025  
**Difficulty**: Intermediate (due to architectural debt)

---

## 🎯 **BEFORE YOU START**

### **⚠️ CRITICAL WARNINGS**
1. **System is WORKING** - be extremely careful with changes
2. **32 duplicate files exist** - always check which version is active
3. **Complex dependency chains** - test thoroughly before committing  
4. **Mixed architecture** - core/ imports from services/ (unusual pattern)

### **🔍 FIRST STEPS**
1. Read this guide completely
2. Review `architecture/SYSTEM_OVERVIEW.md` 
3. Check `troubleshooting/COMMON_ISSUES.md` for recent fixes
4. Test your understanding with read-only exploration

---

## 🏗️ **ARCHITECTURAL UNDERSTANDING**

### **Directory Structure Logic**
```
ethixxtradebot/src/
├── core/           ← Main system components (orchestration)
├── services/       ← Business logic & external integrations  
├── clients/        ← DEX/API client wrappers
├── gui/            ← Dashboard server & frontend
├── utils/          ← Utilities & standalone tools
└── infrastructure/ ← System-level components
```

**⚠️ Reality**: Many components exist in multiple directories!

### **Import Pattern Analysis**
**Main System Flow**:
```
start.js → MasterController → LiveTokenAnalyzer → FastMemeAnalyzer → PaperTradingSimulator
   ↓           (core/)          (core/analyzers/)    (services/)       (services/)
GUI Server ─────────┘
```

**Dependency Direction**: 
- Core → Services (unusual but working)
- Services → Core (for auth/data)
- Creates cycles but stable

---

## 🔍 **CODEBASE EXPLORATION STRATEGY**

### **Phase 1: Map Working System**
```bash
# Find main entry points
grep -r "export.*new.*" src/ | grep -E "(Manager|Analyzer|Service)"

# Check active imports in main system
grep -r "import.*from" src/core/system/ src/gui/server.js

# Verify component initialization
grep -r "new.*(" start.js src/core/system/
```

### **Phase 2: Understand Data Flow**
```bash
# Follow token detection pipeline
grep -r "new_pairs\|OPPORTUNITY\|emitOpportunity" src/

# Check WebSocket message handling
grep -r "handleMessage\|on.*message" src/

# Verify analysis pipeline
grep -r "analyzeToken\|fastMemeAnalyzer" src/
```

### **Phase 3: Identify Duplicates**
```bash
# Find duplicate filenames
find src -name "*.js" -exec basename {} \; | sort | uniq -d

# Check which versions are imported
grep -r "import.*{ComponentName}" src/ | head -10

# Compare file sizes
wc -l src/services/Component.js src/core/Component.js
```

---

## 🚨 **DANGER ZONES**

### **High-Risk Files** (Many Dependencies)
- `src/core/analyzers/LiveTokenAnalyzer.js` - Main analysis engine
- `src/services/SharedWebSocketManager.js` - Connection pooling
- `src/core/system/MasterController.js` - System orchestration
- `src/gui/server.js` - Dashboard interface

**Rule**: Never modify these without understanding full impact!

### **Duplicate Traps**
- **LiveTokenAnalyzer**: Core version active but services version has more features
- **PaperTradingSimulator**: GUI uses services/, Master uses core/ 
- **WhaleDataService**: Two instances running simultaneously!

**Rule**: Always `grep -r` to find ALL imports before changing!

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Safe Exploration Pattern**
1. **Read First**: Check docs-canonical/ before touching code
2. **Map Dependencies**: `grep -r "import.*YourComponent" src/`
3. **Identify Active Version**: Check main system imports
4. **Test in Isolation**: Create minimal test before system changes
5. **Document Changes**: Update canonical docs

### **Testing Strategy**
```bash
# Quick system health check
timeout 30s node start.js > test.log 2>&1 && echo "✅ Starts" || echo "❌ Broken"

# Check for errors
grep -E "(❌|ERROR|Cannot find)" test.log | head -5

# Verify live data flow
grep -E "(OPPORTUNITY|Analysis complete)" test.log | head -3
```

### **Emergency Recovery**
```bash
# If you break something:
git stash                    # Save changes
git checkout HEAD -- .      # Reset to working state
node start.js               # Verify it works
git stash pop               # Reapply changes selectively
```

---

## 📊 **DUPLICATE FILE INVENTORY**

### **High-Priority Duplicates** (Different Functionality)
```
PaperTradingSimulator: services/ vs core/trading/ (different features)
LiveTokenAnalyzer: core/analyzers/ vs services/ (different sizes) 
WhaleDataService: services/ vs core/data/ (different instances)
```

### **Identical Duplicates** (Safe to Remove)
```
BirdeyeWebSocketManager: 544 lines each (REMOVED: core/integrations/)
ThermalManager: services/ vs infrastructure/ 
MemoryManager: services/ vs infrastructure/
```

### **Unknown Status** (Need Investigation)
```
AdvancedTechnicalAnalysis.js
DegenIntelligence.js  
MomentumTracker.js
NeuralPatternLearning.js
... 25+ more files
```

---

## 🎯 **RECOMMENDED EXPLORATION ORDER**

### **For New LLMs:**
1. **Start Safe**: `troubleshooting/COMMON_ISSUES.md` 
2. **Understand Flow**: `architecture/SYSTEM_OVERVIEW.md`
3. **Map Components**: `architecture/COMPONENT_REFERENCE.md`
4. **Check APIs**: `api/EXTERNAL_INTEGRATIONS.md`
5. **Practice**: Read-only exploration with grep/codebase_search

### **For Code Changes:**
1. **Verify System Working**: Run startup test
2. **Map All Dependencies**: Find all imports/exports
3. **Create Test Case**: Isolated component test
4. **Make Minimal Change**: Single focused modification
5. **Test Full System**: Verify no regressions
6. **Update Documentation**: Keep canonical docs current

---

## 💡 **PRO TIPS FOR LLMS**

### **Quick Commands**
```bash
# System health in 30 seconds
timeout 30s node start.js | grep -E "(✅|❌|OPPORTUNITY)" | tail -10

# Find component usage
grep -r "componentName" src/ | grep import | head -5

# Check duplicate status  
find src -name "ComponentName.js" -type f

# Test specific component
node -e "import('./src/path/Component.js').then(c => console.log('✅ Loads'))"
```

### **Understanding Patterns**
- **EventEmitter**: Most classes extend this - follow event flow
- **Singleton Exports**: `export const instance = new Class()` - shared state
- **Import Paths**: Relative paths reveal architecture (../../ = going up dirs)
- **Log Prefixes**: `[LIVE]`, `[PAPER]`, `[SHARED-WS]` - trace execution

---

## 🔍 **LEGACY DOCS VALIDATION**

### **Legacy Archive Contents**
The `legacy-archive/docs/` contains outdated but potentially useful information:

- **API docs**: Some endpoint documentation may still be valid
- **Setup guides**: Deployment steps may need verification  
- **Architecture docs**: Historical context for current mess
- **Integration guides**: External service setup

### **Validation Process**
1. **Check timestamps** - anything >1 month old likely outdated
2. **Cross-reference current** - compare with working system
3. **Test claims** - verify any setup instructions still work
4. **Merge validated content** - add confirmed info to canonical docs

---

**🎯 Goal**: Make onboarding predictable and safe for future LLMs despite the current architectural complexity! 