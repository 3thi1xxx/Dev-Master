#!/usr/bin/env node
/**
 * 📊 UNIFIED SYSTEM MONITOR
 * Comprehensive monitoring, learning, and optimization:
 * - Real-time performance metrics and KPI tracking
 * - Machine learning system for strategy optimization
 * - Automated alerting and notification system
 * - System health monitoring and diagnostics
 * - Historical analysis and reporting
 */

import { EventEmitter } from 'node:events';
import { dataManager } from './DataManager.js';
import { intelligenceEngine } from './IntelligenceEngine.js';
import { strategyEngine } from './StrategyEngine.js';
import { riskManager } from './RiskManager.js';
import { executionManager } from './ExecutionManager.js';

export class SystemMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Performance tracking
      performance: {
        kpiUpdateInterval: 60000,      // 1 minute KPI updates
        metricsRetentionDays: 30,      // 30 days metrics retention
        detailedLoggingEnabled: true,   // Enable detailed logging
        performanceAlerts: true,        // Enable performance alerts
        benchmarkingEnabled: true       // Enable benchmarking
      },
      
      // Learning system
      learning: {
        enabled: true,
        learningInterval: 3600000,     // 1 hour learning cycles
        minDataPoints: 50,             // Min data points for learning
        confidenceThreshold: 0.8,      // 80% confidence for deployment
        backtestPeriod: 604800000,     // 7 days backtest
        modelRetentionCount: 5         // Keep 5 model versions
      },
      
      // Alerting system
      alerting: {
        enabled: true,
        channels: ['console', 'discord', 'email'], // Alert channels
        thresholds: {
          criticalLoss: 0.05,          // 5% loss = critical alert
          warningLoss: 0.02,           // 2% loss = warning alert  
          lowPerformance: 0.4,         // 40% win rate = low performance
          systemError: true,           // Any system error = alert
          highLatency: 5000,           // 5s latency = alert
          lowMemory: 0.9               // 90% memory = alert
        }
      },
      
      // Health monitoring
      health: {
        checkInterval: 30000,          // 30 second health checks
        componentTimeout: 10000,       // 10 second component timeout
        memoryThreshold: 0.85,         // 85% memory threshold
        cpuThreshold: 0.80,            // 80% CPU threshold
        diskThreshold: 0.90,           // 90% disk threshold
        networkTimeout: 5000           // 5 second network timeout
      },
      
      // Reporting
      reporting: {
        dailyReportEnabled: true,      // Daily performance reports
        weeklyReportEnabled: true,     // Weekly summary reports
        monthlyReportEnabled: true,    // Monthly analysis reports
        exportFormat: 'json',          // Export format: json, csv, pdf
        reportRetentionDays: 90        // 90 days report retention
      },
      
      ...options
    };
    
    // Performance metrics
    this.metrics = {
      // Trading performance
      trading: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnL: 0,
        dailyPnL: 0,
        weeklyPnL: 0,
        monthlyPnL: 0,
        maxDrawdown: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        averageHoldTime: 0
      },
      
      // Strategy performance
      strategies: new Map(),
      
      // System performance
      system: {
        uptime: Date.now(),
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        errorsPerHour: 0,
        averageResponseTime: 0,
        dataProcessingRate: 0,
        cacheHitRate: 0
      },
      
      // Component health
      components: new Map(),
      
      // Real-time KPIs
      kpis: {
        currentDrawdown: 0,
        recentWinRate: 0,
        hourlyPnL: 0,
        signalsPerHour: 0,
        executionSuccessRate: 0,
        averageSlippage: 0,
        riskScore: 5.0,
        systemHealth: 100,
        // Auckland Advantage Metrics
        averageReactionTime: 0,
        surgeToAnalysisTime: 0,
        analysisToOrderTime: 0,
        competitiveAdvantage: 0
      }
    };
    
    // Learning system
    this.learningSystem = {
      models: new Map(),
      trainingData: [],
      predictions: new Map(),
      backtestResults: new Map(),
      modelPerformance: new Map(),
      optimizationHistory: []
    };
    
    // Alert system
    this.alertSystem = {
      activeAlerts: new Map(),
      alertHistory: [],
      rateLimits: new Map(),
      lastAlerts: new Map()
    };
    
    // Historical data
    this.historicalData = {
      trades: [],
      performance: [],
      systemMetrics: [],
      alerts: []
    };
    
    console.log('📊 UNIFIED SYSTEM MONITOR INITIALIZED');
    console.log('🧠 Learning + 📈 Metrics + 🚨 Alerts + ❤️ Health');
  }
  
  /**
   * Initialize monitoring systems
   */
  async initialize() {
    console.log('[MONITOR] 🚀 Initializing monitoring systems...');
    
    // Connect to all core components
    this.connectToComponents();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start health monitoring  
    this.startHealthMonitoring();
    
    // Initialize learning system
    if (this.config.learning.enabled) {
      await this.initializeLearningSystem();
    }
    
    // Start alerting system
    if (this.config.alerting.enabled) {
      this.initializeAlertingSystem();
    }
    
    // Start reporting system
    this.initializeReportingSystem();
    
    console.log('[MONITOR] ✅ All monitoring systems ready');
    this.emit('initialized');
  }
  
  /**
   * Connect to all system components for monitoring
   */
  connectToComponents() {
    // Data Manager events
    dataManager.on('performance_update', (perf) => {
      this.updateComponentMetrics('dataManager', perf);
    });
    
    // Intelligence Engine events
    intelligenceEngine.on('trading_signal', (signal) => {
      this.recordTradingSignal(signal);
    });
    
    intelligenceEngine.on('performance_update', (perf) => {
      this.updateComponentMetrics('intelligenceEngine', perf);
    });
    
    // Strategy Engine events
    strategyEngine.on('execution_success', (execution) => {
      this.recordTradeExecution(execution, 'success');
    });
    
    strategyEngine.on('execution_failed', (execution) => {
      this.recordTradeExecution(execution, 'failed');
    });
    
    strategyEngine.on('performance_update', (perf) => {
      this.updateComponentMetrics('strategyEngine', perf);
    });
    
    // Risk Manager events
    riskManager.on('risk_assessment', (assessment) => {
      this.recordRiskAssessment(assessment);
    });
    
    // Execution Manager events
    executionManager.on('execution_success', (execution) => {
      this.recordSuccessfulExecution(execution);
    });
    
    executionManager.on('execution_failed', (execution) => {
      this.recordFailedExecution(execution);
    });
    
    console.log('[MONITOR] 🔗 Connected to all system components');
  }
  
  /**
   * 📊 PERFORMANCE MONITORING
   */
  startPerformanceMonitoring() {
    // Real-time KPI updates
    setInterval(() => {
      this.updateKPIs();
      this.checkPerformanceAlerts();
    }, this.config.performance.kpiUpdateInterval);
    
    // Detailed metrics collection
    setInterval(() => {
      this.collectDetailedMetrics();
      this.analyzePerformanceTrends();
    }, this.config.performance.kpiUpdateInterval * 5); // Every 5 minutes
    
    console.log('[MONITOR] 📊 Performance monitoring started');
  }
  
  updateKPIs() {
    const trading = this.metrics.trading;
    
    // Calculate current KPIs
    this.metrics.kpis = {
      currentDrawdown: this.calculateCurrentDrawdown(),
      recentWinRate: this.calculateRecentWinRate(),
      hourlyPnL: this.calculateHourlyPnL(),
      signalsPerHour: this.calculateSignalsPerHour(),
      executionSuccessRate: this.calculateExecutionSuccessRate(),
      averageSlippage: this.calculateAverageSlippage(),
      riskScore: this.calculateSystemRiskScore(),
      systemHealth: this.calculateSystemHealth(),
      
      // Trading metrics
      totalTrades: trading.totalTrades,
      winRate: trading.winRate,
      totalPnL: trading.totalPnL,
      dailyPnL: trading.dailyPnL,
      profitFactor: trading.profitFactor,
      sharpeRatio: trading.sharpeRatio,
      
      timestamp: Date.now()
    };
    
    // Emit KPI update
    this.emit('kpi_update', this.metrics.kpis);
  }
  
  /**
   * 🏥 HEALTH MONITORING
   */
  startHealthMonitoring() {
    // System health checks
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.health.checkInterval);
    
    // Component availability checks
    setInterval(() => {
      this.checkComponentHealth();
    }, this.config.health.checkInterval * 2); // Every minute
    
    console.log('[MONITOR] 🏥 Health monitoring started');
  }
  
  async performHealthChecks() {
    const health = {
      timestamp: Date.now(),
      overall: 'healthy',
      score: 100,
      issues: []
    };
    
    try {
      // Memory check
      const memoryUsage = process.memoryUsage();
      const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (memoryPercent > this.config.health.memoryThreshold) {
        health.issues.push('High memory usage');
        health.score -= 20;
      }
      
      this.metrics.system.memoryUsage = memoryPercent;
      
      // CPU check (simplified)
      const cpuUsage = process.cpuUsage();
      // TODO: Implement proper CPU monitoring
      
      // Component health
      let componentIssues = 0;
      this.metrics.components.forEach((component, name) => {
        if (component.status !== 'healthy') {
          health.issues.push(`${name} component unhealthy`);
          componentIssues++;
        }
      });
      
      health.score -= componentIssues * 10;
      
      // Overall health determination
      if (health.score < 60) {
        health.overall = 'critical';
        await this.sendAlert('system', 'critical', `System health critical: ${health.score}%`);
      } else if (health.score < 80) {
        health.overall = 'warning';
        await this.sendAlert('system', 'warning', `System health degraded: ${health.score}%`);
      }
      
      this.metrics.system.systemHealth = health.score;
      this.emit('health_update', health);
      
    } catch (error) {
      console.error('[MONITOR] ❌ Health check failed:', error.message);
      await this.sendAlert('system', 'error', `Health check failed: ${error.message}`);
    }
  }
  
  /**
   * 🧠 LEARNING SYSTEM
   */
  async initializeLearningSystem() {
    console.log('[MONITOR] 🧠 Initializing learning system...');
    
    // Start learning cycles
    setInterval(() => {
      this.runLearningCycle();
    }, this.config.learning.learningInterval);
    
    // Load existing models
    await this.loadLearningModels();
    
    console.log('[MONITOR] 🧠 Learning system ready');
  }
  
  async runLearningCycle() {
    try {
      console.log('[MONITOR] 🧠 Running learning cycle...');
      
      // Collect training data from recent performance
      const trainingData = this.collectTrainingData();
      
      if (trainingData.length < this.config.learning.minDataPoints) {
        console.log('[MONITOR] 📊 Insufficient data for learning, skipping cycle');
        return;
      }
      
      // Train models for strategy optimization
      const models = await this.trainOptimizationModels(trainingData);
      
      // Validate models with backtesting
      const backtestResults = await this.backtestModels(models);
      
      // Deploy best performing models
      await this.deployBestModels(backtestResults);
      
      // Record learning results
      this.learningSystem.optimizationHistory.push({
        timestamp: Date.now(),
        dataPoints: trainingData.length,
        modelsCreated: models.length,
        bestModelAccuracy: Math.max(...backtestResults.map(r => r.accuracy))
      });
      
      console.log('[MONITOR] ✅ Learning cycle completed');
      
    } catch (error) {
      console.error('[MONITOR] ❌ Learning cycle failed:', error.message);
    }
  }
  
  collectTrainingData() {
    // Collect recent trade data for model training
    const recentTrades = this.historicalData.trades
      .filter(trade => trade.timestamp > Date.now() - 86400000) // Last 24 hours
      .map(trade => ({
        // Input features
        intelligence: trade.intelligence,
        marketConditions: trade.marketConditions,
        riskScore: trade.riskScore,
        strategy: trade.strategy,
        
        // Target outcome
        outcome: trade.outcome,
        pnl: trade.pnl,
        success: trade.success
      }));
    
    return recentTrades;
  }
  
  async trainOptimizationModels(trainingData) {
    // Train ML models for strategy optimization
    // TODO: Implement actual ML model training
    console.log('[MONITOR] 🧠 Training optimization models...');
    
    // Placeholder model creation
    const models = [
      {
        name: 'strategy_selector',
        type: 'classification',
        accuracy: 0.75,
        features: ['intelligence', 'riskScore', 'marketConditions']
      },
      {
        name: 'position_sizer',
        type: 'regression', 
        accuracy: 0.68,
        features: ['intelligence', 'volatility', 'confidence']
      }
    ];
    
    return models;
  }
  
  async backtestModels(models) {
    // Backtest models against historical data
    console.log('[MONITOR] 📈 Backtesting models...');
    
    // TODO: Implement actual backtesting
    const results = models.map(model => ({
      model: model.name,
      accuracy: model.accuracy,
      profitFactor: 1.2,
      maxDrawdown: 0.08,
      sharpeRatio: 1.5
    }));
    
    return results;
  }
  
  async deployBestModels(backtestResults) {
    // Deploy best performing models
    const bestModels = backtestResults
      .filter(result => result.accuracy > this.config.learning.confidenceThreshold)
      .sort((a, b) => b.accuracy - a.accuracy);
    
    if (bestModels.length > 0) {
      console.log('[MONITOR] 🚀 Deploying best models:', bestModels.map(m => m.model));
      // TODO: Actually deploy models to strategy engine
    }
  }
  
  /**
   * 🚨 ALERTING SYSTEM
   */
  initializeAlertingSystem() {
    console.log('[MONITOR] 🚨 Initializing alerting system...');
    
    // Performance alerts
    this.on('kpi_update', (kpis) => {
      this.checkPerformanceAlerts(kpis);
    });
    
    // Health alerts
    this.on('health_update', (health) => {
      if (health.overall !== 'healthy') {
        this.sendAlert('health', health.overall, `System health: ${health.overall}`);
      }
    });
    
    console.log('[MONITOR] 🚨 Alerting system ready');
  }
  
  async checkPerformanceAlerts(kpis = this.metrics.kpis) {
    const thresholds = this.config.alerting.thresholds;
    
    // Critical loss alert
    if (kpis.dailyPnL <= -thresholds.criticalLoss) {
      await this.sendAlert('performance', 'critical', 
        `Critical daily loss: ${(kpis.dailyPnL * 100).toFixed(2)}%`);
    }
    
    // Warning loss alert
    else if (kpis.dailyPnL <= -thresholds.warningLoss) {
      await this.sendAlert('performance', 'warning',
        `Daily loss warning: ${(kpis.dailyPnL * 100).toFixed(2)}%`);
    }
    
    // Low performance alert
    if (kpis.recentWinRate < thresholds.lowPerformance) {
      await this.sendAlert('performance', 'warning',
        `Low win rate: ${(kpis.recentWinRate * 100).toFixed(1)}%`);
    }
    
    // High risk alert
    if (kpis.riskScore > 8.0) {
      await this.sendAlert('risk', 'warning',
        `High system risk score: ${kpis.riskScore.toFixed(1)}`);
    }
  }
  
  async sendAlert(category, severity, message) {
    const alertKey = `${category}_${severity}`;
    const now = Date.now();
    
    // Rate limiting (don't spam same alert)
    const lastAlert = this.alertSystem.lastAlerts.get(alertKey);
    if (lastAlert && (now - lastAlert) < 300000) { // 5 minute cooldown
      return;
    }
    
    const alert = {
      id: `alert_${now}_${Math.random().toString(36).substr(2, 5)}`,
      category,
      severity,
      message,
      timestamp: now
    };
    
    console.log(`[MONITOR] 🚨 ${severity.toUpperCase()} ALERT: ${message}`);
    
    // Store alert
    this.alertSystem.activeAlerts.set(alert.id, alert);
    this.alertSystem.alertHistory.push(alert);
    this.alertSystem.lastAlerts.set(alertKey, now);
    
    // Send to configured channels
    for (const channel of this.config.alerting.channels) {
      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        console.error(`[MONITOR] ❌ Alert channel ${channel} failed:`, error.message);
      }
    }
    
    this.emit('alert', alert);
  }
  
  async sendToChannel(channel, alert) {
    switch (channel) {
      case 'console':
        // Already logged above
        break;
      case 'discord':
        // TODO: Implement Discord webhook
        break;
      case 'email':
        // TODO: Implement email alerts
        break;
    }
  }
  
  /**
   * 📈 REPORTING SYSTEM
   */
  initializeReportingSystem() {
    console.log('[MONITOR] 📈 Initializing reporting system...');
    
    // Daily reports
    if (this.config.reporting.dailyReportEnabled) {
      // Schedule daily report at midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      setTimeout(() => {
        this.generateDailyReport();
        setInterval(() => this.generateDailyReport(), 86400000); // 24 hours
      }, tomorrow.getTime() - now.getTime());
    }
    
    console.log('[MONITOR] 📈 Reporting system ready');
  }
  
  generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      trading: {
        totalTrades: this.metrics.trading.totalTrades,
        winRate: this.metrics.trading.winRate,
        dailyPnL: this.metrics.trading.dailyPnL,
        profitFactor: this.metrics.trading.profitFactor
      },
      system: {
        uptime: Date.now() - this.metrics.system.uptime,
        health: this.metrics.system.systemHealth,
        alerts: this.alertSystem.alertHistory.filter(
          alert => alert.timestamp > Date.now() - 86400000
        ).length
      },
      strategies: Array.from(this.metrics.strategies.entries()).map(([name, metrics]) => ({
        name,
        trades: metrics.trades,
        winRate: metrics.winRate,
        pnl: metrics.pnl
      }))
    };
    
    console.log('[MONITOR] 📊 Daily Report Generated:', report);
    this.emit('daily_report', report);
    
    return report;
  }
  
  /**
   * 📊 METRICS CALCULATION HELPERS
   */
  calculateCurrentDrawdown() {
    // Calculate current drawdown from peak
    // TODO: Implement actual drawdown calculation
    return Math.abs(this.metrics.trading.dailyPnL);
  }
  
  calculateRecentWinRate() {
    const recentTrades = this.historicalData.trades
      .filter(trade => trade.timestamp > Date.now() - 3600000); // Last hour
    
    if (recentTrades.length === 0) return 0;
    
    const wins = recentTrades.filter(trade => trade.success).length;
    return wins / recentTrades.length;
  }
  
  calculateHourlyPnL() {
    const hourAgo = Date.now() - 3600000;
    const recentTrades = this.historicalData.trades
      .filter(trade => trade.timestamp > hourAgo);
    
    return recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }
  
  calculateSignalsPerHour() {
    const hourAgo = Date.now() - 3600000;
    const recentSignals = this.historicalData.trades
      .filter(trade => trade.timestamp > hourAgo);
    
    return recentSignals.length;
  }
  
  calculateExecutionSuccessRate() {
    const execStats = executionManager.getExecutionStats();
    return execStats.successRate || 0;
  }
  
  calculateAverageSlippage() {
    const execStats = executionManager.getExecutionStats();
    return execStats.averageSlippage || 0;
  }
  
  calculateSystemRiskScore() {
    // Get risk score from risk manager
    // TODO: Implement risk score aggregation
    return 5.0;
  }
  
  calculateSystemHealth() {
    return this.metrics.system.systemHealth;
  }
  
  /**
   * 📝 DATA RECORDING METHODS
   */
  recordTradingSignal(signal) {
    // Record trading signals for analysis with Auckland advantage tracking
    const tradeRecord = {
      timestamp: Date.now(),
      type: 'signal',
      signal: signal.signal,
      intelligence: signal.intelligence,
      tokenAddress: signal.tokenData?.address,
      // Auckland Advantage Metrics
      surgeDetectedAt: signal.tokenData?.timestamp,
      analysisCompletedAt: Date.now(),
      surgeToAnalysisTime: Date.now() - (signal.tokenData?.timestamp || Date.now())
    };
    
    this.historicalData.trades.push(tradeRecord);
    
    // Update Auckland advantage metrics
    if (tradeRecord.surgeToAnalysisTime < 2000) {
      console.log(`[MONITOR] ⚡ Auckland Advantage: ${tradeRecord.surgeToAnalysisTime}ms surge→analysis`);
    }
  }
  
  recordTradeExecution(execution, result) {
    // Record trade execution results
    this.metrics.trading.totalTrades++;
    
    if (result === 'success') {
      this.metrics.trading.winningTrades++;
      // TODO: Calculate actual PnL when we have position tracking
    } else {
      this.metrics.trading.losingTrades++;
    }
    
    // Update win rate
    this.metrics.trading.winRate = this.metrics.trading.winningTrades / this.metrics.trading.totalTrades;
    
    // Store detailed execution data
    this.historicalData.trades.push({
      timestamp: Date.now(),
      type: 'execution',
      result,
      execution,
      strategy: execution.strategy
    });
  }
  
  recordRiskAssessment(assessment) {
    // Record risk assessments for learning
    // TODO: Store risk assessment data
  }
  
  recordSuccessfulExecution(execution) {
    this.recordTradeExecution(execution, 'success');
  }
  
  recordFailedExecution(execution) {
    this.recordTradeExecution(execution, 'failed');
  }
  
  updateComponentMetrics(componentName, metrics) {
    this.metrics.components.set(componentName, {
      ...metrics,
      lastUpdate: Date.now(),
      status: 'healthy'
    });
  }
  
  checkComponentHealth() {
    const timeout = this.config.health.componentTimeout;
    const now = Date.now();
    
    this.metrics.components.forEach((component, name) => {
      if (now - component.lastUpdate > timeout) {
        component.status = 'unhealthy';
        console.warn(`[MONITOR] ⚠️ Component ${name} appears unhealthy`);
      }
    });
  }
  
  collectDetailedMetrics() {
    // Collect detailed system metrics
    const memoryUsage = process.memoryUsage();
    
    this.metrics.system = {
      ...this.metrics.system,
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      timestamp: Date.now()
    };
    
    this.historicalData.systemMetrics.push({
      timestamp: Date.now(),
      ...this.metrics.system
    });
  }
  
  analyzePerformanceTrends() {
    // Analyze performance trends for optimization
    // TODO: Implement trend analysis
  }
  
  async loadLearningModels() {
    // Load existing ML models from storage
    console.log('[MONITOR] 🧠 Loading learning models...');
    // TODO: Implement model loading
  }
  
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      metrics: this.metrics,
      health: this.calculateSystemHealth(),
      activeAlerts: this.alertSystem.activeAlerts.size,
      uptime: Date.now() - this.metrics.system.uptime,
      learning: {
        modelsActive: this.learningSystem.models.size,
        lastTrainingCycle: this.learningSystem.optimizationHistory.slice(-1)[0]
      }
    };
  }
}

// Export singleton instance
export const systemMonitor = new SystemMonitor(); 