#!/usr/bin/env python3
"""
Test cluster7 without authentication (like browser)
"""

import asyncio
import websockets
import json
import time

async def test_cluster7_no_auth():
    print("🧪 TESTING CLUSTER7 WITHOUT AUTH...")
    print("🔌 Connecting like browser (no cookies)...")
    
    # Headers matching browser exactly (no auth cookies)
    headers = {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
        # NO COOKIES - just like browser!
    }
    
    try:
        async with websockets.connect(
            'wss://cluster7.axiom.trade/',
            additional_headers=headers,
            ping_interval=30,
            close_timeout=10
        ) as ws:
            print("✅ CLUSTER7 CONNECTION SUCCESSFUL!")
            print("🎯 No authentication needed for cluster7!")
            
            # Listen for a few messages
            message_count = 0
            timeout_start = time.time()
            
            while message_count < 3 and (time.time() - timeout_start) < 30:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=10)
                    message_count += 1
                    print(f"📨 Message {message_count}: {len(str(message))} chars")
                    print(f"    Preview: {str(message)[:100]}...")
                    
                    if message_count >= 3:
                        print("🎯 CLUSTER7 WORKING WITHOUT AUTH!")
                        break
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for message")
                    break
                    
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_cluster7_no_auth()) 