#!/usr/bin/env node
/**
 * Axiom Trading System Startup Script
 * Properly loads environment variables and starts the system
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from axiom_tokens.env
function loadEnvironment() {
  try {
    const envPath = join(__dirname, 'environments', 'axiom_tokens.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    console.log('🔧 Loading Axiom trading environment...');
    
    // Parse environment file
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key] = value;
        
        // Log API keys (partially masked)
        if (key.includes('API_KEY') || key.includes('TOKEN')) {
          console.log(`✅ ${key}: ${value.substring(0, 8)}...`);
        } else if (!key.includes('SECRET')) {
          console.log(`✅ ${key}: ${value}`);
        }
      }
    });
    
    console.log('🚀 Environment loaded successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to load environment:', error.message);
    return false;
  }
}

// Verify critical environment variables
function verifyEnvironment() {
  const required = ['BIRDEYE_API_KEY'];
  const missing = [];
  
  console.log('\n🔍 Verifying critical environment variables...');
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`❌ Missing: ${key}`);
    } else {
      console.log(`✅ Found: ${key} (${process.env[key].length} chars)`);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ All critical environment variables verified');
  return true;
}

// Main startup function
async function startSystem() {
  console.log('🎯 AXIOM TRADING SYSTEM STARTUP');
  console.log('===============================');
  
  // Load environment
  if (!loadEnvironment()) {
    process.exit(1);
  }
  
  // Verify environment
  if (!verifyEnvironment()) {
    process.exit(1);
  }
  
  console.log('\n🚀 Starting Axiom Trading System...');
  console.log('Dashboard will be available at: http://localhost:3000\n');
  
  // Import and start the main server
  try {
    const { default: server } = await import('./src/gui/server.js');
    // Server starts automatically when imported
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the system
startSystem().catch(error => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
}); 