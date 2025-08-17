#!/usr/bin/env python3
"""
Trading Signal Analyzer
Analyzes the dual-source trading signals to understand opportunities and confidence scoring
"""

import json
import time
from datetime import datetime

class SignalAnalyzer:
    def __init__(self):
        print("📊 TRADING SIGNAL ANALYSIS")
        print("=" * 50)
        
    def analyze_hyperliquid_data(self):
        """Analyze Hyperliquid market data"""
        print("\n🔍 HYPERLIQUID MARKET ANALYSIS")
        print("-" * 40)
        
        try:
            with open('hyperliquid_report_20250814_144655.json', 'r') as f:
                data = json.load(f)
            
            # Extract market prices from data samples
            market_data = {}
            btc_trades = []
            eth_trades = []
            
            for sample in data.get('data_samples', []):
                json_data = sample.get('json_data', {})
                
                # Extract mid prices
                if json_data.get('channel') == 'allMids':
                    mids = json_data.get('data', {}).get('mids', {})
                    for token_id, price in mids.items():
                        try:
                            market_data[token_id] = float(price)
                        except:
                            pass
                
                # Extract trade data
                elif json_data.get('channel') == 'trades':
                    trades = json_data.get('data', [])
                    for trade in trades:
                        if isinstance(trade, dict):
                            coin = trade.get('coin', '')
                            if coin == 'BTC':
                                btc_trades.append(trade)
                            elif coin == 'ETH':
                                eth_trades.append(trade)
            
            # Analyze major cryptos
            print("💰 MAJOR CRYPTO PRICES:")
            major_tokens = {}
            for token_id, price in market_data.items():
                if token_id in ['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'MATIC']:
                    major_tokens[token_id] = price
            
            # Sort by price descending
            for token, price in sorted(major_tokens.items(), key=lambda x: x[1], reverse=True):
                print(f"   {token}: ${price:,.2f}")
            
            # Analyze trading volume
            print(f"\n📈 TRADING ACTIVITY:")
            print(f"   BTC Trades: {len(btc_trades)}")
            print(f"   ETH Trades: {len(eth_trades)}")
            
            # Show sample BTC trades
            if btc_trades:
                print(f"\n🪙 SAMPLE BTC TRADES:")
                for i, trade in enumerate(btc_trades[:3], 1):
                    size = float(trade.get('sz', 0))
                    price = float(trade.get('px', 0))
                    side = trade.get('side', '')
                    volume_usd = size * price
                    print(f"   Trade #{i}: {side} {size:.4f} BTC @ ${price:,.0f} = ${volume_usd:,.0f}")
            
            # Calculate signal potential
            total_tokens = len(market_data)
            print(f"\n🎯 SIGNAL POTENTIAL:")
            print(f"   Total tokens tracked: {total_tokens}")
            print(f"   Major crypto pairs: {len(major_tokens)}")
            print(f"   Price range: ${min(market_data.values()):.6f} - ${max(market_data.values()):,.0f}")
            
        except Exception as e:
            print(f"❌ Hyperliquid analysis error: {e}")
    
    def analyze_confidence_thresholds(self):
        """Analyze why signals aren't reaching high confidence"""
        print("\n🎯 CONFIDENCE THRESHOLD ANALYSIS")
        print("-" * 40)
        
        print("Current system thresholds:")
        print("   📊 Medium confidence: 50-69%")
        print("   🔥 High confidence: 70%+")
        print("   🚀 Trade execution: 70%+")
        
        print("\nWhy signals are staying medium confidence:")
        
        print("\n🪙 TOKEN LAUNCH SCORING:")
        print("   • Liquidity 500+ SOL = +40%")
        print("   • Snipers 30%+ = +30%") 
        print("   • Dev holds <10% = +10%")
        print("   • LP burned = +20%")
        print("   • Total possible: 100%")
        print("   ⚠️ Most new tokens: 40-60% (medium confidence)")
        
        print("\n📈 DERIVATIVES SCORING:")
        print("   • Large BTC trade 100k+ USD = up to 100%")
        print("   • Price movement 5%+ = up to 100%")
        print("   ⚠️ Need bigger volume or price moves for 70%+")
        
    def suggest_improvements(self):
        """Suggest improvements to increase signal quality"""
        print("\n🚀 SIGNAL IMPROVEMENT SUGGESTIONS")
        print("-" * 40)
        
        print("1️⃣ LOWER CONFIDENCE THRESHOLD:")
        print("   • Change from 70% to 60% for more trading signals")
        print("   • Or add 'medium confidence' execution tier")
        
        print("\n2️⃣ ENHANCE HYPERLIQUID SIGNALS:")
        print("   • Track more altcoin pairs (not just BTC/ETH)")
        print("   • Look for 2%+ price movements (not just 5%+)")
        print("   • Add volume spike detection")
        
        print("\n3️⃣ IMPROVE TOKEN LAUNCH DETECTION:")
        print("   • Focus on tokens with 100+ SOL liquidity")
        print("   • Prioritize LP burned tokens")
        print("   • Add social signal scoring")
        
        print("\n4️⃣ ADD CROSS-SOURCE CORRELATION:")
        print("   • Boost confidence when both sources agree")
        print("   • Combine BTC price with token launches")
        print("   • Look for whale activity during market moves")
        
        print("\n5️⃣ REAL-TIME OPTIMIZATION:")
        print("   • Dynamic threshold based on market volatility")
        print("   • Time-based confidence decay")
        print("   • Position sizing based on confidence")
    
    def show_live_opportunities(self):
        """Show current trading opportunities based on analysis"""
        print("\n💡 CURRENT OPPORTUNITIES")
        print("-" * 40)
        
        # Based on the Hyperliquid data
        print("🔥 HIGH POTENTIAL TRADES:")
        print("   • BTC @ $123,749 - watch for breakout above $124k")
        print("   • ETH @ $4,771 - monitor ratio to BTC")
        print("   • Monitor for 2%+ moves in major pairs")
        
        print("\n🪙 TOKEN LAUNCH OPPORTUNITIES:")
        print("   • Look for tokens with 200+ SOL liquidity")
        print("   • Prioritize LP burned + low dev holdings")
        print("   • Target 10%+ sniper activity")
        
        print("\n⚡ SPEED ADVANTAGES:")
        print("   • Auckland routing = 2-8ms latency")
        print("   • Dual-source data = more opportunities")
        print("   • Real-time processing = first to market")

def main():
    analyzer = SignalAnalyzer()
    
    analyzer.analyze_hyperliquid_data()
    analyzer.analyze_confidence_thresholds()
    analyzer.suggest_improvements()
    analyzer.show_live_opportunities()
    
    print("\n" + "=" * 50)
    print("📈 ANALYSIS COMPLETE")
    print("🎯 Ready to optimize trading system!")

if __name__ == "__main__":
    main() 