import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * Ultra-Fast Data Processor
 * Handles the massive, dense WebSocket data streams from Axiom
 * Built for Auckland speed advantage - processes 1000+ messages/second
 */
export class UltraFastDataProcessor extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.messageQueue = [];
    this.processing = false;
    this.stats = {
      messagesReceived: 0,
      messagesProcessed: 0,
      bytesReceived: 0,
      startTime: Date.now(),
      errors: 0
    };
    this.logger = console;
    
    // High-speed processing configuration
    this.batchSize = 50; // Process 50 messages at once
    this.processInterval = 10; // Process every 10ms for ultra-low latency
    this.maxQueueSize = 10000; // Prevent memory overflow
  }

  async init() {
    this.logger.log('⚡ ULTRA-FAST DATA PROCESSOR INITIALIZING');
    this.logger.log('🚀 Optimized for dense, high-speed data streams');
    
    // Start ultra-fast message processing
    this.startMessageProcessor();
    
    this.logger.log('✅ Ultra-fast processor ready for Auckland advantage!');
  }

  async connectToCluster() {
    // Get fresh tokens from environment
    const fs = await import('fs');
    const dotenv = await import('dotenv');
    
    // Load fresh tokens from .env.dev
    const envConfig = dotenv.config({ path: '.env.dev' });
    
    const accessToken = process.env.AXIOM_ACCESS_TOKEN;
    const refreshToken = process.env.AXIOM_REFRESH_TOKEN;
    
    if (!accessToken || !refreshToken) {
      throw new Error('Missing authentication tokens in .env.dev');
    }
    
    this.logger.log('[ULTRA-FAST] 🔌 Connecting to cluster7.axiom.trade...');
    
    const ws = new WebSocket('wss://cluster7.axiom.trade/?', {
      headers: {
        'Origin': 'https://axiom.trade',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Cookie': `auth-access-token=${accessToken}; auth-refresh-token=${refreshToken}`
      },
      perMessageDeflate: true // Enable compression for speed
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        this.logger.log('[ULTRA-FAST] ✅ Connected to cluster7!');
        
        // Store connection
        this.connections.set('cluster7', ws);
        
        // Set up ultra-fast message handling
        ws.on('message', (data) => this.queueMessage('cluster7', data));
        ws.on('error', (error) => this.handleError('cluster7', error));
        ws.on('close', () => this.handleClose('cluster7'));
        
        // No subscriptions needed - data flows automatically
        this.logger.log('[ULTRA-FAST] 📡 Data stream active - processing at maximum speed');
        
        resolve(ws);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  queueMessage(source, data) {
    try {
      this.stats.messagesReceived++;
      this.stats.bytesReceived += data.length;
      
      // Parse message immediately for speed
      const messageText = data.toString();
      let parsedMessage;
      
      try {
        parsedMessage = JSON.parse(messageText);
      } catch (parseError) {
        // Handle non-JSON messages
        parsedMessage = { raw: messageText, source, timestamp: Date.now() };
      }
      
      // Add to high-speed queue
      this.messageQueue.push({
        source,
        data: parsedMessage,
        raw: messageText,
        timestamp: Date.now(),
        size: data.length
      });
      
      // Prevent queue overflow
      if (this.messageQueue.length > this.maxQueueSize) {
        this.messageQueue.shift(); // Remove oldest message
      }
      
    } catch (error) {
      this.stats.errors++;
      this.logger.log('[ULTRA-FAST] ⚠️ Error queuing message:', error.message);
    }
  }

  startMessageProcessor() {
    if (this.processing) return;
    
    this.processing = true;
    this.logger.log('[ULTRA-FAST] 🚀 Starting ultra-fast message processor...');
    
    setInterval(() => {
      this.processBatch();
    }, this.processInterval);
  }

  processBatch() {
    if (this.messageQueue.length === 0) return;
    
    // Process messages in batches for maximum speed
    const batch = this.messageQueue.splice(0, this.batchSize);
    
    batch.forEach(message => {
      try {
        this.processMessage(message);
        this.stats.messagesProcessed++;
      } catch (error) {
        this.stats.errors++;
        this.logger.log('[ULTRA-FAST] ❌ Error processing message:', error.message);
      }
    });
  }

  processMessage(message) {
    const { data, source, timestamp, size } = message;
    
    if (!data || !data.room) return;
    
    // Ultra-fast message routing based on room type
    switch (data.room) {
      case 'jito-bribe-fee':
        this.emit('mev_fee', {
          type: 'jito_bribe',
          fee: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'sol-priority-fee':
        this.emit('priority_fee', {
          type: 'solana_priority',
          fee: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'block_hash':
        this.emit('new_block', {
          blockHash: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'sol_price':
        this.emit('price_update', {
          token: 'SOL',
          price: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'eth_price':
        this.emit('price_update', {
          token: 'ETH', 
          price: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'btc_price':
        this.emit('price_update', {
          token: 'BTC',
          price: data.content,
          timestamp,
          source: 'cluster7'
        });
        break;
        
      case 'connection_monitor':
        this.emit('heartbeat', {
          timestamp: data.content,
          source: 'cluster7'
        });
        break;
        
      case 'update_pulse_v2':
        // Handle massive token update messages
        this.processTokenUpdates(data.content, timestamp);
        break;
        
      default:
        // Handle token-specific rooms (b-<token_address>)
        if (data.room.startsWith('b-')) {
          const tokenAddress = data.room.substring(2);
          this.emit('token_price', {
            token: tokenAddress,
            price: data.content,
            timestamp,
            source: 'cluster7'
          });
        } else {
          // Unknown room - emit for investigation
          this.emit('unknown_data', {
            room: data.room,
            content: data.content,
            timestamp,
            source: 'cluster7'
          });
        }
        break;
    }
  }

  processTokenUpdates(content, timestamp) {
    try {
      // Handle large token update arrays
      if (Array.isArray(content)) {
        content.forEach(update => {
          if (typeof update === 'string') {
            // Parse token update string
            const parts = update.split(',');
            if (parts.length >= 2) {
              this.emit('token_update', {
                token: parts[0],
                data: parts.slice(1),
                timestamp,
                source: 'cluster7'
              });
            }
          }
        });
      }
    } catch (error) {
      this.logger.log('[ULTRA-FAST] ⚠️ Error processing token updates:', error.message);
    }
  }

  handleError(source, error) {
    this.stats.errors++;
    this.logger.log(`[ULTRA-FAST] ❌ ${source} error:`, error.message);
    
    // Emit error for handling
    this.emit('connection_error', { source, error: error.message });
  }

  handleClose(source) {
    this.logger.log(`[ULTRA-FAST] 🔌 ${source} connection closed`);
    this.connections.delete(source);
    
    // Emit close event
    this.emit('connection_closed', { source });
    
    // Auto-reconnect after 5 seconds
    setTimeout(() => {
      this.logger.log(`[ULTRA-FAST] 🔄 Reconnecting to ${source}...`);
      if (source === 'cluster7') {
        this.connectToCluster().catch(error => {
          this.logger.log('[ULTRA-FAST] ❌ Reconnection failed:', error.message);
        });
      }
    }, 5000);
  }

  getStats() {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const messagesPerSecond = this.stats.messagesReceived / runtime;
    const bytesPerSecond = this.stats.bytesReceived / runtime;
    
    return {
      ...this.stats,
      runtime: Math.round(runtime),
      messagesPerSecond: Math.round(messagesPerSecond),
      bytesPerSecond: Math.round(bytesPerSecond),
      queueSize: this.messageQueue.length,
      activeConnections: this.connections.size
    };
  }

  logStats() {
    const stats = this.getStats();
    this.logger.log(`[ULTRA-FAST] 📊 STATS: ${stats.messagesReceived} msgs (${stats.messagesPerSecond}/sec) | ${(stats.bytesReceived/1024/1024).toFixed(1)}MB | Queue: ${stats.queueSize} | Errors: ${stats.errors}`);
  }
}

export const ultraFastProcessor = new UltraFastDataProcessor(); 