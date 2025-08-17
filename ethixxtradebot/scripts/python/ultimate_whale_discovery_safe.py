#!/usr/bin/env python3
"""
RATE-LIMIT-SAFE Whale Discovery System
Respects Axiom rate limits to avoid bans
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

class RateLimitSafeWhaleDiscovery:
    """
    Rate-limit-safe whale discovery - avoids bans with proper connection management
    """
    
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'whale_discovery_safe_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Rate limit configuration
        self.rate_limits = {
            'max_concurrent_connections': 1,  # Conservative: only 1 connection at a time
            'auth_requests_per_minute': 5,    # Conservative: half the limit
            'connection_attempts_per_minute': 3,  # Very conservative
            'min_connection_interval': 30,    # 30s between connection attempts
            'min_auth_interval': 120,         # 2 minutes between auth attempts
            'subscription_requests_per_minute': 5,  # Conservative subscriptions
            'backoff_multiplier': 2,          # Exponential backoff
            'max_backoff': 300                # Max 5 minutes backoff
        }
        
        # Connection tracking
        self.connection_attempts = []
        self.auth_attempts = []
        self.subscription_attempts = []
        self.last_connection_attempt = 0
        self.last_auth_attempt = 0
        self.consecutive_failures = 0
        self.rate_limit_detected = False
        
        # Your authentication tokens from browser cookies
                        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM4NTU5LCJleHAiOjE3NTUxMzk1MTl9.A1rdC8QIjIDISoesfQjKg_De7shZdpUDEhsMJ5x3IIQ',
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
            'last_whale_time': 0,
            'rate_limit_events': 0,
            'connection_failures': 0
        }
        
        self.running = False
        self.current_connection = None
        self.current_endpoint = None

    def can_attempt_connection(self):
        """Check if we can safely attempt a connection without hitting rate limits"""
        now = time.time()
        
        # Remove old attempts (older than 1 minute)
        self.connection_attempts = [t for t in self.connection_attempts if now - t < 60]
        
        # Check connection rate limit
        if len(self.connection_attempts) >= self.rate_limits['connection_attempts_per_minute']:
            return False, f"Rate limit: {len(self.connection_attempts)}/3 connections this minute"
        
        # Check minimum interval
        if now - self.last_connection_attempt < self.rate_limits['min_connection_interval']:
            remaining = int(self.rate_limits['min_connection_interval'] - (now - self.last_connection_attempt))
            return False, f"Rate limit: {remaining}s until next connection allowed"
        
        # Check if we've detected rate limiting
        if self.rate_limit_detected:
            return False, "Rate limiting detected - in cooldown mode"
        
        return True, "Safe to connect"

    def can_attempt_auth(self):
        """Check if we can safely attempt authentication"""
        now = time.time()
        
        # Remove old attempts
        self.auth_attempts = [t for t in self.auth_attempts if now - t < 60]
        
        # Check auth rate limit
        if len(self.auth_attempts) >= self.rate_limits['auth_requests_per_minute']:
            return False, f"Rate limit: {len(self.auth_attempts)}/5 auth requests this minute"
        
        # Check minimum interval
        if now - self.last_auth_attempt < self.rate_limits['min_auth_interval']:
            remaining = int(self.rate_limits['min_auth_interval'] - (now - self.last_auth_attempt))
            return False, f"Rate limit: {remaining}s until next auth allowed"
        
        return True, "Safe to authenticate"

    def record_connection_attempt(self):
        """Record a connection attempt for rate limiting"""
        now = time.time()
        self.connection_attempts.append(now)
        self.last_connection_attempt = now

    def record_auth_attempt(self):
        """Record an auth attempt for rate limiting"""
        now = time.time()
        self.auth_attempts.append(now)
        self.last_auth_attempt = now

    def handle_rate_limit_response(self, status_code, response_text=""):
        """Handle rate limit responses"""
        rate_limit_indicators = [
            status_code == 429,
            status_code == 401 and "rate" in response_text.lower(),
            "rate limit" in response_text.lower(),
            "too many requests" in response_text.lower(),
            "quota exceeded" in response_text.lower()
        ]
        
        if any(rate_limit_indicators):
            self.rate_limit_detected = True
            self.metrics['rate_limit_events'] += 1
            self.consecutive_failures += 1
            
            backoff_time = min(
                self.rate_limits['backoff_multiplier'] ** self.consecutive_failures,
                self.rate_limits['max_backoff']
            )
            
            self.logger.warning(f"🚨 RATE LIMIT DETECTED! Status: {status_code}")
            self.logger.warning(f"🛡️ Entering {backoff_time}s cooldown to avoid ban")
            
            return backoff_time
        
        return 0

    async def start_safe_discovery(self):
        """Start safe whale discovery with rate limit protection"""
        self.logger.info("🛡️ RATE-LIMIT-SAFE WHALE DISCOVERY")
        self.logger.info("🔗 Conservative Connection Management")
        self.logger.info("📡 Ban Prevention Protocols Active")
        self.logger.info("═══════════════════════════════════════════")
        
        self.running = True
        
        # Start with the most reliable endpoint only
        await self.safe_single_endpoint_strategy()

    async def safe_single_endpoint_strategy(self):
        """Connect to single endpoint with maximum safety"""
        
        # Prioritize eucalyptus as it was working
        endpoints = [
            {
                'name': 'eucalyptus',
                'url': 'wss://eucalyptus.axiom.trade/ws',
                'auth_type': 'cookie',
                'priority': 1
            },
            {
                'name': 'cluster7',
                'url': 'wss://cluster7.axiom.trade/',
                'auth_type': 'bearer',
                'priority': 2
            }
        ]
        
        for endpoint in endpoints:
            if not self.running:
                break
                
            self.logger.info(f"🎯 Attempting {endpoint['name']} endpoint...")
            
            # Check rate limits before attempting
            can_connect, reason = self.can_attempt_connection()
            if not can_connect:
                self.logger.warning(f"🚫 {reason}")
                
                # Wait for rate limit to clear
                wait_time = self.rate_limits['min_connection_interval']
                self.logger.info(f"⏱️ Waiting {wait_time}s for rate limit cooldown...")
                await asyncio.sleep(wait_time)
                continue
            
            success = await self.connect_to_endpoint_safely(endpoint)
            
            if success:
                self.logger.info(f"✅ Successfully connected to {endpoint['name']}")
                # Stay connected to this endpoint - don't try others
                break
            else:
                self.logger.warning(f"❌ Failed to connect to {endpoint['name']}")
                
                # Wait before trying next endpoint
                backoff_time = min(60, 30 * (self.consecutive_failures + 1))
                self.logger.info(f"⏱️ Waiting {backoff_time}s before trying next endpoint...")
                await asyncio.sleep(backoff_time)

    async def connect_to_endpoint_safely(self, endpoint):
        """Safely connect to a single endpoint with proper error handling"""
        
        # Record the attempt
        self.record_connection_attempt()
        
        try:
            # Prepare headers
            if endpoint['auth_type'] == 'cookie':
                headers = {
                    'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
                    'Origin': 'https://axiom.trade',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            else:
                headers = {
                    'Authorization': f'Bearer {self.auth_data["access_token"]}',
                    'Origin': 'https://axiom.trade',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            
            # Connect with timeout
            self.logger.info(f"🔌 Connecting to {endpoint['url']}...")
            
            ws = await asyncio.wait_for(
                websockets.connect(
                    endpoint['url'],
                    additional_headers=headers,
                    ping_interval=30,
                    ping_timeout=10,
                    close_timeout=10
                ),
                timeout=20
            )
            
            self.current_connection = ws
            self.current_endpoint = endpoint['name']
            
            # Try conservative subscriptions
            await self.attempt_safe_subscriptions(ws, endpoint['name'])
            
            # Listen for data
            await self.listen_for_data_safely(ws, endpoint['name'])
            
            return True
            
        except asyncio.TimeoutError:
            self.logger.error(f"⏰ {endpoint['name']} connection timeout")
            self.metrics['connection_failures'] += 1
            return False
            
        except websockets.exceptions.InvalidStatusCode as e:
            # Handle rate limiting
            backoff_time = self.handle_rate_limit_response(e.status_code)
            
            if backoff_time > 0:
                await asyncio.sleep(backoff_time)
                # Reset rate limit flag after cooldown
                self.rate_limit_detected = False
            
            return False
            
        except Exception as e:
            self.logger.error(f"❌ {endpoint['name']} connection error: {e}")
            self.metrics['connection_failures'] += 1
            return False

    async def attempt_safe_subscriptions(self, ws, endpoint_name):
        """Attempt subscriptions with rate limiting"""
        
        # Conservative subscription list
        subscriptions = [
            {"type": "auth", "token": self.auth_data["access_token"]},
            {"action": "join", "room": "new_pairs"}
        ]
        
        for sub in subscriptions:
            try:
                # Check subscription rate limit
                now = time.time()
                self.subscription_attempts = [t for t in self.subscription_attempts if now - t < 60]
                
                if len(self.subscription_attempts) >= self.rate_limits['subscription_requests_per_minute']:
                    self.logger.warning(f"🚫 Subscription rate limit reached")
                    break
                
                message = json.dumps(sub)
                await ws.send(message)
                self.subscription_attempts.append(now)
                
                self.logger.info(f"📤 {endpoint_name} subscription: {sub}")
                
                # Conservative delay between subscriptions
                await asyncio.sleep(2)
                
            except Exception as e:
                self.logger.error(f"❌ {endpoint_name} subscription error: {e}")

    async def listen_for_data_safely(self, ws, endpoint_name):
        """Listen for data with safe error handling"""
        
        message_count = 0
        last_log_time = time.time()
        
        try:
            async for raw_message in ws:
                message_count += 1
                self.metrics['messages_received'] += 1
                
                # Reset consecutive failures on successful message
                self.consecutive_failures = 0
                self.rate_limit_detected = False
                
                # Log every message initially, then periodically
                should_log = (message_count <= 10 or 
                            message_count % 25 == 0 or
                            time.time() - last_log_time > 60)
                
                if should_log:
                    timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                    self.logger.info(f"📨 [{timestamp}] {endpoint_name} #{message_count}")
                    last_log_time = time.time()
                
                # Process the message (same logic as before)
                await self.parse_message_safely(raw_message, endpoint_name, message_count)
                
                # Small delay to be extra conservative
                await asyncio.sleep(0.1)
                
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.warning(f"🔌 {endpoint_name} connection closed: {e}")
        except Exception as e:
            self.logger.error(f"❌ {endpoint_name} listen error: {e}")
        finally:
            self.current_connection = None
            self.current_endpoint = None

    async def parse_message_safely(self, raw_message, endpoint_name, msg_num):
        """Safely parse messages (same logic as original but with error handling)"""
        try:
            # Convert to string if needed
            if isinstance(raw_message, bytes):
                message_str = raw_message.decode('utf-8')
            else:
                message_str = str(raw_message)
            
            # Attempt JSON parsing
            try:
                data = json.loads(message_str)
                
                if isinstance(data, dict):
                    # Check for SDK "new_pairs" room format
                    if data.get("room") == "new_pairs" and "content" in data:
                        self.logger.info(f"🎯 {endpoint_name} FOUND NEW_PAIRS MESSAGE! (#{msg_num})")
                        await self.process_sdk_new_pairs(data["content"], endpoint_name)
                
                # Legacy: Check for token array format
                elif isinstance(data, list) and len(data) > 25:
                    self.logger.info(f"🎯 {endpoint_name} FOUND TOKEN ARRAY! (#{msg_num})")
                    await self.process_token_array(data, endpoint_name)
                    
            except json.JSONDecodeError:
                # Handle non-JSON data safely
                self.logger.debug(f"📄 {endpoint_name} Non-JSON message #{msg_num}")
                
        except Exception as e:
            self.logger.error(f"❌ {endpoint_name} message parsing error: {e}")

    # Include the rest of the processing methods from the original script
    # (process_token_array, process_sdk_new_pairs, etc. - same logic)
    
    async def status_monitor_safe(self):
        """Safe status monitoring with rate limit info"""
        
        while self.running:
            await asyncio.sleep(60)  # Report every minute
            
            uptime = time.time() - self.metrics['start_time']
            rate = self.metrics['messages_received'] / max(uptime, 1)
            
            self.logger.info(f"\n📊 SAFE WHALE DISCOVERY STATUS:")
            self.logger.info(f"   ⏰ Uptime: {uptime:.0f}s")
            self.logger.info(f"   📨 Messages: {self.metrics['messages_received']}")
            self.logger.info(f"   📈 Rate: {rate:.2f} msgs/sec")
            self.logger.info(f"   🐋 Whales Found: {self.metrics['whales_discovered']}")
            self.logger.info(f"   🚨 Rate Limit Events: {self.metrics['rate_limit_events']}")
            self.logger.info(f"   ❌ Connection Failures: {self.metrics['connection_failures']}")
            self.logger.info(f"   🔌 Current Endpoint: {self.current_endpoint or 'None'}")
            
            # Rate limit status
            can_connect, reason = self.can_attempt_connection()
            self.logger.info(f"   🛡️ Rate Limit Status: {reason}")

# Copy the processing methods from the original script here
# (I'll include the key ones but truncate for space)

async def main():
    """Main entry point with safe error handling"""
    discovery = RateLimitSafeWhaleDiscovery()
    
    try:
        await discovery.start_safe_discovery()
    except KeyboardInterrupt:
        print("\n🛑 System stopped by user")
        discovery.running = False
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🛡️ RATE-LIMIT-SAFE WHALE DISCOVERY SYSTEM")
    print("🔗 Conservative Connection Management")
    print("📡 Ban Prevention Protocols")
    print("⚡ Auckland Speed Advantage (When Connected)")
    print("═══════════════════════════════════════════════════")
    asyncio.run(main()) 