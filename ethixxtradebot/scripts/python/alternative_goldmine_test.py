#!/usr/bin/env python3
"""
Alternative Goldmine Test
Test ALL alternative endpoints to bypass cluster7 and get trading data
"""

import asyncio
import json
import time
import logging
import websockets
import aiohttp
from datetime import datetime

class AlternativeGoldmineTest:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Fresh auth tokens
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        # Alternative endpoints
        self.alternatives = {
            'astralane_gateway': 'wss://axiom-akl.gateway.astralane.io/ws',
            'pulse_stream': 'wss://api.axiom.trade/pulse/stream',
            'pulse_live_ws': 'wss://api.axiom.trade/pulse/live',
            'pulse_live_http': 'https://api.axiom.trade/pulse/live'
        }
        
        self.results = {}
        
    async def test_all_alternatives(self):
        """Test all alternative endpoints for trading data"""
        
        self.logger.info("🔍 ALTERNATIVE GOLDMINE DISCOVERY")
        self.logger.info("Testing alternatives to cluster7...")
        self.logger.info("=" * 60)
        
        # Test each alternative
        tasks = []
        for name, endpoint in self.alternatives.items():
            if endpoint.startswith('wss://'):
                tasks.append(self.test_websocket_endpoint(name, endpoint))
            elif endpoint.startswith('https://'):
                tasks.append(self.test_http_endpoint(name, endpoint))
        
        # Run all tests in parallel
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Generate report
        await self.generate_alternatives_report()
        
    async def test_websocket_endpoint(self, name, endpoint):
        """Test a WebSocket endpoint"""
        
        self.logger.info(f"\n🧪 TESTING: {name}")
        self.logger.info(f"📡 URL: {endpoint}")
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        try:
            async with websockets.connect(
                endpoint,
                additional_headers=headers,
                ping_interval=30,
                close_timeout=5
            ) as ws:
                self.logger.info(f"✅ {name}: CONNECTED!")
                
                # Try sending subscriptions if needed
                if 'astralane' in name:
                    await self.test_astralane_subscriptions(ws, name)
                elif 'pulse' in name:
                    await self.test_pulse_subscriptions(ws, name)
                
                # Listen for data
                messages_received = await self.listen_for_data(ws, name, max_messages=10, timeout=15)
                
                self.results[name] = {
                    'status': 'success',
                    'connected': True,
                    'messages_received': messages_received,
                    'endpoint': endpoint
                }
                
                self.logger.info(f"🎯 {name}: {messages_received} messages received!")
                
        except Exception as e:
            self.logger.error(f"❌ {name} failed: {e}")
            self.results[name] = {
                'status': 'failed',
                'connected': False,
                'error': str(e),
                'endpoint': endpoint
            }
    
    async def test_http_endpoint(self, name, endpoint):
        """Test an HTTP/REST endpoint"""
        
        self.logger.info(f"\n🧪 TESTING: {name}")
        self.logger.info(f"📡 URL: {endpoint}")
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint, headers=headers, timeout=10) as response:
                    self.logger.info(f"📊 {name}: HTTP {response.status}")
                    
                    if response.status == 200:
                        content_type = response.headers.get('content-type', '')
                        
                        if 'json' in content_type:
                            data = await response.json()
                            self.logger.info(f"✅ {name}: JSON response ({len(str(data))} chars)")
                            
                            self.results[name] = {
                                'status': 'success',
                                'http_status': response.status,
                                'content_type': content_type,
                                'data_size': len(str(data)),
                                'endpoint': endpoint
                            }
                            
                        elif 'stream' in content_type or 'text' in content_type:
                            # Try reading streaming data
                            chunks_read = 0
                            async for chunk in response.content.iter_chunked(1024):
                                chunks_read += 1
                                if chunks_read >= 5:  # Read first 5 chunks
                                    break
                                    
                            self.logger.info(f"✅ {name}: Streaming response ({chunks_read} chunks)")
                            
                            self.results[name] = {
                                'status': 'success',
                                'http_status': response.status,
                                'content_type': content_type,
                                'chunks_read': chunks_read,
                                'endpoint': endpoint
                            }
                    else:
                        self.logger.error(f"❌ {name}: HTTP {response.status}")
                        self.results[name] = {
                            'status': 'failed',
                            'http_status': response.status,
                            'endpoint': endpoint
                        }
                        
        except Exception as e:
            self.logger.error(f"❌ {name} failed: {e}")
            self.results[name] = {
                'status': 'failed',
                'error': str(e),
                'endpoint': endpoint
            }
    
    async def test_astralane_subscriptions(self, ws, name):
        """Test Astralane gateway subscriptions"""
        
        self.logger.info(f"📤 {name}: Testing Astralane subscriptions...")
        
        subscriptions = [
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "subscribe", "channel": "new_pairs"},
            {"action": "subscribe", "channel": "trading_feed"},
            {"action": "subscribe", "channel": "whale_activity"}
        ]
        
        for sub in subscriptions:
            try:
                await ws.send(json.dumps(sub))
                await asyncio.sleep(0.5)
            except Exception as e:
                self.logger.error(f"❌ {name} subscription error: {e}")
    
    async def test_pulse_subscriptions(self, ws, name):
        """Test Pulse stream subscriptions"""
        
        self.logger.info(f"📤 {name}: Testing Pulse subscriptions...")
        
        subscriptions = [
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "subscribe", "feed": "live"},
            {"action": "subscribe", "feed": "trending"},
            {"action": "subscribe", "feed": "new_tokens"}
        ]
        
        for sub in subscriptions:
            try:
                await ws.send(json.dumps(sub))
                await asyncio.sleep(0.5)
            except Exception as e:
                self.logger.error(f"❌ {name} subscription error: {e}")
    
    async def listen_for_data(self, ws, name, max_messages=10, timeout=15):
        """Listen for incoming data from WebSocket"""
        
        self.logger.info(f"👂 {name}: Listening for data...")
        
        messages_received = 0
        start_time = time.time()
        
        while messages_received < max_messages and (time.time() - start_time) < timeout:
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=5)
                messages_received += 1
                
                timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                self.logger.info(f"📨 [{timestamp}] {name} #{messages_received}")
                
                # Try to parse and analyze the message
                try:
                    data = json.loads(str(message))
                    
                    if isinstance(data, dict):
                        if 'new_pairs' in str(data) or 'token' in str(data).lower():
                            self.logger.info(f"🎯 {name}: POTENTIAL TRADING DATA!")
                            
                        if 'room' in data and data.get('room') == 'new_pairs':
                            self.logger.info(f"🏆 {name}: NEW_PAIRS MESSAGE FOUND!")
                            
                    elif isinstance(data, list) and len(data) > 10:
                        self.logger.info(f"📊 {name}: Large data array ({len(data)} items)")
                        
                except:
                    preview = str(message)[:100]
                    self.logger.info(f"    {name} data: {preview}...")
                
                if messages_received >= 3 and 'potential trading data' in str(data).lower():
                    self.logger.info(f"🎉 {name}: EARLY SUCCESS! Found trading data!")
                    break
                    
            except asyncio.TimeoutError:
                if messages_received > 0:
                    break
                else:
                    self.logger.info(f"⏰ {name}: No data received in timeout")
                    break
            except Exception as e:
                self.logger.error(f"❌ {name} listen error: {e}")
                break
        
        return messages_received
    
    async def generate_alternatives_report(self):
        """Generate a report of all tested alternatives"""
        
        self.logger.info("\n" + "=" * 60)
        self.logger.info("📊 ALTERNATIVE ENDPOINTS REPORT")
        self.logger.info("=" * 60)
        
        successful_alternatives = []
        
        for name, result in self.results.items():
            status = result.get('status', 'unknown')
            endpoint = result.get('endpoint', '')
            
            if status == 'success':
                self.logger.info(f"✅ {name}: SUCCESS")
                self.logger.info(f"    Endpoint: {endpoint}")
                
                if 'messages_received' in result:
                    messages = result['messages_received']
                    self.logger.info(f"    Messages: {messages}")
                    if messages > 0:
                        successful_alternatives.append(name)
                        
                if 'http_status' in result:
                    self.logger.info(f"    HTTP Status: {result['http_status']}")
                    if result['http_status'] == 200:
                        successful_alternatives.append(name)
                
            else:
                self.logger.info(f"❌ {name}: FAILED")
                self.logger.info(f"    Endpoint: {endpoint}")
                error = result.get('error', 'Unknown error')
                self.logger.info(f"    Error: {error}")
        
        self.logger.info(f"\n🎯 SUCCESSFUL ALTERNATIVES: {len(successful_alternatives)}")
        
        if successful_alternatives:
            self.logger.info("🏆 CLUSTER7 ALTERNATIVES FOUND:")
            for alt in successful_alternatives:
                self.logger.info(f"   • {alt}: {self.results[alt]['endpoint']}")
            
            self.logger.info("\n🚀 RECOMMENDATION:")
            best_alternative = successful_alternatives[0]
            self.logger.info(f"   Use {best_alternative} as cluster7 replacement!")
            self.logger.info(f"   Endpoint: {self.results[best_alternative]['endpoint']}")
            
        else:
            self.logger.info("🤔 No successful alternatives found")
            self.logger.info("💡 Next steps:")
            self.logger.info("   1. Focus on working Eucalyptus connection")
            self.logger.info("   2. Investigate browser session replication")
            self.logger.info("   3. Try different authentication methods")

async def main():
    print("🔍 TESTING ALL CLUSTER7 ALTERNATIVES")
    print("=" * 50)
    print("🎯 Goal: Find working alternative to cluster7")
    print("📡 Testing: Astralane gateway, Pulse streams, HTTP APIs")
    print("")
    
    tester = AlternativeGoldmineTest()
    await tester.test_all_alternatives()

if __name__ == "__main__":
    asyncio.run(main()) 