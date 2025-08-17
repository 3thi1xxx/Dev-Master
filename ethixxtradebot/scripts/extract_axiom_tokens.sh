#!/bin/bash

echo "
════════════════════════════════════════════════════════════
🔐 AXIOM TOKEN EXTRACTION GUIDE
════════════════════════════════════════════════════════════

Your Axiom tokens are EXPIRED (77+ hours old)
The refresh token is also expired (500 error from server)

YOU NEED FRESH TOKENS FROM YOUR BROWSER!

📋 STEPS TO EXTRACT FRESH TOKENS:

1. Open Chrome/Brave browser
2. Go to https://axiom.trade
3. Log in with your account
4. Open Developer Tools (F12 or Cmd+Option+I)
5. Go to 'Application' or 'Storage' tab
6. Find 'Local Storage' → axiom.trade
7. Look for these keys:
   - access_token
   - refresh_token
   
8. Copy the values (long JWT strings starting with 'eyJ...')

9. Update the file: axiom_tokens.env

   AXIOM_ACCESS_TOKEN=<paste_your_new_access_token_here>
   AXIOM_REFRESH_TOKEN=<paste_your_new_refresh_token_here>

════════════════════════════════════════════════════════════

Current tokens status:
"

# Check token expiry
if [ -f "axiom_tokens.env" ]; then
    ACCESS_TOKEN=$(grep "AXIOM_ACCESS_TOKEN=" axiom_tokens.env | cut -d'=' -f2)
    
    if [ ! -z "$ACCESS_TOKEN" ]; then
        # Decode JWT payload (base64 decode the middle part)
        PAYLOAD=$(echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 --decode 2>/dev/null || echo "{}")
        
        # Try to extract exp field
        EXP=$(echo $PAYLOAD | grep -o '"exp":[0-9]*' | cut -d':' -f2)
        
        if [ ! -z "$EXP" ]; then
            NOW=$(date +%s)
            DIFF=$((EXP - NOW))
            
            if [ $DIFF -lt 0 ]; then
                echo "❌ Access token EXPIRED $((-DIFF / 3600)) hours ago!"
            else
                echo "✅ Access token valid for $((DIFF / 60)) more minutes"
            fi
        fi
    fi
fi

echo "
Press Enter after updating tokens to restart the system..."
read

echo "🔄 Restarting system with new tokens..."
pkill -f "node gui/server.js" 2>/dev/null
sleep 2
./START_SYSTEM.sh 