#!/usr/bin/env python3
"""
Minimal WebSocket Connection Test
Exactly replicates browser behavior to isolate connection issues
"""

import websocket
import json
import time
import threading

def test_cluster7():
    """Test cluster7 connection exactly like browser"""
    print("🧪 Testing cluster7.axiom.trade...")
    
    # Exact headers from browser
    headers = {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    url = "wss://cluster7.axiom.trade/?"
    
    try:
        print(f"🔌 Connecting to: {url}")
        print(f"📋 Headers: {headers}")
        
        ws = websocket.create_connection(url, header=headers, timeout=10)
        print("✅ Connected successfully!")
        
        # Listen for a few messages
        message_count = 0
        start_time = time.time()
        
        while message_count < 5 and time.time() - start_time < 30:
            try:
                message = ws.recv()
                message_count += 1
                print(f"📨 Message {message_count}: {message[:100]}...")
                
                # Try to parse as JSON
                try:
                    data = json.loads(message)
                    if isinstance(data, dict) and 'room' in data:
                        print(f"   🏠 Room: {data['room']}")
                    elif isinstance(data, list) and len(data) >= 2:
                        print(f"   📊 Array data: timestamp={data[0]}, address={data[1][:20]}...")
                except:
                    print(f"   📝 Raw data (first 200 chars): {str(message)[:200]}")
                    
            except websocket.WebSocketTimeoutException:
                print("⏰ Timeout waiting for message")
                break
                
        ws.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_eucalyptus():
    """Test eucalyptus connection exactly like browser"""
    print("\n🧪 Testing eucalyptus.axiom.trade...")
    
    headers = {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    url = "wss://eucalyptus.axiom.trade/ws?"
    
    try:
        print(f"🔌 Connecting to: {url}")
        
        ws = websocket.create_connection(url, header=headers, timeout=10)
        print("✅ Connected successfully!")
        
        # Listen briefly
        message_count = 0
        start_time = time.time()
        
        while message_count < 3 and time.time() - start_time < 20:
            try:
                message = ws.recv()
                message_count += 1
                print(f"📨 Message {message_count}: {message[:100]}...")
            except websocket.WebSocketTimeoutException:
                print("⏰ Timeout waiting for message")
                break
                
        ws.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    print("🚀 MINIMAL CONNECTION TEST")
    print("=" * 50)
    print("Testing exact browser replication...")
    
    # Test cluster7 (the goldmine)
    cluster7_works = test_cluster7()
    
    # Test eucalyptus 
    eucalyptus_works = test_eucalyptus()
    
    print("\n📊 RESULTS:")
    print("=" * 50)
    print(f"cluster7.axiom.trade:    {'✅ WORKS' if cluster7_works else '❌ FAILS'}")
    print(f"eucalyptus.axiom.trade:  {'✅ WORKS' if eucalyptus_works else '❌ FAILS'}")
    
    if cluster7_works:
        print("\n🎉 SUCCESS: cluster7 connection works!")
        print("💡 Our existing code is overcomplicating things")
        print("🔧 Next: Compare with our current implementation")
    else:
        print("\n🤔 STILL FAILING: Need deeper investigation")
        print("🔍 Possible issues: IP restrictions, timing, headers")
        
    if eucalyptus_works:
        print("✅ Eucalyptus also working")
    else:
        print("❌ Eucalyptus also failing")

if __name__ == "__main__":
    main() 