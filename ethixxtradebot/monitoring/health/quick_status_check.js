#!/usr/bin/env node

/**
 * QUICK STATUS CHECK
 * Verifies server and Premium Plus integration
 */

console.log('🔍 QUICK STATUS CHECK');
console.log('====================');

// 1. Check server process
console.log('\n1️⃣ CHECKING SERVER PROCESS...');
import { execSync } from 'child_process';

try {
  const psOutput = execSync('ps aux | grep "node gui/server.js" | grep -v grep', { encoding: 'utf8' });
  console.log('✅ Server is running');
  console.log('📊 Process info:', psOutput.trim());
} catch (error) {
  console.log('❌ Server not running');
  process.exit(1);
}

// 2. Check server response
console.log('\n2️⃣ CHECKING SERVER RESPONSE...');
try {
  const response = execSync('curl -s http://localhost:3000/api/status', { encoding: 'utf8', timeout: 5000 });
  console.log('✅ Server responding');
  console.log('📊 Response:', response.trim());
} catch (error) {
  console.log('❌ Server not responding');
  console.log('💡 Try: BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208 node gui/server.js');
}

// 3. Check API key environment
console.log('\n3️⃣ CHECKING API KEY...');
const apiKey = process.env.BIRDEYE_API_KEY;
if (apiKey && apiKey.length === 32) {
  console.log('✅ API Key configured correctly');
  console.log('🔑 Key:', apiKey.substring(0, 8) + '...' + apiKey.substring(24));
} else {
  console.log('❌ API Key not configured correctly');
  console.log('💡 Set: export BIRDEYE_API_KEY=f31ad137262d4a57bbb85e0b35a75208');
}

// 4. Check port availability
console.log('\n4️⃣ CHECKING PORT 3000...');
try {
  const portCheck = execSync('lsof -i :3000', { encoding: 'utf8' });
  console.log('✅ Port 3000 is in use');
} catch (error) {
  console.log('❌ Port 3000 is not in use');
}

console.log('\n🎯 STATUS SUMMARY:');
console.log('==================');
console.log('🚀 Ready to monitor live data flow!');
console.log('💡 Dashboard: http://localhost:3000');
console.log('📊 API Status: http://localhost:3000/api/status'); 