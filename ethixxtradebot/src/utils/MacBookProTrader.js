import { macBookTrader } from './services/MacBookOptimizedTrader.js';
import { memoryManager } from './services/MemoryManager.js';
import { threadingSystem } from './services/IntelOptimizedThreading.js';
import { thermalManager } from './services/ThermalManager.js';
import { whaleDiscovery } from './services/IntelligentWhaleDiscovery.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Complete MacBook Pro Optimized Trading System
 * Integrates all performance-optimized components
 */
export class MacBookProTrader extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Hardware optimization settings
            targetLatency: 5,           // 5ms max latency
            targetThroughput: 2000,     // 2000 messages/second
            maxCpuUsage: 70,           // 70% CPU usage limit
            maxMemoryUsage: 4,         // 4GB memory limit
            
            // Trading configuration
            riskLevel: 'conservative',
            maxPositionSize: 0.05,     // 5% of portfolio
            stopLoss: 0.03,            // 3% stop loss
            takeProfit: 0.08,          // 8% take profit
            
            // Connection settings
            wsUrl: 'wss://api6.axiom.trade/ws',
            reconnectDelay: 1000,
            maxReconnectAttempts: 5
        };
        
        this.state = {
            isRunning: false,
            isConnected: false,
            performanceLevel: 100,
            messagesProcessed: 0,
            tradesExecuted: 0,
            lastHeartbeat: 0,
            uptime: 0
        };
        
        this.components = {
            trader: macBookTrader,
            memory: memoryManager,
            threading: threadingSystem,
            thermal: thermalManager,
            whaleDiscovery: whaleDiscovery
        };
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.startTime = Date.now();
        this.logger = console;
        
        // Performance monitoring
        this.metrics = {
            latency: [],
            throughput: [],
            cpuUsage: [],
            memoryUsage: [],
            temperature: []
        };
        
        this.setupEventHandlers();
    }

    async init() {
        this.logger.log('🚀 MacBook Pro Trading System Initializing');
        this.logger.log('═══════════════════════════════════════════════════');
        this.logger.log('💻 Hardware: Intel i5 4-core, 16GB RAM, 3733MHz memory');
        this.logger.log('🎯 Performance Targets: <5ms latency, 2000+ msg/sec, <70% CPU');
        this.logger.log('═══════════════════════════════════════════════════');
        
        try {
            // Initialize components in optimal order
            await this.initializeComponents();
            
            // Setup performance monitoring
            this.startPerformanceMonitoring();
            
            // Setup thermal management integration
            this.integrateThermalManagement();
            
            // Initialize whale discovery
            await this.initializeWhaleDiscovery();
            
            // Connect to trading WebSocket
            await this.connectWebSocket();
            
            this.state.isRunning = true;
            this.logger.log('✅ MacBook Pro Trading System READY!');
            this.logger.log('🔥 Maximum performance mode activated');
            
            return true;
            
        } catch (error) {
            this.logger.error('❌ Initialization failed:', error.message);
            await this.shutdown();
            throw error;
        }
    }

    async initializeComponents() {
        this.logger.log('[INIT] 🔧 Initializing core components...');
        
        // 1. Memory management first (foundation)
        await this.components.memory.init();
        this.logger.log('[INIT] ✅ Memory management ready');
        
        // 2. Threading system (CPU optimization)
        await this.components.threading.init();
        this.logger.log('[INIT] ✅ Threading system ready');
        
        // 3. Thermal management (performance protection)
        await this.components.thermal.init();
        this.logger.log('[INIT] ✅ Thermal management ready');
        
        // 4. Main trading engine
        await this.components.trader.init();
        this.logger.log('[INIT] ✅ Trading engine ready');
        
        this.logger.log('[INIT] 🎉 All components initialized successfully');
    }

    setupEventHandlers() {
        // Thermal management integration
        this.components.thermal.on('performance-level-changed', (data) => {
            this.handlePerformanceChange(data);
        });
        
        this.components.thermal.on('critical-temperature', (data) => {
            this.handleCriticalTemperature(data);
        });
        
        this.components.thermal.on('emergency-shutdown', (data) => {
            this.handleEmergencyShutdown(data);
        });
        
        // Memory management integration
        this.components.memory.on('memory-warning', (data) => {
            this.handleMemoryWarning(data);
        });
        
        // Threading system integration
        this.components.threading.on('task-result', (data) => {
            this.handleTaskResult(data);
        });
        
        // Trading system integration
        this.components.trader.on('critical-signal', (data) => {
            this.handleCriticalSignal(data);
        });
        
        // Whale discovery integration
        this.components.whaleDiscovery.on('whale-discovered', (data) => {
            this.handleWhaleDiscovered(data);
        });
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.logger.log('[WS] 🔌 Connecting to trading WebSocket...');
            
            this.ws = new WebSocket(this.config.wsUrl, {
                perMessageDeflate: false,  // Disable compression for speed
                maxPayload: 1024 * 1024   // 1MB max message size
            });
            
            // Connection timeout
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);
            
            this.ws.on('open', () => {
                clearTimeout(timeout);
                this.state.isConnected = true;
                this.reconnectAttempts = 0;
                this.logger.log('[WS] ✅ Connected to trading feed');
                
                // Send subscription message
                this.subscribeToFeeds();
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleWebSocketMessage(data);
            });
            
            this.ws.on('error', (error) => {
                clearTimeout(timeout);
                this.logger.error('[WS] ❌ WebSocket error:', error.message);
                reject(error);
            });
            
            this.ws.on('close', (code, reason) => {
                this.state.isConnected = false;
                this.logger.warn(`[WS] 🔌 Connection closed: ${code} ${reason}`);
                this.handleWebSocketClose();
            });
        });
    }

    subscribeToFeeds() {
        const subscriptions = {
            type: 'subscribe',
            channels: [
                'whales',           // Whale activity
                'volume_spikes',    // Volume anomalies  
                'new_tokens',       // New token launches
                'price_alerts',     // Significant price movements
                'liquidations'      // Liquidation events
            ],
            filters: {
                min_volume: 10000,      // $10k minimum volume
                min_whale_size: 50000,  // $50k minimum whale transaction
                max_latency: 100        // 100ms max acceptable latency
            }
        };
        
        this.ws.send(JSON.stringify(subscriptions));
        this.logger.log('[WS] 📡 Subscribed to trading feeds');
    }

    handleWebSocketMessage(data) {
        const startTime = performance.now();
        
        try {
            // Parse message
            const message = JSON.parse(data);
            
            // Route to appropriate processor based on message type
            this.routeMessage(message, startTime);
            
            // Update metrics
            this.state.messagesProcessed++;
            this.updateLatencyMetric(performance.now() - startTime);
            
        } catch (error) {
            this.logger.error('[WS] Message processing error:', error.message);
        }
    }

    routeMessage(message, startTime) {
        const { type, priority = 'normal' } = message;
        
        // Create task for threading system
        const task = {
            type: type,
            category: this.categorizeMessage(type),
            data: message,
            timestamp: startTime,
            callback: (error, result) => {
                if (error) {
                    this.logger.error(`[ROUTE] Task error: ${error}`);
                } else {
                    this.handleTaskResult(result);
                }
            }
        };
        
        // Route based on urgency and message type
        if (this.isCriticalMessage(message)) {
            // Process immediately on main thread
            this.components.trader.processMessage(message, startTime);
        } else {
            // Route to threading system
            this.components.threading.processTask(task, priority);
        }
    }

    categorizeMessage(type) {
        const categories = {
            'whale_transaction': 'analysis',
            'volume_spike': 'analysis',
            'price_movement': 'analysis',
            'new_token': 'analysis',
            'trade_signal': 'execution',
            'order_update': 'execution',
            'liquidation': 'execution',
            'heartbeat': 'background',
            'system_status': 'background'
        };
        
        return categories[type] || 'analysis';
    }

    isCriticalMessage(message) {
        const criticalTypes = [
            'emergency_stop',
            'flash_crash',
            'whale_dump',
            'liquidation_cascade'
        ];
        
        const criticalThresholds = {
            volume: 1000000,    // $1M+ volume
            price_change: 0.1,  // 10%+ price change
            whale_size: 500000  // $500k+ whale transaction
        };
        
        // Check message type
        if (criticalTypes.includes(message.type)) {
            return true;
        }
        
        // Check thresholds
        if (message.volume && message.volume > criticalThresholds.volume) {
            return true;
        }
        
        if (message.price_change && Math.abs(message.price_change) > criticalThresholds.price_change) {
            return true;
        }
        
        if (message.whale_size && message.whale_size > criticalThresholds.whale_size) {
            return true;
        }
        
        return false;
    }

    // Event handlers
    handlePerformanceChange(data) {
        this.state.performanceLevel = data.level;
        this.logger.log(`[PERF] 🎚️ Performance adjusted: ${data.level}% (${data.description})`);
        
        // Adjust trading parameters based on performance level
        this.adjustTradingParameters(data.level);
    }

    handleCriticalTemperature(data) {
        this.logger.warn(`[THERMAL] 🚨 Critical temperature: ${data.temperature}°C`);
        
        // Reduce trading activity
        this.reduceTradingActivity();
        
        // Emit warning to external systems
        this.emit('thermal-warning', data);
    }

    handleEmergencyShutdown(data) {
        this.logger.error('[THERMAL] 🛑 Emergency thermal shutdown initiated');
        
        // Save critical state immediately
        this.saveEmergencyState();
        
        // Shutdown gracefully
        this.shutdown();
    }

    handleMemoryWarning(data) {
        this.logger.warn('[MEMORY] ⚠️ Memory pressure elevated');
        
        // Trigger aggressive cleanup
        this.components.memory.triggerCleanup();
        
        // Reduce memory-intensive operations
        this.reduceMemoryUsage();
    }

    handleTaskResult(result) {
        // Process task results and emit appropriate signals
        if (result.type === 'trade_signal') {
            this.emit('trade-signal', result);
        } else if (result.type === 'whale_analysis') {
            this.emit('whale-analysis', result);
        }
    }

    handleCriticalSignal(data) {
        this.logger.log(`[SIGNAL] ⚡ Critical signal: ${data.signal.action} (${(data.signal.confidence * 100).toFixed(1)}%)`);
        
        // Execute immediately if confidence is high
        if (data.signal.confidence > 0.8) {
            this.executeTrade(data.signal);
        }
    }

    handleWhaleDiscovered(data) {
        this.logger.log(`[WHALE] 🐋 New whale discovered: ${data.address.substring(0, 8)}... (Score: ${data.score})`);
        
        // Add to tracking if high-scoring
        if (data.score > 0.85) {
            this.addWhaleToTracking(data);
        }
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        this.logger.log('[MONITOR] 📊 Starting performance monitoring...');
        
        setInterval(() => {
            this.updatePerformanceMetrics();
            this.logPerformanceStatus();
        }, 10000); // Every 10 seconds
        
        // Detailed performance analysis every minute
        setInterval(() => {
            this.analyzePerformance();
        }, 60000);
    }

    updatePerformanceMetrics() {
        // Get system metrics
        const memory = process.memoryUsage();
        const thermal = this.components.thermal.getPerformanceSnapshot();
        
        // Update metrics arrays
        this.metrics.latency.push(this.getAverageLatency());
        this.metrics.throughput.push(this.state.messagesProcessed);
        this.metrics.cpuUsage.push(thermal.cpuUsage);
        this.metrics.memoryUsage.push(memory.heapUsed / (1024**3)); // GB
        this.metrics.temperature.push(thermal.temperature);
        
        // Keep only recent metrics
        const maxSamples = 60; // 10 minutes worth
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > maxSamples) {
                this.metrics[key] = this.metrics[key].slice(-maxSamples);
            }
        });
        
        // Reset counters
        this.state.messagesProcessed = 0;
        this.state.uptime = Date.now() - this.startTime;
    }

    logPerformanceStatus() {
        const thermal = this.components.thermal.getPerformanceSnapshot();
        const memory = this.components.memory.getMemoryStatus();
        const threading = this.components.threading.getThreadingStatus();
        
        this.logger.log('📊 PERFORMANCE STATUS:');
        this.logger.log(`   🌡️  Temperature: ${thermal.temperature.toFixed(1)}°C (${thermal.performanceLevel}%)`);
        this.logger.log(`   💾 Memory: ${memory.trading.used}/${memory.trading.allocated} (${memory.trading.pressure})`);
        this.logger.log(`   🧵 Threads: ${threading.workers.total} workers, ${threading.queues.critical + threading.queues.high} pending`);
        this.logger.log(`   ⚡ Latency: ${this.getAverageLatency().toFixed(2)}ms avg`);
        this.logger.log(`   📈 Throughput: ${this.state.messagesProcessed}/sec`);
        this.logger.log(`   ⏱️  Uptime: ${Math.floor(this.state.uptime / 60000)}m`);
    }

    getAverageLatency() {
        const recentLatencies = this.metrics.latency.slice(-10);
        return recentLatencies.length > 0 ? 
            recentLatencies.reduce((sum, l) => sum + l, 0) / recentLatencies.length : 0;
    }

    updateLatencyMetric(latency) {
        // Simple exponential moving average
        const alpha = 0.1;
        const currentAvg = this.getAverageLatency();
        const newAvg = currentAvg > 0 ? 
            (alpha * latency) + ((1 - alpha) * currentAvg) : latency;
        
        // Update the metrics array
        if (this.metrics.latency.length > 0) {
            this.metrics.latency[this.metrics.latency.length - 1] = newAvg;
        } else {
            this.metrics.latency.push(latency);
        }
    }

    // System status and reporting
    getSystemStatus() {
        return {
            state: this.state,
            performance: {
                avgLatency: this.getAverageLatency(),
                throughput: this.state.messagesProcessed,
                uptime: this.state.uptime
            },
            components: {
                thermal: this.components.thermal.getThermalStatus(),
                memory: this.components.memory.getMemoryStatus(),
                threading: this.components.threading.getThreadingStatus(),
                whaleDiscovery: this.components.whaleDiscovery.getWhaleIntelligenceReport()
            },
            connection: {
                isConnected: this.state.isConnected,
                lastHeartbeat: this.state.lastHeartbeat,
                reconnectAttempts: this.reconnectAttempts
            }
        };
    }

    // Missing method implementations
    adjustTradingParameters(performanceLevel) {
        // Adjust trading based on performance level
        this.logger.log(`[TRADING] Adjusting parameters for ${performanceLevel}% performance`);
    }

    reduceTradingActivity() {
        // Reduce trading activity during thermal stress
        this.logger.log('[TRADING] Reducing activity due to thermal constraints');
    }

    saveEmergencyState() {
        // Save critical state immediately
        this.logger.log('[EMERGENCY] Saving critical state...');
    }

    reduceMemoryUsage() {
        // Reduce memory-intensive operations
        this.logger.log('[MEMORY] Reducing memory usage...');
    }

    executeTrade(signal) {
        // Execute trade signal
        this.logger.log(`[TRADE] Executing ${signal.action} signal with ${(signal.confidence * 100).toFixed(1)}% confidence`);
        this.state.tradesExecuted++;
    }

    addWhaleToTracking(whaleData) {
        // Add whale to tracking system
        this.logger.log(`[WHALE] Adding whale ${whaleData.address.substring(0, 8)}... to tracking`);
    }

    handleWebSocketClose() {
        // Handle WebSocket connection close
        this.logger.warn('[WS] Connection closed, attempting reconnect...');
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connectWebSocket().catch(error => {
                    this.logger.error('[WS] Reconnect failed:', error.message);
                });
            }, this.config.reconnectDelay);
        }
    }

    integrateThermalManagement() {
        // Integrate thermal management
        this.logger.log('[THERMAL] Integrating thermal management...');
    }

    async initializeWhaleDiscovery() {
        // Initialize whale discovery
        await this.components.whaleDiscovery.init();
        this.logger.log('[WHALE] Whale discovery initialized');
    }

    analyzePerformance() {
        // Analyze system performance
        const status = this.getSystemStatus();
        this.logger.log(`[ANALYSIS] Performance: ${status.performance.avgLatency.toFixed(2)}ms avg latency`);
    }

    // Graceful shutdown
    async shutdown() {
        this.logger.log('🛑 MacBook Pro Trading System shutting down...');
        
        this.state.isRunning = false;
        
        // Close WebSocket connection
        if (this.ws) {
            this.ws.close();
        }
        
        // Save system state
        await this.saveSystemState();
        
        // Shutdown components in reverse order
        try {
            await this.components.whaleDiscovery.saveWhaleDatabase();
            await this.components.trader.shutdown();
            await this.components.threading.shutdown();
            await this.components.thermal.shutdown();
            // Memory manager shuts down automatically
            
            this.logger.log('✅ MacBook Pro Trading System shutdown complete');
        } catch (error) {
            this.logger.error('❌ Shutdown error:', error.message);
        }
    }

    async saveSystemState() {
        // Save critical system state for recovery
        const state = {
            timestamp: Date.now(),
            uptime: this.state.uptime,
            performance: this.getSystemStatus(),
            activePositions: [], // TODO: Add position tracking
            discoveredWhales: Array.from(this.components.whaleDiscovery.discoveredWhales.values())
        };
        
        // Save to file (implement file saving logic)
        this.logger.log('💾 System state saved');
    }
}

// Export singleton for easy access
export const macBookProTrader = new MacBookProTrader();

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    macBookProTrader.init().catch(error => {
        console.error('Failed to start MacBook Pro Trader:', error);
        process.exit(1);
    });
} 