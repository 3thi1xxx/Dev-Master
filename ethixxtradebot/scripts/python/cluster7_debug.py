#!/usr/bin/env python3
"""
Cluster7 Debug - Multiple Connection Approaches
Try different methods to match browser behavior exactly
"""

import asyncio
import json
import time
import logging
import websockets
from datetime import datetime

class Cluster7Debug:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
    async def test_approach_1_exact_browser(self):
        """Test with exact browser headers from your data"""
        self.logger.info("\n🧪 APPROACH 1: EXACT BROWSER HEADERS")
        
        # Exact headers from your browser connection
        headers = {
            ':authority': 'cluster7.axiom.trade',
            ':method': 'GET', 
            ':path': '/?',
            ':scheme': 'wss',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'connection': 'Upgrade',
            'host': 'cluster7.axiom.trade',
            'origin': 'https://axiom.trade',
            'pragma': 'no-cache',
            'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
            'sec-websocket-version': '13',
            'upgrade': 'websocket',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        return await self.try_connection('wss://cluster7.axiom.trade/?', headers, "exact browser")
    
    async def test_approach_2_minimal(self):
        """Test with minimal headers"""
        self.logger.info("\n🧪 APPROACH 2: MINIMAL HEADERS")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Origin': 'https://axiom.trade'
        }
        
        return await self.try_connection('wss://cluster7.axiom.trade/', headers, "minimal")
    
    async def test_approach_3_no_query(self):
        """Test without the ? query parameter"""
        self.logger.info("\n🧪 APPROACH 3: NO QUERY PARAMETER")
        
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        return await self.try_connection('wss://cluster7.axiom.trade', headers, "no query")
    
    async def test_approach_4_different_path(self):
        """Test different URL paths"""
        self.logger.info("\n🧪 APPROACH 4: DIFFERENT PATHS")
        
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        paths = [
            'wss://cluster7.axiom.trade/ws',
            'wss://cluster7.axiom.trade/websocket',
            'wss://cluster7.axiom.trade/api',
            'wss://cluster7.axiom.trade/feed'
        ]
        
        for path in paths:
            success = await self.try_connection(path, headers, f"path: {path}")
            if success:
                return True
        return False
    
    async def test_approach_5_with_session(self):
        """Test with potential session context"""
        self.logger.info("\n🧪 APPROACH 5: WITH SESSION CONTEXT")
        
        # Try to establish session context first
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://axiom.trade/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        return await self.try_connection('wss://cluster7.axiom.trade/?', headers, "with session")
    
    async def try_connection(self, url: str, headers: dict, approach_name: str):
        """Try a connection approach"""
        try:
            self.logger.info(f"🔌 Trying {approach_name}: {url}")
            
            # Clean headers - remove HTTP/2 specific ones
            clean_headers = {}
            for key, value in headers.items():
                if not key.startswith(':') and key.lower() not in ['connection', 'upgrade', 'host']:
                    clean_headers[key] = value
            
            async with websockets.connect(
                url,
                additional_headers=clean_headers,
                ping_interval=30,
                close_timeout=5
            ) as ws:
                self.logger.info(f"✅ SUCCESS! {approach_name} connected!")
                
                # Quick test for data
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=3)
                    self.logger.info(f"📨 Got data: {str(message)[:100]}...")
                    return True
                except asyncio.TimeoutError:
                    self.logger.info("📡 Connected but no immediate data")
                    return True
                    
        except websockets.exceptions.InvalidStatusCode as e:
            self.logger.error(f"❌ {approach_name} failed: HTTP {e.status_code}")
        except Exception as e:
            self.logger.error(f"❌ {approach_name} failed: {e}")
        
        return False
    
    async def run_all_tests(self):
        """Run all connection tests"""
        self.logger.info("🚀 CLUSTER7 COMPREHENSIVE DEBUG")
        self.logger.info("=" * 60)
        
        approaches = [
            self.test_approach_1_exact_browser,
            self.test_approach_2_minimal,
            self.test_approach_3_no_query,
            self.test_approach_4_different_path,
            self.test_approach_5_with_session
        ]
        
        for i, approach in enumerate(approaches, 1):
            self.logger.info(f"\n{'='*20} TEST {i}/5 {'='*20}")
            success = await approach()
            if success:
                self.logger.info(f"🎉 BREAKTHROUGH! Approach {i} works!")
                return True
            await asyncio.sleep(1)  # Brief pause between attempts
        
        self.logger.info("\n🤔 All approaches failed. Additional ideas:")
        self.logger.info("   • IP-based authentication (browser whitelisted)")
        self.logger.info("   • Session-based auth (browser has active session)")
        self.logger.info("   • Rate limiting (browser connects, Python blocked)")
        self.logger.info("   • Different WebSocket protocol version")
        
        return False

async def main():
    debugger = Cluster7Debug()
    success = await debugger.run_all_tests()
    
    if not success:
        print("\n💡 ALTERNATIVE STRATEGY:")
        print("   Focus on Eucalyptus + Hyperliquid (both working)")
        print("   These might already contain the cluster7 data!")

if __name__ == "__main__":
    asyncio.run(main()) 