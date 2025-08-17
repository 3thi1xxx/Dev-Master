#!/usr/bin/env python3
"""
Complete System Test
Quick verification that all components are working with fresh tokens
"""

import asyncio
import json
import time
import logging
import websockets

class CompleteSystemTest:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # FRESH tokens (iat: 1755144421)
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTQ0NDIxLCJleHAiOjE3NTUxNDUzODF9.njjzMD2NL6_CWGPbU8a8ziYN0j2ptAysrhiBQhHzKd8',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic'
        }
        
    async def test_complete_system(self):
        """Test all system components"""
        
        self.logger.info("🧪 COMPLETE SYSTEM TEST")
        self.logger.info("=" * 50)
        
        results = {
            'cluster7': False,
            'hyperliquid': False,
            'eucalyptus': False,
            'master_system': False,
            'javascript_bridge': False
        }
        
        # Test cluster7 goldmine
        results['cluster7'] = await self.test_cluster7()
        
        # Test hyperliquid
        results['hyperliquid'] = await self.test_hyperliquid()
        
        # Test eucalyptus  
        results['eucalyptus'] = await self.test_eucalyptus()
        
        # Generate final report
        await self.generate_test_report(results)
        
        return all(results.values())
    
    async def test_cluster7(self):
        """Test cluster7 goldmine connection"""
        
        self.logger.info("🏆 Testing cluster7 goldmine...")
        
        headers = {
            'Cookie': f'auth-access-token={self.auth_data["access_token"]}; auth-refresh-token={self.auth_data["refresh_token"]}',
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
        
        try:
            async with websockets.connect(
                'wss://cluster7.axiom.trade/?',
                additional_headers=headers,
                ping_interval=30,
                close_timeout=5
            ) as ws:
                self.logger.info("✅ cluster7 connected!")
                
                # Test for new_pairs data
                message = await asyncio.wait_for(ws.recv(), timeout=10)
                data = json.loads(message)
                
                if isinstance(data, dict) and data.get("room") == "new_pairs":
                    self.logger.info("🎯 cluster7 new_pairs data confirmed!")
                    return True
                else:
                    self.logger.info("📨 cluster7 data received (non-new_pairs)")
                    return True
                    
        except Exception as e:
            self.logger.error(f"❌ cluster7 test failed: {e}")
            return False
    
    async def test_hyperliquid(self):
        """Test hyperliquid connection"""
        
        self.logger.info("📈 Testing hyperliquid...")
        
        try:
            async with websockets.connect('wss://api.hyperliquid.xyz/ws') as ws:
                self.logger.info("✅ Hyperliquid connected!")
                
                # Test subscription
                await ws.send(json.dumps({"method": "subscribe", "subscription": {"type": "allMids"}}))
                
                message = await asyncio.wait_for(ws.recv(), timeout=10)
                data = json.loads(message)
                
                if isinstance(data, dict):
                    self.logger.info("📊 Hyperliquid data confirmed!")
                    return True
                    
        except Exception as e:
            self.logger.error(f"❌ Hyperliquid test failed: {e}")
            return False
    
    async def test_eucalyptus(self):
        """Test eucalyptus connection"""
        
        self.logger.info("🔗 Testing eucalyptus...")
        
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
                close_timeout=5
            ) as ws:
                self.logger.info("✅ Eucalyptus connected!")
                
                message = await asyncio.wait_for(ws.recv(), timeout=15)
                data = json.loads(message)
                
                if isinstance(data, list):
                    self.logger.info(f"📊 Eucalyptus data confirmed! ({len(data)} items)")
                    return True
                    
        except Exception as e:
            self.logger.error(f"❌ Eucalyptus test failed: {e}")
            return False
    
    async def generate_test_report(self, results):
        """Generate final test report"""
        
        self.logger.info("\n" + "=" * 50)
        self.logger.info("📊 COMPLETE SYSTEM TEST RESULTS")
        self.logger.info("=" * 50)
        
        for component, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            self.logger.info(f"{component.upper():15} {status}")
        
        total_pass = sum(results.values())
        total_tests = len(results)
        
        self.logger.info("=" * 50)
        self.logger.info(f"OVERALL: {total_pass}/{total_tests} components working")
        
        if total_pass == total_tests:
            self.logger.info("🎉 ALL SYSTEMS GO! Ready for live trading!")
        else:
            self.logger.info("⚠️ Some components need attention")
        
        self.logger.info("=" * 50)

async def main():
    print("🧪 TESTING COMPLETE AXIOM TRADING SYSTEM")
    print("=" * 50)
    print("🎯 Testing all components with fresh tokens")
    print("⚡ cluster7 goldmine, hyperliquid, eucalyptus")
    print("")
    
    tester = CompleteSystemTest()
    success = await tester.test_complete_system()
    
    if success:
        print("\n🚀 SYSTEM READY FOR LIVE TRADING!")
    else:
        print("\n🔧 System needs configuration")

if __name__ == "__main__":
    asyncio.run(main()) 