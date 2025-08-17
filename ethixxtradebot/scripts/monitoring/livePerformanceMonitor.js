#!/usr/bin/env node
/**
 * Live Performance Monitor
 * Real-time tracking of trading performance and profitability
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LivePerformanceMonitor {
  constructor() {
    this.dataFile = join(__dirname, '../../data/live-performance.json');
    this.startTime = Date.now();
    
    this.metrics = {
      session: {
        startTime: this.startTime,
        duration: 0,
        status: 'MONITORING'
      },
      trading: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        winRate: 0,
        avgProfitPerTrade: 0,
        maxDrawdown: 0,
        currentBalance: 1000
      },
      detection: {
        tokensDetected: 0,
        tokensAnalyzed: 0,
        opportunitiesFound: 0,
        analysisSpeed: 0
      },
      geographic: {
        aucklandAdvantageActive: true,
        avgLatency: 0,
        connectionQuality: 100
      },
      alerts: []
    };
    
    // Load existing data if available
    this.loadExistingData();
    
    console.log('📊 LIVE PERFORMANCE MONITOR STARTED');
    console.log('===================================');
    console.log(`🎯 Target: Prove consistent profitability`);
    console.log(`💰 Starting Balance: $${this.metrics.trading.currentBalance}`);
    console.log(`⚡ Auckland Advantage: ${this.metrics.geographic.aucklandAdvantageActive ? 'ACTIVE' : 'INACTIVE'}`);
  }
  
  loadExistingData() {
    if (existsSync(this.dataFile)) {
      try {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        this.metrics = { ...this.metrics, ...data };
        console.log('📂 Loaded existing performance data');
      } catch (error) {
        console.log('⚠️ Could not load existing data, starting fresh');
      }
    }
  }
  
  saveData() {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('❌ Failed to save performance data:', error.message);
    }
  }
  
  recordTokenDetection(token) {
    this.metrics.detection.tokensDetected++;
    console.log(`🔍 Token Detected: ${token} (Total: ${this.metrics.detection.tokensDetected})`);
    this.saveData();
  }
  
  recordTokenAnalysis(token, analysisTimeMs, score) {
    this.metrics.detection.tokensAnalyzed++;
    this.metrics.detection.analysisSpeed = analysisTimeMs;
    
    if (score >= 70) {
      this.metrics.detection.opportunitiesFound++;
      console.log(`🎯 OPPORTUNITY: ${token} (Score: ${score}) - Analysis: ${analysisTimeMs}ms`);
      this.addAlert('OPPORTUNITY', `High-score token detected: ${token} (${score})`);
    }
    
    console.log(`📊 Analysis: ${token} - ${analysisTimeMs}ms - Score: ${score}`);
    this.saveData();
  }
  
  recordTrade(tradeData) {
    const { token, action, amount, price, profit, confidence } = tradeData;
    
    this.metrics.trading.totalTrades++;
    
    if (profit > 0) {
      this.metrics.trading.winningTrades++;
      this.metrics.trading.totalProfit += profit;
      console.log(`✅ WINNING TRADE: ${token} +${profit.toFixed(2)}% (${confidence}% confidence)`);
    } else {
      this.metrics.trading.losingTrades++;
      this.metrics.trading.totalLoss += Math.abs(profit);
      console.log(`❌ LOSING TRADE: ${token} ${profit.toFixed(2)}% (${confidence}% confidence)`);
    }
    
    // Update derived metrics
    this.updateTradingMetrics();
    
    // Check for significant events
    this.checkForAlerts();
    
    this.saveData();
  }
  
  updateTradingMetrics() {
    const { trading } = this.metrics;
    
    trading.netProfit = trading.totalProfit - trading.totalLoss;
    trading.winRate = trading.totalTrades > 0 ? (trading.winningTrades / trading.totalTrades) * 100 : 0;
    trading.avgProfitPerTrade = trading.totalTrades > 0 ? trading.netProfit / trading.totalTrades : 0;
    trading.currentBalance = 1000 + (1000 * trading.netProfit / 100);
  }
  
  recordLatency(latencyMs, location = 'auckland') {
    this.metrics.geographic.avgLatency = latencyMs;
    
    if (location === 'auckland' && latencyMs <= 20) {
      this.metrics.geographic.aucklandAdvantageActive = true;
      this.metrics.geographic.connectionQuality = 100;
    } else if (latencyMs > 100) {
      this.metrics.geographic.connectionQuality = Math.max(0, 100 - (latencyMs - 100) / 10);
      if (this.metrics.geographic.connectionQuality < 80) {
        this.addAlert('LATENCY', `High latency detected: ${latencyMs}ms`);
      }
    }
    
    this.saveData();
  }
  
  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.metrics.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(0, 50);
    }
    
    console.log(`🚨 ALERT [${type}]: ${message}`);
  }
  
  checkForAlerts() {
    const { trading } = this.metrics;
    
    // Alert on significant profit
    if (trading.avgProfitPerTrade > 20) {
      this.addAlert('PROFIT', `Exceptional performance: ${trading.avgProfitPerTrade.toFixed(2)}% avg profit`);
    }
    
    // Alert on poor performance
    if (trading.totalTrades >= 5 && trading.winRate < 60) {
      this.addAlert('PERFORMANCE', `Win rate below 60%: ${trading.winRate.toFixed(1)}%`);
    }
    
    // Alert on profitable milestone
    if (trading.netProfit >= 10 && trading.totalTrades >= 3) {
      this.addAlert('MILESTONE', `Reached ${trading.netProfit.toFixed(1)}% net profit!`);
    }
  }
  
  generateStatusReport() {
    const duration = Date.now() - this.startTime;
    this.metrics.session.duration = duration;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('\n📊 LIVE PERFORMANCE REPORT');
    console.log('==========================');
    console.log(`⏱️ Session Duration: ${hours}h ${minutes}m`);
    console.log(`🔍 Tokens Detected: ${this.metrics.detection.tokensDetected}`);
    console.log(`📊 Tokens Analyzed: ${this.metrics.detection.tokensAnalyzed}`);
    console.log(`🎯 Opportunities: ${this.metrics.detection.opportunitiesFound}`);
    console.log(`⚡ Avg Analysis Speed: ${this.metrics.detection.analysisSpeed}ms`);
    
    console.log('\n💰 TRADING PERFORMANCE:');
    console.log(`   Total Trades: ${this.metrics.trading.totalTrades}`);
    console.log(`   Win Rate: ${this.metrics.trading.winRate.toFixed(1)}%`);
    console.log(`   Net Profit: ${this.metrics.trading.netProfit.toFixed(2)}%`);
    console.log(`   Current Balance: $${this.metrics.trading.currentBalance.toFixed(2)}`);
    console.log(`   Avg Profit/Trade: ${this.metrics.trading.avgProfitPerTrade.toFixed(2)}%`);
    
    console.log('\n⚡ TECHNICAL PERFORMANCE:');
    console.log(`   Auckland Advantage: ${this.metrics.geographic.aucklandAdvantageActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`   Avg Latency: ${this.metrics.geographic.avgLatency}ms`);
    console.log(`   Connection Quality: ${this.metrics.geographic.connectionQuality.toFixed(0)}%`);
    
    // Show recent alerts
    if (this.metrics.alerts.length > 0) {
      console.log('\n🚨 RECENT ALERTS:');
      this.metrics.alerts.slice(0, 5).forEach(alert => {
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`   ${time} [${alert.type}]: ${alert.message}`);
      });
    }
    
    this.evaluatePerformance();
  }
  
  evaluatePerformance() {
    const { trading } = this.metrics;
    
    console.log('\n🎯 PERFORMANCE EVALUATION:');
    
    // Win rate assessment
    if (trading.winRate >= 75) {
      console.log('   🏆 Win Rate: EXCELLENT');
    } else if (trading.winRate >= 60) {
      console.log('   ✅ Win Rate: GOOD');  
    } else if (trading.totalTrades >= 5) {
      console.log('   ⚠️ Win Rate: NEEDS IMPROVEMENT');
    } else {
      console.log('   ⏳ Win Rate: TOO EARLY TO ASSESS');
    }
    
    // Profitability assessment  
    if (trading.avgProfitPerTrade >= 15) {
      console.log('   🏆 Profitability: EXCELLENT');
    } else if (trading.avgProfitPerTrade >= 8) {
      console.log('   ✅ Profitability: GOOD');
    } else if (trading.totalTrades >= 3) {
      console.log('   ⚠️ Profitability: NEEDS IMPROVEMENT');
    } else {
      console.log('   ⏳ Profitability: TOO EARLY TO ASSESS');
    }
    
    // Overall assessment
    if (trading.totalTrades >= 10) {
      const overallScore = (trading.winRate + trading.avgProfitPerTrade * 3) / 4;
      console.log(`\n🏆 OVERALL SCORE: ${overallScore.toFixed(1)}/100`);
      
      if (overallScore >= 80) {
        console.log('🎉 READY FOR LIVE TRADING! System proven profitable.');
        this.addAlert('MILESTONE', 'System ready for live trading!');
      } else if (overallScore >= 60) {
        console.log('⚠️ System shows promise - continue monitoring.');
      } else {
        console.log('❌ System needs optimization before live trading.');
      }
    } else {
      console.log('\n⏳ Continue monitoring - need more trades for full assessment');
    }
  }
  
  startReporting(intervalMinutes = 15) {
    console.log(`📊 Starting periodic reporting every ${intervalMinutes} minutes`);
    
    setInterval(() => {
      this.generateStatusReport();
      this.saveData();
    }, intervalMinutes * 60 * 1000);
    
    // Generate initial report
    setTimeout(() => {
      this.generateStatusReport();
    }, 30000); // After 30 seconds
  }
}

// Simulate some activity for demonstration
async function simulateLiveActivity(monitor) {
  console.log('\n🎬 Simulating live trading activity...');
  
  // Simulate token detections and trades over time
  const scenarios = [
    { delay: 5000, token: 'BONK', score: 75, profit: 12.5, confidence: 78 },
    { delay: 15000, token: 'WIF', score: 45, profit: -3.2, confidence: 52 },
    { delay: 25000, token: 'PEPE', score: 85, profit: 24.7, confidence: 89 },
    { delay: 40000, token: 'DOGE', score: 68, profit: 8.9, confidence: 71 }
  ];
  
  for (const scenario of scenarios) {
    setTimeout(() => {
      monitor.recordTokenDetection(scenario.token);
      
      setTimeout(() => {
        monitor.recordTokenAnalysis(scenario.token, Math.floor(Math.random() * 300 + 150), scenario.score);
        
        if (scenario.score >= 65) {
          setTimeout(() => {
            monitor.recordTrade({
              token: scenario.token,
              action: 'BUY',
              amount: 50,
              price: 0.0001,
              profit: scenario.profit,
              confidence: scenario.confidence
            });
          }, 2000);
        }
      }, 1000);
      
      // Record latency
      monitor.recordLatency(Math.floor(Math.random() * 30 + 8));
      
    }, scenario.delay);
  }
}

// Main execution
const monitor = new LivePerformanceMonitor();

// Start periodic reporting
monitor.startReporting(5); // Every 5 minutes for demo

// Simulate activity
simulateLiveActivity(monitor);

console.log('\n🚀 Live performance monitoring active!');
console.log('Press Ctrl+C to stop monitoring\n'); 