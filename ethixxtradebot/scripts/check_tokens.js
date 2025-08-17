#!/usr/bin/env node
/**
 * Token Health Check Script
 * Run before system startup to ensure tokens are valid
 */

import { config } from 'dotenv';
import { axiomTokenManager } from '../src/core/AxiomTokenManager.js';

config({ path: './axiom_tokens.env' });

async function checkTokenHealth() {
  console.log('\n🔍 CHECKING TOKEN HEALTH...\n');
  
  try {
    // Test token loading
    console.log('📄 Loading tokens...');
    const accessToken = process.env.AXIOM_ACCESS_TOKEN;
    const refreshToken = process.env.AXIOM_REFRESH_TOKEN;
    
    if (!accessToken) {
      console.log('❌ No access token found');
      return false;
    }
    
    if (!refreshToken) {
      console.log('❌ No refresh token found');  
      return false;
    }
    
    console.log('✅ Tokens loaded from environment');
    
    // Check token expiry
    try {
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid access token format');
        return false;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = Math.floor((exp - now) / 1000);
      
      console.log(`⏰ Access token expires in: ${timeLeft} seconds`);
      
      if (timeLeft < 0) {
        console.log('⚠️ Access token EXPIRED - attempting refresh...');
        
        const refreshed = await axiomTokenManager.refreshAccessToken();
        if (refreshed) {
          console.log('✅ Token refreshed successfully');
          return true;
        } else {
          console.log('❌ Token refresh FAILED - manual update needed');
          console.log('\n📋 TO FIX:');
          console.log('1. Open https://axiom.trade in browser');
          console.log('2. F12 → Application → Local Storage → axiom.trade');
          console.log('3. Copy access_token and refresh_token');
          console.log('4. Update axiom_tokens.env file');
          return false;
        }
      } else if (timeLeft < 300) {
        console.log('⚠️ Token expires in <5 minutes - refreshing...');
        await axiomTokenManager.refreshAccessToken();
      } else {
        console.log('✅ Access token is valid');
      }
      
      return true;
      
    } catch (error) {
      console.log('❌ Error checking token expiry:', error.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Token check failed:', error.message);
    return false;
  }
}

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const isHealthy = await checkTokenHealth();
  console.log(`\n${isHealthy ? '✅' : '❌'} Token health check: ${isHealthy ? 'PASS' : 'FAIL'}\n`);
  process.exit(isHealthy ? 0 : 1);
}

export { checkTokenHealth }; 