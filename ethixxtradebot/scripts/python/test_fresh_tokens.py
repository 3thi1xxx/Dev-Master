#!/usr/bin/env python3
"""
Quick Token Test - Rate Limit Safe
Tests fresh tokens with single connection
"""

import asyncio
import websockets
import json
import time

async def test_connection():
    access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ'
    refresh_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic'
    
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
