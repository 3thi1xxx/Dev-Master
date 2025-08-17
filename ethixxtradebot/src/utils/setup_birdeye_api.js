#!/usr/bin/env node
/**
 * Birdeye API Setup Helper
 * Guides you through getting a free Birdeye API key for enhanced security analysis
 */

import fs from 'fs';
import path from 'path';

console.log('🐦 BIRDEYE API SETUP HELPER');
console.log('=' .repeat(50));
console.log('');

console.log('📋 To get enhanced security analysis working, you need a Birdeye API key:');
console.log('');
console.log('1. 🌐 Visit: https://birdeye.so/');
console.log('2. 🔑 Click "Get API Key" or "Sign Up"');
console.log('3. 📧 Create a free account');
console.log('4. 🔑 Generate an API key');
console.log('5. 📋 Copy the API key');
console.log('');

console.log('💡 Benefits of Birdeye API key:');
console.log('   • Enhanced security analysis');
console.log('   • Holder distribution analysis');
console.log('   • Rug pull detection');
console.log('   • Higher rate limits (1000 vs 100 requests/min)');
console.log('   • Real-time price and volume data');
console.log('');

console.log('🔧 Once you have your API key:');
console.log('1. Open: axiom_tokens.env');
console.log('2. Replace: your_birdeye_api_key_here');
console.log('3. With: your_actual_api_key');
console.log('4. Restart: node gui/server.js');
console.log('');

console.log('⚠️  Current Status:');
const envPath = path.join(process.cwd(), 'axiom_tokens.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = envContent.includes('BIRDEYE_API_KEY=') && 
                   !envContent.includes('your_birdeye_api_key_here');
  
  if (hasApiKey) {
    console.log('✅ Birdeye API key is configured!');
  } else {
    console.log('❌ Birdeye API key not configured - using limited functionality');
  }
} else {
  console.log('❌ axiom_tokens.env file not found');
}

console.log('');
console.log('🚀 Your AI trading system will work without the API key,');
console.log('   but enhanced security analysis will be limited.');
console.log('');
console.log('📊 Current system capabilities:');
console.log('   ✅ Neural Pattern Learning');
console.log('   ✅ Technical Analysis (RSI, MACD, Bollinger)');
console.log('   ✅ cluster7 Token Detection');
console.log('   ✅ Multi-source Decision Engine');
console.log('   ⚠️  Basic Security Analysis (without API key)');
console.log('   ⚠️  Limited Holder Analysis (without API key)');
console.log('');
console.log('🎯 Ready to continue with current setup!'); 