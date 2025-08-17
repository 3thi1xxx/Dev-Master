# AxiomTokenManager - UNIFIED REFERENCE

**Date:** 2025-08-17
**Status:** UNIFIED - All import chaos resolved

## ✅ CORRECT USAGE

**Import:** Always use from core directory
```javascript
import { axiomTokenManager } from '../core/AxiomTokenManager.js';
```

**Methods Available:**
- `getValidToken()` - Get current valid access token
- `getAuthHeaders()` - Get full auth headers for API requests
- `refreshAccessToken()` - Refresh expired tokens
- `testTokens()` - Test token validity
- `getCurrentApiBaseUrl()` - Get working API endpoint

## ❌ DEPRECATED PATHS (DO NOT USE)

```javascript
// ❌ WRONG - These paths lead to missing methods:
import { tokenManager } from './AxiomTokenManager.js';
import { tokenManager } from '../infrastructure/AxiomTokenManager.js';
```

## 🗄️ ARCHIVED CODE

- `archive/deprecated-modules/20250817/AxiomTokenManager.js` - Old version (archived)

## 📋 FILES FIXED

1. `src/services/UltraFastAxiomClient.js` ✅
2. `src/infrastructure/UltraFastAxiomClient.js` ✅  
3. `src/services/IntelligentWhaleDiscovery.js` ✅
4. `src/services/RobustWhaleDiscovery.js` ✅
5. `src/intelligence/IntelligentWhaleDiscovery.js` ✅

## 🎯 RESULT

- All Axiom API 500 errors resolved
- Unified token management
- No more import path confusion 