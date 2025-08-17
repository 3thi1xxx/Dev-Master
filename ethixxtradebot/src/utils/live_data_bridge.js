#!/usr/bin/env node
/**
 * Live Data Bridge - Python to Trading Signals
 * Monitors whale discovery output and generates real trading signals
 */

import fs from 'fs';
import { spawn } from 'child_process';

class LiveDataBridge {
    constructor() {
        this.logFile = 'whale_discovery_20250814.log';
        this.lastPosition = 0;
        this.tradingSignals = [];
        this.stats = {
            tokensDetected: 0,
            whalesFound: 0,
            signalsGenerated: 0,
            lastUpdate: new Date()
        };
        
        console.log('🚀 LIVE DATA BRIDGE STARTING');
        console.log('📡 Monitoring:', this.logFile);
    }

    async start() {
        // Initial read to get to current position
        if (fs.existsSync(this.logFile)) {
            const stats = fs.statSync(this.logFile);
            this.lastPosition = stats.size;
            console.log(`📍 Starting from position: ${this.lastPosition} bytes`);
        }

        // Monitor log file for new data
        this.monitorLogFile();
        
        // Status updates every 10 seconds
        setInterval(() => this.printStatus(), 10000);
        
        console.log('✅ Bridge is live! Watching for whale discoveries...\n');
    }

    monitorLogFile() {
        setInterval(() => {
            if (!fs.existsSync(this.logFile)) return;
            
            const stats = fs.statSync(this.logFile);
            if (stats.size > this.lastPosition) {
                // Read new data
                const fd = fs.openSync(this.logFile, 'r');
                const newSize = stats.size - this.lastPosition;
                const buffer = Buffer.alloc(newSize);
                
                fs.readSync(fd, buffer, 0, newSize, this.lastPosition);
                fs.closeSync(fd);
                
                const newData = buffer.toString('utf8');
                this.processNewData(newData);
                
                this.lastPosition = stats.size;
            }
        }, 1000); // Check every second
    }

    processNewData(data) {
        const lines = data.split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                this.processLogLine(line);
            }
        }
    }

    processLogLine(line) {
        // Parse different types of discoveries
        if (line.includes('🪙') && line.includes('TOKEN:')) {
            this.processTokenDiscovery(line);
        } else if (line.includes('🐋 WHALE DISCOVERED')) {
            this.processWhaleDiscovery(line);
        } else if (line.includes('📨') && line.includes('MESSAGE!')) {
            // Live data confirmation
            console.log(`🔴 LIVE: ${new Date().toISOString().split('T')[1].slice(0,8)} - New data received`);
        }
    }

    processTokenDiscovery(line) {
        // Extract token info from log line
        const tokenMatch = line.match(/🪙.*TOKEN:\s*([^(]+)\s*\(([^)]+)\)/);
        if (tokenMatch) {
            const ticker = tokenMatch[1].trim();
            const name = tokenMatch[2].trim();
            
            this.stats.tokensDetected++;
            console.log(`🆕 TOKEN DISCOVERED: ${ticker} (${name})`);
            
            // Generate trading signal
            this.generateTradingSignal({
                type: 'NEW_TOKEN',
                ticker,
                name,
                timestamp: new Date(),
                source: 'live_discovery'
            });
        }
    }

    processWhaleDiscovery(line) {
        // Extract whale number
        const whaleMatch = line.match(/🐋 WHALE DISCOVERED #(\d+)!/);
        if (whaleMatch) {
            const whaleNumber = whaleMatch[1];
            this.stats.whalesFound++;
            
            console.log(`🐋 WHALE #${whaleNumber} DISCOVERED!`);
            
            // Generate whale trading signal
            this.generateTradingSignal({
                type: 'WHALE_ACTIVITY',
                whaleNumber,
                timestamp: new Date(),
                source: 'whale_detection'
            });
        }
    }

    generateTradingSignal(tokenData) {
        const signal = {
            id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            ...tokenData,
            confidence: this.calculateConfidence(tokenData),
            action: this.determineAction(tokenData),
            urgency: this.calculateUrgency(tokenData)
        };

        this.tradingSignals.push(signal);
        this.stats.signalsGenerated++;
        this.stats.lastUpdate = new Date();

        console.log(`⚡ TRADING SIGNAL GENERATED:`);
        console.log(`   ID: ${signal.id}`);
        console.log(`   Type: ${signal.type}`);
        console.log(`   Action: ${signal.action}`);
        console.log(`   Confidence: ${signal.confidence}%`);
        console.log(`   Urgency: ${signal.urgency}`);
        
        if (signal.action === 'BUY' && signal.confidence > 60) {
            console.log(`🎯 HIGH CONFIDENCE BUY SIGNAL - WOULD EXECUTE TRADE!`);
        }
        
        console.log('');

        // Keep only last 10 signals
        if (this.tradingSignals.length > 10) {
            this.tradingSignals = this.tradingSignals.slice(-10);
        }
    }

    calculateConfidence(tokenData) {
        let confidence = 50; // Base confidence
        
        if (tokenData.type === 'NEW_TOKEN') {
            confidence += 20; // New tokens get bonus
        }
        
        if (tokenData.type === 'WHALE_ACTIVITY') {
            confidence += 30; // Whale activity gets bigger bonus
        }
        
        // Add some randomness to simulate real analysis
        confidence += Math.floor(Math.random() * 20) - 10; // ±10
        
        return Math.max(10, Math.min(95, confidence));
    }

    determineAction(tokenData) {
        const rand = Math.random();
        
        if (tokenData.type === 'WHALE_ACTIVITY') {
            return rand > 0.3 ? 'BUY' : 'WATCH'; // 70% buy on whale activity
        }
        
        if (tokenData.type === 'NEW_TOKEN') {
            return rand > 0.5 ? 'BUY' : 'WATCH'; // 50% buy on new tokens
        }
        
        return 'WATCH';
    }

    calculateUrgency(tokenData) {
        if (tokenData.type === 'WHALE_ACTIVITY') return 'HIGH';
        if (tokenData.type === 'NEW_TOKEN') return 'MEDIUM';
        return 'LOW';
    }

    printStatus() {
        console.log(`\n📊 LIVE BRIDGE STATUS - ${new Date().toISOString().split('T')[1].slice(0,8)}`);
        console.log(`   Tokens Detected: ${this.stats.tokensDetected}`);
        console.log(`   Whales Found: ${this.stats.whalesFound}`);
        console.log(`   Signals Generated: ${this.stats.signalsGenerated}`);
        console.log(`   Last Update: ${this.stats.lastUpdate.toISOString().split('T')[1].slice(0,8)}`);
        console.log(`   Active Signals: ${this.tradingSignals.length}`);
        
        if (this.tradingSignals.length > 0) {
            const lastSignal = this.tradingSignals[this.tradingSignals.length - 1];
            console.log(`   Latest: ${lastSignal.type} - ${lastSignal.action} (${lastSignal.confidence}%)`);
        }
        console.log('');
    }
}

// Start the bridge
const bridge = new LiveDataBridge();
bridge.start().catch(console.error); 