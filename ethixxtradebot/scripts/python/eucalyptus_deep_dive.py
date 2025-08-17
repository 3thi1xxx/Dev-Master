#!/usr/bin/env python3
"""
Eucalyptus Deep Dive
Examine exactly what data Eucalyptus provides vs cluster7 expectations
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class EucalyptusDeepDive:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Fresh auth tokens
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        self.message_analysis = {
            'total_messages': 0,
            'message_types': {},
            'new_pairs_found': 0,
            'token_updates': 0,
            'whale_activity': 0,
            'trading_signals': 0,
            'raw_samples': []
        }
        
    async def deep_dive_eucalyptus(self):
        """Deep dive analysis of Eucalyptus data stream"""
        
        self.logger.info("🔬 EUCALYPTUS DEEP DIVE ANALYSIS")
        self.logger.info("Examining what data Eucalyptus actually provides...")
        self.logger.info("🎯 Looking for: new_pairs, trading signals, whale activity")
        self.logger.info("=" * 60)
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        try:
            async with websockets.connect(
                'wss://eucalyptus.axiom.trade/ws',
                additional_headers=headers,
                ping_interval=30,
                close_timeout=10
            ) as ws:
                self.logger.info("✅ EUCALYPTUS CONNECTED!")
                
                # Send the same subscriptions that worked for cluster7
                await self.send_cluster7_style_subscriptions(ws)
                
                # Listen and analyze everything
                await self.analyze_data_stream(ws)
                
        except Exception as e:
            self.logger.error(f"❌ Eucalyptus connection failed: {e}")
            return False
        
        return True
    
    async def send_cluster7_style_subscriptions(self, ws):
        """Send the same subscription sequence that worked for cluster7"""
        
        self.logger.info("📤 Sending cluster7-style subscriptions to Eucalyptus...")
        
        # Exact sequence from successful cluster7 log
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
        
        self.logger.info("📡 Now listening for data...")
    
    async def analyze_data_stream(self, ws):
        """Comprehensive analysis of the Eucalyptus data stream"""
        
        self.logger.info("🔬 ANALYZING EUCALYPTUS DATA STREAM...")
        self.logger.info("⏰ Will run for 2 minutes to get a complete picture")
        
        start_time = time.time()
        last_status = start_time
        
        while (time.time() - start_time) < 120:  # 2 minutes
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=10)
                self.message_analysis['total_messages'] += 1
                
                timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                message_num = self.message_analysis['total_messages']
                
                # Analyze the message
                await self.analyze_message(message, timestamp, message_num)
                
                # Status update every 30 seconds
                if time.time() - last_status > 30:
                    await self.print_interim_analysis()
                    last_status = time.time()
                
            except asyncio.TimeoutError:
                self.logger.info("⏰ No message in 10s - continuing to wait...")
                continue
            except Exception as e:
                self.logger.error(f"❌ Listen error: {e}")
                break
        
        # Final analysis
        await self.print_final_analysis()
    
    async def analyze_message(self, message, timestamp, message_num):
        """Analyze individual message for trading value"""
        
        self.logger.info(f"📨 [{timestamp}] eucalyptus #{message_num}")
        
        # Store raw sample for first 10 messages
        if len(self.message_analysis['raw_samples']) < 10:
            sample = str(message)[:500] if len(str(message)) > 500 else str(message)
            self.message_analysis['raw_samples'].append({
                'number': message_num,
                'timestamp': timestamp,
                'sample': sample
            })
        
        # Try to parse as JSON
        try:
            data = json.loads(str(message))
            
            # Analyze message structure
            if isinstance(data, dict):
                self.analyze_dict_message(data, message_num)
            elif isinstance(data, list):
                self.analyze_array_message(data, message_num)
            else:
                self.logger.info(f"    📝 Other data type: {type(data)}")
                
        except json.JSONDecodeError:
            # Non-JSON message
            preview = str(message)[:200]
            self.logger.info(f"    📝 Non-JSON: {preview}...")
            
            message_type = 'non_json'
            self.message_analysis['message_types'][message_type] = self.message_analysis['message_types'].get(message_type, 0) + 1
    
    def analyze_dict_message(self, data, message_num):
        """Analyze dictionary-style messages"""
        
        # Check for room-based messages (like cluster7)
        if 'room' in data:
            room = data.get('room')
            self.logger.info(f"    🏠 Room: {room}")
            
            if room == 'new_pairs':
                self.message_analysis['new_pairs_found'] += 1
                self.logger.info(f"🎯 NEW_PAIRS MESSAGE FOUND! (#{self.message_analysis['new_pairs_found']})")
                
                # Analyze new pairs content
                content = data.get('content', {})
                if isinstance(content, dict):
                    token_name = content.get('token_name', 'Unknown')
                    token_ticker = content.get('token_ticker', 'UNKNOWN')
                    liquidity = content.get('initial_liquidity_sol', 0)
                    
                    self.logger.info(f"🪙 Token: {token_ticker} ({token_name})")
                    self.logger.info(f"💰 Liquidity: {liquidity} SOL")
                    self.logger.info("🏆 THIS IS CLUSTER7-STYLE TRADING DATA!")
                    
            elif 'token' in room or 'whale' in room:
                self.message_analysis['token_updates'] += 1
                self.logger.info(f"🐋 Token/Whale activity")
                
            self.message_analysis['message_types'][f'room_{room}'] = self.message_analysis['message_types'].get(f'room_{room}', 0) + 1
            
        else:
            # Check for other trading-relevant fields
            relevant_fields = ['token', 'pair', 'price', 'volume', 'liquidity', 'trade', 'whale', 'new']
            found_fields = [field for field in relevant_fields if field in str(data).lower()]
            
            if found_fields:
                self.message_analysis['trading_signals'] += 1
                self.logger.info(f"📊 Trading-relevant data: {found_fields}")
                
            message_type = f'dict_keys_{len(data.keys())}'
            self.message_analysis['message_types'][message_type] = self.message_analysis['message_types'].get(message_type, 0) + 1
    
    def analyze_array_message(self, data, message_num):
        """Analyze array-style messages"""
        
        array_size = len(data)
        self.logger.info(f"    📊 Array: {array_size} items")
        
        if array_size > 20:
            self.logger.info(f"📈 Large data array - potential bulk trading data!")
            self.message_analysis['trading_signals'] += 1
            
        message_type = f'array_{array_size}'
        self.message_analysis['message_types'][message_type] = self.message_analysis['message_types'].get(message_type, 0) + 1
    
    async def print_interim_analysis(self):
        """Print interim analysis during the run"""
        
        self.logger.info("\n" + "─" * 40)
        self.logger.info("📊 INTERIM ANALYSIS")
        self.logger.info(f"📨 Messages: {self.message_analysis['total_messages']}")
        self.logger.info(f"🎯 New Pairs: {self.message_analysis['new_pairs_found']}")
        self.logger.info(f"🪙 Token Updates: {self.message_analysis['token_updates']}")
        self.logger.info(f"📈 Trading Signals: {self.message_analysis['trading_signals']}")
        self.logger.info("─" * 40 + "\n")
    
    async def print_final_analysis(self):
        """Print comprehensive final analysis"""
        
        self.logger.info("\n" + "=" * 60)
        self.logger.info("🔬 EUCALYPTUS DEEP DIVE RESULTS")
        self.logger.info("=" * 60)
        
        total = self.message_analysis['total_messages']
        new_pairs = self.message_analysis['new_pairs_found']
        token_updates = self.message_analysis['token_updates']
        trading_signals = self.message_analysis['trading_signals']
        
        self.logger.info(f"📨 Total Messages: {total}")
        self.logger.info(f"🎯 New Pairs Found: {new_pairs}")
        self.logger.info(f"🪙 Token Updates: {token_updates}")
        self.logger.info(f"📈 Trading Signals: {trading_signals}")
        
        self.logger.info(f"\n📊 MESSAGE TYPES:")
        for msg_type, count in self.message_analysis['message_types'].items():
            self.logger.info(f"   {msg_type}: {count}")
        
        self.logger.info(f"\n📝 RAW SAMPLES:")
        for sample in self.message_analysis['raw_samples'][:5]:
            self.logger.info(f"   #{sample['number']}: {sample['sample'][:150]}...")
        
        # Comparison with cluster7 expectations
        self.logger.info(f"\n🔍 CLUSTER7 COMPARISON:")
        if new_pairs > 0:
            self.logger.info(f"✅ Found new_pairs messages - SAME AS CLUSTER7!")
            self.logger.info(f"🏆 EUCALYPTUS CONTAINS THE GOLDMINE!")
        else:
            self.logger.info(f"❌ No new_pairs messages found")
            self.logger.info(f"🤔 Eucalyptus != Cluster7 trading data")
        
        if total < 10:
            self.logger.info(f"⚠️ Very low message volume ({total} in 2 minutes)")
            self.logger.info(f"💡 May need different subscriptions or longer monitoring")
        else:
            self.logger.info(f"✅ Good message volume ({total} in 2 minutes)")
        
        # Rate calculation
        rate = total / 120  # messages per second
        self.logger.info(f"📊 Message Rate: {rate:.2f} msgs/sec")
        
        if rate > 0.1:
            self.logger.info(f"✅ Active data stream")
        else:
            self.logger.info(f"⚠️ Low activity - may not be primary trading feed")

async def main():
    print("🔬 EUCALYPTUS DEEP DIVE ANALYSIS")
    print("=" * 50)
    print("🎯 Goal: Understand exactly what Eucalyptus provides")
    print("❓ Question: Does it contain cluster7's goldmine data?")
    print("⏰ Duration: 2 minutes of comprehensive monitoring")
    print("")
    
    analyzer = EucalyptusDeepDive()
    success = await analyzer.deep_dive_eucalyptus()
    
    if success:
        print("\n✅ Analysis complete!")
    else:
        print("\n❌ Analysis failed")

if __name__ == "__main__":
    asyncio.run(main()) 