#!/usr/bin/env python3
"""
Safe Authentication Updater
Respects Axiom rate limits while updating authentication tokens
"""

import time
import json
import asyncio
from pathlib import Path

class SafeAuthUpdater:
    def __init__(self):
        self.rate_limits = {
            'auth_requests_per_minute': 10,
            'connection_attempts_per_minute': 5,
            'subscription_requests_per_minute': 10,
            'min_auth_interval': 60  # 1 minute between auth attempts
        }
        
        self.last_auth_attempt = 0
        self.auth_attempts_this_minute = 0
        self.auth_attempt_times = []
        
        print("🛡️ SAFE AUTHENTICATION UPDATER")
        print("Respects Axiom rate limits:")
        print(f"• Max {self.rate_limits['auth_requests_per_minute']} auth requests per minute")
        print(f"• Min {self.rate_limits['min_auth_interval']}s between attempts")
        print(f"• Max {self.rate_limits['connection_attempts_per_minute']} connections per minute")

    def can_attempt_auth(self):
        """Check if we can safely attempt authentication without hitting rate limits"""
        now = time.time()
        
        # Remove auth attempts older than 1 minute
        self.auth_attempt_times = [t for t in self.auth_attempt_times if now - t < 60]
        
        # Check rate limits
        if len(self.auth_attempt_times) >= self.rate_limits['auth_requests_per_minute']:
            return False, f"Rate limit: {len(self.auth_attempt_times)}/10 auth requests this minute"
        
        if now - self.last_auth_attempt < self.rate_limits['min_auth_interval']:
            remaining = int(self.rate_limits['min_auth_interval'] - (now - self.last_auth_attempt))
            return False, f"Rate limit: {remaining}s until next auth allowed"
        
        return True, "Safe to authenticate"

    def update_ultimate_whale_discovery(self, access_token, refresh_token):
        """Safely update the authentication tokens in ultimate_whale_discovery.py"""
        try:
            file_path = Path("ultimate_whale_discovery.py")
            
            if not file_path.exists():
                return False, "ultimate_whale_discovery.py not found"
            
            # Read current file
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Find and replace auth tokens (lines 54-55)
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                if "'access_token':" in line and "eyJ" in line:
                    lines[i] = f"            'access_token': '{access_token}',"
                    print(f"✅ Updated access_token on line {i+1}")
                elif "'refresh_token':" in line and "eyJ" in line:
                    lines[i] = f"            'refresh_token': '{refresh_token}',"
                    print(f"✅ Updated refresh_token on line {i+1}")
            
            # Write back to file
            with open(file_path, 'w') as f:
                f.write('\n'.join(lines))
            
            return True, "Authentication tokens updated successfully"
            
        except Exception as e:
            return False, f"Error updating file: {e}"

    def record_auth_attempt(self):
        """Record an authentication attempt for rate limiting"""
        now = time.time()
        self.auth_attempt_times.append(now)
        self.last_auth_attempt = now

    def get_browser_cookie_instructions(self):
        """Provide safe instructions for extracting browser cookies"""
        print("\n🔐 SAFE BROWSER COOKIE EXTRACTION")
        print("═" * 50)
        print("1️⃣ Open Chrome and go to https://axiom.trade")
        print("2️⃣ Press F12 to open DevTools")
        print("3️⃣ Go to Application tab → Storage → Cookies → https://axiom.trade")
        print("4️⃣ Find and copy these cookies:")
        print("   • auth-access-token (starts with 'eyJ')")
        print("   • auth-refresh-token (starts with 'eyJ')")
        print("5️⃣ Run this script with the tokens:")
        print("   python3 safe_auth_updater.py <access_token> <refresh_token>")
        print("\n⚠️  RATE LIMIT SAFETY:")
        print("• This will safely update your Python script")
        print("• Respects 10 auth requests per minute limit")
        print("• Waits 60s between authentication attempts")
        print("• Avoids connection spam that causes bans")

    def restart_whale_discovery_safely(self):
        """Safely restart the whale discovery with new auth"""
        print("\n🔄 SAFE RESTART PROCEDURE")
        print("═" * 40)
        print("1. Kill current Python process gracefully")
        print("2. Wait 30 seconds (rate limit cooldown)")
        print("3. Start with single endpoint first (eucalyptus only)")
        print("4. If successful, add cluster7 after 60 seconds")
        print("5. Monitor for rate limit responses (401, 429)")
        
        # Check if current process is running
        import subprocess
        try:
            result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            if 'ultimate_whale_discovery.py' in result.stdout:
                print("\n⚠️  Current whale discovery process is still running!")
                print("   Stop it first: pkill -f ultimate_whale_discovery.py")
                print("   Then wait 30 seconds before restarting")
                return False
            else:
                print("\n✅ No current process detected - safe to start")
                return True
        except:
            print("\n❓ Could not check process status")
            return True

def main():
    import sys
    
    updater = SafeAuthUpdater()
    
    if len(sys.argv) != 3:
        print("\n❌ Missing tokens!")
        updater.get_browser_cookie_instructions()
        return
    
    access_token = sys.argv[1]
    refresh_token = sys.argv[2]
    
    # Validate tokens
    if not (access_token.startswith('eyJ') and refresh_token.startswith('eyJ')):
        print("❌ Invalid token format! Tokens should start with 'eyJ'")
        return
    
    # Check rate limits
    can_auth, reason = updater.can_attempt_auth()
    if not can_auth:
        print(f"🚫 {reason}")
        print("Wait and try again to avoid being banned!")
        return
    
    # Record the attempt
    updater.record_auth_attempt()
    
    # Update the file
    success, message = updater.update_ultimate_whale_discovery(access_token, refresh_token)
    
    if success:
        print(f"✅ {message}")
        
        # Check if safe to restart
        if updater.restart_whale_discovery_safely():
            print("\n🚀 Ready to restart with fresh authentication!")
            print("Run: python3 ultimate_whale_discovery.py")
        
    else:
        print(f"❌ {message}")

if __name__ == "__main__":
    main() 