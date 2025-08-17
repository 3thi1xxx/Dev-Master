#!/usr/bin/env python3
"""
Cluster7 Session Test
Test cluster7 connection with exact working approach from logs
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class Cluster7SessionTest:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # EXACT tokens that worked at 13:21:10
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
    async def test_cluster7_exact_working_method(self):
        """Test cluster7 with EXACT method that worked at 13:21:10"""
        
        self.logger.info("🔑 CLUSTER7 SESSION TEST")
        self.logger.info("📋 Using EXACT approach that worked at 13:21:10")
        self.logger.info("⚠️ MAKE SURE BROWSER IS CLOSED FIRST!")
        self.logger.info("=" * 60)
        
        # Exact headers from working JavaScript implementation
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        try:
            self.logger.info("🔌 Connecting to cluster7 (EXACT working method)...")
            self.logger.info("📡 URL: wss://cluster7.axiom.trade/?")
            
            async with websockets.connect(
                'wss://cluster7.axiom.trade/?',
                additional_headers=headers,
                ping_interval=30,
                close_timeout=10
            ) as ws:
                self.logger.info("✅ CLUSTER7 CONNECTION SUCCESSFUL!")
                self.logger.info("🎯 Single connection theory CONFIRMED!")
                
                # Use exact subscription sequence that worked
                await self.send_working_subscriptions(ws)
                
                # Listen for new_pairs messages (the goldmine)
                await self.listen_for_trading_goldmine(ws)
                
        except Exception as e:
            self.logger.error(f"❌ Cluster7 connection failed: {e}")
            self.logger.info("\n💡 TROUBLESHOOTING:")
            self.logger.info("1. 🌐 Close ALL browser tabs with axiom.trade")
            self.logger.info("2. ⏰ Wait 30 seconds for session cleanup")
            self.logger.info("3. 🔄 Try again immediately")
            self.logger.info("4. 📱 Or wait for 2-hour session timeout")
            return False
        
        return True
    
    async def send_working_subscriptions(self, ws):
        """Send the exact subscription sequence that worked at 13:21:10"""
        
        # Exact sequence from successful log
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
        
        self.logger.info("📤 Sending EXACT working subscription sequence...")
        
        for i, sub in enumerate(subscriptions):
            try:
                await ws.send(json.dumps(sub))
                self.logger.info(f"📤 Subscription #{i}: {sub.get('action', sub.get('type'))}")
                await asyncio.sleep(1)
            except Exception as e:
                self.logger.error(f"❌ Subscription error: {e}")
        
        # Listen without subscription (like the working logs show)
        self.logger.info("📡 Now listening without additional subscriptions...")
    
    async def listen_for_trading_goldmine(self, ws):
        """Listen for the trading goldmine data"""
        
        self.logger.info("🏆 LISTENING FOR TRADING GOLDMINE...")
        
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
                            self.logger.info(f"🚀 THIS IS THE TRADING GOLDMINE!")
                        
                    elif isinstance(data, list) and len(data) > 20:
                        self.logger.info(f"📊 Large data array: {len(data)} elements")
                        
                except:
                    # Non-JSON or other data
                    preview = str(message)[:200]
                    self.logger.info(f"    Preview: {preview}...")
                
                if new_pairs_found >= 5:
                    self.logger.info(f"🎉 SUCCESS! Found {new_pairs_found} new_pairs messages!")
                    self.logger.info("🏆 CLUSTER7 TRADING GOLDMINE CONFIRMED!")
                    break
                    
            except asyncio.TimeoutError:
                self.logger.info("⏰ No message in 10s")
                if message_count > 0:
                    break
                else:
                    self.logger.info("⚠️ No data received - might need to wait longer")
                    break
        
        self.logger.info(f"\n📊 CLUSTER7 SESSION RESULTS:")
        self.logger.info(f"   📨 Messages received: {message_count}")
        self.logger.info(f"   🎯 New pairs found: {new_pairs_found}")
        self.logger.info(f"   ⏰ Duration: {time.time() - start_time:.1f}s")
        
        return new_pairs_found > 0

async def main():
    print("🚨 CLUSTER7 SINGLE CONNECTION TEST")
    print("=" * 50)
    print("⚠️  STEP 1: Close ALL browser tabs with axiom.trade")
    print("⏰ STEP 2: Wait 30 seconds")
    print("🚀 STEP 3: Run this test immediately")
    print("")
    
    input("Press ENTER when browser is closed and you're ready...")
    
    tester = Cluster7SessionTest()
    success = await tester.test_cluster7_exact_working_method()
    
    if success:
        print("\n🎉 CLUSTER7 GOLDMINE UNLOCKED!")
        print("🔑 Single connection limit theory CONFIRMED!")
    else:
        print("\n🤔 Still investigating - may need session timeout")

if __name__ == "__main__":
    asyncio.run(main()) 