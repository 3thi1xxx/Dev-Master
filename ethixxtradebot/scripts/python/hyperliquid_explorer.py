#!/usr/bin/env python3
"""
Hyperliquid WebSocket Explorer
Test the derivatives exchange data for trading signals
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class HyperliquidExplorer:
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'hyperliquid_explorer_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # No auth needed - like browser behavior
        self.ws_url = "wss://api.hyperliquid.xyz/ws"
        
        self.metrics = {
            'messages_received': 0,
            'unique_message_types': set(),
            'trading_signals': 0,
            'start_time': time.time()
        }
        
        self.running = False
        
    async def start_exploration(self):
        """Start exploring Hyperliquid data"""
        self.logger.info("🔍 HYPERLIQUID WEBSOCKET EXPLORER")
        self.logger.info("🎯 Discovering derivatives trading signals")
        self.logger.info("⚡ Auckland-routed connection (AKL50-C1)")
        self.logger.info("🔗 No authentication required")
        self.logger.info("=" * 50)
        
        self.running = True
        await self.connect_and_explore()
    
    async def connect_and_explore(self):
        """Connect to Hyperliquid and explore data patterns"""
        
        # Browser-style headers (no authentication)
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        try:
            self.logger.info("🔌 Connecting to Hyperliquid...")
            
            async with websockets.connect(
                self.ws_url,
                additional_headers=headers,
                ping_interval=30,
                close_timeout=10
            ) as ws:
                self.logger.info("✅ Hyperliquid connection established!")
                
                # Try various subscription patterns
                await self.attempt_subscriptions(ws)
                
                # Explore incoming data
                await self.explore_data_stream(ws)
                
        except Exception as e:
            self.logger.error(f"❌ Hyperliquid connection error: {e}")
    
    async def attempt_subscriptions(self, ws):
        """Try different subscription patterns for Hyperliquid"""
        
        # Common derivatives exchange subscription patterns
        subscription_attempts = [
            # Method 1: Standard subscription format
            {"method": "subscribe", "subscription": {"type": "allMids"}},
            
            # Method 2: Trades subscription
            {"method": "subscribe", "subscription": {"type": "trades", "coin": "BTC"}},
            
            # Method 3: Order book
            {"method": "subscribe", "subscription": {"type": "l2Book", "coin": "BTC"}},
            
            # Method 4: User data (might need auth)
            {"method": "subscribe", "subscription": {"type": "user"}},
            
            # Method 5: Notification style
            {"id": 1, "method": "subscribe", "params": ["allMids"]},
            
            # Method 6: Simple format
            {"type": "subscribe", "channel": "trades"},
            
            # Method 7: No subscription (auto-feed)
            None,
        ]
        
        for i, sub in enumerate(subscription_attempts):
            try:
                if sub is None:
                    self.logger.info(f"📡 Listening without subscription...")
                    await asyncio.sleep(2)
                else:
                    message = json.dumps(sub)
                    await ws.send(message)
                    self.logger.info(f"📤 Hyperliquid subscription attempt #{i}: {sub}")
                    await asyncio.sleep(1)
                    
            except Exception as e:
                self.logger.error(f"❌ Subscription error #{i}: {e}")
    
    async def explore_data_stream(self, ws):
        """Explore and analyze the Hyperliquid data stream"""
        
        message_count = 0
        data_samples = []
        
        try:
            # Listen for up to 30 seconds or 20 messages
            timeout_start = time.time()
            
            while message_count < 20 and (time.time() - timeout_start) < 30:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=5)
                    message_count += 1
                    self.metrics['messages_received'] += 1
                    
                    timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                    self.logger.info(f"📨 [{timestamp}] Hyperliquid message #{message_count}")
                    
                    # Analyze message content
                    analysis = await self.analyze_message(message, message_count)
                    
                    if analysis:
                        data_samples.append(analysis)
                        self.logger.info(f"   Type: {analysis.get('type', 'unknown')}")
                        self.logger.info(f"   Content: {analysis.get('preview', 'N/A')}")
                        
                        # Look for trading signals
                        if analysis.get('trading_signal'):
                            self.metrics['trading_signals'] += 1
                            self.logger.info(f"   🎯 TRADING SIGNAL DETECTED!")
                    
                except asyncio.TimeoutError:
                    self.logger.info("⏰ No message received in 5s")
                    break
                    
            # Summary analysis
            await self.generate_exploration_report(data_samples)
            
        except Exception as e:
            self.logger.error(f"❌ Data exploration error: {e}")
    
    async def analyze_message(self, raw_message, msg_num: int):
        """Analyze individual Hyperliquid messages"""
        
        try:
            # Convert to string
            if isinstance(raw_message, bytes):
                message_str = raw_message.decode('utf-8')
            else:
                message_str = str(raw_message)
            
            analysis = {
                'message_number': msg_num,
                'timestamp': time.time(),
                'raw_length': len(message_str),
                'preview': message_str[:200] + "..." if len(message_str) > 200 else message_str
            }
            
            # Try JSON parsing
            try:
                data = json.loads(message_str)
                analysis['type'] = 'json'
                analysis['json_data'] = data
                
                # Look for specific derivatives patterns
                if isinstance(data, dict):
                    # Check for common derivatives fields
                    derivatives_fields = ['price', 'volume', 'side', 'coin', 'sz', 'px', 'time']
                    found_fields = [field for field in derivatives_fields if field in data]
                    
                    if found_fields:
                        analysis['derivatives_fields'] = found_fields
                        analysis['trading_signal'] = True
                        
                        # Extract trading data
                        if 'coin' in data:
                            analysis['coin'] = data['coin']
                        if 'price' in data or 'px' in data:
                            analysis['price'] = data.get('price', data.get('px'))
                        if 'volume' in data or 'sz' in data:
                            analysis['volume'] = data.get('volume', data.get('sz'))
                        if 'side' in data:
                            analysis['side'] = data['side']
                    
                    # Track message types
                    if 'channel' in data:
                        self.metrics['unique_message_types'].add(data['channel'])
                    elif 'type' in data:
                        self.metrics['unique_message_types'].add(data['type'])
                        
            except json.JSONDecodeError:
                analysis['type'] = 'non_json'
                
                # Check for other patterns
                if 'BTC' in message_str or 'ETH' in message_str:
                    analysis['contains_crypto'] = True
                    analysis['trading_signal'] = True
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"❌ Message analysis error: {e}")
            return None
    
    async def generate_exploration_report(self, data_samples):
        """Generate comprehensive exploration report"""
        
        self.logger.info("\n" + "="*60)
        self.logger.info("📊 HYPERLIQUID EXPLORATION REPORT")
        self.logger.info("="*60)
        
        # Basic metrics
        uptime = time.time() - self.metrics['start_time']
        self.logger.info(f"⏰ Exploration Duration: {uptime:.1f}s")
        self.logger.info(f"📨 Total Messages: {self.metrics['messages_received']}")
        self.logger.info(f"🎯 Trading Signals: {self.metrics['trading_signals']}")
        self.logger.info(f"📋 Unique Message Types: {len(self.metrics['unique_message_types'])}")
        
        if self.metrics['unique_message_types']:
            self.logger.info(f"   Types: {', '.join(self.metrics['unique_message_types'])}")
        
        # Data patterns
        if data_samples:
            self.logger.info(f"\n📈 DATA PATTERNS:")
            
            json_messages = [s for s in data_samples if s.get('type') == 'json']
            trading_signals = [s for s in data_samples if s.get('trading_signal')]
            
            self.logger.info(f"   JSON Messages: {len(json_messages)}/{len(data_samples)}")
            self.logger.info(f"   Trading Signals: {len(trading_signals)}/{len(data_samples)}")
            
            # Show sample trading data
            if trading_signals:
                self.logger.info(f"\n🎯 SAMPLE TRADING SIGNALS:")
                for i, signal in enumerate(trading_signals[:3], 1):
                    self.logger.info(f"   Signal #{i}:")
                    if signal.get('coin'):
                        self.logger.info(f"      Coin: {signal['coin']}")
                    if signal.get('price'):
                        self.logger.info(f"      Price: {signal['price']}")
                    if signal.get('volume'):
                        self.logger.info(f"      Volume: {signal['volume']}")
                    if signal.get('side'):
                        self.logger.info(f"      Side: {signal['side']}")
        
        # Recommendations
        self.logger.info(f"\n🎯 TRADING POTENTIAL:")
        if self.metrics['trading_signals'] > 0:
            self.logger.info(f"   ✅ Hyperliquid provides trading signals!")
            self.logger.info(f"   📊 Signal rate: {self.metrics['trading_signals']/uptime:.2f} signals/sec")
            self.logger.info(f"   🚀 RECOMMEND: Include in dual-source system")
        else:
            self.logger.info(f"   ⚠️ No clear trading signals detected")
            self.logger.info(f"   🔄 May need different subscription method")
        
        # Save detailed report
        report_file = f"hyperliquid_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_data = {
            'metrics': {
                'messages_received': self.metrics['messages_received'],
                'trading_signals': self.metrics['trading_signals'],
                'unique_message_types': list(self.metrics['unique_message_types']),
                'exploration_duration': uptime
            },
            'data_samples': data_samples[:10]  # First 10 samples
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        self.logger.info(f"\n💾 Detailed report saved: {report_file}")

async def main():
    """Main entry point"""
    explorer = HyperliquidExplorer()
    
    try:
        await explorer.start_exploration()
    except KeyboardInterrupt:
        print("\n🛑 Exploration stopped by user")
        explorer.running = False
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 HYPERLIQUID WEBSOCKET EXPLORER")
    print("🎯 Discovering derivatives trading signals")
    print("⚡ Auckland speed advantage")
    print("=" * 50)
    asyncio.run(main()) 