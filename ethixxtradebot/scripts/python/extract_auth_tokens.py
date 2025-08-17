#!/usr/bin/env python3
"""
Auth Token Extraction Helper
Helps extract authentication tokens from browser sessions
"""

import json
import os
from pathlib import Path

def extract_tokens_from_existing_infrastructure():
    """Extract tokens from existing infrastructure"""
    
    print("🔍 Searching for existing authentication in infrastructure...")
    
    # Check existing infrastructure paths
    potential_paths = [
        'config/axiom-cookies.json',
        '../axiomtrade-archive/axiom-cookies.json', 
        '../chad-lockdown-spine/config/axiom-session.json',
        'services/axiom-session.json'
    ]
    
    for path in potential_paths:
        if Path(path).exists():
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    
                print(f"📁 Found session data in {path}")
                print("🔑 Available keys:", list(data.keys()))
                
                # Look for auth-related data
                auth_keys = ['auth_token', 'authorization', 'token', 'jwt', 'bearer']
                for key in auth_keys:
                    if key in data:
                        token = data[key]
                        if token and len(str(token)) > 20:
                            print(f"✅ Found potential auth token: {key}")
                            print(f"   Token preview: {str(token)[:20]}...")
                            return token
                            
            except Exception as e:
                print(f"❌ Error reading {path}: {e}")
    
    print("⚠️ No existing tokens found in infrastructure")
    return None

def guide_manual_extraction():
    """Guide user through manual token extraction"""
    
    print("\n🔐 MANUAL TOKEN EXTRACTION GUIDE")
    print("═══════════════════════════════════")
    print()
    print("1. 🌐 Open Chrome and go to: https://axiom.trade")
    print("2. 🔑 Login to your Axiom Trade account")
    print("3. 🛠️ Press F12 to open Developer Tools")
    print("4. 📡 Go to the 'Network' tab")
    print("5. 🔄 Refresh the page (Ctrl+R or Cmd+R)")
    print("6. 🔍 Look for WebSocket connections or API calls")
    print("7. 📋 Find requests with 'Authorization' header")
    print("8. 📝 Copy the Bearer token (everything after 'Bearer ')")
    print()
    print("💡 Alternative method:")
    print("1. 🌐 Go to https://axiom.trade (logged in)")
    print("2. 🛠️ Press F12 → Console tab")
    print("3. 📝 Type: localStorage")
    print("4. 🔍 Look for auth_token, jwt_token, or similar")
    print()
    print("🚀 Once you have the token, set it as environment variable:")
    print("   export AXIOM_AUTH_TOKEN='your_token_here'")
    print()
    print("🔄 Then restart the whale discovery system!")

def check_environment_variables():
    """Check if environment variables are already set"""
    
    print("🔍 Checking environment variables...")
    
    auth_token = os.getenv('AXIOM_AUTH_TOKEN')
    refresh_token = os.getenv('AXIOM_REFRESH_TOKEN')
    
    if auth_token:
        print(f"✅ AXIOM_AUTH_TOKEN found: {auth_token[:20]}...")
        if refresh_token:
            print(f"✅ AXIOM_REFRESH_TOKEN found: {refresh_token[:20]}...")
        return auth_token, refresh_token
    else:
        print("❌ No AXIOM_AUTH_TOKEN environment variable found")
        return None, None

def create_test_environment_file():
    """Create a test environment file for development"""
    
    env_content = """# Axiom Trade Authentication
# Replace these with your actual tokens from browser

# Get this from browser DevTools → Network → Authorization header
AXIOM_AUTH_TOKEN=""

# Get this from browser DevTools → Application → localStorage
AXIOM_REFRESH_TOKEN=""

# Development mode (set to true for testing)
AXIOM_DEV_MODE="true"
"""
    
    with open('.env.axiom', 'w') as f:
        f.write(env_content)
    
    print("📁 Created .env.axiom template file")
    print("📝 Edit this file with your actual tokens")
    print("🔄 Then run: source .env.axiom")

def main():
    print("🔐 AXIOM TRADE AUTH TOKEN EXTRACTION")
    print("═══════════════════════════════════════")
    
    # Check environment first
    auth_token, refresh_token = check_environment_variables()
    
    if auth_token:
        print("✅ Authentication tokens already configured!")
        return
    
    # Try to extract from existing infrastructure
    found_token = extract_tokens_from_existing_infrastructure()
    
    if found_token:
        print(f"\n🎯 SUGGESTED COMMAND:")
        print(f"export AXIOM_AUTH_TOKEN='{found_token}'")
        print("\n🚀 Run this command, then start the whale discovery system!")
        return
    
    # Guide manual extraction
    guide_manual_extraction()
    
    # Create template file
    create_test_environment_file()

if __name__ == "__main__":
    main() 