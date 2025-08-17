#!/usr/bin/env node

import { tokenManager } from '../services/AxiomTokenManager.js';

async function updateWithFreshTokens() {
  console.log('🔑 UPDATING WITH FRESH JWT TOKENS');
  console.log('═══════════════════════════════════');
  
  // Fresh tokens from the user's browser session
  const freshRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic';
  const freshAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MDc5MTk0LCJleHAiOjE3NTUwODAxNTR9.JVs-8GcTVYCcmpXlMJVOCyOkFg6qTcSpXqP_xsJRIco';
  
  try {
    // Update token manager with fresh tokens
    tokenManager.updateTokens(freshRefreshToken, freshAccessToken);
    
    console.log('✅ Fresh tokens loaded successfully!');
    console.log('');
    
    // Test token validity
    console.log('🧪 Testing token validity...');
    const isValid = await tokenManager.testTokens();
    
    if (isValid) {
      console.log('✅ TOKENS ARE VALID AND WORKING!');
      console.log('🚀 Ready for live trading operations');
    } else {
      console.log('⚠️ Token test failed - may need manual verification');
    }
    
    // Show status
    console.log('');
    console.log('📊 TOKEN STATUS:');
    const status = tokenManager.getStatus();
    console.log(`🔄 Refresh Token: ${status.hasRefreshToken ? '✅' : '❌'}`);
    console.log(`🎫 Access Token: ${status.hasAccessToken ? '✅' : '❌'}`);
    console.log(`⏰ Auto-Refresh: ${status.autoRefreshActive ? '✅ Active' : '❌ Inactive'}`);
    console.log(`🕐 Last Refresh: ${status.lastRefreshMinutesAgo} minutes ago`);
    
    console.log('');
    console.log('🎯 AUTHENTICATION COMPLETE!');
    console.log('Ready to deploy live micro-testing with real Axiom access');
    
  } catch (error) {
    console.error('❌ Error updating tokens:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWithFreshTokens().catch(console.error);
}

export { updateWithFreshTokens }; 