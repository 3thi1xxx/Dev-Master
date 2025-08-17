#!/usr/bin/env node
/**
 * LIVE PAPER TRADING SYSTEM
 * Full real-time data, API, WebSocket, GUI, and profit tracking
 */

import { config } from 'dotenv';
config({ path: './axiom_tokens.env' });

console.log('\n' + '═'.repeat(70));
console.log('🚀 ETHIXXTRADEBOT - LIVE PAPER TRADING SYSTEM');
console.log('═'.repeat(70));
console.log('📊 REAL DATA | 🌐 REAL API | 📡 REAL WEBSOCKETS | 💼 PAPER TRADING');
console.log('═'.repeat(70));

// Import the main system
import('./src/core/index.js').then(() => {
  console.log('\n✅ SYSTEM LAUNCHED!');
  console.log('═'.repeat(70));
  console.log('📈 Dashboard: http://localhost:3000');
  console.log('💼 Paper Trading: $10,000 starting capital');
  console.log('📍 Location: Auckland (254ms advantage)');
  console.log('🎯 Target: 3-5% daily profit');
  console.log('═'.repeat(70));
  console.log('\n⏳ Monitoring live Solana meme coins...');
  console.log('Press Ctrl+C to stop\n');
}).catch(error => {
  console.error('❌ Failed to start system:', error.message);
  process.exit(1);
}); 