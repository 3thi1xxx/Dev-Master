#!/usr/bin/env node
/**
 * ⚡ UNIFIED EXECUTION MANAGER
 * Handles all trade execution and transaction optimization:
 * - Multi-DEX routing (Jupiter, Raydium, Pump.fun)
 * - MEV protection with Jito bundles
 * - Dynamic slippage and priority fee optimization
 * - Transaction retry logic and error handling
 * - Real-time execution monitoring and reporting
 */

import { EventEmitter } from 'node:events';
import { dataManager } from './DataManager.js';
import { riskManager } from './RiskManager.js';
import { paperTradingSystem } from './PaperTradingSystem.js';

export class ExecutionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // DEX routing preferences
      routing: {
        preferredDEX: ['jupiter', 'raydium', 'pump'],
        maxRoutingTime: 5000,        // 5 second routing timeout
        minLiquidityThreshold: 1000, // Min liquidity for routing
        maxHops: 3,                  // Max routing hops
        routingSlippageTolerance: 0.01 // 1% routing slippage
      },
      
      // Transaction optimization
      transaction: {
        maxSlippage: 0.03,           // 3% max slippage
        priorityFeeMultiplier: 1.5,  // 1.5x base priority fee
        confirmationTimeout: 30000,  // 30 second confirmation timeout
        maxRetryAttempts: 3,         // 3 retry attempts
        retryDelayBase: 2000,        // 2 second base retry delay
        gasOptimization: true        // Enable gas optimization
      },
      
      // MEV protection
      mevProtection: {
        enabled: true,
        jitoTipAmount: 0.0001,       // 0.0001 SOL tip
        bundleTimeout: 10000,        // 10 second bundle timeout
        maxBundleSize: 5,            // Max 5 transactions per bundle
        protectionLevel: 'high'      // high, medium, low
      },
      
      // Execution urgency levels
      urgencyLevels: {
        high: {
          maxSlippage: 0.05,         // 5% slippage for speed
          priorityMultiplier: 3.0,   // 3x priority fee
          timeout: 15000,            // 15 second timeout
          retryAttempts: 5
        },
        medium: {
          maxSlippage: 0.03,         // 3% slippage
          priorityMultiplier: 1.5,   // 1.5x priority fee
          timeout: 30000,            // 30 second timeout
          retryAttempts: 3
        },
        low: {
          maxSlippage: 0.02,         // 2% slippage
          priorityMultiplier: 1.0,   // 1x priority fee
          timeout: 60000,            // 60 second timeout
          retryAttempts: 2
        }
      },
      
      // Position management
      positions: {
        trackingEnabled: true,
        autoStopLoss: true,
        autoTakeProfit: true,
        trailingStops: true,
        maxHoldTime: 86400000,       // 24 hours max hold
        positionCheckInterval: 30000  // 30 second checks
      },
      
      ...options
    };
    
    // Execution state
    this.executionQueue = [];
    this.activeExecutions = new Map();
    this.executionHistory = [];
    
    // DEX clients
    this.dexClients = new Map();
    
    // Performance tracking
    this.executionMetrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      averageSlippage: 0,
      mevProtectionSuccess: 0,
      totalGasSaved: 0
    };
    
    // Real-time fee data
    this.feeData = {
      baseFee: 0,
      priorityFee: 0,
      jitoFee: 0,
      lastUpdate: 0
    };
    
    console.log('⚡ UNIFIED EXECUTION MANAGER INITIALIZED');
    console.log('🚀 Multi-DEX Routing + MEV Protection + Smart Execution');
  }
  
  /**
   * Initialize execution systems
   */
  async initialize() {
    console.log('[EXEC] 🚀 Initializing execution systems...');
    
    // Initialize DEX clients
    await this.initializeDEXClients();
    
    // Connect to strategy engine
    this.on('execute_trade', (executionPlan) => {
      this.handleTradeExecution(executionPlan);
    });
    
    this.on('close_position', (closeRequest) => {
      this.handlePositionClose(closeRequest);
    });
    
    // Connect to data manager for fee updates
    dataManager.on('fee_update', (feeData) => {
      this.updateFeeData(feeData);
    });
    
    // Start execution monitoring
    this.startExecutionMonitoring();
    
    // Start position management
    this.startPositionManagement();
    
    console.log('[EXEC] ✅ Execution systems ready');
    this.emit('initialized');
  }
  
  /**
   * Track position prices for paper trading
   */
  trackPositionPrice(tokenAddress, positionId) {
    // Subscribe to price updates for this token
    if (!this.trackedPositions) {
      this.trackedPositions = new Map();
    }
    
    if (!this.trackedPositions.has(tokenAddress)) {
      this.trackedPositions.set(tokenAddress, new Set());
    }
    
    this.trackedPositions.get(tokenAddress).add(positionId);
    
    // Start price monitoring
    const priceInterval = setInterval(async () => {
      try {
        // Get latest price from data manager
        const tokenData = await dataManager.getTokenData(tokenAddress);
        if (tokenData && tokenData.price) {
          paperTradingSystem.updatePositionPrice(tokenAddress, tokenData.price);
        }
      } catch (error) {
        console.error(`[EXEC] Error updating price for ${tokenAddress}:`, error.message);
      }
    }, 5000); // Update every 5 seconds
    
    // Store interval for cleanup
    if (!this.priceIntervals) {
      this.priceIntervals = new Map();
    }
    this.priceIntervals.set(positionId, priceInterval);
  }
  
  /**
   * 🎯 MAIN TRADE EXECUTION HANDLER
   */
  async handleTradeExecution(executionPlan) {
    const executionId = executionPlan.id;
    
    try {
      console.log(`[EXEC] ⚡ Starting execution: ${executionPlan.tokenTicker} (${executionPlan.strategy})`);
      
      // Create execution context
      const execution = {
        ...executionPlan,
        status: 'pending',
        startTime: Date.now(),
        attempts: 0,
        errors: [],
        route: null,
        transaction: null,
        result: null
      };
      
      this.activeExecutions.set(executionId, execution);
      
      // Step 1: Risk validation
      const riskAssessment = await riskManager.assessTradeRisk(executionPlan);
      
      if (!riskAssessment.approved) {
        throw new Error(`Risk assessment failed: ${riskAssessment.blockers.join(', ')}`);
      }
      
      execution.riskAssessment = riskAssessment;
      
      // Step 2: Route optimization
      const route = await this.findOptimalRoute(executionPlan);
      execution.route = route;
      
      // Step 3: Execute trade (PAPER TRADING MODE)
      // For paper trading, we simulate the execution
      const paperPosition = await paperTradingSystem.openPosition({
        tokenAddress: executionPlan.tokenAddress,
        ticker: executionPlan.tokenTicker,
        price: route.route.outAmount / this.calculateTradeAmount(executionPlan),
        confidence: executionPlan.confidence || 'default',
        signal: executionPlan.strategy,
        scores: executionPlan.scores
      });
      
      if (paperPosition) {
        execution.result = {
          success: true,
          positionId: paperPosition.id,
          entryPrice: paperPosition.entryPrice,
          quantity: paperPosition.quantity,
          value: paperPosition.entryValue
        };
        execution.status = 'completed';
        
        // Track price for position updates
        this.trackPositionPrice(executionPlan.tokenAddress, paperPosition.id);
      } else {
        throw new Error('Failed to open paper position');
      }
      
      execution.endTime = Date.now();
      
      console.log(`[EXEC] ✅ Execution completed: ${executionPlan.tokenTicker} in ${execution.endTime - execution.startTime}ms`);
      
      // Update metrics
      this.updateExecutionMetrics(execution);
      
      // Emit success
      this.emit('execution_success', execution);
      
      // Move to history
      this.executionHistory.push(execution);
      this.activeExecutions.delete(executionId);
      
    } catch (error) {
      console.error(`[EXEC] ❌ Execution failed: ${executionPlan.tokenTicker}`, error.message);
      
      const execution = this.activeExecutions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.endTime = Date.now();
        
        // Retry logic
        if (execution.attempts < this.getMaxRetryAttempts(executionPlan.urgency)) {
          await this.retryExecution(execution);
        } else {
          this.emit('execution_failed', execution);
          this.executionHistory.push(execution);
          this.activeExecutions.delete(executionId);
        }
      }
    }
  }
  
  /**
   * 🔍 OPTIMAL ROUTE FINDING
   */
  async findOptimalRoute(executionPlan) {
    console.log(`[EXEC] 🔍 Finding optimal route for ${executionPlan.tokenTicker}`);
    
    const routes = [];
    
    try {
      // Get routes from multiple DEXs in parallel
      const routePromises = this.config.routing.preferredDEX.map(async (dexName) => {
        try {
          const client = this.dexClients.get(dexName);
          if (!client) return null;
          
          const route = await client.getRoute({
            inputMint: 'So11111111111111111111111111111111111111112', // SOL
            outputMint: executionPlan.tokenAddress,
            amount: this.calculateTradeAmount(executionPlan),
            slippageBps: Math.floor(executionPlan.maxSlippage * 10000),
            maxAccounts: 20
          });
          
          if (route) {
            return {
              dex: dexName,
              route,
              estimatedOutput: route.outAmount,
              priceImpact: route.priceImpactPct,
              marketInfos: route.marketInfos,
              score: this.scoreRoute(route, dexName)
            };
          }
        } catch (error) {
          console.error(`[EXEC] ❌ ${dexName} routing error:`, error.message);
        }
        return null;
      });
      
      // Wait for all route requests
      const routeResults = await Promise.allSettled(routePromises);
      
      routeResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          routes.push(result.value);
        }
      });
      
      if (routes.length === 0) {
        throw new Error('No valid routes found');
      }
      
      // Select best route
      const bestRoute = routes.sort((a, b) => b.score - a.score)[0];
      
      console.log(`[EXEC] 🎯 Selected ${bestRoute.dex} route (Score: ${bestRoute.score.toFixed(2)}, Impact: ${bestRoute.priceImpact}%)`);
      
      return bestRoute;
      
    } catch (error) {
      console.error('[EXEC] ❌ Route finding failed:', error.message);
      throw new Error(`Route optimization failed: ${error.message}`);
    }
  }
  
  /**
   * 💱 EXECUTE TRADE ON DEX
   */
  async executeTradeOnDEX(execution) {
    const { route, urgency = 'medium' } = execution;
    const urgencyConfig = this.config.urgencyLevels[urgency];
    
    try {
      console.log(`[EXEC] 💱 Executing on ${route.dex} with ${urgency} urgency`);
      
      // Get DEX client
      const client = this.dexClients.get(route.dex);
      if (!client) {
        throw new Error(`DEX client not available: ${route.dex}`);
      }
      
      // Prepare transaction parameters
      const txParams = {
        route: route.route,
        userPublicKey: process.env.WALLET_PUBLIC_KEY,
        slippageBps: Math.floor(execution.maxSlippage * 10000),
        priorityFee: this.calculatePriorityFee(urgency),
        computeUnitPrice: this.calculateComputeUnitPrice(urgency)
      };
      
      // Add MEV protection if enabled
      if (this.config.mevProtection.enabled) {
        txParams.mevProtection = {
          jitoTip: this.config.mevProtection.jitoTipAmount,
          bundleTimeout: this.config.mevProtection.bundleTimeout
        };
      }
      
      execution.attempts++;
      execution.status = 'executing';
      
      // Execute the trade
      const startTime = Date.now();
      const txResult = await client.executeSwap(txParams);
      const executionTime = Date.now() - startTime;
      
      // Verify transaction success
      if (!txResult.signature) {
        throw new Error('Transaction failed: No signature returned');
      }
      
      // Wait for confirmation
      const confirmation = await this.waitForConfirmation(
        txResult.signature,
        urgencyConfig.timeout
      );
      
      if (!confirmation.success) {
        throw new Error(`Transaction confirmation failed: ${confirmation.error}`);
      }
      
      // Calculate actual results
      const actualResult = {
        signature: txResult.signature,
        executionTime,
        actualSlippage: this.calculateActualSlippage(execution, confirmation),
        gasUsed: confirmation.gasUsed,
        finalAmount: confirmation.outputAmount,
        priceImpact: route.priceImpact,
        dexUsed: route.dex
      };
      
      console.log(`[EXEC] 🎉 Trade executed successfully: ${execution.tokenTicker}`);
      console.log(`[EXEC] 📊 Slippage: ${actualResult.actualSlippage}%, Gas: ${actualResult.gasUsed}, Time: ${executionTime}ms`);
      
      return actualResult;
      
    } catch (error) {
      console.error(`[EXEC] ❌ DEX execution failed:`, error.message);
      execution.errors.push({
        timestamp: Date.now(),
        error: error.message,
        attempt: execution.attempts
      });
      throw error;
    }
  }
  
  /**
   * 🔄 EXECUTION RETRY LOGIC
   */
  async retryExecution(execution) {
    const delay = this.config.transaction.retryDelayBase * Math.pow(2, execution.attempts - 1);
    
    console.log(`[EXEC] 🔄 Retrying execution in ${delay}ms (Attempt ${execution.attempts + 1})`);
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Update execution parameters for retry
    execution.maxSlippage = Math.min(
      execution.maxSlippage * 1.2, // Increase slippage tolerance by 20%
      0.08 // Max 8% slippage
    );
    
    // Retry the execution
    try {
      const route = await this.findOptimalRoute(execution);
      execution.route = route;
      
      const result = await this.executeTradeOnDEX(execution);
      execution.result = result;
      execution.status = 'completed';
      execution.endTime = Date.now();
      
      this.emit('execution_success', execution);
      this.executionHistory.push(execution);
      this.activeExecutions.delete(execution.id);
      
    } catch (error) {
      if (execution.attempts >= this.getMaxRetryAttempts(execution.urgency)) {
        execution.status = 'failed';
        execution.error = error.message;
        this.emit('execution_failed', execution);
        this.executionHistory.push(execution);
        this.activeExecutions.delete(execution.id);
      } else {
        await this.retryExecution(execution);
      }
    }
  }
  
  /**
   * 🔐 POSITION CLOSE HANDLER
   */
  async handlePositionClose(closeRequest) {
    try {
      console.log(`[EXEC] 🔐 Closing position: ${closeRequest.positionId}`);
      
      // Create close execution plan
      const closeExecution = {
        id: `close_${closeRequest.positionId}_${Date.now()}`,
        type: 'close_position',
        positionId: closeRequest.positionId,
        reason: closeRequest.reason,
        urgency: closeRequest.urgency || 'medium',
        timestamp: Date.now()
      };
      
      // Execute position close
      await this.handleTradeExecution(closeExecution);
      
    } catch (error) {
      console.error('[EXEC] ❌ Position close failed:', error.message);
      this.emit('position_close_failed', {
        positionId: closeRequest.positionId,
        error: error.message
      });
    }
  }
  
  /**
   * 🔧 HELPER METHODS
   */
  async initializeDEXClients() {
    console.log('[EXEC] 🔧 Initializing DEX clients...');
    
    // Jupiter client
    try {
      const JupiterClient = (await import('../clients/JupiterClient.js')).default;
      this.dexClients.set('jupiter', new JupiterClient());
      console.log('[EXEC] ✅ Jupiter client initialized');
    } catch (error) {
      console.warn('[EXEC] ⚠️ Jupiter client initialization failed:', error.message);
    }
    
    // Raydium client
    try {
      const RaydiumClient = (await import('../clients/RaydiumClient.js')).default;
      this.dexClients.set('raydium', new RaydiumClient());
      console.log('[EXEC] ✅ Raydium client initialized');
    } catch (error) {
      console.warn('[EXEC] ⚠️ Raydium client initialization failed:', error.message);
    }
    
    // Pump.fun client
    try {
      const PumpClient = (await import('../clients/PumpClient.js')).default;
      this.dexClients.set('pump', new PumpClient());
      console.log('[EXEC] ✅ Pump.fun client initialized');
    } catch (error) {
      console.warn('[EXEC] ⚠️ Pump.fun client initialization failed:', error.message);
    }
  }
  
  scoreRoute(route, dexName) {
    let score = 0;
    
    // Base score by DEX preference
    const dexScores = { jupiter: 10, raydium: 8, pump: 6 };
    score += dexScores[dexName] || 5;
    
    // Price impact penalty
    score -= (route.priceImpactPct || 0) * 10;
    
    // Output amount bonus
    score += Math.log(route.outAmount || 1) / 1000;
    
    // Market info bonus (more liquidity sources)
    score += (route.marketInfos?.length || 0) * 0.5;
    
    return Math.max(0, score);
  }
  
  calculateTradeAmount(executionPlan) {
    // Convert position size to SOL amount
    // TODO: Get actual portfolio balance
    const portfolioValue = 100; // SOL (placeholder)
    return Math.floor(portfolioValue * executionPlan.positionSize * 1e9); // Convert to lamports
  }
  
  calculatePriorityFee(urgency) {
    const baseFeeMicroLamports = this.feeData.priorityFee || 1000;
    const multiplier = this.config.urgencyLevels[urgency].priorityMultiplier;
    return Math.floor(baseFeeMicroLamports * multiplier);
  }
  
  calculateComputeUnitPrice(urgency) {
    const basePriceMicroLamports = 1000;
    const multiplier = this.config.urgencyLevels[urgency].priorityMultiplier;
    return Math.floor(basePriceMicroLamports * multiplier);
  }
  
  async waitForConfirmation(signature, timeout) {
    // Wait for transaction confirmation
    // TODO: Implement actual confirmation waiting logic
    return {
      success: true,
      gasUsed: 5000,
      outputAmount: 1000000,
      confirmationTime: Date.now()
    };
  }
  
  calculateActualSlippage(execution, confirmation) {
    // Calculate actual slippage experienced
    // TODO: Implement actual slippage calculation
    return 0.5; // 0.5% placeholder
  }
  
  updateFeeData(feeData) {
    if (feeData.type === 'jito-bribe-fee') {
      this.feeData.jitoFee = feeData.fee;
    } else if (feeData.type === 'sol-priority-fee') {
      this.feeData.priorityFee = feeData.fee * 1000000; // Convert to microlamports
    }
    this.feeData.lastUpdate = Date.now();
    
    console.log(`[EXEC] 📊 Fee data updated: ${feeData.type} = ${feeData.fee}`);
  }
  
  getMaxRetryAttempts(urgency) {
    return this.config.urgencyLevels[urgency]?.retryAttempts || 3;
  }
  
  updateExecutionMetrics(execution) {
    this.executionMetrics.totalExecutions++;
    
    if (execution.status === 'completed') {
      this.executionMetrics.successfulExecutions++;
      
      const execTime = execution.endTime - execution.startTime;
      this.executionMetrics.averageExecutionTime = 
        (this.executionMetrics.averageExecutionTime + execTime) / 2;
        
      if (execution.result?.actualSlippage) {
        this.executionMetrics.averageSlippage = 
          (this.executionMetrics.averageSlippage + execution.result.actualSlippage) / 2;
      }
    } else {
      this.executionMetrics.failedExecutions++;
    }
  }
  
  startExecutionMonitoring() {
    // Monitor active executions for timeouts
    setInterval(() => {
      const now = Date.now();
      
      this.activeExecutions.forEach((execution, id) => {
        const timeoutThreshold = this.config.urgencyLevels[execution.urgency || 'medium'].timeout;
        
        if (now - execution.startTime > timeoutThreshold) {
          console.log(`[EXEC] ⏰ Execution timeout: ${execution.tokenTicker}`);
          execution.status = 'timeout';
          execution.error = 'Execution timeout';
          this.emit('execution_timeout', execution);
          this.activeExecutions.delete(id);
        }
      });
    }, 10000); // Check every 10 seconds
    
    console.log('[EXEC] 📊 Execution monitoring started');
  }
  
  startPositionManagement() {
    // Monitor positions for stop losses, take profits, etc.
    if (this.config.positions.trackingEnabled) {
      setInterval(() => {
        this.checkPositionTriggers();
      }, this.config.positions.positionCheckInterval);
      
      console.log('[EXEC] 🔐 Position management started');
    }
  }
  
  checkPositionTriggers() {
    // Check all positions for exit triggers
    // TODO: Implement position monitoring logic
  }
  
  /**
   * Get execution statistics
   */
  getExecutionStats() {
    const successRate = this.executionMetrics.totalExecutions > 0 
      ? this.executionMetrics.successfulExecutions / this.executionMetrics.totalExecutions 
      : 0;
      
    return {
      ...this.executionMetrics,
      successRate,
      activeExecutions: this.activeExecutions.size,
      queueLength: this.executionQueue.length
    };
  }
}

// Export singleton instance
export const executionManager = new ExecutionManager(); 