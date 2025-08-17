#!/usr/bin/env python3
"""
WORKING Whale Discovery System
Direct WebSocket connection with real data parsing and proper authentication
"""

import asyncio
import json
import time
import logging
import websockets
import aiohttp
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

@dataclass
class WhaleDiscovery:
    """Real whale discovery data structure"""
    timestamp: float
    whale_address: str
    token_address: str
    token_name: str
    token_ticker: str
    volume_sol: float
    market_cap_sol: float
    liquidity_sol: float
    platform: str
    confidence_score: float
    raw_data: list

    def to_dict(self):
        return asdict(self)

class WorkingWhaleDiscovery:
    """
    WORKING whale discovery - direct WebSocket with proper authentication
    """
    
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'whale_discovery_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Your FRESH authentication tokens from browser cookies
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ0NDIxLCJleHAiOjE3NTUxNDUzODF9.njjzMD2NL6_CWGPbU8a8ziYN0j2ptAysrhiBQhHzKd8',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic',
            'user_id': '64958bb1-3016-4780-8b09-f687062cfa20'
        }
        
        # Discovery tracking
        self.discovered_whales = {}
        self.metrics = {
            'messages_received': 0,
            'whales_discovered': 0,
            'auto_added': 0,
            'start_time': time.time(),
            'last_whale_time': 0
        }
        
        self.running = False
        self.ws_connections = {}

    async def start_real_discovery(self):
        """Start REAL whale discovery with working WebSocket connections"""
        self.logger.info("🚀 WORKING WHALE DISCOVERY SYSTEM")
        self.logger.info("🔗 Direct WebSocket - No Bridge Dependencies")
        self.logger.info("📡 Real Authentication & Data Parsing")
        self.logger.info("═══════════════════════════════════════════")
        
        self.running = True
        
        # First, refresh authentication token if needed
        await self.refresh_authentication()
        
        # Connect to multiple endpoints concurrently
        connection_tasks = [
            self.connect_cluster7(),
            self.connect_eucalyptus(),
            self.status_monitor()
        ]
        
        await asyncio.gather(*connection_tasks, return_exceptions=True)

    async def refresh_authentication(self):
        """Refresh authentication token if expired"""
        try:
            # Check if token is expired (you can decode JWT to check exp)
            self.logger.info("🔐 Checking authentication status...")
            
            # Try to refresh token
            refresh_url = "https://api6.axiom.trade/refresh-access-token"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.auth_data["refresh_token"]}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(refresh_url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'accessToken' in data:
                            self.auth_data['access_token'] = data['accessToken']
                            self.logger.info("✅ Authentication token refreshed")
                        else:
                            self.logger.info("ℹ️ Using existing token")
                    else:
                        self.logger.warning(f"⚠️ Token refresh failed: {response.status}")
                        
        except Exception as e:
            self.logger.warning(f"⚠️ Token refresh error: {e}")
            self.logger.info("ℹ️ Continuing with existing token")

    async def connect_cluster7(self):
        """Connect to cluster7 endpoint - FIXED with FRESH browser cookies"""
        endpoint_name = "cluster7"
        url = "wss://cluster7.axiom.trade/"
        
        # FIXED: Include FRESH cookies from your browser
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        await self.websocket_connection_handler(url, headers, endpoint_name)

    async def connect_eucalyptus(self):
        """Connect to eucalyptus endpoint - FIXED with FRESH browser cookies"""
        endpoint_name = "eucalyptus"
        url = "wss://eucalyptus.axiom.trade/ws"
        
        # FIXED: Include FRESH cookies from your browser
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        await self.websocket_connection_handler(url, headers, endpoint_name)

    async def websocket_connection_handler(self, url: str, headers: dict, endpoint: str):
        """Handle WebSocket connection with proper error recovery"""
        
        max_retries = 10
        retry_count = 0
        
        while self.running and retry_count < max_retries:
            try:
                self.logger.info(f"🔌 Connecting to {endpoint}... (attempt {retry_count + 1})")
                
                # Connect with proper timeout - FIXED: Use additional_headers instead
                ws = await asyncio.wait_for(
                    websockets.connect(
                        url,
                        additional_headers=headers,
                        ping_interval=30,
                        ping_timeout=10,
                        compression=None,
                        close_timeout=10
                    ),
                    timeout=20
                )
                
                self.logger.info(f"✅ {endpoint} connected successfully!")
                self.ws_connections[endpoint] = ws
                
                # Try various subscription methods
                await self.attempt_subscriptions(ws, endpoint)
                
                # Start listening for messages
                await self.listen_for_real_data(ws, endpoint)
                
            except asyncio.TimeoutError:
                self.logger.error(f"⏰ {endpoint} connection timeout")
                retry_count += 1
            except websockets.exceptions.InvalidStatusCode as e:
                if e.status_code == 401:
                    self.logger.error(f"🔐 {endpoint} authentication failed - refreshing token...")
                    await self.refresh_authentication()
                    retry_count += 1
                elif e.status_code == 403:
                    self.logger.error(f"🚫 {endpoint} access forbidden")
                    break
                else:
                    self.logger.error(f"❌ {endpoint} HTTP error: {e.status_code}")
                    retry_count += 1
            except websockets.exceptions.ConnectionClosed as e:
                self.logger.warning(f"🔌 {endpoint} connection closed: {e}")
                retry_count += 1
            except Exception as e:
                self.logger.error(f"❌ {endpoint} connection error: {e}")
                retry_count += 1
            
            if retry_count < max_retries and self.running:
                wait_time = min(2 ** retry_count, 60)
                self.logger.info(f"🔄 Retrying {endpoint} in {wait_time}s...")
                await asyncio.sleep(wait_time)
            
        if retry_count >= max_retries:
            self.logger.error(f"💀 {endpoint} max retries exceeded")

    async def attempt_subscriptions(self, ws, endpoint: str):
        """FIXED: Use correct SDK subscription format"""
        
        # CORRECTED: Authentication first, then subscriptions
        subscription_attempts = [
            # Method 1: AUTHENTICATE FIRST (like browser does)
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "authenticate", "access_token": self.auth_data["access_token"]},
            {"auth": {"access_token": self.auth_data["access_token"], "user_id": self.auth_data["user_id"]}},
            
            # Method 2: Official SDK format for new token pairs
            {"action": "join", "room": "new_pairs"},
            
            # Method 3: Wallet transaction monitoring format  
            {"action": "join", "room": f"v:{self.auth_data['user_id']}"},
            
            # Method 4: Try some whale-specific rooms
            {"action": "join", "room": "whale_feed"},
            {"action": "join", "room": "token_updates"},
            
            # Method 5: General feeds
            {"action": "join", "room": "all_pairs"},
            {"action": "join", "room": "new_tokens"},
            
            # Method 6: No subscription (auto-feed)
            None,
        ]
        
        for i, sub in enumerate(subscription_attempts):
            try:
                if sub is None:
                    self.logger.info(f"📡 {endpoint} listening without subscription...")
                    await asyncio.sleep(2)
                else:
                    message = json.dumps(sub)
                    await ws.send(message)
                    self.logger.info(f"📤 {endpoint} subscription attempt #{i}: {sub}")
                    await asyncio.sleep(1)  # Wait between attempts
                    
            except Exception as e:
                self.logger.error(f"❌ {endpoint} subscription error: {e}")

    async def listen_for_real_data(self, ws, endpoint: str):
        """Listen for real data with comprehensive parsing"""
        
        message_count = 0
        last_log_time = time.time()
        
        try:
            async for raw_message in ws:
                message_count += 1
                self.metrics['messages_received'] += 1
                
                # Adaptive logging - verbose initially, then summary
                should_log_detail = (message_count <= 20 or 
                                   message_count % 50 == 0 or
                                   time.time() - last_log_time > 60)
                
                if should_log_detail:
                    timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                    self.logger.info(f"📨 [{timestamp}] {endpoint} #{message_count}")
                    self.logger.info(f"    Type: {type(raw_message)}")
                    self.logger.info(f"    Size: {len(str(raw_message))} chars")
                    
                    # Show message preview
                    preview = str(raw_message)[:400]
                    self.logger.info(f"    Preview: {preview}...")
                    last_log_time = time.time()
                
                # Parse the message
                await self.parse_real_message(raw_message, endpoint, message_count)
                
                # Brief pause to prevent overwhelming
                await asyncio.sleep(0.01)
                
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.warning(f"🔌 {endpoint} connection closed: {e}")
        except Exception as e:
            self.logger.error(f"❌ {endpoint} listen error: {e}")
        finally:
            if endpoint in self.ws_connections:
                del self.ws_connections[endpoint]

    async def parse_real_message(self, raw_message, endpoint: str, msg_num: int):
        """Parse incoming message with multiple format detection"""
        
        try:
            # Convert to string if needed
            if isinstance(raw_message, bytes):
                message_str = raw_message.decode('utf-8')
            else:
                message_str = str(raw_message)
            
            # Attempt JSON parsing
            try:
                data = json.loads(message_str)
                
                # FIXED: Handle SDK message format
                if isinstance(data, dict):
                    # Check for SDK "new_pairs" room format
                    if data.get("room") == "new_pairs" and "content" in data:
                        self.logger.info(f"🎯 {endpoint} FOUND NEW_PAIRS MESSAGE! (#{msg_num})")
                        await self.process_sdk_new_pairs(data["content"], endpoint)
                    
                    # Check for wallet transaction format  
                    elif data.get("room", "").startswith("v:") and "content" in data:
                        self.logger.info(f"🎯 {endpoint} FOUND WALLET TRANSACTION! (#{msg_num})")
                        await self.process_sdk_wallet_transaction(data["content"], endpoint)
                    
                    # Handle other structured messages
                    else:
                        await self.handle_structured_message(data, endpoint)
                
                # Legacy: Check for token array format (your original format)
                elif isinstance(data, list) and len(data) > 25:
                    self.logger.info(f"🎯 {endpoint} FOUND LEGACY TOKEN ARRAY! (#{msg_num})")
                    await self.process_token_array(data, endpoint)
                    
                elif isinstance(data, list) and len(data) > 5:
                    # Handle shorter arrays that might still be useful
                    self.logger.info(f"📋 {endpoint} Short array ({len(data)} elements)")
                    
            except json.JSONDecodeError:
                # Handle non-JSON data
                await self.handle_non_json_data(raw_message, endpoint, msg_num)
                
        except Exception as e:
            self.logger.error(f"❌ {endpoint} message parsing error: {e}")

    async def process_token_array(self, token_array: list, source: str):
        """Process token array using known format patterns"""
        
        try:
            if len(token_array) < 10:
                return
                
            # Extract data using safe indexing
            token_data = {
                'timestamp': time.time(),
                'source': source,
                'raw_length': len(token_array),
                'pool_id': self.safe_extract(token_array, 0),
                'token_address': self.safe_extract(token_array, 1),
                'creator_address': self.safe_extract(token_array, 2),
                'token_name': self.safe_extract(token_array, 3, 'Unknown'),
                'token_ticker': self.safe_extract(token_array, 4, 'UNKNOWN'),
                'platform': self.safe_extract(token_array, 7, 'Unknown'),
                'website': self.safe_extract(token_array, 9),
                'twitter': self.safe_extract(token_array, 10),
                'telegram': self.safe_extract(token_array, 11),
            }
            
            # Extract financial metrics from various positions
            financial_candidates = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
            financial_values = []
            
            for idx in financial_candidates:
                val = self.safe_float_extract(token_array, idx)
                if val > 0:
                    financial_values.append((idx, val))
            
            # Assign financial metrics based on value ranges
            token_data['volume_sol'] = 0
            token_data['market_cap_sol'] = 0
            token_data['liquidity_sol'] = 0
            
            for idx, val in financial_values:
                if val > 10000:  # Likely volume or market cap
                    if token_data['volume_sol'] == 0:
                        token_data['volume_sol'] = val
                    elif token_data['market_cap_sol'] == 0:
                        token_data['market_cap_sol'] = val
                elif val > 100:  # Likely liquidity
                    if token_data['liquidity_sol'] == 0:
                        token_data['liquidity_sol'] = val
            
            # Calculate confidence score
            confidence = self.calculate_whale_confidence(token_data)
            
            # Log token discovery
            self.logger.info(f"🪙 {source} TOKEN: {token_data['token_ticker']} ({token_data['token_name']})")
            self.logger.info(f"   Volume: {token_data['volume_sol']:.1f} SOL")
            self.logger.info(f"   Market Cap: {token_data['market_cap_sol']:.1f} SOL")
            self.logger.info(f"   Liquidity: {token_data['liquidity_sol']:.1f} SOL")
            self.logger.info(f"   Platform: {token_data['platform']}")
            self.logger.info(f"   Confidence: {confidence:.1%}")
            
            # Check if it's a whale
            if confidence > 0.4:  # 40% confidence threshold
                await self.record_whale_discovery(token_data, confidence, token_array)
                
        except Exception as e:
            self.logger.error(f"❌ Token array processing error: {e}")

    async def process_sdk_new_pairs(self, tokens, source: str):
        """ADDED: Process SDK new_pairs message format"""
        try:
            # Handle both single token and array of tokens
            if not isinstance(tokens, list):
                tokens = [tokens]
            
            for token in tokens:
                if not isinstance(token, dict):
                    continue
                
                # DEBUG: Show available fields
                self.logger.info(f"🔍 Available token fields: {list(token.keys())}")
                
                # Extract SDK token data - FIXED with actual field names from logs
                def safe_get_float(data, key, default=0.0):
                    try:
                        value = data.get(key, default)
                        return float(value) if value is not None else default
                    except (ValueError, TypeError):
                        return default
                
                token_data = {
                    'timestamp': time.time(),
                    'source': source,
                    'token_address': token.get('token_address', ''),
                    'creator_address': token.get('deployer_address', ''),
                    'token_name': token.get('token_name', 'Unknown'),
                    'token_ticker': token.get('token_ticker', 'UNKNOWN'),
                    'platform': token.get('protocol', 'Unknown'),
                    'website': token.get('website', ''),
                    'twitter': token.get('twitter', ''),
                    'telegram': token.get('telegram', ''),
                    'volume_sol': 0,  # Not available in new_pairs
                    'market_cap_sol': 0,  # Not available in new_pairs
                    'liquidity_sol': safe_get_float(token, 'initial_liquidity_sol'),
                    'supply': safe_get_float(token, 'supply'),
                    'dev_holds_percent': safe_get_float(token, 'dev_holds_percent'),
                    'snipers_hold_percent': safe_get_float(token, 'snipers_hold_percent'),
                    'top_10_holders': token.get('top_10_holders', []),
                    'lp_burned': token.get('lp_burned', False),
                }
                
                # Calculate confidence score
                confidence = self.calculate_whale_confidence(token_data)
                
                # Log token discovery with REAL whale metrics
                self.logger.info(f"🪙 {source} TOKEN: {token_data['token_ticker']} ({token_data['token_name']})")
                self.logger.info(f"   💰 Initial Liquidity: {token_data['liquidity_sol']:.1f} SOL")
                self.logger.info(f"   🐋 Snipers Hold: {token_data['snipers_hold_percent']:.1f}%")
                self.logger.info(f"   👨‍💻 Dev Holds: {token_data['dev_holds_percent']:.1f}%")
                self.logger.info(f"   🔥 LP Burned: {token_data['lp_burned']}")
                self.logger.info(f"   🏛️ Platform: {token_data['platform']}")
                self.logger.info(f"   ⭐ Confidence: {confidence:.1%}")
                
                # Check if it's a whale
                if confidence > 0.4:  # 40% confidence threshold
                    await self.record_whale_discovery(token_data, confidence, token)
                    
        except Exception as e:
            self.logger.error(f"❌ SDK new_pairs processing error: {e}")

    async def process_sdk_wallet_transaction(self, transaction, source: str):
        """ADDED: Process SDK wallet transaction format"""
        try:
            # Extract transaction data
            transaction_data = {
                'timestamp': time.time(),
                'source': source,
                'wallet_address': transaction.get('maker_address', ''),
                'token_address': transaction.get('pair', {}).get('tokenAddress', ''),
                'token_name': transaction.get('pair', {}).get('tokenName', 'Unknown'),
                'token_ticker': transaction.get('pair', {}).get('tokenTicker', 'UNKNOWN'),
                'transaction_type': transaction.get('type', ''),
                'volume_sol': float(transaction.get('total_sol', 0)),
                'token_amount': float(transaction.get('token_amount', 0)),
                'price_sol': float(transaction.get('price_sol', 0)),
                'signature': transaction.get('signature', ''),
            }
            
            self.logger.info(f"💰 {source} WALLET TX: {transaction_data['wallet_address'][:8]}... {transaction_data['transaction_type']} {transaction_data['volume_sol']:.1f} SOL")
            
            # This could be used for whale tracking
            # For now, just log significant transactions
            if transaction_data['volume_sol'] > 100:  # 100+ SOL transactions
                self.logger.info(f"🐋 Large transaction: {transaction_data['volume_sol']:.1f} SOL")
                
        except Exception as e:
            self.logger.error(f"❌ SDK wallet transaction processing error: {e}")

    def safe_extract(self, array: list, index: int, default=''):
        """Safely extract value from array"""
        try:
            if index < len(array) and array[index] is not None:
                return str(array[index])
            return default
        except:
            return default

    def safe_float_extract(self, array: list, index: int, default=0.0):
        """Safely extract float from array"""
        try:
            if index < len(array) and array[index] is not None:
                val = float(array[index])
                return val if not (val != val) else default  # Check for NaN
            return default
        except:
            return default

    def calculate_whale_confidence(self, token_data: dict) -> float:
        """UPDATED: Calculate whale confidence using REAL token metrics"""
        
        score = 0.0
        
        # Initial liquidity scoring (primary factor for new tokens)
        liquidity = token_data.get('liquidity_sol', 0)
        if liquidity >= 1000:  # 1000+ SOL initial liquidity = serious project
            score += 0.4
        elif liquidity >= 100:  # 100+ SOL = decent liquidity
            score += 0.3
        elif liquidity >= 10:   # 10+ SOL = minimum viable
            score += 0.2
        elif liquidity > 0:
            score += liquidity / 50  # Scale smaller amounts
        
        # Whale metrics - SNIPER PERCENTAGE IS KEY!
        snipers_percent = token_data.get('snipers_hold_percent', 0)
        if snipers_percent >= 50:  # 50%+ held by snipers = WHALE ACTIVITY!
            score += 0.4
        elif snipers_percent >= 25:  # 25%+ = strong whale interest
            score += 0.3
        elif snipers_percent >= 10:  # 10%+ = moderate whale activity
            score += 0.2
        elif snipers_percent > 0:
            score += snipers_percent / 100
        
        # Dev ownership (lower is better for safety)
        dev_percent = token_data.get('dev_holds_percent', 0)
        if dev_percent <= 5:  # Dev holds less than 5% = safer
            score += 0.1
        elif dev_percent >= 50:  # Dev holds 50%+ = risky
            score -= 0.2
        
        # LP burned = safer investment
        if token_data.get('lp_burned', False):
            score += 0.1
        
        # Platform trust factor
        platform = token_data.get('platform', '')
        if 'Raydium' in platform or 'Meteora' in platform:
            score += 0.1
        elif 'Pump AMM' in platform:
            score += 0.05
        
        # Social presence factor
        if token_data.get('website'):
            score += 0.05
        if token_data.get('twitter'):
            score += 0.05
        if token_data.get('telegram'):
            score += 0.05
        
        return min(1.0, max(0.0, score))

    async def handle_structured_message(self, data: dict, endpoint: str):
        """Handle structured JSON messages"""
        
        if 'type' in data:
            self.logger.info(f"📋 {endpoint} Message type: {data['type']}")
            
            # Check if data contains nested array
            if 'data' in data and isinstance(data['data'], list):
                await self.process_token_array(data['data'], f"{endpoint}-nested")
        
        # Check for other interesting fields
        interesting_fields = ['whales', 'tokens', 'transactions', 'updates']
        for field in interesting_fields:
            if field in data:
                self.logger.info(f"📊 {endpoint} Contains {field}: {type(data[field])}")

    async def handle_non_json_data(self, raw_message, endpoint: str, msg_num: int):
        """Handle non-JSON messages"""
        
        self.logger.info(f"📄 {endpoint} Non-JSON message #{msg_num}")
        
        # Check if it might be compressed or binary
        if isinstance(raw_message, bytes):
            self.logger.info(f"    Binary data: {len(raw_message)} bytes")
            if len(raw_message) < 1000:  # Show hex for small messages
                hex_preview = raw_message.hex()[:200]
                self.logger.info(f"    Hex: {hex_preview}...")

    async def record_whale_discovery(self, token_data: dict, confidence: float, raw_data):
        """Record a whale discovery"""
        
        whale_address = token_data['creator_address']
        
        # Avoid duplicates
        if whale_address in self.discovered_whales:
            existing = self.discovered_whales[whale_address]
            if confidence > existing.confidence_score:
                existing.confidence_score = confidence
                self.logger.info(f"🔄 Updated whale {whale_address[:8]}... (Score: {confidence:.1%})")
            return
        
        # Create whale discovery record  
        whale = WhaleDiscovery(
            timestamp=token_data['timestamp'],
            whale_address=whale_address,
            token_address=token_data.get('token_address', ''),
            token_name=token_data.get('token_name', 'Unknown'),
            token_ticker=token_data.get('token_ticker', 'UNKNOWN'),
            volume_sol=token_data.get('volume_sol', 0),
            market_cap_sol=token_data.get('market_cap_sol', 0),
            liquidity_sol=token_data.get('liquidity_sol', 0),
            platform=token_data.get('platform', 'Unknown'),
            confidence_score=confidence,
            raw_data=raw_data
        )
        
        # Add to discovered whales
        self.discovered_whales[whale_address] = whale
        self.metrics['whales_discovered'] += 1
        self.metrics['last_whale_time'] = time.time()
        
        self.logger.info(f"🐋 WHALE DISCOVERED #{self.metrics['whales_discovered']}!")
        self.logger.info(f"   Address: {whale_address[:8]}...")
        self.logger.info(f"   Token: {whale.token_ticker} ({whale.token_name})")
        self.logger.info(f"   Volume: {whale.volume_sol:.1f} SOL")
        self.logger.info(f"   Platform: {whale.platform}")
        self.logger.info(f"   Confidence: {confidence:.1%}")
        self.logger.info(f"   Source: {token_data['source']}")
        
        # Auto-add high confidence whales
        if confidence > 0.7:
            await self.auto_add_whale(whale)

    async def auto_add_whale(self, whale: WhaleDiscovery):
        """Auto-add whale to tracking configuration"""
        
        try:
            # Create/load tracking config
            config_path = Path('config/tracked-wallets.json')
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = json.load(f)
            else:
                config = {'wallets': []}
            
            # Add whale configuration
            whale_config = {
                'address': whale.whale_address,
                'name': f'working-whale-{whale.token_ticker}-{int(whale.timestamp)}',
                'enabled': True,
                'priority': 'high',
                'notes': f'Working discovery: {whale.token_name} (Score: {whale.confidence_score:.1%})',
                'discoveryScore': whale.confidence_score,
                'autoDiscovered': True,
                'discoveryTimestamp': whale.timestamp,
                'tokenData': whale.to_dict()
            }
            
            config['wallets'].append(whale_config)
            
            # Save configuration
            config_path.parent.mkdir(exist_ok=True)
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            self.metrics['auto_added'] += 1
            self.logger.info(f"✅ AUTO-ADDED whale {whale.whale_address[:8]}... to tracking")
            
        except Exception as e:
            self.logger.error(f"❌ Auto-add error: {e}")

    async def status_monitor(self):
        """Monitor and report system status"""
        
        while self.running:
            await asyncio.sleep(60)  # Report every minute
            
            uptime = time.time() - self.metrics['start_time']
            rate = self.metrics['messages_received'] / max(uptime, 1)
            
            # Time since last whale
            time_since_whale = time.time() - self.metrics['last_whale_time'] if self.metrics['last_whale_time'] > 0 else 0
            
            self.logger.info(f"\n📊 WORKING WHALE DISCOVERY STATUS:")
            self.logger.info(f"   ⏰ Uptime: {uptime:.0f}s")
            self.logger.info(f"   📨 Messages: {self.metrics['messages_received']}")
            self.logger.info(f"   📈 Rate: {rate:.2f} msgs/sec")
            self.logger.info(f"   🐋 Whales Found: {self.metrics['whales_discovered']}")
            self.logger.info(f"   🎯 Auto-Added: {self.metrics['auto_added']}")
            self.logger.info(f"   🔌 Connections: {len(self.ws_connections)}")
            self.logger.info(f"   ⏱️ Last Whale: {time_since_whale:.0f}s ago" if time_since_whale > 0 else "   ⏱️ Last Whale: Never")
            
            # Show top whales
            if self.discovered_whales:
                sorted_whales = sorted(
                    self.discovered_whales.values(), 
                    key=lambda w: w.confidence_score, 
                    reverse=True
                )[:3]
                
                self.logger.info(f"\n🏆 TOP WHALES:")
                for i, whale in enumerate(sorted_whales, 1):
                    self.logger.info(f"   {i}. {whale.whale_address[:8]}... {whale.token_ticker} "
                                   f"({whale.confidence_score:.1%}) {whale.volume_sol:.1f} SOL")

    async def shutdown(self):
        """Graceful shutdown"""
        self.logger.info("🛑 Shutting down whale discovery...")
        self.running = False
        
        # Close WebSocket connections
        for endpoint, ws in self.ws_connections.items():
            try:
                await ws.close()
                self.logger.info(f"🔌 Closed {endpoint} connection")
            except:
                pass
        
        # Save discoveries
        await self.save_discoveries()
        
        self.logger.info("✅ Shutdown complete")

    async def save_discoveries(self):
        """Save discovered whales to file"""
        try:
            if not self.discovered_whales:
                return
                
            save_path = Path(f'data/whale_discoveries_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            save_path.parent.mkdir(exist_ok=True)
            
            discoveries = [whale.to_dict() for whale in self.discovered_whales.values()]
            with open(save_path, 'w') as f:
                json.dump(discoveries, f, indent=2)
            
            self.logger.info(f"💾 Saved {len(discoveries)} discoveries to {save_path}")
            
        except Exception as e:
            self.logger.error(f"❌ Save error: {e}")

async def main():
    """Main entry point"""
    discovery = WorkingWhaleDiscovery()
    
    try:
        await discovery.start_real_discovery()
    except KeyboardInterrupt:
        print("\n🛑 System stopped by user")
        discovery.running = False
        await discovery.shutdown()
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()
        await discovery.shutdown()

if __name__ == "__main__":
    print("🚀 WORKING WHALE DISCOVERY SYSTEM")
    print("🔗 Direct WebSocket - No Bridge Dependencies")
    print("📡 Real Authentication & Adaptive Data Parsing")
    print("🐋 Comprehensive Message Analysis & Whale Detection")
    print("═══════════════════════════════════════════════════")
    asyncio.run(main())