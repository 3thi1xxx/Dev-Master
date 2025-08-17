#!/usr/bin/env python3
"""
Cluster7 No-Auth Test
Connect exactly like browser - NO authentication cookies
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class Cluster7NoAuthTest:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
    async def test_cluster7_browser_style(self):
        """Test cluster7 connection exactly like browser"""
        
        self.logger.info("🧪 CLUSTER7 BROWSER-STYLE CONNECTION TEST")
        self.logger.info("🔗 NO authentication cookies (like browser)")
        self.logger.info("⚡ Auckland routing expected")
        self.logger.info("=" * 50)
        
        # Exact browser headers (NO COOKIES!)
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
            # NO COOKIE HEADER - This is the key!
        }
        
        try:
            self.logger.info("🔌 Connecting to cluster7 (browser-style)...")
            
            async with websockets.connect(
                'wss://cluster7.axiom.trade/',
                additional_headers=headers,
                ping_interval=30,
                close_timeout=10
            ) as ws:
                self.logger.info("✅ CLUSTER7 CONNECTION SUCCESSFUL!")
                self.logger.info("🎯 Browser-style connection works!")
                
                # Listen for messages without any subscriptions first
                self.logger.info("📡 Listening for auto-feed data...")
                
                message_count = 0
                start_time = time.time()
                
                while message_count < 10 and (time.time() - start_time) < 30:
                    try:
                        message = await asyncio.wait_for(ws.recv(), timeout=5)
                        message_count += 1
                        
                        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                        self.logger.info(f"📨 [{timestamp}] Cluster7 message #{message_count}")
                        
                        # Show preview
                        preview = str(message)[:200]
                        self.logger.info(f"    Preview: {preview}...")
                        
                        # Try to parse JSON
                        try:
                            data = json.loads(str(message))
                            if isinstance(data, dict):
                                self.logger.info(f"    Type: JSON - keys: {list(data.keys())}")
                            elif isinstance(data, list):
                                self.logger.info(f"    Type: Array - length: {len(data)}")
                        except:
                            self.logger.info(f"    Type: Non-JSON")
                        
                        if message_count >= 10:
                            self.logger.info("🎯 CLUSTER7 IS WORKING! Got 10 messages!")
                            break
                            
                    except asyncio.TimeoutError:
                        self.logger.info("⏰ No message in 5s, trying basic subscription...")
                        
                        # Try simple subscription
                        try:
                            simple_sub = {"action": "subscribe", "channel": "all"}
                            await ws.send(json.dumps(simple_sub))
                            self.logger.info("📤 Sent simple subscription")
                        except Exception as e:
                            self.logger.info(f"⚠️ Subscription failed: {e}")
                        
                        break
                
                if message_count > 0:
                    self.logger.info(f"\n🎉 SUCCESS! Cluster7 delivered {message_count} messages!")
                    return True
                else:
                    self.logger.info("⚠️ Connected but no messages received")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Cluster7 connection failed: {e}")
            return False

async def main():
    tester = Cluster7NoAuthTest()
    success = await tester.test_cluster7_browser_style()
    
    if success:
        print("\n🚀 CLUSTER7 SOLUTION FOUND!")
        print("✅ Connect WITHOUT authentication cookies")
        print("🎯 Ready to integrate into dual-source system")
    else:
        print("\n🤔 Still investigating cluster7 connection...")

if __name__ == "__main__":
    asyncio.run(main()) 