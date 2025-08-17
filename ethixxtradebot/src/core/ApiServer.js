#!/usr/bin/env node
/**
 * 🌐 UNIFIED API SERVER
 * Web dashboard and API interface:
 * - Real-time trading dashboard with live metrics
 * - REST API for external integrations and control
 * - WebSocket updates for real-time data streaming
 * - System control panel and configuration management
 * - Historical data access and reporting endpoints
 */

import { EventEmitter } from 'node:events';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataManager } from './DataManager.js';
import { intelligenceEngine } from './IntelligenceEngine.js';
import { strategyEngine } from './StrategyEngine.js';
import { riskManager } from './RiskManager.js';
import { executionManager } from './ExecutionManager.js';
import { systemMonitor } from './SystemMonitor.js';
import { paperTradingSystem } from './PaperTradingSystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ApiServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Server configuration
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        corsEnabled: true,
        rateLimitEnabled: true,
        authEnabled: false // TODO: Implement authentication
      },
      
      // Dashboard configuration
      dashboard: {
        enabled: true,
        updateInterval: 1000,        // 1 second updates
        historyLimit: 1000,          // Max data points for charts
        metricsRetention: 86400000,  // 24 hours metrics retention
        realtimeEnabled: true        // Real-time WebSocket updates
      },
      
      // API configuration
      api: {
        enabled: true,
        version: 'v1',
        maxRequestSize: '10mb',
        requestTimeout: 30000,       // 30 second timeout
        rateLimit: {
          windowMs: 60000,           // 1 minute window
          maxRequests: 100           // 100 requests per minute
        }
      },
      
      // WebSocket configuration
      websocket: {
        enabled: true,
        heartbeatInterval: 30000,    // 30 second heartbeat
        maxConnections: 100,         // Max concurrent connections
        messageRateLimit: 10         // 10 messages per second per client
      },
      
      // Security configuration
      security: {
        apiKeyRequired: false,       // TODO: Implement API key auth
        corsOrigins: ['*'],          // TODO: Restrict CORS origins
        maxRequestSize: '10mb',
        requestTimeout: 30000
      },
      
      ...options
    };
    
    // Express app and HTTP server
    this.app = express();
    this.server = createServer(this.app);
    
    // WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.server,
      maxPayload: 1024 * 1024 // 1MB max payload
    });
    
    // Connected clients
    this.wsClients = new Map();
    
    // Dashboard data cache
    this.dashboardData = {
      metrics: {},
      trades: [],
      signals: [],
      performance: [],
      alerts: []
    };
    
    // API endpoints
    this.apiEndpoints = new Map();
    
    console.log('🌐 UNIFIED API SERVER INITIALIZED');
    console.log('📊 Dashboard + 🔌 REST API + 📡 WebSocket + 🎛️ Control Panel');
  }
  
  /**
   * Initialize API server and all endpoints
   */
  async initialize() {
    console.log('[API] 🚀 Initializing API server...');
    
    try {
      // Setup Express middleware
      this.setupMiddleware();
      
      // Setup REST API routes
      this.setupRestAPI();
      
      // Setup dashboard routes
      if (this.config.dashboard.enabled) {
        this.setupDashboard();
      }
      
      // Setup WebSocket server
      if (this.config.websocket.enabled) {
        this.setupWebSocket();
      }
      
      // Connect to system components
      this.connectToComponents();
      
      // Start the server
      await this.startServer();
      
      console.log('[API] ✅ API server ready');
      this.emit('initialized');
      
    } catch (error) {
      console.error('[API] ❌ Initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS
    if (this.config.server.corsEnabled) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
        
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }
    
    // Body parsing
    this.app.use(express.json({ limit: this.config.api.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.api.maxRequestSize }));
    
    // Request timeout
    this.app.use((req, res, next) => {
      req.setTimeout(this.config.api.requestTimeout);
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });
    
    // Error handling
    this.app.use((error, req, res, next) => {
      console.error('[API] ❌ Request error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    });
  }
  
  /**
   * 🔌 SETUP REST API ENDPOINTS
   */
  setupRestAPI() {
    const apiRouter = express.Router();
    
    // System status endpoints
    apiRouter.get('/status', this.handleSystemStatus.bind(this));
    apiRouter.get('/health', this.handleHealthCheck.bind(this));
    apiRouter.get('/metrics', this.handleMetrics.bind(this));
    
    // Trading endpoints
    apiRouter.get('/trades', this.handleGetTrades.bind(this));
    apiRouter.get('/trades/:id', this.handleGetTrade.bind(this));
    apiRouter.get('/positions', this.handleGetPositions.bind(this));
    apiRouter.get('/performance', this.handleGetPerformance.bind(this));
    
    // Strategy endpoints
    apiRouter.get('/strategies', this.handleGetStrategies.bind(this));
    apiRouter.post('/strategies/:name/enable', this.handleEnableStrategy.bind(this));
    apiRouter.post('/strategies/:name/disable', this.handleDisableStrategy.bind(this));
    apiRouter.put('/strategies/:name/config', this.handleUpdateStrategyConfig.bind(this));
    
    // Risk management endpoints
    apiRouter.get('/risk/assessment', this.handleGetRiskAssessment.bind(this));
    apiRouter.put('/risk/limits', this.handleUpdateRiskLimits.bind(this));
    apiRouter.post('/risk/emergency-stop', this.handleEmergencyStop.bind(this));
    
    // Intelligence endpoints
    apiRouter.get('/intelligence/signals', this.handleGetSignals.bind(this));
    apiRouter.get('/intelligence/tokens/:address', this.handleGetTokenIntelligence.bind(this));
    apiRouter.get('/intelligence/whales', this.handleGetWhaleData.bind(this));
    
    // Execution endpoints
    apiRouter.get('/execution/stats', this.handleGetExecutionStats.bind(this));
    apiRouter.get('/execution/history', this.handleGetExecutionHistory.bind(this));
    
    // System control endpoints
    apiRouter.post('/system/restart', this.handleSystemRestart.bind(this));
    apiRouter.post('/system/shutdown', this.handleSystemShutdown.bind(this));
    apiRouter.put('/system/config', this.handleUpdateSystemConfig.bind(this));
    
    // Mount API router
    this.app.use(`/api/${this.config.api.version}`, apiRouter);
    
    console.log('[API] 🔌 REST API endpoints configured');
  }
  
  /**
   * 📊 SETUP DASHBOARD
   */
  setupDashboard() {
    // Serve static dashboard files
    const publicPath = path.join(__dirname, '../../gui');
    this.app.use('/dashboard', express.static(publicPath));
    
    // Dashboard API endpoints
    this.app.get('/dashboard/data', this.handleDashboardData.bind(this));
    this.app.get('/dashboard/config', this.handleDashboardConfig.bind(this));
    
    // Main dashboard route
    this.app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });
    
    console.log('[API] 📊 Dashboard routes configured');
  }
  
  /**
   * 📡 SETUP WEBSOCKET SERVER
   */
  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
      this.handleWebSocketConnection(ws, request);
    });
    
    // Heartbeat mechanism
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.websocket.heartbeatInterval);
    
    console.log('[API] 📡 WebSocket server configured');
  }
  
  handleWebSocketConnection(ws, request) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`[API] 📡 WebSocket client connected: ${clientId}`);
    
    // Client setup
    ws.id = clientId;
    ws.isAlive = true;
    ws.subscriptions = new Set();
    
    this.wsClients.set(clientId, ws);
    
    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('[API] ❌ WebSocket message error:', error.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log(`[API] 📡 WebSocket client disconnected: ${clientId}`);
      this.wsClients.delete(clientId);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: Date.now()
    }));
  }
  
  handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'subscribe':
        ws.subscriptions.add(message.channel);
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: message.channel
        }));
        break;
        
      case 'unsubscribe':
        ws.subscriptions.delete(message.channel);
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          channel: message.channel
        }));
        break;
        
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`
        }));
    }
  }
  
  /**
   * Connect to system components for real-time data
   */
  connectToComponents() {
    // System Monitor events
    systemMonitor.on('kpi_update', (kpis) => {
      this.updateDashboardData('metrics', kpis);
      this.broadcastToClients('metrics', kpis);
    });
    
    systemMonitor.on('alert', (alert) => {
      this.updateDashboardData('alerts', alert);
      this.broadcastToClients('alert', alert);
    });
    
    // Strategy Engine events
    strategyEngine.on('execution_success', (execution) => {
      this.updateDashboardData('trades', execution);
      this.broadcastToClients('trade', execution);
    });
    
    // Intelligence Engine events
    intelligenceEngine.on('trading_signal', (signal) => {
      this.updateDashboardData('signals', signal);
      this.broadcastToClients('signal', signal);
    });
    
    console.log('[API] 🔗 Connected to system components');
  }
  
  updateDashboardData(type, data) {
    switch (type) {
      case 'metrics':
        this.dashboardData.metrics = data;
        break;
      case 'trades':
        this.dashboardData.trades.unshift(data);
        if (this.dashboardData.trades.length > this.config.dashboard.historyLimit) {
          this.dashboardData.trades.pop();
        }
        break;
      case 'signals':
        this.dashboardData.signals.unshift(data);
        if (this.dashboardData.signals.length > this.config.dashboard.historyLimit) {
          this.dashboardData.signals.pop();
        }
        break;
      case 'alerts':
        this.dashboardData.alerts.unshift(data);
        if (this.dashboardData.alerts.length > this.config.dashboard.historyLimit) {
          this.dashboardData.alerts.pop();
        }
        break;
    }
  }
  
  broadcastToClients(channel, data) {
    const message = JSON.stringify({
      type: 'data',
      channel,
      data,
      timestamp: Date.now()
    });
    
    this.wsClients.forEach((ws) => {
      if (ws.subscriptions.has(channel) || ws.subscriptions.has('all')) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('[API] ❌ WebSocket broadcast error:', error.message);
        }
      }
    });
  }
  
  /**
   * 📊 REST API HANDLERS
   */
  async handleSystemStatus(req, res) {
    try {
      const status = systemMonitor.getSystemStatus();
      res.json({
        success: true,
        data: status,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleHealthCheck(req, res) {
    res.json({
      success: true,
      status: 'healthy',
      uptime: Date.now() - systemMonitor.metrics.system.uptime,
      timestamp: Date.now()
    });
  }
  
  async handleMetrics(req, res) {
    try {
      res.json({
        success: true,
        data: systemMonitor.metrics,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleGetTrades(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 500);
      const offset = parseInt(req.query.offset) || 0;
      
      const trades = this.dashboardData.trades.slice(offset, offset + limit);
      
      res.json({
        success: true,
        data: trades,
        total: this.dashboardData.trades.length,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleGetPositions(req, res) {
    try {
      // Get positions from strategy engine
      const positions = Array.from(strategyEngine.openPositions.values());
      
      res.json({
        success: true,
        data: positions,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleGetPerformance(req, res) {
    try {
      const performance = {
        trading: systemMonitor.metrics.trading,
        strategies: Object.fromEntries(systemMonitor.metrics.strategies),
        kpis: systemMonitor.metrics.kpis
      };
      
      res.json({
        success: true,
        data: performance,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleGetStrategies(req, res) {
    try {
      const strategies = Array.from(strategyEngine.activeStrategies.values());
      
      res.json({
        success: true,
        data: strategies,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleEmergencyStop(req, res) {
    try {
      console.log('[API] 🚨 Emergency stop triggered via API');
      
      // Trigger emergency stop
      strategyEngine.emit('emergency_stop');
      
      res.json({
        success: true,
        message: 'Emergency stop activated',
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleDashboardData(req, res) {
    try {
      // Get paper trading portfolio status
      const portfolioStatus = paperTradingSystem.getPortfolioStatus();
      const activePositions = paperTradingSystem.getActivePositions();
      const dailyPnL = paperTradingSystem.getDailyPnL();
      const tradeHistory = paperTradingSystem.getTradeHistory(20);
      
      // Combine with existing dashboard data
      const fullData = {
        ...this.dashboardData,
        portfolio: portfolioStatus,
        activePositions: activePositions,
        dailyPnL: dailyPnL,
        recentTrades: tradeHistory
      };
      
      res.json({
        success: true,
        data: fullData,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async handleDashboardConfig(req, res) {
    try {
      const config = {
        updateInterval: this.config.dashboard.updateInterval,
        realtimeEnabled: this.config.dashboard.realtimeEnabled,
        features: {
          trading: true,
          risk: true,
          intelligence: true,
          execution: true,
          monitoring: true
        }
      };
      
      res.json({
        success: true,
        data: config,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Placeholder handlers for other endpoints
  async handleGetTrade(req, res) { this.handleNotImplemented(req, res, 'Get single trade'); }
  async handleEnableStrategy(req, res) { this.handleNotImplemented(req, res, 'Enable strategy'); }
  async handleDisableStrategy(req, res) { this.handleNotImplemented(req, res, 'Disable strategy'); }
  async handleUpdateStrategyConfig(req, res) { this.handleNotImplemented(req, res, 'Update strategy config'); }
  async handleGetRiskAssessment(req, res) { this.handleNotImplemented(req, res, 'Get risk assessment'); }
  async handleUpdateRiskLimits(req, res) { this.handleNotImplemented(req, res, 'Update risk limits'); }
  async handleGetSignals(req, res) { this.handleNotImplemented(req, res, 'Get intelligence signals'); }
  async handleGetTokenIntelligence(req, res) { this.handleNotImplemented(req, res, 'Get token intelligence'); }
  async handleGetWhaleData(req, res) { this.handleNotImplemented(req, res, 'Get whale data'); }
  async handleGetExecutionStats(req, res) { this.handleNotImplemented(req, res, 'Get execution stats'); }
  async handleGetExecutionHistory(req, res) { this.handleNotImplemented(req, res, 'Get execution history'); }
  async handleSystemRestart(req, res) { this.handleNotImplemented(req, res, 'System restart'); }
  async handleSystemShutdown(req, res) { this.handleNotImplemented(req, res, 'System shutdown'); }
  async handleUpdateSystemConfig(req, res) { this.handleNotImplemented(req, res, 'Update system config'); }
  
  async handleNotImplemented(req, res, feature) {
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: `${feature} endpoint not yet implemented`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start the HTTP server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.server.port, this.config.server.host, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`[API] 🌐 Server listening on http://${this.config.server.host}:${this.config.server.port}`);
          console.log(`[API] 📊 Dashboard: http://${this.config.server.host}:${this.config.server.port}/dashboard`);
          console.log(`[API] 🔌 API Base: http://${this.config.server.host}:${this.config.server.port}/api/${this.config.api.version}`);
          resolve();
        }
      });
    });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[API] 🛑 Shutting down API server...');
    
    // Close WebSocket connections
    this.wss.clients.forEach((ws) => {
      ws.terminate();
    });
    
    // Close HTTP server
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[API] ✅ Server shutdown complete');
        resolve();
      });
    });
  }
  
  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      httpConnections: this.server.connections || 0,
      wsConnections: this.wsClients.size,
      uptime: Date.now() - (this.startTime || Date.now()),
      totalRequests: this.totalRequests || 0,
      totalErrors: this.totalErrors || 0
    };
  }
}

// Export singleton instance
export const apiServer = new ApiServer(); 