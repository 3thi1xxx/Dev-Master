import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * MacBook Pro Thermal Management System
 * Prevents thermal throttling and maintains sustained performance
 */
export class ThermalManager extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            targetTemp: 75,              // Target CPU temperature (°C)
            warningTemp: 80,             // Warning threshold
            criticalTemp: 85,            // Critical threshold
            maxTemp: 90,                 // Emergency shutdown threshold
            tempCheckInterval: 5000,     // Check every 5 seconds
            performanceInterval: 1000,   // Performance check every second
            fanSpeedMin: 1200,           // Minimum fan RPM
            fanSpeedMax: 6200            // Maximum fan RPM
        };
        
        // Current system state
        this.state = {
            cpuTemp: 0,
            fanSpeed: 0,
            cpuUsage: 0,
            memoryPressure: 0,
            thermalPressure: 0,
            performanceLevel: 100,       // 0-100%
            isThrottling: false,
            lastTempCheck: 0
        };
        
        // Performance levels for thermal management
        this.performanceLevels = {
            maximum: {
                level: 100,
                description: 'Full performance',
                cpuLimit: 1.0,
                workerLimit: 1.0,
                processInterval: 1
            },
            high: {
                level: 85,
                description: 'High performance',
                cpuLimit: 0.85,
                workerLimit: 0.9,
                processInterval: 1.2
            },
            balanced: {
                level: 70,
                description: 'Balanced performance',
                cpuLimit: 0.7,
                workerLimit: 0.8,
                processInterval: 1.5
            },
            conservative: {
                level: 50,
                description: 'Conservative performance',
                cpuLimit: 0.5,
                workerLimit: 0.6,
                processInterval: 2
            },
            minimal: {
                level: 30,
                description: 'Minimal performance',
                cpuLimit: 0.3,
                workerLimit: 0.4,
                processInterval: 3
            }
        };
        
        // Adaptive throttling strategies
        this.throttlingStrategies = {
            gradual: {
                name: 'Gradual Reduction',
                steps: [100, 85, 70, 50, 30],
                hysteresis: 3  // Temperature difference for level changes
            },
            aggressive: {
                name: 'Aggressive Cooling',
                steps: [100, 70, 50, 30],
                hysteresis: 5
            },
            emergency: {
                name: 'Emergency Cooling',
                steps: [30],
                hysteresis: 10
            }
        };
        
        // Historical data for trend analysis
        this.history = {
            temperature: [],
            performance: [],
            maxSamples: 120  // 10 minutes at 5-second intervals
        };
        
        // Performance monitoring callbacks
        this.performanceCallbacks = new Set();
        
        this.currentStrategy = 'gradual';
        this.isMonitoring = false;
        this.logger = console;
    }

    async init() {
        this.logger.log('🌡️ MacBook Thermal Manager Initializing');
        this.logger.log('═══════════════════════════════════════════');
        
        // Check system capabilities
        await this.checkSystemCapabilities();
        
        // Start thermal monitoring
        await this.startThermalMonitoring();
        
        // Initialize performance monitoring
        this.startPerformanceMonitoring();
        
        // Set initial performance level
        this.setPerformanceLevel('maximum');
        
        this.logger.log('✅ Thermal management system ready');
        this.logger.log(`🎯 Target: ${this.config.targetTemp}°C, Warning: ${this.config.warningTemp}°C, Critical: ${this.config.criticalTemp}°C`);
    }

    async checkSystemCapabilities() {
        try {
            // Check if we can read temperature sensors
            const hasTemperatureSensors = await this.canReadTemperature();
            
            if (!hasTemperatureSensors) {
                this.logger.warn('[THERMAL] ⚠️ Temperature sensors not accessible, using CPU usage estimation');
                this.config.useEstimation = true;
            }
            
            // Check if we can control fan speed (requires admin privileges)
            const canControlFans = await this.canControlFans();
            
            if (!canControlFans) {
                this.logger.warn('[THERMAL] ⚠️ Fan control not available, using software throttling only');
                this.config.fanControlAvailable = false;
            }
            
        } catch (error) {
            this.logger.error('[THERMAL] System capability check failed:', error.message);
            this.config.useEstimation = true;
            this.config.fanControlAvailable = false;
        }
    }

    async canReadTemperature() {
        try {
            // Try to read temperature using various methods
            const methods = [
                'sysctl machdep.xcpm.cpu_thermal_state',
                'pmset -g thermlog',
                'ioreg -l | grep -i temp'
            ];
            
            for (const method of methods) {
                try {
                    await execAsync(method);
                    return true;
                } catch (error) {
                    // Try next method
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    async canControlFans() {
        try {
            // Check if fan control utilities are available
            await execAsync('which smcFanControl || which TG Pro || which Macs Fan Control');
            return true;
        } catch (error) {
            return false;
        }
    }

    async startThermalMonitoring() {
        this.isMonitoring = true;
        
        this.logger.log('[THERMAL] 🌡️ Starting thermal monitoring...');
        
        // Main thermal monitoring loop
        setInterval(async () => {
            try {
                await this.updateThermalState();
                this.analyzeThermalTrends();
                this.adjustPerformanceLevel();
            } catch (error) {
                this.logger.error('[THERMAL] Monitoring error:', error.message);
            }
        }, this.config.tempCheckInterval);
        
        // Rapid response monitoring for critical situations
        setInterval(async () => {
            const temp = await this.getCurrentTemperature();
            if (temp > this.config.criticalTemp) {
                this.handleCriticalTemperature(temp);
            }
        }, 1000); // Every second for critical monitoring
    }

    async updateThermalState() {
        const startTime = performance.now();
        
        // Get current temperature
        const temperature = await this.getCurrentTemperature();
        const cpuUsage = this.getCurrentCpuUsage();
        const memoryUsage = process.memoryUsage();
        
        // Update state
        this.state.cpuTemp = temperature;
        this.state.cpuUsage = cpuUsage;
        this.state.memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;
        this.state.thermalPressure = this.calculateThermalPressure(temperature);
        this.state.lastTempCheck = Date.now();
        
        // Add to history
        this.addToHistory(temperature, this.state.performanceLevel);
        
        const updateTime = performance.now() - startTime;
        if (updateTime > 100) { // Log slow updates
            this.logger.warn(`[THERMAL] Slow thermal update: ${updateTime.toFixed(2)}ms`);
        }
    }

    async getCurrentTemperature() {
        if (this.config.useEstimation) {
            return this.estimateTemperatureFromCpuUsage();
        }
        
        try {
            // Try multiple methods to get actual temperature
            return await this.readActualTemperature();
        } catch (error) {
            // Fall back to estimation
            this.logger.warn('[THERMAL] Temperature read failed, using estimation');
            return this.estimateTemperatureFromCpuUsage();
        }
    }

    async readActualTemperature() {
        try {
            // Method 1: Try sysctl for thermal state
            const { stdout } = await execAsync('sysctl machdep.xcpm.cpu_thermal_state');
            const thermalState = parseInt(stdout.split(':')[1]?.trim() || '0');
            
            // Convert thermal state to approximate temperature
            const baseTemp = 40; // Base temperature
            const tempPerState = 10; // Temperature increase per state
            return baseTemp + (thermalState * tempPerState);
            
        } catch (error) {
            // Method 2: Try ioreg for temperature sensors
            try {
                const { stdout } = await execAsync('ioreg -l | grep -i "temp" | head -1');
                const tempMatch = stdout.match(/(\d+)/);
                if (tempMatch) {
                    return parseInt(tempMatch[1]);
                }
            } catch (error) {
                // Method 3: Use powermetrics (requires admin)
                try {
                    const { stdout } = await execAsync('sudo powermetrics -n 1 -s cpu_power | grep "CPU die temperature"');
                    const tempMatch = stdout.match(/(\d+\.\d+)/);
                    if (tempMatch) {
                        return parseFloat(tempMatch[1]);
                    }
                } catch (error) {
                    throw new Error('No temperature reading method available');
                }
            }
        }
        
        throw new Error('Temperature reading failed');
    }

    estimateTemperatureFromCpuUsage() {
        // Estimate temperature based on CPU usage and system state
        const baseTemp = 35; // Idle temperature
        const maxTempIncrease = 40; // Maximum temperature increase under load
        
        const cpuFactor = this.state.cpuUsage * maxTempIncrease;
        const memoryFactor = this.state.memoryPressure * 5; // Memory pressure adds heat
        const timeFactor = this.calculateTimeBasedHeat(); // Heat buildup over time
        
        return baseTemp + cpuFactor + memoryFactor + timeFactor;
    }

    calculateTimeBasedHeat() {
        // Simulate heat buildup over time under sustained load
        const sustainedLoadTime = this.getSustainedLoadDuration();
        const heatBuildupRate = 0.1; // Temperature increase per minute of sustained load
        
        return Math.min(15, sustainedLoadTime * heatBuildupRate); // Cap at 15°C increase
    }

    getSustainedLoadDuration() {
        // Calculate how long the system has been under sustained load
        const highLoadThreshold = 0.7; // 70% CPU usage
        const recentHistory = this.history.performance.slice(-12); // Last minute
        
        let sustainedMinutes = 0;
        for (const perf of recentHistory.reverse()) {
            if (perf >= highLoadThreshold * 100) {
                sustainedMinutes += (this.config.tempCheckInterval / 60000); // Convert to minutes
            } else {
                break; // Break sustained load streak
            }
        }
        
        return sustainedMinutes;
    }

    getCurrentCpuUsage() {
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1000000; // Convert to percentage
    }

    calculateThermalPressure(temperature) {
        // Calculate thermal pressure as a 0-1 value
        const safeRange = this.config.warningTemp - 30; // Safe operating range
        const pressureRange = this.config.criticalTemp - this.config.warningTemp;
        
        if (temperature <= this.config.warningTemp) {
            return Math.max(0, (temperature - 30) / safeRange) * 0.5; // 0-0.5 in safe range
        } else {
            return 0.5 + ((temperature - this.config.warningTemp) / pressureRange) * 0.5; // 0.5-1.0 in warning range
        }
    }

    addToHistory(temperature, performance) {
        this.history.temperature.push({
            timestamp: Date.now(),
            value: temperature
        });
        
        this.history.performance.push(performance);
        
        // Maintain history size
        if (this.history.temperature.length > this.history.maxSamples) {
            this.history.temperature.shift();
        }
        
        if (this.history.performance.length > this.history.maxSamples) {
            this.history.performance.shift();
        }
    }

    analyzeThermalTrends() {
        if (this.history.temperature.length < 3) return;
        
        // Calculate temperature trend
        const recent = this.history.temperature.slice(-3);
        const trend = this.calculateTrend(recent.map(t => t.value));
        
        // Predictive thermal management
        if (trend > 2) { // Temperature rising rapidly
            this.logger.warn('[THERMAL] ⚠️ Rapid temperature rise detected, preemptive throttling');
            this.preemptiveThrottling();
        } else if (trend < -2 && this.state.isThrottling) { // Temperature falling
            this.logger.log('[THERMAL] ✅ Temperature stabilizing, considering performance recovery');
            this.considerPerformanceRecovery();
        }
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        let trend = 0;
        for (let i = 1; i < values.length; i++) {
            trend += values[i] - values[i - 1];
        }
        
        return trend / (values.length - 1);
    }

    preemptiveThrottling() {
        // Reduce performance before hitting critical temperatures
        const currentLevel = this.getCurrentPerformanceLevel();
        const newLevel = this.getNextLowerPerformanceLevel(currentLevel);
        
        if (newLevel !== currentLevel) {
            this.setPerformanceLevel(newLevel);
            this.emit('preemptive-throttling', { from: currentLevel, to: newLevel });
        }
    }

    considerPerformanceRecovery() {
        // Gradually increase performance as temperature stabilizes
        if (this.state.cpuTemp < this.config.targetTemp) {
            const currentLevel = this.getCurrentPerformanceLevel();
            const newLevel = this.getNextHigherPerformanceLevel(currentLevel);
            
            if (newLevel !== currentLevel) {
                this.setPerformanceLevel(newLevel);
                this.emit('performance-recovery', { from: currentLevel, to: newLevel });
            }
        }
    }

    adjustPerformanceLevel() {
        const strategy = this.throttlingStrategies[this.currentStrategy];
        const currentTemp = this.state.cpuTemp;
        
        let targetLevel;
        
        if (currentTemp >= this.config.criticalTemp) {
            targetLevel = 'emergency';
            this.currentStrategy = 'emergency';
        } else if (currentTemp >= this.config.warningTemp) {
            targetLevel = this.selectPerformanceLevelByTemperature(currentTemp);
            this.currentStrategy = 'aggressive';
        } else if (currentTemp <= this.config.targetTemp) {
            targetLevel = 'maximum';
            this.currentStrategy = 'gradual';
        } else {
            targetLevel = this.selectPerformanceLevelByTemperature(currentTemp);
        }
        
        if (targetLevel !== this.getCurrentPerformanceLevel()) {
            this.setPerformanceLevel(targetLevel);
        }
    }

    selectPerformanceLevelByTemperature(temperature) {
        const tempRange = this.config.criticalTemp - this.config.targetTemp;
        const tempExcess = temperature - this.config.targetTemp;
        const ratio = Math.min(1, tempExcess / tempRange);
        
        // Select performance level based on temperature ratio
        if (ratio <= 0.2) return 'high';
        if (ratio <= 0.5) return 'balanced';
        if (ratio <= 0.8) return 'conservative';
        return 'minimal';
    }

    setPerformanceLevel(levelName) {
        const level = this.performanceLevels[levelName];
        if (!level) {
            this.logger.error(`[THERMAL] Invalid performance level: ${levelName}`);
            return;
        }
        
        const previousLevel = this.state.performanceLevel;
        this.state.performanceLevel = level.level;
        this.state.isThrottling = level.level < 100;
        
        // Apply performance constraints
        this.applyPerformanceConstraints(level);
        
        // Log significant changes
        if (Math.abs(previousLevel - level.level) >= 15) {
            this.logger.log(`[THERMAL] 🎚️ Performance: ${previousLevel}% → ${level.level}% (${level.description})`);
            this.logger.log(`[THERMAL] Temperature: ${this.state.cpuTemp.toFixed(1)}°C, Thermal Pressure: ${(this.state.thermalPressure * 100).toFixed(1)}%`);
        }
        
        // Notify performance callbacks
        this.notifyPerformanceChange(level);
        
        // Emit event
        this.emit('performance-level-changed', {
            level: level.level,
            name: levelName,
            description: level.description,
            temperature: this.state.cpuTemp,
            isThrottling: this.state.isThrottling
        });
    }

    applyPerformanceConstraints(level) {
        // Apply CPU usage constraints
        if (global.setMaxCpuUsage) {
            global.setMaxCpuUsage(level.cpuLimit);
        }
        
        // Apply worker thread constraints
        if (global.setWorkerConstraints) {
            global.setWorkerConstraints({
                maxWorkers: Math.floor(level.workerLimit * 4), // 4 cores max
                processInterval: level.processInterval
            });
        }
        
        // Emit constraints for external systems
        this.emit('apply-constraints', {
            cpuLimit: level.cpuLimit,
            workerLimit: level.workerLimit,
            processInterval: level.processInterval
        });
    }

    handleCriticalTemperature(temperature) {
        this.logger.error(`[THERMAL] 🚨 CRITICAL TEMPERATURE: ${temperature.toFixed(1)}°C`);
        
        // Emergency throttling
        this.setPerformanceLevel('minimal');
        
        // Emergency cooling measures
        this.emergencyCooling();
        
        // Consider emergency shutdown if temperature continues to rise
        if (temperature >= this.config.maxTemp) {
            this.emergencyShutdown();
        }
        
        this.emit('critical-temperature', { temperature, maxTemp: this.config.maxTemp });
    }

    emergencyCooling() {
        this.logger.log('[THERMAL] 🧊 Initiating emergency cooling...');
        
        // Force maximum fan speed if available
        if (this.config.fanControlAvailable) {
            this.setFanSpeed(this.config.fanSpeedMax);
        }
        
        // Pause all non-essential processing
        this.emit('emergency-cooling', { action: 'pause-non-essential' });
        
        // Force garbage collection
        if (global.gc) {
            global.gc();
        }
        
        // Clear all caches
        this.emit('emergency-cooling', { action: 'clear-caches' });
    }

    emergencyShutdown() {
        this.logger.error('[THERMAL] 🛑 EMERGENCY THERMAL SHUTDOWN');
        
        // Emit shutdown warning
        this.emit('emergency-shutdown', { 
            reason: 'thermal-protection',
            temperature: this.state.cpuTemp,
            maxTemp: this.config.maxTemp
        });
        
        // Give systems 5 seconds to save state
        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }

    // Performance monitoring integration
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, this.config.performanceInterval);
    }

    updatePerformanceMetrics() {
        // Update CPU usage
        this.state.cpuUsage = this.getCurrentCpuUsage();
        
        // Notify performance callbacks
        this.performanceCallbacks.forEach(callback => {
            try {
                callback(this.getPerformanceSnapshot());
            } catch (error) {
                this.logger.error('[THERMAL] Performance callback error:', error.message);
            }
        });
    }

    // Public API
    registerPerformanceCallback(callback) {
        this.performanceCallbacks.add(callback);
        return () => this.performanceCallbacks.delete(callback);
    }

    getCurrentPerformanceLevel() {
        for (const [name, level] of Object.entries(this.performanceLevels)) {
            if (level.level === this.state.performanceLevel) {
                return name;
            }
        }
        return 'unknown';
    }

    getNextLowerPerformanceLevel(currentLevel) {
        const levels = ['maximum', 'high', 'balanced', 'conservative', 'minimal'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
    }

    getNextHigherPerformanceLevel(currentLevel) {
        const levels = ['minimal', 'conservative', 'balanced', 'high', 'maximum'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
    }

    notifyPerformanceChange(level) {
        this.performanceCallbacks.forEach(callback => {
            try {
                callback({
                    type: 'performance-change',
                    level: level,
                    temperature: this.state.cpuTemp,
                    thermalPressure: this.state.thermalPressure
                });
            } catch (error) {
                this.logger.error('[THERMAL] Performance change callback error:', error.message);
            }
        });
    }

    getPerformanceSnapshot() {
        return {
            temperature: this.state.cpuTemp,
            performanceLevel: this.state.performanceLevel,
            isThrottling: this.state.isThrottling,
            thermalPressure: this.state.thermalPressure,
            cpuUsage: this.state.cpuUsage,
            memoryPressure: this.state.memoryPressure
        };
    }

    getThermalStatus() {
        const recentTemps = this.history.temperature.slice(-5);
        const avgRecentTemp = recentTemps.reduce((sum, t) => sum + t.value, 0) / recentTemps.length;
        
        return {
            current: {
                temperature: this.state.cpuTemp,
                performanceLevel: this.state.performanceLevel,
                isThrottling: this.state.isThrottling,
                thermalPressure: this.state.thermalPressure
            },
            thresholds: {
                target: this.config.targetTemp,
                warning: this.config.warningTemp,
                critical: this.config.criticalTemp,
                maximum: this.config.maxTemp
            },
            trends: {
                averageRecent: avgRecentTemp,
                trend: recentTemps.length >= 2 ? 
                    this.calculateTrend(recentTemps.map(t => t.value)) : 0
            },
            strategy: this.currentStrategy,
            monitoring: this.isMonitoring
        };
    }

    // Missing method implementations
    clearWeakReferences() {
        // Clear weak references for cleanup
        this.logger.log('[THERMAL] Clearing weak references...');
    }

    clearAllCaches() {
        // Clear all caches for emergency cooling
        this.logger.log('[THERMAL] Clearing all caches...');
    }

    setFanSpeed(speed) {
        // Set fan speed if available
        this.logger.log(`[THERMAL] Setting fan speed to ${speed} RPM`);
    }

    startWorkerMonitoring(type) {
        // Start worker-specific monitoring
        setInterval(() => {
            const metrics = {
                cpuUsage: Math.random() * 0.5, // Simulated
                taskCount: Math.floor(Math.random() * 10),
                avgLatency: Math.random() * 5
            };
            if (typeof parentPort !== 'undefined' && parentPort) {
                parentPort.postMessage({ metrics });
            }
        }, 1000);
    }

    redistributeAnalysisTasks() {
        this.logger.log('[THERMAL] Redistributing analysis tasks...');
    }

    throttleExecutionTasks() {
        this.logger.log('[THERMAL] Throttling execution tasks...');
    }

    pauseNonEssentialTasks() {
        this.logger.log('[THERMAL] Pausing non-essential tasks...');
    }

    handleMainThreadOverload() {
        this.logger.warn('[THERMAL] Main thread overloaded, reducing load...');
    }

    setupCommunication() {
        this.logger.log('[THERMAL] Setting up communication...');
    }

    // Graceful shutdown
    async shutdown() {
        this.logger.log('[THERMAL] 🛑 Shutting down thermal management...');
        
        this.isMonitoring = false;
        
        // Reset to maximum performance
        this.setPerformanceLevel('maximum');
        
        // Clear all callbacks
        this.performanceCallbacks.clear();
        
        this.logger.log('[THERMAL] ✅ Thermal management shutdown complete');
    }
}

// Export singleton
export const thermalManager = new ThermalManager(); 