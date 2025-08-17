#!/usr/bin/env python3
"""
Fresh Token Cluster7 Test
Using the FRESH access token from browser to test cluster7 connection
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class FreshTokenCluster7Test:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # FRESH tokens from browser (iat: 1755144421)
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ0NDIxLCJleHAiOjE3NTUxNDUzODF9.njjzMD2NL6_CWGPbU8a8ziYN0j2ptAysrhiBQhHzKd8',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
    async def test_fresh_cluster7(self):
        """Test cluster7 with fresh browser token"""
        
        self.logger.info("🔥 FRESH TOKEN CLUSTER7 TEST")
        self.logger.info("Using browser's fresh access token (iat: 1755144421)")
        self.logger.info("=" * 60)
        
        # Exact browser headers
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        try:
            self.logger.info("🔌 Connecting to cluster7 with FRESH token...")
            self.logger.info("📡 URL: wss://cluster7.axiom.trade/?")
            
            async with websockets.connect(
                'wss://cluster7.axiom.trade/?',
                additional_headers=headers,
                ping_interval=30,
                close_timeout=10
            ) as ws:
                self.logger.info("✅ CLUSTER7 CONNECTED WITH FRESH TOKEN!")
                self.logger.info("🎯 The issue was EXPIRED TOKENS!")
                
                # Send exact working subscriptions
                await self.send_working_subscriptions(ws)
                
                # Listen for goldmine data
                await self.listen_for_goldmine(ws)
                
        except Exception as e:
            self.logger.error(f"❌ Fresh token cluster7 failed: {e}")
            self.logger.info("\n💡 If still 401, the browser token might be:")
            self.logger.info("   1. Already expired (15min lifespan)")
            self.logger.info("   2. Session-bound (needs browser context)")
            self.logger.info("   3. Rate limited from previous attempts")
            return False
        
        return True
    
    async def send_working_subscriptions(self, ws):
        """Send the exact subscription sequence that worked at 13:21:10"""
        
        self.logger.info("📤 Sending proven working subscriptions...")
        
        subscriptions = [
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "authenticate", "access_token": self.auth_data["access_token"]},
            {"auth": {"access_token": self.auth_data["access_token"], "user_id": self.auth_data["user_id"]}},
            {"action": "join", "room": "new_pairs"},
            {"action": "join", "room": f"v:{self.auth_data['user_id']}"},
            {"action": "join", "room": "whale_feed"},
            {"action": "join", "room": "token_updates"},
            {"action": "join", "room": "all_pairs"},
            {"action": "join", "room": "new_tokens"}
        ]
        
        for i, sub in enumerate(subscriptions):
            try:
                await ws.send(json.dumps(sub))
                self.logger.info(f"📤 Subscription #{i}: {sub.get('action', sub.get('type'))}")
                await asyncio.sleep(1)
            except Exception as e:
                self.logger.error(f"❌ Subscription error: {e}")
        
        self.logger.info("📡 Listening for new_pairs goldmine...")
    
    async def listen_for_goldmine(self, ws):
        """Listen for the trading goldmine data"""
        
        self.logger.info("🏆 LISTENING FOR CLUSTER7 GOLDMINE...")
        
        message_count = 0
        new_pairs_found = 0
        start_time = time.time()
        
        while message_count < 20 and (time.time() - start_time) < 60:
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=10)
                message_count += 1
                
                timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                self.logger.info(f"📨 [{timestamp}] cluster7 #{message_count}")
                
                # Look for new_pairs messages (the goldmine!)
                try:
                    data = json.loads(str(message))
                    
                    if isinstance(data, dict) and data.get("room") == "new_pairs":
                        new_pairs_found += 1
                        self.logger.info(f"🎯 CLUSTER7 GOLDMINE! NEW_PAIRS MESSAGE #{new_pairs_found}")
                        
                        content = data.get("content", {})
                        if isinstance(content, dict):
                            token_name = content.get('token_name', 'Unknown')
                            token_ticker = content.get('token_ticker', 'UNKNOWN')
                            liquidity = content.get('initial_liquidity_sol', 0)
                            
                            self.logger.info(f"🪙 Token: {token_ticker} ({token_name})")
                            self.logger.info(f"💰 Liquidity: {liquidity} SOL")
                            self.logger.info("🏆 CLUSTER7 TRADING GOLDMINE CONFIRMED!")
                        
                    elif isinstance(data, list) and len(data) > 20:
                        self.logger.info(f"📊 Large data array: {len(data)} elements")
                        
                except:
                    preview = str(message)[:200]
                    self.logger.info(f"    Preview: {preview}...")
                
                if new_pairs_found >= 3:
                    self.logger.info(f"🎉 SUCCESS! Found {new_pairs_found} new_pairs messages!")
                    self.logger.info("🏆 CLUSTER7 GOLDMINE UNLOCKED!")
                    break
                    
            except asyncio.TimeoutError:
                self.logger.info("⏰ No message in 10s")
                if message_count > 0:
                    break
                else:
                    self.logger.info("⚠️ No data received - might need to wait longer")
                    break
        
        self.logger.info(f"\n📊 CLUSTER7 RESULTS:")
        self.logger.info(f"   📨 Messages received: {message_count}")
        self.logger.info(f"   🎯 New pairs found: {new_pairs_found}")
        self.logger.info(f"   ⏰ Duration: {time.time() - start_time:.1f}s")
        
        return new_pairs_found > 0

async def main():
    print("🔥 TESTING CLUSTER7 WITH FRESH BROWSER TOKEN")
    print("=" * 50)
    print("🎯 Theory: Our 401 errors were from EXPIRED tokens")
    print("🔑 Using: iat=1755144421 (fresh from browser)")
    print("")
    
    tester = FreshTokenCluster7Test()
    success = await tester.test_fresh_cluster7()
    
    if success:
        print("\n🎉 CLUSTER7 GOLDMINE UNLOCKED!")
    else:
        print("\n🤔 Still investigating...")

if __name__ == "__main__":
    asyncio.run(main()) 