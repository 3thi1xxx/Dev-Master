#!/bin/bash

# ALWAYS run from the correct directory - no mistakes!
SCRIPT_DIR="/Users/DjEthixx/Desktop/Dev/ethixxtradebot"

# Change to correct directory no matter where we are
cd "$SCRIPT_DIR" || {
    echo "❌ ERROR: Cannot find ethixxtradebot directory!"
    echo "Expected: $SCRIPT_DIR"
    exit 1
}

echo "✅ Working directory: $(pwd)"
echo ""

# Now run the actual system
./START_SYSTEM.sh 