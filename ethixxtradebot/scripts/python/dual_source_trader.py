#!/usr/bin/env python3
"""
Dual-Source Trading System
Combines Eucalyptus (token launches) + Hyperliquid (derivatives) for maximum trading opportunities
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime
from typing import Dict, List, Optional

class DualSourceTrader:
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'dual_trader_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # FRESH working tokens for Eucalyptus
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        # Data sources
        self.sources = {
            'eucalyptus': {
                'url': 'wss://eucalyptus.axiom.trade/ws',
                'type': 'token_launches',
                'connected': False,
                'messages': 0,
                'signals': 0
            },
            'hyperliquid': {
                'url': 'wss://api.hyperliquid.xyz/ws',
                'type': 'derivatives',
                'connected': False,
                'messages': 0,
                'signals': 0
            }
        }
        
        # Trading signals from both sources
        self.trading_signals = []
        self.btc_price = 0
        self.market_data = {}
        
        # Metrics
        self.metrics = {
            'total_messages': 0,
            'total_signals': 0,
            'high_confidence_signals': 0,
            'eucalyptus_signals': 0,
            'hyperliquid_signals': 0,
            'start_time': time.time()
        }
        
        self.running = False
        
    async def start_dual_trading(self):
        """Start the dual-source trading system"""
        self.logger.info("🚀 DUAL-SOURCE TRADING SYSTEM")
        self.logger.info("🎯 Eucalyptus: Token launches & whale activity")
        self.logger.info("📈 Hyperliquid: Derivatives & large volume trades")
        self.logger.info("⚡ Both Auckland-routed for speed advantage")
        self.logger.info("=" * 60)
        
        self.running = True
        
        # Connect to both sources simultaneously
        await asyncio.gather(
            self.connect_eucalyptus(),
            self.connect_hyperliquid(),
            self.monitor_trading_opportunities(),
            return_exceptions=True
        )
    
    async def connect_eucalyptus(self):
        """Connect to Eucalyptus for token launch signals"""
        source = 'eucalyptus'
        url = self.sources[source]['url']
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        while self.running:
            try:
                self.logger.info(f"🔌 Connecting to {source}...")
                
                async with websockets.connect(
                    url,
                    additional_headers=headers,
                    ping_interval=30,
                    close_timeout=10
                ) as ws:
                    self.sources[source]['connected'] = True
                    self.logger.info(f"✅ {source} connected!")
                    
                    # Subscribe to token launch feeds
                    await self.setup_eucalyptus_subscriptions(ws)
                    
                    # Process token launch data
                    await self.process_eucalyptus_data(ws, source)
                    
            except Exception as e:
                self.sources[source]['connected'] = False
                self.logger.error(f"❌ {source} error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    async def connect_hyperliquid(self):
        """Connect to Hyperliquid for derivatives signals"""
        source = 'hyperliquid'
        url = self.sources[source]['url']
        
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        while self.running:
            try:
                self.logger.info(f"🔌 Connecting to {source}...")
                
                async with websockets.connect(
                    url,
                    additional_headers=headers,
                    ping_interval=30,
                    close_timeout=10
                ) as ws:
                    self.sources[source]['connected'] = True
                    self.logger.info(f"✅ {source} connected!")
                    
                    # Subscribe to derivatives feeds
                    await self.setup_hyperliquid_subscriptions(ws)
                    
                    # Process derivatives data
                    await self.process_hyperliquid_data(ws, source)
                    
            except Exception as e:
                self.sources[source]['connected'] = False
                self.logger.error(f"❌ {source} error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    async def setup_eucalyptus_subscriptions(self, ws):
        """Setup Eucalyptus subscriptions for token launches"""
        
        subscriptions = [
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "join", "room": "new_pairs"},
            {"action": "join", "room": "whale_feed"},
            {"action": "join", "room": "token_updates"},
            {"action": "join", "room": f"v:{self.auth_data['user_id']}"},
        ]
        
        for i, sub in enumerate(subscriptions):
            try:
                await ws.send(json.dumps(sub))
                self.logger.info(f"📤 Eucalyptus subscription #{i}: {sub.get('action', sub.get('type'))}")
                await asyncio.sleep(1)
            except Exception as e:
                self.logger.error(f"❌ Eucalyptus subscription error: {e}")
    
    async def setup_hyperliquid_subscriptions(self, ws):
        """Setup Hyperliquid subscriptions for derivatives data"""
        
        subscriptions = [
            {"method": "subscribe", "subscription": {"type": "allMids"}},
            {"method": "subscribe", "subscription": {"type": "trades", "coin": "BTC"}},
            {"method": "subscribe", "subscription": {"type": "trades", "coin": "ETH"}},
            {"method": "subscribe", "subscription": {"type": "l2Book", "coin": "BTC"}},
        ]
        
        for i, sub in enumerate(subscriptions):
            try:
                await ws.send(json.dumps(sub))
                self.logger.info(f"📤 Hyperliquid subscription #{i}: {sub['subscription']['type']}")
                await asyncio.sleep(1)
            except Exception as e:
                self.logger.error(f"❌ Hyperliquid subscription error: {e}")
    
    async def process_eucalyptus_data(self, ws, source: str):
        """Process Eucalyptus token launch data"""
        
        async for raw_message in ws:
            self.sources[source]['messages'] += 1
            self.metrics['total_messages'] += 1
            
            # Periodic logging
            if self.sources[source]['messages'] % 10 == 1:
                self.logger.info(f"📨 {source}: {self.sources[source]['messages']} messages")
            
            # Extract token launch signals
            signal = await self.extract_eucalyptus_signal(raw_message)
            if signal:
                await self.handle_trading_signal(signal, source)
    
    async def process_hyperliquid_data(self, ws, source: str):
        """Process Hyperliquid derivatives data"""
        
        async for raw_message in ws:
            self.sources[source]['messages'] += 1
            self.metrics['total_messages'] += 1
            
            # Periodic logging
            if self.sources[source]['messages'] % 20 == 1:
                self.logger.info(f"📈 {source}: {self.sources[source]['messages']} messages")
            
            # Extract derivatives signals
            signal = await self.extract_hyperliquid_signal(raw_message)
            if signal:
                await self.handle_trading_signal(signal, source)
    
    async def extract_eucalyptus_signal(self, raw_message):
        """Extract trading signals from Eucalyptus token data"""
        
        try:
            message_str = str(raw_message)
            data = json.loads(message_str)
            
            # New token launch
            if isinstance(data, dict) and data.get("room") == "new_pairs":
                token_data = data.get("content", {})
                if isinstance(token_data, dict):
                    
                    signal = {
                        'source': 'eucalyptus',
                        'type': 'new_token_launch',
                        'timestamp': time.time(),
                        'token_address': token_data.get('token_address', ''),
                        'token_name': token_data.get('token_name', 'Unknown'),
                        'token_ticker': token_data.get('token_ticker', 'UNKNOWN'),
                        'liquidity_sol': float(token_data.get('initial_liquidity_sol', 0)),
                        'snipers_percent': float(token_data.get('snipers_hold_percent', 0)),
                        'dev_percent': float(token_data.get('dev_holds_percent', 0)),
                        'lp_burned': token_data.get('lp_burned', False),
                        'platform': token_data.get('protocol', 'Unknown')
                    }
                    
                    # Calculate confidence
                    signal['confidence'] = self.calculate_token_confidence(signal)
                    
                    if signal['confidence'] > 0.4:  # 40%+ threshold
                        return signal
            
            # Large transactions
            elif isinstance(data, dict) and data.get("room", "").startswith("v:"):
                tx_data = data.get("content", {})
                if isinstance(tx_data, dict):
                    volume_sol = float(tx_data.get('total_sol', 0))
                    
                    if volume_sol >= 50:  # 50+ SOL transactions
                        signal = {
                            'source': 'eucalyptus',
                            'type': 'large_transaction',
                            'timestamp': time.time(),
                            'volume_sol': volume_sol,
                            'wallet_address': tx_data.get('maker_address', ''),
                            'token_address': tx_data.get('pair', {}).get('tokenAddress', ''),
                            'transaction_type': tx_data.get('type', ''),
                            'confidence': min(volume_sol / 200, 1.0)  # Scale by volume
                        }
                        
                        return signal
            
            # Legacy token arrays (from previous working system)
            elif isinstance(data, list) and len(data) > 25:
                signal = {
                    'source': 'eucalyptus',
                    'type': 'token_update',
                    'timestamp': time.time(),
                    'token_address': str(data[1]) if len(data) > 1 else '',
                    'token_name': str(data[3]) if len(data) > 3 else 'Unknown',
                    'confidence': 0.5
                }
                
                return signal
                
        except Exception as e:
            pass  # Ignore parsing errors
            
        return None
    
    async def extract_hyperliquid_signal(self, raw_message):
        """Extract trading signals from Hyperliquid derivatives data"""
        
        try:
            message_str = str(raw_message)
            data = json.loads(message_str)
            
            if isinstance(data, dict):
                channel = data.get('channel', '')
                content = data.get('data', {})
                
                # BTC/ETH trades (large volume)
                if channel == 'trades' and isinstance(content, list):
                    for trade in content:
                        if isinstance(trade, dict):
                            coin = trade.get('coin', '')
                            size = float(trade.get('sz', 0))
                            price = float(trade.get('px', 0))
                            side = trade.get('side', '')
                            
                            # Major crypto trades
                            if coin in ['BTC', 'ETH'] and size > 0:
                                volume_usd = size * price
                                
                                # Large trades (100k+ USD)
                                if volume_usd >= 100000:
                                    signal = {
                                        'source': 'hyperliquid',
                                        'type': 'large_crypto_trade',
                                        'timestamp': time.time(),
                                        'coin': coin,
                                        'size': size,
                                        'price': price,
                                        'side': side,
                                        'volume_usd': volume_usd,
                                        'confidence': min(volume_usd / 1000000, 1.0)  # Scale by volume
                                    }
                                    
                                    # Update BTC price for reference
                                    if coin == 'BTC':
                                        self.btc_price = price
                                    
                                    return signal
                
                # Market data updates
                elif channel == 'allMids' and isinstance(content, dict):
                    mids = content.get('mids', {})
                    if mids:
                        # Track major price movements
                        significant_moves = []
                        for token_id, price_str in mids.items():
                            try:
                                price = float(price_str)
                                if token_id not in self.market_data:
                                    self.market_data[token_id] = price
                                else:
                                    old_price = self.market_data[token_id]
                                    if old_price > 0:
                                        change_percent = abs(price - old_price) / old_price
                                        
                                        # 5%+ price moves
                                        if change_percent >= 0.05:
                                            significant_moves.append({
                                                'token_id': token_id,
                                                'old_price': old_price,
                                                'new_price': price,
                                                'change_percent': change_percent
                                            })
                                    
                                    self.market_data[token_id] = price
                            except:
                                pass
                        
                        # Generate signal for significant moves
                        if significant_moves:
                            biggest_move = max(significant_moves, key=lambda x: x['change_percent'])
                            
                            signal = {
                                'source': 'hyperliquid',
                                'type': 'price_movement',
                                'timestamp': time.time(),
                                'token_id': biggest_move['token_id'],
                                'change_percent': biggest_move['change_percent'],
                                'new_price': biggest_move['new_price'],
                                'confidence': min(biggest_move['change_percent'], 1.0)
                            }
                            
                            return signal
                            
        except Exception as e:
            pass  # Ignore parsing errors
            
        return None
    
    def calculate_token_confidence(self, signal: dict) -> float:
        """Calculate confidence for token launch signals"""
        
        score = 0.0
        
        # Liquidity factor
        liquidity = signal.get('liquidity_sol', 0)
        if liquidity >= 500:
            score += 0.4
        elif liquidity >= 100:
            score += 0.3
        elif liquidity >= 50:
            score += 0.2
        
        # Sniper activity
        snipers = signal.get('snipers_percent', 0)
        if snipers >= 30:
            score += 0.3
        elif snipers >= 15:
            score += 0.2
        elif snipers >= 5:
            score += 0.1
        
        # Safety factors
        dev_percent = signal.get('dev_percent', 0)
        if dev_percent <= 10:
            score += 0.1
        elif dev_percent >= 50:
            score -= 0.2
        
        # LP burned
        if signal.get('lp_burned', False):
            score += 0.2
            
        return min(1.0, max(0.0, score))
    
    async def handle_trading_signal(self, signal: dict, source: str):
        """Handle trading signals from both sources"""
        
        self.trading_signals.append(signal)
        self.sources[source]['signals'] += 1
        self.metrics['total_signals'] += 1
        
        confidence = signal.get('confidence', 0)
        
        if confidence >= 0.7:  # High confidence
            self.metrics['high_confidence_signals'] += 1
            
            self.logger.info(f"🎯 HIGH CONFIDENCE SIGNAL! ({source.upper()})")
            self.logger.info(f"   Type: {signal['type']}")
            self.logger.info(f"   Confidence: {confidence:.1%}")
            
            if signal['type'] == 'new_token_launch':
                self.logger.info(f"   Token: {signal.get('token_ticker')} ({signal.get('token_name')})")
                self.logger.info(f"   Liquidity: {signal.get('liquidity_sol', 0):.1f} SOL")
                self.logger.info(f"   Snipers: {signal.get('snipers_percent', 0):.1f}%")
                
            elif signal['type'] == 'large_crypto_trade':
                self.logger.info(f"   Coin: {signal.get('coin')} {signal.get('side')}")
                self.logger.info(f"   Volume: ${signal.get('volume_usd', 0):,.0f}")
                self.logger.info(f"   Price: ${signal.get('price', 0):,.2f}")
                
            elif signal['type'] == 'price_movement':
                self.logger.info(f"   Token: {signal.get('token_id')}")
                self.logger.info(f"   Change: {signal.get('change_percent', 0):.1%}")
                
            self.logger.info(f"   🚀 WOULD EXECUTE TRADE!")
            
        elif confidence >= 0.5:  # Medium confidence
            self.logger.info(f"📊 {source}: {signal['type']} - {confidence:.1%} confidence")
    
    async def monitor_trading_opportunities(self):
        """Monitor and report trading opportunities"""
        
        while self.running:
            await asyncio.sleep(30)  # Report every 30 seconds
            
            uptime = time.time() - self.metrics['start_time']
            
            self.logger.info(f"\n📊 DUAL-SOURCE TRADING STATUS:")
            self.logger.info(f"   ⏰ Uptime: {uptime:.0f}s")
            self.logger.info(f"   📨 Total Messages: {self.metrics['total_messages']}")
            self.logger.info(f"   🎯 Total Signals: {self.metrics['total_signals']}")
            self.logger.info(f"   🔥 High Confidence: {self.metrics['high_confidence_signals']}")
            
            # Source-specific stats
            for source, data in self.sources.items():
                status = "✅" if data['connected'] else "❌"
                self.logger.info(f"   {status} {source}: {data['messages']} msgs, {data['signals']} signals")
            
            # Recent high-confidence signals
            recent_signals = [s for s in self.trading_signals if s.get('confidence', 0) >= 0.7 and time.time() - s['timestamp'] < 300]
            if recent_signals:
                self.logger.info(f"\n🎯 RECENT HIGH-CONFIDENCE SIGNALS:")
                for signal in recent_signals[-3:]:
                    age = time.time() - signal['timestamp']
                    self.logger.info(f"   • {signal['type']} ({signal['source']}) - {age:.0f}s ago")

async def main():
    """Main entry point"""
    trader = DualSourceTrader()
    
    try:
        await trader.start_dual_trading()
    except KeyboardInterrupt:
        print("\n🛑 Dual trading system stopped by user")
        trader.running = False
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 DUAL-SOURCE TRADING SYSTEM")
    print("🎯 Eucalyptus + Hyperliquid = Maximum Opportunities")
    print("⚡ Auckland speed advantage on both sources")
    print("=" * 60)
    asyncio.run(main()) 