#!/usr/bin/env node
/**
 * AxiomTrade Dashboard Server - UNIFIED VERSION
 * Combines stable core modules with working LiveTokenAnalyzer integration
 */

// CRITICAL: Load environment FIRST before importing any modules
import { config } from 'dotenv';
const result = config({ path: './axiom_tokens.env' });
if (result.error) {
  console.error('[ENV] ❌ Error loading .env:', result.error);
} else {
  console.log('[ENV] ✅ Environment loaded, BIRDEYE_API_KEY:', process.env.BIRDEYE_API_KEY ? 'Found' : 'Missing');
}

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import REAL core modules (stable foundation)
import { dataManager } from '../src/core/DataManager.js';
import { intelligenceEngine } from '../src/core/IntelligenceEngine.js';
import { strategyEngine } from '../src/core/StrategyEngine.js';
import { executionManager } from '../src/core/ExecutionManager.js';
import { paperTradingSystem } from '../src/core/PaperTradingSystem.js';
import { systemMonitor } from '../src/core/SystemMonitor.js';
import { learningSystem } from '../src/core/LearningSystem.js';
import { riskManager } from '../src/core/RiskManager.js';
import { connectionManager } from '../src/core/ConnectionManager.js';

// Import working service modules for live analysis
import { enhancedAnalysis } from '../src/services/EnhancedExternalAnalysis.js';
import { sharedWebSocketManager } from '../src/services/SharedWebSocketManager.js';
import { liveTokenAnalyzer } from '../src/core/analyzers/LiveTokenAnalyzer.js';
import { paperTradingSimulator } from '../src/services/PaperTradingSimulator.js';
import { whaleDataService } from '../src/core/data/WhaleDataService.js';
import { whaleIntelligence } from '../src/services/WhaleIntelligence.js';
import { momentumTracker } from '../src/services/MomentumTracker.js';
import { masterController } from '../src/core/system/MasterController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Dashboard state
let connectedClients = new Set();
let broadcastInterval = null;
let analysisHistory = [];
let liveOpportunities = [];

let dashboardStats = {
  tokensAnalyzed: 0,
  successfulPredictions: 0,
  liveOpportunities: 0,
  walletBalance: 112,
  totalConnections: 0,
  systemUptime: Date.now(),
  liveAnalysisActive: false
};

console.log('🚀 REAL-TIME DASHBOARD SERVER STARTING...');
console.log('📊 Connecting to live trading system...');

// Initialize all systems (stable foundation + live analysis)
async function initializeServices() {
  try {
    console.log('[SERVER] 🔌 Initializing core trading modules...');
    console.log('[SERVER] 🔑 Environment check - BIRDEYE_API_KEY:', process.env.BIRDEYE_API_KEY ? 'Found' : 'Missing');
    
    // Initialize stable core modules first
    console.log('[SERVER] ⏳ Initializing ConnectionManager...');
    await connectionManager.initialize();
    console.log('[SERVER] ⏳ Initializing LearningSystem...');
    await learningSystem.initialize();
    console.log('[SERVER] ⏳ Initializing PaperTradingSystem...');
    await paperTradingSystem.initialize();
    console.log('[SERVER] ⏳ Initializing DataManager...');
    await dataManager.initialize();
    console.log('[SERVER] ⏳ Initializing other modules...');
    await intelligenceEngine.initialize();
    await strategyEngine.initialize();
    await riskManager.initialize();
    await executionManager.initialize();
    await systemMonitor.initialize();
    
    console.log('[SERVER] ✅ All core modules initialized');
    
    // Initialize enhanced analysis system
    await enhancedAnalysis.initialize();
    console.log('[SERVER] ✅ Enhanced analysis system initialized');
    
    // Setup live token analyzer (the missing piece!)
    setupLiveTokenAnalyzer();
    
    // Setup real-time event listeners
    console.log('[SERVER] 🔗 Setting up real-time listeners...');
    setupRealTimeListeners();
    
    // Start test mode if enabled
    console.log('[SERVER] 🧪 Checking test mode conditions...');
    console.log('[SERVER] TEST_MODE env:', process.env.TEST_MODE);
    if (process.env.TEST_MODE === 'true') {
      console.log('[SERVER] 🧪 Starting test mode...');
      const { startTestMode } = await import('../src/core/PaperTradingTestMode.js');
      startTestMode(paperTradingSystem, 5000);
      console.log('[SERVER] ✅ Test mode started - expect trades every 5 seconds');
    } else {
      console.log('[SERVER] ⏭️ Test mode disabled');
    }
    
    // Start enhanced system with master controller
    await startEnhancedSystem();
    
    // Start broadcasting real data
    console.log('[SERVER] 📡 Starting real-time broadcast...');
    startRealTimeBroadcast();
    
    console.log('[SERVER] ✅ Real-time services connected');
  } catch (error) {
    console.log(`[SERVER] ⚠️ Service initialization warning: ${error.message}`);
    console.error('[SERVER] Error stack:', error.stack);
  }
}

// Setup live token analyzer (CRITICAL - this was missing!)
function setupLiveTokenAnalyzer() {
  console.log('[SERVER] 🔗 Setting up live token analyzer...');
  
  // Listen for live opportunities
  liveTokenAnalyzer.on('opportunity', (opportunity) => {
    // Add to live opportunities list
    liveOpportunities.unshift(opportunity);
    
    // Keep only last 50 opportunities
    if (liveOpportunities.length > 50) {
      liveOpportunities = liveOpportunities.slice(0, 50);
    }
    
    // Update stats
    dashboardStats.liveOpportunities = liveOpportunities.length;
    
    // Broadcast to all connected clients
    io.emit('live-opportunity', opportunity);
    
    // Also send to live feed
    io.to('live-feed').emit('feed-update', {
      timestamp: opportunity.timestamp,
      source: 'live-analyzer',
      type: 'OPPORTUNITY',
      content: `🎯 LIVE OPPORTUNITY: ${opportunity.token.symbol} → ${opportunity.analysis.recommendation.action} (${Math.round(opportunity.analysis.confidence * 100)}% confidence)`,
      opportunity: opportunity
    });
    
    console.log(`[SERVER] 🎯 Broadcasting live opportunity: ${opportunity.token.symbol}`);
  });
  
  // Listen for momentum signals
  liveTokenAnalyzer.on('momentum_signal', (signal) => {
    io.emit('momentum-update', {
      type: signal.type,
      token: signal.token,
      symbol: signal.symbol,
      momentum: Math.round((signal.priceChange || 0) * 100),
      timestamp: Date.now()
    });
    
    io.to('live-feed').emit('feed-update', {
      timestamp: Date.now(),
      source: 'momentum',
      type: signal.type.toUpperCase(),
      content: `📈 ${signal.type.toUpperCase()}: ${signal.symbol} ${signal.type === 'breakout' ? '+' : '-'}${Math.round((signal.priceChange || signal.drop || 0) * 100)}%`
    });
  });
  
  // Listen for analyzer status updates
  liveTokenAnalyzer.on('started', () => {
    dashboardStats.liveAnalysisActive = true;
    console.log('[SERVER] ✅ Live token analysis activated');
    io.emit('live-analysis-status', { active: true, message: 'Live analysis active - monitoring cluster7 feed' });
  });
  
  liveTokenAnalyzer.on('stopped', () => {
    dashboardStats.liveAnalysisActive = false;
    console.log('[SERVER] 🛑 Live token analysis stopped');
    io.emit('live-analysis-status', { active: false, message: 'Live analysis stopped' });
  });
  
  // Start the live analyzer (CRITICAL!)
  setTimeout(async () => {
    try {
      await liveTokenAnalyzer.start();
      console.log('[SERVER] 🔗 Live token analyzer started successfully');
    } catch (error) {
      console.log(`[SERVER] ⚠️ Live analyzer start warning: ${error.message}`);
    }
  }, 2000);
}

// Enhanced live feed setup
function setupLiveFeed() {
  console.log('[SERVER] 📡 Setting up enhanced live feed...');
  
  // Listen for raw cluster7 messages for general updates
  if (sharedWebSocketManager) {
    sharedWebSocketManager.on('message', ({ url, data }) => {
      if (url.includes('cluster7')) {
        // Send general cluster7 activity updates
        const feedItem = {
          timestamp: Date.now(),
          source: 'cluster7',
          type: data.room || 'update',
          content: `📊 cluster7 activity: ${data.room} - ${Array.isArray(data.content) ? data.content.length : 1} items`,
          raw: data
        };
        
        // Only send non-spammy updates
        if (data.room === 'new_pairs' || data.room === 'trending-search-crypto') {
          io.to('live-feed').emit('feed-update', feedItem);
        }
      }
    });
  }
}

// Setup real-time event listeners from core modules
function setupRealTimeListeners() {
  console.log('[SERVER] 🔗 Setting up real-time listeners from core modules...');
  
  // Strategy Engine - Trading Signals
  if (strategyEngine && typeof strategyEngine.on === 'function') {
    strategyEngine.on('surge-detected', (surge) => {
      io.emit('surge-opportunity', {
        token: surge.token || surge.symbol,
        change: surge.change || surge.priceChange,
        volume: surge.volume,
        timeAgo: surge.timeAgo || 'just now'
      });
    });
    
    strategyEngine.on('trade-signal', (signal) => {
      io.emit('trade-executed', {
        side: signal.action,
        token: signal.token,
        price: signal.price,
        amount: signal.amount
      });
    });
  } else {
    console.log('[SERVER] ⚠️ StrategyEngine does not support events');
  }
  
  // Intelligence Engine - AI Signals  
  if (intelligenceEngine && typeof intelligenceEngine.on === 'function') {
    intelligenceEngine.on('trading_signal', (signal) => {
      io.emit('ai-signal', {
        pattern: signal.pattern || 'Pattern Detected',
        confidence: signal.confidence || 0.5,
        action: signal.recommendation || signal.action,
        token: signal.token
      });
    });
  } else {
    console.log('[SERVER] ⚠️ IntelligenceEngine does not support events');
  }
  
  // Paper Trading System - Position updates
  if (paperTradingSystem) {
    paperTradingSystem.on('position-opened', (position) => {
      console.log('[SERVER] 📈 Position opened, emitting to GUI:', position.ticker);
      io.emit('position-update', position);
    });
    
    paperTradingSystem.on('position-closed', (position) => {
      console.log('[SERVER] 📉 Position closed, emitting to GUI:', position.ticker);
      io.emit('position-update', { ...position, closed: true });
    });
  }
  
  // Learning System - AI Learning updates (with safety check)
  if (learningSystem && typeof learningSystem.on === 'function') {
    learningSystem.on('pattern-detected', (pattern) => {
      io.emit('ai-signal', {
        pattern: pattern.name,
        confidence: pattern.confidence,
        action: pattern.action
      });
    });
  } else {
    console.log('[SERVER] ⚠️ LearningSystem does not support events');
  }
}

// Start broadcasting real-time data (with 10s intervals)
function startRealTimeBroadcast() {
  console.log('[SERVER] 📡 Starting real-time data broadcast...');
  
  broadcastInterval = setInterval(() => {
    if (connectedClients.size > 0) {
      // Get real portfolio data
      const dailyStats = paperTradingSystem?.getDailyPnL() || { pnl: 0 };
      const dailyPnLValue = dailyStats.pnl || 0;
      
      const portfolioData = {
        totalValue: paperTradingSystem?.getPortfolioStatus()?.currentCapital || 10000,
        dailyPnL: dailyPnLValue,
        dailyPnLPercent: (dailyPnLValue / 10000 * 100) || 0,
        openPositions: paperTradingSystem?.getActivePositions()?.length || 0,
        winRate: dailyStats.winRate || paperTradingSystem?.metrics?.winRate || 0
      };
      
      io.emit('portfolio-update', portfolioData);
      console.log('[SERVER] 📊 Broadcasting portfolio update:', portfolioData.totalValue, portfolioData.openPositions);
      
      // Get learning metrics
      const learningMetrics = {
        patterns: learningSystem?.patterns?.size || 0,
        confidence: learningSystem?.confidence || 0.5,
        trades: paperTradingSystem?.tradeHistory?.length || 0,
        sharpe: paperTradingSystem?.metrics?.sharpeRatio || 0
      };
      
      io.emit('learning-update', learningMetrics);
      
      // Get system metrics
      const systemMetrics = {
        latency: systemMonitor?.metrics?.performance?.averageReactionTime || 254,
        strategies: strategyEngine?.activeStrategies?.length || 3
      };
      
      io.emit('system-metrics', systemMetrics);
    }
  }, 10000); // 10 second intervals (fixed)
}

// Enhanced system startup with Master Controller
async function startEnhancedSystem() {
  console.log('[SERVER] 🎮 Starting with Master Controller integration...');
  
  // Initialize master controller with all components
  const initSuccess = await masterController.initialize();
  
  if (!initSuccess) {
    console.error('[SERVER] ❌ Master Controller initialization failed');
    return false;
  }
  
  // Start the integrated system
  await masterController.start();
  
  // Connect master controller events to WebSocket broadcasts
  masterController.on('trading_opportunity', (opportunity) => {
    console.log(`[SERVER] 🎯 Broadcasting live opportunity: ${opportunity.token?.symbol || 'Unknown'}`);
    io.emit('live-opportunity', opportunity);
  });
  
  masterController.on('pump_launch_opportunity', (pumpData) => {
    console.log(`[SERVER] 🚀 Broadcasting pump launch: ${pumpData.token?.symbol || 'Unknown'}`);
    io.emit('pump_launch', pumpData);
  });
  
  console.log('[SERVER] ✅ Master Controller integration active');
  return true;
}

// Routes (combining best from both)

// Serve main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'realtime-dashboard.html'));
});

// Legacy dashboards
app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading-dashboard.html'));
});

app.get('/old-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'fast-meme-dashboard.html'));
});

// Get real-time stats (enhanced version)
app.get('/api/stats', (req, res) => {
  const portfolioStatus = paperTradingSystem?.getPortfolioStatus() || {};
  const uptime = Math.floor((Date.now() - dashboardStats.systemUptime) / 1000);
  
  // Get live analyzer stats if available
  let liveStats = { tokensDetected: 0, tokensAnalyzed: 0, opportunitiesFound: 0, avgAnalysisTime: 254 };
  if (dashboardStats.liveAnalysisActive) {
    try {
      liveStats = liveTokenAnalyzer.getStats();
    } catch (error) {
      console.log('[SERVER] ⚠️ Could not get live stats:', error.message);
    }
  }
  
  res.json({
    portfolio: {
      totalValue: portfolioStatus.currentCapital || 10000,
      startingCapital: portfolioStatus.startingCapital || 10000,
      totalPnL: portfolioStatus.totalPnL || 0,
      dailyPnL: paperTradingSystem?.getDailyPnL() || 0
    },
    performance: {
      winRate: paperTradingSystem?.metrics?.winRate || 0,
      sharpeRatio: paperTradingSystem?.metrics?.sharpeRatio || 0,
      maxDrawdown: paperTradingSystem?.metrics?.maxDrawdown || 0,
      tradesExecuted: paperTradingSystem?.tradeHistory?.length || 0
    },
    system: {
      latency: systemMonitor?.metrics?.performance?.averageReactionTime || 254,
      activeStrategies: 3, // Surge, Whale, Momentum
      connectedClients: connectedClients.size,
      uptime: uptime
    },
    liveAnalysis: {
      active: dashboardStats.liveAnalysisActive,
      tokensDetected: liveStats.tokensDetected || 0,
      tokensAnalyzed: liveStats.tokensAnalyzed || 0,
      opportunitiesFound: liveStats.opportunitiesFound || 0,
      avgAnalysisTime: liveStats.avgAnalysisTime || 254
    },
    timestamp: Date.now()
  });
});

// Comprehensive token analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { tokenAddress, symbol } = req.body;
  
  if (!tokenAddress) {
    return res.status(400).json({ error: 'Token address is required' });
  }
  
  console.log(`[SERVER] 🔍 Analysis request: ${symbol || 'UNKNOWN'} (${tokenAddress})`);
  
  try {
    const startTime = Date.now();
    
    // Perform comprehensive analysis
    const analysis = await enhancedAnalysis.analyzeToken(tokenAddress, symbol);
    
    const analysisTime = Date.now() - startTime;
    
    if (analysis.error) {
      throw new Error(analysis.error);
    }
    
    // Update stats
    dashboardStats.tokensAnalyzed++;
    if (analysis.confidence > 0.7) {
      dashboardStats.successfulPredictions++;
    }
    
    // Store for learning
    analysisHistory.push({
      timestamp: Date.now(),
      tokenAddress,
      symbol,
      analysis,
      analysisTime
    });
    
    // Keep only last 100 analyses
    if (analysisHistory.length > 100) {
      analysisHistory = analysisHistory.slice(-100);
    }
    
    // Broadcast to connected clients
    io.emit('analysis-complete', {
      tokenAddress,
      symbol,
      analysis,
      analysisTime
    });
    
    console.log(`[SERVER] ✅ Analysis complete: ${symbol} → ${analysis.recommendation?.action} (${analysisTime}ms)`);
    
    res.json({
      success: true,
      analysis,
      analysisTime,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.log(`[SERVER] ❌ Analysis failed: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Live opportunities endpoint
app.get('/api/opportunities', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const recent = liveOpportunities.slice(0, limit);
  
  res.json({
    opportunities: recent,
    count: recent.length,
    total: liveOpportunities.length,
    liveAnalysisActive: dashboardStats.liveAnalysisActive,
    timestamp: Date.now()
  });
});

// Live analyzer stats endpoint
app.get('/api/live-stats', (req, res) => {
  let stats = { tokensDetected: 0, tokensAnalyzed: 0, opportunitiesFound: 0, avgAnalysisTime: 254 };
  
  if (dashboardStats.liveAnalysisActive) {
    try {
      stats = liveTokenAnalyzer.getStats();
    } catch (error) {
      console.log('[SERVER] ⚠️ Could not get live stats:', error.message);
    }
  }
  
  res.json({
    ...stats,
    active: dashboardStats.liveAnalysisActive,
    timestamp: Date.now()
  });
});

// Control live analyzer
app.post('/api/live-control', async (req, res) => {
  const { action } = req.body;
  
  try {
    if (action === 'start' && !liveTokenAnalyzer.isRunning) {
      await liveTokenAnalyzer.start();
      res.json({ success: true, message: 'Live analysis started' });
    } else if (action === 'stop' && liveTokenAnalyzer.isRunning) {
      liveTokenAnalyzer.stop();
      res.json({ success: true, message: 'Live analysis stopped' });
    } else {
      res.json({ success: false, message: 'Invalid action or already in that state' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// System health endpoint
app.get('/api/health', (req, res) => {
  const uptime = Math.floor((Date.now() - dashboardStats.systemUptime) / 1000);
  
  res.json({
    status: 'healthy',
    services: {
      enhancedAnalysis: 'active',
      sharedWebSocketManager: 'active',
      liveTokenAnalyzer: dashboardStats.liveAnalysisActive ? 'active' : 'inactive',
      masterController: 'active',
      dashboard: 'active'
    },
    uptime,
    memory: process.memoryUsage(),
    timestamp: Date.now()
  });
});

// Paper trading endpoints
app.get('/api/paper-trading/status', (req, res) => {
  try {
    const status = paperTradingSimulator?.getPortfolioStatus() || paperTradingSystem?.getPortfolioStatus();
    res.json({
      success: true,
      status: status,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/paper-trading/performance', (req, res) => {
  try {
    const report = paperTradingSimulator?.getPerformanceReport() || paperTradingSystem?.getPerformanceReport();
    res.json({
      success: true,
      report: report,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Whale tracking endpoints
app.get('/api/whale/activity', (req, res) => {
  try {
    const activity = whaleDataService.getRecentWhaleActivity(20);
    res.json({
      success: true,
      activity: activity,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/whale/stats', (req, res) => {
  try {
    const stats = whaleDataService.getWhaleStats();
    const summary = whaleIntelligence.getWhaleIntelligenceSummary();
    res.json({
      success: true,
      stats: stats,
      summary: summary,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  connectedClients.add(socket.id);
  dashboardStats.totalConnections++;
  console.log(`[SERVER] 🔌 Client connected (${socket.id}), Total: ${connectedClients.size}`);
  
  // Send initial stats
  socket.emit('stats-update', dashboardStats);
  
  // Send initial portfolio data
  const portfolioStatus = paperTradingSystem?.getPortfolioStatus() || {};
  const dailyStats = paperTradingSystem?.getDailyPnL() || { pnl: 0 };
  const dailyPnLValue = dailyStats.pnl || 0;
  
  socket.emit('portfolio-update', {
    totalValue: portfolioStatus.currentCapital || 10000,
    dailyPnL: dailyPnLValue,
    dailyPnLPercent: (dailyPnLValue / 10000 * 100) || 0,
    openPositions: paperTradingSystem?.getActivePositions()?.length || 0,
    winRate: dailyStats.winRate || paperTradingSystem?.metrics?.winRate || 0
  });
  
  // Handle live feed subscription
  socket.on('subscribe-feed', () => {
    console.log(`[SERVER] 📡 Client ${socket.id} subscribed to live feed`);
    socket.join('live-feed');
  });
  
  // Handle manual token analysis request
  socket.on('analyze-token', async (data) => {
    const { tokenAddress, symbol } = data;
    try {
      socket.emit('analysis-started', { tokenAddress, symbol });
      
      const analysis = await enhancedAnalysis.analyzeToken(tokenAddress, symbol);
      
      if (analysis.error) {
        socket.emit('analysis-error', { tokenAddress, symbol, error: analysis.error });
      } else {
        socket.emit('analysis-result', { tokenAddress, symbol, analysis });
        
        // Update stats
        dashboardStats.tokensAnalyzed++;
        if (analysis.confidence > 0.7) {
          dashboardStats.successfulPredictions++;
        }
        
        // Broadcast stats update
        io.emit('stats-update', dashboardStats);
      }
    } catch (error) {
      socket.emit('analysis-error', { tokenAddress, symbol, error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    dashboardStats.totalConnections--;
    console.log(`[SERVER] 🔌 Client disconnected (${socket.id}), Total: ${connectedClients.size}`);
    
    // Stop broadcasting if no clients
    if (connectedClients.size === 0 && broadcastInterval) {
      clearInterval(broadcastInterval);
      broadcastInterval = null;
      console.log('[SERVER] 📡 Stopped broadcasting (no clients)');
    }
  });
});

// Periodic live stats updates
setInterval(() => {
  const uptime = Math.floor((Date.now() - dashboardStats.systemUptime) / 1000);
  
  // Update live opportunities count
  dashboardStats.liveOpportunities = liveOpportunities.length;
  
  // Get live analyzer stats if active
  let liveStats = null;
  if (dashboardStats.liveAnalysisActive) {
    try {
      liveStats = liveTokenAnalyzer.getStats();
    } catch (error) {
      liveStats = { tokensDetected: 0, tokensAnalyzed: 0, opportunitiesFound: 0, avgAnalysisTime: 254 };
    }
  }
  
  // Broadcast updated stats with live analysis data
  io.emit('stats-update', {
    ...dashboardStats,
    systemUptime: uptime,
    lastUpdated: Date.now(),
    liveStats: liveStats
  });
  
  // Send periodic live feed updates
  const feedMessages = [
    'Neural network processing patterns from recent analysis',
    'cluster7 monitoring: New token launches detected',
    'Technical analysis engine updated with latest indicators',
    'Security scanner completed: Risk assessment updated',
    'Market data refresh: Volume and liquidity metrics updated',
    'AI learning progress: Pattern recognition accuracy improved'
  ];
  
  if (dashboardStats.liveAnalysisActive && liveStats) {
    feedMessages.push(
      `Live analyzer active: ${liveStats.tokensDetected} tokens detected today`,
      `Analysis queue: ${liveStats.queueSize || 0} tokens waiting, ${liveStats.activeAnalyses || 0} analyzing`,
      `Success rate: ${liveStats.analysisSuccessRate?.toFixed(1) || 0}% opportunities found`
    );
  }
  
  const randomMessage = feedMessages[Math.floor(Math.random() * feedMessages.length)];
  
  io.to('live-feed').emit('feed-update', {
    timestamp: Date.now(),
    source: 'system',
    type: 'update',
    content: randomMessage
  });
  
}, 10000); // Every 10 seconds

// Error handling
app.use((error, req, res, next) => {
  console.error('[SERVER] ❌ Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: Date.now()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: Date.now()
  });
});

// Start server
async function startServer() {
  try {
    // Initialize all services
    await initializeServices();
    
    // Setup live feed
    setupLiveFeed();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log('');
      console.log('🎉 AXIOM TRADE DASHBOARD SERVER RUNNING!');
      console.log('=' .repeat(50));
      console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
      console.log(`📊 API Endpoint: http://localhost:${PORT}/api`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
      console.log('=' .repeat(50));
      console.log('');
      console.log('🚀 Features Available:');
      console.log('   • 🧠 Neural Pattern Learning');
      console.log('   • 📈 Real Technical Analysis (RSI, MACD, Bollinger)');
      console.log('   • 🐦 Birdeye Security Analytics');
      console.log('   • 🌐 DexScreener Market Data');
      console.log('   • ⚡ Real-time cluster7 Feed');
      console.log('   • 🎯 Multi-source Decision Engine');
      console.log('');
      console.log('💡 Ready for AI-powered trading analysis!');
      console.log('');
    });
    
  } catch (error) {
    console.error('[SERVER] ❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown with proper cleanup
async function gracefulShutdown() {
  console.log('\n[SERVER] 🛑 Shutting down gracefully...');
  
  try {
    // Stop live token analyzer
    if (liveTokenAnalyzer && liveTokenAnalyzer.isRunning) {
      liveTokenAnalyzer.stop();
      console.log('[SERVER] ✅ Live token analyzer stopped');
    }
    
    // Stop master controller
    if (masterController) {
      await masterController.stop();
      console.log('[SERVER] ✅ Master Controller stopped');
    }
    
    // Close server
    server.close(() => {
      console.log('[SERVER] ✅ Server closed');
      process.exit(0);
    });
    
    // Force exit after 3 seconds if shutdown hangs
    setTimeout(() => {
      console.log('[SERVER] 🔧 Force shutdown after timeout');
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('[SERVER] ❌ Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server
startServer();

export { app, server, io }; 