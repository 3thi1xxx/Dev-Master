#!/usr/bin/env python3
"""
Authentication Detection Test
Tests different auth approaches based on 401 error analysis
"""

import websocket
import json
import os

def test_with_cookies():
    """Test using browser cookies from .env.dev file"""
    print("🧪 Testing with cookies from .env.dev...")
    
    try:
        # Read tokens from .env.dev
        with open('.env.dev', 'r') as f:
            content = f.read()
            
        access_token = None
        refresh_token = None
        
        for line in content.split('\n'):
            if line.startswith('AXIOM_ACCESS_TOKEN='):
                access_token = line.split('=', 1)[1]
            elif line.startswith('AXIOM_REFRESH_TOKEN='):
                refresh_token = line.split('=', 1)[1]
        
        if not access_token or not refresh_token:
            print("❌ No tokens found in .env.dev")
            return False
            
        print(f"🔑 Found access token: {access_token[:20]}...")
        print(f"🔑 Found refresh token: {refresh_token[:20]}...")
        
        # Test cluster7 with cookies
        headers = {
            'Origin': 'https://axiom.trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': f'auth-access-token={access_token}; auth-refresh-token={refresh_token}'
        }
        
        url = "wss://cluster7.axiom.trade/?"
        
        print(f"🔌 Connecting with cookies...")
        ws = websocket.create_connection(url, header=headers, timeout=10)
        print("✅ cluster7 connected with cookies!")
        
        # Try to get a message
        try:
            message = ws.recv()
            print(f"📨 First message: {message[:100]}...")
            ws.close()
            return True
        except:
            ws.close()
            return True  # Connected even if no immediate message
            
    except Exception as e:
        print(f"❌ Cookie test failed: {e}")
        return False

def test_different_urls():
    """Test different URL variations"""
    print("\n🧪 Testing URL variations...")
    
    headers = {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    urls_to_test = [
        "wss://cluster7.axiom.trade/",
        "wss://cluster7.axiom.trade",
        "wss://cluster7.axiom.trade/?auth=anonymous",
        "wss://eucalyptus.axiom.trade/ws",
        "wss://eucalyptus.axiom.trade/",
    ]
    
    for url in urls_to_test:
        try:
            print(f"🔌 Testing: {url}")
            ws = websocket.create_connection(url, header=headers, timeout=5)
            print(f"✅ SUCCESS: {url}")
            ws.close()
            return url
        except Exception as e:
            print(f"❌ FAILED: {url} - {str(e)[:100]}")
    
    return None

def test_ip_timing():
    """Test if issue is IP-based or timing-based"""
    print("\n🧪 Testing IP/timing factors...")
    
    import time
    import requests
    
    # Check our IP
    try:
        response = requests.get('https://httpbin.org/ip', timeout=5)
        our_ip = response.json()['origin']
        print(f"🌐 Our IP: {our_ip}")
    except:
        print("❌ Couldn't determine IP")
    
    # Check if we can reach axiom.trade
    try:
        response = requests.get('https://axiom.trade', timeout=10)
        print(f"🌐 axiom.trade reachable: {response.status_code}")
    except Exception as e:
        print(f"❌ axiom.trade unreachable: {e}")
        
    return True

def main():
    print("🕵️ AUTHENTICATION DETECTION TEST")
    print("=" * 50)
    
    # Test 1: Try with browser cookies
    cookie_works = test_with_cookies()
    
    # Test 2: Try different URL formats
    working_url = test_different_urls()
    
    # Test 3: Check IP/network factors
    test_ip_timing()
    
    print("\n📊 ANALYSIS:")
    print("=" * 50)
    
    if cookie_works:
        print("✅ SOLUTION FOUND: Browser cookies are required!")
        print("💡 The browser automatically sends auth cookies")
        print("🔧 We need to include cookie headers in our connections")
    elif working_url:
        print(f"✅ SOLUTION FOUND: Different URL format works: {working_url}")
        print("💡 URL format matters - browser uses different endpoint")
    else:
        print("❌ STILL INVESTIGATING: May be IP restriction or other factor")
        print("🔍 Browser has some authentication we haven't identified")
        
    print("\n🎯 NEXT STEPS:")
    if cookie_works:
        print("1. Update existing WebSocket code to include cookie headers")
        print("2. Test cluster7 goldmine access with authentication")
        print("3. Verify data flow matches browser")
    else:
        print("1. Capture more detailed browser network traffic") 
        print("2. Check if browser location/IP matters")
        print("3. Look for hidden authentication mechanisms")

if __name__ == "__main__":
    main() 