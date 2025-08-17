#!/usr/bin/env python3
"""
Test with Fresh Browser Tokens
Uses the current working tokens from browser screenshots
"""

import websocket
import json
import time

def test_with_fresh_tokens():
    """Test with the current browser tokens from screenshots"""
    print("🧪 Testing with FRESH browser tokens...")
    
    # TODO: Replace with FULL tokens from browser screenshots
    # From screenshots, I can see they start with "eyJhbGciOiJIUzI1NiIs"
    # Need the complete token values visible in the browser DevTools
    
    print("❗ NEED FULL TOKEN VALUES")
    print("From your screenshots, please provide:")
    print("1. Complete auth-access-token value (starting with eyJhbGciOiJIUzI1NiIs...)")
    print("2. Complete auth-refresh-token value (starting with eyJhbGciOiJIUzI1NiIs...)")
    print("")
    print("You can copy them from DevTools → Application → Cookies → axiom.trade")
    print("Click on each cookie to see the full value in the bottom panel")
    
    # This will be updated once we have the full tokens
    access_token = "PASTE_FULL_ACCESS_TOKEN_HERE"
    refresh_token = "PASTE_FULL_REFRESH_TOKEN_HERE"
    
    if access_token.startswith("PASTE_"):
        print("⚠️ Please update this script with the full token values first")
        return False
    
    headers = {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cookie': f'auth-access-token={access_token}; auth-refresh-token={refresh_token}'
    }
    
    url = "wss://cluster7.axiom.trade/?"
    
    try:
        print(f"🔌 Connecting with fresh browser tokens...")
        print(f"🔑 Access token: {access_token[:30]}...")
        print(f"🔑 Refresh token: {refresh_token[:30]}...")
        
        ws = websocket.create_connection(url, header=headers, timeout=10)
        print("✅ SUCCESS! Connected to cluster7!")
        
        # Listen for goldmine data
        message_count = 0
        start_time = time.time()
        goldmine_found = False
        
        print("🎯 Listening for goldmine data...")
        
        while message_count < 10 and time.time() - start_time < 60:
            try:
                message = ws.recv()
                message_count += 1
                
                try:
                    data = json.loads(message)
                    
                    if isinstance(data, dict) and 'room' in data:
                        room = data['room']
                        content = data.get('content', '')
                        print(f"📨 Room: {room} - {str(content)[:100]}")
                        
                        # Look for specific goldmine rooms
                        if 'new' in room.lower() or 'pair' in room.lower() or 'launch' in room.lower():
                            print(f"🏆 POTENTIAL GOLDMINE: {room}")
                            goldmine_found = True
                            
                    elif isinstance(data, list) and len(data) >= 2:
                        timestamp, wallet = data[0], data[1]
                        print(f"📊 Transaction: {timestamp}, {wallet[:20]}...")
                        
                except json.JSONDecodeError:
                    print(f"📝 Raw message: {str(message)[:100]}...")
                    
            except websocket.WebSocketTimeoutException:
                print("⏰ Timeout waiting for message")
                break
                
        ws.close()
        
        if goldmine_found:
            print("🎉 GOLDMINE ACCESS CONFIRMED!")
        else:
            print("✅ Connection works - monitor longer for goldmine data")
            
        return True
        
    except Exception as e:
        print(f"❌ Still failed: {e}")
        return False

def compare_tokens():
    """Compare old .env.dev tokens with browser tokens"""
    print("\n🔍 Comparing token sources...")
    
    try:
        with open('.env.dev', 'r') as f:
            content = f.read()
            
        old_access = None
        old_refresh = None
        
        for line in content.split('\n'):
            if line.startswith('AXIOM_ACCESS_TOKEN='):
                old_access = line.split('=', 1)[1]
            elif line.startswith('AXIOM_REFRESH_TOKEN='):
                old_refresh = line.split('=', 1)[1]
        
        print(f"📁 .env.dev access:  {old_access[:30] if old_access else 'None'}...")
        print(f"📁 .env.dev refresh: {old_refresh[:30] if old_refresh else 'None'}...")
        print(f"🌐 Browser access:   eyJhbGciOiJIUzI1NiIs... (from screenshot)")
        print(f"🌐 Browser refresh:  eyJhbGciOiJIUzI1NiIs... (from screenshot)")
        
        if old_access and old_access.startswith('eyJhbGciOiJIUzI1NiIs'):
            print("🤔 Tokens have same format - may be timing/expiry issue")
        else:
            print("💡 Tokens are completely different - browser has newer ones")
            
    except Exception as e:
        print(f"❌ Could not read .env.dev: {e}")

def main():
    print("🚀 FRESH BROWSER TOKEN TEST")
    print("=" * 50)
    print("Based on browser screenshots showing working auth cookies")
    
    compare_tokens()
    test_with_fresh_tokens()
    
    print("\n🎯 INSTRUCTIONS:")
    print("1. Copy FULL auth-access-token from browser DevTools")
    print("2. Copy FULL auth-refresh-token from browser DevTools") 
    print("3. Update this script with complete token values")
    print("4. Re-run to test cluster7 goldmine access")

if __name__ == "__main__":
    main() 