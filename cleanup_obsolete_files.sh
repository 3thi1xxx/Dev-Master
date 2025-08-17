#!/bin/bash
# Cleanup Script for Dev/ Root Directory
# Removes obsolete log files and old artifacts

echo "🧹 CLEANUP SCRIPT - Dev Root Directory"
echo "======================================"
echo "This script will remove obsolete files from Dev/ root"
echo ""

# Function to ask for confirmation
confirm() {
    read -p "❓ $1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Log files to delete (can be regenerated)
LOG_FILES=(
    "enhanced_discovery.log"
    "server_output.log" 
    "eucalyptus_trader_20250814.log"
    "discovery.log"
    "hyperliquid_explorer_20250814.log"
    "whale-output.log"
    "whale-output2.log"
    "whale-output3.log"
    "whale_discovery_20250814.log"
    "server.log"
    "dual_trader_20250814.log"
)

# One-time/obsolete scripts
OBSOLETE_FILES=(
    "countdown_recovery.py"
    "go.mod"
    "debug-file.go.backup"
    ".DS_Store"
)

# Files already moved (originals can be deleted)
MOVED_FILES=(
    "monitor_data_flow.js"
    "check_premium_plus_status.js"
    "python_javascript_bridge.js"
    "test_live_analysis.js"
    "test_cluster7_discovery.js"
    "test_data_flow_fixes.js"
    "test_live_system.js"
    "test_birdeye_api.js"
    "paper_trading_performance.json"
    "degen_paper_trader_state.json"
    "paper_trading_trades.json"
    "production_whale_discovery.py"
    "eucalyptus_focused_trader.py"
    "fixed_whale_discovery.py"
    "alternative_goldmine_test.py"
)

echo "📊 FILES TO PROCESS:"
echo "🗑️  Log files: ${#LOG_FILES[@]} files (~3MB)"
echo "❌ Obsolete files: ${#OBSOLETE_FILES[@]} files"  
echo "✅ Moved files (originals): ${#MOVED_FILES[@]} files"
echo ""

# Delete log files
if confirm "Delete ${#LOG_FILES[@]} log files? (can be regenerated)"; then
    for file in "${LOG_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file" && echo "🗑️  Deleted: $file"
        fi
    done
fi

echo ""

# Delete obsolete files
if confirm "Delete ${#OBSOLETE_FILES[@]} obsolete files?"; then
    for file in "${OBSOLETE_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file" && echo "❌ Deleted: $file"
        fi
    done
fi

echo ""

# Delete moved file originals
if confirm "Delete ${#MOVED_FILES[@]} original files? (copies moved to ethixxtradebot/)"; then
    for file in "${MOVED_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file" && echo "✅ Deleted original: $file"
        fi
    done
fi

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo "📊 Root directory cleaned and organized"
echo "✅ Useful files moved to ethixxtradebot/"
echo "🗑️  Obsolete files removed" 