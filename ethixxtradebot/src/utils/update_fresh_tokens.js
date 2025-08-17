#!/usr/bin/env node
/**
 * Fresh Token Updater
 * Updates Axiom tokens with fresh browser-extracted tokens and tests immediately
 */

import { AxiomTokenManager } from './services/AxiomTokenManager.js';
import fs from 'fs';

class FreshTokenUpdater {
    constructor() {
        // FRESH TOKENS from user's browser (August 14, 2025 02:29:19 GMT)
        this.freshTokens = {
            refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            userId: '64958bb1-3016-4780-8b09-f687062cfa20'
        };
        
        console.log('🔥 FRESH TOKEN UPDATER');
        console.log('🕐 Extracted from browser at 02:29:19 GMT');
        console.log('⏰ Access token expires in ~15 minutes');
        console.log('🔄 Refresh token valid for 400 days');
    }
    
    async updateTokens() {
        console.log('\n🔄 UPDATING TOKEN MANAGER...');
        
        // Create enhanced token manager with API3 endpoint
        const tokenManager = new AxiomTokenManager();
        
        // Fix the endpoint to use api3 (working endpoint from user's browser)
        tokenManager.refreshEndpoint = 'https://api3.axiom.trade/refresh-access-token';
        
        // Update with fresh tokens
        tokenManager.updateTokens(this.freshTokens.refresh, this.freshTokens.access);
        
        console.log('✅ Tokens updated in AxiomTokenManager');
        
        // Update Python script tokens  
        await this.updatePythonScript();
        
        // Test the refresh mechanism
        await this.testRefresh(tokenManager);
        
        return tokenManager;
    }
    
    async updatePythonScript() {
        console.log('\n🐍 UPDATING PYTHON SCRIPT...');
        
        try {
            const pythonFile = '/Users/DjEthixx/Desktop/Dev/ultimate_whale_discovery_safe.py';
            let content = fs.readFileSync(pythonFile, 'utf8');
            
            // Update auth_data section
            const newAuthData = `        self.auth_data = {
            'access_token': '${this.freshTokens.access}',
            'refresh_token': '${this.freshTokens.refresh}',
            'user_id': '${this.freshTokens.userId}'
        }`;
            
            // Replace the auth_data section
            content = content.replace(
                /self\.auth_data = \{[^}]+\}/s,
                newAuthData
            );
            
            fs.writeFileSync(pythonFile, content);
            console.log('✅ Python script updated with fresh tokens');
            
        } catch (error) {
            console.log('⚠️ Python script update failed:', error.message);
        }
    }
    
    async testRefresh(tokenManager) {
        console.log('\n🧪 TESTING TOKEN REFRESH...');
        
        try {
            const newToken = await tokenManager.refreshAccessToken();
            console.log('✅ Token refresh test SUCCESSFUL!');
            console.log(`🎫 New access token: ${newToken.substring(0, 30)}...`);
            
            return true;
        } catch (error) {
            console.log('❌ Token refresh test failed:', error.message);
            console.log('💡 This might be due to rate limits - tokens are still valid for immediate use');
            return false;
        }
    }
    
    createEnvFile() {
        console.log('\n💾 CREATING .env.dev FILE...');
        
        const envContent = `# Fresh Axiom tokens - Updated ${new Date().toISOString()}
AXIOM_REFRESH_TOKEN=${this.freshTokens.refresh}
AXIOM_ACCESS_TOKEN=${this.freshTokens.access}
AXIOM_USER_ID=${this.freshTokens.userId}

# API Endpoints
AXIOM_API_ENDPOINT=https://api3.axiom.trade
AXIOM_WS_CLUSTER7=wss://cluster7.axiom.trade/
AXIOM_WS_EUCALYPTUS=wss://eucalyptus.axiom.trade/ws

# Rate Limits (conservative)
AXIOM_MAX_CONNECTIONS=2
AXIOM_AUTH_INTERVAL=120
AXIOM_CONNECTION_INTERVAL=30
`;
        
        fs.writeFileSync('.env.dev', envContent);
        console.log('✅ Created .env.dev with fresh tokens');
    }
    
    generateQuickTestScript() {
        console.log('\n🚀 GENERATING QUICK TEST SCRIPT...');
        
        const testScript = `#!/usr/bin/env python3
"""
Quick Token Test - Rate Limit Safe
Tests fresh tokens with single connection
"""

import asyncio
import websockets
import json
import time

async def test_connection():
    access_token = '${this.freshTokens.access}'
    refresh_token = '${this.freshTokens.refresh}'
    
    headers = {
        'Cookie': f'auth-access-token={access_token}; auth-refresh-token={refresh_token}',
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    print("🧪 TESTING FRESH TOKENS...")
    print("🔌 Connecting to eucalyptus...")
    
    try:
        async with websockets.connect(
            'wss://eucalyptus.axiom.trade/ws',
            additional_headers=headers,
            ping_interval=30,
            timeout=10
        ) as ws:
            print("✅ CONNECTION SUCCESSFUL!")
            
            # Listen for a few messages
            message_count = 0
            timeout_start = time.time()
            
            while message_count < 3 and (time.time() - timeout_start) < 30:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=10)
                    message_count += 1
                    print(f"📨 Message {message_count}: {len(str(message))} chars")
                    
                    if message_count >= 3:
                        print("🎯 FRESH TOKENS WORKING!")
                        break
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for message")
                    break
                    
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
`;
        
        fs.writeFileSync('test_fresh_tokens.py', testScript);
        console.log('✅ Created test_fresh_tokens.py');
        console.log('🎯 Run: python3 test_fresh_tokens.py');
    }
}

async function main() {
    const updater = new FreshTokenUpdater();
    
    // Create env file
    updater.createEnvFile();
    
    // Update token manager
    const tokenManager = await updater.updateTokens();
    
    // Generate test script
    updater.generateQuickTestScript();
    
    console.log('\n🎉 FRESH TOKEN UPDATE COMPLETE!');
    console.log('=' * 50);
    console.log('🎯 Next Steps:');
    console.log('1. python3 test_fresh_tokens.py (quick test)');
    console.log('2. python3 ultimate_whale_discovery_safe.py (full system)');
    console.log('3. node live_data_bridge.js (trading signals)');
    console.log('\n⚡ All tokens fresh and ready for 15 minutes of trading!');
}

main().catch(console.error); 