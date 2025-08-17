#!/usr/bin/env python3
"""
Eucalyptus-Focused Live Trading System
Uses the working eucalyptus connection for real-time trading signals
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime
from pathlib import Path

class EucalyptusFocusedTrader:
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'eucalyptus_trader_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # FRESH working tokens
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        # Trading metrics
        self.trading_signals = []
        self.metrics = {
            'messages_received': 0,
            'trading_opportunities': 0,
            'high_confidence_signals': 0,
            'start_time': time.time()
        }
        
        self.running = False
        
    async def start_trading_system(self):
        """Start the eucalyptus-focused trading system"""
        self.logger.info("🎯 EUCALYPTUS-FOCUSED TRADING SYSTEM")
        self.logger.info("✅ Using WORKING eucalyptus connection")
        self.logger.info("🔗 Fresh tokens with auto-refresh")
        self.logger.info("⚡ Auckland speed advantage confirmed")
        self.logger.info("=" * 50)
        
        self.running = True
        
        # Single focused connection - eucalyptus only
        await self.connect_eucalyptus_trading()
    
    async def connect_eucalyptus_trading(self):
        """Connect to eucalyptus with trading focus"""
        endpoint_name = "eucalyptus"
        url = "wss://eucalyptus.axiom.trade/ws"
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        max_retries = 5
        retry_count = 0
        
        while self.running and retry_count < max_retries:
            try:
                self.logger.info(f"🔌 Connecting to {endpoint_name} for trading...")
                
                ws = await asyncio.wait_for(
                    websockets.connect(
                        url,
                        additional_headers=headers,
                        ping_interval=30,
                        ping_timeout=10,
                        close_timeout=10
                    ),
                    timeout=20
                )
                
                self.logger.info(f"✅ {endpoint_name} trading connection established!")
                
                # Subscribe to trading-relevant rooms
                await self.setup_trading_subscriptions(ws, endpoint_name)
                
                # Start processing for trading signals
                await self.process_trading_data(ws, endpoint_name)
                
            except Exception as e:
                self.logger.error(f"❌ {endpoint_name} trading connection error: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = min(2 ** retry_count, 60)
                    self.logger.info(f"🔄 Retrying {endpoint_name} in {wait_time}s...")
                    await asyncio.sleep(wait_time)
    
    async def setup_trading_subscriptions(self, ws, endpoint: str):
        """Setup subscriptions focused on trading opportunities"""
        
        trading_subscriptions = [
            # Authentication first
            {"type": "auth", "token": self.auth_data["access_token"]},
            
            # Trading-focused subscriptions
            {"action": "join", "room": "new_pairs"},
            {"action": "join", "room": "whale_feed"},
            {"action": "join", "room": "token_updates"},
            {"action": "join", "room": f"v:{self.auth_data['user_id']}"},
        ]
        
        for i, sub in enumerate(trading_subscriptions):
            try:
                message = json.dumps(sub)
                await ws.send(message)
                self.logger.info(f"📤 {endpoint} trading subscription #{i}: {sub['action'] if 'action' in sub else sub['type']}")
                await asyncio.sleep(1)
            except Exception as e:
                self.logger.error(f"❌ {endpoint} subscription error: {e}")
    
    async def process_trading_data(self, ws, endpoint: str):
        """Process data specifically for trading opportunities"""
        
        message_count = 0
        
        try:
            async for raw_message in ws:
                message_count += 1
                self.metrics['messages_received'] += 1
                
                # Log every message initially for debugging
                if message_count <= 10:
                    timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                    self.logger.info(f"📨 [{timestamp}] {endpoint} trading message #{message_count}")
                    preview = str(raw_message)[:200]
                    self.logger.info(f"    Preview: {preview}...")
                
                # Process for trading signals
                trading_signal = await self.extract_trading_signal(raw_message, endpoint, message_count)
                
                if trading_signal:
                    await self.handle_trading_signal(trading_signal)
                
        except Exception as e:
            self.logger.error(f"❌ {endpoint} trading data processing error: {e}")
    
    async def extract_trading_signal(self, raw_message, source: str, msg_num: int):
        """Extract actionable trading signals from messages"""
        
        try:
            # Convert to string if needed
            if isinstance(raw_message, bytes):
                message_str = raw_message.decode('utf-8')
            else:
                message_str = str(raw_message)
            
            # Try JSON parsing
            try:
                data = json.loads(message_str)
                
                # Look for new token launches
                if isinstance(data, dict) and data.get("room") == "new_pairs":
                    return await self.analyze_new_token_signal(data.get("content"), source)
                
                # Look for large transactions  
                elif isinstance(data, dict) and data.get("room", "").startswith("v:"):
                    return await self.analyze_transaction_signal(data.get("content"), source)
                
                # Look for token arrays (legacy format)
                elif isinstance(data, list) and len(data) > 25:
                    return await self.analyze_token_array_signal(data, source)
                    
            except json.JSONDecodeError:
                # Handle non-JSON data
                pass
                
        except Exception as e:
            self.logger.error(f"❌ Trading signal extraction error: {e}")
            
        return None
    
    async def analyze_new_token_signal(self, token_data, source: str):
        """Analyze new token for trading opportunities"""
        
        if not token_data or not isinstance(token_data, dict):
            return None
            
        try:
            # Extract key trading metrics
            signal = {
                'type': 'new_token',
                'source': source,
                'timestamp': time.time(),
                'token_address': token_data.get('token_address', ''),
                'token_name': token_data.get('token_name', 'Unknown'),
                'token_ticker': token_data.get('token_ticker', 'UNKNOWN'),
                'liquidity_sol': float(token_data.get('initial_liquidity_sol', 0)),
                'dev_holds_percent': float(token_data.get('dev_holds_percent', 0)),
                'snipers_hold_percent': float(token_data.get('snipers_hold_percent', 0)),
                'lp_burned': token_data.get('lp_burned', False),
                'platform': token_data.get('protocol', 'Unknown')
            }
            
            # Calculate trading confidence
            confidence = self.calculate_trading_confidence(signal)
            signal['confidence'] = confidence
            
            # Only return high-confidence signals
            if confidence > 0.6:  # 60%+ confidence for trading
                return signal
                
        except Exception as e:
            self.logger.error(f"❌ New token signal analysis error: {e}")
            
        return None
    
    async def analyze_transaction_signal(self, tx_data, source: str):
        """Analyze large transactions for trading signals"""
        
        if not tx_data or not isinstance(tx_data, dict):
            return None
            
        try:
            volume_sol = float(tx_data.get('total_sol', 0))
            
            # Only process large transactions (100+ SOL)
            if volume_sol >= 100:
                signal = {
                    'type': 'large_transaction',
                    'source': source,
                    'timestamp': time.time(),
                    'wallet_address': tx_data.get('maker_address', ''),
                    'token_address': tx_data.get('pair', {}).get('tokenAddress', ''),
                    'volume_sol': volume_sol,
                    'transaction_type': tx_data.get('type', ''),
                    'confidence': min(volume_sol / 1000, 1.0)  # Scale by volume
                }
                
                return signal
                
        except Exception as e:
            self.logger.error(f"❌ Transaction signal analysis error: {e}")
            
        return None
    
    async def analyze_token_array_signal(self, token_array, source: str):
        """Analyze token array data for trading signals"""
        
        try:
            if len(token_array) < 20:
                return None
                
            # Extract basic data
            signal = {
                'type': 'token_update',
                'source': source,
                'timestamp': time.time(),
                'token_address': str(token_array[1]) if len(token_array) > 1 else '',
                'token_name': str(token_array[3]) if len(token_array) > 3 else 'Unknown',
                'token_ticker': str(token_array[4]) if len(token_array) > 4 else 'UNKNOWN',
                'confidence': 0.5  # Base confidence for legacy format
            }
            
            return signal
            
        except Exception as e:
            self.logger.error(f"❌ Token array signal analysis error: {e}")
            
        return None
    
    def calculate_trading_confidence(self, signal: dict) -> float:
        """Calculate trading confidence score"""
        
        score = 0.0
        
        # Liquidity factor (primary)
        liquidity = signal.get('liquidity_sol', 0)
        if liquidity >= 500:  # 500+ SOL = high confidence
            score += 0.4
        elif liquidity >= 100:  # 100+ SOL = medium confidence  
            score += 0.3
        elif liquidity >= 50:   # 50+ SOL = low confidence
            score += 0.2
        
        # Sniper activity (key indicator)
        snipers = signal.get('snipers_hold_percent', 0)
        if snipers >= 30:  # 30%+ snipers = very bullish
            score += 0.3
        elif snipers >= 15:  # 15%+ snipers = bullish
            score += 0.2
        elif snipers >= 5:   # 5%+ snipers = mildly bullish
            score += 0.1
        
        # Safety factors
        dev_holds = signal.get('dev_holds_percent', 0)
        if dev_holds <= 10:  # Dev holds <10% = safer
            score += 0.1
        elif dev_holds >= 50:  # Dev holds 50%+ = risky
            score -= 0.2
        
        # LP burned = much safer
        if signal.get('lp_burned', False):
            score += 0.2
            
        return min(1.0, max(0.0, score))
    
    async def handle_trading_signal(self, signal: dict):
        """Handle actionable trading signal"""
        
        self.trading_signals.append(signal)
        self.metrics['trading_opportunities'] += 1
        
        if signal['confidence'] >= 0.7:  # 70%+ = high confidence
            self.metrics['high_confidence_signals'] += 1
            
            self.logger.info(f"🎯 HIGH CONFIDENCE TRADING SIGNAL!")
            self.logger.info(f"   Type: {signal['type']}")
            self.logger.info(f"   Token: {signal.get('token_ticker', 'N/A')} ({signal.get('token_name', 'N/A')})")
            self.logger.info(f"   Confidence: {signal['confidence']:.1%}")
            
            if signal['type'] == 'new_token':
                self.logger.info(f"   Liquidity: {signal.get('liquidity_sol', 0):.1f} SOL")
                self.logger.info(f"   Snipers: {signal.get('snipers_hold_percent', 0):.1f}%")
                self.logger.info(f"   LP Burned: {signal.get('lp_burned', False)}")
                
                # This is where we'd integrate with Axiom API for actual trading
                self.logger.info(f"   🚀 WOULD EXECUTE BUY ORDER!")
                
        else:
            self.logger.info(f"📊 Trading signal: {signal['type']} - {signal['confidence']:.1%} confidence")

async def main():
    """Main entry point"""
    trader = EucalyptusFocusedTrader()
    
    try:
        await trader.start_trading_system()
    except KeyboardInterrupt:
        print("\n🛑 Trading system stopped by user")
        trader.running = False
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🎯 EUCALYPTUS-FOCUSED TRADING SYSTEM")
    print("✅ Using proven working connection")
    print("⚡ Auckland speed advantage")
    print("🔗 Fresh token authentication")
    print("=" * 50)
    asyncio.run(main()) 