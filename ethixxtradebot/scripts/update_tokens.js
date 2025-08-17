#!/usr/bin/env node
/**
 * Token Update Helper
 * Safely update Axiom tokens from browser extraction
 */

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateTokens() {
  console.log('\n🔐 AXIOM TOKEN UPDATE HELPER\n');
  console.log('Instructions:');
  console.log('1. Open https://axiom.trade in browser');
  console.log('2. F12 → Application → Local Storage → axiom.trade');
  console.log('3. Find access_token and refresh_token');
  console.log('4. Copy the values (without quotes)\n');
  
  try {
    const accessToken = await question('🎫 Paste ACCESS TOKEN: ');
    if (!accessToken.startsWith('eyJ')) {
      console.log('❌ Invalid access token format (should start with eyJ)');
      process.exit(1);
    }
    
    const refreshToken = await question('🔄 Paste REFRESH TOKEN: ');
    if (!refreshToken.startsWith('eyJ')) {
      console.log('❌ Invalid refresh token format (should start with eyJ)');
      process.exit(1);
    }
    
    console.log('\n📝 Updating axiom_tokens.env...');
    
    // Read current file
    let envContent = fs.readFileSync('./axiom_tokens.env', 'utf8');
    
    // Update tokens
    envContent = envContent.replace(
      /AXIOM_ACCESS_TOKEN=.*/,
      `AXIOM_ACCESS_TOKEN=${accessToken}`
    );
    
    envContent = envContent.replace(
      /AXIOM_REFRESH_TOKEN=.*/,
      `AXIOM_REFRESH_TOKEN=${refreshToken}`
    );
    
    // Add timestamp
    const timestamp = new Date().toISOString();
    if (!envContent.includes('# Updated:')) {
      envContent = `# Updated: ${timestamp}\n${envContent}`;
    } else {
      envContent = envContent.replace(
        /# Updated: .*/,
        `# Updated: ${timestamp}`
      );
    }
    
    // Write back to file
    fs.writeFileSync('./axiom_tokens.env', envContent);
    
    console.log('✅ Tokens updated successfully!');
    console.log('🚀 You can now run: ./START_SYSTEM.sh');
    
  } catch (error) {
    console.log('❌ Error updating tokens:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

updateTokens(); 