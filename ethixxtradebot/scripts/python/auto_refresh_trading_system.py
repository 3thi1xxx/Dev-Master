#!/usr/bin/env python3
"""
Auto-Refresh Trading System
Complete trading system with automatic token refresh - NO MORE MANUAL UPDATES!
"""

import asyncio
import json
import time
import logging
import websockets
import aiohttp
import re
from datetime import datetime

class AutoRefreshTradingSystem:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # LATEST tokens from your browser (iat: 1755145600)
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ1NjAwLCJleHAiOjE3NTUxNDY1NjB9.7Q78_K39i6SKd3r51_q84Bn022c4y_MfYkYk9ysrS_g',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        self.last_refresh = time.time()
        self.refresh_endpoint = 'https://api8.axiom.trade/refresh-access-token'
        self.running = False
        
        # Trading metrics
        self.metrics = {
            'token_refreshes': 0,
            'cluster7_signals': 0,
            'trades_executed': 0,
            'auto_refresh_success': 0,
            'start_time': time.time()
        }
        
    async def start_auto_refresh_system(self):
        """Start the complete auto-refresh trading system"""
        
        self.logger.info("🚀 AUTO-REFRESH TRADING SYSTEM STARTING")
        self.logger.info("=" * 60)
        self.logger.info("🔄 Auto token refresh: ENABLED")
        self.logger.info("🏆 cluster7 goldmine: ENABLED") 
        self.logger.info("📈 Hyperliquid feeds: ENABLED")
        self.logger.info("⚡ No manual token updates needed!")
        self.logger.info("=" * 60)
        
        self.running = True
        
        # Start all systems in parallel
        tasks = [
            self.auto_refresh_manager(),
            self.cluster7_goldmine_with_refresh(),
            self.hyperliquid_trading_signals(),
            self.performance_monitor()
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 System shutdown requested")
            self.running = False
    
    async def auto_refresh_manager(self):
        """Automatically refresh tokens every 13 minutes"""
        
        self.logger.info("🔄 Auto-refresh manager started")
        
        while self.running:
            try:
                # Refresh every 13 minutes (tokens expire in 15)
                await asyncio.sleep(13 * 60)
                
                if self.running:
                    await self.refresh_access_token()
                    
            except Exception as e:
                self.logger.error(f"❌ Auto-refresh error: {e}")
                await asyncio.sleep(60)  # Retry in 1 minute
    
    async def refresh_access_token(self):
        """Refresh access token using the exact browser method"""
        
        self.logger.info("🔄 Refreshing access token...")
        
        headers = {
            'Cookie': f'auth-refresh-token={self.auth_data["refresh_token"]}; auth-access-token={self.auth_data["access_token"]}',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://axiom.trade',
            'Referer': 'https://axiom.trade/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Content-Length': '0'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.refresh_endpoint, headers=headers) as response:
                    
                    if response.status == 200:
                        # Extract new access token from set-cookie header
                        set_cookies = response.headers.getall('set-cookie', [])
                        
                        for cookie in set_cookies:
                            if 'auth-access-token=' in cookie:
                                # Extract token from set-cookie
                                match = re.search(r'auth-access-token=([^;]+)', cookie)
                                if match:
                                    new_access_token = match.group(1)
                                    old_token = self.auth_data['access_token'][:20] + "..."
                                    
                                    self.auth_data['access_token'] = new_access_token
                                    self.last_refresh = time.time()
                                    self.metrics['token_refreshes'] += 1
                                    self.metrics['auto_refresh_success'] += 1
                                    
                                    self.logger.info("✅ Access token refreshed successfully!")
                                    self.logger.info(f"   Old: {old_token}")
                                    self.logger.info(f"   New: {new_access_token[:20]}...")
                                    return True
                        
                        self.logger.error("❌ No access token in response")
                        return False
                        
                    else:
                        self.logger.error(f"❌ Token refresh failed: HTTP {response.status}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"❌ Token refresh error: {e}")
            return False
    
    async def cluster7_goldmine_with_refresh(self):
        """Connect to cluster7 with automatic token refresh on 401"""
        
        self.logger.info("🏆 Starting cluster7 goldmine with auto-refresh...")
        
        while self.running:
            try:
                await self.connect_cluster7_with_retries()
                
            except Exception as e:
                self.logger.error(f"❌ cluster7 goldmine error: {e}")
                if self.running:
                    self.logger.info("🔄 Retrying cluster7 in 30s...")
                    await asyncio.sleep(30)
    
    async def connect_cluster7_with_retries(self):
        """Connect to cluster7 with automatic 401 handling"""
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries and self.running:
            headers = {
                'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
                'Origin': 'https://axiom.trade',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
            }
            
            try:
                async with websockets.connect(
                    'wss://cluster7.axiom.trade/?',
                    additional_headers=headers,
                    ping_interval=30
                ) as ws:
                    self.logger.info("✅ cluster7 GOLDMINE connected!")
                    retry_count = 0  # Reset retry count on success
                    
                    # Send subscriptions
                    await self.subscribe_cluster7_goldmine(ws)
                    
                    # Process goldmine data with auto-refresh on disconnect
                    await self.process_cluster7_with_refresh(ws)
                    
            except websockets.exceptions.InvalidStatusCode as e:
                if e.status_code == 401:
                    self.logger.warning("⚠️ cluster7 401 - refreshing token...")
                    refresh_success = await self.refresh_access_token()
                    
                    if refresh_success:
                        retry_count += 1
                        self.logger.info(f"🔄 Retrying cluster7 connection (attempt {retry_count}/{max_retries})")
                        await asyncio.sleep(2)
                        continue
                    else:
                        self.logger.error("❌ Token refresh failed, waiting longer...")
                        await asyncio.sleep(60)
                        break
                else:
                    self.logger.error(f"❌ cluster7 connection error: HTTP {e.status_code}")
                    break
                    
            except Exception as e:
                self.logger.error(f"❌ cluster7 connection error: {e}")
                break
        
        if retry_count >= max_retries:
            self.logger.error("❌ cluster7 max retries exceeded")
    
    async def subscribe_cluster7_goldmine(self, ws):
        """Subscribe to cluster7 new_pairs goldmine"""
        
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
        
        for sub in subscriptions:
            await ws.send(json.dumps(sub))
            await asyncio.sleep(0.5)
    
    async def process_cluster7_with_refresh(self, ws):
        """Process cluster7 data with connection monitoring"""
        
        self.logger.info("🏆 Processing cluster7 GOLDMINE data...")
        
        try:
            async for message in ws:
                data = json.loads(message)
                
                if isinstance(data, dict) and data.get("room") == "new_pairs":
                    await self.handle_goldmine_signal(data)
                    
        except websockets.exceptions.ConnectionClosed:
            self.logger.warning("⚠️ cluster7 connection closed - will reconnect")
        except Exception as e:
            self.logger.error(f"❌ cluster7 processing error: {e}")
    
    async def handle_goldmine_signal(self, data):
        """Handle new_pairs goldmine signals"""
        
        self.metrics['cluster7_signals'] += 1
        
        content = data.get('content', {})
        token_name = content.get('token_name', 'Unknown')
        token_ticker = content.get('token_ticker', 'UNKNOWN') 
        liquidity = content.get('initial_liquidity_sol', 0)
        
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        self.logger.info(f"🎯 [{timestamp}] GOLDMINE: {token_ticker} ({token_name}) - {liquidity} SOL")
        
        # Simple confidence calculation
        confidence = 50 + min(liquidity, 50)  # 50-100% based on liquidity
        
        if confidence >= 75:
            self.logger.info(f"🚀 HIGH CONFIDENCE GOLDMINE: {token_ticker} ({confidence:.1f}%)")
            await self.execute_simulated_trade(token_ticker, liquidity, confidence)
    
    async def execute_simulated_trade(self, token, liquidity, confidence):
        """Execute simulated trade (ready for real execution)"""
        
        self.metrics['trades_executed'] += 1
        
        trade_size = min(0.1 + (liquidity / 1000), 0.5)  # 0.1-0.5 SOL
        
        self.logger.info(f"⚡ EXECUTING TRADE: {token}")
        self.logger.info(f"   💰 Size: {trade_size:.3f} SOL")
        self.logger.info(f"   🎯 Confidence: {confidence:.1f}%")
        self.logger.info(f"   📊 Trade #{self.metrics['trades_executed']}")
        
        # Here you would call your JavaScript trading infrastructure
        # await self.call_javascript_trader(token, trade_size, confidence)
    
    async def hyperliquid_trading_signals(self):
        """Hyperliquid derivatives signals (no auth needed)"""
        
        self.logger.info("📈 Starting Hyperliquid trading signals...")
        
        while self.running:
            try:
                async with websockets.connect('wss://api.hyperliquid.xyz/ws') as ws:
                    self.logger.info("✅ Hyperliquid connected!")
                    
                    # Subscribe to BTC derivatives
                    await ws.send(json.dumps({"method": "subscribe", "subscription": {"type": "trades", "coin": "BTC"}}))
                    
                    async for message in ws:
                        data = json.loads(message)
                        
                        if data.get('channel') == 'trades':
                            await self.process_hyperliquid_trades(data)
                            
            except Exception as e:
                self.logger.error(f"❌ Hyperliquid error: {e}")
                if self.running:
                    await asyncio.sleep(10)
    
    async def process_hyperliquid_trades(self, data):
        """Process Hyperliquid derivatives trades"""
        
        trades = data.get('data', {}).get('trades', [])
        
        for trade in trades[:3]:  # Process first 3 trades
            size = float(trade.get('sz', 0))
            price = float(trade.get('px', 0))
            
            if size > 5.0:  # Large derivative trade
                self.logger.info(f"📈 Hyperliquid large trade: {size:.1f} BTC @ ${price:.0f}")
                
                # Correlation with spot markets could trigger additional signals
                if size > 20.0:
                    self.logger.info(f"🔥 MASSIVE Hyperliquid trade - potential spot correlation!")
    
    async def performance_monitor(self):
        """Monitor system performance and token status"""
        
        while self.running:
            try:
                await asyncio.sleep(60)  # Report every minute
                
                uptime = time.time() - self.metrics['start_time']
                time_since_refresh = time.time() - self.last_refresh
                
                self.logger.info("\n" + "=" * 50)
                self.logger.info("📊 AUTO-REFRESH TRADING SYSTEM STATUS")
                self.logger.info("=" * 50)
                self.logger.info(f"⏰ Uptime: {uptime/60:.1f} minutes")
                self.logger.info(f"🔄 Token refreshes: {self.metrics['token_refreshes']}")
                self.logger.info(f"✅ Refresh success rate: {self.metrics['auto_refresh_success']}/{self.metrics['token_refreshes'] or 1}")
                self.logger.info(f"🏆 cluster7 signals: {self.metrics['cluster7_signals']}")
                self.logger.info(f"⚡ Trades executed: {self.metrics['trades_executed']}")
                self.logger.info(f"🕐 Last refresh: {time_since_refresh/60:.1f} min ago")
                
                # Token expiry warning
                if time_since_refresh > 12 * 60:  # 12 minutes
                    self.logger.warning(f"⚠️ Token refresh due soon! ({time_since_refresh/60:.1f} min ago)")
                
                self.logger.info("=" * 50 + "\n")
                
            except Exception as e:
                self.logger.error(f"❌ Performance monitor error: {e}")

async def main():
    print("🚀 AUTO-REFRESH TRADING SYSTEM")
    print("=" * 50)
    print("🔄 NEVER manually update tokens again!")
    print("🏆 cluster7 goldmine with auto-refresh")
    print("📈 Hyperliquid derivatives feeds") 
    print("⚡ Automatic trade execution ready")
    print("=" * 50)
    print("")
    
    system = AutoRefreshTradingSystem()
    await system.start_auto_refresh_system()

if __name__ == "__main__":
    asyncio.run(main()) 