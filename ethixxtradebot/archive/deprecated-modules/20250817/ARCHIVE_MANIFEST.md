# 📦 ARCHIVE MANIFEST - August 17, 2025

## 🎯 **Reason for Archive**
System broke after merge due to conflicting duplicate modules. Archived non-canonical versions to prevent future confusion.

## 📂 **Archived Files**

### **AxiomTokenManager Duplicates**
- **`AxiomTokenManager.js` (from src/infrastructure/)**
  - **Reason**: Duplicate of canonical `src/core/AxiomTokenManager.js`
  - **Issues**: Different authentication method, unused imports
  - **Status**: Superseded by core version

- **`AxiomTokenManager.js` (from src/services/)**
  - **Reason**: Duplicate of canonical `src/core/AxiomTokenManager.js`  
  - **Issues**: Outdated token refresh format
  - **Status**: Superseded by core version

### **SharedWebSocketManager Duplicate**
- **`SharedWebSocketManager.js` (from src/core/data/)**
  - **Reason**: Duplicate of canonical `src/services/SharedWebSocketManager.js`
  - **Issues**: Import path confusion, different location
  - **Status**: Superseded by services version

## 🔧 **Canonical Replacements**

| Archived File | Canonical Replacement | Import Path |
|---------------|----------------------|-------------|
| `infrastructure/AxiomTokenManager.js` | `src/core/AxiomTokenManager.js` | `import { axiomTokenManager } from './src/core/AxiomTokenManager.js'` |
| `services/AxiomTokenManager.js` | `src/core/AxiomTokenManager.js` | `import { axiomTokenManager } from './src/core/AxiomTokenManager.js'` |
| `core/data/SharedWebSocketManager.js` | `src/services/SharedWebSocketManager.js` | `import { sharedWebSocketManager } from './src/services/SharedWebSocketManager.js'` |

## 🚫 **Do Not Restore**
These files should remain archived unless there's a specific need to extract functionality that was unique to them.

## 📈 **Impact**
- ✅ Eliminated 3 duplicate modules
- ✅ Clarified canonical import paths
- ✅ Prevented future merge conflicts
- ✅ Established single source of truth

## 🔄 **Recovery Process**
If any archived functionality is needed:
1. Compare archived version with canonical version
2. Extract only unique functionality
3. Merge into canonical version
4. Update imports if necessary
5. Test thoroughly

---

**Archived by**: System cleanup process  
**Date**: August 17, 2025  
**Context**: Post-merge duplicate resolution 