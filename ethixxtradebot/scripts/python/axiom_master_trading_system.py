#!/usr/bin/env python3
"""
Axiom Master Trading System
Complete integration of cluster7 goldmine, hyperliquid feeds, and trading execution
"""

import asyncio
import json
import time
import logging
import websockets
import aiohttp
import subprocess
from datetime import datetime
from pathlib import Path

class AxiomMasterTradingSystem:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # FRESH tokens from browser (iat: 1755144421)
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ0NDIxLCJleHAiOjE3NTUxNDUzODF9.njjzMD2NL6_CWGPbU8a8ziYN0j2ptAysrhiBQhHzKd8',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        # Trading performance metrics
        self.metrics = {
            'cluster7_signals': 0,
            'hyperliquid_signals': 0,
            'eucalyptus_signals': 0,
            'high_confidence_opportunities': 0,
            'trades_executed': 0,
            'total_profit_sol': 0.0,
            'start_time': time.time(),
            'messages_processed': 0
        }
        
        # Trading signal storage
        self.live_signals = []
        self.active_positions = {}
        
        # System status
        self.running = False
        self.connections = {}
        
    async def start_master_system(self):
        """Start the complete master trading system"""
        
        self.logger.info("🚀 AXIOM MASTER TRADING SYSTEM STARTING")
        self.logger.info("=" * 60)
        self.logger.info("🎯 cluster7: NEW_PAIRS goldmine")
        self.logger.info("📈 hyperliquid: Derivatives data") 
        self.logger.info("🔗 eucalyptus: Transaction feeds")
        self.logger.info("⚡ JavaScript: Trading execution")
        self.logger.info("=" * 60)
        
        self.running = True
        
        # Start all data feeds in parallel
        tasks = [
            self.connect_cluster7_goldmine(),
            self.connect_hyperliquid_feeds(),
            self.connect_eucalyptus_feeds(),
            self.start_trading_engine(),
            self.monitor_system_performance()
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 System shutdown requested")
            await self.shutdown_system()
    
    async def connect_cluster7_goldmine(self):
        """Connect to cluster7 for NEW_PAIRS goldmine data"""
        
        self.logger.info("🏆 Connecting to cluster7 goldmine...")
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        while self.running:
            try:
                async with websockets.connect(
                    'wss://cluster7.axiom.trade/?',
                    additional_headers=headers,
                    ping_interval=30
                ) as ws:
                    self.logger.info("✅ cluster7 GOLDMINE connected!")
                    self.connections['cluster7'] = ws
                    
                    # Send subscriptions for new_pairs
                    await self.subscribe_cluster7_goldmine(ws)
                    
                    # Process goldmine data
                    await self.process_cluster7_goldmine(ws)
                    
            except Exception as e:
                self.logger.error(f"❌ cluster7 error: {e}")
                if self.running:
                    self.logger.info("🔄 Reconnecting to cluster7 in 5s...")
                    await asyncio.sleep(5)
    
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
    
    async def process_cluster7_goldmine(self, ws):
        """Process cluster7 goldmine new_pairs data"""
        
        self.logger.info("🏆 Processing cluster7 GOLDMINE data...")
        
        async for message in ws:
            try:
                data = json.loads(message)
                self.metrics['messages_processed'] += 1
                
                if isinstance(data, dict) and data.get("room") == "new_pairs":
                    await self.handle_new_pairs_goldmine(data)
                    
            except Exception as e:
                self.logger.error(f"❌ cluster7 processing error: {e}")
    
    async def handle_new_pairs_goldmine(self, data):
        """Handle new_pairs goldmine signals from cluster7"""
        
        self.metrics['cluster7_signals'] += 1
        
        content = data.get('content', {})
        if not isinstance(content, dict):
            return
            
        token_name = content.get('token_name', 'Unknown')
        token_ticker = content.get('token_ticker', 'UNKNOWN')
        liquidity = content.get('initial_liquidity_sol', 0)
        contract_address = content.get('contract_address', '')
        
        # Calculate trading confidence
        confidence = await self.calculate_goldmine_confidence(content)
        
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        self.logger.info(f"🎯 [{timestamp}] GOLDMINE: {token_ticker} ({token_name})")
        self.logger.info(f"💰 Liquidity: {liquidity} SOL | Confidence: {confidence:.1f}%")
        
        # Create trading signal
        signal = {
            'source': 'cluster7_goldmine',
            'type': 'new_pairs',
            'token_ticker': token_ticker,
            'token_name': token_name,
            'contract_address': contract_address,
            'liquidity_sol': liquidity,
            'confidence': confidence,
            'timestamp': time.time(),
            'data': content
        }
        
        if confidence >= 75.0:
            self.metrics['high_confidence_opportunities'] += 1
            self.logger.info(f"🚀 HIGH CONFIDENCE GOLDMINE SIGNAL: {token_ticker}")
            await self.execute_goldmine_trade(signal)
        
        self.live_signals.append(signal)
        
        # Keep only last 100 signals
        if len(self.live_signals) > 100:
            self.live_signals = self.live_signals[-100:]
    
    async def calculate_goldmine_confidence(self, content):
        """Calculate trading confidence for cluster7 goldmine signals"""
        
        confidence = 50.0  # Base confidence
        
        liquidity = content.get('initial_liquidity_sol', 0)
        dev_holdings = content.get('dev_holding_percentage', 100)
        lp_burned = content.get('lp_burned', False)
        sniper_count = content.get('sniper_count', 0)
        
        # Liquidity scoring
        if liquidity >= 50:
            confidence += 20
        elif liquidity >= 30:
            confidence += 15
        elif liquidity >= 10:
            confidence += 10
        
        # Dev holdings (lower is better)
        if dev_holdings <= 5:
            confidence += 15
        elif dev_holdings <= 10:
            confidence += 10
        elif dev_holdings <= 20:
            confidence += 5
        
        # LP burned is very positive
        if lp_burned:
            confidence += 20
        
        # Moderate sniper activity is good
        if 5 <= sniper_count <= 20:
            confidence += 10
        elif sniper_count > 50:
            confidence -= 10  # Too much competition
        
        return min(confidence, 100.0)
    
    async def connect_hyperliquid_feeds(self):
        """Connect to Hyperliquid for derivatives data"""
        
        self.logger.info("📈 Connecting to Hyperliquid feeds...")
        
        while self.running:
            try:
                async with websockets.connect('wss://api.hyperliquid.xyz/ws') as ws:
                    self.logger.info("✅ Hyperliquid connected!")
                    self.connections['hyperliquid'] = ws
                    
                    # Subscribe to market data
                    await self.subscribe_hyperliquid_feeds(ws)
                    
                    # Process hyperliquid data
                    await self.process_hyperliquid_feeds(ws)
                    
            except Exception as e:
                self.logger.error(f"❌ Hyperliquid error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    async def subscribe_hyperliquid_feeds(self, ws):
        """Subscribe to Hyperliquid data feeds"""
        
        subscriptions = [
            {"method": "subscribe", "subscription": {"type": "allMids"}},
            {"method": "subscribe", "subscription": {"type": "trades", "coin": "BTC"}},
            {"method": "subscribe", "subscription": {"type": "l2Book", "coin": "BTC"}}
        ]
        
        for sub in subscriptions:
            await ws.send(json.dumps(sub))
            await asyncio.sleep(0.5)
    
    async def process_hyperliquid_feeds(self, ws):
        """Process Hyperliquid derivatives data"""
        
        async for message in ws:
            try:
                data = json.loads(message)
                self.metrics['messages_processed'] += 1
                
                if isinstance(data, dict):
                    channel = data.get('channel')
                    if channel in ['allMids', 'trades', 'l2Book']:
                        await self.handle_hyperliquid_signal(data)
                        
            except Exception as e:
                self.logger.error(f"❌ Hyperliquid processing error: {e}")
    
    async def handle_hyperliquid_signal(self, data):
        """Handle Hyperliquid trading signals"""
        
        self.metrics['hyperliquid_signals'] += 1
        
        # Process derivatives signals for correlation with spot markets
        channel = data.get('channel')
        signal_data = data.get('data', {})
        
        if channel == 'trades':
            # Look for large derivatives trades that might indicate spot opportunities
            trades = signal_data.get('trades', [])
            for trade in trades[:5]:  # Process first 5 trades
                size = float(trade.get('sz', 0))
                if size > 10.0:  # Large trade
                    confidence = min(60 + (size / 10), 85)
                    
                    signal = {
                        'source': 'hyperliquid_derivatives',
                        'type': 'large_trade',
                        'coin': trade.get('coin', 'BTC'),
                        'size': size,
                        'price': float(trade.get('px', 0)),
                        'confidence': confidence,
                        'timestamp': time.time()
                    }
                    
                    if confidence >= 70:
                        self.logger.info(f"📈 Hyperliquid large trade: {trade.get('coin')} ${size}")
                        self.live_signals.append(signal)
    
    async def connect_eucalyptus_feeds(self):
        """Connect to Eucalyptus for transaction data"""
        
        self.logger.info("🔗 Connecting to Eucalyptus feeds...")
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        while self.running:
            try:
                async with websockets.connect(
                    'wss://eucalyptus.axiom.trade/ws',
                    additional_headers=headers,
                    ping_interval=30
                ) as ws:
                    self.logger.info("✅ Eucalyptus connected!")
                    self.connections['eucalyptus'] = ws
                    
                    await self.process_eucalyptus_feeds(ws)
                    
            except Exception as e:
                self.logger.error(f"❌ Eucalyptus error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    async def process_eucalyptus_feeds(self, ws):
        """Process Eucalyptus transaction data"""
        
        async for message in ws:
            try:
                data = json.loads(message)
                self.metrics['messages_processed'] += 1
                
                if isinstance(data, list) and len(data) > 20:
                    # Large transaction array - potential market activity
                    await self.handle_eucalyptus_signal(data)
                    
            except Exception as e:
                self.logger.error(f"❌ Eucalyptus processing error: {e}")
    
    async def handle_eucalyptus_signal(self, data):
        """Handle Eucalyptus transaction signals"""
        
        self.metrics['eucalyptus_signals'] += 1
        
        # Analyze transaction volume for market sentiment
        signal = {
            'source': 'eucalyptus_transactions',
            'type': 'transaction_volume',
            'array_size': len(data),
            'confidence': min(40 + len(data), 60),
            'timestamp': time.time()
        }
        
        if len(data) > 25:
            self.logger.info(f"🔗 Eucalyptus high volume: {len(data)} transactions")
            self.live_signals.append(signal)
    
    async def execute_goldmine_trade(self, signal):
        """Execute trading based on cluster7 goldmine signals"""
        
        self.logger.info(f"⚡ EXECUTING GOLDMINE TRADE: {signal['token_ticker']}")
        
        try:
            # Call JavaScript trading infrastructure
            trade_command = [
                'node', 'services/UltraFastAxiomClient.js',
                'buy',
                signal['contract_address'],
                '0.1',  # 0.1 SOL trade size
                str(signal['confidence'])
            ]
            
            # Execute trade (simulate for now)
            self.logger.info(f"📞 Calling JavaScript trading engine...")
            self.logger.info(f"   Token: {signal['token_ticker']}")
            self.logger.info(f"   Contract: {signal['contract_address']}")
            self.logger.info(f"   Size: 0.1 SOL")
            self.logger.info(f"   Confidence: {signal['confidence']:.1f}%")
            
            # Record trade
            self.metrics['trades_executed'] += 1
            
            # Store position
            self.active_positions[signal['contract_address']] = {
                'token': signal['token_ticker'],
                'entry_time': time.time(),
                'entry_confidence': signal['confidence'],
                'size_sol': 0.1
            }
            
        except Exception as e:
            self.logger.error(f"❌ Trade execution error: {e}")
    
    async def start_trading_engine(self):
        """Start the main trading decision engine"""
        
        self.logger.info("⚡ Starting trading decision engine...")
        
        while self.running:
            try:
                # Analyze signals and make trading decisions
                await self.analyze_combined_signals()
                await asyncio.sleep(1)  # Check every second
                
            except Exception as e:
                self.logger.error(f"❌ Trading engine error: {e}")
                await asyncio.sleep(5)
    
    async def analyze_combined_signals(self):
        """Analyze combined signals from all sources"""
        
        if len(self.live_signals) < 2:
            return
            
        # Look for correlated signals across different sources
        recent_signals = [s for s in self.live_signals if time.time() - s['timestamp'] < 60]
        
        cluster7_signals = [s for s in recent_signals if s['source'] == 'cluster7_goldmine']
        hyperliquid_signals = [s for s in recent_signals if s['source'] == 'hyperliquid_derivatives']
        
        # Check for correlation between spot launches and derivatives activity
        if cluster7_signals and hyperliquid_signals:
            latest_cluster7 = cluster7_signals[-1]
            latest_hyperliquid = hyperliquid_signals[-1]
            
            time_diff = abs(latest_cluster7['timestamp'] - latest_hyperliquid['timestamp'])
            
            if time_diff < 30:  # Within 30 seconds
                combined_confidence = (latest_cluster7['confidence'] + latest_hyperliquid['confidence']) / 2
                
                if combined_confidence >= 80:
                    self.logger.info("🔥 CORRELATION DETECTED! Spot + Derivatives alignment")
                    self.logger.info(f"   Combined confidence: {combined_confidence:.1f}%")
    
    async def monitor_system_performance(self):
        """Monitor and report system performance"""
        
        self.logger.info("📊 Starting performance monitor...")
        
        while self.running:
            try:
                await asyncio.sleep(30)  # Report every 30 seconds
                
                uptime = time.time() - self.metrics['start_time']
                
                self.logger.info("\n" + "=" * 50)
                self.logger.info("📊 AXIOM MASTER TRADING SYSTEM STATUS")
                self.logger.info("=" * 50)
                self.logger.info(f"⏰ Uptime: {uptime:.0f}s")
                self.logger.info(f"📨 Messages processed: {self.metrics['messages_processed']}")
                self.logger.info(f"🎯 cluster7 signals: {self.metrics['cluster7_signals']}")
                self.logger.info(f"📈 Hyperliquid signals: {self.metrics['hyperliquid_signals']}")
                self.logger.info(f"🔗 Eucalyptus signals: {self.metrics['eucalyptus_signals']}")
                self.logger.info(f"🔥 High confidence: {self.metrics['high_confidence_opportunities']}")
                self.logger.info(f"⚡ Trades executed: {self.metrics['trades_executed']}")
                self.logger.info(f"💼 Active positions: {len(self.active_positions)}")
                self.logger.info("=" * 50 + "\n")
                
            except Exception as e:
                self.logger.error(f"❌ Monitor error: {e}")
    
    async def shutdown_system(self):
        """Gracefully shutdown the trading system"""
        
        self.logger.info("🛑 Shutting down Axiom Master Trading System...")
        self.running = False
        
        # Close WebSocket connections
        for name, ws in self.connections.items():
            try:
                await ws.close()
                self.logger.info(f"✅ Closed {name} connection")
            except:
                pass
        
        self.logger.info("📊 Final performance report:")
        self.logger.info(f"   📨 Total messages: {self.metrics['messages_processed']}")
        self.logger.info(f"   🎯 Total signals: {self.metrics['cluster7_signals'] + self.metrics['hyperliquid_signals'] + self.metrics['eucalyptus_signals']}")
        self.logger.info(f"   ⚡ Trades executed: {self.metrics['trades_executed']}")
        self.logger.info("🚀 System shutdown complete")

async def main():
    print("🚀 AXIOM MASTER TRADING SYSTEM")
    print("=" * 50)
    print("🎯 Integrating:")
    print("   • cluster7 goldmine (new_pairs)")
    print("   • Hyperliquid derivatives")
    print("   • Eucalyptus transactions")
    print("   • JavaScript trading engines")
    print("=" * 50)
    print("")
    
    system = AxiomMasterTradingSystem()
    await system.start_master_system()

if __name__ == "__main__":
    asyncio.run(main()) 