#!/usr/bin/env python3
"""
Rate Limit Checker for Axiom Trade
Determines if we're currently blocked and safe recovery time
"""

import asyncio
import time
import aiohttp
import websockets
from datetime import datetime, timedelta

class RateLimitChecker:
    def __init__(self):
        self.auth_data = {
            'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzU1MTM0Mzg1LCJleHAiOjE3NTUxMzUzNDV9.kdhX-tFFnfknbjuShgX2R-Le0owu9n6pyV7rBniOo4k',
            'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6Ijg1ZTcxNDFiLWQ3NTItNDVlYy1hNWE0LTg0NTZiZTkzZjY5NyIsImlhdCI6MTc1NTA1NTQyN30.mrRjzp7BOE4tDhLorJJTZj5sGvw9S8i4r5igI-3igic'
        }
        
        self.test_results = {
            'http_api': None,
            'websocket_eucalyptus': None,
            'websocket_cluster7': None,
            'overall_status': None,
            'recommended_wait_time': 0
        }

    async def check_http_api_rate_limit(self):
        """Check if HTTP API is rate limited"""
        print("🌐 Testing HTTP API access...")
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                # Test trending endpoint (doesn't require much auth)
                url = "https://api6.axiom.trade/meme-trending?timePeriod=1h"
                headers = {
                    'Cookie': f'auth-access-token={self.auth_data["access_token"]}',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
                
                start_time = time.time()
                async with session.get(url, headers=headers) as response:
                    latency = int((time.time() - start_time) * 1000)
                    
                    if response.status == 200:
                        data = await response.json()
                        self.test_results['http_api'] = {
                            'status': 'OK',
                            'latency': latency,
                            'data_length': len(data) if isinstance(data, list) else 0
                        }
                        print(f"   ✅ HTTP API: OK ({latency}ms, {self.test_results['http_api']['data_length']} tokens)")
                        return True
                        
                    elif response.status == 429:
                        retry_after = response.headers.get('Retry-After', '300')
                        self.test_results['http_api'] = {
                            'status': 'RATE_LIMITED',
                            'retry_after': int(retry_after),
                            'message': 'HTTP 429 Too Many Requests'
                        }
                        print(f"   🚫 HTTP API: RATE LIMITED (retry after {retry_after}s)")
                        return False
                        
                    elif response.status == 401:
                        self.test_results['http_api'] = {
                            'status': 'AUTH_FAILED',
                            'message': 'HTTP 401 Unauthorized - tokens expired'
                        }
                        print(f"   🔐 HTTP API: AUTH FAILED (tokens expired)")
                        return False
                        
                    else:
                        error_text = await response.text()
                        self.test_results['http_api'] = {
                            'status': 'ERROR',
                            'code': response.status,
                            'message': error_text[:100]
                        }
                        print(f"   ❌ HTTP API: ERROR {response.status}")
                        return False
                        
        except asyncio.TimeoutError:
            self.test_results['http_api'] = {
                'status': 'TIMEOUT',
                'message': 'Request timeout - possible connection issues'
            }
            print("   ⏰ HTTP API: TIMEOUT")
            return False
            
        except Exception as e:
            self.test_results['http_api'] = {
                'status': 'EXCEPTION',
                'message': str(e)
            }
            print(f"   ❌ HTTP API: EXCEPTION - {e}")
            return False

    async def check_websocket_rate_limit(self, endpoint_name, url, auth_type):
        """Check if WebSocket endpoint is rate limited"""
        print(f"🔌 Testing {endpoint_name} WebSocket...")
        
        try:
            # Prepare headers
            if auth_type == 'cookie':
                headers = {
                    'Cookie': f'auth-access-token={self.auth_data["access_token"]}',
                    'Origin': 'https://axiom.trade',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            else:
                headers = {
                    'Authorization': f'Bearer {self.auth_data["access_token"]}',
                    'Origin': 'https://axiom.trade',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            
            start_time = time.time()
            
            # Quick connection test with timeout
            ws = await asyncio.wait_for(
                websockets.connect(
                    url,
                    additional_headers=headers,
                    ping_interval=None,  # Disable pings for quick test
                    close_timeout=5
                ),
                timeout=10
            )
            
            connection_time = int((time.time() - start_time) * 1000)
            
            # Send one test subscription
            test_message = '{"type": "ping"}'
            await ws.send(test_message)
            
            # Wait briefly for response
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=5)
                await ws.close()
                
                self.test_results[f'websocket_{endpoint_name}'] = {
                    'status': 'OK',
                    'connection_time': connection_time,
                    'response_received': True
                }
                print(f"   ✅ {endpoint_name}: OK ({connection_time}ms)")
                return True
                
            except asyncio.TimeoutError:
                await ws.close()
                self.test_results[f'websocket_{endpoint_name}'] = {
                    'status': 'CONNECTED_NO_RESPONSE',
                    'connection_time': connection_time,
                    'response_received': False
                }
                print(f"   ⚠️ {endpoint_name}: Connected but no response ({connection_time}ms)")
                return True  # Still counts as working
                
        except websockets.exceptions.InvalidStatusCode as e:
            if e.status_code == 429:
                self.test_results[f'websocket_{endpoint_name}'] = {
                    'status': 'RATE_LIMITED',
                    'code': e.status_code,
                    'message': 'WebSocket 429 Too Many Requests'
                }
                print(f"   🚫 {endpoint_name}: RATE LIMITED (HTTP {e.status_code})")
                return False
            elif e.status_code == 401:
                self.test_results[f'websocket_{endpoint_name}'] = {
                    'status': 'AUTH_FAILED',
                    'code': e.status_code,
                    'message': 'WebSocket 401 Unauthorized'
                }
                print(f"   🔐 {endpoint_name}: AUTH FAILED (HTTP {e.status_code})")
                return False
            else:
                self.test_results[f'websocket_{endpoint_name}'] = {
                    'status': 'ERROR',
                    'code': e.status_code,
                    'message': f'WebSocket HTTP {e.status_code}'
                }
                print(f"   ❌ {endpoint_name}: ERROR (HTTP {e.status_code})")
                return False
                
        except asyncio.TimeoutError:
            self.test_results[f'websocket_{endpoint_name}'] = {
                'status': 'TIMEOUT',
                'message': 'WebSocket connection timeout'
            }
            print(f"   ⏰ {endpoint_name}: TIMEOUT")
            return False
            
        except Exception as e:
            self.test_results[f'websocket_{endpoint_name}'] = {
                'status': 'EXCEPTION',
                'message': str(e)
            }
            print(f"   ❌ {endpoint_name}: EXCEPTION - {e}")
            return False

    async def check_all_endpoints(self):
        """Check all endpoints for rate limiting"""
        print("🚨 AXIOM RATE LIMIT STATUS CHECK")
        print("=" * 50)
        print(f"⏰ Check time: {datetime.now().strftime('%H:%M:%S')}")
        print()
        
        # Test HTTP API
        http_ok = await self.check_http_api_rate_limit()
        
        # Test WebSocket endpoints
        eucalyptus_ok = await self.check_websocket_rate_limit(
            'eucalyptus', 
            'wss://eucalyptus.axiom.trade/ws', 
            'cookie'
        )
        
        cluster7_ok = await self.check_websocket_rate_limit(
            'cluster7', 
            'wss://cluster7.axiom.trade/', 
            'bearer'
        )
        
        # Determine overall status
        if http_ok and (eucalyptus_ok or cluster7_ok):
            self.test_results['overall_status'] = 'OK'
            self.test_results['recommended_wait_time'] = 0
        elif not http_ok and not eucalyptus_ok and not cluster7_ok:
            self.test_results['overall_status'] = 'FULLY_BLOCKED'
            self.test_results['recommended_wait_time'] = 1800  # 30 minutes
        else:
            self.test_results['overall_status'] = 'PARTIALLY_BLOCKED'
            self.test_results['recommended_wait_time'] = 600   # 10 minutes
        
        # Print summary
        print()
        print("📊 SUMMARY:")
        print("=" * 20)
        
        status = self.test_results['overall_status']
        wait_time = self.test_results['recommended_wait_time']
        
        if status == 'OK':
            print("✅ STATUS: Systems operational")
            print("🚀 RECOMMENDATION: Safe to proceed with fresh auth")
        elif status == 'PARTIALLY_BLOCKED':
            print("⚠️ STATUS: Partial rate limiting detected")
            print(f"⏱️ RECOMMENDATION: Wait {wait_time//60} minutes before retry")
        else:
            print("🚫 STATUS: Full rate limit in effect")
            print(f"⏱️ RECOMMENDATION: Wait {wait_time//60} minutes before retry")
            print("💡 Consider using different auth tokens or waiting longer")
        
        print()
        return self.test_results

async def main():
    checker = RateLimitChecker()
    results = await checker.check_all_endpoints()
    
    # Additional recommendations
    if results['overall_status'] == 'OK':
        print("🎯 NEXT STEPS:")
        print("1. Extract fresh browser cookies")
        print("2. Update auth tokens carefully")
        print("3. Use rate-limit-safe whale discovery")
        print("4. Monitor for any rate limit responses")
    elif results['overall_status'] == 'PARTIALLY_BLOCKED':
        print("🛡️ RECOVERY STRATEGY:")
        print("1. Wait for rate limits to reset")
        print("2. Extract completely fresh browser cookies")
        print("3. Use ultra-conservative connection settings")
        print("4. Start with single endpoint only")
    else:
        print("🆘 FULL RECOVERY NEEDED:")
        print("1. Wait 30+ minutes for full reset")
        print("2. Clear all browser cookies and re-login")
        print("3. Extract completely fresh authentication")
        print("4. Use maximum safety protocols")

if __name__ == "__main__":
    asyncio.run(main()) 