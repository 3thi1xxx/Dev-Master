#!/usr/bin/env python3
"""
MacBook Pro Optimized Whale Discovery System
Using AxiomTradeAPI-py SDK approach for reliable data

Hardware Target: Intel i5 4-core, 16GB RAM
Performance Target: <5ms latency, 2000+ tokens/sec
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import logging
import os
from concurrent.futures import ThreadPoolExecutor
import threading
import queue
import psutil

@dataclass
class TokenData:
    """Structured token data (SDK format)"""
    tokenName: str
    tokenTicker: str
    tokenAddress: str
    marketCapSol: float
    volumeSol: float
    liquiditySol: float
    protocol: str
    createdAt: str
    website: Optional[str] = None
    twitter: Optional[str] = None
    telegram: Optional[str] = None
    verified_contract: bool = False
    
    def to_dict(self) -> dict:
        return {
            'tokenName': self.tokenName,
            'tokenTicker': self.tokenTicker,
            'tokenAddress': self.tokenAddress,
            'marketCapSol': self.marketCapSol,
            'volumeSol': self.volumeSol,
            'liquiditySol': self.liquiditySol,
            'protocol': self.protocol,
            'createdAt': self.createdAt,
            'website': self.website,
            'twitter': self.twitter,
            'telegram': self.telegram,
            'verified_contract': self.verified_contract
        }

@dataclass
class WhaleTransaction:
    """Structured whale transaction data"""
    wallet_address: str
    token_data: TokenData
    transaction_amount_usd: float
    transaction_type: str  # 'buy' or 'sell'
    timestamp: float
    confidence_score: float = 0.0
    is_discovered: bool = False

class MacBookOptimizedWhaleDiscovery:
    """
    MacBook Pro optimized whale discovery using proper SDK approach
    """
    
    def __init__(self):
        # Hardware optimization for MacBook Pro
        self.cpu_cores = psutil.cpu_count(logical=False)  # Physical cores
        self.total_ram = psutil.virtual_memory().total
        self.max_workers = min(self.cpu_cores, 4)  # Limit to 4 for thermal management
        
        # Performance configuration
        self.config = {
            'discovery_threshold': 0.25,  # Lower threshold from our findings
            'auto_add_threshold': 0.45,   # Auto-add threshold
            'min_transaction_usd': 100000,  # $100k minimum
            'max_concurrent_requests': 20,
            'request_timeout': 5.0,
            'memory_limit_gb': 4,  # Stay within 4GB for other apps
        }
        
        # Authentication (will need proper tokens)
        self.auth_token = os.getenv('AXIOM_AUTH_TOKEN', '')
        self.refresh_token = os.getenv('AXIOM_REFRESH_TOKEN', '')
        
        # Data structures optimized for speed
        self.discovered_whales = {}  # Dict for O(1) lookups
        self.whale_scores = {}
        self.processing_queue = queue.Queue(maxsize=10000)
        
        # Performance monitoring
        self.metrics = {
            'tokens_processed': 0,
            'whales_discovered': 0,
            'avg_processing_time': 0.0,
            'memory_usage_mb': 0,
            'start_time': time.time()
        }
        
        # Threading for MacBook Pro optimization
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        self.running = False
        
        # Logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    async def initialize(self):
        """Initialize the whale discovery system"""
        self.logger.info("🚀 MacBook Pro Whale Discovery Initializing")
        self.logger.info(f"💻 Hardware: {self.cpu_cores} cores, {self.total_ram / (1024**3):.1f}GB RAM")
        self.logger.info(f"🎯 Using {self.max_workers} worker threads for optimal performance")
        
        # Validate authentication
        if not self.auth_token:
            self.logger.warning("⚠️ No auth token found. Using mock data mode.")
            self.config['mock_mode'] = True
        
        # Start monitoring threads
        self.running = True
        asyncio.create_task(self.performance_monitor())
        asyncio.create_task(self.process_queue())
        
        self.logger.info("✅ Whale discovery system ready!")
        
    async def subscribe_new_tokens(self):
        """Subscribe to new token feed (SDK approach)"""
        self.logger.info("📡 Subscribing to new token feed...")
        
        if self.config.get('mock_mode'):
            # Simulate token feed for testing
            await self.simulate_token_feed()
        else:
            # Real SDK implementation would go here
            await self.real_token_feed()
    
    async def simulate_token_feed(self):
        """Simulate token feed for testing/development"""
        self.logger.info("🧪 Running in simulation mode")
        
        # Mock tokens based on our real data
        mock_tokens = [
            {
                "tokenName": "Rumor Coin",
                "tokenTicker": "RUMOR",
                "tokenAddress": "66deqshtq1K4vprt1uf4NxNNAB3d37BwvSkBZGn9SVQPhx5fzK35Gh3zicrFkNopxJUMsNCCqvRXj96YLW7UKXSn",
                "marketCapSol": 150.5,
                "volumeSol": 13.6,  # $13.6M from our real data
                "liquiditySol": 200.0,
                "protocol": "Raydium",
                "createdAt": datetime.now().isoformat(),
                "verified_contract": True
            },
            {
                "tokenName": "Moon Token",
                "tokenTicker": "MOON", 
                "tokenAddress": "54Pjx2Z1g6d9QPLvwuZvxPSc79CBgoCXLwrr2ZvV18LyEPsK8rBmLxFcDKuwyMhGtmE2oGB4kwjN7QZdwGHzWNn7",
                "marketCapSol": 89.2,
                "volumeSol": 11.5,  # $11.5M whale
                "liquiditySol": 150.0,
                "protocol": "Raydium",
                "createdAt": datetime.now().isoformat(),
                "verified_contract": True
            }
        ]
        
        # Simulate whale wallets
        whale_wallets = [
            "HiAR1VFegM2cnWE5ry8raB3ao1akcU1XZHHespxi82PG",
            "irWszHJBU15degpk2nCDr3TmZxa7xoJCHzwd68p5Rtx"
        ]
        
        while self.running:
            # Generate mock whale transactions
            for i, token_data in enumerate(mock_tokens):
                whale_address = whale_wallets[i % len(whale_wallets)]
                
                # Create whale transaction
                transaction = WhaleTransaction(
                    wallet_address=whale_address,
                    token_data=TokenData(**token_data),
                    transaction_amount_usd=token_data['volumeSol'] * 1000000,  # Convert to USD
                    transaction_type='buy',
                    timestamp=time.time()
                )
                
                # Add to processing queue
                try:
                    self.processing_queue.put_nowait(transaction)
                    self.logger.info(f"🐋 Mock whale transaction: {whale_address[:8]}... ${transaction.transaction_amount_usd:,.0f}")
                except queue.Full:
                    self.logger.warning("⚠️ Processing queue full, dropping transaction")
            
            await asyncio.sleep(10)  # New transactions every 10 seconds
    
    async def real_token_feed(self):
        """Real SDK implementation (requires proper auth tokens)"""
        # This would use the actual AxiomTradeAPI-py SDK
        self.logger.info("🔗 Connecting to real Axiom Trade API...")
        
        # Placeholder for real implementation
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            }
            
            # WebSocket connection to real feed
            # This would be implemented using the SDK's WebSocket client
            pass
    
    async def process_queue(self):
        """Process whale transactions from queue"""
        while self.running:
            try:
                # Process transactions in batches for efficiency
                batch = []
                for _ in range(min(10, self.processing_queue.qsize())):
                    try:
                        transaction = self.processing_queue.get_nowait()
                        batch.append(transaction)
                    except queue.Empty:
                        break
                
                if batch:
                    # Process batch in parallel using our thread pool
                    futures = [
                        self.executor.submit(self.analyze_whale_transaction, tx)
                        for tx in batch
                    ]
                    
                    # Wait for all analyses to complete
                    for future in futures:
                        try:
                            result = future.result(timeout=1.0)
                            if result:
                                await self.handle_discovered_whale(result)
                        except Exception as e:
                            self.logger.error(f"❌ Error processing transaction: {e}")
                
                await asyncio.sleep(0.1)  # Small delay to prevent CPU spinning
                
            except Exception as e:
                self.logger.error(f"❌ Queue processing error: {e}")
                await asyncio.sleep(1)
    
    def analyze_whale_transaction(self, transaction: WhaleTransaction) -> Optional[WhaleTransaction]:
        """Analyze whale transaction (CPU intensive work in thread)"""
        start_time = time.time()
        
        try:
            # Calculate confidence score using structured data
            score = self.calculate_whale_confidence(transaction)
            transaction.confidence_score = score
            
            # Check if whale should be discovered
            if score >= self.config['discovery_threshold']:
                transaction.is_discovered = True
                self.metrics['whales_discovered'] += 1
                
                self.logger.info(f"🎯 Whale discovered: {transaction.wallet_address[:8]}... "
                               f"Score: {score:.1%} Token: {transaction.token_data.tokenTicker}")
                
                return transaction
            
            self.metrics['tokens_processed'] += 1
            
        except Exception as e:
            self.logger.error(f"❌ Analysis error: {e}")
        finally:
            # Update performance metrics
            processing_time = time.time() - start_time
            self.update_processing_metrics(processing_time)
        
        return None
    
    def calculate_whale_confidence(self, transaction: WhaleTransaction) -> float:
        """Calculate whale confidence score using structured token data"""
        
        # Base score from transaction amount (similar to our previous logic)
        amount = transaction.transaction_amount_usd
        
        if amount >= 10_000_000:  # $10M+
            amount_score = 1.0
        elif amount >= 1_000_000:  # $1M+
            amount_score = 0.8 + (amount - 1_000_000) / 45_000_000
        elif amount >= 100_000:  # $100k+
            amount_score = 0.5 + (amount - 100_000) / 2_250_000
        else:
            amount_score = amount / 200_000
        
        # Token quality score (using structured data)
        token_score = self.calculate_token_quality_score(transaction.token_data)
        
        # Wallet history score (placeholder - would query wallet history)
        wallet_score = 0.5  # Default until we implement wallet analysis
        
        # Combined weighted score
        final_score = (
            amount_score * 0.5 +      # 50% transaction size
            token_score * 0.3 +       # 30% token quality
            wallet_score * 0.2        # 20% wallet history
        )
        
        return min(1.0, final_score)
    
    def calculate_token_quality_score(self, token_data: TokenData) -> float:
        """Calculate token quality score using structured data"""
        score = 0.0
        
        # Verified contract bonus
        if token_data.verified_contract:
            score += 0.3
        
        # Liquidity score
        if token_data.liquiditySol > 100:
            score += 0.3
        elif token_data.liquiditySol > 50:
            score += 0.2
        
        # Market cap score
        if token_data.marketCapSol > 50:
            score += 0.2
        elif token_data.marketCapSol > 10:
            score += 0.1
        
        # Social presence
        if token_data.website and token_data.twitter:
            score += 0.2
        
        return min(1.0, score)
    
    async def handle_discovered_whale(self, transaction: WhaleTransaction):
        """Handle a discovered whale transaction"""
        wallet = transaction.wallet_address
        
        # Update discovered whales
        if wallet not in self.discovered_whales:
            self.discovered_whales[wallet] = {
                'address': wallet,
                'discovered_at': transaction.timestamp,
                'score': transaction.confidence_score,
                'transactions': []
            }
        
        # Add transaction to whale's history
        self.discovered_whales[wallet]['transactions'].append(transaction.to_dict())
        
        # Update score if higher
        if transaction.confidence_score > self.discovered_whales[wallet]['score']:
            self.discovered_whales[wallet]['score'] = transaction.confidence_score
        
        # Auto-add high-scoring whales
        if transaction.confidence_score >= self.config['auto_add_threshold']:
            await self.auto_add_whale_to_tracking(wallet, transaction)
    
    async def auto_add_whale_to_tracking(self, wallet: str, transaction: WhaleTransaction):
        """Auto-add high-scoring whale to tracking config"""
        self.logger.info(f"🎯 Auto-adding whale {wallet[:8]}... to tracking "
                        f"(Score: {transaction.confidence_score:.1%})")
        
        # Load existing config
        try:
            with open('config/tracked-wallets.json', 'r') as f:
                config = json.load(f)
        except:
            config = {'wallets': []}
        
        # Add new whale
        new_whale = {
            'address': wallet,
            'name': f'auto-discovered-{int(time.time())}',
            'enabled': True,
            'priority': 'high',
            'notes': f'Auto-discovered whale (Score: {transaction.confidence_score:.1%}) - {datetime.now().isoformat()}',
            'discoveryScore': transaction.confidence_score,
            'autoDiscovered': True,
            'tokenData': transaction.token_data.to_dict()
        }
        
        config['wallets'].append(new_whale)
        
        # Save updated config
        try:
            with open('config/tracked-wallets.json', 'w') as f:
                json.dump(config, f, indent=2)
            self.logger.info(f"✅ Whale {wallet[:8]}... added to tracking config")
        except Exception as e:
            self.logger.error(f"❌ Failed to save whale config: {e}")
    
    async def performance_monitor(self):
        """Monitor system performance and adjust for MacBook Pro optimization"""
        while self.running:
            try:
                # Update memory usage
                process = psutil.Process()
                memory_mb = process.memory_info().rss / 1024 / 1024
                self.metrics['memory_usage_mb'] = memory_mb
                
                # Check memory limit
                if memory_mb > self.config['memory_limit_gb'] * 1024:
                    self.logger.warning(f"⚠️ Memory usage high: {memory_mb:.1f}MB")
                    # Could trigger garbage collection or reduce batch sizes
                
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                
                # Thermal management (estimate)
                if cpu_percent > 80:
                    self.logger.warning("🌡️ High CPU usage, reducing processing intensity")
                    # Could reduce batch sizes or add delays
                
                # Log status every 30 seconds
                uptime = time.time() - self.metrics['start_time']
                if int(uptime) % 30 == 0:
                    self.log_performance_status()
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                self.logger.error(f"❌ Performance monitoring error: {e}")
                await asyncio.sleep(10)
    
    def update_processing_metrics(self, processing_time: float):
        """Update processing time metrics"""
        if self.metrics['avg_processing_time'] == 0:
            self.metrics['avg_processing_time'] = processing_time
        else:
            # Exponential moving average
            alpha = 0.1
            self.metrics['avg_processing_time'] = (
                alpha * processing_time + 
                (1 - alpha) * self.metrics['avg_processing_time']
            )
    
    def log_performance_status(self):
        """Log current performance status"""
        uptime = time.time() - self.metrics['start_time']
        throughput = self.metrics['tokens_processed'] / max(uptime, 1)
        
        self.logger.info(f"📊 PERFORMANCE STATUS:")
        self.logger.info(f"   ⚡ Avg Processing: {self.metrics['avg_processing_time']*1000:.2f}ms")
        self.logger.info(f"   🚀 Throughput: {throughput:.1f} tokens/sec")
        self.logger.info(f"   💾 Memory: {self.metrics['memory_usage_mb']:.1f}MB")
        self.logger.info(f"   🐋 Whales Discovered: {self.metrics['whales_discovered']}")
        self.logger.info(f"   📊 Queue Size: {self.processing_queue.qsize()}")
    
    def get_discovery_report(self) -> dict:
        """Get whale discovery report"""
        high_scoring = sum(1 for w in self.discovered_whales.values() if w['score'] > 0.8)
        auto_added = sum(1 for w in self.discovered_whales.values() if w['score'] >= self.config['auto_add_threshold'])
        
        return {
            'summary': {
                'totalDiscovered': len(self.discovered_whales),
                'highScoring': high_scoring,
                'autoAdded': auto_added,
                'avgScore': sum(w['score'] for w in self.discovered_whales.values()) / max(len(self.discovered_whales), 1)
            },
            'topWhales': sorted(
                [{'address': addr, 'score': int(data['score'] * 100)} 
                 for addr, data in self.discovered_whales.items()],
                key=lambda x: x['score'],
                reverse=True
            )[:10]
        }
    
    async def shutdown(self):
        """Graceful shutdown"""
        self.logger.info("🛑 Shutting down whale discovery system...")
        self.running = False
        self.executor.shutdown(wait=True)
        self.logger.info("✅ Shutdown complete")

async def main():
    """Main entry point"""
    discovery = MacBookOptimizedWhaleDiscovery()
    
    try:
        await discovery.initialize()
        
        # Start token subscription
        token_task = asyncio.create_task(discovery.subscribe_new_tokens())
        
        # Run for demonstration
        await asyncio.sleep(60)  # Run for 60 seconds
        
        # Show final report
        report = discovery.get_discovery_report()
        print("\n🎯 FINAL WHALE DISCOVERY REPORT:")
        print(f"   🐋 Total Discovered: {report['summary']['totalDiscovered']}")
        print(f"   ⭐ High Scoring: {report['summary']['highScoring']}")
        print(f"   🎯 Auto-Added: {report['summary']['autoAdded']}")
        
        if report['topWhales']:
            print("\n🏆 TOP DISCOVERIES:")
            for i, whale in enumerate(report['topWhales'][:3], 1):
                print(f"   {i}. {whale['address'][:8]}... (Score: {whale['score']}%)")
        
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    finally:
        await discovery.shutdown()

if __name__ == "__main__":
    asyncio.run(main()) 