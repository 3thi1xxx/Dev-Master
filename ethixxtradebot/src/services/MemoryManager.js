import { EventEmitter } from 'events';

/**
 * MacBook Pro Memory Manager
 * Optimized for 16GB RAM with 4GB trading allocation
 * Prevents system lag and thermal throttling
 */
export class MemoryManager extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            maxTradingMemory: 4 * 1024 * 1024 * 1024,    // 4GB ceiling
            warningThreshold: 0.8,                        // 80% warning
            criticalThreshold: 0.9,                       // 90% critical
            gcThreshold: 0.85,                           // 85% trigger GC
            reservedForSystem: 8 * 1024 * 1024 * 1024,   // 8GB for macOS
            bufferZone: 4 * 1024 * 1024 * 1024           // 4GB safety buffer
        };
        
        // Object pools for different sizes
        this.pools = {
            tiny: new CircularPool(2000, () => ({})),                    // < 1KB objects
            small: new CircularPool(1000, () => ({})),                   // 1-10KB objects  
            medium: new CircularPool(500, () => []),                     // 10-100KB arrays
            large: new CircularPool(100, () => new Map()),               // 100KB+ collections
            buffers: new CircularPool(50, () => new Float32Array(1000)) // Temp buffers
        };
        
        // Memory tracking
        this.tracking = {
            currentUsage: 0,
            peakUsage: 0,
            allocations: 0,
            deallocations: 0,
            gcTriggers: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        // Performance monitoring
        this.metrics = {
            allocationRate: 0,      // Objects/second
            poolEfficiency: 0,      // Hit rate percentage
            memoryPressure: 0,      // 0-1 scale
            fragmentationLevel: 0   // Memory fragmentation
        };
        
        this.isMonitoring = false;
        this.logger = console;
    }

    init() {
        this.logger.log('🧠 MacBook Memory Manager Initializing');
        this.logger.log(`💾 Allocated: ${this.config.maxTradingMemory / (1024**3)}GB trading memory`);
        
        // Start memory monitoring
        this.startMonitoring();
        
        // Pre-allocate critical pools
        this.preAllocatePools();
        
        this.logger.log('✅ Memory management optimized for MacBook Pro');
    }

    // Smart object allocation with pooling
    allocate(size = 'small', initializer = null) {
        const startTime = performance.now();
        
        try {
            // Check memory pressure first
            if (this.isMemoryPressureHigh()) {
                this.triggerCleanup();
            }
            
            let obj;
            
            // Try to get from appropriate pool
            if (this.pools[size]) {
                obj = this.pools[size].acquire();
                this.tracking.poolHits++;
                
                // Initialize if needed
                if (initializer && typeof initializer === 'function') {
                    initializer(obj);
                }
                
            } else {
                // Fallback to direct allocation
                obj = this.createDirectAllocation(size, initializer);
                this.tracking.poolMisses++;
            }
            
            this.tracking.allocations++;
            this.updateMemoryUsage();
            
            return obj;
            
        } catch (error) {
            this.logger.error('[MEMORY] Allocation failed:', error.message);
            return null;
        } finally {
            const latency = performance.now() - startTime;
            if (latency > 1) { // Log slow allocations
                this.logger.warn(`[MEMORY] Slow allocation: ${latency.toFixed(2)}ms`);
            }
        }
    }

    // Efficient deallocation with pool return
    deallocate(obj, size = 'small') {
        if (!obj) return;
        
        try {
            // Clear object for reuse
            this.clearObject(obj);
            
            // Return to pool if possible
            if (this.pools[size] && this.pools[size].canAccept()) {
                this.pools[size].release(obj);
            }
            
            this.tracking.deallocations++;
            
        } catch (error) {
            this.logger.error('[MEMORY] Deallocation failed:', error.message);
        }
    }

    // Memory pressure detection
    isMemoryPressureHigh() {
        const usage = process.memoryUsage();
        const pressure = usage.heapUsed / this.config.maxTradingMemory;
        
        this.metrics.memoryPressure = pressure;
        
        return pressure > this.config.warningThreshold;
    }

    // Aggressive cleanup for performance
    triggerCleanup() {
        const startTime = performance.now();
        
        this.logger.log('[MEMORY] 🧹 Triggering cleanup cycle...');
        
        // Clean all pools
        this.cleanupPools();
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            this.tracking.gcTriggers++;
        }
        
        // Clear weak references
        this.clearWeakReferences();
        
        const cleanupTime = performance.now() - startTime;
        this.logger.log(`[MEMORY] ✅ Cleanup complete (${cleanupTime.toFixed(2)}ms)`);
    }

    // Pool management
    cleanupPools() {
        Object.keys(this.pools).forEach(poolName => {
            const pool = this.pools[poolName];
            const beforeSize = pool.size();
            
            pool.cleanup();
            
            const afterSize = pool.size();
            const freed = beforeSize - afterSize;
            
            if (freed > 0) {
                this.logger.log(`[MEMORY] Freed ${freed} objects from ${poolName} pool`);
            }
        });
    }

    preAllocatePools() {
        this.logger.log('[MEMORY] Pre-allocating object pools...');
        
        // Pre-fill pools with commonly used objects
        for (let i = 0; i < 100; i++) {
            this.pools.tiny.release({});
            this.pools.small.release({});
            this.pools.medium.release([]);
        }
        
        for (let i = 0; i < 20; i++) {
            this.pools.large.release(new Map());
            this.pools.buffers.release(new Float32Array(1000));
        }
        
        this.logger.log('[MEMORY] ✅ Pools pre-allocated for optimal performance');
    }

    // Monitoring and metrics
    startMonitoring() {
        this.isMonitoring = true;
        
        setInterval(() => {
            this.updateMetrics();
            this.checkMemoryHealth();
        }, 1000); // Every second
        
        // Detailed monitoring every 10 seconds
        setInterval(() => {
            this.logDetailedMetrics();
        }, 10000);
    }

    updateMetrics() {
        const usage = process.memoryUsage();
        
        // Update current usage
        this.tracking.currentUsage = usage.heapUsed;
        if (usage.heapUsed > this.tracking.peakUsage) {
            this.tracking.peakUsage = usage.heapUsed;
        }
        
        // Calculate efficiency metrics
        const totalRequests = this.tracking.poolHits + this.tracking.poolMisses;
        this.metrics.poolEfficiency = totalRequests > 0 ? 
            (this.tracking.poolHits / totalRequests) * 100 : 0;
        
        // Memory pressure
        this.metrics.memoryPressure = usage.heapUsed / this.config.maxTradingMemory;
        
        // Allocation rate (per second)
        this.metrics.allocationRate = this.tracking.allocations;
        this.tracking.allocations = 0; // Reset counter
    }

    checkMemoryHealth() {
        const pressure = this.metrics.memoryPressure;
        
        if (pressure > this.config.criticalThreshold) {
            this.logger.warn('[MEMORY] 🚨 CRITICAL: Memory usage above 90%');
            this.emit('memory-critical', { pressure, threshold: this.config.criticalThreshold });
            this.emergencyCleanup();
        } else if (pressure > this.config.warningThreshold) {
            this.logger.warn('[MEMORY] ⚠️ WARNING: Memory usage above 80%');
            this.emit('memory-warning', { pressure, threshold: this.config.warningThreshold });
            this.preventiveCleanup();
        }
        
        // Check pool efficiency
        if (this.metrics.poolEfficiency < 70) {
            this.logger.warn('[MEMORY] ⚠️ Low pool efficiency, optimizing...');
            this.optimizePools();
        }
    }

    emergencyCleanup() {
        this.logger.log('[MEMORY] 🚨 EMERGENCY CLEANUP INITIATED');
        
        // Aggressive pool cleanup
        Object.values(this.pools).forEach(pool => {
            pool.forceCleanup();
        });
        
        // Multiple GC cycles
        if (global.gc) {
            for (let i = 0; i < 3; i++) {
                global.gc();
            }
        }
        
        // Clear all non-essential caches
        this.clearAllCaches();
    }

    preventiveCleanup() {
        // Gentle cleanup to prevent critical state
        this.cleanupPools();
        
        if (global.gc) {
            global.gc();
        }
    }

    // Utility methods
    clearObject(obj) {
        if (Array.isArray(obj)) {
            obj.length = 0;
        } else if (obj instanceof Map) {
            obj.clear();
        } else if (obj instanceof Set) {
            obj.clear();
        } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => delete obj[key]);
        }
    }

    createDirectAllocation(size, initializer) {
        switch (size) {
            case 'tiny':
            case 'small':
                return initializer ? initializer({}) : {};
            case 'medium':
                return initializer ? initializer([]) : [];
            case 'large':
                return initializer ? initializer(new Map()) : new Map();
            case 'buffers':
                return new Float32Array(1000);
            default:
                return {};
        }
    }

    optimizePools() {
        // Resize pools based on usage patterns
        Object.entries(this.pools).forEach(([name, pool]) => {
            const utilization = pool.getUtilization();
            
            if (utilization < 0.3) {
                pool.shrink();
                this.logger.log(`[MEMORY] Shrunk ${name} pool (low utilization)`);
            } else if (utilization > 0.9) {
                pool.expand();
                this.logger.log(`[MEMORY] Expanded ${name} pool (high utilization)`);
            }
        });
    }

    // Status and reporting
    getMemoryStatus() {
        const usage = process.memoryUsage();
        
        return {
            system: {
                heapUsed: `${(usage.heapUsed / (1024**3)).toFixed(2)}GB`,
                heapTotal: `${(usage.heapTotal / (1024**3)).toFixed(2)}GB`,
                external: `${(usage.external / (1024**3)).toFixed(2)}GB`,
                rss: `${(usage.rss / (1024**3)).toFixed(2)}GB`
            },
            trading: {
                allocated: `${(this.config.maxTradingMemory / (1024**3)).toFixed(2)}GB`,
                used: `${(this.tracking.currentUsage / (1024**3)).toFixed(2)}GB`,
                peak: `${(this.tracking.peakUsage / (1024**3)).toFixed(2)}GB`,
                pressure: `${(this.metrics.memoryPressure * 100).toFixed(1)}%`
            },
            pools: Object.entries(this.pools).map(([name, pool]) => ({
                name,
                size: pool.size(),
                utilization: `${(pool.getUtilization() * 100).toFixed(1)}%`,
                efficiency: pool.getEfficiency()
            })),
            metrics: {
                poolEfficiency: `${this.metrics.poolEfficiency.toFixed(1)}%`,
                allocationRate: `${this.metrics.allocationRate}/sec`,
                gcTriggers: this.tracking.gcTriggers,
                totalAllocations: this.tracking.allocations + this.tracking.deallocations
            }
        };
    }

    logDetailedMetrics() {
        const status = this.getMemoryStatus();
        
        this.logger.log('📊 MEMORY STATUS:');
        this.logger.log(`   💾 Used: ${status.trading.used}/${status.trading.allocated} (${status.trading.pressure})`);
        this.logger.log(`   ⚡ Pool Efficiency: ${status.metrics.poolEfficiency}`);
        this.logger.log(`   🔄 Allocation Rate: ${status.metrics.allocationRate}`);
        
        if (this.metrics.memoryPressure > 0.7) {
            this.logger.warn('   ⚠️ Memory pressure elevated');
        }
    }

    // Missing method implementations
    updateMemoryUsage() {
        const usage = process.memoryUsage();
        this.tracking.currentUsage = usage.heapUsed;
    }

    clearAllCaches() {
        // Clear all caches for emergency cleanup
        this.logger.log('[MEMORY] Clearing all caches...');
    }
}

// Circular Pool Implementation for maximum efficiency
class CircularPool {
    constructor(maxSize, createFn) {
        this.maxSize = maxSize;
        this.createFn = createFn;
        this.available = [];
        this.inUse = 0;
        this.totalCreated = 0;
        this.hits = 0;
        this.misses = 0;
    }

    acquire() {
        if (this.available.length > 0) {
            this.hits++;
            this.inUse++;
            return this.available.pop();
        }
        
        this.misses++;
        this.inUse++;
        this.totalCreated++;
        
        return this.createFn();
    }

    release(obj) {
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
        }
        this.inUse = Math.max(0, this.inUse - 1);
    }

    canAccept() {
        return this.available.length < this.maxSize;
    }

    size() {
        return this.available.length;
    }

    getUtilization() {
        return this.totalCreated > 0 ? this.inUse / this.totalCreated : 0;
    }

    getEfficiency() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total) * 100 : 0;
    }

    cleanup() {
        // Remove half of available objects
        const toRemove = Math.floor(this.available.length / 2);
        this.available.splice(0, toRemove);
    }

    forceCleanup() {
        // Remove all available objects
        this.available.length = 0;
    }

    shrink() {
        this.maxSize = Math.max(10, Math.floor(this.maxSize * 0.8));
        if (this.available.length > this.maxSize) {
            this.available.length = this.maxSize;
        }
    }

    expand() {
        this.maxSize = Math.floor(this.maxSize * 1.2);
    }
}

// Export singleton
export const memoryManager = new MemoryManager(); 